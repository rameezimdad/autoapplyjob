/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// learn from skipped jobs: repeated reasons -> profile suggestions
import { at, jsonl, out, parseArgs } from './common.mjs';

const HINT = {
  'not-my-stack': 'tighten targets.skills or add the stacks you skip to preferences.avoid',
  salary: 'raise targets.min_salary',
  location: 'narrow targets.where or targets.work_mode',
  agency: 'add "staffing and outsourcing agencies" to preferences.avoid',
  seniority: 'adjust targets.seniority',
  company: 'add these companies to targets.exclude_companies',
};

export default argv => {
  const { opt } = parseArgs(argv.slice(1)), days = Number(opt.days) || 90, min = Number(opt.min) || 3;
  if (argv[0] !== 'suggest') return out('prefs suggest [--days 90] [--min 3]   reasons you skip jobs for, and the profile change each suggests');
  const skips = jsonl(at('decisions.jsonl')).filter(d => d.decision === 'skip' && Date.parse(d.at) >= Date.now() - days * 864e5);
  const by = skips.reduce((m, d) => ((m[d.reason ?? 'other'] ??= []).push(d), m), {});
  const tips = Object.entries(by).filter(([, l]) => l.length >= min).map(([reason, l]) => ({
    reason, times: l.length,
    companies: [...new Set(l.map(d => d.company).filter(Boolean))].slice(0, 8),
    notes: [...new Set(l.map(d => d.note).filter(Boolean))].slice(0, 5),
    suggest: HINT[reason] ?? 'add a line to preferences.notes describing what to skip',
  }));
  out(tips.length ? tips : `no pattern yet (${skips.length} skipped in ${days} days)`);
};
