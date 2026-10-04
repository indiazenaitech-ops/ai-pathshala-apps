/* Interaction test for Marks & Report Cards (run by tools/verify.js in en and hi).
   Uses ids / data-* attributes only, so it works in every language. */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t, log }) {
  const val = (roll, sel) => page.$eval(`#marks-body tr[data-roll="${roll}"] ${sel}`, (td) => td.getAttribute('data-val'));
  const rows = () => page.$$eval('#marks-body tr', (trs) => trs.length);
  const clsText = () => page.$eval('#class-select', (s) => s.options[s.selectedIndex].text);
  const firstName = () => page.$eval('#marks-body tr input.nm', (i) => i.value);

  /* 0) the untouched sample class follows the language picker; it is in the page language at start */
  await page.waitForSelector('#marks-body tr', { timeout: 10000 });
  const C = await page.evaluate(() => window.APP_CONTENT);
  expect((await clsText()).startsWith(C[lang].cls), 'sample class is in the page language: ' + await clsText());
  const other = lang === 'hi' ? 'ta' : 'hi';
  await page.selectOption('#edu-lang', other);
  await page.waitForFunction((n) => document.querySelector('#marks-body tr input.nm').value === n, C[other].students[0], { timeout: 5000 });
  expect((await clsText()).startsWith(C[other].cls), 'untouched sample is re-made in the new language, got ' + await clsText());
  await page.selectOption('#edu-lang', lang);
  await page.waitForFunction((n) => document.querySelector('#marks-body tr input.nm').value === n, C[lang].students[0], { timeout: 5000 });
  expect(await firstName() === C[lang].students[0], 'sample switched back to ' + lang);

  /* 1) sample class: 8 students, totals, grades, shared ranks, pass/fail */
  const n = await rows();
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
  await page.fill(cell(1, 0), '-4');
  expect(await page.$eval(cell(1, 0), (e) => e.classList.contains('bad')), 'a negative mark is flagged red');
  await page.fill(cell(1, 0), '100');
  await page.press(cell(1, 0), 'Enter');
  const act = await page.evaluate(() => ({ r: document.activeElement.dataset.r, c: document.activeElement.dataset.c }));
  expect(act.r === '1' && act.c === '2', 'Enter moves to the next student in the same subject, got ' + JSON.stringify(act));
  await page.fill(cell(1, 1), '100');
  await page.fill(cell(1, 2), '१००');   // Devanagari digits typed on a Hindi keyboard
  expect(await val(1, '.c-total') === '490', 'roll 1 total after edits should be 490, got ' + await val(1, '.c-total'));
  expect(await val(1, '.c-rank') === '2' && await val(3, '.c-rank') === '3' && await val(6, '.c-rank') === '3', 'ranks re-computed after editing');
  /* Enter on the last filled name opens a new row; the empty row can be removed again */
  await page.press('#marks-body tr[data-roll="8"] input.nm', 'Enter');
  expect(await rows() === 9, 'Enter on the last name adds a row');
  expect(await page.evaluate(() => document.activeElement.classList.contains('nm') && document.activeElement.dataset.r === '8'), 'focus is on the new name cell');
  await page.click('#marks-body tr:last-child button.del');
  expect(await rows() === 8, 'empty row removed');

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
  await page.click('#print-sheet');
  await page.waitForFunction(() => window.__printed === 2, null, { timeout: 5000 });
  expect(await page.$$eval('#print-root .sheet-table:not(.sheet-sub) tbody tr', (r) => r.length) === 8, 'result sheet has one row per student');

  /* 5) new blank class + paste a table copied from Excel (tab separated, Hindi roll header).
        The blank "Subject 1" is NOT removed by hand: the paste must replace it. Two students share a name. */
  await page.click('#new-class');
  await page.fill('#nc-name', 'Test 6-B');
  await page.check('#nc-mode-blank');
  await page.click('#nc-create');
  await page.waitForSelector('#panel-setup:not([hidden])');
  await page.fill('#paste', 'अनुक्रमांक\tName\tMaths (50)\tScience (50)\n1\tRiya\t45\t40\n2\tKaran\t30\t49\n3\tSita\t45\t40\n4\tDev\t10\tAB\n5\tRiya\t16.499\t40\n');
  await page.click('#add-students');
  await page.waitForSelector('#panel-marks:not([hidden])');
  const n2 = await rows();
  expect(n2 === 5, 'pasted table should create 5 students (two named Riya), got ' + n2);
  const subs = await page.$$eval('#marks-head .c-sub', (th) => th.length);
  expect(subs === 2, 'the empty placeholder subject is replaced by the pasted subjects, got ' + subs + ' subject columns');
  expect(await val(1, '.c-total') === '85' && await val(1, '.c-rank') === '1' && await val(3, '.c-rank') === '1', 'tied toppers share rank 1');
  expect(await val(2, '.c-rank') === '3', 'next rank after a two-way tie is 3');
  expect(await val(4, '.c-result') === 'fail', 'Dev (10/50 and AB) fails');
  expect(await val(5, '.c-result') === 'pass', '16.499/50 shows as 33.00% and must pass, got ' + await val(5, '.c-result'));
  const classes = await page.$$eval('#class-select option', (o) => o.length);
  expect(classes === 2, 'two classes saved, got ' + classes);

  /* per-subject grade chart leaves the absent student out (like the subject average) */
  await page.click('#tab-analysis');
  await page.waitForSelector('#dist-sel');
  await page.selectOption('#dist-sel', { label: 'Science' });
  await page.waitForSelector('#an-bars');
  const dist = Object.fromEntries(await page.$$eval('#an-bars .bar-col', (b) => b.map((x) => [x.dataset.grade, x.dataset.count])));
  expect(dist.A1 === '1' && dist.B1 === '3' && dist.E === '0', 'Science (/50): 49 → A1, three 40s (80%) → B1, AB not counted as E; got ' + JSON.stringify(dist));

  /* 6) CSV export */
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#export-csv')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8').replace(/^﻿/, '');
  const lines = csv.split(/\r\n/);
  expect(lines.length === 6, 'CSV has header + 5 rows, got ' + lines.length);
  expect(lines[0].includes(t('col_total')) && lines[0].includes('Maths (50)'), 'CSV header has subjects and total');
  expect(/^1,Riya,45,40,85,85\.00,A2,1,/.test(lines[1]), 'CSV row for Riya: ' + lines[1]);
  log('csv ok: ' + lines[1]);

  /* 7) a plain list with the same name twice adds two students; pasting it again only updates */
  await page.click('#tab-setup');
  await page.fill('#paste', 'Meena\nMeena\n');
  await page.click('#add-students');
  await page.waitForSelector('#panel-marks:not([hidden])');
  expect(await rows() === 7, 'two students named Meena are both added, got ' + await rows());
  await page.click('#tab-setup');
  await page.fill('#paste', 'Meena\nMeena\n');
  await page.click('#add-students');
  await page.waitForSelector('#panel-marks:not([hidden])');
  expect(await rows() === 7, 're-pasting the same list updates instead of adding, got ' + await rows());

  /* 8) reload keeps the class, the tab and the marks */
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForSelector('#marks-body tr');
  expect(await rows() === 7 && (await clsText()).startsWith('Test 6-B'), 'class and students survive a reload');

  /* 9) storage full: the teacher is told instead of losing marks silently */
  await page.evaluate(() => {
    window.__setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (/marks-report-card/.test(k)) throw new DOMException('full', 'QuotaExceededError'); return window.__setItem.call(this, k, v); };
  });
  await page.fill('#marks-body tr[data-roll="2"] input.mk[data-s="0"]', '31');
  await page.waitForFunction((m) => [...document.querySelectorAll('.edu-toast')].some((x) => x.textContent === m), t('err_storage'), { timeout: 3000 });
  await page.evaluate(() => { Storage.prototype.setItem = window.__setItem; document.querySelectorAll('.edu-toast').forEach((x) => x.remove()); });
};
