/* Probability Lab: experimental vs theoretical probability.
   Every experiment is described by a list of equally likely "elementary" outcomes with integer weights
   (coins: HT strings, dice: ordered pairs, spinner: equal slices, bag: balls / ordered pairs of balls,
   cards: 52 cards). Theory = favourable weight / total weight (exact fractions); trials sample the same list.
   Each trial stores one raw elementary outcome (0..63), so charts and events can be recomputed at any time. */
(function () {
  'use strict';
  var SLUG = 'probability-lab';
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, el = EDU.el;
  var MAX_TRIALS = 100000;
  var RUNS = [1, 10, 100, 1000, 10000];
  var EXPS = ['coin', 'die', 'dice', 'spinner', 'bag', 'cards'];
  var ICONS = { coin: '🪙', die: '🎲', dice: '🎲', spinner: '🎡', bag: '👜', cards: '🃏' };
  var BALLS = [{ k: 'col_red', c: '#e03131' }, { k: 'col_blue', c: '#1c7ed6' }, { k: 'col_green', c: '#2f9e44' }, { k: 'col_yellow', c: '#f2b705' }];
  var SPIN_COLS = [['col_red', '#e03131'], ['col_blue', '#1c7ed6'], ['col_green', '#2f9e44'], ['col_yellow', '#f2b705'],
    ['col_orange', '#f76707'], ['col_purple', '#7048e8'], ['col_pink', '#e64980'], ['col_brown', '#8d5524']];
  var SUITS = [{ k: 'suit_s', s: '♠', red: false }, { k: 'suit_h', s: '♥', red: true }, { k: 'suit_d', s: '♦', red: true }, { k: 'suit_c', s: '♣', red: false }];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var RANK_KEY = { 0: 'rank_a', 10: 'rank_j', 11: 'rank_q', 12: 'rank_k' };
  var CARD_RED = '#d0021b', CARD_BLACK = '#1b1b1b';
  var reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- small maths helpers ---------------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var r = a % b; a = b; b = r; } return a || 1; }
  function popcount(x) { var c = 0; while (x) { c += x & 1; x >>= 1; } return c; }
  function isPrime(n) { if (n < 2) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
  function range(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; }
  function fmtN(n) { return EDU.fmt(n); }
  function fmtDec(v) { return EDU.fmt(v, { maximumFractionDigits: 4 }); }
  function fmtPct(v) { return EDU.fmt(v * 100, { maximumFractionDigits: 2 }) + '%'; }
  function exact4(v) { return Math.abs(Math.round(v * 1e4) / 1e4 - v) < 1e-12; }
  function iso(s) { return '\u2066' + s + '\u2069'; }   /* keep numbers/maths left-to-right inside Urdu sentences */
  function signed(v) { var s = fmtDec(Math.abs(v)); return (v > 0 ? '+' : v < 0 ? '−' : '') + s; }

  /* ---------------- state ---------------- */
  function defaults() {
    return {
      v: 1, exp: 'coin', anim: true,
      coin: { n: 2, ev: ['1', '2'], preset: 'atleast1' },
      die: { ev: ['2', '4', '6'], preset: 'even' },
      dice: { ev: ['7'], preset: 'sum7' },
      spinner: {
        sectors: [{ id: 1, lk: 'col_red', label: '', size: 3, color: '#e03131' }, { id: 2, lk: 'col_blue', label: '', size: 2, color: '#1c7ed6' },
          { id: 3, lk: 'col_green', label: '', size: 1, color: '#2f9e44' }],
        nextId: 4, ev: ['s1'], preset: ''
      },
      bag: { counts: [5, 3, 2, 0], draws: 1, rep: true, ev: ['c0'], preset: '' },
      cards: { view: 'suit', s: [1], r: range(0, 12), preset: 'heart' }
    };
  }
  function isInt(v, lo, hi) { return typeof v === 'number' && Math.floor(v) === v && v >= lo && v <= hi; }
  function strArr(a) { return Array.isArray(a) && a.every(function (x) { return typeof x === 'string'; }); }
  function load() {
    var d = defaults(), s = store.get('state', null);
    if (!s || s.v !== 1) return d;
    try {
      if (EXPS.indexOf(s.exp) >= 0) d.exp = s.exp;
      d.anim = s.anim !== false;
      if (s.coin && isInt(s.coin.n, 1, 3)) d.coin.n = s.coin.n;
      ['coin', 'die', 'dice', 'spinner', 'bag'].forEach(function (id) {
        if (s[id] && strArr(s[id].ev)) { d[id].ev = s[id].ev; d[id].preset = typeof s[id].preset === 'string' ? s[id].preset : ''; }
      });
      var sp = s.spinner;
      if (sp && Array.isArray(sp.sectors) && sp.sectors.length >= 2 && sp.sectors.length <= 8 && sp.sectors.every(function (x) {
        return x && isInt(x.id, 1, 1e6) && isInt(x.size, 1, 20) && /^#[0-9a-f]{6}$/i.test(x.color) && typeof x.label === 'string';
      })) {
        d.spinner.sectors = sp.sectors.map(function (x) {
          return { id: x.id, lk: typeof x.lk === 'string' && /^col_\w+$/.test(x.lk) ? x.lk : '', label: x.label.slice(0, 24), size: x.size, color: x.color };
        });
        d.spinner.nextId = Math.max.apply(null, d.spinner.sectors.map(function (x) { return x.id; })) + 1;
      }
      var b = s.bag;
      if (b && Array.isArray(b.counts) && b.counts.length === 4 && b.counts.every(function (c) { return isInt(c, 0, 20); })) d.bag.counts = b.counts;
      if (b && (b.draws === 1 || b.draws === 2)) d.bag.draws = b.draws;
      if (b) d.bag.rep = b.rep !== false;
      var c = s.cards;
      if (c) {
        if (['suit', 'colour', 'rank'].indexOf(c.view) >= 0) d.cards.view = c.view;
        if (Array.isArray(c.s) && c.s.every(function (x) { return isInt(x, 0, 3); })) d.cards.s = c.s;
        if (Array.isArray(c.r) && c.r.every(function (x) { return isInt(x, 0, 12); })) d.cards.r = c.r;
        d.cards.preset = typeof c.preset === 'string' ? c.preset : '';
      }
    } catch (e) { return defaults(); }
    return d;
  }
  var S = load();

  /* trial records: one Uint8Array per experiment (raw elementary outcome per trial) */
  var seqs = {};
  EXPS.forEach(function (id) { seqs[id] = { buf: new Uint8Array(1024), len: 0, counts: new Int32Array(64), dirty: false }; });
  function pushRaw(id, raw) {
    var q = seqs[id];
    if (q.len >= q.buf.length) { var nb = new Uint8Array(Math.min(MAX_TRIALS, q.buf.length * 4)); nb.set(q.buf); q.buf = nb; }
    q.buf[q.len++] = raw; q.counts[raw]++; q.dirty = true;
  }
  function clearSeq(id) { var q = seqs[id]; q.buf = new Uint8Array(1024); q.len = 0; q.counts = new Int32Array(64); q.dirty = true; }
  function encodeSeq(q) {
    var parts = [], CH = 8192;
    for (var i = 0; i < q.len; i += CH) {
      var a = q.buf.subarray(i, Math.min(q.len, i + CH)), s = '';
      for (var j = 0; j < a.length; j++) s += String.fromCharCode(48 + a[j]);
      parts.push(s);
    }
    return parts.join('');
  }
  function loadSeqs() {
    EXPS.forEach(function (id) {
      var s = store.get('seq_' + id, '');
      if (typeof s !== 'string' || !s) return;
      var m = model(id), ok = {};
      m.elem.forEach(function (e) { if (e.w > 0) ok[e.raw] = 1; });
      if (m.invalid) return;
      var n = Math.min(s.length, MAX_TRIALS);
      for (var i = 0; i < n; i++) {
        var raw = s.charCodeAt(i) - 48;
        if (!ok[raw]) { clearSeq(id); seqs[id].dirty = false; return; }   /* stale data from another set-up: drop it */
        pushRaw(id, raw);
      }
      seqs[id].dirty = false;
    });
  }
  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      store.set('state', S);
      EXPS.forEach(function (id) {
        var q = seqs[id];
        if (!q.dirty) return;
        q.dirty = false;
        if (q.len) store.set('seq_' + id, encodeSeq(q)); else store.remove('seq_' + id);
      });
    }, 250);
  }

  /* ---------------- experiment models ---------------- */
  function colName(i) { return t(BALLS[i].k); }
  function sectorName(sec) { return sec.label.trim() || (sec.lk ? t(sec.lk) : '?'); }
  function rankName(r) { return RANK_KEY[r] ? t(RANK_KEY[r]) : RANKS[r]; }

  /* model(id) → { cats:[{key,label,short,sw,color}], elem:[{raw,w}], D, keyOf(raw), catIdx(raw), axis, space, invalid } */
  function model(id) {
    var m = { id: id, cats: [], elem: [], D: 0, invalid: '' }, c = S[id];
    if (id === 'coin') {
      var n = c.n;
      for (var raw = 0; raw < (1 << n); raw++) m.elem.push({ raw: raw, w: 1 });
      (n === 1 ? [1, 0] : range(0, n)).forEach(function (k) {
        m.cats.push({ key: String(k), label: n === 1 ? t(k ? 'heads' : 'tails') : t('heads_n', { n: k }), short: n === 1 ? t(k ? 'h_short' : 't_short') : String(k) });
      });
      m.keyOf = function (r) { return String(popcount(r)); };
      m.axis = 'axis_coin';
      var list = m.elem.map(function (e) { return coinFaces(e.raw, n).join(n > 1 && !singleLetters() ? '-' : ''); });
      m.space = t('sp_coin', { d: fmtN(1 << n), list: list.join(', ') });
    } else if (id === 'die') {
      range(0, 5).forEach(function (r) { m.elem.push({ raw: r, w: 1 }); m.cats.push({ key: String(r + 1), label: String(r + 1), short: String(r + 1) }); });
      m.keyOf = function (r) { return String(r + 1); };
      m.axis = 'axis_die';
      m.space = t('sp_die', { d: 6 });
    } else if (id === 'dice') {
      range(0, 35).forEach(function (r) { m.elem.push({ raw: r, w: 1 }); });
      range(2, 12).forEach(function (s) { m.cats.push({ key: String(s), label: t('sum_n', { n: s }), short: String(s) }); });
      m.keyOf = function (r) { return String(Math.floor(r / 6) + (r % 6) + 2); };
      m.axis = 'axis_dice';
      m.space = t('sp_dice', { d: 36 });
    } else if (id === 'spinner') {
      c.sectors.forEach(function (sec, i) {
        m.elem.push({ raw: i, w: sec.size });
        m.cats.push({ key: 's' + sec.id, label: sectorName(sec), short: sectorName(sec), sw: [sec.color], user: !!sec.label.trim() });
      });
      m.keyOf = function (r) { return c.sectors[r] ? 's' + c.sectors[r].id : ''; };
      m.axis = 'axis_spinner';
    } else if (id === 'bag') {
      var cn = c.counts, N = cn[0] + cn[1] + cn[2] + cn[3];
      if (c.draws === 1) {
        cn.forEach(function (k, i) { if (k > 0) { m.elem.push({ raw: i, w: k }); m.cats.push({ key: 'c' + i, label: colName(i), short: '', sw: [BALLS[i].c] }); } });
        m.keyOf = function (r) { return 'c' + r; };
        m.axis = 'axis_bag1';
        if (N < 1) m.invalid = t('bag_need', { n: 1 });
        m.space = t('sp_bag1', { d: fmtN(N) });
      } else {
        for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
          var w = c.rep ? cn[i] * cn[j] : (i === j ? cn[i] * (cn[i] - 1) : cn[i] * cn[j]);
          if (w > 0) m.elem.push({ raw: i * 4 + j, w: w });
        }
        for (i = 0; i < 4; i++) for (j = i; j < 4; j++) {
          var has = m.elem.some(function (e) { return pairKey(e.raw) === 'p' + i + '-' + j; });
          if (has) m.cats.push({ key: 'p' + i + '-' + j, label: colName(i) + ' + ' + colName(j), short: '', sw: [BALLS[i].c, BALLS[j].c] });
        }
        m.keyOf = pairKey;
        m.axis = 'axis_bag2';
        var need = c.rep ? 1 : 2;
        if (N < need) m.invalid = t('bag_need', { n: need });
        m.space = t('sp_bag2', { n: fmtN(N), m: fmtN(c.rep ? N : N - 1), d: fmtN(c.rep ? N * N : N * (N - 1)) });
      }
    } else if (id === 'cards') {
      range(0, 51).forEach(function (r) { m.elem.push({ raw: r, w: 1 }); });
      if (c.view === 'suit') {
        SUITS.forEach(function (s, i) { m.cats.push({ key: 's' + i, label: s.s + ' ' + t(s.k), short: s.s, color: s.red ? CARD_RED : '' }); });
        m.keyOf = function (r) { return 's' + Math.floor(r / 13); };
      } else if (c.view === 'colour') {
        m.cats.push({ key: 'red', label: t('card_red') + ' (♥ ♦)', short: t('card_red'), color: CARD_RED });
        m.cats.push({ key: 'black', label: t('card_black') + ' (♠ ♣)', short: t('card_black') });
        m.keyOf = function (r) { return SUITS[Math.floor(r / 13)].red ? 'red' : 'black'; };
      } else {
        RANKS.forEach(function (rk, i) { m.cats.push({ key: 'r' + i, label: RANK_KEY[i] ? rk + ' (' + t(RANK_KEY[i]) + ')' : rk, short: rk }); });
        m.keyOf = function (r) { return 'r' + (r % 13); };
      }
      m.axis = c.view === 'suit' ? 'view_suit' : c.view === 'colour' ? 'view_colour' : 'view_rank';
      m.space = t('sp_cards', { d: 52 });
    }
    m.elem = m.elem.filter(function (e) { return e.w > 0; });
    m.D = m.elem.reduce(function (a, e) { return a + e.w; }, 0);
    if (id === 'spinner') m.space = t('sp_spinner', { d: fmtN(m.D) });
    if (!m.D && !m.invalid) m.invalid = t('bag_need', { n: 1 });
    var idx = {};
    m.cats.forEach(function (ct, i) { idx[ct.key] = i; ct.w = 0; ct.raws = []; });
    m.catIdx = function (r) { var k = idx[m.keyOf(r)]; return k === undefined ? -1 : k; };
    m.elem.forEach(function (e) { var k = m.catIdx(e.raw); if (k >= 0) { m.cats[k].w += e.w; m.cats[k].raws.push(e.raw); } });
    /* event membership of each raw outcome */
    m.inEv = new Uint8Array(64);
    if (id === 'cards') {
      m.elem.forEach(function (e) { if (c.s.indexOf(Math.floor(e.raw / 13)) >= 0 && c.r.indexOf(e.raw % 13) >= 0) m.inEv[e.raw] = 1; });
    } else {
      var evs = {}; c.ev.forEach(function (k) { evs[k] = 1; });
      m.elem.forEach(function (e) { if (evs[m.keyOf(e.raw)]) m.inEv[e.raw] = 1; });
    }
    m.fav = m.elem.reduce(function (a, e) { return a + (m.inEv[e.raw] ? e.w : 0); }, 0);
    m.cats.forEach(function (ct) { ct.inEv = ct.raws.length > 0 && ct.raws.every(function (r) { return m.inEv[r]; }); });
    return m;
  }
  function pairKey(r) { var i = Math.floor(r / 4), j = r % 4; return 'p' + Math.min(i, j) + '-' + Math.max(i, j); }
  function singleLetters() { return t('h_short').length === 1 && t('t_short').length === 1; }
  function coinFaces(raw, n) { var f = []; for (var i = 0; i < n; i++) f.push(t((raw >> i) & 1 ? 'h_short' : 't_short')); return f; }

  function sampler(m) {
    var cum = [], s = 0;
    m.elem.forEach(function (e) { s += e.w; cum.push(s); });
    return function () {
      var x = Math.random() * s;
      for (var i = 0; i < cum.length; i++) if (x < cum[i]) return m.elem[i].raw;
      return m.elem[m.elem.length - 1].raw;
    };
  }

  /* describe one raw outcome in words (for "Trial n: ...") */
  function describe(id, raw) {
    var c = S[id];
    if (id === 'coin') return coinFaces(raw, c.n).join(' ') + (c.n > 1 ? '  →  ' + t('heads_n', { n: popcount(raw) }) : '');
    if (id === 'die') return String(raw + 1);
    if (id === 'dice') { var a = Math.floor(raw / 6) + 1, b = raw % 6 + 1; return a + ' + ' + b + ' = ' + (a + b); }
    if (id === 'spinner') return c.sectors[raw] ? sectorName(c.sectors[raw]) : '';
    if (id === 'bag') return c.draws === 1 ? colName(raw) : colName(Math.floor(raw / 4)) + ', ' + colName(raw % 4);
    var su = SUITS[Math.floor(raw / 13)], rk = raw % 13;
    return RANKS[rk] + su.s + ' · ' + t('card_name', { r: rankName(rk), s: t(su.k) });
  }

  /* ---------------- quick events ---------------- */
  function presets(id) {
    var n = S.coin.n, keys = function (a) { return a.map(String); };
    if (id === 'coin') return n === 1 ? [] : [
      { id: 'atleast1', k: 'ev_atleast1', ev: keys(range(1, n)) }, { id: 'exactly1', k: 'ev_exactly1', ev: ['1'] },
      { id: 'allheads', k: 'ev_allheads', ev: [String(n)] }, { id: 'noheads', k: 'ev_noheads', ev: ['0'] }];
    if (id === 'die') return [
      { id: 'even', k: 'ev_even', ev: keys([2, 4, 6]) }, { id: 'odd', k: 'ev_odd', ev: keys([1, 3, 5]) },
      { id: 'prime', k: 'ev_prime', ev: keys([2, 3, 5]) }, { id: 'gt4', k: 'ev_gt4', ev: keys([5, 6]) }, { id: 'six', k: 'ev_six', ev: ['6'] }];
    if (id === 'dice') return [
      { id: 'sum7', k: 'ev_sum7', ev: ['7'] }, { id: 'sum_even', k: 'ev_sum_even', ev: keys([2, 4, 6, 8, 10, 12]) },
      { id: 'sum10', k: 'ev_sum10', ev: keys([10, 11, 12]) }, { id: 'sum_prime', k: 'ev_sum_prime', ev: keys(range(2, 12).filter(isPrime)) }];
    if (id === 'bag') {
      if (S.bag.draws === 1) return [];
      var same = [], diff = [];
      for (var i = 0; i < 4; i++) for (var j = i; j < 4; j++) (i === j ? same : diff).push('p' + i + '-' + j);
      return [{ id: 'same', k: 'ev_same', ev: same }, { id: 'diff', k: 'ev_diff', ev: diff }];
    }
    if (id === 'cards') {
      var all = range(0, 12), four = [0, 1, 2, 3];
      return [
        { id: 'heart', k: 'ev_heart', s: [1], r: all }, { id: 'redcard', k: 'ev_redcard', s: [1, 2], r: all },
        { id: 'face', k: 'ev_face', s: four, r: [10, 11, 12] }, { id: 'ace', k: 'ev_ace', s: four, r: [0] },
        { id: 'redface', k: 'ev_redface', s: [1, 2], r: [10, 11, 12] }];
    }
    return [];
  }
  function findPreset(id) { var p = presets(id).filter(function (x) { return x.id === S[id].preset; }); return p[0] || null; }
  function applyPreset(id, p) {
    if (id === 'cards') { S.cards.s = p.s.slice(); S.cards.r = p.r.slice(); }
    else S[id].ev = p.ev.slice();
    S[id].preset = p.id;
  }
  /* after a set-up change, keep the event valid for the new outcomes */
  function fixEv(id) {
    if (id === 'cards') return;
    var p = findPreset(id);
    if (p) { applyPreset(id, p); }
    else S[id].preset = '';
    var cats = model(id).cats, keys = {};
    cats.forEach(function (c) { keys[c.key] = 1; });
    S[id].ev = S[id].ev.filter(function (k) { return keys[k]; });
    if (!S[id].ev.length && cats.length) S[id].ev = [cats[0].key];   /* after a set-up change, never leave E empty */
  }

  /* ---------------- tabs ---------------- */
  function renderTabs() {
    var box = $('#tabs');
    box.innerHTML = '';
    EXPS.forEach(function (id) {
      box.appendChild(el('button', {
        type: 'button', role: 'tab', id: 'tab-' + id, 'aria-selected': S.exp === id ? 'true' : 'false', tabindex: S.exp === id ? '0' : '-1',
        onclick: function () { switchExp(id); }
      }, el('span', { class: 'ic', 'aria-hidden': 'true', text: ICONS[id] }), el('span', { text: t('exp_' + id) })));
    });
  }
  $('#tabs').addEventListener('keydown', function (e) {
    var i = EXPS.indexOf(S.exp), rtl = document.documentElement.dir === 'rtl', d = 0;
    if (e.key === 'ArrowRight') d = rtl ? -1 : 1; else if (e.key === 'ArrowLeft') d = rtl ? 1 : -1;
    else if (e.key === 'Home') d = -i; else if (e.key === 'End') d = EXPS.length - 1 - i; else return;
    e.preventDefault();
    var id = EXPS[(i + d + EXPS.length) % EXPS.length];
    switchExp(id);
    var b = $('#tab-' + id); if (b) b.focus();
  });
  function switchExp(id) {
    if (id === S.exp) return;
    stopAnim();
    S.exp = id; save();
    renderAll();
  }

  /* ---------------- set-up panel ---------------- */
  function seg(label, items, cur, onPick, idp) {
    var g = el('div', { class: 'seg', role: 'group', 'aria-label': label });
    items.forEach(function (it) {
      g.appendChild(el('button', { type: 'button', id: idp + it.v, 'aria-pressed': it.v === cur ? 'true' : 'false', text: it.text, onclick: function () { if (it.v !== cur) onPick(it.v); } }));
    });
    return g;
  }
  function dot(c, big) { return el('i', { class: 'dot' + (big ? ' big' : ''), style: { '--dot': c }, 'aria-hidden': 'true' }); }

  function changeConfig(fn) {
    var id = S.exp;
    if (seqs[id].len > 0 && !confirm(t('confirm_change'))) { renderSetup(); return false; }
    stopAnim();
    fn();
    clearSeq(id);
    fixEv(id);
    save();
    renderAll();
    return true;
  }

  function renderSetup() {
    var box = $('#setup'), id = S.exp, c = S[id];
    box.innerHTML = '';
    if (id === 'coin') {
      box.appendChild(el('div', { class: 'pl-sub mt0', text: t('coins_n') }));
      box.appendChild(seg(t('coins_n'), [1, 2, 3].map(function (n) { return { v: n, text: String(n) }; }), c.n,
        function (n) { changeConfig(function () { S.coin.n = n; }); }, 'coin-n-'));
      box.appendChild(el('p', { class: 'muted small pl-note', text: t('coin_note') }));
    } else if (id === 'die') {
      box.appendChild(el('p', { class: 'muted small pl-note mt0', text: t('die_note') }));
    } else if (id === 'dice') {
      box.appendChild(el('p', { class: 'muted small pl-note mt0', text: t('dice_note') }));
    } else if (id === 'spinner') {
      renderSpinnerSetup(box, c);
    } else if (id === 'bag') {
      renderBagSetup(box, c);
    } else if (id === 'cards') {
      box.appendChild(el('p', { class: 'muted small pl-note mt0', text: t('cards_note') }));
      box.appendChild(el('div', { class: 'pl-sub', text: t('cards_view') }));
      box.appendChild(seg(t('cards_view'), [{ v: 'suit', text: t('view_suit') }, { v: 'colour', text: t('view_colour') }, { v: 'rank', text: t('view_rank') }], c.view,
        function (v) { S.cards.view = v; save(); renderSetup(); renderResults(); }, 'view-'));
    }
  }

  function renderSpinnerSetup(box, c) {
    var secs = c.sectors;
    box.appendChild(el('div', { class: 'pl-sec-head', 'aria-hidden': 'true' }, el('span'), el('span', { text: t('th_name') }), el('span', { text: t('th_size') }), el('span')));
    var list = el('div', { class: 'pl-sec-list' });
    secs.forEach(function (sec, i) {
      var col = el('input', { type: 'color', id: 'sec-col-' + i, value: sec.color, 'aria-label': t('spin_color', { n: i + 1 }) });
      col.addEventListener('input', function () { sec.color = col.value; save(); refreshLight(); });
      var name = el('input', { type: 'text', id: 'sec-name-' + i, class: 'no-i18n', value: sec.label, placeholder: sec.lk ? t(sec.lk) : '', maxlength: 24, autocomplete: 'off', 'aria-label': t('spin_name', { n: i + 1 }) });
      name.addEventListener('input', function () { sec.label = name.value.slice(0, 24); save(); refreshLight(); });
      var size = el('input', { type: 'number', id: 'sec-size-' + i, min: 1, max: 20, step: 1, inputmode: 'numeric', value: sec.size, 'aria-label': t('spin_size', { n: i + 1 }) });
      size.addEventListener('change', function () {
        var v = EDU.clamp(Math.round(Number(size.value)) || 1, 1, 20);
        if (v === sec.size) { size.value = v; return; }
        changeConfig(function () { sec.size = v; });
      });
      var del = el('button', { type: 'button', class: 'btn btn-ghost pl-iconbtn', id: 'sec-del-' + i, text: '✕', 'aria-label': t('spin_del', { n: i + 1 }), title: t('spin_del', { n: i + 1 }), disabled: secs.length <= 2,
        onclick: function () { changeConfig(function () { secs.splice(i, 1); }); } });
      list.appendChild(el('div', { class: 'pl-sec' }, col, name, size, del));
    });
    box.appendChild(list);
    box.appendChild(el('div', { class: 'row', style: { marginTop: '10px' } },
      el('button', { type: 'button', class: 'btn btn-sm', id: 'sec-add', disabled: secs.length >= 8, text: '+ ' + t('spin_add'),
        onclick: function () {
          changeConfig(function () {
            var used = secs.map(function (s) { return s.color.toLowerCase(); });
            var pickC = SPIN_COLS.filter(function (p) { return used.indexOf(p[1]) < 0; })[0] || SPIN_COLS[secs.length % 8];
            secs.push({ id: c.nextId++, lk: pickC[0], label: '', size: 1, color: pickC[1] });
          });
        } }),
      el('span', { class: 'muted tiny', text: t('spin_limit') })));
    box.appendChild(el('p', { class: 'muted small pl-note', text: t('spin_note') }));
  }

  function renderBagSetup(box, c) {
    box.appendChild(el('p', { class: 'muted small pl-note mt0', text: t('bag_note') }));
    var balls = el('div', { class: 'pl-balls', style: { marginTop: '10px' } });
    BALLS.forEach(function (b, i) {
      balls.appendChild(el('div', { class: 'pl-ball-row' },
        dot(b.c, true), el('span', { class: 'nm', text: colName(i) }),
        el('button', { type: 'button', class: 'btn', id: 'bag-minus-' + i, text: '−', 'aria-label': t('bag_less', { c: colName(i) }), disabled: c.counts[i] <= 0,
          onclick: function () { changeConfig(function () { c.counts[i] = Math.max(0, c.counts[i] - 1); }); } }),
        el('span', { class: 'ct', id: 'bag-count-' + i, text: String(c.counts[i]) }),
        el('button', { type: 'button', class: 'btn', id: 'bag-plus-' + i, text: '+', 'aria-label': t('bag_more', { c: colName(i) }), disabled: c.counts[i] >= 20,
          onclick: function () { changeConfig(function () { c.counts[i] = Math.min(20, c.counts[i] + 1); }); } })));
    });
    box.appendChild(balls);
    box.appendChild(el('div', { class: 'pl-sub', text: t('bag_draws') }));
    box.appendChild(seg(t('bag_draws'), [{ v: 1, text: t('draw1') }, { v: 2, text: t('draw2') }], c.draws,
      function (v) { changeConfig(function () { c.draws = v; }); }, 'bag-d'));
    if (c.draws === 2) {
      box.appendChild(el('div', { style: { marginTop: '8px' } }, seg(t('bag_draws'), [{ v: 'rep', text: t('with_rep') }, { v: 'norep', text: t('without_rep') }], c.rep ? 'rep' : 'norep',
        function (v) { changeConfig(function () { c.rep = v === 'rep'; }); }, 'bag-')));
      box.appendChild(el('p', { class: 'muted small pl-note', text: t(c.rep ? 'rep_with_note' : 'rep_without_note') }));
    }
    var m = curModel();
    if (m.invalid) box.appendChild(el('div', { class: 'callout warning pl-warn', role: 'alert', text: m.invalid }));
  }

  /* ---------------- event builder ---------------- */
  function chip(id, pressed, onclick, kids, extra) {
    var b = el('button', Object.assign({ type: 'button', class: 'chip', id: id, 'aria-pressed': pressed ? 'true' : 'false', onclick: onclick }, extra || {}));
    kids.forEach(function (k) { if (k) b.appendChild(k); });
    return b;
  }
  function renderEvent() {
    var box = $('#event-builder'), id = S.exp, c = S[id], m = curModel();
    box.innerHTML = '';
    if (id === 'cards') {
      var setS = function (a) { c.s = a; c.preset = ''; evChanged(); }, setR = function (a) { c.r = a; c.preset = ''; evChanged(); };
      box.appendChild(el('div', { class: 'pl-rowhead' }, el('div', { class: 'pl-sub', text: t('ev_suits') }),
        el('div', { class: 'row', style: { gap: '6px' } },
          el('button', { type: 'button', class: 'btn btn-sm', id: 'ev-s-all', text: t('ev_all'), onclick: function () { setS([0, 1, 2, 3]); } }),
          el('button', { type: 'button', class: 'btn btn-sm', id: 'ev-s-none', text: t('ev_none'), onclick: function () { setS([]); } }))));
      var sw = el('div', { class: 'pl-chips', role: 'group', 'aria-label': t('ev_suits') });
      SUITS.forEach(function (s, i) {
        var on = c.s.indexOf(i) >= 0;
        var b = chip('ev-suit-' + i, on, function () { setS(on ? c.s.filter(function (x) { return x !== i; }) : c.s.concat([i]).sort()); },
          [el('span', { class: 'sym', 'aria-hidden': 'true', text: s.s }), el('span', { text: t(s.k) })]);
        if (s.red) b.classList.add('red-suit');
        sw.appendChild(b);
      });
      box.appendChild(sw);
      box.appendChild(el('div', { class: 'pl-rowhead' }, el('div', { class: 'pl-sub', text: t('ev_ranks') }),
        el('div', { class: 'row', style: { gap: '6px' } },
          el('button', { type: 'button', class: 'btn btn-sm', id: 'ev-r-all', text: t('ev_all'), onclick: function () { setR(range(0, 12)); } }),
          el('button', { type: 'button', class: 'btn btn-sm', id: 'ev-r-none', text: t('ev_none'), onclick: function () { setR([]); } }))));
      var rw = el('div', { class: 'pl-chips', role: 'group', 'aria-label': t('ev_ranks') });
      RANKS.forEach(function (rk, i) {
        var on = c.r.indexOf(i) >= 0;
        rw.appendChild(chip('ev-rank-' + i, on, function () { setR(on ? c.r.filter(function (x) { return x !== i; }) : c.r.concat([i]).sort(function (a, b) { return a - b; })); },
          [el('span', { text: rk })], RANK_KEY[i] ? { title: t(RANK_KEY[i]), 'aria-label': rk + ' ' + t(RANK_KEY[i]) } : null));
      });
      box.appendChild(rw);
    } else {
      var g = el('div', { class: 'pl-chips', role: 'group', 'aria-label': t('event_h') });
      m.cats.forEach(function (ct) {
        var on = c.ev.indexOf(ct.key) >= 0;
        var kids = (ct.sw || []).map(function (col) { return dot(col); });
        kids.push(el('span', { text: ct.label, class: ct.user ? 'no-i18n' : null }));
        g.appendChild(chip('ev-' + ct.key, on, function () {
          c.ev = on ? c.ev.filter(function (k) { return k !== ct.key; }) : c.ev.concat([ct.key]);
          c.preset = '';
          evChanged();
        }, kids));
      });
      box.appendChild(g);
    }
    /* quick events */
    var pb = $('#presets'), ps = presets(id);
    pb.innerHTML = '';
    pb.hidden = !ps.length;
    if (ps.length) {
      pb.appendChild(el('span', { class: 'lbl', text: t('presets') }));
      ps.forEach(function (p) {
        pb.appendChild(el('button', { type: 'button', class: 'btn btn-sm', id: 'preset-' + p.id, 'aria-pressed': c.preset === p.id ? 'true' : 'false', text: t(p.k),
          onclick: function () { applyPreset(id, p); evChanged(); } }));
      });
    }
  }
  function evChanged() { save(); renderEvent(); renderResults(); }

  /* ---------------- results: P(E), table, recent ---------------- */
  function curModel() { return model(S.exp); }
  function frac(a, b) { return el('span', { class: 'frac', title: a + '/' + b }, el('span', { text: fmtN(a) }), el('span', { text: fmtN(b) })); }
  function fracText(a, b) {
    if (!b) return '—';
    var g = gcd(a, b), v = a / b;
    var f = a === 0 ? '0' : a === b ? '1' : fmtN(a / g) + '/' + fmtN(b / g);
    return (a === 0 || a === b) ? f : f + ' ' + (exact4(v) ? '=' : '≈') + ' ' + fmtDec(v);
  }
  function mathRow(items) {
    var d = el('div', { class: 'pl-math' });
    items.forEach(function (x) { if (x === null || x === undefined) return; d.appendChild(typeof x === 'string' ? el('span', { text: x }) : x); });
    return d;
  }
  function valueItems(a, b) {
    var v = a / b, out = [frac(a, b)], g = gcd(a, b);
    if (a !== 0 && a !== b && g > 1) out.push('=', frac(a / g, b / g));
    out.push(exact4(v) ? '=' : '≈', fmtDec(v));
    out.push(Math.abs(Math.round(v * 1e4) / 1e4 - v) < 1e-12 ? '=' : '≈', fmtPct(v));
    return out;
  }
  function cardsText() {
    var c = S.cards;
    var s = c.s.length === 4 ? t('any') : c.s.length ? c.s.map(function (i) { return SUITS[i].s; }).join(' ') : '—';
    var r = c.r.length === 13 ? t('any') : c.r.length ? c.r.map(function (i) { return RANKS[i]; }).join(' ') : '—';
    return t('ev_cards_desc', { s: iso(s), r: iso(r) });
  }
  function eventText(m) {
    var id = S.exp, c = S[id];
    if (id === 'cards') return 'E: ' + cardsText();
    var labs = m.cats.filter(function (ct) { return c.ev.indexOf(ct.key) >= 0; }).map(function (ct) { return ct.label; });
    return 'E = { ' + labs.join(', ') + ' }';
  }

  function renderPE(m, n, a) {
    var box = $('#pe'), id = S.exp, p = S[id].preset ? findPreset(id) : null;
    box.innerHTML = '';
    var desc = el('div', { class: 'pl-edesc', id: 'ev-desc' });
    if (p) desc.appendChild(el('div', { class: 'pl-epreset', text: t(p.k) }));
    var setRow = el('div', { class: 'pl-eset' }, el('span', { class: 'pl-eq', text: 'E =' }));
    if (id === 'cards') setRow.appendChild(el('span', { text: cardsText() }));
    else {
      var chosen = m.cats.filter(function (ct) { return S[id].ev.indexOf(ct.key) >= 0; });
      if (!chosen.length) setRow.appendChild(el('span', { class: 'pl-eq', text: '{ }' }));
      chosen.forEach(function (ct) {
        var s = el('span', { class: 'pl-rc in' + (ct.user ? ' no-i18n' : '') });
        (ct.sw || []).forEach(function (col) { s.appendChild(dot(col)); });
        s.appendChild(el('span', { class: ct.color ? 'red-ink' : null, text: ct.label }));
        setRow.appendChild(s);
      });
    }
    desc.appendChild(setRow);
    box.appendChild(desc);
    if (m.invalid) { box.appendChild(el('div', { class: 'callout warning', text: m.invalid })); return; }
    var g = gcd(m.fav, m.D);
    var th = el('div', { class: 'pl-pbox', id: 'pe-theory', dataset: { fav: m.fav, total: m.D, num: m.fav / g, den: m.D / g } },
      el('div', { class: 'lbl', text: t('p_theory') }),
      mathRow(['P(E) ='].concat(valueItems(m.fav, m.D))),
      el('p', { class: 'small', text: t('fav_of', { a: fmtN(m.fav), b: fmtN(m.D) }) }));
    var ex = el('div', { class: 'pl-pbox exp', id: 'pe-exp', dataset: { count: a, n: n } }, el('div', { class: 'lbl', text: t('p_exp') }));
    if (n) {
      ex.appendChild(mathRow(['P(E) ='].concat(valueItems(a, n))));
      ex.appendChild(el('p', { class: 'small', text: t('happened', { a: fmtN(a), b: fmtN(n) }) }));
    } else ex.appendChild(el('p', { class: 'small', style: { marginTop: '8px' }, text: t('run_first') }));
    box.appendChild(el('div', { class: 'pl-pgrid' }, th, ex));
    var extra = el('div', { class: 'pl-extra' });
    if (m.fav === 0) extra.appendChild(el('div', { class: 'callout warning small', text: t('ev_impossible') }));
    if (m.fav === m.D) extra.appendChild(el('div', { class: 'callout success small', text: t('ev_sure') }));
    if (n) extra.appendChild(el('p', { class: 'small', id: 'pe-diff', text: t('diff_line', { d: iso(signed(a / n - m.fav / m.D)) }) }));
    extra.appendChild(el('p', { class: 'small', text: t('p_not', { p: fracText(m.D - m.fav, m.D) }) }));
    extra.appendChild(el('p', { class: 'small muted', text: m.space || '' }));
    box.appendChild(extra);
  }

  function outcomeCell(ct) {
    var s = el('span', { class: 'pl-oc' + (ct.user ? ' no-i18n' : '') });
    (ct.sw || []).forEach(function (c) { s.appendChild(dot(c)); });
    s.appendChild(el('span', { class: ct.color ? 'red-ink' : null, text: ct.label }));
    return s;
  }
  function renderTable(m, cc, n, a) {
    var tb = $('#results');
    tb.innerHTML = '';
    var na = '—';
    tb.appendChild(el('thead', {}, el('tr', {},
      el('th', { scope: 'col', text: t('th_outcome') }), el('th', { scope: 'col', class: 'num', text: t('th_freq') }),
      el('th', { scope: 'col', class: 'num', text: t('th_exp') }), el('th', { scope: 'col', class: 'num', text: t('th_theory') }),
      el('th', { scope: 'col', class: 'num', text: t('th_diff') }))));
    var body = el('tbody', { id: 'results-body' });
    m.cats.forEach(function (ct, i) {
      var g = gcd(ct.w, m.D);
      body.appendChild(el('tr', { class: ct.inEv ? 'in' : null, dataset: { key: ct.key, count: cc[i], num: ct.w / g, den: m.D / g } },
        el('td', {}, outcomeCell(ct)),
        el('td', { class: 'num', text: fmtN(cc[i]) }),
        el('td', { class: 'num', text: n ? fmtDec(cc[i] / n) : na }),
        el('td', { class: 'num' }, el('span', { class: 'math', text: fracText(ct.w, m.D) })),
        el('td', { class: 'num', text: n ? signed(cc[i] / n - ct.w / m.D) : na })));
    });
    body.appendChild(el('tr', { class: 'tot', id: 'row-total', dataset: { count: n } },
      el('td', { text: t('total') }), el('td', { class: 'num', text: fmtN(n) }), el('td', { class: 'num', text: n ? '1' : na }),
      el('td', { class: 'num', text: m.D ? '1' : na }), el('td', { class: 'num', text: '' })));
    body.appendChild(el('tr', { class: 'ev', id: 'row-event', dataset: { count: a } },
      el('td', { text: t('row_event') }), el('td', { class: 'num', text: fmtN(a) }), el('td', { class: 'num', text: n ? fmtDec(a / n) : na }),
      el('td', { class: 'num' }, el('span', { class: 'math', text: fracText(m.fav, m.D) })),
      el('td', { class: 'num', text: n && m.D ? signed(a / n - m.fav / m.D) : na })));
    tb.appendChild(body);
  }

  function recentChip(id, raw, m) {
    var c = S[id], s = el('span', { class: 'pl-rc' + (m.inEv[raw] ? ' in' : '') });
    if (id === 'coin') s.textContent = coinFaces(raw, c.n).join(singleLetters() ? '' : ' ');
    else if (id === 'die') s.textContent = String(raw + 1);
    else if (id === 'dice') s.textContent = (Math.floor(raw / 6) + 1) + '+' + (raw % 6 + 1);
    else if (id === 'spinner') {
      var sec = c.sectors[raw];
      if (sec) { s.appendChild(dot(sec.color)); s.appendChild(el('span', { text: sectorName(sec).slice(0, 12) })); if (sec.label.trim()) s.classList.add('no-i18n'); }
    } else if (id === 'bag') {
      if (c.draws === 1) s.appendChild(dot(BALLS[raw].c)); else { s.appendChild(dot(BALLS[Math.floor(raw / 4)].c)); s.appendChild(dot(BALLS[raw % 4].c)); }
    } else {
      var su = SUITS[Math.floor(raw / 13)];
      s.textContent = RANKS[raw % 13] + su.s;
      if (su.red) s.classList.add('red-ink');
    }
    return s;
  }
  function renderLast(m, q) {
    var id = S.exp, n = q.len, last = $('#last'), rec = $('#recent');
    if (m.invalid) last.textContent = m.invalid;
    else if (!n) last.textContent = t('no_trials');
    else {
      last.textContent = t('last_result', { n: fmtN(n), r: describe(id, q.buf[n - 1]) });
      last.classList.toggle('no-i18n', id === 'spinner' && !!(S.spinner.sectors[q.buf[n - 1]] || { label: '' }).label.trim());
    }
    if (!n || m.invalid) last.classList.remove('no-i18n');
    rec.innerHTML = '';
    for (var i = n - 1; i >= Math.max(0, n - 12); i--) rec.appendChild(recentChip(id, q.buf[i], m));
  }

  function renderResults() {
    var id = S.exp, m = curModel(), q = seqs[id], n = q.len;
    var tr = $('#trials');
    tr.textContent = t('trials_n', { n: fmtN(n) });
    tr.dataset.n = n;
    var cc = m.cats.map(function (ct) { return ct.raws.reduce(function (a, r) { return a + q.counts[r]; }, 0); });
    var a = 0;
    m.elem.forEach(function (e) { if (m.inEv[e.raw]) a += q.counts[e.raw]; });
    renderLast(m, q);
    renderPE(m, n, a);
    renderTable(m, cc, n, a);
    drawBar(m, cc, n);
    drawLine(m, q);
    setRunDisabled();
    $('#print-head').textContent = t('print_title', { e: t('exp_' + id) }) + ' · ' + dateText();
  }
  function dateText() {
    try { return new Date().toLocaleDateString(EDU.langInfo(EDU.lang).tag, { numberingSystem: 'latn', day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  /* label / colour edits on the spinner: no reset, just redraw */
  function refreshLight() { renderEvent(); renderResults(); drawStage(null); }

  /* ---------------- running trials ---------------- */
  var busy = false;
  function renderRunRow() {
    var row = $('#run-row');
    row.innerHTML = '';
    row.appendChild(el('span', { class: 'pl-runlbl', text: t('run_label') }));
    RUNS.forEach(function (k) {
      row.appendChild(el('button', { type: 'button', id: 'run-' + k, class: 'btn' + (k === 1 ? ' btn-primary' : k >= 1000 ? ' btn-accent' : ''),
        text: '×' + fmtN(k), 'aria-label': t('run_aria', { n: fmtN(k) }), onclick: function () { run(k); } }));
    });
    setRunDisabled();
  }
  function setRunDisabled() {
    var m = curModel(), full = seqs[S.exp].len >= MAX_TRIALS;
    RUNS.forEach(function (k) { var b = $('#run-' + k); if (b) b.disabled = busy || !!m.invalid || full; });
  }
  function run(k) {
    if (busy) return;
    var id = S.exp, m = curModel(), q = seqs[id];
    if (m.invalid) { EDU.toast(m.invalid); return; }
    var room = MAX_TRIALS - q.len;
    if (room <= 0) { EDU.toast(t('cap_reached', { n: fmtN(MAX_TRIALS) })); return; }
    if (k > room) { k = room; EDU.toast(t('cap_reached', { n: fmtN(MAX_TRIALS) })); }
    var draw = sampler(m);
    if (!(S.anim && k <= 10 && !reduceMotion)) {
      for (var i = 0; i < k; i++) pushRaw(id, draw());
      save(); renderResults(); drawStage(null);
      return;
    }
    busy = true; setRunDisabled();
    var done = 0, tok = animToken;
    (function next() {
      if (done >= k || tok !== animToken || S.exp !== id) { busy = false; save(); setRunDisabled(); return; }
      var raw = draw();
      playAnim(id, raw, k === 1).then(function (ok) {
        if (!ok || S.exp !== id) { busy = false; setRunDisabled(); return; }
        pushRaw(id, raw); done++;
        renderResults();
        if (done < k) setTimeout(next, 120); else next();
      });
    })();
  }

  /* ---------------- canvas helpers ---------------- */
  var printing = false;
  var PRINT = { '--text': '#000000', '--muted': '#444444', '--border': '#bbbbbb', '--surface': '#ffffff', '--surface-2': '#f2f2f2',
    '--c1': '#0b7285', '--c2': '#e8590c', '--accent': '#d9501c', '--accent-soft': '#fde6da', '--pl-red': '#c92a2a', '--primary': '#0b4f5c' };
  function col(name) { return printing && PRINT[name] ? PRINT[name] : (EDU.css(name) || PRINT[name] || '#888888'); }
  function fontFam() { return getComputedStyle(document.body).fontFamily || 'sans-serif'; }
  function prep(cv, h) {
    var w = Math.max(240, Math.floor(cv.parentElement.clientWidth || 300));
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = Math.round(w * dpr), Hh = Math.round(h * dpr);
    if (cv.width !== W) cv.width = W;
    if (cv.height !== Hh) cv.height = Hh;
    cv.style.height = h + 'px';
    var g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    try { g.direction = 'ltr'; } catch (e) { }
    return { g: g, w: w, h: h };
  }
  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  function fitText(g, txt, maxW, size, weight, fam) {
    var fs = size;
    g.font = weight + ' ' + fs + 'px ' + fam;
    while (fs > 9 && g.measureText(txt).width > maxW) { fs--; g.font = weight + ' ' + fs + 'px ' + fam; }
    if (g.measureText(txt).width > maxW) {
      while (txt.length > 1 && g.measureText(txt + '…').width > maxW) txt = txt.slice(0, -1);
      txt += '…';
    }
    return txt;
  }
  function ease(p) { return 1 - Math.pow(1 - p, 3); }
  function mod(a, b) { return ((a % b) + b) % b; }
  var TAU = Math.PI * 2;

  /* ---------------- stage pictures ---------------- */
  function drawCoin(g, x, y, r, heads, sx, fam) {
    var s = Math.max(0.06, Math.abs(sx));
    g.save(); g.translate(x, y); g.scale(s, 1);
    g.beginPath(); g.arc(0, 0, r, 0, TAU);
    g.fillStyle = heads ? '#f0b429' : '#c3c9d1'; g.fill();
    g.lineWidth = 4; g.strokeStyle = heads ? '#a86f05' : '#6b7785'; g.stroke();
    g.beginPath(); g.arc(0, 0, r * 0.8, 0, TAU); g.lineWidth = 2; g.stroke();
    var label = t(heads ? 'h_short' : 't_short');
    g.fillStyle = heads ? '#5c3d00' : '#2f3a45';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    label = fitText(g, label, r * 1.35, Math.round(r * (label.length > 2 ? 0.48 : 0.8)), '800', fam);
    g.fillText(label, 0, r * 0.04);
    g.restore();
  }
  var PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  function drawDie(g, x, y, s, v, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    rr(g, -s / 2, -s / 2, s, s, s * 0.18);
    g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = Math.max(2, s * 0.03); g.strokeStyle = '#2b2b2b'; g.stroke();
    var d = s * 0.26, pr = s * 0.085;
    g.fillStyle = (v === 1 || v === 4) ? '#d0021b' : '#1b1b1b';   /* Indian dice: red 1 and 4 */
    PIPS[v].forEach(function (p) { g.beginPath(); g.arc(p[0] * d, p[1] * d, v === 1 ? pr * 1.6 : pr, 0, TAU); g.fill(); });
    g.restore();
  }
  function shadow(g, x, y, w) { g.save(); g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(x, y, Math.max(4, w), Math.max(2, w * 0.18), 0, 0, TAU); g.fill(); g.restore(); }
  function drawBall(g, x, y, r, c) {
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = c; g.fill();
    g.lineWidth = 1; g.strokeStyle = 'rgba(0,0,0,.35)'; g.stroke();
    g.beginPath(); g.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, TAU); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill();
  }
  function drawSack(g, x, y, w, h) {
    g.save();
    g.beginPath();
    g.moveTo(x - w * 0.26, y - h * 0.36);
    g.bezierCurveTo(x - w * 0.58, y - h * 0.1, x - w * 0.58, y + h * 0.46, x, y + h * 0.46);
    g.bezierCurveTo(x + w * 0.58, y + h * 0.46, x + w * 0.58, y - h * 0.1, x + w * 0.26, y - h * 0.36);
    g.closePath();
    g.fillStyle = '#e2b47c'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#8a5a2b'; g.stroke();
    g.beginPath(); g.ellipse(x, y - h * 0.37, w * 0.27, h * 0.06, 0, 0, TAU); g.fillStyle = '#6b4423'; g.fill(); g.stroke();
    g.restore();
  }
  function drawCardBack(g, x, y, w, h) {
    g.save();
    rr(g, x - w / 2, y - h / 2, w, h, w * 0.1); g.fillStyle = '#0b4f5c'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#ffffff'; g.stroke();
    rr(g, x - w / 2 + 6, y - h / 2 + 6, w - 12, h - 12, w * 0.07); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.5; g.stroke();
    g.clip();
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1;
    for (var i = -h; i < w + h; i += 9) { g.beginPath(); g.moveTo(x - w / 2 + i, y - h / 2); g.lineTo(x - w / 2 + i - h, y + h / 2); g.stroke(); }
    g.restore();
  }
  function drawCardFace(g, x, y, w, h, raw, sx, fam) {
    var su = SUITS[Math.floor(raw / 13)], rk = RANKS[raw % 13], ink = su.red ? CARD_RED : CARD_BLACK;
    g.save(); g.translate(x, y); g.scale(Math.max(0.04, Math.abs(sx)), 1);
    rr(g, -w / 2, -h / 2, w, h, w * 0.1); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#9aa5ad'; g.stroke();
    g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '800 ' + Math.round(w * 0.2) + 'px ' + fam;
    g.fillText(rk, -w / 2 + w * 0.17, -h / 2 + w * 0.17);
    g.fillText(su.s, -w / 2 + w * 0.17, -h / 2 + w * 0.38);
    g.save(); g.rotate(Math.PI);
    g.fillText(rk, -w / 2 + w * 0.17, -h / 2 + w * 0.17);
    g.fillText(su.s, -w / 2 + w * 0.17, -h / 2 + w * 0.38);
    g.restore();
    if (raw % 13 >= 10) {
      g.font = '800 ' + Math.round(w * 0.42) + 'px ' + fam; g.fillText(rk, 0, -h * 0.07);
      g.font = '700 ' + Math.round(w * 0.3) + 'px ' + fam; g.fillText(su.s, 0, h * 0.2);
    } else {
      g.font = '700 ' + Math.round(w * 0.55) + 'px ' + fam; g.fillText(su.s, 0, h * 0.03);
    }
    g.restore();
  }
  function drawSpinner(g, cx, cy, R, rot, hi, fam) {
    var secs = S.spinner.sectors, tot = secs.reduce(function (a, s) { return a + s.size; }, 0), a = rot, spans = [];
    secs.forEach(function (sec) {
      var a1 = a + TAU * sec.size / tot;
      spans.push([a, a1]);
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a, a1); g.closePath();
      g.fillStyle = sec.color; g.fill(); g.lineWidth = 2; g.strokeStyle = '#ffffff'; g.stroke();
      a = a1;
    });
    secs.forEach(function (sec, i) {
      var a0 = spans[i][0], a1 = spans[i][1], sweep = a1 - a0, mid = (a0 + a1) / 2;
      if (sweep * R * 0.62 < 26) return;
      var lx = cx + Math.cos(mid) * R * 0.6, ly = cy + Math.sin(mid) * R * 0.6;
      var maxW = Math.min(R * 0.8, sweep * R * 0.62 + 10);
      var txt = fitText(g, sectorName(sec), maxW, Math.round(EDU.clamp(R * 0.15, 11, 18)), '700', fam);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 3.5; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineJoin = 'round'; g.strokeText(txt, lx, ly);
      g.fillStyle = '#ffffff'; g.fillText(txt, lx, ly);
    });
    if (hi >= 0 && spans[hi]) {
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, spans[hi][0], spans[hi][1]); g.closePath();
      g.lineWidth = 5; g.strokeStyle = col('--text'); g.stroke();
    }
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.lineWidth = 3; g.strokeStyle = col('--text'); g.stroke();
    g.beginPath(); g.arc(cx, cy, Math.max(6, R * 0.08), 0, TAU); g.fillStyle = col('--surface'); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(cx - 13, cy - R - 16); g.lineTo(cx + 13, cy - R - 16); g.lineTo(cx, cy - R + 14); g.closePath();
    g.fillStyle = col('--accent'); g.fill(); g.lineWidth = 2; g.strokeStyle = col('--text'); g.stroke();
  }
  function spinnerSpans() {
    var secs = S.spinner.sectors, tot = secs.reduce(function (a, s) { return a + s.size; }, 0), c = 0;
    return secs.map(function (s) { var a = c; c += TAU * s.size / tot; return [a, c]; });
  }
  function bagOrder(cn) {
    var balls = [], seed = 7 + cn[0] * 31 + cn[1] * 17 + cn[2] * 13 + cn[3] * 11;
    cn.forEach(function (k, i) { for (var j = 0; j < k; j++) balls.push(i); });
    for (var i = balls.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      var j = seed % (i + 1), x = balls[i]; balls[i] = balls[j]; balls[j] = x;
    }
    return balls;
  }

  var animToken = 0, spinRot = 0;
  function stopAnim() { animToken++; busy = false; }
  function animate(dur, frame) {
    var tok = animToken;
    return new Promise(function (res) {
      var t0 = null;
      function step(now) {
        if (tok !== animToken) return res(false);
        if (t0 === null) t0 = now;
        var p = Math.min(1, (now - t0) / dur);
        frame(p);
        if (p < 1) requestAnimationFrame(step); else res(true);
      }
      requestAnimationFrame(step);
    });
  }
  function playAnim(id, raw, single) {
    var dur = id === 'spinner' ? (single ? 1800 : 700) : (single ? 950 : 420);
    var A = { raw: raw, single: single, rnd: [], p: 0 };
    for (var i = 0; i < 40; i++) A.rnd.push(Math.random());
    if (id === 'spinner') {
      var sp = spinnerSpans()[raw], theta = sp[0] + (sp[1] - sp[0]) * (0.12 + 0.76 * A.rnd[0]);
      var base = spinRot + (single ? 3 : 1) * TAU;
      A.from = spinRot;
      A.to = base + mod(-Math.PI / 2 - theta - base, TAU);
    }
    return animate(dur, function (p) { A.p = p; drawStage(A); }).then(function (ok) {
      if (ok && id === 'spinner') spinRot = mod(A.to, TAU);
      return ok;
    });
  }

  function drawStage(A) {
    var cv = $('#stage'), narrow = (cv.parentElement.clientWidth || 300) < 520;
    var s = prep(cv, narrow ? 220 : 260), g = s.g, W = s.w, H = s.h, fam = fontFam();
    var id = S.exp, q = seqs[id];
    var raw = A ? A.raw : (q.len ? q.buf[q.len - 1] : null);
    var p = A ? A.p : 1, moving = A && p < 1;
    if (id === 'coin') {
      var n = S.coin.n, r = Math.min(H * 0.28, (W - 30) / (n * 2.6)), gap = r * 2.6;
      for (var i = 0; i < n; i++) {
        var x = W / 2 + (i - (n - 1) / 2) * gap, y = H / 2 - 6, heads = raw === null ? true : !!((raw >> i) & 1), sx = 1, face = heads, lift = 0;
        if (moving) {
          var ph = p * TAU * (A.single ? 4 + i : 2);
          sx = Math.cos(ph); face = sx >= 0 ? heads : !heads;
          lift = Math.sin(p * Math.PI) * H * 0.18;
        }
        shadow(g, x, H / 2 + r + 6, r * 0.8 * (1 - lift / H));
        g.globalAlpha = raw === null ? 0.55 : 1;
        drawCoin(g, x, y - lift, r, face, sx, fam);
        g.globalAlpha = 1;
      }
    } else if (id === 'die' || id === 'dice') {
      var two = id === 'dice', sz = two ? Math.min(H * 0.42, 104, W * 0.3) : Math.min(H * 0.5, 120);
      var vals = raw === null ? (two ? [3, 4] : [6]) : (two ? [Math.floor(raw / 6) + 1, raw % 6 + 1] : [raw + 1]);
      vals.forEach(function (v, k) {
        var x = W / 2 + (two ? (k ? 1 : -1) * sz * 0.75 : 0), y = H / 2 - (two ? 14 : 4), rot = 0, show = v;
        if (moving) {
          if (p < 0.82) show = 1 + Math.floor(A.rnd[(Math.floor(p * 18) + k * 7) % 40] * 6);
          rot = Math.pow(1 - p, 2) * (A.rnd[30 + k] * 8 - 4);
          y -= Math.abs(Math.sin(p * Math.PI * 2)) * H * 0.12 * (1 - p);
        }
        shadow(g, x, H / 2 + sz / 2 + (two ? -6 : 6), sz * 0.45);
        g.globalAlpha = raw === null ? 0.55 : 1;
        drawDie(g, x, y, sz, show, rot);
        g.globalAlpha = 1;
      });
      if (two && raw !== null && !moving) {
        g.fillStyle = col('--text'); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '800 22px ' + fam;
        g.fillText(vals[0] + ' + ' + vals[1] + ' = ' + (vals[0] + vals[1]), W / 2, H - 22);
      }
    } else if (id === 'spinner') {
      var R = H / 2 - 22, rot2 = moving ? A.from + (A.to - A.from) * ease(p) : (A ? A.to : spinRot);
      drawSpinner(g, W / 2, H / 2 + 10, R, rot2, (!moving && raw !== null) ? raw : -1, fam);
    } else if (id === 'bag') {
      var c = S.bag, cn = c.counts, N = cn[0] + cn[1] + cn[2] + cn[3];
      var bw = Math.min(W * 0.46, 230), bh = H * 0.8, bx = W * (W < 420 ? 0.31 : 0.36), by = H * 0.53;
      drawSack(g, bx, by, bw, bh);
      var order = bagOrder(cn), rb = EDU.clamp(Math.sqrt((bw * 0.6 * bh * 0.5) / Math.max(1, N)) / 2.4, 4, 13), d = rb * 2 + 2;
      var cols = Math.max(1, Math.floor(bw * 0.62 / d)), left = bx - (cols * d) / 2;
      order.forEach(function (ci, k) {
        var row = Math.floor(k / cols), cI = k % cols;
        var bx2 = left + (cI + 0.5) * d + (row % 2 ? d * 0.25 : -d * 0.25), by2 = by + bh * 0.36 - rb - row * d * 0.9;
        drawBall(g, bx2, by2, rb, BALLS[ci].c);
      });
      if (raw !== null) {
        var drawn = c.draws === 1 ? [raw] : [Math.floor(raw / 4), raw % 4];
        var rB = Math.min(26, H * 0.11), tx0 = W * (W < 420 ? 0.76 : 0.72);
        drawn.forEach(function (ci, k) {
          var tx = tx0 + (k - (drawn.length - 1) / 2) * rB * 2.7, ty = H * 0.45, x = tx, y = ty, rr2 = rB;
          if (moving) {
            var p0 = drawn.length === 1 ? 0 : k * 0.5, pp = EDU.clamp((p - p0) / (drawn.length === 1 ? 1 : 0.5), 0, 1);
            if (pp <= 0) return;
            var sx0 = bx, sy0 = by - bh * 0.4;
            x = sx0 + (tx - sx0) * ease(pp); y = sy0 + (ty - sy0) * pp - Math.sin(pp * Math.PI) * H * 0.25; rr2 = rB * (0.5 + 0.5 * pp);
          }
          drawBall(g, x, y, rr2, BALLS[ci].c);
          if (drawn.length === 2 && !moving) {
            g.fillStyle = col('--muted'); g.font = '700 14px ' + fam; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(String(k + 1), tx, ty + rB + 14);
          }
        });
      }
    } else if (id === 'cards') {
      var cw = Math.min(H * 0.48, 112, W * 0.28), ch = cw * 1.42, dx = W * 0.3, cx = W * 0.66, cy = H / 2;
      for (var j = 3; j >= 0; j--) drawCardBack(g, dx - j * 2, cy - j * 2, cw, ch);
      if (raw !== null) {
        if (moving) {
          var x3 = dx + (cx - dx) * ease(p), y3 = cy - Math.sin(p * Math.PI) * H * 0.1, f = Math.cos(p * Math.PI);
          if (f > 0) { g.save(); g.translate(x3, y3); g.scale(Math.max(0.04, f), 1); drawCardBack(g, 0, 0, cw, ch); g.restore(); }
          else drawCardFace(g, x3, y3, cw, ch, raw, f, fam);
        } else drawCardFace(g, cx, cy, cw, ch, raw, 1, fam);
      }
    }
  }

  /* ---------------- charts ---------------- */
  function drawBar(m, cc, n) {
    var cv = $('#bar'), narrow = (cv.parentElement.clientWidth || 300) < 520;
    var s = prep(cv, narrow ? 250 : 290), g = s.g, W = s.w, H = s.h, fam = fontFam();
    var k = m.cats.length;
    cv.dataset.cats = k;
    if (!k || !m.D) return;
    var th = m.cats.map(function (ct) { return ct.w / m.D; }), ex = cc.map(function (c) { return n ? c / n : 0; });
    var mx = Math.max(0.05, Math.max.apply(null, th.concat(ex))) * 1.08;
    var step = [0.02, 0.05, 0.1, 0.2, 0.25].filter(function (st) { return mx / st <= 5; })[0] || 0.25;
    var top = Math.min(1, Math.ceil(mx / step - 1e-9) * step);
    var twoLine = m.cats.some(function (ct) { return ct.sw && ct.sw.length && ct.short; });
    var padL = 44, padR = 8, padT = 12, padB = twoLine ? 64 : 50, pw = W - padL - padR, ph = H - padT - padB;
    var y = function (v) { return padT + ph * (1 - v / top); };
    g.textAlign = 'right'; g.textBaseline = 'middle'; g.font = '12px ' + fam; g.lineWidth = 1;
    for (var v = 0; v <= top + 1e-9; v += step) {
      g.strokeStyle = col('--border'); g.beginPath(); g.moveTo(padL, Math.round(y(v)) + 0.5); g.lineTo(W - padR, Math.round(y(v)) + 0.5); g.stroke();
      g.fillStyle = col('--muted'); g.fillText(fmtDec(Math.round(v * 100) / 100), padL - 6, y(v));
    }
    var gw = pw / k, bw = Math.max(3, Math.min(30, gw * 0.34)), y0 = y(0);
    m.cats.forEach(function (ct, i) {
      var cx = padL + gw * (i + 0.5);
      if (ct.inEv) { g.fillStyle = col('--accent-soft'); g.fillRect(cx - gw / 2 + 1, padT, gw - 2, ph); g.fillStyle = col('--accent'); g.fillRect(cx - gw / 2 + 1, y0, gw - 2, 3); }
      if (n) { g.fillStyle = col('--c1'); g.fillRect(cx - bw - 1, y(ex[i]), bw, y0 - y(ex[i])); }
      g.fillStyle = col('--c2'); g.fillRect(cx + 1, y(th[i]), bw, y0 - y(th[i]));
      var ly = y0 + 15;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (ct.sw && ct.sw.length) {
        var r = Math.max(3, Math.min(7, gw / (ct.sw.length * 2 + 1.5)));
        ct.sw.forEach(function (c, j) {
          var dx = cx + (j - (ct.sw.length - 1) / 2) * (r * 2 + 2);
          g.beginPath(); g.arc(dx, ly, r, 0, TAU); g.fillStyle = c; g.fill(); g.lineWidth = 1; g.strokeStyle = 'rgba(0,0,0,.3)'; g.stroke();
        });
        if (ct.short) { g.fillStyle = col('--text'); g.fillText(fitText(g, ct.short, gw - 4, 12, '600', fam), cx, ly + 16); }
      } else {
        g.fillStyle = ct.color ? col('--pl-red') : col('--text');
        var txt = fitText(g, ct.short, gw - 3, 14, '700', fam);
        g.fillText(txt, cx, ly + 2);
      }
    });
    g.strokeStyle = col('--text'); g.lineWidth = 1.5; g.beginPath(); g.moveTo(padL, y0); g.lineTo(W - padR, y0); g.stroke();
    g.fillStyle = col('--muted'); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(fitText(g, t(m.axis), pw, 12, '600', fam), padL + pw / 2, H - 9);
  }

  function drawLine(m, q) {
    var cv = $('#line'), narrow = (cv.parentElement.clientWidth || 300) < 520;
    var s = prep(cv, narrow ? 230 : 270), g = s.g, W = s.w, H = s.h, fam = fontFam();
    var n = q.len, pE = m.D ? m.fav / m.D : 0;
    var dec = Math.max(1, Math.ceil(Math.log10(Math.max(n, 10)) - 1e-9));
    var padL = 44, padR = 16, padT = 12, padB = 44, pw = W - padL - padR, ph = H - padT - padB;
    var x = function (i) { return padL + pw * Math.log10(i) / dec; }, y = function (v) { return padT + ph * (1 - v); };
    g.lineWidth = 1; g.font = '12px ' + fam;
    [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
      g.strokeStyle = col('--border'); g.beginPath(); g.moveTo(padL, Math.round(y(v)) + 0.5); g.lineTo(W - padR, Math.round(y(v)) + 0.5); g.stroke();
      g.fillStyle = col('--muted'); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(fmtDec(v), padL - 6, y(v));
    });
    for (var j = 0; j <= dec; j++) {
      var xx = Math.round(x(Math.pow(10, j))) + 0.5;
      g.strokeStyle = col('--border'); g.beginPath(); g.moveTo(xx, padT); g.lineTo(xx, padT + ph); g.stroke();
      g.fillStyle = col('--muted'); g.textAlign = j === dec ? 'right' : j === 0 ? 'left' : 'center'; g.textBaseline = 'top';
      g.fillText(fmtN(Math.pow(10, j)), xx, padT + ph + 5);
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(fitText(g, t('axis_trials'), pw, 12, '600', fam), padL + pw / 2, H - 9);
    if (m.D) {
      g.save(); g.setLineDash([8, 6]); g.strokeStyle = col('--c2'); g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(padL, y(pE)); g.lineTo(W - padR, y(pE)); g.stroke(); g.restore();
    }
    cv.dataset.n = n;
    if (!n) {
      g.fillStyle = col('--muted'); g.font = '600 14px ' + fam;
      g.fillText(fitText(g, t('chart_empty'), pw - 10, 14, '600', fam), padL + pw / 2, y(pE > 0.5 ? 0.25 : 0.75));
      return;
    }
    var inE = m.inEv, buf = q.buf, cnt = 0, lastX = -1, px = 0, py = 0;
    g.beginPath();
    for (var i = 0; i < n; i++) {
      cnt += inE[buf[i]];
      var N = i + 1;
      px = x(N);
      if (px - lastX >= 0.7 || N === n) {
        py = y(cnt / N);
        if (lastX < 0) g.moveTo(px, py); else g.lineTo(px, py);
        lastX = px;
      }
    }
    g.strokeStyle = col('--c1'); g.lineWidth = 2.2; g.lineJoin = 'round'; g.stroke();
    g.beginPath(); g.arc(px, py, 4.5, 0, TAU); g.fillStyle = col('--c1'); g.fill();
    cv.dataset.last = (cnt / n).toFixed(6);
  }

  /* ---------------- CSV ---------------- */
  function downloadCsv() {
    var id = S.exp, m = curModel(), q = seqs[id], n = q.len, r4 = function (v) { return Math.round(v * 1e4) / 1e4; };
    var rows = [[t('exp_' + id), m.space || ''], [t('th_outcome'), t('th_freq'), t('th_exp'), t('th_theory'), t('th_diff')]];
    var a = 0;
    m.elem.forEach(function (e) { if (m.inEv[e.raw]) a += q.counts[e.raw]; });
    m.cats.forEach(function (ct) {
      var c = ct.raws.reduce(function (s, r) { return s + q.counts[r]; }, 0), g = gcd(ct.w, m.D);
      rows.push([ct.label, c, n ? r4(c / n) : '', (ct.w / g) + '/' + (m.D / g) + ' (' + r4(ct.w / m.D) + ')', n ? r4(c / n - ct.w / m.D) : '']);
    });
    rows.push([t('total'), n, n ? 1 : '', 1, '']);
    var g2 = gcd(m.fav, m.D);
    rows.push([t('row_event') + ': ' + eventText(m), a, n ? r4(a / n) : '', (m.fav / g2) + '/' + (m.D / g2) + ' (' + r4(m.fav / m.D) + ')', n ? r4(a / n - m.fav / m.D) : '']);
    EDU.download(SLUG + '-' + id + '.csv', EDU.csv.stringify(rows), 'text/csv');
  }

  /* ---------------- wiring ---------------- */
  function renderAll() {
    renderTabs();
    renderSetup();
    renderEvent();
    renderRunRow();
    $('#anim').checked = !!S.anim;
    renderResults();
    if (!busy) drawStage(null);
  }
  function redrawCanvases() { renderResults(); if (!busy) drawStage(null); }

  $('#anim').addEventListener('change', function () { S.anim = $('#anim').checked; save(); });
  $('#reset').addEventListener('click', function () {
    var id = S.exp;
    if (seqs[id].len && !confirm(t('confirm_clear'))) return;
    stopAnim();
    clearSeq(id);
    save();
    renderResults();
    drawStage(null);
  });
  $('#fs').addEventListener('click', function () { EDU.fullscreen(); });
  $('#csv').addEventListener('click', downloadCsv);
  $('#print').addEventListener('click', function () { window.print(); });
  window.addEventListener('beforeprint', function () { printing = true; redrawCanvases(); });
  window.addEventListener('afterprint', function () { printing = false; redrawCanvases(); });

  var rzPending = false, lastW = 0;
  function onResize() {
    if (rzPending) return;
    rzPending = true;
    requestAnimationFrame(function () {
      rzPending = false;
      var w = $('#bar').parentElement.clientWidth + $('#stage').parentElement.clientWidth;
      if (w === lastW) return;
      lastW = w;
      redrawCanvases();
    });
  }
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(onResize);
    ro.observe($('#stage').parentElement); ro.observe($('#bar').parentElement);
  } else window.addEventListener('resize', onResize);

  EDU.onTheme(function () { redrawCanvases(); });
  EDU.onLang(function () { renderAll(); });
  /* fonts for Indian scripts load late: redraw canvas text once they arrive */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { redrawCanvases(); });

  loadSeqs();
  renderAll();
  window.ProbabilityLab = { model: function () { return curModel(); }, state: S };
})();
