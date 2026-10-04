#!/usr/bin/env node
/* Check the "Stay updated" sign-up form (shared/signup.js + shared/signup-strings.js) on index.html, schools.html and
 * business.html, in Demo mode (local server, so nothing reaches Firebase).
 *
 *   node tools/tests/_signup.check.js          (from the project root; exit code 0 = PASS)
 *
 * 1. String table: 12 languages, identical keys, same {placeholders}, no empty values, no text in the wrong script.
 * 2. Every language renders on a phone (390 px): translated title, labels, options and consent text, <html lang>/dir,
 *    no horizontal scroll, no console errors; a live language switch re-translates the form and keeps what was typed.
 * 3. Validation: empty form, bad email, no role, no topic, no consent → translated errors, nothing saved.
 * 4. Honeypot: a bot that fills the hidden field sees "thank you", nothing is saved.
 * 5. Success: exactly the agreed fields are saved (Demo mode, marked demo:true) with page + language; "Add another".
 * 6. Errors from the backend (offline, quota, refused) → translated messages + an email link to CONTACT_EMAIL.
 * 7. No request leaves the site while the form is used; file:// shows a note and an email link instead of the form.
 * Screenshots: tools/shots/signup/ (home-hi-mobile, home-ur-mobile, home-en-dark-mobile, schools-en-desktop, …). */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), vm = require('vm');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const LANGS = ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur'];
const PAGES = { home: 'index.html', schools: 'schools.html', business: 'business.html' };
const SCRIPTS = { deva: /[\u0900-\u0963\u0966-\u097F]/, beng: /[\u0980-\u09FF]/, guru: /[\u0A00-\u0A7F]/, gujr: /[\u0A80-\u0AFF]/, orya: /[\u0B00-\u0B7F]/, taml: /[\u0B80-\u0BFF]/, telu: /[\u0C00-\u0C7F]/, knda: /[\u0C80-\u0CFF]/, mlym: /[\u0D00-\u0D7F]/, arab: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/ };
const LANG_SCRIPT = { hi: 'deva', mr: 'deva', bn: 'beng', pa: 'guru', gu: 'gujr', or: 'orya', ta: 'taml', te: 'telu', kn: 'knda', ml: 'mlym', ur: 'arab' };
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain' };
const SHOTS = path.join(ROOT, 'tools', 'shots', 'signup');
const FIELDS = ['name', 'email', 'role', 'org', 'place', 'prefLang', 'topics', 'consent', 'lang', 'page', 'createdAt', 'uid', 'demo'];

const errors = [], warnings = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) errors.push(msg); return !!cond; };

function loadTable() {
  const sb = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'shared/signup-strings.js'), 'utf8'), sb);
  return sb.window.SIGNUP_STRINGS;
}
function checkTable(T) {
  if (!ok(T && T.en, 'SIGNUP_STRINGS.en missing')) return;
  const en = T.en, keys = Object.keys(en), ph = s => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
  for (const L of LANGS) {
    const S = T[L];
    if (!ok(S, `language ${L} missing`)) continue;
    const miss = keys.filter(k => !(k in S)), extra = Object.keys(S).filter(k => !(k in en));
    ok(!miss.length, `[${L}] missing keys ${miss.join(', ')}`);
    ok(!extra.length, `[${L}] extra keys ${extra.join(', ')}`);
    for (const k of keys) {
      const v = S[k];
      if (!ok(typeof v === 'string' && v.trim(), `[${L}].${k} empty`)) continue;
      ok(ph(v) === ph(en[k]), `[${L}].${k}: placeholders differ`);
      if (L === 'en') continue;
      for (const [sc, re] of Object.entries(SCRIPTS)) if (sc !== LANG_SCRIPT[L] && re.test(v)) { ok(false, `[${L}].${k}: contains ${sc} script`); break; }
      if (v === en[k] && /[A-Za-z]{4,}/.test(v)) ok(false, `[${L}].${k}: same as English`);
    }
  }
  for (const k of ['su_title', 'su_consent', 'su_submit', 'su_ok_title', 'su_err_email', 'su_err_consent', 'su_intro_home', 'su_intro_schools', 'su_intro_business'])
    ok(k in en, `key ${k} missing`);
  ok(/18/.test(en.su_consent) && /unsubscribe/i.test(en.su_consent), 'consent text must say 18+ and unsubscribe');
}

