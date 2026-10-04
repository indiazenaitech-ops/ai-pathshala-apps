/* Interaction test for Visiting Card Maker (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t }) {
  const settle = () => page.waitForTimeout(150);                 // input renders are debounced by 30 ms
  const payload = async () => (await page.textContent('#qrPayload')).trim();
  const frontText = () => page.textContent('#front .vc');
  const fits = (sel) => page.$eval(sel, (n) => n.scrollHeight <= n.clientHeight + 1 && n.scrollWidth <= n.clientWidth + 1);

  // 1. the sample card renders straight away in the page language, flagged as a sample
  await page.waitForSelector('#front .vc', { timeout: 15000 });
  expect(await page.isVisible('#sampleNote'), 'sample note shown');
  expect((await frontText()).includes(t('sample_name')), 'sample name on the front: ' + t('sample_name'));
  expect(await page.$eval('#front .vc', (n) => n.classList.contains('tpl-shop')), 'sample uses the shop design');
  expect(await page.isVisible('#back .vc'), 'back side shown');

  // 2. typing a name replaces the sample; the vCard QR carries it
  await page.fill('#fName', 'Anil Mehta');
  await settle();
  expect(!(await page.isVisible('#sampleNote')), 'sample note gone after typing');
  expect((await frontText()).includes('Anil Mehta'), 'typed name appears on the front');
  expect(!(await frontText()).includes(t('sample_name')), 'sample name gone');
  expect((await page.inputValue('#fEmail')) === '', 'sample email cleared when the card becomes real');
  await page.fill('#fDesig', 'Sales Manager');
  await page.fill('#fBiz', 'Mehta Traders');
  await page.fill('#fPhone', '+91 98200 11223');
  await page.fill('#fEmail', 'anil@example.com');
  await page.fill('#fWeb', 'mehtatraders.in');
  await page.fill('#fAddr', 'Shop 4, MG Road\nPune 411001');
  await settle();
  let p = await payload();
  expect(p.startsWith('BEGIN:VCARD'), 'vCard payload starts with BEGIN:VCARD, got ' + p.slice(0, 30));
  expect(p.includes('FN:Anil Mehta') && p.includes('ORG:Mehta Traders') && p.includes('TITLE:Sales Manager'), 'vCard has name, org, title');
  expect(p.includes('TEL;TYPE=CELL,VOICE:+919820011223'), 'phone normalised in vCard, got ' + p);
  expect(p.includes('URL:https://mehtatraders.in'), 'website gets https://');
  expect(p.includes('ADR;TYPE=WORK:;;Shop 4\\, MG Road\\, Pune 411001;;;;'), 'address on one line, commas escaped: ' + p);
  expect(p.trim().endsWith('END:VCARD'), 'vCard ends properly');
  expect(+(await page.getAttribute('#back .vc', 'data-qr')) >= 21, 'QR drawn on the back');
  expect(+(await page.getAttribute('#front .vc', 'data-qr')) === 0, 'no QR on the front by default');
  expect(await page.$eval('#back .vc .qrbox svg path', (e) => e.getAttribute('d').length > 100), 'QR drawn as SVG');

  // 3. UPI and WhatsApp QR
  await page.click('#qr-upi');
  await settle();
  expect(await page.isVisible('#qrWarn'), 'UPI QR needs a UPI ID');
  await page.fill('#fUpi', 'Mehta.Traders@okbank');
  await settle();
  p = await payload();
  expect(p === 'upi://pay?pa=mehta.traders@okbank&pn=Mehta%20Traders&cu=INR', 'UPI payload, got ' + p);
  await page.click('#qr-wa');
  await settle();
  p = await payload();
  expect(p === 'https://wa.me/919820011223', 'WhatsApp link from the phone number, got ' + p);
  await page.fill('#fWa', '9820099887');
  await settle();
  expect((await payload()) === 'https://wa.me/919820099887', 'WhatsApp number wins over the phone');
  expect((await page.$$eval('#front .vc .vc-line', (e) => e.length)) >= 5, 'phone, WhatsApp, email, website, address lines on the front');
  await page.fill('#fWa', '+91 98200 11223');
  await settle();
  expect(await page.$eval('#front .vc', (n) => !!n.querySelector('.vc-line.tel .wa-ic')), 'same WhatsApp number shows a WhatsApp mark next to the phone');
  await page.click('#qrs-front');
  await settle();
  expect(+(await page.getAttribute('#front .vc', 'data-qr')) >= 21 && +(await page.getAttribute('#back .vc', 'data-qr')) === 0, 'QR moved to the front');
  await page.click('#qr-vcard');
  await page.click('#qrs-back');
  await settle();

  // 4. GSTIN check (warning only)
  await page.fill('#fGstin', '09ABCPS1234K1ZZ');
  await settle();
  expect(await page.isVisible('#gstinWarn'), 'bad GSTIN check digit warns');
  await page.fill('#fGstin', '09ABCPS1234K1ZK');
  await settle();
  expect(!(await page.isVisible('#gstinWarn')), 'valid GSTIN accepted');
  expect((await frontText()).includes('09ABCPS1234K1ZK'), 'GSTIN printed on the card');

  // 5. every design fits the card, in both sizes, with and without a logo and a long name
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 200; const x = c.getContext('2d'); x.fillStyle = '#c2410c'; x.fillRect(0, 0, 300, 200); x.fillStyle = '#fff'; x.fillRect(100, 50, 100, 100); return c.toDataURL('image/png').split(',')[1]; });
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnLogo')]);
  await fc.setFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.waitForSelector('#front .vc .vc-logo img', { timeout: 5000 });
  const tpls = ['classic', 'shop', 'clinic', 'minimal', 'bold', 'creative', 'elegant', 'split', 'tutor', 'services'];
  for (const size of ['89', '85']) {
    await page.click('#size-' + size);
    for (const id of tpls) {
      await page.click('#tp-' + id);
      await settle();
      expect(await page.$eval('#front .vc', (n, id) => n.classList.contains('tpl-' + id), id), 'design ' + id + ' applied');
      expect(await fits('#front .vc'), id + '/' + size + ' front fits');
      expect(await fits('#back .vc'), id + '/' + size + ' back fits');
      expect(+(await page.getAttribute('#front .vc', 'data-fs')) >= 0.7, id + '/' + size + ' every field + logo keeps a readable size, got ' + (await page.getAttribute('#front .vc', 'data-fs')));
    }
  }
  await page.click('#size-89');
  await page.click('#tp-classic');
  // a typical card (no tagline, website or GSTIN) keeps nearly full-size text
  await page.fill('#fTag', ''); await page.fill('#fWeb', ''); await page.fill('#fGstin', '');
  await settle();
  expect(+(await page.getAttribute('#front .vc', 'data-fs')) >= 0.85, 'typical card keeps nearly full-size text, got ' + (await page.getAttribute('#front .vc', 'data-fs')));
  await page.fill('#fWeb', 'mehtatraders.in'); await page.fill('#fGstin', '09ABCPS1234K1ZK');
  await page.fill('#fName', 'Dr. Venkatanarasimharajuvaripeta Subramaniam Iyer');
  await page.fill('#fBiz', 'Sri Venkateswara Electricals, Hardware, Plumbing and Sanitaryware Stores');
  await settle();
  expect(await fits('#front .vc'), 'very long name and business still fit');
  expect(+(await page.getAttribute('#front .vc', 'data-fs')) < 1, 'long text was shrunk to fit');
  expect(await page.isVisible('#fitWarn') || +(await page.getAttribute('#front .vc', 'data-fs')) >= 0.8, 'fit warning shows when text is shrunk a lot');
  await page.fill('#fName', 'Anil Mehta');
  await page.fill('#fBiz', 'Mehta Traders');
  await settle();

  // 6. bilingual back: Hindi text typed for the back shows on the back only
  await page.click('#back-bilingual');
  await settle();
  expect(await page.isVisible('#blBox'), 'back-language fields shown');
  await page.selectOption('#blLang', 'hi');
  await page.fill('#bName', 'अनिल मेहता');
  await page.fill('#bBiz', 'मेहता ट्रेडर्स');
  await settle();
  const backText = await page.textContent('#back .vc');
  expect(backText.includes('अनिल मेहता') && backText.includes('मेहता ट्रेडर्स'), 'Hindi back side, got ' + backText.slice(0, 80));
  expect(backText.includes('+91 98200 11223'), 'contacts reused on the back');
  expect((await page.getAttribute('#back .vc', 'lang')) === 'hi', 'back carries lang=hi');
  expect(!(await frontText()).includes('अनिल मेहता'), 'front stays in the front language');
  expect(await fits('#back .vc'), 'bilingual back fits');
  // the bilingual back is a white card in the front layout: its text must stay dark ink on every design (shop, split,
  // services and creative have dark *brand* backs; a bilingual back must not inherit that white ink)
  for (const id of ['shop', 'split', 'services', 'creative']) {
    await page.click('#tp-' + id);
    await settle();
    const col = await page.$eval('#back .vc', (n) => [n.classList.contains('on-dark'), getComputedStyle(n.querySelector('.vc-name')).color, getComputedStyle(n).backgroundColor]);
    expect(!col[0] && col[1] !== 'rgb(255, 255, 255)' && col[2] === 'rgb(255, 255, 255)', id + ': bilingual back keeps dark text on a white card, got ' + col.join(' / '));
    expect(await fits('#back .vc') && +(await page.getAttribute('#back .vc', 'data-fs')) >= 0.7, id + ': bilingual Hindi back with logo + QR fits at a readable size, fs=' + (await page.getAttribute('#back .vc', 'data-fs')));
  }
  await page.click('#tp-classic');
  // front changed to the back's language -> the back flips to another language (never Hindi/Hindi)
  await page.selectOption('#cLang', 'hi');
  await settle();
  expect((await page.inputValue('#blLang')) !== 'hi', 'front set to Hindi: the back language flips away from Hindi, got ' + (await page.inputValue('#blLang')));
  await page.selectOption('#cLang', 'auto');
  await page.selectOption('#blLang', 'hi');
  await settle();
  // far too much text: the face is marked "cut" and the warning says so (danger), instead of silently clipping
  const bigAddr = 'Plot 14, Phase 2, Industrial Area, Near Old Bus Stand, Behind Shivaji Statue, Rajaji Nagar Extension, Bengaluru 560010, Karnataka, India';
  await page.fill('#fTag', 'Wiring · Fans · Lights · Geysers · Inverters · AC service · Home delivery · Open 9 am to 9 pm all days');
  await page.fill('#fAddr', bigAddr);
  await page.fill('#fDesig', 'Proprietor and Chief Electrical Consultant for Residential and Commercial Projects');
  await page.fill('#fPhone2', '+91 80 2345 6789'); await page.fill('#fInsta', '@mehta.traders.official'); await page.fill('#fFb', 'fb.com/mehtatradersbengaluru');
  await settle();
  const tight = await page.$eval('#front .vc', (n) => ({ tight: n.classList.contains('tight'), cut: n.classList.contains('cut'), fs: +n.dataset.fs, caption: !!n.querySelector('.qrtxt') }));
  expect(tight.fs < 0.8 ? tight.tight : true, 'tight mode kicks in below 0.8: ' + JSON.stringify(tight));
  const warnState = await page.$eval('#fitWarn', (e) => ({ hidden: e.hidden, danger: e.classList.contains('danger'), text: e.textContent }));
  expect(!warnState.hidden && warnState.danger === tight.cut && warnState.text.length > 20, 'fit warning matches the cut state: ' + JSON.stringify(warnState));
  expect(tight.cut === !(await fits('#front .vc')), 'cut flag is true exactly when the face really overflows');
  await page.fill('#fTag', ''); await page.fill('#fAddr', 'Shop 4, MG Road\nPune 411001'); await page.fill('#fDesig', 'Sales Manager'); await page.fill('#fPhone2', ''); await page.fill('#fInsta', ''); await page.fill('#fFb', '');
  await settle();
  expect(await page.$eval('#front .vc', (n) => !n.classList.contains('cut') && !n.classList.contains('tight')), 'normal text: no tight / cut state');
  await page.click('#back-none');
  await settle();
  expect(!(await page.isVisible('#back .vc')), 'one-sided card hides the back');
  expect(+(await page.getAttribute('#front .vc', 'data-qr')) >= 21, 'QR moves to the front when there is no back');
  await page.click('#back-brand');
  await settle();

  // 7. the printed A4 sheet: 10 cards (2 x 5) plus a mirrored page of backs, 8 with bleed, real paper size
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const slots = await page.$$eval('#printRoot .pg', (pgs) => pgs.map((pg) => pg.querySelectorAll('.slot').length));
  expect(slots.length === 2 && slots[0] === 10 && slots[1] === 10, 'fronts + backs pages with 10 cards each, got ' + slots.join('/'));
  const geo = await page.$$eval('#printRoot .pg:first-child .slot', (els) => els.map((e) => [parseFloat(e.style.left), parseFloat(e.style.top), parseFloat(e.style.width), parseFloat(e.style.height)]));
  expect(geo.every((g) => g[2] === 89 && g[3] === 51), 'slots are 89 x 51 mm');
  expect(new Set(geo.map((g) => g[0])).size === 2 && new Set(geo.map((g) => g[1])).size === 5, '2 columns x 5 rows');
  const left0 = geo[0][0], left1 = geo[1][0];
  const bgeo = await page.$$eval('#printRoot .pg:nth-child(2) .slot', (els) => els.map((e) => parseFloat(e.style.left)));
  expect(bgeo[0] === left1 && bgeo[1] === left0, 'backs are mirrored column-wise for duplex');
  expect(geo.every((g) => g[0] >= 5 && g[0] + g[2] <= 205 && g[1] >= 5 && g[1] + g[3] <= 292), 'all cards inside printable A4 area');
  expect((await page.$$eval('#printRoot .pg .marks', (e) => e.length)) === 2, 'crop marks drawn on both pages');
  await page.emulateMedia({ media: 'print' });
  const pgSize = await page.$eval('#printRoot .pg', (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  const printFits = await page.$$eval('#printRoot .slot .vc', (els) => els.every((n) => n.scrollHeight <= n.clientHeight + 1 && n.scrollWidth <= n.clientWidth + 1));
  const uiHidden = await page.$eval('#detailsCard', (e) => e.getClientRects().length === 0);
  await page.emulateMedia({ media: null });
  expect(pgSize[0] === 794 && pgSize[1] === 1123, 'page is A4 (794 x 1123 px), got ' + pgSize.join('x'));
  expect(printFits, 'every printed card fits its slot');
  expect(uiHidden, 'the editor is hidden in print');
  const pdf = (await page.pdf({ preferCSSPageSize: true, printBackground: true })).toString('latin1');
  const m = pdf.match(/\/Count (\d+)/);
  expect(m && +m[1] === 2, 'PDF has exactly 2 pages, got ' + (m && m[1]));
  await page.check('#optBleed');
  await settle();
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const bleedGeo = await page.$$eval('#printRoot .pg:first-child .slot', (els) => els.map((e) => [parseFloat(e.style.width), parseFloat(e.style.height)]));
  expect(bleedGeo.length === 8 && bleedGeo.every((g) => g[0] === 95 && g[1] === 57), 'with bleed: 8 slots of 95 x 57 mm, got ' + bleedGeo.length);
  await page.uncheck('#optBleed');
  await page.uncheck('#optBacks');
  await settle();
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  expect((await page.$$eval('#printRoot .pg', (e) => e.length)) === 1, 'no backs page when backs are off');
  await page.check('#optBacks');

  // 8. team mode: CSV with a header and 3 people -> 3 cards, one page of fronts + one of backs
  await page.click('#teamBox summary');
  await page.fill('#teamCsv', 'Name,Designation,Mobile,WhatsApp,Email\nSunita Rao,Accounts,+91 99000 44556,,sunita@example.com\nImran Khan,Service Engineer,9700077889,9700077889,\n"Patel, Rakesh",Driver,9000011111,,');
  await page.waitForTimeout(500);
  expect((await page.$$eval('#teamBody tr', (e) => e.length)) === 3, '3 team rows parsed');
  expect((await page.textContent('#teamCount')).includes('3'), 'team count shows 3');
  expect((await page.textContent('#teamBody tr:nth-child(3) td.nm')).trim() === 'Patel, Rakesh', 'quoted CSV name kept');
  await page.click('#teamBody tr:nth-child(2) .btn');
  await settle();
  expect((await frontText()).includes('Imran Khan') && (await frontText()).includes('Mehta Traders'), 'team member preview uses the business details');
  expect(await page.isVisible('#btnTeamMe'), 'back-to-my-card button shown');
  // a binary file renamed .csv is refused with a message, and the list is untouched
  const [fcBad] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnTeamFile')]);
  await fcBad.setFiles({ name: 'staff.csv', mimeType: 'text/csv', buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0xff, 0xfe, 1, 2]) });
  await page.waitForTimeout(500);
  expect(await page.isVisible('#teamMsg'), 'binary junk CSV shows the bad-file message');
  expect((await page.$$eval('#teamBody tr', (e) => e.length)) === 3, 'team list unchanged after a bad file');
  await page.click('#btnTeamPrint');
  await page.waitForTimeout(300);
  const teamSlots = await page.$$eval('#printRoot .pg', (pgs) => pgs.map((pg) => pg.querySelectorAll('.slot').length));
  expect(teamSlots.length === 2 && teamSlots[0] === 3 && teamSlots[1] === 3, 'team print: 3 fronts + 3 backs, got ' + teamSlots.join('/'));
  expect((await page.textContent('#printRoot .pg:first-child .slot:nth-child(1)')).includes('Sunita Rao'), 'first printed card is Sunita');
  await page.click('#btnTeamMe');
  await settle();
  expect((await frontText()).includes('Anil Mehta'), 'back to my own card');

  // 9. save, new card, reload
  await page.click('#btnSave');
  expect((await page.$$eval('#savedRow .sv', (e) => e.length)) === 1, 'one saved card');
  await page.click('#btnNew');
  await settle();
  expect((await page.inputValue('#fName')) === '' && (await page.inputValue('#fBiz')) === 'Mehta Traders', 'new card keeps the business, clears the person');
  await page.fill('#fName', 'Sunita Rao');
  await settle();
  await page.click('#btnSave');
  expect((await page.$$eval('#savedRow .sv', (e) => e.length)) === 2, 'two saved cards');
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForSelector('#front .vc', { timeout: 15000 });
  expect((await page.$$eval('#savedRow .sv', (e) => e.length)) === 2, 'saved cards survive a reload');
  expect((await page.inputValue('#fName')) === 'Sunita Rao', 'current card kept after reload');
  expect((await page.$$eval('#teamBody tr', (e) => e.length)) === 3, 'team list kept after reload');
  await page.click('#savedRow .sv:first-child .sv-use');
  await settle();
  expect((await page.inputValue('#fName')) === 'Anil Mehta', 'saved card opens');

  // 10. PNG export: a real 300 dpi image downloads
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#btnPngFront')]);
  expect(/^visiting-card-anil-mehta-front\.png$/.test(dl.suggestedFilename()), 'png file name, got ' + dl.suggestedFilename());
  await page.fill('#fName', 'अनिल मेहता'); await page.fill('#fBiz', 'मेहता ट्रेडर्स');
  await settle();
  const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#btnPngFront')]);
  expect(dl2.suggestedFilename() === 'visiting-card-front.png', 'Indic-only name: clean file name, got ' + dl2.suggestedFilename());
  await page.fill('#fName', 'Anil Mehta'); await page.fill('#fBiz', 'Mehta Traders');
  await settle();

  // 11. Urdu card: RTL direction and still fits
  await page.selectOption('#cLang', 'ur');
  await page.waitForTimeout(600);
  expect((await page.getAttribute('#front .vc', 'dir')) === 'rtl', 'Urdu card is RTL');
  expect(await fits('#front .vc'), 'Urdu card fits');
  await page.selectOption('#cLang', 'auto');
  await settle();
};
