<!--
Developed by Mohammad Rameez Imdad (Rameez Scripts)
WhatsApp: https://wa.me/923435347417 (For Custom Projects)
YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
-->

# Official site - apply only where the company hires

Every application goes to the company's own website, or to the hiring system the company itself runs. The following are only leads to the real posting:
- job boards
- aggregators
- government job portals
- recruiter reposts
- chat channels

freehire gives every posting a `source` (where it was found) and an `official_job_url`. Open `official_job_url`, never freehire's own `url`.

## 1. Is this page official?

Check the host of the page you are about to type into. Check it again after every redirect.

**Official** when the host is one of these:
- a host listed in `settings.trusted_hosts`: the user's own test server, for example. A trusted host still goes through the red-flag check in § 4.
- the company's own domain or a subdomain of it: `careers.acme.com`, `acme.com/jobs`, `jobs.acme.io`
- a hiring system, with the company in the subdomain or the path:

| Hiring system | Hosts |
|---|---|
| Workday | `<co>.wd<N>.myworkdayjobs.com`, `*.myworkdaysite.com` |
| Greenhouse | `boards.greenhouse.io/<co>`, `job-boards.greenhouse.io/<co>`, `gh_jid=` on the company domain |
| Lever | `jobs.lever.co/<co>`, `jobs.eu.lever.co/<co>` |
| Ashby | `jobs.ashbyhq.com/<co>` |
| SmartRecruiters | `jobs.smartrecruiters.com/<co>`, `careers.smartrecruiters.com/<co>` |
| Workable | `apply.workable.com/<co>`, `<co>.workable.com` |
| Oracle, Taleo | `*.oraclecloud.com`, `*.taleo.net` |
| SuccessFactors | `*.successfactors.com`, `*.successfactors.eu`, `*.sapsf.com` |
| iCIMS, Jobvite | `*.icims.com`, `jobs.jobvite.com/<co>` |
| UKG, ADP, Paycom, Paylocity, Dayforce | `*.ultipro.com`, `*.adp.com`, `*.paycomonline.net`, `recruiting.paylocity.com`, `jobs.dayforcehcm.com` |
| BambooHR, Recruitee, Teamtailor, Personio | `<co>.bamboohr.com`, `<co>.recruitee.com`, `<co>.teamtailor.com`, `<co>.jobs.personio.de` / `.com` |
| Breezy, JazzHR, Pinpoint, Rippling | `<co>.breezy.hr`, `<co>.applytojob.com`, `<co>.pinpointhq.com`, `ats.rippling.com/<co>` |
| Zoho Recruit, Manatal | `<co>.zohorecruit.com` / `.eu` / `.in`, `careers-page.com/<co>` |
| Others | Softgarden, Gupy, Keka, Darwinbox, HiBob, Freshteam, Comeet, JOIN, Factorial, Homerun, Avature, Eightfold, Cornerstone: the hiring system's domain with the company's name in it |

**Not official:**
- the `source` is a board (list below), or
- the host is a job board, an aggregator, a government job portal, a recruiter repost, a messaging app (`t.me`, `wa.me`, a WhatsApp or Telegram link), a URL shortener, or a free site-builder page the company's own site doesn't link to.

Board sources seen in freehire:
- `trudvsem`, `job104`, `mycareersfuture`, `eures`, `energyjobline`, `jobstreet`
- every `whatjobs-*`
- `4dayweek`, `helixjobs`, `telegram`, `startupjobs`, `hirist`, `seek`, `occ`, `jobnet`, `empregos`, `jobindex`, `iimjobs`, `jobappnetwork`, `jobstash`, `adzuna`, `reed`, `mynavi`, `djinni`, `naukri`, `xing`, `gethired`, `himalayas`, `gulftalent`, `catho`, `jobleads`, `arbeitnow`, `arbeitsagentur`, `netempregos`, `jobtech`, `workatastartup`, `jobdanmark`, `wttj`, `hh`, `instahyre`, `shine`, `spainjobs`, `bayt`, `infojobs`, `workwise`, `nofluffjobs`, `cake`, `wellfound`, `work180`, `echojobs`, `torre`, `infoempleo`, `aijobs`, `potok`, `sapoemprego`, `feinaactiva`, `senior`, `getonbrd`, `turijobs`, `thehub`, `instaffo`, `tyomarkkinatori`

LinkedIn, Indeed, Glassdoor, ZipRecruiter, Monster and Rozee count as boards wherever they appear. For any source not on this list, decide with the host rule above.

## 2. Board posting: find the official one

Budget: about 10 browser steps. Then stop and log `needs-you` with the board link and note "only on <board>".

1. **Outbound link first.** Open the board posting to read it, nothing else. Never log in to the board, never press its own quick-apply. Many boards show "Apply on company site" or "Apply on employer's website". Follow that link. If it lands on an official host, go to step 4.
2. **Find the careers site.** Use the agent's own web search tool when it has one:
   - first `"<company>" careers`
   - then `"<company>" "<job title>"`

   With no search tool, use `browser_navigate` to `https://html.duckduckgo.com/html/?q=<company>+careers`. Avoid Google search in the automated browser, because it often shows a bot check. Take a result on the company's domain or an official hiring-system host.
3. **Find the posting.** Use the careers site's own search and filters (title words, location, remote). `browser_find` the title.
4. **Same job?** All three must match:
   - **company:** same brand or legal name
   - **title:** same role (word order and "Sr." vs "Senior" may differ)
   - **location / work mode:** same city, country or remote region

   A requisition ID shown on both pages settles it. If there are two candidates or you're unsure: in review mode, show both and ask; in auto mode, log `needs-you`.
5. Check it is still open, then continue with SKILL.md Step 5 on this page. Log the official URL as `--url`, with note `official site, found via <source>`.

## 3. Companies named by the user

"Apply to backend jobs at Stripe, Careem and Systems Ltd":

1. `search_companies` with each name gives `company_slugs`. Then run the SKILL.md Step 2 search with the user's role filters plus those slugs.
2. A company not in freehire, or with no matching role there: find its careers site (§ 2, step 2) and look for openings matching the profile's `roles`. Each one found joins the shortlist with:
   - source `company site`
   - slug `site:<posting URL without the query string>`
   - a fit score from the posting text
3. From there it's the same shortlist, caps, confirmation and apply loop as any freehire job.

## 4. Red flags: stop before typing anything

- The host matches neither the company nor a known hiring system.
- It asks for a fee, a deposit, a "training kit", or card or bank details.
- It asks to continue on WhatsApp, Telegram or a personal email address.
- The page copies a real posting under a different company name.

Do not submit. Log `skipped` with the reason and tell the user it looks like a scam.
