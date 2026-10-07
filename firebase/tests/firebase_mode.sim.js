#!/usr/bin/env node
/* Firebase-mode simulation of one Live Class Quiz: the REAL shared/cloud.js (Firebase mode) against a fake
 * Firebase SDK and an in-memory Firestore that enforces a JavaScript port of firestore.rules and counts what
 * Firestore would bill. No Firebase project, no Java and no internet are needed.
 *
 *   node firebase/tests/firebase_mode.sim.js                     (40 students, 10 questions; exit code 0 = PASS)
 *   node firebase/tests/firebase_mode.sim.js --students=5 --questions=3
 *   node firebase/tests/firebase_mode.sim.js --strict            (rules look-ups counted per write, no caching:
 *                                                                 checks cloud.js's small-batch fallback)
 *
 * One headless Chrome page holds the backend (sim/fake-backend.js); every device is an iframe
 * (?dev=host, ?dev=s00…) that loads firebase-config.js + a fake config, cloud-mock.js and cloud.js. The
 * jsDelivr SDK URLs are answered with sim/fake-sdk.js, so cloud.js runs its real Firebase code paths:
 * Google sign-in, anonymous students, transactions, batches, listeners, the join/answer/score/end flow,
 * "Remove me", deleting a session and deleting the teacher account. It checks the results (scores, ranks,
 * nickname rules, lock, kick, ended sessions hidden from strangers, nothing left behind after deletes) and
 * prints the reads / writes / deletes of each phase, for firebase/SECURITY_REVIEW.md.
 * The real rules are tested by firebase/tests/rules.test.js (needs the emulator); this is a model of them. */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..', '..');
const { chromium } = require(path.join(ROOT, 'tools', 'node_modules', 'playwright-core'));
const CHROME = require('../../tools/chrome-path')();
const arg = (name, def) => { const a = process.argv.find(x => x.startsWith('--' + name + '=')); return a ? Number(a.split('=')[1]) : def; };
const N = arg('students', 40), Q = arg('questions', 10);
const STRICT = process.argv.includes('--strict');
const LONG = process.argv.includes('--long');      /* realistic Hindi questions (~150 characters, options ~25) */
const SDK = 'https://cdn.jsdelivr.net/npm/firebase@12.19.0/';

/* the nickname character classes, taken from the real rules file (so the model cannot drift from it) */
const RULES = fs.readFileSync(path.join(ROOT, 'firebase', 'firestore.rules'), 'utf8');
const mBad = RULES.match(/!n\.matches\('\(\?s\)\.\*\[\[:cntrl:\]\/([^\]]*)\]\.\*'\)/);
const mSkel = RULES.match(/n\.lower\(\)\.replace\('\[([^\]]*)\]', ''\)/);
if (!mBad || !mSkel) { console.error('could not find the nickname character classes in firestore.rules'); process.exit(2); }

const FAKE_CFG = "window.EDU_FIREBASE = { apiKey: 'AIzaFakeKeyForTheSimulation', authDomain: 'sim.firebaseapp.com', projectId: 'sim', appId: '1:1:web:1' };";
const TOP = `<!doctype html><html><head><meta charset="utf-8"><title>sim</title><link rel="icon" href="data:,"></head><body>
<script src="/firebase/tests/sim/fake-backend.js"></script>
<script>window.__FakeFirestore = new FakeFirestoreBackend(${JSON.stringify({ badNameClass: mBad[1], skelClass: mSkel[1], strictAccessLimit: STRICT })});</script>
</body></html>`;
const CLIENT = `<!doctype html><html><head><meta charset="utf-8"><title>client</title><link rel="icon" href="data:,"></head><body>
<script src="/shared/firebase-config.js"></script><script>${FAKE_CFG}</script>
<script src="/shared/cloud-mock.js"></script><script src="/shared/cloud.js"></script>
<script>window.__try = async (fn) => { try { return { ok: true, v: await fn() } } catch (e) { return { ok: false, code: e && e.code, msg: e && e.message } } };</script>
</body></html>`;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/__sim/top.html') { res.writeHead(200, { 'Content-Type': MIME['.html'] }); res.end(TOP); return; }
      if (url.pathname === '/__sim/client.html') { res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : CLIENT); return; }
      const fp = path.join(ROOT, decodeURIComponent(url.pathname));
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(fp).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

