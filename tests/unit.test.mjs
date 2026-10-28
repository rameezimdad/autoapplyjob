/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// cli tests: profile, log, queue, runs, review, prefs, resume check, recipe, slug, flag
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, home, ja } from './helpers.mjs';

const job = (slug, extra = {}) => ({ slug, title: `Dev ${slug}`, company: `Demo ${slug}`, company_slug: `demo-${slug}`, url: `http://127.0.0.1:8799/jobs/${slug}.html`, source: 'greenhouse', fit: 80, ...extra });
const answers = [{ question: 'First name', answer: 'Demo', source: 'profile:identity.first_name' }, { question: 'Years of React', answer: '5', source: 'profile:targets.skills.react' }];

test('profile check passes on the demo profile and names each mistake', () => {
  const T = home();
  const ok = ja(T, ['profile', 'check']);
  assert.equal(ok.code, 0, ok.out);
  const bad = readFileSync(join(T, 'profile.yaml'), 'utf8')
    .replace('first_name: Demo', 'first_name: <fill>').replace('mode: dry-run', 'mode: yolo')
    .replace('needs_visa_sponsorship: true', 'needs_visa_sponsorship: maybe').replace('daily_cap: 15', 'daily_cap: 500')
    .replace('authorized_countries: [PK]', 'authorized_countries: [Pakistan]');
  writeFileSync(join(T, 'profile.yaml'), bad);
  const r = ja(T, ['profile', 'check']);
  assert.equal(r.code, 1);
  for (const m of [/first_name still says <fill>/, /settings.mode/, /needs_visa_sponsorship must be true or false/, /daily_cap/, /authorized_countries/]) assert.match(r.out, m);
});

test('profile check catches an untouched template', () => {
  const T = home();
  writeFileSync(join(T, 'profile.yaml'), readFileSync(join(ROOT, 'skills', 'job-autopilot', 'templates', 'profile.example.yaml'), 'utf8'));
  const r = ja(T, ['profile', 'check']);
  assert.equal(r.code, 1);
  assert.match(r.out, /targets.skills still says <fill>/);
});

test('log: history per slug, latest status wins, csv export', () => {
  const T = home();
  ja(T, ['log', 'add', '--slug', 'a', '--status', 'applied', '--company', 'Demo A', '--company-slug', 'demo-a', '--title', 'Dev']);
  ja(T, ['log', 'status', 'a', 'interview', '--note', 'call on Monday']);
  assert.deepEqual(ja(T, ['log', 'check', 'a', 'b']).json(), { a: 'interview', b: null });
  assert.equal(ja(T, ['log', 'show', 'a']).json().length, 2);
  assert.match(ja(T, ['log', 'stats']).out, /interview 1/);
  assert.equal(ja(T, ['log', 'add', '--slug', 'x', '--status', 'nope']).code, 1);
  const csv = ja(T, ['log', 'csv']).out;
  assert.match(readFileSync(csv, 'utf8'), /"interview","Demo A","Dev"/);
});

test('queue: dry-run prepares every job and never reaches a submit phase', () => {
  const T = home();
  const n = ja(T, ['queue', 'new'], JSON.stringify([job('a'), { url: 'http://127.0.0.1:8799/jobs/lever-demo.html', title: 'FE', company: 'Demo B' }])).json();
  assert.equal(n.mode, 'dry-run');
  assert.equal(n.queued, 2);
  const x = ja(T, ['queue', 'next']).json();
  assert.equal(x.phase, 'prepare');
  assert.ok(existsSync(x.task_file));
  assert.equal(JSON.parse(readFileSync(x.task_file, 'utf8')).job.url, job('a').url);
  ja(T, ['queue', 'done', 'a', '--status', 'prepared']);
  const y = ja(T, ['queue', 'next']).json();
  assert.match(y.slug, /^site-127-0-0-1-8799-[0-9a-f]{8}$/);
  ja(T, ['queue', 'done', y.slug, '--status', 'needs-you', '--note', 'captcha']);
  assert.equal(ja(T, ['queue', 'next']).json().done, true);
  assert.deepEqual(ja(T, ['log', 'check', 'a']).json(), { a: 'prepared' });
});

