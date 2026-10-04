/* Interaction test for the Kruti Dev - Unicode converter (run by tools/verify.js in en and hi).
   1) a 120+ pair corpus (Kruti Dev 010 <-> Unicode) is checked both ways and round-trip in the page's engine,
      plus typed variants that only go one way (Dr for क्त, ZZ typo, numbers from English-font runs),
   2) the UI converts live, swaps direction (also within the typing debounce), flags unknown characters,
      keeps English words, opens real ANSI / binary files, downloads UTF-8 with BOM and survives a reload. */
const CORPUS = [
  ['किया', 'fd;k'], ['कि', 'fd'], ['धर्म', '/keZ'], ['कर्म', 'deZ'], ['क्षमा', '{kek'], ['त्रिशूल', "f='kwy"], ['ज्ञान', 'Kku'],
  ['श्री', 'Jh'], ['शुद्ध', "'kq)"], ['ऋषि', '_f"k'], ['प्रार्थना', 'izkFkZuk'], ['राष्ट्रीय', 'jk"Vªh;'], ['विद्यालय', 'fo|ky;'],
  ['हिन्दी', 'fgUnh'], ['भारत', 'Hkkjr'], ['बाळ', 'ckG'], ['पाळणा', 'ikG.kk'], ['स्त्री', 'L=h'], ['कृष्ण', 'd`".k'], ['हृदय', 'ân;'],
  ['उत्तर', 'mÙkj'], ['अंक', 'vad'], ['आँख', 'vk¡[k'], ['दुःख', 'nq%[k'], ['ईश्वर', "bZ'oj"], ['ऐसा', ',slk'], ['औरत', 'vkSjr'],
  ['ओम', 'vkse'], ['सूर्य', 'lw;Z'], ['कार्यक्रम', 'dk;ZØe'], ['न्यायालय', 'U;k;ky;'], ['अधिकारी', 'vf/kdkjh'], ['शिक्षा', "f'k{kk"],
  ['विद्यार्थी', 'fo|kFkhZ'], ['निर्णय', 'fu.kZ;'], ['कीर्ति', 'dhfrZ'], ['मूर्ति', 'ewfrZ'], ['क्या', 'D;k'], ['द्वारा', '}kjk'],
  ['पद्म', 'in~e'], ['बुद्धि', 'cqf)'], ['ब्रह्म', 'czã'], ['चिह्न', 'fpà'], ['सम्बन्ध', 'lEcU/k'], ['पश्चिम', "if'pe"], ['लक्ष्मी', 'y{eh'],
  ['स्थिति', 'fLFkfr'], ['द्वितीय', 'f}rh;'], ['फ़िल्म', 'fQ+Ye'], ['कॉलेज', 'dkWyst'], ['वर्षों', 'o"kks±'], ['रुपया', '#i;k'], ['रूप', ':i'],
  ['समुद्र', 'leqæ'], ['क्रम', 'Øe'], ['तत्त्व', 'rÙo'], ['नमः', 'ue%'], ['ड्रामा', 'Mªkek'], ['ज़रूरत', 't+:jr'], ['पढ़ाई', 'i<+kbZ'],
  ['अट्टालिका', 'vÍkfydk'], ['उद्देश्य', "mÌs';"], ['शक्ति', "'kfä"], ['प्रिय', 'fiz;'], ['व्यक्ति', 'O;fä'], ['महत्त्वपूर्ण', 'egÙoiw.kZ'],
  ['ईंट', 'b±V'], ['जगत्', 'txr~'], ['दुसऱ्या', 'nqlj+~;k'], ['स्वागत', 'Lokxr'], ['उपर्युक्त', 'mi;qZä'], ['संस्कृत', 'laLd`r'],
  ['धन्यवाद', '/kU;okn'], ['आर्द्र', 'vkæZ'], ['ऑफ़िस', 'vkWfQ+l'], ['सिंह', 'flag'], ['हाथ।', 'gkFkA'], ['॥', 'AA'], ['मंत्री', 'ea=h'],
  ['प्रधानमंत्री', 'iz/kkuea=h'], ['छात्र', 'Nk='], ['पत्र', 'i='], ['गर्मी', 'xehZ'], ['आह्लाद', 'vkºykn'], ['भ्रम', 'Hkze'], ['ध्रुव', '/kzqo'],
  // office, court and Marathi words typed independently from the Remington Kruti Dev 010 layout
  ['निम्नलिखित', 'fuEufyf[kr'], ['सचिव', 'lfpo'], ['परियोजना', 'ifj;kstuk'], ['अधिनियम', 'vf/kfu;e'], ['सार्वजनिक', 'lkoZtfud'],
  ['कार्यालय', 'dk;kZy;'], ['आज्ञा', 'vkKk'], ['श्रीमान्', 'Jheku~'], ['प्रशासन', "iz'kklu"], ['मुंबई', 'eqacbZ'], ['कम्प्यूटर', 'dEI;wVj'],
  ['गृह', 'x`g'], ['राष्ट्रपति', 'jk"Vªifr'], ['महाराष्ट्र', 'egkjk"Vª'], ['त्यांनी', 'R;kauh'], ['आणि', 'vkf.k'], ['ब्रह्मास्मि', 'czãkfLe'],
  ['न्यायाधीश', "U;k;k/kh'k"], ['तृतीय', 'r`rh;'], ['चतुर्थ', 'prqFkZ'], ['अनुच्छेद', 'vuqPNsn'], ['स्वतंत्रता', 'Lora=rk'], ['विज्ञान', 'foKku'],
  ['क्रमशः', "Øe'k%"], ['डॉक्टर', 'MkWDVj'], ['फ्रांस', 'Ýkal'], ['लखनऊ', 'y[kuÅ'], ['छत्तीसगढ़', 'NÙkhlx<+'], ['उत्तराखण्ड', 'mÙkjk[k.M'],
  ['दृष्टि', 'n`f"V'], ['वृद्धि', 'o`f)'], ['पाठ्यक्रम', 'ikB~;Øe'], ['वाङ्मय', 'ok³~e;'], ['विश्वास', "fo'okl"], ['महात्मा', 'egkRek'],
  ['नेहरू', 'usg:'], ['सुभाषचंद्र', 'lqHkk"kpaæ'], ['प्रधानाचार्य', 'iz/kkukpk;Z'], ['परीक्षार्थी', 'ijh{kkFkhZ'], ['छः', 'N%'], ['अतः', 'vr%'],
  ['पूर्णांक', 'iw.kk±d'], ['धार्मिक', '/kkfeZd'], ['निर्वाचन', 'fuokZpu'], ['प्रशिक्षण', "izf'k{k.k"], ['आरक्षित', 'vkjf{kr'], ['भक्ति', 'Hkfä']
];
// how typists often type it (left) -> Unicode; the reverse direction uses one canonical form, so these go one way only
const ONE_WAY = [
  ['fu;qfDr', 'नियुक्ति'], ['vf/koDrk', 'अधिवक्ता'], ['vkÆrd', 'आर्तिक'], ['/keZZ', 'धर्म'], ['n~okjk', 'द्वारा'], ['iw.kkZad', 'पूर्णांक'],
  ['lqHkk"kpanz', 'सुभाषचंद्र'], ['eaa=h', 'मंत्री'], ['fo"k;% vkosnu', 'विषय: आवेदन'], ['le; 10%30', 'समय 10:30'],
  // numbers from an English-font run inside Kruti text: "." "," "/" ":" between digits are kept
  ['dqy 1,250.50 #-', 'कुल 1,250.50 रु.'], ['fnukad 03.10.2026', 'दिनांक 03.10.2026'], ['10:30 cts', '10:30 बजे'], ['12/09/2026', '12/09/2026']
];

