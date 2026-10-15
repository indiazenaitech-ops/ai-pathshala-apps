/* Interaction test for AI Text Summarizer, run by tools/verify.js in en and hi.
   Engine A (TextRank, offline) is tested; Chrome's Summarizer API is not available in headless Chrome. */
module.exports = async function ({ page, lang, expect, log }) {
  const items = () => page.$$eval('#points li', ls => ls.map(l => l.textContent.trim()));
  const setRange = (v) => page.$eval('#lenRange', (r, v) => { r.value = String(v); r.dispatchEvent(new Event('input', { bubbles: true })); }, v);

  // 1) The sample in the page language is summarized at once, 5 points by default.
  await page.waitForSelector('#points li', { timeout: 15000 });
  await page.waitForTimeout(300);
  const text = await page.inputValue('#text');
  expect(text.length > 600, 'sample text is loaded (' + text.length + ' chars)');
  let pts = await items();
  expect(pts.length === 5, 'default summary has 5 points, got ' + pts.length);
  const flat = text.replace(/\s+/g, ' ');
  expect(pts.every(p => flat.includes(p.replace(/\s+/g, ' '))), 'every point is a sentence copied from the text');
  const order = pts.map(p => flat.indexOf(p.replace(/\s+/g, ' ')));
  expect(order.every((x, i) => i === 0 || x > order[i - 1]), 'points keep the original order: ' + order.join(','));
  const nSent = await page.evaluate(() => SmartSummarizer.summarize(document.getElementById('text').value, { mode: 'points', n: 5 }).sents.length);
  expect(nSent >= 20 && nSent <= 30, 'sample splits into a sensible number of sentences: ' + nSent);
  const end = lang === 'hi' ? '।' : '.';
  expect(pts.every(p => p.endsWith(end)), 'each point is a whole sentence ending with "' + end + '"');

  // 1b) A Title Case headline (no full stop) is not picked as a key point, even when a PDF line wraps into it.
  const head = await page.evaluate(() => {
    const txt = 'Monsoon Brings Relief to Maharashtra Farmers After Long Dry Spell\nMumbai, July 14: Heavy rain lashed large parts of Maharashtra on Sunday, bringing relief to farmers.\n' +
      'The rain raised water levels in the dams of Maharashtra. Farmers can now sow soybean and cotton after the rain. Officials expect a good harvest if the rain continues.';
    const r = SmartSummarizer.summarize(txt, { mode: 'points', n: 3 });
    return { n: r.sents.length, first: r.text.slice(r.sents[0].s, r.sents[0].e), picked: r.chosen.map(i => r.text.slice(r.sents[i].s, r.sents[i].e)) };
  });
  expect(head.n === 5 && head.first.indexOf('Mumbai') < 0, 'the headline stays its own line: ' + head.first);
  expect(head.picked.every(p => !/^Monsoon Brings/.test(p)), 'the headline is not a key point: ' + head.picked.join(' | '));

  // 2) Keywords show the topic word.
  const kws = await page.$$eval('#kw .chip', cs => cs.map(c => c.textContent.trim()));
  const topic = lang === 'hi' ? 'पानी' : 'water';
  expect(kws.length >= 4 && kws.includes(topic), 'keywords include "' + topic + '": ' + kws.join(', '));
  expect(/→/.test(await page.textContent('#stats')), 'word-count stats are shown');

  // 3) Length control: 3 points, then 50 % of the sentences.
  await setRange(3);
  await page.waitForTimeout(400);
  expect((await items()).length === 3, '3 points after moving the slider');
  await page.click('#modeSeg button[data-mode="pct"]');
  await setRange(50);
  await page.waitForTimeout(400);
  pts = await items();
  expect(pts.length === Math.round(nSent * 0.5), '50% gives ' + Math.round(nSent * 0.5) + ' points, got ' + pts.length);

  // 4) Tapping a point opens the highlighted text with the same number of marks.
  await page.click('#points li:nth-child(2) .ss-pt');
  await page.waitForTimeout(300);
  expect(await page.isVisible('#pane-hl'), 'highlight tab opens');
  const marks = await page.$$eval('#hl mark', ms => ms.length);
  expect(marks === pts.length, 'highlighted text has one mark per point (' + marks + ')');
  await page.click('#outTabs button[data-tab="points"]');

  // 5) A .txt file with abbreviations, initials, decimals and Hindi/Urdu full stops.
  await page.click('#modeSeg button[data-mode="points"]');
  await setRange(3);
  const custom = [
    'Dr. A. P. J. Abdul Kalam was born in Rameswaram in 1931. He became the 11th President of India in 2002.',
    'As a scientist, Kalam worked on rockets and missiles at DRDO and ISRO. He led the team that built the SLV-III rocket.',
    'Kalam loved teaching students. He visited thousands of schools and colleges across India.',
    'Kalam wrote many books, including Wings of Fire. His books inspire students to dream big and work hard.',
    'मिसाइल मैन कलाम का जीवन प्रेरणा देता है। वे सादगी से रहते थे।',
    'کلام صاحب طلبہ سے بہت محبت کرتے تھے۔ وہ کہتے تھے کہ خواب دیکھو۔'
  ].join('\n');
  await page.setInputFiles('#fileIn', { name: 'kalam.txt', mimeType: 'text/plain', buffer: Buffer.from(custom, 'utf8') });
  await page.waitForFunction(() => document.getElementById('text').value.indexOf('Kalam') >= 0, null, { timeout: 5000 });
  await page.waitForTimeout(300);
  const sents = await page.evaluate(() => { const r = SmartSummarizer.summarize(document.getElementById('text').value, { mode: 'points', n: 3 }); return r.sents.map(s => r.text.slice(s.s, s.e)); });
  expect(sents.length === 12, 'custom text splits into 12 sentences, got ' + sents.length + ': ' + sents.join(' | '));
  expect(sents[0].startsWith('Dr. A. P. J. Abdul Kalam') && sents[0].endsWith('1931.'), '"Dr." and initials do not end a sentence: ' + sents[0]);
  pts = await items();
  expect(pts.length === 3 && pts.some(p => /Kalam/.test(p)), '3 points about Kalam: ' + pts.join(' | '));
  expect(await page.isVisible('#fileBox'), 'file message is shown');

  // 6) Clear shows the empty state; settings survive a reload.
  await page.click('#clearBtn');
  await page.waitForTimeout(200);
  expect(await page.isVisible('#outEmpty') && (await page.$$('#points li')).length === 0, 'empty state after Clear');
  expect(await page.isDisabled('#copyBtn'), 'copy is disabled with no summary');
  await page.click('#sampleBtn');
  await page.waitForTimeout(300);
  await page.reload();
  await page.waitForSelector('#points li', { timeout: 15000 });
  expect((await items()).length === 3, 'the 3-point setting is remembered after reload');
  log('summary ok, ' + nSent + ' sentences in the sample');
};
