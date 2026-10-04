#!/usr/bin/env node
/* End-to-end test of the "Stay updated" form in FIREBASE mode against the local emulators: the real shared/cloud.js,
 * the real Firebase SDK (from jsDelivr, so it needs the internet) and the real firestore.rules.
 *
 *   cd firebase
 *   npx firebase emulators:exec --project demo-apni-pathshala --only firestore,auth "node tests/signup.emulator.e2e.js"
 *   (Java 11+ needed, see SETUP.md; exit code 0 = PASS)
 *
 * Checks:
 *  - signupCount() before anyone signed up = 0 (the counter document does not exist yet; the read is allowed);
 *  - registerInterest() writes interest/{new uid} + stats/signups +1 in ONE batch, three times → count 3;
 *  - signupCount(): ONE plain GET (no cookies, no SDK needed), cached for the page and the tab, fresh after a sign-up;
 *  - the form on the home page: neutral line under 25, "Join 130+ …" at 137 (seeded), a sign-up through the real
 *    form adds 1 (138) and shows the thank-you message;
 *  - a counter document edited by hand into something the rules refuse (count: "x"): the sign-up is still saved,
 *    alone ({counted: false}), and the counter stays as it was;
 *  - no console errors, no requests to other sites except the pinned SDK on jsDelivr and Google Fonts. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..', '..');
const { chromium } = require(path.join(ROOT, 'tools', 'node_modules', 'playwright-core'));
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(p => fs.existsSync(p));
const PROJECT = 'demo-apni-pathshala';
const FS = 'http://127.0.0.1:8080';
const DOCS = `${FS}/v1/projects/${PROJECT}/databases/(default)/documents`;
const CFG = { apiKey: 'demo-key', authDomain: PROJECT + '.firebaseapp.com', projectId: PROJECT, appId: '1:1:web:1', emulator: true };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf' };

let passed = 0;
const failures = [];
function check(cond, msg) { if (cond) { passed++; return; } failures.push(msg); console.log('  FAIL ' + msg); }
function eq(a, b, msg) { check(JSON.stringify(a) === JSON.stringify(b), `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

/* the emulator's admin access (bypasses the rules): "Authorization: Bearer owner" */
async function admin(method, docPath, body) {
  const r = await fetch(`${DOCS}/${docPath}`, { method, headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return r.status === 404 ? null : r.json();
}
async function counter() { const d = await admin('GET', 'stats/signups'); return d && d.fields ? d.fields.count : null; }
async function interestCount() {
  const r = await fetch(`${DOCS}/interest?pageSize=300`, { headers: { Authorization: 'Bearer owner' } });
  const j = await r.json();
  return (j.documents || []).length;
}

(async () => {
  if (!CHROME) throw new Error('Chrome / Edge not found');
  await fetch(`${FS}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const fp = path.join(ROOT, p);
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(fp).pipe(res);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const problems = [], countGets = [];

  async function open(rel, viewport) {
    const ctx = await browser.newContext({ viewport: viewport || { width: 1280, height: 900 }, serviceWorkers: 'block' });
    /* the emulator config wins over the real one that shared/firebase-config.js assigns later (never the live project) */
    await ctx.addInitScript(cfg => {
      const v = cfg;
      Object.defineProperty(window, 'EDU_FIREBASE', { configurable: true, get() { return v; }, set(x) { } });
    }, CFG);
    const page = await ctx.newPage();
    page.on('pageerror', e => problems.push(`${rel}: page error: ${e && e.message}`));
    /* Chrome logs "Failed to load resource: 404" for the count read before the first sign-up (no counter yet): expected */
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource: the server responded with a status of 404/.test(m.text())) problems.push(`${rel}: console error: ${m.text().slice(0, 200)}`); });
    page.on('request', async r => {
      const u = r.url();
      if (u.startsWith(DOCS + '/stats/signups')) countGets.push({ method: r.method(), cookie: (await r.allHeaders()).cookie || '' });
      if (/studio-|firebaseio|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com/.test(u) && !u.startsWith('http://127.0.0.1:')) problems.push(`${rel}: request to the LIVE project: ${u.slice(0, 120)}`);
      if (/^http:\/\/127\.0\.0\.1:(8080|9099)\//.test(u) && u.indexOf(PROJECT) < 0 && u.indexOf('demo-key') < 0) problems.push(`${rel}: emulator request for another project: ${u.slice(0, 140)}`);
      if (u.startsWith(base) || u.startsWith('http://127.0.0.1:8080/') || u.startsWith('http://127.0.0.1:9099/')) return;
      if (u.startsWith('https://cdn.jsdelivr.net/npm/firebase@12.19.0/') || /fonts\.(googleapis|gstatic)\.com/.test(u)) return;
      problems.push(`${rel}: request to another site: ${u.slice(0, 120)}`);
    });
    await page.goto(base + rel, { waitUntil: 'load' });
    return { ctx, page };
  }
  const SIGNUP = (email, page) => ({ email, name: 'Test ' + page, role: 'teacher', org: '', place: '', prefLang: 'hi', topics: ['apps'], consent: true, lang: 'hi', page });

  try {
    console.log('1. API: count before and after three sign-ups');
    const a = await open('index.html?emulator=1');
    eq(await a.page.evaluate(() => [EDUCloud.mode, EDUCloud.isDemo]), ['firebase', false], 'emulator config → Firebase mode');
    eq(await a.page.evaluate(() => EDUCloud.signupCount()), 0, 'signupCount() = 0 before the first sign-up (no counter document yet)');
    for (let i = 1; i <= 3; i++) {
      const r = await a.page.evaluate(d => EDUCloud.registerInterest(d).then(x => x, e => ({ err: e.code, msg: e.message })), SIGNUP(`t${i}@example.com`, 'home'));
      check(r && r.id && r.counted === true, `sign-up ${i} saved together with the +1 ${JSON.stringify(r)}`);
    }
    eq(await counter(), { integerValue: '3' }, 'stats/signups = 3 after three sign-ups (increment(1) in the same batch)');
    eq(await interestCount(), 3, 'three documents in interest/');
    eq(await a.page.evaluate(() => EDUCloud.signupCount()), 3, 'signupCount() after the sign-ups: the fresh number (cache dropped after a sign-up)');
    const before = countGets.length;
    eq(await a.page.evaluate(() => Promise.all([EDUCloud.signupCount(), EDUCloud.signupCount()])), [3, 3], 'repeated calls give the same number');
    eq(countGets.length, before, 'repeated calls on the same page send no new request');
    check(countGets.every(g => g.method === 'GET' && !g.cookie), 'every count read is a plain GET without cookies');
    await a.ctx.close();

    console.log('2. the form: social proof line and a real sign-up');
    const b = await open('index.html?emulator=1&lang=hi', { width: 390, height: 844 });
    await b.page.evaluate(() => document.getElementById('updates').scrollIntoView());
    await b.page.waitForFunction(() => document.getElementById('su-proof') && /✓/.test(document.getElementById('su-proof').textContent), null, { timeout: 15000 }).catch(() => { });
    const neutral = await b.page.evaluate(() => [document.getElementById('su-proof').textContent, window.SIGNUP_STRINGS.hi.su_proof_none]);
    eq(neutral[0], '✓ ' + neutral[1], 'under 25 sign-ups: the neutral line');
    await b.ctx.close();
    await admin('PATCH', 'stats/signups', { fields: { count: { integerValue: '137' } } });
    const c = await open('index.html?emulator=1&lang=en', { width: 390, height: 844 });
    await c.page.evaluate(() => document.getElementById('updates').scrollIntoView());
    await c.page.waitForFunction(() => document.getElementById('su-proof').getAttribute('data-n'), null, { timeout: 15000 }).catch(() => { });
    eq(await c.page.evaluate(() => document.getElementById('su-proof').textContent), '👥 Join \u2066130+\u2069 teachers & learners getting free AI apps', '137 sign-ups → "Join 130+ teachers & learners…"');
    await c.page.fill('#su-email', 'form.user@example.com');
    await c.page.selectOption('#su-role', 'principal');
    await c.page.check('#su-consent');
    await c.page.click('#su-submit');
    const done = await c.page.waitForSelector('#su-done:not([hidden])', { timeout: 30000 }).then(() => true, () => false);
    check(done, 'a sign-up through the real form shows the thank-you message');
    check(!(await c.page.isVisible('#su-done-demo')), 'no Demo-mode note in Firebase mode');
    eq(await counter(), { integerValue: '138' }, 'the form sign-up added exactly 1 (137 → 138)');
    eq(await c.page.evaluate(() => localStorage.getItem('edu.cta.joined') !== null), true, 'the sign-up tells the shell reminder to stop (edu.cta.joined)');
    await c.ctx.close();

    console.log('3. a counter the rules refuse: the sign-up is still saved, alone');
    await admin('PATCH', 'stats/signups', { fields: { count: { stringValue: 'x' } } });
    const d = await open('schools.html?emulator=1');
    const r = await d.page.evaluate(x => EDUCloud.registerInterest(x).then(v => v, e => ({ err: e.code })), SIGNUP('fallback@example.com', 'schools'));
    check(r && r.id && r.counted === false, 'refused +1 → the sign-up is saved without it ' + JSON.stringify(r));
    eq(await counter(), { stringValue: 'x' }, 'the counter is unchanged');
    eq(await interestCount(), 5, 'five sign-ups in interest/ (3 API + 1 form + 1 alone)');
    eq(await d.page.evaluate(() => EDUCloud.signupCount()), null, 'an unreadable count → null (the form shows the neutral line)');
    await d.ctx.close();
  } catch (e) {
    check(false, 'test crashed: ' + (e && e.stack || e));
  }
  await browser.close();
  srv.close();
  for (const p of problems) check(false, p);
  console.log(`\n=== sign-up form in Firebase mode (emulator): ${failures.length ? 'FAIL' : 'PASS'} (${passed} checks passed, ${failures.length} failed) ===`);
  process.exit(failures.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
