/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// standard screening answers computed from the profile, so the agent never guesses them
import { out, parseArgs, stdinJSON } from './common.mjs';
import { load } from './profile.mjs';

const N = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').replace(/\s\.|\.\s|\.$/g, ' ').trim();
const yes = b => (b ? 'Yes' : 'No');
const esc = s => s.replace(/[.+#]/g, m => `\\${m}`);
let REGIONS;

// "pakistan" -> PK, every region name Intl knows, longest first
function countryIn(q) {
  if (!REGIONS) {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' });
    REGIONS = [['usa', 'US'], ['united states of america', 'US'], ['uk', 'GB'], ['england', 'GB'], ['uae', 'AE'], ['ksa', 'SA']];
    for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
      const c = String.fromCharCode(a, b);
      let n; try { n = dn.of(c); } catch { continue; }
      if (n && n !== c && !/unknown/i.test(n)) REGIONS.push([N(n), c]);
    }
    REGIONS.sort((x, y) => y[0].length - x[0].length);
  }
  const t = ` ${N(q)} `;
  return REGIONS.find(([n]) => t.includes(` ${n} `))?.[1];
}

export function answer(q, pr = {}, ctx = {}) {
  const t = N(q), el = pr.eligibility ?? {}, ans = pr.answers ?? {}, vol = pr.voluntary ?? {}, exp = pr.experience ?? {}, tg = pr.targets ?? {};
  const auth = (el.authorized_countries ?? []).map(c => String(c).toUpperCase());
  const country = countryIn(q) ?? (ctx.country ? String(ctx.country).toUpperCase() : undefined);
  const r = (a, source, extra = {}) => ({ answer: String(a), source, ...extra });

  // the user's own saved answers win
  const si = (ans.saved ?? []).findIndex(s => { const sq = N(s?.q); return sq && (sq === t || (sq.length > 15 && (t.includes(sq) || sq.includes(t)))); });
  if (si >= 0) return r(ans.saved[si].a, `profile:answers.saved[${si}]`);

  if (/sponsor/.test(t)) {
    if (country) return auth.includes(country) ? r('No', 'profile:eligibility.authorized_countries') : r(yes(el.needs_visa_sponsorship), 'profile:eligibility.needs_visa_sponsorship');
    return el.needs_visa_sponsorship === false ? r('No', 'profile:eligibility.needs_visa_sponsorship') : null;
  }
  if (/(authori[sz]ed|eligible|permitted|legally able|right) to work|work (permit|authori[sz]ation)/.test(t)) return country ? r(yes(auth.includes(country)), 'profile:eligibility.authorized_countries') : null;
  if (/relocat/.test(t)) return r(yes(el.willing_to_relocate), 'profile:eligibility.willing_to_relocate');
  if (/notice period/.test(t)) return el.notice_period ? r(el.notice_period, 'profile:eligibility.notice_period') : null;
  if (/start date|when can you start|earliest .*start|available to start/.test(t)) {
    if (el.earliest_start) return r(el.earliest_start, 'profile:eligibility.earliest_start');
    return el.notice_period ? r(`After my ${el.notice_period} notice period`, 'profile:eligibility.notice_period') : null;
  }
  if (/\byears?\b/.test(t)) {
    const skills = tg.skills ?? {};
    const hit = Object.keys(skills).filter(s => new RegExp(`(^| )${esc(N(s))}(\\.?js)?( |$)`).test(t));
    if (hit.length === 1) return r(skills[hit[0]], `profile:targets.skills.${hit[0]}`);
    if (hit.length > 1) return null;
    // total only for plainly total questions, a named unknown skill stays unknown
    if (/\b(total|overall)\b/.test(t) || /^(how many )?years (of )?(professional |work |relevant )?experience( do you have)?$/.test(t)) return exp.years_total != null ? r(exp.years_total, 'profile:experience.years_total') : null;
    return null;
  }
  if (/how did you (hear|find|learn)|where did you (hear|find|see)|referral source|source of (application|hire)/.test(t)) return r('Job board', 'rule:how-did-you-hear');
  if (/referr/.test(t)) return r('No', 'rule:referral');
  if (/(previously|ever|formerly) (been )?(work|employ)|former employee|worked (for|at|with) .* before|current or former employee/.test(t)) return r('No', 'rule:worked-here');
  if (/related to|relative|family member/.test(t)) return r('No', 'rule:related');
  if (/\bai\b|artificial intelligence|chatgpt|automated (tool|assistant)/.test(t)) return r(ans.ai_assistance_disclosure || 'Yes', ans.ai_assistance_disclosure ? 'profile:answers.ai_assistance_disclosure' : 'rule:ai-honesty', { short: 'Yes' });
  for (const k of ['gender', 'veteran', 'disability']) if (t.includes(k)) return r(vol[k] ?? 'Decline to self-identify', `profile:voluntary.${k}`);
  if (/\b(race|ethnic|ethnicity|hispanic|latino)\b/.test(t)) return r(vol.race_ethnicity ?? 'Decline to self-identify', 'profile:voluntary.race_ethnicity');
  if (/sexual orientation|lgbt|pronoun/.test(t)) return r('Decline to self-identify', 'rule:voluntary');
  if (/\b(salary|compensation|pay|rate)\b/.test(t)) {
    if (/\b(current|previous|last)\b/.test(t)) return ans.current_salary ? r(ans.current_salary, 'profile:answers.current_salary') : null;
    if (/expect|desired|requir|target|asking/.test(t)) return ans.salary_expectation ? r(ans.salary_expectation, 'profile:answers.salary_expectation') : null;
  }
  if (/background check|drug (test|screen)/.test(t)) return r(yes(el.background_check_ok), 'profile:eligibility.background_check_ok');
  if (/future (opportunit|role|position|job)|talent (pool|community|network)|keep (my|your) (details|information|data)|job alerts|newsletter|marketing/.test(t)) return r(yes(el.talent_pool_ok), 'profile:eligibility.talent_pool_ok');
  if (/certify|privacy (policy|notice|statement)|terms (and )?conditions|data processing|i (agree|acknowledge|consent|confirm)/.test(t)) return r('Yes', 'rule:consent');
  if (/(remote|hybrid|on ?site|in (the )?office|days (a|per) week)/.test(t) && /(comfortable|willing|open|able|ok|okay|happy)/.test(t)) {
    const mode = /hybrid|days (a|per) week/.test(t) ? 'hybrid' : /on ?site|in (the )?office/.test(t) ? 'onsite' : 'remote';
    return r(yes([].concat(tg.work_mode ?? []).includes(mode)), 'profile:targets.work_mode');
  }
  if (/english/.test(t) && /level|proficien|fluen|speak/.test(t)) {
    const l = (exp.languages ?? []).find(x => /english/i.test(x?.name ?? ''));
    return l ? r(l.level, 'profile:experience.languages') : null;
  }
  if (/highest (level of )?education|degree/.test(t)) {
    const e = [].concat(exp.education ?? []).filter(Boolean);
    return e.length ? r(e[0], 'profile:experience.education') : null;
  }
  return null;
}

export default argv => {
  const { opt, args } = parseArgs(argv), ctx = { country: typeof opt.country === 'string' ? opt.country : undefined };
  if (!opt.batch && !args.length) return out('answer "QUESTION" [--country CC]          one screening question\nanswer --batch [--country CC] < list.json   ["question", ...] -> answers with sources, unknown = not in the profile');
  const pr = load();
  if (opt.batch) return out(stdinJSON().map(q => ({ question: q, ...(answer(q, pr, ctx) ?? { unknown: true }) })));
  out(answer(args.join(' '), pr, ctx) ?? { unknown: true });
};
