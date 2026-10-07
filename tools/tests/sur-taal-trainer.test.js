/* Interaction test for Sur & Taal Trainer (run by tools/verify.js in en and hi).
   verify.js gives Chrome a fake microphone (silence + short beeps), so pitch is tested on the pure detector
   with a generated sine wave, and the UI pipeline is driven through SurTaal._onPitch.
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, lang, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const attr = (sel, a) => page.getAttribute(sel, a);
  const setRange = (sel, v) => page.$eval(sel, (el, val) => { el.value = String(val); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v);
  const feed = (hz, n) => page.evaluate(([h, k]) => { for (let i = 0; i < k; i++) SurTaal._onPitch({ hz: h, confidence: 0.95 }); }, [hz, n || 6]);
  const swar = (i) => page.evaluate((i) => window.APP_CONTENT[EDU.lang].swar[i], i);

  /* ---------- pure pitch detector on a generated sine ---------- */
  const det = await page.evaluate(() => {
    const sr = 48000, n = 4096, buf = new Float32Array(n);
    const gen = (f, amp) => { for (let i = 0; i < n; i++) buf[i] = amp * Math.sin(2 * Math.PI * f * i / sr) + 0.2 * amp * Math.sin(2 * Math.PI * 2 * f * i / sr); return SurTaal.detectPitch(buf, sr); };
    const c4 = gen(261.63, 0.3), a4 = gen(440, 0.3), low = gen(110, 0.3);
    const silent = SurTaal.detectPitch(new Float32Array(n), sr);
    const sw = SurTaal.swarOf(c4.hz, 261.63), pa = SurTaal.swarOf(392, 261.63);
    return { c4: c4.hz, c4conf: c4.confidence, a4: a4.hz, low: low.hz, silent: silent.hz, c4name: SurTaal.noteName(c4.hz, 440), swIdx: sw.idx, swCents: sw.cents, paIdx: pa.idx };
  });
  log('detector', JSON.stringify(det));
  const cents = (hz, ref) => Math.abs(1200 * Math.log2(hz / ref));
  expect(cents(det.c4, 261.63) <= 10, 'C4 sine detected within 10 cents: ' + det.c4);
  expect(det.c4conf > 0.8, 'confident on a clean sine: ' + det.c4conf);
  expect(cents(det.a4, 440) <= 10, 'A4 sine detected within 10 cents: ' + det.a4);
  expect(cents(det.low, 110) <= 10, 'A2 (110 Hz) detected within 10 cents: ' + det.low);
  expect(det.silent === 0, 'silence gives hz 0');
  expect(det.c4name === 'C4', 'western name is C4: ' + det.c4name);
  expect(det.swIdx === 0 && Math.abs(det.swCents) <= 10, 'C4 with Sa = C4 is Sa');
  expect(det.paIdx === 7, '392 Hz above Sa 261.6 is Pa');

  /* ---------- scoring is a number ---------- */
  const sc = await page.evaluate(() => {
    const good = SurTaal.scoreNotes([{ hz: 261.6, start: 0, end: 1 }, { hz: 293.7, start: 1, end: 2 }], [{ t: .5, hz: 261.6, conf: 1 }, { t: .6, hz: 261.6, conf: 1 }, { t: 1.5, hz: 146.8, conf: 1 }, { t: 1.6, hz: 146.9, conf: 1 }]);
    const none = SurTaal.scoreNotes([{ hz: 261.6, start: 0, end: 1 }], []);
    return { good: good.total, n0: good.notes[0].cents, n1: good.notes[1].cents, none: none.total };
  });
  expect(typeof sc.good === 'number' && sc.good >= 95, 'perfect singing scores ~100: ' + sc.good);
  expect(Math.abs(sc.n1) <= 10, 'an octave-low Re still counts as Re: ' + sc.n1);
  expect(sc.none === 0, 'no samples → 0');

  /* ---------- tanpura: one tap ---------- */
  await page.selectOption('#st-sa', 'C4');
  await page.click('#st-drone');
  expect(await attr('#st-drone', 'aria-pressed') === 'true', 'drone button is pressed');
  expect(await txt('#st-drone-txt') === t('drone_stop'), 'drone button offers Stop');
  expect((await page.evaluate(() => SurTaal.state())).drone === true, 'drone engine running');
  await page.click('#st-drone');
  expect(await txt('#st-drone-txt') === t('drone_play'), 'drone stopped');

  /* ---------- taal metronome: Teentaal 120 bpm cycles in ~8 s ---------- */
  await page.click('#st-tab-taal');
  expect(await page.isHidden('#st-pane-sur') && !(await page.isHidden('#st-pane-taal')), 'Taal tab opens');
  await page.selectOption('#st-taalsel', 'teentaal');
  await setRange('#st-bpm', 120);
  expect(await txt('#st-bpm-val') === t('bpm_n', { n: 120 }), 'tempo label shows 120');
  expect(await txt('#st-laya') === '· ' + t('laya_madhya'), '120 is madhya laya');
  expect(await page.$$eval('#st-bols .st-bol', (b) => b.length) === 16, '16 bol cells for Teentaal');
  expect(await page.$$eval('#st-circle .bead', (b) => b.length) === 16, '16 beads on the circle');
  const t0 = Date.now();
  await page.keyboard.press('Space');                      // Space = start taal on this tab
  expect(await attr('#st-taal', 'aria-pressed') === 'true', 'Space started the taal');
  await page.waitForFunction(() => +document.querySelector('#st-circle').dataset.beat >= 3, null, { timeout: 6000 });
  const bolTxt = await txt('#st-circle .mid-bol');
  expect(bolTxt.length > 0, 'bol shown in the circle: ' + bolTxt);
  await page.waitForFunction(() => +document.querySelector('#st-circle').dataset.cycle >= 1, null, { timeout: 12000 });
  const cycleMs = Date.now() - t0;
  log('cycle ms', cycleMs);
  expect(cycleMs > 6500 && cycleMs < 11000, 'one Teentaal cycle at 120 bpm takes about 8 s (+ audio start-up): ' + cycleMs);
  const b = +(await attr('#st-circle', 'data-beat'));
  expect(await txt('#st-beat-txt') === t('beat_of', { n: b, total: 16 }), 'beat text matches the circle');
  expect(!(await page.isHidden('#st-beatpill')), 'quick strip shows the beat pill');
  await page.click('#st-taal2');
  expect(await attr('#st-taal', 'aria-pressed') === 'false', 'taal stopped from the pane button');

  /* ---------- microphone (fake device) ---------- */
  await page.click('#st-tab-sur');
  await page.click('#st-pane-sur .st-mic');
  await page.waitForSelector('#st-pane-sur .st-mic[data-mic="live"]', { timeout: 10000 });
  expect(await txt('#st-pane-sur .st-mic-txt') === t('mic_stop'), 'mic button offers Stop listening');
  await page.click('#st-pane-sur .st-mic');
  expect(await attr('#st-pane-sur .st-mic', 'data-mic') === 'idle', 'mic stopped');

  /* ---------- swar meter pipeline with simulated pitches (Sa = C4) ---------- */
  await feed(261.63, 6);
  expect(await txt('#st-swar') === await swar(0), 'C4 shows Sa in the current script');
  expect(await txt('#st-judge') === t('in_tune'), 'judge says in tune');
  expect(await attr('#st-stage', 'data-zone') === 'ok', 'stage is green');
  expect(await txt('#st-note') === 'C4', 'western note C4');
  await feed(261.63 * Math.pow(2, 1 / 12) * Math.pow(2, 30 / 1200), 6);   // komal re, 30 cents sharp
  expect(await txt('#st-judge') === t('sharp') && await attr('#st-stage', 'data-zone') === 'off', '30 cents sharp is marked off/sharp');
  expect(await page.$eval('#st-swar-tags', (e) => e.textContent.includes(window.APP_STRINGS[EDU.lang].komal)), 'komal badge shown for re');
  await feed(261.63 * 2 * Math.pow(2, -20 / 1200), 6);        // upper Sa, 20 cents flat
  expect(await txt('#st-judge') === t('flat'), 'flat shown');
  expect(await page.$eval('#st-swar-tags', (e) => e.textContent.includes(window.APP_STRINGS[EDU.lang].octave_taar)), 'taar saptak badge for upper Sa');

  /* ---------- tuner ---------- */
  await page.click('#st-tab-tuner');
  expect(await page.$$eval('#st-strings .st-tuner-str', (b) => b.length) === 6, 'guitar shows 6 strings');
  await feed(110 * Math.pow(2, 5 / 1200), 6);
  expect(await txt('#st-tnote') === 'A2', 'nearest guitar string is A2');
  expect(await attr('#st-strings .st-tuner-str[data-i="1"]', 'data-near') === '1', 'A string lights up');
  expect(await txt('#st-tjudge') === t('in_tune'), 'tuner says in tune');
  await page.click('#st-inst button[data-v="violin"]');
  expect(await page.$$eval('#st-strings .st-tuner-str', (b) => b.length) === 4, 'violin shows 4 strings');
  await page.fill('#st-a4', '442'); await page.$eval('#st-a4', (e) => e.dispatchEvent(new Event('change', { bubbles: true })));
  await page.click('#st-inst button[data-v="any"]');
  await feed(442, 6);
  expect(await txt('#st-tnote') === 'A4' && await txt('#st-tjudge') === t('in_tune'), 'A4 = 442 reference is honoured');
  await page.fill('#st-a4', '440'); await page.$eval('#st-a4', (e) => e.dispatchEvent(new Event('change', { bubbles: true })));

  /* ---------- sargam: hold the swar for 3 s ---------- */
  await page.click('#st-tab-sargam');
  await page.selectOption('#st-hold-sel', '7');               // Pa
  const paHz = 261.63 * Math.pow(2, 7 / 12);
  await page.evaluate((h) => new Promise((res) => { let k = 0; const iv = setInterval(() => { SurTaal._onPitch({ hz: h, confidence: .95 }); if (++k >= 70) { clearInterval(iv); res(); } }, 50); }), paHz);
  expect(await txt('#st-hold-status') === t('hold_done'), 'holding Pa for 3.5 s is marked done: ' + await txt('#st-hold-status'));
  expect(await attr('#st-hold-bar', 'data-done') === '1', 'hold bar full');

  /* ---------- sargam: alankar listen → sing → score ---------- */
  await page.selectOption('#st-alk', '0');
  await page.click('#st-speed button[data-v="fast"]');
  expect(await page.$$eval('#st-seq .st-cell', (c) => c.length) === 16, 'alankar 1 has 16 swars');
  await page.click('#st-alk-go');
  await page.waitForFunction(() => SurTaal.state().alk === 'listen', null, { timeout: 3000 });
  expect(await txt('#st-alk-phase') === t('alk_phase_listen'), 'listen phase shown');
  await page.click('#st-alk-go');                              // skip straight to singing
  await page.waitForFunction(() => SurTaal.state().alk === 'sing', null, { timeout: 3000 });
  expect(await txt('#st-alk-phase') === t('alk_phase_sing'), 'sing phase shown');
  // "sing" the target notes perfectly, driven by the app's own timeline
  await page.evaluate(() => new Promise((res) => {
    const T = SurTaal._alkTargets();
    const iv = setInterval(() => {
      if (SurTaal.state().alk !== 'sing') { clearInterval(iv); res(); return; }
      const rel = SurTaal._alkRel(); const cur = T.find((n) => rel >= n.start && rel < n.end);
      if (cur) SurTaal._onPitch({ hz: cur.hz, confidence: .95 });
    }, 40);
  }));
  await page.waitForFunction(() => SurTaal.state().alk === 'done', null, { timeout: 15000 });
  const score = parseInt(await txt('#st-alk-score'), 10);
  log('alankar score', score);
  expect(score >= 85, 'perfect sing-along scores high: ' + score);
  expect(await txt('#st-alk-verdict') === t('alk_good'), 'verdict is Shabash');
  expect(await page.$$eval('#st-seq .st-cell[data-grade="ok"]', (c) => c.length) >= 14, 'most cells graded green');
  expect(await txt('#st-alk-best') === t('alk_best', { n: score }), 'best score saved');

  /* ---------- settings survive a reload ---------- */
  await page.selectOption('#st-sa', 'G#3');
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(900);
  expect(await page.inputValue('#st-sa') === 'G#3', 'Sa kept after reload');
  expect(await page.inputValue('#st-bpm') === '120', 'tempo kept after reload');
  expect(await page.inputValue('#st-taalsel') === 'teentaal', 'taal kept');
  expect(await attr('#st-tab-sargam', 'aria-selected') === 'true', 'last tab kept');
  expect(await txt('#st-alk-best') === t('alk_best', { n: score }), 'best score kept after reload');

  /* ---------- Urdu RTL re-render ---------- */
  await page.evaluate(() => EDU.setLang('ur'));
  await page.waitForTimeout(500);
  const ur = await page.evaluate(() => [document.documentElement.dir, document.querySelector('#st-bpm-val').textContent.trim() === window.APP_STRINGS.ur.bpm_n.replace('{n}', '120'), document.querySelector('#st-hold-sel option').textContent.trim() === window.APP_CONTENT.ur.swar[0]]);
  expect(ur[0] === 'rtl' && ur[1] && ur[2], 'Urdu re-renders dynamic labels: ' + ur.join());
  await page.evaluate((L) => EDU.setLang(L), lang);
  await page.waitForTimeout(300);

  /* ---------- reset ---------- */
  await page.$eval('#st-reset', (b) => { b.closest('details').open = true; });
  await page.click('#st-reset');                               // confirm() auto-accepted
  expect(await page.inputValue('#st-sa') === 'C#3' && await page.inputValue('#st-bpm') === '80', 'reset restores defaults');

  /* leave the Taal tab playing for the screenshot */
  await page.click('#st-tab-taal');
  await page.click('#st-taal2');
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
};
