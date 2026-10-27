#!/usr/bin/env bash
# Prepares the Kiro Crew gateway on THIS machine for unattended webhook runs.
#
# A webhook turn has nobody to click Approve, so a tool call runs only when a
# rule in `hooks.auto_approve_tools` (in ~/.kiro/crew/config.json) matches it AND,
# for a shell command, every program it names lives in a trusted system directory
# (/usr/bin, /bin, /usr/sbin, /sbin) with no same-named copy earlier on PATH.
# This script:
#   1. merges the rule list the templates need into `hooks.auto_approve_tools`
#      (other hooks keys are kept; the gateway hot-reloads the file);
#   2. checks that gh, git, node, npm, npx, shasum, python3 resolve to a trusted
#      directory and are not shadowed, and prints the exact commands to fix them;
#   3. checks the git credential helper points at that trusted gh.
#
# Run it in a NORMAL terminal, not an agent chat: config.json is read-only for agents.
# Usage: scripts/setup-gateway.sh            # apply the rules, report the rest
#        scripts/setup-gateway.sh --check    # report only, change nothing
#        FIX=1 scripts/setup-gateway.sh      # also run the printed sudo/ln commands
set -uo pipefail

CHECK_ONLY=0
[[ "${1:-}" == "--check" ]] && CHECK_ONLY=1
FIX="${FIX:-0}"
CONFIG="$HOME/.kiro/crew/config.json"
FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
warn() { printf '  WARN  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
todo() { printf '        -> %s\n' "$1"; }

# The rule list. Shell rules match the start of the command line; the capitalised
# ones match the display title of a built-in file tool (Write File, List Directory...).
# `fs_write` alone does NOT match: the gate compares the title, not the tool id.
RULES='[
  "gh *", "git *", "cd *", "ls *", "cat *", "grep *", "sed *", "head *", "tail *", "wc *", "find *",
  "mktemp*", "shasum *", "sha256sum *", "npm *", "npx *", "node *", "TZ=*",
  "Write File*", "Edit File*", "Create File*", "Replace in File*", "Str Replace*", "Append File*", "Delete File*",
  "List Directory*", "File Search*", "Grep Search*", "Glob*"
]'

command -v python3 >/dev/null 2>&1 || { echo "python3 is required" >&2; exit 1; }
command -v kirocrew >/dev/null 2>&1 || { echo "kirocrew CLI not found on PATH; is Kiro Crew installed for this user?" >&2; exit 1; }

echo "Kiro Crew"
VERSION="$(kirocrew --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -n 1)"
if [[ -n "$VERSION" ]]; then pass "kirocrew $VERSION"; else warn "could not read kirocrew --version"; fi
CODE="$(curl -s -o /dev/null -m 5 -w '%{http_code}' http://127.0.0.1:5476/ 2>/dev/null)"
if [[ -n "$CODE" && "$CODE" != "000" ]]; then pass "gateway answers on 127.0.0.1:5476"; else warn "gateway not answering on 127.0.0.1:5476 (start Kiro Crew; the rules still get written)"; fi

echo "Unattended tool rules (hooks.auto_approve_tools)"
# Merge: keep every other key under hooks, union the rule list.
MERGED_B64="$(python3 - "$CONFIG" "$RULES" <<'EOF'
import base64, json, os, sys
path, rules = sys.argv[1], json.loads(sys.argv[2])
cfg = {}
if os.path.exists(path):
    try:
        cfg = json.load(open(path))
    except Exception:
        cfg = {}
hooks = cfg.get("hooks") if isinstance(cfg.get("hooks"), dict) else {}
have = [r for r in hooks.get("auto_approve_tools", []) if isinstance(r, str)]
merged = list(dict.fromkeys(have + rules))
hooks = dict(hooks)
hooks["auto_approve_tools"] = merged
missing = [r for r in rules if r not in have]
print(base64.b64encode(json.dumps(hooks, separators=(",", ":")).encode()).decode())
print(len(missing))
EOF
)"
B64="$(sed -n 1p <<<"$MERGED_B64")"
MISSING="$(sed -n 2p <<<"$MERGED_B64")"
if [[ "$MISSING" == "0" ]]; then
  pass "all rules already present in $CONFIG"
elif [[ "$CHECK_ONLY" == "1" ]]; then
  fail "$MISSING rule(s) missing from $CONFIG"
  todo "kirocrew config set hooks --value-base64=$B64"
else
  if kirocrew config set hooks --value-base64="$B64" >/dev/null 2>&1; then
    pass "wrote $MISSING new rule(s) to $CONFIG (hot-reloaded, no restart needed)"
  else
    fail "could not write $CONFIG (are you inside an agent sandbox? run this from your own terminal)"
    todo "kirocrew config set hooks --value-base64=$B64"
  fi
fi

