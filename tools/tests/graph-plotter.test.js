/* Interaction test for Graph Plotter (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t, log }) {
  const rows = (kind, fi) => page.$$eval('#points-body tr[data-kind="' + kind + '"]', (trs) => trs.map((r) => ({
    fi: +r.dataset.fi, fj: r.dataset.fj === '' ? null : +r.dataset.fj, x: +r.dataset.x, y: +r.dataset.y
  }))).then((l) => (fi === undefined ? l : l.filter((p) => p.fi === fi)));
  const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-6);
  const has = (list, x, y) => list.some((p) => near(p.x, x) && (y === undefined || near(p.y, y)));
  const waitPoint = (kind, x, fi) => page.waitForFunction(([k, xv, f]) =>
    [...document.querySelectorAll('#points-body tr[data-kind="' + k + '"]')].some((r) =>
      Math.abs(+r.dataset.x - xv) < 1e-6 && (f === null || +r.dataset.fi === f)), [kind, x, fi === undefined ? null : fi], { timeout: 8000 });

  await page.waitForSelector('#points-body tr');

  // 1) default graph: f(x) = ax^2 + bx + c with a = 1, b = -2, c = -3, and g(x) = x + 1
  let roots = await rows('root', 0);
  expect(has(roots, -1, 0) && has(roots, 3, 0), 'zeroes of x² − 2x − 3 should be −1 and 3, got ' + JSON.stringify(roots));
  const inter = await rows('inter');
  expect(has(inter, -1, 0) && has(inter, 4, 5), 'f and g should meet at (−1, 0) and (4, 5), got ' + JSON.stringify(inter));
  expect(has(await rows('min', 0), 1, -4), 'vertex (lowest point) of the parabola should be (1, −4)');
  expect(has(await rows('yint', 1), 0, 1), 'g = x + 1 cuts the y-axis at (0, 1)');

  // 2) move slider c to 0 → f = x^2 - 2x, zeroes 0 and 2
  await page.fill('#param-c-num', '0');
  await waitPoint('root', 2, 0);
  roots = await rows('root', 0);
  expect(has(roots, 0, 0) && has(roots, 2, 0) && !has(roots, 3), 'with c = 0 the zeroes are 0 and 2, got ' + JSON.stringify(roots));
  expect(await page.inputValue('#param-c') === '0', 'range slider follows the number box');

  // 3) parse errors are explained in the current language, then fixed
  await page.fill('#fn-in-1', '2x + (');
  expect(await page.getAttribute('#fn-in-1', 'aria-invalid') === 'true', 'broken formula is marked invalid');
  expect((await page.textContent('#fn-msg-1')).trim() === t('err_paren'), 'bracket error shown in this language');
  await page.fill('#fn-in-1', '2x + 3y = 6');
  expect(await page.getAttribute('#fn-msg-1', 'data-code') === 'equation', 'an equation with y gets the "write y in terms of x" hint');
  await page.fill('#fn-in-1', '6 - 2x');
  expect(await page.getAttribute('#fn-in-1', 'aria-invalid') === 'false', 'fixed formula is valid again');
  await waitPoint('inter', Math.sqrt(6));
  const meet = (await rows('inter')).find((p) => near(p.x, Math.sqrt(6)));
  expect(meet && near(meet.y, 6 - 2 * Math.sqrt(6)), 'x² − 2x = 6 − 2x meets at x = √6, got ' + JSON.stringify(meet));

  // 4) add y = 1/x: no zero, a break at x = 0, and "not defined" in the table of values
  await page.click('#add-fn');
  await page.fill('#fn-in-2', '1/x');
  await page.waitForTimeout(300);
  expect((await rows('root', 2)).length === 0, '1/x has no zero (the sign change at x = 0 is an asymptote)');
  await page.selectOption('#tv-fn', '2');
  await page.fill('#tv-from', '-2');
  await page.fill('#tv-to', '2');
  await page.fill('#tv-step', '0.5');
  const tv = await page.$$eval('#tv-body tr', (trs) => trs.map((r) => [r.dataset.x, r.dataset.y, r.cells[1].textContent.trim()]));
  expect(tv.length === 9, 'table from −2 to 2 step 0.5 has 9 rows, got ' + tv.length);
  const zeroRow = tv.find((r) => r[0] === '0');
  expect(zeroRow && zeroRow[1] === '' && zeroRow[2] === t('undefined'), '1/x is "not defined" at x = 0 in this language: ' + JSON.stringify(zeroRow));
  expect(tv.some((r) => r[0] === '0.5' && r[1] === '2'), '1/0.5 = 2 in the table');

  // 5) trig preset in degrees: cos x has zeroes at ±90°, 270°
  await page.click('#preset-trig');
  expect(await page.inputValue('#fn-in-0') === 'a sin(bx)' && await page.inputValue('#fn-in-1') === 'cos x', 'trig preset loads two functions');
  expect(await page.isVisible('#note'), 'preset explanation shown');
  await page.click('#mode-deg');
  expect(await page.getAttribute('#mode-deg', 'aria-pressed') === 'true', 'degrees mode on');
  await waitPoint('root', 90, 1);
  roots = await rows('root', 1);
  expect(has(roots, 90, 0) && has(roots, -90, 0) && has(roots, 270, 0), 'cos x = 0 at −90°, 90°, 270°, got ' + JSON.stringify(roots.map((p) => p.x)));
  expect(has(await rows('max', 0), 90, 1), 'sin x is highest (1) at 90°');

  // 6) tracing: point at cos 60° = 0.5 on the canvas
  await page.$eval('#plot', (c) => c.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(200);
  const box = await page.$eval('#plot', (c) => { const r = c.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  const p = await page.evaluate(() => window.GraphPlotter.plot.toScreen(60, 0.5));
  await page.mouse.move(box.x + p.x, box.y + p.y);
  await page.waitForFunction(() => document.getElementById('readout').dataset.y !== undefined, null, { timeout: 4000 });
  const rx = Number(await page.getAttribute('#readout', 'data-x')), ry = Number(await page.getAttribute('#readout', 'data-y'));
  log('trace at', rx, ry, (await page.textContent('#readout')).trim());
  expect(Math.abs(rx - 60) < 2 && near(ry, Math.cos(rx * Math.PI / 180), 1e-9) && await page.getAttribute('#readout', 'data-fi') === '1', 'hover reads (x, cos x) near x = 60°');

  // 7) drag pans the view; zoom button zooms; state survives a reload
  const cx0 = Number(await page.getAttribute('#plot', 'data-cx'));
  await page.mouse.move(box.x + 300, box.y + 200);
  await page.mouse.down();
  await page.mouse.move(box.x + 360, box.y + 220, { steps: 6 });
  await page.mouse.move(box.x + 420, box.y + 240, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  const cx1 = Number(await page.getAttribute('#plot', 'data-cx'));
  expect(cx1 < cx0 - 1, 'dragging right moves the view left: ' + cx0 + ' → ' + cx1);
  const sx0 = Number(await page.getAttribute('#plot', 'data-sx'));
  await page.click('#zoom-in');
  await page.waitForFunction((s) => Number(document.getElementById('plot').dataset.sx) > s * 1.4, sx0, { timeout: 4000 }).catch(() => { });
  expect(Number(await page.getAttribute('#plot', 'data-sx')) > sx0 * 1.4, 'zoom in makes the scale bigger');
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#fn-in-1');
  expect(await page.inputValue('#fn-in-1') === 'cos x', 'functions remembered after reload');
  expect(await page.getAttribute('#mode-deg', 'aria-pressed') === 'true', 'degrees mode remembered after reload');
};
