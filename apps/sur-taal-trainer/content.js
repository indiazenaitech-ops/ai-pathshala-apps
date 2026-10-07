/* Sur & Taal Trainer — localized music words.
   swar: the seven shuddh swars (Sa Re Ga Ma Pa Dha Ni) in each script.
   bols: tabla bols written in each script (these are sounds, not words to translate).
   Same shape in all 12 languages (checked by tools/verify.js). */
window.APP_CONTENT = {
  en: { swar: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'],
    bols: { dha: 'dha', dhin: 'dhin', na: 'na', tin: 'tin', ta: 'ta', ge: 'ge', ti: 'ti', ka: 'ka', dhi: 'dhi', tu: 'tu', kat: 'kat', dhage: 'dhage', tirakita: 'tirakita' } },
  hi: { swar: ['सा', 'रे', 'ग', 'म', 'प', 'ध', 'नि'],
    bols: { dha: 'धा', dhin: 'धिं', na: 'ना', tin: 'तिं', ta: 'ता', ge: 'गे', ti: 'ती', ka: 'का', dhi: 'धी', tu: 'तू', kat: 'कत', dhage: 'धागे', tirakita: 'तिरकिट' } },
  bn: { swar: ['সা', 'রে', 'গা', 'মা', 'পা', 'ধা', 'নি'],
    bols: { dha: 'ধা', dhin: 'ধিন', na: 'না', tin: 'তিন', ta: 'তা', ge: 'গে', ti: 'তি', ka: 'কা', dhi: 'ধি', tu: 'তু', kat: 'কৎ', dhage: 'ধাগে', tirakita: 'তিরকিট' } },
  mr: { swar: ['सा', 'रे', 'ग', 'म', 'प', 'ध', 'नी'],
    bols: { dha: 'धा', dhin: 'धिं', na: 'ना', tin: 'तिं', ta: 'ता', ge: 'गे', ti: 'ती', ka: 'का', dhi: 'धी', tu: 'तू', kat: 'कत', dhage: 'धागे', tirakita: 'तिरकिट' } },
  gu: { swar: ['સા', 'રે', 'ગ', 'મ', 'પ', 'ધ', 'ની'],
    bols: { dha: 'ધા', dhin: 'ધિં', na: 'ના', tin: 'તિં', ta: 'તા', ge: 'ગે', ti: 'તી', ka: 'કા', dhi: 'ધી', tu: 'તૂ', kat: 'કત', dhage: 'ધાગે', tirakita: 'તિરકિટ' } },
  pa: { swar: ['ਸਾ', 'ਰੇ', 'ਗਾ', 'ਮਾ', 'ਪਾ', 'ਧਾ', 'ਨੀ'],
    bols: { dha: 'ਧਾ', dhin: 'ਧਿੰ', na: 'ਨਾ', tin: 'ਤਿੰ', ta: 'ਤਾ', ge: 'ਗੇ', ti: 'ਤੀ', ka: 'ਕਾ', dhi: 'ਧੀ', tu: 'ਤੂ', kat: 'ਕਤ', dhage: 'ਧਾਗੇ', tirakita: 'ਤਿਰਕਿਟ' } },
  or: { swar: ['ସା', 'ରେ', 'ଗା', 'ମା', 'ପା', 'ଧା', 'ନି'],
    bols: { dha: 'ଧା', dhin: 'ଧିଂ', na: 'ନା', tin: 'ତିଂ', ta: 'ତା', ge: 'ଗେ', ti: 'ତୀ', ka: 'କା', dhi: 'ଧୀ', tu: 'ତୂ', kat: 'କତ', dhage: 'ଧାଗେ', tirakita: 'ତିରକିଟ' } },
  ta: { swar: ['ஸ', 'ரி', 'க', 'ம', 'ப', 'த', 'நி'],
    bols: { dha: 'தா', dhin: 'தின்', na: 'நா', tin: 'தின்', ta: 'தா', ge: 'கே', ti: 'தி', ka: 'கா', dhi: 'தி', tu: 'து', kat: 'கத்', dhage: 'தாகே', tirakita: 'திரகிட' } },
  te: { swar: ['స', 'రి', 'గ', 'మ', 'ప', 'ద', 'ని'],
    bols: { dha: 'ధా', dhin: 'ధిన్', na: 'నా', tin: 'తిన్', ta: 'తా', ge: 'గే', ti: 'తి', ka: 'కా', dhi: 'ధి', tu: 'తూ', kat: 'కత్', dhage: 'ధాగే', tirakita: 'తిరకిట' } },
  kn: { swar: ['ಸ', 'ರಿ', 'ಗ', 'ಮ', 'ಪ', 'ದ', 'ನಿ'],
    bols: { dha: 'ಧಾ', dhin: 'ಧಿನ್', na: 'ನಾ', tin: 'ತಿನ್', ta: 'ತಾ', ge: 'ಗೇ', ti: 'ತಿ', ka: 'ಕಾ', dhi: 'ಧಿ', tu: 'ತೂ', kat: 'ಕತ್', dhage: 'ಧಾಗೇ', tirakita: 'ತಿರಕಿಟ' } },
  ml: { swar: ['സ', 'രി', 'ഗ', 'മ', 'പ', 'ധ', 'നി'],
    bols: { dha: 'ധാ', dhin: 'ധിൻ', na: 'നാ', tin: 'തിൻ', ta: 'താ', ge: 'ഗേ', ti: 'തി', ka: 'കാ', dhi: 'ധി', tu: 'തൂ', kat: 'കത്', dhage: 'ധാഗേ', tirakita: 'തിരകിട' } },
  ur: { swar: ['سا', 'رے', 'گا', 'ما', 'پا', 'دھا', 'نی'],
    bols: { dha: 'دھا', dhin: 'دھن', na: 'نا', tin: 'تن', ta: 'تا', ge: 'گے', ti: 'تی', ka: 'کا', dhi: 'دھی', tu: 'تو', kat: 'کت', dhage: 'دھاگے', tirakita: 'ترکٹ' } }
};

