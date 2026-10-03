/* Interaction test for "Teach the Computer (Image AI)".
   UI flows (classes, rename, presets, limits, reset) always run.
   The camera + model part runs only if the AI model downloads within ~60 s. */
module.exports = async function ({ page, lang, expect, t, log }) {
  const cls = (i, sel) => `#classes .cls:nth-child(${i})${sel ? ' ' + sel : ''}`;
  const count = () => page.$$eval('#classes .cls', els => els.length);
  const examples = async i => parseInt(await page.getAttribute(cls(i, '.cls-count'), 'data-n'), 10);

  // 1) starts with two localized default classes
  expect(await count() === 2, 'should start with 2 classes');
  const first = await page.inputValue(cls(1, '.cls-name'));
  expect(first === t('n_thumbs_up'), `default class 1 name should be "${t('n_thumbs_up')}", got "${first}"`);

  // 2) add a class -> default numbered name
  await page.click('#addClass');
  expect(await count() === 3, 'Add class should give 3 classes');
  const third = await page.inputValue(cls(3, '.cls-name'));
  expect(third === t('class_n', { n: 3 }), `new class should be named "${t('class_n', { n: 3 })}", got "${third}"`);

  // 3) rename -> shows in the prediction bars and is saved
  await page.fill(cls(3, '.cls-name'), 'Pen');
  const barName = (await page.textContent('#bars .bar-row:nth-child(3) .bar-name')).trim();
  expect(barName === 'Pen', 'renamed class should appear in the confidence bars, got ' + barName);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.teachable-machine.classes') || 'null'));
  expect(Array.isArray(stored) && stored.length === 3 && stored[2].custom === 'Pen', 'classes should be saved with the new name');

  // 4) remove the empty class
  await page.click(cls(3, '.del-btn'));
  expect(await count() === 2, 'Remove should leave 2 classes');
  expect(await page.isDisabled(cls(1, '.del-btn')), 'cannot remove below 2 classes');

  // 5) ready-made set (Rock / Paper / Scissors / Nothing)
  await page.selectOption('#preset', '1');
  expect(await count() === 4, 'preset should create 4 classes');
  const rock = await page.inputValue(cls(1, '.cls-name'));
  expect(rock === t('n_rock'), `preset class 1 should be "${t('n_rock')}", got "${rock}"`);
  await page.click('#addClass');
  expect(await count() === 5 && await page.isDisabled('#addClass'), 'max 5 classes, then Add is disabled');

  // 6) the AI part (needs the CDN + model download)
  let ready = false;
  try { await page.waitForSelector('#modelState[data-state="ready"]', { timeout: 60000 }); ready = true; }
  catch (e) { ready = false; }
  if (!ready) {
    const st = await page.getAttribute('#modelState', 'data-state');
    log(`AI model not ready within 60 s (state=${st}) - skipped the camera/recording part`);
  } else {
    await page.click('#camStart');
    await page.waitForFunction(() => { const v = document.getElementById('video'); return v && !v.hidden && v.readyState >= 2 && v.videoWidth > 0; }, null, { timeout: 20000 });

    const hold = async (i, ms) => {
      const box = await (await page.$(cls(i, '.hold-btn'))).boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(ms);
      await page.mouse.up();
      await page.waitForTimeout(150);
    };
    await hold(1, 1500);
    const n1 = await examples(1);
    expect(n1 >= 3, 'holding "record" should add several examples to class 1, got ' + n1);
    const thumbs1 = await page.$$eval(cls(1, '.thumbs img'), els => els.length);
    expect(thumbs1 === Math.min(n1, 24), `class 1 should show ${Math.min(n1, 24)} thumbnails, got ${thumbs1}`);
    expect((await page.textContent(cls(1, '.cls-count'))).includes(String(n1)), 'count badge shows the number');

    await hold(2, 1200);
    const n2 = await examples(2);
    expect(n2 >= 3, 'class 2 should get examples, got ' + n2);

    // keyboard: hold "3" to record into class 3
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.down('3');
    await page.waitForTimeout(800);
    await page.keyboard.up('3');
    await page.waitForTimeout(150);
    const n3 = await examples(3);
    expect(n3 >= 1, 'holding key 3 should record into class 3, got ' + n3);

    // live prediction appears with confidences that add up to ~100 %
    await page.waitForFunction(() => /\d/.test((document.getElementById('winnerSub') || {}).textContent || ''), null, { timeout: 20000 });
    await page.waitForTimeout(600);
    const pcts = await page.$$eval('#bars .bar-pct', els => els.map(e => parseInt(e.textContent.replace(/[^\d]/g, ''), 10) || 0));
    const sum = pcts.reduce((a, b) => a + b, 0);
    expect(sum >= 96 && sum <= 104, 'confidence bars should add up to about 100%, got ' + pcts.join(','));
    const camLabelShown = await page.isVisible('#camLabel');
    expect(camLabelShown, 'prediction label should be shown on the camera');

    // upload photos into class 4 (file chooser)
    const b64 = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 80; c.height = 60; const x = c.getContext('2d'); x.fillStyle = '#c33'; x.fillRect(0, 0, 80, 60); x.fillStyle = '#fff'; x.fillRect(20, 15, 40, 30); return c.toDataURL('image/png').split(',')[1]; });
    const png = Buffer.from(b64, 'base64');
    const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 10000 }), page.click(cls(4, '.upl-btn'))]);
    await chooser.setFiles([{ name: 'a.png', mimeType: 'image/png', buffer: png }, { name: 'b.png', mimeType: 'image/png', buffer: png }, { name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') }]);
    await page.waitForFunction(() => document.querySelector('#classes .cls:nth-child(4) .cls-count').getAttribute('data-n') === '2', null, { timeout: 15000 });
    log(`recorded ${n1}/${n2}/${n3} examples, bars ${pcts.join('/')}`);

    // save the model to a file, reset, then open it again: classes + examples come back
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#saveModel')]);
    const file = await download.path();
    await page.click('#resetAll');
    expect(await count() === 2 && await examples(1) === 0, 'Reset clears classes and examples');
    const [chooser2] = await Promise.all([page.waitForEvent('filechooser', { timeout: 10000 }), page.click('#openModel')]);
    await chooser2.setFiles(file);
    await page.waitForFunction(() => document.querySelectorAll('#classes .cls').length === 5, null, { timeout: 15000 });
    const back = [await examples(1), await examples(2), await examples(3), await examples(4)];
    expect(back[0] === n1 && back[1] === n2 && back[2] === n3 && back[3] === 2, `opened model should restore counts ${n1}/${n2}/${n3}/2, got ${back.join('/')}`);
    expect((await page.inputValue(cls(1, '.cls-name'))) === t('n_rock'), 'opened model restores class names');

    // clear class 1 (confirm dialog is auto-accepted)
    await page.click(cls(1, '.clr-btn'));
    expect(await examples(1) === 0, 'Clear should empty class 1');
    expect(await page.$$eval(cls(1, '.thumbs img'), els => els.length) === 0, 'Clear removes thumbnails');
  }

  // 7) reset everything
  await page.click('#resetAll');
  expect(await count() === 2, 'Reset should go back to 2 classes');
  const again = await page.inputValue(cls(1, '.cls-name'));
  expect(again === t('n_thumbs_up'), 'Reset restores the default names');
};
