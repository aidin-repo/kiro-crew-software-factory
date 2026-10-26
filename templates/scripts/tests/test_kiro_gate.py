import hashlib
import importlib.util
from pathlib import Path

import pytest


SCRIPT_PATH = Path(__file__).parents[1] / "kiro_gate.py"
SPEC = importlib.util.spec_from_file_location("kiro_gate", SCRIPT_PATH)
gate = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(gate)

OWNER = "example-owner"
HEAD = "a" * 40


def facts(**overrides):
    base = {
        "head_sha": HEAD,
        "verdict": "approve",
        "reviewed_sha": HEAD,
        "check_runs": [{"name": "frontend", "conclusion": "success"}, {"name": "agent", "conclusion": "success"}],
        "changed_files": ["frontend/src/a.tsx", "frontend/src/a.test.tsx"],
        "allowed_files": ["frontend/src/a.tsx", "frontend/src/a.test.tsx"],
        "rounds": 1,
        "spec_sha_matches": True,
    }
    base.update(overrides)
    return base


# --- files block ---------------------------------------------------------------------


def test_parse_files_block_reads_paths_and_ignores_decoration():
    spec = (
        "## Design\nchange things\n"
        "```files\n"
        "frontend/src/a.tsx\n"
        "- frontend/src/a.test.tsx\n"
        "* `frontend/src/utils/`\n"
        "# a comment\n"
        "\n"
        "```\n"
        "## Tasks\n"
    )
    assert gate.parse_files_block(spec) == ["frontend/src/a.tsx", "frontend/src/a.test.tsx", "frontend/src/utils/"]


def test_parse_files_block_is_none_without_a_block():
    assert gate.parse_files_block("## Design\n```ts\nconst x = 1\n```") is None
    assert gate.parse_files_block(None) is None


# --- scope ---------------------------------------------------------------------------


def test_scope_allows_listed_paths_directories_and_globs():
    allowed = ["frontend/src/a.tsx", "frontend/src/utils/", "docs/*.md"]
    assert gate.scope_violations(
        ["frontend/src/a.tsx", "frontend/src/utils/deep/x.ts", "docs/readme.md"], allowed
    ) == []


def test_scope_reports_files_outside_the_block():
    violations = gate.scope_violations(["frontend/src/b.tsx"], ["frontend/src/a.tsx"])
    assert violations == ["frontend/src/b.tsx (not in the spec's files block)"]


def test_scope_denies_workflows_infra_and_env_even_when_listed():
    allowed = [".github/workflows/ci.yml", "infrastructure/stack.ts", "frontend/.env.local"]
    violations = gate.scope_violations([".github/workflows/ci.yml", "infrastructure/stack.ts", "frontend/.env.local"], allowed)
    assert all(v.endswith("(denied path)") for v in violations)
    assert len(violations) == 3


def test_scope_with_no_block_enforces_only_the_deny_list():
    assert gate.scope_violations(["anything/at/all.py"], None) == []
    assert gate.scope_violations([".github/x.yml"], None) == [".github/x.yml (denied path)"]


# --- verdict -------------------------------------------------------------------------


def review(body, user=OWNER, at="2026-01-01T00:00:00Z"):
    return {"user": {"login": user}, "body": body, "submitted_at": at}


def test_latest_verdict_takes_newest_owner_review_with_a_verdict_line():
    reviews = [
        review("VERDICT: request-changes\nHEAD REVIEWED: " + "b" * 40, at="2026-01-01T00:00:00Z"),
        review("just a comment", at="2026-01-03T00:00:00Z"),
        review("VERDICT: approve\nHEAD REVIEWED: " + HEAD, at="2026-01-02T00:00:00Z"),
        review("VERDICT: approve\nHEAD REVIEWED: " + "c" * 40, user="someone-else", at="2026-01-04T00:00:00Z"),
    ]
    assert gate.latest_verdict(reviews, OWNER) == ("approve", HEAD)


def test_latest_verdict_without_sha_or_without_reviews():
    assert gate.latest_verdict([review("VERDICT: approve")], OWNER) == ("approve", None)
    assert gate.latest_verdict([], OWNER) == (None, None)
    assert gate.latest_verdict([review("LGTM")], OWNER) == (None, None)


# --- rounds, spec reference, hash ------------------------------------------------------


def test_count_review_rounds_counts_only_kiro_review_label_events():
    timeline = [
        {"event": "labeled", "label": {"name": "kiro-review"}},
        {"event": "labeled", "label": {"name": "kiro-ready"}},
        {"event": "unlabeled", "label": {"name": "kiro-review"}},
        {"event": "labeled", "label": {"name": "kiro-review"}},
        {"event": "commented"},
    ]
    assert gate.count_review_rounds(timeline) == 2


