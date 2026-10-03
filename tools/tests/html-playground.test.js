/* Interaction test for Web Page Maker (html-playground), run by tools/verify.js in en and hi.
   Covers: starter template in the preview, a template's JavaScript (calculator), console.log + error
   line mapping, the infinite-loop guard, the HTML tag check, the console input, save / download /
   reload, and inserting a cheat-sheet snippet. */
module.exports = async function ({ page, expect, log }) {
  const preview = () => page.frames().find((f) => f !== page.mainFrame());
  const entries = () => page.evaluate(() => window.HP_STATE.entries.map((e) => ({ lv: e.lv, key: e.key || '', text: e.text || '', file: e.file || '', line: e.line || 0 })));
  async function runAndWait(pred, arg, timeout) {
    const before = await page.evaluate(() => window.HP_STATE.runs);
    await page.click('#hpRun');
    await page.waitForFunction((b) => window.HP_STATE.runs > b, before);
    if (pred) await page.waitForFunction(pred, arg, { timeout: timeout || 10000 });
  }

  // 1) the starter page is built in the current language and shown in the preview
  await page.waitForFunction(() => window.HP_STATE && window.HP_STATE.runs > 0);
  const tpl = await page.evaluate(() => window.APP_CONTENT[EDU.lang].tpl.first.t);
  let f = preview();
  await f.waitForSelector('h1');
  const h1 = (await f.textContent('h1')).trim();
  expect(h1 === tpl.h1, 'preview shows the localized starter heading, got ' + h1);
  await page.waitForFunction((msg) => window.HP_STATE.entries.some((e) => e.text === msg), tpl.log, { timeout: 8000 });
  expect((await page.inputValue('#hpHtml')).includes('<link rel="stylesheet" href="style.css">'), 'starter HTML links style.css');

  // 2) calculator template: its JavaScript works inside the sandboxed preview (12 x 4 = 48)
  await page.selectOption('#hpTpl', 'calc');
  await page.waitForFunction(() => document.getElementById('hpJs').value.includes('function calculate'));
  f = preview();
  await f.waitForSelector('#result');
  await f.click('button[data-op="*"]');
  let res = (await f.textContent('#result')).trim();
  expect(res === '48', 'calculator 12 × 4 should show 48, got ' + res);
  await f.fill('#b', '0');
  await f.click('button[data-op="/"]');
  res = (await f.textContent('#result')).trim();
  const zero = await page.evaluate(() => window.APP_CONTENT[EDU.lang].tpl.calc.t.zero);
  expect(res === zero, 'divide by 0 shows the localized message, got ' + res);

  // 3) console.log output and a runtime error mapped to JS line 3
  await page.click('#hpTab-js');
  await page.fill('#hpJs', 'console.log(6 * 7);\nlet total = 0;\nmissingFunction();\n');
  await runAndWait(() => window.HP_STATE.entries.some((e) => e.lv === 'error'));
  let es = await entries();
  expect(es.some((e) => e.lv === 'log' && e.text === '42'), 'console shows 42: ' + JSON.stringify(es));
  const err = es.find((e) => e.lv === 'error');
  expect(/missingFunction/.test(err.text) && err.file === 'js' && err.line === 3, 'error points at JS line 3: ' + JSON.stringify(err));
  const mark = await page.textContent('#hpEd-js .hp-m-err');
  expect(mark.trim() === '3', 'gutter marks line 3, got ' + mark);

  // 4) an endless loop is stopped and the page keeps working
  await page.fill('#hpJs', 'let n = 0;\nwhile (true) {\n  n++;\n}\nconsole.log("after loop", n > 0);\n');
  await runAndWait(() => window.HP_STATE.entries.some((e) => e.key === 'loop_stopped'), null, 20000);
  await page.waitForFunction(() => window.HP_STATE.entries.some((e) => e.text === 'after loop true'), null, { timeout: 8000 });
  es = await entries();
  const loop = es.find((e) => e.key === 'loop_stopped');
  expect(loop.file === 'js' && loop.line === 2, 'loop warning points at line 2: ' + JSON.stringify(loop));

  // 5) HTML tag check finds a wrong closing tag and an unclosed <div>
  await page.fill('#hpJs', 'console.log("ok");\n');
  await page.click('#hpTab-html');
  await page.fill('#hpHtml', '<h1>Hi</h1>\n<div>\n<p>Text</span>\n');
  await runAndWait(() => window.HP_STATE.entries.some((e) => e.text === 'ok'));
  es = await entries();
  expect(es.some((e) => e.key === 'lint_stray' && e.line === 3), 'stray </span> on line 3 is reported');
  expect(es.some((e) => e.key === 'lint_unclosed' && e.line === 2), 'unclosed <div> on line 2 is reported');
  f = preview();
  expect((await f.textContent('h1')).trim() === 'Hi', 'a fragment without <html> still renders');

  // 6) console input runs one line of JavaScript inside the page
  await page.fill('#hpConInput', 'document.querySelectorAll("p").length + 40');
  await page.press('#hpConInput', 'Enter');
  await page.waitForFunction(() => window.HP_STATE.entries.some((e) => e.lv === 'res'));
  es = await entries();
  expect(es.find((e) => e.lv === 'res').text === '41', 'console input evaluates to 41');

  // 7) save, download a single .html with CSS and JS inlined, reload keeps the work
  await page.fill('#hpName', 'Test page');
  await page.click('#hpSave');
  expect((await page.textContent('#hpProjCount')).trim() === '1', 'one project saved');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#hpDownload')]);
  expect(dl.suggestedFilename() === 'Test-page.html', 'download name from project name: ' + dl.suggestedFilename());
  const fs = require('fs');
  const html = fs.readFileSync(await dl.path(), 'utf8');
  expect(/^<!DOCTYPE html>/.test(html) && html.includes('<h1>Hi</h1>') && html.includes('console.log("ok");') && html.includes('<style>') && !html.includes('__hpLoop'), 'downloaded page is complete and clean');

  await page.reload();
  await page.waitForFunction(() => window.HP_STATE && window.HP_STATE.runs > 0);
  expect((await page.inputValue('#hpHtml')).includes('<p>Text</span>'), 'HTML survives a reload');
  expect((await page.inputValue('#hpName')) === 'Test page', 'project name survives a reload');

  // 8) cheat sheet: Insert adds a CSS rule to style.css
  if (!(await page.evaluate(() => document.getElementById('hpCheat').open))) await page.click('#hpCheat > summary');
  await page.click('#hpCheatSeg button[data-g="css"]');
  await page.click('#hpCheatList .hp-cheat-group:not([hidden]) .hp-cheat-item:first-child .hp-ins');
  const css = await page.inputValue('#hpCss');
  expect(/h1 \{\n  color: crimson;\n\}/.test(css), 'Insert added an h1 colour rule to the CSS tab');
  log('ok');
};
