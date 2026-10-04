/* Fraction Lab: build fractions (pie / bar / set / number line), compare, equivalent fractions,
   add & subtract step by step, a number-line placing game and practice with printable worksheets.
   Everything is drawn as inline SVG that uses the theme colours, so dark mode and print just work. */
(function () {
  'use strict';
  var SLUG = 'fraction-lab';
  var store = EDU.store(SLUG);
  EDU.init({ slug: SLUG, title: 'app_title' });

  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, esc = EDU.esc, clamp = EDU.clamp, rnd = EDU.randInt, pick = EDU.pick;
  var t = function (k, v) { return EDU.t(k, v); };
  var NS = 'http://www.w3.org/2000/svg';

  /* ===================================================== maths */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var r = a % b; a = b; b = r; } return a; }
  function lcm(a, b) { return a && b ? a / gcd(a, b) * b : 0; }
  function reduce(n, d) { if (n === 0) return [0, 1]; var g = gcd(n, d); return [n / g, d / g]; }
  function cmpSign(n1, d1, n2, d2) { var l = n1 * d2, r = n2 * d1; return l > r ? '>' : (l < r ? '<' : '='); }

  /* exact decimal expansion with the repeating block (long division) */
  function decParts(n, d) {
    var ip = Math.floor(n / d), r = n % d, digits = [], seen = {}, rep = -1;
    while (r !== 0 && digits.length < 60) {
      if (seen[r] !== undefined) { rep = seen[r]; break; }
      seen[r] = digits.length; r *= 10; digits.push(Math.floor(r / d)); r %= d;
    }
    return { ip: ip, digits: digits, rep: rep };
  }
  function decHTML(n, d) {
    var p = decParts(n, d);
    if (!p.digits.length) return String(p.ip);
    if (p.rep < 0) return p.ip + '.' + p.digits.join('');
    /* the whole repeating block gets the bar (1/17 has 16 repeating digits; the number may wrap, see .fl-dec) */
    var non = p.digits.slice(0, p.rep).join(''), rp = p.digits.slice(p.rep);
    if (rp.length <= 24) return p.ip + '.' + non + '<span class="fl-rep">' + rp.join('') + '</span>';
    return p.ip + '.' + p.digits.slice(0, 8).join('') + '…';
  }
  function isRepeating(n, d) { return decParts(n, d).rep >= 0; }
  function approx(n, d) { return String(Math.round(n / d * 1000) / 1000); }
  function decPlain(n, d) { var p = decParts(n, d); return p.rep < 0 ? (p.digits.length ? p.ip + '.' + p.digits.join('') : String(p.ip)) : approx(n, d); }

  /* ===================================================== HTML maths helpers */
  function F(n, d) { return '<span class="fl-f"><span class="fl-fn">' + n + '</span><span class="fl-fd">' + d + '</span></span>'; }
  function MX(w, n, d) { return '<span class="fl-mx"><span class="fl-mw">' + w + '</span>' + F(n, d) + '</span>'; }
  function O(s) { return '<span class="fl-op">' + s + '</span>'; }
  function M(h, cls) { return '<span class="fl-math' + (cls ? ' ' + cls : '') + '" dir="ltr">' + h + '</span>'; }
  function V(n, d) { return d === 1 ? String(n) : F(n, d); }
  /* value in simplest form, plus a mixed number when it is more than 1 */
  function nice(n, d) {
    var r = reduce(n, d), h = V(r[0], r[1]);
    if (r[1] > 1 && r[0] > r[1]) h += O('=') + MX(Math.floor(r[0] / r[1]), r[0] % r[1], r[1]);
    return h;
  }
  function P(h, cls) { return '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + h + '</p>'; }
  function ML(h) { return '<div class="fl-mline">' + M(h) + '</div>'; }
  /* translated text with HTML (fractions) placed into {placeholders}; the translation itself is escaped */
  function tH(key, vars) {
    return esc(t(key)).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? String(vars[k]) : m; });
  }
  function tE(key, vars) { return esc(t(key, vars)); }
  /* "₹1" inside Urdu (RTL) text after Arabic letters is shown as "1₹" by the bidi algorithm: keep money amounts left to right */
  function money(h) { return String(h).replace(/₹\s?\d+/g, function (m) { return '<span dir="ltr">' + m + '</span>'; }); }
  /* students and teachers may type digits in their own script (०१२, ০১২, ۱۲۳ …): read them as 0-9 */
  var DIGIT0 = [0x660, 0x6F0, 0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66];
  function latinDigits(s) {
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var x = c.charCodeAt(0);
      for (var i = 0; i < DIGIT0.length; i++) if (x >= DIGIT0[i] && x <= DIGIT0[i] + 9) return String(x - DIGIT0[i]);
      return c;
    });
  }
  /* a button that replaces itself (Check → Next in the same spot) must not take the second click of a double-click
     or an auto-repeated Enter as a new press, or the feedback is skipped before anyone can read it */
  var GUARD_MS = 450;
  var TIMES = ' × ', DIVS = ' ÷ ', MINUS = '−';
  var SIGNKEY = { '>': 'gt', '<': 'lt', '=': 'eq' };

  /* ===================================================== SVG helpers */
  function sv(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function r2(x) { return Math.round(x * 100) / 100; }
  function svText(parent, x, y, txt, size, cls) {
    var e = sv('text', { x: r2(x), y: r2(y), 'text-anchor': 'middle', 'font-size': size || 28, class: cls || null }, parent);
    e.textContent = txt;
    return e;
  }
  function svFrac(parent, x, y, n, d, size, cls) {
    var g = sv('g', { class: 'sfrac' + (cls ? ' ' + cls : '') }, parent);
    var w = Math.max(String(n).length, String(d).length) * size * 0.62 + 8;
    svText(g, x, y - size * 0.2, n, size);
    sv('line', { x1: r2(x - w / 2), x2: r2(x + w / 2), y1: y, y2: y }, g);
    svText(g, x, y + size * 0.95, d, size);
    return g;
  }
  function polar(cx, cy, r, deg) { var a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function sector(cx, cy, r, a0, a1) {
    var p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
    return 'M' + cx + ' ' + cy + 'L' + r2(p0[0]) + ' ' + r2(p0[1]) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + r2(p1[0]) + ' ' + r2(p1[1]) + 'Z';
  }

  /* One pie = one whole cut into d parts; `shaded` of them coloured. o.k cuts every part again into k (equivalent fractions). */
  function pie(shaded, d, o) {
    o = o || {};
    var k = o.k || 1, parts = d * k, sh = shaded * k, cx = 110, cy = 110, r = 102;
    var s = sv('svg', { viewBox: '0 0 220 220', class: 'fl-svg fl-pie' + (o.click ? ' fl-click' : ''), 'aria-hidden': 'true' });
    if (parts === 1) sv('circle', { cx: cx, cy: cy, r: r, class: 'pt' + (sh ? ' ' + (o.cls || 's1') : ''), 'data-idx': 0 }, s);
    else {
      for (var i = 0; i < parts; i++) {
        sv('path', { d: sector(cx, cy, r, 360 * i / parts, 360 * (i + 1) / parts), class: 'pt' + (i < sh ? ' ' + (o.cls || 's1') : '') + (k > 1 || parts > 40 ? ' fine' : ''), 'data-idx': Math.floor(i / k) }, s);
      }
      if (k > 1 && d > 1) for (var j = 0; j < d; j++) { var p = polar(cx, cy, r, 360 * j / d); sv('line', { x1: cx, y1: cy, x2: r2(p[0]), y2: r2(p[1]), class: 'main' }, s); }
    }
    sv('circle', { cx: cx, cy: cy, r: r, class: 'rim' }, s);
    return s;
  }

  /* A row of bars on one scale: `per` parts in each whole, `wholes` bars, segs = [[count, cls], ...] coloured from the start,
     mainEvery = thick line every N parts (the original cuts). */
  /* o.perRow: wholes side by side before the next line starts (3–4 wholes in one line made 10 px thin bars on phones) */
  function bars(o) {
    var per = o.per, W = o.wholes || 1, WW = 600, GAP = 34, RGAP = 18, H = o.h || 84;
    var PR = clamp(o.perRow || W, 1, W), NR = Math.ceil(W / PR);
    var total = PR * WW + (PR - 1) * GAP, totalH = NR * H + (NR - 1) * RGAP, pw = WW / per, me = o.mainEvery || 1;
    var s = sv('svg', { viewBox: '-4 -4 ' + (total + 8) + ' ' + (totalH + 8), preserveAspectRatio: 'xMinYMid meet', class: 'fl-svg fl-bars' + (o.click ? ' fl-click' : ''), 'aria-hidden': 'true' });
    if (NR > 1) s.style.maxHeight = (NR * 96) + 'px';   /* .fl-rows caps one line of bars at 96 px */
    var clsAt = [];
    (o.segs || []).forEach(function (sg) { for (var i = 0; i < sg[0]; i++) clsAt.push(sg[1]); });
    var fine = me > 1 || pw < 10, g = 0;
    for (var w = 0; w < W; w++) {
      var x0 = (w % PR) * (WW + GAP), y0 = Math.floor(w / PR) * (H + RGAP);
      for (var p = 0; p < per; p++, g++) {
        var cls = clsAt[g] || '';
        sv('rect', { x: r2(x0 + p * pw), y: y0, width: r2(pw), height: H, class: 'pt' + (cls ? ' ' + cls : '') + (fine ? ' fine' : ''), 'data-idx': Math.floor(p / me), 'data-whole': w }, s);
        if (cls === 'taken') {
          var m = Math.min(pw, H) * 0.32, cx = x0 + (p + 0.5) * pw, cy = y0 + H / 2;
          sv('line', { x1: r2(cx - m), y1: r2(cy - m), x2: r2(cx + m), y2: r2(cy + m), class: 'xmark' }, s);
          sv('line', { x1: r2(cx - m), y1: r2(cy + m), x2: r2(cx + m), y2: r2(cy - m), class: 'xmark' }, s);
        }
      }
      if (me > 1) for (var q = me; q < per; q += me) sv('line', { x1: r2(x0 + q * pw), y1: y0, x2: r2(x0 + q * pw), y2: y0 + H, class: 'main' }, s);
      sv('rect', { x: x0, y: y0, width: WW, height: H, class: 'rim', rx: 3 }, s);
    }
    return s;
  }

  function isNarrow() { return (window.innerWidth || 1000) < 600; }
  function wholesPerRow(W) { return isNarrow() ? 1 : Math.min(W, 2); }

  /* Set model: a box of d laddoos, `shaded` of them coloured. */
  function setCols(d) {
    for (var c = Math.ceil(Math.sqrt(d)); c <= Math.min(d, 8); c++) if (d % c === 0) return c;
    return Math.min(d, Math.ceil(Math.sqrt(d * 1.6)));
  }
  function laddoos(shaded, d, o) {
    o = o || {};
    var cols = setCols(d), rows = Math.ceil(d / cols), C = 60, PD = 12, W = cols * C + 2 * PD, H = rows * C + 2 * PD;
    var s = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'fl-svg fl-set' + (o.click ? ' fl-click' : ''), 'aria-hidden': 'true' });
    s.style.setProperty('--cols', cols);
    sv('rect', { x: 2, y: 2, width: W - 4, height: H - 4, rx: 18, class: 'box' }, s);
    for (var i = 0; i < d; i++) {
      var cx = PD + (i % cols) * C + C / 2, cy = PD + Math.floor(i / cols) * C + C / 2;
      var g = sv('g', { class: 'ldg pt-wrap', 'data-idx': i }, s);
      if (i < shaded) {
        sv('circle', { cx: cx, cy: cy, r: 24, class: 'ld' }, g);
        [[-8, -7], [6, -9], [9, 5], [-5, 8], [-1, -1]].forEach(function (p) { sv('circle', { cx: cx + p[0], cy: cy + p[1], r: 2.4, class: 'ld-dot' }, g); });
      } else sv('circle', { cx: cx, cy: cy, r: 24, class: 'ld-empty' }, g);
    }
    return s;
  }

  /* Number line model 0 … wholes with ticks every 1/d and the point n/d. */
  function lineModel(n, d) {
    var W = Math.max(1, Math.ceil(n / d)), x0 = 60, x1 = 940, y = 96, s = sv('svg', { viewBox: '0 0 1000 190', class: 'fl-svg', 'aria-hidden': 'true' });
    var X = function (v) { return x0 + (x1 - x0) * v / W; };
    sv('line', { x1: x0, x2: x1, y1: y, y2: y, class: 'axis' }, s);
    if (n > 0) sv('line', { x1: x0, x2: r2(X(n / d)), y1: y, y2: y, class: 'axis-on' }, s);
    var labelAll = d > 1 && W * d <= 12;
    for (var i = 0; i <= W * d; i++) {
      var x = r2(X(i / d));
      if (i % d === 0) { sv('line', { x1: x, x2: x, y1: y - 24, y2: y + 24, class: 'tick-major' }, s); svText(s, x, y + 66, String(i / d), 34); }
      else {
        sv('line', { x1: x, x2: x, y1: y - 15, y2: y + 15, class: 'tick' }, s);
        if (labelAll) svFrac(s, x, y + 48, i, d, 22, 'muted-t');
      }
    }
    var px = r2(X(n / d));
    sv('circle', { cx: px, cy: y, r: 14, class: 'dot' }, s);
    svFrac(s, px, y - 52, n, d, 26, 'acc');
    return s;
  }

  /* ===================================================== state */
  var TABS = ['build', 'compare', 'equiv', 'add', 'line', 'practice'];
  var MODELS = ['pie', 'bar', 'set', 'line'];
  var TYPES = ['simplify', 'compare', 'add', 'sub', 'mixed', 'shaded', 'story'];
  var LEVELS = ['easy', 'medium', 'hard'];
  function defaults() {
    return {
      tab: 'build',
      b: { n: 3, d: 4, model: 'pie' },
      c: { n1: 2, d1: 3, n2: 3, d2: 4, cut: false, guess: false },
      e: { n: 2, d: 3, k: 2, model: 'pie' },
      a: { n1: 3, d1: 4, n2: 1, d2: 6, op: '+', steps: false },
      l: { level: 'easy', best: { easy: 0, medium: 0, hard: 0 } },
      p: { types: TYPES.slice(), level: 'junior', c: 0, n: 0, streak: 0, best: 0 }
    };
  }
  function int(v, lo, hi, def) { if (v === null || v === '' || typeof v === 'boolean') return def; v = Math.round(Number(v)); return isFinite(v) ? clamp(v, lo, hi) : def; }
  function load() {
    var D = defaults(), s = store.get('state', null);
    if (!s || typeof s !== 'object') return D;
    try {
      if (TABS.indexOf(s.tab) >= 0) D.tab = s.tab;
      if (s.b) { D.b.d = int(s.b.d, 1, 24, 4); D.b.n = int(s.b.n, 0, 4 * D.b.d, 3); if (MODELS.indexOf(s.b.model) >= 0) D.b.model = s.b.model; }
      if (s.c) {
        D.c.d1 = int(s.c.d1, 1, 12, 3); D.c.n1 = int(s.c.n1, 0, 2 * D.c.d1, 2);
        D.c.d2 = int(s.c.d2, 1, 12, 4); D.c.n2 = int(s.c.n2, 0, 2 * D.c.d2, 3);
        D.c.cut = !!s.c.cut; D.c.guess = !!s.c.guess;
      }
      if (s.e) { D.e.d = int(s.e.d, 1, 12, 3); D.e.n = int(s.e.n, 0, D.e.d, 2); D.e.k = int(s.e.k, 1, 6, 2); if (s.e.model === 'bar') D.e.model = 'bar'; }
      if (s.a) {
        D.a.d1 = int(s.a.d1, 1, 12, 4); D.a.n1 = int(s.a.n1, 0, 2 * D.a.d1, 3);
        D.a.d2 = int(s.a.d2, 1, 12, 6); D.a.n2 = int(s.a.n2, 0, 2 * D.a.d2, 1);
        D.a.op = s.a.op === '-' ? '-' : '+'; D.a.steps = !!s.a.steps;
      }
      if (s.l) {
        if (LEVELS.indexOf(s.l.level) >= 0) D.l.level = s.l.level;
        if (s.l.best) LEVELS.forEach(function (L) { D.l.best[L] = int(s.l.best[L], 0, 10, 0); });
      }
      if (s.p) {
        var ty = Array.isArray(s.p.types) ? s.p.types.filter(function (x) { return TYPES.indexOf(x) >= 0; }) : [];
        if (ty.length) D.p.types = TYPES.filter(function (x) { return ty.indexOf(x) >= 0; });
        if (s.p.level === 'senior') D.p.level = 'senior';
        D.p.c = int(s.p.c, 0, 1e6, 0); D.p.n = int(s.p.n, D.p.c, 1e6, 0); D.p.streak = int(s.p.streak, 0, 1e6, 0); D.p.best = int(s.p.best, 0, 1e6, 0);
      }
    } catch (e) { return defaults(); }
    return D;
  }
  var st = load();
  function save() { store.set('state', st); }

  /* ===================================================== fraction editor (numerator over denominator with − / + steppers) */
  function makeEditor(cfg) {
    var wrap = el('div', { class: 'fl-ed' + (cfg.labels ? ' lab' : '') + (cfg.compact ? ' compact' : ''), role: 'group', 'data-c': cfg.color || 1, id: cfg.id + '-ed' });
    function row(part) {
      var minus = el('button', { type: 'button', class: 'fl-sb', id: cfg.id + '-' + part + '-minus', text: '−' });
      var input = el('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', class: 'fl-in', id: cfg.id + '-' + part, 'data-part': part, maxlength: 3 });
      var plus = el('button', { type: 'button', class: 'fl-sb', id: cfg.id + '-' + part + '-plus', text: '+' });
      minus.addEventListener('click', function () { step(part, -1); });
      plus.addEventListener('click', function () { step(part, 1); });
      input.addEventListener('input', function () { typed(part, input); });
      input.addEventListener('change', function () { normalize(); });
      input.addEventListener('blur', function () { normalize(); });
      input.addEventListener('focus', function () { try { input.select(); } catch (e) { } });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp') { e.preventDefault(); step(part, 1); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); step(part, -1); }
        else if (e.key === 'Enter') { normalize(); }
      });
      return { minus: minus, input: input, plus: plus, box: el('div', { class: 'fl-ed-row' }, minus, input, plus) };
    }
    var N = row('n'), D = row('d');
    var tN = cfg.labels ? el('div', { class: 'fl-ed-txt' }) : null, tD = cfg.labels ? el('div', { class: 'fl-ed-txt' }) : null;
    wrap.appendChild(N.box); if (tN) wrap.appendChild(tN);
    wrap.appendChild(el('div', { class: 'fl-ed-line', 'aria-hidden': 'true' })); if (cfg.labels) wrap.appendChild(el('div'));
    wrap.appendChild(D.box); if (tD) wrap.appendChild(tD);

    /* Only re-render when the value really changes: the blur that happens when you tap a slice, a chip or
       "Simplify it" right after typing must not rebuild (and so swallow) the very thing you tapped,
       or reset the step-by-step / guess progress of the tab. */
    function apply(n, d) {
      d = clamp(d, cfg.dMin, cfg.dMax);
      n = clamp(n, 0, cfg.nMax(d));
      var v = cfg.get();
      if (v[0] === n && v[1] === d) return;
      cfg.set(n, d);
    }
    function step(part, delta) {
      var v = cfg.get();
      if (part === 'n') apply(v[0] + delta, v[1]); else apply(v[0], v[1] + delta);
    }
    function num(input) { return parseInt(latinDigits(input.value), 10); }
    function typed(part, input) {
      var x = num(input), v = cfg.get(), n = v[0], d = v[1];
      if (isNaN(x)) return;
      if (part === 'n') n = x; else d = x;
      if (d < cfg.dMin || d > cfg.dMax || n < 0 || n > cfg.nMax(d)) return;   // wait for blur / Enter
      if (n !== v[0] || d !== v[1]) cfg.set(n, d);
    }
    function normalize() {
      var v = cfg.get(), n = num(N.input), d = num(D.input);
      apply(isNaN(n) ? v[0] : n, isNaN(d) ? v[1] : d);
      update(true);
    }
    function setVal(input, x, force) {
      if (!force && document.activeElement === input && num(input) === x) return;
      input.value = String(x);
    }
    function update(force) {
      var v = cfg.get(), n = v[0], d = v[1];
      setVal(N.input, n, force); setVal(D.input, d, force);
      N.minus.disabled = n <= 0; N.plus.disabled = n >= cfg.nMax(d);
      D.minus.disabled = d <= cfg.dMin; D.plus.disabled = d >= cfg.dMax;
      var nn = t('numerator'), dd = t('denominator');
      N.input.setAttribute('aria-label', nn); D.input.setAttribute('aria-label', dd);
      N.minus.setAttribute('aria-label', t('one_less', { x: nn })); N.plus.setAttribute('aria-label', t('one_more', { x: nn }));
      D.minus.setAttribute('aria-label', t('one_less', { x: dd })); D.plus.setAttribute('aria-label', t('one_more', { x: dd }));
      wrap.setAttribute('aria-label', cfg.groupKey ? t(cfg.groupKey) : t('fraction'));
      if (tN) { tN.innerHTML = '<b>' + tE('numerator') + '</b>' + tE('num_help'); tD.innerHTML = '<b>' + tE('denominator') + '</b>' + tE('den_help'); }
    }
    return { el: wrap, update: update };
  }

  /* ===================================================== tabs */
  var tabBtns = $$('#tabs [role="tab"]');
  function showTab(name, focus) {
    if (TABS.indexOf(name) < 0) name = 'build';
    st.tab = name; save();
    tabBtns.forEach(function (b) {
      var on = b.dataset.tab === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    TABS.forEach(function (n) { $('#p-' + n).hidden = n !== name; });
    if (name === 'practice' && !pq) newQuestion();
    if (name === 'line') renderLine();
  }
  tabBtns.forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var i = TABS.indexOf(b.dataset.tab), rtl = document.documentElement.dir === 'rtl', dir = 0;
      if (e.key === 'ArrowRight') dir = rtl ? -1 : 1;
      else if (e.key === 'ArrowLeft') dir = rtl ? 1 : -1;
      else if (e.key === 'Home') { e.preventDefault(); showTab(TABS[0], true); return; }
      else if (e.key === 'End') { e.preventDefault(); showTab(TABS[TABS.length - 1], true); return; }
      if (dir) { e.preventDefault(); showTab(TABS[(i + dir + TABS.length) % TABS.length], true); }
    });
  });
  function pressSeg(sel, attr, value) {
    $$(sel + ' button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset[attr] === value ? 'true' : 'false'); });
  }

  /* ===================================================== 1. BUILD */
  var edB = makeEditor({
    id: 'b', labels: true, color: 1, dMin: 1, dMax: 24,
    nMax: function (d) { return Math.min(4 * d, 96); },
    get: function () { return [st.b.n, st.b.d]; },
    set: function (n, d) { st.b.n = n; st.b.d = d; save(); renderBuild(); }
  });
  $('#b-editor').appendChild(edB.el);
  var PRESETS = [[1, 2], [1, 3], [1, 4], [3, 4], [2, 3], [3, 8], [6, 8], [7, 4], [5, 2], [8, 4]];
  PRESETS.forEach(function (p) {
    var b = el('button', { type: 'button', class: 'chip fl-chipf', 'data-n': p[0], 'data-d': p[1], text: p[0] + '/' + p[1] });
    b.addEventListener('click', function () { st.b.n = p[0]; st.b.d = p[1]; save(); renderBuild(); });
    $('#b-presets').appendChild(b);
  });
  $$('#b-model button').forEach(function (b) {
    b.addEventListener('click', function () { st.b.model = b.dataset.model; save(); renderBuild(); });
  });
  $('#b-view').addEventListener('click', function (e) {
    var part = e.target.closest('[data-idx]'), svg = e.target.closest('svg[data-whole]');
    if (!part || !svg || st.b.model === 'line') return;
    var nn = (+svg.dataset.whole) * st.b.d + (+part.dataset.idx) + 1;
    if (nn === st.b.n) nn -= 1;
    st.b.n = clamp(nn, 0, 4 * st.b.d); save(); renderBuild();
  });

  function buildCaption(n, d, model) {
    if (model === 'line') return tE('cap_line', { n: n, d: d });
    if (model === 'set') return tE(n <= d ? 'cap_set' : 'cap_set_more', { n: n, d: d });
    return tE(n <= d ? 'cap_parts' : 'cap_more', { n: n, d: d });
  }
  function renderBuild() {
    var n = st.b.n, d = st.b.d, model = st.b.model, W = Math.max(1, Math.ceil(n / d));
    edB.update();
    pressSeg('#b-model', 'model', model);
    $$('#b-presets .chip').forEach(function (c) { c.setAttribute('aria-pressed', (+c.dataset.n === n && +c.dataset.d === d) ? 'true' : 'false'); });
    var view = $('#b-view');
    view.textContent = '';
    view.className = 'fl-view fl-view-' + model;
    var i, s;
    if (model === 'line') view.appendChild(lineModel(n, d));
    else for (i = 0; i < W; i++) {
      var sh = clamp(n - i * d, 0, d);
      if (model === 'pie') s = pie(sh, d, { cls: 's1', click: true });
      else if (model === 'bar') s = bars({ per: d, wholes: 1, segs: [[sh, 's1']], click: true });
      else s = laddoos(sh, d, { click: true });
      s.setAttribute('data-whole', i);
      view.appendChild(s);
    }
    var cap = buildCaption(n, d, model);
    $('#b-caption').innerHTML = cap;
    view.setAttribute('aria-label', n + '/' + d + '. ' + $('#b-caption').textContent);
    renderFacts();
  }
  function fact(title, math, text, id) {
    return '<div class="card fl-fact"' + (id ? ' id="' + id + '"' : '') + '><h3>' + esc(title) + '</h3>' + (math ? '<div>' + math + '</div>' : '') + (text ? '<div class="fl-fact-txt">' + text + '</div>' : '') + '</div>';
  }
  function renderFacts() {
    var n = st.b.n, d = st.b.d, g = gcd(n, d), w = Math.floor(n / d), rem = n % d, r = reduce(n, d), h = '';
    // type
    var typeTxt = P(n === 0 ? tE('type_zero') : n < d ? tE(n === 1 ? 'type_unit' : 'type_proper') : n === d ? tE('type_one') : (rem === 0 ? tE('type_whole', { w: w }) : tE('type_improper')));
    h += fact(t('f_type'), M(F(n, d), 'fl-big'), typeTxt);
    // simplest form
    var sm, stx;
    if (n === 0) { sm = M(F(0, d) + O('=') + '0'); stx = P(tE('simp_zero')); }
    else if (g > 1) { sm = M(F(n, d) + O('=') + F(n + DIVS + g, d + DIVS + g) + O('=') + V(r[0], r[1])); stx = P(tE('simp_div', { g: g })); }
    else { sm = M(F(n, d)); stx = P(tE('simp_already', { n: n, d: d })); }
    h += fact(t('f_simplest'), '<span id="b-simp-v" data-v="' + r[0] + '/' + r[1] + '">' + sm + '</span>', stx, 'b-simp');
    // mixed number
    var mm, mt;
    if (n < d) { mm = M(F(n, d)); mt = P(tE('mixed_none')); }
    else if (rem === 0) { mm = M(F(n, d) + O('=') + w); mt = P(tE('mixed_whole', { n: n, d: d, w: w })); }
    else {
      mm = M(F(n, d) + O('=') + MX(w, rem, d));
      mt = P(tE('mixed_how', { n: n, d: d, w: w, r: rem })) + P(tE('mixed_back')) + ML(MX(w, rem, d) + O('=') + F(w + TIMES + d + ' + ' + rem, d) + O('=') + F(n, d));
    }
    h += fact(t('f_mixed'), '<span id="b-mixed" data-w="' + (n >= d ? w : 0) + '" data-r="' + (n >= d ? rem : n) + '" data-d="' + d + '">' + mm + '</span>', mt);
    // decimal
    var rep = isRepeating(n, d);
    h += fact(t('f_decimal'), M(n + DIVS + d + O('=') + '<span class="fl-dec" id="b-dec" data-v="' + decPlain(n, d) + '">' + decHTML(n, d) + '</span>' + (rep ? O('≈') + approx(n, d) : '')), P(rep ? tE('rep_note') : tE('dec_note')));
    // percent
    var prep = isRepeating(n * 100, d);
    h += fact(t('f_percent'), M(F(n, d) + TIMES + '100%' + O('=') + '<span class="fl-dec" id="b-pct" data-v="' + decPlain(n * 100, d) + '%">' + decHTML(n * 100, d) + '%</span>' + (prep ? O('≈') + approx(n * 100, d) + '%' : '')), P(tE('pct_note')));
    $('#b-facts').innerHTML = h;
  }

  /* ===================================================== 2. COMPARE */
  var cmpRevealed = false, cmpPick = null;
  function cmpSet(which) {
    return function (n, d) { st.c['n' + which] = n; st.c['d' + which] = d; cmpRevealed = false; cmpPick = null; save(); renderCompare(); };
  }
  var edC1 = makeEditor({ id: 'c1', compact: true, color: 1, groupKey: 'first_frac', dMin: 1, dMax: 12, nMax: function (d) { return 2 * d; }, get: function () { return [st.c.n1, st.c.d1]; }, set: cmpSet(1) });
  var edC2 = makeEditor({ id: 'c2', compact: true, color: 2, groupKey: 'second_frac', dMin: 1, dMax: 12, nMax: function (d) { return 2 * d; }, get: function () { return [st.c.n2, st.c.d2]; }, set: cmpSet(2) });
  $('#c-ed1').appendChild(edC1.el); $('#c-ed2').appendChild(edC2.el);
  $('#c-cut').addEventListener('change', function () { st.c.cut = this.checked; save(); renderCompare(); });
  $('#c-guessmode').addEventListener('change', function () { st.c.guess = this.checked; cmpRevealed = false; cmpPick = null; save(); renderCompare(); });
  $('#c-rand').addEventListener('click', function () {
    var d1, d2, n1, n2;
    if (Math.random() < 0.2) { var b = [rnd(1, 3), 0]; b[1] = rnd(b[0] + 1, 5); var k1 = rnd(1, 2), k2 = k1 + rnd(1, 2); n1 = b[0] * k1; d1 = b[1] * k1; n2 = b[0] * k2; d2 = b[1] * k2; if (d2 > 12) { n2 = b[0]; d2 = b[1]; } }
    else { d1 = rnd(2, 10); d2 = rnd(2, 10); n1 = rnd(1, d1 - 1); n2 = rnd(1, d2 - 1); }
    if (Math.random() < 0.5) { st.c.n1 = n1; st.c.d1 = d1; st.c.n2 = n2; st.c.d2 = d2; } else { st.c.n1 = n2; st.c.d1 = d2; st.c.n2 = n1; st.c.d2 = d1; }
    cmpRevealed = false; cmpPick = null; save(); renderCompare();
  });
  $$('#c-gbtns button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (cmpRevealed) return;
      cmpPick = b.dataset.sign; cmpRevealed = true; renderCompare();
    });
  });
  function cmpExplain(n1, d1, n2, d2) {
    var s = cmpSign(n1, d1, n2, d2), A = F(n1, d1), B = F(n2, d2), h = '';
    if (d1 === d2) {
      h += P(tE('ex_same_den', { d: d1 })) + ML(n1 + O(s) + n2);
    } else {
      if (n1 === n2 && n1 > 0) h += P(tE('ex_same_num', { n: n1 }));
      var L = lcm(d1, d2), x = n1 * L / d1, y = n2 * L / d2;
      h += P(tE('ex_lcm', { a: d1, b: d2, l: L }));
      h += ML(A + O('=') + F(n1 + TIMES + (L / d1), d1 + TIMES + (L / d1)) + O('=') + F(x, L));
      h += ML(B + O('=') + F(n2 + TIMES + (L / d2), d2 + TIMES + (L / d2)) + O('=') + F(y, L));
      h += P(tE('ex_compare_nums')) + ML(F(x, L) + O(s) + F(y, L));
    }
    h += P(tH('cmp_' + SIGNKEY[s], { a: M(A), b: M(B) }), 'fl-res');
    if (d1 !== d2) h += '<div class="fl-tip">' + P(tE('ex_cross')) + ML(n1 + TIMES + d2 + O('=') + (n1 * d2) + O(s) + (n2 * d1) + O('=') + n2 + TIMES + d1) + '</div>';
    return h;
  }
  function renderCompare() {
    var c = st.c, s = cmpSign(c.n1, c.d1, c.n2, c.d2), hide = c.guess && !cmpRevealed;
    edC1.update(); edC2.update();
    $('#c-cut').checked = c.cut; $('#c-guessmode').checked = c.guess;
    var sign = $('#c-sign');
    sign.textContent = hide ? '?' : s;
    sign.dataset.sign = s;
    sign.classList.toggle('q', hide);
    sign.setAttribute('aria-label', hide ? t('guess_q') : t('cmp_' + SIGNKEY[s], { a: c.n1 + '/' + c.d1, b: c.n2 + '/' + c.d2 }));
    $('#c-guess').hidden = !c.guess;
    $$('#c-gbtns button').forEach(function (b) {
      var v = b.dataset.sign;
      b.disabled = cmpRevealed;
      b.classList.toggle('right', cmpRevealed && v === s);
      b.classList.toggle('wrongpick', cmpRevealed && v === cmpPick && v !== s);
      b.setAttribute('aria-label', t('sign_' + SIGNKEY[v]));
    });
    var gfb = $('#c-gfb');
    if (c.guess && cmpRevealed && cmpPick) {
      gfb.className = 'fl-fb center ' + (cmpPick === s ? 'ok' : 'bad');
      gfb.innerHTML = (cmpPick === s ? '✅ ' + tE('correct') : '❌ ' + tE('wrong')) + ' ' + tH('cmp_' + SIGNKEY[s], { a: M(F(c.n1, c.d1)), b: M(F(c.n2, c.d2)) });
    }
    else { gfb.className = 'fl-fb center'; gfb.textContent = ''; }
    gfb.hidden = !c.guess;
    // pictures on one scale
    var W = Math.max(1, Math.ceil(c.n1 / c.d1), Math.ceil(c.n2 / c.d2)), L = lcm(c.d1, c.d2), rows = $('#c-rows'), h = '';
    rows.textContent = '';
    [[c.n1, c.d1, 's1'], [c.n2, c.d2, 's2']].forEach(function (f) {
      var per = c.cut ? L : f[1], sh = c.cut ? f[0] * L / f[1] : f[0];
      var lab = c.cut && L !== f[1] ? F(f[0], f[1]) + O('=') + F(sh, L) : F(f[0], f[1]);
      rows.appendChild(el('div', { class: 'fl-math', dir: 'ltr', html: lab }));
      var svg = bars({ per: per, wholes: W, perRow: wholesPerRow(W), segs: [[sh, f[2]]], mainEvery: c.cut ? L / f[1] : 1, h: 76 });
      rows.appendChild(svg);
    });
    var ex = $('#c-explain');
    if (hide) { ex.hidden = true; ex.innerHTML = ''; }
    else { ex.hidden = false; ex.innerHTML = cmpExplain(c.n1, c.d1, c.n2, c.d2); }
  }

  /* ===================================================== 3. EQUIVALENT */
  var edE = makeEditor({ id: 'e', labels: false, color: 1, dMin: 1, dMax: 12, nMax: function (d) { return d; }, get: function () { return [st.e.n, st.e.d]; }, set: function (n, d) { st.e.n = n; st.e.d = d; save(); renderEquiv(); } });
  $('#e-editor').appendChild(edE.el);
  $('#e-k').addEventListener('input', function () { st.e.k = int(this.value, 1, 6, 2); save(); renderEquiv(true); });
  $$('#e-model button').forEach(function (b) { b.addEventListener('click', function () { st.e.model = b.dataset.model; save(); renderEquiv(); }); });
  function renderEquiv(animate) {
    var n = st.e.n, d = st.e.d, k = st.e.k, g = gcd(n, d);
    edE.update();
    $('#e-k').value = k;
    $('#e-k').setAttribute('aria-valuetext', '× ' + k);
    $('#e-kout').innerHTML = '×&nbsp;' + k;
    pressSeg('#e-model', 'model', st.e.model);
    $('#e-eq').innerHTML = M(F(n, d) + O('=') + F(n + TIMES + k, d + TIMES + k) + O('=') + '<span id="e-res" data-n="' + (n * k) + '" data-d="' + (d * k) + '">' + F(n * k, d * k) + '</span>');
    var box = $('#e-models'), bar = st.e.model === 'bar';
    box.className = 'fl-eqmodels' + (bar ? ' bars' : '');
    box.textContent = '';
    [[1, 'before'], [k, 'after']].forEach(function (x) {
      var fig = el('figure', { id: 'e-' + x[1] });
      var svg = bar ? bars({ per: d * x[0], wholes: 1, segs: [[n * x[0], 's1']], mainEvery: x[0], h: 70 }) : pie(n, d, { k: x[0], cls: 's1' });
      if (animate && x[1] === 'after') svg.classList.add('fresh');
      fig.appendChild(svg);
      fig.appendChild(el('figcaption', { html: M(F(n * x[0], d * x[0])) }));
      box.appendChild(fig);
    });
    $('#e-explain').textContent = k > 1 ? t('eq_explain', { k: k, d: d * k, n: n * k }) : t('eq_k1');
    // family chips
    var fam = $('#e-family'); fam.textContent = '';
    for (var m = 1; m <= 6; m++) {
      (function (m) {
        var b = el('button', { type: 'button', class: 'chip', 'data-k': m, 'aria-pressed': m === k ? 'true' : 'false', html: M(F(n * m, d * m)) });
        b.setAttribute('aria-label', (n * m) + '/' + (d * m));
        b.addEventListener('click', function () { st.e.k = m; save(); renderEquiv(true); });
        fam.appendChild(b);
      })(m);
    }
    // simplify note
    var simp = $('#e-simp');
    if (n === 0) simp.innerHTML = P(tE('simp_zero'), 'mb0');
    else if (g > 1) {
      simp.innerHTML = P(tE('eq_can_simplify', { g: g })) + ML(F(n, d) + O('=') + F(n + DIVS + g, d + DIVS + g) + O('=') + V(n / g, d / g)) +
        '<button type="button" class="btn btn-sm" id="e-simplify">' + tE('simplify_btn') + '</button>';
      $('#e-simplify').addEventListener('click', function () { st.e.n = n / g; st.e.d = d / g; save(); renderEquiv(); });
    } else simp.innerHTML = P(tE('eq_simplest'), 'mb0');
    renderWall();
  }
  function renderWall() {
    var n = st.e.n, d = st.e.d, wall = $('#e-wall');
    wall.textContent = '';
    $('#e-wall-hint').innerHTML = tH('eq_wall_hint', { f: M(F(n, d)) });
    for (var den = 1; den <= 12; den++) {
      var match = (n * den) % d === 0, k = n * den / d;
      var cells = el('div', { class: 'fl-wcells', style: { gridTemplateColumns: 'repeat(' + den + ', minmax(0, 1fr))' } });
      for (var i = 0; i < den; i++) cells.appendChild(el('span', { class: match && i < k ? 'on' : null, text: den === 1 ? '1' : '1/' + den }));
      var lab = el('div', { class: 'fl-wlab', html: match ? M(O('=') + (den === 1 ? String(k) : F(k, den))) : '' });
      wall.appendChild(el('div', { class: 'fl-wrow ' + (match ? 'yes' : 'no') + (den >= 7 ? ' many' : ''), 'data-den': den }, cells, lab));
    }
    var line = el('div', { class: 'fl-wline' });
    line.style.insetInlineStart = 'calc((100% - 4.4rem - 8px) * ' + (n / d) + ')';
    wall.appendChild(line);
  }

  /* ===================================================== 4. ADD & SUBTRACT */
  var addReveal = 99;
  function addSet(which) {
    return function (n, d) { st.a['n' + which] = n; st.a['d' + which] = d; addReveal = st.a.steps ? 1 : 99; save(); renderAdd(); };
  }
  var edA1 = makeEditor({ id: 'a1', compact: true, color: 1, groupKey: 'first_frac', dMin: 1, dMax: 12, nMax: function (d) { return 2 * d; }, get: function () { return [st.a.n1, st.a.d1]; }, set: addSet(1) });
  var edA2 = makeEditor({ id: 'a2', compact: true, color: 2, groupKey: 'second_frac', dMin: 1, dMax: 12, nMax: function (d) { return 2 * d; }, get: function () { return [st.a.n2, st.a.d2]; }, set: addSet(2) });
  $('#a-ed1').appendChild(edA1.el); $('#a-ed2').appendChild(edA2.el);
  $$('#a-op button').forEach(function (b) { b.addEventListener('click', function () { st.a.op = b.dataset.op; addReveal = st.a.steps ? 1 : 99; save(); renderAdd(); }); });
  function swapAdd() { var a = st.a, n = a.n1, d = a.d1; a.n1 = a.n2; a.d1 = a.d2; a.n2 = n; a.d2 = d; addReveal = a.steps ? 1 : 99; save(); renderAdd(); }
  $('#a-swap').addEventListener('click', swapAdd);
  $('#a-swap2').addEventListener('click', swapAdd);
  $('#a-stepmode').addEventListener('change', function () { st.a.steps = this.checked; addReveal = this.checked ? 1 : 99; save(); renderAdd(); });
  $('#a-next').addEventListener('click', function () { addReveal++; renderAdd(true); });
  $('#a-all').addEventListener('click', function () { addReveal = 99; renderAdd(); });
  $('#a-rand').addEventListener('click', function () {
    var a = st.a, d1, d2, n1, n2, tries = 0;
    do {
      if (Math.random() < 0.3) { d1 = d2 = rnd(3, 12); } else { var p = unlikePair(10, 60); d1 = p[0]; d2 = p[1]; }
      n1 = rnd(1, d1 - 1); n2 = rnd(1, d2 - 1);
    } while (a.op === '-' && n1 * d2 <= n2 * d1 && ++tries < 40);
    a.n1 = n1; a.d1 = d1; a.n2 = n2; a.d2 = d2; addReveal = a.steps ? 1 : 99; save(); renderAdd();
  });
  function unlikePair(dhi, maxL) {
    var d1, d2, tries = 0;
    do { d1 = rnd(2, dhi); d2 = rnd(2, dhi); } while ((d1 === d2 || lcm(d1, d2) > maxL) && ++tries < 60);
    if (d1 === d2) d2 = d1 === 2 ? 3 : 2;
    return [d1, d2];
  }
  function multiplesHTML(d, L) {
    var list = [];
    for (var m = d; m <= L; m += d) list.push(m === L ? '<b>' + m + '</b>' : String(m));
    return '<div class="fl-mult"><span>' + tE('st_multiples', { n: d }) + '</span>' + M(list.join(', ')) + '</div>';
  }
  function convLine(n, d, L) {
    var k = L / d;
    if (k === 1) return '<div class="fl-mline">' + M(F(n, d)) + ' <span class="muted small">(' + tE('no_change') + ')</span></div>';
    return ML(F(n, d) + O('=') + F(n + TIMES + k, d + TIMES + k) + O('=') + F(n * k, L));
  }
  /* the full worked solution of n1/d1 ± n2/d2 */
  function solveAdd(n1, d1, n2, d2, sub) {
    var L = lcm(d1, d2), x = n1 * L / d1, y = n2 * L / d2, r = sub ? x - y : x + y, o = sub ? MINUS : '+', steps = [];
    var res = { L: L, x: x, y: y, r: r, neg: r < 0, steps: steps };
    if (r < 0) return res;
    if (d1 === d2) steps.push(P(tE('st_like', { d: d1 })));
    else {
      steps.push(P(tE('st_unlike', { a: d1, b: d2 })));
      steps.push(P(tE('st_lcm_find', { a: d1, b: d2 })) + multiplesHTML(d1, L) + multiplesHTML(d2, L) + P(tE('st_lcm', { l: L })));
      steps.push(P(tE('st_convert', { l: L })) + convLine(n1, d1, L) + convLine(n2, d2, L));
    }
    steps.push(P(tE(sub ? 'st_sub' : 'st_add')) + ML(F(x, L) + O(o) + F(y, L) + O('=') + F(x + ' ' + o + ' ' + y, L) + O('=') + F(r, L)));
    var red = reduce(r, L);
    res.ans = red;
    if (r === 0) steps.push(P(tE('st_zero')));
    else {
      var g = gcd(r, L);
      if (g > 1) steps.push(P(tE('st_simplify', { g: g })) + ML(F(r, L) + O('=') + F(r + DIVS + g, L + DIVS + g) + O('=') + V(red[0], red[1])));
      else steps.push(P(tE('st_simplest')));
      if (red[1] > 1 && red[0] > red[1]) steps.push(P(tE('st_mixed')) + ML(F(red[0], red[1]) + O('=') + MX(Math.floor(red[0] / red[1]), red[0] % red[1], red[1])));
    }
    return res;
  }
  function renderAdd(animate) {
    var a = st.a, sub = a.op === '-', R = solveAdd(a.n1, a.d1, a.n2, a.d2, sub);
    edA1.update(); edA2.update();
    pressSeg('#a-op', 'op', a.op);
    $('#a-op-add').setAttribute('aria-label', t('op_add')); $('#a-op-sub').setAttribute('aria-label', t('op_sub'));
    $('#a-op').setAttribute('aria-label', t('op_choose'));
    $('#a-stepmode').checked = a.steps;
    $('#a-warn').hidden = !R.neg;
    $('#a-work').hidden = R.neg;
    var res = $('#a-result');
    if (R.neg) { res.innerHTML = M(O('=') + '<span class="fl-qbox">?</span>'); res.removeAttribute('data-n'); res.removeAttribute('data-d'); return; }
    var total = R.steps.length, shown = Math.min(addReveal, total), done = shown >= total;
    res.dataset.n = R.ans[0]; res.dataset.d = R.ans[1];
    res.innerHTML = M(O('=') + (done ? nice(R.r, R.L) : '<span class="fl-qbox">?</span>'));
    var ol = $('#a-steps'); ol.textContent = '';
    for (var i = 0; i < shown; i++) ol.appendChild(el('li', { class: animate && i === shown - 1 ? 'fresh' : null, html: R.steps[i] }));
    $('#a-next').hidden = done; $('#a-all').hidden = done;
    // picture: everything cut into L equal parts
    var W = Math.max(1, Math.ceil(R.x / R.L), Math.ceil(R.y / R.L), Math.ceil(R.r / R.L)), vis = $('#a-vis'), o = sub ? MINUS : '+';
    vis.textContent = '';
    $('#a-vis-cap').textContent = t('vis_cut', { l: R.L });
    var rows = [
      [F(a.n1, a.d1) + (R.L !== a.d1 ? O('=') + F(R.x, R.L) : ''), [[R.x, 's1']]],
      [O(o) + F(a.n2, a.d2) + (R.L !== a.d2 ? O('=') + F(R.y, R.L) : ''), [[R.y, 's2']]],
      [O('=') + (done ? F(R.r, R.L) : '<span class="fl-qbox">?</span>'), done ? (sub ? [[R.r, 's1'], [R.y, 'taken']] : [[R.x, 's1'], [R.y, 's2']]) : []]
    ];
    rows.forEach(function (rw, idx) {
      vis.appendChild(el('div', { class: 'fl-math', dir: 'ltr', html: rw[0] }));
      var svg = bars({ per: R.L, wholes: W, perRow: wholesPerRow(W), segs: rw[1], mainEvery: 1, h: 70 });
      svg.setAttribute('data-row', idx);
      vis.appendChild(svg);
    });
    var lg = $('#a-legend');
    lg.innerHTML = '<span><i style="background:var(--c1)"></i>' + tE('first_frac') + '</span><span><i style="background:var(--c2)"></i>' + tE('second_frac') + '</span>' +
      (sub ? '<span><i style="background:var(--surface-2);border-color:var(--danger)"></i>' + tE('taken_away') + '</span>' : '');
  }

  /* ===================================================== 5. NUMBER LINE GAME */
  var LV = { easy: { R: 1, snap: true }, medium: { R: 1, snap: true }, hard: { R: 2, snap: false } };
  var ROUNDS = 10, NL = { W: 1000, x0: 60, x1: 940, y: 122, H: 204 };
  /* phones get a narrower viewBox so the line, marker and labels stay big enough to touch */
  function sizeLine() {
    var w = ($('#l-stage') || {}).clientWidth || 0;
    NL.W = w && w < 640 ? 480 : 1000;
    NL.x0 = NL.W === 1000 ? 60 : 36;
    NL.x1 = NL.W - NL.x0;
  }
  var game = null, dragging = false;
  $$('#l-level button').forEach(function (b) {
    b.addEventListener('click', function () { st.l.level = b.dataset.level; save(); newGame(); });
  });
  $('#l-check').addEventListener('click', lineCheck);
  $('#l-next').addEventListener('click', lineNext);
  $('#l-restart').addEventListener('click', newGame);
  function newGame() { game = { round: 1, score: 0, over: false, last: '', newBest: false }; newTarget(); renderLine(); }
  function newTarget() {
    var L = st.l.level, n, d, key, tries = 0;
    do {
      if (L === 'easy') { d = pick([2, 3, 4]); n = rnd(1, d - 1); }
      else if (L === 'medium') { d = rnd(3, 10); n = rnd(1, d - 1); }
      else { d = rnd(2, 12); n = rnd(1, 2 * d - 1); if (n === d) n++; }
      key = n + '/' + d;
    } while (key === game.last && ++tries < 20);
    game.last = key;
    game.target = { n: n, d: d, mixed: L === 'hard' && n > d && Math.random() < 0.5 };
    game.value = 0; game.checked = false; game.ok = null;
  }
  function targetHTML() {
    var tg = game.target;
    return M(tg.mixed ? MX(Math.floor(tg.n / tg.d), tg.n % tg.d, tg.d) : F(tg.n, tg.d));
  }
  function lineX(v) { return NL.x0 + (NL.x1 - NL.x0) * v / LV[st.l.level].R; }
  function snapV(v) {
    var R = LV[st.l.level].R;
    v = clamp(v, 0, R);
    if (LV[st.l.level].snap) { var d = game.target.d; return Math.round(v * d) / d; }
    return Math.round(v * 200) / 200;
  }
  function setLineValue(v) {
    game.value = snapV(v);
    var m = $('#l-marker');
    if (!m) return;
    m.setAttribute('transform', 'translate(' + r2(lineX(game.value)) + ' 0)');
    m.setAttribute('aria-valuenow', String(Math.round(game.value * 1000) / 1000));
    m.setAttribute('aria-valuetext', EDU.fmt(game.value, { maximumFractionDigits: 2 }));
  }
  function buildLineSvg() {
    var L = LV[st.l.level], R = L.R, tg = game.target;
    var s = sv('svg', { viewBox: '0 0 ' + NL.W + ' ' + NL.H, class: 'fl-svg fl-nl', id: 'l-svg', 'data-x0': NL.x0, 'data-x1': NL.x1, 'data-y': NL.y, 'data-range': R, 'data-vbw': NL.W, 'data-vbh': NL.H });
    sv('rect', { x: 0, y: 0, width: NL.W, height: NL.H, class: 'hit' }, s);
    sv('line', { x1: NL.x0, x2: NL.x1, y1: NL.y, y2: NL.y, class: 'axis' }, s);
    if (L.snap) for (var i = 1; i < tg.d * R; i++) { var x = r2(lineX(i / tg.d)); sv('line', { x1: x, x2: x, y1: NL.y - 16, y2: NL.y + 16, class: 'tick' }, s); }
    for (var k = 0; k <= R; k++) {
      var xk = r2(lineX(k));
      sv('line', { x1: xk, x2: xk, y1: NL.y - 26, y2: NL.y + 26, class: 'tick-major' }, s);
      svText(s, xk, NL.y + 70, String(k), 38);
    }
    if (game.checked) {
      var gx = r2(lineX(tg.n / tg.d));
      sv('line', { x1: gx, x2: gx, y1: NL.y - 30, y2: NL.y + 30, class: 'goal' }, s);
      sv('circle', { cx: gx, cy: NL.y, r: 11, class: 'goal-dot' }, s);
      if (!game.ok) {
        /* label the true spot in the same form as the target; above the line unless the marker is right there */
        var fs = NL.W < 1000 ? 28 : 24, gy = Math.abs(lineX(game.value) - gx) > 70 ? NL.y - 62 : NL.y + 50;
        if (tg.mixed) {
          var fw = String(tg.d).length * fs * 0.62 + 8, gw = sv('g', { class: 'goal-t' }, s);
          svText(gw, gx - fw / 2 - 2, gy + fs * 0.42, String(Math.floor(tg.n / tg.d)), fs * 1.35).setAttribute('text-anchor', 'end');
          svFrac(gw, gx + 4, gy, tg.n % tg.d, tg.d, fs);
        } else svFrac(s, gx, gy, tg.n, tg.d, fs, 'goal-t');
      }
    }
    var m = sv('g', { class: 'fl-marker', id: 'l-marker', tabindex: game.checked || game.over ? -1 : 0, role: 'slider', 'aria-valuemin': 0, 'aria-valuemax': R, 'aria-label': t('nl_marker'), focusable: 'true' }, s);
    var y = NL.y;
    sv('circle', { cx: 0, cy: y - 66, r: 50, class: 'hitc' }, m);
    sv('circle', { cx: 0, cy: y - 69, r: 33, class: 'ring' }, m);
    sv('path', { d: 'M0 ' + (y - 3) + 'L-17 ' + (y - 52) + 'A24 24 0 1 1 17 ' + (y - 52) + 'Z', class: 'pin' }, m);
    sv('circle', { cx: 0, cy: y - 69, r: 8, class: 'eye' }, m);
    s.addEventListener('pointerdown', function (e) {
      if (!game || game.checked || game.over) return;
      dragging = true;
      try { s.setPointerCapture(e.pointerId); } catch (x) { }
      setLineValue(valFromEvent(e, s));
      try { m.focus({ preventScroll: true }); } catch (x) { }
      e.preventDefault();
    });
    s.addEventListener('pointermove', function (e) { if (dragging) setLineValue(valFromEvent(e, s)); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { s.addEventListener(ev, function () { dragging = false; }); });
    m.addEventListener('keydown', function (e) {
      if (!game || game.checked || game.over) return;
      var step = LV[st.l.level].snap ? 1 / game.target.d : 0.01, v = game.value, used = true;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += step;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v -= step;
      else if (e.key === 'PageUp') v += LV[st.l.level].snap ? step : 0.1;
      else if (e.key === 'PageDown') v -= LV[st.l.level].snap ? step : 0.1;
      else if (e.key === 'Home') v = 0;
      else if (e.key === 'End') v = R;
      else if (e.key === 'Enter') { lineCheck(); }
      else used = false;
      if (used) { e.preventDefault(); if (e.key !== 'Enter') setLineValue(v); }
    });
    return s;
  }
  function valFromEvent(e, s) {
    var r = s.getBoundingClientRect(), x = (e.clientX - r.left) * NL.W / (r.width || 1);
    return (x - NL.x0) / (NL.x1 - NL.x0) * LV[st.l.level].R;
  }
  var lineCheckedAt = 0;
  function lineCheck() {
    if (!game || game.checked || game.over) return;
    var tv = game.target.n / game.target.d, diff = Math.abs(game.value - tv);
    game.ok = LV[st.l.level].snap ? diff < 1e-6 : diff <= 0.04 + 1e-9;
    game.checked = true;
    lineCheckedAt = Date.now();
    if (game.ok) game.score++;
    renderLine();
    var nx = $('#l-next'); if (nx && !nx.hidden) nx.focus();
  }
  function lineNext() {
    if (!game || !game.checked) return;
    if (Date.now() - lineCheckedAt < GUARD_MS) return;   // double-click on Check / held Enter
    if (game.round >= ROUNDS) {
      game.over = true;
      var L = st.l.level;
      if (game.score > st.l.best[L]) { st.l.best[L] = game.score; game.newBest = true; save(); }
    } else { game.round++; newTarget(); }
    renderLine();
    var m = $('#l-marker'); if (m && !game.over) { try { m.focus({ preventScroll: true }); } catch (x) { } }
    if (game.over) $('#l-restart').focus();
  }
  function renderLine() {
    if (!game) { game = { round: 1, score: 0, over: false, last: '', newBest: false }; newTarget(); }
    var L = st.l.level;
    pressSeg('#l-level', 'level', L);
    $('#l-level').setAttribute('aria-label', t('pr_level'));
    $('#l-desc').textContent = t('lvl_' + L + '_d');
    $('#l-hud').innerHTML =
      '<span class="fl-pill">' + tE('round_of', { n: game.round, total: ROUNDS }) + '</span>' +
      '<span class="fl-pill">' + tE('score') + ' <b id="l-score">' + game.score + '</b></span>' +
      '<span class="fl-pill">' + tE('best_lbl') + ' <b id="l-best">' + st.l.best[L] + '/' + ROUNDS + '</b></span>';
    $('#l-play').hidden = game.over;
    $('#l-over').hidden = !game.over;
    var fb = $('#l-fb');
    if (game.over) {
      $('#l-over').innerHTML = '<div class="big-number">' + game.score + '/' + ROUNDS + '</div>' + P(tE('nl_done', { n: game.score, total: ROUNDS })) + (game.newBest ? P('🏆 ' + tE('new_best'), 'ok') : '');
      fb.textContent = ''; fb.className = 'fl-fb';
      $('#l-check').hidden = true; $('#l-next').hidden = true;
      return;
    }
    var tg = $('#l-target');
    tg.innerHTML = targetHTML();
    tg.dataset.n = game.target.n; tg.dataset.d = game.target.d;
    var stage = $('#l-stage');
    stage.textContent = '';
    sizeLine();
    stage.appendChild(buildLineSvg());
    setLineValue(game.value);
    if (game.checked) {
      fb.className = 'fl-fb ' + (game.ok ? 'ok' : 'bad');
      fb.innerHTML = (game.ok ? '✅ ' + tH('nl_ok', { f: targetHTML() }) : '❌ ' + tH('nl_wrong', { f: targetHTML() }));
    } else { fb.className = 'fl-fb'; fb.textContent = ''; }
    $('#l-check').hidden = game.checked;
    $('#l-next').hidden = !game.checked;
  }

  /* ===================================================== 6. PRACTICE */
  var pq = null;
  function properFrac(dlo, dhi) { var d = rnd(dlo, dhi); return [rnd(1, d - 1), d]; }
  var GEN = {
    simplify: function (sr) {
      var q, p; do { q = rnd(2, sr ? 10 : 6); p = rnd(1, q - 1); } while (gcd(p, q) !== 1);
      var k = rnd(2, sr ? 6 : 4); if (q * k > 60) k = 2;
      return { type: 'simplify', n: p * k, d: q * k, ans: [p, q] };
    },
    compare: function (sr) {
      var n1, d1, n2, d2, r = Math.random();
      if (!sr) {
        if (r < 0.55) { d1 = d2 = rnd(3, 10); n1 = rnd(1, d1 - 1); n2 = rnd(1, d1 - 1); }
        else { n1 = n2 = rnd(1, 3); do { d1 = rnd(n1 + 1, 10); d2 = rnd(n1 + 1, 10); } while (d1 === d2); }
      } else if (r < 0.2) {
        var b = properFrac(2, 5), k1 = rnd(1, 3), k2; do { k2 = rnd(1, 3); } while (k2 === k1);
        n1 = b[0] * k1; d1 = b[1] * k1; n2 = b[0] * k2; d2 = b[1] * k2;
      } else {
        var tr = 0;
        do { var dd = unlikePair(12, 72); d1 = dd[0]; d2 = dd[1]; n1 = rnd(1, d1 - 1); n2 = rnd(1, d2 - 1); }
        while ((gcd(n1, d1) > 1 || gcd(n2, d2) > 1) && ++tr < 40);
      }
      return { type: 'compare', a: [n1, d1], b: [n2, d2], ans: cmpSign(n1, d1, n2, d2) };
    },
    addsub: function (sr, sub) {
      var n1, d1, n2, d2, tries = 0;
      if (!sr) {
        d1 = d2 = rnd(3, 10);
        if (sub) { n1 = rnd(2, d1 - 1); n2 = rnd(1, n1 - 1); } else { n1 = rnd(1, d1 - 2); n2 = rnd(1, d1 - 1 - n1); }
      } else {
        do { var dd = unlikePair(10, 40); d1 = dd[0]; d2 = dd[1]; n1 = rnd(1, d1 - 1); n2 = rnd(1, d2 - 1); }
        while ((n1 * d2 === n2 * d1 || gcd(n1, d1) > 1 || gcd(n2, d2) > 1) && ++tries < 40);
        if (sub && n1 * d2 < n2 * d1) { var tn = n1, td = d1; n1 = n2; d1 = d2; n2 = tn; d2 = td; }
      }
      var R = solveAdd(n1, d1, n2, d2, sub);
      return { type: sub ? 'sub' : 'add', a: [n1, d1], b: [n2, d2], ans: R.ans, whole: !!sr };
    },
    mixed: function (sr) {
      if (!sr || Math.random() < 0.5) {
        var d = rnd(2, sr ? 12 : 6), n; do { n = rnd(d + 1, (sr ? 4 : 3) * d); } while (n % d === 0);
        return { type: 'mixed', dir: 'tm', n: n, d: d, ans: [n, d], whole: true };
      }
      var d2 = rnd(2, 12), w = rnd(1, 5), r = rnd(1, d2 - 1);
      return { type: 'mixed', dir: 'ti', w: w, r: r, d: d2, ans: [w * d2 + r, d2] };
    },
    shaded: function (sr) { var d = rnd(2, sr ? 12 : 8), n = rnd(1, d - 1); return { type: 'shaded', n: n, d: d, model: Math.random() < 0.5 ? 'pie' : 'bar', ans: [n, d] }; },
    story: function (sr) {
      var k = pick(['pizza', 'class', 'paise', 'walk', 'milk']), q = { type: 'story', kind: k, name: rnd(0, 7) };
      if (k === 'pizza') { q.d = pick([4, 6, 8, 10, 12]); q.n = rnd(1, q.d - 1); q.ans = [q.n, q.d]; }
      else if (k === 'class') { q.d = sr ? pick([24, 30, 32, 36, 40]) : pick([10, 12, 20]); q.n = rnd(2, q.d - 2); q.ans = [q.n, q.d]; }
      else if (k === 'paise') { q.n = pick([5, 10, 20, 25, 50, 75]); q.ans = reduce(q.n, 100); }
      else { var s = GEN.addsub(sr, k === 'milk'); q.a = s.a; q.b = s.b; q.ans = s.ans; q.whole = s.whole; }
      return q;
    }
  };
  function genQ(types, level) {
    var ty = pick(types), sr = level === 'senior';
    if (ty === 'add') return GEN.addsub(sr, false);
    if (ty === 'sub') return GEN.addsub(sr, true);
    return GEN[ty](sr);
  }
  function qKey(q) { return JSON.stringify(q); }
  function storyName(i) { var list = String(t('names')).split('|'); return list[i % list.length] || list[0]; }

  /* prompt text + maths for a question; box = the empty answer box */
  function qPrompt(q) {
    switch (q.type) {
      case 'simplify': return tE('pq_simplify');
      case 'compare': return tE('pq_compare');
      case 'add': return tE('pq_add');
      case 'sub': return tE('pq_sub');
      case 'mixed': return tE(q.dir === 'tm' ? 'pq_to_mixed' : 'pq_to_improper');
      case 'shaded': return tE('pq_shaded');
      case 'story':
        var v = { name: esc(storyName(q.name)) };
        if (q.kind === 'pizza' || q.kind === 'class') { v.n = q.n; v.d = q.d; }
        else if (q.kind === 'paise') v.n = q.n;
        else { v.a = M(F(q.a[0], q.a[1])); v.b = M(F(q.b[0], q.b[1])); }
        return money(tH('sq_' + q.kind, v));
    }
    return '';
  }
  function qMath(q, box) {
    switch (q.type) {
      case 'simplify': return M(F(q.n, q.d) + O('=') + box);
      case 'compare': return M(F(q.a[0], q.a[1]) + ' ' + box + ' ' + F(q.b[0], q.b[1]));
      case 'add': case 'sub': return M(F(q.a[0], q.a[1]) + O(q.type === 'sub' ? MINUS : '+') + F(q.b[0], q.b[1]) + O('=') + box);
      case 'mixed': return M((q.dir === 'tm' ? F(q.n, q.d) : MX(q.w, q.r, q.d)) + O('=') + box);
      case 'shaded': return M(box);
    }
    return '';
  }
  function qPic(q, small) {
    if (q.type !== 'shaded') return null;
    return q.model === 'pie' ? pie(q.n, q.d, { cls: 's1' }) : bars({ per: q.d, wholes: 1, segs: [[q.n, 's1']], h: small ? 70 : 84 });
  }
  function ansHTML(q) {
    if (q.type === 'compare') return esc(q.ans);
    if (q.type === 'mixed' && q.dir === 'tm') {
      var w = Math.floor(q.n / q.d), r = q.n % q.d, g = gcd(r, q.d);
      return MX(w, r, q.d) + (g > 1 ? O('=') + MX(w, r / g, q.d / g) : '');
    }
    if (q.type === 'mixed') {   /* mixed → improper: the answer is the improper fraction (not the mixed number again) */
      var rr = reduce(q.ans[0], q.ans[1]);
      return F(q.ans[0], q.ans[1]) + (rr[1] !== q.ans[1] ? O('=') + F(rr[0], rr[1]) : '');
    }
    return nice(q.ans[0], q.ans[1]);
  }
  function addChain(a, b, sub) {
    var R = solveAdd(a[0], a[1], b[0], b[1], sub), o = sub ? MINUS : '+', h = F(a[0], a[1]) + O(o) + F(b[0], b[1]);
    if (R.L !== a[1] || R.L !== b[1]) h += O('=') + F(R.x, R.L) + O(o) + F(R.y, R.L);
    h += O('=') + F(R.r, R.L);
    var red = R.ans;
    if (red[0] !== R.r) h += O('=') + V(red[0], red[1]);
    if (red[1] > 1 && red[0] > red[1]) h += O('=') + MX(Math.floor(red[0] / red[1]), red[0] % red[1], red[1]);
    return (R.L !== a[1] || R.L !== b[1] ? P(tE('ex_lcm', { a: a[1], b: b[1], l: R.L })) : '') + ML(h);
  }
  function explainHTML(q) {
    var g;
    switch (q.type) {
      case 'simplify': g = q.n / q.ans[0]; return P(tE('hcf_is', { a: q.n, b: q.d, g: g })) + ML(F(q.n, q.d) + O('=') + F(q.n + DIVS + g, q.d + DIVS + g) + O('=') + F(q.ans[0], q.ans[1]));
      case 'compare': return cmpExplain(q.a[0], q.a[1], q.b[0], q.b[1]);
      case 'add': case 'sub': return addChain(q.a, q.b, q.type === 'sub');
      case 'mixed':
        if (q.dir === 'tm') { var w = Math.floor(q.n / q.d), r = q.n % q.d; return P(tE('mixed_how', { n: q.n, d: q.d, w: w, r: r })) + ML(F(q.n, q.d) + O('=') + MX(w, r, q.d)); }
        return P(tE('mixed_back')) + ML(MX(q.w, q.r, q.d) + O('=') + F(q.w + TIMES + q.d + ' + ' + q.r, q.d) + O('=') + F(q.ans[0], q.ans[1]));
      case 'shaded': return P(tE('cap_parts', { n: q.n, d: q.d })) + ML(F(q.n, q.d) + (gcd(q.n, q.d) > 1 ? O('=') + nice(q.n, q.d) : ''));
      case 'story':
        if (q.kind === 'walk' || q.kind === 'milk') return addChain(q.a, q.b, q.kind === 'milk');
        if (q.kind === 'paise') return P(money(tE('paise_how'))) + ML(F(q.n, 100) + O('=') + nice(q.n, 100));
        return ML(F(q.n, q.d) + (gcd(q.n, q.d) > 1 ? O('=') + nice(q.n, q.d) : ''));
    }
    return '';
  }

  function newQuestion() {
    var types = st.p.types.length ? st.p.types : TYPES, q, tries = 0;
    do { q = genQ(types, st.p.level); } while (pq && qKey(q) === qKey(pq.q) && ++tries < 12);
    pq = { q: q, result: null, hint: null, num: pq ? (pq.result ? pq.num + 1 : pq.num) : 1 };
    ['#p-whole', '#p-num', '#p-den'].forEach(function (s) { var i = $(s); i.value = ''; i.disabled = false; });
    $$('#p-signs button').forEach(function (b) { b.disabled = false; b.classList.remove('right', 'wrongpick'); });
    renderPractice();
  }
  function renderPracticeSettings() {
    var box = $('#p-types');
    if (!box.children.length) {
      TYPES.forEach(function (ty) {
        var b = el('button', { type: 'button', class: 'chip', 'data-type': ty });
        b.addEventListener('click', function () {
          var on = st.p.types.indexOf(ty) >= 0;
          if (on && st.p.types.length === 1) { EDU.toast(t('need_one_type')); return; }
          st.p.types = on ? st.p.types.filter(function (x) { return x !== ty; }) : TYPES.filter(function (x) { return x === ty || st.p.types.indexOf(x) >= 0; });
          save(); renderPracticeSettings();
          if (pq && st.p.types.indexOf(pq.q.type) < 0) newQuestion();
        });
        box.appendChild(b);
      });
    }
    $$('#p-types .chip').forEach(function (b) { b.textContent = t('q_' + b.dataset.type); b.setAttribute('aria-pressed', st.p.types.indexOf(b.dataset.type) >= 0 ? 'true' : 'false'); });
    pressSeg('#p-level', 'level', st.p.level);
    var p = st.p;
    $('#p-score').innerHTML =
      '<span class="fl-pill">' + tE('score') + ' <b id="p-sc">' + p.c + '/' + p.n + '</b></span>' +
      '<span class="fl-pill">' + tE('streak_lbl') + ' <b id="p-streak">' + p.streak + '</b></span>' +
      '<span class="fl-pill">' + tE('best_streak_lbl') + ' <b>' + p.best + '</b></span>';
  }
  function renderPractice() {
    renderPracticeSettings();
    if (!pq) return;
    var q = pq.q, box = '<span class="fl-qbox">?</span>';
    var card = $('#p-q');
    card.dataset.type = q.type;
    card.dataset.q = JSON.stringify(q);
    $('#p-type').textContent = t('q_' + q.type);
    $('#p-num-lbl').textContent = t('q_n', { n: pq.num });
    $('#p-prompt').innerHTML = qPrompt(q);
    var mh = qMath(q, pq.result && q.type !== 'compare' ? M(ansHTML(q)) : (pq.result && q.type === 'compare' ? '<span class="fl-qbox">' + esc(q.ans) + '</span>' : box));
    $('#p-math').innerHTML = q.type === 'story' || q.type === 'shaded' ? '' : mh;
    var pic = $('#p-pic'); pic.textContent = '';
    var svg = qPic(q); if (svg) pic.appendChild(svg);
    var isCmp = q.type === 'compare';
    $('#p-signs').hidden = !isCmp;
    $('#p-fracans').hidden = isCmp;
    $('#p-whole-wrap').hidden = !q.whole;
    $$('#p-signs button').forEach(function (b) { b.setAttribute('aria-label', t('sign_' + SIGNKEY[b.dataset.sign])); });
    $('#p-check').hidden = isCmp || !!pq.result;
    $('#p-next').hidden = !pq.result;
    var fb = $('#p-fb');
    if (pq.result) {
      var r = pq.result, h = '<p class="fl-fbt">' + (r.ok ? '✅ ' + tE('correct') : '❌ ' + tE('wrong')) + '</p>';
      if (r.note) h += P(tE('fb_' + r.note));
      if (!r.ok) h += P(tH('fb_answer_is', { a: M(ansHTML(q)) }));
      h += explainHTML(q);
      fb.className = 'fl-feedback ' + (r.ok ? 'ok' : 'bad');
      fb.innerHTML = h;
    } else if (pq.hint) { fb.className = 'fl-feedback hint'; fb.innerHTML = P(tE(pq.hint), 'mb0'); }
    else { fb.className = 'fl-feedback'; fb.innerHTML = ''; }
  }
  function readNum(sel) {
    var v = latinDigits($(sel).value).trim();
    if (v === '') return null;
    if (!/^\d{1,4}$/.test(v)) return NaN;
    return parseInt(v, 10);
  }
  var practiceAt = 0;
  function practiceRecord(ok, note) {
    practiceAt = Date.now();
    var p = st.p;
    p.n++;
    if (ok) { p.c++; p.streak++; if (p.streak > p.best) p.best = p.streak; } else p.streak = 0;
    pq.result = { ok: ok, note: note || '' };
    pq.hint = null;
    save();
    ['#p-whole', '#p-num', '#p-den'].forEach(function (s) { $(s).disabled = true; });
    renderPractice();
    $('#p-next').focus();
  }
  function practiceCheck() {
    if (!pq || pq.result || pq.q.type === 'compare') return;
    var q = pq.q, w = q.whole ? readNum('#p-whole') : null, n = readNum('#p-num'), d = readNum('#p-den');
    var hint = null;
    if ([w, n, d].some(function (x) { return typeof x === 'number' && isNaN(x); })) hint = 'fb_digits';
    else if (w === null && n === null && d === null) hint = 'fb_empty';
    else if ((n === null) !== (d === null)) hint = 'fb_need_both';
    else if (d === 0) hint = 'fb_zero_den';
    if (hint) { pq.hint = hint; renderPractice(); return; }
    var vn, vd;
    if (n === null) { vn = w; vd = 1; } else { vn = (w || 0) * d + n; vd = d; }
    var equal = vn * q.ans[1] === q.ans[0] * vd, ok = equal, note = '';
    if (q.type === 'simplify') { ok = equal && !w && n === q.ans[0] && d === q.ans[1]; if (equal && !ok) note = 'not_simplest'; }
    else if (q.type === 'mixed' && q.dir === 'tm') { ok = equal && w >= 1 && n !== null && n > 0 && n < d; if (equal && !ok) note = 'not_mixed'; if (ok && gcd(n, d) > 1) note = 'could_simplify'; }
    else if (ok && n !== null && n > 0 && gcd(n, d) > 1) note = 'could_simplify';
    practiceRecord(ok, note);
  }
  $('#p-check').addEventListener('click', practiceCheck);
  $('#p-next').addEventListener('click', function () {
    if (Date.now() - practiceAt < GUARD_MS) return;   // double-click on Check / held Enter would skip the feedback
    newQuestion(); var f = pq.q.type === 'compare' ? $('#p-s-gt') : (pq.q.whole ? $('#p-whole') : $('#p-num')); if (f) f.focus();
  });
  ['#p-whole', '#p-num', '#p-den'].forEach(function (s) {
    $(s).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); practiceCheck(); } });
    $(s).addEventListener('input', function () { if (pq && pq.hint) { pq.hint = null; renderPractice(); } });
  });
  $$('#p-signs button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!pq || pq.result || pq.q.type !== 'compare') return;
      var ok = b.dataset.sign === pq.q.ans;
      $$('#p-signs button').forEach(function (x) { x.disabled = true; x.classList.toggle('right', x.dataset.sign === pq.q.ans); x.classList.toggle('wrongpick', x === b && !ok); });
      practiceRecord(ok, '');
    });
  });
  $$('#p-level button').forEach(function (b) {
    b.addEventListener('click', function () { if (st.p.level === b.dataset.level) return; st.p.level = b.dataset.level; save(); newQuestion(); });
  });
  $('#p-reset').addEventListener('click', function () { st.p.c = 0; st.p.n = 0; st.p.streak = 0; st.p.best = 0; save(); renderPracticeSettings(); });

  /* ---------- printable worksheet (20 questions + answer key) ---------- */
  function printWorksheet() {
    var types = st.p.types.length ? st.p.types : TYPES, qs = [], seen = {}, tries = 0;
    while (qs.length < 20 && tries++ < 400) {
      var q = genQ(types, st.p.level), k = qKey(q);
      if (seen[k]) continue;
      seen[k] = 1; qs.push(q);
    }
    var blank = '<span class="fl-wsbox"></span>';
    var h = '<div class="fl-ws-head"><h1>' + tE('ws_title') + '</h1>' +
      '<div class="fl-ws-meta"><span>' + tE('ws_name') + ': ____________________</span><span>' + tE('ws_class') + ': ________</span><span>' + tE('ws_date') + ': ____________</span></div>' +
      '<p class="fl-ws-sub">' + tE(st.p.level === 'senior' ? 'lvl_senior' : 'lvl_junior') + ' · ' + types.map(function (x) { return esc(t('q_' + x)); }).join(', ') + '</p></div><ol class="fl-ws-list">';
    qs.forEach(function (q) {
      var pic = qPic(q, true);
      h += '<li><p class="fl-ws-p">' + qPrompt(q) + '</p>' + (pic ? '<div class="fl-pic">' + pic.outerHTML + '</div>' : '') +
        (q.type === 'story' ? '<div>' + M(blank) + '</div>' : (q.type === 'shaded' ? '<div>' + M(blank) + '</div>' : '<div>' + qMath(q, blank) + '</div>')) + '</li>';
    });
    h += '</ol><div class="fl-ws-key"><h2>' + tE('ws_answers') + '</h2><ol>';
    qs.forEach(function (q) { h += '<li>' + M(ansHTML(q)) + '</li>'; });
    h += '</ol></div>';
    $('#worksheet').innerHTML = h;
    document.body.classList.add('fl-print-ws');
    var done = function () { document.body.classList.remove('fl-print-ws'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { try { window.print(); } catch (e) { } setTimeout(done, 1500); }, 50);
  }
  $('#p-print').addEventListener('click', printWorksheet);

  /* ===================================================== toolbar */
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen(); });
  $('#reset-all').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state');
    var tab = st.tab;
    st = defaults(); st.tab = tab; save();
    cmpRevealed = false; cmpPick = null; addReveal = 99; game = null; pq = null;
    renderAll();
    if (st.tab === 'practice') newQuestion();
  });

  function renderAll() {
    renderBuild(); renderCompare(); renderEquiv(); renderAdd(); renderLine();
    if (pq) renderPractice(); else renderPracticeSettings();
  }
  EDU.onLang(renderAll);
  var lastW = window.innerWidth, lastNarrow = isNarrow(), rT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      if (st.tab === 'line' && !dragging) renderLine();
      if (isNarrow() !== lastNarrow) { lastNarrow = isNarrow(); renderCompare(); renderAdd(); }   // bars: one whole per line on phones
    }, 200);
  });
  if (st.a.steps) addReveal = 1;
  renderAll();
  showTab(st.tab);
})();
