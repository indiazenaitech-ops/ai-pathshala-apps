/* Interaction test for the Statistics & Sampling Lab (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, log }) {
  const dv = async (sel, attr) => Number(await page.getAttribute(sel, attr || 'data-value'));
  await page.waitForSelector('#v-se');

  // population SD computed here, independently of the app's own summary code
  const sigmaOf = (kind) => page.evaluate((k) => {
    const v = window.SLSTATS.population(k).values; let s = 0; for (const x of v) s += x;
    const m = s / v.length; let q = 0; for (const x of v) q += (x - m) * (x - m); return Math.sqrt(q / v.length);
  }, kind);

  // 1) SE shown = σ/√n for the chosen n (default heights, n = 30), and follows n
  const sh = await sigmaOf('heights');
  expect(Math.abs(await dv('#v-se') - sh / Math.sqrt(30)) < 1e-9, 'SE = σ/√30 for heights, got ' + await dv('#v-se'));
  await page.click('.sl-chips [data-n="100"]');
  await page.waitForFunction(() => document.getElementById('v-se').dataset.n === '100');
  expect(Math.abs(await dv('#v-se') - sh / 10) < 1e-9, 'SE = σ/10 at n = 100');
  await page.click('#pop-income');
  await page.click('.sl-chips [data-n="5"]');
  const si = await sigmaOf('income');
  await page.waitForFunction(() => document.getElementById('v-se').dataset.n === '5');
  expect(Math.abs(await dv('#v-se') - si / Math.sqrt(5)) < 1e-6, 'SE = σ/√5 for income');

  // 2) 1,000 samples: the SD of the sample means is close to σ/√n
  await page.click('.sl-chips [data-n="30"]');
  await page.click('#take1000');
  await page.waitForFunction(() => document.getElementById('v-count').dataset.value === '1000');
  const sdm = await dv('#v-sdm'), se = await dv('#v-se');
  log('income n=30: SD of 1000 means', sdm.toFixed(1), 'vs σ/√n', se.toFixed(1));
  expect(Math.abs(sdm / se - 1) < 0.1, 'SD of sample means within 10% of σ/√n');

  // 3) 100 confidence intervals: coverage between 85 and 100
  await page.click('#pop-heights');
  await page.click('#tab-ci');
  await page.click('#conf-95');
  await page.click('#ci100');
  await page.waitForFunction(() => document.getElementById('ci-count').dataset.total === '100');
  const cov = await dv('#ci-count', 'data-covered');
  log('coverage of 100 95% intervals', cov);
  expect(cov >= 85 && cov <= 100, '100 intervals → coverage between 85 and 100, got ' + cov);

  // 4) the crorepati moves the mean far more than the median
  await page.click('#tab-mm');
  await page.click('#mm-sample');
  const ms = await dv('#mm-mean-shift'), ds = await dv('#mm-median-shift');
  log('mean shift', ms, 'median shift', ds);
  expect(ms > 10 * ds && ms > 50000, 'outlier moves the mean (' + ms + ') much more than the median (' + ds + ')');
  expect(await dv('#mm-d0') === 12000, 'median of the 15 village incomes is ₹12,000');

  // 5) sampling bias: random surveys are close to the truth, city-only ones are far too high
  await page.click('#tab-bias');
  await page.click('#bn-100');
  await page.click('#bias-run');
  await page.waitForFunction(() => document.getElementById('bias-city').dataset.err);
  const er = Number(await page.getAttribute('#bias-random', 'data-err')), ec = Number(await page.getAttribute('#bias-city', 'data-err')), eo = Number(await page.getAttribute('#bias-online', 'data-err'));
  log('bias errors random/city/online', er.toFixed(3), ec.toFixed(3), eo.toFixed(3));
  expect(Math.abs(er) < 0.03 && ec > 0.3 && eo > 0.2, 'random survey unbiased, city/online biased upward');

  // 6) quiz: all right answers → 8 of 8
  await page.click('#tab-quiz');
  const answers = await page.evaluate(() => window.APP_CONTENT.en.quiz.map((q) => q.a));
  for (let i = 0; i < answers.length; i++) await page.check(`#q${i} input[value="${answers[i]}"]`);
  await page.click('#quiz-check');
  expect(await page.getAttribute('#quiz-score', 'data-score') === '8', 'quiz score 8 of 8');

  // 7) settings survive a reload
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#v-se');
  expect(await page.inputValue('#n-range') === '30' && await page.getAttribute('#tab-quiz', 'aria-selected') === 'true', 'n and tab remembered');
};
