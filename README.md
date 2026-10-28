<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Job Autopilot: AI Auto Job Apply Skill for Claude Code and Codex

**Tell your AI coding agent which job you want and where. Job Autopilot searches live IT job postings with freehire, shortlists the ones that fit your profile, then fills in and submits each application on the company's official website, in a real Chromium window.**

[![License: MIT](https://img.shields.io/badge/License-MIT-0074D9.svg)](LICENSE)
[![test](https://github.com/rameezimdad/autoapplyjob/actions/workflows/test.yml/badge.svg)](https://github.com/rameezimdad/autoapplyjob/actions/workflows/test.yml)
[![Claude Code skill](https://img.shields.io/badge/Claude%20Code-skill-001f3f)](#install)
[![Codex skill](https://img.shields.io/badge/OpenAI%20Codex-skill-001f3f)](#install)
[![Playwright MCP](https://img.shields.io/badge/Playwright-MCP-2EAD33?logo=playwright)](https://github.com/microsoft/playwright-mcp)

![Job Autopilot fast-filling a demo application form, then the batch review page](docs/assets/demo.gif)

<sub>Recorded on the built-in demo forms (`npm run demo-forms`). Every company in the demo is fictional.</sub>

```text
You:    /job-autopilot apply to remote React developer jobs in Europe
Agent:  23 postings found, 9 fit your profile:
        #  Title                     Company   Mode    Apply on            Fit
        1  Senior React Developer    Acme      remote  official (Ashby)    91
        2  Frontend Engineer         Globex    remote  official (Lever)    86
        ...
        Apply to which? (all / 1,3,4 / none)
You:    all
Agent:  Preparing 6 applications... 6 ready. Review page: http://127.0.0.1:4777/
You:    (approve 5, skip 1 as "agency")
Agent:  Submitted 5 on the official sites. Screenshots and every answer saved.
```

## How it works

1. **You ask in plain words**: the role, the place, remote or onsite, or "at Stripe and Shopify".
2. **freehire search**: your words become a freehire job search (role names, countries, cities, regions, seniority, skills, salary, visa sponsorship). Every posting links to the company's own hiring page.
3. **Smart shortlist**: it drops jobs you already applied to, closed postings, ghost listings and jobs your work authorization doesn't cover. The rest are scored against your profile and shown in a table.
4. **One sub-agent per application**: each job runs in a fresh agent on a cheaper model, so long batches never fill the main agent's memory. A queue on disk lets a stopped batch resume where it left off.
5. **Official site only**: it opens the company's careers page or the hiring system the company runs (Workday, Greenhouse, Lever, Ashby and more). It checks the site really belongs to the company before typing anything. Job-board postings get resolved to the same job on the company's site.
6. **Fast fill, computed answers**: one call fills your name, email, phone, location, links, company and country. Standard questions are computed in code from your profile: authorization and sponsorship per country, years per skill, notice, salary, consent and more. Questions your profile doesn't answer are never guessed. Every answer is saved with the profile line it came from.
7. **You approve, it submits**: in review mode every application is prepared first and shown on one review page. Only the jobs you approve get submitted, at a human pace, within your daily cap.

## Features

**Search and shortlist**
- Live IT jobs from freehire
- Natural-language job search
- Apply at companies you name
- Fit score per job
- Ghost job filter
- Learns from jobs you skip

**Applying**
- Applies on official company sites
- Board jobs resolved to the company site
- Fake career site check
- One sub-agent per application
- Fast-fill recipe for standard fields
- Screening answers computed from your profile
- Truthful tailored resumes
- Tailored cover letters
- Answers in the posting's language

**Control and safety**
- Review, auto and dry-run modes
- Batch review page
- Resumable batch queue
- Daily cap and per-company limit
- Prompt-injection guard
- Audit trail of every answer
- Honest answer to AI questions
- CAPTCHA hand-off to you

**Running it**
- Daily runs from saved searches
- Optional inbox check for codes and replies
- Confirmation screenshots and CSV export
- Doctor health check
- Works in Claude Code and OpenAI Codex
- Data stays on your computer

## Requirements

| Need | Notes |
|---|---|
| Claude Code or OpenAI Codex CLI | either one, or both |
| Node.js 18 or newer | [nodejs.org](https://nodejs.org) |
| git | for the one-line installer |
| A resume in PDF | uploaded to each application |
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

1. Installs the skill for Claude Code (`~/.claude/skills`) and Codex (`~/.agents/skills`).
2. Installs Playwright MCP, Chromium and the form-fill recipe into `~/.job-autopilot`.
3. Registers two MCP servers in every agent it finds:
   - `freehire` for job search
   - `job-browser` for the Chromium browser
4. Opens Chromium on a welcome page. Sign in to any job sites you use (optional), then close the window.
5. Runs the doctor check.

Then restart Claude Code or Codex. freehire may ask you to sign in once:
- **Claude Code:** `/mcp`, then freehire, then Authenticate
- **Codex:** `codex mcp login freehire`

| Flag (`install.sh` / `setup.sh`) | Use |
|---|---|
| `--no-browser` | skip opening Chromium |
| `--headless` | servers without a display |
| `--doctor` | check the install only |

### Claude Code plugin

```text
/plugin marketplace add rameezimdad/autoapplyjob
/plugin install job-autopilot@job-autopilot
```

Then type `/job-autopilot setup` once.

### Codex plugin

```bash
codex plugin marketplace add rameezimdad/autoapplyjob
codex plugin add job-autopilot@job-autopilot
```

Then ask Codex to `set up job autopilot`.

### Any agent with the skills CLI

```bash
npx skills add https://github.com/rameezimdad/autoapplyjob --skill job-autopilot
```

## First run

The agent builds your profile in `~/.job-autopilot/profile.yaml`. It either reads your resume and asks you to confirm, or asks three short rounds of questions. That file is the only source it answers application questions from. Edit it any time, and check it with `node ~/.claude/skills/job-autopilot/scripts/ja.mjs profile check`.

## Usage

| Say | What happens |
|---|---|
| `/job-autopilot apply to remote React jobs in Europe` | search, shortlist, prepare, review, submit |
| `/job-autopilot apply to backend jobs at Stripe, Careem and Systems Ltd` | openings at those companies, on their official sites |
| `/job-autopilot dry run: apply to DevOps jobs in Dubai` | fills every form and takes screenshots, submits nothing |
| `/job-autopilot apply to these links: …` | your own list of job links |
| `/job-autopilot find senior Python jobs in Germany with visa sponsorship` | shortlist only |
| `/job-autopilot resume` | carry on with a batch that stopped |
| `/job-autopilot what did I send to Acme?` | every answer typed into that form, with sources |
| `/job-autopilot daily run` | your saved searches, jobs from the last day only |
| `/job-autopilot check my email for replies` | interview, assessment and rejection emails, logged (optional, read-only) |
| `/job-autopilot status` | what was applied and what is waiting on you |

In Codex, type `$job-autopilot` or just ask in plain words.

## Modes

| | Review (default) | Auto | Dry run |
|---|---|---|---|
| Prepares each form | yes | yes | yes |
| You approve before submit | yes, on one review page | no | nothing is submitted |
| Unknown required question | listed for you | listed for you | listed for you |
| CAPTCHA, login, email code | listed for you | listed for you | listed for you |

Set `settings.mode` in `profile.yaml`, or say "auto mode" or "dry run" in the ask.

## Where your data lives

| In `~/.job-autopilot` | Holds |
|---|---|
| `profile.yaml` | your facts, answers and settings |
| `applications.jsonl` | every job handled: applied, prepared, skipped, needs you, failed, interview, rejected, offer |
| `queue/` | the current batch, resumable |
| `runs/` | every answer typed into every form, with its source |
| `prep/` | cover letters and tailored resumes per job |
| `review/`, `decisions.jsonl` | review pages and your decisions |
| `screenshots/` | filled-form and confirmation screenshots |
| `security.jsonl` | pages that tried prompt injection or looked like scams |
| `browser-profile/` | the Chromium profile with your site logins |

Nothing is sent anywhere except the employer form you are applying to.

## What it will never do

- **Lie.** It never invents experience, skills, degrees, years, salary history or work authorization. Tailored resumes only reorder your own lines, and a checker proves it.
- **Obey a web page.** It never follows instructions hidden in job postings or emails.
- **Get around bot checks.** It never solves CAPTCHAs. Those go to you.
- **Apply through job boards.** That includes LinkedIn, Indeed and Glassdoor. It finds the same job on the company's official site instead.
- **Type into the wrong site.** It never enters your details on a site that isn't the company's own or its hiring system.
- **Take payment or ID details.** It never pays fees or enters card, bank or ID numbers.
- **Break your limits.** It never exceeds your daily cap or applies to the same posting twice.

## Supported application systems

| System | Support |
|---|---|
| Greenhouse, Lever, Ashby, SmartRecruiters, Workable | full |
| BambooHR, Recruitee, Teamtailor, Personio, Breezy, JazzHR, Zoho Recruit, Manatal | full |
| Workday, iCIMS, Jobvite, Taleo, SuccessFactors, Oracle | after you create the account once per company |
| Other company career pages | best effort |
| Jobs found on LinkedIn, Indeed, Glassdoor and other boards | applied on the company's own site when the same job is there, otherwise listed for you |

## Testing

```bash
npm run setup     # once: Playwright MCP + Chromium, no browser window
npm test          # unit tests + browser tests on the local demo forms
npm run e2e       # the real agent, dry run on the demo forms (uses your Claude Code)
```

The end-to-end eval gives the agent five demo jobs:
- a Greenhouse-style form
- a Workday-style wizard
- a job-board listing that links to the company site
- a page with a hidden prompt injection
- a scam page that asks for a fee

It passes only when the agent prepares the first three, skips the last two, flags the injection, submits nothing and saves every answer with its source.

## Fewer permission prompts

Claude Code asks before each browser action. To allow the two servers, add this to `~/.claude/settings.json`:

```json
{ "permissions": { "allow": ["mcp__job-browser", "mcp__freehire"] } }
```

## FAQ

### How do I auto apply to jobs with Claude Code?
Install Job Autopilot, restart Claude Code and type `/job-autopilot apply to <role> jobs in <place>`. It searches freehire, shows a shortlist, prepares each application and submits the ones you approve.

### Does it work with OpenAI Codex?
Yes. The installer registers both MCP servers in Codex and installs the skill to `~/.agents/skills`. Codex runs each application in its own sub-agent too.

### Does it apply on the company's official website?
Yes, always. freehire gives each posting a link to the company's own hiring page. The agent checks the site belongs to the company before typing anything. Jobs that only appeared on a job board are looked up on the company's own careers site.

### Will it lie on my application?
No. It answers only from your profile and what you tell it, and records the source of every answer. Tailored resumes can only reorder or drop lines from your master resume, never add facts.

### What if a job posting contains hidden instructions for AI?
The agent treats page text as data. It doesn't follow it, flags the page in `security.jsonl`, skips the job and tells you.

### Can I see exactly what was submitted?
Yes. Ask "what did I send to <company>" or run `ja.mjs run show <slug>`. You get every question, the answer and where it came from, plus a screenshot.

### What happens when a CAPTCHA or login appears?
The job is listed as waiting on you, with the link. The agent never solves CAPTCHAs.

### Can it run every day on its own?
Yes. Save searches in `profile.yaml` and schedule `/job-autopilot daily run` with `/loop` or cron. Use review or dry-run mode for unattended runs until you trust auto mode.

### Is automated job applying allowed?
Job Autopilot fills in the employer's own application form, the same form you'd fill in by hand, at a human pace and within your daily cap. It never automates sites whose terms forbid it, never gets around bot checks, and answers "did you use AI" questions honestly. You stay responsible for what you submit, so review mode is the default.

### Does it work on Windows?
Yes, with the PowerShell installer. WSL works with the Linux installer.

### What does it cost?
The skill is open source under the MIT license. You use your own Claude Code or Codex plan, and freehire's own terms apply to the job search.

## Troubleshooting

Start with `bash ~/.claude/skills/job-autopilot/scripts/setup.sh --doctor` (Windows: `setup.ps1 -Doctor`).

| Problem | Fix |
|---|---|
| The agent says the browser tools are missing | run the installer again, then restart the agent |
| Browser won't start, "profile in use" | close the Chromium window the installer opened |
| Linux: Chromium fails with missing libraries | `sudo ~/.job-autopilot/node_modules/.bin/playwright install-deps chromium` |
| A batch stopped halfway | `/job-autopilot resume` |
| No jobs found | loosen the ask: fewer skills, more days, a wider region |

## Uninstall

```bash
claude mcp remove -s user job-browser    # Claude Code
codex mcp remove job-browser             # Codex
rm -rf ~/.job-autopilot ~/.claude/skills/job-autopilot ~/.agents/skills/job-autopilot
```

The `freehire` MCP server stays in case you use it elsewhere. Remove it the same way if you don't.

## Repository layout

```text
skills/job-autopilot/
  SKILL.md                      orchestrator: search, shortlist, queue, review, report
  references/applier.md         one job, one phase, run by a sub-agent
  references/official-site.md   official-site check, board-to-company lookup, red flags
  references/ats-playbook.md    Workday, Greenhouse, Lever, Ashby and more
  references/screening-answers.md, resume-tailoring.md, onboarding.md, daily.md, inbox.md
  scripts/ja.mjs + lib/         queue, log, profile check, audit trail, review page, resume, doctor
  scripts/recipes/fill.js       form filler injected into every page
  scripts/setup.sh, setup.ps1   Chromium + MCP setup
  templates/                    profile.example.yaml, master-resume.example.md
  assets/                       welcome page, review page
tests/                          unit, browser and end-to-end tests, demo forms
install.sh, install.ps1         one-line installers
AGENTS.md                       instructions for AI agents working in this repo
```

## Contributing

Issues and pull requests are welcome. Read [AGENTS.md](AGENTS.md) for the repo rules and run `npm test` before a pull request. Report security problems privately, as described in [SECURITY.md](SECURITY.md).

## Credits

- [freehire](https://freehire.me): the job search MCP server
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) by Microsoft: browser automation (Apache-2.0)
- [yaml](https://github.com/eemeli/yaml): profile parsing (ISC)

## License

[MIT](LICENSE)

## Let's Work Together

- WhatsApp: https://wa.me/923435347417
- Email: Contact@rameezscripts.com
- YouTube: [@rameezimdad](https://www.youtube.com/@rameezimdad)

_Built by Rameez Scripts._
