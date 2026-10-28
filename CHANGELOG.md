<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Changelog

## 0.3.0 - 2026-10-28

**Reliability**
- Each application runs in its own sub-agent (Claude Code and Codex), so long batches no longer fill the agent's memory.
- A batch queue on disk (`ja queue`) survives crashes. "resume" carries on where the batch stopped.
- The daily cap, the per-company limit, already-applied jobs and the gap between submits are enforced in code, not only in instructions.
- New `dry-run` mode fills every form and takes a screenshot without submitting.
- The browser server runs with `--snapshot-mode none` and `--image-responses omit` to save tokens.

**Safety**
- Prompt-injection guard: text on pages and in emails is data, never instructions. Suspicious pages are flagged in `security.jsonl` and skipped.
- Audit trail: every answer typed is saved with the profile line it came from (`ja run show <slug>`).
- Structured `profile.yaml` with a validator (`ja profile check`). Replaces `profile.md`.
- An honest answer to "did you use AI?" questions.

**Features**
- Truthful tailored resumes. Lines from a master resume are only reordered or dropped, `ja resume check` proves it, and `ja resume pdf` renders the PDF.
- Fast-fill recipe injected into every page. One `browser_evaluate` call fills name, email, phone, location, links, company and country, and lists the remaining questions.
- Batch review page: approve, skip or edit every prepared application in one place. Skip reasons feed `ja prefs suggest`.
- Daily runs from saved searches (`/loop`, cron, Task Scheduler).
- Optional read-only inbox checks for verification codes and interview or rejection emails.
- Answers and cover letters in the posting's language when the user speaks it.
- `setup --doctor` health check and `--headless` mode for servers.
- Cheaper model for the per-job browser agent (`settings.applier_model`, default sonnet).

**Fixed during the test pass**
- Codex starts a freehire OAuth sign-in as soon as the server is added, which blocked setup for about 5 minutes and stopped it. The registration is now capped at 20 s; sign in later with `codex mcp login freehire`.
- Playwright MCP only reads files from its allowed folders. `ja queue stage` copies the resume and letter there before upload, and screenshots use absolute paths.
- The end-to-end run caught the per-job agent answering "Yes" to visa sponsorship for a job in a country the user is authorized for. `ja answer` now computes the standard screening answers in code: authorization and sponsorship per country, years per skill, notice, salary, how you heard, referral, consent, AI help, voluntary questions and saved answers. Unknown stays unknown.
- `ja letter check` enforces the cover letter rules: length, role and company, notice period, full signature, no clichés.
- `ja run save` refuses unknown answer sources; fixed rules are recorded as `rule:<topic>`.
- `ja queue done --source` records the real hiring system when a board job is resolved to the company site.
- Job ids from links use dashes only, and a "Location (City)" field gets the full location.

**Repo**
- Test suite: unit tests, browser tests on local demo forms (Greenhouse, Lever, Ashby and Workday style), and an end-to-end agent eval with injection and scam pages.
- GitHub Actions CI, security policy, issue templates, demo GIF.

## 0.2.0 - 2026-10-28

- Applies only on the company's official website or the hiring system it runs, using freehire's `official_job_url`.
- Job-board postings are resolved to the same job on the company's careers site.
- Company mode: "apply to backend jobs at Stripe and Shopify".
- Fake career site red flags.

## 0.1.0 - 2026-10-28

- First release: freehire search, fit-scored shortlist, review and auto modes, ATS playbook, truthful screening answers, application tracker, installers for macOS, Linux, WSL and Windows.
