/* Interaction test for "Logic Gates Lab" (logic-gates).
   Run by tools/verify.js in en and hi with an empty localStorage. */
module.exports = async function ({ page, expect, log }) {
  const wait = (ms) => page.waitForTimeout(ms);
  const ledStates = (sel) => page.$$eval(sel + ' .led', (a) => a.map((g) => (g.getAttribute('class').includes(' on') ? 1 : 0)));
  const RULE = {
    AND: (x) => (x.every(Boolean) ? 1 : 0), OR: (x) => (x.some(Boolean) ? 1 : 0), NOT: (x) => (x[0] ? 0 : 1),
    NAND: (x) => (x.every(Boolean) ? 0 : 1), NOR: (x) => (x.some(Boolean) ? 0 : 1),
    XOR: (x) => x.reduce((s, v) => s + v, 0) % 2, XNOR: (x) => 1 - (x.reduce((s, v) => s + v, 0) % 2)
  };

  /* 1) gate explorer: AND with A=1, B=0 → lamp off; flip B → lamp on and row 11 is highlighted */
  await page.waitForSelector('#gx-svg svg .gate');
  expect((await ledStates('#gx-svg'))[0] === 0, 'AND(1,0) lamp should be off');
  await page.click('#gx-svg [data-sw="1"]');
  await wait(100);
  expect((await ledStates('#gx-svg'))[0] === 1, 'AND(1,1) lamp should be on');
  const curRow = await page.getAttribute('#gx-tt tr.cur', 'data-row');
  expect(curRow === '3', 'truth-table row 3 (A=1, B=1) should be highlighted, got ' + curRow);
  expect((await page.textContent('#gx-read')).includes('Y = 1'), 'live reading should say Y = 1');

  /* XOR(1,1) = 0, then 3-input XOR(1,1,1) = 1 (odd number of 1s) */
  await page.click('#g-xor');
  await wait(100);
  expect((await ledStates('#gx-svg'))[0] === 0, 'XOR(1,1) should be 0');
  await page.click('#nin-seg button[data-n="3"]');
  await page.click('#gx-svg [data-sw="2"]');
  await wait(100);
  expect((await ledStates('#gx-svg'))[0] === 1, 'XOR(1,1,1) should be 1');
  const ttRows = await page.$$eval('#gx-tt tbody tr', (a) => a.length);
  expect(ttRows === 8, '3-input truth table should have 8 rows, got ' + ttRows);

  /* 2) expression lab: (A + B)·C' → Y column 0 0 1 0 1 0 1 0, circuit with 3 gates */
  await page.click('#tab-expr');
  await page.fill('#expr-in', "(A + B)·C'");
  await wait(450);
  const ycol = (await page.$$eval('#x-tt tbody tr', (rows) => rows.map((r) => { const c = r.querySelectorAll('td.o'); return c[c.length - 1].textContent.trim(); }))).join('');
  log('Y column', ycol);
  expect(ycol === '00101010', "(A + B)·C' truth table should be 00101010, got " + ycol);
  const nGates = await page.$$eval('#x-circ svg .gate', (a) => a.length);
  expect(nGates === 3, 'circuit should have 3 gates (OR, NOT, AND), got ' + nGates);
  /* NOT-free keyword syntax and implicit AND give the same parse */
  await page.fill('#expr-in', 'NOT (A AND B)');
  await wait(450);
  const nand = (await page.$$eval('#x-tt tbody tr td.o', (a) => a.map((c) => c.textContent.trim()))).join('');
  expect(nand.endsWith('1110'), 'NOT (A AND B) should be 1110, got ' + nand);
  /* flipping an input in the circuit moves the highlighted row */
  await page.click('#x-circ [data-var="B"]');
  await wait(120);
  const xr = await page.getAttribute('#x-tt tr.cur', 'data-row');
  expect(xr === '3', 'after flipping B (A=1, B=1) row 3 should be highlighted, got ' + xr);
  /* a broken expression shows a friendly error, not a crash */
  await page.fill('#expr-in', 'A + )');
  await wait(450);
  expect(await page.isVisible('#x-msg'), 'error message should be visible for "A + )"');
  expect((await page.getAttribute('#x-msg', 'class')).includes('danger'), 'error should be styled as danger');
  await page.fill('#expr-in', "A·B + C'");
  await wait(450);

  /* 3) equivalence: De Morgan holds; the common mistake fails on exactly 2 rows */
  await page.click('#eq-laws [data-law="law_dm1"]');
  await wait(150);
  expect((await page.getAttribute('#eq-res', 'data-eq')) === 'yes', "De Morgan (A·B)' = A' + B' should be equivalent");
  await page.click('#eq-laws [data-law="law_mistake"]');
  await wait(150);
  expect((await page.getAttribute('#eq-res', 'data-eq')) === 'no', "(A + B)' vs A' + B' should not be equivalent");
  const diffs = await page.$$eval('#eq-tt tr.diff', (a) => a.length);
  expect(diffs === 2, 'the common mistake should differ in 2 rows, got ' + diffs);

  /* 4) adders: half adder 1 + 1 → S = 0, C = 1; full adder 1 + 0 + 1 → S = 0, Cout = 1; 9 + 7 = 16 */
  await page.click('#tab-adders');
  await wait(100);
  const ha = await ledStates('#ha-svg');
  expect(ha[0] === 0 && ha[1] === 1, 'half adder 1+1 should give S=0, C=1, got ' + ha);
  await page.click('#ha-svg [data-sw="b"]');
  await wait(100);
  const ha2 = await ledStates('#ha-svg');
  expect(ha2[0] === 1 && ha2[1] === 0, 'half adder 1+0 should give S=1, C=0, got ' + ha2);
  await page.click('#adder-seg button[data-m="full"]');
  await wait(100);
  const fa = await ledStates('#fa-svg');
  expect(fa[0] === 0 && fa[1] === 1, 'full adder 1+0+1 should give S=0, Cout=1, got ' + fa);
  await page.click('#adder-seg button[data-m="four"]');
  await wait(100);
  expect((await page.textContent('#four-total')).trim() === '= 16', '9 + 7 should be 16');
  await page.click('#four-grid button[data-k="b4"][data-i="0"]');  /* 7 → 6 */
  await wait(100);
  expect((await page.textContent('#four-total')).trim() === '= 15', '9 + 6 should be 15');

  /* 5) practice: answer a "complete the table" question correctly */
  await page.click('#tab-practice');
  await page.waitForSelector('#q-table');
  const gname = (await page.textContent('#q-box .q-name')).trim().split(/\s+/)[0];
  expect(RULE[gname], 'easy question should be a gate, got ' + gname);
  const rows = await page.$$eval('#q-table tbody tr', (rs) => rs.map((r) => [...r.querySelectorAll('td.in')].map((c) => +c.textContent)));
  for (let i = 0; i < rows.length; i++) {
    const want = RULE[gname](rows[i]);
    for (let k = 0; k <= want; k++) await page.click(`#q-table button[data-i="${i}"]`);  /* ? → 0 → 1 */
  }
  await page.click('#q-check');
  await wait(100);
  expect((await page.getAttribute('#q-fb', 'class')).includes('success'), gname + ' answers should be marked right');
  expect((await page.textContent('#sc-score')).includes('1 / 1'), 'score should be 1 / 1');

  /* "name the gate": identify it from its truth table */
  await page.click('#pmode-seg button[data-m="name"]');
  await page.waitForSelector('#q-box .name-opt');
  const outs = (await page.$$eval('#q-box td.o', (a) => a.map((c) => c.textContent.trim()))).join('');
  const MAP = { '0001': 'and', '0111': 'or', '1110': 'nand', '1000': 'nor', '0110': 'xor', '1001': 'xnor' };
  expect(MAP[outs], 'unexpected name-the-gate table ' + outs);
  await page.click(`#q-box .name-opt[data-g="${MAP[outs]}"]`);
  await wait(100);
  expect((await page.getAttribute('#q-fb', 'class')).includes('success'), 'picking the right gate should be marked right');
  expect((await page.textContent('#sc-score')).includes('2 / 2'), 'score should be 2 / 2');

  /* 6) state survives a reload */
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#sc-score');
  expect((await page.textContent('#sc-score')).includes('2 / 2'), 'score should persist after reload');
  expect((await page.getAttribute('#tab-practice', 'aria-selected')) === 'true', 'practice tab should be remembered');
  await page.click('#tab-expr');
  await wait(200);
  expect((await page.inputValue('#expr-in')) === "A·B + C'", 'expression should persist after reload');
};
