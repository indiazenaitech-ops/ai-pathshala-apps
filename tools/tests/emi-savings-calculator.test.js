/* Interaction test for EMI, SIP & FD Calculator (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const settle = () => page.waitForTimeout(120);
  const fill = async (sel, v) => { await page.fill(sel, v); await settle(); };
  const rupees = (s) => Number(String(s).replace(/[^\d.]/g, ''));
  const inr = (v) => '₹' + Math.round(v).toLocaleString('en-IN');
  const emiOf = (P, ra, n) => { const r = ra / 1200; return P * r / (1 - Math.pow(1 + r, -n)); };
  const cmpRowsNow = () => page.$$eval('#cmpTable tbody tr', trs => trs.map(tr => [...tr.children].map(td => td.textContent.trim())));

  /* ---------------- EMI: Rs 10,00,000 at 8.5% for 20 years -> EMI ~ Rs 8,678 */
  await fill('#emiAmt', '1000000');
  await fill('#emiRate', '8.5');
  await fill('#emiYrs', '20');
  await fill('#emiMos', '0');
  let emi = await txt('#emiBig');
  const emi85 = emi;
  expect(emi === '₹8,678', 'EMI for 10 lakh at 8.5% for 20 years is ₹8,678, got ' + emi);
  const interest = await txt('#emiI');
  expect(interest === '₹10,82,776', 'total interest is ₹10,82,776, got ' + interest);
  expect((await txt('#emiT')) === '₹20,82,776', 'total payment is ₹20,82,776');
  expect((await txt('#tenureHint')).includes('240'), 'tenure hint says 240 EMIs');

  /* shorthand: 10L = 10 lakh; hint shows the amount in words */
  await fill('#emiAmt', '10L');
  expect((await txt('#emiBig')) === '₹8,678', '"10L" is read as 10 lakh');
  expect((await txt('#emiAmt-h')) === t('w_l', { n: '10' }), 'hint shows "10 lakh" in words, got ' + await txt('#emiAmt-h'));

  /* 0% interest -> EMI = P / n */
  await fill('#emiRate', '0');
  emi = await txt('#emiBig');
  expect(emi === '₹4,167', '0% EMI = 10,00,000 / 240 = ₹4,167, got ' + emi);
  expect((await txt('#emiI')) === '₹0', '0% loan has no interest');
  await fill('#emiRate', '8.5');

  /* invalid input is flagged, not crashed */
  await fill('#emiRate', '80');
  expect((await page.getAttribute('#emiRate', 'aria-invalid')) === 'true', 'rate 80% is flagged as out of range');
  expect((await txt('#emiRes')) === t('err_fix'), 'result asks to check the fields');
  await fill('#emiRate', '8.5');

  /* years and months must be whole numbers: 2.5 years is flagged, not silently turned into 30 EMIs */
  await fill('#emiYrs', '2.5');
  expect((await page.getAttribute('#emiYrs', 'aria-invalid')) === 'true' && (await txt('#tenureHint')) === t('err_whole_tenure'), 'fractional years are flagged: ' + await txt('#tenureHint'));
  expect((await txt('#emiRes')) === t('err_fix'), 'no EMI is shown for a fractional tenure');
  await fill('#emiYrs', '20');
  await fill('#emiMos', '1.5');
  expect((await page.getAttribute('#emiMos', 'aria-invalid')) === 'true' && (await txt('#tenureHint')) === t('err_whole'), 'fractional months are flagged');
  await fill('#emiMos', '0');
  /* arrow keys step the rate by 0.05 */
  await page.focus('#emiRate');
  await page.keyboard.press('ArrowUp');
  await settle();
  expect((await page.inputValue('#emiRate')) === '8.55', 'ArrowUp raises the rate to 8.55, got ' + await page.inputValue('#emiRate'));
  await fill('#emiRate', '8.5');

  /* ---------------- prepayment: Rs 1 lakh every year from month 12, reduce tenure */
  await page.click('#ppAdd');
  await settle();
  await fill('#pp0a', '100000');
  await fill('#pp0m', '12');
  await page.selectOption('#pp0f', 'yearly');
  await settle();
  const cmpRows = await page.$$eval('#cmpTable tbody tr', trs => trs.map(tr => [...tr.children].map(td => td.textContent.trim())));
  const emisPlan = parseInt(cmpRows[1][2], 10), emisBase = parseInt(cmpRows[1][1], 10);
  expect(emisBase === 240 && emisPlan > 60 && emisPlan < 120, 'yearly prepayment shortens the loan: ' + cmpRows[1].join(' | '));
  const intBase = rupees(cmpRows[3][1]), intPlan = rupees(cmpRows[3][2]);
  expect(intPlan < intBase * 0.5, 'prepayments cut total interest a lot: ' + intBase + ' -> ' + intPlan);
  const saved = await txt('#chgSum');
  const savedAmt = rupees((saved.match(/₹[\d,]+/) || ['0'])[0]);
  expect((await page.getAttribute('#chgSum', 'class')).includes('success') && Math.abs(savedAmt - (intBase - intPlan)) <= 2, 'summary says how much interest is saved: ' + saved);
  /* a one-time prepayment with "cut EMI": same end date, smaller EMI */
  await page.selectOption('#pp0f', 'once');
  await page.click('#ppMode button[data-v="emi"]');
  await settle();
  const cmp2 = await page.$$eval('#cmpTable tbody tr', trs => trs.map(tr => [...tr.children].map(td => td.textContent.trim())));
  expect(cmp2[0][2].includes('→'), 'cut-EMI mode shows the EMI going down: ' + cmp2[0][2]);
  expect(parseInt(cmp2[1][2], 10) === 240, 'cut-EMI mode keeps 240 EMIs, got ' + cmp2[1][2]);
  await page.click('#ppMode button[data-v="tenure"]');

  /* prepayment bigger than the balance closes the loan in that month */
  await fill('#pp0a', '50L');
  await page.selectOption('#pp0f', 'once');
  await fill('#pp0m', '3');
  const cmp3 = await page.$$eval('#cmpTable tbody tr', trs => trs.map(tr => [...tr.children].map(td => td.textContent.trim())));
  expect(parseInt(cmp3[1][2], 10) === 3, 'a prepayment larger than the balance closes the loan in month 3, got ' + cmp3[1][2]);
  expect((await page.$$('#chgOut .callout.warning')).length >= 1, 'warns that only part of the prepayment was needed');

  /* floating rate goes up in month 25: keep EMI -> loan gets longer */
  await page.click('#chgCard .rm');               // remove the prepayment
  await settle();
  await page.click('#rcAdd');
  await settle();
  await fill('#rc0m', '25');
  await fill('#rc0r', '10');
  const cmp4 = await page.$$eval('#cmpTable tbody tr', trs => trs.map(tr => [...tr.children].map(td => td.textContent.trim())));
  expect(parseInt(cmp4[1][2], 10) > 240, 'a rate rise with the same EMI makes the loan longer: ' + cmp4[1][2]);
  expect((await page.getAttribute('#chgSum', 'class')).includes('danger'), 'summary warns that more interest is paid');
  /* keep tenure instead: still 240 EMIs, EMI rises to EMI(balance after 24 EMIs, 10%, 216 months) */
  await page.click('#rcMode button[data-v="emi"]');
  await settle();
  let b24 = 1000000; const e1 = emiOf(1000000, 8.5, 240);
  for (let i = 0; i < 24; i++) b24 -= e1 - b24 * 8.5 / 1200;
  const cmp5 = await cmpRowsNow();
  expect(parseInt(cmp5[1][2], 10) === 240 && cmp5[0][2].endsWith(inr(emiOf(b24, 10, 216))), 'keep-tenure rate rise: 240 EMIs and EMI ' + inr(emiOf(b24, 10, 216)) + ', got ' + cmp5[0][2] + ' / ' + cmp5[1][2]);
  await page.click('#rcMode button[data-v="tenure"]');
  await settle();
  /* on a 390 px phone both comparison columns stay on screen and nothing scrolls sideways */
  const vp = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  const fit = await page.evaluate(() => { const r = document.querySelector('#cmpTable tbody tr td:last-child').getBoundingClientRect(); return { right: Math.round(r.right), sw: document.documentElement.scrollWidth, w: innerWidth }; });
  expect(fit.right <= fit.w && fit.sw <= fit.w + 1, 'phone: "with changes" column visible and no sideways scroll ' + JSON.stringify(fit));
  await page.setViewportSize(vp);
  await page.waitForTimeout(250);
  await page.click('#chgCard .rm');
  await settle();

  /* monthly schedule: 240 rows, balance ends at 0; CSV has the exact EMI */
  await page.click('#schView button[data-v="monthly"]');
  await settle();
  const nRows = await page.$$eval('#schTable tbody tr', trs => trs.length);
  expect(nRows === 240, 'monthly schedule has 240 rows, got ' + nRows);
  const lastBal = await page.$eval('#schTable tbody tr:last-child td:last-child', td => td.textContent.trim());
  expect(lastBal === '₹0', 'balance is ₹0 after the last EMI, got ' + lastBal);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#emiCsv')]);
  const fs = require('fs');
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  expect(csv.includes('8678.23') && csv.split('\n').length > 245, 'CSV has the exact EMI 8678.23 and all rows');
  await page.click('#schView button[data-v="fy"]');
  await page.fill('#emiStart', '2026-11');
  await page.dispatchEvent('#emiStart', 'change');
  await settle();
  const fyRows = await page.$$eval('#schTable tbody tr', trs => trs.map(tr => [...tr.children].map(td => td.textContent.trim())));
  expect(/2026-27/.test(fyRows[0][0]) && fyRows[0][1] === '5', 'first EMI in Nov 2026: first financial year is FY 2026-27 with 5 EMIs, got ' + fyRows[0].join(' | '));
  expect(fyRows.length === 21 && fyRows[20][1] === '7', 'a 20-year loan from Nov 2026 spans 21 financial years and ends with 7 EMIs, got ' + fyRows.length);
  const fyInt = fyRows.reduce((a, r) => a + rupees(r[4]), 0);
  expect(Math.abs(fyInt - 1082776) <= fyRows.length, 'financial-year interest adds up to the total interest, got ' + fyInt);
  const fyFirst = fyRows[0][0];

  /* flat 1% a month for 12 months -> about 21.46% reducing */
  const real = await txt('#flatReal');
  expect(real === '21.46%', 'flat 1%/month for 12 months is 21.46% a year reducing, got ' + real);
  /* no-cost EMI is not free: GST on hidden interest + fee */
  const extra = rupees(await txt('#ncExtra'));
  expect(extra > 600 && extra < 800, 'no-cost EMI on ₹60,000 over 6 months still costs ~₹714 extra, got ' + extra);
  /* fees make the APR higher than the quoted rate */
  const apr = parseFloat((await txt('#aprVal')).replace('%', ''));
  expect(apr > 8.5 && apr < 9.5, 'APR with 0.5% fee + charges is above 8.5%, got ' + apr);

  /* ---------------- SIP: Rs 5,000 a month at 12% for 10 years -> ~ Rs 11,61,695 */
  await page.click('#tab-sip');
  await settle();
  await fill('#sipAmt', '5000');
  await fill('#sipStep', '0');
  await fill('#sipRet', '12');
  await fill('#sipYrs', '10');
  await fill('#sipLump', '0');
  const sip = await txt('#sipBig');
  expect(sip === '₹11,61,695', 'SIP 5,000 x 120 months at 12% = ₹11,61,695, got ' + sip);
  expect((await txt('#sipInv')) === '₹6,00,000', 'invested ₹6,00,000');
  expect((await page.$$eval('#sipTable tbody tr', trs => trs.length)) === 10, 'SIP table has 10 years');
  /* goal planner */
  await page.click('#sipMode button[data-v="goal"]');
  await page.uncheck('#sipToday');
  await fill('#sipGoal', '1161695');
  const need = rupees(await txt('#sipBig'));
  expect(Math.abs(need - 5000) <= 1, 'goal of ₹11,61,695 in 10 years at 12% needs ₹5,000 a month, got ' + need);
  await page.click('#sipMode button[data-v="grow"]');
  await fill('#sipYrs', '10.5');
  expect((await page.getAttribute('#sipYrs', 'aria-invalid')) === 'true' && (await txt('#sipYrs-h')) === t('err_whole'), 'SIP years must be whole: ' + await txt('#sipYrs-h'));
  /* absurdly large results still stay inside the card */
  await fill('#sipYrs', '50'); await fill('#sipAmt', '10Cr'); await fill('#sipStep', '50'); await fill('#sipRet', '50');
  const fitSip = await page.evaluate(() => { const c = document.querySelector('#sipRes'); return { cls: document.querySelector('#sipBig').className, ok: c.scrollWidth <= c.clientWidth + 1 }; });
  expect(fitSip.ok && /long/.test(fitSip.cls), 'a huge SIP value fits in its card ' + JSON.stringify(fitSip));
  await fill('#sipAmt', '5000'); await fill('#sipStep', '0'); await fill('#sipRet', '12'); await fill('#sipYrs', '10');
  expect((await txt('#sipBig')) === '₹11,61,695', 'SIP back to ₹11,61,695');

  /* ---------------- FD 1 lakh at 7% for 5 years, quarterly compounding -> Rs 1,41,478 */
  await page.click('#tab-fd');
  await settle();
  await fill('#fdAmt', '100000');
  await fill('#fdRate', '7');
  await fill('#fdYrs', '5');
  await fill('#fdMos', '0');
  expect((await txt('#fdBig')) === '₹1,41,478', 'FD 1 lakh at 7% for 5 years = ₹1,41,478, got ' + await txt('#fdBig'));
  await page.click('#fdKind button[data-v="rd"]');
  await settle();
  await fill('#rdAmt', '1000');
  await fill('#rdRate', '7');
  await fill('#rdN', '12');
  expect((await txt('#fdBig')) === '₹12,462', 'RD 1,000 x 12 at 7% = ₹12,462, got ' + await txt('#fdBig'));
  await page.click('#fdKind button[data-v="fd"]');
  /* senior citizen, monthly income: 5 lakh at 7.25% + 0.5% -> discounted monthly payout P(r/4) / (1 + (1+r/12) + (1+r/12)^2) = ₹3,208 */
  await fill('#fdAmt', '5,00,000'); await fill('#fdRate', '7.25'); await fill('#fdYrs', '3');
  await page.selectOption('#fdPayout', 'month');
  await page.check('#fdSenior');
  await settle();
  expect((await txt('#fdBig')) === '₹3,208', 'senior monthly payout on 5 lakh at 7.75% is ₹3,208, got ' + await txt('#fdBig'));
  await fill('#fdYrs', '1.5');
  expect((await txt('#fdTenureHint')) === t('err_whole_tenure'), 'FD fractional years are explained, got ' + await txt('#fdTenureHint'));
  await page.uncheck('#fdSenior'); await page.selectOption('#fdPayout', 'cum');
  await fill('#fdYrs', '5'); await fill('#fdAmt', '100000'); await fill('#fdRate', '7');
  expect((await txt('#fdBig')) === '₹1,41,478', 'FD back to ₹1,41,478');

  /* ---------------- PPF 1.5 lakh a year at 7.1% for 15 years -> Rs 40,68,209 */
  await page.click('#tab-ppf');
  await settle();
  await fill('#ppfAmt', '150000');
  await fill('#ppfRate', '7.1');
  expect((await txt('#ppfBig')) === '₹40,68,209', 'PPF 1.5 lakh x 15 years at 7.1% = ₹40,68,209, got ' + await txt('#ppfBig'));
  await fill('#ppfAmt', '200000');
  expect((await txt('#ppfBig')) === '₹40,68,209', 'deposits above the ₹1.5 lakh limit are not counted');
  expect((await txt('#ppfAmt-h')) === t('ppf_over'), 'warns about the ₹1.5 lakh limit');
  await fill('#ppfAmt', '150000');

  /* ---------------- saved on this device, even when the page is reloaded right after typing */
  await page.waitForTimeout(400);
  await page.fill('#ppfRate', '7.3');
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(700);
  expect((await page.getAttribute('#tab-ppf', 'aria-selected')) === 'true', 'the last tab is remembered after a reload');
  expect((await page.inputValue('#ppfRate')) === '7.3', 'a value typed just before the reload is kept, got ' + await page.inputValue('#ppfRate'));
  await page.click('#tab-emi');
  await settle();
  expect((await txt('#emiBig')) === '₹8,678', 'loan inputs are remembered after a reload');
  /* a shared link (#c=...) reopens that exact calculation and is then removed from the address bar */
  const packed = await page.evaluate(() => EDU.pack({ tab: 'emi', emiAmt: '45,00,000', emiRate: '8.75', emiYrs: '25', emiMos: '0', pp: [], rc: [] }));
  const here = page.url().split('#')[0];
  await page.goto('about:blank');
  await page.goto(here + '#c=' + packed, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  expect((await txt('#emiBig')) === '₹36,996' && !(await page.evaluate(() => location.hash)), 'link opens 45 lakh at 8.75% for 25 years = ₹36,996, got ' + await txt('#emiBig'));
  log('EMI', emi85, '0% EMI', emi, 'SIP', sip, 'flat→real', real, 'APR', apr);
};
