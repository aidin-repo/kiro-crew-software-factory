#!/usr/bin/env bash
# Downloads, verifies and registers a GitHub Actions self-hosted runner labelled
# "kirocrew" for ONE repository. It does not start the runner.
#
# Usage: scripts/install-runner.sh OWNER/REPO [RUNNER_DIR] [RUNNER_NAME]
#   RUNNER_DIR   default: $HOME/actions-runner-kirocrew
#   RUNNER_NAME  default: kirocrew-$(hostname -s)
# Needs repository admin rights (to request a registration token).
# Set REPLACE=1 to unregister and remove a runner already installed in RUNNER_DIR first.
set -euo pipefail

REPO="${1:-}"
RUNNER_DIR="${2:-$HOME/actions-runner-kirocrew}"
RUNNER_NAME="${3:-kirocrew-$(hostname -s)}"

if [[ -z "$REPO" || "$REPO" != */* ]]; then
  echo "Usage: $0 OWNER/REPO [RUNNER_DIR] [RUNNER_NAME]" >&2
  exit 2
fi
command -v gh >/dev/null 2>&1 || { echo "gh CLI is required" >&2; exit 1; }

VISIBILITY="$(gh repo view "$REPO" --json visibility --jq .visibility)"
if [[ "$VISIBILITY" != "PRIVATE" ]]; then
  echo "Refusing: $REPO is $VISIBILITY. Only attach a personal machine to a PRIVATE repository." >&2
  exit 1
fi

case "$(uname -s)-$(uname -m)" in
  Darwin-arm64)  PLATFORM="osx-arm64" ;;
  Darwin-x86_64) PLATFORM="osx-x64" ;;
  Linux-x86_64)  PLATFORM="linux-x64" ;;
  Linux-aarch64) PLATFORM="linux-arm64" ;;
  *) echo "Unsupported platform: $(uname -s)-$(uname -m)" >&2; exit 1 ;;
esac

if [[ -e "$RUNNER_DIR/.runner" && "${REPLACE:-0}" != "1" ]]; then
  echo "$RUNNER_DIR already holds a configured runner. Set REPLACE=1 to remove it and register a new one." >&2
  exit 1
fi

# Read the release once, by tag, so the archive and its checksum cannot come from
# two different releases if one is published in between.
TAG="$(gh api repos/actions/runner/releases/latest --jq .tag_name)"
VERSION="${TAG#v}"
ARCHIVE="actions-runner-${PLATFORM}-${VERSION}.tar.gz"
URL="https://github.com/actions/runner/releases/download/${TAG}/${ARCHIVE}"
EXPECTED="$(gh api "repos/actions/runner/releases/tags/${TAG}" --jq .body \
  | sed -n "s/.*BEGIN SHA ${PLATFORM} -->\([0-9a-f]\{64\}\)<!-- END SHA ${PLATFORM}.*/\1/p" | head -n 1)"

if [[ -z "$EXPECTED" ]]; then
  echo "Could not find the published SHA-256 for ${PLATFORM} in the release notes; refusing to continue." >&2
  exit 1
fi

# sha256sum is standard on Linux; macOS ships shasum.
sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | cut -d' ' -f1
  else
    echo "Need sha256sum or shasum to verify the download" >&2
    return 1
  fi
}

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"
echo "Downloading $ARCHIVE"
curl -fsSL -o "$ARCHIVE" "$URL"

ACTUAL="$(sha256_of "$ARCHIVE")"
if [[ "$ACTUAL" != "$EXPECTED" ]]; then
  echo "Checksum mismatch for $ARCHIVE (expected $EXPECTED, got $ACTUAL). Aborting." >&2
  rm -f "$ARCHIVE"
  exit 1
fi
echo "Checksum verified"

# REPLACE=1: unregister and remove the old runner first. config.sh refuses to run
# over an existing .runner file, and --replace below only covers a same-named runner
# on the GitHub side.
if [[ -e .runner ]]; then
  echo "Removing the existing runner registration"
  if [[ -e .service ]]; then
    ./svc.sh stop || true
    ./svc.sh uninstall || true
  fi
  REMOVE_TOKEN="$(gh api -X POST "repos/$REPO/actions/runners/remove-token" --jq .token)"
  ./config.sh remove --token "$REMOVE_TOKEN"
fi

tar xzf "$ARCHIVE"
rm -f "$ARCHIVE"

# Registration tokens are short-lived (about an hour) and single purpose.
REG_TOKEN="$(gh api -X POST "repos/$REPO/actions/runners/registration-token" --jq .token)"
./config.sh --unattended \
  --url "https://github.com/$REPO" \
  --token "$REG_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels kirocrew \
  --replace

cat <<EOF

Runner "$RUNNER_NAME" is registered for $REPO with labels: self-hosted, kirocrew (plus OS/arch).
Start it in a normal terminal (keep it open):

  cd "$RUNNER_DIR"
  ./run.sh

Optional - start at login instead (macOS LaunchAgent / Linux systemd):

  cd "$RUNNER_DIR"
  ./svc.sh install && ./svc.sh start

Remember: while the runner is stopped, labelled issues simply queue until it comes back.
EOF
