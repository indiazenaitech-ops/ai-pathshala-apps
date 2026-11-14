/* Interaction test for Monthly Budget Planner (run by tools/verify.js in en and hi).
   Every expected figure below was worked out by hand, not read back from the app. */
module.exports = async function ({ page, expect, t }) {
  const settle = () => page.waitForTimeout(120);
  const txt = async (sel) => (await page.textContent(sel)).replace(/\s/g, '');
  const sums = async () => ({ inc: await txt('#sIncome'), plan: await txt('#sPlanned'), spent: await txt('#sSpent'), lp: await txt('#sLeftPlan'), ln: await txt('#sLeftNow') });
  const same = (a, b, msg) => expect(JSON.stringify(a) === JSON.stringify(b), msg + ': got ' + JSON.stringify(a));
  const addExp = async (amt, cat, note) => {
    await page.fill('#qAmt', amt); await page.selectOption('#qCat', cat); await page.fill('#qNote', note || ''); await page.click('#btnAddExp'); await settle();
  };

  // 1. made-up sample month: income 42,000 + 3,000; plan 12,000+8,000+5,000+2,500+3,000+4,000+1,500+5,000+2,000 = 43,000;
  //    spent 12,000+5,000+4,000+3,000+2,350+1,450+640+1,800 = 30,240; savings 3,000 of goal 5,000 = 60%
  await page.waitForSelector('#catList .mb-row');
  expect(await page.isVisible('#sampleNote'), 'sample note is shown');
  same(await sums(), { inc: '₹45,000', plan: '₹43,000', spent: '₹30,240', lp: '₹2,000', ln: '₹14,760' }, 'sample totals');
  expect((await page.getAttribute('#goalText', 'data-pct')) === '60', 'sample goal is 60%');
  expect((await page.$$('#txList .mb-tx')).length === 8, 'sample has 8 entries');
  expect(await page.$eval('#chart', c => c.height > 100), 'chart is drawn');

  // 2. the first edit removes the sample and keeps what was typed
  await page.fill('#plan-rent', '10000'); await settle();
  expect(!(await page.isVisible('#sampleNote')), 'sample note gone after first edit');
  same(await sums(), { inc: '₹0', plan: '₹10,000', spent: '₹0', lp: '−₹10,000', ln: '₹0' }, 'after first edit');
  expect((await page.$$('#txList .mb-tx')).length === 0, 'sample entries gone');
  expect((await page.inputValue('#plan-rent')) === '10000', 'typed value kept');

  // 3. Indian number format and paise: income 1,00,000; plan 10,000 + 6,500.50 = 16,500.50; left 83,499.50
  await page.fill('#incAmt-i1', '1,00,000'); await page.fill('#plan-groceries', '6500.50'); await settle();
  same(await sums(), { inc: '₹1,00,000', plan: '₹16,500.50', spent: '₹0', lp: '₹83,499.50', ln: '₹1,00,000' }, 'income and plan');

  // 4. daily expenses roll into "spent": 1,250 + 499.50 groceries, 12,000 rent = 13,749.50; left now 86,250.50
  await addExp('1250', 'groceries', 'Sabzi'); await addExp('499.50', 'groceries', ''); await addExp('12000', 'rent', '');
  same(await sums(), { inc: '₹1,00,000', plan: '₹16,500.50', spent: '₹13,749.50', lp: '₹83,499.50', ln: '₹86,250.50' }, 'after 3 expenses');
  expect((await page.getAttribute('#catList .mb-row[data-cat="groceries"]', 'data-spent')) === '174950', 'groceries spent 1,749.50');
  expect((await page.textContent('#diff-rent')).trim() === t('over_n', { amt: '₹2,000' }), 'rent is over by 2,000: ' + await page.textContent('#diff-rent'));
  expect((await page.textContent('#diff-groceries')).trim() === t('left_n', { amt: '₹4,751' }), 'groceries has 4,751 left: ' + await page.textContent('#diff-groceries'));

  // 5. empty, negative and non-number amounts are refused; a huge amount is capped at ₹100 crore
  for (const bad of ['', '-50', 'abc', '0']) {
    await page.fill('#qAmt', bad); await page.click('#btnAddExp'); await settle();
    expect((await page.textContent('#qMsg')).trim() === t('err_amount'), 'error for "' + bad + '"');
  }
  expect((await page.$$('#txList .mb-tx')).length === 3, 'still 3 entries');
  await page.fill('#plan-travel', '-700'); await settle();
  expect((await txt('#sPlanned')) === '₹16,500.50', 'negative plan counts as 0');
  await page.fill('#plan-travel', '99999999999999'); await settle();
  expect((await txt('#sPlanned')) === '₹1,00,00,16,500.50', 'huge plan capped: ' + await txt('#sPlanned'));
  await page.fill('#plan-travel', ''); await settle();

  // 6. savings goal: 2,000 saved of 5,000 = 40%; total spent 15,749.50
  await page.fill('#goal', '5000'); await addExp('2000', 'savings', '');
  expect((await page.getAttribute('#goalText', 'data-pct')) === '40', 'goal 40%');
  expect((await txt('#sSpent')) === '₹15,749.50', 'spent with savings');

  // 7. add and rename a category
  await page.click('#btnAddCat'); await settle();
  expect((await page.$$('#catList .mb-row')).length === 10, '10 categories');
  await page.fill('#catList .mb-row:last-child .mb-name', 'Milk'); await settle();
  expect((await page.$eval('#qCat option:last-child', o => o.textContent)) === 'Milk', 'renamed category in the list');

  // 8. next month is empty; copying last month's plan brings income + plan, not the expenses
  await page.click('#btnNext'); await settle();
  same(await sums(), { inc: '₹0', plan: '₹0', spent: '₹0', lp: '₹0', ln: '₹0' }, 'new month empty');
  await page.click('#btnCopyLast'); await settle();
  same(await sums(), { inc: '₹1,00,000', plan: '₹16,500.50', spent: '₹0', lp: '₹83,499.50', ln: '₹1,00,000' }, 'copied plan');
  expect((await page.inputValue('#goal')) === '5000', 'goal copied');

  // 9. CSV rows reconcile, and everything survives a reload
  await page.click('#btnPrev'); await settle();
  await page.click('#btnCsv'); await settle();
  const rows = await page.evaluate(() => window.__mbLastCsv);
  expect(rows.length === 1 + 1 + 10 + 4 + 5, 'CSV row count ' + rows.length);
  expect(rows[rows.length - 3][3] === '15749.50' && rows[rows.length - 1][3] === '84250.50', 'CSV totals ' + JSON.stringify(rows.slice(-3)));
  await page.click('#txList .mb-tx[data-amt="1200000"] [data-act="del-tx"]'); await settle();
  expect((await txt('#sSpent')) === '₹3,749.50', 'spent after deleting rent entry');
  await page.reload(); await page.waitForSelector('#catList .mb-row'); await settle();
  expect(!(await page.isVisible('#sampleNote')), 'no sample after reload');
  same(await sums(), { inc: '₹1,00,000', plan: '₹16,500.50', spent: '₹3,749.50', lp: '₹83,499.50', ln: '₹96,250.50' }, 'after reload');
};
