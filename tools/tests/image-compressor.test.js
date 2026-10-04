/* Interaction test for Image Compressor & Resizer (run by tools/verify.js in en and hi).
   3 canvas-made photos (one JPEG with EXIF + GPS) -> Square post 1080x1080 JPG:
   size and dimensions correct, every file smaller, EXIF/GPS gone, watermark changes pixels,
   WebP + target size work, ZIP holds all photos. */
const fs = require('fs');

module.exports = async function ({ page, expect, t, log }) {
  // ---- make 3 test photos inside the page (noisy, so the originals are big) ----
  const files = await page.evaluate(async () => {
    function noisy(w, h, hue, alpha) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d');
      if (alpha) x.clearRect(0, 0, w, h);
      const g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'hsl(' + hue + ',70%,45%)'); g.addColorStop(1, 'hsl(' + (hue + 80) + ',70%,60%)');
      x.fillStyle = g;
      if (alpha) { x.beginPath(); x.arc(w / 2, h / 2, Math.min(w, h) * 0.4, 0, 7); x.fill(); } else x.fillRect(0, 0, w, h);
      const im = x.getImageData(0, 0, w, h), d = im.data; let s = 9;
      for (let i = 0; i < d.length; i += 4) { s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff; const n = (s >> 16) % 13 - 6; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
      x.putImageData(im, 0, 0);
      return c;
    }
    const blob = (c, type, q) => new Promise(r => c.toBlob(r, type, q));
    function exifSeg() {
      const T = []; const w16 = v => T.push((v >> 8) & 255, v & 255); const w32 = v => T.push((v >>> 24) & 255, (v >> 16) & 255, (v >> 8) & 255, v & 255);
      T.push(0x4D, 0x4D); w16(42); w32(8);
      w16(2); w16(0x010F); w16(2); w32(6); w32(38); w16(0x8825); w16(4); w32(1); w32(44); w32(0);
      'Phone'.split('').forEach(ch => T.push(ch.charCodeAt(0))); T.push(0);
      w16(4);
      w16(1); w16(2); w32(2); T.push(78, 0, 0, 0);
      w16(2); w16(5); w32(3); w32(98);
      w16(3); w16(2); w32(2); T.push(69, 0, 0, 0);
      w16(4); w16(5); w32(3); w32(122);
      w32(0);
      [28, 1, 36, 1, 0, 1, 77, 1, 12, 1, 0, 1].forEach(w32);
      const p = [0x45, 0x78, 0x69, 0x66, 0, 0].concat(T), len = p.length + 2;
      return [0xFF, 0xE1, (len >> 8) & 255, len & 255].concat(p);
    }
    const b64 = async (b) => { const u = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); };
    const a = await blob(noisy(1600, 1200, 20), 'image/png');
    let jb = new Uint8Array(await (await blob(noisy(1200, 1600, 200), 'image/jpeg', 0.97)).arrayBuffer());
    const seg = exifSeg(), withExif = new Uint8Array(jb.length + seg.length);
    withExif.set(jb.subarray(0, 2), 0); withExif.set(seg, 2); withExif.set(jb.subarray(2), 2 + seg.length);
    const c = await blob(noisy(2000, 1100, 120, true), 'image/png');
    return [
      { name: 'shop_front.png', mimeType: 'image/png', b64: await b64(a) },
      { name: 'kurta_photo.jpg', mimeType: 'image/jpeg', b64: await b64(new Blob([withExif])) },
      { name: 'logo_banner.png', mimeType: 'image/png', b64: await b64(c) }
    ];
  });

  const waitIdle = async (n) => {
    await page.waitForTimeout(150);
    await page.waitForFunction((n) => {
      const lis = [...document.querySelectorAll('#list .ic-item')];
      return document.getElementById('app').dataset.busy === '0' && lis.length === n && lis.every(li => li.dataset.status === 'done');
    }, n, { timeout: 60000 });
  };
  const rows = () => page.$$eval('#list .ic-item', els => els.map(li => ({ w: +li.dataset.w, h: +li.dataset.h, size: +li.dataset.size, orig: +li.dataset.orig, gps: li.dataset.gps, fmt: li.dataset.fmt, name: li.querySelector('.ic-dl').getAttribute('download'), badges: li.querySelector('.ic-badges').textContent })));
  /* decode an output file in the page: size, EXIF marker, pixels of the bottom-right quarter compared with the last call */
  const inspect = (i) => page.evaluate(async (i) => {
    const a = document.querySelectorAll('#list .ic-dl')[i];
    const b = await (await fetch(a.href)).blob();
    const u = new Uint8Array(await b.arrayBuffer());
    let exif = false, gpsText = false;
    for (let k = 0; k < u.length - 6; k++) {
      if (u[k] === 0x45 && u[k + 1] === 0x78 && u[k + 2] === 0x69 && u[k + 3] === 0x66 && u[k + 4] === 0 && u[k + 5] === 0) exif = true;
      if (u[k] === 0x50 && u[k + 1] === 0x68 && u[k + 2] === 0x6F && u[k + 3] === 0x6E && u[k + 4] === 0x65) gpsText = true;   // "Phone" (camera name)
    }
    const bm = await createImageBitmap(b);
    const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
    const x = c.getContext('2d'); x.drawImage(bm, 0, 0);
    const d = x.getImageData(bm.width >> 1, (bm.height * 3) >> 2, bm.width >> 1, bm.height >> 2).data;
    let changed = 0;
    const prev = (window.__icPrev || {})[i];
    if (prev && prev.length === d.length) for (let k = 0; k < d.length; k += 4) if (Math.abs(d[k] - prev[k]) + Math.abs(d[k + 1] - prev[k + 1]) + Math.abs(d[k + 2] - prev[k + 2]) > 60) changed++;
    window.__icPrev = window.__icPrev || {}; window.__icPrev[i] = d;
    return { w: bm.width, h: bm.height, type: b.type, size: b.size, jpeg: u[0] === 0xFF && u[1] === 0xD8, exif, camera: gpsText, changed };
  }, i);

  // 1. Square post (1080 x 1080), JPG, then add the 3 photos
  await page.click('#preset-ig_square');
  expect(await page.getAttribute('#preset-ig_square', 'aria-pressed') === 'true', 'square preset selected');
  expect(await page.getAttribute('#mode-fill', 'aria-pressed') === 'true', 'square preset uses fill (crop)');
  await page.setInputFiles('#fileInput', files.map(f => ({ name: f.name, mimeType: f.mimeType, buffer: Buffer.from(f.b64, 'base64') })));
  await waitIdle(3);
  let r = await rows();
  expect(r.length === 3, '3 photos listed, got ' + r.length);
  r.forEach((x, i) => {
    expect(x.w === 1080 && x.h === 1080, `photo ${i + 1} is 1080x1080, got ${x.w}x${x.h}`);
    expect(x.size > 0 && x.size < x.orig, `photo ${i + 1} smaller than original: ${x.size} < ${x.orig}`);
    expect(x.fmt === 'jpg' && /_1080x1080\.jpg$/.test(x.name), `photo ${i + 1} renamed {name}_{w}x{h}.jpg: ${x.name}`);
  });
  expect(r[0].name === 'shop_front_1080x1080.jpg', 'name pattern applied: ' + r[0].name);
  expect(r[1].gps === '1' && r[1].badges.includes(t('b_gps')), 'GPS found in the phone photo and "location removed" shown: ' + r[1].badges);
  expect(r[0].gps === '0', 'no GPS badge for a photo without location');

  const outs = [];
  for (let i = 0; i < 3; i++) outs.push(await inspect(i));
  outs.forEach((o, i) => {
    expect(o.w === 1080 && o.h === 1080, `decoded file ${i + 1} is 1080x1080, got ${o.w}x${o.h}`);
    expect(o.jpeg && o.type === 'image/jpeg', `file ${i + 1} is a real JPEG`);
    expect(!o.exif && !o.camera, `file ${i + 1} has no EXIF / camera data left`);
  });
  const stSaved = (await page.textContent('#stSaved')).trim();
  expect(/\d/.test(stSaved) && !stSaved.startsWith('+'), 'total saved shown: ' + stSaved);

  // 2. text watermark changes the pixels of the bottom-right corner
  await page.click('#wmDet > summary');
  await page.click('#wm-text');
  const wmText = await page.inputValue('#wmText');
  expect(wmText.trim().length > 0, 'sample watermark text filled in: ' + wmText);
  await waitIdle(3);
  const wm = await inspect(0);
  expect(wm.changed > 400, 'watermark changed pixels in the corner: ' + wm.changed);
  expect(wm.w === 1080 && !wm.exif, 'watermarked file still 1080x1080 without EXIF');
  await page.click('#wm-none');
  await waitIdle(3);

  // 3. WebP + "by file size" keeps every file under the limit
  await page.click('#fmt-webp');
  await page.click('#cm-size');
  await page.fill('#targetKB', '90');
  await waitIdle(3);
  r = await rows();
  r.forEach((x, i) => {
    expect(x.fmt === 'webp' && /\.webp$/.test(x.name), `photo ${i + 1} saved as WebP: ${x.name}`);
    expect(x.size <= 90 * 1024 || x.badges.includes(t('b_over', { kb: '90' })), `photo ${i + 1} under 90 KB: ${x.size}`);
  });
  expect(r.filter(x => x.size <= 90 * 1024).length >= 2, 'at least two photos fit under 90 KB: ' + r.map(x => x.size).join(', '));
  expect((await inspect(1)).type === 'image/webp', 'file is really WebP');

  // 4. ZIP with every photo
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#zipBtn')]);
  const zip = fs.readFileSync(await dl.path());
  let entries = 0;
  for (let k = 0; k < zip.length - 4; k++) if (zip[k] === 0x50 && zip[k + 1] === 0x4B && zip[k + 2] === 0x01 && zip[k + 3] === 0x02) entries++;
  expect(zip[0] === 0x50 && zip[1] === 0x4B && entries === 3, 'ZIP has 3 files, got ' + entries);
  expect(/\.zip$/.test(dl.suggestedFilename()), 'zip name ' + dl.suggestedFilename());

  // 5. Story (fit + blurred background) gives 9:16; removing a photo updates the list
  await page.click('#cm-quality');
  await page.click('#preset-story');
  await waitIdle(3);
  r = await rows();
  expect(r.every(x => x.w === 1080 && x.h === 1920), 'story size 1080x1920: ' + r.map(x => x.w + 'x' + x.h).join(', '));
  await page.click('#list .ic-item:nth-child(3) .ic-rm');
  await waitIdle(2);
  expect((await page.textContent('#stCount')).trim() === '2', 'count is 2 after removing one');
  log('sizes', r.map(x => x.size).join(','));
};
