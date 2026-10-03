/* Interaction test for Classroom Timer (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const sleep = (ms) => page.waitForTimeout(ms);
  const secsOf = (s) => s.split(':').reduce((a, x) => a * 60 + parseFloat(x), 0);

  /* ---------------- countdown ---------------- */
  await page.click('#tab-countdown');
  await page.click('#cd-presets button[data-min="1"]');
  expect(await txt('#cd-digits') === '01:00', '1-minute preset shows 01:00, got ' + await txt('#cd-digits'));
  await page.click('#cd-toggle');
  await sleep(1300);
  let d = await txt('#cd-digits');
  expect(d === '00:59' || d === '00:58', 'countdown is running, got ' + d);
  expect((await page.getAttribute('#cd-ring', 'class')).includes('warn'), 'ring turns orange in the last minute');
  const title = await page.title();
  expect(title.includes(d.slice(0, 4)), 'browser tab title shows the time left: ' + title);

  // freeze the page for 2.5 s: a tick-counting timer would fall behind, a timestamp-based one must not
  await page.evaluate(() => { const s = Date.now(); while (Date.now() - s < 2500) { /* busy */ } });
  await sleep(400);
  d = await txt('#cd-digits');
  const left = secsOf(d);
  expect(left >= 52 && left <= 56, 'keeps real time after the page was frozen, got ' + d);
  log('after freeze', d);

  await page.click('#cd-plus');
  d = await txt('#cd-digits');
  expect(d.startsWith('01:5'), '+1 min adds a minute, got ' + d);

  await page.keyboard.press('Space');                    // Space = pause
  const p1 = await txt('#cd-digits');
  await sleep(1200);
  expect(await txt('#cd-digits') === p1, 'paused timer does not move');
  expect(await txt('#cd-toggle') === t('btn_resume'), 'button offers Resume while paused');
  await page.keyboard.press('r');                        // R = reset to the chosen time
  expect(await txt('#cd-digits') === '01:00', 'R resets to the set time (01:00), got ' + await txt('#cd-digits'));
  expect(await txt('#cd-status') === t('st_ready'), 'status says Ready after reset');

  // custom 2-second countdown → time's up
  await page.fill('#cd-h', '0');
  await page.fill('#cd-m', '0');
  await page.fill('#cd-s', '2');
  await page.click('#cd-set');
  expect(await txt('#cd-digits') === '00:02', 'custom time shows 00:02, got ' + await txt('#cd-digits'));
  await page.click('#cd-toggle');
  await page.waitForFunction(() => document.querySelector('#cd-stage').classList.contains('is-done'), null, { timeout: 7000 });
  expect(await txt('#cd-digits') === '00:00', 'shows 00:00 at the end');
  expect(await txt('#cd-status') === t('times_up'), "status says time's up");
  expect((await page.getAttribute('#cd-ring', 'class')).includes('done'), 'ring turns red at zero');

  /* ---------------- stopwatch with laps ---------------- */
  await page.click('#tab-stopwatch');
  await page.click('#sw-toggle');
  await sleep(1100);
  await page.click('#sw-lap');
  await sleep(500);
  await page.click('#sw-lap');
  await page.click('#sw-toggle');                         // pause
  const rows = await page.$$eval('#sw-table tbody tr', (r) => r.length);
  expect(rows === 2, 'two laps recorded, got ' + rows);
  const swd = await txt('#sw-digits');
  expect(/^00:0[12]\.\d\d$/.test(swd), 'stopwatch shows about 1.7 s, got ' + swd);
  const totals = await page.$$eval('#sw-table tbody td.tot', (tds) => tds.map((x) => x.textContent.trim()));
  expect(secsOf(totals[0]) > secsOf(totals[1]) && secsOf(totals[1]) >= 1, 'newest lap total is larger: ' + totals.join(' / '));
  const splits = await page.$$eval('#sw-table tbody td.lap-t', (tds) => tds.map((x) => x.textContent.trim()));
  expect(Math.abs(secsOf(splits[0]) + secsOf(splits[1]) - secsOf(totals[0])) < 0.02, 'lap times add up to the total');
  expect(await page.isDisabled('#sw-lap'), 'Lap is disabled while paused');
  await page.click('#sw-reset');
  expect(await txt('#sw-digits') === '00:00.00', 'reset clears the stopwatch, got ' + await txt('#sw-digits'));
  expect(await page.$$eval('#sw-table tbody tr', (r) => r.length) === 0, 'reset clears laps');

  /* ---------------- pomodoro ---------------- */
  await page.click('#tab-pomodoro');
  expect(await txt('#po-phase') === t('phase_work'), 'starts with focus time');
  expect(await txt('#po-digits') === '25:00', 'default focus is 25:00, got ' + await txt('#po-digits'));
  await page.click('#po-plans button[data-plan="young"]');
  expect(await txt('#po-digits') === '10:00', 'young-learners plan gives 10:00');
  await page.click('#po-toggle');
  await sleep(1200);
  d = await txt('#po-digits');
  expect(d === '09:59' || d === '09:58', 'pomodoro runs, got ' + d);
  await page.click('#po-skip');
  expect(await txt('#po-phase') === t('phase_short'), 'skip moves to the short break');
  d = await txt('#po-digits');
  expect(d === '02:00' || d === '01:59', 'short break is 2 minutes, got ' + d);
  expect(await page.$$eval('#po-dots i.on', (x) => x.length) === 1, 'one session dot filled');
  await page.click('#po-skip');
  expect(await txt('#po-phase') === t('phase_work'), 'after the break comes focus time again');
  expect(await txt('#po-session') === t('session_of', { n: '2', m: '3' }), 'session counter says 2 of 3, got ' + await txt('#po-session'));

  // a focus session that ended while the tab was closed: auto-switch must catch up on reload
  await page.evaluate(() => {
    localStorage.setItem('edu.class-timer.po', JSON.stringify({ work: 25, short: 5, long: 15, every: 4, auto: true, phase: 'work', round: 0,
      running: true, started: true, endAt: Date.now() - 1000, remaining: 0, done: 0, focusMs: 0 }));
  });
  await page.reload();
  await sleep(900);
  expect(await txt('#po-phase') === t('phase_short'), 'auto-switched to the short break after reload');
  d = await txt('#po-digits');
  expect(d.startsWith('04:5'), 'break already running with the right time left, got ' + d);
  expect(await txt('#po-stats') === t('po_stats', { n: '1', m: '25' }), 'finished session counted: ' + await txt('#po-stats'));

  /* ---------------- work-mode signs ---------------- */
  await page.click('#tab-signs');
  await page.click('#sg-grid button[data-sign="group"]');
  expect(await txt('#sg-title') === t('sign_group'), 'group-work sign shown');
  await page.keyboard.press('1');
  expect(await txt('#sg-title') === t('sign_silent'), 'key 1 switches to the silent sign');
  expect(await txt('#sg-voice-txt') === t('voice_level', { n: '0' }), 'silent sign shows voice level 0');
  expect(await txt('#sg-timer') === t('times_up'), 'sign board shows the countdown status');
  await page.reload();
  await sleep(900);
  expect(await page.getAttribute('#tab-signs', 'aria-selected') === 'true', 'last tab remembered after reload');
  expect(await txt('#sg-title') === t('sign_silent'), 'chosen sign remembered after reload');
};
