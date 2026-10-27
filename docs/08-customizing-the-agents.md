# 8. Customizing the agents: your prompts, your stack, your roles

The six agents are plain files. You can change what each one knows, what it may run, how it works for your repository's language and tooling, and you can add roles. This page says where each kind of change goes, how to keep it across updates, and which parts you must not change because other parts parse them.

## 8.1 Three layers

| Layer | File | Scope | Takes effect |
|---|---|---|---|
| **Role prompt and tools** | `~/.kiro/agents/<role>.json`: `prompt`, `tools`, `allowedTools`, `description` | this machine, every repository it serves | the next webhook run; no restart, no mate step |
| **Per-repository instructions** | `.github/scripts/dispatch_kiro_event.py` in your repository, function `instructions()`: one text block per mode | one repository | after the change is merged to the default branch (the workflow runs from there) |
| **Repository knowledge** | `AGENTS.md`, `CONTRIBUTING.md`, steering files, `package.json` scripts: whatever is in the trusted checkout | one repository | immediately, if a prompt tells the agent to read it |

The agent sees, in this order: its template `prompt`, then the message the dispatcher built (trusted control plane, the mode's `instructions()` text, the untrusted issue block). Put stable rules about the *role* in the template and rules about *this repository* in the dispatcher text or in `AGENTS.md`.

## 8.2 Change a prompt and keep it across `git pull`

Do not edit `templates/agent/*.json` in your clone: the next `git pull` conflicts, and `scripts/install-agent.sh` would overwrite `~/.kiro/agents` with the shipped version. Use the local folder instead:

```bash
mkdir -p templates/agent.local
cp templates/agent/delivery-reviewer.json templates/agent.local/
# edit templates/agent.local/delivery-reviewer.json
scripts/install-agent.sh
```

`templates/agent.local/` is git-ignored. For every name, `install-agent.sh` prefers the file there over the shipped one and prints `(local override)` so you can see which was used. A name that exists only locally installs as a new role (section 8.5). The file's `"name"` must equal its file name; the script refuses otherwise, because the webhook source routes by that name.

If you already edited a file in `~/.kiro/agents/` by hand, `scripts/install-agent.sh --keep` leaves any installed file that differs from both the shipped and the local template, and says `Kept`. Without `--keep` it is backed up to `<name>.bak.<timestamp>` and replaced.

To see what a shipped update changed before adopting it:

```bash
git diff HEAD@{1} -- templates/agent/
```

Edits take effect on the next run. Webhook runs read `~/.kiro/agents/<role>.json` every time; nothing is cached. Mates, if you created any, copy the template at creation and must be recreated to pick up a change (doc 05, section 5.3).

## 8.3 Make it fit your stack

The shipped prompts and dispatcher texts are written for a Node repository (`npm ci`, `npx vitest run`, `npx tsc -b`, `npx eslint`, `npm run build`). Three places name those commands:

| Where | What to change |
|---|---|
| `templates/agent/delivery-implementer.json`, `delivery-reviewer.json` (prompt) | the install, test, lint and build commands, and the "how CI does it" wording |
| `.github/scripts/dispatch_kiro_event.py`, `instructions()` for `pr-review-round` | `npm ci --ignore-scripts` |
| `~/.kiro/crew/config.json`, `hooks.auto_approve_tools` | one rule per program the agents will run (`pytest *`, `uv *`, `cargo *`, `go *`, `make *`) |

And one rule with no file: **every program must be in `/usr/bin` (or `/bin`), unshadowed**, or the unattended turn refuses it (doc 05, section 5.5). `python3 -m pytest` works where `pytest` from a `.venv` does not, because `/usr/bin/python3` is trusted and `.venv/bin/pytest` is not. A project-local tool (`node_modules/.bin/vitest`) is fine when called through `npx`, because `npx` is the program the host checks.

Worked example, a Python repository with pytest and ruff:

1. In `templates/agent.local/delivery-implementer.json` and `delivery-reviewer.json`, replace the Node commands with `python3 -m pip install -r requirements.txt`, `python3 -m pytest -q`, `python3 -m ruff check .`. Keep every sentence about worktrees, `--body-file`, one-line commands, labels and the files block.
2. In your repository's `.github/scripts/dispatch_kiro_event.py`, `pr-review-round`: replace `install with \`npm ci --ignore-scripts\`` with `install with \`python3 -m pip install -r requirements.txt\``. Merge that.
3. Add rules: `kirocrew config set hooks --value-base64=...` with `python3 *` added to the list, or run `scripts/setup-gateway.sh` after adding `"python3 *"` to its `RULES` in your fork. (`python3 *` lets an unattended agent run any Python; keep the rule if you accept that.)
4. `scripts/install-agent.sh`, then `scripts/preflight.sh OWNER/REPO`, then one `kiro-task` issue as a smoke test before a full `kiro-deliver`.

Repository-specific rules (which folders are off limits, how to name branches, which tests must run) belong in your repository's `AGENTS.md`. The shipped prompts do not read it on their own; add one sentence to the implementer and reviewer prompts: `Read AGENTS.md at the root of the trusted checkout first and follow it where it does not conflict with these instructions.`

## 8.4 Change what a role may do

`tools` is what the agent can see; `allowedTools` is what kiro-cli would auto-approve on an interactive surface. In a webhook run neither grants shell or file access by itself (doc 05, section 5.5): a call runs only if a `hooks.auto_approve_tools` rule matches it and the program is trusted. So:

- To **give** a role a new ability: add the tool to `tools` and `allowedTools`, add a rule for the program, make sure the program is in `/usr/bin`.
- To **take away** an ability: remove the tool from `tools`. The planner, for instance, has `write` only so it can create the spec file under `/tmp`; its prompt forbids writing anywhere else, and the gate would reject a PR touching files outside the `files` block anyway, but removing `write` from the reviewer would stop it from creating its review body file.
- `web_fetch`, `web_search`, `use_subagent`: not in any shipped template, on purpose. The prompts also say "never delegate to a sub-agent". Adding them widens what untrusted issue text can reach.

## 8.5 Add a role

A role is a template, a webhook source, a secret pair, a label and a workflow job. Example: a `delivery-security` reviewer that runs after the normal review and before the gate.

1. **Template.** `templates/agent.local/delivery-security.json` with `"name": "delivery-security"`, its own prompt, `tools` `["glob","grep","read","shell","tool_search","write"]`. `scripts/install-agent.sh` installs it.
2. **Webhook source.** Settings → Webhooks → New, agent `delivery-security`, signed. Store the pair as `KIROCREW_WEBHOOK_TOKEN_SECURITY` and `KIROCREW_WEBHOOK_SIGNING_SECRET_SECURITY` with `gh secret set`.
3. **Label.** `gh label create kiro-security-review --repo OWNER/REPO`.
4. **Workflow job.** Copy the `pr-review-round` job in `.github/workflows/kiro-crew-events.yml`, name it `pr-security-round`, trigger on `kiro-security-review`, point its `KIRO_MODE` at a new mode and its secrets at the new pair.
5. **Dispatcher.** In `dispatch_kiro_event.py`, add the mode to `ALLOWED_MODES` and `PR_LABEL_MODES`, map it to its label in `LABEL_FOR_MODE`, and add an `instructions()` block. Reuse the owner-gated wording of `pr-review-round`. Add a test in `.github/scripts/tests/`.
6. **Chain it.** Change the reviewer's handoff so approve applies `kiro-security-review` instead of `kiro-ready`, and have the security role apply `kiro-ready` on pass. The gate is unchanged.
7. **Round limit.** If your role can request changes, count its label events the way `pr-changes` does, or the loop has no cap.

Keep the roles single-purpose. The factory works because each agent reads one label and writes one label.

## 8.6 What you must not change

Other parts parse these. Changing one without changing its reader breaks the chain silently: the agent finishes, reports success, and the next hop never fires or the gate parks the PR.

| Contract | Written by | Read by |
|---|---|---|
| The trusted control-plane section and the `UNTRUSTED_GITHUB_DATA_BASE64` block in the message | dispatcher | every role's prompt |
| Spec comment starting `## Intent`, ending its design with a ```` ```files ```` block | planner | implementer, reviewer, gate (`kiro_gate.py` rejects files outside it) |
| PR body lines `Closes #N`, `Spec: <comment url>`, `Spec-SHA256: <64 hex>` | implementer | reviewer, gate (`SPEC_SHA_PATTERN`) |
| Review body first line `VERDICT: approve` or `VERDICT: request-changes`, then `HEAD REVIEWED: <40-char sha>` | reviewer | gate (`kiro_gate.py` matches the head) |
| Gate comment marker `<!-- kiro-gate -->` | gate | smoke test, humans |
| Label names (`kiro-plan` ... `kiro-parked`) and branch names `kiro/issue-N`, `kiro/docs-pr-N` | all | workflow triggers, dispatcher label table, gate, smoke test |
| Owner checks: issue author, label sender, PR branch, PR open | dispatcher | the security model; do not loosen |
| Plain one-line shell, long text via the write tool and `--body-file`, programs in `/usr/bin` with a rule | templates | the unattended policy (doc 05, section 5.5) |
| `MAX_REVIEW_ROUNDS` | dispatcher | `pr-changes`; the cap that stops a review loop |

If you rename a label, change it in the workflow `if:` conditions, the dispatcher's label table, `kiro_gate.py`, `scripts/setup-github.sh`, `scripts/preflight.sh` and `scripts/smoke-test.sh` together.

## 8.7 Test a prompt change

1. Edit the local template, `scripts/install-agent.sh`.
2. `scripts/preflight.sh OWNER/REPO` (checks the template is installed and the rules exist).
3. One small issue with `kiro-task` (fast lane, one hop) or `kiro-deliver` (all hops). `CLEANUP=1 scripts/smoke-test.sh OWNER/REPO` does this for you with a one-line docs change.
4. Read the dashboard notification for the run. It names every refused command with its code. The security log has the full list (doc 09, "Reading the evidence yourself").
5. If an agent stopped at a refusal, fix the rule or the program path, delete `kiro/issue-N` if a branch was pushed, and re-apply the label.
