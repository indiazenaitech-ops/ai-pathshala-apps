/* Interaction test for Notice & Circular Maker, run by tools/verify.js in en and hi. */
module.exports = async function ({ page, lang, expect, t, log }) {
  const C = await page.evaluate(() => window.APP_CONTENT);
  const LANGS = ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur'];
  const txt = async (sel) => ((await page.textContent(sel).catch(() => null)) || '').trim();
  const count = (sel) => page.locator(sel).count();
  const requests = [];
  page.on('request', r => { if (!/^(data:|blob:)/.test(r.url())) requests.push(r.url()); });

  /* 1. opens with clearly fictional sample data in the interface language */
  expect((await txt('#notice .n-org')) === C[lang].orgs[0].name, 'sample organisation shown: ' + await txt('#notice .n-org'));
  expect(/\(.+\)/.test(C[lang].orgs[0].name), 'sample organisation is marked as a sample');
  expect((await txt('#notice .n-heading')) === C[lang].labels.notice, 'heading is NOTICE in the notice language');
  expect((await txt('#notice .n-subject')) === C[lang].labels.subject + ': ' + C[lang].templates[0].subject, 'subject line comes from the holiday format');
  expect((await count('#notice .n-points li')) === 3, 'three sample points');
  expect((await page.inputValue('#f-nlang')) === lang, 'notice language starts as the interface language');
  expect(await page.isVisible('#sample-note'), 'sample note visible');
  expect((await count('#tpl-chips .chip')) === 7, 'seven ready formats');
  expect((await txt('#tpl-chips .chip[data-tpl="4"]')) === C[lang].templates[4].name, 'format names are in the interface language');

  /* 2. all 7 formats in all 12 notice languages, written in the right script */
  const SCRIPT = { hi: /[ऀ-ॿ]/, mr: /[ऀ-ॿ]/, bn: /[ঀ-৿]/, pa: /[਀-੿]/, gu: /[઀-૿]/, or: /[଀-୿]/,
    ta: /[஀-௿]/, te: /[ఀ-౿]/, kn: /[ಀ-೿]/, ml: /[ഀ-ൿ]/, ur: /[؀-ۿ]/, en: /[A-Za-z]/ };
  const KIND = ['notice', 'notice', 'circular', 'notice', 'notice', 'notice', 'circular'], ORG = [0, 0, 0, 0, 1, 1, 2];
  for (const L of LANGS) {
    await page.selectOption('#f-nlang', L);
    expect((await page.getAttribute('#notice', 'dir')) === (L === 'ur' ? 'rtl' : 'ltr'), `${L}: notice direction`);
    expect((await page.getAttribute('#notice', 'lang')) === L, `${L}: notice lang attribute`);
    for (let i = 0; i < 7; i++) {
      await page.click(`#tpl-chips .chip[data-tpl="${i}"]`);
      const T = C[L].templates[i];
      const got = await page.evaluate(() => ({
        org: document.querySelector('#notice .n-org').textContent, heading: document.querySelector('#notice .n-heading').textContent,
        subject: document.querySelector('#notice .n-subject').textContent, paras: [...document.querySelectorAll('#notice .n-body p')].map(p => p.textContent),
        points: [...document.querySelectorAll('#notice .n-points li')].map(p => p.textContent), sign: document.querySelector('#notice .n-sign-desig').textContent,
        date: document.querySelector('#notice .n-date').textContent
      }));
      expect(got.subject === C[L].labels.subject + ': ' + T.subject, `${L} format ${i}: subject`);
      expect(got.heading === C[L].labels[KIND[i]], `${L} format ${i}: heading ${got.heading}`);
      expect(got.paras.join('\n') === T.body, `${L} format ${i}: body`);
      expect(got.points.join('|') === T.points.join('|'), `${L} format ${i}: points`);
      expect(got.org === C[L].orgs[ORG[i]].name && got.sign === C[L].orgs[ORG[i]].desig, `${L} format ${i}: sample letterhead follows the format (${got.org})`);
      expect(SCRIPT[L].test(T.body) && SCRIPT[L].test(T.name) && (L === 'en' || !/[A-Za-z]{4,}/.test(T.body)), `${L} format ${i}: written in its own script`);
      expect(got.date.startsWith(C[L].labels.date + ': ') && /\d{4}/.test(got.date) && !/[٠-٩۰-۹०-९০-৯௦-௯]/.test(got.date), `${L}: date uses Western digits: ${got.date}`);
    }
  }
  expect((await page.getAttribute('html', 'lang')) === lang, 'changing the notice language does not change the interface language');
  expect((await txt('#tpl-chips .chip[data-tpl="0"]')) === C[lang].templates[0].name, 'format buttons stay in the interface language');

  /* 3. typing your own notice: live preview, user text is kept when the notice language changes */
  await page.selectOption('#f-nlang', 'en');
  await page.click('#tpl-chips .chip[data-tpl="0"]');
  await page.fill('#f-org', 'Test Vidya Mandir');
  await page.fill('#f-addr', 'Near Bus Stand, Sitapur');
  await page.fill('#f-ref', 'TVM/77');
  await page.fill('#f-date', '2026-12-05');
  await page.fill('#f-subject', 'Annual Sports Day');
  await page.fill('#f-body', 'The Annual Sports Day will be held on 12 December 2026.\n\nAll students must come in sports uniform.');
  await page.fill('#f-points', 'Reporting time 8 am\n\n  Bring a water bottle  ');
  await page.fill('#f-sign', 'S. K. Tiwari');
  await page.fill('#f-desig', 'Headmaster');
  await page.fill('#f-copy', 'All class teachers\nSports teacher\nNotice board');
  expect((await txt('#notice .n-org')) === 'Test Vidya Mandir' && (await txt('#notice .n-addr')) === 'Near Bus Stand, Sitapur', 'letterhead updates live');
  expect((await txt('#notice .n-ref')) === 'Ref. No.: TVM/77', 'reference number line');
  expect((await txt('#notice .n-date')) === 'Date: 5 December 2026', 'date line: ' + await txt('#notice .n-date'));
  expect((await txt('#notice .n-subject')) === 'Subject: Annual Sports Day', 'subject line');
  expect((await count('#notice .n-body p')) === 3, 'two paragraphs and the blank line between them');
  expect((await count('#notice .n-points li')) === 2 && (await txt('#notice .n-points li:nth-child(2)')) === 'Bring a water bottle', 'two points, blank lines dropped, spaces trimmed');
  expect((await txt('#notice .n-sign-name')) === 'S. K. Tiwari' && (await txt('#notice .n-sign-desig')) === 'Headmaster', 'signature block');
  expect((await count('#notice .n-copy li')) === 3, 'three copy-to lines');
  expect(await page.isHidden('#sample-note'), 'sample note goes away after editing');
  await page.selectOption('#f-nlang', 'ta');
  expect((await txt('#notice .n-subject')) === C.ta.labels.subject + ': Annual Sports Day', 'label changes to Tamil, typed text is not touched');
  expect((await txt('#notice .n-heading')) === C.ta.labels.notice && (await txt('#notice .n-org')) === 'Test Vidya Mandir', 'heading in Tamil, organisation kept');
  expect((await txt('#notice .n-copy b')) === C.ta.labels.copy + ':', 'copy-to label in Tamil');
  await page.selectOption('#f-nlang', 'en');

  /* 4. heading choices */
  await page.click('#f-kind button[data-kind="circular"]');
  expect((await txt('#notice .n-heading')) === 'CIRCULAR', 'circular heading');
  await page.click('#f-kind button[data-kind="custom"]');
  expect(await page.isVisible('#f-custom') && (await count('#notice .n-heading')) === 0, 'custom heading box appears, empty heading is not printed');
  await page.fill('#f-custom', 'OFFICE ORDER');
  expect((await txt('#notice .n-heading')) === 'OFFICE ORDER', 'custom heading');

  /* 5. copy as text */
  const text = await page.evaluate(() => window.NCM_APP.text());
  for (const part of ['Test Vidya Mandir', 'Ref. No.: TVM/77', 'Date: 5 December 2026', 'OFFICE ORDER', 'Subject: Annual Sports Day', '• Reporting time 8 am', 'S. K. Tiwari\nHeadmaster', 'Copy to:\n1. All class teachers\n2. Sports teacher\n3. Notice board']) {
    expect(text.includes(part), 'plain text has: ' + part);
  }

  /* 6. optional parts are left out when empty */
  await page.fill('#f-ref', '');
  await page.fill('#f-points', '');
  await page.fill('#f-copy', '  \n ');
  expect((await txt('#notice .n-ref')) === '' && (await count('#notice .n-points')) === 0 && (await count('#notice .n-copy')) === 0, 'empty reference, points and copy-to are not printed');
  expect(!(await page.evaluate(() => window.NCM_APP.text())).includes('Copy to'), 'plain text also drops the empty parts');

  /* 7. picture: canvas is A4-shaped, has ink, and downloads as notice.png */
  const cv = await page.evaluate(() => {
    const c = window.NCM_APP.canvas(), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let dark = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 100) dark++;
    return { w: c.width, h: c.height, dark };
  });
  expect(cv.w === 1240 && cv.h === 1754, `picture is ${cv.w}x${cv.h}, expected 1240x1754`);
  expect(cv.dark > 8000, 'picture has text drawn on it (dark pixels: ' + cv.dark + ')');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#btn-png')]);
  expect(dl.suggestedFilename() === 'notice.png', 'download is called notice.png');

  /* 8. logo stays on the device; a file that is not a picture is refused */
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFUlEQVR4nGNkYPj/n4EIwESMolGFAEnLAw3DB/dnAAAAAElFTkSuQmCC', 'base64');
  let [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btn-logo')]);
  await fc.setFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png });
  await page.waitForSelector('#notice .n-logo', { timeout: 5000 });
  expect((await page.getAttribute('#notice .n-logo', 'src')).startsWith('data:image/png'), 'logo is kept as data on the device');
  expect(await page.isVisible('#btn-logo-remove'), 'remove-logo button appears');
  await page.click('#btn-logo-remove');
  expect((await count('#notice .n-logo')) === 0, 'logo removed');
  [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btn-logo')]);
  await fc.setFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await page.waitForTimeout(400);
  expect((await count('#notice .n-logo')) === 0, 'a text file is not accepted as a logo');

  /* 9. very long input does not break the page; text size and border switches */
  await page.fill('#f-body', 'X'.repeat(1500) + '\n' + 'This is a long line of text. '.repeat(120));
  const fit = await page.evaluate(() => { const n = document.querySelector('#notice'); return { over: n.scrollWidth - n.clientWidth, page: document.documentElement.scrollWidth - window.innerWidth }; });
  expect(fit.over <= 1 && fit.page <= 1, 'long text wraps inside the page');
  expect(await page.evaluate(() => window.NCM_APP.canvas().height) > 1754, 'the picture grows taller for a long notice');
  await page.click('#f-size button[data-size="l"]');
  expect((await page.getAttribute('#notice', 'class')).includes('sz-l'), 'large text size applied');
  await page.uncheck('#opt-border');
  expect(!(await page.getAttribute('#notice', 'class')).includes('bordered'), 'border switched off');

  /* 10. saved on the device, reset brings the sample back, and nothing went to the network */
  await page.reload();
  await page.waitForTimeout(600);
  expect((await txt('#notice .n-org')) === 'Test Vidya Mandir' && (await txt('#notice .n-heading')) === 'OFFICE ORDER', 'notice survives a reload');
  await page.click('#btn-reset');
  expect((await txt('#notice .n-org')) === C[lang].orgs[0].name && (await page.inputValue('#f-nlang')) === lang, 'reset restores the sample in the interface language');
  const outside = requests.filter(u => !/^https?:\/\/127\.0\.0\.1/.test(u) && !/fonts\.(googleapis|gstatic)\.com/.test(u));
  expect(outside.length === 0, 'no network calls: ' + outside.slice(0, 3).join(', '));
  log('7 formats x 12 notice languages, preview, text, picture and logo verified');
};
