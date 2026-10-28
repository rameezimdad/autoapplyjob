/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// install health check
import { existsSync, readFileSync, readlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { INSTALL, at, out } from './common.mjs';
import { check, load } from './profile.mjs';

const MCP_VER = '0.0.83';
const win = process.platform === 'win32';
const has = cli => spawnSync(win ? 'where' : 'which', [cli], { encoding: 'utf8' }).status === 0;

export default async () => {
  const rows = [], row = (s, name, msg) => rows.push([s, name, msg]);
  row(parseInt(process.versions.node) >= 18 ? 'ok' : 'FAIL', 'node', process.version);

  const pkg = join(INSTALL, 'node_modules', '@playwright', 'mcp', 'package.json');
  const v = existsSync(pkg) ? JSON.parse(readFileSync(pkg, 'utf8')).version : null;
  row(v === MCP_VER ? 'ok' : v ? 'warn' : 'FAIL', 'playwright mcp', v ? (v === MCP_VER ? v : `${v}, expected ${MCP_VER}: run setup again`) : 'not installed: run setup');
  row(existsSync(join(INSTALL, 'node_modules', 'yaml')) ? 'ok' : 'FAIL', 'yaml', existsSync(join(INSTALL, 'node_modules', 'yaml')) ? 'installed' : 'not installed: run setup');
  try {
    const exe = createRequire(join(INSTALL, 'package.json'))('playwright').chromium.executablePath();
    row(existsSync(exe) ? 'ok' : 'FAIL', 'chromium', existsSync(exe) ? exe : 'not downloaded: run setup');
  } catch { row('FAIL', 'chromium', 'playwright missing: run setup'); }
  row(existsSync(join(INSTALL, 'recipes', 'fill.js')) ? 'ok' : 'warn', 'fill recipe', existsSync(join(INSTALL, 'recipes', 'fill.js')) ? 'installed' : 'missing: run setup (the agent falls back to the inline recipe)');

  // linux / mac chromium lock = "host-pid" symlink
  let pid = 0, alive = false;
  try { pid = Number(readlinkSync(join(INSTALL, 'browser-profile', 'SingletonLock')).split('-').pop()); } catch {}
  if (pid) try { process.kill(pid, 0); alive = true; } catch {}
  row(alive ? 'FAIL' : 'ok', 'browser profile', alive ? `in use by process ${pid}: close that Chromium window first` : 'free');

  const pr = load({ soft: true });
  if (!pr) row('warn', 'profile', `missing or not valid YAML: ${at('profile.yaml')}`);
  else { const r = check(pr); row(r.ok ? 'ok' : 'warn', 'profile', r.ok ? 'valid' : `${r.errors.length} problem(s): run "ja profile check"`); }

  for (const cli of ['claude', 'codex']) {
    if (!has(cli)) { row('-', cli, 'not installed'); continue; }
    const r = spawnSync(cli, ['mcp', 'get', 'job-browser'], { encoding: 'utf8', timeout: 45000, shell: win });
    const txt = `${r.stdout ?? ''}${r.stderr ?? ''}`;
    row(r.status !== 0 ? 'FAIL' : txt.includes('--init-script') ? 'ok' : 'warn', `${cli}: job-browser`, r.status !== 0 ? 'not registered: run setup' : txt.includes('--init-script') ? 'registered' : 'registered by an older setup: run setup again');
  }
  const skillDirs = [join(homedir(), '.claude', 'skills', 'job-autopilot'), join(homedir(), '.agents', 'skills', 'job-autopilot')].filter(existsSync);
  row(skillDirs.length ? 'ok' : 'warn', 'skill', skillDirs.length ? skillDirs.join(', ') : 'not in ~/.claude/skills or ~/.agents/skills (fine for plugin installs)');

  try {
    const r = await fetch('https://freehire.me/', { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    row(r.status < 500 ? 'ok' : 'warn', 'freehire.me', `HTTP ${r.status}`);
  } catch (e) { row('warn', 'freehire.me', `unreachable: ${e.message}`); }

  rows.forEach(([s, n, m]) => out(`${s.padEnd(5)} ${n.padEnd(20)} ${m}`));
  process.exitCode = rows.some(r => r[0] === 'FAIL') ? 1 : 0;
};
