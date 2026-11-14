/* Interaction test for Health Calculators (run by tools/verify.js in en and hi).
   Every expected number below was worked out by hand (shown in the comment), not copied from the app.
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t }) {
  const clean = (s) => String(s || '').replace(/[⁦-⁩]/g, '').trim();
  const txt = async (sel) => clean(await page.textContent(sel));
  const nums = (s) => (String(s).replace(/,/g, '').match(/\d+(\.\d+)?/g) || []).map(Number);
  const settle = () => page.waitForTimeout(100);
  const fill = async (sel, v) => { await page.fill(sel, String(v)); await settle(); };
  const click = async (sel) => { await page.click(sel); await settle(); };
  const hidden = (sel) => page.$eval(sel, (e) => e.hidden);
  const near = (a, b, eps) => Math.abs(a - b) <= (eps || 1e-9);

  /* ---------- 0. pure formulas (hand-checked) ---------- */
  const F = await page.evaluate(() => {
    const C = window.HEALTHCALC;
    return {
      bmi1: C.bmi(70, 175),                       // 70 / 1.75^2 = 70 / 3.0625 = 22.857...
      bmi2: C.bmi(68, 170),                       // 68 / 2.89 = 23.529...
      ft: C.ftInToCm(5, 7),                       // 67 in x 2.54 = 170.18 cm
      ideal: C.idealRange(170, 18.5, 24.9),       // 18.5 x 2.89 = 53.465 ; 24.9 x 2.89 = 71.961
      bmrM: C.bmr('m', 70, 175, 30),              // 700 + 1093.75 - 150 + 5 = 1648.75
      bmrF: C.bmr('f', 60, 160, 25),              // 600 + 1000 - 125 - 161 = 1314
      tdee: C.tdee(1648.75, 3),                   // x 1.55 = 2555.5625
      act: C.ACT.slice(),
      water: C.water(70, false),                  // 30 x 70 = 2100 ml ; 35 x 70 = 2450 ml
      waterHot: C.water(70, true),                // + 500 ml each
      whtr: C.whtr(85, 170),                      // 0.5
      cats: [17.3, 18.5, 22.9, 23, 24.9, 25, 29.9, 30].map((b) => C.cat(b, C.WHO) + '/' + C.cat(b, C.ASIAN)),
      wcats: [0.39, 0.4, 0.49, 0.5, 0.59, 0.6].map((r) => C.whtrCat(r))
    };
  });
  expect(near(F.bmi1, 22.857142857, 1e-6), 'BMI 70 kg / 175 cm = 22.857, got ' + F.bmi1);
  expect(near(F.bmi2, 23.529411765, 1e-6), 'BMI 68 kg / 170 cm = 23.529, got ' + F.bmi2);
  expect(near(F.ft, 170.18, 1e-9), '5 ft 7 in = 170.18 cm, got ' + F.ft);
  expect(near(F.ideal[0], 53.465, 1e-9) && near(F.ideal[1], 71.961, 1e-9), 'ideal range at 170 cm = 53.465..71.961, got ' + F.ideal);
  expect(F.bmrM === 1648.75 && F.bmrF === 1314, 'Mifflin-St Jeor: man 1648.75, woman 1314, got ' + F.bmrM + ' / ' + F.bmrF);
  expect(near(F.tdee, 2555.5625, 1e-9), 'TDEE 1648.75 x 1.55 = 2555.5625, got ' + F.tdee);
  expect(F.act.join() === '1.2,1.375,1.55,1.725,1.9', 'standard activity factors, got ' + F.act);
  expect(F.water.join() === '2100,2450' && F.waterHot.join() === '2600,2950', 'water 30-35 ml/kg (+500 ml hot), got ' + F.water + ' / ' + F.waterHot);
  expect(F.whtr === 0.5, 'waist 85 / height 170 = 0.5');
  expect(F.cats.join(' ') === 'under/under normal/normal normal/normal normal/over normal/over over/obese over/obese obese/obese',
    'WHO cut-offs 18.5 / 25 / 30 and Asian 18.5 / 23 / 25, got ' + F.cats.join(' '));
  expect(F.wcats.join() === 'low,ok,ok,inc,inc,high', 'waist-to-height bands 0.4 / 0.5 / 0.6, got ' + F.wcats);

  /* ---------- 1. the medical note is always visible ---------- */
  expect((await txt('#disclaimer')) === t('disclaimer') && await page.isVisible('#disclaimer'), 'the "not medical advice" note is shown');

  /* ---------- 2. BMI through the UI ---------- */
  await click('#u-cm'); await click('#tab-bmi');
  await fill('#h-cm', '175'); await fill('#w-kg', '70');
  expect(nums(await txt('#out-bmi'))[0] === 22.9, 'BMI 70/175 shows 22.9, got ' + await txt('#out-bmi'));
  expect((await txt('#bmi-who')).includes(t('cat_normal')) && (await txt('#bmi-asian')).includes(t('cat_normal')), '22.9 is healthy by both WHO and Asian cut-offs');

  await fill('#h-cm', '170'); await fill('#w-kg', '68');
  expect(nums(await txt('#out-bmi'))[0] === 23.5, 'BMI 68/170 shows 23.5, got ' + await txt('#out-bmi'));
  expect((await txt('#bmi-who')).includes(t('cat_normal')), '23.5 is WHO healthy weight');
  expect((await txt('#bmi-asian')).includes(t('cat_over')), '23.5 is overweight by the Asian cut-off of 23, got ' + await txt('#bmi-asian'));
  expect((await txt('#asian-note')).includes('23') && (await txt('#asian-note')).includes('25'), 'the note about Asian cut-offs 23 and 25 is shown');
  expect((await page.$$('#bmi-rows tr')).length === 4, 'the table lists the 4 WHO categories');

  await fill('#w-kg', '50');                      // 50 / 2.89 = 17.30
  expect(nums(await txt('#out-bmi'))[0] === 17.3 && (await txt('#bmi-who')).includes(t('cat_under')), '50/170 = 17.3 underweight, got ' + await txt('#out-bmi'));
  await fill('#w-kg', '80');                      // 80 / 2.89 = 27.68
  expect(nums(await txt('#out-bmi'))[0] === 27.7 && (await txt('#bmi-who')).includes(t('cat_over')) && (await txt('#bmi-asian')).includes(t('cat_obese')), '80/170 = 27.7: WHO overweight, Asian obese');
  await fill('#w-kg', '95');                      // 95 / 2.89 = 32.87
  expect(nums(await txt('#out-bmi'))[0] === 32.9 && (await txt('#bmi-who')).includes(t('cat_obese')), '95/170 = 32.9 obese, got ' + await txt('#out-bmi'));

  /* feet and inches: 5 ft 7 in, 68 kg -> 68 / 1.7018^2 = 23.48 -> 23.5 */
  await fill('#w-kg', '68');
  await click('#u-ft');
  expect((await page.inputValue('#h-ft')) === '5' && Number(await page.inputValue('#h-in')) === 6.9, '170 cm is carried over as 5 ft 6.9 in, got ' + await page.inputValue('#h-ft') + ' ft ' + await page.inputValue('#h-in'));
  await fill('#h-ft', '5'); await fill('#h-in', '7');
  expect(nums(await txt('#out-bmi'))[0] === 23.5, '5 ft 7 in and 68 kg shows 23.5, got ' + await txt('#out-bmi'));
  await click('#u-cm');
  expect(Number(await page.inputValue('#h-cm')) === 170.2, '5 ft 7 in is carried back as 170.2 cm, got ' + await page.inputValue('#h-cm'));

  /* ---------- 3. empty, invalid and huge input never crash ---------- */
  await fill('#h-cm', '');
  expect(!(await hidden('#err-bmi')) && (await txt('#err-bmi')) === t('need_h') && await hidden('#res-bmi'), 'empty height asks for the height and hides the result');
  await fill('#h-cm', 'abc');
  expect((await txt('#err-bmi')) === t('err_num'), 'letters show the "numbers only" message');
  await fill('#h-cm', '-170');
  expect((await txt('#err-bmi')) === t('err_num'), 'a minus sign is not accepted');
  await fill('#h-cm', '999999999999');
  expect((await txt('#err-bmi')) === t('err_h'), 'a huge height shows the range message');
  await fill('#h-cm', '170'); await fill('#w-kg', '0');
  expect((await txt('#err-bmi')) === t('err_w'), 'weight 0 shows the range message, no division problem');
  await fill('#w-kg', '68');
  expect(await hidden('#err-bmi') && nums(await txt('#out-bmi'))[0] === 23.5, 'fixing the input brings the result back');

  /* ---------- 4. ideal weight ---------- */
  await click('#tab-ideal');
  expect(!(await hidden('#p-ideal')) && await hidden('#p-bmi'), 'the ideal weight tab is open');
  let n = nums(await txt('#out-ideal'));          // 53.465 -> 53.5 ; 71.961 -> 72
  expect(n[0] === 53.5 && n[1] === 72, 'healthy range at 170 cm = 53.5 to 72 kg, got ' + await txt('#out-ideal'));
  n = nums(await txt('#ideal-asian'));            // 22.9 x 2.89 = 66.181 -> 66.2 (the "23" in the sentence comes first)
  expect(n.includes(53.5) && n.includes(66.2), 'Asian range at 170 cm = 53.5 to 66.2 kg, got ' + await txt('#ideal-asian'));
  expect((await txt('#ideal-now')) === t('ideal_in', { w: '68' }), '68 kg is inside the range');
  await fill('#w-kg', '80');                      // 80 - 72 = 8
  expect((await txt('#ideal-now')) === t('ideal_above', { w: '80', d: '8' }), '80 kg is 8 kg above, got ' + await txt('#ideal-now'));
  await fill('#w-kg', '50');                      // 53.5 - 50 = 3.5
  expect((await txt('#ideal-now')) === t('ideal_below', { w: '50', d: '3.5' }), '50 kg is 3.5 kg below, got ' + await txt('#ideal-now'));

  /* ---------- 5. calories ---------- */
  await click('#tab-cal');
  await fill('#h-cm', '175'); await fill('#w-kg', '70'); await fill('#age', '30');
  await click('#sex-m'); await page.selectOption('#act', '3'); await settle();
  expect(nums(await txt('#out-bmr')).includes(1649), 'BMR man 70 kg 175 cm 30 y = 1648.75 -> 1649, got ' + await txt('#out-bmr'));
  expect(nums(await txt('#out-tdee'))[0] === 2556, 'x 1.55 = 2555.56 -> 2556 kcal, got ' + await txt('#out-tdee'));
  await fill('#h-cm', '160'); await fill('#w-kg', '60'); await fill('#age', '25');
  await click('#sex-f'); await page.selectOption('#act', '1'); await settle();
  expect(nums(await txt('#out-bmr')).includes(1314), 'BMR woman 60 kg 160 cm 25 y = 1314, got ' + await txt('#out-bmr'));
  expect(nums(await txt('#out-tdee'))[0] === 1577, '1314 x 1.2 = 1576.8 -> 1577 kcal, got ' + await txt('#out-tdee'));
  await fill('#age', '12');
  expect((await txt('#err-cal')) === t('cal_adult') && await hidden('#res-cal'), 'a child age shows "ask a doctor", no number');
  await fill('#age', '500');
  expect((await txt('#err-cal')) === t('err_age'), 'age 500 shows the range message');
  await fill('#age', '25');

  /* ---------- 6. water ---------- */
  await click('#tab-water');
  await fill('#w-kg', '70');
  expect((await txt('#p-water h2')) === t('water_h'), 'the water tab is labelled a rough guide');
  n = nums(await txt('#out-water'));              // 2100 ml -> 2.1 L ; 2450 ml -> 2.5 L (rounded to 1 decimal)
  expect(n[0] === 2.1 && n[1] === 2.5, 'water for 70 kg = 2.1 to 2.5 litres, got ' + await txt('#out-water'));
  expect((await txt('#water-glasses')) === t('water_glasses', { a: '8', b: '10' }), '2100/250 = 8.4 -> 8 and 2450/250 = 9.8 -> 10 glasses, got ' + await txt('#water-glasses'));
  await page.check('#hot'); await settle();
  n = nums(await txt('#out-water'));              // 2600 ml -> 2.6 L ; 2950 ml -> 3.0 L
  expect(n[0] === 2.6 && n[1] === 3, 'hot day adds 0.5 litre: 2.6 to 3.0, got ' + await txt('#out-water'));
  await page.uncheck('#hot'); await settle();

  /* ---------- 7. waist-to-height ---------- */
  await click('#tab-waist');
  await fill('#h-cm', '170'); await fill('#waist', '80');          // 80 / 170 = 0.4706
  expect(nums(await txt('#out-whtr'))[0] === 0.47 && (await txt('#whtr-cat')) === t('wh_ok'), '80/170 = 0.47 healthy, got ' + await txt('#out-whtr'));
  expect(nums(await txt('#whtr-rule')).includes(85), 'half of 170 cm is 85 cm, got ' + await txt('#whtr-rule'));
  await fill('#waist', '85');                                       // 0.50
  expect(nums(await txt('#out-whtr'))[0] === 0.5 && (await txt('#whtr-cat')) === t('wh_inc'), '85/170 = 0.50 increased risk');
  await fill('#waist', '105');                                      // 0.6176
  expect(nums(await txt('#out-whtr'))[0] === 0.62 && (await txt('#whtr-cat')) === t('wh_high'), '105/170 = 0.62 high risk');
  await fill('#waist', '60');                                       // 0.3529
  expect(nums(await txt('#out-whtr'))[0] === 0.35 && (await txt('#whtr-cat')) === t('wh_low'), '60/170 = 0.35 low');
  await fill('#waist', '');
  expect((await txt('#err-waist')) === t('need_waist'), 'empty waist asks for the waist');
  await fill('#waist', '80');

  /* ---------- 8. saved on the device, then Reset ---------- */
  await page.reload(); await page.waitForTimeout(700);
  expect((await page.inputValue('#h-cm')) === '170' && (await page.inputValue('#waist')) === '80', 'numbers are still there after a reload');
  expect(!(await hidden('#p-waist')), 'the open tab is remembered');
  await page.click('#helpBox summary'); await click('#resetAll');
  expect((await page.inputValue('#h-cm')) === '165' && (await page.inputValue('#w-kg')) === '62', 'Reset brings back the example numbers');
  await click('#tab-bmi');
  expect(nums(await txt('#out-bmi'))[0] === 22.8, 'example 62 kg / 165 cm = 22.77 -> 22.8, got ' + await txt('#out-bmi'));
};
