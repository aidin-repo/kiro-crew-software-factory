# 9. Lessons learned and troubleshooting

Everything here happened while building the working setup: first the single-stage fast lane, then the full lifecycle, then the move to EC2. Each item is a real failure with a known cause or fix. Where a cause is a best explanation rather than a confirmed fact, it says so.

## Symptom table

| Symptom | Likely cause | Fix |
|---|---|---|
| `issue-task` job stays **queued** | The runner is offline or stopped | Start it: `cd <runner dir> && ./run.sh`. `gh api repos/OWNER/REPO/actions/runners` shows `status` |
| *All* jobs queued, including GitHub-hosted ones | A GitHub Actions incident | Check githubstatus.com. Jobs run by themselves when it recovers |
| Job fails: "label must be applied by the repository owner" | A non-owner applied the label, or the repo belongs to an org | Have the owner apply it. For org repos, see doc 04, section 4.1 |
| Job fails: "The issue must be written by the repository owner" | Someone else opened the issue, even though you applied the label | Copy the text into a new issue that you write, and label that one |
| Job fails: "KIRO_WORKSPACE is not a trusted default-branch checkout" | The checkout path does not start with `trusted-main-` | Do not rename that path in the workflow |
| `Kiro Crew webhook rejected: HTTP 401` | Wrong token or signing secret, or clock skew over 5 minutes | Re-create the source, re-run `setup-github.sh`, check the system clock |
| `HTTP 403` | Origin or host check rejected the request | The dispatcher sends `Origin` itself; confirm the URL is the loopback gateway |
| `HTTP 503` | Webhooks kill switch is on, or the source is paused | Turn it back on in the Webhooks page |
| `HTTP 429` | Six runs already in flight, or 10 failed auths in a minute | Wait and retry |
| `Kiro Crew webhook unavailable` | The gateway is not running on that port | Start Kiro Crew; run `scripts/preflight.sh` |
| `Kiro Crew webhook rejected: HTTP 409` | `session_busy` (same session key still running), `agent_conflict`, or `destination_agent_unavailable` (the source's agent was deleted) | Wait for the run to finish, or re-point the source to an installed agent on the Webhooks page |
| Webhook accepted (HTTP 200), nothing happens | The turn failed or an unattended tool call was blocked by the approval policy. HTTP 200 only means accepted | Read the run's notification and the Webhooks Activity list; see doc 05, section 5.5 |
| Run fails after about 0.5 s: `Hook agent error: internal failure`; gateway log shows `ForkGovernanceUnresolved` | (Older builds) the mate ran on a private template copy but was bound to the shared base template | Rebind with `kirocrew agent update NAME --kiro-agent TEMPLATE`, then quit and reopen Kiro Crew. Creating mates with distinct names (doc 05, section 5.3) avoids it |
| A mate's Webhook tab says no tokens are bound | Expected: webhook sources route to templates, not mates (the Agent picker lists templates only) | Nothing to fix. The source row reads `Agent: <template>` |
| A mate's Webhook tab DOES list a source | The mate has the same name as its template, and the tab matches on the name string. The run still executes on the template with the default memory store (its session metadata reads `member_id: None, kind: template`) | Cosmetic. Give mates names that differ from their templates to avoid the ambiguity |
| A mate's dashboard is empty after successful runs | Expected: it tracks the mate's chat and goals, not webhook runs | Use the labels, the notification and the Webhooks Activity list (doc 05, section 5.6) |
| A Kiro Crew review still runs after you removed it | `pull_request_target` uses the workflow on the default branch | Merge the workflow change; the PR that removes it is reviewed by the old version |
| Local `localStorage` tests fail, CI passes | Node 26's built-in Web Storage shadows jsdom's | Not your change; the agents report it as pre-existing and rely on CI's Node 20 run, or pin `engines.node` |
| Branch pushed with no commit | git add and commit ran in parallel | The template prompt now requires git steps one at a time |
| Worker says it cannot act on "untrusted" issue text | Dispatcher lacked the owner-approval wording | Use the dispatcher in this folder (it includes the owner-approved prompt) |
| Worker stops: branch `kiro/issue-N` exists | Re-run on an issue that already has the branch | Doc 06, section 6.7 |
| `gh issue edit <number> ...` gives "no such file or directory" in zsh | You pasted a placeholder in angle brackets | Replace it with the real number and remove the brackets |
| `cd ~/runner   # comment` gives "too many arguments" in zsh | An inline `#` comment is not a comment in an interactive zsh | Run commands without trailing comments |
| `./run.sh: no such file` | You are in the wrong folder, or the runner was never configured | The configured folder has a `.runner` file |
| `kirocrew agent create` fails: "a template is already named X" | Kiro Crew 0.11 refuses a mate whose name equals its template's name | Use a different mate name. Mates are optional for the pipeline: webhook sources route to templates |
| A mate's chat still shows the old prompt after you edited the template | A mate copies its template at creation and keeps the copy | `kirocrew agent delete NAME` then `create` again. Webhook runs are unaffected: they read the template file each run |
| Gate parks with "CI: pr-gate is pending" or another lifecycle job name | The gate counted the lifecycle workflow's own in-progress job as a CI check | Fixed: `kiro_gate.py` ignores `LIFECYCLE_JOB_NAMES`; update the template |
| Implementer opened a PR for an issue you had closed | The dispatcher did not check `issue.state` | Fixed: every issue mode refuses a non-open issue; update the dispatcher |
| Reviewer finished with no review and the PR stays `kiro-review` | The host refused a command (redirect, pipe, `npm ci` lifecycle scripts, nvm) in the unattended turn and the reviewer stopped | Fixed: plain-shell rule, `npm ci --ignore-scripts`, CI fallback with the refusal named under Commands; re-add `kiro-review` to retry |
| Scribe (or fast lane) reports "my role does not allow me to push" | The job used the planner's token, so the source routed it to the planner | One source and secret pair per role (`_SCRIBE`, `_WORKER`); doc 04, section 4.2 |
| Planner applies `kiro-needs-owner` on a clear issue | Older planner prompt held whenever it had added an `(assumption)` requirement of its own | Fixed: the planner's own ideas go to Open questions; it holds only for vague, infra, credentials, auth or data-deletion changes |
| Gate parks every PR with "CI: no check runs found" | The repository has no CI workflow on pull requests | Add one, or set `KIRO_GATE_REQUIRE_CI: "false"` on the `pr-gate` job (doc 04, section 4.3) |
| `Kiro Crew webhook unavailable` on every job although the gateway is running | The gateway is not on port 5476 | Set `KIROCREW_WEBHOOK_URL` in the workflow (doc 04, section 4.3) |
| A leftover `kiro-review-N` or `kiro-worktree-N` folder in the runner's `_work` | An agent stopped early before cleanup | Fixed in the prompts (clean up even on stop); remove the folder and `git worktree prune` in the trusted checkout |
| Every hop gets `HTTP 401` on a machine that used to work, or a second machine | The webhook sources (and so the tokens) belong to one gateway. The repo secrets were minted on another machine | Create five sources on **this** gateway and re-run `scripts/setup-github.sh` (doc 07, section 7.1) |
| Planner reads the code, drafts a spec, then reports "the tool policy refused" its first shell call; `no_interactive_approver` in the security log | No `hooks.auto_approve_tools` rules in `~/.kiro/crew/config.json`; a template's `allowedTools` does not grant shell or file tools on Kiro Crew 0.11 | `scripts/setup-gateway.sh` (doc 05, section 5.5) |
| `Write File`, `Replace in File`, `List Directory`, `File Search`, `Grep Search` or `Delete File` denied although `fs_write` is in the rules | Rules match the tool's display title, not its id | The rule list in doc 05, section 5.5 (`Write File*`, ...) |
| Refusal `a program name shadows the system program of that name` | A copy of `gh`, `node`, `npm` or `npx` earlier on `PATH` (`~/.local/bin`, `/usr/local/bin`) than the trusted one in `/usr/bin` | Move or delete the earlier copy; `scripts/setup-gateway.sh` names it |
| Refusal `not a system program and no approval has identified this file` | The program is outside `/usr/bin`, `/bin`, `/usr/sbin`, `/sbin` | Linux: `sudo ln -sfn <real path> /usr/bin/<name>`. macOS: approve `<name> --version` once in a dashboard chat after each gateway start |
| Refusal `a command word resolves to no program` on `shasum` | `shasum` is not installed (Amazon Linux, minimal Debian) | `sudo dnf install -y perl-Digest-SHA` or `sudo apt-get install -y perl` |
| Refusal `could not be tokenized` or `programs cannot be enumerated` | A heredoc, a multi-line `--body "..."`, a redirect, a pipe or `$(...)` in one command | Fixed in the templates: long text goes to a `/tmp` file with the write tool, then `--body-file`. Update the templates with `scripts/install-agent.sh` |
| Refusal on `TZ=Pacific/Auckland npx vitest run` | A `VAR=value` prefix is part of the command and needs its own rule | Rule `TZ=*` is in the default list |
| Implementer: `git fetch origin` fails with no credentials, right after `gh` was moved | The credential helper in `~/.gitconfig` still names the old `gh` path | `gh auth setup-git` |
| Implementer runs `npm ci` and tests fail on Node 18 while CI uses Node 20+ | `/usr/bin/node` is the distro's old Node (alternatives), while the Node you wanted sat in `/usr/local/bin` and is now refused as a shadow | Point `/usr/bin/node`, `npm`, `npx` at the Node major your CI uses (`sudo ln -sfn /usr/local/node-vXX/bin/node /usr/bin/node`, same for npm and npx) and remove the `/usr/local/bin` copies |
| Job stays `queued`; runner shows `offline` although you started it earlier | `./run.sh` was started in an SSH session that has since ended | Run it as a service (`SERVICE=1 scripts/install-runner.sh`) or with `nohup ./run.sh > runner.log 2>&1 &` |
| `kirocrew config set` says the file is read-only, or `install-agent.sh` says read-only file system | You ran it from an agent chat; `config.json` and `~/.kiro/agents` are protected from agents | Run it from your own terminal |

## What went wrong, in order

1. **Webhook turns cannot ask for approval.** The first worker designs failed because nobody can approve tool calls in an unattended turn. Lesson: decide the approval policy up front, and test a real write, not just a "hello". (Round three, below, is what that policy turned out to be.)
2. **The worker refused its own task.** It said it could not implement a change whose only specification was inside untrusted issue text. Correct behaviour for an agent, wrong for this workflow. Fix: have the dispatcher verify that the repository owner applied the label, then tell the worker that the decoded issue *is* the approved specification, while still forbidding commands, scope changes and sensitive areas. This is the "owner-gated prompt" in `dispatch_kiro_event.py`. It is the difference between an unreliable setup and a reliable one.
3. **Fixed branch names collide.** `kiro/issue-N` makes a second run on the same issue stop. The behaviour is safe (no force-push). A unique suffix per run would be a reasonable improvement; it is not implemented here.
4. **Pasted commands can break in zsh.** A command with `<placeholders>` or a trailing `#` comment fails in an interactive zsh. Keep every command in the docs free of both.
5. **Outages look like your bug.** During one test, even GitHub-hosted jobs sat queued because of a GitHub Actions incident. Check the status page before debugging your setup.
6. **Moving to a mate needed a rebind and a restart** (older builds). Routing the webhook to the `github-worker` mate first failed every run after half a second with `ForkGovernanceUnresolved`: the mate ran on its own edited template copy but was still bound to the shared `worker` template. Rebinding fixed the config, but runs kept failing until Kiro Crew was restarted. Creating mates under their own names from the CLI (doc 05) avoids the whole problem.
7. **An agent recovers from small problems by itself.** In one run, the tests failed because of the local Node version, and a parallel git add and commit pushed an empty branch. It diagnosed both, worked around the first, redid the second, and reported what it did. You see this only in the final notification, so read it.
8. **An agent gives you its prompt, not its memory.** Webhook runs leave any mate's private memory and dashboard empty. Treat each run as starting from scratch, and put anything it must always know in its prompt.
9. **Turn off what you don't use.** The automatic PR review ran on every PR and push and shared the one runner with implementation jobs. It was removed from the default workflow; doc 04, section 4.6 shows how to add it back.
10. **Have the code reviewed, then test the fixes.** A review by a second agent found gaps the first tests did not: Python's `urllib` honours proxy settings and copies the `Authorization` header across redirects, GitHub does not render HTML comments, and a label approves the raw issue body. Each is now fixed in the dispatcher and covered by a test that fails on the old behaviour.

## What went wrong building the lifecycle (second round)

11. **An orchestrator that polls is the wrong shape.** The first lifecycle used a long-lived conductor mate that polled an inbox directory every 10 minutes, claimed records, and dispatched its own worker sessions for implement and review. It worked, but it had six jobs, a 14 KB prompt, a 10-minute idle gap on every run, and its review was "independent" only by convention (same memory store). It also stalled whenever its chat lost Trust mode after a restart. Replacing it with one agent per label and a deterministic gate removed the orchestrator, the polling and the stall at once. The Kiro team's advice ("labels are a perfectly good queue") turned out to be the whole design, not just the start.
12. **The planner blocked its own approval.** Its rule said "do not self-approve if any requirement is marked (assumption)". Being thorough, it added assumptions, then held. One issue sat 8 hours. Fix: the planner specifies only the owner's words and puts its own ideas under Open questions, so the owner approves their own text and the hold fires only for vague issues or sensitive areas. A held issue now carries `kiro-needs-owner` so you can see it.
13. **The gate counted itself.** The lifecycle workflow's jobs are check runs on the head commit, and the gate was "in progress" while it read them, so it parked its first PR with "CI: pr-gate is pending". The gate now ignores its own workflow's job names.
14. **Closing an issue mid-run does not stop the run.** The planner self-approved an issue the owner had closed seconds earlier, and the implementer built it. The dispatcher now refuses any issue label on a closed issue, and the implementer re-checks before opening a PR.
15. **Unattended turns refuse shell patterns, and an agent that stops is worse than one that degrades.** The reviewer twice ended without a verdict: once on a redirected test command, once on `npm ci` (lifecycle scripts). Each time it correctly refused to invent a result, but a PR stuck at `kiro-review` is a worse outcome than a verdict that names the gap. The prompts now say: plain commands only, `npm ci --ignore-scripts`, and if install or tests are refused, fall back to the head commit's CI check runs, say so under Commands, and still give a verdict. The gate re-verifies CI anyway.
16. **A borrowed token is a borrowed identity.** The scribe and fast-lane jobs reused the planner's token to save setup. The source routed them to the planner, which refused to push. Every role now has its own source and secret pair. The rule: one role, one job, one token.
17. **Webhook sources route to templates, not mates.** The first design assumed each role should be a mate with its own memory, and the docs said so. The Webhooks Agent picker lists templates only, so runs always executed on the templates with the default memory store; recreating mates after prompt edits changed nothing, and template edits took effect at once. The docs now say: install templates, create sources on templates, mates optional. Isolation between implementer and reviewer is by session and by rule, not by memory store.
18. **Labels written by `github.token` do not re-trigger the workflow.** That is what makes `kiro-ready-to-merge` and `kiro-parked` terminal: the gate writes them with the job token, while agents write their labels through your `gh` login, which does trigger the next hop. Keep that split.

## What went wrong moving to EC2 (third round, Amazon Linux 2023 arm64, Kiro Crew 0.11.0)

The first full lifecycle on an EC2 box took seven re-labels of one issue. Every failure was the same shape: the agent did its thinking, then its first *acting* tool call was refused by the unattended-turn policy and it stopped. Each refusal uncovered the next. None of it was visible in GitHub, only in the dashboard notification and in `~/.kiro/crew/security_events.jsonl`.

19. **A webhook source belongs to one gateway.** The repo secrets had been minted on another machine. The dispatcher got HTTP 200 (accepted) from the new box, then every hop 401'd. One machine per repo, and five new sources whenever the machine changes.
20. **`allowedTools: ["shell"]` grants nothing on 0.11.** The docs said the templates auto-approve shell. On the KAS engine the host withholds shell and file tools from template-level grants on purpose: a tool-name allowlist has no scope. The gateway's `hooks.auto_approve_tools` is the only path, and it was empty. `scripts/setup-gateway.sh` now writes it.
21. **Rules match titles, not tool ids.** `fs_write` matched nothing; `Write File*` did. The tool titles are kiro-cli's display strings. `List Directory`, `File Search`, `Grep Search`, `Replace in File`, `Delete File` each needed a rule before the planner could even look around.
22. **A rule is honoured only for trusted, unshadowed programs.** Even with `gh *` in place, `gh` in `~/.local/bin` was refused as a non-system program. Copying it to `/usr/bin` then made the `~/.local/bin` copy a *shadow*, refused again. Same for `node`, `npm`, `npx` in `/usr/local/bin`. The rule is: the program must be in `/usr/bin`, `/bin`, `/usr/sbin` or `/sbin`, and nothing earlier on `PATH` may carry its name. On macOS `/usr/bin` cannot be written, so there the only path is a one-time human approval per gateway start.
23. **Moving `gh` breaks git.** `gh auth setup-git` writes the absolute path of `gh` into `~/.gitconfig`. After the move, `git fetch` had no credentials. Re-run `gh auth setup-git`.
24. **Long text cannot go through the shell.** The planner tried a heredoc, the implementer and reviewer a multi-line `--body "..."`. The host refuses anything it cannot tokenize as one line. The planner and reviewer had no `write` tool, so they could not even make the `--body-file` file. All four templates now have `write` and say so.
25. **Each distro hides something.** Amazon Linux has no `shasum` (it is in `perl-Digest-SHA`), its `/usr/bin/node` is Node 18 through `alternatives` while Vite 7 needs 20+, and `TZ=... npx vitest` needs a `TZ=*` rule. `scripts/setup-gateway.sh` checks the programs; the Node major you must pick yourself.
26. **A runner started in an SSH session dies with it.** Jobs sat `queued` with the runner `offline`. On EC2 install it as a service; in a container use `nohup`.
27. **The agents are honest about refusals, which is what saved the day.** Every report named the exact command and refusal code, and the implementer refused to touch an existing `kiro/issue-N` branch, so each retry started clean (after deleting the branch). Read the notification; the fix is always in it.

Once all of this was in place the lifecycle ran unattended end to end: planner 1 min, implementer 3 min (npm ci, 210 tests, tsc, eslint, build, PR), reviewer 2 min, gate seconds. That is what `scripts/setup-gateway.sh` and the new checks in `scripts/preflight.sh` encode.

## Reading the evidence yourself

Workflow runs and their state:

```bash
gh run list --repo OWNER/REPO --limit 5
```

Why a job failed (replace `RUN_ID`):

```bash
gh run view RUN_ID --repo OWNER/REPO --log-failed
```

Whether the runner is online:

```bash
gh api repos/OWNER/REPO/actions/runners
```

Whether the PR appeared, and where it is in the lifecycle (replace `N` with the issue number):

```bash
gh pr list --repo OWNER/REPO --head kiro/issue-N --state all --json number,labels
```

The label history of a PR, which shows every hop with its time and actor:

```bash
gh api repos/OWNER/REPO/issues/PR_NUMBER/timeline --jq '.[] | select(.event=="labeled" or .event=="unlabeled") | "\(.created_at) \(.event) \(.label.name) by \(.actor.login)"'
```

On the Kiro Crew side, the notification for each run is the record of what the agent did, and the Webhooks page lists recent runs with their outcome and duration. The gateway log shows which agent ran each session and why a run was refused:

```bash
kirocrew logs -n 500 | grep -E "hook|webhook|denied|refus"
```

Every tool call a webhook run made, with its verdict and refusal code, is in the security log. Replace `RUN_ID` with the GitHub Actions run id (it is part of the session key):

```bash
grep RUN_ID ~/.kiro/crew/security_events.jsonl | python3 -c 'import sys,json
for l in sys.stdin:
    e=json.loads(l)
    if e["event_type"]=="tool_invocation" and e.get("outcome") not in ("approval_pending","auto_approved"):
        print(e["timestamp"][11:19], e["outcome"], (e.get("operation") or "")[:100].replace("\n"," "), e.get("error"), e.get("metadata"))'
```

`denied` with `no_interactive_approver` means no rule matched; `auto_approve_declined` with a `name_grant` code means a rule matched but a program failed the trusted-file check, and the `code` says which way (`shadows_system_program`, `untokenizable`, `unpinned`).

## Ideas not built yet

- A `/kiro` comment on the PR that becomes a `kiro-changes-requested` round with the owner's findings.
- An allowlist of maintainers instead of a single owner, for org repositories.
- A separate GitHub account for the mates, so reviews can be real approvals and branch protection can require one.
- A per-repository Node version for the agents (today the machine's `/usr/bin/node` must match the repo's CI major; nvm is refused in unattended turns).
- `fetch-depth: 0` on the review and gate checkouts so `git diff origin/main` works in the worktree.
- A line in the PR body naming the mate, since GitHub shows your account as the author.
