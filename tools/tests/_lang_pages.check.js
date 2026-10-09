#!/usr/bin/env node
/* Smoke test for the language pages (tools/build_lang_pages.js): for every language, the home page and 3 apps load over
 * HTTP with no page errors, open in that language (EDU.lang, <html lang>), keep RTL for Urdu, and the header title is
 * in that language's script.   node tools/tests/_lang_pages.check.js */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('../node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..', '..');
const CHROME = require('../chrome-path')();
const LANGS = ['hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur'];
const APPS = ['gst-calculator', 'live-quiz', 'python-playground'];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
(async () => {
  await new Promise(res => srv.listen(0, res));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const errors = []; let ok = 0;
  for (const l of LANGS) for (const page of ['', ...APPS.map(a => `apps/${a}/`)]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    pg.on('requestfailed', q => { if (q.url().startsWith(base)) errs.push('failed ' + q.url()); });
    pg.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    await pg.goto(base + l + '/' + page, { waitUntil: 'load' }); await pg.waitForTimeout(600);
    const s = await pg.evaluate(() => ({ lang: window.EDU && EDU.lang, html: document.documentElement.lang, dir: document.documentElement.dir,
      h: ((document.getElementById('edu-title') || {}).textContent || (document.getElementById('home-title') || {}).textContent || '').trim(),
      sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    const where = `${l}/${page}`;
    if (s.lang !== l || s.html !== l) errs.push(`language ${s.lang}/${s.html}`);
    if (l === 'ur' && s.dir !== 'rtl') errs.push('not RTL');
    if (!s.h || /^[\x00-\x7F]*$/.test(s.h)) errs.push(`title not localized: "${s.h}"`);
    if (s.sw > s.cw + 1) errs.push('sideways scroll');
    if (errs.length) errors.push(where + ': ' + errs.slice(0, 3).join(' | ')); else ok++;
    await ctx.close();
  }
  await browser.close(); srv.close();
  errors.forEach(e => console.log('error  ' + e));
  console.log(`=== language pages: ${errors.length ? 'FAIL' : 'PASS'} (${ok} ok, ${errors.length} errors) ===`);
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
