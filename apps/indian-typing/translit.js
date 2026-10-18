/* Indian Typing: phonetic Roman -> Indian script engine (window.ITYPE). Runs fully on the device.
   verify-allow-mixed-scripts  (this file intentionally contains every script)

   How it works
   1. tokenize(): the Roman text is cut into keys by longest match ("kh" before "k"). Every key gives abstract
      tokens: consonant {k:'C', o:offset, nk:nukta}, vowel {k:'V', v:name} or sign {k:'S', s:name}. "offset" is the
      position of the letter inside the Devanagari block (क = 0x15). All Brahmic scripts share that layout,
      so one offset gives the same letter in every script (क ক ਕ ક କ க క ಕ ക).
   2. per-script context rules (nasals, doubled letters, Tamil n, Bengali y, Malayalam chillu ...).
   3. render(): consonant + consonant = virama between (conjunct), consonant + vowel = vowel sign (matra),
      a vowel at the start of a word or after a vowel = the full vowel letter, a consonant at the end of a word:
      north Indian scripts keep it bare (namaste -> नमस्ते, bhaarat -> भारत), Dravidian scripts add the virama. */
(function () {
  'use strict';

  /* ------------------------------------------------------------ scripts */
  var VOW = {  // name: [independent offset, vowel-sign offset (null = inherent a)]
    a: [0x05, null], aa: [0x06, 0x3E], i: [0x07, 0x3F], ii: [0x08, 0x40], u: [0x09, 0x41], uu: [0x0A, 0x42],
    R: [0x0B, 0x43], RR: [0x60, 0x44], lR: [0x0C, 0x62], es: [0x0E, 0x46], e: [0x0F, 0x47], ai: [0x10, 0x48],
    os: [0x12, 0x4A], o: [0x13, 0x4B], au: [0x14, 0x4C], aw: [0x11, 0x49]
  };
  var SIGN = { candra: 0x01, anus: 0x02, visarga: 0x03, virama: 0x4D, nukta: 0x3C, avagraha: 0x3D };
  // letters a script lacks fall back to the nearest letter (offset -> offset)
  var FALL = { 0x35: 0x2C, 0x34: 0x33, 0x33: 0x32, 0x31: 0x30, 0x29: 0x28, 0x37: 0x36, 0x36: 0x38, 0x19: 0x28, 0x1E: 0x28,
    0x0E: 0x0F, 0x12: 0x13, 0x46: 0x47, 0x4A: 0x4B, 0x11: 0x13, 0x49: 0x4B, 0x0D: 0x0F, 0x45: 0x47, 0x60: 0x0B, 0x44: 0x43, 0x0C: 0x0B, 0x62: 0x43 };

  var TA = {}; // Tamil has one letter for k/kh/g/gh etc.
  [[0x15, 0x18, 'க'], [0x1A, 0x1B, 'ச'], [0x1C, 0x1D, 'ஜ'], [0x1F, 0x22, 'ட'], [0x24, 0x27, 'த'], [0x2A, 0x2D, 'ப']].forEach(function (r) {
    for (var o = r[0]; o <= r[1]; o++) TA[o] = r[2];
  });
  TA[0x19] = 'ங'; TA[0x1E] = 'ஞ'; TA[0x23] = 'ண'; TA[0x28] = 'ந'; TA[0x29] = 'ன'; TA[0x2E] = 'ம'; TA[0x2F] = 'ய'; TA[0x30] = 'ர'; TA[0x31] = 'ற';
  TA[0x32] = 'ல'; TA[0x33] = 'ள'; TA[0x34] = 'ழ'; TA[0x35] = 'வ'; TA[0x36] = 'ஷ'; TA[0x37] = 'ஷ'; TA[0x38] = 'ஸ'; TA[0x39] = 'ஹ';

  var S = {
    deva: { base: 0x0900, north: true, nukta: true, nasal: 'anus', danda: true },
    beng: { base: 0x0980, north: true, nukta: true, nasal: 'assim', danda: true, yrule: 'beng' },
    asm: { base: 0x0980, north: true, nukta: true, nasal: 'assim', danda: true, yrule: 'beng', map: { 0x30: 'ৰ', 0x35: 'ৱ' } },
    guru: { base: 0x0A00, north: true, nukta: true, nasal: 'guru', danda: true, gem: true,
      map: { 0x37: 'ਸ਼', 0x0B: 'ਰਿ', 0x60: 'ਰੀ', 0x43: '੍ਰਿ', 0x44: '੍ਰੀ' } },
    gujr: { base: 0x0A80, north: true, nukta: true, nasal: 'anus' },
    orya: { base: 0x0B00, north: true, nukta: true, nasal: 'assim', danda: true, yrule: 'orya', map: { 0x35: 'ବ' } },
    taml: { base: 0x0B80, south: true, nasal: 'tamil', cons: TA,
      map: { 0x0B: 'ரு', 0x60: 'ரூ', 0x43: '்ரு', 0x44: '்ரூ', 0x02: 'ம்', 0x01: 'ம்', 0x3D: '' } },
    telu: { base: 0x0C00, south: true, nasal: 'anus', anusM: true, finalM: true },
    knda: { base: 0x0C80, south: true, nukta: true, nasal: 'anus', anusM: true, map: { 0x34: 'ೞ' } },
    mlym: { base: 0x0D00, south: true, finalM: true, chillu: { 0x28: 'ൻ', 0x30: 'ർ', 0x32: 'ൽ', 0x33: 'ൾ', 0x23: 'ൺ' } },
    arab: { arab: true }
  };

  function valid(cp) { return /[\p{L}\p{M}\p{N}\p{P}]/u.test(String.fromCharCode(cp)); }
  /* the character for a Devanagari offset in script sc (consonant, vowel, sign) */
  function chr(sc, o) {
    var d = S[sc], guard = 0;
    while (guard++ < 6) {
      if (d.map && d.map[o] !== undefined) return d.map[o];
      if (d.cons && d.cons[o] !== undefined) return d.cons[o];
      var cp = d.base + o;
      if (valid(cp)) return String.fromCharCode(cp);
      if (FALL[o] === undefined) return '';
      o = FALL[o];
    }
    return '';
  }
  function cons(sc, o, nk) {
    var c = chr(sc, o);
    if (!nk) return c;
    if (sc === 'taml' && o === 0x2B) return 'ஃப';           // f in Tamil is written ஃப
    return S[sc].nukta ? c + String.fromCharCode(S[sc].base + 0x3C) : c;
  }

  window.ITYPE_CORE = { VOW: VOW, SIGN: SIGN, S: S, chr: chr, cons: cons, valid: valid };
})();
