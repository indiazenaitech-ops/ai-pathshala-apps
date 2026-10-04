#!/usr/bin/env node
/* Checks every generated guide page (every guides/.../index.html, all languages).
 *  static:  <title>, description, canonical, 13 hreflang links, Open Graph image on disk, JSON-LD parses and has
 *           Article/BreadcrumbList/HowTo/FAQPage (CollectionPage on the index) with the right counts, no {placeholder}
 *           left in the text, every local link and image exists, guides/strings.js has all keys in 12 languages
 *  browser: each page at 390 px in its own language (no ?lang): EDU starts, page language and direction, no errors or
 *           404s, no missing strings, no raw keys, no sideways scroll, all screenshots load, the rendered text and
 *           title match the static HTML; a live language switch; dark theme; file://.
 *  Screenshots: tools/shots/guides/ (en desktop, hi/ta/ur mobile, en dark mobile per page).
 *   node guides/_build/verify.js [--static] [--only <slug>] */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), vm = require('vm');
const S = require('./structure.js');
const ROOT = path.resolve(__dirname, '..', '..');
const argv = process.argv.slice(2);
const onlyIdx = argv.indexOf('--only');
const ONLY = onlyIdx >= 0 ? argv[onlyIdx + 1] : '';
const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => warnings.push(m);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml' };
const SCRIPTS = { deva: /[\u0900-\u0963\u0966-\u097F]/, beng: /[\u0980-\u09FF]/, guru: /[\u0A00-\u0A7F]/, gujr: /[\u0A80-\u0AFF]/, orya: /[\u0B00-\u0B7F]/, taml: /[\u0B80-\u0BFF]/, telu: /[\u0C00-\u0C7F]/, knda: /[\u0C80-\u0CFF]/, mlym: /[\u0D00-\u0D7F]/, arab: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/ };
const LANG_SCRIPT = { hi: 'deva', mr: 'deva', bn: 'beng', pa: 'guru', gu: 'gujr', or: 'orya', ta: 'taml', te: 'telu', kn: 'knda', ml: 'mlym', ur: 'arab' };

/* ---------- strings table ---------- */
const sb = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'guides', 'strings.js'), 'utf8'), sb);
const STR = sb.window.GUIDES_STRINGS || {};
const need = [...S.COMMON_KEYS, ...S.GUIDES.flatMap(S.guideKeys)];
const ph = s => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
for (const L of S.LANGS) {
  const T = STR[L];
  if (!T) { err(`strings: language ${L} missing`); continue; }
  for (const k of need) {
    if (!(k in T)) { err(`strings[${L}]: missing ${k}`); continue; }
    if (!String(T[k]).trim()) err(`strings[${L}].${k}: empty`);
    if (ph(T[k]) !== ph(STR.en[k])) err(`strings[${L}].${k}: placeholders differ from en`);
    if (L !== 'en') {
      const bare = String(T[k]).replace(/\{\w+\}/g, '');
      for (const [sc, re] of Object.entries(SCRIPTS)) if (sc !== LANG_SCRIPT[L] && re.test(bare)) {
        err(`strings[${L}].${k}: contains ${sc} script`); break;
      }
    }
  }
  for (const k of Object.keys(T)) if (!need.includes(k)) warn(`strings[${L}]: extra key ${k}`);
}

