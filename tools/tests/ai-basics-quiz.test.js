/* Interaction test for AI Basics Quiz (run by tools/verify.js in en and hi). */
const path = require('path');

module.exports = async function ({ page, lang, expect, t, log, shotsDir }) {
  const key = await page.evaluate(() => window.APP_QUIZ_KEY);
  const ans = {}, topicOf = {}, idx = {};
  key.forEach((k, i) => { ans[k.id] = k.a; topicOf[k.id] = k.topic; idx[k.id] = i; });
  const bank = (L) => page.evaluate((L) => (window.APP_CONTENT[L] || window.APP_CONTENT.en).questions, L);
  const content = await bank(lang);
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const stored = (k) => page.evaluate((k) => JSON.parse(localStorage.getItem('edu.ai-basics-quiz.' + k) || 'null'), k);
  const qid = () => page.getAttribute('#qText', 'data-qid');
  const posOf = async (box, orig) => +(await page.getAttribute(`${box} .opt[data-opt="${orig}"]`, 'data-pos'));
  const shot = async (name) => { if (shotsDir && lang === 'en') await page.screenshot({ path: path.join(shotsDir, name), fullPage: true }).catch(() => { }); };

  /* 0. setup screen */
  await page.waitForSelector('#topicChips .chip');
  expect(key.length === 30 && content.length === 30, 'question bank has 30 questions in ' + lang);
  expect(await page.locator('#topicChips .chip').count() === 8, '8 topic chips (All + 7 topics)');
  expect((await txt('#availMsg')) === t('n_available', { n: 30 }), 'all 30 questions available, got ' + (await txt('#availMsg')));

  /* 1. topic filter + practice mode with instant feedback */
  await page.click('#topic-all');
  expect(await page.isVisible('#topicErr') && await page.isDisabled('#startBtn'), 'no topic selected → message and Start disabled');
  await page.click('#topic-eval');
  expect((await txt('#availMsg')) === t('n_available', { n: 6 }), 'Evaluation topic has 6 questions');
  await page.click('#mode-practice');
  await page.uncheck('#shufQ');
  await page.uncheck('#shufO');
  await page.selectOption('#numSel', 'all');
  await page.click('#startBtn');
  await page.waitForSelector('#quiz:not([hidden])');
  let id = await qid();
  expect(id === 'q19', 'unshuffled Evaluation practice starts with q19, got ' + id);
  expect((await txt('#qText')) === content[idx.q19].q.replace(/\s+/g, ' '), 'question shown in the page language');
  expect((await txt('#qProgress')) === t('q_of', { n: 1, total: 6 }), 'progress says question 1 of 6');
  await page.click('#qOpt' + ((ans.q19 + 1) % 4));
  let fb = await txt('#qFeedback');
  expect(fb.includes(t('wrong')) && fb.includes(content[idx.q19].e.replace(/\s+/g, ' ')), 'wrong answer → feedback with explanation');
  expect(await page.locator('#qOpts .is-right').count() === 1 && (await page.getAttribute('#qOpts .is-right', 'data-opt')) === String(ans.q19), 'the right option is highlighted');
  expect(await page.isDisabled('#qOpt0'), 'options are locked after answering');
  await shot('en-practice-feedback.png');
  await page.click('#qNext');
  for (let i = 1; i < 6; i++) {
    id = await qid();
    expect(topicOf[id] === 'eval', 'only Evaluation questions, got ' + id);
    const pos = await posOf('#qOpts', ans[id]);
    if (i === 2) await page.keyboard.press(String(pos + 1)); else await page.click('#qOpt' + pos);
    expect((await txt('#qFeedback')).includes(t('correct')), 'right answer feedback for ' + id);
    if (i === 3) {
      /* live language switch re-renders the current question and feedback */
      const other = lang === 'en' ? 'hi' : 'en';
      const oc = await bank(other);
      await page.selectOption('#edu-lang', other);
      expect((await txt('#qText')) === oc[idx[id]].q.replace(/\s+/g, ' '), 'question re-rendered after switching to ' + other);
      expect((await txt('#qFeedback')).includes(oc[idx[id]].e.replace(/\s+/g, ' ')), 'explanation re-rendered after switching language');
      await page.selectOption('#edu-lang', lang);
      expect((await txt('#qText')) === content[idx[id]].q.replace(/\s+/g, ' '), 'question back in ' + lang);
    }
    await page.click('#qNext');
  }
  await page.waitForSelector('#results:not([hidden])');
  expect((await txt('#rScore')) === '5/6' && (await txt('#rPct')) === '83%', 'practice result 5/6 = 83%, got ' + (await txt('#rScore')) + ' ' + (await txt('#rPct')));
  expect(await page.locator('#rReview .rv').count() === 6 && await page.locator('#rReview .rv.bad').count() === 1, 'review lists 6 answers with 1 mistake');
  expect(await page.locator('#rTopics .tbar').count() === 1, 'one topic bar (Evaluation)');

  await page.click('#rMistakes');
  await page.waitForSelector('#quiz:not([hidden])');
  expect((await qid()) === 'q19' && (await txt('#qProgress')) === t('q_of', { n: 1, total: 1 }), 'practise mistakes repeats only q19');
  await page.click(`#qOpts .opt[data-opt="${ans.q19}"]`);
  await page.click('#qNext');
  await page.waitForSelector('#results:not([hidden])');
  expect((await txt('#rScore')) === '1/1' && await page.isHidden('#certCard'), 'mistake practice 1/1, no certificate for it');
  let hist = await stored('history');
  expect(hist.length === 1 && hist[0].score === 5 && hist[0].total === 6 && hist[0].mode === 'practice', 'history saved once: ' + JSON.stringify(hist));

  /* 2. time runs out → the test submits itself */
  await page.click('#rHome');
  await page.click('#topic-all');
  await page.click('#mode-test');
  await page.selectOption('#numSel', '5');
  await page.selectOption('#testSecs', '30');
  await page.click('#startBtn');
  await page.waitForSelector('#quiz:not([hidden])');
  id = await qid();
  await page.click('#qOpt' + (await posOf('#qOpts', ans[id])));
  await page.evaluate(() => { window.__realNow = Date.now; const r = Date.now; Date.now = () => r() + 3 * 60 * 1000; });
  await page.waitForSelector('#results:not([hidden])', { timeout: 5000 });
  await page.evaluate(() => { Date.now = window.__realNow; });
  expect(await page.isVisible('#rTimeUp') && (await txt('#rScore')) === '1/5', 'time up → auto-submitted with 1/5');

  /* 3. timed test: 10 balanced questions, 8 right, 1 wrong, 1 skipped */
  await page.click('#rHome');
  expect(await page.isVisible('#mode-test[aria-pressed="true"]'), 'test mode still selected');
  await page.check('#shufQ');
  await page.check('#shufO');
  await page.selectOption('#numSel', '10');
  await page.selectOption('#testSecs', '60');
  expect((await txt('#testTotal')).includes('10:00'), 'total time 10:00 for 10 × 60 s');
  await page.click('#startBtn');
  await page.waitForSelector('#quiz:not([hidden])');
  expect(/\d+:\d\d/.test(await txt('#qTimer')), 'test shows a countdown timer');
  expect(await page.locator('#qNav button').count() === 10, '10 question buttons in the navigator');
  const sess = await stored('session');
  expect(sess && new Set(sess.items.map((x) => topicOf[x.id])).size === 7, '10 questions are spread over all 7 topics');
  const firstId = await qid();
  for (let i = 0; i < 10; i++) {
    id = await qid();
    const right = await posOf('#qOpts', ans[id]);
    if (i < 8) await page.click('#qOpt' + right);
    else if (i === 8) await page.click('#qOpt' + ((right + 1) % 4));
    expect((await txt('#qFeedback')) === '', 'no feedback during a test');
    if (i < 9) await page.click('#qNext');
  }
  expect(await page.isHidden('#qNext'), 'no Next on the last test question');
  await page.click('#qNav button:nth-child(1)');
  expect((await qid()) === firstId && await page.locator('#qOpts .opt[aria-pressed="true"]').count() === 1, 'navigator jumps back to question 1 with its answer kept');
  expect(await page.locator('#qNav button.done').count() === 9, '9 answered in the navigator');
  await shot('en-test.png');
  await page.click('#qSubmit');
  await page.waitForSelector('#results:not([hidden])');
  expect((await txt('#rScore')) === '8/10' && (await txt('#rPct')) === '80%', 'test result 8/10 = 80%, got ' + (await txt('#rScore')));
  expect((await txt('#rSkipped')).includes('1') && (await txt('#rWrong')).includes('1'), '1 wrong and 1 not answered');
  expect(await page.locator('#rTopics .tbar').count() === 7, 'score by topic for 7 topics');
  expect(await page.locator('#rTopics .tval bdi[dir="ltr"]').count() === 7, 'topic fractions are kept left-to-right (Urdu showed "2 / 1" for 1 of 2)');
  expect(!(await txt('#rRevise')).includes('?,') && !(await txt('#rRevise')).includes('?' + (lang === 'hi' ? ' और' : ' and')), 'revise tip lists topic names without a stray "?"');
  await page.check('#onlyWrong');
  expect(await page.locator('#rReview .rv').count() === 2, 'only mistakes: 2 items');
  await page.uncheck('#onlyWrong');
  expect(await page.locator('#rReview .rv').count() === 10, 'all 10 answers in review');

  /* certificate */
  await page.fill('#certName', 'Asha Verma');
  await page.fill('#certSchool', 'Class 9 B');
  expect((await txt('#certNameOut')) === 'Asha Verma', 'certificate shows the typed name');
  expect((await txt('#certBody')) === t('cert_body', { score: 8, total: 10, pct: 80 }), 'certificate shows 8 of 10 (80%)');
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click('#certPrint');
  expect(await page.evaluate(() => window.__printed) === 1 && await page.locator('#printArea .cert').count() === 1, 'certificate placed in the print area and print opened');
  hist = await stored('history');
  expect(hist.length === 3 && hist[0].score === 8 && hist[0].pct === 80 && hist[0].mode === 'test', 'test saved to history');

  /* 4. reload keeps history and settings; a corrupted history row (bad date) used to crash the setup screen */
  await page.evaluate(() => {
    const k = 'edu.ai-basics-quiz.history', h = JSON.parse(localStorage.getItem(k) || '[]');
    h.push({ d: 'not-a-date', mode: 'test', score: 1, total: 2, pct: 50 }, null, 7);
    localStorage.setItem(k, JSON.stringify(h));
  });
  await page.reload();
  await page.waitForSelector('#topicChips .chip');
  expect(await page.locator('#historyList li').count() === 3, '3 results listed after reload (corrupted rows skipped)');
  expect(await page.isVisible('#lastBtn') && await page.locator('#historyList bdi[dir="ltr"]').count() === 3, 'setup screen fully rendered despite a corrupted row');
  expect((await txt('#bestBadge')) === t('best_score', { pct: 83 }), 'best score 83%');
  expect(await page.isVisible('#mode-test[aria-pressed="true"]'), 'chosen mode remembered');

  /* 5. projector quiz with teams (count beeps: the time-up beep must only sound for a visible, running timer) */
  await page.evaluate(() => {
    window.__beeps = 0;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    window.AudioContext = function () { const ac = new AC(); const co = ac.createOscillator.bind(ac); ac.createOscillator = function () { window.__beeps++; return co(); }; return ac; };
  });
  const fastForward = async (ms) => {
    await page.evaluate((ms) => { window.__realNow2 = Date.now; const r = Date.now; Date.now = () => r() + ms; }, ms);
    await page.waitForTimeout(700);
    await page.evaluate(() => { Date.now = window.__realNow2; });
  };
  await page.click('#mode-class');
  await page.selectOption('#numSel', '5');
  await page.selectOption('#teamCount', '3');
  await page.fill('#teamName0', 'Ganga');
  await page.selectOption('#classSecs', '30');
  await page.click('#startBtn');
  await page.waitForSelector('#classView:not([hidden])');
  expect((await txt('#cProgress')) === t('q_of', { n: 1, total: 5 }), 'projector quiz starts at question 1 of 5');
  expect(await page.isVisible('#cTimer') && /^(30|29|28)$/.test(await txt('#cTimer')), 'question timer counts down from 30');
  expect(await page.locator('#teams .team').count() === 3 && (await txt('#teams .team:nth-child(1) .team-name')) === 'Ganga', '3 teams, custom name kept');
  await page.click('#teamPlus0');
  await page.click('#teamPlus0');
  await page.click('#teamPlus2');
  await page.click('#teamMinus2');
  expect((await txt('#teamScore0')) === '2' && (await txt('#teamScore2')) === '0', 'team points update');
  expect(await page.locator('#cOpts .is-right').count() === 0 && await page.isHidden('#cExplain'), 'answer hidden before reveal');
  const cid = await page.getAttribute('#cText', 'data-qid');
  await page.click('#cOpt' + ((await posOf('#cOpts', ans[cid]) + 1) % 4));
  expect(await page.locator('#cOpts .picked').count() === 1, 'class answer marked');
  await page.keyboard.press('r');
  expect(await page.locator('#cOpts .is-right').count() === 1 && (await page.getAttribute('#cOpts .is-right', 'data-opt')) === String(ans[cid]), 'R reveals exactly the right option');
  expect(await page.locator('#cOpts .is-wrong').count() === 1 && await page.isVisible('#cExplain'), 'class answer marked wrong, explanation shown');
  expect(await page.isHidden('#cTimerBox'), 'timer hidden after reveal');
  expect(await page.locator('#teamPlus0 bdi[dir="ltr"]').count() === 1, '+1 button text is kept left-to-right');
  await page.keyboard.press('t');
  await fastForward(60000);
  expect(await page.isHidden('#cTimerBox') && await page.evaluate(() => window.__beeps) === 0, 'T after reveal does not start a hidden countdown that beeps');
  await shot('en-projector.png');
  await page.click('#cNext');
  expect((await txt('#cProgress')) === t('q_of', { n: 2, total: 5 }), 'next goes to question 2');
  expect(/^(30|29|28)$/.test(await txt('#cTimer')), 'fresh 30 s timer on question 2');
  await fastForward(60000);
  const beeped = await page.evaluate(() => window.__beeps);
  expect((await txt('#cTimer')) === t('times_up') && (beeped === 1 || !(await page.evaluate(() => !!(window.AudioContext)))), 'visible timer runs out: "time is up" and one beep, got ' + beeped);
  for (let i = 2; i <= 5; i++) await page.click('#cNext');
  await page.waitForSelector('#cEnd:not([hidden])');
  expect((await txt('#cWinner')).includes(t('winner', { team: 'Ganga' })), 'Ganga wins');
  expect((await page.getAttribute('#cRank li:first-child', 'data-team')) === '0' && await page.locator('#cRank li').count() === 3, 'ranking lists 3 teams, Ganga first');
  expect((await stored('session')) === null, 'finished projector quiz is not offered for resume');
  await shot('en-projector-end.png');

  /* 6. printable question paper with answer key */
  await page.click('#cHome');
  await page.click('#topic-all');
  await page.click('#topic-ethics');
  await page.click('#topic-genai');
  await page.selectOption('#numSel', 'all');
  await page.click('#paperBtn');
  expect(await page.locator('#printArea .paper .p-qs > li').count() === 6 && await page.locator('#printArea .paper .p-ans > li').count() === 6, 'question paper with 6 questions and answer key');
  /* topic list on the paper: "What is AI?" must not leave a "?" inside the list */
  await page.click('#topic-basics');
  await page.click('#paperBtn');
  const sub = await txt('#printArea .p-sub');
  expect(sub.includes(t('topic_ethics')) && !sub.includes('?'), 'paper subtitle lists the 3 topics cleanly: ' + sub);
  expect(await page.locator('#printArea .p-qs > li').count() === 10, 'paper with What is AI + ethics + generative AI = 10 questions');
  await page.click('#topic-basics');
  /* after printing, Ctrl+P must print the screen, not the old paper */
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.emulateMedia({ media: 'print' });
  const pr = await page.evaluate(() => [getComputedStyle(document.getElementById('printArea')).display, getComputedStyle(document.getElementById('setup')).display]);
  await page.emulateMedia({ media: null });
  expect(pr[0] === 'none' && pr[1] !== 'none', 'plain Ctrl+P prints the screen without the stale paper: ' + pr.join(','));

  /* 7. unfinished quiz can be resumed after a reload */
  await page.click('#mode-practice');
  await page.click('#startBtn');
  id = await qid();
  await page.click('#qOpt' + (await posOf('#qOpts', ans[id])));
  await page.click('#qNext');
  const id2 = await qid();
  await page.reload();
  await page.waitForSelector('#resumeBox:not([hidden])');
  await page.click('#resumeBtn');
  expect((await qid()) === id2 && (await txt('#qProgress')) === t('q_of', { n: 2, total: 6 }), 'resume continues at question 2 of 6');

  /* 8. phone: after tapping Next far down the page, the new question is shown below the sticky header */
  const vp0 = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 640 });
  await page.click('#qOpt' + (await posOf('#qOpts', ans[id2])));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.click('#qNext');
  await page.waitForTimeout(100);
  const pos3 = await page.evaluate(() => {
    const hb = document.querySelector('.edu-top').getBoundingClientRect().bottom, r = document.getElementById('qText').getBoundingClientRect();
    return { hb: Math.round(hb), top: Math.round(r.top), bottom: Math.round(r.bottom), h: innerHeight };
  });
  expect((await txt('#qProgress')) === t('q_of', { n: 3, total: 6 }) && pos3.top >= pos3.hb && pos3.bottom <= pos3.h, 'next question visible on a phone: ' + JSON.stringify(pos3));
  if (vp0) await page.setViewportSize(vp0);

  /* 9. "New quiz" after every topic was switched off goes back to the topic choice (it used to do nothing) */
  await page.click('#qQuit');
  await page.waitForSelector('#setup:not([hidden])');
  for (let i = 0; i < 2 && (await txt('#availMsg')) !== t('n_available', { n: 0 }); i++) await page.click('#topic-all');
  expect((await txt('#availMsg')) === t('n_available', { n: 0 }), 'all topics switched off');
  await page.click('#lastBtn');
  await page.waitForSelector('#results:not([hidden])');
  await page.click('#rAgain');
  expect(await page.isVisible('#setup') && await page.isHidden('#results') && await page.isVisible('#topicErr'), 'New quiz with no topic → back to setup with the "pick a topic" message');
  expect((await stored('session')) === null, 'no empty session was started');
  await page.click('#topic-all');

  /* leave the 8/10 test result (with certificate) on screen for the screenshot */
  await page.click('#lastBtn');
  await page.waitForSelector('#results:not([hidden])');
  expect((await txt('#rScore')) === '8/10' && (await txt('#certNameOut')) === 'Asha Verma', 'last result and name restored');
  log('ok', lang);
};
