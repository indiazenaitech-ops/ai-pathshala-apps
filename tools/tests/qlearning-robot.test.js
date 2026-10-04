/* Interaction test for "Robot Learns by Reward" (Q-learning). Run by tools/verify.js in en and hi. */
module.exports = async function ({ page, expect, log }) {
  const dbg = () => page.evaluate(() => window.QL_DEBUG());
  const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-6);

  // 1) default world: Simple preset, nothing learned yet
  let s = await dbg();
  expect(s.preset === 'simple' && s.episodes === 0, 'starts on the Simple world with 0 episodes, got ' + s.preset + '/' + s.episodes);
  expect(s.Q.every(q => q === 0), 'all Q-values start at 0');
  expect(s.best === 12, 'shortest path in Simple world is 12 moves, got ' + s.best);
  expect((await page.textContent('#st-ep')).trim() === '0', 'episode counter shows 0');

  // 2) one learning step follows the Q-learning rule exactly
  await page.click('#btn-step');
  s = await dbg();
  const u = s.lastUpd;
  expect(u && u.s === s.start, 'first step starts from the robot start cell');
  const expected = u.old + s.alpha * (u.r + s.gamma * u.future - u.old);
  expect(near(u.newQ, expected), 'new Q = old + α(r + γ·maxQ′ − old): ' + u.newQ + ' vs ' + expected);
  expect(near(s.Q[u.s * 4 + u.a], u.newQ), 'Q-table entry was updated');
  expect(u.r === -0.1 && near(u.newQ, -0.05), 'first step: reward −0.1 → Q = −0.05 (α = 0.5), got ' + u.newQ);
  expect((await page.textContent('#upd-formula')).length > 10, 'the update formula with numbers is shown');
  const nonzero = s.Q.filter(q => q !== 0).length;
  expect(nonzero === 1, 'exactly one Q-value changed after one step, got ' + nonzero);

  // 2b) animated episode: Stop keeps the unfinished episode, 1 step continues it, Fast speed finishes it
  await page.click('#speed button[data-speed="slow"]');
  await page.click('#btn-episode');
  await page.waitForTimeout(700);
  expect((await dbg()).busy === 'episode', 'the 1 episode button starts an animated episode');
  await page.click('#btn-episode');                       // same button = Stop
  s = await dbg();
  expect(s.busy === null && s.run.active && s.run.steps >= 2, 'Stop pauses the episode without ending it, steps = ' + s.run.steps);
  const stepsBefore = s.run.steps;
  await page.click('#btn-step');
  s = await dbg();
  expect(s.run.active ? s.run.steps === stepsBefore + 1 : s.episodes === 1, '1 step continues the same episode');
  await page.click('#speed button[data-speed="fast"]');
  if ((await dbg()).episodes === 0) {
    await page.click('#btn-episode');
    await page.waitForFunction(() => window.QL_DEBUG().busy === null, null, { timeout: 30000 });
  }
  s = await dbg();
  expect(s.episodes === 1 && s.hist.length === 1 && !s.run.active, 'the animated episode is counted once it ends, got ' + s.episodes);
  expect(['good', 'bad'].includes(await page.getAttribute('#msg', 'data-code')), 'end-of-episode message shown');

  // 3) train 1000 episodes fast: counter, history and learning improve
  await page.click('#btn-fast1000');
  s = await dbg();
  expect(s.episodes === 1001 && s.hist.length === 1001, '1000 more episodes recorded, got ' + s.episodes);
  expect((await page.textContent('#st-ep')).replace(/[^0-9]/g, '') === '1001', 'episode counter shows 1001');
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const first = mean(s.hist.slice(0, 100)), last = mean(s.hist.slice(-100));
  expect(last > first, 'average reward improves: first 100 = ' + first.toFixed(2) + ', last 100 = ' + last.toFixed(2));
  const wins = s.outc.slice(-100).split('').filter(c => c === 'g').length;
  expect(wins >= 80, 'robot finds the treasure in at least 80 of the last 100 episodes, got ' + wins);
  expect(s.epsNow < 0.3 && s.epsNow >= 0.01, 'exploration ε decayed, got ' + s.epsNow);
  log('last-100 average reward', last.toFixed(2), 'wins', wins);

  // 4) play the learned policy: greedy path reaches the treasure (fast speed)
  await page.click('#speed button[data-speed="fast"]');
  await page.click('#btn-play');
  await page.waitForFunction(() => window.QL_DEBUG().lastPlay !== null && window.QL_DEBUG().busy === null, null, { timeout: 30000 });
  s = await dbg();
  expect(s.lastPlay.outcome === 'goal', 'learned policy reaches the treasure, got ' + s.lastPlay.outcome);
  expect(s.lastPlay.steps <= s.best + 2, 'learned path is (nearly) shortest: ' + s.lastPlay.steps + ' vs ' + s.best);
  expect(await page.getAttribute('#msg', 'data-code') === 'good', 'success message shown after playing');

  // 5) tap a cell with the Change tool: empty → wall → pit
  await page.$eval('#board', e => e.scrollIntoView({ block: 'center' }));
  const box = await page.$eval('#board', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; });
  const cell = (r, c) => ({ x: box.x + (c + 0.5) * box.w / 7, y: box.y + (r + 0.5) * box.w / 7 });
  let p = cell(5, 3);                          // row 6, column 4 is empty in the Simple world
  expect(s.grid[5 * 7 + 3] === '.', 'test cell is empty before tapping');
  await page.mouse.click(p.x, p.y);
  s = await dbg();
  expect(s.grid[5 * 7 + 3] === '#' && s.preset === 'custom', 'one tap turns the cell into a wall');
  expect(s.episodes === 1001, 'editing the world keeps what was learned');
  await page.mouse.click(p.x, p.y);
  s = await dbg();
  expect(s.grid[5 * 7 + 3] === 'P', 'second tap turns it into a pit');

  // 6) Look inside tool shows 4 Q-values of a cell
  await page.click('#tool-look');
  p = cell(6, 1);
  await page.mouse.click(p.x, p.y);
  s = await dbg();
  expect(s.look === 43, 'look tool selects the tapped cell, got ' + s.look);
  const boxes = await page.$$eval('#compass .qbox:not(.empty)', b => b.length);
  expect(boxes === 4, 'brain panel shows 4 Q-values, got ' + boxes);
  // the 4 Q-values are also written right under the board (the brain panel is far below on phones)
  const fmtQ = (cellIdx) => page.evaluate(i => { const Q = window.QL_DEBUG().Q; return [0, 1, 2, 3].map(a => EDU.fmt((Math.round(Q[i * 4 + a] * 100) / 100) || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }, cellIdx);
  let msg = await page.textContent('#msg');
  expect(await page.getAttribute('#msg', 'data-code') === 'look', 'look tool writes a look message');
  expect((await fmtQ(43)).every(v => msg.includes(v)) && ['↑', '→', '↓', '←'].every(a => msg.includes(a)), 'look message lists the 4 Q-values of the cell: ' + msg);
  await page.focus('#board');
  await page.keyboard.press('ArrowRight');
  s = await dbg();
  msg = await page.textContent('#msg');
  expect(s.look === 44 && (await fmtQ(44)).every(v => msg.includes(v)), 'arrow keys move the look cursor and update the values, look = ' + s.look);

  // 7) preset Cliff edge resets learning; reset button clears Q
  await page.click('#preset-cliff');
  s = await dbg();
  expect(s.preset === 'cliff' && s.episodes === 0 && s.grid.slice(42) === '.PPPPPG', 'cliff world loaded with a fresh start');
  await page.click('#btn-fast100');
  s = await dbg();
  expect(s.episodes === 100 && s.Q.some(q => q !== 0), '100 episodes trained on the cliff');
  expect(s.epsNow < 0.2, 'ε decays during training (×0.99 per episode), got ' + s.epsNow);
  await page.uncheck('#chk-decay');
  s = await dbg();
  expect(near(s.epsNow, s.eps) && (await page.textContent('#st-eps')).includes('0.30'), 'turning decay off puts exploring back to the slider value, got ' + s.epsNow);
  await page.check('#chk-decay');
  await page.click('#btn-reset');
  s = await dbg();
  expect(s.episodes === 0 && s.Q.every(q => q === 0), 'reset learning clears the Q-table');

  // 8) sliders change the settings
  await page.$eval('#sl-alpha', e => { e.value = '0.2'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  s = await dbg();
  expect(near(s.alpha, 0.2), 'α slider sets learning rate to 0.2');

  // 9) by-hand exercise: type the right answer
  const ans = s.calc.ans;
  await page.fill('#calc-input', ans.toFixed(2));
  await page.click('#calc-check');
  expect(await page.$('#calc-fb .ok') !== null, 'correct hand calculation is accepted');
  await page.fill('#calc-input', String(ans + 5));
  await page.click('#calc-check');
  expect(await page.$('#calc-fb .bad') !== null, 'wrong hand calculation is flagged');
  // a negative answer typed with the Unicode minus sign (phone keyboards) is accepted
  for (let k = 0; k < 400 && (await dbg()).calc.ans > -0.05; k++) await page.click('#calc-new');
  const neg = (await dbg()).calc.ans;
  expect(neg < 0, 'found a hand calculation with a negative answer, got ' + neg);
  await page.fill('#calc-input', '−' + Math.abs(neg).toFixed(2));
  await page.click('#calc-check');
  expect(await page.$('#calc-fb .ok') !== null, 'negative answer with − is accepted');
  expect(await page.getAttribute('#calc-input', 'inputmode') !== 'decimal', 'answer box keeps a keyboard that has a minus key');

  // 10) quiz: answer first question correctly
  await page.click('#quiz-list button[data-q="0"][data-a="0"]');
  expect(await page.$('#quiz-list .opt.right') !== null, 'quiz marks the right answer');
  expect(/^1\D+6$/.test((await page.textContent('#quiz-score')).trim()), 'quiz score shows 1 / 6');

  // 11) everything survives a reload, even straight after training (the save is debounced)
  await page.click('#preset-simple');
  await page.click('#btn-fast100');
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.QL_DEBUG === 'function');
  s = await dbg();
  expect(s.episodes === 100 && s.hist.length === 100 && s.Q.some(q => q !== 0), 'training is kept after an immediate reload, episodes = ' + s.episodes);
  expect(near(s.alpha, 0.2) && s.tool === 'look' && s.preset === 'simple', 'settings, tool and world are kept after reload');
  expect((await page.textContent('#st-ep')).replace(/[^0-9]/g, '') === '100', 'counter shows 100 after reload');
};
