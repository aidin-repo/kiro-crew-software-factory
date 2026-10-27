# 7. Run it anywhere: laptop, EC2, or a container

Everything in this package runs on **one machine**: the Kiro Crew gateway, the GitHub Actions runner and the agent templates. That machine can be your laptop, an EC2 instance or dev box that runs Kiro Crew, or a container. The steps are the same everywhere; what differs is how you keep the gateway and runner alive and where the programs the agents call live.

> **Status.** Verified end to end on a Mac laptop (rounds 1 and 2) and on an EC2 instance, Amazon Linux 2023 arm64, Kiro Crew 0.11.0 (round 3, 2026-10-27, issue to `kiro-ready-to-merge` in about 7 minutes). The container section follows the same rules but has not been run end to end yet; treat it as a recipe to verify with `scripts/smoke-test.sh`.

## 7.1 Why everything must be on the same machine

- The webhook endpoint listens on **loopback only** (`127.0.0.1:5476`). The dispatcher refuses any other address, and you should never expose the port.
- The runner calls the gateway on `127.0.0.1`, so the runner and the gateway share a machine (or a container network namespace).
- The agents edit code in the runner's checkout, so they run there too.

So each machine needs its own gateway, its own templates, its own **webhook sources** and its own runner. Nothing carries over from another machine, including every webhook token and signing secret: a source belongs to the gateway that minted it. If you move the pipeline to a new machine, create five new sources there and re-run `scripts/setup-github.sh`, or every hop gets HTTP 401. One machine per repository.

## 7.2 What every machine needs

| Need | Notes |
|---|---|
| Kiro Crew 0.11+, gateway running, signed in to a model | `kirocrew --version`; send "hello" in a chat |
| `gh` logged in as the repo owner | Use a fine-grained token scoped to one repository. Log in yourself in the machine's terminal |
| `git`, `python3`, `curl`, `shasum` | `shasum` is missing on Amazon Linux (`perl-Digest-SHA`) and minimal Debian (`perl`) |
| The Node major your repo's CI uses | The agents run your tests. Vite 7 needs Node 20+; Amazon Linux ships Node 18 as `/usr/bin/node` |
| **All of the above in `/usr/bin` (or `/bin`), unshadowed** | The unattended-turn policy trusts only system directories; see doc 05, section 5.5. `scripts/setup-gateway.sh` checks and prints the fix |
| Outbound internet only | The runner and `gh` make outbound connections. **No inbound port** |
| The same user for gateway and runner | The agents write into the runner's checkout |

## 7.3 What differs per host

| | Laptop (macOS) | EC2 / Linux box | Container |
|---|---|---|---|
| Install Kiro Crew | app or `kirocrew` CLI | `kirocrew cloud launch` or the install script | your image, gateway as PID 1 or under a supervisor |
| Keep the gateway alive | app stays open; machine must not sleep | user service + `loginctl enable-linger $USER` | the container's own lifetime |
| Trusted programs | `/usr/bin` is read-only (SIP): Homebrew `gh`, `node` stay outside it and need a one-time human approval **per gateway start** | `sudo ln -sfn <real> /usr/bin/<name>`, remove the earlier copy; `scripts/setup-gateway.sh` prints the lines | do it in the Dockerfile as root; no `sudo` at run time |
| Keep the runner alive | `./svc.sh install && ./svc.sh start` (LaunchAgent) | `SERVICE=1 scripts/install-runner.sh` (systemd, needs sudo) | `nohup ./run.sh > runner.log 2>&1 &` in the entrypoint (no systemd) |
| Reach the dashboard | locally | Settings → Remote Crew (SSM or SSH tunnel) | publish 5476 to `127.0.0.1` on the host only, or `docker exec` + tunnel |
| Sandbox | built in | `kirocrew doctor`; user namespaces may need enabling | user namespaces usually blocked; `kirocrew doctor` tells you, opt into unsandboxed if you accept it |
| Persist across restarts | n/a | the instance disk | volumes for `~/.kiro` and the runner folder |

## 7.4 Laptop (macOS)

