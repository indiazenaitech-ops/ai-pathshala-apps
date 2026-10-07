/* Interaction test for Sign & Fill PDF (run by tools/verify.js in en and hi).
   Builds a 2-page PDF in the page with pdf-lib (page 2 has /Rotate 90), opens it, adds the text "OK", a drawn
   signature and a date on page 1 and a text on the rotated page 2, saves, then re-opens the download with
   pdf-lib (embedded image on page 1 only) and pdf.js (text positions match what was placed on screen). */
const fs = require('fs');

module.exports = async function ({ page, expect, log }) {
  await page.waitForSelector('#app[data-engine="ready"]', { timeout: 90000 });

  /* ---- built-in sample letter opens and has its 2 form fields ---- */
  await page.click('#sampleBtn');
  await page.waitForSelector('#app[data-doc="ready"]', { timeout: 30000 });
  const formCount = await page.$$eval('#formList input, #formList select, #formList textarea', els => els.length);
  expect(formCount === 2, 'sample letter shows 2 fillable fields (name + checkbox), got ' + formCount);

  /* ---- test PDF: page 1 portrait A4, page 2 landscape-looking via /Rotate 90 ---- */
  const b64 = await page.evaluate(async () => {
    const { PDFDocument, degrees, rgb } = window.PDFLib;
    const d = await PDFDocument.create();
    const p1 = d.addPage([595.28, 841.89]);
    p1.drawRectangle({ x: 40, y: 700, width: 200, height: 40, color: rgb(0.9, 0.9, 0.9) });
    const p2 = d.addPage([595.28, 841.89]);
    p2.setRotation(degrees(90));
    const b = await d.save();
    let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  });
  await page.evaluate(() => document.querySelector('#app').removeAttribute('data-doc'));
  await page.setInputFiles('#fileInput', { name: 'agreement.pdf', mimeType: 'application/pdf', buffer: Buffer.from(b64, 'base64') });
  await page.waitForSelector('#app[data-doc="ready"]', { timeout: 30000 });
  const total = await page.textContent('#pageTotal');
  expect(/2/.test(total), 'page counter shows 2 pages, got ' + total);

  /* ---- text "OK" ---- */
  await page.click('.sf-tools button[data-tool="text"]');
  await page.fill('#textIn', 'OK');
  await page.click('#textAdd');
  /* keyboard: the new item is selected, arrows move it */
  let items = await page.evaluate(() => window.__sf.items());
  const x0 = items[0].x;
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowRight');
  items = await page.evaluate(() => window.__sf.items());
  expect(Math.abs(items[0].x - (x0 + 11)) < 0.01, 'arrow keys moved the text by 1 + 10 pt, got ' + (items[0].x - x0));

  /* ---- drawn signature ---- */
  await page.click('.sf-tools button[data-tool="sign"]');
  await page.click('#sigModeSeg button[data-val="draw"]');
  const pad = await page.$('#sigPad');
  const bb = await pad.boundingBox();
  await page.mouse.move(bb.x + 20, bb.y + bb.height * 0.6);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(bb.x + 20 + i * 15, bb.y + bb.height * (0.6 + 0.25 * Math.sin(i)), { steps: 2 });
  await page.mouse.up();
  await page.click('#sigUse');
  await page.waitForFunction(() => window.__sf.items().some(i => i.type === 'image'), null, { timeout: 10000 });
  const savedShown = await page.isVisible('#savedSig');
  expect(savedShown, 'signature is remembered on this device');

  /* ---- date ---- */
  await page.click('.sf-tools button[data-tool="date"]');
  await page.selectOption('#dateFmt', 'dmy-');
  await page.click('#dateAdd');
  items = await page.evaluate(() => window.__sf.items());
  const date = items.find(i => i.kind === 'date');
  expect(date && /^\d{2}-\d{2}-\d{4}$/.test(date.text), 'date stamp is DD-MM-YYYY, got ' + (date && date.text));

  /* ---- rotated page 2: text "R90" ---- */
  await page.click('#nextBtn');
  await page.waitForFunction(() => document.querySelector('#pageNo').value === '2');
  const vp2 = await page.evaluate(async () => { const v = await window.__sf.viewport(1); return { w: v.width, h: v.height, r: v.rotation }; });
  expect(vp2.r === 90 && vp2.w > vp2.h, 'page 2 shown rotated (landscape on screen), got ' + JSON.stringify(vp2));
  await page.click('.sf-tools button[data-tool="text"]');
  await page.fill('#textIn', 'R90');
  await page.click('#textAdd');
  items = await page.evaluate(() => window.__sf.items());
  expect(items.length === 4, 'four items placed, got ' + items.length);

  /* ---- save and inspect ---- */
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#saveBtn')]);
  const name = dl.suggestedFilename();
  expect(/\.pdf$/.test(name), 'download is a .pdf, got ' + name);
  const out = fs.readFileSync(await dl.path()).toString('base64');
  const res = await page.evaluate(async (b64) => {
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const L = window.PDFLib, N = L.PDFName;
    const d = await L.PDFDocument.load(bytes);
    const pages = d.getPages().map(p => {
      const res = p.node.Resources(), xo = res && res.lookup(N.of('XObject'));
      let imgs = 0;
      if (xo && xo.keys) xo.keys().forEach(k => { const o = xo.lookup(k); if (o && o.dict && String(o.dict.get(N.of('Subtype'))) === '/Image') imgs++; });
      const c = p.node.Contents();
      const streams = !c ? 0 : c.asArray ? c.asArray().length : 1;
      return { imgs, streams, rot: p.getRotation().angle };
    });
    /* text positions with pdf.js, converted to on-screen viewport points */
    const pj = await window.pdfjsLib.getDocument({ data: bytes, worker: window.__sf.worker(), isEvalSupported: false }).promise;
    const texts = [];
    for (let n = 1; n <= pj.numPages; n++) {
      const pg = await pj.getPage(n), vp = pg.getViewport({ scale: 1 });
      const tc = await pg.getTextContent();
      tc.items.forEach(it => { if (it.str && it.str.trim()) { const pt = vp.convertToViewportPoint(it.transform[4], it.transform[5]); texts.push({ page: n - 1, str: it.str, x: pt[0], y: pt[1] }); } });
    }
    pj.destroy();
    return { n: d.getPageCount(), pages, texts };
  }, out);
  log && log(JSON.stringify(res));
  expect(res.n === 2, 'saved PDF still has 2 pages, got ' + res.n);
  expect(res.pages[0].imgs === 1, 'page 1 has exactly 1 embedded image (the signature), got ' + res.pages[0].imgs);
  expect(res.pages[1].imgs === 0, 'page 2 has no image, got ' + res.pages[1].imgs);
  expect(res.pages[0].streams >= 2, 'page 1 got an extra content stream, got ' + res.pages[0].streams);
  expect(res.pages[1].rot === 90, 'page 2 keeps /Rotate 90');

  const ok = items.find(i => i.text === 'OK'), r90 = items.find(i => i.text === 'R90');
  const tOK = res.texts.find(x => x.str === 'OK' && x.page === 0);
  const tR = res.texts.find(x => x.str === 'R90' && x.page === 1);
  const tD = res.texts.find(x => x.str === date.text && x.page === 0);
  expect(!!tOK && !!tR && !!tD, 'OK, date and R90 are real (selectable) text in the PDF: ' + JSON.stringify(res.texts));
  /* baseline sits at x + 0.15*size, y + 0.95*size in viewport points */
  const near = (txt, it) => Math.abs(txt.x - (it.x + it.size * 0.15)) < 1.5 && Math.abs(txt.y - (it.y + it.size * 0.95)) < 1.5;
  expect(near(tOK, ok), 'OK lands where it was placed on page 1: pdf ' + tOK.x.toFixed(1) + ',' + tOK.y.toFixed(1) + ' vs screen ' + ok.x.toFixed(1) + ',' + ok.y.toFixed(1));
  expect(near(tR, r90), 'R90 lands where it was placed on the rotated page: pdf ' + tR.x.toFixed(1) + ',' + tR.y.toFixed(1) + ' vs screen ' + r90.x.toFixed(1) + ',' + r90.y.toFixed(1));

  const msg = await page.textContent('#resultMsg');
  expect(msg.includes(name), 'result message names the saved file: ' + msg);
};
