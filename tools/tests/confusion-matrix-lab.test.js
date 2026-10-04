/* Interaction test for "Is My AI Good? (Evaluation)" (confusion-matrix-lab).
   Run by tools/verify.js in en and hi with an empty localStorage. */
module.exports = async function ({ page, lang, expect, t, log }) {
  await page.waitForSelector('#strip-svg circle.dot', { timeout: 15000 });

  const setThr = async (v) => {
    await page.$eval('#thr', (el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }, String(v));
    await page.waitForTimeout(120);
  };
  const cells = (prefix = '#cm-') => page.evaluate((p) => {
    const g = (k) => Number(document.querySelector(p + k).dataset.n);
    return { tp: g('tp'), fp: g('fp'), fn: g('fn'), tn: g('tn') };
  }, prefix);
  const pct = (x) => Math.round(x * 100 + 1e-9) + '%';
  const score = async () => (await page.textContent('#score-line')).trim();

  // 1) default threshold 0.50: 40 dots, matrix adds up, dot colours agree with the matrix, metrics are right
  const nDots = await page.$$eval('#strip-svg circle.dot', (a) => a.length);
  expect(nDots === 40, 'strip should show 40 dots, got ' + nDots);
  let m = await cells();
  log('default matrix', JSON.stringify(m));
  expect(m.tp + m.fp + m.fn + m.tn === 40, 'matrix cells should add up to 40, got ' + JSON.stringify(m));
  expect(m.tp > 0 && m.fp > 0 && m.fn > 0 && m.tn > 0, 'default data set should fill all four cells');
  const dotCount = (k) => page.$$eval('#strip-svg circle.dot.k-' + k, (a) => a.length);
  expect((await dotCount('tp')) === m.tp && (await dotCount('fn')) === m.fn && (await dotCount('fp')) === m.fp && (await dotCount('tn')) === m.tn,
    'dot colours should match all four matrix counts');
  const precTxt = (await page.textContent('#val-precision')).trim();
  expect(precTxt === pct(m.tp / (m.tp + m.fp)), 'precision shown ' + precTxt + ' expected ' + pct(m.tp / (m.tp + m.fp)));
  const accTxt = (await page.textContent('#val-accuracy')).trim();
  expect(accTxt === pct((m.tp + m.tn) / 40), 'accuracy shown ' + accTxt);
  const f1 = Number(await page.getAttribute('#val-f1', 'data-val'));
  const P = m.tp / (m.tp + m.fp), R = m.tp / (m.tp + m.fn);
  expect(Math.abs(f1 - 2 * P * R / (P + R)) < 1e-9, 'F1 should equal 2PR/(P+R)');
  // the numbers are plugged into the formula: "= 13 / (13 + 4) = 13 / 17 = 0.76"
  const plug = (await page.textContent('#card-precision .plug')).replace(/\s+/g, ' ');
  expect(plug.includes(`${m.tp} / (${m.tp} + ${m.fp}) = ${m.tp} / ${m.tp + m.fp} = ${(Math.round(P * 100 + 1e-9) / 100).toFixed(2)}`), 'precision plug-in line wrong: ' + plug);

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

  // 4) "Best F1" really finds the highest F1 over every threshold 0.00 … 1.00
  await page.click('#best-f1');
  await page.waitForTimeout(120);
  const bestF1 = Number(await page.getAttribute('#val-f1', 'data-val'));
  const scanMax = await page.evaluate(() => {
    const s = document.querySelector('#thr'); let mx = -1;
    for (let i = 0; i <= 100; i++) {
      s.value = String(i / 100); s.dispatchEvent(new Event('input', { bubbles: true }));
      const v = Number(document.querySelector('#val-f1').dataset.val || 0); if (v > mx) mx = v;
    }
    return mx;
  });
  expect(Math.abs(bestF1 - scanMax) < 1e-9, 'Best F1 gave ' + bestF1 + ' but the best possible is ' + scanMax);

  // 5) the + button steps the threshold by 0.05 and the value is saved across a reload
  await setThr(0);
  await page.click('#thr-up');
  await page.waitForTimeout(100);
  expect((await page.textContent('#thr-val')).trim() === '0.05', 'threshold should be 0.05 after +');
  await setThr(0.3);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#strip-svg circle.dot');
  expect((await page.textContent('#thr-val')).trim() === '0.30', 'threshold should persist after reload');

  // 6) "New test data" gives a different, still complete data set of 40 items
  const xs = () => page.$$eval('#strip-svg circle.dot', (a) => a.map((c) => c.getAttribute('cx')).join(','));
  const before = await xs();
  await page.click('#new-data');
  await page.waitForTimeout(120);
  const after = await xs();
  m = await cells();
  expect(after !== before && after.split(',').length === 40, 'new test data should change the dots and keep 40');
  expect(m.tp + m.fp + m.fn + m.tn === 40, 'matrix should still add up to 40 after new data');

  // 7) tapping a dot explains it; switching to the TB test highlights Recall as most important
  await page.click('#strip-svg circle.dot');
  await page.waitForTimeout(100);
  expect(await page.$('#dot-info .res-badge'), 'tapping a dot should show its result badge');
  await page.click('#scen-disease');
  await page.waitForTimeout(100);
  expect(await page.$('#card-recall .focus-badge'), 'disease test should mark Recall as most important');
  expect(!(await page.$('#card-precision .focus-badge')), 'precision should not be marked for the disease test');

  // 8) Practice: compute precision correctly, then answer wrongly
  await page.click('#tab-practice');
  await page.click('#mode-precision');
  await page.waitForSelector('#q-input');
  let q = await cells('#q-');
  const ans = (q.tp / (q.tp + q.fp)).toFixed(2);
  await page.fill('#q-input', ans);
  await page.click('#q-check');
  await page.waitForTimeout(100);
  expect(await page.$('#fb-right'), 'correct precision ' + ans + ' should be accepted');
  expect((await score()).includes('1 / 1'), 'score should be 1 / 1');
  await page.click('#q-next');
  await page.waitForSelector('#q-input');
  await page.fill('#q-input', '7%');   // 0.07 is never a right answer here (tp >= 3, fp <= 15)
  await page.click('#q-check');
  await page.waitForTimeout(100);
  expect(await page.$('#fb-wrong'), 'wrong answer should be marked wrong');
  expect((await score()).includes('1 / 2'), 'score should be 1 / 2');
  // the same wrong answer checked again (double tap) is not a second attempt
  await page.click('#q-check');
  await page.click('#q-check');
  await page.waitForTimeout(100);
  expect((await score()).includes('1 / 2'), 'rechecking the same wrong answer should not count again, got ' + (await score()));
  // a negative number is judged (wrong), not reported as "not a number"
  await page.fill('#q-input', '-0.5');
  await page.click('#q-check');
  await page.waitForTimeout(100);
  expect(await page.$('#fb-wrong'), 'a negative answer should be marked wrong');
  expect((await score()).includes('1 / 3'), 'score should be 1 / 3 after the negative answer');

  // 9) a half-typed answer survives a language switch and a reload; the question stays the same
  q = await cells('#q-');
  await page.fill('#q-input', '0.4');
  const qText = await page.textContent('#q-text');
  await page.selectOption('#edu-lang', lang === 'en' ? 'ta' : 'en');
  await page.waitForTimeout(150);
  expect((await page.inputValue('#q-input')) === '0.4', 'typed answer should survive a language switch');
  expect((await page.textContent('#q-text')) !== qText, 'question text should re-render in the new language');
  await page.selectOption('#edu-lang', lang);
  await page.waitForTimeout(150);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#q-input');
  expect(await page.$eval('#tab-practice', (b) => b.getAttribute('aria-selected') === 'true'), 'Practice tab should stay open after reload');
  expect(JSON.stringify(await cells('#q-')) === JSON.stringify(q), 'the same question should come back after reload');
  expect((await page.inputValue('#q-input')) === '0.4', 'typed answer should survive a reload');
  expect((await score()).includes('1 / 3'), 'score should survive a reload');

  // 10) Practice: "Which box?" questions, right and wrong
  const target = async () => {
    const d = await page.evaluate(() => ({ pred: document.querySelector('#q-card').dataset.pred, real: document.querySelector('#q-card').dataset.real }));
    return d.pred === 'yes' ? (d.real === 'yes' ? 'tp' : 'fp') : (d.real === 'yes' ? 'fn' : 'tn');
  };
  await page.click('#mode-cell');
  await page.waitForSelector('#pick-tp');
  let want = await target();
  await page.click('#pick-' + want);
  await page.waitForTimeout(100);
  expect(await page.$('#fb-right'), 'picking ' + want + ' should be right');
  expect((await score()).includes('2 / 4'), 'score should be 2 / 4');
  await page.click('#q-next');
  want = await target();
  const wrongPick = ['tp', 'fp', 'fn', 'tn'].find((k) => k !== want);
  await page.click('#pick-' + wrongPick);
  await page.waitForTimeout(100);
  expect(await page.$('#fb-wrong'), 'picking the wrong box should be marked wrong');
  expect(await page.$eval('#pick-' + wrongPick, (b) => b.classList.contains('is-picked') && b.disabled), 'the wrong pick should be marked');
  expect(await page.$eval('#pick-' + want, (b) => b.classList.contains('is-right')), 'the right box should be shown');

  // 11) printable worksheet: 6 models + answer key whose values match the matrices
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click('#ws-print');
  await page.waitForTimeout(500);
  expect((await page.evaluate(() => window.__printed)) === 1, 'Print worksheet should open the print dialog');
  expect((await page.$$('#worksheet .ws-q')).length === 6, 'worksheet should have 6 models');
  const ws = await page.evaluate(() => {
    const t1 = document.querySelector('#worksheet .ws-q table');
    const g = (k) => Number(t1.querySelector('td.k-' + k).dataset.n);
    const keyRow = document.querySelectorAll('#worksheet .ws-key tbody tr');
    return { m: { tp: g('tp'), fp: g('fp'), fn: g('fn'), tn: g('tn') }, rows: keyRow.length, acc: keyRow[0].children[1].textContent };
  });
  const wa = (ws.m.tp + ws.m.tn) / (ws.m.tp + ws.m.fp + ws.m.fn + ws.m.tn);
  expect(ws.rows === 6 && ws.acc.startsWith((Math.round(wa * 100 + 1e-9) / 100).toFixed(2)), 'answer key accuracy ' + ws.acc + ' should be ' + wa.toFixed(2));
  expect(await page.evaluate(() => document.body.classList.contains('ws-mode')), 'worksheet print mode should stay on until printing ends');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  expect(!(await page.evaluate(() => document.body.classList.contains('ws-mode'))), 'worksheet print mode should end after printing');

  // 12) Reset clears the score and the threshold (confirm dialogs are auto-accepted)
  await page.click('#tab-explore');
  await page.click('#reset-all');
  await page.waitForTimeout(150);
  expect((await page.textContent('#thr-val')).trim() === '0.50', 'reset should bring the threshold back to 0.50');
  expect(await page.$eval('#scen-spam', (b) => b.getAttribute('aria-pressed') === 'true'), 'reset should select the spam filter again');
  await page.click('#tab-practice');
  expect((await score()).includes('0 / 0'), 'reset should clear the score');
};
