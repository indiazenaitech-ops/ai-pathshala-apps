/* Interaction test for Read Aloud, run by tools/verify.js in en and hi.
   The browser's speech engine is replaced by a silent, deterministic fake that fires
   word-boundary events like a real voice, so highlighting, pause/resume and echo mode
   can be checked exactly (and verify runs make no sound). */
function installFakeSpeech() {
  const voices = [
    { name: 'Test English India', lang: 'en-IN', voiceURI: 'test-en-in', localService: true, default: true },
    { name: 'Test English US', lang: 'en-US', voiceURI: 'test-en-us', localService: true, default: false },
    { name: 'Test Hindi', lang: 'hi-IN', voiceURI: 'test-hi', localService: true, default: false },
    { name: 'Test Tamil', lang: 'ta-IN', voiceURI: 'test-ta', localService: true, default: false }
  ];
  window.__spoken = [];
  window.__ttsStep = 40;
  let cur = null, timers = [];
  const synth = {
    speaking: false, pending: false, paused: false, onvoiceschanged: null,
    getVoices: () => voices.slice(),
    addEventListener() {}, removeEventListener() {},
    speak(u) {
      if (cur) synth.cancel();
      cur = u; synth.speaking = true;
      window.__spoken.push({ text: u.text, lang: u.lang, voice: u.voice ? u.voice.name : null, rate: u.rate, pitch: u.pitch });
      const words = [...String(u.text).matchAll(/\S+/g)];
      const step = window.__ttsStep;
      timers.push(setTimeout(() => { if (cur === u && u.onstart) u.onstart({}); }, 2));
      words.forEach((m, i) => timers.push(setTimeout(() => {
        if (cur === u && u.onboundary) u.onboundary({ name: 'word', charIndex: m.index, charLength: m[0].length });
      }, 5 + i * step)));
      timers.push(setTimeout(() => {
        if (cur !== u) return;
        cur = null; synth.speaking = false;
        if (u.onend) u.onend({});
      }, 15 + words.length * step));
    },
    cancel() {
      timers.forEach(clearTimeout); timers = [];
      const u = cur; cur = null; synth.speaking = false;
      if (u && u.onerror) u.onerror({ error: 'interrupted' });
    },
    pause() {}, resume() {}
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true });
  window.SpeechSynthesisUtterance = function (text) { this.text = text; this.lang = ''; this.voice = null; this.rate = 1; this.pitch = 1; this.volume = 1; };
}

