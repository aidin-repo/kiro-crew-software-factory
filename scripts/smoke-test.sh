#!/usr/bin/env bash
# End-to-end smoke test of the delivery lifecycle: creates a small issue, applies
# kiro-deliver as the repository owner, then follows the labels through planner,
# implementer, reviewer and gate until the PR reads kiro-ready-to-merge.
#
# Usage: scripts/smoke-test.sh OWNER/REPO
# Env:   MODE=deliver  (default) full lifecycle; expects kiro-ready-to-merge
#        MODE=task     fast lane only: kiro-task, wait for a PR touching one file
#        TIMEOUT_SECS  how long to wait overall (default 1200)
#        CLEANUP=1     close the PR (deleting its branch) and the issue afterwards
set -euo pipefail

REPO="${1:-}"
MODE="${MODE:-deliver}"
TIMEOUT_SECS="${TIMEOUT_SECS:-1200}"
if [[ -z "$REPO" || "$REPO" != */* ]]; then
  echo "Usage: $0 OWNER/REPO" >&2
  exit 2
fi
if [[ "$MODE" != "deliver" && "$MODE" != "task" ]]; then
  echo "MODE must be deliver or task" >&2
  exit 2
fi

OWNER="${REPO%%/*}"
ME="$(gh api user --jq .login)"
if [[ "$(tr '[:upper:]' '[:lower:]' <<<"$ME")" != "$(tr '[:upper:]' '[:lower:]' <<<"$OWNER")" ]]; then
  echo "You are '$ME' but the repository owner is '$OWNER'. The dispatcher only accepts labels from the owner." >&2
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="docs/kiro-crew-smoke-test.md"
if [[ "$MODE" == "task" ]]; then
  LABEL="kiro-task"
  BODY="Task:
1. Create the file $FILE containing exactly one line: Kiro Crew smoke test OK
2. Do not modify any other file.
3. Open a PR that closes this issue.
4. Do not merge, deploy, or change workflows, credentials or infrastructure."
else
  LABEL="kiro-deliver"
  BODY="## What
Add a documentation file $FILE whose entire content is the single line: Kiro Crew smoke test OK

## Why
This exercises the delivery lifecycle end to end with a change that cannot break anything.

## Acceptance
- The file $FILE exists on the branch with exactly that one line.
- No other file changes.
- Existing tests still pass."
fi

ISSUE_URL="$(gh issue create --repo "$REPO" --title "Smoke test $STAMP ($MODE): add $FILE" --body "$BODY")"
NUMBER="${ISSUE_URL##*/}"
PR_URL=""
echo "Created issue #$NUMBER: $ISSUE_URL"

cleanup() {
  if [[ "${CLEANUP:-0}" == "1" ]]; then
    [[ -n "$PR_URL" ]] && gh pr close "$PR_URL" --delete-branch --comment "Closing smoke-test PR (not merged)." >/dev/null || true
    gh issue close "$NUMBER" --repo "$REPO" --reason "not planned" >/dev/null || true
    echo "Cleaned up (PR closed, branch deleted, issue closed)."
  else
    echo "Not cleaned up. Close the PR WITHOUT merging, and issue #$NUMBER, when you are done."
  fi
}
trap cleanup EXIT

gh issue edit "$NUMBER" --repo "$REPO" --add-label "$LABEL" >/dev/null
echo "Applied label $LABEL at $(date +%H:%M:%S). Waiting up to ${TIMEOUT_SECS}s."
echo "(the self-hosted runner must be running: cd <runner dir> && ./run.sh)"

DEADLINE=$(( $(date +%s) + TIMEOUT_SECS ))
issue_labels() { gh issue view "$NUMBER" --repo "$REPO" --json labels --jq '[.labels[].name] | join(",")' 2>/dev/null || true; }
pr_labels()    { gh pr view "$PR_URL" --json labels --jq '[.labels[].name] | join(",")' 2>/dev/null || true; }
find_pr()      { gh pr list --repo "$REPO" --head "kiro/issue-$NUMBER" --state all --json url --jq '.[0].url // empty' 2>/dev/null || true; }

SEEN=""
mark() { if [[ "$SEEN" != *"|$1|"* ]]; then SEEN="$SEEN|$1|"; echo "$(date +%H:%M:%S)  $1"; fi; }

RESULT=1
while [[ "$(date +%s)" -lt "$DEADLINE" ]]; do
  IL="$(issue_labels)"
  [[ "$IL" == *kiro-needs-owner* ]] && { mark "HELD   planner applied kiro-needs-owner; read the spec comment"; break; }
  [[ "$IL" == *kiro-approved* ]] && mark "STAGE  kiro-approved on the issue (planner done)"
  if [[ -z "$PR_URL" ]]; then
    PR_URL="$(find_pr)"
    [[ -n "$PR_URL" ]] && mark "STAGE  PR opened: $PR_URL"
  fi
  if [[ -n "$PR_URL" ]]; then
    PL="$(pr_labels)"
    if [[ "$MODE" == "task" ]]; then RESULT=0; break; fi
    [[ "$PL" == *kiro-review* ]] && mark "STAGE  kiro-review (waiting for reviewer)"
    [[ "$PL" == *kiro-changes-requested* ]] && mark "STAGE  kiro-changes-requested (another round)"
    [[ "$PL" == *kiro-ready* && "$PL" != *kiro-ready-to-merge* ]] && mark "STAGE  kiro-ready (gate running)"
    [[ "$PL" == *kiro-parked* ]] && { mark "PARKED gate parked the PR; read its comment"; break; }
    [[ "$PL" == *kiro-ready-to-merge* ]] && { mark "STAGE  kiro-ready-to-merge"; RESULT=0; break; }
  fi
  sleep 15
done

if [[ -z "$PR_URL" ]]; then
  echo "FAIL  no PR appeared for kiro/issue-$NUMBER within ${TIMEOUT_SECS}s"
  echo "      Check: Actions tab (job queued = runner offline), issue labels, Kiro Crew notifications, docs/09"
  exit 1
fi

FILES="$(gh pr view "$PR_URL" --json files --jq '[.files[].path] | sort | join(",")')"
if [[ "$FILES" == "$FILE" ]]; then
  echo "PASS  PR touches exactly: $FILES"
else
  echo "FAIL  PR touches unexpected files: $FILES"
  RESULT=1
fi

if [[ "$MODE" == "deliver" && "$RESULT" -eq 0 ]]; then
  VERDICT="$(gh api "repos/$REPO/pulls/${PR_URL##*/}/reviews" --jq '[.[] | .body | split("\n")[0] | select(startswith("VERDICT:"))] | last // empty')"
  if [[ "$VERDICT" == "VERDICT: approve" ]]; then
    echo "PASS  reviewer: $VERDICT"
  else
    echo "FAIL  no approving VERDICT review found (got: ${VERDICT:-none})"
    RESULT=1
  fi
  GATE="$(gh pr view "$PR_URL" --json comments --jq '[.comments[] | select(.body | contains("kiro-gate")) | .body | split("\n")[1]] | last // empty')"
  if [[ "$GATE" == *PASS* ]]; then
    echo "PASS  gate: $GATE"
  else
    echo "FAIL  gate comment missing or not PASS (got: ${GATE:-none})"
    RESULT=1
  fi
fi

if [[ "$RESULT" -eq 0 ]]; then
  echo "PASS  lifecycle complete for issue #$NUMBER"
else
  echo "FAIL  see the stages above; docs/09-lessons-and-troubleshooting.md"
fi
exit "$RESULT"
