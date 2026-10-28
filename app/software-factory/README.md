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

On the gateway host that runs the pipeline (for a remote factory, the EC2 box):

```bash
cd app/software-factory/ui && npm install && npm run build && cd -
kirocrew app install ./app/software-factory
kirocrew app enable software-factory
```

The install command must run as the dashboard owner in a normal terminal; an agent
session is refused. The page appears in the sidebar as **Software Factory**.

Rebuilding after a change: `npm run build` in `ui/`, then `kirocrew app install` again
(it replaces the copy under `~/.kiro/crew/apps/software-factory/`). The gateway
restarts the backend process on install.

## Configuration

The watched repository defaults to `aidin-repo/task-chatbot`. Change it with:

```bash
curl -X POST http://127.0.0.1:<backend-port>/api/config -d '{"repo":"owner/name"}'
```

or set `FACTORY_REPO` in the backend's environment. The backend port is chosen by the
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
