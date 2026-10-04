/* Interaction test for Timetable Maker (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = async function ({ page, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const cell = (d, s) => `#grid .cell[data-d="${d}"][data-s="${s}"]`;
  const sub = (d, s) => page.getAttribute(cell(d, s), 'data-sub');
  const filled = () => page.$$eval('#grid .cell:not(.empty)', b => b.length);
  const C = await page.evaluate(() => window.APP_CONTENT[EDU.lang]);

  /* 1) sample school: two class timetables, Class 7-A fully filled, no clashes */
  expect(await page.$$eval('#tt-sel option', o => o.length) === 2, 'two sample timetables');
  expect(await filled() === 48, 'sample 7-A has 48 filled periods, got ' + await filled());
  expect(await txt('#grid-status') === t('filled_n', { n: '48', total: '48' }), 'status says 48 of 48: ' + await txt('#grid-status'));
  expect(await sub(0, 'p1') === 'mat', 'Monday period 1 is Maths');
  expect(await page.$$eval('#grid .cell.clash', b => b.length) === 0, 'sample has no clashes');

  /* 2) paint: eraser, undo, paint a subject, tap again to empty */
  await page.click('#eraser');
  await page.click(cell(0, 'p1'));
  expect(await sub(0, 'p1') === '', 'eraser empties the period');
  expect(await filled() === 47, '47 filled after erasing one');
  await page.click('#undo-btn');
  expect(await sub(0, 'p1') === 'mat', 'undo brings Maths back');
  await page.click('#palette .pchip[data-sid="sci"]');
  await page.click(cell(0, 'p8'));
  expect(await sub(0, 'p8') === 'sci', 'painting Science into Monday period 8');
  expect(await txt('#palette .pchip[data-sid="sci"] .pc') === '8/7', 'Science chip counts 8 of 7 wanted: ' + await txt('#palette .pchip[data-sid="sci"] .pc'));
  await page.click(cell(0, 'p8'));
  expect(await sub(0, 'p8') === '', 'tapping the same subject again empties the period');
  await page.click('#undo-btn'); await page.click('#undo-btn');
  expect(await sub(0, 'p8') === 'pe', 'two undos restore PE');

  /* 2b) keyboard: Enter on a period paints it and focus stays on that period (the grid is redrawn) */
  await page.focus(cell(3, 'p5'));
  await page.keyboard.press('Enter');
  expect(await sub(3, 'p5') === 'sci', 'Enter paints Thursday period 5 with Science');
  expect(await page.evaluate(() => { const a = document.activeElement; return a && a.dataset ? a.dataset.d + '|' + a.dataset.s : ''; }) === '3|p5', 'focus stays on the same period after painting');
  await page.keyboard.press('Control+z');
  expect(await sub(3, 'p5') === 'sst', 'Ctrl+Z restores Social Science');

  /* 2c) "per week" is kept between 0 and 60, and the box shows the value really used */
  const want = '#subj-list .srow[data-sid="art"] .in-want';
  await page.fill(want, '999'); await page.press(want, 'Tab');
  expect(await page.inputValue(want) === '60' && await txt('#palette .pchip[data-sid="art"] .pc') === '2/60', 'per week 999 becomes 60');
  await page.fill(want, '-3'); await page.press(want, 'Tab');
  expect(await page.inputValue(want) === '' && await txt('#palette .pchip[data-sid="art"] .pc') === '2', 'negative per week becomes 0 (empty)');
  await page.fill(want, '2'); await page.press(want, 'Tab');
  expect(await txt('#palette .pchip[data-sid="art"] .pc') === '2/2', 'per week back to 2');

  /* 3) choose from a list */
  await page.click('#mode-pick');
  await page.click(cell(2, 'p3'));
  await page.waitForSelector('.edu-modal .pick-btn[data-sid="art"]');
  await page.click('.edu-modal .pick-btn[data-sid="art"]');
  expect(await sub(2, 'p3') === 'art', 'choose mode sets Wednesday period 3 to Art');
  await page.click('#undo-btn');
  expect(await sub(2, 'p3') === 'eng', 'undo restores English');

  /* 4) swap creates two teacher clashes with Class 8-A */
  await page.click('#mode-swap');
  await page.click(cell(0, 'p1'));
  await page.click(cell(0, 'p2'));
  expect(await sub(0, 'p1') === 'eng' && await sub(0, 'p2') === 'mat', 'swap exchanges Monday periods 1 and 2');
  expect(await page.$$eval('#grid .cell.clash', b => b.length) === 2, 'swap creates 2 clash cells');
  expect(await page.isVisible('#clash-note'), 'clash warning is shown');

  /* 5) teachers: clash list, maths teacher timetable, free teachers */
  await page.click('#tab-teachers');
  expect(await page.$$eval('#clash-list li', l => l.length) === 2, 'two clashes listed');
  const matKey = await page.$eval('#teacher-sel', (s, name) => { const o = [...s.options].find(x => x.textContent === name); return o ? o.value : ''; }, C.teachers.mat);
  expect(!!matKey, 'maths teacher is in the teacher list');
  await page.selectOption('#teacher-sel', matKey);
  expect(await page.$$eval('#teacher-grid .tcell', x => x.length) === 16, 'maths teacher has 16 periods in two classes');
  expect(await page.$$eval('#teacher-grid td.tc.clash', x => x.length) === 1, 'one clash cell in the maths teacher timetable');
  expect(await txt('#teacher-total') === t('teacher_week', { n: '16' }), 'teacher total: ' + await txt('#teacher-total'));
  await page.selectOption('#free-day', '0');
  await page.selectOption('#free-slot', { index: 0 });
  const nFree = await page.$$eval('#free-list li', l => l.length);
  expect(nFree === 9, 'Monday period 1: 9 of 10 teachers are free, got ' + nFree);

  /* 6) undo the swap: clashes disappear */
  await page.click('#tab-grid');
  await page.click('#undo-btn');
  expect(await page.$$eval('#grid .cell.clash', b => b.length) === 0, 'undo removes the clashes');

  /* 7) summary */
  await page.click('#tab-summary');
  expect(await txt('#sum-table tr[data-sid="mat"] .n-have') === '8', 'Maths has 8 periods a week');
  expect(await txt('#st-filled') === '48 / 48', 'summary tile 48 / 48');
  expect(await txt('#st-time') === t('hours', { h: '32' }), '48 x 40 min = 32 h, got ' + await txt('#st-time'));
  expect(await txt('#sum-table tr[data-sid="art"] .n-time') === t('hm_1', { h: '1', m: '20' }), 'Art 2 x 40 min = 1 h 20 min (singular hour), got ' + await txt('#sum-table tr[data-sid="art"] .n-time'));
  expect(await txt('#sum-table tr[data-sid="mat"] .n-time') === t('hm', { h: '5', m: '20' }), 'Maths 8 x 40 min = 5 h 20 min');

  /* 8) today: Tuesday 6 Oct 2026, 10:20 -> period 4 (10:15-10:55) is Science */
  await page.clock.setFixedTime(new Date(2026, 9, 6, 10, 20, 0));
  await page.click('#tab-today');
  expect(await txt('#now-subj') === C.subjects.sci[0], 'now: Science, got ' + await txt('#now-subj'));
  expect(await txt('#now-left') === t('time_left', { n: '35' }), '35 minutes left, got ' + await txt('#now-left'));
  expect(await page.$$eval('#day-list .dl-row.now', x => x.length) === 1, 'one row marked now in the day list');
  // a day picked by hand stays while it is still Tuesday, but the next day the Today tab follows the real day again
  await page.click('#today-days button[data-d="3"]');
  expect((await txt('#today-day')).startsWith(t('days_full').split(',')[3]), 'picked Thursday is shown');
  expect(!(await page.isVisible('#now-subj')), 'no "now" card for another day');
  await page.click('#tab-grid'); await page.click('#tab-today');
  expect((await txt('#today-day')).startsWith(t('days_full').split(',')[3]), 'picked day kept on the same day');
  await page.clock.setFixedTime(new Date(2026, 9, 7, 8, 10, 0));   // Wednesday 8:10, period 1
  await page.click('#tab-grid'); await page.click('#tab-today');
  expect((await txt('#today-day')).startsWith(t('days_full').split(',')[2]), 'next day: Today shows Wednesday, got ' + await txt('#today-day'));
  expect(await txt('#now-subj') === C.subjects.sci[0], 'Wednesday period 1 is Science, got ' + await txt('#now-subj'));
  await page.clock.setFixedTime(new Date(2026, 9, 6, 10, 20, 0));
  await page.click('#tab-grid');
  expect(await page.$$eval('#grid td.now', x => x.length) === 1, 'one cell marked now in the grid');
  expect(await page.getAttribute('#grid td.now .cell', 'data-s') === 'p4' && await page.getAttribute('#grid td.now .cell', 'data-d') === '1', 'now cell is Tuesday period 4');

  /* 8b) print: 10 subjects give a two-column legend; Ctrl+P after printing prints the current timetable again */
  await page.evaluate(() => { window.print = () => { window.dispatchEvent(new Event('afterprint')); }; });
  await page.click('#print-all');
  expect(await page.$$eval('#print-area .pblock', b => b.length) === 2, 'print all: one block per timetable');
  expect(await page.$$eval('#print-area .plegend.two', b => b.length) === 2, 'legend of 10 subjects is split into two columns');
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  expect(await page.$$eval('#print-area .pblock', b => b.length) === 1, 'browser print shows only the current timetable');

  /* 9) setup: add a period and Sunday */
  await page.click('#tab-setup');
  const rows0 = await page.$$eval('#slots .slot-row', r => r.length);
  await page.click('#add-period');
  expect(await page.$$eval('#slots .slot-row', r => r.length) === rows0 + 1, 'one more row after adding a period');
  expect(await page.inputValue('#slots .slot-row:last-child .in-start') === '14:05' && await page.inputValue('#slots .slot-row:last-child .in-end') === '14:45', 'new period runs 14:05-14:45');
  await page.click('#days-box .day-chip[data-d="6"]');
  expect(await page.getAttribute('#days-box .day-chip[data-d="6"]', 'aria-pressed') === 'true', 'Sunday switched on');
  await page.click('#tab-grid');
  expect(await txt('#grid-status') === t('filled_n', { n: '48', total: '63' }), '7 days x 9 periods = 63: ' + await txt('#grid-status'));

  /* 10) new study timetable preset */
  await page.click('#new-tt');
  await page.click('#new-study');
  expect(await page.$$eval('#tt-sel option', o => o.length) === 3, 'three timetables after adding a study plan');
  expect(await filled() === 28, 'study preset fills 7 days x 4 sessions, got ' + await filled());

  /* 11) standard week + auto-fill */
  await page.click('#new-tt');
  await page.fill('#new-name', 'Test 9-B');
  await page.click('#new-std');
  expect(await page.$$eval('#tt-sel option', o => o.length) === 4, 'four timetables');
  expect(await filled() === 0, 'standard week starts empty');
  await page.click('#autofill');
  expect(await filled() === 48, 'auto-fill places all 48 wanted periods, got ' + await filled());
  await page.click('#tab-summary');
  const spread = await page.$$eval('#spread-t tbody td.num', tds => tds.map(x => parseInt(x.textContent, 10) || 0));
  expect(Math.max(...spread) <= 2, 'auto-fill spreads subjects: at most 2 a day, got ' + Math.max(...spread));

  /* 12) CSV export */
  await page.click('#tab-grid');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#export-csv')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  expect(csv.includes('Test 9-B') && csv.includes(C.subjects.mat[0]), 'CSV has the class name and subjects');
  expect(csv.split(/\r?\n/).filter(l => l.startsWith(t('days_full').split(',')[0])).length === 1, 'CSV has one Monday row');
  log('csv ' + csv.length + ' bytes');

  /* 13) saved across reload */
  await page.waitForTimeout(300);
  await page.reload();
  await page.waitForTimeout(900);
  expect(await page.$$eval('#tt-sel option', o => o.length) === 4, 'timetables saved across reload');
  expect((await page.$eval('#tt-sel', s => s.options[s.selectedIndex].textContent)).includes('Test 9-B'), 'current timetable restored');
  expect(await filled() === 48, 'periods saved across reload');

  /* 14) a hand-made backup file is cleaned: inherited keys ("constructor") are not subjects, odd ids are replaced, no rows -> default bell times */
  const bad = path.join(os.tmpdir(), 'tt-backup-test-' + Date.now() + '.json');
  fs.writeFileSync(bad, JSON.stringify({ app: 'timetable-maker', v: 1, data: { tts: [
    { id: 'x"]', name: 'Evil', kind: 'class', days: [true], slots: [{ id: 'p1', t: 'p', s: '08:00', e: '08:40' }, { id: 'a"b', t: 'p', s: '08:40', e: '09:20' }],
      subjects: [{ id: 'a', name: 'A', color: '#ff0000', want: 1 }], cells: { '0|p1': 'constructor', '0|constructor': 'a', '0|a"b': 'a' } },
    { name: 'No rows', slots: 'x', subjects: [null, 5, { id: '__erase', name: 'Z' }], cells: [] }] } }));
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#restore')]);
  await fc.setFiles(bad);
  await page.waitForFunction(() => document.querySelectorAll('#tt-sel option').length === 2, null, { timeout: 5000 });
  expect(await filled() === 0, 'a period holding "constructor" stays empty, got ' + await filled());
  expect(await txt('#grid-status') === t('filled_n', { n: '0', total: '2' }), 'restored timetable: 2 periods on 1 day: ' + await txt('#grid-status'));
  await page.selectOption('#tt-sel', { index: 1 });
  expect(await page.$$eval('#grid .cell', c => c.length) === 48, 'timetable without rows gets the standard 8 periods x 6 days');
  expect(await page.$$eval('#palette .pchip:not(.erase)', c => c.length) === 1, 'only the one real subject survives');
  fs.unlinkSync(bad);
};
