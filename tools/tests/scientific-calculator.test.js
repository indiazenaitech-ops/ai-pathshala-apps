/* Interaction test for Scientific Calculator (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, t, log }) {
  const calc = async (expr) => {
    await page.click('#key-ac');
    await page.fill('#expr', expr);
    await page.press('#expr', 'Enter');
    await page.waitForTimeout(30);
    return {
      v: await page.getAttribute('#result', 'data-value'),
      code: await page.getAttribute('#result', 'data-code'),
      text: ((await page.textContent('#result')) || '').trim()
    };
  };
  await page.click('#tab-calc');
  expect((await page.textContent('#angle-btn')).trim() === 'DEG', 'starts in degrees');

  let r = await calc('sin(30)');
  expect(r.v === '0.5', 'sin(30) in DEG = 0.5, got ' + r.v);
  r = await calc('5!');
  expect(r.v === '120', '5! = 120, got ' + r.v);
  r = await calc('nCr(10,3)');
  expect(r.v === '120', 'nCr(10,3) = 120, got ' + r.v);
  r = await calc('10C3');
  expect(r.v === '120', '10C3 = 120, got ' + r.v);
  r = await calc('2^10');
  expect(r.v === '1024', '2^10 = 1024, got ' + r.v);
  r = await calc('0.1+0.2');
  expect(r.v === '0.3', '0.1 + 0.2 = 0.3 (no float noise), got ' + r.v);
  r = await calc('sin(180)');
  expect(r.v === '0', 'sin(180°) = 0, got ' + r.v);
  r = await calc('2π');
  expect(Math.abs(Number(r.v) - 2 * Math.PI) < 1e-10, '2π = 6.28318…, got ' + r.v);
  r = await calc('3(4+5)');
  expect(r.v === '27', 'implicit multiplication 3(4+5) = 27, got ' + r.v);
  r = await calc('sqrt(2)^2');
  expect(Math.abs(Number(r.v) - 2) < 1e-11, 'sqrt(2)^2 ≈ 2, got ' + r.v);

  // auto-closed bracket
  r = await calc('2×(3+4');
  expect(r.v === '14' && (await page.inputValue('#expr')) === '2×(3+4)', 'missing ) is closed for you');

  // division by zero: translated error, no value
  r = await calc('1/0');
  expect(r.code === 'div0' && r.v === null, '1/0 gives the divide-by-zero error, got ' + JSON.stringify(r));
  expect(r.text.includes(t('err_div0')), 'error message is in this language: ' + r.text);

  // on-screen keypad: 2 sin 30 + 5 ! =   → 121 (implicit multiplication + factorial)
  await page.click('#key-ac');
  for (const k of ['2', 'sin', '3', '0', 'rp', 'add', '5', 'fact', 'eq']) await page.click('#key-' + k);
  expect((await page.getAttribute('#result', 'data-value')) === '121', 'keypad 2sin(30)+5! = 121, got ' + await page.getAttribute('#result', 'data-value'));
  // an operator right after an answer continues with Ans: Ans × 2 = 242
  await page.click('#key-mul'); await page.click('#key-2'); await page.click('#key-eq');
  expect((await page.getAttribute('#result', 'data-value')) === '242', 'Ans × 2 = 242');

  // history: entries created, newest first; tapping an expression puts it back in the line
  const items = await page.$$eval('#hist-list .sc-hitem', (l) => l.length);
  expect(items >= 10, 'history entries were created, got ' + items);
  expect((await page.textContent('#hist-list .sc-hitem .sc-hbtn')).trim() === 'Ans×2', 'newest history item is first');
  await page.click('#hist-list .sc-hitem:nth-child(2) .sc-hbtn');
  expect((await page.inputValue('#expr')) === '2sin(30)+5!', 'tapping a history item reuses the calculation');

  // fraction display: 0.75 → 3/4
  await calc('3÷4');
  await page.click('#frac-btn');
  expect(((await page.textContent('#result')) || '').replace(/\s/g, '') === '34', 'a/b shows 3 over 4');
  await page.click('#frac-btn');

  // radians: sin(π/2) = 1
  await page.click('#angle-btn');
  expect((await page.textContent('#angle-btn')).trim() === 'RAD', 'switched to radians');
  r = await calc('sin(π/2)');
  expect(r.v === '1', 'sin(π/2) in RAD = 1, got ' + r.v);
  await page.click('#angle-btn'); await page.click('#angle-btn');   // back to DEG

  // memory: 7 M+ , MR × 2 = 14
  await calc('7'); await page.click('#key-mplus');
  expect(!(await page.isHidden('#mem-flag')), 'memory flag shown');
  await page.click('#key-ac'); await page.click('#key-mr'); await page.click('#key-mul'); await page.click('#key-2'); await page.click('#key-eq');
  expect((await page.getAttribute('#result', 'data-value')) === '14', 'MR × 2 = 14');

  // history survives a reload (EDU.store)
  await page.reload(); await page.waitForTimeout(600);
  expect((await page.$$eval('#hist-list .sc-hitem', (l) => l.length)) >= 10, 'history saved on the device');

  // equation solver: x² − 5x + 6 = 0 → 3 and 2, D = 1
  await page.click('#tab-eq');
  await page.click('#eqt-quad');
  await page.fill('#eq-a', '1'); await page.fill('#eq-b', '-5'); await page.fill('#eq-c', '6');
  const roots = await page.$$eval('#eq-answer .sc-root', (l) => l.map((x) => x.textContent.replace(/\s/g, '')));
  expect(roots.length === 2 && roots.some((x) => x.endsWith('=3')) && roots.some((x) => x.endsWith('=2')), 'roots of x² − 5x + 6 are 2 and 3: ' + roots.join(' '));
  expect((await page.textContent('#eq-steps')).includes('= 1'), 'discriminant D = 1 shown in the steps');
  expect((await page.textContent('#eq-verdict')).trim() === t('nat_two', { d: '1' }), 'nature of roots explained in this language');
  // complex roots: x² + 2x + 5 = 0 → −1 ± 2i
  await page.fill('#eq-b', '2'); await page.fill('#eq-c', '5');
  const cr = await page.$$eval('#eq-answer .sc-root', (l) => l.map((x) => x.textContent.replace(/\s/g, '')));
  expect(cr.join(' ') === 'x₁=−1+2i x₂=−1−2i', 'complex roots −1 ± 2i: ' + cr.join(' '));

  // 2 unknowns by Cramer's rule: 2x + 3y = 13, x − y = −1 → x = 2, y = 3
  await page.click('#eqt-lin2');
  await page.click('#eqex-lin2-0');
  const lin = await page.$$eval('#eq-answer .sc-root', (l) => l.map((x) => x.textContent.replace(/\s/g, '')));
  expect(lin.join(' ') === 'x=2 y=3', 'linear system solution x = 2, y = 3: ' + lin.join(' '));
  await page.click('#eqt-lin3');
  await page.click('#eqex-lin3-0');
  const lin3 = await page.$$eval('#eq-answer .sc-root', (l) => l.map((x) => x.textContent.replace(/\s/g, '')));
  expect(lin3.join(' ') === 'x=1 y=2 z=3', '3 unknowns: x = 1, y = 2, z = 3: ' + lin3.join(' '));

  // statistics
  await page.click('#tab-stats');
  await page.fill('#st-in', '2, 4, 4, 4, 5, 5, 7, 9');
  const sv = async (k) => (await page.textContent('#st-body tr[data-k="' + k + '"] td.v')).trim();
  expect(await sv('st_mean') === '5' && await sv('st_median') === '4.5' && await sv('st_sdp') === '2', 'mean 5, median 4.5, σ 2');
  expect((await sv('st_mode')).startsWith('4'), 'mode is 4');
  await page.click('#tab-calc');
};
