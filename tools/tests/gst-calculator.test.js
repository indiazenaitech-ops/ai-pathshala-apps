/* Interaction test for GST Calculator & GSTIN Checker (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, t }) {
  const paise = async (sel) => page.$eval(sel, el => {
    const b = el.matches('[data-paise]') ? el : el.querySelector('[data-paise]');
    return b ? b.getAttribute('data-paise') : null;
  }).catch(() => null);

  /* ---- 1. calculator: 1000 + 18% = 1180 (CGST 90 + SGST 90) ---- */
  await page.click('#tab-calc');
  await page.click('#mode [data-mode="add"]');
  await page.click('#calc-rates [data-rate="18"]');
  await page.click('#supply [data-supply="intra"]');
  await page.fill('#amt', '1000');
  expect(await paise('#res-big') === '118000', '1000 + 18% should total 1180, got paise ' + await paise('#res-big'));
  expect(await paise('#r-cgst') === '9000', 'CGST should be 90, got ' + await paise('#r-cgst'));
  expect(await paise('#r-sgst') === '9000', 'SGST should be 90, got ' + await paise('#r-sgst'));
  const words = await page.textContent('.gc-words p[lang="en"]');
  expect(/One Thousand One Hundred Eighty/.test(words), 'amount in words for 1180: ' + words);

  /* IGST for another state */
  await page.click('#supply [data-supply="inter"]');
  expect(await paise('#r-igst') === '18000', 'IGST should be 180');
  expect(!(await page.$('#r-cgst')), 'CGST row hidden for IGST');
  await page.click('#supply [data-supply="intra"]');

  /* ---- 2. remove 18% from 1180 = 1000 ---- */
  await page.click('#mode [data-mode="remove"]');
  await page.fill('#amt', '1180');
  expect(await paise('#res-big') === '100000', 'removing 18% from 1180 should give 1000, got ' + await paise('#res-big'));
  expect(await paise('#r-gst') === '18000', 'GST inside 1180 should be 180');

  /* Indian commas and ₹ sign */
  await page.fill('#amt', '₹1,18,000');
  expect(await paise('#r-taxable') === '10000000', '1,18,000 incl. 18% → 1,00,000 base');

  /* odd paise: CGST and SGST stay equal (same half rate on the same taxable value) and add back to the typed amount.
     ₹100 incl. 18% → 84.74 + 7.63 + 7.63 = 100.00, and 84.74 × 9% = 7.6266 → 7.63, so the bill checks forward too. */
  await page.fill('#amt', '100');
  expect(await paise('#r-cgst') === '763' && await paise('#r-sgst') === '763', 'remove 18% from 100: CGST = SGST = 7.63, got ' + await paise('#r-cgst') + '/' + await paise('#r-sgst'));
  expect(await paise('#r-taxable') === '8474' && await paise('#r-total') === '10000', 'remove 18% from 100: taxable 84.74, total 100.00');
  await page.click('#supply [data-supply="inter"]');
  expect(await paise('#r-taxable') === '8475' && await paise('#r-igst') === '1525', 'remove 18% IGST from 100: 84.75 + 15.25');
  await page.click('#supply [data-supply="intra"]');
  /* words follow the total amount and are labelled that way */
  expect((await page.textContent('.gc-words .lbl')).trim() === t('words_total'), 'calculator words labelled as total amount');
  if (lang === 'hi') expect((await page.textContent('.gc-words p[lang="hi"]')).trim() === 'एक सौ रुपये मात्र', 'Hindi words for 100');
  await page.fill('#amt', '₹1,18,000');

  /* history: Enter saves */
  await page.press('#amt', 'Enter');
  const histCount = await page.$$eval('#hist-list li', l => l.length);
  expect(histCount >= 1, 'Enter should save the calculation to history');

  /* bad input never crashes */
  await page.fill('#amt', '-50');
  const err = (await page.textContent('#amt-err')).trim();
  expect(err === t('err_negative'), 'negative amount shows a friendly error, got: ' + err);
  expect(!(await page.$('#res-big')), 'no result for a negative amount');
  await page.fill('#amt', '12abc');
  expect((await page.textContent('#amt-err')).trim() === t('err_number'), 'non-number shows err_number');
  await page.fill('#amt', '999999999999999.99');
  expect(await paise('#res-big') !== null, 'a 15-digit amount still computes');
  await page.fill('#amt', '999999999999999.995');
  expect((await page.textContent('#amt-err')).trim() === t('err_big'), 'rounding up past 15 digits is "too big"');
  await page.fill('#amt', '१२,३४५');
  expect(await paise('#r-taxable') !== null, 'Devanagari digits are read');

  /* cess for an older bill: 10,00,000 @ 28% (custom) + 15% cess = 14,30,000; and back again */
  await page.click('#mode [data-mode="add"]');
  await page.click('#calc-rates [data-rate="custom"]');
  await page.fill('#calc-rates input', '28');
  await page.check('#cess-on');
  await page.fill('#cess-rate', '15');
  await page.fill('#amt', '10,00,000');
  expect(await paise('#r-cess') === '15000000' && await paise('#r-total') === '143000000', 'cess 15% of 10 lakh and total 14.3 lakh');
  await page.click('#mode [data-mode="remove"]');
  await page.fill('#amt', '14,30,000');
  expect(await paise('#r-taxable') === '100000000' && await paise('#r-cess') === '15000000', 'remove 28% + 15% cess from 14.3 lakh');
  await page.uncheck('#cess-on');
  await page.click('#mode [data-mode="add"]');
  await page.click('#calc-rates [data-rate="18"]');

  /* ---- 3. GSTIN checker ---- */
  await page.click('#tab-gstin');
  await page.fill('#gstin', '27AAPFU0939F1ZV');
  expect(await page.getAttribute('#gx-status', 'data-state') === 'ok', 'known-valid GSTIN 27AAPFU0939F1ZV should pass');
  expect((await page.textContent('#g-state')).includes('27'), 'state code 27 shown');
  expect((await page.textContent('#g-holder dd')).trim() === t('pan_F'), 'PAN 4th letter F → firm');
  expect((await page.textContent('#g-pan')).includes('AAPFU0939F'), 'PAN extracted');
  await page.fill('#gstin', '27AAPFU0939F1ZW');
  expect(await page.getAttribute('#gx-status', 'data-state') === 'bad', 'one-character change must fail the check digit');
  await page.fill('#gstin', '27AAPFU0939F1Z');
  expect((await page.textContent('#gx-status')).includes('V'), '14 characters → shows expected check character V');
  await page.fill('#gstin', '99AAPFU0939F1ZV');
  expect(await page.getAttribute('#gx-status', 'data-state') === 'bad', 'changed state code fails the checksum');

  /* batch */
  await page.fill('#batch-in', '27AAPFU0939F1ZV\n29AAGCB7383J1Z4\n27AAPFU0939F1ZW');
  await page.click('#batch-run');
  const valid = await page.$$eval('#batch-table tbody tr[data-valid="true"]', l => l.length);
  expect(valid === 2, 'batch: 2 of 3 valid, got ' + valid);
  expect(!(await page.$('#batch-limit')), 'no limit notice for a short list');
  /* more than 2,000 lines: the first 2,000 are checked and the user is told */
  await page.fill('#batch-in', Array(2005).fill('27AAPFU0939F1ZV').join('\n'));
  await page.click('#batch-run');
  expect(await page.$$eval('#batch-table tbody tr', l => l.length) === 2000, 'batch is capped at 2,000 rows');
  expect((await page.textContent('#batch-limit')).trim() === t('g_batch_limit', { n: '2000' }), 'batch limit notice shown');
  await page.fill('#batch-in', '');

  /* ---- 4. quick bill (sample items loaded by default) ---- */
  await page.click('#tab-bill');
  const rows = await page.$$eval('#bill-rows .bl-row', l => l.length);
  expect(rows === 3, 'sample bill has 3 items, got ' + rows);
  /* 2×650 + 3×199 @5% and 1×3499 @18% → taxable 5396, GST 724.68, rounded 6121 */
  expect(await paise('#bill-grand') === '612100', 'bill grand total should be 6121.00, got ' + await paise('#bill-grand'));
  await page.click('#bill-add');
  const last = '#bill-rows .bl-row:last-child';
  await page.fill(last + ' [data-f="name"]', 'Test');
  await page.fill(last + ' [data-f="qty"]', '2');
  await page.fill(last + ' [data-f="rate"]', '100');
  await page.selectOption(last + ' select[data-f="gst"]', '18');
  /* +200 taxable, +36 GST → 6120.68 + 236 = 6356.68 → 6357 */
  expect(await paise('#bill-grand') === '635700', 'adding 2×100 @18% → 6357, got ' + await paise('#bill-grand'));

  /* rates include GST: per rate, CGST = SGST and the bill still adds up to what was typed (1897 + 3699 = 5596) */
  await page.check('#b-incl');
  await page.uncheck('#b-round');
  const sumRows = await page.$$eval('#bill-sum-table tbody tr', trs => trs.map(tr => [...tr.querySelectorAll('[data-paise]')].map(e => BigInt(e.dataset.paise))));
  expect(sumRows.length === 2 && sumRows.every(r => r[1] === r[2]), 'inclusive bill: CGST equals SGST for every rate');
  /* 5%: 1897 → 1806.66 + 45.17 + 45.17 (1806.66 × 2.5% = 45.1665 → 45.17); 18%: 3699 → 3134.74 + 282.13 + 282.13 */
  expect(String(sumRows[0][0]) === '180666' && String(sumRows[0][1]) === '4517', '5% group: taxable 1806.66, CGST 45.17, got ' + sumRows[0].join('/'));
  expect(await paise('#bill-grand') === '559600', 'inclusive bill total stays 5,596.00, got ' + await paise('#bill-grand'));
  await page.uncheck('#b-incl');
  await page.check('#b-round');

  /* supply from the two GSTINs, but the user can still switch by hand */
  await page.fill('#b-sgstin', '27AAPFU0939F1ZV');
  await page.fill('#b-bgstin', '29AAGCB7383J1Z4');
  expect(await page.getAttribute('#b-supply [data-supply="inter"]', 'aria-pressed') === 'true', 'Maharashtra → Karnataka GSTINs pick IGST');
  expect(await paise('#bt-igst') !== null, 'IGST total shown');
  await page.click('#b-supply [data-supply="intra"]');
  expect(await page.getAttribute('#b-supply [data-supply="intra"]', 'aria-pressed') === 'true', 'manual CGST + SGST choice sticks');
  expect(await paise('#bt-cgst') !== null && !(await page.$('#bt-igst')), 'bill switched to CGST + SGST');
  await page.fill('#b-bgstin', '');
  await page.fill('#b-sgstin', '');
  await page.click('#b-supply [data-supply="intra"]');

  /* ---- 5. price planner: keep 1000 at 18% → quote 1180 ---- */
  await page.click('#tab-price');
  await page.fill('#pq-amt', '1000');
  await page.click('#pq-rates [data-rate="18"]');
  await page.selectOption('#pq-round', '0');
  expect(await paise('#pq-quote') === '118000', 'quote for keeping 1000 at 18% should be 1180');
  await page.fill('#pq-amt', '1234');
  await page.selectOption('#pq-round', '50');
  /* 1234 × 1.18 = 1456.12 → next ₹50 = 1500; you keep 1500 / 1.18 = 1271.19 */
  expect(await paise('#pq-quote') === '150000' && await paise('#pq-keep') === '127119', 'rounded quote 1500 keeps 1271.19');

  /* cost 400 + 25% markup + 5% GST = 525 vs MRP 599; 25% margin → 533.33 */
  await page.fill('#sp-cost', '400');
  await page.fill('#sp-profit', '25');
  await page.click('#sp-kind [data-kind="markup"]');
  await page.click('#sp-rates [data-rate="5"]');
  await page.fill('#sp-mrp', '599');
  expect(await paise('#sp-ex') === '50000' && await paise('#sp-in') === '52500', 'markup 25% on 400 + 5% GST = 525');
  expect(await page.$('#sp-mrp-msg.success'), 'below MRP shown as OK');
  await page.click('#sp-kind [data-kind="margin"]');
  expect(await paise('#sp-ex') === '53333', 'margin 25% on selling price → 533.33');
  await page.fill('#sp-profit', '-5');
  expect((await page.textContent('#sp-out')).trim() === t('err_profit'), 'negative profit asks for 0–1000%');
  await page.fill('#sp-profit', '25');
  await page.fill('#sp-cost', '-400');
  expect((await page.textContent('#sp-out')).trim() === t('err_negative_amt'), 'negative cost: plain message (no credit-note hint)');
  await page.fill('#sp-cost', '400');

  /* broken saved data never stops the app */
  await page.evaluate(() => {
    localStorage.setItem('edu.gst-calculator.hist', JSON.stringify([null, { amt: 'zz' }, 5]));
    localStorage.setItem('edu.gst-calculator.bill', JSON.stringify({ items: [null, { name: 1 }], no: 7 }));
    localStorage.setItem('edu.gst-calculator.price', JSON.stringify({ round: 'abc', kind: 'x', mrp: [] }));
    localStorage.setItem('edu.gst-calculator.calcRate', JSON.stringify({ sel: 5 }));
  });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.reload();
  await page.waitForSelector('#bill-rows .bl-row', { state: 'attached' });
  expect(!errs.length, 'reload with broken saved data shows no errors: ' + errs.join('; '));
  expect(await page.$$eval('#bill-rows .bl-row', l => l.length) === 1, 'broken bill items are dropped');

  /* back to a clean start for the after-test screenshot */
  await page.evaluate(() => Object.keys(localStorage).filter(k => k.indexOf('edu.gst-calculator.') === 0).forEach(k => localStorage.removeItem(k)));
  await page.evaluate(() => { history.replaceState(null, '', location.href.split('#')[0] + '#bill'); });
  await page.reload();
  await page.waitForSelector('#bill-grand');
  expect(await page.isVisible('#p-bill'), 'deep link #bill opens the bill tab');
  expect(await paise('#bill-grand') === '612100', 'fresh start shows the sample bill again');
};
