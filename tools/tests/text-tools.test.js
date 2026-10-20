/* Interaction test for Text Tools: Clean & Compare (run by tools/verify.js in en and hi).
   Drives the real buttons: case, clean-up, duplicates, sort, regex replace, extract, top words,
   undo/redo, autosave and the compare checker with known counts. */
module.exports = async function ({ page, lang, expect }) {
  const settle = (ms) => page.waitForTimeout(ms || 150);
  const val = () => page.inputValue('#text');
  const fill = async (s) => { await page.fill('#text', s); await settle(1100); };   // > 1 s so each fill is its own undo step
  const tab = async (id) => { await page.click('#tab-' + id); await settle(); };
  const msgN = async () => Number(await page.getAttribute('#msg', 'data-n'));

  // 0) starts with the sample text of this language, already counted
  const C = await page.evaluate(() => window.APP_CONTENT[EDU.lang]);
  expect((await val()) === C.sample, 'starts with the ' + lang + ' sample');
  expect(Number(await page.getAttribute('#counts', 'data-lines')) === C.sample.split('\n').length, 'line count shown');

  // 1) Title Case with the small-words rule; Hindi survives every case button unchanged
  await tab('case');
  await fill('the lord of the rings: a tale of two cities');
  await page.click('[data-case="title"]');
  await settle();
  expect((await val()) === 'The Lord of the Rings: A Tale of Two Cities', 'title case, got ' + await val());
  await page.click('[data-case="upper"]');
  await settle();
  expect((await val()) === 'THE LORD OF THE RINGS: A TALE OF TWO CITIES', 'upper case');
  const hi = 'नमस्ते! मेरा नाम आरव है। मैं इंदौर में रहता हूँ॥ क्षत्रिय, ज्ञान, कि';
  await fill(hi);
  for (const c of ['upper', 'lower', 'title', 'sentence', 'alternate', 'inverse']) {
    await page.click(`[data-case="${c}"]`);
    await settle(80);
    expect((await val()) === hi, 'Hindi text unchanged by ' + c);
  }
  await fill('मेरा नाम आरव है। i live in indore. it is clean.');
  await page.click('[data-case="sentence"]');
  await settle();
  expect((await val()) === 'मेरा नाम आरव है। I live in indore. It is clean.', 'sentence case on mixed text, got ' + await val());

  // 2) undo / redo
  await page.click('#undo'); await settle();
  expect((await val()) === 'मेरा नाम आरव है। i live in indore. it is clean.', 'undo brings back the text');
  await page.click('#redo'); await settle();
  expect((await val()) === 'मेरा नाम आरव है। I live in indore. It is clean.', 'redo applies it again');

  // 3) duplicate lines: count and first copy kept
  await tab('lines');
  await fill('Asha\nRavi\nasha\nAsha\n  Ravi \nZoya\nRavi');
  await page.click('#b-dedupe'); await settle();
  expect((await val()) === 'Asha\nRavi\nasha\nZoya', 'dedupe keeps first copies, got ' + JSON.stringify(await val()));
  expect(await msgN() === 3, '3 duplicates removed, got ' + await msgN());
  await page.uncheck('#o-dcase');
  await fill('Asha\nRavi\nasha\nAsha');
  await page.click('#b-dedupe'); await settle();
  expect(await msgN() === 2 && (await val()) === 'Asha\nRavi', 'ignore-case dedupe removes 2');
  await page.check('#o-dcase');

  // 4) sort: natural A→Z, numeric, Hindi alphabetical with Intl.Collator
  await fill('banana\nApple\nitem 10\ncherry\nitem 2');
  await page.selectOption('#o-sort', 'az');
  await page.click('#b-sort'); await settle();
  expect((await val()) === 'Apple\nbanana\ncherry\nitem 2\nitem 10', 'natural A→Z sort, got ' + JSON.stringify(await val()));
  await fill('Roll 10 Asha\nRoll 2 Ravi\nRoll 1 Zoya\n₹1,20,000 fees');
  await page.selectOption('#o-sort', 'num');
  await page.click('#b-sort'); await settle();
  expect((await val()) === 'Roll 1 Zoya\nRoll 2 Ravi\nRoll 10 Asha\n₹1,20,000 fees', 'numeric sort, got ' + JSON.stringify(await val()));
  await page.evaluate(() => EDU.setLang('hi')); await settle();
  await fill('कमल\nबैंक\nअनार\nआम');
  await page.selectOption('#o-sort', 'az');
  await page.click('#b-sort'); await settle();
  expect((await val()) === 'अनार\nआम\nकमल\nबैंक', 'Hindi alphabetical sort, got ' + JSON.stringify(await val()));
  await page.evaluate((l) => EDU.setLang(l), lang); await settle();

  // 5) join lines with a comma (WhatsApp list) and split back
  await fill('Asha\nRavi\n\nZoya');
  await page.fill('#o-delim', ', ');
  await page.click('[data-op="joinText"]'); await settle();
  expect((await val()) === 'Asha, Ravi, Zoya', 'joined with comma');
  await page.click('[data-op="splitText"]'); await settle();
  expect((await val()) === 'Asha\nRavi\nZoya', 'split back into lines');

  // 6) regex find & replace with groups, count reported; a dangerous pattern is stopped, not frozen
  await tab('find');
  await fill('Fees due 17/10/2026 and 05/01/2027. Paid 01/09/2026.');
  await page.check('#f-regex');
  await page.fill('#f-find', '(\\d\\d)/(\\d\\d)/(\\d{4})');
  await page.fill('#f-repl', '$3-$2-$1');
  await settle(300);
  expect(Number(await page.getAttribute('#f-info', 'data-n')) === 3, 'regex finds 3 dates');
  await page.click('#f-all'); await settle(500);
  expect((await val()) === 'Fees due 2026-10-17 and 2027-01-05. Paid 2026-09-01.', 'regex replace with groups, got ' + await val());
  expect(await msgN() === 3, 'replace count 3');
  await fill('a'.repeat(40) + '!');
  await page.fill('#f-find', '(a+)+$');
  await page.click('#f-all');
  await page.waitForFunction(() => !document.querySelector('#f-all').disabled, null, { timeout: 8000 });
  await settle(200);
  expect((await page.getAttribute('#msg', 'data-key')) === 'fr_err_slow', 'catastrophic regex is stopped safely');
  await page.fill('#f-find', '([a-z');
  await settle(400);
  expect(Number(await page.getAttribute('#f-info', 'data-n')) === -1, 'broken regex reports an error');
  // plain + whole word
  await page.uncheck('#f-regex');
  await page.check('#f-whole');
  await fill('राम और रामू। Ram met Ramesh and RAM.');
  await page.fill('#f-find', 'राम'); await page.fill('#f-repl', 'श्याम');
  await page.click('#f-all'); await settle(300);
  expect((await val()) === 'श्याम और रामू। Ram met Ramesh and RAM.', 'whole word Hindi replace');
  await page.uncheck('#f-whole');

  // 7) clean up: PDF line breaks, extra spaces, emojis, punctuation keeping danda
  await tab('clean');
  await fill('Water is life. Every drop we save today helps our\nvillage tomorrow and the next day for all of us\nand our children.\n\nSecond   paragraph   here.');
  await page.click('[data-op="joinBroken"]'); await settle();
  await page.click('[data-op="collapseSpaces"]'); await settle();
  expect((await val()) === 'Water is life. Every drop we save today helps our village tomorrow and the next day for all of us and our children.\n\nSecond paragraph here.', 'PDF lines joined, got ' + JSON.stringify(await val()));
  await fill('Happy Diwali 🪔🎉 to all!');
  await page.click('[data-op="removeEmojis"]'); await settle();
  expect((await val()) === 'Happy Diwali to all!' && await msgN() === 2, 'emojis removed');
  await page.check('#o-danda');
  await fill('राम, श्याम और सीता। क्या?');
  await page.click('[data-op="removePunct"]'); await settle();
  expect((await val()) === 'राम श्याम और सीता। क्या', 'punctuation removed, danda and matras kept, got ' + await val());

  // 8) extract mobile numbers normalised to +91
  await tab('extract');
  await fill('Call 098765-43210 or +91 98765 43210, office 0731-2345678, Meera 8000012345.');
  await page.click('[data-kind="phones"]'); await settle();
  expect((await page.inputValue('#ex-out')) === '+91 9876543210\n+91 8000012345', 'phones extracted, got ' + JSON.stringify(await page.inputValue('#ex-out')));
  await page.click('[data-kind="emails"]'); await settle();
  await fill('Mail a.k@school.edu.in, RAVI@gmail.com and a.k@school.edu.in');
  expect(Number(await page.getAttribute('#ex-info', 'data-n')) === 2 && Number(await page.getAttribute('#ex-info', 'data-total')) === 3, 'emails: 2 unique of 3');

  // 9) top words
  await tab('freq');
  await fill('school school fun the the the school');
  const top = await page.$('#fq-body tr');
  expect(top && (await top.getAttribute('data-word')) === 'school' && (await top.getAttribute('data-count')) === '3', 'top word is school ×3');

  // 10) compare two texts: known summary counts (line mode, then word mode)
  await page.fill('#cmp-a', 'Apple\nBanana\nCherry\nDates\nElder');
  await page.fill('#cmp-b', 'Apple\nBlueberry\nCherry\nDates\nFig\nGrape');
  await page.click('#cmp-by [data-by="line"]');
  await page.waitForFunction(() => { const d = document.querySelector('#cmp-sum').dataset; return d.ladd === '3' && d.ldel === '2'; }, null, { timeout: 8000 }).catch(() => {});
  const sum = await page.evaluate(() => Object.assign({}, document.querySelector('#cmp-sum').dataset));
  expect(sum.add === '3' && sum.del === '2' && sum.same === '3', 'line diff +3 −2 =3, got ' + JSON.stringify(sum));
  expect((await page.$$('#cmp-out td.mk.a')).length === 3 && (await page.$$('#cmp-out td.mk.d')).length === 2, 'added/removed rows marked with + and −');
  await page.fill('#cmp-a', 'मेरा नाम राम है। The quick brown fox.');
  await page.fill('#cmp-b', 'मेरा नाम श्याम है। The quick red fox.');
  await page.click('#cmp-by [data-by="word"]');
  await page.waitForFunction(() => { const d = document.querySelector('#cmp-sum').dataset; return d.ladd === '1' && d.add === '2'; }, null, { timeout: 8000 }).catch(() => {});
  const w = await page.evaluate(() => Object.assign({}, document.querySelector('#cmp-sum').dataset));
  expect(w.add === '2' && w.del === '2', 'word diff +2 −2, got ' + JSON.stringify(w));
  expect((await page.textContent('#cmp-out ins')).trim() === 'श्याम', 'Hindi word shown as added');
  await page.click('#cmp-view [data-view="inline"]'); await settle();
  expect((await page.$$('#cmp-out table.inline')).length === 1, 'inline view');
  // ~5,000 lines compare without freezing
  const t0 = Date.now();
  await page.evaluate(() => {
    const a = [], b = [];
    for (let i = 0; i < 5000; i++) { a.push('Line ' + i + ' of the register'); b.push(i % 50 === 0 ? 'Changed line ' + i : 'Line ' + i + ' of the register'); }
    document.querySelector('#cmp-a').value = a.join('\n'); document.querySelector('#cmp-b').value = b.join('\n');
    document.querySelector('#cmp-by [data-by="line"]').click();
  });
  await page.waitForFunction(() => document.querySelector('#cmp-sum').dataset.add === '100', null, { timeout: 15000 });
  expect(Date.now() - t0 < 12000, '5,000-line compare finished quickly');

  // 11) autosave survives a reload
  await fill('Saved text for the test.');
  await settle(900);
  await page.reload({ waitUntil: 'load' });
  await settle(800);
  expect((await val()) === 'Saved text for the test.', 'text restored after reload');

  // 12) download .txt
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#download')]);
  expect(/^text-\d{4}-\d{2}-\d{2}\.txt$/.test(dl.suggestedFilename()), 'txt file name');
};
