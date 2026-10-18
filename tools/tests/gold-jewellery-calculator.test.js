/* Interaction test for Gold & Silver Jewellery Price Calculator (run by tools/verify.js in en and hi).
   Expected values were worked out by hand: rate 72,000 / 10 g, 22K (91.6 %), 10 g, making 12 %, GST 3 %
   → metal 65,952; making 7,914.24; subtotal 73,866.24; GST 2,215.99; total 76,082.23. */
module.exports = async function ({ page, lang, expect, t }) {
  const amt = async (sel) => page.$eval(sel, el => {
    const b = el.matches('[data-amt]') ? el : el.querySelector('[data-amt]');
    return b ? b.getAttribute('data-amt') : null;
  }).catch(() => null);
  const near = (a, b, eps) => a !== null && Math.abs(parseFloat(a) - b) <= (eps || 0.005);

  /* ---- 1. defaults: the spec's example is the sample estimate ---- */
  await page.waitForSelector('#big-total');
  expect(near(await amt('#big-total'), 76082.23), 'default total should be 76,082.23, got ' + await amt('#big-total'));
  expect(near(await amt('#r-metal'), 65952), 'metal value 65,952, got ' + await amt('#r-metal'));
  expect(near(await amt('#r-making'), 7914.24), 'making 12 % = 7,914.24, got ' + await amt('#r-making'));
  expect(near(await amt('#r-subtotal'), 73866.24), 'subtotal 73,866.24');
  expect(near(await amt('#r-gst'), 2215.99), 'GST 3 % = 2,215.99, got ' + await amt('#r-gst'));
  expect(near(await amt('#r-rate'), 6595.2), 'rate per gram at 22K = 6,595.20');
  expect(!(await page.$('#r-hallmark')), 'hallmark row hidden when off');
  const words = await page.textContent('#words-en');
  expect(/Seventy-Six Thousand Eighty-Two and Twenty-Three Paise/.test(words), 'amount in words: ' + words);
  if (lang === 'hi') expect(/छिहत्तर हज़ार बयासी रुपये/.test(await page.textContent('#words-hi')), 'Hindi words shown');

  /* hallmarking adds ₹53 */
  await page.check('#hallmark-on');
  expect(near(await amt('#r-hallmark'), 53), 'hallmark row 53');
  expect(near(await amt('#big-total'), 76135.23), 'total with hallmark 76,135.23, got ' + await amt('#big-total'));
  await page.uncheck('#hallmark-on');

  /* making billed separately at 5 %: GST 1,978.56 + 395.71 → total 76,240.51 */
  await page.check('#mk-sep');
  expect(near(await amt('#r-gst'), 2374.27) && near(await amt('#big-total'), 76240.51), 'making at 5 % GST → total 76,240.51, got ' + await amt('#big-total'));
  await page.uncheck('#mk-sep');

  /* ---- 2. fair-price check: quote 80,000 → implied making ≈ 17.8 % ---- */
  await page.fill('#quote', '80,000');
  const pctQ = await page.$eval('#fp-pct [data-pct]', e => e.getAttribute('data-pct'));
  expect(near(pctQ, 17.77, 0.06), 'implied making for 80,000 should be about 17.8 %, got ' + pctQ);
  expect(near(await amt('#fp-making'), 11717.9), 'implied making amount 11,717.90');
  expect(!!(await page.$('#fp-diff')), 'difference message shown');
  await page.fill('#quote', '60,000');
  expect(!!(await page.$('#fp-neg')), 'quote below metal value is flagged');
  await page.fill('#quote', '');

  /* ---- 3. old-gold exchange: 8 g 22K at 5 % → 50,123.52 ---- */
  await page.fill('#og-weight', '8');
  await page.fill('#og-ded', '5');
  await page.click('#og-purity [data-purity="22k"]');
  expect(near(await amt('#og-credit'), 50123.52), 'old gold credit 50,123.52, got ' + await amt('#og-credit'));
  expect(near(await amt('#og-net'), 76082.23 - 50123.52), 'still to pay after exchange 25,958.71');

  /* ---- 4. resale (3 %) and purity helper ---- */
  await page.fill('#rs-ded', '3');
  expect(near(await amt('#rs-value'), 63973.44), 'resale at 3 % off metal value = 63,973.44, got ' + await amt('#rs-value'));
  const pure = await page.$eval('#ph-pure', e => e.getAttribute('data-g'));
  expect(pure === '9.16', '22K 10 g contains 9.16 g pure gold, got ' + pure);

  /* ---- 5. tola converter and making modes ---- */
  await page.fill('#tola', '1');
  expect((await page.inputValue('#weight')) === '11.664', '1 tola = 11.664 g, got ' + await page.inputValue('#weight'));
  await page.fill('#weight', '10');
  await page.click('#mk-mode [data-mode="gram"]');
  await page.fill('#mk', '500');
  expect(near(await amt('#r-making'), 5000), '₹500 per gram × 10 g = 5,000');
  await page.click('#mk-mode [data-mode="flat"]');
  await page.fill('#mk', '2500');
  expect(near(await amt('#r-making'), 2500), 'flat making 2,500');
  await page.click('#mk-mode [data-mode="pct"]');
  await page.fill('#mk', '12');
  await page.fill('#wastage', '5');
  expect(near(await amt('#r-wastage'), 3297.6), 'wastage 5 % of 65,952 = 3,297.60');
  await page.fill('#wastage', '0');

  /* ---- 6. silver: 1 kg at 95,000 / kg, 925 → metal 87,875 ---- */
  await page.click('#metal [data-metal="silver"]');
  await page.fill('#rate', '95,000');
  await page.selectOption('#rate-unit', 'kg');
  await page.click('#purity [data-purity="925"]');
  await page.fill('#weight', '1000');
  expect(near(await amt('#r-metal'), 87875), 'silver 1 kg 925 metal value 87,875, got ' + await amt('#r-metal'));
  /* custom purity */
  await page.click('#purity [data-purity="custom"]');
  await page.fill('#purity input', '80');
  expect(near(await amt('#r-metal'), 76000), 'custom 80 % silver → 76,000');
  await page.click('#purity [data-purity="925"]');
  await page.fill('#weight', '10');
  await page.click('#metal [data-metal="gold"]');
  expect((await page.inputValue('#rate')) === '72,000', 'each metal remembers its own rate, got ' + await page.inputValue('#rate'));
  expect(near(await amt('#r-metal'), 65952), 'switching back to gold restores the gold estimate, got ' + await amt('#r-metal'));

  /* bad input never crashes */
  await page.fill('#rate', 'abc');
  expect(!!(await page.$('#res-empty')) && !(await page.$('#big-total')), 'invalid rate shows a message and no total');
  await page.fill('#rate', '');
  expect((await page.textContent('#rate-err')).trim() === t('err_rate'), 'empty rate asks for today\'s rate');

  /* ---- 7. reload keeps the rate (and its date) ---- */
  await page.fill('#rate', '80,000');
  await page.waitForTimeout(150);
  await page.reload();
  await page.waitForSelector('#big-total');
  expect((await page.inputValue('#rate')) === '80,000', 'rate survives a reload, got ' + await page.inputValue('#rate'));
  expect(near(await amt('#big-total'), 84535.81), 'total for 80,000 / 10 g after reload = 84,535.81, got ' + await amt('#big-total'));
  expect(!(await page.$('#rate-datehint.sample')), 'a typed rate is no longer marked as a sample');

  /* save to recent, then load it back */
  await page.click('#save-est');
  expect((await page.$$('#recent-list li')).length === 1, 'one saved estimate');
  await page.fill('#rate', '72,000');
  await page.click('#recent-list li button');
  expect((await page.inputValue('#rate')) === '80,000', 'loading a saved estimate restores its rate');

  /* broken saved data never stops the app */
  await page.evaluate(() => {
    localStorage.setItem('edu.gold-jewellery-calculator.state', JSON.stringify({ metal: 'platinum', purity: 5, weight: [], mkMode: 'x' }));
    localStorage.setItem('edu.gold-jewellery-calculator.recent', JSON.stringify([null, { total: 'zz' }, 7]));
  });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.reload();
  await page.waitForSelector('#result');
  expect(!errs.length, 'reload with broken saved data shows no errors: ' + errs.join('; '));
  expect((await page.$$('#recent-list li')).length === 0, 'broken recent entries are dropped');

  /* ---- 8. reset ---- */
  await page.click('#save-est');
  await page.click('#reset');   // confirm dialogs are auto-accepted by verify.js
  await page.waitForTimeout(100);
  expect((await page.inputValue('#rate')) === '72,000', 'reset restores the sample rate, got ' + await page.inputValue('#rate'));
  expect(near(await amt('#big-total'), 76082.23), 'reset restores the sample estimate');
  expect((await page.$$('#recent-list li')).length === 0, 'reset clears saved estimates');
};
