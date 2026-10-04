/* Interaction test for Flashcards (run by tools/verify.js in en and hi). */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t, log }) {
  const count = (sel) => page.locator(sel).count();
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const decks = () => page.evaluate(() => JSON.parse(localStorage.getItem('edu.flashcards.decks') || '[]'));
  const curDeck = () => page.evaluate(() => {
    const ds = JSON.parse(localStorage.getItem('edu.flashcards.decks') || '[]');
    const id = JSON.parse(localStorage.getItem('edu.flashcards.current') || 'null');
    return ds.find(d => d.id === id) || ds[0];
  });
  const today = () => page.evaluate(() => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); });

  /* 1. sample decks in the page language, all 10 states due today */
  await page.waitForSelector('#deckSel option', { state: 'attached' });
  expect(await count('#deckSel option') === 3, 'three sample decks, got ' + await count('#deckSel option'));
  const sample = await curDeck();
  const wantName = await page.evaluate((L) => window.APP_CONTENT[L].decks[0].name, lang);
  expect(sample.name === wantName && sample.cards.length === 10, `sample deck is in ${lang}: "${sample.name}"`);
  expect(await txt('#dueCount') === '10', 'ten new cards due today');

  /* 2. new deck + editor: one card by form, three by bulk paste (one bad line) */
  await page.click('#newDeck');
  await page.waitForSelector('#p-edit:not([hidden])');
  await page.fill('#deckName', 'Test deck');
  await page.click('#addCard');                              // empty: refused
  expect((await curDeck()).cards.length === 0, 'empty card is not added');
  await page.fill('#cardFront', 'Goa');
  await page.fill('#cardBack', 'Panaji');
  await page.click('#addCard');
  await page.fill('#bulkText', 'Assam - Dispur\nGujarat\tGandhinagar\n3. Bihar – Patna\nthis line has no separator');
  expect((await txt('#bulkCount')).includes('3'), 'bulk preview counts 3 cards: ' + await txt('#bulkCount'));
  await page.click('#bulkAdd');
  let d = await curDeck();
  expect(d.name === 'Test deck' && d.cards.length === 4, 'deck has 4 cards, got ' + d.cards.length);
  expect(d.cards[2].f === 'Gujarat' && d.cards[2].b === 'Gandhinagar' && d.cards[3].f === 'Bihar' && d.cards[3].b === 'Patna', 'tab and en-dash lines parsed, numbering stripped');
  expect(await count('#cardList .fc-item') === 4, 'card list shows 4 cards');

  /* edit + delete + undo */
  await page.click('#cardList .fc-item:nth-child(1) [data-act="edit"]');
  expect(await page.inputValue('#cardFront') === 'Goa', 'editor loads the card');
  await page.fill('#cardBack', 'Panaji (Panjim)');
  await page.click('#addCard');
  expect((await curDeck()).cards[0].b === 'Panaji (Panjim)', 'card edited');
  await page.click('#cardList .fc-item:nth-child(2) [data-act="del"]');
  expect(await count('#cardList .fc-item') === 3, 'card deleted');
  await page.click('#undoBtn');
  expect(await count('#cardList .fc-item') === 4 && (await curDeck()).cards[1].f === 'Assam', 'undo restores the card in place');

  /* 3. picture card: front = picture only */
  const png = Buffer.from(await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 40; c.height = 30; const x = c.getContext('2d'); x.fillStyle = '#e03131'; x.fillRect(0, 0, 40, 30); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
  const [fc0] = await Promise.all([page.waitForEvent('filechooser'), page.click('#cardImgBtn')]);
  await fc0.setFiles({ name: 'red.png', mimeType: 'image/png', buffer: png });
  await page.waitForSelector('#cardImgPrev:not([hidden])');
  await page.fill('#cardBack', 'Red square');
  await page.click('#addCard');
  d = await curDeck();
  const imgs = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.flashcards.imgs') || '{}'));
  const pic = d.cards[4];
  expect(d.cards.length === 5 && pic.img === true && pic.f === '' && /^data:image\/jpeg/.test(imgs[pic.id] || ''), 'picture card saved with a small JPEG');
  expect(await count('#cardList .fc-thumb') === 1, 'thumbnail shown in the list');

  /* 4. study with Leitner boxes */
  await page.click('#tab-study');
  expect(await txt('#dueCount') === '5', '5 cards due in the new deck');
  await page.click('#sizeSeg button[data-v="0"]');
  await page.click('#startStudy');
  await page.waitForSelector('#studySession:not([hidden])');
  expect(await txt('#sessCount') === '0 / 5', 'session starts at 0 / 5');
  let againId = null, guard = 0;
  while (await page.isVisible('#studySession') && guard++ < 20) {
    const id = await page.getAttribute('#card', 'data-id');
    if (guard === 1) {
      await page.focus('#card');
      await page.keyboard.press('Space');                    // keyboard flip
      expect(await page.evaluate(() => document.getElementById('card').classList.contains('flipped')), 'Space flips the card');
      await page.keyboard.press('2');                        // still learning
      againId = id;
    } else if (guard === 2) {
      await page.click('#flipBtn');
      await page.keyboard.press('1');                        // knew it (keyboard)
    } else {
      await page.click('#card');
      await page.click('#knewBtn');
    }
  }
  await page.waitForSelector('#studySummary:not([hidden])');
  expect(await txt('#sumKnew') === '4' && await txt('#sumAgain') === '1', `summary 4 knew / 1 learning, got ${await txt('#sumKnew')} / ${await txt('#sumAgain')}`);
  const td = await today();
  d = await curDeck();
  const again = d.cards.find(c => c.id === againId);
  const others = d.cards.filter(c => c.id !== againId);
  expect(again.box === 1 && again.due === td + 1, `“still learning” card stays in box 1, due tomorrow (box ${again.box}, due +${again.due - td})`);
  expect(others.every(c => c.box === 2 && c.due === td + 2), 'known cards move to box 2, due in 2 days');
  await page.click('#studyDone');
  expect(await txt('#dueCount') === '0' && await page.isVisible('#allDone'), 'nothing due after the session');
  const streakTxt = await txt('#statStreak');
  expect(streakTxt.endsWith('1'), 'one-day streak: ' + streakTxt);

  /* time travel: make the box-2 cards due, reload, they are due again */
  await page.evaluate(() => {
    const ds = JSON.parse(localStorage.getItem('edu.flashcards.decks'));
    const id = JSON.parse(localStorage.getItem('edu.flashcards.current'));
    ds.find(x => x.id === id).cards.forEach(c => { if (c.box === 2) c.due -= 2; });
    localStorage.setItem('edu.flashcards.decks', JSON.stringify(ds));
  });
  await page.reload();
  await page.waitForSelector('#dueCount');
  expect(await txt('#dueCount') === '4', 'after 2 days the 4 box-2 cards are due again, got ' + await txt('#dueCount'));

  /* 5. typing quiz with a forgiving answer check */
  await page.click('#tab-quiz');
  await page.click('#sideSeg button[data-side="b"]');
  await page.click('#qcountSeg button[data-v="0"]');
  await page.click('#startQuiz');
  await page.waitForSelector('#quizRun:not([hidden])');
  d = await curDeck();
  const answerOf = {}; d.cards.forEach(c => { answerOf[c.f] = c.b; });
  let q = 0;
  while (await page.isVisible('#quizRun') && q < 10) {
    const prompt = await txt('#quizPrompt');
    const ans = answerOf[prompt] !== undefined ? answerOf[prompt] : 'Red square';
    q++;
    if (q === 1) {
      await page.fill('#quizInput', 'zzz');                 // wrong, then override
      await page.press('#quizInput', 'Enter');
      expect(await page.getAttribute('#quizFeedback', 'class') === 'callout danger', 'wrong answer is marked wrong');
      expect(await page.isVisible('#quizOverride'), '“I was right” offered after a wrong answer');
      await page.click('#quizOverride');
    } else if (q === 2) {
      await page.click('#quizSkip');
      expect((await txt('#quizFeedback')).includes(ans.split(' (')[0]), 'skip shows the answer');
    } else {
      const typo = ans.length > 6 ? (ans.slice(0, 3) + ans.slice(4)).toUpperCase() : ' ' + ans.toLowerCase() + '!';
      await page.fill('#quizInput', typo);
      await page.click('#quizCheck');
      expect(await page.getAttribute('#quizFeedback', 'class') === 'callout success', `fuzzy check accepts "${typo}" for "${ans}"`);
    }
    await page.click('#quizNext');
  }
  await page.waitForSelector('#quizResult:not([hidden])');
  expect(await txt('#quizFinal') === '4 / 5', 'quiz score 4 / 5, got ' + await txt('#quizFinal'));
  expect(await count('#quizReview li') === 1, 'one mistake to review');
  await page.click('#quizRetry');
  expect(await page.isVisible('#quizRun') && (await txt('#quizCount')).includes('1'), 'retry mistakes starts a 1-question quiz');
  await page.click('#quizEnd');

  /* 6. match game */
  await page.click('#tab-match');
  await page.click('#pairsSeg button[data-v="4"]');
  await page.waitForSelector('#tiles .fc-tile');
  expect(await count('#tiles .fc-tile') === 8, '4 pairs = 8 tiles');
  const tiles = await page.$$eval('#tiles .fc-tile', els => els.map(e => ({ i: e.dataset.i, pair: e.dataset.pair, side: e.dataset.side })));
  const f0 = tiles.find(x => x.pair === '0' && x.side === 'f'), b1 = tiles.find(x => x.pair === '1' && x.side === 'b');
  await page.click(`#tiles .fc-tile[data-i="${f0.i}"]`);
  await page.click(`#tiles .fc-tile[data-i="${b1.i}"]`);
  expect(await count('#tiles .fc-tile.gone') === 0, 'a wrong pair does not match');
  for (const p of ['0', '1', '2', '3']) {
    for (const s of ['f', 'b']) {
      const tl = tiles.find(x => x.pair === p && x.side === s);
      await page.click(`#tiles .fc-tile[data-i="${tl.i}"]`);
    }
  }
  await page.waitForSelector('#matchDone:not([hidden])');
  expect(await count('#tiles .fc-tile.gone') === 8, 'all tiles matched');
  expect(await txt('#matchTries') === t('tries_n', { n: '5' }), 'tries counted: ' + await txt('#matchTries'));
  expect(await page.isVisible('#matchBest'), 'best time saved');

  /* 7. share link opens an import preview */
  await page.click('#tab-edit');
  await page.click('#shareBtn');
  const url = await page.inputValue('#shareUrl');
  expect(/#deck=[A-Za-z0-9_-]+$/.test(url), 'share link packs the deck in the hash');
  const wa = await page.getAttribute('#waLink', 'href');
  expect(wa.startsWith('https://wa.me/?text=') && decodeURIComponent(wa).includes(url), 'WhatsApp link contains the deck link');
  const before = (await decks()).length;
  await page.goto('about:blank');
  await page.goto(url);
  await page.waitForSelector('#importPreview:not([hidden])');
  expect(await txt('#impName') === 'Test deck', 'preview shows the deck name');
  expect(await txt('#impCount') === t('import_count', { n: '4' }), 'link carries the 4 text cards (picture card skipped)');
  expect(await page.isHidden('#impDup'), 'no duplicate warning for a new deck');
  await page.click('#importSave');
  expect((await decks()).length === before + 1, 'import saved a new deck');
  d = await curDeck();
  expect(d.cards.length === 4 && d.cards.every(c => c.box === 1), 'imported cards start in box 1');
  expect(!/#deck=/.test(page.url()), 'hash cleared after saving');
  await page.goto(url);
  await page.waitForSelector('#importPreview:not([hidden])');
  expect(await page.isVisible('#impDup'), 'opening the same link again warns about the copy');
  await page.click('#importCancel');
  expect(await page.isHidden('#importPreview') && (await decks()).length === before + 1, 'cancel adds nothing');
  await page.goto(url.split('#')[0] + '#deck=bm90LWEtZGVjaw');
  await page.waitForSelector('#badLink:not([hidden])');
  expect(await page.isHidden('#importPreview'), 'a broken link shows a message, no preview');

  /* 8. CSV export and import */
  await page.click('#tab-edit');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exportCsv')]);
  const csvOut = fs.readFileSync(await dl.path(), 'utf8');
  expect(/^﻿?front,back/.test(csvOut) && csvOut.includes('Gujarat,Gandhinagar'), 'CSV export has header and cards');
  const csv = 'front,back\n"Kerala","Thiruvananthapuram"\n"H2O, water",Formula of water\nonly-one-column\nOdisha,Bhubaneswar\n';
  const n0 = (await decks()).length;
  const [fc1] = await Promise.all([page.waitForEvent('filechooser'), page.click('#importBtn')]);
  await fc1.setFiles({ name: 'Class 7 revision.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf8') });
  await page.waitForSelector('#importPreview:not([hidden])');
  expect(await txt('#impCount') === t('import_count', { n: '3' }), 'CSV import finds 3 cards (header + bad row skipped)');
  await page.click('#importSave');
  d = await curDeck();
  expect((await decks()).length === n0 + 1 && d.name === 'Class 7 revision' && d.cards[1].f === 'H2O, water', 'CSV deck saved with quoted comma');

  /* 9. CSV with semicolons and quoted fields; a TSV with a stray quote mark */
  await page.click('#tab-edit');
  const [fc2] = await Promise.all([page.waitForEvent('filechooser'), page.click('#importBtn')]);
  await fc2.setFiles({ name: 'semi.csv', mimeType: 'text/csv', buffer: Buffer.from('front;back\n"a;b";c\nKerala;Thiruvananthapuram\n', 'utf8') });
  await page.waitForSelector('#importPreview:not([hidden])');
  let rows = await page.$$eval('#impTable tbody tr', t => t.map(r => [r.cells[1].textContent, r.cells[2].textContent]));
  expect(rows.length === 2 && rows[0][0] === 'a;b' && rows[0][1] === 'c' && rows[1][1] === 'Thiruvananthapuram', 'semicolon CSV keeps quoted fields: ' + JSON.stringify(rows));
  await page.click('#importCancel');
  const [fc3] = await Promise.all([page.waitForEvent('filechooser'), page.click('#importBtn')]);
  await fc3.setFiles({ name: 'tabs.txt', mimeType: 'text/plain', buffer: Buffer.from('Ruler\t12" long\n"Quoted"\t"x, y"\nPen\tblue\n', 'utf8') });
  await page.waitForSelector('#importPreview:not([hidden])');
  rows = await page.$$eval('#impTable tbody tr', t => t.map(r => [r.cells[1].textContent, r.cells[2].textContent]));
  expect(rows.length === 3 && rows[0][1] === '12" long' && rows[1][0] === 'Quoted' && rows[1][1] === 'x, y' && rows[2][0] === 'Pen', 'TSV: a stray quote does not swallow the next rows: ' + JSON.stringify(rows));
  await page.click('#importCancel');

  /* 10. the forgiving quiz check is never forgiving about numbers and signs */
  await page.click('#newDeck');
  await page.fill('#deckName', 'Maths check');
  await page.fill('#bulkText', "Additive inverse of 5 - -5\nThree quarters as a fraction = 3/4\nYear of India's independence = 1947\nCapital of Goa = Panaji (Panjim)\nTwo times three = 2 × 3");
  await page.click('#bulkAdd');
  await page.click('#tab-quiz');
  await page.click('#sideSeg button[data-side="b"]');
  await page.click('#qcountSeg button[data-v="0"]');
  await page.click('#startQuiz');
  const typed = { 'Additive inverse of 5': ['5', false], 'Three quarters as a fraction': ['3', false], "Year of India's independence": ['1847', false], 'Capital of Goa': ['panjim', true], 'Two times three': ['2x3', true] };
  for (let i = 0; i < 5; i++) {
    const pr = await txt('#quizPrompt');
    const [ans, ok] = typed[pr] || ['?', false];
    await page.fill('#quizInput', ans);
    await page.click('#quizCheck');
    const cls = await page.getAttribute('#quizFeedback', 'class');
    expect(cls === (ok ? 'callout success' : 'callout danger'), `“${ans}” for “${pr}” is ${ok ? 'right' : 'wrong'} (got ${cls})`);
    await page.click('#quizNext');
  }
  await page.waitForSelector('#quizResult:not([hidden])');
  expect(await txt('#quizFinal') === '2 / 5', 'maths quiz score 2 / 5, got ' + await txt('#quizFinal'));
  await page.click('#quizNew');

  /* 11. a deck of picture-only cards: the quiz shows the picture and asks for the back; no empty share link */
  await page.click('#newDeck');
  for (const name of ['Red', 'Square']) {
    const [fcp] = await Promise.all([page.waitForEvent('filechooser'), page.click('#cardImgBtn')]);
    await fcp.setFiles({ name: 'red.png', mimeType: 'image/png', buffer: png });
    await page.waitForSelector('#cardImgPrev:not([hidden])');
    await page.fill('#cardBack', name);
    await page.click('#addCard');
  }
  await page.click('#shareBtn');
  expect(await page.isHidden('#shareBox'), 'no share link for a deck with only pictures (it would be empty)');
  await page.click('#tab-quiz');
  expect(await page.getAttribute('#sideSeg button[data-side="b"]', 'aria-pressed') === 'true' && !(await page.isDisabled('#startQuiz')), 'picture deck: the quiz asks for the back');
  await page.click('#startQuiz');
  expect(await page.isVisible('#quizImg'), 'picture shown as the quiz question');
  await page.click('#quizEnd');

  /* 12. Ctrl+P (no button) still prints the open deck */
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  expect(await count('#printArea tbody tr') === 2, 'print sheet is built when the browser prints');

  /* 13. switching language mid-quiz re-renders the sample deck question */
  const firstDeck = (await decks())[0];
  await page.selectOption('#deckSel', firstDeck.id);
  await page.click('#tab-quiz');
  await page.click('#sideSeg button[data-side="b"]');
  await page.click('#startQuiz');
  const other = lang === 'en' ? 'ta' : 'en';
  const q0 = await txt('#quizPrompt');
  const want = await page.evaluate(([a, b, q]) => { const A = window.APP_CONTENT[a].decks[0].cards, B = window.APP_CONTENT[b].decks[0].cards; const i = A.findIndex(c => c[0] === q); return i < 0 ? null : B[i][0]; }, [lang, other, q0]);
  await page.evaluate((L) => EDU.setLang(L), other);
  expect(want && await txt('#quizPrompt') === want, `quiz question follows the language: "${q0}" -> "${await txt('#quizPrompt')}" (want "${want}")`);
  await page.evaluate((L) => EDU.setLang(L), lang);
  await page.click('#quizEnd');

  /* leave a flipped sample card on screen for the screenshot */
  const firstId = (await decks())[0].id;
  await page.selectOption('#deckSel', firstId);
  await page.click('#tab-study');
  await page.click('#startStudy');
  await page.click('#card');
  await page.waitForTimeout(700);
  log('ok', lang);
};
