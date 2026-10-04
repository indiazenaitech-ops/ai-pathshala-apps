/* Interaction test for Classroom Noise Meter (run by tools/verify.js in en and hi).
   verify.js starts Chrome with a fake microphone: silence with a short loud beep about every 0.5 s,
   so the smoothed level settles roughly between 25 and 75 on the 0–100 scale.
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, lang, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const numOf = async (sel) => parseFloat((await txt(sel)).replace(/[^\d.]/g, '')) || 0;
  const attr = (sel, a) => page.getAttribute(sel, a);
  const setRange = (sel, v) => page.$eval(sel, (el, val) => {
    el.value = String(val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, v);
  const secsOf = (s) => s.split(':').reduce((a, x) => a * 60 + parseFloat(x), 0);

  /* ---------- idle state ---------- */
  expect(await attr('#nm-stage', 'data-state') === 'idle', 'meter starts idle (mic off)');
  expect(await txt('#nm-face-label') === t('face_idle'), 'idle face asks to press Start');
  expect(await txt('#nm-mic-txt') === t('mic_start'), 'big button offers Start listening');
  expect(await txt('#nm-level') === '0', 'level shows 0 before listening');

  /* ---------- activity preset sets the too-loud line ---------- */
  await page.click('#nm-presets button[data-th="35"]');
  expect(await page.inputValue('#nm-threshold') === '35', 'Silent work preset sets the line to 35');
  expect(await attr('#nm-presets button[data-th="35"]', 'aria-pressed') === 'true', 'preset chip is marked as chosen');
  expect(await txt('#nm-act-val') === t('act_silent'), 'activity name shown next to the label');
  const arcR = await attr('#nm-arc-r', 'd');
  expect(/^M[\d.]+ [\d.]+ A96/.test(arcR || ''), 'gauge draws the red zone arc');
  await setRange('#nm-threshold', 95);
  expect(await txt('#nm-act-val') === t('act_custom'), 'moving the slider means a custom line');

  /* ---------- start the (fake) microphone ---------- */
  await page.click('#nm-mic');
  await page.waitForSelector('#nm-stage[data-state="live"]', { timeout: 10000 });
  expect(await txt('#nm-mic-txt') === t('mic_stop'), 'button now offers Stop listening');
  expect(await txt('#nm-status-txt') === t('st_live'), 'status says Listening');
  await page.waitForFunction(() => parseFloat(document.querySelector('#nm-level').textContent) > 5, null, { timeout: 8000 });
  const needle = await attr('#nm-needle', 'transform');
  expect(needle && !/rotate\(-90/.test(needle), 'needle moved away from 0: ' + needle);

  /* ---------- "Set quiet level": either a new sensitivity, or "too noisy" and the old one is kept ---------- */
  await setRange('#nm-sens', 7);
  await page.click('#nm-calib');
  await page.waitForFunction((run) => !document.querySelector('#nm-calib-msg').textContent.startsWith(run), t('calib_run', { n: 'X' }).split('X')[0], { timeout: 8000 });
  const calibTxt = await txt('#nm-calib-msg'), sensAfter = await page.inputValue('#nm-sens');
  if (calibTxt === t('calib_noisy')) expect(sensAfter === '7', 'a noisy calibration keeps the sensitivity, got ' + sensAfter);
  else expect(calibTxt === t('calib_done', { n: sensAfter }), 'calibration reports the new sensitivity: ' + calibTxt + ' / ' + sensAfter);
  log('calibration', calibTxt, sensAfter);
  await setRange('#nm-sens', 10);

  /* ---------- too loud for longer than the delay → one alert ---------- */
  await setRange('#nm-delay', 1);
  expect(await txt('#nm-delay-val') === t('sec_n', { n: 1 }), 'delay label shows 1 second');
  await setRange('#nm-threshold', 20);
  await page.waitForFunction(() => document.querySelector('#nm-count').textContent.trim() === '1', null, { timeout: 10000 });
  expect(await attr('#nm-stage', 'data-zone') === 'red', 'stage turns red above the line');
  expect(await txt('#nm-face-label') === t('face_alert'), 'face asks the class to lower voices');
  const lv = await numOf('#nm-level');
  expect(lv >= 20, 'level is above the line of 20, got ' + lv);
  log('level during alert', lv);

  /* ---------- raise the line: calm again, still counted once ---------- */
  await setRange('#nm-threshold', 95);
  await page.waitForFunction(() => document.querySelector('#nm-stage').dataset.zone !== 'red', null, { timeout: 8000 });
  await page.waitForTimeout(1800);                       // long enough to re-arm
  expect(await txt('#nm-count') === '1', 'a single loud episode is counted once, got ' + await txt('#nm-count'));

  /* ---------- quiet challenge ---------- */
  await page.selectOption('#nm-goal', '2');
  await page.click('#nm-ch-btn');
  expect(!(await page.isHidden('#nm-chstrip')), 'challenge strip appears on the stage');
  expect(await txt('#nm-ch-btn') === t('ch_stop'), 'button now offers Stop challenge');
  expect(await txt('#nm-stars-txt') === t('ch_stars', { n: 0, goal: 2 }), 'shows 0 of 2 stars');
  expect(await page.textContent('#nm-ch-print') === t('ch_stars', { n: 0, goal: 2 }), 'printed report carries the challenge progress');
  expect(await page.$$eval('#nm-stars span', (s) => s.length) === 2, 'two star slots for a 2-minute goal');
  await page.waitForTimeout(2600);
  const sec1 = parseFloat(await attr('#nm-chstrip', 'data-sec'));
  expect(sec1 >= 1.8, 'quiet seconds are counting, got ' + sec1);
  const next = await txt('#nm-ch-next');
  expect(/0:5\d/.test(next), 'next star countdown shows under a minute: ' + next);

  // too loud again → second alert, the current minute restarts
  await setRange('#nm-threshold', 20);
  await page.waitForFunction(() => document.querySelector('#nm-count').textContent.trim() === '2', null, { timeout: 10000 });
  const sec2 = parseFloat(await attr('#nm-chstrip', 'data-sec'));
  expect(sec2 < 1 && sec2 < sec1, 'too loud restarts the minute: ' + sec1 + ' → ' + sec2);
  expect(await txt('#nm-banner') === t('ch_reset_min'), 'stage explains that the minute restarts');

  /* ---------- session statistics ---------- */
  await page.waitForTimeout(1100);
  expect(await txt('#nm-s-alerts') === '2', 'session shows 2 times too loud');
  const listened = secsOf(await txt('#nm-s-time'));
  expect(listened >= 6, 'listening time counted, got ' + listened);
  const z = await page.$eval('#nm-zonebar', (e) => [+e.dataset.g, +e.dataset.y, +e.dataset.r]);
  const sum = z[0] + z[1] + z[2];
  expect(Math.abs(sum - 100) < 0.6 && z[2] > 0, 'quiet/getting loud/too loud shares add up to 100%: ' + z.join(' / '));
  expect(await numOf('#nm-s-peak') >= await numOf('#nm-s-avg'), 'loudest ≥ average');

  /* ---------- printing in dark mode: the chart line must be dark on white paper ---------- */
  const darkPx = () => page.$eval('#nm-chart', (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] + d[i + 1] + d[i + 2] < 150) n++; return n; });
  await page.evaluate(() => EDU.setTheme('dark'));
  await page.waitForTimeout(700);
  const onScreen = await darkPx();
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const onPaper = await darkPx();
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.evaluate(() => EDU.setTheme('light'));
  expect(onPaper > 50 && onPaper > onScreen * 3, 'print redraws the dark-theme chart with a dark line: ' + onScreen + ' → ' + onPaper);

  /* ---------- stop: challenge pauses ---------- */
  await page.click('#nm-mic');
  expect(await attr('#nm-stage', 'data-state') === 'idle', 'mic stopped');
  expect(await txt('#nm-ch-status') === t('ch_paused'), 'challenge says it is paused');

  /* ---------- settings and session survive a reload ---------- */
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(800);
  expect(await page.inputValue('#nm-threshold') === '20', 'too-loud line kept after reload');
  expect(await page.inputValue('#nm-delay') === '1', 'delay kept after reload');
  expect(await txt('#nm-count') === '2', 'times-too-loud count kept after reload');
  expect(await page.inputValue('#nm-goal') === '2', 'goal kept after reload');

  /* ---------- Urdu (Nastaliq): the big emoji must not swallow clicks on the view buttons ---------- */
  await page.evaluate(() => EDU.setLang('ur'));
  await page.waitForTimeout(600);
  const urOk = await page.evaluate(() => { const U = window.APP_STRINGS.ur; const q = (s) => document.querySelector(s).textContent.trim();
    return [q('#nm-ch-status') === U.ch_paused, q('#nm-mic-txt') === U.mic_start, q('#nm-act-val') === U.act_custom, q('#nm-delay-val') === U.sec_n.replace('{n}', '1'), document.documentElement.dir === 'rtl'].join(); });
  expect(urOk === 'true,true,true,true,true', 'dynamic texts re-render in Urdu (RTL): ' + urOk);
  const hit = await page.$eval('#nm-view button[data-view="balls"]', (b) => { b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return b.contains(h) ? 'ok' : (h && (h.id || h.className)); });
  expect(hit === 'ok', 'Bouncing balls button is clickable in Urdu, covered by: ' + hit);
  await page.click('#nm-view button[data-view="balls"]');
  expect(await attr('#nm-view button[data-view="balls"]', 'aria-pressed') === 'true', 'Bouncing balls view opens in Urdu');
  await page.click('#nm-view button[data-view="meter"]');
  await page.evaluate((L) => EDU.setLang(L), lang);
  await page.waitForTimeout(300);
  expect(await txt('#nm-ch-status') === t('ch_paused'), 'language switch re-renders the challenge status');

  /* ---------- balls view ---------- */
  await page.click('#nm-view button[data-view="balls"]');
  expect(!(await page.isHidden('#nm-balls-view')) && await page.isHidden('#nm-meter-view'), 'bouncing balls view replaces the gauge');
  const drawn = await page.$eval('#nm-balls', (c) => c.width > 0 && c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0));
  expect(drawn, 'balls canvas is drawn');
  await page.click('#nm-view button[data-view="meter"]');

  /* ---------- new session clears the numbers ---------- */
  await page.click('#nm-new');                       // confirm() is auto-accepted
  expect(await txt('#nm-count') === '0', 'new session resets the count');
  expect(await txt('#nm-s-alerts') === '0', 'new session resets session stats');
  expect(await page.isHidden('#nm-chstrip'), 'new session clears the challenge');

  /* ---------- a damaged save is repaired, not shown ---------- */
  await page.evaluate(() => {
    localStorage.setItem('edu.noise-meter.session', JSON.stringify({ t: 100, g: 1e9, y: 0, r: 0, sum: 1e12, peak: 50, alerts: 3, start: 9e15, ch: { running: true, goal: 2, stars: 99, sec: 5 } }));
    localStorage.setItem('edu.noise-meter.jar', JSON.stringify(1e15));
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(600);
  expect(!/Invalid/.test(await txt('#nm-s-when')), 'session date is valid: ' + await txt('#nm-s-when'));
  const zb = await page.$eval('#nm-zonebar', (e) => +e.dataset.g + +e.dataset.y + +e.dataset.r);
  expect(Math.abs(zb - 100) < 0.6, 'zone shares still add up to 100%: ' + zb);
  expect(await numOf('#nm-s-avg') <= 100, 'average stays on the 0–100 scale');
  expect(await txt('#nm-ch-btn') === t('ch_start') && await txt('#nm-ch-status') === t('ch_done', { n: 2 }), 'a challenge saved with all its stars counts as complete');
  expect(await numOf('#nm-jar') <= 99999, 'star jar is capped');
  await page.click('#nm-jar-empty');                 // confirm() is auto-accepted
  expect(await txt('#nm-jar') === '0', 'Empty the jar resets the class star jar');
  await page.click('#nm-new');

  /* leave it listening with group-work settings for the screenshot */
  await page.click('#nm-presets button[data-th="65"]');
  await page.click('#nm-mic');
  await page.waitForSelector('#nm-stage[data-state="live"]', { timeout: 10000 });
  await page.click('#nm-ch-btn');
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
};
