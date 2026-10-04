/* Interaction test for Live Class Quiz (run by tools/verify.js in en and hi, always in Demo mode).
 * One host tab (the page under test) + student tabs in the SAME browser context: the student side is
 * apps/quiz-join when it exists (else this app's page), driven through window.EDUCloud so the test does
 * not depend on the student app's UI. Covers: demo sign-in, editor validation + save, import from
 * Quiz Maker (incl. true/false), host lobby (players, unique nickname, kick, lock), question → answers →
 * auto reveal → scores → leaderboard (keyboard) → end → podium/table → CSV → past results → delete,
 * and "Delete my account and all data". */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

module.exports = async function ({ page, lang, expect, t, log, base }) {
  const ctx = page.context();
  const extra = [];
  const count = (sel) => page.locator(sel).count();
  const tryJoin = (p, code, nick) => p.evaluate(async ([c, n]) => {
    try { const r = await window.EDUCloud.joinSession(c, n); return { ok: true, id: r.playerId }; } catch (e) { return { ok: false, code: e && e.code }; }
  }, [code, nick]);

  try {
    /* 1. Demo sign-in */
    await page.waitForSelector('#signIn:not([disabled])');
    expect(await page.evaluate(() => window.EDUCloud.mode) === 'mock', 'tests run in Demo mode');
    expect(await page.isVisible('#demoBanner'), 'Demo-mode banner is shown');
    await page.click('#signIn');
    await page.waitForSelector('#v-dash:not([hidden]) #hostSample');
    expect((await page.textContent('#hello')).includes(t('demo_teacher')), 'Demo teacher label is translated');

    /* 2. editor: validation, then save a 1-question quiz (empty options are dropped) */
    await page.click('#newQuiz');
    await page.waitForSelector('#qzTitle');
    await page.click('#saveQuiz');
    expect((await page.textContent('#edMsg')).trim() === t('err_title'), 'empty title is refused');
    await page.fill('#qzTitle', 'Test quiz');
    await page.fill('#qq0', 'What is 2 + 2?');
    await page.fill('#qo0_0', '3');
    await page.fill('#qo0_1', '4');
    await page.click('#saveQuiz');
    expect((await page.textContent('#edMsg')).trim() === t('err_q_correct', { n: '1' }), 'missing correct answer is refused');
    await page.check('#qc0_1');
    await page.click('#saveQuiz');
    await page.waitForSelector('#v-dash:not([hidden]) #quizList .cloud-quiz');
    expect(await count('#quizList .cloud-quiz') === 1, 'saved quiz is listed');
    const saved = await page.evaluate(async () => { const l = await window.EDUCloud.listQuizzes(); return window.EDUCloud.getQuiz(l[0].id); });
    const sq = saved.questions[0];
    expect(saved.title === 'Test quiz' && sq.options.join('|') === '3|4' && sq.correct === 1, 'quiz saved with 2 options, answer "4": ' + JSON.stringify(sq));

    /* 3. import from Quiz Maker on this device (MCQ + true/false) */
    await page.evaluate(() => localStorage.setItem('edu.quiz-maker.quizzes', JSON.stringify([{
      id: 'qm1', title: 'From Quiz Maker', updated: Date.now(), questions: [
        { id: 'a', type: 'mcq', text: 'Capital of India?', options: ['Mumbai', 'New Delhi', 'Kolkata'], answer: 1, explain: '' },
        { id: 'b', type: 'tf', text: 'The Sun is a star.', options: [], answer: 0, explain: 'Yes.' }]
    }])));
    await page.click('#importQm');
    await page.waitForSelector('#qmGo');
    await page.click('#qmGo');
    await page.waitForFunction(() => document.querySelectorAll('#quizList .cloud-quiz').length === 2, null, { timeout: 10000 });
    await page.waitForSelector('.edu-modal-back', { state: 'detached' });
    const imp = await page.evaluate(async () => {
      const l = await window.EDUCloud.listQuizzes();
      const m = l.find(q => q.title === 'From Quiz Maker');
      return m ? window.EDUCloud.getQuiz(m.id) : null;
    });
    expect(imp && imp.questions.length === 2 && imp.questions[0].correct === 1 &&
      imp.questions[1].options.join('|') === [t('opt_true'), t('opt_false')].join('|') && imp.questions[1].correct === 0,
    'Quiz Maker quiz imported, true/false turned into 2 translated options: ' + JSON.stringify(imp && imp.questions[1]));
    await page.click('#quizList .cloud-quiz:has-text("From Quiz Maker") [data-act="delete"]');   // confirm() is auto-accepted
    await page.waitForFunction(() => document.querySelectorAll('#quizList .cloud-quiz').length === 1, null, { timeout: 10000 });

    /* 4. host the sample quiz: lobby */
    await page.click('#hostSample');
    await page.waitForSelector('#lobbyCode');
    const code = await page.getAttribute('#lobbyCode', 'data-code');
    expect(/^\d{6}$/.test(code || ''), 'six-digit join code: ' + code);
    const qrUrl = await page.getAttribute('#qrImg', 'data-url');
    expect(qrUrl.includes('quiz-join/index.html') && qrUrl.includes('code=' + code), 'Demo-mode QR points to the local student page: ' + qrUrl);
    expect(await page.isDisabled('#nextBtn'), 'Start waits for the first player');

    /* 5. students in other tabs of the same browser */
    const joinRel = fs.existsSync(path.join(ROOT, 'apps', 'quiz-join', 'index.html')) ? 'apps/quiz-join/index.html' : 'apps/live-quiz/index.html';
    async function studentTab() {
      const p = await ctx.newPage();
      extra.push(p);
      p.on('dialog', d => d.dismiss().catch(() => { }));
      await p.goto(base + joinRel + '?code=' + code + '&lang=' + lang, { waitUntil: 'load' });
      const ok = await p.waitForFunction(() => !!(window.EDUCloud && window.EDUCloud.joinSession), null, { timeout: 8000 }).then(() => true, () => false);
      if (!ok) {
        await p.goto(base + 'apps/live-quiz/index.html?lang=' + lang, { waitUntil: 'load' });
        await p.waitForFunction(() => !!(window.EDUCloud && window.EDUCloud.joinSession));
      }
      return p;
    }
    log('student side runs on ' + joinRel);
    const s1 = await studentTab(), s2 = await studentTab(), s3 = await studentTab(), s4 = await studentTab();
    expect((await tryJoin(s1, code, 'Asha')).ok && (await tryJoin(s2, code, 'Ravi')).ok && (await tryJoin(s3, code, 'Zed')).ok, 'three students join');
    await page.waitForFunction(() => document.querySelectorAll('#players .pchip').length === 3, null, { timeout: 10000 });
    const names = await page.$$eval('#players .pname', els => els.map(e => e.textContent));
    expect(names.join(',') === 'Asha,Ravi,Zed', 'players appear in the lobby: ' + names.join(','));
    expect(await page.getAttribute('#joinedN', 'data-n') === '3', 'joined counter shows 3');
    const taken = await tryJoin(s4, code, 'asha');
    expect(!taken.ok && taken.code === 'name-taken', 'nicknames are unique in any letter case: ' + JSON.stringify(taken));

    /* kick + lock */
    await page.click('#players .pchip:has-text("Zed") .kick');
    await page.waitForFunction(() => document.querySelectorAll('#players .pchip').length === 2, null, { timeout: 10000 });
    const rejoin = await tryJoin(s3, code, 'Zed again');
    expect(!rejoin.ok && rejoin.code === 'permission-denied', 'a removed player cannot join again: ' + JSON.stringify(rejoin));
    await page.click('#lockBtn:not([disabled])');
    await page.waitForSelector('#lockBtn[aria-pressed="true"]');
    expect(await page.isVisible('#lockNote'), 'locked note shown');
    const locked = await tryJoin(s4, code, 'Neha');
    expect(!locked.ok && locked.code === 'session-locked', 'a locked quiz refuses new players: ' + JSON.stringify(locked));
    await page.click('#lockBtn:not([disabled])');
    await page.waitForSelector('#lockBtn[aria-pressed="false"]');

    /* 6. question 1: answers counted live, everyone answered → reveal */
    const sample = await page.evaluate((L) => window.APP_CONTENT[L].questions, lang);
    await page.click('#nextBtn');
    await page.waitForSelector('#qText');
    expect((await page.textContent('#qText')).trim() === sample[0].q, 'question 1 is on the projector');
    expect(await count('#tiles .tile') === sample[0].options.length, 'one coloured tile per option');
    const right = sample[0].correct, wrong = (right + 1) % sample[0].options.length;
    await s1.evaluate(([c, ch]) => window.EDUCloud.submitAnswer(c, 0, ch), [code, right]);
    await page.waitForSelector('#answered[data-n="1"]', { timeout: 10000 });
    expect(await page.getAttribute('#answered', 'data-total') === '2', 'live count: 1 of 2 answered');
    await s2.evaluate(([c, ch]) => window.EDUCloud.submitAnswer(c, 0, ch), [code, wrong]);
    await page.waitForSelector('#bars .barrow', { timeout: 10000 });
    await page.waitForFunction((r) => { const row = document.querySelector('#bars .barrow[data-i="' + r + '"]'); return row && row.getAttribute('data-count') === '1'; }, right, { timeout: 10000 });
    expect(await page.$eval('#bars .barrow[data-i="' + right + '"]', e => e.classList.contains('is-correct')), 'correct option is highlighted');
    expect(await page.getAttribute('#bars .barrow[data-i="' + wrong + '"]', 'data-count') === '1', 'the wrong answer is counted on its bar');

    /* scores written by the host reach the student's phone */
    const me = await s1.evaluate((c) => new Promise((res) => {
      let off = null; const timer = setTimeout(() => { if (off) off(); res(null); }, 8000);
      off = window.EDUCloud.playerWatch(c, st => { if (st.me && st.me.lastQ === 0) { clearTimeout(timer); setTimeout(off, 0); res(st.me); } });
    }), code);
    expect(me && me.score >= 500 && me.score <= 1000 && me.last === me.score, 'a fast correct answer scores 500-1000 points: ' + JSON.stringify(me));
    const ravi = await page.evaluate(async (c) => (await window.EDUCloud.sessionResults(c)).players.find(p => p.name === 'Ravi'), code);
    expect(ravi && ravi.score === 0, 'a wrong answer scores 0');

    /* 7. leaderboard with the keyboard, then question 2 */
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press('Space');
    await page.waitForSelector('#board li');
    const top = await page.$$eval('#board li .nm', els => els.map(e => e.textContent));
    expect(top.length === 2 && top[0] === 'Asha', 'Asha leads the leaderboard: ' + top.join(','));
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction((q) => { const e = document.querySelector('#qText'); return !!(e && document.querySelector('#tiles') && e.textContent.trim() === q); }, sample[1].q, { timeout: 10000 });
    await page.click('#nextBtn');                    // "Show the answer" before anyone answers
    await page.waitForSelector('#bars .barrow');
    await page.click('#endBtn');                     // confirm() is auto-accepted
    await page.waitForSelector('#podium', { timeout: 10000 });
    const finalNames = await page.$$eval('#finalTable tbody td:nth-child(2)', els => els.map(e => e.textContent));
    expect(finalNames.length === 2 && finalNames[0] === 'Asha', 'final table ranks Asha first: ' + finalNames.join(','));
    const rank = await s2.evaluate((c) => new Promise((res) => {
      let off = null; const timer = setTimeout(() => { if (off) off(); res(null); }, 8000);
      off = window.EDUCloud.playerWatch(c, st => { if (st.me && st.me.rank && st.session && st.session.state === 'ended') { clearTimeout(timer); setTimeout(off, 0); res(st.me.rank); } });
    }), code);
    expect(rank === 2, 'the phone gets its final rank (Ravi 2nd): ' + rank);

    /* 8. CSV export */
    let csv = '';
    try {
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#exportCsv')]);
      csv = fs.readFileSync(await dl.path(), 'utf8');
    } catch (e) {
      log('download event not available (' + String(e.message).split('\n')[0] + '), reading the CSV from EDU.download');
      csv = await page.evaluate(() => new Promise((res) => {
        const orig = EDU.download;
        EDU.download = (name, content) => { EDU.download = orig; res(String(content)); };
        document.querySelector('#exportCsv').click();
      }));
    }
    const lines = csv.replace(/^﻿/, '').split(/\r?\n/);
    const ashaRow = (lines.find(l => /(^|,)Asha(,|$)/.test(l)) || '').split(',');
    expect(csv.includes('Asha') && csv.includes('Ravi') && !csv.includes('Zed'), 'CSV lists the nicknames of the players');
    expect(ashaRow[0] === '1' && Number(ashaRow[2]) === me.score && ashaRow[3] === '1', 'CSV row for Asha: rank 1, score ' + me.score + ', 1 correct: ' + ashaRow.join(','));

    /* 9. dashboard: past session → results → delete */
    await page.click('#hBack');
    const row = '#sessList .srow[data-code="' + code + '"]';
    await page.waitForSelector(row, { timeout: 10000 });
    expect(await page.getAttribute(row, 'data-state') === 'ended', 'the session is listed as ended');
    await page.click(row + ' [data-act="results"]');
    await page.waitForSelector('#v-results #finalTable');
    expect(await count('#v-results #finalTable tbody tr') === 2, 'past results show both players');
    await page.click('#delSession');                 // confirm() is auto-accepted
    await page.waitForSelector('#v-dash:not([hidden])');
    await page.waitForFunction((c) => !document.querySelector('#sessList .srow[data-code="' + c + '"]') && !!document.querySelector('#noSessions'), code, { timeout: 10000 });

    /* 10. delete account (strong confirm), then sign in again */
    await page.click('#deleteAccount');
    await page.waitForSelector('#delGo');
    expect(await page.isDisabled('#delGo'), 'account deletion needs the "I understand" tick');
    await page.check('#delChk');
    await page.click('#delGo');
    await page.waitForSelector('#v-signin:not([hidden])', { timeout: 10000 });
    const leftover = await page.evaluate(() => Object.keys(localStorage).filter(k => /^edu\.cloudmock\.(quizzes|sessions)\//.test(k)).length);
    expect(leftover === 0, 'account deletion removed all quizzes and sessions (' + leftover + ' left)');
    await page.click('#signIn');
    await page.waitForSelector('#v-dash:not([hidden]) #noQuizzes');
  } finally {
    for (const p of extra) await p.close().catch(() => { });
  }
};
