/* Gold & Silver Jewellery Price Calculator: UI. The maths lives in engine.js (window.GOLD_ENGINE).
   The app never fetches rates: the user types today's rate and it is remembered on this device with its date. */
(function () {
  'use strict';
  var SLUG = 'gold-jewellery-calculator';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var E = window.GOLD_ENGINE;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var RULES_CHECKED = '2026-10';
  var METALS = ['gold', 'silver'];
  var UNITS = { gold: ['g10', 'g'], silver: ['kg', 'g10', 'g'] };
  var MK_MODES = ['pct', 'gram', 'flat'];
  var MAX_RECENT = 10;

  /* ---------------- saved state can be old, half-written or edited by hand: read it defensively */
  function str(v, d) { return typeof v === 'string' ? v : typeof v === 'number' && isFinite(v) ? String(v) : (d === undefined ? '' : d); }
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : null; }
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function isoDay(d) { var z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }

  function defaultRates() {
    return { gold: { rate: '72,000', unit: 'g10', date: '' }, silver: { rate: '95,000', unit: 'kg', date: '' } };
  }
  function cleanRates(r) {
    var d = defaultRates(); r = obj(r) || {};
    METALS.forEach(function (m) {
      var x = obj(r[m]) || {};
      d[m] = { rate: str(x.rate, d[m].rate), unit: oneOf(x.unit, UNITS[m], d[m].unit), date: /^\d{4}-\d\d-\d\d$/.test(str(x.date)) ? x.date : '' };
    });
    return d;
  }
  function defaultState() {
    return { metal: 'gold', purity: { gold: '22k', silver: '925' }, custom: { gold: '', silver: '' }, weight: '10', tola: '',
      mkMode: 'pct', mk: '12', wastage: '0', stones: '0', gst: '3', mkSep: false, mkGst: '5', hallmarkOn: false, hallmark: '53',
      quote: '', ogWeight: '8', ogPurity: { gold: '22k', silver: '925' }, ogCustom: { gold: '', silver: '' }, ogDed: '5', rsDed: '3' };
  }
  function purityIds(metal) { return E.PURITY[metal].map(function (p) { return p.id; }).concat(['custom']); }
  function cleanPair(v, d, metalLists) {
    v = obj(v) || {};
    return { gold: metalLists ? oneOf(v.gold, purityIds('gold'), d.gold) : str(v.gold), silver: metalLists ? oneOf(v.silver, purityIds('silver'), d.silver) : str(v.silver) };
  }
  function cleanState(s) {
    var d = defaultState(); s = obj(s) || {};
    return { metal: oneOf(s.metal, METALS, 'gold'), purity: cleanPair(s.purity, d.purity, true), custom: cleanPair(s.custom, d.custom, false),
      weight: str(s.weight, d.weight), tola: str(s.tola), mkMode: oneOf(s.mkMode, MK_MODES, 'pct'), mk: str(s.mk, d.mk), wastage: str(s.wastage, '0'),
      stones: str(s.stones, '0'), gst: str(s.gst, '3'), mkSep: s.mkSep === true, mkGst: str(s.mkGst, '5'), hallmarkOn: s.hallmarkOn === true,
      hallmark: str(s.hallmark, '53'), quote: str(s.quote), ogWeight: str(s.ogWeight, '8'), ogPurity: cleanPair(s.ogPurity, d.ogPurity, true),
      ogCustom: cleanPair(s.ogCustom, d.ogCustom, false), ogDed: str(s.ogDed, '5'), rsDed: str(s.rsDed, '3') };
  }
  var rates = cleanRates(store.get('rates', null));
  var S = cleanState(store.get('state', null));
  var recent = store.get('recent', []);
  if (!Array.isArray(recent)) recent = [];
  recent = recent.filter(function (e) { return obj(e) && isFinite(e.total) && METALS.indexOf(e.metal) >= 0 && isFinite(e.ts); }).slice(0, MAX_RECENT);
  function save() { store.set('state', S); store.set('rates', rates); }

  /* ---------------- number helpers */
  var DIGIT_ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function latinDigits(s) {
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < DIGIT_ZEROS.length; i++) if (code >= DIGIT_ZEROS[i] && code <= DIGIT_ZEROS[i] + 9) return String(code - DIGIT_ZEROS[i]);
      return c;
    }).replace(/٫/g, '.').replace(/[٬،]/g, ',');
  }
  /* "₹72,000" → number; null when empty; NaN when not a number; max 12 digits so nothing overflows */
  function parseNum(raw) {
    var s = latinDigits(raw).trim().replace(/₹|\brs\.?/gi, '').replace(/[\s,_]/g, '');
    if (!s) return null;
    if (!/^\d*(\.\d*)?$/.test(s) || s === '.' || s.replace(/\..*$/, '').length > 12) return NaN;
    return parseFloat(s) || 0;
  }
  function money(x) {
    var neg = x < 0; x = Math.abs(x);
    var s = x.toFixed(2), ip = s.slice(0, -3), fp = s.slice(-2);
    if (ip.length > 3) ip = ip.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + ip.slice(-3);
    return (neg ? '−' : '') + '₹' + ip + '.' + fp;
  }
  function n(x, d) { return EDU.fmt(x, { maximumFractionDigits: d === undefined ? 3 : d }); }
  function pct(x) { return isFinite(x) ? String(parseFloat(x.toFixed(2))) : '–'; }
  function m(x) { return el('bdi', { class: 'gj-n', text: money(x), dataset: { amt: x.toFixed(2) } }); }
  function ltr(text) { return el('bdi', { class: 'gj-n', text: text }); }
  function fmtDate(iso) {
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { day: 'numeric', month: 'short', year: 'numeric', numberingSystem: 'latn' }).format(new Date(iso + 'T00:00:00')); }
    catch (e) { return iso; }
  }
  function fmtMonth(ym) {
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { month: 'long', year: 'numeric', numberingSystem: 'latn' }).format(new Date(ym + '-01T00:00:00')); }
    catch (e) { return ym; }
  }

  /* ---------------- purity */
  function purityName(id) { return id === 'custom' ? t('purity_custom') : id.toUpperCase(); }
  function purityPct(metal, id, custom) {
    if (id === 'custom') { var c = parseNum(custom); return c === null || isNaN(c) || c <= 0 || c > 100 ? NaN : c; }
    var p = E.PURITY[metal].filter(function (x) { return x.id === id; })[0];
    return p ? p.pct : NaN;
  }
  function unitLabel(u) { return t('unit_' + u); }
  function metalWord(metal) { return t(metal === 'gold' ? 'metal_gold_l' : 'metal_silver_l'); }

  /* chips for a purity picker; `get`/`set` work on the chosen id and custom text */
  function renderChips(host, metal, sel, custom, onPick, ariaKey) {
    host.innerHTML = '';
    E.PURITY[metal].forEach(function (p) {
      host.appendChild(el('button', { type: 'button', class: 'chip gj-n', dataset: { purity: p.id }, 'aria-pressed': String(sel === p.id), onclick: function () { onPick(p.id, null); } },
        p.id.toUpperCase() + ' ', el('small', { text: '(' + p.pct + '%)' })));
    });
    host.appendChild(el('button', { type: 'button', class: 'chip', dataset: { purity: 'custom' }, 'aria-pressed': String(sel === 'custom'), i18n: 'purity_custom',
      onclick: function () { onPick('custom', null); var i = $('input', host); i.focus(); i.select(); } }));
    var inp = el('input', { type: 'text', inputmode: 'decimal', class: 'gj-n', autocomplete: 'off', placeholder: '91.6', 'aria-label': t(ariaKey) });
    inp.value = custom || '';
    inp.addEventListener('input', function () { onPick('custom', inp.value); });
    host.appendChild(el('span', { class: 'gj-custom', hidden: sel !== 'custom' }, inp, el('span', { 'aria-hidden': 'true', text: '%' })));
  }

  /* ---------------- read the inputs into an engine object */
  function current() {
    var R = rates[S.metal], o = { metal: S.metal, unit: R.unit, errs: {} };
    var rate = parseNum(R.rate);
    if (rate === null) o.errs.rate = 'err_rate'; else if (isNaN(rate) || rate <= 0) o.errs.rate = 'err_number';
    o.rate = rate || 0;
    o.purity = purityPct(S.metal, S.purity[S.metal], S.custom[S.metal]);
    if (isNaN(o.purity)) o.errs.purity = 'err_purity';
    var w = parseNum(S.weight);
    if (w === null || w <= 0) o.errs.weight = 'err_weight'; else if (isNaN(w)) o.errs.weight = 'err_number';
    o.weight = w || 0;
    function f(key, d) { var v = parseNum(S[key]); if (v === null) return d; if (isNaN(v)) { o.errs[key] = 'err_number'; return d; } return v; }
    o.mkMode = S.mkMode; o.mk = f('mk', 0); o.wastage = f('wastage', 0); o.stones = f('stones', 0);
    o.gst = f('gst', 0); o.mkSep = S.mkSep; o.mkGst = f('mkGst', 0); o.hallmarkOn = S.hallmarkOn; o.hallmark = f('hallmark', 0);
    o.ok = !Object.keys(o.errs).length;
    return o;
  }
  var last = null;   // { o, e } of the last good estimate

  /* ---------------- render: inputs */
  function syncInputs() {
    var R = rates[S.metal];
    $$('#metal [data-metal]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.metal === S.metal)); });
    var us = $('#rate-unit'); us.innerHTML = '';
    UNITS[S.metal].forEach(function (u) { us.appendChild(el('option', { value: u, text: unitLabel(u) })); });
    us.value = R.unit;
    setVal('#rate', R.rate);
    var dh = $('#rate-datehint');
    dh.textContent = R.date ? t('rate_saved', { d: fmtDate(R.date) }) : t('rate_sample');
    dh.classList.toggle('sample', !R.date);
    renderChips($('#purity'), S.metal, S.purity[S.metal], S.custom[S.metal], function (id, custom) {
      S.purity[S.metal] = id; if (custom !== null) S.custom[S.metal] = custom; save();
      if (custom === null) syncInputs(); renderAll();
    }, 'purity_custom_aria');
    setVal('#weight', S.weight);
    setVal('#tola', S.tola);
    $$('#mk-mode [data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === S.mkMode)); });
    $('#mk-unit').textContent = S.mkMode === 'pct' ? '%' : S.mkMode === 'gram' ? '₹/g' : '₹';
    setVal('#mk', S.mk); setVal('#wastage', S.wastage); setVal('#stones', S.stones); setVal('#gst', S.gst);
    $('#mk-sep').checked = S.mkSep; $('#mk-gst').hidden = !S.mkSep; $('#mk-gst').nextElementSibling.hidden = !S.mkSep;
    setVal('#mk-gst', S.mkGst);
    $('#hallmark-on').checked = S.hallmarkOn; setVal('#hallmark', S.hallmark);
    $('#hallmark').hidden = !S.hallmarkOn; $('#hallmark').previousElementSibling.hidden = !S.hallmarkOn;
    setVal('#quote', S.quote); setVal('#og-weight', S.ogWeight); setVal('#og-ded', S.ogDed); setVal('#rs-ded', S.rsDed);
    renderChips($('#og-purity'), S.metal, S.ogPurity[S.metal], S.ogCustom[S.metal], function (id, custom) {
      S.ogPurity[S.metal] = id; if (custom !== null) S.ogCustom[S.metal] = custom; save();
      if (custom === null) syncInputs(); renderAll();
    }, 'purity_custom_aria');
  }
  function setVal(sel, v) { var i = $(sel); if (document.activeElement !== i && i.value !== v) i.value = v; }

  /* ---------------- render: estimate */
  function row(id, label, amount, cls) {
    return el('tr', { id: id, class: cls || '' }, el('th', { scope: 'row', text: label }), el('td', { class: 'v' }, m(amount)));
  }
  function lines(o, e) {
    var pName = purityName(S.purity[S.metal]), L = [];
    L.push(['row_rate', t('row_rate', { p: pct(o.purity), u: unitLabel('g') }), e.ratePerGram]);
    L.push(['row_metal', t('row_metal', { w: n(o.weight), k: pName }), e.metal]);
    if (e.wastage) L.push(['row_wastage', t('row_wastage', { p: pct(o.wastage) }), e.wastage]);
    L.push(['row_making', o.mkMode === 'pct' ? t('row_making_pct', { p: pct(o.mk) }) : o.mkMode === 'gram' ? t('row_making_gram', { a: money(o.mk) }) : t('row_making'), e.making]);
    if (e.stones) L.push(['row_stones', t('row_stones'), e.stones]);
    L.push(['row_subtotal', t('row_subtotal'), e.subtotal, 'sub']);
    L.push(['row_gst', o.mkSep ? t('row_gst_sep', { a: pct(o.gst), b: pct(o.mkGst) }) : t('row_gst', { p: pct(o.gst) }), e.gst]);
    if (o.hallmarkOn) L.push(['row_hallmark', t('row_hallmark'), e.hallmark]);
    L.push(['row_total', t('row_total'), e.total, 'sum']);
    return L;
  }
  function renderEstimate() {
    var o = current(), box = $('#result');
    $('#rate-err').textContent = o.errs.rate ? t(o.errs.rate) : o.errs.weight ? t(o.errs.weight) : o.errs.purity ? t(o.errs.purity) : '';
    $('#rate').setAttribute('aria-invalid', String(!!o.errs.rate));
    box.innerHTML = '';
    var disable = !o.ok;
    ['#save-est', '#copy', '#print'].forEach(function (s) { $(s).disabled = disable; });
    $('#wa').classList.toggle('disabled', disable); $('#wa').setAttribute('aria-disabled', String(disable));
    if (!o.ok) {
      last = null;
      var k = o.errs.rate || o.errs.weight || o.errs.purity || 'err_number';
      box.appendChild(el('p', { class: 'muted', id: 'res-empty', text: t(k) }));
      $('#wa').href = '#';
      return;
    }
    var e = E.estimate(o);
    last = { o: o, e: e };
    box.appendChild(el('p', { class: 'muted small mb0', text: t('est_for', { m: metalWord(o.metal), k: purityName(S.purity[S.metal]), w: n(o.weight) }) }));
    box.appendChild(el('div', { class: 'gj-big', id: 'big-total' }, m(e.total)));
    box.appendChild(el('table', { class: 'table gj-break' }, el('tbody', null, lines(o, e).map(function (l) {
      return l[0] === 'row_rate' ? el('tr', { id: 'r-rate' }, el('th', { scope: 'row', text: l[1] }), el('td', { class: 'v' }, el('bdi', { class: 'gj-n', text: money(l[2]), dataset: { amt: l[2].toFixed(2) } })))
        : row('r-' + l[0].slice(4), l[1], l[2], l[3]);
    }))));
    var words = el('div', { class: 'gj-words' }, el('span', { class: 'lbl', i18n: 'words_label' }),
      el('p', { class: 'no-i18n', id: 'words-en', lang: 'en', dir: 'ltr', text: E.words(e.total, 'en') }));
    if (EDU.lang === 'hi') words.appendChild(el('p', { class: 'no-i18n', id: 'words-hi', lang: 'hi', text: E.words(e.total, 'hi') }));
    box.appendChild(words);
    $('#wa').href = EDU.waLink(shareText());
  }
  function shareText() {
    if (!last) return '';
    var o = last.o, e = last.e, L = [];
    L.push(t('share_head', { m: metalWord(o.metal), k: purityName(S.purity[S.metal]), w: n(o.weight) }));
    L.push(t('rate_label') + ': ' + money(o.rate) + ' ' + unitLabel(o.unit) + (rates[o.metal].date ? ' (' + fmtDate(rates[o.metal].date) + ')' : ''));
    lines(o, e).forEach(function (l) { L.push(l[1] + ': ' + money(l[2])); });
    L.push(E.words(e.total, 'en'));
    L.push(t('estimate_note'));
    L.push(EDU.shareUrl());
    return L.join('\n');
  }
  function printEstimate() {
    if (!last) return;
    var o = last.o, e = last.e, pa = $('#print-area');
    pa.innerHTML = '';
    pa.appendChild(el('h1', { text: t('print_title') }));
    pa.appendChild(el('p', { text: t('est_for', { m: metalWord(o.metal), k: purityName(S.purity[S.metal]), w: n(o.weight) }) + ' · ' + t('print_date') + ': ' + fmtDate(isoDay(new Date())) }));
    pa.appendChild(el('p', { text: t('rate_label') + ': ' + money(o.rate) + ' ' + unitLabel(o.unit) + (rates[o.metal].date ? ' (' + fmtDate(rates[o.metal].date) + ')' : '') }));
    var ls = lines(o, e);
    pa.appendChild(el('table', null, el('tbody', null, ls.map(function (l, i) {
      return el('tr', { class: i === ls.length - 1 ? 'pa-grand' : '' }, el('td', { text: l[1] }), el('td', { class: 'v', text: money(l[2]) }));
    }))));
    pa.appendChild(el('p', { text: t('words_label') + ': ' + E.words(e.total, 'en') }));
    if (EDU.lang === 'hi') pa.appendChild(el('p', { lang: 'hi', text: E.words(e.total, 'hi') }));
    pa.appendChild(el('p', { class: 'pa-small', text: t('estimate_note') + ' · ' + t('brand') + ' · ' + EDU.shareUrl() }));
    window.print();
  }

  /* ---------------- fair-price check */
  function kv(id, items) {
    return el('dl', { class: 'gj-kv', id: id }, items.map(function (k) { return el('div', { class: k[2] || '', id: k[3] || null }, el('dt', { text: k[0] }), el('dd', null, k[1])); }));
  }
  function msg(cls, text, id) { return el('p', { class: 'callout gj-msg ' + cls, text: text, id: id || null }); }
  function renderFair() {
    var out = $('#fp-out'); out.innerHTML = '';
    if (!last) { out.appendChild(el('p', { class: 'muted small gj-msg', text: t('fp_need') })); return; }
    var q = parseNum(S.quote);
    if (q === null) { out.appendChild(el('p', { class: 'muted small gj-msg', text: t('fp_empty') })); return; }
    if (isNaN(q) || q <= 0) { out.appendChild(msg('danger', t('err_number'))); return; }
    var r = E.impliedMaking(last.o, q);
    if (!r) return;
    if (r.making < 0) { out.appendChild(msg('warning', t('fp_neg'), 'fp-neg')); return; }
    out.appendChild(kv('fp-kv', [[t('fp_pct'), el('bdi', { class: 'gj-n', text: pct(r.pct) + ' %', dataset: { pct: r.pct.toFixed(2) } }), 'big', 'fp-pct'],
      [t('fp_making_lbl'), m(r.making), '', 'fp-making'], [t('fp_est_lbl'), m(r.estimate), '', 'fp-est']]));
    var d = r.diff;
    if (Math.abs(d) < 0.005) out.appendChild(msg('success', t('fp_same'), 'fp-diff'));
    else if (d > 0) out.appendChild(msg(r.pct > last.e.makingPct + 5 ? 'warning' : 'accent', t('fp_more', { a: money(d) }), 'fp-diff'));
    else out.appendChild(msg('success', t('fp_less', { a: money(-d) }), 'fp-diff'));
    out.appendChild(el('p', { class: 'muted small gj-msg', text: t('fp_tip') }));
  }

  /* ---------------- old gold */
  function renderOld() {
    var out = $('#og-out'); out.innerHTML = '';
    var R = rates[S.metal], rate = parseNum(R.rate), w = parseNum(S.ogWeight), d = parseNum(S.ogDed);
    var p = purityPct(S.metal, S.ogPurity[S.metal], S.ogCustom[S.metal]);
    if (rate === null || isNaN(rate) || rate <= 0) { out.appendChild(el('p', { class: 'muted small gj-msg', text: t('err_rate') })); return; }
    if (w === null || w <= 0) { out.appendChild(el('p', { class: 'muted small gj-msg', text: t('err_weight') })); return; }
    if (isNaN(w) || isNaN(p) || (d !== null && (isNaN(d) || d < 0 || d > 100))) { out.appendChild(msg('danger', t('err_number'))); return; }
    var r = E.oldGold(rate, R.unit, p, w, d || 0);
    var items = [[t('og_value', { w: n(w), k: purityName(S.ogPurity[S.metal]) }), m(r.value), '', 'og-value'], [t('og_deduction', { p: pct(d || 0) }), m(r.deduction), '', 'og-ded-amt'],
      [t('og_credit'), m(r.credit), 'big', 'og-credit']];
    if (last) {
      var net = E.r2(last.e.total - r.credit);
      items.push([net >= 0 ? t('og_net') : t('og_net_neg'), m(Math.abs(net)), '', 'og-net']);
    }
    out.appendChild(kv('og-kv', items));
  }

  /* ---------------- resale + purity helper */
  function renderResale() {
    var out = $('#rs-out'); out.innerHTML = '';
    var ph = $('#ph-out'); ph.innerHTML = '';
    var d = parseNum(S.rsDed);
    if (!last) { out.appendChild(el('p', { class: 'muted small gj-msg', text: t('fp_need') })); }
    else if (d !== null && (isNaN(d) || d < 0 || d > 100)) out.appendChild(msg('danger', t('err_number')));
    else {
      var r = E.resale(last.e.metal, d || 0);
      out.appendChild(kv('rs-kv', [[t('row_metal', { w: n(last.o.weight), k: purityName(S.purity[S.metal]) }), m(last.e.metal), '', 'rs-metal'],
        [t('og_deduction', { p: pct(d || 0) }), m(r.deduction), '', 'rs-ded-amt'], [t('rs_value'), m(r.value), 'big', 'rs-value']]));
      out.appendChild(el('p', { class: 'muted small gj-msg', text: t('rs_loss', { a: money(E.r2(last.e.total - r.value)) }) }));
    }
    var w = parseNum(S.weight), p = purityPct(S.metal, S.purity[S.metal], S.custom[S.metal]);
    if (w !== null && !isNaN(w) && w > 0 && !isNaN(p)) {
      var g = E.pureGrams(w, p);
      ph.appendChild(el('p', { class: 'mb0', id: 'ph-text' }, t('ph_text', { w: n(w), k: purityName(S.purity[S.metal]), p: pct(p), g: n(g), m: metalWord(S.metal) }),
        ' ', el('bdi', { class: 'gj-n', hidden: true, id: 'ph-pure', dataset: { g: String(g) } })));
    }
    ph.appendChild(el('p', { class: 'muted small', style: { margin: '8px 0 0' }, text: t('ph_table_hint') }));
    ph.appendChild(el('ul', { class: 'gj-pure' }, E.PURITY[S.metal].map(function (x) {
      return el('li', { class: 'gj-n' }, x.id.toUpperCase() + ' → ', el('b', { text: n(E.pureGrams(10, x.pct)) + ' g' }));
    })));
  }

  /* ---------------- recent estimates */
  function saveRecent() {
    if (!last) return;
    var o = last.o, e = last.e;
    var entry = { ts: Date.now(), metal: o.metal, rate: rates[o.metal].rate, unit: o.unit, date: rates[o.metal].date, purity: S.purity[o.metal], custom: S.custom[o.metal],
      weight: S.weight, mkMode: S.mkMode, mk: S.mk, wastage: S.wastage, stones: S.stones, gst: S.gst, mkSep: S.mkSep, mkGst: S.mkGst,
      hallmarkOn: S.hallmarkOn, hallmark: S.hallmark, total: e.total };
    recent.unshift(entry); recent = recent.slice(0, MAX_RECENT);
    store.set('recent', recent);
    renderRecent();
    EDU.toast(t('est_saved'));
  }
  function loadRecent(r) {
    S.metal = oneOf(r.metal, METALS, 'gold');
    rates[S.metal] = cleanRates({ gold: { rate: r.rate, unit: r.unit, date: r.date }, silver: { rate: r.rate, unit: r.unit, date: r.date } })[S.metal];
    S.purity[S.metal] = oneOf(r.purity, purityIds(S.metal), S.purity[S.metal]); S.custom[S.metal] = str(r.custom);
    S.weight = str(r.weight, '0'); S.mkMode = oneOf(r.mkMode, MK_MODES, 'pct'); S.mk = str(r.mk); S.wastage = str(r.wastage); S.stones = str(r.stones);
    S.gst = str(r.gst, '3'); S.mkSep = r.mkSep === true; S.mkGst = str(r.mkGst, '5'); S.hallmarkOn = r.hallmarkOn === true; S.hallmark = str(r.hallmark, '53');
    save(); syncInputs(); renderAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function renderRecent() {
    var list = $('#recent-list'); list.innerHTML = '';
    $('#recent-empty').hidden = recent.length > 0; $('#recent-clear').disabled = !recent.length;
    recent.forEach(function (r, i) {
      var sub = [t(r.metal === 'gold' ? 'metal_gold' : 'metal_silver') + ' ' + purityName(r.purity) + ' · ' + n(E.num(r.weight)) + ' g', money(E.num(r.rate)) + ' ' + unitLabel(r.unit)];
      try { sub.push(new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', numberingSystem: 'latn' }).format(new Date(r.ts))); } catch (e) { }
      list.appendChild(el('li', null, el('button', { type: 'button', class: 'gj-hist-item', title: t('recent_load'), dataset: { i: String(i) }, onclick: function () { loadRecent(r); } },
        el('span', { class: 'gj-hist-main' }, el('span', { text: t('row_total') }), el('span', { class: 'out' }, m(r.total))),
        el('span', { class: 'gj-hist-sub' }, sub.join(' · ')))));
    });
  }

  /* ---------------- events */
  function bind(sel, key, after) {
    $(sel).addEventListener('input', function () { S[key] = this.value; save(); if (after) after(); renderAll(); });
  }
  $$('#metal [data-metal]').forEach(function (b) { b.addEventListener('click', function () { S.metal = b.dataset.metal; save(); syncInputs(); renderAll(); }); });
  $('#rate').addEventListener('input', function () { var R = rates[S.metal]; R.rate = this.value; R.date = isoDay(new Date()); save(); syncInputs(); renderAll(); });
  $('#rate-unit').addEventListener('change', function () { rates[S.metal].unit = this.value; save(); renderAll(); });
  bind('#weight', 'weight', function () { var w = parseNum(S.weight); S.tola = w && !isNaN(w) ? String(E.gramsToTola(w)) : ''; setVal('#tola', S.tola); });
  bind('#tola', 'tola', function () { var x = parseNum(S.tola); S.weight = x && !isNaN(x) ? String(E.tolaToGrams(x)) : ''; setVal('#weight', S.weight); });
  $$('#mk-mode [data-mode]').forEach(function (b) { b.addEventListener('click', function () { S.mkMode = b.dataset.mode; save(); syncInputs(); renderAll(); }); });
  bind('#mk', 'mk'); bind('#wastage', 'wastage'); bind('#stones', 'stones'); bind('#gst', 'gst'); bind('#mk-gst', 'mkGst'); bind('#hallmark', 'hallmark');
  bind('#quote', 'quote'); bind('#og-weight', 'ogWeight'); bind('#og-ded', 'ogDed'); bind('#rs-ded', 'rsDed');
  $('#mk-sep').addEventListener('change', function () { S.mkSep = this.checked; save(); syncInputs(); renderAll(); if (this.checked) $('#mk-gst').focus(); });
  $('#hallmark-on').addEventListener('change', function () { S.hallmarkOn = this.checked; save(); syncInputs(); renderAll(); });
  $('#save-est').addEventListener('click', saveRecent);
  $('#copy').addEventListener('click', function () { if (last) EDU.copy(shareText()); });
  $('#print').addEventListener('click', printEstimate);
  $('#wa').addEventListener('click', function (e) { if (!last) e.preventDefault(); });
  $('#recent-clear').addEventListener('click', function () {
    if (!recent.length || !confirm(t('recent_clear_confirm'))) return;
    recent = []; store.set('recent', recent); renderRecent();
  });
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    S = defaultState(); rates = defaultRates(); recent = [];
    store.remove('state'); store.remove('rates'); store.remove('recent');
    syncInputs(); renderAll(); renderRecent();
  });
  window.addEventListener('afterprint', function () { $('#print-area').innerHTML = ''; });

  function renderAll() { renderEstimate(); renderFair(); renderOld(); renderResale(); }
  function renderLang() {
    $('#rules-checked').textContent = t('rules_checked', { d: fmtMonth(RULES_CHECKED) });
    syncInputs(); renderAll(); renderRecent();
  }
  EDU.onLang(renderLang);
  renderLang();
})();
