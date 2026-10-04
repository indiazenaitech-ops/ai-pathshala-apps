/* Interaction test for PDF Merge, Split & Organise (run by tools/verify.js in en and hi).
   pdf-lib + pdf.js load from the CDN, so wait generously. Test PDFs are built in the page with pdf-lib,
   fed to the hidden file input, and every download is re-opened with pdf-lib to check the result. */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t, log }) {
  await page.waitForSelector('#app[data-engine="ready"]', { timeout: 90000 });

  /* ---- build two PDFs: A = 3 portrait A4 pages, B = 2 landscape pages ---- */
  const made = await page.evaluate(async () => {
    const { PDFDocument, rgb } = window.PDFLib;
    async function make(n, w, h) {
      const d = await PDFDocument.create();
      for (let i = 0; i < n; i++) {
        const p = d.addPage([w, h]);
        p.drawRectangle({ x: 30, y: 30, width: 80 + i * 20, height: 60, color: rgb(0.1, 0.4, 0.7) });
      }
      const b = await d.save();
      let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
      return btoa(s);
    }
    return { a: await make(3, 595.28, 841.89), b: await make(2, 841.89, 595.28) };
  });
  await page.setInputFiles('#fileInput', [
    { name: 'invoice-april.pdf', mimeType: 'application/pdf', buffer: Buffer.from(made.a, 'base64') },
    { name: 'gst-bill.pdf', mimeType: 'application/pdf', buffer: Buffer.from(made.b, 'base64') }
  ]);
  await page.waitForFunction(() => document.querySelectorAll('#grid .pg').length === 5, null, { timeout: 30000 });
  const nums = await page.$$eval('#grid .pg .pg-num', els => els.map(e => e.textContent.trim()));
  expect(nums.join(',') === '1,2,3,4,5', 'five page cards numbered 1-5, got ' + nums.join(','));
  const files = await page.$$eval('#fileList .pm-file', els => els.length);
  expect(files === 2, 'two source files listed, got ' + files);

  /* helper: click a button, catch the download, return its bytes as base64 + file name */
  async function download(sel) {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click(sel)]);
    const p = await dl.path();
    return { name: dl.suggestedFilename(), b64: fs.readFileSync(p).toString('base64') };
  }
  async function inspect(b64) {
    return page.evaluate(async (b64) => {
      const bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const d = await window.PDFLib.PDFDocument.load(bytes, { updateMetadata: false });
      const N = window.PDFLib.PDFName;
      const used = (res, k) => { const dct = res && res.lookup(N.of(k)); return !!(dct && dct.keys && dct.keys().length); };
      const pages = d.getPages().map(p => {
        const res = p.node.Resources();
        return { rot: p.getRotation().angle, w: Math.round(p.getWidth()), h: Math.round(p.getHeight()),
          /* pdf-lib leaves empty /Font and /XObject dicts on every page, so count what is inside */
          font: used(res, 'Font'), xobj: used(res, 'XObject') };
      });
      return { n: d.getPageCount(), pages, title: d.getTitle() || '', producer: d.getProducer() || '' };
    }, b64);
  }

  /* ---- rotate page 1 clockwise, then merge everything into one PDF ---- */
  await page.click('#grid .pg:nth-child(1) [data-act="rotR1"]');
  const rotBadge = await page.textContent('#grid .pg:nth-child(1) .pg-rot');
  expect(rotBadge.trim() === '90°', 'rotation badge shows 90°, got ' + rotBadge);
  await page.waitForSelector('#goBtn:not([disabled])');
  const merged = await download('#goBtn');
  expect(/\.pdf$/.test(merged.name), 'merge downloads a .pdf, got ' + merged.name);
  const m = await inspect(merged.b64);
  expect(m.n === 5, 'merged page count = 3 + 2 = 5, got ' + m.n);
  expect(m.pages[0].rot === 90, 'page 1 rotation angle 90, got ' + m.pages[0].rot);
  expect(m.pages[3].w === 842 && m.pages[3].h === 595, 'mixed sizes kept (page 4 is landscape), got ' + m.pages[3].w + 'x' + m.pages[3].h);
  expect(!m.producer && !m.title, 'metadata removed by default (no producer/title)');
  const result = await page.textContent('#resultMsg');
  expect(result.includes(merged.name), 'result message names the file: ' + result);

  /* ---- split by range "1-2" -> one PDF with 2 pages ---- */
  await page.click('#tabSplit');
  await page.click('#splitSeg button[data-val="ranges"]');
  await page.fill('#ranges', '1-2');
  await page.waitForTimeout(150);
  const plan = await page.textContent('#plan');
  expect(plan.includes(t('plan_one')), 'plan says one file: ' + plan);
  const part = await download('#goBtn');
  const pr = await inspect(part.b64);
  expect(pr.n === 2, 'split "1-2" gives 2 pages, got ' + pr.n);
  expect(pr.pages[0].rot === 90, 'rotation carried into the split file');

  /* ---- bad range is caught before building ---- */
  await page.fill('#ranges', '1-9');
  await page.waitForTimeout(150);
  const err = await page.textContent('#planErr');
  expect(err.trim() === t('err_range_out', { n: '9', total: '5' }), 'out-of-range message shown, got ' + err);
  expect(await page.$eval('#goBtn', b => b.disabled), 'download disabled for a bad range');

  /* ---- split every page -> ZIP with 5 PDFs ---- */
  await page.click('#splitSeg button[data-val="each"]');
  const zip = await download('#goBtn');
  expect(/\.zip$/.test(zip.name), 'many files come as a .zip, got ' + zip.name);
  const zipCount = await page.evaluate(async (b64) => {
    const z = await window.JSZip.loadAsync(b64, { base64: true });
    return Object.keys(z.files).filter(n => /\.pdf$/.test(n)).length;
  }, zip.b64);
  expect(zipCount === 5, 'ZIP holds 5 PDFs, got ' + zipCount);

  /* ---- delete + undo ---- */
  await page.click('#grid .pg:nth-child(2) [data-act="del1"]');
  await page.waitForFunction(() => document.querySelectorAll('#grid .pg').length === 4);
  await page.click('#undoBtn');
  await page.waitForFunction(() => document.querySelectorAll('#grid .pg').length === 5);

  /* ---- keyboard: select page 3 with Space, move it to the start with Ctrl+Home ---- */
  const srcOf3 = await page.$eval('#grid .pg:nth-child(3)', c => c.dataset.id);
  await page.focus('#grid .pg:nth-child(3)');
  await page.keyboard.press('Space');
  await page.keyboard.press('Control+Home');
  const firstId = await page.$eval('#grid .pg:nth-child(1)', c => c.dataset.id);
  expect(firstId === srcOf3, 'Ctrl+Home moved the selected page to position 1');
  await page.click('#undoBtn');

  /* ---- KYC watermark: vector text for English, canvas image for Indic text ---- */
  await page.click('#tabMerge');
  await page.click('#optWm summary');
  await page.click('#wmSeg button[data-val="text"]');
  await page.fill('#kycOrg', 'HDFC Bank');
  await page.click('#kycBtn');
  const wm = await page.inputValue('#wmText');
  const now = new Date(), p2 = n => String(n).padStart(2, '0');
  const today = p2(now.getDate()) + '-' + p2(now.getMonth() + 1) + '-' + now.getFullYear();
  expect(wm === t('kyc_text', { org: 'HDFC Bank', date: today }), 'KYC text with the bank and DD-MM-YYYY date, got: ' + wm);
  const stamped = await inspect((await download('#goBtn')).b64);
  if (/^[\x20-\x7e]*$/.test(wm)) expect(stamped.pages[2].font, 'English watermark drawn as vector text');
  else expect(stamped.pages[2].xobj, 'Indic watermark embedded as an image');
  await page.click('#wmSeg button[data-val="none"]');

  /* ---- a photo becomes an A4 page (landscape for a wide photo) ---- */
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 600; c.height = 380;
    const x = c.getContext('2d'); x.fillStyle = '#e8590c'; x.fillRect(0, 0, 600, 380); x.fillStyle = '#fff'; x.fillRect(40, 40, 200, 120);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.setInputFiles('#fileInput', [{ name: 'aadhaar-front.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') }]);
  await page.waitForFunction(() => document.querySelectorAll('#grid .pg').length === 6, null, { timeout: 20000 });
  const withImg = await inspect((await download('#goBtn')).b64);
  expect(withImg.n === 6 && withImg.pages[5].w === 842 && withImg.pages[5].h === 595, 'photo page is landscape A4, got ' + JSON.stringify(withImg.pages[5]));

  /* ---- page numbers: "Page n of N", start at 5, cover not numbered (vector text in English, image in Hindi) ---- */
  await page.click('#optNum summary');
  await page.check('#numOn');
  await page.selectOption('#numFmt', 'page');
  await page.fill('#numStart', '5');
  await page.check('#numSkip');
  const numbered = await download('#goBtn');
  if (lang === 'en') {
    const texts = await page.evaluate(async (b64) => {
      const bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const d = await window.pdfjsLib.getDocument({ data: bytes, isEvalSupported: false }).promise;
      const out = [];
      for (let i = 1; i <= d.numPages; i++) out.push((await (await d.getPage(i)).getTextContent()).items.map(x => x.str).join(' '));
      d.destroy();
      return out;
    }, numbered.b64);
    expect(!/Page/.test(texts[0]), 'cover page has no number: ' + texts[0]);
    expect(texts[1].includes('Page 5 of 9') && texts[5].includes('Page 9 of 9'), 'pages 2 and 6 read "Page 5 of 9" and "Page 9 of 9": ' + texts[1] + ' | ' + texts[5]);
  } else {
    const nb = await inspect(numbered.b64);
    expect(!nb.pages[0].xobj && nb.pages[1].xobj, 'Hindi page number drawn as an image on page 2, none on the cover');
  }
  expect(await page.isVisible('#result'), 'result card after saving');
  await page.uncheck('#numOn');
  expect(!(await page.isVisible('#result')), 'changing an extra hides the old result, so "Download again" cannot hand out a stale file');

  /* ---- ranges typed the way people really type them: Urdu comma, spaces, Indian digits, "-3" ---- */
  await page.click('#tabSplit');
  await page.click('#splitSeg button[data-val="ranges"]');
  for (const [typed, nFiles] of [['1-2، 4', 2], ['2 4', 2], ['१-३', 1], ['-3', 1], ['5 -', 1]]) {
    await page.fill('#ranges', typed);
    await page.waitForTimeout(120);
    const pl = await page.textContent('#plan'), er = (await page.textContent('#planErr')).trim();
    expect(!er && pl.includes(nFiles === 1 ? t('plan_one') : t('plan_zip', { n: String(nFiles) })), 'ranges "' + typed + '" -> ' + nFiles + ' file(s), got: ' + (er || pl));
  }
  await page.fill('#ranges', '2 4');
  await page.waitForTimeout(120);
  expect(!(await page.textContent('#plan')).includes('24'), '"2 4" means pages 2 and 4, never page 24');
  /* every N pages: 0 is refused, 4 -> 2 files for 6 pages */
  await page.click('#splitSeg button[data-val="every"]');
  await page.fill('#everyN', '0');
  await page.waitForTimeout(120);
  expect((await page.textContent('#planErr')).trim() === t('err_every') && await page.$eval('#goBtn', b => b.disabled), '"0 pages per file" is refused');
  await page.fill('#everyN', '4');
  await page.waitForTimeout(120);
  expect((await page.textContent('#plan')).includes(t('plan_zip', { n: '2' })), '6 pages, 4 per file -> 2 files');
  await page.click('#tabMerge');

  /* ---- bad files: damaged, empty and password-locked ---- */
  const pdfText = (objs, trailer) => {
    let s = '%PDF-1.4\n'; const offs = [];
    objs.forEach((o, i) => { offs.push(s.length); s += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
    const x = s.length;
    s += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
    s += 'trailer\n' + trailer + '\nstartxref\n' + x + '\n%%EOF\n';
    return Buffer.from(s, 'latin1');
  };
  const h32 = 'A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4E5F60718293A4B5C6D7E8F90';
  const locked = pdfText([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>',
    '<< /Filter /Standard /V 1 /R 2 /O <' + h32 + '> /U <' + h32 + '> /P -44 >>'
  ], '<< /Size 5 /Root 1 0 R /Encrypt 4 0 R /ID [<0123456789ABCDEF0123456789ABCDEF><0123456789ABCDEF0123456789ABCDEF>] >>');
  /* owner-password-only PDF (opens without a password, copying restricted): real RC4-40 /O and /U for an empty user password */
  const crypto = require('crypto');
  const PAD = Buffer.from('28BF4E5E4E758A4164004E56FFFA01082E2E00B6D0683E802F0CA9FE6453697A', 'hex');
  const md5 = b => crypto.createHash('md5').update(b).digest();
  const rc4 = (key, data) => {
    const S = [...Array(256).keys()]; let j = 0;
    for (let i = 0; i < 256; i++) { j = (j + S[i] + key[i % key.length]) & 255; [S[i], S[j]] = [S[j], S[i]]; }
    const out = Buffer.alloc(data.length); let i = 0; j = 0;
    for (let k = 0; k < data.length; k++) { i = (i + 1) & 255; j = (j + S[i]) & 255; [S[i], S[j]] = [S[j], S[i]]; out[k] = data[k] ^ S[(S[i] + S[j]) & 255]; }
    return out;
  };
  const docId = Buffer.from('0123456789ABCDEF0123456789ABCDEF', 'hex');
  const O = rc4(md5(Buffer.concat([Buffer.from('owner'), PAD]).subarray(0, 32)).subarray(0, 5), PAD);
  const pBytes = Buffer.alloc(4); pBytes.writeInt32LE(-44);
  const U = rc4(md5(Buffer.concat([PAD, O, pBytes, docId])).subarray(0, 5), PAD);
  const restricted = pdfText([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>',
    '<< /Filter /Standard /V 1 /R 2 /O <' + O.toString('hex') + '> /U <' + U.toString('hex') + '> /P -44 >>'
  ], '<< /Size 5 /Root 1 0 R /Encrypt 4 0 R /ID [<' + docId.toString('hex') + '><' + docId.toString('hex') + '>] >>');
  await page.setInputFiles('#fileInput', [
    { name: 'broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('this is not a pdf') },
    { name: 'empty.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(0) },
    { name: 'salary-locked.pdf', mimeType: 'application/pdf', buffer: locked },
    { name: 'statement-restricted.pdf', mimeType: 'application/pdf', buffer: restricted }
  ]);
  await page.waitForFunction(() => document.querySelectorAll('#msgs .callout.danger').length >= 4, null, { timeout: 20000 });
  const msgs = await page.$$eval('#msgs .callout p', els => els.map(e => e.textContent));
  expect(msgs.includes(t('err_corrupt', { name: 'broken.pdf' })), 'damaged file message: ' + msgs.join(' | '));
  expect(msgs.includes(t('err_empty', { name: 'empty.pdf' })), 'empty file message');
  expect(msgs.includes(t('err_locked', { name: 'salary-locked.pdf' })), 'locked PDF points to the unlock app');
  expect(msgs.includes(t('err_owner', { name: 'statement-restricted.pdf' })), 'owner-restricted PDF gets its own "no password needed" message: ' + msgs.join(' | '));
  const unlockHref = await page.$eval('#msgs a.btn', a => a.getAttribute('href'));
  expect(/pdf-compress-convert\/index\.html\?lang=\w+#unlock$/.test(unlockHref), 'unlock button opens the Unlock tab of the PDF Compress app: ' + unlockHref);
  const still = await page.$$eval('#grid .pg', els => els.length);
  expect(still === 6, 'bad files add no pages, still 6, got ' + still);
  log('merge/split/zip/rotate/KYC/image/bad-file checks passed');
};
