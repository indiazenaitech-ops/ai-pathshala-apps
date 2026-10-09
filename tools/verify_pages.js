#!/usr/bin/env node
/* Verify an extra site page (not an app, not the home page), e.g. schools.html.
 *   node tools/verify_pages.js schools            -> schools.html with window.SCHOOLS_STRINGS
 *   node tools/verify_pages.js <name> <STRINGS_GLOBAL> <strings-file>
 * Same checks as tools/verify.js home: string table (12 languages, placeholders, scripts), every language at 390 px
 * (errors, missing keys, raw keys, English left on screen, sideways scroll), live switch en→hi, dark theme, file://.
 * Screenshots: tools/shots/<name>/ (en-desktop, en-desktop-full, hi-mobile, ta-mobile, bn-mobile, ur-mobile, en-dark-mobile). */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), vm = require('vm');
const { chromium } = require('playwright-core');
const ROOT = path.resolve(__dirname, '..');
const LANGS = ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur'];
const PAGES = { schools: ['schools.html', 'SCHOOLS_STRINGS', 'shared/schools-strings.js'], business: ['business.html', 'BUSINESS_STRINGS', 'shared/business-strings.js'], about: ['about.html', 'ABOUT_STRINGS', 'shared/about-strings.js'], videos: ['videos.html', 'VIDEOS_STRINGS', 'shared/videos-strings.js'], contact: ['contact.html', 'CONTACT_STRINGS', 'shared/contact-strings.js'] };
const SCRIPTS = { deva: /[\u0900-\u0963\u0966-\u097F]/, beng: /[\u0980-\u09FF]/, guru: /[\u0A00-\u0A7F]/, gujr: /[\u0A80-\u0AFF]/, orya: /[\u0B00-\u0B7F]/, taml: /[\u0B80-\u0BFF]/, telu: /[\u0C00-\u0C7F]/, knda: /[\u0C80-\u0CFF]/, mlym: /[\u0D00-\u0D7F]/, arab: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/ };
const LANG_SCRIPT = { hi: 'deva', mr: 'deva', bn: 'beng', pa: 'guru', gu: 'gujr', or: 'orya', ta: 'taml', te: 'telu', kn: 'knda', ml: 'mlym', ur: 'arab' };
const CHROME = require('./chrome-path')();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf', '.txt': 'text/plain', '.xml': 'application/xml' };

const argv = process.argv.slice(2);
const name = argv[0];
const conf = PAGES[name] || (argv[1] && argv[2] ? [name + '.html', argv[1], argv[2]] : null);
if (!conf) { console.error('usage: node tools/verify_pages.js schools | <name> <STRINGS_GLOBAL> <strings-file>'); process.exit(2); }
const [pageRel, GLOBAL, stringsRel] = conf;
const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => warnings.push(m);

function checkTable(table, label) {
  if (!table) return err(`${label}: not defined`);
  const en = table.en || {}, keys = Object.keys(en);
  const ph = s => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
  for (const L of LANGS) {
    const S = table[L]; if (!S) { err(`${label}: language ${L} missing`); continue; }
    const miss = keys.filter(k => !(k in S)); if (miss.length) err(`${label}[${L}]: missing ${miss.slice(0, 8).join(', ')}`);
    const extra = Object.keys(S).filter(k => !(k in en)); if (extra.length) warn(`${label}[${L}]: extra ${extra.slice(0, 8).join(', ')}`);
    for (const k of keys) {
      const v = S[k]; if (typeof v !== 'string') continue;
      if (!v.trim()) err(`${label}[${L}].${k}: empty`);
      if (ph(v) !== ph(en[k])) err(`${label}[${L}].${k}: placeholders differ`);
      if (L === 'en') continue;
      for (const [sc, re] of Object.entries(SCRIPTS)) if (sc !== LANG_SCRIPT[L] && re.test(v)) { err(`${label}[${L}].${k}: contains ${sc} script`); break; }
    }
  }
}

function analyze(GLOBAL) {
  const S = window[GLOBAL] || {}, L = document.documentElement.lang, en = S.en || {}, cur = S[L] || {};
  const keys = new Set(Object.keys(en)), enVals = new Map();
  for (const [k, v] of Object.entries(en)) if (typeof v === 'string') enVals.set(v.trim(), k);
  const curVals = new Set(Object.values(cur).filter(v => typeof v === 'string').map(v => v.trim()));
  const out = { lang: L, dir: document.documentElement.dir, ready: !!window.EDU_READY, overflow: document.documentElement.scrollWidth - window.innerWidth, rawKeys: [], englishLeft: [], textCount: 0 };
  const visible = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const txt = n.nodeValue.trim(); if (!txt) continue;
    const p = n.parentElement; if (!p || p.closest('script,style,textarea,code,pre,option,.no-i18n,.edu-lang,.edu-foot') || !visible(p)) continue;
    out.textCount++;
    if (keys.has(txt) && !curVals.has(txt)) out.rawKeys.push(txt);
    else if (L !== 'en' && enVals.has(txt) && cur[enVals.get(txt)] !== undefined && cur[enVals.get(txt)].trim() !== txt && /[A-Za-z]{3,}/.test(txt)) out.englishLeft.push(txt.slice(0, 60));
  }
  return out;
}

