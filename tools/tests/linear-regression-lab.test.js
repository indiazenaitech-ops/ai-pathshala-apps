/* Interaction test for Line of Best Fit (linear-regression-lab), run by tools/verify.js in en and hi. */
module.exports = async function ({ page, expect, log }) {
  const num = async (sel, attr) => Number(await page.getAttribute(sel, attr || 'data-value'));
  const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  const idle = () => page.waitForFunction(() => document.getElementById('gd-run').getAttribute('aria-pressed') === 'false', null, { timeout: 30000 });
  /* pixel position of data (x, y) on the plot, using the app's own plot geometry */
  const plotXY = async (x, y, ax) => {
    const box = await page.locator('#plot').boundingBox();
    const fs = Math.min(19, Math.max(12, Math.round(box.width / 50)));
    const l = Math.round(fs * 4.3), r = box.width - Math.round(fs * 1.1), t = Math.round(fs * 1.1), b = box.height - Math.round(fs * 3.5);
    return [box.x + l + (x - ax[0]) / (ax[1] - ax[0]) * (r - l), box.y + b - (y - ax[2]) / (ax[3] - ax[2]) * (b - t)];
  };

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
  expect(await page.isVisible('#restore') && await page.isDisabled('#restore'), 'restore button stays in the toolbar (disabled) while the data is unchanged');

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

  /* drag the line itself (at x = 15, where there is no dot) down by 10 marks */
  const c1 = await num('#equation', 'data-c'), m1 = await num('#equation', 'data-m');
  const [lx, ly] = await plotXY(15, m1 * 15 + c1, [0, 20, 0, 100]);
  const [, ly2] = await plotXY(15, m1 * 15 + c1 - 10, [0, 20, 0, 100]);
  await page.mouse.move(lx, ly); await page.mouse.down(); await page.mouse.move(lx, ly2, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(100);
  const c2 = await num('#equation', 'data-c');
  expect(Math.abs(c2 - (c1 - 10)) < 1.5 && await num('#pt-count') === 16, `dragging the line should move c from ${c1} to ≈ ${c1 - 10}, got ${c2}`);

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
  await idle();
  const gEnd = await num('#gd-loss');
  expect(gEnd <= MSE * 1.02, `after running, GD loss ${gEnd} should be within 2% of best ${MSE}`);
  expect(await page.getAttribute('#coach-auto', 'data-code') === 'done', 'coach should say learning is done');

  /* too-big learning rate explodes; picking a rate by hand hides the experiment's fixed-rate message */
  await page.click('#exp-big');
  await page.waitForFunction(() => ['explode', 'up'].includes(document.getElementById('coach-auto').getAttribute('data-code')) && document.getElementById('gd-run').getAttribute('aria-pressed') === 'false', null, { timeout: 30000 });
  log('big learning rate ->', await page.getAttribute('#coach-auto', 'data-code'));
  expect(await page.isVisible('#exp-msg'), 'experiment message shown');
  await page.$eval('#lr', el => { el.value = 3; el.dispatchEvent(new Event('input', { bubbles: true })); });
  expect(await page.isHidden('#exp-msg'), 'changing the learning rate by hand hides the "rate 1.5" experiment message');

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
  /* hours cannot be negative: x is kept at 0 */
  await page.fill('#pred-x', '-5');
  await page.waitForTimeout(100);
  expect(near(await num('#pred-y'), Cc, 1e-6), 'a negative number of hours is treated as 0 hours');
  /* tapping the graph while the x box still has focus must update the x box too */
  await page.fill('#pred-x', '15');
  const [tx, ty] = await plotXY(8, 50, [0, 20, 0, 100]);
  await page.mouse.click(tx, ty);
  await page.waitForTimeout(100);
  const xBox = Number(await page.inputValue('#pred-x'));
  expect(Math.abs(xBox - 8) <= 0.5, `tapping the graph at x≈8 should put 8 in the x box (got ${xBox})`);
  expect(near(await num('#pred-y'), M * xBox + Cc, 1e-6), 'prediction follows the tapped x');

  /* draw your own: tap to add dots (also on the line), double-click removes, the line can be fitted */
  await page.click('#tab-manual');
  await page.click('#ds-own');
  await page.waitForTimeout(150);
  expect(await num('#pt-count') === 0, 'own dataset starts empty');
  expect(await page.isVisible('#restore') && await page.isDisabled('#restore'), '"Clear dots" is shown but disabled while there are no dots');
  const plotY0 = (await page.locator('#plot').boundingBox()).y;
  const [ox, oy] = await plotXY(5, 5, [0, 10, 0, 10]);   /* right on the flat starting line y = 5 */
  await page.mouse.click(ox, oy);
  await page.waitForTimeout(80);
  expect(await num('#pt-count') === 1, 'a tap on the line (without dragging) adds a dot');
  expect((await page.locator('#plot').boundingBox()).y === plotY0, 'the graph must not move when the first dot appears');
  expect(await page.isEnabled('#restore'), '"Clear dots" becomes active');
  const box = await page.locator('#plot').boundingBox();
  const taps = [[0.2, 0.8], [0.4, 0.7], [0.65, 0.3], [0.85, 0.18]];
  for (const [fx, fy] of taps) { await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy); await page.waitForTimeout(80); }
  expect(await num('#pt-count') === 5, 'four more taps should give five dots, got ' + await num('#pt-count'));
  await page.waitForTimeout(500);
  await page.mouse.dblclick(ox, oy);
  await page.waitForTimeout(150);
  expect(await num('#pt-count') === 4, 'double-clicking a dot removes it, got ' + await num('#pt-count'));
  await page.click('#tab-auto');
  await page.click('#fit-exact');
  await page.waitForTimeout(900);
  const mOwn = await num('#equation', 'data-m');
  expect(mOwn > 0, 'dots going up-right should give a positive slope, got ' + mOwn);
  const rows = await page.$$eval('#t-body tr[data-i]', r => r.length);
  expect(rows === 4, 'data table should list the 4 dots');

  /* paste from Excel: tab-separated, with Indian digit grouping (1,45,000) */
  await page.click('#paste-btn');
  await page.fill('#paste-text', 'Size\tPrice\n1,200\t1,45,000\n1,500\t1,80,000\n2,000\t2,40,000');
  await page.click('#paste-go');
  await page.waitForTimeout(200);
  expect(await num('#pt-count') === 3, 'three pasted rows should give three dots');
  const r0 = await page.$$eval('#t-body tr[data-i="0"] input', i => i.map(x => Number(x.value)));
  expect(r0[0] === 1200 && r0[1] === 145000, `"1,200 ⇥ 1,45,000" should become (1200, 145000), got (${r0})`);
  expect((await page.textContent('#t-head')).includes('Price'), 'header row gives the column names');

  /* print: the sticky table header must not cover row 1 on paper */
  await page.emulateMedia({ media: 'print' });
  const thPos = await page.$eval('#t-head th', el => getComputedStyle(el).position);
  const wsShown = await page.isVisible('.worksheet');
  await page.emulateMedia({ media: 'screen' });
  expect(thPos === 'static' && wsShown, `print: table header static (${thPos}) and worksheet shown (${wsShown})`);

  /* fullscreen lab: the exit chip inside the lab gets you out by touch */
  await page.click('#fs-btn');
  await page.waitForTimeout(400);
  if (await page.evaluate(() => !!document.fullscreenElement)) {
    expect(await page.isVisible('#fs-exit'), 'exit chip visible inside the fullscreen lab');
    await page.click('#fs-exit');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => !document.fullscreenElement), 'exit chip leaves fullscreen');
  } else log('fullscreen not available in this browser; exit chip not checked');
  expect(await page.isHidden('#fs-exit'), 'exit chip hidden outside fullscreen');

  /* a change made just before switching dataset is still saved */
  await page.click('#ds-study');
  await page.click('#tab-manual');
  await page.fill('#m-num', '2.5');
  await page.click('#ds-house');          /* well within the 250 ms save delay */
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForSelector('#plot');
  await page.waitForTimeout(300);
  expect(await page.getAttribute('#ds-house', 'aria-pressed') === 'true', 'the chosen dataset is remembered after reload');
  await page.click('#ds-study');
  expect(near(await num('#equation', 'data-m'), 2.5, 1e-9), 'the study slope typed just before switching dataset survives a reload, got ' + await num('#equation', 'data-m'));
  await page.click('#ds-own');
  expect(await num('#pt-count') === 3, 'pasted own data survives a reload');

  /* back to the study data for the screenshot */
  await page.click('#ds-study');
  await page.click('#show-sq');
  await page.waitForTimeout(200);
};
