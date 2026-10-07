/* Interaction test for Join & Merge Files (run by tools/verify.js in en and hi). */
const fs = require('fs');
module.exports = async function ({ page, expect, log }) {
  const n = async (id) => Number(await page.getAttribute('#' + id, 'data-n'));
  const waitN = (id, v) => page.waitForFunction(([i, x]) => document.getElementById(i).dataset.n === String(x), [id, v], { timeout: 8000 });
  await page.waitForSelector('#out-grid tbody tr');

  // 1) students (10) + marks (11 rows, roll 101 and 103 twice, 111 and 112 not in A); default left join
  await page.click('#sample-seg button[data-s="students"]');
  await page.click('#type-seg button[data-type="left"]');
  await waitN('st-rows', 12);
  expect(await n('st-matched') === 7 && await n('st-onlya') === 3 && await n('st-onlyb') === 2, 'matched 7, only A 3, only B 2');
  expect(await page.$('#warn-dup') !== null, 'one-to-many warning shown (roll 101 and 103 have 2 marks rows)');
  const row105 = await page.$$eval('#out-grid tbody tr', (trs) => {
    const tr = trs.find((r) => r.querySelector('td[data-c="0"]').textContent === '105');
    return tr ? [tr.querySelector('td[data-c="4"]').textContent, tr.querySelector('td[data-c="4"]').className] : null;
  });
  expect(row105 && row105[0] === '' && row105[1] === 'nm', 'left join keeps roll 105 (no marks) with a blank subject: ' + JSON.stringify(row105));
  await page.click('#type-seg button[data-type="inner"]');
  await waitN('st-rows', 9);
  await page.click('#type-seg button[data-type="right"]');
  await waitN('st-rows', 11);
  await page.click('#type-seg button[data-type="full"]');
  await waitN('st-rows', 14);
  expect((await page.getAttribute('#venn', 'class')).includes(' a b'), 'Venn shows both sides for full outer');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#dl-out')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8').trim().split(/\r?\n/);
  expect(csv.length === 15 && csv[0].split(',').length === 6, 'full outer CSV: header + 14 rows, 6 columns; got ' + csv.length);

  // 2) orders + customers: "001" / "03" only match with the 007 = 7 option
  await page.click('#sample-seg button[data-s="orders"]');
  await page.click('#type-seg button[data-type="inner"]');
  await waitN('st-rows', 6);
  expect(await page.$('#hint-num') !== null, 'hint about 007 vs 7 shown');
  await page.check('#opt-num');
  await waitN('st-rows', 8);
  expect(await n('st-onlya') === 2, 'orders still unmatched: customer 9 and a blank key');
  await page.uncheck('#opt-num');
  await waitN('st-rows', 6);

  // 3) stack: 4 + 5 + 3 rows; Feb has columns in another order, March has an extra Payment column
  await page.click('#mode-tabs button[data-mode="stack"]');
  await page.click('#st-sample');
  await page.waitForFunction(() => document.getElementById('st-total').dataset.rows === '12', null, { timeout: 8000 });
  expect(await page.getAttribute('#st-total', 'data-cols') === '6', 'union has 5 data columns + source file column');
  await page.uncheck('#st-loose');
  await page.waitForFunction(() => Number(document.getElementById('st-total').dataset.cols) > 6, null, { timeout: 8000 });
  expect(await page.getAttribute('#st-total', 'data-rows') === '12', 'still 12 rows when names do not match exactly');
  await page.check('#st-loose');
  log('join + stack checks passed');
};