/* in the page: what the form shows */
function formState() {
  const $ = s => document.querySelector(s), vis = e => !!e && !e.hidden && !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
  const txt = s => { const e = $(s); return e ? e.textContent.trim() : null; };
  const errs = {};
  ['email', 'role', 'topics', 'consent'].forEach(k => { const e = $('#su-' + k + '-err'); errs[k] = e && !e.hidden ? e.textContent : ''; });
  return {
    lang: document.documentElement.lang, dir: document.documentElement.dir,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    title: txt('#su-h'), intro: txt('#su-intro'), consent: txt('#su-consent-text'),
    labels: [...document.querySelectorAll('#updates label, #updates legend')].map(e => e.textContent.trim()),
    roles: [...document.querySelectorAll('#su-role option')].map(o => o.textContent.trim()),
    submit: txt('#su-submit'), formVisible: vis($('#su-form')), doneVisible: vis($('#su-done')), fileVisible: vis($('#su-file')),
    demoNote: vis($('#su-demo-note')), doneDemo: vis($('#su-done-demo')),
    status: txt('#su-status'), statusMail: ($('#su-status a.su-status-mail') || { getAttribute: () => '' }).getAttribute('href'),
    privacy: ($('#su-privacy') || { getAttribute: () => '' }).getAttribute('href'),
    addr: txt('#su-addr'), addrHref: ($('#su-addr') || { getAttribute: () => '' }).getAttribute('href'),
    fileMail: ($('#su-file-mail') || { getAttribute: () => '' }).getAttribute('href'),
    prefLang: ($('#su-lang') || {}).value, email: ($('#su-email') || {}).value,
    errs, saved: Object.keys(localStorage).filter(k => k.indexOf('edu.cloudmock.interest/') === 0).map(k => JSON.parse(localStorage.getItem(k))),
    hpVisible: (() => { const w = document.querySelector('.su-hp'); if (!w) return true; const r = w.getBoundingClientRect(); return r.width > 2 || r.height > 2 || w.getAttribute('aria-hidden') !== 'true' || document.getElementById('su-website').tabIndex !== -1; })()
  };
}

