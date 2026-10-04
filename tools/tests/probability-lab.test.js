/* Interaction test for Probability Lab (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, t, log }) {
  const num = async (sel, attr) => Number(await page.getAttribute(sel, attr));
  const theory = async () => ({
    fav: await num('#pe-theory', 'data-fav'), total: await num('#pe-theory', 'data-total'),
    num: await num('#pe-theory', 'data-num'), den: await num('#pe-theory', 'data-den')
  });
  const trials = () => num('#trials', 'data-n');
  const waitTrials = (n, timeout) => page.waitForFunction((v) => document.getElementById('trials').dataset.n === String(v), n, { timeout: timeout || 8000 });
  const rowSum = () => page.$$eval('#results-body tr[data-key]', (trs) => trs.reduce((a, r) => a + Number(r.dataset.count), 0));

  await page.waitForSelector('#pe-theory');

  // 1) default: two coins, event "at least one head" = 3/4; three coins → 7/8 and binomial table 1:3:3:1
  expect(await page.getAttribute('#tab-coin', 'aria-selected') === 'true', 'coins tab open by default');
  let th = await theory();
  expect(th.fav === 3 && th.total === 4, 'P(at least one head, 2 coins) = 3/4, got ' + JSON.stringify(th));
  await page.click('#coin-n-3');
  th = await theory();
  expect(th.fav === 7 && th.total === 8, 'P(at least one head, 3 coins) = 7/8, got ' + JSON.stringify(th));
  const coinRows = await page.$$eval('#results-body tr[data-key]', (trs) => trs.map((r) => r.dataset.key + ':' + r.dataset.num + '/' + r.dataset.den));
  expect(coinRows.join(',') === '0:1/8,1:3/8,2:3/8,3:1/8', 'three coins: P(0..3 heads) = 1/8, 3/8, 3/8, 1/8, got ' + coinRows.join(','));

  // 2) one die: even = 3/6 = 1/2, then 10,000 fast trials
  await page.click('#tab-die');
  await page.click('#preset-even');
  th = await theory();
  expect(th.fav === 3 && th.total === 6 && th.num === 1 && th.den === 2, 'P(even) = 3/6 = 1/2, got ' + JSON.stringify(th));
  await page.click('#run-10000');
  await waitTrials(10000);
  expect(await rowSum() === 10000, 'frequencies of 1..6 add up to 10,000');
  const evCount = await num('#pe-exp', 'data-count');
  log('even in 10000 rolls:', evCount);
  expect(Math.abs(evCount / 10000 - 0.5) < 0.04, 'experimental P(even) is close to 0.5 after 10,000 rolls, got ' + evCount / 10000);
  expect(await num('#line', 'data-n') === 10000, 'law-of-large-numbers chart uses all 10,000 trials');
  await page.click('#preset-gt4');
  th = await theory();
  expect(th.num === 1 && th.den === 3, 'P(more than 4) = 2/6 = 1/3');
  const c5 = await num('#results-body tr[data-key="5"]', 'data-count'), c6 = await num('#results-body tr[data-key="6"]', 'data-count');
  expect(await num('#pe-exp', 'data-count') === c5 + c6, 'event count = frequency of 5 + frequency of 6');

  // 3) two dice: sum 7 = 6/36 = 1/6; prime sum = 15/36 = 5/12
  await page.click('#tab-dice');
  await page.click('#preset-sum7');
  th = await theory();
  expect(th.fav === 6 && th.total === 36 && th.num === 1 && th.den === 6, 'P(sum 7) = 6/36 = 1/6, got ' + JSON.stringify(th));
  await page.click('#preset-sum_prime');
  th = await theory();
  expect(th.fav === 15 && th.num === 5 && th.den === 12, 'P(prime sum) = 15/36 = 5/12, got ' + JSON.stringify(th));
  await page.click('#run-1000');
  await waitTrials(1000);
  expect((await page.$$('#results-body tr[data-key]')).length === 11, 'sums 2..12 give 11 rows');

  // 4) spinner with sizes 3, 2, 1: P(first part) = 1/2; change sizes and add a part
  await page.click('#tab-spinner');
  th = await theory();
  expect(th.num === 1 && th.den === 2, 'P(red part of size 3 out of 6) = 1/2');
  await page.fill('#sec-size-0', '1');
  await page.$eval('#sec-size-0', (e) => e.dispatchEvent(new Event('change', { bubbles: true })));
  th = await theory();
  expect(th.fav === 1 && th.total === 4, 'after size 1: P = 1/4, got ' + JSON.stringify(th));
  await page.click('#sec-add');
  th = await theory();
  expect(th.total === 5 && (await page.$$('.pl-sec')).length === 4, 'added part: 4 parts and 5 equal slices');
  await page.fill('#sec-name-0', 'Ravi');
  expect((await page.textContent('#ev-s1')).includes('Ravi'), 'renamed part shows in the event chips');
  await page.click('#run-100');
  await waitTrials(100);
  // fast runs are not animated, but the wheel's pointer must still point at the part named in "Trial n: …"
  for (let i = 0; i < 4; i++) {
    const ptr = await page.getAttribute('#stage', 'data-pointer'), raw = await page.getAttribute('#stage', 'data-raw');
    expect(ptr !== '' && ptr === raw, 'spinner pointer shows the last result after ×100 (pointer ' + ptr + ', last part ' + raw + ')');
    if (i < 3) { await page.click('#run-100'); await waitTrials(200 + i * 100); }
  }
  const spinRows = await page.$$eval('#results-body tr[data-key]', (trs) => trs.map((r) => Number(r.dataset.count)));
  expect(spinRows.length === 4 && spinRows.reduce((a, b) => a + b, 0) === 400, 'spinner table: 4 parts, frequencies add up to 400');

  // 5) bag 5 red, 3 blue, 2 green: P(red) = 1/2; two balls without replacement, same colour = 28/90 = 14/45
  await page.click('#tab-bag');
  th = await theory();
  expect(th.num === 1 && th.den === 2, 'P(red) = 5/10 = 1/2');
  await page.click('#bag-d2');
  await page.click('#bag-norep');
  await page.click('#preset-same');
  th = await theory();
  expect(th.fav === 28 && th.total === 90 && th.num === 14 && th.den === 45, 'without replacement P(same colour) = 28/90 = 14/45, got ' + JSON.stringify(th));
  await page.click('#bag-rep');
  th = await theory();
  expect(th.fav === 38 && th.total === 100 && th.num === 19 && th.den === 50, 'with replacement P(same colour) = 38/100 = 19/50, got ' + JSON.stringify(th));
  await page.click('#bag-minus-0');
  expect((await page.textContent('#bag-count-0')).trim() === '4', 'one red ball removed');

  // 6) cards: face card = 12/52 = 3/13, red face card = 6/52 = 3/26, rank view has 13 rows; animated single draw
  await page.click('#tab-cards');
  await page.click('#preset-face');
  th = await theory();
  expect(th.fav === 12 && th.total === 52 && th.num === 3 && th.den === 13, 'P(face card) = 12/52 = 3/13, got ' + JSON.stringify(th));
  await page.click('#preset-redface');
  th = await theory();
  expect(th.fav === 6 && th.num === 3 && th.den === 26, 'P(red face card) = 6/52 = 3/26');
  await page.click('#view-rank');
  expect((await page.$$('#results-body tr[data-key]')).length === 13, 'rank view has 13 rows');
  expect(await page.isChecked('#anim'), 'animation is on by default');
  await page.click('#run-1');
  await waitTrials(1, 8000);
  expect((await page.textContent('#last')).trim().length > 3, 'last result is described');

  // CSV: one row per rank + headers, total and event rows; plain text (no "E: E:", no invisible bidi characters)
  await page.click('#run-1000');
  await waitTrials(1001);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#csv')]);
  const csv = require('fs').readFileSync(await dl.path(), 'utf8').replace(/^\uFEFF/, '');
  const lines = csv.split(/\r?\n/);
  expect(lines.length === 2 + 13 + 2, 'CSV has 2 header rows, 13 rank rows, total and event rows, got ' + lines.length);
  expect(!/[\u2066-\u2069]/.test(csv) && !/E: E:/.test(csv), 'CSV is plain text without bidi control characters or a doubled "E:"');
  const evLine = lines[lines.length - 1];
  expect(evLine.includes('3/26') && evLine.includes(String(await num('#pe-exp', 'data-count'))), 'CSV event row has P(red face card) = 3/26 and the event count: ' + evLine);
  await page.click('#reset');
  await waitTrials(0);
  await page.click('#run-1');
  await waitTrials(1, 8000);

  // 7) results survive a reload; reset clears them
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForSelector('#pe-theory');
  expect(await page.getAttribute('#tab-cards', 'aria-selected') === 'true', 'last experiment reopens after reload');
  expect(await trials() === 1, 'card trial kept after reload');
  await page.click('#tab-die');
  expect(await trials() === 10000, 'die results kept after reload');
  await page.click('#reset');
  await waitTrials(0);
  expect((await page.textContent('#trials')).trim() === t('trials_n', { n: '0' }), 'trials badge in this language after reset');

  // 8) reload in the middle of an animated ×10 run keeps the trials that already finished
  await page.click('#run-10');
  await page.waitForFunction(() => Number(document.getElementById('trials').dataset.n) >= 2, null, { timeout: 8000 });
  const midRun = await trials();
  await page.reload();
  await page.waitForSelector('#pe-theory');
  const afterReload = await trials();
  expect(afterReload >= midRun && afterReload <= 10, 'finished animated trials survive a reload mid-run (' + midRun + ' before, ' + afterReload + ' after)');
  await page.click('#reset');
  await waitTrials(0);

  // 9) Urdu (RTL): "Trial n: 3 + 4 = 7" stays left-to-right maths, and coin 1 is drawn on the right like the text
  await page.evaluate(() => EDU.setLang('ur'));
  await page.click('#tab-dice');
  const diceBefore = await trials();
  await page.click('#run-100');
  await waitTrials(diceBefore + 100);
  const order = await page.evaluate(() => {
    const el = document.getElementById('last'), tn = el.firstChild, s = tn.data;
    const x = (i) => { const r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + 1); return r.getBoundingClientRect().left; };
    return { plus: x(s.indexOf('+')), eq: x(s.indexOf('=')) };
  });
  expect(order.plus < order.eq, 'Urdu: dice sum reads "a + b = s" left to right (+ at ' + order.plus + ', = at ' + order.eq + ')');
  await page.click('#tab-spinner');
  await page.click('#run-100');
  expect(await page.getAttribute('#stage', 'data-pointer') === await page.getAttribute('#stage', 'data-raw'), 'Urdu: spinner pointer matches the last result');
  await page.evaluate((l) => EDU.setLang(l), lang);
  await page.click('#tab-coin');
};
