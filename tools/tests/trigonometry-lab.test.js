/* Interaction test for Trigonometry Lab (run by tools/verify.js in en and hi).
   Expected values by hand: sin 30° = 1/2; tan 45° = 1; tan 90° not defined; sin 150° = 1/2 (quadrant II);
   case (a) d = 30 m, 30° → h = 30/√3 = 10√3 ≈ 17.3205; case (c) 20 m apart, 60° and 30° → h = 10√3, x = 10;
   case (b) H = 75, 45° and 30° → 75 and 75√3, gap = 75(√3 − 1) ≈ 54.9038; 2π/3 = 120°, cos 120° = −1/2; 180° = π ≈ 3.141593 rad. */
module.exports = async function ({ page, expect, log }) {
  const attr = (sel, a) => page.getAttribute(sel, a);
  const deg = async () => +(await attr('#uc-theta', 'data-deg'));
  const setDeg = async (v) => { await page.fill('#uc-deg', String(v)); await page.waitForTimeout(120); };
  const fillNum = async (sel, v) => { await page.fill(sel, String(v)); await page.waitForTimeout(120); };
  const close = (a, b, eps) => Math.abs(a - b) < (eps || 1e-3);

  // --- unit circle ---
  await page.waitForSelector('#uc-theta[data-deg]');
  expect((await deg()) === 30, 'default angle is 30°');
  expect((await attr('#ucr-sin', 'data-v')) === '0.5', 'sin 30° = 0.5');
  await setDeg(45);
  expect((await attr('#ucr-tan', 'data-v')) === '1', 'tan 45° = 1');
  await setDeg(90);
  expect((await attr('#ucr-tan', 'data-v')) === 'nd' && (await attr('#ucr-sec', 'data-v')) === 'nd', 'tan 90° and sec 90° are not defined');
  expect((await page.$('#ucr-tan .nd')) !== null, 'tan row shows the not-defined marker');
  await setDeg(150);
  expect((await page.textContent('#ucr-sin td:nth-child(2)')).trim() === '1/2', 'sin 150° exact = 1/2');
  expect((await attr('#ucr-cos', 'data-v')) === '-0.866', 'cos 150° ≈ −0.866');
  expect((await attr('#uc-quad', 'data-q')) === '2', '150° is in quadrant II');
  expect((await page.$$eval('#uc-astc span.on', a => a.map(x => x.dataset.q)))[0] === '2', 'ASTC highlight follows the quadrant');
  await setDeg(390);
  expect((await deg()) === 30 && !(await page.isHidden('#uc-reduced')), '390° is reduced to 30° with a note');
  await setDeg(-30);
  expect((await deg()) === 330 && (await attr('#ucr-sin', 'data-v')) === '-0.5', '−30° becomes 330°, sin = −0.5');
  await setDeg(0);
  expect((await attr('#ucr-cosec', 'data-v')) === 'nd' && (await page.isHidden('#uc-reduced')), 'cosec 0° not defined, note hidden for 0°');

  // drag on the canvas (snap on): a point at 60° on the circle sets θ = 60°
  const box = await (await page.$('#cv')).boundingBox();
  const R = box.width * 0.33, cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const a60 = 60 * Math.PI / 180;
  await page.mouse.move(cx + R * Math.cos(0.9 * a60), cy - R * Math.sin(0.9 * a60));
  await page.mouse.down();
  await page.mouse.move(cx + R * Math.cos(a60), cy - R * Math.sin(a60), { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  expect((await deg()) === 60, 'dragging the point to 60° sets the angle, got ' + (await deg()));
  expect((await attr('#ucr-cos', 'data-v')) === '0.5' && (await page.textContent('#ucr-tan td:nth-child(2)')).trim() === '√3', 'readout follows the drag: cos 60° = 0.5, tan 60° = √3');
  // keyboard on the canvas
  await page.focus('#cv');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(100);
  expect((await deg()) === 61, 'arrow key moves 1°');
  await page.keyboard.press('Shift+ArrowLeft');
  await page.waitForTimeout(100);
  expect((await deg()) === 46, 'Shift + arrow moves 15°');
  await page.click('#uc-next');
  await page.waitForTimeout(100);
  expect((await deg()) === 60, 'next standard angle after 46° is 60°');
  await page.click('#uc-prev'); await page.click('#uc-prev');
  await page.waitForTimeout(100);
  expect((await deg()) === 30, 'two steps back: 30°');

  // reload persistence
  await setDeg(150);
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForSelector('#uc-theta[data-deg]');
  expect((await deg()) === 150, 'angle persists across reload');
  expect((await page.inputValue('#uc-deg')) === '150', 'input shows the saved angle');

  // --- table + calculator ---
  await page.click('#tab-table');
  expect((await page.$$eval('#std-table tbody tr:not(.trick)', a => a.length)) === 6, 'table has six ratio rows');
  expect((await page.textContent('#std-table tr[data-fn="sin"] td[data-deg="60"]')).trim() === '√3/2', 'table: sin 60° = √3/2');
  expect((await page.$$eval('#std-table tr.trick', a => a.length)) === 2, 'memory-trick rows for sin and cos');
  await page.click('#calc-rad');
  await page.fill('#calc-in', '2pi/3');
  await page.waitForTimeout(150);
  expect((await attr('#calc-out', 'data-deg')) === '120', '2pi/3 = 120°');
  expect((await attr('#calc-tbl tr[data-fn="cos"]', 'data-v')) === '-0.5' && (await page.textContent('#calc-tbl tr[data-fn="cos"] .ex')).trim() === '−1/2', 'cos 120° = −1/2');
  await page.click('#calc-deg');
  await page.fill('#calc-in', '-210');
  await page.waitForTimeout(150);
  expect((await attr('#calc-out', 'data-deg')) === '150' && (await attr('#calc-tbl tr[data-fn="sin"]', 'data-v')) === '0.5', '−210° → 150°, sin = 1/2');
  await page.fill('#calc-in', '40');
  await page.waitForTimeout(150);
  expect((await attr('#calc-tbl tr[data-fn="tan"]', 'data-v')) === '0.8391', 'tan 40° ≈ 0.8391 (decimal for a non-standard angle)');
  await page.fill('#calc-in', 'hello');
  await page.waitForTimeout(150);
  expect((await page.$('#calc-bad')) !== null, 'bad input shows a friendly message');
  await page.selectOption('#inv-fn', 'cos');
  await page.fill('#inv-val', '-1/2');
  await page.waitForTimeout(150);
  expect((await attr('#inv-out', 'data-deg')) === '120', 'cos⁻¹(−1/2) = 120° (principal value)');
  await page.selectOption('#inv-fn', 'tan');
  await page.fill('#inv-val', '-1');
  await page.waitForTimeout(150);
  expect((await attr('#inv-out', 'data-deg')) === '-45', 'tan⁻¹(−1) = −45°');
  await page.selectOption('#inv-fn', 'sin');
  await page.fill('#inv-val', '2');
  await page.waitForTimeout(150);
  expect((await page.$('#inv-domain')) !== null, 'sin⁻¹(2) is outside the domain');
  await fillNum('#conv-deg', 180);
  expect((await attr('#conv-note', 'data-rad')) === '3.141593', '180° = π rad');
  await page.fill('#conv-rad', 'pi/4');
  await page.waitForTimeout(150);
  expect((await page.inputValue('#conv-deg')) === '45', 'π/4 rad = 45°');

  // --- heights and distances ---
  await page.click('#tab-hd');
  await page.selectOption('#hd-case', 'a');
  await fillNum('#hd-d', 30); await fillNum('#hd-a1', 30); await fillNum('#hd-e', 0);
  expect((await attr('#hd-res_height', 'data-ex')) === '10√3', 'case (a): 30 m, 30° → 10√3, got ' + (await attr('#hd-res_height', 'data-ex')));
  expect(close(+(await attr('#hd-res_height', 'data-v')), 17.3205, 1e-4), 'case (a): ≈ 17.32 m');
  expect((await page.$$eval('#hd-steps li', a => a.length)) >= 4, 'steps are written out');
  expect((await page.$$eval('#hd-svg line, #hd-svg rect, #hd-svg path', a => a.length)) > 5, 'diagram drawn');
  await fillNum('#hd-e', 1.5);
  expect(close(+(await attr('#hd-res_height', 'data-v')), 18.8205, 1e-4), 'eye height 1.5 m is added');
  await fillNum('#hd-a1', 100);
  expect((await attr('#hd-err', 'data-err')) === 'hd_err_angle', 'angle over 90° is rejected');
  await page.selectOption('#hd-case', 'c');
  await page.selectOption('#hd-side', 'same');
  await fillNum('#hd-d', 20); await fillNum('#hd-a1', 60); await fillNum('#hd-a2', 30); await fillNum('#hd-e', 0);
  expect((await attr('#hd-res_height', 'data-ex')) === '10√3' && close(+(await attr('#hd-res_height', 'data-v')), 17.3205, 1e-4), 'case (c): 20 m apart, 60° and 30° → 10√3 ≈ 17.32');
  expect((await attr('#hd-res_x', 'data-v')) === '10', 'case (c): nearer point is 10 m from the tower');
  await page.selectOption('#hd-side', 'opp');
  await fillNum('#hd-d', 80); await fillNum('#hd-a1', 60); await fillNum('#hd-a2', 30);
  expect((await attr('#hd-res_height', 'data-ex')) === '20√3' && (await attr('#hd-res_x1', 'data-v')) === '20' && (await attr('#hd-res_x2', 'data-v')) === '60', 'case (c) opposite sides: 80 m, 60°/30° → 20√3, 20 m and 60 m');
  await page.selectOption('#hd-case', 'b');
  await fillNum('#hd-H', 75); await fillNum('#hd-a1', 45); await fillNum('#hd-a2', 30); await fillNum('#hd-e', 0);
  expect((await attr('#hd-res_dist', 'data-v')) === '75' && (await attr('#hd-res_d2', 'data-ex')) === '75√3' && close(+(await attr('#hd-res_gap', 'data-v')), 54.9038, 1e-4), 'case (b): 75 m, 45° and 30° → 75 m, 75√3 m, gap ≈ 54.90 m');
  await page.selectOption('#hd-case', 'd');
  await page.selectOption('#hd-known', 'flag');
  await fillNum('#hd-f', 5); await fillNum('#hd-a1', 45); await fillNum('#hd-a2', 60);
  expect(close(+(await attr('#hd-res_tower', 'data-v')), 6.8301, 1e-4) && close(+(await attr('#hd-res_dist', 'data-v')), 6.8301, 1e-4), 'case (d): 5 m flagstaff, 45°/60° → building 5(√3+1)/2 ≈ 6.83 m');
  await page.selectOption('#hd-case', 'e');
  await page.selectOption('#hd-known', 'L');
  await fillNum('#hd-L', 15); await fillNum('#hd-a1', 60);
  expect((await attr('#hd-res_wall', 'data-ex')) === '15√3/2' && (await attr('#hd-res_foot', 'data-v')) === '7.5', 'case (e): 15 m ladder at 60° → 15√3/2 m up the wall, foot 7.5 m');
  // word problems
  expect((await page.$$eval('#problem-list .prob', a => a.length)) === 6, 'six word problems');
  await page.click('.prob-load[data-id="mobile"]');
  await page.waitForTimeout(200);
  expect((await page.inputValue('#hd-case')) === 'c' && (await attr('#hd-res_height', 'data-ex')) === '10√3', 'loading the mobile-tower problem fills case (c) and solves it');
  expect((await page.$eval('.prob[data-id="qutub"] .ans', e => e.textContent)).includes('72.5'), 'Qutub Minar: car is 72.5 m away (tan 45° = 1)');

  // --- identities quiz ---
  await page.click('#tab-practice');
  await page.waitForSelector('#iq-q');
  const answerOf = async () => page.evaluate(() => { const id = document.querySelector('#iq-q').dataset.id; return window.APP_CONTENT.en.identities.find(q => q.id === id).a; });
  for (let i = 0; i < 10; i++) {
    if (i === 4) {
      await page.reload();
      await page.waitForSelector('#iq-q');
      expect((await page.textContent('#iq-score')).trim() === '3', 'quiz score kept after reload (3 of 4 right)');
      expect(!(await page.isHidden('#panel-practice')), 'practice tab restored after reload');
    }
    const a = await answerOf();
    const pick = i === 1 ? (a + 1) % 4 : a;   // answer Q2 wrongly
    await page.click('.iq-opt[data-idx="' + pick + '"]');
    await page.waitForSelector('#iq-reveal');
    expect((await attr('#iq-reveal', 'data-right')) === (i === 1 ? '0' : '1'), 'quiz question ' + (i + 1) + ' judged correctly');
    await page.click('#iq-next');
    await page.waitForTimeout(80);
  }
  await page.waitForSelector('#iq-final');
  expect((await attr('#iq-final', 'data-score')) === '9', 'quiz final score 9 / 10');
  await page.click('#iq-again');
  await page.waitForSelector('#iq-q');
  expect((await page.textContent('#iq-score')).trim() === '0', 'play again restarts at 0');

  // --- timed drill (level 2, all right) ---
  await page.click('#dr-l2');
  await page.click('#dr-start');
  await page.waitForSelector('#dr-q');
  for (let i = 0; i < 10; i++) {
    await page.waitForSelector('#dr-q[data-i="' + i + '"]');
    const want = await page.evaluate(() => { const q = document.querySelector('#dr-q'); const v = window.TrigLab.engine.exact(+q.dataset.deg)[q.dataset.fn]; return v === null ? 'ND' : v; });
    await page.click('.dr-opt[data-val="' + want + '"]');
    await page.waitForTimeout(820);
  }
  await page.waitForSelector('#dr-final');
  expect((await attr('#dr-final', 'data-score')) === '10', 'drill: 10 / 10 when every standard value is right');
  expect((await attr('#dr-best', 'data-score')) === '10', 'best score recorded');
  await page.reload();
  await page.waitForSelector('#dr-best');
  expect((await attr('#dr-best', 'data-score')) === '10' && (await attr('#dr-l2', 'aria-pressed')) === 'true', 'best score and level persist');

  // --- worksheet: 12 questions + key ---
  await page.evaluate(() => { window.print = function () { }; });
  await page.click('#ws-print');
  await page.waitForTimeout(200);
  expect((await page.$$eval('#worksheet .ws-q tbody tr', a => a.length)) === 12, 'worksheet has 12 questions');
  const keyOk = await page.evaluate(() => Array.from(document.querySelectorAll('#worksheet .ws-k tbody tr')).every(tr => { const v = window.TrigLab.engine.exact(+tr.dataset.deg)[tr.dataset.fn]; return tr.dataset.ans === (v === null ? 'ND' : v); }));
  expect((await page.$$eval('#worksheet .ws-k tbody tr', a => a.length)) === 12 && keyOk, 'answer key has 12 correct rows');

  // --- reset ---
  await page.evaluate(() => { window.confirm = () => true; });
  await page.click('#reset');
  await page.waitForTimeout(300);
  expect((await deg()) === 30 && !(await page.isHidden('#panel-circle')), 'reset returns to 30° on the circle tab');
  expect((await attr('#dr-best', 'data-score')) === '' , 'reset clears the best score');
  const stored = await page.evaluate(() => JSON.stringify(Object.assign({}, localStorage)));
  expect(!/"hd":\{"cur":"c"/.test(stored), 'saved state cleared and rewritten with defaults');
  log('trigonometry-lab checks done');
};
