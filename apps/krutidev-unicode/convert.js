/* Kruti Dev 010 <-> Unicode Devanagari conversion engine (no UI, no network).
   Written from the Kruti Dev 010 glyph layout (Remington keyboard family, shared by Kruti Dev 011/016/055
   and DevLys 010). Each Kruti "character" is just a Latin / Windows-1252 code point that the font draws as a
   Devanagari shape, so the engine:
     1. replaces key sequences with Unicode, longest sequence first,
     2. moves the short-i sign (typed BEFORE the letter cluster) after the cluster,
     3. moves the reph (typed AFTER the syllable) in front of the cluster as र्,
     4. tidies sign order (nukta, matras, anusvara) and normalises to NFC.
   The reverse direction parses Unicode into syllables and applies the inverse moves.
   window.KRUTI = { toUnicode(text, opts), toKruti(text, opts), CHEAT, devanagariShare(text), toAnsiBytes(text) } */
(function () {
  'use strict';

  var HAL = '्', NUKTA = '़', I_SIGN = 'ि';
  var MI = '', MR = '';                    // markers: short-i (f) and reph (Z)
  var US = '', UE = '';                    // unknown character
  var KS = '', KE = '';                    // kept as it is (English, links)
  var AS = '', AE = '';                    // approximate (no exact Kruti key)

  /* ---------------------------------------------------------------- tables
     [unicode, kruti full form, kruti half form or null]                       */
  var CONSONANTS = [
    ['क', 'd', 'D'], ['ख', '[k', '['], ['ग', 'x', 'X'], ['घ', '?k', '?'], ['ङ', '³', null],
    ['च', 'p', 'P'], ['छ', 'N', null], ['ज', 't', 'T'], ['झ', '>', '÷'], ['ञ', '¥', null],
    ['ट', 'V', null], ['ठ', 'B', null], ['ड', 'M', null], ['ढ', '<', null], ['ण', '.k', '.'],
    ['त', 'r', 'R'], ['थ', 'Fk', 'F'], ['द', 'n', null], ['ध', '/k', '/'], ['न', 'u', 'U'],
    ['प', 'i', 'I'], ['फ', 'Q', '¶'], ['ब', 'c', 'C'], ['भ', 'Hk', 'H'], ['म', 'e', 'E'],
    ['य', ';', '¸'], ['र', 'j', null], ['ल', 'y', 'Y'], ['ळ', 'G', null], ['व', 'o', 'O'],
    ['श', "'k", "'"], ['ष', '"k', '"'], ['स', 'l', 'L'], ['ह', 'g', 'º']
  ];
  // joined letters that have their own Kruti glyph (checked before single letters)
  var LIGATURES = [
    ['क्ष', '{k', '{'], ['त्र', '=', '«'], ['ज्ञ', 'K', null], ['श्र', 'J', null], ['द्ध', ')', null],
    ['द्य', '|', null], ['द्व', '}', null], ['द्र', 'æ', null], ['क्र', 'Ø', null], ['फ्र', 'Ý', null],
    ['प्र', 'iz', null], ['ह्र', 'ºz', null], ['त्त', 'Ùk', 'Ù'], ['क्त', 'ä', null], ['ह्न', 'à', null],
    ['ह्य', 'á', null], ['ह्म', 'ã', null], ['ट्ट', 'Í', null], ['ट्ठ', 'Î', null], ['ड्ड', 'Ï', null],
    ['ड्ढ', 'ï', null], ['द्द', 'Ì', null]
  ];
  var VOWELS = [
    ['अ', 'v'], ['आ', 'vk'], ['इ', 'b'], ['ई', 'bZ'], ['उ', 'm'], ['ऊ', 'Å'], ['ऋ', '_'],
    ['ए', ','], ['ऐ', ',s'], ['ओ', 'vks'], ['औ', 'vkS'], ['ऑ', 'vkW'], ['ॲ', 'vW'], ['ऍ', ',W']
  ];
  var MATRAS = [
    ['ा', 'k'], ['ी', 'h'], ['ु', 'q'], ['ू', 'w'], ['ृ', '`'], ['े', 's'], ['ै', 'S'],
    ['ो', 'ks'], ['ौ', 'kS'], ['ॅ', 'W'], ['ॉ', 'kW']
  ];
  var MODS = [['ं', 'a'], ['ँ', '¡'], ['ः', '%']];
  var SIGNS = [['्', '~'], ['़', '+'], ['ऽ', '·'], ['॰', 'ñ'], ['॥', 'AA'], ['।', 'A']];
  var DIGITS = [['०', 'å'], ['१', 'ƒ'], ['२', '„'], ['३', '…'], ['४', '†'], ['५', '‡'], ['६', 'ˆ'], ['७', '‰'], ['८', 'Š'], ['९', '‹']];
  // punctuation: [unicode, kruti]
  var PUNCT = [
    ['.', '-'], ['-', '&'], [',', ']'], ['?', '\\'], [';', '('], ['(', '¼'], [')', '½'], ['{', '¿'], ['}', 'À'],
    ['=', '¾'], ['/', '@'], [':', '%'], ['+', '$'], ['÷', '»'], ['‘', '^'], ['’', '*'], ['“', 'Þ'], ['”', 'ß'], ['!', '!']
  ];

  /* Kruti -> Unicode table. Extra entries cover alternative glyphs found in real files. */
  var K2U = {};
  function k(key, val) { if (!(key in K2U)) K2U[key] = val; }
  // special sequences first (so they win over the generic entries below)
  k('v‚', 'ऑ'); k('vkW', 'ऑ'); k('vks', 'ओ'); k('vkS', 'औ'); k('vW', 'ॲ'); k('vk', 'आ'); k('v', 'अ');
  k('b±', 'ईं'); k('bZ', 'ई'); k('Ã', 'ई'); k('b', 'इ'); k('m', 'उ'); k('Å', 'ऊ'); k('_', 'ऋ');
  k(',s', 'ऐ'); k(',W', 'ऍ'); k(',', 'ए');
  k('ks', 'ो'); k('kS', 'ौ'); k('kW', 'ॉ'); k('‚', 'ॉ'); k('¨', 'ो'); k('®', 'ो'); k('©', 'ौ'); k('›', 'ै');
  k('#', 'रु'); k(':', 'रू');
  LIGATURES.forEach(function (r) { k(r[1], r[0]); if (r[2]) k(r[2], r[0] + HAL); });
  k('Ÿk', 'त्त'); k('Ÿ', 'त्त्'); k('«k', 'त्र'); k('Á', 'प्र'); k('ç', 'प्र'); k('£', 'ख्र');
  k('ê', 'ट्ट'); k('ë', 'ट्ठ'); k('ì', 'ड्ड'); k('í', 'द्द'); k('é', 'न्न'); k('™', 'न्न्'); k('ô', 'क्क');
  k('–', 'दृ'); k('—', 'कृ'); k('Ñ', 'कृ'); k('â', 'हृ');
  CONSONANTS.forEach(function (r) {
    k(r[1], r[0]);
    if (r[2]) { k(r[2] + 'k', r[0]); k(r[2], r[0] + HAL); }   // half letter + standing line = full letter
  });
  k('Ä', 'घ'); k('´', 'ञ'); k('Ò', 'भ'); k('Ük', 'श'); k('Ü', 'श्'); k('Ëk', 'ध'); k('Ë', 'ध्'); k('èk', 'ध'); k('è', 'ध्');
  k('Ök', 'झ'); k('Ö', 'झ्'); k('÷k', 'झ');
  // Word "smart quotes": the Kruti Dev 010 font draws ‘ ’ as ष् and “ ” as श्
  k('‘k', 'ष'); k('’k', 'ष'); k('‘', 'ष्'); k('’', 'ष्'); k('“k', 'श'); k('”k', 'श'); k('“', 'श्'); k('”', 'श्');
  MATRAS.forEach(function (r) { k(r[1], r[0]); });
  MODS.forEach(function (r) { k(r[1], r[0]); });
  k('z', HAL + 'र'); k('ª', HAL + 'र'); k('î', HAL + 'य');
  k('ZZ', MR);   // reph typed twice by mistake
  k('f', MI); k('Z', MR); k('±', MR + 'ं'); k('Æ', 'र' + HAL + MI); k('Ê', 'ी' + MR); k('È', 'ीं');
  SIGNS.forEach(function (r) { k(r[1], r[0]); });
  DIGITS.forEach(function (r) { k(r[1], r[0]); }); k('Œ', '०');
  PUNCT.forEach(function (r) { k(r[1], r[0]); });
  k('°', '°');

  // index: first character -> keys starting with it, longest first
  var K2U_IDX = {};
  Object.keys(K2U).forEach(function (key) { (K2U_IDX[key[0]] = K2U_IDX[key[0]] || []).push(key); });
  Object.keys(K2U_IDX).forEach(function (c) { K2U_IDX[c].sort(function (a, b) { return b.length - a.length; }); });

  /* Unicode -> Kruti lookups */
  var CONS_FULL = {}, CONS_HALF = {}, VOW_K = {}, MATRA_K = {}, MOD_K = {}, SIGN_K = {}, OTHER_K = {};
  CONSONANTS.forEach(function (r) { CONS_FULL[r[0]] = r[1]; CONS_HALF[r[0]] = r[2]; });
  VOWELS.forEach(function (r) { VOW_K[r[0]] = r[1]; });
  MATRAS.forEach(function (r) { MATRA_K[r[0]] = r[1]; });
  MODS.forEach(function (r) { MOD_K[r[0]] = r[1]; });
  SIGNS.forEach(function (r) { SIGN_K[r[0]] = r[1]; });
  DIGITS.forEach(function (r) { OTHER_K[r[0]] = r[1]; });
  PUNCT.forEach(function (r) { OTHER_K[r[0]] = r[1]; });
  OTHER_K['॥'] = 'AA'; OTHER_K['।'] = 'A'; OTHER_K['ऽ'] = '·'; OTHER_K['॰'] = 'ñ';
  OTHER_K["'"] = '*'; OTHER_K['–'] = '&'; OTHER_K['—'] = '&'; OTHER_K['…'] = '---'; OTHER_K['°'] = '°';
  var LIGS_SORTED = LIGATURES.slice().sort(function (a, b) { return b[0].length - a[0].length; });
  var ROUND = { 'ट': 1, 'ठ': 1, 'ड': 1, 'ढ': 1, 'छ': 1 };   // rakar under these is drawn with ª

  function isCons(c) { if (!c) return false; var n = c.charCodeAt(0); return (n >= 0x915 && n <= 0x939) || (n >= 0x958 && n <= 0x95F); }
  function isDeva(c) { if (!c) return false; var n = c.charCodeAt(0); return n >= 0x900 && n <= 0x97F; }
  function isDevaLetter(c) { if (!c) return false; var n = c.charCodeAt(0); return n >= 0x900 && n <= 0x963 && n !== 0x964 && n !== 0x965; }
  function isSkip(c) { // signs a reph may sit behind: matras, anusvara, chandrabindu, visarga, nukta
    if (!c) return false; var n = c.charCodeAt(0);
    return (n >= 0x93E && n <= 0x94C) || n === 0x901 || n === 0x902 || n === 0x903 || n === 0x93C || n === 0x962 || n === 0x963;
  }
  var PASS_RE = /[\s0-9\u0900-\u097F\u200B-\u200D\u2060]/;   // spaces, digits, Devanagari and zero-width marks pass through

  /* -------------------------------------------------------------- Kruti -> Unicode */
  var NUM_PUNCT = { '.': 1, ',': 1, '/': 1, ':': 1 };
  function isDigit(c) { return c >= '0' && c <= '9'; }
  function k2uRun(s, unknown) {
    var r = '', i = 0, n = s.length;
    while (i < n) {
      var c = s[i], keys = K2U_IDX[c], hit = null;
      // 10.5, 1,000, 12/09/2026, 10:30 between Latin digits come from an English-font run: in the Kruti font they would
      // read 10ण्5, 1ए000, 12ध्09, 10रू30, which nobody types, so they are kept as they are
      if (NUM_PUNCT[c] && isDigit(s[i - 1]) && isDigit(s[i + 1])) { r += c; i++; continue; }
      if (keys) for (var j = 0; j < keys.length; j++) { var kk = keys[j]; if (kk.length === 1 || s.substr(i, kk.length) === kk) { hit = kk; break; } }
      if (hit) { r += K2U[hit]; i += hit.length; continue; }
      if (PASS_RE.test(c)) { r += c; i++; continue; }
      var cp = s.codePointAt(i), ch = String.fromCodePoint(cp);
      unknown[ch] = (unknown[ch] || 0) + 1;
      r += US + ch + UE; i += ch.length;
    }
    return r;
  }

  function moveSigns(s) {
    // 1) short-i: ि typed before the cluster -> after it
    var out = '', i, n = s.length;
    for (i = 0; i < n; i++) {
      var c = s[i];
      if (c !== MI) { out += c; continue; }
      var j = i + 1;
      if (isCons(s[j])) {
        j++;
        if (s[j] === NUKTA) j++;
        while (s[j] === HAL && isCons(s[j + 1])) { j += 2; if (s[j] === NUKTA) j++; }
        out += s.slice(i + 1, j) + I_SIGN; i = j - 1;
      } else out += I_SIGN;
    }
    if (out.indexOf(MR) < 0) return out;
    // 2) reph: Z typed after the syllable -> र् before the cluster
    var o = [];
    for (i = 0; i < out.length; i++) {
      var d = out[i];
      if (d !== MR) { o.push(d); continue; }
      var p = o.length;
      while (p > 0 && isSkip(o[p - 1])) p--;
      if (p > 0 && isCons(o[p - 1])) {
        p--;
        for (;;) {
          if (o[p - 1] === HAL && isCons(o[p - 2])) p -= 2;
          else if (o[p - 1] === HAL && o[p - 2] === NUKTA && isCons(o[p - 3])) p -= 3;
          else break;
        }
        o.splice(p, 0, 'र', HAL);
      } else o.push('र', HAL);
    }
    return o.join('');
  }

  var VISARGA_WORDS = { 'नम': 1, 'पुन': 1, 'प्राय': 1, 'मन': 1, 'छंद': 1, 'छन्द': 1, 'दु': 1, 'अन्त': 1, 'अंत': 1, 'छ': 1, 'शनै': 1 };
  function tidy(s, opts) {
    s = s.replace(/््/g, HAL).replace(/ंं/g, 'ं')
      .replace(/िा/g, I_SIGN).replace(/ाा/g, 'ा')
      .replace(/([ा-ौ])़/g, NUKTA + '$1')
      .replace(/([ँं])([ा-ौ])/g, '$2$1')
      .replace(/अा/g, 'आ').replace(/अॉ/g, 'ऑ').replace(/अॅ/g, 'ॲ')
      .replace(/आे/g, 'ओ').replace(/आै/g, 'औ').replace(/आॅ/g, 'ऑ')
      .replace(/एे/g, 'ऐ').replace(/ाे/g, 'ो').replace(/ाै/g, 'ौ').replace(/ाॅ/g, 'ॉ');
    // % is visarga inside a word (दुःख); at a word end it is usually a colon (नाम: राम) unless the word is a visarga word
    if (s.indexOf('ः') >= 0) {
      var o = '';
      for (var i = 0; i < s.length; i++) {
        var c = s[i];
        if (c !== 'ः') { o += c; continue; }
        var prev = s[i - 1], next = s[i + 1];
        if (!isDevaLetter(prev)) { o += ':'; continue; }
        if (next && isDevaLetter(next)) { o += c; continue; }
        if (opts.sanskrit) { o += c; continue; }
        var m = /[ऀ-ॣ]+$/.exec(o), w = m ? m[0] : '';
        o += (VISARGA_WORDS[w] || /[तश]$/.test(w)) ? c : ':';
      }
      s = o;
    }
    return s;
  }

  /* English detection for mixed text (Kruti -> Unicode, "keep English" on) */
  var EN_WORDS = ('the and for with from this that these those to of at on by be are was were will shall may can not no yes ' +
    'all any each other our your their his him its it if so as an do does did done has have having into about above after ' +
    'before below between under over up down out off again then than there here where when what which who whom why how ' +
    'only also very just more most less such same own both few many much new old one two three four five six seven eight ' +
    'nine ten first second third last next date day month year time name address mobile phone email mail office govt ' +
    'government india indian delhi mumbai kolkata chennai bengaluru bangalore hyderabad pune jaipur lucknow patna bhopal ' +
    'ministry department section act rule rules order orders court high supreme district state central public private ' +
    'school college university board exam result class subject letter reference ref dated sir madam dear sincerely yours ' +
    'faithfully regards thanks thank please kindly copy page total amount bank account branch code pin number id card ' +
    'form fee fees tax gst pan aadhaar upi ifsc rs inr cash cheque online offline website internet computer software word ' +
    'excel pdf file files print printer scan whatsapp youtube google microsoft windows android hindi english marathi ' +
    'sanskrit unicode font kruti dev mangal nirmala noto ltd pvt limited company private co mr mrs ms dr shri smt ' +
    'note notice report meeting agenda minutes annexure enclosure enclosed subject sub in is us he me or my her').split(/\s+/);
  var EN_SET = {}; EN_WORDS.forEach(function (w) { if (w) EN_SET[w] = 1; });
  // exact strings that are ALSO common Kruti words (us = ने, in = पद, he = हे ...): never treat them as English
  var COLLIDE = {};
  ('us in is he me or my can has had her rs tax pan ij ls dk gS dh ds fd tks og ;g ge rks Fkk gh ftl tc rc vc dc lc uke eu ru ou ty ' +
    'ckn dj x;k gks Hkh vki ugha esa ij dks ls rd lkFk ckj o"kZ fnu dqN cgqr').split(/\s+/).forEach(function (w) { if (w) COLLIDE[w] = 1; });
  function isEnglish(core, keep) {
    if (!core) return false;
    if (keep && keep[core]) return true;
    var bare = core.replace(/[.,;:!?'")\]]+$/, '');
    if (keep && keep[bare]) return true;
    if (/^(https?:\/\/|www\.)\S+$/i.test(core)) return true;
    if (/^[\w.+-]+@[\w-]+(\.[\w-]+)*\.[A-Za-z]{2,}$/.test(bare)) return true;
    if (COLLIDE[bare]) return false;
    if (/^[A-Z]{2,}$/.test(bare) && !/^A+$/.test(bare)) return true;
    if (/^([A-Z]\.){2,}$/.test(core)) return true;
    if (/\d/.test(bare) && (bare.match(/[A-Z]/g) || []).length >= 2 && /^[A-Za-z0-9\/.-]+$/.test(bare)) return true;   // GSTIN, PAN, vehicle no.
    return !!EN_SET[bare.toLowerCase()] && /^[A-Za-z][a-z]*$|^[A-Z]+$/.test(bare);
  }

  function parseKeep(list) {
    var keep = {};
    String(list || '').split(/[,\n،]+/).forEach(function (w) { w = w.trim(); if (w) keep[w] = 1; });
    return keep;
  }

  function finish(marked, unknown, approx) {
    var text = marked.replace(/[-]/g, '');
    return { text: text, marked: marked, unknown: unknown, approx: approx || {} };
  }

  function cleanInput(src) {
    return String(src == null ? '' : src).replace(/\r\n?/g, '\n').replace(/﻿/g, '').replace(/[-]/g, '�');
  }

  function toUnicodeLine(line, opts, unknown) {
    var r;
    if (opts.keepEnglish) {
      r = '';
      var parts = line.split(/(\s+)/);
      for (var p = 0; p < parts.length; p++) {
        var tok = parts[p];
        if (!tok) continue;
        if (/^\s+$/.test(tok)) { r += tok; continue; }
        var m = /^([¼^Þ]*)(.*?)([\]\-\\(½!*ß]*)$/.exec(tok);
        if (m && m[2] && isEnglish(m[2], opts.keep)) r += k2uRun(m[1], unknown) + KS + m[2] + KE + k2uRun(m[3], unknown);
        else r += k2uRun(tok, unknown);
      }
    } else r = k2uRun(line, unknown);
    r = r.replace(/््/g, HAL).replace(/़्/g, NUKTA + HAL);   // ह्+्र, ज्+़ -> tidy order before moving signs
    return tidy(moveSigns(r), opts).normalize('NFC');
  }

  function toUnicode(src, opts) {
    opts = normOpts(opts);
    var unknown = {};
    var lines = cleanInput(src).split('\n');
    for (var i = 0; i < lines.length; i++) lines[i] = toUnicodeLine(lines[i], opts, unknown);
    return finish(lines.join('\n'), unknown);
  }

  /* -------------------------------------------------------------- Unicode -> Kruti */
  function encCluster(cl, unknown) {
    var out = '', i = 0, n = cl.length;
    while (i < n) {
      var full = null, half = null, unit = null, c = cl[i];
      for (var L = 0; L < LIGS_SORTED.length; L++) {
        var lg = LIGS_SORTED[L];
        if (cl.substr(i, lg[0].length) === lg[0]) { unit = lg[0]; full = lg[1]; half = lg[2]; break; }
      }
      if (!unit) { unit = c; full = CONS_FULL[c]; half = CONS_HALF[c]; }
      i += unit.length;
      var nk = '';
      if (cl[i] === NUKTA) { nk = '+'; i++; }
      if (!full) { // a consonant with no Kruti key (rare letters)
        unknown[unit] = (unknown[unit] || 0) + 1; full = US + unit + UE; half = null;
      }
      // rakar: C + ् + र at the end of the cluster
      if (cl[i] === HAL && cl[i + 1] === 'र' && cl[i + 2] !== NUKTA && (i + 2 === n || (cl[i + 2] === HAL && i + 3 === n))) {
        out += full + nk + (ROUND[unit] ? 'ª' : 'z'); i += 2;
        if (cl[i] === HAL) { out += '~'; i++; }
        continue;
      }
      if (cl[i] === HAL && i + 1 < n) { out += half ? half + nk : full + nk + '~'; i++; continue; }
      if (cl[i] === HAL) { out += full + nk + '~'; i++; continue; }
      out += full + nk;
    }
    return out;
  }

  function encode(s, unknown, approx) {
    var out = '', i = 0, n = s.length;
    while (i < n) {
      var c = s[i];
      if (isCons(c)) {
        var j = i, reph = false;
        if (c === 'र' && s[j + 1] === HAL && isCons(s[j + 2]) && s[i - 1] !== HAL) { reph = true; j += 2; }
        var start = j; j++;
        if (s[j] === NUKTA) j++;
        while (s[j] === HAL && isCons(s[j + 1])) { j += 2; if (s[j] === NUKTA) j++; }
        if (s[j] === HAL) j++;
        var cl = s.slice(start, j), hasI = false, mats = [];
        while (j < n) {
          var m = s[j];
          if (m === I_SIGN) { hasI = true; j++; }
          else if (MATRA_K[m] !== undefined) { mats.push(m); j++; }
          else if (m === NUKTA) { mats.push(m); j++; }
          else break;
        }
        var mods = '';
        while (j < n && MOD_K[s[j]] !== undefined) { mods += MOD_K[s[j]]; j++; }
        var body;
        if (cl === 'र' && (mats[0] === 'ु' || mats[0] === 'ू')) { body = mats[0] === 'ु' ? '#' : ':'; mats.shift(); }
        else if (cl === 'ह' && mats[0] === 'ृ') { body = 'â'; mats.shift(); }
        else body = encCluster(cl, unknown);
        var post = '';
        for (var q = 0; q < mats.length; q++) post += mats[q] === NUKTA ? '+' : MATRA_K[mats[q]];
        if (reph && mods.charAt(0) === 'a') { mods = '±' + mods.slice(1); reph = false; }
        out += (hasI ? 'f' : '') + body + post + (reph ? 'Z' : '') + mods;
        i = j; continue;
      }
      if (VOW_K[c] !== undefined) {
        var v = VOW_K[c]; i++;
        if (c === 'ई' && s[i] === 'ं') { v = 'b±'; i++; }
        out += v; continue;
      }
      if (c === 'ॐ') { approx[c] = (approx[c] || 0) + 1; out += AS + 'vks¡' + AE; i++; continue; }
      if (c === I_SIGN) { out += 'f'; i++; continue; }
      var t = MATRA_K[c] !== undefined ? MATRA_K[c] : MOD_K[c] !== undefined ? MOD_K[c] : SIGN_K[c] !== undefined ? SIGN_K[c] : OTHER_K[c];
      if (c === '"') { t = (/^\s?$/.test(s[i - 1] || '') ? 'Þ' : 'ß'); }
      if (t !== undefined) { out += t; i++; continue; }
      if (/[\s0-9]/.test(c)) { out += c; i++; continue; }
      var cp = s.codePointAt(i), ch = String.fromCodePoint(cp);
      unknown[ch] = (unknown[ch] || 0) + 1;
      out += US + ch + UE; i += ch.length;
    }
    return out;
  }

  // Latin words have no Kruti Dev keys at all, so they are always left as they are (shown as "kept", not as errors).
  // Numbers are always converted, even with "keep English" on: in the Kruti font "." is ण्, "," is ए and "/" is ध्,
  // so 10.5 must become 10-5 and 15/10/2026 must become 15@10@2026 to look right.
  var LATIN_RE = /(?:https?:\/\/|www\.)[^\sऀ-ॿ]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|[A-Za-z][A-Za-z0-9]*(?:[.'’_-][A-Za-z0-9]+)*/g;

  function toKruti(src, opts) {
    opts = normOpts(opts);
    var unknown = {}, approx = {};
    var s = cleanInput(src).normalize('NFC');
    var eyelash = (s.match(/ऱ|र्‍/g) || []).length;
    if (eyelash) approx['ऱ'] = eyelash;
    s = s.replace(/र्‍/g, 'ऱ्').replace(/[ऩऱऴक़-य़]/g, function (c) { return c.normalize('NFD'); })
      .replace(/़्/g, NUKTA + HAL).replace(/[‌‍]/g, '');
    var out = '';
    var re = LATIN_RE, last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(s))) {
      out += encode(s.slice(last, m.index), unknown, approx) + KS + m[0] + KE;
      last = m.index + m[0].length;
    }
    out += encode(s.slice(last), unknown, approx);
    return finish(out, unknown, approx);
  }

  function normOpts(o) {
    o = o || {};
    return { keepEnglish: !!o.keepEnglish, sanskrit: !!o.sanskrit, keep: o.keep || parseKeep(o.keepWords) };
  }

  /* share of Devanagari among letters (used to guess the direction of pasted text) */
  function devanagariShare(text) {
    var s = String(text || '').slice(0, 4000), d = 0, l = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (isDeva(c)) { d++; l++; } else if (/[A-Za-zÀ-ÿ]/.test(c)) l++;
    }
    return l ? d / l : 0;
  }

  /* Windows-1252 ("ANSI") bytes for old DTP software; returns { bytes, lost } */
  var CP1252 = { '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8A, '‹': 0x8B, 'Œ': 0x8C, 'Ž': 0x8E,
    '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9A, '›': 0x9B, 'œ': 0x9C, 'ž': 0x9E, 'Ÿ': 0x9F };
  function toAnsiBytes(text) {
    var s = String(text).replace(/\r?\n/g, '\r\n'), bytes = new Uint8Array(s.length), lost = 0, n = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s[i], code = c.charCodeAt(0);
      if (code < 0x80 || (code >= 0xA0 && code <= 0xFF)) bytes[n++] = code;
      else if (CP1252[c] !== undefined) bytes[n++] = CP1252[c];
      else { if (code >= 0xD800 && code <= 0xDBFF) i++; bytes[n++] = 0x3F; lost++; }
    }
    return { bytes: bytes.slice(0, n), lost: lost };
  }

  /* cheat-sheet data: [kruti keys, unicode] per group */
  var CHEAT = {
    vowels: VOWELS.map(function (r) { return [r[1], r[0]]; }),
    matras: MATRAS.map(function (r) { return [r[1], r[0]]; }).concat([['f', 'ि'], ['a', 'ं'], ['¡', 'ँ'], ['%', 'ः'], ['~', '्'], ['+', '़'], ['Z', 'र्'], ['z', '्र'], ['ª', '्र'], ['±', 'र्ं']]),
    cons: CONSONANTS.map(function (r) { return [r[1], r[0]]; }),
    half: CONSONANTS.filter(function (r) { return r[2]; }).map(function (r) { return [r[2], r[0] + HAL]; }).concat([['{', 'क्ष्'], ['«', 'त्र्'], ['Ù', 'त्त्'], ['“ ”', 'श्'], ['‘ ’', 'ष्']]),
    conj: LIGATURES.map(function (r) { return [r[1], r[0]]; }).concat([['#', 'रु'], [':', 'रू'], ['î', '्य'], ['d`', 'कृ'], ['â', 'हृ'], ['n`', 'दृ'], ['é', 'न्न']]),
    punct: SIGNS.filter(function (r) { return r[0] !== '्' && r[0] !== '़'; }).map(function (r) { return [r[1], r[0]]; })
      .concat(PUNCT.map(function (r) { return [r[1], r[0]]; })).concat(DIGITS.map(function (r) { return [r[1], r[0]]; })).concat([['0-9', '0-9']]),
    examples: [['fd;k', 'किया'], ['/keZ', 'धर्म'], ['izkFkZuk', 'प्रार्थना'], ['fLFkfr', 'स्थिति'], ['dhfrZ', 'कीर्ति'], ['ckG', 'बाळ'], ['vkWfQ+l', 'ऑफ़िस'], ['txr~', 'जगत्']]
  };

  window.KRUTI = {
    toUnicode: toUnicode, toKruti: toKruti, devanagariShare: devanagariShare, toAnsiBytes: toAnsiBytes,
    parseKeep: parseKeep, CHEAT: CHEAT, MARK: { US: US, UE: UE, KS: KS, KE: KE, AS: AS, AE: AE }
  };
})();
