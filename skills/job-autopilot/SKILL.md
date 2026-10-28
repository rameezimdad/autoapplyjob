---
name: job-autopilot
description: Find IT jobs with the freehire job search and apply to them automatically in a real Chromium window, using the user's own profile and resume. Use when the user says "apply to jobs", "auto apply", "find me a job and apply", "apply to remote React jobs in Europe", "job hunt", "job-autopilot", "/job-autopilot", asks to set up the job autopilot, edit their job profile, or wants a report of the applications sent so far.
license: MIT
metadata:
  version: 0.1.0
  author: Mohammad Rameez Imdad (Rameez Scripts)
---
<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Job Autopilot

Search freehire's catalogue of IT job postings, shortlist the ones that fit the user's profile, then fill in and submit each application in a visible Chromium window. Every job handled is logged, so the same posting is never applied to twice.

Two MCP servers do the work. Clients prefix tool names differently (`mcp__freehire__search_jobs`, `freehire.search_jobs` …); this file uses the bare names.

| Server | Tools used |
|---|---|
| `freehire` | `search_jobs`, `get_job`, `check_jobs_open`, `list_filter_values`, `similar_jobs` |
| `job-browser` (Playwright MCP, Chromium, persistent profile) | `browser_navigate`, `browser_snapshot`, `browser_find`, `browser_click`, `browser_type`, `browser_fill_form`, `browser_select_option`, `browser_file_upload`, `browser_wait_for`, `browser_take_screenshot`, `browser_tabs` |

`SKILL_DIR` = the folder holding this file. `APP` = `~/.job-autopilot` (or `$JOB_AUTOPILOT_HOME`).

| Path | Holds |
|---|---|
| `APP/profile.md` | the user's facts and settings, the ONLY source of answers |
| `APP/applications.jsonl` | every job handled, read and written through `tracker.mjs` only |
| `APP/letters/<slug>.txt` | cover letters written per job |
| `APP/screenshots/` | confirmation screenshots |
| `APP/browser-profile/` | Chromium profile, keeps site logins between runs |

Tracker = `node SKILL_DIR/scripts/tracker.mjs <command>` (`check`, `add`, `today`, `company`, `list`, `stats`, `csv`; no args prints usage).

## What the user can ask

| Ask | Do |
|---|---|
| "set up job autopilot", first run | Step 0 (always run setup), Step 1 |
| "apply to <role> jobs in <place>" | Steps 0 to 6 |
| "find <role> jobs" (no apply) | Steps 0, 2, 3, stop after the shortlist |
| "status", "what did I apply to" | tracker `list --days 30` + `stats`, then the `needs-you` rows with their links |
| "export" | tracker `csv` |
| "edit my profile", "auto mode", "cap 5" | change only those lines in `APP/profile.md`, show the diff |

Words in the ask override the profile for this run only: "auto mode", "max 5", "last 3 days", "senior".

## Step 0 - Preflight

1. Call `list_filter_values` with `filter: "work_mode"`. It must return values.
2. Check the browser tools exist without opening a page (in Claude Code they can be deferred: search the tool list for `browser_navigate`).
3. Either missing, or the user asked for setup, run the setup script (idempotent, safe to re-run):
   - macOS / Linux / WSL: `bash SKILL_DIR/scripts/setup.sh`
   - Windows: `powershell -ExecutionPolicy Bypass -File SKILL_DIR\scripts\setup.ps1`

   If tools were missing, tell the user to close the Chromium window it opened, restart the agent (MCP servers load at start), and run the same ask again. Stop.
4. `APP/profile.md` missing, or a required line still says `<fill>` → Step 1. Otherwise read it once and keep it in mind for the whole run.

## Step 1 - Profile (first run only)

Follow `SKILL_DIR/references/onboarding.md`. Three short question rounds, or pre-fill from the user's resume and have them confirm. Write only what the user said or confirmed. Check `resume_path` exists. Show the finished file, then continue with the original ask.

## Step 2 - Turn the ask into a search

Build one `search_jobs` call:

| From the ask / profile | Filter |
|---|---|
| role names | `query`: 2-3 names with OR, title-only, e.g. `title:"react developer" OR title:"frontend engineer"` |
| a country | `countries`: ISO alpha-2 (`PK`, `AE`, `DE`) |
| a city | `cities` |
| "Europe", "Gulf", "worldwide" | `regions`: `eu`, `uk`, `mena`, `north_america`, `latam`, `apac`, `africa`, `cis`, `global` |
| "remote", "hybrid", "onsite" | `work_mode` |
| seniority | `seniority` (ask word > profile) |
| skills | `skills` from the ask; profile skills only when the ask names none |
| `min_salary` | `salary_min` + `salary_currency` |
| needs sponsorship outside `authorized_countries` | `visa_sponsorship: true` |
| `exclude_companies` | `exclude_company_slugs` |
| `posted_within_days` | `posted_within_days` (default 14), `limit` 25 |

- Location, mode, seniority and skills go in filters, never in `query`.
- Geography filters are a union. Pass only the ones the user meant.
- "Remote" with no place: `work_mode: ["remote"]` plus `regions: ["global"]`, plus the user's own country.
- Unsure a value exists (a city spelling, a skill name)? `list_filter_values` with `contains` first.
- Under 5 results: loosen one constraint at a time (days, then seniority, then skills) and say which.

## Step 3 - Shortlist

