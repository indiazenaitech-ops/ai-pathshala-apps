/* Interaction test for next-word-predictor, run by tools/verify.js in en and hi. */
module.exports = async function ({ page, expect, t }) {
  const num = async (sel) => parseInt(String(await page.textContent(sel)).replace(/[^\d]/g, ''), 10);

  // 1) The sample story is trained on load and gives guesses.
  const vocab0 = await num('#stat-vocab');
  expect(vocab0 > 40, 'sample story vocabulary should be > 40, got ' + vocab0);
  const nCands0 = await page.$$eval('#cands .cand', els => els.length);
  expect(nCands0 >= 1, 'sample story should give at least one guess, got ' + nCands0);

  // 2) Train on our own tiny text with known counts.
  await page.fill('#train-text', 'ram eats mango . sita eats rice . ram eats mango .');
  await page.click('#train-btn');
  await page.click('#n-1');
  const pressed = await page.getAttribute('#src-custom', 'aria-pressed');
  expect(pressed === 'true', 'editing the text switches the source to "our own text"');
  expect(await num('#stat-words') === 9, 'words read should be 9, got ' + await page.textContent('#stat-words'));
  expect(await num('#stat-vocab') === 5, 'vocabulary should be 5 (ram eats mango sita rice), got ' + await page.textContent('#stat-vocab'));
  expect(await num('#stat-ngrams') === 8, '8 distinct 2-word patterns expected, got ' + await page.textContent('#stat-ngrams'));

  // 3) Next-word guesses: after "eats" -> mango 2 of 3 times (67%), rice 1 of 3 (33%).
  await page.fill('#start-input', 'sita eats');
  await page.waitForTimeout(150);
  const w0 = (await page.textContent('#cands .cand:nth-child(1) .cand-w')).trim();
  const p0 = (await page.textContent('#cands .cand:nth-child(1) .cand-pct')).trim();
  const w1 = (await page.textContent('#cands .cand:nth-child(2) .cand-w')).trim();
  expect(w0 === 'mango', 'top guess after "eats" should be mango, got ' + w0);
  expect(p0.includes('67'), 'mango should be 67%, got ' + p0);
  expect(w1 === 'rice', 'second guess should be rice, got ' + w1);

  // 4) Auto-write with temperature 0 (always top word), 5 words: "mango . ram eats mango . ram"
  await page.$eval('#temp', el => { el.value = '0'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('#len', el => { el.value = '5'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('#write-btn');
  const gen = await page.$$eval('#output .w-gen:not(.w-end)', els => els.map(e => e.textContent.trim()));
  expect(gen.length === 5, 'auto-write should add 5 words, got ' + gen.length);
  expect(gen.join(' ') === 'mango Ram eats mango Ram', 'greedy output should be "mango Ram eats mango Ram", got ' + gen.join(' '));
  const outText = (await page.textContent('#output')).replace(/\s+/g, ' ').trim();
  expect(outText === 'Sita eats mango. Ram eats mango. Ram', 'output text should read "Sita eats mango. Ram eats mango. Ram", got "' + outText + '"');
  const pFirst = await page.getAttribute('#output .w-gen', 'data-p');
  expect(Math.abs(parseFloat(pFirst) - 2 / 3) < 0.001, 'first generated word probability should be 2/3, got ' + pFirst);
  // "sita eats mango ." never appears in the text: the model invented it (1 of 2 judged sentences).
  const sumNew = await page.getAttribute('#sent-summary', 'data-new');
  const sumJudged = await page.getAttribute('#sent-summary', 'data-judged');
  expect(sumNew === '1' && sumJudged === '2', 'expected 1 of 2 sentences invented, got ' + sumNew + '/' + sumJudged);
  const sumText = (await page.textContent('#sent-summary')).trim();
  expect(sumText === t('sum_new', { a: '1', b: '2' }), 'summary text should be translated: ' + sumText);
  expect(await page.$$eval('#output .sent-new', els => els.length) === 1, 'one sentence should be marked as invented');

  // 5) Clicking a guess appends it to the sentence.
  await page.click('#cands .cand:nth-child(1)');
  const startVal = await page.inputValue('#start-input');
  expect(startVal === 'sita eats mango', 'clicking a guess appends it, got "' + startVal + '"');
  const w0b = (await page.textContent('#cands .cand:nth-child(1) .cand-w')).trim();
  expect(w0b === '.', 'after "mango" the model expects the end of the sentence, got ' + w0b);

  // 6) Settings and our own text survive a reload.
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(800);
  const taVal = await page.inputValue('#train-text');
  expect(taVal === 'ram eats mango . sita eats rice . ram eats mango .', 'own text should persist, got ' + taVal);
  expect(await page.getAttribute('#n-1', 'aria-pressed') === 'true', 'memory = 1 should persist');
  expect(await num('#stat-vocab') === 5, 'model retrained from saved text after reload');
  expect(await page.inputValue('#start-input') === 'sita eats mango', 'start text should persist');
};
