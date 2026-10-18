/* Interaction test for AI Dictionary (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const count = (sel) => page.locator(sel).count();
  const termOf = () => txt('#d-term');
  const data = await page.evaluate(() => ({
    n: AID_TERMS.length,
    byTopic: AID_TERMS.reduce((m, x) => { m[x.topic] = (m[x.topic] || 0) + 1; return m; }, {}),
    tod: (() => { const d = new Date(); const day = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); return AID_TERMS[(day * 37) % AID_TERMS.length]; })(),
    token: AID_TERMS.find(x => x.id === 'token'),
    startsT: AID_TERMS.filter(x => /^T/.test(x.term)).length
  }));
  expect(data.n === 120, 'dictionary has 120 terms, got ' + data.n);

  /* 1) opens on the term of the day, in the right language */
  expect(await termOf() === data.tod.term, `term of the day "${data.tod.term}" is open, got "${await termOf()}"`);
  expect(await page.isVisible('#d-tod'), 'term-of-the-day badge shown');
  const wantShort = await page.evaluate(([L, id]) => window.APP_CONTENT[L].terms[id][1], [lang, data.tod.id]);
  expect(await txt('#d-short') === wantShort, `meaning shown in ${lang}`);
  expect(await count('#list .ad-item') === 120, 'list shows all 120 terms');
  expect(await txt('#ad-status') === t('n_terms', { n: '120' }), 'status says 120 terms: ' + await txt('#ad-status'));

  /* 2) search finds "token" and opens it; local-script search works too */
  await page.fill('#ad-search', 'token');
  await page.waitForTimeout(120);
  expect(await termOf() === 'Token', 'searching "token" opens Token, got ' + await termOf());
  const first = await txt('#list .ad-item:first-child .ad-item-term');
  expect(first === 'Token', 'Token is the first result, got ' + first);
  const local = await page.evaluate((L) => window.APP_CONTENT[L].terms.token[0], lang);
  if (local) {
    await page.fill('#ad-search', 'prompt');
    await page.waitForTimeout(80);
    await page.fill('#ad-search', local.split(/[ /·(]/)[0]);
    await page.waitForTimeout(120);
    expect(await termOf() === 'Token', `searching the local word "${local}" finds Token, got ${await termOf()}`);
  }
  await page.fill('#ad-search', 'hallucin');
  await page.waitForTimeout(120);
  expect(await termOf() === 'Hallucination', 'prefix search finds Hallucination');
  await page.fill('#ad-search', 'xyzzyqq');
  await page.waitForTimeout(120);
  expect(await txt('#ad-status') === t('no_match'), 'nonsense search says no match');
  expect(await count('#list .ad-empty') === 1, 'empty state shown');
  await page.fill('#ad-search', '');
  await page.waitForTimeout(120);
  expect(await count('#list .ad-item') === 120, 'clearing the search restores the list');

  /* 3) topic + A–Z filters */
  await page.click('#topic-chips .chip[data-topic="genai"]');
  expect(await count('#list .ad-item') === data.byTopic.genai, `GenAI filter shows ${data.byTopic.genai} terms, got ${await count('#list .ad-item')}`);
  await page.click('#topic-chips .chip[data-topic=""]');
  await page.click('#az button[aria-label="' + t('letter_aria', { l: 'T' }) + '"]');
  expect(await count('#list .ad-item') === data.startsT, `letter T shows ${data.startsT} terms, got ${await count('#list .ad-item')}`);
  const allT = await page.$$eval('#list .ad-item-term', a => a.every(e => /^T/.test(e.textContent)));
  expect(allT, 'every listed term starts with T');
  await page.click('#az .az-all');
  expect(await count('#list .ad-item') === 120, 'A–Z "all" restores the list');

  /* 4) related chips, prev/next, list keyboard */
  await page.fill('#ad-search', 'rag');
  await page.press('#ad-search', 'Enter');
  expect((await termOf()).startsWith('RAG'), 'Enter opens the first match (RAG), got ' + await termOf());
  await page.fill('#ad-search', '');
  await page.waitForTimeout(100);
  await page.click('#d-related .chip[data-id="embedding"]');
  expect(await termOf() === 'Embedding', 'related chip opens Embedding');
  await page.click('#d-next');
  expect(await termOf() === 'Epoch', 'Next goes to the alphabetical neighbour (Epoch), got ' + await termOf());
  await page.click('#d-prev');
  expect(await termOf() === 'Embedding', 'Previous goes back');
  await page.focus('#list .ad-item[aria-current="true"]');
  await page.keyboard.press('ArrowDown');
  expect(await termOf() === 'Epoch', 'ArrowDown in the list selects the next term');
  await page.keyboard.press('Home');
  expect((await termOf()).startsWith('Accuracy'), 'Home selects the first term, got ' + await termOf());

  /* 5) share link + copy text */
  await page.click('#list .ad-item[data-id="token"]');
  const wa = await page.getAttribute('#d-wa', 'href');
  expect(wa.startsWith('https://wa.me/?text='), 'WhatsApp share link');
  const decoded = decodeURIComponent(wa);
  expect(decoded.includes('Token') && /[?&]term=token/.test(decoded), 'share text has the term and a ?term=token deep link: ' + decoded.slice(0, 120));

  /* 6) switching language keeps the open term and translates the meaning */
  const other = lang === 'en' ? 'ta' : 'en';
  await page.evaluate((L) => EDU.setLang(L), other);
  expect(await termOf() === 'Token', 'open term survives a language switch');
  const otherShort = await page.evaluate((L) => window.APP_CONTENT[L].terms.token[1], other);
  expect(await txt('#d-short') === otherShort, `meaning re-rendered in ${other}`);
  await page.evaluate((L) => EDU.setLang(L), lang);
  expect(await txt('#d-short') === await page.evaluate((L) => window.APP_CONTENT[L].terms.token[1], lang), 'meaning back in ' + lang);

  /* 7) deep link opens a term */
  const url = page.url().split('?')[0] + '?lang=' + lang + '&term=deepfake';
  await page.goto(url);
  await page.waitForSelector('#d-term');
  expect(await termOf() === 'Deepfake', '?term=deepfake opens Deepfake, got ' + await termOf());

  /* 8) flashcards: flip with Space, rate with 1/2, known count persists */
  await page.click('#tab-cards');
  await page.click('#fc-topic button[data-v="safety"]');
  expect(await txt('#fc-count') === t('card_count', { i: '1', n: String(data.byTopic.safety) }), 'first card of the safety deck: ' + await txt('#fc-count'));
  expect(await txt('#fc-known') === t('known_count', { k: '0', n: String(data.byTopic.safety) }), 'nothing known yet');
  let firstId = await page.getAttribute('#fc-card', 'data-id');
  await page.focus('#fc-card');
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => document.getElementById('fc-card').classList.contains('flipped')), 'Space flips the card');
  expect(await page.isVisible('#fc-rate') && await page.isHidden('#fc-fliprow'), 'rating buttons appear after the flip');
  await page.keyboard.press('1');
  let known = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.ai-dictionary.known') || '[]'));
  expect(known.length === 1 && known[0] === firstId, '"I knew it" saves the term as known');
  expect(await txt('#fc-known') === t('known_count', { k: '1', n: String(data.byTopic.safety) }), 'known count is 1');
  await page.click('#fc-card');
  await page.click('#fc-again');
  expect(await txt('#fc-count') === t('card_count', { i: '3', n: String(data.byTopic.safety) }), 'moved to card 3');
  // finish the deck: knew everything else
  let guard = 0;
  while (await page.isVisible('#fc-stage') && guard++ < 30) { await page.click('#fc-card'); await page.click('#fc-knew'); }
  await page.waitForSelector('#fc-done:not([hidden])');
  expect(await txt('#fc-done-n') === `${data.byTopic.safety - 1} / ${data.byTopic.safety}`, 'round summary: ' + await txt('#fc-done-n'));
  expect(await page.isVisible('#fc-review'), 'review button offered for the 1 card to repeat');
  await page.click('#fc-review');
  expect(await txt('#fc-count') === t('card_count', { i: '1', n: '1' }), 'review deck has 1 card');
  known = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.ai-dictionary.known') || '[]'));
  expect(known.length === data.byTopic.safety - 1, `${data.byTopic.safety - 1} terms known, got ${known.length}`);

  /* 9) quiz: right, wrong, keyboard to the end, best score saved */
  await page.click('#tab-quiz');
  await page.click('#qm-m2t');
  await page.click('#q-topic button[data-v="ml"]');
  const askedId = () => page.getAttribute('#q-text', 'data-id');
  let id = await askedId();
  expect(await count('#q-options button') === 4, 'four options');
  const optIds = await page.$$eval('#q-options button', a => a.map(b => b.dataset.id));
  expect(optIds.includes(id) && new Set(optIds).size === 4, 'options include the answer and are distinct');
  await page.click(`#q-options button[data-id="${id}"]`);
  expect(await txt('#q-score') === '1 / 1', 'score after a correct answer: ' + await txt('#q-score'));
  expect((await txt('#q-feedback')).startsWith(t('correct')), 'correct feedback');
  await page.click('#q-next');
  id = await askedId();
  const wrong = (await page.$$eval('#q-options button', a => a.map(b => b.dataset.id))).find(x => x !== id);
  await page.click(`#q-options button[data-id="${wrong}"]`);
  expect(await txt('#q-score') === '1 / 2', 'score after a wrong answer: ' + await txt('#q-score'));
  expect(await count('#q-options .ok') === 1 && await count('#q-options .bad') === 1, 'right and wrong options marked');
  expect((await txt('#q-feedback')).startsWith(t('wrong') + ':'), 'wrong feedback explains: ' + await txt('#q-feedback'));
  await page.keyboard.press('Enter');
  for (let i = 3; i <= 10; i++) {
    id = await askedId();
    const ids = await page.$$eval('#q-options button', a => a.map(b => b.dataset.id));
    await page.keyboard.press(String(ids.indexOf(id) + 1));
    await page.keyboard.press('Enter');
  }
  await page.waitForSelector('#q-end:not([hidden])');
  expect(await txt('#q-end-score') === '9 / 10', 'end score 9 / 10, got ' + await txt('#q-end-score'));
  const best = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.ai-dictionary.best') || '{}'));
  expect(best['m2t-ml'] === 9, 'best score saved: ' + JSON.stringify(best));
  await page.click('#q-again');
  expect(await txt('#q-score') === '0 / 0', 'play again resets the score');
  await page.click('#qm-t2m');
  expect(await page.getAttribute('#qm-t2m', 'aria-pressed') === 'true', 'term → meaning mode');
  id = await askedId();
  await page.click(`#q-options button[data-id="${id}"]`);
  expect(await txt('#q-score') === '1 / 1', 'term → meaning right answer scores');
  await page.click('#reset');
  await page.waitForTimeout(100);
  expect(await page.getAttribute('#qm-m2t', 'aria-pressed') === 'true' && await txt('#q-best') === '', 'Reset restores the mode and clears best scores');

  /* 10) print glossary builds a table of the filtered terms */
  await page.click('#tab-dict');
  await page.evaluate(() => { window.print = () => { }; });
  await page.click('#topic-chips .chip[data-topic="careers"]');
  await page.click('#print-btn');
  await page.waitForTimeout(80);
  expect(await count('#glossary tbody tr') === data.byTopic.careers, `glossary prints the ${data.byTopic.careers} filtered terms`);
  await page.click('#topic-chips .chip[data-topic=""]');
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  expect(await count('#glossary tbody tr') === 120, 'Ctrl+P prints all 120 terms');

  /* 11) selection survives a reload within the day; filters saved */
  await page.click('#list .ad-item[data-id="bias"]');
  await page.reload();
  await page.waitForSelector('#d-term');
  expect(await termOf() === 'Bias', 'selected term survives a reload');
  expect(await page.isVisible('#p-dict'), 'dictionary tab open after reload');
  log('ok', lang, 'tod =', data.tod.id);
};
