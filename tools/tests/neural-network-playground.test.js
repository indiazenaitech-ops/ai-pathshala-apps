/* Interaction test for the Neural Network Playground (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t, log }) {
  const val = async (sel) => Number(await page.getAttribute(sel, 'data-value'));
  const waitVal = (sel, min, timeout) => page.waitForFunction(
    ([s, m]) => Number(document.querySelector(s).getAttribute('data-value')) >= m, [sel, min], { timeout: timeout || 30000 });
  const nodes = () => page.$$eval('.nn-node', (n) => n.length);

  await page.waitForSelector('.nn-node');
  expect(await nodes() === 2 + 4 + 2 + 1, 'default network has 2 inputs, layers 4 and 2, and 1 output');

  // 1) Step = exactly one epoch
  await page.click('#step');
  expect(await val('#epoch') === 1, 'one Step should train exactly one epoch');

  // 2) XOR with no hidden layer cannot be learned by one straight line
  await page.click('#ds-xor');
  expect(await page.getAttribute('#ds-xor', 'aria-pressed') === 'true', 'XOR dataset selected');
  expect(await val('#epoch') === 0, 'changing the dataset restarts training');
  for (let k = 0; k < 4 && (await page.$$('#layer-rows .layer-row')).length > 0; k++) await page.click('#layers-minus');
  expect(await nodes() === 3, 'no hidden layer: 2 inputs + 1 output, got ' + (await nodes()));
  await page.click('#speed button[data-speed="fast"]');
  await page.click('#play');
  await waitVal('#epoch', 200);
  await page.click('#play');
  const accLine = await val('#train-acc');
  log('XOR without hidden layer, training accuracy', accLine);
  expect(accLine < 0.85, 'a single neuron should not solve XOR, accuracy ' + accLine);
  expect(await page.getAttribute('#coach', 'data-code') === 'line', 'coach should explain the straight-line limit');
  expect((await page.textContent('#coach-txt')).trim() === t('coach_line'), 'coach message shown in the current language');

  // 3) add one hidden layer (4 neurons) → XOR is learned
  await page.click('#layers-plus');
  expect(await val('#epoch') === 0, 'changing the network restarts training');
  expect(await nodes() === 2 + 4 + 1, 'one hidden layer of 4 neurons');
  await page.click('#play');
  await waitVal('#train-acc', 0.95);
  await page.click('#play');
  const lossHidden = await val('#train-loss');
  log('XOR with hidden layer, training loss', lossHidden);
  expect(lossHidden < 0.2, 'with a hidden layer the training loss should drop below 0.2, got ' + lossHidden);
  expect((await page.$$('svg path.link')).length === 2 * 4 + 4, 'diagram draws one line per weight');

  // 4) draw your own points, then train on them
  await page.click('#ds-draw');
  expect(await page.isVisible('#draw-box'), 'draw tools visible');
  const box = await page.$eval('#out', (c) => ({ w: c.clientWidth, h: c.clientHeight }));
  await page.click('#tool-orange');
  await page.click('#out', { position: { x: box.w * 0.2, y: box.h * 0.5 } });
  await page.click('#out', { position: { x: box.w * 0.25, y: box.h * 0.3 } });
  await page.click('#tool-blue');
  await page.click('#out', { position: { x: box.w * 0.8, y: box.h * 0.5 } });
  await page.click('#out', { position: { x: box.w * 0.75, y: box.h * 0.7 } });
  expect(await val('#point-count') === 4, 'four points drawn, got ' + (await val('#point-count')));
  await page.click('#play');
  await waitVal('#train-acc', 1);
  await page.click('#play');
  expect(await page.getAttribute('#coach', 'data-code') === 'great_draw', 'coach celebrates learning the drawn points');

  // 5) settings survive a reload
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.nn-node');
  expect(await page.getAttribute('#ds-draw', 'aria-pressed') === 'true', 'draw mode remembered after reload');
  expect(await val('#point-count') === 4, 'drawn points remembered after reload');

  // 6) a challenge button loads its preset (circle + squared inputs, no hidden layer)
  await page.click('#try-3');
  expect(await page.getAttribute('#ds-circle', 'aria-pressed') === 'true', 'challenge 3 picks the circle');
  expect(await page.getAttribute('#feat-x1sq', 'aria-pressed') === 'true' && await page.getAttribute('#feat-x1', 'aria-pressed') === 'false', 'challenge 3 uses x1² and x2² inputs');
  expect((await page.textContent('#layers-count')).trim() === '0', 'challenge 3 has no hidden layer');
  await page.click('#play');
  await waitVal('#test-acc', 0.95);
  await page.click('#play');
  log('circle with squared inputs, test accuracy', await val('#test-acc'));
};
