#!/usr/bin/env bash
# Copies the workflow, dispatcher, gate, tests and mate templates into a local clone of
# your repository. It does NOT commit or push: review the files, then open a PR yourself.
#
# Usage: scripts/install-into-repo.sh PATH_TO_LOCAL_CLONE
# Set FORCE=1 to overwrite files that already exist and differ.
set -euo pipefail

TARGET="${1:-}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "$TARGET" ]] || ! git -C "$TARGET" rev-parse --git-dir >/dev/null 2>&1; then
  echo "Usage: $0 PATH_TO_LOCAL_CLONE (must be a git repository)" >&2
  exit 2
fi

copy_file() {
  local source="$1" destination="$2"
  mkdir -p "$(dirname "$destination")"
  if [[ -e "$destination" ]] && ! cmp -s "$source" "$destination"; then
    if [[ "${FORCE:-0}" != "1" ]]; then
      echo "SKIP  $destination exists and differs (set FORCE=1 to overwrite)"
      return
    fi
  fi
  cp "$source" "$destination"
  echo "COPY  $destination"
}

copy_file "$HERE/templates/workflows/kiro-crew-events.yml" "$TARGET/.github/workflows/kiro-crew-events.yml"
copy_file "$HERE/templates/scripts/dispatch_kiro_event.py" "$TARGET/.github/scripts/dispatch_kiro_event.py"
copy_file "$HERE/templates/scripts/kiro_gate.py" "$TARGET/.github/scripts/kiro_gate.py"
copy_file "$HERE/templates/scripts/tests/test_dispatch_kiro_event.py" "$TARGET/.github/scripts/tests/test_dispatch_kiro_event.py"
copy_file "$HERE/templates/scripts/tests/test_kiro_gate.py" "$TARGET/.github/scripts/tests/test_kiro_gate.py"
# Mate templates are versioned with the repository so the prompts travel with the code.
for agent in "$HERE"/templates/agent/*; do
  copy_file "$agent" "$TARGET/.github/kiro-agents/$(basename "$agent")"
done

cat <<EOF

Review, test and merge (the workflow only fires from the default branch):

  cd "$TARGET"
  git checkout -b chore/kiro-crew-delivery-lifecycle
  python3 -m pytest .github/scripts/tests -q
  git add .github/workflows/kiro-crew-events.yml .github/scripts .github/kiro-agents
  git commit -m "ci: add Kiro Crew delivery lifecycle"
  git push -u origin chore/kiro-crew-delivery-lifecycle
  gh pr create --fill

Protect the default branch so the agent cannot change these files unreviewed. Use a
ruleset that requires a pull request and does NOT let admins bypass it (docs/01, section 1.5).
EOF
