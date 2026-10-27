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

# SERVICE=1: install and start it as a service so it survives logout and reboot.
# macOS: a LaunchAgent for this user. Linux: a systemd unit (svc.sh needs sudo).
# Containers without systemd: use the nohup line printed below instead.
if [[ "${SERVICE:-0}" == "1" ]]; then
  if [[ "$(uname -s)" == "Linux" ]] && ! command -v systemctl >/dev/null 2>&1; then
    echo "No systemd here (container?). Start the runner with the nohup line below." >&2
  else
    SUDO=""
    [[ "$(uname -s)" == "Linux" ]] && SUDO="sudo"
    $SUDO ./svc.sh install "$(id -un)" && $SUDO ./svc.sh start && echo "Runner service installed and started."
  fi
fi

cat <<EOF

Runner "$RUNNER_NAME" is registered for $REPO with labels: self-hosted, kirocrew (plus OS/arch).

Start it one of these ways:

  a) a terminal you keep open:            cd "$RUNNER_DIR" && ./run.sh
  b) as a service (survives logout):      SERVICE=1 scripts/install-runner.sh $REPO
                                          or: cd "$RUNNER_DIR" && sudo ./svc.sh install \$(id -un) && sudo ./svc.sh start
  c) no systemd (Docker, plain shell):    cd "$RUNNER_DIR" && nohup ./run.sh > runner.log 2>&1 &

A runner started with ./run.sh in an SSH session dies when that session ends; labelled
issues then sit "queued" in Actions until it is back. Prefer b) on EC2, c) in a container.
EOF
