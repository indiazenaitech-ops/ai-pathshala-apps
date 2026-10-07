#!/usr/bin/env node
/* Check the legal pages: legal/privacy.html + legal/terms.html (not covered by tools/verify.js).
 *
 *   node tools/tests/_legal.check.js          (from the project root; exit code 0 = PASS)
 *
 * 1. String tables (legal/privacy-strings.js, legal/terms-strings.js): 12 languages, identical keys, same {placeholders},
 *    no empty values, no text in the wrong script (e.g. Devanagari inside Bengali), shared keys identical in both files.
 * 2. Both pages × 12 languages at 390 px: no console errors / page errors / [i18n-missing], <html lang> and dir
 *    (Urdu = rtl), no raw keys or {placeholders} on screen, no empty translated element, no horizontal overflow,
 *    grievance e-mail rendered from window.EDU_CONTACT_EMAIL with a mailto: link, "On this page" lists every section,
 *    translated meta description, the "not legal advice" note exists only as an HTML comment (never visible),
 *    and no request leaves the site except Google Fonts.
 * 3. Desktop 1280 px, live language switch en→hi→ur, dark theme, file://, missing contact e-mail fallback.
 * Screenshots: tools/shots/legal/ (<page>-hi-mobile, <page>-ur-mobile, <page>-en-desktop, <page>-en-dark-mobile …). */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), vm = require('vm');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const LANGS = ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur'];
const PAGES = { privacy: 'legal/privacy-strings.js', terms: 'legal/terms-strings.js' };
const SCRIPTS = { deva: /[\u0900-\u0963\u0966-\u097F]/, beng: /[\u0980-\u09FF]/, guru: /[\u0A00-\u0A7F]/, gujr: /[\u0A80-\u0AFF]/, orya: /[\u0B00-\u0B7F]/, taml: /[\u0B80-\u0BFF]/, telu: /[\u0C00-\u0C7F]/, knda: /[\u0C80-\u0CFF]/, mlym: /[\u0D00-\u0D7F]/, arab: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/ };
const LANG_SCRIPT = { hi: 'deva', mr: 'deva', bn: 'beng', pa: 'guru', gu: 'gujr', or: 'orya', ta: 'taml', te: 'telu', kn: 'knda', ml: 'mlym', ur: 'arab' };
const CHROME = require('../chrome-path')();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const ALLOWED_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const SHOTS = path.join(ROOT, 'tools', 'shots', 'legal');

const errors = [], warnings = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) errors.push(msg); return cond; };

function loadTable(rel) {
  const sb = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sb, { filename: rel });
  return sb.window.APP_STRINGS;
}

function checkTable(table, label) {
  if (!ok(table && table.en, `${label}: window.APP_STRINGS.en missing`)) return;
  const en = table.en, keys = Object.keys(en);
  const ph = s => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
  for (const L of LANGS) {
    const S = table[L];
    if (!ok(S, `${label}: language ${L} missing`)) continue;
    const miss = keys.filter(k => !(k in S)), extra = Object.keys(S).filter(k => !(k in en));
    ok(!miss.length, `${label}[${L}]: missing keys ${miss.slice(0, 8).join(', ')}`);
    ok(!extra.length, `${label}[${L}]: extra keys ${extra.slice(0, 8).join(', ')}`);
    for (const k of keys) {
      const v = S[k];
      if (typeof v !== 'string') continue;
      ok(v.trim() !== '', `${label}[${L}].${k}: empty`);
      ok(ph(v) === ph(en[k]), `${label}[${L}].${k}: placeholders differ`);
      if (L === 'en') continue;
      for (const [sc, re] of Object.entries(SCRIPTS)) if (sc !== LANG_SCRIPT[L] && re.test(v)) { ok(false, `${label}[${L}].${k}: contains ${sc} script`); break; }
      if (v === en[k] && /[A-Za-z]{4,}/.test(v)) warnings.push(`${label}[${L}].${k}: same as English`);
    }
  }
  for (const k of ['privacy_title', 'terms_title', 'effective']) ok(k in en, `${label}: key ${k} missing`);
}