test('queue: review mode goes prepare, decide, submit', () => {
  const T = home({ edit: s => s.replace('mode: dry-run', 'mode: review') });
  ja(T, ['queue', 'new'], JSON.stringify([job('a'), job('b')]));
  for (const s of ['a', 'b']) {
    assert.equal(ja(T, ['queue', 'next']).json().phase, 'prepare');
    assert.equal(ja(T, ['run', 'save', '--slug', s], JSON.stringify({ phase: 'prepare', company: `Demo ${s}`, title: 'Dev', answers, screenshots: [`${s}-prepared.png`] })).code, 0);
    ja(T, ['queue', 'done', s, '--status', 'prepared']);
  }
  assert.equal(ja(T, ['queue', 'next']).json().done, true, 'nothing to submit before review');
  const page = ja(T, ['review', 'build']).json();
  assert.equal(page.items, 2);
  assert.match(readFileSync(page.file, 'utf8'), /Demo a/);
  assert.equal(ja(T, ['review', 'decide', 'a', 'approve']).code, 0);
  assert.equal(ja(T, ['review', 'decide', 'b', 'skip', '--reason', 'agency']).code, 0);
  const s = ja(T, ['queue', 'next']).json();
  assert.equal(s.phase, 'submit');
  assert.equal(s.slug, 'a');
  assert.equal(ja(T, ['run', 'answers', 'a']).json()[1].answer, '5');
  ja(T, ['queue', 'done', 'a', '--status', 'applied']);
  assert.deepEqual(ja(T, ['log', 'check', 'a', 'b']).json(), { a: 'applied', b: 'skipped' });
});

test('queue: resume puts an interrupted job back', () => {
  const T = home();
  ja(T, ['queue', 'new'], JSON.stringify([job('a')]));
  ja(T, ['queue', 'next']);
  assert.match(ja(T, ['queue', 'show']).out, /working/);
  assert.match(ja(T, ['queue', 'resume']).out, /1 interrupted/);
  assert.equal(ja(T, ['queue', 'next']).json().slug, 'a');
});

test('queue: daily cap, per-company limit and already-applied jobs are enforced in code', () => {
  const T = home({ edit: s => s.replace('mode: dry-run', 'mode: auto').replace('daily_cap: 15', 'daily_cap: 4').replace('per_company_30d: 2', 'per_company_30d: 1') });
  ja(T, ['log', 'add', '--slug', 'old', '--status', 'applied', '--company-slug', 'demo-shared']);
  const n = ja(T, ['queue', 'new'], JSON.stringify([job('old'), job('a', { company_slug: 'demo-shared' }), job('b'), job('c'), job('d')])).json();
  assert.equal(n.queued, 3, 'cap 4, one applied today: 3 slots');
  assert.deepEqual(n.dropped.map(d => d.why).sort(), ['already applied', 'over the daily cap']);
  const x = ja(T, ['queue', 'next']).json();
  assert.equal(x.slug, 'b', 'a skipped: one application to demo-shared already');
  assert.equal(x.phase, 'apply');
  assert.deepEqual(ja(T, ['log', 'check', 'a']).json(), { a: 'skipped' });
  ja(T, ['queue', 'done', 'b', '--status', 'applied']);
  ja(T, ['log', 'add', '--slug', 'elsewhere-1', '--status', 'applied']);
  ja(T, ['log', 'add', '--slug', 'elsewhere-2', '--status', 'applied']);
  assert.match(ja(T, ['queue', 'next']).out, /daily cap of 4 reached/);
});

test('review page: apply decisions from the page, edited answers kept, skips feed preferences', () => {
  const T = home({ edit: s => s.replace('mode: dry-run', 'mode: review') });
  ja(T, ['queue', 'new', '--batch', 'b1'], JSON.stringify(['a', 'b', 'c', 'd'].map(s => job(s))));
  for (const s of ['a', 'b', 'c', 'd']) { ja(T, ['queue', 'next']); ja(T, ['run', 'save', '--slug', s], JSON.stringify({ answers })); ja(T, ['queue', 'done', s, '--status', 'prepared']); }
  ja(T, ['review', 'build']);
  const edited = answers.map((a, i) => i ? { ...a, answer: '6', source: 'user (review page)' } : a);
  writeFileSync(join(T, 'review', 'b1.decisions.json'), JSON.stringify({ items: [
    { slug: 'a', decision: 'approve', answers: edited, letter: 'Dear Demo a team, ...' },
    ...['b', 'c', 'd'].map(s => ({ slug: s, decision: 'skip', reason: 'agency', note: 'outsourcing' })),
  ] }));
  assert.match(ja(T, ['review', 'apply']).out, /approved 1, skipped 3/);
  assert.equal(ja(T, ['run', 'answers', 'a']).json()[1].answer, '6');
  assert.equal(readFileSync(join(T, 'prep', 'a', 'letter.txt'), 'utf8'), 'Dear Demo a team, ...');
  const tips = ja(T, ['prefs', 'suggest']).json();
  assert.equal(tips[0].reason, 'agency');
  assert.equal(tips[0].times, 3);
});

