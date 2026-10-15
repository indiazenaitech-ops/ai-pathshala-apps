/* Interaction test for AI Photo Enhancer (run by tools/verify.js in en and hi).
   Sample photo (224 × 168) → time estimate shown → start + Cancel + start again → Quick AI model (smallest, 5.5 MB) at 2× → result is 448 × 336 and still looks like
   the photo (not garbage), and is not just a plain smooth resize; quick fixes change pixels; Black & white gives
   grey pixels; downloads have the right size and format (PNG at original size, JPG at enhanced size). */
const fs = require('fs');

function pngSize(b) { return b.slice(1, 4).toString() === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null; }
function jpgSize(b) {
  if (b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xC3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  return null;
}

module.exports = async function ({ page, expect, t, log }) {
  const state = () => page.evaluate(() => document.getElementById('app').dataset.state);
  const dims = () => page.evaluate(() => { const c = document.getElementById('cvAfter'); return [c.width, c.height]; });
  /* compare the result canvas with the original photo (both brought to the original size) */
  const stats = () => page.evaluate(async () => {
    const after = document.getElementById('cvAfter'), before = document.getElementById('cvBefore');
    const W = 224, H = 168;
    function small(c) { const s = document.createElement('canvas'); s.width = W; s.height = H; const x = s.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, W, H); return x.getImageData(0, 0, W, H).data; }
    const img = new Image(); img.src = window.PE_SAMPLE.src; await img.decode();
    const o = document.createElement('canvas'); o.width = W; o.height = H; o.getContext('2d').drawImage(img, 0, 0);
    const a = small(after), orig = o.getContext('2d').getImageData(0, 0, W, H).data;
    let diff = 0, grey = 0;
    for (let i = 0; i < a.length; i += 4) {
      diff += Math.abs(a[i] - orig[i]) + Math.abs(a[i + 1] - orig[i + 1]) + Math.abs(a[i + 2] - orig[i + 2]);
      if (a[i] === a[i + 1] && a[i + 1] === a[i + 2]) grey++;
    }
    /* at full size: how far the AI result is from the smooth "before" resize */
    const A = after.getContext('2d').getImageData(0, 0, after.width, after.height).data;
    const B = before.getContext('2d').getImageData(0, 0, before.width, before.height).data;
    let vsSmooth = 0;
    if (A.length === B.length) for (let i = 0; i < A.length; i += 4) vsSmooth += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]);
    return { diff: diff / (W * H * 3), grey: grey / (W * H), vsSmooth: A.length === B.length ? vsSmooth / (A.length / 4 * 3) : -1 };
  });

  // 1. sample photo
  await page.click('#sampleBtn');
  await page.waitForFunction(() => document.getElementById('app').dataset.state === 'ready', null, { timeout: 10000 });
  let d = await dims();
  expect(d[0] === 224 && d[1] === 168, 'sample loaded at 224 x 168, got ' + d);
  expect(await page.isEnabled('#enhanceBtn'), 'Enhance button enabled once a photo is loaded');
  const note = await page.textContent('#aiNote');
  expect(note.includes('MB'), 'download size shown before the first download');
  expect(note.includes(t('est_time', { t: '@' }).split('@')[0]), 'time estimate shown before starting: ' + note);

  // 2. AI upscale 2x with the smallest model
  await page.click('#scale-2');
  await page.click('#model-quick');
  expect(await page.getAttribute('#model-quick', 'aria-pressed') === 'true', 'Quick model selected');
  // cancel while it loads, then start again: nothing may get stuck
  await page.click('#enhanceBtn');
  await page.waitForTimeout(300);
  await page.click('#cancelBtn');
  expect(await state() === 'ready' && await page.isEnabled('#enhanceBtn'), 'Cancel stops the run and Enhance works again');
  await page.click('#enhanceBtn');
  await page.waitForFunction(() => /done|error/.test(document.getElementById('app').dataset.state), null, { timeout: 100000 });
  const st = await state();
  expect(st === 'done', 'AI finished, state=' + st + ' ' + (await page.textContent('#errText')));
  d = await dims();
  expect(d[0] === 448 && d[1] === 336, 'AI result is 2x (448 x 336), got ' + d);
  let s = await stats();
  log('AI vs original', JSON.stringify(s));
  expect(s.diff < 14, 'AI result still matches the photo (mean difference ' + s.diff.toFixed(2) + ')');
  expect(s.vsSmooth > 1.5, 'AI result differs from a plain smooth resize (' + s.vsSmooth.toFixed(2) + ')');
  expect((await page.textContent('#badges')).includes('2×'), 'AI badge shows 2×');
  expect((await page.textContent('#sizeInfo')).includes('448'), 'size info shows the new width');

  // 3. quick fixes on top of the AI result
  await page.check('#fixAuto');
  await page.waitForTimeout(400);
  const s2 = await stats();
  expect(Math.abs(s2.diff - s.diff) > 0.5, 'Auto fix changes the pixels (' + s.diff.toFixed(2) + ' -> ' + s2.diff.toFixed(2) + ')');
  await page.click('#color-bw');
  await page.waitForTimeout(400);
  const s3 = await stats();
  expect(s3.grey > 0.97, 'Black & white makes grey pixels: ' + s3.grey.toFixed(3));
  await page.click('#color-keep');
  await page.uncheck('#fixAuto');

  // 4. downloads: PNG at original size, JPG at enhanced size
  await page.click('#fmt-png');
  await page.click('#size-orig');
  let [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#dlBtn')]);
  let buf = fs.readFileSync(await dl.path());
  let sz = pngSize(buf);
  expect(sz && sz[0] === 224 && sz[1] === 168, 'PNG saved at original size 224 x 168, got ' + sz);
  expect(/\.png$/.test(dl.suggestedFilename()), 'png file name: ' + dl.suggestedFilename());
  await page.click('#fmt-jpg');
  await page.click('#size-enh');
  [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#dlBtn')]);
  buf = fs.readFileSync(await dl.path());
  sz = jpgSize(buf);
  expect(sz && sz[0] === 448 && sz[1] === 336, 'JPG saved at enhanced size 448 x 336, got ' + sz);
  expect(/_2x\.jpg$/.test(dl.suggestedFilename()), 'jpg file name: ' + dl.suggestedFilename());

  // 5. settings survive a reload
  await page.reload();
  await page.waitForTimeout(800);
  expect(await page.getAttribute('#model-quick', 'aria-pressed') === 'true' && await page.getAttribute('#fmt-jpg', 'aria-pressed') === 'true', 'settings saved');
};
