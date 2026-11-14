/* Interaction test for the Attendance Calculator (run by tools/verify.js in en and hi).
   Every expected number below was worked out by hand:
     need x:      (a + x) / (h + x) >= t   ->  x = ceil((t*h - a) / (1 - t))
     can miss y:   a / (h + y)     >= t   ->  y = floor(a / t - h)                                   */
module.exports = async function ({ page, expect, t }) {
  const settle = () => page.waitForTimeout(120);
  const set = async (sel, v) => { await page.fill(sel, v); await settle(); };
  const txt = async sel => (await page.textContent(sel)).trim();
  const data = (sel, k) => page.$eval(sel, (e, k2) => e.dataset[k2], k);
  const fmt = n => String(n);

  // 0. the engine itself, against hand-worked values
  const eng = await page.evaluate(() => {
    const A = window.ATT;
    return {
      need_40_26_75: A.need(40, 26, 75),       // (30 - 26) / 0.25 = 16   -> 42/56 = 75%
      need_40_29_75: A.need(40, 29, 75),       // (30 - 29) / 0.25 = 4    -> 33/44 = 75%
      need_50_30_80: A.need(50, 30, 80),       // (40 - 30) / 0.20 = 50   -> 80/100 = 80%
      need_10_7_75: A.need(10, 7, 75),         // (7.5 - 7) / 0.25 = 2    -> 9/12 = 75%
      need_3_2_75: A.need(3, 2, 75),           // (2.25 - 2) / 0.25 = 1   -> 3/4 = 75%
      need_met: A.need(40, 30, 75),            // exactly 75% already -> 0
      need_100: A.need(40, 39, 100),           // can never get back to 100%
      need_100_ok: A.need(40, 40, 100),        // already 100%
      need_zero: A.need(0, 0, 75),             // nothing held -> 0
      need_dec: A.need(40, 26, 67.5),          // (27 - 26) / 0.325 = 3.08 -> 4   (30/44 = 68.18%, 29/43 = 67.44%)
      miss_40_36_75: A.canMiss(40, 36, 75),    // 36 / 0.75 - 40 = 8      -> 36/48 = 75%
      miss_40_30_75: A.canMiss(40, 30, 75),    // 30 / 0.75 - 40 = 0
      miss_40_31_75: A.canMiss(40, 31, 75),    // 41.33 - 40 -> 1         -> 31/41 = 75.6%, 31/42 = 73.8%
      miss_40_40_75: A.canMiss(40, 40, 75),    // 53.33 - 40 -> 13        -> 40/53 = 75.47%
      miss_100: A.canMiss(40, 40, 100),        // target 100% -> 0
      miss_below: A.canMiss(40, 26, 75),       // below target -> 0
      miss_60: A.canMiss(45, 30, 60),          // 30 / 0.6 - 45 = 5       -> 30/50 = 60%
      plan: A.plan(40, 26, 40, 75),            // 80 classes, need 60, have 26 -> attend 34, miss 6; 60/80 = 75%
      plan_bad: A.plan(40, 10, 10, 75),        // best (10+10)/50 = 40% -> impossible
      plan_free: A.plan(40, 40, 5, 75),        // 40/45 = 88.88% even if all 5 are missed
      plan_start: A.plan(0, 0, 20, 75),        // term not started: need 15 of 20, can miss 5
      pct_floor: A.pct(749, 1000),             // 74.9
      pct_third: A.pct(2, 3),                  // 66.666 -> 66.66 (rounded down)
      check_more: A.check(40, 41), check_neg: A.check(-1, 0), check_dec: A.check(10.5, 3), check_ok: A.check(40, 40)
    };
  });
  expect(eng.need_40_26_75 === 16, 'need(40,26,75) = 16, got ' + eng.need_40_26_75);
  expect(eng.need_40_29_75 === 4, 'need(40,29,75) = 4, got ' + eng.need_40_29_75);
  expect(eng.need_50_30_80 === 50, 'need(50,30,80) = 50, got ' + eng.need_50_30_80);
  expect(eng.need_10_7_75 === 2, 'need(10,7,75) = 2, got ' + eng.need_10_7_75);
  expect(eng.need_3_2_75 === 1, 'need(3,2,75) = 1, got ' + eng.need_3_2_75);
  expect(eng.need_met === 0 && eng.need_100_ok === 0 && eng.need_zero === 0, 'need is 0 when the target is already met or nothing is held');
  expect(eng.need_100 === null || eng.need_100 === Infinity, 'target 100% with a missed class can never be reached');   // Infinity serialises as null
  expect(eng.need_dec === 4, 'need(40,26,67.5) = 4, got ' + eng.need_dec);
  expect(eng.miss_40_36_75 === 8, 'canMiss(40,36,75) = 8, got ' + eng.miss_40_36_75);
  expect(eng.miss_40_30_75 === 0, 'canMiss(40,30,75) = 0, got ' + eng.miss_40_30_75);
  expect(eng.miss_40_31_75 === 1, 'canMiss(40,31,75) = 1, got ' + eng.miss_40_31_75);
  expect(eng.miss_40_40_75 === 13, 'canMiss(40,40,75) = 13, got ' + eng.miss_40_40_75);
  expect(eng.miss_100 === 0 && eng.miss_below === 0, 'canMiss is 0 at target 100% and below target');
  expect(eng.miss_60 === 5, 'canMiss(45,30,60) = 5, got ' + eng.miss_60);
  expect(eng.plan.possible && eng.plan.maxMiss === 6 && eng.plan.mustAttend === 34 && eng.plan.finalPct === 75 && eng.plan.bestPct === 82.5 && eng.plan.worstPct === 32.5 && eng.plan.needTotal === 60, 'plan(40,26,40,75): ' + JSON.stringify(eng.plan));
  expect(!eng.plan_bad.possible && eng.plan_bad.bestPct === 40 && eng.plan_bad.maxMiss === 0, 'plan(40,10,10,75) is impossible: ' + JSON.stringify(eng.plan_bad));
  expect(eng.plan_free.maxMiss === 5 && eng.plan_free.mustAttend === 0 && eng.plan_free.worstPct === 88.88, 'plan(40,40,5,75): ' + JSON.stringify(eng.plan_free));
  expect(eng.plan_start.maxMiss === 5 && eng.plan_start.mustAttend === 15 && eng.plan_start.finalPct === 75, 'plan(0,0,20,75): ' + JSON.stringify(eng.plan_start));
  expect(eng.pct_floor === 74.9 && eng.pct_third === 66.66, 'percentages round down: ' + eng.pct_floor + ', ' + eng.pct_third);
  expect(eng.check_more === 'more' && eng.check_neg === 'whole' && eng.check_dec === 'whole' && eng.check_ok === '', 'input checks');

  // 1. first visit: explained example (40 held, 26 attended = 65%, needs 16)
  await page.waitForSelector('#ovPct');
  expect(await page.isVisible('#exNote'), 'example note is shown on first visit');
  expect(await data('#ovPct', 'pct') === '65', 'example shows 65%, got ' + await data('#ovPct', 'pct'));
  expect(await data('#ovMsg', 'mode') === 'need' && await data('#ovMsg', 'n') === '16', 'example needs 16 classes');
  expect(await txt('#ovMsg') === t('msg_need', { x: fmt(16), t: fmt(75) }), 'need message text: ' + await txt('#ovMsg'));
  expect(await txt('#ovBadge') === t('st_low'), 'badge says short');
  expect((await txt('#ovWork')).includes('42 ÷ 56 × 100 = 75%'), 'working shows 42 ÷ 56 × 100 = 75%');

  // 2. safe case: 40 held, 36 attended -> 90%, can miss 8
  await set('#held', '40'); await set('#att', '36');
  expect(!(await page.isVisible('#exNote')), 'example note goes away after typing');
  expect(await data('#ovPct', 'pct') === '90', '36/40 = 90%');
  expect(await data('#ovMsg', 'mode') === 'miss' && await data('#ovMsg', 'n') === '8', 'can miss 8');
  expect(await txt('#ovMsg') === t('msg_miss', { y: fmt(8), t: fmt(75) }), 'miss message text');
  expect((await txt('#ovWork')).includes('36 ÷ 48 × 100 = 75%') && (await txt('#ovWork')).includes('36 ÷ 49 × 100 = 73.46%'), 'working shows the limit and one past it');

  // 3. exactly at the limit, and the target can be edited
  await set('#att', '30');
  expect(await data('#ovMsg', 'mode') === 'miss0', '30/40 at 75% is exactly at the limit');
  await set('#target', '80');
  expect(await data('#ovMsg', 'mode') === 'need' && await data('#ovMsg', 'n') === '10', '30/40 at 80% needs (32-30)/0.2 = 10, got ' + await data('#ovMsg', 'n'));
  await page.click('#targetSeg button[data-t="60"]'); await settle();
  expect(await page.inputValue('#target') === '60', 'quick button sets the target');
  expect(await data('#ovMsg', 'mode') === 'miss' && await data('#ovMsg', 'n') === '10', '30/40 at 60% can miss 30/0.6-40 = 10');

  // 4. edge cases: target 100%, already 100%, attended > held, zero classes, bad input
  await set('#target', '100');
  expect(await data('#ovMsg', 'mode') === 'never', 'target 100% with misses can never be reached');
  expect(await txt('#ovMsg') === t('msg_never', { m: fmt(10) }), 'never message');
  await set('#att', '40');
  expect(await data('#ovMsg', 'mode') === 'full' && await data('#ovPct', 'pct') === '100', 'already 100% at target 100%');
  await set('#target', '75');
  expect(await data('#ovMsg', 'mode') === 'miss' && await data('#ovMsg', 'n') === '13', '40/40 at 75% can miss 13');
  await set('#att', '41');
  expect(await txt('#ovErr') === t('err_more') && !(await page.isVisible('#ovBody')), 'attended > held is rejected');
  await set('#held', '0'); await set('#att', '0');
  expect(await txt('#ovEmpty') === t('msg_zero') && !(await page.isVisible('#ovBody')), 'zero classes shows a calm message');
  for (const bad of ['-5', '12.5', 'abc', '1e3']) {
    await set('#held', bad);
    expect(await txt('#ovErr') === t('err_whole'), 'bad input "' + bad + '" is rejected');
  }
  await set('#held', '40'); await set('#att', '26');
  for (const bad of ['0', '101', '-3', 'x', '75.55']) {
    await set('#target', bad);
    expect(await txt('#targetErr') === t('err_target') && !(await page.isVisible('#ovBody')), 'bad target "' + bad + '" is rejected');
  }
  await set('#target', '75');
  expect(await data('#ovMsg', 'n') === '16', 'back to a valid state');

  // 5. subject-wise: the example rows, own target, totals
  await page.click('#tabSubjects'); await settle();
  expect((await page.$$('#subList .sub')).length === 5, 'example has 5 subjects');
  const rowMsg = i => page.$eval('#subList .sub:nth-child(' + i + ') .sub-msg', e => ({ mode: e.dataset.mode, n: e.dataset.n }));
  let r = await rowMsg(1); expect(r.mode === 'miss' && r.n === '6', '42/36 can miss 36/0.75-42 = 6, got ' + JSON.stringify(r));
  r = await rowMsg(2); expect(r.mode === 'need' && r.n === '16', '40/26 needs 16');
  r = await rowMsg(3); expect(r.mode === 'miss' && r.n === '2', '38/30 can miss 30/0.75-38 = 2');
  r = await rowMsg(4); expect(r.mode === 'miss' && r.n === '10', '30/30 can miss 10');
  r = await rowMsg(5); expect(r.mode === 'need' && r.n === '12', '24/15 needs (18-15)/0.25 = 12');
  // totals: 174 held, 137 attended = 78.73%, can miss floor(137/0.75 - 174) = 8
  expect(await data('#totPct', 'pct') === '78.73', 'total is 78.73%, got ' + await data('#totPct', 'pct'));
  expect(await txt('#totMsg') === t('msg_miss', { y: fmt(8), t: fmt(75) }), 'total can miss 8');
  expect(await txt('#totNote') === t('sub_lowcount', { n: fmt(2), k: fmt(5) }), '2 of 5 subjects are low');
  // own target 60% on subject 2: 26/40 = 65% -> can miss floor(26/0.6 - 40) = 3
  await page.fill('#subList .sub:nth-child(2) .sub-t', '60'); await settle();
  r = await rowMsg(2); expect(r.mode === 'miss' && r.n === '3', 'own target 60% -> can miss 3, got ' + JSON.stringify(r));
  // add a subject, type values, remove one
  await page.click('#btnAddSub'); await settle();
  expect((await page.$$('#subList .sub')).length === 6, 'subject added');
  await page.fill('#subList .sub:nth-child(6) .sub-name', 'Hindi');
  await page.fill('#subList .sub:nth-child(6) .sub-h', '20');
  await page.fill('#subList .sub:nth-child(6) .sub-a', '25'); await settle();
  expect((await page.textContent('#subList .sub:nth-child(6) .sub-err')).trim() === t('err_more'), 'subject row rejects attended > held');
  await page.fill('#subList .sub:nth-child(6) .sub-a', '15'); await settle();
  r = await rowMsg(6); expect(r.mode === 'miss0', '15/20 is exactly 75%');
  expect(await data('#totPct', 'pct') === '78.35', 'total with the new subject: 152/194 = 78.35%, got ' + await data('#totPct', 'pct'));
  await page.click('#subList .sub:nth-child(6) .sub-del'); await settle();
  expect((await page.$$('#subList .sub')).length === 5, 'subject removed');

  // 6. planner: 40 held, 26 attended, 40 left -> miss at most 6, final 75%, best 82.5%, worst 32.5%
  await page.click('#tabPlanner'); await settle();
  expect(await page.inputValue('#pHeld') === '40' && await page.inputValue('#pAtt') === '26', 'planner shares held/attended with Overall');
  await set('#left', '40');
  expect(await data('#plMsg', 'miss') === '6' && await data('#plMsg', 'possible') === '1', 'planner: can miss 6');
  expect(await txt('#plMsg') === t('plan_can_miss', { n: fmt(40), m: fmt(6), k: fmt(34), p: '75%', t: fmt(75) }), 'planner message: ' + await txt('#plMsg'));
  expect(await data('#plBest', 'pct') === '82.5' && await data('#plWorst', 'pct') === '32.5' && await data('#plLimit', 'pct') === '75', 'best 82.5%, worst 32.5%, limit 75%');
  await set('#left', '5');                                   // best (26+5)/45 = 68.88% -> impossible
  expect(await data('#plMsg', 'possible') === '0' && await data('#plBest', 'pct') === '68.88', 'planner says when the target is out of reach');
  await set('#left', '2.5');
  expect(await txt('#plErr') === t('err_whole'), 'planner rejects decimals');

  // 7. saved on the device
  await set('#left', '40');
  await page.reload(); await page.waitForSelector('#plMsg'); await page.waitForTimeout(400);
  expect(await page.inputValue('#left') === '40' && await data('#plMsg', 'miss') === '6', 'state survives a reload');
  expect(await page.$eval('#tabPlanner', e => e.getAttribute('aria-selected')) === 'true', 'open tab is remembered');
  expect(await page.inputValue('#subList .sub:nth-child(2) .sub-t') === '60', 'subject own target is remembered');
  await page.click('#tabOverall'); await settle();
};
