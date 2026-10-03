/* Interaction test for Projectile Motion Lab (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t, log }) {
  const near = (a, b, tol) => Math.abs(a - b) <= (tol || 0.01);
  const val = async (sel) => Number(await page.getAttribute(sel, 'data-v'));
  const landed = async () => Number((await page.getAttribute('#cv', 'data-landed')) || 0);
  const launchAndWait = async (btn) => {
    const before = await landed();
    await page.click(btn || '#launch');
    await page.waitForFunction((n) => Number(document.getElementById('cv').dataset.landed || 0) > n, before, { timeout: 20000 });
    await page.waitForTimeout(50);
  };
  const trailRs = () => page.$$eval('#trails li', (lis) => lis.map((li) => Number(li.dataset.r)));

  await page.waitForSelector('#res-R-sim');

  // 1) sample launch on first visit: u = 20 m/s, 45°, from the ground, Earth (g = 9.8)
  expect(near(await val('#res-R-sim'), 400 / 9.8), 'default range should be u²/g = 40.82 m');
  expect(near(await val('#res-T-f'), 2 * 20 * Math.SQRT1_2 / 9.8), 'T = 2u sinθ / g = 2.89 s');
  expect(near(await val('#res-H-f'), 400 * 0.5 / 19.6), 'H = u² sin²θ / 2g = 10.20 m');

  // 2) from a 20 m tower at 30°: T = [10 + √(100 + 392)] / 9.8
  await page.fill('#height-num', '20');
  await page.fill('#angle-num', '30');
  await launchAndWait();
  const T2 = (10 + Math.sqrt(100 + 2 * 9.8 * 20)) / 9.8;
  expect(near(await val('#res-T-sim'), T2) && near(await val('#res-T-f'), T2), 'time of flight from height = 3.28 s (simulation and formula)');
  expect(near(await val('#res-R-sim'), 20 * Math.cos(Math.PI / 6) * T2, 0.02), 'range from height = u cosθ × T = 56.88 m');
  expect(near(await val('#res-H-sim'), 20 + 100 / 19.6), 'max height from ground = h + (u sinθ)²/2g');
  expect((await page.$$('#trails li')).length === 2, 'two trails kept for comparison');
  const work = await page.textContent('#work');
  expect(work.includes('√') && work.includes('20 × sin 30°'), 'working shows the formula with substituted numbers');

  // 3) air resistance makes the range shorter than the no-air formula
  await page.check('#air');
  await launchAndWait();
  const rAir = await val('#res-R-sim'), rF = await val('#res-R-f');
  log('with air', rAir, 'formula', rF);
  expect(rAir < rF - 5 && rAir > rF * 0.5, 'air resistance shortens the range: ' + rAir + ' vs ' + rF);
  expect((await page.getAttribute('#res-note', 'class')).includes('warning'), 'drag note shown');

  // 4) Moon: no air allowed, range u²/g = 400/1.6 = 250 m at 45° from the ground
  await page.fill('#height-num', '0');
  await page.fill('#angle-num', '45');
  await page.click('#g-moon');
  expect(await page.isDisabled('#air'), 'air resistance is switched off on the Moon');
  await launchAndWait();
  expect(near(await val('#res-R-sim'), 250, 0.05), 'range on the Moon = 250 m, got ' + (await val('#res-R-sim')));

  // 5) complementary angles 30° and 60° land at the same spot (Earth)
  await page.click('#g-earth');
  await page.fill('#angle-num', '30');
  await launchAndWait('#demo-comp');
  const rs = await trailRs();
  expect(rs.length === 2 && near(rs[0], rs[1], 0.01) && near(rs[0], 400 * Math.sin(Math.PI / 3) / 9.8, 0.02), '30° and 60° give equal ranges: ' + rs);

  // 6) best angle from a 20 m height is below 45° (tan θ = u / √(u² + 2gh) → 35.4°)
  await page.fill('#height-num', '20');
  await page.click('#find-best');
  const best = Number(await page.getAttribute('#best-out', 'data-a'));
  expect(Math.abs(best - 35.4) <= 0.15, 'best angle from 20 m = 35.4°, got ' + best);

  // 7) target game: one miss, then a calculated hit (R = u²/g at 45° on level ground)
  await page.click('#mode-game');
  await page.waitForSelector('#game-panel:not([hidden])');
  const x = Number(await page.getAttribute('#target-info', 'data-x'));
  const g = Number(await page.getAttribute('#target-info', 'data-g'));
  const h = Number(await page.getAttribute('#target-info', 'data-h'));
  expect(h === 0 && g === 9.8 && x >= 15 && x <= 60, 'easy target on level Earth ground: ' + [x, g, h]);
  expect(await page.inputValue('#height-num') === '0', 'height control shows the fixed game height');
  await page.fill('#angle-num', '45');
  await page.fill('#speed-num', (Math.sqrt(x * g) * 0.8).toFixed(1));
  await launchAndWait();
  expect(await page.getAttribute('#game-msg', 'data-state') === 'short', 'slow throw falls short');
  expect(await page.getAttribute('#g-attempts', 'data-n') === '1', 'one attempt counted');
  await page.fill('#speed-num', Math.sqrt(x * g).toFixed(1));
  await launchAndWait();
  expect(await page.getAttribute('#game-msg', 'data-state') === 'hit', 'calculated speed hits the stumps');
  expect(await page.getAttribute('#g-attempts', 'data-n') === '2', 'hit on the second attempt');
  expect((await page.textContent('#g-hits')).includes('1'), 'one target hit');

  // 8) state survives a reload
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#res-R-sim');
  expect(await page.getAttribute('#mode-game', 'aria-pressed') === 'true', 'game mode remembered');
  expect((await page.$$('#trails li')).length === 2, 'game trails remembered');
  await page.click('#mode-explore');
  expect((await page.$$('#trails li')).length === 2, 'explore trails remembered (30° and 60°)');
};
