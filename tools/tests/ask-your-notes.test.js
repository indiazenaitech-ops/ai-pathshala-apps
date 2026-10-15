/* Interaction test for Ask Your Notes (AI Search), run by tools/verify.js in en and hi.
   Keyword search (no download), page numbers, no-match message, saving, then AI search: the
   multilingual-e5-small model (~135 MB) downloads from huggingface.co, so the waits are generous. */
module.exports = async function ({ page, lang, expect, t, log }) {
  await page.waitForSelector('#app[data-ready="1"]', { timeout: 30000 });
  const C = await page.evaluate(l => window.APP_CONTENT[l], lang);
  const hits = () => page.$$eval('#results li.an-hit', ls => ls.map(l => ({ text: l.querySelector('.an-text').textContent, mark: !!l.querySelector('mark'), badges: [...l.querySelectorAll('.badge')].map(b => b.textContent) })));
  const ask = async q => { await page.fill('#q', q); await page.click('#askBtn'); };

  // 1) First visit: the sample chapter in the page language is loaded and the first suggested question is answered.
  const notes = await page.inputValue('#notes');
  expect(notes.includes(C.title), 'sample chapter loaded into the notes box');
  const passBadge = await page.textContent('#stats .badge.primary');
  expect(/\d+/.test(passBadge) && +passBadge.match(/\d+/)[0] >= 10, 'notes split into passages: ' + passBadge);
  let r = await hits();
  expect(r.length === 3, 'top 3 answers shown for the first suggested question, got ' + r.length);
  const green = { en: /chlorophyll/i, hi: /क्लोरोफ़िल/ }[lang];
  expect(green.test(r[0].text), 'best answer to "why are leaves green" mentions chlorophyll: ' + r[0].text.slice(0, 80));
  expect(r[0].mark, 'best sentence is highlighted');
  expect((await page.$$('#tryChips .chip')).length === 3, '3 suggested questions');

  // 2) Keyword search finds the iodine test (page 2) for the second suggested question.
  await page.click('#tryChips .chip:nth-child(2)');
  r = await hits();
  const iodine = { en: /iodine/i, hi: /आयोडीन/ }[lang];
  expect(r.length >= 1 && iodine.test(r[0].text), 'starch question → iodine passage: ' + (r[0] && r[0].text.slice(0, 80)));
  expect(r[0].badges.includes(t('page_n', { n: 2 })), 'iodine passage is on page 2: ' + JSON.stringify(r[0].badges));

  // 3) A question with no matching words gives a clear message instead of results.
  await ask('xyzzy qwrtp');
  expect((await hits()).length === 0 && !!(await page.$('#resMsg .an-empty')), 'no-match message shown');

  // 4) Own notes with page marks: the answer comes from page 2, and the notes are saved on the device.
  await page.fill('#notes', '--- Page 1 ---\nThe Taj Mahal is in Agra. Shah Jahan built it in memory of Mumtaz Mahal.\n\n--- Page 2 ---\nThe Konark Sun Temple is in Odisha. It looks like a giant chariot with stone wheels. It was built in the 13th century.');
  await page.waitForFunction(w => (document.querySelector('#stats .badge.primary') || {}).textContent === w, t('n_passages', { n: 2 }), { timeout: 5000 });
  await ask('Where is the Konark temple?');
  r = await hits();
  expect(r.length >= 1 && /Konark/.test(r[0].text) && r[0].badges.includes(t('page_n', { n: 2 })), 'own notes: Konark answer on page 2: ' + JSON.stringify(r[0]));
  const saved = await page.evaluate(() => localStorage.getItem('edu.ask-your-notes.notes') || '');
  expect(/Konark/.test(saved), 'notes saved in EDU.store');

  // 5) Copy all puts the question and the passages on the clipboard.
  await page.evaluate(() => {
    window.__copied = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: s => { window.__copied = s; return Promise.resolve(); } } });
  });
  await page.click('#copyAll');
  await page.waitForFunction(() => window.__copied !== null, null, { timeout: 5000 });
  expect(/Konark/.test(await page.evaluate(() => window.__copied)), 'copied text contains the answer');

  // 6) AI search: ask first (size shown), then download the model.
  await page.click('#modeAi');
  expect(await page.isVisible('#aiGet'), 'AI search asks before downloading');
  expect(/\d{2,3}/.test(await page.textContent('#aiGet')), 'download button shows the size: ' + await page.textContent('#aiGet'));
  expect((await hits()).length >= 1, 'keyword results stay visible while AI search is off');
  await page.click('#aiGet');
  await page.waitForSelector('#aiOn:not([hidden])', { timeout: 100000 });
  log('model ready');

  // 7) Cross-language: English notes, question in the other language (or Hindi for en).
  await page.selectOption('#sampleLang', 'en');
  await page.click('#sampleBtn');
  const simWord = t('sim_v', { v: '' }).trim();
  const q = lang === 'en' ? 'पत्ती में स्टार्च की जाँच कैसे करें?' : C.questions[1];
  await ask(q);
  await page.waitForFunction(w => { const b = document.querySelector('#results li .badge.success'); return b && b.textContent.indexOf(w) >= 0 && document.getElementById('hRes').textContent.indexOf('स्टार्च') >= 0; }, simWord, { timeout: 60000 });
  r = await hits();
  log('AI top: ' + r.map(x => x.text.slice(0, 40)).join(' | '));
  expect(r.slice(0, 3).some(x => /iodine/i.test(x.text)), 'Hindi question finds the English iodine passage in the top 3');
  expect(await page.isVisible('#viz') && (await page.$$('#vizQ i')).length === 48, 'question vector shown as 48 squares');
  const sim = await page.textContent('#vizSim');
  expect(/0[.,]\d\d/.test(sim), 'cosine similarity shown: ' + sim);

  // 8) Top 5 gives five answers in AI mode.
  await page.click('#kSeg button[data-k="5"]');
  await page.waitForFunction(() => document.querySelectorAll('#results li.an-hit').length === 5, null, { timeout: 30000 });

  // 9) New notes in AI mode: the answer comes from the new notes (no stale vectors), the sample's suggested
  //    questions disappear, and the page shows keyword answers until the AI has read the new notes.
  await page.click('#kSeg button[data-k="3"]');
  await page.fill('#notes', '--- Page 1 ---\nThe Konark Sun Temple is in Odisha. It looks like a giant chariot with stone wheels.\n\n--- Page 2 ---\nMount Abu is the only hill station in Rajasthan. It is in the Aravalli hills, and the Dilwara temples are there.\n\n--- Page 3 ---\nThe Sundarbans in West Bengal are the largest mangrove forest in the world. Royal Bengal tigers live there.');
  const q2 = lang === 'en' ? 'Which cool hill town is in Rajasthan?' : 'राजस्थान का पहाड़ी इलाका कौन-सा है?';
  await ask(q2);
  await page.waitForFunction(q => { const b = document.querySelector('#results li .badge.success'); return document.getElementById('hRes').textContent.indexOf(q) >= 0 && document.getElementById('aiStatus').hidden && b && !document.querySelector('#resMsg .callout:not(.warning)'); }, q2, { timeout: 60000 });
  await page.waitForFunction(w => { const b = document.querySelector('#results li .badge.success'); return b && b.textContent.indexOf(w) >= 0; }, simWord, { timeout: 60000 });
  r = await hits();
  expect(/Mount Abu/.test(r[0].text) && r[0].badges.includes(t('page_n', { n: 2 })), 'AI answer comes from the edited notes (page 2): ' + JSON.stringify(r[0]));
  expect(r.every(x => !/iodine|chlorophyll/i.test(x.text)), 'no stale passages from the old notes');
  expect(!(await page.isVisible('#tryRow')), 'sample questions hidden once the sample is replaced');
};
