/* Interaction test for the Photo Collage Maker (run by tools/verify.js in en and hi).
   Photos are plain colour blocks made in the page, so every pixel checked below is known in advance. */
const fs = require('fs');
module.exports = async function ({ page, lang, expect, t }) {
  const near = (a, b, tol) => Math.abs(a - b) <= (tol || 0.6);
  const st = () => page.evaluate(() => ({ layout: PCM.set.layout, shape: PCM.set.shape, cells: PCM.cellCount(), users: PCM.userCount(), sel: PCM.sel, size: PCM.exportSize() }));
  /* colour in the exported picture (normal size) at a point inside cell i: fx, fy are fractions of the cell */
  const px = (i, fx, fy) => page.evaluate(([i, fx, fy]) => {
    const c = PCM.exportCanvas(1), r = PCM.pxRects(c.width, c.height)[i];
    const d = c.getContext('2d').getImageData(Math.round(r.x + r.w * fx), Math.round(r.y + r.h * fy), 1, 1).data;
    return [d[0], d[1], d[2]];
  }, [i, fx === undefined ? 0.5 : fx, fy === undefined ? 0.5 : fy]);
  const is = (c, want) => c.every((v, k) => Math.abs(v - want[k]) <= 12);
  const RED = [255, 0, 0], GREEN = [0, 160, 0], BLUE = [0, 0, 255], YELLOW = [255, 255, 0], PINK = [255, 0, 255];
  /* a PNG file made on a canvas in the page; "split" = left half one colour, right half another */
  const png = async (name, w, h, css, css2) => {
    const b64 = await page.evaluate(([w, h, css, css2]) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.fillStyle = css; x.fillRect(0, 0, w, h);
      if (css2) { x.fillStyle = css2; x.fillRect(w / 2, 0, w / 2, h); }
      return c.toDataURL('image/png').split(',')[1];
    }, [w, h, css, css2 || '']);
    return { name, mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
  };
  const setRange = (id, v) => page.$eval(id, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, String(v));
  const centre = async (i) => { await page.$eval('#cv', (e) => e.scrollIntoView({ block: 'center' })); return page.evaluate((i) => PCM.centre(i), i); };
  const tap = async (i) => { const c = await centre(i); await page.mouse.click(c.x, c.y); await page.waitForTimeout(60); };
  const dragBy = async (i, dx, dy) => {
    const c = await centre(i);
    await page.mouse.move(c.x, c.y); await page.mouse.down();
    await page.mouse.move(c.x + dx / 2, c.y + dy / 2, { steps: 4 }); await page.mouse.move(c.x + dx, c.y + dy, { steps: 4 });
    await page.mouse.up(); await page.waitForTimeout(60);
  };
  const add = async (files) => {
    const before = await page.evaluate(() => PCM.userCount());
    await page.setInputFiles('#file', files);
    await page.waitForFunction((b) => PCM.userCount() !== b || document.querySelector('#file').value === '', before, { timeout: 20000 });
    await page.waitForTimeout(150);
  };

  await page.waitForSelector('#layouts .lay-btn', { timeout: 10000 });

  /* 0) opens with sample tiles in a 2 x 2 square, large size 2160 x 2160 */
  let s = await st();
  expect(s.layout === '4' && s.cells === 4 && s.users === 0 && s.shape === 'square', 'starts as a 2 x 2 square of sample tiles: ' + JSON.stringify(s));
  expect(s.size[0] === 2160 && s.size[1] === 2160, 'large square is 2160 x 2160');
  expect((await page.textContent('#note')).trim() === t('sample_note'), 'sample note shows');
  expect(await page.evaluate(() => [0, 1, 2, 3].every((i) => PCM.photo(i).sample > 0)), 'all four tiles are samples');
  expect(await page.$eval('#cv', (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4000) if (d[i] !== 255 || d[i + 1] !== 255 || d[i + 2] !== 255) n++; return n > 20; }), 'preview is drawn (not blank)');

  /* 1) geometry by hand: 1080 square, gap 20 -> g = 21.6; each cell (1080 - 3 x 21.6) / 2 = 507.6 wide, second column at 550.8 */
  await setRange('#gap', 20);
  let r = await page.evaluate(() => PCM.pxRects(1080, 1080));
  expect(r.length === 4 && near(r[0].x, 21.6) && near(r[0].y, 21.6) && near(r[0].w, 507.6) && near(r[0].h, 507.6) && near(r[1].x, 550.8) && near(r[3].y, 550.8), 'gap 20 cells: ' + JSON.stringify(r[0]) + ' ' + r[1].x);
  await setRange('#gap', 0);
  r = await page.evaluate(() => PCM.pxRects(1080, 1080));
  expect(near(r[0].x, 0) && near(r[0].w, 540) && near(r[3].x, 540) && near(r[3].y, 540), 'gap 0: four 540 px cells');
  await setRange('#gap', 20);

  /* 2) layouts and shapes */
  for (const [id, n] of [['2', 2], ['3', 3], ['5', 5], ['6', 6], ['7', 7], ['8', 8], ['9', 9], ['big2', 3], ['4', 4]]) {
    await page.click('#layouts [data-layout="' + id + '"]');
    expect((await st()).cells === n, 'layout ' + id + ' has ' + n + ' cells');
  }
  await page.click('#layouts [data-layout="cols"]');
  expect(!(await page.$eval('#stripsWrap', (e) => e.hidden)), 'strip count shows for strips');
  await page.click('#stripsSeg [data-strips="5"]');
  r = await page.evaluate(() => PCM.pxRects(1000, 1000));
  expect(r.length === 5 && r.every((c) => near(c.y, r[0].y) && near(c.w, r[0].w)) && r[0].h > r[0].w * 4, '5 tall strips side by side');
  await page.click('#layouts [data-layout="rows"]');
  r = await page.evaluate(() => PCM.pxRects(1000, 1000));
  expect(r.length === 5 && r.every((c) => near(c.x, r[0].x)) && r[0].w > r[0].h * 4, '5 wide strips top to bottom');
  const sizes = { portrait: [2160, 2700], story: [2160, 3840], wide: [3840, 2160], a4: [2480, 3508], square: [2160, 2160] };
  for (const k of Object.keys(sizes)) {
    await page.click('#shapeSeg [data-shape="' + k + '"]');
    s = await st();
    expect(s.size[0] === sizes[k][0] && s.size[1] === sizes[k][1], k + ' large size ' + s.size.join('x'));
    const box = await page.$eval('#cv', (c) => { const b = c.getBoundingClientRect(); return b.width / b.height; });
    expect(Math.abs(box - sizes[k][0] / sizes[k][1]) < 0.02, k + ' preview has the right shape: ' + box);
  }
  await page.click('#sizeSeg [data-size="normal"]');
  expect((await st()).size.join('x') === '1080x1080' && (await page.textContent('#sizePx')).includes('1080'), 'normal square is 1080 x 1080');
  await page.click('#shapeSeg [data-shape="wide"]'); await page.click('#layouts [data-layout="big2"]');
  r = await page.evaluate(() => PCM.pxRects(1920, 1080));
  expect(r.length === 3 && r[0].w > r[1].w * 1.8 && near(r[1].x, r[2].x) && r[2].y > r[1].y, '1 big on one side + 2 small stacked');
  await page.click('#shapeSeg [data-shape="square"]');
  await page.click('#layouts [data-layout="2"]');

  /* 3) three photos (the first is a big 3000 x 2000 one): layout follows the count, photos land in order */
  await add([await png('red.png', 3000, 2000, '#ff0000'), await png('green.png', 1200, 1600, '#00a000'), await png('blue.png', 800, 800, '#0000ff')]);
  s = await st();
  expect(s.users === 3 && s.layout === '3' && s.cells === 3, '3 photos -> 3-photo layout: ' + JSON.stringify(s));
  const p0 = await page.evaluate(() => PCM.photo(0));
  expect(p0.w === 2000 && p0.h === 1333 && !p0.sample, 'large photo is scaled down to 2000 px: ' + p0.w + 'x' + p0.h);
  expect(is(await px(0), RED) && is(await px(1), GREEN) && is(await px(2), BLUE), 'cells show red, green, blue');
  expect(await page.$eval('#note', (e) => e.hidden), 'no sample note when every box has a photo');
  expect((await page.textContent('#count')).includes('3'), 'photo count shows 3');

  /* background colour shows in the gap */
  await page.click('#swatches [data-color="#111111"]');
  const corner = await page.evaluate(() => { const c = PCM.exportCanvas(1); return [...c.getContext('2d').getImageData(4, 4, 1, 1).data].slice(0, 3); });
  expect(is(corner, [17, 17, 17]), 'dark background in the outer gap: ' + corner);
  /* rounded corners: the very corner of a cell is background, the middle is photo */
  await setRange('#round', 100);
  expect(is(await px(0, 0.002, 0.004), [17, 17, 17]) && is(await px(0, 0.5, 0.5), RED), 'rounded corner is cut away');
  await setRange('#round', 0);
  expect(is(await px(0, 0.002, 0.004), RED), 'square corner is photo again');

  /* 4) swap: tap one, tap another; then drag one onto another */
  await page.click('#modeSeg [data-mode="swap"]');
  await tap(0);
  expect((await st()).sel === 0, 'first tap selects photo 1');
  await tap(2);
  expect(is(await px(0), BLUE) && is(await px(2), RED) && (await st()).sel === -1, 'tap-tap swapped photo 1 and 3');
  const c1 = await centre(1), c0 = await centre(0);
  await dragBy(0, c1.x - c0.x, c1.y - c0.y);
  expect(is(await px(0), GREEN) && is(await px(1), BLUE) && is(await px(2), RED), 'drag swapped photo 1 and 2');

  /* 5) move and zoom: a 2000 x 1000 photo, yellow left half and pink right half, in a square cell */
  await add([await png('split.png', 2000, 1000, '#ffff00', '#ff00ff')]);
  s = await st();
  expect(s.users === 4 && s.layout === '4', '4 photos -> 2 x 2: ' + JSON.stringify(s));
  expect(is(await px(3, 0.25), YELLOW) && is(await px(3, 0.75), PINK), 'centred: left of the cell yellow, right pink');
  await page.click('#modeSeg [data-mode="move"]');
  const cellW = await page.evaluate(() => { const b = document.querySelector('#cv').getBoundingClientRect(); return PCM.pxRects(b.width, b.height)[3].w; });
  await dragBy(3, cellW * 0.45, 0);                        // pull the photo to the right: the yellow half fills the cell
  expect((await st()).sel === 3, 'dragging selects the photo');
  let ph = await page.evaluate(() => PCM.photo(3));
  expect(ph.fx < 0.3 && ph.fx >= 0.25 - 1e-6 && near(ph.fy, 0.5, 0.001), 'photo moved and stopped at its edge (fx 0.25): ' + ph.fx);
  expect(is(await px(3, 0.25), YELLOW) && is(await px(3, 0.75), YELLOW), 'the whole cell is yellow after the move');
  await dragBy(3, -cellW * 1.4, 0);                         // far to the left: stops at the other edge
  ph = await page.evaluate(() => PCM.photo(3));
  expect(near(ph.fx, 0.75, 0.001) && is(await px(3, 0.25), PINK), 'cannot be dragged past the edge: ' + ph.fx);
  await setRange('#zoom', 200);
  ph = await page.evaluate(() => PCM.photo(3));
  expect(ph.z === 2 && ph.fx <= 0.875 + 1e-6, 'zoom 2x: ' + JSON.stringify(ph));
  await page.focus('#cv'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('-');
  const ph2 = await page.evaluate(() => PCM.photo(3));
  expect(ph2.fx < ph.fx && ph2.z < 2, 'arrow key moves and minus key zooms out');
  await page.click('#fitBtn');
  ph = await page.evaluate(() => PCM.photo(3));
  expect(ph.fx === 0.5 && ph.fy === 0.5 && ph.z === 1, 'centre again resets the photo');

  /* 6) caption makes room at the bottom: band = 9% of 1080 = 97 px */
  await page.fill('#caption', lang === 'hi' ? 'वार्षिक उत्सव 2026' : 'Annual Day 2026');
  r = await page.evaluate(() => PCM.pxRects(1080, 1080));
  expect(r[3].y + r[3].h <= 1080 - 97 + 0.01, 'photos end above the caption band: ' + (r[3].y + r[3].h));
  const band = await page.evaluate(() => { const c = PCM.exportCanvas(1), d = c.getContext('2d').getImageData(0, 1080 - 97, 1080, 80).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200) n++; return n; });
  expect(band > 150, 'caption text is drawn in light ink on the dark background: ' + band);
  await page.fill('#caption', 'W'.repeat(80));
  expect(await page.evaluate(() => !!PCM.exportCanvas(1)), 'a very long caption still draws');
  await page.fill('#caption', '');
  r = await page.evaluate(() => PCM.pxRects(1080, 1080));
  expect(r[3].y + r[3].h > 1040, 'no caption: photos use the full height again');

  /* 7) downloads: PNG and JPG files with the promised pixel size */
  await page.click('#sizeSeg [data-size="large"]');
  let [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#pngBtn')]);
  expect(/^collage-\d{8}-\d{4}\.png$/.test(dl.suggestedFilename()), 'PNG name: ' + dl.suggestedFilename());
  let buf = fs.readFileSync(await dl.path());
  expect(buf.slice(1, 4).toString() === 'PNG' && buf.readUInt32BE(16) === 2160 && buf.readUInt32BE(20) === 2160, 'PNG is 2160 x 2160');
  [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#jpgBtn')]);
  buf = fs.readFileSync(await dl.path());
  expect(/\.jpg$/.test(dl.suggestedFilename()) && buf[0] === 0xff && buf[1] === 0xd8 && buf.length > 20000, 'JPG file, ' + buf.length + ' bytes');

  /* 8) limits and bad files: 4 + 7 photos -> only 9 fit; a broken file is skipped; one photo can be removed */
  const many = [];
  for (let i = 0; i < 7; i++) many.push(await png('p' + i + '.png', 300, 200, '#ff0000'));
  await add(many);
  s = await st();
  expect(s.users === 9 && s.layout === '9' && s.cells === 9, 'at most 9 photos: ' + JSON.stringify(s));
  await tap(8);
  await page.click('#removeBtn');
  s = await st();
  expect(s.users === 8 && s.layout === '9', 'removed one photo: ' + JSON.stringify(s));
  expect((await page.textContent('#note')).trim() === t('fill_note'), 'note says one box shows a sample tile');
  await page.click('#clearPhotos');
  expect((await st()).users === 0, 'all photos removed');
  await page.setInputFiles('#file', [{ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('this is not a picture') }, { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') }]);
  await page.waitForTimeout(600);
  expect((await st()).users === 0, 'broken files are skipped without a crash');
  await add([await png('huge.png', 6000, 4000, '#0000ff')]);
  ph = await page.evaluate(() => PCM.photo(0));
  expect((await st()).users === 1 && ph.w === 2000 && ph.h === 1333 && is(await px(0), BLUE), 'a 24-megapixel photo loads and is scaled down: ' + ph.w + 'x' + ph.h);

  /* 9) settings are remembered after a reload, photos are not kept; reset goes back to the start */
  await page.click('#shapeSeg [data-shape="story"]');
  await page.reload();
  await page.waitForSelector('#layouts .lay-btn');
  s = await st();
  expect(s.shape === 'story' && s.users === 0, 'shape remembered, photos not stored: ' + JSON.stringify(s));
  expect(await page.evaluate(() => PCM.set.bg) === '#111111', 'background colour remembered');
  await page.click('#resetBtn');
  s = await st();
  expect(s.shape === 'square' && s.layout === '4' && await page.evaluate(() => PCM.set.bg) === '#ffffff', 'reset: ' + JSON.stringify(s));
};
