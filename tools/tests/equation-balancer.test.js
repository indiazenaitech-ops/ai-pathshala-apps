/* Interaction test for the Chemical Equation Balancer (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t, log }) {
  const attr = (sel, a) => page.getAttribute(sel, a);
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const balance = async (eq) => {
    await page.fill('#eq-in', eq);
    await page.click('#balance-btn');
    await page.waitForTimeout(60);
  };
  const coefs = () => attr('#result-eq', 'data-coefs');

  /* ---------------- balancer ---------------- */
  await page.click('#tab-balance');
  expect(await coefs() === '3,4,1,4', 'default NCERT example is balanced on load, got ' + await coefs());

  await balance('Fe + H2O -> Fe3O4 + H2');
  expect(await coefs() === '3,4,1,4', '3Fe + 4H2O -> Fe3O4 + 4H2, got ' + await coefs());
  const rows = await page.$$eval('#atoms tbody tr', (trs) => trs.map((r) => [r.dataset.el, r.dataset.l, r.dataset.r, r.dataset.ok].join(':')));
  expect(rows.join('|') === 'Fe:3:3:1|H:8:8:1|O:4:4:1', 'atom table Fe 3/3, H 8/8, O 4/4, got ' + rows.join('|'));
  expect((await page.$$('#steps .eb-step')).length === 5, 'five method steps shown');
  const finals = await page.$$eval('#steps .eb-final b', (bs) => bs.map((b) => b.textContent).join(','));
  expect(finals === '3,4,1,4', 'step 4 ends with a=3, b=4, c=1, d=4, got ' + finals);
  expect(await attr('#eb-status', 'data-status') === 'ok', 'status badge says balanced');

  await balance('C3H8 + O2 -> CO2 + H2O');
  expect(await coefs() === '1,5,3,4', 'propane combustion 1,5,3,4, got ' + await coefs());

  /* hydrates (both dot styles), brackets, nested groups */
  await balance('CuSO4·5H2O -> CuSO4 + H2O');
  expect(await coefs() === '1,1,5', 'hydrate with middle dot, got ' + await coefs());
  await balance('CuSO4.5H2O = CuSO4 + H2O');
  expect(await coefs() === '1,1,5', 'hydrate with full stop and = arrow, got ' + await coefs());
  await balance('Ca(OH)2 + H3PO4 → Ca3(PO4)2 + H2O');
  expect(await coefs() === '3,2,1,6', 'brackets + unicode arrow, got ' + await coefs());
  await balance('K4[Fe(CN)6] + KMnO4 + H2SO4 -> KHSO4 + Fe2(SO4)3 + MnSO4 + HNO3 + CO2 + H2O');
  expect(await coefs() === '10,122,299,162,5,122,60,60,188', 'nested groups (big coefficients), got ' + await coefs());

  /* ionic equation with charges */
  await balance('MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O');
  expect(await coefs() === '1,5,8,1,5,4', 'permanganate-iron ionic equation, got ' + await coefs());
  const q = await page.$eval('#atoms tr[data-el="charge"]', (r) => r.dataset.l + '/' + r.dataset.r);
  expect(q === '17/17', 'charge row 17 = 17, got ' + q);

  /* the student's own numbers */
  await balance('4H2 + 2O2 -> 4H2O');
  expect(await attr('#yours', 'data-yours') === 'multiple', 'balanced but not smallest is detected');
  expect(await coefs() === '2,1,2', 'smallest answer still shown, got ' + await coefs());
  await balance('2H2 + O2 -> H2O');
  expect(await attr('#yours', 'data-yours') === 'bad', 'wrong numbers are flagged');

  /* impossible / ambiguous / malformed */
  await balance('H2 + O2 -> NaCl');
  expect(await attr('#eq-msg', 'data-err') === 'err_only_side', 'element on one side only');
  expect(await txt('#eq-msg') === t('err_only_side', { e: 'H' }), 'translated error message, got ' + await txt('#eq-msg'));
  expect(await page.isHidden('#result'), 'no result for an impossible equation');
  await balance('H2O -> H2O2');
  expect(await attr('#eq-msg', 'data-err') === 'err_impossible', 'H2O -> H2O2 is impossible');
  await balance('Xy + O2 -> XyO');
  expect(await attr('#eq-msg', 'data-err') === 'err_element', 'unknown element symbol');
  await balance('H2 + O2');
  expect(await attr('#eq-msg', 'data-err') === 'err_arrow', 'missing arrow');
  await balance('H2 + O2 -> H2O + H2O2');
  expect(await attr('#eb-status', 'data-status') === 'many', 'two independent reactions flagged as ambiguous');
  expect(await coefs() === '3,2,2,1', 'one smallest positive answer shown, got ' + await coefs());

  /* example chip */
  await page.click('#examples .eb-ex[data-eq="Al + O2 -> Al2O3"]');
  await page.waitForTimeout(60);
  expect(await coefs() === '4,3,2', 'chip Al + O2 -> 4,3,2, got ' + await coefs());
  expect(await page.inputValue('#eq-in') === 'Al + O2 -> Al2O3', 'chip fills the input');

  /* ---------------- practice ---------------- */
  await page.click('#tab-practice');
  expect(await page.isVisible('#p-practice'), 'practice tab opens');
  await page.selectOption('#pr-select', '13');                 // Fe + H2O (steam)
  expect((await page.$$('#pr-eq .eb-coef-in')).length === 4, 'four boxes for Fe + H2O -> Fe3O4 + H2');
  const fill = async (vals) => { for (let j = 0; j < vals.length; j++) await page.fill('#pr-in-' + j, String(vals[j])); };
  await fill([1, 1, 1, 1]);
  await page.click('#pr-check');
  expect(await attr('#pr-fb', 'data-result') === 'bad', 'all ones is not balanced');
  expect((await page.$$('#pr-atoms tr.eb-no')).length >= 2, 'tally shows unbalanced rows');
  await fill([6, 8, 2, 8]);
  await page.click('#pr-check');
  expect(await attr('#pr-fb', 'data-result') === 'multiple', 'double answer = not smallest');
  await fill([3, 4, 1, 4]);
  await page.click('#pr-check');
  expect(await attr('#pr-fb', 'data-result') === 'ok', '3,4,1,4 is correct');
  expect(await attr('#pr-solved', 'data-n') === '1', 'solved counter = 1');
  expect(await attr('#pr-type-info', 'data-type') === 'redox', 'type revealed after solving');

  /* hints on butane (LPG) */
  await page.selectOption('#pr-select', '4');
  await page.click('#pr-hint');
  expect(await attr('#pr-fb', 'data-result') === 'hint', 'first hint is shown');
  expect((await txt('#pr-fb')).length > 10, 'hint text present');
  await page.click('#pr-hint');
  expect(await page.inputValue('#pr-in-0') === '2', 'second hint reveals 2 in front of C4H10, got ' + await page.inputValue('#pr-in-0'));

  /* reaction type quiz */
  await page.click('#pr-types [data-type="decomposition"]');
  expect(await attr('#pr-type-fb', 'data-result') === 'bad', 'decomposition is wrong for LPG burning');
  await page.click('#pr-types [data-type="combustion"]');
  expect(await attr('#pr-type-fb', 'data-result') === 'ok', 'combustion is right');

  /* show answer */
  await page.click('#pr-next');
  await page.click('#pr-next');                                // 4 -> 6: lead nitrate (heat)
  await page.click('#pr-show');
  const shown = await page.$$eval('#pr-eq .eb-coef-in', (ins) => ins.map((i) => i.value).join(','));
  expect(shown === '2,2,4,1', 'answer 2Pb(NO3)2 -> 2PbO + 4NO2 + O2, got ' + shown);
  expect(await attr('#pr-solved', 'data-n') === '1', 'showing the answer does not count as solved');

  const saved = await page.evaluate(() => EDU.store('equation-balancer').get('prog', {}));
  expect(saved['13'] && saved['13'].s === 1, 'solved reaction saved on this device');
  log('balancer + practice ok');
};
