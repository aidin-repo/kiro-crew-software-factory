"""Software Factory backend: the control room for the label-driven delivery pipeline.

Observes, never dispatches. Three sources are joined into one picture:

* GitHub (via ``gh``): issues carrying ``kiro-*`` labels, their ``kiro/issue-N``
  pull requests, workflow runs of the events workflow, self-hosted runners.
* Kiro Crew webhook runs (``~/.kiro/crew/webhook_runs.json``): which template ran
  for which hop, outcome and duration. The gateway keeps the last 50; this backend
  copies every run it sees into its own ledger so history survives.
* Agent sessions (``~/.kiro/crew/session_map.json`` -> ``~/.kiro/sessions/*/sess_*``):
  model, status, credits, tool calls and the transcript steps of each hop, so a run
  can be watched while it happens.

Routes (reached through the gateway proxy at ``/apps/software-factory/api/...``):

* ``GET /health``
* ``GET /api/state``                 full snapshot (board, runs, agents, stats, infra)
* ``GET /api/runs/<run_id>/steps``   transcript steps for one run
* ``GET /api/config`` / ``POST /api/config``   the watched repository

Stdlib only. Run by the gateway with ``PORT`` set; binds loopback only.
"""
from __future__ import annotations

import glob
import json
import os
import re
import statistics
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any

PORT = int(os.environ.get("PORT", 9100))
#: Board cards shown by default: the N items with the most recent activity. 0 = all.
BOARD_LIMIT = int(os.environ.get("SOFTWARE_FACTORY_BOARD_LIMIT", 20))
APP_NAME = os.environ.get("KIROCREW_APP_NAME", "software-factory")
APP_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("SOFTWARE_FACTORY_DATA", APP_ROOT / "data"))
CREW_HOME = Path(os.environ.get("KIROCREW_HOME", Path.home() / ".kiro" / "crew"))
KIRO_SESSIONS = Path.home() / ".kiro" / "sessions"
DEFAULT_REPO = os.environ.get("FACTORY_REPO", "aidin-repo/task-chatbot")
CACHE_TTL = 12.0  # seconds between GitHub refreshes
GH_TIMEOUT = 25

# ---------------------------------------------------------------------------
# Pipeline vocabulary (mirrors templates/scripts/dispatch_kiro_event.py)
# ---------------------------------------------------------------------------

STAGES = [
    ("planning", "Planning", "delivery-planner"),
    ("needs-owner", "Needs owner", None),
    ("implementing", "Implementing", "delivery-implementer"),
    ("review", "In review", "delivery-reviewer"),
    ("fixing", "Fixing", "delivery-implementer"),
    ("gate", "Gate", "pr-gate"),
    ("ready", "Ready to merge", None),
    ("parked", "Parked", None),
    ("shipped", "Shipped", "delivery-scribe"),
]
STAGE_IDS = [s[0] for s in STAGES]

KIND_TO_AGENT = {
    "issue-plan": "delivery-planner",
    "issue-deliver": "delivery-planner",
    "issue-implement": "delivery-implementer",
    "issue-approved": "delivery-implementer",
    "pr-changes": "delivery-implementer",
    "pr-review": "delivery-reviewer",
    "pr-review-round": "delivery-reviewer",
    "pr-merged": "delivery-scribe",
    "issue-task": "github-worker",
    "pr-gate": "pr-gate",
}
AGENTS = [
    ("delivery-planner", "Planner", "Writes the AIDLC spec comment"),
    ("delivery-implementer", "Implementer", "Builds inside the files block, opens the PR"),
    ("delivery-reviewer", "Reviewer", "Independent review, VERDICT comment"),
    ("delivery-scribe", "Scribe", "Docs PR after merge"),
    ("github-worker", "Worker", "Fast lane: kiro-task"),
]
LIFECYCLE_LABELS = {
    "kiro-plan", "kiro-deliver", "kiro-approved", "kiro-needs-owner", "kiro-review",
    "kiro-changes-requested", "kiro-ready", "kiro-ready-to-merge", "kiro-parked",
    "kiro-task",
}
HOOK_RE = re.compile(r"^github:(?P<kind>[a-z-]+):(?P<owner>[^:]+):(?P<repo>[^:]+):(?P<run>\d+):(?P<attempt>\d+)$")
BRANCH_RE = re.compile(r"^kiro/(?:issue|docs-pr)-(\d+)$")
ISSUE_REF_RE = re.compile(r"(?:issue|#)\s*(\d+)", re.I)

# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------


def _read_json(path: Path, default: Any) -> Any:
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return default


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=1)
    os.replace(tmp, path)


def _gh(args: list[str], repo: str | None = None) -> Any:
    cmd = ["gh", *args]
    if repo and args[0] in ("issue", "pr"):
        cmd += ["--repo", repo]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=GH_TIMEOUT, check=False)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise RuntimeError(f"gh {' '.join(args[:2])}: {exc}") from exc
    if out.returncode != 0:
        raise RuntimeError((out.stderr or out.stdout).strip()[:300] or f"gh exit {out.returncode}")
    return json.loads(out.stdout) if out.stdout.strip() else None


def _iso_to_ts(value: str | None) -> float | None:
    if not value:
        return None
    try:
        from datetime import datetime, timezone

        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc).timestamp()
    except ValueError:
        return None


def _label_names(item: dict[str, Any]) -> set[str]:
    return {lab.get("name", "") for lab in item.get("labels", []) if isinstance(lab, dict)}


# ---------------------------------------------------------------------------
# Config and ledger
# ---------------------------------------------------------------------------


class Config:
    def __init__(self) -> None:
        self.path = DATA_DIR / "config.json"
        data = _read_json(self.path, {})
        self.repo: str = data.get("repo") or DEFAULT_REPO

    def save(self) -> None:
        _write_json(self.path, {"repo": self.repo})


