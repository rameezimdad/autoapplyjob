#!/usr/bin/env node
/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// records docs/assets/demo.gif on the demo forms: fast fill, questions, review page
// needs ffmpeg. usage: node tests/demo.mjs
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from './serve.mjs';
import { FILL, JA, ROOT, home, ja, playwright } from './helpers.mjs';

const PORT = 8798, BASE = `http://127.0.0.1:${PORT}/jobs`;
const T = home({ port: PORT, edit: s => s.replace('mode: dry-run', 'mode: review') });
const vid = join(T, 'video'), out = join(ROOT, 'docs', 'assets', 'demo.gif');
const srv = await serve({ port: PORT });
const browser = await playwright().chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1000, height: 640 }, recordVideo: { dir: vid, size: { width: 1000, height: 640 } } });
await ctx.addInitScript({ path: FILL });
const page = await ctx.newPage();
const pause = ms => page.waitForTimeout(ms);
const resume = ja(T, ['resume', 'pdf', join(T, 'master-resume.md'), join(T, 'Demo-User-Resume.pdf')]).out;

// 1. empty form, then one fast-fill call
await page.goto(`${BASE}/greenhouse-demo.html`);
await pause(900);
await page.locator('#application_form').scrollIntoViewIfNeeded();
await pause(700);
await page.evaluate(`(${ja(T, ['recipe']).out})()`);
await pause(1200);
// 2. questions answered from the profile, resume attached
await page.setInputFiles('#resume', resume);
for (const [sel, v] of [['#question_1003', '1'], ['#question_1004', '1'], ['#question_1006', 'Yes'], ['#gender', 'Decline to self-identify']]) { await page.selectOption(sel, v); await pause(350); }
await page.fill('#question_1005', '5');
await page.locator('#gender').scrollIntoViewIfNeeded();
await pause(1200);

// 3. review page with this job prepared
mkdirSync(join(T, 'screenshots'), { recursive: true });
await page.screenshot({ path: join(T, 'screenshots', 'demo-prepared.png'), fullPage: true });
ja(T, ['queue', 'new', '--batch', 'demo'], JSON.stringify([{ slug: 'demo', title: 'Frontend Engineer', company: 'Demo Company', url: `${BASE}/greenhouse-demo.html`, source: 'greenhouse', fit: 88 }]));
ja(T, ['queue', 'next']);
ja(T, ['run', 'save', '--slug', 'demo'], JSON.stringify({ screenshots: ['demo-prepared.png'], answers: [
  { question: 'First name', answer: 'Demo', source: 'profile:identity.first_name' },
  { question: 'Are you legally authorized to work in Pakistan?', answer: 'Yes', source: 'profile:eligibility.authorized_countries' },
  { question: 'Will you require visa sponsorship?', answer: 'Yes', source: 'profile:eligibility.needs_visa_sponsorship' },
  { question: 'Years of professional React experience', answer: '5', source: 'profile:targets.skills.react' },
  { question: 'Did you use an AI tool?', answer: 'Yes', source: 'profile:answers.ai_assistance_disclosure' },
] }));
ja(T, ['queue', 'done', 'demo', '--status', 'prepared']);
ja(T, ['review', 'build']);
const rv = spawn(process.execPath, [JA, 'review', 'serve', '--port', '4798'], { env: { ...process.env, JOB_AUTOPILOT_HOME: T } });
await new Promise(r => rv.stdout.on('data', d => /review page/.test(d) && r()));
await page.goto('http://127.0.0.1:4798/');
await pause(1500);
await page.click('[data-d=approve]');
await pause(900);
await page.click('#send');
await pause(1600);

await ctx.close();
await browser.close();
srv.close();
rv.kill();
const webm = join(vid, readdirSync(vid).find(f => f.endsWith('.webm')));
copyFileSync(webm, join(T, 'demo.webm'));
const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-vf', 'fps=8,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', '-loop', '0', out], { stdio: 'inherit' });
rmSync(T, { recursive: true, force: true });
if (ff.status) process.exit(ff.status);
console.log(out);
