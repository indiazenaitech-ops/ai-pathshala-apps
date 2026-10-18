/* Interaction test for Gold & Silver Price Calculator (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, t }) {
  const paise = async (sel) => page.$eval(sel, el => {
    const b = el.matches('[data-paise]') ? el : el.querySelector('[data-paise]');
    return b ? b.getAttribute('data-paise') : null;
  }).catch(() => null);

  /* ---- 1. 22K jewellery: 10 g at ₹1,20,000 per 10 g (22K rate), 12% making, 3% GST ---- */
  await page.click('#tab-price');
  await page.click('#p-metal [data-metal="gold"]');
  await page.click('#p-pur [data-pur="916"]');
  await page.click('#p-rfor [data-rfor="pur"]');
  await page.selectOption('#p-runit', '10g');
  await page.fill('#p-rate', '1,20,000');
  await page.selectOption('#p-wu', 'g');
  await page.fill('#p-w', '10');
  await page.fill('#p-sw', '');
  await page.click('#p-mktype [data-mk="pct"]');
  await page.fill('#p-mk', '12');
  await page.fill('#p-wst', ''); await page.fill('#p-disc', ''); await page.fill('#p-stones', ''); await page.fill('#p-other', '');
  await page.click('#p-mode [data-mode="buy"]');
  await page.click('#p-supply [data-supply="intra"]');
  /* metal 1,20,000 + making 14,400 = 1,34,400 taxable; CGST 2,016 + SGST 2,016; total 1,38,432 */
  expect(await paise('#r-metal') === '12000000', 'metal value 1,20,000, got ' + await paise('#r-metal'));
  expect(await paise('#r-making') === '1440000', 'making 12% = 14,400, got ' + await paise('#r-making'));
  expect(await paise('#r-cgst') === '201600' && await paise('#r-sgst') === '201600', 'CGST = SGST = 2,016');
  expect(await paise('#r-gst') === '403200', 'GST 3% = 4,032, got ' + await paise('#r-gst'));
  expect(await paise('#p-total') === '13843200', 'total 1,38,432, got ' + await paise('#p-total'));
  expect(await paise('#p-perg') === '1384320', 'effective price per gram 13,843.20, got ' + await paise('#p-perg'));

  /* same piece, making as ₹500 per gram, then back to % (each type keeps its own value) */
  await page.click('#p-mktype [data-mk="pg"]');
  await page.fill('#p-mk', '500');
  expect(await paise('#r-making') === '500000', 'making ₹500/g × 10 g = 5,000, got ' + await paise('#r-making'));
  await page.click('#p-mktype [data-mk="pct"]');
  expect((await page.inputValue('#p-mk')) === '12', 'switching back to % keeps 12');
  expect(await paise('#p-total') === '13843200', 'total back to 1,38,432');

  /* 24K board rate → 22K worked out: 1,50,000 × 916/1000 = 1,37,400 per 10 g */
  await page.click('#p-rfor [data-rfor="base"]');
  await page.fill('#p-rate', '150000');
  expect(await paise('#r-metal') === '13740000', '22K from 24K rate: metal 1,37,400, got ' + await paise('#r-metal'));
  await page.click('#p-rfor [data-rfor="pur"]');
  await page.fill('#p-rate', '1,20,000');

  /* edge cases never crash: blank and zero weight, stone heavier than gross, huge and negative numbers */
  await page.fill('#p-w', '');
  expect(!(await page.$('#p-total')) && !!(await page.$('#p-empty')), 'blank weight shows the empty message');
  await page.fill('#p-w', '0');
  expect(!(await page.$('#p-total')), 'zero weight gives no total');
  await page.fill('#p-w', '10'); await page.fill('#p-sw', '12');
  expect((await page.textContent('#p-err')).trim() === t('err_stone'), 'stone weight > gross weight is an error');
  await page.fill('#p-sw', '');
  await page.fill('#p-w', '99999999999');
  expect((await page.textContent('#p-err')).trim() === t('err_big'), 'huge weight is "too big"');
  await page.fill('#p-w', '-5');
  expect((await page.textContent('#p-err')).trim() === t('err_negative'), 'negative weight rejected');
  await page.fill('#p-w', '10');
  expect(await paise('#p-total') === '13843200', 'back to the 22K example');

  /* silver per-kg rate: 50 g of 925 silver, 999 rate ₹2,00,000/kg → 925 rate 1,85,000/kg → metal ₹9,250 */
  await page.click('#p-metal [data-metal="silver"]');
  await page.click('#p-pur [data-pur="925"]');
  await page.click('#p-rfor [data-rfor="base"]');
  await page.selectOption('#p-runit', 'kg');
  await page.fill('#p-rate', '2,00,000');
  await page.fill('#p-w', '50');
  expect(await paise('#r-metal') === '925000', 'silver 925 metal value 9,250, got ' + await paise('#r-metal'));
  await page.click('#p-metal [data-metal="gold"]');
  expect((await page.inputValue('#p-rate')) === '1,20,000', 'gold keeps its own rate');
  await page.fill('#p-w', '10');
  expect(await paise('#p-total') === '13843200', 'gold example again');

  /* ---- 2. old gold exchange: 10 g of 22K at ₹1,20,000/10 g, 2% deduction = 1,17,600 ---- */
  await page.click('#tab-exch');
  await page.click('#x-metal [data-metal="gold"]');
  await page.click('#x-pur [data-pur="916"]');
  await page.click('#x-rfor [data-rfor="pur"]');
  await page.selectOption('#x-runit', '10g');
  await page.fill('#x-rate', '120000');
  await page.fill('#x-w', '10'); await page.fill('#x-sw', '');
  await page.fill('#x-ded', '2');
  expect(await paise('#r-ex-ded') === '-240000', 'deduction 2,400, got ' + await paise('#r-ex-ded'));
  expect(await paise('#x-value') === '11760000', 'exchange value 1,17,600, got ' + await paise('#x-value'));
  /* new jewellery from the price tab (1,38,432) minus old gold = 20,832 to pay */
  await page.click('#x-use');
  expect(await paise('#x-pay') === '2083200', 'amount to pay 20,832, got ' + await paise('#x-pay'));

  /* ---- 3. compare: default quotes for 10 g → shop 2 (₹450/g making) is cheapest ---- */
  await page.click('#tab-cmp');
  await page.fill('#c-w', '10');
  await page.selectOption('#c-runit', '10g');
  const setShop = async (i, rate, type, mk, wst) => {
    await page.fill('#c-rate-' + i, rate); await page.selectOption('#c-mkt-' + i, type);
    await page.fill('#c-mk-' + i, mk); await page.fill('#c-wst-' + i, wst); await page.fill('#c-stones-' + i, '');
  };
  await setShop(0, '134000', 'pct', '12', '');
  await setShop(1, '133500', 'pg', '450', '');
  await setShop(2, '135000', 'pct', '8', '2');
  /* A: 1,50,080 + 4,502.40 = 1,54,582.40 · B: 1,38,000 + 4,140 = 1,42,140 · C: 1,48,500 + 4,455 = 1,52,955 */
  expect(await paise('#c-total-0') === '15458240', 'shop 1 total 1,54,582.40, got ' + await paise('#c-total-0'));
  expect(await paise('#c-total-1') === '14214000', 'shop 2 total 1,42,140');
  expect(await page.$eval('#c-shop-1', e => e.classList.contains('is-best')), 'shop 2 highlighted as cheapest');
  expect(await page.$$eval('#c-table tr.best', l => l.length) === 1, 'one cheapest row');
  /* shop 2 raises making to 20% → shop 3 becomes the cheapest */
  await page.selectOption('#c-mkt-1', 'pct'); await page.fill('#c-mk-1', '20');
  expect(await page.$eval('#c-shop-2', e => e.classList.contains('is-best')), 'shop 3 is now cheapest');
  expect(await page.$eval('#c-table tr.best', e => e.dataset.shop) === '2', 'cheapest row is shop 3');

  /* ---- 4. converter: 24K ₹1,46,514 per 10 g → 22K per gram ₹13,420.68, 24K per tola ₹1,70,891 ---- */
  await page.click('#tab-conv');
  await page.click('#v-metal [data-metal="gold"]');
  await page.click('#v-pur [data-pur="999"]');
  await page.selectOption('#v-runit', '10g');
  await page.fill('#v-rate', '1,46,514');
  expect(await paise('#v-916-g') === '1342068', '22K per gram 13,420.68, got ' + await paise('#v-916-g'));
  expect(await paise('#v-999-tola') === '17089100', '24K per tola (11.6638 g) 1,70,891.00, got ' + await paise('#v-999-tola'));

  /* ---- 5. checklist persists a tick ---- */
  await page.click('#tab-check');
  await page.check('#ck-2');
  expect((await page.textContent('#ck-count')).includes('1'), 'checklist count updates');
  await page.reload();
  await page.waitForTimeout(500);
  expect(await page.isChecked('#ck-2'), 'checklist tick saved after reload');
  await page.click('#tab-price');
  expect((await page.inputValue('#p-rate')) === '1,20,000', 'last gold rate remembered after reload');
};
