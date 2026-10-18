/* Gold & Silver Price Calculator. The maths lives in calc.js (exact BigInt: paise, micrograms).
   Everything runs on this device; rates and settings are saved with EDU.store only. */
(function () {
  'use strict';
  var SLUG = 'gold-silver-calculator';
  var C = window.GS_CALC, store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var RULES_CHECKED = '2026-10-17';
  var METALS = ['gold', 'silver', 'plat'];
  var PUR = { gold: ['999', '995', '916', '750', '585'], silver: ['999', '925'], plat: ['950'] };
  var KARAT = { '999': '24K', '995': '24K', '916': '22K', '750': '18K', '585': '14K' };
  var RU = { gold: ['10g', 'g', 'tola', 'sov'], silver: ['kg', 'g', '10g', 'tola'], plat: ['g', '10g', 'tola', 'sov'] };
  var WU = { gold: ['g', 'tola', 'sov', 'masha', 'ratti'], silver: ['g', 'kg', 'tola'], plat: ['g', 'tola', 'sov'] };
  var SWU = ['g', 'ct'];
  var LRI = '⁦', PDI = '⁩';
  function iso(s) { return LRI + s + PDI; }

  /* ------------------------------------------------------------ saved state, read defensively */
  function merge(def, saved) {
    var out = {};
    saved = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    Object.keys(def).forEach(function (k) {
      var d = def[k], s = saved[k];
      if (Array.isArray(d)) out[k] = d.map(function (x, i) { return merge(x, Array.isArray(s) ? s[i] : null); });
      else if (d && typeof d === 'object') out[k] = merge(d, s);
      else out[k] = typeof s === typeof d ? s : d;
    });
    return out;
  }
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function metalDefaults() {
    return {
      gold: { pur: '916', fine: '', rate: '1,34,207', runit: '10g', rfor: 'pur' },
      silver: { pur: '925', fine: '', rate: '2,10,312', runit: 'kg', rfor: 'base' },
      plat: { pur: '950', fine: '', rate: '4,970', runit: 'g', rfor: 'base' }
    };
  }
  function cleanMetals(mm) {
    METALS.forEach(function (m) {
      var s = mm[m]; if (!s) return;
      s.pur = oneOf(s.pur, PUR[m].concat(['custom']), metalDefaults()[m].pur);
      s.runit = oneOf(s.runit, RU[m], RU[m][0]);
      s.rfor = oneOf(s.rfor, ['pur', 'base'], 'pur');
    });
    return mm;
  }
  function defPrice() {
    return { metal: 'gold', m: metalDefaults(), w: '10', wu: 'g', sw: '', swu: 'g', mkType: 'pct',
      mkv: { pct: '12', pg: '450', flat: '2,500' }, disc: '', wst: '', wstu: 'pct', stones: '', other: '',
      mode: 'buy', jw: '5', inter: false, round: false };
  }
  function defExch() {
    var m = metalDefaults();
    m.gold = { pur: '916', fine: '', rate: '1,46,514', runit: '10g', rfor: 'base' };
    m.silver = { pur: '925', fine: '', rate: '2,10,312', runit: 'kg', rfor: 'base' };
    delete m.plat;
    return { metal: 'gold', m: m, w: '20', wu: 'g', sw: '', swu: 'g', ded: '2', newAmt: '' };
  }
  function defCmp() {
    return { w: '10', runit: '10g', shops: [
      { name: '', rate: '1,34,000', mkType: 'pct', mk: '12', wst: '', stones: '' },
      { name: '', rate: '1,33,500', mkType: 'pg', mk: '450', wst: '', stones: '' },
      { name: '', rate: '1,35,000', mkType: 'pct', mk: '8', wst: '2', stones: '' }] };
  }
  function defConv() {
    var m = metalDefaults();
    m.gold = { pur: '999', fine: '', rate: '1,46,514', runit: '10g', rfor: 'pur' };
    m.silver = { pur: '999', fine: '', rate: '2,10,312', runit: 'kg', rfor: 'pur' };
    m.plat = { pur: '950', fine: '', rate: '4,970', runit: 'g', rfor: 'pur' };
    return { metal: 'gold', m: m };
  }
  var P = merge(defPrice(), store.get('price', null));
  P.metal = oneOf(P.metal, METALS, 'gold'); cleanMetals(P.m);
  P.mkType = oneOf(P.mkType, ['pct', 'pg', 'flat'], 'pct'); P.wstu = oneOf(P.wstu, ['pct', 'g'], 'pct');
  P.mode = oneOf(P.mode, ['buy', 'own'], 'buy'); P.jw = oneOf(P.jw, ['5', '18'], '5');
  var X = merge(defExch(), store.get('exch', null));
  X.metal = oneOf(X.metal, ['gold', 'silver'], 'gold'); cleanMetals(X.m);
  var K = merge(defCmp(), store.get('cmp', null));
  K.runit = oneOf(K.runit, RU.gold, '10g');
  K.shops.forEach(function (s) { s.mkType = oneOf(s.mkType, ['pct', 'pg', 'flat'], 'pct'); });
  var V = merge(defConv(), store.get('conv', null));
  V.metal = oneOf(V.metal, METALS, 'gold'); cleanMetals(V.m);
  var CK = store.get('ck', []); if (!Array.isArray(CK)) CK = [];

  function save() { store.set('price', P); store.set('exch', X); store.set('cmp', K); store.set('conv', V); store.set('ck', CK); }

  /* ------------------------------------------------------------ small helpers */
  function m$(p, sign) { return el('bdi', { class: 'gs-m', text: C.money(p, sign), dataset: { paise: p.toString() } }); }
  function g$(ug) { return iso(C.grams(ug) + ' ' + t('u_g')); }
  function purLabel(m, id, fine) {
    if (id === 'custom') { var f = C.parseDec(fine, 2, 3); return f.err ? t('pur_custom') : (m === 'plat' ? 'Pt ' : '') + C.decTxt(f.v, 2); }
    if (m === 'gold') return KARAT[id] + ' ' + id;
    if (m === 'plat') return 'Pt ' + id;
    return id;
  }
  function metalPur(m, s) { return t('m_' + m) + ' ' + iso(purLabel(m, s.pur, s.fine)); }
  function baseLabel(m) { return m === 'gold' ? '24K 999' : m === 'plat' ? 'Pt 999' : '999'; }
  function fineOf(s) {
    if (s.pur !== 'custom') return { v: BigInt(s.pur) * 100n };
    var p = C.parseDec(s.fine, 2, 3);
    if (p.err === 'empty') return { err: 'fine' };
    if (p.err) return { err: p.err === 'number' ? 'number' : 'fine' };
    if (p.v <= 0n || p.v >= C.FULL) return { err: 'fine' };
    return { v: p.v };
  }
  /* parse a field: { v } (empty → 0n when optional), or { e: error code } */
  function fld(raw, scale, maxInt, opt, maxV) {
    var r = C.parseDec(raw, scale, maxInt);
    if (r.err === 'empty') return opt ? { v: 0n } : { e: 'empty' };
    if (r.err) return { e: r.err };
    if (maxV !== undefined && r.v > maxV) return { e: 'pct' };
    return r;
  }
  function markBad(id, bad) { var w = $('#' + id + '-wrap') || $('#' + id); if (w) w.classList.toggle('bad', !!bad); var i = $('#' + id); if (i) i.setAttribute('aria-invalid', String(!!bad)); }
  function setVal(inp, v) { if (inp && document.activeElement !== inp && inp.value !== v) inp.value = v; }
  function fillSel(sel, list, prefix, cur) {
    var keep = sel.value;
    sel.innerHTML = '';
    list.forEach(function (u) { sel.appendChild(el('option', { value: u, text: t(prefix + u) })); });
    sel.value = list.indexOf(cur) >= 0 ? cur : (list.indexOf(keep) >= 0 ? keep : list[0]);
  }
  function fmtDate(d) {
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { day: 'numeric', month: 'short', year: 'numeric', numberingSystem: 'latn' }).format(d); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }
  function kv(id, label, val, cls) { return el('tr', { id: id, class: cls || '' }, el('th', { scope: 'row', text: label }), el('td', { class: 'v' }, val)); }
  function tile(id, label, val, cls) { return el('div', { class: 'gs-tile ' + (cls || ''), id: id }, el('span', { text: label }), el('b', null, val)); }
  function halfTxt(rate) { return C.pctTxt(rate / 2n); }

  /* ------------------------------------------------------------ tabs */
  var TABS = ['price', 'exch', 'cmp', 'conv', 'check'];
  var tab = oneOf(store.get('tab', 'price'), TABS, 'price');
  var hashTab = (location.hash || '').slice(1);
  if (TABS.indexOf(hashTab) >= 0) tab = hashTab;
  function showTab(name, focus) {
    tab = name; store.set('tab', name);
    TABS.forEach(function (n) {
      var b = $('#tab-' + n), p = $('#panel-' + n), on = n === name;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; p.hidden = !on;
    });
    if (focus) $('#tab-' + name).focus();
    try { history.replaceState(history.state, '', location.href.split('#')[0] + '#' + name); } catch (e) { }
    if (name === 'exch') renderExch();
  }
  $$('#tabs [role="tab"]').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });
  $('#tabs').addEventListener('keydown', function (e) {
    var i = TABS.indexOf(tab), rtl = document.documentElement.dir === 'rtl', n = null;
    if (e.key === 'ArrowRight') n = i + (rtl ? -1 : 1);
    else if (e.key === 'ArrowLeft') n = i + (rtl ? 1 : -1);
    else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = TABS.length - 1;
    if (n === null) return;
    e.preventDefault(); showTab(TABS[(n + TABS.length) % TABS.length], true);
  });

  /* ------------------------------------------------------------ rate block (purity chips + rate + unit + "rate is for") */
  function rateBlock(px, getState, metals, onChange) {
    var chips = $('#' + px + '-pur'), fineBox = $('#' + px + '-fine-box'), fine = $('#' + px + '-fine');
    var rate = $('#' + px + '-rate'), ru = $('#' + px + '-runit'), rfor = $('#' + px + '-rfor'), der = $('#' + px + '-derived');
    function cur() { var st = getState(); return st.m[st.metal]; }
    function build() {
      var state = getState(), m = state.metal, s = cur();
      $$('#' + px + '-metal [data-metal]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.metal === m)); });
      chips.innerHTML = '';
      PUR[m].concat(['custom']).forEach(function (id) {
        chips.appendChild(el('button', { type: 'button', class: 'chip' + (id === 'custom' ? '' : ' gs-num'), dataset: { pur: id }, 'aria-pressed': String(s.pur === id),
          text: id === 'custom' ? t('pur_custom') : purLabel(m, id),
          onclick: function () { s.pur = id; build(); onChange(); if (id === 'custom') fine.focus(); } }));
      });
      fineBox.hidden = s.pur !== 'custom';
      setVal(fine, s.fine);
      setVal(rate, s.rate);
      fillSel(ru, RU[m], 'ru_', s.runit);
      if (rfor) {
        var same = s.pur === '999';
        rfor.hidden = same;
        $$('[data-rfor]', rfor).forEach(function (b) {
          b.setAttribute('aria-pressed', String(b.dataset.rfor === (same ? 'pur' : s.rfor)));
          b.textContent = b.dataset.rfor === 'pur' ? t('rfor_pur', { p: purLabel(m, s.pur, s.fine) }) : t('rfor_base', { p: baseLabel(m) });
        });
      }
    }
    /* → { P paise per rate unit for this purity, U, F, ru } or { err } */
    function read() {
      var state = getState(), s = cur(), F = fineOf(s), out = { ru: s.runit, U: C.RUNITS[s.runit] };
      markBad(px + '-fine', !!F.err && s.pur === 'custom' && String(s.fine).trim() !== '');
      var r = C.parseDec(s.rate, 2, 11);
      markBad(px + '-rate', !!r.err && r.err !== 'empty');
      if (der) der.textContent = '';
      if (r.err === 'empty' || (!r.err && r.v === 0n)) { out.err = 'rate_empty'; return out; }
      if (r.err) { out.err = r.err; return out; }
      if (F.err) { out.err = F.err === 'fine' && !String(s.fine).trim() ? 'fine_empty' : F.err; return out; }
      out.F = F.v;
      var useBase = !!rfor && s.rfor === 'base' && s.pur !== '999';
      out.P = useBase ? C.derive(r.v, F.v) : r.v;
      if (useBase && der) der.textContent = t('derived_rate', { p: purLabel(state.metal, s.pur, s.fine), r: iso(C.money(out.P)), u: t('ru_' + s.runit) });
      return out;
    }
    $$('#' + px + '-metal [data-metal]').forEach(function (b) {
      b.addEventListener('click', function () { getState().metal = b.dataset.metal; build(); onChange(true); });
    });
    fine.addEventListener('input', function () { cur().fine = fine.value; build(); onChange(); });
    rate.addEventListener('input', function () { cur().rate = rate.value; onChange(); });
    ru.addEventListener('change', function () { cur().runit = ru.value; onChange(); });
    if (rfor) $$('[data-rfor]', rfor).forEach(function (b) { b.addEventListener('click', function () { cur().rfor = b.dataset.rfor; build(); onChange(); }); });
    return { build: build, read: read };
  }

  function errText(code) {
    var map = { negative: 'err_negative', big: 'err_big', number: 'err_number', pct: 'err_pct', fine: 'err_fine', stone: 'err_stone' };
    return t(map[code] || 'err_number');
  }

  /* ------------------------------------------------------------ share / print */
  function linesText(L) {
    var out = [L.title];
    if (L.sub) out.push(L.sub);
    out.push('');
    L.rows.forEach(function (r) { out.push(r[0] + ': ' + r[1]); });
    if (L.foot && L.foot.length) { out.push(''); L.foot.forEach(function (f) { out.push(f); }); }
    out.push(''); out.push(t('share_footer') + ' ' + EDU.shareUrl());
    return out.join('\n').replace(/[⁦⁩]/g, '');
  }
  function printLines(L) {
    var pa = $('#print-area');
    pa.innerHTML = '';
    pa.appendChild(el('h1', { text: L.title }));
    if (L.sub) pa.appendChild(el('p', { text: L.sub }));
    pa.appendChild(el('table', null, el('tbody', null, L.rows.map(function (r) {
      return el('tr', { class: r[2] === 'sum' ? 'pa-grand' : '' }, el('th', { text: r[0] }), el('td', { class: 'v', text: r[1] }));
    }))));
    (L.foot || []).forEach(function (f) { pa.appendChild(el('p', { text: f })); });
    pa.appendChild(el('p', { class: 'pa-small', text: fmtDate(new Date()) + ' · ' + t('print_note') }));
    window.print();
  }
  function actions(prefix, getLines) {
    var wa = el('a', { class: 'btn btn-wa', id: prefix + '-wa', target: '_blank', rel: 'noopener', href: EDU.waLink(linesText(getLines())) }, el('span', { i18n: 'wa_send' }));
    return el('div', { class: 'row gs-actions no-print' },
      el('button', { type: 'button', class: 'btn btn-primary', id: prefix + '-copy', onclick: function () { EDU.copy(linesText(getLines())); } }, '📋 ', el('span', { i18n: 'copy' })),
      wa,
      el('button', { type: 'button', class: 'btn', id: prefix + '-print', onclick: function () { printLines(getLines()); } }, '🖨 ', el('span', { i18n: 'print' })));
  }

  /* ============================================================ 1. Jewellery price */
  var lastPrice = null;
  var pRB = rateBlock('p', function () { return P; }, METALS, function (metalChanged) { if (metalChanged) priceUnits(); renderPrice(); });
  function priceUnits() {
    fillSel($('#p-wu'), WU[P.metal], 'wu_', P.wu); P.wu = $('#p-wu').value;
    fillSel($('#p-swu'), SWU, 'wu_', P.swu); P.swu = $('#p-swu').value;
    fillSel($('#p-wstu'), ['pct', 'g'], 'wst_', P.wstu);
  }
  var PF = [['p-w', 'w'], ['p-sw', 'sw'], ['p-disc', 'disc'], ['p-wst', 'wst'], ['p-stones', 'stones'], ['p-other', 'other']];
  function priceControls() {
    PF.forEach(function (f) { setVal($('#' + f[0]), P[f[1]]); });
    setVal($('#p-mk'), P.mkv[P.mkType]);
    $$('#p-mktype [data-mk]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mk === P.mkType)); });
    $('#p-mk-pfx').textContent = P.mkType === 'pct' ? '' : '₹';
    $('#p-mk-sfx').textContent = P.mkType === 'pct' ? '%' : P.mkType === 'pg' ? t('per_g_sfx') : '';
    $$('#p-mode [data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === P.mode)); });
    $('#p-own-box').hidden = P.mode !== 'own';
    $$('#p-jw [data-jw]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.jw === P.jw)); });
    $$('#p-supply [data-supply]').forEach(function (b) { b.setAttribute('aria-pressed', String((b.dataset.supply === 'inter') === !!P.inter)); });
    $('#p-round').checked = !!P.round;
    $('#p-wstu').value = P.wstu;
  }
  function readPrice() {
    var rb = pRB.read(), err = '', bad = {}, empty = false;
    function take(id, raw, scale, maxInt, opt, maxV) {
      var r = fld(raw, scale, maxInt, opt, maxV);
      if (r.e === 'empty') { empty = true; return null; }
      if (r.e) { bad[id] = 1; if (!err) err = errText(r.e); return null; }
      return r.v;
    }
    var w = take('p-w', P.w, 6, 6), sw = take('p-sw', P.sw, 6, 6, true);
    var mkRaw = P.mkv[P.mkType];
    var mk = P.mkType === 'pct' ? take('p-mk', mkRaw, 2, 3, true, C.PCT) : P.mkType === 'pg' ? take('p-mk', mkRaw, 2, 8, true) : take('p-mk', mkRaw, 2, 12, true);
    var disc = take('p-disc', P.disc, 2, 3, true, C.PCT);
    var wst = P.wstu === 'pct' ? take('p-wst', P.wst, 2, 3, true, C.PCT) : take('p-wst', P.wst, 6, 6, true);
    var stones = take('p-stones', P.stones, 2, 12, true), other = take('p-other', P.other, 2, 12, true);
    ['p-w', 'p-sw', 'p-mk', 'p-disc', 'p-wst', 'p-stones', 'p-other'].forEach(function (id) { markBad(id, bad[id]); });
    if (!err && rb.err && rb.err !== 'rate_empty' && rb.err !== 'fine_empty') err = errText(rb.err);
    var o = null;
    if (!err && !rb.err && !empty && w > 0n) {
      var gw = C.toUg(w, P.wu), sg = C.toUg(sw, P.swu);
      o = { gw: gw, sw: sg, P: rb.P, U: rb.U, F: rb.F, mkType: P.mkType, mk: mk, wstType: P.wstu, wst: wst, disc: disc, stones: stones, other: other,
        mode: P.mode, jw: BigInt(P.jw) * 100n, inter: !!P.inter, round: !!P.round, ru: rb.ru };
      if (sg > gw) { err = t('err_stone'); markBad('p-sw', true); o = null; }
    }
    return { o: o, err: err };
  }
  function mkDetail(o) {
    if (o.mkType === 'pct') return iso(C.pctTxt(o.mk) + '%');
    if (o.mkType === 'pg') return iso(C.money(o.mk) + '/' + t('u_g'));
    return t('mk_flat');
  }
  function priceRows(o, r) {
    var rows = [], s = P.m[P.metal];
    var rateTxt = iso(C.money(r.rateG) + '/' + t('u_g'));
    if (r.own) rows.push(['r-metal', t('row_own_metal', { w: g$(r.nw) }), r.mv, 'dim']);
    else rows.push(['r-metal', t('row_metal', { w: g$(r.nw), r: rateTxt }), r.mv]);
    if (r.wv > 0n) rows.push(['r-wst', t('row_wst', { w: g$(r.wug) }), r.wv]);
    rows.push(['r-making', t('row_making') + ' (' + mkDetail(o) + ')', r.mk]);
    if (r.disc > 0n) rows.push(['r-disc', t('row_disc', { p: iso(C.pctTxt(o.disc) + '%') }), -r.disc]);
    if (r.st > 0n) rows.push(['r-stones', t('row_stones'), r.st]);
    if (r.ot > 0n) rows.push(['r-other', t('row_other'), r.ot]);
    function split(g, rate, pfx) {
      if (o.inter) rows.push([pfx + 'igst', t('row_igst', { r: iso(C.pctTxt(rate)) }), g.ig]);
      else { rows.push([pfx + 'cgst', t('row_cgst', { r: iso(halfTxt(rate)) }), g.cg]); rows.push([pfx + 'sgst', t('row_sgst', { r: iso(halfTxt(rate)) }), g.sg]); }
    }
    if (!r.own) { rows.push(['r-taxable', t('row_taxable'), r.tv, 'sub']); split(r.g3, 300n, 'r-'); }
    else {
      rows.push(['r-tv3', t('row_tv3'), r.tv3, 'sub']); split(r.g3, 300n, 'r-');
      rows.push(['r-tvj', t('row_tvj', { r: iso(P.jw + '%') }), r.tvJ, 'sub']); split(r.gJ, o.jw, 'r-j');
    }
    rows.push(['r-gst', t('row_gst'), r.gst, 'sub']);
    if (o.round) rows.push(['r-round', t('row_round'), r.ro]);
    rows.push(['r-total', t('row_total'), r.total, 'sum']);
    return rows;
  }
  function renderPrice() {
    priceControls();
    var x = readPrice(), box = $('#p-result');
    $('#p-err').textContent = x.err;
    box.innerHTML = '';
    var s = P.m[P.metal];
    var netEl = $('#p-net'); netEl.textContent = '';
    if (!x.o) {
      lastPrice = null;
      box.appendChild(el('p', { class: 'muted gs-empty', id: 'p-empty', text: x.err || t('res_empty') }));
      save(); return;
    }
    var o = x.o, r = C.price(o);
    if (r.err) { lastPrice = null; box.appendChild(el('p', { class: 'gs-err', text: t('err_stone') })); save(); return; }
    lastPrice = { o: o, r: r };
    netEl.textContent = t('net_line', { n: g$(r.nw), p: g$(r.pureUg) });
    box.appendChild(el('div', { class: 'gs-res-head' },
      el('span', { class: 'gs-res-lbl', text: t('res_total') }),
      el('span', { class: 'badge primary', text: metalPur(P.metal, s) + ' · ' + t(r.own ? 'badge_own' : 'badge_buy') })));
    box.appendChild(el('div', { class: 'gs-big', id: 'p-total' }, m$(r.total)));
    box.appendChild(el('div', { class: 'scroll-x' }, el('table', { class: 'table gs-break' }, el('tbody', null,
      priceRows(o, r).map(function (row) { return kv(row[0], row[1], m$(row[2], row[0] === 'r-round'), row[3]); })))));
    var tiles = el('div', { class: 'gs-tiles' });
    var gl = t('u_g');
    if (!r.own) {
      tiles.appendChild(tile('p-perg', t('tl_perg'), m$(r.perG), 'hl'));
      tiles.appendChild(tile('p-rateg', t('tl_rate', { p: purLabel(P.metal, s.pur, s.fine) }), m$(r.rateG)));
      tiles.appendChild(tile('p-above', t('tl_above'), m$(r.extra), 'warn'));
      if (P.metal === 'gold' && s.pur !== '999') tiles.appendChild(tile('p-baseg', t('tl_base'), m$(r.baseG)));
      else tiles.appendChild(tile('p-perpure', t('tl_perpure'), m$(r.perPure)));
    } else {
      tiles.appendChild(tile('p-perg', t('tl_perg_own'), m$(r.perG), 'hl'));
      tiles.appendChild(tile('p-gold-saved', t('tl_own_value'), m$(r.mv)));
    }
    box.appendChild(tiles);
    if (!r.own && r.rateG > 0n) {
      var pct = C.ratio(r.perG - r.rateG, r.rateG);
      box.appendChild(el('p', { class: 'gs-msg', id: 'p-msg', text: t('msg_above', { x: iso(C.money(r.perG) + '/' + gl), p: iso(isFinite(pct) ? pct.toFixed(2) : '–'), r: iso(C.money(r.rateG) + '/' + gl) }) }));
    }
    box.appendChild(actions('p', priceLines));
    save();
  }
  function priceLines() {
    var o = lastPrice.o, r = lastPrice.r, s = P.m[P.metal];
    var rows = priceRows(o, r).map(function (row) { return [row[1], C.money(row[2], row[0] === 'r-round'), row[3]]; });
    return { title: t('sum_title') + ' · ' + metalPur(P.metal, s),
      sub: t('sum_rate', { r: iso(C.money(o.P)), u: t('ru_' + o.ru), w: g$(o.gw), n: g$(r.nw) }),
      rows: rows,
      foot: r.own ? [t('tl_perg_own') + ': ' + C.money(r.perG)] : [t('tl_perg') + ': ' + C.money(r.perG) + ' · ' + t('tl_rate', { p: purLabel(P.metal, s.pur, s.fine) }) + ': ' + C.money(r.rateG), t('gst_short')] };
  }
  PF.forEach(function (f) { $('#' + f[0]).addEventListener('input', function () { P[f[1]] = this.value; renderPrice(); }); });
  $('#p-mk').addEventListener('input', function () { P.mkv[P.mkType] = this.value; renderPrice(); });
  $$('#p-mktype [data-mk]').forEach(function (b) { b.addEventListener('click', function () { P.mkType = b.dataset.mk; $('#p-mk').value = P.mkv[P.mkType]; renderPrice(); }); });
  $('#p-wu').addEventListener('change', function () { P.wu = this.value; renderPrice(); });
  $('#p-swu').addEventListener('change', function () { P.swu = this.value; renderPrice(); });
  $('#p-wstu').addEventListener('change', function () { P.wstu = this.value; renderPrice(); });
  $$('#p-mode [data-mode]').forEach(function (b) { b.addEventListener('click', function () { P.mode = b.dataset.mode; renderPrice(); }); });
  $$('#p-jw [data-jw]').forEach(function (b) { b.addEventListener('click', function () { P.jw = b.dataset.jw; renderPrice(); }); });
  $$('#p-supply [data-supply]').forEach(function (b) { b.addEventListener('click', function () { P.inter = b.dataset.supply === 'inter'; renderPrice(); }); });
  $('#p-round').addEventListener('change', function () { P.round = this.checked; renderPrice(); });
  $('#p-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    var keep = P.m; P = defPrice(); P.m = keep;   /* today's rates are kept; everything else goes back */
    PF.forEach(function (f) { $('#' + f[0]).value = P[f[1]]; }); $('#p-mk').value = P.mkv[P.mkType];
    pRB.build(); priceUnits(); renderPrice();
  });

  /* ============================================================ 2. Old gold exchange */
  var lastEx = null;
  var xRB = rateBlock('x', function () { return X; }, ['gold', 'silver'], function (mc) { if (mc) exchUnits(); renderExch(); });
  function exchUnits() {
    fillSel($('#x-wu'), WU[X.metal], 'wu_', X.wu); X.wu = $('#x-wu').value;
    fillSel($('#x-swu'), SWU, 'wu_', X.swu); X.swu = $('#x-swu').value;
  }
  var XF = [['x-w', 'w'], ['x-sw', 'sw'], ['x-ded', 'ded'], ['x-new', 'newAmt']];
  function renderExch() {
    XF.forEach(function (f) { setVal($('#' + f[0]), X[f[1]]); });
    $('#x-use').disabled = !(lastPrice && !lastPrice.r.own);
    var rb = xRB.read(), err = '', bad = {}, empty = false;
    function take(id, raw, scale, maxInt, opt, maxV) {
      var r = fld(raw, scale, maxInt, opt, maxV);
      if (r.e === 'empty') { empty = true; return null; }
      if (r.e) { bad[id] = 1; if (!err) err = errText(r.e); return null; }
      return r.v;
    }
    var w = take('x-w', X.w, 6, 6), sw = take('x-sw', X.sw, 6, 6, true), ded = take('x-ded', X.ded, 2, 3, true, C.PCT);
    var nr = C.parseDec(X.newAmt, 2, 12), newAmt = null;
    if (!nr.err) newAmt = nr.v; else if (nr.err !== 'empty') { bad['x-new'] = 1; if (!err) err = errText(nr.err); }
    ['x-w', 'x-sw', 'x-ded', 'x-new'].forEach(function (id) { markBad(id, bad[id]); });
    if (!err && rb.err && rb.err !== 'rate_empty' && rb.err !== 'fine_empty') err = errText(rb.err);
    var box = $('#x-result'); box.innerHTML = ''; $('#x-net').textContent = '';
    var o = null;
    if (!err && !rb.err && !empty && w > 0n) {
      o = { gw: C.toUg(w, X.wu), sw: C.toUg(sw, X.swu), P: rb.P, U: rb.U, F: rb.F, ded: ded, newAmt: newAmt, ru: rb.ru };
      if (o.sw > o.gw) { err = t('err_stone'); markBad('x-sw', true); o = null; }
    }
    $('#x-err').textContent = err;
    if (!o) { lastEx = null; box.appendChild(el('p', { class: 'muted gs-empty', id: 'x-empty', text: err || t('res_empty') })); save(); return; }
    var r = C.exchange(o), s = X.m[X.metal];
    lastEx = { o: o, r: r };
    $('#x-net').textContent = t('net_line', { n: g$(r.nw), p: g$(r.pureUg) });
    box.appendChild(el('div', { class: 'gs-res-head' }, el('span', { class: 'gs-res-lbl', text: t('ex_value') }),
      el('span', { class: 'badge primary', text: metalPur(X.metal, s) })));
    box.appendChild(el('div', { class: 'gs-big', id: 'x-value' }, m$(r.value)));
    box.appendChild(el('table', { class: 'table gs-break' }, el('tbody', null, exRows(r).map(function (row) { return kv(row[0], row[1], m$(row[2]), row[3]); }))));
    box.appendChild(el('div', { class: 'gs-tiles' },
      tile('x-perg', t('tl_ex_perg'), m$(r.valueG), 'hl'),
      tile('x-pure', t('tl_ex_pure'), el('bdi', { class: 'gs-m', text: g$(r.netPureUg) }))));
    if (r.pay !== null) {
      var pay = r.pay >= 0n;
      box.appendChild(el('div', { class: 'gs-pay' },
        el('div', { class: 'row' }, el('span', { text: t('row_ex_new') }), m$(o.newAmt)),
        el('div', { class: 'row' }, el('span', { text: t('row_ex_minus') }), m$(-r.value)),
        el('div', { class: 'row' }, el('strong', { text: t(pay ? 'ex_pay' : 'ex_refund') }),
          el('div', { class: 'gs-big' + (pay ? '' : ' neg'), id: 'x-pay', style: { margin: '0' } }, m$(pay ? r.pay : -r.pay)))));
    }
    box.appendChild(actions('x', exLines));
    save();
  }
  function exRows(r) {
    var o = lastEx ? lastEx.o : null;
    return [['r-ex-gross', t('row_ex_gross', { w: g$(r.nw), r: iso(C.money(r.rateG) + '/' + t('u_g')) }), r.gv],
      ['r-ex-ded', t('row_ex_ded', { p: iso(C.pctTxt(o ? o.ded : 0n) + '%') }), -r.dedAmt],
      ['r-ex-value', t('row_ex_value'), r.value, 'sum']];
  }
  function exLines() {
    var o = lastEx.o, r = lastEx.r, s = X.m[X.metal];
    var rows = exRows(r).map(function (row) { return [row[1], C.money(row[2]), row[3]]; });
    if (r.pay !== null) {
      rows.push([t('row_ex_new'), C.money(o.newAmt)]);
      rows.push([t(r.pay >= 0n ? 'ex_pay' : 'ex_refund'), C.money(r.pay >= 0n ? r.pay : -r.pay), 'sum']);
    }
    return { title: t('ex_title') + ' · ' + metalPur(X.metal, s), sub: t('sum_rate', { r: iso(C.money(o.P)), u: t('ru_' + o.ru), w: g$(o.gw), n: g$(r.nw) }), rows: rows, foot: [t('ex_note')] };
  }
  XF.forEach(function (f) { $('#' + f[0]).addEventListener('input', function () { X[f[1]] = this.value; renderExch(); }); });
  $('#x-wu').addEventListener('change', function () { X.wu = this.value; renderExch(); });
  $('#x-swu').addEventListener('change', function () { X.swu = this.value; renderExch(); });
  $('#x-use').addEventListener('click', function () {
    if (!lastPrice) return;
    X.newAmt = C.inputText(lastPrice.r.total); $('#x-new').value = X.newAmt; renderExch();
  });
  $('#x-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    var keep = X.m; X = defExch(); X.m = keep;
    XF.forEach(function (f) { $('#' + f[0]).value = X[f[1]]; });
    xRB.build(); exchUnits(); renderExch();
  });

  /* ============================================================ 3. Compare quotes */
  var SF = ['name', 'rate', 'mk', 'wst', 'stones'];
  function buildShops() {
    fillSel($('#c-runit'), RU.gold, 'ru_', K.runit);
    setVal($('#c-w'), K.w);
    var host = $('#c-shops'); host.innerHTML = '';
    K.shops.forEach(function (s, i) {
      function inp(f, lbl, attrs, pfx, sfx) {
        var id = 'c-' + f + '-' + i;
        var input = el('input', Object.assign({ id: id, type: 'text', autocomplete: 'off', dataset: { f: f, i: String(i) } }, attrs || {}));
        input.value = s[f] || '';
        return el('div', { class: 'field' }, el('label', { for: id, text: lbl }),
          el('div', { class: 'gs-in', id: id + '-wrap' }, pfx ? el('span', { class: 'gs-pfx', 'aria-hidden': 'true', text: pfx }) : null, input,
            sfx ? el('span', { class: 'gs-sfx', 'aria-hidden': 'true', text: sfx }) : null));
      }
      var mkSel = el('select', { id: 'c-mkt-' + i, dataset: { f: 'mkType', i: String(i) }, 'aria-label': t('shop_mk') });
      ['pct', 'pg', 'flat'].forEach(function (k) { mkSel.appendChild(el('option', { value: k, text: t('mk_' + k) })); });
      mkSel.value = s.mkType;
      var mkId = 'c-mk-' + i, mkIn = el('input', { id: mkId, class: 'gs-num', type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: '0', dataset: { f: 'mk', i: String(i) } });
      mkIn.value = s.mk || '';
      host.appendChild(el('section', { class: 'card gs-shop', id: 'c-shop-' + i },
        el('div', { class: 'gs-shop-head' }, el('h3', { text: t('shop_n', { n: i + 1 }) }), el('span', { class: 'badge success', id: 'c-badge-' + i, hidden: true, text: '★ ' + t('cmp_best') })),
        inp('name', t('shop_name'), { placeholder: t('shop_name_ph') }),
        inp('rate', t('shop_rate', { u: t('ru_' + K.runit) }), { class: 'gs-num', inputmode: 'decimal' }, '₹'),
        el('div', { class: 'field' }, el('label', { for: mkId, text: t('shop_mk') }),
          el('div', { class: 'gs-in', id: mkId + '-wrap' }, mkIn, mkSel)),
        el('div', { class: 'gs-pair' },
          inp('wst', t('shop_wst'), { class: 'gs-num', inputmode: 'decimal', placeholder: '0' }, null, '%'),
          inp('stones', t('shop_stones'), { class: 'gs-num', inputmode: 'decimal', placeholder: '0' }, '₹')),
        el('p', { class: 'gs-shop-out', id: 'c-out-' + i, 'aria-live': 'off' })));
    });
    renderCmp();
  }
  function renderCmp() {
    var wr = fld(K.w, 6, 6), err = '';
    markBad('c-w', !!wr.e && wr.e !== 'empty');
    if (wr.e && wr.e !== 'empty') err = errText(wr.e);
    var gw = wr.v || 0n, U = C.RUNITS[K.runit];
    var res = K.shops.map(function (s, i) {
      var rate = fld(s.rate, 2, 11), mk = s.mkType === 'pct' ? fld(s.mk, 2, 3, true, C.PCT) : fld(s.mk, 2, s.mkType === 'pg' ? 8 : 12, true);
      var wst = fld(s.wst, 2, 3, true, C.PCT), st = fld(s.stones, 2, 12, true);
      markBad('c-rate-' + i, rate.e && rate.e !== 'empty'); markBad('c-mk-' + i, !!mk.e); markBad('c-wst-' + i, !!wst.e); markBad('c-stones-' + i, !!st.e);
      var out = $('#c-out-' + i);
      if (rate.e === 'empty' || (!rate.e && rate.v === 0n) || gw === 0n || err) { if (out) out.textContent = ''; return null; }
      if (rate.e || mk.e || wst.e || st.e) { if (out) out.textContent = t('cmp_bad'); return null; }
      var r = C.price({ gw: gw, sw: 0n, P: rate.v, U: U, F: 91600n, mkType: s.mkType, mk: mk.v, wstType: 'pct', wst: wst.v, disc: 0n, stones: st.v, other: 0n, mode: 'buy' });
      if (out) out.textContent = t('cmp_shop_total', { x: iso(C.money(r.total)), g: iso(C.money(r.perG) + '/' + t('u_g')) });
      return r;
    });
    $('#c-err').textContent = err;
    var best = C.cheapest(res.map(function (r) { return r ? r.total : null; }));
    K.shops.forEach(function (s, i) {
      $('#c-shop-' + i).classList.toggle('is-best', best.indexOf(i) >= 0 && best.length < res.filter(Boolean).length);
      $('#c-badge-' + i).hidden = !(best.indexOf(i) >= 0 && res.filter(Boolean).length > 1);
    });
    var box = $('#c-result'); box.innerHTML = '';
    var valid = res.filter(Boolean);
    if (!valid.length) { box.appendChild(el('p', { class: 'muted mb0', id: 'c-empty', text: err || t('cmp_empty') })); save(); return; }
    var low = res[best[0]].total, high = valid.reduce(function (a, r) { return r.total > a ? r.total : a; }, 0n);
    function name(i) { return String(K.shops[i].name || '').trim() || t('shop_n', { n: i + 1 }); }
    box.appendChild(el('h2', { text: t('cmp_res_title') }));
    box.appendChild(el('div', { class: 'scroll-x' }, el('table', { class: 'table gs-tbl', id: 'c-table' },
      el('thead', null, el('tr', null, el('th', { scope: 'col', text: t('cmp_col_shop') }), el('th', { scope: 'col', class: 'v', text: t('cmp_col_total') }),
        el('th', { scope: 'col', class: 'v', text: t('cmp_col_perg') }), el('th', { scope: 'col', class: 'v', text: t('cmp_col_diff') }))),
      el('tbody', null, res.map(function (r, i) {
        if (!r) return null;
        var isBest = best.indexOf(i) >= 0;
        return el('tr', { class: isBest ? 'best' : '', dataset: { shop: String(i) } },
          el('td', { class: 'no-i18n' }, (isBest ? '★ ' : '') + name(i)),
          el('td', { class: 'v', id: 'c-total-' + i }, m$(r.total)), el('td', { class: 'v' }, m$(r.perG)),
          el('td', { class: 'v' }, isBest ? t('cmp_best') : m$(r.total - low, true)));
      })))));
    if (valid.length > 1 && high > low) box.appendChild(el('p', { class: 'gs-msg callout success', id: 'c-best', text: t('cmp_saves', { s: best.map(name).join(', '), x: iso(C.money(high - low)) }) }));
    box.appendChild(el('p', { class: 'muted small gs-msg', text: t('cmp_note') }));
    save();
  }
  $('#c-shops').addEventListener('input', function (e) {
    var f = e.target.dataset.f, i = e.target.dataset.i; if (!f || i === undefined) return;
    K.shops[+i][f] = e.target.value; renderCmp();
  });
  $('#c-shops').addEventListener('change', function (e) {
    if (e.target.tagName !== 'SELECT') return;
    K.shops[+e.target.dataset.i].mkType = e.target.value; renderCmp();
  });
  $('#c-w').addEventListener('input', function () { K.w = this.value; renderCmp(); });
  $('#c-runit').addEventListener('change', function () { K.runit = this.value; buildShops(); });

  /* ============================================================ 4. Rate converter */
  var vRB = rateBlock('v', function () { return V; }, METALS, function () { renderConv(); });
  var CV_UNITS = { gold: ['g', '10g', 'tola', 'sov'], silver: ['g', '10g', 'tola', 'kg'], plat: ['g', '10g', 'tola', 'sov'] };
  function renderConv() {
    var rb = vRB.read(), box = $('#v-result'), s = V.m[V.metal];
    box.innerHTML = '';
    var err = rb.err && rb.err !== 'rate_empty' && rb.err !== 'fine_empty' ? errText(rb.err) : '';
    $('#v-err').textContent = err;
    if (rb.err) { box.appendChild(el('p', { class: 'muted mb0', id: 'v-empty', text: err || t('cv_err_empty') })); save(); return; }
    box.appendChild(el('h2', { text: t('cv_res') }));
    var list = PUR[V.metal].slice();
    if (s.pur === 'custom') list.push('custom');
    list.forEach(function (id) {
      var F = id === 'custom' ? rb.F : BigInt(id) * 100n, mine = id === s.pur;
      var grid = el('div', { class: 'gs-units' });
      CV_UNITS[V.metal].forEach(function (u) {
        var val = C.convert(rb.P, rb.F, F, rb.U, C.RUNITS[u]);
        grid.appendChild(el('div', { class: 'gs-tile' + (mine && u === s.runit ? ' hl' : ''), id: 'v-' + id + '-' + u }, el('span', { text: t('ru_' + u) }), el('b', null, m$(val))));
      });
      box.appendChild(el('div', { class: 'stack', style: { marginTop: '14px' } },
        el('h3', { class: 'mb0' }, t('m_' + V.metal) + ' ', el('bdi', { class: 'gs-ltr', text: purLabel(V.metal, id, s.fine) }),
          mine ? el('span', { class: 'badge primary', style: { marginInlineStart: '8px' }, text: t('cv_this') }) : null),
        grid));
    });
    save();
  }
  $('#v-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    var d = defConv(); V.metal = d.metal; V.m = d.m; vRB.build(); renderConv();
  });

  /* ============================================================ 5. Buyer checklist */
  var CK_N = 9;
  function renderCheck() {
    var list = $('#ck-list'); list.innerHTML = '';
    for (var i = 1; i <= CK_N; i++) {
      (function (i) {
        var cb = el('input', { type: 'checkbox', id: 'ck-' + i });
        cb.checked = CK.indexOf(i) >= 0;
        cb.addEventListener('change', function () {
          CK = CK.filter(function (x) { return x !== i; }); if (cb.checked) CK.push(i);
          save(); countCheck();
        });
        list.appendChild(el('li', null, el('label', { for: 'ck-' + i }, cb, el('span', null, el('b', { text: t('ck_' + i + '_t') }), t('ck_' + i + '_d')))));
      })(i);
    }
    countCheck();
  }
  function countCheck() { $('#ck-count').textContent = t('ck_count', { n: CK.length, t: CK_N }); }
  $('#ck-clear').addEventListener('click', function () { CK = []; save(); renderCheck(); });
  $('#ck-print').addEventListener('click', function () {
    var pa = $('#print-area'); pa.innerHTML = '';
    pa.appendChild(el('h1', { text: t('ck_title') }));
    var ul = el('ul');
    for (var i = 1; i <= CK_N; i++) ul.appendChild(el('li', null, el('strong', { text: (CK.indexOf(i) >= 0 ? '☑ ' : '☐ ') + t('ck_' + i + '_t') + ' ' }), t('ck_' + i + '_d')));
    pa.appendChild(ul);
    pa.appendChild(el('p', { class: 'pa-small', text: t('ck_source') }));
    window.print();
  });

  /* ============================================================ everything */
  function renderAll() {
    $('#rules-checked').textContent = t('rules_checked', { d: fmtDate(new Date(RULES_CHECKED + 'T00:00:00')) });
    pRB.build(); priceUnits(); renderPrice();
    xRB.build(); exchUnits(); renderExch();
    buildShops();
    vRB.build(); renderConv();
    renderCheck();
  }
  EDU.onLang(renderAll);
  window.addEventListener('afterprint', function () { $('#print-area').innerHTML = ''; });
  showTab(tab);
  renderAll();
})();
