/* Interaction test for Flowchart & Algorithm Lab (run by tools/verify.js in en and hi).
   Drives the UI by ids / CSS only; expected values were computed by hand:
   largest of 5, 9, 2 = 9 · factorial 5 = 120 (16 trace steps) · a / 0 -> division by zero · while i > 0: i = i + 1 -> 10,000-step guard. */
module.exports = async function ({ page, expect, t, log, base }) {
  const fs = require('fs');
  const status = async () => page.getAttribute('#run-status', 'data-status');
  const steps = async () => +(await page.getAttribute('#run-status', 'data-steps'));
  const lastOut = async () => page.$$eval('#console .cl', a => a.length ? a[a.length - 1].textContent.trim() : '');
  const varVal = async (v) => page.getAttribute('#vars tr[data-var="' + v + '"] td.v', 'data-value');
  const blocks = async () => page.evaluate(() => JSON.stringify(FCAPP.program.blocks, (k, v) => k === 'id' ? undefined : v));
  const pick = async (id) => { await page.selectOption('#ex-select', id); await page.waitForTimeout(250); };
  const runNow = async () => { await page.click('#btn-run'); await page.waitForTimeout(300); };
  const setInputs = async (lines) => { await page.fill('#inputs-pre', lines.join('\n')); await page.waitForTimeout(250); };
  const setProgram = async (p) => { await page.evaluate(p => FCAPP.setProgram(p), p); await page.waitForTimeout(200); };

  await page.waitForSelector('#fc-wrap svg');
  await page.selectOption('#speed', 'instant');

  // --- largest of three: 2 decision diamonds, run with 5, 9, 2 -> 9 ---
  await pick('largest3');
  const diamonds = await page.$$eval('#fc-wrap .fc-node[data-kind="dec"]', a => a.length);
  expect(diamonds === 2, 'largest of three draws 2 decision diamonds, got ' + diamonds);
  expect((await page.$$eval('#fc-wrap .fc-node[data-kind="io"]', a => a.length)) === 4, '3 inputs + 1 output = 4 parallelograms');
  expect((await page.$$eval('#fc-wrap .fc-node[data-kind="term"]', a => a.length)) === 2, 'Start and End terminals');
  await setInputs(['5', '9', '2']);
  await runNow();
  expect((await status()) === 'done', 'run finished, status ' + (await status()));
  expect(/(^|\s)9$/.test(await lastOut()), 'largest of 5, 9, 2 is 9, printed "' + (await lastOut()) + '"');
  expect((await varVal('largest')) === '9' && (await varVal('b')) === '9', 'variable table: largest = 9');
  expect((await steps()) === 10, 'largest of three takes 10 steps, got ' + (await steps()));
  expect((await page.$$eval('#dry tbody tr', a => a.length)) === 10, 'dry-run table has one row per step');
  const pseudo = await page.textContent('#pseudo');
  expect(/IF b > largest THEN/.test(pseudo) && /END IF/.test(pseudo), 'pseudocode uses IF … THEN … END IF');
  const py = await page.textContent('#python');
  expect(/if b > largest:/.test(py) && /print\("/.test(py), 'Python view is generated');

  // --- editing a condition changes the output (b > largest -> b < largest, so 5 stays the largest) ---
  await page.click('.blk[data-type="decision"] .blk-acts button[data-act="edit"]');
  await page.waitForSelector('#f-cond');
  await page.fill('#f-cond', 'b < largest');
  await page.click('#md-save');
  await page.waitForTimeout(300);
  expect((await page.$('.edu-modal')) === null, 'edit modal closes after save');
  await runNow();
  expect(/(^|\s)5$/.test(await lastOut()), 'after editing the condition the output becomes 5, got "' + (await lastOut()) + '"');
  // a bad expression is refused in the modal
  await page.click('.blk[data-type="decision"] .blk-acts button[data-act="edit"]');
  await page.waitForSelector('#f-cond');
  await page.fill('#f-cond', 'b > > largest');
  await page.click('#md-save');
  await page.waitForTimeout(200);
  expect((await page.textContent('.md-err')).trim().length > 0 && (await page.$('.edu-modal')) !== null, 'syntax error shown, modal stays open');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // --- factorial 5 -> 120, variable table shows i and fact, 16 steps ---
  await pick('factorial');
  await setInputs(['5']);
  await runNow();
  expect(/(^|\s)120$/.test(await lastOut()), 'factorial of 5 is 120, got "' + (await lastOut()) + '"');
  expect((await varVal('fact')) === '120' && (await varVal('i')) === '5' && (await varVal('n')) === '5', 'variables n, fact and i are in the table');
  expect((await steps()) === 16, 'factorial 5 takes 16 steps, got ' + (await steps()));
  expect((await page.$$eval('#dry thead th', a => a.map(x => x.textContent.trim()))).includes('fact'), 'dry-run table has a fact column');
  expect(/range\(1, n \+ 1\)/.test(await page.textContent('#python')), 'FOR i = 1 TO n becomes range(1, n + 1)');

  // step mode: START, then the first input (prefilled) -> paused at step 2 with a highlighted line
  await page.click('#btn-restart');
  await page.click('#btn-step'); await page.click('#btn-step');
  await page.waitForTimeout(150);
  expect((await status()) === 'paused' && (await steps()) === 2, 'two steps: paused at step 2, got ' + (await status()) + ' ' + (await steps()));
  expect((await page.$$eval('#pseudo .ln.cur', a => a.length)) >= 1, 'current pseudocode line highlighted');
  // input panel appears when the prefilled values run out
  await setInputs([]);
  await page.click('#btn-restart');
  await runNow();
  expect((await status()) === 'input' && !(await page.$eval('#in-panel', e => e.hidden)), 'program waits for input when no values are prefilled');
  await page.fill('#in-val', '4');
  await page.click('#in-ok');
  await page.waitForTimeout(300);
  expect(/(^|\s)24$/.test(await lastOut()), 'typed input 4 -> factorial 24, got "' + (await lastOut()) + '"');

  // --- guards: infinite loop, division by zero, unknown variable ---
  await setProgram({ name: 'loop', inputs: [], blocks: [
    { type: 'process', var: 'i', expr: '1' },
    { type: 'while', cond: 'i > 0', body: [{ type: 'process', var: 'i', expr: 'i + 1' }] }
  ] });
  await runNow();
  expect((await status()) === 'error' && (await page.getAttribute('#run-error', 'data-key')) === 'err_infinite', 'infinite loop stopped with the infinite-loop message');
  expect((await steps()) >= 10000, 'guard trips at 10,000 steps, got ' + (await steps()));
  expect((await page.textContent('#run-error')).includes(t('err_infinite', { n: 10000 })), 'translated infinite-loop message shown');

  await setProgram({ name: 'div', inputs: [], blocks: [
    { type: 'process', var: 'a', expr: '5' }, { type: 'process', var: 'b', expr: '0' }, { type: 'process', var: 'c', expr: 'a / b' }
  ] });
  await runNow();
  expect((await page.getAttribute('#run-error', 'data-key')) === 'err_div_zero', 'division by zero message');
  expect((await page.$$eval('#dry tbody tr.bad', a => a.length)) === 1, 'dry-run table marks the failing step');

  await setProgram({ name: 'unk', inputs: [], blocks: [{ type: 'output', expr: 'total' }] });
  await runNow();
  expect((await page.getAttribute('#run-error', 'data-key')) === 'err_unknown_var', 'unknown variable message');

  // --- exports: PNG, CSV, JSON save / load round-trip ---
  await pick('grade');
  await setInputs(['78']);
  await runNow();
  expect(/(^|\s)B$/.test(await lastOut()), 'grade for 78 marks is B, got "' + (await lastOut()) + '"');
  const before = await blocks();
  const [png] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#btn-png')]);
  expect(/\.png$/.test(png.suggestedFilename()), 'PNG export triggers a download: ' + png.suggestedFilename());
  const [csv] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#btn-csv')]);
  expect(/\.csv$/.test(csv.suggestedFilename()), 'CSV export triggers a download');
  const [json] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#btn-save')]);
  expect(/\.json$/.test(json.suggestedFilename()), 'JSON save triggers a download');
  const jsonPath = await json.path();
  const saved = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  expect(saved.app === 'flowchart-maker' && Array.isArray(saved.blocks) && saved.blocks.length === 3, 'saved JSON holds the program (input, decision, output)');
  await page.click('#btn-new');
  await page.waitForTimeout(200);
  expect((await page.evaluate(() => FCAPP.program.blocks.length)) === 0 && (await page.$('#ed-empty')) !== null, 'New empties the program');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 20000 }), page.click('#btn-load')]);
  await chooser.setFiles(jsonPath);
  await page.waitForTimeout(500);
  expect((await blocks()) === before, 'JSON load restores the same blocks');
  expect((await page.$$eval('#fc-wrap .fc-node[data-kind="dec"]', a => a.length)) === 4, 'grade program redrawn with 4 decisions');

  // --- share link: program packed into the URL ---
  const packed = await page.evaluate(() => EDU.pack({ name: 'Shared one', inputs: ['3'], blocks: [{ type: 'input', var: 'n', prompt: 'n?' }, { type: 'output', expr: 'n * 2' }] }));
  await page.goto(base + 'apps/flowchart-maker/?lang=' + (await page.evaluate(() => EDU.lang)) + '&p=' + packed, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  expect((await page.inputValue('#prog-name')) === 'Shared one' && (await page.evaluate(() => FCAPP.program.blocks.length)) === 2, 'program opened from the share link');
  expect(!/[?&]p=/.test(page.url()), 'the p= parameter is removed from the address after loading');

  // --- reload keeps the program, Reset restores the default example ---
  await page.fill('#prog-name', 'Kept after reload');
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(900);
  expect((await page.inputValue('#prog-name')) === 'Kept after reload', 'program name survives a reload');
  expect((await page.evaluate(() => FCAPP.program.blocks.length)) === 2 && (await page.inputValue('#inputs-pre')) === '3', 'blocks and inputs survive a reload');
  await page.click('#btn-reset');
  await page.waitForTimeout(400);
  expect((await page.evaluate(() => FCAPP.program.blocks.length)) === 4 && (await page.inputValue('#ex-select')) === 'sum2', 'Reset restores the "sum of two numbers" example');
  expect((await page.inputValue('#prog-name')) !== 'Kept after reload', 'Reset replaces the edited name');
  await setInputs(['12', '8']);
  await page.selectOption('#speed', 'instant');
  await runNow();
  expect(/(^|\s)20$/.test(await lastOut()), 'after reset, 12 + 8 = 20');
  log('flowchart-maker: all checks passed');
};
