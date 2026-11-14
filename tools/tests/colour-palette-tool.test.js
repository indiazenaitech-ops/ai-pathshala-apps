/* Interaction test for the Colour Palette Tool (run by tools/verify.js in en and hi).
   Part 1 checks the colour maths with known values (worked out independently of the app):
   HEX <-> RGB <-> HSL round trips, palettes of pure red, and WCAG contrast ratios (black on white = 21:1).
   Part 2 drives the UI: code inputs, bad codes, copy, save + reload, contrast checker, photo sampling, bad files, export. */
const fs = require('fs');

module.exports = async function ({ page, expect }) {
  await page.waitForSelector('#g-comp .cp-sw', { timeout: 10000 });

  /* ---------- 1) colour maths ---------- */
  const m = await page.evaluate(() => {
    const C = window.CPT, out = {};
    out.rgb = C.hexToRgb('#FF9933'); out.short = C.hexToRgb('abc'); out.lower = C.rgbToHex(C.hexToRgb('#ff9933'));
    out.bad = [C.hexToRgb('GGGGGG'), C.hexToRgb('#12345'), C.hexToRgb(''), C.hexToRgb(null)];
    out.red = C.rgbToHsl({ r: 255, g: 0, b: 0 });
    out.green = C.hslToRgb({ h: 120, s: 100, l: 25 });
    out.grey = C.rgbToHsl({ r: 128, g: 128, b: 128 });
    out.h360 = C.hslToRgb({ h: 360, s: 100, l: 50 });
    /* every 7th value of each channel: hex -> rgb -> hsl -> rgb -> hex must come back exactly */
    let n = 0, bad = [];
    for (let r = 0; r < 256; r += 7) for (let g = 0; g < 256; g += 7) for (let b = 0; b < 256; b += 7) {
      const hex = C.rgbToHex({ r, g, b }), back = C.rgbToHex(C.hslToRgb(C.rgbToHsl(C.hexToRgb(hex))));
      n++; if (back !== hex && bad.length < 5) bad.push(hex + '->' + back);
    }
    for (const hex of ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FF9933', '#138808', '#000080']) {
      const back = C.rgbToHex(C.hslToRgb(C.rgbToHsl(C.hexToRgb(hex)))); n++; if (back !== hex) bad.push(hex + '->' + back);
    }
    out.trips = n; out.tripBad = bad;
    out.ratios = [['#000000', '#FFFFFF'], ['#FFFFFF', '#000000'], ['#FFFFFF', '#FFFFFF'], ['#767676', '#FFFFFF'], ['#777777', '#FFFFFF'],
      ['#0000FF', '#FFFFFF'], ['#FF0000', '#FFFFFF'], ['#595959', '#FFFFFF']].map(([a, b]) => C.contrast(a, b));
    out.r21 = C.ratioText(C.contrast('#000000', '#FFFFFF')); out.rCut = C.ratioText(4.4999);
    out.badContrast = C.contrast('#zzz', '#FFFFFF');
    out.pRgb = [C.parseRgb('rgb(255, 153, 51)'), C.parseRgb('12 34 56'), C.parseRgb('300,0,0'), C.parseRgb('rgb(1,2)')];
    out.pHsl = [C.parseHsl('hsl(30, 100%, 60%)'), C.parseHsl('210 50 40'), C.parseHsl('400,0,0'), C.parseHsl('30,120%,50%')];
    out.comp = C.palette('comp', '#FF0000'); out.tri = C.palette('tri', '#FF0000'); out.ana = C.palette('ana', '#FF0000');
    out.shade = C.palette('shade', '#FF0000'); out.tint = C.palette('tint', '#FF0000');
    /* a fake picture: 70 % saffron, 25 % green, 5 % white */
    const px = []; for (let i = 0; i < 1000; i++) { const c = i < 700 ? [255, 153, 51] : i < 950 ? [19, 136, 8] : [255, 255, 255]; px.push(c[0], c[1], c[2], 255); }
    out.main = C.mainColours(new Uint8ClampedArray(px), 5);
    out.clear = C.mainColours(new Uint8ClampedArray(400), 5);       /* fully see-through */
    out.txt = C.paletteText('Test', ['#FF0000', '#00FF00']);
    return out;
  });
  const near = (a, b, d = 0.01) => Math.abs(a - b) <= d;
  expect(m.rgb.r === 255 && m.rgb.g === 153 && m.rgb.b === 51, '#FF9933 = rgb(255,153,51)');
  expect(m.short.r === 170 && m.short.g === 187 && m.short.b === 204 && m.lower === '#FF9933', 'short and lower-case hex');
  expect(m.bad.every((x) => x === null), 'invalid hex codes give null');
  expect(near(m.red.h, 0) && near(m.red.s, 100) && near(m.red.l, 50), 'red = hsl(0,100%,50%)');
  expect(m.green.r === 0 && m.green.g === 128 && m.green.b === 0, 'hsl(120,100%,25%) = rgb(0,128,0), got ' + JSON.stringify(m.green));
  expect(near(m.grey.s, 0) && near(m.grey.l, 50.196, 0.01), 'grey has no saturation');
  expect(m.h360.r === 255 && m.h360.g === 0 && m.h360.b === 0, 'hue 360 wraps to red');
  expect(m.trips > 50000 && m.tripBad.length === 0, `HEX->RGB->HSL->RGB->HEX round trip for ${m.trips} colours: ${m.tripBad.join(', ')}`);
  const [bw, wb, ww, g76, g77, blue, red, g59] = m.ratios;
  expect(bw === 21 && wb === 21 && ww === 1, 'black/white = 21:1 both ways, white/white = 1:1');
  expect(near(g76, 4.54) && near(g77, 4.48) && near(blue, 8.59) && near(red, 4.0) && near(g59, 7.0), 'known WCAG ratios: ' + m.ratios.map((x) => x.toFixed(2)).join(' '));
  expect(m.r21 === '21:1' && m.rCut === '4.49:1', 'ratio text is cut, never rounded up to a pass: ' + m.rCut);
  expect(m.badContrast !== m.badContrast, 'contrast of a bad code is NaN');
  expect(m.pRgb[0].g === 153 && m.pRgb[1].b === 56 && m.pRgb[2] === null && m.pRgb[3] === null, 'RGB input parsing');
  expect(m.pHsl[0].h === 30 && m.pHsl[0].l === 60 && m.pHsl[1].s === 50 && m.pHsl[2] === null && m.pHsl[3] === null, 'HSL input parsing');
  expect(m.comp.join() === '#FF0000,#00FFFF', 'complement of red is cyan: ' + m.comp);
  expect(m.tri.join() === '#FF0000,#00FF00,#0000FF', 'triad of red is red, green, blue: ' + m.tri);
  expect(m.ana.join() === '#FF0080,#FF0000,#FF8000', 'analogous of red (±30°): ' + m.ana);
  expect(m.shade.length === 5 && m.shade[4] === '#330000' && m.tint.length === 5 && m.tint[4] === '#FFCCCC', 'shades go darker, tints lighter: ' + m.shade + ' / ' + m.tint);
  expect(m.main[0] === '#FF9933' && m.main[1] === '#138808' && m.main.length === 3, 'main colours of a fake picture, biggest first: ' + m.main);
  expect(m.clear.length === 0, 'a see-through picture has no main colours');
  expect(m.txt.split('\r\n')[1] === '#FF0000    rgb(255, 0, 0)    hsl(0, 100%, 50%)', 'text list line: ' + m.txt);

  /* ---------- 2) base colour inputs ---------- */
  const val = (sel) => page.inputValue(sel);
  const hexes = (sel) => page.$$eval(sel + ' .cp-sw', (b) => b.map((x) => x.dataset.hex));
  await page.fill('#base-hex', '#0000ff');
  await page.waitForTimeout(50);
  expect((await val('#base-rgb')) === 'rgb(0, 0, 255)' && (await val('#base-hsl')) === 'hsl(240, 100%, 50%)', 'HEX typed: RGB and HSL fields follow');
  expect((await hexes('#g-comp')).join() === '#0000FF,#FFFF00', 'complement of blue is yellow');
  await page.fill('#base-rgb', 'rgb(255, 0, 0)');
  await page.waitForTimeout(50);
  expect((await val('#base-hex')) === '#FF0000' && (await page.inputValue('#base-pick')) === '#ff0000', 'RGB typed: HEX field and picker follow');
  await page.fill('#base-hsl', 'hsl(120, 100%, 25%)');
  await page.waitForTimeout(50);
  expect((await val('#base-hex')) === '#008000', 'HSL typed: HEX = #008000');
  /* a wrong code: red border, help message after leaving the field, palettes unchanged */
  await page.fill('#base-hex', '#12zz');
  await page.waitForTimeout(50);
  expect(await page.$eval('#base-hex', (e) => e.classList.contains('bad')), 'bad code gets a red border');
  await page.$eval('#base-hex', (e) => e.blur());
  await page.waitForTimeout(50);
  expect(!(await page.$eval('#base-err', (e) => e.hidden)), 'help message shows after leaving a bad field');
  expect((await hexes('#g-comp'))[0] === '#008000', 'palettes unchanged by a bad code');
  await page.fill('#base-hex', 'FF0000');
  await page.waitForTimeout(50);
  expect(await page.$eval('#base-err', (e) => e.hidden) && (await hexes('#g-tri')).join() === '#FF0000,#00FF00,#0000FF', 'a good code (no #) clears the error');

  /* ---------- 3) copy codes in the chosen format ---------- */
  await page.click('#fmt-rgb');
  await page.click('#g-tri .cp-sw:nth-child(2)');
  expect(await page.evaluate(() => window.CPT.lastCopied) === 'rgb(0, 255, 0)', 'tap copies the RGB code');
  await page.click('#fmt-hsl');
  await page.click('#g-comp .cp-sw:nth-child(2)');
  expect(await page.evaluate(() => window.CPT.lastCopied) === 'hsl(180, 100%, 50%)', 'tap copies the HSL code');
  await page.click('#fmt-hex');

  /* ---------- 4) export ---------- */
  const [dlTxt] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#g-tri .cp-txt')]);
  const txt = fs.readFileSync(await dlTxt.path(), 'utf8');
  expect(dlTxt.suggestedFilename().endsWith('.txt') && txt.includes('#00FF00    rgb(0, 255, 0)') && txt.split('\r\n').length >= 4, 'text list downloaded: ' + txt.slice(0, 80));
  const [dlPng] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#g-tri .cp-png')]);
  const png = fs.readFileSync(await dlPng.path());
  expect(dlPng.suggestedFilename().endsWith('.png') && png.length > 2000 && png.slice(1, 4).toString() === 'PNG', 'PNG swatch card downloaded (' + png.length + ' bytes)');

  /* ---------- 5) save palettes on the device ---------- */
  await page.click('#g-tri .cp-save');
  await page.click('#g-tri .cp-save');                     /* the same palette twice = saved once */
  await page.click('#g-shade .cp-save');
  await page.click('#tab-saved');
  expect((await page.$$('#saved-list .cp-group')).length === 2 && await page.$eval('#sv-empty', (e) => e.hidden), 'two palettes saved (duplicate ignored)');
  await page.reload();
  await page.waitForSelector('#saved-list .cp-group', { timeout: 10000, state: 'attached' });
  expect((await page.$$('#saved-list .cp-group')).length === 2 && !(await page.$eval('#pane-saved', (e) => e.hidden)), 'saved palettes and tab kept after reload');
  expect((await hexes('#saved-list .cp-group:nth-child(2)')).join() === '#FF0000,#00FF00,#0000FF', 'saved triad has the right colours');
  await page.click('#saved-list .cp-group:nth-child(1) .cp-del');
  expect((await page.$$('#saved-list .cp-group')).length === 1, 'a saved palette can be deleted');

  /* ---------- 6) contrast checker ---------- */
  await page.click('#tab-con');
  const pass = (id) => page.$eval('#' + id, (e) => e.dataset.pass);
  await page.fill('#c-fg-hex', '#000000');
  await page.fill('#c-bg-hex', '#FFFFFF');
  await page.waitForTimeout(50);
  expect((await page.textContent('#c-ratio')).trim() === '21:1', 'black on white shows 21:1');
  expect([await pass('c-n-aa'), await pass('c-n-aaa'), await pass('c-l-aa'), await pass('c-l-aaa')].join('') === '1111', 'black on white passes everything');
  await page.fill('#c-fg-hex', '#777777');
  await page.waitForTimeout(50);
  expect((await page.textContent('#c-ratio')).trim() === '4.47:1' || (await page.textContent('#c-ratio')).trim() === '4.48:1', 'grey 777 on white ≈ 4.48:1');
  expect((await pass('c-n-aa')) === '0' && (await pass('c-l-aa')) === '1' && (await pass('c-l-aaa')) === '0', '#777 fails normal text AA but passes large text AA');
  const sample = await page.$eval('#c-sample', (e) => [getComputedStyle(e).color, getComputedStyle(e).backgroundColor]);
  expect(sample[0] === 'rgb(119, 119, 119)' && sample[1] === 'rgb(255, 255, 255)', 'sample sentence drawn in the chosen colours: ' + sample);
  expect((await page.textContent('#c-sample .big')).trim().length > 5, 'sample sentence has text in the app language');
  await page.click('#c-swap');
  expect((await val('#c-fg-hex')) === '#FFFFFF' && (await val('#c-bg-hex')) === '#777777', 'swap exchanges text and background');
  await page.fill('#c-bg-hex', 'not a colour');
  await page.$eval('#c-bg-hex', (e) => e.blur());
  expect(!(await page.$eval('#c-err', (e) => e.hidden)), 'bad contrast code shows help');
  await page.fill('#c-bg-hex', 'hsl(0, 0%, 0%)');
  await page.waitForTimeout(50);
  expect((await page.textContent('#c-ratio')).trim() === '21:1' && await page.$eval('#c-err', (e) => e.hidden), 'HSL accepted in the contrast checker');

  /* ---------- 7) colours from a photo ---------- */
  await page.click('#tab-photo');
  expect(await page.$eval('#ph-work', (e) => e.hidden), 'no picture yet');
  /* a text file pretending to be a photo, and a broken "PNG" */
  await page.setInputFiles('#ph-file', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await page.waitForTimeout(200);
  expect(!(await page.$eval('#ph-err', (e) => e.hidden)), 'a non-image file shows a friendly error');
  await page.setInputFiles('#ph-file', { name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('this is not really a png') });
  await page.waitForSelector('#ph-err:not([hidden])', { timeout: 5000 });
  expect(await page.$eval('#ph-work', (e) => e.hidden), 'a broken image does not crash or show a picture');
  /* the built-in sample picture */
  await page.click('#ph-sample');
  await page.waitForTimeout(150);
  expect(!(await page.$eval('#ph-work', (e) => e.hidden)) && await page.$eval('#ph-err', (e) => e.hidden), 'sample picture shown, error cleared');
  const main = await hexes('#g-photo');
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const dist = (a, b) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]));
  expect(main.length >= 4 && dist(main[0], '#1D3557') < 20, 'main colours found, the big blue floor first: ' + main);
  expect(main.some((h) => dist(h, '#E63946') < 30) && main.some((h) => dist(h, '#F4F1DE') < 30), 'red petals and cream circle are among the main colours');
  await page.click('#ph-canvas');                           /* centre of the picture = teal circle */
  expect((await page.textContent('#ph-picked-code')).trim() === '#2A9D8F', 'tap picks the exact pixel colour');
  await page.click('#ph-use');
  expect(!(await page.$eval('#pane-pal', (e) => e.hidden)) && (await val('#base-hex')) === '#2A9D8F', 'picked colour becomes the base colour');
  /* a real PNG made on the fly: left half orange, right half green */
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 60; c.height = 40; const g = c.getContext('2d');
    g.fillStyle = '#FF6600'; g.fillRect(0, 0, 30, 40); g.fillStyle = '#006633'; g.fillRect(30, 0, 30, 40);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.click('#tab-photo');
  await page.setInputFiles('#ph-file', { name: 'shop.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') });
  await page.waitForFunction(() => document.querySelectorAll('#g-photo .cp-sw').length === 2, null, { timeout: 5000 });
  expect((await hexes('#g-photo')).sort().join() === '#006633,#FF6600', 'main colours of an uploaded photo (read on the device)');

  /* ---------- 8) reset ---------- */
  await page.click('#helpBox summary');
  await page.click('#resetAll');
  await page.waitForTimeout(100);
  expect((await val('#base-hex')) === '#FF9933' && (await page.$$('#saved-list .cp-group')).length === 0, 'reset restores the default colour and clears saved palettes');
};
