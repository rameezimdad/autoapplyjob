/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// audit trail: every answer typed, with where it came from
import { existsSync, readdirSync } from 'node:fs';
import { basename, isAbsolute, join } from 'node:path';
import { at, day, die, now, out, parseArgs, readJSON, safe, stdinJSON, writeJSON } from './common.mjs';

// where an answer may come from
export const SOURCE = /^(profile:[\w.[\]-]+|rule:[\w-]+|approved|user|letter|resume|user \(review page\))$/;

export function find(slug) {
  const root = at('runs');
  if (!existsSync(root)) return null;
  for (const d of readdirSync(root).sort().reverse()) {
    const f = join(root, d, `${safe(slug)}.json`);
    if (existsSync(f)) return { file: f, data: readJSON(f) ?? {} };
  }
  return null;
}

export default argv => {
  const [cmd, ...rest] = argv, { opt, args } = parseArgs(rest), slug = typeof opt.slug === 'string' ? opt.slug : args[0];
  const C = {
    save() {
      const d = stdinJSON();
      if (!Array.isArray(d.answers)) die('"answers" must be a list of { question, answer, source }');
      const bad = d.answers.filter(a => !a?.question || a.answer === undefined || a.answer === null || !a.source);
      if (bad.length) die(`every answer needs question, answer and source: ${JSON.stringify(bad.slice(0, 3))}`);
      const wrong = d.answers.filter(a => !SOURCE.test(a.source));
      if (wrong.length) die(`source must be profile:<key>, rule:<topic>, approved, user, letter or resume: ${JSON.stringify(wrong.slice(0, 3).map(a => a.source))}`);
      // bare file names -> the staged upload path
      for (const k of ['resume_file', 'letter_file']) {
        const f = d[k], staged = f && !isAbsolute(f) && at('screenshots', 'uploads', slug, basename(f));
        if (staged && existsSync(staged)) d[k] = staged;
      }
      const prev = find(slug), p = prev?.data ?? {};
      const rec = { ...p, ...d, slug, created_at: p.created_at ?? now(), updated_at: now(), history: [...(p.history ?? []), ...(prev ? [{ at: p.updated_at, phase: p.phase, outcome: p.outcome }] : [])] };
      out(writeJSON(prev?.file ?? at('runs', day(), `${safe(slug)}.json`), rec));
    },
    show() {
      const d = (find(slug) ?? die(`no run saved for ${slug}`)).data;
      if (opt.json) return out(d);
      out(`${d.company ?? ''} - ${d.title ?? ''}  [${[d.phase, d.outcome].filter(Boolean).join(', ')}]  ${d.url ?? ''}`);
      out(`resume: ${d.resume_file ?? '-'}   letter: ${d.letter_file ?? '-'}   saved: ${d.updated_at}`);
      (d.approved_answers ?? d.answers ?? []).forEach(a => out(`  Q: ${a.question}\n  A: ${a.answer}   (from ${a.source})`));
      (d.screenshots ?? []).forEach(s => out(`  screenshot: ${s}`));
    },
    answers() { const d = (find(slug) ?? die(`no run saved for ${slug}`)).data; out(d.approved_answers ?? d.answers ?? []); },
  };
  if (C[cmd] && !slug) die(`run ${cmd} needs a slug`);
  (C[cmd] ?? (() => out('run save --slug S < run.json   save what was typed (merges, keeps history)\nrun show SLUG [--json]         answers + sources\nrun answers SLUG               answers to reuse (approved ones first)')))();
};
