/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// test helpers: throwaway data home with the demo profile, cli runner
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const JA = join(ROOT, 'skills', 'job-autopilot', 'scripts', 'ja.mjs');
export const FIX = join(ROOT, 'tests', 'fixtures');
export const FILL = join(ROOT, 'skills', 'job-autopilot', 'scripts', 'recipes', 'fill.js');

export function home({ port = 8799, edit = s => s } = {}) {
  const T = mkdtempSync(join(tmpdir(), 'ja-test-'));
  writeFileSync(join(T, 'Demo-User-Resume.pdf'), '%PDF-1.4\n% demo resume placeholder\n');
  copyFileSync(join(FIX, 'master-resume.test.md'), join(T, 'master-resume.md'));
  const yaml = readFileSync(join(FIX, 'profile.test.yaml'), 'utf8').replaceAll('__TMP__', T).replaceAll('__PORT__', String(port));
  writeFileSync(join(T, 'profile.yaml'), edit(yaml));
  return T;
}

export function ja(T, args, input) {
  const r = spawnSync(process.execPath, [JA, ...args], { input, encoding: 'utf8', env: { ...process.env, JOB_AUTOPILOT_HOME: T, JOB_AUTOPILOT_TEST: '1' } });
  return { code: r.status, out: (r.stdout ?? '').trim(), err: (r.stderr ?? '').trim(), json: () => JSON.parse(r.stdout) };
}

// playwright from the install dir (setup) or the repo
export function playwright() {
  for (const base of [join(homedir(), '.job-autopilot'), ROOT]) {
    try { return createRequire(join(base, 'package.json'))('playwright'); } catch {}
  }
  throw new Error('playwright not found: run skills/job-autopilot/scripts/setup.sh --no-browser first');
}
