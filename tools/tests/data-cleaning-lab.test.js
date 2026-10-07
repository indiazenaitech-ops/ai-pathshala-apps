/* Interaction test for Data Cleaning Lab (run by tools/verify.js in en and hi). */
const fs = require('fs');
module.exports = async function ({ page, lang, expect, log }) {
  await page.waitForSelector('#grid tbody tr');
  const H = await page.evaluate((l) => window.APP_CONTENT[l].headers, lang);
  const rows = async () => Number(await page.getAttribute('#out-count', 'data-rows'));
  const waitRows = (n) => page.waitForFunction((x) => document.querySelector('#out-count').dataset.rows === String(x), n, { timeout: 8000 });
  const cell = (r, c) => page.textContent(`#grid tbody tr:nth-child(${r + 1}) td[data-c="${c}"]`);
  const addStep = async (type, fill) => {
    await page.selectOption('#step-type', type);
    if (fill) await fill();
    const n = await page.$$eval('#recipe li', (l) => l.length);
    await page.click('#step-add');
    await page.waitForFunction((k) => document.querySelectorAll('#recipe li').length === k, n + 1, { timeout: 8000 });
  };
  const download = async (sel) => {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click(sel)]);
    return dl.path();
  };

  // 1) the messy sample: 22 rows, 3 exact copies + 1 copy with other spaces/capitals
  expect(await rows() === 22, 'sample has 22 rows, got ' + await rows());
  const before = Number(await page.getAttribute('#score-before', 'data-value'));

  // exact duplicates only: 3 rows go
  await addStep('dedupe', async () => { await page.uncheck('#f-loose'); });
  await waitRows(19);
  // undo, then the default (ignore spaces and capitals): 4 rows go
  await page.click('#undo');
  await waitRows(22);
  await addStep('dedupe');
  await waitRows(18);
  expect(/4/.test(await page.textContent('#recipe li:nth-child(1) .dc-res')), 'dedupe step reports 4 rows removed');

  // 2) mobile numbers: "+91 98765 43210" → "9876543210", "09812345678" → "9812345678"
  expect((await cell(0, 2)).trim() === '+91 98765 43210', 'first mobile is raw before the step');
  await addStep('phone', async () => { await page.selectOption('#f-col', H[2]); });
  expect(await cell(0, 2) === '9876543210', '+91 98765 43210 → 9876543210, got ' + await cell(0, 2));
  expect(await cell(1, 2) === '9812345678', '09812345678 → 9812345678, got ' + await cell(1, 2));
  expect(await page.getAttribute('#grid tbody tr:nth-child(1) td[data-c="2"]', 'class') === 'chg', 'changed cell is highlighted');

  // 3) dates: 5/3/2026 (D/M/Y) → 05-03-2026; "12 Jan 2026" → 12-01-2026; 31/02/2026 cannot be read
  await addStep('date', async () => { await page.selectOption('#f-col', H[4]); await page.selectOption('#f-from', 'dmy'); await page.selectOption('#f-to', 'dmy'); });
  expect(await cell(0, 4) === '05-03-2026', '5/3/2026 → 05-03-2026, got ' + await cell(0, 4));
  expect(await cell(2, 4) === '12-01-2026', '12 Jan 2026 → 12-01-2026, got ' + await cell(2, 4));
  expect(/1/.test(await page.textContent('#recipe li:nth-child(3) .dc-res.warning')), 'one date (31/02/2026) is flagged');

  // 4) money: ₹1,20,000 and 1.2 lakh → 120000; (500) → -500
  await addStep('money', async () => { await page.selectOption('#f-col', H[5]); });
  expect(await cell(0, 5) === '120000' && await cell(1, 5) === '120000', '₹1,20,000 and 1.2 lakh → 120000');
  const after = Number(await page.getAttribute('#score-after', 'data-value'));
  expect(after > before, `quality score goes up (${before} → ${after})`);
  log('score', before, '→', after);

  // 5) export the clean CSV and the recipe, clear the steps, import the recipe → identical output
  const csv1 = fs.readFileSync(await download('#download'), 'utf8');
  const recipePath = await download('#export-recipe');
  const recipe = JSON.parse(fs.readFileSync(recipePath, 'utf8'));
  expect(recipe.recipe === 'data-cleaning-lab' && recipe.steps.length === 4, 'recipe file has 4 steps');
  await page.click('#clear-steps');
  await waitRows(22);
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#import-recipe')]);
  await fc.setFiles(recipePath);
  await waitRows(18);
  const csv2 = fs.readFileSync(await download('#download'), 'utf8');
  expect(csv1 === csv2 && csv1.length > 500, 'replaying the exported recipe on the original sample gives the same CSV');
  expect(csv1.split('\n')[1].indexOf('9876543210') > 0, 'clean CSV has the 10-digit mobile number');

  // 6) the recipe survives a reload
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#grid tbody tr');
  expect(await page.$$eval('#recipe li', (l) => l.length) === 4 && await rows() === 18, 'recipe and result remembered after reload');

  // 7) Suggest steps on a fresh sample adds more steps and improves the score further
  await page.click('#suggest');
  await page.waitForFunction(() => document.querySelectorAll('#recipe li').length > 4, null, { timeout: 8000 });
  const after2 = Number(await page.getAttribute('#score-after', 'data-value'));
  expect(after2 >= after, 'suggested steps do not lower the score');
};
