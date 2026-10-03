/* Statistics Calculator: input tables, NCERT-style step-by-step working, summary and charts. */
(function () {
  'use strict';
  var SLUG = 'statistics-calculator';
  var S = window.StatCore, CH = window.StatChart;
  var store = EDU.store(SLUG);
  var t = EDU.t, esc = EDU.esc, $ = EDU.$, $$ = EDU.$$;
  var MAX_RAW = 20000, SHOW_ROWS = 150, MAX_ROWS = 60, MAX_CHIPS = 300, LRI = '⁦', PDI = '⁩';

  var SAMPLES = {
    marks: { mode: 'raw', raw: '32, 41, 27, 18, 45, 36, 29, 33, 40, 22,\n38, 31, 47, 25, 34, 30, 42, 19, 36, 28,\n44, 33, 26, 39, 35, 21, 37, 33, 48, 30' },
    runs: { mode: 'raw', raw: '45, 12, 78, 0, 33, 101, 56, 8, 67, 23, 45, 90' },
    temp: { mode: 'raw', raw: '39 41 42 40 43 44 42 41 45 44 42 40 43 46 42' },
    family: { mode: 'disc', disc: [[2, 4], [3, 9], [4, 15], [5, 11], [6, 6], [7, 3], [8, 2]] },
    heights: { mode: 'grp', grp: [[140, 145, 4], [145, 150, 7], [150, 155, 12], [155, 160, 14], [160, 165, 8], [165, 170, 5]] },
    wages: { mode: 'grp', grp: [[400, 450, 6], [450, 500, 10], [500, 550, 15], [550, 600, 14], [600, 650, 9], [650, 700, 6]] },
    incl: { mode: 'grp', grp: [[0, 9, 3], [10, 19, 6], [20, 29, 10], [30, 39, 15], [40, 49, 12], [50, 59, 8], [60, 69, 6]] }
  };
  var MODES = ['raw', 'disc', 'grp'], TABS = ['mean', 'median', 'mode', 'quart', 'spread'], CHARTS = ['hist', 'poly', 'ogive'];
  var DEF = { mode: 'grp', raw: '', disc: [], grp: [], sample: '', mMethod: 'direct', vMethod: 'dev', a: '', h: '', tab: 'mean', chart: 'hist', dec: 2, gw: '', gs: '' };
  var state, cur = null, COPY = {}, renderT = 0, saveT = 0;

  /* ------------------------------------------------------------ state */
  function blankRows(kind, k) {
    var a = [];
    for (var i = 0; i < (k || 4); i++) a.push(kind === 'disc' ? { x: '', f: '' } : { l: '', u: '', f: '' });
    return a;
  }
  function applySample(id) {
    var s = SAMPLES[id];
    if (!s) return;
    state.mode = s.mode; state.sample = id; state.a = ''; state.h = ''; state.gw = ''; state.gs = '';
    if (s.raw) state.raw = s.raw;
    if (s.disc) state.disc = s.disc.map(function (p) { return { x: String(p[0]), f: String(p[1]) }; });
    if (s.grp) state.grp = s.grp.map(function (p) { return { l: String(p[0]), u: String(p[1]), f: String(p[2]) }; });
  }
  function cleanRows(rows, keys) {
    if (!Array.isArray(rows)) return [];
    return rows.slice(0, MAX_ROWS).filter(function (r) { return r && typeof r === 'object'; }).map(function (r) {
      var o = {}; keys.forEach(function (k) { o[k] = r[k] == null ? '' : String(r[k]).slice(0, 40); }); return o;
    });
  }
  function loadState() {
    state = JSON.parse(JSON.stringify(DEF));
    var saved = store.get('state', null);
    if (saved && typeof saved === 'object') {
      Object.keys(DEF).forEach(function (k) {
        if (saved[k] !== undefined && typeof saved[k] === typeof DEF[k] && Array.isArray(saved[k]) === Array.isArray(DEF[k])) state[k] = saved[k];
      });
      state.disc = cleanRows(state.disc, ['x', 'f']);
      state.grp = cleanRows(state.grp, ['l', 'u', 'f']);
      state.raw = String(state.raw).slice(0, 400000);
    } else applySample('heights');
    if (MODES.indexOf(state.mode) < 0) state.mode = 'grp';
    if (TABS.indexOf(state.tab) < 0) state.tab = 'mean';
    if (CHARTS.indexOf(state.chart) < 0) state.chart = 'hist';
    if (['direct', 'assumed', 'step'].indexOf(state.mMethod) < 0) state.mMethod = 'direct';
    if (['dev', 'short'].indexOf(state.vMethod) < 0) state.vMethod = 'dev';
    if ([1, 2, 3, 4].indexOf(state.dec) < 0) state.dec = 2;
    if (!SAMPLES[state.sample]) state.sample = '';
    if (!state.disc.length) state.disc = blankRows('disc');
    if (!state.grp.length) state.grp = blankRows('grp');
  }
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(function () { store.set('state', state); }, 250);
  }

  loadState();
  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ------------------------------------------------------------ formatting */
  function roundTo(v, d) {
    var m = Math.pow(10, d), r = Math.round(v * m) / m;
    if (!isFinite(r)) r = v;
    if (Math.abs(r) < 0.5 / m) r = 0;
    return r;
  }
  function fmtN(v) { return (v === null || v === undefined || !isFinite(v)) ? '—' : EDU.fmt(roundTo(v, state.dec), { maximumFractionDigits: state.dec }); }
  function fmtD(v) { return (v === null || v === undefined || !isFinite(v)) ? '—' : EDU.fmt(roundTo(v, 6), { maximumFractionDigits: 6 }); }
  function plain(v, d) { return isFinite(v) ? String(roundTo(v, d)) : ''; }
  function iso(s) { return LRI + s + PDI; }
  function isoD(v) { return iso(fmtD(v)); }
  function isoN(v) { return iso(fmtN(v)); }
  function cl(c) { return fmtD(c.l) + '–' + fmtD(c.u); }

  var XB = '<i class="ov">x</i>';
  var SF = 'Σ<i>f</i><sub>i</sub>', SFX = 'Σ<i>f</i><sub>i</sub><i>x</i><sub>i</sub>', SFD = 'Σ<i>f</i><sub>i</sub><i>d</i><sub>i</sub>', SFU = 'Σ<i>f</i><sub>i</sub><i>u</i><sub>i</sub>';
  function N(v) { return esc(fmtN(v)); }
  function D(v) { return esc(fmtD(v)); }
  function P(v, f) { var s = (f || N)(v); return v < 0 ? '(' + s + ')' : s; }
  function frac(a, b) { return '<span class="frac"><span>' + a + '</span><span>' + b + '</span></span>'; }
  function ln(html) { return '<div class="fx-line">' + html + '</div>'; }
  function fx() { return '<div class="fx" dir="ltr">' + Array.prototype.join.call(arguments, '') + '</div>'; }
  function para(key, vars, cls) { return '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(t(key, vars)) + '</p>'; }
  function word(key) { return esc(t(key)); }
  function bw(key) { return '<bdi>' + word(key) + '</bdi>'; }
  function answer(pairs) {
    return '<div class="callout success st-ans">' + pairs.map(function (p) {
      return '<div><bdi>' + esc(p[0]) + '</bdi> = <b dir="ltr">' + esc(p[1]) + '</b></div>';
    }).join('') + '</div>';
  }
  function where(list) {
    return '<ul class="st-where">' + list.map(function (w) {
      return '<li><span class="fx-sym" dir="ltr">' + w[0] + ' = ' + w[2] + '</span> <span class="muted">' + esc(t(w[1])) + '</span></li>';
    }).join('') + '</ul>';
  }
  function sub(key) { return '<h3 class="st-sub">' + word(key) + '</h3>'; }

  /* ------------------------------------------------------------ working tables */
  var COL = {
    cls: { h: 'th_class', f: 'c' },
    x: { h: 'th_value', s: '<i>x</i><sub>i</sub>', p: 'x', f: 'd' },
    mark: { h: 'th_mark', s: '<i>x</i><sub>i</sub>', p: 'x', f: 'd' },
    f: { h: 'th_freq', s: '<i>f</i><sub>i</sub>', p: 'f', f: 'd' },
    fx: { s: '<i>f</i><sub>i</sub><i>x</i><sub>i</sub>', p: 'fx', f: 'd' },
    d: { h: 'th_dev', s: '<i>d</i><sub>i</sub> = <i>x</i><sub>i</sub> − <i>a</i>', p: 'd = x - a', f: 'd' },
    fd: { s: '<i>f</i><sub>i</sub><i>d</i><sub>i</sub>', p: 'fd', f: 'd' },
    u: { s: '<i>u</i><sub>i</sub> = <i>d</i><sub>i</sub> ÷ <i>h</i>', p: 'u = d / h', f: 'n' },
    fu: { s: '<i>f</i><sub>i</sub><i>u</i><sub>i</sub>', p: 'fu', f: 'n' },
    u2: { s: '<i>u</i><sub>i</sub>²', p: 'u^2', f: 'n' },
    fu2: { s: '<i>f</i><sub>i</sub><i>u</i><sub>i</sub>²', p: 'fu^2', f: 'n' },
    cf: { h: 'th_cf', s: '<i>cf</i>', p: 'cf', f: 'd' },
    dev: { s: '<i>x</i><sub>i</sub> − ' + XB, p: 'x - mean', f: 'n' },
    dev2: { s: '(<i>x</i><sub>i</sub> − ' + XB + ')²', p: '(x - mean)^2', f: 'n' },
    fdev2: { s: '<i>f</i><sub>i</sub>(<i>x</i><sub>i</sub> − ' + XB + ')²', p: 'f(x - mean)^2', f: 'n' },
    tally: { h: 'th_tally', f: 'h' },
    role: { h: '', s: '', f: 'h' }
  };
  function cell(v, f) {
    if (v === null || v === undefined || v === '') return '';
    if (f === 'h') return v;
    if (f === 'c') return esc(cl(v));
    if (typeof v === 'number') return esc(f === 'd' ? fmtD(v) : fmtN(v));
    return esc(v);
  }
  function copyCell(v, f) {
    if (v === null || v === undefined || v === '') return '';
    if (f === 'h') return String(v).replace(/<[^>]+>/g, '').trim();
    if (f === 'c') return plain(v.l, 6) + ' - ' + plain(v.u, 6);
    if (typeof v === 'number') return plain(v, f === 'd' ? 6 : state.dec);
    return String(v);
  }
  function table(id, cols, rows, foot, hl) {
    var n = rows.length, lim = Math.min(n, SHOW_ROWS), i;
    var h = '<div class="scroll-x st-twrap"><table class="table st-wt" data-table="' + id + '"><thead><tr>';
    cols.forEach(function (c) {
      h += '<th scope="col">' + (c.h ? '<span class="th-w">' + word(c.h) + '</span>' : '') + (c.s ? '<span class="sym" dir="ltr">' + c.s + '</span>' : '') + '</th>';
    });
    h += '</tr></thead><tbody>';
    for (i = 0; i < lim; i++) {
      var k = hl ? hl(i) : '';
      h += '<tr' + (k ? ' class="' + k + '"' : '') + '>';
      for (var j = 0; j < cols.length; j++) h += '<td dir="ltr">' + cell(rows[i][j], cols[j].f) + '</td>';
      h += '</tr>';
    }
    h += '</tbody>';
    if (foot) {
      h += '<tfoot><tr>' + foot.map(function (v, j) { return j === 0 ? '<td>' + esc(v) + '</td>' : '<td dir="ltr">' + cell(v, cols[j].f) + '</td>'; }).join('') + '</tr></tfoot>';
    }
    h += '</table></div>';
    if (n > lim) h += para('rows_more', { k: isoD(lim), n: isoD(n) }, 'muted small');
    var tsv = [cols.map(function (c) { return ((c.h ? t(c.h) : '') + (c.p ? (c.h ? ' ' : '') + c.p : '')).trim(); }).join('\t')];
    rows.forEach(function (r) { tsv.push(r.map(function (v, j) { return copyCell(v, cols[j].f); }).join('\t')); });
    if (foot) tsv.push(foot.map(function (v, j) { return j === 0 ? v : copyCell(v, cols[j].f); }).join('\t'));
    COPY[id] = tsv.join('\n');
    return h;
  }

  /* ------------------------------------------------------------ compute */
  function compute() {
    var r = { mode: state.mode, errors: [], notes: [], bad: [] }, i;
    if (state.mode === 'raw') {
      var p = S.parseRaw(state.raw, MAX_RAW);
      r.parsed = p;
      if (p.cut) r.notes.push({ key: 'err_toomany', vars: { n: MAX_RAW }, cls: 'warning' });
      if (p.badCount) r.notes.push({ key: 'raw_ignored', vars: { list: p.bad.join(', ') + (p.badCount > p.bad.length ? ', …' : '') }, cls: 'warning' });
      if (!p.vals.length) { r.errors.push({ key: 'err_empty' }); return r; }
      var it = S.itemsFromValues(p.vals);
      r.vals = p.vals; r.sorted = it.sorted; r.items = it.items;
      r.st = S.ungrouped(r.items);
      return r;
    }
    if (state.mode === 'disc') {
      var d = S.prepDiscrete(state.disc);
      r.bad = d.bad || [];
      if (d.errors.length) { r.errors = d.errors; return r; }
      r.items = d.items;
      if (d.merged) r.notes.push({ key: 'dup_note', cls: 'warning' });
      r.st = S.ungrouped(r.items);
      r.xs = r.items.map(function (q) { return q.x; });
      r.fs = r.items.map(function (q) { return q.f; });
    } else {
      var g = S.prepGrouped(state.grp);
      r.bad = g.bad || [];
      if (g.errors.length) { r.errors = g.errors; return r; }
      r.cls = g.cls; r.orig = g.orig; r.incl = g.incl;
      r.st = S.grouped(r.cls);
      if (!r.st.equalWidths) r.notes.push({ key: 'unequal_note', cls: 'warning' });
      r.xs = r.st.xs;
      r.fs = r.cls.map(function (c) { return c.f; });
    }
    var mid = Math.floor((r.xs.length - 1) / 2);
    r.autoA = r.xs[mid];
    r.autoH = state.mode === 'grp' ? S.mostCommon(r.st.widths) : S.gcdDec(r.xs.map(function (x) { return x - r.autoA; }));
    var a = S.parseCell(state.a), h = S.parseCell(state.h);
    r.badA = a !== null && isNaN(a);
    r.badH = h !== null && (isNaN(h) || h === 0);
    r.a = (a === null || isNaN(a)) ? r.autoA : a;
    r.h = (h === null || isNaN(h) || h === 0) ? r.autoH : h;
    r.d = r.xs.map(function (x) { return S.clean(x - r.a); });
    r.u = r.d.map(function (dd) { return dd / r.h; });
    r.sfd = 0; r.sfu = 0; r.sfu2 = 0;
    for (i = 0; i < r.xs.length; i++) { r.sfd += r.fs[i] * r.d[i]; r.sfu += r.fs[i] * r.u[i]; r.sfu2 += r.fs[i] * r.u[i] * r.u[i]; }
    return r;
  }

  function msgText(m) {
    var v = {};
    Object.keys(m.vars || {}).forEach(function (k) {
      var x = m.vars[k];
      v[k] = Array.isArray(x) ? iso(fmtD(x[0]) + '–' + fmtD(x[1])) : (typeof x === 'number' ? isoD(x) : x);
    });
    return t(m.key, v);
  }

  /* ------------------------------------------------------------ summary tiles */
  var TILES = [['n', 'st_n'], ['mean', 'st_mean', 1], ['median', 'st_median', 1], ['mode', 'st_mode', 1], ['range', 'st_range'],
    ['var', 'st_var'], ['sd', 'st_sd'], ['q1', 'st_q1'], ['q3', 'st_q3'], ['iqr', 'st_iqr'], ['cv', 'st_cv']];
  function tileData(r) {
    var st = r.st, g = r.mode === 'grp', out = {};
    out.n = { v: st.n, s: fmtD(st.n) };
    out.mean = { v: st.mean, s: fmtN(st.mean) };
    out.median = { v: st.median.v, s: fmtN(st.median.v) };
    if (g) out.mode = { v: st.mode.v, s: isFinite(st.mode.v) ? fmtN(st.mode.v) : t('no_mode') };
    else if (st.noMode || !st.modes.length) out.mode = { v: '', s: t('no_mode') };
    else out.mode = { v: st.modes.join(','), s: st.modes.slice(0, 4).map(fmtD).join(', ') + (st.modes.length > 4 ? ', …' : '') };
    out.range = { v: st.range, s: fmtN(st.range) };
    out['var'] = { v: st.variance, s: fmtN(st.variance) };
    out.sd = { v: st.sd, s: fmtN(st.sd) };
    out.q1 = { v: st.q1.v, s: fmtN(st.q1.v) };
    out.q3 = { v: st.q3.v, s: fmtN(st.q3.v) };
    out.iqr = { v: st.q3.v - st.q1.v, s: fmtN(st.q3.v - st.q1.v) };
    var cv = st.mean !== 0 ? st.sd / Math.abs(st.mean) * 100 : NaN;
    out.cv = { v: cv, s: isFinite(cv) ? fmtN(cv) + '%' : '—' };
    return out;
  }
  function renderTiles(r) {
    var box = $('#tiles'), data = r.st ? tileData(r) : null;
    box.innerHTML = TILES.map(function (tl) {
      var d = data ? data[tl[0]] : { v: '', s: '—' };
      return '<div class="st-tile' + (tl[2] ? ' key' : '') + '" id="res-' + tl[0] + '" data-value="' + esc(String(d.v)) + '">' +
        '<span class="lbl">' + word(tl[1]) + '</span><span class="val" dir="ltr">' + esc(d.s) + '</span></div>';
    }).join('');
    $('#res-sub').textContent = state.sample ? t('ex_' + state.sample) : '';
    $('#print-sub').textContent = state.sample ? t('ex_' + state.sample) : '';
    $('#copy-res').disabled = !r.st;
  }

  /* ------------------------------------------------------------ working: mean */
  function meanHTML(r) {
    var st = r.st, h = '', n = st.n;
    if (r.mode === 'raw') {
      h += para('mean_raw_1', { n: isoD(n) });
      var lines = [ln(XB + ' = ' + frac('Σ<i>x</i><sub>i</sub>', '<i>n</i>'))];
      if (r.vals.length <= 20) lines.push(ln('= ' + frac(r.vals.map(function (v) { return P(v, fmtD); }).join(' + '), D(n))));
      lines.push(ln('= ' + frac(D(st.sum), D(n))));
      lines.push(ln('= <b>' + N(st.mean) + '</b>'));
      h += fx.apply(null, lines);
      COPY.mean = r.vals.join('\n');
      return h + answer([[t('st_mean'), fmtN(st.mean)]]);
    }
    var grp = r.mode === 'grp', m = state.mMethod;
    if (grp) h += para('mean_grp_x');
    var cols = grp ? [COL.cls, COL.f, COL.mark] : [COL.x, COL.f];
    var rows = r.xs.map(function (x, i) { return grp ? [r.cls[i], r.fs[i], x] : [x, r.fs[i]]; });
    var foot = grp ? [t('total'), n, ''] : [t('total'), n];
    var hlA = function (i) { return Math.abs(r.d[i]) < 1e-9 ? 'hl' : ''; };
    var mean;
    if (m === 'direct') {
      h += para(grp ? 'mean_direct_1' : 'mean_disc_1');
      cols.push(COL.fx);
      rows.forEach(function (row, i) { row.push(S.clean(r.fs[i] * r.xs[i])); });
      foot.push(S.clean(st.sum));
      h += table('mean', cols, rows, foot);
      mean = st.sum / n;
      h += fx(ln(XB + ' = ' + frac(SFX, SF)), ln('= ' + frac(D(st.sum), D(n))), ln('= <b>' + N(mean) + '</b>'));
    } else if (m === 'assumed') {
      h += para('mean_assumed_1', { a: isoD(r.a) });
      cols.push(COL.d, COL.fd);
      rows.forEach(function (row, i) { row.push(r.d[i], S.clean(r.fs[i] * r.d[i])); });
      foot.push('', S.clean(r.sfd));
      h += table('mean', cols, rows, foot, hlA);
      mean = r.a + r.sfd / n;
      h += fx(ln(XB + ' = <i>a</i> + ' + frac(SFD, SF)),
        ln('= ' + D(r.a) + ' + ' + frac(D(r.sfd), D(n))),
        ln('= ' + D(r.a) + ' + ' + P(r.sfd / n)),
        ln('= <b>' + N(mean) + '</b>'));
    } else {
      h += para('mean_step_1', { a: isoD(r.a), h: isoD(r.h) });
      cols.push(COL.d, COL.u, COL.fu);
      rows.forEach(function (row, i) { row.push(r.d[i], r.u[i], r.fs[i] * r.u[i]); });
      foot.push('', '', r.sfu);
      h += table('mean', cols, rows, foot, hlA);
      mean = r.a + r.h * r.sfu / n;
      h += fx(ln(XB + ' = <i>a</i> + ' + frac(SFU, SF) + ' × <i>h</i>'),
        ln('= ' + D(r.a) + ' + ' + frac(N(r.sfu), D(n)) + ' × ' + D(r.h)),
        ln('= ' + D(r.a) + ' + ' + P(r.h * r.sfu / n)),
        ln('= <b>' + N(mean) + '</b>'));
    }
    if (m !== 'direct') h += para('same_mean', null, 'muted small');
    return h + answer([[t('st_mean'), fmtN(mean)]]);
  }

  /* ------------------------------------------------------------ working: median */
  function chips(sorted, md) {
    var n = sorted.length, mids = md.odd ? [md.p - 1] : [md.p - 1, md.q - 1], idx = [];
    if (n <= MAX_CHIPS) { for (var i = 0; i < n; i++) idx.push(i); }
    else {
      var c = Math.floor((n - 1) / 2), add = function (a, b) { for (var j = Math.max(0, a); j <= Math.min(n - 1, b); j++) if (idx.indexOf(j) < 0) idx.push(j); };
      add(0, 24); idx.push(-1); add(c - 12, c + 13); idx.push(-1); add(n - 25, n - 1);
    }
    return '<div class="st-sorted" dir="ltr">' + idx.map(function (i) {
      if (i < 0) return '<span class="gap">…</span>';
      return '<span class="' + (mids.indexOf(i) >= 0 ? 'mid' : '') + '"><small>' + D(i + 1) + '</small>' + D(sorted[i]) + '</span>';
    }).join('') + '</div>';
  }
  function medianHTML(r) {
    var st = r.st, n = st.n, md = st.median, h = '', MED = bw('tab_median');
    if (r.mode !== 'grp') {
      if (r.mode === 'raw') { h += para('med_sorted'); h += chips(r.sorted, md); }
      h += md.odd ? para('med_odd', { n: isoD(n), p: isoD(md.p) }) : para('med_even', { n: isoD(n), p: isoD(md.p), q: isoD(md.q) });
      if (r.mode === 'disc') {
        h += para('med_cf');
        h += table('median', [COL.x, COL.f, COL.cf], r.items.map(function (it, i) { return [it.x, it.f, st.cf[i]]; }), [t('total'), n, ''],
          function (i) { return md.idx.indexOf(i) >= 0 ? 'hl' : ''; });
      } else COPY.median = r.sorted.join('\n');
      if (md.odd) h += fx(ln(MED + ' = <b>' + D(md.v) + '</b>'));
      else h += fx(ln(MED + ' = ' + frac(D(md.va) + ' + ' + D(md.vb), '2') + ' = <b>' + N(md.v) + '</b>'));
    } else {
      var c = r.cls[md.j];
      h += table('median', [COL.cls, COL.f, COL.cf], r.cls.map(function (k, i) { return [k, k.f, st.cf[i]]; }), [t('total'), n, ''],
        function (i) { return i === md.j ? 'hl' : ''; });
      h += para('med_grp_1', { n: isoD(n), h: isoD(n / 2) });
      h += para('med_grp_2', { h: isoD(n / 2), c: iso(cl(c)) });
      h += fx(ln(MED + ' = <i>l</i> + ' + frac('<i>n</i>/2 − <i>cf</i>', '<i>f</i>') + ' × <i>h</i>'));
      h += where([['<i>l</i>', 'sym_l_med', D(md.l)], ['<i>cf</i>', 'sym_cf_med', D(md.cfb)], ['<i>f</i>', 'sym_f_med', D(md.f)], ['<i>h</i>', 'sym_h', D(md.h)]]);
      h += fx(ln(MED + ' = ' + D(md.l) + ' + ' + frac(D(n / 2) + ' − ' + D(md.cfb), D(md.f)) + ' × ' + D(md.h)),
        ln('= ' + D(md.l) + ' + ' + P(md.v - md.l)),
        ln('= <b>' + N(md.v) + '</b>'));
    }
    h += answer([[t('st_median'), fmtN(md.v)]]);
    h += '<p class="no-print"><button type="button" class="btn btn-sm" id="show-ogive">' + word('show_ogive') + '</button></p>';
    return h;
  }

  /* ------------------------------------------------------------ working: mode */
  function tally(f) {
    if (f > 40) return '';
    var s = '';
    for (var i = 0; i < Math.floor(f / 5); i++) s += '<span class="t5">||||</span> ';
    for (i = 0; i < f % 5; i++) s += '|';
    return '<span class="tally" aria-hidden="true">' + s + '</span>';
  }
  function modeHTML(r) {
    var st = r.st, h = '', MO = bw('tab_mode');
    if (r.mode !== 'grp') {
      h += para('mode_raw_1');
      var isMode = function (i) { return st.modes.indexOf(r.items[i].x) >= 0 ? 'hl' : ''; };
      var withTally = r.mode === 'raw' && st.maxf <= 40;
      var cols = withTally ? [COL.x, COL.tally, COL.f] : [COL.x, COL.f];
      var rows = r.items.map(function (it) { return withTally ? [it.x, tally(it.f), it.f] : [it.x, it.f]; });
      h += table('mode', cols, rows, withTally ? [t('total'), '', st.n] : [t('total'), st.n], isMode);
      if (st.noMode) h += para('mode_none', null, 'callout warning');
      else {
        if (st.modes.length > 1) h += para('mode_many', { f: isoD(st.maxf) });
        h += answer([[t('st_mode'), st.modes.map(fmtD).join(', ')]]);
      }
      return h;
    }
    var mo = st.mode, c = r.cls[mo.j];
    var role = function (i) {
      if (mo.allEqual) return '';
      if (i === mo.j) return '<b><i>f</i><sub>1</sub></b>';
      if (i === mo.j - 1) return '<i>f</i><sub>0</sub>';
      if (i === mo.j + 1) return '<i>f</i><sub>2</sub>';
      return '';
    };
    h += table('mode', [COL.cls, COL.f, COL.role], r.cls.map(function (k, i) { return [k, k.f, role(i)]; }), null,
      function (i) { return mo.allEqual ? '' : (i === mo.j ? 'hl' : (Math.abs(i - mo.j) === 1 ? 'hl2' : '')); });
    if (mo.allEqual) return h + para('mode_none_grp', null, 'callout warning');
    h += para('mode_grp_1', { c: iso(cl(c)) });
    if (mo.ties > 1) h += para('mode_tie', null, 'callout warning');
    h += fx(ln(MO + ' = <i>l</i> + ' + frac('<i>f</i><sub>1</sub> − <i>f</i><sub>0</sub>', '2<i>f</i><sub>1</sub> − <i>f</i><sub>0</sub> − <i>f</i><sub>2</sub>') + ' × <i>h</i>'));
    h += where([['<i>l</i>', 'sym_l_mode', D(mo.l)], ['<i>f</i><sub>1</sub>', 'sym_f1', D(mo.f1)], ['<i>f</i><sub>0</sub>', 'sym_f0', D(mo.f0)],
      ['<i>f</i><sub>2</sub>', 'sym_f2', D(mo.f2)], ['<i>h</i>', 'sym_h', D(mo.h)]]);
    if (!isFinite(mo.v)) return h + para('mode_den0', null, 'callout warning');
    h += fx(ln(MO + ' = ' + D(mo.l) + ' + ' + frac(D(mo.f1) + ' − ' + D(mo.f0), '2 × ' + D(mo.f1) + ' − ' + D(mo.f0) + ' − ' + D(mo.f2)) + ' × ' + D(mo.h)),
      ln('= ' + D(mo.l) + ' + ' + frac(D(mo.f1 - mo.f0), D(mo.den)) + ' × ' + D(mo.h)),
      ln('= ' + D(mo.l) + ' + ' + P(mo.v - mo.l)),
      ln('= <b>' + N(mo.v) + '</b>'));
    h += answer([[t('st_mode'), fmtN(mo.v)]]);
    h += para('empirical', { v: isoN(3 * st.median.v - 2 * st.mean) }, 'muted small');
    return h;
  }

  /* ------------------------------------------------------------ working: quartiles */
  function qList(sym, q) {
    var pShow = q.clamp ? q.a : q.p, h = '';
    if (q.frac) h += para('q_between', { p: isoD(q.p), a: isoD(q.a), b: isoD(q.b), va: isoD(q.va), vb: isoD(q.vb) });
    else h += para('q_exact', { p: isoD(pShow), v: isoD(q.v) });
    if (q.frac) h += fx(ln(sym + ' = ' + D(q.va) + ' + ' + D(q.frac) + ' × (' + D(q.vb) + ' − ' + D(q.va) + ')'), ln('= <b>' + N(q.v) + '</b>'));
    else h += fx(ln(sym + ' = <b>' + N(q.v) + '</b>'));
    return h;
  }
  function qGrp(sym, q, posExpr) {
    return fx(ln(sym + ' = <i>l</i> + ' + frac(posExpr + ' − <i>cf</i>', '<i>f</i>') + ' × <i>h</i>'),
      ln('= ' + D(q.l) + ' + ' + frac(D(q.pos) + ' − ' + D(q.cfb), D(q.f)) + ' × ' + D(q.h)),
      ln('= ' + D(q.l) + ' + ' + P(q.v - q.l)),
      ln('= <b>' + N(q.v) + '</b>'));
  }
  function quartHTML(r) {
    var st = r.st, n = st.n, h = '', Q1 = '<i>Q</i><sub>1</sub>', Q3 = '<i>Q</i><sub>3</sub>';
    if (r.mode !== 'grp') {
      h += para('q_pos', { p: isoD((n + 1) / 4), q: isoD(3 * (n + 1) / 4) });
      if (r.mode === 'disc') {
        var i1 = r.items.findIndex(function (it) { return it.x === st.q1.v; }), i3 = r.items.findIndex(function (it) { return it.x === st.q3.v; });
        h += table('quart', [COL.x, COL.f, COL.cf], r.items.map(function (it, i) { return [it.x, it.f, st.cf[i]]; }), [t('total'), n, ''],
          function (i) { return i === i1 ? 'hl' : (i === i3 ? 'hl2' : ''); });
      } else { h += chips(r.sorted, st.median); COPY.quart = r.sorted.join('\n'); }
      h += sub('st_q1') + qList(Q1, st.q1);
      h += sub('st_q3') + qList(Q3, st.q3);
      h += '<p class="muted small">' + word('q_note') + '</p>';
    } else {
      h += table('quart', [COL.cls, COL.f, COL.cf], r.cls.map(function (k, i) { return [k, k.f, st.cf[i]]; }), [t('total'), n, ''],
        function (i) { return i === st.q1.j ? 'hl' : (i === st.q3.j ? 'hl2' : ''); });
      h += para('q_grp_1', { a: isoD(n / 4), b: isoD(3 * n / 4) });
      h += sub('st_q1') + para('q_grp_2', { a: isoD(n / 4), c: iso(cl(r.cls[st.q1.j])) });
      h += where([['<i>l</i>', 'sym_l_q', D(st.q1.l)], ['<i>cf</i>', 'sym_cf_q', D(st.q1.cfb)], ['<i>f</i>', 'sym_f_q', D(st.q1.f)], ['<i>h</i>', 'sym_h', D(st.q1.h)]]);
      h += qGrp(Q1, st.q1, '<i>n</i>/4');
      h += sub('st_q3') + para('q_grp_3', { b: isoD(3 * n / 4), c: iso(cl(r.cls[st.q3.j])) });
      h += where([['<i>l</i>', 'sym_l_q', D(st.q3.l)], ['<i>cf</i>', 'sym_cf_q', D(st.q3.cfb)], ['<i>f</i>', 'sym_f_q', D(st.q3.f)], ['<i>h</i>', 'sym_h', D(st.q3.h)]]);
      h += qGrp(Q3, st.q3, '3<i>n</i>/4');
    }
    var iqr = st.q3.v - st.q1.v;
    h += sub('st_iqr') + fx(ln(Q3 + ' − ' + Q1 + ' = ' + N(st.q3.v) + ' − ' + P(st.q1.v) + ' = <b>' + N(iqr) + '</b>'));
    h += '<p>' + word('qd') + '</p>' + fx(ln(frac(Q3 + ' − ' + Q1, '2') + ' = ' + frac(N(iqr), '2') + ' = <b>' + N(iqr / 2) + '</b>'));
    return h + answer([[t('st_q1'), fmtN(st.q1.v)], [t('st_q3'), fmtN(st.q3.v)]]);
  }

  /* ------------------------------------------------------------ working: range, variance, SD */
  function spreadHTML(r) {
    var st = r.st, n = st.n, h = '', grp = r.mode === 'grp', mean = st.mean;
    var SIG2 = '<i>σ</i>²', SIG = '<i>σ</i>';
    h += sub('st_range');
    if (grp) h += para('range_grp');
    else h += para('range_1');
    h += fx(ln(bw('tab_range') + ' = ' + D(st.max) + ' − ' + P(st.min, fmtD) + ' = <b>' + N(st.range) + '</b>'));
    h += sub('st_var');
    var short = r.mode !== 'raw' && state.vMethod === 'short', variance;
    if (!short) {
      h += para(r.mode === 'raw' ? 'var_1' : 'var_1f', { m: isoN(mean) });
      if (r.mode === 'raw') {
        h += table('spread', [COL.x, COL.dev, COL.dev2], r.vals.map(function (x) { return [x, x - mean, (x - mean) * (x - mean)]; }), [t('total'), '', st.ss]);
        variance = st.ss / n;
        h += fx(ln(SIG2 + ' = ' + frac('Σ(<i>x</i><sub>i</sub> − ' + XB + ')²', '<i>n</i>') + ' = ' + frac(N(st.ss), D(n)) + ' = <b>' + N(variance) + '</b>'));
      } else {
        var xs = r.xs;
        var cols = grp ? [COL.cls, COL.f, COL.mark, COL.dev, COL.dev2, COL.fdev2] : [COL.x, COL.f, COL.dev, COL.dev2, COL.fdev2];
        var rows = xs.map(function (x, i) {
          var dv = x - mean, tail = [dv, dv * dv, r.fs[i] * dv * dv];
          return grp ? [r.cls[i], r.fs[i], x].concat(tail) : [x, r.fs[i]].concat(tail);
        });
        h += table('spread', cols, rows, grp ? [t('total'), n, '', '', '', st.ss] : [t('total'), n, '', '', st.ss]);
        variance = st.ss / n;
        h += fx(ln(SIG2 + ' = ' + frac('Σ<i>f</i><sub>i</sub>(<i>x</i><sub>i</sub> − ' + XB + ')²', SF) + ' = ' + frac(N(st.ss), D(n)) + ' = <b>' + N(variance) + '</b>'));
      }
    } else {
      h += para('var_short_1', { a: isoD(r.a), h: isoD(r.h) });
      var c2 = grp ? [COL.cls, COL.f, COL.mark, COL.u, COL.u2, COL.fu, COL.fu2] : [COL.x, COL.f, COL.u, COL.u2, COL.fu, COL.fu2];
      var rows2 = r.xs.map(function (x, i) {
        var u = r.u[i], tail = [u, u * u, r.fs[i] * u, r.fs[i] * u * u];
        return grp ? [r.cls[i], r.fs[i], x].concat(tail) : [x, r.fs[i]].concat(tail);
      });
      h += table('spread', c2, rows2, grp ? [t('total'), n, '', '', '', r.sfu, r.sfu2] : [t('total'), n, '', '', r.sfu, r.sfu2]);
      var A = n * r.sfu2, B = r.sfu * r.sfu;
      variance = r.h * r.h / (n * n) * (A - B);
      h += fx(ln(SIG2 + ' = ' + frac('<i>h</i>²', '<i>N</i>²') + ' [ <i>N</i>Σ<i>f</i><sub>i</sub><i>u</i><sub>i</sub>² − (Σ<i>f</i><sub>i</sub><i>u</i><sub>i</sub>)² ]'),
        ln('= ' + frac(D(r.h) + '²', D(n) + '²') + ' [ ' + D(n) + ' × ' + P(r.sfu2) + ' − ' + '(' + N(r.sfu) + ')² ]'),
        ln('= ' + frac(D(r.h * r.h), D(n * n)) + ' × [ ' + N(A) + ' − ' + N(B) + ' ]'),
        ln('= <b>' + N(variance) + '</b>'));
    }
    var sd = Math.sqrt(Math.max(0, variance));
    h += sub('st_sd') + para('sd_1');
    h += fx(ln(SIG + ' = √' + SIG2 + ' = √' + N(variance) + ' = <b>' + N(sd) + '</b>'));
    if (n > 1) h += para('sample_note', { v: isoN(st.sVariance), w: isoN(Math.sqrt(st.sVariance)) }, 'muted small');
    h += sub('st_cv');
    if (st.mean !== 0) { var am = Math.abs(st.mean), bar = st.mean < 0 ? '|' + XB + '|' : XB; h += fx(ln('<i>CV</i> = ' + frac(SIG, bar) + ' × 100 = ' + frac(N(sd), N(am)) + ' × 100 = <b>' + N(sd / am * 100) + '%</b>')); }
    else h += para('cv_na', null, 'muted');
    return h + answer([[t('st_var'), fmtN(variance)], [t('st_sd'), fmtN(sd)]]);
  }

  /* ------------------------------------------------------------ chart */
  function chartData(r) {
    if (!r.st) return null;
    if (r.mode === 'grp') return { type: 'classes', classes: r.cls, n: r.st.n, auto: 0 };
    var nz = r.items.filter(function (it) { return it.f > 0; });
    if (nz.length <= 15) return { type: 'discrete', items: nz, n: r.st.n };
    var w = S.niceWidth(r.st.min, r.st.max, r.st.n), start = S.clean(Math.floor(r.st.min / w) * w);
    var cls = S.groupValues(r.items, start, w, 60);
    if (!cls) return { type: 'discrete', items: nz, n: r.st.n };
    return { type: 'classes', classes: cls, n: r.st.n, auto: w };
  }
  function colors(print) {
    if (print) return { surface: '#ffffff', text: '#111111', muted: '#333333', grid: '#d6d6d6', c1: '#0b7285', c2: '#e8590c', c5: '#c2255c' };
    return { surface: EDU.css('--surface') || '#fff', text: EDU.css('--text'), muted: EDU.css('--muted'), grid: EDU.css('--border'), c1: EDU.css('--c1'), c2: EDU.css('--c2'), c5: EDU.css('--c5') };
  }
  function drawChart(print) {
    var cv = $('#chart'), card = $('#chart-card'), r = cur;
    var data = r ? chartData(r) : null;
    $('#ch-hist').textContent = t(data && data.type === 'discrete' ? 'ch_bar' : 'ch_hist');
    CHARTS.forEach(function (k) { $('#ch-' + k).setAttribute('aria-pressed', String(state.chart === k)); });
    var note = $('#chart-note');
    if (!data) {
      var ctx = cv.getContext('2d'); cv.width = cv.clientWidth || 300; cv.height = 200; cv.style.height = '200px';
      ctx.clearRect(0, 0, cv.width, cv.height);
      cv.dataset.kind = ''; cv.dataset.meetX = '';
      note.textContent = '';
      return;
    }
    var fsOn = document.fullscreenElement === card, H = 0, big = 0;
    if (fsOn) {
      var top = $('#chart-stage').getBoundingClientRect().top;
      H = Math.max(260, window.innerHeight - top - 90); big = 20;
    }
    var info = CH.draw(cv, {
      kind: state.chart, data: data, colors: colors(print), height: H || 0, fontSize: big || 0,
      font: getComputedStyle(document.body).fontFamily, rtl: document.documentElement.dir === 'rtl',
      fmt: function (v) { return fmtD(roundTo(v, 4)); }, fmtV: fmtN,
      labels: { xCls: t('ax_class'), xVal: t('ax_value'), y: t('ax_freq'), yAdj: t('ax_adj'), yCf: t('ax_cf'), less: t('lg_less'), more: t('lg_more'), median: t('tab_median') }
    });
    cv.dataset.kind = state.chart; cv.dataset.type = data.type;
    cv.dataset.meetX = info.meetX === null ? '' : String(info.meetX);
    cv.setAttribute('aria-label', t('chart_label') + ': ' + $('#ch-' + state.chart).textContent);
    var parts = [];
    if (data.auto) parts.push(t('auto_grp_note', { h: isoD(data.auto) }));
    if (state.chart === 'hist') parts.push(t(data.type === 'classes' ? (info.adjusted ? 'hist_adj_note' : 'hist_note') : 'bar_note'));
    else if (state.chart === 'poly') parts.push(t(data.type === 'classes' ? 'poly_note' : 'poly_note_d'));
    else if (info.meetX !== null) {
      if (r.mode === 'grp') parts.push(t('ogive_meet', { x: isoN(info.meetX), y: isoD(info.meetY) }));
      else parts.push(t('ogive_meet_d', { x: isoN(info.meetX), m: isoN(r.st.median.v) }));
    }
    note.textContent = parts.join(' ');
  }

  /* ------------------------------------------------------------ messages + render */
  function renderMsgs(r) {
    var box = $('#msgs'), h = '';
    r.errors.forEach(function (m) { h += '<p class="callout danger st-msg" role="alert">' + esc(msgText(m)) + '</p>'; });
    if (!r.errors.length && r.mode === 'grp' && r.incl) {
      var o = r.orig[0], c = r.cls[0];
      h += '<p class="callout accent st-msg" id="incl-note">' + esc(t('incl_note', { a: iso(fmtD(o.l) + '–' + fmtD(o.u)), b: iso(cl(c)), g: isoD(r.incl / 2) })) + '</p>';
    }
    r.notes.forEach(function (m) { h += '<p class="callout ' + (m.cls || '') + ' st-msg">' + esc(msgText(m)) + '</p>'; });
    box.innerHTML = h;
    var kind = state.mode;
    if (kind !== 'raw') {
      $$('#' + kind + '-body input').forEach(function (inp) { inp.removeAttribute('aria-invalid'); });
      (r.bad || []).forEach(function (b) {
        var inp = $('#' + kind + '-body input[data-i="' + b[0] + '"][data-k="' + b[1] + '"]');
        if (inp) inp.setAttribute('aria-invalid', 'true');
      });
    }
  }
  function renderRawInfo(r) {
    var info = $('#raw-info');
    if (state.mode !== 'raw') return;
    info.textContent = r.st ? t('raw_info', { n: isoD(r.st.n), a: isoD(r.st.min), b: isoD(r.st.max) }) : '';
    var w = r.st ? S.niceWidth(r.st.min, r.st.max, r.st.n) : 10;
    var s = r.st ? S.clean(Math.floor(r.st.min / w) * w) : 0;
    $('#gw').placeholder = t('auto_ph', { v: fmtD(w) });
    $('#gs').placeholder = t('auto_ph', { v: fmtD(s) });
    $('#make-freq').disabled = $('#make-grp').disabled = !r.st;
  }
  function renderMethodControls(r) {
    ['direct', 'assumed', 'step'].forEach(function (m) { $('#mm-' + m).setAttribute('aria-pressed', String(state.mMethod === m)); });
    ['dev', 'short'].forEach(function (m) { $('#vm-' + m).setAttribute('aria-pressed', String(state.vMethod === m)); });
    var showM = state.mode !== 'raw';
    $('#mean-ctl').hidden = !showM;
    $('#spread-ctl').hidden = !showM;
    $('#ah-mean').hidden = !showM || state.mMethod === 'direct';
    $('#ah-spread').hidden = !showM || state.vMethod !== 'short';
    var hKey = state.mode === 'grp' ? 'h_class' : 'h_common';
    $$('.lbl-h').forEach(function (e) { e.textContent = t(hKey); });
    $$('.in-a').forEach(function (e) {
      if (document.activeElement !== e) e.value = state.a;
      e.placeholder = r && r.st && r.autoA !== undefined ? t('auto_ph', { v: fmtD(r.autoA) }) : '';
      e.setAttribute('aria-invalid', String(!!(r && r.badA)));
    });
    $$('.in-h').forEach(function (e) {
      if (document.activeElement !== e) e.value = state.h;
      e.placeholder = r && r.st && r.autoH !== undefined ? t('auto_ph', { v: fmtD(r.autoH) }) : '';
      e.setAttribute('aria-invalid', String(!!(r && r.badH)));
    });
  }
  function renderWork(r) {
    TABS.forEach(function (k) {
      var on = state.tab === k;
      $('#tab-' + k).setAttribute('aria-selected', String(on));
      $('#tab-' + k).tabIndex = on ? 0 : -1;
      $('#panel-' + k).hidden = !on;
    });
    COPY = {};
    var outs = { mean: meanHTML, median: medianHTML, mode: modeHTML, quart: quartHTML, spread: spreadHTML };
    TABS.forEach(function (k) {
      var box = $('#out-' + k);
      if (!r.st) { box.innerHTML = '<p class="muted">' + word('need_data') + '</p>'; return; }
      try { box.innerHTML = outs[k](r); }
      catch (e) { console.warn(e); box.innerHTML = '<p class="callout danger">' + word('err_calc') + '</p>'; }
    });
    $$('.copy-tbl').forEach(function (b) { b.disabled = !COPY[b.dataset.panel]; });
  }

  function render() {
    clearTimeout(renderT);
    var r = compute();
    cur = r;
    renderMsgs(r);
    renderRawInfo(r);
    renderTiles(r);
    renderMethodControls(r);
    renderWork(r);
    drawChart();
    save();
  }
  function schedule() { clearTimeout(renderT); renderT = setTimeout(render, 160); }

  /* ------------------------------------------------------------ input UI */
  var KEYS = { disc: ['x', 'f'], grp: ['l', 'u', 'f'] };
  var LBL = { disc: ['col_x', 'col_f'], grp: ['col_lower', 'col_upper', 'col_f'] };
  function renderRows(kind) {
    var body = $('#' + kind + '-body');
    body.innerHTML = '';
    state[kind].forEach(function (row, i) {
      var tr = EDU.el('tr', {});
      KEYS[kind].forEach(function (k, j) {
        var inp = EDU.el('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', class: 'in-' + k, dataset: { i: String(i), k: k }, 'aria-label': t(LBL[kind][j]) + ' · ' + (i + 1) });
        inp.value = row[k] == null ? '' : row[k];
        tr.appendChild(EDU.el('td', {}, inp));
      });
      var lab = t('del_row', { r: i + 1 });
      tr.appendChild(EDU.el('td', { class: 'st-delc' }, EDU.el('button', { type: 'button', class: 'btn btn-ghost st-del', dataset: { i: String(i) }, 'aria-label': lab, title: lab, text: '✕' })));
      body.appendChild(tr);
    });
    $('#' + kind + '-add').disabled = state[kind].length >= MAX_ROWS;
  }
  function renderInputs() {
    MODES.forEach(function (m) {
      $('#mode-' + m).setAttribute('aria-pressed', String(state.mode === m));
      $('#pane-' + m).hidden = state.mode !== m;
    });
    var ta = $('#raw-input');
    if (ta.value !== state.raw) ta.value = state.raw;
    $('#gw').value = state.gw; $('#gs').value = state.gs;
    renderRows('disc'); renderRows('grp');
    $('#sample').value = state.sample || '';
    [1, 2, 3, 4].forEach(function (d) { $('#dec-' + d).setAttribute('aria-pressed', String(state.dec === d)); });
  }
  function edited() {
    if (state.sample) { state.sample = ''; $('#sample').value = ''; }
  }

  MODES.forEach(function (m) {
    $('#mode-' + m).addEventListener('click', function () {
      state.mode = m; state.a = ''; state.h = '';
      renderInputs(); render();
    });
  });
  $('#sample').addEventListener('change', function () {
    var id = this.value;
    if (!SAMPLES[id]) return;
    applySample(id);
    renderInputs(); render();
  });
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state');
    state = JSON.parse(JSON.stringify(DEF));
    state.disc = blankRows('disc'); state.grp = blankRows('grp');
    applySample('heights');
    renderInputs(); render();
  });
  $('#raw-input').addEventListener('input', function () { state.raw = this.value; edited(); schedule(); });
  ['gw', 'gs'].forEach(function (id) { $('#' + id).addEventListener('input', function () { state[id] = this.value; save(); }); });

  $('#make-freq').addEventListener('click', function () {
    if (!cur || !cur.items || state.mode !== 'raw') return;
    if (cur.items.length > MAX_ROWS) { EDU.toast(t('err_toomanyrows', { n: MAX_ROWS })); return; }
    state.disc = cur.items.map(function (it) { return { x: String(it.x), f: String(it.f) }; });
    state.mode = 'disc'; state.sample = ''; state.a = ''; state.h = '';
    renderInputs(); render();
  });
  $('#make-grp').addEventListener('click', function () {
    if (!cur || !cur.st || state.mode !== 'raw') return;
    var w = S.parseCell(state.gw), s = S.parseCell(state.gs);
    if (w === null || isNaN(w)) w = S.niceWidth(cur.st.min, cur.st.max, cur.st.n);
    if (s === null || isNaN(s)) s = S.clean(Math.floor(cur.st.min / w) * w);
    var cls = w > 0 ? S.groupValues(cur.items, s, w, MAX_ROWS) : null;
    if (!cls) { EDU.toast(t('err_group')); return; }
    state.grp = cls.map(function (c) { return { l: String(c.l), u: String(c.u), f: String(c.f) }; });
    state.mode = 'grp'; state.sample = ''; state.a = ''; state.h = '';
    renderInputs(); render();
  });

  ['disc', 'grp'].forEach(function (kind) {
    var body = $('#' + kind + '-body');
    body.addEventListener('input', function (e) {
      var inp = e.target;
      if (!inp.dataset || inp.dataset.i === undefined) return;
      var row = state[kind][+inp.dataset.i];
      if (!row) return;
      row[inp.dataset.k] = inp.value;
      edited(); schedule();
    });
    body.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
      e.preventDefault();
      var all = $$('#' + kind + '-body input'), at = all.indexOf(e.target);
      if (at >= 0 && at < all.length - 1) { all[at + 1].focus(); all[at + 1].select(); }
      else addRow(kind);
    });
    body.addEventListener('click', function (e) {
      var b = e.target.closest('.st-del');
      if (!b) return;
      var i = +b.dataset.i;
      state[kind].splice(i, 1);
      if (!state[kind].length) state[kind] = blankRows(kind, 1);
      edited(); renderRows(kind); render();
      var next = $$('#' + kind + '-body .st-del')[Math.min(i, state[kind].length - 1)];
      if (next) next.focus();
    });
    $('#' + kind + '-add').addEventListener('click', function () { addRow(kind); });
    $('#' + kind + '-clear').addEventListener('click', function () {
      if (!confirm(t('confirm_clear'))) return;
      state[kind] = blankRows(kind); state.a = ''; state.h = '';
      edited(); renderRows(kind); render();
      var f = $('#' + kind + '-body input'); if (f) f.focus();
    });
  });
  function addRow(kind) {
    var rows = state[kind];
    if (rows.length >= MAX_ROWS) { EDU.toast(t('err_toomanyrows', { n: MAX_ROWS })); return; }
    var row = kind === 'disc' ? { x: '', f: '' } : { l: '', u: '', f: '' }, focusKey = kind === 'disc' ? 'x' : 'l';
    if (kind === 'grp' && rows.length) {
      var last = rows[rows.length - 1], l = S.parseCell(last.l), u = S.parseCell(last.u);
      if (l !== null && u !== null && !isNaN(l) && !isNaN(u) && u > l) {
        var gap = 0;
        if (rows.length > 1) {
          var pu = S.parseCell(rows[rows.length - 2].u);
          if (pu !== null && !isNaN(pu) && l - pu > 0 && l - pu <= 1) gap = S.clean(l - pu);
        }
        row.l = String(S.clean(u + gap)); row.u = String(S.clean(u + gap + (u - l))); focusKey = 'f';
      }
    }
    rows.push(row);
    renderRows(kind); schedule();
    var inp = $('#' + kind + '-body input[data-i="' + (rows.length - 1) + '"][data-k="' + focusKey + '"]');
    if (inp) inp.focus();
  }
  $('#q-make').addEventListener('click', function () {
    var s = S.parseCell($('#q-start').value), w = S.parseCell($('#q-width').value), k = S.parseCell($('#q-count').value);
    if (s === null || isNaN(s) || w === null || isNaN(w) || w <= 0 || k === null || isNaN(k) || k < 1 || k > MAX_ROWS || Math.round(k) !== k) {
      EDU.toast(t('err_quick', { n: MAX_ROWS })); return;
    }
    var old = state.grp, rows = [];
    for (var i = 0; i < k; i++) rows.push({ l: String(S.clean(s + i * w)), u: String(S.clean(s + (i + 1) * w)), f: old[i] ? old[i].f : '' });
    state.grp = rows; state.a = ''; state.h = '';
    edited(); renderRows('grp'); render();
    var f = $('#grp-body input[data-k="f"]'); if (f) f.focus();
  });
  [1, 2, 3, 4].forEach(function (d) {
    $('#dec-' + d).addEventListener('click', function () { state.dec = d; renderInputs(); render(); });
  });

  /* working controls */
  TABS.forEach(function (k, i) {
    $('#tab-' + k).addEventListener('click', function () { state.tab = k; renderWork(cur); save(); });
    $('#tab-' + k).addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      if (document.documentElement.dir === 'rtl') d = -d;
      var nk = TABS[(i + d + TABS.length) % TABS.length];
      state.tab = nk; renderWork(cur); save(); $('#tab-' + nk).focus();
    });
  });
  ['direct', 'assumed', 'step'].forEach(function (m) {
    $('#mm-' + m).addEventListener('click', function () { state.mMethod = m; render(); });
  });
  ['dev', 'short'].forEach(function (m) {
    $('#vm-' + m).addEventListener('click', function () { state.vMethod = m; render(); });
  });
  $$('.in-a').forEach(function (e) { e.addEventListener('input', function () { state.a = e.value; $$('.in-a').forEach(function (o) { if (o !== e) o.value = e.value; }); schedule(); }); });
  $$('.in-h').forEach(function (e) { e.addEventListener('input', function () { state.h = e.value; $$('.in-h').forEach(function (o) { if (o !== e) o.value = e.value; }); schedule(); }); });
  $$('.copy-tbl').forEach(function (b) {
    b.addEventListener('click', function () { var s = COPY[b.dataset.panel]; if (s) EDU.copy(s); });
  });
  $('#out-median').addEventListener('click', function (e) {
    if (!e.target.closest('#show-ogive')) return;
    state.chart = 'ogive'; drawChart(); save();
    var card = $('#chart-card');
    if (card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#print').addEventListener('click', function () { window.print(); });
  $('#work-fs').addEventListener('click', function () { EDU.fullscreen($('#work-card')); });

  $('#copy-res').addEventListener('click', function () {
    if (!cur || !cur.st) return;
    var d = tileData(cur), lines = [t('app_title')];
    if (state.sample) lines.push(t('ex_' + state.sample));
    TILES.forEach(function (tl) { lines.push(t(tl[1]) + ': ' + d[tl[0]].s); });
    EDU.copy(lines.join('\n').replace(/[⁦-⁩]/g, ''));
  });

  /* chart controls */
  CHARTS.forEach(function (k) {
    $('#ch-' + k).addEventListener('click', function () { state.chart = k; drawChart(); save(); });
  });
  $('#ch-dl').addEventListener('click', function () { EDU.downloadCanvas($('#chart'), 'statistics-' + state.chart + '.png'); });
  $('#ch-fs').addEventListener('click', function () { EDU.fullscreen($('#chart-card')); });

  var raf = 0;
  function redrawSoon() { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { drawChart(); }); }
  if (window.ResizeObserver) {
    var lastW = 0;
    new ResizeObserver(function (en) {
      var w = Math.round(en[0].contentRect.width);
      if (w !== lastW) { lastW = w; redrawSoon(); }
    }).observe($('#chart-stage'));
  } else window.addEventListener('resize', redrawSoon);
  document.addEventListener('fullscreenchange', function () { setTimeout(drawChart, 60); });
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', redrawSoon);
  window.addEventListener('beforeprint', function () { drawChart(true); });
  window.addEventListener('afterprint', function () { drawChart(); });
  EDU.onTheme(redrawSoon);
  EDU.onLang(function () { renderInputs(); render(); });

  renderInputs();
  render();

  /* for tests / debugging */
  window.StatsCalc = { state: function () { return state; }, result: function () { return cur; }, render: render };
})();
