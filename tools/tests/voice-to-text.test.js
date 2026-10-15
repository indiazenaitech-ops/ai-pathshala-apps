/* Interaction test for Voice Note to Text, run by tools/verify.js in en and hi.
   Transformers.js, the AI engine and the Whisper "tiny" model (~70 MB in all) come from jsDelivr and
   huggingface.co. To keep repeat runs fast and avoid Hugging Face rate limits (HTTP 429), files under 60 MB
   are kept in a disk cache in the OS temp folder (vtt-model-cache); the app code path is unchanged. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

async function cacheModelFiles(ctx) {
  const dir = path.join(os.tmpdir(), 'vtt-model-cache');
  fs.mkdirSync(dir, { recursive: true });
  await ctx.route(/^https:\/\/(huggingface\.co|cdn\.jsdelivr\.net)\//, async route => {
    const req = route.request();
    if (req.method() !== 'GET') return route.continue();
    const f = path.join(dir, crypto.createHash('sha1').update(req.url()).digest('hex'));
    try {
      if (fs.existsSync(f + '.json')) {
        if (fs.statSync(f).size > 60e6) return route.continue();
        const meta = JSON.parse(fs.readFileSync(f + '.json', 'utf8'));
        const body = fs.readFileSync(f);
        if (/^bytes=0-0$/.test(req.headers()['range'] || '')) {   // the library asks for 1 byte to learn the file size
          return route.fulfill({ status: 206, headers: Object.assign({}, meta.headers, { 'content-range': 'bytes 0-0/' + body.length, 'content-length': '1' }), body: body.subarray(0, 1) });
        }
        return route.fulfill({ status: 200, headers: meta.headers, body });
      }
      if (/whisper-small\/.*\.onnx/.test(req.url())) return route.continue();
      const resp = await route.fetch({ timeout: 300000 });
      const body = await resp.body();
      const headers = Object.assign({}, resp.headers());
      delete headers['content-encoding']; delete headers['transfer-encoding'];
      headers['content-length'] = String(body.length);
      headers['access-control-allow-origin'] = '*';
      headers['access-control-expose-headers'] = '*';
      if (resp.status() === 200 && body.length < 60e6) { fs.writeFileSync(f, body); fs.writeFileSync(f + '.json', JSON.stringify({ headers, url: req.url() })); }
      return route.fulfill({ status: resp.status(), headers, body });
    } catch (e) { return route.continue().catch(() => {}); }
  });
}

module.exports = async function ({ page, lang, expect, t, log }) {
  await cacheModelFiles(page.context());
  await page.waitForSelector('#app[data-ready="1"]', { timeout: 30000 });
  const finished = () => page.waitForFunction(() => {
    const run = document.getElementById('runBtn'), stop = document.getElementById('stopBtn');
    return !run.disabled && stop.hidden && (!document.getElementById('errBox').hidden || /\S/.test(document.getElementById('stats').textContent));
  }, null, { timeout: 100000 });

  // 0) Default model: Hindi speakers get Small (proper Hindi letters) on a computer, Base on a phone;
  //    everyone else starts on Base.
  const dev = await page.evaluate(() => ({ low: !!((navigator.userAgentData && navigator.userAgentData.mobile) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.deviceMemory && navigator.deviceMemory < 8)), model: document.querySelector('#models [aria-pressed="true"]').dataset.model, lang: document.getElementById('langSel').value }));
  const wantModel = lang === 'hi' && !dev.low ? 'small' : 'base';
  expect(dev.model === wantModel, 'default model for ' + lang + ' (' + dev.lang + ') is ' + wantModel + ', got ' + dev.model);
  if (wantModel === 'small') expect((await page.textContent('#models [data-model="small"]')).indexOf(t('rec_badge', { lang: t('lang_hi') })) >= 0, 'Small is marked best for Hindi');

  // 0b) Urdu letters -> Hindi letters for Base's Hindi output (tricky words)
  const tl = await page.evaluate(() => window.VTT_URDU_TO_HINDI('میں نے کہا کیا ضرورت ہے؟ پردھان منتری نے بچوں کے اسکول میں نہیں جانا۔ مجھے ٹھیک لگتا ہوں'));
  log('translit: ' + tl);
  expect(tl === 'मैं ने कहा क्या ज़रूरत है? प्रधान मंत्री ने बच्चों के स्कूल में नहीं जाना। मुझे ठीक लगता हूँ', 'transliteration of tricky words: ' + tl);

  // 1) English sample: the language switches to English and the clip length is shown.
  await page.click('#models [data-model="tiny"]');
  expect(await page.getAttribute('#models [data-model="tiny"]', 'aria-pressed') === 'true', 'Tiny model is selected');
  await page.click('#sampleEn');
  await page.waitForSelector('#fileBox:not([hidden])', { timeout: 15000 });
  expect(await page.inputValue('#langSel') === 'en', 'English sample sets the language to English');
  const dur = (await page.textContent('#fileDur')).trim();
  expect(dur === t('dur_s', { s: 8 }), 'sample is 8 seconds long, badge says ' + JSON.stringify(dur));

  // 2) Convert to text with Whisper tiny (downloads the model the first time).
  await page.click('#runBtn');
  await finished();
  expect(await page.isHidden('#errBox'), 'no error: ' + (await page.textContent('#errText')));
  await page.click('#viewSeg [data-view="plain"]');
  const text = (await page.textContent('#plain')).trim();
  log('English: ' + JSON.stringify(text));
  expect(/parents meeting/i.test(text) && /Saturday/i.test(text) && /report card/i.test(text), 'transcript has "parents meeting", "Saturday" and "report card": ' + text);
  await page.click('#viewSeg [data-view="times"]');
  const segs = await page.$$eval('#segs .vt-seg', rows => rows.map(r => ({ ts: r.querySelector('.vt-ts').textContent, text: r.querySelector('.vt-txt').textContent })));
  expect(segs.length >= 2, 'at least two timed lines, got ' + segs.length);
  expect(segs[0].ts === '0:00', 'first line starts at 0:00, got ' + segs[0].ts);
  const words = (await page.textContent('#stats .badge.primary')).trim();
  expect(words === t('words_n', { n: text.split(/\s+/).filter(Boolean).length }), 'word count badge matches the text: ' + words);

  // 3) Subtitles: SRT and VTT downloads with proper time codes.
  const [srtDl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#dlSrt')]);
  const srt = fs.readFileSync(await srtDl.path(), 'utf8');
  expect(/\.srt$/.test(srtDl.suggestedFilename()), 'SRT file name: ' + srtDl.suggestedFilename());
  expect(/^1\n00:00:00,000 --> 00:00:0\d,\d{3}\n\S/.test(srt) && /\n2\n00:00:0\d,\d{3} --> /.test(srt), 'SRT has numbered cues with hh:mm:ss,mmm times:\n' + srt.slice(0, 200));
  const [vttDl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#dlVtt')]);
  const vtt = fs.readFileSync(await vttDl.path(), 'utf8');
  expect(/^WEBVTT\n\n00:00:00\.000 --> 00:00:0\d\.\d{3}\n/.test(vtt), 'VTT starts with WEBVTT and dot times');
  const cueTimes = [...srt.matchAll(/^(\d\d):(\d\d):(\d\d),(\d{3}) --> (\d\d):(\d\d):(\d\d),(\d{3})$/gm)].map(m => [((+m[1] * 60 + +m[2]) * 60 + +m[3]) * 1000 + +m[4], ((+m[5] * 60 + +m[6]) * 60 + +m[7]) * 1000 + +m[8]]);
  expect(cueTimes.length === segs.length && cueTimes.every((c, i) => c[1] > c[0] && (i === 0 || c[0] >= cueTimes[i - 1][1])), 'SRT cues are in order and never overlap: ' + JSON.stringify(cueTimes));

  // 4) Fix a word by typing: plain text, copy and the saved result follow the edit.
  await page.click('#segs .vt-seg:first-child .vt-txt');
  await page.evaluate(() => { const d = document.querySelector('#segs .vt-seg .vt-txt'); d.textContent = 'Namaste everyone!'; d.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    window.__copied = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: s => { window.__copied = s; return Promise.resolve(); } } });
  });
  await page.click('#copyBtn');
  await page.waitForFunction(() => window.__copied !== null, null, { timeout: 5000 });
  const copied = await page.evaluate(() => window.__copied);
  expect(/^Namaste everyone! /.test(copied) && /Saturday/.test(copied), 'copied text has the edit: ' + JSON.stringify(copied));
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.voice-to-text.last') || 'null'));
  expect(saved && saved.segs[0].text === 'Namaste everyone!', 'edited line is saved on the device');

  // 5) Hindi sample with "Detect automatically" and the Base model: Hindi is found, and Base's Urdu-letter
  //    output is turned into (rough) Hindi letters.
  await page.click('#models [data-model="base"]');
  await page.click('#sampleHi');
  await page.waitForFunction(() => /hindi/.test(document.getElementById('fileName').textContent), null, { timeout: 15000 });
  expect(await page.inputValue('#langSel') === 'hi' && (await page.textContent('#scriptNote')).indexOf(t('note_rough')) === 0, 'Hindi sample + Base shows the rough-spelling note');
  await page.selectOption('#langSel', 'auto');
  await page.click('#runBtn');
  await finished();
  expect(await page.isHidden('#errBox'), 'no error on the Hindi sample: ' + (await page.textContent('#errText')));
  const stats = await page.$$eval('#stats .badge', bs => bs.map(b => b.textContent));
  log('Hindi stats: ' + JSON.stringify(stats));
  expect(stats.some(s => s.indexOf(t('lang_hi')) === 0 && s.indexOf(t('rough_spelling')) > 0), 'Hindi detected, marked as rough spelling: ' + JSON.stringify(stats));
  await page.click('#viewSeg [data-view="plain"]');
  const hiText = await page.textContent('#plain');
  log('Hindi (base): ' + JSON.stringify(hiText));
  expect(/नमस्ते/.test(hiText) && /बच्चे/.test(hiText) && !/[؀-ۿ]/.test(hiText), 'Hindi text in Devanagari with नमस्ते and बच्चे, no Urdu letters: ' + hiText);
  await page.click('#viewSeg [data-view="times"]');

  // 6) Record 2 seconds from the (fake) microphone; the recording becomes the new audio.
  await page.click('#recBtn');
  await page.waitForSelector('#recBox:not([hidden])', { timeout: 10000 });
  await page.waitForTimeout(2300);
  await page.click('#recStop');
  await page.waitForFunction(() => /^recording-/.test(document.getElementById('fileName').textContent), null, { timeout: 15000 });
  const recDur = (await page.textContent('#fileDur')).trim();
  expect(recDur === t('dur_s', { s: 2 }) || recDur === t('dur_s', { s: 3 }), 'recording is about 2 seconds: ' + recDur);
  expect(await page.isHidden('#recBox'), 'recording bar is hidden after stopping');
};
