<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Security policy

Job Autopilot drives a real browser with your personal details, so security reports are welcome and taken seriously.

## Reporting a problem

Email **Contact@rameezscripts.com** with "Job Autopilot security" in the subject. Please don't open a public issue for a vulnerability. Include:
- what you found, and the version (`skills/job-autopilot/SKILL.md` metadata)
- the steps or the page that shows it
- what an attacker could do with it

You'll get a reply within 7 days. A fix ships in a new release, and the CHANGELOG credits you if you want.

## In scope

- **Prompt injection.** A web page, job description or email that makes the agent follow its instructions, open its links, change answers or send data anywhere.
- **Data leaks.** Profile data typed into a host that fails the official-site check, or sent anywhere other than the employer form.
- **The review server** (`ja review serve`, localhost only, per-run token) accepting decisions it should refuse.
- **The installers** writing outside `~/.job-autopilot`, `~/.claude/skills`, `~/.agents/skills` and the agents' MCP registration.

## Design notes

- Everything stays on your computer in `~/.job-autopilot`. Nothing is sent to the authors.
- The fill recipe (`scripts/recipes/fill.js`) is injected into pages the agent opens. It only defines one function and never sends data anywhere.
- The skill never solves CAPTCHAs, never creates accounts with passwords, and never enters card, bank or ID numbers.
- Inbox access is off by default, and read-only when on.
