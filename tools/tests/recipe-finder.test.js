/* Interaction test for Recipe Finder (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect }) {
  const settle = () => page.waitForTimeout(120);
  await page.waitForSelector('#resList .rcard');

  // 0. nothing picked: quick recipes first, sorted by time
  const firstTimes = await page.$$eval('#resList .rcard', els => els.slice(0, 5).map(e => e.dataset.id));
  const tOf = await page.evaluate(ids => ids.map(id => RF_DATA.rec.find(r => r.id === id).t), firstTimes);
  expect(tOf.every((x, i) => i === 0 || x >= tOf[i - 1]), 'no ingredients: quickest recipes first ' + tOf.join(','));

  // 1. type romanised Hindi / English names and press Enter
  for (const w of ['aloo', 'pyaaz', 'tamatar', 'oil', 'salt']) {
    await page.fill('#ingSearch', w);
    await page.press('#ingSearch', 'Enter');
    await settle();
  }
  const have = await page.$$eval('#haveList .chip', els => els.map(e => e.dataset.id).sort());
  expect(JSON.stringify(have) === JSON.stringify(['oil', 'onion', 'potato', 'salt', 'tomato']), 'picked 5 ingredients: ' + have.join(','));

  // 2. aloo-tamatar sabzi is in the top 3 with 100 %
  const top = await page.$$eval('#resList .rcard', els => els.slice(0, 3).map(e => ({ id: e.dataset.id, pct: +e.dataset.pct })));
  const at = top.find(x => x.id === 'aloo_tamatar');
  expect(at && at.pct === 100, 'aloo_tamatar in top 3 with 100%: ' + JSON.stringify(top));

  // 3. a recipe missing exactly one ingredient shows it as missing (card and recipe view)
  const one = await page.evaluate(() => {
    const hs = {}; ['oil', 'onion', 'potato', 'salt', 'tomato'].forEach(k => { hs[k] = 1; });
    const cards = [...document.querySelectorAll('#resList .rcard')].map(e => e.dataset.id);
    for (const id of cards) { const m = RF_TEST.match(RF_DATA.rec.find(r => r.id === id), hs); if (m.missing.length === 1 && !m.subs[m.missing[0]]) return { id, miss: m.missing[0], pct: m.pct }; }
    return null;
  });
  expect(one && one.pct < 100, 'found a recipe missing one item: ' + JSON.stringify(one));
  const card = await page.$(`#resList .rcard[data-id="${one.id}"]`);
  const missName = await page.evaluate(id => (APP_CONTENT[document.documentElement.lang] || APP_CONTENT.en).ing[id].split('|')[0], one.miss);
  expect((await card.textContent()).includes(missName), `card of ${one.id} says ${missName} is missing`);
  await card.click();
  await settle();
  expect(await page.isVisible('#recipeView'), 'recipe view opens');
  const missLi = await page.$(`#rvIngs li[data-id="${one.miss}"]`);
  expect(missLi && (await missLi.getAttribute('class')).includes('miss'), one.miss + ' marked as missing in the recipe');
  const missingInView = await page.$$eval('#rvIngs li.miss', els => els.map(e => e.dataset.id));
  expect(missingInView.length === 1, 'exactly one missing item listed: ' + missingInView.join(','));

  // 4. scaling 2 → 4 doubles the quantities
  const q2 = await page.$$eval('#rvIngs li', els => els.map(e => ({ id: e.dataset.id, q: +e.dataset.qty, u: e.dataset.unit })));
  await page.click('#servSeg button[data-n="4"]');
  await settle();
  const q4 = await page.$$eval('#rvIngs li', els => els.map(e => ({ id: e.dataset.id, q: +e.dataset.qty, u: e.dataset.unit })));
  const base = await page.evaluate(id => RF_DATA.rec.find(r => r.id === id).i, one.id);
  const chk = q2.filter(x => x.q && ['pc', 'cup', 'tbsp', 'tsp', 'g', 'ml'].includes(x.u));
  expect(chk.length >= 3, 'some quantities to scale');
  const bad4 = chk.filter(x => Math.abs(q4.find(y => y.id === x.id).q - 2 * x.q) > 0.01);
  expect(!bad4.length, 'all quantities doubled at 4 people: ' + JSON.stringify(bad4));
  const b0 = base.find(r => r[1] && r[2] === 'pc') || base.find(r => r[1]);
  expect(Math.abs(q4.find(x => x.id === b0[0]).q - 2 * b0[1]) < 0.01, `${b0[0]}: ${b0[1]} for 2 → ${2 * b0[1]} for 4`);

  // 5. shopping list gets the missing item
  await page.click('#btnAddMissing');
  await settle();
  const shop = await page.$$eval('#shopList li', els => els.map(e => e.dataset.id));
  expect(shop.includes(one.miss), `shopping list contains ${one.miss}: ` + shop.join(','));
  expect((await page.textContent('#shopCount')).includes('1'), 'shopping count shows 1 to buy');

  // 6. Jain filter: no recipe with onion or garlic (or potato)
  await page.click('#btnBack');
  await settle();
  await page.evaluate(() => {
    const set = (s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('change')); };
    set('#fMeal', 'any'); set('#fDiet', 'jain');
  });
  await settle();
  const jainIds = await page.evaluate(() => { while (!document.querySelector('#btnMore').hidden) document.querySelector('#btnMore').click(); return [...document.querySelectorAll('#resList .rcard')].map(e => e.dataset.id); });
  expect(jainIds.length >= 10, 'at least 10 Jain recipes: ' + jainIds.length);
  const bad = await page.evaluate(ids => ids.filter(id => RF_DATA.rec.find(r => r.id === id).i.some(row => !row[3] && ['onion', 'garlic', 'potato'].includes(row[0]))), jainIds);
  expect(bad.length === 0, 'Jain list has no onion/garlic/potato recipes: ' + bad.join(','));
  expect(!jainIds.includes('aloo_tamatar') && jainIds.includes('varan'), 'aloo_tamatar hidden, varan shown');

  // 7. search in Tamil and Urdu finds curd
  for (const w of ['தயிர்', 'دہی']) {
    await page.fill('#ingSearch', w);
    await settle();
    const s = await page.$$eval('#sugg .chip', els => els.map(e => e.dataset.id));
    expect(s[0] === 'curd', `search "${w}" → curd: ${s.join(',')}`);
  }
  await page.fill('#ingSearch', '');
};
