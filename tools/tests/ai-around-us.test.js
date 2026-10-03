/* Interaction test for "AI or Not? Sorting Game" (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, log }) {
  const answers = await page.evaluate(() => {
    const m = {};
    window.AIAU.items.forEach(function (i) { m[i.id] = i.ai ? 'ai' : 'no'; });
    return m;
  });
  expect(Object.keys(answers).length >= 24, 'at least 24 cards exist, got ' + Object.keys(answers).length);

  /* ---------- Class vote mode ---------- */
  await page.click('#tab-class');
  const firstId = await page.getAttribute('#class-stage', 'data-id');
  expect(!!answers[firstId], 'class stage shows a known card: ' + firstId);
  const right = answers[firstId];
  const wrong = right === 'ai' ? 'no' : 'ai';
  for (let i = 0; i < 3; i++) await page.click('#vote-' + right + '-plus');
  await page.click('#vote-' + wrong + '-plus');
  expect((await page.textContent('#votes-' + right)).trim() === '3', 'majority vote count is 3');
  await page.click('#reveal');
  expect(await page.isVisible('#class-answer'), 'answer is revealed');
  const score1 = (await page.textContent('#class-score')).trim();
  expect(/1\D+1/.test(score1), 'class score shows 1 of 1 after a correct majority, got ' + score1);
  await page.click('#next');
  const secondId = await page.getAttribute('#class-stage', 'data-id');
  expect(secondId && secondId !== firstId, 'next shows a different card');
  expect((await page.textContent('#votes-ai')).trim() === '0', 'votes reset for the next card');

  /* ---------- Play: sort a round with exactly 3 mistakes ---------- */
  await page.click('#tab-play');
  const ids = await page.$$eval('#tray .sort-card', (els) => els.map((e) => e.getAttribute('data-id')));
  expect(ids.length === 10, 'round has 10 cards, got ' + ids.length);
  expect(await page.isDisabled('#check'), 'check is disabled before all cards are sorted');
  let n = 0;
  for (const id of ids) {
    const want = answers[id];
    const bin = n < 3 ? (want === 'ai' ? 'no' : 'ai') : want;   // first 3 wrong on purpose
    await page.click('#tray .sort-card[data-id="' + id + '"]');
    await page.click('#bin-' + bin + '-btn');
    n++;
  }
  const left = await page.$$eval('#tray .sort-card', (els) => els.length);
  expect(left === 0, 'tray is empty after sorting, left ' + left);
  const inBins = await page.$$eval('.bin .chip-card', (els) => els.length);
  expect(inBins === 10, 'all 10 cards are in the bins, got ' + inBins);
  await page.click('#check');
  const score = (await page.textContent('#score-num')).trim();
  expect(score === '7', 'score is 7 of 10 after 3 deliberate mistakes, got ' + score);
  const bad = await page.$$eval('#results .res.bad', (els) => els.length);
  expect(bad === 3, 'three wrong answers are explained, got ' + bad);
  const reasons = await page.$$eval('#results .res p', (els) => els.filter((e) => e.textContent.trim().length > 20).length);
  expect(reasons === 10, 'every card shows a reason, got ' + reasons);
  const stars = await page.$$eval('#results .stars .on', (els) => els.length);
  expect(stars === 2, '7/10 earns 2 stars, got ' + stars);
  const best = await page.textContent('#best');
  expect(best.includes('7'), 'best score badge shows 7: ' + best);

  /* ---------- New round gives a fresh shuffled set ---------- */
  await page.click('#new-round');
  const ids2 = await page.$$eval('#tray .sort-card', (els) => els.map((e) => e.getAttribute('data-id')));
  expect(ids2.length === 10, 'new round has 10 cards');
  const balance = ids2.filter((id) => answers[id] === 'ai').length;
  expect(balance === 5, 'new round has 5 AI and 5 non-AI cards, got ' + balance);

  /* Leave the screen on a checked round for the after-test screenshot. */
  for (const id of ids2) {
    await page.click('#tray .sort-card[data-id="' + id + '"]');
    await page.click('#bin-' + answers[id] + '-btn');
  }
  await page.click('#check');
  expect((await page.textContent('#score-num')).trim() === '10', 'perfect sort scores 10');
  await page.evaluate(() => window.scrollTo(0, 0));
  log && log('ai-around-us test done');
};
