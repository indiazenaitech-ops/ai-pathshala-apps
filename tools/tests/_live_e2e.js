#!/usr/bin/env node
/* End-to-end test of the whole Live Class Quiz: teacher app (apps/live-quiz) + student app (apps/quiz-join).
 *
 *   node tools/tests/_live_e2e.js            (from the project root; exit code 0 = PASS)
 *   node tools/tests/_live_e2e.js --no-fb    (skip part B, which needs the internet)
 *   node tools/tests/_live_e2e.js --shots=<dir>   (also save screenshots of the main screens there)
 *
 * A. Demo mode, ONE browser context, driven only through the real UIs:
 *    teacher tab (projector size, en) signs in as the Demo Teacher and hosts the sample quiz;
 *    three student tabs (phone size) in hi / ta / ur join with different nicknames (typed code + QR link);
 *    a 4th student is removed (kick) and cannot come back; a 5th gets "name taken", then "locked".
 *    All 5 questions are played with mixed right / wrong / no answers and staggered timing:
 *    lobby count, live "n of N answered", automatic reveal, reveal chart, scores = LIVE_SPEC formula
 *    (±50 for the measured click time, exact from the stored ms), points + totals on the phones,
 *    leaderboard order, a student reloaded mid-question (before and after answering) comes back as the
 *    same player, final podium + table, every phone's final rank = the host's rank, CSV rows, "Remove me".
 *    No console errors, no page errors, no request outside the test server except the QR library and fonts.
 * B. Firebase-mode readiness without a project: a FAKE window.EDU_FIREBASE is injected with
 *    context.addInitScript (as a property that keeps the fake value whatever shared/firebase-config.js
 *    later assigns). The compat SDK must load from jsDelivr, nothing may crash, and errors must
 *    show as translated messages (not stack traces): teacher sign-in in hi, student code check in ur,
 *    and the same with jsDelivr blocked (→ "offline" message).
 * Not part of verify.js (the leading "_" keeps it out of the per-app tests). */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const NO_FB = process.argv.includes('--no-fb');
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8);   // --shots=<dir>: save screenshots of the main screens
const SDK = 'https://cdn.jsdelivr.net/npm/firebase@12.19.0/';
const OK_EXTERNAL = ['https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/', 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'];
const PHONE = { width: 390, height: 844 };
const PROJECTOR = { width: 1280, height: 800 };
const T = { timeout: 15000 };

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://x');
      let p = decodeURIComponent(url.pathname);
      if (p.endsWith('/')) p += 'index.html';
      const fp = path.join(ROOT, p);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(fp).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

const T0 = Date.now();
const step = (msg) => console.log(`${msg}  [${((Date.now() - T0) / 1000).toFixed(1)} s]`);
let passed = 0;
const failures = [];
function check(cond, msg) {
  if (cond) { passed++; return; }
  failures.push(msg);
  console.log('  FAIL ' + msg);
}
function eq(a, b, msg) { check(JSON.stringify(a) === JSON.stringify(b), `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function shot(p, name, full) {
  if (!SHOTS) return;
  try { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: !!full }); } catch (e) { console.log('  (info) screenshot ' + name + ' failed: ' + e.message); }
}
async function until(fn, ms, what) {
  const end = Date.now() + (ms || 10000);
  let last;
  while (Date.now() < end) {
    last = await fn();
    if (last) return last;
    await sleep(100);
  }
  throw new Error('timed out waiting for ' + what);
}

/* LIVE_SPEC scoring, written out again here (independent of EDUCloud.points) */
const specPoints = (ms, timeSec) => 500 + Math.round(500 * Math.max(0, 1 - Math.max(0, ms) / (timeSec * 1000)));
/* LIVE_SPEC leaderboard: higher score first; equal scores share a rank (1, 1, 3); ties ordered by join time */
function ranking(players) {
  const list = players.map(p => Object.assign({}, p)).sort((a, b) => (b.score - a.score) || (a.joinedAt - b.joinedAt));
  list.forEach((p, i) => { p.rank = i && p.score === list[i - 1].score ? list[i - 1].rank : i + 1; });
  return list;
}
/* small CSV reader (quotes, "" escapes, CRLF) */
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/* 0. static: the privacy policy quotes the apps' button labels ("Remove me", "Delete my account and data"),
   so the quoted words must be the real labels, in all 12 languages */
function labels() {
  const vm = require('vm');
  const load = (f) => { const box = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), box); return box.window.APP_STRINGS; };
  const P = load('legal/privacy-strings.js'), L = load('apps/live-quiz/strings.js'), Q = load('apps/quiz-join/strings.js');
  const quotes = (s) => (String(s).match(/“[^”]+”/g) || []).map(x => x.slice(1, -1));
  const bad = [];
  Object.keys(P).forEach(l => {
    const student = Q[l] && Q[l].remove_me, teacher = L[l] && L[l].delete_account;
    ['p_short_4', 'p_keep_1'].forEach(k => { if (!quotes(P[l][k]).includes(student)) bad.push(`${l} ${k} ≠ quiz-join remove_me "${student}"`); });
    const q = quotes(P[l].p_rights_3);
    if (q[0] !== teacher) bad.push(`${l} p_rights_3 "${q[0]}" ≠ live-quiz delete_account "${teacher}"`);
    if (q[1] !== student) bad.push(`${l} p_rights_3 "${q[1]}" ≠ quiz-join remove_me "${student}"`);
  });
  check(Object.keys(P).length === 12 && !bad.length, 'privacy policy quotes the real button labels in 12 languages' + (bad.length ? ':' + bad.map(b => '\n    ' + b).join('') : ''));
}

async function main() {
  if (!CHROME) throw new Error('Chrome / Edge not found');
  step('0. button labels quoted in the privacy policy');
  labels();
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  try {
    await partA(browser, base);
    if (NO_FB) console.log('B. skipped (--no-fb)');
    else await partB(browser, base);
  } finally {
    await browser.close().catch(() => { });
    srv.close();
  }
  const ok = !failures.length;
  console.log(`\n=== live quiz e2e: ${ok ? 'PASS' : 'FAIL'} (${passed} checks passed, ${failures.length} failed) ===`);
  if (!ok) failures.forEach(f => console.log(' - ' + f));
  process.exit(ok ? 0 : 1);
}

/* ===================================================================================== A. Demo mode */
async function partA(browser, base) {
  step('A. Demo mode: 1 teacher tab + 3 student tabs (hi / ta / ur) + 2 extra students');
  const problems = [];
  const ctx = await browser.newContext({ viewport: PROJECTOR, acceptDownloads: true });
  function watch(p, label) {
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`${label}: console ${m.type()}: ${m.text()}`); });
    p.on('pageerror', e => problems.push(`${label}: page error: ${e && e.message}`));
    p.on('request', r => {
      const u = r.url();
      if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:') || OK_EXTERNAL.some(x => u.startsWith(x))) return;
      problems.push(`${label}: request outside the test server: ${u}`);
    });
    p.on('dialog', d => d.accept().catch(() => { }));
  }
  const pages = [];
  async function open(label, url, viewport) {
    const p = await ctx.newPage();
    pages.push(p);
    watch(p, label);
    if (viewport) await p.setViewportSize(viewport);
    await p.goto(url, { waitUntil: 'load' });
    return p;
  }
  const tr = (p, key, vars) => p.evaluate(([k, v]) => EDU.t(k, v || {}), [key, vars || {}]);

  /* ---------------------------------------------------------------- teacher: sign in, host the sample quiz */
  step('  1. teacher signs in (Demo) and hosts the sample quiz');
  const tch = await open('teacher', base + 'apps/live-quiz/index.html?lang=en', PROJECTOR);
  await tch.waitForSelector('#signIn:not([disabled])', T);
  eq(await tch.evaluate(() => [EDUCloud.mode, EDUCloud.isDemo]), ['mock', true], 'teacher page runs in Demo mode');
  check(await tch.isVisible('#demoBanner'), 'Demo banner shown on the teacher page');
  await tch.click('#signIn');
  await tch.waitForSelector('#v-dash:not([hidden]) #hostSample', T);
  check((await tch.textContent('#hello')).includes(await tr(tch, 'demo_teacher')), 'dashboard greets the (translated) Demo Teacher');
  eq(await tch.getAttribute('#timeSeg [data-time="20"]', 'aria-pressed'), 'true', 'default time per question is 20 s');
  const sample = await tch.evaluate(() => window.APP_CONTENT.en);
  await tch.click('#hostSample');
  await tch.waitForSelector('#lobbyCode', T);
  const code = await tch.getAttribute('#lobbyCode', 'data-code');
  check(/^\d{6}$/.test(code || ''), 'six-digit join code on the projector: ' + code);
  eq((await tch.textContent('#lobbyCode')).replace(/\s/g, ''), code, 'the big code shows the same digits');
  const qrUrl = await tch.getAttribute('#qrImg', 'data-url');
  check(/apps\/quiz-join\/index\.html\?/.test(qrUrl) && qrUrl.includes('code=' + code) && qrUrl.includes('mock=1'), 'Demo QR points to the local student page with the code: ' + qrUrl);
  eq(await tch.getAttribute('#joinedN', 'data-n'), '0', 'lobby starts with 0 players');
  check(await tch.isDisabled('#nextBtn'), '"Start" waits for the first player');
  const qrReady = await tch.waitForSelector('#qrImg[data-ready="1"] svg', { timeout: 15000 }).then(() => true, () => false);
  if (!qrReady) console.log('  (info) QR library did not load (offline?): the QR box shows the offline note');
  const results = () => tch.evaluate(c => EDUCloud.sessionResults(c), code);
  const lobbyN = n => tch.waitForSelector(`#joinedN[data-n="${n}"]`, T);

  /* ---------------------------------------------------------------- students join */
  step('  2. students join: typed code (hi), QR links (ta, ur)');
  const qr = (lang) => { const u = new URL(qrUrl); u.searchParams.set('lang', lang); return u.href; };
  const A = await open('student A (hi)', base + 'apps/quiz-join/index.html?lang=hi', PHONE);
  check(await A.isVisible('#scrCode') && await A.isVisible('#demoBanner'), 'student A: code screen + Demo banner');
  await A.fill('#codeInput', code);                                   // 6 digits → checks the code by itself
  await A.waitForSelector('#scrName:not([hidden])', T);
  eq((await A.textContent('#quizTitle')).trim(), sample.title, 'student A sees the quiz title on the nickname screen');
  await A.fill('#nameInput', 'Asha');
  await A.click('#joinBtn');
  await A.waitForSelector('#scrGame [data-screen="lobby"]', T);
  eq((await A.textContent('#scrGame .nick')).trim(), 'Asha', 'student A: waiting room shows the nickname');
  await lobbyN(1);

  const K = await open('student K (ta)', qr('ta'), PHONE);
  await K.waitForSelector('#scrName:not([hidden])', T);              // code came from the QR link
  await K.fill('#nameInput', 'கவின்');
  await K.click('#joinBtn');
  await K.waitForSelector('#scrGame [data-screen="lobby"]', T);
  await lobbyN(2);

  const Z = await open('student Z (ur)', qr('ur'), PHONE);
  await Z.waitForSelector('#scrName:not([hidden])', T);
  await Z.fill('#nameInput', 'زویا');
  await Z.click('#joinBtn');
  await Z.waitForSelector('#scrGame [data-screen="lobby"]', T);
  await lobbyN(3);
  eq(await Z.evaluate(() => [document.documentElement.lang, document.documentElement.dir]), ['ur', 'rtl'], 'Urdu student page is right-to-left');
  eq(await K.evaluate(() => document.documentElement.lang), 'ta', 'Tamil student page is in Tamil');
  eq(await tch.$$eval('#players .pname', els => els.map(e => e.textContent)), ['Asha', 'கவின்', 'زویا'], 'lobby lists the 3 nicknames in join order');
  await shot(tch, 'a1-teacher-lobby');
  await shot(A, 'a1-student-hi-lobby', true);
  const first = await results();
  const ids = {};
  first.players.forEach(p => { ids[p.name] = p.id; });
  check(Object.keys(ids).length === 3 && new Set(Object.values(ids)).size === 3, 'three different players: ' + JSON.stringify(ids));
  const S = [
    { key: 'A', name: 'Asha', page: A },
    { key: 'K', name: 'கவின்', page: K },
    { key: 'Z', name: 'زویا', page: Z }
  ];
  S.forEach(s => { s.id = ids[s.name]; s.total = 0; s.right = 0; });

  /* ---------------------------------------------------------------- kick, unique names, lock */
  step('  3. kick, unique nickname, lock');
  const X = await open('student X (en, kicked)', qr('en'), PHONE);
  await X.waitForSelector('#scrName:not([hidden])', T);
  await X.fill('#nameInput', 'Extra');
  await X.click('#joinBtn');
  await X.waitForSelector('#scrGame [data-screen="lobby"]', T);
  await lobbyN(4);
  await tch.click('#players .pchip:has(.pname:text-is("Extra")) .kick');   // confirm() is accepted
  await lobbyN(3);
  await X.waitForSelector('#scrGame [data-screen="msg"][data-msg="removed_title"]', T);
  check(true, 'the removed student sees "removed by the teacher"');
  await X.click('#anotherBtn');
  await X.waitForSelector('#scrCode:not([hidden])', T);
  await X.fill('#codeInput', code);
  await X.waitForSelector('#codeErr:not([hidden])', T);
  eq((await X.textContent('#codeErr')).trim(), await tr(X, 'err_cant_join'), 'a removed student cannot join again');
  check(!(await X.isVisible('#scrName')), 'the removed student does not reach the nickname screen');

  const Y = await open('student Y (en, late)', qr('en'), PHONE);
  await Y.waitForSelector('#scrName:not([hidden])', T);
  await Y.fill('#nameInput', 'ASHA');
  await Y.click('#joinBtn');
  await Y.waitForSelector('#nameErr:not([hidden])', T);
  eq((await Y.textContent('#nameErr')).trim(), await tr(Y, 'err_name_taken'), 'nickname "ASHA" is refused (Asha is taken, any letter case)');
  await tch.click('#lockBtn:not([disabled])');
  await tch.waitForSelector('#lockBtn[aria-pressed="true"]', T);
  check(await tch.isVisible('#lockNote'), 'projector shows the "locked" note');
  await Y.fill('#nameInput', 'Neha');
  await Y.click('#joinBtn');
  await Y.waitForFunction(t => { const e = document.querySelector('#nameErr'); return e && !e.hidden && e.textContent.trim() === t; }, await tr(Y, 'err_session_locked'), T)
    .then(() => check(true, ''), () => check(false, 'a 4th join into a locked quiz shows "locked"'));
  await sleep(300);
  eq(await tch.getAttribute('#joinedN', 'data-n'), '3', 'lock kept the lobby at 3 players');
  eq((await results()).players.map(p => p.name), ['Asha', 'கவின்', 'زویا'], 'host data: exactly the 3 players');
  await A.waitForFunction(t => document.querySelector('#scrGame').textContent.includes(t), await tr(A, 'players_n', { n: '3' }), T)
    .then(() => check(true, ''), () => check(false, 'waiting room shows "Players: 3" after the lock (playerCount refreshed)'));

  /* ---------------------------------------------------------------- the game */
  /* per question: the order students answer in, 'R' right / 'W' wrong / null no answer, reloads */
  const PLAN = [
    { order: ['A', 'K', 'Z'], ans: { A: 'R', K: 'R', Z: 'W' }, toBoard: 'click', next: 'click' },
    { order: ['Z', 'K', 'A'], ans: { A: 'W', K: 'R', Z: 'R' }, reloadAfter: 'Z', toBoard: 'Space', next: 'ArrowRight' },
    { order: ['K', 'A'], ans: { A: 'R', K: 'W', Z: null }, showBy: 'Space', toBoard: 'ArrowRight', next: 'Space' },
    { order: ['K', 'Z', 'A'], ans: { A: 'R', K: 'R', Z: 'R' }, reloadBefore: 'A', toBoard: 'click', next: 'click' },
    { order: ['A', 'Z', 'K'], ans: { A: 'W', K: 'R', Z: 'R' }, toBoard: 'click', next: 'final' }
  ];
  const byKey = k => S.find(s => s.key === k);
  const N = sample.questions.length;
  eq(N, PLAN.length, 'sample quiz has 5 questions');
  const blur = () => tch.evaluate(() => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });
  const press = async (key) => { await blur(); await tch.keyboard.press(key); };
  const csvMarks = {};          // name → per question cell expected in the CSV

  await tch.click('#nextBtn');                                         // Start
  for (let i = 0; i < N; i++) {
    const plan = PLAN[i], q = sample.questions[i], correct = q.correct, T_SEC = q.time || 20;
    step(`  4.${i + 1} question ${i + 1}: ${S.map(s => s.key + '=' + (plan.ans[s.key] || '-')).join(' ')}${plan.reloadBefore ? ', reload ' + plan.reloadBefore + ' before answering' : ''}${plan.reloadAfter ? ', reload ' + plan.reloadAfter + ' after answering' : ''}`);
    await tch.waitForFunction(text => { const e = document.querySelector('#hStage[data-phase="question"] #qText'); return !!(e && e.textContent.trim() === text); }, q.q, T);
    eq(await tch.locator('#tiles .tile').count(), q.options.length, `q${i + 1}: one coloured tile per option`);
    eq([await tch.getAttribute('#answered', 'data-n'), await tch.getAttribute('#answered', 'data-total')], ['0', '3'], `q${i + 1}: "0 of 3 answered"`);
    const start = (await results()).session.starts[i];
    check(typeof start === 'number', `q${i + 1}: question start time is stored`);
    for (const s of S) {
      await s.page.waitForSelector(`#scrGame [data-screen="question"][data-q="${i}"]`, T);
      eq(await s.page.locator('#answers button.ans').count(), q.options.length, `q${i + 1} ${s.key}: ${q.options.length} answer buttons`);
    }
    eq((await A.textContent('#scrGame .qtext')).trim(), q.q, `q${i + 1}: the phone shows the teacher's question text`);
    eq(await Z.locator('#answers .ans svg.shape').count(), q.options.length, `q${i + 1}: every answer button has its shape`);
    if (i === 0) { await shot(tch, 'a2-teacher-question'); await shot(Z, 'a2-student-ur-question', true); await shot(K, 'a2-student-ta-question', true); }

    if (plan.reloadBefore) {
      const s = byKey(plan.reloadBefore);
      await s.page.reload({ waitUntil: 'load' });
      await s.page.waitForSelector(`#scrGame [data-screen="question"][data-q="${i}"]`, T);
      check(!(await s.page.isVisible('#scrCode')) && !(await s.page.isVisible('#scrName')), `q${i + 1}: reloaded ${s.key} goes straight back to the question`);
      const r = await results();
      eq(r.players.map(p => p.id), S.map(x => x.id), `q${i + 1}: after the reload ${s.key} is the same player (no new one)`);
    }

    const clicks = {};
    let n = 0;
    for (const k of plan.order) {
      const s = byKey(k), mark = plan.ans[k];
      if (!mark) continue;
      const choice = mark === 'R' ? correct : (correct + 1) % q.options.length;
      if (n) await sleep(900);                                          // stagger → different points
      const t0 = Date.now();
      await s.page.click(`#answers .ans[data-choice="${choice}"]`);
      clicks[k] = { choice, t: (t0 + Date.now()) / 2 };
      await s.page.waitForSelector(`#scrGame [data-screen="sent"][data-q="${i}"][data-state="sent"]`, T);
      n++;
      const all = n === S.length;
      const seen = await tch.waitForSelector(`#answered[data-n="${n}"]`, { timeout: all ? 3000 : 10000 }).then(() => true, () => false);
      if (all && !seen) check(await tch.$('#hStage[data-phase="reveal"]') !== null, `q${i + 1}: all answered → revealed`);
      else {
        check(seen, `q${i + 1}: projector shows ${n} answered`);
        if (seen) eq(await tch.getAttribute('#answered', 'data-total'), '3', `q${i + 1}: "${n} of 3 answered"`);
      }
    }
    for (const s of S) if (!plan.ans[s.key]) check(await s.page.isVisible(`#scrGame [data-screen="question"][data-q="${i}"]`), `q${i + 1}: ${s.key} (no answer yet) still sees the buttons`);

    if (plan.reloadAfter) {
      const s = byKey(plan.reloadAfter);
      await s.page.reload({ waitUntil: 'load' });
      /* the host may already have revealed (everyone answered): then the result screen is right */
      await s.page.waitForSelector(`#scrGame [data-screen="sent"][data-q="${i}"], #scrGame [data-screen="result"][data-q="${i}"]`, T);
      const scr = await s.page.getAttribute('#scrGame [data-screen]', 'data-screen');
      if (scr === 'sent') check(await s.page.$(`#scrGame .yours .ans.c${clicks[s.key].choice}`) !== null, `q${i + 1}: reloaded ${s.key} still shows the answer it sent`);
      else check(true, '');
      eq((await results()).players.map(p => p.id), S.map(x => x.id), `q${i + 1}: after the reload ${s.key} is the same player`);
    }

    /* reveal: automatic when everyone answered, else the teacher shows it */
    const everyone = S.every(s => plan.ans[s.key]);
    if (!everyone) {
      await tch.waitForTimeout(400);
      check(await tch.$('#hStage[data-phase="question"]') !== null, `q${i + 1}: no automatic reveal while someone has not answered`);
      if (plan.showBy === 'Space') await press('Space'); else await tch.click('#nextBtn');
    }
    await tch.waitForSelector('#hStage[data-phase="reveal"] #bars .barrow', T);
    const counts = q.options.map(() => 0);
    Object.values(clicks).forEach(c => { counts[c.choice]++; });
    await tch.waitForFunction(want => {
      const rows = [...document.querySelectorAll('#bars .barrow')];
      return rows.length === want.length && rows.every((r, j) => r.getAttribute('data-count') === String(want[j]));
    }, counts, T).then(() => check(true, ''), () => check(false, `q${i + 1}: reveal chart counts ${JSON.stringify(counts)}`));
    eq(await tch.$$eval('#bars .barrow.is-correct', els => els.map(e => e.getAttribute('data-i'))), [String(correct)], `q${i + 1}: the correct option is highlighted`);
    check((await tch.textContent('#explain')).includes(q.options[correct]), `q${i + 1}: the correct answer is written under the chart`);
    if (i === 0) await shot(tch, 'a3-teacher-reveal');

    /* scores: host writes them after the reveal */
    const want = {};
    S.forEach(s => {
      const c = clicks[s.key];
      want[s.key] = c && c.choice === correct ? 'correct' : c ? 'wrong' : 'none';
    });
    const r = await until(async () => {
      const x = await results();
      return S.every(s => want[s.key] !== 'correct' || x.players.find(p => p.id === s.id).lastQ === i) ? x : null;
    }, 10000, `scores of question ${i + 1}`);
    for (const s of S) {
      const p = r.players.find(pp => pp.id === s.id);
      const a = r.answers[i] && r.answers[i][s.id];
      if (want[s.key] === 'correct') {
        const measured = specPoints(clicks[s.key].t - start, T_SEC);
        check(Math.abs(p.last - measured) <= 50, `q${i + 1} ${s.key}: ${p.last} points ≈ formula on the measured click time (${measured}, ±50)`);
        eq(p.last, specPoints(a.ms, T_SEC), `q${i + 1} ${s.key}: points = 500 + round(500 × (1 − ms/T)) for the stored ms ${a && a.ms}`);
        s.total += p.last;
        s.right++;
        s.lastPts = p.last;
      } else {
        check(!(p.lastQ === i && p.last > 0), `q${i + 1} ${s.key}: ${want[s.key]} answer gets no points`);
        s.lastPts = 0;
      }
      eq(p.score, s.total, `q${i + 1} ${s.key}: host total score`);
      if (want[s.key] === 'none') check(!a, `q${i + 1} ${s.key}: no answer stored`);
      else eq(a && a.choice, clicks[s.key].choice, `q${i + 1} ${s.key}: stored answer`);
      (csvMarks[s.name] = csvMarks[s.name] || []).push(want[s.key] === 'none' ? '' : 'ABCDEF'[clicks[s.key].choice] + (want[s.key] === 'correct' ? ' ✓' : ' ✗'));
    }

    /* the phones: correct / wrong / no answer, +points, total */
    for (const s of S) {
      const sel = `#scrGame [data-screen="result"][data-q="${i}"][data-result="${want[s.key]}"]`;
      const ok = await s.page.waitForSelector(sel, T).then(() => true, () => false);
      check(ok, `q${i + 1} ${s.key}: phone shows "${want[s.key]}"`);
      if (!ok) continue;
      if (want[s.key] === 'correct') {
        const got = await s.page.waitForSelector('#scrGame [data-points]', T).then(e => e.getAttribute('data-points'), () => null);
        eq(Number(got), s.lastPts, `q${i + 1} ${s.key}: phone shows +points = host's points`);
      } else if (want[s.key] === 'wrong') {
        eq(await s.page.getAttribute('#scrGame [data-points]', 'data-points'), '0', `q${i + 1} ${s.key}: wrong answer shows +0`);
        check(await s.page.isVisible('#scrGame .right-ans'), `q${i + 1} ${s.key}: wrong answer shows the right one`);
      } else {
        check(await s.page.$('#scrGame [data-points]') === null && await s.page.isVisible('#scrGame .right-ans'), `q${i + 1} ${s.key}: no answer → no points line, shows the right answer`);
      }
      await s.page.waitForSelector(`#totalScore[data-score="${s.total}"]`, T).then(() => check(true, ''), () => check(false, `q${i + 1} ${s.key}: phone total = ${s.total}`));
    if (i === 0) { await shot(A, 'a3-student-hi-result', true); await shot(Z, 'a3-student-ur-result', true); }
    }

    /* leaderboard */
    if (plan.toBoard === 'click') await tch.click('#nextBtn'); else await press(plan.toBoard);
    await tch.waitForSelector('#hStage[data-phase="board"] #board li', T);
    const expected = ranking(r.players).slice(0, 5);
    eq(await tch.$$eval('#board li .nm', els => els.map(e => e.textContent)), expected.map(p => p.name), `q${i + 1}: leaderboard order`);
    eq(await tch.$$eval('#board li .rk', els => els.map(e => e.textContent)), expected.map(p => String(p.rank)), `q${i + 1}: leaderboard ranks`);
    eq(await tch.$$eval('#board li .sc', els => els.map(e => e.getAttribute('data-score'))), expected.map(p => String(p.score)), `q${i + 1}: leaderboard scores`);
    eq(await tch.$$eval('#board li .plus', els => els.map(e => e.textContent)), expected.map(p => { const s = S.find(x => x.id === p.id); return s.lastPts ? '+' + s.lastPts : ''; }), `q${i + 1}: leaderboard "+points" of this question`);
    if (i === 0) await shot(tch, 'a4-teacher-board');

    if (plan.next === 'final') {
      eq((await tch.textContent('#nextBtn')).trim(), await tr(tch, 'final_results'), 'after the last question the button says "Final results"');
      await tch.click('#nextBtn');
    } else if (plan.next === 'click') await tch.click('#nextBtn');
    else await press(plan.next);
  }

  /* ---------------------------------------------------------------- final */
  step('  5. final: podium, table, phones, CSV');
  await tch.waitForSelector('#hStage[data-phase="final"] #podium', T);
  const fin = await until(async () => { const x = await results(); return x.session.state === 'ended' && x.players.every(p => p.rank) ? x : null; }, 10000, 'session ended with ranks');
  const order = ranking(fin.players);
  eq(order.map(p => p.score), order.map(p => S.find(s => s.id === p.id).total), 'final totals = sum of the points of every question');
  eq(fin.players.map(p => p.rank).sort(), order.map(p => p.rank).sort(), 'ranks written to the players = leaderboard ranks');
  const pods = await tch.$$eval('#podium .pod', els => els.map(e => ({ cls: e.className, id: e.getAttribute('data-id'), name: e.querySelector('.pname').textContent })));
  eq(pods.map(p => p.id), order.slice(0, 3).map(p => p.id), 'podium has the top 3 in order');
  check(pods[0] && /\bp1\b/.test(pods[0].cls) && pods[0].name.includes(order[0].name), 'winner on the 1st-place block: ' + JSON.stringify(pods[0]));
  const table = await tch.$$eval('#finalTable tbody tr', trs => trs.map(tr => [...tr.children].map(td => td.textContent.trim())));
  const fmt = (n) => tch.evaluate(x => EDU.fmt(x), n);                 // the app shows 3,569 (Latin digits, grouped)
  const wantRows = [];
  for (const p of order) wantRows.push([await fmt(p.rank), p.name, await fmt(p.score)]);
  eq(table.map(r => [r[0], r[1], r[2]]), wantRows, 'final table: rank, nickname, score');
  eq(table.map(r => r[3].replace(/\s/g, '')), order.map(p => S.find(s => s.id === p.id).right + '/' + N), 'final table: right answers');
  await shot(tch, 'a5-teacher-final');

  for (const s of S) {
    const host = order.find(p => p.id === s.id);
    const ok = await s.page.waitForSelector(`#scrGame [data-screen="final"][data-rank="${host.rank}"]`, T).then(() => true, () => false);
    check(ok, `${s.key}: phone shows the final screen with the host's rank ${host.rank}`);
    if (!ok) continue;
    const d = await s.page.$eval('#scrGame [data-screen="final"]', e => ({ score: Number(e.dataset.score), right: Number(e.dataset.right), asked: Number(e.dataset.asked) }));
    eq(d, { score: s.total, right: s.right, asked: N }, `${s.key}: final score and "right of asked" (kept across reloads)`);
    eq((await s.page.textContent('#rankLine')).trim(), await tr(s.page, 'final_rank', { rank: String(host.rank), n: '3' }), `${s.key}: "you came ${host.rank} of 3" in the student's language`);
  await shot(K, 'a5-student-ta-final', true);
  await shot(Z, 'a5-student-ur-final', true);
  }
  check(await X.isVisible('#scrCode') && !(await X.isVisible('#scrGame')), 'the removed student is still outside the quiz (code screen)');
  /* the locked-out student kept watching on the nickname screen; the end of the quiz sends it back to the
     code screen with "This quiz has ended" */
  check(!(await Y.isVisible('#scrGame')), 'the locked-out student never got into the quiz');
  await Y.waitForFunction(t => { const e = document.querySelector('#codeErr'); return !document.querySelector('#scrCode').hidden && e && !e.hidden && e.textContent.trim() === t; }, await tr(Y, 'err_session_ended'), T)
    .then(() => check(true, ''), () => check(false, 'the locked-out student is told that the quiz has ended'));

  /* CSV */
  let csv = '';
  try {
    const [dl] = await Promise.all([tch.waitForEvent('download', { timeout: 10000 }), tch.click('#exportCsv')]);
    csv = fs.readFileSync(await dl.path(), 'utf8');
  } catch (e) {
    console.log('  (info) no download event (' + String(e.message).split('\n')[0] + '): reading the CSV from EDU.download');
    csv = await tch.evaluate(() => new Promise(res => {
      const orig = EDU.download;
      EDU.download = (name, content) => { EDU.download = orig; res(String(content)); };
      document.querySelector('#exportCsv').click();
    }));
  }
  check(csv.charCodeAt(0) === 0xFEFF, 'CSV starts with a BOM (Excel reads Indian scripts)');
  const rows = parseCsv(csv);
  const head = await tch.evaluate(n => [EDU.t('col_rank'), EDU.t('col_nick'), EDU.t('score'), EDU.t('col_correct')].concat(Array.from({ length: n }, (_, i) => EDU.t('col_q', { n: i + 1 }))), N);
  eq(rows[0], head, 'CSV header');
  eq(rows.slice(1, 4).map(r => r.slice(0, 4)), order.map(p => [String(p.rank), p.name, String(p.score), String(S.find(s => s.id === p.id).right)]), 'CSV rows: rank, nickname, score, right answers');
  eq(rows.slice(1, 4).map(r => r.slice(4, 4 + N)), order.map(p => csvMarks[p.name]), 'CSV rows: the letter each student chose, ✓ / ✗, empty = no answer');
  eq(rows[4].filter(Boolean), [], 'CSV: one empty row after the players');
  eq(rows.slice(6, 6 + N).map(r => r[2]), sample.questions.map(q => 'ABCDEF'[q.correct] + ': ' + q.options[q.correct]), 'CSV: answer key');

  /* "Remove me" on a phone after the end */
  step('  6. "Remove me", past results');
  await Z.click('#removeMe');                                           // confirm() is accepted
  await Z.waitForSelector('#scrCode:not([hidden])', T);
  const after = await results();
  const zAnswers = Object.values(after.answers).filter(m => m[byKey('Z').id]).length;
  eq([after.players.length, zAnswers], [2, 0], '"Remove me" deleted the Urdu student and her answers');
  eq(await Z.evaluate(() => [sessionStorage.getItem('edu.quiz-join.current'), localStorage.getItem('edu.quiz-join.current')]), [null, null], 'the phone forgot the quiz');
  await tch.click('#hBack');
  const row = `#sessList .srow[data-code="${code}"]`;
  await tch.waitForSelector(row, T);
  eq(await tch.getAttribute(row, 'data-state'), 'ended', 'past sessions list the quiz as ended');
  await shot(tch, 'a6-teacher-dashboard', true);

  /* privacy policy + terms are linked from both apps, in the user's language, and the pages exist */
  const links = async (p, sel) => p.$$eval(sel, as => as.map(a => a.href));
  const tLinks = await links(tch, '#v-dash a.lnk-privacy, #v-dash a.lnk-terms');
  const sLinks = await links(Z, '#privacyLink');
  check(tLinks.some(h => /\/legal\/privacy\.html\?lang=en/.test(h)) && tLinks.some(h => /\/legal\/terms\.html\?lang=en/.test(h)), 'teacher app links to Privacy + Terms: ' + tLinks.join(' '));
  check(sLinks.length === 1 && /\/legal\/privacy\.html\?lang=ur#students$/.test(sLinks[0]), 'student app links to the students part of the privacy policy, in Urdu: ' + sLinks.join(' '));
  for (const h of [...new Set(tLinks.concat(sLinks))]) {
    const st = await tch.evaluate(u => fetch(u, { cache: 'no-store' }).then(r => r.status, () => 0), h);
    eq(st, 200, 'legal page exists: ' + h.replace(base, ''));
  }

  /* the short links: /join/?code=… (the QR target online) and /teacher/ keep the query */
  const J = await open('short link /join', base + 'join/?code=000000&lang=hi', PHONE);
  await J.waitForURL(/\/apps\/quiz-join\/index\.html\?code=000000&lang=hi$/, T).then(() => check(true, ''), () => check(false, '/join/?code= redirects to the student app with the code: ' + J.url()));
  await J.waitForSelector('#codeErr:not([hidden])', T).catch(() => { });
  eq([await J.inputValue('#codeInput'), (await J.textContent('#codeErr')).trim()], ['000000', await tr(J, 'err_not_found_demo')], '/join/ link: the code is filled in and checked (unknown code → Demo-mode hint)');
  const TL = await open('short link /teacher', base + 'teacher/?lang=ta', PROJECTOR);
  await TL.waitForURL(/\/apps\/live-quiz\/index\.html\?lang=ta$/, T).then(() => check(true, ''), () => check(false, '/teacher/ redirects to the teacher app: ' + TL.url()));

  await sleep(500);
  const uniq = [...new Set(problems)];
  check(!uniq.length, 'no console errors / warnings, no page errors, no request outside the test server (except QR library + fonts)' + (uniq.length ? ':\n    ' + uniq.slice(0, 12).join('\n    ') : ''));
  for (const p of pages) await p.close().catch(() => { });
  await ctx.close();
}

/* ===================================================================================== B. Firebase mode */
async function partB(browser, base) {
  step('B. Firebase mode with a FAKE config (no project exists)');
  const FAKE = { apiKey: 'fake', projectId: 'fake', authDomain: 'fake.firebaseapp.com', appId: '1:1:web:1' };
  /* shared/firebase-config.js assigns its own value after this runs (the REAL project since 3 Oct): ignore every later
     assignment, so part B never talks to the live project, only to the fake one */
  const inject = (cfg) => {
    let v = cfg;
    Object.defineProperty(window, 'EDU_FIREBASE', { configurable: true, get() { return v; }, set(x) { } });
  };
  const RAW = /firebase|auth\/|firestore|stack|TypeError|ReferenceError|\bat\s+\S+\s*\(/i;

  async function context(blockSdk) {
    const ctx = await browser.newContext({ viewport: PROJECTOR });
    await ctx.addInitScript(inject, FAKE);
    /* belt and braces: never let part B reach the real project, whatever the page config says */
    await ctx.route(u => /studio-7387948978-ac74c/.test(String(u)), r => { console.log('  FAIL request to the LIVE project blocked: ' + r.request().url()); process.exitCode = 1; return r.abort('blockedbyclient'); });
    if (blockSdk) await ctx.route(u => String(u).startsWith(SDK), r => r.abort('internetdisconnected'));
    return ctx;
  }
  function track(p, label, log) {
    log.reqs = []; log.errs = []; log.cons = [];
    p.on('request', r => log.reqs.push(r.url()));
    p.on('response', r => { if (r.url().startsWith(SDK)) log.reqs.push('200?' + r.status() + ' ' + r.url()); });
    p.on('pageerror', e => log.errs.push(`${label}: page error: ${e && e.message}`));
    p.on('console', m => { if (m.type() === 'error') log.cons.push(m.text()); });
    p.on('dialog', d => d.dismiss().catch(() => { }));
  }
  const errTexts = (p) => p.evaluate(() => {
    const out = {};
    ['not_configured', 'offline', 'quota_exceeded', 'not_found', 'permission_denied', 'unknown'].forEach(k => { if (EDU.has('err_' + k)) out[k] = EDU.t('err_' + k); });
    return out;
  });

  /* ---------------- B1. teacher (hi): SDK loads, Google sign-in fails with a translated message */
  {
    step('  B1. teacher app in hi: Google sign-in with the fake project');
    const ctx = await context(false);
    const p = await ctx.newPage(), log = {};
    track(p, 'teacher', log);
    await p.goto(base + 'apps/live-quiz/index.html?lang=hi&live=1', { waitUntil: 'load' });
    eq(await p.evaluate(() => [EDUCloud.mode, EDUCloud.isDemo]), ['firebase', false], 'fake config on http → Firebase mode');
    check(!(await p.isVisible('#demoBanner')), 'no Demo banner in Firebase mode');
    const btnReady = await p.waitForSelector('#signIn.btn-google:not([disabled]), #signinErr:not([hidden])', { timeout: 40000 }).then(() => true, () => false);
    check(btnReady, 'sign-in button gets ready (or an error is shown) after the SDK loads');
    const sdk = await p.evaluate(() => window.firebase ? [window.firebase.SDK_VERSION, typeof firebase.auth, typeof firebase.firestore] : null);
    const online = !!sdk;
    if (!online) console.log('  (info) the SDK did not load: no internet? Part B can only check the offline message then.');
    eq(sdk, ['12.19.0', 'function', 'function'], 'Firebase compat SDK 12.19.0 (app + auth + firestore) loaded');
    for (const f of ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js']) {
      check(log.reqs.some(u => u === '200?200 ' + SDK + f), `${f} loaded from jsDelivr (status 200)`);
    }
    const otherFb = log.reqs.filter(u => /firebase/i.test(u) && !u.startsWith(SDK) && !u.startsWith(base) && !/^200\?/.test(u) && !/^https:\/\/[^/]*(googleapis\.com|firebaseapp\.com|gstatic\.com)\//.test(u));
    check(!otherFb.length, 'Firebase code comes only from the pinned jsDelivr URLs' + (otherFb.length ? ': ' + otherFb.slice(0, 3).join(' ') : ''));
    check(!log.reqs.some(u => /google-analytics|googletagmanager|firebase-analytics|firebaseinstallations/.test(u)), 'no analytics requests');
    const texts = await errTexts(p);
    let popup = null;
    ctx.on('page', pg => { popup = pg; });
    if (await p.isVisible('#signIn:not([disabled])')) {
      await p.click('#signIn');
      const shown = await p.waitForSelector('#signinErr:not([hidden])', { timeout: 45000 }).then(() => true, () => false);
      check(shown, 'a failed sign-in shows a message on the sign-in card (not a hang)');
      check(!!popup, 'the Google sign-in popup was opened from the click (info: ' + (popup ? popup.url() : 'none') + ')');
    }
    const msg = (await p.textContent('#signinErr span').catch(() => '')).trim();
    await shot(p, 'b1-firebase-teacher-hi-error');
    const which = Object.keys(texts).find(k => texts[k] === msg);
    check(!!which, `the sign-in error is one of the app's translated messages: "${msg}"`);
    console.log('  (info) teacher sign-in error → err_' + which);
    if (online) eq(which, 'not_configured', 'with the SDK loaded, a wrong project shows "not set up yet"');
    check(/[\u0900-\u097F]/.test(msg) && !RAW.test(await p.textContent('#v-signin')), 'the message is Hindi text, no raw Firebase error / stack trace on the page');
    check(!(await p.isDisabled('#signIn')), 'the sign-in button works again after the error');
    const demo = await p.getAttribute('#signinErr a', 'href').catch(() => null);
    check(!!demo && /[?&]mock=1/.test(demo), '"Use Demo mode instead" link: ' + demo);
    if (popup) await popup.close().catch(() => { });
    if (demo) {
      await p.click('#signinErr a');
      await p.waitForSelector('#signIn:not([disabled])', T);
      eq(await p.evaluate(() => [EDUCloud.mode, EDU.lang]), ['mock', 'hi'], 'the link opens Demo mode, language kept');
      check(await p.isVisible('#demoBanner') && (await p.textContent('#signIn')).includes(await p.evaluate(() => EDU.t('signin_demo'))), 'Demo banner + "Try it now in Demo mode" button');
    }
    eq(log.errs, [], 'teacher page: no uncaught page errors');
    if (log.cons.length) console.log('  (info) teacher console errors (network 4xx from the fake key are expected): ' + log.cons.length + ' e.g. ' + log.cons[0].slice(0, 140));
    await ctx.close();
  }

  /* ---------------- B2. student (ur): nothing loads before a code; then a translated error */
  {
    step('  B2. student app in ur: code check with the fake project');
    const ctx = await context(false);
    const p = await ctx.newPage(), log = {};
    track(p, 'student', log);
    await p.setViewportSize(PHONE);
    await p.goto(base + 'apps/quiz-join/index.html?lang=ur&live=1', { waitUntil: 'load' });
    eq(await p.evaluate(() => EDUCloud.mode), 'firebase', 'student page in Firebase mode');
    check(!(await p.isVisible('#demoBanner')), 'no Demo banner on the student page');
    await sleep(1500);
    /* (Google Fonts, from the page design, are fine: only the Firebase SDK and Google's auth/database servers count) */
    const early = log.reqs.filter(u => u.includes('cdn.jsdelivr.net') || /^https:\/\/([^/]*\.)?(firebaseapp\.com|firebaseio\.com)\//.test(u) || (/^https:\/\/[^/]*googleapis\.com\//.test(u) && !u.startsWith('https://fonts.googleapis.com/')));
    check(!early.length, 'nothing from Firebase is loaded before a code is typed' + (early.length ? ': ' + early.slice(0, 3).join(' ') : ''));
    await p.fill('#codeInput', '123456');
    const shown = await p.waitForSelector('#codeErr:not([hidden])', { timeout: 45000 }).then(() => true, () => false);
    check(shown, 'the code check ends with a message (not a hang)');
    const texts = await errTexts(p);
    const msg = (await p.textContent('#codeErr')).trim();
    await shot(p, 'b2-firebase-student-ur-error', true);
    const which = Object.keys(texts).find(k => texts[k] === msg);
    check(!!which, `the student error is one of the app's translated messages: "${msg}"`);
    console.log('  (info) student code check → err_' + which);
    const online = await p.evaluate(() => !!(window.firebase && firebase.SDK_VERSION === '12.19.0'));
    check(online, 'student page loaded the SDK from jsDelivr when the code was typed');
    if (online) eq(which, 'not_configured', 'with the SDK loaded, a wrong project shows "not set up yet"');
    check(/[\u0600-\u06FF]/.test(msg) && !RAW.test(await p.textContent('#app')), 'the message is Urdu text, no raw Firebase error / stack trace on the page');
    check(await p.isVisible('#scrCode') && !(await p.isDisabled('#codeNext')), 'the student can try again');
    eq(log.errs, [], 'student page: no uncaught page errors');
    await ctx.close();
  }

  /* ---------------- B3. jsDelivr blocked: "offline" on both apps */
  {
    step('  B3. jsDelivr blocked: both apps say "no internet"');
    const ctx = await context(true);
    const t = await ctx.newPage(), tlog = {};
    track(t, 'teacher-offline', tlog);
    await t.goto(base + 'apps/live-quiz/index.html?lang=en&live=1', { waitUntil: 'load' });
    await t.waitForSelector('#signinErr:not([hidden])', { timeout: 40000 }).catch(() => { });
    eq((await t.textContent('#signinErr span').catch(() => '')).trim(), await t.evaluate(() => EDU.t('err_offline')), 'teacher: SDK blocked → "No internet" message');
    check(await t.$('#signinErr a[href*="mock=1"]') !== null, 'teacher: offline message offers Demo mode');
    if (await t.isVisible('#signIn:not([disabled])')) {
      await t.click('#signIn');
      await sleep(1500);
      eq((await t.textContent('#signinErr span').catch(() => '')).trim(), await t.evaluate(() => EDU.t('err_offline')), 'teacher: retrying sign-in offline shows the same message');
    }
    const s = await t.context().newPage(), slog = {};
    track(s, 'student-offline', slog);
    await s.goto(base + 'apps/quiz-join/index.html?lang=en&code=654321&live=1', { waitUntil: 'load' });
    await s.waitForSelector('#codeErr:not([hidden])', { timeout: 40000 }).catch(() => { });
    eq((await s.textContent('#codeErr')).trim(), await s.evaluate(() => EDU.t('err_offline')), 'student: SDK blocked → "No internet" message');
    eq(tlog.errs.concat(slog.errs), [], 'offline: no uncaught page errors');
    await ctx.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
