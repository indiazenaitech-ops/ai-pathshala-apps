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

/* PART3 */
})();
