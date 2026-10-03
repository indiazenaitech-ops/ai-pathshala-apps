/* Interaction test for SQL Playground (run by tools/verify.js in en and hi).
   sql.js loads from the CDN, so wait generously for the engine. */
module.exports = async function ({ page, expect, t, log }) {
  await page.waitForSelector('#app[data-ready="1"]', { timeout: 90000 });

  async function runSQL(sql) {
    await page.fill('#editor', sql);
    await page.click('#runBtn');
    await page.waitForTimeout(150);
  }
  async function firstCells() {
    return page.$$eval('#results .sqlp-block:last-child .sqlp-table tbody tr:first-child td', tds => tds.slice(1).map(td => td.textContent.trim()));
  }

  // 1) The core check: the school database has 25 students.
  await runSQL('SELECT COUNT(*) FROM STUDENT;');
  let cells = await firstCells();
  expect(cells[0] === '25', 'SELECT COUNT(*) FROM STUDENT should be 25, got ' + cells[0]);

  // 2) INSERT reports rows affected and the count goes up.
  await runSQL("INSERT INTO STUDENT VALUES (26, 'Test Kumar', 11, 'A', 'M', 'Agra', '2009-01-01', 'Science');\nSELECT COUNT(*) FROM STUDENT;");
  const msgs = await page.$$eval('#results .sqlp-ok', ps => ps.map(p => p.textContent));
  expect(msgs.some(m => m.includes(t('ins_n', { n: 1 }))), 'insert message "' + t('ins_n', { n: 1 }) + '" shown, got ' + JSON.stringify(msgs));
  cells = await firstCells();
  expect(cells[0] === '26', 'count after insert should be 26, got ' + cells[0]);

  // 3) Errors show the SQLite message plus a friendly localized hint.
  await runSQL('SELECT nam FROM STUDENT;');
  const err = await page.textContent('#results .callout.danger');
  expect(err.includes('no such column: nam'), 'raw SQLite error shown');
  expect(err.includes(t('h_no_column', { x: 'nam' })), 'friendly hint shown in ' + 'current language');

  // 4) MySQL-style commands and functions work (DESC, ROUND with negative places, MONTHNAME, MOD).
  await runSQL('DESC MARKS;');
  const descRows = await page.$$eval('#results .sqlp-table tbody tr', trs => trs.length);
  expect(descRows === 3, 'DESC MARKS should list 3 columns, got ' + descRows);
  await runSQL("SELECT ROUND(476.65, -1), MONTHNAME('2008-03-14'), MOD(17, 5), UCASE('cbse');");
  cells = await firstCells();
  expect(cells.join('|') === '480|March|2|CBSE', 'MySQL functions give 480|March|2|CBSE, got ' + cells.join('|'));

  // 5) GROUP BY on the seed data: 9 Science students before our insert + 1 = 10.
  await runSQL("SELECT stream, COUNT(*) FROM STUDENT GROUP BY stream ORDER BY stream;");
  const grp = await page.$$eval('#results .sqlp-table tbody tr', trs => trs.map(tr => [...tr.children].slice(1).map(td => td.textContent.trim()).join('=')));
  expect(grp.join(',') === 'Commerce=8,Humanities=8,Science=10', 'stream counts, got ' + grp.join(','));

  // 6) Practice: question 8 (students in Class 12) checked right, then a wrong answer is caught.
  await page.click('#tabPractice');
  await page.click('#taskList li:nth-child(8) button');
  await page.fill('#editor', 'SELECT COUNT(*) FROM STUDENT WHERE class = 12;');
  await page.click('#checkBtn');
  let cls = await page.getAttribute('#checkMsg', 'class');
  expect(/sqlp-msg-ok/.test(cls), 'correct practice answer accepted');
  const solved = await page.textContent('#solvedTxt');
  expect(solved.includes(t('solved_n', { n: 1, total: 15 })), 'progress shows 1 solved: ' + solved);
  await page.fill('#editor', 'SELECT COUNT(*) FROM STUDENT;');
  await page.click('#checkBtn');
  cls = await page.getAttribute('#checkMsg', 'class');
  expect(/sqlp-msg-bad/.test(cls), 'wrong practice answer rejected');

  // 7) Reset database (confirm is auto-accepted) brings back 25 students.
  await page.click('#tabTables');
  await page.click('#resetBtn');
  await page.waitForTimeout(200);
  await runSQL('SELECT COUNT(*) FROM STUDENT;');
  cells = await firstCells();
  expect(cells[0] === '25', 'after reset count should be 25, got ' + cells[0]);
  const tables = await page.$$eval('#schema .sqlp-tname', b => b.map(x => x.textContent));
  expect(tables.join(',') === 'STUDENT,MARKS,TEACHER,CLUB', 'schema lists the 4 tables, got ' + tables.join(','));

  // leave a nice state for the screenshot
  await runSQL("SELECT S.name, M.subject, M.marks\nFROM STUDENT S, MARKS M\nWHERE S.rollno = M.rollno AND M.marks >= 90\nORDER BY M.marks DESC;");
  log('ok');
};
