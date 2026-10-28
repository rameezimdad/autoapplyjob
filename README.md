<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Job Autopilot: AI Auto Job Apply Skill for Claude Code and Codex

**Tell your AI coding agent which job you want and where. Job Autopilot searches live IT job postings with freehire, shortlists the ones that fit your profile, then fills in and submits each application for you in a real Chromium window.**

[![License: MIT](https://img.shields.io/badge/License-MIT-0074D9.svg)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude%20Code-skill-001f3f)](#install)
[![Codex skill](https://img.shields.io/badge/OpenAI%20Codex-skill-001f3f)](#install)
[![Playwright MCP](https://img.shields.io/badge/Playwright-MCP-2EAD33?logo=playwright)](https://github.com/microsoft/playwright-mcp)

```text
You:    /job-autopilot apply to remote React developer jobs in Europe
Agent:  23 postings found, 9 fit your profile:
        #  Title                     Company   Mode    ATS         Fit
        1  Senior React Developer    Acme      remote  Greenhouse  91
        2  Frontend Engineer         Globex    remote  Lever       86
        ...
        Apply to which? (all / 1,3,4 / none)
You:    all
Agent:  [Chromium opens] Acme / Greenhouse: resume uploaded, 14 fields filled,
        3 screening answers from your profile. Submit? (yes / no)
```

## How it works

1. **You ask in plain words**: the role, the place, remote or onsite.
2. **freehire search**: your words become a freehire job search: role names, countries, cities, regions, seniority, skills, salary, visa sponsorship. Postings link to the employer's own career page.
3. **Smart shortlist**: it drops jobs you already applied to, closed postings and ghost listings, plus jobs your work authorization does not cover. It scores the rest against your profile and shows them in a table.
4. **Auto apply on the official company website**: for each job it opens the company's own careers page, or the hiring system the company runs (Workday, Greenhouse, Lever, Ashby and more). It checks the site is really the company's before typing anything. When a posting only came from a job board, it first finds the same job on the company's own site. Then it uploads your resume, fills the form from your profile, writes a short cover letter when there is a field for one, and submits.
5. **Log and report**: every job goes into a local log with a confirmation screenshot. Nothing gets applied to twice, and you get a report at the end.

## Features

- Natural-language job search
- Live IT jobs from freehire
- Applies on official company sites
- Finds the official posting for board jobs
- Apply at companies you name
- Fake career site check
- Visible Chromium browser
- Review mode and auto mode
- Resume upload and parsing
- Smart form filling
- Truthful screening answers
- Tailored cover letters
- Fit score per job
- Ghost job filter
- Daily application cap
- Per-company limit
- Duplicate protection
- Confirmation screenshots
- CSV export
- Saved site logins
- CAPTCHA hand-off to you
- Works in Claude Code
- Works in OpenAI Codex
- Data stays on your computer

## Requirements

| Need | Notes |
|---|---|
| Claude Code or OpenAI Codex CLI | either one, or both |
| Node.js 18 or newer | [nodejs.org](https://nodejs.org) |
| git | for the one-line installer |
| A resume in PDF | the agent uploads it to each application |
| Disk space for Chromium | a few hundred MB, downloaded once |

## Install

### macOS, Linux and WSL (one line)

```bash
curl -fsSL https://raw.githubusercontent.com/rameezimdad/autoapplyjob/main/install.sh | bash
```

Or from a clone:

```bash
git clone https://github.com/rameezimdad/autoapplyjob
cd autoapplyjob && ./install.sh
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/rameezimdad/autoapplyjob/main/install.ps1 | iex
```

### What the installer does

1. Installs the skill for Claude Code (`~/.claude/skills`) and for Codex (`~/.agents/skills`).
2. Installs Playwright MCP and Chromium into `~/.job-autopilot`.
3. Registers two MCP servers in every agent it finds:
   - `freehire` (job search)
   - `job-browser` (the Chromium browser)
4. **Opens Chromium** on a welcome page. Sign in to any job sites you use (optional), then close the window.

After the install, restart Claude Code or Codex.

### Claude Code plugin

```text
/plugin marketplace add rameezimdad/autoapplyjob
/plugin install job-autopilot@job-autopilot
```

Then type `/job-autopilot setup` once. It runs the same browser and MCP setup.

### Codex plugin

```bash
codex plugin marketplace add rameezimdad/autoapplyjob
codex plugin add job-autopilot@job-autopilot
```

Then ask Codex: `set up job autopilot`.

### Any agent with the skills CLI

```bash
npx skills add https://github.com/rameezimdad/autoapplyjob --skill job-autopilot
```

Then ask your agent to `set up job autopilot`.

## First run

The first time, the agent builds your profile. It either reads your resume and asks you to confirm, or asks three short rounds of questions. The answers are saved to `~/.job-autopilot/profile.md`. That file is the only source the agent uses to answer application questions, and you can edit it any time.

## Usage

| Say | What happens |
|---|---|
| `/job-autopilot apply to remote React jobs in Europe` | search, shortlist, apply |
| `/job-autopilot find senior Python jobs in Germany with visa sponsorship` | shortlist only, nothing is submitted |
| `/job-autopilot apply to DevOps jobs in Dubai, auto mode, max 5` | applies to the top 5 without asking each time |
| `/job-autopilot apply to backend jobs at Stripe, Careem and Systems Ltd` | finds openings at those companies and applies on their official sites |
| `/job-autopilot status` | what was applied, and what is waiting on you |
| `/job-autopilot export` | writes `~/.job-autopilot/applications.csv` |
| `/job-autopilot edit my profile` | change your answers or settings |

In Codex, type `$job-autopilot` or just ask in plain words.

## Review mode and auto mode

| | Review (default) | Auto |
|---|---|---|
| Picks jobs | you choose from the shortlist | top jobs by fit score, up to your daily cap |
| Before each submit | shows a summary and waits for your yes | submits on its own |
| Unknown required question | asks you, and can save the answer for next time | skips the job and lists it for you |
| CAPTCHA, login, email code | waits while you handle it in Chromium | skips the job and lists it for you |

Switch modes in `profile.md` (`mode: auto`) or per run ("auto mode").

## Where your data lives

| File | Holds |
|---|---|
| `~/.job-autopilot/profile.md` | your facts, answers and settings |
| `~/.job-autopilot/applications.jsonl` | every job handled: applied, skipped, needs you, failed |
| `~/.job-autopilot/letters/` | cover letters written for you |
| `~/.job-autopilot/screenshots/` | confirmation screenshot per application |
| `~/.job-autopilot/browser-profile/` | the Chromium profile with your site logins |

Your data is never sent anywhere except the employer form you are applying to.

## What it will never do

- Invent experience, skills, degrees, years, salary history or work authorization.
- Solve CAPTCHAs or get around bot checks. It hands them to you.
- Apply through LinkedIn, Indeed, Glassdoor or any other job board. It finds the same job on the company's official site instead, and lists it for you when it can't.
- Type your details into a site that is not the company's own or its hiring system, or that asks for a fee.
- Pay fees, enter card or bank details, or send passport and ID numbers.
- Exceed your daily cap, or apply to the same posting twice.

## Supported application systems

| System | Support |
|---|---|
| Greenhouse | full |
| Lever | full |
| Ashby | full |
| SmartRecruiters | full |
| Workable | full |
| BambooHR, Recruitee, Teamtailor, Personio, Breezy, JazzHR | full |
| Workday, iCIMS, Jobvite, Taleo | after you create the account once per company |
| Other company career pages | best effort |
| Jobs found on LinkedIn, Indeed, Glassdoor and other boards | applied on the company's official site when the same job is there, otherwise listed for you |

## Fewer permission prompts

Claude Code asks before each browser action. To allow the two servers, add this to `~/.claude/settings.json`:

```json
{ "permissions": { "allow": ["mcp__job-browser", "mcp__freehire"] } }
```

## FAQ

### How do I auto apply to jobs with Claude Code?
Install Job Autopilot, restart Claude Code and type `/job-autopilot apply to <role> jobs in <place>`. The agent searches freehire, shows a shortlist and applies in Chromium.

### Does it work with OpenAI Codex?
Yes. The installer registers both MCP servers in Codex and installs the skill to `~/.agents/skills`. Type `$job-autopilot` or ask in plain words.

### Does it apply on the company's official website?
Yes, always. freehire gives every posting a link to the company's own posting, which is the company's careers site or the hiring system it runs. The agent checks that the site belongs to the company before it types anything. When a job only appeared on a job board, it looks up the same job on the company's own careers site and applies there.

### Can I target specific companies?
Yes. Ask "apply to backend jobs at Stripe and Shopify". It looks those companies up in freehire. A company that isn't there gets its official careers site searched directly.

### Which jobs can it find?
IT and tech roles from the freehire catalogue: developers, DevOps, data, QA, design, product and more, worldwide. It filters by country, city, region, remote work, seniority, skills, salary and visa sponsorship.

### Will it lie on my application?
No. It answers only from your profile and from what you tell it during the run. When a required question has no true answer in your profile, it asks you or skips the job.

### Is automated job applying allowed?
Job Autopilot fills in the employer's own application form, the same form you would fill by hand, at a human pace and within your daily cap. It never automates sites whose terms forbid it, and never gets around bot checks. You stay responsible for what you submit, so review mode is the default.

### What happens when a CAPTCHA appears?
The agent stops and asks you to solve it in the Chromium window. In auto mode it skips that job and lists it for you.

### Can I watch it work?
Yes. Chromium runs in a normal visible window, and you can take over at any time.

### Does it work on Windows?
Yes, with the PowerShell installer. WSL works with the Linux installer.

### What does it cost?
The skill is open source under the MIT license. You use your own Claude Code or Codex plan, and freehire's own terms apply to the job search.

### How do I stop it?
Press Esc (Claude Code) or Ctrl+C (Codex). Jobs already submitted stay in the log.

## Troubleshooting

| Problem | Fix |
|---|---|
| The agent says the browser tools are missing | run the installer again, then restart the agent |
| Browser will not start, "profile in use" | close the Chromium window the installer opened |
| Linux: Chromium fails with missing libraries | `sudo ~/.job-autopilot/node_modules/.bin/playwright install-deps chromium` |
| No jobs found | loosen the ask: fewer skills, more days, a wider region |

## Uninstall

```bash
claude mcp remove -s user job-browser    # Claude Code
codex mcp remove job-browser             # Codex
rm -rf ~/.job-autopilot ~/.claude/skills/job-autopilot ~/.agents/skills/job-autopilot
```

The `freehire` MCP server is left in place in case you use it elsewhere. Remove it the same way if you do not.

## Repository layout

```text
skills/job-autopilot/
  SKILL.md                     the skill: search, shortlist, apply, report
  references/onboarding.md     profile interview
  references/ats-playbook.md   Greenhouse, Lever, Ashby, Workday and more
  references/screening-answers.md
  references/official-site.md  official site check, board-to-company lookup
  templates/profile.example.md
  scripts/setup.sh, setup.ps1  Chromium + MCP setup
  scripts/tracker.mjs          application log
  scripts/open-browser.mjs     opens Chromium for sign-in
  assets/welcome.html
install.sh, install.ps1        one-line installers
AGENTS.md                      instructions for AI agents working in this repo
.claude-plugin/, .codex-plugin/  plugin manifests
```

## Contributing

Issues and pull requests are welcome. Read [AGENTS.md](AGENTS.md) for the repo rules and the checks to run before a commit.

## Credits

- [freehire](https://freehire.me): the job search MCP server
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) by Microsoft: browser automation (Apache-2.0)

## License

[MIT](LICENSE)

## Let's Work Together

- WhatsApp: https://wa.me/923435347417
- Email: Contact@rameezscripts.com
- YouTube: [@rameezimdad](https://www.youtube.com/@rameezimdad)

_Built by Rameez Scripts._
