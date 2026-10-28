#!/usr/bin/env node
/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// job autopilot cli: node ja.mjs <group> <command> ...
const GROUPS = { log: 'log', queue: 'queue', profile: 'profile', run: 'runs', review: 'review', prefs: 'prefs', resume: 'resume', letter: 'letter', answer: 'answer', recipe: 'recipe', doctor: 'doctor', slug: 'misc', flag: 'misc' };
const [g, ...rest] = process.argv.slice(2);

if (!GROUPS[g]) {
  console.log(`job autopilot: node ja.mjs <group> ...
  profile check | path                 validate ~/.job-autopilot/profile.yaml
  queue new | next | done | stage | show | resume | list     the batch being worked on
  log add | status | check | today | company | list | show | stats | csv
  run save | show | answers            what was typed into each form, with sources
  review build | serve | wait | apply | decide       batch review page
  prefs suggest                        patterns in the jobs you skip
  resume check | pdf                   truthful tailoring check, markdown to PDF
  letter check FILE                    cover letter: length, role, notice period, signature
  answer "QUESTION" | --batch          standard screening answers computed from the profile
  recipe [--inline] [--outline]        form-filler call for browser_evaluate
  slug URL                             stable id for a job link
  flag --kind injection|scam|other     record a suspicious page
  doctor                               check the install
Run a group without a command to see its options.`);
  process.exit(g && g !== 'help' ? 1 : 0);
}

const mod = await import(`./lib/${GROUPS[g]}.mjs`);
await mod.default(rest, g);
