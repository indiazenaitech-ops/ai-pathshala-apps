/* Interaction test for Percentage & Marks Calculator (run by tools/verify.js in en and hi).
   Checks exact answers for each calculator, the remembered tab and Reset.
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/[⁦-⁩]/g, '').trim();
  const num = (s) => Number(String(s).replace(/[^\d.\-−]/g, '').replace('−', '-'));
  const settle = () => page.waitForTimeout(120);
  const fill = async (sel, v) => { await page.fill(sel, String(v)); await settle(); };
  const click = async (sel) => { await page.click(sel); await settle(); };

  /* ---------- 1. percent basics ---------- */
  await click('#tab-basic');
  await click('#m-of');
  await fill('#b-of-x', '15'); await fill('#b-of-y', '640');
  expect(num(await txt('#out-basic')) === 96, '15% of 640 = 96, got ' + await txt('#out-basic'));
  expect((await txt('#work-basic')).includes('9,600') || (await txt('#work-basic')).includes('9600'), 'working shows 15 × 640 = 9600 over 100');

  await click('#m-what');
  await fill('#b-wh-x', '48'); await fill('#b-wh-y', '160');
  expect(num(await txt('#out-basic')) === 30, '48 is 30% of 160, got ' + await txt('#out-basic'));
  await fill('#b-wh-y', '0');
  expect((await txt('#err-basic')).length > 0, 'dividing by 0 shows an error, not a crash');
  await fill('#b-wh-y', '160');

  await click('#m-change');
  await fill('#b-ch-a', '400'); await fill('#b-ch-b', '500');
  expect(num(await txt('#out-basic')) === 25, '400 -> 500 is +25%, got ' + await txt('#out-basic'));

  await click('#m-addsub'); await click('#as-add');
  await fill('#b-as-y', '1000'); await fill('#b-as-x', '18');
  expect(num(await txt('#out-basic')) === 1180, '1000 + 18% = 1180, got ' + await txt('#out-basic'));

  await click('#m-reverse'); await click('#rv-down');
  await fill('#b-rv-x', '20'); await fill('#b-rv-v', '800');
  expect(num(await txt('#out-basic')) === 1000, 'after 20% off costs 800 -> original 1000, got ' + await txt('#out-basic'));

  /* ---------- 2. marks ---------- */
  await click('#tab-marks');
  const rows = await page.$$('#mk-rows .pc-row');
  expect(rows.length === 6, 'six sample subjects, got ' + rows.length);
  expect(num(await txt('#out-marks')) === 85.33, 'sample total 512/600 = 85.33%, got ' + await txt('#out-marks'));
  await page.check('#mk-best5'); await settle();
  expect(num(await txt('#out-marks')) === 87.6, 'best of 5 drops 74 -> 438/500 = 87.6%, got ' + await txt('#out-marks'));
  await page.uncheck('#mk-best5'); await settle();
  await fill('#mk-target', '85'); await fill('#mk-rem', '100');
  expect((await txt('#mk-need')).startsWith('83'), 'marks needed for 85% with 100 more marks = 83, got ' + await txt('#mk-need'));
  await click('#mk-add');
  expect((await page.$$('#mk-rows .pc-row')).length === 7, 'Add subject adds a row');
  await fill('#marks-m-6', '120');
  expect((await txt('#err-marks')).length > 0, 'marks above "out of" are flagged');
  await click('#marks-del-6');
  expect((await page.$$('#mk-rows .pc-row')).length === 6, 'row deleted');

  /* ---------- 3. CGPA ---------- */
  await click('#tab-cgpa');
  await click('#m-c2p'); await click('#meth-cbse');
  await fill('#cg-g', '8.4');
  expect(num(await txt('#out-cgpa')) === 79.8, 'CGPA 8.4 x 9.5 = 79.8%, got ' + await txt('#out-cgpa'));
  await click('#meth-custom');
  await fill('#cg-a', '0.5'); await fill('#cg-m', '10'); await fill('#cg-b', '0');
  expect(num(await txt('#out-cgpa')) === 79, 'custom (8.4 - 0.5) x 10 = 79%, got ' + await txt('#out-cgpa'));
  await click('#meth-cbse');
  await click('#m-p2c'); await fill('#cg-p', '85.5');
  expect(num(await txt('#out-cgpa')) === 9, '85.5% / 9.5 = CGPA 9, got ' + await txt('#out-cgpa'));
  await click('#m-sgpa');
  expect(num(await txt('#out-cgpa')) === 8.47, 'sample SGPA 127/15 = 8.47, got ' + await txt('#out-cgpa'));
  await click('#m-sem');
  expect(num(await txt('#out-cgpa')) === 8.39, 'weighted CGPA of sample semesters = 8.39, got ' + await txt('#out-cgpa'));

  /* ---------- 4. shopping ---------- */
  await click('#tab-shop');
  await click('#m-stack');
  await fill('#ss-p', '1000'); await fill('#ss-1', '50'); await fill('#ss-2', '20'); await fill('#ss-3', '');
  expect(num(await txt('#out-shop')) === 60, '50% + 20% stacked = 60% real discount, got ' + await txt('#out-shop'));
  await click('#m-bogo');
  await click('[data-offer="2,1,100"]');
  expect(num(await txt('#out-shop')) === 33.33, 'buy 2 get 1 = 33.33% off, got ' + await txt('#out-shop'));
  await click('#m-disc'); await click('#ds-pct');
  await fill('#sd-p', '2499'); await fill('#sd-d', '30');
  expect(num(await txt('#out-shop')) === 1749.3, '2499 with 30% off = 1749.30, got ' + await txt('#out-shop'));
  await click('#m-unit');
  await fill('#su-p-0', '60'); await fill('#su-q-0', '500'); await page.selectOption('#su-u-0', 'g'); await settle();
  await fill('#su-p-1', '110'); await fill('#su-q-1', '1'); await page.selectOption('#su-u-1', 'kg'); await settle();
  await fill('#su-p-2', ''); await fill('#su-q-2', '');
  expect(num(await txt('#out-shop')) === 110, '500 g for 60 (=120/kg) vs 1 kg for 110 -> best 110 per kg, got ' + await txt('#out-shop'));

  /* ---------- 5. profit & loss ---------- */
  await click('#tab-pl');
  await click('#m-pl');
  await fill('#pl-cp', '800'); await fill('#pl-sp', '1000');
  expect(num(await txt('#out-pl')) === 25, 'CP 800 SP 1000 = 25% profit, got ' + await txt('#out-pl'));
  await click('#m-target'); await click('#tg-margin');
  await fill('#pt-cp', '80'); await fill('#pt-p', '20');
  expect(num(await txt('#out-pl')) === 100, '20% margin on cost 80 -> SP 100, got ' + await txt('#out-pl'));

  /* ---------- 6. attendance ---------- */
  await click('#tab-att');
  await fill('#at-a', '30'); await fill('#at-h', '45'); await fill('#at-t', '75'); await fill('#at-l', '');
  expect(num(await txt('#att-need')) === 15, '30/45 needs 15 classes in a row for 75%, got ' + await txt('#att-need'));
  await fill('#at-a', '40'); await fill('#at-h', '50');
  expect(num(await txt('#att-miss')) === 3, '40/50 can miss 3 and stay at 75% or more, got ' + await txt('#att-miss'));
  await fill('#at-a', '60');
  expect((await txt('#err-att')).length > 0, 'attended > held is flagged');
  await fill('#at-a', '30'); await fill('#at-h', '45');

  /* ---------- remembered tab + reset ---------- */
  await page.waitForTimeout(400);
  await page.reload(); await page.waitForTimeout(900);
  expect((await page.getAttribute('#tab-att', 'aria-selected')) === 'true', 'last tab (attendance) is remembered after reload');
  expect((await page.inputValue('#at-a')) === '30', 'attendance input remembered');
  await page.click('#helpBox summary'); await settle();
  await click('#resetAll');
  await click('#tab-basic'); await click('#m-of');
  expect((await page.inputValue('#b-of-x')) === '15' && num(await txt('#out-basic')) === 96, 'Reset brings back the examples');
};
