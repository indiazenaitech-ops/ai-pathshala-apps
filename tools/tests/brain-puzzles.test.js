/* Interaction test for Brain Puzzles (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect }) {
  const wait = (ms) => page.waitForTimeout(ms);

  /* 1) 2048: row [2,2,2,2] moved left becomes [4,4,0,0] and the score goes up by 8 */
  await page.click('#tab-t2048');
  await page.evaluate(() => {
    window.__gameTest.set2048([2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 4);
    window.__gameTest.queueSpawn([{ i: 15, v: 2 }]);
  });
  const before = await page.evaluate(() => window.__gameTest.state().g.t2048.score);
  await page.click('#host [data-dir="left"]');
  await wait(250);
  const g1 = await page.evaluate(() => { const s = window.__gameTest.state().g.t2048; return { grid: window.__gameTest.engine.g2048.toGrid(s.tiles, s.n), score: s.score }; });
  expect(g1.grid.slice(0, 4).join(',') === '4,4,0,0', '2048 row [2,2,2,2] left should be [4,4,0,0], got ' + g1.grid.slice(0, 4));
  expect(g1.score - before === 8, '2048 score should rise by 8, got ' + (g1.score - before));
  expect(g1.grid[15] === 2, 'queued new tile appears at the last cell');
  const shown = await page.getAttribute('#grid-2048', 'data-grid');
  expect(shown.startsWith('4,4,0,0'), 'board on screen shows 4,4,0,0, got ' + shown);
  expect((await page.textContent('#sc-score')).trim() === '8', 'score tile shows 8');
  /* keyboard works too: right arrow on the board */
  await page.focus('#board-2048');
  await page.keyboard.press('ArrowRight');
  await wait(200);
  const g2 = await page.evaluate(() => { const s = window.__gameTest.state().g.t2048; return window.__gameTest.engine.g2048.toGrid(s.tiles, s.n); });
  expect(g2[3] === 8, 'ArrowRight merges 4+4 into 8 at the right edge, got row ' + g2.slice(0, 4));
  await page.click('#undo');
  const g3 = await page.evaluate(() => { const s = window.__gameTest.state().g.t2048; return window.__gameTest.engine.g2048.toGrid(s.tiles, s.n); });
  expect(g3.slice(0, 4).join(',') === '4,4,0,0', 'undo restores the previous board');

  /* 2) Number Slide: one move from solved; tapping tile 15 solves it */
  await page.click('#tab-slide');
  await page.evaluate(() => window.__gameTest.setSlide([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15]));
  await page.click('#board-slide [data-v="15"]');
  await wait(200);
  const sb = await page.getAttribute('#board-slide', 'data-board');
  expect(sb === '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0', 'slide board solved after the move, got ' + sb);
  expect(await page.evaluate(() => document.querySelector('#status').classList.contains('win')), 'slide shows the win status');
  expect((await page.textContent('#sc-moves')).trim() === '1', 'slide move counter is 1');
  expect((await page.textContent('#sc-bm')).trim() === '1', 'fewest moves best is saved as 1');

  /* 3) Lights Out: a press toggles the plus shape of 5 cells */
  await page.click('#tab-lights');
  await page.evaluate(() => { const b = new Array(25).fill(0); b[0] = 1; window.__gameTest.setLights(b); });
  await page.click('#board-lights [data-cell="12"]');
  const lb = await page.getAttribute('#board-lights', 'data-board');
  const want = '1000000100011100010000000';
  expect(lb === want, 'centre press lights the cross of 5 cells: got ' + lb);
  expect((await page.textContent('#sc-lit')).trim() === '6', 'lights-on counter is 6');
  await page.click('#board-lights [data-cell="12"]');
  expect((await page.getAttribute('#board-lights', 'data-board')) === '1' + '0'.repeat(24), 'pressing again undoes the cross');
  /* hint marks one cell of a real solution */
  await page.evaluate(() => window.__gameTest.setLights(window.__gameTest.engine.lights.generate(5)));
  await page.click('#hint');
  const hinted = await page.evaluate(() => { const g = window.__gameTest.state().g.lights; const sol = window.__gameTest.engine.lights.solve(g.board, 5); return { cell: g.hintCell, ok: sol.indexOf(g.hintCell) >= 0 }; });
  expect(hinted.cell >= 0 && hinted.ok, 'hint shows a press that is part of a solution');
  expect(await page.evaluate(() => !!document.querySelector('#board-lights button.hint')), 'hint ring is drawn');

  /* 4) Memory Sequence: correct sequence is accepted, a wrong pad ends a strict game */
  await page.click('#tab-simon');
  await page.evaluate(() => window.__gameTest.setSimon([0, 1, 2], 'strict'));
  await page.click('#simon [data-pad="0"]');
  await page.click('#simon [data-pad="1"]');
  await page.click('#simon [data-pad="2"]');
  const s1 = await page.evaluate(() => window.__gameTest.state().g.simon);
  expect(s1.level === 3, 'level 3 after repeating 3 pads, got ' + s1.level);
  await page.waitForFunction(() => window.__gameTest.state().g.simon.phase === 'input', null, { timeout: 5000 });
  const s2 = await page.evaluate(() => window.__gameTest.state().g.simon);
  expect(s2.seq.length === 4 && s2.seq.slice(0, 3).join(',') === '0,1,2', 'the next round adds one pad to the same sequence');
  await page.evaluate(() => window.__gameTest.setSimon([3, 3, 1, 0], 'strict'));
  await page.click('#simon [data-pad="2"]');
  const s3 = await page.evaluate(() => window.__gameTest.state().g.simon);
  expect(s3.phase === 'over', 'a wrong pad ends a strict game, phase ' + s3.phase);
  expect(await page.evaluate(() => document.querySelector('#status').classList.contains('lose')), 'game over status shown');
  expect((await page.textContent('#sc-best')).trim() === '3', 'best level 3 is kept');

  /* 5) state survives a reload */
  await page.reload();
  await page.waitForFunction(() => window.EDU_READY && window.__gameTest);
  const after = await page.evaluate(() => window.__gameTest.state());
  expect(after.tab === 'simon' && after.best.simon_strict === 3 && after.best.slide_4.m === 1, 'tab and best scores are restored after reload');
};