module.exports = async function ({ page, expect, t }) {
  const out = async () => (await page.textContent('#output')).trim();
  const settle = () => page.waitForTimeout(260);          // input is converted after a 90 ms debounce
  const toasts = () => page.evaluate(() => [...document.querySelectorAll('[class*=toast]')].map((e) => e.textContent).join(' | '));
  const openFile = async (name, buffer) => {
    const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#openBtn')]);
    await fc.setFiles({ name, mimeType: 'text/plain', buffer });
    await page.waitForTimeout(500);
  };

  // 0. the sample loads on first visit, already converted
  await page.waitForFunction(() => document.querySelector('#output').textContent.length > 20, null, { timeout: 10000 });
  expect((await out()).startsWith('भारत सरकार'), 'sample converts to Unicode, got ' + (await out()).slice(0, 30));
  expect((await page.textContent('#statusText')).trim() === t('status_ok'), 'sample has no unknown characters');

  // 1. corpus: both directions + round trip, in the page's own engine
  const bad = await page.evaluate(([corpus, oneWay]) => {
    const K = window.KRUTI, fails = [];
    for (const [u, k] of corpus) {
      const a = K.toUnicode(k).text.normalize('NFC'), b = K.toKruti(u).text, c = K.toUnicode(b).text.normalize('NFC');
      if (a !== u.normalize('NFC')) fails.push('K2U ' + k + ' -> ' + a + ' (want ' + u + ')');
      if (b !== k) fails.push('U2K ' + u + ' -> ' + b + ' (want ' + k + ')');
      if (c !== u.normalize('NFC')) fails.push('round trip ' + u + ' -> ' + c);
    }
    for (const [k, u] of oneWay) {
      const a = K.toUnicode(k).text, c = K.toUnicode(K.toKruti(u).text).text;
      if (a !== u) fails.push('K2U typed ' + k + ' -> ' + a + ' (want ' + u + ')');
      if (c !== u) fails.push('round trip ' + u + ' -> ' + c);
    }
    return fails;
  }, [CORPUS, ONE_WAY]);
  expect(CORPUS.length >= 120, 'corpus has 120+ pairs');
  expect(bad.length === 0, bad.length + ' corpus failures: ' + bad.slice(0, 4).join(' | '));

  // 2. live conversion: fd;k -> किया
  await page.fill('#input', 'fd;k');
  await settle();
  expect((await out()) === 'किया', 'fd;k -> किया, got ' + (await out()));

  // 3. swap: the result becomes the input, direction flips, and it converts back
  await page.click('#swap');
  await settle();
  expect((await page.inputValue('#input')) === 'किया', 'swap moved the result into the input');
  expect((await page.getAttribute('#dirU2K', 'aria-pressed')) === 'true', 'direction is now Unicode -> Kruti Dev');
  expect((await out()) === 'fd;k', 'किया -> fd;k, got ' + (await out()));
  expect(await page.isVisible('#wordHelp'), 'Word / Kruti font help shown for Unicode -> Kruti Dev');
  expect(await page.isVisible('#dlAnsiBtn'), 'ANSI download offered for Kruti output');
  expect(!(await page.isVisible('#optKeep')), '"keep English" is not offered for Unicode -> Kruti Dev (Latin is always kept)');

  // 3b. Unicode -> Kruti Dev: English words have no Kruti keys, so they stay (underlined); ₹ is flagged
  await page.fill('#input', 'कार्यक्रम India ₹');
  await settle();
  expect((await out()) === 'dk;ZØe India ₹', 'कार्यक्रम -> dk;ZØe with English kept, got ' + (await out()));
  expect((await page.$$('#output .kept')).length === 1, 'English word shown as kept');
  expect((await page.$$('#unkChips .kd-chip')).length === 1, 'only ₹ listed as having no Kruti key');
  // numbers are typed with Kruti keys: "." is - , "," is ] and "/" is @ (otherwise the Kruti font shows ण् ए ध्)
  await page.fill('#input', 'कुल 10.5 किलो, 15/10/2026');
  await settle();
  expect((await out()) === 'dqy 10-5 fdyks] 15@10@2026', 'numbers converted for the Kruti font, got ' + (await out()));
  await page.fill('#input', 'किया');
  await settle();

  // 4. clicking the other direction works like swap (nothing is lost)
  await page.click('#dirK2U');
  await settle();
  expect((await page.inputValue('#input')) === 'fd;k' && (await out()) === 'किया', 'back to Kruti Dev -> Unicode');

  // 4b. typing and swapping at once (inside the 90 ms debounce) must not lose the last keys
  await page.fill('#input', '');
  await page.type('#input', 'Hkkjr ljdkj', { delay: 0 });
  await page.keyboard.press('Control+Shift+Enter');
  await settle();
  expect((await page.inputValue('#input')) === 'भारत सरकार', 'fast swap used the latest text, got ' + (await page.inputValue('#input')));
  await page.click('#dirK2U');
  await settle();

  // 5. unknown characters are reported, highlighted and kept as they are
  await page.fill('#input', 'fd;k Ô × /keZ');
  await settle();
  expect((await out()) === 'किया Ô × धर्म', 'unknown characters left in place, got ' + (await out()));
  expect((await page.$$('#output mark.unk')).length === 2, 'two unknown characters highlighted');
  expect((await page.$$('#unkChips .kd-chip')).length === 2, 'two unknown characters listed');
  expect((await page.textContent('#statusText')).trim() === t('status_unknown', { n: '2' }), 'status reports 2 unknown characters');
  expect((await page.textContent('#unkChips')).includes('U+00D4'), 'code point shown for Ô');

  // 6. Marathi ळ and Sanskrit visarga
  await page.fill('#input', 'ckG ue%');
  await settle();
  expect((await out()) === 'बाळ नमः', 'Marathi ळ and visarga, got ' + (await out()));

  // 7. "Keep English" leaves English words, emails and numbers alone
  await page.check('#optKeep');
  await page.fill('#input', 'Hkkjr India dk GST ram@gmail.com fnukad 12@09@2026');
  await settle();
  expect((await out()) === 'भारत India का GST ram@gmail.com दिनांक 12/09/2026', 'English kept, got ' + (await out()));
  expect((await page.$$('#output .kept')).length === 3, 'three kept English parts underlined');
  expect(await page.isVisible('#keepWrap'), 'keep-words box appears');
  await page.uncheck('#optKeep');


  // 8. files: an old ANSI (windows-1252) Kruti file from Notepad, then a picture renamed to .txt
  await openFile('aadesh.txt', Buffer.from("Øe'k% vkns'k\r\nmÙkj izns'k", 'latin1'));
  expect((await out()) === 'क्रमशः आदेश\nउत्तर प्रदेश', 'ANSI Kruti file (Ø Ù) converted, got ' + JSON.stringify(await out()));
  expect((await page.getAttribute('#dirK2U', 'aria-pressed')) === 'true', 'Kruti file kept the Kruti -> Unicode direction');
  const before = await page.inputValue('#input');
  await openFile('photo.txt', Buffer.from('89504E470D0A1A0A0000000D4948445200000001000000010806000000', 'hex'));
  expect((await page.inputValue('#input')) === before, 'a picture renamed to .txt does not replace the text');
  expect((await toasts()).includes(t('file_bad')), 'binary file reported as unreadable');

  // 9. download: UTF-8 with BOM and Windows line ends, the full result
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#dlBtn')]);
  const bytes = require('fs').readFileSync(await dl.path());
  expect(bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF, 'download starts with a UTF-8 BOM');
  expect(bytes.toString('utf8').slice(1) === 'क्रमशः आदेश\r\nउत्तर प्रदेश', 'download holds the result with CRLF line ends');

  // 10. line-by-line view lists every line
  await page.fill('#input', 'Hkkjr\nfgUnh\n/keZ');
  await settle();
  await page.click('#viewLines');
  await page.waitForTimeout(100);
  const rows = await page.$$eval('#linesView tbody tr', (trs) => trs.map((tr) => tr.lastChild.textContent));
  expect(rows.length === 3 && rows[2] === 'धर्म', 'line view shows 3 converted lines, got ' + JSON.stringify(rows));
  await page.click('#viewText');

  // 11. the text survives a reload (saved on this device only), even right after typing
  await page.type('#input', ' ue%', { delay: 0 });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(500);
  expect((await page.inputValue('#input')) === 'Hkkjr\nfgUnh\n/keZ ue%', 'input restored after reload, got ' + JSON.stringify(await page.inputValue('#input')));
  expect((await out()) === 'भारत\nहिन्दी\nधर्म नमः', 'output restored after reload, got ' + JSON.stringify(await out()));

  // 12. empty box: empty result, no "all converted" tick
  await page.fill('#input', '');
  await settle();
  expect((await out()) === '' && (await page.isVisible('#outEmpty')) && !(await page.isVisible('#status')), 'empty input shows the hint and no status');
};
