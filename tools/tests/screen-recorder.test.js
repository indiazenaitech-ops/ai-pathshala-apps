/* Screen Recorder interaction test (verify.js runs Chrome with a fake camera, mic and screen).
   1) camera-only video message with the 3-2-1 countdown: idle -> countdown -> recording -> paused -> recording -> stopped,
      blob size > 0, the file plays with a real duration, and Download fires recording-YYYY-MM-DD-HHMM.mp4/webm
   2) screen mode without countdown, then the browser's "Stop sharing" ends the track: the recording is saved cleanly
   3) the user cancels the screen picker: back to idle, nothing recorded
   4) screen + camera drawn inside the video (canvas compositing) as WebM, stopped from the keyboard: focus lands on
      Download, the first frame is not black, the WebM has a real duration, and a cleared file name falls back to
      this take's own automatic name
   5) a computer with no microphone (NotFoundError): recording continues with the "no microphone found" message */
module.exports = async function ({ page, expect, t, log }) {
  const state = () => page.evaluate(() => document.getElementById('app').getAttribute('data-state'));
  const waitState = (s, ms) => page.waitForFunction(x => document.getElementById('app').getAttribute('data-state') === x, s, { timeout: ms || 20000 });

  expect(await state() === 'idle', 'starts idle');
  await page.evaluate(() => {
    /* keep a handle on the shared screen so the test can press "Stop sharing" like a user */
    const md = navigator.mediaDevices, orig = md.getDisplayMedia.bind(md);
    md.getDisplayMedia = c => window.__cancelPicker
      ? Promise.reject(new DOMException('Permission denied', 'NotAllowedError'))
      : orig(c).then(s => { window.__share = s; return s; });
  });

  /* ---------- 1) camera-only video message ---------- */
  await page.click('#modeCam');
  expect(await page.getAttribute('#modeCam', 'aria-pressed') === 'true', 'camera mode selected');
  if (!(await page.isChecked('#optCountdown'))) await page.check('#optCountdown');
  await page.click('#recBtn');
  await waitState('countdown', 15000);
  const n = (await page.textContent('#countNum')).trim();
  expect(n === '3' || n === '2', 'countdown shows 3-2-1, got ' + n);
  await waitState('recording', 15000);
  await page.waitForTimeout(1300);
  await page.click('#pauseBtn');
  expect(await state() === 'paused', 'state is paused after Pause');
  const t1 = (await page.textContent('#liveTime')).trim();
  await page.waitForTimeout(900);
  const t2 = (await page.textContent('#liveTime')).trim();
  expect(t1 === t2, `timer frozen while paused (${t1} vs ${t2})`);
  await page.click('#pauseBtn');
  expect(await state() === 'recording', 'state is recording after Resume');
  await page.waitForTimeout(1200);
  await page.click('#stopBtn');
  await waitState('stopped', 20000);
  const bytes = Number(await page.getAttribute('#player', 'data-bytes'));
  expect(bytes > 1000, 'recorded blob has data, bytes=' + bytes);
  await page.waitForFunction(() => { const v = document.getElementById('player'); return v.readyState >= 1 && isFinite(v.duration) && v.duration > 1; }, null, { timeout: 15000 });
  const dur = await page.evaluate(() => document.getElementById('player').duration);
  expect(dur > 1.5 && dur < 6, 'video duration about 2.5 s (pause excluded), got ' + dur);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#dlBtn')]);
  const name = dl.suggestedFilename();
  expect(/^recording-\d{4}-\d{2}-\d{2}-\d{4}\.(mp4|webm)$/.test(name), 'download file name ' + name);
  expect((await page.$$('#sessionList .sr-item')).length === 1, 'one recording in the session list');
  log('camera recording', bytes, 'bytes', dur.toFixed(2), 's', name);

  /* ---------- 2) screen + mic, no countdown, ended by the browser's Stop sharing ---------- */
  await page.click('#newBtn');
  await waitState('idle');
  await page.click('#modeScreen');
  await page.uncheck('#optCountdown');
  await page.click('#recBtn');
  await waitState('recording', 15000);
  await page.waitForTimeout(1500);
  expect(await page.isVisible('#layerLive'), 'live screen panel visible while recording');
  await page.evaluate(() => { const tr = window.__share.getVideoTracks()[0]; tr.stop(); tr.dispatchEvent(new Event('ended')); });
  await waitState('stopped', 20000);
  expect((await page.$$('#sessionList .sr-item')).length === 2, 'two recordings in the session list');
  const bytes2 = Number(await page.getAttribute('#player', 'data-bytes'));
  expect(bytes2 > 1000, 'screen recording has data, bytes=' + bytes2);
  const sharing = await page.evaluate(() => window.__share.getTracks().some(t => t.readyState === 'live'));
  expect(!sharing, 'screen tracks released after Stop sharing');

  /* ---------- 3) picker cancelled ---------- */
  await page.click('#newBtn');
  await page.evaluate(() => { window.__cancelPicker = true; });
  await page.click('#recBtn');
  await waitState('idle', 10000);
  expect((await page.$$('#sessionList .sr-item')).length === 2, 'cancelled picker records nothing');
  expect(await page.isVisible('#recBtn'), 'Start button is back after cancel');

  /* ---------- 4) camera drawn inside the video (canvas compositing), WebM, stopped from the keyboard ---------- */
  await page.evaluate(() => { window.__cancelPicker = false; });
  await page.check('#camOn');
  if (await page.isVisible('[data-bubble="inside"]')) await page.click('[data-bubble="inside"]');
  await page.click('[data-fmt="webm"]');
  await page.click('#recBtn');
  await waitState('recording', 15000);
  await page.waitForTimeout(1500);
  await page.focus('#stopBtn');
  await page.keyboard.press('Enter');
  await waitState('stopped', 20000);
  expect(await page.evaluate(() => document.activeElement && document.activeElement.id) === 'dlBtn', 'keyboard focus moves to Download after Stop');
  expect((await page.textContent('#fileExt')).trim() === '.webm', 'WebM chosen');
  /* the first frame must already show the screen (it was black before the sources were ready) */
  const first = await page.evaluate(async () => {
    const v = document.createElement('video'); v.muted = true; v.src = document.getElementById('player').src;
    await new Promise(r => { v.onloadeddata = r; v.onerror = r; setTimeout(r, 6000); });
    v.currentTime = 0.001;   /* headless Chrome paints the first frame only after a seek */
    await new Promise(r => { v.onseeked = r; setTimeout(r, 4000); });
    const c = document.createElement('canvas'); c.width = 64; c.height = 36; const x = c.getContext('2d');
    x.drawImage(v, 0, 0, 64, 36);
    const d = x.getImageData(0, 0, 64, 36).data; let s = 0;
    for (let i = 0; i < d.length; i += 4) s += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    return { lum: s / (d.length / 4), dur: v.duration };
  });
  expect(first.lum > 40, 'composited video starts with a real frame, not black (luma ' + first.lum.toFixed(1) + ')');
  expect(isFinite(first.dur) && first.dur > 1 && first.dur < 5, 'WebM has a seekable duration, got ' + first.dur);
  /* clearing the file name falls back to this take's own automatic name */
  const auto = await page.inputValue('#fileName');
  await page.fill('#fileName', '  ');
  const [dl4] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#dlBtn')]);
  expect(dl4.suggestedFilename() === auto + '.webm', `empty name downloads as ${auto}.webm, got ${dl4.suggestedFilename()}`);
  log('composited webm', first.dur.toFixed(2), 's, luma', first.lum.toFixed(0), dl4.suggestedFilename());

  /* ---------- 5) a computer with no microphone: recording continues, with the right message ---------- */
  await page.evaluate(() => {
    const md = navigator.mediaDevices, o = md.getUserMedia.bind(md);
    md.getUserMedia = c => (c && c.audio) ? Promise.reject(new DOMException('Requested device not found', 'NotFoundError')) : o(c);
  });
  await page.click('#newBtn');
  await page.uncheck('#camOn');
  await page.click('#recBtn');
  await waitState('recording', 15000);
  expect((await page.textContent('#noticeText')).trim() === t('mic_missing'), 'no-microphone message shown');
  expect(await page.isVisible('#liveNoMic') && !(await page.isVisible('#muteBtn')), 'recording without microphone, no mute button');
  await page.waitForTimeout(1000);
  await page.click('#stopBtn');
  await waitState('stopped', 20000);
  expect((await page.$$('#sessionList .sr-item')).length === 4, 'four recordings in the session list');
};
