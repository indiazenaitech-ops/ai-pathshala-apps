/* Interaction test for GIF Maker (run by tools/verify.js in en and hi).
   Frames are made in the page (solid-colour PNGs and a short WebM recorded from a canvas), the GIF is encoded by the
   app, and the bytes are then checked here block by block: header, size, frame count, loop block, delays, and every
   frame's LZW data is decoded back to pixels to prove the colours are right. Chrome's own ImageDecoder must agree. */
const fs = require('fs');

function parseGif(b) {
  const g = { header: b.slice(0, 6).toString('latin1'), w: b[6] | (b[7] << 8), h: b[8] | (b[9] << 8), frames: [], loop: null, apps: [], trailer: false };
  let p = 10;
  const packed = b[p]; p += 3;
  const table = (n) => { const t = []; for (let i = 0; i < n; i++) t.push([b[p + i * 3], b[p + i * 3 + 1], b[p + i * 3 + 2]]); p += n * 3; return t; };
  g.gct = (packed & 0x80) ? table(1 << ((packed & 7) + 1)) : null;
  const sub = () => { const parts = []; for (;;) { const n = b[p++]; if (n === undefined) throw new Error('file ends inside a block'); if (!n) break; parts.push(b.slice(p, p + n)); p += n; } return Buffer.concat(parts); };
  let gce = null;
  while (p < b.length) {
    const id = b[p++];
    if (id === 0x3B) { g.trailer = true; break; }
    if (id === 0x21) {
      const label = b[p++];
      if (label === 0xF9) { const sz = b[p++], pk = b[p]; gce = { disposal: (pk >> 2) & 7, transparent: !!(pk & 1), delay: b[p + 1] | (b[p + 2] << 8), tIndex: b[p + 3] }; p += sz + 1; }
      else if (label === 0xFF) { const sz = b[p++], app = b.slice(p, p + sz).toString('latin1'); p += sz; const d = sub(); g.apps.push(app); if (app === 'NETSCAPE2.0') g.loop = d[1] | (d[2] << 8); }
      else sub();
      continue;
    }
    if (id !== 0x2C) throw new Error('unknown block 0x' + id.toString(16));
    const f = { x: b[p] | (b[p + 1] << 8), y: b[p + 2] | (b[p + 3] << 8), w: b[p + 4] | (b[p + 5] << 8), h: b[p + 6] | (b[p + 7] << 8) };
    const pk = b[p + 8]; p += 9;
    f.lct = (pk & 0x80) ? table(1 << ((pk & 7) + 1)) : null;
    f.gce = gce; gce = null;
    const min = b[p++];
    f.idx = lzwDecode(sub(), min, f.w * f.h);
    g.frames.push(f);
  }
  return g;
}
function lzwDecode(data, min, npix) {
  const clear = 1 << min, eoi = clear + 1, pre = new Int32Array(4096), suf = new Uint8Array(4096), fst = new Uint8Array(4096), len = new Int32Array(4096);
  for (let i = 0; i < clear; i++) { pre[i] = -1; suf[i] = i; fst[i] = i; len[i] = 1; }
  let size = min + 1, next = eoi + 1, bit = 0, old = -1, o = 0;
  const out = new Uint8Array(npix);
  const read = () => { let v = 0; for (let i = 0; i < size; i++) { const by = data[(bit + i) >> 3]; if (by === undefined) return -1; v |= ((by >> ((bit + i) & 7)) & 1) << i; } bit += size; return v; };
  const emit = (c) => { let k = c; for (let i = len[c] - 1; i >= 0; i--) { if (o + i < npix) out[o + i] = suf[k]; k = pre[k]; } o += len[c]; };
  for (;;) {
    const c = read();
    if (c < 0) throw new Error('LZW data ended early at pixel ' + o + '/' + npix);
    if (c === clear) { size = min + 1; next = eoi + 1; old = -1; continue; }
    if (c === eoi) break;
    if (old < 0) { emit(c); old = c; continue; }
    if (c > next) throw new Error('bad LZW code ' + c);
    const fc = c < next ? fst[c] : fst[old];
    if (next < 4096) { pre[next] = old; suf[next] = fc; fst[next] = fst[old]; len[next] = len[old] + 1; next++; if (next === (1 << size) && size < 12) size++; }
    emit(c); old = c;
  }
  if (o !== npix) throw new Error('LZW gave ' + o + ' pixels, frame needs ' + npix);
  return out;
}
/* draw every frame on top of the previous one (disposal 1 = keep), like a browser does */
function composite(g) {
  const cv = new Uint8Array(g.w * g.h * 3), res = [];
  for (const f of g.frames) {
    const pal = f.lct || g.gct;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const v = f.idx[y * f.w + x];
      if (f.gce && f.gce.transparent && v === f.gce.tIndex) continue;
      const o = ((f.y + y) * g.w + f.x + x) * 3, c = pal[v];
      cv[o] = c[0]; cv[o + 1] = c[1]; cv[o + 2] = c[2];
    }
    res.push(cv.slice());
  }
  return res;
}

