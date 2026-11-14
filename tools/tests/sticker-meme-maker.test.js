/* Sticker & Meme Maker interaction test (run by tools/verify.js in en and hi).
   1) opens with a drawn sample; sticker PNG is a real 512 x 512 PNG with see-through corners (circle mask)
   2) WebP (when the browser can make it) is a real WebP and at most 100 KB; the page states the real size
   3) square shape without the border has solid corners
   4) add text in any script + an emoji, change it, remove it
   5) a photo from the device replaces the sample; a file that is not a picture shows a friendly message
   6) meme: canvas follows the photo shape, top text changes the picture, JPG and PNG downloads are real files;
      plain colour background is a 1080 square */
module.exports = async function ({ page, lang, expect, t, log }) {
  const attr = (k) => page.evaluate((k) => document.getElementById('app').getAttribute(k), k);
  const rev = () => page.evaluate(() => +document.getElementById('cv').dataset.rev || 0);
  const dims = () => page.evaluate(() => { const c = document.getElementById('cv'); return { w: c.width, h: c.height }; });
  const sig = () => page.evaluate(() => {
    const c = document.getElementById('cv'), x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let h = 0; for (let i = 0; i < x.length; i += 4 * 37) h = (Math.imul(h, 31) + x[i] + x[i + 1] * 3 + x[i + 2] * 7 + x[i + 3] * 11) >>> 0;
    return h;
  });
  const fileInfo = () => page.evaluate(async () => {
    const b = window.SMM_TEST.lastBlob, u8 = new Uint8Array(await b.arrayBuffer()), dv = new DataView(u8.buffer);
    const s = (p, n) => String.fromCharCode.apply(null, u8.slice(p, p + n));
    const out = { size: b.size, type: b.type, name: window.SMM_TEST.lastName, png: u8[0] === 0x89 && s(1, 3) === 'PNG', jpg: u8[0] === 0xFF && u8[1] === 0xD8,
      webp: s(0, 4) === 'RIFF' && s(8, 4) === 'WEBP', pw: dv.getUint32(16), ph: dv.getUint32(20) };
    const bmp = await createImageBitmap(b); out.w = bmp.width; out.h = bmp.height;
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; const g = c.getContext('2d'); g.drawImage(bmp, 0, 0);
    out.cornerA = g.getImageData(3, 3, 1, 1).data[3]; out.centerA = g.getImageData(bmp.width >> 1, bmp.height >> 1, 1, 1).data[3];
    return out;
  });
  const download = async (sel) => { const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click(sel)]); return dl.suggestedFilename(); };

  /* ---------- 1) sample sticker -> PNG ---------- */
  await page.waitForFunction(() => +document.getElementById('cv').dataset.rev > 0, null, { timeout: 15000 });
  expect(await attr('data-mode') === 'sticker' && await attr('data-photo') === 'sample', 'opens in sticker mode with the drawn sample');
  let d = await dims();
  expect(d.w === 512 && d.h === 512, 'sticker canvas is 512 x 512');
  expect(await attr('data-items') === '1', 'sample sticker has one text');
  let name = await download('#dlPng');
  let f = await fileInfo();
  expect(/^sticker-.*\.png$/.test(name) && f.png && f.pw === 512 && f.ph === 512, 'PNG sticker is a real 512 x 512 PNG: ' + JSON.stringify(f));
  expect(f.cornerA === 0 && f.centerA === 255, 'circle sticker has see-through corners and a solid middle');
  const msg1 = await page.textContent('#dlMsg');
  expect(/KB/.test(msg1) && msg1.includes('512'), 'download message states the real size: ' + msg1);
  log('png', f.size, 'bytes');

  /* ---------- 2) WebP under 100 KB ---------- */
  if (await page.isVisible('#dlWebp')) {
    name = await download('#dlWebp');
    f = await fileInfo();
    expect(/\.webp$/.test(name) && f.webp && f.w === 512 && f.h === 512, 'WebP sticker is a real 512 x 512 WebP');
    expect(f.size <= 100 * 1024, 'WebP sticker is at most 100 KB, got ' + f.size);
    expect(f.cornerA === 0, 'WebP keeps the see-through corners');
    log('webp', f.size, 'bytes');
  }

  /* ---------- 3) square, no border -> solid corners ---------- */
  await page.click('#shapeSeg [data-shape="square"]');
  await page.uncheck('#outline');
  await download('#dlPng');
  f = await fileInfo();
  expect(f.cornerA === 255, 'square sticker without border has solid corners');
  await page.click('#shapeSeg [data-shape="round"]');
  await page.check('#outline');

  /* ---------- 4) text + emoji ---------- */
  let s0 = await sig();
  await page.click('#addText');
  expect(await attr('data-items') === '1', 'empty text is not added');
  await page.fill('#newText', lang === 'hi' ? 'नमस्ते दोस्तों' : 'வணக்கம் Hello');
  await page.click('#addText');
  expect(await attr('data-items') === '2', 'typed text is added');
  expect(await page.isVisible('#itemEd'), 'the new text is selected for editing');
  let s1 = await sig();
  expect(s1 !== s0, 'the picture changes when text is added');
  await page.evaluate(() => { const e = document.getElementById('itSize'); e.value = 30; e.dispatchEvent(new Event('input', { bubbles: true })); });
  expect((await sig()) !== s1, 'changing the size redraws the text');
  await page.click('#emojiRow button');
  expect(await attr('data-items') === '3', 'emoji is added');
  await page.click('#itDel');
  expect(await attr('data-items') === '2' && !(await page.isVisible('#itemEd')), 'removing the selected emoji');

  /* ---------- 5) a photo from the device; then a file that is not a picture ---------- */
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 300; c.height = 200; const g = c.getContext('2d');
    g.fillStyle = '#dc2626'; g.fillRect(0, 0, 300, 200); g.fillStyle = '#2563eb'; g.fillRect(100, 50, 100, 100);
    return c.toDataURL('image/png').split(',')[1];
  });
  let r = await rev();
  await page.setInputFiles('#file', { name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') });
  await page.waitForFunction(() => document.getElementById('app').getAttribute('data-photo') === 'user', null, { timeout: 15000 });
  expect((await rev()) > r, 'canvas redrawn with the photo');
  expect(await attr('data-items') === '1', 'sample word is cleared, the typed text stays');
  await page.setInputFiles('#file', { name: 'notes.png', mimeType: 'image/png', buffer: Buffer.from('this is plain text, not a picture') });
  await page.waitForSelector('#msg:not([hidden])', { timeout: 15000 });
  expect((await page.textContent('#msg')).trim() === t('err_notimage'), 'friendly message for a file that is not a picture');
  expect(await attr('data-photo') === 'user', 'the photo is kept after a bad file');
  await page.setInputFiles('#file', { name: 'list.txt', mimeType: 'text/plain', buffer: Buffer.from('') });
  expect((await page.textContent('#msg')).trim() === t('err_notimage'), 'empty file is refused');

  /* ---------- 6) meme ---------- */
  await page.click('#modeMeme');
  expect(await attr('data-mode') === 'meme' && await page.isVisible('#memeCard') && !(await page.isVisible('#shapeCard')), 'meme controls shown');
  d = await dims();
  expect(d.w === 720 && d.h === 480, 'meme canvas follows the photo shape (3:2), got ' + JSON.stringify(d));
  s0 = await sig();
  await page.fill('#topText', lang === 'hi' ? 'जब छुट्टी की घंटी बजे' : 'When the last bell rings');
  await page.fill('#botText', 'ಖುಷಿ 😄 100%');
  expect((await sig()) !== s0, 'meme text changes the picture');
  name = await download('#dlJpg');
  f = await fileInfo();
  expect(/^meme-.*\.jpg$/.test(name) && f.jpg && f.w === 720 && f.h === 480, 'JPG meme is a real JPG at 720 x 480');
  name = await download('#dlPng');
  f = await fileInfo();
  expect(/\.png$/.test(name) && f.png && f.pw === 720 && f.ph === 480, 'PNG meme is a real PNG');
  await page.click('#plainBtn');
  d = await dims();
  expect(d.w === 1080 && d.h === 1080 && await attr('data-photo') === 'plain', 'plain colour meme is a 1080 square');
  const px = await page.evaluate(() => Array.from(document.getElementById('cv').getContext('2d').getImageData(8, 540, 1, 1).data));
  expect(px[0] === 0x1d && px[1] === 0x4e && px[2] === 0xd8, 'plain background uses the chosen colour, got ' + px);

  /* back to sticker: the photo is still there, canvas is 512 again */
  await page.click('#modeSticker');
  d = await dims();
  expect(d.w === 512 && d.h === 512, 'sticker canvas is 512 again');
};
