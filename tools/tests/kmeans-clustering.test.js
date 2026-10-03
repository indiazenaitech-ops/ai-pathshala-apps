/* Interaction test for Clustering Lab (k-means). Run by tools/verify.js in en and hi. */
module.exports = async function ({ page, expect, log }) {
  const dbg = () => page.evaluate(() => window.KM_DEBUG());

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
};
