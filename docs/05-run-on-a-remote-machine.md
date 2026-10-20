# 5. Run it on a remote machine instead of your laptop

You do not have to use your laptop. Everything in this package runs on **one machine**: the Kiro Crew gateway, the GitHub Actions runner and the `github-worker` crewmate. That machine can be a dev box or an EC2 instance that already runs Kiro Crew. The benefit is that it stays on, so labelled issues do not wait for your laptop to wake up.

> **Status: not tested yet.** The whole package was verified on a Mac laptop. The steps below follow the Kiro Crew and GitHub runner documentation, and the scripts support Linux, but this setup has not been run end to end on a remote machine. Treat each step as unverified until you have run it, and re-run `scripts/smoke-test.sh` at the end.

## 5.1 Why everything must be on the same machine

- The webhook endpoint listens on **loopback only** (`127.0.0.1:5476`). The dispatcher refuses any other address, and you should never expose the port.
- The runner calls the gateway on `127.0.0.1`, so the runner and the gateway have to share a machine.
- The crewmate edits code in the runner's checkout, so it has to run there too.

So the remote machine needs its own gateway, its own crewmate, its own webhook source and its own runner. Nothing from your laptop carries over, including the webhook token and signing secret.

## 5.2 What the remote machine needs

| Need | Notes |
|---|---|
| Kiro Crew installed, gateway running, and signed in | A box launched with `kirocrew cloud launch` already has this. Sign-in happens on the box with `kirocrew cloud login` |
| `git`, `python3`, `curl` | Check with `preflight.sh` |
| `gh`, logged in as the repo owner | Not installed by default on a launched box. `kirocrew cloud launch --extra-packages gh,jq` adds it. Use a fine-grained token scoped to one repository |
| A runner for Linux | `scripts/install-runner.sh` supports `linux-x64` and `linux-arm64`. Pick the architecture that matches the instance |
| Outbound internet | The runner and `gh` only make outbound connections. **No inbound port is needed** |

## 5.3 Reaching the machine

In Settings, Remote Crew, add the machine, then switch to it from the strip at the top of the dashboard. The hub tunnels to the remote's loopback port over SSH or AWS SSM, so nothing is opened on the machine. A box created by the cloud launcher is registered for you over SSM.

Everything in docs 01 to 03 that says "dashboard" then means **the remote machine's dashboard**, opened in its pane. Create the crewmate and the webhook source there, not on your laptop.

## 5.4 Steps

1. **Use a separate private test repo.** If the laptop and the remote machine both serve the same repo, they share the runner label `kirocrew` and the repo secrets. Only one gateway's token is valid at a time, so the other machine's webhook gets HTTP 401. Use one machine per repo.
2. **Check the machine.** On it, run `kirocrew doctor`. If it reports "Sandbox backend unavailable", user namespaces are disabled. Enable them or opt into unsandboxed execution (see the Kiro Crew EC2 guide) before continuing, because the crewmate runs shell commands.
3. **Keep it running after logout.** For a user-level gateway, run `loginctl enable-linger <user>` on the machine.
4. **Get this package onto the machine.** The simplest way is a private git repo that you clone there.
5. **Log in to GitHub** on the machine with `gh auth login`, using a token scoped to the test repo. Do this yourself in the machine's terminal so the token never goes through a chat.
6. **Create the crewmate and webhook source** in the remote machine's dashboard, following doc 02. Run the binding check and restart the remote gateway as described in section 2.4.
7. **Install and start the runner** on the machine. Run `scripts/setup-github.sh`, `scripts/install-into-repo.sh` and `scripts/install-runner.sh` as in doc 01. To keep the runner running after logout, use the runner's service commands. GitHub's runner documentation says these need `sudo` on Linux, which I have not confirmed on your machine.
8. **Run the same user for the runner and the gateway.** The crewmate writes into the runner's checkout, so a different user may hit permission errors.
9. **Verify.** On the machine, run `scripts/preflight.sh OWNER/REPO`, then `CLEANUP=1 scripts/smoke-test.sh OWNER/REPO`.

## 5.5 Security on a remote machine

A remote machine is easier to reach than a laptop, so be stricter:

- **No inbound ports.** Reach it over SSM or an SSH tunnel only. Keep the gateway on loopback.
- **Least-privilege instance role.** The crewmate's shell commands run on the instance and can use its AWS role. Give the role only what SSM needs.
- **Require IMDSv2** with a hop limit of 1, so a command cannot read role credentials from the metadata service.
- **Private repos only**, and a GitHub token scoped to one repository.
- **Do not put the webhook token or signing secret** in instance user data, an image, or a file in a repo.

## 5.6 What to check that may differ from the laptop

- **The approval policy.** Webhook turns are unattended and run with the approval policy the gateway was started with. On the laptop, file tools were refused until the policy was right. A remote gateway may be configured differently. If a run reports denied tools, see section 2.5.
- **Model sign-in.** The remote machine uses its own Kiro sign-in, which may be a different account or model from your laptop's.
- **Memory.** The remote gateway has its own memory store. It does not see your laptop's memory or lessons.
- **Run times.** Instance size affects how long a run takes. The laptop runs took 63 to 142 seconds.

Come back to this page after your first run and replace the "not tested" status with what you saw.
