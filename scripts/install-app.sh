#!/usr/bin/env bash
# Build, install, trust and enable the Software Factory app on THIS gateway host.
#
# Run it as the user the Kiro Crew gateway runs as (the dashboard owner), from a
# normal terminal: the gateway refuses installs from any other process. On the EC2
# box that is `ec2-user`; on a laptop it is you.
#
#   scripts/install-app.sh            build + install + trust this app only + enable
#   TRUST=0 scripts/install-app.sh    build + install, then grant trust yourself in the
#                                     dashboard (Apps -> Library -> Enable -> consent)
#   REPO=owner/name scripts/install-app.sh   also point the app at another repository
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT/app/software-factory"
NAME="software-factory"

quiet() { grep -vE "DEBUG|INFO kiro_crew|Cannot restrict" || true; }
die() { echo "error: $*" >&2; exit 1; }

command -v kirocrew >/dev/null 2>&1 || die "kirocrew is not on PATH; this must run on the gateway host"
command -v npm >/dev/null 2>&1 || die "npm is required to build the page (Node 18 or newer)"
command -v gh >/dev/null 2>&1 || echo "warning: gh not found; the app needs a logged-in gh to read the repository" >&2

echo "==> Building the page"
( cd "$APP_DIR/ui" && npm install --no-audit --no-fund --silent && npm run build --silent )
[ -f "$APP_DIR/ui/dist/index.mjs" ] || die "build produced no ui/dist/index.mjs"

echo "==> Installing $NAME from $APP_DIR"
kirocrew app install "$APP_DIR" 2>&1 | quiet

if [ "${TRUST:-1}" = "1" ]; then
  echo "==> Granting execution trust to $NAME only (not to all third-party apps)"
  for key in agent.apps_trusted agent.apps_trusted_local; do
    current="$(kirocrew config get "$key" 2>/dev/null | quiet | tr -d '\n' || true)"
    merged_b64="$(python3 - "$current" "$NAME" <<'PY'
import base64, json, sys
raw, name = sys.argv[1].strip(), sys.argv[2]
try:
    cur = json.loads(raw) if raw else []
except ValueError:
    cur = []
if not isinstance(cur, list):
    cur = []
names = sorted({c for c in cur if isinstance(c, str)} | {name})
print(base64.b64encode(json.dumps(names, separators=(",", ":")).encode()).decode())
PY
)"
    kirocrew config set "$key" --value-base64="$merged_b64" 2>&1 | quiet
  done
fi

echo "==> Enabling"
kirocrew app enable "$NAME" 2>&1 | quiet

if [ -n "${REPO:-}" ]; then
  echo "==> Pointing the app at $REPO"
  mkdir -p "$HOME/.kiro/crew/apps/$NAME/data"
  printf '{"repo": "%s"}\n' "$REPO" > "$HOME/.kiro/crew/apps/$NAME/data/config.json"
  echo "    (takes effect when the backend restarts: kirocrew app disable $NAME && kirocrew app enable $NAME)"
fi

echo
kirocrew app list 2>&1 | quiet | grep -E "^NAME|^$NAME" || true
echo
echo "Reload the dashboard; Software Factory is in the sidebar under Apps."
echo "Not in the list, or disabled? Open Apps -> Library in the dashboard and press Enable; the consent dialog grants trust."
