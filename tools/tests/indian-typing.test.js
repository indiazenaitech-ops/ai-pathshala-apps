/* Interaction test for Type in Indian Languages (run by tools/verify.js in en and hi).
   1) a word table across 14 languages is checked in the page's own engine (exact Unicode),
   2) the real UI: type Roman letters, pick a language, one-box mode converts on space, the letter keyboard inserts,
      the typing guide is generated, the script converter shows Hindi in Bengali / Tamil / Roman, and state survives a reload. */
const WORDS = [
  ['hi', 'namaste', 'नमस्ते'], ['hi', 'bhaarat', 'भारत'], ['hi', 'kRShNa', 'कृष्ण'], ['hi', 'hindii', 'हिंदी'], ['hi', 'kyaa', 'क्या'],
  ['hi', 'vidyaalay', 'विद्यालय'], ['hi', 'shrii', 'श्री'], ['hi', 'x', 'क्ष'], ['hi', 'gyaan', 'ज्ञान'], ['hi', 'zindagii', 'ज़िंदगी'],
  ['hi', 'maa~', 'माँ'], ['hi', 'duHkh', 'दुःख'], ['hi', 'la.Dakaa', 'लड़का'], ['hi', 'anya', 'अन्य'], ['hi', 'naI', 'नई'],
  ['mr', 'maraaThii', 'मराठी'], ['mr', 'baaL', 'बाळ'], ['sa', 'saMskRtam^', 'संस्कृतम्'], ['ne', 'chha', 'छ'],
  ['bn', 'baa~Nlaa', 'বাংলা'], ['bn', 'bhaarat', 'ভারত'], ['bn', 'ut^sab', 'উৎসব'], ['bn', 'maayaa', 'মায়া'], ['bn', 'gangaa', 'গঙ্গা'],
  ['as', 'rang', 'ৰং'], ['as', 'vaar', 'ৱাৰ'],
  ['pa', 'pa~njaab', 'ਪੰਜਾਬ'], ['pa', 'pakkaa', 'ਪੱਕਾ'], ['pa', 'gurmukhii', 'ਗੁਰਮੁਖੀ'], ['pa', 'muuMh', 'ਮੂੰਹ'], ['pa', 'kann', 'ਕੰਨ'],
  ['gu', 'gujaraatii', 'ગુજરાતી'], ['gu', 'maaruM', 'મારું'],
  ['or', 'o.Diaa', 'ଓଡ଼ିଆ'], ['or', 'priyaa', 'ପ୍ରିୟା'],
  ['ta', 'vaNakkam', 'வணக்கம்'], ['ta', 'tamizh', 'தமிழ்'], ['ta', 'naan', 'நான்'], ['ta', 'anbu', 'அன்பு'], ['ta', 'nanri', 'நன்றி'],
  ['ta', 'kaatru', 'காற்று'], ['ta', 'fan', 'ஃபன்'], ['ta', 'engaL', 'எங்கள்'], ['ta', 'aHdhu', 'அஃது'],
  ['te', 'telugu', 'తెలుగు'], ['te', 'namaskaaram', 'నమస్కారం'], ['te', 'andaru', 'అందరు'],
  ['kn', 'kannaDa', 'ಕನ್ನಡ'], ['kn', 'bengaLuuru', 'ಬೆಂಗಳೂರು'],
  ['ml', 'malayaaLam', 'മലയാളം'], ['ml', 'avan', 'അവൻ'], ['ml', 'ente', 'എന്റെ'], ['ml', 'kuttikaL', 'കുറ്റികൾ'], ['ml', 'paal', 'പാൽ'],
  ['ur', 'aap kaise hain', 'آپ کیسے ہیں'], ['ur', 'pyaar', 'پیار'], ['ur', 'Kush', 'خش'], ['ur', 'haaN?', 'ہاں؟']
];
const CONV = [['भारत', 'beng', 'ভারত'], ['भारत', 'taml', 'பாரத்'], ['नमस्ते', 'roman', 'namaste'], ['भारत', 'roman', 'bhaarat'],
  ['வணக்கம்', 'deva', 'वणक्कम्'], ['ਪੱਕਾ', 'deva', 'पक्का'], ['हिंदी', 'guru', 'ਹਿੰਦੀ'], ['मलयालम', 'mlym', 'മലയാലം']];

