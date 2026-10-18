/* Rent Receipt Maker (HRA): monthly rent receipts for a whole tax year (rent changes, PAN rule, revenue stamp,
   amount in words, 3 per A4 page) + the old-regime HRA exemption calculator.
   Rules: window.RENT_RULES (data.js). Number words: window.RENT_WORDS (words.js). Nothing leaves the device. */
(function () {
  'use strict';
  var SLUG = 'rent-receipt-maker';
  var R = window.RENT_RULES, W = window.RENT_WORDS;
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- helpers ---------------- */
  function tl(key, lang, vars) {               // a string in the receipt language
    var S = window.APP_STRINGS || {};
    var v = S[lang] && S[lang][key];
    if (v === undefined) v = (EDU.COMMON[lang] || {})[key];
    if (v === undefined) v = S.en[key];
    if (v === undefined) v = key;
    if (vars) v = String(v).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return v;
  }
  /* escape a template, then drop already-built HTML into its {placeholders} */
  function tlHtml(key, lang, html) {
    return esc(tl(key, lang)).replace(/\{(\w+)\}/g, function (m, k) { return html[k] !== undefined ? html[k] : m; });
  }
  var ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function latinDigits(s) {
    return String(s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var cp = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (cp >= ZEROS[i] && cp <= ZEROS[i] + 9) return String(cp - ZEROS[i]);
      return c;
    });
  }
  var MAX_RENT = 1e9;                        // ₹100 crore a month is the most one receipt carries
  function num(v, max) {
    var s = latinDigits(v == null ? '' : v).replace(/[₹,\s]/g, '');
    if (!s) return 0;
    var n = parseFloat(s);
    if (!isFinite(n) || n < 0) return 0;
    return Math.round(Math.min(max || MAX_RENT, n));
  }
  /* Indian grouping (1,85,000) in every language; ur-IN would group the Western way */
  var NF = (function () { try { return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }); } catch (e) { return null; } })();
  function fmtN(n) { n = Math.round(n || 0); return NF ? NF.format(n) : String(n); }
  function inr(n) { n = Math.round(n || 0); return (n < 0 ? '−' : '') + '₹' + fmtN(Math.abs(n)); }
  function words(n) { return tl('words_rs', 'en', { w: W.say(Math.round(Math.abs(n || 0)), 'en') }); }
  function pad(n, len) { n = String(n); while (n.length < len) n = '0' + n; return n; }
  function daysIn(m, y) { return new Date(y, m, 0).getDate(); }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function str(v, max) { return typeof v === 'string' ? v.slice(0, max) : ''; }
  var PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  function cleanPan(p) { return String(p || '').toUpperCase().replace(/\s+/g, ''); }

  /* tax year y = April y .. March y+1; month index 0..11 = April .. March */
  function calMonth(i) { return ((i + 3) % 12) + 1; }
  function calYear(ty, i) { return ty + (i >= 9 ? 1 : 0); }
  function tyLabel(ty) { return ty + '-' + pad((ty + 1) % 100, 2); }
  function monthLabel(ty, i, lang) { return tl('m' + calMonth(i), lang) + ' ' + calYear(ty, i); }
  var today = new Date();
  var CUR_TY = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  var TYS = [CUR_TY - 2, CUR_TY - 1, CUR_TY, CUR_TY + 1];

  /* ---------------- state ---------------- */
  function defForm() {
    return { tenant: '', landlord: '', pan: '', address: '', org: '', ty: CUR_TY, from: 0, to: 11, rent: 15000, changes: [],
      mode: 'upi', chqNo: '', chqBank: '', chqSeries: true, rd: 'last', rday: 1, prefix: 'RR-', startNo: 1, stamp: 'auto', layout: '3', rlang: 'page' };
  }
  function cleanForm(f) {
    f = f && typeof f === 'object' ? f : {};
    var d = defForm(), o = {};
    o.tenant = str(f.tenant, 90); o.landlord = str(f.landlord, 90); o.pan = str(f.pan, 12); o.address = str(f.address, 260); o.org = str(f.org, 90);
    var ty = parseInt(f.ty, 10); o.ty = ty >= 2000 && ty <= 2099 ? ty : d.ty;
    var a = parseInt(f.from, 10), b = parseInt(f.to, 10);
    o.from = a >= 0 && a <= 11 ? a : 0; o.to = b >= 0 && b <= 11 ? b : 11;
    if (o.to < o.from) o.to = o.from;
    o.rent = f.rent === '' ? '' : num(f.rent);
    o.changes = Array.isArray(f.changes) ? f.changes.slice(0, 11).map(function (c) {
      c = c && typeof c === 'object' ? c : {}; var i = parseInt(c.from, 10);
      return { from: i >= 0 && i <= 11 ? i : 0, rent: num(c.rent) };
    }) : [];
    o.mode = ['cash', 'upi', 'bank', 'cheque'].indexOf(f.mode) >= 0 ? f.mode : d.mode;
    o.chqNo = str(f.chqNo, 12); o.chqBank = str(f.chqBank, 40); o.chqSeries = f.chqSeries !== false;
    o.rd = f.rd === 'day' ? 'day' : 'last';
    var rday = parseInt(f.rday, 10); o.rday = rday >= 1 && rday <= 31 ? rday : 1;
    o.prefix = typeof f.prefix === 'string' ? f.prefix.slice(0, 16) : d.prefix;
    var sn = parseInt(f.startNo, 10); o.startNo = sn >= 1 && sn <= 99999 ? sn : 1;
    o.stamp = ['auto', 'all', 'none'].indexOf(f.stamp) >= 0 ? f.stamp : 'auto';
    o.layout = f.layout === '1' ? '1' : '3';
    o.rlang = f.rlang === 'en' ? 'en' : 'page';
    return o;
  }
  function defHra() { return { basic: 480000, hra: 216000, rent: null, city: 'pune' }; }
  function cleanHra(h) {
    h = h && typeof h === 'object' ? h : {};
    return { basic: num(h.basic, 1e11), hra: num(h.hra, 1e11), rent: h.rent === null || h.rent === undefined ? null : num(h.rent, 1e11),
      city: R.cities.indexOf(h.city) >= 0 ? h.city : 'pune' };
  }
  var form = cleanForm(store.get('form', defForm()));
  var hra = cleanHra(store.get('hra', defHra()));
  var ui = (function (u) { u = u && typeof u === 'object' ? u : {}; return { tab: u.tab === 'hra' ? 'hra' : 'rec' }; })(store.get('ui', {}));
  var sets = (function (a) {
    return Array.isArray(a) ? a.slice(0, 200).filter(function (x) { return x && typeof x === 'object' && x.f; })
      .map(function (x) { return { uid: str(x.uid, 40) || uid(), f: cleanForm(x.f) }; }) : [];
  })(store.get('sets', []));
  function saveAll() { store.set('form', form); store.set('hra', hra); store.set('ui', ui); }
  function isSample() { return !form.tenant.trim() && !form.landlord.trim(); }

  /* ---------------- the receipt engine ---------------- */
  /* rent for month index i: the base rent, then each change from its month on (the latest change wins) */
  function rentFor(f, i) {
    var r = num(f.rent), best = -1;
    f.changes.forEach(function (c) { if (c.from <= i && c.from >= best) { best = c.from; r = num(c.rent); } });
    return r;
  }
  function chequeFor(f, k) {
    var no = String(f.chqNo || '').trim();
    if (!no) return '';
    if (!f.chqSeries || !/^\d{1,15}$/.test(no)) return no;
    return pad(Number(no) + k, no.length);
  }
  function build(f) {
    var list = [], skipped = 0, total = 0;
    for (var i = f.from; i <= f.to; i++) {
      var rent = rentFor(f, i);
      if (rent <= 0) { skipped++; continue; }
      var k = list.length, m = calMonth(i), y = calYear(f.ty, i), last = daysIn(m, y);
      var day = f.rd === 'day' ? Math.min(f.rday, last) : last;
      list.push({ i: i, m: m, y: y, rent: rent, no: (f.prefix || '') + pad(f.startNo + k, 2),
        date: pad(day, 2) + '/' + pad(m, 2) + '/' + y, cheque: f.mode === 'cheque' ? chequeFor(f, k) : '',
        stamp: f.stamp === 'all' || (f.stamp === 'auto' && f.mode === 'cash' && rent > R.stampLimit) });
      total += rent;
    }
    var pan = cleanPan(f.pan);
    return { list: list, skipped: skipped, total: total, pan: pan, panOk: !pan || PAN_RE.test(pan),
      panState: total > R.panLimit ? (pan ? 'have' : 'need') : 'not' };
  }

  /* ---------------- HRA exemption (old regime) ---------------- */
  function isMetro(city, ty) { return !!(R.metro[city] && R.metro[city] <= ty); }
  function calcHRA(basic, hraRec, rent, city, ty) {
    var pct = isMetro(city, ty) ? R.hra.metro : R.hra.other;
    var l1 = Math.max(0, hraRec), l2 = Math.max(0, rent - R.hra.rentShare * basic), l3 = pct * basic;
    var lim = [l1, l2, l3], min = Math.min(l1, l2, l3), at = lim.indexOf(min);
    var exempt = Math.max(0, Math.round(min));
    return { pct: pct, l1: Math.round(l1), l2: Math.round(l2), l3: Math.round(l3), at: at, exempt: exempt,
      taxable: Math.max(0, Math.round(hraRec) - exempt), none: rent > 0 && l2 <= 0 };
  }

  /* ---------------- receipt HTML (white paper in light and dark mode) ---------------- */
  function receiptHTML(f, r, L, sample) {
    function sv(v, key) { return v && String(v).trim() ? String(v).trim() : (sample ? tl(key, L) : ''); }
    var tenant = sv(f.tenant, 's_tenant'), landlord = sv(f.landlord, 's_landlord'), addr = sv(f.address, 's_address'), org = sv(f.org, 's_org');
    var month = monthLabel(f.ty, r.i, L), dir = EDU.langInfo(L).dir;
    var body = tlHtml(addr ? 'r_body' : 'r_body_na', L, {
      tenant: '<span class="nm">' + (esc(tenant) || '__________') + '</span>', amt: '<span class="amt num">' + esc(inr(r.rent)) + '</span>',
      words: '<bdi dir="ltr" class="wd">' + esc(words(r.rent)) + '</bdi>', addr: esc(addr), month: '<b>' + esc(month) + '</b>' });
    var mode = esc(tl('mode_' + f.mode, L));
    if (f.mode === 'cheque' && r.cheque) mode += ' · ' + tlHtml('r_cheque', L, { no: '<span class="num">' + esc(r.cheque) + '</span>' });
    if (f.mode === 'cheque' && f.chqBank.trim()) mode += ' · ' + esc(f.chqBank.trim());
    var pan = cleanPan(f.pan);
    var h = '<div class="rc" dir="' + dir + '" lang="' + L + '">';
    h += '<div class="rc-top"><div>' + (org ? '<div class="rc-org">' + esc(org) + '</div>' : '') +
      '<div class="rc-title">' + esc(tl('r_title', L)) + '</div><div class="rc-for">' + esc(tl('r_for', L, { month: month })) + '</div></div>' +
      '<div class="rc-meta"><div>' + esc(tl('r_no', L)) + ': <b class="num rc-no">' + esc(r.no) + '</b></div><div>' + esc(tl('r_date', L)) + ': <b class="num">' + esc(r.date) + '</b></div></div></div>';
    h += '<p class="rc-body">' + body + '</p>';
    h += '<div class="rc-row"><span>' + esc(tl('r_mode', L)) + ': <b>' + mode + '</b></span>' +
      (landlord ? '<span>' + esc(tl('r_landlord', L)) + ': <b>' + esc(landlord) + '</b></span>' : '') +
      (pan ? '<span>' + esc(tl('r_pan', L)) + ': <b class="num rc-pan">' + esc(pan) + '</b></span>' : '') + '</div>';
    h += '<div class="rc-foot"><div class="rc-amt num">' + esc(inr(r.rent)) + '</div><div class="rc-right">' +
      (r.stamp ? '<div class="rc-stamp">' + esc(tl('r_stamp', L)) + '<br>₹' + R.stampValue + '</div>' : '') +
      '<div class="rc-sign"><div style="height:11mm"></div><div class="ln">' + (esc(landlord) || '&nbsp;') + '</div><div class="lc">' + esc(tl('r_sign', L)) + '</div></div></div></div>';
    return h + '</div>';
  }
  function pagesHTML(f, res, L, sample) {
    var per = f.layout === '1' ? 1 : 3, out = '', n = Math.ceil(res.list.length / per);
    for (var p = 0; p < n; p++) {
      out += '<div class="pg' + (per === 1 ? ' one' : '') + '">';
      res.list.slice(p * per, p * per + per).forEach(function (r) { out += '<div class="slot">' + receiptHTML(f, r, L, sample) + '</div>'; });
      out += '<div class="pg-no" lang="' + L + '">' + esc(tl('page_n', L, { n: p + 1, m: n })) + '</div></div>';
    }
    return out;
  }
  function fit(wrap) {
    var pages = wrap.firstElementChild; if (!pages) return;
    var w = wrap.clientWidth - 24; if (w <= 0) return;
    var s = Math.min(1, w / pages.offsetWidth);
    pages.style.transform = 'scale(' + s + ')';
    wrap.style.height = Math.max(60, Math.ceil(pages.offsetHeight * s) + 24) + 'px';
  }

  /* ---------------- form <-> state ---------------- */
  function fillSelect(sel, items, value) {
    sel.innerHTML = '';
    items.forEach(function (it) { sel.appendChild(el('option', { value: it.value, text: it.text })); });
    sel.value = String(value);
  }
  function monthItems() { var a = []; for (var i = 0; i < 12; i++) a.push({ value: String(i), text: monthLabel(form.ty, i, EDU.lang) }); return a; }
  function pressed(attr, val) { $$('[data-' + attr + ']').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-' + attr) === String(val) ? 'true' : 'false'); }); }

  function renderStatic() {
    fillSelect($('#ty'), TYS.map(function (y) { return { value: String(y), text: t('ty_opt', { year: tyLabel(y) }) }; }), form.ty);
    fillSelect($('#fromM'), monthItems(), form.from);
    fillSelect($('#toM'), monthItems(), form.to);
    fillSelect($('#hCity'), R.cities.map(function (c) { return { value: c, text: t('city_' + c) }; }), hra.city);
    $('#stampAutoBtn').textContent = t('stamp_auto', { limit: fmtN(R.stampLimit) });
    var sh = t('stamp_hint', { limit: fmtN(R.stampLimit), v: R.stampValue });
    $('#stampHint').textContent = sh; $('#ruleStamp').textContent = sh;
    $('#rulePan').textContent = t('rule_pan', { limit: fmtN(R.panLimit) });
    $('#rulesTitle').textContent = t('rules_title', { year: tyLabel(R.rulesYear) });
    var c = R.checked.split('-'); $('#ruleSrc').textContent = t('rule_source', { date: c[2] + '-' + c[1] + '-' + c[0] });
    $('#rlang').hidden = false; $('#rlang').closest('.f').hidden = EDU.lang === 'en';
    $$('#tabs [role=tab]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tab === ui.tab ? 'true' : 'false'); });
    $('#p-rec').hidden = ui.tab !== 'rec'; $('#p-hra').hidden = ui.tab !== 'hra';
    renderSetPick();
  }
  function renderSetPick() {
    var sel = $('#setPick'), cur = sel.value || '';
    fillSelect(sel, [{ value: '', text: t('choose_set') }].concat(sets.map(function (x) {
      return { value: x.uid, text: x.f.tenant + (x.f.landlord ? ' → ' + x.f.landlord : '') };
    })), cur);
    if (sel.value !== cur) sel.value = '';
    $('#setDel').hidden = !sel.value;
  }
  function fillForm() {
    $$('[data-k]').forEach(function (i) { i.value = form[i.dataset.k] || ''; });
    $('#ty').value = String(form.ty); $('#fromM').value = String(form.from); $('#toM').value = String(form.to);
    $('#rent').value = form.rent === '' ? '' : form.rent;
    $('#chqSeries').checked = form.chqSeries; $('#rday').value = form.rday; $('#startNo').value = form.startNo;
    $('#rlang').value = form.rlang;
    pressed('mode', form.mode); pressed('rd', form.rd); pressed('stamp', form.stamp); pressed('layout', form.layout);
    $('#chequeBox').hidden = form.mode !== 'cheque'; $('#dayBox').hidden = form.rd !== 'day';
    $('#hBasic').value = hra.basic; $('#hHra').value = hra.hra; $('#hCity').value = hra.city;
    renderChanges();
  }
  function renderChanges() {
    var box = $('#changes'); box.innerHTML = '';
    form.changes.forEach(function (c, n) {
      var sel = el('select', { onchange: function (e) { c.from = parseInt(e.target.value, 10); changed(); } });
      fillSelect(sel, monthItems(), c.from);
      box.appendChild(el('div', { class: 'chg' },
        el('label', { class: 'f' }, el('span', { class: 'lbl', i18n: 'change_from' }), sel),
        el('label', { class: 'f' }, el('span', { class: 'lbl', i18n: 'change_rent' }),
          el('input', { type: 'text', class: 'num-in chg-rent', inputmode: 'numeric', autocomplete: 'off', value: c.rent || '', oninput: function (e) { c.rent = num(e.target.value); changed(); } })),
        el('button', { type: 'button', class: 'btn btn-danger del', text: '✕', 'aria-label': t('remove_change'), title: t('remove_change'),
          onclick: function () { form.changes.splice(n, 1); renderChanges(); changed(); } })));
    });
    $('#addChange').hidden = form.changes.length >= 11;
  }

  var last = null;
  function receiptLang() { return form.rlang === 'en' ? 'en' : EDU.lang; }
  function render() {
    var res = build(form), sample = isSample();
    last = res;
    $('#sampleBanner').hidden = !sample;
    var pb = $('#panBad'); pb.hidden = res.panOk;
    $('#pan').setAttribute('aria-invalid', res.panOk ? 'false' : 'true');
    var tot = $('#sumTotal');
    tot.textContent = inr(res.total); tot.dataset.value = res.total; tot.dataset.count = res.list.length;
    $('#sumCount').textContent = t('sum_count', { n: fmtN(res.list.length) });
    $('#sumWords').textContent = res.total ? words(res.total) : '';
    $('#rentZero').hidden = res.list.length > 0;
    var sk = $('#skipped'); sk.hidden = !(res.skipped && res.list.length); sk.textContent = t('months_skipped', { n: res.skipped });
    var pn = $('#panNote');
    pn.hidden = !res.total; pn.dataset.state = res.panState;
    pn.className = 'callout small ' + (res.panState === 'need' ? 'warning' : res.panState === 'have' ? 'success' : '');
    pn.textContent = t('pan_' + res.panState, { amt: inr(res.total), limit: inr(R.panLimit) });
    $('#printBtn').disabled = !res.list.length; $('#copyBtn').disabled = !res.list.length;
    var pages = $('#pages');
    pages.innerHTML = pagesHTML(form, res, receiptLang(), sample);
    $('#pvWrap').hidden = !res.list.length;
    fit($('#pvWrap'));
    renderHra();
  }
  function hraRent() { return hra.rent === null ? (last ? last.total : 0) : hra.rent; }
  function renderHra() {
    var rent = hraRent(), rIn = $('#hRent');
    if (document.activeElement !== rIn) rIn.value = rent;
    var r = calcHRA(hra.basic, hra.hra, rent, hra.city, form.ty);
    var ex = $('#hExempt'); ex.textContent = inr(r.exempt); ex.dataset.value = r.exempt; ex.dataset.taxable = r.taxable;
    $('#hTaxable').textContent = t('h_taxable') + ': ' + inr(r.taxable);
    var cityTxt = t('city_' + hra.city) + ' · ' + t(isMetro(hra.city, form.ty) ? 'h_metro' : 'h_nonmetro');
    var rows = [
      [t('h_l1'), '', r.l1],
      [t('h_l2'), inr(rent) + ' − 10% × ' + inr(hra.basic) + ' = ' + inr(r.l2), r.l2],
      [t('h_l3', { pct: Math.round(r.pct * 100) + '%', city: cityTxt }), Math.round(r.pct * 100) + '% × ' + inr(hra.basic) + ' = ' + inr(r.l3), r.l3]
    ];
    var tb = $('#hWork'); tb.innerHTML = '';
    rows.forEach(function (x, n) {
      tb.appendChild(el('tr', { class: n === r.at ? 'min' : '' },
        el('td', null, x[0], n === r.at ? el('span', { class: 'badge success', i18n: 'h_smallest' }) : null, x[1] ? el('span', { class: 'calc', text: x[1] }) : null),
        el('td', { class: 'v', text: inr(x[2]) })));
    });
    $('#hNone').hidden = !r.none;
  }
  function changed() { saveAll(); render(); }

  /* ---------------- events ---------------- */
  $$('#tabs [role=tab]').forEach(function (b) { b.addEventListener('click', function () { ui.tab = b.dataset.tab; saveAll(); renderStatic(); render(); }); });
  $$('[data-k]').forEach(function (i) { i.addEventListener('input', function () { form[i.dataset.k] = i.value; changed(); }); });
  $('#ty').addEventListener('change', function () { form.ty = parseInt(this.value, 10); renderStatic(); fillForm(); changed(); });
  $('#fromM').addEventListener('change', function () { form.from = parseInt(this.value, 10); if (form.to < form.from) { form.to = form.from; $('#toM').value = String(form.to); } changed(); });
  $('#toM').addEventListener('change', function () { form.to = parseInt(this.value, 10); if (form.to < form.from) { form.from = form.to; $('#fromM').value = String(form.from); } changed(); });
  $('#rent').addEventListener('input', function () { form.rent = this.value.trim() === '' ? '' : num(this.value); changed(); });
  $('#addChange').addEventListener('click', function () {
    if (form.changes.length >= 11) return;
    var prev = form.changes.length ? form.changes[form.changes.length - 1] : null;
    var from = Math.min(11, prev ? prev.from + 1 : Math.max(form.from + 1, Math.min(form.to, 7)));
    var base = prev ? prev.rent : num(form.rent);
    form.changes.push({ from: from, rent: Math.round(base * 1.05 / 100) * 100 });
    renderChanges(); changed();
    var ins = $$('#changes .chg-rent'); if (ins.length) ins[ins.length - 1].focus();
  });
  $$('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { form.mode = b.dataset.mode; pressed('mode', form.mode); $('#chequeBox').hidden = form.mode !== 'cheque'; changed(); }); });
  $$('[data-rd]').forEach(function (b) { b.addEventListener('click', function () { form.rd = b.dataset.rd; pressed('rd', form.rd); $('#dayBox').hidden = form.rd !== 'day'; changed(); }); });
  $$('[data-stamp]').forEach(function (b) { b.addEventListener('click', function () { form.stamp = b.dataset.stamp; pressed('stamp', form.stamp); changed(); }); });
  $$('[data-layout]').forEach(function (b) { b.addEventListener('click', function () { form.layout = b.dataset.layout; pressed('layout', form.layout); changed(); }); });
  $('#chqSeries').addEventListener('change', function () { form.chqSeries = this.checked; changed(); });
  $('#rday').addEventListener('input', function () { var d = parseInt(latinDigits(this.value), 10); if (d >= 1 && d <= 31) { form.rday = d; changed(); } });
  $('#startNo').addEventListener('input', function () { var d = parseInt(latinDigits(this.value), 10); if (d >= 1 && d <= 99999) { form.startNo = d; changed(); } });
  $('#rlang').addEventListener('change', function () { form.rlang = this.value; changed(); });

  /* HRA calculator */
  $('#hBasic').addEventListener('input', function () { hra.basic = num(this.value, 1e11); changed(); });
  $('#hHra').addEventListener('input', function () { hra.hra = num(this.value, 1e11); changed(); });
  $('#hRent').addEventListener('input', function () { hra.rent = this.value.trim() === '' ? 0 : num(this.value, 1e11); changed(); });
  $('#hUseRec').addEventListener('click', function () { hra.rent = null; $('#hRent').value = last ? last.total : 0; changed(); });
  $('#hCity').addEventListener('change', function () { hra.city = this.value; changed(); });

  /* saved tenants */
  $('#setSave').addEventListener('click', function () {
    if (!form.tenant.trim()) { EDU.toast(t('need_tenant')); $('#tenant').focus(); return; }
    var cur = $('#setPick').value, rec = null;
    sets.forEach(function (x) { if (x.uid === cur || (!cur && x.f.tenant === form.tenant && x.f.landlord === form.landlord)) rec = x; });
    if (!rec) { rec = { uid: uid() }; sets.push(rec); }
    rec.f = cleanForm(JSON.parse(JSON.stringify(form)));
    store.set('sets', sets);
    renderSetPick(); $('#setPick').value = rec.uid; $('#setDel').hidden = false;
    EDU.toast(t('set_saved', { name: form.tenant }));
  });
  $('#setPick').addEventListener('change', function () {
    var id = this.value, rec = null; sets.forEach(function (x) { if (x.uid === id) rec = x; });
    $('#setDel').hidden = !rec;
    if (!rec) return;
    form = cleanForm(JSON.parse(JSON.stringify(rec.f)));
    renderStatic(); $('#setPick').value = id; $('#setDel').hidden = false; fillForm(); changed();
  });
  $('#setDel').addEventListener('click', function () {
    var id = $('#setPick').value; if (!id || !confirm(t('confirm_delete'))) return;
    sets = sets.filter(function (x) { return x.uid !== id; });
    store.set('sets', sets); $('#setPick').value = ''; renderSetPick(); EDU.toast(t('set_deleted'));
  });

  /* print, copy, reset */
  $('#printBtn').addEventListener('click', function () {
    if (!last || !last.list.length) return;
    $('#printRoot').innerHTML = '<div class="pages">' + $('#pages').innerHTML + '</div>';
    window.print();
  });
  function summaryText() {
    var res = last, L = EDU.lang, s = isSample();
    if (!res || !res.list.length) return '';
    var name = function (v, k) { return v.trim() || (s ? t(k) : ''); };
    var lines = ['*' + t('wa_head', { from: monthLabel(form.ty, res.list[0].i, L), to: monthLabel(form.ty, res.list[res.list.length - 1].i, L) }) + '*'];
    if (name(form.tenant, 's_tenant')) lines.push(t('r_tenant') + ': ' + name(form.tenant, 's_tenant'));
    if (name(form.landlord, 's_landlord')) lines.push(t('r_landlord') + ': ' + name(form.landlord, 's_landlord') + (res.pan ? ' (PAN ' + res.pan + ')' : ''));
    if (name(form.address, 's_address')) lines.push(name(form.address, 's_address').replace(/\s*\n\s*/g, ', '));
    lines.push('');
    res.list.forEach(function (r) { lines.push(monthLabel(form.ty, r.i, L) + ' · ' + inr(r.rent) + ' · ' + t('mode_' + form.mode) + (r.cheque ? ' ' + r.cheque : '') + ' · ' + r.no); });
    lines.push('', '*' + t('sum_total') + ': ' + inr(res.total) + '*', words(res.total));
    return lines.join('\n');
  }
  $('#copyBtn').addEventListener('click', function () { var s = summaryText(); if (s) EDU.copy(s); });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['form', 'hra', 'ui', 'sets'].forEach(function (k) { store.remove(k); });
    form = defForm(); hra = defHra(); ui = { tab: 'rec' }; sets = [];
    $('#setPick').value = ''; renderStatic(); fillForm(); render();
  });

  /* ---------------- boot ---------------- */
  window.addEventListener('resize', function () { fit($('#pvWrap')); });
  if (window.ResizeObserver) new ResizeObserver(function () { fit($('#pvWrap')); }).observe($('#pvWrap'));
  EDU.onLang(function () { renderStatic(); fillForm(); render(); });
  renderStatic(); fillForm(); render();

  /* exposed for the interaction test */
  window.RRM = { build: build, calcHRA: calcHRA, words: words, rentFor: rentFor, summaryText: summaryText, get form() { return form; } };
})();
