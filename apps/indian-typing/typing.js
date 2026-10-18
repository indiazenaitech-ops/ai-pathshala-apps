/* Indian Typing: keys, context rules and rendering (window.ITYPE). Needs translit.js (ITYPE_CORE).
   verify-allow-mixed-scripts */
(function () {
  'use strict';
  var K = window.ITYPE_CORE, VOW = K.VOW, SIGN = K.SIGN, SC = K.S, chr = K.chr, cons = K.cons;

  /* typing languages -> script */
  var LANGS = {
    hi: { sc: 'deva', dict: 'hi' }, mr: { sc: 'deva' }, sa: { sc: 'deva' }, ne: { sc: 'deva' },
    bn: { sc: 'beng', dict: 'bn' }, as: { sc: 'asm' }, pa: { sc: 'guru' }, gu: { sc: 'gujr' }, or: { sc: 'orya' },
    ta: { sc: 'taml' }, te: { sc: 'telu' }, kn: { sc: 'knda' }, ml: { sc: 'mlym' }, ur: { sc: 'arab', dict: 'ur' }
  };
  var ORDER = ['hi', 'mr', 'sa', 'ne', 'bn', 'as', 'pa', 'gu', 'or', 'ta', 'te', 'kn', 'ml', 'ur'];

  /* key table: [group, 'key alt alt', 'tokens'].  Tokens: Cxx consonant (hex offset), Nxx consonant + nukta,
     V<name> vowel, S<name> sign, L:<char> literal consonant, D:<char> literal letter that ends the syllable.
     Suffix ! = keep this letter as it is (no nasal rule); # = Tamil s (does not change the n before it).
     'e*' / 'o*' = short e / short o in the Dravidian scripts, long in the others. */
  var BASE = [
    ['vow', 'a', 'Va'], ['vow', 'aa A', 'Vaa'], ['vow', 'i', 'Vi'], ['vow', 'ii ee I', 'Vii'], ['vow', 'u', 'Vu'],
    ['vow', 'uu oo U', 'Vuu'], ['vow', 'R Ri RRi', 'VR'], ['vow', 'RRI', 'VRR'], ['vow', 'e', 'Ve*'], ['vow', 'E', 'Ve'],
    ['vow', 'ai', 'Vai'], ['vow', 'o', 'Vo*'], ['vow', 'O', 'Vo'], ['vow', 'au ou', 'Vau'], ['vow', 'aw', 'Vaw'],
    ['con', 'k', 'C15'], ['con', 'kh', 'C16'], ['con', 'g', 'C17'], ['con', 'gh', 'C18'], ['con', '~N', 'C19!'],
    ['con', 'ch c', 'C1A'], ['con', 'chh', 'C1B'], ['con', 'j', 'C1C'], ['con', 'jh', 'C1D'], ['con', '~n', 'C1E!'],
    ['con', 'T', 'C1F'], ['con', 'Th', 'C20'], ['con', 'D', 'C21'], ['con', 'Dh', 'C22'], ['con', 'N', 'C23'],
    ['con', 't', 'C24'], ['con', 'th', 'C25'], ['con', 'd', 'C26'], ['con', 'dh', 'C27'], ['con', 'n', 'C28'],
    ['con', 'p', 'C2A'], ['con', 'ph', 'C2B'], ['con', 'b', 'C2C'], ['con', 'bh', 'C2D'], ['con', 'm', 'C2E'],
    ['con', 'y', 'C2F'], ['con', 'r', 'C30'], ['con', 'l', 'C32'], ['con', 'L', 'C33'], ['con', 'v w', 'C35'],
    ['con', 'sh', 'C36'], ['con', 'Sh shh', 'C37'], ['con', 's', 'C38'], ['con', 'h', 'C39'],
    ['spe', 'x ksh', 'C15 C37'], ['spe', 'j~n GY dny', 'C1C C1E'], ['spe', 'gyaa', 'C1C C1E Vaa'],
    ['nuk', 'q', 'N15'], ['nuk', 'K', 'N16'], ['nuk', 'G', 'N17'], ['nuk', 'z', 'N1C'], ['nuk', 'f', 'N2B'],
    ['nuk', '.D', 'N21'], ['nuk', '.Dh', 'N22'],
    ['sig', 'M', 'Sanus'], ['sig', '~ .N .n', 'Scandra'], ['sig', 'H', 'Svisarga'], ['sig', '^ .h', 'Svirama'],
    ['sig', '_', 'Szwnj'], ['sig', '__', 'Szwj'], ['sig', '.a', 'Savagraha'],
    ['pun', '|', 'P:।'], ['pun', '||', 'P:॥'], ['spe', 'OM', 'P:ॐ']
  ];
  // per language: null removes a key
  var OVR = {
    common_noaw: { aw: null },
    deva: {},
    beng: { 't^': ['spe', 'D:ৎ'], OM: null, aw: null },
    guru: { OM: null, aw: null },
    gujr: { OM: null },
    orya: { w: ['con', 'L:ୱ'], OM: null, aw: null },
    taml: { R: ['con', 'C31'], Ri: null, RRi: null, RRI: null, aw: null, OM: null, '|': null, '||': null, '.D': null, '.Dh': null,
      s: ['con', 'C1A#'], S: ['con', 'C38'], rr: ['con', 'C31'], zh: ['con', 'C34'], n2: ['con', 'C29!'], n1: ['con', 'C28!'],
      nr: ['spe', 'C29! C31'], ndr: ['spe', 'C29! C31'], tr: ['spe', 'C31 C31'], tt: ['spe', 'C1F C1F'], nj: ['spe', 'C1E! C1A'] },
    telu: { aw: null, OM: null, '|': null, '||': null },
    knda: { aw: null, OM: null, '|': null, '||': null },
    mlym: { aw: null, OM: null, '|': null, '||': null, '.D': null, '.Dh': null,
      t: ['con', 'C1F'], T: ['con', 'C20'], th: ['con', 'C24'], Th: ['con', 'C25'], d: ['con', 'C21'], D: ['con', 'C22'],
      dh: ['con', 'C26'], Dh: ['con', 'C27'], rr: ['con', 'C31'], zh: ['con', 'C34'], ng: ['con', 'C19!'], nj: ['con', 'C1E!'],
      tt: ['spe', 'C31 C31'], nt: ['spe', 'C28! C31'], nth: ['spe', 'C28! C24'], nd: ['spe', 'C23! C1F'], ndh: ['spe', 'C28! C26'],
      nk: ['spe', 'C19! C15'] },
    arab: { aw: null, OM: null, '|': null, '||': null, N: ['sig', 'Scandra'], '.a': null, '_': null, '__': null }
  };
  OVR.asm = OVR.beng;

  function parseTok(s) {
    return s.split(' ').map(function (p) {
      var fixed = /!$/.test(p), ns = /#$/.test(p);
      p = p.replace(/[!#]$/, '');
      if (p[0] === 'C' || p[0] === 'N') return { k: 'C', o: parseInt(p.slice(1), 16), nk: p[0] === 'N', fixed: fixed, ns: ns };
      if (p[0] === 'V') return { k: 'V', v: p.slice(1) };
      if (p[0] === 'S') return { k: 'S', s: p.slice(1) };
      if (p.slice(0, 2) === 'L:') return { k: 'C', ch: p.slice(2) };
      if (p.slice(0, 2) === 'D:') return { k: 'C', ch: p.slice(2), dead: true };
      if (p.slice(0, 2) === 'P:') return { k: 'X', s: p.slice(2) };
      return null;
    });
  }
  var TABLES = {};
  function table(lang) {
    if (TABLES[lang]) return TABLES[lang];
    var sc = LANGS[lang].sc, south = !!SC[sc].south, map = {}, rows = [], ovr = OVR[sc] || {};
    function add(group, key, toks, row) {
      var t = parseTok(toks.replace(/V(e|o)\*/g, function (m, x) { return 'V' + x + (south ? 's' : ''); }));
      map[key] = t; row.keys.push(key); row.tok = t;
    }
    BASE.forEach(function (b) {
      var row = { g: b[0], keys: [], tok: null };
      b[1].split(' ').forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(ovr, k)) return;
        if (b[2] === 'P:ॐ' && sc !== 'deva') return;
        if ((b[2] === 'P:।' || b[2] === 'P:॥') && !SC[sc].danda) return;
        add(b[0], k, b[2], row);
      });
      if (row.keys.length) rows.push(row);
    });
    Object.keys(ovr).forEach(function (k) {
      if (!ovr[k]) return;
      var row = { g: ovr[k][0], keys: [], tok: null, ovr: true };
      add(ovr[k][0], k, ovr[k][1], row); rows.push(row);
    });
    var maxLen = 0; Object.keys(map).forEach(function (k) { if (k.length > maxLen) maxLen = k.length; });
    return (TABLES[lang] = { map: map, rows: rows, max: maxLen, sc: sc });
  }

  /* ------------------------------------------------------------ tokenizer */
  var KEYCH = /[A-Za-z~^_.|]/;
  var WORDCAP = { N: 'n', M: 'm', H: 'h', L: 'l', K: 'k', G: 'g', T: 't', D: 'd', S: 's' };
  function tokenize(text, lang, opts) {
    var T = table(lang), out = [], i = 0, raw = false, n = text.length, dict = opts.smart && LANGS[lang].dict && window.ITYPE_WORDS ? window.ITYPE_WORDS[LANGS[lang].dict] : null;
    function atStart() { var p = out[out.length - 1]; return !p || p.k === 'X'; }
    while (i < n) {
      if (text.substr(i, 2) === '##') { raw = !raw; i += 2; continue; }
      var c = text[i];
      if (raw) { out.push({ k: 'X', s: c, raw: true }); i++; continue; }
      if (!KEYCH.test(c) || (c === '.' && !/[A-Za-z]/.test(text[i + 1] || ''))) {
        if (/\p{M}|[\u200C\u200D]/u.test(c)) out.push({ k: 'M', s: c }); else out.push({ k: 'X', s: c, at: i });
        i++; continue;
      }
      if (dict && atStart() && /[A-Za-z]/.test(c)) {           // common Hindi / Urdu words in everyday spelling
        var m = /^[A-Za-z]+/.exec(text.slice(i, i + 40))[0], nx = text[i + m.length] || '';
        var w = /^[A-Z][a-z]+$/.test(m) ? m.toLowerCase() : m;
        if (!KEYCH.test(nx) || (nx === '.' && !/[A-Za-z]/.test(text[i + m.length + 1] || ''))) {
          if (Object.prototype.hasOwnProperty.call(dict, w)) { out.push({ k: 'X', s: dict[w], word: true }); i += m.length; continue; }
        }
      }
      var src = text.substr(i, T.max);
      if (opts.capfix && atStart() && WORDCAP[c] && /[a-z]/.test(text[i + 1] || '')) {
        src = WORDCAP[c] + src.slice(1);
      }
      var hit = null, len = 0;
      for (var L = Math.min(T.max, src.length); L > 0; L--) {
        var k = src.slice(0, L);
        if (T.map[k]) { hit = T.map[k]; len = L; break; }
      }
      if (!hit && /[A-Z]/.test(c)) {                            // B, P, J ... have no capital key: use the small letter
        src = c.toLowerCase() + src.slice(1);
        for (L = Math.min(T.max, src.length); L > 0; L--) { k = src.slice(0, L); if (T.map[k]) { hit = T.map[k]; len = L; break; } }
      }
      if (!hit) { out.push({ k: 'X', s: c }); i++; continue; }
      if (atStart() && (k === 'M' || k === 'H')) hit = T.map[k.toLowerCase()];   // a word cannot start with a sign
      hit.forEach(function (t) { out.push(Object.assign({}, t)); });
      i += len;
    }
    return out;
  }

  /* ------------------------------------------------------------ context rules (one word at a time) */
  var EXC = {}; [0x28, 0x2E, 0x2F, 0x30, 0x32, 0x33, 0x35, 0x39, 0x23, 0x29].forEach(function (o) { EXC[o] = 1; });
  var VEL = [0x15, 0x18], PAL = [0x1A, 0x1D], RET = [0x1F, 0x22], DEN = [0x24, 0x27], LAB = [0x2A, 0x2D];
  function inR(o, r) { return o >= r[0] && o <= r[1]; }
  function isC(t) { return t && t.k === 'C' && t.o !== undefined; }
  var ASP = { 0x15: 0x16, 0x17: 0x18, 0x1A: 0x1B, 0x1C: 0x1D, 0x1F: 0x20, 0x21: 0x22, 0x24: 0x25, 0x26: 0x27, 0x2A: 0x2B, 0x2C: 0x2D };

  function rules(w, sc) {
    var d = SC[sc], i, t, p, nx;
    for (i = 0; i < w.length; i++) {
      t = w[i]; p = w[i - 1]; nx = w[i + 1];
      if (!isC(t) || t.nk) continue;
      var afterV = p && (p.k === 'V' || (p.k === 'S' && p.s !== 'virama'));
      if (d.nasal === 'anus' && afterV && isC(nx) && !EXC[nx.o] && !t.fixed && (t.o === 0x28 || (d.anusM && t.o === 0x2E && nx.o !== 0x2E))) {
        w[i] = { k: 'S', s: 'anus' };
      } else if (d.nasal === 'guru' && afterV && isC(nx) && (((t.o === 0x28) && !EXC[nx.o]) || t.o === 0x1E || t.o === 0x19 || (t.o === 0x2E && inR(nx.o, LAB)))) {
        w[i] = { k: 'S', s: 'anus' };
      } else if (d.nasal === 'assim' && afterV && t.o === 0x28 && !t.fixed && isC(nx)) {
        if (nx.o === 0x17 && !nx.nk && !(w[i + 2] && w[i + 2].k === 'V')) { w.splice(i, 2, { k: 'S', s: 'anus' }); }
        else if (inR(nx.o, VEL)) t.o = 0x19; else if (inR(nx.o, PAL)) t.o = 0x1E; else if (inR(nx.o, RET)) t.o = 0x23;
      } else if (d.nasal === 'tamil' && t.o === 0x28 && !t.fixed) {
        if (!p) { /* word start: ந */ }
        else if (isC(nx) && inR(nx.o, DEN)) t.o = 0x28;
        else if (isC(nx) && inR(nx.o, VEL)) t.o = 0x19;
        else if (isC(nx) && !nx.ns && inR(nx.o, PAL)) t.o = 0x1E;
        else if (isC(nx) && inR(nx.o, RET)) t.o = 0x23;
        else t.o = 0x29;
      }
    }
    if (d.nasal === 'assim') {                // ঙ before a letter that is not k/kh/g/gh (or at the end) is written ং
      for (i = 0; i < w.length; i++) {
        t = w[i]; nx = w[i + 1];
        if (isC(t) && t.o === 0x19 && w[i - 1] && w[i - 1].k === 'V' && (!nx || (isC(nx) && !inR(nx.o, VEL)))) w[i] = { k: 'S', s: 'anus' };
      }
    }
    if (d.gem) {                              // Gurmukhi: ਪੱਕਾ (addak) and ਕੰਨ (tippi) for doubled letters
      for (i = 0; i < w.length; i++) {
        t = w[i]; p = w[i - 1]; nx = w[i + 1];
        if (!isC(t) || t.nk || !isC(nx) || nx.nk || !p || p.k !== 'V') continue;
        if (nx.o === t.o || ASP[t.o] === nx.o) w[i] = { k: 'S', s: (t.o === 0x28 || t.o === 0x2E || t.o === 0x23) ? 'anus' : 'addak' };
      }
    }
    if (d.yrule) {                            // Bengali য় / Odia ୟ after a vowel
      for (i = 1; i < w.length; i++) {
        t = w[i]; p = w[i - 1];
        if (isC(t) && t.o === 0x2F && !t.nk && p && p.k !== 'C') { if (d.yrule === 'orya') { w[i] = { k: 'C', ch: 'ୟ' }; } else t.nk = true; }
      }
    }
    var last = w[w.length - 1], before = w[w.length - 2];
    if (isC(last) && !last.nk && before && (before.k === 'V' || before.k === 'S')) {
      if (d.chillu && d.chillu[last.o]) w[w.length - 1] = { k: 'C', ch: d.chillu[last.o], dead: true };
      else if (d.finalM && last.o === 0x2E) w[w.length - 1] = { k: 'S', s: 'anus' };
    }
    return w;
  }

  /* ------------------------------------------------------------ render a word (Brahmic) */
  function render(w, sc) {
    var d = SC[sc], out = '', st = 'start', lastV = null, lastInd = false, vir = chr(sc, SIGN.virama);
    for (var i = 0; i < w.length; i++) {
      var t = w[i];
      if (t.k === 'C') {
        // Punjabi writes only ਰ ਹ ਵ (and ਯ) as joined letters; other clusters are written side by side (ਗੁਰਮੁਖੀ)
        if (st === 'C' && !(sc === 'guru' && !(t.o === 0x30 || t.o === 0x39 || t.o === 0x35 || t.o === 0x2F))) out += vir;
        out += t.ch || cons(sc, t.o, t.nk);
        st = t.dead ? 'V' : 'C';
      } else if (t.k === 'V') {
        if (st === 'C') { if (t.v !== 'a') out += chr(sc, VOW[t.v][1]); lastInd = false; }
        else { out += chr(sc, VOW[t.v][0]); lastInd = true; }
        lastV = t.v; st = 'V';
      } else if (t.k === 'M') {
        out += t.s; st = 'V';
      } else if (t.k === 'S') {
        if (t.s === 'virama') { if (st === 'C') out += vir; st = 'H'; continue; }
        if (t.s === 'zwnj' || t.s === 'zwj') { if (st === 'C') out += vir; out += t.s === 'zwnj' ? '\u200C' : '\u200D'; st = 'H'; continue; }
        if (st === 'C') { lastV = 'a'; lastInd = false; }
        if (t.s === 'addak') out += 'ੱ';
        else if (sc === 'guru' && (t.s === 'anus' || t.s === 'candra')) {
          var tip = lastInd ? /^(a|i|u)$/.test(lastV || '') : /^(a|i|u|uu)$/.test(lastV || 'a');
          if (st === 'start') tip = false;
          out += tip ? 'ੰ' : 'ਂ';
        } else out += chr(sc, SIGN[t.s]);
        st = 'V';
      }
    }
    if (st === 'C' && d.south) out += vir;
    return out;
  }

  /* ------------------------------------------------------------ Urdu (Perso-Arabic), best effort */
  var UR = { 0x15: 'ک', 0x16: 'کھ', 0x17: 'گ', 0x18: 'گھ', 0x19: 'ن', 0x1A: 'چ', 0x1B: 'چھ', 0x1C: 'ج', 0x1D: 'جھ', 0x1E: 'ن',
    0x1F: 'ٹ', 0x20: 'ٹھ', 0x21: 'ڈ', 0x22: 'ڈھ', 0x23: 'ن', 0x24: 'ت', 0x25: 'تھ', 0x26: 'د', 0x27: 'دھ', 0x28: 'ن', 0x29: 'ن',
    0x2A: 'پ', 0x2B: 'پھ', 0x2C: 'ب', 0x2D: 'بھ', 0x2E: 'م', 0x2F: 'ی', 0x30: 'ر', 0x31: 'ر', 0x32: 'ل', 0x33: 'ل', 0x34: 'ل',
    0x35: 'و', 0x36: 'ش', 0x37: 'ش', 0x38: 'س', 0x39: 'ہ' };
  var URN = { 0x15: 'ق', 0x16: 'خ', 0x17: 'غ', 0x1C: 'ز', 0x2B: 'ف', 0x21: 'ڑ', 0x22: 'ڑھ' };
  function renderUrdu(w) {
    var out = '', prev = null;
    for (var i = 0; i < w.length; i++) {
      var t = w[i], fin = !w.slice(i + 1).some(function (x) { return x.k === 'C' || x.k === 'V'; }), start = !prev;
      if (t.k === 'C') {
        var c = t.ch || (t.nk && URN[t.o]) || UR[t.o] || '';
        if (prev && prev.k === 'C' && prev.o === t.o && prev.nk === t.nk) { prev = t; continue; }   // doubled letter: written once
        if (t.o === 0x28 && fin && prev && prev.k === 'V' && prev.v === 'ai') c = 'ں';
        out += c; prev = t;
      } else if (t.k === 'V') {
        var v = t.v, s;
        if (start) s = { a: 'ا', aa: 'آ', i: 'ا', ii: 'ای', u: 'ا', uu: 'او', e: 'ای', es: 'ای', ai: fin ? 'اے' : 'ای', o: 'او', os: 'او', au: 'او', aw: 'او', R: 'رِ', RR: 'رِ', lR: 'ل' }[v];
        else if (prev.k === 'V') s = { a: 'ا', aa: 'ا', i: fin ? 'ئی' : 'ئ', ii: 'ئی', u: 'ؤ', uu: 'ؤ', e: 'ئے', es: 'ئے', ai: 'ئے', o: 'ؤ', os: 'ؤ', au: 'ؤ', aw: 'ؤ', R: 'رِ', RR: 'رِ', lR: 'ل' }[v];
        else s = { a: fin ? 'ا' : '', aa: 'ا', i: fin ? 'ی' : '', ii: 'ی', u: fin ? 'و' : '', uu: 'و', e: fin ? 'ے' : 'ی', es: fin ? 'ے' : 'ی', ai: fin ? 'ے' : 'ی', o: 'و', os: 'و', au: 'و', aw: 'و', R: 'رِ', RR: 'رِ', lR: 'ل' }[v];
        out += s || ''; prev = t;
      } else if (t.k === 'S') {
        if (t.s === 'anus' || t.s === 'candra') out += fin ? 'ں' : 'ن';
        else if (t.s === 'visarga') out += 'ہ';
        if (t.s !== 'virama') prev = prev || t;
      } else if (t.k === 'M') out += t.s;
    }
    return out;
  }

  /* ------------------------------------------------------------ public */
  var DIG = '0123456789', UR_P = { ',': '،', '?': '؟', '.': '۔', ';': '؛' };
  function digit(sc, c) { return sc === 'arab' ? String.fromCharCode(0x06F0 + DIG.indexOf(c)) : chr(sc, 0x66 + DIG.indexOf(c)); }
  /* convert(text, lang, {smart, capfix, digits}) -> Unicode string (NFC) */
  function convert(text, lang, opts) {
    opts = opts || {};
    if (!LANGS[lang]) lang = 'hi';
    var sc = LANGS[lang].sc, toks = tokenize(String(text || ''), lang, opts), out = '', word = [];
    function flush() {
      if (!word.length) return;
      out += sc === 'arab' ? renderUrdu(rules(word, 'deva')) : render(rules(word, sc), sc);
      word = [];
    }
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.k !== 'X') { word.push(t); continue; }
      flush();
      var s = t.s;
      if (!t.raw && !t.word) {
        if (opts.digits && /[0-9]/.test(s)) s = digit(sc, s);
        else if (sc === 'arab' && UR_P[s] && !((s === ',' || s === '.') && /[0-9]/.test(text[t.at - 1] || '') && /[0-9]/.test(text[t.at + 1] || ''))) s = UR_P[s];
      }
      out += s;
    }
    flush();
    return out.normalize('NFC');
  }

  window.ITYPE = { LANGS: LANGS, ORDER: ORDER, convert: convert, table: table, tokenize: tokenize, chr: chr, cons: cons };
})();
