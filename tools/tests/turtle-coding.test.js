/* Interaction test for Turtle Coding (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t, log }) {
  const rows = () => page.$$eval('#prog .tc-row:not(.tc-end)', (rs) => rs.map((r) => r.dataset.t));
  const readout = () => page.$eval('#readout', (r) => ({ x: +r.dataset.x, y: +r.dataset.y, h: +r.dataset.h, pen: r.dataset.pen }));
  const setSpeed = (v) => page.$eval('#speed', (el, val) => { el.value = String(val); el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  const runToEnd = async () => {
    await page.click('#run');
    await page.waitForSelector('#status[data-state="done"]', { timeout: 20000 });
  };

  await page.waitForSelector('#prog .tc-row');

  // 1) default program (the sun: 12 rays) is drawn on load: 24 lines, turtle back home
  expect(JSON.stringify(await rows()) === JSON.stringify(['color', 'width', 'repeat', 'fd', 'bk', 'rt']), 'default sun program has 6 blocks, got ' + JSON.stringify(await rows()));
  expect(await page.getAttribute('#cv', 'data-segs') === '24', 'sun draws 24 lines on load');
  let r = await readout();
  expect(r.x === 0 && r.y === 0 && r.h === 0, 'after 12 × 30° the turtle faces up again at home: ' + JSON.stringify(r));

  // 2) square challenge: start a new program and build it from blocks by tapping
  await page.click('#ch-square');
  expect(await page.getAttribute('#ch-square', 'aria-pressed') === 'true', 'square challenge selected');
  expect(JSON.stringify(await rows()) === '["fd"]', 'square starts with one Forward block');
  await page.click('#new-prog');
  expect((await rows()).length === 0, 'new program is empty');
  await page.click('#pal-repeat');
  await page.click('#prog .tc-row[data-t="repeat"] .tc-in');
  await page.click('#pal-fd');
  await page.click('#pal-rt');
  expect(JSON.stringify(await rows()) === '["repeat","fd","rt"]', 'blocks added inside the repeat: ' + JSON.stringify(await rows()));
  const inside = await page.$$eval('.tc-rep .tc-body .tc-row', (rs) => rs.map((x) => x.dataset.t));
  expect(JSON.stringify(inside) === '["fd","rt"]', 'Forward and Turn right are inside the Repeat');
  await page.fill('#prog .tc-row[data-t="fd"] .tc-num', '100');
  await page.press('#prog .tc-row[data-t="fd"] .tc-num', 'Enter');
  await page.click('#tab-code');
  const code = await page.inputValue('#code');
  expect(/repeat 4 \[\s*forward 100\s*right 90\s*\]/.test(code), 'code view shows the program as text: ' + code);
  await page.click('#tab-blocks');

  // 3) run it fast and get 3 stars
  await setSpeed(10);
  await runToEnd();
  expect(await page.getAttribute('#cv', 'data-segs') === '4', 'square = 4 lines');
  expect(await page.getAttribute('#ch-result', 'data-pass') === 'true', 'square challenge passed');
  expect(await page.getAttribute('#ch-result', 'data-stars') === '3', '3 stars for a 3-block square with Repeat');
  expect((await page.textContent('#ch-square .tc-stars')).trim() === '★★★', 'chip shows 3 stars');
  expect((await page.textContent('#status')).includes(t('status_done', { total: '8' })), 'status says 8 blocks ran');

  // 4) code mode: mistakes are explained in this language, then good code becomes blocks
  await page.click('#tab-code');
  await page.fill('#code', 'forwrd 10');
  await page.click('#apply-code');
  expect(await page.getAttribute('#code-msg', 'data-kind') === 'error', 'unknown command is an error');
  expect((await page.textContent('#code-msg')).trim() === t('err_unknown', { line: 1, word: 'forwrd' }), 'error message names the line and word');
  await page.fill('#code', 'repeat 4 [\n  forward 100\n  left 90\n]\n# a square turning left\npen up\nhome');
  await page.click('#apply-code');
  expect(await page.getAttribute('#code-msg', 'data-kind') === 'ok', 'good code accepted');
  await page.click('#tab-blocks');
  expect(JSON.stringify(await rows()) === '["repeat","fd","lt","pu","home"]', 'code became 5 blocks: ' + JSON.stringify(await rows()));

  // 5) step through: one block per press, turtle position follows
  await page.click('#step');
  r = await readout();
  expect(r.x === 0 && r.y === 100, 'step 1: forward 100 goes up to (0, 100): ' + JSON.stringify(r));
  expect(await page.$eval('#prog .tc-row.tc-on', (x) => x.dataset.t) === 'fd', 'the running block is highlighted');
  expect((await page.textContent('.tc-iter')).trim() === '1/4', 'repeat shows round 1/4');
  await page.click('#step');
  r = await readout();
  expect(r.h === 270, 'step 2: turning left 90 faces 270°: ' + JSON.stringify(r));
  await page.click('#step');
  r = await readout();
  expect(r.x === -100 && r.y === 100, 'step 3: (−100, 100): ' + JSON.stringify(r));
  expect(await page.isEnabled('#stop'), 'stop is enabled while stepping');
  await page.click('#stop');
  expect(await page.getAttribute('#status', 'data-state') === 'idle', 'stopped');

  // 6) mirrored square (turning left) still passes the challenge; pen up + home leaves no extra line
  await runToEnd();
  expect(await page.getAttribute('#ch-result', 'data-pass') === 'true', 'left-turning square also accepted');
  r = await readout();
  expect(r.x === 0 && r.y === 0 && r.pen === 'up', 'home brings the turtle back with the pen up');

  // 7) reorder and undo
  const before = await rows();
  await page.click('#prog .tc-row[data-t="pu"] [data-act="up"]');
  expect(JSON.stringify(await rows()) === '["repeat","fd","lt","pu","home"]' && await page.$$eval('.tc-rep .tc-body .tc-row', (rs) => rs.length) === 3, 'moving up past the end of a Repeat puts the block inside it');
  await page.click('#undo');
  expect(JSON.stringify(await rows()) === JSON.stringify(before) && await page.$$eval('.tc-rep .tc-body .tc-row', (rs) => rs.length) === 2, 'undo restores the program');
  await page.click('#prog .tc-row[data-t="home"] [data-act="del"]');
  expect((await rows()).length === 4, 'delete removes a block');

  // 8) polygon challenge: exterior angle 360 ÷ N
  await page.click('#ch-polygon');
  const n = await page.evaluate(() => window.TurtleApp.state.polyN);
  const side = { 5: 100, 6: 90, 8: 70, 9: 60, 10: 55, 12: 45 }[n];
  await page.click('#tab-code');
  await page.fill('#code', 'repeat ' + n + ' [ forward ' + side + ' right ' + (360 / n) + ' ]');
  await runToEnd();
  expect(await page.getAttribute('#ch-result', 'data-stars') === '3', n + '-sided polygon with right ' + (360 / n) + ' passes with 3 stars');
  await page.fill('#code', 'repeat ' + n + ' [ forward ' + side + ' right 60 ]');
  if (n !== 6) {
    await runToEnd();
    expect(await page.getAttribute('#ch-result', 'data-pass') === 'false', 'a wrong angle does not pass');
  }

  // 9) progress survives a reload
  await page.waitForTimeout(300);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#ch-list .chip');
  expect(await page.getAttribute('#ch-polygon', 'aria-pressed') === 'true', 'current challenge remembered');
  expect((await page.textContent('#ch-square .tc-stars')).trim() === '★★★', 'stars remembered after reload');
  log('progress', (await page.textContent('#ch-progress')).trim());
};
