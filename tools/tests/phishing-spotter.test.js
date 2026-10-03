/* Interaction test for Spot the Scam (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, log }) {
  const answers = await page.evaluate(() => {
    const o = {};
    (window.SPOT_MSGS || []).forEach(m => { o[m.id] = m.scam; });
    return o;
  });
  expect(Object.keys(answers).length === 16, '16 practice messages expected, got ' + Object.keys(answers).length);
  const content = await page.evaluate(() => Object.keys(window.APP_CONTENT || {}).length);
  expect(content === 12, 'content in 12 languages');

  const curId = () => page.getAttribute('#phone', 'data-id');
  const num = async sel => parseInt((await page.textContent(sel)).replace(/[^\d]/g, ''), 10);
  const correctBtn = id => (answers[id] ? '#ans-scam' : '#ans-safe');
  const wrongBtn = id => (answers[id] ? '#ans-safe' : '#ans-scam');

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
  await page.click('#next');

  // Q3..Q8: correct (Q3 via keyboard "1"/"2")
  for (let i = 2; i < 8; i++) {
    id = await curId();
    expect(!seen.includes(id), 'no repeated message in one game');
    seen.push(id);
    if (i === 2) await page.keyboard.press(answers[id] ? '2' : '1');
    else await page.click(correctBtn(id));
    await page.waitForSelector('#next');
    await page.click('#next');
  }
  await page.waitForSelector('#play-results:not([hidden]) #final-score');
  const final = (await page.textContent('#final-score')).trim();
  expect(final.startsWith('7'), 'final score should be 7/8, got ' + final);
  expect((await page.$$eval('#review .review-row', a => a.length)) === 8, '8 review rows');
  expect((await page.$$eval('#review .review-row.badr', a => a.length)) === 1, 'exactly 1 wrong answer in review');
  const safeCount = seen.filter(x => !answers[x]).length;
  expect(safeCount >= 2, 'a game mixes in genuine messages (got ' + safeCount + ')');

  // --- persistence ---
  await page.reload();
  await page.waitForSelector('#best-score');
  const best = (await page.textContent('#best-score')).trim();
  expect(best.startsWith('7'), 'best score survives reload, got ' + best);
  expect((await num('#played')) === 1, 'games played = 1');

  // --- class mode ---
  await page.click('#tab-class');
  await page.click('#class-start');
  await page.waitForSelector('#class-phone');
  const cid = await page.getAttribute('#class-phone', 'data-id');
  for (let i = 0; i < 3; i++) await page.click('#v-scam-plus');
  await page.click('#v-safe-plus');
  expect((await page.inputValue('#v-scam')) === '3', 'scam votes = 3');
  expect((await page.inputValue('#v-safe')) === '1', 'safe votes = 1');
  await page.click('#reveal');
  await page.waitForSelector('#class-verdict');
  expect((await page.textContent('#bar-scam')).includes('75'), 'scam bar shows 75%');
  const res = await page.getAttribute('#class-verdict', 'data-res');
  expect(res === (answers[cid] ? '1' : '0'), 'class majority judged correctly (res=' + res + ')');
  expect((await num('#class-score')) === (answers[cid] ? 1 : 0), 'class score updated');

  // --- golden rules ---
  await page.click('#tab-rules');
  expect((await page.$$eval('#rules .rule', a => a.length)) === 7, '7 golden rules');
  expect(await page.isVisible('#poster'), 'poster visible');
  log('played', seen.join(','));
};
