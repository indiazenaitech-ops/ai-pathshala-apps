/* Interaction test for Party Games (run by tools/verify.js in en and hi).
   Covers: two named teams on the shared scoreboard, a Dumb Charades round with a fixed deck (window.__gameTest),
   3 correct + 1 skip -> team score 3 and 4 cards used, the round ending when the timer reaches 0, the round summary,
   the turn passing to the next team, Antakshari "Random letter" and points, an icebreaker, persistence after reload. */
module.exports = async function ({ page, expect, t }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const st = () => page.evaluate(() => window.__gameTest.state());

  // 1) two teams with names
  expect((await page.$$('#scores .score-tile')).length === 2, 'two teams by default');
  await page.click('#teamsBtn');
  await page.fill('#teamName0', 'Sharma Family');
  await page.fill('#teamName1', 'Iyer Family');
  await page.click('#teamsBtn');
  const tiles = await page.$$eval('#scores .score-tile .nm', (els) => els.map((e) => e.textContent.trim()));
  expect(tiles[0] === 'Sharma Family' && tiles[1] === 'Iyer Family', 'scoreboard shows both team names, got ' + tiles.join(' / '));
  expect((await txt('#ch-turn')).includes('Sharma Family'), 'first turn is team 1');

  // 2) charades round with a fixed deck
  await page.evaluate(() => window.__gameTest.setDeck(['Mango', 'Tiger', 'Kite', 'Dosa', 'Chess', 'Peacock', 'Train']));
  await page.click('#ch-start');
  let s = await st();
  expect(s.round === 'running' && s.card === 'Mango', 'round runs and shows the first fixed card, got ' + JSON.stringify(s));
  expect(await txt('#ch-word') === '', 'the word stays hidden from the guessers until the actor taps the card');
  await page.click('#ch-card');
  expect(await txt('#ch-word') === 'Mango', 'tapping the card reveals the word');
  await page.click('#ch-correct');
  await page.click('#ch-correct');
  await page.click('#ch-correct');
  await page.click('#ch-skip');
  s = await st();
  expect(s.scores[0] === 3 && s.scores[1] === 0, 'team 1 has 3 points, team 2 has 0, got ' + s.scores);
  expect(s.used === 4, '4 cards used (3 correct + 1 skipped), got ' + s.used);
  expect(await txt('#score-0') === '3', 'scoreboard shows 3, got ' + await txt('#score-0'));
  expect(s.card === 'Chess', 'the fifth card comes next, got ' + s.card);
  expect((await txt('#ch-used')).includes('4'), 'used counter mentions 4: ' + await txt('#ch-used'));

  // Space pauses, Space resumes (host key)
  await page.keyboard.press('Space');
  expect((await st()).round === 'paused', 'Space pauses the round');
  await page.keyboard.press('Space');
  expect((await st()).round === 'running', 'Space resumes the round');
  await page.keyboard.press('ArrowRight');
  expect((await st()).scores[0] === 4, 'Arrow right counts a correct answer');

  // 3) the timer reaching 0 ends the round
  await page.evaluate(() => window.__gameTest.setTimeLeft('ch', 0.4));
  await page.waitForFunction(() => window.__gameTest.state().round === 'done', null, { timeout: 5000 });
  expect(!(await page.isHidden('#ch-summary')), 'round summary is shown');
  const sum = await txt('#ch-summary');
  expect(sum.includes('Mango') && sum.includes('Dosa'), 'summary lists the guessed and skipped words: ' + sum.slice(0, 120));
  expect(await txt('#ch-timer') === '0:00', 'timer shows 0:00, got ' + await txt('#ch-timer'));
  expect(await page.isDisabled('#ch-correct'), 'no more answers after the round ended');
  await page.click('#ch-start');                                   // "Next team"
  s = await st();
  expect(s.turn === 1 && s.round === 'idle', 'turn passes to team 2, got ' + JSON.stringify(s));
  expect((await txt('#ch-turn')).includes('Iyer Family'), 'stage shows team 2');

  // 4) Antakshari: the letter changes on "Random letter"
  await page.click('#tab-ak');
  const l1 = await txt('#ak-letter');
  expect(l1.length > 0, 'a starting letter is shown');
  await page.click('#ak-next');
  const l2 = await txt('#ak-letter');
  expect(l2 && l2 !== l1, 'letter changes on "Random letter": ' + l1 + ' -> ' + l2);
  await page.click('#ak-next');
  expect(await txt('#ak-letter') !== l2, 'letter changes again');
  await page.click('#ak-point');                                   // team 2 sang a song
  s = await st();
  expect(s.scores[1] === 1 && s.turn === 0, 'Antakshari point goes to team 2 and the turn passes back, got ' + JSON.stringify(s));
  const grid = await page.$$('#ak-grid button');
  await grid[2].click();                                           // host taps the last letter of that song
  expect(await txt('#ak-letter') === (await grid[2].textContent()).trim(), 'tapping a letter in the list sets it');

  // 5) icebreakers
  await page.click('#tab-ice');
  await page.click('#ice-next');
  const q = await txt('#ice-text');
  expect(q.length > 10 && q !== t('ice_start'), 'an icebreaker question is shown');

  // 6) everything survives a reload
  await page.reload();
  await page.waitForTimeout(800);
  expect(await txt('#score-0') === '4' && await txt('#score-1') === '1', 'scores are saved, got ' + await txt('#score-0') + '/' + await txt('#score-1'));
  expect((await page.$$eval('#scores .nm', (els) => els.map((e) => e.textContent.trim()))).includes('Iyer Family'), 'team names are saved');
};
