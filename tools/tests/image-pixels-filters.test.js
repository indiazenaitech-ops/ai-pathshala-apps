/* Interaction test for "How Computers See" (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, log }) {
  const attr = (sel, a) => page.getAttribute(sel, a);
  const num = async (sel, a) => Number(await page.getAttribute(sel, a || 'data-value'));
  const setRes = async (n) => {
    await page.$eval('#res', (el, n) => {
      const vals = el.getAttribute('data-values').split(',').map(Number);
      el.value = String(vals.indexOf(n));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, n);
    await page.waitForTimeout(60);
  };
  const clickPixel = async (sel, x, y, n) => {
    const b = await page.$eval(sel, (c) => ({ w: c.clientWidth, h: c.clientHeight }));
    await page.click(sel, { position: { x: (x + 0.5) / n * b.w, y: (y + 0.5) / n * b.h } });
    await page.waitForTimeout(80);
  };
  const cells = (sel) => page.$$eval(sel, (els) => els.map((e) => Number(e.getAttribute('data-value'))));
  const sum = (a, k) => a.reduce((s, v, i) => s + v * k[i], 0);

  await page.waitForSelector('#sample-shapes');

  // 1) sample picture + resolution → pixel count
  await page.click('#sample-shapes');
  expect(await attr('#src-name', 'data-src') === 'shapes', 'Shapes sample selected');
  await setRes(8);
  expect(await num('#res-out') === 8, '8 pixels across, got ' + (await num('#res-out')));
  expect(await num('#count-line', 'data-pixels') === 64 && await num('#count-line', 'data-numbers') === 192, '8 × 8 = 64 pixels and 192 numbers');

  // 2) inspect pixels: (col 1, row 1) lies fully inside the near-black square (#111111 = 17)
  await clickPixel('#px-canvas', 1, 1, 8);
  expect(await num('#sel-pos', 'data-x') === 1 && await num('#sel-pos', 'data-y') === 1, 'pixel (1,1) selected');
  const r1 = await num('#val-r'), g1 = await num('#val-g'), b1 = await num('#val-b');
  expect(r1 === 17 && g1 === 17 && b1 === 17 && await num('#val-grey') === 17, `inside the square RGB is 17,17,17, got ${r1},${g1},${b1}`);
  await clickPixel('#px-canvas', 6, 1, 8);                       // near the red circle
  const r2 = await num('#val-r'), g2 = await num('#val-g'), b2 = await num('#val-b'), y2 = await num('#val-grey');
  expect(r2 > b2 + 30, `pixel near the red circle should be reddish, got ${r2},${g2},${b2}`);
  expect(y2 === Math.round(0.299 * r2 + 0.587 * g2 + 0.114 * b2), 'grey = 0.299R + 0.587G + 0.114B');
  let nb = await cells('#nb-grid .nb-cell');
  expect(nb.length === 49 && nb[24] === y2, '7 × 7 neighbourhood with the pixel (grey) in the centre');
  await page.click('#ch-seg button[data-ch="r"]');
  nb = await cells('#nb-grid .nb-cell');
  expect(nb[24] === r2, 'Red channel view shows red numbers');
  expect(!(await page.isDisabled('#opt-nums')), 'numbers-on-picture allowed at 8 × 8');
  await page.check('#opt-nums');
  await page.click('#ch-seg button[data-ch="rgb"]');

  // 3) filters: maths matches the definition and the output picture
  await page.click('#tab-filters');
  expect(await page.isVisible('#panel-filters'), 'filters panel visible');
  await page.click('#f-blur');
  let pix = await cells('#m-pix .mcell');
  expect(pix.length === 9 && pix[4] === y2, 'centre of the 3 × 3 window is the selected pixel');
  expect(await num('#math-result') === Math.round(pix.reduce((a, b) => a + b, 0) / 9), 'blur = average of 9 numbers');
  await page.click('#f-edge-v');
  pix = await cells('#m-pix .mcell');
  const ev = Math.min(255, Math.round(Math.abs(sum(pix, [-1, 0, 1, -2, 0, 2, -1, 0, 1]))));
  expect(await num('#math-result') === ev, 'vertical edge = |sum of products|, expected ' + ev);
  const outPx = await page.$eval('#out-canvas', (c) => { const k = c.width / 8; return c.getContext('2d').getImageData(Math.floor(6.5 * k), Math.floor(1.5 * k), 1, 1).data[0]; });
  expect(outPx === ev, `output picture pixel (${outPx}) equals the worked answer (${ev})`);
  await page.click('#f-sobel');
  const gx = sum(pix, [-1, 0, 1, -2, 0, 2, -1, 0, 1]), gy = sum(pix, [-1, -2, -1, 0, 0, 0, 1, 2, 1]);
  expect(await num('#math-result') === Math.min(255, Math.round(Math.sqrt(gx * gx + gy * gy))), 'Sobel = √(Gx² + Gy²)');

  // 4) own filter: identity, then ×2, and editing a preset turns into "My filter"
  await page.click('#f-custom');
  for (let i = 0; i < 9; i++) await page.fill('#k' + i, i === 4 ? '1' : '0');
  expect(await num('#math-result') === y2, 'identity kernel keeps the pixel value');
  await page.fill('#k4', '2');
  expect(await num('#math-result') === Math.min(255, 2 * y2), 'centre 2 doubles the pixel value');
  await page.click('#f-sharpen');
  await page.fill('#k0', '1');
  expect(await attr('#f-custom', 'aria-pressed') === 'true', 'editing a preset switches to My filter');
  pix = await cells('#m-pix .mcell');
  expect(await num('#math-result') === Math.max(0, Math.min(255, Math.round(sum(pix, [1, -1, 0, -1, 5, -1, 0, -1, 0])))), 'edited sharpen kernel computed correctly');
  await page.click('#slide-btn');
  expect(await attr('#slide-btn', 'aria-pressed') === 'true', 'slide animation running');
  await page.waitForTimeout(400);
  await page.click('#slide-btn');
  expect(await attr('#slide-btn', 'aria-pressed') === 'false', 'slide animation stopped');

  // 5) CNN feature maps + max pooling
  await page.click('#tab-cnn');
  const maps = await page.$$eval('.fm-canvas', (els) => els.map((e) => Number(e.getAttribute('data-n'))));
  expect(maps.length === 6 && maps.every((n) => n === 8), '6 feature maps of 8 × 8');
  const bright = await page.$eval('#fm-v', (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let m = 0; for (let i = 0; i < d.length; i += 4) m = Math.max(m, d[i]); return m; });
  expect(bright > 200, 'vertical-edge map finds the square\'s edges, brightest ' + bright);
  await page.check('#opt-pool');
  expect(await num('#fm-v', 'data-n') === 4, 'max pooling halves the map to 4 × 4');

  // 6) guess-the-filter game
  await page.click('#tab-game');
  const ans = await attr('#g-card', 'data-answer');
  await page.click(`#g-options button[data-f="${ans}"]`);
  expect(await num('#g-score', 'data-score') === 1 && await num('#g-score', 'data-total') === 1, 'right answer scores 1 / 1');
  await page.click('#g-next');
  const ans2 = await attr('#g-card', 'data-answer');
  await page.click(`#g-options button:not([data-f="${ans2}"])`);
  expect(await num('#g-score', 'data-score') === 1 && await num('#g-score', 'data-total') === 2, 'wrong answer scores 1 / 2');

  // 7) upload a photo (made here: left half red, right half blue)
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); x.fillStyle = '#ff0000'; x.fillRect(0, 0, 32, 64); x.fillStyle = '#0000ff'; x.fillRect(32, 0, 32, 64);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.setInputFiles('#upload-input', { name: 'red-blue.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') });
  await page.waitForFunction(() => document.querySelector('#src-name').getAttribute('data-src') === 'upload', null, { timeout: 10000 });
  await page.click('#tab-pixels');
  await clickPixel('#px-canvas', 1, 3, 8);
  expect(await num('#val-r') === 255 && await num('#val-b') === 0, 'left of the uploaded photo is pure red');
  await clickPixel('#px-canvas', 6, 3, 8);
  expect(await num('#val-r') === 0 && await num('#val-b') === 255, 'right of the uploaded photo is pure blue');

  // 8) camera snapshot (fake camera in the test browser) or a friendly error
  await page.click('#cam-btn');
  try {
    await page.waitForSelector('#cam-snap:not([disabled])', { timeout: 15000 });
    await page.click('#cam-snap');
    await page.waitForFunction(() => document.querySelector('#src-name').getAttribute('data-src') === 'camera', null, { timeout: 5000 });
    expect(await page.isHidden('#cam-box'), 'camera box closes after the snapshot');
    log('camera snapshot ok');
  } catch (e) {
    const st = await attr('#cam-msg', 'data-state');
    expect(st === 'error', 'camera neither worked nor showed an error: ' + e.message.split('\n')[0]);
    log('camera unavailable, message shown');
    await page.click('#cam-close');
  }

  // 9) settings survive a reload; Reset restores defaults
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#sample-shapes');
  expect(await num('#res-out') === 8, 'resolution remembered after reload');
  expect(await attr('#src-name', 'data-src') === 'shapes', 'last sample picture remembered (photos are not stored)');
  expect(await attr('#tab-pixels', 'aria-selected') === 'true', 'tab remembered');
  await page.click('#reset-btn');
  await page.waitForTimeout(200);
  expect(await num('#res-out') === 32 && await attr('#src-name', 'data-src') === 'smiley', 'Reset brings back the smiley at 32 × 32');

  // leave a nice state for the screenshot
  await page.click('#tab-filters');
  await page.click('#f-sobel');
};
