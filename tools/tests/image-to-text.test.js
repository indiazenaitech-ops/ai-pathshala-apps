/* Interaction test for Image to Text (OCR), run by tools/verify.js in en and hi.
   The OCR engine (tesseract.js) and English language data load from the CDN, so waits are generous. */
const fs = require('fs');

module.exports = async function ({ page, expect, t, log }) {
  await page.waitForSelector('#app[data-ready="1"]', { timeout: 30000 });

  // 1) Language selector: switch to English only (hi starts with Hindi + English).
  const pressed = () => page.$$eval('#langs .it-lang[aria-pressed="true"]', bs => bs.map(b => b.getAttribute('data-code')));
  let on = await pressed();
  expect(on.length >= 1, 'at least one OCR language is selected by default');
  if (!on.includes('eng')) await page.click('#langs .it-lang[data-code="eng"]');
  for (const code of (await pressed()).filter(c => c !== 'eng')) await page.click(`#langs .it-lang[data-code="${code}"]`);
  on = await pressed();
  expect(on.length === 1 && on[0] === 'eng', 'only English selected after clicking chips, got ' + JSON.stringify(on));
  await page.click('#langs .it-lang[data-code="hin"]');
  expect(JSON.stringify((await pressed()).sort()) === JSON.stringify(['eng', 'hin']), 'adding Hindi gives English + Hindi: ' + JSON.stringify(await pressed()));
  await page.click('#langs .it-lang[data-code="hin"]');
  expect(JSON.stringify(await pressed()) === '["eng"]', 'Hindi removed again');
  // Urdu is read first (English first turned Urdu words into Latin junk); other languages come after English.
  const savedLangs = () => page.evaluate(() => (JSON.parse(localStorage.getItem('edu.image-to-text.settings') || '{}').langs || []).join('+'));
  await page.click('#langs .it-lang[data-code="urd"]');
  expect(await savedLangs() === 'urd+eng', 'Urdu + English is saved Urdu-first: ' + await savedLangs());
  expect(await page.isVisible('#urduNote'), 'Urdu Nastaliq note is shown when Urdu is picked');
  await page.click('#langs .it-lang[data-code="urd"]');
  await page.click('#langs .it-lang[data-code="tam"]');
  expect(await savedLangs() === 'eng+tam', 'Tamil + English is saved English-first: ' + await savedLangs());
  await page.click('#langs .it-lang[data-code="tam"]');
  expect(JSON.stringify(await pressed()) === '["eng"]', 'back to English only');

  // 2) Add a canvas picture with "Hello 123" through the file input.
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 220;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#111'; x.font = 'bold 64px Arial, sans-serif'; x.fillText('Hello 123', 48, 130);
    return c.toDataURL('image/png');
  });
  await page.setInputFiles('#fileInput', { name: 'hello.png', mimeType: 'image/png', buffer: Buffer.from(dataUrl.split(',')[1], 'base64') });
  await page.waitForSelector('#pages li', { timeout: 15000 });
  expect((await page.$$('#pages li')).length === 1, 'one page in the strip');
  expect(await page.isVisible('#editCard'), 'page preview card is shown');
  expect(!(await page.isDisabled('#runBtn')), 'Read button is enabled once a page is added');

  // 3) Read the text (engine + English data download the first time).
  await page.click('#runBtn');
  await page.waitForFunction(() => /Hello/.test(document.getElementById('result').textContent), null, { timeout: 100000 });
  const text = (await page.textContent('#result')).trim();
  log('OCR result: ' + JSON.stringify(text));
  expect(/Hello/.test(text) && /123/.test(text), 'OCR found "Hello" and "123", got ' + JSON.stringify(text));
  const badges = await page.$$eval('#stats .badge', bs => bs.map(b => b.textContent));
  expect(badges[0] === t('words_n', { n: 2 }), 'word count badge says 2 words, got ' + JSON.stringify(badges));
  expect(await page.$('#pages .it-done-mark'), 'page thumbnail is marked as read');
  expect(/\d+%/.test(await page.textContent('#confBadge')), 'confidence badge shows a percentage');

  // 4) Copy button puts the text on the clipboard.
  await page.evaluate(() => {
    window.__copied = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: s => { window.__copied = s; return Promise.resolve(); } } });
  });
  await page.click('#copyBtn');
  await page.waitForFunction(() => window.__copied !== null, null, { timeout: 5000 });
  const copied = await page.evaluate(() => window.__copied);
  expect(/Hello/.test(copied), 'copied text contains Hello: ' + JSON.stringify(copied));

  // 5) .txt download has the same text.
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#dlTxt')]);
  expect(/\.txt$/.test(dl.suggestedFilename()), 'download is a .txt file: ' + dl.suggestedFilename());
  const saved = fs.readFileSync(await dl.path(), 'utf8');
  expect(/Hello 123/.test(saved), '.txt contains "Hello 123"');

  // 6) Visiting card → contact: phone, email, website and name are found in edited text.
  await page.evaluate(() => {
    const r = document.getElementById('result');
    r.textContent = 'SHARMA TRADERS\nPriya Sharma\nProprietor\nMob: 98765-43210\npriya@sharmatraders.in\nwww.sharmatraders.in\nShop 12, Khari Baoli, Delhi 110006';
    r.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.click('#vcfBtn');
  await page.waitForSelector('#vcPhones', { timeout: 5000 });
  const card = await page.evaluate(() => ({ name: vcName.value, org: vcOrg.value, job: vcJob.value, phones: vcPhones.value, email: vcEmail.value, web: vcWeb.value, addr: vcAddr.value }));
  log('contact: ' + JSON.stringify(card));
  expect(card.phones === '+91 98765 43210', 'Indian mobile normalised to +91 98765 43210, got ' + card.phones);
  expect(card.email === 'priya@sharmatraders.in' && card.web === 'www.sharmatraders.in', 'email and website found');
  expect(card.name === 'Priya Sharma' && card.org === 'SHARMA TRADERS' && card.job === 'Proprietor', 'name / company / title guessed');
  expect(/Delhi 110006/.test(card.addr), 'address with PIN code found');
  await page.keyboard.press('Escape');

  // 7) Harder Indian phone formats: 091- prefix, STD landline, two numbers on one line, toll-free; no false hits.
  const phonesOf = async (txt) => {
    await page.evaluate(s => { const r = document.getElementById('result'); r.textContent = s; r.dispatchEvent(new Event('input', { bubbles: true })); }, txt);
    await page.click('#vcfBtn');
    await page.waitForSelector('#vcPhones', { timeout: 5000 });
    const v = await page.evaluate(() => ({ p: vcPhones.value.split('\n').filter(Boolean), a: vcAddr.value }));
    await page.keyboard.press('Escape');
    await page.waitForSelector('#vcPhones', { state: 'detached', timeout: 5000 });
    return v;
  };
  let ph = await phonesOf('Amit Gupta\nMob: 091-98200 11223 | Tel: 0141-2234567\n12, MI Road, Jaipur 302001 Ph: 98111 22334 98290 55667');
  log('phones: ' + JSON.stringify(ph));
  expect(JSON.stringify(ph.p) === JSON.stringify(['+91 98200 11223', '+91 141 2234567', '+91 98111 22334', '+91 98290 55667']), '091-, STD landline and two numbers on one line are all found: ' + JSON.stringify(ph.p));
  expect(ph.a === '12, MI Road, Jaipur 302001', 'phone and "Ph:" label are taken out of the address: ' + JSON.stringify(ph.a));
  ph = await phonesOf('Helpline 1800 180 1551\nAadhaar 2345 6789 0123\nInvoice INV-2026-101 dated 01-10-2026');
  expect(JSON.stringify(ph.p) === '["1800 180 1551"]', 'toll-free kept, Aadhaar / invoice / date are not phones: ' + JSON.stringify(ph.p));

  // 8) Wrong language: Hindi lines read with English only → a "Try Hindi + English" suggestion.
  const addCanvas = async (name, draw) => {
    if (await page.isVisible('#clearPages')) await page.click('#clearPages');
    const url = await page.evaluate(draw);
    await page.setInputFiles('#fileInput', { name, mimeType: 'image/png', buffer: Buffer.from(url.split(',')[1], 'base64') });
    await page.waitForFunction(n => document.querySelectorAll('#pages li').length === 1 && document.getElementById('imgInfo').textContent.indexOf(n) === 0, name, { timeout: 15000 });
    await page.waitForTimeout(300);
  };
  const readAll = async () => {
    await page.click('#runBtn');
    await page.waitForFunction(() => document.getElementById('stopBtn').hidden && !document.getElementById('runBtn').disabled, null, { timeout: 100000 });
  };
  await addCanvas('notice-hi.png', () => {
    const c = document.createElement('canvas'); c.width = 1000; c.height = 420; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#111';
    x.font = '34px "Nirmala UI", "Noto Sans Devanagari", Mangal, sans-serif';
    x.fillText('सभी कर्मचारियों को सूचित किया जाता है कि', 40, 80);
    x.fillText('कार्यालय बीस अक्टूबर से बंद रहेगा।', 40, 150);
    x.fillText('वेतन खाते में जमा किया जाएगा।', 40, 220);
    x.font = '34px Arial, sans-serif'; x.fillText('Office Notice No. 45/2026', 40, 300);
    return c.toDataURL('image/png');
  });
  await readAll();
  const sugg = await page.isVisible('#suggestBox') ? await page.$$eval('#suggestBtns button', bs => bs.map(b => b.textContent)) : null;
  log('wrong-language suggestion: ' + JSON.stringify(sugg));
  expect(sugg && sugg.some(s => s.indexOf(t('lang_hin')) >= 0), 'Hindi page read as English suggests Hindi: ' + JSON.stringify(sugg));

  // 9) Uneven light: a page half in shadow reads as nothing until "Fix lighting" evens it out.
  await addCanvas('shadow.png', () => {
    const c = document.createElement('canvas'); c.width = 900; c.height = 520; const x = c.getContext('2d');
    x.fillStyle = '#f2f2ee'; x.fillRect(0, 0, 900, 520);
    x.fillStyle = '#1a1a1a'; x.font = '40px Arial, sans-serif';
    ['Shadow test 4567', 'Diwali sale on all sweets', 'Call Priya 98765 43210', 'Open daily from 9 to 9'].forEach((s, i) => x.fillText(s, 60, 110 + i * 105));
    const g = x.createLinearGradient(0, 0, 900, 0); g.addColorStop(0, 'rgba(0,0,0,0.82)'); g.addColorStop(0.55, 'rgba(0,0,0,0.6)'); g.addColorStop(0.7, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 900, 520);
    return c.toDataURL('image/png');
  });
  expect(await page.$('#imgHints [data-hint="hint_shadow"]'), 'shadow hint is shown for a half-shadowed page');
  await readAll();
  const before = (await page.textContent('#result')).trim();
  log('shadow, before fix: ' + JSON.stringify(before));
  expect(await page.$('#suggestFix'), 'a "Fix lighting" button is offered after a poor read');
  await page.click('#suggestFix');          // turns on Fix lighting and reads again
  await page.waitForFunction(() => /Diwali/.test(document.getElementById('result').textContent), null, { timeout: 60000 });
  await page.waitForFunction(() => document.getElementById('stopBtn').hidden, null, { timeout: 60000 });
  const after = await page.textContent('#result');
  log('shadow, after fix: ' + JSON.stringify(after));
  expect(await page.isChecked('#optLevels'), '"Fix lighting" is switched on');
  expect(/Diwali sale/.test(after) && /98765 43210/.test(after) && after.length > before.length + 30, 'after Fix lighting the shadowed lines are read');
  expect(!(await page.$('#imgHints [data-hint="hint_shadow"]')), 'shadow hint goes away once fixed');

  // 10) "Remove all" while reading stops the run instead of finishing with "Done" and no text.
  await page.evaluate(() => { document.getElementById('rotR').click(); document.getElementById('runBtn').click(); document.getElementById('clearPages').click(); });
  await page.waitForFunction(() => document.getElementById('stopBtn').hidden, null, { timeout: 30000 });
  expect((await page.textContent('#stText')).trim() === t('st_stopped'), 'status says Stopped after removing all pages mid-run: ' + await page.textContent('#stText'));
  expect((await page.$$('#pages li')).length === 0 && await page.isDisabled('#runBtn'), 'no pages left and Read is disabled');
};
