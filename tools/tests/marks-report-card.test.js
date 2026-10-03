/* Interaction test for Marks & Report Cards (run by tools/verify.js in en and hi).
   Uses ids / data-* attributes only, so it works in every language. */
const fs = require('fs');

module.exports = async function ({ page, expect, t, log }) {
  const val = (roll, sel) => page.$eval(`#marks-body tr[data-roll="${roll}"] ${sel}`, (td) => td.getAttribute('data-val'));

  /* 1) sample class: 8 students, totals, grades, shared ranks, pass/fail */
  await page.waitForSelector('#marks-body tr', { timeout: 10000 });
  const n = await page.$$eval('#marks-body tr', (trs) => trs.length);
  expect(n === 8, 'sample class should have 8 students, got ' + n);
  expect(await val(2, '.c-total') === '517', 'roll 2 total should be 517');
  expect(await val(2, '.c-grade') === 'A1', 'roll 2 (94%) should be A1');
  expect(await val(2, '.c-rank') === '1', 'roll 2 should be rank 1');
  expect(await val(3, '.c-rank') === '2' && await val(6, '.c-rank') === '2', 'equal totals (481) must share rank 2');
  expect(await val(1, '.c-rank') === '4', 'after a tie the next rank is 4');
  expect(await val(7, '.c-result') === 'fail', 'roll 7 is below 33% in one subject → fail');
  expect(await val(5, '.c-result') === 'fail', 'roll 5 is absent (AB) in one subject → fail');
  expect(await val(8, '.c-pct') === '64.73', 'roll 8: 356/550 = 64.73%, got ' + await val(8, '.c-pct'));

  /* 2) validation + keyboard navigation */
  const cell = (r, s) => `#marks-body tr[data-roll="${r}"] input.mk[data-s="${s}"]`;
  await page.fill(cell(1, 0), '150');
  expect(await page.$eval(cell(1, 0), (e) => e.classList.contains('bad') && e.getAttribute('aria-invalid') === 'true'), 'mark above max is flagged red');
  expect(await val(1, '.c-result') === 'inc', 'a row with an invalid mark is incomplete');
  await page.fill(cell(1, 0), '100');
  await page.press(cell(1, 0), 'Enter');
  const act = await page.evaluate(() => ({ r: document.activeElement.dataset.r, c: document.activeElement.dataset.c }));
  expect(act.r === '1' && act.c === '2', 'Enter moves to the next student in the same subject, got ' + JSON.stringify(act));
  await page.fill(cell(1, 1), '100');
  await page.fill(cell(1, 2), '100');
  expect(await val(1, '.c-total') === '490', 'roll 1 total after edits should be 490, got ' + await val(1, '.c-total'));
  expect(await val(1, '.c-rank') === '2' && await val(3, '.c-rank') === '3' && await val(6, '.c-rank') === '3', 'ranks re-computed after editing');

  /* 3) analysis */
  await page.click('#tab-analysis');
  await page.waitForSelector('#an-pass');
  expect(await page.$eval('#an-pass', (e) => e.getAttribute('data-val')) === '6', '6 of 8 students pass');
  expect(await page.$eval('#an-bars .bar-col[data-grade="A2"]', (e) => e.getAttribute('data-count')) === '3', 'three A2 grades in the chart');
  expect(await page.$$eval('#an-top li', (li) => li.length) === 4, 'top 3 list has 4 students (two share rank 3)');
  expect(await page.$$eval('#an-support li', (li) => li.length) === 2, 'two students need support');

  /* 4) report cards + print all (window.print stubbed) */
  await page.click('#tab-cards');
  await page.waitForSelector('#rc-preview .rc');
  await page.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  await page.click('#rc-print-all');
  await page.waitForFunction(() => window.__printed === 1, null, { timeout: 5000 });
  const cards = await page.$$eval('#print-root .rc', (c) => c.length);
  expect(cards === 8, 'print all builds one report card per student, got ' + cards);

  /* 5) new class + paste a table copied from Excel (tab separated, with header) */
  await page.click('#new-class');
  await page.fill('#nc-name', 'Test 6-B');
  await page.check('#nc-mode-blank');
  await page.click('#nc-create');
  await page.waitForSelector('#panel-setup:not([hidden])');
  await page.click('#subj-list .subj-row button');
  await page.fill('#paste', 'Roll\tName\tMaths (50)\tScience (50)\n1\tRiya\t45\t40\n2\tKaran\t30\t49\n3\tSita\t45\t40\n4\tDev\t10\tAB\n');
  await page.click('#add-students');
  await page.waitForSelector('#panel-marks:not([hidden])');
  const n2 = await page.$$eval('#marks-body tr', (trs) => trs.length);
  expect(n2 === 4, 'pasted table should create 4 students, got ' + n2);
  expect(await val(1, '.c-total') === '85' && await val(1, '.c-rank') === '1' && await val(3, '.c-rank') === '1', 'tied toppers share rank 1');
  expect(await val(2, '.c-rank') === '3', 'next rank after a two-way tie is 3');
  expect(await val(4, '.c-result') === 'fail', 'Dev (10/50 and AB) fails');
  const classes = await page.$$eval('#class-select option', (o) => o.length);
  expect(classes === 2, 'two classes saved, got ' + classes);

  /* 6) CSV export */
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#export-csv')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8').replace(/^﻿/, '');
  const lines = csv.split(/\r\n/);
  expect(lines.length === 5, 'CSV has header + 4 rows, got ' + lines.length);
  expect(lines[0].includes(t('col_total')) && lines[0].includes('Maths (50)'), 'CSV header has subjects and total');
  expect(/^1,Riya,45,40,85,85\.00,A2,1,/.test(lines[1]), 'CSV row for Riya: ' + lines[1]);
  log('csv ok: ' + lines[1]);
};
