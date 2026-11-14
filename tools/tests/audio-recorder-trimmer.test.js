/* Audio Recorder & Trimmer interaction test (verify.js runs Chrome with a fake microphone).
   1) a tone generated in the page (the sample tune, 4 s) -> choose 0.5 s..2.0 s -> "keep only the selection":
      duration is 1.5 s; the WAV download has a correct RIFF/WAVE header, 16-bit PCM, and the matching data length
   2) "remove the selection" shortens the sound, Undo brings it back
   3) volume boost is held back before clipping; fade-in makes the first samples silent
   4) the smaller MediaRecorder file (when the browser has one) is labelled with its real format
   5) microphone: record ~1.5 s with pause/resume, then permission denied shows the friendly message
   6) a file that is not audio shows a friendly message and keeps the current sound */
module.exports = async function ({ page, expect, t, log }) {
  const attr = (k) => page.evaluate((k) => document.getElementById('app').getAttribute(k), k);
  const num = async (k) => parseFloat(await attr(k));
  const setRange = (id, v) => page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
  const wavInfo = () => page.evaluate(async () => {
    const b = window.ART_TEST.lastBlob, ab = await b.arrayBuffer(), dv = new DataView(ab);
    const s = (p) => String.fromCharCode(dv.getUint8(p), dv.getUint8(p + 1), dv.getUint8(p + 2), dv.getUint8(p + 3));
    const pcm = new Int16Array(ab, 44); let peak = 0; for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
    let head = 0; for (let i = 0; i < 40; i++) head = Math.max(head, Math.abs(pcm[i]));
    return { riff: s(0), wave: s(8), fmt: s(12), data: s(36), size: ab.byteLength, riffLen: dv.getUint32(4, true), pcmFmt: dv.getUint16(20, true),
      ch: dv.getUint16(22, true), sr: dv.getUint32(24, true), byteRate: dv.getUint32(28, true), bits: dv.getUint16(34, true), dataLen: dv.getUint32(40, true),
      peak, head, name: window.ART_TEST.lastName, type: b.type };
  });

  expect(await attr('data-ready') === '0', 'starts with no sound');
  expect(!(await page.isVisible('#edCard')), 'editor hidden before a sound is loaded');

  /* ---------- 1) tone -> trim -> WAV ---------- */
  await page.click('#sampleBtn');
  await page.waitForSelector('#edCard:not([hidden])');
  expect(Math.abs(await num('data-dur') - 4) < 0.01, 'sample tone is 4 s, got ' + await attr('data-dur'));
  await setRange('selB', 2.0);
  await setRange('selA', 0.5);
  expect(Math.abs(await num('data-sel') - 1.5) < 0.011, 'selection is 1.5 s, got ' + await attr('data-sel'));
  await page.click('#trimBtn');
  const d1 = await num('data-dur');
  expect(Math.abs(d1 - 1.5) < 0.011, 'trimmed sound is 1.5 s, got ' + d1);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#wavBtn')]);
  expect(/^audio-\d{4}-\d{2}-\d{2}-\d{4}\.wav$/.test(dl.suggestedFilename()), 'WAV file name, got ' + dl.suggestedFilename());
  let w = await wavInfo();
  expect(w.riff === 'RIFF' && w.wave === 'WAVE' && w.fmt === 'fmt ' && w.data === 'data', 'WAV header tags ' + JSON.stringify(w));
  expect(w.pcmFmt === 1 && w.bits === 16 && w.ch === 1 && w.sr === 44100 && w.byteRate === 88200, 'WAV is 16-bit PCM mono 44100 Hz');
  expect(w.dataLen === w.size - 44 && w.riffLen === w.size - 8, 'WAV length fields match the file size');
  const wavDur = w.dataLen / w.byteRate;
  expect(Math.abs(wavDur - 1.5) < 0.011, 'WAV plays for 1.5 s, got ' + wavDur);
  expect(w.peak > 3000 && w.peak < 32767, 'WAV holds the tone, peak ' + w.peak);
  expect((await page.textContent('#dlMsg')).includes('KB'), 'download message states the file size');
  const peak100 = w.peak;

  /* ---------- 2) cut the middle out, then undo ---------- */
  await setRange('selA', 0.5); await setRange('selB', 1.0);
  await page.click('#cutBtn');
  expect(Math.abs(await num('data-dur') - 1.0) < 0.011, 'removing 0.5 s leaves 1.0 s, got ' + await attr('data-dur'));
  expect(await page.isEnabled('#undoBtn'), 'Undo is available');
  await page.click('#undoBtn');
  expect(Math.abs(await num('data-dur') - 1.5) < 0.011, 'Undo restores 1.5 s');
  await page.click('#allBtn');
  await page.click('#cutBtn');
  expect(Math.abs(await num('data-dur') - 1.5) < 0.011, 'cannot remove the whole sound');
  expect((await page.textContent('#edMsg')).trim() === t('msg_cut_all'), 'friendly message for removing everything');

  /* ---------- 3) volume boost with clipping protection + fade in ---------- */
  await setRange('vol', 400);
  await page.selectOption('#fadeIn', '0.5');
  await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#wavBtn')]);
  w = await wavInfo();
  expect(w.peak > peak100 && w.peak <= 32767 * 0.985, 'boost is louder but never clips: ' + peak100 + ' -> ' + w.peak);
  expect(w.head < 200, 'fade-in starts from silence, first samples ' + w.head);
  expect(await page.isVisible('#volNote'), 'the page says the volume was held back');
  await setRange('vol', 100); await page.selectOption('#fadeIn', '0');

  /* ---------- 4) smaller file, honest format ---------- */
  if (await page.isVisible('#smallBtn')) {
    const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#smallBtn')]);
    const n2 = dl2.suggestedFilename();
    w = await page.evaluate(() => ({ type: window.ART_TEST.lastBlob.type, size: window.ART_TEST.lastBlob.size }));
    expect(/\.(webm|ogg|m4a)$/.test(n2) && w.size > 500, 'smaller file downloaded: ' + n2 + ' ' + w.size);
    const ext = n2.split('.').pop();
    expect((ext === 'webm' && /webm/.test(w.type)) || (ext === 'ogg' && /ogg/.test(w.type)) || (ext === 'm4a' && /mp4/.test(w.type)), 'file extension matches the real format: ' + n2 + ' / ' + w.type);
    expect(w.size < 1.5 * 88200, 'compressed file is smaller than the WAV, ' + w.size);
    log('compressed', n2, w.size, 'bytes');
  }

  /* ---------- 5) microphone: record, pause, resume, stop; then permission denied ---------- */
  await page.click('#recBtn');
  await page.waitForFunction(() => document.getElementById('app').getAttribute('data-state') === 'recording', null, { timeout: 15000 });
  await page.waitForTimeout(900);
  await page.click('#pauseBtn');
  expect(await attr('data-state') === 'paused', 'paused');
  const t1 = await page.textContent('#recTime');
  await page.waitForTimeout(1200);
  expect(await page.textContent('#recTime') === t1, 'timer frozen while paused');
  await page.click('#pauseBtn');
  await page.waitForTimeout(800);
  await page.click('#stopBtn');
  await page.waitForFunction(() => { const a = document.getElementById('app'); return a.getAttribute('data-state') === 'idle' && a.getAttribute('data-ready') === '1'; }, null, { timeout: 20000 });
  const recDur = await num('data-dur');
  expect(recDur > 0.8 && recDur < 4, 'recording is about 1.7 s (pause left out), got ' + recDur);
  log('recorded', recDur, 's');

  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')); });
  await page.click('#recBtn');
  await page.waitForSelector('#msg:not([hidden])');
  expect((await page.textContent('#msg')).trim() === t('err_denied'), 'permission-denied message shown');
  expect(await attr('data-state') === 'idle', 'back to idle after a denied microphone');

  /* ---------- 6) not an audio file ---------- */
  await page.setInputFiles('#file', { name: 'notes.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('this is not audio at all, just some text '.repeat(40)) });
  await page.waitForFunction((m) => document.getElementById('msg').textContent.trim() === m, t('err_notaudio'), { timeout: 15000 });
  expect(Math.abs(await num('data-dur') - recDur) < 0.001, 'the current sound is kept after a bad file');
};
