#!/usr/bin/env bash
# One-time GitHub activation for a repository:
#   1. creates (or updates) every lifecycle label
#   2. stores the Kiro Crew webhook credentials as repository Actions secrets,
#      one token + signing secret pair per mate
#
# Usage:
#   export KIROCREW_WEBHOOK_TOKEN='...'                  # planner source (also used by kiro-plan)
#   export KIROCREW_WEBHOOK_SIGNING_SECRET='...'
#   export KIROCREW_WEBHOOK_TOKEN_IMPLEMENTER='...'      # implementer source
#   export KIROCREW_WEBHOOK_SIGNING_SECRET_IMPLEMENTER='...'
#   export KIROCREW_WEBHOOK_TOKEN_REVIEWER='...'         # reviewer source
#   export KIROCREW_WEBHOOK_SIGNING_SECRET_REVIEWER='...'
#   export KIROCREW_WEBHOOK_TOKEN_SCRIBE='...'           # scribe source (docs PR after merge)
#   export KIROCREW_WEBHOOK_SIGNING_SECRET_SCRIBE='...'
#   export KIROCREW_WEBHOOK_TOKEN_WORKER='...'           # github-worker source (kiro-task fast lane)
#   export KIROCREW_WEBHOOK_SIGNING_SECRET_WORKER='...'
#   scripts/setup-github.sh OWNER/REPO
#
# Any variable you leave unset is prompted for (input hidden). Press Enter at a prompt to
# skip that pair: the matching hop then fails with a 401 until you add it, and nothing else
# is affected. The values are piped to `gh secret set` and never printed or written to disk.
set -euo pipefail

REPO="${1:-}"
if [[ -z "$REPO" || "$REPO" != */* ]]; then
  echo "Usage: $0 OWNER/REPO" >&2
  exit 2
fi

command -v gh >/dev/null 2>&1 || { echo "gh CLI is required" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Run 'gh auth login' first" >&2; exit 1; }

VISIBILITY="$(gh repo view "$REPO" --json visibility --jq .visibility)"
if [[ "$VISIBILITY" != "PRIVATE" ]]; then
  echo "Refusing: $REPO is $VISIBILITY. A self-hosted runner on your own machine must only serve private repositories." >&2
  exit 1
fi

make_label() {
  local name="$1" color="$2" description="$3"
  gh label create "$name" --repo "$REPO" --color "$color" --description "$description" --force >/dev/null
  echo "  label $name"
}

echo "Creating lifecycle labels on $REPO"
make_label kiro-plan               1d76db "Owner wants an AIDLC spec; approves by hand with kiro-approved"
make_label kiro-deliver            0052cc "Owner wants a spec and automatic approval"
make_label kiro-approved           0e8a16 "Spec approved; the implementer starts"
make_label kiro-needs-owner        d93f0b "Planner withheld approval; read the spec, then apply kiro-approved"
make_label kiro-task               5319e7 "Fast lane: github-worker implements the issue text directly, no spec or review"
make_label kiro-review             fbca04 "Pull request waiting for the independent reviewer"
make_label kiro-changes-requested  e99695 "Reviewer requested changes; the implementer fixes them"
make_label kiro-ready              0e8a16 "Reviewer approved; the deterministic gate runs"
make_label kiro-ready-to-merge     006b75 "Gate passed; the owner may merge"
make_label kiro-parked             5319e7 "Gate failed or round limit reached; the owner decides"

read_secret() {
  local name="$1" value="${!1:-}"
  if [[ -z "$value" ]]; then
    read -r -s -p "Enter $name (Enter to skip): " value
    echo
  fi
  if [[ -z "$value" ]]; then
    echo "  skipped $name"
    return
  fi
  printf '%s' "$value" | gh secret set "$name" --repo "$REPO"
  echo "  set $name"
}

echo "Storing Actions secrets on $REPO (one webhook source per mate)"
read_secret KIROCREW_WEBHOOK_TOKEN
read_secret KIROCREW_WEBHOOK_SIGNING_SECRET
read_secret KIROCREW_WEBHOOK_TOKEN_IMPLEMENTER
read_secret KIROCREW_WEBHOOK_SIGNING_SECRET_IMPLEMENTER
read_secret KIROCREW_WEBHOOK_TOKEN_REVIEWER
read_secret KIROCREW_WEBHOOK_SIGNING_SECRET_REVIEWER
read_secret KIROCREW_WEBHOOK_TOKEN_SCRIBE
read_secret KIROCREW_WEBHOOK_SIGNING_SECRET_SCRIBE
read_secret KIROCREW_WEBHOOK_TOKEN_WORKER
read_secret KIROCREW_WEBHOOK_SIGNING_SECRET_WORKER

cat <<EOF

Done. Next steps:
  1. scripts/install-into-repo.sh <path-to-local-clone>   (adds workflow, dispatcher, gate and tests; you review and merge)
  2. scripts/install-runner.sh $REPO                        (registers this machine as the runner)
  3. scripts/preflight.sh $REPO
EOF
