# 1. Quick start checklist: zero to first pull request

One ordered list. Tick each box before the next. If you have never used Kiro Crew or a self-hosted runner, budget about an hour; most of it is waiting for downloads and copying tokens.

Where a step is dashboard-only, a screenshot shows what you should see. Everything else is a command you paste into a normal terminal (not an agent chat; `~/.kiro/agents` and config files are protected from agent sessions).

## 0. Prerequisites

- [ ] **A private GitHub repository you own personally.** Org-owned repos do not work as written (doc 04, section 4.1). The setup scripts refuse public repos.
- [ ] **Kiro Crew 0.11 or newer**, installed and running on the machine that will do the work: your laptop, an EC2 instance, or a container (doc 07 has the per-host differences). Check: `kirocrew --version`. Older builds call mates "crewmates" and lack `--display-name`; the mate names in this guide may need adjusting there.
- [ ] **`sudo` on that machine** (Linux), or the ability to rebuild the image (container). Step 2b moves `gh` and Node into `/usr/bin`. On macOS no sudo is needed, but see doc 07, section 7.4.
- [ ] **Kiro Crew signed in to a model.** Open any chat and send "hello". If it answers, you are signed in.
- [ ] **`gh` logged in as the repository owner:** `gh auth status`. Use a fine-grained token scoped to the one repository if you can.
- [ ] **`git`, `python3`, `curl` on PATH.** Check with `git --version && python3 --version && curl --version`.
- [ ] **The runtime your repo's CI uses** (for a Node project, the same Node major as `ci.yml`, via nvm or otherwise). The agents run your tests locally; if they cannot, they fall back to CI's results and say so.
- [ ] **A CI workflow on pull requests** in the repository (`.github/workflows/ci.yml` or similar). The gate requires at least one CI check on the PR head. If your repo has no CI yet, set `KIRO_GATE_REQUIRE_CI: "false"` on the `pr-gate` job after step 5, or the gate parks every PR.
- [ ] **This repository cloned:**

  ```bash
  git clone https://github.com/aidin-repo/kiro-crew-software-factory
  cd kiro-crew-software-factory
  ```

## 1. Kiro Crew: find the two pages

- [ ] Open the Kiro Crew dashboard. **Mates** is in the left sidebar. **Webhooks** is under **Settings** → **System** (the version is printed at the bottom of the Settings list; it must read 0.11 or newer). If either is missing on an older build, switch it on under **Settings** → **Developer** → **Feature Previews**.

  ![Settings list with Webhooks under System and the version at the bottom](images/01-settings-webhooks.png)

## 2. Kiro Crew: install the six agent templates

- [ ] In a terminal, from the clone:

  ```bash
  scripts/install-agent.sh
  ```

  It copies `templates/agent/*` into `~/.kiro/agents/` and prints the next steps. Expected: six `Installed ~/.kiro/agents/...` lines.

## 2b. Kiro Crew: prepare the gateway for unattended runs

Webhook runs have nobody to click Approve. Without this step the planner stops at its first `gh` call.

- [ ] Same terminal:

  ```bash
  scripts/setup-gateway.sh
  ```

  It writes the auto-approve rules into `~/.kiro/crew/config.json` and checks that `gh`, `git`, `node`, `npm`, `npx`, `shasum`, `python3` live in `/usr/bin` with no copy earlier on `PATH`. Run every `->` line it prints (they need `sudo`), then re-run until it says `Gateway ready`. Details and the macOS exception: doc 05, section 5.5; per-host steps: doc 07.

- [ ] `node --version` prints the Node major your repository's CI uses.

## 3. Kiro Crew: check the templates are visible (mates are optional)

- [ ] Open the mate picker at the top of any chat, or the **Mates** page. The six templates you installed appear in the roster.

  ![The mate picker at the top of a chat, each entry with its template name underneath](images/03-mates-picker.png)

- [ ] **Optional.** Webhook runs execute directly on the templates (the Webhooks Agent picker lists templates only), so the pipeline needs no mates. Create one only if you want a standing chat with a role, for example to ask the auditor what is stuck:

  ```bash
  kirocrew agent create --name auditor --kiro-agent delivery-auditor --display-name "Delivery Auditor"
  ```

  A mate's name must differ from its template's name, or `agent create` says "a template is already named X".

## 4. Kiro Crew: one webhook source per template

Repeat for each row. Have a terminal open beside the dashboard: each source shows its two values once, and you store them straight into GitHub.

| # | Source name | Agent | Then run (paste token, Enter; paste signing secret, Enter) |
|---|---|---|---|
| 4a | `GitHub REPO planner` | `delivery-planner` | `gh secret set KIROCREW_WEBHOOK_TOKEN --repo OWNER/REPO` then `gh secret set KIROCREW_WEBHOOK_SIGNING_SECRET --repo OWNER/REPO` |
| 4b | `GitHub REPO implementer` | `delivery-implementer` | `..._TOKEN_IMPLEMENTER`, `..._SIGNING_SECRET_IMPLEMENTER` |
| 4c | `GitHub REPO reviewer` | `delivery-reviewer` | `..._TOKEN_REVIEWER`, `..._SIGNING_SECRET_REVIEWER` |
| 4d | `GitHub REPO scribe` | `delivery-scribe` | `..._TOKEN_SCRIBE`, `..._SIGNING_SECRET_SCRIBE` |
| 4e | `GitHub REPO worker` | `github-worker` | `..._TOKEN_WORKER`, `..._SIGNING_SECRET_WORKER` |

For each:

- [ ] **Settings** → **Webhooks** → **New**. Type the **Source** name. In the **Agent** dropdown type part of the name and pick the template from the table (the dropdown lists installed templates, tagged `builtin`). Leave **Require request signing** checked. Click **Generate token**.

  ![The New source form: source name, agent dropdown, require request signing, generate token](images/04a-new-source.png)