class RunLedger:
    """Every webhook run ever seen for the watched repo, keyed by run id."""

    def __init__(self) -> None:
        self.path = DATA_DIR / "runs_ledger.json"
        self.runs: dict[str, dict[str, Any]] = _read_json(self.path, {})

    def absorb(self, records: list[dict[str, Any]]) -> None:
        changed = False
        for rec in records:
            rid = rec.get("id")
            if rid and rid not in self.runs:
                self.runs[rid] = rec
                changed = True
        if changed:
            _write_json(self.path, self.runs)


# ---------------------------------------------------------------------------
# Session store access (read-only)
# ---------------------------------------------------------------------------


class Sessions:
    """Resolve hook session keys to kiro-cli session directories and summarise them."""

    def __init__(self) -> None:
        self._dir_cache: dict[str, Path | None] = {}
        self._summary_cache: dict[str, tuple[float, dict[str, Any]]] = {}

    def session_map(self) -> dict[str, Any]:
        return _read_json(CREW_HOME / "session_map.json", {})

    def find_dir(self, sid: str) -> Path | None:
        if sid in self._dir_cache and self._dir_cache[sid] is not None:
            return self._dir_cache[sid]
        hits = glob.glob(str(KIRO_SESSIONS / "*" / sid))
        found = Path(hits[0]) if hits else None
        self._dir_cache[sid] = found
        return found

    def summary(self, session_key: str) -> dict[str, Any] | None:
        entry = self.session_map().get(session_key)
        if not entry:
            return None
        sid = entry.get("sid") or ""
        sdir = self.find_dir(sid)
        if not sdir:
            return {"sid": sid, "found": False}
        try:
            mtime = os.path.getmtime(sdir / "messages.jsonl")
        except OSError:
            mtime = 0.0
        cached = self._summary_cache.get(session_key)
        if cached and cached[0] == mtime:
            return cached[1]
        meta = _read_json(sdir / "session.json", {})
        summ: dict[str, Any] = {
            "sid": sid,
            "found": True,
            "agent": meta.get("agentMode"),
            "model": meta.get("modelId"),
            "effort": meta.get("effortLevel"),
            "status": meta.get("status"),
            "title": meta.get("title"),
            "created_at": _iso_to_ts(meta.get("createdAt")),
            "modified_at": _iso_to_ts(meta.get("lastModifiedAt")) or mtime,
            "tool_calls": 0,
            "tools": {},
            "model_calls": 0,
            "credits": 0.0,
            "elapsed_ms": None,
            "issue": None,
            "pr": None,
            "last_text": "",
            "steps_available": True,
        }
        try:
            with open(sdir / "messages.jsonl", encoding="utf-8") as fh:
                for i, line in enumerate(fh):
                    try:
                        payload = json.loads(line).get("payload", {})
                    except ValueError:
                        continue
                    ptype = payload.get("type")
                    if ptype == "user" and i < 5 and summ["issue"] is None:
                        content = str(payload.get("content", ""))
                        summ["issue"], summ["pr"] = _extract_refs(content)
                    elif ptype == "tool_call":
                        summ["tool_calls"] += 1
                        name = payload.get("toolName") or "tool"
                        summ["tools"][name] = summ["tools"].get(name, 0) + 1
                    elif ptype == "assistant" and payload.get("operationType") != "Reasoning":
                        text = payload.get("content")
                        if isinstance(text, str) and text.strip():
                            summ["last_text"] = text.strip()[-400:]
                    elif ptype == "usage_summary":
                        for turn in payload.get("promptTurnSummaries") or []:
                            try:
                                summ["credits"] += float(turn.get("usage") or 0)
                            except (TypeError, ValueError):
                                pass
                        breakdown = payload.get("contextBreakdown") or {}
                        summ["model_calls"] = int(breakdown.get("modelCalls") or 0)
                        summ["context_chars"] = int(breakdown.get("totalChars") or 0)
                    elif ptype == "assistant" and payload.get("reasoningModelId") and not summ.get("resolved_model"):
                        # The concrete model when kiro-cli names it; "auto" otherwise.
                        summ["resolved_model"] = str(payload["reasoningModelId"]).split("::")[-1]
                        try:
                            summ["elapsed_ms"] = int(payload.get("elapsedTime"))
                        except (TypeError, ValueError):
                            pass
        except OSError:
            summ["steps_available"] = False
        summ["credits"] = round(summ["credits"], 3)
        self._summary_cache[session_key] = (mtime, summ)
        return summ

    def steps(self, session_key: str, limit: int = 400) -> list[dict[str, Any]]:
        entry = self.session_map().get(session_key)
        if not entry:
            return []
        sdir = self.find_dir(entry.get("sid") or "")
        if not sdir:
            return []
        steps: list[dict[str, Any]] = []
        pending: dict[str, dict[str, Any]] = {}
        try:
            with open(sdir / "messages.jsonl", encoding="utf-8") as fh:
                for line in fh:
                    try:
                        rec = json.loads(line)
                    except ValueError:
                        continue
                    payload = rec.get("payload", {})
                    ptype = payload.get("type")
                    ts = rec.get("timestamp")
                    if ptype == "tool_call":
                        args = payload.get("args") or {}
                        detail = ""
                        if isinstance(args, dict):
                            detail = str(args.get("command") or args.get("path") or args.get("query") or "")
                        step = {
                            "t": ts,
                            "kind": "tool",
                            "tool": payload.get("toolName"),
                            "title": payload.get("title") or payload.get("toolName"),
                            "detail": detail[:300],
                            "status": payload.get("status"),
                            "ok": None,
                        }
                        pending[payload.get("toolCallId", "")] = step
                        steps.append(step)
                    elif ptype == "tool_result":
                        step = pending.get(payload.get("toolCallId", ""))
                        if step is not None:
                            step["ok"] = bool(payload.get("success", True))
                    elif ptype == "assistant" and payload.get("operationType") != "Reasoning":
                        text = payload.get("content")
                        if isinstance(text, str) and text.strip():
                            steps.append({"t": ts, "kind": "text", "text": text.strip()[:1200]})
                    elif ptype == "turn_end":
                        steps.append({"t": ts, "kind": "end", "reason": payload.get("stopReason")})
        except OSError:
            return []
        return steps[-limit:]


    def trace(self, session_key: str) -> dict[str, Any]:
        """Fold a hop's transcript into a span tree for the Trace view.

        kiro-cli writes ``tool_call`` and ``tool_result`` together when the result
        arrives, so those two timestamps are equal. The real timing lives in the
        records around them: ``pending_interaction`` (the tool was requested),
        ``interaction_resolved`` (the host approved it) and ``tool_result`` (it
        finished). A model span is the gap from a turn's start, or the previous
        tool's end, to the next tool request or the turn's end; the assistant text
        produced in that gap is its output. Credits are per turn (``usage_summary``),
        never per call, so they sit on the turn span.

        Spans: ``{id, parent, kind, name, start, end, status, meta, input, output}``
        with ``kind`` in ``run | turn | model | tool`` and times as epoch seconds.
        """
        entry = self.session_map().get(session_key)
        if not entry:
            return {"spans": [], "found": False}
        sdir = self.find_dir(entry.get("sid") or "")
        if not sdir:
            return {"spans": [], "found": False}
        spans: list[dict[str, Any]] = []
        turns: dict[str, dict[str, Any]] = {}
        tools: dict[str, dict[str, Any]] = {}
        run_start: float | None = None
        run_end: float | None = None
        cur_turn: str | None = None
        model_open: dict[str, Any] | None = None  # the model span waiting for its end
        model_text: list[str] = []
        seq = 0

        def new_model(turn_id: str, start: float) -> dict[str, Any]:
            nonlocal seq
            seq += 1
            sp = {"id": f"m{seq}", "parent": turn_id, "kind": "model", "name": "model",
                  "start": start, "end": None, "status": "ok", "meta": {}, "input": "", "output": ""}
            spans.append(sp)
            return sp

        def close_model(end: float) -> None:
            nonlocal model_open, model_text
            if model_open is not None:
                model_open["end"] = end
                model_open["output"] = "\n".join(model_text).strip()[:4000]
                model_open = None
                model_text = []

        try:
            with open(sdir / "messages.jsonl", encoding="utf-8") as fh:
                for line in fh:
                    try:
                        rec = json.loads(line)
                    except ValueError:
                        continue
                    p = rec.get("payload", {})
                    t = p.get("type")
                    ts = _iso_to_ts(rec.get("timestamp"))
                    if ts is None:
                        continue
                    run_start = ts if run_start is None else min(run_start, ts)
                    run_end = ts if run_end is None else max(run_end, ts)
                    if t == "turn_start":
                        tid = p.get("turnId") or f"t{len(turns)+1}"
                        cur_turn = tid
                        turns[tid] = {"id": tid, "parent": "run", "kind": "turn", "name": f"turn {len(turns)+1}",
                                      "start": ts, "end": None, "status": "ok",
                                      "meta": {"credits": 0.0, "model_calls": 0, "tools": 0}, "input": "", "output": ""}
                        spans.append(turns[tid])
                        model_open = new_model(tid, ts)
                    elif t == "user" and cur_turn and not turns[cur_turn]["input"]:
                        content = p.get("content")
                        if isinstance(content, str):
                            turns[cur_turn]["input"] = content[:2000]
                    elif t == "assistant":
                        content = p.get("content")
                        if isinstance(content, str) and content.strip() and p.get("operationType") != "Reasoning":
                            model_text.append(content.strip())
                    elif t == "pending_interaction" and p.get("interactionType") == "tool_approval":
                        cid = p.get("toolCallId") or ""
                        if cid in tools:
                            # A second consent round for the same call (the host's
                            # follow-up check); the span already started at the first.
                            continue
                        close_model(ts)
                        seq += 1
                        tools[cid] = {"id": f"c{seq}", "parent": cur_turn or "run", "kind": "tool", "name": "tool",
                                      "start": ts, "approved": None, "end": None, "status": "pending",
                                      "meta": {}, "input": str(p.get("question") or "")[:1500], "output": ""}
                        spans.append(tools[cid])
                    elif t == "interaction_resolved":
                        sp = tools.get(p.get("toolCallId") or "")
                        if sp is not None:
                            if sp.get("approved") is None:
                                sp["approved"] = ts
                            if p.get("selectedOption") not in (None, "accept", "always-accept"):
                                sp["status"] = "denied"
                    elif t == "tool_call":
                        cid = p.get("toolCallId") or ""
                        sp = tools.get(cid)
                        if sp is None:
                            close_model(ts)
                            seq += 1
                            sp = {"id": f"c{seq}", "parent": cur_turn or "run", "kind": "tool", "name": "tool",
                                  "start": ts, "approved": None, "end": None, "status": "pending", "meta": {}, "input": "", "output": ""}
                            tools[cid] = sp
                            spans.append(sp)
                        args = p.get("args") or {}
                        detail = ""
                        if isinstance(args, dict):
                            detail = str(args.get("command") or args.get("path") or args.get("query") or args.get("pattern") or "")
                        sp["name"] = p.get("toolName") or "tool"
                        sp["meta"] = {"title": p.get("title") or "", "tool": p.get("toolName"), "kind": p.get("kind") or p.get("actionType") or ""}
                        if detail:
                            # The approval question for a file tool is only its title;
                            # the call's own args carry the path or command.
                            sp["input"] = detail[:1500]
                        if p.get("status") in ("denied", "rejected", "failed"):
                            sp["status"] = "denied"
                        if cur_turn:
                            turns[cur_turn]["meta"]["tools"] += 1
                    elif t == "tool_result":
                        sp = tools.get(p.get("toolCallId") or "")
                        if sp is not None:
                            sp["end"] = ts
                            ok = p.get("success", True)
                            if sp["status"] == "pending":
                                sp["status"] = "ok" if ok in (True, "True", "true") else "error"
                            content = p.get("content")
                            if isinstance(content, str):
                                sp["output"] = content[:4000]
                        if cur_turn:
                            model_open = new_model(cur_turn, ts)
                    elif t == "usage_summary":
                        tid = p.get("turnId") or cur_turn
                        tsum = turns.get(tid or "")
                        if tsum is not None:
                            for turn in p.get("promptTurnSummaries") or []:
                                try:
                                    tsum["meta"]["credits"] += float(turn.get("usage") or 0)
                                except (TypeError, ValueError):
                                    pass
                            tsum["meta"]["credits"] = round(tsum["meta"]["credits"], 3)
                            breakdown = p.get("contextBreakdown") or {}
                            tsum["meta"]["model_calls"] = int(breakdown.get("modelCalls") or 0)
                            win = (breakdown.get("window") or {})
                            if win.get("usagePercentage") is not None:
                                tsum["meta"]["context_pct"] = win.get("usagePercentage")
                            if p.get("status") not in (None, "success"):
                                tsum["status"] = "error"
                    elif t == "turn_end":
                        tid = p.get("turnId") or cur_turn
                        close_model(ts)
                        tsum = turns.get(tid or "")
                        if tsum is not None:
                            tsum["end"] = ts
                            tsum["output"] = (p.get("stopReason") or "")
                            if p.get("stopReason") not in (None, "end_turn"):
                                tsum["status"] = "warn"
        except OSError:
            return {"spans": [], "found": False}

        close_model(run_end or 0.0)
        # Close anything still open (a live run) at the last timestamp seen.
        for sp in spans:
            if sp.get("end") is None:
                sp["end"] = run_end
                if sp["kind"] == "tool" and sp["status"] == "pending":
                    sp["status"] = "running"
        # Drop empty model spans (a tool followed another with no model time in between).
        spans = [sp for sp in spans if not (sp["kind"] == "model" and (sp["end"] or 0) - sp["start"] < 0.05 and not sp["output"])]
        for sp in spans:
            if sp["kind"] == "tool" and sp.get("approved") is not None:
                sp["meta"]["approval_ms"] = int((sp["approved"] - sp["start"]) * 1000)
            sp.pop("approved", None)
        meta = _read_json(sdir / "session.json", {})
        root = {"id": "run", "parent": None, "kind": "run", "name": meta.get("agentMode") or "run",
                "start": run_start, "end": run_end, "status": "ok",
                "meta": {"model": meta.get("modelId"), "turns": len(turns),
                         "tools": sum(1 for s in spans if s["kind"] == "tool"),
                         "model_spans": sum(1 for s in spans if s["kind"] == "model"),
                         "credits": round(sum(t["meta"]["credits"] for t in turns.values()), 3)},
                "input": "", "output": ""}
        return {"found": True, "spans": [root] + spans}


