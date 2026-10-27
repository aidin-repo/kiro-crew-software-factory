---
inclusion: always
---

# Kiro Crew Software Factory

Read `AGENTS.md` at the repository root before acting. It is the project guide for coding agents: what this is, the onboarding procedure in order, the steps you may run yourself, and the steps you must hand to the person with the exact command.

Rules that apply in every session here:

- Hand over, never work around: `sudo`, writes to `~/.kiro/agents/` and `~/.kiro/crew/config.json`, creating webhook sources in the dashboard, and `gh secret set`. From a Kiro sandbox those paths are read-only; that is expected.
- Never print or ask for a webhook token, signing secret or GitHub token.
- Edit prompts in `templates/agent.local/`, not `templates/agent/`. Keep the contracts in `docs/08-customizing-the-agents.md` section 8.6.
- Private, user-owned repositories only.
