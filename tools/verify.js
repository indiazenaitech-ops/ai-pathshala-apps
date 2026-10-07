#!/usr/bin/env node
/* Verify one app (or the home page) of the AI Pathshala Apps library.
 *
 *   node tools/verify.js <slug>            full check: static + 12 languages + test + file:// + screenshots
 *   node tools/verify.js <slug> --quick    static + en/hi/ur only, no screenshots
 *   node tools/verify.js home              checks index.html (library home)
 *
 * Exit code 0 = no errors (warnings allowed), 1 = errors.
 * Report: tools/reports/<slug>.json   Screenshots: tools/shots/<slug>/*.png
 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const LANGS = ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur'];
const CATS = ['learn-ai', 'teacher-tools', 'math', 'science', 'coding', 'languages', 'study-skills', 'digital-safety', 'business', 'marketing', 'everyday', 'data'];
const NEEDS = ['camera', 'microphone', 'internet', 'speech'];
const CHROME = require('./chrome-path')();
const SCRIPT_HOSTS = ['cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com'];
const SCRIPTS = {
  deva: /[\u0900-\u0963\u0966-\u097F]/, beng: /[\u0980-\u09FF]/, guru: /[\u0A00-\u0A7F]/, gujr: /[\u0A80-\u0AFF]/,
  orya: /[\u0B00-\u0B7F]/, taml: /[\u0B80-\u0BFF]/, telu: /[\u0C00-\u0C7F]/, knda: /[\u0C80-\u0CFF]/,
  mlym: /[\u0D00-\u0D7F]/, arab: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/
};
const LANG_SCRIPT = { hi: 'deva', mr: 'deva', bn: 'beng', pa: 'guru', gu: 'gujr', or: 'orya', ta: 'taml', te: 'telu', kn: 'knda', ml: 'mlym', ur: 'arab' };
const BRAND_OK = /^(AI|YouTube|Android|Chrome|CSV|PDF|PNG|JPG|Python|SQL|HTML|CSS|JavaScript|QR|WhatsApp|URL|OK|CBSE|NCERT|NEP|Wi-?Fi|UPI|OTP|KYC|ID|IQ|GPS|DNA|RAM|CPU|GPU|x|y|z|[A-Z]{1,4}|[\d\s.,:;%+\-×÷=/()]+)$/;

const argv = process.argv.slice(2);
const slug = argv.find(a => !a.startsWith('--'));
const QUICK = argv.includes('--quick');
const NO_SHOTS = QUICK || argv.includes('--no-shots');
if (!slug) { console.error('usage: node tools/verify.js <slug> [--quick]'); process.exit(2); }

const errors = [], warnings = [], info = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
const isHome = slug === 'home';
const appDir = isHome ? ROOT : path.join(ROOT, 'apps', slug);
const pageRel = isHome ? 'index.html' : `apps/${slug}/index.html`;

/* ------------------------------------------------------------ static */
function loadStrings(file, globalName) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {}, console };
  vm.runInNewContext(code, sandbox, { filename: file, timeout: 2000 });
  return { table: sandbox.window[globalName], code };
}

