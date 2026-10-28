<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Resume tailoring - same facts, better order

Only when `documents.tailor_resume: true`, `documents.master_resume_path` is set, and you have the job description from `get_job`. Otherwise the applier uploads `documents.resume_path` unchanged.

A tailored resume is the master resume with lines **reordered or dropped**, never added or reworded. `JA resume check` proves it line by line.

## Allowed

- Pick the summary line that fits the job best and drop the others.
- Inside each job, move the bullets that match the posting's `required` items to the top. Drop weak bullets so the resume fits on one or two pages.
- In Skills, put the posting's must-have skills first and drop unrelated ones. A skill the master doesn't have can't appear.
- Drop a whole section that doesn't help this job (e.g. Projects).

## Not allowed

- New words in a bullet, merged bullets, changed numbers, dates or titles.
- Changing the order of jobs or education entries. Most recent stays first.
- Changing the header (name, contact line).

## Steps

1. Write `APP/prep/<slug>/resume.md` by copying lines from the master.
2. Run `JA resume check APP/prep/<slug>/resume.md`. Every error names a line. Fix it by copying the master's exact line, or by dropping it. Two tries at most; if errors remain, skip tailoring for this job.
3. Run `JA resume pdf APP/prep/<slug>/resume.md "APP/prep/<slug>/<First>-<Last>-Resume.pdf"`. Recruiters see the file name.
4. The applier finds the PDF in the prep folder and uploads it instead of the default resume.
