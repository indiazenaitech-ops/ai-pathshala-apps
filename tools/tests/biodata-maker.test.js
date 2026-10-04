/* Interaction test for Marriage Biodata Maker (run by tools/verify.js in en and hi).
   name + DOB -> preview shows the computed age; labels to Marathi -> label text changes;
   template switch changes the sheet class; 12/24 h birth time; height ft/cm; sibling row; PNG + backup downloads; profiles. */
const fs = require('fs');
module.exports = async function ({ page, expect, lang, log }) {
  const sheet = '#bdSheet';
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const settle = () => page.waitForTimeout(450);

  // the example profile is shown at first
  expect(await page.$(sheet + ' [data-k="name"]'), 'sample biodata should show a name row');

  // start blank (confirm is auto-accepted) and type name + date of birth
  await page.click('#btnBlank');
  await settle();
  expect(!(await page.$(sheet + ' [data-k="name"]')), 'after "Start blank" there is no name row');
  await page.fill('#f-name', 'Kavya Iyer');
  await page.fill('#f-dob', '1995-03-10');
  await settle();
  const now = new Date();
  let age = now.getFullYear() - 1995;
  if (now.getMonth() + 1 < 3 || (now.getMonth() + 1 === 3 && now.getDate() < 10)) age--;
  expect((await txt(sheet + ' [data-k="name"] .bd-v')) === 'Kavya Iyer', 'name appears in the preview');
  const ageTxt = await txt(sheet + ' [data-k="age"] .bd-v');
  expect(ageTxt.includes(String(age)), `preview age "${ageTxt}" should contain ${age}`);
  expect((await txt('#ageBadge')).includes(String(age)), 'form shows the computed age too');
  const dobTxt = await txt(sheet + ' [data-k="dob"] .bd-v');
  expect(dobTxt.includes('10') && dobTxt.includes('1995'), 'formatted date of birth: ' + dobTxt);

  // labels to Marathi: label text changes, the typed name does not
  const before = await txt(sheet + ' [data-k="dob"] .bd-l');
  await page.selectOption('#labelLang', 'mr');
  await settle();
  const after = await txt(sheet + ' [data-k="dob"] .bd-l');
  const mr = await page.evaluate(() => window.APP_CONTENT.mr);
  expect(after !== before && after.includes(mr.l.dob), `Marathi label expected (${before} -> ${after})`);
  expect((await txt(sheet + ' [data-k="dob"] .bd-v')).includes(mr.months[2]), 'month name in Marathi');
  expect((await txt(sheet + ' [data-k="name"] .bd-v')) === 'Kavya Iyer', 'user text is never translated');
  expect((await page.getAttribute(sheet, 'lang')) === 'mr', 'sheet lang = mr');
  // bilingual adds the English label under the Marathi one
  await page.check('#bilingual');
  await settle();
  expect((await txt(sheet + ' [data-k="dob"] .bd-l')).includes('Date of birth'), 'bilingual label shows English');
  // Urdu labels: right-to-left sheet
  await page.selectOption('#labelLang', 'ur');
  await settle();
  expect((await page.getAttribute(sheet, 'dir')) === 'rtl', 'Urdu labels make the sheet RTL');
  await page.selectOption('#labelLang', 'en');
  await settle();

  // template switch changes the class
  expect(await page.$eval(sheet, (e) => e.classList.contains('tpl-traditional')), 'default template is traditional');
  await page.click('.tpl-btn[data-tpl="floral"]');
  await settle();
  expect(await page.$eval(sheet, (e) => e.classList.contains('tpl-floral')), 'sheet class should change to tpl-floral');
  expect((await page.getAttribute('.tpl-btn[data-tpl="floral"]', 'aria-pressed')) === 'true', 'floral button pressed');
  await page.click('.tpl-btn[data-tpl="sidebar"]');
  await settle();
  expect(await page.$eval(sheet, (e) => e.classList.contains('tpl-sidebar') && !!e.querySelector('.bd-side')), 'sidebar layout built');

  // birth time 12 h / 24 h
  await page.fill('#f-tob', '18:30');
  await settle();
  expect((await txt(sheet + ' [data-k="tob"] .bd-v')) === '6:30 PM', '12-hour time: ' + await txt(sheet + ' [data-k="tob"] .bd-v'));
  await page.click('#tf-t24');
  await settle();
  expect((await txt(sheet + ' [data-k="tob"] .bd-v')) === '18:30', '24-hour time');

  // height in cm -> feet and inches
  await page.fill('#f-height-cm', '170');
  await settle();
  expect((await page.inputValue('#f-height')) === '5' && (await page.inputValue('#f-height-in')) === '7', '170 cm = 5 ft 7 in');
  expect((await txt(sheet + ' [data-k="height"] .bd-v')).includes('170 cm'), 'height shown on the sheet');

  // a sibling row, then hide it with the eye button
  await page.click('#addSib');
  await page.fill('#sibList .sib-n', 'Arjun Iyer');
  await settle();
  expect((await txt(sheet + ' [data-k="sib0"] .bd-v')).includes('Arjun Iyer'), 'sibling row on the sheet');
  await page.click('#sibList .sib .eye');
  await settle();
  expect(!(await page.$(sheet + ' [data-k="sib0"]')), 'hidden sibling is not printed');

  // horoscope block can be switched off
  await page.fill('#f-gotra', 'Kashyap');
  await settle();
  expect(!!(await page.$(sheet + ' [data-k="gotra"]')), 'gotra row shown');
  await page.uncheck('#horoOn');
  await settle();
  expect(!(await page.$(sheet + ' [data-sec="horoscope"]')), 'horoscope section hidden');

  // PNG for WhatsApp: a real image file is downloaded
  const [png] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#btnPng')]);
  expect(/\.png$/i.test(png.suggestedFilename()), 'PNG file name: ' + png.suggestedFilename());
  const pngPath = await png.path();
  const buf = fs.readFileSync(pngPath);
  expect(buf.length > 20000 && buf.slice(1, 4).toString() === 'PNG', 'PNG file is a real image, bytes=' + buf.length);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  expect(w === 1588 && h >= 2246, `PNG is A4 at 2x (${w}x${h})`);
  log('png', w + 'x' + h, buf.length + ' bytes');

  // Print / Save as PDF: the print copy is ready and the PDF is exactly one A4 page
  await page.evaluate(() => { window.print = () => { }; });
  await page.click('#btnPrint');
  await settle();
  expect((await page.$$('#printRoot .bd-sheet')).length === 1, 'print copy of the sheet is ready');
  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  const pdfPages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  expect(pdfPages === 1, 'Save as PDF gives one A4 page, got ' + pdfPages);

  // height typing slips (1700 cm, -1 ft) are flagged and kept off the sheet; 5 ft 14 in tidies to 6 ft 2 in
  await page.fill('#f-height-cm', '1700');
  await page.dispatchEvent('#f-height-cm', 'change');
  await settle();
  expect(!(await page.$(sheet + ' [data-k="height"]')), '1700 cm is not printed');
  expect((await page.getAttribute('#f-height-cm', 'aria-invalid')) === 'true', '1700 cm is flagged');
  await page.fill('#f-height-cm', '');
  await page.fill('#f-height', '-1');
  await page.fill('#f-height-in', '20');
  await settle();
  expect(!(await page.$(sheet + ' [data-k="height"]')), 'negative feet are not printed');
  await page.fill('#f-height', '5');
  await page.fill('#f-height-in', '14');
  await page.dispatchEvent('#f-height-in', 'change');
  await settle();
  expect((await page.inputValue('#f-height')) === '6' && (await page.inputValue('#f-height-in')) === '2', '5 ft 14 in tidies to 6 ft 2 in');
  expect((await page.inputValue('#f-height-cm')) === '188', '74 in = 188 cm');

  // Urdu labels with English names: a normal comma between the name and details, not the Urdu one
  await page.selectOption('#labelLang', 'ur');
  await page.click('#sibList .sib .eye');
  await page.fill('#sibList .sib-d', 'Engineer, Pune');
  await settle();
  expect((await txt(sheet + ' [data-k="sib0"] .bd-v')) === 'Arjun Iyer, Engineer, Pune', 'sibling line on an Urdu sheet: ' + await txt(sheet + ' [data-k="sib0"] .bd-v'));
  await page.selectOption('#labelLang', 'en');

  // a long one-word name in the sidebar column gets a smaller font instead of breaking in the middle of the word
  await page.fill('#f-name', 'Venkatasubramaniyan Raghavendran');
  await settle();
  const nameFit = await page.$eval(sheet + ' .bd-side .bd-name', (n) => {
    n.style.overflowWrap = 'normal';
    const r = { sw: n.scrollWidth, cw: n.clientWidth, fs: n.style.fontSize };
    n.style.overflowWrap = '';
    return r;
  });
  expect(nameFit.sw <= nameFit.cw + 1 && nameFit.fs !== '', 'long sidebar name shrinks to fit: ' + JSON.stringify(nameFit));
  await page.fill('#f-name', 'Kavya Iyer');
  await settle();

  // a damaged or hostile backup (lab "__proto__", line key "constructor") must not break the app, now or after a reload
  const evil = { app: 'biodata-maker', v: 1, profiles: [{ lab: '__proto__', tpl: '<b>', f: { name: '<img src=x onerror=window.__pwned=1>Ravi', tob: '99:99', height: 9999 },
    extra: { personal: [{ k: 'constructor', label: 'Hobby', v: 'Chess' }] } }] };
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnRestore')]);
  await fc.setFiles({ name: 'evil.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(evil)) });
  await settle();
  expect((await txt(sheet + ' [data-k="name"] .bd-v')) === '<img src=x onerror=window.__pwned=1>Ravi', 'restored name shown as plain text');
  expect(!(await page.evaluate(() => window.__pwned)), 'no script runs from a backup');
  expect((await page.getAttribute(sheet, 'lang')) === lang, 'bad label language falls back to the app language');
  expect((await txt(sheet + ' [data-k="x-personal-0"] .bd-l')) === 'Hobby', 'unknown line key becomes a custom line');
  expect(!(await page.$(sheet + ' [data-k="height"]')) && (await txt(sheet + ' [data-k="tob"] .bd-v')) === '99:99', 'bad height dropped, bad time shown as typed');
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(900);
  expect(!!(await page.$(sheet + ' [data-k="name"]')), 'app still opens after restoring that backup');

  // several profiles + JSON backup
  const n0 = await page.$$eval('#profileSel option', (o) => o.length);
  await page.click('#btnNew');
  await settle();
  expect((await page.$$eval('#profileSel option', (o) => o.length)) === n0 + 1, 'new profile added');
  expect((await page.inputValue('#f-name')) === '', 'new profile is empty');
  const [bk] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#btnBackup')]);
  const data = JSON.parse(fs.readFileSync(await bk.path(), 'utf8'));
  expect(data.app === 'biodata-maker' && data.profiles.length === n0 + 1, 'backup holds all profiles');
  expect(data.profiles.some((p) => p.f && p.f.name === 'Kavya Iyer'), 'backup contains the typed profile');

  // clear all (confirm auto-accepted) leaves one empty profile
  await page.click('#btnClearAll');
  await settle();
  expect((await page.$$eval('#profileSel option', (o) => o.length)) === 1, 'clear all leaves one profile');
  expect((await page.inputValue('#f-name')) === '', 'cleared profile is empty');
};
