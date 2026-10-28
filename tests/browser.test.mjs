/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// browser tests: fill recipe on the demo forms, resume pdf, review server
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from './serve.mjs';
import { FILL, JA, home, ja, playwright } from './helpers.mjs';

const PORT = 8799, BASE = `http://127.0.0.1:${PORT}/jobs`;
let srv, browser, T, short, RESUME;

before(async () => {
  srv = await serve({ port: PORT });
  browser = await playwright().chromium.launch();
  T = home({ port: PORT });
  RESUME = ja(T, ['resume', 'pdf', join(T, 'master-resume.md'), join(T, 'Demo-User-Resume.pdf')]).out;
  short = ja(T, ['recipe']).out;
});
after(async () => { await browser?.close(); srv?.close(); });

// page with the filler injected like the MCP --init-script does
async function open(name) {
  const ctx = await browser.newContext();
  await ctx.addInitScript({ path: FILL });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${name}.html`);
  return page;
}
const fill = page => page.evaluate(`(${short})()`);
const fields = r => new Set(r.filled.map(f => f.field));

test('resume pdf renders the master resume', () => {
  assert.ok(existsSync(RESUME));
  assert.equal(readFileSync(RESUME).subarray(0, 5).toString(), '%PDF-');
  assert.ok(statSync(RESUME).size > 5000);
});

test('single-page form: standard fields filled, questions left for the agent, submit works', async () => {
  const page = await open('greenhouse-demo');
  const r = await fill(page);
  for (const f of ['first_name', 'last_name', 'email', 'phone', 'location', 'linkedin', 'portfolio']) assert.ok(fields(r).has(f), `${f} filled`);
  assert.equal(await page.inputValue('#first_name'), 'Demo');
  assert.equal(await page.inputValue('#job_application_location'), 'Lahore, Pakistan');
  const auth = r.remaining.find(x => /authorized to work/i.test(x.label));
  assert.equal(auth?.type, 'select');
  assert.equal(auth.required, true);
  assert.deepEqual(auth.options, ['Please select', 'Yes', 'No']);
  assert.ok(r.remaining.some(x => /AI tool/.test(x.label)), 'AI question reported');
  assert.ok(r.uploads.some(u => /resume/i.test(u.label) && u.required));
  // a second run must not overwrite anything
  assert.equal((await fill(page)).filled.length, 0);
  await page.setInputFiles('#resume', RESUME);
  await page.selectOption('#question_1003', '1');
  await page.selectOption('#question_1004', '1');
  await page.fill('#question_1005', '5');
  await Promise.all([page.waitForURL(/submit\/greenhouse/), page.click('button[type=submit]')]);
  assert.match(await page.textContent('h1'), /Thank you/);
});

test('resume-first form: full name, company and links filled, radio and consent reported', async () => {
  const page = await open('lever-demo');
  const r = await fill(page);
  for (const f of ['full_name', 'email', 'phone', 'location', 'current_company', 'linkedin', 'github', 'portfolio']) assert.ok(fields(r).has(f), `${f} filled`);
  assert.equal(await page.inputValue('#name'), 'Demo User');
  const tz = r.remaining.find(x => x.type === 'radio');
  assert.match(tz.label, /UTC\+1/);
  assert.deepEqual(tz.options, ['Yes', 'No']);
  assert.ok(r.remaining.some(x => x.type === 'checkbox' && /privacy/i.test(x.label) && x.required));
});

test('yes / no button form: buttons reported as a question', async () => {
  const page = await open('ashby-demo');
  const r = await fill(page);
  for (const f of ['full_name', 'email', 'phone', 'location']) assert.ok(fields(r).has(f), `${f} filled`);
  const yn = r.remaining.find(x => x.type === 'yes-no buttons');
  assert.match(yn?.label ?? '', /authorized to work/i);
  await page.click('.yesno button:text("Yes")');
  assert.equal((await fill(page)).remaining.find(x => x.type === 'yes-no buttons'), undefined, 'answered pair disappears');
});

test('multi-step wizard: each step filled and outlined, final submit confirmed', async () => {
  const page = await open('workday-demo');
  await page.click('[data-automation-id=adventureButton]');
  const r1 = await fill(page);
  for (const f of ['first_name', 'last_name', 'city', 'email', 'phone', 'country']) assert.ok(fields(r1).has(f), `${f} filled`);
  assert.equal(await page.inputValue('#wd-country'), 'PK');
  assert.ok(r1.remaining.some(x => /hear about us/i.test(x.label)));
  assert.ok(!r1.remaining.some(x => /authorized/i.test(x.label)), 'hidden steps not reported');
  await page.selectOption('#wd-src', 'Job Board');
  await page.click('#s1 [data-automation-id=bottom-navigation-next-button]');
  const r2 = await page.evaluate(`(${ja(T, ['recipe', '--outline']).out})()`);
  assert.deepEqual(r2.remaining.filter(x => x.type === 'radio').map(x => x.label.replace(/\s*\*$/, '')), ['Are you legally authorized to work in Pakistan?', 'Will you require visa sponsorship?']);
  await page.check('input[name=wd-auth][value=Yes]');
  await page.check('input[name=wd-spon][value=Yes]');
  await page.selectOption('#wd-years', '4-5');
  await page.selectOption('#wd-prev', 'No');
  await page.click('#s2 [data-automation-id=bottom-navigation-next-button]');
  await page.check('#wd-terms');
  await page.click('#s3 [data-automation-id=bottom-navigation-next-button]');
  await page.click('#s4 [data-automation-id=bottom-navigation-next-button]');
  await page.waitForSelector('#s5.on');
  assert.match(await page.textContent('#s5'), /Application Submitted/);
});

test('inline recipe works without the init script', async () => {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${BASE}/greenhouse-demo.html`);
  assert.equal((await page.evaluate(`(${short})()`)).error, 'no-init-script');
  const r = await page.evaluate(`(${ja(T, ['recipe', '--inline']).out})()`);
  assert.ok(fields(r).has('email'));
});

