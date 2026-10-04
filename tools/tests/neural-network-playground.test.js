/* Interaction test for the Neural Network Playground (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t, log }) {
  const val = async (sel) => Number(await page.getAttribute(sel, 'data-value'));
  const waitVal = (sel, min, timeout) => page.waitForFunction(
    ([s, m]) => Number(document.querySelector(s).getAttribute('data-value')) >= m, [sel, min], { timeout: timeout || 30000 });
  const waitBelow = (sel, max, timeout) => page.waitForFunction(
    ([s, m]) => { const v = document.querySelector(s).getAttribute('data-value'); return v !== '' && Number(v) < m; }, [sel, max], { timeout: timeout || 30000 });
  const nodes = () => page.$$eval('.nn-node', (n) => n.length);
  const code = () => page.getAttribute('#coach', 'data-code');
  const steps = (n) => page.evaluate((k) => { for (let i = 0; i < k; i++) document.getElementById('step').click(); }, n);
  const corner = () => page.$eval('#out', (c) => Array.from(c.getContext('2d').getImageData(3, 3, 1, 1).data).slice(0, 3).join(','));

  await page.waitForSelector('.nn-node');
  expect(await nodes() === 2 + 4 + 2 + 1, 'default network has 2 inputs, layers 4 and 2, and 1 output');

  // 1) Step = exactly one epoch; a new learning rate starts again from epoch 0
  await page.click('#step');
  expect(await val('#epoch') === 1, 'one Step should train exactly one epoch');
  await page.click('#step');
  expect(await val('#epoch') === 2, 'two Steps = two epochs');
  await page.selectOption('#lr', '0.1');
  expect(await val('#epoch') === 0, 'changing the learning rate restarts training, got epoch ' + (await val('#epoch')));
  await page.selectOption('#lr', '0.03');

  // 2) the picture is redrawn with the new colours when the theme changes
  const before = await corner();
  await page.click('#edu-theme');
  await page.waitForTimeout(150);
  const after = await corner();
  expect(before !== after, 'output picture redrawn on theme change (' + before + ' → ' + after + ')');
  await page.click('#edu-theme');
  await page.waitForTimeout(150);
  expect(await corner() === before, 'switching the theme back restores the light colours');

  // 3) XOR with no hidden layer cannot be learned by one straight line
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
  expect(await code() === 'line', 'coach should explain the straight-line limit');
  expect((await page.textContent('#coach-txt')).trim() === t('coach_line'), 'coach message shown in the current language');

  // 4) add one hidden layer (4 neurons) → XOR is learned
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
  // tapping a hidden neuron shows its picture and its formula
  await page.click('.nn-node[data-l="1"][data-i="0"]');
  expect(await page.isVisible('#preview-bar'), 'preview bar shown for a hidden neuron');
  expect((await page.textContent('#preview-txt')).trim() === t('preview_hidden', { n: 1, l: 1 }), 'preview bar names the neuron');
  expect(/^y = tanh\(.*x₁.*x₂.*\)$/.test((await page.textContent('#ins-formula')).trim()), 'inspector shows the neuron formula with x₁ and x₂');
  await page.click('#preview-close');
  expect(!(await page.isVisible('#preview-bar')), 'Show output hides the preview bar');

  // 5) draw your own points, then train on them
  await page.click('#ds-draw');
  expect(await page.isVisible('#draw-box'), 'draw tools visible');
  expect(!(await page.isVisible('#show-test-lbl')), 'no "show test points" option for drawn points (they are all training points)');
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
  expect(await code() === 'great_draw', 'coach celebrates learning the drawn points');

  // 6) settings survive a reload
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.nn-node');
  expect(await page.getAttribute('#ds-draw', 'aria-pressed') === 'true', 'draw mode remembered after reload');
  expect(await val('#point-count') === 4, 'drawn points remembered after reload');

  // 7) a challenge button loads its preset (circle + squared inputs, no hidden layer)
  await page.click('#try-3');
  expect(await page.getAttribute('#ds-circle', 'aria-pressed') === 'true', 'challenge 3 picks the circle');
  expect(await page.getAttribute('#feat-x1sq', 'aria-pressed') === 'true' && await page.getAttribute('#feat-x1', 'aria-pressed') === 'false', 'challenge 3 uses x1² and x2² inputs');
  expect((await page.textContent('#layers-count')).trim() === '0', 'challenge 3 has no hidden layer');
  expect(/^y = tanh\(.*x₁².*x₂².*\)$/.test((await page.textContent('#ins-formula')).trim()), 'the single neuron uses x₁² and x₂²');
  await page.click('#play');
  await waitVal('#test-acc', 0.95);
  await page.click('#play');
  log('circle with squared inputs, test accuracy', await val('#test-acc'));

  // 8) challenge 6: a giant learning rate; then 0.03 learns from a fresh start
  await page.click('#try-6');
  expect(await page.inputValue('#lr') === '3', 'challenge 6 sets learning rate 3');
  await steps(60);
  const bigLoss = await val('#train-loss');
  log('learning rate 3 after 60 epochs, training loss', bigLoss);
  expect(bigLoss <= 0.1 || await code() === 'big_lr', 'coach explains the giant learning rate (loss ' + bigLoss + ', coach ' + (await code()) + ')');
  if (await code() === 'big_lr') expect((await page.textContent('#coach-txt')).trim() === t('coach_big_lr'), 'big learning rate message translated');
  await page.selectOption('#lr', '0.03');
  expect(await val('#epoch') === 0, 'choosing 0.03 starts again, so a stuck network does not stay stuck');
  await page.click('#speed button[data-speed="fast"]');
  await page.click('#play');
  await waitBelow('#train-loss', 0.05);
  await page.click('#play');
  const smallLoss = await val('#train-loss');
  log('learning rate 0.03, training loss', smallLoss);
  expect(smallLoss < 0.1, 'with learning rate 0.03 the circle is learned, loss ' + smallLoss);
  expect(await code() === 'great', 'coach celebrates, got ' + (await code()));

  // 9) a shared setup link is applied, removed from the address bar, remembered, and keeps the student's own points
  const setup = await page.evaluate(() => EDU.pack({ ds: 'spiral', layers: [6, 6, 6], act: 'relu', lr: 0.1, feats: ['x1', 'x2', 'sin1'], noise: 10, split: 70 }));
  const u = new URL(page.url()); u.searchParams.set('setup', setup);
  await page.goto(u.toString(), { waitUntil: 'load' });
  await page.waitForSelector('.nn-node');
  expect(await page.getAttribute('#ds-spiral', 'aria-pressed') === 'true', 'shared setup: spiral');
  expect(await nodes() === 3 + 6 + 6 + 6 + 1, 'shared setup: 3 inputs and three layers of 6, got ' + (await nodes()));
  expect(await page.inputValue('#lr') === '0.1' && await page.inputValue('#act') === 'relu' && await page.inputValue('#split') === '70', 'shared setup: learning rate, activation and split');
  expect(!/setup=/.test(page.url()), 'setup parameter removed from the address');
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.nn-node');
  expect(await page.getAttribute('#ds-spiral', 'aria-pressed') === 'true', 'shared setup remembered after reload');
  await page.click('#ds-draw');
  expect(await val('#point-count') === 4, 'the student\'s own drawn points are kept');
};
