/* Interaction test for Seating Chart Maker. Run by tools/verify.js in en and hi (dialogs auto-accepted). */
module.exports = async function ({ page, lang, expect, log }) {
  const dbg = () => page.evaluate(() => window.SEAT_DEBUG());
  const seatedCount = s => s.seats.filter(Boolean).length;
  const setInput = async (sel, v) => { await page.fill(sel, String(v)); await page.dispatchEvent(sel, 'change'); };

  // 1) the example class is seated straight away: 30 students on 5 × 6 benches
  let s = await dbg();
  expect(s.students.length === 30 && s.nSeats === 30 && seatedCount(s) === 30, 'example: 30 students in 30 seats, got ' + seatedCount(s) + '/' + s.nSeats);
  expect(s.violations.length === 0, 'example keep-apart pair is respected');
  expect((await page.$$('#room .seat')).length === 30, '30 seat buttons drawn');

  // 2) paste 30 of our own names (with roll, gender) → rows layout 5 × 6 → arrange by roll number
  await page.click('#tabStudents');
  const lines = [];
  for (let i = 1; i <= 30; i++) lines.push(`Student ${String(i).padStart(2, '0')}, ${i}, ${i % 2 ? 'M' : 'F'}, ${40 + (i * 7) % 60}`);
  await page.fill('#names', lines.join('\n'));
  await page.click('#useList');
  s = await dbg();
  expect(s.students.length === 30 && s.students[4].roll === '5' && s.students[4].gender === 'M' && s.students[3].gender === 'F', 'pasted list parsed: 30 students with roll and gender');
  expect((await page.$$('#stuTable tbody tr')).length === 30, 'student table shows 30 rows');

  // keep-apart: roll 1 and roll 2 would sit side by side in roll order
  const id1 = s.students[0].id, id2 = s.students[1].id, id7 = s.students[6].id;
  await page.selectOption('#apartA', id1);
  await page.selectOption('#apartB', id2);
  await page.click('#addPair');
  await page.selectOption('#apartA', id1);
  await page.selectOption('#apartB', id7);   // roll 7 sits right behind roll 1 in a 6-wide room
  await page.click('#addPair');
  expect((await page.$$('#pairs li')).length === 2, 'two keep-apart pairs listed');

  await page.click('#tabChart');
  await page.click('#layoutSeg button[data-lay="rows"]');
  await setInput('#rowsIn', 5); await setInput('#colsIn', 6);
  await page.selectOption('#orderSel', 'roll');
  await page.click('#arrangeBtn');
  s = await dbg();
  expect(s.layout === 'rows' && s.nSeats === 30 && seatedCount(s) === 30, '30 names into 5 × 6: all 30 seats filled, got ' + seatedCount(s));
  expect(s.violations.length === 0, 'keep-apart pairs are not adjacent after arranging');
  const posOf = id => s.seats.indexOf(id);
  for (const [a, b] of s.apart) expect(!s.adj[posOf(a)].includes(posOf(b)), 'pair never beside / in front / behind');
  const rollAt0 = s.students.find(x => x.id === s.seats[0]).roll;
  log('seat 1 has roll', rollAt0);

  // 3) every order keeps the pairs apart, also random draws
  for (const ord of ['alpha', 'random', 'random', 'mixed']) {
    await page.selectOption('#orderSel', ord);
    await page.click('#arrangeBtn');
    s = await dbg();
    expect(seatedCount(s) === 30 && s.violations.length === 0, ord + ': 30 seated, pairs apart');
  }

  // 4) exam hall with A/B sets: no two neighbours have the same set
  await page.click('#layoutSeg button[data-lay="exam"]');
  await page.check('#setsChk');
  await page.click('#arrangeBtn');
  s = await dbg();
  expect(s.sets && s.layout === 'exam', 'exam layout with sets');
  let same = 0;
  s.adj.forEach((list, i) => list.forEach(j => { if (s.pos[i].set === s.pos[j].set) same++; }));
  expect(same === 0, 'sets A/B alternate: neighbours never share a set (' + same + ' clashes)');
  expect(s.pos.filter(p => p.set === 'A').length === 15, '15 A seats and 15 B seats');
  const badges = await page.$$eval('#room .seat .st', b => b.map(x => x.textContent));
  expect(badges.length === 30 && badges[0] === 'A' && badges[1] === 'B', 'set badges drawn A, B, …');

  // 5) boy–girl alternate: neighbours beside each other differ
  await page.check('#optBoyGirl');
  await page.selectOption('#orderSel', 'roll');
  await page.click('#arrangeBtn');
  s = await dbg();
  const g = id => (s.students.find(x => x.id === id) || {}).gender;
  let mixedOk = 0, total = 0;
  s.adj.forEach((list, i) => list.forEach(j => { if (s.seats[i] && s.seats[j]) { total++; if (g(s.seats[i]) !== g(s.seats[j])) mixedOk++; } }));
  expect(s.violations.length === 0 && mixedOk / total > 0.85, 'boy–girl alternate: ' + mixedOk + '/' + total + ' neighbour links mixed, pairs apart');

  // 6) tap one seat, then another → swap; Undo puts it back
  const before = s.seats.slice();
  await page.click('#room .seat[data-i="10"]');
  await page.click('#room .seat[data-i="11"]');
  s = await dbg();
  expect(s.seats[10] === before[11] && s.seats[11] === before[10], 'tap–tap swaps two students');
  await page.click('#undoBtn');
  s = await dbg();
  expect(s.seats[10] === before[10] && s.seats[11] === before[11], 'Undo restores the swap');

  // 7) more students than seats → the extra ones wait in "Without a seat"
  await page.click('#tabStudents');
  const more = [];
  for (let i = 1; i <= 34; i++) more.push(`Pupil ${i}, ${i}`);
  await page.fill('#names', more.join('\n'));
  await page.click('#useList');
  await page.click('#tabChart');
  await page.click('#arrangeBtn');
  s = await dbg();
  expect(seatedCount(s) === 30 && s.students.length === 34, '34 students, 30 seated');
  expect(!(await page.isHidden('#unseatedBox')) && (await page.$$('#unseated button')).length === 4, '4 students listed without a seat');
  expect((await page.$eval('#warn', e => e.textContent)).includes('4'), 'warning mentions 4 students without a seat');

  // 8) A4 print view has a box for every seat
  await page.evaluate(() => window.SEAT_PRINT('chart'));
  expect((await page.$$('#printArea .pr-seat')).length === 30, 'printed chart has 30 seats');
  await page.evaluate(() => window.SEAT_PRINT('list'));
  expect((await page.$$('#printArea tbody tr')).length === 30, 'invigilator list has 30 rows');

  // 9) survives a reload
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(300);
  s = await dbg();
  expect(s.students.length === 34 && s.layout === 'exam' && seatedCount(s) === 30, 'class, room and chart are saved on this device');
};
