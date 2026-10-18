/* Interaction test for Tambola Tickets & Caller (run by tools/verify.js in en and hi).
   Covers: a full strip of 6 valid tickets covering 1-90 once, same code -> same tickets, 20 calls without repeats
   lighting 20 board cells, undo, a valid and an invalid claim, a hand-typed ticket, play-on-phone marking and
   persistence of the game after a reload. Drives the UI by ids / data attributes only. */
module.exports = async function ({ page, lang, expect, t, log }) {
  await page.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  const RANGE = [[1, 9], [10, 19], [20, 29], [30, 39], [40, 49], [50, 59], [60, 69], [70, 79], [80, 90]];

  // 1) fixed game code, 6 tickets = one full strip
  await page.fill('#code', 'DIWALI26');
  await page.press('#code', 'Enter');
  await page.fill('#count', '6');
  await page.dispatchEvent('#count', 'change');
  expect(await page.isChecked('#strips'), 'full sheets of 6 should be on by default');
  const tickets = await page.$$eval('#tkList .tk .tk-grid', (gs) => gs.map((g) => {
    const cells = [...g.children], rows = [[], [], []];
    cells.forEach((c, i) => rows[Math.floor(i / 9)].push(c.dataset.n ? +c.dataset.n : 0));
    return rows;
  }));
  expect(tickets.length === 6, 'preview should show 6 tickets, got ' + tickets.length);
  const all = [];
  tickets.forEach((rows, k) => {
    const nums = rows.flat().filter(Boolean);
    expect(nums.length === 15, `ticket ${k + 1} should have 15 numbers, got ${nums.length}`);
    rows.forEach((r, ri) => expect(r.filter(Boolean).length === 5, `ticket ${k + 1} row ${ri + 1} should have 5 numbers`));
    for (let c = 0; c < 9; c++) {
      const col = rows.map((r) => r[c]).filter(Boolean);
      expect(col.length >= 1, `ticket ${k + 1} column ${c + 1} is empty`);
      col.forEach((n) => expect(n >= RANGE[c][0] && n <= RANGE[c][1], `ticket ${k + 1}: ${n} is in the wrong column ${c + 1}`));
      for (let i = 1; i < col.length; i++) expect(col[i] > col[i - 1], `ticket ${k + 1} column ${c + 1} must go up`);
    }
    all.push(...nums);
  });
  all.sort((a, b) => a - b);
  expect(all.length === 90 && all.every((n, i) => n === i + 1), 'a strip of 6 must use every number 1-90 exactly once');

  // same code -> same tickets (engine check from the page)
  const same = await page.evaluate(() => JSON.stringify(TAMBOLA.ticket('diwali-26', 4).rows) === JSON.stringify(TAMBOLA.ticket('DIWALI26', 4).rows));
  expect(same, 'the same game code must always rebuild the same ticket');

  // print builds one A4 sheet of 6 tickets
  await page.click('#printTk');
  expect(await page.evaluate(() => window.__printed) === 1, 'print should be called once');
  expect((await page.$$('#print-root .sheet .pt')).length === 6, 'print root should hold 6 tickets on one sheet');
  await page.evaluate(() => document.body.classList.remove('tb-printing'));

  // 2) caller: 20 numbers, no repeats, 20 lit cells
  await page.click('#tab-caller');
  await page.uncheck('#voice');
  for (let i = 0; i < 20; i++) await page.click('#nextBtn');
  const lit = await page.$$eval('#board .bc.on', (cs) => cs.map((c) => +c.dataset.n));
  expect(lit.length === 20 && new Set(lit).size === 20, '20 distinct board cells should be lit, got ' + lit.length);
  const cur = +(await page.textContent('#ballNum')).trim();
  expect(lit.includes(cur), 'the big number must be one of the lit cells');
  expect((await page.textContent('#calledN')).includes('20') && (await page.textContent('#leftN')).includes('70'), 'counts should read 20 called / 70 left');
  expect((await page.$$('#last5 .coin')).length === 5, 'the last 5 earlier numbers should be shown');
  await page.click('#undoBtn');                                   // confirm() is auto-accepted
  expect((await page.$$('#board .bc.on')).length === 19, 'undo should take back the last number');
  await page.click('#nextBtn');
  const called = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.tambola-housie.game')).called);
  expect(called.length === 20 && new Set(called).size === 20, 'game should store 20 distinct called numbers');

  // 3) claim checker: build a sure winner and a sure loser from the called numbers
  const pick = await page.evaluate((cl) => {
    const set = new Set(cl);
    let win = null, lose = null;
    for (let no = 1; no <= 6000 && !(win && lose); no++) {
      const tk = TAMBOLA.ticket('DIWALI26', no), have = TAMBOLA.numbersOf(tk).filter((n) => set.has(n)).length;
      if (have >= 5 && !win) win = no;
      if (TAMBOLA.rowNums(tk, 0).some((n) => !set.has(n)) && !lose) lose = no;
    }
    return { win, lose };
  }, called);
  await page.click('#claimBtn');
  expect(await page.isVisible('#panel-check'), '"Someone claims" should open the claim checker');
  expect((await page.inputValue('#chkCode')).toUpperCase() === 'DIWALI26', 'the checker is prefilled with the game code');
  await page.selectOption('#claim', 'top');
  await page.fill('#chkNo', String(pick.lose));
  await page.click('#checkBtn');
  expect(await page.getAttribute('#verdict', 'data-ok') === 'false', 'top line on ticket ' + pick.lose + ' must not be valid yet');
  expect((await page.$$('#checkOut .tk-c.miss')).length >= 1, 'missing numbers should be marked on the ticket');
  expect(pick.win, 'some ticket must have 5 called numbers');
  if (pick.win) {
    await page.selectOption('#claim', 'early5');
    await page.fill('#chkNo', String(pick.win));
    await page.click('#checkBtn');
    expect(await page.getAttribute('#verdict', 'data-ok') === 'true', 'early five on ticket ' + pick.win + ' must be valid');
    await page.click('#winBtn');
    expect((await page.$$('#winners li:not(.none)')).length === 1, 'the winner should be listed');
  } else log('no ticket with 5 called numbers in this random draw; early-five check skipped');

  // a ticket typed by hand: all its numbers called -> valid full house
  await page.click('#srcSeg [data-src="typed"]');
  const typed = [called.slice(0, 5), called.slice(5, 10), called.slice(10, 15)];
  const ok = await page.evaluate((rows) => !TAMBOLA.fromRows(rows).error, typed);
  if (ok) {
    await page.fill('#typed', typed.map((r) => r.join(' ')).join('\n'));
    await page.selectOption('#claim', 'full');
    await page.click('#checkBtn');
    expect(await page.getAttribute('#verdict', 'data-ok') === 'true', 'a typed ticket whose numbers were all called is a full house');
  }
  await page.fill('#typed', '4 23 37 61 95\n9 15 42 56 77\n18 29 49 68 90');
  await page.click('#checkBtn');
  expect(await page.$('#verdict') === null && (await page.textContent('#checkOut')).includes('95'), 'an out-of-range typed number is reported');
  await page.click('#srcSeg [data-src="game"]');

  // 4) play on phone: open ticket 3 and mark two numbers
  await page.click('#tab-play');
  await page.fill('#playCode', 'DIWALI26');
  await page.fill('#playNo', '3');
  await page.click('#openBtn');
  const cells = page.locator('#playList .play-card button.tk-c');
  expect(await cells.count() === 15, 'the phone ticket should have 15 tappable numbers');
  await cells.nth(0).click();
  await cells.nth(1).click();
  expect((await page.$$('#playList .tk-c.mark')).length === 2, 'two tapped numbers should be marked');

  // 5) prizes: rename a prize, it shows in the rules sheet
  await page.click('#tab-prizes');
  await page.fill('.pz[data-p="early5"] .pz-name', 'Pehla Paanch');
  expect((await page.textContent('#rulesPreview')).includes('Pehla Paanch'), 'renamed prize should appear on the rules sheet');

  // 6) reload keeps the game
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.click('#tab-caller');
  expect((await page.$$('#board .bc.on')).length === 20, 'called numbers should survive a reload');
  expect((await page.inputValue('#code')).toUpperCase() === 'DIWALI26', 'the game code should survive a reload');
  expect((await page.$$('#playList .tk-c.mark')).length === 2, 'phone ticket marks should survive a reload');
};
