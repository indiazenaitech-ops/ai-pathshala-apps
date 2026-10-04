/* Interaction test for Essay & Word Counter, run by tools/verify.js in en and hi.
   Checks exact counts for English, Hindi (। ॥) and Urdu (۔ ؟) text, abbreviations, the word-limit
   bar states, long sentences, repeated words, readability, check view, clear/undo, autosave,
   format guides and the .txt download. */
const fs = require('fs');

module.exports = async function ({ page, lang, expect }) {
  const val = async (id) => Number(await page.getAttribute('#st-' + id, 'data-value'));
  const settle = () => page.waitForTimeout(200);
  const fill = async (text) => { await page.fill('#text', text); await settle(); };

  // 0) starts with the sample text of the current language, already counted
  const sample = await page.evaluate(() => window.APP_CONTENT[EDU.lang].sample);
  expect((await page.inputValue('#text')) === sample, 'starts with the ' + lang + ' sample text');
  expect(await val('words') > 40, 'sample words counted: ' + await val('words'));
  expect(await val('sents') >= 8, 'sample sentences counted: ' + await val('sents'));

  // 1) English: words, sentences (abbreviations, decimals), paragraphs, characters
  const en = 'The cat sat on the mat. The dog ran fast! Did it rain? Yes.\n\nA well-known man, Dr. Rao, met Mr. Sharma at 5.30 pm.';
  await fill(en);
  expect(await val('words') === 25, 'English words = 25, got ' + await val('words'));
  expect(await val('sents') === 5, 'English sentences = 5 (Dr./Mr./5.30 do not split), got ' + await val('sents'));
  expect(await val('paras') === 2, 'paragraphs = 2, got ' + await val('paras'));
  expect(await val('chars') === en.replace(/\n/g, '').length, 'characters with spaces, got ' + await val('chars'));
  expect(await val('charsns') === en.replace(/\s/g, '').length, 'characters without spaces, got ' + await val('charsns'));

  // 1b) list numbers do not end a sentence; U.S.A, e.g, a web address and 10:30 are one word each
  await fill('1. Introduction\n2. Main body\nVisit www.cbse.gov.in at 10:30, e.g. with U.S.A. friends.');
  expect(await val('words') === 13, 'joined words counted once (13), got ' + await val('words'));
  expect(await val('sents') === 3, 'numbered lines are not split at "1." (3 sentences), got ' + await val('sents'));

  // 2) Hindi danda + double danda, Urdu full stop + question mark
  await fill('मेरा नाम राम है। मैं दसवीं कक्षा में पढ़ता हूँ॥ क्या तुम आओगे?\nیہ کتاب ہے۔ کیا آپ آئیں گے؟');
  expect(await val('words') === 20, 'Hindi + Urdu words = 20, got ' + await val('words'));
  expect(await val('sents') === 5, 'Hindi + Urdu sentences = 5, got ' + await val('sents'));
  expect((await page.getAttribute('#read-card', 'data-state')) === 'na', 'readability is English-only');
  await fill('कि हूँ');
  expect(await val('chars') === 3 && await val('charsns') === 2, 'letters counted as seen (कि = 1, हूँ = 1), got ' + await val('chars'));

  // 3) word-limit bar: notice preset 40–50 words
  await page.selectOption('#preset', 'notice');
  const words = (n) => Array.from({ length: n }, (_, i) => 'word' + i).join(' ') + '.';
  await fill(words(20));
  expect((await page.getAttribute('#meter', 'data-state')) === 'short', '20 words is short for a notice');
  await fill(words(38));
  expect((await page.getAttribute('#meter', 'data-state')) === 'near', '38 words is nearly there');
  await fill(words(45));
  expect((await page.getAttribute('#meter', 'data-state')) === 'ok', '45 words fits 40–50');
  await fill(words(53));
  expect((await page.getAttribute('#meter', 'data-state')) === 'over', '53 words is a little over');
  await fill(words(70));
  expect((await page.getAttribute('#meter', 'data-state')) === 'way', '70 words is far over');
  // custom character limit
  await page.selectOption('#preset', 'custom');
  await page.fill('#cmin', '10');
  await page.fill('#cmax', '20');
  await page.click('#unit-c');
  await fill('Hello world');
  expect((await page.getAttribute('#meter', 'data-value')) === '11', 'character meter counts 11');
  expect((await page.getAttribute('#meter', 'data-state')) === 'ok', '11 characters fits 10–20');
  await page.selectOption('#preset', 'para');

  // 4) longest sentences + check view
  const long30 = 'This ' + Array.from({ length: 28 }, (_, i) => 'item' + i).join(' ') + ' end.';
  await fill('Short one here. ' + long30 + ' Another short one.');
  const first = await page.$('#long-list .long-item');
  expect(first && (await first.getAttribute('data-words')) === '30', 'longest sentence has 30 words');
  expect((await first.getAttribute('data-level')) === 'long', '30-word sentence is marked long');
  await first.click();
  expect(await page.isVisible('#check'), 'clicking a long sentence opens the check view');
  expect((await page.$$('#check .snt')).length === 3, 'check view shows 3 sentences');
  expect((await page.$$('#check .s-long')).length === 1, 'one sentence coloured as long');
  await page.click('#check .snt[data-i="2"]');
  expect(await page.isVisible('#text'), 'tapping a sentence returns to the editor');
  const sel = await page.evaluate(() => { const t = document.querySelector('#text'); return t.value.slice(t.selectionStart, t.selectionEnd); });
  expect(sel === 'Another short one.', 'tapped sentence is selected in the editor, got "' + sel + '"');

  // 5) repeated words, small words skipped
  await fill('School is fun. Our school is big. I love my school. The the the end.');
  const chip = await page.$('#rep-list .chip[data-word="school"]');
  expect(chip && (await chip.getAttribute('data-count')) === '3', '"school" repeated 3 times');
  expect(!(await page.$('#rep-list .chip[data-word="the"]')), '"the" is skipped as a small word');
  await page.uncheck('#skip-small');
  await settle();
  const theChip = await page.$('#rep-list .chip[data-word="the"]');
  expect(theChip && (await theChip.getAttribute('data-count')) === '3', '"the" appears when small words are counted');
  await page.check('#skip-small');
  await page.click('#rep-list .chip[data-word="school"]');
  expect((await page.$$('#check mark')).length === 3, 'repeated word highlighted 3 times in check view');
  await page.click('#view-write');

  // 6) readability for English
  await fill('The sun is bright today. We went to the park with our friends. We played games and ate food. Then we sat under a big tree and read books. It was a fun day for all of us. We will go again next week.');
  expect((await page.getAttribute('#read-card', 'data-state')) === 'ok', 'readability shown for English');
  const fre = Number(await page.getAttribute('#read-card', 'data-fre'));
  expect(fre > 75 && fre < 130, 'simple English scores as easy, got ' + fre);

  // 7) clear + undo
  const before = await page.inputValue('#text');
  await page.click('#clear');
  await settle();
  expect((await page.inputValue('#text')) === '' && await val('words') === 0, 'clear empties the text');
  expect(await page.isVisible('#undo'), 'undo button appears');
  await page.click('#undo');
  await settle();
  expect((await page.inputValue('#text')) === before, 'undo restores the text');

  // 8) autosave survives a reload
  await fill('Saved draft text for the test.');
  await page.waitForTimeout(900);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(700);
  expect((await page.inputValue('#text')) === 'Saved draft text for the test.', 'draft restored after reload');
  expect((await page.inputValue('#preset')) === 'para', 'word-limit choice restored');

  // 9) format guide: report tab, use layout, set limit
  await page.click('#gtab-4');
  const g = await page.evaluate(() => window.APP_CONTENT[EDU.lang].guides[4]);
  expect((await page.textContent('#guide-title')).trim() === g.name, 'report guide shown');
  expect((await page.$$('#guide-panel .wc-points li')).length === 5, 'guide has 5 key points');
  await page.selectOption('#preset', 'none');
  await page.click('#use-layout');
  await settle();
  expect((await page.inputValue('#text')) === g.outline, 'layout inserted into the editor');
  expect((await page.inputValue('#preset')) === 'l12', 'layout sets the 120–150 word limit');

  // 10) download .txt
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#download')]);
  expect(/^writing-\d{4}-\d{2}-\d{2}\.txt$/.test(dl.suggestedFilename()), 'txt file name, got ' + dl.suggestedFilename());
  const body = fs.readFileSync(await dl.path(), 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
  expect(body === g.outline, 'downloaded text matches the editor');
};
