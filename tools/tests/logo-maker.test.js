/* Interaction test for Logo Maker (run by tools/verify.js in en and hi).
   Checks the SVG the app builds (text kept as text, layouts, colours, fonts, initials), then the real downloads:
   PNG size and transparency read from the file, and an SVG that parses. */
const fs = require('fs');

function pngInfo(buf) { return { png: buf.slice(1, 4).toString('latin1') === 'PNG', w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }; }

module.exports = async function ({ page, lang, expect, t }) {
  const svg = (sq) => page.evaluate((sq) => LOGO.svg(sq), !!sq);
  const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  const texts = (s) => [...s.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => unesc(m[1]));
  const box = (s) => s.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const settle = () => page.waitForTimeout(120);
  const dl = async (sel) => {
    const [d] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click(sel)]);
    return { name: d.suggestedFilename(), buf: fs.readFileSync(await d.path()) };
  };
  const pixels = (buf) => page.evaluate(async (b64) => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const bmp = await createImageBitmap(new Blob([u], { type: 'image/png' }));
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
    const x = c.getContext('2d'); x.drawImage(bmp, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data; let opaque = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 200) opaque++;
    return { corner: [d[0], d[1], d[2], d[3]], opaque, total: c.width * c.height };
  }, buf.toString('base64'));

  await page.waitForSelector('#icons .ic-btn', { timeout: 10000 });

  /* 0) opens with the made-up sample name, in the page language, already drawn */
  expect((await page.inputValue('#name')) === t('sample_name'), 'sample name is in the name box');
  let s = await svg();
  expect(texts(s).includes(t('sample_name')), 'SVG holds the sample name as text: ' + texts(s));
  expect(s.includes('<g transform') && s.includes('#f97316'), 'tea-cup icon on a saffron circle');
  expect(await page.$eval('#pvLight', (i) => i.complete && i.naturalWidth > 50) && await page.$eval('#pvAv', (i) => i.complete && i.naturalWidth > 20), 'previews are drawn');
  expect((await page.textContent('[data-i18n="trademark"]')).trim() === t('trademark'), 'trademark note shows');
  expect(await page.$eval('#hint', (e) => e.hidden), 'default colours need no warning');

  /* 1) own name and tagline become real SVG text (with & kept safe) */
  await page.fill('#name', 'Ravi Tuition Centre');
  await page.fill('#tag', 'Maths & Science, Class 6-12');
  s = await svg();
  const words = texts(s).join(' ');
  expect(words.includes('Ravi') && words.includes('Centre') && words.includes('Maths & Science, Class 6-12'), 'name and tagline in the SVG: ' + words);
  expect(s.includes('Maths &amp; Science'), '& is escaped in the SVG');
  let vb = box(s);
  expect(vb[2] > vb[3] * 1.5, 'icon beside the name gives a wide logo: ' + vb);
  vb = box(await svg(true));
  expect(vb[2] === vb[3], 'square version is square');

  /* 2) monogram: initials from the name, own initials, shapes */
  await page.click('#layouts [data-layout="mono"]');
  expect(!(await page.$eval('#iniWrap', (e) => e.hidden)), 'initials box shows for the monogram');
  expect((await page.evaluate(() => LOGO.initials())) === 'RT', 'initials RT from Ravi Tuition');
  s = await svg();
  expect(texts(s)[0] === 'RT' && /<circle/.test(s), 'RT drawn on a circle');
  await page.click('#shapeSeg [data-shape="hex"]');
  expect(/<polygon/.test(await svg()), 'hexagon shape');
  await page.fill('#initials', 'rk');
  expect(texts(await svg())[0] === 'RK', 'own initials are used, in capitals');
  await page.fill('#initials', '');
  await page.fill('#name', 'क्षितिज विद्यालय');
  expect((await page.evaluate(() => LOGO.initials())) === 'क्षिवि', 'Hindi initials keep whole letters: ' + (await page.evaluate(() => LOGO.initials())));
  await page.fill('#name', 'Ravi Tuition Centre');

  /* 3) round badge: a square picture with the main-colour circle */
  await page.click('#layouts [data-layout="badge"]');
  s = await svg(); vb = box(s);
  expect(Math.abs(vb[2] - vb[3]) <= 1 && s.includes('<circle cx="0" cy="0" r="300" fill="#f97316"/>'), 'badge is a saffron circle');
  expect(await page.$eval('#shapeWrap', (e) => e.hidden), 'shape choice hidden for the badge');

  /* 4) colour theme, then own colour */
  await page.click('#themes [data-theme="leaf"]');
  s = await svg();
  expect(s.includes('#16a34a') && !s.includes('#f97316'), 'leaf theme replaces saffron');
  await page.$eval('#cMain', (e) => { e.value = '#123456'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  s = await svg();
  expect(s.includes('#123456') && (await page.evaluate(() => LOGO.set.theme)) === 'custom', 'own main colour used');
  expect((await page.$eval('#themes [data-theme="leaf"]', (b) => b.getAttribute('aria-pressed'))) === 'false', 'theme button no longer pressed');

  /* 5) font style */
  await page.click('#fonts [data-font="serif"]');
  expect((await svg()).includes('Georgia'), 'classic style uses a serif font');

  /* 6) PNG 512: right size, transparent corner, logo pixels present */
  await page.click('#layouts [data-layout="side"]');
  await page.click('#themes [data-theme="saffron"]');
  await settle();
  let f = await dl('#png512'), pi = pngInfo(f.buf);
  expect(pi.png && pi.w === 512 && pi.h < 512 && pi.h > 60, 'PNG 512 px wide: ' + pi.w + 'x' + pi.h);
  expect(f.name === 'logo-ravi-tuition-centre-512.png', 'file name from the shop name: ' + f.name);
  let px = await pixels(f.buf);
  expect(px.corner[3] === 0 && px.opaque > px.total * 0.04, 'transparent corner and drawn logo: ' + JSON.stringify(px));

  /* 7) square with a white background, 1024 px */
  await page.click('#picSeg [data-pic="square"]');
  await page.click('#bgSeg [data-bg="white"]');
  await settle();
  f = await dl('#png1024'); pi = pngInfo(f.buf);
  expect(pi.w === 1024 && pi.h === 1024, 'square PNG is 1024 x 1024: ' + pi.w + 'x' + pi.h);
  px = await pixels(f.buf);
  expect(px.corner.join() === '255,255,255,255', 'white background fills the corner: ' + px.corner);
  expect((await page.textContent('#picSize')).includes('1024'), 'size line shows 1024');

  /* 8) SVG download keeps text as text and is valid XML */
  f = await dl('#svgBtn');
  const xml = f.buf.toString('utf8');
  expect(/\.svg$/.test(f.name) && xml.startsWith('<?xml') && xml.includes('<text') && xml.includes('Ravi'), 'SVG file with text: ' + f.name);
  expect(await page.evaluate((x) => !new DOMParser().parseFromString(x, 'image/svg+xml').querySelector('parsererror'), xml), 'SVG parses');

  /* 9) Urdu name is marked right-to-left; black ink on a transparent logo warns about dark backgrounds */
  await page.click('#bgSeg [data-bg="none"]');
  await page.click('#picSeg [data-pic="fit"]');
  await page.fill('#name', 'گل مہر چائے');
  expect((await svg()).includes('direction="rtl"'), 'Urdu text has direction rtl');
  await page.click('#themes [data-theme="ink"]');
  await settle();
  expect((await page.textContent('#hint')).includes(t('hint_dark')), 'hint about dark backgrounds');

  /* 10) very long name without spaces is shrunk, empty logo turns downloads off */
  await page.fill('#name', 'W'.repeat(40));
  vb = box(await svg());
  expect(vb[2] < 1600, 'long name shrinks to fit: ' + vb[2]);
  await page.fill('#name', ''); await page.fill('#tag', '');
  await page.click('#icons [data-icon="none"]');
  await settle();
  expect(!(await page.$eval('#emptyMsg', (e) => e.hidden)) && await page.$eval('#png512', (b) => b.disabled), 'empty logo: message shows, download off');

  /* 11) reset brings the sample back */
  await page.click('#resetBtn');
  await settle();
  expect((await page.inputValue('#name')) === t('sample_name') && (await page.evaluate(() => LOGO.set.icon)) === 'cup', 'reset restores the sample');
};
