/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// batch review page: build, serve on localhost, apply decisions
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { basename, join } from 'node:path';
import { SKILL, append, at, die, now, out, parseArgs, readJSON, readText, sleep, writeJSON, writeText } from './common.mjs';
import { loadQ, set } from './queue.mjs';
import { find } from './runs.mjs';

export const REASONS = ['not-my-stack', 'salary', 'location', 'agency', 'seniority', 'company', 'other'];
const page = b => at('review', `${b}.html`), dec = b => at('review', `${b}.decisions.json`);
const record = (it, decision, reason, note) => append(at('decisions.jsonl'), { at: now(), slug: it.slug, company: it.company, title: it.title, decision, reason, note });

function approve(q, it, x = {}) {
  const r = find(it.slug);
  if (r && Array.isArray(x.answers)) writeJSON(r.file, { ...r.data, approved_answers: x.answers, approved_at: now() });
  if (typeof x.letter === 'string' && x.letter.trim()) writeText(at('prep', it.slug, 'letter.txt'), x.letter);
  set(q, it, 'approved');
  record(it, 'approve');
}
function skip(q, it, reason = 'other', note) {
  set(q, it, 'skipped', `review: ${reason}${note ? ` - ${note}` : ''}`);
  record(it, 'skip', reason, note);
}

export default argv => {
  const [cmd, ...rest] = argv, { opt, args } = parseArgs(rest);
  const C = {
    build() {
      const q = loadQ(opt.batch), items = q.items.filter(i => ['prepared', 'approved'].includes(i.status));
      if (!items.length) die('no prepared jobs in this batch');
      const data = {
        batch: q.batch, mode: q.mode, built_at: now(), reasons: REASONS,
        items: items.map(i => {
          const r = find(i.slug)?.data ?? {};
          return { slug: i.slug, title: i.title, company: i.company, url: r.url ?? i.url, source: i.source, fit: i.fit, answers: r.approved_answers ?? r.answers ?? [], letter: readText(at('prep', i.slug, 'letter.txt')), shots: (r.screenshots ?? []).map(s => basename(s)) };
        }),
      };
      const html = readFileSync(join(SKILL, 'assets', 'review.html'), 'utf8').replace('/*__REVIEW_DATA__*/null', JSON.stringify(data).replace(/</g, '\\u003c'));
      out({ file: writeText(page(q.batch), html), items: items.length });
    },
    serve() {
      const q = loadQ(opt.batch), f = page(q.batch), port = Number(opt.port) || 4777, token = randomBytes(16).toString('hex');
      if (!existsSync(f)) die('build the page first: review build');
      const shots = at('screenshots');
      const srv = createServer((req, res) => {
        const u = new URL(req.url, 'http://x');
        if (req.method === 'GET' && u.pathname === '/') {
          res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
          return res.end(readFileSync(f, 'utf8').replace('__REVIEW_TOKEN__', token));
        }
        const m = u.pathname.match(/^\/shot\/([\w.-]+\.(png|jpe?g))$/i);
        if (req.method === 'GET' && m && existsSync(join(shots, m[1]))) {
          res.writeHead(200, { 'content-type': m[2].toLowerCase() === 'png' ? 'image/png' : 'image/jpeg' });
          return createReadStream(join(shots, m[1])).pipe(res);
        }
        if (req.method === 'POST' && u.pathname === '/decisions') {
          if (req.headers['x-review-token'] !== token) return res.writeHead(403).end('bad token');
          let body = '';
          req.on('data', c => { body += c; if (body.length > 2e6) req.destroy(); });
          req.on('end', () => {
            try {
              const d = JSON.parse(body);
              if (!Array.isArray(d.items)) throw new Error('items missing');
              writeJSON(dec(q.batch), { ...d, batch: q.batch, saved_at: now() });
              res.writeHead(200, { 'content-type': 'application/json' }).end('{"ok":true}');
              out(`decisions saved: ${dec(q.batch)}`);
              setTimeout(() => process.exit(0), 300);
            } catch (e) { res.writeHead(400).end(e.message); }
          });
          return;
        }
        res.writeHead(404).end('not found');
      });
      srv.on('error', e => die(`review server: ${e.message}`));
      srv.listen(port, '127.0.0.1', () => out(`review page: http://127.0.0.1:${port}/`));
      setTimeout(() => { out('review server timed out'); process.exit(2); }, (Number(opt.timeout) || 7200) * 1000).unref();
    },
    wait() {
      const q = loadQ(opt.batch), f = dec(q.batch), end = Date.now() + (Number(opt.timeout) || 540) * 1000;
      while (!existsSync(f)) {
        if (Date.now() > end) { out('no decisions yet, run "review wait" again'); process.exitCode = 2; return; }
        sleep(2);
      }
      const d = readJSON(f, { items: [] }), yes = d.items.filter(i => i.decision === 'approve').length;
      out(`decisions in: ${yes} approve, ${d.items.length - yes} skip. Next: review apply`);
    },
    apply() {
      const q = loadQ(opt.batch), d = readJSON(dec(q.batch)) ?? die('no decisions saved yet');
      let a = 0, s = 0;
      for (const x of d.items) {
        const it = q.items.find(i => i.slug === x.slug);
        if (!it || it.status !== 'prepared') continue;
        if (x.decision === 'approve') { approve(q, it, x); a++; } else { skip(q, it, x.reason, x.note); s++; }
      }
      out(`approved ${a}, skipped ${s}. Run the queue again to submit the approved jobs.`);
    },
    decide() {
      const [slug, decision] = args;
      if (!slug || !['approve', 'skip'].includes(decision)) die(`usage: review decide SLUG approve|skip [--reason ${REASONS.join('|')}] [--note N]`);
      const q = loadQ(opt.batch), it = q.items.find(i => i.slug === slug) ?? die(`${slug} is not in batch ${q.batch}`);
      if (it.status !== 'prepared') die(`${slug} is ${it.status}, only prepared jobs can be decided`);
      decision === 'approve' ? approve(q, it) : skip(q, it, typeof opt.reason === 'string' ? opt.reason : 'other', typeof opt.note === 'string' ? opt.note : undefined);
      out(`${slug}: ${decision}`);
    },
  };
  (C[cmd] ?? (() => out(`review build                       page with every prepared job
review serve [--port 4777]          serve it on localhost until decisions arrive
review wait [--timeout 540]         block until the user sends decisions
review apply                        approved -> submit phase, skipped -> logged
review decide SLUG approve|skip [--reason R] [--note N]   one decision from chat`)))();
};
