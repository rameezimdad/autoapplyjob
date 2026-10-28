/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// batch queue: survives crashes, enforces caps + pacing in code
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { JA, SKILL, TEST, at, die, now, out, parseArgs, readJSON, readText, safe, sleep, slugFor, stdinJSON, writeJSON, writeText } from './common.mjs';
import { add as log, appliedTo, appliedToday, lastApplied, latest } from './log.mjs';
import { load, settings } from './profile.mjs';

const MODES = ['review', 'auto', 'dry-run'];
const DONE = ['prepared', 'applied', 'needs-you', 'skipped', 'failed', 'approved'];
// status -> phase that works on it, per mode
const PHASE = { review: { pending: 'prepare', approved: 'submit' }, auto: { pending: 'apply' }, 'dry-run': { pending: 'prepare' } };
const SUBMITS = ['submit', 'apply'];
const ptr = () => at('queue', 'current');
const file = b => at('queue', `${b}.json`);
const stamp = () => now().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const counts = q => q.items.reduce((m, i) => (m[i.status] = (m[i.status] ?? 0) + 1, m), {});

export const current = b => readText(ptr()).trim() || b;
export function loadQ(b) {
  const id = b || current();
  if (!id) die('no batch yet: run "queue new" first');
  return readJSON(file(id)) ?? die(`batch ${id} not found`);
}
export const save = q => writeJSON(file(q.batch), q);
export function set(q, it, status, note) {
  Object.assign(it, { status, note: note && note !== true ? String(note) : '', updated_at: now() });
  save(q);
  if (status !== 'approved') log({ slug: it.slug, status, title: it.title, company: it.company, company_slug: it.company_slug, url: it.url, ats: it.source, batch: q.batch, note: it.note });
}