module.exports = async function ({ page, lang, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const attr = (sel, a) => page.getAttribute(sel, a);
  const spoken = () => page.evaluate(() => window.__spoken.slice());
  const state = () => attr('#status', 'data-state');
  const waitState = (s, ms) => page.waitForFunction((x) => document.querySelector('#status').dataset.state === x, s, { timeout: ms || 8000 });
  const setRange = (sel, v) => page.$eval(sel, (e, val) => { e.value = String(val); e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  const fillText = async (s, sentences) => {
    await page.fill('#text', s);
    await page.waitForFunction(([want, n]) => document.querySelector('#counts').dataset.s === String(n) &&
      document.querySelector('#reader').textContent.replace(/\s+/g, ' ').trim() === want, [s.replace(/\s+/g, ' ').trim(), sentences], { timeout: 5000 });
  };

  await page.addInitScript(installFakeSpeech);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.EDU_READY && document.querySelectorAll('#reader .s').length > 0);
  await page.waitForFunction(() => document.querySelectorAll('#voice-sel option').length > 1, null, { timeout: 5000 });

  /* 1) A sample in the page language is ready to read, with the right language and voice */
  const nSample = await page.$$eval('#reader .s', (e) => e.length);
  expect(nSample === 6, 'first sample passage has 6 sentences, got ' + nSample);
  expect(await attr('#reader', 'data-lang') === lang, 'sample is detected as ' + lang + ', got ' + await attr('#reader', 'data-lang'));
  const voiceOpts = await page.$$eval('#voice-sel option', (os) => os.map((o) => o.value));
  expect(voiceOpts.includes(lang === 'hi' ? 'test-hi' : 'test-en-in'), 'voice list is filtered by language: ' + voiceOpts.join(','));
  expect(!voiceOpts.includes('test-ta'), 'Tamil voice is not offered for ' + lang + ' text');
  expect(await txt('#status') === t('st_ready'), 'status says ready');
  expect(await page.$eval('#sample-btns .chip', (b) => b.getAttribute('aria-pressed')) === 'true', 'first sample chip is selected');

  /* 2) Own text: sentences and words are counted, English detected */
  await fillText('Ravi has a red kite. The kite flies high! Can you see it?', 3);
  expect(await attr('#counts', 'data-w') === '13', '13 words expected, got ' + await attr('#counts', 'data-w'));
  expect(await page.$$eval('#reader .w', (e) => e.length) === 13, '13 clickable words in the reading view');
  expect(await attr('#reader', 'data-lang') === 'en', 'English text detected as en');
  expect(await txt('#counts') === t('counts', { w: '13', s: '3' }), 'counts line is translated: ' + await txt('#counts'));

  /* 2b) Sentence rules: units end a sentence before a capital, "Rs." does not, "..." joins its sentence */
  await fillText('The road is 10 km. We paid Rs. 50 for it... ... Really?', 3);
  const sents = await page.$$eval('#reader .s', (e) => e.map((x) => x.textContent));
  expect(JSON.stringify(sents) === JSON.stringify(['The road is 10 km.', 'We paid Rs. 50 for it... ...', 'Really?']),
    'sentence split: ' + JSON.stringify(sents));
  expect(await attr('#counts', 'data-w') === '12', 'punctuation is not counted as words, got ' + await attr('#counts', 'data-w'));

  /* 2c) Empty text: Play / Space explain instead of pretending to finish */
  await page.click('#clear-btn');
  await page.waitForFunction(() => document.querySelector('#counts').dataset.s === '0');
  expect(await page.$eval('#play-btn', (b) => b.disabled), 'Play is disabled with no text');
  expect(await page.isVisible('#reader .reader-empty'), 'empty reading view shows a hint');
  await page.evaluate(() => { window.__spoken = []; document.activeElement && document.activeElement.blur(); });
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  expect(await state() === 'idle' && (await spoken()).length === 0, 'Space on empty text stays idle, got ' + await state());

  /* 2d) Typed text is kept even when the page is reloaded straight away */
  await page.fill('#text', 'Typed just now.');
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.EDU_READY && document.querySelectorAll('#reader .s').length > 0);
  expect(await page.inputValue('#text') === 'Typed just now.', 'text typed right before a reload survives: ' + await page.inputValue('#text'));
  await page.waitForFunction(() => document.querySelectorAll('#voice-sel option').length > 1, null, { timeout: 5000 });
  await fillText('Ravi has a red kite. The kite flies high! Can you see it?', 3);

  /* 3) Play reads every sentence in order, lighting up each word */
  await page.evaluate(() => {
    window.__spoken = []; window.__lit = [];
    new MutationObserver((ms) => ms.forEach((m) => {
      const n = m.target;
      if (n.classList && n.classList.contains('w') && n.classList.contains('on')) window.__lit.push(n.textContent);
    })).observe(document.getElementById('reader'), { subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  await page.click('#play-btn');
  await waitState('done');
  let sp = await spoken();
  expect(JSON.stringify(sp.map((x) => x.text)) === JSON.stringify(['Ravi has a red kite.', 'The kite flies high!', 'Can you see it?']),
    'three sentences spoken in order: ' + JSON.stringify(sp.map((x) => x.text)));
  expect(sp[0].voice === 'Test English India' && sp[0].lang === 'en-IN', 'Indian English voice preferred, got ' + sp[0].voice);
  expect(sp[0].rate === 1, 'default speed is 1');
  const lit = await page.evaluate(() => window.__lit.slice());
  expect(lit.length >= 13 && lit[0] === 'Ravi' && lit.includes('flies') && lit[lit.length - 1] === 'it?', 'each word lit in turn: ' + lit.join(' '));
  expect(await txt('#status') === '🎉 ' + t('st_done'), 'status says finished');
  expect(await page.$$eval('#reader .w.on, #reader .s.cur', (e) => e.length) === 0, 'highlights cleared at the end');

  /* 3b) A long passage in big letters: every word being read stays on screen (the view follows it) */
  await page.click('#sample-btns .chip[data-idx="0"]');
  await setRange('#font', 44);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    window.__ttsStep = 8; window.__vis = { ok: 0, off: [] };
    new MutationObserver(() => {
      const w = document.querySelector('#reader .w.on'); if (!w) return;
      const r = w.getBoundingClientRect(), head = document.querySelector('.edu-top').getBoundingClientRect().bottom;
      if (r.top >= head - 1 && r.bottom <= innerHeight + 1) window.__vis.ok++; else window.__vis.off.push(w.textContent + '@' + Math.round(r.top));
    }).observe(document.getElementById('reader'), { subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  await page.click('#play-btn');
  await waitState('done', 15000);
  const vis = await page.evaluate(() => window.__vis);
  expect(vis.ok > 30 && vis.off.length === 0, 'words read off-screen: ' + vis.off.slice(0, 5).join(' ') + ' (on screen: ' + vis.ok + ')');
  await page.evaluate(() => { window.__ttsStep = 40; });
  await setRange('#font', 30);
  await fillText('Ravi has a red kite. The kite flies high! Can you see it?', 3);

  /* 4) Speed setting + tap a word to hear only that word (punctuation removed) */
  await setRange('#rate', 0.7);
  expect(await txt('#rate-out') === '0.70×', 'speed label shows 0.70×, got ' + await txt('#rate-out'));
  await page.click('#reader .w[data-s="0"][data-w="4"]');
  await page.waitForTimeout(150);
  sp = await spoken();
  expect(sp[sp.length - 1].text === 'kite' && sp[sp.length - 1].rate === 0.7, 'tapping "kite." speaks just "kite" at 0.7: ' + JSON.stringify(sp[sp.length - 1]));
  await page.click('#reader .w[data-s="2"][data-w="3"]');
  await page.waitForTimeout(150);
  sp = await spoken();
  expect(sp[sp.length - 1].text === 'it', 'tapping "it?" speaks "it"');

  /* 5) Pause keeps the place; resume continues from the paused word */
  await setRange('#rate', 1);
  if (!(await page.$eval('#stop-btn', (b) => b.disabled))) await page.click('#stop-btn');
  expect(await state() === 'idle', 'stopped before the pause test');
  await page.evaluate(() => { window.__ttsStep = 250; window.__spoken = []; });
  await page.click('#play-btn');
  await page.waitForFunction(() => { const w = document.querySelector('#reader .w.on'); return w && +w.dataset.w >= 2; }, null, { timeout: 5000 });
  await page.click('#play-btn');                                   // pause
  expect(await state() === 'paused', 'state is paused');
  expect(await txt('#status') === t('st_paused', { i: '1', n: '3' }), 'status: paused at sentence 1 of 3, got ' + await txt('#status'));
  expect(await txt('#play-lbl') === t('b_resume'), 'play button offers Resume');
  const pausedWord = await page.$eval('#reader .w.on', (w) => +w.dataset.w);
  await page.evaluate(() => { window.__ttsStep = 40; });
  await page.click('#play-btn');                                   // resume
  await page.waitForTimeout(100);
  sp = await spoken();
  const words0 = ['Ravi', 'has', 'a', 'red', 'kite.'];
  const expectResume = words0.slice(pausedWord).join(' ');
  expect(sp[sp.length - 1].text === expectResume, 'resume continues from word ' + pausedWord + ': "' + sp[sp.length - 1].text + '" vs "' + expectResume + '"');
  await waitState('done');
  sp = await spoken();
  expect(sp[sp.length - 1].text === 'Can you see it?', 'reading continued to the end after resume');

  /* 6) Echo reading: speak one sentence, wait for the child, continue on Next */
  await page.click('#echo-btn');
  expect(await attr('#echo-btn', 'aria-pressed') === 'true', 'echo mode switched on');
  await page.click('#wait-seg button[data-wait="tap"]');
  await page.evaluate(() => { window.__spoken = []; });
  await page.click('#play-btn');
  await waitState('echo');
  expect(await page.isVisible('#echo-box'), 'the "your turn" box is shown');
  const box = await page.$eval('#echo-box', (e) => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: innerHeight }; });
  expect(box.top >= 0 && box.bottom <= box.h, 'the "your turn" box is on screen, not below the fold: ' + JSON.stringify(box));
  expect(await txt('#status') === t('st_echo', { i: '1', n: '3' }), 'status: your turn for sentence 1 of 3');
  await page.waitForTimeout(700);
  expect((await spoken()).length === 1, 'voice waits for the child before the next sentence');
  await page.click('#repeat-btn');
  await waitState('echo');
  sp = await spoken();
  expect(sp.length === 2 && sp[1].text === 'Ravi has a red kite.', 'Again repeats the same sentence');
  await page.click('#echo-next');
  await page.waitForFunction(() => window.__spoken.length === 3 && document.querySelector('#status').dataset.state === 'echo', null, { timeout: 5000 });
  sp = await spoken();
  expect(sp[2].text === 'The kite flies high!', 'Next moves on to sentence 2');
  await page.click('#stop-btn');
  expect(await state() === 'idle' && !(await page.isVisible('#echo-box')), 'stop ends echo mode wait');
  await page.click('#echo-btn');

  /* 7) Script detection picks the language and voice; Marathi falls back to a Hindi voice */
  await fillText('राम स्कूल जाता है। वह रोज़ पढ़ता है।', 2);
  expect(await attr('#reader', 'data-lang') === 'hi', 'Devanagari + Hindi words → hi');
  await page.evaluate(() => { window.__spoken = []; });
  await page.click('#play-btn');
  await waitState('done');
  sp = await spoken();
  expect(sp.length === 2 && sp[0].voice === 'Test Hindi' && sp[0].text === 'राम स्कूल जाता है।', 'Hindi read with the Hindi voice, split at ।: ' + JSON.stringify(sp[0]));

  await fillText('मी शाळेत जातो. आज खूप पाऊस आहे.', 2);
  expect(await attr('#reader', 'data-lang') === 'mr', 'Marathi words → mr');
  expect(await attr('#voice-note', 'data-kind') === 'fallback' && await page.isVisible('#voice-note'), 'fallback note shown for Marathi');
  expect(await txt('#voice-note') === t('nv_fallback', { lang: t('lang_mr'), other: t('lang_hi') }), 'fallback note is translated');

  /* 8) No voice for Bengali: clear help, nothing spoken until "Try anyway" */
  await fillText('আমি স্কুলে যাই। আজ বৃষ্টি হচ্ছে।', 2);
  expect(await attr('#reader', 'data-lang') === 'bn', 'Bengali script → bn');
  expect(await attr('#voice-note', 'data-kind') === 'none', 'no-voice help shown');
  expect(await txt('#nv-title') === t('nv_title', { lang: t('lang_bn') }), 'no-voice title names Bengali');
  expect(await page.$$eval('#voice-note li', (l) => l.length) >= 1, 'install steps listed');
  await page.evaluate(() => { window.__spoken = []; });
  await page.click('#play-btn');
  await page.waitForTimeout(200);
  expect((await spoken()).length === 0 && await state() === 'idle', 'nothing is spoken without a Bengali voice');
  await page.click('#nv-try');
  await page.waitForTimeout(150);
  sp = await spoken();
  expect(sp.length >= 1 && sp[0].lang === 'bn-IN' && sp[0].voice === null, '"Try anyway" speaks with the bn-IN language tag: ' + JSON.stringify(sp[0]));
  await page.click('#stop-btn');

  /* 9) "Read as" override: kept while editing text in the same script, back to Auto for another script */
  await page.selectOption('#read-as', 'hi');
  expect(await attr('#reader', 'data-lang') === 'hi' && await page.isHidden('#voice-note'), 'Read as Hindi uses the Hindi voice, note hidden');
  await fillText('আমি স্কুলে যাই। আজ বৃষ্টি হচ্ছে। খুব মজা।', 3);
  expect(await page.inputValue('#read-as') === 'hi', 'Read as stays while the same text is edited');
  await fillText('Ravi has a red kite. The kite flies high! Can you see it?', 3);
  expect(await page.inputValue('#read-as') === 'auto' && await attr('#reader', 'data-lang') === 'en', 'text in another script goes back to Auto: ' + await page.inputValue('#read-as'));

  /* 9b) A voice of another language picked from the full list stays selected in the short list */
  await page.check('#all-voices');
  await page.selectOption('#voice-sel', 'test-hi');
  await page.uncheck('#all-voices');
  expect(await page.inputValue('#voice-sel') === 'test-hi', 'chosen Hindi voice still shown for English text, got "' + await page.inputValue('#voice-sel') + '"');
  await page.evaluate(() => { window.__spoken = []; });
  await page.click('#reader .w[data-s="0"][data-w="0"]');
  await page.waitForTimeout(150);
  sp = await spoken();
  expect(sp.length === 1 && sp[0].voice === 'Test Hindi', 'the chosen voice is used: ' + JSON.stringify(sp[0]));
  await page.selectOption('#voice-sel', '');
  expect(await page.inputValue('#voice-sel') === '' && await page.$$eval('#voice-sel option', (o) => o.length) === 3, 'back to the best voice: only English voices listed');

  /* 9c) Full screen button says how to leave full screen */
  await page.click('#fs-btn');
  await page.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 3000 }).catch(() => { });
  if (await page.evaluate(() => !!document.fullscreenElement)) {
    await page.waitForFunction((x) => document.querySelector('#fs-lbl').textContent === x, t('exit_fs'), { timeout: 3000 }).catch(() => { });
    expect(await txt('#fs-lbl') === t('exit_fs'), 'full screen button now says ' + t('exit_fs') + ', got ' + await txt('#fs-lbl'));
    await page.click('#fs-btn');
    await page.waitForFunction(() => !document.fullscreenElement, null, { timeout: 3000 });
  }
  await page.waitForFunction((x) => document.querySelector('#fs-lbl').textContent === x, t('fullscreen'), { timeout: 3000 }).catch(() => { });
  expect(await txt('#fs-lbl') === t('fullscreen'), 'full screen button label restored');

  /* 10) Look settings, samples in another language, and persistence */
  await setRange('#font', 40);
  expect(await page.$eval('#reader', (r) => getComputedStyle(r).fontSize) === '40px', 'text size slider sets 40px');
  await page.click('#hl-seg button[data-hl="sentence"]');
  expect(await page.$eval('#reader', (r) => r.classList.contains('hl-sentence')), 'sentence highlight mode on');
  await page.selectOption('#sample-lang', 'ta');
  await page.click('#sample-btns .chip[data-idx="1"]');
  const taText = await page.evaluate(() => window.APP_CONTENT.ta.samples[1].text);
  expect(await page.inputValue('#text') === taText, 'Tamil sample 2 loaded');
  expect(await attr('#reader', 'data-lang') === 'ta', 'Tamil sample detected as ta');
  expect(await page.$eval('#voice-sel', (s) => s.options.length) === 2, 'Tamil voice offered for Tamil text');

  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.EDU_READY && document.querySelectorAll('#reader .s').length > 0);
  expect(await page.inputValue('#text') === taText, 'text survives a reload');
  expect(await page.inputValue('#font') === '40', 'text size survives a reload');
  expect(await attr('#hl-seg button[data-hl="sentence"]', 'aria-pressed') === 'true', 'highlight mode survives a reload');

  /* 11) Reset brings back the defaults and the first sample in the page language */
  await page.click('#reset-btn');                                  // confirm() is auto-accepted
  await page.waitForTimeout(200);
  const first = await page.evaluate((l) => window.APP_CONTENT[l].samples[0].text, lang);
  expect(await page.inputValue('#text') === first, 'reset loads the first sample again');
  expect(await page.inputValue('#rate') === '1', 'reset restores speed 1');
  expect(await attr('#hl-seg button[data-hl="word"]', 'aria-pressed') === 'true', 'reset restores word highlight');

  /* 12) Urdu page: the untouched sample follows the language, reads right-to-left, Back/Next icons are mirrored */
  await page.evaluate(() => EDU.setLang('ur'));
  await page.waitForFunction(() => document.querySelector('#reader').dataset.lang === 'ur');
  const urText = await page.evaluate(() => window.APP_CONTENT.ur.samples[0].text);
  expect(await page.inputValue('#text') === urText && await attr('#reader', 'dir') === 'rtl', 'Urdu sample shown right-to-left');
  expect(await page.$eval('#next-btn .ic', (e) => getComputedStyle(e).transform) !== 'none', 'Next icon points left in Urdu');
  const urReady = await page.evaluate(() => window.APP_STRINGS.ur.st_ready);
  expect(await txt('#status') === urReady, 'status re-rendered in Urdu: ' + await txt('#status'));
  await page.evaluate((l) => EDU.setLang(l), lang);
  await page.waitForFunction((l) => document.querySelector('#reader').dataset.lang === l, lang);
  expect(await page.inputValue('#text') === first, 'sample switches back with the page language');
  expect(await page.$eval('#next-btn .ic', (e) => getComputedStyle(e).transform) === 'none', 'Next icon normal again');

  /* leave a paused reading on screen for the screenshot */
  await page.evaluate(() => { window.__ttsStep = 300; });
  await page.click('#reader .w[data-s="1"][data-w="0"]');
  await page.click('#tap-seg button[data-tap="from"]');
  await page.click('#reader .w[data-s="1"][data-w="2"]');
  await page.waitForFunction(() => { const w = document.querySelector('#reader .w.on'); return w && w.dataset.s === '1' && +w.dataset.w >= 3; }, null, { timeout: 5000 });
  await page.click('#play-btn');
  expect(await state() === 'paused', 'paused mid-sentence for the screenshot');
  expect(await txt('#status') === t('st_paused', { i: '2', n: '6' }), 'status: paused at sentence 2 of 6');
  await page.evaluate(() => window.scrollTo(0, 0));
  log('spoken total', (await spoken()).length);
};
