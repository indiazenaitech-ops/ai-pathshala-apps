/* Interaction test for Periodic Table Explorer (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, log }) {
  // 1) all 118 tiles render, sodium is the default selection with a correct Bohr model
  const n = await page.$$eval('#pt-grid .pt-tile', a => a.length);
  expect(n === 118, 'expected 118 element tiles, got ' + n);
  const sym0 = (await page.textContent('#d-sym')).trim();
  expect(sym0 === 'Na', 'default selected element should be Na, got ' + sym0);
  const shells = (await page.textContent('#d-shells')).trim();
  expect(shells === '2, 8, 1', 'sodium shells should be "2, 8, 1", got ' + shells);
  const electrons = await page.$$eval('#bohr .bohr-e', a => a.length);
  expect(electrons === 11, 'Bohr model of Na should show 11 electrons, got ' + electrons);
  const wantName = await page.evaluate(() => ((window.PT_NAMES || {})[EDU.lang] || [])[10] || 'Sodium');
  const name = (await page.textContent('#d-name')).trim();
  expect(name === wantName, `name in ${lang} should be "${wantName}", got "${name}"`);

  // 2) search by atomic number selects iron, valency 2, 3
  await page.fill('#pt-search', '26');
  await page.waitForTimeout(150);
  expect((await page.textContent('#d-sym')).trim() === 'Fe', 'searching 26 should select Fe');
  const val = (await page.textContent('#d-valency')).trim();
  expect(/2/.test(val) && /3/.test(val), 'iron valency should list 2 and 3, got ' + val);
  const dimmed = await page.$$eval('#pt-grid .pt-tile.dim', a => a.length);
  expect(dimmed === 117, 'search should dim the other 117 tiles, got ' + dimmed);
  // search by symbol, case-insensitive
  await page.fill('#pt-search', 'cl');
  await page.waitForTimeout(150);
  expect((await page.textContent('#d-sym')).trim() === 'Cl', 'searching "cl" should select chlorine');
  await page.fill('#pt-search', '');
  await page.waitForTimeout(100);

  // 3) clicking a tile + keyboard navigation
  await page.click('.pt-tile[data-z="6"]');
  expect((await page.textContent('#d-sym')).trim() === 'C', 'clicking tile 6 should select carbon');
  await page.keyboard.press('ArrowDown');
  expect((await page.textContent('#d-sym')).trim() === 'Si', 'ArrowDown from C should go to Si');

  // 4) highlight filter: exactly the 7 metalloids stay lit
  await page.selectOption('#pt-hl', 'metalloid');
  const lit = await page.$$eval('#pt-grid .pt-tile:not(.dim)', a => a.map(x => +x.dataset.z).sort((p, q) => p - q));
  expect(JSON.stringify(lit) === JSON.stringify([5, 14, 32, 33, 51, 52, 84]), 'metalloids lit: ' + lit.join(','));
  await page.selectOption('#pt-hl', '');
  // colour by block: legend shows 4 entries, clicking "p" lights 36 p-block elements
  await page.click('#pt-colour button[data-v="block"]');
  const legendN = await page.$$eval('#pt-legend .chip', a => a.length);
  expect(legendN === 4, 'block legend should have 4 chips, got ' + legendN);
  await page.click('#pt-legend .chip[data-k="p"]');
  const pLit = await page.$$eval('#pt-grid .pt-tile:not(.dim)', a => a.length);
  expect(pLit === 36, 'p-block should have 36 elements, got ' + pLit);
  await page.click('#pt-legend .chip[data-k="p"]');
  await page.click('#pt-colour button[data-v="family"]');

  // 5) quiz: valency mode, one right answer then one wrong answer
  await page.click('#tab-quiz');
  await page.click('#qm-valency');
  let z = +(await page.getAttribute('#q-text', 'data-z'));
  let right = await page.evaluate(z => PT_DATA.byZ[z].valency[0], z);
  await page.click(`#q-options button[data-v="${right}"]`);
  let score = (await page.textContent('#q-score')).trim();
  expect(score === '1 / 1', 'score after a correct answer should be "1 / 1", got ' + score);
  const fb = (await page.textContent('#q-feedback')).trim();
  expect(fb.length > 10, 'valency answer should be explained');
  await page.click('#q-next');
  z = +(await page.getAttribute('#q-text', 'data-z'));
  right = await page.evaluate(z => PT_DATA.byZ[z].valency[0], z);
  const wrong = right === 0 ? 1 : 0;
  await page.click(`#q-options button[data-v="${wrong}"]`);
  score = (await page.textContent('#q-score')).trim();
  expect(score === '1 / 2', 'score after a wrong answer should be "1 / 2", got ' + score);
  const marked = await page.$$eval('#q-options .ok', a => a.length);
  expect(marked === 1, 'the right option should be marked after a wrong answer');
  // symbol → name mode starts a fresh round with 4 options
  await page.click('#qm-sym2name');
  const nOpts = await page.$$eval('#q-options button', a => a.length);
  expect(nOpts === 4, 'symbol → name should offer 4 options, got ' + nOpts);
  expect((await page.textContent('#q-score')).trim() === '0 / 0', 'new round resets the score');

  // 6) Class 9–10 corner: first-20 table and opening an element from it
  await page.click('#tab-cbse');
  const rows = await page.$$eval('#first20 tbody tr', a => a.length);
  expect(rows === 20, 'first-20 table should have 20 rows, got ' + rows);
  const mendRows = await page.$$eval('#mend tbody tr', a => a.length);
  expect(mendRows >= 6, 'Mendeleev comparison should have rows');
  await page.click('#first20 tbody tr:nth-child(17) .linkbtn');
  expect((await page.textContent('#d-sym')).trim() === 'Cl', 'row 17 should open chlorine in the table');
  expect(await page.isVisible('#p-table'), 'table tab should be visible again');
  log('selected after corner click: Cl');
};
