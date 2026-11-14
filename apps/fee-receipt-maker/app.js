/* Fee Receipt Maker: fee receipts for schools, coaching classes and tuition teachers.
   Two copies (office + parent) on one A4 page, amount in words (window.FEE_WORDS, words.js), a small list of
   past receipts on the device with CSV export. Nothing leaves the device. */
(function () {
  'use strict';
  var SLUG = 'fee-receipt-maker';
  var W = window.FEE_WORDS;
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc;
  var MAX_HEADS = 8, MAX_AMT = 99999999, MAX_HIST = 300;
  var PRESETS = ['tuition', 'exam', 'transport', 'other'];
  var MODES = ['cash', 'upi', 'bank', 'cheque', 'card'];

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
  var ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function latinDigits(s) {
    return String(s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var cp = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (cp >= ZEROS[i] && cp <= ZEROS[i] + 9) return String(cp - ZEROS[i]);
      return c;
    });
  }
  /* whole rupees, never negative, never NaN */
  function num(v) {
    var s = latinDigits(v == null ? '' : v).replace(/[₹,\s]/g, '');
    if (!s) return 0;
    var n = parseFloat(s);
    if (!isFinite(n) || n < 0) return 0;
    return Math.round(Math.min(MAX_AMT, n));
  }
  var NF = (function () { try { return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }); } catch (e) { return null; } })();
  function fmtN(n) { n = Math.round(n || 0); return NF ? NF.format(n) : String(n); }
  function inr(n) { return '₹' + fmtN(Math.abs(n)); }
  function words(n, L) { return tl('words_rs', L, { w: W.say(Math.round(Math.abs(n || 0)), L) }); }
  function pad(n, len) { n = String(n); while (n.length < len) n = '0' + n; return n; }
  function str(v, max) { return typeof v === 'string' ? v.slice(0, max) : ''; }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }
  function showDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; }
  /* R-0007 -> R-0008, 99 -> 100, "A" -> "A1" */
  function incNo(s) {
    s = String(s || '').trim();
    var m = /^(.*?)(\d+)(\D*)$/.exec(s);
    if (!m) return (s || 'R-') + '1';
    var d = m[2];
    if (d.length > 15) return s + '-1';
    return m[1] + pad(String(Number(d) + 1), d.length) + m[3];
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------------- state ---------------- */
  function nextNo() { var last = store.get('lastNo', ''); return last ? incNo(last) : 'R-0001'; }
  function blank() {
    return { no: nextNo(), date: todayISO(), period: '', student: '', cls: '', roll: '', parent: '',
      heads: [{ k: 'tuition', label: '', amt: 2500 }, { k: 'exam', label: '', amt: 300 }, { k: 'transport', label: '', amt: 800 }],
      concession: 0, late: 0, paid: '', mode: 'cash', ref: '', recvby: '' };
  }
  function cleanForm(o) {
    var b = blank();
    if (!o || typeof o !== 'object') return b;
    var f = { no: str(o.no, 20) || b.no, date: /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? o.date : b.date, period: str(o.period, 40),
      student: str(o.student, 60), cls: str(o.cls, 40), roll: str(o.roll, 20), parent: str(o.parent, 60),
      concession: num(o.concession), late: num(o.late), paid: (o.paid === '' || o.paid == null) ? '' : num(o.paid),
      mode: MODES.indexOf(o.mode) >= 0 ? o.mode : 'cash', ref: str(o.ref, 30), recvby: str(o.recvby, 50), heads: [] };
    (Array.isArray(o.heads) ? o.heads : []).slice(0, MAX_HEADS).forEach(function (h) {
      if (!h || typeof h !== 'object') return;
      f.heads.push({ k: PRESETS.indexOf(h.k) >= 0 ? h.k : 'other', label: str(h.label, 40), amt: num(h.amt) });
    });
    if (!f.heads.length) f.heads.push({ k: 'tuition', label: '', amt: 0 });
    return f;
  }
  function cleanInst(o) {
    o = o && typeof o === 'object' ? o : {};
    var logo = str(o.logo, 400000);
    return { name: str(o.name, 80), addr: str(o.addr, 120), contact: str(o.contact, 80), logo: /^data:image\//.test(logo) ? logo : '' };
  }
  var inst = cleanInst(store.get('inst', null));
  var form = cleanForm(store.get('form', null));
  var hist = (function () {
    var h = store.get('hist', []);
    return (Array.isArray(h) ? h : []).filter(function (r) { return r && typeof r === 'object' && r.f; }).slice(0, MAX_HIST)
      .map(function (r) { return { f: cleanForm(r.f), at: Number(r.at) || 0 }; });
  })();
  var enReceipt = !!store.get('en', false);
  function saveState() { store.set('form', form); store.set('inst', inst); }

  /* ---------------- sums ---------------- */
  function calc(f) {
    var sub = 0;
    f.heads.forEach(function (h) { sub += num(h.amt); });
    var conc = Math.min(num(f.concession), sub);
    var late = num(f.late);
    var total = sub - conc + late;
    var paid = f.paid === '' ? total : num(f.paid);
    return { sub: sub, conc: conc, late: late, total: total, paid: paid, bal: total - paid };
  }
  function isSample() { return !inst.name.trim() && !form.student.trim(); }
  function docLang() { return enReceipt ? 'en' : EDU.lang; }
  function headName(h, L) { return h.label.trim() || tl('head_' + h.k, L); }

  /* ---------------- the receipt ---------------- */
  function buildCopy(copyKey, L, f, sample) {
    var c = calc(f);
    function sv(v, key) { return v && String(v).trim() ? String(v).trim() : (sample ? tl(key, L) : ''); }
    function kv(key, val, cls) { return val ? '<div' + (cls ? ' class="' + cls + '"' : '') + '><span>' + esc(tl(key, L)) + ':</span> <b>' + esc(val) + '</b></div>' : ''; }
    function money(n) { return '<bdi dir="ltr">' + fmtN(n) + '</bdi>'; }
    var name = sv(inst.name, 's_inst'), addr = sv(inst.addr, 's_addr'), contact = sv(inst.contact, 's_contact');
    var student = sv(f.student, 's_student'), recv = sv(f.recvby, 's_recvby');
    var h = '<div class="rc" lang="' + L + '" dir="' + (L === 'ur' ? 'rtl' : 'ltr') + '">';
    h += '<div class="rc-top">' + (inst.logo ? '<img class="rc-logo" alt="" src="' + esc(inst.logo) + '">' : '') +
      '<div class="rc-inst"><div class="rc-name">' + (esc(name) || '&nbsp;') + '</div>' +
      (addr ? '<div class="rc-addr">' + esc(addr) + '</div>' : '') + (contact ? '<div class="rc-contact">' + esc(contact) + '</div>' : '') + '</div>' +
      '<div class="rc-tag"><div class="rc-title">' + esc(tl('r_title', L)) + '</div><div class="rc-copy">' + esc(tl(copyKey, L)) + '</div></div></div>';
    h += '<div class="rc-meta"><div><span>' + esc(tl('r_no', L)) + ':</span> <b class="rc-no"><bdi>' + esc(f.no) + '</bdi></b></div>' +
      '<div><span>' + esc(tl('r_date', L)) + ':</span> <b><bdi dir="ltr">' + esc(showDate(f.date)) + '</bdi></b></div></div>';
    h += '<div class="rc-grid">' +
      '<div class="wide"><span>' + esc(tl('r_student', L)) + ':</span> <b class="rc-student">' + esc(student) + '</b></div>' +
      kv('r_class', sv(f.cls, 's_class')) + kv('r_roll', sv(f.roll, 's_roll')) +
      kv('r_parentname', sv(f.parent, 's_parent'), 'wide') + kv('r_period', sv(f.period, 's_period'), 'wide') + '</div>';
    h += '<table class="rc-tbl"><thead><tr><th class="sn">#</th><th>' + esc(tl('r_particulars', L)) + '</th><th class="n">' + esc(tl('r_amount', L)) + '</th></tr></thead><tbody>';
    f.heads.forEach(function (x, i) {
      h += '<tr class="hd"><td class="sn">' + (i + 1) + '</td><td>' + esc(headName(x, L)) + '</td><td class="n">' + money(num(x.amt)) + '</td></tr>';
    });
    if (c.conc) h += '<tr class="sum"><td class="sn"></td><td>' + esc(tl('r_concession', L)) + '</td><td class="n">− ' + money(c.conc) + '</td></tr>';
    if (c.late) h += '<tr class="sum"><td class="sn"></td><td>' + esc(tl('r_late', L)) + '</td><td class="n">+ ' + money(c.late) + '</td></tr>';
    h += '<tr class="tot"><td class="sn"></td><td>' + esc(tl('r_total', L)) + '</td><td class="n rc-total">₹ ' + money(c.total) + '</td></tr>';
    h += '<tr class="sum"><td class="sn"></td><td>' + esc(tl('r_paid', L)) + '</td><td class="n rc-paid">₹ ' + money(c.paid) + '</td></tr>';
    h += '<tr class="sum"><td class="sn"></td><td>' + esc(tl(c.bal < 0 ? 'r_advance' : 'r_balance', L)) + '</td><td class="n rc-bal">₹ ' + money(Math.abs(c.bal)) + '</td></tr>';
    h += '</tbody></table>';
    h += '<div class="rc-words"><span>' + esc(tl('r_words', L)) + ':</span> <b class="rc-w">' + esc(words(c.paid, L)) + '</b></div>';
    h += '<div class="rc-foot"><div><div><span class="k">' + esc(tl('r_mode', L)) + ':</span> <b>' + esc(tl('mode_' + f.mode, L)) + '</b></div>' +
      (f.ref.trim() ? '<div><span class="k">' + esc(tl('r_ref', L)) + ':</span> <b><bdi>' + esc(f.ref.trim()) + '</bdi></b></div>' : '') + '</div>' +
      '<div class="rc-sign"><div class="ln">' + (esc(recv) || '&nbsp;') + '</div><div class="lc">' + esc(tl('r_recvby', L)) + ' · ' + esc(tl('r_sign', L)) + '</div></div></div>';
    return h + '</div>';
  }
  function buildSheet(f) {
    var L = docLang(), s = isSample();
    return '<div class="sheet">' + buildCopy('r_office', L, f, s) +
      '<div class="cut" lang="' + L + '"><span aria-hidden="true">✂</span> ' + esc(tl('r_cut', L)) + '</div>' + buildCopy('r_parent', L, f, s) + '</div>';
  }

  /* build the sheet off-screen and shrink the text step by step until both copies fit their half of the page */
  function fitSheet() {
    var root = $('#printRoot');
    root.innerHTML = buildSheet(form);
    var sheet = $('.sheet', root), sizes = [9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6], used = sizes[sizes.length - 1];
    for (var i = 0; i < sizes.length; i++) {
      sheet.style.setProperty('--fs', sizes[i] + 'pt');
      if ($$('.rc', sheet).every(function (r) { return r.lastElementChild.getBoundingClientRect().bottom <= r.getBoundingClientRect().bottom + 0.5; })) { used = sizes[i]; break; }
    }
    return used;
  }

  /* ---------------- render ---------------- */
  function renderHeads() {
    var box = $('#heads');
    box.innerHTML = '';
    form.heads.forEach(function (h, i) {
      var name = el('input', { type: 'text', class: 'no-i18n head-name', maxlength: 40, value: headName(h, EDU.lang), 'aria-label': t('f_head'), autocomplete: 'off' });
      name.addEventListener('input', function () {
        h.label = name.value === t('head_' + h.k) ? '' : name.value.slice(0, 40);
        if (!name.value.trim()) h.label = '';
        saveState(); renderOut();
      });
      name.addEventListener('blur', function () { if (!name.value.trim()) name.value = headName(h, EDU.lang); });
      var amt = el('input', { type: 'text', inputmode: 'numeric', class: 'amt no-i18n head-amt', maxlength: 12, value: h.amt ? String(h.amt) : '', placeholder: '0', 'aria-label': t('f_amount'), autocomplete: 'off' });
      amt.addEventListener('input', function () { h.amt = num(amt.value); saveState(); renderOut(); });
      var del = el('button', { type: 'button', class: 'btn btn-ghost head-del', 'aria-label': t('del_head'), title: t('del_head'), text: '✕' });
      del.disabled = form.heads.length <= 1;
      del.addEventListener('click', function () { form.heads.splice(i, 1); saveState(); renderHeads(); renderOut(); });
      box.appendChild(el('div', { class: 'head-row' }, name, amt, del));
    });
    $('#addHead').disabled = form.heads.length >= MAX_HEADS;
  }
  function fillForm() {
    $$('[data-f]').forEach(function (inp) {
      var k = inp.dataset.f, v = form[k];
      inp.value = (k === 'concession' || k === 'late') ? (v ? String(v) : '') : (v === 0 ? '0' : (v || ''));
    });
    $$('[data-i]').forEach(function (inp) { inp.value = inst[inp.dataset.i] || ''; });
    $('#enReceipt').checked = enReceipt;
    renderLogo();
    renderHeads();
  }
  function renderLogo() {
    var img = $('#logoImg');
    img.hidden = !inst.logo; $('#logoRemove').hidden = !inst.logo;
    if (inst.logo) img.src = inst.logo; else img.removeAttribute('src');
  }
  function renderOut() {
    var c = calc(form), L = docLang();
    var tot = $('#sumTotal'), pd = $('#sumPaid'), bl = $('#sumBal');
    tot.textContent = inr(c.total); tot.dataset.value = c.total;
    pd.textContent = inr(c.paid); pd.dataset.value = c.paid;
    bl.textContent = inr(c.bal); bl.dataset.value = c.bal;
    $('#sumBalLabel').textContent = t(c.bal < 0 ? 'r_advance' : 'r_balance');
    var w = $('#sumWords');
    w.textContent = words(c.paid, L); w.lang = L; w.dir = L === 'ur' ? 'rtl' : 'ltr';
    w.classList.toggle('no-i18n', L !== EDU.lang);
    $('#sampleBanner').hidden = !isSample();
    var pv = $('#preview');
    pv.classList.toggle('no-i18n', L !== EDU.lang);
    pv.innerHTML = buildCopy('r_parent', L, form, isSample());
    $('#enWrap').hidden = EDU.lang === 'en';
  }
  function renderHist() {
    var wrap = $('#histWrap');
    $('#histCount').textContent = hist.length ? t('hist_count', { n: EDU.fmt(hist.length) }) : t('hist_empty');
    $('#csvBtn').disabled = !hist.length; $('#clearHist').disabled = !hist.length;
    wrap.innerHTML = '';
    if (!hist.length) return;
    var tb = el('tbody');
    hist.forEach(function (r) {
      var c = calc(r.f);
      var open = el('button', { type: 'button', class: 'btn btn-sm h-open', text: t('h_open') });
      open.addEventListener('click', function () { form = cleanForm(clone(r.f)); saveState(); fillForm(); renderOut(); window.scrollTo(0, 0); });
      var del = el('button', { type: 'button', class: 'btn btn-sm btn-ghost h-del', 'aria-label': t('delete'), title: t('delete'), text: '✕' });
      del.addEventListener('click', function () {
        if (!confirm(t('confirm_del', { no: r.f.no }))) return;
        hist = hist.filter(function (x) { return x !== r; }); store.set('hist', hist); renderHist();
      });
      tb.appendChild(el('tr', {},
        el('td', { class: 'no-i18n', text: r.f.no }), el('td', { class: 'no-i18n', text: showDate(r.f.date) }),
        el('td', { class: 'no-i18n', text: r.f.student }), el('td', { class: 'no-i18n', style: { textAlign: 'end' }, text: inr(c.paid) }),
        el('td', { class: 'no-i18n', style: { textAlign: 'end' }, text: (c.bal < 0 ? '−' : '') + inr(c.bal) }),
        el('td', {}, el('div', { class: 'row nowrap', style: { gap: '6px' } }, open, del))));
    });
    wrap.appendChild(el('table', { class: 'table', id: 'histTable' },
      el('thead', {}, el('tr', {}, el('th', { text: t('r_no') }), el('th', { text: t('r_date') }), el('th', { text: t('r_student') }),
        el('th', { style: { textAlign: 'end' }, text: t('r_paid') }), el('th', { style: { textAlign: 'end' }, text: t('r_balance') }), el('th', {}))), tb));
  }

  /* ---------------- actions ---------------- */
  function saveReceipt(quiet) {
    if (!form.student.trim()) {
      if (!quiet) { EDU.toast(t('msg_need_name')); $('#student').focus(); }
      return false;
    }
    if (!form.no.trim()) { form.no = nextNo(); $('#no').value = form.no; }
    var rec = { f: clone(form), at: Date.now() };
    var i = -1;
    hist.forEach(function (r, j) { if (r.f.no === form.no) i = j; });
    if (i >= 0) hist[i] = rec; else hist.unshift(rec);
    hist = hist.slice(0, MAX_HIST);
    store.set('hist', hist); saveState();
    if (i < 0) store.set('lastNo', form.no);            // re-saving an old receipt must not pull the numbering back
    renderHist();
    if (!quiet) EDU.toast(t('msg_saved', { no: form.no }));
    return true;
  }
  function csvSafe(v) { v = String(v == null ? '' : v); return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; }
  function csvRows() {
    var rows = [[t('r_no'), t('r_date'), t('r_student'), t('r_class'), t('r_roll'), t('r_parentname'), t('r_period'), t('r_particulars'),
      t('r_concession'), t('r_late'), t('r_total'), t('r_paid'), t('r_balance'), t('r_mode'), t('r_ref'), t('r_recvby')]];
    hist.forEach(function (r) {
      var f = r.f, c = calc(f);
      rows.push([csvSafe(f.no), showDate(f.date), csvSafe(f.student), csvSafe(f.cls), csvSafe(f.roll), csvSafe(f.parent), csvSafe(f.period),
        csvSafe(f.heads.map(function (h) { return headName(h, EDU.lang) + ' ' + num(h.amt); }).join('; ')),
        c.conc, c.late, c.total, c.paid, c.bal, t('mode_' + f.mode), csvSafe(f.ref), csvSafe(f.recvby)]);
    });
    return rows;
  }

  $('#app').addEventListener('input', function (e) {
    var inp = e.target;
    if (inp.dataset && inp.dataset.f) {
      var k = inp.dataset.f;
      if (k === 'concession' || k === 'late') form[k] = num(inp.value);
      else if (k === 'paid') form.paid = latinDigits(inp.value).replace(/[₹,\s]/g, '') === '' ? '' : num(inp.value);
      else form[k] = inp.value;
      saveState(); renderOut();
    } else if (inp.dataset && inp.dataset.i) {
      inst[inp.dataset.i] = inp.value; saveState(); renderOut();
    }
  });
  $('#mode').addEventListener('change', function () { form.mode = this.value; saveState(); renderOut(); });
  $('#enReceipt').addEventListener('change', function () { enReceipt = this.checked; store.set('en', enReceipt); renderOut(); });
  $('#addHead').addEventListener('click', function () {
    if (form.heads.length >= MAX_HEADS) return;
    form.heads.push({ k: 'other', label: '', amt: 0 });
    saveState(); renderHeads(); renderOut();
    var rows = $$('#heads .head-name'); rows[rows.length - 1].focus(); rows[rows.length - 1].select();
  });
  $('#logoFile').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { EDU.toast(t('msg_logo_bad')); return; }
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var m = 240, s = Math.min(1, m / Math.max(img.naturalWidth, img.naturalHeight));
      var cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(img.naturalWidth * s)); cv.height = Math.max(1, Math.round(img.naturalHeight * s));
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      try { inst.logo = cv.toDataURL('image/png'); } catch (e) { inst.logo = ''; EDU.toast(t('msg_logo_bad')); }
      saveState(); renderLogo(); renderOut();
    };
    img.onerror = function () { URL.revokeObjectURL(url); EDU.toast(t('msg_logo_bad')); };
    img.src = url;
  });
  $('#logoRemove').addEventListener('click', function () { inst.logo = ''; saveState(); renderLogo(); renderOut(); });
  $('#printBtn').addEventListener('click', function () {
    if (!isSample()) saveReceipt(true);
    fitSheet();
    window.print();
  });
  $('#saveBtn').addEventListener('click', function () { saveReceipt(false); });
  $('#newBtn').addEventListener('click', function () {
    var keep = form, b = blank();
    if (b.no === keep.no) b.no = incNo(keep.no);        // the receipt on screen was not saved: still move to a new number
    b.period = keep.period; b.cls = keep.cls; b.recvby = keep.recvby; b.mode = keep.mode; b.heads = clone(keep.heads);
    form = b; saveState(); fillForm(); renderOut();
    $('#student').focus();
  });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    inst = cleanInst(null); form = blank(); saveState(); fillForm(); renderOut();
  });
  $('#csvBtn').addEventListener('click', function () {
    if (!hist.length) return;
    EDU.download('fee-receipts-' + todayISO() + '.csv', EDU.csv.stringify(csvRows()), 'text/csv');
  });
  $('#clearHist').addEventListener('click', function () {
    if (!hist.length || !confirm(t('confirm_clear_hist'))) return;
    hist = []; store.set('hist', hist); renderHist();
  });

  EDU.onLang(function () { renderHeads(); renderOut(); renderHist(); });
  fillForm(); renderOut(); renderHist();

  window.FRM = { calc: calc, words: words, incNo: incNo, num: num, buildSheet: buildSheet, fitSheet: fitSheet, csvRows: csvRows,
    get form() { return form; }, get hist() { return hist; }, get inst() { return inst; } };
})();
