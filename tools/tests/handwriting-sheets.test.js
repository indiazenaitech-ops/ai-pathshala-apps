/* Interaction test for Handwriting Practice Sheets (runs in en and hi). */
module.exports = async function ({ page, expect, log }) {
  const items = () => page.$$eval('#pages .hw-item', els => [...new Set(els.map(e => e.getAttribute('data-i')))].length);
  const pages = async () => parseInt(await page.getAttribute('#pages', 'data-pages'), 10);

  /* 1. Hindi vowels: one row per vowel, each with the chosen number of trace copies */
  await page.selectOption('#sheet-lang', 'hi');
  await page.click('.seg[data-opt="type"] button[data-v="letters"]');
  await page.click('#groups button[data-group="vowels"]');
  await page.selectOption('#copies', '3');
  await page.selectOption('#rpp', 'auto');
  await page.waitForTimeout(250);
  const want = await page.evaluate(() => window.HW_DATA.langs.hi.groups[0].items.split(' ').length);
  const n = await items();
  expect(n === want, `Hindi vowels: expected ${want} rows, got ${n}`);
  const traces = await page.$$eval('#pages .hw-item', els => {
    const by = {}; els.forEach(e => { const i = e.getAttribute('data-i'); by[i] = (by[i] || 0) + e.querySelectorAll('.hw-trace').length; });
    return Object.values(by);
  });
  expect(traces.length === want && traces.every(c => c === 3), 'each vowel row has 3 tracing copies, got ' + JSON.stringify(traces));
  const models = await page.$$eval('#pages .hw-model text', els => els.map(e => e.textContent));
  expect(models[0] === 'अ' && models.includes('औ'), 'model letters are the Hindi vowels: ' + models.slice(0, 3).join(' '));

  /* 2. Custom English text with 3 words -> 3 rows, drawn with the school-print strokes */
  await page.selectOption('#sheet-lang', 'en');
  await page.click('.seg[data-opt="type"] button[data-v="custom"]');
  await page.fill('#custom', 'apple mango kiwi');
  await page.waitForTimeout(250);
  const n2 = await items();
  expect(n2 === 3, 'custom text with 3 words makes 3 rows, got ' + n2);
  const paths = await page.$$eval('#pages .hw-model path', els => els.length);
  expect(paths > 10, 'English words are drawn as school-print strokes (' + paths + ' paths)');

  /* 3. More rows per page = fewer pages; fewer rows = more pages */
  await page.selectOption('#blanks', '2');
  await page.selectOption('#rpp', 'auto');
  await page.waitForTimeout(200);
  const pAuto = await pages();
  await page.selectOption('#rpp', '3');
  await page.waitForTimeout(200);
  const p3 = await pages();
  expect(p3 > pAuto, `rows per page 3 gives more pages (${p3}) than "as many as fit" (${pAuto})`);
  const status = await page.textContent('#status');
  expect(status.includes(String(p3)), 'status shows the page count: ' + status);

  /* 4. Settings survive a reload */
  await page.waitForTimeout(150);
  await page.reload();
  await page.waitForSelector('#pages .hw-page');
  await page.waitForTimeout(300);
  expect(await page.inputValue('#sheet-lang') === 'en', 'sheet language kept after reload');
  expect(await page.inputValue('#custom') === 'apple mango kiwi', 'custom text kept after reload');
  expect(await page.inputValue('#rpp') === '3', 'rows per page kept after reload');
  expect(await pages() === p3, 'same page count after reload');
  log && log('pages auto=' + pAuto + ' rpp3=' + p3);
};
