/* Interaction test for the Maths Worksheet Generator (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, log }) {
  const count = (sel) => page.$$eval(sel, (els) => els.length);
  const setSelect = (sel, v) => page.evaluate(([s, val]) => { const e = document.querySelector(s); e.value = val; e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);
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

  // 5. printing after practice: no green/red marks and no typed answers on paper, key on its own page
  await page.emulateMedia({ media: 'print' });
  const pr = await page.evaluate(() => {
    const ok = document.querySelector('#ws-body .q.ok .vn'), inp = document.querySelector('#ws-body .ans');
    return { okColor: getComputedStyle(ok).color, ansColor: getComputedStyle(inp).color, key: getComputedStyle(document.querySelector('#ws-key')).display, keyBreak: getComputedStyle(document.querySelector('#ws-key')).breakBefore };
  });
  await page.emulateMedia({ media: 'screen' });
  expect(pr.okColor === 'rgb(0, 0, 0)', 'a checked (green) question must print in black, got ' + pr.okColor);
  expect(/rgba\(0, 0, 0, 0\)|transparent/.test(pr.ansColor), 'typed answers must be invisible on paper, got ' + pr.ansColor);
  expect(pr.key === 'block' && pr.keyBreak === 'page', 'answer key should print on a new page');

  // 6. answers survive a reload; the worksheet code recreates the same sheet
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForSelector('#ws-body .q');
  const kept = await page.$$eval('#ws-body .ans', (els) => els.filter((e) => e.value).length);
  expect(kept === 10, 'typed answers should be kept after a reload, got ' + kept);
  const seed = await page.inputValue('#opt-seed');
  const firstQ = await page.textContent('#q1 .qb');
  await page.click('#btn-new');
  const seed2 = await page.inputValue('#opt-seed');
  expect(seed2 !== seed, 'New worksheet should change the code');
  expect((await count('#ws-body .q.ok, #ws-body .q.bad')) === 0, 'new sheet starts unmarked');
  await page.fill('#opt-seed', seed);
  await page.dispatchEvent('#opt-seed', 'change');
  expect((await page.textContent('#q1 .qb')) === firstQ, 'same code should give the same questions');
  // a code typed with Indian digits is understood and shown in Latin digits
  await page.fill('#opt-seed', '१२३४५');
  await page.dispatchEvent('#opt-seed', 'change');
  expect((await page.inputValue('#opt-seed')) === '12345' && /12345/.test(await page.textContent('#ws-foot')), 'code १२३४५ should become 12345');

  // 7. fractions topic renders stacked fractions and a fraction answer key
  await page.click('#tp-fadd');
  expect((await count('#ws-body .frac')) >= 20, 'fraction sums should show stacked fractions');
  await page.click('#btn-key');
  expect(await page.isVisible('#ws-key'), 'answer key should be visible after pressing the button');
  expect((await count('#ws-key li')) === 10, 'answer key should list 10 answers');

  // 8. mixed revision sheet with a money word problem section
  await page.check('#opt-mix');
  await page.click('#tp-money');
  expect((await count('#ws-body .ws-sec')) === 2, 'mixed sheet should have 2 sections');
  const words = await page.$$eval('#ws-body .q.word .wp', (els) => els.map((e) => e.textContent));
  expect(words.length === 5 && words.every((w) => w.indexOf('₹') >= 0 && !/\{\w+\}/.test(w)), 'money problems should be filled-in sentences with ₹');
  log('mixed sheet OK: ' + words[0].slice(0, 60));

  // 9. all 19 topics: every topic gets a question (the count goes up to 20; 10 and 15 are disabled)
  const ids = await page.$$eval('#topics [data-topic]', (els) => els.map((e) => e.dataset.topic));
  for (const id of ids) if (!['fadd', 'money'].includes(id)) await page.click('#tp-' + id);
  const secs = await count('#ws-body .ws-sec');
  expect(secs === 19, 'all 19 chosen topics should appear on the sheet, got ' + secs);
  expect((await page.inputValue('#opt-count')) === '20', 'count should rise to 20 for 19 topics');
  expect((await count('#opt-count option:disabled')) === 2, 'counts below 20 should be disabled');

  // 10. hard integers always use negative numbers; hard BODMAS mixes its patterns
  await page.uncheck('#opt-mix');
  await page.click('#tp-int');
  await page.click('.seg[data-opt="diff"] button[data-v="hard"]');
  await setSelect('#opt-count', '20');
  const ints = await page.$$eval('#ws-body .q .expr', (els) => els.map((e) => e.textContent));
  expect(ints.length === 20 && ints.every((s) => s.indexOf('−') >= 0), 'every integer question should contain a negative number');
  await page.click('#tp-bodmas');
  const pats = await page.$$eval('#ws-body .q .expr', (els) => els.map((e) => e.textContent.replace(/[\d\s]+/g, 'n')));
  const distinct = new Set(pats).size;
  expect(distinct >= 6, 'hard BODMAS sheet should mix at least 6 patterns, got ' + distinct);

  // 11. wide answers fit: place value answers of 9-digit numbers get a wide box
  await page.click('#tp-place');
  const narrow = await page.$$eval('#ws-body .q input.ans:not(.wide-in)', (els) => els.filter((e) => e.getBoundingClientRect().width < 100).length);
  expect(narrow === 0, 'place-value answer boxes should be wide enough for crore numbers');

  // 12. columns adapt: 6-digit sums never spill into the next question on a 1024 px screen
  await page.click('#tp-add');
  await setSelect('#opt-digits', '6');
  const vp = page.viewportSize();
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.waitForTimeout(150);
  const spill = await page.$$eval('#ws-body .q', (qs) => qs.filter((q) => {
    const r = q.getBoundingClientRect();
    return Array.from(q.querySelectorAll('.qb *')).some((e) => { const b = e.getBoundingClientRect(); return b.width && (b.right > r.right + 1 || b.left < r.left - 1); });
  }).length);
  await page.setViewportSize(vp);
  expect(spill === 0, spill + ' column sums spill out of their cell at 1024 px');

  // 13. English time problems never print "a.m.." (time at the end of a sentence)
  if (lang === 'en') {
    await page.click('#tp-time');
    const tx = await page.$$eval('#ws-body .q.word .wp', (els) => els.map((e) => e.textContent).join(' '));
    expect(tx.length > 0 && !/[ap]\.m\.\./.test(tx), 'time sentences must not contain "a.m.." or "p.m.."');
  }

  // 14. a broken or crafted share link never crashes the app
  const bad = Buffer.from(JSON.stringify({ topics: 'add', school: { toString: 1 }, count: -4, seed: 1e30 })).toString('base64url');
  const url = page.url().split('#')[0];
  await page.goto('about:blank');
  await page.goto(url + '#w=' + bad);
  await page.waitForSelector('#ws-body .q', { timeout: 10000 });
  expect((await count('#ws-body .q')) >= 10, 'a crafted share link should still show a worksheet');
};
