/* Interaction test for stock-register (run by tools/verify.js in en and hi). */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, log }) {
  const SKU = 'TST-001';
  const rowInfo = () => page.evaluate((sku) => {
    const tr = [...document.querySelectorAll('#stock-body tr[data-id]')].find(r => r.querySelector('td.mono').textContent.trim() === sku);
    return tr ? { id: tr.dataset.id, status: tr.dataset.status, stock: parseFloat(tr.children[3].textContent.replace(/,/g, '')) } : null;
  }, SKU);
  const readDownload = async (sel) => {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click(sel)]);
    return fs.readFileSync(await dl.path(), 'utf8');
  };

  // sample data present on first load
  const n0 = await page.$$eval('#stock-body tr[data-id]', r => r.length);
  expect(n0 > 0, 'example items shown on first load, got ' + n0);

  // 1) add an item with min stock 5
  await page.click('#add-item');
  await page.fill('#fi-name', 'Test Notebook 200 pages');
  await page.fill('#fi-sku', SKU);
  await page.fill('#fi-cat', 'Stationery');
  await page.fill('#fi-buy', '30');
  await page.fill('#fi-sell', '40');
  await page.fill('#fi-min', '5');
  await page.click('#fi-save');
  await page.waitForTimeout(150);
  let info = await rowInfo();
  expect(info && info.stock === 0, 'new item listed with stock 0: ' + JSON.stringify(info));

  // 2) scanner find: text + Enter
  await page.fill('#scan', SKU);
  await page.press('#scan', 'Enter');
  await page.waitForTimeout(150);
  const shown = await page.$$eval('#stock-body tr[data-id]', r => r.length);
  expect(shown === 1, 'scanner find filters to the one item, got ' + shown);

  // 3) stock in 10, stock out 7
  info = await rowInfo();
  await page.click(`#stock-body tr[data-id="${info.id}"] button[data-act="in"]`);
  await page.fill('#mv-qty', '10');
  await page.click('#mv-save');
  await page.waitForTimeout(150);
  await page.click(`#stock-body tr[data-id="${info.id}"] button[data-act="out"]`);
  await page.fill('#mv-qty', '7');
  await page.click('#mv-save');
  await page.waitForTimeout(150);
  info = await rowInfo();
  expect(info.stock === 3, 'stock after in 10 / out 7 is 3, got ' + info.stock);
  expect(info.status === 'low', 'low-stock flag set (min 5), got ' + info.status);

  // 4) scanner in "stock out −1" mode
  await page.click('#scan-mode button[data-mode="out"]');
  await page.fill('#scan', SKU);
  await page.press('#scan', 'Enter');
  await page.waitForTimeout(150);
  info = await rowInfo();
  expect(info.stock === 2, 'scan in out-mode reduces stock to 2, got ' + info.stock);
  await page.click('#scan-mode button[data-mode="find"]');

  // 5) CSV export contains the item
  const csv = await readDownload('#export-items');
  expect(csv.includes(SKU) && csv.includes('Test Notebook 200 pages'), 'items CSV has the new item');

  // 6) backup -> reset -> restore equality
  await page.click('#tab-data');
  const b1 = JSON.parse(await readDownload('#backup-btn'));
  expect(b1.items.some(i => i.sku === SKU), 'backup contains the item');
  await page.click('#reset-btn');
  await page.waitForTimeout(150);
  await page.click('#tab-stock');
  const afterReset = await page.$$eval('#stock-body tr[data-id]', r => r.length);
  expect(afterReset === 0, 'reset clears all items, got ' + afterReset);
  await page.click('#tab-data');
  const tmp = require('path').join(require('os').tmpdir(), 'stock-register-test-backup.json');
  fs.writeFileSync(tmp, JSON.stringify(b1));
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#restore-btn')]);
  await fc.setFiles(tmp);
  await page.waitForTimeout(300);
  const b2 = JSON.parse(await readDownload('#backup-btn'));
  expect(JSON.stringify(b2.items) === JSON.stringify(b1.items), 'restored items equal the backup');
  expect(JSON.stringify(b2.entries) === JSON.stringify(b1.entries), 'restored movements equal the backup');
  await page.click('#tab-stock');
  await page.fill('#search', '');
  await page.waitForTimeout(200);
  info = await rowInfo();
  expect(info && info.stock === 2 && info.status === 'low', 'restored item stock 2 and low: ' + JSON.stringify(info));
  log('stock-register test ok (' + lang + ')');
};
