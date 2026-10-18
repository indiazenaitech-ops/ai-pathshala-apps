/* Percentage & Marks Calculator
   Six calculators in one page: percent basics, marks %, CGPA / SGPA, discount & shopping, profit & loss, attendance.
   Every answer comes with NCERT-style step-by-step working that can be copied, shared, printed or shown full screen.
   Everything runs on this device; nothing is sent anywhere. */
(function () {
  'use strict';
  var SLUG = 'percentage-calculator';
  var store = EDU.store(SLUG);
  var el = EDU.el, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc;
  var FSI = '⁨', PDI = '⁩';
  var CBSE_FACTOR = 9.5;                       /* CBSE's rule for its old CGPA marksheets: indicative % = CGPA x 9.5 */
  var TABS = ['basic', 'marks', 'cgpa', 'shop', 'pl', 'att'];
  var UNITS = ['g', 'kg', 'ml', 'l', 'pc'];
  var UNIT = { g: { dim: 'w', f: 0.001, base: 'kg' }, kg: { dim: 'w', f: 1, base: 'kg' }, ml: { dim: 'v', f: 0.001, base: 'l' }, l: { dim: 'v', f: 1, base: 'l' }, pc: { dim: 'n', f: 1, base: 'pc' } };
  var NAME_KEYS = ['sb_eng', 'sb_hin', 'sb_math', 'sb_sci', 'sb_sst', 'sb_comp', 'sg_phy', 'sg_chem', 'sg_lab'];

  /* EDU.t, but in right-to-left pages every inserted value is isolated, so "₹1,180" or "85.33%" stays in one piece */
  function rtl() { return document.documentElement.dir === 'rtl'; }
  function t(key, vars) {
    if (vars && rtl()) {
      var o = {};
      Object.keys(vars).forEach(function (k) { o[k] = FSI + vars[k] + PDI; });
      vars = o;
    }
    return EDU.t(key, vars);
  }
  function plain(s) { return String(s == null ? '' : s).replace(/[⁦-⁩]/g, ''); }

  /* ================================================================ numbers */
  var ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function latin(s) {
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (code >= ZEROS[i] && code <= ZEROS[i] + 9) return String(code - ZEROS[i]);
      return c;
    }).replace(/٫/g, '.').replace(/[٬،]/g, ',');
  }
  /* "₹1,18,000.50", "Rs. 500/-", "12.5%", "८४" -> { v } or { e: 'empty' | 'nan' | 'big' } */
  function parse(raw) {
    var s = latin(raw).trim().replace(/₹|\brs\.?|\binr\b/gi, '').replace(/\/-\s*$/, '').replace(/[\s,_'’]/g, '').replace(/%$/, '').replace(/^[−–]/, '-');
    if (!s) return { e: 'empty' };
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return { e: 'nan' };
    if (s.replace(/^[-+]/, '').split('.')[0].replace(/^0+/, '').length > 15) return { e: 'big' };
    var v = Number(s);
    if (!isFinite(v)) return { e: 'nan' };
    return { v: v === 0 ? 0 : v };
  }
  /* hide floating-point dust: 8.4 * 9.5 = 79.80000000000001 -> 79.8 */
  function clean(v) { if (!isFinite(v)) return v; if (Math.abs(v) < 1e-12) return 0; return parseFloat(v.toPrecision(12)); }
  var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function sci(v) {
    var e = Math.floor(Math.log10(Math.abs(v))), m = Math.round(v / Math.pow(10, e) * 1000) / 1000;
    if (Math.abs(m) >= 10) { m /= 10; e++; }
    return EDU.fmt(m, { maximumFractionDigits: 3 }) + ' × 10' + String(e).replace('-', '⁻').replace(/\d/g, function (c) { return SUP[c]; });
  }
  /* number with up to d decimals (default 2), Indian digit grouping, Western digits */
  function N(v, d) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    v = clean(v);
    if (Math.abs(v) >= 1e15) return sci(v);
    return EDU.fmt(v, { maximumFractionDigits: d === undefined ? 2 : d });
  }
  /* the (almost) exact value, for the working: 4 decimals, more for small numbers (0.00012345) */
  function X(v) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    var a = Math.abs(clean(v));
    return N(v, a !== 0 && a < 1 ? Math.min(8, 5 - Math.floor(Math.log10(a))) : 4);
  }
  function P(v, d) { return N(v, d) + '%'; }
  function money(v) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    v = clean(v);
    if (Math.abs(v) >= 1e15) return '₹' + sci(v);
    var a = Math.abs(v), whole = Math.abs(a - Math.round(a)) < 0.005;
    return (v < 0 ? '−' : '') + '₹' + EDU.fmt(a, whole ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  /* a typed decimal as an exact fraction n / d with d = 10^k (k <= 6) */
  function dec10(v) {
    for (var k = 0; k <= 6; k++) { var s = v * Math.pow(10, k); if (Math.abs(s - Math.round(s)) < 1e-7) return { n: Math.round(s), d: Math.pow(10, k) }; }
    return { n: Math.round(v * 1e6), d: 1e6 };
  }
  function sum(list, f) { return list.reduce(function (a, o) { return a + f(o); }, 0); }

  /* ================================================================ working (HTML for the steps) */
  function F(a, b) { return '<span class="frac"><span>' + a + '</span><span>' + b + '</span></span>'; }
  function ln(html) { return '<div class="fx-line">' + html + '</div>'; }
  function B(s) { return '<b>' + s + '</b>'; }
  function st(text, lines) { return { text: text, lines: lines || [] }; }
  function stepsHtml(steps) {
    return '<ol class="pc-steps">' + steps.map(function (s) {
      return '<li><p>' + esc(s.text) + '</p>' + (s.lines.length ? '<div class="fx" dir="ltr">' + s.lines.join('') + '</div>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function notesHtml(notes) {
    return (notes || []).map(function (n) { return '<div class="callout' + (n.cls ? ' ' + n.cls : '') + '"><p>' + esc(n.text) + '</p></div>'; }).join('');
  }
  function tileHtml(x) {
    return '<div class="pc-bt' + (x.main ? ' main' : '') + (x.cls ? ' ' + x.cls : '') + '"><span class="lbl">' + esc(x.lbl) + '</span><b><span dir="ltr"' +
      (x.id ? ' id="' + x.id + '"' : '') + '>' + esc(x.val) + '</span></b></div>';
  }
  /* the working as plain text (fractions become a/b) for "Copy result" */
  function htmlToPlain(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    $$('.frac', d).forEach(function (f) {
      var wrap = function (s) { s = s.trim(); return /^\(.*\)$/.test(s) || !/[\s+\-−×÷]/.test(s) ? s : '(' + s + ')'; };
      f.replaceWith(document.createTextNode(wrap(f.children[0].textContent) + '/' + wrap(f.children[1].textContent)));
    });
    return plain(d.textContent.replace(/\s+/g, ' ').trim());
  }
  function stepsText(steps) {
    return steps.map(function (s, i) {
      return (i + 1) + '. ' + plain(s.text) + (s.lines.length ? '\n   ' + s.lines.map(htmlToPlain).join('\n   ') : '');
    }).join('\n');
  }

  /* ================================================================ state */
  function defaults() {
    return {
      tab: 'basic',
      basic: { mode: 'of', of: { x: '15', y: '640' }, what: { x: '48', y: '160' }, change: { a: '400', b: '500' },
        addsub: { op: 'add', y: '1000', x: '18' }, reverse: { dir: 'down', x: '20', v: '800' } },
      marks: {
        rows: [{ nk: 'sb_eng', n: '', m: '85', o: '100' }, { nk: 'sb_hin', n: '', m: '78', o: '100' }, { nk: 'sb_math', n: '', m: '92', o: '100' },
          { nk: 'sb_sci', n: '', m: '88', o: '100' }, { nk: 'sb_sst', n: '', m: '74', o: '100' }, { nk: 'sb_comp', n: '', m: '95', o: '100' }],
        best5: false, keep: false, target: '85', rem: '100' },
      cgpa: { mode: 'c2p', method: 'cbse', g: '8.4', p: '85', a: '0', m: '10', b: '0',
        sg: [{ nk: 'sb_math', n: '', c: '4', g: '9' }, { nk: 'sg_phy', n: '', c: '4', g: '8' }, { nk: 'sg_chem', n: '', c: '3', g: '7' },
          { nk: 'sb_eng', n: '', c: '2', g: '10' }, { nk: 'sg_lab', n: '', c: '2', g: '9' }],
        sem: [{ n: '', s: '8.2', c: '22' }, { n: '', s: '8.6', c: '24' }, { n: '', s: '7.9', c: '23' }, { n: '', s: '8.8', c: '25' }] },
      shop: { mode: 'disc', disc: { kind: 'pct', p: '2499', d: '30', s: '1799' }, stack: { p: '2000', d1: '50', d2: '20', d3: '' },
        bogo: { b: '2', g: '1', o: '100', p: '299' },
        unit: { packs: [{ p: '60', q: '500', u: 'g' }, { p: '110', q: '1', u: 'kg' }, { p: '520', q: '5', u: 'kg' }] } },
      pl: { mode: 'pl', pl: { cp: '800', sp: '1000' }, target: { kind: 'markup', cp: '800', p: '25' }, cp: { kind: 'profit', sp: '1150', p: '15' } },
      att: { a: '30', h: '45', t: '75', l: '20' }
    };
  }
  var ENUMS = {
    'basic.mode': ['of', 'what', 'change', 'addsub', 'reverse'], 'basic.addsub.op': ['add', 'sub'], 'basic.reverse.dir': ['down', 'up'],
    'cgpa.mode': ['c2p', 'p2c', 'sgpa', 'sem'], 'cgpa.method': ['cbse', 'custom'],
    'shop.mode': ['disc', 'stack', 'bogo', 'unit'], 'shop.disc.kind': ['pct', 'sale'],
    'pl.mode': ['pl', 'target', 'cp'], 'pl.target.kind': ['markup', 'margin'], 'pl.cp.kind': ['profit', 'loss']
  };
  var S;
  function getP(path, root) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, root || S); }
  function setP(path, v) {
    var ks = path.split('.'), o = S;
    for (var i = 0; i < ks.length - 1; i++) { if (!o[ks[i]] || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; }
    o[ks[ks.length - 1]] = v;
  }
  /* saved state may be old, half-written or edited by hand: keep only what has the right shape */
  function merge(def, sav) {
    if (Array.isArray(def)) return Array.isArray(sav) ? sav : def;
    if (def && typeof def === 'object') {
      var o = {}, s = sav && typeof sav === 'object' && !Array.isArray(sav) ? sav : {};
      Object.keys(def).forEach(function (k) { o[k] = merge(def[k], s[k]); });
      return o;
    }
    if (typeof def === 'string') return typeof sav === 'string' ? sav.slice(0, 40) : (typeof sav === 'number' && isFinite(sav) ? String(sav) : def);
    return typeof sav === typeof def ? sav : def;
  }
  function str(v) { return typeof v === 'string' ? v.slice(0, 40) : (typeof v === 'number' && isFinite(v) ? String(v) : ''); }
  function cleanRows(rows, fields, max, blank) {
    var out = (Array.isArray(rows) ? rows : []).slice(0, max).filter(function (r) { return r && typeof r === 'object'; }).map(function (r) {
      var o = { n: str(r.n) };
      fields.forEach(function (f) { o[f] = str(r[f]); });
      if (NAME_KEYS.indexOf(r.nk) >= 0 && !o.n) o.nk = r.nk;
      return o;
    });
    return out.length ? out : [blank()];
  }
  function load() {
    var d = defaults();
    S = merge(d, store.get('state', null));
    if (TABS.indexOf(S.tab) < 0) S.tab = 'basic';
    Object.keys(ENUMS).forEach(function (k) { if (ENUMS[k].indexOf(getP(k)) < 0) setP(k, getP(k, d)); });
    if (typeof S.marks.best5 !== 'boolean') S.marks.best5 = false;
    if (typeof S.marks.keep !== 'boolean') S.marks.keep = false;
    S.marks.rows = cleanRows(S.marks.rows, ['m', 'o'], ROWS.marks.max, ROWS.marks.blank);
    S.cgpa.sg = cleanRows(S.cgpa.sg, ['c', 'g'], ROWS.sg.max, ROWS.sg.blank);
    S.cgpa.sem = cleanRows(S.cgpa.sem, ['s', 'c'], ROWS.sem.max, ROWS.sem.blank);
    var packs = Array.isArray(S.shop.unit.packs) ? S.shop.unit.packs : [];
    S.shop.unit.packs = [0, 1, 2].map(function (i) {
      var p = packs[i] && typeof packs[i] === 'object' ? packs[i] : {};
      return { p: str(p.p), q: str(p.q), u: UNITS.indexOf(p.u) >= 0 ? p.u : 'kg' };
    });
  }
  var saveT = 0;
  function flush() { clearTimeout(saveT); if (S) store.set('state', S); }
  function save() { clearTimeout(saveT); saveT = setTimeout(flush, 250); }
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });

  /* ================================================================ table rows (marks, SGPA, semesters) */
  var ROWS = {
    marks: { get: function () { return S.marks.rows; }, box: 'mk-rows', max: 30, ph: 'subj_n',
      blank: function () { return { n: '', m: '', o: '100' }; },
      cols: [['n', 'col_subject'], ['m', 'col_marks'], ['o', 'col_outof']] },
    sg: { get: function () { return S.cgpa.sg; }, box: 'sg-rows', max: 30, ph: 'subj_n', rx: 'col_points',
      blank: function () { return { n: '', c: '', g: '' }; },
      cols: [['n', 'col_subject'], ['c', 'col_credits'], ['g', 'col_gp']] },
    sem: { get: function () { return S.cgpa.sem; }, box: 'sm-rows', max: 20, ph: 'sem_n', rx: 'col_points',
      blank: function () { return { n: '', s: '', c: '' }; },
      cols: [['n', 'col_sem'], ['s', 'col_sgpa'], ['c', 'col_credits']] }
  };
  function rowName(kind, r, i) { return (r.n && r.n.trim()) || (r.nk ? t(r.nk) : t(ROWS[kind].ph, { n: i + 1 })); }
  function buildRows(kind) {
    var R = ROWS[kind], list = R.get(), box = $('#' + R.box);
    box.textContent = '';
    list.forEach(function (r, i) {
      var row = el('div', { class: 'pc-row', dataset: { i: String(i) } });
      R.cols.forEach(function (c, ci) {
        var f = c[0], isName = ci === 0;
        var inp = el('input', { type: 'text', id: kind + '-' + f + '-' + i, class: isName ? 'no-i18n' : 'num', autocomplete: 'off', maxlength: '40',
          inputmode: isName ? null : 'decimal', placeholder: isName ? t(R.ph, { n: i + 1 }) : null,
          'aria-label': t('aria_cell', { col: t(c[1]), n: i + 1 }) });
        inp.value = isName ? (r.n || (r.nk ? t(r.nk) : '')) : (r[f] || '');
        inp.addEventListener('input', function () {
          var cur = R.get()[i];
          if (!cur) return;
          cur[f] = inp.value;
          if (isName) delete cur.nk;
          save(); render();
        });
        row.appendChild(el('div', { class: 'pc-cell c-' + ['n', 'a', 'b'][ci] }, el('span', { class: 'pc-mini', 'aria-hidden': 'true', text: t(c[1]) }), inp));
      });
      row.appendChild(el('div', { class: 'pc-rx' }, el('span', { class: 'pc-mini', 'aria-hidden': 'true', text: R.rx ? t(R.rx) : '%' }), el('span', { id: kind + '-x-' + i, dir: 'ltr' })));
      row.appendChild(el('button', { type: 'button', class: 'btn btn-ghost pc-del', id: kind + '-del-' + i, 'aria-label': t('del_row', { n: i + 1 }), title: t('del_row', { n: i + 1 }), text: '✕',
        onclick: function () {
          var l = R.get();
          l.splice(i, 1);
          if (!l.length) l.push(R.blank());
          save(); buildRows(kind); render();
        } }));
      box.appendChild(row);
    });
  }
  function addRow(kind) {
    var R = ROWS[kind], list = R.get();
    if (list.length >= R.max) { EDU.toast(t('max_rows', { n: R.max })); return; }
    list.push(R.blank());
    save(); buildRows(kind); render();
    var inp = $('#' + kind + '-n-' + (list.length - 1));
    if (inp) inp.focus();
  }
  function setBad(id, bad) {
    var inp = document.getElementById(id);
    if (!inp) return;
    inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
    var box = inp.closest('.pc-in');
    if (box) box.classList.toggle('bad', !!bad);
  }
  /* reads and checks the inputs of one calculator: [{ id, k (state path), lbl (string key), n (name), opt, int, gt0, nz, min, max, lt }] */
  function need(list) {
    var v = {}, err = null;
    list.forEach(function (f) {
      var r = parse(getP(f.k)), e = null, lbl = t(f.lbl);
      if (r.e === 'empty') { if (f.opt) v[f.n] = null; else e = t('err_empty', { f: lbl }); }
      else if (r.e) e = t(r.e === 'big' ? 'err_big' : 'err_nan', { f: lbl });
      else {
        var x = r.v;
        if (f.int && !Number.isInteger(x)) e = t('err_int', { f: lbl });
        else if (f.gt0 && !(x > 0)) e = t('err_gt0', { f: lbl });
        else if (f.nz && x === 0) e = t('err_zero', { f: lbl });
        else if (f.min !== undefined && x < f.min) e = t('err_min', { f: lbl, n: N(f.min) });
        else if (f.max !== undefined && (f.lt ? x >= f.max : x > f.max)) e = t(f.lt ? 'err_lt' : 'err_max', { f: lbl, n: N(f.max) });
        v[f.n] = x;
      }
      setBad(f.id, !!e);
      if (e && !err) err = e;
    });
    return { v: v, err: err };
  }
  /* checks the number columns of every row; a row whose key columns are empty is skipped */
  function scanRows(kind, spec, product, check) {
    var list = ROWS[kind].get(), ok = [], err = null, keys = spec.filter(function (s) { return s.key; });
    if (!keys.length) keys = spec;
    list.forEach(function (r, i) {
      var vals = {}, e = null, empty = keys.every(function (s) { return !String(r[s.f] || '').trim(); });
      spec.forEach(function (s) {
        var bad = false;
        if (!empty && !e) {
          var p = parse(r[s.f]), lbl = t(s.lbl);
          if (p.e === 'empty') { if (s.opt) vals[s.f] = null; else { e = t('err_empty', { f: lbl }); bad = true; } }
          else if (p.e) { e = t(p.e === 'big' ? 'err_big' : 'err_nan', { f: lbl }); bad = true; }
          else if (s.gt0 && !(p.v > 0)) { e = t('err_gt0', { f: lbl }); bad = true; }
          else if (s.min !== undefined && p.v < s.min) { e = t('err_min', { f: lbl, n: N(s.min) }); bad = true; }
          else if (s.max !== undefined && p.v > s.max) { e = t('err_max', { f: lbl, n: N(s.max) }); bad = true; }
          else vals[s.f] = p.v;
        }
        setBad(kind + '-' + s.f + '-' + i, bad);
      });
      if (!empty && !e && check) {
        var c = check(vals);
        if (c) { e = c.msg; setBad(kind + '-' + c.f + '-' + i, true); }
      }
      var rx = $('#' + kind + '-x-' + i), o = null;
      if (!empty && !e) { o = { i: i, name: rowName(kind, r, i), v: vals }; ok.push(o); }
      if (rx) rx.textContent = o ? product(o) : '—';
      if (e && !err) err = t('row_err', { row: rowName(kind, r, i), msg: e });
    });
    return { ok: ok, err: err };
  }

  /* ================================================================ result card */
  var LAST = {};
  function actionsEl(tab) {
    var data = LAST[tab] || { copy: '', share: '' };
    var cp = el('button', { type: 'button', class: 'btn', id: 'copy-' + tab, onclick: function () { if (LAST[tab]) EDU.copy(LAST[tab].copy); } },
      el('span', { 'aria-hidden': 'true', text: '📋' }), ' ', el('span', { text: t('copy_result') }));
    var wa = el('a', { class: 'btn btn-wa', id: 'wa-' + tab, target: '_blank', rel: 'noopener',
      href: EDU.waLink(data.share + '\n\n' + plain(t('share_tail', { url: EDU.shareUrl() }))) },
      el('span', { 'aria-hidden': 'true', text: '💬' }), ' ', el('span', { text: t('wa_share') }));
    var pr = el('button', { type: 'button', class: 'btn', onclick: function () { window.print(); } },
      el('span', { 'aria-hidden': 'true', text: '🖨️' }), ' ', el('span', { text: t('print') }));
    var fs = el('button', { type: 'button', class: 'btn', onclick: function () { EDU.fullscreen($('#res-' + tab)); } },
      el('span', { 'aria-hidden': 'true', text: '📺' }), ' ', el('span', { text: t('fullscreen') }));
    return el('div', { class: 'pc-actions no-print' }, cp, wa, pr, fs);
  }
  /* o = { err } or { tiles: [{ lbl, val, main, cls, id }], answer, steps, notes, extra (html), after (element) }.
     LAST_EXTRA[tab] holds a one-line summary of the second block (marks needed, classes left), for Copy / WhatsApp. */
  function show(tab, o) {
    var live = $('#live-' + tab), work = $('#work-' + tab);
    if (!live || !work) return;
    var head = '<h2>' + esc(t('result')) + '</h2>';
    if (o.err) {
      live.innerHTML = head + '<p class="pc-err" id="err-' + tab + '">' + esc(o.err) + '</p>';
      work.innerHTML = '';
      LAST[tab] = null;
      return;
    }
    var ex = o.extra ? LAST_EXTRA[tab] : '';
    live.innerHTML = head + '<div class="pc-bigs">' + o.tiles.map(function (x, i) { if (i === 0 && !x.id) x.id = 'out-' + tab; return tileHtml(x); }).join('') + '</div>' +
      (o.answer ? '<p class="pc-ans" id="ans-' + tab + '">' + esc(o.answer) + '</p>' : '') + (ex ? '<p class="pc-sr">' + esc(ex) + '</p>' : '');
    var w = '';
    if (o.steps && o.steps.length) w += '<h3>' + esc(t('working')) + '</h3>' + stepsHtml(o.steps);
    w += notesHtml(o.notes);
    if (o.extra) w += o.extra;
    work.innerHTML = w;
    if (o.after) work.appendChild(el('div', { class: 'pc-actions no-print' }, o.after));
    var copy = plain(o.answer || ''), share = copy;
    if (o.steps && o.steps.length) copy += '\n\n' + plain(t('working')) + ':\n' + stepsText(o.steps);
    if (ex) { copy += '\n\n' + plain(ex); share += '\n' + plain(ex); }
    LAST[tab] = { copy: copy.trim(), share: share.trim() };
    work.appendChild(actionsEl(tab));
  }
  /* a second block inside the result card (marks needed, classes left) */
  function section(title, tiles, msg, cls, steps) {
    return '<div class="pc-sec"><h3>' + esc(title) + '</h3>' +
      (tiles.length ? '<div class="pc-bigs">' + tiles.map(tileHtml).join('') + '</div>' : '') +
      (msg ? '<div class="callout' + (cls ? ' ' + cls : '') + '"><p>' + esc(msg) + '</p></div>' : '') +
      (steps && steps.length ? stepsHtml(steps) : '') + '</div>';
  }

  /* ================================================================ small maths helpers for the working */
  function Q(v) { return v < 0 ? '(' + X(v) + ')' : X(v); }
  /* the answer as shown in the big boxes: 2 decimals, more for small numbers (0.0035) */
  function A(v) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    var a = Math.abs(clean(v));
    return a !== 0 && a < 1 ? N(v, Math.min(6, 3 - Math.floor(Math.log10(a)))) : N(v);
  }
  function AP(v) { return A(v) + '%'; }
  function signP(v) { return (clean(v) > 0 ? '+' : '') + AP(v); }
  function apx(v, suf) { return X(v) !== A(v) ? ' ≈ ' + A(v) + (suf || '') : ''; }
  function chain(terms, total, lead) {
    if (terms.length === 1 && total != null) return [ln((lead || '') + B(total))];
    var out = [];
    for (var i = 0; i < terms.length; i += 5) out.push((i ? '+ ' : (lead || '')) + terms.slice(i, i + 5).join(' + '));
    if (total != null) out[out.length - 1] += ' = ' + B(total);
    return out.map(ln);
  }
  var OK = ' <span class="ok-mark">✓</span>', NO = ' <span class="bad">✗</span>';

  /* ================================================================ 1. percent basics */
  function calcBasic() {
    var b = S.basic, m = b.mode, r, x, y, res;
    if (m === 'of') {
      r = need([{ id: 'b-of-x', k: 'basic.of.x', lbl: 'of_x', n: 'x' }, { id: 'b-of-y', k: 'basic.of.y', lbl: 'of_y', n: 'y' }]);
      if (r.err) return { err: r.err };
      x = r.v.x; y = r.v.y; res = x * y / 100;
      return {
        tiles: [{ lbl: t('lbl_answer'), val: A(res), main: true }],
        answer: t('ans_of', { x: X(x), y: X(y), r: A(res) }),
        steps: [
          st(t('s_of1', { x: X(x) }), [ln(X(x) + '% = ' + F(X(x), '100'))]),
          st(t('s_of2', { y: X(y) }), [ln(F(Q(x), '100') + ' × ' + Q(y) + ' = ' + F(Q(x) + ' × ' + Q(y), '100') + ' = ' + F(X(x * y), '100')),
            ln('= ' + B(X(res)) + apx(res))])
        ]
      };
    }
    if (m === 'what') {
      r = need([{ id: 'b-wh-x', k: 'basic.what.x', lbl: 'what_x', n: 'x' }, { id: 'b-wh-y', k: 'basic.what.y', lbl: 'what_y', n: 'y', nz: true }]);
      if (r.err) return { err: r.err };
      x = r.v.x; y = r.v.y; res = x / y * 100;
      return {
        tiles: [{ lbl: t('lbl_answer'), val: AP(res), main: true }],
        answer: t('ans_what', { x: X(x), y: X(y), r: AP(res) }),
        steps: [
          st(t('s_wh1', { x: X(x), y: X(y) }), [ln(F(X(x), X(y)))]),
          st(t('s_wh2'), [ln(F(X(x), X(y)) + ' × 100 = ' + F(X(x * 100), X(y)) + ' = ' + B(X(res) + '%') + apx(res, '%'))])
        ]
      };
    }
    if (m === 'change') {
      r = need([{ id: 'b-ch-a', k: 'basic.change.a', lbl: 'ch_a', n: 'a', gt0: true }, { id: 'b-ch-b', k: 'basic.change.b', lbl: 'ch_b', n: 'b' }]);
      if (r.err) return { err: r.err };
      var a = r.v.a, nb = r.v.b, d = clean(nb - a), pc = d / a * 100, notes = [];
      if (d !== 0 && nb > 0) notes.push({ text: t('back_note', { a: X(a), b: X(nb), p: signP((a - nb) / nb * 100), q: signP(-pc) }) });
      return {
        tiles: [{ lbl: t('lbl_pct_change'), val: signP(pc), main: true }, { lbl: t('lbl_change'), val: (d > 0 ? '+' : '') + A(d) }],
        answer: d === 0 ? t('ans_same', { a: X(a) }) : t(d > 0 ? 'ans_up' : 'ans_down', { a: X(a), b: X(nb), r: AP(Math.abs(pc)) }),
        steps: [
          st(t('s_ch1'), [ln(Q(nb) + ' − ' + Q(a) + ' = ' + B(X(d)))]),
          st(t('s_ch2'), [ln(F(X(d), X(a)) + ' × 100 = ' + B(X(pc) + '%') + apx(pc, '%'))])
        ],
        notes: notes
      };
    }
    if (m === 'addsub') {
      var sub = b.addsub.op === 'sub';
      r = need([{ id: 'b-as-y', k: 'basic.addsub.y', lbl: 'as_y', n: 'y' }, { id: 'b-as-x', k: 'basic.addsub.x', lbl: 'as_x', n: 'x', min: 0, max: sub ? 100 : undefined }]);
      if (r.err) return { err: r.err };
      x = r.v.x; y = r.v.y;
      var part = x * y / 100, k = sub ? 100 - x : 100 + x;
      res = sub ? y - part : y + part;
      return {
        tiles: [{ lbl: t('lbl_answer'), val: A(res), main: true }, { lbl: t('lbl_pct_of', { x: X(x), y: X(y) }), val: A(part) }],
        answer: t(sub ? 'ans_sub' : 'ans_add', { x: X(x), y: X(y), r: A(res) }),
        steps: [
          st(t('s_as1', { x: X(x), y: X(y) }), [ln(F(X(x), '100') + ' × ' + Q(y) + ' = ' + B(X(part)))]),
          st(t(sub ? 's_as2_sub' : 's_as2_add', { y: X(y) }), [ln(Q(y) + (sub ? ' − ' : ' + ') + X(part) + ' = ' + B(X(res)) + apx(res))]),
          st(t('s_short', { m: X(k / 100) }), [ln(Q(y) + ' × ' + F(X(k), '100') + ' = ' + Q(y) + ' × ' + X(k / 100) + ' = ' + B(X(res)))])
        ],
        notes: [{ text: t('gst_note') }]
      };
    }
    /* reverse: what was the value before X% off / X% added? */
    var up = b.reverse.dir === 'up';
    r = need([{ id: 'b-rv-x', k: 'basic.reverse.x', lbl: 'rv_x', n: 'x', min: 0, max: up ? undefined : 100, lt: !up }, { id: 'b-rv-v', k: 'basic.reverse.v', lbl: 'rv_v', n: 'v', min: 0 }]);
    if (r.err) return { err: r.err };
    x = r.v.x;
    var v = r.v.v, kk = up ? 100 + x : 100 - x, orig = v * 100 / kk, cut = orig * x / 100, wrong = up ? v - v * x / 100 : v + v * x / 100;
    return {
      tiles: [{ lbl: t(up ? 'lbl_before' : 'lbl_orig'), val: money(orig), main: true }, { lbl: t(up ? 'lbl_added' : 'lbl_off_amt'), val: money(cut) }],
      answer: t(up ? 'ans_rv_up' : 'ans_rv_down', { x: X(x), r: money(orig) }),
      steps: [
        st(t(up ? 's_rv1_up' : 's_rv1_down', { x: X(x), k: X(kk) }), [ln('100% ' + (up ? '+' : '−') + ' ' + X(x) + '% = ' + B(X(kk) + '%'))]),
        st(t('s_rv2', { k: X(kk), v: money(v) }), [ln('x × ' + F(X(kk), '100') + ' = ' + X(v)), ln('x = ' + X(v) + ' × ' + F('100', X(kk)) + ' = ' + B(X(orig)) + apx(orig))]),
        st(t('s_check'), [ln(F(X(x), '100') + ' × ' + X(orig) + ' = ' + X(cut)), ln(X(orig) + (up ? ' + ' : ' − ') + X(cut) + ' = ' + X(v) + OK)])
      ],
      notes: x > 0 ? [{ text: t(up ? 'rv_mistake_up' : 'rv_mistake_down', { v: money(v), x: X(x), wrong: money(wrong), orig: money(orig) }), cls: 'warning' }] : []
    };
  }

  /* ================================================================ 2. marks % */
  function calcMarks() {
    var sc = scanRows('marks', [{ f: 'm', lbl: 'col_marks', min: 0, key: true }, { f: 'o', lbl: 'col_outof', gt0: true }],
      function (o) { return AP(o.v.m / o.v.o * 100); },
      function (v) { return v.m > v.o ? { f: 'm', msg: t('err_over', { m: X(v.m), o: X(v.o) }) } : null; });
    if (sc.err) return { err: sc.err };
    if (!sc.ok.length) return { err: t('no_rows') };
    var all = sc.ok, used = all, left = [], b5 = S.marks.best5, few = b5 && all.length <= 5, steps = [], notes = [];
    all.forEach(function (o) { o.p = o.v.m / o.v.o * 100; });
    if (b5 && !few) {
      var pool = all.slice(), first = S.marks.keep ? pool.shift() : null;
      pool.sort(function (p, q) { return q.p - p.p || p.i - q.i; });
      var chosen = pool.slice(0, first ? 4 : 5).concat(first ? [first] : []), ids = chosen.map(function (o) { return o.i; });
      used = all.filter(function (o) { return ids.indexOf(o.i) >= 0; });
      left = all.filter(function (o) { return ids.indexOf(o.i) < 0; });
      var nm = function (list) { return list.map(function (o) { return o.name + ' (' + AP(o.p) + ')'; }).join(', '); };
      steps.push(st(first ? t('s_mk_keep', { first: first.name, list: nm(used), left: nm(left) }) : t('s_mk_pick', { list: nm(used), left: nm(left) })));
    }
    var T = sum(used, function (o) { return o.v.m; }), M = sum(used, function (o) { return o.v.o; }), pct = T / M * 100;
    var TA = sum(all, function (o) { return o.v.m; }), MA = sum(all, function (o) { return o.v.o; });
    steps.push(st(t('s_mk1'), chain(used.map(function (o) { return X(o.v.m); }), X(T))));
    steps.push(st(t('s_mk2'), chain(used.map(function (o) { return X(o.v.o); }), X(M))));
    steps.push(st(t('s_mk3'), [ln(F(X(T), X(M)) + ' × 100 = ' + B(X(pct) + '%') + apx(pct, '%'))]));
    if (b5) notes.push({ text: t(few ? 'best5_few' : 'best5_note'), cls: few ? 'warning' : '' });
    var tiles = [{ lbl: t('lbl_pct'), val: AP(pct), main: true }, { lbl: t('lbl_total'), val: X(T) + ' / ' + X(M), id: 'mk-total' }];
    if (b5 && !few) tiles.push({ lbl: t('lbl_all', { n: all.length }), val: AP(TA / MA * 100) });
    else tiles.push({ lbl: t('lbl_count'), val: String(used.length) });
    /* subject table: useful on paper and on the smartboard */
    var ids2 = used.map(function (o) { return o.i; });
    var tbl = '<div class="scroll-x pc-table"><table class="table"><thead><tr><th>' + esc(t('col_subject')) + '</th><th>' + esc(t('col_marks')) + '</th><th>' +
      esc(t('col_outof')) + '</th><th>%</th>' + (b5 && !few ? '<th>' + esc(t('col_counted')) + '</th>' : '') + '</tr></thead><tbody>' +
      all.map(function (o) {
        var on = ids2.indexOf(o.i) >= 0;
        return '<tr' + (b5 && !few && on ? ' class="best"' : '') + '><td class="no-i18n">' + esc(o.name) + '</td><td>' + esc(X(o.v.m)) + '</td><td>' + esc(X(o.v.o)) + '</td><td>' +
          esc(AP(o.p)) + '</td>' + (b5 && !few ? '<td>' + (on ? '✓' : '—') + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div>';
    return { tiles: tiles, answer: t('ans_marks', { t: X(T), m: X(M), p: AP(pct) }), steps: steps, notes: notes, extra: tbl + marksNeeded(TA, MA, all.length) };
  }
  /* "how many marks do I need in the next exam to reach N% overall?" (always on all subjects entered) */
  function marksNeeded(TA, MA, n) {
    var r = need([{ id: 'mk-target', k: 'marks.target', lbl: 'need_target', n: 't', opt: true, gt0: true, max: 100 },
      { id: 'mk-rem', k: 'marks.rem', lbl: 'need_max', n: 'r', opt: true, gt0: true }]);
    var title = t('need_title');
    if (r.err) return section(title, [], r.err, 'danger');
    if (r.v.t === null || r.v.r === null) return section(title, [], t('need_fill'), '');
    var tg = r.v.t, R = r.v.r, newMax = MA + R, needT = tg * newMax / 100, nd = clean(needT - TA), msg, cls, tiles = [];
    var steps = [
      st(t('s_nd0', { n: n, t: X(TA), m: X(MA) })),
      st(t('s_nd1'), [ln(X(MA) + ' + ' + X(R) + ' = ' + B(X(newMax)))]),
      st(t('s_nd2', { p: X(tg) }), [ln(F(X(tg), '100') + ' × ' + X(newMax) + ' = ' + B(X(needT)))]),
      st(t('s_nd3'), [ln(X(needT) + ' − ' + X(TA) + ' = ' + B(X(nd)))])
    ];
    if (nd <= 0) { msg = t('nd_done', { q: AP(TA / newMax * 100) }); cls = 'success'; }
    else if (nd > R) { msg = t('nd_no', { n: A(nd), r: X(R), q: AP((TA + R) / newMax * 100) }); cls = 'danger'; }
    else {
      var whole = Math.ceil(nd - 1e-9), nTxt = Math.abs(whole - nd) < 1e-9 ? X(whole) : t('nd_whole', { n: A(nd), w: X(whole) });
      msg = t('nd_ok', { n: nTxt, r: X(R), p: AP(nd / R * 100) }); cls = '';
      tiles = [{ lbl: t('lbl_need'), val: A(nd) + ' / ' + X(R), id: 'mk-need' }, { lbl: t('lbl_need_pct'), val: AP(nd / R * 100) }];
    }
    LAST_EXTRA.marks = title + ': ' + plain(msg);
    return section(title, tiles, msg, cls, steps);
  }
  var LAST_EXTRA = {};

  /* ================================================================ 3. CGPA / SGPA */
  /* "Your formula: % = (CGPA − 0.5) × 10 + 0" (the maths part always left-to-right) */
  function formulaHtml(v) {
    var f = function (x, d) { return x === null || x === undefined ? d : X(x); };
    return esc(t('cu_formula')) + ' <b dir="ltr">% = (CGPA − ' + esc(f(v.a, '0')) + ') × ' + esc(f(v.m, '?')) + ' + ' + esc(f(v.b, '0')) + '</b>';
  }
  function toPctBtn(g) {
    return el('button', { type: 'button', class: 'btn btn-primary', id: 'to-pct', onclick: function () {
      S.cgpa.g = String(clean(Math.round(g * 100) / 100)); S.cgpa.mode = 'c2p'; S.cgpa.method = 'custom';
      save(); syncInputs(); paintSegs(); updateShow(); render();
      var f = $('#cg-m'); if (f) f.focus();
    } }, el('span', { 'aria-hidden': 'true', text: '➜' }), ' ', el('span', { text: t('to_pct') }));
  }
  function calcCgpa() {
    var c = S.cgpa, m = c.mode, r, sc, steps;
    if (m === 'c2p' || m === 'p2c') {
      var cbse = c.method === 'cbse', fs = [];
      if (m === 'c2p') fs.push({ id: 'cg-g', k: 'cgpa.g', lbl: 'cg_in', n: 'g', min: 0, max: 10 });
      else fs.push({ id: 'cg-p', k: 'cgpa.p', lbl: 'pc_in', n: 'p', min: 0, max: 100 });
      if (!cbse) fs.push({ id: 'cg-a', k: 'cgpa.a', lbl: 'cu_a', n: 'a', opt: true }, { id: 'cg-m', k: 'cgpa.m', lbl: 'cu_m', n: 'm', nz: true }, { id: 'cg-b', k: 'cgpa.b', lbl: 'cu_b', n: 'b', opt: true });
      r = need(fs);
      if (r.err) return { err: r.err };
      var a = cbse ? 0 : (r.v.a || 0), k = cbse ? CBSE_FACTOR : r.v.m, b = cbse ? 0 : (r.v.b || 0), notes = [];
      if (cbse) notes.push({ text: t('cbse_note') });
      if (m === 'c2p') {
        var g = r.v.g, p = clean((g - a) * k + b);
        steps = cbse ? [st(t('s_c2p_cbse'), [ln(X(g) + ' × 9.5 = ' + B(X(p) + '%'))])] :
          [st(t('s_c2p_cu'), [ln('% = (CGPA − ' + X(a) + ') × ' + X(k) + ' + ' + X(b)), ln('= (' + X(g) + ' − ' + X(a) + ') × ' + X(k) + ' + ' + X(b)),
            ln('= ' + Q(g - a) + ' × ' + X(k) + ' + ' + X(b) + ' = ' + B(X(p) + '%'))])];
        if (p > 100 || p < 0) notes.push({ text: t('chk_formula'), cls: 'warning' });
        return { tiles: [{ lbl: t('lbl_pct'), val: AP(p), main: true }], answer: t('ans_c2p', { g: X(g), p: AP(p) }), steps: steps, notes: notes };
      }
      var pp = r.v.p, g2 = clean((pp - b) / k + a), cap = g2 > 10;
      steps = cbse ? [st(t('s_p2c_cbse'), [ln(F(X(pp), '9.5') + ' = ' + B(X(g2)) + apx(g2))])] :
        [st(t('s_p2c_cu'), [ln('CGPA = ' + F('% − ' + X(b), X(k)) + ' + ' + X(a)), ln('= ' + F(X(pp) + ' − ' + X(b), X(k)) + ' + ' + X(a) + ' = ' + B(X(g2)) + apx(g2))])];
      if (cap) notes.push({ text: t('cg_cap'), cls: 'warning' });
      else if (g2 < 0) notes.push({ text: t('chk_formula'), cls: 'warning' });
      var shown = cap ? 10 : g2;
      return { tiles: [{ lbl: t('lbl_cgpa'), val: N(shown, 2), main: true }], answer: t('ans_p2c', { p: X(pp) + '%', g: N(shown, 2) }), steps: steps, notes: notes };
    }
    if (m === 'sgpa') {
      sc = scanRows('sg', [{ f: 'c', lbl: 'col_credits', gt0: true }, { f: 'g', lbl: 'col_gp', min: 0, max: 10 }], function (o) { return X(o.v.c * o.v.g); });
      if (sc.err) return { err: sc.err };
      if (!sc.ok.length) return { err: t('no_rows_sg') };
      var C = sum(sc.ok, function (o) { return o.v.c; }), CP = clean(sum(sc.ok, function (o) { return o.v.c * o.v.g; })), sg = CP / C;
      return {
        tiles: [{ lbl: t('lbl_sgpa'), val: N(sg, 2), main: true }, { lbl: t('lbl_credits'), val: X(C) }, { lbl: t('lbl_points'), val: X(CP) }],
        answer: t('ans_sgpa', { g: N(sg, 2), n: sc.ok.length, c: X(C) }),
        steps: [
          st(t('s_sg1'), chain(sc.ok.map(function (o) { return X(o.v.c) + ' × ' + X(o.v.g); })).concat(chain(sc.ok.map(function (o) { return X(o.v.c * o.v.g); }), X(CP), '= '))),
          st(t('s_sg2'), chain(sc.ok.map(function (o) { return X(o.v.c); }), X(C))),
          st(t('s_sg3'), [ln(F(X(CP), X(C)) + ' = ' + B(X(sg)) + apx(sg))])
        ],
        notes: [{ text: t('round_note') }],
        after: toPctBtn(sg)
      };
    }
    sc = scanRows('sem', [{ f: 's', lbl: 'col_sgpa', min: 0, max: 10, key: true }, { f: 'c', lbl: 'col_credits', gt0: true, opt: true }],
      function (o) { return o.v.c === null ? '—' : X(o.v.s * o.v.c); });
    if (sc.err) return { err: sc.err };
    if (!sc.ok.length) return { err: t('no_rows_sem') };
    var withC = sc.ok.filter(function (o) { return o.v.c !== null; });
    if (withC.length && withC.length < sc.ok.length) {
      sc.ok.forEach(function (o) { if (o.v.c === null) setBad('sem-c-' + o.i, true); });
      return { err: t('sm_mixed') };
    }
    var n = sc.ok.length, sumS = clean(sum(sc.ok, function (o) { return o.v.s; })), avg = sumS / n, cg, tiles;
    if (!withC.length) {
      cg = avg;
      steps = [st(t('s_sm_avg'), [ln(F(sc.ok.map(function (o) { return X(o.v.s); }).join(' + '), String(n)) + ' = ' + F(X(sumS), String(n)) + ' = ' + B(X(cg)) + apx(cg))])];
      tiles = [{ lbl: t('lbl_cgpa'), val: N(cg, 2), main: true }, { lbl: t('lbl_sems'), val: String(n) }];
    } else {
      var C2 = sum(sc.ok, function (o) { return o.v.c; }), P2 = clean(sum(sc.ok, function (o) { return o.v.s * o.v.c; }));
      cg = P2 / C2;
      steps = [
        st(t('s_sm1'), chain(sc.ok.map(function (o) { return X(o.v.s) + ' × ' + X(o.v.c); })).concat(chain(sc.ok.map(function (o) { return X(o.v.s * o.v.c); }), X(P2), '= '))),
        st(t('s_sm2'), chain(sc.ok.map(function (o) { return X(o.v.c); }), X(C2))),
        st(t('s_sm3'), [ln(F(X(P2), X(C2)) + ' = ' + B(X(cg)) + apx(cg))])
      ];
      tiles = [{ lbl: t('lbl_cgpa'), val: N(cg, 2), main: true }, { lbl: t('lbl_credits'), val: X(C2) }, { lbl: t('lbl_simple'), val: N(avg, 2) }];
    }
    return { tiles: tiles, answer: t('ans_cgpa', { g: N(cg, 2), n: n }), steps: steps, notes: [{ text: t('sem_note') }], after: toPctBtn(cg) };
  }

  /* ================================================================ 4. discount & shopping */
  function calcShop() {
    var sh = S.shop, m = sh.mode, r, p;
    if (m === 'disc') {
      var pctKind = sh.disc.kind === 'pct';
      r = need([{ id: 'sd-p', k: 'shop.disc.p', lbl: 'ds_price', n: 'p', gt0: true },
        pctKind ? { id: 'sd-d', k: 'shop.disc.d', lbl: 'ds_pct', n: 'd', min: 0, max: 100 } : { id: 'sd-s', k: 'shop.disc.s', lbl: 'ds_sale', n: 's', min: 0 }]);
      if (r.err) return { err: r.err };
      p = r.v.p;
      if (pctKind) {
        var d = r.v.d, save1 = p * d / 100, pay = p - save1;
        return {
          tiles: [{ lbl: t('lbl_pay'), val: money(pay), main: true }, { lbl: t('lbl_save'), val: money(save1), cls: 'good' }],
          answer: t('ans_disc', { p: money(p), d: X(d), f: money(pay), s: money(save1) }),
          steps: [
            st(t('s_ds1', { d: X(d) }), [ln(F(X(d), '100') + ' × ' + X(p) + ' = ' + B(X(save1)))]),
            st(t('s_ds2'), [ln(X(p) + ' − ' + X(save1) + ' = ' + B(X(pay)))]),
            st(t('s_ds3', { d: X(d), k: X(100 - d) }), [ln(X(p) + ' × ' + F(X(100 - d), '100') + ' = ' + B(X(pay)) + OK)])
          ]
        };
      }
      var s = r.v.s;
      if (s > p) return { tiles: [{ lbl: t('lbl_disc'), val: '0%', main: true }], answer: t('sale_more'), steps: [] };
      var save2 = p - s, dp = save2 / p * 100;
      return {
        tiles: [{ lbl: t('lbl_disc'), val: AP(dp), main: true }, { lbl: t('lbl_save'), val: money(save2), cls: 'good' }],
        answer: t('ans_sale', { s: money(save2), p: money(p), d: AP(dp) }),
        steps: [
          st(t('s_sale1'), [ln(X(p) + ' − ' + X(s) + ' = ' + B(X(save2)))]),
          st(t('s_sale2'), [ln(F(X(save2), X(p)) + ' × 100 = ' + B(X(dp) + '%') + apx(dp, '%'))])
        ]
      };
    }
    if (m === 'stack') {
      r = need([{ id: 'ss-p', k: 'shop.stack.p', lbl: 'st_price', n: 'p', gt0: true },
        { id: 'ss-1', k: 'shop.stack.d1', lbl: 'st_d1', n: 'd1', min: 0, max: 100 }, { id: 'ss-2', k: 'shop.stack.d2', lbl: 'st_d2', n: 'd2', min: 0, max: 100 },
        { id: 'ss-3', k: 'shop.stack.d3', lbl: 'st_d3', n: 'd3', min: 0, max: 100, opt: true }]);
      if (r.err) return { err: r.err };
      p = r.v.p;
      var ds = [r.v.d1, r.v.d2].concat(r.v.d3 === null ? [] : [r.v.d3]), cur = p, mult = 1, steps = [];
      ds.forEach(function (dd, i) {
        var nx = cur * (100 - dd) / 100;
        steps.push(st(t('s_st_n', { n: i + 1, d: X(dd), k: X(100 - dd) }), [ln(X(cur) + ' × ' + F(X(100 - dd), '100') + ' = ' + B(X(nx)))]));
        cur = nx; mult *= (100 - dd) / 100;
      });
      var sv = p - cur, real = clean(sv / p * 100), list = ds.map(function (dd) { return X(dd) + '%'; }).join(' + '), tot = clean(sum(ds, function (dd) { return dd; }));
      steps.push(st(t('s_st_save'), [ln(X(p) + ' − ' + X(cur) + ' = ' + B(X(sv)))]));
      steps.push(st(t('s_st_real'), [ln(F(X(sv), X(p)) + ' × 100 = ' + B(X(real) + '%') + apx(real, '%'))]));
      steps.push(st(t('s_st_quick', { k: AP(mult * 100) }), [ln(ds.map(function (dd) { return X((100 - dd) / 100); }).join(' × ') + ' = ' + X(mult)), ln('100% − ' + X(mult * 100) + '% = ' + B(X(real) + '%') + OK)]));
      var positive = ds.filter(function (dd) { return dd > 0; }).length;
      return {
        tiles: [{ lbl: t('lbl_real'), val: AP(real), main: true }, { lbl: t('lbl_final'), val: money(cur) }, { lbl: t('lbl_save'), val: money(sv), cls: 'good' }],
        answer: t('ans_stack', { list: list, p: money(p), real: AP(real), f: money(cur) }),
        steps: steps,
        notes: positive >= 2 && Math.abs(tot - real) > 1e-9 ? [{ text: t('stack_note', { list: list, sum: X(tot) + '%', real: AP(real) }), cls: 'warning' }] : []
      };
    }
    if (m === 'bogo') {
      r = need([{ id: 'sb-b', k: 'shop.bogo.b', lbl: 'bg_buy', n: 'b', int: true, min: 1, max: 1000 }, { id: 'sb-g', k: 'shop.bogo.g', lbl: 'bg_get', n: 'g', int: true, min: 1, max: 1000 },
        { id: 'sb-o', k: 'shop.bogo.o', lbl: 'bg_off', n: 'o', gt0: true, max: 100 }, { id: 'sb-p', k: 'shop.bogo.p', lbl: 'bg_price', n: 'p', opt: true, gt0: true }]);
      if (r.err) return { err: r.err };
      var bb = r.v.b, g = r.v.g, o = r.v.o, n = bb + g, free = clean(g * o / 100), payN = clean(n - free), eff = free / n * 100;
      var bs = [st(t('s_bg1', { b: X(bb), g: X(g) }), [ln(X(bb) + ' + ' + X(g) + ' = ' + B(X(n)))])];
      if (o === 100) bs.push(st(t('s_bg2_free', { b: X(bb), g: X(g) }), [ln(X(n) + ' − ' + X(g) + ' = ' + B(X(bb)))]));
      else bs.push(st(t('s_bg2_off', { g: X(g), o: X(o), f: X(free) }), [ln(X(g) + ' × ' + F(X(o), '100') + ' = ' + B(X(free))), ln(X(n) + ' − ' + X(free) + ' = ' + B(X(payN)))]));
      bs.push(st(t('s_bg3'), [ln(F(X(free), X(n)) + ' × 100 = ' + B(X(eff) + '%') + apx(eff, '%'))]));
      var tl = [{ lbl: t('lbl_eff'), val: AP(eff), main: true }];
      if (r.v.p !== null) {
        p = r.v.p;
        var total = n * p, pay2 = payN * p, per = pay2 / n;
        bs.push(st(t('s_bg4', { p: money(p) }), [ln(X(n) + ' × ' + X(p) + ' = ' + X(total)), ln(X(payN) + ' × ' + X(p) + ' = ' + B(X(pay2))), ln(F(X(pay2), X(n)) + ' = ' + B(X(per)) + apx(per))]));
        tl.push({ lbl: t('lbl_pay'), val: money(pay2) }, { lbl: t('lbl_per_item'), val: money(per), cls: 'good' });
      }
      return {
        tiles: tl,
        answer: o === 100 ? t('ans_bogo_free', { b: X(bb), g: X(g), d: AP(eff), n: X(n) }) : t('ans_bogo_off', { b: X(bb), g: X(g), o: X(o), d: AP(eff), n: X(n) }),
        steps: bs,
        notes: [{ text: t('bogo_note', { n: X(n) }) }]
      };
    }
    return calcUnit();
  }
  function calcUnit() {
    var used = [], err = null;
    S.shop.unit.packs.forEach(function (pk, i) {
      var pr = parse(pk.p), q = parse(pk.q), name = t('pack_n', { n: 'ABC'.charAt(i) }), e = null, badF = null;
      if (pr.e === 'empty' && q.e === 'empty') { setBad('su-p-' + i, false); setBad('su-q-' + i, false); return; }
      if (pr.e) { badF = 'p'; e = t(pr.e === 'empty' ? 'err_empty' : pr.e === 'big' ? 'err_big' : 'err_nan', { f: t('un_price') }); }
      else if (pr.v < 0) { badF = 'p'; e = t('err_min', { f: t('un_price'), n: '0' }); }
      else if (q.e) { badF = 'q'; e = t(q.e === 'empty' ? 'err_empty' : q.e === 'big' ? 'err_big' : 'err_nan', { f: t('un_qty') }); }
      else if (!(q.v > 0)) { badF = 'q'; e = t('err_gt0', { f: t('un_qty') }); }
      setBad('su-p-' + i, badF === 'p'); setBad('su-q-' + i, badF === 'q');
      if (e) { if (!err) err = t('row_err', { row: name, msg: e }); return; }
      var U = UNIT[pk.u], base = q.v * U.f;
      used.push({ i: i, name: name, p: pr.v, q: q.v, u: pk.u, base: base, dim: U.dim, bu: U.base, per: pr.v / base });
    });
    if (err) return { err: err };
    if (used.length < 2) return { err: t('un_few') };
    if (used.some(function (o) { return o.dim !== used[0].dim; })) return { err: t('un_mixed') };
    var bu = used[0].bu, perTxt = t('per_' + bu), uTxt = t('u_' + bu), best = used[0], worst = used[0];
    used.forEach(function (o) { if (o.per < best.per - 1e-12) best = o; if (o.per > worst.per + 1e-12) worst = o; });
    var steps = used.map(function (o) {
      var txt = o.u === bu ? t('s_un_base', { name: o.name, per: perTxt, q: X(o.base) }) : t('s_un', { name: o.name, q: X(o.q) + ' ' + t('u_' + o.u), bq: X(o.base), u: uTxt, per: perTxt });
      return st(txt, [ln(X(o.p) + ' ÷ ' + X(o.base) + ' = ' + B(X(o.per)) + apx(o.per))]);
    });
    var same = Math.abs(worst.per - best.per) < 1e-9, notes = [];
    steps.push(st(same ? t('un_same', { per: perTxt }) : t('s_un_best', { per: perTxt, name: best.name })));
    var tiles = [{ lbl: t('lbl_best', { name: best.name, per: perTxt }), val: money(best.per), main: true }];
    if (!same) tiles.push({ lbl: t('lbl_cheaper', { name: worst.name }), val: AP((worst.per - best.per) / worst.per * 100), cls: 'good' });
    var tbl = '<div class="scroll-x pc-table"><table class="table"><thead><tr><th>' + esc(t('col_pack')) + '</th><th>' + esc(t('un_price')) + '</th><th>' + esc(t('un_qty')) +
      '</th><th>' + esc(t('col_per', { per: perTxt })) + '</th><th>' + esc(t('col_vs')) + '</th></tr></thead><tbody>' +
      used.map(function (o) {
        var isBest = !same && o === best, diff = (o.per - best.per) / best.per * 100;
        return '<tr' + (isBest ? ' class="best"' : '') + '><td>' + esc(o.name) + '</td><td>' + esc(money(o.p)) + '</td><td>' + esc(X(o.q) + ' ' + t('u_' + o.u)) + '</td><td>' +
          esc(money(o.per)) + '</td><td>' + esc(isBest || same ? t('best_tag') : '+' + AP(diff)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    return { tiles: tiles, answer: same ? t('un_same', { per: perTxt }) : t('ans_unit', { name: best.name, p: money(best.per), per: perTxt }), steps: steps, notes: notes, extra: tbl };
  }

  /* ================================================================ 5. profit & loss */
  function calcPl() {
    var pl = S.pl, m = pl.mode, r;
    if (m === 'pl') {
      r = need([{ id: 'pl-cp', k: 'pl.pl.cp', lbl: 'pl_cp', n: 'cp', gt0: true }, { id: 'pl-sp', k: 'pl.pl.sp', lbl: 'pl_sp', n: 'sp', min: 0 }]);
      if (r.err) return { err: r.err };
      var cp = r.v.cp, sp = r.v.sp, d = clean(sp - cp), pc = Math.abs(d) / cp * 100;
      if (d === 0) return { tiles: [{ lbl: t('lbl_profit_pct'), val: '0%', main: true }], answer: t('ans_pl_0'), steps: [st(t('s_pl1_0'), [ln(X(sp) + ' − ' + X(cp) + ' = ' + B('0'))])] };
      if (d > 0) {
        var mg = d / sp * 100;
        return {
          tiles: [{ lbl: t('lbl_profit_pct'), val: AP(pc), main: true, cls: 'good' }, { lbl: t('lbl_profit'), val: money(d) }, { lbl: t('lbl_margin'), val: AP(mg) }],
          answer: t('ans_pl_p', { a: money(d), p: AP(pc), m: AP(mg) }),
          steps: [
            st(t('s_pl1_p'), [ln(X(sp) + ' − ' + X(cp) + ' = ' + B(X(d)))]),
            st(t('s_pl2_p'), [ln(F(X(d), X(cp)) + ' × 100 = ' + B(X(pc) + '%') + apx(pc, '%'))]),
            st(t('s_pl3'), [ln(F(X(d), X(sp)) + ' × 100 = ' + B(X(mg) + '%') + apx(mg, '%'))])
          ]
        };
      }
      return {
        tiles: [{ lbl: t('lbl_loss_pct'), val: AP(pc), main: true, cls: 'bad' }, { lbl: t('lbl_loss'), val: money(-d) }],
        answer: t('ans_pl_l', { a: money(-d), p: AP(pc) }),
        steps: [
          st(t('s_pl1_l'), [ln(X(cp) + ' − ' + X(sp) + ' = ' + B(X(-d)))]),
          st(t('s_pl2_l'), [ln(F(X(-d), X(cp)) + ' × 100 = ' + B(X(pc) + '%') + apx(pc, '%'))])
        ]
      };
    }
    if (m === 'target') {
      var margin = pl.target.kind === 'margin';
      r = need([{ id: 'pt-cp', k: 'pl.target.cp', lbl: 'pl_cp', n: 'cp', gt0: true }, { id: 'pt-p', k: 'pl.target.p', lbl: 'tg_pct', n: 'p', min: 0, max: margin ? 100 : undefined, lt: margin }]);
      if (r.err) return { err: r.err };
      var c2 = r.v.cp, p = r.v.p, sp2, prof;
      if (!margin) {
        prof = c2 * p / 100; sp2 = c2 + prof;
        var mg2 = sp2 > 0 ? prof / sp2 * 100 : 0;
        return {
          tiles: [{ lbl: t('lbl_sp'), val: money(sp2), main: true }, { lbl: t('lbl_profit'), val: money(prof) }, { lbl: t('lbl_margin'), val: AP(mg2) }],
          answer: t('ans_tg_mu', { sp: money(sp2), p: X(p) + '%', a: money(prof) }),
          steps: [
            st(t('s_tg_mu1', { p: X(p) }), [ln(F(X(p), '100') + ' × ' + X(c2) + ' = ' + B(X(prof)))]),
            st(t('s_tg_mu2'), [ln(X(c2) + ' + ' + X(prof) + ' = ' + B(X(sp2)))]),
            st(t('s_tg_also_mg', { m: AP(mg2) }), [ln(F(X(prof), X(sp2)) + ' × 100 = ' + B(X(mg2) + '%') + apx(mg2, '%'))])
          ]
        };
      }
      var k = 100 - p;
      sp2 = c2 * 100 / k; prof = sp2 - c2;
      var mu = prof / c2 * 100;
      return {
        tiles: [{ lbl: t('lbl_sp'), val: money(sp2), main: true }, { lbl: t('lbl_profit'), val: money(prof) }, { lbl: t('lbl_markup'), val: AP(mu) }],
        answer: t('ans_tg_mg', { sp: money(sp2), p: X(p) + '%', a: money(prof) }),
        steps: [
          st(t('s_tg_mg1', { p: X(p), k: X(k) }), [ln('100% − ' + X(p) + '% = ' + B(X(k) + '%'))]),
          st(t('s_tg_mg2', { k: X(k) }), [ln(X(c2) + ' × ' + F('100', X(k)) + ' = ' + B(X(sp2)) + apx(sp2))]),
          st(t('s_check'), [ln(X(sp2) + ' − ' + X(c2) + ' = ' + X(prof)), ln(F(X(prof), X(sp2)) + ' × 100 = ' + X(p) + '%' + OK)]),
          st(t('s_tg_also_mu', { m: AP(mu) }), [ln(F(X(prof), X(c2)) + ' × 100 = ' + B(X(mu) + '%') + apx(mu, '%'))])
        ]
      };
    }
    var loss = pl.cp.kind === 'loss';
    r = need([{ id: 'pc-sp', k: 'pl.cp.sp', lbl: 'pl_sp', n: 'sp', min: 0 }, { id: 'pc-p', k: 'pl.cp.p', lbl: 'cp_pct', n: 'p', min: 0, max: loss ? 100 : undefined, lt: loss }]);
    if (r.err) return { err: r.err };
    var s3 = r.v.sp, p3 = r.v.p, k3 = loss ? 100 - p3 : 100 + p3, c3 = s3 * 100 / k3, df = Math.abs(s3 - c3);
    return {
      tiles: [{ lbl: t('lbl_cp'), val: money(c3), main: true }, { lbl: t(loss ? 'lbl_loss' : 'lbl_profit'), val: money(df) }],
      answer: t('ans_cp', { cp: money(c3) }),
      steps: [
        st(t(loss ? 's_cp1_l' : 's_cp1_p', { p: X(p3), k: X(k3) }), [ln('100% ' + (loss ? '−' : '+') + ' ' + X(p3) + '% = ' + B(X(k3) + '%'))]),
        st(t('s_cp2', { k: X(k3) }), [ln('x × ' + F(X(k3), '100') + ' = ' + X(s3)), ln('x = ' + X(s3) + ' × ' + F('100', X(k3)) + ' = ' + B(X(c3)) + apx(c3))]),
        st(t('s_check'), [ln(X(c3) + (loss ? ' − ' : ' + ') + F(X(p3), '100') + ' × ' + X(c3) + ' = ' + X(c3) + (loss ? ' − ' : ' + ') + X(df) + ' = ' + X(s3) + OK)])
      ]
    };
  }

  /* ================================================================ 6. attendance */
  function calcAtt() {
    var r = need([{ id: 'at-a', k: 'att.a', lbl: 'at_a', n: 'a', int: true, min: 0, max: 100000 }, { id: 'at-h', k: 'att.h', lbl: 'at_h', n: 'h', int: true, gt0: true, max: 100000 },
      { id: 'at-t', k: 'att.t', lbl: 'at_t', n: 't', gt0: true, max: 100, lt: true }, { id: 'at-l', k: 'att.l', lbl: 'at_left', n: 'l', opt: true, int: true, min: 0, max: 100000 }]);
    if (r.err) return { err: r.err };
    var a = r.v.a, h = r.v.h, T = r.v.t, L = r.v.l;
    if (a > h) { setBad('at-a', true); return { err: t('err_att_over') }; }
    var cur = a / h * 100, f = dec10(T), tn = f.n, td = f.d, TT = X(T) + '%';
    var below = 100 * td * a < tn * h;
    var curTxt = below && Number(N(cur)) >= T ? N(cur, 4) + '%' : AP(cur);
    var steps = [st(t('s_at1'), [ln(F(X(a), X(h)) + ' × 100 = ' + B(X(cur) + '%') + apx(cur, '%'))])], tiles = [{ lbl: t('lbl_att'), val: curTxt, main: true, id: 'att-pct' }], answer;
    if (below) {
      var num = tn * h - 100 * td * a, den = 100 * td - tn, n = Math.ceil(num / den), exact = num / den;
      steps.push(st(t('s_at2_need', { a: X(a), h: X(h), t: X(T) }), [ln(F(X(a) + ' + n', X(h) + ' + n') + ' ≥ ' + F(X(T), '100'))]));
      steps.push(st(t('s_at3'), [ln('100 × (' + X(a) + ' + n) ≥ ' + X(T) + ' × (' + X(h) + ' + n)'), ln(X(100 * a) + ' + 100n ≥ ' + X(T * h) + ' + ' + X(T) + 'n'),
        ln(X(100 - T) + 'n ≥ ' + X(T * h - 100 * a)), ln('n ≥ ' + F(X(T * h - 100 * a), X(100 - T)) + ' = ' + X(exact))]));
      if (Math.abs(exact - n) > 1e-9) steps.push(st(t('s_at_up', { n: X(n) })));
      var chk = [ln(F(X(a) + ' + ' + X(n), X(h) + ' + ' + X(n)) + ' = ' + F(X(a + n), X(h + n)) + ' = ' + X((a + n) / (h + n) * 100) + '%' + OK)];
      if (n > 0) chk.push(ln(F(X(a + n - 1), X(h + n - 1)) + ' = ' + X((a + n - 1) / (h + n - 1) * 100) + '%' + NO));
      steps.push(st(t('s_check'), chk));
      tiles.push({ lbl: t('lbl_need_row'), val: X(n), id: 'att-need', cls: 'bad' });
      answer = t('ans_need', { n: X(n), t: TT });
    } else {
      var num2 = 100 * td * a - tn * h, k = Math.floor(num2 / tn), exact2 = num2 / tn;
      steps.push(st(t('s_at2_miss', { a: X(a), h: X(h), t: X(T) }), [ln(F(X(a), X(h) + ' + n') + ' ≥ ' + F(X(T), '100'))]));
      steps.push(st(t('s_at3'), [ln('100 × ' + X(a) + ' ≥ ' + X(T) + ' × (' + X(h) + ' + n)'), ln(X(100 * a) + ' ≥ ' + X(T * h) + ' + ' + X(T) + 'n'),
        ln(X(100 * a - T * h) + ' ≥ ' + X(T) + 'n'), ln('n ≤ ' + F(X(100 * a - T * h), X(T)) + ' = ' + X(exact2))]));
      if (Math.abs(exact2 - k) > 1e-9) steps.push(st(t('s_at_down', { n: X(k) })));
      var chk2 = [ln(F(X(a), X(h + k)) + ' = ' + X(a / (h + k) * 100) + '%' + OK), ln(F(X(a), X(h + k + 1)) + ' = ' + X(a / (h + k + 1) * 100) + '%' + NO)];
      steps.push(st(t('s_check'), chk2));
      tiles.push({ lbl: t('lbl_can_miss'), val: X(k), id: 'att-miss', cls: 'good' });
      answer = k > 0 ? t('ans_miss', { n: X(k), t: TT }) : t(num2 === 0 ? 'ans_exact' : 'ans_edge', { t: TT });
    }
    var extra = '';
    if (L !== null) {
      var tot = h + L, needTot = Math.ceil(tn * tot / (100 * td)), mm = Math.max(0, needTot - a), msg, cls, et = [];
      var es = [st(t('s_end1', { h: X(h), l: X(L), t: X(T) }), [ln(X(h) + ' + ' + X(L) + ' = ' + X(tot)), ln(F(X(T), '100') + ' × ' + X(tot) + ' = ' + X(T * tot / 100) + (Math.abs(T * tot / 100 - needTot) > 1e-9 ? ' → ' + B(X(needTot)) : ''))]),
        st(t('s_end2'), [ln(X(needTot) + ' − ' + X(a) + ' = ' + B(X(needTot - a)))])];
      if (mm > L) { msg = t('end_all', { l: X(L), p: AP((a + L) / tot * 100) }); cls = 'danger'; }
      else if (mm === 0) { msg = t('end_free', { l: X(L), p: AP(a / tot * 100) }); cls = 'success'; }
      else {
        msg = t('end_must', { l: X(L), m: X(mm), k: X(L - mm) }); cls = '';
        et = [{ lbl: t('lbl_must'), val: X(mm) + ' / ' + X(L), id: 'att-must' }, { lbl: t('lbl_can_miss'), val: X(L - mm), cls: 'good' }];
      }
      LAST_EXTRA.att = t('end_title') + ': ' + plain(msg);
      extra = section(t('end_title'), et, msg, cls, es);
    }
    return { tiles: tiles, answer: answer, steps: steps, extra: extra };
  }

  /* ================================================================ render */
  var CALC = { basic: calcBasic, marks: calcMarks, cgpa: calcCgpa, shop: calcShop, pl: calcPl, att: calcAtt };
  function renderTab(tab) {
    LAST_EXTRA[tab] = '';
    var o;
    try { o = CALC[tab](); } catch (e) { console.error(e); o = { err: t('err_generic') }; }
    show(tab, o);
  }
  function paintFormula() {
    var v = {};
    ['a', 'm', 'b'].forEach(function (k) { var p = parse(S.cgpa[k]); v[k] = p.e ? null : p.v; });
    var f = $('#cu-formula');
    if (f) f.innerHTML = formulaHtml(v);
  }
  function same(a, b) { var x = parse(a), y = parse(b); return !x.e && !y.e && x.v === y.v; }
  function paintChips() {
    $$('[data-set]').forEach(function (c) { c.setAttribute('aria-pressed', same(getP(c.dataset.set), c.dataset.val) ? 'true' : 'false'); });
    $$('[data-offer]').forEach(function (c) {
      var p = c.dataset.offer.split(','), b = S.shop.bogo;
      c.setAttribute('aria-pressed', same(b.b, p[0]) && same(b.g, p[1]) && same(b.o, p[2]) ? 'true' : 'false');
    });
  }
  function render() { paintFormula(); paintChips(); TABS.forEach(renderTab); }

  /* ================================================================ tabs */
  function showTab(id) {
    if (TABS.indexOf(id) < 0) id = 'basic';
    S.tab = id;
    TABS.forEach(function (k) {
      var b = $('#tab-' + k), p = $('#p-' + k), on = k === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      p.hidden = !on;
    });
  }
  $$('#tabs button').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); save(); });
    b.addEventListener('keydown', function (e) {
      var i = TABS.indexOf(b.dataset.tab), j = -1, n = TABS.length, back = rtl() ? 'ArrowRight' : 'ArrowLeft', fwd = rtl() ? 'ArrowLeft' : 'ArrowRight';
      if (e.key === fwd) j = (i + 1) % n; else if (e.key === back) j = (i + n - 1) % n;
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = n - 1;
      if (j >= 0) { e.preventDefault(); showTab(TABS[j]); save(); $('#tab-' + TABS[j]).focus(); }
    });
  });

  /* ================================================================ segmented buttons, inputs, chips */
  function paintSegs() {
    $$('[data-seg]').forEach(function (g) {
      var v = String(getP(g.dataset.seg));
      $$('button[data-v]', g).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'); });
    });
  }
  function updateShow() {
    $$('[data-show]').forEach(function (n) {
      var m = n.dataset.show.split('='), vals = m[1].split('|');
      n.hidden = vals.indexOf(String(getP(m[0]))) < 0;
    });
  }
  function syncInputs() {
    $$('[data-k]').forEach(function (inp) {
      var v = getP(inp.dataset.k);
      if (inp.type === 'checkbox') inp.checked = !!v; else inp.value = v == null ? '' : v;
    });
  }
  $$('[data-seg]').forEach(function (g) {
    $$('button[data-v]', g).forEach(function (b) {
      b.addEventListener('click', function () { setP(g.dataset.seg, b.dataset.v); save(); paintSegs(); updateShow(); render(); });
    });
  });
  $$('[data-k]').forEach(function (inp) {
    var box = inp.type === 'checkbox';
    if (!box) inp.maxLength = 40;
    inp.addEventListener(box ? 'change' : 'input', function () {
      setP(inp.dataset.k, box ? inp.checked : inp.value);
      save();
      if (box) updateShow();
      render();
    });
  });
  $$('[data-set]').forEach(function (c) {
    c.addEventListener('click', function () { setP(c.dataset.set, c.dataset.val); save(); syncInputs(); render(); });
  });
  $$('[data-offer]').forEach(function (c) {
    c.addEventListener('click', function () {
      var p = c.dataset.offer.split(',');
      S.shop.bogo.b = p[0]; S.shop.bogo.g = p[1]; S.shop.bogo.o = p[2];
      save(); syncInputs(); render();
    });
  });
  $('#mk-add').addEventListener('click', function () { addRow('marks'); });
  $('#sg-add').addEventListener('click', function () { addRow('sg'); });
  $('#sm-add').addEventListener('click', function () { addRow('sem'); });

  /* ================================================================ packs for the price-per-kg comparison */
  function buildPacks() {
    var box = $('#su-packs');
    box.textContent = '';
    S.shop.unit.packs.forEach(function (pk, i) {
      function num(f, id) {
        var inp = el('input', { type: 'text', id: id, inputmode: 'decimal', autocomplete: 'off', maxlength: '40' });
        inp.value = pk[f] || '';
        inp.addEventListener('input', function () { pk[f] = inp.value; save(); render(); });
        return inp;
      }
      var sel = el('select', { id: 'su-u-' + i });
      UNITS.forEach(function (u) { sel.appendChild(el('option', { value: u, text: t('u_' + u) })); });
      sel.value = pk.u;
      sel.addEventListener('change', function () { pk.u = sel.value; save(); render(); });
      box.appendChild(el('div', { class: 'pc-pack' },
        el('h3', { text: t('pack_n', { n: 'ABC'.charAt(i) }) }),
        el('div', { class: 'pc-qu' },
          el('div', { class: 'field' }, el('label', { for: 'su-p-' + i, text: t('un_price') }),
            el('div', { class: 'pc-in' }, el('span', { class: 'pc-pre', 'aria-hidden': 'true', text: '₹' }), num('p', 'su-p-' + i))),
          el('div', { class: 'field' }, el('label', { for: 'su-q-' + i, text: t('un_qty') }), el('div', { class: 'pc-in' }, num('q', 'su-q-' + i))),
          el('div', { class: 'field' }, el('label', { for: 'su-u-' + i, text: t('un_unit') }), sel))));
    });
  }
  function buildAll() { buildRows('marks'); buildRows('sg'); buildRows('sem'); buildPacks(); }

  /* ================================================================ reset */
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    var tab = S.tab;
    S = defaults();
    S.tab = tab;
    flush();
    syncInputs(); paintSegs(); updateShow(); buildAll(); showTab(S.tab); render();
    EDU.toast(t('reset_done'));
  });

  /* ================================================================ start */
  load();
  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });
  syncInputs(); paintSegs(); updateShow(); buildAll(); showTab(S.tab); render();
  EDU.onLang(function () { buildAll(); render(); });
})();
