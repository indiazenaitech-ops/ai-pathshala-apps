/* Interaction test for Talk & Listen (Speech AI), run by tools/verify.js in en and hi.
   The browser's speech recognition and speech synthesis are replaced by deterministic fakes,
   so dictation, word alignment scores and text-to-speech can be checked exactly. */
function installFakes() {
  /* ---- fake SpeechRecognition: each start() plays the next script from window.__srNext ---- */
  window.__srStarts = [];
  window.__srNext = [];
  function FakeSR() {
    this.lang = ''; this.interimResults = false; this.continuous = false; this.maxAlternatives = 1;
    this.onstart = this.onresult = this.onerror = this.onend = null;
    this._timers = []; this._results = []; this._on = false;
  }
  function makeResult(alts, confs, final) {
    const r = alts.map((t, i) => ({ transcript: t, confidence: confs ? confs[i] : 0.9 }));
    r.isFinal = final;
    r.item = (i) => r[i];
    return r;
  }
  FakeSR.prototype.start = function () {
    if (this._on) throw new Error('InvalidStateError');
    this._on = true; this._results = [];
    window.__srStarts.push({ lang: this.lang, continuous: this.continuous, interim: this.interimResults, alts: this.maxAlternatives });
    const script = window.__srNext.shift() || [];
    const self = this;
    let t = 10;
    this._timers.push(setTimeout(() => { if (self.onstart) self.onstart({}); }, 5));
    script.forEach((step) => {
      t += 60;
      this._timers.push(setTimeout(() => {
        if (!self._on) return;
        if (step.error) { if (self.onerror) self.onerror({ error: step.error }); setTimeout(() => self._end(), 10); return; }
        const finals = self._results.filter((r) => r.isFinal);
        const idx = finals.length;
        const res = step.final ? makeResult(step.final, step.conf, true) : makeResult([step.interim], null, false);
        self._results = finals.concat([res]);
        const list = self._results.slice(); list.item = (i) => list[i];
        if (self.onresult) self.onresult({ resultIndex: idx, results: list });
      }, t));
    });
    if (!this.continuous) this._timers.push(setTimeout(() => self._end(), t + 60));
  };
  FakeSR.prototype._end = function () {
    if (!this._on) return;
    this._on = false;
    this._timers.forEach(clearTimeout); this._timers = [];
    if (this.onend) this.onend({});
  };
  FakeSR.prototype.stop = function () { const s = this; setTimeout(() => s._end(), 20); };
  FakeSR.prototype.abort = function () { const s = this; setTimeout(() => s._end(), 5); };
  window.SpeechRecognition = FakeSR;
  window.webkitSpeechRecognition = FakeSR;

  /* ---- fake speechSynthesis ---- */
  const voices = [
    { name: 'Test English India', lang: 'en-IN', voiceURI: 'test-en-in', localService: true, default: true },
    { name: 'Test Hindi', lang: 'hi-IN', voiceURI: 'test-hi', localService: false, default: false },
    { name: 'Test Tamil', lang: 'ta-IN', voiceURI: 'test-ta', localService: true, default: false }
  ];
  window.__spoken = [];
  let cur = null, timer = null;
  const synth = {
    speaking: false, pending: false, paused: false,
    getVoices: () => voices.slice(),
    addEventListener() {}, removeEventListener() {},
    speak(u) {
      window.__spoken.push({ text: u.text, lang: u.lang, voice: u.voice ? u.voice.name : null, rate: u.rate, pitch: u.pitch });
      cur = u; synth.speaking = true;
      timer = setTimeout(() => { if (cur !== u) return; cur = null; synth.speaking = false; if (u.onend) u.onend({}); }, 30);
    },
    cancel() { clearTimeout(timer); const u = cur; cur = null; synth.speaking = false; if (u && u.onerror) u.onerror({ error: 'interrupted' }); },
    pause() {}, resume() {}
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true });
  window.SpeechSynthesisUtterance = function (text) { this.text = text; this.lang = ''; this.voice = null; this.rate = 1; this.pitch = 1; this.volume = 1; };
}

