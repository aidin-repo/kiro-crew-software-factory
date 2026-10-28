# Software Factory (Kiro Crew app)

The control room for the delivery pipeline described in this repository. It observes;
it never labels, dispatches or merges, so the no-orchestrator design of the pipeline is
unchanged.

What the page shows:

| Tab | Source | Content |
|---|---|---|
| Board | GitHub via `gh` | Every issue carrying a `kiro-*` label as a card in its stage (planning, needs owner, implementing, in review, fixing, gate, ready, parked, shipped), time in stage, CI state, review rounds, credits, one bar per agent hop; a pulsing card means an agent is running on it right now |
| Agent runs | `~/.kiro/crew/webhook_runs.json` joined to `~/.kiro/sessions` | Each webhook run: agent template, hop kind, issue or PR, outcome, duration, model, tool calls, credits; "steps" opens the transcript, "watch" follows a live one |
| Agents | same | Per template: runs, failures, average and p90 duration, average credits, model, last outcome; runs and credits per day for 14 days |
| Infrastructure | `gh api` + gateway files | Actions runner, inbound-webhook switch, sources, installed templates, recent workflow runs |

Clicking a board card opens the issue's timeline of hops with links to the issue, PR
and docs PR; each hop opens its transcript.

## Install

On the gateway host that runs the pipeline (for a remote factory, the EC2 box), as the
user the gateway runs as, from a normal terminal:

```bash
git pull
scripts/install-app.sh
```

The script builds the page (`npm`), installs the app, grants execution trust to this
app alone, and enables it. Reload the dashboard and **Software Factory** is in the
sidebar under Apps. No gateway restart is needed.

Done by hand, the same steps are:

```bash
cd app/software-factory/ui && npm install && npm run build && cd -
kirocrew app install ./app/software-factory
kirocrew app enable software-factory        # refused until the app is trusted, see below
```

### Trust

Kiro Crew runs apps that did not ship inside the package as **third-party**, and
third-party execution is deny-by-default: `kirocrew app enable` is refused with
"third-party app execution is disabled" until you grant trust. Two ways:

- **Dashboard** (one click): Apps → Library → Software Factory → Enable. A consent
  dialog names what the app receives; confirming grants trust to this app only and
  enables it.
- **Terminal**: add `software-factory` to both `agent.apps_trusted` and
  `agent.apps_trusted_local` (the second marks a locally installed source). The
  install script does exactly this, merging into whatever is already listed.

Do not set `agent.apps_allow_third_party=true`; that trusts every third-party app.

An app runs with the gateway's own privileges; there is no sandbox around it. This
one is stdlib Python, read-only apart from its own `data/` folder, and short enough to
read: `backend/server.py`.

### Updating

After a change: `scripts/install-app.sh` again (or `npm run build` in `ui/` and
`kirocrew app install ./app/software-factory`). The install replaces the copy under
`~/.kiro/crew/apps/software-factory/` and restarts the backend; trust is kept.

## Configuration

The watched repository defaults to `aidin-repo/task-chatbot`. Change it with
`REPO=owner/name scripts/install-app.sh`, or write
`~/.kiro/crew/apps/software-factory/data/config.json` as `{"repo": "owner/name"}` and
disable/enable the app so the backend restarts. The backend port is chosen by the
gateway (`port: auto`); the dashboard reaches it through `/apps/software-factory/api/`.

## Requirements

* `gh` logged in on the gateway host with read access to the repository.
* The app must run on the **same gateway** that executes the webhook hops. Runs and
  transcripts are read from that gateway's own files; a gateway elsewhere sees only the
  GitHub side of the board.

## Data

* `data/config.json`: the watched repository.
* `data/runs_ledger.json`: every webhook run seen for the repository. The gateway
  keeps only the last 50 runs; this ledger keeps all of them.

Nothing is written anywhere else. Secrets are never read: the webhook token file holds
hashes and labels only, and the app reads it solely for the enabled switch, source
labels and last-used times.

## Layout

```
software-factory/
├── app.json              manifest
├── assets/icon.png
├── backend/server.py     stdlib HTTP backend (gh + gateway files → JSON)
└── ui/
    ├── package.json      vite + react toolchain
    ├── vite.config.ts
    ├── src/App.tsx       the page
    └── dist/index.mjs    built bundle (committed; the install copies it)
```
