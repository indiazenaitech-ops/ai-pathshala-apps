/* Interaction test for Printable Calendar Maker (run by tools/verify.js in en and hi).
   Calendar facts used below (checked against a real calendar, not taken from the app):
     1 Jan 2027 = Friday, 1 Feb 2028 = Tuesday, 29 Feb 2028 = Tuesday, 14 Nov 2026 = Saturday, 1 Jan 2000 = Saturday,
     leap years: 2000, 2024, 2028; not leap: 1900, 2027, 2100.
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
const fs = require('fs');

module.exports = async function ({ page, expect, t }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const settle = () => page.waitForTimeout(120);
  const click = async (sel) => { await page.click(sel); await settle(); };
  const fill = async (sel, v) => { await page.fill(sel, String(v)); await settle(); };
  const count = (sel) => page.$$eval(sel, (a) => a.length);
  const setMonth = async (y, m) => { await fill('#year', y); await page.selectOption('#month', String(m)); await settle(); };
  /* number of real days on the first sheet, and the grid column (0-6) of day 1 */
  const monthInfo = () => page.$eval('#sheets .cm-month', (s) => {
    const cells = Array.from(s.querySelectorAll('.cm-day'));
    return { days: cells.filter((c) => !c.classList.contains('blank')).length, first: cells.findIndex((c) => !c.classList.contains('blank')), cells: cells.length,
      last: cells.filter((c) => !c.classList.contains('blank')).pop().getAttribute('data-date'), name: s.querySelector('.cm-mname').textContent, year: s.querySelector('.cm-yr').textContent,
      wd: Array.from(s.querySelectorAll('.cm-wd > div')).map((d) => d.textContent) };
  });
  const addEvent = async (date, label, yearly) => {
    await fill('#evDate', date); await fill('#evLabel', label);
    if (yearly) await page.check('#evYearly'); else await page.uncheck('#evYearly');
    await click('#evAdd');
  };

  /* ---------- 0. calendar maths ---------- */
  const K = await page.evaluate(() => {
    const C = window.CALMAKER;
    return {
      leap: [1900, 2000, 2024, 2027, 2028, 2100].map((y) => C.isLeap(y)),
      feb: [C.daysIn(2027, 2), C.daysIn(2028, 2), C.daysIn(1900, 2), C.daysIn(2000, 2), C.daysIn(2100, 2)],
      len2027: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => C.daysIn(2027, m)),
      dow: [C.dow(2027, 1, 1), C.dow(2028, 2, 1), C.dow(2028, 2, 29), C.dow(2026, 11, 14), C.dow(2000, 1, 1), C.dow(2028, 3, 1)],
      bad: [C.parseDate('2027-02-29'), C.parseDate('2027-13-01'), C.parseDate('abc'), C.parseDate('1850-01-01'), C.parseDate('')].map((x) => x === null),
      ok: [C.parseDate('2028-02-29'), C.parseDate('26/01/2027')]
    };
  });
  expect(K.leap.join() === 'false,true,true,false,true,false', 'leap years: 2000, 2024, 2028 yes; 1900, 2027, 2100 no; got ' + K.leap);
  expect(K.feb.join() === '28,29,28,29,28', 'February lengths, got ' + K.feb);
  expect(K.len2027.join() === '31,28,31,30,31,30,31,31,30,31,30,31', 'month lengths in 2027, got ' + K.len2027);
  expect(K.dow.join() === '5,2,2,6,6,3', 'weekdays: 1 Jan 2027 Fri, 1 Feb 2028 Tue, 29 Feb 2028 Tue, 14 Nov 2026 Sat, 1 Jan 2000 Sat, 1 Mar 2028 Wed; got ' + K.dow);
  expect(K.bad.every(Boolean), 'wrong dates (29 Feb 2027, month 13, text, year 1850, empty) are rejected');
  expect(K.ok[0] && K.ok[0].d === 29 && K.ok[1] && K.ok[1].y === 2027 && K.ok[1].m === 1 && K.ok[1].d === 26, '29 Feb 2028 and 26/01/2027 are accepted');

  /* ---------- 1. no built-in holidays ---------- */
  expect((await count('#evList li')) === 0 && (await count('#sheets .cm-ev')) === 0, 'a new calendar has no built-in festival or holiday dates');
  expect((await txt('#noHolidays')) === t('ev_note'), 'the "add your own holidays" note is shown');

  /* ---------- 2. February 2028 (leap year) ---------- */
  await click('#lay-month'); await click('#ws-sun'); await click('#pp-port');
  await setMonth(2028, 2);
  let m = await monthInfo();
  expect(m.days === 29 && m.last === '2028-02-29', 'February 2028 has 29 days, got ' + m.days);
  expect(m.first === 2, '1 Feb 2028 is a Tuesday: 3rd column when the week starts on Sunday, got column ' + m.first);
  expect(m.name === t('m2') && m.year === '2028', 'the page says ' + t('m2') + ' 2028, got ' + m.name + ' ' + m.year);
  expect(m.wd.join('|') === [0, 1, 2, 3, 4, 5, 6].map((i) => t('wd' + i)).join('|'), 'weekday names Sunday..Saturday in the page language');
  await click('#ws-mon');
  m = await monthInfo();
  expect(m.first === 1 && m.days === 29, 'with Monday first, 1 Feb 2028 is in the 2nd column, got ' + m.first);
  expect(m.wd[0] === t('wd1') && m.wd[6] === t('wd0'), 'Monday is the first column and Sunday the last');

  /* ---------- 3. January 2027 and other months ---------- */
  await setMonth(2027, 1);
  m = await monthInfo();
  expect(m.days === 31 && m.first === 4, 'January 2027: 31 days, 1st is a Friday = 5th column with Monday first, got ' + m.days + ' / ' + m.first);
  await click('#ws-sun');
  m = await monthInfo();
  expect(m.first === 5 && m.cells === 42, 'January 2027 with Sunday first: Friday = 6th column and 6 week rows, got ' + m.first + ' / ' + m.cells);
  await setMonth(2027, 2);
  m = await monthInfo();
  expect(m.days === 28 && m.first === 1 && m.cells === 35, 'February 2027: 28 days, starts on Monday, 5 rows; got ' + m.days + ' / ' + m.first + ' / ' + m.cells);
  await click('#yr-next');
  expect((await page.inputValue('#year')) === '2028' && (await monthInfo()).days === 29, 'the + button goes to 2028 and February gets 29 days');

  /* ---------- 4. wrong year never breaks the page ---------- */
  await fill('#year', 'abc');
  expect(!(await page.$eval('#yearErr', (e) => e.hidden)) && (await count('#sheets .cm-sheet')) === 1, 'a wrong year shows a message and keeps the last calendar');
  await fill('#year', '99999');
  expect((await txt('#yearErr')) === t('err_year', { a: 1900, b: 2100 }), 'year 99999 is refused');
  await fill('#year', '2027');
  expect(await page.$eval('#yearErr', (e) => e.hidden), 'a correct year clears the message');

  /* ---------- 5. own events ---------- */
  await setMonth(2027, 1);
  await addEvent('2027-01-26', 'Republic Day', false);
  await addEvent('2020-01-14', 'Dadi birthday', true);
  expect((await count('#evList li')) === 2, 'two events are in the list');
  expect((await txt('[data-date="2027-01-26"] .cm-ev')) === 'Republic Day', 'the event is shown in the cell of 26 January 2027');
  expect((await txt('[data-date="2027-01-14"] .cm-ev')) === 'Dadi birthday', 'a yearly event from 2020 is shown in 2027');
  expect((await count('#sheets .cm-foot .cm-row')) === 2, 'both events are listed under the month');
  await fill('#year', '2028');
  expect((await count('[data-date="2028-01-26"] .cm-ev')) === 0 && (await count('[data-date="2028-01-14"] .cm-ev')) === 1, 'in 2028 only the yearly event is shown');
  await fill('#year', '2027');
  /* invalid input */
  await addEvent('2027-01-05', '   ', false);
  expect((await txt('#evErr')) === t('err_label') && (await count('#evList li')) === 2, 'an event without a name is refused');
  await fill('#evDate', ''); await fill('#evLabel', 'No date'); await click('#evAdd');
  expect((await txt('#evErr')) === t('err_date', { a: 1900, b: 2100 }) && (await count('#evList li')) === 2, 'an event without a date is refused');
  await addEvent('2027-01-26', 'Republic Day', false);
  expect((await txt('#evErr')) === t('err_dup') && (await count('#evList li')) === 2, 'the same event is not added twice');
  await addEvent('2027-01-26', 'X'.repeat(200), false);
  expect((await count('#evList li')) === 3 && (await page.$eval('#evList li:last-child .n', (e) => e.textContent.length)) <= 60, 'a very long name is cut to 60 letters');
  expect((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 2, 'a very long name does not make the page scroll sideways');

  /* ---------- 6. whole year on one page, 12 monthly pages, paper ---------- */
  await click('#lay-year');
  expect((await count('#sheets .cm-year')) === 1 && (await count('#sheets .cm-mini')) === 12, 'one year page with 12 months');
  expect((await count('#sheets .cm-mgrid .d')) === 365, '2027 has 365 days on the year page');
  expect((await count('#sheets .cm-mgrid .has-ev')) === 2, 'the two event days (14 and 26 January) are marked');
  expect((await count('#sheets .cm-list .cm-row')) === 3, 'the list page has the 3 events of 2027');
  expect((await page.$eval('#sheets .cm-mini[data-m="1"] .cm-mgrid', (g) => Array.from(g.children).slice(7).findIndex((c) => c.classList.contains('d')))) === 5, 'on the year page January 2027 also starts in the Friday column');
  await fill('#year', '2028');
  expect((await count('#sheets .cm-mgrid .d')) === 366, '2028 has 366 days on the year page');
  await page.uncheck('#showList'); await settle();
  expect((await count('#sheets .cm-list')) === 0, 'the list page can be switched off');
  await page.check('#showList'); await settle();
  await click('#lay-12');
  expect((await count('#sheets .cm-month')) === 12, '12 monthly pages');
  const lens = await page.$$eval('#sheets .cm-month', (a) => a.map((s) => s.querySelectorAll('.cm-day:not(.blank)').length));
  expect(lens.join() === '31,29,31,30,31,30,31,31,30,31,30,31', 'month lengths of 2028 on the 12 pages, got ' + lens);
  await click('#pp-land');
  expect((await count('#sheets .cm-sheet.land')) === 12, 'landscape is applied to every page');
  expect(await page.evaluate(() => Array.from(document.querySelectorAll('style')).some((s) => /@page\s*\{\s*size:\s*A4 landscape/.test(s.textContent))), 'the print page size is A4 landscape');
  await click('#pp-port');
  expect(await page.evaluate(() => Array.from(document.querySelectorAll('style')).some((s) => /@page\s*\{\s*size:\s*A4 portrait/.test(s.textContent))), 'the print page size is A4 portrait again');
  await click('#th-green'); await fill('#title', 'Sharma Kirana Store');
  expect((await count('#sheets .cm-sheet.t-green')) === 12 && (await txt('#sheets .cm-title')) === 'Sharma Kirana Store', 'colour and title are applied');

  /* ---------- 7. export, clear, import ---------- */
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#exportBtn')]);
  const saved = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  expect(saved.events.length === 3 && saved.events.some((e) => e.date === '2020-01-14' && e.label === 'Dadi birthday' && e.yearly === true), 'the exported file has the 3 events');
  await click('#clearEv');
  expect((await count('#evList li')) === 0, 'Delete all events empties the list');
  await page.setInputFiles('#impFile', { name: 'calendar-events.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await page.waitForTimeout(400);
  expect((await count('#evList li')) === 3, 'importing the exported file brings the 3 events back');
  await page.setInputFiles('#impFile', { name: 'more.csv', mimeType: 'text/csv', buffer: Buffer.from('date,name\n15/08/2027,School function\n31/02/2027,Wrong date\n') });
  await page.waitForTimeout(400);
  expect((await count('#evList li')) === 4, 'a CSV row with a correct date is added and the wrong date (31 Feb) is skipped');
  await page.setInputFiles('#impFile', { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"this is": not a calendar file') });
  await page.waitForTimeout(400);
  expect((await count('#evList li')) === 4 && (await count('#sheets .cm-sheet')) >= 12, 'a broken file changes nothing and does not crash');

  /* ---------- 8. saved on the device, then Reset ---------- */
  await page.reload(); await page.waitForTimeout(800);
  expect((await count('#evList li')) === 4 && (await page.inputValue('#year')) === '2028' && (await page.inputValue('#title')) === 'Sharma Kirana Store', 'events and settings are still there after a reload');
  expect((await count('#sheets .cm-month.t-green')) === 12, 'the 12 green pages are back after a reload');
  await page.click('#helpBox summary'); await click('#resetAll');
  expect((await count('#evList li')) === 0 && (await count('#sheets .cm-month')) === 1 && (await page.inputValue('#title')) === '', 'Reset clears the events and goes back to one month');
};
