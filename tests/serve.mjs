#!/usr/bin/env node
/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// demo application forms on localhost, every request logged
// usage: node tests/serve.mjs [--port 8787] [--hits hits.jsonl]
import { createServer } from 'node:http';
import { appendFileSync, createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'site');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };
const send = (res, f, code = 200) => { res.writeHead(code, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' }); createReadStream(f).pipe(res); };

export function serve({ port = 8787, hits } = {}) {
  const server = createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (hits) appendFileSync(hits, JSON.stringify({ at: new Date().toISOString(), method: req.method, path: u.pathname, query: u.search }) + '\n');
    // submits + the injection trap all land on the thank-you page
    if (req.method === 'POST' || u.pathname.startsWith('/collect')) { req.resume(); req.on('end', () => send(res, join(ROOT, 'thanks.html'))); return; }
    const f = normalize(join(ROOT, u.pathname === '/' ? 'index.html' : u.pathname));
    if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404).end('not found'); return; }
    send(res, f);
  });
  return new Promise((ok, fail) => { server.on('error', fail); server.listen(port, '127.0.0.1', () => ok(server)); });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
  const port = Number(arg('--port')) || 8787;
  serve({ port, hits: arg('--hits') }).then(() => console.log(`demo forms: http://127.0.0.1:${port}/`));
}
