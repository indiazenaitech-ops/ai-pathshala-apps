/* Interaction test for Typing Tutor (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const num = async (sel) => +((await txt(sel)).replace(/[^\d]/g, '') || NaN);
  const nextKeys = () => page.$$eval('#kbd .key.next', (els) => els.map((e) => e.dataset.k).sort().join(','));

  /* ---------------- lesson list ---------------- */
  const count = (await page.$$('#lesson-list [data-lesson]')).length;
  expect(count === 18, '18 lessons are listed, got ' + count);
  const groups = (await page.$$('#lesson-list .tt-stage')).length;
  expect(groups === 5, 'lessons are grouped under 5 headings, got ' + groups);
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

  /* ---------------- own-language keyboards: letters typed in parts, danda / Urdu signs from the plain keyboard ---------------- */
  await page.click('#tab-lang');
  const typeParts = (code, idx, prep) => page.evaluate(([code, idx, prep]) => {
    const sel = document.querySelector('#lang-sel');
    sel.value = code; sel.dispatchEvent(new Event('change'));
    document.querySelector(`#passages [data-idx="${idx}"]`).click();
    let s = APP_CONTENT[code].passages[idx].text.normalize('NFD');   /* worst case: every vowel sign in two steps */
    if (prep === 'pipe') s = s.replace(/।/g, '|');
    if (prep === 'dot') s = s.replace(/۔/g, '.').replace(/،/g, ',');
    if (prep === 'zwj') s = APP_CONTENT[code].passages[idx].text.replace(/[ൺൻർൽൾ]/g, (c) => ({ 'ൺ': 'ണ്‍', 'ൻ': 'ന്‍', 'ർ': 'ര്‍', 'ൽ': 'ല്‍', 'ൾ': 'ള്‍' })[c]);
    const ta = document.querySelector('#typein');
    let v = '', maxErr = 0;
    for (const c of Array.from(s)) {
      v += c; ta.value = v; ta.dispatchEvent(new Event('input'));
      maxErr = Math.max(maxErr, +document.querySelector('#st-err').textContent);
      if (ta.disabled) break;
    }
    const r = { done: ta.disabled, maxErr, err: document.querySelector('#res-err').textContent, msg: document.querySelector('#res-msg').textContent };
    document.querySelector('#back').click();
    return r;
  }, [code, idx, prep]);
  for (const [code, idx, prep] of [['ta', 1, ''], ['ml', 1, ''], ['kn', 2, ''], ['bn', 2, ''], ['hi', 0, 'pipe'], ['ur', 2, 'dot'], ['ml', 0, 'zwj']]) {
    const r = await typeParts(code, idx, prep);
    expect(r.done && r.maxErr === 0, `${code} passage ${idx} typed letter by letter (${prep || 'vowel signs in two parts'}) has no false mistakes: ` + JSON.stringify(r));
  }
  const r2 = await typeParts('hi', 1, '');
  expect(r2.msg === t('res_msg_good'), 'own-language result does not suggest a time limit (there is none there): ' + r2.msg);

  /* ---------------- free practice: Indian-language text, signs not on the keyboard, time limit ---------------- */
  await page.click('#tab-free');
  await page.fill('#free-text', 'हम सब भारत के लोग हैं।');
  await page.click('#free-start');
  expect(await page.isHidden('#kb-area') && await page.isVisible('#lang-note'), 'a Hindi free-practice text hides the English keyboard and shows the keyboard tips');
  expect(await txt('#st-speed-lbl') === t('speed_cpm'), 'a Hindi free-practice text is measured in characters per minute');
  await page.click('#back');
  await page.fill('#free-text', 'Pay ₹50 now');
  await page.click('#free-start');
  await page.focus('#typein');
  await page.keyboard.type('Pay ');
  expect((await txt('#hint')).includes(t('hint_nokey')), 'the hint says ₹ is not on the English keyboard');
  await page.keyboard.type('x50 now');
  await page.waitForSelector('#result', { state: 'visible', timeout: 10000 });
  expect(await num('#res-err') === 0 && await num('#res-acc') === 100, '₹ is skipped with any key, no mistake: ' + await txt('#res-err'));
  await page.click('#back');
  await page.click('#limit button[data-limit="60"]');
  await page.fill('#free-text', 'A computer helps us write and learn.');
  await page.click('#free-start');
  expect(await txt('#st-time-lbl') === t('time_left') && await txt('#st-time') === '1:00', 'a 1 minute limit counts down from 1:00');
  await page.focus('#typein');
  await page.keyboard.type('A comp');
  await page.evaluate(() => { window.__realNow = Date.now; Date.now = () => window.__realNow() + 61000; });
  await page.waitForSelector('#result', { state: 'visible', timeout: 5000 });
  await page.evaluate(() => { Date.now = window.__realNow; });
  expect(await txt('#res-title') === t('res_time_up'), 'the run stops when the minute is over');
  expect(await txt('#st-time-lbl') === t('time') && await txt('#st-time') === '1:00', 'after the time is up the stat reads "Time 1:00", not "Time left": ' + await txt('#st-time-lbl'));
  expect(await page.getAttribute('#res-detail', 'data-correct') === '6', '6 characters were typed before the time ran out');
  await page.click('#back');
  await page.click('#limit button[data-limit="0"]');

  /* ---------------- phone keyboards that compose whole words still count a fixed mistake ---------------- */
  await page.click('#tab-lessons');
  await page.click('#lesson-list [data-lesson="l3"]');
  const comp = await page.evaluate(() => {
    const ta = document.querySelector('#typein'), T = document.querySelector('#target').dataset.text;
    const fire = (type) => ta.dispatchEvent(new CompositionEvent(type, { data: '' }));
    const set = (v) => { ta.value = v; ta.dispatchEvent(new InputEvent('input', { isComposing: true })); };
    fire('compositionstart'); set('x'); set(''); set(T[0]); fire('compositionend');
    return +document.querySelector('#st-err').textContent;
  });
  expect(comp === 1, 'a wrong letter fixed inside a phone-keyboard word still counts as 1 mistake, got ' + comp);

  /* ---------------- damaged saved data does not break the progress page ---------------- */
  await page.evaluate(() => { localStorage.setItem('edu.typing-tutor.hist', '[null, 5, "x", {"mode":"lang","ref":"zz","idx":9,"speed":40,"acc":90}]'); localStorage.setItem('edu.typing-tutor.prog', '"bad"'); localStorage.setItem('edu.typing-tutor.tab', '"progress"'); });
  await page.reload();
  await page.waitForSelector('#panel-progress', { state: 'visible' });
  expect((await page.$$('#hist-table tbody tr')).length === 1, 'only the 1 well-formed history row is shown after damaged storage');
  await page.click('#reset-progress');

  /* ---------------- leave lesson 7 open half-way (keyboard + hands show in the screenshot) ---------------- */
  await page.click('#tab-lessons');
  expect(await page.getAttribute('#continue', 'data-lesson') === 'l1', 'after reset, Continue points at lesson 1 again');
  await page.click('#lesson-list [data-lesson="l7"]');
  await page.waitForSelector('#trainer', { state: 'visible' });
  expect((await page.getAttribute('#target', 'data-text')).startsWith('e i r u'), 'lesson 7 starts with its first text after reset');
  await page.focus('#typein');
  await page.keyboard.type('e i r ');
  expect(await nextKeys() === 'u', 'U is highlighted next, got ' + await nextKeys());
  expect(await page.$eval('#hands .finger.on', (e) => e.dataset.f) === 'R2', 'right index finger is highlighted for U');
  expect(await txt('#st-err') === '0', 'no mistakes so far in lesson 7');
  log('lesson1 chars', L, 'acc', expAcc, 'tamil graphemes', info.n);
};