module.exports = async function ({ page, lang, expect, t }) {
  const near = (c, want, tol) => c.every((v, k) => Math.abs(v - want[k]) <= (tol || 40));
  const RED = [255, 0, 0], GREEN = [0, 170, 0], BLUE = [0, 0, 255], BLACK = [0, 0, 0];
  const png = async (name, w, h, css) => {
    const b64 = await page.evaluate(([w, h, css]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = css; x.fillRect(0, 0, w, h); return c.toDataURL('image/png').split(',')[1]; }, [w, h, css]);
    return { name, mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
  };
  const make = async () => {
    const before = await page.evaluate(() => GIFM.made);
    await page.click('#makeBtn');
    await page.waitForFunction((b) => GIFM.made > b && !GIFM.busy, before, { timeout: 60000 });
    const buf = Buffer.from(await page.evaluate(() => GIFM.resultBase64()), 'base64');
    return { buf, g: parseGif(buf) };
  };
  const chromeDecode = (buf) => page.evaluate(async (b64) => {
    if (typeof ImageDecoder !== 'function') return null;
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const d = new ImageDecoder({ data: u, type: 'image/gif' }); await d.tracks.ready; await d.completed;
    const tr = d.tracks.selectedTrack, f = await d.decode({ frameIndex: 0 });
    return { n: tr.frameCount, rep: tr.repetitionCount === Infinity ? 'inf' : tr.repetitionCount, w: f.image.displayWidth, h: f.image.displayHeight };
  }, buf.toString('base64'));
  const pxAt = (frame, g, x, y) => { const o = (y * g.w + x) * 3; return [frame[o], frame[o + 1], frame[o + 2]]; };

  await page.waitForSelector('#phList .ph', { timeout: 10000 });

  /* 0) opens with 6 sample frames ready to use */
  let items = await page.evaluate(() => GIFM.items());
  expect(items.length === 6 && items.every((p) => p.sample), 'starts with 6 sample frames');
  expect(!(await page.$eval('#makeBtn', (b) => b.disabled)), 'Make is ready with the samples');
  expect(!(await page.$eval('#sampleNote', (e) => e.hidden)), 'sample note shows');

  /* 1) three photos plus a text file: the text file is left out, samples are replaced */
  await page.setInputFiles('#photoFile', [await png('red.png', 900, 600, '#ff0000'), await png('blue.png', 300, 300, '#0000ff'),
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a picture') }, await png('green.png', 400, 800, '#00aa00')]);
  await page.waitForFunction(() => GIFM.items().length === 3 && !GIFM.items().some((p) => p.sample), null, { timeout: 20000 });
  items = await page.evaluate(() => GIFM.items());
  expect(items.map((p) => p.name).join() === 'red.png,blue.png,green.png', 'photos in the order picked: ' + items.map((p) => p.name));
  expect((await page.textContent('#photoCount')).includes('3'), 'count shows 3 photos');
  expect(await page.$eval('#sampleNote', (e) => e.hidden), 'sample note gone');

  /* 2) reorder: move green earlier -> red, green, blue; give photo 2 one and a half seconds */
  await page.click('[data-fk="p2"]');
  items = await page.evaluate(() => GIFM.items());
  expect(items.map((p) => p.name).join() === 'red.png,green.png,blue.png', 'green moved earlier: ' + items.map((p) => p.name));
  await page.fill('[data-fk="t1"]', '1.5'); await page.dispatchEvent('[data-fk="t1"]', 'change');
  await page.click('#widthSeg [data-w="320"]');
  await page.click('#shapeSeg [data-shape="square"]');
  await page.click('#fitSeg [data-fit="contain"]');
  await page.click('#swatches [data-color="#111111"]');
  expect((await page.textContent('#sizePx')).includes('320 × 320'), 'size shows 320 x 320');

  /* 3) make it and read the file block by block */
  let { buf, g } = await make();
  expect(g.header === 'GIF89a', 'file starts with GIF89a, got ' + g.header);
  expect(g.w === 320 && g.h === 320, 'screen size 320 x 320, got ' + g.w + 'x' + g.h);
  expect(g.frames.length === 3, '3 frames, got ' + g.frames.length);
  expect(g.apps.includes('NETSCAPE2.0') && g.loop === 0, 'loop block present and set to forever: ' + g.apps + ' ' + g.loop);
  expect(g.frames.map((f) => f.gce.delay).join() === '100,150,100', 'delays 1 s, 1.5 s, 1 s: ' + g.frames.map((f) => f.gce.delay));
  expect(g.trailer, 'file ends with the trailer byte');
  let fr = composite(g);
  expect(near(pxAt(fr[0], g, 160, 160), RED) && near(pxAt(fr[1], g, 160, 160), GREEN) && near(pxAt(fr[2], g, 160, 160), BLUE), 'decoded centres are red, green, blue: ' + [0, 1, 2].map((i) => pxAt(fr[i], g, 160, 160)).join(' / '));
  expect(near(pxAt(fr[0], g, 160, 4), [17, 17, 17], 12) && near(pxAt(fr[1], g, 4, 160), [17, 17, 17], 12), 'whole photo shown: dark bars above the wide photo and beside the tall one');
  expect(Math.abs(buf.length - (await page.evaluate(() => GIFM.result().size))) === 0, 'shown size is the real file size');
  const shown = await page.textContent('#resInfo');
  expect(shown.includes('KB') && shown.includes('320 × 320') && shown.includes('3'), 'result line shows size, pixels and frames: ' + shown);
  const cd = await chromeDecode(buf);
  if (cd) expect(cd.n === 3 && cd.rep === 'inf' && cd.w === 320 && cd.h === 320, 'Chrome decodes 3 frames, endless loop: ' + JSON.stringify(cd));
  const imgOk = await page.$eval('#resImg', (i) => i.complete && i.naturalWidth === 320);
  expect(imgOk, 'preview image shows the GIF');

  /* 4) fill the frame: no bars any more */
  await page.click('#fitSeg [data-fit="cover"]');
  ({ g } = await make());
  fr = composite(g);
  expect(near(pxAt(fr[0], g, 160, 4), RED) && near(pxAt(fr[1], g, 4, 160), GREEN), 'cover fills the whole frame');

  /* 5) play 3 times -> loop count 2 (browsers play once + repeat count); play once -> no loop block */
  await page.click('#loopSeg [data-loop="times"]');
  await page.fill('#times', '3'); await page.dispatchEvent('#times', 'change');
  ({ g } = await make());
  expect(g.loop === 2, 'play 3 times writes repeat count 2, got ' + g.loop);
  expect((await page.textContent('#resLoop')).trim() === t('res_loop_n', { n: 3 }), 'result says it plays 3 times');
  await page.fill('#times', '1'); await page.dispatchEvent('#times', 'change');
  ({ g } = await make());
  expect(!g.apps.includes('NETSCAPE2.0'), 'play once has no loop block');
  await page.click('#loopSeg [data-loop="forever"]');

  /* 6) caption: white letters appear at the bottom of the red frame */
  await page.fill('#caption', 'Shabash! शाबाश'); await page.dispatchEvent('#caption', 'input');
  ({ g } = await make());
  fr = composite(g);
  let white = 0;
  for (let y = 250; y < 320; y++) for (let x = 0; x < 320; x++) { const c = pxAt(fr[0], g, x, y); if (c[0] > 220 && c[1] > 220 && c[2] > 220) white++; }
  expect(white > 60, 'caption letters drawn at the bottom: ' + white + ' white pixels');
  await page.fill('#caption', ''); await page.dispatchEvent('#caption', 'input');

  /* 7) cancel straight away: nothing new is made */
  const madeBefore = await page.evaluate(() => GIFM.made);
  await page.evaluate(() => { document.querySelector('#makeBtn').click(); document.querySelector('#cancelBtn').click(); });
  await page.waitForFunction(() => !GIFM.busy, null, { timeout: 20000 });
  expect((await page.evaluate(() => GIFM.made)) === madeBefore, 'cancel made no new GIF');
  expect((await page.textContent('#doneMsg')).trim() === t('st_cancelled'), 'cancel message shows');

  /* 8) video: a 2.4 s clip made here (red, green, blue, yellow parts and a moving white box) */
  const vb64 = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 320; c.height = 240; const x = c.getContext('2d');
    const s = c.captureStream(0), tr = s.getVideoTracks()[0], type = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm';
    const r = new MediaRecorder(s, { mimeType: type }), ch = [];
    r.ondataavailable = (e) => ch.push(e.data); const done = new Promise((res) => { r.onstop = res; });
    /* colours follow the clock (0.6 s each), like the recorder's timestamps, so a slow machine can't shift them */
    const cols = ['#ff0000', '#00c000', '#0000ff', '#ffff00'];
    const paint = (ms) => { x.fillStyle = cols[Math.min(3, Math.floor(ms / 600))]; x.fillRect(0, 0, 320, 240); x.fillStyle = '#fff'; x.fillRect(ms / 9, 100, 30, 30); };
    paint(0);
    const started = new Promise((res) => { r.onstart = res; });
    r.start(); await started; await new Promise((z) => setTimeout(z, 100));
    tr.requestFrame();
    const t0 = performance.now();
    for (let ms = 0; ms < 2400; ms = performance.now() - t0) { await new Promise((z) => setTimeout(z, 30)); paint(performance.now() - t0); tr.requestFrame(); }
    r.stop(); await done;
    const u = new Uint8Array(await new Blob(ch).arrayBuffer()); let str = ''; for (let i = 0; i < u.length; i += 0x8000) str += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(str);
  });
  await page.click('#modeSeg [data-mode="video"]');
  expect(await page.$eval('#makeBtn', (b) => b.disabled), 'Make waits for a video');
  await page.setInputFiles('#videoFile', { name: 'clip.webm', mimeType: 'video/webm', buffer: Buffer.from(vb64, 'base64') });
  await page.waitForFunction(() => GIFM.video().ok, null, { timeout: 30000 });
  await page.fill('#endIn', '2'); await page.dispatchEvent('#endIn', 'change');
  await page.click('#widthSeg [data-w="240"]');
  const v = await page.evaluate(() => GIFM.video());
  expect(v.start === 0 && Math.abs(v.end - 2) < 0.01 && v.frames === 20, '2 s at 10 fps = 20 frames: ' + JSON.stringify(v));
  ({ buf, g } = await make());
  expect(g.header === 'GIF89a' && g.w === 240 && g.h === 180, 'video GIF is 240 x 180: ' + g.w + 'x' + g.h);
  expect(g.frames.length === 20, '20 frames, got ' + g.frames.length);
  expect(g.gct && g.loop === 0, 'one shared palette and the loop block');
  expect(g.frames.reduce((a, f) => a + f.gce.delay, 0) === 200, 'delays add up to 2 s');
  expect(g.frames.slice(1).some((f) => f.gce.transparent && f.w * f.h < 240 * 180), 'later frames store only the changed part');
  /* what the clip really shows at 0, 0.1, 0.2 ... s, read with a separate video element (recorder timestamps vary) */
  const ref = await page.evaluate(async (b64) => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const vv = document.createElement('video'); vv.muted = true; vv.src = URL.createObjectURL(new Blob([u], { type: 'video/webm' }));
    await new Promise((res) => { vv.onloadeddata = res; vv.onerror = res; setTimeout(res, 10000); });
    const c = document.createElement('canvas'); c.width = 32; c.height = 24; const x = c.getContext('2d'), out = [];
    for (let i = 0; i < 20; i++) {
      await new Promise((res) => { vv.onseeked = res; vv.currentTime = i / 10; setTimeout(res, 4000); });
      x.drawImage(vv, 0, 0, 32, 24); const d = x.getImageData(1, 1, 1, 1).data; out.push([d[0], d[1], d[2]]);
    }
    return out;
  }, vb64);
  fr = composite(g);
  const got = fr.map((f) => pxAt(f, g, 10, 10)), bad = got.map((c, i) => near(c, ref[i], 60) ? '' : i + ':' + c + '≠' + ref[i]).filter(Boolean);
  expect(!bad.length, 'every video frame has the clip\'s colour at that moment: ' + bad.slice(0, 4).join(' '));
  expect(new Set(ref.map((c) => c.map((x) => x >> 6).join())).size >= 2, 'the clip part has at least 2 colours, so the check means something');

  /* 9) the same frames as a WebM video, where the browser can record one */
  if (await page.evaluate(() => !!GIFM.rec.webm)) {
    if (await page.$eval('#vfmtSeg', (e) => !e.hidden)) await page.click('#vfmtSeg [data-vfmt="webm"]');
    expect((await page.textContent('#vidOutLbl')).includes('WebM'), 'button names the WebM format');
    expect((await page.textContent('#vidOutNote')).includes(t('webm_note')), 'WebM limits are explained');
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#vidOutBtn')]);
    const vb = fs.readFileSync(await dl.path());
    expect(vb.length > 500 && vb.readUInt32BE(0) === 0x1A45DFA3 && /\.webm$/.test(dl.suggestedFilename()), 'WebM file saved: ' + dl.suggestedFilename() + ' ' + vb.length);
  }

  /* 10) a file that is not a video is refused politely */
  await page.setInputFiles('#videoFile', { name: 'broken.mp4', mimeType: 'video/mp4', buffer: Buffer.from('this is not a video at all') });
  await page.waitForFunction(() => !GIFM.video().ok && document.querySelector('#videoMsg').style.color !== '', null, { timeout: 30000 });
  expect((await page.textContent('#videoMsg')).trim() === t('video_bad'), 'bad video message shows');
  expect(await page.$eval('#makeBtn', (b) => b.disabled), 'Make is off without a playable video');
};
