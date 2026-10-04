/* Interaction test for attendance-register (run by tools/verify.js in en and hi). */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, log }) {
  const rowsOf = () => page.$$eval('#stu-list .srow', r => r.map(x => [x.querySelector('.r').value, x.querySelector('.nm').value]));
  const pick = (buffer, name, mime) => ({ name, mimeType: mime, buffer: Buffer.from(buffer, 'utf8') });

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
  let rows = await rowsOf();
  expect(rows.length === 3, '3 students added (header skipped), got ' + JSON.stringify(rows));
  expect(rows[2][0] === '3' && rows[2][1] === 'Ravi Teja', 'name-only line gets the next roll no., got ' + JSON.stringify(rows[2]));

  // pasting the same list again must not create duplicates (bug fix)
  await page.fill('#paste-box', '1, Asha Kumari\n2, Bilal Ahmed');
  await page.click('#paste-add');
  rows = await rowsOf();
  expect(rows.length === 3, 'same roll + name pasted twice is added once, got ' + rows.length);

  // keyboard editing: change a roll no. so the list re-sorts, then Tab → focus lands in the same
  // student's name box (bug fix: the re-render used to drop the focus to <body>)
  const focusInfo = () => page.evaluate(() => { const a = document.activeElement, r = a && a.closest('.srow'); return r ? a.className.split(' ')[0] + '|' + r.querySelector('.nm').value : a.tagName; });
  await page.click('#stu-list .srow:nth-child(1) .r');
  await page.fill('#stu-list .srow:nth-child(1) .r', '9');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(80);
  let foc = await focusInfo();
  expect(foc === 'nm|Asha Kumari', 'focus stays on the edited student after Tab, got ' + foc);
  rows = await rowsOf();
  expect(rows[2][0] === '9' && rows[2][1] === 'Asha Kumari', 'list re-sorted by roll no.: ' + JSON.stringify(rows));
  await page.keyboard.press('Shift+Tab');
  foc = await focusInfo();
  expect(foc === 'r|Asha Kumari', 'Shift+Tab goes back to the same roll box, got ' + foc);
  await page.keyboard.press('Control+A');
  await page.keyboard.type('1');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(80);
  rows = await rowsOf();
  expect(rows[0][0] === '1' && rows[0][1] === 'Asha Kumari', 'roll no. typed back: ' + JSON.stringify(rows[0]));

  // class name typed and left without pressing Save is kept (bug fix)
  await page.fill('#cls-name', 'Test 8 C');
  await page.click('#tab-day');
  const renamed = await page.$eval('#class-sel', s => s.options[s.selectedIndex].textContent);
  expect(renamed.includes('Test 8 C'), 'class name kept without pressing Save: ' + renamed);

  // 2) daily marking on Monday 14 Sep 2026
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
  // full cycle: Present → Absent → Late → Leave → not marked → Present
  const t3 = '#day-grid .stu:nth-child(3)';
  const seq = [];
  for (let i = 0; i < 5; i++) { await page.click(t3); seq.push(await page.getAttribute(t3, 'data-st')); }
  expect(seq.join(',') === 'A,T,V,,P', 'tap cycle P→A→T→V→none→P, got ' + seq.join(','));

  // an emptied date box snaps back to the shown date (bug fix)
  await page.fill('#day-date', '');
  await page.click('#day-long');
  expect(await page.inputValue('#day-date') === '2026-09-14', 'empty date box restored');

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

  // tap a cell in the month grid: student 1, day 15 (index 14) A → T (late) => 50%; footer + tiles follow
  await page.click('#month-table tbody tr:nth-child(1) .mc[data-i="14"]');
  const p1 = await page.$eval('#month-table tbody tr:nth-child(1) td.pct', td => td.textContent.trim());
  expect(p1.startsWith('50'), 'editing a month cell updates %: ' + p1);
  const lowNow = await page.$eval('#month-table tbody tr:nth-child(1)', tr => tr.classList.contains('low'));
  expect(lowNow, 'row at 50% is still highlighted');
  const foot15 = await page.$eval('#month-table tfoot tr', tr => tr.children[15].textContent.trim());
  expect(foot15 === '3', '"present each day" footer for 15 Sep counts the late student: ' + foot15);
  expect((await page.textContent('#m-avg')).includes('83.3'), 'class average (50+100+100)/3 = 83.3%: ' + await page.textContent('#m-avg'));
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-i'));
  expect(focused === '14', 'focus stays on the edited cell');

  // toggle 13 Sep (Sunday) is a holiday column
  const sunHol = await page.$eval('#month-table .dh[data-date="2026-09-13"]', b => b.closest('th').classList.contains('hol'));
  expect(sunHol, 'Sunday column is shaded as holiday');

  // minimum % option: 40% → nobody below
  await page.fill('#opt-min', '40');
  await page.dispatchEvent('#opt-min', 'change');
  expect((await page.textContent('#m-below')).trim() === '0', 'min 40% → 0 below');
  await page.fill('#opt-min', '-5');
  await page.dispatchEvent('#opt-min', 'change');
  expect(await page.inputValue('#opt-min') === '75', 'invalid min % falls back to 75');

  // print: rows hidden by the search box are still printed, date labels are plain text (bug fixes)
  await page.fill('#m-search', 'asha');
  expect(await page.$$eval('#month-table tbody tr', r => r.filter(x => !x.hidden).length) === 1, 'month search filters rows');
  await page.emulateMedia({ media: 'print' });
  const printed = await page.$$eval('#month-table tbody tr', r => r.filter(x => getComputedStyle(x).display !== 'none').length);
  const pd = await page.$$eval('#month-table thead .pd', s => s.filter(x => getComputedStyle(x).display !== 'none').length);
  const headShown = await page.$eval('.print-head', e => getComputedStyle(e).display !== 'none');
  await page.emulateMedia({ media: 'screen' });
  expect(printed === 3, 'print shows every student even with a search: ' + printed);
  expect(pd === 30, 'print header shows 30 day labels for September: ' + pd);
  expect(headShown, 'print header (school / class / month) is shown when printing');
  await page.fill('#m-search', '');

  // 4) CSV export (a formula-looking name is neutralised)
  await page.click('#tab-students');
  await page.fill('#one-name', '=1+1');
  await page.click('#one-add');
  await page.click('#tab-month');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#export-csv')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  expect(csv.includes('Asha Kumari') && csv.includes('Ravi Teja'), 'CSV contains student names');
  const ashaLine = csv.split(/\r?\n/).find(l => l.includes('Asha Kumari'));
  expect(/,50(\.0)?$/.test(ashaLine), 'CSV row ends with 50%: ' + ashaLine.slice(-40));
  expect(csv.includes(",'=1+1,") && !/,=1\+1,/.test(csv), 'formula-like name is prefixed with an apostrophe');
  log('csv ok, ' + csv.length + ' bytes');

  // re-importing this app's own CSV into a new class adds exactly the students (no "Roll" / footer rows) (bug fix)
  await page.click('#tab-students');
  await page.fill('#new-class-name', 'Copy');
  await page.click('#add-class');
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#import-csv')]);
  await fc.setFiles(pick(csv.replace(/^﻿/, ''), 'export.csv', 'text/csv'));
  await page.waitForTimeout(300);
  rows = await rowsOf();
  expect(rows.length === 4 && rows[0][1] === 'Asha Kumari' && rows.every(r => !/^(Roll|रोल|Present each day|हर दिन उपस्थित)$/.test(r[1])), 'own CSV re-imports cleanly: ' + JSON.stringify(rows));
  // a localized one-word header line ("नाम") is skipped, not added as a student
  await page.fill('#paste-box', 'नाम\nचेतन\nदीपा');
  await page.click('#paste-add');
  rows = await rowsOf();
  expect(rows.length === 6 && !rows.some(r => r[1] === 'नाम'), 'Hindi header line skipped: ' + rows.length);
  await page.click('#cls-del');
  expect(await page.$$eval('#class-sel option', o => o.length) === 2, 'class deleted');

  // 5) backup → restore round trip, and a crafted backup can't break the app
  await page.selectOption('#class-sel', { index: 1 });
  const [bk] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#backup-btn')]);
  const backup = fs.readFileSync(await bk.path(), 'utf8');
  const parsed = JSON.parse(backup);
  expect(parsed.app === 'attendance-register' && parsed.classes.length === 2, 'backup has 2 classes');
  const evil = JSON.stringify({ app: 'attendance-register', meta: { active: '__proto__', minPct: 'x' }, classes: [{ id: '__proto__', name: { a: 1 }, students: [{ id: 'toString', roll: {}, name: 'Zed' }], marks: { '2026-09-14': { toString: 'P' } } }] });
  const [fc2] = await Promise.all([page.waitForEvent('filechooser'), page.click('#restore-btn')]);
  await fc2.setFiles(pick(evil, 'evil.json', 'application/json'));
  await page.waitForTimeout(300);
  await page.click('#tab-day');
  await page.click('#tab-students');
  rows = await rowsOf();
  expect(rows.length === 1 && rows[0][1] === 'Zed', 'crafted backup restored safely: ' + JSON.stringify(rows));
  const [fc3] = await Promise.all([page.waitForEvent('filechooser'), page.click('#restore-btn')]);
  await fc3.setFiles(pick(backup, 'backup.json', 'application/json'));
  await page.waitForTimeout(300);
  expect(await page.$$eval('#class-sel option', o => o.length) === 2, 'real backup restored: 2 classes');

  // 6) survives reload
  await page.selectOption('#class-sel', { index: 1 });
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForTimeout(800);
  const opts2 = await page.$$eval('#class-sel option', o => o.length);
  expect(opts2 === 2, 'classes saved across reload, got ' + opts2);
  await page.click('#tab-month');
  const nRows = await page.$$eval('#month-table tbody tr', r => r.length);
  expect(nRows === 4, 'students saved across reload, got ' + nRows);

  // 7) the sample class is app content, so it follows a language switch (bug fix)
  await page.selectOption('#class-sel', { index: 0 });
  const other = lang === 'hi' ? 'en' : 'hi';
  const before = await page.$eval('#class-sel', s => s.options[0].textContent);
  await page.selectOption('#edu-lang', other);
  await page.waitForTimeout(200);
  const after = await page.$eval('#class-sel', s => s.options[0].textContent);
  await page.selectOption('#edu-lang', lang);
  await page.waitForTimeout(200);
  const back = await page.$eval('#class-sel', s => s.options[0].textContent);
  expect(after !== before && back === before, 'sample class name follows the language: ' + [before, after, back].join(' / '));
  await page.selectOption('#class-sel', { index: 1 });
  await page.click('#tab-month');
  await page.click('#m-prev');
  await page.click('#m-next');
};