module.exports = async function ({ page, lang, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const attr = (sel, a) => page.getAttribute(sel, a);
  const words = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));

  await page.addInitScript(installFakes);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.EDU_READY && window.SPEECH_LAB);

  const C = await page.evaluate((l) => window.APP_CONTENT[l], lang);
  const tag = lang === 'hi' ? 'hi-IN' : 'en-IN';

  /* 1) Defaults: speech language follows the page; recognition is available (fake) */
  expect(await page.inputValue('#sp-lang') === lang, 'speech language defaults to page language ' + lang);
  expect(await attr('#badge-sr', 'data-sr') === 'yes', 'speech-to-text badge says ready');
  expect(await txt('#dict-status') === t('st_idle'), 'dictation status is idle: ' + await txt('#dict-status'));
  expect(await page.isHidden('#sr-warn'), 'no "unsupported" warning when recognition exists');

  /* 2) Dictation: interim text shows live, finals are appended, alternatives listed with confidence */
  const s0 = C.sentences[0], s1 = C.sentences[1];
  const half = words(s1).slice(0, 2).join(' ');
  await page.evaluate(([a, b, h]) => {
    window.__srNext.push([
      { interim: a.split(' ').slice(0, 2).join(' ') },
      { final: [a, a + ' x'], conf: [0.93, 0.41] },
      { interim: h },
      { interim: h + ' …' },
      { final: [b, b.slice(0, -1)], conf: [0.81, 0.12] }
    ]);
  }, [s0, s1, half]);
  await page.click('#dict-mic');
  await page.waitForFunction((h) => document.querySelector('#dict-interim').textContent.includes(h), half, { timeout: 4000 });
  await page.waitForFunction((b) => document.querySelector('#dict-text').value.includes(b), s1, { timeout: 5000 });
  const st = (await page.evaluate(() => window.__srStarts))[0];
  expect(st.lang === tag && st.continuous === true && st.interim === true, 'recogniser started with ' + tag + ', continuous + interim: ' + JSON.stringify(st));
  expect(await page.inputValue('#dict-text') === s0 + ' ' + s1, 'transcript = both final sentences: ' + await page.inputValue('#dict-text'));
  const nw = words(s0 + ' ' + s1).length;
  expect(await attr('#dict-count', 'data-w') === String(nw), 'word count ' + nw + ', got ' + await attr('#dict-count', 'data-w'));
  expect(await txt('#dict-count') === t('words_chars', { w: String(nw), c: await attr('#dict-count', 'data-c') }), 'count line translated');
  const guesses = await page.$$eval('#dict-guesses li', (ls) => ls.map((l) => l.querySelector('.g-txt').textContent));
  expect(guesses.length === 2 && guesses[0] === s1, 'two guesses for the last sentence, best first: ' + JSON.stringify(guesses));
  expect((await page.$eval('#dict-guesses li .g-conf', (e) => e.textContent)) === t('confidence', { p: '81' }), 'confidence shown as 81%');
  expect(await attr('#dict-mic', 'aria-pressed') === 'true' && await txt('#dict-status') === t('st_listening'), 'mic button shows listening');
  await page.click('#dict-mic');
  await page.waitForFunction(() => document.querySelector('#dict-status').dataset.state === 'idle', null, { timeout: 3000 });
  expect(await attr('#dict-mic', 'aria-pressed') === 'false', 'stopped listening');

  /* punctuation button adds the language's full stop (। for Hindi) */
  await page.click('#dict-punct [data-p="stop"]');
  const stop = lang === 'hi' ? '।' : '.';
  expect((await page.inputValue('#dict-text')).trimEnd().endsWith(stop), 'full stop "' + stop + '" added');

  /* errors are explained in words */
  await page.evaluate(() => { window.__srNext.push([{ error: 'not-allowed' }]); });
  await page.click('#dict-mic');
  await page.waitForFunction(() => document.querySelector('#dict-status').dataset.state === 'error', null, { timeout: 3000 });
  expect(await txt('#dict-status') === t('err_not_allowed'), 'blocked-microphone message shown');

  /* 3) Text to speech: voice list filtered by language, speed setting used */
  await page.click('#tab-tts');
  expect(await page.isVisible('#panel-tts') && await page.isHidden('#panel-dict'), 'TTS tab shown');
  expect(await page.inputValue('#tts-text') === C.tts_sample, 'sample text in the speech language');
  const vopts = await page.$$eval('#tts-voice option', (os) => os.map((o) => o.value));
  expect(vopts.includes(lang === 'hi' ? 'test-hi' : 'test-en-in') && !vopts.includes('test-ta'), 'voices filtered by language: ' + vopts.join(','));
  await page.$eval('#tts-rate', (e) => { e.value = '1.5'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  expect(await txt('#tts-rate-out') === '1.5×', 'speed label 1.5×');
  await page.fill('#tts-text', s0);
  await page.evaluate(() => { window.__spoken = []; });
  await page.click('#tts-play');
  await page.waitForFunction(() => document.querySelector('#tts-status').dataset.state === 'done', null, { timeout: 3000 });
  const sp = await page.evaluate(() => window.__spoken);
  expect(sp.length === 1 && sp[0].text === s0 && sp[0].rate === 1.5 && sp[0].lang === tag, 'spoken once at 1.5× in ' + tag + ': ' + JSON.stringify(sp));

  /* 4) Pronunciation practice: one word dropped → word alignment + score */
  await page.click('#tab-prac');
  expect(await txt('#pr-target') === s0, 'first practice sentence shown');
  const w0 = words(s0), n = w0.length;
  const dropped = w0.slice(0, -1).join(' ');
  await page.evaluate(([d, s]) => { window.__srNext.push([{ final: [d, s.split(' ').slice(0, 2).join(' ')], conf: [0.8, 0.3] }]); }, [dropped, s0]);
  await page.click('#pr-mic');
  await page.waitForFunction(() => !document.querySelector('#pr-result').hidden, null, { timeout: 4000 });
  const want = Math.round(100 * (n - 1) / n);
  expect(await attr('#pr-score', 'data-score') === String(want), 'score ' + want + '% for one missed word of ' + n + ', got ' + await attr('#pr-score', 'data-score'));
  expect(await page.$$eval('#pr-align .w-ok', (e) => e.length) === n - 1, (n - 1) + ' matched words');
  expect(await page.$$eval('#pr-align .w-miss', (e) => e.length) === 1, 'one missed word');
  expect(await txt('#pr-heard') === dropped, 'best of the AI guesses is shown');
  expect(await txt('#pr-line') === t('score_line', { m: String(n - 1), n: String(n) }), 'matched line translated');
  expect((await page.evaluate(() => window.__srStarts)).pop().alts === 5, 'asks the recogniser for 5 guesses');

  /* perfect attempt → 100%, chip shows the best score */
  await page.evaluate((s) => { window.__srNext.push([{ final: [s] }]); }, s0);
  await page.click('#pr-again');
  await page.waitForFunction(() => document.querySelector('#pr-score').dataset.score === '100', null, { timeout: 4000 });
  expect(await txt('#pr-fb') === t('fb_great'), 'excellent feedback at 100%');
  expect(await txt('#pr-chips .chip[data-idx="0"] .pc') === '100%', 'chip 1 shows best 100%');

  /* 5) Listen & type: sentence hidden, typed answer with an extra word scored like WER */
  await page.click('#pr-mode [data-mode="type"]');
  await page.click('#pr-next');
  expect(await attr('#pr-target', 'data-hidden') === 'true', 'sentence hidden in Listen & type mode');
  await page.evaluate(() => { window.__spoken = []; });
  await page.click('#pr-listen');
  await page.waitForTimeout(80);
  expect((await page.evaluate(() => window.__spoken))[0].text === s1, 'Listen speaks sentence 2');
  const n1 = words(s1).length;
  await page.fill('#pr-typed', s1 + ' zzz');
  await page.click('#pr-check');
  expect(await attr('#pr-score', 'data-score') === String(Math.round(100 * (n1 - 1) / n1)), 'extra word costs one mistake');
  expect(await page.$$eval('#pr-align .w-extra', (e) => e.length) === 1, 'extra word marked');
  expect(await attr('#pr-target', 'data-hidden') === 'false' && await txt('#pr-target') === s1, 'sentence revealed after checking');
  expect(await attr('#pr-progress', 'data-done') === '2', 'two sentences practised');

  /* 6) Own sentence is added and selected */
  const own = lang === 'hi' ? 'आज मौसम बहुत सुहाना है।' : 'Today the weather is lovely.';
  await page.fill('#pr-new', own);
  await page.click('#pr-add');
  expect(await page.$$eval('#pr-chips .chip', (c) => c.length) === C.sentences.length + 1, 'own sentence added as chip 9');
  expect(await page.$$eval('#pr-own li', (l) => l.length) === 1, 'own sentence listed');

  /* 7) Persistence across reload */
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.EDU_READY && window.SPEECH_LAB);
  expect(await attr('#tab-prac', 'aria-selected') === 'true', 'practice tab remembered');
  expect(await page.$$eval('#pr-chips .chip', (c) => c.length) === C.sentences.length + 1, 'own sentence survives reload');
  expect(await attr('#pr-mode [data-mode="type"]', 'aria-pressed') === 'true', 'Listen & type mode remembered');
  expect(await txt('#pr-chips .chip[data-idx="0"] .pc') === '100%', 'best score survives reload');
  await page.click('#tab-dict');
  expect((await page.inputValue('#dict-text')).startsWith(s0), 'dictated text survives reload');

  /* 8) Changing the speech language changes the recogniser language and practice sentences */
  await page.selectOption('#sp-lang', 'ta');
  await page.evaluate(() => { window.__srNext.push([]); });
  await page.click('#dict-mic');
  await page.waitForFunction(() => window.__srStarts.length > 0 && window.__srStarts[window.__srStarts.length - 1].lang === 'ta-IN', null, { timeout: 3000 });
  await page.click('#dict-mic');
  await page.click('#tab-prac');
  await page.click('#pr-mode [data-mode="speak"]');
  const taFirst = await page.evaluate(() => window.APP_CONTENT.ta.sentences[0]);
  expect(await txt('#pr-target') === taFirst, 'Tamil practice sentence shown');
  expect(await attr('#pr-target', 'lang') === 'ta', 'target marked lang=ta');
  await page.selectOption('#sp-lang', lang);

  /* 9) How it works: the test sound draws a spectrogram */
  await page.click('#tab-how');
  await page.click('#see-demo');
  await page.waitForFunction(() => +document.querySelector('#spec').dataset.frames > 6, null, { timeout: 8000 });
  expect(await page.isHidden('#see-empty'), 'placeholder hidden while drawing');
  expect(await attr('#see-status', 'data-state') === 'demo', 'status says the demo is playing');

  /* leave a practice result on screen for the screenshot */
  await page.click('#tab-prac');
  await page.click('#pr-chips .chip[data-idx="0"]');
  await page.evaluate((s) => {
    const w = s.split(' ');
    const heard = w.slice(0, 2).concat(['xyz']).concat(w.slice(3, -1)).join(' ');
    window.__srNext.push([{ final: [heard] }]);
  }, s0);
  await page.click('#pr-mic');
  await page.waitForFunction(() => !document.querySelector('#pr-result').hidden, null, { timeout: 4000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  log('score shown', await attr('#pr-score', 'data-score'));
};
