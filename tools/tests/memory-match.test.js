/* Interaction test for Memory Card Game (run by tools/verify.js in en and hi).
   window.__gameTest.noShuffle() deals cards in pair order (0,0,1,1,2,2,...) so the test knows where pairs are;
   fast() shortens the "turn back" delay. Normal play is unchanged. */
module.exports = async function ({ page, lang, expect, t }) {
  const st = () => page.evaluate(() => window.__gameTest.state());
  const card = (i) => `#board .mm-card[data-i="${i}"]`;
  const cls = (i) => page.getAttribute(card(i), 'class');
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();

  await page.waitForSelector('#board .mm-card');
  expect(await page.locator('#board .mm-card').count() === 12, 'default board is 3×4 = 12 cards');

  /* deterministic deal, small board, solo */
  await page.evaluate(() => { window.__gameTest.noShuffle(); window.__gameTest.fast(); });
  await page.selectOption('#size', '2x3');
  await page.waitForFunction(() => document.querySelectorAll('#board .mm-card').length === 6);
  let s = await st();
  expect(s.mode === 'solo' && s.pairs.join() === '0,0,1,1,2,2', 'unshuffled 2×3 deal: ' + s.pairs.join());

  /* 1. a non-matching pair turns back */
  await page.click(card(0));
  await page.click(card(2));
  expect((await cls(0)).includes('up') && (await cls(2)).includes('up'), 'both cards face up right after the second flip');
  await page.waitForFunction(() => window.__gameTest.state().st.every(x => x === 0));
  expect(!(await cls(0)).includes('up') && !(await cls(2)).includes('up'), 'non-matching cards flipped back');
  s = await st();
  expect(s.moves === 1 && s.found === 0, 'one move, no pairs yet');
  expect(await txt('#stMoves') === '1', 'moves counter shows 1, got ' + await txt('#stMoves'));

  /* 2. a matching pair stays face up and increases the score */
  await page.click(card(0));
  await page.click(card(1));
  await page.waitForTimeout(250);
  s = await st();
  expect(s.st[0] === 2 && s.st[1] === 2 && (await cls(0)).includes('done') && (await cls(1)).includes('done'), 'matched pair stays face up');
  expect(s.found === 1 && s.scores[0] === 1, 'score increased to 1 pair');
  expect((await txt('#stPairs')) === '1/3', 'pairs counter 1/3, got ' + await txt('#stPairs'));
  /* clicking a matched card does nothing */
  await page.click(card(0), { force: true });
  expect((await st()).moves === 2, 'matched card is not counted again');

  /* keyboard: focus card 2, arrow right to 3, Enter flips; then finish the board */
  await page.focus(card(2));
  await page.keyboard.press('Enter');
  const right = lang === 'ur' ? 'ArrowLeft' : 'ArrowRight';
  await page.keyboard.press(right);
  await page.keyboard.press('Enter');
  s = await st();
  expect(s.st[2] === 2 && s.st[3] === 2, 'keyboard arrows + Enter matched the second pair');
  await page.click(card(4));
  await page.click(card(5));

  /* 3. finishing the 2×3 board shows the result with the right move count (1 miss + 3 pairs = 4) */
  await page.waitForSelector('#result:not([hidden])');
  s = await st();
  expect(s.done && s.moves === 4, 'game over after 4 moves, got ' + s.moves);
  expect(await txt('#resMoves') === '4', 'result shows 4 moves, got ' + await txt('#resMoves'));
  expect(await txt('#resTitle') === t('res_solo'), 'celebration title shown');
  expect(await page.isVisible('#resBest'), 'first finished game is a new best score');
  const best = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.memory-match.best') || '{}'));
  expect(best['fruits|2x3'] && best['fruits|2x3'].m === 4, 'best score saved for fruits 2×3');
  expect((await page.locator('#bestTable tbody tr').count()) === 1, 'best scores table has one row');

  /* play again resets the board */
  await page.click('#againBtn');
  await page.waitForSelector('#result', { state: 'hidden' });
  s = await st();
  expect(s.moves === 0 && s.found === 0 && s.st.every(x => x === 0), 'play again starts a fresh board');

  /* 4. two players: a match keeps the turn, a miss passes it */
  await page.click('#modeSeg button[data-mode="players"]');
  await page.waitForSelector('#playersBox:not([hidden])');
  await page.fill('#pname0', 'Asha');
  await page.fill('#pname1', 'Ravi');
  s = await st();
  expect(s.mode === 'players' && s.np === 2 && s.turn === 0, 'two-player game, player 1 starts');
  expect((await txt('#pl0 .nm')) === 'Asha' && (await page.getAttribute('#pl0', 'class')).includes('on'), 'scoreboard shows Asha on turn');
  await page.click(card(0));
  await page.click(card(1));
  s = await st();
  expect(s.scores[0] === 1 && s.turn === 0, 'after a match Asha keeps the turn');
  expect((await txt('#msg')) === t('msg_match_p', { name: 'Asha' }), 'message says Asha plays again');
  await page.click(card(2));
  await page.click(card(4));
  await page.waitForFunction(() => window.__gameTest.state().turn === 1);
  s = await st();
  expect(s.turn === 1 && s.scores.join() === '1,0', 'after a miss the turn passes to Ravi');
  expect((await page.getAttribute('#pl1', 'class')).includes('on'), 'scoreboard highlights Ravi');
  await page.click(card(2));
  await page.click(card(3));
  s = await st();
  expect(s.scores.join() === '1,1' && s.turn === 1, 'Ravi scores and keeps the turn');
  await page.click(card(4));
  await page.click(card(5));
  await page.waitForSelector('#result:not([hidden])');
  expect((await txt('#resTitle')) === t('res_win', { name: 'Ravi' }), 'Ravi wins 2–1: ' + await txt('#resTitle'));
  expect((await page.locator('#resRank li').count()) === 2, 'ranking lists both players');

  /* 5. learning deck: numbers ↔ words in the page language, settings remembered */
  await page.click('#againBtn');
  await page.click('#modeSeg button[data-mode="solo"]');
  await page.selectOption('#deck', 'numbers');
  await page.waitForFunction(() => window.__gameTest.state().mode === 'solo');
  const faces = await page.evaluate(() => Array.from(document.querySelectorAll('#board .mm-face')).map(f => f.textContent.trim()));
  const want = await page.evaluate((L) => window.APP_CONTENT[L].nums[0], lang);
  expect(faces[0] === '1' && faces[1] === want, `numeral 1 pairs with "${want}", got ${faces[0]} / ${faces[1]}`);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.memory-match.settings') || '{}'));
  expect(saved.deck === 'numbers' && saved.size === '2x3' && saved.names[0] === 'Asha', 'settings saved on this device');

  /* 6. reset scores */
  await page.click('#resetScores');
  await page.waitForSelector('#bestEmpty:not([hidden])');
  expect((await page.evaluate(() => localStorage.getItem('edu.memory-match.best'))) === null, 'best scores cleared');
};