/* Taals: beats as bol keys (an array = sub-strokes inside one beat), vibhag = start beats of each division,
   with its sign: 'x' = sam, numbers = tali (clap), '0' = khali (wave). Language-neutral. */
window.APP_TAALS = {
  teentaal: { beats: ['dha', 'dhin', 'dhin', 'dha', 'dha', 'dhin', 'dhin', 'dha', 'dha', 'tin', 'tin', 'ta', 'ta', 'dhin', 'dhin', 'dha'],
    vibhag: [[1, 'x'], [5, '2'], [9, '0'], [13, '3']] },
  keherwa: { beats: ['dha', 'ge', 'na', 'ti', 'na', 'ka', 'dhi', 'na'], vibhag: [[1, 'x'], [5, '0']] },
  dadra: { beats: ['dha', 'dhin', 'na', 'dha', 'tu', 'na'], vibhag: [[1, 'x'], [4, '0']] },
  rupak: { beats: ['tin', 'tin', 'na', 'dhin', 'na', 'dhin', 'na'], vibhag: [[1, '0'], [4, '2'], [6, '3']] },
  jhaptaal: { beats: ['dhi', 'na', 'dhi', 'dhi', 'na', 'ti', 'na', 'dhi', 'dhi', 'na'], vibhag: [[1, 'x'], [3, '2'], [6, '0'], [8, '3']] },
  ektaal: { beats: ['dhin', 'dhin', 'dhage', 'tirakita', 'tu', 'na', 'kat', 'ta', 'dhage', 'tirakita', 'dhin', 'na'],
    vibhag: [[1, 'x'], [3, '0'], [5, '2'], [7, '0'], [9, '3'], [11, '4']] }
};

/* Alankars as semitone steps from Sa (0 = Sa, 2 = Re, 4 = Ga, 5 = Ma, 7 = Pa, 9 = Dha, 11 = Ni, 12 = upper Sa).
   'g' = groups (a short gap is shown between groups), 'hold' = beats per note. Built from patterns so the
   12 exercises stay small; names come from strings.js (alk_1 … alk_12). */
window.APP_ALANKARS = (function () {
  var S = [0, 2, 4, 5, 7, 9, 11, 12];               // shuddh scale with upper Sa
  function up(fn) { var out = []; for (var i = 0; i < S.length; i++) { var g = fn(i); if (g) out.push(g); } return out; }
  function down(fn) { var out = []; for (var i = S.length - 1; i >= 0; i--) { var g = fn(i); if (g) out.push(g); } return out; }
  function win(n) {                                 // groups of n consecutive swars, up then down
    var u = up(function (i) { if (i + n > S.length) return null; return S.slice(i, i + n); });
    var d = down(function (i) { if (i - n + 1 < 0) return null; return S.slice(i - n + 1, i + 1).reverse(); });
    return u.concat(d);
  }
  return [
    { groups: [S.slice(), S.slice().reverse()], hold: 1 },                                     // 1 aaroh–avroh
    { groups: win(2), hold: 1 },                                                                // 2 two-swar steps
    { groups: win(3), hold: 1 },                                                                // 3 three-swar steps
    { groups: win(4), hold: 1 },                                                                // 4 four-swar steps
    { groups: up(function (i) { return i + 1 < S.length ? [S[i], S[i + 1], S[i]] : null; })     // 5 back and forth
        .concat(down(function (i) { return i - 1 >= 0 ? [S[i], S[i - 1], S[i]] : null; })), hold: 1 },
    { groups: up(function (i) { return i + 2 < S.length ? [S[i], S[i + 2]] : null; })           // 6 skip one
        .concat(down(function (i) { return i - 2 >= 0 ? [S[i], S[i - 2]] : null; })), hold: 1 },
    { groups: up(function (i) { return [S[i], S[i]]; }).concat(down(function (i) { return [S[i], S[i]]; })), hold: 1 },  // 7 twice each
    { groups: up(function (i) { return i + 2 < S.length ? [S[i], S[i + 1], S[i + 2], S[i + 1]] : null; }).concat([[12]])  // 8 up three, back one
        .concat(down(function (i) { return i - 2 >= 0 ? [S[i], S[i - 1], S[i - 2], S[i - 1]] : null; })).concat([[0]]), hold: 1 },
    { groups: win(5), hold: 1 },                                                                // 9 five-swar steps
    { groups: [[0, 7], [2, 9], [4, 11], [5, 12], [12, 5], [11, 4], [9, 2], [7, 0]], hold: 1 },  // 10 jump to Pa
    { groups: [[0, 4, 7, 12, 7, 4, 0], [0, 5, 9, 12, 9, 5, 0]], hold: 1 },                      // 11 Sa Ga Pa Sa
    { groups: [S.slice(), S.slice().reverse()], hold: 2 }                                       // 12 long swars
  ];
})();
