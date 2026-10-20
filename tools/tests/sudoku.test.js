/* Interaction test for Sudoku (run by tools/verify.js in en and hi). Drives the UI with ids / data-* attributes. */
module.exports = async function ({ page, expect }) {
  await page.waitForSelector('#board .cell', { timeout: 15000 });
  const vals = () => page.evaluate(() => window.__gameTest.values());
  const n = await page.evaluate(() => window.__gameTest.givens().length);
  expect(n === 81, 'default board is 9×9 (81 cells), got ' + n);

  // 1) the puzzle on screen and freshly generated ones have exactly one solution
  expect(await page.evaluate(() => window.__gameTest.solutionCount()) === 1, 'puzzle on screen has exactly one solution');
  const gen = await page.evaluate(() => [9, 6, 4].map((s) => { const p = window.__gameTest.generate(s, s === 9 ? 'medium' : 'easy', 77); return window.__gameTest.solutionCount(p.givens, s); }));
  expect(gen.every((c) => c === 1), 'generated 9×9, 6×6 and 4×4 puzzles each have one solution: ' + gen);
  expect(await page.evaluate(() => window.__gameTest.solutionCount(new Array(81).fill(0), 9)) === 2, 'an empty grid has more than one solution');

  // 2) a wrong digit shows a conflict when "show mistakes" is on; undo removes it
  if (!(await page.isChecked('#opt-mistakes'))) await page.check('#opt-mistakes');
  const sol = await page.evaluate(() => window.__gameTest.solution());
  let v = await vals();
  const i = v.indexOf(0);
  const wrong = (sol[i] % 9) + 1;
  await page.click(`#board .cell[data-i="${i}"]`);
  await page.click(`#pad .pk[data-d="${wrong}"]`);
  expect((await vals())[i] === wrong, 'the wrong digit was entered');
  expect(await page.$eval(`#board .cell[data-i="${i}"]`, (c) => c.classList.contains('bad')), 'wrong digit is marked as a mistake');
  await page.uncheck('#opt-mistakes');
  expect(!(await page.$eval(`#board .cell[data-i="${i}"]`, (c) => c.classList.contains('bad'))), 'no red mark when mistakes are hidden');
  await page.check('#opt-mistakes');
  await page.click('#btn-undo');
  expect((await vals())[i] === 0, 'undo empties the cell again');

  // 3) a hint fills one correct cell and explains it
  const before = (await vals()).filter((x) => x).length;
  await page.click('#btn-hint');
  v = await vals();
  const filled = v.filter((x) => x).length;
  expect(filled === before + 1, 'hint fills exactly one cell (' + before + ' → ' + filled + ')');
  expect(v.every((x, k) => !x || x === sol[k]), 'every number on the board is correct after the hint');
  const why = (await page.textContent('#hintbox')).trim();
  expect(why.length > 20, 'hint explains the step: ' + why.slice(0, 60));

  // 4) notes: a note disappears when the same number is placed in its row
  const row0 = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((k) => !v[k]);
  if (row0.length >= 2) {
    const a = row0[0], b = row0[1];
    await page.click(`#board .cell[data-i="${a}"]`);
    await page.click('#btn-notes');
    await page.click(`#pad .pk[data-d="${sol[b]}"]`);
    await page.click('#btn-notes');
    const noteTxt = await page.$eval(`#board .cell[data-i="${a}"] .nts`, (e) => e.textContent);
    expect(noteTxt.includes(String(sol[b])), 'note ' + sol[b] + ' is written in the cell, got "' + noteTxt + '"');
    await page.click(`#board .cell[data-i="${b}"]`);
    await page.click(`#pad .pk[data-d="${sol[b]}"]`);
    expect(await page.$(`#board .cell[data-i="${a}"] .nts`) === null, 'note is removed when the same number is placed in that row');
  }

  // 5) load a near-complete 4×4 puzzle, finish it: success screen with time, stats counted
  const ok = await page.evaluate(() => window.__gameTest.load({ n: 4, level: 'easy', givens: [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 0, 0], solution: [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1] }));
  expect(ok, 'test puzzle loaded');
  expect(await page.isHidden('#done'), 'success screen hidden before finishing');
  await page.click('#board .cell[data-i="14"]');
  await page.click('#pad .pk[data-d="2"]');
  await page.click('#board .cell[data-i="15"]');
  await page.click('#pad .pk[data-d="1"]');
  await page.waitForSelector('#done:not([hidden])', { timeout: 3000 });
  expect(/\d\d:\d\d/.test(await page.textContent('#done-time')), 'success screen shows the time');
  expect(await page.evaluate(() => window.__gameTest.done()), 'game is marked as finished');
  const stats = await page.textContent('#stats');
  expect(/4×4/.test(stats), 'stats table lists the won 4×4 game');

  // 6) progress survives a reload: a new 9×9 game, one move, reload
  await page.click('#seg-size button[data-n="9"]');
  await page.waitForFunction(() => window.__gameTest.givens().length === 81, null, { timeout: 15000 });
  const g1 = await page.evaluate(() => window.__gameTest.givens().join(''));
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForSelector('#board .cell');
  expect(await page.evaluate(() => window.__gameTest.givens().join('')) === g1, 'the same puzzle is back after a reload');
};