function checkStringTable(table, code, label) {
  if (!table || typeof table !== 'object') { err(`${label}: string table not defined`); return; }
  const mixedOK = /verify-allow-mixed-scripts/.test(code || '');
  const en = table.en || {};
  const enKeys = Object.keys(en);
  if (!enKeys.length) err(`${label}: no English strings`);
  if (!isHome && label === 'strings' && !('app_title' in en)) err(`${label}: missing key app_title`);
  for (const L of LANGS) {
    const S = table[L];
    if (!S) { err(`${label}: language "${L}" missing`); continue; }
    const missing = enKeys.filter(k => !(k in S));
    const extra = Object.keys(S).filter(k => !(k in en));
    if (missing.length) err(`${label}[${L}]: ${missing.length} missing keys: ${missing.slice(0, 8).join(', ')}`);
    if (extra.length) warn(`${label}[${L}]: keys not in en: ${extra.slice(0, 8).join(', ')}`);
    let same = [];
    for (const k of enKeys) {
      if (!(k in S)) continue;
      const v = S[k], e = en[k];
      if (typeof v !== typeof e) { err(`${label}[${L}].${k}: type ${typeof v} differs from en (${typeof e})`); continue; }
      if (typeof v === 'string') {
        if (!v.trim() && e.trim()) err(`${label}[${L}].${k}: empty`);
        const ph = s => (s.match(/\{\w+\}/g) || []).sort().join(',');
        if (ph(v) !== ph(e)) err(`${label}[${L}].${k}: placeholders ${ph(v) || '-'} differ from en ${ph(e) || '-'}`);
        if (L !== 'en' && v === e && /[A-Za-z]{4,}/.test(e) && !BRAND_OK.test(e.trim())) same.push(k);
        if (L !== 'en') {
          const want = LANG_SCRIPT[L];
          for (const [sc, re] of Object.entries(SCRIPTS)) {
            if (sc !== want && re.test(v)) {
              const m = `${label}[${L}].${k}: contains ${sc} script (expected ${want}): "${v.slice(0, 50)}"`;
              mixedOK ? warn(m) : err(m);
              break;
            }
          }
        }
      } else if (Array.isArray(v) && Array.isArray(e) && v.length !== e.length) {
        err(`${label}[${L}].${k}: array length ${v.length} differs from en ${e.length}`);
      }
    }
    if (L !== 'en' && same.length > Math.max(3, enKeys.length * 0.1)) warn(`${label}[${L}]: ${same.length} values identical to English (untranslated?): ${same.slice(0, 10).join(', ')}`);
  }
}

/* content.js: window.APP_CONTENT = { en: <any JSON shape>, hi: <same shape>, ... } */
function checkContent(table, code) {
  if (!table || typeof table !== 'object') { err('content.js: window.APP_CONTENT not defined'); return; }
  const mixedOK = /verify-allow-mixed-scripts/.test(code || '');
  const en = table.en;
  if (en === undefined) { err('content.js: no "en" content'); return; }
  for (const L of LANGS) {
    if (table[L] === undefined) { err(`content[${L}] missing`); continue; }
    if (L === 'en') continue;
    let strings = 0, same = 0, problems = 0;
    (function cmp(a, b, p) {
      if (problems > 12) return;
      if (Array.isArray(a)) {
        if (!Array.isArray(b)) { problems++; return err(`content[${L}]${p}: expected array`); }
        if (a.length !== b.length) { problems++; err(`content[${L}]${p}: ${b.length} items, en has ${a.length}`); }
        for (let i = 0; i < Math.min(a.length, b.length); i++) cmp(a[i], b[i], `${p}[${i}]`);
      } else if (a && typeof a === 'object') {
        if (!b || typeof b !== 'object' || Array.isArray(b)) { problems++; return err(`content[${L}]${p}: expected object`); }
        for (const k of Object.keys(a)) {
          if (!(k in b)) { problems++; err(`content[${L}]${p}.${k}: missing`); continue; }
          cmp(a[k], b[k], `${p}.${k}`);
        }
      } else if (typeof a === 'string') {
        if (typeof b !== 'string') { problems++; return err(`content[${L}]${p}: expected string`); }
        strings++;
        if (a.trim() && !b.trim()) { problems++; err(`content[${L}]${p}: empty`); }
        if (b === a && /[A-Za-z]{4,}/.test(a)) same++;
        const want = LANG_SCRIPT[L];
        for (const [sc, re] of Object.entries(SCRIPTS)) {
          if (sc !== want && re.test(b)) { const m = `content[${L}]${p}: contains ${sc} script (expected ${want}): "${b.slice(0, 50)}"`; if (mixedOK) warn(m); else { problems++; err(m); } break; }
        }
      } else if (typeof a !== typeof b) { problems++; err(`content[${L}]${p}: type ${typeof b} differs from en (${typeof a})`); }
      else if (typeof a === 'number' && a !== b) warn(`content[${L}]${p}: number ${b} differs from en ${a}`);
    })(en, table[L], '');
    if (strings && same > Math.max(3, strings * 0.2)) warn(`content[${L}]: ${same}/${strings} strings identical to English (untranslated?)`);
  }
}

