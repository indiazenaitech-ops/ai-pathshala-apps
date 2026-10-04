/* Interaction test for Statistics Calculator (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t, log }) {
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
  // quartile working highlights the Q1 / Q3 positions (2.25 → 2nd and 3rd, 6.75 → 6th and 7th), not the median
  await page.click('#tab-quart');
  const qMarks = await page.$$eval('#out-quart .st-sorted span.mid small', (s) => s.map((e) => e.textContent.trim()));
  expect(JSON.stringify(qMarks) === JSON.stringify(['2', '3', '6', '7']), 'quartile chips mark positions 2, 3, 6, 7, got ' + JSON.stringify(qMarks));
  await page.click('#tab-median');
  const mMarks = await page.$$eval('#out-median .st-sorted span.mid small', (s) => s.map((e) => e.textContent.trim()));
  expect(JSON.stringify(mMarks) === JSON.stringify(['4', '5']), 'median chips mark positions 4 and 5, got ' + JSON.stringify(mMarks));
  await page.click('#tab-mean');
  // a column copied from Excel: commas inside numbers are thousands separators (with a note)
  await page.fill('#raw-input', ['1,000', '2,000', '3,500'].join(String.fromCharCode(10)));
  await waitNum('mean', 6500 / 3);
  expect(await num('n') === 3, '1,000 / 2,000 / 3,500 is three numbers, got n = ' + await val('n'));
  expect(await page.$$eval('#msgs .callout.warning', (c) => c.length) === 1, 'thousands-separator note shown');
  await page.fill('#raw-input', '45, 12, 78');
  await waitNum('mean', 45);
  expect(await num('n') === 3 && await page.$$eval('#msgs .callout', (c) => c.length) === 0, 'comma + space still separates numbers, with no note');
  // numbers too big for exact digits are shown as a power of 10
  await page.fill('#raw-input', '1e20 3e20');
  await waitNum('n', 2);
  expect(/× 10²⁰/.test(await page.textContent('#res-mean .val')), 'mean of 1e20 and 3e20 shown as 2 × 10²⁰, got ' + await page.textContent('#res-mean .val'));
  // too many classes for Make grouped table → a clear message, nothing changes
  await page.fill('#raw-input', '1 50 100');
  await waitNum('n', 3);
  await page.fill('#gw', '1');
  await page.click('#make-grp');
  await page.waitForFunction((m) => [...document.querySelectorAll('.edu-toast')].some((e) => e.textContent === m), t('err_group_many', { n: 60 }), { timeout: 4000 });
  expect(await page.getAttribute('#mode-raw', 'aria-pressed') === 'true', 'still on the list after a refused grouping');
  await page.fill('#gw', '');
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
  expect(near(await num('q1'), 3) && near(await num('q3'), 5), 'Q1 = 3 (12.75th value) and Q3 = 5 (38.25th value), got ' + await val('q1') + ', ' + await val('q3'));
  await page.click('#tab-quart');
  const qRows = await page.$$eval('#out-quart tbody tr', (trs) => trs.map((tr) => tr.className));
  expect(qRows[1] === 'hl' && qRows[3] === 'hl2', 'Q1 row (x = 3) and Q3 row (x = 5) highlighted, got ' + JSON.stringify(qRows));
  await page.click('#tab-mean');
  // the example name belongs to its own data type only
  expect((await page.textContent('#res-sub')).trim() === t('ex_family'), 'example name shown under Results');
  await page.click('#mode-raw');
  expect((await page.textContent('#res-sub')).trim() === '' && await page.inputValue('#sample') === '', 'example name hidden while the list (other data) is shown');
  await page.click('#mode-disc');
  expect((await page.textContent('#res-sub')).trim() === t('ex_family'), 'example name back on the frequency table');

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
  await page.fill('#grp-body input[data-i="3"][data-k="f"]', '12 15');
  await page.waitForFunction(() => document.querySelector('#grp-body input[data-i="3"][data-k="f"]').getAttribute('aria-invalid') === 'true', null, { timeout: 4000 });
  expect(await val('n') === '', '"12 15" in one cell is an error, not 1215');
  await page.fill('#grp-body input[data-i="3"][data-k="f"]', '15');
  await waitNum('n', 60);

  // 9) Add row continues the classes (60–69 → 70–79)
  await page.click('#grp-add');
  const nl = await page.inputValue('#grp-body input[data-i="7"][data-k="l"]');
  const nu = await page.inputValue('#grp-body input[data-i="7"][data-k="u"]');
  expect(nl === '70' && nu === '79', 'new row is 70–79, got ' + nl + '–' + nu);
  await page.waitForTimeout(400);
  expect(await page.$$eval('#msgs .callout.danger', (c) => c.length) === 0 && await num('n') === 60, 'a new class with a blank frequency is an empty class, not an error');
  await page.fill('#grp-body input[data-i="7"][data-k="f"]', '4');
  await waitNum('n', 64);

  // 10) state survives a reload
  await page.reload({ waitUntil: 'load' }); /* at once: the edit must be saved when the page closes */
  await page.waitForSelector('#res-n');
  expect(await page.getAttribute('#mode-grp', 'aria-pressed') === 'true', 'grouped mode remembered');
  expect(await num('n') === 64, 'n = 64 remembered after reload, got ' + await val('n'));
  expect(await page.$$eval('#grp-body tr', (t) => t.length) === 8, '8 class rows remembered');

  // 11) unequal class widths: adjusted histogram note + a warning next to the mode formula
  await page.selectOption('#sample', 'heights');
  await waitNum('mode', 156.25);
  await page.fill('#grp-body input[data-i="5"][data-k="u"]', '175');
  await waitNum('mean', (7775 + 5 * 2.5) / 50);
  await page.click('#tab-mode');
  expect(await page.$$eval('#out-mode .callout.warning', (c) => c.length) === 1, 'mode working warns that the formula assumes equal widths');
  expect(near(await num('mode'), 156.25), 'the modal class is unchanged, mode = 156.25');
  await page.click('#ch-hist');
  expect(await page.textContent('#chart-note') === t('hist_adj_note'), 'histogram uses adjusted frequency for unequal widths');
  await page.fill('#grp-body input[data-i="5"][data-k="u"]', '170');
  await waitNum('mean', 155.5);
  await page.click('#tab-mean');
};