def test_spec_reference_parses_url_and_hash():
    body = (
        "Closes #42\n"
        "Spec: https://github.com/example-owner/example-repo/issues/42#issuecomment-123456\n"
        "Spec-SHA256: " + "f" * 64 + "\n"
    )
    assert gate.spec_reference(body) == ("example-owner/example-repo", 42, 123456, "f" * 64)


def test_spec_reference_requires_both_lines():
    with pytest.raises(gate.GateError, match="Spec:"):
        gate.spec_reference("Closes #42")
    with pytest.raises(gate.GateError, match="Spec-SHA256"):
        gate.spec_reference("Spec: https://github.com/o/r/issues/1#issuecomment-2")


def test_sha256_text_matches_hashlib():
    assert gate.sha256_text("abc") == hashlib.sha256(b"abc").hexdigest()


# --- decision ------------------------------------------------------------------------


def test_decide_passes_clean_facts():
    passed, reasons = gate.decide(facts())
    assert passed is True
    assert reasons == []


def test_decide_parks_on_wrong_verdict_or_stale_sha():
    passed, reasons = gate.decide(facts(verdict="request-changes"))
    assert passed is False and any(r.startswith("HEAD:") for r in reasons)
    passed, reasons = gate.decide(facts(reviewed_sha="b" * 40))
    assert passed is False and "review names" in reasons[0]
    passed, reasons = gate.decide(facts(verdict=None, reviewed_sha=None))
    assert passed is False


def test_decide_parks_on_failed_or_pending_or_missing_checks():
    passed, reasons = gate.decide(facts(check_runs=[{"name": "frontend", "conclusion": "failure"}]))
    assert passed is False and "CI: frontend is failure" in reasons
    passed, reasons = gate.decide(facts(check_runs=[{"name": "frontend", "conclusion": None}]))
    assert passed is False and "CI: frontend is pending" in reasons
    passed, reasons = gate.decide(facts(check_runs=[]))
    assert passed is False and "CI: no check runs" in reasons[0]


def test_no_ci_blocks_by_default_and_warns_when_not_required():
    passed, reasons = gate.decide(facts(check_runs=[]))
    assert passed is False and "KIRO_GATE_REQUIRE_CI=false" in reasons[0]
    passed, reasons = gate.decide(facts(check_runs=[], require_ci=False))
    assert passed is True and reasons[0].endswith("(warning)")


def test_require_ci_reads_the_environment():
    assert gate.require_ci({}) is True
    assert gate.require_ci({"KIRO_GATE_REQUIRE_CI": "true"}) is True
    for value in ("false", "0", "no", "off", " False "):
        assert gate.require_ci({"KIRO_GATE_REQUIRE_CI": value}) is False


def test_decide_ignores_the_lifecycle_workflows_own_check_runs():
    # Regression: PR #70 parked with "CI: pr-gate is pending" because the gate counted
    # its own in-progress job as a failing CI check.
    runs = [
        {"name": "frontend", "conclusion": "success"},
        {"name": "pr-gate", "conclusion": None},
        {"name": "pr-review-round", "conclusion": "success"},
        {"name": "issue-implement", "conclusion": "skipped"},
    ]
    passed, reasons = gate.decide(facts(check_runs=runs))
    assert passed is True and reasons == []
    # And a head with ONLY lifecycle runs still has no CI.
    passed, reasons = gate.decide(facts(check_runs=[{"name": "pr-gate", "conclusion": None}]))
    assert passed is False and reasons[0].startswith("CI: no check runs")


def test_ci_check_runs_filters_by_job_name():
    runs = [{"name": "agent"}, {"name": "pr-gate"}, {"name": "frontend"}, {"name": "pr-merged"}]
    assert [c["name"] for c in gate.ci_check_runs(runs)] == ["agent", "frontend"]


def test_decide_accepts_neutral_and_skipped_checks():
    passed, _ = gate.decide(facts(check_runs=[{"name": "lint", "conclusion": "neutral"}, {"name": "x", "conclusion": "skipped"}]))
    assert passed is True


def test_decide_parks_on_scope_rounds_and_spec_hash():
    passed, reasons = gate.decide(facts(changed_files=["frontend/src/other.tsx"]))
    assert passed is False and reasons[0].startswith("SCOPE:")
    passed, reasons = gate.decide(facts(rounds=gate.MAX_REVIEW_ROUNDS + 1))
    assert passed is False and reasons[0].startswith("ROUNDS:")
    passed, reasons = gate.decide(facts(spec_sha_matches=False))
    assert passed is False and reasons[0].startswith("SPEC:")


