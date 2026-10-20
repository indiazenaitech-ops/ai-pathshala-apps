/* Interaction test for Chess. Run by tools/verify.js in en and hi (dialogs are auto-accepted).
   Drives the real board with clicks / drags on the SVG squares ([data-sq="e2"]). */
module.exports = async function ({ page, lang, expect, t, log }) {
  const st = () => page.evaluate(() => window.__gameTest.state());
  const sq = (s, board = '#play-board') => `${board} [data-sq="${s}"]`;
  const tap = async (s, board) => page.click(sq(s, board));
  const play = async (list, board) => { for (const m of list) { await tap(m.slice(0, 2), board); await tap(m.slice(2, 4), board); } };
  const center = async (s, board) => { const b = await page.locator(sq(s, board)).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  const closeModal = async () => { if (await page.$('#go-review')) await page.click('#go-review'); };

  await page.evaluate(() => window.__gameTest.setSeed(12345));
  await page.click('#tabbtn-play');

  // 1) two players on one device: Fool's mate ends in checkmate, Black wins
  await page.click('#mode-human');
  await page.click('#clk-none');
  await page.click('#new-game');
  let s = await st();
  expect(s.mode === 'human' && s.moves.length === 0 && s.turn === 'w', 'new 2-player game starts empty with White to move');
  await play(['f2f3', 'e7e5', 'g2g4', 'd8h4']);
  s = await st();
  expect(s.moves.join(' ') === 'f3 e5 g4 Qh4#', "move list in SAN: f3 e5 g4 Qh4#, got " + s.moves.join(' '));
  expect(s.over && s.result === '0-1' && s.reason === 'checkmate', `Fool's mate is checkmate 0-1, got ${s.result} ${s.reason}`);
  await page.waitForSelector('#over-box', { timeout: 3000 });
  const overTxt = (await page.textContent('#over-text')).trim();
  expect(overTxt === t('over_mate_b'), `game-over dialog says "${t('over_mate_b')}", got "${overTxt}"`);
  expect((await page.textContent('#status')).trim() === t('over_mate_b'), 'status line shows the result');
  const listTxt = await page.textContent('#mlist');
  expect(listTxt.includes('Qh4#'), 'SAN move list on screen contains Qh4#');
  await closeModal();

  // 2) castling: dots on g1 and c1-side, and a drag e1 → g1 castles (rook jumps to f1)
  await page.click('#new-game');
  await play(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5']);
  await tap('e1');
  expect(!!(await page.$('#play-board [data-dot="g1"]')), 'castling square g1 is offered (legal-move dot)');
  expect(!(await page.$('#play-board [data-dot="c1"]')), 'queenside castling is not offered (pieces in the way)');
  await tap('e1');   // deselect, then drag
  const [x1, y1] = await center('e1'), [x2, y2] = await center('g1');
  await page.mouse.move(x1, y1); await page.mouse.down();
  await page.mouse.move(x2, y2, { steps: 8 }); await page.mouse.up();
  s = await st();
  expect(s.moves[s.moves.length - 1] === 'O-O', 'drag e1→g1 plays O-O, got ' + s.moves[s.moves.length - 1]);
  expect(s.fen.split(' ')[0].endsWith('RNBQ1RK1'), 'after O-O the king is on g1 and the rook on f1: ' + s.fen);
  expect(s.fen.split(' ')[2] === 'kq', 'White lost both castling rights: ' + s.fen.split(' ')[2]);

  // 3) en passant: e4-e5, ...d7-d5, then exd6 removes the d5 pawn
  await page.click('#new-game');   // game in progress → confirm (auto-accepted)
  s = await st();
  expect(s.moves.length === 0, 'New game (after confirm) clears the board');
  await play(['e2e4', 'a7a6', 'e4e5', 'd7d5']);
  await tap('e5');
  expect(!!(await page.$('#play-board [data-dot="d6"]')), 'en passant square d6 is offered');
  await tap('d6');
  s = await st();
  const rows = s.fen.split(' ')[0].split('/');
  expect(s.moves[s.moves.length - 1] === 'exd6', 'en passant written as exd6, got ' + s.moves[s.moves.length - 1]);
  expect(rows[3] === '8' && rows[2] === 'p2P4', 'd5 pawn is gone and the white pawn stands on d6: ' + s.fen);

  // 4) take back in 2-player mode undoes exactly one move
  await page.click('#undo');
  s = await st();
  expect(s.moves.length === 4 && s.turn === 'w', 'Take back undoes one move in 2-player mode');

  // 5) against the computer: it answers with a legal move within a few seconds, and the game survives a reload
  await page.click('#mode-cpu');
  await page.click('#lv-3');
  await page.click('#col-w');
  await page.click('#new-game');
  await tap('d2'); await tap('d4');
  const t0 = Date.now();
  await page.waitForFunction(() => window.__gameTest.state().moves.length === 2, null, { timeout: 8000 });
  const ms = Date.now() - t0;
  s = await st();
  const legal = await page.evaluate(() => window.__gameTest.legalUci(null, ['d2d4']));
  expect(legal.includes(s.uci[1]), `computer move ${s.uci[1]} is legal`);
  expect(ms < 6000, `computer replied in ${ms} ms`);
  expect(s.turn === 'w' && !s.thinking, 'after the reply it is your move again');
  log('computer replied', s.moves[1], 'in', ms, 'ms');
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(700);
  s = await st();
  expect(s.moves.length === 2 && s.mode === 'cpu' && s.level === 3, 'game, mode and level are restored after reload');
  await page.click('#undo');
  s = await st();
  expect(s.moves.length === 0, 'Take back against the computer removes your move and its reply');

  // 6) hint: the computer suggests a legal move (arrow + text)
  await page.click('#hint');
  await page.waitForFunction(() => document.querySelector('#status').dataset.kind === 'good', null, { timeout: 6000 });
  expect(!!(await page.$('#play-board .arrows line')), 'hint draws an arrow on the board');

  // 7) puzzles: mate in 1 (Rd8#) and a mate in 2 against the computer's defence
  await page.click('#tabbtn-puzzles');
  await page.click('#pz-btn-0');
  await tap('d1', '#pz-board'); await tap('d8', '#pz-board');
  let p = await page.evaluate(() => window.__gameTest.puzzle());
  expect(p.done && p.solved >= 1, 'puzzle 1 (Rd8#) is solved');
  expect(await page.$eval('#pz-btn-0', b => b.classList.contains('solved')), 'puzzle 1 is ticked in the list');
  const m2 = await page.evaluate(() => window.CHESS_PUZZLES.findIndex(q => q.n === 2));
  await page.click('#pz-btn-' + m2);
  p = await page.evaluate(() => window.__gameTest.puzzle());
  await tap(p.sol.slice(0, 2), '#pz-board'); await tap(p.sol.slice(2, 4), '#pz-board');
  await page.waitForFunction(() => { const q = window.__gameTest.puzzle(); return q.phase === 'solve' && / w /.test(q.fen); }, null, { timeout: 8000 });
  p = await page.evaluate(() => window.__gameTest.puzzle());
  const mate = await page.evaluate((fen) => {
    const E = window.ChessEngine, pos = E.parseFen(fen).pos;
    const m = pos.legalMoves().find(x => { pos.make(x); const ok = pos.inCheck() && !pos.hasLegalMove(); pos.unmake(); return ok; });
    return m ? E.uci(m) : null;
  }, p.fen);
  expect(!!mate, 'after the defence a mate exists');
  await tap(mate.slice(0, 2), '#pz-board'); await tap(mate.slice(2, 4), '#pz-board');
  p = await page.evaluate(() => window.__gameTest.puzzle());
  expect(p.done && p.solved >= 2, 'mate-in-2 puzzle solved');

  // 8) learn: the knight catches its three pawns in three moves
  await page.click('#tabbtn-learn');
  await page.click('#pc-n');
  await play(['b1c3', 'c3e4', 'e4f6'], '#learn-board');
  const l = await page.evaluate(() => window.__gameTest.lesson());
  expect(l.piece === 'n' && l.left === 0 && l.count === 3, `knight lesson done in 3 moves: ${JSON.stringify(l)}`);
  await play(['e5d6'], '#sp-ep-board');
  expect((await page.$eval('#sp-ep-msg', e => e.dataset.kind)) === 'good', 'en passant lesson accepts exd6');

  await page.click('#tabbtn-play');
};
