/* Interaction test for Shopping Calculator (run by tools/verify.js in en and hi).
   Every expected value below was worked out by hand (see the comment on each line). */
module.exports = async function ({ page, expect }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/[⁦-⁩]/g, '').trim();
  const num = (s) => Number(String(s).replace(/[^\d.\-]/g, ''));
  const settle = () => page.waitForTimeout(100);
  const fill = async (sel, v) => { await page.fill(sel, String(v)); await settle(); };
  const click = async (sel) => { await page.click(sel); await settle(); };
  const shown = async (sel) => page.isVisible(sel);

  /* ---------- pure maths: rounding to paise (half up) and unit conversion ---------- */
  const m = await page.evaluate(() => {
    const M = window.SHOPCALC;
    return { a: M.r2(1.005), b: M.r2(2.675), c: M.r2(66.9933), d: M.r2(0.004), e: M.r2(849.15),
      up1: M.unitPrice(62, 500, 'g'), up2: M.unitPrice(45, 750, 'ml'), up3: M.unitPrice(90, 150, 'cm'), up4: M.unitPrice(60, 12, 'pc'),
      up5: M.unitPrice(33, 300, 'g'),
      dsc: M.discount(1999, 40, 10), sec: M.second(99.99, 33), bogo: M.bogo(100, 2, 1), trip: M.trip(280, 18, 104.5, 3), mil: M.mileage(12450, 12890, 25) };
  });
  /* 33 for 300 g = 33 x 1000 / 300 = 110 per kg exactly (no 110.00000000000001 that would break a tie) */
  expect(m.up5 === 110, '33 for 300 g = exactly 110 per kg, got ' + m.up5);
  /* 1999 x 0.6 = 1199.40; x 0.9 = 1079.46; saved 919.54; (1999 - 1079.46) / 1999 = 46% */
  expect(m.dsc.p1 === 1199.4 && m.dsc.pay === 1079.46 && m.dsc.save === 919.54 && Math.abs(m.dsc.eff - 46) < 1e-9, 'discount maths ' + JSON.stringify(m.dsc));
  /* 99.99 x 0.67 = 66.9933 -> 66.99; 99.99 + 66.9933 = 166.9833 -> 166.98; / 2 = 83.49165 -> 83.49; 33 / 2 = 16.5% */
  expect(m.sec.p2 === 66.99 && m.sec.pay === 166.98 && m.sec.each === 83.49 && m.sec.eff === 16.5, 'second item maths ' + JSON.stringify(m.sec));
  /* buy 2 get 1 at 100: pay 200 for 3 = 66.666 -> 66.67 each, 1 / 3 = 33.33% */
  expect(m.bogo.pay === 200 && m.bogo.total === 3 && m.bogo.each === 66.67 && Math.abs(m.bogo.eff - 100 / 3) < 1e-9, 'bogo maths ' + JSON.stringify(m.bogo));
  /* 280 / 18 x 104.5 = 1625.5556 -> 1625.56; / 3 = 541.8533 -> 541.85 each */
  expect(m.trip.cost === 1625.56 && m.trip.each === 541.85, 'trip maths ' + JSON.stringify(m.trip));
  expect(m.mil === 17.6, '440 km on 25 L = 17.6 km/L');
  expect(m.a === 1.01 && m.b === 2.68, 'half a paisa rounds up: 1.005 -> 1.01, 2.675 -> 2.68, got ' + m.a + ', ' + m.b);
  expect(m.c === 66.99 && m.d === 0 && m.e === 849.15, 'rounding to paise: 66.9933 -> 66.99, 0.004 -> 0, 849.15 stays');
  expect(Math.abs(m.up1 - 124) < 1e-9, '62 for 500 g = 124 per kg, got ' + m.up1);
  expect(Math.abs(m.up2 - 60) < 1e-9, '45 for 750 ml = 60 per litre, got ' + m.up2);
  expect(Math.abs(m.up3 - 60) < 1e-9, '90 for 150 cm = 60 per metre, got ' + m.up3);
  expect(Math.abs(m.up4 - 5) < 1e-9, '60 for 12 pieces = 5 per piece, got ' + m.up4);

  /* ---------- 1. discount ---------- */
  /* sample: 1999 less 40% = 1199.40; less extra 10% (119.94) = 1079.46; saved 919.54; real discount 46% */
  expect(num(await txt('#d-out')) === 1079.46, 'sample 1999 at 40% + extra 10% = 1079.46, got ' + await txt('#d-out'));
  expect(num(await txt('#d-save')) === 919.54, 'saved 919.54, got ' + await txt('#d-save'));
  expect((await txt('#d-work')).includes('46%') && (await txt('#d-work')).includes('1,199.40'), 'working shows 1,199.40 and the real 46%');
  /* 0% + extra 10%: the "in total X%, not Y%" line would say "10%, not 10%", so it is left out */
  await fill('#d-pct', '0');
  expect(num(await txt('#d-out')) === 1799.1 && !(await txt('#d-work')).includes('not 10%') && (await page.$$('#d-work p')).length === 2, '0% + 10% = 1799.10 with no "not 10%" line');
  await fill('#d-pct', '40');
  expect((await page.$$('#d-work p')).length === 3, '40% + 10% shows the "in total" line');
  /* digits typed on a Hindi / Bengali / Urdu keyboard: १९९९ at ৪০% + ۱۰% = the same 1079.46 */
  await fill('#d-mrp', '१९९९'); await fill('#d-pct', '৪০'); await fill('#d-extra', '۱۰');
  expect(num(await txt('#d-out')) === 1079.46, 'Indian-script digits are understood, got ' + await txt('#d-out'));
  await fill('#d-mrp', '999'); await fill('#d-pct', '15'); await fill('#d-extra', '');
  expect(num(await txt('#d-out')) === 849.15, '999 at 15% off = 849.15, got ' + await txt('#d-out'));
  await fill('#d-mrp', '99.99'); await fill('#d-pct', '33');
  expect(num(await txt('#d-out')) === 66.99, '99.99 at 33% off = 66.9933 -> 66.99, got ' + await txt('#d-out'));
  await fill('#d-mrp', '250000'); await fill('#d-pct', '12.5');
  expect((await txt('#d-out')) === '₹2,18,750', 'Indian grouping: 2,50,000 less 12.5% = ₹2,18,750, got ' + await txt('#d-out'));
  /* bad input never crashes: shows a message and hides the answer */
  for (const bad of ['-5', 'abc', '', '0', '99999999999999']) {
    await fill('#d-mrp', bad);
    expect(await shown('#d-err') && !(await shown('#d-out')), 'MRP "' + bad + '" shows a message, not an answer');
  }
  await fill('#d-mrp', '1999'); await fill('#d-pct', '140');
  expect(await shown('#d-err'), 'a discount above 100% is refused');
  await fill('#d-pct', '40');
  await click('#d-mode-flat'); await fill('#d-flat', '500');
  expect(num(await txt('#d-out')) === 1499, '1999 less 500 = 1499, got ' + await txt('#d-out'));
  expect((await txt('#d-work')).includes('25.01%'), '500 / 1999 = 25.01% off');
  await fill('#d-flat', '2500');
  expect(await shown('#d-err'), 'amount off above the MRP is refused');
  await click('#d-mode-rev'); await fill('#d-paid', '1299');
  expect(num(await txt('#d-out')) === 35.02, 'paid 1299 on MRP 1999 = 700 / 1999 = 35.02%, got ' + await txt('#d-out'));
  expect(num(await txt('#d-save')) === 700, 'saved 700');

  /* ---------- 2. which pack is cheaper ---------- */
  await click('#tab-pack');
  /* sample: 62 for 500 g = 124 per kg; 115 for 1 kg = 115 per kg; (124 - 115) / 124 = 7.26% */
  expect(num(await txt('#pk-out')) === 115, 'sample: best is 115 per kg, got ' + await txt('#pk-out'));
  expect(num(await txt('#pk-up-0')) === 124, 'pack 1 is 124 per kg, got ' + await txt('#pk-up-0'));
  expect(await page.$eval('#pk-row-1', e => e.classList.contains('best')), 'pack 2 is highlighted as cheapest');
  expect((await txt('#pk-cmp')).includes('7.26%'), 'pack 2 is 7.26% cheaper, got ' + await txt('#pk-cmp'));
  await click('#pk-add');
  expect((await page.$$('#pk-rows .sc-pack')).length === 3, 'a third pack row is added');
  await fill('#pk-p-2', '28'); await fill('#pk-q-2', '250'); await page.selectOption('#pk-u-2', 'ml'); await settle();
  expect(await shown('#pk-err'), 'mixing grams with ml is refused');
  await page.selectOption('#pk-u-2', 'g'); await settle();
  /* 28 for 250 g = 112 per kg: now the cheapest; (124 - 112) / 124 = 9.68%, (115 - 112) / 115 = 2.61% */
  expect(num(await txt('#pk-out')) === 112, '28 for 250 g = 112 per kg is now the best, got ' + await txt('#pk-out'));
  expect((await txt('#pk-cmp')).includes('9.68%') && (await txt('#pk-cmp')).includes('2.61%'), 'cheaper by 9.68% and 2.61%, got ' + await txt('#pk-cmp'));
  await fill('#pk-q-2', '0');
  expect(await shown('#pk-err'), 'zero quantity shows a message (no divide by zero)');
  await click('#pk-del-2');
  expect((await page.$$('#pk-rows .sc-pack')).length === 2 && num(await txt('#pk-out')) === 115, 'removing the pack restores the answer');
  await click('#pk-add'); await click('#pk-add'); await click('#pk-add');
  expect((await page.$$('#pk-rows .sc-pack')).length === 5 && !(await shown('#pk-add')), 'at most 5 packs');
  expect(num(await txt('#pk-out')) === 115, 'empty extra rows are ignored');
  await click('#pk-del-4'); await click('#pk-del-3'); await click('#pk-del-2');
  /* a tie: 33 for 300 g and 110 for 1 kg are both 110 per kg -> both highlighted, "costs the same" */
  await fill('#pk-p-0', '33'); await fill('#pk-q-0', '300'); await fill('#pk-p-1', '110');
  expect((await page.$$('#pk-rows .sc-pack.best')).length === 2 && !(await txt('#pk-cmp')).includes('%'), 'equal unit prices are a tie, got ' + await txt('#pk-cmp'));
  /* tiny rates keep more decimals: 30 for 1000 pieces = 0.03, 17 for 500 = 0.034; (0.034 - 0.03) / 0.034 = 11.76% */
  await fill('#pk-p-0', '30'); await fill('#pk-q-0', '1000'); await page.selectOption('#pk-u-0', 'pc');
  await fill('#pk-p-1', '17'); await fill('#pk-q-1', '500'); await page.selectOption('#pk-u-1', 'pc'); await settle();
  expect((await txt('#pk-up-1')).includes('₹0.034') && (await txt('#pk-cmp')).includes('11.76%'), 'per-piece rate 0.034 and 11.76% cheaper, got ' + await txt('#pk-up-1') + ' / ' + await txt('#pk-cmp'));
  await fill('#pk-p-0', '62'); await fill('#pk-q-0', '500'); await page.selectOption('#pk-u-0', 'g');
  await fill('#pk-p-1', '115'); await fill('#pk-q-1', '1'); await page.selectOption('#pk-u-1', 'kg'); await settle();

  /* ---------- 3. offers ---------- */
  await click('#tab-offer');
  /* buy 2 get 1 at 120 each: pay 240 for 3 = 80 each; 1 / 3 = 33.33% */
  expect(num(await txt('#o-out')) === 33.33, 'buy 2 get 1 free = 33.33%, got ' + await txt('#o-out'));
  expect(num(await txt('#o-per')) === 80, 'each item costs 80, got ' + await txt('#o-per'));
  await fill('#o-x', '1'); await fill('#o-y', '1');
  expect(num(await txt('#o-out')) === 50 && num(await txt('#o-per')) === 60, 'buy 1 get 1 = 50% off, 60 each');
  await fill('#o-x', '2.5');
  expect(await shown('#o-err'), 'a fraction of an item is refused');
  await fill('#o-x', '2');
  await click('#o-mode-second'); await fill('#o-z', '50');
  /* 120 + 60 = 180 for 2 = 90 each = 25% off */
  expect(num(await txt('#o-out')) === 25 && num(await txt('#o-per')) === 90, 'second item at 50% off = 25% real discount, 90 each, got ' + await txt('#o-out'));
  await fill('#o-price', '99'); await fill('#o-z', '30');
  /* 99 + 69.30 = 168.30 -> 84.15 each, 15% */
  expect(num(await txt('#o-out')) === 15 && num(await txt('#o-per')) === 84.15, '99 with second at 30% off = 84.15 each, got ' + await txt('#o-per'));

  /* ---------- 4. fuel and trip ---------- */
  await click('#tab-fuel');
  /* 280 km / 18 = 15.5556 L; x 104.5 = 1625.56; per km 104.5 / 18 = 5.81; 1625.56 / 4 = 406.39 */
  expect(num(await txt('#f-out')) === 1625.56, 'trip cost 1625.56, got ' + await txt('#f-out'));
  expect((await txt('#f-fuel')).includes('15.56'), 'fuel needed 15.56 L, got ' + await txt('#f-fuel'));
  expect((await txt('#f-perkm')).includes('5.81'), 'cost per km 5.81, got ' + await txt('#f-perkm'));
  expect((await txt('#f-each')).includes('406.39'), 'each of 4 pays 406.39, got ' + await txt('#f-each'));
  /* the working must add up on screen: 280 km ÷ 18 × ₹104.50 = ₹1,625.56 (15.56 × 104.50 would give 1,626.02) */
  expect((await txt('#f-work')).includes('280 km ÷ 18 × ₹104.50 = ₹1,625.56'), 'trip working is exact, got ' + await txt('#f-work'));
  await fill('#f-mil', '0');
  expect(await shown('#f-err'), 'zero mileage shows a message');
  await fill('#f-mil', '18'); await fill('#f-n', '0');
  expect(await shown('#f-err'), 'zero people shows a message');
  await fill('#f-n', '4');
  await click('#f-mode-mil');
  /* (12890 - 12450) / 25 = 440 / 25 = 17.6 */
  expect(num(await txt('#f-out')) === 17.6, 'mileage from two fill-ups = 17.6, got ' + await txt('#f-out'));
  await fill('#m-odo2', '12000');
  expect(await shown('#f-err'), 'second reading below the first is refused');
  await fill('#m-odo2', '12890');
  await click('#m-use');
  /* 280 / 17.6 x 104.5 = 1662.50 */
  expect((await page.inputValue('#f-mil')) === '17.6' && num(await txt('#f-out')) === 1662.5, 'using 17.6 km/l gives a 1662.50 trip, got ' + await txt('#f-out'));
  await click('#f-unit-kg'); await fill('#f-mil', '25'); await fill('#f-price', '76');
  /* CNG: 280 / 25 = 11.2 kg x 76 = 851.20 */
  expect(num(await txt('#f-out')) === 851.2 && (await txt('#f-fuel')).includes('11.2 kg'), 'CNG trip: 11.2 kg, 851.20, got ' + await txt('#f-out'));

  /* ---------- remembered after reload, then reset ---------- */
  await page.waitForTimeout(400);
  await page.reload(); await page.waitForTimeout(900);
  expect((await page.getAttribute('#tab-fuel', 'aria-selected')) === 'true' && (await page.inputValue('#f-price')) === '76', 'tab and inputs are remembered after reload');
  await page.click('#helpBox summary'); await settle();
  await click('#resetAll');
  expect(num(await txt('#f-out')) === 1625.56, 'Reset brings back the sample trip');
};
