#!/usr/bin/env node
/* Check the site-wide "get updates" reminder of the EDU shell (ctaInit in shared/edu.js, styles in shared/edu.css).
 *
 *   node tools/tests/_cta.check.js          (from the project root; exit code 0 = PASS)
 *
 * Uses Playwright's fake clock, so the 45-second and 6-second waits take no real time.
 * 1. Strings: shell_cta / shell_cta_hide in EDU.COMMON for all 12 languages.
 * 2. First page view: nothing on first paint, nothing after 60 s of no use or 30 s of use; shown after 45 s of real use.
 * 3. Second page view: shown a few seconds after the page opened (not at first paint); in all 12 languages at 390 px it is
 *    a bar in the page flow between the app and the footer (not fixed, never over the app, no sideways scroll), with
 *    the translated text, a link to <site>/index.html?lang=<lang>#updates and a translated ✕ label; Urdu is right-to-left.
 * 4. Wide screen (1280 px): a pill inside the header; the header does not grow and the app does not move.
 * 5. ✕ hides it (30 days, remembered in EDU.store('cta')), and it comes back after 31 days; following the link hides
 *    it for 7 days and lands on the home page's form; a sign-up on this browser hides it for good.
 * 6. Never in full screen / projector (present) mode; never on the home, schools or business pages, the Live Class
 *    Quiz screens, file:// or inside a frame. A live language switch re-translates it.
 * 7. No console errors, no requests to other sites (Google Fonts allowed).
 * Screenshots: tools/shots/cta/. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), vm = require('vm');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const LANGS = ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur'];
const CHROME = require('../chrome-path')();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf', '.wasm': 'application/wasm' };
const SHOTS = path.join(ROOT, 'tools', 'shots', 'cta');
const APPS = ['unit-converter', 'phishing-spotter', 'whiteboard', 'gst-calculator'];   /* a school app, a present-mode app, a full-canvas app, a work tool */
const DAY = 86400000;

const errors = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) errors.push(msg); return !!cond; };

function commonStrings() {
  const sb = { window: {} };
  const code = fs.readFileSync(path.join(ROOT, 'shared', 'edu.js'), 'utf8').replace(/document\.currentScript[^;]*;/, 'null;');
  vm.runInNewContext(code, Object.assign(sb, { document: { currentScript: null, addEventListener() {}, documentElement: { setAttribute() {}, getAttribute() {}, classList: { toggle() {} } } }, navigator: {}, location: { search: '' }, URLSearchParams, matchMedia: () => ({ matches: false, addEventListener() {} }) }));
  return sb.window.EDU.COMMON;
}

/* in the page: where the reminder is and what it says */
function ctaState() {
  const c = document.getElementById('edu-cta');
  const r = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top + window.scrollY, w: b.width, h: b.height, b: b.bottom + window.scrollY }; };
  const main = document.querySelector('main'), foot = document.querySelector('.edu-foot'), top = document.querySelector('.edu-top');
  const link = document.getElementById('edu-cta-link'), x = document.getElementById('edu-cta-x');
  const vis = !!c && getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().height > 0;
  return {
    present: !!c, visible: vis, inHeader: !!c && !!c.closest('.edu-top'), inRow: !!c && !!c.closest('#edu-cta-row'),
    rowBeforeFoot: !!document.getElementById('edu-cta-row') && document.getElementById('edu-cta-row').nextElementSibling === foot,
    rowAfterMain: (() => {      /* only invisible things (scripts) between the app's <main> and the bar */
      const row = document.getElementById('edu-cta-row');
      if (!row || !main || main.parentNode !== row.parentNode) return false;
      for (let e = main.nextElementSibling; e && e !== row; e = e.nextElementSibling) if (e.getBoundingClientRect().height > 0) return false;
      return !!(main.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING);
    })(),
    position: c ? getComputedStyle(c.closest('#edu-cta-row') || c).position : null,
    text: link ? link.textContent.trim() : null, href: link ? link.getAttribute('href') : null,
    xLabel: x ? x.getAttribute('aria-label') : null, xTitle: x ? x.getAttribute('title') : null,
    cta: r(c), link: r(link), x: r(x), main: r(main), foot: r(foot), top: r(top), title: r(document.getElementById('edu-title')),
    lang: document.documentElement.lang, dir: document.documentElement.dir,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    store: { views: localStorage.getItem('edu.cta.views'), off: localStorage.getItem('edu.cta.off'), joined: localStorage.getItem('edu.cta.joined') }
  };
}