def _extract_refs(content: str) -> tuple[int | None, int | None]:
    """Issue and PR numbers from the dispatcher's trusted control-plane block.

    The block the dispatcher writes reads:
        - mode: pr-review-round
        - item number: 78
        - delivery issue: #76
    For issue modes the item IS the issue; for PR modes the item is the PR and the
    ``delivery issue`` line names the issue. Only that block is read, never the
    base64 GitHub payload below it.
    """
    start = content.rfind("Trusted control plane:")
    if start < 0:
        return None, None
    end = content.find("UNTRUSTED_GITHUB_DATA_BASE64", start)
    block = content[start:end if end > 0 else start + 3000]
    mode = re.search(r"-\s*mode:\s*([a-z-]+)", block)
    item = re.search(r"-\s*item number:\s*#?(\d+)", block)
    issue_line = re.search(r"-\s*delivery issue:\s*#?(\d+)", block)
    mode_s = mode.group(1) if mode else ""
    item_n = int(item.group(1)) if item else None
    if mode_s.startswith("issue-"):
        return item_n, None
    issue_n = int(issue_line.group(1)) if issue_line else None
    if issue_n is None:
        m = re.search(r"kiro/issue-(\d+)", block)
        issue_n = int(m.group(1)) if m else None
    return issue_n, item_n


