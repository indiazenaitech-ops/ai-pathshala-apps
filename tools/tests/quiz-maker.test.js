/* Interaction test for Quiz Maker & Player (run by tools/verify.js in en and hi). */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t, log }) {
  const count = (sel) => page.locator(sel).count();
  const stored = () => page.evaluate(() => {
    const qs = JSON.parse(localStorage.getItem('edu.quiz-maker.quizzes') || '[]');
    const cur = JSON.parse(localStorage.getItem('edu.quiz-maker.current') || 'null');
    return qs.find(q => q.id === cur) || qs[0];
  });

  /* 1. sample quiz in the page language */
  await page.waitForSelector('#qList .qitem');
  expect(await count('#qList .qitem') === 5, 'sample quiz has 5 questions');
  const sampleTitle = await page.inputValue('#quizTitle');
  const wantTitle = await page.evaluate((L) => window.APP_CONTENT[L].title, lang);
  expect(sampleTitle === wantTitle, `sample title is in ${lang}: "${sampleTitle}"`);

  /* 1b. an untouched sample quiz saved in another language follows the UI language after a reload
         (e.g. the teacher changed the language on the library home page) */
  const otherL = lang === 'en' ? 'hi' : 'en';
  await page.evaluate((o) => {
    const c = window.APP_CONTENT[o];
    localStorage.setItem('edu.quiz-maker.quizzes', JSON.stringify([{ id: 'smp', title: c.title, sample: o, questions: c.questions }]));
    localStorage.setItem('edu.quiz-maker.current', JSON.stringify('smp'));
  }, otherL);
  await page.reload();
  await page.waitForSelector('#qList .qitem');
  expect(await page.inputValue('#quizTitle') === wantTitle && await count('#qList .qitem') === 5, `stored ${otherL} sample is shown in ${lang} after reload`);

  /* 2. validation */
  await page.click('#saveQ');
  expect((await page.textContent('#edMsg')).trim() === t('err_no_text'), 'empty question shows an error');
  expect(await count('#qList .qitem') === 5, 'nothing added for an empty question');
  await page.fill('#qText', 'What is 7 × 8?');
  await page.fill('#opt0', '54');
  await page.click('#saveQ');
  expect((await page.textContent('#edMsg')).trim() === t('err_options'), 'one option only shows an error');

  /* 3. add an MCQ with 5 options (answer = B) */
  await page.fill('#opt1', '56');
  await page.fill('#opt2', '58');
  await page.fill('#opt3', '64');
  await page.click('#addOpt');
  await page.fill('#opt4', '48');
  await page.click('#saveQ');
  expect((await page.textContent('#edMsg')).trim() === t('err_correct'), 'no correct answer chosen shows an error');
  await page.check('#ans1');
  await page.fill('#qExplain', '7 × 8 = 56');
  await page.click('#saveQ');
  expect(await count('#qList .qitem') === 6, 'MCQ added (6 questions)');
  let quiz = await stored();
  const mcq = quiz.questions[5];
  expect(mcq.type === 'mcq' && mcq.options.length === 5 && mcq.answer === 1 && mcq.options[1] === '56', 'MCQ saved with 5 options and answer B: ' + JSON.stringify(mcq));
  expect(quiz.questions.length === 6 && !quiz.sample, 'editing marks the quiz as the teacher’s own');

  /* 4. add a True/False question (answer False), then reorder and delete */
  await page.click('#typeTf');
  await page.fill('#qText', 'The Sun is a planet.');
  await page.check('#tfFalse');
  await page.click('#saveQ');
  expect(await count('#qList .qitem') === 7, 'T/F added (7 questions)');
  await page.click('#qList .qitem:nth-child(7) [data-act="up"]');
  expect((await page.textContent('#qList .qitem:nth-child(6) .qtext')).trim() === 'The Sun is a planet.', 'move up swaps questions 6 and 7');
  await page.click('#qList .qitem:nth-child(7) [data-act="del"]');
  expect(await count('#qList .qitem') === 6, 'delete removes a question');
  quiz = await stored();
  expect(quiz.questions[5].type === 'tf' && quiz.questions[5].answer === 1, 'T/F stored as False');

  /* 5. edit question 1 text */
  await page.click('#qList .qitem:nth-child(1) [data-act="edit"]');
  await page.fill('#qText', 'Edited: national animal?');
  await page.click('#saveQ');
  quiz = await stored();
  expect(quiz.questions[0].text === 'Edited: national animal?' && quiz.questions.length === 6, 'edit updates in place');

  /* 6. student practice: first answer wrong, rest right */
  await page.click('#tab-practice');
  await page.click('#prStartBtn');
  const N = quiz.questions.length;
  for (let i = 0; i < N; i++) {
    const q = quiz.questions[i];
    const nOpts = q.type === 'tf' ? 2 : q.options.length;
    const pos = i === 0 ? (q.answer + 1) % nOpts : q.answer;
    await page.click(`#prOpts .opt-tile:nth-child(${pos + 1})`);
    const fb = await page.textContent('#prFeedback');
    expect(fb.includes(i === 0 ? t('wrong') : t('correct')), `instant feedback for question ${i + 1}`);
    await page.click('#prNext');
  }
  const score = (await page.textContent('#prScore')).replace(/\s+/g, ' ').trim();
  expect(score === `${N - 1} / ${N}`, `practice score should be ${N - 1} / ${N}, got "${score}"`);
  expect(await count('#prReview .review-item') === 1, 'one mistake listed for review');
  await page.click('#prMistakes');
  const q0 = quiz.questions[0];
  await page.click(`#prOpts .opt-tile:nth-child(${q0.answer + 1})`);
  await page.click('#prNext');
  expect((await page.textContent('#prScore')).replace(/\s+/g, ' ').trim() === '1 / 1', 'practising mistakes only = 1 question, answered right');

  /* 7. class quiz on the projector: team points + reveal */
  await page.click('#tab-class');
  await page.click('#startClass');
  expect((await page.textContent('#cqProgress')).trim() === t('q_of', { n: 1, total: N }), 'class quiz starts at question 1');
  await page.click('#teamPlus0');
  await page.click('#teamPlus0');
  await page.click('#teamPlus2');
  await page.click('#teamMinus2');
  expect((await page.textContent('#teamScore0')).trim() === '2' && (await page.textContent('#teamScore2')).trim() === '0', 'team scores update');
  expect(await count('#cqOpts .is-right') === 0, 'answer hidden before reveal');
  await page.click('#cqReveal');
  expect(await count('#cqOpts .is-right') === 1, 'reveal marks exactly one correct option');
  await page.click('#cqNext');
  expect((await page.textContent('#cqProgress')).trim() === t('q_of', { n: 2, total: N }), 'next goes to question 2');
  /* presenter keys after a mouse click on Next: Space shows the answer (it must not press Next again) */
  await page.keyboard.press('Space');
  expect((await page.textContent('#cqProgress')).trim() === t('q_of', { n: 2, total: N }) && await count('#cqOpts .is-right') === 1, 'Space after clicking Next reveals instead of skipping a question');
  await page.keyboard.press('Space');
  await page.keyboard.press('PageDown');
  await page.keyboard.press('1');
  expect((await page.textContent('#cqProgress')).trim() === t('q_of', { n: 3, total: N }) && (await page.textContent('#teamScore0')).trim() === '3', 'PageDown = next question, key 1 = +1 for team A');
  /* switching the language mid-quiz keeps the class quiz where it was (it used to stop it) */
  const other = lang === 'en' ? 'ta' : 'bn';
  await page.selectOption('#edu-lang', other);
  await page.waitForTimeout(300);
  const progOther = (await page.textContent('#cqProgress')).trim();
  const wantOther = await page.evaluate(([L, n]) => window.APP_STRINGS[L].q_of.replace('{n}', '3').replace('{total}', String(n)), [other, N]);
  expect(await page.isVisible('#classStage') && progOther === wantOther,'class quiz still running at question 3 after switching language: "' + progOther + '"');
  await page.selectOption('#edu-lang', lang);
  await page.waitForTimeout(300);
  /* editing the quiz while the class quiz runs updates the projector (deleted / edited questions) */
  await page.click('#tab-edit');
  await page.click('#qList .qitem:nth-child(3) [data-act="edit"]');
  await page.fill('#qText', 'Edited during class');
  await page.click('#saveQ');
  await page.click('#tab-class');
  expect((await page.textContent('#cqText')).trim() === 'Edited during class', 'running class quiz shows the edited question');
  await page.click('#cqExit');

  /* 8. share link: the whole quiz is in the URL hash, opens in practice mode */
  await page.click('#tab-share');
  await page.waitForFunction(() => /#(quiz|qz)=/.test(document.getElementById('shareUrl').value));
  const url = await page.inputValue('#shareUrl');
  log('share link', url.match(/#(quiz|qz)=/)[1], url.length, 'chars');
  const wa = await page.getAttribute('#waLink', 'href');
  expect(wa.startsWith('https://wa.me/?text=') && decodeURIComponent(wa).includes(url), 'WhatsApp link contains the quiz link');
  await page.goto('about:blank');
  await page.goto(url);
  await page.waitForSelector('#sharedBanner:not([hidden])');
  expect(await page.isHidden('#quizBar') && await page.isVisible('#prStart'), 'student sees practice mode only');
  expect((await page.textContent('#prCount')).trim() === t('q_count', { n: N }), 'shared quiz has all questions');
  await page.click('#prStartBtn');
  expect((await page.textContent('#prText')).trim() === 'Edited: national animal?', 'shared quiz keeps the teacher’s text');
  const nSaved = () => page.evaluate(() => JSON.parse(localStorage.getItem('edu.quiz-maker.quizzes') || '[]').length);
  const nBefore = await nSaved();
  await page.click('#saveShared');
  await page.click('#saveShared', { force: true, timeout: 1000 }).catch(() => { });
  expect(await nSaved() === nBefore + 1 && await page.isDisabled('#saveShared'), 'saving a shared quiz twice makes only one copy');
  await page.click('#leaveShared');
  await page.waitForSelector('#quizBar:not([hidden])');
  await page.goto('about:blank');
  await page.goto(url.split('#')[0] + '#quiz=bm90LWEtcXVpeg');
  await page.waitForSelector('#badLink:not([hidden])');
  expect(await page.isVisible('#quizBar') && await page.isHidden('#sharedBanner'), 'a broken link shows a message and the normal app');

  /* 9. CSV export + import (incl. T/F detection and a bad row) */
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#tab-edit').then(() => page.click('#exportCsv'))]);
  const csvOut = fs.readFileSync(await dl.path(), 'utf8');
  expect(csvOut.includes('question,option1') && csvOut.includes('Edited: national animal?') && csvOut.includes('The Sun is a planet.'), 'CSV export has header and data');

  /* an empty quiz has no share link (the old quiz's WhatsApp link must not linger) */
  await page.click('#newQuiz');
  await page.click('#tab-share');
  expect(await page.inputValue('#shareUrl') === '' && await page.getAttribute('#waLink', 'href') === null && await page.getAttribute('#openLink', 'href') === null, 'empty quiz: no share / WhatsApp link');
  await page.click('#tab-edit');
  await page.click('#delQuiz');

  const csv = 'question,option1,option2,option3,option4,option5,option6,correct,explanation\n' +
    '"Capital of India?",Mumbai,New Delhi,Kolkata,Chennai,,,2,New Delhi is the capital.\n' +
    'Water is H2O,True,False,,,,,1,\n' +
    '"Largest planet, by size?",Earth,Jupiter,,,,,B,\n' +
    'Row without an answer,x,y,,,,,,\n' +
    'The Moon makes its own light,True,False,,,,,False,It reflects sunlight.\n' +
    'True/False row without an answer,True,False,,,,,,\n' +
    'Fastest land animal?,Cheetah,Horse,Lion,,,,cheetah,\n';
  const before = await page.locator('#quizSel option').count();
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#importBtn')]);
  await fc.setFiles({ name: 'Class 6 GK.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf8') });
  await page.waitForFunction((b) => document.querySelectorAll('#quizSel option').length === b + 1, before);
  quiz = await stored();
  expect(quiz.questions.length === 5, 'CSV import adds 5 good questions (2 rows without an answer skipped), got ' + quiz.questions.length);
  expect(quiz.questions[0].answer === 1 && quiz.questions[0].options.length === 4, 'CSV MCQ correct index 2 → New Delhi');
  expect(quiz.questions[1].type === 'tf' && quiz.questions[1].answer === 0, 'True/False row detected');
  expect(quiz.questions[2].answer === 1 && quiz.questions[2].text === 'Largest planet, by size?', 'letter answer B and quoted comma parsed');
  expect(quiz.questions[3].type === 'tf' && quiz.questions[3].answer === 1, 'True/False row with the answer written as "False" is stored as False (was True)');
  expect(quiz.questions[4].answer === 0 && quiz.questions[4].options[0] === 'Cheetah', 'answer given as the option text is matched');
  const toastTxt = await page.evaluate(() => [...document.querySelectorAll('.edu-toast')].map(e => e.textContent).join(' | '));
  expect(toastTxt.includes(t('skipped_rows', { n: 2 })), 'import message counts the 2 skipped rows: ' + toastTxt);
  expect(quiz.title === 'Class 6 GK', 'quiz named after the file');

  /* leave the projector view open for the screenshot */
  await page.click('#tab-class');
  await page.click('#startClass');
  await page.click('#cqReveal');
  log('ok', lang);
};
