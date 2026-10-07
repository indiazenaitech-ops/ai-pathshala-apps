/* Interaction test for Live Poll & Voting (run by tools/verify.js in en and hi, always in Demo mode).
 * One host tab (the page under test) + two participant tabs of the same browser (this app with ?code=).
 * Covers: Demo sign-in, editor validation + answer-type presets + save (dummy correct:0, kind in explain),
 * lobby (QR, participant URL, named + guest join), live counts, one vote per question, hide results (H key),
 * keyboard next, average for a rating, close voting = end, CSV, no reveal / no scores, reloads, "Remove me". */
'use strict';
module.exports = async function ({ page, lang, expect, t, log, base }) {
  const ctx = page.context();
  const extra = [];
  const wf = (p, fn, arg) => p.waitForFunction(fn, arg, { timeout: 10000 });
  try {
    /* 1. Demo sign-in */
    await page.waitForSelector('#signIn:not([disabled])');
    expect(await page.evaluate(() => window.EDUCloud.mode) === 'mock', 'tests run in Demo mode');
    expect(await page.isVisible('#demoBanner'), 'Demo banner shown');
    await page.click('#signIn');
    await page.waitForSelector('#v-dash:not([hidden]) #hostSample');
    expect((await page.textContent('#hello')).includes(t('demo_host')), 'Demo Host label translated');

    /* 2. editor */
    await page.click('#newPoll');
    await page.waitForSelector('#pTitle');
    await page.click('#savePoll');
    expect((await page.textContent('#edMsg')).trim() === t('err_title'), 'empty title refused');
    await page.fill('#pTitle', 'Team poll');
    await page.fill('#pq0', 'Lunch together?');
    await page.selectOption('#pk0', 'yesno');
    const presetYes = await page.inputValue('#po0_0');
    expect(presetYes === await page.evaluate(L => window.APP_CONTENT[L].presets.yesno[0], lang), 'Yes/No preset fills options: ' + presetYes);
    await page.click('#addQ');
    await page.fill('#pq1', 'Rate the session');
    await page.selectOption('#pk1', 'stars');
    await page.click('#savePoll');
    await page.waitForSelector('#v-dash:not([hidden]) #pollList .cloud-poll');
    const saved = await page.evaluate(async () => { const l = await window.EDUCloud.listQuizzes(); return window.EDUCloud.getQuiz(l[0].id); });
    expect(saved.questions.length === 2 && saved.questions[0].options.length === 2 && saved.questions[1].options.length === 5 &&
      saved.questions.every(q => q.correct === 0) && saved.questions[1].explain === 'poll:stars', 'poll saved with dummy correct:0 and kinds: ' + JSON.stringify(saved.questions.map(q => q.explain)));

    /* 3. run it: lobby */
    await page.click('#pollList .cloud-poll [data-act="host"]');
    await page.waitForSelector('#lobbyCode');
    const code = await page.getAttribute('#lobbyCode', 'data-code');
    expect(/^\d{6}$/.test(code), 'six-digit code ' + code);
    const qrUrl = await page.getAttribute('#qrImg', 'data-url');
    expect(qrUrl.includes('live-poll/index.html') && qrUrl.includes('code=' + code) && await page.locator('#qrImg svg path').count() === 1, 'QR drawn for the participant URL: ' + qrUrl);

    /* 4. participants */
    async function partTab(nick) {
      const p = await ctx.newPage();
      extra.push(p);
      p.on('dialog', d => d.accept().catch(() => { }));
      await p.goto(base + 'apps/live-poll/index.html?code=' + code + '&lang=' + lang, { waitUntil: 'load' });
      await p.waitForSelector('#pName');
      if (nick) await p.fill('#pName', nick);
      await p.click('#pJoin');
      await p.waitForSelector('#pLobby');
      return p;
    }
    const p1 = await partTab('Asha'), p2 = await partTab('');
    await wf(page, () => document.querySelectorAll('#players .pchip').length === 2);
    const names = await page.$$eval('#players .nm', e => e.map(x => x.textContent));
    expect(names[0] === 'Asha' && /-\d{4}$/.test(names[1]), 'named + guest participants: ' + names.join(','));

    /* 5. question 1: votes */
    await page.click('#nextBtn');
    await p1.waitForSelector('.vote-btn[data-i="0"]');
    await p1.click('.vote-btn[data-i="0"]');
    await p2.waitForSelector('.vote-btn[data-i="1"]');
    await p2.click('.vote-btn[data-i="1"]');
    await p1.waitForSelector('#pSent'); await p2.waitForSelector('#pSent');
    await wf(page, () => document.querySelector('#votesLine') && document.querySelector('#votesLine').getAttribute('data-n') === '2');
    const counts = await page.$$eval('#bars .barrow', r => r.map(x => x.getAttribute('data-count')));
    expect(counts.join(',') === '1,1', 'live counts 1/1: ' + counts.join(','));
    const second = await p1.evaluate(async c => { try { await window.EDUCloud.submitAnswer(c, 0, 1); return 'ok'; } catch (e) { return e.code; } }, code);
    expect(second === 'permission-denied', 'second, different vote rejected: ' + second);

    /* hide results with H */
    await page.locator('body').press('h');
    await page.waitForSelector('#bars.hidden-res');
    expect(await page.isVisible('#hiddenBox'), 'results hidden while voting');
    await page.locator('body').press('h');
    await page.waitForSelector('#bars:not(.hidden-res)');

    /* 6. question 2 by keyboard, rating average */
    await page.locator('body').press(lang === 'ur' ? 'ArrowLeft' : 'ArrowRight');
    await page.waitForSelector('#qNum');
    await wf(page, () => /2/.test(document.querySelector('#qNum').textContent));
    await p1.waitForSelector('.vote-btn[data-i="4"]'); await p1.click('.vote-btn[data-i="4"]');
    await p2.waitForSelector('.vote-btn[data-i="2"]'); await p2.click('.vote-btn[data-i="2"]');
    await wf(page, () => document.querySelector('#votesLine').getAttribute('data-n') === '2');
    const avg = (await page.textContent('#hStage .avg')).trim();
    expect(avg === t('average', { n: '4.0', max: '5' }), 'average 4.0 of 5: ' + avg);

    /* 7. close voting = end */
    await page.click('#nextBtn');
    await page.waitForSelector('#finalCount');
    await p1.waitForSelector('#pEnd'); await p2.waitForSelector('#pEnd');
    const csv = await page.evaluate(() => new Promise(res => {
      const orig = EDU.download; EDU.download = (n, c) => { EDU.download = orig; res(String(c)); };
      document.querySelector('#exportCsv').click();
    }));
    expect(csv.includes('Asha') && csv.includes('Lunch together?') && csv.split(/\r?\n/).some(l => /,1,50\s*$/.test(l)), 'CSV has votes and 50%');
    const res = await page.evaluate(c => window.EDUCloud.sessionResults(c), code);
    expect(!res.session.reveal && res.players.every(p => !p.score), 'no reveal and no scores written');

    /* 8. reload recovery */
    await p1.reload({ waitUntil: 'load' });
    await p1.waitForSelector('#pEnd');
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#finalCount');
    expect(await page.getAttribute('#finalCount', 'data-n') === '2', 'host reload shows the results again');

    /* 9. Remove me */
    await p2.click('#removeMe');
    await p2.waitForSelector('#pMsg');
    expect((await p2.textContent('#pMsg')).trim() === t('removed_done'), 'participant removed their data');
    log('poll ' + code + ' ok');
  } finally {
    for (const p of extra) await p.close().catch(() => { });
  }
};
