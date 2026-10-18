/* Land Area Converter: local land units state by state, plot area (rectangle, Heron, 4 sides + diagonal,
   walked boundary with a scale drawing) and a land price helper. Everything stays on this device. */
(function () {
  'use strict';
  var SLUG = 'land-area-converter';
  var D = window.LAC_DATA, store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var LRI = '⁦', PDI = '⁩';
  function iso(s) { return LRI + s + PDI; }
  var STATE_IDS = D.states.map(function (s) { return s.id; });
  var LEN = { ft: 1, m: 1 / 0.3048, gaj: 3 };            /* length unit → feet */
  var SHAPES = ['rect', 'tri', 'quad', 'walk'];

  /* ------------------------------------------------------------ saved state */
  function defaults() {
    return {
      tab: 'convert', state: 'up', val: '1', unit: 'bigha', target: 'sqft', sizes: {},
      plot: { shape: 'rect', lu: 'ft', rect: { l: '30', w: '40' }, tri: { a: '30', b: '40', c: '50' },
        quad: { ab: '40', bc: '30', cd: '42', da: '28', ac: '50' },
        walk: [{ l: '60', d: '90' }, { l: '40', d: '180' }, { l: '60', d: '270' }, { l: '40', d: '0' }] },
      price: { mode: 'rate', rate: '1,500', per: 'sqft', area: '1200', aunit: 'sqft', total: '45,00,000', tarea: '1', tunit: 'bigha' }
    };
  }
  function merge(def, saved) {
    if (Array.isArray(def)) return Array.isArray(saved) ? saved.filter(function (x) { return x && typeof x === 'object'; }).map(function (x) { return { l: String(x.l == null ? '' : x.l), d: String(x.d == null ? '' : x.d) }; }) : def;
    var out = {}; saved = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    Object.keys(def).forEach(function (k) {
      var d = def[k], s = saved[k];
      if (k === 'sizes') out[k] = s && typeof s === 'object' && !Array.isArray(s) ? s : {};
      else if (d && typeof d === 'object') out[k] = merge(d, s);
      else out[k] = typeof s === typeof d ? s : d;
    });
    return out;
  }
  var S = merge(defaults(), store.get('s', null));
  if (['convert', 'plot', 'price'].indexOf(S.tab) < 0) S.tab = 'convert';
  if (STATE_IDS.indexOf(S.state) < 0) S.state = 'up';
  if (SHAPES.indexOf(S.plot.shape) < 0) S.plot.shape = 'rect';
  if (!LEN[S.plot.lu]) S.plot.lu = 'ft';
  if (S.price.mode !== 'total') S.price.mode = 'rate';
  function save() { store.set('s', S); }

  /* ------------------------------------------------------------ numbers */
  var ZEROS = [0x660, 0x6F0, 0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66];
  function parseNum(s) {
    s = String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var cp = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (cp >= ZEROS[i] && cp <= ZEROS[i] + 9) return String(cp - ZEROS[i]);
      return c;
    }).replace(/[\s,٬₹]/g, '').replace(/٫/g, '.');
    if (!s) return NaN;
    if (!/^[+]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return NaN;
    return Number(s);
  }
  function fmtN(x) {
    if (!isFinite(x)) return '–';
    var a = Math.abs(x);
    if (a === 0) return '0';
    if (a >= 1e15 || a < 1e-9) return x.toExponential(4).replace('e+', ' × 10^').replace('e-', ' × 10^-');
    if (a >= 1000) return EDU.fmt(x, { maximumFractionDigits: 2 });
    if (a >= 1) return EDU.fmt(x, { maximumFractionDigits: 4 });
    return EDU.fmt(x, { maximumSignificantDigits: 4 });
  }
  function rupees(x) {
    if (!isFinite(x)) return '–';
    var s = '₹' + EDU.fmt(Math.round(x), { maximumFractionDigits: 0 });
    if (x >= 1e7) s += ' (' + t('crore_n', { n: EDU.fmt(x / 1e7, { maximumFractionDigits: 2 }) }) + ')';
    else if (x >= 1e5) s += ' (' + t('lakh_n', { n: EDU.fmt(x / 1e5, { maximumFractionDigits: 2 }) }) + ')';
    return s;
  }
  function rupeesShort(x) { return '₹' + EDU.fmt(x, { maximumFractionDigits: x < 100 ? 2 : 0 }); }

  /* ------------------------------------------------------------ units and sizes */
  function stateById(id) { for (var i = 0; i < D.states.length; i++) if (D.states[i].id === id) return D.states[i]; return D.states[0]; }
  function uname(id) { return t('u_' + id); }
  function localDef(st, id) { for (var i = 0; i < st.units.length; i++) if (st.units[i].id === id) return st.units[i]; return null; }
  function stdDef(id) { for (var i = 0; i < D.std.length; i++) if (D.std[i].id === id) return D.std[i]; return null; }
  function sizeCfg(stId, uid) {
    var all = S.sizes[stId]; if (!all || typeof all !== 'object') return { o: 0, c: '' };
    var c = all[uid]; return c && typeof c === 'object' ? { o: typeof c.o === 'number' ? c.o : (c.o === 'c' ? 'c' : 0), c: String(c.c || '') } : { o: 0, c: '' };
  }
  function setSizeCfg(stId, uid, cfg) { if (!S.sizes[stId] || typeof S.sizes[stId] !== 'object') S.sizes[stId] = {}; S.sizes[stId][uid] = cfg; save(); }
  /* Options for a local unit: derived / fixed / variants, then "my own size". */
  function options(st, u, depth) {
    var o = [];
    if (u.of) {
      var p = sizeOf(st, u.of, (depth || 0) + 1);
      var f = u.div ? p / u.div : p * u.mul;
      o.push({ kind: 'of', sqft: f, label: '= ' + (u.div ? '1/' + u.div : u.mul) + ' ' + uname(u.of) + ' (' + fmtN(f) + ' ' + uname('sqft') + ')', src: u.src });
    } else if (!u.variants) o.push({ kind: 'fixed', sqft: u.sqft, label: fmtN(u.sqft) + ' ' + uname('sqft'), src: u.src });
    (u.variants || []).forEach(function (v) { o.push({ kind: 'var', sqft: v.sqft, label: t(v.v) + ': ' + fmtN(v.sqft) + ' ' + uname('sqft'), src: v.src }); });
    return o;
  }
  function sizeOf(st, id, depth) {
    var u = localDef(st, id);
    if (!u) { var s = stdDef(id); return s ? s.sqft : NaN; }
    if ((depth || 0) > 6) return NaN;
    var cfg = sizeCfg(st.id, id);
    if (cfg.o === 'c') { var c = parseNum(cfg.c); if (c > 0 && isFinite(c)) return c; }
    var o = options(st, u, depth);
    var i = typeof cfg.o === 'number' && cfg.o >= 0 && cfg.o < o.length ? cfg.o : 0;
    return o[i].sqft;
  }
  function isCustom(st, id) { var cfg = sizeCfg(st.id, id); return cfg.o === 'c' && parseNum(cfg.c) > 0; }
  function unitList(st) {
    var out = st.units.map(function (u) { return { id: u.id, local: true, sqft: sizeOf(st, u.id) }; });
    D.std.forEach(function (u) { out.push({ id: u.id, local: false, sqft: u.sqft }); });
    return out;
  }
  function unitIds(st) { return unitList(st).map(function (u) { return u.id; }); }
  function fillUnitSelect(sel, st, value) {
    sel.innerHTML = '';
    unitList(st).forEach(function (u) { sel.appendChild(el('option', { value: u.id, text: uname(u.id) })); });
    sel.value = unitIds(st).indexOf(value) >= 0 ? value : unitIds(st)[0];
    return sel.value;
  }
  function q(a, u) { return iso(fmtN(a) + ' ' + uname(u)); }

  /* ------------------------------------------------------------ shared bits */
  function resultGrid(st, sqft, opts) {
    opts = opts || {};
    var box = el('div', { class: 'lac-res', id: opts.id || null });
    unitList(st).forEach(function (u) {
      var b = el('button', { type: 'button', class: 'lac-r' + (u.local ? ' local' : '') + (u.id === opts.inUnit ? ' is-in' : ''), dataset: { unit: u.id } },
        el('span', { class: 'top' }, el('span', { class: 'n', text: uname(u.id) }), el('span', { class: 'v lac-ltr', text: fmtN(sqft / u.sqft) })),
        u.id !== 'sqft' ? el('span', { class: 's lac-ltr', text: '1 ' + uname(u.id) + ' = ' + fmtN(u.sqft) + ' ' + uname('sqft') }) : null);
      if (opts.onPick) {
        b.setAttribute('aria-pressed', u.id === opts.target ? 'true' : 'false');
        b.addEventListener('click', function () { opts.onPick(u.id); });
      }
      box.appendChild(b);
    });
    return box;
  }
  function stepList(items) {
    var ol = el('ol', { class: 'lac-steps' });
    items.forEach(function (it, i) {
      ol.appendChild(el('li', { class: i === items.length - 1 ? 'ans' : '' }, el('span', { class: 'lbl', text: it[0] }), it[1] ? el('span', { class: 'math', text: it[1] }) : null));
    });
    return ol;
  }
  function convSteps(st, v, from, to) {
    var sf = sizeOf(st, from), stt = sizeOf(st, to), sq = v * sf, r = sq / stt, out = [];
    if (from !== 'sqft') {
      out.push([t('st_size', { u: uname(from) }), iso('1 ' + uname(from) + ' = ' + fmtN(sf) + ' ' + uname('sqft'))]);
      out.push([t('st_mul'), iso(fmtN(v) + ' × ' + fmtN(sf) + ' = ' + fmtN(sq) + ' ' + uname('sqft'))]);
    }
    if (to !== 'sqft' && to !== from) {
      out.push([t('st_size', { u: uname(to) }), iso('1 ' + uname(to) + ' = ' + fmtN(stt) + ' ' + uname('sqft'))]);
      out.push([t('st_div', { u: uname(to) }), iso(fmtN(sq) + ' ÷ ' + fmtN(stt) + ' = ' + fmtN(r) + ' ' + uname(to))]);
    }
    out.push([t('st_ans'), q(v, from) + ' = ' + q(r, to)]);
    return out;
  }
  function shareText(text) {
    var touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (navigator.share && touch) navigator.share({ title: t('app_title'), text: text }).catch(function () { });
    else EDU.copy(text);
  }
  function actions(getText) {
    return el('div', { class: 'row lac-actions' },
      el('button', { type: 'button', class: 'btn', id: 'btn-copy-' + S.tab, i18n: 'copy_result', onclick: function () { EDU.copy(getText()); } }),
      el('button', { type: 'button', class: 'btn', i18n: 'share', onclick: function () { shareText(getText()); } }),
      el('button', { type: 'button', class: 'btn', i18n: 'print', onclick: function () { window.print(); } }));
  }
  function numField(id, labelKey, value, onInput, extra) {
    var inp = el('input', { type: 'text', inputmode: 'decimal', id: id, class: 'lac-num' + (extra && extra.big ? ' lac-big-in' : ''), autocomplete: 'off', value: value });
    inp.addEventListener('input', function () { onInput(inp.value, inp); });
    return el('label', { class: 'field' }, el('span', { text: extra && extra.labelText ? extra.labelText : t(labelKey) }), inp);
  }
  function markBad(inp, bad) { if (inp) inp.setAttribute('aria-invalid', bad ? 'true' : 'false'); }

  /* ------------------------------------------------------------ converter */
  var conv = {};
  function renderConvert() {
    var st = stateById(S.state), pane = $('#pane-convert');
    pane.innerHTML = '';
    var unitSel = el('select', { id: 'unit' });
    S.unit = fillUnitSelect(unitSel, st, S.unit);
    if (unitIds(st).indexOf(S.target) < 0) S.target = 'sqft';
    unitSel.addEventListener('change', function () { S.unit = unitSel.value; save(); updateConvert(); });
    var valField = numField('val', 'lbl_value', S.val, function (v, inp) { S.val = v; save(); updateConvert(inp); }, { big: true });
    conv.sum = el('div', { class: 'lac-sum', id: 'summary', 'aria-live': 'polite' });
    conv.err = el('p', { class: 'lac-err', id: 'val-err', role: 'alert' });
    conv.grid = el('div');
    conv.steps = el('div', { id: 'steps' });
    conv.sizes = el('div', { id: 'sizes' });

    var left = el('div', { class: 'lac-col' },
      el('div', { class: 'card' },
        el('h2', { class: 'lac-h', i18n: 'conv_h' }),
        el('div', { class: 'lac-in two' }, valField, el('label', { class: 'field' }, el('span', { i18n: 'lbl_unit' }), unitSel)),
        conv.err, conv.sum, actions(convText)),
      el('div', { class: 'card' },
        el('div', { class: 'row spread' }, el('h2', { class: 'lac-h', i18n: 'all_h' }), el('span', { class: 'small muted lac-legend', i18n: 'legend_local' })),
        el('p', { class: 'small muted', style: { marginTop: '0' }, i18n: 'tap_hint' }),
        conv.grid));
    var right = el('div', { class: 'lac-col' },
      el('div', { class: 'card' }, el('h2', { class: 'lac-h', id: 'steps-h' }), conv.steps),
      el('div', { class: 'card' }, el('h2', { class: 'lac-h', text: t('sizes_h', { s: t('s_' + st.id) }) }),
        el('p', { class: 'small muted', style: { marginTop: '0' }, i18n: 'sizes_p' }), conv.sizes,
        el('button', { type: 'button', class: 'btn btn-sm', id: 'sizes-reset', i18n: 'sizes_reset', onclick: function () { delete S.sizes[st.id]; save(); renderSizes(); updateConvert(); } })),
      el('details', { class: 'card' }, el('summary', { i18n: 'src_h' }),
        el('p', { class: 'small', text: t('src_p', { d: D.checked }) }),
        el('ul', { class: 'lac-srcs no-i18n' }, D.sources.map(function (s) { return el('li', { text: s }); }))));
    pane.appendChild(el('div', { class: 'lac-main' }, left, right));
    renderSizes();
    updateConvert();
  }
  function renderSizes() {
    var st = stateById(S.state), box = conv.sizes; box.innerHTML = '';
    if (!st.units.length) return;
    st.units.forEach(function (u) {
      var opts = options(st, u), cfg = sizeCfg(st.id, u.id);
      var sel = el('select', { id: 'size-' + u.id, 'aria-label': t('size_of', { u: uname(u.id) }) });
      opts.forEach(function (o, i) { sel.appendChild(el('option', { value: String(i), text: o.label })); });
      sel.appendChild(el('option', { value: 'c', text: t('size_custom') }));
      sel.value = cfg.o === 'c' ? 'c' : String(typeof cfg.o === 'number' && cfg.o < opts.length ? cfg.o : 0);
      var inp = el('input', { type: 'text', inputmode: 'decimal', id: 'custom-' + u.id, class: 'lac-num', value: cfg.c, placeholder: t('custom_ph'),
        'aria-label': t('custom_lbl', { u: uname(u.id), sqft: uname('sqft') }) });
      var cWrap = el('label', { class: 'field' }, el('span', { text: t('custom_lbl', { u: uname(u.id), sqft: uname('sqft') }) }), inp);
      cWrap.hidden = sel.value !== 'c';
      var srcLine = el('span', { class: 'src no-i18n' });
      function showSrc() { var o = opts[Number(sel.value)]; srcLine.textContent = sel.value === 'c' ? '' : (o && o.src) || ''; }
      showSrc();
      sel.addEventListener('change', function () {
        var c = sizeCfg(st.id, u.id); c.o = sel.value === 'c' ? 'c' : Number(sel.value); setSizeCfg(st.id, u.id, c);
        cWrap.hidden = sel.value !== 'c'; showSrc(); refreshDerived(); updateConvert();
        if (sel.value === 'c') inp.focus();
      });
      inp.addEventListener('input', function () {
        var c = sizeCfg(st.id, u.id); c.o = 'c'; c.c = inp.value; setSizeCfg(st.id, u.id, c);
        var n = parseNum(inp.value); markBad(inp, inp.value.trim() !== '' && !(n > 0));
        refreshDerived(); updateConvert();
      });
      box.appendChild(el('div', { class: 'lac-size', dataset: { unit: u.id } },
        el('div', { class: 'hd' }, el('b', { text: uname(u.id) }), el('span', { class: 'small lac-ltr', dataset: { cur: u.id } })),
        sel, cWrap, srcLine, u.note ? el('p', { class: 'note muted', text: t(u.note) }) : null));
    });
    refreshDerived();
  }
  /* Update the "current size" labels and derived option texts without rebuilding the inputs. */
  function refreshDerived() {
    var st = stateById(S.state);
    st.units.forEach(function (u) {
      var cur = $('[data-cur="' + u.id + '"]', conv.sizes);
      if (cur) cur.textContent = '1 ' + uname(u.id) + ' = ' + fmtN(sizeOf(st, u.id)) + ' ' + uname('sqft') + (isCustom(st, u.id) ? ' ✎' : '');
      if (u.of) {
        var sel = $('#size-' + u.id, conv.sizes), o = options(st, u);
        if (sel && sel.options[0]) sel.options[0].textContent = o[0].label;
      }
    });
  }
  function convValue() { return parseNum(S.val); }
  function updateConvert(inp) {
    var st = stateById(S.state), v = convValue(), ok = v >= 0 && isFinite(v) && v < 1e18;
    markBad(inp || $('#val'), !ok && S.val.trim() !== '');
    conv.err.textContent = ok ? '' : (S.val.trim() === '' ? t('err_empty') : t('err_num'));
    conv.grid.innerHTML = ''; conv.sum.innerHTML = ''; conv.steps.innerHTML = '';
    var sh = $('#steps-h'); if (sh) sh.textContent = t('steps_h', { u: uname(S.target) });
    if (!ok) return;
    var sqft = v * sizeOf(st, S.unit);
    var big = S.target === 'sqft' && S.unit === 'sqft' ? 'acre' : S.target;
    if (big === S.unit) big = S.unit === 'sqft' ? 'acre' : 'sqft';
    conv.sum.appendChild(el('span', { class: 'math', id: 'sum-main', text: q(v, S.unit) + ' = ' + q(sqft / sizeOf(st, big), big) }));
    if (big !== 'sqft' && S.unit !== 'sqft') conv.sum.appendChild(el('span', { class: 'sub', text: '= ' + q(sqft, 'sqft') + ' = ' + q(sqft / sizeOf(st, 'acre'), 'acre') }));
    conv.grid.appendChild(resultGrid(st, sqft, { id: 'res', inUnit: S.unit, target: S.target, onPick: function (id) {
      S.target = id; save(); updateConvert();
      var s = $('#steps-h'); if (s && window.innerWidth < 940) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } }));
    conv.steps.appendChild(stepList(convSteps(st, v, S.unit, S.target)));
    var ph = $('#print-head'); if (ph) ph.textContent = t('app_title') + ' · ' + t('s_' + st.id) + ' · ' + new Date().toLocaleDateString('en-IN');
  }
  function convText() {
    var st = stateById(S.state), v = convValue(); if (!(v >= 0)) return '';
    var sqft = v * sizeOf(st, S.unit);
    var lines = [t('app_title') + ' (' + t('s_' + st.id) + ')', fmtN(v) + ' ' + uname(S.unit) + ' ='];
    unitList(st).forEach(function (u) { if (u.id !== S.unit) lines.push('• ' + fmtN(sqft / u.sqft) + ' ' + uname(u.id)); });
    st.units.forEach(function (u) { lines.push('1 ' + uname(u.id) + ' = ' + fmtN(sizeOf(st, u.id)) + ' ' + uname('sqft') + (isCustom(st, u.id) ? ' (' + t('size_custom') + ')' : '')); });
    lines.push(t('warn_local'));
    return lines.join('\n');
  }

  /* ------------------------------------------------------------ plot area */
  var plot = {};
  function heron(a, b, c) {
    var x = [a, b, c].sort(function (p, q2) { return q2 - p; }); a = x[0]; b = x[1]; c = x[2];
    if (!(c > 0) || a >= b + c) return NaN;
    return 0.25 * Math.sqrt((a + (b + c)) * (c - (a - b)) * (c + (a - b)) * (a + (b - c)));
  }
  function triPoint(base, s1, s2) { /* point at distance s1 from (0,0) and s2 from (base,0), y > 0 */
    var x = (base * base + s1 * s1 - s2 * s2) / (2 * base); var y = Math.sqrt(Math.max(0, s1 * s1 - x * x)); return [x, y];
  }
  function lenName() { return t('lu_' + S.plot.lu); }
  function areaName() { return t('lua_' + S.plot.lu); }
  function computePlot() {
    var P = S.plot, n = function (v) { return parseNum(v); }, r = { ok: false, steps: [], pts: null, labels: [] };
    var un = areaName();
    if (P.shape === 'rect') {
      var l = n(P.rect.l), w = n(P.rect.w);
      r.bad = { 'p-l': !(l > 0), 'p-w': !(w > 0) };
      if (!(l > 0 && w > 0)) { r.err = t('err_sides'); return r; }
      r.area = l * w; r.steps.push([t('st_rect'), iso(fmtN(l) + ' × ' + fmtN(w) + ' = ' + fmtN(r.area) + ' ' + un)]);
      r.pts = [[0, 0], [l, 0], [l, w], [0, w]]; r.labels = [l, w, l, w]; r.ok = true;
    } else if (P.shape === 'tri') {
      var a = n(P.tri.a), b = n(P.tri.b), c = n(P.tri.c);
      r.bad = { 'p-a': !(a > 0), 'p-b': !(b > 0), 'p-c': !(c > 0) };
      if (!(a > 0 && b > 0 && c > 0)) { r.err = t('err_sides'); return r; }
      var ar = heron(a, b, c);
      if (!(ar > 0)) { r.err = t('err_tri'); return r; }
      var s = (a + b + c) / 2;
      r.steps.push([t('st_half'), iso('s = (' + fmtN(a) + ' + ' + fmtN(b) + ' + ' + fmtN(c) + ') ÷ 2 = ' + fmtN(s))]);
      r.steps.push([t('st_heron'), iso('√(' + fmtN(s) + ' × ' + fmtN(s - a) + ' × ' + fmtN(s - b) + ' × ' + fmtN(s - c) + ') = ' + fmtN(ar) + ' ' + un)]);
      r.area = ar; var C = triPoint(a, c, b); r.pts = [[0, 0], [a, 0], C]; r.labels = [a, b, c]; r.ok = true;
    } else if (P.shape === 'quad') {
      var Q = P.quad, ab = n(Q.ab), bc = n(Q.bc), cd = n(Q.cd), da = n(Q.da), ac = n(Q.ac);
      r.bad = { 'p-ab': !(ab > 0), 'p-bc': !(bc > 0), 'p-cd': !(cd > 0), 'p-da': !(da > 0), 'p-ac': !(ac > 0) };
      if (!(ab > 0 && bc > 0 && cd > 0 && da > 0 && ac > 0)) { r.err = t('err_sides'); return r; }
      var t1 = heron(ab, bc, ac), t2 = heron(cd, da, ac);
      if (!(t1 > 0) || !(t2 > 0)) { r.err = t('err_quad'); return r; }
      var s1 = (ab + bc + ac) / 2, s2 = (cd + da + ac) / 2;
      r.steps.push([t('st_tri', { n: 'ABC' }), iso('s = ' + fmtN(s1) + ';  √(' + fmtN(s1) + ' × ' + fmtN(s1 - ab) + ' × ' + fmtN(s1 - bc) + ' × ' + fmtN(s1 - ac) + ') = ' + fmtN(t1))]);
      r.steps.push([t('st_tri', { n: 'ACD' }), iso('s = ' + fmtN(s2) + ';  √(' + fmtN(s2) + ' × ' + fmtN(s2 - cd) + ' × ' + fmtN(s2 - da) + ' × ' + fmtN(s2 - ac) + ') = ' + fmtN(t2))]);
      r.steps.push([t('st_add'), iso(fmtN(t1) + ' + ' + fmtN(t2) + ' = ' + fmtN(t1 + t2) + ' ' + un)]);
      r.area = t1 + t2;
      /* A=(0,0), C=(ac,0); B below the diagonal, D above, so the drawing is a simple (non-crossed) plot */
      var B = triPoint(ac, ab, bc), Dd = triPoint(ac, da, cd);
      r.pts = [[0, 0], [B[0], -B[1]], [ac, 0], [Dd[0], Dd[1]]]; r.labels = [ab, bc, cd, da]; r.diag = ac; r.ok = true;
    } else {
      var legs = P.walk, pts = [[0, 0]], x = 0, y = 0, badMap = {}, valid = 0;
      legs.forEach(function (lg, i) {
        var L = n(lg.l), d = n(lg.d === '' ? 'x' : lg.d);
        if (lg.d !== '' && /^\s*-/.test(lg.d)) d = -n(String(lg.d).replace('-', ''));
        badMap['w-l-' + i] = !(L > 0); badMap['w-d-' + i] = !isFinite(d);
        if (L > 0 && isFinite(d)) { var rad = d * Math.PI / 180; x += L * Math.sin(rad); y += L * Math.cos(rad); pts.push([x, y]); valid++; }
      });
      r.bad = badMap;
      if (valid < 3) { r.err = t('err_walk'); return r; }
      var gap = Math.hypot(x, y), per = 0;
      legs.forEach(function (lg) { var L = n(lg.l); if (L > 0) per += L; });
      if (gap < 1e-9 * Math.max(1, per) || gap < 1e-6) pts.pop();
      var A2 = 0; for (var i = 0; i < pts.length; i++) { var p = pts[i], q2 = pts[(i + 1) % pts.length]; A2 += p[0] * q2[1] - q2[0] * p[1]; }
      var ar2 = Math.abs(A2) / 2;
      if (!(ar2 > 0)) { r.err = t('err_walk_flat'); return r; }
      r.steps.push([t('st_walk', { n: valid }), null]);
      r.steps.push([t('st_shoelace'), iso('½ × |Σ (x₁y₂ − x₂y₁)| = ' + fmtN(ar2) + ' ' + un)]);
      r.gap = gap; r.gapPct = per ? gap / per * 100 : 0;
      r.area = ar2; r.pts = pts.map(function (p) { return [p[0], -p[1]]; }); r.walk = true; r.ok = true;
      r.labels = [];
      legs.forEach(function (lg) { var L = n(lg.l), d = n(lg.d); if (L > 0 && isFinite(d)) r.labels.push(L); });
      if (r.pts.length > r.labels.length) r.labels.push(gap); /* closing side */
    }
    return r;
  }
  function drawSvg(r) {
    var pts = r.pts, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(function (p) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    var w = maxX - minX || 1, h = maxY - minY || 1, span = Math.max(w, h), pad = span * 0.16, fs = span * 0.055;
    var vb = [minX - pad, minY - pad, w + 2 * pad, h + 2 * pad].map(function (v) { return v.toFixed(4); }).join(' ');
    var cx = pts.reduce(function (s, p) { return s + p[0]; }, 0) / pts.length, cy = pts.reduce(function (s, p) { return s + p[1]; }, 0) / pts.length;
    var poly = pts.map(function (p) { return p[0].toFixed(4) + ',' + p[1].toFixed(4); }).join(' ');
    var out = '<svg class="lac-svg" id="plot-svg" xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" direction="ltr" role="img" aria-label="' + EDU.esc(t('drawing_h')) + '">';
    out += '<polygon points="' + poly + '" style="fill:color-mix(in srgb, var(--primary) 18%, transparent);stroke:var(--primary);stroke-width:2.5;stroke-linejoin:round" vector-effect="non-scaling-stroke"/>';
    if (r.walk && r.gap > 1e-6) {
      var last = pts[pts.length - 1];
      out += '<line x1="' + last[0] + '" y1="' + last[1] + '" x2="' + pts[0][0] + '" y2="' + pts[0][1] + '" style="stroke:var(--danger);stroke-width:2.5;stroke-dasharray:6 5" vector-effect="non-scaling-stroke"/>';
    }
    if (r.diag) out += '<line x1="' + pts[0][0] + '" y1="' + pts[0][1] + '" x2="' + pts[2][0] + '" y2="' + pts[2][1] + '" style="stroke:var(--accent);stroke-width:2;stroke-dasharray:7 5" vector-effect="non-scaling-stroke"/>';
    var txt = function (x, y, s, color, bold) {
      return '<text x="' + x.toFixed(4) + '" y="' + y.toFixed(4) + '" text-anchor="middle" dominant-baseline="middle" style="font-size:' + fs.toFixed(4) + 'px;font-weight:' + (bold ? 800 : 600) +
        ';fill:' + color + ';paint-order:stroke;stroke:var(--surface-2);stroke-width:' + (fs * 0.25).toFixed(4) + 'px">' + EDU.esc(s) + '</text>';
    };
    pts.forEach(function (p, i) {
      var q2 = pts[(i + 1) % pts.length], mx = (p[0] + q2[0]) / 2, my = (p[1] + q2[1]) / 2;
      var dx = mx - cx, dy = my - cy, dl = Math.hypot(dx, dy) || 1;
      if (r.labels[i] != null) out += txt(mx + dx / dl * fs * 0.9, my + dy / dl * fs * 0.9, fmtN(r.labels[i]), 'var(--text)', false);
      var ex = p[0] - cx, ey = p[1] - cy, el2 = Math.hypot(ex, ey) || 1;
      var name = r.walk ? (i === 0 ? '★' : String(i)) : 'ABCDEFGH'.charAt(i);
      out += txt(p[0] + ex / el2 * fs * 1.1, p[1] + ey / el2 * fs * 1.1, name, 'var(--primary)', true);
    });
    if (r.diag) out += txt((pts[0][0] + pts[2][0]) / 2, (pts[0][1] + pts[2][1]) / 2 - fs * 0.8, fmtN(r.diag), 'var(--accent)', false);
    if (r.walk) { var nx = minX - pad * 0.55, ny = minY - pad * 0.35; out += txt(nx, ny, 'N ↑', 'var(--muted)', true); }
    return out + '</svg>';
  }
  function renderPlot() {
    var st = stateById(S.state), pane = $('#pane-plot'), P = S.plot;
    pane.innerHTML = '';
    var seg = el('div', { class: 'seg lac-seg', role: 'group', 'aria-label': t('shape_lbl') });
    SHAPES.forEach(function (s) {
      seg.appendChild(el('button', { type: 'button', id: 'shape-' + s, 'aria-pressed': String(P.shape === s), i18n: 'shape_' + s,
        onclick: function () { P.shape = s; save(); renderPlot(); } }));
    });
    var lseg = el('div', { class: 'seg lac-seg', role: 'group', 'aria-label': t('lu_lbl') });
    Object.keys(LEN).forEach(function (u) {
      lseg.appendChild(el('button', { type: 'button', id: 'lu-' + u, 'aria-pressed': String(P.lu === u), i18n: 'lu_' + u,
        onclick: function () { P.lu = u; save(); renderPlot(); } }));
    });
    var inputs = el('div', { class: 'lac-in' });
    function f(id, key, obj, prop, vars) {
      return numField(id, key, obj[prop], function (v) { obj[prop] = v; save(); updatePlot(); }, { labelText: t(key, vars) + ' (' + lenName() + ')' });
    }
    if (P.shape === 'rect') { inputs.className = 'lac-in two'; inputs.appendChild(f('p-l', 'lbl_length', P.rect, 'l')); inputs.appendChild(f('p-w', 'lbl_width', P.rect, 'w')); }
    else if (P.shape === 'tri') { inputs.className = 'lac-in three'; ['a', 'b', 'c'].forEach(function (k, i) { inputs.appendChild(f('p-' + k, 'side_n', P.tri, k, { n: ['AB', 'BC', 'CA'][i] })); }); }
    else if (P.shape === 'quad') {
      inputs.className = 'lac-in two';
      ['ab', 'bc', 'cd', 'da'].forEach(function (k) { inputs.appendChild(f('p-' + k, 'side_n', P.quad, k, { n: k.toUpperCase() })); });
      inputs.appendChild(f('p-ac', 'diag_n', P.quad, 'ac', { n: 'AC' }));
    } else {
      var tb = el('tbody');
      P.walk.forEach(function (lg, i) {
        var li = el('input', { type: 'text', inputmode: 'decimal', id: 'w-l-' + i, class: 'lac-num', value: lg.l, 'aria-label': t('walk_len', { n: i + 1 }) + ' (' + lenName() + ')' });
        var di = el('input', { type: 'text', inputmode: 'decimal', id: 'w-d-' + i, class: 'lac-num', value: lg.d, 'aria-label': t('walk_dir', { n: i + 1 }) });
        li.addEventListener('input', function () { lg.l = li.value; save(); updatePlot(); });
        di.addEventListener('input', function () { lg.d = di.value; save(); updatePlot(); });
        tb.appendChild(el('tr', null, el('td', { class: 'idx lac-ltr', text: String(i + 1) }), el('td', null, li), el('td', null, di),
          el('td', { class: 'del' }, el('button', { type: 'button', class: 'btn btn-ghost', 'aria-label': t('walk_del', { n: i + 1 }), text: '✕',
            onclick: function () { P.walk.splice(i, 1); save(); renderPlot(); } }))));
      });
      inputs.appendChild(el('p', { class: 'small muted', style: { margin: '0' }, i18n: 'walk_p' }));
      inputs.appendChild(el('div', { class: 'scroll-x' }, el('table', { class: 'table lac-walk' },
        el('thead', null, el('tr', null, el('th', { text: '#' }), el('th', { text: t('walk_len_h') + ' (' + lenName() + ')' }), el('th', { i18n: 'walk_dir_h' }), el('th', null))), tb)));
      inputs.appendChild(el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn', id: 'walk-add', i18n: 'walk_add', onclick: function () { P.walk.push({ l: '', d: '' }); save(); renderPlot(); var n = $('#w-l-' + (P.walk.length - 1)); if (n) n.focus(); } }),
        el('button', { type: 'button', class: 'btn btn-ghost', id: 'walk-clear', i18n: 'clear', onclick: function () { P.walk = [{ l: '', d: '' }, { l: '', d: '' }, { l: '', d: '' }]; save(); renderPlot(); } })));
      inputs.appendChild(el('p', { class: 'small muted', style: { margin: '0' }, i18n: 'walk_dir_hint' }));
    }
    plot.err = el('p', { class: 'lac-err', id: 'plot-err', role: 'alert' });
    plot.draw = el('div', { id: 'plot-draw' });
    plot.note = el('div');
    plot.sum = el('div', { class: 'lac-sum', id: 'plot-sum', 'aria-live': 'polite' });
    plot.grid = el('div');
    plot.steps = el('div', { id: 'plot-steps' });
    var left = el('div', { class: 'lac-col' },
      el('div', { class: 'card stack' },
        el('h2', { class: 'lac-h', i18n: 'plot_h' }),
        el('div', { class: 'field' }, el('span', { i18n: 'shape_lbl' }), seg),
        el('div', { class: 'field' }, el('span', { i18n: 'lu_lbl' }), lseg),
        inputs, plot.err),
      el('div', { class: 'card' }, el('h2', { class: 'lac-h', i18n: 'drawing_h' }), plot.draw, plot.note));
    var right = el('div', { class: 'lac-col' },
      el('div', { class: 'card' }, el('h2', { class: 'lac-h', i18n: 'plot_res_h' }), plot.sum,
        el('div', { class: 'row lac-actions' },
          el('button', { type: 'button', class: 'btn btn-primary', id: 'to-price', i18n: 'to_price', onclick: function () {
            var r = computePlot(); if (!r.ok) return;
            S.price.area = String(Math.round(r.area * LEN[S.plot.lu] * LEN[S.plot.lu] * 100) / 100); S.price.aunit = 'sqft'; S.price.mode = 'rate';
            setTab('price');
          } }),
          el('button', { type: 'button', class: 'btn', i18n: 'copy_result', onclick: function () { EDU.copy(plotText()); } }),
          el('button', { type: 'button', class: 'btn', i18n: 'print', onclick: function () { window.print(); } })),
        el('h3', { class: 'lac-h', style: { marginTop: '16px' }, i18n: 'how_h' }), plot.steps),
      el('div', { class: 'card' }, el('h2', { class: 'lac-h', i18n: 'all_h' }), plot.grid));
    pane.appendChild(el('div', { class: 'lac-main' }, left, right));
    updatePlot();
  }
  function updatePlot() {
    var st = stateById(S.state), r = computePlot();
    Object.keys(r.bad || {}).forEach(function (id) { var e = document.getElementById(id); if (e) markBad(e, r.bad[id] && e.value.trim() !== ''); });
    plot.err.textContent = r.ok ? '' : r.err || '';
    plot.draw.innerHTML = ''; plot.sum.innerHTML = ''; plot.grid.innerHTML = ''; plot.steps.innerHTML = ''; plot.note.innerHTML = '';
    if (!r.ok) return;
    plot.draw.innerHTML = drawSvg(r);
    if (r.walk) {
      if (r.gap > 1e-6 && r.gapPct >= 0.5) plot.note.appendChild(el('p', { class: 'callout warning small', id: 'walk-gap', style: { marginTop: '10px' }, text: t('walk_gap', { d: fmtN(r.gap) + ' ' + lenName(), p: fmtN(r.gapPct) }) }));
      else plot.note.appendChild(el('p', { class: 'callout success small', id: 'walk-gap', style: { marginTop: '10px' }, i18n: 'walk_closed' }));
    }
    var f = LEN[S.plot.lu], sqft = r.area * f * f, steps = r.steps.slice();
    if (S.plot.lu !== 'ft') steps.push([t('st_to_sqft'), iso(fmtN(r.area) + ' ' + areaName() + ' × ' + fmtN(f * f) + ' = ' + fmtN(sqft) + ' ' + uname('sqft'))]);
    steps.push([t('st_ans'), q(sqft, 'sqft') + ' = ' + q(sqft / 43560, 'acre')]);
    plot.steps.appendChild(stepList(steps));
    plot.sum.appendChild(el('span', { class: 'math', id: 'plot-area', text: q(sqft, 'sqft') }));
    plot.sum.appendChild(el('span', { class: 'sub', text: '= ' + q(sqft / D.SQM, 'sqm') + ' = ' + q(sqft / 9, 'sqyd') }));
    plot.grid.appendChild(resultGrid(st, sqft, { id: 'plot-res' }));
  }
  function plotText() {
    var st = stateById(S.state), r = computePlot(); if (!r.ok) return '';
    var f = LEN[S.plot.lu], sqft = r.area * f * f;
    var lines = [t('app_title') + ': ' + t('plot_res_h') + ' (' + t('shape_' + S.plot.shape) + ')'];
    unitList(st).forEach(function (u) { lines.push('• ' + fmtN(sqft / u.sqft) + ' ' + uname(u.id)); });
    lines.push(t('warn_local'));
    return lines.join('\n');
  }

  /* ------------------------------------------------------------ price */
  var price = {};
  function renderPrice() {
    var st = stateById(S.state), pane = $('#pane-price'), P = S.price;
    pane.innerHTML = '';
    var seg = el('div', { class: 'seg lac-seg', role: 'group', 'aria-label': t('pmode_lbl') });
    ['rate', 'total'].forEach(function (m) {
      seg.appendChild(el('button', { type: 'button', id: 'pmode-' + m, 'aria-pressed': String(P.mode === m), i18n: 'pmode_' + m, onclick: function () { P.mode = m; save(); renderPrice(); } }));
    });
    var form = el('div', { class: 'lac-in two' });
    function usel(id, prop, labelKey) {
      var s = el('select', { id: id }); P[prop] = fillUnitSelect(s, st, P[prop]);
      s.addEventListener('change', function () { P[prop] = s.value; save(); updatePrice(); });
      return el('label', { class: 'field' }, el('span', { i18n: labelKey }), s);
    }
    function nf(id, key, prop) { return numField(id, key, P[prop], function (v) { P[prop] = v; save(); updatePrice(); }); }
    if (P.mode === 'rate') {
      form.appendChild(nf('p-rate', 'lbl_rate', 'rate')); form.appendChild(usel('p-per', 'per', 'lbl_per'));
      form.appendChild(nf('p-area', 'lbl_area', 'area')); form.appendChild(usel('p-aunit', 'aunit', 'lbl_unit'));
    } else {
      form.appendChild(el('div', { style: { gridColumn: '1 / -1' } }, nf('p-total', 'lbl_total', 'total')));
      form.appendChild(nf('p-tarea', 'lbl_area', 'tarea')); form.appendChild(usel('p-tunit', 'tunit', 'lbl_unit'));
    }
    price.err = el('p', { class: 'lac-err', id: 'price-err', role: 'alert' });
    price.sum = el('div', { class: 'lac-sum', id: 'price-sum', 'aria-live': 'polite' });
    price.body = el('div', { id: 'price-body' });
    pane.appendChild(el('div', { class: 'lac-main' },
      el('div', { class: 'lac-col' }, el('div', { class: 'card stack' }, el('h2', { class: 'lac-h', i18n: 'price_h' }), seg, form, price.err, price.sum, actions(priceText)),
        el('p', { class: 'callout small', i18n: 'price_note' })),
      el('div', { class: 'lac-col' }, el('div', { class: 'card' }, price.body))));
    updatePrice();
  }
  function priceCalc() {
    var st = stateById(S.state), P = S.price;
    if (P.mode === 'rate') {
      var rate = parseNum(P.rate), area = parseNum(P.area);
      if (!(rate >= 0 && area > 0 && isFinite(rate) && isFinite(area))) return { ok: false, bad: { 'p-rate': !(rate >= 0), 'p-area': !(area > 0) } };
      var asq = area * sizeOf(st, P.aunit), inPer = asq / sizeOf(st, P.per), total = inPer * rate;
      return { ok: true, mode: 'rate', rate: rate, area: area, inPer: inPer, total: total, sqft: asq };
    }
    var tot = parseNum(P.total), ta = parseNum(P.tarea);
    if (!(tot >= 0 && ta > 0 && isFinite(tot) && isFinite(ta))) return { ok: false, bad: { 'p-total': !(tot >= 0), 'p-tarea': !(ta > 0) } };
    var sq = ta * sizeOf(st, P.tunit);
    return { ok: true, mode: 'total', total: tot, sqft: sq, area: ta };
  }
  function updatePrice() {
    var st = stateById(S.state), P = S.price, r = priceCalc();
    Object.keys(r.bad || {}).forEach(function (id) { var e = document.getElementById(id); if (e) markBad(e, r.bad[id] && e.value.trim() !== ''); });
    ['p-rate', 'p-area', 'p-total', 'p-tarea'].forEach(function (id) { var e = document.getElementById(id); if (e && r.ok) markBad(e, false); });
    price.err.textContent = r.ok ? '' : t('err_num');
    price.sum.innerHTML = ''; price.body.innerHTML = '';
    if (!r.ok) return;
    if (r.mode === 'rate') {
      price.sum.appendChild(el('span', { class: 'sub', i18n: 'res_total' }));
      price.sum.appendChild(el('span', { class: 'math', id: 'price-total', text: iso(rupees(r.total)) }));
      var steps = [];
      if (P.aunit !== P.per) steps.push([t('st_area_in', { u: uname(P.per) }), q(r.area, P.aunit) + ' = ' + q(r.inPer, P.per)]);
      steps.push([t('st_price'), iso(fmtN(r.inPer) + ' × ' + rupeesShort(r.rate) + ' = ' + rupeesShort(Math.round(r.total)))]);
      steps.push([t('st_ans'), iso(rupees(r.total))]);
      price.body.appendChild(el('h2', { class: 'lac-h', i18n: 'how_h' }));
      price.body.appendChild(stepList(steps));
      price.body.appendChild(el('h3', { class: 'lac-h', style: { marginTop: '16px' }, i18n: 'rate_table_h' }));
    } else {
      var per = r.total / r.sqft;
      price.sum.appendChild(el('span', { class: 'sub', text: t('res_rate_per', { u: uname('sqft') }) }));
      price.sum.appendChild(el('span', { class: 'math', id: 'price-per', text: iso(rupeesShort(per)) }));
      price.body.appendChild(el('h2', { class: 'lac-h', i18n: 'rate_table_h' }));
    }
    var perSqft = r.total / r.sqft, tb = el('tbody');
    unitList(st).forEach(function (u) {
      tb.appendChild(el('tr', { dataset: { unit: u.id } }, el('td', { text: t('per_u', { u: uname(u.id) }) }), el('td', { class: 'v lac-ltr', text: rupeesShort(perSqft * u.sqft) })));
    });
    price.body.appendChild(el('div', { class: 'scroll-x' }, el('table', { class: 'table lac-ptable', id: 'rate-table' }, tb)));
  }
  function priceText() {
    var st = stateById(S.state), r = priceCalc(); if (!r.ok) return '';
    var lines = [t('app_title') + ': ' + t('price_h') + ' (' + t('s_' + st.id) + ')', fmtN(r.sqft) + ' ' + uname('sqft') + ' → ' + rupees(r.total)];
    var perSqft = r.total / r.sqft;
    ['sqft', 'sqyd', 'acre'].concat(st.units.map(function (u) { return u.id; })).forEach(function (id) { lines.push('• ' + t('per_u', { u: uname(id) }) + ': ' + rupeesShort(perSqft * sizeOf(st, id))); });
    lines.push(t('price_note'));
    return lines.join('\n');
  }

  /* ------------------------------------------------------------ shell */
  function fillStates() {
    var sel = $('#state'); sel.innerHTML = '';
    D.states.forEach(function (s) { sel.appendChild(el('option', { value: s.id, text: t('s_' + s.id) })); });
    sel.value = S.state;
  }
  function setTab(tab) {
    S.tab = tab; save();
    $$('.lac-tabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === tab)); });
    ['convert', 'plot', 'price'].forEach(function (p) { $('#pane-' + p).hidden = p !== tab; });
    if (tab === 'convert') renderConvert(); else if (tab === 'plot') renderPlot(); else renderPrice();
  }
  function render() { fillStates(); setTab(S.tab); }
  $$('.lac-tabs [data-tab]').forEach(function (b) { b.addEventListener('click', function () { setTab(b.dataset.tab); }); });
  $('#state').addEventListener('change', function () {
    S.state = $('#state').value;
    var st = stateById(S.state);
    if (unitIds(st).indexOf(S.unit) < 0) S.unit = st.units.length ? st.units[0].id : 'acre';
    save(); setTab(S.tab);
  });
  $('#reset-all').addEventListener('click', function () {
    if (!window.confirm(t('confirm_reset'))) return;
    S = defaults(); save(); render();
  });
  EDU.onLang(render);
  render();
})();
