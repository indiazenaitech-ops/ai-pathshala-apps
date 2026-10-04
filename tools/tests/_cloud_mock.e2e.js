#!/usr/bin/env node
/* End-to-end test of the Demo-mode cloud (shared/cloud-mock.js used through shared/cloud.js).
 *
 *   node tools/tests/_cloud_mock.e2e.js            (from the project root; exit code 0 = PASS)
 *
 * Serves the repo on 127.0.0.1, opens ONE browser context with a host tab and two student tabs (plus a
 * third tab for attack cases) and drives window.EDUCloud with page.evaluate():
 *   sign in → save quiz → create session → 2 joins → start q0 → answers → reveal → scores → q1 → end,
 * with live updates between tabs (hostWatch / playerWatch), the rule checks (name taken, locked, kicked,
 * answer twice, wrong question, ended…), reload = same player, results, delete, account delete.
 * Also: ?mock=1 / config detection, a file:// run across two tabs, and no console errors anywhere.
 * Not part of verify.js (the leading "_" keeps it out of the per-app tests). */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const SCRIPTS = ['shared/firebase-config.js', 'shared/cloud-mock.js', 'shared/cloud.js'];
const FAKE_CFG = "window.EDU_FIREBASE = { apiKey: 'AIzaFakeKeyForTestsOnly', authDomain: 'demo-test.firebaseapp.com', projectId: 'demo-test', appId: '1:1:web:1' };";

function html(prefix, afterConfig) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>cloud e2e</title><link rel="icon" href="data:,"></head><body><main id="app">cloud e2e</main>\n' +
    `<script src="${prefix}${SCRIPTS[0]}"></script>\n` + (afterConfig ? `<script>${afterConfig}</script>\n` : '') +
    `<script src="${prefix}${SCRIPTS[1]}"></script>\n<script src="${prefix}${SCRIPTS[2]}"></script>\n</body></html>`;
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/__e2e/page.html') { res.writeHead(200, { 'Content-Type': MIME['.html'] }); res.end(html('/')); return; }
      if (url.pathname === '/__e2e/cfg.html') { res.writeHead(200, { 'Content-Type': MIME['.html'] }); res.end(html('/', FAKE_CFG)); return; }
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

