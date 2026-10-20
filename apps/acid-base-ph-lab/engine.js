/* Acids, Bases & pH Lab: data + chemistry maths (no DOM). window.PHLAB
   Everything here is language-independent; names and sentences live in strings.js / content.js.
   Facts follow NCERT Class 7 (Ch 5 Acids, Bases and Salts) and Class 10 (Ch 2 Acids, Bases and Salts). */
(function () {
  'use strict';
  var KW = 1e-14;                    /* ionic product of water at 25 °C */

  /* 24 everyday substances with an approximate pH (the values in the spec). emoji = icon on the chip. */
  var SUBS = [
    { id: 'hcl', ph: 1, emoji: '⚗️', group: 'lab' },
    { id: 'gastric', ph: 1.2, emoji: '🫄', group: 'body' },
    { id: 'lemon', ph: 2, emoji: '🍋', group: 'food' },
    { id: 'softdrink', ph: 2.5, emoji: '🥤', group: 'food' },
    { id: 'vinegar', ph: 3, emoji: '🫙', group: 'food' },
    { id: 'tomato', ph: 4.2, emoji: '🍅', group: 'food' },
    { id: 'curd', ph: 4.5, emoji: '🥣', group: 'food' },
    { id: 'coffee', ph: 5, emoji: '☕', group: 'food' },
    { id: 'tea', ph: 5.5, emoji: '🍵', group: 'food' },
    { id: 'rain', ph: 5.6, emoji: '🌧️', group: 'nature' },
    { id: 'milk', ph: 6.5, emoji: '🥛', group: 'food' },
    { id: 'saliva', ph: 6.8, emoji: '👄', group: 'body' },
    { id: 'water', ph: 7, emoji: '💧', group: 'nature' },
    { id: 'blood', ph: 7.4, emoji: '🩸', group: 'body' },
    { id: 'seawater', ph: 8, emoji: '🌊', group: 'nature' },
    { id: 'bakingsoda', ph: 8.5, emoji: '🥄', group: 'home' },
    { id: 'toothpaste', ph: 9, emoji: '🪥', group: 'home' },
    { id: 'antacid', ph: 9.5, emoji: '💊', group: 'home' },
    { id: 'soap', ph: 10, emoji: '🧼', group: 'home' },
    { id: 'magnesia', ph: 10.5, emoji: '🍶', group: 'home' },
    { id: 'ammonia', ph: 11.5, emoji: '🧴', group: 'home' },
    { id: 'limewater', ph: 12.4, emoji: '🧪', group: 'lab' },
    { id: 'bleach', ph: 12.5, emoji: '🧺', group: 'home' },
    { id: 'naoh', ph: 14, emoji: '⚗️', group: 'lab' }
  ];
  var SUB_BY = {};
  SUBS.forEach(function (s) { SUB_BY[s.id] = s; });

  /* Universal indicator chart: one colour per whole pH value (0–14). */
  var UI_HEX = ['#b3001b', '#d0141f', '#e4361d', '#ef6e1b', '#f3a01f', '#f2cc23', '#cfd63e', '#3ea24a', '#1e9b86', '#1c7fc0', '#1f4fa6', '#3a3a9d', '#58308f', '#6b2078', '#4b1359'];
  var UI_NAME = ['red', 'red', 'red', 'orange', 'orange', 'yellow', 'yellow', 'green', 'blue_green', 'blue', 'blue', 'indigo', 'indigo', 'violet', 'violet'];
  var UI_LIGHT = ['#fff', '#fff', '#fff', '#fff', '#111', '#111', '#111', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff'];

  /* colour swatches used by the indicator results */
  var HEX = {
    red: '#d1292e', blue: '#2b5fb8', yellow: '#e8b824', pink: '#f06fb0', dark_pink: '#c2187a', light_pink: '#f4b6d2',
    colourless: '#dbe9f5', orange: '#f28c1e', green: '#3ea24a', reddish_brown: '#a4421a', blue_green: '#1e9b86',
    indigo: '#3a3a9d', violet: '#5b2a86', purple: '#7b4aa5'
  };

  /* Indicators: form = paper strip or a few drops of solution. The "why" sentence is in content.js. */
  var INDS = [
    { id: 'blue_litmus', form: 'paper', base: 'blue' },
    { id: 'red_litmus', form: 'paper', base: 'red' },
    { id: 'turmeric', form: 'paper', base: 'yellow' },
    { id: 'phenolphthalein', form: 'solution', base: 'colourless' },
    { id: 'methyl_orange', form: 'solution', base: 'orange' },
    { id: 'universal', form: 'solution', base: 'green' },
    { id: 'china_rose', form: 'solution', base: 'light_pink' }
  ];
  var IND_BY = {};
  INDS.forEach(function (i) { IND_BY[i.id] = i; });

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }

  function nature(ph) { return ph < 7 ? 'acidic' : ph > 7 ? 'basic' : 'neutral'; }
  /* how strongly acidic/basic the solution is (about the solution, not the chemical's class) */
  function strength(ph) {
    if (ph < 3) return 'strong_acid';
    if (ph < 7) return 'weak_acid';
    if (ph === 7) return 'neutral';
    if (ph <= 11) return 'weak_base';
    return 'strong_base';
  }
  function hConc(ph) { return Math.pow(10, -ph); }
  function ohConc(ph) { return Math.pow(10, ph - 14); }
  /* scientific parts: 10^-2.5 → { m: 3.16, e: -3 } ; exact powers of ten → m = 1 */
  function sci(x) {
    if (!(x > 0)) return { m: 0, e: 0 };
    var e = Math.floor(Math.log10(x) + 1e-9), m = x / Math.pow(10, e);
    if (m >= 9.9995) { m = 1; e += 1; }
    return { m: Math.round(m * 100) / 100, e: e };
  }
  /* "a is N times more acidic than b" : each pH unit = 10 times the H+ concentration */
  function timesMoreAcidic(phA, phB) { return Math.pow(10, phB - phA); }
  function timesMoreBasic(phA, phB) { return Math.pow(10, phA - phB); }
  /* comparisons shown for one substance: pure water, the nearest neighbours, and the far end of the scale */
  function comparisons(id) {
    var s = SUB_BY[id]; if (!s) return [];
    var out = [], seen = {};
    function add(other, kind) {
      if (!other || other.id === s.id || seen[other.id]) return;
      var f = kind === 'acidic' ? timesMoreAcidic(s.ph, other.ph) : timesMoreBasic(s.ph, other.ph);
      if (f <= 1.0001) return;
      seen[other.id] = 1;
      out.push({ id: other.id, ph: other.ph, kind: kind, factor: f, exact: Math.abs(Math.log10(f) - Math.round(Math.log10(f))) < 1e-9 });
    }
    var n = nature(s.ph);
    if (n === 'acidic') {
      /* neighbour that is exactly or nearly one pH unit higher, then water, then the mildest acid */
      var one = SUBS.filter(function (o) { return o.ph > s.ph && o.ph < 7 && Math.abs(o.ph - s.ph - 1) < 0.35; }).sort(function (a, b) { return Math.abs(a.ph - s.ph - 1) - Math.abs(b.ph - s.ph - 1); })[0];
      add(one, 'acidic');
      var next = SUBS.filter(function (o) { return o.ph > s.ph && o.ph < 7; })[0];
      add(next, 'acidic');
      add(SUB_BY.water, 'acidic');
    } else if (n === 'basic') {
      var oneB = SUBS.filter(function (o) { return o.ph < s.ph && o.ph > 7 && Math.abs(s.ph - o.ph - 1) < 0.35; }).sort(function (a, b) { return Math.abs(s.ph - a.ph - 1) - Math.abs(s.ph - b.ph - 1); })[0];
      add(oneB, 'basic');
      var prev = SUBS.filter(function (o) { return o.ph < s.ph && o.ph > 7; }).slice(-1)[0];
      add(prev, 'basic');
      add(SUB_BY.water, 'basic');
    } else {
      add(SUB_BY.lemon, 'basic');      /* water is 100000 times less acidic than lemon → shown as "more basic than lemon" */
      add(SUB_BY.naoh, 'acidic');
    }
    return out.slice(0, 3);
  }

  /* universal indicator colour for any pH */
  function uiColor(ph) {
    var i = clamp(Math.round(num(ph, 7)), 0, 14);
    return { ph: i, key: UI_NAME[i], hex: UI_HEX[i], ink: UI_LIGHT[i] };
  }

  /* What an indicator shows at this pH.
     change: 'yes' | 'no' | 'faint' (near the edge of its range the change is only slight) */
  function indicate(indId, ph) {
    ph = num(ph, 7);
    var ind = IND_BY[indId]; if (!ind) return null;
    var r = { id: indId, form: ind.form, change: 'no', color: ind.base };
    switch (indId) {
      case 'blue_litmus':
        if (ph <= 5.5) { r.color = 'red'; r.change = 'yes'; }
        else if (ph < 7) { r.color = 'red'; r.change = 'faint'; }
        break;
      case 'red_litmus':
        if (ph >= 8.5) { r.color = 'blue'; r.change = 'yes'; }
        else if (ph > 7) { r.color = 'blue'; r.change = 'faint'; }
        break;
      case 'turmeric':
        if (ph >= 8.5) { r.color = 'reddish_brown'; r.change = 'yes'; }
        else if (ph >= 7.5) { r.color = 'reddish_brown'; r.change = 'faint'; }
        break;
      case 'phenolphthalein':
        if (ph >= 10) { r.color = 'dark_pink'; r.change = 'yes'; }
        else if (ph >= 8.2) { r.color = 'pink'; r.change = 'yes'; }
        break;
      case 'methyl_orange':
        if (ph < 3.1) { r.color = 'red'; r.change = 'yes'; }
        else if (ph <= 4.4) { r.color = 'orange'; r.change = 'no'; }
        else { r.color = 'yellow'; r.change = 'yes'; }
        break;
      case 'universal':
        var u = uiColor(ph); r.color = u.key; r.hex = u.hex; r.change = u.key === 'green' ? 'no' : 'yes';
        break;
      case 'china_rose':
        if (ph < 6.5) { r.color = 'dark_pink'; r.change = 'yes'; }
        else if (ph > 7.5) { r.color = 'green'; r.change = 'yes'; }
        break;
    }
    if (!r.hex) r.hex = HEX[r.color] || '#999';
    return r;
  }

  /* ---------------- neutralisation: strong acid (HCl) in the flask, strong base (NaOH) from the burette ----------
     va, vb in mL; ca, cb in mol/L.  n = c·V/1000.  Excess H+ (or OH−) spread over the total volume. */
  function titration(va, ca, vb, cb) {
    va = Math.max(0, num(va, 25)); ca = Math.max(0, num(ca, 0.1)); vb = Math.max(0, num(vb, 0)); cb = Math.max(0, num(cb, 0.1));
    var nA = ca * va / 1000, nB = cb * vb / 1000, vTot = (va + vb) / 1000;
    var d = vTot > 0 ? (nA - nB) / vTot : 0;        /* mol/L of excess H+ (negative = excess OH−) */
    var h, oh, kind;
    if (Math.abs(d) < 1e-15) { h = Math.sqrt(KW); kind = 'equal'; }
    else if (d > 0) { h = (d + Math.sqrt(d * d + 4 * KW)) / 2; kind = 'acid'; }
    else { oh = (-d + Math.sqrt(d * d + 4 * KW)) / 2; h = KW / oh; kind = 'base'; }
    oh = KW / h;
    var ph = clamp(-Math.log10(h), 0, 14);
    return { va: va, ca: ca, vb: vb, cb: cb, nA: nA, nB: nB, vTot: vTot, excess: Math.abs(nA - nB), conc: Math.abs(d), h: h, oh: oh, ph: ph, kind: kind,
      vEq: cb > 0 ? ca * va / cb : Infinity };
  }
  function curve(va, ca, cb, vMax, steps) {
    var pts = [], n = steps || 400;
    for (var i = 0; i <= n; i++) { var vb = vMax * i / n; pts.push({ vb: vb, ph: titration(va, ca, vb, cb).ph }); }
    return pts;
  }

  /* ---------------- salts: "the strong parent wins" ---------------- */
  var SALTS = [
    { id: 'nacl', formula: 'NaCl', acid: 'HCl', base: 'NaOH', acidStrong: true, baseStrong: true },
    { id: 'na2co3', formula: 'Na₂CO₃', acid: 'H₂CO₃', base: 'NaOH', acidStrong: false, baseStrong: true },
    { id: 'nh4cl', formula: 'NH₄Cl', acid: 'HCl', base: 'NH₄OH', acidStrong: true, baseStrong: false },
    { id: 'ch3coona', formula: 'CH₃COONa', acid: 'CH₃COOH', base: 'NaOH', acidStrong: false, baseStrong: true },
    { id: 'nahco3', formula: 'NaHCO₃', acid: 'H₂CO₃', base: 'NaOH', acidStrong: false, baseStrong: true },
    { id: 'kno3', formula: 'KNO₃', acid: 'HNO₃', base: 'KOH', acidStrong: true, baseStrong: true },
    { id: 'cuso4', formula: 'CuSO₄', acid: 'H₂SO₄', base: 'Cu(OH)₂', acidStrong: true, baseStrong: false },
    { id: 'nh4no3', formula: 'NH₄NO₃', acid: 'HNO₃', base: 'NH₄OH', acidStrong: true, baseStrong: false }
  ];
  function saltNature(s) { return s.acidStrong === s.baseStrong ? 'neutral' : s.acidStrong ? 'acidic' : 'basic'; }
  SALTS.forEach(function (s) { s.nature = saltNature(s); });
  /* uses of common salts (Class 10) : text in content.js */
  var USES = [
    { id: 'common_salt', formula: 'NaCl', emoji: '🧂' },
    { id: 'washing_soda', formula: 'Na₂CO₃·10H₂O', emoji: '🧺' },
    { id: 'baking_soda', formula: 'NaHCO₃', emoji: '🧁' },
    { id: 'bleaching_powder', formula: 'CaOCl₂', emoji: '🧴' },
    { id: 'plaster_of_paris', formula: 'CaSO₄·½H₂O', emoji: '🦴' }
  ];

  /* quiz: ids + index of the correct option (texts in content.js, same order) */
  var QUIZ = [
    { id: 'litmus', correct: 1 }, { id: 'neutral', correct: 1 }, { id: 'more_acidic', correct: 0 }, { id: 'tenfold', correct: 1 },
    { id: 'phenol', correct: 1 }, { id: 'turmeric', correct: 2 }, { id: 'tooth', correct: 0 }, { id: 'acid_rain', correct: 1 },
    { id: 'antacid', correct: 1 }, { id: 'bee', correct: 2 }, { id: 'nacl', correct: 2 }, { id: 'nh4cl', correct: 0 },
    { id: 'neutralisation', correct: 0 }, { id: 'pop', correct: 1 }, { id: 'universal', correct: 1 }
  ];

  /* the colour game: 10 random whole-number pH values, never the same twice in a row */
  function gameRounds(n, rnd) {
    rnd = rnd || Math.random;
    var out = [], last = -1;
    for (var i = 0; i < (n || 10); i++) {
      var p = Math.floor(rnd() * 15), tries = 0;
      while (p === last && tries++ < 20) p = Math.floor(rnd() * 15);
      if (p === last) p = (p + 1) % 15;
      out.push(p); last = p;
    }
    return out;
  }

  window.PHLAB = {
    KW: KW, SUBS: SUBS, SUB_BY: SUB_BY, INDS: INDS, IND_BY: IND_BY, UI_HEX: UI_HEX, UI_NAME: UI_NAME, HEX: HEX,
    SALTS: SALTS, USES: USES, QUIZ: QUIZ,
    nature: nature, strength: strength, hConc: hConc, ohConc: ohConc, sci: sci,
    timesMoreAcidic: timesMoreAcidic, timesMoreBasic: timesMoreBasic, comparisons: comparisons,
    uiColor: uiColor, indicate: indicate, titration: titration, curve: curve, saltNature: saltNature, gameRounds: gameRounds
  };
})();
