# 3. Delivery lifecycle reference

One agent, one job. Every handoff is a GitHub label event. Nothing polls except the auditor, whose only job is to notice a stall. This page is the reference for the roles, the trust boundaries and where things run. The walkthrough with diagrams is [doc 02](02-how-it-works.md); setup is [doc 01](01-quickstart-checklist.md).

## Agents

| Agent (template) | Model | Trigger | Does | Hands off with |
|---|---|---|---|---|
| delivery-planner | Opus | `kiro-plan`, `kiro-deliver` on an issue | Posts one AIDLC spec comment with a ```` ```files ```` block | `kiro-approved`, or `kiro-needs-owner` when it must not self-approve |
| delivery-implementer | Opus | `kiro-approved` on an issue; `kiro-changes-requested` on a PR | Fresh worktree, builds inside the files block, opens or updates the PR | `kiro-review` on the PR |
| delivery-reviewer | Sonnet | `kiro-review` on a PR | Independent review: tests, build, scope, spec hash. One `VERDICT:` review | `kiro-ready` or `kiro-changes-requested` |
| pr-gate (script) | none | `kiro-ready` on a PR | Deterministic: head SHA reviewed, CI green, files in scope, rounds <= 3, spec hash | `kiro-ready-to-merge` or `kiro-parked`; on PASS the same job dispatches the approver |
| delivery-approver | Opus | `kiro-ready-to-merge` written by the gate (dispatched by the `pr-gate` job, since a token-written label fires no event) | Reads spec, review, gate comment and diff through `gh`, checks out nothing. One `DECISION:` comment. Merges only when `KIRO_APPROVER_MERGE` is `"true"` | `kiro-approved-to-merge` or `kiro-needs-owner` |
| delivery-scribe | Sonnet | PR merged into default branch | Docs-only PR | nothing |
| delivery-auditor (as the `auditor` mate) | Sonnet | timer | Lists stuck labels and failed runs | nothing (reports only) |
| github-worker | Sonnet | `kiro-task` on an issue | Fast lane, no spec, no review | PR |

The model column is the `model` field in each template (`claude-opus-5.5`, `claude-sonnet-5.5`); the roles that write or judge code get Opus, the ones that read and summarize get Sonnet. Override it per role in `templates/agent.local/` ([doc 08](08-customizing-the-agents.md)). Each role is its own webhook source on the Kiro Crew Webhooks page, routed to its own template, so a job never runs with another role's rules. Each run is an ephemeral session; the reviewer never reads the implementer's session and judges only what is on GitHub. The labels each role reads and writes are listed in [doc 02](02-how-it-works.md#the-labels).

## Watching a run

You do not need any dashboard. The labels are the status:

| Want to know | Look at |
|---|---|
| Which stage | Label on the issue, then on the PR |
| Planner held it | `kiro-needs-owner`; reason under Open questions in its comment |
| Reviewer's conclusion | The `VERDICT:` review on the PR |
| Why the gate passed or parked | The "Delivery gate" comment on the PR |
| Approver's conclusion | The `DECISION:` comment on the PR; `kiro-needs-owner` on the PR means it escalated |
| A hop did not fire | Actions tab, workflow "Kiro Crew delivery lifecycle"; each job is one hop |
| What an agent reported | Dashboard notification "Webhook: GitHub <repo>" |
| Full transcript | Dashboard, Settings → Webhooks, Activity, click the run |
| Every tool call and refusal | `~/.kiro/crew/security_events.jsonl` ([doc 09](09-lessons-and-troubleshooting.md#reading-the-evidence-yourself)) |

Typical timings: planner 30 to 90 s, implementer 2 to 5 min, reviewer 1 to 3 min, gate seconds. Label to `kiro-ready-to-merge` in 4 to 8 minutes; the approver adds one read-only model turn after that (not yet measured).

If you would rather see all of that in one place, the optional **Software Factory** app ([`app/software-factory`](../app/software-factory/README.md), installed with `scripts/install-app.sh` on the gateway host) puts every `kiro-*` issue on a stage board, links each hop to the agent run behind it (template, model, duration, credits, tool calls), opens a run's transcript while it is still executing, and shows runner, webhook and template health. It observes only.

## Trust boundaries

The [README's Security model](../README.md#security-model) is the summary; these are the checks as enforced.

- Every job re-validates the event in `dispatch_kiro_event.py`: the owner wrote the
  issue, the owner applied the label, the PR is on `kiro/issue-N` in this repository.
- Agents read the spec from the owner's own comment and verify its SHA-256 from the PR
  body. Issue bodies, other comments and diffs are untrusted data.
- The gate is the only job with a write token, and it never checks out PR code. It requires at least one CI check run on the PR head unless `KIRO_GATE_REQUIRE_CI` is `false` on the `pr-gate` job.
- The dispatcher posts to `127.0.0.1:5476` unless `KIROCREW_WEBHOOK_URL` is set in the job's `env:`; any non-loopback address is refused.
- Nothing merges by default. `kiro-approved-to-merge` is the pipeline's last word; the
  owner's merge is the human gate. The approver merges only when the `pr-gate` job sets
  `KIRO_APPROVER_MERGE: "true"`, and even then never a PR with a `## Sensitive changes`
  section. The approver is a model, so its judgment is the weaker layer; the gate's
  checks stay the enforced one.
- Review rounds are capped at 3 (`MAX_REVIEW_ROUNDS`); the gate parks anything past it.

## Where it runs

Everything runs on the machine that hosts the self-hosted runner and the Kiro Crew gateway: the Actions jobs (which only validate the event and POST a signed webhook to `127.0.0.1`), the agents, their worktrees, tests and git pushes. GitHub stores issues, labels, branches and PRs and fires the events; the project's own `ci.yml` may run on GitHub-hosted runners and the gate reads its results through the API. If the machine is off, labels wait in the Actions queue until it is back. That machine can be a laptop, an EC2 instance or a container ([doc 07](07-run-on-a-remote-machine.md)).
