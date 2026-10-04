#!/usr/bin/env node
/* IndexNow: tell Bing, Yandex, Seznam and other IndexNow search engines that the site's pages changed.
 * Free, no account. The key is the 32-character hex file at the site root (<key>.txt, its content = its name),
 * published with the site by tools/publish.sh. Google does not use IndexNow (use Search Console for Google).
 *
 *   node tools/indexnow.js --dry-run            list what would be sent, send nothing
 *   node tools/indexnow.js                      submit every <loc> of the LIVE sitemap (https://apnipathshala.ai/sitemap.xml)
 *   node tools/indexnow.js --local              use the local sitemap.xml instead of the live one
 *   node tools/indexnow.js --only guides/       submit only sitemap URLs whose path starts with guides/
 *
 * Safety: it submits only URLs on apnipathshala.ai that are in the sitemap, checks first that the key file is live,
 * and sends one request (up to 10,000 URLs). Do not run it in a loop: submit only when pages are new or changed.
 * Each run is logged to tools/reports/indexnow.json (gitignored). */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://apnipathshala.ai/';
const HOST = 'apnipathshala.ai';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const LOCAL = argv.includes('--local');
const oi = argv.indexOf('--only');
const ONLY = oi >= 0 ? String(argv[oi + 1] || '') : '';

function findKey() {
  for (const f of fs.readdirSync(ROOT)) {
    const m = /^([0-9a-f]{32})\.txt$/.exec(f);
    if (m && fs.readFileSync(path.join(ROOT, f), 'utf8').trim() === m[1]) return m[1];
  }
  return null;
}
async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'apnipathshala-indexnow/1.0' }, redirect: 'follow' });
  return { status: r.status, text: await r.text() };
}

(async () => {
  const key = findKey();
  if (!key) { console.error('No IndexNow key file (<32 hex>.txt containing its own name) at the site root.'); process.exit(2); }
  const keyLocation = SITE + key + '.txt';

  let xml;
  if (LOCAL) xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  else {
    const r = await get(SITE + 'sitemap.xml');
    if (r.status !== 200) { console.error('Live sitemap returned HTTP ' + r.status); process.exit(1); }
    xml = r.text;
  }
  const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  let urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(m => decode(m[1]));
  urls = [...new Set(urls)].filter(u => { try { return new URL(u).host === HOST; } catch (e) { return false; } });
  if (ONLY) urls = urls.filter(u => u.slice(SITE.length).startsWith(ONLY));
  if (!urls.length) { console.error('No URLs to submit.'); process.exit(1); }
  if (urls.length > 10000) urls = urls.slice(0, 10000);

  console.log(`key ${key} · ${urls.length} URLs from the ${LOCAL ? 'local' : 'live'} sitemap${ONLY ? ' (only ' + ONLY + ')' : ''}`);
  if (DRY) { urls.forEach(u => console.log('  ' + u)); console.log('dry run: nothing sent'); return; }

  /* the search engine fetches the key file to prove we own the host, so it must be live first */
  const k = await get(keyLocation);
  if (k.status !== 200 || k.text.trim() !== key) { console.error(`Key file not live yet: ${keyLocation} → HTTP ${k.status}. Publish it first.`); process.exit(1); }

  const body = { host: HOST, key, keyLocation, urlList: urls };
  const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
  const text = await r.text();
  /* 200 OK, 202 Accepted (key check pending); 400 bad request, 403 key not valid, 422 URLs not on the host, 429 too many requests */
  const meaning = { 200: 'OK: URLs submitted', 202: 'Accepted: received, key validation pending', 400: 'Bad request', 403: 'Forbidden: key not valid (key file not found or wrong)', 422: 'Unprocessable: URLs do not belong to the host or key mismatch', 429: 'Too many requests (do not resend soon)' }[r.status] || '';
  console.log(`IndexNow ${ENDPOINT} → HTTP ${r.status} ${meaning}${text ? ' · ' + text.slice(0, 300) : ''}`);
  const log = path.join(__dirname, 'reports', 'indexnow.json');
  let hist = [];
  try { hist = JSON.parse(fs.readFileSync(log, 'utf8')); } catch (e) { }
  hist.push({ at: new Date().toISOString(), endpoint: ENDPOINT, status: r.status, meaning, response: text.slice(0, 1000), count: urls.length, only: ONLY || null });
  try { fs.mkdirSync(path.dirname(log), { recursive: true }); fs.writeFileSync(log, JSON.stringify(hist, null, 1)); } catch (e) { }
  process.exitCode = r.status === 200 || r.status === 202 ? 0 : 1;
})().catch(e => { console.error(e); process.exit(1); });