module.exports = async function ({ page, expect }) {
  const out = () => page.inputValue('#out');
  const settle = () => page.waitForTimeout(150);

  // 0. useful at once: the sample is already converted
  await page.waitForFunction(() => document.querySelector('#out').value.length > 5, null, { timeout: 10000 });
  expect((await out()).startsWith('नमस्ते!'), 'sample shows Hindi at once, got ' + (await out()).slice(0, 20));

  // 1. engine word table (exact code points)
  const bad = await page.evaluate(([words, conv]) => {
    const f = [];
    for (const [l, r, w] of words) { const g = window.ITYPE.convert(r, l, {}); if (g !== w.normalize('NFC')) f.push(l + ' ' + r + ' -> ' + g + ' (want ' + w + ')'); }
    for (const [s, tg, w] of conv) { const g = window.ISCRIPT.convert(s, tg); if (g !== w) f.push('conv ' + s + ' ' + tg + ' -> ' + g + ' (want ' + w + ')'); }
    return f;
  }, [WORDS, CONV]);
  expect(WORDS.length >= 40, 'word table has 40+ words');
  expect(bad.length === 0, bad.length + ' engine failures: ' + bad.slice(0, 4).join(' | '));

  // 2. type in the Roman box -> exact Hindi
  await page.fill('#roman', 'namaste bhaarat kRShNa');
  await settle();
  expect((await out()) === 'नमस्ते भारत कृष्ण', 'Hindi typing, got ' + (await out()));
  await page.fill('#roman', 'bharat');
  await settle();
  expect((await out()) === 'भारत', 'smart spelling bharat -> भारत, got ' + (await out()));
  expect(/1/.test(await page.textContent('#stats')), 'stats show the character / word count');

  // 3. switch to Tamil: the same Roman box is converted again
  await page.selectOption('#lang', 'ta');
  await page.fill('#roman', 'vaNakkam');
  await settle();
  expect((await out()) === 'வணக்கம்', 'Tamil vaNakkam, got ' + (await out()));

  // 4. Punjabi and Bengali through the UI
  await page.selectOption('#lang', 'pa');
  await page.fill('#roman', 'pa~njaab');
  await settle();
  expect((await out()) === 'ਪੰਜਾਬ', 'Punjabi pa~njaab, got ' + (await out()));
  await page.selectOption('#lang', 'bn');
  await page.fill('#roman', 'baa~Nlaa');
  await settle();
  expect((await out()) === 'বাংলা', 'Bengali baa~Nlaa, got ' + (await out()));

  // 5. letter keyboard inserts at the cursor of the Roman box (native letters pass through)
  await page.fill('#roman', '');
  await page.click('#roman');
  await page.click('#palette .it-key[data-ch="ক"]');
  await settle();
  expect((await out()) === 'ক', 'palette inserts a letter, got ' + (await out()));

  // 6. one-box mode: each word changes when space is typed
  await page.selectOption('#lang', 'hi');
  await page.click('#modeInline');
  await page.click('#clearBtn');
  await page.type('#out', 'meraa naam ', { delay: 10 });
  await settle();
  expect((await out()) === 'मेरा नाम ', 'one-box mode converts on space, got ' + (await out()));

  // 7. typing guide is generated from the engine
  await page.click('#tab-guide');
  await settle();
  const guide = await page.textContent('#guideBody');
  expect(guide.includes('क्ष') && guide.includes('ख') && guide.includes('नमस्ते'), 'guide shows letters and examples');

  // 8. script converter: Hindi shown in Bengali script
  await page.click('#tab-conv');
  await page.fill('#convIn', 'भारत');
  await page.selectOption('#convTo', 'beng');
  await page.waitForTimeout(200);
  expect((await page.inputValue('#convOut')) === 'ভারত', 'converter भारत -> ভারত, got ' + (await page.inputValue('#convOut')));
  await page.selectOption('#convTo', 'roman');
  await page.waitForTimeout(200);
  expect((await page.inputValue('#convOut')) === 'bhaarat', 'converter to Roman, got ' + (await page.inputValue('#convOut')));

  // 9. reload: language, mode and text are remembered
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForTimeout(900);
  const st = await page.evaluate(() => ({ lang: document.querySelector('#lang').value, out: document.querySelector('#out').value, tab: window.IT_APP.state.tab }));
  expect(st.lang === 'hi' && st.out === 'मेरा नाम ' && st.tab === 'conv', 'state survives reload: ' + JSON.stringify(st));
  await page.click('#tab-type');
};