1. Follow doc 01 as written. After `scripts/install-agent.sh`, run `scripts/setup-gateway.sh`. It writes the rules and will **warn** that `gh`, `node`, `npm`, `npx` are outside `/usr/bin`.
2. Because `/usr/bin` cannot be changed on macOS, those programs are trusted only after a human approves them once. After every Kiro Crew start, open any chat and run `gh --version`, `node --version`, `npm --version`, `npx --version`, accepting each approval card. The pins last until the gateway restarts. (`git`, `shasum`, `python3` are Apple's and need nothing.)
3. Keep the runner as a LaunchAgent (`./svc.sh install && ./svc.sh start` in the runner folder) and stop the Mac from sleeping while you expect runs.

## 7.5 EC2 or any Linux box (tested)

1. **Check the machine.** `kirocrew doctor`. If it reports the sandbox backend unavailable, enable user namespaces or opt into unsandboxed execution before continuing; the agents run shell commands.
2. **Keep it running after logout.** `loginctl enable-linger $(id -un)` for a user-level gateway.
3. **Get this package onto the machine** (clone it) and **log in to GitHub** there with `gh auth login`, in the machine's terminal.
4. **Install the templates and run the gateway setup:**

   ```bash
   scripts/install-agent.sh
   scripts/setup-gateway.sh
   ```

   Expect `->` lines on a fresh box. On Amazon Linux 2023 they were, in order: copy `gh` from `~/.local/bin` into `/usr/bin` (`sudo install -m 0755 ~/.local/bin/gh /usr/bin/gh`) and remove the `~/.local/bin` copy; point `/usr/bin/node`, `npm`, `npx` at the Node 22 install (`sudo ln -sfn /usr/local/node-v22.12.0-linux-arm64/bin/node /usr/bin/node`, same for `npm` and `npx`) and delete the `/usr/local/bin` symlinks that would shadow them; `sudo dnf install -y perl-Digest-SHA`; then `gh auth setup-git` because the helper still named the old `gh` path. Re-run the script until it prints `Gateway ready`.
5. **Create the five webhook sources** on this machine's dashboard (Settings → Remote Crew to reach it), then `scripts/setup-github.sh OWNER/REPO` here so the repo secrets match this gateway.
6. **Install the workflow** into a clone (`scripts/install-into-repo.sh`), merge it.
7. **Install the runner as a service:**

   ```bash
   SERVICE=1 scripts/install-runner.sh OWNER/REPO
   ```

   A runner started with `./run.sh` in an SSH session dies when the session ends and jobs sit `queued`.
8. **Verify:** `scripts/preflight.sh OWNER/REPO`, then `CLEANUP=1 scripts/smoke-test.sh OWNER/REPO`.

## 7.6 Container (recipe, not yet run end to end)

The gateway and the runner must share loopback, so put both in **one container** (or run the runner in a second container with `--network container:<gateway>`). Fix every program path at build time, because there is no `sudo` and no human at run time.

Dockerfile sketch (Debian-based):

```dockerfile
FROM node:22-bookworm-slim
# node, npm, npx live in /usr/local/bin here, which the unattended policy does not trust.
# Link the real files into /usr/bin and remove the /usr/local/bin copies so nothing shadows them.
RUN for p in node npm npx; do real="$(readlink -f /usr/local/bin/$p)"; ln -sfn "$real" /usr/bin/$p; rm -f /usr/local/bin/$p; done
RUN apt-get update && apt-get install -y --no-install-recommends git curl ca-certificates python3 perl \
 && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
 && apt-get update && apt-get install -y gh && rm -rf /var/lib/apt/lists/*
# gh from the apt repo installs to /usr/bin; perl provides shasum.
RUN useradd -m crew
USER crew
WORKDIR /home/crew
# Install Kiro Crew here per its docs, then copy this package in.
COPY --chown=crew:crew . /home/crew/kiro-crew-software-factory
```

Run-time pieces, in the entrypoint or by hand after the first start:

1. Start the gateway. Publish the port **only to the host's loopback** if you need the dashboard: `-p 127.0.0.1:5476:5476`.
2. Mount volumes for `/home/crew/.kiro` (config, agents, webhook sources, sign-in) and `/home/crew/actions-runner-kirocrew`, or every restart loses the sources and the runner registration.
3. `gh auth login` once inside the container (`docker exec -it ... gh auth login`), then `gh auth setup-git`.
4. `scripts/install-agent.sh`, `scripts/setup-gateway.sh`. It should print only `PASS` lines; if it prints a `->` line, fix that in the Dockerfile rather than in the running container.
5. Create the five sources on the dashboard, `scripts/setup-github.sh`, `scripts/install-into-repo.sh`, `scripts/install-runner.sh`.
6. Start the runner without systemd: `cd ~/actions-runner-kirocrew && nohup ./run.sh > runner.log 2>&1 &`. A small supervisor (`tini` + a loop, or `supervisord`) is better than `nohup` for a long-lived container.
7. `kirocrew doctor`: containers usually block user namespaces, so the sandbox is unavailable. The agents then run unsandboxed inside the container, which is the container's own isolation. Decide if that is acceptable before labelling anything.
8. `scripts/preflight.sh`, then the smoke test. Come back and replace "not yet run" above with what you saw.

## 7.7 Security on a machine that is not your laptop

A remote machine is easier to reach than a laptop, so be stricter:

- **No inbound ports.** Reach it over SSM or an SSH tunnel only. Keep the gateway on loopback.
- **Least-privilege instance role.** The agents' shell commands run on the instance and can use its AWS role. Give the role only what SSM needs.
- **Require IMDSv2** with a hop limit of 1, so a command cannot read role credentials from the metadata service.
- **Private repos only**, and a GitHub token scoped to one repository.
- **Do not put the webhook token or signing secret** in instance user data, an image, or a file in a repo.
- **The auto-approve rules are the trust boundary.** Each rule in `hooks.auto_approve_tools` lets an unattended agent run that program as your user. Keep the list to what the templates need; never `*`.

## 7.8 Three more things that differ from your laptop

- **Model sign-in.** The machine uses its own Kiro sign-in, which may be a different account or model.
- **Memory.** Its gateway has its own memory store and lessons.
- **Run times.** On a small arm64 EC2 instance a full lifecycle took about 7 minutes (install 20 s, 210 tests 10 s, build 10 s); on a laptop 6 to 8. Instance size matters little; model latency dominates.

Run `scripts/setup-gateway.sh` before the first label, not after: the unattended policy is the first thing that breaks on a new machine ([doc 09, round three](09-lessons-and-troubleshooting.md#what-went-wrong-moving-to-ec2-third-round-amazon-linux-2023-arm64-kiro-crew-0110)).
