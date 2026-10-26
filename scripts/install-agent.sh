#!/usr/bin/env bash
# Installs the mate templates for Kiro Crew / kiro-cli into ~/.kiro/agents.
# Run this in a NORMAL terminal: ~/.kiro/agents is a protected path that an agent
# session cannot write to.
#
# Usage: scripts/install-agent.sh            # all templates
#        scripts/install-agent.sh NAME ...   # only the named ones, e.g. delivery-reviewer
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESTINATION_DIR="$HOME/.kiro/agents"
mkdir -p "$DESTINATION_DIR"

if [[ $# -gt 0 ]]; then
  SOURCES=()
  for name in "$@"; do
    match="$(ls "$HERE"/templates/agent/"$name".* 2>/dev/null | head -1 || true)"
    [[ -n "$match" ]] || { echo "No template named $name under templates/agent" >&2; exit 2; }
    SOURCES+=("$match")
  done
else
  SOURCES=("$HERE"/templates/agent/*)
fi

for SOURCE in "${SOURCES[@]}"; do
  BASENAME="$(basename "$SOURCE")"
  DESTINATION="$DESTINATION_DIR/$BASENAME"
  if [[ "$BASENAME" == *.json ]]; then
    python3 -m json.tool "$SOURCE" >/dev/null || { echo "$BASENAME is not valid JSON" >&2; exit 1; }
  fi
  if [[ -e "$DESTINATION" ]] && ! cmp -s "$SOURCE" "$DESTINATION"; then
    BACKUP="$DESTINATION.bak.$(date +%Y%m%d%H%M%S)"
    cp "$DESTINATION" "$BACKUP"
    echo "Existing $BASENAME backed up to $BACKUP"
  fi
  cp "$SOURCE" "$DESTINATION"
  echo "Installed $DESTINATION"
done

cat <<'EOF'

Next: on the Kiro Crew dashboard, Settings > Webhooks > New, create one signed source per
template that receives GitHub events, picking the template as the Agent:

  delivery-planner, delivery-implementer, delivery-reviewer, delivery-scribe, github-worker

Webhook runs read these template files on every run; edit a file and the next run uses it.
Mates are optional (only for a standing chat, e.g. the auditor). See docs/07-quickstart-checklist.md.
EOF