- [ ] A panel appears: **Copy both secrets now, they are shown once**, with the **bearer token** (`kc_whk_...`) and the **signing secret** (`kc_whs_...`). Run the two `gh secret set` commands from the table, pasting each value when prompted. Only then click **Dismiss, I have saved**.

  ![The one-time panel showing the bearer token and signing secret](images/04b-source-created.png)

- [ ] Check the new row in the left list reads `Agent: <template>` (for example `Agent: delivery-implementer`). **Routing** → **Agent** changes it later without changing the token.

- [ ] After all five:

  ```bash
  gh secret list --repo OWNER/REPO
  ```

  Ten `KIROCREW_*` names. If you skipped scribe or worker, those hops will 401 and nothing else is affected.

Alternative for the secrets: export all ten as environment variables and let `scripts/setup-github.sh OWNER/REPO` store them in step 5.

## 5. GitHub: labels, secrets, workflow

- [ ] Labels (and any secrets you did not set in step 4; press Enter to skip a pair you already stored):

  ```bash
  scripts/setup-github.sh OWNER/REPO
  ```

  Creates the ten `kiro-*` labels. Check them on the repository's Labels page.

- [ ] Install the workflow, dispatcher, gate, tests and agent templates into a local clone of your repository:

  ```bash
  gh auth setup-git
  scripts/install-into-repo.sh ~/code/REPO
  ```

  Then follow the printed commands: branch, test, commit, push, open the PR, **merge it**. The workflow only fires from the default branch.

- [ ] If your gateway is not on `127.0.0.1:5476`, add `KIROCREW_WEBHOOK_URL: http://127.0.0.1:PORT/api/hooks/agent` to every dispatch job's `env:` in `.github/workflows/kiro-crew-events.yml` before merging. The dispatcher refuses non-loopback addresses.

- [ ] If the repository has no CI workflow, set `KIRO_GATE_REQUIRE_CI: "false"` on the `pr-gate` job before merging.

## 6. GitHub: the runner on your machine

- [ ] Register the runner:

  ```bash
  scripts/install-runner.sh OWNER/REPO
  ```

- [ ] Start it. Pick one:

  | Where | Command |
  |---|---|
  | Laptop, trying it out | `cd ~/actions-runner-kirocrew && ./run.sh` in a terminal you keep open |
  | Laptop or EC2, for good | `SERVICE=1 scripts/install-runner.sh OWNER/REPO` (LaunchAgent or systemd; Linux needs sudo) |
  | Container, no systemd | `cd ~/actions-runner-kirocrew && nohup ./run.sh > runner.log 2>&1 &` |

  A runner started with `./run.sh` over SSH stops when the SSH session ends, and labelled issues then sit `queued`.

- [ ] Repository **Actions** → **Runners** (left sidebar) → **Self-hosted runners** shows it **Idle** with labels `self-hosted`, `kirocrew`, and the OS and architecture of your machine.

  ![The repository's self-hosted runners list showing a macOS arm64 runner with the kirocrew label](images/06-runner-idle.png)

## 7. Verify

- [ ] Read-only checks; fix every FAIL:

  ```bash
  scripts/preflight.sh OWNER/REPO
  ```

- [ ] Full lifecycle smoke test (creates and then cleans up a real issue and PR):

  ```bash
  CLEANUP=1 scripts/smoke-test.sh OWNER/REPO
  ```

  Expected output, over 6 to 8 minutes: `kiro-approved`, `PR opened`, `kiro-review`, `kiro-ready`, `kiro-ready-to-merge`, then `PASS reviewer: VERDICT: approve`, `PASS gate: ## Delivery gate: PASS`, `PASS lifecycle complete`.

## 8. First real issue

- [ ] Write an issue with **What**, **Why** and **Acceptance** sections (doc 02 has an example). Add the `kiro-deliver` label.
- [ ] Watch the labels. When the PR reads `kiro-ready-to-merge`, open it, read the `VERDICT:` review and the gate comment, read the diff, merge.

  ![The reviewer's comment review: VERDICT approve, HEAD REVIEWED, then numbered findings](images/08a-pr-verdict.png)

  ![The gate's comment, Delivery gate PASS, and the label change to kiro-ready-to-merge](images/08b-pr-gate.png)

- [ ] After the merge, the scribe may open a docs PR on `kiro/docs-pr-N`. Merge or close it.

## If something does not move

| Where it stopped | Look at |
|---|---|
| Issue still only `kiro-deliver` after 3 min | Actions tab: is `issue-deliver` queued (runner offline) or failed (read the log)? |
| Issue has `kiro-needs-owner` | The planner held. Read its comment's Open questions, then apply `kiro-approved` yourself |
| `kiro-approved` but no PR after 10 min | Actions: `issue-implement` result. Dashboard notification: the implementer's report |
| PR stuck at `kiro-review` after 10 min | Dashboard notification from the reviewer; re-add the label to retry |
| Any hop's notification says "the tool policy refused" a command | `scripts/setup-gateway.sh` again; doc 05, section 5.5 names each refusal code. Delete `kiro/issue-N` before re-labelling `kiro-approved` |
| PR has `kiro-parked` | The gate comment lists each failed check |
| A prompt change you made is not picked up | Edit the file in `~/.kiro/agents/`; the next webhook run reads it. No restart or mate step is needed. To keep the change across updates, put it in `templates/agent.local/` (doc 08) |

Full troubleshooting: [doc 09](09-lessons-and-troubleshooting.md). How each piece works: [doc 03](03-delivery-lifecycle.md).
