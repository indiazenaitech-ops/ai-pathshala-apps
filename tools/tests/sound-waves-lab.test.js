/* Interaction test for Sound & Waves Lab (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, log }) {
  const dv = async (sel, a) => Number(await page.getAttribute(sel, a || 'data-value'));
  const setNum = async (sel, v) => { await page.fill(sel, String(v)); await page.press(sel, 'Enter'); };

  await page.waitForSelector('#r-wavelength[data-value]');

  /* 1. Tone: 440 Hz in air → λ = 343 / 440 ≈ 0.78 m, T ≈ 2.27 ms, note A4 */
  await setNum('#freq-num', 440);
  const lam = await dv('#r-wavelength');
  expect(Math.abs(lam - 0.7795) < 0.001, '440 Hz → wavelength ≈ 0.78 m, got ' + lam);
  expect(Math.abs(await dv('#r-period') - 2.273) < 0.01, 'T = 1/440 s ≈ 2.27 ms');
  expect((await page.textContent('#r-note')).trim() === 'A4', 'nearest note of 440 Hz is A4');
  await page.selectOption('#medium', '5960');
  expect(Math.abs(await dv('#r-wavelength') - 5960 / 440) < 0.01, 'in steel λ = 5960/440 ≈ 13.5 m');
  await page.selectOption('#medium', '343');
  await setNum('#freq-num', 99999);
  expect((await page.inputValue('#freq-num')) === '20000', 'frequency is capped at 20,000 Hz');
  await setNum('#freq-num', 440);
  await page.click('#tone-play');
  expect(await page.getAttribute('#tone-play', 'aria-pressed') === 'true', 'tone starts on button press');
  await page.waitForTimeout(300);
  await page.click('#tone-play');
  expect(await page.getAttribute('#tone-play', 'aria-pressed') === 'false', 'tone stops again');

  /* 2. Beats: 440 + 444 Hz → 4 beats per second */
  await page.click('#tab-beats');
  await setNum('#b1-num', 440);
  await setNum('#b2-num', 444);
  expect(await dv('#beats-val') === 4, '440 Hz and 444 Hz give 4 beats per second, got ' + await dv('#beats-val'));
  await setNum('#b2-num', 440);
  expect(await dv('#beats-val') === 0, 'equal tones give 0 beats');

  /* 3. Echo: 172 m → t = 2 × 172 / 343 ≈ 1.00 s; 10 m is too close for a clear echo */
  await page.click('#tab-echo');
  await setNum('#echo-num', 172);
  expect(Math.abs(await dv('#echo-time') - 1.003) < 0.002, 'echo from 172 m returns after ≈ 1.00 s, got ' + await dv('#echo-time'));
  await setNum('#echo-num', 10);
  expect(await dv('#echo-time') < 0.1 && (await page.getAttribute('#echo-msg', 'class')).includes('swl-warn-txt'), '10 m → under 0.1 s, warned as reverberation');

  /* 4. Harmonics: closed pipe has only odd harmonics */
  await page.click('#tab-harm');
  await page.click('#harm-seg [data-type="closed"]');
  const ns = await page.$$eval('#harm-list button', (b) => b.map((x) => +x.dataset.n));
  expect(ns.join(',') === '1,3,5,7,9,11', 'closed pipe harmonics are 1,3,5,7,9,11, got ' + ns);

  /* 5. Quiz: 10 questions, answer 7 right and 3 wrong → 7 / 10 */
  await page.click('#tab-quiz');
  for (let i = 0; i < 10; i++) {
    const idx = Number(await page.getAttribute('#quiz-q', 'data-idx'));
    const a = await page.evaluate((k) => (window.APP_CONTENT[document.documentElement.lang] || window.APP_CONTENT.en).quiz[k].a, idx);
    const pick = i < 7 ? a : (a + 1) % 4;
    await page.click(`#quiz-opts button[data-i="${pick}"]`);
    await page.click('#quiz-next');
  }
  await page.waitForSelector('#quiz-done:not([hidden])');
  expect(await page.getAttribute('#quiz-score', 'data-score') === '7', 'quiz scored 7 / 10, got ' + await page.getAttribute('#quiz-score', 'data-score'));
  expect(/7/.test(await page.textContent('#quiz-best')), 'best score saved');
  log('sound-waves-lab ok');
};
