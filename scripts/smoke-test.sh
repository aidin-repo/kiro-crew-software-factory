#!/usr/bin/env bash
# End-to-end smoke test: creates a tiny issue, applies the kiro-task label as the
# repository owner, waits for Kiro Crew to open a PR, then checks the PR touches
# exactly one expected file.
#
# Usage: scripts/smoke-test.sh OWNER/REPO
# Env:   TIMEOUT_SECS  how long to wait for the PR (default 900)
#        CLEANUP=1     close the PR (deleting its branch) and the issue afterwards
set -euo pipefail

REPO="${1:-}"
TIMEOUT_SECS="${TIMEOUT_SECS:-900}"
if [[ -z "$REPO" || "$REPO" != */* ]]; then
  echo "Usage: $0 OWNER/REPO" >&2
  exit 2
fi

OWNER="${REPO%%/*}"
ME="$(gh api user --jq .login)"
if [[ "$(tr '[:upper:]' '[:lower:]' <<<"$ME")" != "$(tr '[:upper:]' '[:lower:]' <<<"$OWNER")" ]]; then
  echo "You are '$ME' but the repository owner is '$OWNER'. The dispatcher only accepts the label from the owner." >&2
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="docs/kiro-crew-smoke-test.md"
BODY="Task:
1. Create the file $FILE containing exactly one line: Kiro Crew smoke test OK
2. Do not modify any other file.
3. Open a PR that closes this issue.
4. Do not merge, deploy, or change workflows, credentials or infrastructure."

ISSUE_URL="$(gh issue create --repo "$REPO" --title "Smoke test $STAMP: add $FILE" --body "$BODY")"
NUMBER="${ISSUE_URL##*/}"
echo "Created issue #$NUMBER: $ISSUE_URL"

# Label AFTER creating the issue, so the event fires at a moment you control.
gh issue edit "$NUMBER" --repo "$REPO" --add-label kiro-task >/dev/null
echo "Applied label kiro-task. Waiting up to ${TIMEOUT_SECS}s for branch kiro/issue-$NUMBER to get a PR"
echo "(the self-hosted runner must be running: cd <runner dir> && ./run.sh)"

DEADLINE=$(( $(date +%s) + TIMEOUT_SECS ))
PR_URL=""
while [[ "$(date +%s)" -lt "$DEADLINE" ]]; do
  PR_URL="$(gh pr list --repo "$REPO" --head "kiro/issue-$NUMBER" --state all --json url --jq '.[0].url // empty')"
  [[ -n "$PR_URL" ]] && break
  sleep 15
  printf '.'
done
echo

RESULT=1
if [[ -z "$PR_URL" ]]; then
  echo "FAIL  no PR appeared for kiro/issue-$NUMBER within ${TIMEOUT_SECS}s"
  echo "      Check: Actions tab (job queued = runner offline), Kiro Crew notifications, docs/04-lessons-and-troubleshooting.md"
else
  echo "PASS  PR opened: $PR_URL"
  FILES="$(gh pr view "$PR_URL" --json files --jq '[.files[].path] | sort | join(",")')"
  if [[ "$FILES" == "$FILE" ]]; then
    echo "PASS  PR touches exactly: $FILES"
    RESULT=0
  else
    echo "FAIL  PR touches unexpected files: $FILES"
  fi
fi

if [[ "${CLEANUP:-0}" == "1" ]]; then
  [[ -n "$PR_URL" ]] && gh pr close "$PR_URL" --delete-branch --comment "Closing smoke-test PR (not merged)." >/dev/null || true
  gh issue close "$NUMBER" --repo "$REPO" --reason "not planned" >/dev/null || true
  echo "Cleaned up (PR closed, branch deleted, issue closed)."
else
  echo "Not cleaned up. Close the PR WITHOUT merging, and the issue, when you are done."
fi
exit "$RESULT"