let passed = 0;
const failures = [];
function check(cond, msg) {
  if (cond) { passed++; return; }
  failures.push(msg);
  console.log('  FAIL ' + msg);
}
function eq(a, b, msg) { check(JSON.stringify(a) === JSON.stringify(b), `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

/* in every page: tryCall(fn) → {ok, v} | {ok:false, code}; watch helpers keep the latest state */
const INIT = () => {
  window.__try = async (fn) => { try { return { ok: true, v: await fn() }; } catch (e) { return { ok: false, code: e && e.code, msg: e && e.message }; } };
};

const QUIZ = {
  title: 'Solar system (test)',
  lang: 'en',
  questions: [
    { q: 'Which planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Mars', 'Earth'], correct: 1, explain: 'Mercury is the first planet.' },
    { q: 'How many planets are in the solar system?', options: ['7', '8', '9'], correct: 1, time: 15 },
    { q: 'Is the Moon a planet?', options: ['Yes', 'No'], correct: 1 }
  ]
};

async function main() {
  if (!CHROME) throw new Error('Chrome / Edge not found');
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const problems = [];      // console errors, page errors, non-local requests
  function watchPage(p, label) {
    p.on('console', m => { if (m.type() === 'error') problems.push(`${label}: console error: ${m.text()}`); });
    p.on('pageerror', e => problems.push(`${label}: page error: ${e && e.message}`));
    p.on('request', r => { const u = r.url(); if (!u.startsWith(base) && !u.startsWith('file:') && !u.startsWith('data:')) problems.push(`${label}: network request to ${u}`); });
    p.on('dialog', d => d.accept().catch(() => { }));
  }
  const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } });
  await ctx.addInitScript(INIT);
  async function open(label, url) {
    const p = await ctx.newPage();
    watchPage(p, label);
    await p.goto(url || base + '__e2e/page.html', { waitUntil: 'load' });
    return p;
  }

  try {
    /* ------------------------------------------------ 1. mode detection */
    console.log('1. mode detection');
    const host = await open('host');
    eq(await host.evaluate(() => [EDUCloud.mode, EDUCloud.isDemo, typeof EDUCloudMock, typeof EDU_CONTACT_EMAIL]), ['mock', true, 'object', 'string'], 'local test server → mock (real config never used locally)');
    const missing = await host.evaluate(() => {
      const names = ['ready', 'onTeacher', 'signInTeacher', 'signOut', 'deleteTeacherAccount', 'listQuizzes', 'getQuiz', 'saveQuiz', 'deleteQuiz', 'createSession', 'hostWatch', 'startQuestion', 'revealQuestion', 'writeScores', 'lockSession', 'kickPlayer', 'endSession', 'listSessions', 'sessionResults', 'deleteSession', 'joinSession', 'playerWatch', 'submitAnswer', 'leaveSession', 'purgeExpired'];
      return names.filter(n => typeof EDUCloud[n] !== 'function' || typeof EDUCloudMock[n] !== 'function');
    });
    eq(missing, [], 'every LIVE_SPEC function exists on EDUCloud and EDUCloudMock');
    const cfgPage = await open('cfg', base + '__e2e/cfg.html');
    eq(await cfgPage.evaluate(() => [EDUCloud.mode, EDUCloud.isDemo]), ['mock', true], 'config on a local server → mock unless ?live=1');
    await cfgPage.goto(base + '__e2e/cfg.html?live=1');
    eq(await cfgPage.evaluate(() => [EDUCloud.mode, EDUCloud.isDemo, typeof window.firebase]), ['firebase', false, 'undefined'], 'config + ?live=1 on http → firebase mode, SDK not loaded before ready()');
    await cfgPage.goto(base + '__e2e/cfg.html?live=1&mock=1');
    eq(await cfgPage.evaluate(() => EDUCloud.mode), 'mock', 'config + ?mock=1 → mock');
    await cfgPage.close();
    await host.evaluate(() => EDUCloudMock._reset());
    eq(await host.evaluate(() => EDUCloud.ready().then(() => EDUCloud.ready()).then(() => 'ok')), 'ok', 'ready() is idempotent');

    /* ------------------------------------------------ 2. teacher account + quizzes */
    console.log('2. teacher + quizzes');
    await host.evaluate(() => { window.__teachers = []; EDUCloud.onTeacher(t => window.__teachers.push(t)); });
    await host.waitForFunction(() => window.__teachers.length >= 1);
    eq(await host.evaluate(() => window.__teachers[0]), null, 'onTeacher: null before sign-in');
    eq((await host.evaluate(() => __try(() => EDUCloud.listQuizzes()))).code, 'permission-denied', 'listQuizzes before sign-in → permission-denied');
    const teacher = await host.evaluate(() => EDUCloud.signInTeacher());
    eq([teacher.uid, teacher.name], ['demo-teacher', 'Demo Teacher'], 'signInTeacher → demo teacher');
    await host.waitForFunction(() => window.__teachers.length >= 2);
    eq(await host.evaluate(() => window.__teachers[1] && window.__teachers[1].uid), 'demo-teacher', 'onTeacher fires on sign-in');
    eq((await host.evaluate(() => __try(() => EDUCloud.saveQuiz({ title: '', questions: [] })))).code, 'invalid-input', 'saveQuiz bad quiz → invalid-input');
    eq((await host.evaluate(() => __try(() => EDUCloud.saveQuiz({ title: 'x', questions: [{ q: 'a', options: ['1'], correct: 0 }] })))).code, 'invalid-input', 'saveQuiz 1 option → invalid-input');
    eq((await host.evaluate(() => __try(() => EDUCloud.saveQuiz({ title: 'x', questions: [{ q: 'a', options: ['1', '2'], correct: 2 }] })))).code, 'invalid-input', 'saveQuiz correct out of range → invalid-input');
    const quizId = await host.evaluate(q => EDUCloud.saveQuiz(q), QUIZ);
    check(typeof quizId === 'string' && quizId.length > 4, 'saveQuiz returns an id');
    const list1 = await host.evaluate(() => EDUCloud.listQuizzes());
    eq(list1.map(q => [q.id, q.title, q.count]), [[quizId, QUIZ.title, 3]], 'listQuizzes shows the quiz');
    const got = await host.evaluate(id => EDUCloud.getQuiz(id), quizId);
    eq([got.title, got.questions.length, got.questions[1].time, got.questions[0].explain, got.questions[2].time], [QUIZ.title, 3, 15, 'Mercury is the first planet.', undefined], 'getQuiz round trip');
    await host.evaluate(([id, q]) => EDUCloud.saveQuiz(Object.assign({}, q, { id: id, title: 'Solar system v2' })), [quizId, QUIZ]);
    eq((await host.evaluate(() => EDUCloud.listQuizzes())).map(q => [q.id, q.title]), [[quizId, 'Solar system v2']], 'saveQuiz with id updates in place');
    eq((await host.evaluate(() => __try(() => EDUCloud.getQuiz('nope123')))).code, 'not-found', 'getQuiz unknown → not-found');
    const quiz2 = await host.evaluate(() => EDUCloud.saveQuiz({ title: 'Temp', questions: [{ text: 'Quiz Maker style?', options: ['a', 'b'], answer: 0 }] }));
    eq((await host.evaluate(() => EDUCloud.listQuizzes())).length, 2, 'Quiz Maker field names accepted (text/answer)');
    await host.evaluate(id => EDUCloud.deleteQuiz(id), quiz2);
    eq((await host.evaluate(() => EDUCloud.listQuizzes())).length, 1, 'deleteQuiz');

    /* ------------------------------------------------ 3. session + joins */
    console.log('3. session + joins');
    const { code } = await host.evaluate(id => EDUCloud.getQuiz(id).then(q => EDUCloud.createSession(q, { timePerQ: 20 })), quizId);
    check(/^[1-9][0-9]{5}$/.test(code), 'createSession → 6-digit code: ' + code);
    await host.evaluate(c => { window.__host = null; window.__hostErr = null; window.__unHost = EDUCloud.hostWatch(c, s => { window.__host = s; }, e => { window.__hostErr = e.code; }); }, code);
    await host.waitForFunction(() => window.__host && window.__host.session);
    const h0 = await host.evaluate(() => window.__host);
    eq([h0.session.state, h0.session.current, h0.session.locked, h0.players.length, h0.session.questions.length], ['lobby', -1, false, 0, 3], 'hostWatch: lobby, no players');
    check(h0.session.questions.every(q => !('correct' in q)), 'public questions carry no correct answers');
    eq(h0.key && h0.key.correct, [1, 1, 1], 'host gets the answer key');
    eq(h0.session.questions.map(q => q.time), [20, 15, 20], 'per-question time with timePerQ default');

    const s1 = await open('student1'), s2 = await open('student2');
    eq((await s1.evaluate(() => __try(() => EDUCloud.joinSession('999999', 'Asha')))).code, 'not-found', 'join unknown code → not-found');
    eq((await s1.evaluate(c => __try(() => EDUCloud.joinSession(c, '   ')), code)).code, 'invalid-input', 'join empty nickname → invalid-input');
    eq((await s1.evaluate(c => __try(() => EDUCloud.joinSession(c, 'x'.repeat(21))), code)).code, 'invalid-input', 'join 21-char nickname → invalid-input');
    eq((await s1.evaluate(c => __try(() => EDUCloud.joinSession(c, 'a/b')), code)).code, 'invalid-input', "join nickname with '/' → invalid-input");
    eq((await s1.evaluate(c => __try(() => EDUCloud.submitAnswer(c, 0, 1)), code)).code, 'permission-denied', 'answer before joining → permission-denied');
    const j1 = await s1.evaluate(c => EDUCloud.joinSession(c.replace(/(...)/, '$1 '), '  Asha  '), code);
    eq(j1.name, 'Asha', 'join with "123 456" style code; nickname trimmed');
    eq((await s2.evaluate(c => __try(() => EDUCloud.joinSession(c, 'ASHA')), code)).code, 'name-taken', 'same nickname (other case) → name-taken');
    const j2 = await s2.evaluate(c => EDUCloud.joinSession(c, 'रवि'), code);
    check(j1.playerId && j2.playerId && j1.playerId !== j2.playerId, 'two student tabs = two different players');
    const j1b = await s1.evaluate(c => EDUCloud.joinSession(c, 'Someone else'), code);
    eq([j1b.playerId, j1b.name, j1b.rejoined], [j1.playerId, 'Asha', true], 'joining again = same player (rejoin)');

    for (const [p, label] of [[s1, 's1'], [s2, 's2']]) {
      await p.evaluate(c => { window.__pl = null; window.__un = EDUCloud.playerWatch(c, s => { window.__pl = s; }, e => { window.__plErr = e.code; }); }, code);
      await p.waitForFunction(() => window.__pl && window.__pl.me);
      const st = await p.evaluate(() => window.__pl);
      eq([st.session.state, typeof st.session.owner, typeof st.session.kicked, st.me.score], ['lobby', 'undefined', 'undefined', 0], `${label} playerWatch: public session only, score 0`);
    }
    await host.waitForFunction(() => window.__host.players.length === 2);
    eq(await host.evaluate(() => window.__host.players.map(p => [p.name, p.score])), [['Asha', 0], ['रवि', 0]], 'host sees both players live (cross-tab)');

    /* lock + kick with a third tab */
    const s3 = await open('student3');
    await host.evaluate(c => EDUCloud.lockSession(c, true), code);
    eq((await s3.evaluate(c => __try(() => EDUCloud.joinSession(c, 'Kiran')), code)).code, 'session-locked', 'join locked session → session-locked');
    await s1.waitForFunction(() => window.__pl.session.locked === true);
    check(true, 'students see locked = true');
    await host.evaluate(c => EDUCloud.lockSession(c, false), code);
    const j3 = await s3.evaluate(c => EDUCloud.joinSession(c, 'Kiran'), code);
    await s3.evaluate(c => { window.__pl = null; EDUCloud.playerWatch(c, s => { window.__pl = s; }); }, code);
    await host.waitForFunction(() => window.__host.players.length === 3);
    await host.evaluate(([c, id]) => EDUCloud.kickPlayer(c, id), [code, j3.playerId]);
    await s3.waitForFunction(() => window.__pl && window.__pl.me === null && window.__pl.kicked === true);
    check(true, 'kicked student sees me=null, kicked=true');
    await host.waitForFunction(() => window.__host.players.length === 2);
    eq((await s3.evaluate(c => __try(() => EDUCloud.joinSession(c, 'Kiran2')), code)).code, 'permission-denied', 'kicked student cannot rejoin → permission-denied');
    const j1c = await s1.evaluate(c => EDUCloud.joinSession(c, 'Kiran'), code);
    eq(j1c.playerId, j1.playerId, "kicked player's nickname is free again (rejoin of s1 unaffected)");

    /* ------------------------------------------------ 4. question 0 */
    console.log('4. question 0');
    eq((await host.evaluate(c => __try(() => EDUCloud.startQuestion(c, 7)), code)).code, 'invalid-input', 'startQuestion out of range → invalid-input');
    await host.evaluate(c => EDUCloud.startQuestion(c, 0), code);
    await s1.waitForFunction(() => window.__pl.session.state === 'question' && window.__pl.session.current === 0);
    await s2.waitForFunction(() => window.__pl.session.state === 'question' && window.__pl.session.current === 0);
    const qs = await s1.evaluate(() => window.__pl.session);
    check(typeof qs.questionStartedAt === 'number' && Math.abs(qs.questionStartedAt - Date.now()) < 5000, 'questionStartedAt = server time (ms)');
    eq(await s1.evaluate(() => Math.abs(EDUCloud.now() - Date.now()) < 50), true, 'EDUCloud.now() ≈ Date.now() in demo');
    eq((await s1.evaluate(c => __try(() => EDUCloud.submitAnswer(c, 1, 1)), code)).code, 'permission-denied', 'answer a non-current question → permission-denied');
    eq((await s1.evaluate(c => __try(() => EDUCloud.submitAnswer(c, 0, 9)), code)).code, 'invalid-input', 'choice out of range → invalid-input');
    eq((await s1.evaluate(c => __try(() => EDUCloud.submitAnswer(c, 0, 1.5)), code)).code, 'invalid-input', 'non-integer choice → invalid-input');
    eq((await s3.evaluate(c => __try(() => EDUCloud.submitAnswer(c, 0, 1)), code)).code, 'permission-denied', 'kicked student answer → permission-denied');
    await s1.waitForTimeout(150);
    eq((await s1.evaluate(c => __try(() => EDUCloud.submitAnswer(c, 0, 1)), code)).ok, true, 's1 answers q0 (correct)');
    eq((await s2.evaluate(c => __try(() => EDUCloud.submitAnswer(c, 0, 2)), code)).ok, true, 's2 answers q0 (wrong)');
    eq((await s1.evaluate(c => __try(() => EDUCloud.submitAnswer(c, 0, 1)), code)).ok, true, 'same answer again (retry) is accepted');
    eq((await s1.evaluate(c => __try(() => EDUCloud.submitAnswer(c, 0, 3)), code)).code, 'permission-denied', 'changing an answer → permission-denied');
    await s1.waitForFunction(() => window.__pl.myAnswers[0] === 1);
    check(true, 'playerWatch myAnswers updates');
    await host.waitForFunction(() => window.__host.answers[0] && Object.keys(window.__host.answers[0]).length === 2);
    const ans0 = await host.evaluate(() => window.__host.answers[0]);
    eq([ans0[j1.playerId].choice, ans0[j2.playerId].choice], [1, 2], 'host sees both answers live');
    check(ans0[j1.playerId].ms >= 100 && ans0[j1.playerId].ms < 5000, 'answer ms counted from question start: ' + ans0[j1.playerId].ms);

    const reveal0 = await host.evaluate(c => EDUCloud.revealQuestion(c, 0), code);
    eq([reveal0.index, reveal0.correct, reveal0.explain], [0, 1, 'Mercury is the first planet.'], 'revealQuestion returns the answer');
    eq((await s2.evaluate(c => __try(() => EDUCloud.submitAnswer(c, 0, 1)), code)).code, 'permission-denied', 'answer after reveal (s2 changing) → permission-denied');
    await host.waitForFunction(() => window.__host.session.state === 'reveal');
    const hs0 = await host.evaluate(() => window.__host);
    const upd0 = await host.evaluate(() => EDUCloud.computeScores(window.__host, 0));
    eq(Object.keys(upd0), [j1.playerId], 'computeScores: only the correct player changes');
    const exp0 = await host.evaluate(([ms]) => EDUCloud.points(true, ms, 20), [hs0.answers[0][j1.playerId].ms]);
    eq(upd0[j1.playerId], { score: exp0, last: exp0, lastQ: 0 }, 'computeScores uses the spec formula');
    check(exp0 > 900 && exp0 <= 1000, 'fast correct answer ≈ 1000 points: ' + exp0);
    await host.evaluate(([c, u]) => EDUCloud.writeScores(c, u), [code, upd0]);
    await s1.waitForFunction(() => window.__pl.me.lastQ === 0 && window.__pl.me.score > 0);
    const me1 = await s1.evaluate(() => window.__pl);
    eq([me1.session.state, me1.session.reveal.correct, me1.me.score, me1.me.last], ['reveal', 1, exp0, exp0], 's1 sees reveal + its points');
    eq(await s2.evaluate(() => [window.__pl.session.state, window.__pl.me.score, window.__pl.myAnswers[0]]), ['reveal', 0, 2], 's2 sees reveal, 0 points');
    await host.waitForFunction(() => window.__host.players.some(p => p.score > 0));
    eq(await host.evaluate(() => EDUCloud.computeScores(window.__host, 0)), {}, 'computeScores again for the same question: nothing to change (no double count)');

    /* ------------------------------------------------ 5. question 1, leaderboard, end */
    console.log('5. question 1 + end');
    await host.evaluate(c => EDUCloud.startQuestion(c, 1), code);
    await s2.waitForFunction(() => window.__pl.session.current === 1 && window.__pl.session.state === 'question');
    await s2.evaluate(c => EDUCloud.submitAnswer(c, 1, 1), code);
    await s1.waitForFunction(() => window.__pl.session.current === 1);
    await s1.waitForTimeout(400);
    await s1.evaluate(c => EDUCloud.submitAnswer(c, 1, 1), code);
    await host.waitForFunction(() => window.__host.answers[1] && Object.keys(window.__host.answers[1]).length === 2);
    await host.evaluate(c => EDUCloud.revealQuestion(c, 1), code);
    await host.waitForFunction(() => window.__host.session.state === 'reveal' && window.__host.session.current === 1);
    const upd1 = await host.evaluate(() => EDUCloud.computeScores(window.__host, 1));
    eq(Object.keys(upd1).sort(), [j1.playerId, j2.playerId].sort(), 'q1: both correct');
    check(upd1[j2.playerId].last > upd1[j1.playerId].last, 'faster answer gets more points');
    await host.evaluate(([c, u]) => EDUCloud.writeScores(c, u), [code, upd1]);
    await host.waitForFunction(() => window.__host.players.every(p => p.lastQ === 1));
    const board = await host.evaluate(() => EDUCloud.rankPlayers(window.__host.players));
    eq(board.map(p => [p.name, p.rank]), [['Asha', 1], ['रवि', 2]], 'rankPlayers leaderboard');
    eq((await host.evaluate(c => __try(() => EDUCloud.writeScores(c, { x: -5 })), code)).code, 'invalid-input', 'negative score → invalid-input');
    const rankMap = {};
    board.forEach(p => { rankMap[p.id] = { rank: p.rank }; });
    await host.evaluate(([c, r]) => EDUCloud.writeScores(c, r), [code, rankMap]);
    await host.evaluate(c => EDUCloud.endSession(c), code);
    await s1.waitForFunction(() => window.__pl.session.state === 'ended' && window.__pl.me.rank === 1);
    await s2.waitForFunction(() => window.__pl.session.state === 'ended' && window.__pl.me.rank === 2);
    check(true, 'students see ended + final rank');
    eq((await s2.evaluate(c => __try(() => EDUCloud.submitAnswer(c, 2, 1)), code)).code, 'session-ended', 'answer after end → session-ended');
    const s4 = await open('student4');
    eq((await s4.evaluate(c => __try(() => EDUCloud.joinSession(c, 'Late')), code)).code, 'session-ended', 'join ended session → session-ended');
    eq((await host.evaluate(c => __try(() => EDUCloud.startQuestion(c, 2)), code)).code, 'session-ended', 'startQuestion after end → session-ended');

    /* reload: same tab = same anonymous player */
    await s1.reload({ waitUntil: 'load' });
    const j1r = await s1.evaluate(c => EDUCloud.joinSession(c, 'Asha'), code);
    eq([j1r.playerId, j1r.rejoined], [j1.playerId, true], 'after reload the student is the same player');
    await s1.evaluate(c => { window.__pl = null; EDUCloud.playerWatch(c, s => { window.__pl = s; }); }, code);
    await s1.waitForFunction(() => window.__pl && window.__pl.me);
    eq(await s1.evaluate(() => [window.__pl.myAnswers, window.__pl.me.rank]), [{ 0: 1, 1: 1 }, 1], 'after reload: my answers and rank are back');

    /* ------------------------------------------------ 6. results, lists, deletes */
    console.log('6. results + deletes');
    const res = await host.evaluate(c => EDUCloud.sessionResults(c), code);
    eq([res.session.state, res.players.length, Object.keys(res.answers[0]).length, Object.keys(res.answers[1]).length, res.key.correct], ['ended', 2, 2, 2, [1, 1, 1]], 'sessionResults for CSV');
    const sessions = await host.evaluate(() => EDUCloud.listSessions());
    eq(sessions.map(s => [s.code, s.state, s.players]), [[code, 'ended', 2]], 'listSessions');
    eq((await s2.evaluate(c => __try(() => EDUCloud.leaveSession(c)), code)).ok, true, 'leaveSession ("Remove me" after the end)');
    await host.waitForFunction(() => window.__host.players.length === 1);
    check(true, 'host sees the player leave');
    await host.waitForFunction(id => !window.__host.answers[0][id] && !window.__host.answers[1][id], j2.playerId);
    eq(await host.evaluate(id => Object.keys(localStorage).filter(k => k.indexOf('/answers/' + id + '_') > 0).length, j2.playerId), 0, '"Remove me" after the end deletes that student’s answers');
    eq(await host.evaluate(id => Object.keys(window.__host.answers[0]), j2.playerId), [j1.playerId], "other students' answers stay");
    await host.evaluate(c => EDUCloud.deleteSession(c), code);
    await host.waitForFunction(() => window.__host.session === null);
    await s1.waitForFunction(() => window.__pl.session === null);
    check(true, 'deleteSession: host and students see session = null');
    eq(await host.evaluate(() => EDUCloud.listSessions()), [], 'listSessions empty after delete');
    eq(await host.evaluate(() => Object.keys(localStorage).filter(k => k.indexOf('edu.cloudmock.sessions/') === 0)), [], 'no session records left in storage');

    eq(await host.evaluate(() => window.__hostErr), null, 'no hostWatch errors during the session');
    await host.evaluate(() => window.__unHost());

    /* signed-out teacher cannot act; account delete removes everything */
    const { code: code2 } = await host.evaluate(id => EDUCloud.getQuiz(id).then(q => EDUCloud.createSession(q, { shuffle: true, shuffleOptions: true })), quizId);
    const h2 = await host.evaluate(c => EDUCloud.sessionResults(c), code2);
    check(h2.session.questions.every((q, k) => q.options[h2.key.correct[k]] === ({ 'Which planet is closest to the Sun?': 'Mercury', 'How many planets are in the solar system?': '8', 'Is the Moon a planet?': 'No' })[q.q]), 'shuffle keeps the answer key right');
    /* leaving DURING a quiz keeps the answers (no taking an answer back); after the end "Remove me" deletes them */
    await host.evaluate(c => EDUCloud.startQuestion(c, 0), code2);
    const s5 = await open('student5');
    const j5 = await s5.evaluate(c => EDUCloud.joinSession(c, 'Zoya'), code2);
    await s5.evaluate(c => EDUCloud.submitAnswer(c, 0, 0), code2);
    await s5.evaluate(c => EDUCloud.leaveSession(c), code2);
    const mid = await host.evaluate(c => EDUCloud.sessionResults(c), code2);
    eq([mid.players.length, Object.keys(mid.answers[0] || {})], [0, [j5.playerId]], 'leave mid-quiz: player gone, answer kept');
    await host.evaluate(c => EDUCloud.endSession(c), code2);
    await s5.evaluate(c => EDUCloud.leaveSession(c), code2);
    eq((await host.evaluate(c => EDUCloud.sessionResults(c), code2)).answers, {}, '"Remove me" after the end deletes the answers');

    /* 30-day retention: old sessions are deleted by the app (purgeExpired, listSessions, and once per page load) */
    await host.evaluate(c => { const k = 'edu.cloudmock.sessions/' + c; const s = JSON.parse(localStorage.getItem(k)); s.createdAt -= 31 * 86400000; s.expireAt -= 31 * 86400000; localStorage.setItem(k, JSON.stringify(s)); }, code2);
    eq(await host.evaluate(() => EDUCloud.purgeExpired()), 1, 'purgeExpired deletes a 31-day-old session');
    eq(await host.evaluate(c => Object.keys(localStorage).filter(k => k.indexOf('edu.cloudmock.sessions/' + c) === 0).length, code2), 0, 'with all its players/answers/key');
    const { code: code3 } = await host.evaluate(id => EDUCloud.getQuiz(id).then(q => EDUCloud.createSession(q, {})), quizId);
    await host.evaluate(c => { const k = 'edu.cloudmock.sessions/' + c; const s = JSON.parse(localStorage.getItem(k)); s.createdAt -= 40 * 86400000; localStorage.setItem(k, JSON.stringify(s)); }, code3);
    const reopened = await open('host-reopened');
    await reopened.waitForFunction(c => !localStorage.getItem('edu.cloudmock.sessions/' + c), code3, { timeout: 5000 });
    check(true, 'opening a page as a signed-in teacher deletes sessions older than 30 days');
    await reopened.close();
    await host.evaluate(() => EDUCloud.signOut());
    eq((await host.evaluate(c => __try(() => EDUCloud.startQuestion(c, 0)), code2)).code, 'permission-denied', 'signed-out teacher → permission-denied');
    await host.evaluate(() => EDUCloud.signInTeacher());
    await host.evaluate(() => EDUCloud.deleteTeacherAccount());
    await host.waitForFunction(() => window.__teachers[window.__teachers.length - 1] === null);
    check(true, 'onTeacher(null) after account delete');
    eq(await host.evaluate(() => Object.keys(localStorage).filter(k => /^edu\.cloudmock\.(quizzes|sessions|teachers)/.test(k))), [], 'deleteTeacherAccount removed quizzes, sessions, teacher');
    eq((await host.evaluate(() => __try(() => EDUCloud.listQuizzes()))).code, 'permission-denied', 'after account delete: signed out');

    /* ------------------------------------------------ 7. file:// (downloaded ZIP) across two tabs */
    console.log('7. file://');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'edu-cloud-e2e-'));
    const fileHtml = path.join(tmp, 'page.html');
    fs.writeFileSync(fileHtml, html('file:///' + ROOT.replace(/\\/g, '/') + '/'));
    const fileUrl = 'file:///' + fileHtml.replace(/\\/g, '/');
    const fctx = await browser.newContext();
    await fctx.addInitScript(INIT);
    const fa = await fctx.newPage(); watchPage(fa, 'file-host');
    const fb = await fctx.newPage(); watchPage(fb, 'file-student');
    await fa.goto(fileUrl); await fb.goto(fileUrl);
    eq(await fa.evaluate(() => EDUCloud.mode), 'mock', 'file:// → mock');
    await fa.evaluate(() => EDUCloud.signInTeacher());
    const fcode = (await fa.evaluate(q => EDUCloud.createSession(q, {}), QUIZ)).code;
    await fa.evaluate(c => { window.__host = null; EDUCloud.hostWatch(c, s => { window.__host = s; }); }, fcode);
    await fb.evaluate(c => EDUCloud.joinSession(c, 'Meena'), fcode);
    await fa.waitForFunction(() => window.__host && window.__host.players.length === 1, null, { timeout: 5000 });
    check(true, 'file://: host tab sees a student join from another tab');
    await fctx.close();
    fs.rmSync(tmp, { recursive: true, force: true });

    for (const p of [s1, s2, s3, s4]) await p.evaluate(() => window.__plErr || null).then(e => eq(e, null, 'no playerWatch errors'));
    await host.evaluate(c => new Promise(res => { const off = EDUCloud.hostWatch(c, () => { }, e => { off(); res(e.code); }); }), '123456')
      .then(c => eq(c, 'permission-denied', 'hostWatch while signed out → onError(permission-denied)'));
  } finally {
    await browser.close();
    srv.close();
  }
  for (const p of problems) failures.push(p);
  console.log(problems.length ? problems.map(p => '  FAIL ' + p).join('\n') : '  no console errors, no page errors, no network requests outside the test server');
  console.log(`\n=== cloud mock e2e: ${failures.length ? 'FAIL' : 'PASS'} (${passed} checks passed, ${failures.length} failed) ===`);
  process.exit(failures.length ? 1 : 0);
}

main().catch(e => { console.error('e2e crashed:', e && e.stack || e); process.exit(1); });
