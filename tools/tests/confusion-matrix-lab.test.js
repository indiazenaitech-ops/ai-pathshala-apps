/* Interaction test for "Is My AI Good? (Evaluation)" (confusion-matrix-lab).
   Run by tools/verify.js in en and hi with an empty localStorage. */
module.exports = async function ({ page, expect, t, log }) {
  await page.waitForSelector('#strip-svg circle.dot', { timeout: 15000 });

  const setThr = async (v) => {
    await page.$eval('#thr', (el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }, String(v));
    await page.waitForTimeout(120);
  };
  const cells = () => page.evaluate(() => {
    const g = (k) => Number(document.querySelector('#cm-' + k).dataset.n);
    return { tp: g('tp'), fp: g('fp'), fn: g('fn'), tn: g('tn') };
  });
  const pct = (x) => Math.round(x * 100 + 1e-9) + '%';

  // 1) default threshold 0.50: 40 dots, matrix adds up, dot colours agree with the matrix, metrics are right
  const nDots = await page.$$eval('#strip-svg circle.dot', (a) => a.length);
  expect(nDots === 40, 'strip should show 40 dots, got ' + nDots);
  let m = await cells();
  log('default matrix', JSON.stringify(m));
  expect(m.tp + m.fp + m.fn + m.tn === 40, 'matrix cells should add up to 40, got ' + JSON.stringify(m));
  expect(m.tp > 0 && m.fp > 0 && m.fn > 0 && m.tn > 0, 'default data set should fill all four cells');
  const tpDots = await page.$$eval('#strip-svg circle.dot.k-tp', (a) => a.length);
  const fnDots = await page.$$eval('#strip-svg circle.dot.k-fn', (a) => a.length);
  expect(tpDots === m.tp && fnDots === m.fn, 'dot colours should match TP/FN counts');
  const precTxt = (await page.textContent('#val-precision')).trim();
  expect(precTxt === pct(m.tp / (m.tp + m.fp)), 'precision shown ' + precTxt + ' expected ' + pct(m.tp / (m.tp + m.fp)));
  const accTxt = (await page.textContent('#val-accuracy')).trim();
  expect(accTxt === pct((m.tp + m.tn) / 40), 'accuracy shown ' + accTxt);
  const f1 = Number(await page.getAttribute('#val-f1', 'data-val'));
  const P = m.tp / (m.tp + m.fp), R = m.tp / (m.tp + m.fn);
  expect(Math.abs(f1 - 2 * P * R / (P + R)) < 1e-9, 'F1 should equal 2PR/(P+R)');

  // 2) threshold 1.00: AI says "No" to everything → TP = FP = 0, precision not defined, warning shown
  await setThr(1);
  m = await cells();
  expect(m.tp === 0 && m.fp === 0 && m.fn + m.tn === 40, 'threshold 1 should predict No for all, got ' + JSON.stringify(m));
  expect((await page.getAttribute('#val-precision', 'data-val')) === '', 'precision should be undefined (0/0) at threshold 1');
  expect((await page.getAttribute('#insight', 'class')).includes('warning'), 'accuracy-paradox warning should show');

  // 3) threshold 0: AI says "Yes" to everything → recall 100%
  await setThr(0);
  m = await cells();
  expect(m.fn === 0 && m.tn === 0, 'threshold 0 should predict Yes for all');
  expect((await page.textContent('#val-recall')).trim() === '100%', 'recall should be 100% at threshold 0');

  // 4) the + button steps the threshold by 0.05 and the value is saved across a reload
  await page.click('#thr-up');
  await page.waitForTimeout(100);
  expect((await page.textContent('#thr-val')).trim() === '0.05', 'threshold should be 0.05 after +');
  await setThr(0.3);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#strip-svg circle.dot');
  expect((await page.textContent('#thr-val')).trim() === '0.30', 'threshold should persist after reload');

  // 5) tapping a dot explains it; switching to the TB test highlights Recall as most important
  await page.click('#strip-svg circle.dot');
  await page.waitForTimeout(100);
  expect(await page.$('#dot-info .res-badge'), 'tapping a dot should show its result badge');
  await page.click('#scen-disease');
  await page.waitForTimeout(100);
  expect(await page.$('#card-recall .focus-badge'), 'disease test should mark Recall as most important');
  expect(!(await page.$('#card-precision .focus-badge')), 'precision should not be marked for the disease test');

  // 6) Practice: compute precision correctly, then answer wrongly
  await page.click('#tab-practice');
  await page.click('#mode-precision');
  await page.waitForSelector('#q-input');
  const q = await page.evaluate(() => {
    const g = (k) => Number(document.querySelector('#q-' + k).dataset.n);
    return { tp: g('tp'), fp: g('fp'), fn: g('fn'), tn: g('tn') };
  });
  const ans = (q.tp / (q.tp + q.fp)).toFixed(2);
  await page.fill('#q-input', ans);
  await page.click('#q-check');
  await page.waitForTimeout(100);
  expect(await page.$('#fb-right'), 'correct precision ' + ans + ' should be accepted');
  expect((await page.textContent('#score-line')).includes('1 / 1'), 'score should be 1 / 1');
  await page.click('#q-next');
  await page.waitForSelector('#q-input');
  await page.fill('#q-input', '7%');   // 0.07 is never a right answer here (tp >= 3, fp <= 15)
  await page.click('#q-check');
  await page.waitForTimeout(100);
  expect(await page.$('#fb-wrong'), 'wrong answer should be marked wrong');
  expect((await page.textContent('#score-line')).includes('1 / 2'), 'score should be 1 / 2');

  // 7) Practice: "Which box?" question
  await page.click('#mode-cell');
  await page.waitForSelector('#pick-tp');
  const d = await page.evaluate(() => ({ pred: document.querySelector('#q-card').dataset.pred, real: document.querySelector('#q-card').dataset.real }));
  const want = d.pred === 'yes' ? (d.real === 'yes' ? 'tp' : 'fp') : (d.real === 'yes' ? 'fn' : 'tn');
  await page.click('#pick-' + want);
  await page.waitForTimeout(100);
  expect(await page.$('#fb-right'), 'picking ' + want + ' should be right');
  expect((await page.textContent('#score-line')).includes('2 / 3'), 'score should be 2 / 3');
};