1. `tracker check <slug> <slug> …` drops anything already logged (`applied`, `skipped`, `failed`). A `needs-you` job stays in the list, marked "waiting on you".
2. `check_jobs_open` on the rest. Drop `closed` and `not_found`.
3. Hard gates. Drop jobs where the location or work authorization can't be met (onsite in a country outside `authorized_countries`, with no sponsorship).
4. Fit score 0-100 from the preview. Title match 30, must-have skill overlap 30, seniority 15, location / work mode 15, salary at or above `min_salary` 10 (salary not stated = 5). Drop below `min_fit` (default 60).
5. `get_job` on the top 10. Drop a posting when:
   - it shows signs it is not being filled (its reality class or observed signals say so),
   - it hard-requires something the profile lacks (a language, a clearance, a degree, years),
   - it asks the applicant for money.

   Note the ATS it names.
6. `tracker company <company_slug>` at or above `per_company_30d` → drop.
7. Show one table. Source: freehire.

   `# | Title | Company | Location / mode | Posted | ATS | Fit | Employer link | freehire link`

## Step 4 - Confirm the batch

- Slots = `daily_cap` minus `tracker today`. 0 slots: say so and stop.
- **review** mode (default): ask "Apply to which? (all / 1,3,4 / none)" and wait.
- **auto** mode: take the top jobs by fit, up to the slots. Show the table anyway.
- A find-only ask stops here.

## Step 5 - Apply loop (one job at a time)

Open `SKILL_DIR/references/ats-playbook.md` for the system each job uses. Answer questions with `SKILL_DIR/references/screening-answers.md`.

1. `browser_navigate` to the employer posting (never the freehire page), then `browser_snapshot`. If it is gone or closed, log `skipped` with note "closed" and move to the next job.
2. Hosted on LinkedIn, Indeed, Glassdoor or another job board's one-click apply, or "email your CV to …": log `needs-you` with the link and the reason. Never automate those.
3. Click Apply. Where the system parses resumes (Lever, Ashby, Workday, SmartRecruiters), upload first. Click the upload control, `browser_file_upload` with `resume_path`, then check every field it filled.
4. Fill from `profile.md`:
   - text boxes → `browser_fill_form`
   - real dropdowns → `browser_select_option`
   - radios and checkboxes → click

   Snapshot after each section. Multi-step forms change refs on every page.
5. Cover letter field: write one following the cover letter rules, save `APP/letters/<slug>.txt`, then paste or upload it. Optional field + `cover_letter: none` → leave it empty.
6. A required question the profile can't answer truthfully:
   - review: ask the user. Offer to save the answer to profile § Standard answers, and save it only if they agree.
   - auto: leave the form unsubmitted, log `needs-you` with the question, go to the next job.
7. Login wall, account creation, CAPTCHA, email or SMS code, assessment or video step: stop on that tab. Tell the user exactly what to do in the Chromium window ("solve the check, then say done").
   - review: wait for them.
   - auto: log `needs-you` and go to the next job.
8. **review** mode, before submit: show a compact summary (name, email, resume file, every screening answer, the letter's first line). Wait for "yes". Auto mode skips this.
9. Submit, then `browser_wait_for` the confirmation text ("Thank you", "application received", "submitted"). Then `browser_take_screenshot` with filename `<slug>.png`.
   - Confirmed: `tracker add … --status applied`.
   - Page shows errors: fix what it names and submit again, 2 tries at most, else `failed` with the error text.
   - No confirmation and no error: `failed`, note "unconfirmed", and tell the user to check that tab.
10. Wait 30 s (`browser_wait_for` with `time: 30`) before the next submit. Close extra tabs with `browser_tabs`.

Log every job, whatever the outcome:

```
node SKILL_DIR/scripts/tracker.mjs add --slug <slug> --title "<title>" --company "<company>" --company-slug <company_slug> --url "<employer link>" --ats <ats> --status <applied|skipped|needs-you|failed> --note "<short reason>"
```

## Step 6 - Report

Give three short tables:
- **Applied:** company, role, screenshot file.
- **Needs you:** what to do, with the link.
- **Skipped / failed:** with the reason.

Then the `tracker stats` line. Offer the next search: `similar_jobs` on the best applied posting.

## Hard rules

- **Truth only.** Every answer comes from `profile.md` or from the user in this session. Never invent experience, skills, years, degrees, employers, certifications, work authorization, salary history or references. Rounding a number up counts as inventing.
- **No bypassing.** Never solve, skip or outsource a CAPTCHA or bot check. Never use fake identities. Never create an account with a password the user did not set.
- **No job-board automation.** LinkedIn, Indeed, Glassdoor and similar boards ban automated applying and restrict accounts that do it. They get logged as `needs-you`.
- **Caps.** Respect `daily_cap` (default 15, hard max 50) and `per_company_30d` (default 2). One application per posting, ever.
- **Money and IDs.** Never pay, never enter card or bank details, never send passport, national ID or tax numbers. Stop and tell the user. A posting that charges the applicant is a scam signal: skip it and say why.
- **Privacy.** Personal data goes only into the employer form being applied to. Never paste it anywhere else or send it to another service.
- **Self-identification.** Voluntary questions (gender, race, veteran, disability) take the profile answer, default "Decline to self-identify".
- **Fill the form yourself.** Never use "Apply with LinkedIn / Google / Indeed" buttons.
- **No silent profile edits.** Show any change to `profile.md` first.

## Troubleshooting

| Symptom | Fix |
|---|---|
| browser tools missing | run setup (Step 0), restart the agent |
| browser won't start, "profile in use" | the setup Chromium window is still open: ask the user to close it |
| Linux: Chromium fails on missing libraries | `sudo ~/.job-autopilot/node_modules/.bin/playwright install-deps chromium` |
| file upload does nothing | click the upload control first so the chooser is open, then `browser_file_upload` |
| freehire finds nothing | loosen filters one at a time; freehire covers IT and tech roles |
| a site keeps showing bot checks | stop applying on that site this session, log the rest as `needs-you` |
