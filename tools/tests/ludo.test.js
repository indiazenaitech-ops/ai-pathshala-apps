/* Interaction test for Ludo (run by tools/verify.js in en and hi).
   Uses the dice hook window.__gameTest (setRolls / fast / load / state) to make the game deterministic.
   Covers: a 6 brings a token out + bonus roll, capture sends a token to its yard, no capture on a star square,
   exact finish (overshoot not allowed, exact roll goes home + bonus), tap-to-move, a computer turn that plays
   by itself, and the game surviving a reload. */
module.exports = async function ({ page, expect, t }) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => window.__gameTest.fast(true));
  const st = () => page.evaluate(() => window.__gameTest.state());
  const until = (fn, arg) => page.waitForFunction(fn, arg, { timeout: 10000 });
  /* load a position: Red (player 0) vs Yellow (player 1), Red to roll */
  const load = (red, yellow) => page.evaluate(([r, y]) => {
    const s = window.__gameTest.state();
    s.players[0].tokens = r; s.players[1].tokens = y; s.turn = 0; s.phase = 'roll'; s.sixes = 0; s.moves = [];
    return window.__gameTest.load(s);
  }, [red, yellow]);

  // 0) default game is ready at once: Red (person) vs Yellow (computer)
  let s = await st();
  expect(s.players.length === 2 && s.players[1].type === 'cpu' && s.turn === 0, 'default: Red person vs Yellow computer, Red to play');
  expect((await page.$$('#tokLayer .tok')).length === 8, 'board shows 8 tokens');

  // 1) new game, 2 people (Red and Yellow)
  await page.click('#newBtn');
  await page.click('#presets [data-preset="2"]');
  await page.fill('#name-0', 'Asha');
  await page.click('#startBtn');
  s = await st();
  expect(s.players.every(p => p.type === 'human') && s.players[0].name === 'Asha', 'two people, names saved');

  // 2) a 6 brings a token out and gives another roll (auto-move: only one distinct move)
  await page.evaluate(() => window.__gameTest.setRolls([6]));
  await page.click('#rollBtn');
  await until(() => { const g = window.__gameTest.state(); return g.players[0].tokens.indexOf(0) >= 0 && g.phase === 'roll'; });
  s = await st();
  expect(s.players[0].tokens.filter(p => p === 0).length === 1 && s.turn === 0, '6: one token on the start square and Red rolls again');
  expect((await page.textContent('#msgSub')).includes(t('ev_again')), 'banner says roll again');
  expect(!(await page.isDisabled('#rollBtn')), 'dice can be rolled again');

  // 3) capture: Red at square 2, Yellow token 3 ahead (track square 5) -> roll 3 sends Yellow to its yard + bonus roll
  await load([2, -1, -1, -1], [31, -1, -1, -1]);
  await page.evaluate(() => window.__gameTest.setRolls([3]));
  await page.click('#rollBtn');
  await until(() => window.__gameTest.state().players[1].tokens[0] === -1);
  s = await st();
  expect(s.players[0].tokens[0] === 5 && s.players[1].tokens[0] === -1, 'capture: Yellow token back in its yard');
  expect(s.turn === 0 && s.phase === 'roll', 'capture gives a bonus roll');

  // 4) no capture on a star square (track square 8); tap to move with auto-move off
  await page.click('#autoBtn');
  expect(await page.getAttribute('#autoBtn', 'aria-pressed') === 'false', 'auto-move switched off');
  await load([5, 10, -1, -1], [34, -1, -1, -1]);
  await page.evaluate(() => window.__gameTest.setRolls([3]));
  await page.click('#rollBtn');
  await until(() => window.__gameTest.state().phase === 'move');
  expect((await page.$$('#tokLayer .tok.can')).length === 2, 'two tokens glow as legal moves');
  await page.click('#tok-0-0');
  await until(() => window.__gameTest.state().turn === 1);
  s = await st();
  expect(s.players[0].tokens[0] === 8 && s.players[1].tokens[0] === 34, 'star square: both tokens stay, no capture');

  // 5) exact finish: 2 squares from home, a 3 cannot move; a 2 goes home and gives a bonus roll
  await load([54, -1, -1, -1], [-1, -1, -1, -1]);
  await page.evaluate(() => window.__gameTest.setRolls([3]));
  await page.click('#rollBtn');
  await until(() => window.__gameTest.state().turn === 1);
  s = await st();
  expect(s.players[0].tokens[0] === 54, 'overshoot not allowed: token stays');
  await load([54, -1, -1, -1], [-1, -1, -1, -1]);
  await page.evaluate(() => window.__gameTest.setRolls([2]));
  await page.click('#rollBtn');
  await until(() => window.__gameTest.state().phase === 'move');
  await page.click('#tok-0-0');
  await until(() => window.__gameTest.state().players[0].tokens[0] === 56);
  s = await st();
  expect(s.turn === 0 && s.phase === 'roll', 'reaching home gives a bonus roll');
  expect((await page.textContent('#pl-0')).includes(t('home_n', { n: 1 })), 'player list shows 1/4 home');
  await page.click('#autoBtn');

  // 6) computer turn happens by itself: Red rolls 3 (no move), Yellow (computer) rolls 6 + 2 alone
  await page.click('#newBtn');                       // a game is in progress: the confirm is accepted by the runner
  await page.click('#presets [data-preset="cpu"]');
  await page.click('#startBtn');
  await page.evaluate(() => window.__gameTest.setRolls([3, 6, 2]));
  await page.click('#rollBtn');
  await until(() => { const g = window.__gameTest.state(); return g.turn === 0 && g.stats.reduce((a, b) => a + b, 0) === 3; });
  s = await st();
  expect(s.players[1].type === 'cpu' && s.players[1].tokens.filter(p => p === 2).length === 1, 'computer brought a token out and moved it 2');
  expect((await page.$$('#log li')).length >= 3, 'move log lists the turns');

  // 7) saved on the device: reload keeps the position
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => window.__gameTest.state());
  expect(r.players[1].tokens.join() === s.players[1].tokens.join() && r.turn === 0, 'game resumes after reload');
};
