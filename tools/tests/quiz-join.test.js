/* Interaction test for "Join a Live Quiz" (student phone app), run by tools/verify.js in en and hi.
 * Demo mode (EDU_FIREBASE is null): a SECOND tab of the same browser context plays the teacher through
 * window.EDUCloud (apps/live-quiz if it exists and loads, otherwise this app's own page, which loads the
 * same cloud scripts). The student tab is driven only through the real UI:
 *   code → rude nickname refused → nickname → waiting room → question → one tap locks the answer →
 *   reveal → points → reload (same player, same screen) → wrong answer → final rank → "Remove me". */
const fs = require('fs');
const path = require('path');

const QUIZ = {
  title: 'Solar system (test)',
  lang: 'en',
  questions: [
    { q: 'Which planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Mars', 'Earth'], correct: 1, explain: 'Mercury is the first planet.' },
    { q: 'How many planets are in the solar system?', options: ['7', '8', '9'], correct: 1 }
  ]
};

module.exports = async ({ page, lang, expect, log, base }) => {
  const ctx = page.context();
  const T = { timeout: 15000 };

  /* ---------- the teacher's tab ---------- */
  const host = await ctx.newPage();
  host.on('dialog', d => d.accept().catch(() => { }));
  const ready = () => host.waitForFunction(() => window.EDUCloud && EDUCloud.mode === 'mock' && typeof EDUCloud.createSession === 'function', null, { timeout: 15000 }).then(() => true, () => false);
  let hostPage = 'apps/quiz-join/index.html';
  if (fs.existsSync(path.join(__dirname, '..', '..', 'apps', 'live-quiz', 'index.html'))) hostPage = 'apps/live-quiz/index.html';
  await host.goto(base + hostPage + '?lang=' + lang, { waitUntil: 'load' }).catch(() => { });
  if (!(await ready()) && hostPage !== 'apps/quiz-join/index.html') {
    hostPage = 'apps/quiz-join/index.html';
    await host.goto(base + hostPage + '?lang=' + lang, { waitUntil: 'load' });
    expect(await ready(), 'EDUCloud did not load on the host tab');
  }
  log('host tab: ' + hostPage);
  /* host calls; if the host app reloads/navigates itself meanwhile, wait and retry once (Demo data lives in localStorage) */
  const H = async (fn, arg) => {
    try { return await host.evaluate(fn, arg); } catch (e) {
      if (!/context was destroyed|navigation|Target closed|not defined/i.test(String(e && e.message))) throw e;
      await host.waitForLoadState('load').catch(() => { });
      await ready();
      return host.evaluate(fn, arg);
    }
  };
  const results = (code) => H(async (c) => {
    const r = await EDUCloud.sessionResults(c);
    return { players: r.players, answers: r.answers };
  }, code);

  const code = await H(async (quiz) => {
    await EDUCloud.signInTeacher();
    return (await EDUCloud.createSession(quiz, { timePerQ: 90 })).code;
  }, QUIZ);
  expect(/^\d{6}$/.test(code), 'host should get a 6-digit code, got ' + code);

  /* ---------- 1) code + nickname through the UI ---------- */
  expect(await page.isVisible('#scrCode'), 'the first screen should ask for the quiz code');
  await page.fill('#codeInput', '12');
  await page.click('#codeNext');
  await page.waitForSelector('#codeErr:not([hidden])', T);
  expect(await page.isVisible('#scrCode'), 'a 2-digit code must be refused on the code screen');

  await page.fill('#codeInput', code);                           // 6 digits → checks the code by itself
  await page.waitForSelector('#scrName:not([hidden])', T);
  const shownTitle = (await page.textContent('#quizTitle')).trim();
  expect(shownTitle === QUIZ.title, `nickname screen should show the quiz title, got "${shownTitle}"`);

  await page.fill('#nameInput', 'Chu tiya');                     // a rude Hinglish word, with a space
  await page.click('#joinBtn');
  await page.waitForSelector('#nameErr:not([hidden])', T);
  let r = await results(code);
  expect(r.players.length === 0 && await page.isVisible('#scrName'), 'a rude nickname must not join');

  await page.fill('#nameInput', '9876543210');                   // a phone number
  await page.click('#joinBtn');
  await page.waitForSelector('#nameErr:not([hidden])', T);
  r = await results(code);
  expect(r.players.length === 0, 'a phone number must not be accepted as a nickname');

  await page.fill('#nameInput', 'Asha 7');
  await page.click('#joinBtn');
  await page.waitForSelector('#scrGame [data-screen="lobby"]', T);
  const nick = (await page.textContent('#scrGame .nick')).trim();
  expect(nick === 'Asha 7', `waiting room should show the nickname, got "${nick}"`);
  r = await results(code);
  expect(r.players.length === 1 && r.players[0].name === 'Asha 7', 'the host should see exactly one player "Asha 7"');
  const pid = r.players[0].id;

  /* ---------- 2) question 1: one tap locks the answer ---------- */
  await H((c) => EDUCloud.startQuestion(c, 0), code);
  await page.waitForSelector('#scrGame [data-screen="question"][data-q="0"]', T);
  const nBtns = await page.$$eval('#answers button.ans', (b) => b.length);
  expect(nBtns === 4, 'question 1 should show 4 answer buttons, got ' + nBtns);
  const qText = (await page.textContent('#scrGame .qtext')).trim();
  expect(qText === QUIZ.questions[0].q, 'the question text should be shown on the phone too');
  const shapes = await page.$$eval('#answers .ans svg.shape', (s) => s.length);
  expect(shapes === 4, 'every answer button needs its shape');

  await page.click('#answers .ans[data-choice="1"]');           // Mercury (right)
  await page.waitForSelector('#scrGame [data-screen="sent"][data-state="sent"]', T);
  const live = await page.$$eval('#scrGame button.ans', (b) => b.length);
  expect(live === 0, 'after one tap no answer button may be left');
  const again = await page.evaluate(async (c) => { try { await EDUCloud.submitAnswer(c, 0, 2); return 'accepted'; } catch (e) { return e.code; } }, code);
  expect(again === 'permission-denied', 'a second, different answer must be refused, got ' + again);
  r = await results(code);
  expect(r.answers[0] && r.answers[0][pid] && r.answers[0][pid].choice === 1, 'the host should have answer 1 for question 1');

  /* ---------- 3) reveal + scores ---------- */
  await H(async (c) => {
    await EDUCloud.revealQuestion(c, 0);
    const st = await EDUCloud.sessionResults(c);
    await EDUCloud.writeScores(c, EDUCloud.computeScores(st, 0));
  }, code);
  await page.waitForSelector('#scrGame [data-screen="result"][data-result="correct"]', T);
  await page.waitForSelector('#scrGame [data-points]', T);
  const pts = Number(await page.getAttribute('#scrGame [data-points]', 'data-points'));
  r = await results(code);
  const hostScore = r.players[0].score;
  expect(pts >= 500 && pts <= 1000 && pts === hostScore, `points after the reveal should be 500-1000 and match the host (${hostScore}), got ${pts}`);
  const total = Number(await page.getAttribute('#totalScore', 'data-score'));
  expect(total === hostScore, 'total score on the phone should be ' + hostScore + ', got ' + total);

  /* ---------- 4) reload: same player, same screen, nothing to type ---------- */
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#scrGame [data-screen="result"][data-result="correct"]', T);
  expect(!(await page.isVisible('#scrCode')), 'after a reload the student must not have to type the code again');
  r = await results(code);
  expect(r.players.length === 1, 'a reload must not create a second player');

  /* ---------- 5) question 2: a wrong answer gives 0 points ---------- */
  await H((c) => EDUCloud.startQuestion(c, 1), code);
  await page.waitForSelector('#scrGame [data-screen="question"][data-q="1"]', T);
  await page.click('#answers .ans[data-choice="0"]');           // 7 (wrong)
  await page.waitForSelector('#scrGame [data-screen="sent"][data-q="1"]', T);
  await H(async (c) => {
    await EDUCloud.revealQuestion(c, 1);
    const up = EDUCloud.computeScores(await EDUCloud.sessionResults(c), 1);
    if (Object.keys(up).length) await EDUCloud.writeScores(c, up);
  }, code);
  await page.waitForSelector('#scrGame [data-screen="result"][data-result="wrong"]', T);
  const pts2 = Number(await page.getAttribute('#scrGame [data-points]', 'data-points'));
  expect(pts2 === 0, 'a wrong answer should show +0, got ' + pts2);
  expect(await page.isVisible('#scrGame .right-ans'), 'a wrong answer should show the right answer');

  /* ---------- 6) end: final rank ---------- */
  await H(async (c) => {
    const st = await EDUCloud.sessionResults(c);
    const ranks = {};
    EDUCloud.rankPlayers(st.players).forEach((p) => { ranks[p.id] = { rank: p.rank }; });
    await EDUCloud.writeScores(c, ranks);
    await EDUCloud.endSession(c);
  }, code);
  await page.waitForSelector('#scrGame [data-screen="final"][data-rank="1"]', T);
  const fin = await page.$eval('#scrGame [data-screen="final"]', (e) => ({ score: Number(e.dataset.score), right: Number(e.dataset.right), asked: Number(e.dataset.asked) }));
  expect(fin.score === hostScore, `final score should be ${hostScore}, got ${fin.score}`);
  expect(fin.right === 1 && fin.asked === 2, `final screen should count 1 of 2 right (kept across the reload), got ${fin.right} of ${fin.asked}`);
  expect(await page.isVisible('#rankLine'), 'the final screen should say the rank');

  /* ---------- 7) "Remove me" deletes the nickname and the answers ---------- */
  await page.click('#removeMe');                                 // confirm() is accepted by verify.js
  await page.waitForSelector('#scrCode:not([hidden])', T);
  r = await results(code);
  const left = Object.keys(r.answers).reduce((n, i) => n + Object.keys(r.answers[i] || {}).length, 0);
  expect(r.players.length === 0 && left === 0, `after "Remove me" the host should see no player and no answers (players ${r.players.length}, answers ${left})`);
  const saved = await page.evaluate(() => localStorage.getItem('edu.quiz-join.current'));
  expect(saved === null, 'the remembered quiz should be forgotten on this device');

  await H((c) => EDUCloud.deleteSession(c), code);
  await host.close();
};
