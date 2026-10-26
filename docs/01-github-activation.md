# 1. GitHub activation

Everything GitHub needs before a label can start work. The scripts in `scripts/` do each step, and the manual equivalent is shown so you can see what they change.

## 1.1 Prerequisites

- A **private** repository you own (a personal repo, or an org repo where you are the owner/admin).
- `gh` logged in as that owner: `gh auth login`, then `gh auth status`.
- The dispatcher's owner check compares both the label sender and the issue author with the repository owner, so you must write the issue yourself as well as label it. In an organization, the owner login is the **org**, and a person is never equal to it, so this design as written only works for **user-owned repositories**. For an org repo, change `approving_owner()` and `labelled_pr_owner()` in `dispatch_kiro_event.py` to check an allowlist of maintainers. That change is not tested here.
- Admin rights on the repo (to create secrets and register a runner).
- The templates and webhook sources from [doc 02](02-kiro-crew-setup.md), because this step stores their tokens.

## 1.2 Create the labels and store the secrets

One webhook source per template means one token and signing secret pair per template. Have the five pairs from doc 02 ready (you can skip the scribe and worker pairs if you do not want those hops).

```bash
export KIROCREW_WEBHOOK_TOKEN='planner token'
export KIROCREW_WEBHOOK_SIGNING_SECRET='planner signing secret'
export KIROCREW_WEBHOOK_TOKEN_IMPLEMENTER='...'
export KIROCREW_WEBHOOK_SIGNING_SECRET_IMPLEMENTER='...'
export KIROCREW_WEBHOOK_TOKEN_REVIEWER='...'
export KIROCREW_WEBHOOK_SIGNING_SECRET_REVIEWER='...'
export KIROCREW_WEBHOOK_TOKEN_SCRIBE='...'
export KIROCREW_WEBHOOK_SIGNING_SECRET_SCRIBE='...'
export KIROCREW_WEBHOOK_TOKEN_WORKER='...'
export KIROCREW_WEBHOOK_SIGNING_SECRET_WORKER='...'
scripts/setup-github.sh OWNER/REPO
```

Any variable you leave unset is prompted for with hidden input; press Enter to skip a pair. The script creates all ten labels and stores each secret with `gh secret set`, never printing or writing a value.

Manual equivalent:

```bash
for l in kiro-plan kiro-deliver kiro-approved kiro-needs-owner kiro-task kiro-review kiro-changes-requested kiro-ready kiro-ready-to-merge kiro-parked; do
  gh label create "$l" --repo OWNER/REPO --force
done
gh secret set KIROCREW_WEBHOOK_TOKEN --repo OWNER/REPO
gh secret set KIROCREW_WEBHOOK_SIGNING_SECRET --repo OWNER/REPO
gh secret set KIROCREW_WEBHOOK_TOKEN_IMPLEMENTER --repo OWNER/REPO
gh secret set KIROCREW_WEBHOOK_SIGNING_SECRET_IMPLEMENTER --repo OWNER/REPO
gh secret set KIROCREW_WEBHOOK_TOKEN_REVIEWER --repo OWNER/REPO
gh secret set KIROCREW_WEBHOOK_SIGNING_SECRET_REVIEWER --repo OWNER/REPO
gh secret set KIROCREW_WEBHOOK_TOKEN_SCRIBE --repo OWNER/REPO
gh secret set KIROCREW_WEBHOOK_SIGNING_SECRET_SCRIBE --repo OWNER/REPO
gh secret set KIROCREW_WEBHOOK_TOKEN_WORKER --repo OWNER/REPO
gh secret set KIROCREW_WEBHOOK_SIGNING_SECRET_WORKER --repo OWNER/REPO
```

Which job uses which secret:

| Job | Label | Secret pair | Runs as |
|---|---|---|---|
| `issue-plan`, `issue-deliver` | `kiro-plan`, `kiro-deliver` | `KIROCREW_WEBHOOK_TOKEN` | planner |
| `issue-implement`, `pr-changes` | `kiro-approved`, `kiro-changes-requested` | `..._IMPLEMENTER` | implementer |
| `pr-review-round` | `kiro-review` | `..._REVIEWER` | reviewer |
| `pr-merged` | merged `kiro/issue-N` PR | `..._SCRIBE` | scribe |
| `issue-task` | `kiro-task` | `..._WORKER` | github-worker |
| `pr-gate` | `kiro-ready` | none: uses `github.token` | the gate script |

A source's destination is fixed on the Kiro Crew Webhooks page, so a job that borrows another source's token runs *as that template* and inherits its rules. That is why each has its own pair: the scribe on the planner's token refused to open a docs PR because the planner may not push.

Rules for the secrets: never put them in a file in the repo, never echo them, rotate by minting a new webhook source (doc 02) and re-running `setup-github.sh`.

## 1.3 Add the workflow, dispatcher, gate and agent templates to the repo

```bash
scripts/install-into-repo.sh ~/code/REPO
```

This copies the files below and prints the commit commands. It does not commit for you.

