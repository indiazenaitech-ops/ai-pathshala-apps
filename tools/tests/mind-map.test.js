/* Interaction test for Mind Map Maker (run by tools/verify.js in en and hi). */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t, log }) {
  const attr = (k) => page.getAttribute('#mm-app', 'data-' + k);
  const count = async () => +(await attr('count'));
  const T = await page.evaluate((L) => window.APP_CONTENT[L].templates, lang);
  const svgTexts = () => page.$$eval('#mm-nodes .mm-txt', (els) => els.map((e) => e.textContent));
  const olValues = () => page.$$eval('#mm-outline .ol-in', (els) => els.map((e) => e.value));
  const pos = (id) => page.$eval(`#mm-nodes g[data-id="${id}"]`, (g) => { const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(g.getAttribute('transform')); return { x: +m[1], y: +m[2] }; });
  const center = async (id) => { const b = await page.locator(`#mm-nodes g[data-id="${id}"] .mm-box`).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  const tap = async (id) => { await page.click('#mm-fit'); const c = await center(id); await page.mouse.click(c.x, c.y); await page.waitForTimeout(520); };
  const model = () => page.evaluate(() => {
    const maps = JSON.parse(localStorage.getItem('edu.mind-map.maps') || '[]');
    const cur = JSON.parse(localStorage.getItem('edu.mind-map.cur') || '""');
    return maps.find((m) => m.id === cur) || null;
  });
  const findParent = (root, text) => { let hit = null; (function w(n) { n.children.forEach((k) => { if (k.text === text) hit = n; w(k); }); })(root); return hit; };
  const T1 = lang === 'hi' ? 'बादल और बारिश' : 'Clouds and rain';
  const T2 = lang === 'hi' ? 'मानसून हवाएँ' : 'Monsoon winds';
  const T2b = lang === 'hi' ? 'मानसून की हवाएँ' : 'Monsoon wind belts';

  /* 1. the sample water-cycle map loads in the page language */
  await page.waitForSelector('#mm-nodes g[data-root="1"]');
  const n0 = await count();
  expect(n0 === T.sample.lines.length, `sample map has ${T.sample.lines.length} ideas, got ${n0}`);
  expect((await page.$eval('#mm-maps', (s) => s.options[s.selectedIndex].textContent)) === T.sample.name, 'map list shows the sample name');
  expect((await page.locator('#mm-outline .ol-row').count()) === n0, 'outline lists every idea');
  expect((await svgTexts()).join(' ').includes(T.sample.lines[1].trim()), 'first branch is drawn on the map');
  const rootId = await page.getAttribute('#mm-nodes g[data-root="1"]', 'data-id');

  /* 2. add a main branch with the toolbar, then a sub-idea with Tab, inline editing */
  await tap(rootId);
  expect((await attr('sel')) === rootId, 'tapping the centre topic selects it');
  await page.click('#mm-child');
  await page.waitForSelector('#mm-editor:not([hidden])');
  await page.keyboard.type(T1);
  await page.keyboard.press('Enter');
  expect((await count()) === n0 + 1, 'one idea added');
  const id1 = await attr('sel');
  expect((await page.getAttribute(`#mm-nodes g[data-id="${id1}"]`, 'data-depth')) === '1', 'new idea is a main branch');
  expect((await svgTexts()).some((s) => s.includes(T1)) && (await olValues()).includes(T1), 'new text shows on the map and in the outline');
  await page.keyboard.press('Tab');
  await page.waitForSelector('#mm-editor:not([hidden])');
  await page.keyboard.type(T2);
  await page.keyboard.press('Enter');
  const id2 = await attr('sel');
  expect((await count()) === n0 + 2 && (await page.getAttribute(`#mm-nodes g[data-id="${id2}"]`, 'data-depth')) === '2', 'Tab added a sub-idea one level smaller');
  await page.keyboard.press('Enter');                       // sibling editor, then Esc cancels the empty idea
  await page.waitForSelector('#mm-editor:not([hidden])');
  await page.keyboard.press('Escape');
  expect((await count()) === n0 + 2, 'an empty new idea is removed on Esc');

  /* 3. undo / redo */
  await page.click('#mm-undo');
  expect((await count()) === n0 + 1, 'undo removes the sub-idea');
  await page.click('#mm-redo');
  expect((await count()) === n0 + 2, 'redo brings it back');

  /* 4. typing in the outline updates the map */
  await page.fill(`.ol-row[data-id="${id2}"] .ol-in`, T2b);
  await page.waitForTimeout(150);
  expect((await svgTexts()).some((s) => s.includes(T2b)), 'outline edit is drawn on the map');

  /* 5. fold / unfold a branch */
  const evapId = await page.getAttribute('#mm-outline .ol-row[aria-level="2"]', 'data-id');
  await tap(evapId);
  await page.click('#mm-fold');
  expect(+(await attr('visible')) === n0 + 2 - 2, 'folding hides the 2 ideas of the first branch');
  await page.click('#mm-fold');
  expect(+(await attr('visible')) === n0 + 2, 'unfolding shows them again');

  /* 6. delete with the keyboard, undo with Ctrl + Z */
  await tap(id1);
  await page.keyboard.press('Delete');
  expect((await count()) === n0, 'Delete removes the branch with its sub-idea');
  await page.keyboard.press('Control+z');
  expect((await count()) === n0 + 2, 'Ctrl + Z restores it');

  /* 7. auto layouts */
  await page.click('#mm-layout [data-layout="radial"]');
  expect((await attr('layout')) === 'radial', 'radial layout chosen');
  const mains = await page.$$eval('#mm-nodes g[data-depth="1"]', (gs) => gs.map((g) => g.getAttribute('data-id')));
  const d = [];
  for (const id of mains) { const p = await pos(id); d.push(Math.hypot(p.x, p.y)); }
  expect(mains.length === 7 && Math.max(...d) - Math.min(...d) < 1.5, 'all main branches sit on one circle: ' + d.map(Math.round).join(','));
  await page.click('#mm-layout [data-layout="tree"]');
  let xs = []; for (const id of mains) xs.push((await pos(id)).x);
  expect(xs.every((x) => x > 0), 'tree layout puts every branch on one side');
  await page.click('#mm-layout [data-layout="list"]');
  const order = await page.$$eval('#mm-outline .ol-row', (rows) => rows.map((r) => r.getAttribute('data-id')));
  const lefts = [], tops = [];
  for (const id of order) {
    const p = await pos(id), rx = +(await page.getAttribute(`#mm-nodes g[data-id="${id}"] .mm-box`, 'x'));
    lefts.push(p.x + rx); tops.push(p.y);
  }
  const mainLefts = order.map((id, i) => (mains.includes(id) ? lefts[i] : null)).filter((v) => v !== null);
  expect(tops.every((y, i) => i === 0 || y > tops[i - 1]), 'top-down layout follows the outline order from top to bottom');
  expect(Math.max(...mainLefts) - Math.min(...mainLefts) < 1 && mainLefts[0] > lefts[0], 'main branches are indented one step from the centre topic');
  await page.click('#mm-layout [data-layout="both"]');
  xs = []; for (const id of mains) xs.push((await pos(id)).x);
  expect(xs.some((x) => x > 0) && xs.some((x) => x < 0), 'both-sides layout uses left and right');

  /* 8. drag an idea onto another idea: it moves under that idea */
  const transId = await page.$eval('#mm-outline', (ol) => [...ol.querySelectorAll('.ol-row[aria-level="2"]')][1].getAttribute('data-id'));
  await page.click('#mm-fit');
  let a = await center(id2), b = await center(transId);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(a.x + (b.x - a.x) * i / 12, a.y + (b.y - a.y) * i / 12);
  await page.mouse.up();
  await page.waitForTimeout(450);
  let m = await model();
  expect(findParent(m.root, T2b).text === T.sample.lines[4].trim(), 'dropped idea now belongs to the second branch');
  expect((await attr('layout')) === 'both', 'auto layout kept after a drop');
  /* plain drag into empty space switches to "moved by hand" */
  await page.click('#mm-fit');
  a = await center(id2);
  const side = (await pos(id2)).x >= 0 ? 1 : -1;
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(a.x + side * 12 * i, a.y);
  await page.mouse.up();
  await page.waitForTimeout(450);
  expect((await attr('layout')) === 'free', 'a hand-moved idea switches the map to free layout');

  /* 9. the map name follows the centre topic */
  await page.fill(`.ol-row[data-id="${rootId}"] .ol-in`, 'Jal Chakra Test');
  await page.waitForTimeout(100);
  expect((await page.$eval('#mm-maps', (s) => s.options[s.selectedIndex].textContent)) === 'Jal Chakra Test', 'map name follows the centre topic');

  /* 10. new map from a template */
  await page.click('#mm-new');
  await page.click('#tpl-essay');
  expect((await attr('maps')) === '2' && (await count()) === T.essay.lines.length, 'essay template map created');

  /* 11. save as JSON */
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#mm-json')]);
  const data = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  expect(data.root.text === T.essay.lines[0] && data.root.children.length === 5, 'JSON backup holds the essay map');

  /* 12. open a text outline file */
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#mm-open')]);
  await fc.setFiles({ name: 'plants.txt', mimeType: 'text/plain', buffer: Buffer.from('Plants\n  Root\n  Stem\n    Xylem\n  Leaf\n') });
  await page.waitForFunction(() => document.getElementById('mm-app').dataset.maps === '3');
  expect((await count()) === 5, 'text file became a map with 5 ideas');
  m = await model();
  expect(m.root.text === 'Plants' && m.root.children[1].children[0].text === 'Xylem', 'indentation became branches');

  /* 13. make a map from pasted notes */
  await page.click('#mm-fromtext');
  await page.click('#mm-paste-ex');
  await page.click('#mm-paste-ok');
  const exLines = t('from_text_example').split('\n').length;
  expect((await attr('maps')) === '4' && (await count()) === exLines, `notes example became a map with ${exLines} ideas`);

  /* 14. PNG picture */
  const [png] = await Promise.all([page.waitForEvent('download'), page.click('#mm-png')]);
  expect(/\.png$/.test(png.suggestedFilename()) && fs.statSync(await png.path()).size > 3000, 'PNG picture downloaded');

  /* 15. shortcuts help */
  await page.click('#mm-keys');
  expect((await page.locator('#mm-keys-box tr').count()) >= 10, 'shortcuts table lists the keys');
  await page.keyboard.press('Escape');

  /* 16. everything survives a reload; delete a map */
  await page.selectOption('#mm-maps', { index: 0 });
  expect((await count()) === n0 + 2, 'first map still has the added ideas');
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForSelector('#mm-nodes g[data-root="1"]');
  expect((await attr('maps')) === '4' && (await count()) === n0 + 2, 'maps are saved on the device');
  expect((await svgTexts()).some((s) => s.includes(T1)), 'saved idea text is back after reload');
  await page.click('#mm-delmap');
  expect((await attr('maps')) === '3', 'map deleted');
  log('ok', n0, exLines);
};
