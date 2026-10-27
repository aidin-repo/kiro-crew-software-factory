#!/usr/bin/env bash
# Installs the agent templates for Kiro Crew / kiro-cli into ~/.kiro/agents.
# Run this in a NORMAL terminal: ~/.kiro/agents is a protected path that an agent
# session cannot write to.
#
# Usage: scripts/install-agent.sh                 # all templates
#        scripts/install-agent.sh NAME ...        # only the named ones, e.g. delivery-reviewer
#        scripts/install-agent.sh --keep [NAME..] # never overwrite an installed file you edited by hand
#
# Customizing (see docs/08-customizing-the-agents.md):
#   templates/agent.local/<name>.json   a file here REPLACES the shipped template of the same name,
#                                       and a new name here installs as a new role. The folder is
#                                       git-ignored, so `git pull` never touches your prompts.
#   --keep                              if ~/.kiro/agents/<name> differs from BOTH the shipped and the
#                                       local template, leave it alone and say so (an in-place edit).
#                                       Without --keep it is backed up to <name>.bak.<timestamp> and
#                                       replaced, as before.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHIPPED="$HERE/templates/agent"
LOCAL="$HERE/templates/agent.local"
DESTINATION_DIR="$HOME/.kiro/agents"
mkdir -p "$DESTINATION_DIR"

KEEP=0
if [[ "${1:-}" == "--keep" ]]; then KEEP=1; shift; fi

# Resolve the source for one template name: local override wins over shipped.
source_for() {
  local name="$1" match
  match="$(ls "$LOCAL"/"$name".* 2>/dev/null | head -1 || true)"
  [[ -n "$match" ]] && { echo "$match"; return; }
  match="$(ls "$SHIPPED"/"$name".* 2>/dev/null | head -1 || true)"
  echo "$match"
}

if [[ $# -gt 0 ]]; then
  NAMES=("$@")
else
  # Every shipped name plus every local-only name, each once.
  NAMES=()
  for f in "$SHIPPED"/* "$LOCAL"/*; do
    [[ -e "$f" ]] || continue
    n="$(basename "$f")"; n="${n%.*}"
    [[ " ${NAMES[*]:-} " == *" $n "* ]] || NAMES+=("$n")
  done
fi

for NAME in "${NAMES[@]}"; do
  SOURCE="$(source_for "$NAME")"
  [[ -n "$SOURCE" ]] || { echo "No template named $NAME under templates/agent or templates/agent.local" >&2; exit 2; }
  BASENAME="$(basename "$SOURCE")"
  DESTINATION="$DESTINATION_DIR/$BASENAME"
  ORIGIN="shipped"
  [[ "$SOURCE" == "$LOCAL"/* ]] && ORIGIN="local override"
  if [[ "$BASENAME" == *.json ]]; then
    python3 -m json.tool "$SOURCE" >/dev/null || { echo "$BASENAME is not valid JSON" >&2; exit 1; }
    # The webhook source routes by the template's "name"; it must match the file name.
    INNER="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("name",""))' "$SOURCE")"
    [[ "$INNER" == "$NAME" ]] || { echo "$BASENAME: its \"name\" is \"$INNER\" but the file is $NAME; make them equal" >&2; exit 1; }
  fi
  if [[ -e "$DESTINATION" ]] && ! cmp -s "$SOURCE" "$DESTINATION"; then
    if [[ "$KEEP" == "1" ]] && ! cmp -s "$SHIPPED/$BASENAME" "$DESTINATION" 2>/dev/null; then
      echo "Kept     $DESTINATION (edited in place; differs from the $ORIGIN template; drop --keep to replace)"
      continue
    fi
    BACKUP="$DESTINATION.bak.$(date +%Y%m%d%H%M%S)"
    cp "$DESTINATION" "$BACKUP"
    echo "Existing $BASENAME backed up to $BACKUP"
  fi
  cp "$SOURCE" "$DESTINATION"
  echo "Installed $DESTINATION ($ORIGIN)"
done

cat <<'EOF'

Next:
  1. scripts/setup-gateway.sh
     Webhook runs are unattended: this writes the auto-approve rules the templates need and
     checks that gh, git, node, npm, npx, shasum live in /usr/bin. Run its "->" lines, re-run.
  2. On the Kiro Crew dashboard, Settings > Webhooks > New, one signed source per template that
     receives GitHub events, picking the template as the Agent:
       delivery-planner, delivery-implementer, delivery-reviewer, delivery-scribe, github-worker

Webhook runs read these template files on every run; edit a file and the next run uses it.
To change a prompt without losing it on the next `git pull`, copy the template into
templates/agent.local/ and edit it there (docs/08-customizing-the-agents.md).
Mates are optional (only for a standing chat, e.g. the auditor). See docs/07-quickstart-checklist.md.
EOF
