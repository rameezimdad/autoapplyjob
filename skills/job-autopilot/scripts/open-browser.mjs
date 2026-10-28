#!/usr/bin/env node
/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// opens the autopilot chromium on the same profile the agent uses, so the user can sign in to sites
// usage: node open-browser.mjs [url...]   (no url = welcome page)
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP = process.env.JOB_AUTOPILOT_HOME || join(homedir(), '.job-autopilot');
const welcome = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'welcome.html')).href;
const urls = process.argv.slice(2).length ? process.argv.slice(2) : [welcome];

let chromium;
try { ({ chromium } = createRequire(join(APP, 'package.json'))('playwright')); }
catch { console.error(`Playwright is not installed in ${APP}. Run scripts/setup.sh first.`); process.exit(1); }

try {
  const ctx = await chromium.launchPersistentContext(join(APP, 'browser-profile'), { headless: false, viewport: null });
  ctx.on('close', () => process.exit(0)); // window closed = done
  const [first] = ctx.pages();
  await (first ?? await ctx.newPage()).goto(urls[0]);
  for (const u of urls.slice(1)) await (await ctx.newPage()).goto(u);
} catch (e) {
  console.error(e.message);
  if (/ProcessSingleton|in use|lock/i.test(e.message)) console.error('The browser profile is already open. Close the other Chromium window first.');
  else if (process.platform === 'linux') console.error(`Missing system libraries? Run: sudo "${join(APP, 'node_modules/.bin/playwright')}" install-deps chromium`);
  process.exit(1);
}
