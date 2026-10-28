/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// browser_evaluate call that fills the standard fields in one step
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SKILL, out, parseArgs } from './common.mjs';
import { load } from './profile.mjs';

export const FILL = join(SKILL, 'scripts', 'recipes', 'fill.js');

export function values(pr) {
  const i = pr?.identity ?? {}, e = pr?.experience ?? {}, cc = String(i.country ?? '').trim();
  let country = cc;
  if (/^[a-z]{2}$/i.test(cc)) try { country = new Intl.DisplayNames(['en'], { type: 'region' }).of(cc.toUpperCase()) ?? cc; } catch {}
  return {
    first_name: i.first_name, last_name: i.last_name, full_name: [i.first_name, i.last_name].filter(Boolean).join(' '),
    email: i.email, phone: i.phone, city: i.city, country, country_code: cc.toUpperCase(),
    location: [i.city, country].filter(Boolean).join(', '),
    linkedin: i.linkedin, github: i.github, portfolio: i.portfolio,
    current_company: e.current_company, current_title: e.current_title,
  };
}

// short form needs the init script, inline form carries the filler itself
export function build(V, inline) {
  const v = JSON.stringify(V);
  return inline
    ? `() => { ${readFileSync(FILL, 'utf8').trim()}\nreturn window.__jaFill(${v}); }`
    : `() => window.__jaFill ? window.__jaFill(${v}) : { error: 'no-init-script' }`;
}

export default argv => {
  const { opt } = parseArgs(argv);
  out(build(opt.outline ? {} : values(load()), !!opt.inline));
};
