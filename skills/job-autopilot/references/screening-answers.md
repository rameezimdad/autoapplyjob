<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Screening answers

**Run `JA answer --batch --country <CC>` first.** It computes every row of the table below that has a fixed answer: authorization, sponsorship, years per skill, relocation, notice, salary, how you heard, referral, worked here, consent, AI help, voluntary questions and saved answers. It applies the rules in code so they can't be misread. Use its answers as they are. This file is for what it returns as `unknown`.

Where answers come from, in this order:
1. `profile.yaml`
2. answers the user approved (`JA run answers <slug>` in phase submit)
3. what the user said in this session
4. nothing: log `needs-you` with the question

Never guess. Record every answer with its source:
- `profile:<key>`
- `rule:<topic>`, for the fixed rules below: `rule:how-did-you-hear`, `rule:referral`, `rule:worked-here`, `rule:consent`
- `approved`
- `user`, only when the user said it
- `letter`
- `resume`

| Question | Answer |
|---|---|
| Authorized to work in <country>? | Yes only when the country is in `eligibility.authorized_countries`, otherwise No |
| Need sponsorship now or in the future? | Authorized country: No. Any other country: `eligibility.needs_visa_sponsorship` |
| Willing to relocate? | `eligibility.willing_to_relocate` |
| Remote / hybrid / onsite OK? | Yes when it's in `targets.work_mode`, otherwise the true answer |
| Notice period / start date | `eligibility.notice_period` / `eligibility.earliest_start` |
| Expected salary (text box) | `answers.salary_expectation` |
| Expected salary (number only) | the number from `answers.salary_expectation` when its currency matches the field. Otherwise `needs-you`: never convert currencies yourself |
| Current or previous salary | Optional field: leave it blank. Required: `answers.current_salary`, or "Prefer not to say" when offered, otherwise `needs-you` |
| Years with <skill> | `targets.skills.<skill>`. Skill not listed: `needs-you`. Never round up |
| Total years | `experience.years_total` |
| Highest education | `experience.education` |
| Language level | `experience.languages` |
| How did you hear about us? | Job board / Online job search / Other website (`rule:how-did-you-hear`). Never name a person |
| Referred by an employee? | No (`rule:referral`), unless the profile names a referral at that company |
| Worked here before / related to an employee? | No (`rule:worked-here`), unless the profile says so |
| Background check / drug test OK? | `eligibility.background_check_ok`, otherwise `needs-you` |
| "I certify this information is true", privacy notice, terms and conditions required to apply | tick it (`rule:consent`): applying needs it, and every answer is true. Marketing or "contact me about other jobs" boxes are NOT this rule, see talent pool |
| Join the talent pool / job alerts | `eligibility.talent_pool_ok`, default No |
| Did you use AI / an AI tool for this application? | `answers.ai_assistance_disclosure`. Never answer No |
| Gender, race, ethnicity, veteran, disability, orientation | `voluntary.*`, default "Decline to self-identify" or the form's "I don't wish to answer" |
| Date of birth, age, marital status, religion, photo | Optional field: leave it blank. Required: `needs-you` |
| National ID, passport, SSN, tax number, bank details | never. Stop: `needs-you` |
| Why do you want to work here? | 2-3 sentences: one specific point from the posting or the company page, plus one matching `experience.highlights` item |
| Technical free-text questions | short true answers built from `experience.highlights`. Anything that needs knowledge the profile doesn't show: `needs-you` |
| Take-home test, assessment link, recorded video | `needs-you` |
| Anything in `answers.saved` | the stored answer, when the question means the same thing |

## Language

The posting is not in English, and `experience.languages` lists that language at B2 or above (or native)? Then write free-text answers and the cover letter in that language. Otherwise write in English.

Never machine-translate the resume. Picking a dropdown option in the form's language is always fine.

## Cover letter

Write one only when the form has a cover letter field (or `cover_letter` is requested) and `documents.cover_letter: auto`.

- 120-180 words, plain text, three short paragraphs:
  1. the exact role and company, and one specific reason taken from the posting
  2. two proof points from `experience.highlights` that match the posting's required items
  3. availability (`eligibility.notice_period`) and a one-line close
- Facts only from the profile. No clichés: "I am writing to express my interest", "passionate", "dynamic team", "fast-paced environment".
- Sign with first and last name, then email and phone.
- Write the notice period exactly as the profile says it (e.g. "1 month"). `JA letter check` looks for that text.
- Save it as `APP/prep/<slug>/letter.txt`, then run `JA letter check APP/prep/<slug>/letter.txt --company "<company>" --title "<title>"` until it prints `letter OK`. It checks the length, the role and company, the notice period, the signature and clichés.
- Then paste or upload it. File fields usually accept `.txt`. If one refuses, paste the text into a text box if there is one, or skip the field when it's optional.

## Saving a new answer

When the user answers a new question (in chat or on the review page), offer to keep it:

```yaml
answers:
  saved:
    - { q: Are you comfortable with on-call shifts?, a: "Yes, one week per month" }
```

Add it only after they agree. The next run won't ask again.