def test_decide_missing_files_block_is_a_warning_not_a_block():
    passed, reasons = gate.decide(facts(allowed_files=None))
    assert passed is True
    assert len(reasons) == 1 and reasons[0].endswith("(warning)")


# --- end to end against a fake API ------------------------------------------------------


class FakeGitHub:
    def __init__(self, spec_body, pr_body, reviews, check_runs, files, timeline):
        self.repository = "example-owner/example-repo"
        self.spec_body = spec_body
        self.pr_body = pr_body
        self.reviews = reviews
        self.check_runs = check_runs
        self.files = files
        self.timeline = timeline
        self.writes = []

    def request(self, method, path, body=None, accept=None):
        if method != "GET":
            self.writes.append((method, path, body))
            return None
        if path.startswith("/pulls/77/reviews"):
            return self.reviews
        if path.startswith("/pulls/77/files"):
            return self.files
        if path.startswith("/pulls/77"):
            return {"number": 77, "head": {"sha": HEAD}, "body": self.pr_body}
        if path.startswith("/commits/"):
            return {"check_runs": self.check_runs}
        if path.startswith("/issues/77/timeline"):
            return self.timeline
        if path.startswith("/issues/comments/"):
            return {"user": {"login": OWNER}, "body": self.spec_body}
        raise AssertionError("unexpected GET " + path)

    def paginated(self, path, accept=None):
        return self.request("GET", path, accept=accept)


def spec_and_pr_body(files=("frontend/src/a.tsx", "frontend/src/a.test.tsx")):
    spec = "## Intent\nx\n## Design\n```files\n" + "\n".join(files) + "\n```\n"
    pr_body = (
        "Closes #42\n"
        "Spec: https://github.com/example-owner/example-repo/issues/42#issuecomment-9\n"
        "Spec-SHA256: " + gate.sha256_text(spec) + "\n"
    )
    return spec, pr_body


def test_gather_and_publish_pass_moves_label_to_ready_to_merge():
    spec, pr_body = spec_and_pr_body()
    github = FakeGitHub(
        spec_body=spec,
        pr_body=pr_body,
        reviews=[review("VERDICT: approve\nHEAD REVIEWED: " + HEAD)],
        check_runs=[{"name": "frontend", "conclusion": "success"}],
        files=[{"filename": "frontend/src/a.tsx"}, {"filename": "frontend/src/a.test.tsx"}],
        timeline=[{"event": "labeled", "label": {"name": "kiro-review"}}],
    )
    facts_ = gate.gather_facts(github, {"number": 77}, OWNER)
    passed, reasons = gate.decide(facts_)
    assert passed is True
    outcome = gate.publish(github, 77, passed, reasons, facts_["head_sha"])
    assert outcome == "kiro-ready-to-merge"
    methods = [(m, p) for m, p, _ in github.writes]
    assert ("POST", "/issues/77/comments") in methods
    assert ("DELETE", "/issues/77/labels/kiro-ready") in methods
    assert github.writes[-1] == ("POST", "/issues/77/labels", {"labels": ["kiro-ready-to-merge"]})
    assert gate.MARKER in github.writes[0][2]["body"]


def test_gather_and_publish_parks_on_scope_breach():
    spec, pr_body = spec_and_pr_body()
    github = FakeGitHub(
        spec_body=spec,
        pr_body=pr_body,
        reviews=[review("VERDICT: approve\nHEAD REVIEWED: " + HEAD)],
        check_runs=[{"name": "frontend", "conclusion": "success"}],
        files=[{"filename": "frontend/src/a.tsx"}, {"filename": ".github/workflows/ci.yml"}],
        timeline=[],
    )
    facts_ = gate.gather_facts(github, {"number": 77}, OWNER)
    passed, reasons = gate.decide(facts_)
    assert passed is False
    assert any("denied path" in r for r in reasons)
    assert gate.publish(github, 77, passed, reasons, facts_["head_sha"]) == "kiro-parked"
    assert github.writes[-1][2] == {"labels": ["kiro-parked"]}


def test_gather_refuses_a_spec_comment_by_someone_else():
    spec, pr_body = spec_and_pr_body()
    github = FakeGitHub(spec, pr_body, [], [], [], [])
    github.request = lambda method, path, body=None, accept=None: (
        {"user": {"login": "someone-else"}, "body": spec}
        if path.startswith("/issues/comments/")
        else {"number": 77, "head": {"sha": HEAD}, "body": pr_body}
        if path.startswith("/pulls/77")
        else {"check_runs": []}
    )
    github.paginated = lambda path, accept=None: []
    with pytest.raises(gate.GateError, match="not written by the repository owner"):
        gate.gather_facts(github, {"number": 77}, OWNER)
