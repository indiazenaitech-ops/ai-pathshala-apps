/* Interaction test for Sorting Algorithms Visualizer. Run by tools/verify.js in en and hi. */
module.exports = async function ({ page, lang, expect, t, log }) {
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
  // the variables panel shows the SORTED list on the last step (it used to show the unsorted input)
  const varsEnd = (await page.textContent('#vars-a')).trim();
  expect(varsEnd === 'a = [1, 3, 5, 8]', 'variables panel shows the sorted list at the end, got ' + varsEnd);
  await page.click('#reset');
  expect((await page.textContent('#vars-a')).trim() === 'a = [5, 3, 8, 1]', 'Reset shows the starting list again');

  // 4b) custom-input edge cases: bad input never replaces the numbers; decimals stay distinct
  await page.fill('#custom', '');
  await page.click('#custom-use');
  s = await dbg();
  expect(JSON.stringify(s.arr) === '[5,3,8,1]' && /\bbad\b/.test(await page.getAttribute('#custom-msg', 'class')) && (await page.textContent('#custom-msg')).trim() === t('custom_err_empty'), 'empty input shows an error and keeps the numbers');
  await page.fill('#custom', '4, abc, 7');
  await page.click('#custom-use');
  s = await dbg();
  expect(JSON.stringify(s.arr) === '[5,3,8,1]' && (await page.textContent('#custom-msg')).includes('abc'), 'a word in the list is reported and the numbers stay');
  await page.fill('#custom', '1000000000, 2, 1e3');
  await page.click('#custom-use');
  s = await dbg();
  expect(JSON.stringify(s.arr) === '[1000000000,2,1000]', 'big numbers (and 1e3) are accepted, got ' + JSON.stringify(s.arr));
  await page.fill('#custom', '0.003, 0.001, 0.002');
  await page.click('#custom-use');
  await page.click('#step');
  await page.click('#step');
  const decMsg = await page.textContent('#msg-a');
  expect(decMsg.includes('0.003') && decMsg.includes('0.001'), 'small decimals are shown exactly in the step message (not rounded to 0): ' + decMsg);
  await page.fill('#custom', '5, 3, 8, 1');
  await page.click('#custom-use');

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

  // 5b) reload keeps the algorithm and the very same numbers (a teacher's lesson survives a refresh)
  const arrBefore = JSON.stringify(s.arr);
  await page.reload();
  await page.waitForFunction(() => typeof window.SV_DEBUG === 'function');
  s = await dbg();
  expect(s.algoA === 'quick' && JSON.stringify(s.arr) === arrBefore && s.pos === 0, 'after reload: quick sort with the same 10 numbers, at step 0');

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

  // 6b) quick sort reaches the end first (62 steps vs 96) but merge sort needs fewer comparisons (24 vs 26):
  //     the result must name merge as winner AND explain why quick showed "Done!" first
  await page.fill('#custom', '6, 2, 9, 4, 1, 8, 3, 7, 5, 10');
  await page.click('#custom-use');
  s = await dbg();
  expect(s.counts.quick.C === 26 && s.counts.merge.C === 24 && s.counts.quick.steps === 62 && s.counts.merge.steps === 96, 'quick 26 comparisons / 62 steps, merge 24 / 96, got ' + JSON.stringify([s.counts.quick.C, s.counts.quick.steps, s.counts.merge.C, s.counts.merge.steps]));
  await page.click('#play');
  await waitDone();
  const race2 = await page.textContent('#race');
  const note = t('race_note', { name: t('algo_quick'), a: '62', b: '96' });
  expect(race2.includes(t('race_win', { name: t('algo_merge'), x: '24', y: '26' })) && race2.includes(note), 'race names merge as winner and explains that quick finished first on screen: ' + race2);
  log('race2:', race2.trim());

  // 7) language switch mid-task re-renders the race text; Urdu (RTL) keeps "-5 vs 3" in the right order
  await page.selectOption('#edu-lang', 'ur');
  const raceUr = await page.textContent('#race');
  expect(raceUr !== race2 && /[؀-ۿ]/.test(raceUr), 'race result is re-written in Urdu after switching language');
  await page.uncheck('#cmp-on');
  await page.click('#algo-a [data-algo="bubble"]');
  await page.fill('#custom', '-5, 3');
  await page.click('#custom-use');
  await page.click('#step');
  await page.click('#step');
  const urMsg = await page.textContent('#msg-a');
  // each number sits in its own left-to-right isolate (U+2066 … U+2069), -5 first
  const iso = urMsg.match(/⁦([^⁩]*)⁩/g) || [];
  expect(iso.length >= 2 && /-5/.test(iso[0]) && /3/.test(iso[1]), 'Urdu message isolates each number so "-5" and "3" do not swap places: ' + JSON.stringify(urMsg));
  await page.selectOption('#edu-lang', lang);
  expect(!/⁦/.test(await page.textContent('#msg-a')), 'no RTL isolates left in the message after switching back to ' + lang);
};
