/* Interaction test for Digital Whiteboard (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t, log }) {
  const sleep = (ms) => page.waitForTimeout(ms);
  const attr = async (sel, a) => page.getAttribute(sel, a);
  const count = async () => +(await attr('#wb', 'data-count'));
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('edu.whiteboard.board') || 'null'));
  let box = await page.locator('#wb-live').boundingBox();
  const at = (fx, fy) => [box.x + box.width * fx, box.y + box.height * fy];
  async function drag(from, to, steps = 14) {
    box = await page.locator('#wb-live').boundingBox();       /* clicking toolbar buttons may have scrolled the page */
    await page.mouse.move(...at(from[0], from[1]));
    await page.mouse.down();
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(...at(from[0] + (to[0] - from[0]) * i / steps, from[1] + (to[1] - from[1]) * i / steps));
    }
    await page.mouse.up();
  }
  /* RGBA of the base canvas at a fraction of its size */
  const pixel = (fx, fy) => page.evaluate(([fx, fy]) => {
    const c = document.getElementById('wb-base');
    return Array.from(c.getContext('2d').getImageData(Math.round(c.width * fx), Math.round(c.height * fy), 1, 1).data);
  }, [fx, fy]);

  expect(await count() === 0, 'board starts empty');
  expect(box.width > 300 && Math.abs(box.width / box.height - 1.6) < 0.02, 'wide 16:10 board fills the stage, got ' + box.width + 'x' + box.height);

  /* 1. pen stroke: ink appears where we drew */
  await page.click('#tool-pen');
  expect(await attr('#tool-pen', 'aria-pressed') === 'true', 'pen is selected');
  const before = await pixel(0.25, 0.3);
  await drag([0.1, 0.3], [0.4, 0.3]);
  expect(await count() === 1, 'one stroke after drawing with the pen');
  const ink = await pixel(0.25, 0.3);
  expect(before[0] > 240 && ink[0] < 90 && ink[1] < 90, 'black ink drawn on the white board: ' + before + ' → ' + ink);

  /* highlighter keeps its own colour (yellow), the pen keeps black */
  await page.click('#tool-hl');
  expect(await attr('#wb-colors .wb-sw[data-color="p6"]', 'aria-pressed') === 'true', 'highlighter starts with yellow');
  await page.click('#tool-pen');
  expect(await attr('#wb-colors .wb-sw[data-color="p0"]', 'aria-pressed') === 'true', 'pen is still black');

  /* 2. rectangle (shortcuts also work on a Hindi InScript keyboard, where the A key types "ो") */
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ो', code: 'KeyA', bubbles: true })));
  expect(await attr('#tool-arrow', 'aria-pressed') === 'true', 'tool shortcut works with a non-Latin keyboard layout');
  await page.keyboard.press('r');
  expect(await attr('#tool-rect', 'aria-pressed') === 'true', 'R key picks the rectangle tool');
  await drag([0.55, 0.2], [0.85, 0.5]);
  expect(await count() === 2, 'rectangle added');

  /* 3. undo / redo with buttons and keyboard */
  await page.click('#wb-undo');
  expect(await count() === 1, 'undo removes the rectangle');
  await page.click('#wb-redo');
  expect(await count() === 2, 'redo brings it back');
  await page.keyboard.press('Control+z');
  expect(await count() === 1, 'Ctrl+Z undoes');
  await page.keyboard.press('Control+y');
  expect(await count() === 2, 'Ctrl+Y redoes');

  /* 4. text tool */
  await page.click('#tool-text');
  box = await page.locator('#wb-live').boundingBox();
  await page.mouse.click(...at(0.1, 0.72));
  await page.waitForSelector('#wb-text:not([hidden])', { timeout: 3000 });
  await page.keyboard.type('Namaste 123');
  await page.keyboard.press('Enter');
  expect(await count() === 3, 'text added to the board');
  await sleep(500);
  let d = await saved();
  expect(d && d.pages.length === 1, 'board saved to this device');
  const s = d.pages[0].s;
  expect(s.map((x) => x.t).join(',') === 'pen,rect,text', 'saved strokes are pen, rect, text: ' + s.map((x) => x.t));
  expect(s[2].tx === 'Namaste 123' && s[2].bw > 50, 'typed text saved with its size');
  expect(s[0].p.length >= 4 && s[0].p.every((v) => v >= 0 && v <= 1600), 'pen points stored in board units');
  const r = s[1].p;
  expect(Math.abs(r[0] - 880) < 12 && Math.abs(r[3] - 500) < 12, 'rectangle stored in board units (resize-safe): ' + r);

  /* 5. stroke eraser removes only the shape it touches */
  await page.click('#tool-eraser');
  await drag([0.53, 0.35], [0.57, 0.35], 6);
  expect(await count() === 2, 'eraser removed one stroke');
  await sleep(450);
  d = await saved();
  expect(d.pages[0].s.map((x) => x.t).join(',') === 'pen,text', 'the rectangle was erased, the rest stayed');

  /* 5b. picking a colour while typing recolours the text (the box stays open, typing goes on),
         and Enter used by an Indian-language typing tool (IME) does not finish the text */
  await page.click('#tool-text');
  box = await page.locator('#wb-live').boundingBox();
  await page.mouse.click(...at(0.6, 0.72));
  await page.waitForSelector('#wb-text:not([hidden])', { timeout: 3000 });
  await page.keyboard.type('AB');
  const sw = await page.locator('#wb-colors .wb-sw[data-color="p2"]').boundingBox();
  await page.mouse.move(sw.x + sw.width / 2, sw.y + sw.height / 2);
  await page.mouse.down(); await sleep(120); await page.mouse.up();            /* a human-speed click */
  expect(!(await page.$eval('#wb-text', (e) => e.hidden)), 'text box stays open while a colour is picked');
  await page.keyboard.type('C');
  const imeKept = await page.evaluate(() => {
    const ta = document.getElementById('wb-text');
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, isComposing: true, bubbles: true, cancelable: true }));
    return !ta.hidden;
  });
  expect(imeKept, 'Enter while an IME is composing does not finish the text');
  await page.keyboard.press('Enter');
  await sleep(450);
  d = await saved();
  const t2 = d.pages[0].s[2];
  expect(d.pages[0].s.length === 3 && t2.tx === 'ABC' && t2.c === 'p2', 'text typed before and after the colour click is one red text: ' + JSON.stringify(t2 && [t2.tx, t2.c]));
  expect(await page.evaluate(() => WBDraw.textDir('سلام دنیا') === 'rtl' && WBDraw.textDir('x = लंबाई') === 'ltr'), 'Urdu text keeps right-to-left reading order on the canvas');

  /* 6. background + chalkboard mode */
  await page.selectOption('#wb-bg', 'grid');
  await page.click('#wb-boards button[data-board="green"]');
  const bg = await pixel(0.01, 0.01);
  expect(bg[1] > bg[0] && bg[0] + bg[1] + bg[2] < 250, 'board turns dark green: ' + bg);
  const chalk = await pixel(0.25, 0.3);
  expect(chalk[0] > 200 && chalk[1] > 200, 'black ink turns into white chalk on the dark board: ' + chalk);
  expect(await attr('#wb-colors .wb-sw', 'aria-label') === t('col_0d'), 'first colour is now called white');
  await page.click('#wb-undo');
  expect((await pixel(0.01, 0.01))[0] > 240, 'undo brings the white board back');
  await page.click('#wb-redo');

  /* 6b. the browser's own Print (Ctrl+P) is not blank, and a chalkboard prints on white paper */
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const pr = await page.evaluate(() => {
    const cs = document.querySelectorAll('#wb-print canvas'), c = cs[0];
    const at = (fx, fy) => c && Array.from(c.getContext('2d').getImageData(Math.round(c.width * fx), Math.round(c.height * fy), 1, 1).data);
    return { n: cs.length, paper: at(0.005, 0.005), ink: at(0.25, 0.3) };
  });
  expect(pr.n === 1, 'Ctrl+P prints one picture per page, got ' + pr.n);
  expect(pr.paper[0] > 240 && pr.paper[1] > 240 && pr.paper[2] > 240, 'chalkboard page prints on white paper: ' + pr.paper);
  expect(pr.ink[0] < 90 && pr.ink[1] < 90, 'chalk ink prints dark: ' + pr.ink);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  expect(await page.$$eval('#wb-print > *', (x) => x.length) === 0, 'print pictures removed after printing');

  /* 7. pages */
  await page.locator('#wb-add').scrollIntoViewIfNeeded();            /* Playwright scrolls before clicking; measure after that */
  const y0 = await page.evaluate(() => scrollY);
  await page.click('#wb-add');
  expect(await page.evaluate(() => scrollY) === y0, 'adding a page does not scroll the page');
  box = await page.locator('#wb-live').boundingBox();
  expect(await attr('#wb', 'data-pages') === '2' && await attr('#wb', 'data-page') === '2', 'second page added and shown');
  expect(await count() === 0, 'new page is empty');
  expect((await page.textContent('#wb-pageno')).trim() === t('page_n_of', { n: '2', m: '2' }), 'page counter says 2 of 2');
  expect(await page.$$eval('#wb-thumbs .wb-thumb', (b) => b.length) === 2, 'two page thumbnails');
  await page.click('#tool-line');
  await drag([0.2, 0.2], [0.6, 0.6]);
  expect(await count() === 1, 'line drawn on page 2');
  await page.click('#wb-prev');
  expect(await attr('#wb', 'data-page') === '1' && await count() === 3, 'back on page 1 with its 3 strokes');

  /* 8. tall page shape keeps strokes (logical coordinates) */
  await page.click('#wb-shape button[data-shape="tall"]');
  box = await page.locator('#wb-live').boundingBox();
  expect(box.height > box.width, 'tall page is taller than wide');
  expect(await count() === 3, 'strokes kept after changing the page shape');
  await page.click('#wb-undo');
  box = await page.locator('#wb-live').boundingBox();
  expect(box.width > box.height, 'undo restores the wide page');

  /* 8b. browser storage full (other apps can fill it): the teacher is warned, and saving resumes later */
  await sleep(500);
  expect(await attr('#wb', 'data-saved') === '1', 'board saved normally');
  await page.evaluate(() => {
    let s = 'x'.repeat(512 * 1024), n = 0;
    while (s.length > 8 && n < 60) { try { localStorage.setItem('wbtest-junk' + n, s); n++; } catch (e) { s = s.slice(0, s.length >> 1); } }
  });
  await page.click('#tool-pen');
  await drag([0.5, 0.45], [0.8, 0.5]);                        /* a new stroke makes the saved board bigger */
  await sleep(500);
  expect(await attr('#wb', 'data-saved') === '0', 'a failed save is detected');
  expect((await page.$$eval('.edu-toast', (x) => x.map((n) => n.textContent))).includes(t('save_failed')), 'the teacher is told the board could not be saved');
  await page.evaluate(() => Object.keys(localStorage).filter((k) => k.indexOf('wbtest-junk') === 0).forEach((k) => localStorage.removeItem(k)));
  await page.click('#wb-undo');
  await page.click('#tool-line');
  await sleep(500);
  expect(await attr('#wb', 'data-saved') === '1', 'saving works again once there is space');

  /* 9. everything survives a reload */
  await page.reload();
  await sleep(900);
  expect(await attr('#wb', 'data-pages') === '2', 'two pages after reload');
  expect(await count() === 3, 'page 1 strokes after reload');
  expect(await attr('#tool-line', 'aria-pressed') === 'true', 'last tool remembered');

  /* 10. save page as PNG */
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#wb-png')]);
  expect(/\.png$/.test(dl.suggestedFilename()), 'PNG download: ' + dl.suggestedFilename());

  /* 11. delete page 2 (confirm is auto-accepted) */
  await page.click('#wb-next');
  await page.click('#wb-del');
  expect(await attr('#wb', 'data-pages') === '1' && await count() === 3, 'page 2 deleted, page 1 left');

  /* 12. open a board file: bad file refused, a 70-page file is capped at 50 pages */
  const openFile = async (name, text) => {
    const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), page.click('#wb-import')]);
    await fc.setFiles({ name, mimeType: 'application/json', buffer: Buffer.from(text) });
    await sleep(600);
  };
  await openFile('notes.json', 'this is not json');
  expect(await attr('#wb', 'data-pages') === '1' && await count() === 3, 'a bad file leaves the board alone');
  const big = { app: 'ai-pathshala-whiteboard', v: 1, pages: Array.from({ length: 70 }, (_, i) => ({ bg: 'grid', s: [{ t: 'text', c: 'p1', w: 1, p: [100, 100 + i], s: 40, tx: 'سلام ' + i }] })) };
  await openFile('board.json', JSON.stringify(big));
  expect(await attr('#wb', 'data-pages') === '50', 'opened board is capped at 50 pages, got ' + await attr('#wb', 'data-pages'));
  expect(await count() === 1 && await page.$eval('#wb-bg', (s) => s.value) === 'grid', 'opened page shows its text on squares');

  /* 13. a 390 px phone: no sideways scroll, all tools on one row, the board uses the full width */
  const vp = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await sleep(500);
  const ph = await page.evaluate(() => ({
    hs: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    rows: new Set(Array.from(document.querySelectorAll('#wb-tools .wb-ib')).map((b) => Math.round(b.getBoundingClientRect().top))).size,
    board: document.getElementById('wb-live').getBoundingClientRect().width, stage: document.getElementById('wb-stage').clientWidth
  }));
  expect(ph.hs <= 0 && ph.rows === 1 && ph.board >= ph.stage * 0.9, 'phone layout: ' + JSON.stringify(ph));
  await page.setViewportSize(vp);
  await sleep(400);
  log('whiteboard ok');
};
