/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// shared paths + small helpers
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const INSTALL = join(homedir(), '.job-autopilot');
export const APP = resolve(process.env.JOB_AUTOPILOT_HOME || INSTALL);
export const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const at = (...a) => join(APP, ...a);
export const JA = `node "${join(SKILL, 'scripts', 'ja.mjs')}"`;
export const TEST = process.env.JOB_AUTOPILOT_TEST === '1';

export const out = v => console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2));
export const die = (m, code = 1) => { console.error(m); process.exit(code); };
export const now = () => new Date().toISOString();
export const day = (d = Date.now()) => new Date(d).toLocaleDateString('en-CA'); // local YYYY-MM-DD
export const sleep = s => s > 0 && Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, s * 1000);
export const safe = s => String(s).replace(/[^a-z0-9._-]+/gi, '-').slice(0, 120);

// --key value, --flag, bare args
export function parseArgs(argv) {
  const opt = {}, args = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { args.push(a); continue; }
    const nx = argv[i + 1];
    opt[a.slice(2)] = nx === undefined || nx.startsWith('--') ? true : (i++, nx);
  }
  return { opt, args };
}

export const readText = (f, fb = '') => existsSync(f) ? readFileSync(f, 'utf8') : fb;
export const readJSON = (f, fb = null) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return fb; } };
export const writeText = (f, s) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); return f; };
export const writeJSON = (f, v) => writeText(f, JSON.stringify(v, null, 2) + '\n');
export const append = (f, v) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, JSON.stringify(v) + '\n', { flag: 'a' }); return v; };
export const jsonl = f => readText(f).split('\n').filter(Boolean).flatMap(l => { try { return [JSON.parse(l)]; } catch { return []; } });

export function stdinJSON() {
  let t = '';
  try { t = readFileSync(0, 'utf8').trim(); } catch {}
  if (!t) die('expected JSON on stdin');
  try { return JSON.parse(t); } catch (e) { die(`bad JSON on stdin: ${e.message}`); }
}

// deps live in the install dir (setup) or the repo (tests)
export function need(name) {
  for (const base of [APP, INSTALL, resolve(SKILL, '..', '..')]) {
    try { return createRequire(join(base, 'package.json'))(name); } catch {}
  }
  die(`${name} is not installed. Run the setup script first (scripts/setup.sh or scripts/setup.ps1).`);
}

export function slugFor(url) {
  const u = new URL(url);
  return `site-${u.host.replace(/[^a-z0-9]+/gi, '-')}-${createHash('sha1').update(u.host + u.pathname).digest('hex').slice(0, 8)}`.toLowerCase();
}
