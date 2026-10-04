/* Interaction test for Area & Volume Lab (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, t, log }) {
  const near = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 0.011 : tol);
  const val = async (sel) => Number(await page.getAttribute(sel, 'data-value'));

  await page.waitForSelector('#shape-list .chip');

  // 1) rectangle 12 × 5: area 60, perimeter 34, diagonal 13; drawing labelled; area in m²
  await page.click('#grp-2d');
  await page.click('#shape-rectangle');
  await page.fill('#in-l', '12');
  await page.fill('#in-b', '5');
  expect(near(await val('#res-area'), 60), 'rectangle 12 × 5 has area 60');
  expect(near(await val('#res-perimeter'), 34), 'rectangle 12 × 5 has perimeter 34');
  expect(near(await val('#res-diagonal'), 13), 'rectangle 12 × 5 has diagonal 13');
  const fig = await page.textContent('#figure svg');
  expect(fig.includes('l = 12 cm') && fig.includes('b = 5 cm'), 'drawing is labelled with the measurements: ' + fig);
  expect(near(Number(await page.getAttribute('#conv tr[data-unit="m²"]', 'data-value')), 0.006, 1e-9), '60 cm² = 0.006 m²');

  // 2) Heron's formula 13, 14, 15 → s = 21, area 84; impossible triangle shows an error in this language
  await page.click('#shape-tri_heron');
  await page.fill('#in-a', '13'); await page.fill('#in-b', '14'); await page.fill('#in-c', '15');
  expect(near(await val('#res-s'), 21) && near(await val('#res-area'), 84), 'Heron 13-14-15: s = 21, area = 84');
  await page.fill('#in-c', '40');
  expect(await page.isVisible('#calc-error'), 'sides 13, 14, 40 cannot make a triangle → error shown');
  expect((await page.textContent('#calc-error')).trim() === t('err_triangle'), 'triangle error is in this language');
  expect(!(await page.isVisible('#results')), 'no answers are shown for an impossible triangle');
  expect(await page.getAttribute('#in-c', 'aria-invalid') === 'true' && await page.getAttribute('#in-a', 'aria-invalid') === 'true', 'the sides of an impossible triangle are marked as wrong');
  await page.fill('#in-c', '15');
  expect(near(await val('#res-area'), 84), 'fixing the side brings the answer back');
  expect(await page.getAttribute('#in-c', 'aria-invalid') === 'false', 'the side is no longer marked once the triangle is possible');

  // 2b) ring with R ≤ r: both radii are marked; digits typed on a Hindi keyboard work
  await page.click('#shape-ring');
  await page.fill('#in-R', '7'); await page.fill('#in-r', '7');
  expect(await page.getAttribute('#calc-error', 'data-err') === 'err_ring', 'ring with R = r shows the ring error');
  expect(await page.getAttribute('#in-R', 'aria-invalid') === 'true' && await page.getAttribute('#in-r', 'aria-invalid') === 'true', 'both radii are marked for R = r');
  await page.click('#shape-circle');
  await page.fill('#in-r', '७');   // Devanagari 7
  expect(near(await val('#res-area'), 154) && near(await val('#res-circumference'), 44), 'r typed as Devanagari 7 gives area 154 and circumference 44');
  await page.fill('#in-r', '7');

  // 3) cylinder r = 7, h = 10: V 1540, CSA 440, TSA 748 with π = 22/7; 1538.6 with 3.14
  await page.click('#grp-3d');
  await page.click('#shape-cylinder');
  await page.click('#pi-227');
  await page.fill('#in-r', '7'); await page.fill('#in-h', '10');
  expect(near(await val('#res-volume'), 1540) && near(await val('#res-csa'), 440) && near(await val('#res-tsa'), 748), 'cylinder 7 × 10 with 22/7');
  const work = await page.textContent('#working');
  expect(work.includes('π × r² × h') && work.includes('22/7 × 7² × 10'), 'working shows the formula and the substituted values');
  await page.click('#pi-314');
  expect(near(await val('#res-volume'), 1538.6) && near(await val('#res-csa'), 439.6), 'with π = 3.14 the volume is 1538.6');
  await page.click('#pi-227');

  // 3b) a tiny radius: the working never rounds r³ down to 0
  await page.click('#shape-sphere');
  await page.fill('#in-r', '0.001');
  const tiny = await page.textContent('#working');
  expect(tiny.includes('10⁻⁹') && !/× 0(?![.\d])/.test(tiny), 'working for r = 0.001 shows r³ = 1 × 10⁻⁹, not 0: ' + tiny.slice(0, 120));
  await page.fill('#in-r', '7');
  expect(near(await val('#res-volume'), 1437.33) && near(await val('#res-sa'), 616), 'sphere r = 7: V ≈ 1437.33, S = 616');

  // 4) cone r = 7, h = 24 → l = 25, CSA 550, TSA 704, V 1232; switching to metres gives litres
  await page.click('#shape-cone');
  await page.fill('#in-r', '7'); await page.fill('#in-h', '24');
  expect(near(await val('#res-slant'), 25) && near(await val('#res-csa'), 550) && near(await val('#res-tsa'), 704) && near(await val('#res-volume'), 1232), 'cone 7, 24: l 25, CSA 550, TSA 704, V 1232');
  await page.click('#unit-seg [data-unit="m"]');
  expect(near(Number(await page.getAttribute('#conv tr[data-unit="L"]', 'data-value')), 1232000, 0.5), '1232 m³ = 12,32,000 litres');
  await page.click('#unit-seg [data-unit="cm"]');

  // 4b) frustum r₁ = 14, r₂ = 7, h = 24 (Class 10): l = 25, V = 8624, CSA = 1650, TSA = 1650 + 770 = 2420
  await page.click('#shape-frustum');
  await page.fill('#in-r1', '14'); await page.fill('#in-r2', '7'); await page.fill('#in-h', '24');
  expect(near(await val('#res-slant'), 25) && near(await val('#res-volume'), 8624) && near(await val('#res-csa'), 1650) && near(await val('#res-tsa'), 2420), 'frustum 14, 7, 24: l 25, V 8624, CSA 1650, TSA 2420');

  // 4c) every drawing keeps its labels inside the picture, also for flat or thin shapes
  const outside = await page.evaluate(() => {
    const cases = [['tri_bh', { b: 30, h: 1 }], ['parallelogram', { b: 2, a: 10, h: 3 }], ['parallelogram', { b: 40, a: 5, h: 1 }], ['trapezium', { a: 10, b: 30, h: 2 }],
      ['rhombus', { d1: 16, d2: 12 }], ['rhombus', { d1: 3, d2: 40 }], ['ring', { R: 13, r: 11 }], ['cuboid', { l: 25, b: 3, h: 2 }],
      ['cone', { r: 35, h: 12 }], ['cone', { r: 10, h: 2 }], ['frustum', { r1: 12, r2: 7, h: 5 }], ['frustum', { r1: 2, r2: 10, h: 3 }], ['frustum', { r1: 12, r2: 7, h: 1 }]];
    const box = document.createElement('div'); box.style.cssText = 'position:absolute;left:0;top:0;width:480px;visibility:hidden';
    document.body.appendChild(box);
    const bad = [];
    cases.forEach(([sh, v]) => [false, true].forEach(small => {
      box.innerHTML = window.ML_DRAW(sh, v, { lab: (s) => s + ' = 88 cm', small, fs: small ? 19 : 22 });
      const svg = box.querySelector('svg'), vb = svg.viewBox.baseVal;
      if (!svg.querySelector('path,polygon,circle,ellipse')) bad.push(sh + ': nothing drawn');
      svg.querySelectorAll('text').forEach(tx => {
        const b = tx.getBBox(), m = 1;
        if (!tx.getAttribute('transform') && (b.x < -m || b.y < -m || b.x + b.width > vb.width + m || b.y + b.height > vb.height + m)) bad.push(sh + (small ? ' (small)' : '') + ': ' + tx.textContent);
      });
    }));
    box.remove();
    return bad;
  });
  expect(outside.length === 0, 'drawing labels stay inside the picture: ' + outside.join(' | '));

  // 5) practice: a right answer and a wrong answer update the score
  await page.click('#tab-practice');
  await page.waitForSelector('#prac-card', { state: 'visible' });
  // an empty answer asks for a number (a warning, not a wrong answer) and stays so after a language change
  await page.fill('#q-ans', '');
  await page.click('#q-check');
  expect(await page.getAttribute('#q-feedback', 'data-result') === 'empty' && (await page.getAttribute('#q-feedback', 'class')).includes('warning'), 'empty answer gives the "type a number" warning');
  expect(await page.getAttribute('#score', 'data-n') === '0', 'an empty answer is not counted');
  const other = lang === 'hi' ? 'ta' : 'hi';
  await page.selectOption('#edu-lang', other);
  expect(await page.getAttribute('#q-feedback', 'data-result') === 'empty' && (await page.getAttribute('#q-feedback', 'class')).includes('warning'), 'the warning is still a warning after switching language');
  await page.selectOption('#edu-lang', lang);
  expect((await page.textContent('#q-feedback')).trim() === t('pr_enter'), 'the warning is back in this language');

  const answer = await page.getAttribute('#prac-card', 'data-answer');
  log('practice question', await page.getAttribute('#prac-card', 'data-shape'), await page.getAttribute('#prac-card', 'data-k'), answer);
  await page.fill('#q-ans', answer + ' cm²');
  await page.click('#q-check');
  expect(await page.getAttribute('#q-feedback', 'data-result') === 'right', 'the exact answer (typed with a unit after it) is marked right');
  expect(await page.getAttribute('#score', 'data-c') === '1' && await page.getAttribute('#score', 'data-n') === '1', 'score is 1 out of 1');
  expect(await page.isVisible('#q-solution .ml-step'), 'solution is shown after checking');
  await page.click('#q-check');
  expect(await page.getAttribute('#score', 'data-n') === '1', 'checking the same question again does not change the score');
  await page.click('#q-new');
  expect(await page.getAttribute('#q-feedback', 'data-result') === null && !(await page.isVisible('#q-solution')), 'a new question starts with no feedback and no solution');
  const a2 = Number(await page.getAttribute('#prac-card', 'data-answer'));
  await page.fill('#q-ans', String(a2 + 1000));
  await page.click('#q-check');
  expect(await page.getAttribute('#q-feedback', 'data-result') === 'wrong', 'a far-off answer is marked wrong');
  expect(await page.getAttribute('#score', 'data-c') === '1' && await page.getAttribute('#score', 'data-n') === '2', 'score is 1 out of 2');
  await page.click('#q-new');
  const qShape = await page.getAttribute('#prac-card', 'data-shape'), qAns = await page.getAttribute('#prac-card', 'data-answer');

  // practice numbers stay textbook-friendly and the drawings in proportion
  const genBad = await page.evaluate(() => {
    const S = window.ML_SHAPES, bad = [];
    for (let i = 0; i < 300; i++) {
      ['227', '314'].forEach(pm => {
        const t = S.gen('tri_bh', pm); if (t.b > 3 * t.h || t.h > 3 * t.b) bad.push('tri_bh ' + JSON.stringify(t));
        const p = S.gen('parallelogram', pm), off = Math.sqrt(p.a * p.a - p.h * p.h); if (p.h >= p.a || off > p.b || p.b > 3 * p.h + 3) bad.push('para ' + JSON.stringify(p));
        const z = S.gen('trapezium', pm); if (z.a > 4 * z.h || z.b >= z.a) bad.push('trap ' + JSON.stringify(z));
        const c = S.gen('cone', pm); if (c.r > 3 * c.h || !Number.isInteger(Math.sqrt(c.r * c.r + c.h * c.h))) bad.push('cone ' + JSON.stringify(c));
        const r = S.gen('ring', pm); if (r.R <= r.r || (r.R - r.r) < 0.15 * r.R) bad.push('ring ' + JSON.stringify(r));
        const f = S.gen('frustum', pm); if (!Number.isInteger(Math.sqrt(f.h * f.h + (f.r1 - f.r2) ** 2))) bad.push('frustum ' + JSON.stringify(f));
        const h = S.gen('tri_heron', pm); const s = (h.a + h.b + h.c) / 2, ar = Math.sqrt(s * (s - h.a) * (s - h.b) * (s - h.c)); if (!Number.isInteger(Math.round(ar * 1e6) / 1e6)) bad.push('heron ' + JSON.stringify(h));
      });
    }
    return bad.slice(0, 5);
  });
  expect(genBad.length === 0, 'generated practice numbers are sensible: ' + genBad.join(' | '));

  // 6) worksheet with answer key (folded on screen)
  await page.click('#ws-make');
  expect((await page.$$('#ws-list .ws-item')).length === 10 && (await page.$$('#ws-key li')).length === 10, 'worksheet has 10 questions and 10 answers');
  expect((await page.$$('#ws-list svg.fig')).length === 10, 'every worksheet question has a drawing');
  expect(!(await page.isVisible('#ws-key')), 'the answer key is folded so students do not see it on the board');
  const wsShapes = await page.$$eval('#ws-list .ws-item h4', hs => hs.map(h => h.textContent));
  expect(new Set(wsShapes).size === 10, 'the 10 worksheet questions use 10 different shapes when "both" is chosen');
  await page.click('#ws-keybox summary');
  expect(await page.isVisible('#ws-key li'), 'the answer key opens when tapped');
  const firstKey = await page.textContent('#ws-key li');

  // 7) unit converter: 2 m³ = 2000 litres
  await page.click('#tab-units');
  await page.click('#cv-vol');
  await page.fill('#cv-value', '2');
  await page.selectOption('#cv-from', 'm³');
  expect(near(Number(await page.getAttribute('#cv-table tr[data-unit="L"]', 'data-value')), 2000, 1e-6), '2 m³ = 2000 L');
  expect(near(Number(await page.getAttribute('#cv-table tr[data-unit="cm³"]', 'data-value')), 2000000, 1e-3), '2 m³ = 20,00,000 cm³');
  await page.click('#cv-area');
  await page.fill('#cv-value', '1');
  await page.selectOption('#cv-from', 'ha');
  expect(near(Number(await page.getAttribute('#cv-table tr[data-unit="m²"]', 'data-value')), 10000, 1e-6), '1 hectare = 10,000 m²');
  await page.click('#cv-vol');

  // 8) settings, the practice question and the worksheet survive a reload
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#cv-table tr');
  expect(await page.isVisible('#pane-units') && await page.getAttribute('#cv-vol', 'aria-pressed') === 'true', 'converter tab and kind remembered');
  await page.click('#tab-practice');
  expect(await page.getAttribute('#prac-card', 'data-shape') === qShape && await page.getAttribute('#prac-card', 'data-answer') === qAns, 'the practice question is the same after a reload');
  expect(await page.getAttribute('#score', 'data-c') === '1' && await page.getAttribute('#score', 'data-n') === '2', 'score remembered after reload');
  expect((await page.$$('#ws-list .ws-item')).length === 10 && (await page.textContent('#ws-key li')) === firstKey, 'the worksheet and its answer key are still there after a reload');
  await page.click('#tab-calc');
  expect(await page.getAttribute('#shape-frustum', 'aria-pressed') === 'true' && near(await val('#res-slant'), 25), 'frustum with its values remembered after reload');
};
