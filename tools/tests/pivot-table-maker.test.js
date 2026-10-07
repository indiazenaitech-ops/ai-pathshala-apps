/* Interaction test for Pivot Table Maker (run by tools/verify.js in en and hi). */
const fs = require('fs');
module.exports = async function ({ page, lang, expect }) {
  const rowVals = () => page.$$eval('#ptable tbody tr', trs => trs.map(tr => [tr.querySelector('th').textContent, +tr.querySelector('td[data-role="rowtotal"]').dataset.v]));
  const grand = () => page.$eval('#ptable td[data-role="grand"]', td => +td.dataset.v);

  /* 1. a small CSV with known totals (one bad amount, one blank region) */
  await page.click('#paste-btn');
  await page.fill('#paste', 'Region,Product,Amount\nNorth,Pen,100\nSouth,Pen,250\nNorth,Book,300\nEast,Book,abc\nSouth,Book,50\n,Pen,70\nEast,Pen,200\n');
  await page.click('#paste-use');
  await page.waitForFunction(() => /7/.test(document.querySelector('#dsline').textContent) && document.querySelectorAll('#ptable tbody tr').length === 4);
  /* guessed: rows = Region (fewest values), values = Amount, sum */
  expect(await page.$eval('#f-rows', s => s.value) === '0' && await page.$eval('#f-val', s => s.value) === '2' && await page.$eval('#f-agg', s => s.value) === 'sum', 'rows=Region, values=Amount, sum');
  const want = { North: 400, South: 300, East: 200 };
  const got = await rowVals();
  for (const [k, v] of got) if (want[k] !== undefined) expect(v === want[k], `sum for ${k} should be ${want[k]}, got ${v}`);
  const blankRow = got.find(r => !want.hasOwnProperty(r[0]));
  expect(blankRow && blankRow[1] === 70, 'blank region row = 70: ' + JSON.stringify(got));
  expect(await grand() === 970, 'grand total 970, got ' + await grand());
  expect(/1/.test(await page.textContent('#notes')) && await page.$$eval('#notes p', p => p.length) >= 2, 'skipped "abc" is reported');

  /* 2. count */
  await page.selectOption('#f-agg', 'count');
  const cnt = Object.fromEntries(await rowVals());
  expect(cnt.North === 2 && cnt.South === 2 && cnt.East === 2, 'count by region 2/2/2: ' + JSON.stringify(cnt));
  expect(await grand() === 7, 'count grand total 7');

  /* 3. columns: grand total equals the sum of the column totals and of the row totals */
  await page.selectOption('#f-agg', 'sum');
  await page.selectOption('#f-cols', '1');
  const colTots = await page.$$eval('#ptable td[data-role="coltotal"]', t => t.map(x => +x.dataset.v));
  expect(colTots.length === 2 && colTots.reduce((a, b) => a + b, 0) === await grand(), 'column totals add to grand total: ' + colTots);
  const pen = await page.$$eval('#ptable thead th', th => th.map(x => x.textContent));
  expect(pen.includes('Pen') && pen.includes('Book'), 'Product columns shown');
  /* % of grand total adds to 100 */
  await page.selectOption('#f-show', 'pct_total');
  const pctSum = (await rowVals()).reduce((a, r) => a + r[1], 0);
  expect(Math.abs(pctSum - 100) < 1e-6 && Math.abs(await grand() - 100) < 1e-9, '% of total rows add to 100, got ' + pctSum);
  await page.selectOption('#f-show', 'value');
  await page.selectOption('#f-cols', '-1');

  /* 4. filter: keep only North and South */
  await page.selectOption('#f-filter', '0');
  await page.click('#filter-add');
  await page.waitForSelector('.edu-modal .pv-vallist');
  const labels = await page.$$('.edu-modal .pv-vallist label');
  for (const l of labels) { const t = await l.textContent(); if (!/^(North|South) /.test(t)) await l.click(); }
  await page.click('#filter-apply');
  expect(await grand() === 700, 'North + South = 700, got ' + await grand());
  await page.click('#fchips .pv-chip button');
  expect(await grand() === 970, 'filter removed → 970');

  /* 5. sample: region totals add up to the grand total; month grouping works */
  await page.click('[data-sample="sales"]');
  await page.waitForFunction(() => document.querySelectorAll('#ptable tbody tr').length === 4);
  const reg = await rowVals();
  const sum = reg.reduce((a, r) => a + r[1], 0);
  const csvTotal = await page.evaluate(() => { const ds = window.__pv.ds; let s = 0; for (let i = 0; i < ds.n; i++) s += +ds.cols[6][i]; return s; });
  expect(Math.abs(sum - await grand()) < 1e-6 && await grand() === csvTotal, `sample: rows ${sum} = grand ${await grand()} = amount column ${csvTotal}`);
  await page.selectOption('#f-cols', '0');                  /* Date → grouped by month */
  const months = await page.$$eval('#ptable thead th', th => th.length - 2);
  expect(months === 12, 'date grouped into 12 months, got ' + months);

  /* 6. export CSV */
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
  const lines = fs.readFileSync(await dl.path(), 'utf8').trim().split(/\r?\n/);
  expect(lines.length === 6, 'CSV: header + 4 regions + grand total, got ' + lines.length);
};
