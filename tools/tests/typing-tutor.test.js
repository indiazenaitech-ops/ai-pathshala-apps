/* Interaction test for Typing Tutor (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const num = async (sel) => +((await txt(sel)).replace(/[^\d]/g, '') || NaN);
  const nextKeys = () => page.$$eval('#kbd .key.next', (els) => els.map((e) => e.dataset.k).sort().join(','));

  /* ---------------- lesson list ---------------- */
  const count = (await page.$$('#lesson-list [data-lesson]')).length;
  expect(count === 18, '18 lessons are listed, got ' + count);
  expect(await page.getAttribute('#continue', 'data-lesson') === 'l1', 'Continue button points at lesson 1');

  /* ---------------- lesson 1 with one mistake ---------------- */
  await page.click('#lesson-list [data-lesson="l1"]');
  await page.waitForSelector('#trainer', { state: 'visible' });
  const text = await page.getAttribute('#target', 'data-text');
  expect(/^f j /.test(text), 'lesson 1 starts with the home keys: ' + text);
  expect(await nextKeys() === 'f', 'F is highlighted as the first key, got ' + await nextKeys());
  expect(await page.$eval('#hands .finger.on', (e) => e.dataset.f) === 'L2', 'left index finger is highlighted for F');

  await page.focus('#typein');
  await page.keyboard.type(text.slice(0, 3));
  const wrong = text[3] === 'x' ? 'z' : 'x';
  await page.keyboard.type(wrong);
  expect(await txt('#st-err') === '1', 'one mistake is counted live, got ' + await txt('#st-err'));
  expect(await page.$eval('#target .ch[data-i="3"]', (e) => e.classList.contains('bad')), 'the wrong letter is marked red in the text');
  expect(await nextKeys() === 'bksp', 'Backspace is highlighted after a mistake, got ' + await nextKeys());
  await page.keyboard.press('Backspace');
  expect(!(await page.$eval('#target .ch[data-i="3"]', (e) => e.classList.contains('bad'))), 'mark disappears after Backspace');
  await page.keyboard.type(text.slice(3));
  await page.waitForSelector('#result', { state: 'visible', timeout: 10000 });
  const L = text.length, expAcc = Math.round(L / (L + 1) * 100);
  expect(await num('#res-err') === 1, 'result: 1 mistake, got ' + await txt('#res-err'));
  expect(await num('#res-acc') === expAcc, `result: accuracy ${expAcc}% (${L} of ${L + 1} key presses right), got ` + await txt('#res-acc'));
  expect(await page.getAttribute('#res-detail', 'data-correct') === String(L), 'all ' + L + ' characters correct at the end');
  expect(await page.getAttribute('#res-stars', 'data-stars') === '3', '97%+ accuracy at high speed earns 3 stars');
  expect(await num('#res-speed') > 0, 'a WPM speed is shown');
  const prog = await page.evaluate(() => EDU.store('typing-tutor').get('prog', {}));
  expect(prog.l1 && prog.l1.stars === 3 && prog.l1.tries === 1, 'lesson 1 progress is saved: ' + JSON.stringify(prog));

  await page.click('#next-lesson');
  await page.waitForFunction(() => document.querySelector('#trainer').dataset.lesson === 'l2');
  expect((await page.getAttribute('#target', 'data-text')).startsWith('d k'), 'Next lesson opens lesson 2 (D and K)');
  expect(await page.isHidden('#result'), 'result panel is hidden for the new lesson');

  /* ---------------- free practice: Shift hint, typing, easy mode ---------------- */
  await page.click('#tab-free');
  await page.fill('#free-text', 'Ram has 2 mangoes!');
  if (await page.isChecked('#easy')) await page.click('#easy');
  await page.click('#free-start');
  await page.waitForSelector('#trainer', { state: 'visible' });
  expect(await page.getAttribute('#target', 'data-text') === 'Ram has 2 mangoes!', 'free practice uses the pasted text');
  expect(await nextKeys() === 'r,shiftR', 'capital R needs right Shift + R, got ' + await nextKeys());
  await page.focus('#typein');
  await page.keyboard.type('Ram has 2 mangoes!');
  await page.waitForSelector('#result', { state: 'visible', timeout: 10000 });
  expect(await num('#res-acc') === 100 && await num('#res-err') === 0, 'perfect free practice: 100% and 0 mistakes');
  expect(await page.isHidden('#res-stars'), 'no stars in free practice');
  await page.click('#back');
  await page.click('#easy');
  await page.click('#free-start');
  expect(await page.getAttribute('#target', 'data-text') === 'ram has 2 mangoes', 'easy mode removes capitals and punctuation, got ' + await page.getAttribute('#target', 'data-text'));
  await page.click('#back');
  await page.click('#easy');

  /* ---------------- type in your language (Tamil) ---------------- */
  await page.click('#tab-lang');
  await page.selectOption('#lang-sel', 'ta');
  expect((await page.$$('#passages [data-idx]')).length === 3, 'three Tamil passages are offered');
  await page.click('#passages [data-idx="0"]');
  await page.waitForSelector('#trainer', { state: 'visible' });
  expect(await page.isHidden('#kb-area') && await page.isVisible('#lang-note'), 'language mode hides the English keyboard and shows keyboard tips');
  const info = await page.evaluate(() => {
    const s = document.querySelector('#target').dataset.text;
    const g = Array.from(new Intl.Segmenter('ta', { granularity: 'grapheme' }).segment(s), (x) => x.segment);
    const i = g.findIndex((x) => x.length > 1);
    return { s, n: g.length, i, partial: g.slice(0, i).join('') + g[i][0] };
  });
  expect(info.s === (await page.evaluate(() => APP_CONTENT.ta.passages[0].text)), 'target is the Tamil passage');
  await page.fill('#typein', info.partial);
  expect(await page.$eval(`#target .ch[data-i="${info.i}"]`, (e) => e.classList.contains('pend')), 'a half-typed Tamil letter waits (not marked wrong)');
  expect(await txt('#st-err') === '0', 'no mistake for a letter still being built');
  await page.fill('#typein', info.s);
  await page.waitForSelector('#result', { state: 'visible', timeout: 10000 });
  expect(await page.getAttribute('#res-detail', 'data-correct') === String(info.n), `all ${info.n} Tamil characters (grapheme clusters) counted correct`);
  expect(await num('#res-acc') === 100 && await num('#res-err') === 0, 'Tamil passage: 100% accuracy');
  expect(await txt('#res-speed-lbl') === t('speed_cpm'), 'speed is shown in characters per minute');

  /* ---------------- progress page + persistence + reset ---------------- */
  await page.click('#tab-progress');
  expect(await page.getAttribute('#prog-table tr[data-lesson="l1"] .tt-stars', 'data-stars') === '3', 'progress table shows 3 stars for lesson 1');
  const rows = (await page.$$('#hist-table tbody tr')).length;
  expect(rows === 3, 'recent practice lists 3 finished texts, got ' + rows);
  expect((await txt('#sum-0 b')).replace(/\s/g, '') === '1/18', 'summary: 1 of 18 lessons done, got ' + await txt('#sum-0 b'));
  await page.reload();
  await page.waitForSelector('#panel-progress', { state: 'visible' });
  expect(await page.getAttribute('#prog-table tr[data-lesson="l1"] .tt-stars', 'data-stars') === '3', 'stars survive a reload');
  await page.click('#reset-progress');
  await page.waitForFunction(() => document.querySelector('#prog-table tr[data-lesson="l1"] .tt-stars').dataset.stars === '0');
  expect((await page.$$('#hist-table tbody tr')).length === 0, 'reset clears recent practice');
  log('lesson1 chars', L, 'acc', expAcc, 'tamil graphemes', info.n);
};
