/* Interaction test for Barcode & MRP Label Maker (run by tools/verify.js in en and hi). */
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = async function ({ page, expect, t }) {
  const status = (a) => page.getAttribute('#codeStatus', 'data-' + a);
  const info = (a) => page.getAttribute('#sheetInfo', 'data-' + a);

  // 0. the sample label renders straight away
  await page.waitForSelector('#labelPreview svg.l-bars', { timeout: 10000 });
  expect(+(await info('labels')) > 0, 'sample sheet has labels');

  // 1. EAN-13: 12 digits -> check digit 0 -> 8901234567890
  await page.click('#type-ean13');
  await page.fill('#f-code', '890123456789');
  expect((await status('ok')) === '1', 'EAN accepted');
  expect((await status('check')) === '0', 'check digit 0, got ' + (await status('check')));
  expect((await status('full')) === '8901234567890', 'full code, got ' + (await status('full')));
  expect((await page.textContent('#labelPreview .l-hr')).trim() === '8 901234 567890', 'human-readable digits under the bars');
  const bits = await page.getAttribute('#labelPreview svg.l-bars', 'data-bits');
  expect(bits.length === 95 && bits.startsWith('101') && bits.slice(45, 50) === '01010' && bits.endsWith('101'), 'EAN-13 has 95 modules with guard bars');

  // 2. a wrong 13th digit is rejected, with the right digit named
  await page.fill('#f-code', '8901234567891');
  expect((await status('ok')) === '0', 'invalid EAN rejected');
  expect(await page.isDisabled('#btnAdd'), 'cannot add an invalid code');
  expect((await page.textContent('#codeErr')).includes(t('err_ean_check', { d: '0' })), 'error names check digit 0');
  await page.fill('#f-code', '89012345');
  expect((await page.textContent('#codeErr')).includes(t('err_ean_length')), 'short EAN rejected');

  // 3. Code 128: "ABC-123" -> Start B, A B C -, 1, Code C, 23, check 69, Stop
  await page.click('#type-code128');
  await page.fill('#f-code', 'ABC-123');
  expect((await status('ok')) === '1' && (await status('kind')) === 'code128', 'Code 128 accepted');
  const vals = await page.getAttribute('#labelPreview svg.l-bars', 'data-values');
  expect(vals === '104,33,34,35,13,17,99,23,69,106', 'Code 128 symbol values, got ' + vals);
  const bits128 = await page.getAttribute('#labelPreview svg.l-bars', 'data-bits');
  expect(bits128.length === 11 * 9 + 13, 'Code 128 width 11 per symbol + 13 stop, got ' + bits128.length);
  await page.fill('#f-code', 'चावल');
  expect((await status('ok')) === '0', 'non-English text refused in Code 128');

  // 4. auto type: 12 digits -> EAN-13, text -> Code 128
  await page.click('#type-auto');
  await page.fill('#f-code', '890123456789');
  expect((await status('kind')) === 'ean13', 'auto picks EAN-13 for 12 digits');
  await page.fill('#f-code', 'RICE-1KG');
  expect((await status('kind')) === 'code128', 'auto picks Code 128 for text');

  // 5. clear the list, import a 3-row CSV -> 3 labels on the sheet
  await page.click('#btnClear');
  await page.waitForTimeout(200);
  expect((await info('labels')) === '0', 'list cleared');
  const csv = 'name,code,mrp,qty\nHaldi Powder,8901234567012,45,100 g\nJeera,JEERA-100,60,100 g\nGhee,890123456789,550,500 ml\n';
  const file = path.join(os.tmpdir(), 'blm-test-' + Date.now() + '.csv');
  fs.writeFileSync(file, csv);
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnImport')]);
  await fc.setFiles(file);
  await page.waitForFunction(() => document.querySelector('#sheetInfo').getAttribute('data-labels') === '3', null, { timeout: 5000 });
  expect((await page.$$eval('#sheetPages .page .lbl', (e) => e.length)) === 3, 'three labels drawn on the sheet');
  expect((await page.$$eval('#itemsBody tr', (e) => e.length)) === 3, 'three rows in the list');
  const hrs = await page.$$eval('#sheetPages .lbl .l-hr', (e) => e.map((x) => x.textContent));
  expect(hrs.includes('8 901234 567890') && hrs.includes('JEERA-100'), 'CSV codes encoded: ' + hrs.join(' | '));
  const mrps = await page.$$eval('#sheetPages .lbl .l-mrp', (e) => e.map((x) => x.textContent));
  expect(mrps.some((m) => m.includes('₹550.00')), 'MRP printed with rupee sign: ' + mrps.join(' | '));
  try { fs.unlinkSync(file); } catch (e) { }

  // 6. presets: 65 per A4 page; 24 per page; copies fill pages
  expect((await info('per')) === '65', 'A4 65 preset by default');
  await page.click('#preset-a4_24');
  expect((await info('per')) === '24', '24 per sheet preset');
  await page.fill('#itemsBody tr:first-child input.copies', '30');
  await page.waitForFunction(() => document.querySelector('#sheetInfo').getAttribute('data-labels') === '32', null, { timeout: 3000 });
  expect((await info('pages')) === '2', '32 labels need 2 pages of 24');
  await page.click('#preset-roll');
  expect((await info('per')) === '2', 'roll prints 2 across');
  const pageRule = await page.textContent('#pageRule');
  expect(pageRule.includes('102mm 25mm'), 'roll page size set for printing: ' + pageRule);
  await page.click('#preset-a4_65');

  // 7. a skipped (already used) label slot shifts the labels
  await page.click('#adjustBox summary');
  await page.fill('#o-skip', '5');
  await page.waitForTimeout(300);
  expect((await page.$$eval('#sheetPages .page-frame:first-child .slot-skip', (e) => e.length)) === 5, 'five used slots skipped');

  // 8. print layout: only label pages, real size
  await page.emulateMedia({ media: 'print' });
  const w = await page.$eval('#sheetPages .page', (p) => p.getBoundingClientRect().width);
  expect(Math.abs(w - 210 * 96 / 25.4) < 2, 'A4 page is 210 mm wide when printing, got ' + w);
  expect(!(await page.isVisible('#productCard')), 'editor hidden when printing');
  await page.emulateMedia({ media: 'screen' });

  // 9. PNG download
  await page.click('#type-auto');
  await page.fill('#f-code', '890123456789');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#btnPng')]);
  expect(/\.png$/.test(dl.suggestedFilename()), 'png download, got ' + dl.suggestedFilename());

  // 10. everything survives a reload
  await page.waitForTimeout(300);
  await page.reload();
  await page.waitForSelector('#labelPreview svg.l-bars', { timeout: 10000 });
  expect((await page.$$eval('#itemsBody tr', (e) => e.length)) === 3, 'list kept after reload');
  expect((await page.inputValue('#o-skip')) === '5', 'skip kept after reload');
  expect((await page.inputValue('#f-code')) === '890123456789', 'editor kept after reload');
};