export default argv => {
  const [cmd, ...rest] = argv, { opt, args } = parseArgs(rest);
  const C = {
    new() {
      const st = settings(load({ soft: true })), mode = opt.mode ?? st.mode;
      if (!MODES.includes(mode)) die(`--mode must be ${MODES.join(', ')}`);
      const raw = stdinJSON(), jobs = Array.isArray(raw) ? raw : raw.jobs;
      if (!Array.isArray(jobs) || !jobs.length) die('stdin must be a JSON list of jobs: [{ "url", "title", "company", ... }]');
      const seen = new Map(latest().map(r => [r.slug, r.status])), slugs = new Set(), items = [], dropped = [];
      for (const j of jobs) {
        if (!j?.url) { dropped.push({ slug: j?.slug ?? null, why: 'no url' }); continue; }
        const slug = safe(j.slug || slugFor(j.url));
        if (slugs.has(slug)) continue;
        slugs.add(slug);
        if (seen.get(slug) === 'applied') { dropped.push({ slug, why: 'already applied' }); continue; }
        const country = String(j.country ?? j.countries?.[0] ?? '').toUpperCase();
        items.push({ slug, title: j.title ?? '', company: j.company ?? '', company_slug: j.company_slug ?? '', url: j.url, source: j.source ?? '', country, fit: j.fit ?? null, status: 'pending', note: '', updated_at: now() });
      }
      // auto: never queue past today's slots
      if (mode === 'auto') items.splice(Math.max(0, st.daily_cap - appliedToday())).forEach(it => dropped.push({ slug: it.slug, why: 'over the daily cap' }));
      if (!items.length) die(`nothing to queue: ${JSON.stringify(dropped)}`);
      const q = { batch: typeof opt.batch === 'string' ? safe(opt.batch) : stamp(), mode, created_at: now(), items };
      save(q);
      writeText(ptr(), q.batch);
      out({ batch: q.batch, mode, queued: items.length, dropped });
    },
    next() {
      const q = loadQ(opt.batch), st = settings(load({ soft: true }));
      for (;;) {
        const it = q.items.find(i => PHASE[q.mode][i.status]);
        if (!it) return out({ done: true, batch: q.batch, counts: counts(q) });
        const phase = PHASE[q.mode][it.status];
        if (SUBMITS.includes(phase)) {
          if (appliedToday() >= st.daily_cap) return out({ done: true, batch: q.batch, reason: `daily cap of ${st.daily_cap} reached`, counts: counts(q) });
          if (appliedTo(it.company_slug) >= st.per_company_30d) { set(q, it, 'skipped', `per-company limit (${st.per_company_30d} in 30 days)`); continue; }
        }
        // pacing between submits
        const gap = Math.min(90, Math.max(20, st.delay_seconds));
        const waited = SUBMITS.includes(phase) && !TEST ? Math.max(0, Math.ceil(gap - (Date.now() - lastApplied()) / 1000)) : 0;
        sleep(waited);
        Object.assign(it, { status: 'working', phase, updated_at: now() });
        save(q);
        const dir = at('prep', it.slug);
        const files = { dir, screenshots: at('screenshots'), uploads: at('screenshots', 'uploads', it.slug) };
        const task_file = writeJSON(join(dir, 'task.json'), { slug: it.slug, batch: q.batch, mode: q.mode, phase, job: { ...it }, files, app_dir: at(), skill_dir: SKILL, ja: JA, created_at: now() });
        return out({ batch: q.batch, mode: q.mode, phase, slug: it.slug, title: it.title, company: it.company, url: it.url, source: it.source, task_file, waited });
      }
    },
    done() {
      const [slug] = args, status = opt.status;
      if (!slug || !DONE.includes(status)) die(`usage: queue done SLUG --status ${DONE.join('|')} [--note N] [--url OFFICIAL_URL] [--source SYSTEM]`);
      const q = loadQ(opt.batch), it = q.items.find(i => i.slug === slug) ?? die(`${slug} is not in batch ${q.batch}`);
      // official posting found via a board
      if (typeof opt.url === 'string') it.url = opt.url;
      if (typeof opt.source === 'string') it.source = opt.source;
      set(q, it, status, opt.note);
      out(`${slug}: ${status}`);
    },
    // copy resume + letter where the browser may read them (MCP output dir)
    stage() {
      const [slug] = args;
      if (!slug) die('usage: queue stage SLUG');
      const pr = load(), dir = at('prep', slug), up = at('screenshots', 'uploads', slug);
      const pdf = existsSync(dir) && readdirSync(dir).find(f => /resume.*\.pdf$/i.test(f));
      const src = pdf ? join(dir, pdf) : pr?.documents?.resume_path;
      if (!src || !existsSync(src)) die(`resume not found: ${src}`);
      mkdirSync(up, { recursive: true });
      const resume = join(up, basename(src));
      copyFileSync(src, resume);
      const lt = join(dir, 'letter.txt');
      const letter = existsSync(lt) ? (copyFileSync(lt, join(up, 'Cover-Letter.txt')), join(up, 'Cover-Letter.txt')) : null;
      out({ resume, letter, screenshots: at('screenshots') });
    },
    show() {
      if (!opt.batch && !current()) return out('no batch yet');
      const q = loadQ(opt.batch);
      out(`batch ${q.batch} (${q.mode}): ${Object.entries(counts(q)).map(([k, v]) => `${k} ${v}`).join(', ')}`);
      q.items.forEach(i => out(`  ${i.status.padEnd(9)} ${String(i.fit ?? '').padStart(3)}  ${i.slug}  ${[i.company, i.title].filter(Boolean).join(' - ')}${i.note ? `  (${i.note})` : ''}`));
    },
    resume() {
      const q = loadQ(opt.batch);
      const hit = q.items.filter(i => i.status === 'working');
      hit.forEach(i => Object.assign(i, { status: i.phase === 'submit' ? 'approved' : 'pending', updated_at: now() }));
      save(q);
      out(`batch ${q.batch}: ${hit.length} interrupted job(s) put back, ${q.items.filter(i => PHASE[q.mode][i.status]).length} to go`);
    },
    list() {
      const d = at('queue');
      if (!existsSync(d)) return out('no batches yet');
      readdirSync(d).filter(f => f.endsWith('.json')).sort().forEach(f => { const q = readJSON(join(d, f)); q && out(`${q.batch}  ${q.mode.padEnd(7)}  ${Object.entries(counts(q)).map(([k, v]) => `${k} ${v}`).join(', ')}`); });
    },
  };
  (C[cmd] ?? (() => out(`queue new [--mode review|auto|dry-run] < jobs.json   start a batch
queue next                        next job + phase, writes prep/<slug>/task.json
queue done SLUG --status S [--note N] [--url U] [--source SYSTEM]   ${DONE.join(', ')}
queue stage SLUG                  copy resume + letter where the browser may upload them
queue show | list | resume        progress, all batches, recover after a crash
(skill: ${SKILL})`)))();
};
