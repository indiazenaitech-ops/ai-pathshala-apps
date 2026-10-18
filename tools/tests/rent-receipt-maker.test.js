/* Interaction test for the Rent Receipt Maker (run by tools/verify.js in en and hi).
   Every figure is worked out by hand here, not by the app. */
module.exports = async function ({ page, lang, expect }) {
  const set = async (sel, v) => { await page.fill(sel, String(v)); await page.waitForTimeout(60); };
  const total = () => page.$eval('#sumTotal', (e) => Number(e.dataset.value));
  const count = () => page.$eval('#sumTotal', (e) => Number(e.dataset.count));
  const nRc = () => page.$$eval('#pages .rc', (r) => r.length);
  const panState = () => page.$eval('#panNote', (e) => e.dataset.state);

  await page.waitForSelector('#pages .rc', { timeout: 10000 });
  /* defaults: sample, full tax year, ₹15,000 -> 12 receipts, ₹1,80,000 */
  expect(await count() === 12 && await total() === 180000, 'default 12 x 15,000 = 1,80,000, got ' + await count() + ' / ' + await total());
  expect(!(await page.$eval('#sampleBanner', (e) => e.hidden)), 'sample banner while names are empty');

  /* 1) the spec case: Tax Year 2026-27, April-March, ₹15,000, raise to ₹16,000 from November
        April-October = 7 x 15,000 = 1,05,000; November-March = 5 x 16,000 = 80,000; total 1,85,000 */
  await page.selectOption('#ty', '2026');
  await page.selectOption('#fromM', '0');
  await page.selectOption('#toM', '11');
  await set('#tenant', 'Rahul Verma');
  await set('#landlord', 'Meena Iyer');
  await set('#address', 'House 12, Sector 5, Indore 452010');
  await set('#rent', '15000');
  await page.click('#addChange');
  await page.selectOption('#changes select', '7');           // index 7 = November
  await set('#changes .chg-rent', '16,000');
  expect(await count() === 12, '12 receipts, got ' + await count());
  expect(await nRc() === 12, '12 receipts in the preview, got ' + await nRc());
  expect(await total() === 185000, 'total rent 1,85,000, got ' + await total());
  expect((await page.textContent('#sumWords')).trim() === 'Rupees One Lakh Eighty Five Thousand Only', 'words: ' + await page.textContent('#sumWords'));
  const rcs = await page.$$eval('#pages .rc', (r) => r.map((x) => x.textContent));
  expect(rcs[6].includes('15,000') && rcs[6].includes('Rupees Fifteen Thousand Only'), 'October receipt 15,000 in words: ' + rcs[6].slice(0, 160));
  expect(rcs[7].includes('16,000') && rcs[7].includes('Rupees Sixteen Thousand Only'), 'November receipt 16,000 in words: ' + rcs[7].slice(0, 160));
  expect(rcs[0].includes('30/04/2026') && rcs[10].includes('28/02/2027') && rcs[11].includes('31/03/2027'), 'last-day dates incl. February 2027');
  const nos = await page.$$eval('#pages .rc-no', (n) => n.map((x) => x.textContent));
  expect(nos[0] === 'RR-01' && nos[11] === 'RR-12', 'receipt numbers RR-01..RR-12: ' + nos.join(','));
  expect(rcs[0].includes('Rahul Verma') && rcs[0].includes('Meena Iyer'), 'names printed');
  expect(await page.$eval('#sampleBanner', (e) => e.hidden), 'typing names hides the sample banner');

  /* 2) PAN rule: 1,85,000 > 1,00,000 and no PAN -> warning */
  expect(await panState() === 'need', 'PAN needed warning, got ' + await panState());
  expect(await page.$eval('#panNote', (e) => e.classList.contains('warning') && !e.hidden), 'PAN note shown as a warning');
  /* soft format check */
  await set('#pan', 'abc12');
  expect(!(await page.$eval('#panBad', (e) => e.hidden)), 'bad PAN format warns');
  await set('#pan', 'abcpi1234k');
  expect(await page.$eval('#panBad', (e) => e.hidden), 'valid PAN (any case) accepted');
  expect(await panState() === 'have', 'PAN given -> ok state');
  expect((await page.textContent('#pages .rc-pan')) === 'ABCPI1234K', 'PAN printed in capitals');

  /* 3) layout: 3 per page -> 4 pages; 1 per page -> 12 pages; print gets the pages */
  expect((await page.$$eval('#pages .pg', (p) => p.length)) === 4, '4 A4 pages at 3 per page');
  await page.click('[data-layout="1"]');
  expect((await page.$$eval('#pages .pg', (p) => p.length)) === 12, '12 pages at 1 per page');
  await page.click('[data-layout="3"]');
  await page.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  await page.click('#printBtn');
  expect(await page.evaluate(() => window.__printed === 1) && (await page.$$eval('#printRoot .pg', (p) => p.length)) === 4, 'print root has 4 pages');

  /* 4) revenue stamp: cash above 5,000 only */
  expect((await page.$$('#pages .rc-stamp')).length === 0, 'no stamp for UPI');
  await page.click('[data-mode="cash"]');
  expect((await page.$$('#pages .rc-stamp')).length === 12, 'stamp box on all 12 cash receipts');
  /* cheque numbers run on */
  await page.click('[data-mode="cheque"]');
  await set('#chqNo', '000451');
  const rc2 = await page.$$eval('#pages .rc', (r) => r.map((x) => x.textContent));
  expect(rc2[0].includes('000451') && rc2[2].includes('000453'), 'cheque numbers +1 per month');
  expect((await page.$$('#pages .rc-stamp')).length === 0, 'no stamp for cheque');

  /* 5) HRA exemption (old regime), Pune is a 50% city from Tax Year 2026-27:
        basic 4,80,000; HRA 2,16,000; rent 1,85,000 -> limits 2,16,000 / 1,85,000 - 48,000 = 1,37,000 / 2,40,000 -> 1,37,000 */
  await page.click('#tab-hra');
  await set('#hBasic', '480000');
  await set('#hHra', '216000');
  await page.click('#hUseRec');
  await page.selectOption('#hCity', 'pune');
  await page.waitForTimeout(60);
  const ex = () => page.$eval('#hExempt', (e) => [Number(e.dataset.value), Number(e.dataset.taxable)]);
  let e = await ex();
  expect(e[0] === 137000 && e[1] === 79000, 'HRA exempt 1,37,000 taxable 79,000, got ' + e);
  /* basic 3,00,000, other city: 40% = 1,20,000 is the smallest (rent - 10% = 1,55,000) */
  await set('#hBasic', '300000');
  await page.selectOption('#hCity', 'other');
  await page.waitForTimeout(60);
  e = await ex();
  expect(e[0] === 120000 && e[1] === 96000, '40% limit 1,20,000, got ' + e);
  expect((await page.$$eval('#hWork tr.min', (r) => r.length)) === 1, 'smallest limit marked');
  /* Pune was 40% before Tax Year 2026-27 */
  const old = await page.evaluate(() => [RRM.calcHRA(480000, 300000, 300000, 'pune', 2025).exempt, RRM.calcHRA(480000, 300000, 300000, 'pune', 2026).exempt, RRM.calcHRA(480000, 300000, 40000, 'delhi', 2026).exempt]);
  expect(JSON.stringify(old) === JSON.stringify([192000, 240000, 0]), 'metro by year + rent below 10%: ' + JSON.stringify(old));
  await page.click('#tab-rec');

  /* 6) edge cases: one-month range, rent 0, very large rent */
  await page.selectOption('#fromM', '5');
  await page.selectOption('#toM', '5');
  expect(await count() === 1 && await total() === 15000 && await panState() === 'not', 'one month: 1 receipt, 15,000, PAN not needed');
  await set('#rent', '0');
  expect(await count() === 0 && !(await page.$eval('#rentZero', (e) => e.hidden)) && await nRc() === 0, 'rent 0 -> no receipts, message shown');
  await set('#rent', '');
  expect(await count() === 0, 'blank rent -> no receipts, no crash');
  await set('#rent', '99,99,99,999');
  expect((await page.textContent('#sumWords')).startsWith('Rupees Ninety Nine Crore'), 'crore in words: ' + await page.textContent('#sumWords'));

  /* 7) save the tenant, reset, load it back */
  await set('#rent', '15000');
  await page.selectOption('#fromM', '0');
  await page.selectOption('#toM', '11');
  await page.click('#setSave');
  const opts = await page.$$eval('#setPick option', (o) => o.map((x) => x.textContent));
  expect(opts.some((o) => o.includes('Rahul Verma')), 'saved tenant listed: ' + opts.join(' | '));
  const sum = await page.evaluate(() => RRM.summaryText());
  expect(sum.includes('1,85,000') && sum.includes('ABCPI1234K') && sum.split('\n').length > 12, 'WhatsApp summary has total, PAN and 12 months');
  await page.click('#resetBtn');
  await page.waitForTimeout(80);
  expect(await total() === 180000 && (await page.inputValue('#tenant')) === '', 'reset back to defaults');

  /* 8) no sideways scroll at phone width */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over <= 2, 'no horizontal overflow at 390px, got ' + over);
  await page.setViewportSize({ width: 1280, height: 800 });
};
