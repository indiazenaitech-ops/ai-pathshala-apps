/* Interaction test for Snakes & Ladders (run by tools/verify.js in en and hi).
   The dice is made deterministic with window.__gameTest.setRolls([...]); every roll goes through the real UI
   (#rollBtn) and the real engine. Checks: ladder bottom -> top, snake head -> tail, the exact-100 rule blocks an
   overshoot, save & resume after a reload, reaching 100 ends the game with the right winner, play again. */
module.exports = async function ({ page, expect, t }) {
  await page.emulateMedia({ reducedMotion: 'reduce' });        // instant dice + token moves
  const S = () => page.evaluate(() => window.__gameTest.state());
  const idle = () => page.waitForFunction(() => !window.__gameTest.state().busy && !document.querySelector('#rollBtn').disabled || window.__gameTest.state().status !== 'playing', null, { timeout: 15000 });
  async function roll(n) {
    await page.evaluate((v) => window.__gameTest.setRolls([v]), n);
    await page.click('#rollBtn');
    await page.waitForFunction(() => !window.__gameTest.state().busy, null, { timeout: 15000 });
    await idle();
  }

  // set up: two people (player 2 is the computer by default), Classic board, default rules
  let s = await S();
  expect(s.players.length === 2 && s.board === 'classic', 'default game: 2 players on the classic board');
  expect(s.rules.exact === true && s.rules.threeSixes === false && s.rules.startSix === false, 'default rules: exact on, three-sixes off, start-on-6 off');
  await page.click('#prow1 .ptype[data-type="human"]');
  await page.click('#startBtn');
  await idle();
  s = await S();
  expect(s.players[1].type === 'human' && s.pos.every((p) => p === 0) && s.turn === 0, 'new game with two people, both at the start');

  const L = s.layout, jump = {};
  L.ladders.forEach(([a, b]) => { jump[a] = b; });
  L.snakes.forEach(([a, b]) => { jump[a] = b; });
  const next = (p, r) => (p + r > 100 ? p : (jump[p + r] || p + r));
  // player 2 always takes a harmless roll (1-5, plain square)
  const safe = (p) => { for (let r = 1; r <= 5; r++) if (!jump[p + r] && p + r < 95) return r; return 1; };
  async function p2() { const st = await S(); await roll(safe(st.pos[1])); }

  // 1) ladder: player 1 rolls onto the foot of the first ladder
  const lad = L.ladders.find(([a]) => a <= 5);
  expect(!!lad, 'classic board has a ladder reachable with the first roll');
  await roll(lad[0]);
  s = await S();
  expect(s.pos[0] === lad[1], `ladder ${lad[0]}→${lad[1]}: token should be on ${lad[1]}, got ${s.pos[0]}`);
  expect(s.turn === 1, 'after a non-6 roll the turn passes to player 2');
  expect(await page.$('#history li.up') !== null, 'move history shows the ladder');
  const msg1 = await page.textContent('#msg');
  expect(msg1.includes(String(lad[1])), 'the message mentions the ladder top, got: ' + msg1);
  await p2();

  // 2) snake: walk player 1 until a snake head is 1-5 squares ahead, then land on it
  for (let guard = 0; guard < 20; guard++) {
    s = await S();
    const p = s.pos[0];
    const head = L.snakes.find(([h]) => h - p >= 1 && h - p <= 5);
    if (head) {
      await roll(head[0] - p);
      s = await S();
      expect(s.pos[0] === head[1], `snake ${head[0]}→${head[1]}: token should be on ${head[1]}, got ${s.pos[0]}`);
      expect(await page.$('#history li.down') !== null, 'move history shows the snake');
      break;
    }
    let r = 1; for (let k = 1; k <= 5; k++) if (!jump[p + k] || jump[p + k] > p + k) { r = k; break; }
    await roll(r);
    await p2();
    if (guard === 19) expect(false, 'could not reach a snake');
  }
  await p2();

  // 3) plan the shortest route (rolls 1-5, no extra turns) for player 1 to a square from 96 to 99
  s = await S();
  const start = s.pos[0];
  const prev = { [start]: null }, queue = [start];
  let goal = null;
  while (queue.length && goal === null) {
    const p = queue.shift();
    for (let r = 1; r <= 5; r++) {
      const q = next(p, r);
      if (q in prev || q === 100) continue;
      prev[q] = [p, r];
      if (q >= 96 && q <= 99) { goal = q; break; }
      queue.push(q);
    }
  }
  expect(goal !== null, 'a route to the last row exists');
  const plan = [];
  for (let q = goal; prev[q]; q = prev[q][0]) plan.unshift(prev[q][1]);
  for (const r of plan) {
    s = await S();
    if (s.turn !== 0) await p2();
    await roll(r);
  }
  s = await S();
  expect(s.pos[0] === goal, `player 1 should be on ${goal}, got ${s.pos[0]}`);
  await p2();

  // 4) the exact-100 rule blocks an overshoot
  const need = 100 - goal, over = need + 1;
  await roll(over);
  s = await S();
  expect(s.pos[0] === goal && s.status === 'playing', `rolling ${over} from ${goal} must not move the token (exact rule), got ${s.pos[0]}`);
  const msg2 = await page.textContent('#msg');
  expect(msg2.includes(String(need)), 'the message says how many are needed, got: ' + msg2);
  expect(s.turn === 1, 'turn passes after a blocked overshoot');
  await p2();

  // 5) save & resume: reload keeps the game
  const before = await S();
  await page.reload({ waitUntil: 'load' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => window.__gameTest && window.EDU_READY);
  const after = await S();
  expect(JSON.stringify(after.pos) === JSON.stringify(before.pos) && after.turn === before.turn, 'reload resumes the same game: ' + JSON.stringify(after.pos));

  // 6) reaching 100 ends the game with the right winner
  await roll(need);
  s = await S();
  expect(s.status === 'won' && s.winner === 0 && s.pos[0] === 100, 'player 1 should win on 100, got ' + JSON.stringify(s));
  expect(await page.isVisible('#winBox'), 'winner screen is shown');
  const title = await page.textContent('#winTitle');
  expect(title.includes(t('name_1')), 'winner screen names player 1, got: ' + title);
  expect(await page.isDisabled('#rollBtn'), 'no more rolls after the game is over');

  // 7) play again: fresh game, same players
  await page.click('#againBtn');
  s = await S();
  expect(s.status === 'playing' && s.pos.every((p) => p === 0) && s.players[1].type === 'human', 'play again starts a fresh game');
  expect(await page.isHidden('#winBox'), 'winner screen closes');

  // 8) Moksha Patam: landing on a ladder shows its virtue line
  await page.click('#boardOpts [data-board="moksha"]');
  await page.click('#startBtn');
  s = await S();
  expect(s.board === 'moksha' && await page.isVisible('#legend'), 'Moksha Patam board with its values list');
  const ml = s.layout.ladders.find(([a]) => a <= 6);
  await roll(ml[0]);
  const virtue = await page.evaluate((L) => window.APP_CONTENT[L].virtues[0].line, await page.evaluate(() => EDU.lang));
  const msg3 = await page.textContent('#msg');
  expect(msg3.includes(virtue), 'virtue line shown on a Moksha ladder, got: ' + msg3);

  // 9) random board follows the rules
  await page.click('#boardOpts [data-board="random"]');
  await page.click('#startBtn');
  const ok = await page.evaluate(() => { const st = window.__gameTest.state(); return st.board === 'random' && SL.check(st.layout).length === 0 && st.layout.ladders.length === st.layout.snakes.length; });
  expect(ok, 'random board passes the board rules with balanced counts');
};
