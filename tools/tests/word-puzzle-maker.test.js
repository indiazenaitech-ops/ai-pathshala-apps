/* Interaction test for Word Puzzle Maker, run by tools/verify.js in en and hi.
   Core promise: every word the app says it placed can really be read in the printed grid at the recorded
   position, for English, Hindi and Tamil lists, and no matra is ever cut away from its consonant. */
module.exports = async function ({ page, lang, expect, t, log }) {
  const clean = s => s.normalize('NFC').replace(/[^\p{L}\p{M}\p{N}‌‍]/gu, '').toUpperCase();
  const setWords = async (text) => { await page.fill('#words', text); await page.waitForTimeout(220); };
  const LISTS = {
    en: ['ELEPHANT', 'TIGER', 'PEACOCK', 'MANGO', 'LOTUS', 'BANYAN', 'RIVER', 'ice cream'],
    hi: ['विद्यालय', 'पुस्तक', 'अध्यापक', 'कक्षा', 'प्रश्न', 'उत्तर', 'क्रिकेट', 'क्षत्रिय', 'हिंदी', 'ज़िंदगी'],
    ta: ['பள்ளிக்கூடம்', 'ஆசிரியர்', 'புத்தகம்', 'மாணவன்', 'தமிழ்', 'கணிதம்', 'அறிவியல்', 'விளையாட்டு']
  };
  const ALLOWED = [
    ['0,1', '1,0'],
    ['0,1', '1,0', '1,1', '-1,1'],
    ['0,1', '1,0', '1,1', '-1,1', '0,-1', '-1,0', '-1,-1', '1,-1']
  ];

  const readSearch = () => page.evaluate(() => {
    const p = window.WPM_APP.puzzle(), cells = {}, key = {};
    document.querySelectorAll('#sheet .ws-grid .cell').forEach(c => { cells[c.dataset.r + ',' + c.dataset.c] = c.textContent; });
    document.querySelectorAll('#sheet-key .ws-grid .cell').forEach(c => { key[c.dataset.r + ',' + c.dataset.c] = { text: c.textContent, hit: c.classList.contains('hit') }; });
    return { size: p.size, level: p.level, placed: p.placed, tooLong: p.tooLong, unplaced: p.unplaced, cells, key,
      dir: document.querySelector('#sheet .ws-grid').getAttribute('dir'), listed: [...document.querySelectorAll('#sheet .wlist li')].map(li => li.textContent) };
  });

  /* every placed word is readable in the DOM grid at its recorded position */
  const checkSearch = (s, words, label) => {
    expect(Object.keys(s.cells).length === s.size * s.size, `${label}: grid has ${Object.keys(s.cells).length} cells, expected ${s.size * s.size}`);
    for (const k of Object.keys(s.cells)) {
      expect(s.cells[k].length > 0 && !/^[\p{M}‌‍]/u.test(s.cells[k]), `${label}: cell ${k} is empty or starts with a matra: "${s.cells[k]}"`);
    }
    expect(s.placed.length === words.length, `${label}: placed ${s.placed.length} of ${words.length} words (unplaced: ${s.unplaced.concat(s.tooLong).join(', ')})`);
    const want = new Set(words.map(clean)), hits = new Set();
    for (const p of s.placed) {
      expect(ALLOWED[s.level].includes(p.dr + ',' + p.dc), `${label}: "${p.word}" uses direction ${p.dr},${p.dc}, not allowed at level ${s.level}`);
      let read = '';
      for (let i = 0; i < p.cells.length; i++) {
        const k = (p.r + p.dr * i) + ',' + (p.c + p.dc * i);
        expect(k in s.cells, `${label}: "${p.word}" runs outside the grid at ${k}`);
        expect(s.cells[k] === p.cells[i], `${label}: "${p.word}" cell ${i} is "${s.cells[k]}" in the grid, expected "${p.cells[i]}"`);
        expect(s.key[k] && s.key[k].hit && s.key[k].text === p.cells[i], `${label}: answer key does not highlight "${p.word}" at ${k}`);
        read += s.cells[k]; hits.add(k);
      }
      expect(want.has(read), `${label}: grid reads "${read}" where "${p.word}" should be`);
      want.delete(read);
    }
    expect(want.size === 0, `${label}: words not found in the grid: ${[...want].join(', ')}`);
    const keyHits = Object.keys(s.key).filter(k => s.key[k].hit).length;
    expect(keyHits === hits.size, `${label}: answer key highlights ${keyHits} cells, expected ${hits.size}`);
    expect(s.listed.length === words.length, `${label}: word list shows ${s.listed.length} words, expected ${words.length}`);
  };

  /* 0. opens with a sample in the interface language */
  const first = await readSearch();
  const sample = await page.evaluate((L) => window.APP_CONTENT[L].words.map(w => w[0]), lang);
  checkSearch(first, sample, 'sample');
  expect((await page.inputValue('#words')).includes(sample[0]), 'textarea shows the sample list in the interface language');
  expect((await page.textContent('#status-count')).trim() === t('status_placed', { n: String(sample.length), m: String(sample.length) }), 'status reports all sample words placed');

  /* 1. akshara splitting: matras and conjuncts stay in one cell, with and without Intl.Segmenter */
  const splits = await page.evaluate(() => {
    const f = (w, o) => window.WPM.split(window.WPM.clean(w), o).join('|');
    return ['विद्यालय', 'क्षत्रिय', 'ज़िंदगी', 'பள்ளிக்கூடம்', 'বৃষ্টি', 'చంద్రుడు', 'کِتاب', 'ice cream'].map(w => [f(w), f(w, { noSegmenter: true })]);
  });
  const wantSplits = ['वि|द्या|ल|य', 'क्ष|त्रि|य', 'ज़िं|द|गी', 'ப|ள்|ளி|க்|கூ|ட|ம்', 'বৃ|ষ্টি', 'చం|ద్రు|డు', 'کِ|ت|ا|ب', 'I|C|E|C|R|E|A|M'];
  splits.forEach((pair, i) => {
    expect(pair[0] === wantSplits[i], `split ${i}: got ${pair[0]}, expected ${wantSplits[i]}`);
    expect(pair[1] === wantSplits[i], `fallback split ${i}: got ${pair[1]}, expected ${wantSplits[i]}`);
  });

  /* 2. English, Hindi and Tamil lists at every level */
  for (const L of ['en', 'hi', 'ta']) {
    await setWords(LISTS[L].join('\n'));
    for (const level of [0, 1, 2]) {
      await page.click(`#level button[data-level="${level}"]`);
      const s = await readSearch();
      expect(s.level === level, `level button ${level} applied`);
      expect(s.dir === 'ltr', `${L}: grid runs left to right`);
      checkSearch(s, LISTS[L], `${L} level ${level}`);
    }
  }

  /* 3. "New arrangement" reshuffles, and the same seed gives the same puzzle */
  const before = await page.evaluate(() => document.querySelector('#sheet .ws-grid').textContent);
  await page.click('#btn-new');
  const after = await readSearch();
  checkSearch(after, LISTS.ta, 'after new arrangement');
  expect(Object.values(after.cells).join('') !== before, 'New arrangement changes the grid');
  const same = await page.evaluate(() => {
    const p = window.WPM.parse('MANGO\nLOTUS\nTIGER\nRIVER'), g = s => JSON.stringify(window.WPM.makeSearch(p, { seed: s, level: 2 }).grid);
    return [g(5) === g(5), g(5) !== g(6)];
  });
  expect(same[0] && same[1], 'seeded shuffle: same seed same grid, new seed new grid');

  /* 4. Urdu grid runs right to left */
  await setWords('سورج\nچاند\nکتاب\nاسکول');
  const ur = await readSearch();
  expect(ur.dir === 'rtl', 'Urdu grid is right-to-left');
  checkSearch(ur, ['سورج', 'چاند', 'کتاب', 'اسکول'], 'ur');

  /* 5. duplicates, one-letter words and words longer than the grid */
  await page.click('#level button[data-level="0"]');
  await page.click('#size button[data-size="8"]');
  await setWords('TIGER\ntiger\n Tiger \nEXTRAORDINARY\nMANGO\nA\n\n   \nLOTUS');
  const edge = await readSearch();
  expect(edge.size === 8, 'grid size 8 applied');
  checkSearch(edge, ['TIGER', 'MANGO', 'LOTUS'], 'edge');
  expect(edge.tooLong.join() === 'EXTRAORDINARY', 'the 13-letter word is reported as too long for an 8 grid');
  const statusText = await page.textContent('#status');
  expect(statusText.includes('EXTRAORDINARY') && statusText.includes('TIGER, TIGER'), 'status names the left-out and repeated words');
  expect(statusText.includes(t('status_placed', { n: '3', m: '4' })), 'status says 3 of 4 words placed');
  await page.click('#size button[data-size="0"]');
  checkSearch(await readSearch(), ['TIGER', 'MANGO', 'LOTUS', 'EXTRAORDINARY'], 'auto size');

  /* 6. crossword: interlocking grid, numbered clues, filled answer key */
  const readCross = () => page.evaluate(() => {
    const p = window.WPM_APP.puzzle(), key = {}, nums = {};
    document.querySelectorAll('#sheet-key .cw-cell').forEach(c => { key[c.dataset.r + ',' + c.dataset.c] = (c.querySelector('.ch') || {}).textContent || ''; });
    document.querySelectorAll('#sheet .cw-cell').forEach(c => { const n = c.querySelector('.num'); nums[c.dataset.r + ',' + c.dataset.c] = n ? n.textContent : ''; });
    return { placed: p.placed, loose: p.loose, unplaced: p.unplaced, groups: p.groups, key, nums,
      lettersInPuzzle: document.querySelectorAll('#sheet .cw-cell .ch').length,
      across: [...document.querySelectorAll('#sheet .clue-col[data-dir="across"] li')].map(li => li.textContent),
      down: [...document.querySelectorAll('#sheet .clue-col[data-dir="down"] li')].map(li => li.textContent) };
  });
  const checkCross = (c, words, label) => {
    expect(c.placed.length === words.length, `${label}: crossword placed ${c.placed.length} of ${words.length}`);
    const covered = new Set();
    for (const p of c.placed) {
      let read = '';
      for (let i = 0; i < p.cells.length; i++) { const k = (p.r + p.dr * i) + ',' + (p.c + p.dc * i); read += c.key[k] === undefined ? '?' : c.key[k]; covered.add(k); }
      expect(read === clean(p.word), `${label}: crossword key reads "${read}" where "${p.word}" should be`);
      expect(c.nums[p.r + ',' + p.c] === String(p.num), `${label}: "${p.word}" starts at a cell numbered "${c.nums[p.r + ',' + p.c]}", expected ${p.num}`);
    }
    expect(covered.size === Object.keys(c.key).length, `${label}: ${Object.keys(c.key).length} boxes drawn but words cover ${covered.size}`);
    expect(c.lettersInPuzzle === 0, `${label}: the puzzle page must not show the answers`);
    expect(c.across.length + c.down.length === words.length, `${label}: ${c.across.length + c.down.length} clues for ${words.length} words`);
  };
  await page.click('#tab-cross');
  await setWords('ELEPHANT : The biggest land animal\nTIGER : Our national animal\nPEACOCK : Our national bird\nMANGO : King of fruits\nLOTUS : Our national flower\nGANGA : A holy river\nQQQ : A word with no shared letter');
  const cw = await readCross();
  checkCross(cw, ['ELEPHANT', 'TIGER', 'PEACOCK', 'MANGO', 'LOTUS', 'GANGA', 'QQQ'], 'en crossword');
  expect(cw.loose.join() === 'QQQ' && cw.groups === 2, 'the word with no shared letter stands alone and is reported: ' + cw.loose.join());
  expect((await page.textContent('#status')).includes('QQQ'), 'status names the word that does not connect');
  expect(cw.across.length > 0 && cw.down.length > 0, 'crossword has both Across and Down words');
  expect(cw.across.concat(cw.down).some(x => x.includes('King of fruits') && x.includes('(5)')), 'clue shows its text and letter count');
  await setWords(LISTS.hi.map((w, i) => w + ' : संकेत ' + (i + 1)).join('\n'));
  checkCross(await readCross(), LISTS.hi, 'hi crossword');
  await setWords(LISTS.ta.join('\n'));
  checkCross(await readCross(), LISTS.ta, 'ta crossword');

  /* 7. word scramble: same aksharas in a new order, boxes on the puzzle, word on the key */
  await page.click('#tab-scramble');
  await setWords(LISTS.hi.join('\n'));
  const sc = await page.evaluate(() => ({
    items: window.WPM_APP.puzzle().items,
    rows: [...document.querySelectorAll('#sheet .sc-row')].map(r => ({ j: r.querySelector('.sc-j').textContent, boxes: r.querySelectorAll('.sc-box').length, filled: r.querySelector('.sc-boxes').textContent })),
    key: [...document.querySelectorAll('#sheet-key .sc-row')].map(r => r.querySelector('.sc-boxes').textContent)
  }));
  expect(sc.items.length === LISTS.hi.length && sc.rows.length === LISTS.hi.length, 'scramble has one row per word');
  sc.items.forEach((it, i) => {
    expect(it.jumbled.slice().sort().join('|') === it.cells.slice().sort().join('|'), `scramble "${it.word}" keeps the same aksharas`);
    if (new Set(it.cells).size > 1) expect(it.jumbled.join('|') !== it.cells.join('|'), `scramble "${it.word}" is really mixed up`);
    expect(sc.rows[i].j === it.jumbled.join(' ') && sc.rows[i].boxes === it.cells.length && sc.rows[i].filled === '', `scramble row ${i} shows the jumble and ${it.cells.length} empty boxes`);
    expect(sc.key[i] === it.key, `scramble key row ${i} spells the word`);
  });

  /* 8. answer-key switch, empty list, and the list survives a reload */
  await page.uncheck('#opt-key');
  expect(await page.isHidden('#sheet-key'), 'answer key page hidden when switched off');
  await page.check('#opt-key');
  await page.click('#btn-clear');
  expect(await page.isHidden('#sheet') && await page.isDisabled('#btn-print'), 'no sheet and no print with an empty list');
  expect((await page.textContent('#status')).includes(t('empty')), 'empty list shows a friendly message');
  await page.click('#tab-search');
  await setWords(LISTS.en.join('\n'));
  await page.fill('#title', 'Animals & Plants');
  await page.reload();
  await page.waitForTimeout(600);
  expect((await page.inputValue('#words')) === LISTS.en.join('\n') && (await page.inputValue('#title')) === 'Animals & Plants', 'words and title are saved on the device');
  checkSearch(await readSearch(), LISTS.en, 'after reload');
  expect((await page.textContent('#sheet .sh-title')) === 'Animals & Plants', 'sheet shows the title');
  log('word search, crossword and scramble verified for en/hi/ta lists');
};
