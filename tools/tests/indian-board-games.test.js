/* Indian Board Games: drive the three rules engines through the real board UI.
   window.__gameTest.load() sets a known position (pass-and-play), then we tap points like a player. */
module.exports = async function ({ page, expect }) {
  const st = (id) => page.evaluate((g) => window.__gameTest.state(g), id);

  /* 1. Aadu Puli Attam: a tiger jumps over a goat into the empty point beyond and captures it */
  await page.click('#tab-apl');
  await page.evaluate(() => {
    const H = window.__gameTest.engine.hunt;
    const s = H.init('apl', { target: 6 });
    s.b = s.b.map(() => 0);
    s.b[0] = 2; s.b[3] = 2; s.b[4] = 2;   // tigers: apex + two middle points of row 1
    s.b[2] = 1;                            // a goat just below the apex on the left inner line
    s.turn = 2; s.hand = 14;
    window.__gameTest.load('apl', s);
  });
  expect(await page.locator('#board use[href="#ibg-goat"]').count() === 1, 'one goat on the board before the jump');
  await page.click('#board [data-pt="0"]');
  expect(await page.locator('#board .dest, #board .capr').count() > 0, 'selecting the tiger shows its moves');
  await page.click('#board [data-pt="8"]');
  let s = await st('apl');
  expect(s.cap === 1, 'tiger captured one goat, cap=' + s.cap);
  expect(s.b[2] === 0 && s.b[8] === 2 && s.b[0] === 0, 'goat removed and tiger landed beyond it: ' + s.b.join(''));
  expect(s.turn === 1, 'goats to play after the capture');
  expect(await page.locator('#board use[href="#ibg-goat"]').count() === 0, 'captured goat is gone from the board');
  // an illegal move does nothing: goat placement on an occupied point
  await page.click('#board [data-pt="8"]');
  s = await st('apl');
  expect(s.hand === 14 && s.b[8] === 2, 'placing a goat on a tiger is refused');

  /* 2. Navakankari: forming a mill lets you remove an opponent piece (not one inside a mill) */
  await page.click('#tab-nav');
  await page.evaluate(() => {
    const M = window.__gameTest.engine.morris;
    const s = M.init({ fly: true });
    s.b[0] = 1; s.b[1] = 1;                       // player 1 needs point 2 for a mill
    s.b[9] = 2; s.b[10] = 2;                      // free pieces of player 2
    s.b[21] = 2; s.b[22] = 2; s.b[23] = 2;        // player 2 mill (protected)
    s.hand = [0, 7, 4]; s.turn = 1;
    window.__gameTest.load('nav', s);
  });
  await page.click('#board [data-pt="2"]');
  expect(await page.locator('#board .remr').count() === 2, 'two removable pieces are marked (mill pieces are protected)');
  await page.click('#board [data-pt="22"]');      // protected: must not be removed
  s = await st('nav');
  expect(s.b[22] === 2 && s.turn === 1, 'a piece inside a mill cannot be removed');
  await page.click('#board [data-pt="9"]');
  s = await st('nav');
  expect(s.b[2] === 1 && s.b[9] === 0, 'mill formed and opponent piece at 9 removed');
  expect(s.turn === 2 && s.hand[1] === 6, 'turn passes to player 2 and one piece left the hand');
  expect(await page.locator('#board use[href="#ibg-p2"]').count() === 4, 'player 2 has 4 pieces left on the board');

  /* 3. Pallanguzhi: known sowing with relay and capture */
  await page.click('#tab-pal');
  await page.evaluate(() => {
    window.__gameTest.instant(true);
    const P = window.__gameTest.engine.pal;
    const s = P.init({ seeds: 5, pasu: true, rounds: 3 });
    s.pits = [1, 0, 3, 0, 0, 0, 0, 5, 1, 0, 0, 0, 0, 0];
    s.st = [30, 25]; s.turn = 0;
    window.__gameTest.load('pal', s);
  });
  // pit 0 (1 seed) -> pit 1; next pit 2 has 3: pick up and sow 3,4,5; next pit 6 empty -> capture pit 7 (5 seeds)
  await page.click('#board [data-pt="0"]');
  s = await st('pal');
  expect(JSON.stringify(s.pits) === JSON.stringify([0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0]), 'pit counts after sowing: ' + s.pits.join(','));
  expect(s.st[0] === 35 && s.st[1] === 25, 'bottom player captured 5 seeds: ' + s.st.join('/'));
  expect(s.turn === 1, 'turn passes to the top row');
  const pitText = await page.locator('#board [data-pt="3"] text').textContent();
  expect(pitText.trim() === '1', 'board shows 1 seed in pit 4, got ' + pitText);
  // pasu: top row sows pit 8 (1 seed) into pit 9 which then holds... set up a pasu directly
  await page.evaluate(() => {
    const P = window.__gameTest.engine.pal;
    const s = P.init({ seeds: 5, pasu: true, rounds: 3 });
    s.pits = [1, 3, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0];
    s.st = [20, 43]; s.turn = 0;
    window.__gameTest.load('pal', s);
  });
  await page.click('#board [data-pt="0"]');
  s = await st('pal');
  expect(s.st[0] === 26, 'pasu (4 seeds) plus capture of 2 seeds gives 6: ' + s.st[0]);
};
