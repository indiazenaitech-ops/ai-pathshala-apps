/* Interaction test for the Restaurant Menu Card Maker (run by tools/verify.js in en and hi, dialogs auto-accepted).
   Covers: sample menu, 3 hand-added items with veg / non-veg marks, half + full prices, ₹ formatting, CSV import of 4 rows,
   design class switch, FSSAI + GST lines, UPI QR, story PNG download, reload persistence and reset. */
module.exports = async function ({ page, expect }) {
  const settle = (ms) => page.waitForTimeout(ms || 250);
  const rows = () => page.$$eval('#sheet1 .m-row', els => els.map(e => ({ veg: e.dataset.veg, price: e.querySelector('.m-price').textContent.replace(/\s/g, ''), name: e.querySelector('.m-iname').textContent })));

  // 1. the sample menu is useful at once: 24 items in the preview
  await page.waitForSelector('#sheet1 .m-row');
  let r = await rows();
  expect(r.length === 24, 'sample menu shows 24 rows, got ' + r.length);
  expect(r.filter(x => x.veg === '0').length === 5, 'sample has 5 non-veg marks, got ' + r.filter(x => x.veg === '0').length);
  expect(await page.$eval('#menuSel', s => s.options.length) === 1, 'one saved menu at start');

  // 2. a new, empty menu
  await page.click('#btnNewMenu');
  await settle();
  expect(await page.$eval('#menuSel', s => s.options.length) === 2, 'new menu added to the list');
  expect((await page.$$('#sheet1 .m-row')).length === 0, 'new menu has no rows');
  expect((await page.$$('#catList .cat')).length === 4, 'new menu starts with 4 categories, got ' + (await page.$$('#catList .cat')).length);

  // 3. add 3 items by hand into the first category
  await page.click('#tab-items');
  const cat = '#catList .cat:first-of-type ';
  const add = async (name, price, half, nonveg) => {
    await page.click(cat + '.add-item');
    const it = cat + '.it >> nth=-1 >> ';
    await page.fill(it + '.f-name', name);
    await page.fill(it + '.f-price', price);
    if (half) await page.fill(it + '.f-half', half);
    if (nonveg) await page.click(it + '.f-veg-n');
  };
  await add('Paneer Tikka', '220', '', false);
  await add('Chicken Tikka', '280', '', true);
  await add('Dal Makhani', '1250', '120', false);
  await settle(400);
  r = await rows();
  expect(r.length === 3, 'preview shows 3 rows, got ' + r.length);
  expect(r[0].veg === '1' && r[1].veg === '0' && r[2].veg === '1', 'veg / non-veg marks right: ' + r.map(x => x.veg).join(','));
  expect((await page.$$('#sheet1 .m-row[data-veg="0"] svg path')).length === 1 && (await page.$$('#sheet1 .m-row[data-veg="1"] svg circle')).length === 2, 'non-veg draws a triangle, veg a circle');
  expect(r[2].price.indexOf('₹1,250') >= 0, 'Indian ₹ grouping 1,250, got ' + r[2].price);
  expect(r[2].price.indexOf('₹120') >= 0, 'half price shown, got ' + r[2].price);
  expect((await page.$$('#sheet1 .m-th')).length === 1, 'Half / Full header appears when a half price exists');
  expect(await page.$eval(cat + '.it:nth-of-type(2)', e => e.classList.contains('is-nonveg')), 'editor row marked non-veg');

  // 4. CSV import of 4 rows (one new category "Drinks", one non-veg, one half price)
  const csv = 'name,category,price,veg,half price\nMasala Chai,Drinks,20,veg,\nLassi,Drinks,70,veg,40\nMutton Curry,Mains,380,non-veg,220\nJeera Rice,Mains,130,veg,';
  const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 15000 }), page.click('#btnImportCsv')]);
  await chooser.setFiles({ name: 'menu.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf8') });
  await settle(500);
  r = await rows();
  expect(r.length === 7, 'CSV import of 4 rows gives 7 rows, got ' + r.length);
  expect((await page.$$('#catList .cat')).length === 6, 'import created the "Drinks" and "Mains" categories, got ' + (await page.$$('#catList .cat')).length);
  const mutton = r.find(x => x.name === 'Mutton Curry');
  expect(mutton && mutton.veg === '0' && mutton.price.indexOf('₹380') >= 0 && mutton.price.indexOf('₹220') >= 0, 'imported non-veg item with half price, got ' + JSON.stringify(mutton));
  expect((await page.textContent('#msg')).indexOf('4') >= 0, 'import message says 4 items');

  // 5. details: FSSAI line, GST line, UPI QR
  await page.click('#tab-details');
  expect((await page.$$('#sheet1 .m-fssai')).length === 0, 'no FSSAI line before it is filled');
  await page.fill('#fFssai', '12345678901234');
  await page.check('#fGst');
  await page.fill('#fUpi', 'sharma@okaxis');
  await settle(400);
  expect((await page.$$('#sheet1 .m-fssai')).length === 1 && (await page.textContent('#sheet1 .m-fssai')).indexOf('12345678901234') >= 0, 'FSSAI line appears when filled');
  expect((await page.$$('#sheet1 .m-gst')).length === 1, 'GST line appears');
  expect((await page.$$('#sheet1 .m-qr svg')).length === 1, 'UPI Scan & Pay QR drawn (no phone, so no WhatsApp QR)');
  await page.fill('#fFssai', '123');
  await settle();
  expect((await page.textContent('#fssaiMsg')).trim().length > 0, 'short FSSAI number gets a hint');
  await page.fill('#fFssai', '12345678901234');

  // 6. design switch changes the sheet class
  await page.click('#tab-design');
  await page.click('[data-design="royal"]');
  await settle();
  expect(await page.$eval('#sheet1', e => e.classList.contains('d-royal') && !e.classList.contains('d-classic')), 'design class switched to d-royal');
  await page.click('[data-layout="a4-2"]');
  await settle();
  expect((await page.$$('#sheet1 .m-body.cols-2')).length === 1, 'two-column layout');
  await page.click('[data-layout="tent"]');
  await settle();
  expect((await page.$$('#sheet1.tent .panel-t')).length === 2, 'tent card has two panels');

  // 7. story layout renders 1080 x 1920 canvases and the PNG download fires
  await page.click('[data-layout="story"]');
  await page.waitForSelector('#pvPages canvas', { timeout: 10000 });
  const dims = await page.$$eval('#pvPages canvas', cs => cs.map(c => [c.width, c.height]));
  expect(dims.length >= 1 && dims.every(d => d[0] === 1080 && d[1] === 1920), 'story canvases are 1080x1920, got ' + JSON.stringify(dims));
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#btnPng')]);
  const fn = dl.suggestedFilename();
  expect(/-story.*\.png$/.test(fn), 'story PNG download fired, got ' + fn);

  // 8. persistence across reload
  await page.reload();
  await page.waitForSelector('#pvPages canvas', { timeout: 10000 });
  expect(await page.$eval('#menuSel', s => s.options.length) === 2, 'both menus survive a reload');
  expect(await page.$eval('#fFssai', e => e.value) === '12345678901234', 'FSSAI persists');
  expect(await page.$eval('[data-design="royal"]', e => e.getAttribute('aria-pressed')) === 'true', 'design persists');
  await page.click('[data-layout="a4-1"]');
  await settle(400);
  r = await rows();
  expect(r.length === 7, 'items persist after reload, got ' + r.length);

  // 9. reset returns to the sample menu
  await page.click('#btnReset');
  await settle(500);
  expect(await page.$eval('#menuSel', s => s.options.length) === 1, 'reset leaves one menu');
  expect((await page.$$('#sheet1 .m-row')).length === 24, 'reset restores the sample menu');
  expect(await page.$eval('#fFssai', e => e.value) === '', 'reset clears FSSAI');
};