/* Runs inside the page. */
function analyze() {
  const S = window.APP_STRINGS || {}, L = document.documentElement.lang, en = S.en || {}, cur = S[L] || {};
  const keys = new Set(Object.keys(en));
  const curVals = new Set(Object.values(cur).filter(v => typeof v === 'string').map(v => v.trim()));
  const visible = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const out = {
    lang: L, dir: document.documentElement.dir, ready: !!window.EDU_READY,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    rawKeys: [], placeholders: [], emptyI18n: [], wide: [],
    title: document.title, desc: (document.querySelector('meta[name="description"]') || {}).content || '',
    heading: (document.getElementById('edu-title') || {}).textContent || '',
    sections: [...document.querySelectorAll('#legal > section[id]:not(.legal-short)')].map(s => ({ id: s.id, h: (s.querySelector('h2') || {}).textContent || '' })),
    toc: [...document.querySelectorAll('#toc a')].map(a => ({ href: a.getAttribute('href'), text: a.textContent })),
    email: (document.getElementById('email') || {}).textContent || '',
    emailHref: (document.getElementById('email') || { getAttribute: () => '' }).getAttribute('href') || '',
    mailBtn: (document.getElementById('mail-btn') || { getAttribute: () => '' }).getAttribute('href') || '',
    contactShown: !!(document.getElementById('contact-ok') && visible(document.getElementById('contact-ok'))),
    noEmailShown: !!(document.getElementById('no-email') && visible(document.getElementById('no-email'))),
    otherLinks: [...document.querySelectorAll('a.other-page')].map(a => a.getAttribute('href')),
    bodyText: document.body.innerText,
    comment: (() => { const w = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT); let c, all = ''; while ((c = w.nextNode())) all += c.nodeValue; return all; })(),
    textCount: 0
  };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const txt = n.nodeValue.trim();
    if (!txt) continue;
    const p = n.parentElement;
    if (!p || p.closest('script,style,textarea,code,pre,option,.no-i18n,.edu-lang') || !visible(p)) continue;
    out.textCount++;
    if (keys.has(txt) && !curVals.has(txt)) out.rawKeys.push(txt);
    if (/\{\w+\}/.test(txt)) out.placeholders.push(txt.slice(0, 60));
  }
  document.querySelectorAll('[data-i18n]').forEach(e => { if (visible(e) && !e.textContent.trim()) out.emptyI18n.push(e.getAttribute('data-i18n')); });
  const vw = window.innerWidth;
  document.querySelectorAll('main *').forEach(e => {
    const r = e.getBoundingClientRect();
    if (r.width > 0 && (r.right > vw + 1 || r.left < -1) && !e.closest('.scroll-x')) out.wide.push((e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + [...e.classList].join('.')) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
  });
  out.wide = out.wide.slice(0, 5);
  return out;
}

