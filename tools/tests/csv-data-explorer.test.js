/* Interaction test for Data Explorer (run by tools/verify.js in en and hi). */
const fs = require('fs');
module.exports = async function ({ page, lang, expect }) {
  const stat = (col, key) => page.$eval(`#cards [data-col="${col}"] dd[data-stat="${key}"]`, el => +el.dataset.v).catch(() => NaN);

  /* 1. class marks sample: Maths is column 5 (index 4). Hand values:
        78+92+45+67+88+56+28+99+72+61+83+49+95+70+58+81 = 1122, 1122 / 16 = 70.125; middle of 70 and 72 = 71 */
  await page.click('[data-sample="marks"]');
  await page.waitForSelector('#cards [data-col="4"]');
  const mean = await stat(4, 'st_mean');
  expect(Math.abs(mean - 70.125) < 1e-9, 'mean of Maths should be 70.125, got ' + mean);
  expect(await stat(4, 'st_median') === 71, 'median of Maths should be 71');
  expect(await stat(4, 'st_sum') === 1122, 'sum of Maths should be 1122');
  expect(await stat(4, 'st_min') === 28 && await stat(4, 'st_max') === 99, 'min 28, max 99');
  /* missing: Science has 2 blanks, English has one "N/A" */
  expect(await stat(5, 'st_missing') === 2, 'Science missing should be 2, got ' + await stat(5, 'st_missing'));
  expect(await stat(6, 'st_missing') === 1, 'English missing (N/A) should be 1');
  expect(await stat(6, 'st_count') === 15, 'English should have 15 values');
  const badge = await page.$eval('#cards [data-col="3"] .badge', el => el.className);
  expect(/dx-badge-date/.test(badge), 'date of birth detected as a date column');
  expect(/dx-badge-bool/.test(await page.$eval('#cards [data-col="8"] .badge', el => el.className)), 'Passed detected as yes/no');
  const sum = await page.textContent('#summary');
  expect(/16/.test(sum) && /9/.test(sum) && /2\.1%/.test(sum), 'summary shows 16 rows, 9 columns, 2.1% missing: ' + sum);

  /* 2. table: filter Maths between 70 and 100 → 9 students */
  await page.click('#tab-table');
  await page.selectOption('#f-col', '4');
  await page.selectOption('#f-op', 'between');
  await page.fill('#f-a', '70');
  await page.fill('#f-b', '100');
  await page.click('#f-add');
  let rows = await page.$$eval('#table tbody tr', r => r.length);
  expect(rows === 9, 'Maths 70–100 should leave 9 rows, got ' + rows);
  /* sort Maths: first click low→high, second high→low */
  await page.click('#table th button[data-sort="4"]');
  await page.click('#table th button[data-sort="4"]');
  const first = await page.$eval('#table tbody tr td:nth-child(6)', td => td.textContent);
  expect(first === '99', 'sorted high→low, first Maths should be 99, got ' + first);
  /* add "missing" filter on Science → 0 rows left (both blanks have Maths < 70? row 3 = 45, row 10 = 61) */
  await page.selectOption('#f-col', '5');
  await page.selectOption('#f-op', 'missing');
  await page.click('#f-add');
  rows = await page.$$eval('#table tbody tr', r => r.length);
  expect(rows === 0, 'no student with Maths ≥ 70 has a blank Science mark, got ' + rows);
  /* remove the first filter → 2 rows with Science missing */
  await page.click('#chips .dx-chip button');
  rows = await page.$$eval('#table tbody tr', r => r.length);
  expect(rows === 2, 'Science missing should be 2 rows, got ' + rows);

  /* export the filtered rows */
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
  const text = fs.readFileSync(await dl.path(), 'utf8').replace(/^﻿/, '');
  const lines = text.trim().split(/\r?\n/);
  expect(lines.length === 3, 'exported CSV should have header + 2 rows, got ' + lines.length);

  /* 3. correlation tab: 5 number columns → 25 squares */
  await page.click('#tab-corr');
  const cells = await page.$$eval('#corr-body .dx-corr td button', b => b.length);
  expect(cells === 25, 'correlation grid should be 5 × 5, got ' + cells);
  await page.click('#corr-body .dx-corr tbody tr:nth-child(2) td:nth-child(4) button');
  const reading = await page.textContent('.dx-reading');
  expect(/r = 0\.\d\d/.test(reading), 'reading in words with r: ' + reading);

  /* 4. pasted ragged CSV with Indian money: ₹1,20,000 → 120000; ragged rows padded */
  await page.click('#tab-cols');
  await page.click('#paste-btn');
  await page.fill('#paste', 'Item;Amount;Note\nPen;"₹1,20,000";a\nBook;500;b;extra\nBag\n');
  await page.click('#paste-use');
  await page.waitForFunction(() => document.querySelectorAll('#cards .dx-card').length === 4);
  expect(await stat(1, 'st_sum') === 120500, 'Amount sum should be 120500, got ' + await stat(1, 'st_sum'));
  expect(await stat(1, 'st_missing') === 1, 'Bag has no amount → 1 missing');
  const notes = await page.textContent('#notes');
  expect(/;/.test(notes) && /2/.test(notes), 'separator ; and 2 ragged rows reported: ' + notes);

  /* 5. empty paste → friendly message, previous data kept */
  await page.fill('#paste', '   \n  ');
  await page.click('#paste-use');
  expect(!(await page.$eval('#msg', m => m.hidden)), 'empty data shows a message');
  expect(await page.$$eval('#cards .dx-card', c => c.length) === 4, 'previous dataset kept');
};
