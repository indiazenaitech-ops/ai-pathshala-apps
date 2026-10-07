/* Interaction test for JSON ↔ CSV Converter (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, log }) {
  const heads = () => page.$$eval('#grid thead th', (t) => t.map((x) => x.textContent));
  const rowCount = () => page.$$eval('#grid tbody tr', (t) => t.length);
  await page.waitForSelector('#grid tbody tr');

  // 1) nested sample (API response with 3 orders) flattens to dot-path columns
  const h = await heads();
  expect(h.includes('customer.address.city') && h.includes('customer.name') && h.includes('delivery.slot'), 'flattened columns: ' + h.join(' | '));
  expect(await rowCount() === 3, '3 orders → 3 rows');
  const tags = await page.$$eval('#grid tbody tr:first-child td', (t) => t.map((x) => x.textContent));
  expect(tags.includes('new; upi'), 'simple list joined as "new; upi"');
  // explode lists of objects: 2 + 1 + 3 items = 6 rows with items.name / items.qty columns
  await page.selectOption('#arr-mode', 'explode');
  await page.waitForFunction(() => document.querySelectorAll('#grid tbody tr').length === 6, null, { timeout: 6000 });
  const h2 = await heads();
  expect(h2.includes('items.name') && h2.includes('items.qty') && !h2.includes('items'), 'exploded item columns');
  await page.selectOption('#arr-mode', 'join');
  // schema: items[].qty is a number, customer.address.pin is filled in 2 of 3 records (67%)
  await page.click('#out-tabs button[data-tab="schema"]');
  const sc = await page.$$eval('#schema-body tr', (trs) => trs.map((tr) => [tr.querySelector('th').textContent, tr.querySelectorAll('td')[1].textContent]));
  const pin = sc.find((r) => r[0] === 'customer.address.pin');
  expect(pin && /67/.test(pin[1]), 'pin present in 67% of records: ' + JSON.stringify(pin));
  expect(sc.some((r) => r[0] === 'items[].qty'), 'schema lists items[].qty');

  // 2) JSON Lines input
  await page.fill('#input', '{"id": 1, "city": "Pune"}\n{"id": 2, "city": "Agra", "extra": true}\n');
  await page.click('#out-tabs button[data-tab="table"]');
  await page.waitForFunction(() => document.querySelectorAll('#grid tbody tr').length === 2 && document.querySelectorAll('#grid thead th').length === 4, null, { timeout: 6000 });

  // 3) CSV → JSON: numbers and true/false typed, empty → null, "09876543210" kept as text, address.city nested
  await page.click('#mode-tabs button[data-mode="c2j"]');
  await page.waitForFunction(() => { try { return JSON.parse(document.getElementById('output').value).length === 6; } catch (e) { return false; } }, null, { timeout: 6000 });
  const H = await page.evaluate((l) => window.APP_CONTENT[l].contacts.headers, lang);
  const objs = JSON.parse(await page.inputValue('#output'));
  const addr = H[3].split('.');
  expect(objs[0][H[2]] === 34 && typeof objs[1][H[2]] === 'number', 'age typed as a number');
  expect(objs[0][H[1]] === '09876543210', 'phone with a leading 0 stays text');
  expect(objs[0][H[5]] === true && objs[1][H[5]] === false && objs[3][H[2]] === null, 'true/false typed, empty age → null');
  expect(objs[0][addr[0]] && typeof objs[0][addr[0]][addr[1]] === 'string', 'address.city nested into an object');
  await page.check('#opt-text');
  await page.waitForFunction((k) => JSON.parse(document.getElementById('output').value)[0][k] === '34', H[2], { timeout: 6000 });
  await page.uncheck('#opt-text');

  // 4) invalid JSON: error with line and column
  await page.click('#mode-tabs button[data-mode="fmt"]');
  await page.fill('#input', '{"a": 1,, "b": 2}');
  await page.waitForSelector('#json-error:not([hidden])');
  expect(await page.getAttribute('#json-error', 'data-line') === '1' && await page.getAttribute('#json-error', 'data-col') === '9', 'double comma at line 1, column 9');
  await page.fill('#input', '{\n  "name": "Asha",\n  "age": 12\n  "city": "Pune"\n}');
  await page.waitForFunction(() => document.getElementById('json-error').dataset.line === '4', null, { timeout: 6000 });
  expect(await page.getAttribute('#json-error', 'data-col') === '3', 'missing comma reported at line 4, column 3');
  await page.fill('#input', '{\n  "name": "Asha",\n  "age": 12,\n  "city": "Pune"\n}');
  await page.waitForSelector('#json-error', { state: 'hidden' });
  await page.click('#btn-min');
  expect(await page.inputValue('#output') === '{"name":"Asha","age":12,"city":"Pune"}', 'minified output');
  log('converter checks passed');
};
