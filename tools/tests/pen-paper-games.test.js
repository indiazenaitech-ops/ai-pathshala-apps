/* Interaction test for "Tic-Tac-Toe & More". Run by tools/verify.js in en and hi. */
module.exports = async function ({ page, expect, log }) {
  const st = () => page.evaluate(() => window.__gameTest.state());
  const idle = (pred) => page.waitForFunction(pred || (() => window.__gameTest.idle()), null, { timeout: 20000 });

  // ---------- 1) Tic-Tac-Toe vs Hard computer: it answers a corner with the centre and blocks a threat
  await page.click('#tab-ttt');
  await page.click('#level [data-level="hard"]');
  let s = await st();
  expect(s.games.ttt.mode === 'cpu' && s.games.ttt.level === 'hard' && s.games.ttt.size === 3, 'tic-tac-toe vs Hard computer on 3 × 3');
  await page.click('#ttt-board [data-cell="0"]');
  await idle(() => window.__gameTest.state().games.ttt.moves === 2 && window.__gameTest.idle());
  s = await st();
  expect(s.games.ttt.board[4] === 2, 'Hard answers a corner with the centre (the only move that does not lose), got ' + s.games.ttt.board.join(''));
  await page.click('#ttt-board [data-cell="1"]');            // X threatens 0-1-2
  await idle(() => window.__gameTest.state().games.ttt.moves === 4 && window.__gameTest.idle());
  s = await st();
  expect(s.games.ttt.board[2] === 2, 'Hard blocks the immediate winning threat at the top-right square, got ' + s.games.ttt.board.join(''));
  expect(!s.games.ttt.over, 'game continues after the block');

  // thinking overlay on an empty 3 × 3 board: every square is a draw
  await page.check('#ttt-think');
  await page.click('#new-game');
  await page.waitForFunction(() => document.querySelectorAll('#ttt-board button.r-draw').length === 9, null, { timeout: 15000 });
  expect((await page.textContent('#think-msg')).includes('255,168') || (await page.textContent('#think-msg')).includes('2,55,168'), 'explanation counts all 255,168 possible games');

  // ---------- 2) Four in a Row, 2 players: a diagonal win, then a vertical win
  await page.click('#tab-c4');
  await page.click('#mode [data-mode="two"]');
  s = await st();
  expect(s.games.c4.mode === 'two' && s.games.c4.moves === 0, '2-player Four in a Row starts empty');
  const first = s.games.c4.turn;
  for (const c of [0, 1, 1, 2, 3, 2, 2, 3, 6, 3, 3]) await page.click(`#c4-cols [data-col="${c}"]`);
  s = await st();
  const diag = [0 * 6 + 0, 1 * 6 + 1, 2 * 6 + 2, 3 * 6 + 3];
  expect(s.games.c4.over && s.games.c4.winner === first, 'diagonal four is detected as a win, winner ' + s.games.c4.winner);
  expect(JSON.stringify((s.games.c4.line || []).slice().sort((a, b) => a - b)) === JSON.stringify(diag), 'the winning diagonal is highlighted: ' + JSON.stringify(s.games.c4.line));
  expect(await page.$$eval('#c4-svg .pc.win', e => e.length) === 4, 'four winning discs are marked');
  await page.click('#new-game');
  s = await st();
  const first2 = s.games.c4.turn;
  expect(first2 !== first, 'players take turns to start');
  for (const c of [4, 5, 4, 5, 4, 5, 4]) await page.click(`#c4-cols [data-col="${c}"]`);
  s = await st();
  expect(s.games.c4.over && s.games.c4.winner === first2 && s.games.c4.line.every(i => Math.floor(i / 6) === 4), 'vertical four in column 5 wins');
  expect(s.games.c4.score[first] === 1 && s.games.c4.score[first2] === 1, 'scoreboard counts one win each');

  // ---------- 3) Dots and Boxes: closing a box scores a point and keeps the turn
  await page.click('#tab-dots');
  await page.click('#mode [data-mode="two"]');
  await page.click('#dots-size [data-size="3"]');
  s = await st();
  expect(s.games.dots.size === 3 && s.games.dots.lines.length === 24, '3 × 3 boxes board has 24 lines');
  const a = s.games.dots.turn, b = 3 - a;
  for (const l of [0, 12, 3]) await page.click(`#dots-svg .hit[data-line="${l}"]`);
  s = await st();
  expect(s.games.dots.turn === b && s.games.dots.pts[1] + s.games.dots.pts[2] === 0, 'no box yet, turns alternate');
  await page.click('#dots-svg .hit[data-line="13"]');
  s = await st();
  expect(s.games.dots.boxes[0] === b && s.games.dots.pts[b] === 1, 'the 4th side gives the box and a point to the player who drew it');
  expect(s.games.dots.turn === b, 'completing a box keeps the turn');
  expect((await page.getAttribute('#status', 'class')).indexOf('win') < 0 && (await page.textContent('#dots-pts')).includes('1'), 'live box count shown');

  // ---------- 4) Bulls and Cows: a known secret is scored correctly
  await page.click('#tab-bulls');
  expect(await page.evaluate(() => window.__gameTest.setSecret('1234')), 'test hook sets the secret');
  await page.fill('#bc-input', '1243');
  await page.click('#bc-go');
  s = await st();
  let h = s.games.bulls.hist[1];
  expect(h.length === 1 && h[0].g === '1243' && h[0].b === 2 && h[0].c === 2, '1243 against 1234 = 2 bulls, 2 cows, got ' + JSON.stringify(h));
  const row = await page.$$eval('#bc-hist-1 tbody tr td', tds => tds.map(td => td.textContent.trim()));
  expect(row[1] === '1243' && row[2] === '2' && row[3] === '2', 'history row shows the guess and the score: ' + row.join('|'));
  await page.fill('#bc-input', '1123');
  await page.click('#bc-go');
  expect(await page.$('#bc-err') !== null && (await st()).games.bulls.hist[1].length === 1, 'a guess with a repeated digit is refused');
  await page.check('#bc-hint');
  const left = Number((await page.textContent('#bc-left')).replace(/[^0-9]/g, ''));
  expect(left === 6, 'numbers still possible after 2 bulls 2 cows = 6, got ' + left);
  await page.fill('#bc-input', '1234');
  await page.click('#bc-go');
  s = await st();
  expect(s.games.bulls.over && s.games.bulls.best === 2, 'cracked in 2 guesses, best = ' + s.games.bulls.best);
  expect((await page.getAttribute('#status', 'class')).includes('win'), 'success message shown');

  // ---------- 5) everything survives a reload
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__gameTest);
  s = await st();
  expect(s.tab === 'bulls' && s.games.dots.pts[s.games.dots.boxes[0]] === 1 && s.games.c4.score[first] === 1, 'tab, boxes and scores are kept after reload');
  log('worker', await page.evaluate(() => window.__gameTest.worker()));
};
