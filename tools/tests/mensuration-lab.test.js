/* Interaction test for Area & Volume Lab (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t, log }) {
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
  await page.fill('#in-c', '15');
  expect(near(await val('#res-area'), 84), 'fixing the side brings the answer back');

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

  // 4) cone r = 7, h = 24 → l = 25, CSA 550, TSA 704, V 1232; switching to metres gives litres
  await page.click('#shape-cone');
  await page.fill('#in-r', '7'); await page.fill('#in-h', '24');
  expect(near(await val('#res-slant'), 25) && near(await val('#res-csa'), 550) && near(await val('#res-tsa'), 704) && near(await val('#res-volume'), 1232), 'cone 7, 24: l 25, CSA 550, TSA 704, V 1232');
  await page.click('#unit-seg [data-unit="m"]');
  expect(near(Number(await page.getAttribute('#conv tr[data-unit="L"]', 'data-value')), 1232000, 0.5), '1232 m³ = 12,32,000 litres');
  await page.click('#unit-seg [data-unit="cm"]');

  // 5) practice: a right answer and a wrong answer update the score
  await page.click('#tab-practice');
  await page.waitForSelector('#prac-card', { state: 'visible' });
  const answer = await page.getAttribute('#prac-card', 'data-answer');
  log('practice question', await page.getAttribute('#prac-card', 'data-shape'), await page.getAttribute('#prac-card', 'data-k'), answer);
  await page.fill('#q-ans', answer);
  await page.click('#q-check');
  expect(await page.getAttribute('#q-feedback', 'data-result') === 'right', 'the exact answer is marked right');
  expect(await page.getAttribute('#score', 'data-c') === '1' && await page.getAttribute('#score', 'data-n') === '1', 'score is 1 out of 1');
  expect(await page.isVisible('#q-solution .ml-step'), 'solution is shown after checking');
  await page.click('#q-new');
  const a2 = Number(await page.getAttribute('#prac-card', 'data-answer'));
  await page.fill('#q-ans', String(a2 + 1000));
  await page.click('#q-check');
  expect(await page.getAttribute('#q-feedback', 'data-result') === 'wrong', 'a far-off answer is marked wrong');
  expect(await page.getAttribute('#score', 'data-c') === '1' && await page.getAttribute('#score', 'data-n') === '2', 'score is 1 out of 2');

  // 6) worksheet with answer key
  await page.click('#ws-make');
  expect((await page.$$('#ws-list .ws-item')).length === 10 && (await page.$$('#ws-key li')).length === 10, 'worksheet has 10 questions and 10 answers');
  expect((await page.$$('#ws-list svg.fig')).length === 10, 'every worksheet question has a drawing');

  // 7) unit converter: 2 m³ = 2000 litres
  await page.click('#tab-units');
  await page.click('#cv-vol');
  await page.fill('#cv-value', '2');
  await page.selectOption('#cv-from', 'm³');
  expect(near(Number(await page.getAttribute('#cv-table tr[data-unit="L"]', 'data-value')), 2000, 1e-6), '2 m³ = 2000 L');
  expect(near(Number(await page.getAttribute('#cv-table tr[data-unit="cm³"]', 'data-value')), 2000000, 1e-3), '2 m³ = 20,00,000 cm³');

  // 8) settings survive a reload
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#cv-table tr');
  expect(await page.isVisible('#pane-units') && await page.getAttribute('#cv-vol', 'aria-pressed') === 'true', 'converter tab and kind remembered');
  await page.click('#tab-calc');
  expect(await page.getAttribute('#shape-cone', 'aria-pressed') === 'true' && near(await val('#res-slant'), 25), 'cone with its values remembered after reload');
};
