#!/usr/bin/env bash
# Read-only readiness check. Changes nothing, prints PASS / WARN / FAIL per item.
#
# Usage: scripts/preflight.sh OWNER/REPO
set -u

REPO="${1:-}"
if [[ -z "$REPO" || "$REPO" != */* ]]; then
  echo "Usage: $0 OWNER/REPO" >&2
  exit 2
fi

FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
warn() { printf '  WARN  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

echo "Local tools"
for tool in gh git python3 curl; do
  if command -v "$tool" >/dev/null 2>&1; then pass "$tool installed"; else fail "$tool not found"; fi
done

echo "GitHub access"
if gh auth status >/dev/null 2>&1; then
  pass "gh is authenticated"
else
  fail "gh is not authenticated (run: gh auth login)"
fi

# The crewmate pushes over HTTPS using git, which needs a credential helper.
if git config --get-urlmatch credential.helper https://github.com 2>/dev/null | grep -q .; then
  pass "git has a credential helper for github.com"
else
  warn "git has no credential helper for github.com, so the crewmate cannot push (run: gh auth setup-git)"
fi

if gh repo view "$REPO" >/dev/null 2>&1; then
  pass "repository $REPO is reachable"
  VISIBILITY="$(gh repo view "$REPO" --json visibility --jq .visibility 2>/dev/null)"
  if [[ "$VISIBILITY" == "PRIVATE" ]]; then
    pass "repository visibility is PRIVATE"
  else
    fail "repository is ${VISIBILITY:-unknown}, not PRIVATE: do not run a laptop self-hosted runner on it"
  fi
else
  fail "cannot read $REPO with the current gh login"
fi

echo "Repository configuration"
LABELS="$(gh label list --repo "$REPO" --limit 200 --json name --jq '.[].name' 2>/dev/null || true)"
for label in kiro-plan kiro-deliver kiro-approved kiro-needs-owner kiro-task kiro-review kiro-changes-requested kiro-ready kiro-ready-to-merge kiro-parked; do
  if grep -qx "$label" <<<"$LABELS"; then
    pass "label $label exists"
  else
    fail "label $label missing (run scripts/setup-github.sh)"
  fi
done

SECRETS="$(gh secret list --repo "$REPO" --json name --jq '.[].name' 2>/dev/null)"
for name in KIROCREW_WEBHOOK_TOKEN KIROCREW_WEBHOOK_SIGNING_SECRET; do
  if grep -qx "$name" <<<"$SECRETS"; then pass "secret $name is set"; else fail "secret $name missing"; fi
done

for path in .github/workflows/kiro-crew-events.yml .github/scripts/dispatch_kiro_event.py; do
  if gh api "repos/$REPO/contents/$path" >/dev/null 2>&1; then
    pass "$path is on the default branch"
  else
    fail "$path not found on the default branch (merge it first)"
  fi
done

echo "Self-hosted runner"
RUNNERS="$(gh api "repos/$REPO/actions/runners" --jq '.runners[] | select(any(.labels[]; .name == "kirocrew")) | "\(.name) \(.status)"' 2>/dev/null)"
if [[ -z "$RUNNERS" ]]; then
  fail "no runner with label kirocrew is registered (run scripts/install-runner.sh)"
elif grep -q ' online$' <<<"$RUNNERS"; then
  pass "a kirocrew runner is online: $(grep ' online$' <<<"$RUNNERS" | head -n 1 | cut -d' ' -f1)"
else
  warn "kirocrew runner(s) registered but offline: $(tr '\n' ';' <<<"$RUNNERS") start it with ./run.sh"
fi

echo "Kiro Crew gateway"
CODE="$(curl -s -o /dev/null -m 5 -w '%{http_code}' http://127.0.0.1:5476/ 2>/dev/null)"
if [[ -n "$CODE" && "$CODE" != "000" ]]; then
  pass "gateway answers on 127.0.0.1:5476 (HTTP $CODE)"
else
  fail "nothing answers on 127.0.0.1:5476 (is the Kiro Crew gateway running?)"
fi
for template in delivery-planner.json delivery-implementer.json delivery-reviewer.json delivery-scribe.json delivery-auditor.md github-worker.json; do
  if [[ -f "$HOME/.kiro/agents/$template" ]]; then
    pass "agent template ~/.kiro/agents/$template present"
  else
    warn "agent template ~/.kiro/agents/$template not found (run scripts/install-agent.sh)"
  fi
done

echo
if [[ "$FAILS" -eq 0 ]]; then
  echo "Ready. Next: scripts/smoke-test.sh $REPO"
else
  echo "$FAILS check(s) failed. Fix them, then re-run."
  exit 1
fi
