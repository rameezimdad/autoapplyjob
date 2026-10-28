<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Job Autopilot profile

The agent answers application questions ONLY from this file. Lines marked <fill> are required.
Keep values short, separate list items with commas, and edit any time.

## Identity
first_name: <fill>
last_name: <fill>
email: <fill>
phone: <fill>                    # with country code, e.g. +1 555 010 0000
city: <fill>
country: <fill>                  # ISO code or name, e.g. PK
address:                         # optional, only used when a form requires it
linkedin:
github:
portfolio:

## Documents
resume_path: <fill>              # absolute path to your resume PDF
cover_letter: auto               # auto = write one when there is a field, none = never

## Work eligibility
authorized_countries: <fill>     # where you can work without sponsorship, e.g. PK, AE
needs_visa_sponsorship: <fill>   # yes / no, for countries outside the list above
willing_to_relocate: no
notice_period: 1 month
earliest_start:                  # YYYY-MM-DD, empty = after the notice period
background_check_ok: yes
talent_pool_ok: no

## Targets
roles: <fill>                    # e.g. Frontend Developer, React Developer
seniority: middle                # intern, junior, middle, senior, lead
work_mode: remote                # remote, hybrid, onsite
where: <fill>                    # countries, regions or cities, e.g. remote global, PK, eu
skills: <fill>                   # skill:years, e.g. react:4, typescript:3, node:2
min_salary:                      # e.g. 2500 USD/month
exclude_companies:               # names or slugs

## Experience facts
years_total: <fill>
current_title:
current_company:
highlights:
- 
education:                       # e.g. BS Computer Science, 2021
languages: English (C1)

## Standard answers
salary_expectation:              # what goes in a salary box, e.g. 3000 USD/month, negotiable
current_salary:                  # leave empty to skip that question
why_looking:                     # one line
# saved answers, one q / a pair each:
# - q: Are you comfortable with on-call shifts?
#   a: Yes, one week per month

## Voluntary self-identification
gender: Decline to self-identify
race_ethnicity: Decline to self-identify
veteran: Decline to self-identify
disability: Decline to self-identify

## Autopilot settings
mode: review                     # review = you approve each submit, auto = submits on its own
daily_cap: 15                    # applications per day, hard max 50
per_company_30d: 2               # applications to one company in 30 days
posted_within_days: 14
min_fit: 60                      # 0-100, lower-scoring jobs are skipped
