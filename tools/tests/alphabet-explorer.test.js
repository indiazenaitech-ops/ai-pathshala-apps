/* Interaction test for Alphabet Explorer, run by tools/verify.js in en and hi.
   The browser's speech engine is replaced by a silent fake with Hindi, Tamil and English
   voices only, so "what was said, in which language" can be checked and Bengali exercises
   the no-voice path (sound hint shown in English letters). */
function installFakeSpeech() {
  const voices = [
    { name: 'Test English India', lang: 'en-IN', voiceURI: 'test-en', localService: true, default: true },
    { name: 'Test Hindi', lang: 'hi-IN', voiceURI: 'test-hi', localService: true, default: false },
    { name: 'Test Tamil', lang: 'ta-IN', voiceURI: 'test-ta', localService: true, default: false }
  ];
  window.__spoken = [];
  let cur = null, timer = null;
  const synth = {
    speaking: false, pending: false, paused: false,
    getVoices: () => voices.slice(),
    addEventListener() {}, removeEventListener() {},
    speak(u) {
      if (cur) synth.cancel();
      cur = u; synth.speaking = true;
      window.__spoken.push({ text: u.text, lang: u.lang, voice: u.voice ? u.voice.name : null, rate: u.rate });
      timer = setTimeout(() => { if (cur !== u) return; cur = null; synth.speaking = false; if (u.onend) u.onend({}); }, 40);
    },
    cancel() { clearTimeout(timer); const u = cur; cur = null; synth.speaking = false; if (u && u.onerror) u.onerror({ error: 'interrupted' }); },
    pause() {}, resume() {}
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true });
  window.SpeechSynthesisUtterance = function (text) { this.text = text; this.lang = ''; this.voice = null; this.rate = 1; this.pitch = 1; };
}

