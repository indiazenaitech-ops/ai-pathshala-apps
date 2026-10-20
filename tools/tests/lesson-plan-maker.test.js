/* Interaction test for Lesson Plan Maker (run by tools/verify.js in en and hi).
   Selects by id / CSS / data attributes only, never by text. */
module.exports = async function ({ page, expect, lang }) {
  const settle = (ms) => page.waitForTimeout(ms || 150);
  const state = () => page.evaluate(() => { const S = window.LessonPlanMaker.state(); return { fmt: S.draft.format, id: S.draft.id, dirty: S.dirty, plans: S.plans.length, cls: S.draft.cls, topic: S.draft.topic, school: S.draft.school, outcomes: S.draft.outcomes, steps: S.draft.steps.map(s => s.min), week: S.draft.week, tab: S.tab }; });
  const timing = () => page.$eval('#timing', el => ({ status: el.dataset.status, total: +el.dataset.total, over: +el.dataset.over }));

  // 0. the default sample is loaded and useful at once (3 steps, 35 of 40 min)
  await page.waitForSelector('#f-topic');
  let st = await state();
  expect(st.fmt === 'cbse' && st.steps.length === 3, 'default sample has 3 CBSE steps, got ' + JSON.stringify(st.steps));
  let T = await timing();
  expect(T.status === 'under' && T.total === 35, 'sample timing 35/40 under, got ' + JSON.stringify(T));
  expect((await page.$$('#tbar .tseg')).length === 3, 'timing bar draws one segment per step');

  // 1. a new plan: fill fields -> preview shows them
  await page.click('#btn-new');
  await settle();
  st = await state();
  expect(st.steps.length === 0 && st.topic === '', 'new plan is blank');
  expect((await page.$('#steps-empty')) !== null, 'empty-steps hint shown');
  await page.fill('#f-school', 'Test School Rohtak');
  await page.fill('#f-teacher', 'Sunita');
  await page.fill('#f-class', '6');
  await page.fill('#f-section', 'B');
  await page.fill('#f-subject', 'Mathematics');
  await page.fill('#f-topic', 'Equivalent fractions');
  await page.fill('#f-duration', '40');
  await page.fill('#f-hw', 'Ex 7.3 Q1-4');
  await settle(300);
  await page.click('#tab-preview');
  await settle();
  expect((await page.textContent('#pv-school')).trim() === 'Test School Rohtak', 'preview shows school');
  expect((await page.textContent('#pv-topic')).trim() === 'Equivalent fractions', 'preview shows topic');
  expect((await page.textContent('#pv-class')).replace(/\s+/g, ' ').trim() === '6 – B', 'preview shows class and section, got ' + (await page.textContent('#pv-class')));
  expect((await page.textContent('#pv-hw')).trim() === 'Ex 7.3 Q1-4', 'preview shows home assignment');
  expect((await page.$('#pv-steps')) !== null && (await page.$$('#pv-sec-steps')).length === 1, 'preview has the steps table');
  await page.click('#tab-edit');
  await settle();

  // 2. steps 15 + 20 + 15 against a 40-min period warns (10 over)
  for (const m of [15, 20, 15]) {
    await page.click('#step-add');
    await settle(100);
    const mins = await page.$$('#steps .st-min');
    await mins[mins.length - 1].fill(String(m));
    await settle(100);
  }
  T = await timing();
  expect(T.status === 'over' && T.total === 50 && T.over === 10, '15+20+15 vs 40 -> over by 10, got ' + JSON.stringify(T));
  expect((await page.$$('#tbar .tseg.over')).length >= 1, 'bar shows a red over-run segment');
  // shorten the last step to 5 -> exactly 40
  const mins3 = await page.$$('#steps .st-min');
  await mins3[2].fill('5');
  await settle(100);
  T = await timing();
  expect(T.status === 'exact' && T.total === 40 && T.over === 0, 'after shortening: exactly 40, got ' + JSON.stringify(T));
  // engine agrees
  const eng = await page.evaluate(() => window.LPM.timing([15, 20, 15], 40));
  expect(eng.total === 50 && eng.over === 10 && eng.status === 'over' && eng.pct === 100, 'LPM.timing([15,20,15],40) -> 50/10/over');

  // 3. Bloom verb insert appends "• verb " to the outcomes
  await page.fill('#f-outcomes', 'first line');
  await page.click('#bloom-levels button[data-level="apply"]');
  await settle(100);
  const verb = await page.$eval('#bloom-verbs .chip[data-i="1"]', b => b.dataset.verb);
  await page.click('#bloom-verbs .chip[data-i="1"]');
  await settle(100);
  const out = await page.inputValue('#f-outcomes');
  expect(out === 'first line\n• ' + verb + ' ', 'verb appended on a new bullet line, got ' + JSON.stringify(out));
  expect((await state()).outcomes === out, 'outcomes stored in the draft');

  // 4. NEP tag + material show up in the preview
  await page.click('#comp .chip[data-comp="critical"]');
  await page.click('#mat-chips .chip');
  await page.fill('#mat-input', 'Fraction strips');
  await page.click('#mat-add');
  await settle(100);
  expect((await page.$$('#mat-list li')).length === 2, 'two materials listed');
  await page.click('#tab-preview');
  await settle();
  expect((await page.$$('#pv-comp .pv-tag[data-comp="critical"]')).length === 1, 'NEP tag printed');
  expect((await page.$$('#pv-materials li')).length === 2, 'materials printed');
  expect((await page.$eval('#pv-total', td => td.dataset.total)) === '40', 'preview total minutes 40');
  await page.click('#tab-edit');
  await settle();

  // 5. switching format keeps the common fields; 5E has its own timing
  await page.click('#fmt-5e');
  await settle();
  st = await state();
  expect(st.fmt === '5e' && st.topic === 'Equivalent fractions' && st.school === 'Test School Rohtak', 'switch to 5E keeps topic and school');
  expect(await page.isVisible('#e5-card') && !(await page.isVisible('#cbse-body')), '5E card shown, CBSE body hidden');
  const phMins = await page.$$('#e5 .ph-min');
  expect(phMins.length === 5, '5 phases');
  for (let i = 0; i < 5; i++) { await phMins[i].fill(String([5, 10, 10, 10, 10][i])); }
  await settle(150);
  const T5 = await page.$eval('#timing-5e', el => ({ status: el.dataset.status, total: +el.dataset.total, over: +el.dataset.over }));
  expect(T5.status === 'over' && T5.total === 45 && T5.over === 5, '5E timing 45/40 over by 5, got ' + JSON.stringify(T5));
  await page.click('#fmt-weekly');
  await settle();
  st = await state();
  expect(st.fmt === 'weekly' && st.cls === '6', 'switch to weekly keeps class');
  expect(await page.isVisible('#week-card'), 'weekly grid shown');

  // 6. weekly plan cell edit persists (through a reload)
  await page.fill('#week input.w-topic[data-d="1"][data-p="2"]', 'Fractions on a number line');
  await page.fill('#week input.w-hw[data-d="1"][data-p="2"]', 'Ex 7.1');
  await settle(300);
  st = await state();
  expect(st.week['1-2'] && st.week['1-2'].topic === 'Fractions on a number line' && st.week['1-2'].hw === 'Ex 7.1', 'week cell stored, got ' + JSON.stringify(st.week));
  await page.reload({ waitUntil: 'load' });
  await settle(900);
  expect((await page.inputValue('#week input.w-topic[data-d="1"][data-p="2"]')) === 'Fractions on a number line', 'week cell survives reload');
  st = await state();
  expect(st.fmt === 'weekly' && st.topic === 'Equivalent fractions' && st.dirty === true, 'reload keeps the unsaved draft (format, topic, dirty flag)');
  await page.click('#fmt-cbse');
  await settle();
  expect((await state()).steps.join(',') === '15,20,5', 'CBSE steps kept across format switches and reload');

  // 7. save -> appears in the list; badge counts; duplicate -> 2 plans; delete -> 1
  await page.click('#btn-save');
  await settle();
  st = await state();
  expect(st.plans === 1 && st.dirty === false, 'saved: 1 plan, not dirty');
  expect((await page.getAttribute('#save-state', 'data-state')) === 'saved', 'save badge says saved');
  expect((await page.textContent('#plans-badge')).trim() === '1', 'tab badge 1');
  const savedId = st.id;
  await page.click('#tab-plans');
  await settle();
  expect((await page.$$('#plan-list .plan-item')).length === 1 && (await page.$('#plan-list .plan-item.current[data-id="' + savedId + '"]')) !== null, 'saved plan listed and marked current');
  await page.click('#plan-list .plan-item .p-dup');
  await settle();
  expect((await page.$$('#plan-list .plan-item')).length === 2, 'duplicate -> 2 plans');
  const ids = await page.$$eval('#plan-list .plan-item', a => a.map(x => x.dataset.id));
  expect(ids[0] !== ids[1], 'duplicate has a new id');
  // search by topic finds both; a nonsense query finds none
  await page.fill('#plan-search', 'equivalent');
  await settle();
  expect((await page.$$('#plan-list .plan-item')).length === 2, 'search matches topic');
  await page.fill('#plan-search', 'zzqq');
  await settle();
  expect((await page.$$('#plan-list .plan-item')).length === 0 && await page.isVisible('#plans-empty'), 'no match shows the hint');
  await page.fill('#plan-search', '');
  await settle();
  // delete the copy (not the current one): dialogs are auto-accepted by verify.js
  const other = ids.find(i => i !== savedId);
  await page.click('#plan-list .plan-item[data-id="' + other + '"] .p-del');
  await settle();
  expect((await page.$$('#plan-list .plan-item')).length === 1 && (await state()).plans === 1, 'delete -> 1 plan');
  // the saved list survives a reload
  await page.reload({ waitUntil: 'load' });
  await settle(900);
  expect((await state()).plans === 1 && (await state()).id === savedId, 'saved plan and current draft survive reload');

  // 8. JSON export / import round-trips through the engine
  const rt = await page.evaluate(() => {
    const S = window.LessonPlanMaker.state(), L = window.LPM;
    const text = L.exportJSON(S.plans);
    const r = L.importJSON(text);
    const bad = L.importJSON('{"hello": 1}'), garbage = L.importJSON('not json');
    const back = r.plans && r.plans[0];
    return { n: r.plans ? r.plans.length : 0, same: !!back && back.id === S.plans[0].id && back.topic === S.plans[0].topic && JSON.stringify(back.steps) === JSON.stringify(S.plans[0].steps) && JSON.stringify(back.week) === JSON.stringify(S.plans[0].week), badErr: bad.error, garbageErr: garbage.error, hasApp: /"app": "lesson-plan-maker"/.test(text) };
  });
  expect(rt.n === 1 && rt.same && rt.hasApp, 'export -> import round-trips the plan, got ' + JSON.stringify(rt));
  expect(rt.badErr === 'shape' && rt.garbageErr === 'json', 'import rejects wrong shape and bad JSON');
  // clean() survives garbage
  const cleaned = await page.evaluate(() => { const p = window.LPM.clean({ format: 'bogus', duration: 'x', steps: [{ min: 9999 }, null, 'y'], week: { '9-9': { topic: 'no' }, '0-1': { topic: 'ok' } }, comp: ['critical', 'critical', 'nope'] }); return { f: p.format, d: p.duration, s: p.steps.length, m: p.steps[0].min, w: Object.keys(p.week).join(), c: p.comp.join() }; });
  expect(cleaned.f === 'cbse' && cleaned.d === 40 && cleaned.s === 1 && cleaned.m === 600 && cleaned.w === '0-1' && cleaned.c === 'critical', 'clean() repairs a damaged plan, got ' + JSON.stringify(cleaned));

  // 9. reset: confirm (auto-accepted) -> plans gone, sample draft back
  await page.click('#tab-edit');
  await page.click('#btn-reset');
  await settle(300);
  st = await state();
  expect(st.plans === 0 && st.fmt === 'cbse' && st.steps.length === 3 && st.dirty === false && st.tab === 'edit', 'reset clears plans and reloads the sample, got ' + JSON.stringify(st));
  expect((await page.textContent('#plans-badge')).trim() === '0', 'badge back to 0');
  const ls = await page.evaluate(() => Object.keys(localStorage).filter(k => k.indexOf('lesson-plan-maker') >= 0).length);
  expect(ls >= 1, 'state is kept under the app key in localStorage');
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLang === lang, 'page language is ' + lang);
};