| File | Role |
|---|---|
| `.github/workflows/kiro-crew-events.yml` | One job per lifecycle label, all on the `kirocrew` runner; triggers on `issues: labeled` and `pull_request_target: labeled, closed` |
| `.github/scripts/dispatch_kiro_event.py` | Validates the event, wraps GitHub text as untrusted data, signs and sends the webhook |
| `.github/scripts/kiro_gate.py` | The deterministic merge gate, run by the `pr-gate` job with a write token |
| `.github/scripts/tests/test_dispatch_kiro_event.py`, `test_kiro_gate.py` | Unit tests (134) |
| `.github/kiro-agents/*.json`, `*.md` | The agent prompts, versioned with the code they act on |

Two settings to check before you merge:

- **Gateway address.** The dispatcher posts to `http://127.0.0.1:5476/api/hooks/agent`. If your gateway listens on another port, add `KIROCREW_WEBHOOK_URL: http://127.0.0.1:PORT/api/hooks/agent` to each dispatch job's `env:`. Any non-loopback host is refused.
- **CI requirement.** The `pr-gate` job sets `KIRO_GATE_REQUIRE_CI: "true"`: the gate parks a PR whose head has no CI check runs. If the repository has no CI workflow yet, set it to `"false"` so the lack of CI is a warning in the gate comment instead of a block.

The workflow only fires from the **default branch**, so merge the PR before testing. After that, protect the default branch as described in section 1.5 so an agent cannot change these files without review.

The dispatcher removes what GitHub does not show you before it reaches a mate: HTML comments (`<!-- ... -->`) and invisible or text-direction-control characters. What you read in the rendered issue is what the mate gets. Anyone with write access can still edit an issue after you label it, so label only issues you have just read. The implementer reads the spec from the planner's comment, not the issue body, and verifies that the comment's author is you.

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

The runner needs these on its `PATH`: `git`, `python3`, `node` (the version your CI uses, via nvm if you like), and `gh` logged in as the repo owner. The agents use your `gh` credentials to comment, label, push branches, review and open PRs.

The implementer pushes over HTTPS with `git`, and the workflow's checkout does not leave credentials behind, so git needs a credential helper. Set it up once as the same user that runs the gateway:

```bash
gh auth setup-git
```

`scripts/preflight.sh` warns when no helper is configured.

Each run leaves a `trusted-main-<run>-<attempt>` checkout in the runner's `_work` folder, and a mate that stopped early may leave a `kiro-worktree-N` or `kiro-review-N` worktree beside it. They are small; delete old ones now and then.

## 1.5 Optional hardening

- **Protect the default branch with a ruleset** (Settings, Rules, Rulesets) that requires a pull request **with 0 required approvals** and does not let admins bypass it. Two details matter:
  - Every PR and every review is created under your own account, and GitHub does not let an author approve their own PR. That is why the reviewer posts a *comment* review with a `VERDICT:` line and the gate reads that line. "Require 1 approval" would block every merge you make, or push you to bypass it.
  - Classic branch protection lets admins bypass by default, and the agents run with your admin login. Without "do not allow bypassing", an agent could push straight to the default branch.

  A real review requirement becomes possible once the agents use a separate GitHub account.
- Add a CODEOWNERS entry for `.github/` so workflow, dispatcher, gate and prompt changes need your approval. The gate also refuses any PR that touches `.github/`, `infrastructure/` or `.env` files, whatever the spec says.
- Restrict the `GITHUB_TOKEN` permissions at the repo level to read-only. The workflow declares read-only everywhere except the `pr-gate` job, which asks for `pull-requests: write` and `issues: write` to post its comment and label.
- Use a fine-grained personal access token, scoped to the one repository, for the `gh` login the agents use.

## 1.6 Optional: read-only summary on every PR push

The template ships without it, because the reviewer already reviews each delivery PR when it is labelled `kiro-review`. The dispatcher still supports a `pr-review` mode that summarises any PR the owner pushes to, on every push. Add this trigger type and job to `.github/workflows/kiro-crew-events.yml`, then merge it to the default branch:

```yaml
on:
  pull_request_target:
    types: [labeled, closed, opened, reopened, synchronize, ready_for_review]

jobs:
  pr-review:
    if: >-
      github.event_name == 'pull_request_target'
      && contains(fromJSON('["opened","reopened","synchronize","ready_for_review"]'), github.event.action)
      && github.event.pull_request.head.repo.full_name == github.repository
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
      - name: Dispatch read-only PR summary
        env:
          KIRO_MODE: pr-review
          KIRO_WORKSPACE: ${{ github.workspace }}/trusted-main-${{ github.run_id }}-${{ github.run_attempt }}
          KIROCREW_WEBHOOK_TOKEN: ${{ secrets.KIROCREW_WEBHOOK_TOKEN_REVIEWER }}
          KIROCREW_WEBHOOK_SIGNING_SECRET: ${{ secrets.KIROCREW_WEBHOOK_SIGNING_SECRET_REVIEWER }}
        run: python3 "$KIRO_WORKSPACE/.github/scripts/dispatch_kiro_event.py"
```

It reads the PR through `gh pr view` and `gh pr diff`, never checks out PR code, and refuses PRs opened by anyone but the owner. It runs on every push and shares the single runner with the lifecycle jobs, so jobs queue behind each other.

`pull_request_target` runs the workflow from the default branch. Adding or removing a job takes effect only after the change is merged, and the PR that makes the change is itself handled by the old version.
