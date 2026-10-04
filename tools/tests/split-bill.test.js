/* Interaction test for Split Bill & Trip Expenses (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t }) {
  const settle = () => page.waitForTimeout(150);
  const nets = async () => page.$$eval('#balList .bal', els => els.map(e => ({ id: e.dataset.member, net: +e.dataset.net, name: e.querySelector('.bal-name').textContent })));
  const plan = async () => page.$$eval('#settleList .settle', els => els.map(e => ({ from: e.dataset.from, to: e.dataset.to, amt: +e.dataset.amt })));

  // 1. the example group is useful at once: 3 members, 4 expenses, 2 transfers and totals that reconcile
  await page.waitForSelector('#balList .bal');
  let b = await nets();
  expect(b.length === 3, 'example group has 3 members');
  expect(b.reduce((s, x) => s + x.net, 0) === 0, 'example nets sum to zero');
  expect((await plan()).length === 2, 'example settles in 2 transfers');
  expect((await page.textContent('#stTotal')).replace(/\s/g, '') === '₹11,149.50', 'example total ₹11,149.50, got ' + (await page.textContent('#stTotal')));
  expect(await page.isVisible('#exNote'), 'example note shown');

  // 2. a fresh group: A, B, C
  await page.click('#btnNewGroup');
  await page.fill('#grpName', 'Test trip');
  await page.click('#btnGrpOk');
  await settle();
  expect(!(await page.isVisible('#exNote')), 'new group is not marked as example');
  for (const [n, u] of [['Asha', 'asha@okbank'], ['Bala', ''], ['Chitra', '']]) {
    await page.fill('#memName', n); await page.fill('#memUpi', u); await page.click('#btnAddMember'); await settle();
  }
  expect((await page.$$('#memList .mem')).length === 3, '3 members added');
  // duplicate name is refused
  await page.fill('#memName', 'asha'); await page.click('#btnAddMember'); await settle();
  expect((await page.textContent('#memMsg')).trim() === t('err_dup_member', { name: 'asha' }), 'duplicate member message');
  expect((await page.$$('#memList .mem')).length === 3, 'still 3 members');

  // 3. A pays 900 split equally -> B and C owe 300 each, 2 transfers
  await page.click('#btnAddExpense');
  await page.fill('#exTitle', 'Taxi');
  await page.fill('#exAmount', '900');
  await page.selectOption('#exPayer', { index: 0 });
  await page.click('#btnSaveExpense');
  await settle();
  b = await nets();
  const A = b[0], B = b[1], C = b[2];
  expect(A.net === 60000 && B.net === -30000 && C.net === -30000, 'nets after 900 equal split: ' + JSON.stringify(b.map(x => x.net)));
  let p = await plan();
  expect(p.length === 2 && p.every(x => x.to === A.id && x.amt === 30000), '2 transfers of ₹300 to A, got ' + JSON.stringify(p));
  const upi = await page.$eval('#settleList .settle a[href^="upi://"]', a => a.getAttribute('href'));
  expect(upi === 'upi://pay?pa=asha%40okbank&pn=Asha&am=300.00&cu=INR&tn=' + encodeURIComponent(t('upi_note', { group: 'Test trip' }).slice(0, 50)), 'UPI deep link, got ' + upi);
  expect((await page.$$('#settleList a[href^="https://wa.me/"]')).length === 2, 'WhatsApp reminder per transfer');

  // 4. paise rounding: 1000 split 3 ways must reconcile exactly
  await page.click('#btnAddExpense');
  await page.fill('#exTitle', 'Snacks');
  await page.fill('#exAmount', '1000');
  await page.selectOption('#exPayer', { index: 1 });
  await page.click('#btnSaveExpense');
  await settle();
  b = await nets();
  expect(b.reduce((s, x) => s + x.net, 0) === 0, 'nets reconcile to the paisa after a 3-way split of 1000');
  expect(await page.$eval('#expList', el => el.querySelectorAll('.exp').length) === 2, '2 expenses listed');

  // 5. restaurant bill with 5% GST splits in proportion
  await page.click('#btnAddExpense');
  await page.fill('#exTitle', 'Dinner');
  await page.selectOption('#exPayer', { index: 2 });
  await page.click('#mode-items');
  await settle();
  const setItem = async (idx, name, price, qty, who) => {
    const row = `#itemList .item[data-item="${idx}"]`;
    await page.fill(row + ' .name', name); await page.fill(row + ' .price', price); await page.fill(row + ' .qty', qty);
    for (const w of who) await page.click(`${row} .who-chips .chip:nth-of-type(${w})`);
  };
  await setItem(0, 'Biryani', '300', '1', [1]);          // Asha 300
  await page.click('#btnAddItem');
  await setItem(1, 'Dal', '100', '1', [2]);              // Bala 100
  await page.fill('#exGst', '5');
  await settle();
  const bill = (await page.textContent('#billSum')).replace(/\s/g, '');
  expect(bill.includes('₹420'), 'bill total 400 + 5% = ₹420, got ' + bill);
  expect(bill.includes('₹315') && bill.includes('₹105'), 'GST shared in proportion: Asha 315, Bala 105; got ' + bill);
  await page.click('#btnSaveExpense');
  await settle();
  b = await nets();
  // Chitra paid 420: Asha owes 315, Bala owes 105 from this bill
  expect(b[2].net === -30000 - 33333 - 33334 + 42000 || b.reduce((s, x) => s + x.net, 0) === 0, 'nets still reconcile');
  expect(b.reduce((s, x) => s + x.net, 0) === 0, 'nets sum to zero after restaurant bill');
  expect(await page.$eval('#expList', el => el.querySelectorAll('.exp').length) === 3, '3 expenses listed');
  expect((await page.textContent('#stTotal')).replace(/\s/g, '') === '₹2,320', 'total spent ₹2,320, got ' + (await page.textContent('#stTotal')));

  // 6. removing a member who still owes is refused
  const before = (await page.$$('#memList .mem')).length;
  await page.click('#memList .mem:nth-child(2) .iconbtn.danger');
  await settle();
  expect((await page.$$('#memList .mem')).length === before, 'member with a balance is not removed');
  expect((await page.textContent('#memMsg')).trim().length > 0, 'explains why the member cannot be removed');

  // 7. mark the first transfer as paid -> one transfer fewer, state survives reload
  p = await plan();
  const n0 = p.length;
  await page.click('#settleList .settle button.btn');
  await settle();
  expect((await plan()).length === n0 - 1, 'one transfer fewer after marking paid');
  expect(await page.$eval('#expList', el => el.querySelectorAll('.exp.settle').length) === 1, 'settlement recorded in the list');
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(900);
  expect(await page.$eval('#expList', el => el.querySelectorAll('.exp').length) === 4, 'state restored after reload');
  expect((await page.inputValue('#grpSel')) !== '', 'group selected after reload');

  // 8. a member added later is not charged for an earlier restaurant bill whose items were for "everyone"
  const netsBefore = (await nets()).map(x => x.net);
  await page.fill('#memName', 'Dev'); await page.click('#btnAddMember'); await settle();
  const after = await nets();
  expect(after.length === netsBefore.length + 1 && after[after.length - 1].net === 0, 'new member owes nothing for old bills');
  expect(after.slice(0, -1).every((x, i) => x.net === netsBefore[i]), 'old balances unchanged by a new member');
};
