/* Interaction test for Quotation Maker (run by tools/verify.js in en and hi).
   Every expected amount below was worked out by hand (see the comments), not copied from the app. */
const fs = require('fs');
module.exports = async function ({ page, lang, expect, log }) {
  const txt = async sel => (await page.textContent(sel)).trim();
  const lineFill = (i, f, v) => page.fill(`#lines .ln[data-i="${i}"] input[data-f="${f}"]`, v);
  const amounts = () => page.$$eval('#lines .ln .amt', a => a.map(x => x.textContent.trim()));
  const sheetRows = () => page.$$eval('#sheet tbody tr', rs => rs.map(r => [...r.children].map(c => c.textContent.trim())));

  /* 1. sample quotation
        line 1: 450 x 18.00 = 8,100.00; 5% off = 405.00  -> 7,695.00; GST 18% = 1,385.10 (692.55 + 692.55)
        line 2: 3 x 2,350.00 = 7,050.00; 150.00 off      -> 6,900.00; GST 18% = 1,242.00 (621.00 + 621.00)
        line 3: 1 x 2,499.50, no discount, no GST        -> 2,499.50
        subtotal 17,094.50; CGST 1,313.55; SGST 1,313.55; exact 19,721.60; round off +0.40; total 19,722.00 */
  expect(!(await page.$eval('#sampleBanner', e => e.hidden)), 'sample banner is shown at first');
  expect((await amounts()).join('|') === '₹7,695.00|₹6,900.00|₹2,499.50', 'sample line amounts, got ' + (await amounts()).join('|'));
  expect(await txt('#tSub') === '₹17,094.50', 'subtotal 17,094.50, got ' + await txt('#tSub'));
  expect(await txt('#tC') === '₹1,313.55' && await txt('#tS') === '₹1,313.55', 'CGST and SGST 1,313.55 each');
  expect(await page.$eval('#rowI', e => e.hidden), 'IGST row hidden for same-state');
  expect(await txt('#tR') === '+0.40', 'round off +0.40, got ' + await txt('#tR'));
  expect(await txt('#tTotal') === '₹19,722.00', 'grand total 19,722.00, got ' + await txt('#tTotal'));
  const w1 = lang === 'hi' ? 'रुपये उन्नीस हज़ार सात सौ बाईस मात्र' : 'Rupees Nineteen Thousand Seven Hundred Twenty Two Only';
  expect(await txt('#tWords') === w1, 'amount in words, got ' + await txt('#tWords'));
  expect(await txt('#sheet .q-words .w') === w1, 'same words on the quotation');
  let rows = await sheetRows();
  expect(rows.length === 3 && rows[0][rows[0].length - 1] === '7,695.00' && rows[0][5] === '5%' && rows[1][5] === '150.00' && rows[2][6] === '', 'quotation table shows 3 lines with discount and GST columns');
  expect(await txt('#sheet .q-tot .g span:last-child') === '₹19,722.00', 'grand total on the quotation');
  expect(await page.$('#sheet .q-mark') !== null, 'sample is marked SAMPLE on the sheet');
  const sampleText = await page.$eval('#sheet', e => e.textContent);
  expect(!/\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2}/.test(sampleText) && !/[6-9]\d{9}/.test(sampleText.replace(/\s/g, '')), 'sample has no real-looking GSTIN or phone number');

  /* 2. other state: the same tax as one IGST amount (1,385.10 + 1,242.00 = 2,627.10) */
  await page.click('#mode button[data-v="inter"]');
  expect(await txt('#tI') === '₹2,627.10' && await page.$eval('#rowC', e => e.hidden), 'IGST 2,627.10 replaces CGST + SGST');
  expect(await txt('#tTotal') === '₹19,722.00', 'total unchanged with IGST');
  expect(await page.$eval('#sampleBanner', e => e.hidden) && await page.$('#sheet .q-mark') === null, 'after an edit it is no longer marked as a sample');

  /* 3. no rounding: 19,721.60 with paise in words */
  await page.uncheck('#round');
  expect(await txt('#tTotal') === '₹19,721.60' && await page.$eval('#rowR', e => e.hidden), 'exact total 19,721.60 without round off');
  if (lang === 'en') expect(await txt('#tWords') === 'Rupees Nineteen Thousand Seven Hundred Twenty One and Sixty Paise Only', 'words with paise, got ' + await txt('#tWords'));
  await page.check('#round');
  await page.click('#mode button[data-v="intra"]');

  /* 4. blank quotation */
  await page.click('#sampleBtn');                                  // back to the sample (confirm is auto-accepted)
  await page.click('#newBtn');
  expect(await page.$eval('#bName', i => i.value) === '' && await page.$eval('#cName', i => i.value) === '', 'blank quotation clears the sample names');
  expect(await page.$$eval('#lines .ln', l => l.length) === 1 && await txt('#tTotal') === '₹0.00', 'one empty line and a zero total');
  expect(await txt('#tWords') === (lang === 'hi' ? 'रुपये शून्य मात्र' : 'Rupees Zero Only'), 'zero in words');
  expect((await sheetRows()).length === 1, 'empty quotation still shows a table row');

  /* 5. own data, lakh and crore
        line 1: 2.5 x 1,00,000.00 = 2,50,000.00; GST 5% = 12,500.00 (6,250.00 + 6,250.00)
        line 2: 3 x 3,33,33,333.33 = 9,99,99,999.99; GST 18% = 1,79,99,999.998; each half (9%) is 89,99,999.999, which rounds to 90,00,000.00
        subtotal 10,02,49,999.99; CGST 90,06,250.00; SGST 90,06,250.00; exact 11,82,62,499.99; round off +0.01; total 11,82,62,500.00 */
  await page.fill('#bName', 'Test Biz');
  await page.fill('#cName', 'Buyer One');
  await page.fill('#qNo', 'Q/25-26/007');
  await page.fill('#qDate', '2026-01-05');
  await page.fill('#qValid', '2026-01-20');
  await lineFill(0, 'desc', 'Item A'); await lineFill(0, 'qty', '2.5'); await lineFill(0, 'rate', '1,00,000'); await lineFill(0, 'gst', '5');
  expect(await txt('#tTotal') === '₹2,62,500.00', '2.5 x 1,00,000 + 5% = 2,62,500.00, got ' + await txt('#tTotal'));
  if (lang === 'en') expect(await txt('#tWords') === 'Rupees Two Lakh Sixty Two Thousand Five Hundred Only', 'lakh in words, got ' + await txt('#tWords'));
  await page.click('#addLine');
  await lineFill(1, 'desc', 'Big machine'); await lineFill(1, 'qty', '3'); await lineFill(1, 'unit', 'pcs'); await lineFill(1, 'rate', '33333333.33'); await lineFill(1, 'gst', '18');
  expect(await txt('#tSub') === '₹10,02,49,999.99', 'subtotal in crore, got ' + await txt('#tSub'));
  expect(await txt('#tC') === '₹90,06,250.00' && await txt('#tS') === '₹90,06,250.00', 'CGST/SGST 90,06,250.00, got ' + await txt('#tC'));
  expect(await txt('#tR') === '+0.01' && await txt('#tTotal') === '₹11,82,62,500.00', 'total 11,82,62,500.00, got ' + await txt('#tTotal'));
  const w2 = await txt('#tWords');
  if (lang === 'en') expect(w2 === 'Rupees Eleven Crore Eighty Two Lakh Sixty Two Thousand Five Hundred Only', 'crore in words, got ' + w2);
  else expect(w2 === 'रुपये ग्यारह करोड़ बयासी लाख बासठ हज़ार पाँच सौ मात्र', 'crore in Hindi words, got ' + w2);
  expect((await page.$eval('#sheet .q-meta', e => e.textContent)).includes('05-01-2026') && (await page.$eval('#sheet .q-meta', e => e.textContent)).includes('20-01-2026'), 'dates are printed as DD-MM-YYYY');

  /* 6. bad input never breaks the totals */
  await page.click('#addLine');
  await lineFill(2, 'desc', 'Oops'); await lineFill(2, 'qty', 'abc'); await lineFill(2, 'rate', '10');
  expect(await page.$$eval('#errs p', p => p.length) === 1 && await page.$eval('#lines .ln[data-i="2"] input[data-f="qty"]', i => i.getAttribute('aria-invalid') === 'true'), 'a quantity that is not a number is flagged');
  expect(await txt('#tTotal') === '₹11,82,62,500.00', 'a bad line is left out of the total');
  await lineFill(2, 'qty', ''); await lineFill(2, 'disc', '20');   // empty qty = 1; discount 20 > amount 10
  expect(await page.$$eval('#errs p', p => p.length) === 1 && await page.$eval('#lines .ln[data-i="2"] input[data-f="disc"]', i => i.getAttribute('aria-invalid') === 'true'), 'a discount bigger than the amount is flagged');
  await lineFill(2, 'disc', '10%'); await lineFill(2, 'rate', '१००');   // 1 x 100 (Devanagari digits) - 10% = 90.00, no GST
  expect((await amounts())[2] === '₹90.00' && await page.$$eval('#errs p', p => p.length) === 0, 'percent discount and Indian-language digits work, got ' + (await amounts())[2]);
  await lineFill(2, 'gst', '101');
  expect(await page.$$eval('#errs p', p => p.length) === 1, 'GST above 100% is flagged');
  await page.fill('#qValid', '2026-01-01');
  expect(await page.$$eval('#errs p', p => p.length) === 2, 'valid-till before the date gives a warning');
  await page.fill('#qValid', '2026-01-20');
  await page.click('#lines button[data-del="2"]');
  expect(await page.$$eval('#lines .ln', l => l.length) === 2 && await txt('#tTotal') === '₹11,82,62,500.00' && await page.$$eval('#errs p', p => p.length) === 0, 'removing the line restores the total');

  /* 7. very long text and HTML in the fields stay inside the sheet as plain text */
  const long = 'Shri Ganesh Hardware and Electricals Wholesale Suppliers Private Limited Company'.slice(0, 80);
  await page.fill('#cName', '<img src=x onerror="window.__xss=1">' + long);
  await page.fill('#bAddr', 'Line one\nLine two ' + 'x'.repeat(200));
  const chk = await page.evaluate(() => { const s = document.querySelector('#sheet'); return { img: s.querySelectorAll('img').length, xss: !!window.__xss, over: s.scrollWidth - s.clientWidth, name: s.querySelector('.q-cname').textContent }; });
  expect(chk.img === 0 && !chk.xss && chk.name.startsWith('<img src=x'), 'typed HTML is shown as text');
  expect(chk.over <= 1, 'long text wraps inside the sheet (overflow ' + chk.over + 'px)');
  await page.fill('#cName', 'Buyer One');

  /* 8. save as file, then open it again */
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#saveFile')]);
  expect(dl.suggestedFilename() === 'quotation-Q-25-26-007.json', 'file name from the quotation number, got ' + dl.suggestedFilename());
  const saved = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  expect(saved.app === 'quotation-maker' && saved.doc.biz.name === 'Test Biz' && saved.doc.lines.length === 2 && saved.doc.lines[1].rate === '33333333.33', 'saved file holds the quotation');
  await page.click('#sampleBtn');
  expect(await txt('#tTotal') === '₹19,722.00', 'sample is back');
  let [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#openFile')]);
  await fc.setFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"hello": [1, 2') });
  await page.waitForTimeout(300);
  expect(await txt('#tTotal') === '₹19,722.00', 'a broken file changes nothing');
  [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#openFile')]);
  await fc.setFiles({ name: 'other.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'something-else', doc: { lines: [] } })) });
  await page.waitForTimeout(300);
  expect(await txt('#tTotal') === '₹19,722.00', 'a file from another app changes nothing');
  [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#openFile')]);
  await fc.setFiles({ name: 'q.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await page.waitForFunction(() => document.querySelector('#bName').value === 'Test Biz');
  expect(await txt('#tTotal') === '₹11,82,62,500.00' && await page.$eval('#qNo', i => i.value) === 'Q/25-26/007', 'opening the file restores the quotation');

  /* 9. headings in English on request (other languages only) */
  if (lang !== 'en') {
    await page.check('#enLabels');
    expect(await txt('#sheet .q-title') === 'Quotation' && await txt('#sheet .q-words .w') === 'Rupees Eleven Crore Eighty Two Lakh Sixty Two Thousand Five Hundred Only', 'English headings and words on the sheet');
    await page.uncheck('#enLabels');
    expect(await txt('#sheet .q-title') !== 'Quotation', 'back to the interface language');
  }

  /* 10. print layout */
  await page.emulateMedia({ media: 'print' });
  const pr = await page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const s = document.querySelector('#sheet');
    return { form: vis(document.querySelector('.qm-form')), acts: vis(document.querySelector('#printBtn')), top: vis(document.querySelector('.edu-top')), sheet: vis(s), tf: getComputedStyle(s).transform, disc: vis(document.querySelector('.qm-disc')) };
  });
  expect(!pr.form && !pr.acts && !pr.top && !pr.disc && pr.sheet && pr.tf === 'none', 'print shows only the quotation at full size');
  const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true }).catch(() => null);
  if (pdf) { const n = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length; expect(n === 1, 'a short quotation prints on one A4 page, got ' + n); log('pdf pages', n); }
  await page.emulateMedia({ media: 'screen' });

  /* 11. the draft survives a reload */
  await page.reload();
  await page.waitForFunction(() => window.EDU_READY);
  expect(await page.$eval('#bName', i => i.value) === 'Test Biz' && await txt('#tTotal') === '₹11,82,62,500.00', 'draft is kept on this device');
  expect(await page.$eval('#sampleBanner', e => e.hidden), 'own quotation is not marked as a sample');
};