module.exports = async function ({ page, lang, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const spoken = () => page.evaluate(() => window.__spoken.slice());
  const count = (sel) => page.$$eval(sel, (e) => e.length);
  const pressed = (sel) => page.getAttribute(sel, 'aria-pressed');

  await page.addInitScript(installFakeSpeech);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.EDU_READY && document.querySelectorAll('#script-bar .sc-btn').length === 11);

  /* 1) Devanagari is the default for en/hi, with the standard Hindi letter sets */
  expect(await pressed('#script-bar [data-script="deva"]') === 'true', 'Devanagari is selected by default');
  const nV = await count('#groups .grp[data-group="vowels"] .lt'), nC = await count('#groups .grp[data-group="consonants"] .lt');
  expect(nV === 11 && nC === 33, 'Hindi has 11 vowels and 33 consonants, got ' + nV + '/' + nC);
  expect(await txt('#big-ch') === 'अ', 'big card starts with अ');
  await page.waitForFunction(() => document.querySelector('#voice-status').dataset.voice === 'ok', null, { timeout: 5000 });
  expect(await txt('#voice-status') === '🔊 ' + t('voice_ok', { lang: t('ln_hi') }), 'Hindi voice reported ready: ' + await txt('#voice-status'));

  /* 2) Tapping ख shows it big with its picture word and says the letter, then the word, in Hindi */
  await page.evaluate(() => { window.__spoken = []; });
  await page.click('#groups .lt[data-ch="ख"]');
  expect(await txt('#big-ch') === 'ख', 'big letter is ख');
  expect(await txt('#big-word') === 'खरगोश' && await txt('#big-emoji') === '🐰', 'example word खरगोश 🐰');
  expect(await page.$eval('#big-word mark', (m) => m.textContent) === 'ख', 'the letter is highlighted inside the word');
  expect(await txt('#big-pos') === t('letter_of', { i: '13', n: '54' }), 'position: letter 13 of 54, got ' + await txt('#big-pos'));
  await page.waitForFunction(() => window.__spoken.length >= 2, null, { timeout: 5000 });
  let sp = await spoken();
  expect(sp[0].text === 'ख' && sp[0].lang === 'hi-IN' && sp[0].voice === 'Test Hindi' && sp[1].text === 'खरगोश',
    'letter then word spoken with the Hindi voice: ' + JSON.stringify(sp));
  await page.click('#big-next');
  expect(await txt('#big-ch') === 'ग' && await page.getAttribute('#groups .lt[data-ch="ग"]', 'aria-current') === 'true', 'Next moves to ग and marks it in the grid');

  /* 3) Tamil: 12 uyir + 18 mei letters; mei letters show how they join a vowel and are said as "ik" */
  await page.click('#script-bar [data-script="taml"]');
  expect(await count('#groups .grp[data-group="vowels"] .lt') === 12 && await count('#groups .grp[data-group="consonants"] .lt') === 18, 'Tamil 12 vowels + 18 consonants');
  await page.evaluate(() => { window.__spoken = []; });
  await page.click('#groups .lt[data-ch="க்"]');
  expect(await txt('#tam-join') === 'க் + அ = க', 'Tamil join shown: ' + await txt('#tam-join'));
  expect(await txt('#big-word') === 'தக்காளி' && await page.$eval('#big-word mark', (m) => m.textContent) === 'க்', 'தக்காளி with the pulli letter க் highlighted');
  await page.waitForFunction(() => window.__spoken.length >= 1);
  sp = await spoken();
  expect(sp[0].text === 'இக்' && sp[0].lang === 'ta-IN', 'mei letter spoken as இக் with the Tamil voice: ' + JSON.stringify(sp[0]));

  /* 3b) Gurmukhi: the vowel carrier ੳ is highlighted as ਉ inside its picture word ਉੱਲੂ */
  await page.click('#script-bar [data-script="guru"]');
  await page.click('#groups .lt[data-ch="ੳ"]');
  expect(await txt('#big-word') === 'ਉੱਲੂ' && await page.$eval('#big-word mark', (m) => m.textContent).catch(() => '') === 'ਉੱ', 'ੳ highlighted as ਉ in ਉੱਲੂ');
  await page.click('#script-bar [data-script="taml"]');

  /* 4) Vowel signs: uyirmei row for க, then for ம, and the full 18-row chart */
  await page.click('#tab-signs');
  expect(await page.isVisible('#panel-signs') && await txt('#tab-signs-lbl') === t('tab_signs'), 'signs tab open');
  let syl = await page.$$eval('#sign-row .sg', (b) => b.map((x) => x.dataset.syl));
  expect(syl.length === 12 && syl[0] === 'க' && syl[1] === 'கா' && syl[2] === 'கி' && syl[10] === 'கோ', 'க row: ' + syl.join(' '));
  await page.click('#base-bar button[data-base="ம"]');
  syl = await page.$$eval('#sign-row .sg', (b) => b.map((x) => x.dataset.syl));
  expect(syl[0] === 'ம' && syl[1] === 'மா' && syl[11] === 'மௌ', 'ம row: ' + syl.join(' '));
  expect(await txt('#sign-row .sg:nth-child(2) .ro') === 'mā', 'sound guide mā');
  await page.click('#chart-box summary');
  await page.waitForFunction(() => document.querySelectorAll('#chart tbody tr').length > 0, null, { timeout: 3000 });
  expect(await count('#chart tbody tr') === 18 && await count('#chart tbody tr:first-child td') === 13, 'full chart: 18 rows × (1 + 12) cells');

  /* 5) Urdu: 39 letters, aerab tab, joining forms built with ZWJ, non-joining letters flagged */
  await page.click('#script-bar [data-script="arab"]');
  expect(await txt('#tab-signs-lbl') === t('tab_aerab') && await page.isVisible('#forms-box'), 'Urdu shows aerab + letter-shapes table');
  syl = await page.$$eval('#sign-row .sg', (b) => b.map((x) => x.dataset.syl));
  expect(syl.length === 7 && syl[0] === 'بَ' && syl[3] === 'با' && syl[6] === 'بے', 'aerab row for ب: ' + syl.join(' '));
  await page.click('#tab-letters');
  expect(await count('#groups .grp[data-group="letters"] .lt') === 39, 'Urdu has 39 letters');
  expect(await page.getAttribute('#groups .lt-auto', 'dir') === 'rtl', 'Urdu letters run right to left');
  await page.click('#groups .lt[data-ch="ب"]');
  const forms = await page.$$eval('#big-forms .fx', (f) => f.map((x) => x.textContent));
  expect(forms.join('|') === ['ب', 'ب‍', '‍ب‍', '‍ب'].join('|'), 'four forms of ب');
  expect(await page.isHidden('#forms-note'), 'ب joins the next letter');
  await page.click('#groups .lt[data-ch="ر"]');
  expect(await page.isVisible('#forms-note') && await txt('#forms-note') === t('no_join'), 'ر is marked as non-joining');

  /* 6) Tracing: drawing covers part of the letter, scribbling everywhere is flagged, Clear resets */
  await page.click('#script-bar [data-script="deva"]');
  await page.click('#tab-trace');
  await page.waitForFunction(() => document.querySelector('#trace-stage').dataset.letter);
  await page.evaluate(() => document.querySelector('#trace-stage').scrollIntoView({ block: 'center' }));   /* mouse events only reach what is on screen */
  const box = await page.locator('#trace-canvas').boundingBox();
  expect(box && box.width > 200 && Math.abs(box.width - box.height) < 2, 'square tracing canvas: ' + JSON.stringify(box));
  /* the faint letter is centred and fills ~3/4 of the canvas (measureText reported a phantom descent, so it used to sit high and small) */
  const ink = await page.evaluate(() => {
    const cv = document.querySelector('#trace-canvas'), g = cv.getContext('2d'), W = cv.width, H = cv.height, chk = document.querySelector('#trace-guide');
    chk.checked = false; chk.dispatchEvent(new Event('change'));
    const a = g.getImageData(0, 0, W, H).data;
    chk.checked = true; chk.dispatchEvent(new Event('change'));
    const b = g.getImageData(0, 0, W, H).data;
    let x0 = W, x1 = -1, y0 = H, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * 4; if (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 30) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    return { cx: (x0 + x1) / 2 / W, cy: (y0 + y1) / 2 / H, fill: Math.max((x1 - x0) / W / 0.78, (y1 - y0) / H / 0.74) };
  });
  expect(Math.abs(ink.cx - 0.5) < 0.03 && Math.abs(ink.cy - 0.5) < 0.03 && ink.fill > 0.92 && ink.fill < 1.08, 'faint letter centred and big: ' + JSON.stringify(ink));
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5, { steps: 12 });
  await page.mouse.up();
  let cover = +(await page.getAttribute('#trace-stage', 'data-cover'));
  expect(cover > 0 && cover < 90 && await page.getAttribute('#trace-stage', 'data-strokes') === '1', 'one stroke covers part of the letter: ' + cover + '%');
  expect(await txt('#cover-txt') === t('cover', { p: String(cover) }), 'coverage text shown');
  for (let y = 0.04; y < 1; y += 0.035) {
    await page.mouse.move(box.x + 4, box.y + box.height * y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 4, box.y + box.height * y, { steps: 4 });
    await page.mouse.up();
  }
  cover = +(await page.getAttribute('#trace-stage', 'data-cover'));
  expect(cover >= 90 && await txt('#trace-msg') === t('trace_neat'), 'scribbling everywhere covers the letter but asks to stay on the lines: ' + cover + '% ' + await txt('#trace-msg'));
  await page.click('#trace-clear');
  expect(await page.getAttribute('#trace-stage', 'data-cover') === '0' && await txt('#trace-msg') === t('trace_start'), 'Clear resets the tracing');
  const before = await page.getAttribute('#trace-stage', 'data-letter');
  await page.click('#trace-next');
  expect(before === 'अ' && await page.getAttribute('#trace-stage', 'data-letter') === 'आ', 'Next goes from अ to आ');
  /* a score from one script must not show on another script's letter */
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5, { steps: 8 });
  await page.mouse.up();
  expect(+(await page.getAttribute('#trace-stage', 'data-cover')) > 0, 'stroke on आ scores');
  await page.click('#script-bar [data-script="knda"]');
  expect(await page.getAttribute('#trace-stage', 'data-cover') === '0' && await txt('#cover-txt') === t('cover', { p: '0' }) && await txt('#trace-msg') === t('trace_start'),
    'switching script clears the old coverage: ' + await txt('#cover-txt'));
  /* full screen takes the canvas and its buttons (Clear / Next stay usable on a smartboard) */
  await page.click('#trace-fs');
  await page.waitForTimeout(300);
  const fsId = await page.evaluate(() => document.fullscreenElement && document.fullscreenElement.id);
  if (fsId !== null) {
    expect(fsId === 'trace-wrap' && await page.isVisible('#trace-next'), 'trace full screen includes the buttons: ' + fsId);
    await page.click('#trace-next');
    expect(await page.getAttribute('#trace-stage', 'data-letter') === 'ಆ', 'Next works in full screen');
    await page.evaluate(() => EDU.fullscreen());
    await page.waitForTimeout(200);
  }
  /* printable worksheet: model / outline / faint / empty box per letter, rows never split across pages */
  await page.evaluate(() => { window.print = () => { window.__printed = document.body.dataset.print; }; });
  await page.click('#sheet-print');
  expect(await page.evaluate(() => window.__printed) === 'sheet' && await count('#print-sheet .sheet-cell') === 13 * 4, 'worksheet for the 13 Kannada vowels');
  await page.emulateMedia({ media: 'print' });
  const pr = await page.evaluate(() => ({ cell: getComputedStyle(document.querySelector('#print-sheet .sheet-cell')).breakInside, sheet: getComputedStyle(document.querySelector('#print-sheet')).display, pick: getComputedStyle(document.querySelector('.ae-pick')).display }));
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => { delete document.body.dataset.print; });
  expect(pr.cell === 'avoid' && pr.sheet === 'block' && pr.pick === 'none', 'print shows only the worksheet, rows kept whole: ' + JSON.stringify(pr));

  /* 7) Listen & tap with Bengali (no Bengali voice): the sound hint is shown in English letters */
  await page.click('#script-bar [data-script="beng"]');
  await page.waitForFunction(() => document.querySelector('#voice-status').dataset.voice === 'none', null, { timeout: 5000 });
  await page.click('#tab-game');
  await page.click('#game-start');
  await page.waitForFunction(() => document.querySelector('#game-q').dataset.round === '1');
  let ans = await page.getAttribute('#game-q', 'data-answer');
  const roman = await page.evaluate((a) => window.AE_DATA.scripts.beng.L[a].split('|')[0], ans);
  expect(await txt('#game-hint') === roman && await txt('#game-ask') === t('find_this'), 'hint "' + roman + '" shown for ' + ans);
  expect(await count('#game-opts .gopt') === 4 && await count('#game-opts .gopt[data-ch="' + ans + '"]') === 1, '4 choices including the answer');
  await page.click('#game-opts .gopt[data-ch="' + ans + '"]');
  expect(await txt('#game-score') === t('score_n', { s: '1' }), 'correct tap scores 1');
  await page.waitForFunction(() => document.querySelector('#game-q').dataset.round === '2', null, { timeout: 5000 });
  ans = await page.getAttribute('#game-q', 'data-answer');
  await page.click('#game-opts .gopt:not([data-ch="' + ans + '"])');
  expect(await txt('#game-score') === t('score_n', { s: '1' }), 'wrong tap does not score');
  expect((await txt('#game-fb')).includes(ans), 'feedback shows the right letter');
  /* Bengali জ and য are both "jô" (and ই/ঈ, শ/ষ/স sound alike): a round never offers two letters that sound like the answer */
  const sameSoundOpts = () => page.evaluate(() => {
    const s = window.AE_DATA.scripts.beng, ans = document.querySelector('#game-q').dataset.answer;
    const grp = {}; String(s.same).split('|').forEach((g, k) => g.split(' ').forEach((c) => { grp[c] = k + 1; }));
    const ro = (c) => s.L[c].split('|')[0];
    return [...document.querySelectorAll('#game-opts .gopt')].map((b) => b.dataset.ch)
      .filter((c) => c !== ans && (ro(c) === ro(ans) || (grp[c] && grp[c] === grp[ans])));
  });
  let clash = await sameSoundOpts();
  for (let r = 3; r <= 10; r++) {
    await page.waitForFunction((n) => document.querySelector('#game-q').dataset.round === String(n), r, { timeout: 6000 });
    clash = clash.concat(await sameSoundOpts());
    ans = await page.getAttribute('#game-q', 'data-answer');
    await page.click('#game-opts .gopt[data-ch="' + ans + '"]');
  }
  expect(clash.length === 0, 'no same-sounding distractors: ' + clash.join(' '));
  await page.waitForSelector('#game-end:not([hidden])', { timeout: 6000 });
  expect(await page.getAttribute('#game-end', 'data-score') === '9', 'final score 9 / 10');
  expect(await txt('#game-best') === '🏆 ' + t('best', { b: '9', n: '10' }), 'best score saved: ' + await txt('#game-best'));
  /* the end card follows a language change (it used to stay in the old language) */
  const other = lang === 'hi' ? 'ta' : 'hi';
  await page.evaluate((l) => EDU.setLang(l), other);
  const wantEnd = await page.evaluate((l) => { const S = window.APP_STRINGS[l]; return S.game_over.replace('{s}', '9').replace('{n}', '10') + ' ' + S.cheer_hi; }, other);
  const gotEnd = await txt('#end-msg');
  await page.evaluate((l) => EDU.setLang(l), lang);
  expect(gotEnd === wantEnd, 'end message re-rendered in ' + other + ': ' + gotEnd);
  expect(await pressed('#script-bar [data-script="beng"]') === 'true', 'a picked script stays when the language changes');

  /* deterministic same-sound check: vowels only, 6 choices, shuffles that keep the order.
     Rounds 3-6 ask ই ঈ উ ঊ; before the fix their look-alike partner was always among the choices. */
  await page.click('#pool-seg button[data-pool="vowels"]');
  await page.click('#n-seg button[data-n="6"]');
  await page.evaluate(() => { window.__rnd = Math.random; Math.random = () => 0.999; });
  await page.click('#game-start');
  const asked = [];
  for (let r = 1; r <= 6; r++) {
    await page.waitForFunction((n) => document.querySelector('#game-q').dataset.round === String(n), r, { timeout: 6000 });
    ans = await page.getAttribute('#game-q', 'data-answer');
    asked.push(ans);
    if (r >= 3) clash = clash.concat(await sameSoundOpts());
    expect(await count('#game-opts .gopt') === 6, '6 choices in round ' + r);
    await page.click('#game-opts .gopt[data-ch="' + ans + '"]');
  }
  await page.evaluate(() => { Math.random = window.__rnd; });
  expect(asked.slice(2).join(' ') === 'ই ঈ উ ঊ' && clash.length === 0, 'ই ঈ উ ঊ asked without their partner: ' + asked.join(' ') + ' / ' + clash.join(' '));

  /* 8) Choices survive a reload */
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.EDU_READY && document.querySelectorAll('#script-bar .sc-btn').length === 11);
  expect(await pressed('#script-bar [data-script="beng"]') === 'true' && await page.getAttribute('#tab-game', 'aria-selected') === 'true', 'script and tab restored');
  expect(await txt('#game-best') === '🏆 ' + t('best', { b: '9', n: '10' }), 'best score restored');
  expect(await pressed('#pool-seg button[data-pool="vowels"]') === 'true' && await pressed('#n-seg button[data-n="6"]') === 'true', 'game options restored');

  /* 9) Reset goes back to the defaults */
  await page.click('#reset-btn');
  await page.waitForTimeout(150);
  expect(await pressed('#script-bar [data-script="deva"]') === 'true' && await page.isVisible('#panel-letters') && await txt('#big-ch') === 'अ', 'reset: Devanagari letters, first letter');
  expect(await txt('#game-best') === '', 'reset clears the best score');

  /* 10) Damaged saved data (old version, hand-edited) must not stop the app: it used to crash on load */
  await page.evaluate(() => {
    const p = 'edu.alphabet-explorer.';
    localStorage.setItem(p + 'script', '"constructor"'); localStorage.setItem(p + 'sel', '5'); localStorage.setItem(p + 'best', '"x"');
    localStorage.setItem(p + 'traceIdx', '[1,2]'); localStorage.setItem(p + 'base', 'true'); localStorage.setItem(p + 'pool', '7');
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.EDU_READY && document.querySelectorAll('#script-bar .sc-btn').length === 11, null, { timeout: 5000 });
  await page.click('#groups .lt[data-ch="ग"]');
  expect(await pressed('#script-bar [data-script="deva"]') === 'true' && await txt('#big-ch') === 'ग' && await txt('#game-best') === '', 'damaged storage ignored, app works');
  await page.click('#tab-game');
  await page.click('#game-start');
  await page.waitForFunction(() => document.querySelector('#game-q').dataset.round === '1');
  await page.click('#tab-letters');

  await page.click('#groups .lt[data-ch="म"]');
  await page.evaluate(() => window.scrollTo(0, 0));
  log('spoken', (await spoken()).length);
};
