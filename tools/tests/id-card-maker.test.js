/* Interaction test for ID Card Maker (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t }) {
  const settle = () => page.waitForTimeout(220);                 // input renders are debounced by 60 ms
  const data = () => page.$eval('#card', (c) => Object.assign({ w: c.width, h: c.height }, c.dataset));
  const ink = (x, y, w, h) => page.$eval('#card', (c, r) => {      // share of non-white pixels in a region of the card
    const d = c.getContext('2d').getImageData(r[0], r[1], r[2], r[3]).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235) n++;
    return n / (d.length / 4);
  }, [x, y, w, h]);
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });

  // 1. opens with a sample card in the page language, flagged as a sample, with a QR code
  await page.waitForSelector('#card', { timeout: 15000 });
  let d = await data();
  expect(d.sample === '1' && await page.isVisible('#sampleNote'), 'sample card and sample note shown');
  expect(d.name === t('sample_name') && d.org === t('sample_org'), 'sample name and organisation in the page language: ' + d.name);
  expect(+d.w === 540 && +d.h === 860 && d.orient === 'portrait', 'portrait card 540 x 860, got ' + d.w + 'x' + d.h);
  expect(+d.qr >= 21 && +d.rows === 4 && d.fits === '1', 'sample has a QR code, 4 detail rows and fits: ' + JSON.stringify(d));

  // 2. typing real details replaces the sample
  await page.fill('#fOrg', 'Test Vidyalaya');
  await page.fill('#fName', 'Kavya Nair');
  await page.fill('#fClass', '8 A');
  await page.fill('#fId', 'TV-1042');
  await page.selectOption('#fBlood', 'O+');
  await settle();
  d = await data();
  expect(d.sample === '0' && !(await page.isVisible('#sampleNote')), 'sample note gone after typing');
  expect(d.name === 'Kavya Nair' && d.org === 'Test Vidyalaya', 'typed name and organisation on the card');
  expect(+d.rows === 2 && +d.qr >= 21, 'only filled rows are drawn (ID + blood), got ' + d.rows);

  // 3. QR follows the ID number and can be switched off
  await page.fill('#fId', '');
  await settle();
  d = await data();
  expect(+d.qr === 0 && await page.isVisible('#qrNote'), 'no QR without an ID number, and a hint is shown');
  await page.fill('#fId', 'TV-1042');
  await settle();
  const qrInk = await ink(540 - 40 - 118, 860 - 16 - 12 - 118, 118, 118);
  expect(qrInk > 0.25 && qrInk < 0.75, 'QR modules drawn in the bottom corner, ink ' + qrInk.toFixed(2));
  await page.uncheck('#qrOn');
  await settle();
  expect(+(await data()).qr === 0, 'QR switched off');
  await page.check('#qrOn');

  // 4. landscape + colour theme
  await page.click('#or-landscape');
  await page.click('#swatches .sw:nth-child(3)');
  await settle();
  d = await data();
  expect(+d.w === 860 && +d.h === 540 && d.orient === 'landscape' && d.theme === '2', 'landscape 860 x 540 in colour 3');
  const head = await page.$eval('#card', (c) => Array.from(c.getContext('2d').getImageData(5, 5, 1, 1).data).slice(0, 3).join(','));
  expect(head === '138,28,43', 'header band uses the chosen colour, got ' + head);

  // 5. very long input never overflows the card
  await page.fill('#fName', 'Venkata Subramanian Lakshminarayanan Ramachandran Iyer Krishnamoorthy the Third');
  await page.fill('#fOrg', 'Sri Saraswati Vidya Mandir Higher Secondary School and Junior College of Arts Science and Commerce');
  await page.fill('#fAddress', 'Plot 12, Behind the Old Water Tank, Near the Very Long Named Market Road, Sample Nagar Extension Phase Two, District Example - 000000');
  await page.fill('#fValid', '31 March 2027');
  await page.fill('#fContact', '00000 00000');
  await settle();
  d = await data();
  expect(d.fits === '1' && +d.rows === 4, 'long text still fits the card: ' + JSON.stringify(d));
  await page.click('#or-portrait');
  await settle();
  expect((await data()).fits === '1', 'long text fits in portrait too');

  // 6. photo upload: bad file is refused, a real image is cropped into the frame
  let [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), page.click('#photoAdd')]);
  await fc.setFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a picture') });
  await settle();
  expect((await data()).photo === '0', 'a text file is not accepted as a photo');
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 200; const g = c.getContext('2d'); g.fillStyle = '#00c000'; g.fillRect(0, 0, 300, 200); return c.toDataURL('image/png').split(',')[1]; });
  [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), page.click('#photoAdd')]);
  await fc.setFiles({ name: 'face.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.waitForFunction(() => document.querySelector('#card').dataset.photo === '1', null, { timeout: 8000 });
  expect(await page.isVisible('#cropBox'), 'crop sliders appear with a photo');
  const px = await page.$eval('#card', (c) => Array.from(c.getContext('2d').getImageData(270, 300, 1, 1).data).slice(0, 3));
  expect(px[1] > 150 && px[0] < 60, 'photo fills the frame (green test image), got ' + px.join(','));

  // 7. single card on the A4 sheet with copies and cut marks
  await page.fill('#copies', '12');
  await settle();
  await page.click('#btnPrint');
  await page.waitForSelector('#printRoot[data-ready]', { state: 'attached', timeout: 20000 });
  let pages = await page.$$eval('#printRoot .pg', (p) => p.map((x) => x.querySelectorAll('.slot').length));
  expect(pages.join('/') === '9/3', '12 portrait copies = 9 + 3 on two sheets, got ' + pages.join('/'));
  expect(await page.evaluate(() => window.__printed) === 1, 'print dialog opened once');
  const geo = await page.$$eval('#printRoot .pg:first-child .slot', (els) => els.map((e) => [parseFloat(e.style.left), parseFloat(e.style.top), parseFloat(e.style.width), parseFloat(e.style.height)]));
  expect(geo.every((g) => g[2] === 54 && g[3] === 86 && g[0] >= 5 && g[0] + g[2] <= 205 && g[1] >= 5 && g[1] + g[3] <= 291.5), 'cards are 54 x 86 mm inside the printable area');
  expect(geo.every((a, i) => geo.every((b, j) => i === j || a[0] + a[2] <= b[0] || b[0] + b[2] <= a[0] || a[1] + a[3] <= b[1] || b[1] + b[3] <= a[1])), 'cards do not overlap');
  expect(await page.$eval('#printRoot .pg .marks path', (e) => e.getAttribute('d').split('M').length - 1) === 72, 'cut marks at all 4 corners of 9 cards');
  expect(await page.$$eval('#printRoot .slot img', (im) => im.every((i) => i.naturalWidth === 648 && i.naturalHeight === 1032)), 'print images are about 300 dpi');

  // 8. batch from CSV with bad rows
  await page.click('#mode-many');
  await settle();
  expect(+(await page.getAttribute('#batchStatus', 'data-count')) === 3 && await page.isVisible('#sampleNote'), 'empty list shows 3 sample cards');
  await page.fill('#csv', [
    'Name,Class,ID No.,Blood Group,Valid till,Contact,Address',
    'Aarav Shah,6 A,S-001,b positive,,,',
    ',6 A,S-002,O+,,,',
    'Diya Menon,6 B,S-001,XY,,,',
    '"Khan, Sara",7 C,S-004,AB-,June 2027,,"Lane 4, Sample Town"',
    'Only A Name',
    '', '   ,  ,',
    'Tenzin Dorjee,7 C,S-006,o+ve,,,'
  ].join('\n'));
  await settle();
  const st = await page.$eval('#batchStatus', (e) => Object.assign({ text: e.textContent }, e.dataset));
  expect(+st.count === 5, '5 good rows become cards, got ' + st.count);
  expect(+st.skipped === 1 && +st.dup === 1 && +st.badblood === 1, 'bad rows reported: skipped ' + st.skipped + ', dup ' + st.dup + ', bad blood ' + st.badblood);
  expect(st.text === t('batch_status', { n: 5 }), 'status text: ' + st.text);
  expect((await page.$$('#batchWarns li')).length === 3, 'three warnings listed');
  expect((await page.$$('#thumbs button')).length === 5, 'five thumbnails');
  d = await data();
  expect(d.name === 'Aarav Shah' && d.org.startsWith('Sri Saraswati') && +d.rows === 4, 'first card uses the row + shared details (blood fixed to B+): ' + JSON.stringify(d));
  await page.click('#thumbs button:nth-child(4)');
  await settle();
  expect((await data()).name === 'Only A Name', 'clicking a thumbnail shows that card');
  await page.click('#or-landscape');
  await settle();
  await page.click('#btnPrint');
  await page.waitForFunction(() => window.__printed === 2, null, { timeout: 20000 });
  pages = await page.$$eval('#printRoot .pg', (p) => p.map((x) => x.querySelectorAll('.slot').length));
  expect(pages.join('/') === '5', 'batch prints 5 landscape cards on one sheet, got ' + pages.join('/'));
  const lg = await page.$$eval('#printRoot .slot', (els) => els.map((e) => [parseFloat(e.style.left), parseFloat(e.style.top), parseFloat(e.style.width), parseFloat(e.style.height)]));
  expect(lg.every((g) => g[2] === 86 && g[3] === 54) && lg[1][0] > lg[0][0] && lg[2][1] > lg[0][1], 'landscape sheet is 2 across');
  await page.emulateMedia({ media: 'print' });
  const pr = await page.evaluate(() => { const r = document.querySelector('#printRoot .pg').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), getComputedStyle(document.querySelector('.idl')).display]; });
  await page.emulateMedia({ media: 'screen' });
  expect(Math.abs(pr[0] - 794) <= 2 && Math.abs(pr[1] - 1121) <= 3 && pr[2] === 'none', 'print shows only the A4 sheet: ' + pr.join(','));

  // 9. a header without a name column is explained; a 301st row is cut off
  await page.fill('#csv', 'class,id\n6 A,1\n');
  await settle();
  expect((await page.textContent('#batchStatus')).trim() === t('batch_no_name_col') && await page.isDisabled('#btnPrint'), 'missing name column is explained and print is off');
  await page.fill('#csv', Array.from({ length: 305 }, (_, i) => 'Person ' + (i + 1) + ',5,' + (i + 1)).join('\n'));
  await settle();
  expect(+(await page.getAttribute('#batchStatus', 'data-count')) === 300 && +(await page.getAttribute('#batchStatus', 'data-over')) === 5, 'list is capped at 300 cards');

  // 10. PNG download of the selected card
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.click('#btnPng')]);
  expect(/^id-card-1\.png$/.test(dl.suggestedFilename()), 'PNG file name from the ID number: ' + dl.suggestedFilename());

  // 11. state survives a reload; reset brings the sample back
  await page.fill('#csv', 'Aarav Shah,6 A,S-001');
  await page.click('#mode-one');
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForSelector('#card');
  await page.waitForFunction(() => document.querySelector('#card').dataset.photo === '1', null, { timeout: 8000 });
  d = await data();
  expect(d.name.startsWith('Venkata') && d.orient === 'landscape' && d.theme === '2', 'details, shape, colour and photo are remembered');
  await page.click('#btnReset');
  await settle();
  d = await data();
  expect(d.sample === '1' && d.photo === '0' && d.orient === 'portrait' && (await page.inputValue('#fName')) === '', 'reset brings back the sample card');
};
