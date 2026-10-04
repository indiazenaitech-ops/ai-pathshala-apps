/* Interaction test for Lens & Mirror Ray Lab (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t, log }) {
  const res = (k) => page.getAttribute('#results', 'data-' + k);
  const near = (a, b) => Math.abs(Number(a) - b) < 1e-6;
  const txt = async (sel) => (await page.textContent(sel)).trim();
  await page.waitForSelector('#stats .rl-stat');

  // 1) default: concave mirror, f = 10 cm, object 15 cm away (between C and F)
  expect(await res('dev') === 'concave_mirror', 'default device is the concave mirror');
  expect(near(await res('u'), -15) && near(await res('v'), -30), 'u = −15, f = −10 gives v = −30, got v = ' + await res('v'));
  expect(near(await res('m'), -2), 'm = −v/u = −2, got ' + await res('m'));
  expect(await res('real') === 'true' && await res('inverted') === 'true' && await res('size') === 'big', 'real, inverted, enlarged');
  expect(await txt('#img-pos') === t('pos_beyond_c'), 'image position "beyond C" shown in this language');
  expect((await page.textContent('#formula')).includes('1/v = −1/30'), 'formula shows 1/v = −1/30');

  // 2) convex lens, type u = 30 cm → v = +15, m = −0.5, power +10 D
  await page.click('#dev-convex_lens');
  await page.fill('#u-num', '30');
  await page.waitForFunction(() => document.getElementById('results').dataset.u === '-30', null, { timeout: 4000 });
  expect(near(await res('v'), 15) && near(await res('m'), -0.5), 'convex lens u = −30, f = +10: v = +15, m = −0.5');
  expect(await res('row') === 'beyond_2f1', 'object is beyond 2F₁');
  expect((await txt('#out-p')).startsWith('+10'), 'power of a 10 cm convex lens is +10 D: ' + await txt('#out-p'));

  // 3) drag the object on the canvas to 5 cm (magnifying glass)
  await page.$eval('#rl-canvas', (c) => c.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(150);
  const box = await page.$eval('#rl-canvas', (c) => { const r = c.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  const from = await page.evaluate(() => ({ x: RayLab.toPx(RayLab.sol.u), y: RayLab.axisY() }));
  const to = await page.evaluate(() => RayLab.toPx(-5));
  await page.mouse.move(box.x + from.x, box.y + from.y);
  await page.mouse.down();
  await page.mouse.move(box.x + (from.x + to) / 2, box.y + from.y, { steps: 5 });
  await page.mouse.move(box.x + to, box.y + from.y, { steps: 5 });
  await page.mouse.up();
  expect(await res('u') === '-5', 'dragging moved the object to u = −5, got ' + await res('u'));
  expect(near(await res('v'), -10) && near(await res('m'), 2) && await res('real') === 'false' && await res('inverted') === 'false',
    'object inside F of a convex lens: v = −10, m = +2, virtual and erect');
  expect(await txt('#b-nature') === t('nat_virtual'), '"virtual" badge in this language');
  await page.keyboard.press('ArrowLeft');
  expect(await res('u') === '-6', 'arrow key moves the object 1 cm farther');

  // 4) NCERT table row "at 2F₁" → image at 2F₂, same size
  await page.click('#rowbtn-at_2f1');
  expect(near(await res('u'), -20) && near(await res('v'), 20) && near(await res('m'), -1) && await res('size') === 'same', 'at 2F₁: v = +20, m = −1, same size');
  expect(await page.getAttribute('#ncert-body tr.cur', 'data-row') === 'at_2f1', 'current NCERT row highlighted');

  // 5) convex mirror: always virtual, erect, diminished; object at infinity → image at F behind the mirror
  await page.click('#dev-convex_mirror');
  expect(await res('real') === 'false' && await res('size') === 'dim' && Number(await res('v')) > 0 && Number(await res('v')) < 10, 'convex mirror: virtual, diminished, 0 < v < f');
  await page.click('#far');
  expect(await res('row') === 'inf' && near(await res('v'), 10), 'object at infinity: image at F (v = +10)');
  expect(await txt('#img-pos') === t('pos_behind_f'), 'image "at F, behind the mirror"');

  // 6) quiz: a fully right answer, then a wrong one
  const q = await page.evaluate(() => RayLab.quiz());
  await page.selectOption('#q-pos', q.answer.pos);
  await page.click('#q-nat-' + q.answer.nat);
  await page.click('#q-ori-' + q.answer.ori);
  await page.click('#q-size-' + q.answer.size);
  await page.click('#q-check');
  expect(await page.getAttribute('#q-feedback', 'data-right') === '4', 'all four quiz parts marked right');
  expect(await txt('#q-score') === t('q_score', { a: '1', b: '1' }), 'score 1 / 1: ' + await txt('#q-score'));
  await page.click('#q-next');
  const q2 = await page.evaluate(() => RayLab.quiz());
  await page.selectOption('#q-pos', q2.answer.pos);
  await page.click('#q-nat-' + (q2.answer.nat === 'real' ? 'virtual' : 'real'));
  await page.click('#q-ori-' + q2.answer.ori);
  await page.click('#q-size-' + q2.answer.size);
  await page.click('#q-check');
  expect(await page.getAttribute('#q-feedback', 'data-right') === '3', 'wrong nature → 3 of 4 right');
  expect(await txt('#q-score') === t('q_score', { a: '1', b: '2' }), 'score 1 / 2');
  log('quiz', q.dev, q.row, '→', q2.dev, q2.row);

  // 7) state survives a reload
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#stats .rl-stat');
  expect(await res('dev') === 'convex_mirror' && await res('row') === 'inf', 'device and object position remembered after reload');
  expect(await txt('#q-score') === t('q_score', { a: '1', b: '2' }), 'quiz score remembered');
};