(async () => {
  const T = loadTable();
  checkTable(T);
  const contact = (() => { const sb = { window: {} }; try { vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'shared/firebase-config.js'), 'utf8'), sb); } catch (e) { } return sb.window.EDU_CONTACT_EMAIL || ''; })();
  for (const [pg, file] of Object.entries(PAGES)) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    ok(new RegExp(`<section[^>]+id="updates"[^>]+data-signup="${pg}"`).test(html), `${file}: needs <section id="updates" data-signup="${pg}">`);
    const order = ['shared/firebase-config.js', 'shared/cloud-mock.js', 'shared/cloud.js', 'shared/signup-strings.js', 'shared/signup.js'].map(s => html.indexOf('src="' + s + '"'));
    ok(order.every(i => i > 0) && order.every((v, i) => !i || v > order[i - 1]), `${file}: script order firebase-config → cloud-mock → cloud → signup-strings → signup`);
    ok(!/workshop|20-minute|20 मिनट|a plan and a quote/i.test(html.replace(/<!--[\s\S]*?-->/g, '')), `${file}: still mentions a workshop`);
  }

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

  async function open(pg, lang, viewport, opts = {}) {
    const ctx = await browser.newContext({ viewport, colorScheme: opts.dark ? 'dark' : 'light', locale: 'en-IN', serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const log = [], external = [];
    page.on('console', m => { const tx = m.text(); if (tx.startsWith('[i18n-missing]') || m.type() === 'error') log.push(tx.slice(0, 200)); });
    page.on('pageerror', e => log.push('pageerror: ' + String(e).slice(0, 300)));
    page.on('request', r => { const u = r.url(); if (/^https?:/.test(u) && !u.startsWith(base) && !/fonts\.(googleapis|gstatic)\.com/.test(u)) external.push(u.slice(0, 120)); });
    const url = (opts.file ? 'file:///' + path.join(ROOT, PAGES[pg]).replace(/\\/g, '/') : base + PAGES[pg]) + (lang ? '?lang=' + lang : '');
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    return { ctx, page, log, external };
  }
  const shot = async (page, name) => { const s = await page.$('#updates'); if (s) { await s.scrollIntoViewIfNeeded(); await s.screenshot({ path: path.join(SHOTS, name + '.png') }); } };
  const fill = async (page, v) => {
    if ('email' in v) await page.fill('#su-email', v.email);
    if ('name' in v) await page.fill('#su-name', v.name);
    if ('role' in v) await page.selectOption('#su-role', v.role);
    if ('org' in v) await page.fill('#su-org', v.org);
    if ('place' in v) await page.fill('#su-place', v.place);
    if ('prefLang' in v) await page.selectOption('#su-lang', v.prefLang);
    if ('topics' in v) for (const tp of ['apps', 'videos', 'training']) await page.setChecked('#su-t-' + tp, v.topics.includes(tp));
    if ('consent' in v) await page.setChecked('#su-consent', v.consent);
    if ('hp' in v) await page.evaluate(x => { document.getElementById('su-website').value = x; }, v.hp);
  };
  const submit = async page => { await page.click('#su-submit'); await page.waitForTimeout(250); return page.evaluate(formState); };

  try {
    /* ---------- 2. every language on a phone (pages rotate so all three get several languages) */
    const pgs = Object.keys(PAGES);
    for (let i = 0; i < LANGS.length; i += 4) await Promise.all(LANGS.slice(i, i + 4).map(async (L, j) => {
      const pg = pgs[(i + j) % 3];
      const { ctx, page, log, external } = await open(pg, L, { width: 390, height: 844 });
      const st = await page.evaluate(formState);
      const S = T[L], where = `${pg}/${L}/390`;
      ok(st.lang === L && st.dir === (L === 'ur' ? 'rtl' : 'ltr'), `${where}: lang/dir ${st.lang}/${st.dir}`);
      ok(st.title === S.su_title, `${where}: title "${st.title}"`);
      ok(st.intro === S['su_intro_' + pg], `${where}: intro not translated for this page`);
      ok(st.consent === S.su_consent, `${where}: consent text`);
      ok(st.submit && st.submit.indexOf(S.su_submit) >= 0, `${where}: submit "${st.submit}"`);
      ok(JSON.stringify(st.roles) === JSON.stringify(['su_role_choose', 'su_role_teacher', 'su_role_principal', 'su_role_student', 'su_role_parent', 'su_role_org', 'su_role_other'].map(k => S[k])), `${where}: role options`);
      for (const k of ['su_email', 'su_name', 'su_role', 'su_org', 'su_place', 'su_lang', 'su_topics', 'su_t_apps', 'su_t_videos', 'su_t_training'])
        ok(st.labels.includes(S[k]), `${where}: label ${k} not shown`);
      if (L !== 'en') ok(!st.labels.some(x => x && Object.values(T.en).includes(x) && !Object.values(S).includes(x)), `${where}: English label left`);
      ok(st.prefLang === L, `${where}: email language should default to ${L}, is ${st.prefLang}`);
      ok(st.formVisible && st.demoNote && !st.doneVisible && !st.fileVisible, `${where}: form + demo note expected`);
      ok(/(^|\/)legal\/privacy\.html\?lang=(\w+)#updates$/.test(st.privacy) && st.privacy.endsWith('?lang=' + L + '#updates'), `${where}: privacy link ${st.privacy}`);
      ok(st.addr === contact && st.addrHref.indexOf('mailto:' + contact + '?subject=') === 0, `${where}: contact email line`);
      ok(st.overflow <= 1, `${where}: horizontal overflow ${st.overflow}px`);
      ok(!st.hpVisible, `${where}: honeypot field is visible`);
      for (const l of log) ok(false, `${where}: console: ${l}`);
      ok(!external.length, `${where}: request to another site: ${external.join(' | ')}`);
      if (pg === 'home' && ['hi', 'ur'].includes(L)) await shot(page, `home-${L}-mobile`);
      if (pg !== 'home' && ['ur', 'ta', 'bn', 'hi'].includes(L)) await shot(page, `${pg}-${L}-mobile`);
      await ctx.close();
    }));
    for (const L of ['hi', 'ur']) for (const pg of ['home', 'schools', 'business']) {
      if (fs.existsSync(path.join(SHOTS, `${pg}-${L}-mobile.png`))) continue;
      const { ctx, page } = await open(pg, L, { width: 390, height: 844 });
      await shot(page, `${pg}-${L}-mobile`);
      await ctx.close();
    }

    /* ---------- 3.-5. validation, consent, honeypot, success (home, English, desktop) */
    {
      const { ctx, page, log, external } = await open('home', 'en', { width: 1280, height: 900 });
      const E = T.en;
      let st = await submit(page);
      ok(st.errs.email === E.su_err_email && st.errs.role === E.su_err_role && st.errs.consent === E.su_err_consent && !st.errs.topics,
        `empty form: errors ${JSON.stringify(st.errs)}`);
      ok(await page.evaluate(() => document.activeElement && document.activeElement.id) === 'su-email', 'empty form: focus goes to the email field');
      ok(await page.getAttribute('#su-email', 'aria-invalid') === 'true', 'bad email field gets aria-invalid');
      ok(!st.saved.length && st.formVisible, 'empty form: nothing saved');
      await shot(page, 'home-en-errors');

      for (const bad of ['asha', 'asha@', 'asha@school', 'a b@school.in', 'asha@@school.in', 'asha@school.c']) {
        await fill(page, { email: bad, role: 'teacher', consent: true });
        st = await submit(page);
        ok(st.errs.email === E.su_err_email && !st.saved.length, `bad email "${bad}" accepted`);
      }
      await fill(page, { email: 'Asha.Verma@School.EDU.in', role: 'principal', topics: [], consent: true });
      st = await submit(page);
      ok(st.errs.topics === E.su_err_topics && !st.errs.email && !st.saved.length, `no topic: ${JSON.stringify(st.errs)}`);
      await fill(page, { topics: ['training'], consent: false });
      st = await submit(page);
      ok(st.errs.consent === E.su_err_consent && !st.errs.topics && !st.saved.length, 'consent is required');
      ok(!(await page.isChecked('#su-consent')), 'consent box starts unticked and is never ticked for the user');

      /* honeypot */
      await fill(page, { consent: true, hp: 'http://spam.example' });
      st = await submit(page);
      ok(st.doneVisible && !st.saved.length, 'honeypot: shows thanks but saves nothing');
      await page.click('#su-again');
      st = await page.evaluate(formState);
      ok(st.formVisible && !st.doneVisible && st.email === '' && !(await page.isChecked('#su-consent')) && await page.isChecked('#su-t-apps') && await page.isChecked('#su-t-videos'), '"Add another email" resets the form');

      /* live language switch keeps what was typed */
      await fill(page, { email: 'asha.verma@school.edu.in', name: 'Asha  Verma', role: 'principal', org: 'Kendriya Vidyalaya No. 1', place: 'Bhopal, MP', topics: ['apps', 'training'], consent: true });
      await page.selectOption('#edu-lang', 'hi');
      await page.waitForTimeout(300);
      st = await page.evaluate(formState);
      ok(st.title === T.hi.su_title && st.consent === T.hi.su_consent && st.email === 'asha.verma@school.edu.in' && st.prefLang === 'hi', 'language switch en→hi re-translates the form and keeps the typed email');
      st = await submit(page);
      const rec = st.saved[0] || {};
      ok(st.saved.length === 1 && st.doneVisible && st.doneDemo, 'success: one record, thank-you + demo note shown');
      ok(JSON.stringify(Object.keys(rec).sort()) === JSON.stringify(FIELDS.slice().sort()), 'record has exactly the agreed fields: ' + Object.keys(rec).join(','));
      ok(rec.email === 'asha.verma@school.edu.in' && rec.name === 'Asha Verma' && rec.role === 'principal' && rec.org === 'Kendriya Vidyalaya No. 1' && rec.place === 'Bhopal, MP',
        'record values: ' + JSON.stringify(rec));
      ok(JSON.stringify(rec.topics) === '["apps","training"]' && rec.consent === true && rec.lang === 'hi' && rec.prefLang === 'hi' && rec.page === 'home' && rec.demo === true && typeof rec.createdAt === 'number' && /^anon-/.test(rec.uid),
        'record meta: ' + JSON.stringify(rec));
      ok(await page.evaluate(() => document.activeElement && document.activeElement.id) === 'su-done-title', 'focus moves to the thank-you message');
      await shot(page, 'home-hi-success-desktop');
      for (const l of log) ok(false, `home/en/desktop: console: ${l}`);
      ok(!external.length, `home/en/desktop: request to another site: ${external.join(' | ')}`);
      await ctx.close();
    }

    /* ---------- 6. backend errors (schools page) */
    {
      const { ctx, page, log } = await open('schools', 'en', { width: 1280, height: 900 });
      const E = T.en, valid = { email: 'teacher@example.org', role: 'teacher', consent: true };
      for (const [code, key, mail] of [['offline', 'su_err_offline', false], ['quota-exceeded', 'su_err_quota', true], ['invalid-input', 'su_err_invalid', false], ['permission-denied', 'su_err_other', true], ['not-configured', 'su_err_other', true], ['unknown', 'su_err_other', true]]) {
        await page.evaluate(c => { window.EDUCloud.registerInterest = () => new Promise((res, rej) => setTimeout(() => { const e = new Error(c); e.code = c; rej(e); }, 50)); }, code);
        await fill(page, valid);
        await page.click('#su-submit');
        const busy = await page.evaluate(() => [document.getElementById('su-submit').disabled, document.getElementById('su-submit').textContent]);
        ok(busy[0] && busy[1].indexOf(E.su_sending) >= 0, `${code}: button disabled while sending`);
        await page.waitForTimeout(200);
        const st = await page.evaluate(formState);
        ok(st.status === E[key] + (mail ? E.su_mail_btn : '') || (st.status || '').indexOf(E[key]) === 0, `${code}: message "${st.status}"`);
        ok(mail ? (st.statusMail || '').indexOf('mailto:' + contact + '?subject=') === 0 : !st.statusMail, `${code}: email link ${st.statusMail}`);
        ok(st.formVisible && !st.doneVisible && !(await page.isDisabled('#su-submit')), `${code}: form stays, button usable again`);
        if (code === 'quota-exceeded') await shot(page, 'schools-en-error-desktop');
      }
      const body = decodeURIComponent((await page.evaluate(formState)).statusMail.split('&body=')[1] || '');
      ok(body.indexOf('teacher@example.org') > 0 && body.indexOf(E.su_role_teacher) > 0 && /18/.test(body), 'email fallback carries the typed details: ' + body.slice(0, 120));
      await page.evaluate(() => EDU.setLang('ur'));
      await page.waitForTimeout(200);
      const st = await page.evaluate(formState);
      ok((st.status || '').indexOf(T.ur.su_err_other) === 0, 'error message re-translated on language change');
      for (const l of log) ok(false, `schools/errors: console: ${l}`);
      await ctx.close();
    }

    /* desktop + dark screenshots */
    {
      const { ctx, page } = await open('schools', 'en', { width: 1280, height: 900 });
      await shot(page, 'schools-en-desktop');
      await ctx.close();
      const b = await open('business', 'en', { width: 1280, height: 900 });
      await shot(b.page, 'business-en-desktop');
      await b.ctx.close();
      const d = await open('home', 'en', { width: 390, height: 844 }, { dark: true });
      await shot(d.page, 'home-en-dark-mobile');
      const ds = await d.page.evaluate(formState);
      ok(ds.overflow <= 1, 'dark mobile: overflow');
      await d.ctx.close();
    }

    /* ---------- 7. file:// */
    for (const pg of Object.keys(PAGES)) {
      const { ctx, page, log } = await open(pg, 'hi', { width: 390, height: 844 }, { file: true });
      const st = await page.evaluate(formState);
      ok(!st.formVisible && st.fileVisible && (st.fileMail || '').indexOf('mailto:' + contact) === 0, `${pg}/file://: note + email link instead of the form ${JSON.stringify({ f: st.formVisible, n: st.fileVisible, m: st.fileMail })}`);
      for (const l of log) if (/pageerror|i18n-missing/.test(l)) ok(false, `${pg}/file://: ${l}`);
      if (pg === 'home') await shot(page, 'home-hi-file');
      await ctx.close();
    }
  } catch (e) {
    ok(false, 'test crashed: ' + (e && e.stack || e));
  }

  await browser.close();
  srv.close();
  const uniq = [...new Set(errors)];
  console.log(`\n=== signup form: ${uniq.length ? 'FAIL' : 'PASS'} (${checks} checks, ${uniq.length} errors, ${warnings.length} warnings) ===`);
  for (const e of uniq.slice(0, 80)) console.log('ERROR  ' + e);
  for (const w of warnings.slice(0, 20)) console.log('warn   ' + w);
  console.log('screenshots: tools/shots/signup/');
  process.exit(uniq.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
