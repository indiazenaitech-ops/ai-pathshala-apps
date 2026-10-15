/* Interaction test for Face Blur for Safe Sharing (run by tools/verify.js in en and hi).
   Sample photo (18 faces) -> the AI (face-api SSD MobileNet v1 from jsDelivr) finds at least 15 faces, all hidden,
   and the face pixels really change; tapping a box shows that face again (pixels back to the original);
   a hand-drawn box is added and even strength 1 wipes out its detail; the saved JPG has no EXIF block; a JPEG with hand-built EXIF (camera + GPS
   28°36'50" N, 77°12'30" E) is reported with the right coordinates and camera name; a see-through PNG stays
   see-through as PNG and gets a white background as JPG. */
const fs = require('fs');

module.exports = async function ({ page, expect, log }) {
  const idle = (min, ms) => page.waitForFunction((min) => {
    const f = document.querySelector('#cntFaces');
    const stop = document.querySelector('#stopBtn');
    return f && stop && stop.hidden && +f.dataset.n >= min;
  }, min, { timeout: ms || 100000 });

  // ---- 1. sample photo: AI finds the faces and hides them ----
  const t0 = Date.now();
  await page.click('#sampleBtn');
  await idle(1);
  const faces = +(await page.getAttribute('#cntFaces', 'data-n'));
  const hidden = +(await page.getAttribute('#cntHidden', 'data-n'));
  log(`sample: ${faces}/18 faces in ${Date.now() - t0} ms, backend ${await page.evaluate(() => FACE_BLUR_TEST.backend())}`);
  expect(faces >= 15 && faces <= 21, `expected about 18 faces on the sample, got ${faces}`);
  expect(hidden === faces, `all faces should start hidden (${hidden}/${faces})`);
  expect(await page.locator('#layer .fb-box').count() === faces, 'one tap button per face');

  /* mean pixel difference between the shown photo and the original inside a face box */
  const diff = (id) => page.evaluate((id) => new Promise((resolve) => {
    const b = FACE_BLUR_TEST.boxes().filter(x => x.id === id)[0];
    const im = new Image();
    im.onload = () => {
      const view = document.getElementById('view');
      const c = document.createElement('canvas'); c.width = view.width; c.height = view.height;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height);
      const r = [Math.round(b.x), Math.round(b.y), Math.max(1, Math.round(b.w)), Math.max(1, Math.round(b.h))];
      const a = x.getImageData(r[0], r[1], r[2], r[3]).data, v = view.getContext('2d').getImageData(r[0], r[1], r[2], r[3]).data;
      let s = 0; for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - v[i]) + Math.abs(a[i + 1] - v[i + 1]) + Math.abs(a[i + 2] - v[i + 2]);
      resolve(s / (a.length / 4) / 3);
    };
    im.src = window.FACE_BLUR_SAMPLE;
  }), id);
  const first = await page.evaluate(() => FACE_BLUR_TEST.boxes()[0].id);
  const dHidden = await diff(first);
  expect(dHidden > 4, `face 1 should be blurred (mean pixel change ${dHidden.toFixed(1)})`);

  // ---- 2. tap a face to show it again ----
  await page.click(`#layer .fb-box[data-id="${first}"]`);
  expect(await page.getAttribute(`#layer .fb-box[data-id="${first}"]`, 'aria-pressed') === 'false', 'tapped face shows again');
  expect(+(await page.getAttribute('#cntHidden', 'data-n')) === faces - 1, 'hidden count drops by one');
  const dShown = await diff(first);
  expect(dShown < dHidden / 3, `shown face should look like the original again (mean change ${dShown.toFixed(2)} vs ${dHidden.toFixed(1)} hidden)`);
  await page.click(`#layer .fb-box[data-id="${first}"]`);
  expect(+(await page.getAttribute('#cntHidden', 'data-n')) === faces, 'hidden again');

  // ---- 3. draw a box by hand (bottom right: the caption area) ----
  await page.click('#drawBtn');
  const r = await page.locator('#layer').boundingBox();
  await page.mouse.move(r.x + r.width * 0.80, r.y + r.height * 0.90);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width * 0.88, r.y + r.height * 0.94, { steps: 4 });
  await page.mouse.move(r.x + r.width * 0.97, r.y + r.height * 0.98, { steps: 4 });
  await page.mouse.up();
  await page.click('#drawBtn');
  expect(+(await page.getAttribute('#cntMine', 'data-n')) === 1, 'one hand-drawn box');
  expect(await page.locator('#layer .fb-box.manual').count() === 1, 'hand-drawn box shown on the photo');

  // ---- 3b. even the LOWEST strength wipes out the detail (the strength is relative to the box size) ----
  await page.$eval('#strength', (e) => { e.value = '1'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  const detail = await page.evaluate(() => new Promise((resolve) => {
    const b = FACE_BLUR_TEST.boxes().filter(x => x.kind === 'manual')[0];
    const im = new Image();
    im.onload = () => {
      const view = document.getElementById('view');
      const c = document.createElement('canvas'); c.width = view.width; c.height = view.height;
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      const r = [Math.round(b.x + b.w * 0.15), Math.round(b.y + b.h * 0.2), Math.round(b.w * 0.7), Math.round(b.h * 0.6)];
      const grad = (ctx) => { const d = ctx.getImageData(r[0], r[1], r[2], r[3]).data; let s = 0, n = 0;
        for (let y = 0; y < r[3]; y++) for (let x = 0; x < r[2] - 1; x++) { const i = (y * r[2] + x) * 4; s += Math.abs(d[i] - d[i + 4]) + Math.abs(d[i + 1] - d[i + 5]); n++; } return s / n; };
      resolve({ orig: grad(c.getContext('2d')), now: grad(view.getContext('2d')) });
    };
    im.src = window.FACE_BLUR_SAMPLE;
  }));
  log(`detail in the hand-drawn box at strength 1: ${detail.now.toFixed(2)} (original ${detail.orig.toFixed(2)})`);
  expect(detail.now < detail.orig * 0.12, `strength 1 must still wipe out the detail (${detail.now.toFixed(2)} vs ${detail.orig.toFixed(2)})`);

  // ---- 4. save as JPG: no EXIF inside ----
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#saveJpg')]);
  const buf = fs.readFileSync(await dl.path());
  expect(buf[0] === 0xFF && buf[1] === 0xD8, 'saved file is a JPEG');
  expect(!buf.includes(Buffer.from('Exif\0\0', 'latin1')), 'saved JPEG has no EXIF block');
  expect(/-safe\.jpg$/.test(dl.suggestedFilename()), 'file name ends with -safe.jpg');
  await page.waitForSelector('#savedNote', { timeout: 5000 });
  log(`saved ${dl.suggestedFilename()} ${buf.length} bytes`);

  // ---- 5. location check on a JPEG with hand-built EXIF (camera + GPS) ----
  const b64 = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 320; c.height = 240;
    const x = c.getContext('2d'); x.fillStyle = '#7a9'; x.fillRect(0, 0, 320, 240); x.fillStyle = '#234'; x.fillRect(40, 40, 120, 90);
    const jpg = new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9))).arrayBuffer());
    const T = []; const w16 = v => T.push(v & 255, (v >> 8) & 255); const w32 = v => T.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255);
    T.push(0x49, 0x49); w16(42); w32(8);                                    // little-endian TIFF, IFD0 at 8
    w16(2); w16(0x010F); w16(2); w32(8); w32(38); w16(0x8825); w16(4); w32(1); w32(46); w32(0);
    'TestCam'.split('').forEach(ch => T.push(ch.charCodeAt(0))); T.push(0); // Make at 38
    w16(4);                                                                // GPS IFD at 46
    w16(1); w16(2); w32(2); T.push(78, 0, 0, 0);                           // N
    w16(2); w16(5); w32(3); w32(100);
    w16(3); w16(2); w32(2); T.push(69, 0, 0, 0);                           // E
    w16(4); w16(5); w32(3); w32(124);
    w32(0);
    [28, 1, 36, 1, 5000, 100, 77, 1, 12, 1, 3000, 100].forEach(w32);       // 28°36'50", 77°12'30"
    const p = [0x45, 0x78, 0x69, 0x66, 0, 0].concat(T), len = p.length + 2;
    const seg = [0xFF, 0xE1, (len >> 8) & 255, len & 255].concat(p);
    const out = new Uint8Array(jpg.length + seg.length);
    out.set(jpg.subarray(0, 2), 0); out.set(seg, 2); out.set(jpg.subarray(2), 2 + seg.length);
    let s = ''; out.forEach(v => { s += String.fromCharCode(v); }); return btoa(s);
  });
  await page.setInputFiles('#fileInput', { name: 'delhi_trip.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(b64, 'base64') });
  await page.waitForSelector('#locGps', { timeout: 15000 });
  const coords = (await page.textContent('#locGps .fb-coords')).trim();
  expect(coords === '28.61389, 77.20833', `GPS read as ${coords}, expected 28.61389, 77.20833`);
  expect((await page.textContent('#locMeta')).includes('TestCam'), 'camera name shown');
  await idle(0, 60000);
  expect(+(await page.getAttribute('#cntFaces', 'data-n')) === 0, 'no faces in a plain test picture');
  log(`GPS check: ${coords}`);

  // ---- 6. a see-through PNG stays see-through when saved as PNG (and is put on white in the JPG) ----
  const png = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 200; c.height = 150;
    const x = c.getContext('2d'); x.fillStyle = '#c33'; x.beginPath(); x.arc(100, 75, 60, 0, 7); x.fill();
    const b = new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/png'))).arrayBuffer());
    let s = ''; b.forEach(v => { s += String.fromCharCode(v); }); return btoa(s);
  });
  await page.setInputFiles('#fileInput', { name: 'sticker.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.waitForFunction(() => document.getElementById('view').width === 200, null, { timeout: 15000 });
  await idle(0, 60000);
  const corner = async (sel) => {
    const [d] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click(sel)]);
    const b64 = fs.readFileSync(await d.path()).toString('base64');
    return page.evaluate(async (b64) => {
      const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const bm = await createImageBitmap(new Blob([u]));
      const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
      const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return Array.from(x.getImageData(2, 2, 1, 1).data);
    }, b64);
  };
  const pc = await corner('#savePng'), jc = await corner('#saveJpg');
  expect(pc[3] === 0, `PNG corner should stay see-through (alpha ${pc[3]})`);
  expect(jc[3] === 255 && jc[0] > 240 && jc[1] > 240 && jc[2] > 240, `JPG corner should be white (${jc.join(',')})`);
};