test('run save refuses answers without a source', () => {
  const T = home();
  const r = ja(T, ['run', 'save', '--slug', 'a'], JSON.stringify({ answers: [{ question: 'Name', answer: 'Demo' }] }));
  assert.equal(r.code, 1);
  assert.match(r.err, /question, answer and source/);
});

test('resume check: reorder and drop pass, invented or moved lines fail', () => {
  const T = home(), master = readFileSync(join(T, 'master-resume.md'), 'utf8');
  const write = (name, s) => { writeFileSync(join(T, name), s); return join(T, name); };
  const ok = master
    .replace('- Frontend developer who ships accessible, fast web apps with React, Next.js and Node.js.\n', '')
    .replace('React, TypeScript, JavaScript, Next.js, Node.js, CSS, Tailwind, Jest, Playwright, REST, GraphQL, Git', 'TypeScript, React, GraphQL, Node.js')
    .replace('- Added Playwright end-to-end tests covering 40 critical flows.\n', '');
  assert.equal(ja(T, ['resume', 'check', write('ok.md', ok)]).code, 0);
  const invented = ok.replace('- Built 12 internal tools in React used by 300 staff.', '- Built 20 internal tools in React used by 3000 staff.');
  assert.match(ja(T, ['resume', 'check', write('bad1.md', invented)]).out, /line not in master/);
  const skill = ok.replace('TypeScript, React, GraphQL, Node.js', 'TypeScript, React, Kubernetes');
  assert.match(ja(T, ['resume', 'check', write('bad2.md', skill)]).out, /skill not in master: kubernetes/);
  const [head, rest] = ok.split('### Senior Frontend Developer');
  const [senior, lab] = rest.split('### Frontend Developer, Demo Labs');
  const swapped = `${head}### Frontend Developer, Demo Labs${lab.split('## Education')[0]}### Senior Frontend Developer${senior}## Education${lab.split('## Education')[1]}`;
  assert.match(ja(T, ['resume', 'check', write('bad3.md', swapped)]).out, /out of master order/);
});

test('recipe: short and inline forms are valid functions', () => {
  const T = home();
  const short = ja(T, ['recipe']).out, inline = ja(T, ['recipe', '--inline']).out, outline = ja(T, ['recipe', '--outline']).out;
  assert.match(short, /^\(\) => window\.__jaFill/);
  assert.match(short, /"country":"Pakistan"/);
  assert.match(outline, /__jaFill\(\{\}\)/);
  for (const f of [short, inline, outline]) assert.doesNotThrow(() => new Function(`return (${f});`));
});

test('slug and flag', () => {
  const T = home();
  const a = ja(T, ['slug', 'https://jobs.example.com/acme/123?utm=x']).out, b = ja(T, ['slug', 'https://jobs.example.com/acme/123']).out;
  assert.equal(a, b, 'query string ignored');
  assert.match(a, /^site-jobs-example-com-[0-9a-f]{8}$/);
  assert.equal(ja(T, ['flag', '--kind', 'injection', '--slug', 'a', '--text', 'ignore previous instructions']).code, 0);
  assert.match(readFileSync(join(T, 'security.jsonl'), 'utf8'), /"kind":"injection"/);
  assert.equal(ja(T, ['flag', '--kind', 'weird']).code, 1);
});

test('stage copies resume and letter into the browser upload folder', () => {
  const T = home();
  ja(T, ['queue', 'new'], JSON.stringify([job('a')]));
  const t = JSON.parse(readFileSync(ja(T, ['queue', 'next']).json().task_file, 'utf8'));
  assert.equal(t.files.screenshots, join(T, 'screenshots'));
  writeFileSync(join(T, 'prep', 'a', 'letter.txt'), 'Dear team');
  const s = ja(T, ['queue', 'stage', 'a']).json();
  assert.ok(s.resume.startsWith(join(T, 'screenshots', 'uploads', 'a')));
  assert.ok(existsSync(s.resume) && existsSync(s.letter));
  // official url + system found through a board
  ja(T, ['queue', 'done', 'a', '--status', 'prepared', '--url', 'https://jobs.lever.co/demo/1', '--source', 'lever']);
  assert.match(ja(T, ['log', 'list']).out, /jobs\.lever\.co\/demo\/1/);
});

