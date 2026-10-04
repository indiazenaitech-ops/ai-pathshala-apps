/* Interaction test for SQL Playground (run by tools/verify.js in en and hi).
   sql.js loads from the CDN, so wait generously for the engine. */
const fs = require('fs');

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
  async function waitReady() { await page.waitForSelector('#app[data-ready="1"]', { timeout: 90000 }); }

  // 1) The core check: the school database has 25 students.
  await runSQL('SELECT COUNT(*) FROM STUDENT;');
  let cells = await firstCells();
  expect(cells[0] === '25', 'SELECT COUNT(*) FROM STUDENT should be 25, got ' + cells[0]);

  // 2) INSERT reports rows affected and the count goes up; the table description follows the real count.
  await runSQL("INSERT INTO STUDENT VALUES (26, 'Test Kumar', 11, 'A', 'M', 'Agra', '2009-01-01', 'Science');\nSELECT COUNT(*) FROM STUDENT;");
  const msgs = await page.$$eval('#results .sqlp-ok', ps => ps.map(p => p.textContent));
  expect(msgs.some(m => m.includes(t('ins_n', { n: 1 }))), 'insert message "' + t('ins_n', { n: 1 }) + '" shown, got ' + JSON.stringify(msgs));
  cells = await firstCells();
  expect(cells[0] === '26', 'count after insert should be 26, got ' + cells[0]);
  const desc0 = await page.textContent('#schema .sqlp-tbl:first-child .sqlp-tdesc');
  expect(desc0.trim() === t('tb_student', { n: 26 }), 'STUDENT description shows 26 students, got ' + desc0);

  // 3) Errors show the SQLite message plus a friendly localized hint.
  await runSQL('SELECT nam FROM STUDENT;');
  const err = await page.textContent('#results .callout.danger');
  expect(err.includes('no such column: nam'), 'raw SQLite error shown');
  expect(err.includes(t('h_no_column', { x: 'nam' })), 'friendly hint shown in ' + 'current language');
  // a typo that is not a quote problem must not get the "quote not closed" hint
  await runSQL('SELECT 3abc;');
  const err2 = await page.textContent('#results .callout.danger');
  expect(err2.includes(t('h_syntax', { x: '3abc' })) && !err2.includes(t('h_token')), 'unrecognized token 3abc gets the syntax hint: ' + err2);
  await runSQL("SELECT MID('abc');");
  expect((await page.textContent('#results .callout.danger')).includes(t('h_args')), 'wrong number of arguments gets its own hint');

  // 4) MySQL-style commands and functions work (DESC, ROUND with negative places, MONTHNAME, MOD, CONCAT/INSTR like MySQL).
  await runSQL('DESC MARKS;');
  const descRows = await page.$$eval('#results .sqlp-table tbody tr', trs => trs.length);
  expect(descRows === 3, 'DESC MARKS should list 3 columns, got ' + descRows);
  await runSQL("SELECT ROUND(476.65, -1), MONTHNAME('2008-03-14'), MOD(17, 5), UCASE('cbse');");
  cells = await firstCells();
  expect(cells.join('|') === '480|March|2|CBSE', 'MySQL functions give 480|March|2|CBSE, got ' + cells.join('|'));
  await runSQL("SELECT CONCAT('a', NULL), CONCAT(name, '-', city), INSTR(name, 'a'), 0.00001 FROM STUDENT WHERE rollno = 1;");
  cells = await firstCells();
  expect(cells.join('|') === 'NULL|Aarav Sharma-Delhi|1|0.00001', 'CONCAT with NULL is NULL, INSTR ignores case, tiny numbers are not 0; got ' + cells.join('|'));

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
  // question 7 asks for the highest salary first: swapped columns in the wrong order must still be caught
  await page.click('#taskList li:nth-child(7) button');
  await page.fill('#editor', 'SELECT salary, name FROM TEACHER ORDER BY salary;');
  await page.click('#checkBtn');
  let msg = await page.textContent('#checkMsg');
  expect(msg.includes(t('check_order')), 'wrong order with swapped columns is rejected, got ' + msg);
  await page.fill('#editor', 'SELECT salary, name FROM TEACHER ORDER BY salary DESC;');
  await page.click('#checkBtn');
  msg = await page.textContent('#checkMsg');
  expect(msg.includes(t('check_ok')), 'right order with swapped columns is accepted, got ' + msg);

  // 7) Saving: a transaction closed with RELEASE is still saved and survives a reload.
  await page.click('#tabTables');
  await runSQL("SAVEPOINT s1;\nINSERT INTO CLUB VALUES (7, 'Chess', 101);\nRELEASE s1;");
  await runSQL("INSERT INTO CLUB VALUES (8, 'Chess', 101);");
  await page.reload();
  await waitReady();
  await runSQL("SELECT COUNT(*) FROM CLUB WHERE cname = 'Chess';");
  cells = await firstCells();
  expect(cells[0] === '2', 'both Chess rows saved after SAVEPOINT/RELEASE + reload, got ' + cells[0]);

  // 8) A table name with a space works from the Tables list ▶ button; CSV export keeps more than the 500 rows drawn.
  await runSQL('CREATE TABLE "my list" ("roll no" INT, val INT);\nINSERT INTO "my list" VALUES (1, 2);');
  await page.click('#schema .sqlp-tbl:last-child .sqlp-tbl-head .btn');
  await page.waitForTimeout(150);
  cells = await firstCells();
  expect(cells.join('|') === '1|2', '▶ on "my list" shows its row, got ' + cells.join('|'));
  await runSQL('SELECT * FROM MARKS a, MARKS b;');
  const drawn = await page.$$eval('#results .sqlp-table tbody tr', trs => trs.length);
  expect(drawn === 500, 'only 500 rows drawn, got ' + drawn);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#results .sqlp-csv')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8').trim().split(/\r\n/);
  expect(csv.length === 75 * 75 + 1, 'CSV has all ' + 75 * 75 + ' rows + header, got ' + csv.length);

  // 9) A long misspelt name in an error must not make the page scroll sideways on a phone.
  await page.setViewportSize({ width: 390, height: 844 });
  await runSQL('SELECT averyveryverylongcolumnnamethatdoesnotexist_and_more_and_more_and_more FROM STUDENT;');
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over <= 2, 'no sideways scroll at 390 px after a long error, overflow ' + over);
  await page.setViewportSize({ width: 1280, height: 800 });

  // 10) Reset database (confirm is auto-accepted) brings back 25 students.
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
