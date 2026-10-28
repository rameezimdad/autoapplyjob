#!/usr/bin/env node
/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// applications log: one json line per event, last line per slug wins
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const APP = process.env.JOB_AUTOPILOT_HOME || join(homedir(), '.job-autopilot');
const LOG = join(APP, 'applications.jsonl');
const STATUS = ['applied', 'skipped', 'needs-you', 'failed'];
const FIELDS = ['at', 'status', 'company', 'title', 'url', 'ats', 'slug', 'company_slug', 'note'];

// --key value + bare args
const [cmd, ...rest] = process.argv.slice(2);
const opt = {}, args = [];
for (let i = 0; i < rest.length; i++) rest[i].startsWith('--') ? (opt[rest[i].slice(2)] = rest[++i] ?? '') : args.push(rest[i]);

const rows = () => existsSync(LOG)
  ? readFileSync(LOG, 'utf8').split('\n').filter(Boolean).flatMap(l => { try { return [JSON.parse(l)]; } catch { return []; } })
  : [];
const latest = () => [...rows().reduce((m, r) => m.set(r.slug, r), new Map()).values()];
const localDay = d => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD local
const since = days => r => Date.parse(r.at) >= Date.now() - days * 864e5;
const out = v => console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2));
const die = m => { console.error(m); process.exit(1); };

const cmds = {
  add() {
    if (!opt.slug) die('add needs --slug');
    if (!STATUS.includes(opt.status)) die(`--status must be one of: ${STATUS.join(', ')}`);
    mkdirSync(APP, { recursive: true });
    const r = { at: new Date().toISOString(), slug: opt.slug, status: opt.status, title: opt.title ?? '', company: opt.company ?? '',
      company_slug: opt['company-slug'] ?? '', url: opt.url ?? '', ats: opt.ats ?? '', note: opt.note ?? '' };
    appendFileSync(LOG, JSON.stringify(r) + '\n');
    out(`logged ${r.status}: ${r.company} - ${r.title}`);
  },
  check() {
    const m = new Map(latest().map(r => [r.slug, r.status]));
    out(Object.fromEntries(args.map(s => [s, m.get(s) ?? null])));
  },
  today() {
    const d = localDay(Date.now());
    out(String(latest().filter(r => r.status === 'applied' && localDay(r.at) === d).length));
  },
  company() {
    if (!args[0]) die('company needs a company slug');
    out(String(latest().filter(r => r.status === 'applied' && r.company_slug === args[0] && since(30)(r)).length));
  },
  list() {
    const days = Number(opt.days) || 0;
    const list = latest().filter(r => (!opt.status || r.status === opt.status) && (!days || since(days)(r)));
    if (!list.length) return out('no applications yet');
    list.forEach(r => out(`${localDay(r.at)}  ${r.status.padEnd(9)}  ${r.company} - ${r.title}  ${r.url}${r.note ? `  (${r.note})` : ''}`));
  },
  stats() {
    const all = latest(), week = all.filter(since(7));
    const count = list => STATUS.map(s => `${s} ${list.filter(r => r.status === s).length}`).join(', ');
    out(`all time: ${count(all)}\nlast 7 days: ${count(week)}\napplied today: ${all.filter(r => r.status === 'applied' && localDay(r.at) === localDay(Date.now())).length}`);
  },
  csv() {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const file = join(APP, 'applications.csv');
    writeFileSync(file, [FIELDS.join(','), ...latest().map(r => FIELDS.map(f => q(r[f])).join(','))].join('\n') + '\n');
    out(file);
  },
};

(cmds[cmd] ?? (() => out(`usage: tracker.mjs <command>
  add --slug S --status applied|skipped|needs-you|failed [--title T --company C --company-slug CS --url U --ats A --note N]
  check SLUG...        latest status per slug (null = never seen)
  today                applications sent today
  company SLUG         applications to that company in the last 30 days
  list [--status S] [--days N]
  stats
  csv                  export to ${join(APP, 'applications.csv')}`)))();
