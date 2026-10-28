/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// profile.yaml: load, defaults, validation
import { existsSync, readFileSync } from 'node:fs';
import { at, die, need, out } from './common.mjs';

export const FILE = () => at('profile.yaml');
export function load({ soft } = {}) {
  if (!existsSync(FILE())) return soft ? null : die(`no profile at ${FILE()}. Run setup, then ask the agent to fill it in.`);
  try { return need('yaml').parse(readFileSync(FILE(), 'utf8')) ?? {}; }
  catch (e) { return soft ? null : die(`profile.yaml is not valid YAML: ${e.message}`); }
}
export const get = (o, k) => k.split('.').reduce((v, p) => v?.[p], o);
export const settings = pr => ({ mode: 'review', daily_cap: 15, per_company_30d: 2, posted_within_days: 14, min_fit: 60, delay_seconds: 30, applier_model: 'sonnet', paper: 'A4', trusted_hosts: [], ...(pr?.settings ?? {}) });

const ISO2 = /^[A-Z]{2}$/;
const blank = v => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
const oneOf = list => v => blank(v) || [].concat(v).every(x => list.includes(x));

export function check(pr) {
  const errors = [], warnings = [];
  // placeholders anywhere
  const walk = (v, k) => typeof v === 'string' ? v.includes('<fill>') && errors.push(`${k} still says <fill>`)
    : v && typeof v === 'object' && Object.entries(v).forEach(([c, x]) => c.includes('<fill>') ? errors.push(`${k} still says <fill>`) : walk(x, k ? `${k}.${c}` : c));
  walk(pr, '');
  const req = (k, ok = v => !blank(v), msg = 'is required') => { const v = get(pr, k); if (!String(v).includes('<fill>') && !ok(v)) errors.push(`${k} ${msg}`); };
  ['identity.first_name', 'identity.last_name', 'identity.email', 'identity.phone', 'identity.city', 'identity.country', 'documents.resume_path', 'targets.roles'].forEach(k => req(k));
  req('identity.email', v => blank(v) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'is not an email address');
  req('documents.cover_letter', oneOf(['auto', 'none']), 'must be auto or none');
  req('eligibility.authorized_countries', v => Array.isArray(v) && v.length && v.every(c => ISO2.test(c)), 'must be a list of 2-letter country codes, e.g. [PK, AE]');
  req('eligibility.needs_visa_sponsorship', v => typeof v === 'boolean', 'must be true or false');
  req('targets.skills', v => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length && Object.values(v).every(n => typeof n === 'number' && n >= 0), 'must map each skill to its years, e.g. { react: 4 }');
  req('targets.work_mode', oneOf(['remote', 'hybrid', 'onsite']), 'must use remote, hybrid, onsite');
  req('targets.seniority', oneOf(['intern', 'junior', 'middle', 'senior', 'lead', 'staff', 'principal']), 'must use intern, junior, middle, senior, lead, staff, principal');
  req('experience.years_total', v => typeof v === 'number' && v >= 0, 'must be a number');

  const rp = get(pr, 'documents.resume_path'), mr = get(pr, 'documents.master_resume_path');
  if (rp && !String(rp).includes('<fill>')) {
    if (!existsSync(rp)) errors.push(`documents.resume_path not found: ${rp}`);
    else if (!/\.(pdf|docx?)$/i.test(rp)) warnings.push('documents.resume_path should be a PDF or Word file');
  }
  if (mr && !existsSync(mr)) errors.push(`documents.master_resume_path not found: ${mr}`);
  if (get(pr, 'documents.tailor_resume') === true && !mr) warnings.push('documents.tailor_resume is on but master_resume_path is empty, so tailoring is skipped');

  const s = pr?.settings ?? {};
  const range = (k, lo, hi) => s[k] !== undefined && !(Number.isInteger(s[k]) && s[k] >= lo && s[k] <= hi) && errors.push(`settings.${k} must be a whole number from ${lo} to ${hi}`);
  if (s.mode !== undefined && !['review', 'auto', 'dry-run'].includes(s.mode)) errors.push('settings.mode must be review, auto or dry-run');
  range('daily_cap', 1, 50); range('per_company_30d', 1, 10); range('posted_within_days', 1, 60); range('min_fit', 0, 100); range('delay_seconds', 20, 90);
  if (s.trusted_hosts !== undefined && s.trusted_hosts !== null && !Array.isArray(s.trusted_hosts)) errors.push('settings.trusted_hosts must be a list');
  if (s.paper !== undefined && !['A4', 'Letter'].includes(s.paper)) errors.push('settings.paper must be A4 or Letter');
  const ib = get(pr, 'inbox.enabled');
  if (ib !== undefined && ib !== null && typeof ib !== 'boolean') errors.push('inbox.enabled must be true or false');
  const ss = pr?.saved_searches;
  if (ss !== undefined && ss !== null && !(Array.isArray(ss) && ss.every(x => x?.name && x?.ask))) errors.push('saved_searches must be a list of { name, ask }');

  const ph = String(get(pr, 'identity.phone') ?? '').trim();
  if (ph && !ph.includes('<fill>') && !ph.startsWith('+')) warnings.push('identity.phone should start with the country code, e.g. +92');
  if (!get(pr, 'identity.linkedin')) warnings.push('identity.linkedin is empty, many forms ask for it');
  if (blank(get(pr, 'experience.highlights')?.filter?.(Boolean))) warnings.push('experience.highlights is empty, cover letters will be weak');
  if (blank(get(pr, 'answers.ai_assistance_disclosure'))) warnings.push('answers.ai_assistance_disclosure is empty');
  return { ok: !errors.length, errors, warnings };
}

export default argv => {
  const [cmd] = argv;
  if (cmd === 'path') return out(FILE());
  if (cmd !== 'check') return out('profile check   validate profile.yaml\nprofile path    where it lives');
  const r = check(load());
  out(r.ok ? `profile OK${r.warnings.length ? ` (${r.warnings.length} warning${r.warnings.length > 1 ? 's' : ''})` : ''}` : `profile has ${r.errors.length} problem(s)`);
  r.errors.forEach(e => out(`  error: ${e}`));
  r.warnings.forEach(w => out(`  warn:  ${w}`));
  process.exitCode = r.ok ? 0 : 1;
};