# ---------------------------------------------------------------------------
# Snapshot assembly
# ---------------------------------------------------------------------------


class Factory:
    def __init__(self) -> None:
        self.config = Config()
        self.ledger = RunLedger()
        self.sessions = Sessions()
        self._lock = threading.Lock()
        self._cache: tuple[float, dict[str, Any]] | None = None

    # -- GitHub ---------------------------------------------------------------

    def _github(self, repo: str) -> dict[str, Any]:
        errors: list[str] = []
        issues: list[dict[str, Any]] = []
        prs: list[dict[str, Any]] = []
        wf_runs: list[dict[str, Any]] = []
        runners: list[dict[str, Any]] = []
        try:
            issues = _gh([
                "issue", "list", "--state", "all", "--limit", "100",
                "--json", "number,title,labels,state,createdAt,updatedAt,closedAt,url",
            ], repo) or []
        except RuntimeError as exc:
            errors.append(f"issues: {exc}")
        try:
            prs = _gh([
                "pr", "list", "--state", "all", "--limit", "100",
                "--json", "number,title,labels,state,headRefName,url,createdAt,updatedAt,"
                "mergedAt,closedAt,isDraft,reviewDecision,statusCheckRollup,body",
            ], repo) or []
        except RuntimeError as exc:
            errors.append(f"pulls: {exc}")
        try:
            data = _gh(["api", f"repos/{repo}/actions/runs?per_page=60"]) or {}
            wf_runs = data.get("workflow_runs", [])
        except RuntimeError as exc:
            errors.append(f"workflow runs: {exc}")
        try:
            data = _gh(["api", f"repos/{repo}/actions/runners"]) or {}
            runners = data.get("runners", [])
        except RuntimeError as exc:
            errors.append(f"runners: {exc}")
        return {"issues": issues, "prs": prs, "workflow_runs": wf_runs, "runners": runners, "errors": errors}

    # -- Kiro Crew runs -------------------------------------------------------

    def _webhook_runs(self, repo: str) -> list[dict[str, Any]]:
        owner, name = repo.split("/", 1)
        raw = _read_json(CREW_HOME / "webhook_runs.json", {}).get("runs", [])
        mine = []
        for rec in raw:
            m = HOOK_RE.match(rec.get("hook_id") or "")
            if not m or m["owner"] != owner or m["repo"] != name:
                continue
            mine.append(rec)
        self.ledger.absorb(mine)
        out = []
        for rec in self.ledger.runs.values():
            m = HOOK_RE.match(rec.get("hook_id") or "")
            if not m or m["owner"] != owner or m["repo"] != name:
                continue
            kind = m["kind"]
            run = {
                "id": rec["id"],
                "kind": kind,
                "agent": KIND_TO_AGENT.get(kind, kind),
                "workflow_run_id": int(m["run"]),
                "attempt": int(m["attempt"]),
                "outcome": rec.get("outcome"),
                "started_at": rec.get("started_at"),
                "duration_ms": rec.get("duration_ms"),
                "delivered": rec.get("delivered"),
                "detail": rec.get("detail", ""),
                "session_key": rec.get("session_key"),
                "live": False,
                "session": None,
            }
            if run["session_key"]:
                summ = self.sessions.summary(run["session_key"])
                if summ:
                    run["session"] = summ
                    if summ.get("agent"):
                        run["agent"] = summ["agent"]
            out.append(run)
        # Live sessions: hook sessions for this repo with no run record yet.
        recorded = {r["session_key"] for r in out if r.get("session_key")}
        now = time.time()
        for key, entry in self.sessions.session_map().items():
            if not key.startswith("hook:github:") or key in recorded:
                continue
            m = HOOK_RE.match(key[len("hook:"):])
            if not m or m["owner"] != owner or m["repo"] != name:
                continue
            summ = self.sessions.summary(key)
            if not summ or not summ.get("found"):
                continue
            modified = summ.get("modified_at") or 0
            if now - modified > 20 * 60:
                continue  # abandoned long ago; the gateway recorded or dropped it
            out.append({
                "id": "live_" + (entry.get("sid") or key)[-12:],
                "kind": m["kind"],
                "agent": summ.get("agent") or KIND_TO_AGENT.get(m["kind"], m["kind"]),
                "workflow_run_id": int(m["run"]),
                "attempt": int(m["attempt"]),
                "outcome": "running",
                "started_at": summ.get("created_at"),
                "duration_ms": int((now - (summ.get("created_at") or now)) * 1000),
                "delivered": False,
                "detail": "",
                "session_key": key,
                "live": True,
                "session": summ,
            })
        out.sort(key=lambda r: r.get("started_at") or 0, reverse=True)
        return out

    # -- Board ----------------------------------------------------------------

    @staticmethod
    def _stage_for(issue_labels: set[str], issue_state: str, pr: dict[str, Any] | None) -> str:
        pr_labels = _label_names(pr) if pr else set()
        if pr:
            if pr.get("mergedAt"):
                return "shipped"
            if "kiro-parked" in pr_labels:
                return "parked"
            if "kiro-ready-to-merge" in pr_labels:
                return "ready"
            if "kiro-ready" in pr_labels:
                return "gate"
            if "kiro-changes-requested" in pr_labels:
                return "fixing"
            if "kiro-review" in pr_labels:
                return "review"
            if pr.get("state") == "OPEN":
                return "implementing"
        if "kiro-needs-owner" in issue_labels:
            return "needs-owner"
        if "kiro-approved" in issue_labels:
            return "implementing"
        if "kiro-plan" in issue_labels or "kiro-deliver" in issue_labels or "kiro-task" in issue_labels:
            return "planning"
        if issue_state == "CLOSED":
            return "shipped"
        return "planning"

    def _board(self, gh: dict[str, Any], runs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        prs_by_issue: dict[int, dict[str, Any]] = {}
        docs_prs: dict[int, dict[str, Any]] = {}
        for pr in gh["prs"]:
            m = BRANCH_RE.match(pr.get("headRefName") or "")
            if not m:
                continue
            num = int(m.group(1))
            target = docs_prs if pr["headRefName"].startswith("kiro/docs-pr-") else prs_by_issue
            cur = target.get(num)
            if cur is None or (pr.get("updatedAt") or "") > (cur.get("updatedAt") or ""):
                target[num] = pr
        runs_by_issue: dict[int, list[dict[str, Any]]] = {}
        runs_by_pr: dict[int, list[dict[str, Any]]] = {}
        for run in runs:
            s = run.get("session") or {}
            if s.get("issue"):
                runs_by_issue.setdefault(int(s["issue"]), []).append(run)
            elif s.get("pr"):
                runs_by_pr.setdefault(int(s["pr"]), []).append(run)
        items = []
        for issue in gh["issues"]:
            labels = _label_names(issue)
            num = issue["number"]
            pr = prs_by_issue.get(num)
            if not (labels & LIFECYCLE_LABELS) and pr is None:
                continue
            stage = self._stage_for(labels, issue.get("state", ""), pr)
            hops = list(runs_by_issue.get(num, []))
            if pr:
                hops += runs_by_pr.get(pr["number"], [])
            hops = {h["id"]: h for h in hops}.values()
            hops = sorted(hops, key=lambda r: r.get("started_at") or 0)
            live = [h for h in hops if h.get("live")]
            rounds = sum(1 for h in hops if h["kind"] in ("pr-review-round", "pr-review"))
            checks = None
            if pr and isinstance(pr.get("statusCheckRollup"), list):
                states = [c.get("conclusion") or c.get("state") for c in pr["statusCheckRollup"]]
                if states:
                    bad = [s for s in states if s in ("FAILURE", "ERROR", "TIMED_OUT", "CANCELLED")]
                    pend = [s for s in states if s in ("PENDING", "IN_PROGRESS", "QUEUED", None, "")]
                    checks = "failing" if bad else "pending" if pend else "passing"
            stage_since = None
            if pr and stage in ("ready", "parked", "gate", "review", "fixing", "shipped"):
                stage_since = _iso_to_ts(pr.get("mergedAt") if stage == "shipped" else pr.get("updatedAt"))
            else:
                stage_since = _iso_to_ts(issue.get("updatedAt"))
            items.append({
                "issue": num,
                "title": issue.get("title", ""),
                "url": issue.get("url"),
                "state": issue.get("state"),
                "labels": sorted(labels),
                "stage": stage,
                "stage_since": stage_since,
                "created_at": _iso_to_ts(issue.get("createdAt")),
                "closed_at": _iso_to_ts(issue.get("closedAt")),
                "pr": {
                    "number": pr["number"],
                    "url": pr.get("url"),
                    "title": pr.get("title"),
                    "labels": sorted(_label_names(pr)),
                    "state": pr.get("state"),
                    "merged_at": _iso_to_ts(pr.get("mergedAt")),
                    "review_decision": pr.get("reviewDecision"),
                    "checks": checks,
                } if pr else None,
                "docs_pr": {"number": docs_prs[pr["number"]]["number"], "url": docs_prs[pr["number"]].get("url")}
                if pr and pr["number"] in docs_prs else None,
                "rounds": rounds,
                "hops": [
                    {
                        "id": h["id"], "agent": h["agent"], "kind": h["kind"], "outcome": h["outcome"],
                        "started_at": h.get("started_at"), "duration_ms": h.get("duration_ms"),
                        "credits": (h.get("session") or {}).get("credits"),
                        "live": h.get("live", False),
                    }
                    for h in hops
                ],
                "live_agent": live[-1]["agent"] if live else None,
                "credits": round(sum((h.get("session") or {}).get("credits") or 0 for h in hops), 2),
                # The newest thing that happened to this item: the last agent hop's end,
                # or the GitHub timestamp behind its stage. The board is ordered by it.
                "last_activity": max(
                    [stage_since or 0, _iso_to_ts(issue.get("updatedAt")) or 0]
                    + [((h.get("started_at") or 0) + ((h.get("duration_ms") or 0) / 1000)) for h in hops]
                ) or None,
            })
        # A closed issue that never shipped (a smoke test cleaned up, a test issue closed
        # by hand, an abandoned fast lane) is history, not work in a stage. Drop it.
        items = [it for it in items if not (it["state"] == "CLOSED" and it["stage"] != "shipped")]
        # Newest activity first, in every column.
        items.sort(key=lambda it: -(it["last_activity"] or 0))
        return items

    # -- Costs ----------------------------------------------------------------

    @staticmethod
    def _costs(board: list[dict[str, Any]], runs: list[dict[str, Any]], days: int = 14) -> dict[str, Any]:
        """Credits by issue, agent, model and day.

        Credits are the only cost unit kiro-cli records for a webhook run (each turn's
        ``usage_summary``); token counts are not written for this surface, so the
        secondary measures are model calls and the context size in characters. The
        model is "auto" unless a template pins one.
        """
        def sess(r: dict[str, Any]) -> dict[str, Any]:
            return r.get("session") or {}

        def credits(r: dict[str, Any]) -> float:
            return float(sess(r).get("credits") or 0)

        def model_of(r: dict[str, Any]) -> str:
            return sess(r).get("resolved_model") or sess(r).get("model") or "auto"

        now = time.time()
        week_ago = now - 7 * 86400
        # Per issue: the board already joined hops to issues.
        per_issue = []
        for it in board:
            hops = it.get("hops") or []
            if not hops:
                continue
            by_agent: dict[str, float] = {}
            for h in hops:
                by_agent[h["agent"]] = round(by_agent.get(h["agent"], 0) + float(h.get("credits") or 0), 3)
            per_issue.append({
                "issue": it["issue"], "title": it["title"], "url": it["url"], "stage": it["stage"],
                "pr": (it.get("pr") or {}).get("number"),
                "hops": len(hops), "rounds": it.get("rounds", 0),
                "credits": round(it.get("credits") or 0, 2),
                "by_agent": by_agent,
                "last_activity": it.get("last_activity"),
            })
        per_issue.sort(key=lambda x: -x["credits"])
        # Per agent and per model, over every run we can see.
        per_agent: dict[str, dict[str, Any]] = {}
        per_model: dict[str, dict[str, Any]] = {}
        for r in runs:
            c = credits(r)
            a = per_agent.setdefault(r["agent"], {"agent": r["agent"], "runs": 0, "credits": 0.0, "model_calls": 0, "tool_calls": 0, "duration_ms": 0})
            a["runs"] += 1; a["credits"] += c
            a["model_calls"] += int(sess(r).get("model_calls") or 0)
            a["tool_calls"] += int(sess(r).get("tool_calls") or 0)
            a["duration_ms"] += int(r.get("duration_ms") or 0)
            m = per_model.setdefault(model_of(r), {"model": model_of(r), "runs": 0, "credits": 0.0, "model_calls": 0, "context_chars": []})
            m["runs"] += 1; m["credits"] += c
            m["model_calls"] += int(sess(r).get("model_calls") or 0)
            if sess(r).get("context_chars"):
                m["context_chars"].append(int(sess(r)["context_chars"]))
        for a in per_agent.values():
            a["credits"] = round(a["credits"], 2)
            a["avg_credits"] = round(a["credits"] / a["runs"], 2) if a["runs"] else None
            a["credits_per_minute"] = round(a["credits"] / (a["duration_ms"] / 60000), 2) if a["duration_ms"] else None
        for m in per_model.values():
            m["credits"] = round(m["credits"], 2)
            m["avg_credits"] = round(m["credits"] / m["runs"], 2) if m["runs"] else None
            m["avg_context_chars"] = int(statistics.mean(m["context_chars"])) if m["context_chars"] else None
            del m["context_chars"]
        # Per day, stacked by agent, oldest first.
        day_keys = [time.strftime("%Y-%m-%d", time.gmtime(now - i * 86400)) for i in range(days - 1, -1, -1)]
        per_day = {d: {"day": d, "credits": 0.0, "runs": 0, "by_agent": {}} for d in day_keys}
        for r in runs:
            if not r.get("started_at"):
                continue
            d = time.strftime("%Y-%m-%d", time.gmtime(r["started_at"]))
            if d in per_day:
                c = credits(r)
                per_day[d]["credits"] = round(per_day[d]["credits"] + c, 3)
                per_day[d]["runs"] += 1
                per_day[d]["by_agent"][r["agent"]] = round(per_day[d]["by_agent"].get(r["agent"], 0) + c, 3)
        total = round(sum(credits(r) for r in runs), 2)
        week = round(sum(credits(r) for r in runs if (r.get("started_at") or 0) >= week_ago), 2)
        shipped = [x for x in per_issue if x["stage"] == "shipped"]
        delivered = [x for x in per_issue if x["stage"] in ("shipped", "ready")]
        return {
            "unit": "credits",
            "tokens_recorded": False,
            "totals": {
                "credits_total": total,
                "credits_week": week,
                "runs": len(runs),
                "issues_with_cost": len(per_issue),
                "avg_per_issue": round(statistics.mean([x["credits"] for x in per_issue]), 2) if per_issue else None,
                "median_per_delivered_issue": round(statistics.median([x["credits"] for x in delivered]), 2) if delivered else None,
                "avg_per_shipped_issue": round(statistics.mean([x["credits"] for x in shipped]), 2) if shipped else None,
                "avg_per_hop": round(total / len(runs), 2) if runs else None,
            },
            "per_issue": per_issue,
            "per_agent": sorted(per_agent.values(), key=lambda a: -a["credits"]),
            "per_model": sorted(per_model.values(), key=lambda m: -m["credits"]),
            "per_day": list(per_day.values()),
        }

    # -- Stats ----------------------------------------------------------------

    @staticmethod
    def _stats(board: list[dict[str, Any]], runs: list[dict[str, Any]]) -> dict[str, Any]:
        by_stage = {s: 0 for s in STAGE_IDS}
        for it in board:
            by_stage[it["stage"]] = by_stage.get(it["stage"], 0) + 1
        week_ago = time.time() - 7 * 86400
        cycle = []
        for it in board:
            if it["stage"] in ("ready", "shipped") and it.get("created_at") and it.get("stage_since"):
                cycle.append(it["stage_since"] - it["created_at"])
        finished = [it for it in board if it["stage"] in ("ready", "shipped", "parked")]
        parked = [it for it in board if it["stage"] == "parked"]
        completed = [r for r in runs if r["outcome"] == "completed"]
        failed = [r for r in runs if r["outcome"] not in ("completed", "running")]
        week_runs = [r for r in runs if (r.get("started_at") or 0) >= week_ago]
        credits = sum((r.get("session") or {}).get("credits") or 0 for r in runs)
        week_credits = sum((r.get("session") or {}).get("credits") or 0 for r in week_runs)
        return {
            "in_flight": sum(1 for it in board if it["stage"] not in ("ready", "shipped", "parked")),
            "ready": by_stage.get("ready", 0),
            "parked": by_stage.get("parked", 0),
            "shipped": by_stage.get("shipped", 0),
            "by_stage": by_stage,
            "median_cycle_s": statistics.median(cycle) if cycle else None,
            "pass_rate": round(100 * (len(finished) - len(parked)) / len(finished)) if finished else None,
            "runs_total": len(runs),
            "runs_week": len(week_runs),
            "runs_completed": len(completed),
            "runs_failed": len(failed),
            "live_runs": sum(1 for r in runs if r.get("live")),
            "credits_total": round(credits, 2),
            "credits_week": round(week_credits, 2),
            "run_success_rate": round(100 * len(completed) / (len(completed) + len(failed))) if (completed or failed) else None,
        }

    @staticmethod
    def _agents(runs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        out = []
        for agent_id, label, role in AGENTS:
            mine = [r for r in runs if r["agent"] == agent_id]
            done = [r for r in mine if r["outcome"] == "completed" and r.get("duration_ms")]
            durations = [r["duration_ms"] for r in done]
            credits = [(r.get("session") or {}).get("credits") or 0 for r in mine if r.get("session")]
            models = {}
            for r in mine:
                mdl = (r.get("session") or {}).get("model")
                if mdl:
                    models[mdl] = models.get(mdl, 0) + 1
            out.append({
                "id": agent_id,
                "label": label,
                "role": role,
                "runs": len(mine),
                "completed": len(done),
                "failed": sum(1 for r in mine if r["outcome"] not in ("completed", "running")),
                "live": sum(1 for r in mine if r.get("live")),
                "avg_duration_ms": int(statistics.mean(durations)) if durations else None,
                "p90_duration_ms": int(sorted(durations)[max(0, int(len(durations) * 0.9) - 1)]) if durations else None,
                "avg_credits": round(statistics.mean(credits), 2) if credits else None,
                "model": max(models, key=models.get) if models else None,
                "last_run_at": max((r.get("started_at") or 0 for r in mine), default=None) or None,
                "last_outcome": mine[0]["outcome"] if mine else None,
                "installed": (Path.home() / ".kiro" / "agents" / f"{agent_id}.json").exists(),
            })
        return out

    @staticmethod
    def _infra(gh: dict[str, Any], repo: str) -> dict[str, Any]:
        wf = [r for r in gh["workflow_runs"] if "kiro" in (r.get("name") or "").lower() or r.get("event") in ("issues", "pull_request", "pull_request_target")]
        recent = wf[:30]
        failures = [r for r in recent if r.get("conclusion") in ("failure", "timed_out", "startup_failure")]
        last = recent[0] if recent else None
        runners = [
            {"name": r.get("name"), "status": r.get("status"), "busy": r.get("busy"),
             "labels": [lab.get("name") for lab in r.get("labels", [])]}
            for r in gh["runners"]
        ]
        online = [r for r in runners if r["status"] == "online"]
        # Webhook switch and sources. tokens.json holds hashes and labels only (never a
        # raw secret); it sits in a protected directory, so it may be unreadable here.
        tokens = _read_json(CREW_HOME / "webhooks" / "tokens.json", None)
        hooks_on: bool | None = None
        sources: list[dict[str, Any]] = []
        if isinstance(tokens, dict):
            hooks_on = tokens.get("enabled", True) is not False
            for tid, entry in (tokens.get("tokens") or {}).items():
                if not isinstance(entry, dict):
                    continue
                sources.append({
                    "id": tid,
                    "label": entry.get("label", ""),
                    "agent": entry.get("agent", ""),
                    "enabled": entry.get("enabled", True) is not False,
                    "signed": bool(entry.get("require_signature")),
                    "last_used_at": entry.get("last_used_at"),
                })
        templates = {a: (Path.home() / ".kiro" / "agents" / f"{a}.json").exists() for a, _, _ in AGENTS}
        return {
            "repo": repo,
            "runners": runners,
            "runner_ok": bool(online),
            "workflow_recent": [
                {"id": r.get("id"), "name": r.get("name"), "event": r.get("event"), "status": r.get("status"),
                 "conclusion": r.get("conclusion"), "created_at": _iso_to_ts(r.get("created_at")),
                 "url": r.get("html_url"), "title": r.get("display_title")}
                for r in recent[:12]
            ],
            "workflow_failures_recent": len(failures),
            "workflow_last_at": _iso_to_ts(last.get("created_at")) if last else None,
            "webhooks_enabled": hooks_on,
            "sources": sources,
            "sources_readable": isinstance(tokens, dict),
            "templates": templates,
            "templates_ok": all(templates.values()),
            "gateway_host": os.uname().nodename if hasattr(os, "uname") else "",
            "errors": gh["errors"],
        }

    # -- Public ---------------------------------------------------------------

    def state(self, force: bool = False, limit: int = BOARD_LIMIT) -> dict[str, Any]:
        """The snapshot. ``limit`` caps the board to the N most recently active items
        (0 = all); stats always count the whole board."""
        with self._lock:
            now = time.time()
            if not force and self._cache and now - self._cache[0] < CACHE_TTL:
                snapshot = self._cache[1]
            else:
                repo = self.config.repo
                gh = self._github(repo)
                runs = self._webhook_runs(repo)
                board = self._board(gh, runs)
                snapshot = {
                    "generated_at": now,
                    "repo": repo,
                    "stages": [{"id": s, "label": lab, "agent": ag} for s, lab, ag in STAGES],
                    "stats": self._stats(board, runs),
                    "board": board,
                    "runs": runs[:120],
                    "agents": self._agents(runs),
                    "costs": self._costs(board, runs),
                    "infra": self._infra(gh, repo),
                }
                self._cache = (now, snapshot)
            if limit and len(snapshot["board"]) > limit:
                return {**snapshot, "board": snapshot["board"][:limit], "board_total": len(snapshot["board"]), "board_limit": limit}
            return {**snapshot, "board_total": len(snapshot["board"]), "board_limit": limit}

    def run_steps(self, run_id: str) -> dict[str, Any]:
        snapshot = self.state()
        run = next((r for r in snapshot["runs"] if r["id"] == run_id), None)
        if not run:
            return {"error": "unknown run"}
        return {"run": run, "steps": self.sessions.steps(run["session_key"]) if run.get("session_key") else []}

    def run_trace(self, run_id: str) -> dict[str, Any]:
        snapshot = self.state()
        run = next((r for r in snapshot["runs"] if r["id"] == run_id), None)
        if not run:
            return {"error": "unknown run"}
        trace = self.sessions.trace(run["session_key"]) if run.get("session_key") else {"spans": [], "found": False}
        return {"run": run, **trace}


FACTORY = Factory()

# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------


class Handler(BaseHTTPRequestHandler):
    server_version = "SoftwareFactory/0.1"

    def _route(self) -> str:
        path = self.path.split("?", 1)[0].rstrip("/")
        for prefix in (f"/api/apps/{APP_NAME}", "/api"):
            if path.startswith(prefix + "/"):
                return path[len(prefix):]
        return path

    def do_GET(self) -> None:  # noqa: N802
        route = self._route()
        force = "refresh=1" in (self.path.split("?", 1)[1] if "?" in self.path else "")
        try:
            if route == "/health":
                self._json(200, {"status": "ok", "app": APP_NAME})
            elif route == "/state":
                query = self.path.split("?", 1)[1] if "?" in self.path else ""
                limit = BOARD_LIMIT
                for part in query.split("&"):
                    if part.startswith("limit="):
                        try:
                            limit = max(0, int(part[6:]))
                        except ValueError:
                            pass
                self._json(200, FACTORY.state(force=force, limit=limit))
            elif route == "/config":
                self._json(200, {"repo": FACTORY.config.repo})
            elif route.startswith("/runs/") and route.endswith("/steps"):
                run_id = route[len("/runs/"):-len("/steps")]
                self._json(200, FACTORY.run_steps(run_id))
            elif route.startswith("/runs/") and route.endswith("/trace"):
                run_id = route[len("/runs/"):-len("/trace")]
                self._json(200, FACTORY.run_trace(run_id))
            else:
                self._json(404, {"error": "not found", "route": route})
        except Exception as exc:  # noqa: BLE001 - surface to the page instead of a dead backend
            self._json(500, {"error": str(exc)[:500]})

    def do_POST(self) -> None:  # noqa: N802
        route = self._route()
        length = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(length) or b"{}") if length else {}
        if route == "/config":
            repo = str(body.get("repo", "")).strip()
            if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo):
                self._json(400, {"error": "repo must be owner/name"})
                return
            FACTORY.config.repo = repo
            FACTORY.config.save()
            FACTORY._cache = None
            self._json(200, {"repo": repo})
        else:
            self._json(404, {"error": "not found"})

    def _json(self, code: int, data: Any) -> None:
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args: Any) -> None:  # quiet
        pass


class Server(HTTPServer):
    allow_reuse_address = not sys.platform.startswith("win")


if __name__ == "__main__":
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"{APP_NAME} backend on 127.0.0.1:{PORT}, watching {FACTORY.config.repo}", flush=True)
    Server(("127.0.0.1", PORT), Handler).serve_forever()
