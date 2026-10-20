# 1. GitHub activation

Everything GitHub needs before an issue label can start work. The scripts in `scripts/` do each step, and the manual equivalent is shown so you can see what they change.

## 1.1 Prerequisites

- A **private** repository you own (a personal repo, or an org repo where you are the owner/admin).
- `gh` logged in as that owner: `gh auth login`, then `gh auth status`.
- The dispatcher's owner check compares both the label sender and the issue author with the repository owner, so you must write the issue yourself as well as label it. In an organization, the owner login is the **org**, and a person is never equal to it, so this design as written only works for **user-owned repositories**. For an org repo, change `approving_owner()` in `dispatch_kiro_event.py` to check an allowlist of maintainers. That change is not tested here.
- Admin rights on the repo (to create secrets and register a runner).

## 1.2 Create the label and store the secrets

Use the token and signing secret from `docs/02-kiro-crew-setup.md`, section 2.3:

```bash
export KIROCREW_WEBHOOK_TOKEN='paste-the-token-here'
export KIROCREW_WEBHOOK_SIGNING_SECRET='paste-the-signing-secret-here'
scripts/setup-github.sh OWNER/REPO
```

Manual equivalent:

```bash
gh label create kiro-task --repo OWNER/REPO --color 5319e7 \
  --description "Owner-approved: Kiro Crew implements this issue and opens a PR" --force
gh secret set KIROCREW_WEBHOOK_TOKEN --repo OWNER/REPO
gh secret set KIROCREW_WEBHOOK_SIGNING_SECRET --repo OWNER/REPO
```

Rules for the secrets: never put them in a file in the repo, never echo them, rotate by minting a new webhook source (see doc 02) and re-running `setup-github.sh`.

## 1.3 Add the workflow and dispatcher to the repo

```bash
scripts/install-into-repo.sh ~/code/REPO
```

This copies three files and prints the commit commands. It does not commit for you.

| File | Role |
|---|---|
| `.github/workflows/kiro-crew-events.yml` | Triggers on `issues:labeled` only; runs the `issue-task` job on the `kirocrew` runner |
| `.github/scripts/dispatch_kiro_event.py` | Validates the event, wraps issue text as untrusted data, signs and sends the webhook |
| `.github/scripts/tests/test_dispatch_kiro_event.py` | Unit tests for the dispatcher |

The workflow only fires from the **default branch**, so merge the PR before testing. After that, protect the default branch as described in section 1.5 so the agent cannot change these files without review.

The dispatcher also removes what GitHub does not show you before it reaches the agent: HTML comments (`<!-- ... -->`) and invisible or text-direction-control characters in the title and body. What you read in the rendered issue is what the agent gets. Anyone with write access can still edit an issue after you label it, so label only issues you have just read.

## 1.4 Register the self-hosted runner

```bash
scripts/install-runner.sh OWNER/REPO
```

It downloads the runner, checks the SHA-256 against the release notes, refuses public repos, and registers the runner with the label `kirocrew`. Then start it in a terminal you keep open, and look for "Listening for Jobs":

```bash
cd ~/actions-runner-kirocrew
```

```bash
./run.sh
```

Run these as separate lines with no trailing `# comment`: an interactive zsh treats the comment as extra arguments. In GitHub, Settings, Actions, Runners should show the runner as **Idle** with labels `self-hosted` and `kirocrew`.

To keep it running after you close the terminal or reboot:

```bash
cd ~/actions-runner-kirocrew && ./svc.sh install && ./svc.sh start
```

On macOS that installs a LaunchAgent, which runs while you are logged in. A runner that is offline is not an error: the job just waits in the queue until it comes back.

The runner needs these on its `PATH`: `git`, `python3`, and `gh` logged in as the repo owner (the crewmate uses your `gh` credentials to push the branch and open the PR).

The crewmate pushes over HTTPS with `git`, and the workflow's checkout does not leave credentials behind, so git needs a credential helper. Set it up once as the same user that runs the gateway:

```bash
gh auth setup-git
```

`scripts/preflight.sh` warns when no helper is configured.

## 1.5 Optional hardening

- **Protect the default branch with a ruleset** (Settings, Rules, Rulesets) that requires a pull request **with 0 required approvals** and does not let admins bypass it. Two details matter:
  - Every PR is opened under your own account, and GitHub does not let an author approve their own PR. "Require 1 approval" would block every merge you make, or push you to bypass it.
  - Classic branch protection lets admins bypass by default, and the crewmate runs with your admin login. Without "do not allow bypassing", it could push straight to the default branch.
  
  A real review requirement becomes possible once the worker uses a separate GitHub account.
- Add a CODEOWNERS entry for `.github/` so workflow changes need your approval.
- Restrict the `GITHUB_TOKEN` permissions at the repo level to read-only (the workflow already declares read-only).
- Use a fine-grained personal access token, scoped to the one repository, for the `gh` login the worker uses.

## 1.6 Optional: automatic read-only PR review

The template ships without it. The dispatcher still supports a `pr-review` mode, so turning it on is a workflow-only change. Add this trigger and job to `.github/workflows/kiro-crew-events.yml`, then merge it to the default branch:

```yaml
on:
  pull_request_target:
    types: [opened, reopened, synchronize, ready_for_review]
  issues:
    types: [labeled]

jobs:
  pr-review:
    # Same-repo PRs only: never dispatch work for code that came from a fork.
    if: github.event_name == 'pull_request_target' && github.event.pull_request.head.repo.full_name == github.repository
    runs-on: [self-hosted, kirocrew]
    concurrency:
      group: kiro-crew-pr-review-${{ github.event.pull_request.number }}
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0
        with:
          ref: ${{ github.event.repository.default_branch }}
          path: trusted-main-${{ github.run_id }}-${{ github.run_attempt }}
          persist-credentials: false
      - name: Dispatch read-only PR review
        env:
          KIRO_MODE: pr-review
          KIRO_WORKSPACE: ${{ github.workspace }}/trusted-main-${{ github.run_id }}-${{ github.run_attempt }}
          KIROCREW_WEBHOOK_TOKEN: ${{ secrets.KIROCREW_WEBHOOK_TOKEN }}
          KIROCREW_WEBHOOK_SIGNING_SECRET: ${{ secrets.KIROCREW_WEBHOOK_SIGNING_SECRET }}
        run: python3 "$KIRO_WORKSPACE/.github/scripts/dispatch_kiro_event.py"
  # keep the existing issue-task job below
```

The review reads the PR through `gh pr view` and `gh pr diff` and never checks out PR code. The dispatcher only accepts PRs opened by the repository owner, so a collaborator's PR is refused and that job fails. It reports to the dashboard as another `Webhook: GitHub <repo>` notification. It also runs on every push to the PR, and it shares the single runner with `issue-task`, so jobs queue behind each other. "Read-only" is enforced by the prompt, not by the tool permissions.

`pull_request_target` runs the workflow from the default branch. Adding or removing the review takes effect only after the change is merged, and the PR that makes the change is itself reviewed by the old version.
