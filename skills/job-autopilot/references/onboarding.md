<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Onboarding - build APP/profile.md

The profile is the only source the agent may answer application questions from, so it has to be right. Keep the interview short.

## Fast path: from the resume

1. Ask: "Send me the full path to your resume PDF. I'll pre-fill your profile from it and you correct anything wrong."
2. Read it (the agent's PDF reader, or `pdftotext <file> -` when available).
3. Pre-fill Identity, Experience facts, skills and education. Leave everything the resume doesn't state empty. Never guess work authorization, salary, notice period or sponsorship from a resume.
4. Show the pre-filled sections, then ask Rounds 2 and 3 below for what's still missing.

## Manual path: three rounds

Ask each round as one numbered message. Wait for the answers before the next round. Skipped optional questions stay empty.

**Round 1 - you and your documents**
1. Full name
2. Email and phone (with country code)
3. City and country
4. LinkedIn, GitHub, portfolio (optional)
5. Full path to your resume PDF

**Round 2 - where you can work and what you want**
1. Countries you can work in without visa sponsorship
2. Do you need sponsorship for other countries? Willing to relocate?
3. Notice period, or the earliest start date
4. Target roles (2-3 names), seniority, and remote / hybrid / onsite
5. Where: countries, regions or cities (or "remote worldwide")
6. Top skills with years for each, e.g. `react:4, node:2`
7. Minimum salary and currency (optional), and companies to avoid (optional)

**Round 3 - facts and settings**
1. Total years of experience, current or last title and company
2. Two to four highlights you can stand behind in an interview, with numbers when you have them
3. Education and languages (with level)
4. What to write in a salary box (e.g. "3000 USD/month, negotiable")
5. Cover letters: write them for you (`auto`) or never (`none`)?
6. Voluntary questions (gender, race, veteran, disability): the default is "Decline to self-identify". Change any?
7. Mode: `review` (you approve every submit, the default) or `auto`. Daily cap (default 15)?

## Write the file

- Start from `SKILL_DIR/templates/profile.example.md` (setup already copied it to `APP/profile.md`).
- Replace each `<fill>` with the user's answer and keep the comments.
- `ls` the `resume_path`. Missing → ask again.
- Show the final file. Save once the user says it's right, then go back to the user's original ask.
