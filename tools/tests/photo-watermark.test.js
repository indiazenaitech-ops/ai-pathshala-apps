/* Interaction test for Photo Watermark (run by tools/verify.js in en and hi).
   Sample picture -> one JPG at the sample's size. Then three files: a grey 1200 x 800 PNG, a 600 x 400 JPEG carrying
   EXIF orientation 6 + a GPS block, and a text file. The text file is left out; the grey photo gets a red watermark
   only in the chosen corner (then everywhere when repeated); the EXIF photo comes out rotated (400 x 600) with no
   EXIF/GPS bytes; "download all" gives one file per photo; a logo watermark lands in the top-left corner; Reset
   brings the sample back. */
const fs = require('fs');

module.exports = async function ({ page, expect, t }) {
  const ds = () => page.evaluate(() => Object.assign({}, document.getElementById('app').dataset));
  const idle = async () => {
    await page.waitForTimeout(120);
    await page.waitForFunction(() => document.getElementById('app').dataset.busy === '0', null, { timeout: 60000 });
  };
  const makeImage = (w, h, color, type) => page.evaluate(async ({ w, h, color, type }) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, w, h);
    const b = await new Promise((r) => c.toBlob(r, type, 0.9));
    const u = new Uint8Array(await b.arrayBuffer()); let s = '';
    for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
    return btoa(s);
  }, { w, h, color, type }).then((b64) => Buffer.from(b64, 'base64'));
  /* count red / green pixels in the four quarters and the centre of a downloaded JPG */
  const decode = (buf) => page.evaluate(async (b64) => {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const jpg = u[0] === 0xFF && u[1] === 0xD8;
    const bm = await createImageBitmap(new Blob([u], { type: 'image/jpeg' }));
    const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
    const x = c.getContext('2d'); x.drawImage(bm, 0, 0);
    const W = bm.width, H = bm.height, d = x.getImageData(0, 0, W, H).data;
    const q = { tl: 0, tr: 0, bl: 0, br: 0 }, g = { tl: 0, tr: 0, bl: 0, br: 0 };
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
      const i = (y * W + xx) * 4, k = (y < H / 2 ? 't' : 'b') + (xx < W / 2 ? 'l' : 'r');
      if (d[i] > 170 && d[i + 1] < 90 && d[i + 2] < 100) q[k]++;
      if (d[i + 1] > 150 && d[i] < 90 && d[i + 2] < 90) g[k]++;
    }
    return { w: W, h: H, jpg, red: q, green: g };
  }, buf.toString('base64'));
  const download = async (sel) => {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click(sel)]);
    return { name: dl.suggestedFilename(), buf: fs.readFileSync(await dl.path()) };
  };
  const run = async () => { await page.click('#process'); await idle(); };

  // 0) opens with a drawn sample
  await idle();
  let s = await ds();
  expect(s.sample === '1' && s.count === '0', 'opens with the sample picture');
  expect((await page.getAttribute('#prev', 'data-w')) === '1600', 'preview drawn from the sample: ' + await page.getAttribute('#prev', 'data-w'));
  expect((await page.inputValue('#wmText')) === t('wm_default'), 'default watermark text is filled in');
  await run();
  let d = await download('#dl-0');
  let o = await decode(d.buf);
  expect(o.jpg && o.w === 1600 && o.h === 1067, 'sample saved as a 1600 x 1067 JPG, got ' + o.w + ' x ' + o.h);
  expect(d.name === 'sample_watermark.jpg', 'file name sample_watermark.jpg, got ' + d.name);

  // 1) three files: grey PNG, JPEG with EXIF orientation 6 + GPS, and a text file
  const grey = await makeImage(1200, 800, '#808080', 'image/png');
  const plain = await makeImage(600, 400, '#406080', 'image/jpeg');
  const tiff = Buffer.concat([
    Buffer.from('49492a0008000000', 'hex'),                       // II, 42, IFD0 at 8
    Buffer.from('0200', 'hex'),                                   // 2 entries
    Buffer.from('1201030001000000' + '06000000', 'hex'),          // Orientation = 6 (rotate 90 CW to view)
    Buffer.from('2588040001000000' + '26000000', 'hex'),          // GPS IFD pointer -> offset 38
    Buffer.from('00000000', 'hex'),                               // no next IFD
    Buffer.from('0100', 'hex'),                                   // GPS IFD: 1 entry
    Buffer.from('0100020002000000' + '4e000000', 'hex'),          // GPSLatitudeRef = "N"
    Buffer.from('00000000', 'hex')
  ]);
  const exif = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const app1 = Buffer.concat([Buffer.from([0xFF, 0xE1, (exif.length + 2) >> 8, (exif.length + 2) & 255]), exif]);
  const rotated = Buffer.concat([plain.subarray(0, 2), app1, plain.subarray(2)]);
  expect(rotated.includes(Buffer.from('Exif')), 'test input really carries EXIF');
  await page.setInputFiles('#fileIn', [
    { name: 'Shop Front.png', mimeType: 'image/png', buffer: grey },
    { name: 'IMG_2041.jpg', mimeType: 'image/jpeg', buffer: rotated },
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a picture') }
  ]);
  await idle();
  s = await ds();
  expect(s.sample === '0' && s.count === '2', 'two photos added, text file left out: count ' + s.count);
  expect((await page.textContent('#pickMsg')).trim() === t('skipped', { n: 1 }), 'says one file was left out');
  expect((await page.textContent('#navCount')).trim() === '1 / 2', 'preview is on photo 1 of 2');

  // 2) red text, bottom right, fully visible
  await page.fill('#wmText', 'TEST MARK');
  await page.click('#colorChips [data-color="#e11d2e"]');
  await page.click('#posGrid [data-pos="br"]');
  await page.evaluate(() => {
    const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    set('opacity', 100); set('size', 40);
  });
  await run();
  s = await ds();
  expect(s.done === '2', 'two photos processed: ' + s.done);
  d = await download('#dl-0'); o = await decode(d.buf);
  expect(o.w === 1200 && o.h === 800, 'original resolution kept: ' + o.w + ' x ' + o.h);
  expect(o.red.br > 1500 && o.red.tl === 0 && o.red.tr === 0, 'red mark only in the bottom-right corner: ' + JSON.stringify(o.red));
  expect(d.name === 'Shop Front_watermark.jpg', 'file name keeps the photo name: ' + d.name);

  // 3) EXIF orientation respected, EXIF/GPS stripped
  d = await download('#dl-1'); o = await decode(d.buf);
  expect(o.w === 400 && o.h === 600, 'EXIF-rotated photo saved upright as 400 x 600, got ' + o.w + ' x ' + o.h);
  expect(!d.buf.includes(Buffer.from('Exif')), 'saved JPG has no EXIF block (GPS removed)');
  expect(o.red.br > 200, 'rotated photo also has the mark bottom right: ' + JSON.stringify(o.red));

  // 4) next / previous
  await page.click('#nextBtn'); await idle();
  expect((await page.textContent('#navCount')).trim() === '2 / 2', 'next goes to photo 2');
  expect((await page.getAttribute('#prev', 'data-w')) === '400', 'preview of the rotated photo is upright (400 wide)');
  await page.click('#prevBtn'); await idle();
  expect((await page.textContent('#navCount')).trim() === '1 / 2', 'previous goes back');

  // 5) repeat across the photo: changing a setting clears old results, mark is now in every quarter
  await page.click('#posTile');
  expect((await ds()).done === '0', 'old results cleared after a change');
  expect((await page.textContent('#doneLine')).trim() === t('stale_note'), 'tells the user to run again');
  await page.evaluate(() => { const e = document.getElementById('size'); e.value = 20; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await run();
  const [dls] = await Promise.all([
    (async () => { const a = []; a.push(await page.waitForEvent('download', { timeout: 30000 })); a.push(await page.waitForEvent('download', { timeout: 30000 })); return a; })(),
    page.click('#dlAll')
  ]);
  expect(dls.length === 2 && dls[0].suggestedFilename() !== dls[1].suggestedFilename(), 'download all gives two different files');
  o = await decode(fs.readFileSync(await dls[0].path()));
  expect(o.red.tl > 300 && o.red.tr > 300 && o.red.bl > 300 && o.red.br > 300, 'repeated mark covers all quarters: ' + JSON.stringify(o.red));

  // 6) logo watermark in the top-left corner; a bad logo file shows a message
  await page.click('#type-logo');
  expect(await page.isDisabled('#process'), 'cannot process with no logo chosen');
  await page.setInputFiles('#logoIn', { name: 'logo.txt', mimeType: 'text/plain', buffer: Buffer.from('nope') });
  await page.waitForFunction((m) => document.getElementById('logoMsg').textContent.trim() === m, t('err_logo'), { timeout: 10000 });
  const logo = await makeImage(200, 100, '#10c020', 'image/png');
  await page.setInputFiles('#logoIn', { name: 'logo.png', mimeType: 'image/png', buffer: logo });
  await page.waitForFunction(() => document.getElementById('app').dataset.logo === '1', null, { timeout: 10000 });
  await page.click('#posGrid [data-pos="tl"]');
  await run();
  d = await download('#dl-0'); o = await decode(d.buf);
  expect(o.green.tl > 5000 && o.green.br === 0 && o.red.br === 0, 'green logo top left only: ' + JSON.stringify(o.green));

  // 7) reset -> sample again
  await page.click('#resetAll'); await idle();
  s = await ds();
  expect(s.sample === '1' && s.done === '0', 'reset brings the sample back');
  expect((await page.getAttribute('#type-text', 'aria-pressed')) === 'true', 'reset goes back to a text watermark');
};
