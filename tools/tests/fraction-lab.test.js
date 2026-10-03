/* Interaction test for Fraction Lab (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const attr = (sel, a) => page.getAttribute(sel, a);
  const typeNum = async (sel, v) => { await page.fill(sel, String(v)); await page.press(sel, 'Enter'); };
  const gcd = (a, b) => { while (b) { const r = a % b; a = b; b = r; } return a; };
  const cls = async (sel) => (await attr(sel, 'class')) || '';

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
  await page.click('#b-presets [data-n="6"][data-d="8"]');
  expect(await attr('#b-simp-v', 'data-v') === '3/4', '6/8 in simplest form is 3/4');
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
  await page.click('#a-all');
  await page.click('#a-swap');
  expect(await page.isVisible('#a-warn'), '1/6 − 3/4 warns that the answer would be below zero');
  await page.click('#a-swap2');
  expect(!(await page.isVisible('#a-warn')), 'swapping back removes the warning');
  await page.uncheck('#a-stepmode');
  await page.click('#a-op-add');

  /* ---------------- 5. Number line game ---------------- */
  await page.click('#tab-line');
  await page.click('#l-level [data-level="easy"]');
  let n = +(await attr('#l-target', 'data-n')), d = +(await attr('#l-target', 'data-d'));
  await page.focus('#l-marker');
  for (let i = 0; i < n; i++) await page.keyboard.press('ArrowRight');
  await page.click('#l-check');
  expect((await cls('#l-fb')).includes('ok'), `keyboard placing ${n}/${d} is correct`);
  expect(await txt('#l-score') === '1', 'score is 1');
  await page.click('#l-next');
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
  await page.click('#l-next');
  await page.focus('#l-marker');
  await page.keyboard.press('Home');
  await page.click('#l-check');
  expect((await cls('#l-fb')).includes('bad'), 'leaving the marker at 0 is wrong');
  expect(await txt('#l-score') === '2', 'score stays 2');

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
  await page.click('#p-next');
  q = JSON.parse(await attr('#p-q', 'data-q'));
  await page.fill('#p-num', String(q.n));
  await page.fill('#p-den', String(q.d));
  await page.press('#p-den', 'Enter');
  expect((await cls('#p-fb')).includes('bad'), 'an unsimplified answer is not accepted for "simplify"');
  expect(await txt('#p-sc') === '1/2', 'score 1/2');
  await page.click('#p-types [data-type="compare"]');
  await page.click('#p-types [data-type="simplify"]');
  expect(await attr('#p-q', 'data-type') === 'compare', 'now a compare question');
  q = JSON.parse(await attr('#p-q', 'data-q'));
  const l = q.a[0] * q.b[1], r = q.b[0] * q.a[1];
  await page.click(l > r ? '#p-s-gt' : (l < r ? '#p-s-lt' : '#p-s-eq'));
  expect((await cls('#p-fb')).includes('ok'), 'the right sign is accepted');
  expect(await txt('#p-sc') === '2/3', 'score 2/3');
  await page.click('#p-types [data-type="add"]');
  await page.click('#p-types [data-type="compare"]');
  expect(await attr('#p-q', 'data-type') === 'add', 'now an add question');
  await page.click('#p-check');
  expect((await cls('#p-fb')).includes('hint'), 'checking an empty answer gives a hint');
  expect(await txt('#p-sc') === '2/3', 'an empty answer is not counted');
  q = JSON.parse(await attr('#p-q', 'data-q'));
  const sn = q.a[0] * q.b[1] + q.b[0] * q.a[1], sd = q.a[1] * q.b[1], sg = gcd(sn, sd);
  await page.fill('#p-num', String(sn / sg));
  await page.fill('#p-den', String(sd / sg));
  await page.click('#p-check');
  expect((await cls('#p-fb')).includes('ok'), `${q.a.join('/')} + ${q.b.join('/')} = ${sn / sg}/${sd / sg} is accepted`);
  expect(await txt('#p-sc') === '3/4', 'score 3/4');

  /* ---------------- 7. state survives a reload ---------------- */
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(700);
  expect(await attr('#tab-practice', 'aria-selected') === 'true', 'the Practice tab is reopened after reload');
  expect(await txt('#p-sc') === '3/4', 'practice score survives a reload');
  const saved = await page.evaluate(() => EDU.store('fraction-lab').get('state', {}));
  expect(saved.b && saved.b.n === 1 && saved.b.d === 3 && saved.b.model === 'set', 'builder fraction 1/3 and model are saved');
  log('practice question types', saved.p.types.join(','));
};
