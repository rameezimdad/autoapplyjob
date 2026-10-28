/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// cover letter check: length, role + company named, notice period, full signature, no cliches
import { existsSync, readFileSync } from 'node:fs';
import { die, out, parseArgs } from './common.mjs';
import { load } from './profile.mjs';

const CLICHES = ['i am writing to express', 'passionate', 'dynamic team', 'fast-paced environment', 'team player', 'go-getter', 'synergy', 'think outside the box'];
const digits = s => String(s ?? '').replace(/\D/g, '');

export function check(text, pr, { company, title } = {}) {
  const errors = [], t = text.toLowerCase(), words = text.trim().split(/\s+/).filter(Boolean).length;
  const i = pr?.identity ?? {}, notice = pr?.eligibility?.notice_period;
  if (words < 120 || words > 180) errors.push(`${words} words, keep it between 120 and 180`);
  if (company && !t.includes(String(company).toLowerCase())) errors.push(`company name missing: ${company}`);
  if (title && !t.includes(String(title).toLowerCase())) errors.push(`role title missing: ${title}`);
  if (notice && !t.includes(String(notice).toLowerCase())) errors.push(`notice period missing: ${notice}`);
  if (i.first_name && i.last_name && !t.includes(`${i.first_name} ${i.last_name}`.toLowerCase())) errors.push('signature: full name missing');
  if (i.email && !t.includes(String(i.email).toLowerCase())) errors.push('signature: email missing');
  if (i.phone && !digits(text).includes(digits(i.phone).slice(-7))) errors.push('signature: phone missing');
  CLICHES.filter(c => t.includes(c)).forEach(c => errors.push(`cliche: "${c}"`));
  if (/<fill>|\[.*?\]|\{.*?\}/.test(text)) errors.push('placeholder left in the text');
  return { ok: !errors.length, words, errors };
}

export default argv => {
  const [cmd, file, ...rest] = argv, { opt } = parseArgs(rest);
  if (cmd !== 'check' || !file) return out('letter check FILE [--company C] [--title T]   length, role and company, notice period, signature, cliches');
  if (!existsSync(file)) die(`no such file: ${file}`);
  const r = check(readFileSync(file, 'utf8'), load(), { company: typeof opt.company === 'string' ? opt.company : '', title: typeof opt.title === 'string' ? opt.title : '' });
  out(r.ok ? `letter OK (${r.words} words)` : r.errors.map(e => `fix: ${e}`).join('\n'));
  process.exitCode = r.ok ? 0 : 1;
};
