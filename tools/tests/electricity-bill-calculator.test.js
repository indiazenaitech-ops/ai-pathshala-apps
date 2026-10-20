/* Interaction test for Electricity Bill & Energy Calculator (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, log }) {
  const close = (a, b, eps) => Math.abs(a - b) <= (eps === undefined ? 0.011 : eps);
  const setVal = async (sel, v) => { await page.fill(sel, String(v)); await page.waitForTimeout(80); };
  const data = async (sel, k) => +(await page.getAttribute(sel, 'data-' + k));

  await page.waitForSelector('#audit-total', { state: 'attached' });
  // sample home is loaded within 5 s and has a total
  expect((await page.$$('#audit-rows .ap-row')).length === 11, 'sample home lists 11 appliances');

  // --- appliances: fan 75 W × 2 × 8 h × 30 d = 36 kWh
  await page.click('#clear-btn');
  await page.waitForTimeout(100);
  expect((await page.$$('#audit-rows .ap-row')).length === 0, 'clear empties the list');
  await setVal('#days', 30);
  await page.selectOption('#add-sel', 'fan');
  await page.click('#add-btn');
  await setVal('#audit-rows .ap-row:nth-child(1) input[data-f="w"]', 75);
  await setVal('#audit-rows .ap-row:nth-child(1) input[data-f="q"]', 2);
  await setVal('#audit-rows .ap-row:nth-child(1) input[data-f="h"]', 8);
  expect(close(await data('#audit-total', 'units'), 36), 'fan 75 W × 2 × 8 h × 30 d = 36 kWh, got ' + await data('#audit-total', 'units'));

  // add 4 incandescent bulbs × 5 h (for the LED test) → +36 kWh = 72 total; bulbs rank first
  await page.selectOption('#add-sel', 'bulb');
  await page.click('#add-btn');
  await setVal('#audit-rows .ap-row:nth-child(2) input[data-f="q"]', 4);
  await setVal('#audit-rows .ap-row:nth-child(2) input[data-f="h"]', 5);
  expect(close(await data('#audit-total', 'units'), 72), 'fan 36 + bulbs 36 = 72 kWh');
  const top = await page.$$eval('#top3 .chip', a => a.map(x => x.dataset.id));
  expect(top.length === 2 && top[0] === 'bulb' || top[0] === 'fan', 'top-3 chips list both appliances, got ' + top);
  expect((await page.$$eval('#rank-list .rk-item', a => a.length)) === 2, 'ranked list has 2 rows');

  // --- bill: custom 3-slab table, 250 units, telescopic = 300 + 500 + 350 = 1150 + fixed charge
  await page.click('#tab-bill');
  await page.selectOption('#b-state', 'custom');
  await page.uncheck('#b-use-audit');
  await setVal('#b-units', 250);
  // make exactly 3 slabs: delete extras from the Delhi default (5 slabs)
  while ((await page.$$('#slab-rows .sl-row')).length > 3) { await page.click('#slab-rows .sl-row:last-child button'); await page.waitForTimeout(60); }
  await setVal('#slab-rows .sl-row:nth-child(1) input[data-f="upto"]', 100);
  await setVal('#slab-rows .sl-row:nth-child(1) input[data-f="rate"]', 3);
  await setVal('#slab-rows .sl-row:nth-child(2) input[data-f="upto"]', 200);
  await setVal('#slab-rows .sl-row:nth-child(2) input[data-f="rate"]', 5);
  await setVal('#slab-rows .sl-row:nth-child(3) input[data-f="rate"]', 7);
  await setVal('#b-load', 2);
  await setVal('#b-fixed', 50);
  await setVal('#b-duty', 0);
  await setVal('#b-fuel', 0);
  await page.uncheck('#b-sub');
  await page.click('#b-tele button[data-v="1"]');
  await page.waitForTimeout(100);
  const energy = await data('#b-total', 'energy'), total = await data('#b-total', 'total');
  expect(close(energy, 1150), '250 units telescopic on 3/5/7 = 1150, got ' + energy);
  expect(close(total, 1250), '1150 + fixed 2 kW × ₹50 = 1250, got ' + total);
  const slabAmounts = await page.$$eval('#bill-result tr.slab-row', a => a.map(x => +x.dataset.amount));
  expect(slabAmounts.join(',') === '300,500,350', 'slab by slab 300, 500, 350, got ' + slabAmounts);

  // non-telescopic: 250 × 7 = 1750 (+100 fixed)
  await page.click('#b-tele button[data-v="0"]');
  await page.waitForTimeout(100);
  expect(close(await data('#b-total', 'energy'), 1750), 'non-telescopic 250 × 7 = 1750');
  expect(close(await data('#b-total', 'total'), 1850), 'non-telescopic total 1850');

  // duty, surcharge and free units: 50 free → 200 billed = 800; fuel 10 % = 80; duty 10 % of (800+100+80) = 98; total 1078
  await page.click('#b-tele button[data-v="1"]');
  await page.check('#b-sub');
  await setVal('#b-free', 50);
  await setVal('#b-fuel', 10);
  await setVal('#b-duty', 10);
  expect(close(await data('#b-total', 'energy'), 800), '50 free units → 200 billed → ₹800, got ' + await data('#b-total', 'energy'));
  expect(close(await data('#b-total', 'total'), 1078), 'with 10 % fuel and 10 % duty the total is 1078, got ' + await data('#b-total', 'total'));
  await setVal('#b-fuel', 0); await setVal('#b-duty', 0); await page.uncheck('#b-sub');

  // --- savings: LED swap for 4 bulbs × 5 h × 30 d = 4 × 51 × 5 × 30 / 1000 = 30.6 kWh; at ₹7 = ₹214.20
  await page.click('#tab-save');
  for (const k of ['led', 'ac24', 'fridge5', 'bldc', 'standby']) await page.uncheck('#sw-' + k);
  await page.check('#sw-led');
  await setVal('#sv-rate', 7);
  expect(close(await data('#sv-kwh', 'kwh'), 30.6), 'LED swap saves 30.6 kWh, got ' + await data('#sv-kwh', 'kwh'));
  expect(close(await data('#sv-kwh', 'rs'), 214.2), 'LED swap saves ₹214.20 at ₹7, got ' + await data('#sv-kwh', 'rs'));
  await page.check('#sw-bldc');   // fan 75 → 30: 2 × 45 × 8 × 30 / 1000 = 21.6
  expect(close(await data('#sv-kwh', 'kwh'), 52.2), 'LED + BLDC = 30.6 + 21.6 = 52.2 kWh, got ' + await data('#sv-kwh', 'kwh'));

  // --- meter 4520 − 4380 = 140; solar 3 kW × 4 × 30 = 360
  await page.click('#tab-meter');
  await setVal('#m-prev', 4380);
  await setVal('#m-cur', 4520);
  expect((await data('#m-units', 'units')) === 140, 'meter 4520 − 4380 = 140');
  await setVal('#m-cur', 4000);
  expect((await page.$('#m-err')) !== null, 'reading going backwards shows an error');
  await setVal('#m-cur', 4520);
  await setVal('#s-kw', 3);
  await setVal('#s-per', 4);
  expect(close(await data('#s-units', 'units'), 360), 'solar 3 kW → 360 units a month');

  // --- science: 100 W × 5 h × 30 = 15 units; 220 V × 5 A = 1100 W; answer toggle
  await page.click('#tab-science');
  await setVal('#sc-v', 220); await setVal('#sc-i', 5);
  expect((await data('#sc-p-out', 'p')) === 1100, 'P = 220 × 5 = 1100 W');
  await setVal('#sc-pw', 100); await setVal('#sc-h', 5); await setVal('#sc-d', 30);
  expect(close(await data('#sc-e-out', 'kwh'), 15), 'NCERT: 100 W × 5 h × 30 = 15 units');
  expect(await page.$eval('#ans-1', e => e.hidden), 'answer 1 hidden at first');
  await page.click('#sc-q li:nth-child(1) button');
  expect(!(await page.$eval('#ans-1', e => e.hidden)), 'answer 1 shown after click');

  // --- reload keeps the list, the tab and the custom table
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#audit-total', { state: 'attached' });
  await page.waitForTimeout(300);
  expect((await page.$$('#audit-rows .ap-row')).length === 2, 'reload keeps 2 appliance rows');
  expect(close(await data('#audit-total', 'units'), 72), 'reload keeps 72 kWh');
  expect((await page.getAttribute('#tab-science', 'aria-selected')) === 'true', 'reload keeps the open tab');
  expect((await page.inputValue('#b-state')) === 'custom' && (await page.$$('#slab-rows .sl-row')).length === 3, 'reload keeps the custom 3-slab table');
  expect((await data('#m-units', 'units')) === 140, 'reload keeps the meter readings');

  // --- reset (confirm auto-accepted) → sample home back, Delhi table
  await page.click('#reset-btn');
  await page.waitForTimeout(800);
  await page.waitForSelector('#audit-total', { state: 'attached' });
  expect((await page.$$('#audit-rows .ap-row')).length === 11, 'reset restores the sample home');
  expect((await page.inputValue('#b-state')) === 'delhi', 'reset restores the Delhi sample tariff');
  expect((await page.getAttribute('#tab-audit', 'aria-selected')) === 'true', 'reset returns to the first tab');
  log('electricity-bill-calculator checks done');
};
