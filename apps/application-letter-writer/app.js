/* Application & Letter Writer: ready formats for everyday formal letters in 12 languages.
   Letter text comes from window.APP_CONTENT (content.js), one natural version per language.
   No AI model and no network calls: the letter is put together from the template and what the user types.
   Everything is saved only on this device with EDU.store. */
(function () {
  'use strict';
  var SLUG = 'application-letter-writer';
  var $ = EDU.$, t = EDU.t, el = EDU.el, esc = EDU.esc;
  var C = window.APP_CONTENT;
  var store = EDU.store(SLUG);
  var BLANK = '__________';

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- letter types ----------------
     org: which kind of office the letter goes to (also picks the sample name and the field label)
     f:   the extra fields this letter needs (see FIELDS)
     close: which closing line of the language to use */
  var GROUPS = [
    ['g_leave', ['leave_school', 'leave_college', 'leave_office', 'sick_leave']],
    ['g_bank', ['bank_passbook', 'bank_address', 'bank_close']],
    ['g_school', ['tc_request', 'fee_concession']],
    ['g_complaint', ['complaint_electricity', 'complaint_municipal']],
    ['g_job', ['job_application', 'resignation', 'experience_certificate']]
  ];
  var TYPES = {
    leave_school: { org: 'school', close: 'close_st', f: ['cls', 'roll', 'from', 'todate', 'reason'] },
    leave_college: { org: 'college', close: 'close_st', f: ['course', 'roll', 'from', 'todate', 'reason'] },
    leave_office: { org: 'company', f: ['desig', 'from', 'todate', 'reason'] },
    sick_leave: { org: 'company', f: ['from', 'todate', 'illness'] },
    bank_passbook: { org: 'bank', f: ['acc', 'item', 'reason'] },
    bank_address: { org: 'bank', f: ['acc', 'newaddr'] },
    bank_close: { org: 'bank', f: ['acc', 'reason'] },
    tc_request: { org: 'school', close: 'close_st', f: ['cls', 'roll', 'reason'] },
    fee_concession: { org: 'school', close: 'close_st', f: ['cls', 'roll', 'reason'] },
    complaint_electricity: { org: 'elec', f: ['cons', 'addr', 'since', 'problem'] },
    complaint_municipal: { org: 'muni', f: ['addr', 'since', 'problem'] },
    job_application: { org: 'company', f: ['post', 'qual', 'exp'] },
    resignation: { org: 'company', f: ['desig', 'lastday', 'reason'] },
    experience_certificate: { org: 'company', f: ['desig', 'wfrom', 'wto'] }
  };
  var TYPE_IDS = Object.keys(TYPES);

  /* kind: text | area | date | item      half: sits in half a row on wide screens
     perType: the value is remembered separately for each letter type */
  var FIELDS = {
    name: { kind: 'text' }, to: { kind: 'text', perType: true }, org: { kind: 'text' }, city: { kind: 'text' },
    date: { kind: 'date' },
    cls: { kind: 'text', half: true }, course: { kind: 'text', half: true }, roll: { kind: 'text', half: true },
    desig: { kind: 'text' },
    from: { kind: 'date', half: true }, todate: { kind: 'date', half: true },
    since: { kind: 'date' }, lastday: { kind: 'date' }, wfrom: { kind: 'date', half: true }, wto: { kind: 'date', half: true },
    reason: { kind: 'text', perType: true }, illness: { kind: 'text', perType: true }, problem: { kind: 'area', perType: true },
    acc: { kind: 'text' }, item: { kind: 'item' }, newaddr: { kind: 'area' }, addr: { kind: 'area' }, cons: { kind: 'text' },
    post: { kind: 'text' }, qual: { kind: 'text' }, exp: { kind: 'text' },
    mobile: { kind: 'text' }
  };
  var REASON_KEYS = { reason: 1, illness: 1, problem: 1 };

  /* ---------------- state ---------------- */
  var state = store.get('state', null);
  if (!state || typeof state !== 'object') state = {};
  if (!TYPES[state.type]) state.type = 'leave_school';
  if (state.ll !== 'auto' && !C[state.ll]) state.ll = 'auto';
  if (!state.v || typeof state.v !== 'object') state.v = {};
  function save() { store.set('state', state); }

  function letterLang() { return state.ll === 'auto' ? (C[EDU.lang] ? EDU.lang : 'en') : state.ll; }
  function fieldList() { return ['name', 'to', 'org', 'city', 'date'].concat(TYPES[state.type].f, ['mobile']); }
  function skey(key) {
    if (key === 'org') return 'org_' + TYPES[state.type].org;
    return FIELDS[key].perType ? key + '@' + state.type : key;
  }

  /* ---------------- dates ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return (d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3])) ? d : null;
  }
  function plusDays(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; }
  function defaultDate(key) {
    if (key === 'date' || key === 'wto') return iso(plusDays(0));
    if (key === 'from') return iso(plusDays(1));
    if (key === 'todate') return iso(plusDays(3));
    if (key === 'since') return iso(plusDays(-7));
    if (key === 'lastday') return iso(plusDays(30));
    if (key === 'wfrom') { var d = plusDays(0); d.setDate(1); d.setFullYear(d.getFullYear() - 2); return iso(d); }
    return '';
  }
  /* 14 November 2026 in the letter language, always with Western digits */
  function fmtDate(isoStr, lang) {
    var d = parseIso(isoStr);
    if (!d) return '';
    try {
      return new Intl.DateTimeFormat(lang + '-IN-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    } catch (e) {
      return pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + '-' + d.getFullYear();
    }
  }
  function daysBetween(a, b) { return Math.round((parseIso(b) - parseIso(a)) / 86400000) + 1; }

  /* ---------------- values ---------------- */
  function raw(key) {
    var v = state.v[skey(key)];
    if (v === undefined && FIELDS[key].kind === 'date') return defaultDate(key);
    if (key === 'item') return v === 'atm' ? 'atm' : 'passbook';
    return String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  }
  function sampleOf(key, L) {
    var c = L.c, tt = L.t[state.type], T = TYPES[state.type];
    switch (key) {
      case 'name': return c.s_name;
      case 'org': return c['s_' + T.org];
      case 'city': return c.s_city;
      case 'cls': return c.s_cls;
      case 'course': return c.s_course;
      case 'roll': return '15';
      case 'desig': return c.s_desig;
      case 'reason': case 'illness': case 'problem': return tt.s.reason || '';
      case 'acc': return '00000000000';
      case 'cons': return '000000';
      case 'addr': case 'newaddr': return c.s_addr;
      case 'post': case 'qual': case 'exp': return tt.s[key] || '';
      case 'to': return tt.to;
    }
    return '';
  }
  /* sample mode = nothing typed yet in any text box of this letter (the mobile number and "to whom" do not count) */
  function isSample() {
    return !fieldList().some(function (k) {
      var kind = FIELDS[k].kind;
      return (kind === 'text' || kind === 'area') && k !== 'mobile' && k !== 'to' && raw(k);
    });
  }
  function fill(str, map) { return str.replace(/\{(\w+)\}/g, function (m, k) { return map[k] !== undefined ? map[k] : m; }); }

  /* ---------------- build the letter ---------------- */
  function build() {
    var ll = letterLang(), L = C[ll], c = L.c, T = TYPES[state.type], tt = L.t[state.type];
    var has = {}; T.f.forEach(function (k) { has[k] = 1; });
    var sample = isSample(), swapped = false, days = 0;
    /* in a right-to-left letter, "8-B" would show as "B-8": a left-to-right mark in front keeps it in order */
    function ltr(v) { return (ll === 'ur' && /^\d[ -~]*[A-Za-z]/.test(v)) ? '‎' + v : v; }
    function val(k) { return ltr(raw(k) || (sample ? sampleOf(k, L) : BLANK)); }
    function opt(k) { return ltr(raw(k) || (sample ? sampleOf(k, L) : '')); }
    function dt(k) { return fmtDate(raw(k), ll) || BLANK; }

    var map = { name: val('name'), org: val('org'), city: val('city') };
    if (has.cls) map.cls = val('cls');
    if (has.course) map.cls = val('course');
    if (has.desig) map.desig = val('desig');
    if (has.acc) map.acc = val('acc');
    if (has.cons) map.cons = val('cons');
    if (has.addr) map.addr = val('addr');
    if (has.newaddr) map.addr = val('newaddr');
    if (has.item) map.item = c[raw('item')];
    ['post', 'qual', 'exp'].forEach(function (k) { if (has[k]) map[k] = val(k); });
    ['reason', 'illness', 'problem'].forEach(function (k) { if (has[k]) map.reason = val(k); });
    if (has.since) map.from = dt('since');
    if (has.lastday) map.to = dt('lastday');
    if (has.wfrom) { map.from = dt('wfrom'); map.to = dt('wto'); }
    if (has.from) {
      var a = raw('from'), b = raw('todate');
      if (a && b && b < a) { var x = a; a = b; b = x; swapped = true; }
      if (a && b && a !== b) {
        days = daysBetween(a, b);
        map.period = fill(c.range, { from: fmtDate(a, ll), to: fmtDate(b, ll), days: String(days) });
      } else if (a || b) {
        days = 1;
        map.period = fill(c.one, { from: fmtDate(a || b, ll) });
      } else {
        map.period = fill(c.range, { from: BLANK, to: BLANK, days: '____' });
      }
    }

    var comma = ll === 'ur' ? '،' : ',';
    function withComma(s) { return /[,،.:;]$/.test(s) ? s : s + comma; }
    var sign = [c[T.close || 'close'], map.name];
    function sig(label, v) { if (v) sign.push(label + ': ' + v); }
    if (has.cls) sig(c.l_cls, opt('cls'));
    if (has.course) sig(c.l_cls, opt('course'));
    if (has.roll) sig(c.l_roll, opt('roll'));
    if (has.desig) sig(c.l_desig, opt('desig'));
    if (has.acc) sig(c.l_acc, opt('acc'));
    if (has.cons) sig(c.l_cons, opt('cons'));
    sig(c.l_mobile, raw('mobile'));

    var blocks = [
      { k: 'to', lines: [c.to, withComma(raw('to') || tt.to), withComma(map.org), map.city] },
      { k: 'date', lines: [c.date + ' ' + dt('date')] },
      { k: 'subj', lines: [c.subject + ' ' + fill(tt.subj, map)] },
      { k: 'sal', lines: [c.sal] }
    ];
    tt.body.forEach(function (p) { blocks.push({ k: 'p', lines: [fill(p, map)] }); });
    blocks.push({ k: 'thanks', lines: [c.thanks] });
    blocks.push({ k: 'sign', lines: sign });

    var text = blocks.map(function (b) { return b.lines.join('\n'); }).join('\n\n');
    var html = blocks.map(function (b) {
      return '<p class="lt lt-' + b.k + '">' + b.lines.map(esc).join('<br>') + '</p>';
    }).join('');
    return { lang: ll, text: text, html: html, sample: sample, swapped: swapped, days: days, blank: text.indexOf(BLANK) >= 0 };
  }

  /* ---------------- render ---------------- */
  var current = null;
  function paperAttrs(node, ll) {
    node.setAttribute('lang', ll);
    node.setAttribute('dir', EDU.langInfo(ll).dir === 'rtl' ? 'rtl' : 'ltr');
  }
  function renderLetter() {
    current = build();
    var box = $('#letter');
    paperAttrs(box, current.lang);
    box.innerHTML = current.html;
    box.dataset.lang = current.lang;
    box.dataset.type = state.type;
    box.dataset.sample = current.sample ? '1' : '0';
    box.dataset.days = String(current.days);
    $('#sampleBanner').hidden = !current.sample;
    $('#dateWarn').hidden = !current.swapped;
    $('#blankNote').hidden = !current.blank;
  }

  function labelKey(key) {
    if (key === 'org') { var o = TYPES[state.type].org; return 'f_org_' + (o === 'elec' || o === 'muni' ? 'office' : o); }
    return 'f_' + key;
  }
  function placeholders() {
    var L = C[letterLang()];
    fieldList().forEach(function (k) {
      var kind = FIELDS[k].kind;
      if (kind !== 'text' && kind !== 'area') return;
      var inp = $('#f_' + k);
      if (inp) inp.placeholder = k === 'mobile' ? '' : sampleOf(k, L);
    });
  }
  function renderFields() {
    var wrap = $('#fields');
    wrap.innerHTML = '';
    fieldList().forEach(function (k) {
      var F = FIELDS[k], id = 'f_' + k, inp;
      if (F.kind === 'item') {
        inp = el('select', { id: id },
          el('option', { value: 'passbook', text: t('item_passbook') }),
          el('option', { value: 'atm', text: t('item_atm') }));
        inp.value = raw('item');
      } else if (F.kind === 'area') {
        inp = el('textarea', { id: id, rows: '2', maxlength: '300', class: 'no-i18n' });
        inp.value = state.v[skey(k)] || '';
      } else if (F.kind === 'date') {
        inp = el('input', { id: id, type: 'date', class: 'no-i18n' });
        inp.value = raw(k);
      } else {
        inp = el('input', { id: id, type: 'text', maxlength: '120', autocomplete: 'off', class: 'no-i18n' });
        if (k === 'mobile') { inp.setAttribute('inputmode', 'tel'); inp.setAttribute('maxlength', '20'); }
        inp.value = state.v[skey(k)] || '';
      }
      function onChange() { state.v[skey(k)] = inp.value; save(); renderLetter(); }
      inp.addEventListener('input', onChange);
      inp.addEventListener('change', onChange);
      wrap.appendChild(el('label', { class: 'field' + (F.half ? ' half' : ''), for: id }, el('span', { text: t(labelKey(k)) }), inp));
    });
    placeholders();
  }
  function renderPickers() {
    var sel = $('#type');
    sel.innerHTML = '';
    GROUPS.forEach(function (g) {
      var og = el('optgroup', { label: t(g[0]) });
      g[1].forEach(function (id) { og.appendChild(el('option', { value: id, text: t('ty_' + id) })); });
      sel.appendChild(og);
    });
    sel.value = state.type;
    var ls = $('#letterLang');
    ls.innerHTML = '';
    ls.appendChild(el('option', { value: 'auto', text: t('same_as_app') }));
    EDU.LANGS.forEach(function (l) { if (C[l.code]) ls.appendChild(el('option', { value: l.code, text: l.native })); });
    ls.value = state.ll;
  }
  function renderAll() { renderPickers(); renderFields(); renderLetter(); }

  /* ---------------- events ---------------- */
  $('#type').addEventListener('change', function () {
    if (TYPES[this.value]) { state.type = this.value; save(); renderFields(); renderLetter(); }
  });
  $('#letterLang').addEventListener('change', function () {
    state.ll = (this.value === 'auto' || C[this.value]) ? this.value : 'auto';
    save(); placeholders(); renderLetter();
  });
  $('#clearBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    state.v = {}; save(); renderFields(); renderLetter();
  });
  $('#copyBtn').addEventListener('click', function () { EDU.copy(current.text); });
  $('#downloadBtn').addEventListener('click', function () {
    EDU.download('letter-' + state.type.replace(/_/g, '-') + '.txt', '﻿' + current.text.replace(/\n/g, '\r\n'), 'text/plain');
  });
  function fillPrint() {
    var root = $('#printRoot');
    root.innerHTML = '';
    var paper = el('div', { class: 'alw-paper', html: current.html });
    paperAttrs(paper, current.lang);
    root.appendChild(paper);
  }
  $('#printBtn').addEventListener('click', function () { fillPrint(); window.print(); });
  window.addEventListener('beforeprint', fillPrint);

  EDU.onLang(renderAll);
  renderAll();

  /* for the interaction test and for curious learners in the console */
  window.ALW = {
    types: TYPE_IDS,
    text: function () { return current.text; },
    build: build,
    preview: function (type, lang) {            // letter text for any type and language with the current details
      var keepT = state.type, keepL = state.ll, out;
      state.type = type; state.ll = lang; out = build().text; state.type = keepT; state.ll = keepL;
      return out;
    }
  };
})();
