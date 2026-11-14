/* Interaction test for passport-photo-sheet: pixel sizes = mm at 300 dpi, copies per sheet, upload, bad file, export. */
module.exports = async function ({ page, expect, t, log }) {
  const px = mm => Math.round(mm * 300 / 25.4);
  const sheet = () => page.evaluate(() => { const c = document.getElementById('sheet'); return { w: c.width, h: c.height, n: +c.dataset.count, pw: +c.dataset.photoW, ph: +c.dataset.photoH }; });
  const settle = () => page.waitForTimeout(250);

  // 1) default: 35 x 45 mm on a 4 x 6 inch print, white border on -> 8 photos, sheet turned sideways
  await settle();
  let s = await sheet();
  expect(s.pw === 413 && s.ph === 531, '35x45 mm must be 413x531 px at 300 dpi, got ' + s.pw + 'x' + s.ph);
  expect(s.w === 1800 && s.h === 1200, '4x6 inch sheet must be 1800x1200 px, got ' + s.w + 'x' + s.h);
  expect(s.n === 8, '8 photos of 35x45 on 4x6, got ' + s.n);
  expect((await page.textContent('#countText')).includes('8'), 'count line shows 8');
  expect((await page.textContent('#photoNote')).trim() === t('sample_note'), 'sample note shown before a photo is chosen');

  // 2) layout maths for every preset on every paper, with and without the white border.
  //    Pixels = mm x 300 / 25.4, rounded: 35 -> 413.39 = 413, 45 -> 531.50 = 531 (531.496), 51 -> 602.36 = 602,
  //    25 -> 295.28 = 295; paper 4 x 6 in = 1200 x 1800, 5 x 7 in = 1500 x 2100, A4 210 x 297 mm = 2480.3 x 3507.9 = 2480 x 3508.
  //    Margin 2 mm = 24 px each side, border 1 mm = 12 px each side. Copies = floor((W - 48) / cell) x floor((H - 48) / cell),
  //    the better of upright and sideways. Worked out by hand, e.g. 35 x 45 with border on 4 x 6: cell 437 x 555;
  //    upright floor(1152/437)=2 x floor(1752/555)=3 = 6, sideways floor(1752/437)=4 x floor(1152/555)=2 = 8 -> 8.
  expect(px(35) === 413 && px(45) === 531 && px(51) === 602 && px(25) === 295, 'mm to px at 300 dpi (hand values)');
  const want = {
    true: {
      '4x6': { '35x45': 8, '51x51': 2, '25x35': 12 },
      'a4': { '35x45': 30, '51x51': 15, '25x35': 50 },
      '5x7': { '35x45': 9, '51x51': 6, '25x35': 18 }
    },
    false: {   // no border: cells are the bare photo, e.g. 25 x 35 on A4: upright floor(2432/295)=8 x floor(3460/413)=8 = 64
      '4x6': { '35x45': 8, '51x51': 2, '25x35': 12 },
      'a4': { '35x45': 32, '51x51': 20, '25x35': 64 },
      '5x7': { '35x45': 9, '51x51': 6, '25x35': 18 }
    }
  };
  const got = await page.evaluate(() => {
    const o = {};
    for (const bd of [true, false]) {
      o[bd] = {};
      for (const p in PPS.PAPERS) { o[bd][p] = {}; for (const z in PPS.PRESETS) { const L = PPS.layout(PPS.PAPERS[p][0], PPS.PAPERS[p][1], PPS.PRESETS[z][0], PPS.PRESETS[z][1], bd); o[bd][p][z] = { n: L.count, pw: L.pw, ph: L.ph, W: L.W, H: L.H, fitsW: L.x0 >= 24 && L.x0 + L.cols * L.cellW <= L.W - 24, fitsH: L.y0 >= 24 && L.y0 + L.rows * L.cellH <= L.H - 24 }; } }
    }
    return o;
  });
  const sizes = { '35x45': [413, 531], '51x51': [602, 602], '25x35': [295, 413] };
  const papers = { '4x6': [1200, 1800], 'a4': [2480, 3508], '5x7': [1500, 2100] };
  for (const bd of ['true', 'false']) for (const p in want[bd]) for (const z in want[bd][p]) {
    const g = got[bd][p][z];
    expect(g.n === want[bd][p][z], `${z} on ${p} (border ${bd}): expected ${want[bd][p][z]} photos, got ${g.n}`);
    expect(g.pw === sizes[z][0] && g.ph === sizes[z][1], `${z}: photo px ${g.pw}x${g.ph}`);
    expect(Math.min(g.W, g.H) === papers[p][0] && Math.max(g.W, g.H) === papers[p][1], `${p}: sheet px ${g.W}x${g.H}`);
    expect(g.fitsW && g.fitsH, `${z} on ${p} (border ${bd}): grid stays inside the 2 mm margin`);
  }

  // 3) choose a (large) photo: it is scaled down in memory, never uploaded
  const b64 = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 5200; c.height = 6500; const g = c.getContext('2d'); g.fillStyle = '#c33'; g.fillRect(0, 0, 5200, 6500); g.fillStyle = '#fff'; g.fillRect(1800, 1500, 1600, 2200); return c.toDataURL('image/jpeg', 0.6).split(',')[1]; });
  await page.setInputFiles('#fileIn', { name: 'big.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(b64, 'base64') });
  await page.waitForFunction(() => !PPS.state().sample, null, { timeout: 30000 });
  await settle();
  let st = await page.evaluate(() => PPS.state());
  expect(Math.max(st.srcW, st.srcH) <= 4000, 'huge photo is scaled down, got ' + st.srcW + 'x' + st.srcH);
  expect((await page.textContent('#photoNote')).trim() === t('photo_ready'), 'photo ready note');
  const edge = await page.evaluate(() => { const c = document.getElementById('sheet'); const d = c.getContext('2d').getImageData(Math.round(c.width / 2) - 30, Math.round(c.height / 2) - 30, 1, 1).data; return [d[0], d[1], d[2]]; });
  expect(edge[0] > 150 && edge[1] < 110, 'sheet shows the chosen photo (red corner of a tile), got ' + edge.join(','));

  // 4) a file that is not a picture must not break anything
  await page.setInputFiles('#fileIn', { name: 'notes.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('this is not a picture '.repeat(50)) });
  await page.waitForTimeout(600);
  await page.setInputFiles('#fileIn', { name: 'marks.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b\n1,2\n') });
  await page.waitForTimeout(300);
  st = await page.evaluate(() => PPS.state());
  expect(!st.sample && st.srcW > 0, 'previous photo kept after a bad file');

  // 4b) a phone photo saved sideways with EXIF orientation 6 (turn 90 degrees clockwise) is shown upright:
  //     stored 600 x 400 with a red left half -> shown 400 x 600 with the red half on top
  const side = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 600; c.height = 400; const g = c.getContext('2d'); g.fillStyle = '#00f'; g.fillRect(0, 0, 600, 400); g.fillStyle = '#f00'; g.fillRect(0, 0, 300, 400); return c.toDataURL('image/jpeg', 0.9).split(',')[1]; });
  let jpg = Buffer.from(side, 'base64');
  const exif = Buffer.from([0xFF, 0xE1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0, 0, 0x4D, 0x4D, 0, 0x2A, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, 6, 0, 0, 0, 0, 0, 0]);
  jpg = Buffer.concat([jpg.subarray(0, 2), exif, jpg.subarray(2)]);
  await page.setInputFiles('#fileIn', { name: 'phone.jpg', mimeType: 'image/jpeg', buffer: jpg });
  await page.waitForFunction(() => PPS.state().srcW === 400, null, { timeout: 15000 });
  await settle();
  st = await page.evaluate(() => PPS.state());
  const tb = await page.evaluate(() => { const c = document.getElementById('crop'), g = c.getContext('2d'); const at = (x, y) => Array.from(g.getImageData(Math.round(x), Math.round(y), 1, 1).data).slice(0, 3); return { top: at(c.width * 0.1, c.height * 0.05), bottom: at(c.width * 0.1, c.height * 0.95) }; });
  expect(st.srcW === 400 && st.srcH === 600, 'EXIF-rotated photo is upright 400x600, got ' + st.srcW + 'x' + st.srcH);
  expect(tb.top[0] > 180 && tb.top[2] < 90 && tb.bottom[2] > 180 && tb.bottom[0] < 90, 'red half on top after turning: ' + JSON.stringify(tb));

  // 5) zoom and pan stay inside the photo; arrow keys move the photo the same way as dragging
  await page.click('#zoomIn'); await page.click('#zoomIn');
  const box = await page.locator('#crop').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 4000, box.y + box.height / 2 + 4000, { steps: 4 }); await page.mouse.up();
  await settle();
  st = await page.evaluate(() => PPS.state());
  expect(st.z > 1.15 && st.z <= 4, 'zoomed in, z=' + st.z);
  const f0 = await page.evaluate(() => { const mm = [35, 45], s = PPS.state(); const sw = Math.min(s.srcW, s.srcH * mm[0] / mm[1]) / s.z; return { cx: s.cx, cy: s.cy, half: sw / 2 }; });
  expect(Math.abs(f0.cx - f0.half) < 0.5, 'dragging far right stops at the photo edge, cx=' + f0.cx + ' half=' + f0.half);
  await page.focus('#crop'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowUp'); await settle();
  st = await page.evaluate(() => PPS.state());
  expect(st.cx > f0.cx && st.cy > f0.cy, 'ArrowLeft / ArrowUp move the photo left / up (frame moves right / down)');
  const one = await page.evaluate(() => PPS.photoSize());
  expect(one[0] === 413 && one[1] === 531, 'single photo is still 413x531');

  // 6) 51 x 51 mm on A4
  await page.click('#sizeOpts [data-size="51x51"]'); await page.click('#paperOpts [data-paper="a4"]'); await settle();
  s = await sheet();
  expect(s.pw === 602 && s.ph === 602, '51x51 mm = 602x602 px, got ' + s.pw + 'x' + s.ph);
  expect(s.w === 2480 && s.h === 3508 && s.n === 15, 'A4 2480x3508 with 15 photos, got ' + JSON.stringify(s));

  // 7) custom size 40 x 50 mm; then one that is bigger than the paper
  await page.click('#sizeOpts [data-size="custom"]');
  await page.fill('#cw', '40'); await page.fill('#ch', '50'); await settle();
  s = await sheet();
  expect(s.pw === px(40) && s.ph === px(50), 'custom 40x50 mm = 472x591 px, got ' + s.pw + 'x' + s.ph);
  await page.click('#paperOpts [data-paper="4x6"]'); await page.fill('#cw', '150'); await page.fill('#ch', '150'); await settle();
  s = await sheet();
  expect(s.n === 0 && await page.isDisabled('#dlJpg'), 'too-big photo: nothing fits and sheet download is off');
  expect((await page.textContent('#countText')).trim() === t('err_no_fit'), 'no-fit message shown');

  // 8) 35 x 45 on A4 without the white border -> 32; JPG says 300 dpi; download works
  await page.click('#sizeOpts [data-size="35x45"]'); await page.click('#paperOpts [data-paper="a4"]');
  await page.uncheck('#optBorder'); await settle();
  s = await sheet();
  expect(s.n === 32 && s.w === 3508 && s.h === 2480, '35x45 on A4 without border: 32 on a sideways sheet, got ' + JSON.stringify(s));
  const head = await page.evaluate(() => PPS.jpgHead());
  expect(head[0] === 255 && head[1] === 216 && head[13] === 1 && head[14] * 256 + head[15] === 300 && head[16] * 256 + head[17] === 300, 'JPG header carries 300 dpi: ' + head.join(' '));
  // PNG: a pHYs chunk right after IHDR, 300 dpi = 11811 pixels per metre (0x2E23), unit 1 = metre
  const ph = await page.evaluate(() => PPS.pngHead());
  const u32 = i => ((ph[i] << 24) >>> 0) + (ph[i + 1] << 16) + (ph[i + 2] << 8) + ph[i + 3];
  expect(ph[0] === 0x89 && String.fromCharCode(ph[37], ph[38], ph[39], ph[40]) === 'pHYs' && u32(33) === 9 && u32(41) === 11811 && u32(45) === 11811 && ph[49] === 1, 'PNG carries 300 dpi: ' + ph.slice(33, 50).join(' '));
  const [d1] = await Promise.all([page.waitForEvent('download'), page.click('#dlJpg')]);
  expect(/^passport-photo-sheet-35x45mm-a4\.jpg$/.test(d1.suggestedFilename()), 'sheet file name: ' + d1.suggestedFilename());
  const [d2] = await Promise.all([page.waitForEvent('download'), page.click('#dlOne')]);
  expect(/^passport-photo-35x45mm\.jpg$/.test(d2.suggestedFilename()), 'single file name: ' + d2.suggestedFilename());

  // 9) settings survive a reload; the photo itself is not stored
  await page.reload(); await page.waitForTimeout(900);
  st = await page.evaluate(() => PPS.state());
  expect(st.paper === 'a4' && st.border === false && st.sample === true, 'settings kept, photo not kept: ' + JSON.stringify(st));
  log('all passport-photo-sheet checks passed');
};
