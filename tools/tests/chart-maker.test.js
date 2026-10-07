/* Interaction test for Chart Maker (run by tools/verify.js in en and hi). */
const fs = require('fs');
module.exports = async function ({ page, lang, expect }) {
  const count = (sel) => page.$$eval('#stage ' + sel, e => e.length);
  /* 1. type 3 rows by hand into an emptied table */
  await page.click('#clear-grid');                         /* confirm() is auto-accepted */
  await page.waitForSelector('#grid tbody tr');
  const rowsNow = await page.$$eval('#grid tbody tr', r => r.length);
  expect(rowsNow === 3, 'cleared table has 3 empty rows, got ' + rowsNow);
  await page.fill('#grid thead input[data-c="1"]', 'Sales');
  const vals = [['Pune', '1200'], ['Surat', '₹2,500'], ['Patna', '800']];
  for (let r = 0; r < 3; r++) {
    await page.fill(`#grid input[data-r="${r + 1}"][data-c="0"]`, vals[r][0]);
    await page.fill(`#grid input[data-r="${r + 1}"][data-c="1"]`, vals[r][1]);
  }
  await page.click('#types [data-type="bar"]');
  await page.waitForTimeout(250);
  expect(await count('rect.cm-bar') === 3, '3 rows → 3 bars, got ' + await count('rect.cm-bar'));
  /* the tallest bar is ₹2,500 (Surat): heights in ratio 1200 : 2500 : 800 */
  const h = await page.$$eval('#stage rect.cm-bar', b => b.map(x => +x.getAttribute('height')));
  expect(Math.abs(h[1] / h[0] - 2500 / 1200) < 0.01 && Math.abs(h[2] / h[0] - 800 / 1200) < 0.01, 'bar heights follow the values: ' + h.join(','));

  /* 2. pie keeps the data: 3 slices */
  await page.click('#types [data-type="pie"]');
  await page.waitForTimeout(100);
  expect(await count('path.cm-slice') === 3, 'pie should have 3 slices, got ' + await count('path.cm-slice'));
  expect(await count('rect.cm-bar') === 0, 'no bars in a pie');
  /* horizontal bars and sort */
  await page.click('#types [data-type="hbar"]');
  await page.selectOption('#o-sort', 'desc');
  await page.waitForTimeout(250);
  const w = await page.$$eval('#stage rect.cm-bar', b => b.map(x => +x.getAttribute('width')));
  expect(w.length === 3 && w[0] > w[1] && w[1] > w[2], 'sorted largest first: ' + w.join(','));

  /* 3. PNG export has the chosen size */
  const pngSize = async () => {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#png')]);
    const buf = fs.readFileSync(await dl.path());
    expect(buf.slice(1, 4).toString() === 'PNG', 'download is a PNG');
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  };
  await page.click('#size [data-size="wide"]');
  let s = await pngSize();
  expect(s[0] === 1200 && s[1] === 675, 'wide PNG should be 1200×675, got ' + s.join('×'));
  await page.click('#size [data-size="square"]');
  s = await pngSize();
  expect(s[0] === 1080 && s[1] === 1080, 'square PNG should be 1080×1080, got ' + s.join('×'));
  const [svgDl] = await Promise.all([page.waitForEvent('download'), page.click('#svg')]);
  const svg = fs.readFileSync(await svgDl.path(), 'utf8');
  expect(/<svg[^>]+viewBox="0 0 1080 1080"/.test(svg) && (svg.match(/class="cm-bar"/g) || []).length === 3, 'SVG download has 3 bars');

  /* 4. pie with many slices and negatives warns */
  await page.click('#add-row'); await page.click('#add-row'); await page.click('#add-row'); await page.click('#add-row'); await page.click('#add-row');
  for (let r = 4; r <= 8; r++) { await page.fill(`#grid input[data-r="${r}"][data-c="0"]`, 'C' + r); await page.fill(`#grid input[data-r="${r}"][data-c="1"]`, r === 8 ? '-50' : String(r * 10)); }
  await page.click('#types [data-type="pie"]');
  await page.waitForTimeout(250);
  const warns = await page.$$eval('#warn p', p => p.length);
  expect(await count('path.cm-slice') === 7 && warns >= 2, 'pie: 7 positive slices and warnings for >6 slices + a negative, got ' + await count('path.cm-slice') + ' / ' + warns);

  /* 5. sample histogram: 40 marks → bars add up to 40 */
  await page.click('[data-sample="marks"]');
  await page.waitForTimeout(150);
  const titles = await page.$$eval('#stage rect.cm-bar title', t => t.map(x => +x.textContent.split(': ').pop()));
  expect(titles.reduce((a, b) => a + b, 0) === 40, 'histogram counts add up to 40, got ' + titles.join('+'));
  /* scatter sample has 12 dots */
  await page.click('[data-sample="hw"]');
  await page.waitForTimeout(150);
  expect(await count('circle.cm-dot') === 12, 'scatter: 12 students');
};
