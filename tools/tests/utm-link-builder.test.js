/* Interaction test for utm-link-builder, run by tools/verify.js in en and hi. */
const fs = require('fs');
module.exports = async function ({ page, expect, log }) {
  // 1. spec case: keep params, insert before #fragment, clean the source name
  await page.fill('#url', 'https://shop.example/p?a=1#top');
  await page.fill('#f-source', 'WhatsApp');
  await page.fill('#f-medium', 'social');
  await page.fill('#f-campaign', 'Diwali Sale');
  await page.fill('#f-content', '');
  let link = await page.inputValue('#linkOut');
  expect(link === 'https://shop.example/p?a=1&utm_source=whatsapp&utm_medium=social&utm_campaign=diwali-sale#top',
    'tagged link keeps a=1, cleans names and keeps #top at the end, got ' + link);
  expect(await page.inputValue('#f-source') === 'whatsapp', 'source field auto-cleaned to whatsapp on blur');

  // 2. existing utm_* values are loaded and replaced, missing scheme gets https://
  await page.fill('#url', 'yourshop.in/sale?utm_source=old&x=2');
  let src = await page.inputValue('#f-source');
  expect(src === 'old', 'old utm_source loaded into the field, got ' + src);
  await page.fill('#f-source', 'instagram');
  link = await page.inputValue('#linkOut');
  expect(link.startsWith('https://yourshop.in/sale?x=2&utm_source=instagram') && link.indexOf('utm_source=old') < 0,
    'https:// added, x=2 kept, old utm_source replaced, got ' + link);

  // 3. mailto is refused
  await page.fill('#url', 'mailto:a@b.in');
  link = await page.inputValue('#linkOut');
  expect(link === '' && await page.isDisabled('#copyLink'), 'mailto link gives no tagged link');

  // 4. channel preset fills source/medium
  await page.fill('#url', 'https://shop.example/p?a=1#top');
  await page.click('#chips [data-ch="ig_reel"]');
  expect(await page.inputValue('#f-source') === 'instagram' && await page.inputValue('#f-medium') === 'social' && await page.inputValue('#f-content') === 'reel',
    'Instagram reel preset fills instagram / social / reel');

  // 5. save to history
  await page.click('#saveHist');

  // 6. bulk matrix: 3 channels -> 3 rows, CSV export
  await page.click('#tab-bulk');
  await page.click('#bulkMode [data-v="matrix"]');
  await page.click('#pickNone');
  for (const ch of ['wa_status', 'fb', 'qr']) await page.click('#pickChips [data-ch="' + ch + '"]');
  const rows = await page.$$eval('#bulkTable tbody tr', trs => trs.length);
  expect(rows === 3, '3 channels give 3 rows, got ' + rows);
  const links = await page.$$eval('#bulkTable tbody tr .lk span', s => s.map(x => x.textContent));
  expect(links.length === 3 && links.every(l => /^https:\/\/shop\.example\/p\?a=1&utm_source=/.test(l) && l.endsWith('#top')), 'bulk links are well formed');
  expect(links.some(l => l.includes('utm_source=poster&utm_medium=qr')), 'QR poster row tagged poster / qr');

  let csv = null;
  try {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }), page.click('#dlCsv')]);
    const p = await dl.path();
    if (p) csv = fs.readFileSync(p, 'utf8');
  } catch (e) { log && log('download not captured: ' + e.message); }
  if (csv !== null) {
    const lines = csv.replace(/^﻿/, '').trim().split(/\r?\n/);
    expect(lines.length === 4, 'CSV has a header + 3 rows, got ' + lines.length);
    expect(lines.some(l => l.includes('utm_source=whatsapp&utm_medium=social')), 'CSV contains the WhatsApp tagged link');
  }

  // 7. CSV list mode
  await page.click('#bulkMode [data-v="csv"]');
  await page.click('#loadExample');
  const st = await page.$$eval('#bulkTable tbody tr', trs => trs.length);
  expect(st === 3, 'example list gives 3 rows, got ' + st);
  const l2 = await page.$$eval('#bulkTable tbody tr .lk span', s => s.map(x => x.textContent));
  expect(l2[1] && l2[1].includes('?ref=app&utm_source=whatsapp') && /utm_campaign=diwali-sale-\d{4}/.test(l2[1]), 'CSV row cleaned (WhatsApp -> whatsapp) and ref kept: ' + l2[1]);

  // 8. history has the saved link
  await page.click('#tab-history');
  const h = await page.$$eval('#hrows .hrow', r => r.length);
  expect(h === 1, 'history has 1 saved link, got ' + h);
};