function staticChecks() {
  const must = isHome ? ['index.html'] : ['index.html', 'strings.js', 'meta.json', 'app.js'];
  for (const f of must) if (!fs.existsSync(path.join(appDir, f))) err(`missing file ${f}`);
  if (errors.length) return;

  const html = fs.readFileSync(path.join(appDir, 'index.html'), 'utf8');
  const up = isHome ? '' : '../../';
  if (!html.includes(`${up}shared/edu.css`)) err('index.html must link ' + up + 'shared/edu.css');
  if (!html.includes(`${up}shared/edu.js`)) err('index.html must load ' + up + 'shared/edu.js');
  if (!/<meta[^>]+name=["']viewport/.test(html)) err('index.html: missing viewport meta');
  if (!/<main[^>]+id=["']app["']/.test(html)) err('index.html: needs <main id="app">');
  if (/type=["']module["']/.test(html)) err('index.html: type="module" scripts break file:// use — use classic scripts');
  const srcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);
  for (const s of srcs) {
    if (/^https?:\/\//.test(s)) {
      const host = new URL(s).hostname;
      if (!SCRIPT_HOSTS.includes(host)) err(`script from disallowed host ${host} (allowed: ${SCRIPT_HOSTS.join(', ')})`);
      if (s.startsWith('http://')) err('http:// script (mixed content): ' + s);
    }
  }
  if (/http:\/\/(?!localhost|127\.0\.0\.1|www\.w3\.org)/.test(html)) warn('index.html contains http:// URLs');
  const order = srcs.map(x => x.split('/').pop());
  const eduIdx = srcs.findIndex(x => /shared\/edu\.js$/.test(x)), strIdx = order.indexOf('strings.js'), appIdx = order.indexOf('app.js');
  if (!isHome && !(eduIdx < strIdx && strIdx < appIdx)) err('script order must be shared/edu.js → strings.js → app.js');

  if (isHome) {
    try {
      const { table, code } = loadStrings(path.join(ROOT, 'shared', 'home-strings.js'), 'HOME_STRINGS');
      checkStringTable(table, code, 'home-strings');
    } catch (e) { err('home-strings.js failed to evaluate: ' + e.message); }
    try {
      const sandbox = { window: {} };
      vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'shared', 'edu.js'), 'utf8').replace(/document\.currentScript[^;]*;/, 'null;'), Object.assign(sandbox, { document: { currentScript: null, addEventListener() {}, documentElement: { setAttribute() {}, getAttribute() {}, classList: { toggle() {} } } }, navigator: {}, location: { search: '' }, URLSearchParams, matchMedia: () => ({ matches: false, addEventListener() {} }) }));
      checkStringTable(sandbox.window.EDU.COMMON, '', 'edu-common');
    } catch (e) { warn('could not check EDU.COMMON strings: ' + e.message); }
  }

  if (!isHome) {
    const jsFiles = fs.readdirSync(appDir).filter(f => f.endsWith('.js') && f !== 'strings.js');
    for (const f of jsFiles) {
      const js = fs.readFileSync(path.join(appDir, f), 'utf8');
      if (/^\s*import\s+(?:[\w$*{][^;\n]*\sfrom\s+)?['"][^'"]+['"]\s*;?\s*$/m.test(js) || /^\s*export\s+(default|const|let|var|function|class|async|\{)/m.test(js)) err(`${f}: ES module import/export — use classic scripts`);
      if (/fetch\(\s*['"`](?!https?:)/.test(js)) err(`${f}: fetch() of a relative path fails on file:// — inline the data in a .js file`);
      if (/\blocalStorage\b/.test(js)) warn(`${f}: uses localStorage directly — prefer EDU.store() (safe in private mode)`);
      if (/https?:\/\/(?!cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|www\.w3\.org|fonts\.googleapis|fonts\.gstatic|storage\.googleapis\.com|tfhub\.dev|www\.youtube\.com|wa\.me|api\.whatsapp\.com)/.test(js)) warn(`${f}: references an external URL — make sure nothing paid / tracking / needing keys`);
      if (/\b(gtag|google-analytics|googletagmanager|facebook\.net|api[_-]?key)\b/i.test(js)) err(`${f}: tracking / API key reference not allowed`);
    }
    try {
      const { table, code } = loadStrings(path.join(appDir, 'strings.js'), 'APP_STRINGS');
      checkStringTable(table, code, 'strings');
    } catch (e) { err('strings.js failed to evaluate: ' + e.message); }

    const contentPath = path.join(appDir, 'content.js');
    if (fs.existsSync(contentPath)) {
      try {
        const { table, code } = loadStrings(contentPath, 'APP_CONTENT');
        checkContent(table, code);
      } catch (e) { err('content.js failed to evaluate: ' + e.message); }
    }

    try {
      const meta = JSON.parse(fs.readFileSync(path.join(appDir, 'meta.json'), 'utf8'));
      if (meta.slug !== slug) err(`meta.slug "${meta.slug}" must equal folder "${slug}"`);
      if (!meta.icon) err('meta.icon missing (an emoji)');
      if (!CATS.includes(meta.category)) err(`meta.category must be one of ${CATS.join(', ')}`);
      if (!/^\d{1,2}(-\d{1,2})?$|^(UG|PG|all)$/.test(String(meta.grades || ''))) err('meta.grades must look like "6-12"');
      if (!Array.isArray(meta.audience) || !meta.audience.length || meta.audience.some(a => !['student', 'teacher'].includes(a))) err('meta.audience must be a non-empty subset of ["student","teacher"]');
      if (!Array.isArray(meta.needs) || meta.needs.some(n => !NEEDS.includes(n))) err(`meta.needs must be a subset of ${JSON.stringify(NEEDS)}`);
      for (const f of ['title', 'desc']) {
        for (const L of LANGS) if (!meta[f] || !String(meta[f][L] || '').trim()) err(`meta.${f}.${L} missing`);
      }
      const t2 = {}; for (const L of LANGS) t2[L] = { title: meta.title && meta.title[L] || '', desc: meta.desc && meta.desc[L] || '' };
      checkStringTable(t2, '', 'meta');
      if (meta.title && meta.title.en && meta.title.en.length > 32) warn('meta.title.en is long (>32 chars) — catalog cards prefer short names');
      if (meta.desc && meta.desc.en && meta.desc.en.length > 140) warn('meta.desc.en is long (>140 chars)');
      const ap = (() => { try { return loadStrings(path.join(appDir, 'strings.js'), 'APP_STRINGS').table; } catch (e) { return null; } })();
      if (ap && meta.title && ap.en && meta.title.en !== ap.en.app_title) warn('meta.title.en differs from strings app_title');
    } catch (e) { err('meta.json invalid: ' + e.message); }
  }

  let total = 0;
  (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const s = fs.statSync(p); if (s.isDirectory()) { if (!isHome) walk(p); } else total += s.size; } })(appDir);
  info.push(`size ${(total / 1024).toFixed(0)} KB`);
  if (!isHome && total > 5 * 1024 * 1024) err('app folder > 5 MB'); else if (!isHome && total > 1.2 * 1024 * 1024) warn('app folder > 1.2 MB');
}

/* ------------------------------------------------------------ server */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const fp = path.join(ROOT, p);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(fp).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

/* ------------------------------------------------------------ in-page analysis */
function analyze() {
  const S = window.APP_STRINGS || window.HOME_STRINGS || {};
  const L = document.documentElement.lang;
  const en = S.en || {}, cur = S[L] || {};
  const keys = new Set(Object.keys(en));
  const enVals = new Map();
  for (const [k, v] of Object.entries(en)) if (typeof v === 'string') enVals.set(v.trim(), k);
  const curVals = new Set(Object.values(cur).filter(v => typeof v === 'string').map(v => v.trim()));
  const BR = /^(AI|YouTube|Android|Chrome|CSV|PDF|PNG|Python|SQL|HTML|CSS|QR|WhatsApp|URL|OK|CBSE)$/;
  const out = { lang: L, dir: document.documentElement.dir, ready: !!window.EDU_READY, title: document.title,
    h1: (document.getElementById('edu-title') || {}).textContent || '', overflow: document.documentElement.scrollWidth - window.innerWidth,
    rawKeys: [], englishLeft: [], hardcoded: [], textCount: 0 };
  const visible = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const latinShare = (txt) => { const letters = txt.match(/\p{L}/gu) || []; if (!letters.length) return 0; return letters.filter(c => /[A-Za-z]/.test(c)).length / letters.length; };
  const consider = (txt, where) => {
    if (keys.has(txt) && !curVals.has(txt)) out.rawKeys.push(where + txt);
    else if (L !== 'en' && enVals.has(txt) && cur[enVals.get(txt)] !== undefined && cur[enVals.get(txt)].trim() !== txt && /[A-Za-z]{3,}/.test(txt)) out.englishLeft.push(where + txt.slice(0, 70));
    else if (L !== 'en' && /\b[A-Za-z]{3,}\b[^A-Za-z]+\b[A-Za-z]{3,}\b/.test(txt) && !curVals.has(txt) && !BR.test(txt) && latinShare(txt) > 0.6) out.hardcoded.push(where + txt.slice(0, 70));
  };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const txt = n.nodeValue.trim(); if (!txt) continue;
    const p = n.parentElement; if (!p) continue;
    if (p.closest('script,style,textarea,code,pre,option,[data-no-i18n],.no-i18n,.edu-lang,.edu-foot')) continue;
    if (!visible(p)) continue;
    out.textCount++;
    consider(txt, '');
  }
  document.querySelectorAll('select:not(.edu-lang) option').forEach(o => { const txt = o.textContent.trim(); if (txt && !o.closest('[data-no-i18n],.no-i18n')) consider(txt, 'option: '); });
  document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(e => {
    if (e.closest('[data-no-i18n],.no-i18n,.edu-lang')) return;
    for (const a of ['placeholder', 'aria-label', 'title']) { const v = (e.getAttribute(a) || '').trim(); if (v) consider(v, a + ': '); }
  });
  out.rawKeys = [...new Set(out.rawKeys)]; out.englishLeft = [...new Set(out.englishLeft)]; out.hardcoded = [...new Set(out.hardcoded)];
  return out;
}

/* ------------------------------------------------------------ dynamic */
async function run() {
  staticChecks();
  if (!CHROME) { err('no Chrome/Edge found for browser checks'); return finish(); }
  if (!fs.existsSync(path.join(ROOT, pageRel))) return finish();

  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({
    executablePath: CHROME, headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required', '--disable-gpu-sandbox']
  });
  const shotsDir = path.join(__dirname, 'shots', slug);
  if (!NO_SHOTS) fs.mkdirSync(shotsDir, { recursive: true });

  async function openPage(lang, viewport, opts = {}) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: opts.dark ? 'dark' : 'light', permissions: ['camera', 'microphone'], locale: 'en-IN' });
    const page = await ctx.newPage();
    const log = { console: [], pageErrors: [], failed: [], missing: [] };
    page.on('console', m => {
      const tx = m.text();
      if (tx.startsWith('[i18n-missing]')) log.missing.push(tx);
      else if (m.type() === 'error') log.console.push(tx.slice(0, 300));
    });
    page.on('pageerror', e => log.pageErrors.push(String(e && e.stack || e).slice(0, 500)));
    page.on('dialog', d => d.accept().catch(() => { }));
    page.on('response', r => { if (r.status() >= 400) log.failed.push(r.status() + ' ' + r.url()); });
    page.on('requestfailed', r => log.failed.push('FAILED ' + r.url() + ' ' + (r.failure() || {}).errorText));
    const url = (opts.file ? 'file:///' + path.join(ROOT, pageRel).replace(/\\/g, '/') : base + pageRel) + (lang ? `?lang=${lang}` : '');
    try { await page.goto(url, { waitUntil: 'load', timeout: 60000 }); }
    catch (e) { log.pageErrors.push('navigation: ' + e.message.split('\n')[0]); }
    await page.waitForTimeout(opts.wait || 900);
    return { ctx, page, log };
  }

  function judge(where, log, a, opts = {}) {
    const same = u => u.startsWith(base) || u.startsWith('file:');
    for (const e of log.pageErrors) err(`${where}: page error: ${e}`);
    for (const e of log.console) {
      if (/Failed to load resource/.test(e)) { warn(`${where}: console: ${e}`); continue; }
      err(`${where}: console error: ${e}`);
    }
    for (const f of log.failed) {
      if (/favicon/.test(f)) continue;
      const u = f.replace(/^(FAILED |\d+ )/, '');
      if (same(u)) err(`${where}: request failed: ${f}`); else warn(`${where}: external request failed: ${f.slice(0, 160)}`);
    }
    for (const m of log.missing) err(`${where}: ${m}`);
    if (!a) return;
    if (!a.ready) err(`${where}: EDU.init() was not called (window.EDU_READY false)`);
    if (opts.lang && a.lang !== opts.lang) err(`${where}: <html lang> is "${a.lang}", expected "${opts.lang}"`);
    if (opts.lang === 'ur' && a.dir !== 'rtl') err(`${where}: Urdu page is not dir=rtl`);
    if (a.rawKeys.length) err(`${where}: raw i18n keys visible: ${a.rawKeys.slice(0, 8).join(' | ')}`);
    if (a.englishLeft.length) err(`${where}: English UI strings left untranslated on screen (not re-rendered / hard-coded?): ${a.englishLeft.slice(0, 6).join(' | ')}`);
    if (a.hardcoded.length > 2) warn(`${where}: text that looks like hard-coded English: ${a.hardcoded.slice(0, 6).join(' | ')}`);
    if (opts.mobile && a.overflow > 2) err(`${where}: horizontal overflow ${a.overflow}px at ${opts.width}px width (page scrolls sideways)`);
    if (a.textCount < 3) warn(`${where}: almost no visible text (${a.textCount} nodes) — did the app render?`);
  }

  const langs = QUICK ? ['en', 'hi', 'ur'] : LANGS;
  const mobile = { width: 390, height: 844 }, desktop = { width: 1280, height: 800 };

  // 1) every language at phone width
  for (let i = 0; i < langs.length; i += 4) {
    await Promise.all(langs.slice(i, i + 4).map(async L => {
      const { ctx, page, log } = await openPage(L, mobile);
      let a = null;
      try { a = await page.evaluate(analyze); } catch (e) { err(`${L}/mobile: analyze failed: ${e.message.split('\n')[0]}`); }
      judge(`${L}/mobile`, log, a, { lang: L, mobile: true, width: 390 });
      if (!NO_SHOTS && ['hi', 'ta', 'ur', 'bn'].includes(L)) await page.screenshot({ path: path.join(shotsDir, `${L}-mobile.png`), fullPage: true }).catch(() => { });
      await ctx.close();
    }));
  }

  // 2) desktop en + live language switch to hi + interaction test
  {
    const { ctx, page, log } = await openPage('en', desktop);
    const a = await page.evaluate(analyze).catch(() => null);
    judge('en/desktop', log, a, { lang: 'en' });
    if (!NO_SHOTS) {
      await page.screenshot({ path: path.join(shotsDir, 'en-desktop.png') }).catch(() => { });
      await page.screenshot({ path: path.join(shotsDir, 'en-desktop-full.png'), fullPage: true }).catch(() => { });
    }
    try {
      await page.selectOption('#edu-lang', 'hi');
      await page.waitForTimeout(500);
      const b = await page.evaluate(analyze);
      const want = await page.evaluate(() => (window.APP_STRINGS || window.HOME_STRINGS || {}).hi && ((window.APP_STRINGS || window.HOME_STRINGS).hi.app_title || (window.APP_STRINGS || window.HOME_STRINGS).hi.home_title));
      judge('switch en→hi', { console: [], pageErrors: [], failed: [], missing: [] }, b, { lang: 'hi' });
      if (!isHome && want && b.h1.trim() !== want.trim()) err(`switch en→hi: header title "${b.h1}" != "${want}"`);
      const back = await page.evaluate(() => { EDU.setLang('en'); return document.documentElement.lang; });
      if (back !== 'en') err('switch back to en failed');
    } catch (e) { err('language switch test failed: ' + e.message.split('\n')[0]); }
    await ctx.close();
  }

  // 3) dark theme screenshot
  if (!NO_SHOTS) {
    const { ctx, page, log } = await openPage('en', mobile, { dark: true });
    judge('en/dark', log, null);
    await page.screenshot({ path: path.join(shotsDir, 'en-dark-mobile.png'), fullPage: true }).catch(() => { });
    await ctx.close();
  }

  // 4) interaction test
  const testFile = path.join(__dirname, 'tests', `${slug}.test.js`);
  if (!isHome) {
    if (!fs.existsSync(testFile)) err(`missing interaction test tools/tests/${slug}.test.js`);
    else {
      delete require.cache[require.resolve(testFile)];
      const test = require(testFile);
      for (const L of ['en', 'hi']) {
        const { ctx, page, log } = await openPage(L, desktop, { wait: 1200 });
        const strings = await page.evaluate(() => ({ app: window.APP_STRINGS || {}, common: (window.EDU && EDU.COMMON) || {} })).catch(() => ({ app: {}, common: {} }));
        const t = (k, vars) => {
          let v = (strings.app[L] || {})[k] ?? (strings.common[L] || {})[k] ?? (strings.app.en || {})[k] ?? (strings.common.en || {})[k] ?? k;
          if (vars) v = String(v).replace(/\{(\w+)\}/g, (m, x) => vars[x] !== undefined ? vars[x] : m);
          return v;
        };
        const expect = (cond, msg) => { if (!cond) throw new Error('expect failed: ' + msg); };
        try {
          await Promise.race([
            test({ page, lang: L, expect, t, log: (...m) => info.push(`[test ${L}] ` + m.join(' ')), base, shotsDir }),
            new Promise((_, rej) => setTimeout(() => rej(new Error('test timed out after 120 s')), 120000))
          ]);
          info.push(`interaction test (${L}) passed`);
        } catch (e) { err(`interaction test (${L}) failed: ${String(e.message || e).split('\n')[0]}`); }
        judge(`test/${L}`, log, null);
        if (!NO_SHOTS && L === 'en') await page.screenshot({ path: path.join(shotsDir, 'en-after-test.png'), fullPage: true }).catch(() => { });
        await ctx.close();
      }
    }
  }

  // 5) file:// (downloaded zip, offline use)
  if (!QUICK) {
    const { ctx, page, log } = await openPage('en', desktop, { file: true });
    log.failed = log.failed.filter(f => /^FAILED file:/.test(f));
    log.console = log.console.filter(c => !/Failed to load resource|net::ERR_/.test(c));
    const ready = await page.evaluate(() => !!window.EDU_READY).catch(() => false);
    for (const e of log.pageErrors) err(`file://: page error: ${e}`);
    for (const f of log.failed) err(`file://: ${f}`);
    if (!ready) err('file://: app did not start when opened from a downloaded folder');
    await ctx.close();
  }

  await browser.close();
  srv.close();
  finish();
}

function finish() {
  const report = { slug, ok: errors.length === 0, quick: QUICK, errors, warnings, info, at: new Date().toISOString() };
  fs.mkdirSync(path.join(__dirname, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'reports', `${slug}.json`), JSON.stringify(report, null, 2));
  const uniq = a => [...new Set(a)];
  console.log(`\n=== verify ${slug}: ${errors.length ? 'FAIL' : 'PASS'} (${errors.length} errors, ${warnings.length} warnings) ===`);
  for (const e of uniq(errors).slice(0, 60)) console.log('ERROR  ' + e);
  for (const w of uniq(warnings).slice(0, 40)) console.log('warn   ' + w);
  for (const i of info) console.log('info   ' + i);
  if (!NO_SHOTS) console.log(`screenshots: tools/shots/${slug}/`);
  process.exit(errors.length ? 1 : 0);
}

run().catch(e => { err('verify crashed: ' + (e.stack || e)); finish(); });
