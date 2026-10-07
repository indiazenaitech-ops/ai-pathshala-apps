/* Chart Maker: a small data grid → bar, stacked, horizontal bar, line, area, pie, donut, scatter, histogram.
   Hand-drawn SVG (no libraries). Download PNG (1200×675 or 1080×1080) and SVG. */
(function () {
  'use strict';
  var D = window.DATACORE;
  var store = EDU.store('chart-maker');
  var MAX_EDIT_ROWS = 300, MAX_SERIES = 8;
  var TYPES = ['bar', 'stacked', 'hbar', 'line', 'area', 'pie', 'donut', 'scatter', 'hist'];
  var ICONS = {
    bar: '<rect x="3" y="10" width="5" height="10"/><rect x="10" y="4" width="5" height="16"/><rect x="17" y="13" width="5" height="7"/>',
    stacked: '<rect x="3" y="8" width="6" height="12" opacity=".5"/><rect x="3" y="14" width="6" height="6"/><rect x="12" y="3" width="6" height="17" opacity=".5"/><rect x="12" y="11" width="6" height="9"/>',
    hbar: '<rect x="2" y="2" width="16" height="5"/><rect x="2" y="9" width="21" height="5"/><rect x="2" y="16" width="10" height="5"/>',
    line: '<polyline points="2,18 8,10 14,13 22,4" fill="none" stroke="currentColor" stroke-width="2.4"/>',
    area: '<path d="M2 18 L8 10 L14 13 L22 4 L22 21 L2 21Z" opacity=".7"/>',
    pie: '<path d="M12 11 L12 2 A9 9 0 1 1 3.5 14Z"/><path d="M12 11 L3.5 14 A9 9 0 0 1 12 2Z" opacity=".45"/>',
    donut: '<circle cx="12" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="30 14"/>',
    scatter: '<circle cx="5" cy="17" r="2.2"/><circle cx="9" cy="12" r="2.2"/><circle cx="14" cy="13" r="2.2"/><circle cx="17" cy="7" r="2.2"/><circle cx="21" cy="4" r="2.2"/>',
    hist: '<rect x="2" y="13" width="4" height="8"/><rect x="6" y="7" width="4" height="14"/><rect x="10" y="3" width="4" height="18"/><rect x="14" y="9" width="4" height="12"/><rect x="18" y="15" width="4" height="6"/>'
  };
  var PAL = {
    default: null,
    cb: ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#CC79A7', '#56B4E9', '#8C6D00', '#555555'],
    warm: ['#c2410c', '#f59e0b', '#be123c', '#a16207', '#ea580c', '#db2777', '#92400e', '#e11d48'],
    cool: ['#1d4ed8', '#0891b2', '#0d9488', '#4f46e5', '#0284c7', '#7c3aed', '#059669', '#475569'],
    mono: ['#0b4f5c', '#2d7684', '#5197a3', '#7bb5bf', '#a6d0d6', '#0f3b45', '#3f8792', '#c7e2e6']
  };
  var LIGHT_DEFAULT = ['#0b7285', '#e8590c', '#5f3dc4', '#2b8a3e', '#c2255c', '#b08900', '#1971c2', '#868e96'];
  var SIZES = { wide: [1200, 675], square: [1080, 1080] };

  EDU.init({ slug: 'chart-maker', title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  var DEF_O = { title: '', x: '', y: '', sort: 'none', fmt: 'plain', pal: 'default', bins: '', legend: true, labels: false, zero: true };
  var saved = store.get('state', null);
  var S = saved && saved.grid && saved.grid.length ? saved : null;
  if (S) { S.o = Object.assign({}, DEF_O, S.o || {}); if (TYPES.indexOf(S.type) < 0) S.type = 'bar'; if (!SIZES[S.size]) S.size = 'wide'; }

  function V() { var C = window.APP_CONTENT; return C[EDU.lang] || C.en; }

  /* ---------- samples ---------- */
  var HW = [[152, 44], [148, 41], [160, 50], [155, 47], [165, 56], [142, 38], [158, 49], [150, 46], [163, 52], [147, 43], [168, 60], [153, 45]];
  var MARKS40 = [35, 42, 48, 51, 55, 58, 60, 61, 63, 64, 66, 67, 68, 69, 70, 71, 72, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 85, 86, 88, 89, 90, 91, 92, 94, 95, 97, 99];
  function sampleState(id) {
    var v = V(), H = v.h, g, o = Object.assign({}, DEF_O), type;
    if (id === 'sales') {
      var a = [42000, 38500, 51000, 47500, 55000, 61000], b = [45500, 44000, 58500, 52000, 63000, 72500];
      g = [[H.month, '2025', '2026']];
      for (var i = 0; i < 6; i++) g.push([v.months[i + 3], String(a[i]), String(b[i])]);
      type = 'bar'; o.fmt = 'inr'; o.title = EDU.t('title_sales'); o.x = H.month; o.y = H.sales;
    } else if (id === 'fruit') {
      var n = [14, 9, 6, 4, 7]; g = [[H.fruit, H.students]];
      for (i = 0; i < 5; i++) g.push([v.fruits[i], String(n[i])]);
      type = 'pie'; o.title = EDU.t('title_fruit'); o.labels = true;
    } else if (id === 'hw') {
      g = [[H.name, H.height, H.weight]];
      for (i = 0; i < HW.length; i++) g.push([v.names[i], String(HW[i][0]), String(HW[i][1])]);
      type = 'scatter'; o.title = EDU.t('title_hw'); o.x = H.height; o.y = H.weight; o.zero = false;
    } else {
      g = [[H.roll, H.marks]];
      for (i = 0; i < MARKS40.length; i++) g.push([String(i + 1), String(MARKS40[i])]);
      type = 'hist'; o.title = EDU.t('title_marks'); o.x = H.marks; o.y = H.students;
    }
    return { grid: g, type: type, o: o, size: S ? S.size : 'wide', sample: id };
  }
  function loadSample(id, keepLook) {
    var ns = sampleState(id);
    if (keepLook && S) { ns.type = S.type; ns.size = S.size; ['sort', 'fmt', 'pal', 'bins', 'legend', 'labels', 'zero'].forEach(function (k) { ns.o[k] = S.o[k]; }); }
    S = ns; save(); renderAll();
  }

  var saveTimer;
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { if (!store.set('state', S)) { /* too big for storage: keep working */ } }, 200); }

  /* ---------- reading the grid ---------- */
  function getData() {
    var g = S.grid, head = g[0], width = head.length, rows = [], bad = 0, r, c;
    for (r = 1; r < g.length; r++) { var row = g[r]; for (c = 0; c < width; c++) if (String(row[c] || '').trim()) { rows.push(row); break; } }
    var series = [];
    for (c = 1; c < width; c++) {
      var vals = [], any = false;
      for (r = 0; r < rows.length; r++) {
        var raw = String(rows[r][c] == null ? '' : rows[r][c]).trim(), x = raw ? D.parseNum(raw) : NaN;
        if (raw && x !== x) bad++;
        if (x === x) any = true;
        vals.push(x);
      }
      if (any || String(head[c] || '').trim()) series.push({ name: String(head[c] || '').trim() || EDU.t('series_n', { n: c }), values: vals, col: c });
    }
    return { labels: rows.map(function (rw) { return String(rw[0] == null ? '' : rw[0]).trim(); }), series: series.slice(0, MAX_SERIES), bad: bad, labelHead: String(head[0] || '').trim() };
  }
  function sorted(d) {
    var o = S.o.sort, idx = d.labels.map(function (_, i) { return i; });
    if (o === 'none' || !d.series.length) return d;
    var s0 = d.series[0].values, coll = new Intl.Collator(undefined, { numeric: true });
    if (o === 'az') idx.sort(function (a, b) { return coll.compare(d.labels[a], d.labels[b]); });
    else idx.sort(function (a, b) { var x = s0[a], y = s0[b]; if (x !== x) return 1; if (y !== y) return -1; return o === 'desc' ? y - x : x - y; });
    return { labels: idx.map(function (i) { return d.labels[i]; }), series: d.series.map(function (s) { return { name: s.name, col: s.col, values: idx.map(function (i) { return s.values[i]; }) }; }), bad: d.bad, labelHead: d.labelHead };
  }

  /* ---------- numbers ---------- */
  function fmtV(v) {
    if (!isFinite(v)) return '';
    var f = S.o.fmt, a = Math.abs(v), sign = v < 0 ? '-' : '';
    if (f === 'inr') return sign + '₹' + EDU.fmt(a, { maximumFractionDigits: 2 });
    if (f === 'pct') return EDU.fmt(v, { maximumFractionDigits: 2 }) + '%';
    if (f === 'lakh') {
      if (a >= 1e7) return sign + EDU.fmt(a / 1e7, { maximumFractionDigits: 2 }) + ' ' + EDU.t('crore');
      if (a >= 1e5) return sign + EDU.fmt(a / 1e5, { maximumFractionDigits: 2 }) + ' ' + EDU.t('lakh');
    }
    return EDU.fmt(v, { maximumFractionDigits: 2 });
  }

  /* ---------- text measuring ---------- */
  var mctx = document.createElement('canvas').getContext('2d');
  var FONT = '"Noto Sans", "Nirmala UI", "Segoe UI", Roboto, system-ui, sans-serif';
  function tw(s, fs, bold) { mctx.font = (bold ? '700 ' : '') + fs + 'px ' + FONT; return mctx.measureText(String(s)).width; }
  function fit(s, maxW, fs, bold) {
    s = String(s);
    if (tw(s, fs, bold) <= maxW) return s;
    var lo = 0, hi = s.length;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (tw(s.slice(0, mid) + '…', fs, bold) <= maxW) lo = mid; else hi = mid - 1; }
    return s.slice(0, Math.max(1, lo)) + '…';
  }
  function esc(s) { return EDU.esc(s); }

  /* ---------- SVG building ---------- */
  function themeColors(exporting) {
    var dark = !exporting && EDU.theme() === 'dark';
    var pal = PAL[S.o.pal];
    if (!pal) pal = exporting ? LIGHT_DEFAULT : [1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return EDU.css('--c' + i) || LIGHT_DEFAULT[i - 1]; });
    if (dark && S.o.pal === 'mono') pal = ['#5cc0cf', '#3f9fae', '#87d3dd', '#2e8190', '#b0e3ea', '#1f6573', '#6fc9d6', '#d3f0f3'];
    return exporting ? { bg: '#ffffff', text: '#1b2a30', muted: '#5a6a70', grid: '#e6ded2', axis: '#9aa7ab', pal: pal }
      : { bg: EDU.css('--surface') || '#fff', text: EDU.css('--text') || '#1b2a30', muted: EDU.css('--muted') || '#5a6a70', grid: EDU.css('--border') || '#e3d8c9', axis: EDU.css('--muted') || '#888', pal: pal };
  }

  function buildSvg(W, H, exporting) {
    var th = themeColors(exporting), d = getData(), type = S.type, o = S.o, out = [], warns = [], marks = 0;
    if (type !== 'scatter' && type !== 'hist') d = sorted(d);
    function T(x, y, s, a) {
      a = a || {};
      var attrs = ' x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + (a.fs || 18) + '" fill="' + (a.fill || th.text) + '"' +
        (a.anchor ? ' text-anchor="' + a.anchor + '"' : '') + (a.bold ? ' font-weight="700"' : '') + (a.rot ? ' transform="rotate(' + a.rot + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"' : '') + (a.base ? ' dominant-baseline="' + a.base + '"' : '');
      out.push('<text' + attrs + '>' + esc(s) + '</text>');
    }
    function color(i) { return th.pal[i % th.pal.length]; }
    var pad = 28, top = pad, fsT = 34, fsL = 19, fsTick = 17;
    out.push('<rect width="' + W + '" height="' + H + '" fill="' + th.bg + '"/>');
    if (o.title) { T(W / 2, top + fsT * 0.8, fit(o.title, W - 2 * pad, fsT, true), { fs: fsT, anchor: 'middle', bold: true }); top += fsT + 18; }

    var ser = d.series, n = d.labels.length;
    var anyNum = ser.some(function (s) { return s.values.some(function (v) { return v === v; }); });
    function finish(msgKey) {
      if (msgKey) T(W / 2, H / 2, EDU.t(msgKey), { fs: 22, anchor: 'middle', fill: th.muted });
      if (d.bad) warns.push(EDU.t('warn_bad', { n: EDU.fmt(d.bad) }));
      return { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" direction="ltr" font-family=\'' + FONT + '\'>' + out.join('') + '</svg>', warns: warns, marks: marks };
    }
    if (!anyNum || !ser.length) return finish('no_data');

    /* legend across the top for several series */
    function topLegend(names) {
      if (!o.legend || names.length < 2) return;
      var x = pad, y = top + 12, lineH = 30, maxW = W - 2 * pad;
      var items = names.map(function (nm, i) { var lab = fit(nm, 260, fsL); return { lab: lab, w: 22 + tw(lab, fsL) + 26, i: i }; });
      var total = items.reduce(function (s, it) { return s + it.w; }, 0);
      if (total <= maxW) x = (W - total) / 2;
      items.forEach(function (it) {
        if (x + it.w > W - pad && x > pad) { x = pad; y += lineH; }
        out.push('<rect x="' + x + '" y="' + (y - 8) + '" width="16" height="16" rx="3" fill="' + color(it.i) + '"/>');
        T(x + 22, y + 6, it.lab, { fs: fsL });
        x += it.w;
      });
      top = y + lineH - 4;
    }

    /* ---------- pie / donut ---------- */
    if (type === 'pie' || type === 'donut') {
      if (ser.length > 1) warns.push(EDU.t('warn_pie_series', { name: ser[0].name }));
      var vals = ser[0].values, items = [], skipped = 0;
      for (var i = 0; i < n; i++) { var v = vals[i]; if (v === v && v > 0) items.push({ lab: d.labels[i] || EDU.t('row_n', { n: i + 1 }), v: v }); else if (v === v) skipped++; }
      if (skipped) warns.push(EDU.t('warn_pie_neg', { n: EDU.fmt(skipped) }));
      if (items.length > 6) warns.push(EDU.t('warn_pie_many', { n: EDU.fmt(items.length) }));
      if (!items.length) return finish('no_data');
      var sum = items.reduce(function (s, it) { return s + it.v; }, 0);
      var legW = o.legend ? Math.min(W * 0.42, Math.max.apply(null, items.map(function (it) { return tw(it.lab + '  ' + fmtV(it.v), fsL); })) + 60) : 0;
      if (W < 1100 || H > W) legW = 0;                                   /* square: legend goes underneath */
      var legRows = o.legend && !legW ? Math.min(items.length, 8) : 0;
      var bottomLeg = legRows ? Math.ceil(legRows / 2) * 30 + 20 : 0;
      var areaW = W - 2 * pad - legW, areaH = H - top - pad - bottomLeg;
      var R = Math.max(40, Math.min(areaW, areaH) / 2 - 10), cx = pad + areaW / 2, cy = top + areaH / 2, inner = type === 'donut' ? R * 0.58 : 0;
      var ang = -Math.PI / 2;
      items.forEach(function (it, k) {
        var a = it.v / sum * Math.PI * 2, a2 = ang + a, large = a > Math.PI ? 1 : 0, path;
        var x1 = cx + R * Math.cos(ang), y1 = cy + R * Math.sin(ang), x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
        if (items.length === 1) path = inner ? 'M' + (cx + R) + ' ' + cy + 'A' + R + ' ' + R + ' 0 1 1 ' + (cx - R) + ' ' + cy + 'A' + R + ' ' + R + ' 0 1 1 ' + (cx + R) + ' ' + cy + 'M' + (cx + inner) + ' ' + cy + 'A' + inner + ' ' + inner + ' 0 1 0 ' + (cx - inner) + ' ' + cy + 'A' + inner + ' ' + inner + ' 0 1 0 ' + (cx + inner) + ' ' + cy + 'Z'
          : 'M' + (cx + R) + ' ' + cy + 'A' + R + ' ' + R + ' 0 1 1 ' + (cx - R) + ' ' + cy + 'A' + R + ' ' + R + ' 0 1 1 ' + (cx + R) + ' ' + cy + 'Z';
        else if (inner) {
          var ix1 = cx + inner * Math.cos(a2), iy1 = cy + inner * Math.sin(a2), ix2 = cx + inner * Math.cos(ang), iy2 = cy + inner * Math.sin(ang);
          path = 'M' + x1.toFixed(2) + ' ' + y1.toFixed(2) + 'A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + 'L' + ix1.toFixed(2) + ' ' + iy1.toFixed(2) + 'A' + inner + ' ' + inner + ' 0 ' + large + ' 0 ' + ix2.toFixed(2) + ' ' + iy2.toFixed(2) + 'Z';
        } else path = 'M' + cx + ' ' + cy + 'L' + x1.toFixed(2) + ' ' + y1.toFixed(2) + 'A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + 'Z';
        out.push('<path class="cm-slice" d="' + path + '" fill="' + color(k) + '" stroke="' + th.bg + '" stroke-width="2" fill-rule="evenodd"><title>' + esc(it.lab + ': ' + fmtV(it.v)) + '</title></path>');
        marks++;
        if (o.labels && a > 0.22) {
          var mid = ang + a / 2, rr = inner ? (R + inner) / 2 : R * 0.64;
          T(cx + rr * Math.cos(mid), cy + rr * Math.sin(mid) + 7, EDU.fmt(it.v / sum * 100, { maximumFractionDigits: 1 }) + '%', { fs: 20, anchor: 'middle', bold: true, fill: '#ffffff' });
        }
        ang = a2;
      });
      if (inner) { T(cx, cy - 4, fmtV(sum), { fs: 30, anchor: 'middle', bold: true }); T(cx, cy + 28, EDU.t('total'), { fs: fsL, anchor: 'middle', fill: th.muted }); }
      if (o.legend) {
        var shown = items.slice(0, legW ? Math.floor((H - top - pad) / 32) : 8);
        shown.forEach(function (it, k) {
          var lx, ly, colW;
          if (legW) { lx = W - pad - legW + 10; ly = top + 20 + k * 32; colW = legW - 40; }
          else { colW = (W - 2 * pad) / 2 - 30; lx = pad + (k % 2) * ((W - 2 * pad) / 2); ly = H - pad - bottomLeg + 30 + Math.floor(k / 2) * 30; }
          out.push('<rect x="' + lx + '" y="' + (ly - 9) + '" width="16" height="16" rx="3" fill="' + color(k) + '"/>');
          T(lx + 24, ly + 5, fit(it.lab + '  ' + fmtV(it.v), colW, fsL), { fs: fsL });
        });
        if (items.length > shown.length) T(W - pad, H - 10, EDU.t('more_n', { n: items.length - shown.length }), { fs: 15, anchor: 'end', fill: th.muted });
      }
      return finish();
    }

    /* ---------- shared cartesian helpers ---------- */
    function axisTitleY(left) { if (o.y) T(pad + 12, top + (H - top - pad) / 2, fit(o.y, H - top - 2 * pad, fsL, true), { fs: fsL, anchor: 'middle', bold: true, rot: -90, fill: th.muted }); }

    /* ---------- scatter ---------- */
    if (type === 'scatter') {
      var xs, ys, xName, yName, labs = d.labels;
      if (ser.length >= 2) { xs = ser[0].values; ys = ser[1].values; xName = ser[0].name; yName = ser[1].name; }
      else {
        var lx2 = labs.map(D.parseNum);
        if (lx2.filter(function (v) { return v === v; }).length >= 2) { xs = lx2; ys = ser[0].values; xName = d.labelHead; yName = ser[0].name; labs = labs.map(function () { return ''; }); }
        else { warns.push(EDU.t('warn_scatter')); return finish('need_two'); }
      }
      var pts = [];
      for (i = 0; i < xs.length; i++) if (xs[i] === xs[i] && ys[i] === ys[i]) pts.push({ x: xs[i], y: ys[i], lab: labs[i] });
      if (pts.length < 2) { warns.push(EDU.t('warn_scatter')); return finish('need_two'); }
      var xv = pts.map(function (p) { return p.x; }), yv = pts.map(function (p) { return p.y; });
      var xlo = Math.min.apply(null, xv), xhi = Math.max.apply(null, xv), ylo = Math.min.apply(null, yv), yhi = Math.max.apply(null, yv);
      if (o.zero) { xlo = Math.min(0, xlo); ylo = Math.min(0, ylo); xhi = Math.max(0, xhi); yhi = Math.max(0, yhi); }
      var xt = D.niceTicks(xlo, xhi, 7), yt = D.niceTicks(ylo, yhi, 6);
      var yLabW = Math.max.apply(null, yt.map(function (v) { return tw(fmtV(v), fsTick); }));
      var L = pad + (o.y ? 34 : 0) + yLabW + 12, R2 = W - pad - 10, B = H - pad - 34 - (o.x ? 34 : 0), Tp = top + 10;
      var X = function (v) { return L + (v - xt[0]) / (xt[xt.length - 1] - xt[0]) * (R2 - L); };
      var Y = function (v) { return B - (v - yt[0]) / (yt[yt.length - 1] - yt[0]) * (B - Tp); };
      yt.forEach(function (v) { out.push('<line x1="' + L + '" x2="' + R2 + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="' + th.grid + '"/>'); T(L - 10, Y(v) + 6, fmtV(v), { fs: fsTick, anchor: 'end', fill: th.muted }); });
      xt.forEach(function (v) { out.push('<line y1="' + Tp + '" y2="' + B + '" x1="' + X(v).toFixed(1) + '" x2="' + X(v).toFixed(1) + '" stroke="' + th.grid + '"/>'); T(X(v), B + 26, fmtV(v), { fs: fsTick, anchor: 'middle', fill: th.muted }); });
      pts.forEach(function (p) {
        out.push('<circle class="cm-dot" cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="8" fill="' + color(0) + '" fill-opacity=".85" stroke="' + th.bg + '" stroke-width="1.5"><title>' + esc((p.lab ? p.lab + ': ' : '') + fmtV(p.x) + ', ' + fmtV(p.y)) + '</title></circle>');
        marks++;
        if (o.labels && p.lab) T(X(p.x) + 11, Y(p.y) - 9, fit(p.lab, 140, 15), { fs: 15, fill: th.muted });
      });
      var rr2 = D.pearson(new Float64Array(xv), new Float64Array(yv)).r;
      if (isFinite(rr2)) T(rr2 >= 0 ? L + 12 : R2 - 12, Tp + 22, 'r = ' + EDU.fmt(rr2, { maximumFractionDigits: 2, minimumFractionDigits: 2 }), { fs: 18, anchor: rr2 >= 0 ? 'start' : 'end', fill: th.muted, bold: true });
      if (o.x || xName) T((L + R2) / 2, H - pad, fit(o.x || xName, R2 - L, fsL, true), { fs: fsL, anchor: 'middle', bold: true, fill: th.muted });
      if (!o.y && yName) o = Object.assign({}, o, { y: yName });
      if (o.y) T(pad + 12, (Tp + B) / 2, fit(o.y, B - Tp, fsL, true), { fs: fsL, anchor: 'middle', bold: true, rot: -90, fill: th.muted });
      return finish();
    }

    /* ---------- histogram ---------- */
    if (type === 'hist') {
      var hv = ser[0].values.filter(function (v) { return v === v; });
      if (ser.length > 1) warns.push(EDU.t('warn_hist_series', { name: ser[0].name }));
      if (hv.length < 2) { warns.push(EDU.t('warn_hist')); return finish('no_data'); }
      if (hv.length < 20) warns.push(EDU.t('warn_hist_few', { n: EDU.fmt(hv.length) }));
      var hlo = Math.min.apply(null, hv), hhi = Math.max.apply(null, hv);
      var nb = parseInt(o.bins, 10); if (!(nb >= 2)) nb = Math.ceil(Math.log2(hv.length) + 1); nb = Math.max(2, Math.min(50, nb));
      if (hlo === hhi) { hlo -= 0.5; hhi += 0.5; }
      var step = (hhi - hlo) / nb, nice = D.niceTicks(0, step, 1); step = nice[1] && nice[1] >= step ? nice[1] : step;
      var start = Math.floor(hlo / step) * step; nb = Math.max(1, Math.ceil((hhi - start) / step + 1e-9)); if (start + nb * step <= hhi) nb++;
      var counts = []; for (i = 0; i < nb; i++) counts.push(0);
      hv.forEach(function (v) { var k = Math.floor((v - start) / step + 1e-9); if (k >= nb) k = nb - 1; if (k < 0) k = 0; counts[k]++; });
      var cmax = Math.max.apply(null, counts), ht = D.niceTicks(0, cmax, 5);
      var hyw = Math.max.apply(null, ht.map(function (v) { return tw(EDU.fmt(v), fsTick); }));
      var hL = pad + (o.y ? 34 : 0) + hyw + 12, hR = W - pad - 10, hB = H - pad - 34 - (o.x ? 34 : 0), hT = top + 10;
      var hY = function (v) { return hB - v / ht[ht.length - 1] * (hB - hT); }, bw = (hR - hL) / nb;
      ht.forEach(function (v) { out.push('<line x1="' + hL + '" x2="' + hR + '" y1="' + hY(v).toFixed(1) + '" y2="' + hY(v).toFixed(1) + '" stroke="' + th.grid + '"/>'); T(hL - 10, hY(v) + 6, EDU.fmt(v), { fs: fsTick, anchor: 'end', fill: th.muted }); });
      var every = Math.max(1, Math.ceil(70 / bw));
      for (i = 0; i < nb; i++) {
        var x0 = hL + i * bw, y0 = hY(counts[i]);
        out.push('<rect class="cm-bar" x="' + (x0 + 1).toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + Math.max(1, bw - 2).toFixed(1) + '" height="' + (hB - y0).toFixed(1) + '" fill="' + color(0) + '"><title>' + esc(fmtV(start + i * step) + ' – ' + fmtV(start + (i + 1) * step) + ': ' + counts[i]) + '</title></rect>');
        marks++;
        if (o.labels && counts[i]) T(x0 + bw / 2, y0 - 8, EDU.fmt(counts[i]), { fs: 16, anchor: 'middle' });
        if (i % every === 0) T(x0, hB + 26, fmtV(start + i * step), { fs: fsTick, anchor: 'middle', fill: th.muted });
      }
      if (nb % every === 0) T(hL + nb * bw, hB + 26, fmtV(start + nb * step), { fs: fsTick, anchor: 'middle', fill: th.muted });
      out.push('<line x1="' + hL + '" x2="' + hR + '" y1="' + hB + '" y2="' + hB + '" stroke="' + th.axis + '" stroke-width="1.5"/>');
      if (o.x) T((hL + hR) / 2, H - pad, fit(o.x, hR - hL, fsL, true), { fs: fsL, anchor: 'middle', bold: true, fill: th.muted });
      if (o.y) T(pad + 12, (hT + hB) / 2, fit(o.y, hB - hT, fsL, true), { fs: fsL, anchor: 'middle', bold: true, rot: -90, fill: th.muted });
      return finish();
    }

    /* ---------- bar / stacked / hbar / line / area ---------- */
    var labels = d.labels.map(function (l, k) { return l || EDU.t('row_n', { n: k + 1 }); });
    topLegend(ser.map(function (s) { return s.name; }));
    var lo = Infinity, hi = -Infinity;
    if (type === 'stacked') {
      for (i = 0; i < n; i++) { var pos = 0, neg = 0; ser.forEach(function (s) { var v = s.values[i]; if (v === v) { if (v >= 0) pos += v; else neg += v; } }); hi = Math.max(hi, pos); lo = Math.min(lo, neg); }
    } else ser.forEach(function (s) { s.values.forEach(function (v) { if (v === v) { if (v < lo) lo = v; if (v > hi) hi = v; } }); });
    var barLike = type === 'bar' || type === 'stacked' || type === 'hbar';
    if (o.zero || type === 'stacked') { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    else if (barLike && (lo > 0 || hi < 0)) warns.push(EDU.t('warn_trunc'));
    if (n > 30 && type !== 'hbar') warns.push(EDU.t('warn_many', { n: EDU.fmt(n) }));
    var ticks = D.niceTicks(lo, hi, 6), t0 = ticks[0], t1 = ticks[ticks.length - 1];
    var tickW = Math.max.apply(null, ticks.map(function (v) { return tw(fmtV(v), fsTick); }));

    if (type === 'hbar') {
      var maxLab = Math.max.apply(null, labels.map(function (l) { return tw(l, fsTick); }));
      var labW = Math.min(W * 0.3, maxLab + 6);
      var hL2 = pad + (o.y ? 34 : 0) + labW + 12, hR2 = W - pad - tickW / 2 - 6, hT2 = top + 6, hB2 = H - pad - 30 - (o.x ? 34 : 0);
      var XV = function (v) { return hL2 + (v - t0) / (t1 - t0) * (hR2 - hL2); }, band = (hB2 - hT2) / n, gh = band * 0.78, bh = gh / ser.length;
      ticks.forEach(function (v) { out.push('<line y1="' + hT2 + '" y2="' + hB2 + '" x1="' + XV(v).toFixed(1) + '" x2="' + XV(v).toFixed(1) + '" stroke="' + th.grid + '"/>'); T(XV(v), hB2 + 24, fmtV(v), { fs: fsTick, anchor: 'middle', fill: th.muted }); });
      var everyH = Math.max(1, Math.ceil(16 / band)), lfs = Math.max(11, Math.min(fsTick, band * 0.8));
      var zx = XV(Math.max(t0, Math.min(t1, 0)));
      for (i = 0; i < n; i++) {
        var gy = hT2 + i * band + (band - gh) / 2;
        ser.forEach(function (s, j) {
          var v = s.values[i]; if (v !== v) return;
          var x1 = XV(Math.max(t0, Math.min(t1, v))), xa = Math.min(zx, x1), ww = Math.abs(x1 - zx);
          out.push('<rect class="cm-bar" x="' + xa.toFixed(1) + '" y="' + (gy + j * bh).toFixed(1) + '" width="' + Math.max(0.5, ww).toFixed(1) + '" height="' + Math.max(0.5, bh - 1).toFixed(1) + '" rx="2" fill="' + color(ser.length > 1 ? j : 0) + '"><title>' + esc(labels[i] + ' · ' + s.name + ': ' + fmtV(v)) + '</title></rect>');
          marks++;
          if (o.labels && bh >= 12) T(v >= 0 ? x1 + 6 : x1 - 6, gy + j * bh + bh / 2 + 6, fmtV(v), { fs: Math.min(16, bh), anchor: v >= 0 ? 'start' : 'end' });
        });
        if (i % everyH === 0) T(hL2 - 10, hT2 + i * band + band / 2 + lfs / 3, fit(labels[i], labW, lfs), { fs: lfs, anchor: 'end' });
      }
      out.push('<line y1="' + hT2 + '" y2="' + hB2 + '" x1="' + zx.toFixed(1) + '" x2="' + zx.toFixed(1) + '" stroke="' + th.axis + '" stroke-width="1.5"/>');
      if (o.x) T((hL2 + hR2) / 2, H - pad, fit(o.x, hR2 - hL2, fsL, true), { fs: fsL, anchor: 'middle', bold: true, fill: th.muted });
      if (o.y) T(pad + 12, (hT2 + hB2) / 2, fit(o.y, hB2 - hT2, fsL, true), { fs: fsL, anchor: 'middle', bold: true, rot: -90, fill: th.muted });
      return finish();
    }

    /* vertical: work out the x label space */
    var cL = pad + (o.y ? 34 : 0) + tickW + 12, cR = W - pad - 6, plotW = cR - cL, bandW = plotW / n;
    var maxLW = Math.max.apply(null, labels.map(function (l) { return tw(l, fsTick); }));
    var rotate = maxLW > bandW - 8, labH = rotate ? Math.min(150, Math.min(maxLW, 170) * 0.66 + 16) : 30;
    var cB = H - pad - labH - (o.x ? 34 : 0), cT = top + 10;
    var YV = function (v) { return cB - (v - t0) / (t1 - t0) * (cB - cT); };
    ticks.forEach(function (v) { out.push('<line x1="' + cL + '" x2="' + cR + '" y1="' + YV(v).toFixed(1) + '" y2="' + YV(v).toFixed(1) + '" stroke="' + th.grid + '"/>'); T(cL - 10, YV(v) + 6, fmtV(v), { fs: fsTick, anchor: 'end', fill: th.muted }); });
    var zy = YV(Math.max(t0, Math.min(t1, 0)));
    var everyV = rotate ? Math.max(1, Math.ceil(24 / bandW)) : 1;
    for (i = 0; i < n; i += everyV) {
      var lxc = cL + i * bandW + bandW / 2;
      if (rotate) T(lxc + 6, cB + 18, fit(labels[i], Math.max(40, Math.min(170, (lxc - pad) / 0.77)), fsTick), { fs: Math.min(fsTick, Math.max(11, bandW * everyV * 0.8)), anchor: 'end', rot: -40 });
      else T(lxc, cB + 26, labels[i], { fs: fsTick, anchor: 'middle' });
    }
    if (type === 'bar' || type === 'stacked') {
      var gw = bandW * (type === 'stacked' ? 0.62 : 0.78), bw2 = type === 'stacked' ? gw : gw / ser.length;
      for (i = 0; i < n; i++) {
        var gx = cL + i * bandW + (bandW - gw) / 2, pos2 = 0, neg2 = 0;
        ser.forEach(function (s, j) {
          var v = s.values[i]; if (v !== v) return;
          var ya, yb;
          if (type === 'stacked') { if (v >= 0) { ya = YV(pos2 + v); yb = YV(pos2); pos2 += v; } else { ya = YV(neg2); yb = YV(neg2 + v); neg2 += v; } }
          else { var yv = YV(Math.max(t0, Math.min(t1, v))); ya = Math.min(yv, zy); yb = Math.max(yv, zy); }
          var bx = type === 'stacked' ? gx : gx + j * bw2;
          out.push('<rect class="cm-bar" x="' + bx.toFixed(1) + '" y="' + ya.toFixed(1) + '" width="' + Math.max(0.5, bw2 - (type === 'stacked' ? 0 : 1)).toFixed(1) + '" height="' + Math.max(0.5, yb - ya).toFixed(1) + '" rx="2" fill="' + color(ser.length > 1 || type === 'stacked' ? j : 0) + '"><title>' + esc(labels[i] + ' · ' + s.name + ': ' + fmtV(v)) + '</title></rect>');
          marks++;
          if (o.labels && bw2 >= 26) {
            if (type === 'stacked') { if (yb - ya > 20) T(bx + bw2 / 2, (ya + yb) / 2 + 6, fmtV(v), { fs: Math.min(16, bw2 / 3), anchor: 'middle', fill: '#ffffff', bold: true }); }
            else T(bx + bw2 / 2, v >= 0 ? ya - 8 : yb + 20, fmtV(v), { fs: Math.min(16, bw2 / 3.2), anchor: 'middle' });
          }
        });
      }
    } else {
      ser.forEach(function (s, j) {
        var c = color(j), segs = [], cur = [];
        s.values.forEach(function (v, k) { if (v === v) cur.push([cL + k * bandW + bandW / 2, YV(v), v, k]); else if (cur.length) { segs.push(cur); cur = []; } });
        if (cur.length) segs.push(cur);
        segs.forEach(function (seg) {
          var dd = seg.map(function (p, k) { return (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
          if (type === 'area' && seg.length > 1) out.push('<path d="' + dd + 'L' + seg[seg.length - 1][0].toFixed(1) + ' ' + zy.toFixed(1) + 'L' + seg[0][0].toFixed(1) + ' ' + zy.toFixed(1) + 'Z" fill="' + c + '" fill-opacity="' + (ser.length > 1 ? '.28' : '.35') + '"/>');
          out.push('<path class="cm-line" d="' + dd + '" fill="none" stroke="' + c + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>');
        });
        segs.forEach(function (seg) {
          seg.forEach(function (p) {
            out.push('<circle class="cm-dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (n > 60 ? 2.5 : 5.5) + '" fill="' + c + '" stroke="' + th.bg + '" stroke-width="1.5"><title>' + esc(labels[p[3]] + ' · ' + s.name + ': ' + fmtV(p[2])) + '</title></circle>');
            marks++;
            if (o.labels && n <= 40) T(p[0], p[1] - 12, fmtV(p[2]), { fs: 15, anchor: 'middle' });
          });
        });
      });
    }
    out.push('<line x1="' + cL + '" x2="' + cR + '" y1="' + zy.toFixed(1) + '" y2="' + zy.toFixed(1) + '" stroke="' + th.axis + '" stroke-width="1.5"/>');
    if (o.x) T((cL + cR) / 2, H - pad, fit(o.x, plotW, fsL, true), { fs: fsL, anchor: 'middle', bold: true, fill: th.muted });
    if (o.y) T(pad + 12, (cT + cB) / 2, fit(o.y, cB - cT, fsL, true), { fs: fsL, anchor: 'middle', bold: true, rot: -90, fill: th.muted });
    return finish();
  }

  /* ---------- drawing the preview ---------- */
  var drawTimer;
  function draw() {
    var sz = SIZES[S.size], stage = EDU.$('#stage'), pw = sz[0], ph = sz[1], sw = stage.clientWidth;
    if (sw && sw < 700) { ph = Math.round(ph * 760 / pw); pw = 760; }        /* small screens: bigger text in the preview */
    var res = buildSvg(pw, ph, false);
    stage.innerHTML = res.svg;
    stage.setAttribute('aria-label', (S.o.title ? S.o.title + ' · ' : '') + EDU.t('type_' + S.type));
    var w = EDU.$('#warn'); w.textContent = '';
    res.warns.forEach(function (m) { w.appendChild(EDU.el('p', { class: 'callout warning small', text: m })); });
  }
  function drawSoon() { clearTimeout(drawTimer); drawTimer = setTimeout(draw, 120); }

  /* ---------- type buttons ---------- */
  function renderTypes() {
    var box = EDU.$('#types'); box.textContent = '';
    TYPES.forEach(function (tp) {
      var b = EDU.el('button', { type: 'button', 'aria-pressed': S.type === tp ? 'true' : 'false', dataset: { type: tp }, onclick: function () { S.type = tp; save(); renderTypes(); draw(); } });
      b.innerHTML = '<svg viewBox="0 0 24 22" fill="currentColor" aria-hidden="true">' + ICONS[tp] + '</svg>';
      b.appendChild(EDU.el('span', { text: EDU.t('type_' + tp) }));
      box.appendChild(b);
    });
  }

  /* ---------- grid editor ---------- */
  function renderGrid() {
    var g = S.grid, width = g[0].length, table = EDU.$('#grid'); table.textContent = '';
    var hr = EDU.el('tr', {}, EDU.el('th', { class: 'rn', text: '#' }));
    for (var c = 0; c < width; c++) {
      (function (c) {
        var inp = EDU.el('input', { type: 'text', value: g[0][c] || '', 'aria-label': EDU.t(c ? 'col_name_n' : 'label_col', { n: c }), placeholder: c ? EDU.t('series_n', { n: c }) : EDU.t('label_col'), dataset: { r: 0, c: c } });
        var cell = EDU.el('div', { class: 'cm-colhead' }, inp);
        if (c > 0 && width > 2) cell.appendChild(EDU.el('button', { type: 'button', class: 'cm-del', 'aria-label': EDU.t('del_col'), title: EDU.t('del_col'), text: '×', onclick: function () { S.grid.forEach(function (row) { row.splice(c, 1); }); changed(true); } }));
        hr.appendChild(EDU.el('th', {}, cell));
      })(c);
    }
    hr.appendChild(EDU.el('th'));
    table.appendChild(EDU.el('thead', {}, hr));
    var tb = EDU.el('tbody'), shown = Math.min(g.length - 1, MAX_EDIT_ROWS);
    for (var r = 1; r <= shown; r++) {
      (function (r) {
        var tr = EDU.el('tr', {}, EDU.el('td', { class: 'rn', text: String(r) }));
        for (var c2 = 0; c2 < width; c2++) {
          tr.appendChild(EDU.el('td', { class: c2 ? 'num' : '' }, EDU.el('input', { type: 'text', value: g[r][c2] == null ? '' : g[r][c2], inputmode: c2 ? 'decimal' : null, 'aria-label': EDU.t('cell_label', { r: r, c: c2 + 1 }), dataset: { r: r, c: c2 } })));
        }
        tr.appendChild(EDU.el('td', {}, EDU.el('button', { type: 'button', class: 'cm-del', 'aria-label': EDU.t('del_row'), title: EDU.t('del_row'), text: '×', onclick: function () { if (S.grid.length > 2) S.grid.splice(r, 1); else S.grid[1] = S.grid[1].map(function () { return ''; }); changed(true); } })));
        tb.appendChild(tr);
      })(r);
    }
    table.appendChild(tb);
    if (g.length - 1 > MAX_EDIT_ROWS) table.appendChild(EDU.el('caption', { class: 'tiny muted', style: { captionSide: 'bottom', padding: '6px' }, text: EDU.t('rows_hidden', { n: EDU.fmt(g.length - 1 - MAX_EDIT_ROWS) }) }));
  }
  function changed(regrid) { S.sample = null; markSamples(); save(); if (regrid) renderGrid(); drawSoon(); }
  EDU.$('#grid').addEventListener('input', function (e) {
    var t = e.target; if (!t.dataset || t.dataset.r === undefined) return;
    S.grid[+t.dataset.r][+t.dataset.c] = t.value; changed(false);
  });
  EDU.$('#grid').addEventListener('keydown', function (e) {
    var t = e.target; if (e.key !== 'Enter' || t.dataset.r === undefined) return;
    e.preventDefault();
    var r = +t.dataset.r + 1, c = +t.dataset.c;
    if (r >= S.grid.length && r <= MAX_EDIT_ROWS) { S.grid.push(S.grid[0].map(function () { return ''; })); changed(true); }
    var nx = EDU.$('#grid input[data-r="' + r + '"][data-c="' + c + '"]'); if (nx) nx.focus();
  });

  /* ---------- CSV in ---------- */
  function fromText(text) {
    var ds = null; try { ds = D.load(text); } catch (e) { ds = null; }
    if (!ds || !ds.n) { EDU.toast(EDU.t('csv_empty')); return; }
    var nums = [], lab = -1;
    for (var c = 0; c < ds.width; c++) { if (ds.types[c] === 'number') nums.push(c); else if (lab < 0 && ds.types[c] !== 'empty') lab = c; }
    if (!nums.length) { EDU.toast(EDU.t('csv_nonum')); return; }
    if (lab < 0 && nums.length > 1) lab = nums.shift();
    nums = nums.slice(0, MAX_SERIES);
    var head = [lab >= 0 ? (ds.headers[lab] || '') : '#'].concat(nums.map(function (c) { return ds.headers[c] || ''; }));
    var g = [head];
    for (var r = 0; r < ds.n; r++) g.push([lab >= 0 ? ds.cols[lab][r] : String(r + 1)].concat(nums.map(function (c) { return ds.cols[c][r]; })));
    S.grid = g; S.sample = null;
    if (ds.n > 30 && S.type !== 'hist' && S.type !== 'scatter') EDU.toast(EDU.t('csv_many', { n: EDU.fmt(ds.n) }));
    save(); renderAll();
  }
  EDU.$('#paste-use').addEventListener('click', function () { fromText(EDU.$('#paste').value); });
  EDU.$('#open').addEventListener('click', function () {
    EDU.pickFile('.csv,.tsv,.txt,text/csv,text/plain').then(function (f) {
      if (!f) return;
      if (/\.(xlsx|xls|ods)$/i.test(f.name)) { EDU.toast(EDU.t('excel_file')); return; }
      EDU.readText(f).then(fromText);
    });
  });
  var dropCard = EDU.$('#data-card');
  function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; }
  document.addEventListener('dragover', function (e) { if (hasFiles(e)) { e.preventDefault(); dropCard.classList.add('over'); } });
  document.addEventListener('dragleave', function (e) { if (!e.relatedTarget) dropCard.classList.remove('over'); });
  document.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return; e.preventDefault(); dropCard.classList.remove('over');
    var f = e.dataTransfer.files[0]; if (f) EDU.readText(f).then(fromText);
  });

  /* ---------- options ---------- */
  var OPT_IDS = { title: 'o-title', x: 'o-x', y: 'o-y', sort: 'o-sort', fmt: 'o-fmt', pal: 'o-pal', bins: 'o-bins' };
  var CHECK_IDS = { legend: 'o-legend', labels: 'o-labels', zero: 'o-zero' };
  function fillOpts() {
    Object.keys(OPT_IDS).forEach(function (k) { EDU.$('#' + OPT_IDS[k]).value = S.o[k] == null ? '' : S.o[k]; });
    Object.keys(CHECK_IDS).forEach(function (k) { EDU.$('#' + CHECK_IDS[k]).checked = !!S.o[k]; });
    EDU.$$('#size button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.size === S.size ? 'true' : 'false'); });
  }
  Object.keys(OPT_IDS).forEach(function (k) {
    var el = EDU.$('#' + OPT_IDS[k]);
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () { S.o[k] = el.value; if (k === 'title' || k === 'x' || k === 'y') S.sample = null, markSamples(); save(); drawSoon(); });
  });
  Object.keys(CHECK_IDS).forEach(function (k) {
    var el = EDU.$('#' + CHECK_IDS[k]);
    el.addEventListener('change', function () { S.o[k] = el.checked; save(); draw(); });
  });
  EDU.$$('#size button').forEach(function (b) { b.addEventListener('click', function () { S.size = b.dataset.size; save(); fillOpts(); draw(); }); });

  /* ---------- export ---------- */
  function fileBase() {
    var t = String(S.o.title || '').replace(/[\\\/:*?"<>|\u0000-\u001f]+/g, ' ').trim().replace(/\s+/g, '-').slice(0, 50);
    return (t || 'chart') + '-' + SIZES[S.size].join('x');
  }
  EDU.$('#svg').addEventListener('click', function () {
    var sz = SIZES[S.size];
    EDU.download(fileBase() + '.svg', buildSvg(sz[0], sz[1], true).svg, 'image/svg+xml');
  });
  EDU.$('#png').addEventListener('click', function () {
    var sz = SIZES[S.size], svg = buildSvg(sz[0], sz[1], true).svg, img = new Image();
    img.onload = function () {
      var cv = document.createElement('canvas'); cv.width = sz[0]; cv.height = sz[1];
      var ctx = cv.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sz[0], sz[1]); ctx.drawImage(img, 0, 0, sz[0], sz[1]);
      try { cv.toBlob(function (b) { if (b) EDU.download(fileBase() + '.png', b); else EDU.toast(EDU.t('png_fail')); }, 'image/png'); }
      catch (e) { EDU.toast(EDU.t('png_fail')); }
    };
    img.onerror = function () { EDU.toast(EDU.t('png_fail')); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });

  /* ---------- which chart? ---------- */
  var GOAL_TYPE = { compare: 'bar', time: 'line', part: 'pie', relation: 'scatter', spread: 'hist' };
  function renderGoal() { EDU.$('#goal-tip').textContent = EDU.t('goal_tip_' + EDU.$('#goal').value); }
  EDU.$('#goal').addEventListener('change', renderGoal);
  EDU.$('#goal-use').addEventListener('click', function () { S.type = GOAL_TYPE[EDU.$('#goal').value]; save(); renderTypes(); draw(); EDU.$('#stage').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });

  /* ---------- buttons ---------- */
  EDU.$('#add-row').addEventListener('click', function () { S.grid.push(S.grid[0].map(function () { return ''; })); changed(true); var last = EDU.$$('#grid tbody tr'); last = last[last.length - 1]; if (last) last.querySelector('input').focus(); });
  EDU.$('#add-col').addEventListener('click', function () { if (S.grid[0].length > MAX_SERIES) { EDU.toast(EDU.t('max_series', { n: MAX_SERIES })); return; } S.grid.forEach(function (row, i) { row.push(i ? '' : EDU.t('series_n', { n: row.length })); }); changed(true); });
  EDU.$('#clear-grid').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_clear'))) return;
    S.grid = [[S.grid[0][0] || '', S.grid[0][1] || EDU.t('series_n', { n: 1 })], ['', ''], ['', ''], ['', '']]; changed(true);
  });
  EDU.$('#reset').addEventListener('click', function () { if (!confirm(EDU.t('confirm_reset'))) return; store.remove('state'); S = null; loadSample('sales'); });
  EDU.$$('[data-sample]').forEach(function (b) { b.addEventListener('click', function () { loadSample(b.dataset.sample); }); });
  function markSamples() { EDU.$$('[data-sample]').forEach(function (b) { b.setAttribute('aria-pressed', S.sample === b.dataset.sample ? 'true' : 'false'); }); }

  function renderAll() { renderTypes(); renderGrid(); fillOpts(); markSamples(); renderGoal(); draw(); }
  EDU.onLang(function () { if (S.sample) loadSample(S.sample, true); else renderAll(); });
  EDU.onTheme(draw);
  var lastW = 0;
  window.addEventListener('resize', function () { var w = EDU.$('#stage').clientWidth; if ((w < 700) !== (lastW < 700)) drawSoon(); lastW = w; });

  if (S) renderAll(); else loadSample('sales');
  window.__cm = { state: function () { return S; }, build: buildSvg };
})();
