/* Interaction test for Sorting Algorithms Visualizer. Run by tools/verify.js in en and hi. */
module.exports = async function ({ page, expect, t, log }) {
  const dbg = () => page.evaluate(() => window.SV_DEBUG());
  const setRange = (sel, v) => page.$eval(sel, (e, val) => { e.value = String(val); e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  const waitDone = () => page.waitForFunction(() => { const d = window.SV_DEBUG(); return d.total > 0 && d.pos === d.total && !d.playing; }, null, { timeout: 60000 });

  // 1) defaults: 16 random numbers, bubble sort, step 0; every algorithm really sorts them
  let s = await dbg();
  expect(s.arr.length === 16 && s.pos === 0 && s.algoA === 'bubble', 'default: 16 numbers, bubble sort, step 0 (got ' + s.arr.length + ', ' + s.algoA + ', ' + s.pos + ')');
  const want = JSON.stringify(s.arr.slice().sort((a, b) => a - b));
  for (const al of ['bubble', 'selection', 'insertion', 'merge', 'quick']) {
    expect(JSON.stringify(s.counts[al].sorted) === want, al + ' sorts the default numbers correctly');
  }

  // 2) custom numbers → exact textbook counts
  await page.fill('#custom', '5, 3, 8, 1');
  await page.click('#custom-use');
  s = await dbg();
  expect(JSON.stringify(s.arr) === '[5,3,8,1]' && s.preset === 'custom', 'custom numbers 5,3,8,1 loaded, got ' + JSON.stringify(s.arr));
  expect(s.counts.bubble.C === 6 && s.counts.bubble.SW === 4, 'bubble sort on 5,3,8,1: 6 comparisons + 4 swaps, got ' + s.counts.bubble.C + '/' + s.counts.bubble.SW);
  expect(s.counts.insertion.C === 5 && s.counts.insertion.W === 7, 'insertion sort: 5 comparisons + 7 writes, got ' + s.counts.insertion.C + '/' + s.counts.insertion.W);
  expect(s.counts.selection.C === 6 && s.counts.selection.SW === 2, 'selection sort: 6 comparisons + 2 swaps, got ' + s.counts.selection.C + '/' + s.counts.selection.SW);

  // 3) stepping: step 1 = pass 1, step 2 = first comparison on code line 6
  await page.click('#step');
  await page.click('#step');
  expect((await page.getAttribute('#comps-a', 'data-value')) === '1', 'after 2 steps the comparison counter is 1');
  expect((await page.$eval('#code .ln.on', e => e.getAttribute('data-ln'))) === '6', 'code line 6 (if a[j] > a[j+1]) is highlighted');
  await page.click('#back');
  s = await dbg();
  expect(s.pos === 1 && (await page.getAttribute('#comps-a', 'data-value')) === '0', 'Back returns to step 1 with 0 comparisons');

  // 4) play at top speed to the end
  await setRange('#speed', 10);
  await page.click('#play');
  await waitDone();
  s = await dbg();
  expect(JSON.stringify(s.lanes[0].a) === '[1,3,5,8]', 'bars end up sorted: ' + JSON.stringify(s.lanes[0].a));
  expect((await page.getAttribute('#comps-a', 'data-value')) === '6' && (await page.getAttribute('#swaps-a', 'data-value')) === '4', 'final counters 6 comparisons, 4 swaps');
  expect(!(await page.isHidden('#done-a')), '"Done" badge shown');

  // 5) quick sort on reversed data = worst case n(n-1)/2 comparisons
  await page.click('#algo-a [data-algo="quick"]');
  await setRange('#size', 10);
  await page.click('#presets [data-preset="reversed"]');
  s = await dbg();
  expect(s.algoA === 'quick' && s.arr.length === 10 && s.preset === 'reversed', 'quick sort with 10 reversed numbers');
  expect(s.arr.every((v, i) => i === 0 || s.arr[i - 1] > v), 'reversed preset is strictly decreasing');
  expect(s.counts.quick.C === 45, 'quick sort on reversed 10 numbers needs 45 comparisons, got ' + s.counts.quick.C);
  expect(s.counts.merge.C < 45, 'merge sort needs fewer comparisons on the same numbers, got ' + s.counts.merge.C);
  const rows = await page.$$eval('#count-table tbody tr', r => r.length);
  const tq = await page.getAttribute('#count-table tr[data-algo="quick"] .c-comps', 'data-value');
  expect(rows === 5 && tq === '45', 'count table has 5 rows and shows 45 for quick sort (got ' + rows + ', ' + tq + ')');

  // 6) compare mode: race quick vs merge on the same numbers
  await page.check('#cmp-on');
  await page.click('#algo-b [data-algo="merge"]');
  s = await dbg();
  expect(s.compare && s.lanes.length === 2 && s.lanes[1].algo === 'merge', 'compare mode shows two lanes');
  expect(await page.isVisible('#cv-b'), 'second canvas is visible');
  await page.click('#play');
  await waitDone();
  s = await dbg();
  const sorted10 = JSON.stringify(s.arr.slice().sort((a, b) => a - b));
  expect(JSON.stringify(s.lanes[0].a) === sorted10 && JSON.stringify(s.lanes[1].a) === sorted10, 'both lanes end sorted');
  const race = await page.textContent('#race');
  expect(!(await page.isHidden('#race')) && race.includes(t('algo_merge')), 'race result names merge sort as winner: ' + race);
  log('race:', race.trim());
};
