/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// slug for a link, security flags
import { append, at, die, now, out, parseArgs, slugFor } from './common.mjs';

const KINDS = ['injection', 'scam', 'other'];

export default (argv, group) => {
  const { opt, args } = parseArgs(argv);
  if (group === 'slug') {
    if (!args[0]) die('usage: slug URL');
    try { return out(slugFor(args[0])); } catch { die(`not a URL: ${args[0]}`); }
  }
  if (!KINDS.includes(opt.kind)) die(`usage: flag --kind ${KINDS.join('|')} [--slug S] [--url U] [--text "what the page said"]`);
  append(at('security.jsonl'), { at: now(), kind: opt.kind, slug: opt.slug, url: opt.url, text: String(opt.text ?? '').slice(0, 500) });
  out(`flagged ${opt.kind}: ${opt.slug ?? opt.url ?? ''}`);
};
