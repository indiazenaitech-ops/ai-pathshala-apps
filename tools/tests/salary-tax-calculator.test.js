/* Interaction test for the Salary & Income Tax Calculator (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect }) {
  /* first rupee amount in a text: '₹1,09,200' -> 109200, '−₹500' -> -500 */
  const rupees = (s) => { const m = String(s || '').match(/([−-]?)₹\s*([\d,]+)/); return m ? (m[1] ? -1 : 1) * parseInt(m[2].replace(/,/g, ''), 10) : NaN; };

  /* 1) the tax engine: the three cases from the spec + amount parsing */
  const e = await page.evaluate(() => ({
    at12: STX.taxOn(1200000, 'new').total,
    at1210: STX.taxOn(1210000, 'new').total,
    gross1575: STX.taxOn(1575000 - 75000, 'new').total,
    oldAt5: STX.taxOn(500000, 'old', 'below60').total,
    high: STX.taxOn(51000000, 'new').total,
    p: ['12L', '12.5 lakh', '1.2 cr', '12,00,000', '₹85k', '१२ लाख'].map(x => STX.parseAmount(x).value)
  }));
  expect(e.at12 === 0, 'new regime taxable 12,00,000 -> 0, got ' + e.at12);
  expect(e.at1210 === 10400, 'new regime taxable 12,10,000 -> 10,400, got ' + e.at1210);
  expect(e.gross1575 === 109200, 'gross salary 15,75,000 -> 1,09,200, got ' + e.gross1575);
  expect(e.oldAt5 === 0, 'old regime taxable 5,00,000 -> 0 (rebate), got ' + e.oldAt5);
  /* 5.1 Cr: tax 1,49,40,000 + surcharge (25% cap) with marginal relief + cess, must stay finite and below 40% */
  expect(e.high > 15000000 && e.high < 0.4 * 51000000, 'very high income gives a sane tax, got ' + e.high);
  expect(JSON.stringify(e.p) === JSON.stringify([1200000, 1250000, 12000000, 1200000, 85000, 1200000]), 'amount parsing: ' + JSON.stringify(e.p));

  /* surcharge marginal relief and a full old-regime case, worked out by hand:
     new, taxable 50,10,000: slabs 10,83,000 + 10% surcharge capped at (tax on 50L = 10,80,000) + 10,000 = 10,90,000, + 4% cess = 11,33,600.
     old, CTC 18.5L incl. 1.5L bonus, basic 40%, HRA 50%, PF capped, gratuity, Karnataka, rent 25,000/month, 80C 50,000,
     80D 25,000 + 30,000 (parents capped at 25,000): taxable 13,89,590 -> 2,29,377 + cess = 2,38,550 */
  const f = await page.evaluate(() => {
    const s = { bonus: '1.5L', regime: 'old', age: 'below60', basicPct: '40', city: 'metro', hraPct: '50', pf: 'cap', nps: '0', grat: true, state: 'KA',
      pt: '', ptManual: false, rent: '25000', c80: '50000', d80s: '25000', d80p: '30000', par60: false, ccd: '', hl: '' };
    const o = STX.calc(1850000, s, 'old'), n = STX.calc(1850000, s, 'new');
    return { sur: STX.taxOn(5010000, 'new').total, old: o.tax, oldTaxable: o.w.tax.taxable, nw: n.tax, big: STX.parseAmount('99999999 cr').big };
  });
  expect(f.sur === 1133600, 'surcharge marginal relief at 50,10,000 -> 11,33,600, got ' + f.sur);
  expect(f.old === 238550 && f.oldTaxable === 1389590, 'old regime with HRA/80C/80D -> 2,38,550 on 13,89,590, got ' + f.old + ' on ' + f.oldTaxable);
  expect(f.nw === 149900, 'same salary in the new regime -> 1,49,900, got ' + f.nw);
  expect(f.big === true, 'amounts above 1 lakh crore are refused');

  /* 2) CTC -> in-hand through the UI: no PF, no gratuity, no bonus => gross = CTC = 15,75,000 */
  await page.click('#tab-salary');
  await page.click('#regNew');
  await page.selectOption('#pf', 'none');
  await page.uncheck('#grat');
  await page.fill('#nps', '0');
  await page.fill('#bonus', '');
  await page.fill('#ctc', '15.75 lakh');
  await page.waitForTimeout(150);
  const tax = rupees(await page.textContent('#annualTax'));
  expect(tax === 109200, 'annual tax for CTC 15.75 lakh should be 1,09,200, got ' + tax);
  /* monthly: 1,31,250 gross - 2,500/12 professional tax (Maharashtra) - 9,100 TDS = 1,21,942 */
  const inhand = rupees(await page.textContent('#inhand'));
  expect(inhand === 121942, 'in-hand per month should be 1,21,942, got ' + inhand);
  const tds = rupees(await page.textContent('#tds'));
  expect(tds === 9100, 'monthly TDS should be 9,100, got ' + tds);

  /* exactly 12,00,000 taxable (CTC 12.75 lakh) -> zero tax */
  await page.fill('#ctc', '12.75L');
  await page.waitForTimeout(100);
  expect(rupees(await page.textContent('#annualTax')) === 0, 'CTC 12.75 lakh (taxable 12,00,000) should pay 0 tax');

  /* a 10% bonus stays out of monthly pay; its tax is spread over the 12 months of TDS */
  await page.fill('#ctc', '20L');
  await page.fill('#bonus', '10%');
  await page.waitForTimeout(100);
  const yTax = rupees(await page.textContent('#annualTax')), mTds = rupees(await page.textContent('#tds'));
  expect(yTax > 0 && Math.abs(mTds * 12 - yTax) <= 12, 'monthly TDS x 12 matches the yearly tax with a bonus: ' + mTds + ' x 12 vs ' + yTax);
  expect(!!(await page.$('#bonusNote')), 'bonus note explains the bonus-month TDS option');
  await page.fill('#bonus', '');

  /* 3) old vs new: verdict and break-even appear, and the old regime gets the HRA exemption */
  await page.fill('#ctc', '20L');
  await page.click('#tab-compare');
  await page.waitForTimeout(150);
  const verdict = await page.textContent('#verdict');
  expect(/₹[\d,]+/.test(verdict), 'comparison verdict shows an amount: ' + verdict);
  const be = await page.textContent('#beText');
  expect(/₹[\d,]+/.test(be), 'break-even text shows an amount: ' + be);
  const workOld = await page.textContent('#workOld');
  expect(/₹/.test(workOld) && (await page.$$('#cmpCard tbody tr')).length >= 6, 'comparison table and old-regime working are shown');

  /* 4) hike: 10 lakh + 10% = 11 lakh */
  await page.click('#tab-hike');
  await page.fill('#ctc', '10L');
  await page.fill('#hike', '10');
  await page.waitForTimeout(150);
  const after = await page.$eval('#hikeCard tbody tr td:nth-child(3)', n => n.textContent);
  expect(rupees(after) === 1100000, 'new CTC after a 10% hike on 10 lakh should be 11,00,000, got ' + after);

  /* 5) reverse: CTC for 1 lakh in hand, and that CTC really gives at least 1 lakh */
  await page.click('#tab-reverse');
  await page.fill('#target', '1L');
  await page.waitForTimeout(300);
  const need = rupees(await page.textContent('#revCtc'));
  const got = rupees(await page.textContent('#revCheck'));
  expect(need > 1200000 && need < 2500000, 'CTC for 1 lakh in hand looks sensible, got ' + need);
  expect(got >= 100000 && got < 101500, 'in-hand at that CTC is just above 1 lakh, got ' + got);
  /* in-hand pay dips just above 12.75 lakh (marginal relief + cess = Rs 1.04 tax per extra rupee). With no PF, no gratuity
     and no professional tax, 12,75,000 gives exactly 1,06,250 a month; the solver must not jump past the dip to ~13.49 lakh */
  await page.selectOption('#state', 'DL');
  await page.fill('#target', '106250');
  await page.waitForTimeout(300);
  const dip = rupees(await page.textContent('#revCtc'));
  expect(dip === 1275000, 'CTC for 1,06,250 in hand should be 12,75,000 (not past the dip), got ' + dip);
  expect(rupees(await page.textContent('#revCheck')) === 106250, 'and it gives 1,06,250 a month');

  /* a 2% hike from 12.75 lakh lowers in-hand pay: the hike line must say so */
  await page.click('#tab-hike');
  await page.fill('#ctc', '12.75L');
  await page.fill('#hike', '2');
  await page.waitForTimeout(150);
  const inRow = await page.$$eval('#hikeCard tbody tr', rs => rs[2].textContent);
  expect(/[−-]₹/.test(inRow), 'in-hand change after a 2% hike from 12.75 lakh is negative: ' + inRow);
  expect(!/\d+%\)/.test(await page.textContent('#hikeLine')), 'hike line uses the "in-hand falls" wording, not "% of the raise"');
  await page.fill('#hike', '-10');
  await page.waitForTimeout(100);
  expect(rupees(await page.$eval('#hikeCard tbody tr td:nth-child(3)', n => n.textContent)) === 1147500, 'a 10% cut on 12.75 lakh gives 11,47,500');
  await page.fill('#hike', '10');
  await page.selectOption('#state', 'MH');

  /* 6) edge: basic 90% + HRA 50% cannot fit inside CTC -> warning, no crash */
  await page.click('#tab-salary');
  await page.fill('#ctc', '6L');
  await page.fill('#basicPct', '90');
  await page.waitForTimeout(150);
  expect((await page.$$('.warns .callout')).length >= 1, 'overflow warning shown when basic + HRA exceed CTC');
  expect(rupees(await page.textContent('#inhand')) > 0, 'in-hand still worked out after the overflow fix');
  await page.fill('#basicPct', '50');

  /* 7) professional tax: a typed amount is used, and changing the state brings back the state's amount */
  await page.fill('#ctc', '15.75 lakh');
  await page.fill('#pt', '0');
  await page.waitForTimeout(100);
  const noPt = rupees(await page.textContent('#inhand'));
  await page.selectOption('#state', 'KA');
  await page.waitForTimeout(100);
  expect(await page.inputValue('#pt') === '2500', 'state change refills professional tax (Karnataka 2,500), got ' + await page.inputValue('#pt'));
  expect(rupees(await page.textContent('#inhand')) === noPt - 208, 'Karnataka professional tax lowers in-hand by 208 a month');

  /* 8) silly input: a huge amount gets a clear message, a bonus above 100% is capped with a warning */
  await page.fill('#ctc', '99999999 cr');
  await page.waitForTimeout(100);
  expect(!(await page.$('#inhand')) && (await page.$$('#results .callout.danger')).length === 1, 'huge CTC shows a "too large" message instead of numbers');
  await page.fill('#ctc', '10L');
  await page.fill('#bonus', '200%');
  await page.waitForTimeout(100);
  expect((await page.$$('.warns .callout')).length >= 1, 'bonus above 100% of CTC is capped with a warning');
  await page.fill('#bonus', '');
};
