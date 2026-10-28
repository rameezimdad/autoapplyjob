/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// tailored resume: prove every line comes from the master, render markdown to pdf
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { die, need, out, parseArgs } from './common.mjs';
import { get, load, settings } from './profile.mjs';

const N = s => s.toLowerCase().replace(/\*\*/g, '').replace(/^[-*]\s+/, '').replace(/\s+/g, ' ').trim();
const split = s => N(s).split(/[,;|·•:]/).map(x => x.trim()).filter(Boolean);
// drop html comments, keep line numbers
const strip = md => md.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ''));

export function parse(md) {
  const doc = { header: [], sections: [] };
  let sec = null, ent = null;
  strip(md).split(/\r?\n/).forEach((raw, i) => {
    const l = raw.trim(), line = i + 1;
    if (!l) return;
    if (/^##\s/.test(l)) { sec = { title: l.replace(/^##\s+/, ''), entries: [], lines: [], line }; ent = null; doc.sections.push(sec); return; }
    if (!sec) return void doc.header.push({ text: l, line });
    if (/^###\s/.test(l)) { ent = { title: l.replace(/^###\s+/, ''), lines: [], line }; sec.entries.push(ent); return; }
    (ent ?? sec).lines.push({ text: l, line });
  });
  return doc;
}

// rules: same header, known sections, entries in master order, lines copied verbatim, skills a subset
export function verify(master, tailored) {
  const M = parse(master), T = parse(tailored), errs = [], err = (line, msg) => errs.push({ line, msg });
  const head = new Set(M.header.map(h => N(h.text)));
  T.header.forEach(h => head.has(N(h.text)) || err(h.line, `header line not in master: ${h.text}`));
  for (const ts of T.sections) {
    const ms = M.sections.find(s => N(s.title) === N(ts.title));
    if (!ms) { err(ts.line, `section not in master: ${ts.title}`); continue; }
    if (/skill/i.test(ts.title)) {
      const have = new Set([...ms.lines, ...ms.entries.flatMap(e => [{ text: e.title }, ...e.lines])].flatMap(l => split(l.text)));
      [...ts.lines, ...ts.entries.flatMap(e => e.lines)].forEach(l => split(l.text).forEach(t => have.has(t) || err(l.line, `skill not in master: ${t}`)));
      continue;
    }
    const lines = new Set(ms.lines.map(l => N(l.text)));
    ts.lines.forEach(l => lines.has(N(l.text)) || err(l.line, `line not in master "${ts.title}": ${l.text}`));
    let last = -1;
    for (const te of ts.entries) {
      const idx = ms.entries.findIndex(e => N(e.title) === N(te.title));
      if (idx < 0) { err(te.line, `entry not in master: ${te.title}`); continue; }
      if (idx < last) err(te.line, `entry moved out of master order: ${te.title}`);
      last = Math.max(last, idx);
      const ok = new Set(ms.entries[idx].lines.map(l => N(l.text)));
      te.lines.forEach(l => ok.has(N(l.text)) || err(l.line, `line not in master "${te.title}": ${l.text}`));
    }
  }
  return errs;
}

const CSS = `body{font:10.5pt/1.4 Arial,Helvetica,"Liberation Sans",sans-serif;color:#000;margin:0}
h1{font-size:20pt;margin:0 0 2pt}h1+p{margin:0 0 8pt;color:#222}
h2{font-size:11pt;text-transform:uppercase;letter-spacing:.06em;border-bottom:.6pt solid #000;padding-bottom:2pt;margin:12pt 0 6pt}
h3{font-size:10.5pt;margin:8pt 0 3pt}ul{margin:0 0 4pt 14pt;padding:0}li{margin:0 0 2pt}p{margin:0 0 4pt}a{color:#000;text-decoration:none}`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');

export function html(md) {
  const o = [];
  let list = false;
  const close = () => { if (list) { o.push('</ul>'); list = false; } };
  for (const raw of strip(md).split(/\r?\n/)) {
    const l = raw.trim(), h = l.match(/^(#{1,3})\s+(.*)$/);
    if (!l) { close(); continue; }
    if (h) { close(); o.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    if (/^[-*]\s+/.test(l)) { if (!list) { o.push('<ul>'); list = true; } o.push(`<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`); continue; }
    close();
    o.push(`<p>${inline(l)}</p>`);
  }
  close();
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${o.join('\n')}</body></html>`;
}

export async function pdf(md, file, paper = 'A4') {
  const { chromium } = need('playwright'), b = await chromium.launch();
  try {
    const p = await b.newPage();
    await p.setContent(html(md), { waitUntil: 'load' });
    mkdirSync(dirname(resolve(file)), { recursive: true });
    await p.pdf({ path: file, format: paper, printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '16mm', right: '16mm' } });
  } finally { await b.close(); }
  return resolve(file);
}

export default async argv => {
  const [cmd, ...rest] = argv, { opt, args } = parseArgs(rest);
  if (cmd === 'check') {
    const master = typeof opt.master === 'string' ? opt.master : get(load({ soft: true }) ?? {}, 'documents.master_resume_path');
    if (!master || !existsSync(master)) die('no master resume: set documents.master_resume_path or pass --master FILE');
    if (!args[0] || !existsSync(args[0])) die('usage: resume check TAILORED.md [--master FILE]');
    const errs = verify(readFileSync(master, 'utf8'), readFileSync(args[0], 'utf8'));
    out(errs.length ? errs.map(e => `line ${e.line}: ${e.msg}`).join('\n') : 'resume OK: every line comes from the master resume');
    process.exitCode = errs.length ? 1 : 0;
    return;
  }
  if (cmd === 'pdf') {
    const [src, dst] = args;
    if (!src || !dst || !existsSync(src)) die('usage: resume pdf IN.md OUT.pdf [--paper A4|Letter]');
    out(await pdf(readFileSync(src, 'utf8'), dst, typeof opt.paper === 'string' ? opt.paper : settings(load({ soft: true })).paper));
    return;
  }
  out('resume check TAILORED.md [--master FILE]   every line must come from the master resume\nresume pdf IN.md OUT.pdf [--paper A4|Letter]  render markdown to an ATS-friendly PDF');
};
