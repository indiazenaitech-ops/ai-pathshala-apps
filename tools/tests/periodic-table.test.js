/* Interaction test for Periodic Table Explorer (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, t, log }) {
  const sym = async () => (await page.textContent('#d-sym')).trim();

  // 1) all 118 tiles render, sodium is the default selection with a correct Bohr model
  const n = await page.$$eval('#pt-grid .pt-tile', a => a.length);
  expect(n === 118, 'expected 118 element tiles, got ' + n);
  expect(await sym() === 'Na', 'default selected element should be Na, got ' + await sym());
  const shells = (await page.textContent('#d-shells')).trim();
  expect(shells === '2, 8, 1', 'sodium shells should be "2, 8, 1", got ' + shells);
  const electrons = await page.$$eval('#bohr .bohr-e', a => a.length);
  expect(electrons === 11, 'Bohr model of Na should show 11 electrons, got ' + electrons);
  const rings = await page.$$eval('#bohr .bohr-ring', a => a.length);
  expect(rings === 3, 'Bohr model of Na should have 3 shells (K, L, M), got ' + rings);
  const wantName = await page.evaluate(() => ((window.PT_NAMES || {})[EDU.lang] || [])[10] || 'Sodium');
  const name = (await page.textContent('#d-name')).trim();
  expect(name === wantName, `name in ${lang} should be "${wantName}", got "${name}"`);

  // 2) search by atomic number selects iron, valency 2, 3 (kept left-to-right for Urdu)
  await page.fill('#pt-search', '26');
  await page.waitForTimeout(150);
  expect(await sym() === 'Fe', 'searching 26 should select Fe');
  const val = (await page.textContent('#d-valency')).trim();
  expect(val === '2, 3', 'iron valency should be "2, 3", got ' + val);
  expect(await page.$('#d-valency .ltr') !== null, 'valency list should be an LTR isolate (Urdu shows it reversed otherwise)');
  const dimmed = await page.$$eval('#pt-grid .pt-tile.dim', a => a.length);
  expect(dimmed === 117, 'search should dim the other 117 tiles, got ' + dimmed);
  // search by symbol, case-insensitive
  await page.fill('#pt-search', 'cl');
  await page.waitForTimeout(150);
  expect(await sym() === 'Cl', 'searching "cl" should select chlorine');
  // spelling variants and traditional names: तांबा (anusvara) = ताँबा, गंधक = sulphur, ज़िंक/जिंक
  for (const [q, want] of [['तांबा', 'Cu'], ['गंधक', 'S'], ['ज़िंक', 'Zn'], ['கந்தகம்', 'S'], ['sulfur', 'S'], ['ferrum', 'Fe']]) {
    await page.fill('#pt-search', q);
    await page.waitForTimeout(100);
    expect(await sym() === want, `searching "${q}" should select ${want}, got ${await sym()}`);
  }
  // nonsense, huge and negative input never crash and show the "no match" message
  for (const q of ['999999', '-5', '0', 'xyzzy']) {
    await page.fill('#pt-search', q);
    await page.waitForTimeout(80);
    const st = (await page.textContent('#pt-status')).trim();
    expect(st === t('no_match'), `searching "${q}" should say no match, got "${st}"`);
    expect(await page.$$eval('#pt-grid .pt-tile.dim', a => a.length) === 118, `"${q}" should dim every tile`);
  }
  // Enter jumps to the first of several matches
  await page.fill('#pt-search', 'ium');
  await page.press('#pt-search', 'Enter');
  expect(await sym() === 'He', 'Enter on "ium" should select the first match, helium');
  await page.fill('#pt-search', '');
  await page.waitForTimeout(100);
  expect((await page.textContent('#pt-status')).trim() === '', 'clearing the search clears the status');

  // 3) clicking a tile + keyboard navigation
  await page.click('.pt-tile[data-z="6"]');
  expect(await sym() === 'C', 'clicking tile 6 should select carbon');
  await page.keyboard.press('ArrowDown');
  expect(await sym() === 'Si', 'ArrowDown from C should go to Si');
  await page.keyboard.press('End');
  expect(await sym() === 'Og', 'End should go to Og');
  expect(await page.$('#bohr') === null, 'no Bohr diagram beyond Z = 20');
  await page.keyboard.press('Home');
  expect(await sym() === 'H', 'Home should go to H');
  expect(await page.$eval('#d-prev', b => b.disabled), 'Previous is disabled at hydrogen');

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
  await page.click('#pt-colour button[data-v="state"]');
  await page.click('#pt-legend .chip[data-k="liquid"]');
  const liquids = await page.$$eval('#pt-grid .pt-tile:not(.dim)', a => a.map(x => +x.dataset.z).join(','));
  expect(liquids === '35,80', 'liquids at room temperature should be Br and Hg, got ' + liquids);
  await page.click('#pt-legend .chip[data-k="liquid"]');
  await page.click('#pt-colour button[data-v="family"]');

  // 5) print modes: the wall chart hides the worksheet and vice versa
  await page.evaluate(() => { window.__print = window.print; window.print = () => { }; });
  await page.click('#pt-print');
  await page.waitForTimeout(80);
  await page.emulateMedia({ media: 'print' });
  expect(await page.isVisible('#pt-grid') && !(await page.isVisible('#ws')), 'Print table shows the grid, not the worksheet');
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));

  // 6) quiz: valency mode, one right answer, one wrong answer, then finish the round from the keyboard
  await page.click('#tab-quiz');
  await page.click('#qm-valency');
  const rightOf = z => page.evaluate(z => PT_DATA.byZ[z].valency[0], z);
  let z = +(await page.getAttribute('#q-text', 'data-z'));
  let right = await rightOf(z);
  await page.click(`#q-options button[data-v="${right}"]`);
  let score = (await page.textContent('#q-score')).trim();
  expect(score === '1 / 1', 'score after a correct answer should be "1 / 1", got ' + score);
  const fb = (await page.textContent('#q-feedback')).trim();
  expect(fb.length > 10, 'valency answer should be explained');
  await page.click('#q-next');
  z = +(await page.getAttribute('#q-text', 'data-z'));
  right = await rightOf(z);
  const wrong = right === 0 ? 1 : 0;
  await page.click(`#q-options button[data-v="${wrong}"]`);
  score = (await page.textContent('#q-score')).trim();
  expect(score === '1 / 2', 'score after a wrong answer should be "1 / 2", got ' + score);
  const marked = await page.$$eval('#q-options .ok', a => a.length);
  expect(marked === 1, 'the right option should be marked after a wrong answer');
  const fbWrong = (await page.textContent('#q-feedback')).trim();
  expect(fbWrong.startsWith(t('wrong') + ':'), 'the "wrong" label must not run into the explanation: ' + fbWrong);
  // keys 1–5 answer, Enter moves on: answer the remaining 8 correctly
  await page.keyboard.press('Enter');
  for (let i = 3; i <= 10; i++) {
    z = +(await page.getAttribute('#q-text', 'data-z'));
    right = await rightOf(z);
    await page.keyboard.press(String(right + 1));   // options are 0..4 in order
    await page.keyboard.press('Enter');
  }
  expect(await page.isVisible('#q-end'), 'round should end after 10 questions');
  const endScore = (await page.textContent('#q-end-score')).trim();
  expect(endScore === '9 / 10', 'end score should be 9 / 10, got ' + endScore);
  const best = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.periodic-table.best') || '{}').valency);
  expect(best === 9, 'best valency score 9 should be saved, got ' + best);
  // play again, answer one, then Reset in the middle of a valency round (used to crash)
  await page.click('#q-again');
  expect((await page.textContent('#q-score')).trim() === '0 / 0', 'Play again resets the score');
  await page.keyboard.press('1');
  await page.click('#reset');   // verify.js accepts the confirm() dialog
  await page.waitForTimeout(100);
  expect(await page.getAttribute('#qm-sym2name', 'aria-pressed') === 'true', 'Reset returns to symbol → name');
  const nOpts = await page.$$eval('#q-options button', a => a.length);
  expect(nOpts === 4, 'symbol → name should offer 4 options after Reset, got ' + nOpts);
  expect((await page.textContent('#q-score')).trim() === '0 / 0', 'Reset starts a new round');
  expect((await page.textContent('#q-best')).trim() === '', 'Reset clears the best scores');
  // name → symbol answer is checked against the element asked about
  await page.click('#qm-name2sym');
  z = +(await page.getAttribute('#q-text', 'data-z'));
  await page.click(`#q-options button[data-v="${z}"]`);
  expect((await page.textContent('#q-score')).trim() === '1 / 1', 'name → symbol right answer scores');

  // 7) Class 9–10 corner: first-20 table, triads computed from the data, opening an element
  await page.click('#tab-cbse');
  const rows = await page.$$eval('#first20 tbody tr', a => a.length);
  expect(rows === 20, 'first-20 table should have 20 rows, got ' + rows);
  const sRow = await page.$$eval('#first20 tbody tr:nth-child(16) td', a => a.map(x => x.textContent.trim()));
  expect(sRow[4] === '2' && sRow[5] === '8' && sRow[6] === '6' && sRow[9] === '2, 4, 6', 'sulphur row should be K2 L8 M6, valency 2, 4, 6: ' + sRow.join('|'));
  const triad = (await page.textContent('#triads tbody tr:first-child td:nth-child(2)')).trim();
  expect(triad === '(6.94 + 39.098) ÷ 2 = 23.02', 'Li/Na/K triad average should be 23.02, got ' + triad);
  const mendRows = await page.$$eval('#mend tbody tr', a => a.length);
  expect(mendRows >= 6, 'Mendeleev comparison should have rows');
  await page.click('#first20 tbody tr:nth-child(17) .linkbtn');
  expect(await sym() === 'Cl', 'row 17 should open chlorine in the table');
  expect(await page.isVisible('#p-table'), 'table tab should be visible again');
  const wsRows = await page.$$eval('#ws .ws-key tbody tr', a => a.length);
  expect(wsRows === 20, 'worksheet answer key should have 20 rows');

  // 8) state survives a reload: selected element and tab
  await page.reload();
  await page.waitForTimeout(400);
  expect(await sym() === 'Cl', 'selected element should survive a reload');
  expect(await page.isVisible('#p-table'), 'table tab should survive a reload');
  log('selected after corner click + reload: Cl');
};