let passed = 0;
const failures = [];
function check(cond, msg) { if (cond) { passed++; return; } failures.push(msg); console.log('  FAIL ' + msg); }
function eq(a, b, msg) { check(JSON.stringify(a) === JSON.stringify(b), `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

/* a quiz with Q questions (4 options; correct = q % 4) */
const QUIZ = { title: 'Simulation quiz', lang: 'en', questions: [] };
for (let q = 0; q < Q; q++) QUIZ.questions.push(LONG
  ? { q: `प्रश्न ${q + 1}: सौर मंडल में सूर्य के सबसे पास कौन-सा ग्रह है, और उसकी सतह का तापमान दिन और रात में इतना अलग क्यों होता है? सही विकल्प चुनें।`,
      options: ['बुध, क्योंकि वहाँ हवा नहीं है', 'शुक्र, क्योंकि बादल बहुत घने हैं', 'मंगल, क्योंकि वह लाल रंग का है', 'पृथ्वी, क्योंकि यहाँ पानी है'], correct: q % 4 }
  : { q: `Question ${q + 1}: what is ${q} + 1?`, options: [0, 1, 2, 3].map(k => String(q + 1 + k - (q % 4))), correct: q % 4 });
/* nicknames in several scripts (one with a joiner inside a conjunct) */
const NICK = ['Asha', 'रवि', 'கவின்', 'زویا', 'Meena', 'ক্ষিতি', 'Riya ❤\uFE0F', 'Kabir', 'ਹਰਪ੍ਰੀਤ', 'Neha', 'क्\u200Dष', 'Tara'];
const nick = i => (NICK[i % NICK.length] + ' ' + (i + 1)).slice(0, 20);
/* what each student does on question q: -1 = no answer, else the choice (about 60% right) */
function plan(i, q) {
  const h = (i * 7919 + q * 104729) % 100;
  if (h < 10) return -1;
  return h < 64 ? q % 4 : (q % 4 + 1 + (h % 3)) % 4;
}

async function main() {
  if (!CHROME) throw new Error('Chrome / Edge not found');
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const problems = [];
  const ctx = await browser.newContext();
  const fakeSdk = fs.readFileSync(path.join(__dirname, 'sim', 'fake-sdk.js'), 'utf8');
  const REST = 'https://firestore.googleapis.com/v1/projects/sim/databases/(default)/documents/';
  const restCalls = [];
  let page = null;
  await ctx.route('**/*', async route => {
    const u = route.request().url();
    if (u.startsWith(base)) return route.continue();
    /* EDUCloud.signupCount(): one plain REST GET of stats/signups, answered from the fake backend (rules checked, signed out) */
    if (u.startsWith(REST)) {
      const req = route.request();
      restCalls.push({ url: u, method: req.method(), cookie: (await req.allHeaders()).cookie || '' });
      const docPath = decodeURIComponent(u.slice(REST.length).split('?')[0]);
      const r = await page.evaluate(p => window.__FakeFirestore.get('rest', null, p).then(x => x, e => ({ denied: e.code })), docPath);
      if (r.denied) return route.fulfill({ status: 403, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"error":{"code":403,"status":"PERMISSION_DENIED"}}' });
      if (!r.exists) return route.fulfill({ status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"error":{"code":404,"status":"NOT_FOUND"}}' });
      const fields = {};
      for (const [k, v] of Object.entries(r.data)) fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ name: 'projects/sim/databases/(default)/documents/' + docPath, fields }) });
    }
    if (u === SDK + 'firebase-app-compat.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: fakeSdk });
    if (u === SDK + 'firebase-auth-compat.js' || u === SDK + 'firebase-firestore-compat.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* fake: everything is in firebase-app-compat.js */' });
    problems.push('unexpected network request: ' + u);
    return route.abort();
  });
  page = await ctx.newPage();
  page.on('pageerror', e => problems.push('page error: ' + (e && e.message)));
  page.on('console', m => { if (m.type() === 'error') problems.push('console error: ' + m.text()); });
  page.on('dialog', d => d.accept().catch(() => { }));
  await page.goto(base + '/__sim/top.html');

  async function device(dev) {
    await page.evaluate(([dev, src]) => new Promise((res, rej) => {
      const f = document.createElement('iframe');
      f.name = dev; f.src = src; f.onload = () => res(); f.onerror = rej;
      document.body.appendChild(f);
    }), [dev, '/__sim/client.html?live=1&dev=' + dev]);
    const fr = page.frames().find(f => f.name() === dev);
    await fr.waitForFunction(() => window.EDUCloud && window.EDUCloud.mode === 'firebase');
    return fr;
  }
  const bill = () => page.evaluate(() => window.__FakeFirestore.snapshot());
  const denials = () => page.evaluate(() => window.__FakeFirestore.denials.length);
  const docs = prefix => page.evaluate(p => window.__FakeFirestore.paths(p), prefix);
  const phases = [];
  let last = {}, lastDen = 0;
  async function phase(name, opts) {
    const now = await bill(), den = await denials();
    const row = { name, host: { r: 0, w: 0, d: 0 }, stu: { r: 0, w: 0, d: 0 }, rule: 0, listen: 0, bytes: 0, denied: den - lastDen, extra: !!(opts && opts.extra) };
    for (const c of Object.keys(now)) {
      const a = now[c], b = last[c] || { reads: 0, writes: 0, deletes: 0, ruleReads: 0, listenReads: 0, bytes: 0 };
      row.bytes += a.bytes - b.bytes;
      const who = c === 'host' ? row.host : row.stu;
      who.r += a.reads - b.reads + a.ruleReads - b.ruleReads; who.w += a.writes - b.writes; who.d += a.deletes - b.deletes;
      row.rule += a.ruleReads - b.ruleReads; row.listen += a.listenReads - b.listenReads;
    }
    phases.push(row);
    /* in --strict mode big batches are refused once and then retried in small ones, so only the results are checked */
    if (opts && opts.expectDenied !== undefined && !STRICT) eq(row.denied, opts.expectDenied, `${name}: refused requests`);
    last = now; lastDen = den;
  }

  try {
    console.log(`Firebase-mode simulation: ${N} students, ${Q} questions${STRICT ? ' (strict rule look-up limit)' : ''}`);
    /* ------------------------------------------------ A. teacher */
    const host = await device('host');
    await host.evaluate(() => EDUCloud.ready());
    const t = await host.evaluate(() => EDUCloud.signInTeacher());
    eq([t.uid, t.name], ['g-host', 'Teacher host'], 'teacher signs in with (fake) Google');
    const quizId = await host.evaluate(q => EDUCloud.saveQuiz(q), QUIZ);
    const quiz = await host.evaluate(id => EDUCloud.getQuiz(id), quizId);
    const { code } = await host.evaluate(q => EDUCloud.createSession(q, { timePerQ: 20 }), quiz);
    check(/^[0-9]{6}$/.test(code), 'createSession → 6-digit code ' + code);
    await host.evaluate(c => { window.__H = null; window.__hostErr = null; window.__offH = EDUCloud.hostWatch(c, s => { window.__H = s; }, e => { window.__hostErr = e.code; }); }, code);
    await host.waitForFunction(() => window.__H && window.__H.session && window.__H.key);
    eq(await host.evaluate(() => [window.__H.session.state, window.__H.key.correct.length, 'correct' in window.__H.session.questions[0]]), ['lobby', Q, false], 'host: lobby, answer key private, no answers in the public questions');
    eq(await docs('teachers/'), ['teachers/g-host'], 'teachers/{uid} created on first sign-in');
    await phase('teacher: sign in, save quiz, create session, host screen', { expectDenied: 0 });

    /* ------------------------------------------------ B. students check the code, then join */
    const S = [];
    for (let i = 0; i < N; i++) S.push(await device('s' + String(i).padStart(2, '0')));
    await phase('(students open the page: no Firestore use)', { extra: true });
    await Promise.all(S.map((f, i) => f.evaluate(([c, name]) => new Promise((res, rej) => {
      window.__P = null; window.__pErr = null;
      window.__offP = EDUCloud.playerWatch(c, s => { window.__P = s; }, e => { window.__pErr = e.code; });
      const t0 = Date.now();
      (function wait() {
        if (window.__P) return EDUCloud.joinSession(c, name).then(res, rej);
        if (Date.now() - t0 > 15000) return rej(new Error('no playerWatch state'));
        setTimeout(wait, 20);
      })();
    }), [code, nick(i)])));
    await Promise.all(S.map(f => f.waitForFunction(() => window.__P && window.__P.me && window.__P.session.state === 'lobby')));
    await host.waitForFunction(n => window.__H.players.length === n, N);
    const names = await host.evaluate(() => window.__H.players.map(p => p.name));
    eq(names.slice().sort(), S.map((_, i) => nick(i)).sort(), `host sees all ${N} nicknames (Hindi, Tamil, Urdu, Bengali, Punjabi, emoji, joiner)`);
    await phase(`${N} students: code check (playerWatch) + join`, { expectDenied: 0 });

    /* ------------------------------------------------ B2. nickname rules, lock, kick (extra, not part of a normal class) */
    const X1 = await device('x1'), X2 = await device('x2');
    const tryJoin = (f, name) => f.evaluate(([c, n]) => __try(() => EDUCloud.joinSession(c, n)), [code, name]);
    eq((await tryJoin(X1, 'ASHA 1')).code, 'name-taken', 'a taken nickname in other letter case → name-taken');
    eq((await tryJoin(X1, 'Asha\u200D 1')).code, 'name-taken', 'look-alike nickname (Asha + invisible joiner) → name-taken');
    eq((await tryJoin(X1, 'Asha 1\uFE0F')).code, 'name-taken', 'look-alike nickname (+ variation selector) → name-taken');
    const spoof = await tryJoin(X1, '\u202EMee\u200Bna\u00A0X');
    eq([spoof.ok, spoof.v && spoof.v.name], [true, 'Meena X'], 'bidi override / zero-width / no-break space are cleaned before joining');
    await host.evaluate(c => EDUCloud.lockSession(c, true), code);
    await S[0].waitForFunction(() => window.__P.session.locked === true);
    eq((await tryJoin(X2, 'Late')).code, 'session-locked', 'join a locked session → session-locked');
    await X1.evaluate(c => { window.__P = null; window.__pErr = null; EDUCloud.playerWatch(c, s => { window.__P = s; }, e => { window.__pErr = e.code; }); }, code);
    await X1.waitForFunction(() => window.__P && window.__P.me);
    const x1id = await X1.evaluate(() => window.__P.me.id);
    await host.waitForFunction(n => window.__H.players.length === n, N + 1);
    await host.evaluate(([c, id]) => EDUCloud.kickPlayer(c, id), [code, x1id]);
    await X1.waitForFunction(() => window.__P && window.__P.me === null && window.__P.kicked === true);
    check(true, 'a removed student sees kicked = true');
    eq((await tryJoin(X1, 'Back again')).code, 'permission-denied', 'a removed student cannot join again');
    eq((await docs(`sessions/${code}/names/meena x`)).length, 0, "the removed student's nickname is free again");
    await host.waitForFunction(n => window.__H.players.length === n, N);
    await phase('extra: nickname checks, lock, one kick (2 more devices)', { extra: true });

    /* ------------------------------------------------ C. questions */
    for (let q = 0; q < Q; q++) {
      await host.evaluate(([c, q]) => EDUCloud.startQuestion(c, q), [code, q]);
      await Promise.all(S.map(f => f.waitForFunction(q => window.__P.session.state === 'question' && window.__P.session.current === q, q)));
      let answering = 0;
      await Promise.all(S.map((f, i) => {
        const ch = plan(i, q);
        if (ch < 0) return null;
        answering++;
        return f.evaluate(([c, q, ch, wait]) => new Promise(r => setTimeout(r, wait)).then(() => EDUCloud.submitAnswer(c, q, ch)), [code, q, ch, (i * 37) % 300]);
      }));
      await host.waitForFunction(([q, n]) => window.__H.answers[q] && Object.keys(window.__H.answers[q]).length === n, [q, answering]);
      await host.evaluate(([c, q]) => EDUCloud.revealQuestion(c, q), [code, q]);
      await host.waitForFunction(q => window.__H.session.state === 'reveal' && window.__H.session.reveal.index === q, q);
      /* the host app's scoring loop (apps/live-quiz maybeScore): write, wait for the echo, repeat until nothing changes */
      for (let k = 0; k < 5; k++) {
        const upd = await host.evaluate(q => EDUCloud.computeScores(window.__H, q), q);
        if (!Object.keys(upd).length) break;
        await host.evaluate(([c, u]) => EDUCloud.writeScores(c, u), [code, upd]);
        await host.waitForFunction(([q, ids]) => ids.every(id => window.__H.players.some(p => p.id === id && p.lastQ === q)), [q, Object.keys(upd)]);
      }
      const want = await host.evaluate(() => { const o = {}; window.__H.players.forEach(p => { o[p.id] = p.score; }); return o; });
      await Promise.all(S.map(f => f.waitForFunction(w => window.__P.session.state === 'reveal' && window.__P.me && window.__P.me.score === w[window.__P.me.id], want)));
      const first = S.findIndex((_, i) => plan(i, 0) === 0);
      if (q === 0 && first >= 0) {
        const s0 = await S[first].evaluate(() => window.__P);
        const a0 = await host.evaluate(id => window.__H.answers[0][id], s0.me.id);
        const pts = await host.evaluate(([ms]) => EDUCloud.points(true, ms, 20), [a0 && a0.ms]);
        eq([s0.session.reveal.correct, s0.myAnswers[0], s0.me.last], [0, 0, pts], 'q1: phone sees the reveal, its own answer and its points (spec formula)');
      }
    }
    check(true, `${Q} questions: every phone shows the same score as the host`);
    await phase(`${Q} questions (start, ~${Math.round(N * 0.9)} answers, reveal, scores)`, { expectDenied: 0 });

    /* ------------------------------------------------ D. end: ranks + ended */
    const ranks = await host.evaluate(() => { const o = {}; EDUCloud.rankPlayers(window.__H.players).forEach(p => { o[p.id] = { rank: p.rank }; }); return o; });
    await host.evaluate(([c, r]) => EDUCloud.writeScores(c, r), [code, ranks]);
    await host.evaluate(c => EDUCloud.endSession(c), code);
    await Promise.all(S.map(f => f.waitForFunction(r => window.__P.session.state === 'ended' && window.__P.me.rank === r[window.__P.me.id].rank, ranks)));
    check(true, 'every phone shows ended + the same rank as the host');
    /* 1 refused: the removed student's (x1) listener on the session stops when it ends (rules: players + owner only) */
    await phase('end: ranks for everyone + ended', { expectDenied: 1 });

    /* ------------------------------------------------ E. after the end */
    const X3 = await device('x3');
    await X3.evaluate(c => { window.__P = null; window.__pErr = null; EDUCloud.playerWatch(c, s => { window.__P = s; }, e => { window.__pErr = e.code; }); }, code);
    await X3.waitForFunction(() => window.__P);
    eq(await X3.evaluate(() => [window.__P.session.state, window.__P.session.title, window.__P.session.questions.length, window.__P.me, window.__pErr]), ['ended', '', 0, null, null],
      'a stranger with the code of an ended session sees only "ended" (no title, no questions, no error)');
    eq((await tryJoin(X3, 'Stranger')).code, 'session-ended', 'joining an ended session → session-ended');
    eq(await X1.evaluate(() => [window.__P.session.state, window.__P.kicked, window.__pErr]), ['ended', true, null], 'the removed student: ended, still kicked, no error');
    await S[1].goto(base + '/__sim/client.html?live=1&dev=s01');
    await S[1].waitForFunction(() => window.EDUCloud && window.EDUCloud.mode === 'firebase');
    const rj = await S[1].evaluate(c => EDUCloud.joinSession(c, 'anything'), code);
    eq([rj.name, rj.rejoined], [nick(1), true], 'after a reload the student is the same player (rejoin)');
    await S[1].evaluate(c => { window.__P = null; EDUCloud.playerWatch(c, s => { window.__P = s; }); }, code);
    await S[1].waitForFunction(() => window.__P && window.__P.me);
    const re = await S[1].evaluate(() => window.__P);
    const myPlan = {}; for (let q = 0; q < Q; q++) if (plan(1, q) >= 0) myPlan[q] = plan(1, q);
    eq([re.session.state, re.session.title, re.me.rank, re.myAnswers], ['ended', QUIZ.title, ranks[re.me.id].rank, myPlan], 'after a reload a player still sees the full ended session, rank and answers');
    eq((await S[2].evaluate(c => __try(() => EDUCloud.submitAnswer(c, 0, 1)), code)).code, 'permission-denied', 'changing an answer after the end → refused');
    await phase('extra: stranger + removed student + one reload after the end', { extra: true });

    const half = S.slice(0, Math.floor(N / 2));
    const ids = await Promise.all(half.map(f => f.evaluate(() => window.__P.me.id)));
    await Promise.all(half.map(f => f.evaluate(c => EDUCloud.leaveSession(c), code)));
    const left = await docs(`sessions/${code}/`);
    check(ids.every(id => !left.some(p => p.indexOf(id) >= 0)), `"Remove me" (${half.length} students): their player, nickname and answers are gone`);
    check(!left.some(p => /\/names\/(asha 1|रवि 2)$/.test(p)), '"Remove me" frees the nickname');
    await phase(`"Remove me" by ${half.length} students`, { expectDenied: 0 });

    /* ------------------------------------------------ F. results, delete the session, delete the account */
    const res = await host.evaluate(c => EDUCloud.sessionResults(c), code);
    eq([res.session.state, res.players.length, res.key.correct.length], ['ended', N - half.length, Q], 'sessionResults (CSV) after "Remove me"');
    eq((await host.evaluate(() => EDUCloud.listSessions())).map(s => s.code), [code], 'listSessions');
    await host.evaluate(c => EDUCloud.deleteSession(c), code);
    eq(await docs(`sessions/${code}`), [], 'deleteSession leaves nothing: session, key, players, names, answers');
    await phase('teacher: results, list, delete the session', { expectDenied: 0 });

    await host.evaluate(() => window.__offH());
    const { code: code2 } = await host.evaluate(q => EDUCloud.createSession(q, {}), quiz);
    await S[N - 1].evaluate(c => EDUCloud.joinSession(c, 'Late joiner'), code2);
    await host.evaluate(() => EDUCloud.deleteTeacherAccount());
    eq([await docs('quizzes/'), await docs('sessions/'), await docs('teachers/')], [[], [], []], 'deleteTeacherAccount: no quiz, session (with its players) or teacher record left');
    eq(await host.evaluate(() => __try(() => EDUCloud.listQuizzes()).then(r => r.code)), 'permission-denied', 'signed out after the account is deleted');
    await phase('extra: second session + delete the teacher account', { extra: true });

    /* ------------------------------------------------ G. the "Stay updated" list (EDUCloud.registerInterest) */
    const su = await device('signup');
    const r1 = await su.evaluate(() => __try(() => EDUCloud.registerInterest({ email: ' Asha.Verma@School.EDU.in ', name: 'Asha  Verma', role: 'teacher', org: 'KV No. 1', place: 'Bhopal', prefLang: 'hi', topics: ['apps', 'training', 'apps'], consent: true, lang: 'hi', page: 'schools' })));
    check(r1.ok && r1.v && typeof r1.v.id === 'string', 'registerInterest saves a sign-up ' + JSON.stringify(r1));
    const ip = await docs('interest/');
    eq(ip.length, 1, 'one document in interest/');
    const rec = await page.evaluate(p => window.__FakeFirestore.data(p), ip[0]);
    eq(Object.keys(rec).sort(), ['consent', 'createdAt', 'email', 'lang', 'name', 'org', 'page', 'place', 'prefLang', 'role', 'topics', 'uid'], 'sign-up has exactly the agreed fields');
    eq([rec.email, rec.name, rec.role, rec.org, rec.place, rec.prefLang, rec.topics, rec.consent, rec.lang, rec.page], ['asha.verma@school.edu.in', 'Asha Verma', 'teacher', 'KV No. 1', 'Bhopal', 'hi', ['apps', 'training'], true, 'hi', 'schools'], 'sign-up values (email lower case, topics de-duplicated)');
    check(rec.createdAt && rec.createdAt.__ts !== undefined && /^anon/.test(rec.uid), 'createdAt = server time, uid = an anonymous id');
    eq([ip[0], r1.v.id], ['interest/' + rec.uid, rec.uid], 'the document id is the anonymous uid (one sign-up per account)');
    const intUser = () => su.evaluate(() => { const a = firebase.apps.find(x => x.name === 'edu-interest'); return a && a.auth().currentUser ? a.auth().currentUser.uid : null; });
    await su.waitForFunction(() => { const a = firebase.apps.find(x => x.name === 'edu-interest'); return a && !a.auth().currentUser; });
    eq(await intUser(), null, 'after the sign-up the throw-away account is signed out (no sign-up identity stays on the device)');
    eq(await su.evaluate(() => __try(() => EDUCloud.registerInterest({ email: 'x@y.in', role: 'parent', topics: ['videos'], consent: false })).then(r => r.code)), 'invalid-input', 'no consent → invalid-input before anything is sent');
    eq(await su.evaluate(() => __try(() => EDUCloud.registerInterest({ email: 'not-an-email', role: 'parent', topics: ['videos'], consent: true })).then(r => r.code)), 'invalid-input', 'bad email → invalid-input');
    /* a second person on the same computer, and two sign-ups sent at the same moment (they run one after another) */
    const r2 = await su.evaluate(() => Promise.all([
      __try(() => EDUCloud.registerInterest({ email: 'hr@company.example', role: 'org', topics: ['training'], consent: true, lang: 'en', prefLang: 'en', page: 'business' })),
      __try(() => EDUCloud.registerInterest({ email: 'principal@school.example', role: 'principal', topics: ['apps', 'videos', 'training'], consent: true, lang: 'mr', prefLang: 'mr', page: 'home' }))]));
    check(r2.every(r => r.ok), 'two more sign-ups from the same device both succeed ' + JSON.stringify(r2));
    const ip2 = await docs('interest/');
    const recs = await Promise.all(ip2.map(p => page.evaluate(q => window.__FakeFirestore.data(q), p)));
    check(ip2.length === 3 && new Set(recs.map(d => d.uid)).size === 3 && ip2.every((p, i) => p === 'interest/' + recs[i].uid),
      'every sign-up on the same device gets a new anonymous id, used as its document id');
    const stuUid = await S[0].evaluate(() => (firebase.apps.find(a => a.name === 'edu-student') || { auth: () => ({}) }).auth().currentUser);
    await S[0].evaluate(() => EDUCloud.registerInterest({ email: 'parent@example.in', role: 'parent', topics: ['videos'], consent: true, lang: 'ta', prefLang: 'ta', page: 'home' }));
    const ip3 = await docs('interest/');
    const mine = (await Promise.all(ip3.map(p => page.evaluate(q => window.__FakeFirestore.data(q), p)))).find(d => d.email === 'parent@example.in');
    check(mine && stuUid && mine.uid !== stuUid.uid, 'the sign-up uses its own anonymous id, never the quiz player’s');
    eq(await S[0].evaluate(() => (firebase.apps.find(a => a.name === 'edu-student') || { auth: () => ({}) }).auth().currentUser.uid), stuUid.uid, 'the quiz player stays signed in');
    const rb = await su.evaluate(p => __try(() => firebase.apps.find(a => a.name === 'edu-interest').firestore().collection('interest').doc(p.split('/')[1]).get()), ip[0]);
    eq([rb.ok, rb.code], [false, 'permission-denied'], 'nobody can read a sign-up back, not even the device that wrote it');
    /* ATTACK: a script that keeps one anonymous account and writes again → refused (one document per account) */
    const atk = await su.evaluate(async () => {
      const app = firebase.apps.find(a => a.name === 'edu-interest'), db = app.firestore();
      const u = (await app.auth().signInAnonymously()).user;
      const r = id => ({ name: '', email: 'spam' + id.length + '@example.com', role: 'other', org: '', place: '', prefLang: 'en', topics: ['apps'], consent: true, lang: 'en', page: 'home', createdAt: firebase.firestore.FieldValue.serverTimestamp(), uid: u.uid });
      const out = [];
      out.push(await __try(() => db.collection('interest').doc(u.uid).set(r(u.uid))));
      out.push(await __try(() => db.collection('interest').doc(u.uid).set(r(u.uid))));
      out.push(await __try(() => db.collection('interest').doc('other-id').set(r('other-id'))));
      await app.auth().signOut();
      return out.map(x => x.ok ? 'ok' : x.code);
    });
    eq(atk, ['ok', 'permission-denied', 'permission-denied'], 'one account = one sign-up: writing again, or under another id, is refused');
    /* the public counter stats/signups: +1 in the same batch as each of the 4 sign-ups made through registerInterest;
       the attack script's lone sign-up above did not add 1 (allowed: the counter may lag, never run ahead) */
    eq(await page.evaluate(() => window.__FakeFirestore.data('stats/signups')), { count: 4 }, 'stats/signups counts the 4 sign-ups, +1 each');
    const atk2 = await su.evaluate(async () => {
      const app = firebase.apps.find(a => a.name === 'edu-interest'), db = app.firestore(), FV = firebase.firestore.FieldValue;
      const out = [];
      const u = (await app.auth().signInAnonymously()).user;              /* a new account, +1 without a sign-up */
      out.push(await __try(() => db.collection('stats').doc('signups').set({ count: FV.increment(1) }, { merge: true })));
      const r = { name: '', email: 'jump@example.com', role: 'other', org: '', place: '', prefLang: 'en', topics: ['apps'], consent: true, lang: 'en', page: 'home', createdAt: FV.serverTimestamp(), uid: u.uid };
      const b = db.batch();                                               /* a real sign-up, but +5 */
      b.set(db.collection('interest').doc(u.uid), r);
      b.set(db.collection('stats').doc('signups'), { count: FV.increment(5) }, { merge: true });
      out.push(await __try(() => b.commit()));
      await app.auth().signOut();
      return out.map(x => x.ok ? 'ok' : x.code);
    });
    eq(atk2, ['permission-denied', 'permission-denied'], 'counter: +1 without a sign-up, or +5 with one, is refused');
    eq(await page.evaluate(() => window.__FakeFirestore.data('stats/signups')), { count: 4 }, 'stats/signups unchanged by the attacks');
    const n1 = await su.evaluate(() => EDUCloud.signupCount());
    const n2 = await su.evaluate(() => EDUCloud.signupCount());
    const n3 = await S[1].evaluate(() => EDUCloud.signupCount());
    eq([n1, n2, n3], [4, 4, 4], 'signupCount() reads the public number');
    eq([restCalls.length, restCalls[0] && restCalls[0].method, restCalls[0] && restCalls[0].cookie], [1, 'GET', ''], 'signupCount(): ONE plain GET without cookies, then the cached number (same page and same tab)');
    check(restCalls.length && /\/stats\/signups\?key=/.test(restCalls[0].url), 'signupCount() asks only for stats/signups ' + (restCalls[0] && restCalls[0].url));
    await phase('extra: "Stay updated": 4 sign-ups +1 each, 5 refused, 1 count read', { extra: true, expectDenied: 5 });

    eq(await host.evaluate(() => window.__hostErr), null, 'no hostWatch errors');
    const pErrs = await Promise.all(S.slice(Math.floor(N / 2)).map(f => f.evaluate(() => window.__pErr)));
    eq(pErrs.filter(Boolean), [], 'no playerWatch errors');
    if (process.argv.includes('--verbose')) console.log('refused requests:\n' + (await page.evaluate(() => window.__FakeFirestore.denials)).map(d => `  ${d.client} ${d.op} ${d.path}`).join('\n'));
  } finally {
    await browser.close();
    srv.close();
  }

  /* ------------------------------------------------ report */
  const pad = (s, n) => String(s).padEnd(n), num = (v, n) => String(v).padStart(n);
  console.log('\nBilled Firestore operations (reads include security-rule look-ups):');
  console.log(pad('phase', 64) + num('host r/w/d', 16) + num('students r/w/d', 18) + num('rule rd', 9) + num('KB out', 9) + num('refused', 9));
  const tot = { r: 0, w: 0, d: 0, b: 0 };
  for (const p of phases) {
    console.log(pad((p.extra ? '  ' : '* ') + p.name, 64) + num(`${p.host.r}/${p.host.w}/${p.host.d}`, 16) + num(`${p.stu.r}/${p.stu.w}/${p.stu.d}`, 18) + num(p.rule, 9) + num(Math.round(p.bytes / 1024), 9) + num(p.denied, 9));
    if (!p.extra) { tot.r += p.host.r + p.stu.r; tot.w += p.host.w + p.stu.w; tot.d += p.host.d + p.stu.d; tot.b += p.bytes; }
  }
  const perDay = Math.floor(Math.min(50000 / tot.r, 20000 / tot.w, 20000 / Math.max(1, tot.d)));
  const perDayEgress = Math.floor(10 * 1024 * 1024 * 1024 / 30 / Math.max(1, tot.b));
  console.log(`\n* = one normal class of ${N} students and ${Q} questions, from sign-in to deleting the session:`);
  console.log(`  ${tot.r} reads, ${tot.w} writes, ${tot.d} deletes → about ${perDay} such sessions per day on the free Spark plan (50k reads, 20k writes, 20k deletes).`);
  console.log(`  ${(tot.b / 1048576).toFixed(1)} MB sent to the devices → about ${perDayEgress} such sessions per day within the 10 GiB/month of downloads.`);
  for (const p of problems) failures.push(p);
  if (problems.length) console.log(problems.map(p => '  FAIL ' + p).join('\n'));
  console.log(`\n=== Firebase-mode simulation: ${failures.length ? 'FAIL' : 'PASS'} (${passed} checks passed, ${failures.length} failed) ===`);
  process.exit(failures.length ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
