#!/usr/bin/env bash
# One-time GitHub activation for a repository:
#   1. creates (or updates) the kiro-task label
#   2. stores the two Kiro Crew webhook credentials as repository Actions secrets
#
# Usage:
#   export KIROCREW_WEBHOOK_TOKEN='...'            # bearer token from the Kiro Crew Webhooks page
#   export KIROCREW_WEBHOOK_SIGNING_SECRET='...'   # signing secret shown with it
#   scripts/setup-github.sh OWNER/REPO
#
# If the variables are not exported, you are prompted (input is hidden). The values
# are piped to `gh secret set` and never printed or written to disk by this script.
set -euo pipefail

REPO="${1:-}"
if [[ -z "$REPO" || "$REPO" != */* ]]; then
  echo "Usage: $0 OWNER/REPO" >&2
  exit 2
fi

command -v gh >/dev/null 2>&1 || { echo "gh CLI is required" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Run 'gh auth login' first" >&2; exit 1; }

VISIBILITY="$(gh repo view "$REPO" --json visibility --jq .visibility)"
if [[ "$VISIBILITY" == "PUBLIC" ]]; then
  echo "Refusing: $REPO is PUBLIC. A self-hosted runner on your own machine must only serve private repositories." >&2
  exit 1
fi

echo "Creating label kiro-task on $REPO"
gh label create kiro-task \
  --repo "$REPO" \
  --color 5319e7 \
  --description "Owner-approved: Kiro Crew implements this issue and opens a PR" \
  --force

read_secret() {
  local name="$1" value="${!1:-}"
  if [[ -z "$value" ]]; then
    read -r -s -p "Enter $name: " value
    echo
  fi
  if [[ -z "$value" ]]; then
    echo "$name is empty" >&2
    exit 1
  fi
  printf '%s' "$value" | gh secret set "$name" --repo "$REPO"
}

echo "Storing Actions secrets on $REPO"
read_secret KIROCREW_WEBHOOK_TOKEN
read_secret KIROCREW_WEBHOOK_SIGNING_SECRET

cat <<EOF

Done. Next steps:
  1. scripts/install-into-repo.sh <path-to-local-clone>   (adds workflow + dispatcher, you review and merge)
  2. scripts/install-runner.sh $REPO                        (registers this machine as the runner)
  3. scripts/preflight.sh $REPO
EOF
