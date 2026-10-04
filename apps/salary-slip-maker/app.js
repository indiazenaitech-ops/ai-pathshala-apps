/* Salary Slip Maker: monthly payslip with PF, ESI, professional tax, LOP proration, words, print/PDF, CSV batch.
   All rates come from window.SLIP_RULES (data.js); number words from window.SLIP_WORDS (words.js). Nothing leaves the device. */
(function () {
  'use strict';
  var SLUG = 'salary-slip-maker';
  var R = window.SLIP_RULES, W = window.SLIP_WORDS;
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var CODES = EDU.LANGS.map(function (l) { return l.code; });
  function tl(key, lang, vars) {           // a string in a chosen language (the slip language)
    var S = window.APP_STRINGS || {};
    var v = S[lang] && S[lang][key];
    if (v === undefined) v = (EDU.COMMON[lang] || {})[key];
    if (v === undefined) v = S.en[key];
    if (v === undefined) v = EDU.COMMON.en[key];
    if (v === undefined) v = key;
    if (vars) v = String(v).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return v;
  }

  /* ---------------- numbers ---------------- */
  var ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function latinDigits(s) {
    return String(s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var cp = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (cp >= ZEROS[i] && cp <= ZEROS[i] + 9) return String(cp - ZEROS[i]);
      return c;
    });
  }
  var MAX = 1e9;   // one slip never carries more than 100 crore a month
  function num(v) {
    var s = latinDigits(v == null ? '' : v).replace(/[₹,\s]/g, '');
    if (!s) return 0;
    var n = parseFloat(s);
    if (!isFinite(n)) return 0;
    return Math.max(0, Math.min(MAX, n));
  }
  function fmtN(n, lang) {
    try { return new Intl.NumberFormat(EDU.langInfo(lang || EDU.lang).tag, { numberingSystem: 'latn', maximumFractionDigits: 0 }).format(n); }
    catch (e) { return String(Math.round(n)); }
  }
  function inr(n, lang) { n = Math.round(n || 0); return (n < 0 ? '−' : '') + '₹' + fmtN(Math.abs(n), lang); }
  function words(n, lang) {
    if (!W) return '';
    var l = W.langs.indexOf(lang) >= 0 ? lang : 'en';
    return tl('words_rs', l, { w: W.say(Math.round(Math.abs(n || 0)), l) });
  }
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? m[3] + '-' + m[2] + '-' + m[1] : (iso || '');
  }
  function daysIn(month, year) { return new Date(year, month, 0).getDate(); }
  function mask(s, on) {
    s = String(s || '').trim();
    if (!on || s.length <= 4) return s;
    return s.slice(0, -4).replace(/./g, 'X') + s.slice(-4);
  }

  /* ---------------- the pay engine ---------------- */
  /* earn rows: { key, name, full, prorate }; returns every figure on the slip (all whole rupees). */
  function ptFor(state, gross, month) {
    var tbl = R.professionalTax[state];
    if (tbl === null || tbl === undefined) return { amt: 0, mode: 'manual' };
    if (Array.isArray(tbl) && !tbl.length) return { amt: 0, mode: 'none' };
    var slab = null;
    for (var i = 0; i < tbl.slabs.length; i++) { var s = tbl.slabs[i]; if (s.upto === null || gross <= s.upto) { slab = s; break; } }
    if (!slab) slab = tbl.slabs[tbl.slabs.length - 1];
    var amt = slab.amt;
    if (month === 2 && slab.feb !== undefined) amt = slab.feb;
    if (month === 3 && slab.mar !== undefined) amt = slab.mar;
    var per = tbl.period === 'half' ? 6 : tbl.period === 'year' ? 12 : 1;
    return { amt: Math.round(amt / per), mode: tbl.period, periodAmt: amt };
  }

  function calc(p) {
    var days = Math.max(1, Math.round(num(p.days)) || daysIn(p.month, p.year));
    var lop = Math.max(0, num(p.lop));
    var lopOver = lop > days;
    if (lopOver) lop = days;
    var paid = days - lop;
    var ratio = paid / days;
    var earn = [], gross = 0;
    p.earn.forEach(function (r) {
      var full = Math.round(num(r.full)), amt = r.prorate ? Math.round(full * ratio) : full;
      if (full > 0 || r.key === 'basic') earn.push({ key: r.key, name: r.name, full: full, amt: amt });
      gross += amt;
    });
    var basic = 0, da = 0;
    earn.forEach(function (r) { if (r.key === 'basic') basic = r.amt; if (r.key === 'da') da = r.amt; });
    var pfWages = p.pfBase === 'b' ? basic : basic + da;
    if (p.pfCap) pfWages = Math.min(pfWages, R.pf.wageCeiling);
    var pf = p.pf ? Math.round(pfWages * R.pf.rate) : 0;
    var esiNA = gross > R.esi.grossLimit;
    var esi = (p.esi && !esiNA) ? Math.ceil(gross * R.esi.employeeRate - 1e-9) : 0;   // ESI is rounded UP to the next rupee
    var ptAuto = ptFor(p.state, gross, p.month);
    var pt = (p.pt === '' || p.pt === null || p.pt === undefined) ? ptAuto.amt : Math.round(num(p.pt));
    var tds = Math.round(num(p.tds)), adv = Math.round(num(p.adv));
    var ded = [];
    if (pf) ded.push({ key: 'pf', amt: pf, sub: '12% × ' + inr(pfWages, 'en') });
    if (esi) ded.push({ key: 'esi', amt: esi, sub: '0.75% × ' + inr(gross, 'en') });
    if (pt) ded.push({ key: 'pt', amt: pt });
    if (tds) ded.push({ key: 'tds', amt: tds });
    if (adv) ded.push({ key: 'adv', amt: adv });
    (p.xd || []).forEach(function (r) { var a = Math.round(num(r.amt)); if (a) ded.push({ key: 'x', name: r.name, amt: a }); });
    var totalDed = ded.reduce(function (s, r) { return s + r.amt; }, 0);
    return { days: days, lop: lop, lopOver: lopOver, paid: paid, earn: earn, gross: gross, pfWages: pfWages, pf: pf, esi: esi, esiNA: esiNA,
      pt: pt, ptAuto: ptAuto, tds: tds, adv: adv, ded: ded, totalDed: totalDed, net: gross - totalDed };
  }

  /* ---------------- state ---------------- */
  var today = new Date(), prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  var DEF_CO = { name: '', addr: '', gstin: '', pan: '', state: 'MH', sign: '', logo: '', mask: true };
  var DEF_EMP = { name: '', id: '', desig: '', dept: '', doj: '', bank4: '', uan: '', pan: '' };
  var DEF_PAY = { month: prev.getMonth() + 1, year: prev.getFullYear(), days: '', lop: 0,
    earn: { basic: 12000, hra: 4800, da: 1200, conv: 1600, special: 400, ot: 0, bonus: 0 }, xe: [],
    pf: true, pfBase: 'bd', pfCap: false, esi: true, pt: '', tds: 0, adv: 0, xd: [] };
  var DEF_UI = { tpl: 'formal', paper: 'A4', slipLang: 'auto', tab: 'slip' };
  var EKEYS = ['basic', 'hra', 'da', 'conv', 'special', 'ot', 'bonus'];
  var PRORATE = { basic: 1, hra: 1, da: 1, conv: 1, special: 1, ot: 0, bonus: 0 };

  function str(v, max) { return typeof v === 'string' ? v.slice(0, max || 300) : ''; }
  function cleanCo(c) {
    c = c && typeof c === 'object' ? c : {};
    var o = { name: str(c.name, 120), addr: str(c.addr, 300), gstin: str(c.gstin, 15), pan: str(c.pan, 10), sign: str(c.sign, 120),
      state: R.states.indexOf(c.state) >= 0 ? c.state : 'MH', mask: c.mask !== false,
      logo: /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(c.logo || '') ? c.logo : '' };
    return o;
  }
  function cleanEmp(e) {
    e = e && typeof e === 'object' ? e : {};
    return { name: str(e.name, 80), id: str(e.id, 30), desig: str(e.desig, 60), dept: str(e.dept, 60), doj: /^\d{4}-\d{2}-\d{2}$/.test(e.doj || '') ? e.doj : '',
      bank4: str(e.bank4, 4), uan: str(e.uan, 12), pan: str(e.pan, 10) };
  }
  function cleanRows(a, withPro) {
    if (!Array.isArray(a)) return [];
    return a.slice(0, 20).map(function (r) { r = r && typeof r === 'object' ? r : {}; var o = { name: str(r.name, 60), amt: num(r.amt) }; if (withPro) o.prorate = !!r.prorate; return o; });
  }
  function cleanPay(p) {
    p = p && typeof p === 'object' ? p : {};
    var m = parseInt(p.month, 10), y = parseInt(p.year, 10);
    var o = { month: m >= 1 && m <= 12 ? m : DEF_PAY.month, year: y >= 2000 && y <= 2099 ? y : DEF_PAY.year,
      days: p.days === '' || p.days === undefined ? '' : num(p.days), lop: num(p.lop), earn: {}, xe: cleanRows(p.xe, true),
      pf: p.pf !== false, pfBase: p.pfBase === 'b' ? 'b' : 'bd', pfCap: !!p.pfCap, esi: p.esi !== false,
      pt: (p.pt === '' || p.pt === undefined || p.pt === null) ? '' : num(p.pt), tds: num(p.tds), adv: num(p.adv), xd: cleanRows(p.xd, false) };
    var src = p.earn && typeof p.earn === 'object' ? p.earn : DEF_PAY.earn;
    EKEYS.forEach(function (k) { o.earn[k] = num(src[k]); });
    return o;
  }
  var co = cleanCo(store.get('company', DEF_CO));
  var emp = cleanEmp(store.get('emp', DEF_EMP));
  var pay = cleanPay(store.get('pay', DEF_PAY));
  var ui = (function (u) { u = u && typeof u === 'object' ? u : {}; return { tpl: ['simple', 'formal', 'bi'].indexOf(u.tpl) >= 0 ? u.tpl : 'formal', paper: u.paper === 'A5' ? 'A5' : 'A4', slipLang: CODES.indexOf(u.slipLang) >= 0 ? u.slipLang : 'auto', tab: ['slip', 'batch', 'company'].indexOf(u.tab) >= 0 ? u.tab : 'slip' }; })(store.get('ui', DEF_UI));
  var employees = (function (a) { return Array.isArray(a) ? a.slice(0, 500).filter(function (x) { return x && typeof x === 'object' && str(x.name); }).map(function (x) { return { uid: str(x.uid, 40) || uid(), emp: cleanEmp(x.emp), pay: cleanPay(x.pay) }; }) : []; })(store.get('employees', []));
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function saveAll() { store.set('company', co); store.set('emp', emp); store.set('pay', pay); store.set('ui', ui); }

  function isSample() { return !co.name.trim() && !emp.name.trim(); }
  function slipLang() { return ui.slipLang === 'auto' ? EDU.lang : ui.slipLang; }
  function stateName(code, lang) { return tl('st_' + code, lang || EDU.lang); }
  function monthName(m, y, lang) { return tl('m' + m, lang) + ' ' + y; }

  /* build the engine input from a company + employee + pay set */
  function payInput(c, e, p) {
    var earn = EKEYS.map(function (k) { return { key: k, name: '', full: p.earn[k], prorate: !!PRORATE[k] }; });
    (p.xe || []).forEach(function (r) { if (r.name || r.amt) earn.push({ key: 'x', name: r.name, full: r.amt, prorate: !!r.prorate }); });
    return { month: p.month, year: p.year, days: p.days, lop: p.lop, earn: earn, pf: p.pf, pfBase: p.pfBase, pfCap: p.pfCap, esi: p.esi, pt: p.pt, tds: p.tds, adv: p.adv, xd: p.xd, state: c.state };
  }

  /* ---------------- the slip (HTML) ---------------- */
  function sheetHTML(c, e, p, res, o) {
    var L = o.lang, bi = o.tpl === 'bi', B = bi ? (L === 'en' ? 'hi' : L) : L;
    var main = bi ? 'en' : L;
    var sample = o.sample;
    function lab(key, vars) { return bi ? esc(tl(key, 'en', vars)) + '<span class="lc">' + esc(tl(key, B, vars)) + '</span>' : esc(tl(key, L, vars)); }
    function labInline(key) { return bi ? esc(tl(key, 'en')) + ' <span class="lc" style="display:inline">' + esc(tl(key, B)) + '</span>' : esc(tl(key, L)); }
    function sv(v, key) { return v && String(v).trim() ? v : (sample ? tl(key, main) : ''); }
    var dir = EDU.langInfo(main).dir;
    var coName = sv(c.name, 'sample_co'), coAddr = sv(c.addr, 'sample_addr'), sign = sv(c.sign, 'sample_sign');
    var eName = sv(e.name, 'sample_emp'), eId = e.id || (sample ? 'EMP-014' : ''), eDesig = sv(e.desig, 'sample_desig'), eDept = sv(e.dept, 'sample_dept');
    var doj = e.doj || (sample ? '2023-06-15' : ''), bank4 = e.bank4 || (sample ? '4821' : ''), uan = e.uan || (sample ? '100123456789' : ''), pan = (e.pan || (sample ? 'ABCPS1234K' : '')).toUpperCase();
    var mon = bi ? monthName(p.month, p.year, 'en') + ' / ' + monthName(p.month, p.year, B) : monthName(p.month, p.year, L);
    var ids = [];
    if (c.gstin) ids.push(esc(tl('s_gstin', main)) + ': <span class="num">' + esc(mask(c.gstin.toUpperCase(), c.mask)) + '</span>');
    if (c.pan) ids.push(esc(tl('s_pan', main)) + ': <span class="num">' + esc(mask(c.pan.toUpperCase(), c.mask)) + '</span>');
    var h = '<div class="sheet tpl-' + (o.tpl === 'simple' ? 'simple' : 'formal') + (B === 'ur' && bi ? ' ur-mix' : '') + '" dir="' + dir + '" lang="' + main + '">';
    h += '<div class="sh-top"><div class="sh-co">' + (c.logo ? '<img class="sh-logo" src="' + esc(c.logo) + '" alt="">' : '') +
      '<div><div class="sh-name">' + esc(coName) + '</div><div class="sh-addr">' + esc(coAddr) + '</div>' + (ids.length ? '<div class="sh-ids">' + ids.join(' · ') + '</div>' : '') + '</div></div>' +
      '<div class="sh-ttl"><div class="sh-title">' + lab('s_title') + '</div><div class="sh-month">' + lab('s_for', { month: mon }) + '</div></div></div>';
    /* employee details */
    var kv = [['emp_name', eName], ['emp_id', eId], ['emp_desig', eDesig], ['emp_dept', eDept], ['emp_doj', fmtDate(doj)],
      ['s_bank', bank4 ? 'XXXX' + bank4 : ''], ['s_uan', mask(uan, c.mask)], ['s_pan', mask(pan, c.mask)],
      ['s_days', String(res.days)], ['s_paid', String(res.paid)], ['s_lop', String(res.lop)]];
    kv = kv.filter(function (x) { return x[1] !== '' || x[0] === 's_lop'; });
    h += '<div class="sh-sec">' + labInline('s_emp_details') + '</div><table class="sh-emp"><tbody>';
    for (var i = 0; i < kv.length; i += 2) {
      h += '<tr><td class="k">' + lab(kv[i][0]) + '</td><td class="v">' + esc(kv[i][1]) + '</td>';
      if (kv[i + 1]) h += '<td class="k">' + lab(kv[i + 1][0]) + '</td><td class="v">' + esc(kv[i + 1][1]) + '</td>'; else h += '<td class="k"></td><td class="v"></td>';
      h += '</tr>';
    }
    h += '</tbody></table>';
    /* earnings and deductions side by side */
    var E = res.earn.map(function (r) { return { label: r.key === 'x' ? esc(r.name) : lab('e_' + r.key), amt: r.amt, sub: (r.full !== r.amt) ? esc(inr(r.full, main)) + ' × ' + res.paid + '/' + res.days : '' }; });
    var D = res.ded.map(function (r) { return { label: r.key === 'x' ? esc(r.name) : lab(r.key === 'pf' ? 's_pf' : r.key === 'esi' ? 's_esi' : r.key === 'pt' ? 'd_pt' : r.key === 'tds' ? 'd_tds' : 'd_adv'), amt: r.amt, sub: r.key === 'pt' ? esc(stateName(c.state, main)) : (r.sub || '') }; });
    if (!D.length) D.push({ label: lab('s_none'), amt: 0, sub: '' });
    var n = Math.max(E.length, D.length);
    h += '<table class="sh-pay"><colgroup><col class="c1"><col class="c2"><col class="c3"><col class="c4"></colgroup><thead><tr><th>' + lab('s_earn') + '</th><th class="r">' + lab('s_amount') + '</th><th>' + lab('s_ded') + '</th><th class="r">' + lab('s_amount') + '</th></tr></thead><tbody>';
    for (var j = 0; j < n; j++) {
      var a = E[j], b = D[j];
      h += '<tr><td>' + (a ? a.label + (a.sub ? '<span class="sub">' + a.sub + '</span>' : '') : '') + '</td><td class="r num">' + (a ? fmtN(a.amt, main) : '') + '</td>' +
        '<td>' + (b ? b.label + (b.sub ? '<span class="sub">' + b.sub + '</span>' : '') : '') + '</td><td class="r num">' + (b ? fmtN(b.amt, main) : '') + '</td></tr>';
    }
    h += '</tbody><tfoot><tr><td>' + lab('s_total_earn') + '</td><td class="r num">' + fmtN(res.gross, main) + '</td><td>' + lab('s_total_ded') + '</td><td class="r num">' + fmtN(res.totalDed, main) + '</td></tr></tfoot></table>';
    /* net */
    var wEn = words(res.net, 'en'), wLoc = B !== 'en' ? words(res.net, B) : (bi || L === 'en' ? words(res.net, 'hi') : '');
    h += '<div class="sh-net"><div class="sh-netl">' + lab('s_net') + '</div><div class="sh-netv num">' + esc(inr(res.net, main)) + '</div></div>';
    h += '<div class="sh-words">' + labInline('net_words') + ': ' + esc(wEn) + (wLoc && wLoc !== wEn ? '<span class="loc">' + esc(wLoc) + '</span>' : '') + '</div>';
    h += '<div class="sh-foot"><div class="sh-note">' + lab('s_note') + '</div><div class="sh-sign"><div>' + lab('s_for_co', { co: coName }) + '</div><div class="sp"></div><div class="who">' + esc(sign) + '</div><div class="lc">' + esc(tl('s_sign', main)) + (bi ? ' / ' + esc(tl('s_sign', B)) : '') + '</div></div></div>';
    h += '</div>';
    return h;
  }

  function fit(wrap) {
    var pages = wrap.firstElementChild; if (!pages) return;
    var w = wrap.clientWidth - 24; if (w <= 0) return;
    var s = Math.min(1, w / pages.offsetWidth);
    pages.style.transform = 'scale(' + s + ')';
    wrap.style.height = Math.ceil(pages.offsetHeight * s) + 24 + 'px';
  }

  /* ---------------- form <-> state ---------------- */
  function fillSelect(sel, items, value) {
    sel.innerHTML = '';
    items.forEach(function (it) { sel.appendChild(el('option', { value: it.value, text: it.text })); });
    sel.value = value;
  }
  function renderStatic() {
    fillSelect($('#month'), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (m) { return { value: String(m), text: t('m' + m) }; }), String(pay.month));
    fillSelect($('#cState'), R.states.map(function (c) { return { value: c, text: stateName(c) }; }), co.state);
    fillSelect($('#slipLang'), [{ value: 'auto', text: t('slip_lang_auto') }].concat(EDU.LANGS.map(function (l) { return { value: l.code, text: l.native + (l.code === 'en' ? '' : ' · ' + l.name) }; })), ui.slipLang);
    $('#ratesNote').textContent = t('rates_note', { date: fmtDate(R.checked) });
    $('#pfCapLbl').textContent = t('pf_ceiling', { cap: fmtN(R.pf.wageCeiling), max: fmtN(Math.round(R.pf.wageCeiling * R.pf.rate)) });
    $('#esiLbl').textContent = t('esi_on', { rate: '0.75', limit: fmtN(R.esi.grossLimit) });
    $('#esiHint').textContent = t('esi_hint', { limit: fmtN(R.esi.grossLimit) });
    $$('#tabs [role=tab]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tab === ui.tab ? 'true' : 'false'); });
    ['slip', 'batch', 'company'].forEach(function (k) { $('#p-' + k).hidden = k !== ui.tab; });
    renderEmpPick();
  }
  function renderEmpPick() {
    var sel = $('#empPick');
    fillSelect(sel, [{ value: '', text: t('choose_emp') }].concat(employees.map(function (x) { return { value: x.uid, text: x.emp.name + (x.emp.id ? ' (' + x.emp.id + ')' : '') }; })), sel.value || '');
    $('#empDel').hidden = !sel.value;
  }
  function fillForm() {
    $$('[data-c]').forEach(function (i) { if (i.type === 'checkbox') i.checked = !!co[i.dataset.c]; else i.value = co[i.dataset.c] || ''; });
    $$('[data-e]').forEach(function (i) { i.value = emp[i.dataset.e] || ''; });
    $('#month').value = String(pay.month); $('#year').value = pay.year;
    $('#days').value = pay.days === '' ? daysIn(pay.month, pay.year) : pay.days; $('#lop').value = pay.lop || 0;
    EKEYS.forEach(function (k) { $('#e_' + k).value = pay.earn[k] || 0; });
    $('#pfOn').checked = pay.pf; $('#pfCap').checked = pay.pfCap; $('#esiOn').checked = pay.esi;
    $$('[data-pfbase]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.pfbase === pay.pfBase ? 'true' : 'false'); });
    $('#tds').value = pay.tds || 0; $('#adv').value = pay.adv || 0;
    $$('[data-tpl]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tpl === ui.tpl ? 'true' : 'false'); });
    $$('[data-paper]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.paper === ui.paper ? 'true' : 'false'); });
    $('#slipLang').value = ui.slipLang;
    renderXRows('#xEarn', pay.xe, true); renderXRows('#xDed', pay.xd, false);
    renderThumb();
  }
  function renderXRows(sel, rows, withPro) {
    var box = $(sel); box.innerHTML = '';
    rows.forEach(function (r, i) {
      var wrap = el('div');
      var row = el('div', { class: 'x-row' },
        el('input', { type: 'text', value: r.name, maxlength: '60', dir: 'auto', class: 'no-i18n', 'data-i18n-placeholder': withPro ? 'row_name_ph' : 'd_other_ph', placeholder: t(withPro ? 'row_name_ph' : 'd_other_ph'), 'aria-label': t(withPro ? 'row_name_ph' : 'd_other_ph'), oninput: function (e) { r.name = e.target.value.slice(0, 60); changed(); } }),
        el('input', { type: 'text', class: 'amt', value: r.amt || '', inputmode: 'decimal', 'data-i18n-placeholder': 'row_amt_ph', placeholder: t('row_amt_ph'), 'aria-label': t('row_amt_ph'), oninput: function (e) { r.amt = num(e.target.value); changed(); } }),
        el('button', { type: 'button', class: 'btn btn-danger btn-sm del', 'data-i18n-aria-label': 'remove_row', 'aria-label': t('remove_row'), text: '✕', onclick: function () { rows.splice(i, 1); renderXRows(sel, rows, withPro); changed(); } }));
      wrap.appendChild(row);
      if (withPro) wrap.appendChild(el('label', { class: 'check x-pro' }, el('input', { type: 'checkbox', checked: r.prorate, onchange: function (e) { r.prorate = e.target.checked; changed(); } }), ' ', el('span', { i18n: 'prorate' })));
      box.appendChild(wrap);
    });
  }
  function renderThumb() {
    var th = $('#logoThumb'); th.innerHTML = '';
    if (co.logo) th.appendChild(el('img', { src: co.logo, alt: '' }));
    $('#logoDel').hidden = !co.logo;
  }

  var last = null;
  function render() {
    var res = calc(payInput(co, emp, pay));
    last = res;
    var L = EDU.lang;
    $('#paidDays').textContent = t('paid_days', { n: fmtN(res.paid), d: fmtN(res.days) });
    $('#lopWarn').hidden = !res.lopOver;
    $('#grossLine').textContent = t('gross_line', { amt: inr(res.gross) });
    $('#pfBox').hidden = !pay.pf; $('#pfCap').parentElement.hidden = !pay.pf;
    var esiHint = $('#esiHint');
    esiHint.textContent = (pay.esi && res.esiNA) ? t('esi_na', { limit: fmtN(R.esi.grossLimit) }) : t('esi_hint', { limit: fmtN(R.esi.grossLimit) });
    var ptIn = $('#pt');
    if (pay.pt === '') ptIn.value = res.ptAuto.amt;
    var sn = stateName(co.state), pa = res.ptAuto;
    $('#ptHint').textContent = pa.mode === 'manual' ? t('pt_hint_manual', { state: sn }) : pa.mode === 'none' ? t('pt_hint_none', { state: sn }) :
      t('pt_hint_auto', { state: sn, gross: inr(res.gross) }) + (pa.mode === 'half' ? ' ' + t('pt_hint_half', { state: sn, amt: inr(pa.periodAmt) }) : pa.mode === 'year' ? ' ' + t('pt_hint_year', { state: sn, amt: inr(pa.periodAmt) }) : '');
    $('#ptWomen').hidden = co.state !== 'MH';
    $('#dedLine').textContent = t('ded_line', { amt: inr(res.totalDed) });
    var np = $('#netPay'); np.textContent = inr(res.net); np.dataset.value = res.net;
    np.dataset.gross = res.gross; np.dataset.pf = res.pf; np.dataset.esi = res.esi; np.dataset.pt = res.pt; np.dataset.ded = res.totalDed; np.dataset.paid = res.paid;
    $('#wordsEn').textContent = words(res.net, 'en');
    var wl = words(res.net, L); $('#wordsLocal').textContent = L === 'en' ? '' : wl;
    $('#netNeg').hidden = res.net >= 0;
    $('#quickTxt').textContent = t('net_pay') + ': ' + inr(res.net);
    $('#sampleBanner').hidden = !isSample();
    var eName = emp.name || (isSample() ? t('sample_emp') : '');
    $('#waBtn').href = 'https://wa.me/?text=' + encodeURIComponent(t('wa_text', { month: monthName(pay.month, pay.year, L), name: eName, amt: inr(res.net) }));
    /* preview */
    var pages = $('#pages');
    pages.className = 'pages no-i18n ' + ui.paper.toLowerCase();
    pages.innerHTML = sheetHTML(co, emp, pay, res, { lang: slipLang(), tpl: ui.tpl, sample: isSample() });
    fit($('#pvWrap'));
    if (batch.length) renderBatch();
  }
  function changed() { saveAll(); render(); }

  /* ---------------- events ---------------- */
  $$('#tabs [role=tab]').forEach(function (b) { b.addEventListener('click', function () { ui.tab = b.dataset.tab; saveAll(); renderStatic(); render(); }); });
  $('#goCompany').addEventListener('click', function () { ui.tab = 'company'; saveAll(); renderStatic(); $('#cName').focus(); });
  $$('[data-c]').forEach(function (i) { i.addEventListener(i.tagName === 'SELECT' || i.type === 'checkbox' ? 'change' : 'input', function () {
    co[i.dataset.c] = i.type === 'checkbox' ? i.checked : i.value;
    if (i.dataset.c === 'state') pay.pt = '';          // the state's own amount comes back
    changed();
  }); });
  $$('[data-e]').forEach(function (i) { i.addEventListener('input', function () { emp[i.dataset.e] = i.value; changed(); }); });
  $('#month').addEventListener('change', function () { pay.month = parseInt(this.value, 10); pay.days = ''; $('#days').value = daysIn(pay.month, pay.year); changed(); });
  $('#year').addEventListener('input', function () { var y = parseInt(this.value, 10); if (y >= 2000 && y <= 2099) { pay.year = y; pay.days = ''; $('#days').value = daysIn(pay.month, pay.year); changed(); } });
  $('#days').addEventListener('input', function () { pay.days = this.value === '' ? '' : Math.max(1, Math.min(31, num(this.value))); changed(); });
  $('#lop').addEventListener('input', function () { pay.lop = num(this.value); changed(); });
  EKEYS.forEach(function (k) { $('#e_' + k).addEventListener('input', function () { pay.earn[k] = num(this.value); changed(); }); });
  $('#addEarn').addEventListener('click', function () { if (pay.xe.length < 20) { pay.xe.push({ name: '', amt: 0, prorate: true }); renderXRows('#xEarn', pay.xe, true); $('#xEarn input').focus(); changed(); } });
  $('#addDed').addEventListener('click', function () { if (pay.xd.length < 20) { pay.xd.push({ name: '', amt: 0 }); renderXRows('#xDed', pay.xd, false); var ins = $$('#xDed input[type=text]'); ins[ins.length - 2].focus(); changed(); } });
  $('#pfOn').addEventListener('change', function () { pay.pf = this.checked; changed(); });
  $('#pfCap').addEventListener('change', function () { pay.pfCap = this.checked; changed(); });
  $('#esiOn').addEventListener('change', function () { pay.esi = this.checked; changed(); });
  $$('[data-pfbase]').forEach(function (b) { b.addEventListener('click', function () { pay.pfBase = b.dataset.pfbase; $$('[data-pfbase]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); changed(); }); });
  $('#pt').addEventListener('input', function () { pay.pt = this.value.trim() === '' ? '' : num(this.value); changed(); });
  $('#tds').addEventListener('input', function () { pay.tds = num(this.value); changed(); });
  $('#adv').addEventListener('input', function () { pay.adv = num(this.value); changed(); });
  $$('[data-tpl]').forEach(function (b) { b.addEventListener('click', function () { ui.tpl = b.dataset.tpl; $$('[data-tpl]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); changed(); }); });
  $$('[data-paper]').forEach(function (b) { b.addEventListener('click', function () { ui.paper = b.dataset.paper; $$('[data-paper]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); changed(); }); });
  $('#slipLang').addEventListener('change', function () { ui.slipLang = this.value; changed(); });

  /* saved employees */
  $('#empSave').addEventListener('click', function () {
    if (!emp.name.trim()) { EDU.toast(t('need_name')); $('#eName').focus(); return; }
    var cur = $('#empPick').value, rec = null;
    employees.forEach(function (x) { if (x.uid === cur || (x.emp.name === emp.name && x.emp.id === emp.id)) rec = x; });
    if (!rec) { rec = { uid: uid() }; employees.push(rec); }
    rec.emp = cleanEmp(emp); rec.pay = cleanPay(pay);
    store.set('employees', employees);
    renderEmpPick(); $('#empPick').value = rec.uid; $('#empDel').hidden = false;
    EDU.toast(t('emp_saved', { name: emp.name }));
  });
  $('#empPick').addEventListener('change', function () {
    var rec = null; employees.forEach(function (x) { if (x.uid === $('#empPick').value) rec = x; });
    $('#empDel').hidden = !rec;
    if (!rec) return;
    emp = cleanEmp(rec.emp);
    var keep = { month: pay.month, year: pay.year, days: pay.days };
    pay = cleanPay(rec.pay); pay.month = keep.month; pay.year = keep.year; pay.days = keep.days; pay.lop = 0; pay.pt = '';
    fillForm(); changed();
  });
  $('#empDel').addEventListener('click', function () {
    var id = $('#empPick').value; if (!id || !confirm(t('confirm_delete'))) return;
    employees = employees.filter(function (x) { return x.uid !== id; });
    store.set('employees', employees); $('#empPick').value = ''; renderEmpPick(); EDU.toast(t('emp_deleted'));
  });

  /* logo */
  $('#logoPick').addEventListener('click', function () {
    EDU.pickFile('image/png,image/jpeg,image/webp').then(function (f) {
      if (!f) return;
      if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { EDU.toast(t('logo_bad')); return; }
      var img = new Image(), url = URL.createObjectURL(f);
      img.onload = function () {
        var s = Math.min(1, 360 / img.width, 180 / img.height), cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.width * s)); cv.height = Math.max(1, Math.round(img.height * s));
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        co.logo = cv.toDataURL('image/png'); URL.revokeObjectURL(url); renderThumb(); changed();
      };
      img.onerror = function () { URL.revokeObjectURL(url); EDU.toast(t('logo_bad')); };
      img.src = url;
    });
  });
  $('#logoDel').addEventListener('click', function () { co.logo = ''; renderThumb(); changed(); });

  /* print, share, copy, reset */
  function printPages(html) {
    $('#pageStyle').textContent = '@page { size: ' + ui.paper + '; margin: 12mm; }';
    $('#printRoot').innerHTML = '<div class="pages ' + ui.paper.toLowerCase() + '">' + html + '</div>';
    window.print();
  }
  $('#printBtn').addEventListener('click', function () { printPages($('#pages').innerHTML); });
  $('#copyBtn').addEventListener('click', function () {
    var res = last, L = EDU.lang, lines = [t('s_title') + ' · ' + monthName(pay.month, pay.year, L), co.name || t('sample_co'), (emp.name || t('sample_emp')) + (emp.id ? ' (' + emp.id + ')' : ''), ''];
    res.earn.forEach(function (r) { lines.push((r.key === 'x' ? r.name : t('e_' + r.key)) + ': ' + inr(r.amt)); });
    lines.push(t('s_total_earn') + ': ' + inr(res.gross), '');
    res.ded.forEach(function (r) { lines.push((r.key === 'x' ? r.name : t(r.key === 'pf' ? 's_pf' : r.key === 'esi' ? 's_esi' : r.key === 'pt' ? 'd_pt' : r.key === 'tds' ? 'd_tds' : 'd_adv')) + ': ' + inr(r.amt)); });
    lines.push(t('s_total_ded') + ': ' + inr(res.totalDed), '', t('s_net') + ': ' + inr(res.net), words(res.net, 'en'));
    if (L !== 'en') lines.push(words(res.net, L));
    EDU.copy(lines.join('\n'));
  });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['company', 'emp', 'pay', 'ui', 'employees'].forEach(function (k) { store.remove(k); });
    co = cleanCo(DEF_CO); emp = cleanEmp(DEF_EMP); pay = cleanPay(JSON.parse(JSON.stringify(DEF_PAY))); ui = JSON.parse(JSON.stringify(DEF_UI)); employees = []; batch = [];
    $('#batchCard').hidden = true; $('#batchMsg').textContent = ''; $('#csvText').value = '';
    renderStatic(); fillForm(); render();
  });

  /* ---------------- batch (CSV) ---------------- */
  var batch = [];
  var COLS = { name: ['name', 'employee', 'employee name', 'emp name'], id: ['id', 'emp id', 'employee id', 'code', 'emp code'], desig: ['designation', 'desig', 'role'], dept: ['department', 'dept'],
    doj: ['doj', 'date of joining', 'joining'], bank4: ['bank4', 'bank', 'account', 'acc'], uan: ['uan'], pan: ['pan'], basic: ['basic'], hra: ['hra'], da: ['da'], conv: ['conveyance', 'conv'],
    special: ['special', 'special allowance'], ot: ['overtime', 'ot'], bonus: ['bonus', 'incentive'], lop: ['lop', 'lop days'], tds: ['tds'], adv: ['advance', 'adv', 'loan'], pf: ['pf'], esi: ['esi'] };
  function yn(v, def) { v = String(v || '').trim().toLowerCase(); if (!v) return def; return !/^(no|n|0|false|nahi|नहीं)$/.test(v); }
  function parseBatch(text) {
    var rows = EDU.csv.parse(text || '');
    if (rows.length < 2) return { items: [], skipped: 0 };
    var head = rows[0].map(function (h) { return String(h).trim().toLowerCase(); }), idx = {};
    Object.keys(COLS).forEach(function (k) { COLS[k].forEach(function (a) { var i = head.indexOf(a); if (i >= 0 && idx[k] === undefined) idx[k] = i; }); });
    if (idx.name === undefined || idx.basic === undefined) return { items: [], skipped: rows.length - 1 };
    var items = [], skipped = 0;
    rows.slice(1).forEach(function (r) {
      var g = function (k) { return idx[k] === undefined ? '' : String(r[idx[k]] || '').trim(); };
      var name = g('name').slice(0, 80), basic = num(g('basic'));
      if (!name || !basic) { skipped++; return; }
      var e = cleanEmp({ name: name, id: g('id'), desig: g('desig'), dept: g('dept'), doj: g('doj'), bank4: g('bank4').slice(-4), uan: g('uan'), pan: g('pan') });
      var p = cleanPay({ month: pay.month, year: pay.year, days: pay.days, lop: g('lop'),
        earn: { basic: basic, hra: g('hra'), da: g('da'), conv: g('conv'), special: g('special'), ot: g('ot'), bonus: g('bonus') },
        pf: yn(g('pf'), pay.pf), pfBase: pay.pfBase, pfCap: pay.pfCap, esi: yn(g('esi'), pay.esi), pt: '', tds: g('tds'), adv: g('adv') });
      items.push({ emp: e, pay: p });
    });
    return { items: items.slice(0, 500), skipped: skipped };
  }
  function renderBatch() {
    var html = batch.map(function (b) { return sheetHTML(co, b.emp, b.pay, calc(payInput(co, b.emp, b.pay)), { lang: slipLang(), tpl: ui.tpl, sample: !co.name.trim() }); }).join('');
    var pages = $('#batchPages'); pages.className = 'pages no-i18n ' + ui.paper.toLowerCase(); pages.innerHTML = html;
    $('#batchCount').textContent = t('batch_count', { n: fmtN(batch.length), month: monthName(pay.month, pay.year, EDU.lang) });
    $('#batchCard').hidden = !batch.length;
    fit($('#batchWrap'));
  }
  $('#batchMake').addEventListener('click', function () {
    var r = parseBatch($('#csvText').value);
    batch = r.items;
    $('#batchMsg').textContent = batch.length ? t('batch_rows', { n: fmtN(batch.length), skipped: fmtN(r.skipped) }) : t('batch_empty');
    $('#batchMsg').className = 'batch-msg ' + (batch.length ? 'ok' : 'bad');
    renderBatch();
  });
  $('#csvPick').addEventListener('click', function () {
    EDU.pickFile('.csv,text/csv,text/plain').then(function (f) {
      if (!f) return;
      EDU.readText(f).then(function (txt) {
        if (/[\x00-\x08]/.test(txt.slice(0, 2000))) { EDU.toast(t('batch_bad_file')); return; }
        $('#csvText').value = txt; $('#batchMake').click();
      });
    });
  });
  $('#csvSample').addEventListener('click', function () {
    var rows = [['name', 'id', 'designation', 'department', 'doj', 'bank4', 'uan', 'pan', 'basic', 'hra', 'da', 'conveyance', 'special', 'overtime', 'bonus', 'lop', 'tds', 'advance', 'pf', 'esi'],
      ['Amit Kumar', 'EMP-001', 'Sales Executive', 'Sales', '2022-04-01', '1234', '100123456781', 'ABCPK1234A', '15000', '6000', '1500', '1600', '900', '0', '0', '0', '0', '0', 'yes', 'no'],
      ['Sunita Devi', 'EMP-002', 'Office Assistant', 'Admin', '2021-07-15', '5678', '100123456782', 'ABCPD5678B', '10000', '4000', '1000', '1600', '400', '500', '0', '2', '0', '1000', 'yes', 'yes'],
      ['Mohammed Irfan', 'EMP-003', 'Accountant', 'Accounts', '2020-01-10', '9012', '100123456783', 'ABCPI9012C', '25000', '10000', '2500', '1600', '5900', '0', '2000', '0', '1200', '0', 'yes', 'no']];
    EDU.download('salary-slips-sample.csv', EDU.csv.stringify(rows), 'text/csv');
  });
  $('#batchPrint').addEventListener('click', function () { printPages($('#batchPages').innerHTML); });

  /* ---------------- boot ---------------- */
  window.addEventListener('resize', function () { fit($('#pvWrap')); fit($('#batchWrap')); });
  if (window.ResizeObserver) { var ro = new ResizeObserver(function () { fit($('#pvWrap')); fit($('#batchWrap')); }); ro.observe($('#pvWrap')); ro.observe($('#batchWrap')); }
  EDU.onLang(function () { renderStatic(); fillForm(); render(); });
  renderStatic(); fillForm(); render();

  /* exposed for the interaction test */
  window.SSM = { calc: calc, payInput: payInput, words: words, num: num, ptFor: ptFor, parseBatch: parseBatch };
})();
