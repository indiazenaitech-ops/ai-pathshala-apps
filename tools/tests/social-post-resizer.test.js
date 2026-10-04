/* Interaction test for Social Post Resizer (run by tools/verify.js in en and hi).
   A 2000 × 1000 test picture (red | green | blue thirds) → Instagram square 1080 × 1080 and story 1080 × 1920:
   every exported file is decoded and must have exactly the preset pixels; fit and fill outputs differ;
   arrow keys move the crop; the caption band paints the bottom; "download all" gives one file per ticked size;
   PNG export is a real PNG; HEIC shows the friendly message; Reset restores the defaults. */
const fs = require('fs');

module.exports = async function ({ page, expect, log }) {
  const app = () => page.evaluate(() => Object.assign({}, document.getElementById('app').dataset));
  await page.waitForFunction(() => { const d = document.getElementById('app').dataset; return d.busy === '0' && d.sample === '1'; }, null, { timeout: 15000 });
  expect((await page.getAttribute('#preview', 'data-preset')) === 'ig_square', 'sample loaded on the Instagram square preset');

  /* decode a downloaded file inside the page: real size, type and some pixels */
  const decode = (buf, pts) => page.evaluate(async ({ b64, pts }) => {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const png = u[0] === 0x89 && u[1] === 0x50, jpg = u[0] === 0xFF && u[1] === 0xD8;
    const bm = await createImageBitmap(new Blob([u], { type: png ? 'image/png' : 'image/jpeg' }));
    const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
    const x = c.getContext('2d'); x.drawImage(bm, 0, 0);
    const px = pts.map(([px, py]) => Array.from(x.getImageData(px, py, 1, 1).data.slice(0, 3)));
    return { w: bm.width, h: bm.height, png, jpg, px };
  }, { b64: buf.toString('base64'), pts });
  const download = async (sel) => {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click(sel)]);
    const buf = fs.readFileSync(await dl.path());
    await page.waitForFunction(() => document.getElementById('app').dataset.busy === '0');
    return { name: dl.suggestedFilename(), buf };
  };
  const isRed = (p) => p[0] > 180 && p[1] < 90 && p[2] < 90, isGreen = (p) => p[1] > 150 && p[0] < 110 && p[2] < 110;
  const isBlue = (p) => p[2] > 180 && p[0] < 90 && p[1] < 110, isWhite = (p) => p.every((v) => v > 240);

  // 1) a 2000 × 1000 picture: red | green | blue thirds
  const b64 = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 2000; c.height = 1000;
    const x = c.getContext('2d');
    x.fillStyle = '#e01010'; x.fillRect(0, 0, 667, 1000);
    x.fillStyle = '#10c020'; x.fillRect(667, 0, 666, 1000);
    x.fillStyle = '#1020e0'; x.fillRect(1333, 0, 667, 1000);
    const b = await new Promise((r) => c.toBlob(r, 'image/png'));
    const u = new Uint8Array(await b.arrayBuffer()); let s = '';
    for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
    return btoa(s);
  });
  await page.setInputFiles('#fileIn', { name: 'Diwali Poster.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') });
  await page.waitForFunction(() => { const d = document.getElementById('app').dataset; return d.busy === '0' && d.sample === '0' && d.w === '2000'; }, null, { timeout: 20000 });
  expect((await app()).h === '1000', 'picture read as 2000 × 1000');
  expect((await page.textContent('#loadInfo')).replace(/[^0-9]/g, '').includes('2000'), 'picture info shows the size');

  // 2) Instagram square, fit on a white background → exactly 1080 × 1080, white corner, green centre
  await page.click('#preset-ig_square');
  expect((await page.getAttribute('#mode-fit', 'aria-pressed')) === 'true', 'a wide poster on a square defaults to Fit');
  await page.click('#bgChips [data-bg="white"]');
  let d = await download('#dlThis');
  let o = await decode(d.buf, [[5, 5], [540, 540], [540, 275]]);
  expect(o.w === 1080 && o.h === 1080, 'fit export is 1080 × 1080, got ' + o.w + ' × ' + o.h);
  expect(o.jpg, 'default export is a JPEG');
  expect(isWhite(o.px[0]), 'fit: corner is the white background, got ' + o.px[0]);
  expect(isGreen(o.px[1]), 'fit: centre shows the middle of the poster, got ' + o.px[1]);
  expect(/^Diwali_Poster_instagram_post_1080x1080\.jpg$/.test(d.name), 'file name {name}_instagram_post_1080x1080.jpg, got ' + d.name);
  expect((await page.textContent('#status')).includes(d.name), 'status names the saved file');
  const est = await page.getAttribute('#estSize', 'data-bytes');
  expect(+est === d.buf.length, 'estimated size equals the real file: ' + est + ' vs ' + d.buf.length);

  // 3) Fill crops: the same corner now shows the poster (red), so fit and fill differ
  await page.click('#mode-fill');
  d = await download('#dlThis');
  o = await decode(d.buf, [[5, 5], [540, 540], [1075, 5]]);
  expect(o.w === 1080 && o.h === 1080, 'fill export is 1080 × 1080');
  expect(isRed(o.px[0]) && isBlue(o.px[2]) && isGreen(o.px[1]), 'fill: red left edge, green centre, blue right edge, got ' + JSON.stringify(o.px));

  // 4) arrow keys move the crop: 5 × Shift+ArrowLeft slides the picture fully to the left → right third (blue) fills the right half
  await page.focus('#preview');
  for (let i = 0; i < 5; i++) await page.keyboard.press('Shift+ArrowLeft');
  d = await download('#dlThis');
  o = await decode(d.buf, [[5, 5], [1075, 5]]);
  expect(isGreen(o.px[0]) && isBlue(o.px[1]), 'after moving left the crop shows green then blue, got ' + JSON.stringify(o.px));
  // zoom with the keyboard, then reset position
  await page.focus('#preview');                      /* the download button took the focus */
  await page.keyboard.press('+');
  expect(+(await page.inputValue('#zoom')) > 100, 'plus key zooms in: ' + await page.inputValue('#zoom'));
  await page.keyboard.press('0');
  expect((await page.inputValue('#zoom')) === '100', '0 resets zoom');

  // 5) story 1080 × 1920: fit by default, white top, poster in the middle
  await page.click('#preset-ig_story');
  expect((await page.getAttribute('#preview', 'data-preset')) === 'ig_story', 'story preset active');
  d = await download('#dlThis');
  o = await decode(d.buf, [[540, 100], [540, 960], [1075, 960]]);
  expect(o.w === 1080 && o.h === 1920, 'story export is 1080 × 1920, got ' + o.w + ' × ' + o.h);
  expect(isWhite(o.px[0]) && isGreen(o.px[1]) && isBlue(o.px[2]), 'story: white band, poster centred, got ' + JSON.stringify(o.px));
  expect(/_instagram_story_1080x1920\.jpg$/.test(d.name), 'story file name: ' + d.name);

  // 6) caption band paints the bottom of the story
  await page.click('#capDet > summary');
  await page.fill('#capText', 'Sharma Sweets · 20% off');
  expect(await page.isChecked('#capOn'), 'typing a caption switches the band on');
  d = await download('#dlThis');
  o = await decode(d.buf, [[20, 1900], [540, 1900], [540, 1700]]);
  expect(o.w === 1080 && o.h === 1920, 'caption export keeps 1080 × 1920');
  expect(o.px[0].every((v) => v < 130) && o.px[1].every((v) => v < 160) && isWhite(o.px[2]), 'dark band at the bottom, white above it, got ' + JSON.stringify(o.px));
  await page.uncheck('#capOn');

  // 7) PNG export is a real PNG of the exact size
  await page.click('#fmt-png');
  d = await download('#dlThis');
  o = await decode(d.buf, []);
  expect(o.png && o.w === 1080 && o.h === 1920 && /\.png$/.test(d.name), 'PNG export 1080 × 1920: ' + d.name);
  await page.click('#fmt-jpg');

  // 8) "download all": one file per ticked size (defaults: square, portrait, story, thumbnail, DP)
  const n = +(await page.getAttribute('#selCount', 'data-n'));
  expect(n === 5, '5 sizes ticked by default, got ' + n);
  const dls = [];
  page.on('download', (dl) => dls.push(dl));
  await page.click('#dlAll');
  await page.waitForFunction(() => document.getElementById('app').dataset.busy === '0', null, { timeout: 60000 });
  for (let i = 0; i < 40 && dls.length < n; i++) await page.waitForTimeout(100);
  expect(dls.length === n, n + ' downloads, got ' + dls.length);
  const want = { instagram_post: [1080, 1080], instagram_portrait: [1080, 1350], instagram_story: [1080, 1920], youtube_thumbnail: [1280, 720], whatsapp_dp: [640, 640] };
  for (const dl of dls) {
    const name = dl.suggestedFilename(), key = Object.keys(want).find((k) => name.includes('_' + k + '_'));
    expect(!!key, 'file name has a known size key: ' + name);
    const oo = await decode(fs.readFileSync(await dl.path()), []);
    expect(oo.w === want[key][0] && oo.h === want[key][1], name + ' decodes as ' + want[key].join(' × ') + ', got ' + oo.w + ' × ' + oo.h);
    delete want[key];
  }
  expect(Object.keys(want).length === 0, 'every ticked size was downloaded, missing: ' + Object.keys(want).join(', '));
  expect((await page.textContent('#status')).includes('5'), 'status says 5 files');
  log('download-all names:', dls.map((x) => x.suggestedFilename()).join(', '));

  // 9) a HEIC file: friendly message with the converter link, the old picture stays
  const heic = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypheic'), Buffer.alloc(4), Buffer.from('mif1heic'), Buffer.alloc(300)]);
  await page.setInputFiles('#fileIn', { name: 'IMG_0001.HEIC', mimeType: 'image/heic', buffer: heic });
  await page.waitForSelector('#loadErr:not([hidden])', { timeout: 15000 });
  expect(await page.isVisible('#heicLink'), 'HEIC message shows the Image Compressor link');
  expect((await app()).w === '2000', 'old picture still loaded after a HEIC file');
  // a file that is not a picture at all
  await page.setInputFiles('#fileIn', { name: 'notes.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not a picture '.repeat(50)) });
  await page.waitForFunction(() => !document.getElementById('loadErr').hidden && document.getElementById('heicLink').hidden, null, { timeout: 15000 });
  expect((await app()).busy === '0', 'not busy after a bad file');

  // 10) a phone photo with EXIF orientation 6: stored 400 × 200 (left red | right blue), shown upright as 200 × 400 with red on top
  const exifB64 = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 200;
    const x = c.getContext('2d'); x.fillStyle = '#e01010'; x.fillRect(0, 0, 200, 200); x.fillStyle = '#1020e0'; x.fillRect(200, 0, 200, 200);
    const jpg = new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.95))).arrayBuffer());
    const app1 = [0xFF, 0xE1, 0, 34, 0x45, 0x78, 0x69, 0x66, 0, 0, 0x49, 0x49, 0x2A, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0];
    const out = new Uint8Array(jpg.length + app1.length); out.set(jpg.subarray(0, 2)); out.set(app1, 2); out.set(jpg.subarray(2), 2 + app1.length);
    let s = ''; for (let i = 0; i < out.length; i += 32768) s += String.fromCharCode.apply(null, out.subarray(i, i + 32768));
    return btoa(s);
  });
  await page.setInputFiles('#fileIn', { name: 'दिवाली ऑफर.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(exifB64, 'base64') });
  await page.waitForFunction(() => { const d = document.getElementById('app').dataset; return d.busy === '0' && d.w === '200'; }, null, { timeout: 20000 });
  expect((await app()).h === '400', 'EXIF orientation 6 applied: picture is 200 × 400');
  await page.click('#preset-ig_square'); await page.click('#mode-fill');
  d = await download('#dlThis');
  o = await decode(d.buf, [[540, 60], [540, 1020]]);
  expect(o.w === 1080 && o.h === 1080 && isRed(o.px[0]) && isBlue(o.px[1]), 'EXIF photo exports upright (red top, blue bottom), got ' + JSON.stringify(o.px));
  expect(/^दिवाली_ऑफर_instagram_post_1080x1080\.jpg$/.test(d.name), 'Hindi file name kept in the export: ' + d.name);

  // 11) two files picked quickly: the last one wins (a big one still decoding must not overwrite it)
  const bigB64 = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 4800; c.height = 3600; const x = c.getContext('2d');
    x.fillStyle = '#888'; x.fillRect(0, 0, 4800, 3600); for (let i = 0; i < 4800; i += 97) { x.fillStyle = 'hsl(' + (i % 360) + ',70%,50%)'; x.fillRect(i, 0, 40, 3600); }
    const u = new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.7))).arrayBuffer());
    let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
    return btoa(s);
  });
  await page.setInputFiles('#fileIn', { name: 'big.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(bigB64, 'base64') });
  await page.setInputFiles('#fileIn', { name: 'Diwali Poster.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') });
  await page.waitForTimeout(1500);
  await page.waitForFunction(() => document.getElementById('app').dataset.busy === '0', null, { timeout: 30000 });
  expect((await app()).w === '2000', 'the last picked file is the one shown, got ' + (await app()).w);

  // 12) ticking, custom size and reset
  await page.click('#pf-custom');
  await page.fill('#customW', '500'); await page.fill('#customH', '700');
  await page.press('#customH', 'Tab');
  await page.click('#preset-custom');
  d = await download('#dlThis');
  o = await decode(d.buf, []);
  expect(o.w === 500 && o.h === 700 && /_custom_500x700\.jpg$/.test(d.name), 'custom 500 × 700 export: ' + d.name + ' ' + o.w + ' × ' + o.h);
  await page.click('#selNone');
  expect((await page.getAttribute('#selCount', 'data-n')) === '0', 'untick all → 0');
  expect(await page.isDisabled('#dlAll'), 'download-all disabled with nothing ticked');
  await page.click('#resetAll');                       /* confirm() is auto-accepted */
  await page.waitForTimeout(200);
  expect((await page.getAttribute('#selCount', 'data-n')) === '5', 'reset restores the 5 default ticks');
  expect((await page.getAttribute('#preview', 'data-preset')) === 'ig_square', 'reset returns to the Instagram square');
};