(async () => {
  /* ---------- 1. string tables ---------- */
  const tables = {};
  for (const [pg, rel] of Object.entries(PAGES)) {
    try { tables[pg] = loadTable(rel); checkTable(tables[pg], path.basename(rel)); }
    catch (e) { ok(false, `${rel}: does not evaluate: ${e.message}`); }
  }
  if (tables.privacy && tables.terms) {
    const shared = Object.keys(tables.privacy.en || {}).filter(k => k in (tables.terms.en || {}));
    ok(shared.length >= 10, `only ${shared.length} shared keys between the two string files`);
    for (const L of LANGS) for (const k of shared) {
      const a = (tables.privacy[L] || {})[k], b = (tables.terms[L] || {})[k];
      ok(a === b, `shared key ${L}.${k} differs between privacy-strings.js and terms-strings.js`);
    }
  }
  for (const pg of Object.keys(PAGES)) {
    const html = fs.readFileSync(path.join(ROOT, 'legal', pg + '.html'), 'utf8');
    ok(/<main[^>]+id=["']app["']/.test(html), `${pg}.html: needs <main id="app">`);
    ok(!/\b(gtag|google-analytics|googletagmanager|facebook\.net|clarity\.ms|hotjar)\b/i.test(html), `${pg}.html: tracking script found`);
    ok(/<!--[\s\S]*NOT LEGAL ADVICE[\s\S]*lawyer[\s\S]*-->/.test(html), `${pg}.html: "not legal advice / lawyer review" HTML comment missing`);
    const order = ['../shared/edu.js', pg + '-strings.js', '../shared/firebase-config.js', 'legal.js'].map(s => html.indexOf('src="' + s + '"'));
    ok(order.every(i => i > 0) && order.every((v, i) => !i || v > order[i - 1]), `${pg}.html: script order must be edu.js → ${pg}-strings.js → firebase-config.js → legal.js`);
  }

  /* ---------- 2./3. browser ---------- */
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const fp = path.join(ROOT, p);
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(fp).pipe(res);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  fs.mkdirSync(SHOTS, { recursive: true });
  const contact = (() => { const sb = { window: {} }; try { vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'shared/firebase-config.js'), 'utf8'), sb); } catch (e) { } return sb.window.EDU_CONTACT_EMAIL || ''; })();
  ok(/@/.test(contact), 'shared/firebase-config.js: window.EDU_CONTACT_EMAIL is not set');

  async function open(pg, lang, viewport, opts = {}) {
    const ctx = await browser.newContext({ viewport, colorScheme: opts.dark ? 'dark' : 'light', locale: 'en-IN' });
    if (opts.init) await ctx.addInitScript(opts.init);
    const page = await ctx.newPage();
    const log = [], external = [];
    page.on('console', m => { const tx = m.text(); if (tx.startsWith('[i18n-missing]') || m.type() === 'error') log.push(tx.slice(0, 200)); });
    page.on('pageerror', e => log.push('pageerror: ' + String(e).slice(0, 300)));
    page.on('request', r => { const u = r.url(); if (/^https?:/.test(u) && !u.startsWith(base)) { const h = new URL(u).hostname; if (!ALLOWED_HOSTS.includes(h)) external.push(u.slice(0, 120)); } });
    page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) log.push(r.status() + ' ' + r.url()); });
    const url = (opts.file ? 'file:///' + path.join(ROOT, 'legal', pg + '.html').replace(/\\/g, '/') : base + 'legal/' + pg + '.html') + (lang ? '?lang=' + lang : '') + (opts.hash || '');
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(opts.wait || 700);
    return { ctx, page, log, external };
  }

  function judge(where, pg, L, a, log, external, mobile) {
    const S = tables[pg] || {}, T = S[L] || {};
    for (const l of log) {
      if (/Failed to load resource|net::ERR_/.test(l) && !/127\.0\.0\.1/.test(l)) { warnings.push(`${where}: ${l}`); continue; }
      ok(false, `${where}: console: ${l}`);
    }
    ok(!external.length, `${where}: request to another site: ${external.slice(0, 3).join(' | ')}`);
    if (!ok(a, `${where}: page could not be analysed`)) return;
    ok(a.ready, `${where}: EDU.init not called`);
    ok(a.lang === L, `${where}: <html lang> is ${a.lang}, expected ${L}`);
    ok(a.dir === (L === 'ur' ? 'rtl' : 'ltr'), `${where}: dir is ${a.dir}`);
    ok(!a.rawKeys.length, `${where}: raw keys on screen: ${a.rawKeys.slice(0, 6).join(' | ')}`);
    ok(!a.placeholders.length, `${where}: unfilled {placeholders}: ${a.placeholders.slice(0, 3).join(' | ')}`);
    ok(!a.emptyI18n.length, `${where}: empty translated elements: ${a.emptyI18n.slice(0, 6).join(', ')}`);
    ok(a.textCount > 40, `${where}: only ${a.textCount} text nodes`);
    if (mobile) {
      ok(a.overflow <= 1, `${where}: horizontal overflow ${a.overflow}px`);
      ok(!a.wide.length, `${where}: elements wider than the screen: ${a.wide.join(' | ')}`);
    }
    ok(a.heading === T[pg + '_title'], `${where}: header title "${a.heading}" is not ${pg}_title`);
    ok(a.title.indexOf(T[pg + '_title']) === 0, `${where}: document.title "${a.title}"`);
    ok(a.desc === T[(pg === 'terms' ? 't_' : 'p_') + 'doc_desc'], `${where}: meta description not translated`);
    ok(a.sections.length >= 10, `${where}: only ${a.sections.length} sections`);
    ok(a.toc.length === a.sections.length && a.toc.every((x, i) => x.href === '#' + a.sections[i].id && x.text === a.sections[i].h && x.text.trim()),
      `${where}: "On this page" does not match the sections`);
    ok(a.contactShown && !a.noEmailShown, `${where}: contact e-mail block not shown`);
    ok(a.email === contact, `${where}: e-mail shown "${a.email}", expected "${contact}"`);
    ok(a.emailHref.indexOf('mailto:' + contact + '?subject=') === 0 && a.mailBtn === a.emailHref, `${where}: mailto link wrong: ${a.emailHref.slice(0, 80)}`);
    const other = pg === 'terms' ? 'privacy' : 'terms';
    ok(a.otherLinks.length >= 2 && a.otherLinks.every(h => h === other + '.html?lang=' + L), `${where}: links to the ${other} page: ${a.otherLinks.join(', ')}`);
    ok(/NOT LEGAL ADVICE/.test(a.comment) && !/legal advice|lawyer/i.test(a.bodyText), `${where}: the "not legal advice" note must be an HTML comment only`);
    ok(a.bodyText.indexOf(T.effective) >= 0, `${where}: effective date not shown`);
  }

  for (const pg of Object.keys(PAGES)) {
    for (let i = 0; i < LANGS.length; i += 4) await Promise.all(LANGS.slice(i, i + 4).map(async L => {
      const { ctx, page, log, external } = await open(pg, L, { width: 390, height: 844 });
      const a = await page.evaluate(analyze).catch(e => { log.push('pageerror: analyze ' + e.message); return null; });
      judge(`${pg}/${L}/390`, pg, L, a, log, external, true);
      if (a) ok(!(await page.evaluate(() => document.getElementById('toc-box').open)), `${pg}/${L}/390: "On this page" should start folded on phones`);
      if (['hi', 'ur', 'ta', 'bn', 'en'].includes(L)) await page.screenshot({ path: path.join(SHOTS, `${pg}-${L}-mobile.png`), fullPage: true });
      await ctx.close();
    }));

    { /* desktop + live switch */
      const { ctx, page, log, external } = await open(pg, 'en', { width: 1280, height: 800 });
      judge(`${pg}/en/desktop`, pg, 'en', await page.evaluate(analyze), log, external, false);
      ok(await page.evaluate(() => document.getElementById('toc-box').open), `${pg}/desktop: "On this page" should be open on wide screens`);
      await page.screenshot({ path: path.join(SHOTS, `${pg}-en-desktop.png`) });
      await page.screenshot({ path: path.join(SHOTS, `${pg}-en-desktop-full.png`), fullPage: true });
      for (const L of ['hi', 'ur']) {
        await page.selectOption('#edu-lang', L);
        await page.waitForTimeout(400);
        judge(`${pg}/switch→${L}`, pg, L, await page.evaluate(analyze), log.splice(0), external, false);
      }
      await page.screenshot({ path: path.join(SHOTS, `${pg}-ur-desktop.png`) });
      await ctx.close();
    }
    { /* dark theme */
      const { ctx, page, log, external } = await open(pg, 'en', { width: 390, height: 844 }, { dark: true });
      judge(`${pg}/en/dark`, pg, 'en', await page.evaluate(analyze), log, external, true);
      await page.screenshot({ path: path.join(SHOTS, `${pg}-en-dark-mobile.png`), fullPage: true });
      await ctx.close();
    }
    { /* jump link from an app, e.g. privacy.html#students */
      const target = pg === 'privacy' ? 'students' : 'use';
      const { ctx, page } = await open(pg, 'hi', { width: 390, height: 844 }, { hash: '#' + target, wait: 1200 });
      const top = await page.evaluate(id => document.getElementById(id).getBoundingClientRect().top, target);
      ok(top > -5 && top < 200, `${pg}#${target}: the section is not scrolled into view (top ${Math.round(top)}px)`);
      await ctx.close();
    }
    { /* mobile TOC tap → section in view, list folds */
      const { ctx, page } = await open(pg, 'en', { width: 390, height: 844 });
      await page.click('#toc-h');
      await page.click('#toc li:nth-child(5) a');
      await page.waitForTimeout(300);
      const st = await page.evaluate(() => { const id = document.querySelector('#toc li:nth-child(5) a').getAttribute('href').slice(1); return { open: document.getElementById('toc-box').open, top: document.getElementById(id).getBoundingClientRect().top }; });
      ok(!st.open && st.top > -5 && st.top < 200, `${pg}: tapping an "On this page" link should jump and fold the list (${JSON.stringify(st)})`);
      await ctx.close();
    }
    { /* no contact e-mail configured (neither EDU_CONTACT_EMAIL nor EDU.SITE.contact) → YouTube fallback, still no errors */
      const { ctx, page, log, external } = await open(pg, 'en', { width: 390, height: 844 });
      const st = await page.evaluate(() => {
        window.EDU_CONTACT_EMAIL = ''; EDU.SITE.contact = ''; EDU.setLang('ta');
        return { shown: !document.getElementById('no-email').hidden, ok: document.getElementById('contact-ok').hidden, yt: document.getElementById('yt-link').getAttribute('href') };
      });
      ok(st.shown && st.ok && /^https:\/\/www\.youtube\.com\//.test(st.yt || ''), `${pg}: fallback without EDU_CONTACT_EMAIL is wrong ${JSON.stringify(st)}`);
      ok(!log.length && !external.length, `${pg}: errors without EDU_CONTACT_EMAIL: ${log.concat(external).slice(0, 3).join(' | ')}`);
      await ctx.close();
    }
    { /* file:// (downloaded ZIP) */
      const { ctx, page, log } = await open(pg, 'hi', { width: 1280, height: 800 }, { file: true });
      const st = await page.evaluate(() => ({ ready: !!window.EDU_READY, lang: document.documentElement.lang, email: (document.getElementById('email') || {}).textContent }));
      ok(st.ready && st.lang === 'hi' && st.email === contact, `${pg}/file://: page did not start correctly ${JSON.stringify(st)}`);
      for (const l of log) if (/pageerror|i18n-missing/.test(l)) ok(false, `${pg}/file://: ${l}`);
      await ctx.close();
    }
  }

  await browser.close();
  srv.close();
  const uniq = [...new Set(errors)];
  console.log(`\n=== legal pages: ${uniq.length ? 'FAIL' : 'PASS'} (${checks} checks, ${uniq.length} errors, ${warnings.length} warnings) ===`);
  for (const e of (process.env.LEGAL_ALL ? uniq : uniq.slice(0, 80))) console.log('ERROR  ' + e);
  for (const w of [...new Set(warnings)].slice(0, 30)) console.log('warn   ' + w);
  console.log('screenshots: tools/shots/legal/');
  process.exit(uniq.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
