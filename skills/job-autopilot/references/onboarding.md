<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Onboarding - build APP/profile.yaml

The profile is the only source the agent may answer application questions from, so it has to be right. Setup copied the template to `APP/profile.yaml`. Fill it in and keep its comments.

## Fast path: from the resume

1. Ask: "Send me the full path to your resume PDF. I'll pre-fill your profile from it and you correct anything wrong."
2. Read it with your PDF reader, or `pdftotext <file> -` when available.
3. Pre-fill `identity`, `experience`, `targets.skills` (with years) and education. Leave everything the resume doesn't state empty. Never guess work authorization, sponsorship, salary or notice period from a resume.
4. Show the pre-filled sections, then ask Rounds 2 and 3 for what is still missing.

## Manual path: three rounds

Ask each round as one numbered message, and wait for the answers. Optional questions the user skips stay empty.

**Round 1 - you and your documents**
1. Full name
2. Email and phone (with country code)
3. City and country
4. LinkedIn, GitHub, portfolio (optional)
5. Full path to your resume PDF

**Round 2 - where you can work and what you want**
1. Countries where you can work without visa sponsorship
2. Do you need sponsorship for other countries? Willing to relocate?
3. Notice period, or your earliest start date
4. Target roles (2-3 names), seniority, and remote / hybrid / onsite
5. Where: countries, regions or cities (or "remote worldwide")
6. Top skills with years each, e.g. `react: 4, node: 2`
7. Minimum salary and currency (optional); companies to avoid (optional)

**Round 3 - facts and settings**
1. Total years of experience; current or last title and company
2. Two to four highlights you can defend in an interview, with numbers when you have them
3. Education, and languages with their level
4. What to write in a salary box (e.g. "3000 USD per month, negotiable")
5. Cover letters written for you (`auto`) or never (`none`)?
6. Tailored resumes per job (only reordering your own lines)? If yes, offer to build the master resume (below).
7. Voluntary questions (gender, race, veteran, disability) default to "Decline to self-identify". Change any?
8. Mode: `review` (you approve before anything is sent, the default), `auto`, or `dry-run`. Daily cap (default 15)?

## Master resume (only when tailoring is on)

1. Start from `SKILL_DIR/templates/master-resume.example.md`, using the user's real resume content only:
   - one fact per bullet
   - a few summary variants
   - every skill
2. Save it as `APP/master-resume.md`, show it, and change it until the user says it's right.
3. Set `documents.master_resume_path` to that file and `documents.tailor_resume: true`.

## Finish

1. Use `true` / `false` for yes-no values, and 2-letter codes for countries.
2. Run `JA profile check`. Fix every error with the user. Read the warnings out.
3. Show the final file, then go back to the user's original ask.