/* ---------- static pages ---------- */
const pages = [];
for (const L of S.LANGS) {
  if (!STR[L]) continue;
  pages.push({ id: null, L });
  for (const g of S.GUIDES) pages.push({ id: g.id, L });
}
const sel = pages.filter(p => !ONLY || (p.id && S.slugOf(p.id) === ONLY) || (ONLY === 'index' && !p.id));
const statics = {};
for (const p of sel) {
  const rel = S.pageFile(p.id, p.L), file = path.join(ROOT, rel), where = rel;
  if (!fs.existsSync(file)) { err(`${where}: not built`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const unesc = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  statics[rel] = { title: unesc(title) };
  if (!title) err(`${where}: no <title>`);
  else if (unesc(title).length > 75) warn(`${where}: title ${unesc(title).length} chars`);
  if (!desc) err(`${where}: no meta description`);
  else if (unesc(desc).length > 200) warn(`${where}: description ${unesc(desc).length} chars`);
  const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (canon !== S.pageUrl(p.id, p.L)) err(`${where}: canonical ${canon}`);
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
  const langsBuilt = S.LANGS.filter(L => STR[L]);
  if (alts.length !== langsBuilt.length + 1) err(`${where}: ${alts.length} hreflang links`);
  for (const [, hl, href] of alts) if (href !== S.pageUrl(p.id, hl === 'x-default' ? 'en' : hl)) err(`${where}: hreflang ${hl} → ${href}`);
  if (!new RegExp(`<html lang="${p.L}" dir="${p.L === 'ur' ? 'rtl' : 'ltr'}">`).test(html)) err(`${where}: <html lang/dir>`);
  const og = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || '';
  if (!og.startsWith(S.SITE)) err(`${where}: og:image ${og}`);
  else if (!fs.existsSync(path.join(ROOT, og.slice(S.SITE.length)))) err(`${where}: og:image file missing ${og}`);
  /* JSON-LD */
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!blocks.length) err(`${where}: no JSON-LD`);
  for (const b of blocks) {
    let o; try { o = JSON.parse(b); } catch (e) { err(`${where}: JSON-LD does not parse: ${e.message}`); continue; }
    const types = (o['@graph'] || [o]).map(x => x['@type']);
    const want = p.id ? ['Article', 'BreadcrumbList', 'HowTo', 'FAQPage'] : ['CollectionPage', 'BreadcrumbList'];
    for (const w of want) if (!types.includes(w)) err(`${where}: JSON-LD lacks ${w}`);
    if (p.id) {
      const gd = S.GUIDES.find(x => x.id === p.id), G = o['@graph'];
      const faq = G.find(x => x['@type'] === 'FAQPage'), how = G.find(x => x['@type'] === 'HowTo');
      if (faq.mainEntity.length !== gd.faq) err(`${where}: FAQPage has ${faq.mainEntity.length} questions`);
      if (how.step.length !== gd.steps) err(`${where}: HowTo has ${how.step.length} steps`);
      for (const q of faq.mainEntity) if (!q.name || !q.acceptedAnswer || !q.acceptedAnswer.text) err(`${where}: empty FAQ entry`);
      for (const st of how.step) if (st.image && !fs.existsSync(path.join(ROOT, st.image.slice(S.SITE.length)))) err(`${where}: HowTo image missing ${st.image}`);
      if (JSON.stringify(o).match(/\{\w+\}/)) err(`${where}: placeholder left in JSON-LD`);
    }
  }
  /* visible text: no {placeholder} left, no raw <b> */
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/data-gv="[^"]*"/g, '');
  const left = body.match(/>[^<]*\{\w+\}[^<]*</);
  if (left) err(`${where}: placeholder left in text: ${left[0].slice(0, 80)}`);
  if (/&lt;\/?(b|i)&gt;/.test(body)) err(`${where}: escaped <b> in text`);
  /* local links and images */
  for (const m of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    let u = m[2];
    if (/^(https?:|mailto:|data:|#)/.test(u)) continue;
    u = u.replace(/&amp;/g, '&').split('#')[0].split('?')[0];
    if (!u) continue;
    let target = path.resolve(path.dirname(file), u);
    if (u.endsWith('/') || (fs.existsSync(target) && fs.statSync(target).isDirectory())) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) err(`${where}: broken link ${m[2]}`);
  }
}

if (argv.includes('--static')) return finish();

/* ---------- browser ---------- */
(async () => {
  const { chromium } = require(path.join(ROOT, 'tools', 'node_modules', 'playwright-core'));
  const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const fp = path.join(ROOT, p);
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(fp).pipe(res);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const shotsDir = path.join(ROOT, 'tools', 'shots', 'guides');
  fs.mkdirSync(shotsDir, { recursive: true });
  const keys = new Set(Object.keys(STR.en));

  async function open(rel, viewport, opts = {}) {
    const ctx = await browser.newContext({ viewport, colorScheme: opts.dark ? 'dark' : 'light', locale: 'en-US' });
    const page = await ctx.newPage(); const log = [];
    page.on('console', m => { const t = m.text(); if (m.type() === 'error' || t.startsWith('[i18n-missing]')) log.push(t.slice(0, 200)); });
    page.on('pageerror', e => log.push('pageerror: ' + String(e).slice(0, 300)));
    page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) log.push(r.status() + ' ' + r.url()); });
    await page.goto(opts.file ? 'file:///' + path.join(ROOT, rel).replace(/\\/g, '/') : base + rel.replace(/index\.html$/, '') + (opts.q || ''), { waitUntil: 'load' });
    await page.waitForTimeout(500);
    return { ctx, page, log };
  }
  /* lazy screenshots: load and decode them all (scroll through the page), so checks and full-page screenshots see them */
  async function loadAll(page) {
    await page.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
      for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
      window.scrollTo(0, 0);
      await Promise.all([...document.querySelectorAll('main img')].map(i => i.decode().catch(() => { })));
    });
    await page.waitForTimeout(200);
  }
  const analyze = (keyList) => {
    const keys = new Set(keyList);
    const main = document.getElementById('app');
    const out = { ready: !!window.EDU_READY, lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.title,
      overflow: document.documentElement.scrollWidth - window.innerWidth, rawKeys: [], text: main ? main.innerText.replace(/\s+/g, ' ').trim() : '', badImgs: [] };
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const t = n.nodeValue.trim(); if (t && keys.has(t)) out.rawKeys.push(t); }
    for (const img of document.querySelectorAll('main img')) if (!img.complete || !img.naturalWidth) out.badImgs.push(img.getAttribute('src'));
    return out;
  };
  const list = sel;
  for (let i = 0; i < list.length; i += 6) await Promise.all(list.slice(i, i + 6).map(async p => {
    const rel = S.pageFile(p.id, p.L), where = rel.replace(/index\.html$/, '');
    const { ctx, page, log } = await open(rel, { width: 390, height: 844 });
    try {
      await loadAll(page);
      const a = await page.evaluate(analyze, [...keys]);
      for (const l of log) err(`${where}: ${l}`);
      if (!a.ready) err(`${where}: EDU did not start`);
      if (a.lang !== p.L) err(`${where}: shown in ${a.lang}, not ${p.L}`);
      if (a.dir !== (p.L === 'ur' ? 'rtl' : 'ltr')) err(`${where}: dir ${a.dir}`);
      if (a.rawKeys.length) err(`${where}: raw keys ${a.rawKeys.slice(0, 5).join(' | ')}`);
      if (a.overflow > 2) err(`${where}: sideways scroll ${a.overflow}px at 390 px`);
      if (a.badImgs.length) err(`${where}: images not loaded ${a.badImgs.join(' ')}`);
      if (a.title !== statics[rel].title) err(`${where}: rendered title "${a.title}" differs from the static title`);
      /* the static text (JavaScript off) must equal the rendered text */
      const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
      const p2 = await ctx2.newPage();
      await p2.goto(base + rel.replace(/index\.html$/, ''), { waitUntil: 'domcontentloaded' });
      const st = await p2.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' ').trim());
      await ctx2.close();
      if (st !== a.text) {
        let k = 0; while (k < st.length && st[k] === a.text[k]) k++;
        err(`${where}: static text differs from rendered text at "${st.slice(Math.max(0, k - 30), k + 40)}" vs "${a.text.slice(Math.max(0, k - 30), k + 40)}"`);
      }
      const slug = p.id ? S.slugOf(p.id) : 'index';
      if (['hi', 'ta', 'ur', 'bn'].includes(p.L)) await page.screenshot({ path: path.join(shotsDir, `${slug}-${p.L}-mobile.png`), fullPage: true });
    } catch (e) { err(`${where}: ${e.message}`); }
    await ctx.close();
  }));
  /* desktop + dark + live switch, per page (English) */
  for (const p of list.filter(x => x.L === 'en')) {
    const rel = S.pageFile(p.id, 'en'), where = rel.replace(/index\.html$/, ''), slug = p.id ? S.slugOf(p.id) : 'index';
    {
      const { ctx, page, log } = await open(rel, { width: 1280, height: 800 });
      await loadAll(page);
      await page.screenshot({ path: path.join(shotsDir, `${slug}-en-desktop.png`), fullPage: true });
      await page.selectOption('#edu-lang', 'ta'); await page.waitForTimeout(500);
      const a = await page.evaluate(analyze, [...keys]);
      if (a.lang !== 'ta') err(`${where}: language switch to ta failed`);
      if (a.rawKeys.length) err(`${where} (switched to ta): raw keys ${a.rawKeys.slice(0, 5).join(' | ')}`);
      const taTitle = String(STR.ta && STR.ta[(p.id || 'g_ix') + '_doc'] || '').replace(/<\/?(b|i)>/g, '');
      if (STR.ta && a.title !== taTitle) err(`${where} (switched to ta): title "${a.title}"`);
      const href = await page.getAttribute('a[data-app], a[data-guide]', 'href');
      if (STR.ta && href && !/lang=ta|\/guides\/ta\//.test(href)) err(`${where} (switched to ta): links still in en (${href})`);
      for (const l of log) err(`${where} (desktop/switch): ${l}`);
      await ctx.close();
    }
    {
      const { ctx, page, log } = await open(rel, { width: 390, height: 844 }, { dark: true });
      await loadAll(page);
      await page.screenshot({ path: path.join(shotsDir, `${slug}-en-dark-mobile.png`), fullPage: true });
      for (const l of log) err(`${where} (dark): ${l}`);
      await ctx.close();
    }
    {
      const { ctx, page, log } = await open(rel, { width: 1280, height: 800 }, { file: true });
      if (!(await page.evaluate(() => !!window.EDU_READY))) err(`${where}: file:// did not start`);
      const href = await page.getAttribute('a[data-app], a[data-guide]', 'href');
      if (href && !/^file:.*index\.html/.test(href)) err(`${where}: file:// link ${href}`);
      for (const l of log) if (/pageerror/.test(l)) err(`${where} (file://): ${l}`);
      await ctx.close();
    }
  }
  await browser.close(); srv.close();
  finish();
})().catch(e => { console.error(e); process.exit(1); });

function finish() {
  const E = [...new Set(errors)], W = [...new Set(warnings)];
  console.log(`\n=== verify guides (${sel.length} pages): ${E.length ? 'FAIL' : 'PASS'} (${E.length} errors, ${W.length} warnings) ===`);
  try {
    fs.mkdirSync(path.join(ROOT, 'tools', 'reports'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'tools', 'reports', 'guides.txt'), E.map(e => 'ERROR  ' + e).concat(W.map(w => 'warn   ' + w)).join('\n') + '\n');
  } catch (e) { }
  for (const e of E.slice(0, 80)) console.log('ERROR  ' + e);
  for (const w of W.slice(0, 40)) console.log('warn   ' + w);
  if (!argv.includes('--static')) console.log('screenshots: tools/shots/guides/');
  process.exitCode = E.length ? 1 : 0;
}
