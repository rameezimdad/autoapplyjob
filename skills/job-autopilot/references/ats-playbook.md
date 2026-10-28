<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# ATS playbook

Find the system by the `source` that `get_job` returns, or by the host of `official_job_url`. Read "All systems" plus that system's section.

## All systems

- `browser_snapshot` before each action. Element refs change after every page update.
- Fill one section, snapshot, look for red error text, then go to the next section.
- Long page: `browser_find` with the field label is cheaper than a full snapshot.
- **File upload:** click the upload control first so the file chooser opens, then `browser_file_upload` with the absolute path. If the page shows "uploading", `browser_wait_for` the file name.
- **Custom dropdowns (not a real `<select>`):** click, type the first letters, click the option.
- **Phone with a country picker:** pick the country, then type the number without the country code.
- **Dates:** use the format the placeholder shows, otherwise `YYYY-MM-DD`.
- **Autocomplete location:** type the city, wait, click the matching suggestion.
- Never click "Apply with LinkedIn / Indeed / Google".
- Cookie banners: accept only the necessary cookies, or close the banner.

## Greenhouse

URL: `boards.greenhouse.io`, `job-boards.greenhouse.io`, or a company page with `gh_jid=` (the form sits in an iframe).
- One-page form under the posting.
- Resume: the "Attach" button. "Enter manually" is the fallback.
- Custom questions follow. Required ones carry `*`.
- US postings end with a voluntary EEO block: use the profile answers.
- Some boards email a security code after submit and show a code box. That is step 7: the user enters it.
- Confirmation: "Thank you for applying" or "Application submitted".

## Lever

URL: `jobs.lever.co/<company>/<id>`, the form is at `/apply`.
- Upload the resume first. Lever parses it into name, email, phone and current company. Check each one.
- "Additional information" is the cover letter box.
- hCaptcha may appear on submit. That is step 7.
- Confirmation: "Application submitted" or "Thanks for applying".

## Ashby

URL: `jobs.ashbyhq.com/<company>/<id>`, then the "Application" tab.
- The resume upload autofills fields. Check them.
- Yes / No questions are buttons, not radios.
- Location is an autocomplete field.
- Confirmation: "Thanks for applying" or "successfully submitted".

## Workday

URL: `<company>.wd<N>.myworkdayjobs.com`.
- Each company needs its own account, and that means a password. Hand it to the user (step 7): they sign in or create the account in the Chromium window, and the browser profile keeps the session. In auto mode: log `needs-you`.
- Use "Autofill with Resume" when offered, then go through the pages in order:
  - My Information
  - My Experience
  - Application Questions
  - Voluntary Disclosures
  - Self Identify
  - Review
- "How did you hear about us" is often a nested list. Pick Job Board, Online or Other Website.
- "Previously worked here": No, unless the profile says otherwise.
- Each page has "Save and Continue". Errors are listed at the top.
- Confirmation: "Application Submitted", and the job shows under My Applications.

## SmartRecruiters

URL: `jobs.smartrecruiters.com`, button "I'm interested".
- The resume parse fills experience entries. Delete anything wrong rather than leaving it.
- Confirmation: "Thank you for your application".

## Workable

URL: `apply.workable.com/<company>/j/<id>`. "Apply for this job" opens a one-page form, with optional resume autofill.
- Confirmation: "Application submitted" or "Thank you".

## BambooHR, Recruitee, Teamtailor, Personio, Breezy, JazzHR

One-page or two-step forms. Follow "All systems".

## iCIMS, Jobvite, Taleo, SuccessFactors

These usually need an account. Handle them like Workday.

## Company career pages (no known ATS)

Best effort. Log `needs-you` with the link when the page:
- needs an account,
- only accepts applications by email, or
- has no form within 3 clicks.

## Job boards

- Never apply on a job board: LinkedIn Easy Apply, Indeed Apply, Glassdoor, ZipRecruiter, Naukri, Bayt or any other board's quick-apply. Their terms ban automated applying, and the company's own site is the official channel anyway.
- Find the same job on the company's site with `official-site.md` § 2 and apply there.
- Not found: log `needs-you` and hand the user the board link.
