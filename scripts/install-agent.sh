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

These are plain agent templates. Each pipeline stage runs as a MATE bound to one of them,
with its own memory, and each mate has its own webhook source. Create the mates once
(names must differ from the template names):

  kirocrew agent create --name planner     --kiro-agent delivery-planner     --display-name "Delivery Planner"
  kirocrew agent create --name implementer --kiro-agent delivery-implementer --display-name "Delivery Implementer"
  kirocrew agent create --name reviewer    --kiro-agent delivery-reviewer    --display-name "Delivery Reviewer"
  kirocrew agent create --name scribe      --kiro-agent delivery-scribe      --display-name "Delivery Scribe"
  kirocrew agent create --name auditor     --kiro-agent delivery-auditor     --display-name "Delivery Auditor"
  kirocrew agent create --name worker      --kiro-agent github-worker        --display-name "GitHub Worker"

A mate copies its template when it is created. After you change a template, recreate the
mate (kirocrew agent delete NAME, then create again) so it picks up the new prompt; the
webhook source keeps routing to the same name. See docs/06-delivery-lifecycle.md.
EOF