(async () => {
  /* ---------- 1. strings */
  const C = commonStrings();
  for (const L of LANGS) for (const k of ['shell_cta', 'shell_cta_hide']) ok(C[L] && typeof C[L][k] === 'string' && C[L][k].trim(), `EDU.COMMON.${L}.${k} missing`);
  for (const L of LANGS.slice(1)) ok(C[L].shell_cta !== C.en.shell_cta, `EDU.COMMON.${L}.shell_cta is still English`);

  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const fp = path.join(ROOT, p);
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(fp).pipe(res);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  fs.mkdirSync(SHOTS, { recursive: true });

  /* a fresh browser (empty storage) with a fake clock */
  async function fresh(viewport, opts = {}) {
    const ctx = await browser.newContext({ viewport, colorScheme: opts.dark ? 'dark' : 'light', locale: 'en-IN', serviceWorkers: 'block', reducedMotion: 'reduce' });   /* the fade-in would freeze under the fake clock */
    const page = await ctx.newPage();
    const log = [], external = [];
    page.on('console', m => { const tx = m.text(); if (tx.startsWith('[i18n-missing]') || m.type() === 'error') log.push(tx.slice(0, 200)); });
    page.on('pageerror', e => log.push('pageerror: ' + String(e).slice(0, 300)));
    page.on('dialog', d => d.accept().catch(() => { }));
    page.on('request', r => { const u = r.url(); if (/^https?:/.test(u) && !u.startsWith(base) && !/fonts\.(googleapis|gstatic)\.com/.test(u)) external.push(u.slice(0, 120)); });
    await page.clock.install({ time: opts.time || Date.parse('2026-10-04T10:00:00Z') });
    return { ctx, page, log, external };
  }
  const go = (page, rel, lang) => page.goto(base + rel + (lang ? (rel.includes('?') ? '&' : '?') + 'lang=' + lang : ''), { waitUntil: 'load' });
  const st = page => page.evaluate(ctaState);
  /* real use: a click on a harmless spot (the intro text) every 2 s of fake time */
  async function use(page, seconds) {
    for (let s = 0; s < seconds; s += 2) {
      await page.mouse.move(5, 300 + (s % 7));
      await page.keyboard.press('Shift');
      await page.clock.runFor(2000);
    }
  }
  const finish = async (where, h) => {
    for (const l of h.log) ok(false, `${where}: console: ${l}`);
    ok(!h.external.length, `${where}: request to another site: ${h.external.join(' | ')}`);
    await h.ctx.close();
  };

  try {
    const app = 'apps/' + APPS[0] + '/index.html';

    /* ---------- 2. first page view */
    {
      const h = await fresh({ width: 390, height: 844 });
      await go(h.page, app, 'en');
      let s = await st(h.page);
      ok(!s.present && s.store.views === '1', `first view, first paint: no reminder (views ${s.store.views})`);
      await h.page.clock.runFor(60000);
      s = await st(h.page);
      ok(!s.present, 'first view: 60 s without any use → still nothing');
      await use(h.page, 30);
      s = await st(h.page);
      ok(!s.present, 'first view: 30 s of use → still nothing');
      await use(h.page, 20);
      s = await st(h.page);
      ok(s.present && s.visible && s.inRow, 'first view: shown after 45 s of real use (bar above the footer on a phone)');
      await finish('first view', h);
    }

    /* ---------- 3. second page view, every language, phone */
    for (let i = 0; i < LANGS.length; i += 4) await Promise.all(LANGS.slice(i, i + 4).map(async (L) => {
      const h = await fresh({ width: 390, height: 844 }, { dark: L === 'en' });
      const where = `${APPS[0]}/${L}/390`;
      await go(h.page, app, L);
      await go(h.page, app, L);
      let s = await st(h.page);
      ok(!s.present && s.store.views === '2', `${where}: second view, first paint: nothing yet`);
      await h.page.clock.runFor(3500);
      ok(!(await st(h.page)).present, `${where}: not at 3 s`);
      await h.page.clock.runFor(4000);
      s = await st(h.page);
      if (ok(s.present && s.visible, `${where}: shown about 6 s after the second page view opened`)) {
        ok(s.inRow && s.rowAfterMain && s.rowBeforeFoot && s.position === 'static', `${where}: a bar in the page flow between the app and the footer (${JSON.stringify({ inRow: s.inRow, a: s.rowAfterMain, b: s.rowBeforeFoot, pos: s.position })})`);
        ok(s.cta.y >= s.main.b - 1 && s.cta.b <= s.foot.y + 1, `${where}: does not overlap the app or the footer`);
        ok(s.text === '📩' + C[L].shell_cta || s.text === '📩 ' + C[L].shell_cta || s.text.replace(/\s+/g, '') === ('📩' + C[L].shell_cta).replace(/\s+/g, ''), `${where}: text "${s.text}"`);
        ok(s.href === base + 'index.html?lang=' + L + '#updates', `${where}: link ${s.href}`);
        ok(s.xLabel === C[L].shell_cta_hide && s.xTitle === C[L].shell_cta_hide, `${where}: ✕ label "${s.xLabel}"`);
        ok(s.x.w >= 40 && s.x.h >= 40 && s.link.h >= 40, `${where}: touch targets ≥ 40 px (${Math.round(s.x.w)}×${Math.round(s.x.h)}, link ${Math.round(s.link.h)})`);
        ok(s.overflow <= 1, `${where}: horizontal overflow ${s.overflow}px`);
        ok(s.cta.x >= 0 && s.cta.x + s.cta.w <= 390.5, `${where}: inside the screen`);
        if (L === 'ur') ok(s.dir === 'rtl' && s.x.x < s.link.x, `${where}: right-to-left (✕ on the left)`);
        if (['hi', 'ta', 'ur', 'en'].includes(L)) {
          await h.page.evaluate(() => document.getElementById('edu-cta').scrollIntoView({ block: 'center' }));
          await h.page.screenshot({ path: path.join(SHOTS, `${L}${L === 'en' ? '-dark' : ''}-mobile.png`) });
        }
      }
      await finish(where, h);
    }));

    /* other apps at 390 px (Hindi): same rules */
    for (const slug of APPS.slice(1)) {
      const h = await fresh({ width: 390, height: 844 });
      const where = `${slug}/hi/390`;
      await go(h.page, `apps/${slug}/index.html`, 'hi');
      await go(h.page, `apps/${slug}/index.html`, 'hi');
      await h.page.clock.runFor(7000);
      const s = await st(h.page);
      if (ok(s.present && s.visible && s.inRow && s.position === 'static', `${where}: bar shown in the page flow`)) {
        ok(s.cta.y >= s.main.b - 1 && s.overflow <= 1, `${where}: below the app, no sideways scroll`);
        await h.page.evaluate(() => document.getElementById('edu-cta').scrollIntoView({ block: 'center' }));
        await h.page.screenshot({ path: path.join(SHOTS, `${slug}-hi-mobile.png`) });
      }
      await finish(where, h);
    }

    /* ---------- 4. wide screen: a pill in the header */
    for (const slug of [APPS[0], APPS[3]]) for (const L of ['en', 'ml']) {
      const h = await fresh({ width: 1280, height: 800 });
      const where = `${slug}/${L}/1280`;
      await go(h.page, `apps/${slug}/index.html`, L);
      await go(h.page, `apps/${slug}/index.html`, L);
      const before = await st(h.page);
      await h.page.clock.runFor(7000);
      const s = await st(h.page);
      if (ok(s.present && s.visible && s.inHeader, `${where}: a pill in the header`)) {
        ok(Math.abs(s.top.h - before.top.h) <= 1 && Math.abs(s.main.y - before.main.y) <= 1, `${where}: the header does not grow and the app does not move (${before.top.h}→${s.top.h})`);
        ok(s.title.w >= 150, `${where}: the app title keeps room (${Math.round(s.title.w)} px)`);
        ok(s.cta.y < s.top.b && s.overflow <= 1, `${where}: inside the header, no sideways scroll`);
        if (L === 'en') await h.page.screenshot({ path: path.join(SHOTS, `${slug}-en-desktop.png`) });
      }
      /* resizing to a tablet moves it into the page flow */
      await h.page.setViewportSize({ width: 820, height: 1000 });
      await h.page.waitForTimeout(50);
      const t2 = await st(h.page);
      ok(t2.present && t2.inRow && !t2.inHeader, `${where}: at 820 px it moves to the bar above the footer`);
      await finish(where, h);
    }

    /* ---------- 5. ✕ for 30 days, the link for 7 days, a sign-up for good */
    {
      const T0 = Date.parse('2026-10-04T10:00:00Z');
      const h = await fresh({ width: 390, height: 844 }, { time: T0 });
      await go(h.page, app, 'en'); await go(h.page, app, 'en');
      await h.page.clock.runFor(7000);
      await h.page.click('#edu-cta-x');
      let s = await st(h.page);
      const off = Number(JSON.parse(s.store.off || '0'));
      ok(!s.present && !(await h.page.$('#edu-cta-row')), '✕ removes the reminder at once');
      ok(Math.abs(off - (T0 + 7000 + 30 * DAY)) < 60000, `✕ is remembered for 30 days (off=${new Date(off).toISOString()})`);
      await go(h.page, app, 'en');
      await h.page.clock.runFor(60000);
      await use(h.page, 50);
      ok(!(await st(h.page)).present, 'after ✕: not shown again on the next page views');
      await h.page.clock.setSystemTime(T0 + 31 * DAY);
      await go(h.page, app, 'en');
      await h.page.clock.runFor(7000);
      ok((await st(h.page)).present, 'after 31 days it comes back');
      /* following the link: lands on the home page's form, hidden for 7 days */
      await Promise.all([h.page.waitForURL(/index\.html\?lang=en#updates$/), h.page.click('#edu-cta-link')]);
      await h.page.clock.runFor(1500);
      const land = await h.page.evaluate(() => { const u = document.getElementById('updates'); const r = u && u.getBoundingClientRect(); return { has: !!u && !!document.getElementById('su-form'), top: r ? r.top : null, h: innerHeight }; });
      ok(land.has && land.top !== null && land.top < land.h && land.top > -400, `the link lands on the home page with the form in view (top ${land.top})`);
      s = await st(h.page);
      ok(!s.present, 'no reminder on the home page itself');
      ok(Math.abs(Number(JSON.parse(s.store.off)) - (T0 + 31 * DAY + 7000 + 7 * DAY)) < 120000, 'following the link hides it for 7 days');
      await go(h.page, app, 'en');
      await h.page.clock.runFor(7000);
      ok(!(await st(h.page)).present, 'not shown within the 7 days after following the link');
      /* a sign-up on this browser (the form sets edu.cta.joined): never again */
      await h.page.clock.setSystemTime(T0 + 400 * DAY);
      await h.page.evaluate(() => localStorage.setItem('edu.cta.joined', JSON.stringify(Date.now())));
      await go(h.page, app, 'en');
      await h.page.clock.runFor(7000);
      ok(!(await st(h.page)).present, 'after a sign-up on this browser: never shown');
      await finish('dismiss', h);
    }

    /* ---------- 6. full screen / projector mode, excluded pages, file://, frames, language switch */
    {
      const h = await fresh({ width: 1280, height: 800 });
      await go(h.page, app, 'en'); await go(h.page, app, 'en');
      await h.page.evaluate(() => document.documentElement.classList.add('presenting'));
      await h.page.clock.runFor(15000);
      ok(!(await st(h.page)).present, 'projector (present) mode: not shown while it is on');
      await h.page.evaluate(() => document.documentElement.classList.remove('presenting'));
      await h.page.clock.runFor(3500);
      let s = await st(h.page);
      ok(s.present && s.visible, 'shown once projector mode ends');
      await h.page.evaluate(() => document.documentElement.classList.add('edu-fullscreen-on'));
      ok(!(await st(h.page)).visible, 'full screen (edu-fullscreen-on): hidden');
      await h.page.evaluate(() => document.documentElement.classList.remove('edu-fullscreen-on'));
      await h.page.evaluate(() => { const d = document.createElement('div'); d.className = 'present'; d.id = 'tmp-present'; document.querySelector('main').appendChild(d); });
      ok(!(await st(h.page)).visible, 'a .present (projector) block on the page: hidden');
      await h.page.evaluate(() => document.getElementById('tmp-present').remove());
      ok((await st(h.page)).visible, 'visible again afterwards');
      /* live language switch */
      await h.page.selectOption('#edu-lang', 'te');
      s = await st(h.page);
      ok(s.text.indexOf(C.te.shell_cta) >= 0 && s.href === base + 'index.html?lang=te#updates' && s.xLabel === C.te.shell_cta_hide, `language switch re-translates it (${s.text} ${s.href})`);
      await finish('present/lang', h);
    }
    for (const [rel, label] of [['index.html', 'home'], ['schools.html', 'schools'], ['business.html', 'business'], ['apps/live-quiz/index.html', 'live-quiz'], ['apps/quiz-join/index.html', 'quiz-join'], ['legal/privacy.html', 'privacy']]) {
      const h = await fresh({ width: 390, height: 844 });
      await go(h.page, rel, 'en'); await go(h.page, rel, 'en');
      await h.page.clock.runFor(10000);
      await use(h.page, 50);
      ok(!(await st(h.page)).present, `${label}: never shown there`);
      await h.ctx.close();
    }
    {
      const h = await fresh({ width: 390, height: 844 });
      const url = 'file:///' + path.join(ROOT, app).replace(/\\/g, '/');
      await h.page.goto(url); await h.page.goto(url);
      await h.page.clock.runFor(10000);
      ok(!(await st(h.page)).present, 'file:// (downloaded ZIP): never shown');
      await h.page.goto(base + 'tools/package.json');
      await h.page.setContent(`<iframe id="f" src="${base + app}" style="width:390px;height:600px"></iframe>`);
      await h.page.waitForTimeout(300);
      await h.page.evaluate(() => { document.getElementById('f').contentWindow.location.reload(); });
      await h.page.waitForTimeout(300);
      await h.page.clock.runFor(10000);
      const inFrame = await h.page.frames()[1].evaluate(() => !!document.getElementById('edu-cta')).catch(() => false);
      ok(!inFrame, 'inside a frame: never shown');
      await h.ctx.close();
    }
  } catch (e) {
    ok(false, 'test crashed: ' + (e && e.stack || e));
  }

  await browser.close();
  srv.close();
  const uniq = [...new Set(errors)];
  console.log(`\n=== updates reminder (shell CTA): ${uniq.length ? 'FAIL' : 'PASS'} (${checks} checks, ${uniq.length} errors) ===`);
  for (const e of uniq.slice(0, 80)) console.log('ERROR  ' + e);
  console.log('screenshots: tools/shots/cta/');
  process.exit(uniq.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
