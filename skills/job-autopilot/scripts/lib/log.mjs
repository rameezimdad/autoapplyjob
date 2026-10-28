/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// applications log: one json line per event, last line per slug wins
import { append, at, day, die, jsonl, now, out, parseArgs, writeText } from './common.mjs';

export const STATUS = ['applied', 'prepared', 'skipped', 'needs-you', 'failed', 'interview', 'assessment', 'rejected', 'offer'];
const FIELDS = ['at', 'status', 'company', 'title', 'url', 'ats', 'slug', 'company_slug', 'batch', 'note'];
const LOG = () => at('applications.jsonl');

export const rows = () => jsonl(LOG());
// later lines win, earlier fields kept
export const latest = () => [...rows().reduce((m, r) => m.set(r.slug, { ...m.get(r.slug), ...r }), new Map()).values()];
const since = days => r => Date.parse(r.at) >= Date.now() - days * 864e5;
export const appliedToday = () => latest().filter(r => r.status === 'applied' && day(r.at) === day()).length;
export const appliedTo = (company_slug, days = 30) => company_slug ? latest().filter(r => r.status === 'applied' && r.company_slug === company_slug && since(days)(r)).length : 0;
export const lastApplied = () => Math.max(0, ...rows().filter(r => r.status === 'applied').map(r => Date.parse(r.at)));

export function add(r) {
  if (!r.slug) die('needs --slug');
  if (!STATUS.includes(r.status)) die(`status must be one of: ${STATUS.join(', ')}`);
  return append(LOG(), { at: now(), ...Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== true)) });
}

const USAGE = `log add --slug S --status ${STATUS.join('|')} [--title T --company C --company-slug CS --url U --ats A --batch B --note N]
log status SLUG STATUS [--note N]    later stage: interview, assessment, rejected, offer
log check SLUG...                    latest status per slug (null = never seen)
log today                            applications sent today
log company SLUG                     applications to that company in the last 30 days
log list [--status S] [--days N]
log show SLUG                        full history of one job
log stats
log csv                              export ${at('applications.csv')}`;

export default argv => {
  const [cmd, ...rest] = argv, { opt, args } = parseArgs(rest);
  const C = {
    add: () => {
      const r = add({ slug: opt.slug, status: opt.status, title: opt.title, company: opt.company, company_slug: opt['company-slug'], url: opt.url, ats: opt.ats, batch: opt.batch, note: opt.note });
      out(`logged ${r.status}: ${[r.company, r.title].filter(Boolean).join(' - ') || r.slug}`);
    },
    status: () => { const r = add({ slug: args[0], status: args[1] ?? opt.status, note: opt.note }); out(`${r.slug}: ${r.status}`); },
    check: () => { const m = new Map(latest().map(r => [r.slug, r.status])); out(Object.fromEntries(args.map(s => [s, m.get(s) ?? null]))); },
    today: () => out(String(appliedToday())),
    company: () => { if (!args[0]) die('usage: log company SLUG'); out(String(appliedTo(args[0]))); },
    list: () => {
      const d = Number(opt.days) || 0;
      const list = latest().filter(r => (!opt.status || r.status === opt.status) && (!d || since(d)(r)));
      if (!list.length) return out('nothing logged yet');
      list.forEach(r => out(`${day(r.at)}  ${r.status.padEnd(10)} ${[r.company, r.title].filter(Boolean).join(' - ')}  ${r.url ?? ''}${r.note ? `  (${r.note})` : ''}`));
    },
    show: () => { const h = rows().filter(r => r.slug === args[0]); out(h.length ? h : `no history for ${args[0]}`); },
    stats: () => {
      const all = latest();
      const count = l => STATUS.map(s => [s, l.filter(r => r.status === s).length]).filter(([, n]) => n).map(([s, n]) => `${s} ${n}`).join(', ') || 'nothing yet';
      out(`all time: ${count(all)}\nlast 7 days: ${count(all.filter(since(7)))}\napplied today: ${appliedToday()}`);
    },
    csv: () => {
      const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      out(writeText(at('applications.csv'), [FIELDS.join(','), ...latest().map(r => FIELDS.map(k => q(r[k])).join(','))].join('\n') + '\n'));
    },
  };
  (C[cmd] ?? (() => out(USAGE)))();
};
