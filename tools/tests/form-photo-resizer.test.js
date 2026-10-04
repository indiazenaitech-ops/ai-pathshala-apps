/* Interaction test for Form Photo & Signature Resizer (run by tools/verify.js in en and hi).
   Uses the canvas-drawn samples, checks pixels, file size windows, the JFIF DPI bytes, the COM padding
   (file must still decode), the "impossible target" message and the min > max error. */
const fs = require('fs');

function parseJpeg(buf) {
  const out = { ok: buf[0] === 0xFF && buf[1] === 0xD8, com: 0 };
  let i = 2;
  while (out.ok && i + 4 < buf.length) {
    if (buf[i] !== 0xFF) { out.ok = false; break; }
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m === 0xE0 && buf.toString('latin1', i + 4, i + 9) === 'JFIF\0') {
      out.units = buf[i + 11]; out.xd = buf.readUInt16BE(i + 12); out.yd = buf.readUInt16BE(i + 14);
    }
    if (m === 0xFE) out.com += len;
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) { out.h = buf.readUInt16BE(i + 5); out.w = buf.readUInt16BE(i + 7); break; }
    i += 2 + len;
  }
  return out;
}

module.exports = async function ({ page, expect, log }) {
  const settle = () => page.waitForSelector('#result[data-busy="0"][data-state]', { timeout: 30000 });
  const res = () => page.evaluate(() => {
    const e = document.querySelector('#result');
    const g = (k) => e.getAttribute('data-' + k);
    return { state: g('state'), w: +g('w'), h: +g('h'), bytes: +g('bytes'), q: g('q'), dpi: +g('dpi'), fmt: g('fmt') };
  });
  const download = async () => {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#download')]);
    const buf = fs.readFileSync(await dl.path());
    return { name: dl.suggestedFilename(), buf, info: parseJpeg(buf) };
  };
  /* the downloaded bytes must open as a picture of the right size (proves the padded file is valid) */
  const decodes = (buf) => page.evaluate(async (b64) => {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const bmp = await createImageBitmap(new Blob([u], { type: 'image/jpeg' }));
    return bmp.width + 'x' + bmp.height;
  }, buf.toString('base64'));
  const loadSample = async () => {
    if (!(await page.isVisible('#sample'))) await page.click('#changePic');
    await page.click('#sample');
    await settle();
  };

  // 1) IBPS photo from the canvas-drawn sample: 200 × 230 px, 20–50 KB, 200 DPI in the JFIF header
  await page.click('#type-photo');
  await page.selectOption('#preset', 'ibps_photo');
  await loadSample();
  let r = await res();
  expect(r.state === 'ok', 'IBPS photo state ok, got ' + r.state);
  expect(r.w === 200 && r.h === 230, 'IBPS photo is 200 × 230, got ' + r.w + ' × ' + r.h);
  expect(r.bytes >= 20 * 1024 && r.bytes <= 50 * 1000, 'IBPS photo inside 20–50 KB (both KB and kB), got ' + r.bytes + ' bytes');
  let d = await download();
  expect(d.buf.length === r.bytes, 'download has the shown size');
  expect(d.info.ok && d.info.w === 200 && d.info.h === 230, 'JPEG frame is 200 × 230, got ' + d.info.w + ' × ' + d.info.h);
  expect(d.info.units === 1 && d.info.xd === 200 && d.info.yd === 200, 'JFIF density = 200 dpi, got units ' + d.info.units + ' ' + d.info.xd + '/' + d.info.yd);
  expect(d.name === 'photo_200x230_' + Math.max(1, Math.round(r.bytes / 1024)) + 'KB.jpg', 'file name like photo_200x230_38KB.jpg, got ' + d.name);
  /* the numbers on screen, checked with our own arithmetic: KB = bytes / 1024, kB = bytes / 1000, cm = px / dpi × 2.54 */
  const one = (n) => String(Math.round(n * 10) / 10);
  const fileTxt = await page.textContent('#rFile'), printTxt = await page.textContent('#rPrint');
  expect(fileTxt.includes(one(r.bytes / 1024) + ' KB') && fileTxt.includes('(' + one(r.bytes / 1000) + ' kB)'), 'file size shown in KB and kB: ' + fileTxt);
  expect(printTxt.includes('2.54 × 2.92 cm') && printTxt.includes('200'), '200 × 230 px at 200 DPI prints at 2.54 × 2.92 cm: ' + printTxt);
  log('IBPS photo', r.bytes, 'bytes, q', r.q);

  // 1a) print sheet: copies at true size (cm), print dialog stubbed
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click('#result details summary');
  await page.selectOption('#copies', '4');
  await page.click('#printBtn');
  await page.waitForFunction(() => window.__printed > 0);
  const sheet = await page.evaluate(() => { const ims = document.querySelectorAll('#printArea img'); return { n: ims.length, w: ims[0].style.width, h: ims[0].style.height }; });
  expect(sheet.n === 4 && /cm$/.test(sheet.w) && Math.abs(parseFloat(sheet.w) - 200 / 200 * 2.54) < 0.001 && Math.abs(parseFloat(sheet.h) - 230 / 200 * 2.54) < 0.001, 'print sheet: 4 copies of 2.540 × 2.921 cm, got ' + JSON.stringify(sheet));

  // 1b) "whiten background" turns the grey wall white but leaves the face alone
  const pix = (fx, fy) => page.evaluate(([fx, fy]) => {
    const im = document.querySelector('#outImg'), c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    return Array.from(x.getImageData(Math.round(fx * c.width), Math.round(fy * c.height), 1, 1).data.slice(0, 3));
  }, [fx, fy]);
  const wallBefore = await pix(0.05, 0.05), faceBefore = await pix(0.5, 0.55);
  await page.$eval('#whiten', (e) => { e.value = '80'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await settle();
  await page.waitForFunction(() => document.querySelector('#outImg').complete);
  const wallAfter = await pix(0.05, 0.05), faceAfter = await pix(0.5, 0.55);
  expect(Math.min(...wallBefore) < 235 && Math.min(...wallAfter) >= 245, 'wall goes white: ' + wallBefore + ' → ' + wallAfter);
  expect(faceAfter.every((v, i) => Math.abs(v - faceBefore[i]) <= 6), 'face colour unchanged: ' + faceBefore + ' → ' + faceAfter);
  await page.$eval('#whiten', (e) => { e.value = '0'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await settle();

  // 1c) name + date strip: dark text on a white band at the bottom, same pixel size; the typed name is never stored
  await page.check('#stripOn');
  await page.fill('#stripName', 'Asha Verma');
  await page.fill('#stripDate', '2026-09-28');
  await settle();
  await page.waitForFunction(() => document.querySelector('#outImg').complete);
  const band = await page.evaluate(() => {
    const im = document.querySelector('#outImg'), c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const st = Math.max(12, Math.round(c.height * 0.16)), d = x.getImageData(0, c.height - st, c.width, st).data;
    let dark = 0, white = 0;
    for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; if (l < 90) dark++; if (l > 240) white++; }
    return { w: c.width, h: c.height, dark, white, n: d.length / 4 };
  });
  expect(band.w === 200 && band.h === 230 && band.dark > 100 && band.white / band.n > 0.5, 'strip drawn inside 200 × 230: ' + JSON.stringify(band));
  const stored = await page.evaluate(() => Object.keys(localStorage).map((k) => localStorage.getItem(k)).join('|'));
  expect(!stored.includes('Asha'), 'the typed name is not saved on the device');
  await page.uncheck('#stripOn');
  await settle();

  // 2) chosen DPI is written into the file
  await page.click('#editToggle');
  await page.selectOption('#inDpi', '300');
  await settle();
  r = await res();
  d = await download();
  expect(r.dpi === 300 && d.info.xd === 300 && d.info.yd === 300 && d.info.units === 1, 'JFIF density = 300 dpi after change, got ' + d.info.xd);
  expect(d.info.w === 200 && d.info.h === 230, 'pixels unchanged when only DPI changes');
  expect(await page.isVisible('#editedBadge'), '"Edited" badge shown after changing an official value');
  await page.click('#restore');
  await settle();
  expect((await res()).dpi === 200, 'official DPI restored');

  // 2a) with the lock on, typing a new width key by key keeps the shape: 200 × 230 → 300 × 345
  //     (the field must also accept whole pixels: min/step must not make 200 "invalid")
  if ((await page.getAttribute('#lockBtn', 'aria-pressed')) !== 'true') await page.click('#lockBtn');
  expect(await page.$eval('#inW', (e) => e.validity.valid), 'width 200 is a valid value of the number field');
  await page.click('#inW', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type('300', { delay: 40 });
  await settle();
  r = await res();
  expect(r.w === 300 && r.h === 345, 'locked shape: typing 300 gives 300 × 345, got ' + r.w + ' × ' + r.h);
  // 2a') sizes in cm: 3.5 × 4.5 cm at 200 DPI = round(3.5 / 2.54 × 200) × round(4.5 / 2.54 × 200) = 276 × 354 px
  await page.click('#unit-cm');
  await page.click('#lockBtn');
  await page.fill('#inW', '3.5');
  await page.fill('#inH', '4.5');
  await settle();
  r = await res();
  expect(r.w === 276 && r.h === 354 && r.bytes >= 20 * 1024 && r.bytes <= 50 * 1000, '3.5 × 4.5 cm at 200 DPI = 276 × 354 px inside 20–50 KB, got ' + r.w + ' × ' + r.h + ' ' + r.bytes);
  await page.click('#lockBtn');
  await page.click('#unit-px');
  await page.click('#restore');
  await settle();
  r = await res();
  expect(r.w === 200 && r.h === 230, 'restore brings back 200 × 230');

  // 2b) a phone JPEG with EXIF orientation 6 (taken sideways) opens upright: 300 × 200 stored → 200 × 300 shown
  const exifB64 = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 300; c.height = 200;
    const x = c.getContext('2d'); x.fillStyle = '#8ab'; x.fillRect(0, 0, 300, 200); x.fillStyle = '#d00'; x.fillRect(0, 0, 100, 60);
    const u = new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9))).arrayBuffer());
    const tiff = [0x49, 0x49, 0x2A, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0];
    const payload = [0x45, 0x78, 0x69, 0x66, 0, 0].concat(tiff), len = payload.length + 2;
    const app1 = [0xFF, 0xE1, len >> 8, len & 255].concat(payload);
    const n = new Uint8Array(u.length + app1.length); n.set(u.subarray(0, 2), 0); n.set(app1, 2); n.set(u.subarray(2), 2 + app1.length);
    let s = ''; for (let i = 0; i < n.length; i++) s += String.fromCharCode(n[i]);
    return btoa(s);
  });
  await page.click('#changePic');
  await page.setInputFiles('#fileIn', { name: 'phone.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(exifB64, 'base64') });
  await page.waitForSelector('#editWrap[data-w="200"][data-h="300"]', { timeout: 15000 });
  await settle();
  r = await res();
  expect(r.w === 200 && r.h === 230 && r.bytes >= 20 * 1024 && r.bytes <= 50 * 1000, 'rotated phone photo still gives 200 × 230 inside 20–50 KB, got ' + r.w + '×' + r.h + ' ' + r.bytes);

  // 2c) a file that is not a picture: clear error, the old picture stays, the status line is not stuck on "loading"
  const infoBefore = await page.textContent('#loadInfo');
  await page.setInputFiles('#fileIn', { name: 'notes.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('this is not a picture '.repeat(40)) });
  await page.waitForSelector('#loadErr:not([hidden])', { timeout: 15000 });
  expect(await page.isVisible('#editor'), 'old picture still shown after a bad file');
  expect((await page.textContent('#loadInfo')) === infoBefore, 'picture info restored after a bad file, got ' + await page.textContent('#loadInfo'));

  // 3) IBPS signature: auto-cropped, cleaned, 140 × 60 px, 10–20 KB
  await page.click('#type-sign');
  await page.selectOption('#preset', 'ibps_sign');
  await loadSample();
  r = await res();
  expect(r.state === 'ok' || r.state === 'padded', 'signature state ok/padded, got ' + r.state);
  expect(r.w === 140 && r.h === 60, 'signature is 140 × 60, got ' + r.w + ' × ' + r.h);
  expect(r.bytes >= 10 * 1024 && r.bytes <= 20 * 1000, 'signature inside 10–20 KB, got ' + r.bytes);
  d = await download();
  expect(d.info.w === 140 && d.info.h === 60 && d.info.xd === 200, 'signature JPEG 140 × 60 at 200 dpi');
  expect(await decodes(d.buf) === '140x60', 'signature file decodes as a 140 × 60 picture');
  log('IBPS signature', r.bytes, 'bytes, state', r.state);

  // 4) RRB signature 30–49 KB: far above what 140 × 60 needs, so the file is padded with a valid COM segment
  await page.selectOption('#preset', 'rrb_sign');
  await settle();
  r = await res();
  expect(r.state === 'padded', 'RRB signature padded, got ' + r.state);
  expect(r.bytes >= 30 * 1024 && r.bytes <= 49 * 1000, 'RRB signature inside 30–49 KB, got ' + r.bytes);
  d = await download();
  expect(d.info.com > 0 && d.info.w === 140 && d.info.h === 60, 'padding is a JPEG comment, frame still 140 × 60');
  expect(await decodes(d.buf) === '140x60', 'padded file still decodes');

  // 4b) Reset while the signature is open: the signature picture keeps the signature tools and preset
  await page.click('#helpBox summary');
  await page.click('#resetAll');                        /* confirm() is auto-accepted */
  await settle();
  r = await res();
  expect(await page.getAttribute('#type-sign', 'aria-pressed') === 'true' && await page.isVisible('#paperTools'), 'after Reset the open type is still Signature with its tools');
  expect(r.w === 140 && r.h === 60 && r.bytes >= 10 * 1024 && r.bytes <= 20 * 1000, 'after Reset the signature is back on IBPS 140 × 60, 10–20 KB, got ' + r.w + '×' + r.h + ' ' + r.bytes);

  // 5) impossible target: 600 × 600 photo under 5 KB → clear message, no download
  await page.click('#type-photo');
  await page.selectOption('#preset', 'custom');
  await loadSample();                                   /* the noisy photo sample, not the flat EXIF test picture */
  if (!(await page.isVisible('#inW'))) await page.click('#editToggle');
  if ((await page.getAttribute('#lockBtn', 'aria-pressed')) === 'true') await page.click('#lockBtn');
  await page.selectOption('#inFmt', 'jpg');
  await page.fill('#inW', '600');
  await page.fill('#inH', '600');
  await page.fill('#inMin', '0');
  await page.fill('#inMax', '5');
  await settle();
  r = await res();
  expect(r.state === 'impossible', '600 × 600 under 5 KB is impossible, got ' + r.state + ' ' + r.bytes);
  expect(await page.isDisabled('#download'), 'download disabled for an impossible target');
  expect((await page.textContent('#status')).includes('5'), 'message names the 5 KB limit');

  // 6) minimum bigger than maximum → error, no download
  await page.fill('#inMin', '60');
  await page.fill('#inMax', '50');
  await settle();
  r = await res();
  expect(r.state === 'error', 'min > max is an error, got ' + r.state);
  expect(await page.isVisible('#specErr'), 'error shown next to the KB fields');
  expect(await page.isDisabled('#download'), 'download disabled when min > max');
};
