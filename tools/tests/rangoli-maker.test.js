/* Interaction test for Rangoli & Kolam Maker (run by tools/verify.js in en and hi).
   8-fold symmetry: one stroke = 8 copies (16 with mirror) and ink appears at the turned position; undo/redo;
   save to My designs and reopen restores the same strokes; colour-in fills a part (and its matching parts);
   a generated sikku kolam is one single line; PNG export gives a PNG data URL and a .png download;
   Ctrl+P prints a picture; the work survives a reload. */
module.exports = async function ({ page, expect, t }) {
  const ds = (k) => page.evaluate((k) => document.getElementById('rm-art').dataset[k], k);
  const sleep = (ms) => page.waitForTimeout(ms);
  async function drag(sel, pts, steps = 10) {
    await page.locator(sel).scrollIntoViewIfNeeded();
    const b = await page.locator(sel).boundingBox();
    const at = (p) => [b.x + b.width * p[0], b.y + b.height * p[1]];
    await page.mouse.move(...at(pts[0]));
    await page.mouse.down();
    for (let i = 1; i < pts.length; i++) {
      for (let s = 1; s <= steps; s++) {
        const p = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * s / steps, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * s / steps];
        await page.mouse.move(...at(p));
      }
    }
    await page.mouse.up();
  }
  /* alpha of the drawing layer at a point given as a fraction of the canvas */
  const alphaAt = (fx, fy) => page.evaluate(([fx, fy]) => {
    const c = document.getElementById('rm-art'), x = c.getContext('2d').getImageData(Math.round(c.width * fx) - 3, Math.round(c.height * fy) - 3, 7, 7).data;
    let m = 0; for (let i = 3; i < x.length; i += 4) m = Math.max(m, x[i]); return m;
  }, [fx, fy]);

  /* 1. studio starts with a sample design; clear it (confirm is auto-accepted) */
  expect(+(await ds('strokes')) > 0, 'studio opens with a sample rangoli');
  await page.click('#rm-clear');
  expect(+(await ds('strokes')) === 0 && +(await ds('copies')) === 0, 'clear empties the design');

  /* 2. 8 copies, mirror off: one stroke near the top makes 8 copies, one of them on the right side */
  await page.click('#tool-brush');
  await page.click('#rm-fold [data-f="8"]');
  if (await page.isChecked('#rm-mirror')) await page.click('#rm-mirror');
  expect(!(await page.isChecked('#rm-mirror')), 'mirror is off');
  expect((await page.textContent('#rm-status')).includes(t('copies_n', { n: 8 })), 'status says each stroke makes 8 copies');
  expect(await alphaAt(0.85, 0.5) === 0, 'right side is empty before drawing');
  await drag('#rm-live', [[0.47, 0.15], [0.53, 0.15]]);
  expect(+(await ds('strokes')) === 1, 'one stroke stored, got ' + await ds('strokes'));
  expect(+(await ds('copies')) === 8, 'one stroke with 8-fold symmetry makes 8 copies, got ' + await ds('copies'));
  expect(await alphaAt(0.5, 0.15) > 200, 'ink where the stroke was drawn');
  expect(await alphaAt(0.85, 0.5) > 200, 'the copy turned by 90° appears on the right');

  /* 3. mirror on: the next stroke makes 16 copies; undo / redo */
  await page.click('#rm-mirror');
  await drag('#rm-live', [[0.6, 0.3], [0.65, 0.35], [0.66, 0.4]]);
  expect(+(await ds('strokes')) === 2 && +(await ds('copies')) === 24, 'mirror stroke adds 16 copies (8 + 16 = 24), got ' + await ds('copies'));
  await page.click('#rm-undo');
  expect(+(await ds('copies')) === 8, 'undo removes the mirrored stroke');
  await page.click('#rm-redo');
  expect(+(await ds('copies')) === 24, 'redo brings it back');

  /* 4. save to My designs, clear, reopen: same strokes come back */
  await page.fill('#rm-name', 'Diwali 2026');
  await page.click('#rm-save');
  expect(await page.evaluate(() => RANGOLI.designs()) === 1, 'design saved');
  await page.click('#rm-clear');
  expect(+(await ds('strokes')) === 0, 'cleared after saving');
  await page.click('#tab-gallery');
  expect(await page.$$eval('#rm-gallery .rm-design', (x) => x.length) === 1, 'one card in My designs');
  expect((await page.textContent('#rm-gallery .rm-dname')).trim() === 'Diwali 2026', 'card shows the name');
  await page.click('#rm-gallery .rm-design [data-act="dup"]');
  expect(await page.$$eval('#rm-gallery .rm-design', (x) => x.length) === 2, 'duplicate makes a second card');
  await page.click('#rm-gallery .rm-design:nth-child(2) [data-act="del"]');
  expect(await page.$$eval('#rm-gallery .rm-design', (x) => x.length) === 1, 'delete removes it');
  await page.click('#rm-gallery .rm-design [data-act="open"]');
  expect(await page.getAttribute('#tab-studio', 'aria-selected') === 'true', 'opening goes back to the studio');
  expect(+(await ds('strokes')) === 2 && +(await ds('copies')) === 24, 'reopened design has the same 2 strokes / 24 copies');

  /* 5. PNG export */
  const url = await page.evaluate(() => RANGOLI.renderPNG());
  expect(/^data:image\/png;base64,/.test(url) && url.length > 2000, 'PNG export gives a PNG data URL');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#rm-png')]);
  expect(/^Diwali-2026-\d{4}-\d{2}-\d{2}\.png$/.test(dl.suggestedFilename()), 'PNG download named after the design: ' + dl.suggestedFilename());

  /* 6. colour-in: tapping a petal fills it and its matching petals */
  await page.click('#tab-color');
  await page.click('#rm-tpls [data-tpl="lotus"]');
  await page.click('#rm-pal [data-c="#e83e8c"]');
  const sel = '#rm-svg path[data-g="front"]';
  expect(await page.getAttribute(sel, 'fill') === '#ffffff', 'petal starts white');
  await page.locator(sel).first().click({ force: true });
  const fills = await page.$$eval(sel, (ps) => ps.map((p) => p.getAttribute('fill')));
  expect(fills.length === 8 && fills.every((f) => f === '#e83e8c'), 'all 8 matching petals filled pink: ' + fills.join(','));
  expect((await page.textContent('#rm-status')).includes(t('color_status', { n: 8, m: 59 })), 'status counts 8 coloured parts');
  await page.click('#rm-symfill');
  await page.click('#rm-pal [data-c="#f9c80e"]');
  const c1 = await page.locator('#rm-svg path[data-g="c1"]').boundingBox();
  await page.mouse.click(c1.x + c1.width * 0.12, c1.y + c1.height / 2);      /* in the ring, outside the small core */
  expect(await page.getAttribute('#rm-svg path[data-g="c1"]', 'fill') === '#f9c80e', 'centre filled yellow');
  await page.click('#rm-undo');
  expect(await page.getAttribute('#rm-svg path[data-g="c1"]', 'fill') === '#ffffff', 'undo takes the colour back');

  /* 7. kolam: a generated sikku kolam is one single line around all the dots */
  await page.click('#tab-kolam');
  await page.click('#rm-grid [data-grid="square"]');
  await page.selectOption('#rm-gsize', '6');
  await page.evaluate(() => __gameTest.seed(42));
  await page.click('#rm-surprise');
  expect(+(await ds('lines')) === 1, 'new sikku kolam on 6 × 6 dots is one line, got ' + await ds('lines'));
  expect((await page.textContent('#rm-status')).includes(t('one_line')), 'status says it is one single line');
  await page.click('#rm-grid [data-grid="diamond"]');
  await page.click('#rm-surprise');
  expect(+(await ds('lines')) === 1, 'diamond sikku kolam is one line too');
  /* draw a loop around a dot by dragging through the gaps (snapping) */
  await page.click('#tool-kline');
  const before = +(await ds('lines'));
  await drag('#rm-live', [[0.5, 0.42], [0.58, 0.5], [0.5, 0.58], [0.42, 0.5], [0.5, 0.42]], 6);
  expect(+(await ds('lines')) === before + 1, 'a snapped line was added');
  const last = await page.evaluate(() => { const k = RANGOLI.state().kolam.items; return k[k.length - 1]; });
  expect(last.t === 'kl' && last.cl === 1 && last.p.length === 8, 'coming back to the start closes a loop through 4 gaps: ' + JSON.stringify(last));

  /* 8. Ctrl+P prints a picture of the design */
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  expect(/^data:image\/png/.test(await page.getAttribute('#rm-print-img', 'src')), 'print area holds a picture');

  /* 9. reload keeps the work and the gallery */
  await sleep(500);
  await page.reload();
  await sleep(900);
  expect(await page.getAttribute('#tab-kolam', 'aria-selected') === 'true', 'kolam tab remembered');
  expect(+(await ds('lines')) === before + 1, 'kolam lines survive a reload');
  expect(+(await ds('strokes')) === 2 && await page.evaluate(() => RANGOLI.designs()) === 1, 'studio design and My designs survive a reload');
};
