/* Interaction test for CGPA & Percentage Calculator (run by tools/verify.js in en and hi).
   Expected values were computed by hand (python3) from the spec's Test list and the sample data in app.js:
   CGPA 8.2 -> 77.9 %; 85 marks -> A2, 9; credits (4,3,3,2) x points (10,9,8,7) = 105/12 = 8.75; semester 2 = 130/15;
   CGPA = 235/27 = 8.7037; Mumbai 10-point 7.5 -> 64.25; VTU 7.5 -> 67.5; 3 papers at 70 %, 5 papers, target 75 -> 82.5;
   internal 24/30 at 30 %, final /70 at 70 %, target 75 -> 72.86 % = 51 marks. */
module.exports = async function ({ page, expect, log }) {
  const val = async (id, attr) => { const v = await page.getAttribute(id, 'data-' + (attr || 'value')); return v === null ? null : +v; };
  const near = (a, b, eps) => a !== null && Math.abs(a - b) <= (eps || 0.006);
  const type = async (id, v) => { await page.fill(id, String(v)); await page.waitForTimeout(120); };
  const tab = async (name) => { await page.click('#tab-' + name); await page.waitForTimeout(150); };

  await page.waitForSelector('#tabs');
  // start clean: a previous run may have left state behind
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { } });
  await page.reload(); await page.waitForSelector('#tabs'); await page.waitForTimeout(400);

  // --- CBSE ---
  await tab('cbse');
  expect(near(await val('#cb-cgpa-pct'), 77.9), 'CGPA 8.2 -> 77.9 %, got ' + (await val('#cb-cgpa-pct')));
  expect(near(await val('#cb-pct-cgpa'), 8.0), '76 % -> CGPA 8.0');
  expect((await page.getAttribute('#cb-grade', 'data-grade')) === 'A2' && (await val('#cb-gp', 'gp')) === 9, '85 marks -> A2, 9 points');
  await type('#cb-marks', 91);
  expect((await page.getAttribute('#cb-grade', 'data-grade')) === 'A1' && (await val('#cb-gp', 'gp')) === 10, '91 marks -> A1, 10 points');
  await type('#cb-marks', 32);
  expect((await page.getAttribute('#cb-grade', 'data-grade')) === 'E' && (await val('#cb-gp', 'gp')) === 0, '32 marks -> E, no grade point');
  await type('#cb-max', 80); await type('#cb-marks', 68);   // 68/80 = 85 % -> A2
  expect((await page.getAttribute('#cb-grade', 'data-grade')) === 'A2', '68 out of 80 = 85 % -> A2');
  // five subjects 85, 78, 92, 67, 74 -> (9+8+10+7+8)/5 = 8.4 -> 79.8 %
  expect(near(await val('#cb-overall', 'cgpa'), 8.4) && near(await val('#cb-overall-pct', 'pct'), 79.8), 'five subjects -> CGPA 8.4, 79.8 %');
  await page.fill('#cb-rows tr[data-i="3"] .cb-mark', '95'); await page.waitForTimeout(120); // B2 7 -> A1 10: sum 45 -> 9.0
  expect(near(await val('#cb-overall', 'cgpa'), 9.0), 'changing science to 95 -> CGPA 9.0');
  await page.click('#cb-mode [data-mode="grades"]'); await page.waitForTimeout(150);
  expect((await page.$$eval('#cb-rows .cb-grade-sel', a => a.map(s => s.value)).then(v => v.join(','))) === 'A2,B1,A1,A1,B1', 'grades mode keeps the grades from the marks');
  await page.selectOption('#cb-rows tr[data-i="0"] .cb-grade-sel', 'E'); await page.waitForTimeout(120); // 0+8+10+10+8 = 36 -> 7.2
  expect(near(await val('#cb-overall', 'cgpa'), 7.2), 'E counts as 0 -> CGPA 7.2');
  await page.click('#cb-mode [data-mode="marks"]'); await page.waitForTimeout(150);
  // target: 3 papers done at 70 %, 5 papers, want 75 % -> (375 - 210) / 2 = 82.5 %
  expect(near(await val('#tg-need'), 82.5) && (await page.getAttribute('#tg-status', 'data-status')) === 'possible', 'need 82.5 % in the last two papers');
  await type('#tg-target', 95);   // (475 - 210) / 2 = 132.5 -> impossible
  expect(near(await val('#tg-need'), 132.5) && (await page.getAttribute('#tg-status', 'data-status')) === 'impossible', 'target 95 % is impossible (132.5 %)');
  await type('#tg-target', 40);   // (200 - 210) / 2 = -5 -> done
  expect((await page.getAttribute('#tg-status', 'data-status')) === 'done', 'target 40 % is already reached');
  await type('#tg-total', 3);     // nothing left -> bad input
  expect((await page.getAttribute('#tg-status', 'data-status')) === 'bad_input', 'no papers left -> bad input');

  // --- University ---
  await tab('uni');
  expect(near(await val('#sgpa'), 8.75), 'semester 1: credits 4,3,3,2 with O,A+,A,B+ -> SGPA 8.75, got ' + (await val('#sgpa')));
  expect((await page.textContent('#sem-credits')).trim() === '12' && (await page.textContent('#sem-points')).trim() === '105', 'credits 12, credit points 105');
  const sgpas = await page.$$eval('#cgpa-rows .sem-sgpa', a => a.map(x => +x.textContent));
  expect(sgpas.length === 2 && near(sgpas[0], 8.75) && near(sgpas[1], 8.67), 'two semesters: 8.75 and 8.67, got ' + sgpas);
  expect(near(await val('#cgpa'), 8.7, 0.006), 'CGPA weighted by credits = 235/27 = 8.70, got ' + (await val('#cgpa')));
  expect(near(await val('#uni-pct'), 87.04) && (await page.getAttribute('#uni-formula', 'data-formula')) === 'x10', 'x10 -> 87.04 %');
  await page.selectOption('#formula', 'mu10'); await page.waitForTimeout(120);
  expect(near(await val('#uni-pct'), 72.8), 'Mumbai 10-point: 7.1 x 8.7037 + 11 = 72.8 %, got ' + (await val('#uni-pct')));
  await page.selectOption('#formula', 'vtu'); await page.waitForTimeout(120);
  expect(near(await val('#uni-pct'), 79.54), 'VTU: (8.7037 - 0.75) x 10 = 79.54 %');
  await page.selectOption('#formula', 'custom'); await type('#f-a', 7.1); await type('#f-b', 11);
  expect(!(await page.$eval('#custom-fields', e => e.hidden)) && near(await val('#uni-pct'), 72.8), 'custom a=7.1 b=11 gives the Mumbai value again');
  // the spec's exact numbers through the engine
  const eng = await page.evaluate(() => [CGPA.pctFromCgpa(7.5, 'mu10').pct, CGPA.pctFromCgpa(7.5, 'vtu').pct, CGPA.pctFromCgpa(7.5, 'mu7').pct, CGPA.cbseCgpaToPct(8.2), CGPA.cbseGrade(85).gp,
    CGPA.sgpa([{ credit: 4, gp: 10 }, { credit: 3, gp: 9 }, { credit: 3, gp: 8 }, { credit: 2, gp: 7 }]).sgpa, CGPA.cgpa([{ sgpa: 8.75, credits: 12 }, { sgpa: 8, credits: 18 }]).cgpa,
    CGPA.neededAverage(3, 70, 5, 75).need, CGPA.finalNeeded(24, 30, 30, 70, 70, 75).needPct]);
  expect(eng[0] === 64.25 && eng[1] === 67.5 && eng[2] === 67.5 && eng[3] === 77.9 && eng[4] === 9 && eng[5] === 8.75 && eng[6] === 8.3 && eng[7] === 82.5 && eng[8] === 72.86,
    'engine: Mumbai 7.5 -> 64.25, VTU 7.5 -> 67.5, MU7 7.5 -> 67.5, 8.2 -> 77.9, 85 -> 9, SGPA 8.75, CGPA (105+144)/30 = 8.3, target 82.5, final 72.86; got ' + eng);
  // edit a credit: maths 4 -> 6 credits: (60+27+24+14)/14 = 8.93
  await page.fill('#subj-rows tr[data-i="0"] .sj-credit', '6'); await page.waitForTimeout(120);
  expect(near(await val('#sgpa'), 8.93), '6 credits for maths -> SGPA 8.93');
  // change a grade: physics A+ -> F: (60+0+24+14)/14 = 7.0
  await page.selectOption('#subj-rows tr[data-i="1"] .sj-grade', 'F'); await page.waitForTimeout(120);
  expect(near(await val('#sgpa'), 7), 'F in physics -> SGPA 7.00');
  // delete that subject: (60+24+14)/11 = 8.91
  await page.click('#subj-rows tr[data-i="1"] .sj-del'); await page.waitForTimeout(120);
  expect((await page.$$('#subj-rows tr')).length === 3 && near(await val('#sgpa'), 8.91), 'subject deleted -> 3 rows, SGPA 8.91');
  // add a semester: three empty-ish rows with the top grade, becomes current
  await page.click('#sem-add'); await page.waitForTimeout(150);
  expect((await page.$$('#sem-list .sem-chip')).length === 3 && (await page.getAttribute('#sem-chip-2', 'aria-pressed')) === 'true', 'third semester added and selected');
  expect(near(await val('#sgpa'), 10), 'new semester starts with O everywhere -> SGPA 10');
  await page.fill('#sem-name', 'Sem III'); await page.waitForTimeout(150);
  expect((await page.textContent('#sem-chip-2')).trim() === 'Sem III', 'semester renamed');
  // 4-point scale: letters remapped, percentage = GPA x 25
  await page.click('#scale-4'); await page.waitForTimeout(200);
  const letters4 = await page.$$eval('#scale-rows .sc-g', a => a.map(i => i.value));
  expect(letters4.join(',') === 'A,B,C,D,F', '4-point scale letters, got ' + letters4);
  expect((await page.getAttribute('#uni-formula', 'data-formula')) === 'x25' && (await page.$eval('#formula-field', e => e.hidden)), '4-point: formula list hidden, GPA x 25');
  expect(near(await val('#sgpa'), 4), 'new semester on 4-point scale -> 4.00');
  await page.click('#scale-10'); await page.waitForTimeout(200);
  expect(near(await val('#sgpa'), 10) && (await page.getAttribute('#uni-formula', 'data-formula')) === 'custom', 'back to 10-point: SGPA 10, custom formula kept');
  // edit the scale: O = 9.5 -> SGPA of the new semester 9.5
  await page.fill('#scale-rows tr[data-i="0"] .sc-p', '9.5'); await page.waitForTimeout(150);
  expect(near(await val('#sgpa'), 9.5), 'editing O to 9.5 points updates the SGPA');
  await page.click('#scale-reset'); await page.waitForTimeout(150);
  expect(near(await val('#sgpa'), 10), 'default scale restores O = 10');
  // print sheet is built from the current semester
  await page.evaluate(() => window.print = function () { });
  await page.fill('#student-name', 'Asha Verma'); await page.click('#print-sheet'); await page.waitForTimeout(200);
  expect((await page.$$('#print-area table')).length === 2 && (await page.textContent('#print-area')).includes('Asha Verma'), 'result sheet has subject + semester tables and the student name');
  // CSV: 3 semesters -> subject rows + 3 SGPA rows + CGPA + percentage
  const csvRows = await page.evaluate(() => new Promise(res => { const d = EDU.download; EDU.download = (n, c) => { EDU.download = d; res(c.trim().split('\n').length); }; document.getElementById('csv-export').click(); }));
  expect(csvRows === 1 + (3 + 5 + 3) + 3 + 2, 'CSV has header + 11 subjects + 3 SGPA + CGPA + percentage rows, got ' + csvRows);

  // --- Conversions ---
  await tab('conv');
  expect(near(await val('#cv-out-cgpa'), 8.2) && near(await val('#cv-out-gpa'), 3.7) && (await page.getAttribute('#cv-out-letter', 'data-letter')) === 'A', '77.9 % -> CGPA 8.2 (x 9.5), GPA 3.7, A');
  await type('#cv-cgpa', 9.1);   // 86.45 % -> 4.0 A+
  expect(near(await val('#cv-out-pct'), 86.45) && near(await val('#cv-out-gpa'), 4) && (await page.getAttribute('#cv-out-letter', 'data-letter')) === 'A+', 'CGPA 9.1 -> 86.45 %, 4.0, A+');
  await page.selectOption('#cv-formula', 'x10'); await page.waitForTimeout(120);
  expect(near(await val('#cv-out-pct'), 91), 'CGPA 9.1 with x10 -> 91 %');
  await type('#cv-pct', 58);     // 58 % -> 5.8 (x10), band 55-59.99 -> 2.7 C+
  expect(near(await val('#cv-out-cgpa'), 5.8) && near(await val('#cv-out-gpa'), 2.7) && (await page.getAttribute('#cv-out-letter', 'data-letter')) === 'C+', '58 % -> 5.8, 2.7, C+');
  await type('#cv-gpa', 3.3);    // band 65-75 -> CGPA 6.5-7.5 on x10
  expect(near(await val('#cv-out-pct', 'lo'), 65) && near(await val('#cv-out-pct', 'hi'), 75) && (await page.getAttribute('#cv-out-letter', 'data-letter')) === 'B+', 'GPA 3.3 -> 65-75 % band, B+');
  expect((await page.$$('#band-table tbody tr')).length === 8, 'band table has 8 rows');

  // --- Marks ---
  await tab('marks');
  expect(near(await val('#mk-pct'), 82.5), 'six subjects 495/600 = 82.5 %');
  expect(near(await val('#mk-best-pct'), 85.2) && (await page.$$('#mk-rows tr.drop')).length === 1 && (await page.getAttribute('#mk-rows tr.drop', 'data-i')) === '4', 'best of five = 426/500 = 85.2 %, Social Science (69) dropped');
  await page.selectOption('#mk-best', '3'); await page.waitForTimeout(120);   // 95+90+88 = 273/300 = 91
  expect(near(await val('#mk-best-pct'), 91) && (await page.$$('#mk-rows tr.drop')).length === 3, 'best of three = 91 %');
  await page.fill('#mk-rows tr[data-i="0"] .mk-max', '50'); await page.waitForTimeout(120);   // hindi 72/50 invalid? no: 144 % allowed; all: 495/550 = 90
  expect(near(await val('#mk-pct'), 90), 'max 50 for hindi -> 495/550 = 90 %');
  await page.click('#mk-rows tr[data-i="0"] .mk-del'); await page.waitForTimeout(120);   // 423/500 = 84.6
  expect((await page.$$('#mk-rows tr')).length === 5 && near(await val('#mk-pct'), 84.6), 'row deleted -> 5 rows, 84.6 %');
  await page.click('#mk-add'); await page.waitForTimeout(120);
  expect((await page.$$('#mk-rows tr')).length === 6 && near(await val('#mk-pct'), 84.6), 'empty new row does not change the total');
  // weighted: 24/30 at 30 % + 52/70 at 70 % = 24 + 52 = 76 %
  expect(near(await val('#wt-overall'), 76), 'weighted average 76 %, got ' + (await val('#wt-overall')));
  await type('#wt-iw', 40);
  expect((await page.inputValue('#wt-fw')) === '60' && near(await val('#wt-overall'), 76.57), 'weights 40/60 -> final weight follows, overall 76.57 %');
  // final needed: 24/30 at 30 %, target 75 -> 72.86 % = 51 marks of 70
  expect(near(await val('#fn-need-pct'), 72.86) && near(await val('#fn-need-pct', 'marks'), 51) && (await page.getAttribute('#fn-status', 'data-status')) === 'possible', 'need 72.86 % = 51/70 in the final');
  await type('#fn-target', 20);
  expect((await page.getAttribute('#fn-status', 'data-status')) === 'done', 'target 20 % already reached by internals (24 %)');
  await type('#fn-target', 96);  // max possible 24 + 70 = 94
  expect((await page.getAttribute('#fn-status', 'data-status')) === 'impossible', 'target 96 % impossible (max 94 %)');
  await type('#fn-target', 75);

  // --- reload keeps everything ---
  await page.waitForTimeout(400);
  await page.reload(); await page.waitForSelector('#tabs'); await page.waitForTimeout(500);
  expect((await page.getAttribute('#tab-marks', 'aria-selected')) === 'true', 'last tab restored after reload');
  expect((await page.$$('#mk-rows tr')).length === 6 && near(await val('#mk-pct'), 84.6), 'marks rows kept after reload');
  await tab('uni');
  expect((await page.$$('#sem-list .sem-chip')).length === 3 && (await page.textContent('#sem-chip-2')).trim() === 'Sem III', 'three semesters incl. "Sem III" kept after reload');
  expect(near(await val('#sgpa'), 10) && (await page.inputValue('#student-name')) === 'Asha Verma', 'current semester and student name kept');
  await page.click('#sem-chip-0'); await page.waitForTimeout(150);
  // semester 1 after the 10 -> 4 -> 10 round trip: B+ (7/10) became B (3/4) and comes back as A (8/10), so (60 + 24 + 16) / 11 = 9.09
  expect((await page.$$('#subj-rows tr')).length === 3 && (await page.inputValue('#subj-rows tr[data-i="0"] .sj-credit')) === '6' && near(await val('#sgpa'), 9.09), 'semester 1 edits (deleted physics, 6 credits, remapped grades) kept after reload, got ' + (await val('#sgpa')));
  await tab('cbse');
  expect(near(await val('#cb-overall', 'cgpa'), 9.0) && (await page.inputValue('#cb-max')) === '80' && (await page.inputValue('#cb-rows tr[data-i="3"] .cb-mark')) === '95', 'CBSE five-subject marks (science 95 -> 9.0) and "out of" kept after reload, got ' + (await val('#cb-overall', 'cgpa')));

  // --- broken saved data is cleaned on load ---
  await page.evaluate(() => { localStorage.setItem('edu.cgpa-percentage-calculator.state', JSON.stringify({ tab: 'nope', cbse: { cgpa: 'abc', five: 'x', tg: { done: 99 } }, uni: { sems: [{ subjects: [{ credit: -4, grade: 'ZZ' }] }], scale: 'bad', cur: 7 }, marks: { rows: [{ obt: 'q', max: 0 }], wt: null } })); });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.reload(); await page.waitForSelector('#tabs'); await page.waitForTimeout(500);
  expect(!errs.length, 'reload with broken saved data shows no errors: ' + errs.join('; '));
  expect((await page.getAttribute('#tab-cbse', 'aria-selected')) === 'true' && near(await val('#cb-cgpa-pct'), 77.9), 'bad tab and CGPA fall back to defaults');
  await tab('uni');
  expect((await page.$$('#sem-list .sem-chip')).length === 1 && (await val('#sgpa')) === null, 'one cleaned semester with no valid credits -> no SGPA');

  // --- reset (the confirm dialog is accepted by the runner) ---
  await page.click('#reset'); await page.waitForTimeout(400);
  expect((await page.$$('#sem-list .sem-chip')).length === 2 && near(await val('#sgpa'), 8.75) && near(await val('#cgpa'), 8.7), 'reset brings the two sample semesters back');
  await tab('marks');
  expect((await page.$$('#mk-rows tr')).length === 6 && near(await val('#mk-pct'), 82.5), 'reset restores the sample marks');
  await page.reload(); await page.waitForSelector('#tabs'); await page.waitForTimeout(400);
  expect(near(await val('#mk-pct'), 82.5) && (await page.$$('#mk-rows tr')).length === 6, 'sample data stays after reset + reload');
  log('cgpa-percentage-calculator test done');
};
