/* Interaction test for Spot the Scam (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t, log }) {
  const answers = await page.evaluate(() => {
    const o = {};
    (window.SPOT_MSGS || []).forEach(m => { o[m.id] = m.scam; });
    return o;
  });
  expect(Object.keys(answers).length === 16, '16 practice messages expected, got ' + Object.keys(answers).length);
  const content = await page.evaluate(() => Object.keys(window.APP_CONTENT || {}).length);
  expect(content === 12, 'content in 12 languages');
  // Facts: the genuine PTM notice must say Saturday 10 Oct (11 Oct 2026 is a Sunday) in every language.
  const ptm = await page.evaluate(() => Object.keys(APP_CONTENT).filter(L => !/(^|\D)10(\D|$)/.test(APP_CONTENT[L].msgs.school.text) || /(^|\D)11(\D|$)/.test(APP_CONTENT[L].msgs.school.text)));
  expect(ptm.length === 0, 'PTM notice date is 10 Oct in all languages (bad: ' + ptm.join(',') + ')');

  const curId = () => page.getAttribute('#phone', 'data-id');
  const num = async sel => parseInt((await page.textContent(sel)).replace(/[^\d]/g, ''), 10);
  const correctBtn = id => (answers[id] ? '#ans-scam' : '#ans-safe');
  const wrongBtn = id => (answers[id] ? '#ans-safe' : '#ans-scam');
  const lastToast = () => page.evaluate(() => { const w = document.querySelectorAll('.edu-toast'); return w.length ? w[w.length - 1].textContent : ''; });

  // --- solo game: 8 messages ---
  await page.click('#len-8');
  await page.click('#start');
  await page.waitForSelector('#phone');
  expect((await num('#score')) === 0, 'score starts at 0');

  // Q1: answer correctly
  let id = await curId();
  const seen = [id];
  await page.click(correctBtn(id));
  await page.waitForSelector('#verdict');
  expect((await page.getAttribute('#verdict', 'data-right')) === '1', 'Q1 should be judged right');
  expect((await num('#score')) === 1, 'score is 1 after a correct answer');
  expect((await num('#streak')) === 1, 'streak is 1 after a correct answer');
  if (answers[id]) {
    const marks = await page.$$eval('#phone mark.rf', a => a.length);
    const items = await page.$$eval('#flag-list li', a => a.length);
    expect(marks > 0, 'red flags are highlighted inside the scam message');
    expect(items > 0, 'red-flag list is shown');
  } else {
    expect((await page.$$eval('#phone mark.ok', a => a.length)) > 0, 'safe signs highlighted in the genuine message');
  }
  await page.click('#next');

  // Q2: answer wrongly
  id = await curId();
  expect(!seen.includes(id), 'next message is a different one');
  seen.push(id);
  await page.click(wrongBtn(id));
  await page.waitForSelector('#verdict');
  expect((await page.getAttribute('#verdict', 'data-right')) === '0', 'Q2 should be judged wrong');
  expect((await num('#score')) === 1, 'score stays 1 after a wrong answer');
  expect((await num('#streak')) === 0, 'streak resets to 0 after a wrong answer');

  // Keyboard: Enter on "Next" goes on; a second Enter must NOT answer the new message by accident.
  expect((await page.evaluate(() => document.activeElement.id)) === 'next', 'focus moves to Next after answering');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#ans-safe');
  const q3 = await curId();
  for (let k = 0; k < 2; k++) {
    await page.keyboard.press('Enter');
    expect(!(await page.$('#verdict')) && (await curId()) === q3, 'an extra Enter press does not answer or skip the next message');
  }
  expect((await page.evaluate(() => document.activeElement.id)) === 'ask', 'focus is on the question, not on the Safe button');

  // Q3..Q8: correct (Q3 via keyboard "1"/"2")
  for (let i = 2; i < 8; i++) {
    id = await curId();
    expect(!seen.includes(id), 'no repeated message in one game');
    seen.push(id);
    // Before the answer, a fake link must not give the answer away.
    const lnk = await page.$('#phone .lnk');
    if (lnk) { await lnk.click(); expect((await lastToast()) === t('link_game'), 'neutral toast for a link before answering'); }
    if (i === 2) await page.keyboard.press(answers[id] ? '2' : '1');
    else await page.click(correctBtn(id));
    await page.waitForSelector('#next');
    if (i === 2) {
      // Enter on <summary> opens the help, it does not skip the message.
      await page.focus('#howto summary');
      await page.keyboard.press('Enter');
      expect(await page.evaluate(() => document.querySelector('#howto').open), 'Enter on the help summary opens it');
      expect(!!(await page.$('#verdict')), 'Enter on the help summary does not go to the next message');
      await page.evaluate(() => { document.querySelector('#howto').open = false; });
    }
    await page.click('#next');
  }
  await page.waitForSelector('#play-results:not([hidden]) #final-score');
  const final = (await page.textContent('#final-score')).trim();
  expect(final.startsWith('7'), 'final score should be 7/8, got ' + final);
  expect((await page.$$eval('#review .review-row', a => a.length)) === 8, '8 review rows');
  expect((await page.$$eval('#review .review-row.badr', a => a.length)) === 1, 'exactly 1 wrong answer in review');
  const safeCount = seen.filter(x => !answers[x]).length;
  expect(safeCount >= 2, 'a game mixes in genuine messages (got ' + safeCount + ')');

  // "See again" modal shows the annotated message
  await page.click('#review .review-row .btn');
  await page.waitForSelector('.edu-modal .phone');
  expect((await page.$$eval('.edu-modal .phone mark', a => a.length)) > 0, 'review modal shows highlighted message');
  await page.keyboard.press('Escape');

  // --- persistence ---
  await page.reload();
  await page.waitForSelector('#best-score');
  const best = (await page.textContent('#best-score')).trim();
  expect(best.startsWith('7'), 'best score survives reload, got ' + best);
  expect((await num('#played')) === 1, 'games played = 1');

  // unfinished game survives a reload; on a phone the score bar is not hidden under the sticky header
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('#start');
  await page.waitForSelector('#phone');
  id = await curId();
  await page.click(correctBtn(id));
  await page.reload();
  await page.waitForSelector('#continue');
  await page.click('#continue');
  await page.waitForSelector('#verdict');
  expect((await curId()) === id, 'continued game shows the same message');
  expect((await num('#score')) === 1, 'continued game keeps its score');
  const cover = await page.evaluate(() => document.querySelector('#play-game .topbar').getBoundingClientRect().top - document.querySelector('.edu-top').getBoundingClientRect().bottom);
  expect(cover >= 0, 'score bar is below the sticky header on a phone (gap ' + cover + ')');
  await page.setViewportSize({ width: 1280, height: 800 });

  // --- class mode: the whole class plays all 16 messages ---
  await page.click('#tab-class');
  await page.click('#class-start');
  await page.waitForSelector('#class-phone');
  // vote boxes clean up odd input
  await page.fill('#v-safe', '1e5'); await page.press('#v-safe', 'Tab');
  expect((await page.inputValue('#v-safe')) === '999', 'huge vote count is capped at 999');
  await page.fill('#v-safe', '-5'); await page.press('#v-safe', 'Tab');
  expect((await page.inputValue('#v-safe')) === '0', 'negative vote count becomes 0');
  let expected = 0, sawPower = false, sawLink = false;
  for (let i = 0; i < 16; i++) {
    const cid = await page.getAttribute('#class-phone', 'data-id');
    if (!sawLink && await page.$('#class-phone .lnk')) {
      await page.click('#class-phone .lnk');
      expect((await lastToast()) === t('link_game'), 'class mode: neutral toast before the reveal');
      sawLink = true;
    }
    if (i === 0) {
      for (let k = 0; k < 3; k++) await page.click('#v-scam-plus');
      await page.click('#v-safe-plus');
      expect((await page.inputValue('#v-scam')) === '3', 'scam votes = 3');
      expect((await page.inputValue('#v-safe')) === '1', 'safe votes = 1');
    } else {
      const safeV = i % 3 === 0 ? 4 : i % 3 === 1 ? 20 : 6, scamV = i % 3 === 0 ? 4 : i % 3 === 1 ? 7 : 25;
      await page.fill('#v-safe', String(safeV));
      await page.fill('#v-scam', String(scamV));
    }
    const v = { safe: +(await page.inputValue('#v-safe')), scam: +(await page.inputValue('#v-scam')) };
    const res = v.safe === v.scam ? -1 : ((v.scam > v.safe) === answers[cid] ? 1 : 0);
    if (res === 1) expected++;
    await page.click('#reveal');
    await page.waitForSelector('#class-verdict');
    expect((await page.getAttribute('#class-verdict', 'data-res')) === String(res), `class verdict for ${cid} (votes ${v.safe}/${v.scam})`);
    expect((await num('#class-score')) === expected, 'class score after message ' + (i + 1));
    if (i === 0) expect((await page.textContent('#bar-scam')).includes('75'), 'scam bar shows 75%');
    if (i === 4) {
      // a reload of the smartboard browser keeps the class game where it was
      await page.reload();
      await page.waitForSelector('#class-phone');
      expect((await page.getAttribute('#class-phone', 'data-id')) === cid, 'class game resumes on the same message after reload');
      expect(!!(await page.$('#class-verdict')), 'revealed answer survives reload');
      expect((await num('#class-score')) === expected, 'class score survives reload');
      expect((await page.textContent('#panel-class .topbar strong')).includes('5'), 'class progress survives reload');
    }
    if (cid === 'power') {
      sawPower = true;
      expect((await page.$$eval('#class-phone .ph-text bdi', a => a.map(x => x.textContent))).some(x => /^\d{5} X+$/.test(x)), 'phone number inside the text is kept left-to-right');
    }
    await page.click('#class-next');
  }
  await page.waitForSelector('#class-final');
  expect((await page.textContent('#class-final')).replace(/\s/g, '') === expected + '/16', 'class final score ' + expected + '/16');
  expect(sawPower, 'class mode shows every message');

  // --- golden rules ---
  await page.evaluate(() => document.querySelectorAll('.edu-toast').forEach(x => x.remove()));
  await page.click('#tab-rules');
  expect((await page.$$eval('#rules .rule', a => a.length)) === 7, '7 golden rules');
  expect(await page.isVisible('#poster'), 'poster visible');
  log('played', seen.join(','), 'class', expected + '/16');
};