echo "Programs the agents run (must resolve to a trusted system directory, unshadowed)"
TRUSTED=(/usr/bin /bin /usr/sbin /sbin /run/current-system/sw/bin)
is_trusted_dir() { local d="$1"; for t in "${TRUSTED[@]}"; do [[ "$d" == "$t" ]] && return 0; done; return 1; }
OS="$(uname -s)"
NEED_PIN=()
for prog in gh git node npm npx shasum python3; do
  found="$(command -v "$prog" 2>/dev/null || true)"
  if [[ -z "$found" ]]; then
    case "$prog" in
      shasum) fail "$prog not found (the reviewer hashes the spec with it)"
              if [[ "$OS" == "Linux" ]]; then
                if command -v dnf >/dev/null 2>&1; then todo "sudo dnf install -y perl-Digest-SHA"; else todo "sudo apt-get install -y perl  # ships shasum"; fi
              fi ;;
      *)      fail "$prog not found on PATH" ;;
    esac
    continue
  fi
  dir="$(dirname "$found")"
  # Every earlier PATH entry that also carries the name shadows the trusted one.
  shadows=""
  IFS=: read -r -a entries <<<"$PATH"
  for e in "${entries[@]}"; do
    [[ -z "$e" || "$e" == "$dir" ]] && { [[ "$e" == "$dir" ]] && break; continue; }
    [[ -x "$e/$prog" ]] && shadows="$shadows $e/$prog"
  done
  if is_trusted_dir "$dir" && [[ -z "$shadows" ]]; then
    pass "$prog -> $found"
  elif is_trusted_dir "$dir"; then
    fail "$prog -> $found is shadowed by:$shadows"
    for s in $shadows; do todo "mv $s $s.shadowed   # or remove it"; done
  else
    # Not in a trusted directory.
    if [[ "$OS" == "Darwin" ]]; then
      warn "$prog -> $found is outside /usr/bin (macOS protects /usr/bin, so it cannot be moved there)"
      NEED_PIN+=("$prog")
    else
      trusted_copy=""
      for t in "${TRUSTED[@]}"; do [[ -x "$t/$prog" ]] && { trusted_copy="$t/$prog"; break; }; done
      if [[ -n "$trusted_copy" ]]; then
        fail "$prog -> $found shadows the trusted $trusted_copy"
        todo "mv $found $found.shadowed   # or remove it; $trusted_copy then wins"
        [[ "$FIX" == "1" ]] && mv "$found" "$found.shadowed" && echo "        applied"
      else
        fail "$prog -> $found is not in a trusted directory"
        real="$(readlink -f "$found" 2>/dev/null || echo "$found")"
        todo "sudo ln -sfn $real /usr/bin/$prog"
        todo "mv $found $found.shadowed   # the copy on PATH before /usr/bin would otherwise shadow it"
        if [[ "$FIX" == "1" ]]; then
          sudo ln -sfn "$real" "/usr/bin/$prog" && mv "$found" "$found.shadowed" && echo "        applied"
        fi
      fi
    fi
  fi
done
if [[ "${#NEED_PIN[@]}" -gt 0 ]]; then
  echo "  NOTE  macOS: a program outside /usr/bin is trusted only after a human approves it once"
  echo "        per gateway start. After each Kiro Crew restart, in a dashboard chat, run and approve:"
  for p in "${NEED_PIN[@]}"; do echo "          $p --version"; done
fi

echo "Node version"
if command -v node >/dev/null 2>&1; then
  pass "node $(node --version 2>/dev/null) (must match the major your repository's CI uses)"
fi

echo "git credential helper"
HELPER="$(git config --get-urlmatch credential.helper https://github.com 2>/dev/null | tail -n 1)"
GH="$(command -v gh 2>/dev/null || true)"
if [[ -z "$HELPER" ]]; then
  fail "no credential helper for github.com, so the agents cannot push"
  todo "gh auth setup-git"
elif [[ -n "$GH" && "$HELPER" == *"$GH"* ]]; then
  pass "helper uses $GH"
else
  HELPER_PATH="$(sed -E 's/^!//; s/ .*$//' <<<"$HELPER")"
  if [[ -x "$HELPER_PATH" ]]; then
    warn "helper uses $HELPER_PATH, not $GH; fine if both work, but re-run gh auth setup-git after moving gh"
  else
    fail "helper points at $HELPER_PATH, which does not exist (gh was moved)"
    todo "gh auth setup-git"
    [[ "$FIX" == "1" ]] && gh auth setup-git && echo "        applied"
  fi
fi

echo
if [[ "$FAILS" -eq 0 ]]; then
  echo "Gateway ready for unattended runs. Next: scripts/preflight.sh OWNER/REPO"
else
  echo "$FAILS item(s) need a fix. Run the '->' lines (they need sudo), then re-run this script."
  echo "Risk: these rules let webhook agents run the listed programs with no human in the loop."
  exit 1
fi
