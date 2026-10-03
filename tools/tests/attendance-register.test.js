/* Interaction test for attendance-register (run by tools/verify.js in en and hi). */
const fs = require('fs');

module.exports = async function ({ page, expect, log }) {
  // 0) sample class exists on first load
  const opts0 = await page.$$eval('#class-sel option', o => o.length);
  expect(opts0 === 1, 'one sample class on first load, got ' + opts0);

  // 1) create a new class and paste 3 students
  await page.click('#tab-students');
  await page.fill('#new-class-name', 'Test 8 B');
  await page.click('#add-class');
  const opts = await page.$$eval('#class-sel option', o => o.length);
  expect(opts === 2, 'two classes after adding, got ' + opts);
  const selText = await page.$eval('#class-sel', s => s.options[s.selectedIndex].textContent);
  expect(selText.includes('Test 8 B'), 'new class is selected: ' + selText);

  await page.fill('#paste-box', 'Roll, Name\n1, Asha Kumari\n2\tBilal Ahmed\nRavi Teja');
  await page.click('#paste-add');
  const rows = await page.$$eval('#stu-list .srow', r => r.map(x => [x.querySelector('.r').value, x.querySelector('.nm').value]));
  expect(rows.length === 3, '3 students added (header skipped), got ' + JSON.stringify(rows));
  expect(rows[2][0] === '3' && rows[2][1] === 'Ravi Teja', 'name-only line gets the next roll no., got ' + JSON.stringify(rows[2]));

  // 2) daily marking on Monday 14 Sep 2026
  await page.click('#tab-day');
  await page.fill('#day-date', '2026-09-14');
  await page.dispatchEvent('#day-date', 'change');
  const tiles = await page.$$eval('#day-grid .stu', b => b.length);
  expect(tiles === 3, '3 tiles on the daily view, got ' + tiles);
  await page.click('#all-present');
  expect((await page.textContent('#sum-P')).trim() === '3', 'all 3 present after "mark all present"');
  const t1 = '#day-grid .stu:nth-child(1)', t2 = '#day-grid .stu:nth-child(2)';
  await page.click(t1);
  expect(await page.getAttribute(t1, 'data-st') === 'A', 'first tap on a present student → absent');
  await page.click(t2); await page.click(t2);
  expect(await page.getAttribute(t2, 'data-st') === 'T', 'two taps → late');
  expect((await page.textContent('#sum-P')).trim() === '1' && (await page.textContent('#sum-A')).trim() === '1' && (await page.textContent('#sum-T')).trim() === '1', 'summary counts P1 A1 T1');

  // next day: student 1 absent again, others present
  await page.click('#day-next');
  expect(await page.inputValue('#day-date') === '2026-09-15', 'next day button moves the date');
  await page.click('#all-present');
  await page.click(t1);

  // search filter
  await page.fill('#day-search', 'bilal');
  const visible = await page.$$eval('#day-grid .stu', b => b.filter(x => !x.hidden).length);
  expect(visible === 1, 'search shows one student, got ' + visible);
  await page.fill('#day-search', '');

  // 3) monthly register: Sept 2026
  await page.click('#tab-month');
  expect((await page.textContent('#m-days')).trim() === '2', 'attendance taken on 2 days');
  const pcts = await page.$$eval('#month-table tbody tr', trs => trs.map(tr => [tr.classList.contains('low'), tr.querySelector('td.pct').textContent.trim()]));
  expect(pcts.length === 3, '3 rows in month table');
  expect(pcts[0][0] === true && pcts[0][1].startsWith('0'), 'student 1 (2 absences) is 0% and highlighted: ' + JSON.stringify(pcts[0]));
  expect(pcts[1][0] === false && pcts[1][1].startsWith('100'), 'late counts as present → 100%: ' + JSON.stringify(pcts[1]));
  expect((await page.textContent('#m-below')).trim() === '1', 'one student below 75%');

  // tap a cell in the month grid: student 1, day 15 (index 14) A → T (late) => 50%
  await page.click('#month-table tbody tr:nth-child(1) .mc[data-i="14"]');
  const p1 = await page.$eval('#month-table tbody tr:nth-child(1) td.pct', td => td.textContent.trim());
  expect(p1.startsWith('50'), 'editing a month cell updates %: ' + p1);

  // toggle 13 Sep (Sunday) is a holiday column
  const sunHol = await page.$eval('#month-table .dh[data-date="2026-09-13"]', b => b.closest('th').classList.contains('hol'));
  expect(sunHol, 'Sunday column is shaded as holiday');

  // 4) CSV export
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#export-csv')]);
  const p = await dl.path();
  const csv = fs.readFileSync(p, 'utf8');
  expect(csv.includes('Asha Kumari') && csv.includes('Ravi Teja'), 'CSV contains student names');
  const ashaLine = csv.split(/\r?\n/).find(l => l.includes('Asha Kumari'));
  expect(/,50(\.0)?$/.test(ashaLine), 'CSV row ends with 50%: ' + ashaLine.slice(-40));
  log('csv ok, ' + csv.length + ' bytes');

  // 5) survives reload
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForTimeout(800);
  const opts2 = await page.$$eval('#class-sel option', o => o.length);
  expect(opts2 === 2, 'classes saved across reload, got ' + opts2);
  await page.click('#tab-month');
  const nRows = await page.$$eval('#month-table tbody tr', r => r.length);
  expect(nRows === 3, 'students saved across reload');
};
