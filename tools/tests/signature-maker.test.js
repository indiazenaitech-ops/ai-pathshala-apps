/* Interaction test for Signature Maker (run by tools/verify.js in en and hi).
   Draw two strokes with the mouse -> transparent PNG cropped to the ink; undo twice -> empty again;
   sample "photo of paper" -> paper removed, ink kept in the chosen colour; exact size 140 x 60 under 20 KB;
   a file that is not a picture shows the friendly message; typed name gives a signature; empty name gives none. */
const fs = require('fs');

module.exports = async function ({ page, expect, t }) {
  const ds = () => page.evaluate(() => Object.assign({}, document.getElementById('app').dataset));
  const idle = async () => {
    await page.waitForTimeout(150);
    await page.waitForFunction(() => document.getElementById('app').dataset.busy === '0', null, { timeout: 20000 });
  };
  const decode = (buf) => page.evaluate(async (b64) => {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const png = u[0] === 0x89 && u[1] === 0x50, jpg = u[0] === 0xFF && u[1] === 0xD8;
    const bm = await createImageBitmap(new Blob([u], { type: png ? 'image/png' : 'image/jpeg' }));
    const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
    const x = c.getContext('2d'); x.drawImage(bm, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let clear = 0, ink = 0, white = 0, blueish = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 10) clear++;
      else if (d[i + 3] > 200 && d[i] + d[i + 1] + d[i + 2] < 420) { ink++; if (d[i + 2] > d[i] + 40) blueish++; }
      else if (d[i + 3] > 250 && d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240) white++;
    }
    return { w: bm.width, h: bm.height, png, jpg, n: d.length / 4, clear, ink, white, blueish, corner: Array.from(d.slice(0, 4)) };
  }, buf.toString('base64'));
  const download = async (sel) => {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click(sel)]);
    return { name: dl.suggestedFilename(), buf: fs.readFileSync(await dl.path()) };
  };

  await idle();
  expect((await ds()).has === '0', 'nothing to download before signing');
  expect(await page.isDisabled('#dlPng'), 'PNG button disabled while empty');

  // 1) draw two strokes
  const box = await page.locator('#pad').boundingBox();
  const P = (fx, fy) => [box.x + box.width * fx, box.y + box.height * fy];
  const stroke = async (pts) => {
    await page.mouse.move(...P(pts[0][0], pts[0][1])); await page.mouse.down();
    for (const p of pts.slice(1)) await page.mouse.move(...P(p[0], p[1]), { steps: 6 });
    await page.mouse.up();
  };
  await stroke([[0.3, 0.6], [0.4, 0.3], [0.45, 0.65], [0.55, 0.35], [0.6, 0.6]]);
  await stroke([[0.3, 0.75], [0.62, 0.72]]);
  await idle();
  expect((await ds()).has === '1', 'signature ready after drawing');
  let d = await download('#dlPng');
  let o = await decode(d.buf);
  expect(d.name === 'signature.png' && o.png, 'downloads signature.png as a real PNG');
  expect(o.corner[3] === 0 && o.clear > o.n * 0.5, 'drawn PNG is transparent around the ink: ' + o.clear + '/' + o.n);
  expect(o.ink > 200, 'drawn PNG has ink pixels: ' + o.ink);
  expect(o.w > o.h && o.w < 1100, 'cropped to the ink (wide, not the whole pad): ' + o.w + ' x ' + o.h);
  expect((await page.textContent('#status')).includes('signature.png'), 'status names the saved file');

  // 2) undo twice -> empty
  await page.click('#undo'); await idle();
  expect((await ds()).has === '1', 'one stroke left after one undo');
  await page.click('#undo'); await idle();
  expect((await ds()).has === '0', 'empty after undoing both strokes');
  expect((await page.textContent('#emptyMsg')).trim() === t('empty_draw'), 'empty message shown');

  // 3) from a photo: sample paper, blue ink, JPG on white
  await page.click('#mode-photo');
  await page.click('#samplePhoto'); await idle();
  expect((await ds()).has === '1', 'sample photo gives a signature');
  await page.click('#inkChips [data-ink="blue"]'); await idle();
  d = await download('#dlPng'); o = await decode(d.buf);
  expect(o.clear > o.n * 0.6, 'paper removed (transparent): ' + o.clear + '/' + o.n);
  expect(o.ink > 300 && o.blueish > o.ink * 0.8, 'ink kept and coloured blue: ' + o.blueish + '/' + o.ink);
  expect(o.w < 700 && o.h < 320, 'photo cropped to the signature: ' + o.w + ' x ' + o.h);
  d = await download('#dlJpg'); o = await decode(d.buf);
  expect(o.jpg && d.name === 'signature.jpg', 'JPG download is a JPEG');
  expect(o.corner[0] > 240 && o.white > o.n * 0.5, 'JPG has a white background');

  // 4) exact size for forms: 140 x 60 under 20 KB
  await page.evaluate(() => { document.getElementById('sizeBox').open = true; });
  await page.fill('#tw', '140'); await page.fill('#th', '60'); await page.fill('#kb', '20');
  await idle();
  d = await download('#dlJpg'); o = await decode(d.buf);
  expect(o.w === 140 && o.h === 60, 'form size is exactly 140 x 60, got ' + o.w + ' x ' + o.h);
  expect(d.buf.length <= 20 * 1024, 'file is under 20 KB: ' + d.buf.length);
  expect((await page.getAttribute('#line-jpg', 'data-state')) === 'ok', 'line says it is under the limit');
  expect(+(await page.getAttribute('#line-jpg', 'data-bytes')) === d.buf.length, 'shown size equals the real file size');
  // an impossible limit is reported, not hidden
  await page.fill('#tw', '2000'); await page.fill('#th', '900'); await page.fill('#kb', '1'); await idle();
  const st = await page.getAttribute('#line-png', 'data-state');
  expect(st === 'shrunk' || st === 'fail', 'tiny KB limit shrinks the PNG or says it failed: ' + st);
  if (st === 'shrunk') expect(+(await page.getAttribute('#line-png', 'data-bytes')) <= 1024, 'shrunk PNG is under 1 KB');
  await page.fill('#tw', ''); await page.fill('#th', ''); await page.fill('#kb', ''); await idle();

  // 5) a file that is not a picture
  await page.setInputFiles('#photoIn', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello, not an image') });
  await page.waitForFunction((m) => document.getElementById('photoMsg').textContent.trim() === m, t('err_notimg'), { timeout: 10000 });
  await idle();

  // 6) typed name
  await page.click('#mode-type'); await idle();
  expect((await ds()).has === '0', 'no typed signature until a name is typed');
  await page.fill('#nameIn', 'Ravi Kumar'); await idle();
  expect((await ds()).has === '1', 'typed name gives a signature');
  await page.click('#style-3'); await idle();
  expect((await page.getAttribute('#style-3', 'aria-pressed')) === 'true', 'style 4 selected');
  d = await download('#dlPng'); o = await decode(d.buf);
  expect(o.ink > 200 && o.w > o.h * 2, 'typed signature is a wide image with ink: ' + o.w + ' x ' + o.h);
  await page.fill('#nameIn', '   '); await idle();
  expect((await ds()).has === '0', 'blank name gives nothing');
};
