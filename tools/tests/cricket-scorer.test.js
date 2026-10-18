/* Interaction test for Cricket Scorer (run by tools/verify.js in en and hi).
   Plays two 1-over innings through the real UI: 4, wd, 1, W, 6, nb+2, 0, 1  and the chase 4, wd, 1, W, 6, nb+2, 2. */
module.exports = async function ({ page, expect, t }) {
  const wait = () => page.waitForTimeout(80);
  const txt = async (sel) => (await page.textContent(sel)).trim();
  const board = async () => page.$eval('#board', b => ({ score: b.dataset.score, overs: b.dataset.overs, striker: b.dataset.striker }));

  // setup: 1 over each, default names, team 1 bats first
  await page.fill('#suOvers', '1');
  await page.click('#decBat');
  await page.click('#btnStart');
  await wait();
  expect(await page.isVisible('#liveView'), 'live view shown after Start match');
  expect(await page.isVisible('#btnPlay'), 'asks for the openers and bowler');
  await page.click('#btnPlay'); await wait();          // openers Player 1 + 2, bowler Player 6

  const run = async (r) => { await page.click('#run' + r); await wait(); };
  const extra = async (id, r) => { await page.click(id); await run(r); };
  const bowled = async () => { await page.click('#btnWkt'); await page.click('#wk-bowled'); await page.click('#wkOk'); await wait(); };

  await run(4);
  await extra('#xWd', 0);
  let b = await board();
  expect(b.score === '5/0' && b.overs === '0.1', 'after 4 + wide: 5/0 in 0.1, got ' + JSON.stringify(b));
  await run(1);
  b = await board();
  expect(b.striker === '1', 'single rotates the strike to Player 2, striker=' + b.striker);
  await bowled();
  expect(await page.isVisible('#pick-bat-2'), 'asks for the next batter');
  await page.click('#pick-bat-2'); await wait();
  b = await board();
  expect(b.striker === '2', 'new batter (Player 3) takes strike after bowled');
  await run(6);
  await extra('#xNb', 2);
  expect(await page.isVisible('#bFh'), 'free hit shown after a no-ball');
  await run(0);
  b = await board();
  expect(b.score === '15/1' && b.overs === '0.5', 'before the last ball: 15/1 in 0.5, got ' + JSON.stringify(b));
  await run(1);

  // innings over: the scorecard has the first innings, the board asks for the second innings openers
  const inn1 = await page.$eval('#scBody .sc-inn[data-inn="0"]', e => e.textContent.replace(/\s+/g, ' '));
  expect(inn1.includes('16/1 (1)'), 'first innings 16/1 (1 over) in the scorecard: ' + inn1.slice(0, 120));
  expect(inn1.includes('wd 1, nb 1, b 0, lb 0'), 'extras breakdown wd 1, nb 1');
  expect(await page.isVisible('#btnPlay'), 'second innings asks for openers');
  expect((await txt('#prompt')).includes('17'), 'second innings prompt shows the target 17');

  // second innings: chase 17 off 6 balls
  await page.click('#btnPlay'); await wait();
  await run(4);
  await extra('#xWd', 0);
  await run(1);
  await bowled();
  await page.click('#pick-bat-2'); await wait();
  await run(6);
  b = await board();
  expect((await txt('#bNeed')) === t('need_balls', { team: t('def_team2'), r: '5', b: '2' }), 'need 5 runs from 2 balls, got ' + (await txt('#bNeed')));
  await extra('#xNb', 2);
  expect((await txt('#sRrr')).length > 0, 'required rate shown');
  await run(2);

  const want = t('res_wkts', { team: t('def_team2'), n: '4' }) + ' ' + t('res_ball1');
  const res = await txt('#bResult');
  expect(res === want, 'result text "' + want + '", got "' + res + '"');
  b = await board();
  expect(b.score === '17/1' && b.overs === '0.5', 'chase finished at 17/1 in 0.5, got ' + JSON.stringify(b));
  expect((await txt('#scResult')) === want, 'scorecard shows the result');
  expect((await page.$$('#histList .hi-item')).length === 1, 'finished match saved in history');
  const wa = await page.getAttribute('#btnWa', 'href');
  expect(decodeURIComponent(wa).includes('16/1') && decodeURIComponent(wa).includes('17/1'), 'WhatsApp summary has both scores');
  expect((await page.$$('#chart svg path.s1')).length === 1 && (await page.$$('#chart svg path.s2')).length === 1, 'over chart has one bar per innings');

  // undo the winning ball: match open again, history entry removed
  await page.click('#btnUndo'); await wait();
  b = await board();
  expect(b.score === '15/1' && (await txt('#bResult')) === '', 'undo removes the winning runs');
  expect((await page.$$('#histList .hi-item')).length === 0, 'undone result leaves history');
  // persistence: reload keeps the live match
  await page.reload(); await page.waitForTimeout(600);
  b = await board();
  expect(b.score === '15/1' && b.overs === '0.4', 'match restored after reload, got ' + JSON.stringify(b));
  await run(2);
  expect((await txt('#bResult')) === want, 'winning again after reload');
};
