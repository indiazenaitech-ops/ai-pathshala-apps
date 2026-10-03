/* Is My AI Good? (Evaluation): a confusion-matrix lab for the CBSE Class 10 AI "Evaluation" unit.
   Three tabs: Threshold lab (dot strip + live matrix + metrics), Prediction vs Reality (notes), Practice. */
(function () {
  'use strict';
  var SLUG = 'confusion-matrix-lab';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$;

  var N = 40;
  var CELLS = ['tp', 'fp', 'fn', 'tn'];
  var METRICS = ['accuracy', 'precision', 'recall', 'f1'];
  var ABBR = { tp: 'TP', fp: 'FP', fn: 'FN', tn: 'TN' };
  var TABS = ['explore', 'learn', 'practice'];
  var MODES = ['mixed', 'accuracy', 'precision', 'recall', 'f1', 'cell'];
  /* Non-translated scenario settings. Text lives in content.js (APP_CONTENT[lang].scenarios[id]). */
  var SCEN = [
    { id: 'spam', icon: '📧', nPos: 16, mp: 0.68, mn: 0.32, sd: 0.16, focus: 'precision' },
    { id: 'disease', icon: '🩺', nPos: 10, mp: 0.64, mn: 0.31, sd: 0.16, focus: 'recall' },
    { id: 'mango', icon: '🥭', nPos: 20, mp: 0.62, mn: 0.38, sd: 0.15, focus: 'f1' },
    { id: 'cheat', icon: '📷', nPos: 6, mp: 0.62, mn: 0.28, sd: 0.15, focus: 'precision' },
    { id: 'fire', icon: '🔥', nPos: 8, mp: 0.66, mn: 0.31, sd: 0.16, focus: 'recall' }
  ];
  var SCEN_IDS = SCEN.map(function (s) { return s.id; });
  var EXAMPLE = { tp: 18, fp: 4, fn: 6, tn: 72 };   /* worked example in the Learn tab (100 images) */

  /* ---------------- state (restored safely) ---------------- */
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function num01(v, d) { return (typeof v === 'number' && isFinite(v)) ? round2(EDU.clamp(v, 0, 1)) : d; }
  function scoreOr(v) {
    var ok = v && typeof v === 'object';
    var g = function (k) { var x = ok ? v[k] : 0; return (typeof x === 'number' && isFinite(x) && x >= 0) ? Math.floor(x) : 0; };
    return { c: g('c'), n: g('n'), streak: g('streak'), best: g('best') };
  }
  var dsStored = store.get('ds', {});
  var S = {
    tab: oneOf(store.get('tab', 'explore'), TABS, 'explore'),
    scen: oneOf(store.get('scen', 'spam'), SCEN_IDS, 'spam'),
    thr: num01(store.get('thr', 0.5), 0.5),
    ds: (dsStored && typeof dsStored === 'object' && !Array.isArray(dsStored)) ? dsStored : {},
    mode: oneOf(store.get('mode', 'mixed'), MODES, 'mixed'),
    score: scoreOr(store.get('score', null)),
    sel: null
  };

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- helpers ---------------- */
  function round2(x) { return Math.round(x * 100 + (x >= 0 ? 1e-9 : -1e-9)) / 100; }
  function f2(x) { return EDU.fmt(round2(x), { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pct(x) { return EDU.fmt(Math.round(x * 100 + 1e-9)) + '%'; }
  function n0(x) { return EDU.fmt(x); }
  function scen(id) { id = id || S.scen; for (var i = 0; i < SCEN.length; i++) if (SCEN[i].id === id) return SCEN[i]; return SCEN[0]; }
  function C(id) {
    var all = window.APP_CONTENT || {};
    var L = all[EDU.lang] || all.en || {};
    var sc = (L.scenarios || {})[id];
    return sc || ((all.en || {}).scenarios || {})[id] || {};
  }
  function ltr(text, cls) { return el('span', { class: 'formula' + (cls ? ' ' + cls : ''), dir: 'ltr', text: text }); }

  /* Seeded random numbers, so a data set looks the same for every student in the class. */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var x = Math.imul(a ^ a >>> 15, 1 | a);
      x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x;
      return ((x ^ x >>> 14) >>> 0) / 4294967296;
    };
  }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function gauss(r) { var s = 0; for (var i = 0; i < 6; i++) s += r(); return (s - 3) / Math.sqrt(0.5); }

  function cellOf(it, thr) {
    var yes = it.s >= thr - 1e-9;
    return yes ? (it.pos ? 'tp' : 'fp') : (it.pos ? 'fn' : 'tn');
  }
  function countAt(list, thr) {
    var m = { tp: 0, fp: 0, fn: 0, tn: 0 };
    list.forEach(function (it) { m[cellOf(it, thr)]++; });
    return m;
  }

  /* 40 items: true label + model score (0-1). Picks the first seed whose 0.50 threshold gives a
     realistic mix: all four cells filled, some misses and false alarms, but not a terrible model. */
  function makeData(sc, ds) {
    var items;
    for (var k = 0; k < 80; k++) {
      var rnd = mulberry32(hash(sc.id) + ds * 7919 + k * 104729);
      items = [];
      for (var i = 0; i < N; i++) {
        var pos = i < sc.nPos;
        var s = (pos ? sc.mp : sc.mn) + sc.sd * gauss(rnd);
        items.push({ pos: pos, s: EDU.clamp(round2(s), 0.01, 0.99) });
      }
      var m = countAt(items, 0.5), nNeg = N - sc.nPos;
      var good = m.tp >= 2 && m.tn >= 2 && m.fn >= Math.max(1, Math.round(sc.nPos * 0.12)) &&
        m.fp >= Math.max(2, Math.round(nNeg * 0.1)) && m.fn + m.fp <= Math.round(N * 0.25) && m.fp !== m.fn;
      if (good || k === 79) {
        var ids = [];
        for (i = 1; i <= N; i++) ids.push(i);
        for (i = N - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var x = ids[i]; ids[i] = ids[j]; ids[j] = x; }
        items.forEach(function (it, n) { it.id = ids[n]; });
        break;
      }
    }
    items.sort(function (a, b) { return a.s - b.s || a.id - b.id; });
    return items;
  }
  var DATA = {};
  function dsOf(id) { var n = S.ds[id]; return (typeof n === 'number' && n >= 1 && n < 1e6) ? Math.floor(n) : 1; }
  function items() {
    var sc = scen(), key = sc.id + ':' + dsOf(sc.id);
    if (!DATA[key]) DATA[key] = makeData(sc, dsOf(sc.id));
    return DATA[key];
  }

  /* ---------------- metrics ---------------- */
  function metricVal(key, m) {
    var den;
    if (key === 'accuracy') { den = m.tp + m.tn + m.fp + m.fn; return den ? (m.tp + m.tn) / den : null; }
    if (key === 'precision') { den = m.tp + m.fp; return den ? m.tp / den : null; }
    if (key === 'recall') { den = m.tp + m.fn; return den ? m.tp / den : null; }
    den = 2 * m.tp + m.fp + m.fn;           /* F1 = 2PR/(P+R) = 2TP/(2TP+FP+FN) */
    return den ? 2 * m.tp / den : null;
  }
  /* formula in symbols + the same formula with numbers plugged in */
  function metricParts(key, m) {
    var F = n0, tp = m.tp, fp = m.fp, fn = m.fn, tn = m.tn, val = metricVal(key, m);
    if (key === 'accuracy') {
      return { sym: '(TP + TN) / (TP + TN + FP + FN)', plug: '(' + F(tp) + ' + ' + F(tn) + ') / (' + F(tp) + ' + ' + F(tn) + ' + ' + F(fp) + ' + ' + F(fn) + ') = ' + F(tp + tn) + ' / ' + F(tp + tn + fp + fn), val: val };
    }
    if (key === 'precision') {
      return { sym: 'TP / (TP + FP)', plug: F(tp) + ' / (' + F(tp) + ' + ' + F(fp) + ') = ' + F(tp) + ' / ' + F(tp + fp), val: val };
    }
    if (key === 'recall') {
      return { sym: 'TP / (TP + FN)', plug: F(tp) + ' / (' + F(tp) + ' + ' + F(fn) + ') = ' + F(tp) + ' / ' + F(tp + fn), val: val };
    }
    var P = metricVal('precision', m), R = metricVal('recall', m);
    if (P !== null && R !== null && P + R > 0) {
      var p = f2(P), r = f2(R);
      return { sym: '2 × (P × R) / (P + R)', plug: '2 × (' + p + ' × ' + r + ') / (' + p + ' + ' + r + ')', val: val, approx: true };
    }
    return { sym: '2 × TP / (2 × TP + FP + FN)', plug: '2 × ' + F(tp) + ' / (2 × ' + F(tp) + ' + ' + F(fp) + ' + ' + F(fn) + ') = ' + F(2 * tp) + ' / ' + F(2 * tp + fp + fn), val: val };
  }
  function plugLine(parts) {
    return '= ' + parts.plug + (parts.val === null ? '' : (parts.approx ? ' ≈ ' : ' = ') + f2(parts.val));
  }
  /* full worked line: "Precision = TP / (TP + FP) = 18 / (18 + 4) = 18 / 22 = 0.82" (name translated outside) */
  function solutionEl(key, m) {
    var p = metricParts(key, m);
    return el('span', {},
      el('b', { text: t('m_' + key) + ' ' }),
      ltr('= ' + p.sym + ' ' + plugLine(p) + (p.val === null ? '' : ' = ' + pct(p.val))),
      p.val === null ? el('span', { text: ' → ' + t('not_defined') }) : null);
  }

  /* ---------------- confusion matrix table (lab, learn, practice, worksheet) ---------------- */
  function matrixTable(tbl, o) {
    var c = C(o.scen || 'fire');
    var pos = o.generic ? t('yes') : c.pos, neg = o.generic ? t('no') : c.neg;
    tbl.innerHTML = '';
    var head = el('tr', {},
      el('th', { class: 'corner', scope: 'col' },
        el('span', { class: 'lbl' }, t('reality') + ' ', el('span', { class: 'flip', 'aria-hidden': 'true', text: '→' })),
        el('span', { class: 'sub' }, t('prediction') + ' ↓')),
      colHead(t('yes'), o.generic ? null : pos), colHead(t('no'), o.generic ? null : neg));
    function colHead(yn, lab) {
      return el('th', { scope: 'col' }, el('span', { class: 'lbl', text: t('real_is', { x: yn }) }), lab ? el('span', { class: 'sub', text: '“' + lab + '”' }) : null);
    }
    function rowHead(yn, lab) {
      return el('th', { scope: 'row', class: 'rowh' }, el('span', { class: 'lbl', text: t('pred_is', { x: yn }) }), lab ? el('span', { class: 'sub', text: '“' + lab + '”' }) : null);
    }
    function cell(k) {
      if (o.buttons) {
        return el('td', { class: 'k-' + k, style: { padding: '0' } },
          el('button', { type: 'button', class: 'cell-btn k-' + k, id: 'pick-' + k, dataset: { cell: k }, onclick: function () { o.buttons(k); } },
            el('span', { class: 'abbr', text: ABBR[k] }), el('span', { class: 'cell-name', text: t(k + '_name') })));
      }
      var td = el('td', { class: 'cell k-' + k, id: o.idPrefix ? o.idPrefix + k : null });
      var top = el('div', { class: 'cell-top' }, el('span', { class: 'abbr', text: ABBR[k] }));
      if (o.counts) {
        top.appendChild(el('span', { class: 'cnt', text: n0(o.counts[k]) }));
        td.dataset.n = String(o.counts[k]);
      }
      td.appendChild(top);
      td.appendChild(el('div', { class: 'cell-name', text: t(k + '_name') }));
      if (o.means) td.appendChild(el('div', { class: 'cell-mean', text: c[k] || '' }));
      if (o.why) td.appendChild(el('div', { class: 'cell-mean', text: t('why_' + k) }));
      return td;
    }
    tbl.appendChild(el('thead', {}, head));
    tbl.appendChild(el('tbody', {},
      el('tr', {}, rowHead(t('yes'), o.generic ? null : pos), cell('tp'), cell('fp')),
      el('tr', {}, rowHead(t('no'), o.generic ? null : neg), cell('fn'), cell('tn'))));
  }

  /* ---------------- tabs ---------------- */
  function setTab(id, focus) {
    S.tab = oneOf(id, TABS, 'explore');
    store.set('tab', S.tab);
    TABS.forEach(function (k) {
      var b = $('#tab-' + k), on = k === S.tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#panel-' + k).hidden = !on;
    });
    if (focus) $('#tab-' + S.tab).focus();
    if (S.tab === 'explore') renderStrip();
    if (S.tab === 'practice' && !Q) newQuestion();
  }
  EDU.$$('#tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var i = TABS.indexOf(b.dataset.tab), d = 0;
      var rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'ArrowRight') d = rtl ? -1 : 1;
      else if (e.key === 'ArrowLeft') d = rtl ? 1 : -1;
      else if (e.key === 'Home') { setTab(TABS[0], true); e.preventDefault(); return; }
      else if (e.key === 'End') { setTab(TABS[TABS.length - 1], true); e.preventDefault(); return; }
      if (d) { setTab(TABS[(i + d + TABS.length) % TABS.length], true); e.preventDefault(); }
    });
  });

  /* ================= THRESHOLD LAB ================= */
  var GEO = null;

  function renderScenarioList() {
    var box = $('#scen-list');
    box.innerHTML = '';
    SCEN.forEach(function (sc) {
      box.appendChild(el('button', {
        type: 'button', class: 'chip', id: 'scen-' + sc.id, 'aria-pressed': sc.id === S.scen ? 'true' : 'false',
        onclick: function () { setScenario(sc.id); }
      }, el('span', { 'aria-hidden': 'true', text: sc.icon }), ' ', C(sc.id).name || sc.id));
    });
  }
  function setScenario(id) {
    if (id === S.scen) return;
    S.scen = oneOf(id, SCEN_IDS, 'spam'); S.sel = null;
    store.set('scen', S.scen);
    renderLab();
  }

  function renderStrip() {
    var box = $('#strip'), svg = $('#strip-svg');
    var W = Math.round(box.clientWidth);
    if (!W) return;                                   /* hidden tab: render when shown */
    var list = items(), c = C(S.scen);
    var r = EDU.clamp(Math.round(W / 72), 6, 10);
    var padX = r + 10, span = W - 2 * padX, step = 2 * r + 3;
    var X = function (s) { return padX + s * span; };
    function layout(arr) {
      var last = [];
      arr.forEach(function (it) {
        var x = X(it.s), k = 0;
        while (last[k] !== undefined && x - last[k] < step) k++;
        last[k] = x; it._x = x; it._lv = k;
      });
      return Math.max(1, last.length);
    }
    var yes = list.filter(function (it) { return it.pos; }), no = list.filter(function (it) { return !it.pos; });
    var lv1 = layout(yes), lv2 = layout(no);
    var TITLE = 20, TAG = 20, knobH = 26;
    var y1 = knobH + 4, h1 = TITLE + lv1 * step + 6 + TAG;
    var y2 = y1 + h1 + 6, h2 = TITLE + lv2 * step + 6 + TAG;
    var axisY = y2 + h2 + 6, H = axisY + 22;
    var thrX = X(S.thr);
    var m = countAt(list, S.thr);
    var parts = [];
    function esc(s) { return EDU.esc(s); }
    function lane(y, h, real) {
      var leftK = real ? 'fn' : 'tn', rightK = real ? 'tp' : 'fp';
      parts.push('<rect class="region k-' + leftK + '" x="0" y="' + y + '" width="' + Math.max(0, thrX) + '" height="' + h + '"/>');
      parts.push('<rect class="region k-' + rightK + '" x="' + thrX + '" y="' + y + '" width="' + Math.max(0, W - thrX) + '" height="' + h + '"/>');
      parts.push('<text class="lane-title" x="8" y="' + (y + 15) + '">' + esc(t('lane_title', { x: real ? c.pos : c.neg, n: n0(real ? yes.length : no.length) })) + '</text>');
      var ty = y + h - 6;
      if (thrX > 42) parts.push('<text class="tag k-' + leftK + '" x="' + (thrX - 7) + '" y="' + ty + '" text-anchor="end">' + ABBR[leftK] + ' ' + n0(m[leftK]) + '</text>');
      if (W - thrX > 42) parts.push('<text class="tag k-' + rightK + '" x="' + (thrX + 7) + '" y="' + ty + '" text-anchor="start">' + ABBR[rightK] + ' ' + n0(m[rightK]) + '</text>');
    }
    lane(y1, h1, true);
    lane(y2, h2, false);
    parts.push('<line class="lane-sep" x1="0" x2="' + W + '" y1="' + (y2 - 3) + '" y2="' + (y2 - 3) + '"/>');
    /* axis */
    parts.push('<line class="axis" x1="' + padX + '" x2="' + (W - padX) + '" y1="' + axisY + '" y2="' + axisY + '"/>');
    [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
      var x = X(v);
      parts.push('<line class="axis" x1="' + x + '" x2="' + x + '" y1="' + (axisY - 4) + '" y2="' + (axisY + 4) + '"/>');
      parts.push('<text class="tick" x="' + x + '" y="' + (axisY + 17) + '" text-anchor="middle">' + EDU.fmt(v) + '</text>');
    });
    /* dots */
    var dots = [];
    function drawDots(arr, y, h) {
      var base = y + TITLE + lv(arr) * step;   /* dots rise from the bottom of the dot area */
      arr.forEach(function (it) {
        var cx = it._x, cy = base - it._lv * step - r + 1, k = cellOf(it, S.thr);
        dots.push({ it: it, x: cx, y: cy });
        var tip = t('dot_info', { item: c.item, id: it.id, s: f2(it.s), real: it.pos ? c.pos : c.neg, pred: (k === 'tp' || k === 'fp') ? c.pos : c.neg, res: t(k + '_name') });
        parts.push('<circle class="dot k-' + k + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r + '" data-id="' + it.id + '"><title>' + esc(tip) + '</title></circle>');
        if (k === 'fp' || k === 'fn') {
          var d = r * 0.45;
          parts.push('<path class="xmark" d="M' + (cx - d).toFixed(1) + ' ' + (cy - d).toFixed(1) + 'L' + (cx + d).toFixed(1) + ' ' + (cy + d).toFixed(1) + 'M' + (cx + d).toFixed(1) + ' ' + (cy - d).toFixed(1) + 'L' + (cx - d).toFixed(1) + ' ' + (cy + d).toFixed(1) + '"/>');
        }
        if (S.sel === it.id) parts.push('<circle class="sel-ring" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (r + 4) + '"/>');
      });
    }
    function lv(arr) { return arr === yes ? lv1 : lv2; }
    drawDots(yes, y1, h1);
    drawDots(no, y2, h2);
    /* threshold line + knob */
    parts.push('<line class="thr-line" x1="' + thrX + '" x2="' + thrX + '" y1="' + (knobH - 2) + '" y2="' + (y2 + h2) + '"/>');
    var kx = EDU.clamp(thrX, 27, W - 27);
    parts.push('<rect class="thr-knob" x="' + (kx - 26) + '" y="1" width="52" height="' + knobH + '" rx="8"/>');
    parts.push('<text class="thr-knob-txt" x="' + kx + '" y="19" text-anchor="middle">' + f2(S.thr) + '</text>');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('direction', 'ltr');
    svg.innerHTML = parts.join('');
    GEO = { W: W, H: H, padX: padX, span: span, r: r, dots: dots };
  }

  function thrFromClient(clientX) {
    if (!GEO) return S.thr;
    var rc = $('#strip-svg').getBoundingClientRect();
    var sx = (clientX - rc.left) * GEO.W / (rc.width || GEO.W);
    return round2(EDU.clamp((sx - GEO.padX) / GEO.span, 0, 1));
  }
  function hitDot(clientX, clientY) {
    if (!GEO) return null;
    var rc = $('#strip-svg').getBoundingClientRect();
    var sx = (clientX - rc.left) * GEO.W / (rc.width || GEO.W), sy = (clientY - rc.top) * GEO.H / (rc.height || GEO.H);
    var best = null, bd = Math.max(GEO.r + 5, 13);
    GEO.dots.forEach(function (d) { var dd = Math.hypot(d.x - sx, d.y - sy); if (dd <= bd) { bd = dd; best = d.it; } });
    return best;
  }

  function setThr(v) {
    v = round2(EDU.clamp(+v, 0, 1));
    if (!isFinite(v)) return;
    S.thr = v;
    store.set('thr', v);
    renderThrDependent();
  }

  function renderDotInfo() {
    var box = $('#dot-info');
    box.innerHTML = '';
    var it = null;
    if (S.sel !== null) items().forEach(function (x) { if (x.id === S.sel) it = x; });
    if (!it) { box.appendChild(el('span', { class: 'muted', text: t('tap_dot') })); return; }
    var c = C(S.scen), k = cellOf(it, S.thr);
    box.appendChild(el('span', { class: 'badge res-badge k-' + k, text: ABBR[k] }));
    box.appendChild(document.createTextNode(' ' + t('dot_info', { item: c.item, id: it.id, s: f2(it.s), real: it.pos ? c.pos : c.neg, pred: (k === 'tp' || k === 'fp') ? c.pos : c.neg, res: t(k + '_name') })));
  }

  function renderInsight(m) {
    var c = C(S.scen), box = $('#insight'), msg, cls = 'callout';
    var acc = metricVal('accuracy', m), prec = metricVal('precision', m);
    if (m.tp + m.fp === 0) { msg = t('ins_all_no', { neg: c.neg, pos: c.pos, acc: pct(acc) }); cls += ' warning'; }
    else if (m.fn + m.tn === 0) { msg = t('ins_all_yes', { pos: c.pos, prec: pct(prec) }); cls += ' warning'; }
    else if (m.fn === 0) { msg = t('ins_no_fn', { pos: c.pos, fp: n0(m.fp) }); cls += ' accent'; }
    else if (m.fp === 0) { msg = t('ins_no_fp', { pos: c.pos, fn: n0(m.fn) }); cls += ' accent'; }
    else msg = t('ins_general');
    box.className = cls;
    box.textContent = msg;
  }

  function renderMetrics(m) {
    var c = C(S.scen), sc = scen(), box = $('#metrics');
    box.innerHTML = '';
    METRICS.forEach(function (k) {
      var p = metricParts(k, m), focus = sc.focus === k;
      var card = el('div', { class: 'metric' + (focus ? ' focus' : ''), id: 'card-' + k },
        el('div', { class: 'row spread', style: { gap: '6px' } },
          el('h3', { text: t('m_' + k) }),
          focus ? el('span', { class: 'badge accent focus-badge', text: '★ ' + t('most_important') }) : null),
        el('p', { class: 'q', text: t('q_' + k, { pos: c.pos }) }),
        ltr('= ' + p.sym, 'big'),
        ltr(plugLine(p), 'plug'),
        el('div', { class: 'mval' + (p.val === null ? ' na' : ''), id: 'val-' + k, dataset: { val: p.val === null ? '' : String(p.val) }, text: p.val === null ? t('not_defined') + ' (0 ÷ 0)' : pct(p.val) }),
        el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span', { style: { width: (p.val === null ? 0 : Math.round(p.val * 100)) + '%', background: focus ? 'var(--accent)' : 'var(--primary)' } })));
      box.appendChild(card);
    });
  }

  function renderItemsTable(list) {
    var c = C(S.scen), tbl = $('#items-table');
    $('#items-summary').textContent = t('table_summary', { n: n0(list.length) });
    tbl.innerHTML = '';
    tbl.appendChild(el('thead', {}, el('tr', {},
      el('th', { text: t('th_item') }), el('th', { text: t('th_score') }), el('th', { text: t('th_real') }), el('th', { text: t('th_pred') }), el('th', { text: t('th_result') }))));
    var body = el('tbody');
    list.slice().sort(function (a, b) { return b.s - a.s || a.id - b.id; }).forEach(function (it) {
      var k = cellOf(it, S.thr);
      body.appendChild(el('tr', {},
        el('td', { text: c.item + ' #' + it.id }),
        el('td', { text: f2(it.s) }),
        el('td', { text: it.pos ? c.pos : c.neg }),
        el('td', { text: (k === 'tp' || k === 'fp') ? c.pos : c.neg }),
        el('td', {}, el('span', { class: 'badge res-badge k-' + k, text: ABBR[k] + ' · ' + t(k + '_name') }))));
    });
    tbl.appendChild(body);
  }

  function renderThrDependent() {
    var list = items(), m = countAt(list, S.thr), c = C(S.scen);
    $('#thr').value = String(S.thr);
    $('#thr-val').textContent = f2(S.thr);
    $('#thr').setAttribute('aria-valuetext', f2(S.thr));
    $('#thr-rule').textContent = t('thr_rule', { t: f2(S.thr), pos: c.pos, neg: c.neg });
    renderStrip();
    renderDotInfo();
    renderInsight(m);
    matrixTable($('#cm'), { scen: S.scen, counts: m, means: true, idPrefix: 'cm-' });
    var p = list.filter(function (it) { return it.pos; }).length;
    $('#cm-totals').textContent = t('col_totals', { pos: c.pos, neg: c.neg, p: n0(p), q: n0(list.length - p), n: n0(list.length) });
    renderMetrics(m);
    renderItemsTable(list);
  }

  function renderLab() {
    var c = C(S.scen), list = items();
    renderScenarioList();
    $('#scen-question').textContent = scen().icon + ' ' + (c.question || '');
    $('#scen-score').textContent = (c.score || '') + ' · ' + t('dataset_n', { n: n0(dsOf(S.scen)) });
    var p = list.filter(function (it) { return it.pos; }).length;
    $('#data-info').textContent = t('data_info', { n: n0(list.length), p: n0(p), q: n0(list.length - p), pos: c.pos, neg: c.neg });
    $('#axis-low').textContent = t('axis_low', { x: c.neg });
    $('#axis-high').textContent = t('axis_high', { x: c.pos });
    $('#which-fp').textContent = c.fp || '';
    $('#which-fn').textContent = c.fn || '';
    $('#which-why').textContent = c.why || '';
    renderThrDependent();
  }

  /* strip pointer handling: tap a dot = inspect it, tap/drag elsewhere = move the threshold */
  (function () {
    var svg = $('#strip-svg'), drag = null, raf = 0, pendingX = null;
    svg.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
      try { svg.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
    });
    svg.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x0) > 6) drag.moved = true;
      if (!drag.moved) return;
      e.preventDefault();
      pendingX = e.clientX;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (pendingX !== null) setThr(thrFromClient(pendingX)); pendingX = null; });
    });
    svg.addEventListener('pointerup', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      if (d.moved) { setThr(thrFromClient(e.clientX)); return; }
      var hit = hitDot(e.clientX, e.clientY);
      if (hit) { S.sel = hit.id; renderStrip(); renderDotInfo(); }
      else setThr(thrFromClient(e.clientX));
    });
    svg.addEventListener('pointercancel', function () { drag = null; });
  })();

  $('#thr').addEventListener('input', function () { setThr(parseFloat(this.value)); });
  $('#thr-down').addEventListener('click', function () { setThr(Math.ceil(S.thr * 20 - 1 - 1e-6) / 20); });
  $('#thr-up').addEventListener('click', function () { setThr(Math.floor(S.thr * 20 + 1 + 1e-6) / 20); });
  $('#best-f1').addEventListener('click', function () {
    var list = items(), best = S.thr, bv = -1;
    var cands = list.map(function (it) { return it.s; }).concat([1]);
    cands.forEach(function (v) {
      var f = metricVal('f1', countAt(list, v)) || 0;
      if (f > bv + 1e-12 || (Math.abs(f - bv) <= 1e-12 && Math.abs(v - 0.5) < Math.abs(best - 0.5))) { bv = f; best = v; }
    });
    setThr(best);
    EDU.toast(t('m_f1') + ' = ' + f2(bv) + ' · ' + t('threshold') + ' = ' + f2(best));
  });
  $('#new-data').addEventListener('click', function () {
    S.ds[S.scen] = dsOf(S.scen) + 1;
    S.sel = null;
    store.set('ds', S.ds);
    renderLab();
    EDU.toast(t('dataset_n', { n: n0(dsOf(S.scen)) }));
  });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen(); });
  $('#reset-all').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['tab', 'scen', 'thr', 'ds', 'mode', 'score'].forEach(function (k) { store.remove(k); });
    S.scen = 'spam'; S.thr = 0.5; S.ds = {}; S.mode = 'mixed'; S.score = scoreOr(null); S.sel = null; Q = null;
    renderAll();
    setTab('explore');
  });
  if (window.ResizeObserver) {
    var lastW = 0;
    new ResizeObserver(function () {
      var w = Math.round($('#strip').clientWidth);
      if (w && w !== lastW) { lastW = w; renderStrip(); }
    }).observe($('#strip'));
  } else {
    window.addEventListener('resize', renderStrip);
  }

  /* ================= LEARN ================= */
  function renderLearn() {
    var c = C('fire');
    var box = $('#learn-cases');
    box.innerHTML = '';
    CELLS.forEach(function (k) {
      var predYes = k === 'tp' || k === 'fp', realYes = k === 'tp' || k === 'fn';
      box.appendChild(el('div', { class: 'case k-' + k },
        el('div', { class: 'row', style: { gap: '8px' } }, el('span', { class: 'abbr', style: { fontSize: '1.2rem' }, text: ABBR[k] }), el('b', { text: t(k + '_name') })),
        el('div', { class: 'pr', text: t('pred_is', { x: predYes ? t('yes') : t('no') }) + ' · ' + t('real_is', { x: realYes ? t('yes') : t('no') }) }),
        el('p', { text: c[k] || '' }),
        el('p', { class: 'small muted', text: t('why_' + k) })));
    });
    matrixTable($('#learn-cm'), { generic: true, why: true });
    var ex = EXAMPLE, total = ex.tp + ex.fp + ex.fn + ex.tn;
    $('#learn-example').textContent = t('learn_example', { n: n0(total), tp: n0(ex.tp), fp: n0(ex.fp), fn: n0(ex.fn), tn: n0(ex.tn) });
    var fbox = $('#learn-formulas');
    fbox.innerHTML = '';
    METRICS.forEach(function (k) {
      var p = metricParts(k, ex);
      fbox.appendChild(el('div', { class: 'fcard' },
        el('h3', { text: t('m_' + k) }),
        ltr('= ' + (k === 'f1' ? '2 × (P × R) / (P + R)' : p.sym), 'big'),
        el('p', { text: t('mean_' + k) }),
        el('p', { class: 'small muted' }, el('span', { text: t('example') + ': ' }), ltr(plugLine(p) + ' = ' + pct(p.val)))));
    });
  }
  $('#go-lab').addEventListener('click', function () { setTab('explore'); window.scrollTo(0, 0); });
  $('#print-learn').addEventListener('click', function () { window.print(); });

  /* ================= PRACTICE ================= */
  var Q = null;
  function randMatrix() {
    for (var i = 0; i < 100; i++) {
      var m = { tp: EDU.randInt(3, 40), fp: EDU.randInt(0, 15), fn: EDU.randInt(0, 15), tn: EDU.randInt(4, 60) };
      if (m.fp + m.fn >= 2) return m;
    }
    return { tp: 18, fp: 4, fn: 3, tn: 15 };
  }
  function newQuestion() {
    var type = S.mode === 'cell' ? 'cell' : (S.mode === 'mixed' ? (Math.random() < 0.3 ? 'cell' : 'calc') : 'calc');
    var sc = EDU.pick(SCEN_IDS);
    if (type === 'calc') {
      var metric = METRICS.indexOf(S.mode) >= 0 ? S.mode : EDU.pick(METRICS);
      Q = { type: 'calc', scen: sc, m: randMatrix(), metric: metric, state: 'open', input: '' };
    } else {
      var cell = EDU.pick(CELLS);
      if (Q && Q.type === 'cell' && Q.cell === cell) cell = EDU.pick(CELLS);
      Q = { type: 'cell', scen: sc, cell: cell, state: 'open', picked: null };
    }
    renderQuestion();
  }
  function bump(ok) {
    var s = S.score;
    s.n++;
    if (ok) { s.c++; s.streak++; s.best = Math.max(s.best, s.streak); } else s.streak = 0;
    store.set('score', s);
    renderScore();
  }
  function renderScore() {
    $('#score-line').textContent = t('score_line', { c: n0(S.score.c), n: n0(S.score.n) });
    $('#streak-line').textContent = t('streak_line', { s: n0(S.score.streak), b: n0(S.score.best) });
  }
  function renderModes() {
    var box = $('#mode-list');
    box.innerHTML = '';
    MODES.forEach(function (k) {
      var label = k === 'mixed' ? t('mode_mixed') : k === 'cell' ? t('mode_cell') : t('m_' + k);
      box.appendChild(el('button', { type: 'button', class: 'chip', id: 'mode-' + k, 'aria-pressed': S.mode === k ? 'true' : 'false', text: label,
        onclick: function () { S.mode = k; store.set('mode', k); renderModes(); newQuestion(); } }));
    });
  }
  /* accepts 0.82, .82, 82, 82%, 0,82 and Indian/Arabic digits */
  function parseAns(str) {
    var s = String(str || '').replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g, function (ch) {
      var code = ch.charCodeAt(0), zeros = [0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0x660, 0x6F0];
      for (var i = 0; i < zeros.length; i++) if (code >= zeros[i] && code <= zeros[i] + 9) return String(code - zeros[i]);
      return ch;
    });
    s = s.replace(/٫/g, '.').replace(/٪/g, '%').replace(/\s+/g, '').replace(',', '.');
    var isPct = /%$/.test(s);
    s = s.replace(/%$/, '');
    if (!/^\+?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    var v = parseFloat(s);
    if (!isFinite(v)) return null;
    if (isPct || v > 1) v = v / 100;
    return v;
  }
  function checkCalc() {
    if (!Q || Q.type !== 'calc' || Q.state === 'right' || Q.state === 'shown') return;
    var inp = $('#q-input');
    Q.input = inp.value;
    var v = parseAns(inp.value);
    if (v === null) { Q.state = 'empty'; renderFeedback(); inp.focus(); return; }
    var ok = Math.abs(v - metricVal(Q.metric, Q.m)) <= 0.01 + 1e-9;
    Q.state = ok ? 'right' : 'wrong';
    bump(ok);
    renderQuestion();
    if (!ok) { var i2 = $('#q-input'); if (i2) { i2.focus(); i2.select(); } }
    else $('#q-next').focus();
  }
  function pickCell(k) {
    if (!Q || Q.type !== 'cell' || Q.state !== 'open') return;
    Q.picked = k;
    Q.state = k === Q.cell ? 'right' : 'wrong';
    bump(Q.state === 'right');
    renderQuestion();
    $('#q-next').focus();
  }
  function renderFeedback() {
    var box = $('#q-feedback');
    box.innerHTML = '';
    if (!Q || Q.state === 'open') return;
    var c = C(Q.scen), node;
    if (Q.type === 'calc') {
      if (Q.state === 'empty') node = el('p', { class: 'callout warning fb', text: t('enter_number') });
      else if (Q.state === 'wrong') node = el('div', { class: 'callout danger fb', id: 'fb-wrong' },
        el('b', { text: '✗ ' + t('wrong') + '. ' }), el('span', { text: t('hint_formula') }), ltr(t('m_' + Q.metric) + ' = ' + metricParts(Q.metric, Q.m).sym));
      else node = el('div', { class: 'callout ' + (Q.state === 'right' ? 'success' : '') + ' fb', id: Q.state === 'right' ? 'fb-right' : 'fb-shown' },
        el('b', { text: Q.state === 'right' ? '✓ ' + t('correct') + ' ' : t('answer_is') + ' ' }), el('br'), solutionEl(Q.metric, Q.m));
    } else {
      var ok = Q.state === 'right';
      node = el('div', { class: 'callout ' + (ok ? 'success' : 'danger') + ' fb', id: ok ? 'fb-right' : 'fb-wrong' },
        el('b', { text: ok ? '✓ ' + t('correct') + ' ' : '✗ ' + t('wrong') + '. ' }),
        el('span', { text: ABBR[Q.cell] + ' · ' + t(Q.cell + '_name') + '. ' + t('why_' + Q.cell) }),
        el('br'), el('span', { class: 'small', text: '→ ' + (c[Q.cell] || '') }));
    }
    box.appendChild(node);
  }
  function renderQuestion() {
    if (!Q) return;
    var c = C(Q.scen), sc = scen(Q.scen);
    $('#q-scen').textContent = sc.icon + ' ' + c.name + ' · ' + c.question;
    var ans = $('#q-answer');
    ans.innerHTML = '';
    if (Q.type === 'calc') {
      matrixTable($('#q-cm'), { scen: Q.scen, counts: Q.m, idPrefix: 'q-' });
      $('#q-text').textContent = t('q_calc', { metric: t('m_' + Q.metric) });
      $('#q-card').dataset.metric = Q.metric;
      $('#q-card').dataset.type = 'calc';
      var done = Q.state === 'right' || Q.state === 'shown';
      var inp = el('input', { type: 'text', id: 'q-input', inputmode: 'decimal', autocomplete: 'off', class: 'no-i18n', dir: 'ltr' });
      inp.value = Q.input || '';
      inp.disabled = done;
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); checkCalc(); } });
      ans.appendChild(el('div', { class: 'ans-row' },
        el('label', { class: 'field', for: 'q-input' }, el('span', { text: t('your_answer') }), inp),
        el('button', { type: 'button', class: 'btn btn-primary', id: 'q-check', text: t('check'), disabled: done, onclick: checkCalc }),
        el('button', { type: 'button', class: 'btn', id: 'q-show', text: t('show_answer'), disabled: done, onclick: function () {
          if (!Q || Q.state === 'right' || Q.state === 'shown') return;
          Q.state = 'shown'; S.score.streak = 0; store.set('score', S.score); renderScore(); renderQuestion();
        } })));
      ans.appendChild(el('p', { class: 'small muted mb0', style: { marginTop: '6px' }, text: t('answer_hint') }));
    } else {
      $('#q-card').dataset.metric = '';
      $('#q-card').dataset.type = 'cell';
      $('#q-card').dataset.pred = (Q.cell === 'tp' || Q.cell === 'fp') ? 'yes' : 'no';
      $('#q-card').dataset.real = (Q.cell === 'tp' || Q.cell === 'fn') ? 'yes' : 'no';
      $('#q-text').textContent = t('q_cell', {
        pred: (Q.cell === 'tp' || Q.cell === 'fp') ? c.pos : c.neg,
        real: (Q.cell === 'tp' || Q.cell === 'fn') ? c.pos : c.neg
      });
      matrixTable($('#q-cm'), { scen: Q.scen, buttons: pickCell });
      CELLS.forEach(function (k) {
        var b = $('#pick-' + k);
        if (Q.state !== 'open') {
          b.disabled = true;
          if (k === Q.cell) b.classList.add('is-right');
          if (k === Q.picked) b.classList.add('is-picked');
        }
      });
    }
    renderFeedback();
  }
  $('#q-next').addEventListener('click', newQuestion);
  $('#score-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    S.score = scoreOr(null); store.set('score', S.score); renderScore();
  });

  /* printable worksheet with answer key */
  function buildWorksheet() {
    var ws = $('#worksheet');
    ws.innerHTML = '';
    ws.appendChild(el('h1', { style: { fontSize: '1.4rem' }, text: t('ws_title') }));
    ws.appendChild(el('p', { text: t('ws_name') }));
    ws.appendChild(el('p', { text: t('ws_instr') }));
    var models = [];
    for (var i = 0; i < 6; i++) models.push({ scen: SCEN[i % SCEN.length].id, m: randMatrix() });
    models.forEach(function (q, n) {
      var c = C(q.scen), tbl = el('table', { class: 'cm cm-small ws-cm' });
      matrixTable(tbl, { scen: q.scen, counts: q.m });
      ws.appendChild(el('div', { class: 'ws-q' },
        el('h3', { text: t('ws_model', { n: n0(n + 1), name: scen(q.scen).icon + ' ' + c.name }) }),
        tbl,
        el('div', { class: 'ws-blanks' }, METRICS.map(function (k) { return el('span', { text: t('m_' + k) + ' = __________' }); }))));
    });
    var key = el('table');
    key.appendChild(el('thead', {}, el('tr', {}, el('th', { text: '#' }), METRICS.map(function (k) { return el('th', { text: t('m_' + k) }); }))));
    var tb = el('tbody');
    models.forEach(function (q, n) {
      tb.appendChild(el('tr', {}, el('td', { text: n0(n + 1) }), METRICS.map(function (k) {
        var v = metricVal(k, q.m);
        return el('td', { text: v === null ? '—' : f2(v) + ' (' + pct(v) + ')' });
      })));
    });
    key.appendChild(tb);
    ws.appendChild(el('div', { class: 'ws-key' }, el('h2', { text: t('ws_answers') }), key));
  }
  $('#ws-print').addEventListener('click', function () {
    buildWorksheet();
    document.body.classList.add('ws-mode');
    setTimeout(function () {
      window.print();
      setTimeout(function () { document.body.classList.remove('ws-mode'); }, 400);
    }, 60);
  });
  window.addEventListener('afterprint', function () { document.body.classList.remove('ws-mode'); });

  /* ================= wiring ================= */
  function renderAll() {
    renderLab();
    renderLearn();
    renderModes();
    renderScore();
    if (Q) renderQuestion();
  }
  EDU.onLang(renderAll);
  renderAll();
  setTab(S.tab);
})();