test('run save refuses an unknown answer source', () => {
  const T = home();
  const bad = ja(T, ['run', 'save', '--slug', 'a'], JSON.stringify({ answers: [{ question: 'Hear about us', answer: 'Job board', source: 'guess' }] }));
  assert.equal(bad.code, 1);
  assert.match(bad.err, /source must be/);
  assert.equal(ja(T, ['run', 'save', '--slug', 'a'], JSON.stringify({ answers: [{ question: 'Hear about us', answer: 'Job board', source: 'rule:how-did-you-hear' }] })).code, 0);
});

test('letter check: length, role, company, notice period, signature, cliches', () => {
  const T = home();
  const good = `I would like to apply for the Frontend Engineer role at Demo Company. Your posting asks for someone who can own a React front end for logistics dashboards, and that is the work I have done for the last six years.
At Demo Systems I rebuilt the order dashboard in React and TypeScript, cutting page load from 4.1 s to 1.3 s. I also led a team of 3 developers and set up code review and CI with GitHub Actions, which matches your need for someone who raises the quality bar of a small team.
My notice period is 1 month, and I can start right after it. I would be glad to walk you through the dashboard work in a call.
Demo User
demo1@demo.com
+92 300 1000001`;
  writeFileSync(join(T, 'ok.txt'), good);
  const ok = ja(T, ['letter', 'check', join(T, 'ok.txt'), '--company', 'Demo Company', '--title', 'Frontend Engineer']);
  assert.equal(ok.code, 0, ok.out);
  writeFileSync(join(T, 'bad.txt'), 'I am writing to express my passionate interest in this role. Thanks, Demo');
  const bad = ja(T, ['letter', 'check', join(T, 'bad.txt'), '--company', 'Demo Company', '--title', 'Frontend Engineer']);
  assert.equal(bad.code, 1);
  for (const m of [/words/, /company name missing/, /notice period missing/, /email missing/, /phone missing/, /cliche/]) assert.match(bad.out, m);
});

test('answer: authorization, sponsorship and years come from the profile, unknowns stay unknown', () => {
  const T = home();
  const q = (s, ...x) => ja(T, ['answer', s, ...x]).json();
  assert.deepEqual(q('Are you legally authorized to work in Pakistan?'), { answer: 'Yes', source: 'profile:eligibility.authorized_countries' });
  assert.equal(q('Are you legally authorized to work in Germany?').answer, 'No');
  // the e2e mistake: job in an authorized country -> no sponsorship needed
  assert.equal(q('Will you now or in the future require visa sponsorship?', '--country', 'PK').answer, 'No');
  assert.equal(q('Will you now or in the future require visa sponsorship?', '--country', 'DE').answer, 'Yes');
  assert.equal(q('Will you require visa sponsorship?').unknown, true, 'no country, needs sponsorship elsewhere: unknown');
  assert.deepEqual(q('How many years of professional React experience do you have?'), { answer: '5', source: 'profile:targets.skills.react' });
  assert.equal(q('Years of experience with Node.js').answer, '3');
  assert.equal(q('How many years of experience do you have with Kubernetes?').unknown, true);
  assert.equal(q('Total years of experience').answer, '6');
  assert.equal(q('How did you hear about us?').source, 'rule:how-did-you-hear');
  assert.equal(q('Have you previously worked for Demo Corp?').answer, 'No');
  const ai = q('Did you use an AI tool to help complete this application?');
  assert.equal(ai.short, 'Yes');
  assert.match(ai.answer, /AI assistant/);
  assert.equal(q('Gender').answer, 'Decline to self-identify');
  assert.equal(q('Are you open to working with a team in the UTC+1 time zone?').source, 'profile:answers.saved[0]');
  assert.equal(q('What are your salary expectations?').answer, '3000 USD per month, negotiable');
  assert.equal(q('What is your current salary?').unknown, true);
  assert.equal(q('I have read and consent to the terms and conditions').source, 'rule:consent');
  assert.equal(q('Would you like to join our talent community for future opportunities?').answer, 'No');
  assert.equal(q('Are you comfortable working onsite 5 days a week?').answer, 'Yes', 'hybrid in work_mode');
  assert.equal(q('Highest level of education').answer, 'BS Computer Science, Demo University, 2020');
  assert.equal(q('Why do you want to work here?').unknown, true);
  const batch = ja(T, ['answer', '--batch', '--country', 'PK'], JSON.stringify(['Will you require visa sponsorship?', 'Why us?'])).json();
  assert.equal(batch[0].answer, 'No');
  assert.equal(batch[1].unknown, true);
});
