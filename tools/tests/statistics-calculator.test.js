/* Interaction test for Statistics Calculator (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, log }) {
  const val = (id) => page.getAttribute('#res-' + id, 'data-value');
  const num = async (id) => Number(await val(id));
  const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-6);
  const waitNum = (id, v, tol) => page.waitForFunction(([i, x, t]) => {
    const e = document.getElementById('res-' + i);
    return e && e.dataset.value !== '' && Math.abs(Number(e.dataset.value) - x) <= t;
  }, [id, v, tol || 1e-6], { timeout: 6000 });

  await page.waitForSelector('#res-mean');

  // 1) default example: heights of 50 students in 6 classes (NCERT-style grouped data)
  expect(await num('n') === 50, 'n = 50 for the heights example, got ' + await val('n'));
  expect(near(await num('mean'), 155.5), 'grouped mean = 7775 / 50 = 155.5, got ' + await val('mean'));
  expect(near(await num('median'), 155 + 2 / 14 * 5), 'median = 155 + ((25 − 23)/14) × 5 ≈ 155.714, got ' + await val('median'));
  expect(near(await num('mode'), 156.25), 'mode = 155 + (2/8) × 5 = 156.25, got ' + await val('mode'));
  expect(near(await num('var'), 48), 'variance = 2400 / 50 = 48, got ' + await val('var'));

  // 2) ogives meet at the median
  await page.click('#ch-ogive');
  const meet = Number(await page.getAttribute('#chart', 'data-meet-x'));
  expect(near(meet, 155 + 2 / 14 * 5, 1e-6), 'less-than and more-than ogives meet at x = median, got ' + meet);
  expect(await page.getAttribute('#ch-ogive', 'aria-pressed') === 'true', 'ogive button is pressed');

  // 3) step-deviation method gives the same mean, with a fu column total of 30
  await page.click('#tab-mean');
  await page.click('#mm-step');
  await page.waitForFunction(() => document.querySelectorAll('#out-mean table th').length === 6);
  const foot = await page.$$eval('#out-mean tfoot td', (tds) => tds.map((td) => td.textContent.trim()));
  expect(foot[foot.length - 1] === '30', 'Σfu = 30 with a = 152.5, h = 5, got ' + JSON.stringify(foot));
  expect((await page.textContent('#out-mean .st-ans b')).trim() === '155.5', 'step-deviation mean is still 155.5');
  await page.fill('#in-a', '147.5');
  await page.waitForFunction(() => { const t = document.querySelectorAll('#out-mean tfoot td'); return t.length && t[t.length - 1].textContent.trim() === '80'; }, null, { timeout: 5000 });
  expect((await page.textContent('#out-mean .st-ans b')).trim() === '155.5', 'changing a to 147.5 keeps the mean 155.5');

  // 4) raw list: 2, 4, 4, 4, 5, 5, 7, 9 → mean 5, median 4.5, mode 4, σ = 2, Q1 = 4, Q3 = 6.5
  await page.click('#mode-raw');
  expect(await page.isVisible('#raw-input'), 'raw list box shown');
  await page.fill('#raw-input', '2, 4, 4, 4, 5, 5, 7, 9');
  await waitNum('mean', 5);
  expect(near(await num('median'), 4.5), 'median of 8 values = (4 + 5)/2 = 4.5, got ' + await val('median'));
  expect(await val('mode') === '4', 'mode = 4, got ' + await val('mode'));
  expect(near(await num('sd'), 2), 'population SD = 2, got ' + await val('sd'));
  expect(near(await num('q1'), 4) && near(await num('q3'), 6.5), 'Q1 = 4 and Q3 = 6.5 with the (n+1)/4 rule, got ' + await val('q1') + ', ' + await val('q3'));
  expect(near(await num('range'), 7), 'range = 9 − 2 = 7');
  await page.fill('#raw-input', '10 20 abc 30');
  await waitNum('mean', 20);
  expect(await page.$$eval('#msgs .callout', (c) => c.length) >= 1, 'non-number "abc" is reported');

  // 5) raw → frequency table
  await page.fill('#raw-input', '3 5 3 7 5 3');
  await waitNum('mean', 26 / 6);
  await page.click('#make-freq');
  expect(await page.getAttribute('#mode-disc', 'aria-pressed') === 'true', 'switched to frequency table');
  const rows = await page.$$eval('#disc-body tr', (trs) => trs.map((tr) => [...tr.querySelectorAll('input')].map((i) => i.value)));
  expect(JSON.stringify(rows) === JSON.stringify([['3', '3'], ['5', '2'], ['7', '1']]), 'frequency table built from the list: ' + JSON.stringify(rows));
  expect(await val('mode') === '3', 'mode from the table = 3');

  // 6) discrete example: family sizes → mean 223/50, median 4
  await page.selectOption('#sample', 'family');
  await waitNum('mean', 4.46);
  expect(near(await num('median'), 4), 'discrete median = 4 (25th and 26th values), got ' + await val('median'));

  // 7) inclusive classes 0–9, 10–19 … are corrected to −0.5–9.5 …
  await page.selectOption('#sample', 'incl');
  await page.waitForSelector('#incl-note');
  await waitNum('median', 29.5 + 11 / 15 * 10);
  log('inclusive median', await val('median'));
  expect(await num('n') === 60, 'n = 60 for the inclusive example');

  // 8) a bad cell is flagged, then fixed
  await page.fill('#grp-body input[data-i="3"][data-k="f"]', 'x');
  await page.waitForSelector('#msgs .callout.danger');
  expect(await page.getAttribute('#grp-body input[data-i="3"][data-k="f"]', 'aria-invalid') === 'true', 'bad frequency cell marked invalid');
  await page.fill('#grp-body input[data-i="3"][data-k="f"]', '15');
  await waitNum('n', 60);

  // 9) Add row continues the classes (60–69 → 70–79)
  await page.click('#grp-add');
  const nl = await page.inputValue('#grp-body input[data-i="7"][data-k="l"]');
  const nu = await page.inputValue('#grp-body input[data-i="7"][data-k="u"]');
  expect(nl === '70' && nu === '79', 'new row is 70–79, got ' + nl + '–' + nu);
  await page.fill('#grp-body input[data-i="7"][data-k="f"]', '4');
  await waitNum('n', 64);

  // 10) state survives a reload
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#res-n');
  expect(await page.getAttribute('#mode-grp', 'aria-pressed') === 'true', 'grouped mode remembered');
  expect(await num('n') === 64, 'n = 64 remembered after reload, got ' + await val('n'));
  expect(await page.$$eval('#grp-body tr', (t) => t.length) === 8, '8 class rows remembered');
};
