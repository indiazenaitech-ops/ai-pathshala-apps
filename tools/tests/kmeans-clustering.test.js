/* Interaction test for Clustering Lab (k-means). Run by tools/verify.js in en and hi. */
module.exports = async function ({ page, lang, expect, log }) {
  const dbg = () => page.evaluate(() => window.KM_DEBUG());
  // screen position of a board point (data units 0–100)
  const boardPx = async (p) => {
    const s = await dbg();
    const r = await page.$eval('#board', e => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y }; });
    return { x: r.x + s.geom.x0 + p.x / 100 * s.geom.s, y: r.y + s.geom.y0 + (1 - p.y / 100) * s.geom.s };
  };

  // 1) default: 3 blobs, k = 3, centres placed, nothing assigned yet
  let s = await dbg();
  expect(s.ds === 'blobs3' && s.points.length === 150, 'default dataset is 3 blobs with 150 points, got ' + s.ds + '/' + s.points.length);
  expect(s.k === 3 && s.cents.length === 3, 'k = 3 with 3 starting centres');
  expect(s.labels.every(l => l === -1), 'no point is coloured before the first Assign');

  // 2) Step = Assign → every point gets a group, inertia appears, next step is Update
  await page.click('#step');
  s = await dbg();
  expect(s.round === 1 && s.next === 'update', 'after one step: round 1, next = update (got ' + s.round + ', ' + s.next + ')');
  expect(s.labels.every(l => l >= 0 && l < 3), 'every point assigned to one of 3 groups');
  const inertia1 = parseFloat(await page.getAttribute('#inertia', 'data-value'));
  expect(inertia1 > 0 && Math.abs(inertia1 - s.history[0]) < 1e-6, 'inertia shown equals first history value');
  expect(await page.$eval('#ph-update', e => e.classList.contains('on')), 'Update phase is highlighted');

  // 3) Step = Update → centres move to the mean of their points
  await page.click('#step');
  s = await dbg();
  expect(s.next === 'assign', 'after Update, next = assign');
  for (let j = 0; j < 3; j++) {
    const mine = s.points.filter((p, i) => s.labels[i] === j);
    if (!mine.length) continue;
    const mx = mine.reduce((a, p) => a + p.x, 0) / mine.length, my = mine.reduce((a, p) => a + p.y, 0) / mine.length;
    expect(Math.abs(mx - s.cents[j].x) < 1e-6 && Math.abs(my - s.cents[j].y) < 1e-6, 'centre ' + (j + 1) + ' is the mean of its points');
  }

  // 4) Run (fast) until it settles; inertia never goes up
  await page.click('#speed button[data-speed="fast"]');
  await page.click('#run');
  await page.waitForFunction(() => window.KM_DEBUG().done, null, { timeout: 30000 });
  s = await dbg();
  for (let i = 1; i < s.history.length; i++) expect(s.history[i] <= s.history[i - 1] + 1e-6, 'inertia never increases');
  expect(await page.$eval('#step', b => b.disabled), 'Step button disabled once finished');
  const groupsRows = await page.$$eval('#groups tbody tr', r => r.length);
  expect(groupsRows === 3, 'groups table has 3 rows, got ' + groupsRows);
  const counted = await page.$$eval('#groups .g-count', c => c.reduce((a, e) => a + (parseInt(e.textContent.replace(/[^0-9]/g, ''), 10) || 0), 0));
  expect(counted === 150, 'group sizes add up to 150, got ' + counted);
  log('settled after', s.round, 'rounds, inertia', s.history[s.history.length - 1].toFixed(1));

  // 5) Elbow chart: k = 1..8, falls, and suggests k = 3 for three blobs
  await page.click('#elbow-btn');
  s = await dbg();
  expect(s.elbow && s.elbow.length === 8, 'elbow has 8 values');
  expect(s.elbow[0].inertia > s.elbow[2].inertia && s.elbow[2].inertia > s.elbow[7].inertia, 'elbow curve goes down');
  expect(s.elbowK === 3, 'elbow suggests k = 3 for 3 blobs, got ' + s.elbowK);

  // 6) k stepper → 5 groups, fresh start
  await page.click('#k-plus');
  await page.click('#k-plus');
  s = await dbg();
  expect(s.k === 5 && s.cents.length === 5 && s.round === 0, 'k = 5 gives 5 new centres and round 0');
  expect(!(await page.isHidden('#use-k')), '"Use k = 3" button appears when k differs from the elbow');
  await page.click('#use-k');
  s = await dbg();
  expect(s.k === 3, 'use-k sets k back to 3');

  // 7) tap the board to add a point
  await page.$eval('#board', e => e.scrollIntoView({ block: 'center' }));
  const box = await page.$eval('#board', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.mouse.click(box.x + box.w * 0.9, box.y + box.h * 0.12);
  s = await dbg();
  expect(s.points.length === 151 && s.ds === 'custom', 'tapping the board adds one point (got ' + s.points.length + ')');
  expect((await page.getAttribute('#npoints', 'data-value')) === '151', 'point counter shows 151');

  // 8) customer preset shows age / ₹ columns
  await page.click('#ds-customers');
  s = await dbg();
  expect(s.ds === 'customers' && s.points.length === 170, 'customers dataset loads 170 shoppers');
  expect(!(await page.isHidden('#cust-note')), 'customer note visible');
  const cols = await page.$$eval('#groups thead th', t => t.length);
  expect(cols === 5, 'customer table has age + spending columns, got ' + cols);

  // 9) inertia shown = sum of squared distances from every point to its own centre
  await page.click('#step');
  s = await dbg();
  let sse = 0;
  s.points.forEach((p, i) => { const c = s.cents[s.labels[i]]; sse += (p.x - c.x) ** 2 + (p.y - c.y) ** 2; });
  const shown = parseFloat(await page.getAttribute('#inertia', 'data-value'));
  expect(Math.abs(shown - sse) < 1e-6 * Math.max(1, sse), 'inertia = sum of squared distances (' + shown + ' vs ' + sse + ')');
  // every point sits with its nearest centre after Assign
  const nearestOk = s.points.every((p, i) => s.cents.every(c => (p.x - c.x) ** 2 + (p.y - c.y) ** 2 >= (p.x - s.cents[s.labels[i]].x) ** 2 + (p.y - s.cents[s.labels[i]].y) ** 2 - 1e-9));
  expect(nearestOk, 'Assign puts every point with its nearest centre');

  // 10) a plain tap on a big cross must not count as dragging the centre (it adds a point there)
  await page.$eval('#board', e => e.scrollIntoView({ block: 'center' }));
  s = await dbg();
  const centre0 = s.cents[0];
  let at = await boardPx(centre0);
  await page.mouse.click(at.x, at.y);
  s = await dbg();
  expect(s.points.length === 171 && s.msg === 'data', 'tap on a cross adds a point, not a centre drag (points ' + s.points.length + ', msg ' + s.msg + ')');
  expect(Math.abs(s.cents[0].x - centre0.x) < 1e-9 && Math.abs(s.cents[0].y - centre0.y) < 1e-9, 'tap on a cross leaves the centre where it was');
  expect((await page.$eval('#cust-note', e => e.textContent)).includes('171'), 'customer note counts the points on the board');
  //     …but dragging it really moves the centre and starts over
  await page.click('#step');
  s = await dbg();
  at = await boardPx(s.cents[1]);
  const to = await boardPx({ x: 12, y: 88 });
  await page.mouse.move(at.x, at.y); await page.mouse.down();
  await page.mouse.move((at.x + to.x) / 2, (at.y + to.y) / 2, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 4 });
  await page.mouse.up();
  s = await dbg();
  expect(Math.abs(s.cents[1].x - 12) < 0.5 && Math.abs(s.cents[1].y - 88) < 0.5, 'dragged centre ends where it was dropped, got ' + JSON.stringify(s.cents[1]));
  expect(s.msg === 'drag' && s.round === 0 && s.labels.every(l => l === -1), 'moving a centre by hand starts again from round 0');

  // 11) switching language mid-task re-renders the dynamic text
  const msgBefore = await page.$eval('#msg', e => e.textContent);
  const headBefore = await page.$eval('#groups thead', e => e.textContent);
  await page.selectOption('#edu-lang', 'ur');
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => document.documentElement.dir === 'rtl'), 'Urdu page is right-to-left');
  expect((await page.$eval('#msg', e => e.textContent)) !== msgBefore, 'step message is translated after a language change');
  expect((await page.$eval('#groups thead', e => e.textContent)) !== headBefore, 'clusters table header is translated after a language change');
  expect(/[؀-ۿ]/.test(await page.$eval('#step', e => e.textContent)), 'Step button is in Urdu');
  await page.selectOption('#edu-lang', lang);
  await page.waitForTimeout(200);

  // 12) remove all points: nothing to step, a clear message, no stale customer note
  await page.click('#clear-pts');
  s = await dbg();
  expect(s.points.length === 0 && s.cents.length === 0, 'Remove all points empties the board');
  expect(await page.$eval('#step', b => b.disabled) && await page.$eval('#run', b => b.disabled), 'Step and Run are disabled with no points');
  expect((await page.getAttribute('#msg', 'data-code')) === 'need', 'message asks for more points');
  expect(await page.isHidden('#cust-note'), 'customer note hidden when there are no customers');

  // 13) a change made just before a reload is not lost
  await page.click('#ds-blobs3');
  await page.click('#k-plus');
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  s = await dbg();
  expect(s.k === 4 && s.ds === 'blobs3' && s.points.length === 150, 'k = 4 and the dataset survive an immediate reload (k ' + s.k + ')');

  // 14) a broken saved message code does not break the page
  await page.evaluate(() => {
    const k = 'edu.kmeans-clustering.state', st = JSON.parse(localStorage.getItem(k));
    st.msg = { code: 'toString', vars: { empty: 'x' } }; localStorage.setItem(k, JSON.stringify(st));
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  const m = await page.$eval('#msg', e => e.textContent);
  expect(m.length > 10 && !/object|undefined|NaN/.test(m), 'odd saved message falls back to a normal one, got: ' + m.slice(0, 60));

  // 15) phone: the clusters table (with the name boxes) fits without sideways scrolling
  const vp = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('#k-minus');
  await page.click('#ds-customers');
  await page.click('#step');
  await page.waitForTimeout(150);
  const fit = await page.$eval('#groups', t => ({ over: t.parentNode.scrollWidth - t.parentNode.clientWidth, inp: t.querySelector('input').getBoundingClientRect().right, page: document.documentElement.scrollWidth }));
  expect(fit.over <= 1 && fit.inp <= 390 && fit.page <= 390, 'phone: clusters table fits (overflow ' + fit.over + ', input right ' + Math.round(fit.inp) + ')');
  await page.setViewportSize(vp);
  await page.click('#ds-blobs3');
  await page.click('#step');
};
