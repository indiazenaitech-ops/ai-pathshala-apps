/* Interaction test for expense-tracker, run by tools/verify.js in en and hi.
   Adds 3 expenses + 1 income, checks totals and savings rate, sets a food budget past 80%,
   exports CSV, deletes one entry and checks that totals update. */
const fs = require('fs');
module.exports = async function ({ page, expect, t }) {
  const txt = async (sel) => (await page.textContent(sel)).replace(/\s+/g, ' ').trim();

  // sample entries are shown on first open; remove them
  expect(await page.isVisible('#sample-box'), 'sample notice is visible on first open');
  await page.click('#sample-remove');
  expect(await txt('#d-spent') === '₹0', 'spent is ₹0 after removing samples, got ' + await txt('#d-spent'));

  async function add(kind, cat, amt, note) {
    await page.click('#tab-add');
    await page.click(`#f-kind button[data-v="${kind}"]`);
    await page.click(`#f-cats .chip[data-c="${cat}"]`);
    await page.fill('#f-amt', amt);
    await page.fill('#f-note', note);
    await page.click('#f-save');
    await page.waitForTimeout(80);
  }
  await add('e', 'food', '600', 'Lunch');
  await add('e', 'groc', '1,300.50', 'Ration');
  await add('e', 'travel', '99.50', 'Auto');
  await add('i', 'salary', '20000', 'Salary');

  // 600 + 1300.50 + 99.50 = 2000 spent, 20000 income, 18000 saved, 90% rate
  expect(await txt('#d-spent') === '₹2,000', 'spent should be ₹2,000, got ' + await txt('#d-spent'));
  expect(await txt('#d-income') === '₹20,000', 'income should be ₹20,000, got ' + await txt('#d-income'));
  expect(await txt('#d-saved') === '₹18,000', 'saved should be ₹18,000, got ' + await txt('#d-saved'));
  expect(await txt('#d-rate') === '90%', 'savings rate should be 90%, got ' + await txt('#d-rate'));
  expect((await page.$$('#recent .erow')).length === 4, 'recent list shows 4 entries');

  // food budget ₹700: 600 spent = 85.7% -> warning
  await page.click('#tab-bud');
  await page.fill('#b-food', '700');
  await page.press('#b-food', 'Tab');
  await page.waitForTimeout(100);
  expect(await page.isVisible('#alerts .alert-warn[data-cat="food"]'), 'food budget warning shown above 80%');
  expect(await page.$('#b-rows .brow[data-k="food"] .progress.warn') !== null, 'food progress bar is in warning state');

  // CSV export contains the entries
  await page.click('#tab-data');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#csv-all')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  expect(csv.includes('1300.50') && csv.includes('99.50') && csv.includes('20000.00'), 'CSV has the amounts');
  expect(csv.includes(t('c_food')) && csv.includes('Ration'), 'CSV has category names and notes');
  expect(csv.trim().split(/\r?\n/).length === 5, 'CSV has a header + 4 rows');

  // delete the groceries entry -> totals update
  await page.click('#tab-list');
  await page.selectOption('#l-cat', 'groc');
  const rows = await page.$$('#l-rows .erow');
  expect(rows.length === 1, 'filter by category shows 1 row, got ' + rows.length);
  await rows[0].click();
  await page.click('#f-del');
  await page.waitForTimeout(80);
  expect(await txt('#d-spent') === '₹699.50', 'spent should be ₹699.50 after delete, got ' + await txt('#d-spent'));
  expect(await txt('#d-rate') === '96.5%', 'rate should be 96.5% after delete, got ' + await txt('#d-rate'));
  // food is still at 600/700 -> warning stays
  expect(await page.isVisible('#alerts .alert-warn[data-cat="food"]'), 'warning remains after deleting another category');

  // undo brings it back
  await page.click('#undo-btn');
  expect(await txt('#d-spent') === '₹2,000', 'undo restores the deleted entry');
};
