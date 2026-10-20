/* Trigonometry Lab: UI, state and drawing. Maths lives in engine.js (window.TRIG), localized quiz questions and
   word problems in content.js (window.APP_CONTENT). Everything runs on the device; state in EDU.store. */
(function () {
  'use strict';
  var SLUG = 'trigonometry-lab';
  var T = window.TRIG, store = EDU.store(SLUG);
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el;
  var FNS = T.FNS, MINUS = T.MINUS, RAD = T.RAD;
  var TABS = ['circle', 'table', 'hd', 'practice'], CASES = ['a', 'b', 'c', 'd', 'e'];
  var QN = 10, DRILL_N = 10, WS_N = 12;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  /* ------------------------------------------------------------------ helpers */
  function isRtl() { return document.documentElement.dir === 'rtl'; }
  /* EDU.t, but in Urdu every inserted value is wrapped in a left-to-right isolate so "10√3 ≈ 17.32 m" stays in one piece */
  function t(key, vars) {
    if (vars && isRtl()) { var o = {}; Object.keys(vars).forEach(function (k) { o[k] = '⁦' + vars[k] + '⁩'; }); vars = o; }
    return EDU.t(key, vars);
  }
  function num(v, lo, hi, d) { v = Number(v); if (!isFinite(v)) v = d; return Math.min(hi, Math.max(lo, v)); }
  function z(v) { return Math.abs(v) < 5e-7 ? 0 : v; }
  function fmt(n, dp) { return EDU.fmt(z(n), { maximumFractionDigits: dp === undefined ? 4 : dp }); }
  function f2(n) { return EDU.fmt(z(n), { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function r4(v) { return String(Math.round(v * 1e4) / 1e4); }
  function content() { var C = window.APP_CONTENT || {}; return C[EDU.lang] || C.en || {}; }
  function contentEn() { var C = window.APP_CONTENT || {}; return C.en || {}; }
  function ltr(text, cls) { return el('span', { class: 'ltr fx no-i18n' + (cls ? ' ' + cls : ''), text: text }); }
  function signText(v) { return v === null ? t('not_defined') : v > 0 ? '+' : v < 0 ? MINUS : '0'; }
  function exOrDec(ex, v) { if (v === null) return t('not_defined'); return ex !== null && ex !== undefined ? ex : fmt(v, 4); }
  function ratioStr(q) { return q.ex ? q.ex : '≈ ' + fmt(q.val, 4); }
  function lenStr(q) {
    var ex = T.surd.str(q.surd);
    if (ex && ex.indexOf('√') >= 0 && ex.length <= 26) return t('ans_exact', { ex: ex, dec: f2(q.val) });
    return t('ans_dec', { dec: f2(q.val) });
  }
  function fmtVar(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return fmt(v, 4);
    if (typeof v === 'string') return v;
    if (v.kind === 'ratio') return ratioStr(v);
    if (v.kind === 'len') return lenStr(v);
    return String(v);
  }
  /* translated template where every {var} becomes a left-to-right span. In Urdu (RTL) every maths run
     ("tan {a}° = h ÷ {d}") is kept together in one left-to-right isolate so formulas read correctly. */
  var RTL_RUN = /[\u0600-\u06FF\u0750-\u077F][\s\S]*?(?=[A-Za-z0-9√π²θ≈{(]|$)|[^\u0600-\u06FF\u0750-\u077F]+/g;
  function tn(key, vars) {
    var frag = document.createDocumentFragment(), rtl = isRtl(), buf = '';
    var flush = function () { if (buf) { frag.appendChild(ltr(buf)); buf = ''; } };
    EDU.t(key).split(/(\{\w+\})/).forEach(function (part) {
      var m = /^\{(\w+)\}$/.exec(part);
      if (m) {
        var v = vars[m[1]], txt = v === undefined ? part : fmtVar(v);
        if (rtl) buf += txt; else frag.appendChild(v === undefined ? document.createTextNode(part) : ltr(txt));
        return;
      }
      if (!part) return;
      if (!rtl) { frag.appendChild(document.createTextNode(part)); return; }
      (part.match(RTL_RUN) || [part]).forEach(function (run) {
        if (/[\u0600-\u06FF\u0750-\u077F]/.test(run)) { flush(); frag.appendChild(document.createTextNode(run)); }
        else if (!buf && !run.trim()) frag.appendChild(document.createTextNode(run));
        else buf += run;
      });
    });
    flush();
    return frag;
  }
  function thetaText(deg) {
    var n = T.normDeg(deg), frac = T.radFrac(n);
    return 'θ = ' + fmt(n, 2) + '°' + (frac ? ' = ' + frac : '') + ' ≈ ' + fmt(n * RAD, 4) + ' rad';
  }
  function debounce(fn, ms) { var h; return function () { clearTimeout(h); h = setTimeout(fn, ms); }; }

  /* ------------------------------------------------------------------ state */
  var S;
  function defaults() {
    return {
      tab: 'circle',
      uc: { deg: 30, snap: true, tan: true, labels: true },
      calc: { text: '30', unit: 'deg' },
      inv: { fn: 'sin', text: '1/2' },
      conv: { deg: 30 },
      hd: {
        cur: 'a',
        a: { d: 30, a1: 30, e: 0 },
        b: { H: 72.5, a1: 45, a2: 0, e: 0 },
        c: { d: 20, a1: 60, a2: 30, side: 'same', e: 0 },
        d: { known: 'dist', d: 10, f: 5, a1: 30, a2: 60, e: 0 },
        e: { known: 'L', L: 10, h: 5, x: 5, a1: 60 }
      },
      drill: { level: 1, best: { l1: null, l2: null } },
      quiz: null
    };
  }
  function str(v, max, d) { return typeof v === 'string' ? v.slice(0, max) : d; }
  function quizIds() { return (contentEn().identities || []).map(function (q) { return q.id; }); }
  function cleanQuiz(q) {
    var ids = quizIds();
    if (!q || typeof q !== 'object' || !Array.isArray(q.order)) return null;
    var order = q.order.filter(function (id, i, arr) { return ids.indexOf(id) >= 0 && arr.indexOf(id) === i; });
    if (order.length !== ids.length) return null;
    var i = q.i | 0;
    if (i < 0 || i >= order.length) return null;
    return { order: order, i: i, score: Math.max(0, Math.min(i + 1, q.score | 0)), picked: [0, 1, 2, 3].indexOf(q.picked) >= 0 ? q.picked : null, done: !!q.done };
  }
  function cleanBest(b) {
    if (!b || typeof b !== 'object' || !isFinite(b.score) || !isFinite(b.time)) return null;
    return { score: Math.round(num(b.score, 0, DRILL_N, 0)), time: num(b.time, 0, 36000, 0) };
  }
  /* every stored value is checked (type, range, enum): a damaged save falls back field by field */
  function load() {
    var o = defaults(), s = store.get('state', null);
    if (!s || typeof s !== 'object') return o;
    if (TABS.indexOf(s.tab) >= 0) o.tab = s.tab;
    if (s.uc && typeof s.uc === 'object') { o.uc.deg = num(s.uc.deg, -36000, 36000, 30); o.uc.snap = s.uc.snap !== false; o.uc.tan = s.uc.tan !== false; o.uc.labels = s.uc.labels !== false; }
    if (s.calc && typeof s.calc === 'object') { o.calc.text = str(s.calc.text, 40, '30'); o.calc.unit = s.calc.unit === 'rad' ? 'rad' : 'deg'; }
    if (s.inv && typeof s.inv === 'object') { o.inv.fn = FNS.indexOf(s.inv.fn) >= 0 ? s.inv.fn : 'sin'; o.inv.text = str(s.inv.text, 40, '1/2'); }
    if (s.conv && typeof s.conv === 'object') o.conv.deg = num(s.conv.deg, -1e7, 1e7, 30);
    if (s.hd && typeof s.hd === 'object') {
      if (CASES.indexOf(s.hd.cur) >= 0) o.hd.cur = s.hd.cur;
      CASES.forEach(function (c) {
        var src = s.hd[c], dst = o.hd[c];
        if (!src || typeof src !== 'object') return;
        Object.keys(dst).forEach(function (k) {
          if (k === 'side') dst.side = src.side === 'opp' ? 'opp' : 'same';
          else if (k === 'known') dst.known = (c === 'd' ? ['dist', 'flag'] : ['L', 'h', 'x']).indexOf(src.known) >= 0 ? src.known : dst.known;
          else dst[k] = num(src[k], 0, 1e7, dst[k]);
        });
      });
    }
    if (s.drill && typeof s.drill === 'object') {
      o.drill.level = s.drill.level === 2 ? 2 : 1;
      if (s.drill.best && typeof s.drill.best === 'object') { o.drill.best.l1 = cleanBest(s.drill.best.l1); o.drill.best.l2 = cleanBest(s.drill.best.l2); }
    }
    o.quiz = cleanQuiz(s.quiz);
    return o;
  }
  function save() { store.set('state', S); }
  var saveSoon = debounce(save, 250);
  S = load();

  /* ------------------------------------------------------------------ tabs */
  function showTab(name) {
    if (TABS.indexOf(name) < 0) name = 'circle';
    S.tab = name; saveSoon();
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.id === 'tab-' + name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#' + b.getAttribute('data-panel')).hidden = !on;
    });
    if (name === 'circle') { sizeCanvas(); draw(); }
  }
  $$('#tabs [role="tab"]').forEach(function (b, i, all) {
    b.addEventListener('click', function () { showTab(b.id.slice(4)); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      if (isRtl()) d = -d;
      var nx = all[(i + d + all.length) % all.length]; nx.focus(); nx.click();
    });
  });

  /* ================================================================== UNIT CIRCLE */
  var cv = $('#cv'), ctx = cv.getContext('2d'), CW = 320, DPR = 1, ucTop = $('#uc-top');
  function fsOn() { return document.fullscreenElement === ucTop || document.webkitFullscreenElement === ucTop; }
  function sizeCanvas() {
    var w = cv.parentNode.clientWidth || 320, size;
    if (fsOn()) size = Math.min(w, window.innerHeight - 60);
    else size = Math.min(w, Math.max(280, (window.innerHeight || 800) - 150));
    size = Math.max(240, Math.round(size));
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    CW = size;
    cv.width = Math.round(size * DPR); cv.height = cv.width;
    cv.style.width = size + 'px'; cv.style.height = size + 'px'; cv.style.margin = '0 auto';
  }
  function colors() {
    return {
      bg: EDU.css('--surface'), text: EDU.css('--text'), muted: EDU.css('--muted'), grid: EDU.css('--border'),
      rad: EDU.css('--primary'), sin: EDU.css('--c2'), cos: EDU.css('--c7'), tan: EDU.css('--c3'), arc: EDU.css('--c5'),
      handle: EDU.css('--accent'), soft: EDU.css('--surface-2'), ok: EDU.css('--success')
    };
  }
  function draw() {
    if (!CW || $('#panel-circle').hidden) return;
    var C = colors(), W = CW, cx = W / 2, cy = W / 2, R = W * 0.33, deg = T.normDeg(S.uc.deg), th = deg * RAD;
    var r = T.ratios(deg), s = r.sin, c = r.cos, tan = r.tan;
    var FONT = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
    var fs = Math.max(11, Math.round(W / 30)), big = Math.round(fs * 1.25);
    function X(x) { return cx + x * R; } function Y(y) { return cy - y * R; }
    function text(str, x, y, color, align, base, size, weight, halo) {
      ctx.font = (weight || 600) + ' ' + (size || fs) + 'px ' + FONT;
      ctx.textAlign = align || 'left'; ctx.textBaseline = base || 'middle';
      if (halo !== false) { ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = C.bg; ctx.strokeText(str, x, y); }
      ctx.fillStyle = color; ctx.fillText(str, x, y);
    }
    function seg(x1, y1, x2, y2, color, w, dash) {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, W);

    /* quadrant tints */
    var qd = T.quadrant(deg);
    if (qd) {
      ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = C.rad;
      ctx.fillRect(qd === 1 || qd === 4 ? cx : 0, qd <= 2 ? 0 : cy, cx, cy); ctx.restore();
    }
    /* grid at ±0.5 */
    ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath();
    [-0.5, 0.5].forEach(function (v) { ctx.moveTo(X(v), 0); ctx.lineTo(X(v), W); ctx.moveTo(0, Y(v)); ctx.lineTo(W, Y(v)); });
    ctx.stroke(); ctx.restore();
    /* axes */
    seg(6, cy, W - 6, cy, C.muted, 1.2); seg(cx, 6, cx, W - 6, C.muted, 1.2);
    text('x', W - 10, cy + 12, C.muted, 'right', 'middle', fs, 700); text('y', cx + 8, 12, C.muted, 'left', 'middle', fs, 700);
    [[1, 0, '1'], [-1, 0, '−1'], [0, 1, '1'], [0, -1, '−1']].forEach(function (p) {
      seg(X(p[0]) - (p[1] ? 5 : 0), Y(p[1]) - (p[0] ? 5 : 0), X(p[0]) + (p[1] ? 5 : 0), Y(p[1]) + (p[0] ? 5 : 0), C.muted, 1.5);
      if (p[0]) text(p[2], X(p[0]), cy + 14, C.muted, 'center', 'middle', fs - 1, 600, false);
      else text(p[2], cx - 8, Y(p[1]), C.muted, 'right', 'middle', fs - 1, 600, false);
    });
    /* quadrant names with the sign rule */
    var ql = [['I', 'All'], ['II', 'sin'], ['III', 'tan'], ['IV', 'cos']], qp = [[0.8, 0.82], [-0.8, 0.82], [-0.8, -0.82], [0.8, -0.82]];
    ql.forEach(function (q, i) {
      var on = qd === i + 1;
      text(q[0] + ' · ' + q[1] + ' +', X(qp[i][0]) + (i === 0 || i === 3 ? 10 : -10), Y(qp[i][1]), on ? C.text : C.muted, i === 0 || i === 3 ? 'left' : 'right', 'middle', fs - 1, on ? 800 : 600, false);
    });

    /* circle */
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.strokeStyle = C.text; ctx.lineWidth = 2; ctx.stroke();

    /* tangent line at (1, 0) and the tan segment */
    var px = X(c), py = Y(s), showTan = S.uc.tan;
    if (showTan) {
      seg(X(1), 8, X(1), W - 8, C.tan, 1, [4, 4]);
      if (tan !== null) {
        var lim = (W / 2 - 12) / R, tv = Math.max(-lim, Math.min(lim, tan)), clipped = Math.abs(tan) > lim;
        /* extended radius through P meets the tangent line at (1, tan θ) */
        seg(cx, cy, X(1), Y(tv), C.rad, 1, [5, 4]);
        if (c < 0 && Math.abs(tan) <= lim) seg(cx, cy, cx - (X(1) - cx) * 1, cy + (Y(tv) - cy) * 1, C.rad, 1, [5, 4]);
        seg(X(1), Y(0), X(1), Y(tv), C.tan, 5);
        if (clipped) text(tan > 0 ? '↑' : '↓', X(1), Y(tv) + (tan > 0 ? -10 : 10), C.tan, 'center', 'middle', big, 800);
        if (Math.abs(tv) * R > 14) text('tan θ', X(1) + 8, Y(tv / 2), C.tan, 'left', 'middle', fs, 800);
      } else {
        seg(cx, cy, cx, s > 0 ? 8 : W - 8, C.rad, 1, [5, 4]);
        text('tan θ: ' + t('not_defined'), X(1) + 8, cy - 24, C.tan, 'left', 'middle', fs - 1, 800);
      }
    }
    /* angle arc */
    if (deg > 0.3) {
      ctx.save(); ctx.strokeStyle = C.arc; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.24, 0, -th, true); ctx.stroke();
      var ex = cx + R * 0.24 * Math.cos(th), ey = cy - R * 0.24 * Math.sin(th), ta = th + Math.PI / 2;
      ctx.fillStyle = C.arc; ctx.beginPath(); ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 7 * Math.cos(ta - 0.5), ey + 7 * Math.sin(ta - 0.5)); ctx.lineTo(ex - 7 * Math.cos(ta + 0.5), ey + 7 * Math.sin(ta + 0.5)); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    var la = Math.max(th / 2, 0.16), lr = R * (deg < 40 ? 0.42 : 0.36);
    text('θ = ' + fmt(deg, 1) + '°', cx + lr * Math.cos(la), cy - lr * Math.sin(la), C.arc, 'center', 'middle', fs, 800);
    /* legs of the right triangle */
    seg(cx, cy, px, cy, C.cos, 5);
    seg(px, cy, px, py, C.sin, 5);
    if (Math.abs(c) * R > 10 && Math.abs(s) * R > 10) {
      var k = 9, sx = c > 0 ? -1 : 1, sy = s > 0 ? -1 : 1;
      seg(px + sx * k, cy, px + sx * k, cy + sy * k, C.muted, 1.2); seg(px + sx * k, cy + sy * k, px, cy + sy * k, C.muted, 1.2);
    }
    if (Math.abs(c) * R > 26) text('cos θ', (cx + px) / 2, cy + (s >= 0 ? 14 : -14), C.cos, 'center', 'middle', fs, 800);
    var sinLeft = c < 0 || (showTan && c > 0.72);   /* near the tangent line the label moves to the inner side */
    if (Math.abs(s) * R > 26) text('sin θ', px + (sinLeft ? -8 : 8), (cy + py) / 2, C.sin, sinLeft ? 'right' : 'left', 'middle', fs, 800);
    /* radius and point */
    seg(cx, cy, px, py, C.rad, 3.5);
    ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fillStyle = C.text; ctx.fill();
    text('O', cx - 8, cy + 12, C.muted, 'right', 'middle', fs - 1, 700, false);
    ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fillStyle = C.handle; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.bg; ctx.stroke();
    if (S.uc.labels) {
      var pl = 'P(' + fmt(c, 2) + ', ' + fmt(s, 2) + ')', ly = py + (s >= 0 ? -14 : 14);
      ctx.font = '800 ' + fs + 'px ' + FONT;
      var pw = ctx.measureText(pl).width, pLeft = c < 0 || px + 16 + pw > W - 4;   /* keep the label inside the canvas */
      text(pl, px + (pLeft ? -16 : 16), ly, C.text, pLeft ? 'right' : 'left', 'middle', fs, 800);
      /* readout box */
      var lines = [[thetaText(deg).replace(' ≈ ', '  ≈ '), C.text], ['sin θ = ' + exOrDec(null, s), C.sin], ['cos θ = ' + exOrDec(null, c), C.cos], ['tan θ = ' + exOrDec(null, tan), C.tan]];
      var bw = 0; ctx.font = '800 ' + fs + 'px ' + FONT;
      lines.forEach(function (L) { bw = Math.max(bw, ctx.measureText(L[0]).width); });
      ctx.save(); ctx.globalAlpha = 0.92; ctx.fillStyle = C.soft;
      var bx = 8, by = 8, bh = lines.length * (fs + 7) + 10;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, bw + 20, bh, 10) : ctx.rect(bx, by, bw + 20, bh); ctx.fill(); ctx.restore();
      lines.forEach(function (L, i) { text(L[0], bx + 10, by + 10 + (fs + 7) * i + fs / 2, L[1], 'left', 'middle', fs, 800, false); });
    }
  }

  /* pointer drag: the angle follows the finger / mouse; snapping jumps to the standard angles */
  var dragging = false;
  function angleFromEvent(e) {
    var rect = cv.getBoundingClientRect(), x = (e.clientX - rect.left) * (CW / rect.width) - CW / 2, y = CW / 2 - (e.clientY - rect.top) * (CW / rect.height);
    var a = Math.atan2(y, x) / RAD; if (a < 0) a += 360;
    return S.uc.snap ? T.snap(a) : Math.round(a);
  }
  cv.addEventListener('pointerdown', function (e) {
    dragging = true; try { cv.setPointerCapture(e.pointerId); } catch (x) { }
    setDeg(angleFromEvent(e)); e.preventDefault(); cv.focus({ preventScroll: true });
  });
  cv.addEventListener('pointermove', function (e) { if (!dragging) return; setDeg(angleFromEvent(e)); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { cv.addEventListener(ev, function () { if (dragging) { dragging = false; save(); } }); });
  cv.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 15 : 1, d = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') d = step; else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') d = -step;
    else if (e.key === 'Home') { setDeg(0); e.preventDefault(); return; }
    if (!d) return;
    e.preventDefault(); setDeg(T.normDeg(Math.round(T.normDeg(S.uc.deg)) + d));
  });
  function setDeg(d, fromInput) { S.uc.deg = num(d, -36000, 36000, 0); saveSoon(); renderCircle(fromInput); }

  $('#uc-deg').addEventListener('input', function () { var v = Number(T.toLatin(this.value)); if (this.value === '' || !isFinite(v)) return; setDeg(v, true); });
  $('#uc-range').addEventListener('input', function () { setDeg(Number(this.value)); });
  $('#uc-snap').addEventListener('click', function () { S.uc.snap = !S.uc.snap; if (S.uc.snap) S.uc.deg = T.snap(S.uc.deg); save(); syncUc(); renderCircle(); });
  $('#uc-prev').addEventListener('click', function () { setDeg(T.nextStd(S.uc.deg, -1)); });
  $('#uc-next').addEventListener('click', function () { setDeg(T.nextStd(S.uc.deg, 1)); });
  $('#uc-tan').addEventListener('change', function () { S.uc.tan = this.checked; save(); draw(); });
  $('#uc-labels').addEventListener('change', function () { S.uc.labels = this.checked; save(); draw(); });
  $('#uc-fs').addEventListener('click', function () { EDU.fullscreen(ucTop); });
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) { document.addEventListener(ev, function () { setTimeout(function () { sizeCanvas(); draw(); }, 60); }); });

  function syncUc() {
    $('#uc-snap').setAttribute('aria-pressed', S.uc.snap ? 'true' : 'false');
    $('#uc-tan').checked = !!S.uc.tan; $('#uc-labels').checked = !!S.uc.labels;
  }
  function renderCircle(fromInput) {
    var raw = S.uc.deg, n = T.normDeg(raw), r = T.ratios(n), ex = T.exact(n), q = T.quadrant(n);
    var inp = $('#uc-deg');
    if (!fromInput && document.activeElement !== inp) inp.value = String(Math.round(raw * 100) / 100);
    else if (!fromInput) inp.value = String(Math.round(raw * 100) / 100);
    $('#uc-range').value = String(Math.round(n));
    $('#uc-theta').textContent = thetaText(n);
    $('#uc-theta').setAttribute('data-deg', r4(n));
    $('#uc-quad').textContent = q ? t('quad_' + q) : t('quad_axis');
    $('#uc-quad').setAttribute('data-q', String(q));
    $('#uc-ref').textContent = fmt(T.refAngle(n), 2) + '°';
    $$('#uc-astc span').forEach(function (sp) { sp.classList.toggle('on', +sp.dataset.q === q); });
    var red = $('#uc-reduced'), out = raw < 0 || raw >= 360;
    red.hidden = !out;
    if (out) red.textContent = t('reduced_note', { a: fmt(raw, 2), b: fmt(n, 2) });
    var tb = $('#uc-six tbody'); tb.innerHTML = '';
    FNS.forEach(function (fn) {
      var v = r[fn];
      tb.appendChild(el('tr', { id: 'ucr-' + fn, dataset: { fn: fn, v: v === null ? 'nd' : r4(v) } },
        el('td', { class: 'fnm ltr fx no-i18n', text: fn + ' θ' }),
        el('td', { class: 'no-i18n' }, ex ? (ex[fn] === null ? el('span', { class: 'nd', text: t('not_defined') }) : ex[fn]) : '–'),
        el('td', { class: 'no-i18n' }, v === null ? el('span', { class: 'nd', text: t('not_defined') }) : fmt(v, 4)),
        el('td', { class: 'no-i18n', text: signText(v) })));
    });
    draw();
  }

  /* ================================================================== TABLE + CALCULATOR */
  var STD5 = [0, 30, 45, 60, 90];
  function buildStdTable() {
    var tbl = $('#std-table'); tbl.innerHTML = '';
    var head = el('tr', {}, el('th', { text: 'θ' }));
    STD5.forEach(function (a) {
      head.appendChild(el('th', {}, el('button', { type: 'button', dataset: { deg: String(a) }, text: a + '°', 'data-i18n-title': 'table_note',
        onclick: function () { setDeg(a); showTab('circle'); } })));
    });
    tbl.appendChild(el('thead', {}, head));
    var body = el('tbody');
    FNS.forEach(function (fn) {
      var tr = el('tr', { dataset: { fn: fn } }, el('td', { text: fn + ' θ' }));
      STD5.forEach(function (a) { var e = T.exact(a)[fn]; tr.appendChild(el('td', { dataset: { deg: String(a) } }, e === null ? el('span', { class: 'ndc', text: t('not_defined') }) : e)); });
      body.appendChild(tr);
      if (T.TRICK[fn]) {
        var tk = el('tr', { class: 'trick' }, el('td', { text: t('trick_row') }));
        T.TRICK[fn].forEach(function (s) { tk.appendChild(el('td', { text: s })); });
        body.appendChild(tk);
      }
    });
    tbl.appendChild(body);
    var comp = $('#comp-list'); comp.innerHTML = '';
    ['sin 30° = cos 60° = 1/2', 'cos 30° = sin 60° = √3/2', 'tan 30° = cot 60° = 1/√3', 'sin 45° = cos 45° = 1/√2', 'sec 30° = cosec 60° = 2/√3'].forEach(function (s) {
      comp.appendChild(el('span', { text: s }));
    });
  }

  /* --- ratio calculator --- */
  var CALC_EX = ['30', '45', '150', '390', '-45', 'pi/6', '2pi/3', '5pi/4'];
  function buildCalcChips() {
    var box = $('#calc-examples'); box.innerHTML = '';
    CALC_EX.forEach(function (x, i) {
      box.appendChild(el('button', { type: 'button', class: 'chip', id: 'cx-' + i, dir: 'ltr', text: x, onclick: function () {
        S.calc.text = x; if (/pi/.test(x)) S.calc.unit = 'rad'; else S.calc.unit = 'deg';
        $('#calc-in').value = x; save(); syncCalc(); renderCalc();
      } }));
    });
  }
  function syncCalc() { $$('#calc-unit button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === S.calc.unit)); }); }
  $('#calc-unit').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.calc.unit = b.dataset.v; save(); syncCalc(); renderCalc(); });
  $('#calc-in').addEventListener('input', function () { S.calc.text = this.value.slice(0, 40); saveSoon(); renderCalc(); });
  function renderCalc() {
    var box = $('#calc-out'); box.innerHTML = '';
    var p = T.parseAngle(S.calc.text, S.calc.unit);
    if (!p) { box.appendChild(el('p', { class: 'callout danger mb0', id: 'calc-bad', text: t('calc_bad') })); box.removeAttribute('data-deg'); return; }
    var n = T.normDeg(p.deg), r = T.ratios(n), ex = T.exact(n), q = T.quadrant(n), std = T.isStandard(n);
    box.setAttribute('data-deg', r4(n));
    var head = thetaText(n);
    if (Math.abs(p.deg - n) > 1e-7) head = fmt(p.deg, 4) + '° → ' + head;
    box.appendChild(el('div', { class: 'calc-head ltr fx no-i18n', id: 'calc-head', text: head }));
    box.appendChild(el('div', { class: 'calc-facts' },
      el('span', {}, t('quadrant') + ': ', el('b', { text: q ? t('quad_' + q) : t('quad_axis') })),
      el('span', {}, t('ref_angle') + ': ', el('b', { class: 'ltr fx', text: fmt(T.refAngle(n), 2) + '°' }))));
    box.appendChild(el('p', { class: 'small muted mb0', text: t(std ? 'calc_std' : 'calc_nonstd') }));
    var tb = el('tbody');
    FNS.forEach(function (fn) {
      var v = r[fn];
      tb.appendChild(el('tr', { dataset: { fn: fn, v: v === null ? 'nd' : r4(v) } },
        el('td', { class: 'ltr fx no-i18n', text: fn + ' θ' }),
        el('td', { class: 'ex no-i18n' }, v === null ? el('span', { class: 'nd', text: t('not_defined') }) : (ex ? ex[fn] : '–')),
        el('td', { class: 'dec no-i18n' }, v === null ? el('span', { class: 'nd', text: t('not_defined') }) : fmt(v, 4))));
    });
    box.appendChild(el('div', { class: 'scroll-x' }, el('table', { class: 'table calc-tbl', id: 'calc-tbl' },
      el('thead', {}, el('tr', {}, el('th', { text: t('col_ratio') }), el('th', { text: t('col_exact') }), el('th', { text: t('col_decimal') }))), tb)));
  }

  /* --- inverse functions --- */
  var INV_EX = ['1/2', '√3/2', '1/√2', '1', '-1/2', '√3', '2/√3', '0.6'];
  function buildInvChips() {
    var box = $('#inv-examples'); box.innerHTML = '';
    INV_EX.forEach(function (x, i) {
      box.appendChild(el('button', { type: 'button', class: 'chip', id: 'ix-' + i, dir: 'ltr', text: x, onclick: function () { S.inv.text = x; $('#inv-val').value = x; save(); renderInv(); } }));
    });
  }
  $('#inv-fn').addEventListener('change', function () { S.inv.fn = this.value; save(); renderInv(); });
  $('#inv-val').addEventListener('input', function () { S.inv.text = this.value.slice(0, 40); saveSoon(); renderInv(); });
  function renderInv() {
    var box = $('#inv-out'); box.innerHTML = ''; box.removeAttribute('data-deg');
    var x = T.parseValue(S.inv.text), fn = S.inv.fn;
    if (x === null) { box.appendChild(el('p', { class: 'callout danger mb0', text: t('inv_bad') })); return; }
    var res = T.inverse(fn, x);
    if (!res.ok) {
      box.appendChild(el('p', { class: 'callout danger mb0', id: 'inv-domain' }, tn('inv_domain', { fn: fn + '⁻¹', range: t(res.err === 'cs' ? 'inv_range_cs' : 'inv_range_sc') })));
      return;
    }
    box.setAttribute('data-deg', r4(res.deg));
    var frac = T.radFrac(res.deg);
    var txt = fn + '⁻¹(' + S.inv.text.trim() + ') = ' + fmt(res.deg, 2) + '°' + (frac ? ' = ' + frac : '') + ' ≈ ' + fmt(res.deg * RAD, 4) + ' rad';
    box.appendChild(el('p', { class: 'muted small', text: t('inv_result') }));
    box.appendChild(el('div', { class: 'inv-res ltr fx no-i18n', id: 'inv-res', text: txt }));
    if (!res.standard) box.appendChild(el('p', { class: 'small muted mb0', text: t('calc_nonstd') }));
  }

  /* --- degrees ↔ radians --- */
  var convLock = false;
  function renderConv(from) {
    var d = S.conv.deg, frac = T.radFrac(d);
    if (from !== 'deg') $('#conv-deg').value = String(Math.round(d * 1e6) / 1e6);
    if (from !== 'rad') $('#conv-rad').value = String(Math.round(d * RAD * 1e6) / 1e6);
    $('#conv-note').textContent = fmt(d, 4) + '° = ' + (frac ? frac + ' rad ≈ ' : '') + fmt(d * RAD, 6) + ' rad';
    $('#conv-note').setAttribute('data-rad', String(Math.round(d * RAD * 1e6) / 1e6));
  }
  $('#conv-deg').addEventListener('input', function () {
    if (convLock) return; var v = Number(T.toLatin(this.value)); if (this.value === '' || !isFinite(v)) return;
    convLock = true; S.conv.deg = num(v, -1e7, 1e7, 0); saveSoon(); renderConv('deg'); convLock = false;
  });
  $('#conv-rad').addEventListener('input', function () {
    if (convLock) return; var p = T.parseAngle(this.value, 'rad'); if (!p) return;
    convLock = true; S.conv.deg = num(p.deg, -1e7, 1e7, 0); saveSoon(); renderConv('rad'); convLock = false;
  });

  /* ================================================================== HEIGHTS AND DISTANCES */
  function hdFields(c, v) {
    var F = [], n = function (k, key) { F.push({ k: k, key: key, type: 'num' }); }, sel = function (k, key, opts) { F.push({ k: k, key: key, type: 'sel', opts: opts }); };
    switch (c) {
      case 'a': n('d', 'in_dist'); n('a1', 'in_elev'); n('e', 'in_eye'); break;
      case 'b': n('H', 'in_height'); n('a1', 'in_depr'); n('a2', 'in_depr2'); n('e', 'in_eye'); break;
      case 'c': sel('side', 'side_label', [['same', 'side_same'], ['opp', 'side_opp']]); n('d', 'in_gap');
        n('a1', v.side === 'opp' ? 'in_a_p1' : 'in_a_near'); n('a2', v.side === 'opp' ? 'in_a_p2' : 'in_a_far'); n('e', 'in_eye'); break;
      case 'd': sel('known', 'known_label', [['dist', 'known_dist'], ['flag', 'known_flag']]);
        if (v.known === 'flag') n('f', 'in_flag'); else n('d', 'in_dist');
        n('a1', 'in_a_tower'); n('a2', 'in_a_flag'); n('e', 'in_eye'); break;
      case 'e': sel('known', 'known_label', [['L', 'known_len'], ['h', 'known_h'], ['x', 'known_x']]);
        if (v.known === 'h') n('h', 'in_wall_h'); else if (v.known === 'x') n('x', 'in_foot'); else n('L', 'in_ladder');
        n('a1', 'in_a_ground'); break;
    }
    return F;
  }
  function buildHdForm() {
    var c = S.hd.cur, v = S.hd[c], box = $('#hd-inputs'); box.innerHTML = '';
    $('#hd-case').value = c;
    hdFields(c, v).forEach(function (f) {
      var id = 'hd-' + f.k, input;
      if (f.type === 'sel') {
        input = el('select', { id: id, onchange: function () { v[f.k] = this.value; save(); buildHdForm(); renderHd(); } },
          f.opts.map(function (o) { return el('option', { value: o[0], i18n: o[1] }); }));
        input.value = v[f.k];
      } else {
        input = el('input', { id: id, type: 'number', step: 'any', inputmode: 'decimal', min: '0', class: 'no-i18n ltr fx', autocomplete: 'off',
          value: isFinite(v[f.k]) ? String(v[f.k]) : '',
          oninput: function () { var x = Number(T.toLatin(this.value)); v[f.k] = this.value === '' || !isFinite(x) ? NaN : x; saveSoon(); renderHd(); } });
      }
      box.appendChild(el('div', { class: 'field' }, el('label', { for: id, i18n: f.key }), input));
    });
  }
  $('#hd-case').addEventListener('change', function () { S.hd.cur = CASES.indexOf(this.value) >= 0 ? this.value : 'a'; save(); buildHdForm(); renderHd(); });

  function renderHd() {
    var c = S.hd.cur, v = S.hd[c], res = T.solveHD(c, v), box = $('#hd-result'); box.innerHTML = '';
    box.setAttribute('data-ok', res.ok ? '1' : '0');
    if (!res.ok) {
      box.appendChild(el('p', { class: 'callout danger mb0', id: 'hd-err', dataset: { err: res.err }, text: t(res.err) }));
      drawHd(c, null, v); return;
    }
    box.appendChild(el('h2', { text: t('hd_answer') }));
    var list = el('div', { class: 'hd-res' });
    res.results.forEach(function (r) {
      list.appendChild(el('div', { class: 'r', id: 'hd-' + r.key, dataset: { v: r4(r.val), ex: r.ex || '' } },
        el('span', { class: 'k', text: t(r.key) }), ltr(lenStr(r), 'v')));
    });
    box.appendChild(list);
    box.appendChild(el('h3', { text: t('hd_steps') }));
    box.appendChild(el('ol', { class: 'steps', id: 'hd-steps' }, res.steps.map(function (st) { return el('li', {}, tn(st.key, st.vars)); })));
    drawHd(c, res.geo, v);
  }

  /* --- SVG diagram (to scale; CSS variables colour it, so dark mode needs no redraw) --- */
  var G = 212;
  function r1(v) { return String(Math.round(v * 10) / 10); }
  function sv(tag, attrs, inner) {
    var s = '<' + tag; Object.keys(attrs).forEach(function (k) { if (attrs[k] !== undefined && attrs[k] !== null) s += ' ' + k + '="' + String(attrs[k]).replace(/"/g, '&quot;') + '"'; });
    return s + (inner === undefined ? '/>' : '>' + inner + '</' + tag + '>');
  }
  function line(x1, y1, x2, y2, cls) { return sv('line', { x1: r1(x1), y1: r1(y1), x2: r1(x2), y2: r1(y2), class: cls }); }
  function txt(x, y, s, cls, anchor) { return sv('text', { x: r1(x), y: r1(y), class: cls || '', 'text-anchor': anchor || 'start' }, EDU.esc(s)); }
  function arc(cx, cy, r, a1, a2) {
    var p1 = [cx + r * Math.cos(a1 * RAD), cy - r * Math.sin(a1 * RAD)], p2 = [cx + r * Math.cos(a2 * RAD), cy - r * Math.sin(a2 * RAD)];
    return sv('path', { d: 'M' + r1(p1[0]) + ' ' + r1(p1[1]) + ' A' + r + ' ' + r + ' 0 ' + (a2 - a1 > 180 ? 1 : 0) + ' 0 ' + r1(p2[0]) + ' ' + r1(p2[1]), class: 'ang' });
  }
  function angLbl(cx, cy, r, a1, a2, s) { var m = (a1 + a2) / 2 * RAD; return txt(cx + r * Math.cos(m), cy - r * Math.sin(m) + 4, s, 'ang-lbl', 'middle'); }
  function person(x, gy, h) {
    if (h < 12) return sv('circle', { cx: r1(x), cy: r1(gy), r: 4, class: 'pt' });
    return sv('circle', { cx: r1(x), cy: r1(gy - h), r: 4.5, class: 'person' }) + line(x, gy - h + 4, x, gy - h * 0.45, 'person') +
      line(x, gy - h * 0.45, x - 5, gy, 'person') + line(x, gy - h * 0.45, x + 5, gy, 'person') + line(x - 7, gy - h * 0.8, x + 7, gy - h * 0.8, 'person');
  }
  function tower(x, top, w) { return sv('rect', { x: r1(x - (w || 18) / 2), y: r1(top), width: w || 18, height: r1(G - top), class: 'tower', rx: 2 }); }
  function rightAngle(x, y, dx, dy) { var k = 8; return sv('path', { d: 'M' + r1(x + dx * k) + ' ' + r1(y) + ' L' + r1(x + dx * k) + ' ' + r1(y + dy * k) + ' L' + r1(x) + ' ' + r1(y + dy * k), class: 'ra' }); }
  function dimH(x1, x2, y, label) {
    return line(x1, y, x2, y, 'dim') + line(x1, y - 4, x1, y + 4, 'dim') + line(x2, y - 4, x2, y + 4, 'dim') + txt((x1 + x2) / 2, y + 15, label, 'dim-lbl', 'middle');
  }
  function dimV(x, y1, y2, label, anchor) {
    return line(x, y1, x, y2, 'dim') + line(x - 4, y1, x + 4, y1, 'dim') + line(x - 4, y2, x + 4, y2, 'dim') + txt(x + (anchor === 'end' ? -7 : 7), (y1 + y2) / 2 + 4, label, 'dim-lbl', anchor || 'start');
  }
  function m(v) { return f2(v) + ' m'; }
  function drawHd(c, g, v) {
    var svg = $('#hd-svg'), o = [line(8, G, 412, G, 'ground')], s, xt, top, xo, eyeY;
    var A1 = Number(v.a1), A2 = Number(v.a2);
    if (!g) {   /* invalid inputs: a quiet sketch */
      o.push(tower(330, 100)); o.push(sv('circle', { cx: 80, cy: G, r: 4, class: 'pt' })); o.push(line(80, G, 330, 100, 'sight'));
      svg.innerHTML = o.join(''); return;
    }
    switch (c) {
      case 'a': {
        s = Math.min(300 / g.d, 150 / Math.max(g.h + g.e, 1e-9));
        var Dp = g.d * s, Hp = g.h * s, Ep = g.e * s;
        xo = 210 - Dp / 2; xt = 210 + Dp / 2; eyeY = G - Ep; top = eyeY - Hp;
        o.push(tower(xt, top));
        if (Ep > 0) o.push(line(xo, eyeY, xt, eyeY, 'horiz'));
        o.push(line(xo, eyeY, xt, top, 'sight'), person(xo, G, Ep), rightAngle(xt, eyeY, -1, -1));
        o.push(arc(xo, eyeY, 26, 0, A1), angLbl(xo, eyeY, 44, 0, A1, fmt(A1, 1) + '°'));
        o.push(dimH(xo, xt, G + 14, 'd = ' + m(g.d)));
        o.push(dimV(xt + 18, top, eyeY, 'h ≈ ' + m(g.h), xt > 330 ? 'end' : 'start'));
        if (Ep > 0) o.push(dimV(xo - 16, eyeY, G, m(g.e), 'end'));
        break;
      }
      case 'b': {
        var maxD = Math.max(g.d1, g.d2 || 0);
        s = Math.min(300 / maxD, 150 / g.H);
        xt = 90; top = G - g.H * s;
        var x1 = xt + g.d1 * s, x2 = g.d2 ? xt + g.d2 * s : null;
        o.push(tower(xt, top), person(xt, top, 16), line(xt, top - 16, Math.max(x1, x2 || 0) + 16, top - 16, 'horiz'));
        o.push(line(xt, top - 16, x1, G, 'sight'), sv('circle', { cx: r1(x1), cy: G, r: 5, class: 'pt' }));
        o.push(arc(xt, top - 16, 30, -A1, 0), angLbl(xt, top - 16, 46, -A1, 0, fmt(A1, 1) + '°'));
        o.push(dimH(xt, x1, G + 14, 'd₁ ≈ ' + m(g.d1)));
        if (x2 !== null) {
          o.push(line(xt, top - 16, x2, G, 'sight'), sv('circle', { cx: r1(x2), cy: G, r: 5, class: 'pt' }));
          o.push(arc(xt, top - 16, 52, -A2, 0), angLbl(xt, top - 16, 68, -A2, 0, fmt(A2, 1) + '°'));
          o.push(dimH(xt, x2, G + 32, 'd₂ ≈ ' + m(g.d2)));
        }
        o.push(dimV(xt - 20, top, G, 'H = ' + m(g.H), 'end'));
        break;
      }
      case 'c': {
        var Hc = g.h + g.e;
        if (g.side === 'opp') {
          s = Math.min(170 / Math.max(g.x1, g.x2), 150 / Math.max(Hc, 1e-9));
          xt = 210; eyeY = G - g.e * s; top = eyeY - g.h * s;
          var p1 = xt - g.x1 * s, p2 = xt + g.x2 * s;
          o.push(tower(xt, top));
          if (g.e > 0) o.push(line(p1, eyeY, p2, eyeY, 'horiz'));
          o.push(line(p1, eyeY, xt, top, 'sight'), line(p2, eyeY, xt, top, 'sight'), person(p1, G, g.e * s), person(p2, G, g.e * s));
          o.push(arc(p1, eyeY, 24, 0, A1), angLbl(p1, eyeY, 40, 0, A1, fmt(A1, 1) + '°'));
          o.push(arc(p2, eyeY, 24, 180 - A2, 180), angLbl(p2, eyeY, 40, 180 - A2, 180, fmt(A2, 1) + '°'));
          o.push(dimH(p1, xt, G + 14, 'x₁ ≈ ' + m(g.x1)), dimH(xt, p2, G + 14, 'x₂ ≈ ' + m(g.x2)));
          o.push(dimV(xt + 18, top, eyeY, 'h ≈ ' + m(g.h)));
        } else {
          s = Math.min(330 / (g.x + g.d), 150 / Math.max(Hc, 1e-9));
          xt = 385; eyeY = G - g.e * s; top = eyeY - g.h * s;
          var xn = xt - g.x * s, xf = xn - g.d * s;
          o.push(tower(xt, top));
          if (g.e > 0) o.push(line(xf, eyeY, xt, eyeY, 'horiz'));
          o.push(line(xn, eyeY, xt, top, 'sight'), line(xf, eyeY, xt, top, 'sight'), person(xn, G, g.e * s), person(xf, G, g.e * s));
          o.push(arc(xn, eyeY, 22, 0, A1), angLbl(xn, eyeY, 38, 0, A1, fmt(A1, 1) + '°'));
          o.push(arc(xf, eyeY, 30, 0, A2), angLbl(xf, eyeY, 48, 0, A2, fmt(A2, 1) + '°'));
          o.push(dimH(xn, xt, G + 14, 'x ≈ ' + m(g.x)), dimH(xf, xn, G + 32, 'd = ' + m(g.d)));
          o.push(dimV(xt - 18, top, eyeY, 'h ≈ ' + m(g.h), 'end'));
        }
        break;
      }
      case 'd': {
        s = Math.min(300 / g.d, 150 / Math.max(g.h + g.f + g.e, 1e-9));
        var Dd = g.d * s, Hd = g.h * s, Fd = g.f * s, Ed = g.e * s;
        xo = 210 - Dd / 2; xt = 210 + Dd / 2; eyeY = G - Ed; top = eyeY - Hd;
        var ft = top - Fd;
        o.push(tower(xt, top), line(xt, top, xt, ft, 'wall'), sv('path', { d: 'M' + r1(xt) + ' ' + r1(ft) + ' l16 6 l-16 6 z', class: 'flag' }));
        if (Ed > 0) o.push(line(xo, eyeY, xt, eyeY, 'horiz'));
        o.push(line(xo, eyeY, xt, top, 'sight'), line(xo, eyeY, xt, ft, 'sight'), person(xo, G, Ed));
        o.push(arc(xo, eyeY, 26, 0, A1), angLbl(xo, eyeY, 42, 0, A1, fmt(A1, 1) + '°'));
        o.push(arc(xo, eyeY, 44, 0, A2), angLbl(xo, eyeY, 62, A1, A2, fmt(A2, 1) + '°'));
        o.push(dimH(xo, xt, G + 14, 'd ≈ ' + m(g.d)));
        o.push(dimV(xt + 18, top, eyeY, 'h ≈ ' + m(g.h), xt > 330 ? 'end' : 'start'), dimV(xt + 18, ft, top, 'f ≈ ' + m(g.f), xt > 330 ? 'end' : 'start'));
        break;
      }
      case 'e': {
        s = Math.min(230 / g.x, 160 / g.h);
        var xw = 310, foot = xw - g.x * s; top = G - g.h * s;
        o.push(line(xw, G, xw, Math.min(top - 20, G - 30), 'wall'), line(foot, G, xw, top, 'ladder'), rightAngle(xw, G, -1, -1));
        o.push(arc(foot, G, 28, 0, A1), angLbl(foot, G, 46, 0, A1, fmt(A1, 1) + '°'));
        var mx = (foot + xw) / 2, my = (G + top) / 2;
        o.push(txt(mx - 10, my - 8, 'L ≈ ' + m(g.L), 'dim-lbl', 'end'));
        o.push(dimH(foot, xw, G + 14, 'x ≈ ' + m(g.x)), dimV(xw + 18, top, G, 'h ≈ ' + m(g.h)));
        break;
      }
    }
    svg.innerHTML = o.join('');
  }

  /* --- word problems (text in content.js, numbers here so every language gets the same sums) --- */
  var PROBLEMS = [
    { id: 'gopuram', c: 'a', set: { d: 40, a1: 60, e: 0 } },
    { id: 'qutub', c: 'b', set: { H: 72.5, a1: 45, a2: 0, e: 0 } },
    { id: 'kite', c: 'e', set: { known: 'h', h: 60, a1: 30 } },
    { id: 'lighthouse', c: 'b', set: { H: 75, a1: 45, a2: 30, e: 0 } },
    { id: 'mobile', c: 'c', set: { side: 'same', d: 20, a1: 60, a2: 30, e: 0 } },
    { id: 'flag', c: 'd', set: { known: 'flag', f: 5, a1: 45, a2: 60, e: 0 } }
  ];
  function problemText(id) {
    var L = content().problems || [], E = contentEn().problems || [];
    return L.filter(function (p) { return p.id === id; })[0] || E.filter(function (p) { return p.id === id; })[0] || { title: id, text: '' };
  }
  function renderProblems() {
    var box = $('#problem-list'); box.innerHTML = '';
    PROBLEMS.forEach(function (p) {
      var tx = problemText(p.id), res = T.solveHD(p.c, Object.assign({}, defaults().hd[p.c], p.set));
      var ans = el('div', { class: 'stack' });
      res.results.forEach(function (r) { ans.appendChild(el('p', { class: 'ans mb0', dataset: { key: r.key } }, t(r.key) + ': ', ltr(lenStr(r)))); });
      box.appendChild(el('div', { class: 'panel prob', dataset: { id: p.id } },
        el('h3', { text: tx.title }), el('p', { text: tx.text }),
        el('details', {}, el('summary', { text: t('show_answer') }), ans),
        el('button', { type: 'button', class: 'btn btn-primary prob-load', dataset: { id: p.id }, onclick: function () {
          S.hd.cur = p.c; Object.assign(S.hd[p.c], p.set); save(); buildHdForm(); renderHd();
          EDU.toast(t('problem_loaded'));
          try { $('#hd-result').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { }
        } }, '📥 ', t('load_problem'))));
    });
  }

  /* ================================================================== IDENTITIES QUIZ */
  function quizItem(id) {
    var L = content().identities || [], E = contentEn().identities || [];
    return L.filter(function (q) { return q.id === id; })[0] || E.filter(function (q) { return q.id === id; })[0];
  }
  function startQuiz() { S.quiz = { order: EDU.shuffle(quizIds()), i: 0, score: 0, picked: null, done: false }; save(); renderQuiz(); }
  function quizAnswer(idx) {
    var q = S.quiz; if (!q || q.done || q.picked !== null) return;
    q.picked = idx;
    if (idx === quizItem(q.order[q.i]).a) q.score++;
    save(); renderQuiz();
    var nx = $('#iq-next'); if (nx) nx.focus();
  }
  function quizNext() {
    var q = S.quiz; if (!q || q.picked === null) return;
    if (q.i + 1 >= q.order.length) q.done = true; else { q.i++; q.picked = null; }
    save(); renderQuiz();
    var f = $('.iq-opt') || $('#iq-again'); if (f) f.focus();
  }
  function renderQuiz() {
    var q = S.quiz, box = $('#iq'); box.innerHTML = '';
    if (!q) return;
    box.appendChild(el('h2', { text: t('iq_title') }));
    if (q.done) {
      var pct = q.score / q.order.length;
      box.appendChild(el('div', { class: 'final', id: 'iq-final', dataset: { score: String(q.score) }, text: fmt(q.score, 0) + ' / ' + fmt(q.order.length, 0) }));
      box.appendChild(el('p', { class: 'mb0', text: t('iq_result', { score: fmt(q.score, 0), total: fmt(q.order.length, 0) }) }));
      box.appendChild(el('p', { class: 'callout ' + (pct === 1 ? 'success' : pct >= 0.6 ? '' : 'warning'), text: t(pct === 1 ? 'iq_perfect' : pct >= 0.6 ? 'iq_good' : 'iq_keep') }));
      box.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'iq-again', onclick: startQuiz }, '🔁 ', t('iq_again'))));
      return;
    }
    var item = quizItem(q.order[q.i]);
    box.appendChild(el('div', { class: 'qtop' },
      el('span', { class: 'pill', id: 'iq-progress', text: t('iq_progress', { n: fmt(q.i + 1, 0), total: fmt(q.order.length, 0) }) }),
      el('span', { class: 'pill' }, t('score') + ': ', el('b', { id: 'iq-score', text: fmt(q.score, 0) }))));
    box.appendChild(el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span', { style: { width: Math.round((q.i + (q.picked !== null ? 1 : 0)) / q.order.length * 100) + '%' } })));
    box.appendChild(el('p', { class: 'qtext', id: 'iq-q', dataset: { id: item.id } }, isRtl() && !/[\u0600-\u06FF]/.test(item.q) ? ltr(item.q) : item.q));
    var opts = el('div', { class: 'opts', role: 'group' });
    item.opts.forEach(function (o, i) {
      var cls = 'opt iq-opt' + (q.picked !== null ? (i === item.a ? ' win' : ' lose') + (i === q.picked ? ' picked' : '') : '');
      opts.appendChild(el('button', { type: 'button', class: cls, dataset: { idx: String(i) }, disabled: q.picked !== null, onclick: function () { quizAnswer(i); } },
        el('span', { class: 'ol', 'aria-hidden': 'true', text: 'ABCD'.charAt(i) }), el('span', { class: 'ov', text: o })));
    });
    box.appendChild(opts);
    if (q.picked !== null) {
      var right = q.picked === item.a;
      box.appendChild(el('div', { class: 'stack', id: 'iq-reveal', dataset: { right: right ? '1' : '0' } },
        el('p', { class: 'verdict ' + (right ? 'ok' : 'bad'), text: right ? t('correct') : t('wrong') }),
        el('p', { class: 'callout', text: item.why }),
        el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'iq-next', onclick: quizNext }, t('next'), ' ', el('span', { 'aria-hidden': 'true', text: isRtl() ? '←' : '→' })))));
    }
  }
  document.addEventListener('keydown', function (e) {
    if (S.tab !== 'practice' || e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    var k = e.key.toLowerCase(), i = ['a', 'b', 'c', 'd'].indexOf(k) >= 0 ? ['a', 'b', 'c', 'd'].indexOf(k) : ['1', '2', '3', '4'].indexOf(k);
    if (i < 0) return;
    if (D && !D.done && D.picked === null) { e.preventDefault(); drillPick(i); }
    else if (S.quiz && !S.quiz.done && S.quiz.picked === null) { e.preventDefault(); quizAnswer(i); }
  });

  /* ================================================================== TIMED DRILL */
  var D = null;
  function bestKey() { return S.drill.level === 2 ? 'l2' : 'l1'; }
  function startDrill() {
    if (D && D.timer) clearInterval(D.timer);
    D = { qs: T.drillSet(S.drill.level, DRILL_N), i: 0, score: 0, picked: null, t0: Date.now(), elapsed: 0, done: false, timer: 0 };
    D.timer = setInterval(tick, 250);
    renderDrill();
    var f = $('.dr-opt'); if (f) f.focus();
  }
  function tick() {
    if (!D || D.done) return;
    D.elapsed = (Date.now() - D.t0) / 1000;
    var e = $('#dr-time'); if (e) e.textContent = t('dr_sec', { n: fmt(Math.floor(D.elapsed), 0) });
  }
  function drillPick(idx) {
    if (!D || D.done || D.picked !== null) return;
    D.picked = idx;
    var q = D.qs[D.i];
    if (q.options[idx] === q.answer) D.score++;
    renderDrill();
    setTimeout(function () { if (D && !D.done && D.picked !== null) nextDrill(); }, 700);
  }
  function nextDrill() {
    D.picked = null;
    if (D.i + 1 >= D.qs.length) finishDrill(); else { D.i++; renderDrill(); }
  }
  function finishDrill() {
    D.done = true; clearInterval(D.timer); D.timer = 0;
    D.elapsed = Math.round((Date.now() - D.t0) / 10) / 100;
    var k = bestKey(), b = S.drill.best[k];
    if (!b || D.score > b.score || (D.score === b.score && D.elapsed < b.time)) { S.drill.best[k] = { score: D.score, time: D.elapsed }; D.newBest = true; }
    save(); renderDrill();
  }
  function syncLevel() { $$('#dr-level button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.v === S.drill.level)); }); }
  $('#dr-level').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    S.drill.level = +b.dataset.v === 2 ? 2 : 1; save(); syncLevel(); renderBest();
    if (D && !D.done) startDrill();
  });
  function renderBest() {
    var b = S.drill.best[bestKey()], p = $('#dr-best');
    p.textContent = b ? t('dr_best', { score: fmt(b.score, 0), total: fmt(DRILL_N, 0), t: fmt(b.time, 1) }) : t('dr_nobest');
    p.setAttribute('data-score', b ? String(b.score) : '');
  }
  function qText(q) { return q.fn + ' ' + q.deg + '° = ?'; }
  function optText(v) { return v === null ? t('not_defined') : v; }
  function renderDrill() {
    var box = $('#dr-box'); box.innerHTML = '';
    if (!D) {
      box.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'dr-start', onclick: startDrill }, '⏱ ', t('dr_start'))));
      return;
    }
    if (D.done) {
      box.appendChild(el('div', { class: 'final', id: 'dr-final', dataset: { score: String(D.score), time: String(D.elapsed) }, text: fmt(D.score, 0) + ' / ' + fmt(DRILL_N, 0) }));
      box.appendChild(el('p', { class: 'mb0', text: t('dr_result', { score: fmt(D.score, 0), total: fmt(DRILL_N, 0), t: fmt(D.elapsed, 1) }) }));
      if (D.newBest) box.appendChild(el('p', { class: 'callout success mb0', text: t('dr_newbest') }));
      box.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'dr-again', onclick: startDrill }, '🔁 ', t('try_again'))));
      renderBest();
      return;
    }
    var q = D.qs[D.i];
    box.appendChild(el('div', { class: 'qtop' },
      el('span', { class: 'pill', id: 'dr-progress', text: t('iq_progress', { n: fmt(D.i + 1, 0), total: fmt(DRILL_N, 0) }) }),
      el('span', { class: 'pill' }, t('score') + ': ', el('b', { id: 'dr-score', text: fmt(D.score, 0) })),
      el('span', { class: 'pill', id: 'dr-time', text: t('dr_sec', { n: fmt(Math.floor(D.elapsed), 0) }) })));
    box.appendChild(el('div', { class: 'dr-q no-i18n', id: 'dr-q', dataset: { fn: q.fn, deg: String(q.deg), i: String(D.i) }, text: qText(q) }));
    var opts = el('div', { class: 'opts dr-opts', role: 'group' });
    q.options.forEach(function (o, i) {
      var cls = 'opt dr-opt' + (D.picked !== null ? (o === q.answer ? ' win' : ' lose') + (i === D.picked ? ' picked' : '') : '');
      opts.appendChild(el('button', { type: 'button', class: cls, dataset: { idx: String(i), val: o === null ? 'ND' : o }, disabled: D.picked !== null, onclick: function () { drillPick(i); } },
        el('span', { class: 'ol', 'aria-hidden': 'true', text: 'ABCD'.charAt(i) }), el('span', { class: 'ov' + (o === null ? ' nd' : ''), text: optText(o) })));
    });
    box.appendChild(opts);
    if (D.picked !== null) box.appendChild(el('p', { class: 'verdict ' + (q.options[D.picked] === q.answer ? 'ok' : 'bad'), id: 'dr-verdict', text: q.options[D.picked] === q.answer ? t('correct') : t('wrong') }));
  }

  /* ================================================================== WORKSHEET (print) */
  function printAs(cls) {
    document.body.classList.add(cls);
    var done = function () { document.body.classList.remove(cls); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); setTimeout(done, 1500); }, 60);
  }
  function buildWorksheet() {
    var ws = $('#worksheet'); ws.innerHTML = '';
    var qs = T.drillSet(S.drill.level, WS_N);
    ws.appendChild(el('h2', { text: t('ws_title') }));
    ws.appendChild(el('p', { text: t('ws_name') }));
    ws.appendChild(el('p', { text: t('ws_instr') }));
    var tb = el('tbody'), key = el('tbody');
    qs.forEach(function (q, i) {
      tb.appendChild(el('tr', { dataset: { fn: q.fn, deg: String(q.deg) } }, el('td', { text: fmt(i + 1, 0) }), el('td', { class: 'q', text: qText(q) }), el('td', { class: 'blank' })));
      key.appendChild(el('tr', { dataset: { fn: q.fn, deg: String(q.deg), ans: q.answer === null ? 'ND' : q.answer } }, el('td', { text: fmt(i + 1, 0) }),
        el('td', { class: 'q', text: q.fn + ' ' + q.deg + '°' }), el('td', { class: 'q' }, optText(q.answer))));
    });
    ws.appendChild(el('table', { class: 'ws-table ws-q' }, el('thead', {}, el('tr', {}, el('th', { text: '#' }), el('th', { text: t('ws_col_q') }), el('th', { text: t('ws_col_a') }))), tb));
    ws.appendChild(el('div', { class: 'ws-key' }, el('h2', { text: t('ws_key') }),
      el('table', { class: 'ws-table ws-k' }, el('thead', {}, el('tr', {}, el('th', { text: '#' }), el('th', { text: t('ws_col_q') }), el('th', { text: t('ws_col_a') }))), key)));
  }
  $('#ws-print').addEventListener('click', function () { buildWorksheet(); printAs('printing-ws'); });

  /* ================================================================== RESET / RENDER ALL */
  $('#reset').addEventListener('click', function () {
    if (!window.confirm(EDU.t('confirm_reset'))) return;
    if (D && D.timer) clearInterval(D.timer);
    D = null; store.remove('state'); S = defaults();
    startQuiz();
    syncAll(); renderAll(); showTab('circle');
  });
  function syncAll() {
    syncUc(); syncCalc(); syncLevel();
    $('#calc-in').value = S.calc.text; $('#inv-fn').value = S.inv.fn; $('#inv-val').value = S.inv.text;
  }
  function renderAll() {
    renderCircle();
    buildStdTable(); buildCalcChips(); buildInvChips(); renderCalc(); renderInv(); renderConv();
    buildHdForm(); renderHd(); renderProblems();
    renderQuiz(); renderDrill(); renderBest();
  }
  EDU.onLang(renderAll);
  EDU.onTheme(function () { draw(); });
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { sizeCanvas(); draw(); }, 80); });
  var lastW = 0;
  if (window.ResizeObserver) new ResizeObserver(function () {
    var w = cv.parentNode.clientWidth; if (Math.abs(w - lastW) < 2) return; lastW = w;
    clearTimeout(rt); rt = setTimeout(function () { sizeCanvas(); draw(); }, 50);
  }).observe(cv.parentNode);

  if (!S.quiz) S.quiz = { order: EDU.shuffle(quizIds()), i: 0, score: 0, picked: null, done: false };
  syncAll();
  showTab(S.tab);
  sizeCanvas();
  renderAll();
  save();
  /* small hook for tests and curious teachers */
  window.TrigLab = { state: function () { return S; }, drill: function () { return D; }, engine: T, setDeg: setDeg };
})();
