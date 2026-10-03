/* Interaction test for Line of Best Fit (linear-regression-lab), run by tools/verify.js in en and hi. */
module.exports = async function ({ page, expect, log }) {
  const num = async (sel, attr) => Number(await page.getAttribute(sel, attr || 'data-value'));
  const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

  /* the default dataset: study hours vs marks (16 students) */
  const pts = [[1, 30], [2, 38], [3, 35], [4, 45], [5, 48], [6, 55], [7, 50], [8, 60], [9, 66], [10, 61], [11, 70], [12, 74], [13, 69], [14, 80], [16, 82], [18, 91]];
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, sxy = 0;
  pts.forEach(p => { sxx += (p[0] - mx) ** 2; sxy += (p[0] - mx) * (p[1] - my); });
  const M = sxy / sxx, Cc = my - M * mx;
  const MSE = pts.reduce((s, p) => s + (p[1] - (M * p[0] + Cc)) ** 2, 0) / n;

  await page.waitForSelector('#plot');
  expect(await num('#pt-count') === 16, 'study dataset should start with 16 dots');
  expect(await page.getAttribute('#ds-study', 'aria-pressed') === 'true', 'study dataset selected by default');
  const loss0 = await num('#mse');
  expect(loss0 > MSE * 2, `flat starting line should have a big loss (got ${loss0}, best ${MSE})`);

  /* manual slider changes the line and the loss */
  await page.$eval('#m-range', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, String(M));
  await page.waitForTimeout(100);
  const mAfter = await num('#equation', 'data-m');
  expect(near(mAfter, M, 0.02), `slope slider should set m ≈ ${M}, got ${mAfter}`);
  await page.fill('#c-num', String(Math.round(Cc)));
  await page.waitForTimeout(100);
  const cAfter = await num('#equation', 'data-c');
  expect(near(cAfter, Math.round(Cc), 1e-9), `intercept box should set c = ${Math.round(Cc)}, got ${cAfter}`);
  const loss1 = await num('#mse');
  expect(loss1 < loss0 && loss1 < MSE * 1.2, `a hand-fitted line close to the best should have a small loss (${loss1}, start ${loss0}, best ${MSE})`);

  /* exact least-squares fit */
  await page.click('#tab-auto');
  await page.click('#fit-exact');
  await page.waitForTimeout(900);
  const m = await num('#equation', 'data-m'), c = await num('#equation', 'data-c');
  expect(near(m, M, 1e-6) && near(c, Cc, 1e-6), `least squares should give m=${M.toFixed(4)}, c=${Cc.toFixed(4)}; got m=${m}, c=${c}`);
  expect(near(await num('#mse'), MSE, 1e-6), 'MSE should equal the least-squares minimum');
  expect(await num('#close') === 100, 'closeness should be 100% for the best line');

  /* gradient descent: restart from a flat line, take steps, loss must fall */
  await page.click('#gd-restart');
  await page.waitForTimeout(100);
  const g0 = await num('#gd-loss');
  for (let i = 0; i < 5; i++) await page.click('#gd-step');
  await page.waitForTimeout(100);
  expect(await num('#epoch') === 5, 'five steps = five epochs');
  const g5 = await num('#gd-loss');
  expect(g5 < g0, `gradient descent should lower the loss (${g5} < ${g0})`);
  /* run to convergence with the default (good) learning rate */
  await page.selectOption('#epochs', '1000');
  await page.click('#speed button[data-speed="fast"]');
  await page.click('#gd-run');
  await page.waitForFunction(() => document.getElementById('gd-run').getAttribute('aria-pressed') === 'false', null, { timeout: 30000 });
  const gEnd = await num('#gd-loss');
  expect(gEnd <= MSE * 1.02, `after running, GD loss ${gEnd} should be within 2% of best ${MSE}`);
  expect(await page.getAttribute('#coach-auto', 'data-code') === 'done', 'coach should say learning is done');

  /* too-big learning rate explodes */
  await page.click('#exp-big');
  await page.waitForFunction(() => ['explode', 'up'].includes(document.getElementById('coach-auto').getAttribute('data-code')) && document.getElementById('gd-run').getAttribute('aria-pressed') === 'false', null, { timeout: 30000 });
  log('big learning rate ->', await page.getAttribute('#coach-auto', 'data-code'));

  /* predict */
  await page.click('#fit-exact');
  await page.waitForTimeout(900);
  await page.click('#tab-predict');
  await page.fill('#pred-x', '15');
  await page.waitForTimeout(100);
  const y15 = await num('#pred-y');
  expect(near(y15, M * 15 + Cc, 1e-6), `prediction at x=15 should be ${M * 15 + Cc}, got ${y15}`);
  await page.fill('#pred-x', '40');
  await page.waitForTimeout(100);
  expect(await page.isVisible('#pred-warn'), 'predicting far outside the data shows a warning');

  /* draw your own: tap to add dots, the line can be fitted */
  await page.click('#tab-manual');
  await page.click('#ds-own');
  await page.waitForTimeout(150);
  expect(await num('#pt-count') === 0, 'own dataset starts empty');
  const box = await page.locator('#plot').boundingBox();
  const taps = [[0.2, 0.8], [0.4, 0.7], [0.65, 0.3], [0.85, 0.18]];
  for (const [fx, fy] of taps) { await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy); await page.waitForTimeout(80); }
  expect(await num('#pt-count') === 4, 'four taps should add four dots, got ' + await num('#pt-count'));
  await page.click('#tab-auto');
  await page.click('#fit-exact');
  await page.waitForTimeout(900);
  const mOwn = await num('#equation', 'data-m');
  expect(mOwn > 0, 'dots going up-right should give a positive slope, got ' + mOwn);
  const rows = await page.$$eval('#t-body tr[data-i]', r => r.length);
  expect(rows === 4, 'data table should list the 4 dots');

  /* back to the study data for the screenshot */
  await page.click('#ds-study');
  await page.click('#show-sq');
  await page.waitForTimeout(200);
};
