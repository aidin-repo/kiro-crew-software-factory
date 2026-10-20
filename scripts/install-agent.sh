#!/usr/bin/env bash
# Installs the github-worker agent template for Kiro Crew / kiro-cli.
# Run this in a NORMAL terminal: ~/.kiro/agents is a protected path that an agent
# session cannot write to.
#
# Usage: scripts/install-agent.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$HERE/templates/agent/github-worker.json"
DESTINATION_DIR="$HOME/.kiro/agents"
DESTINATION="$DESTINATION_DIR/github-worker.json"

python3 -m json.tool "$SOURCE" >/dev/null || { echo "Template is not valid JSON" >&2; exit 1; }

mkdir -p "$DESTINATION_DIR"
if [[ -e "$DESTINATION" ]] && ! cmp -s "$SOURCE" "$DESTINATION"; then
  BACKUP="$DESTINATION.bak.$(date +%Y%m%d%H%M%S)"
  cp "$DESTINATION" "$BACKUP"
  echo "Existing agent backed up to $BACKUP"
fi
cp "$SOURCE" "$DESTINATION"
echo "Installed $DESTINATION"
echo "This installs a plain agent template. The tested setup uses a crewmate named github-worker"
echo "bound to its own template, with the webhook routed to it: see docs/02-kiro-crew-setup.md, section 2.3."
echo "If a github-worker crewmate already exists, this file is its private template copy:"
echo "restart Kiro Crew afterwards, then run a test issue (docs/03-testing.md)."
