/* Interaction test for the A/B Test Calculator (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, log }) {
  const dv = async (sel) => Number(await page.getAttribute(sel, 'data-value'));
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  await page.waitForSelector('#t-p-b');

  // 1) spec case: A 200/1000 vs B 250/1000 → two-sided p ≈ 0.0074 (z = 2.677), 95% range +1.35 … +8.65 points
  await page.fill('#in-n-a', '1000'); await page.fill('#in-c-a', '200');
  await page.fill('#in-n-b', '1000'); await page.fill('#in-c-b', '250');
  await page.waitForFunction(() => { const e = document.getElementById('t-p-b'); return e && Math.abs(Number(e.dataset.value) - 0.00742) < 0.0001; }, null, { timeout: 5000 });
  const p = await dv('#t-p-b');
  log('p-value', p);
  expect(near(p, 0.0074196, 2e-6), 'p-value for 200/1000 vs 250/1000 should be 0.00742, got ' + p);
  const lo = Number(await page.getAttribute('#t-ci-b', 'data-lo')), hi = Number(await page.getAttribute('#t-ci-b', 'data-hi'));
  expect(near(lo, 0.013464, 1e-5) && near(hi, 0.086536, 1e-5), '95% CI of the difference = 0.0135 … 0.0865, got ' + lo + ' … ' + hi);
  expect(near(await dv('#t-up-b'), 0.25, 1e-9), 'relative uplift = 25%');
  expect(await page.getAttribute('#verdict-b', 'data-kind') === 'better', 'verdict says B is better');
  const beat = await dv('#t-beat-b');
  expect(beat > 0.99 && beat < 0.999, 'chance B beats A ≈ 99.6%, got ' + beat);
  expect(await page.getAttribute('#chart', 'data-curves') === '2', 'chart has 2 curves');

  // 2) not significant → "not enough evidence"; small sample warning
  await page.fill('#in-n-b', '1000'); await page.fill('#in-c-b', '210');
  await page.waitForFunction(() => document.getElementById('verdict-b') && document.getElementById('verdict-b').dataset.kind === 'unsure', null, { timeout: 5000 });
  await page.fill('#in-n-a', '40'); await page.fill('#in-c-a', '5');
  await page.waitForSelector('#w-small-a', { timeout: 5000 });
  // unequal split 40 vs 1000 is flagged
  expect(await page.$('#w-split') !== null, 'unequal split warning shown for 40 vs 1000');

  // 3) bad input: conversions more than visitors
  await page.fill('#in-c-a', '50');
  await page.waitForFunction(() => document.getElementById('err').textContent.length > 0, null, { timeout: 5000 });
  expect(await page.getAttribute('#in-c-a', 'aria-invalid') === 'true', 'conversions > visitors marked invalid');
  expect(await page.$('#t-p-b') === null, 'no result while the input is wrong');

  // 4) sample-size planner: 10% → 12%, 80% power, 5% → 3,841 per group (standard formula 3840.85, rounded up)
  await page.fill('#pl-base', '10');
  await page.fill('#pl-change', '2');
  await page.click('#pl-abs'); await page.click('#pl-p80'); await page.click('#pl-s5'); await page.click('#pl-v2');
  await page.fill('#pl-daily', '500');
  await page.waitForFunction(() => document.getElementById('pl-n').dataset.value === '3841', null, { timeout: 5000 });
  expect(await dv('#pl-total') === 7682, 'total = 2 × 3841 = 7682');
  expect(await dv('#pl-days') === 16, '7682 people at 500 a day = 16 days');
  // relative 20% of 10% is the same change
  await page.click('#pl-rel'); await page.fill('#pl-change', '20');
  await page.waitForFunction(() => document.getElementById('pl-n').dataset.value === '3841', null, { timeout: 5000 });
  // 90% power needs more people
  await page.click('#pl-p90');
  await page.waitForFunction(() => Number(document.getElementById('pl-n').dataset.value) > 5000, null, { timeout: 5000 });
  log('n at 90% power', await page.getAttribute('#pl-n', 'data-value'));
  expect(await dv('#pl-n') === 5142, '10% → 12% at 90% power = 5,142 (5141.3 rounded up) per group, got ' + await dv('#pl-n'));

  // 5) three versions (example), with chance to be best summing to 100%
  await page.click('#ex-notice');
  await page.waitForSelector('#best');
  const best = await page.$$eval('#best b', (b) => b.map((x) => Number(x.dataset.value)));
  expect(best.length === 3 && near(best.reduce((a, b) => a + b, 0), 1, 1e-9), 'chance to be best has 3 values that add up to 1: ' + best);
  expect(await page.$('#cmp-c') !== null && await page.getAttribute('#chart', 'data-curves') === '3', 'C compared with A and drawn');

  // 6) state survives a reload
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#best');
  expect(await page.inputValue('#in-n-c') === '238', 'version C remembered after reload');
};
