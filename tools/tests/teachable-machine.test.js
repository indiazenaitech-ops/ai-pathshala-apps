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
  expect(await page.isDisabled(cls(1, '.clr-btn')), 'Clear is disabled while a class has no examples');
  const order = await page.$$eval('#lab > .card', els => els.map(e => e.id).join(','));
  expect(order === 'camCard,teachCard,testCard', 'reading / keyboard order should be camera, teach, test: ' + order);

  // full screen (smartboard): messages must be shown inside the full-screen lab, not hidden behind it
  await page.click('#fsBtn');
  await page.waitForTimeout(300);
  if (await page.evaluate(() => !!document.fullscreenElement && document.fullscreenElement.id === 'lab')) {
    expect(await page.getAttribute('#fsBtn', 'aria-pressed') === 'true', 'Full screen button shows it is on');
    await page.click(cls(1, '.hold-btn'));   // no camera yet -> a message
    const inLab = await page.evaluate(() => { const w = document.querySelector('.edu-toast-wrap'); return !!w && document.getElementById('lab').contains(w) && w.textContent.length > 0; });
    expect(inLab, 'in full screen the message should appear inside the lab');
    await page.evaluate(() => document.exitFullscreen());
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.querySelector('.edu-toast-wrap').parentNode === document.body), 'after full screen the messages go back to the page');
  } else log('full screen not available in this browser - skipped the full-screen message check');

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

    // one recording at a time: a second press (another child on a multi-touch board, or the mouse)
    // must neither record into its class nor stop the recording that is already running
    await page.keyboard.down('3');
    await page.waitForTimeout(300);
    await page.click(cls(2, '.hold-btn'));
    const midA = await examples(3);
    await page.waitForTimeout(600);
    const midB = await examples(3);
    await page.keyboard.up('3');
    await page.waitForTimeout(250);
    const after3 = await examples(3);
    expect(await examples(2) === n2, 'pressing class 2 during a recording must not add to class 2');
    expect(midB - midA >= 3, `the recording of class 3 must go on after the other button is released (${midA} -> ${midB})`);
    await page.waitForTimeout(400);
    expect(await examples(3) === after3, 'releasing key 3 stops the recording');
    const n3b = after3;

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
    log(`recorded ${n1}/${n2}/${n3b} examples, bars ${pcts.join('/')}`);

    // save the model to a file, reset, then open it again: classes + examples come back
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#saveModel')]);
    const file = await download.path();
    await page.click('#resetAll');
    expect(await count() === 2 && await examples(1) === 0, 'Reset clears classes and examples');
    const [chooser2] = await Promise.all([page.waitForEvent('filechooser', { timeout: 10000 }), page.click('#openModel')]);
    await chooser2.setFiles(file);
    await page.waitForFunction(() => document.querySelectorAll('#classes .cls').length === 5, null, { timeout: 15000 });
    const back = [await examples(1), await examples(2), await examples(3), await examples(4)];
    expect(back[0] === n1 && back[1] === n2 && back[2] === n3b && back[3] === 2, `opened model should restore counts ${n1}/${n2}/${n3b}/2, got ${back.join('/')}`);
    expect((await page.inputValue(cls(1, '.cls-name'))) === t('n_rock'), 'opened model restores class names');

    // clear class 1 (confirm dialog is auto-accepted)
    await page.click(cls(1, '.clr-btn'));
    expect(await examples(1) === 0, 'Clear should empty class 1');
    expect(await page.$$eval(cls(1, '.thumbs img'), els => els.length) === 0, 'Clear removes thumbnails');

    // smartboard (1280 x 800): camera + result columns stay in view while scrolling down to class 5
    await page.evaluate(() => document.querySelector('#classes .cls:nth-child(5)').scrollIntoView({ block: 'end' }));
    await page.waitForTimeout(300);
    const pin = await page.evaluate(() => ({ y: window.scrollY, cam: document.getElementById('camCard').getBoundingClientRect().top, test: document.getElementById('testCard').getBoundingClientRect().top, hdr: document.querySelector('.edu-top').offsetHeight }));
    expect(pin.y > 100 && pin.cam >= 0 && pin.cam <= pin.hdr + 20 && pin.test <= pin.hdr + 20, 'camera and result cards should stay pinned below the header when scrolling to class 5: ' + JSON.stringify(pin));

    // phone: the pinned camera card is compact (header + camera leave at least half the screen)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(300);
    const ph = await page.evaluate(() => { const c = document.getElementById('camCard'), r = c.getBoundingClientRect(); return { pos: getComputedStyle(c).position, top: Math.round(r.top), h: Math.round(r.height), hdr: document.querySelector('.edu-top').offsetHeight, over: document.documentElement.scrollWidth - window.innerWidth }; });
    expect(ph.pos === 'sticky' && Math.abs(ph.top - ph.hdr) <= 3, 'phone: camera card should be pinned under the header: ' + JSON.stringify(ph));
    expect(ph.h + ph.hdr <= 844 * 0.5, 'phone: header + pinned camera should use at most half the screen: ' + JSON.stringify(ph));
    expect(ph.over <= 2, 'phone: page must not scroll sideways with the camera on');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);

    // photo-only flow (no camera needed): a few photos per class must give a clear answer, not a K-vote tie
    await page.click('#resetAll');
    await page.click('#camStop');
    expect(await page.isVisible('#camStart'), 'Stop camera shows the Start button again');
    const pic = (bg, shape) => page.evaluate(([bg, shape]) => {
      const c = document.createElement('canvas'); c.width = 160; c.height = 120; const x = c.getContext('2d');
      x.fillStyle = bg; x.fillRect(0, 0, 160, 120); x.fillStyle = '#fff';
      if (shape === 'circle') { x.beginPath(); x.arc(80, 60, 34, 0, 7); x.fill(); } else x.fillRect(44, 24, 72, 72);
      return c.toDataURL('image/png').split(',')[1];
    }, [bg, shape]).then(b => Buffer.from(b, 'base64'));
    const red = await pic('#d22', 'circle'), blue = await pic('#22d', 'square'), green = await pic('#2a2', 'circle');
    const up = async (sel, files) => { const [ch] = await Promise.all([page.waitForEvent('filechooser', { timeout: 10000 }), page.click(sel)]); await ch.setFiles(files); };
    const three = (buf, n) => [1, 2, 3].map(i => ({ name: `${n}${i}.png`, mimeType: 'image/png', buffer: buf }));
    await up(cls(1, '.upl-btn'), [{ name: 'one.png', mimeType: 'image/png', buffer: red }]);
    await page.waitForFunction(() => document.querySelector('#classes .cls:nth-child(1) .cls-count').getAttribute('data-n') === '1', null, { timeout: 10000 });
    const oneLabel = (await page.textContent(cls(1, '.cls-count'))).trim();
    expect(oneLabel === t('n_example_one', { n: 1 }), `1 example should use the singular label "${t('n_example_one', { n: 1 })}", got "${oneLabel}"`);
    const wantToast = t('added_one', { name: t('n_thumbs_up') });
    await page.waitForFunction(w => [...document.querySelectorAll('.edu-toast')].some(e => e.textContent === w), wantToast, { timeout: 5000 });
    await up(cls(1, '.upl-btn'), three(red, 'r').slice(0, 2));
    await up(cls(2, '.upl-btn'), three(blue, 'b'));
    await page.waitForFunction(() => document.querySelector('#classes .cls:nth-child(2) .cls-count').getAttribute('data-n') === '3', null, { timeout: 10000 });
    await up('#testPhoto', [{ name: 'test.png', mimeType: 'image/png', buffer: blue }]);
    const id2 = await page.getAttribute(cls(2), 'data-id');
    await page.waitForFunction(id => document.getElementById('winner').getAttribute('data-id') === id, id2, { timeout: 10000 });
    const p2 = parseInt((await page.textContent('#bars .bar-row:nth-child(2) .bar-pct')).replace(/\D/g, ''), 10);
    expect(p2 >= 60, 'with 3 photos per class and K = 10 the photo must not end in a tie, class 2 got ' + p2 + '%');
    const kNote = (await page.textContent('#kNote')).trim();
    expect(kNote === t('k_capped', { k: 3 }), `K note should say only 3 vote, got "${kNote}"`);
    expect((await page.textContent('#votesNote')).includes('3'), 'votes note should use the K that is really used (3)');
    // examples change while the test photo is shown: the photo is checked again (no stale or empty answer)
    await page.click(cls(1, '.clr-btn'));
    expect((await page.textContent('#winner')).trim() === t('need_two'), 'after clearing class 1 the AI needs 2 classes again');
    await up(cls(1, '.upl-btn'), three(green, 'g'));
    await page.waitForFunction(id => document.getElementById('winner').getAttribute('data-id') === id && /\d/.test(document.getElementById('winnerSub').textContent), id2, { timeout: 10000 });
    // the photo's answer stays when the camera is started and stopped again (it used to vanish to "…")
    await page.click('#camStart');
    await page.waitForFunction(() => { const v = document.getElementById('video'); return v && !v.hidden && v.videoWidth > 0; }, null, { timeout: 20000 });
    await page.waitForTimeout(400);
    await page.click('#camStop');
    await page.waitForTimeout(200);
    const kept = await page.evaluate(() => ({ id: document.getElementById('winner').getAttribute('data-id'), sub: document.getElementById('winnerSub').textContent }));
    expect(kept.id === id2 && /\d/.test(kept.sub), 'test photo answer should stay after stopping the camera: ' + JSON.stringify(kept));

    // removing a class while its photos are still being added must not leave hidden "ghost" examples
    await page.click('#addClass');
    const yellow = await pic('#dd2', 'square');
    await up(cls(3, '.upl-btn'), Array.from({ length: 40 }, (_, i) => ({ name: `y${i}.png`, mimeType: 'image/png', buffer: yellow })));
    await page.waitForFunction(() => +document.querySelector('#classes .cls:nth-child(3) .cls-count').getAttribute('data-n') >= 3, null, { timeout: 10000 });
    await page.click(cls(3, '.del-btn'));   // confirm dialog is auto-accepted
    expect(await count() === 2, 'class 3 removed during its upload');
    await page.waitForTimeout(1200);
    await up('#testPhoto', [{ name: 'y.png', mimeType: 'image/png', buffer: yellow }]);
    await page.waitForFunction(() => /\d/.test(document.getElementById('winnerSub').textContent), null, { timeout: 10000 });
    await page.waitForTimeout(300);
    const ghostSum = (await page.$$eval('#bars .bar-pct', els => els.map(e => parseInt(e.textContent.replace(/[^\d]/g, ''), 10) || 0))).reduce((a, b) => a + b, 0);
    expect(ghostSum >= 98 && ghostSum <= 102, 'votes of the visible classes should add up to 100% (no ghost class), got ' + ghostSum);

    await page.click('#backLive');
    expect(await page.isHidden('#testPrev'), 'Back to live camera hides the test photo');
  }

  // 7) reset everything
  await page.click('#resetAll');
  expect(await count() === 2, 'Reset should go back to 2 classes');
  const again = await page.inputValue(cls(1, '.cls-name'));
  expect(again === t('n_thumbs_up'), 'Reset restores the default names');
  const k = await page.inputValue('#kRange');
  expect(k === '10', 'Reset puts K back to 10, got ' + k);
  await page.evaluate(() => window.scrollTo(0, 0));   // tidy after-test screenshot (sticky cards)
  await page.waitForTimeout(300);
};
