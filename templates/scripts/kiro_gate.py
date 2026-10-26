"""Deterministic merge gate for a delivery pull request. No model, no agent.

Runs on the self-hosted runner when the reviewer labels a delivery PR `kiro-ready`.
It re-validates the event with the same rules as dispatch_kiro_event.py, then checks
facts GitHub can state about the PR and writes the outcome back as a label:

  kiro-ready-to-merge  every check below passed; the owner can merge
  kiro-parked          at least one failed; the comment lists which

Checks:
  1. HEAD    the latest `VERDICT:` review by the owner says approve and names this head SHA
  2. CI      every check run on the head SHA concluded success, neutral or skipped
  3. SCOPE   changed files are inside the spec's ```files block and outside the deny list
  4. ROUNDS  the PR has had at most MAX_REVIEW_ROUNDS `kiro-review` labels
  5. SPEC    the PR body names the spec comment and its SHA-256 matches the comment body

Everything the gate reads comes from the GitHub API with the job-scoped GITHUB_TOKEN.
It never checks out or runs pull-request code.
"""

import fnmatch
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


def _load_dispatch():
    path = Path(__file__).with_name("dispatch_kiro_event.py")
    spec = importlib.util.spec_from_file_location("dispatch_kiro_event", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


dispatch = _load_dispatch()
DispatchError = dispatch.DispatchError
MAX_REVIEW_ROUNDS = dispatch.MAX_REVIEW_ROUNDS

DEFAULT_API_URL = "https://api.github.com"
# Paths a delivery PR may never touch, whatever the spec says.
DENIED_PATH_PATTERNS = (
    ".github/*",
    ".github/**",
    "infrastructure/*",
    "infrastructure/**",
    ".env",
    ".env.*",
    "**/.env",
    "**/.env.*",
)
VERDICT_PATTERN = re.compile(r"^VERDICT:\s*(approve|request-changes)\b", re.IGNORECASE | re.MULTILINE)
HEAD_REVIEWED_PATTERN = re.compile(r"^HEAD REVIEWED:\s*([0-9a-f]{40})\b", re.IGNORECASE | re.MULTILINE)
SPEC_URL_PATTERN = re.compile(
    r"^Spec:\s*https://github\.com/([A-Za-z0-9._-]+/[A-Za-z0-9._-]+)/issues/(\d+)#issuecomment-(\d+)\s*$",
    re.MULTILINE,
)
SPEC_SHA_PATTERN = re.compile(r"^Spec-SHA256:\s*([0-9a-f]{64})\b", re.IGNORECASE | re.MULTILINE)
FILES_BLOCK_PATTERN = re.compile(r"```files[^\n]*\n(.*?)```", re.DOTALL)
GOOD_CONCLUSIONS = frozenset({"success", "neutral", "skipped"})
# The lifecycle workflow's own jobs also appear as check runs on the head commit, and
# the gate itself is "in progress" while it reads them. They are not the code's CI.
LIFECYCLE_JOB_NAMES = frozenset(
    {
        "issue-plan",
        "issue-deliver",
        "issue-implement",
        "issue-task",
        "pr-review-round",
        "pr-changes",
        "pr-gate",
        "pr-merged",
    }
)
MARKER = "<!-- kiro-gate -->"


class GateError(RuntimeError):
    """The gate could not reach a decision (API failure); the job fails, no label moves."""


# --- pure functions, unit-tested ---------------------------------------------------


def parse_files_block(spec_body):
    """Return the paths/globs in the first ```files block, or None when the spec has none."""
    if not isinstance(spec_body, str):
        return None
    match = FILES_BLOCK_PATTERN.search(spec_body)
    if not match:
        return None
    entries = []
    for line in match.group(1).splitlines():
        line = line.strip().lstrip("-*").strip().strip("`")
        if line and not line.startswith("#"):
            entries.append(line)
    return entries


def path_matches(path, pattern):
    if fnmatch.fnmatchcase(path, pattern):
        return True
    # "dir/" or "dir" in the spec covers everything beneath it.
    directory = pattern.rstrip("/")
    return directory != "" and path.startswith(directory + "/")


def scope_violations(changed_files, allowed):
    """Files outside the allowed list (when given) or inside the deny list."""
    violations = []
    for path in changed_files:
        if any(path_matches(path, pattern) for pattern in DENIED_PATH_PATTERNS):
            violations.append("{} (denied path)".format(path))
        elif allowed is not None and not any(path_matches(path, pattern) for pattern in allowed):
            violations.append("{} (not in the spec's files block)".format(path))
    return violations


def ci_check_runs(check_runs):
    """Check runs that belong to the code's CI, not to the delivery lifecycle itself."""
    return [c for c in check_runs if c.get("name") not in LIFECYCLE_JOB_NAMES]


def latest_verdict(reviews, owner):
    """(verdict, head_sha) from the newest owner review carrying a VERDICT line, else (None, None)."""
    for review in sorted(reviews, key=lambda item: item.get("submitted_at") or "", reverse=True):
        if not dispatch.same_login(dispatch.login_of(review.get("user")), owner):
            continue
        body = review.get("body") or ""
        verdict = VERDICT_PATTERN.search(body)
        if not verdict:
            continue
        head = HEAD_REVIEWED_PATTERN.search(body)
        return verdict.group(1).lower(), head.group(1).lower() if head else None
    return None, None


def count_review_rounds(timeline_events):
    return sum(
        1
        for event in timeline_events
        if event.get("event") == "labeled" and (event.get("label") or {}).get("name") == "kiro-review"
    )


def spec_reference(pr_body):
    """(repository, issue, comment_id, sha256) from the PR body, or raise."""
    body = pr_body or ""
    url = SPEC_URL_PATTERN.search(body)
    sha = SPEC_SHA_PATTERN.search(body)
    if not url:
        raise GateError("PR body has no `Spec: https://github.com/<owner>/<repo>/issues/<n>#issuecomment-<id>` line")
    if not sha:
        raise GateError("PR body has no `Spec-SHA256: <hash>` line")
    return url.group(1), int(url.group(2)), int(url.group(3)), sha.group(1).lower()


def sha256_text(text):
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()


def decide(facts):
    """Turn gathered facts into (passed, [reason lines]). Pure, so it is unit-testable."""
    reasons = []
    head = facts["head_sha"].lower()

    verdict, reviewed = facts["verdict"], facts["reviewed_sha"]
    if verdict != "approve":
        reasons.append("HEAD: latest owner review verdict is {!r}, not approve".format(verdict))
    elif reviewed != head:
        reasons.append("HEAD: review names {} but the PR head is {}".format((reviewed or "no sha")[:12], head[:12]))

    ci_runs = ci_check_runs(facts["check_runs"])
    bad = [c for c in ci_runs if (c.get("conclusion") or "pending") not in GOOD_CONCLUSIONS]
    if not ci_runs:
        if facts.get("require_ci", True):
            reasons.append(
                "CI: no check runs found on the head commit outside the delivery lifecycle's own jobs. "
                "Add a CI workflow that runs on pull requests, or set KIRO_GATE_REQUIRE_CI=false on the "
                "pr-gate job to make this a warning"
            )
        else:
            reasons.append("CI: no check runs on the head commit; KIRO_GATE_REQUIRE_CI=false so this is not blocking (warning)")
    for check in bad:
        reasons.append("CI: {} is {}".format(check.get("name"), check.get("conclusion") or "pending"))

    for violation in scope_violations(facts["changed_files"], facts["allowed_files"]):
        reasons.append("SCOPE: " + violation)
    if facts["allowed_files"] is None:
        reasons.append("SCOPE: the specification has no ```files block; only the deny list was enforced (warning)")

    if facts["rounds"] > MAX_REVIEW_ROUNDS:
        reasons.append("ROUNDS: {} review rounds exceed the limit of {}".format(facts["rounds"], MAX_REVIEW_ROUNDS))

    if facts["spec_sha_matches"] is False:
        reasons.append("SPEC: the Spec-SHA256 in the PR body does not match the specification comment")

    blocking = [r for r in reasons if not r.endswith("(warning)")]
    return not blocking, reasons


# --- GitHub API ---------------------------------------------------------------------


class GitHub:
    def __init__(self, token, repository, api_url=None):
        self.token = token
        self.repository = repository
        self.api_url = (api_url or DEFAULT_API_URL).rstrip("/")

    def request(self, method, path, body=None, accept="application/vnd.github+json"):
        url = path if path.startswith("http") else "{}/repos/{}{}".format(self.api_url, self.repository, path)
        data = json.dumps(body).encode("utf-8") if body is not None else None
        request = urllib.request.Request(
            url,
            data=data,
            method=method,
            headers={
                "Authorization": "Bearer {}".format(self.token),
                "Accept": accept,
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json",
                "User-Agent": "kiro-gate",
            },
        )
        try:
            with dispatch.build_opener().open(request, timeout=30) as response:
                payload = response.read()
                return json.loads(payload) if payload else None
        except urllib.error.HTTPError as error:
            raise GateError("GitHub API {} {} -> HTTP {}".format(method, path, error.code)) from error
        except (urllib.error.URLError, OSError) as error:
            raise GateError("GitHub API {} {} failed: {}".format(method, path, type(error).__name__)) from error

    def paginated(self, path, accept="application/vnd.github+json"):
        items = []
        page = 1
        while True:
            separator = "&" if "?" in path else "?"
            chunk = self.request("GET", "{}{}per_page=100&page={}".format(path, separator, page), accept=accept)
            if not chunk:
                break
            items.extend(chunk)
            if len(chunk) < 100:
                break
            page += 1
        return items


def gather_facts(github, pull_request, owner):
    number = pull_request["number"]
    live = github.request("GET", "/pulls/{}".format(number))
    head_sha = live["head"]["sha"]

    reviews = github.paginated("/pulls/{}/reviews".format(number))
    verdict, reviewed_sha = latest_verdict(reviews, owner)

    check_runs = github.request("GET", "/commits/{}/check-runs".format(head_sha)).get("check_runs", [])

    changed_files = [item["filename"] for item in github.paginated("/pulls/{}/files".format(number))]

    timeline = github.paginated(
        "/issues/{}/timeline".format(number), accept="application/vnd.github.mockingbird-preview+json"
    )
    rounds = count_review_rounds(timeline)

    allowed_files = None
    spec_sha_matches = None
    spec_repository, _issue, comment_id, claimed_sha = spec_reference(live.get("body"))
    if spec_repository.lower() != github.repository.lower():
        raise GateError("Spec comment belongs to another repository")
    comment = github.request("GET", "/issues/comments/{}".format(comment_id))
    if not dispatch.same_login(dispatch.login_of(comment.get("user")), owner):
        raise GateError("Spec comment was not written by the repository owner")
    spec_body = comment.get("body") or ""
    spec_sha_matches = sha256_text(spec_body) == claimed_sha
    allowed_files = parse_files_block(spec_body)

    return {
        "head_sha": head_sha,
        "verdict": verdict,
        "reviewed_sha": reviewed_sha,
        "check_runs": check_runs,
        "changed_files": changed_files,
        "allowed_files": allowed_files,
        "rounds": rounds,
        "spec_sha_matches": spec_sha_matches,
        "require_ci": require_ci(os.environ),
    }


def require_ci(environment):
    """True unless KIRO_GATE_REQUIRE_CI is set to a false-ish value.

    A repository with no CI workflow has no check runs on any commit; by default the gate
    treats that as a block (the reviewer's local test run is then the only evidence), and
    the owner can turn it into a warning once they have decided that is acceptable.
    """
    value = (environment.get("KIRO_GATE_REQUIRE_CI") or "true").strip().lower()
    return value not in {"0", "false", "no", "off"}


def publish(github, number, passed, reasons, head_sha):
    outcome = "kiro-ready-to-merge" if passed else "kiro-parked"
    lines = [MARKER, "## Delivery gate: {}".format("PASS" if passed else "PARKED"), "", "Head `{}`".format(head_sha[:12]), ""]
    lines += ["- {}".format(reason) for reason in reasons] or ["- all checks passed"]
    if passed:
        lines += ["", "The owner can merge. Nothing merges on its own."]
    else:
        lines += ["", "Fix the blocking items and re-label `kiro-review` to start another round, or close the PR."]
    github.request("POST", "/issues/{}/comments".format(number), {"body": "\n".join(lines)})
    try:
        github.request("DELETE", "/issues/{}/labels/{}".format(number, urllib.parse.quote("kiro-ready")))
    except GateError as error:
        # Label already gone is fine; anything else is not.
        if "HTTP 404" not in str(error):
            raise
    github.request("POST", "/issues/{}/labels".format(number), {"labels": [outcome]})
    return outcome


def main():
    environment = os.environ
    try:
        with open(dispatch.require_string(environment, "GITHUB_EVENT_PATH"), encoding="utf-8") as source:
            event = json.load(source)
        dispatch.validate_event("pr-gate", event, environment)
        owner = dispatch.repository_owner(event, environment)
        github = GitHub(
            dispatch.require_string(environment, "GITHUB_TOKEN"),
            dispatch.require_string(environment, "GITHUB_REPOSITORY"),
            environment.get("GITHUB_API_URL"),
        )
        pull_request = event["pull_request"]
        facts = gather_facts(github, pull_request, owner)
        passed, reasons = decide(facts)
        outcome = publish(github, pull_request["number"], passed, reasons, facts["head_sha"])
        print("Delivery gate for PR {}: {}".format(pull_request["number"], outcome))
        for reason in reasons:
            print("  " + reason)
    except (DispatchError, GateError, OSError, json.JSONDecodeError, KeyError) as error:
        raise SystemExit("Delivery gate could not decide: {}".format(error)) from error


if __name__ == "__main__":
    main()
