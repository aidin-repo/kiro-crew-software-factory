# AGENTS.md: how to help a person install this

You are a coding agent that has opened this repository. This file tells you what it is, how to set it up for the person you are helping, which steps you can run yourself, and which ones you must hand to them.

## What this is

Kiro Crew Software Factory turns a GitHub issue into a reviewed, gate-checked pull request. Five small Kiro Crew agents on the user's own machine each do one job and hand off through GitHub labels. A human merges. Nothing here runs in the cloud; the user's machine hosts a Kiro Crew gateway and a GitHub Actions runner.

Read, in this order, before you act: `README.md`, `docs/07-quickstart-checklist.md`, `docs/02-kiro-crew-setup.md` section 2.5. Everything else is reference.

## What you can and cannot do

The person is running you on the machine that will host the factory, or on a laptop that reaches it. Some steps need `sudo`, a dashboard click, or a secret typed by a human. Do not work around those; hand them over with the exact command.

| Step | You | Why |
|---|---|---|
| Read docs, run `--version` and `status` checks | do it | read-only |
| `scripts/install-agent.sh` | **hand over** | `~/.kiro/agents` is read-only from an agent sandbox |
| `scripts/setup-gateway.sh` | run `--check`, hand over the rest | it writes `~/.kiro/crew/config.json` (read-only for agents) and prints `sudo` lines |
| Create 5 webhook sources in the dashboard | **hand over** | dashboard only; tokens are shown once, to the human |
| `scripts/setup-github.sh OWNER/REPO` | **hand over** | the human pastes tokens; you must never see or print them |
| `scripts/install-into-repo.sh PATH` | do it | copies files into their clone; they review and merge the PR |
| `scripts/install-runner.sh OWNER/REPO` | **hand over** | downloads a binary that runs as the user; `SERVICE=1` needs `sudo` |
| Start the runner | **hand over** | a process that outlives your session |
| `scripts/preflight.sh OWNER/REPO` | do it | read-only |
| `scripts/smoke-test.sh OWNER/REPO` | ask first, then `CLEANUP=1` | creates a real issue, branch and PR under their account |

If `kirocrew config set` or `install-agent.sh` says read-only, that is the sandbox, not a bug. Tell the person to run the same command in their own terminal.

## Onboarding procedure

Work through this with the person. Stop at each hand-over and give them the command.

1. **Check prerequisites.** Run and report:

   ```bash
   kirocrew --version          # 0.11 or newer
   gh auth status              # logged in as the repo owner
   gh repo view OWNER/REPO --json visibility,isInOrganization --jq '.'   # PRIVATE, false
   node --version              # the major their CI uses
   command -v gh git node npm npx shasum python3
   ```

   A public repo or an org-owned repo stops here (README, Security model; doc 01 section 1.1). On Linux every program above should resolve to `/usr/bin`; if not, `setup-gateway.sh` will say what to move.

2. **Hand over:** `scripts/install-agent.sh`, then `scripts/setup-gateway.sh`. Ask them to paste the output back. Explain any `->` line it printed: each is a `sudo ln`, `mv`, `dnf install` or `gh auth setup-git` that only they can run. Loop until it prints `Gateway ready`.

3. **Hand over:** the five webhook sources. Point them at doc 07 step 4: Settings → Webhooks → New, one source per template (`delivery-planner`, `delivery-implementer`, `delivery-reviewer`, `delivery-scribe`, `github-worker`), signing required. Then `scripts/setup-github.sh OWNER/REPO` in their terminal, pasting each token and signing secret when prompted. Never ask them to paste a secret into the chat.

4. **Do:** `scripts/install-into-repo.sh /path/to/their/clone`. Then show them the printed commit commands. They open and merge that PR; the workflow only fires from the default branch. Before they merge, check two things in `.github/workflows/kiro-crew-events.yml`: the gateway port (`KIROCREW_WEBHOOK_URL` if not 5476) and `KIRO_GATE_REQUIRE_CI` (set `"false"` if the repo has no CI on pull requests).

5. **Hand over:** `SERVICE=1 scripts/install-runner.sh OWNER/REPO` (laptop or EC2), or `scripts/install-runner.sh OWNER/REPO` then `nohup ./run.sh > runner.log 2>&1 &` in `~/actions-runner-kirocrew` (container). A runner started with plain `./run.sh` over SSH dies with the session.

6. **Do:** `scripts/preflight.sh OWNER/REPO`. Every line must be PASS. Map each FAIL to the symptom table in `docs/04-lessons-and-troubleshooting.md`.

7. **Ask, then do:** `CLEANUP=1 scripts/smoke-test.sh OWNER/REPO`. It takes 4 to 8 minutes and cleans up after itself. Or help them write a first real issue (doc 00 has the shape: What, Why, Acceptance) and label it `kiro-deliver`.

## Rules

- **Secrets.** Never print, log, echo or ask for a webhook token (`kc_whk_...`), signing secret (`kc_whs_...`) or GitHub token. The scripts read them with hidden input for a reason.
- **Prompts.** Do not edit `templates/agent/*.json` in place. Put changes in `templates/agent.local/<name>.json` (git-ignored) and run `scripts/install-agent.sh` (doc 08). Keep the contracts in doc 08 section 8.6; the gate and dispatcher parse them.
- **Scope.** Change only what the person asked for. Do not refactor the scripts, upgrade dependencies or rewrite the docs as a side effect.
- **Tests.** `python3 -m pytest templates/scripts/tests -q` in a venv (doc 03 section 3.1) after any change to `templates/scripts/`. Run `bash -n` on any script you touch. `scripts/setup-gateway.sh --check` and `scripts/preflight.sh` are the integration checks.
- **The unattended policy is the first thing that breaks on a new machine.** A webhook turn has no human to approve a tool call. If an agent run stops with "the tool policy refused", read doc 02 section 2.5 and the symptom table before changing anything; the fix is a rule, a program path or a one-line command, never YOLO mode.
- **Private repos only.** Do not help attach this to a public repository.

## Layout

| Path | What |
|---|---|
| `templates/agent/` | the six agent templates (prompt, tools); installed to `~/.kiro/agents/` |
| `templates/agent.local/` | your overrides, git-ignored |
| `templates/workflows/kiro-crew-events.yml` | one job per label, runs on the user's runner |
| `templates/scripts/dispatch_kiro_event.py` | validates each event, signs and posts the webhook |
| `templates/scripts/kiro_gate.py` | the deterministic merge gate, no model |
| `templates/scripts/tests/` | pytest for both scripts |
| `scripts/` | install, setup, preflight, smoke test (README has the table) |
| `docs/` | 00 how it works, 01 GitHub, 02 Kiro Crew, 03 testing, 04 troubleshooting, 05 laptop/EC2/container, 06 reference, 07 checklist, 08 customizing |

## When something stalls

Labels are the status. If a label has not moved in 5 minutes: Actions tab (job `queued` means the runner is offline; `failed` has the reason in its log), then the dashboard notification `Webhook: GitHub <repo>` (each agent's report names any refused command), then `~/.kiro/crew/security_events.jsonl` (doc 04, "Reading the evidence yourself"). Do not re-label until you know why it stopped; if a `kiro/issue-N` branch was pushed, it must be deleted before `kiro-approved` is re-applied.
