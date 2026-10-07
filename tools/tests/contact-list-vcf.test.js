/* Interaction test for Excel to Contacts (VCF), run by tools/verify.js in en and hi. */
module.exports = async function ({ page, expect, t }) {
  // capture downloads instead of writing files
  await page.evaluate(() => {
    window.__dl = [];
    EDU.download = (name, content) => { window.__dl.push({ name, text: typeof content === 'string' ? content : null, size: content && content.size, blob: typeof content === 'string' ? null : content }); };
  });
  const stat = (k) => page.textContent('#stat-' + k + ' .cv-stat-v');
  const last = () => page.evaluate(() => { const d = window.__dl[window.__dl.length - 1]; return { name: d.name, text: d.text, size: d.size }; });

  // 0. the example loads on first visit and is already cleaned
  await page.waitForSelector('#table tbody tr');
  expect((await stat('contacts')).trim() !== '0', 'example gives contacts');
  expect(!(await page.isHidden('#example-note')), 'example note shown');

  // 1. paste 4 lines incl. a duplicate and "098765-43210" -> 3 contacts with +919876543210
  await page.fill('#paste', 'Ramesh Kumar\t098765-43210\nPriya Sharma\t+91 91234 56789\nRamesh Kumar\t9876543210\nAnil Mehta\t91 98989 89898');
  await page.waitForTimeout(700);
  expect((await stat('rows')).trim() === '4', 'rows 4, got ' + (await stat('rows')));
  expect((await stat('contacts')).trim() === '3', 'contacts 3, got ' + (await stat('contacts')));
  expect((await stat('dups')).trim() === '1', 'duplicates merged 1, got ' + (await stat('dups')));
  expect(await page.isHidden('#example-note'), 'example note hidden after own data');
  let tbl = await page.textContent('#table');
  expect(tbl.includes('+91 98765 43210') && tbl.includes('+91 91234 56789') && tbl.includes('+91 98989 89898'), 'table shows normalised numbers: ' + tbl.slice(0, 200));

  // 2. VCF: 3 cards, UTF-8, correct TEL
  await page.click('#dl-vcf');
  let d = await last();
  expect(d.name.endsWith('.vcf'), 'vcf name ' + d.name);
  expect((d.text.match(/BEGIN:VCARD/g) || []).length === 3, 'VCF has 3 BEGIN:VCARD');
  expect(d.text.includes('TEL;TYPE=CELL:+919876543210'), 'VCF has +919876543210');
  expect(d.text.includes('N:Kumar;Ramesh;;;') && d.text.includes('FN:Ramesh Kumar'), 'N and FN right');
  expect(d.text.includes('VERSION:3.0') && d.text.indexOf('\r\n') > 0, 'vCard 3.0 with CRLF');

  // 3. split size 2 -> 2 files (2 + 1 cards), and a ZIP of both
  await page.fill('#split-n', '2');
  await page.waitForTimeout(200);
  const parts = await page.$$('#parts .cv-part');
  expect(parts.length === 2, 'split 2 -> 2 part buttons, got ' + parts.length);
  await parts[0].click(); d = await last();
  expect((d.text.match(/BEGIN:VCARD/g) || []).length === 2 && /part-01\.vcf$/.test(d.name), 'part 1 has 2 cards: ' + d.name);
  await parts[1].click(); d = await last();
  expect((d.text.match(/BEGIN:VCARD/g) || []).length === 1, 'part 2 has 1 card');
  await page.click('#dl-zip'); d = await last();
  expect(d.name.endsWith('.zip') && d.size > 100, 'zip downloaded ' + d.name + ' ' + d.size);
  const zipOk = await page.evaluate(async () => {
    const b = window.__dl[window.__dl.length - 1].blob; const u = new Uint8Array(await new Response(b).arrayBuffer());
    const sig = u[0] === 0x50 && u[1] === 0x4b && u[2] === 3 && u[3] === 4;
    const eocd = u[u.length - 22] === 0x50 && u[u.length - 21] === 0x4b && u[u.length - 20] === 5 && u[u.length - 19] === 6;
    const entries = u[u.length - 12] | (u[u.length - 11] << 8);
    return sig && eocd && entries === 2;
  });
  expect(zipOk, 'zip structure: 2 entries, local header + EOCD');

  // 4. Google Contacts CSV + cleaned CSV
  await page.click('#dl-google'); d = await last();
  const lines = d.text.replace(/^﻿/, '').split('\r\n');
  expect(lines[0].startsWith('Name,Given Name,Additional Name,Family Name') && lines[0].includes('Phone 1 - Value'), 'google header');
  expect(lines.length === 4 && lines[1].includes('+919876543210') && lines[1].includes('* myContacts'), 'google rows: ' + lines[1]);
  await page.click('#dl-csv'); d = await last();
  expect(d.text.split('\r\n').length === 4 && d.text.includes('+91 98765 43210'), 'clean csv has 3 rows with spaced numbers');

  // 5. prefix groups the names; landline, scientific notation and short numbers are flagged
  await page.fill('#prefix', 'Cust -');
  await page.fill('#paste', 'Name\tMobile\tGroup\nरमेश कुमार\t9876543210\tग्राहक\nOffice\t011-23456789\tx\nAnil\t9.87654E+09\tx\nSunita\t12345\tx\nNo Number\t\tx');
  await page.waitForTimeout(700);
  expect(await page.isChecked('#has-header'), 'heading row detected');
  expect((await stat('contacts')).trim() === '2', 'ramesh + landline office = 2 contacts, got ' + (await stat('contacts')));
  expect((await stat('landline')).trim() === '1', 'landline flagged');
  expect((await stat('invalid')).trim() === '3', 'sci + short + empty = 3 invalid, got ' + (await stat('invalid')));
  await page.click('#dl-vcf'); d = await last();
  expect(d.text.includes('FN:Cust - रमेश कुमार') && d.text.includes('CATEGORIES:ग्राहक'), 'prefix + Indic name in VCF');
  expect(d.text.includes('TEL;TYPE=VOICE:+911123456789'), 'landline kept as VOICE');
  await page.click('#opt-landline');
  await page.waitForTimeout(300);
  expect((await stat('contacts')).trim() === '1', 'landline switched off -> 1 contact');
  await page.click('#opt-landline');
  await page.fill('#prefix', '');

  // 6. filter buttons
  await page.click('#filter-bad');
  await page.waitForTimeout(100);
  const badRows = await page.$$eval('#table tbody tr', (rs) => rs.map((r) => r.dataset.status));
  expect(badRows.length === 3 && badRows.every((s) => s === 'bad'), 'invalid filter shows 3 bad rows');
  await page.click('#filter-all');

  // 7. VCF -> list (QUOTED-PRINTABLE 2.1 + plain 3.0), then CSV from it
  const vcf = 'BEGIN:VCARD\r\nVERSION:2.1\r\nN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=E0=A4=B6=E0=A4=B0=E0=A5=8D=E0=A4=AE=E0=A4=BE;=E0=A4=AA=E0=A5=8D=E0=A4=B0=E0=A4=BF=E0=A4=AF=E0=A4=BE\r\nTEL;CELL:+91 91234 56789\r\nEND:VCARD\r\nBEGIN:VCARD\r\nVERSION:3.0\r\nFN:Ramesh Kumar\r\nORG:Kumar Kirana;Shop\r\nTEL;TYPE=CELL:9876543210\r\nTEL;TYPE=WORK:011-23456789\r\nEMAIL:ramesh@example.com\r\nCATEGORIES:Customers\r\nPHOTO;ENCODING=b;TYPE=JPEG:/9j/4AAQ\r\n AAAA\r\nEND:VCARD\r\n';
  const ok = await page.evaluate((v) => window.CLV_TEST.importText(v, 'vcf'), vcf);
  expect(ok, 'vcf import accepted');
  await page.waitForTimeout(500);
  expect(!(await page.isHidden('#vcf-note')), 'vcf note shown');
  const pasted = await page.inputValue('#paste');
  expect(pasted.includes('प्रिया शर्मा') && pasted.includes('Kumar Kirana'), 'QP Devanagari decoded and ORG kept: ' + pasted.slice(0, 160));
  expect((await stat('contacts')).trim() === '2', 'vcf -> 2 contacts, got ' + (await stat('contacts')));
  await page.click('#dl-vcf-csv'); d = await last();
  expect(d.name.endsWith('-from-vcf.csv') && d.text.includes('+91 91234 56789') && d.text.includes('Ramesh Kumar') && d.text.includes('Customers'), 'vcf->csv content: ' + d.text.slice(0, 200));

  // 8. number normaliser edge cases
  const kinds = await page.evaluate(() => ['+91 98765 43210', '0091 9876543210', '९८७६५ ४३२१०', '+971 50 123 4567', '9.8765E+09', 'N/A', '98765'].map((v) => { const p = window.CLV_TEST.normPhone(v, '91'); return p.kind + ':' + (p.e164 || ''); }));
  expect(kinds.join('|') === 'mobile:+919876543210|mobile:+919876543210|mobile:+919876543210|intl:+971501234567|sci:|text:|len:', 'normPhone kinds: ' + kinds.join('|'));

  // 9. clear empties everything
  await page.click('#clear');
  await page.waitForTimeout(200);
  expect((await stat('contacts')).trim() === '0' && (await page.textContent('#empty-msg')).trim().length > 3, 'cleared');
  expect(await page.isDisabled('#dl-vcf'), 'download disabled when empty');
};
