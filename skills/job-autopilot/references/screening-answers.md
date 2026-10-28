<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Screening answers

Source order:
1. `profile.md`
2. what the user said in this session
3. nothing: in review mode ask the user, in auto mode log `needs-you`

Never guess.

| Question | Answer |
|---|---|
| Authorized to work in <country>? | Yes only when the country is in `authorized_countries`, otherwise No |
| Need sponsorship now or in the future? | Authorized country: No. Any other country: `needs_visa_sponsorship` |
| Willing to relocate? | `willing_to_relocate` |
| Remote / hybrid / onsite OK? | Yes when it is in `work_mode`, otherwise the true answer |
| Notice period / start date | `notice_period` / `earliest_start` |
| Expected salary (text box) | `salary_expectation` |
| Expected salary (number only) | the number from `salary_expectation` when its currency matches the field, otherwise ask the user (never convert currencies yourself) |
| Current or previous salary | optional field: leave it blank. Required: `current_salary`, or "Prefer not to say" when offered, otherwise ask |
| Years with <skill> | the years on the `skills` line. Skill not listed: ask. Never round up |
| Total years | `years_total` |
| Highest education | `education` |
| Language level | `languages` |
| How did you hear about us? | Job board / Online job search / Other website. Never name a person |
| Referred by an employee? | No, unless the profile names a referral at that company |
| Worked here before / related to an employee? | No, unless the profile says so |
| Background check / drug test OK? | `background_check_ok`, otherwise ask |
| "I certify this information is true", privacy notice | tick it (required to apply, and every answer is true) |
| Join the talent pool / job alerts | `talent_pool_ok`, default No |
| Gender, race, ethnicity, veteran, disability, orientation | profile § Voluntary, default "Decline to self-identify" or the form's "I don't wish to answer" |
| Date of birth, age, marital status, religion, photo | optional field: leave it blank. Required: `needs-you`, and tell the user which question |
| National ID, passport, SSN, tax number, bank details | never. Stop, log `needs-you` |
| Why do you want to work here? | 2-3 sentences: one specific point from the posting or the company page, plus one profile highlight that matches it |
| Technical free-text questions | short true answers built from the profile highlights. Anything that needs knowledge the profile doesn't show: ask |
| Take-home test, assessment link, recorded video | `needs-you` |
| Anything in profile § Standard answers | use the stored answer when the question means the same thing |

## Cover letter

Write one only when the form has a cover letter field and `cover_letter: auto`.

- 120-180 words, plain text, three short paragraphs:
  1. the exact role and company, and one specific reason from the posting
  2. two proof points from the profile `highlights` that match the posting's must-haves
  3. availability (`notice_period`) and a one-line close
- Use only facts from the profile.
- No clichés: no "I am writing to express my interest", "passionate", "dynamic team", "fast-paced environment".
- Sign with first name + last name, then email and phone.
- Save it to `APP/letters/<slug>.txt` before pasting or uploading. The file field accepts the `.txt`. If it refuses, paste the text into a text box when there is one; if the field is optional, skip it.

## Saving a new answer

When the user answers a new question in review mode, offer one line for § Standard answers:

```
- q: Are you comfortable with on-call shifts?
  a: Yes, one week per month
```

Add it only after they agree. The next run won't ask again.
