/* Interaction test for Carrom (run by tools/verify.js in en and hi).
   Uses window.__gameTest to set positions and fast-forward shots, plus the real sliders and Strike button. */
module.exports = async function ({ page, expect, log }) {
  await page.waitForFunction(() => window.__gameTest && document.getElementById('cv').width > 0);
  const st = () => page.evaluate(() => __gameTest.state());

  // 0) a fresh match: full rosette, player 1 (white) to break from the bottom
  let s = await st();
  expect(s.onBoard.w === 9 && s.onBoard.b === 9 && s.onBoard.q === 1 && s.turn === 0 && s.colors[0] === 'w' && s.mode === 'pvp',
    'new match: 9 white, 9 black, queen; white breaks: ' + JSON.stringify(s.onBoard));

  // helper: a coin on the straight line from the striker to the top-left pocket, the rest of the board set by "others"
  const setLine = (k, others, extra) => page.evaluate(([k, others, extra]) => {
    __gameTest.setup(Object.assign({ coins: [], turn: 0 }, extra));
    const L = __gameTest.lineToPocket(0, 30);
    __gameTest.setup(Object.assign({ coins: [{ k, x: L.x, y: L.y }].concat(others), turn: 0 }, extra));
    return L.angle;
  }, [k, others, extra || {}]);
  const away = [{ k: 'w', x: 12, y: 0 }, { k: 'b', x: 14, y: -12 }, { k: 'b', x: 16, y: 6 }];

  // 1) straight shot pockets own coin -> same player shoots again
  let ang = await setLine('w', away.concat([{ k: 'q', x: 0, y: 0 }]));
  s = await page.evaluate((a) => __gameTest.shoot(a, 0.62), ang);
  log('straight shot', JSON.stringify(s.last));
  expect(s.last.pocketed.length === 1 && /^w/.test(s.last.pocketed[0]) && s.last.again && s.turn === 0, 'straight shot pockets a white coin and white shoots again');
  expect((await page.getAttribute('#msg', 'data-keys')).includes('own_coin') && (await page.getAttribute('#status', 'data-turn')) === '0', 'message and turn shown on the page');

  // 2) striker into a pocket is a foul: turn passes and one pocketed white comes back to the centre
  await page.evaluate(() => __gameTest.setup({ coins: [{ k: 'w', x: 12, y: 0 }, { k: 'b', x: 14, y: -12 }, { k: 'q', x: 0, y: 0 }], turn: 0 }));
  const before = (await st()).onBoard.w;
  s = await page.evaluate(() => __gameTest.shoot(__gameTest.angleTo(-34.775, -34.775), 0.7));
  log('foul', JSON.stringify(s.last), JSON.stringify(s.onBoard));
  expect(s.last.foul && s.last.pocketed.includes('s') && !s.last.again && s.turn === 1, 'pocketing the striker is a foul and the turn passes to black');
  expect(s.onBoard.w === before + 1, 'one white coin came back to the board: ' + before + ' → ' + s.onBoard.w);
  expect((await page.getAttribute('#msg', 'data-keys')).includes('foul_striker'), 'foul message shown');

  // 3) queen cover: queen in -> shoot again; own coin next shot -> covered
  ang = await setLine('q', away);
  s = await page.evaluate((a) => __gameTest.shoot(a, 0.62), ang);
  expect(s.last.pocketed.includes('q') && s.queen.st === 'pending' && s.turn === 0, 'queen pocketed: white must cover it with the next shot');
  ang = await setLine('w', [{ k: 'b', x: 14, y: -12 }, { k: 'b', x: 16, y: 6 }, { k: 'w', x: 12, y: 0 }], { queen: { st: 'pending', by: 'w' } });
  s = await page.evaluate((a) => __gameTest.shoot(a, 0.62), ang);
  expect(s.queen.st === 'covered' && s.queen.by === 'w' && s.last.msgs.includes('queen_covered'), 'own coin on the next shot covers the queen');
  //    queen in, then a miss -> the queen goes back to the centre and the turn passes
  ang = await setLine('q', away);
  await page.evaluate((a) => __gameTest.shoot(a, 0.62), ang);
  s = await page.evaluate(() => __gameTest.shoot(30, 0.15));
  expect(s.queen.st === 'on' && s.onBoard.q === 1 && s.last.msgs.includes('queen_not_covered') && s.turn === 1, 'uncovered queen returns to the centre, turn passes');

  // 4) the real controls: sliders + Strike button animate a shot and the turn changes
  await page.evaluate(() => __gameTest.setup({ coins: [{ k: 'w', x: 12, y: 0 }, { k: 'b', x: 14, y: -12 }, { k: 'q', x: 0, y: 0 }], turn: 0 }));
  const shots0 = (await st()).shots;
  await page.evaluate(() => {
    const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    set('pos', 40); set('angle', 20); set('power', 25);
  });
  expect(Math.abs((await st()).striker.x - 0.4 * 21.91) < 0.05, 'position slider moves the striker along the base line');
  await page.click('#strike');
  await page.waitForFunction((n) => __gameTest.state().shots > n && document.getElementById('cv').dataset.phase === 'aim', shots0, { timeout: 20000 });
  s = await st();
  expect(s.shots === shots0 + 1 && s.turn === 1, 'Strike button played one shot; nothing went in, so black is next');

  // 5) last white coin with the queen covered: board over, points = black coins left + queen 3
  ang = await setLine('w', [{ k: 'b', x: 14, y: -12 }, { k: 'b', x: 16, y: 6 }], { queen: { st: 'covered', by: 'w' } });
  s = await page.evaluate((a) => __gameTest.shoot(a, 0.62), ang);
  expect(s.boardOver && s.scores[0] === 5 && s.scores[1] === 0, 'board won by white: 2 coins + queen 3 = 5 points, got ' + s.scores);
  expect(await page.isVisible('#end') && await page.isVisible('#next-board'), 'board result card with "Next board"');
  expect((await page.getAttribute('#pts0', 'data-v')) === '5', 'score bar shows 5');

  // 6) saved between boards: reload keeps the score; next board is broken by player 2 with white
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__gameTest);
  s = await st();
  expect(s.boardOver && s.scores[0] === 5, 'match saved on this device');
  await page.click('#next-board');
  s = await st();
  expect(s.boardNo === 2 && s.turn === 1 && s.colors[1] === 'w' && s.onBoard.w === 9 && !s.boardOver, 'board 2: player 2 breaks with white');
};
