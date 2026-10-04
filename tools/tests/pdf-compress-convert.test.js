/* Interaction test for PDF Compress & JPG to PDF (run by tools/verify.js in en and hi).
   Builds an image-heavy PDF and two JPG "ID card" photos inside the page, then drives all four tools. */
const fs = require('fs');

module.exports = async function ({ page, expect, log }) {
  // the PDF engine (pdf.js + pdf-lib) comes from a CDN
  await page.waitForSelector('#app[data-engine="ready"]', { timeout: 90000 });

  /* ---- test files, made in the page ---- */
  const files = await page.evaluate(async () => {
    const toB64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
    const jpg = async (w, h, hue, label, q) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, `hsl(${hue},70%,62%)`); g.addColorStop(1, `hsl(${hue + 140},65%,28%)`);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      let seed = hue + 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 260; i++) { x.fillStyle = `hsla(${rnd() * 360},80%,${30 + rnd() * 40}%,.55)`; x.beginPath(); x.arc(rnd() * w, rnd() * h, 8 + rnd() * 70, 0, 7); x.fill(); }
      const d = x.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) { const n = (rnd() - 0.5) * 34; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; }
      x.putImageData(d, 0, 0);
      x.fillStyle = '#111'; x.font = `bold ${Math.round(h / 12)}px sans-serif`; x.fillText(label, w * 0.08, h * 0.2);
      const b = await new Promise((r) => c.toBlob(r, 'image/jpeg', q));
      return new Uint8Array(await b.arrayBuffer());
    };
    const doc = await PDFLib.PDFDocument.create();
    for (let p = 0; p < 3; p++) {
      const img = await doc.embedJpg(await jpg(1240, 1754, p * 90, 'Scan page ' + (p + 1), 0.95));
      doc.addPage([595.28, 841.89]).drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
    }
    const pdf = await doc.save();
    // what many phone "image to PDF" apps make: the page is as many points as the photo has pixels (42 x 56 inch)
    const big = await PDFLib.PDFDocument.create();
    for (let p = 0; p < 3; p++) {
      const img = await big.embedJpg(await jpg(1512, 2016, 40 + p * 70, 'Phone page ' + (p + 1), 0.92));
      big.addPage([3024, 4032]).drawImage(img, { x: 0, y: 0, width: 3024, height: 4032 });
    }
    const bigPdf = await big.save();
    return {
      pdf: toB64(pdf), pdfSize: pdf.length, big: toB64(bigPdf), bigSize: bigPdf.length,
      front: toB64(await jpg(1000, 630, 30, 'FRONT', 0.9)),
      back: toB64(await jpg(1000, 630, 200, 'BACK', 0.9))
    };
  });
  const pdfBuf = Buffer.from(files.pdf, 'base64');
  log('test PDF size ' + files.pdfSize);
  expect(files.pdfSize > 600000, 'test PDF is image-heavy, got ' + files.pdfSize + ' bytes');
  const pdfFile = { name: 'scan-3-pages.pdf', mimeType: 'application/pdf', buffer: pdfBuf };
  const countPages = async (buf) => page.evaluate(async (b64) => {
    const bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return (await PDFLib.PDFDocument.load(u8)).getPageCount();
  }, buf.toString('base64'));
  const attr = (sel, a) => page.getAttribute(sel, a);

  /* ---- (a) compress to under 200 KB ---- */
  await page.click('#tab-compress');
  await page.setInputFiles('#cFile', pdfFile);
  await page.waitForSelector('#cResult[data-state="file"]', { timeout: 60000 });
  const meta = (await page.textContent('#cInfo')) || '';
  expect(/3/.test(meta), 'file info shows 3 pages: ' + meta);
  await page.click('#cT-200');
  await page.click('#cmStrong');
  await page.click('#cGo');
  await page.waitForSelector('#cResult[data-state="done"]', { timeout: 100000 });
  const bytes = +(await attr('#cResult', 'data-bytes'));
  const kind = await attr('#cResult', 'data-kind');
  log('compressed ' + files.pdfSize + ' -> ' + bytes + ' (' + kind + ')');
  expect(bytes > 0 && bytes < 200000, 'compressed PDF is under 200 KB, got ' + bytes);
  expect(kind === 'ok', 'result says target reached, got ' + kind);
  expect(+(await attr('#cResult', 'data-pages')) === 3, 'compressed PDF keeps 3 pages');
  // the downloaded file is the same size and really has 3 pages
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#cDownload')]);
  const got = fs.readFileSync(await dl.path());
  expect(got.length === bytes, 'download has ' + got.length + ' bytes, result said ' + bytes);
  expect(/compressed\.pdf$/.test(dl.suggestedFilename()), 'file name ' + dl.suggestedFilename());
  expect((await countPages(got)) === 3, 'downloaded PDF has 3 pages');
  // the size shown is rounded down, so it never reads "200 KB" for a file that is under 200 KB
  const shown = parseFloat(((await page.textContent('#cResult .pc-big bdi:last-of-type')) || '').replace(/[^0-9.]/g, ''));
  expect(shown > 0 && shown <= Math.floor(bytes / 100) / 10 + 1e-9 && shown < 200, 'shown size ' + shown + ' KB for ' + bytes + ' bytes');

  // pages sized in photo pixels (3024 x 4032 pt) must also reach the target: sharpness is measured per A4 page
  await page.setInputFiles('#cFile', { name: 'phone-app.pdf', mimeType: 'application/pdf', buffer: Buffer.from(files.big, 'base64') });
  await page.waitForSelector('#cResult[data-state="file"]', { timeout: 60000 });
  await page.click('#cT-100');
  await page.click('#cGo');
  await page.waitForSelector('#cResult[data-state="done"]', { timeout: 100000 });
  const bigBytes = +(await attr('#cResult', 'data-bytes'));
  log('phone-app PDF ' + files.bigSize + ' -> ' + bigBytes + ' (' + (await attr('#cResult', 'data-kind')) + ')');
  expect((await attr('#cResult', 'data-kind')) === 'ok' && bigBytes < 100000, 'photo-sized pages compress under 100 KB, got ' + bigBytes);
  expect(+(await attr('#cResult', 'data-pages')) === 3, 'photo-sized PDF keeps 3 pages');

  // a custom size outside 10-100000 KB is corrected in the box, so the size shown is the size used
  await page.click('#cT-other');
  await page.fill('#cCustom', '5');
  await page.press('#cCustom', 'Tab');
  expect((await page.inputValue('#cCustom')) === '10', 'custom size 5 is corrected to 10, got ' + (await page.inputValue('#cCustom')));
  await page.setInputFiles('#cFile', pdfFile);
  await page.waitForSelector('#cResult[data-state="file"]', { timeout: 60000 });

  // a file already under the target is never "compressed" bigger: the app says so instead
  await page.click('#cT-other');
  await page.fill('#cCustom', '5000');
  await page.click('#cGo');
  await page.waitForSelector('#cResult[data-state="under"]', { timeout: 10000 });
  expect((await attr('#cMsg', 'data-kind')) === 'under', 'already-under message shown');

  /* ---- (b) two JPGs -> PDF: 2 pages, then 1 page in "2 per page" mode ---- */
  await page.click('#tab-img');
  await page.click('#iPer button[data-v="1"]');
  await page.setInputFiles('#iFile', [
    { name: 'aadhaar-front.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(files.front, 'base64') },
    { name: 'aadhaar-back.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(files.back, 'base64') }
  ]);
  await page.waitForFunction(() => document.querySelectorAll('#iList .pc-tile').length === 2, null, { timeout: 20000 });
  expect((await page.textContent('#iList .pc-tile .pc-tname')).includes('front'), 'first photo is the front');
  await page.click('#iGo');
  await page.waitForSelector('#iResult[data-state="done"]', { timeout: 60000 });
  expect(+(await attr('#iResult', 'data-pages')) === 2, 'two photos make 2 pages, got ' + (await attr('#iResult', 'data-pages')));
  await page.click('#iPer button[data-v="2"]');
  await page.click('#iCard');
  await page.click('#iGo');
  await page.waitForSelector('#iResult[data-state="done"]', { timeout: 60000 });
  expect(+(await attr('#iResult', 'data-pages')) === 1, '2-per-page mode makes 1 page, got ' + (await attr('#iResult', 'data-pages')));
  const lay = await page.evaluate(() => window.PDFCC.layout());
  expect(lay.length === 1 && lay[0].slots === 2, 'layout has one page with 2 photos');
  const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#iDownload')]);
  const got2 = fs.readFileSync(await dl2.path());
  expect((await countPages(got2)) === 1, 'downloaded photo PDF has 1 page');
  // move the back photo first with the keyboard-friendly arrow button
  await page.click('#iList .pc-tile:nth-child(2) [data-fid$="-up"]');
  expect((await page.textContent('#iList .pc-tile .pc-tname')).includes('back'), 'reordered: back photo is now first');

  /* ---- (c) PDF pages -> JPG at 150 dpi, pages 1-2 ---- */
  await page.click('#tab-jpg');
  await page.click('#jDpi button[data-v="150"]');
  await page.click('#jFmt button[data-v="jpg"]');
  await page.setInputFiles('#jFile', pdfFile);
  await page.waitForFunction(() => document.querySelectorAll('#jPages .pc-page').length === 3, null, { timeout: 60000 });
  await page.fill('#jRange', '२-३');   // "२-३" typed on a Hindi keyboard
  expect((await page.$$eval('#jPages .pc-page[aria-pressed="true"]', (b) => b.map((x) => x.getAttribute('data-n')).join())) === '2,3', 'Devanagari digits select pages 2-3');
  await page.fill('#jRange', '1-2');
  expect((await page.$$eval('#jPages .pc-page[aria-pressed="true"]', (b) => b.length)) === 2, 'range 1-2 selects 2 pages');
  await page.click('#jGo');
  await page.waitForSelector('#jResult[data-state="done"]', { timeout: 60000 });
  expect(+(await attr('#jResult', 'data-count')) === 2, 'two images made');
  const w = +(await attr('#jResult .pc-out', 'data-w')), h = +(await attr('#jResult .pc-out', 'data-h'));
  expect(Math.abs(w - 1240) <= 2 && Math.abs(h - 1754) <= 2, 'A4 page at 150 dpi is 1240 x 1754 px, got ' + w + ' x ' + h);
  // the JPG says 150 dpi inside (JFIF density), so it prints at A4 size
  const [dl3] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#jResult .pc-out a')]);
  const j = fs.readFileSync(await dl3.path());
  expect(j[0] === 0xFF && j[1] === 0xD8 && j.toString('latin1', 6, 10) === 'JFIF' && j[13] === 1 && j.readUInt16BE(14) === 150 && j.readUInt16BE(16) === 150, 'JPG carries 150 dpi, got units ' + j[13] + ' x ' + j.readUInt16BE(14));

  /* ---- (d) unlock: a PDF without a password is reported as not locked ---- */
  await page.click('#tab-unlock');
  await page.setInputFiles('#uFile', pdfFile);
  await page.waitForSelector('#uStatus[data-kind]', { timeout: 60000 });
  expect((await attr('#uStatus', 'data-kind')) === 'none', 'unlocked PDF is reported as not locked');
  expect(await page.isHidden('#uSaveBox'), 'nothing to save for an unlocked PDF');
};