(async () => {
  try { const sb = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, stringsRel), 'utf8'), sb); checkTable(sb.window[GLOBAL], path.basename(stringsRel)); }
  catch (e) { err('strings failed to evaluate: ' + e.message); }
  const html = fs.readFileSync(path.join(ROOT, pageRel), 'utf8');
  if (!/<main[^>]+id=["']app["']/.test(html)) err('needs <main id="app">');
  if (/\b(gtag|google-analytics|googletagmanager|facebook\.net)\b/i.test(html)) err('tracking script found');

  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const fp = path.join(ROOT, p);
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(fp).pipe(res);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const shots = path.join(__dirname, 'shots', name); fs.mkdirSync(shots, { recursive: true });
  async function open(lang, viewport, opts = {}) {
    const ctx = await browser.newContext({ viewport, colorScheme: opts.dark ? 'dark' : 'light', locale: 'en-IN' });
    const page = await ctx.newPage(); const log = [];
    page.on('console', m => { const tx = m.text(); if (tx.startsWith('[i18n-missing]') || m.type() === 'error') log.push(tx.slice(0, 200)); });
    page.on('pageerror', e => log.push('pageerror: ' + String(e).slice(0, 300)));
    page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) log.push(r.status() + ' ' + r.url()); });
    const url = (opts.file ? 'file:///' + path.join(ROOT, pageRel).replace(/\\/g, '/') : base + pageRel) + (lang ? '?lang=' + lang : '');
    await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(900);
    return { ctx, page, log };
  }
  const judge = (where, log, a, L, mobile) => {
    for (const l of log) if (!/Failed to load resource|net::ERR_/.test(l)) err(`${where}: ${l}`);
    if (!a) return;
    if (!a.ready) err(`${where}: EDU.init not called`);
    if (L && a.lang !== L) err(`${where}: lang ${a.lang}`);
    if (L === 'ur' && a.dir !== 'rtl') err(`${where}: not rtl`);
    if (a.rawKeys.length) err(`${where}: raw keys ${a.rawKeys.slice(0, 6).join(' | ')}`);
    if (a.englishLeft.length) err(`${where}: English left ${a.englishLeft.slice(0, 4).join(' | ')}`);
    if (mobile && a.overflow > 2) err(`${where}: horizontal overflow ${a.overflow}px`);
  };
  for (let i = 0; i < LANGS.length; i += 4) await Promise.all(LANGS.slice(i, i + 4).map(async L => {
    const { ctx, page, log } = await open(L, { width: 390, height: 844 });
    judge(`${L}/mobile`, log, await page.evaluate(analyze, GLOBAL).catch(() => null), L, true);
    if (['hi', 'ta', 'ur', 'bn'].includes(L)) await page.screenshot({ path: path.join(shots, `${L}-mobile.png`), fullPage: true });
    await ctx.close();
  }));
  {
    const { ctx, page, log } = await open('en', { width: 1280, height: 800 });
    judge('en/desktop', log, await page.evaluate(analyze, GLOBAL), 'en');
    await page.screenshot({ path: path.join(shots, 'en-desktop.png') });
    await page.screenshot({ path: path.join(shots, 'en-desktop-full.png'), fullPage: true });
    await page.selectOption('#edu-lang', 'hi'); await page.waitForTimeout(500);
    judge('switch en→hi', [], await page.evaluate(analyze, GLOBAL), 'hi');
    await ctx.close();
  }
  {
    const { ctx, page, log } = await open('en', { width: 390, height: 844 }, { dark: true });
    judge('en/dark', log, null);
    await page.screenshot({ path: path.join(shots, 'en-dark-mobile.png'), fullPage: true });
    await ctx.close();
  }
  {
    const { ctx, page, log } = await open('en', { width: 1280, height: 800 }, { file: true });
    if (!(await page.evaluate(() => !!window.EDU_READY))) err('file://: page did not start');
    for (const l of log) if (/pageerror/.test(l)) err('file://: ' + l);
    await ctx.close();
  }
  await browser.close(); srv.close();
  console.log(`\n=== verify page ${name}: ${errors.length ? 'FAIL' : 'PASS'} (${errors.length} errors, ${warnings.length} warnings) ===`);
  for (const e of [...new Set(errors)].slice(0, 60)) console.log('ERROR  ' + e);
  for (const w of [...new Set(warnings)].slice(0, 30)) console.log('warn   ' + w);
  console.log(`screenshots: tools/shots/${name}/`);
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
