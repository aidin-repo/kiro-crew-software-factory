# 4. Lessons learned and troubleshooting

Everything here happened while building the working setup, so each item is a real failure with a known cause or fix. Where a cause is my best explanation rather than a confirmed fact, it says so.

## Symptom table

| Symptom | Likely cause | Fix |
|---|---|---|
| `issue-task` job stays **queued** | The runner is offline or stopped | Start it: `cd <runner dir> && ./run.sh`. `gh api repos/OWNER/REPO/actions/runners` shows `status` |
| *All* jobs queued, including GitHub-hosted ones | A GitHub Actions incident | Check githubstatus.com. Jobs run by themselves when it recovers |
| Job fails: "label must be applied by the repository owner" | A non-owner applied the label, or the repo belongs to an org | Have the owner apply it. For org repos, see doc 01, section 1.1 |
| Job fails: "The issue must be written by the repository owner" | Someone else opened the issue, even though you applied the label | Copy the text into a new issue that you write, and label that one |
| Job fails: "KIRO_WORKSPACE is not a trusted default-branch checkout" | The checkout path does not start with `trusted-main-` | Do not rename that path in the workflow |
| `Kiro Crew webhook rejected: HTTP 401` | Wrong token or signing secret, or clock skew over 5 minutes | Re-create the source, re-run `setup-github.sh`, check the system clock |
| `HTTP 403` | Origin or host check rejected the request | The dispatcher sends `Origin` itself; confirm the URL is the loopback gateway |
| `HTTP 503` | Webhooks kill switch is on, or the source is paused | Turn it back on in the Webhooks page |
| `HTTP 429` | Six runs already in flight, or 10 failed auths in a minute | Wait and retry |
| `Kiro Crew webhook unavailable` | The gateway is not running on that port | Start Kiro Crew; run `scripts/preflight.sh` |
| `Kiro Crew webhook rejected: HTTP 409` | `session_busy` (same session key still running), `agent_conflict`, or `destination_agent_unavailable` (the source's agent was deleted) | Wait for the run to finish, or re-point the source to an installed agent on the Webhooks page |
| Webhook accepted (HTTP 200), nothing happens | The turn failed or an unattended tool call was blocked by the approval policy. HTTP 200 only means accepted | Read the run's notification and the Webhooks Activity list; see doc 02, section 2.5 |
| Run fails after about 0.5 s: `Hook agent error: internal failure`; gateway log shows `ForkGovernanceUnresolved` | The crewmate runs on a private template copy but is bound to the shared base template, or the gateway still holds an old failed check | Doc 02, section 2.4: rebind with `kirocrew agent update`, then quit and reopen Kiro Crew |
| Crewmate's Webhook tab says no tokens are bound | The source routes to a template, not the crewmate | Webhooks page, the source, Routing, Agent: pick `github-worker` |
| Crewmate dashboard is empty after successful runs | Expected: the dashboard tracks the crewmate's chat and goals, not webhook runs | Use the notification and the Webhooks Activity list (doc 02, section 2.6) |
| A Kiro Crew review still runs after you removed it | `pull_request_target` uses the workflow on the default branch | Merge the workflow change; the PR that removes it is reviewed by the old version |
| Local `localStorage` tests fail, CI passes | Node 26's built-in Web Storage shadows jsdom's | Not your change; the crewmate reran with `NODE_OPTIONS=--no-experimental-webstorage` |
| Branch pushed with no commit | git add and commit ran in parallel | The template prompt now requires git steps one at a time |
| Worker says it cannot act on "untrusted" issue text | Dispatcher lacked the owner-approval wording | Use the dispatcher in this folder (it includes the owner-approved prompt) |
| Worker stops: branch `kiro/issue-N` exists | Re-run on an issue that already has the branch | Doc 03, section 3.7 |
| `gh issue edit <number> ...` gives "no such file or directory" in zsh | You pasted a placeholder in angle brackets | Replace it with the real number and remove the brackets |
| `cd ~/runner   # comment` gives "too many arguments" in zsh | An inline `#` comment is not a comment in an interactive zsh | Run commands without trailing comments |
| `./run.sh: no such file` | You are in the wrong folder, or the runner was never configured | The configured folder has a `.runner` file |

## What went wrong, in order

1. **Webhook turns cannot ask for approval.** The first worker designs failed because nobody can approve tool calls in an unattended turn. Lesson: decide the approval policy up front, and test a real write, not just a "hello".
2. **The worker refused its own task.** It said it could not implement a change whose only specification was inside untrusted issue text. Correct behaviour for an agent, wrong for this workflow. Fix: have the dispatcher verify that the repository owner applied the label, then tell the worker that the decoded issue *is* the approved specification, while still forbidding commands, scope changes and sensitive areas. This is the "owner-gated prompt" in `dispatch_kiro_event.py`. It is the difference between an unreliable setup and a reliable one.
3. **Fixed branch names collide.** `kiro/issue-N` makes a second run on the same issue stop. The behaviour is safe (no force-push). A unique suffix per run would be a reasonable improvement; it is not implemented here.
4. **Pasted commands can break in zsh.** A command with `<placeholders>` or a trailing `#` comment fails in an interactive zsh. Keep every command in the docs free of both.
5. **Outages look like your bug.** During one test, even GitHub-hosted jobs sat queued because of a GitHub Actions incident. Check the status page before debugging your setup.
6. **Moving to a crewmate needs a rebind and a restart.** Routing the webhook to the `github-worker` crewmate first failed every run after half a second with `ForkGovernanceUnresolved`. The crewmate ran on its own edited template copy but was still bound to the shared `worker` template, so Kiro Crew refused to start it. Rebinding fixed the config, but runs kept failing until Kiro Crew was restarted. After that, every run worked.
7. **The crewmate recovers from small problems by itself.** In one run, the tests failed because of the local Node version, and a parallel git add and commit pushed an empty branch. It diagnosed both, worked around the first, redid the second, and reported what it did. You see this only in the final notification, so read it.
8. **A crewmate gives you its prompt, not its memory.** Webhook runs left the crewmate's private memory and dashboard empty. Treat each run as starting from scratch, and put anything it must always know in its prompt.
9. **Turn off what you don't use.** The automatic PR review ran on every PR and push and shared the one runner with implementation jobs. It was removed from the default workflow; doc 01, section 1.6 shows how to add it back.
10. **Have the code reviewed, then test the fixes.** A review by a second crewmate found gaps the first tests did not: Python's `urllib` honours proxy settings and copies the `Authorization` header across redirects, GitHub does not render HTML comments, and a label approves the raw issue body. Each is now fixed in the dispatcher and covered by a test that fails on the old behaviour.

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

Whether the PR appeared (replace `N` with the issue number):

```bash
gh pr list --repo OWNER/REPO --head kiro/issue-N --state all
```

On the Kiro Crew side, the notification for each run is the record of what the crewmate did, and the Webhooks page lists recent runs with their outcome and duration. The gateway log shows which agent ran each session and why a run was refused:

```bash
grep -n -E "New session: hook:github|ForkGovernanceUnresolved|Hook agent (completed|error)" ~/.kiro/crew/gateway.log
```

## Ideas not built yet

- A unique branch name per run, or "push a follow-up commit to the existing branch".
- A `/kiro` comment on the PR that sends owner feedback to the crewmate for a follow-up commit.
- An allowlist of maintainers instead of a single owner, for org repositories.
- A label that requests a plan first and waits for approval before coding.
- Posting the PR link back to the issue as a comment from the dispatcher.
- A line in the PR body naming the crewmate, since GitHub shows your account as the author.
