/* Letter & Application Writer: 22 Indian formal-letter formats, filled from a form, live preview,
   print (A4), copy, .txt, drafts saved on this device only (EDU.store).
   - The form follows the app language; the letter follows the "letter language" (default: same as the app).
   - Letter text comes from content.js (APP_CONTENT[lang]); [[male|female]] picks the writer's grammatical gender,
     {key} is filled with what the user typed. What the user types is never translated. */
(function () {
  'use strict';
  var SLUG = 'letter-writer';
  var C = window.APP_CONTENT;
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, el = EDU.el;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var BLANK = '__________';
  var GROUPS = [
    { id: 'school', ic: '🎒' }, { id: 'bank', ic: '🏦' }, { id: 'work', ic: '💼' },
    { id: 'civic', ic: '🏘️' }, { id: 'consumer', ic: '🛒' }, { id: 'rti', ic: '📜' }
  ];
  /* sal: resp | dear; close: student | faithful | sincere; sig: extra lines under the name; ph: show mobile */
  var SCHOOL = { g: 'school', sal: 'resp', close: 'student', sig: ['sig_class'], ph: false };
  var BANK = { g: 'bank', sal: 'dear', close: 'faithful', sig: [], ph: true };
  var WORK = { g: 'work', sal: 'dear', close: 'sincere', sig: ['sig_work'], ph: true };
  var CIVIC = { g: 'civic', sal: 'dear', close: 'faithful', sig: [], ph: true };
  function mk(base, id, f, extra) { var o = { id: id, f: f }; for (var k in base) o[k] = base[k]; for (var j in (extra || {})) o[j] = extra[j]; return o; }
  var TPLS = [
    mk(SCHOOL, 'sick_leave', ['class_sec', 'from_date', 'to_date', 'illness']),
    mk(SCHOOL, 'family_leave', ['class_sec', 'from_date', 'to_date', 'occasion']),
    mk(SCHOOL, 'fee_concession', ['class_sec', 'guardian', 'guardian_job', 'situation']),
    mk(SCHOOL, 'tc_request', ['class_sec', 'adm_no', 'reason']),
    mk(SCHOOL, 'bonafide', ['class_sec', 'adm_no', 'purpose']),
    mk(SCHOOL, 'apology', ['class_sec', 'incident_date', 'mistake']),
    mk(BANK, 'mobile_change', ['acct4', 'old_mobile', 'new_mobile']),
    mk(BANK, 'kyc_update', ['acct4', 'new_address']),
    mk(BANK, 'cheque_book', ['acct4', 'leaves']),
    mk(BANK, 'card_block', ['acct4', 'card4', 'lost_date', 'lost_place']),
    mk(BANK, 'account_close', ['acct4', 'reason']),
    mk(BANK, 'statement', ['acct4', 'from_date', 'to_date', 'purpose']),
    mk(WORK, 'work_leave', ['emp_desig', 'dept', 'from_date', 'to_date', 'reason']),
    mk(WORK, 'wfh', ['emp_desig', 'dept', 'from_date', 'to_date', 'reason']),
    mk(WORK, 'resignation', ['emp_desig', 'dept', 'last_day', 'reason']),
    mk(WORK, 'experience_letter', ['emp_desig', 'dept', 'emp_id', 'join_date', 'last_day'], { sig: ['sig_work', 'sig_emp'] }),
    mk(CIVIC, 'electricity', ['consumer_no', 'since_date', 'problem'], { sig: ['sig_consumer'] }),
    mk(CIVIC, 'water', ['since_date', 'problem']),
    mk(CIVIC, 'garbage', ['area', 'problem']),
    mk(CIVIC, 'society', ['flat_no', 'problem'], { sig: ['sig_flat'] }),
    mk(CIVIC, 'refund', ['product', 'order_no', 'buy_date', 'price', 'defect', 'remedy'], { g: 'consumer' }),
    mk(CIVIC, 'rti', ['info', 'period', 'fee_mode'], { g: 'rti' })
  ];
  var TBY = {}; TPLS.forEach(function (x) { TBY[x.id] = x; });
  /* field types; c = common (shared by all letters), otherwise saved per letter */
  var FD = {
    name: { c: 1 }, address: { c: 1, ta: 1 }, phone: { c: 1, type: 'tel' }, place: { c: 1 }, date: { c: 1, type: 'date' },
    class_sec: { c: 1 }, adm_no: { c: 1 }, acct4: { c: 1, d4: 1 }, emp_desig: { c: 1 }, dept: { c: 1 }, emp_id: { c: 1 },
    to_desig: {}, to_org: {}, to_addr: { ta: 1, wide: 1 },
    from_date: { type: 'date' }, to_date: { type: 'date' }, incident_date: { type: 'date' }, lost_date: { type: 'date' },
    last_day: { type: 'date' }, join_date: { type: 'date' }, since_date: { type: 'date' }, buy_date: { type: 'date' },
    illness: { wide: 1 }, occasion: { wide: 1 }, guardian: {}, guardian_job: {}, situation: { ta: 1, wide: 1 },
    reason: { wide: 1 }, purpose: { wide: 1 }, mistake: { ta: 1, wide: 1 }, old_mobile: { type: 'tel' }, new_mobile: { type: 'tel' },
    new_address: { ta: 1, wide: 1 }, leaves: { d3: 1 }, card4: { d4: 1 }, lost_place: {}, consumer_no: {},
    problem: { ta: 1, wide: 1 }, area: { wide: 1 }, flat_no: {}, product: { wide: 1 }, order_no: {}, price: {},
    defect: { ta: 1, wide: 1 }, remedy: { wide: 1 }, info: { ta: 1, wide: 1, big: 1 }, period: { wide: 1 }, fee_mode: { wide: 1 },
    encl: { ta: 1, wide: 1 }
  };
  /* sample dates, in days from today (per letter) */
  var DATES = {
    date: 0, from_date: 0, to_date: 2, incident_date: -1, lost_date: 0, since_date: -7, buy_date: -12, join_date: -1095, last_day: 30,
    'family_leave.from_date': 3, 'family_leave.to_date': 5, 'work_leave.from_date': 7, 'work_leave.to_date': 9,
    'wfh.from_date': 3, 'wfh.to_date': 16, 'statement.from_date': -183, 'statement.to_date': 0, 'experience_letter.last_day': -7
  };
  var HINTS = { acct4: 'hint_last4', card4: 'hint_last4', info: 'hint_info', encl: 'hint_encl', place: 'hint_place', name: 'hint_name' };

  function has(o, k) { return !!o && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k); }
  function isLang(L) { return has(C, L) && EDU.LANGS.some(function (x) { return x.code === L; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  }
  function addDays(n) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); }

  /* ---------------- state ---------------- */
  function defaults() { return { tpl: 'sick_leave', ll: 'auto', lay: 'std', gen: 'f', c: {}, p: {}, did: null }; }
  var S = normalize(store.get('cur', null)) || defaults();
  var drafts = (function () { var d = store.get('drafts', []); return Array.isArray(d) ? d.filter(function (x) { return x && typeof x.id === 'string' && x.s; }).slice(0, 40) : []; })();
  var group = TBY[S.tpl].g;

  function str(v, max) { return v === undefined || v === null ? undefined : String(v).slice(0, max || 2000); }
  function normVals(o) {
    var r = {}; if (!o || typeof o !== 'object') return r;
    Object.keys(FD).forEach(function (k) { if (has(o, k)) { var v = str(o[k]); if (v !== undefined) r[k] = v; } });
    return r;
  }
  function normalize(x) {
    if (!x || typeof x !== 'object') return null;
    var s = defaults();
    if (has(TBY, x.tpl)) s.tpl = x.tpl;
    if (x.ll === 'auto' || isLang(x.ll)) s.ll = x.ll;
    if (x.lay === 'exam') s.lay = 'exam';
    if (x.gen === 'm') s.gen = 'm';
    s.c = normVals(x.c);
    if (x.p && typeof x.p === 'object') Object.keys(x.p).forEach(function (id) { if (has(TBY, id)) s.p[id] = normVals(x.p[id]); });
    if (typeof x.did === 'string') s.did = x.did.slice(0, 40);
    return s;
  }
  function save() { store.set('cur', S); }
  function LL() { return S.ll === 'auto' ? (isLang(EDU.lang) ? EDU.lang : 'en') : S.ll; }
  function bag(id, k) { if (FD[k] && FD[k].c) return S.c; if (!S.p[id]) S.p[id] = {}; return S.p[id]; }
  function fieldsOf(id) {
    var T = TBY[id], out = ['name', 'address'];
    if (T.ph) out.push('phone');
    out.push('place', 'date');
    T.f.forEach(function (k) { if (FD[k].c) out.push(k); });
    out.push('to_desig', 'to_org', 'to_addr');
    T.f.forEach(function (k) { if (!FD[k].c) out.push(k); });
    out.push('encl');
    return out;
  }
  function sampleOf(L, id, k) {
    if (FD[k] && FD[k].type === 'date') { var dk = has(DATES, id + '.' + k) ? DATES[id + '.' + k] : DATES[k]; return addDays(dk || 0); }
    var c = isLang(L) ? C[L] : C.en, tp = c.tpl[id];
    if (tp && has(tp.ex, k)) return tp.ex[k];
    if (k === 'encl') return tp ? tp.encl : '';
    return has(c.sample, k) ? c.sample[k] : '';
  }
  function fillMissing(id) {
    var L = LL();
    fieldsOf(id).forEach(function (k) { var b = bag(id, k); if (!has(b, k)) b[k] = sampleOf(L, id, k); });
  }
  /* letter language changed: swap untouched example values to the new language's examples */
  function swapSamples(oldL, newL) {
    if (oldL === newL) return;
    Object.keys(S.c).forEach(function (k) {
      TPLS.some(function (T) { if (S.c[k] === sampleOf(oldL, T.id, k)) { S.c[k] = sampleOf(newL, S.tpl, k); return true; } return false; });
    });
    Object.keys(S.p).forEach(function (id) {
      var b = S.p[id];
      Object.keys(b).forEach(function (k) { if (b[k] === sampleOf(oldL, id, k)) b[k] = sampleOf(newL, id, k); });
    });
  }

  /* ---------------- letter model ---------------- */
  function fmtDate(v, L, long) {
    var d = parseIso(v); if (!d) return '';
    if (!long) return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
    try { return new Intl.DateTimeFormat(EDU.langInfo(L).tag + '-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(d); }
    catch (e) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  }
  function gender(s) { return String(s).replace(/\[\[([^|\]]*)\|([^\]]*)\]\]/g, function (m, a, b) { return S.gen === 'm' ? a : b; }); }
  function daysBetween(a, b) {
    var x = parseIso(a), y = parseIso(b); if (!x || !y) return 0;
    var n = Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()) - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000) + 1;
    return n >= 1 && n <= 3660 ? n : 0;
  }
  function vals(id, L) {
    var F = C[L].fmt, v = {};
    fieldsOf(id).forEach(function (k) {
      var raw = (bag(id, k)[k] || '').trim();
      if (FD[k].type === 'date') raw = fmtDate(raw, L, false);
      else if (k === 'address' || k === 'to_addr' || k === 'new_address') raw = raw.split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean).join(', ');
      v[k] = raw;
    });
    var n = daysBetween(bag(id, 'from_date').from_date, bag(id, 'to_date').to_date);
    v.days = n ? (n === 1 ? F.day_one : F.day_n.replace('{n}', String(n))) : '';
    return v;
  }
  /* "text {key} text" -> [{t, k}] parts: k = 'v' (user value), 'b' (blank) or '' (letter text) */
  function parts(tpl, v) {
    var out = [], re = /\{(\w+)\}/g, last = 0, m, s = gender(tpl);
    while ((m = re.exec(s))) {
      if (m.index > last) out.push({ t: s.slice(last, m.index), k: '' });
      var x = has(v, m[1]) ? v[m[1]] : m[0];
      out.push(x ? { t: x, k: 'v' } : { t: BLANK, k: 'b' });
      last = re.lastIndex;
    }
    if (last < s.length) out.push({ t: s.slice(last), k: '' });
    return out;
  }
  function lines(raw) { return String(raw || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean); }
  /* blocks: [{cls, rows:[ [parts] ], lbl?}] */
  function build() {
    var id = S.tpl, T = TBY[id], L = LL(), c = C[L], F = c.fmt, tp = c.tpl[id], v = vals(id, L), B = [];
    function P(s) { return parts(s, v); }
    function V(k) { return v[k] ? [{ t: v[k], k: 'v' }] : [{ t: BLANK, k: 'b' }]; }
    function raw(k) { return lines(bag(id, k)[k]); }
    var dateLong = fmtDate(bag(id, 'date').date, L, true);
    if (S.lay === 'exam') {
      B.push({ cls: 'blk from', rows: [[{ t: F.exam_hall, k: '' }], V('place'), dateLong ? [{ t: dateLong, k: 'v' }] : V('date')] });
    } else {
      var fr = [[{ t: F.from, k: '', b: 1 }], V('name')];
      var ad = raw('address'); (ad.length ? ad : ['']).forEach(function (x) { fr.push(x ? [{ t: x, k: 'v' }] : V('address')); });
      if (T.ph && v.phone) fr.push(P(F.sig_mobile));
      B.push({ cls: 'blk from', rows: fr });
    }
    var to = [[{ t: F.to, k: '', b: 1 }], V('to_desig'), V('to_org')];
    raw('to_addr').forEach(function (x) { to.push([{ t: x, k: 'v' }]); });
    B.push({ cls: 'blk to', rows: to });
    if (S.lay !== 'exam') B.push({ cls: 'blk date', rows: [[{ t: F.date + ' ', k: '', b: 1 }].concat(V('date'))] });
    B.push({ cls: 'blk subj', rows: [[{ t: F.subject + ' ', k: '', b: 1 }].concat(P(tp.subject))] });
    B.push({ cls: 'blk sal', rows: [[{ t: gender(F[T.sal === 'resp' ? 'sal_resp' : 'sal_dear']), k: '' }]] });
    var body = [];
    tp.body.forEach(function (para) {
      if (para === '{info}') { var li = raw('info'); body.push({ list: 1, p: li.length ? [{ t: li.join('\n'), k: 'v' }] : [{ t: BLANK, k: 'b' }] }); }
      else body.push({ p: P(para) });
    });
    B.push({ cls: 'body', paras: body });
    var sg = [[{ t: gender(F.thanks), k: '' }], [{ t: gender(F['close_' + T.close]), k: '' }], 'gap', V('name')];
    T.sig.forEach(function (s) { sg.push(P(F[s])); });
    B.push({ cls: 'blk sig', rows: sg });
    if (S.lay !== 'exam') B.push({ cls: 'blk place', rows: [[{ t: F.place + ' ', k: '', b: 1 }].concat(V('place'))] });
    var en = raw('encl');
    if (en.length) {
      var er = [[{ t: F.encl, k: '', b: 1 }]];
      en.forEach(function (x, i) { er.push([{ t: (i + 1) + '. ' + x, k: 'v' }]); });
      B.push({ cls: 'blk encl', rows: er });
    }
    return { L: L, blocks: B, subject: P(tp.subject) };
  }
  function partsHtml(ps) {
    return ps.map(function (p) {
      var e = EDU.esc(p.t);
      if (p.k === 'v') return '<span class="v">' + e + '</span>';
      if (p.k === 'b') return '<span class="blank">' + e + '</span>';
      return p.b ? '<span class="lbl">' + e + '</span>' : e;
    }).join('');
  }
  function partsText(ps) { return ps.map(function (p) { return p.t; }).join(''); }
  function toHtml(m) {
    return m.blocks.map(function (b) {
      if (b.paras) return '<div class="body">' + b.paras.map(function (p) { return '<p' + (p.list ? ' class="list"' : '') + '>' + partsHtml(p.p) + '</p>'; }).join('') + '</div>';
      return '<div class="' + b.cls + '">' + b.rows.map(function (r) {
        if (r === 'gap') return '<div class="sig-gap"></div>';
        return '<p>' + partsHtml(r) + '</p>';
      }).join('') + '</div>';
    }).join('');
  }
  function toText(m) {
    return m.blocks.map(function (b) {
      if (b.paras) return b.paras.map(function (p) { return partsText(p.p); }).join('\n\n');
      return b.rows.map(function (r) { return r === 'gap' ? '' : partsText(r); }).join('\n');
    }).join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n';
  }

  /* ---------------- UI ---------------- */
  function renderPicker() {
    var g = $('#groups'); g.innerHTML = '';
    GROUPS.forEach(function (G) {
      g.appendChild(el('button', { type: 'button', 'aria-pressed': String(G.id === group), dataset: { g: G.id },
        onclick: function () { group = G.id; renderPicker(); } }, G.ic + ' ' + t('g_' + G.id)));
    });
    var tl = $('#tpls'); tl.innerHTML = '';
    TPLS.filter(function (T) { return T.g === group; }).forEach(function (T) {
      tl.appendChild(el('button', { type: 'button', 'aria-pressed': String(T.id === S.tpl), dataset: { tpl: T.id },
        onclick: function () { choose(T.id); } }, t('t_' + T.id)));
    });
  }
  function choose(id) {
    if (!has(TBY, id)) return;
    S.tpl = id; group = TBY[id].g; S.did = null;
    fillMissing(id); save(); renderPicker(); renderForm(); renderPreview();
  }
  function renderOpts() {
    var sel = $('#letterLang'), cur = S.ll; sel.innerHTML = '';
    sel.appendChild(el('option', { value: 'auto' }, t('same_lang', { lang: EDU.langInfo(EDU.lang).native })));
    EDU.LANGS.forEach(function (l) { sel.appendChild(el('option', { value: l.code }, l.native + (l.code === 'en' ? '' : ' (' + l.name + ')'))); });
    sel.value = cur;
    Array.prototype.forEach.call(document.querySelectorAll('#laySeg button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.lay === S.lay)); });
    Array.prototype.forEach.call(document.querySelectorAll('#genSeg button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.gen === S.gen)); });
    $('#layHint').textContent = t(S.lay === 'exam' ? 'exam_hint' : 'std_hint');
  }
  function fieldEl(id, k) {
    var d = FD[k], b = bag(id, k), fid = 'f-' + k, inp;
    if (d.ta) inp = el('textarea', { id: fid, class: 'no-i18n', rows: d.big ? 4 : 2, maxlength: 2000 });
    else inp = el('input', { id: fid, class: 'no-i18n', type: d.type || 'text', autocomplete: 'off', maxlength: d.d4 ? 4 : (d.d3 ? 3 : 300) });
    if (d.d4 || d.d3) { inp.setAttribute('inputmode', 'numeric'); inp.setAttribute('pattern', '[0-9]*'); }
    if (k === 'name') inp.setAttribute('autocomplete', 'name');
    inp.value = b[k] || '';
    inp.addEventListener('input', function () {
      var val = inp.value;
      if (d.d4 || d.d3) { var clean = val.replace(/\D/g, '').slice(0, d.d4 ? 4 : 3); if (clean !== val) { inp.value = clean; if (d.d4) EDU.toast(t('digits_only')); } val = clean; }
      bag(S.tpl, k)[k] = val; save(); renderPreview();
    });
    var f = el('div', { class: 'field' + (d.wide || d.ta ? ' wide' : '') }, el('label', { for: fid }, t('f_' + k)), inp);
    if (HINTS[k]) f.appendChild(el('p', { class: 'fhint' }, t(HINTS[k])));
    return f;
  }
  function renderForm() {
    var id = S.tpl, fs = fieldsOf(id), you = $('#fYou'), to = $('#fTo'), det = $('#fDet');
    you.innerHTML = ''; to.innerHTML = ''; det.innerHTML = '';
    fs.forEach(function (k) {
      var box = FD[k].c ? you : (/^to_(desig|org|addr)$/.test(k) ? to : det);
      box.appendChild(fieldEl(id, k));
    });
    var tl = $('#tips'); tl.innerHTML = '';
    var tc = (isLang(EDU.lang) ? C[EDU.lang] : C.en).tpl[id];
    tc.tips.forEach(function (x) { tl.appendChild(el('li', {}, x)); });
  }
  function renderPreview() {
    var m = build(), sh = $('#sheet');
    sh.setAttribute('lang', m.L);
    sh.setAttribute('dir', EDU.langInfo(m.L).dir);
    sh.dataset.tpl = S.tpl;
    sh.innerHTML = toHtml(m);
    $('#pvLang').textContent = t('letter_in', { lang: EDU.langInfo(m.L).native });
  }
  function renderDrafts() {
    var box = $('#drafts'); box.innerHTML = '';
    $('#noDrafts').hidden = drafts.length > 0;
    drafts.forEach(function (d) {
      var when = new Date(d.at || 0), ws = isNaN(when) ? '' : fmtDate(iso(when), 'en', false) + ' ' + pad(when.getHours()) + ':' + pad(when.getMinutes());
      var nm = has(TBY, d.s && d.s.tpl) ? t('t_' + d.s.tpl) : '';
      box.appendChild(el('div', { class: 'draft', dataset: { id: d.id } },
        el('div', { class: 'dt' }, el('b', {}, d.title || nm), el('span', {}, nm + ' · ' + ws)),
        el('button', { type: 'button', class: 'btn btn-sm btn-primary d-open', onclick: function () { openDraft(d.id); } }, t('open_draft')),
        el('button', { type: 'button', class: 'btn btn-sm btn-danger d-del', 'aria-label': t('delete'), onclick: function () { delDraft(d.id); } }, '🗑')));
    });
  }
  function renderAll() { renderPicker(); renderOpts(); renderForm(); renderPreview(); renderDrafts(); EDU.apply(document.getElementById('app')); }

  /* ---------------- actions ---------------- */
  function saveDraft() {
    var m = build(), title = partsText(m.subject).slice(0, 120), now = Date.now();
    var who = (S.c.name || '').trim(); if (who) title = who + ': ' + title;
    var copy = JSON.parse(JSON.stringify(S));
    var ex = S.did && drafts.filter(function (d) { return d.id === S.did; })[0];
    if (ex) { ex.s = copy; ex.at = now; ex.title = title; drafts = [ex].concat(drafts.filter(function (d) { return d !== ex; })); }
    else {
      S.did = 'd' + now.toString(36) + Math.random().toString(36).slice(2, 6);
      copy.did = S.did;
      drafts.unshift({ id: S.did, at: now, title: title, s: copy });
      drafts = drafts.slice(0, 40);
    }
    var ok = store.set('drafts', drafts); save();
    renderDrafts();
    EDU.toast(ok === false ? t('not_saved') : t('draft_saved'));
  }
  function openDraft(id) {
    var d = drafts.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    var s = normalize(d.s); if (!s) return;
    s.did = d.id; S = s; group = TBY[S.tpl].g; fillMissing(S.tpl); save();
    renderAll();
    EDU.toast(t('draft_opened'));
  }
  function delDraft(id) {
    if (!confirm(t('confirm_delete'))) return;
    drafts = drafts.filter(function (x) { return x.id !== id; });
    if (S.did === id) S.did = null;
    store.set('drafts', drafts); save(); renderDrafts();
  }
  function fileName() { return 'letter-' + S.tpl.replace(/_/g, '-') + '-' + (bag(S.tpl, 'date').date || addDays(0)) + '.txt'; }
  function doPrint() {
    var pr = $('#printRoot'); pr.innerHTML = '';
    pr.appendChild($('#sheet').cloneNode(true)).removeAttribute('id');
    window.print();
  }
  window.addEventListener('beforeprint', function () {
    var pr = $('#printRoot');
    if (!pr.firstChild) pr.appendChild($('#sheet').cloneNode(true)).removeAttribute('id');
  });
  window.addEventListener('afterprint', function () { $('#printRoot').innerHTML = ''; });

  $('#letterLang').addEventListener('change', function () {
    var v = this.value, oldL = LL();
    S.ll = v === 'auto' || isLang(v) ? v : 'auto';
    swapSamples(oldL, LL()); fillMissing(S.tpl); save(); renderForm(); renderPreview();
  });
  $('#laySeg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-lay]'); if (!b) return;
    S.lay = b.dataset.lay === 'exam' ? 'exam' : 'std'; save(); renderOpts(); renderPreview();
  });
  $('#genSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-gen]'); if (!b) return;
    S.gen = b.dataset.gen === 'm' ? 'm' : 'f'; save(); renderOpts(); renderPreview();
  });
  $('#btnSample').addEventListener('click', function () {
    var L = LL(), id = S.tpl;
    fieldsOf(id).forEach(function (k) { bag(id, k)[k] = sampleOf(L, id, k); });
    save(); renderForm(); renderPreview();
  });
  $('#btnClear').addEventListener('click', function () {
    var id = S.tpl;
    fieldsOf(id).forEach(function (k) { bag(id, k)[k] = k === 'date' ? addDays(0) : ''; });
    save(); renderForm(); renderPreview();
  });
  $('#btnReset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    S = defaults(); group = TBY[S.tpl].g; drafts = [];
    store.remove('drafts'); fillMissing(S.tpl); save(); renderAll();
  });
  $('#btnPrint').addEventListener('click', doPrint);
  $('#btnCopy').addEventListener('click', function () { EDU.copy(toText(build())); });
  $('#btnTxt').addEventListener('click', function () { EDU.download(fileName(), '﻿' + toText(build()).replace(/\n/g, '\r\n'), 'text/plain'); });
  $('#btnSave').addEventListener('click', saveDraft);
  $('#goPreview').addEventListener('click', function () { $('#previewCol').scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  var lastLang = EDU.lang;
  EDU.onLang(function () {
    var oldL = S.ll === 'auto' ? (isLang(lastLang) ? lastLang : 'en') : S.ll;
    lastLang = EDU.lang;
    swapSamples(oldL, LL()); fillMissing(S.tpl); save(); renderAll();
  });

  window.__letterTest = { text: function () { return toText(build()); }, state: function () { return JSON.parse(JSON.stringify(S)); } };
  fillMissing(S.tpl); save(); renderAll();
})();
