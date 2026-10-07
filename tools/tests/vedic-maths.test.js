/* Interaction test for Vedic Maths (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const nums = (sel) => page.$$eval(sel + ' .vm-n', (els) => els.map((e) => e.textContent.trim()));

  await page.waitForSelector('#picker .vm-pick');
  expect((await page.$$('#picker .vm-pick')).length === 10, '10 tricks in the picker');

  /* 1. Nikhilam opener: 97 × 96 = 9312 with the steps shown */
  await page.click('#picker [data-trick="nikhilam"]');
  expect(await page.getAttribute('#picker [data-trick="nikhilam"]', 'aria-pressed') === 'true', 'Nikhilam is selected');
  await page.click('#show-all');
  await page.waitForFunction(() => document.querySelector('#ex-ans').textContent.trim() === '9312', null, { timeout: 5000 });
  const q = await nums('#ex-q');
  expect(q.join(',') === '97,96', 'example question is 97 × 96, got ' + q);
  const stepCount = (await page.$$('#ex-steps li')).length;
  expect(stepCount >= 5, 'Nikhilam shows at least 5 steps, got ' + stepCount);
  const allSteps = (await page.$$eval('#ex-steps li .vm-n', (els) => els.map((e) => e.textContent.trim())));
  expect(allSteps.includes('− 3') && allSteps.includes('− 4'), 'steps show the differences −3 and −4, got ' + allSteps.join('|'));
  expect(allSteps.includes('93') && allSteps.includes('12'), 'steps show left part 93 and right part 12');

  /* 2. own numbers: 103² and a wide gap (70 × 130 borrows from the left) */
  await page.fill('#own-a', '103'); await page.fill('#own-b', '103');
  await page.click('#own-go');
  await page.click('#show-all');
  await page.waitForFunction(() => document.querySelector('#ex-ans').textContent.trim() === '10609', null, { timeout: 5000 });
  const s103 = await page.$$eval('#ex-steps li .vm-n', (els) => els.map((e) => e.textContent.trim()));
  expect(s103.includes('106') && s103.includes('09'), '103² → 106 | 09, got ' + s103.join('|'));
  await page.fill('#own-a', '70'); await page.fill('#own-b', '130');
  await page.click('#own-go'); await page.click('#show-all');
  await page.waitForFunction(() => document.querySelector('#ex-ans').textContent.trim() === '9100', null, { timeout: 5000 });
  await page.fill('#own-a', '55'); await page.fill('#own-b', '930');
  await page.click('#own-go');
  expect((await txt('#own-msg')).length > 5, 'numbers far apart get a friendly message');

  /* 3. Try yourself: a right answer is counted */
  await page.click('#tabs [data-tab="try"]');
  const tq = (await nums('#try-q')).map(Number);
  await page.fill('#try-a', String(tq[0] * tq[1]));
  await page.press('#try-a', 'Enter');
  expect(await page.getAttribute('#try-fb', 'class') === 'vm-fb ok', 'right answer marked correct for ' + tq.join(' × '));
  expect((await page.$$('#try-steps li')).length >= 5, 'steps appear after answering');

  /* 4. 5-question timed drill: 4 right + 1 wrong = 4 / 5 */
  await page.click('#tabs [data-tab="drill"]');
  await page.click('#drill-n [data-n="5"]');
  await page.click('#drill-start');
  for (let i = 0; i < 5; i++) {
    await page.waitForFunction((n) => document.querySelector('#drill-count').textContent.includes(String(n)), i + 1);
    const d = (await nums('#drill-q')).map(Number);
    const ans = d[0] * d[1] + (i === 4 ? 1 : 0);
    await page.fill('#drill-a', String(ans));
    await page.press('#drill-a', 'Enter');
  }
  await page.waitForSelector('#drill-done:not([hidden])');
  expect(await page.getAttribute('#drill-score', 'data-right') === '4', 'drill scored 4 / 5, got ' + await page.getAttribute('#drill-score', 'data-right'));
  expect((await page.$$('#drill-review tr')).length === 5, 'review table has 5 rows');
  expect((await page.$$('#drill-review tr.bad')).length === 1, 'exactly one wrong row');

  /* 5. perfect drill sets a best time; division by 9 uses quotient + remainder */
  await page.click('#picker [data-trick="div9"]');
  await page.click('#tabs [data-tab="drill"]');
  await page.click('#drill-start');
  for (let i = 0; i < 5; i++) {
    await page.waitForFunction((n) => document.querySelector('#drill-count').textContent.includes(String(n)), i + 1);
    const n = Number((await nums('#drill-q'))[0]);
    await page.fill('#drill-a', String(Math.floor(n / 9)));
    await page.fill('#drill-r', String(n % 9));
    await page.click('#drill-ok');
  }
  await page.waitForSelector('#drill-done:not([hidden])');
  expect(await page.getAttribute('#drill-score', 'data-right') === '5', 'div9 drill 5 / 5');
  await page.click('#drill-back');
  expect(/\d/.test(await txt('#drill-best')), 'best time shown after a perfect drill: ' + await txt('#drill-best'));

  /* 6. worksheet: 20 problems + 20 answers, answers are right */
  await page.click('#tabs [data-tab="worksheet"]');
  await page.selectOption('#ws-trick', 'cross');
  expect((await page.$$('#ws-list li')).length === 20, 'worksheet has 20 problems');
  const qs = await page.$$eval('#ws-list li bdi', (e) => e.map((x) => x.textContent));
  const keys = await page.$$eval('#ws-key li', (e) => e.map((x) => x.textContent.trim()));
  expect(keys.length === 20, 'answer key has 20 answers');
  const okAll = qs.every((s, i) => { const m = s.match(/(\d+) × (\d+)/); return m && Number(keys[i]) === Number(m[1]) * Number(m[2]); });
  expect(okAll, 'every worksheet answer equals a × b');
  await page.selectOption('#ws-trick', 'mixed');
  expect((await page.$$('#ws-list li')).length === 20, 'mixed worksheet also has 20 problems');

  /* 7. progress is saved */
  await page.click('#tabs [data-tab="progress"]');
  expect((await page.$$('#prog-body tr')).length === 2, 'progress lists the 2 practised tricks');
  log('vedic-maths ok');
};
