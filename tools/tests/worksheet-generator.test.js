/* Interaction test for the Maths Worksheet Generator (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, log }) {
  const count = (sel) => page.$$eval(sel, (els) => els.length);
  await page.waitForSelector('#ws-body .q', { timeout: 15000 });

  // 1. default sheet: 20 addition sums written in columns
  let n = await count('#ws-body .q');
  expect(n === 20, 'default sheet should have 20 questions, got ' + n);
  expect((await count('#ws-body .vsum')) === 20, 'addition sums should be in column (vertical) form');

  // 2. number of questions changes the sheet
  await page.selectOption('#opt-count', '10');
  n = await count('#ws-body .q');
  expect(n === 10, 'after choosing 10, sheet should have 10 questions, got ' + n);
  expect((await page.textContent('#ws-total')).trim() === '10', 'header total marks should be 10');

  // 3. type every correct answer and check: full marks
  const total = await page.evaluate(() => window.WSG.count());
  for (let i = 0; i < total; i++) {
    const vals = await page.evaluate((k) => window.WSG.plain(k), i);
    for (let j = 0; j < vals.length; j++) await page.fill(`.ans[data-q="${i}"][data-j="${j}"]`, vals[j]);
  }
  await page.click('#btn-check');
  expect((await count('#ws-body .q.ok')) === 10, 'all 10 answers should be marked correct');
  let score = (await page.textContent('#score-num')).replace(/\s/g, '');
  expect(score === '10/10', 'score should be 10/10, got ' + score);

  // 4. one wrong answer is caught
  const v0 = (await page.evaluate(() => window.WSG.plain(0)))[0];
  await page.fill('.ans[data-q="0"][data-j="0"]', String(Number(v0) + 1));
  await page.click('#btn-check');
  expect((await count('#ws-body .q.bad')) === 1, 'exactly one answer should be marked wrong');
  score = (await page.textContent('#score-num')).replace(/\s/g, '');
  expect(score === '9/10', 'score should be 9/10, got ' + score);

  // 5. the worksheet code recreates the same sheet
  const seed = await page.inputValue('#opt-seed');
  const firstQ = await page.textContent('#q1 .qb');
  await page.click('#btn-new');
  const seed2 = await page.inputValue('#opt-seed');
  expect(seed2 !== seed, 'New worksheet should change the code');
  expect((await count('#ws-body .q.ok, #ws-body .q.bad')) === 0, 'new sheet starts unmarked');
  await page.fill('#opt-seed', seed);
  await page.dispatchEvent('#opt-seed', 'change');
  expect((await page.textContent('#q1 .qb')) === firstQ, 'same code should give the same questions');

  // 6. fractions topic renders stacked fractions and a fraction answer key
  await page.click('#tp-fadd');
  expect((await count('#ws-body .frac')) >= 20, 'fraction sums should show stacked fractions');
  await page.click('#btn-key');
  expect(await page.isVisible('#ws-key'), 'answer key should be visible after pressing the button');
  expect((await count('#ws-key li')) === 10, 'answer key should list 10 answers');

  // 7. mixed revision sheet with a money word problem section
  await page.check('#opt-mix');
  await page.click('#tp-money');
  expect((await count('#ws-body .ws-sec')) === 2, 'mixed sheet should have 2 sections');
  const words = await page.$$eval('#ws-body .q.word .wp', (els) => els.map((e) => e.textContent));
  expect(words.length === 5 && words.every((w) => w.indexOf('₹') >= 0 && !/\{\w+\}/.test(w)), 'money problems should be filled-in sentences with ₹');
  log('mixed sheet OK: ' + words[0].slice(0, 60));
};