test('review server: token required, decisions saved, server exits', async () => {
  const H = home({ port: PORT, edit: s => s.replace('mode: dry-run', 'mode: review') });
  ja(H, ['queue', 'new', '--batch', 'rv'], JSON.stringify([{ slug: 'a', title: 'Dev', company: 'Demo A', url: `${BASE}/greenhouse-demo.html` }]));
  ja(H, ['queue', 'next']);
  ja(H, ['run', 'save', '--slug', 'a'], JSON.stringify({ answers: [{ question: 'First name', answer: 'Demo', source: 'profile:identity.first_name' }] }));
  ja(H, ['queue', 'done', 'a', '--status', 'prepared']);
  ja(H, ['review', 'build']);
  const child = spawn(process.execPath, [JA, 'review', 'serve', '--port', '4799'], { env: { ...process.env, JOB_AUTOPILOT_HOME: H } });
  const exited = new Promise(r => child.on('exit', r));
  await new Promise(r => child.stdout.on('data', d => /review page/.test(d) && r()));
  const html = await (await fetch('http://127.0.0.1:4799/')).text();
  assert.match(html, /Review applications/);
  const token = html.match(/const TOKEN = '([0-9a-f]{32})'/)?.[1];
  assert.ok(token, 'token injected');
  const body = JSON.stringify({ items: [{ slug: 'a', decision: 'approve', answers: [] }] });
  assert.equal((await fetch('http://127.0.0.1:4799/decisions', { method: 'POST', headers: { 'content-type': 'application/json' }, body })).status, 403);
  assert.equal((await fetch('http://127.0.0.1:4799/decisions', { method: 'POST', headers: { 'content-type': 'application/json', 'x-review-token': token }, body })).status, 200);
  assert.equal(await exited, 0);
  assert.match(ja(H, ['review', 'apply']).out, /approved 1/);
});
