/* Interaction test for Fraction Lab (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, lang, expect, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const attr = (sel, a) => page.getAttribute(sel, a);
  const typeNum = async (sel, v) => { await page.fill(sel, String(v)); await page.press(sel, 'Enter'); };
  /* type without pressing Enter, so the input still has focus (like a teacher who types and then taps something else) */
  const typeOnly = async (sel, v) => { await page.click(sel); await page.keyboard.press('Control+A'); await page.keyboard.type(String(v)); };
  const gcd = (a, b) => { while (b) { const r = a % b; a = b; b = r; } return a; };
  const cls = async (sel) => (await attr(sel, 'class')) || '';
  /* Check and Next sit in the same spot; Next ignores presses in the first 450 ms (double-click guard) */
  const clickNext = async (sel) => { await page.waitForTimeout(500); await page.click(sel); };
  const deva = (n) => String(n).split('').map((c) => String.fromCharCode(0x966 + +c)).join('');

  /* ---------------- 1. Build ---------------- */
  expect(await attr('#tab-build', 'aria-selected') === 'true', 'Build tab is open first');
  expect((await page.$$('#b-view svg .pt.s1')).length === 3, 'default 3/4 pie has 3 shaded slices');
  await typeNum('#b-n', 7);
  await page.waitForFunction(() => document.querySelectorAll('#b-view svg').length === 2);
  const mx = await page.$eval('#b-mixed', (e) => [e.dataset.w, e.dataset.r, e.dataset.d].join(' '));
  expect(mx === '1 3 4', '7/4 is the mixed number 1 3/4, got ' + mx);
  expect(await attr('#b-dec', 'data-v') === '1.75', '7/4 = 1.75, got ' + await attr('#b-dec', 'data-v'));
  expect(await attr('#b-pct', 'data-v') === '175%', '7/4 = 175%, got ' + await attr('#b-pct', 'data-v'));
  await page.click('#b-d-plus');
  expect(await page.inputValue('#b-d') === '5', 'denominator + makes 7/5');
  await page.click('#b-model [data-model="bar"]');
  await page.click('#b-view svg[data-whole="0"] rect[data-idx="1"]');
  expect(await page.inputValue('#b-n') === '2', 'tapping the 2nd part of the bar sets the numerator to 2');
  /* regression: typing a number and then tapping a part straight away (the blur re-render used to swallow the tap) */
  await typeOnly('#b-n', 4);
  await page.click('#b-view svg[data-whole="0"] rect[data-idx="2"]');
  expect(await page.inputValue('#b-n') === '3', 'tap right after typing still shades up to the 3rd part, got ' + await page.inputValue('#b-n'));
  /* digits typed in an Indian script are understood */
  await typeNum('#b-d', deva(12));
  expect(await page.inputValue('#b-d') === '12', 'Devanagari digits १२ are read as 12, got ' + await page.inputValue('#b-d'));
  await page.click('#b-presets [data-n="6"][data-d="8"]');
  expect(await attr('#b-simp-v', 'data-v') === '3/4', '6/8 in simplest form is 3/4');
  await typeNum('#b-n', 1); await typeNum('#b-d', 17);
  expect(await attr('#b-dec', 'data-v') === '0.059' && (await txt('#b-dec .fl-rep')) === '0588235294117647', '1/17: the whole 16-digit repeating block gets the bar');
  await page.click('#b-presets [data-n="1"][data-d="3"]');
  expect((await txt('#b-dec')).startsWith('0.3'), '1/3 shows a repeating decimal 0.3…');
  await page.click('#b-model [data-model="set"]');
  expect((await page.$$('#b-view .ld')).length === 1 && (await page.$$('#b-view .ld-empty')).length === 2, 'set model: 1 of 3 laddoos coloured');

  /* ---------------- 2. Compare ---------------- */
  await page.click('#tab-compare');
  expect(await attr('#c-sign', 'data-sign') === '<', '2/3 < 3/4');
  expect((await txt('#c-explain')).includes('12'), 'explanation uses the common denominator 12');
  await typeNum('#c2-n', 4);
  await typeNum('#c2-d', 6);
  expect(await attr('#c-sign', 'data-sign') === '=', '2/3 = 4/6');
  await page.check('#c-cut');
  expect((await page.$$('#c-rows svg:nth-of-type(1) rect.pt')).length >= 6, 'same-size parts: bars are cut into 6ths');
  await page.check('#c-guessmode');
  expect(await txt('#c-sign') === '?', 'guess mode hides the sign');
  expect(!(await page.isVisible('#c-explain')), 'guess mode hides the explanation');
  await page.click('#c-g-eq');
  expect((await cls('#c-gfb')).includes('ok'), 'guessing = is marked correct');
  expect(await page.isVisible('#c-explain'), 'explanation appears after the guess');
  await page.click('#c1-n'); await page.click('#c-rows');   // focus + blur without a change
  expect(await page.isVisible('#c-explain'), 'just clicking into a box does not hide the revealed answer again');
  await page.uncheck('#c-guessmode');

  /* ---------------- 3. Equivalent fractions ---------------- */
  await page.click('#tab-equiv');
  await page.click('#e-family [data-k="4"]');
  expect(await attr('#e-res', 'data-n') === '8' && await attr('#e-res', 'data-d') === '12', '2/3 × 4 = 8/12');
  const after = await page.$$eval('#e-after svg .pt', (els) => [els.length, els.filter((e) => e.classList.contains('s1')).length]);
  expect(after[0] === 12 && after[1] === 8, 're-sliced model has 12 parts with 8 shaded, got ' + after);
  await page.$eval('#e-k', (el) => { el.value = '3'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  expect(await attr('#e-res', 'data-d') === '9', 'slider × 3 gives 6/9');
  expect((await page.$$('#e-wall .fl-wrow.yes')).length === 4, 'fraction wall: rows 3, 6, 9, 12 match 2/3');
  /* regression: type 4/6 and tap "Simplify it" at once */
  await typeNum('#e-d', 6); await typeOnly('#e-n', 4);
  await page.click('#e-simplify');
  expect(await page.inputValue('#e-n') === '2' && await page.inputValue('#e-d') === '3', '"Simplify it" right after typing 4/6 gives 2/3');
  await typeOnly('#e-n', 1);
  await page.click('#e-family [data-k="5"]');
  expect(await attr('#e-res', 'data-n') === '5' && await attr('#e-res', 'data-d') === '15', 'chip × 5 right after typing gives 5/15');

  /* ---------------- 4. Add & subtract ---------------- */
  await page.click('#tab-add');
  expect(await attr('#a-result', 'data-n') === '11' && await attr('#a-result', 'data-d') === '12', '3/4 + 1/6 = 11/12');
  expect((await page.$$('#a-steps li')).length >= 5, 'worked steps are listed (LCM, convert, add, simplify)');
  await page.click('#a-op-sub');
  expect(await attr('#a-result', 'data-n') === '7' && await attr('#a-result', 'data-d') === '12', '3/4 − 1/6 = 7/12');
  await page.check('#a-stepmode');
  expect((await page.$$('#a-steps li')).length === 1, 'step-by-step mode starts with one step');
  await page.click('#a-next');
  expect((await page.$$('#a-steps li')).length === 2, 'Next step reveals the second step');
  await page.click('#a1-n'); await page.click('#a-vis-cap');   // focus + blur without a change
  expect((await page.$$('#a-steps li')).length === 2, 'clicking into a box and out again keeps the steps shown so far');
  await page.click('#a-all');
  await page.click('#a-swap');
  expect(await page.isVisible('#a-warn'), '1/6 − 3/4 warns that the answer would be below zero');
  await page.click('#a-swap2');
  expect(!(await page.isVisible('#a-warn')), 'swapping back removes the warning');
  await page.uncheck('#a-stepmode');
  await page.click('#a-op-add');
  /* more than one whole: 7/4 + 5/3 = 41/12 = 3 5/12, bars on one scale, at most 2 wholes per line (1 on phones) */
  await typeNum('#a1-n', 7); await typeNum('#a2-d', 3); await typeNum('#a2-n', 5);
  expect(await attr('#a-result', 'data-n') === '41' && await attr('#a-result', 'data-d') === '12', '7/4 + 5/3 = 41/12');
  expect((await txt('#a-result')).replace(/\s/g, '').includes('3512'), 'answer also shown as the mixed number 3 5/12');
  const lines = await page.$$eval('#a-vis svg[data-row="2"] rect.rim', (r) => [r.length, new Set(r.map((x) => x.getAttribute('y'))).size]);
  expect(lines[0] === 4 && lines[1] === ((await page.evaluate(() => innerWidth)) < 600 ? 4 : 2), 'four wholes drawn in lines of two, got ' + lines);
  await typeNum('#a1-n', 3); await typeNum('#a2-d', 6); await typeNum('#a2-n', 1);

  /* ---------------- 5. Number line game ---------------- */
  await page.click('#tab-line');
  await page.click('#l-level [data-level="easy"]');
  let n = +(await attr('#l-target', 'data-n')), d = +(await attr('#l-target', 'data-d'));
  await page.focus('#l-marker');
  for (let i = 0; i < n; i++) await page.keyboard.press('ArrowRight');
  await page.click('#l-check');
  expect((await cls('#l-fb')).includes('ok'), `keyboard placing ${n}/${d} is correct`);
  expect(await txt('#l-score') === '1', 'score is 1');
  await clickNext('#l-next');
  n = +(await attr('#l-target', 'data-n')); d = +(await attr('#l-target', 'data-d'));
  const box = await page.$eval('#l-svg', (s) => {
    const r = s.getBoundingClientRect(), D = s.dataset;
    return { x: r.left, y: r.top, w: r.width, h: r.height, x0: +D.x0, x1: +D.x1, ly: +D.y, vbw: +D.vbw, vbh: +D.vbh, range: +D.range };
  });
  const X = box.x + (box.x0 + (box.x1 - box.x0) * (n / d) / box.range) * box.w / box.vbw, Y = box.y + box.ly * box.h / box.vbh;
  await page.mouse.move(box.x + box.w * 0.1, Y);
  await page.mouse.down();
  await page.mouse.move(X, Y, { steps: 6 });
  await page.mouse.up();
  await page.click('#l-check');
  expect((await cls('#l-fb')).includes('ok'), `dragging the marker to ${n}/${d} is correct`);
  expect(await txt('#l-score') === '2', 'score is 2');
  await clickNext('#l-next');
  await page.focus('#l-marker');
  await page.keyboard.press('Home');
  await page.dblclick('#l-check');   // a double-click must not jump straight past the feedback
  expect((await cls('#l-fb')).includes('bad'), 'leaving the marker at 0 is wrong');
  expect(await page.isVisible('#l-next') && (await txt('#l-hud')).includes('3'), 'double-clicking Check keeps the feedback of round 3 on screen');
  expect(await txt('#l-score') === '2', 'score stays 2');
  expect((await page.$$('#l-svg .goal')).length === 1, 'the right spot is marked in green');

  /* ---------------- 6. Practice ---------------- */
  await page.click('#tab-practice');
  for (const ty of ['compare', 'add', 'sub', 'mixed', 'shaded', 'story']) await page.click(`#p-types [data-type="${ty}"]`);
  expect(await attr('#p-q', 'data-type') === 'simplify', 'only simplify questions are left');
  let q = JSON.parse(await attr('#p-q', 'data-q'));
  let g = gcd(q.n, q.d);
  await page.fill('#p-num', String(q.n / g));
  await page.fill('#p-den', String(q.d / g));
  await page.click('#p-check');
  expect((await cls('#p-fb')).includes('ok'), `simplest form of ${q.n}/${q.d} is accepted`);
  expect(await txt('#p-sc') === '1/1', 'score 1/1, got ' + await txt('#p-sc'));
  await clickNext('#p-next');
  q = JSON.parse(await attr('#p-q', 'data-q'));
  await page.fill('#p-num', String(q.n));
  await page.fill('#p-den', String(q.d));
  await page.press('#p-den', 'Enter');
  expect((await cls('#p-fb')).includes('bad'), 'an unsimplified answer is not accepted for "simplify"');
  expect(await txt('#p-sc') === '1/2', 'score 1/2');
  /* answer typed in Devanagari digits, then a double-click on Check: counted once and the feedback stays */
  await clickNext('#p-next');
  q = JSON.parse(await attr('#p-q', 'data-q'));
  const qno = await txt('#p-num-lbl');
  await page.fill('#p-num', deva(q.ans[0]));
  await page.fill('#p-den', deva(q.ans[1]));
  await page.dblclick('#p-check');
  expect((await cls('#p-fb')).includes('ok'), `answer in Devanagari digits ${deva(q.ans[0])}/${deva(q.ans[1])} is accepted`);
  expect(await txt('#p-num-lbl') === qno && await page.isVisible('#p-next'), 'double-click on Check does not skip to the next question');
  expect(await txt('#p-sc') === '2/3', 'score 2/3, got ' + await txt('#p-sc'));
  await page.click('#p-types [data-type="compare"]');
  await page.click('#p-types [data-type="simplify"]');
  expect(await attr('#p-q', 'data-type') === 'compare', 'now a compare question');
  q = JSON.parse(await attr('#p-q', 'data-q'));
  const l = q.a[0] * q.b[1], r = q.b[0] * q.a[1];
  await page.click(l > r ? '#p-s-gt' : (l < r ? '#p-s-lt' : '#p-s-eq'));
  expect((await cls('#p-fb')).includes('ok'), 'the right sign is accepted');
  expect(await txt('#p-sc') === '3/4', 'score 3/4');
  await page.click('#p-types [data-type="add"]');
  await page.click('#p-types [data-type="compare"]');
  expect(await attr('#p-q', 'data-type') === 'add', 'now an add question');
  await page.click('#p-check');
  expect((await cls('#p-fb')).includes('hint'), 'checking an empty answer gives a hint');
  expect(await txt('#p-sc') === '3/4', 'an empty answer is not counted');
  q = JSON.parse(await attr('#p-q', 'data-q'));
  const sn = q.a[0] * q.b[1] + q.b[0] * q.a[1], sd = q.a[1] * q.b[1], sg = gcd(sn, sd);
  await page.fill('#p-num', String(sn / sg));
  await page.fill('#p-den', String(sd / sg));
  await page.click('#p-check');
  expect((await cls('#p-fb')).includes('ok'), `${q.a.join('/')} + ${q.b.join('/')} = ${sn / sg}/${sd / sg} is accepted`);
  expect(await txt('#p-sc') === '4/5', 'score 4/5');

  /* printable worksheet: 20 questions + 20 answers (print dialog stubbed) */
  await page.evaluate(() => { window.__print = window.print; window.print = () => { window.__printed = 1; }; });
  await page.click('#p-print');
  await page.waitForTimeout(150);
  const ws = await page.evaluate(() => [document.querySelectorAll('#worksheet .fl-ws-list > li').length, document.querySelectorAll('#worksheet .fl-ws-key li').length, window.__printed, document.body.classList.contains('fl-print-ws')]);
  expect(ws[0] === 20 && ws[1] === 20 && ws[2] === 1, 'worksheet has 20 questions and 20 answers, got ' + ws);
  await page.evaluate(() => { window.print = window.__print; document.body.classList.remove('fl-print-ws'); });

  /* ---------------- 7. RTL + narrow projector checks ---------------- */
  await page.evaluate(() => EDU.setLang('ur'));
  expect(await page.$eval('#l-svg', (s) => getComputedStyle(s).direction) === 'ltr', 'number-line SVG text stays left-to-right in Urdu');
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.evaluate(() => EDU.setLang('ml'));
  await page.waitForTimeout(150);
  const tabsOut = await page.$$eval('#tabs [role="tab"]', (b) => b.filter((x) => { const r = x.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }).length);
  expect(tabsOut === 0, 'all 6 tabs are visible at 1024 px in Malayalam, hidden: ' + tabsOut);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate((L) => EDU.setLang(L), lang);

  /* ---------------- 8. state survives a reload ---------------- */
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(700);
  expect(await attr('#tab-practice', 'aria-selected') === 'true', 'the Practice tab is reopened after reload');
  expect(await txt('#p-sc') === '4/5', 'practice score survives a reload');
  const saved = await page.evaluate(() => EDU.store('fraction-lab').get('state', {}));
  expect(saved.b && saved.b.n === 1 && saved.b.d === 3 && saved.b.model === 'set', 'builder fraction 1/3 and model are saved');
  log('practice question types', saved.p.types.join(','));
};
