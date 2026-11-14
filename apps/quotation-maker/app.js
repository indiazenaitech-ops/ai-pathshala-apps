/* Quotation Maker: a quotation / estimate for small shops and freelancers.
   Money is kept in whole paise, quantities in thousandths and GST rates in hundredths of a percent, so totals are exact.
   Tax, round-off and amount in words follow the GST Invoice Maker (same formulas; words.js is the same file).
   Everything stays on the device: EDU.store for the draft, a JSON file for "save as file". */
(function () {
  'use strict';
  var SLUG = 'quotation-maker';
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t, el = EDU.el, esc = EDU.esc;
  var store = EDU.store(SLUG);
  var MAX_LINES = 100, MAX_LINE_PAISE = 1e12, MAX_TOTAL_PAISE = 9.99e13;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- numbers (same rules as gst-invoice-maker) ---------------- */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  var DIGIT_BASES = [0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0x660, 0x6F0];
  function asciiDigits(s) {
    return String(s == null ? '' : s).replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < DIGIT_BASES.length; i++) if (code >= DIGIT_BASES[i] && code <= DIGIT_BASES[i] + 9) return String(code - DIGIT_BASES[i]);
      return c;
    }).replace(/٫/g, '.').replace(/٬/g, ',');
  }
  /* "1,18,000.50" -> whole number of (value x scale), e.g. scale 100 = paise. null = empty, NaN = not a number. */
  function parseScaled(s, scale) {
    s = asciiDigits(s).replace(/[\s,₹]/g, '').replace(/^rs\.?/i, '');
    if (s === '') return null;
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    var neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var parts = s.split('.'), ip = (parts[0] || '0').replace(/^0+(?=\d)/, ''), fp = parts[1] || '';
    if (ip.length > 13) return NaN;
    var places = String(scale).length - 1;
    var v = Number(ip) * scale + Number((fp + '0000000').slice(0, places) || 0);
    if (fp.length > places && +fp.charAt(places) >= 5) v += 1;       // round half up
    return neg ? -v : v;
  }
  /* round(a * b / d) for whole numbers >= 0, exact (BigInt when the product is too large for a double) */
  function mulDiv(a, b, d) {
    if (!a || !b) return 0;
    var p = a * b, n = 2 * p + d, m = 2 * d;
    if (n <= 9007199254740991) return (n - n % m) / m;
    if (typeof BigInt === 'function') return Number((BigInt(2) * BigInt(a) * BigInt(b) + BigInt(d)) / (BigInt(2) * BigInt(d)));
    return Math.round(p / d);
  }
  /* paise -> "1,18,000.00" (Indian digit grouping, always Latin digits) */
  function money(p) {
    p = Math.round(p || 0);
    var neg = p < 0; if (neg) p = -p;
    var r = String(Math.floor(p / 100)), ps = p % 100;
    var last = r.slice(-3), rest = r.slice(0, -3);
    if (rest) last = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last;
    return (neg ? '-' : '') + last + '.' + pad2(ps);
  }
  function scaledStr(v, scale) {                                    // thousandths -> "2.5", hundredths -> "18"
    var s = Math.floor(v / scale) + (v % scale ? '.' + String(scale + v % scale).slice(1).replace(/0+$/, '') : '');
    return s;
  }

  /* ---------------- the quotation ---------------- */
  function iso(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function today(plus) { var d = new Date(); d.setDate(d.getDate() + (plus || 0)); return iso(d); }
  function showDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? m[3] + '-' + m[2] + '-' + m[1] : ''; }
  function blankLine() { return { desc: '', qty: '', unit: '', rate: '', disc: '', gst: '' }; }
  function blankDoc() {
    return { sample: false, biz: { name: '', addr: '', phone: '', email: '', gstin: '', logo: '' }, cust: { name: '', addr: '', phone: '', gstin: '' },
      no: '', date: today(), valid: today(15), mode: 'intra', round: true, enLabels: false, lines: [blankLine()], terms: '', notes: '' };
  }
  /* clearly made-up sample: no real-looking names, phone numbers or GSTINs */
  function sampleDoc() {
    var d = blankDoc();
    d.sample = true;
    d.biz = { name: t('s_biz'), addr: t('s_biz_addr'), phone: '00000 00000', email: '', gstin: '', logo: '' };
    d.cust = { name: t('s_cust'), addr: t('s_cust_addr'), phone: '', gstin: '' };
    d.no = 'Q-001';
    d.lines = [
      { desc: t('s_i1'), qty: '450', unit: t('s_u1'), rate: '18', disc: '5%', gst: '18' },
      { desc: t('s_i2'), qty: '3', unit: t('s_u2'), rate: '2350', disc: '150', gst: '18' },
      { desc: t('s_i3'), qty: '1', unit: t('s_u3'), rate: '2499.50', disc: '', gst: '' }
    ];
    d.terms = t('s_terms'); d.notes = t('s_notes');
    return d;
  }
  function str(v, max) { return (typeof v === 'string' || typeof v === 'number' ? String(v) : '').slice(0, max); }
  /* anything read from storage or from a file goes through here */
  function sanitize(x) {
    var d = blankDoc();
    if (!x || typeof x !== 'object') return d;
    var b = x.biz || {}, c = x.cust || {};
    d.sample = x.sample === true;
    d.biz = { name: str(b.name, 80), addr: str(b.addr, 240), phone: str(b.phone, 30), email: str(b.email, 80), gstin: str(b.gstin, 15).toUpperCase(), logo: '' };
    if (typeof b.logo === 'string' && b.logo.length < 400000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(b.logo)) d.biz.logo = b.logo;
    d.cust = { name: str(c.name, 80), addr: str(c.addr, 240), phone: str(c.phone, 30), gstin: str(c.gstin, 15).toUpperCase() };
    d.no = str(x.no, 24);
    d.date = /^\d{4}-\d{2}-\d{2}$/.test(x.date) ? x.date : '';
    d.valid = /^\d{4}-\d{2}-\d{2}$/.test(x.valid) ? x.valid : '';
    d.mode = x.mode === 'inter' ? 'inter' : 'intra';
    d.round = x.round !== false; d.enLabels = x.enLabels === true;
    d.lines = (Array.isArray(x.lines) ? x.lines : []).slice(0, MAX_LINES).map(function (l) {
      l = l && typeof l === 'object' ? l : {};
      return { desc: str(l.desc, 200), qty: str(l.qty, 16), unit: str(l.unit, 12), rate: str(l.rate, 18), disc: str(l.disc, 18), gst: str(l.gst, 8) };
    });
    if (!d.lines.length) d.lines = [blankLine()];
    d.terms = str(x.terms, 1500); d.notes = str(x.notes, 600);
    return d;
  }
  var saved = store.get('doc', null);
  var doc = saved ? sanitize(saved) : sampleDoc();
  var warned = false;
  function save() {
    var ok = store.set('doc', doc);
    if (!ok && !warned) { warned = true; EDU.toast(t('store_full')); }       // say it once, not on every key press
    return ok;
  }

  /* ---------------- sums ---------------- */
  function calc(d) {
    var R = { lines: [], sub: 0, disc: 0, cgst: 0, sgst: 0, igst: 0, errors: [], hasDisc: false, hasGst: false, count: 0 };
    d.lines.forEach(function (ln, i) {
      var n = i + 1, o = { n: n, ok: false, errs: [], bad: {} };
      R.lines.push(o);
      if (!String(ln.desc).trim() && !String(ln.rate).trim()) { o.empty = true; return; }
      var q = parseScaled(ln.qty, 1000), r = parseScaled(ln.rate, 100), gb = parseScaled(String(ln.gst).replace(/%\s*$/, ''), 100);
      if (q === null) q = 1000;                                       // empty quantity counts as 1
      if (r === null) r = 0;
      if (gb === null) gb = 0;
      if (q !== q) { o.errs.push(t('err_num', { n: n, v: ln.qty })); o.bad.qty = 1; }
      else if (q <= 0) { o.errs.push(t('err_qty', { n: n })); o.bad.qty = 1; }
      if (r !== r || r < 0) { o.errs.push(t('err_num', { n: n, v: ln.rate })); o.bad.rate = 1; }
      if (gb !== gb || gb < 0 || gb > 10000) { o.errs.push(t('err_gst', { n: n })); o.bad.gst = 1; }
      var gross = 0, disc = 0, ds = String(ln.disc || '').trim();
      if (!o.errs.length) {
        gross = mulDiv(q, r, 1000);
        if (gross > MAX_LINE_PAISE) { o.errs.push(t('err_big', { n: n })); o.bad.qty = o.bad.rate = 1; }
        else if (ds) {
          if (/%$/.test(ds)) {
            var pb = parseScaled(ds.slice(0, -1), 100);
            if (pb === null || pb !== pb || pb < 0 || pb > 10000) { o.errs.push(t('err_num', { n: n, v: ds })); o.bad.disc = 1; }
            else disc = mulDiv(gross, pb, 10000);
          } else {
            var dp = parseScaled(ds, 100);
            if (dp === null || dp !== dp || dp < 0) { o.errs.push(t('err_num', { n: n, v: ds })); o.bad.disc = 1; }
            else disc = dp;
          }
          if (!o.bad.disc && disc > gross) { o.errs.push(t('err_disc', { n: n })); o.bad.disc = 1; }
        }
      }
      if (o.errs.length) { R.errors = R.errors.concat(o.errs); return; }
      var taxable = gross - disc, cg = 0, sg = 0, ig = 0;
      if (d.mode === 'intra') { cg = mulDiv(taxable, gb, 20000); sg = cg; } else ig = mulDiv(taxable, gb, 10000);
      o.ok = true; o.q = q; o.r = r; o.gb = gb; o.gross = gross; o.disc = disc; o.discPct = /%$/.test(ds) ? asciiDigits(ds).replace(/\s/g, '') : '';
      o.taxable = taxable; o.cgst = cg; o.sgst = sg; o.igst = ig;
      if (disc) R.hasDisc = true;
      if (gb) R.hasGst = true;
      R.sub += taxable; R.disc += disc; R.cgst += cg; R.sgst += sg; R.igst += ig; R.count++;
    });
    R.tax = R.cgst + R.sgst + R.igst;
    R.exact = R.sub + R.tax;
    R.total = d.round ? Math.round(R.exact / 100) * 100 : R.exact;
    R.roundOff = R.total - R.exact;
    if (R.total > MAX_TOTAL_PAISE) R.errors.push(t('total_big'));
    if (d.date && d.valid && d.valid < d.date) R.errors.push(t('date_warn'));
    return R;
  }
  function docLang() { return doc.enLabels ? 'en' : EDU.lang; }
  function tl(key, vars) {                                            // label in the language of the printed quotation
    if (docLang() !== 'en' || EDU.lang === 'en') return t(key, vars);
    var v = (window.APP_STRINGS.en || {})[key];
    if (v == null) return t(key, vars);
    return String(v).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });
  }
  function wordsFor(paise) {
    var lang = docLang(), r = Math.floor(paise / 100), p = paise % 100;
    return tl(p ? 'words_rs_paise' : 'words_rs').replace('{w}', GST_WORDS.say(r, lang)).replace('{p}', GST_WORDS.say(p, lang));
  }
  function signed(p) { return (p > 0 ? '+' : '') + money(p); }

  /* ---------------- the printed sheet ---------------- */
  function bdi(s) { return '<bdi>' + esc(s) + '</bdi>'; }
  function renderSheet(R) {
    var d = doc, h = [], sheet = $('#sheet'), ltr = docLang() !== 'ur';
    sheet.dir = ltr ? 'ltr' : 'rtl'; sheet.lang = docLang();
    if (d.sample) h.push('<div class="q-mark">' + esc(tl('sample_mark')) + '</div>');
    h.push('<div class="q-head"><div class="q-biz">');
    if (d.biz.logo) h.push('<img src="' + esc(d.biz.logo) + '" alt="">');
    h.push('<div><div class="q-name">' + bdi(d.biz.name.trim() || tl('d_your_biz')) + '</div>');
    if (d.biz.addr.trim()) h.push('<div class="q-small">' + bdi(d.biz.addr.trim()) + '</div>');
    var contact = [];
    if (d.biz.phone.trim()) contact.push(esc(tl('phone')) + ': ' + bdi(d.biz.phone.trim()));
    if (d.biz.email.trim()) contact.push(esc(tl('email')) + ': ' + bdi(d.biz.email.trim()));
    if (contact.length) h.push('<div class="q-small">' + contact.join(' · ') + '</div>');
    if (d.biz.gstin.trim()) h.push('<div class="q-small">' + esc(tl('gstin')) + ': ' + bdi(d.biz.gstin.trim()) + '</div>');
    h.push('</div></div><div class="q-doc"><div class="q-title">' + esc(tl('dt_qtn')) + '</div><div class="q-meta">');
    if (d.no.trim()) h.push('<b>' + esc(tl('doc_no')) + '</b><span>' + bdi(d.no.trim()) + '</span>');
    if (d.date) h.push('<b>' + esc(tl('doc_date')) + '</b><span>' + bdi(showDate(d.date)) + '</span>');
    if (d.valid) h.push('<b>' + esc(tl('valid_till')) + '</b><span>' + bdi(showDate(d.valid)) + '</span>');
    h.push('</div></div></div>');

    h.push('<div class="q-to"><div class="q-lbl">' + esc(tl('col_customer')) + '</div><div class="q-cname">' + bdi(d.cust.name.trim() || '—') + '</div>');
    if (d.cust.addr.trim()) h.push('<div class="q-small">' + bdi(d.cust.addr.trim()) + '</div>');
    if (d.cust.phone.trim()) h.push('<div class="q-small">' + esc(tl('phone')) + ': ' + bdi(d.cust.phone.trim()) + '</div>');
    if (d.cust.gstin.trim()) h.push('<div class="q-small">' + esc(tl('gstin')) + ': ' + bdi(d.cust.gstin.trim()) + '</div>');
    h.push('</div>');

    h.push('<table><thead><tr><th>' + esc(tl('d_no')) + '</th><th>' + esc(tl('col_desc')) + '</th><th class="r">' + esc(tl('col_qty')) + '</th><th>' + esc(tl('col_unit')) + '</th><th class="r">' + esc(tl('col_rate')) + '</th>' +
      (R.hasDisc ? '<th class="r">' + esc(tl('col_disc')) + '</th>' : '') + (R.hasGst ? '<th class="r">' + esc(tl('col_gst')) + '</th>' : '') + '<th class="r">' + esc(tl('col_amount')) + ' ₹</th></tr></thead><tbody>');
    var k = 0;
    R.lines.forEach(function (o, i) {
      if (!o.ok) return;
      var ln = d.lines[i];
      h.push('<tr><td>' + (++k) + '</td><td class="d">' + bdi(ln.desc.trim()) + '</td><td class="r">' + scaledStr(o.q, 1000) + '</td><td class="u">' + bdi(ln.unit.trim()) + '</td><td class="r">' + money(o.r) + '</td>' +
        (R.hasDisc ? '<td class="r">' + (o.disc ? (o.discPct ? esc(o.discPct) : money(o.disc)) : '') + '</td>' : '') +
        (R.hasGst ? '<td class="r">' + (o.gb ? scaledStr(o.gb, 100) + '%' : '') + '</td>' : '') + '<td class="r">' + money(o.taxable) + '</td></tr>');
    });
    if (!k) h.push('<tr><td>&nbsp;</td><td class="d"></td><td></td><td></td><td></td>' + (R.hasDisc ? '<td></td>' : '') + (R.hasGst ? '<td></td>' : '') + '<td></td></tr>');
    h.push('</tbody></table>');

    h.push('<div class="q-bottom"><div class="q-words"><div class="q-lbl">' + esc(tl('amount_words')) + '</div><div class="w">' + bdi(wordsFor(R.total)) + '</div>');
    if (R.disc) h.push('<div class="q-small" style="margin-top:6px">' + esc(tl('disc_given', { amt: '@@' })).replace('₹@@', '<bdi dir="ltr">₹' + money(R.disc) + '</bdi>') + '</div>');
    h.push('</div><div class="q-tot"><div><span>' + esc(tl('subtotal')) + '</span><span>' + money(R.sub) + '</span></div>');
    if (R.hasGst && d.mode === 'intra') h.push('<div><span>' + esc(tl('cgst')) + '</span><span>' + money(R.cgst) + '</span></div><div><span>' + esc(tl('sgst')) + '</span><span>' + money(R.sgst) + '</span></div>');
    if (R.hasGst && d.mode === 'inter') h.push('<div><span>' + esc(tl('igst')) + '</span><span>' + money(R.igst) + '</span></div>');
    if (R.roundOff) h.push('<div><span>' + esc(tl('round_off')) + '</span><span>' + signed(R.roundOff) + '</span></div>');
    h.push('<div class="g"><span>' + esc(tl('grand')) + '</span><span>₹' + money(R.total) + '</span></div></div></div>');

    if (d.terms.trim()) h.push('<div class="q-sec"><div class="q-lbl">' + esc(tl('terms')) + '</div><div class="q-small">' + bdi(d.terms.trim()) + '</div></div>');
    if (d.notes.trim()) h.push('<div class="q-sec"><div class="q-lbl">' + esc(tl('notes')) + '</div><div class="q-small">' + bdi(d.notes.trim()) + '</div></div>');
    h.push('<div class="q-sign"><div><div class="for">&nbsp;</div><div class="sp"></div><div>' + esc(tl('d_accept')) + '</div></div>' +
      '<div><div class="for">' + esc(tl('d_for', { name: d.biz.name.trim() || tl('d_your_biz') })) + '</div><div class="sp"></div><div>' + esc(tl('d_sign')) + '</div></div></div>');
    sheet.innerHTML = h.join('');
    fit();
  }
  function fit() {
    var wrap = $('#prevWrap'), sheet = $('#sheet'), w = wrap.clientWidth - 26;
    if (w <= 0) return;
    var s = Math.min(1, w / 794);
    sheet.style.transform = s < 1 ? 'scale(' + s + ')' : '';
    wrap.style.height = Math.ceil(sheet.offsetHeight * s) + 26 + 'px';
  }

  /* ---------------- form ---------------- */
  var FIELDS = [['bName', 'biz', 'name'], ['bAddr', 'biz', 'addr'], ['bPhone', 'biz', 'phone'], ['bEmail', 'biz', 'email'], ['bGstin', 'biz', 'gstin'],
    ['cName', 'cust', 'name'], ['cAddr', 'cust', 'addr'], ['cPhone', 'cust', 'phone'], ['cGstin', 'cust', 'gstin'],
    ['qNo', null, 'no'], ['qDate', null, 'date'], ['qValid', null, 'valid'], ['terms', null, 'terms'], ['notes', null, 'notes']];
  var LINE_F = [['desc', 'col_desc', 'text', 200], ['qty', 'col_qty', 'decimal', 16], ['unit', 'col_unit', 'text', 12], ['rate', 'col_rate', 'decimal', 18], ['disc', 'col_disc', 'text', 18], ['gst', 'col_gst', 'decimal', 8]];
  var CLS = { desc: 'c-desc', qty: 'c-qty', unit: 'c-unit', rate: 'c-rate', disc: 'c-dsc', gst: 'c-gst' };

  function fillForm() {
    FIELDS.forEach(function (f) { $('#' + f[0]).value = f[1] ? doc[f[1]][f[2]] : doc[f[2]]; });
    $('#round').checked = doc.round; $('#enLabels').checked = doc.enLabels;
    $('#enBox').hidden = EDU.lang === 'en';
    $$('#mode button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === doc.mode)); });
    var th = $('#logoThumb');
    th.hidden = !doc.biz.logo; if (doc.biz.logo) th.src = doc.biz.logo; else th.removeAttribute('src');
    $('#logoDel').hidden = !doc.biz.logo;
    renderLines();
  }
  function renderLines() {
    var box = $('#lines'); box.innerHTML = '';
    doc.lines.forEach(function (ln, i) {
      var row = el('div', { class: 'ln', dataset: { i: String(i) } });
      LINE_F.forEach(function (f) {
        var inp = el('input', { type: 'text', class: 'no-i18n' + (f[2] === 'decimal' ? ' num-in' : ''), maxlength: String(f[3]), autocomplete: 'off', value: ln[f[0]], dataset: { f: f[0] } });
        if (f[2] === 'decimal') { inp.setAttribute('inputmode', 'decimal'); inp.dir = 'ltr'; } else inp.dir = f[0] === 'disc' ? 'ltr' : 'auto';
        row.appendChild(el('label', { class: CLS[f[0]] }, el('span', { text: t(f[1]) }), inp));
      });
      row.appendChild(el('div', { class: 'c-foot' },
        el('span', { class: 'c-no', text: String(i + 1) }),
        el('span', { class: 'amt no-i18n', text: '' }),
        el('button', { type: 'button', class: 'btn btn-sm btn-danger', text: '✕', dataset: { del: String(i) }, 'aria-label': t('del_line', { n: i + 1 }), title: t('del_line', { n: i + 1 }) })));
      box.appendChild(row);
    });
    $('#addLine').disabled = doc.lines.length >= MAX_LINES;
  }
  function refresh() {
    var R = calc(doc);
    $$('#lines .ln').forEach(function (row, i) {
      var o = R.lines[i] || {};
      $('.amt', row).textContent = o.ok ? '₹' + money(o.taxable) : '';
      $$('input', row).forEach(function (inp) { if (o.bad && o.bad[inp.dataset.f]) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); });
    });
    var errs = $('#errs'); errs.innerHTML = '';
    R.errors.forEach(function (e) { errs.appendChild(el('p', { text: e })); });
    $('#tSub').textContent = '₹' + money(R.sub);
    $('#tC').textContent = '₹' + money(R.cgst); $('#tS').textContent = '₹' + money(R.sgst); $('#tI').textContent = '₹' + money(R.igst);
    $('#rowC').hidden = $('#rowS').hidden = !(R.hasGst && doc.mode === 'intra');
    $('#rowI').hidden = !(R.hasGst && doc.mode === 'inter');
    $('#tR').textContent = signed(R.roundOff); $('#rowR').hidden = !R.roundOff;
    $('#tTotal').textContent = '₹' + money(R.total);
    $('#tWords').textContent = wordsFor(R.total);
    $('#sampleBanner').hidden = !doc.sample;
    renderSheet(R);
    return R;
  }
  function edited() {
    doc.sample = false;
    save();
    refresh();
  }

  FIELDS.forEach(function (f) {
    $('#' + f[0]).addEventListener('input', function () {
      var v = this.value;
      if (f[2] === 'gstin') v = v.toUpperCase();
      if (f[1]) doc[f[1]][f[2]] = v; else doc[f[2]] = v;
      edited();
    });
  });
  $('#lines').addEventListener('input', function (e) {
    var inp = e.target, row = inp.closest('.ln'); if (!row || !inp.dataset.f) return;
    doc.lines[+row.dataset.i][inp.dataset.f] = inp.value;
    edited();
  });
  $('#lines').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-del]'); if (!b) return;
    doc.lines.splice(+b.dataset.del, 1);
    if (!doc.lines.length) doc.lines.push(blankLine());
    renderLines(); edited();
  });
  $('#addLine').addEventListener('click', function () {
    if (doc.lines.length >= MAX_LINES) return;
    doc.lines.push(blankLine()); renderLines(); edited();
    var last = $$('#lines .ln input[data-f="desc"]').pop(); if (last) last.focus();
  });
  $('#mode').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    doc.mode = b.dataset.v === 'inter' ? 'inter' : 'intra';
    $$('#mode button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.v === doc.mode)); });
    edited();
  });
  $('#round').addEventListener('change', function () { doc.round = this.checked; edited(); });
  $('#enLabels').addEventListener('change', function () { doc.enLabels = this.checked; edited(); });

  /* logo: made smaller and kept only on this device */
  $('#logoPick').addEventListener('click', function () {
    EDU.pickFile('image/png,image/jpeg,image/webp').then(function (f) {
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var img = new Image();
        img.onload = function () {
          var sc = Math.min(1, 360 / img.width, 180 / img.height), w = Math.max(1, Math.round(img.width * sc)), hh = Math.max(1, Math.round(img.height * sc));
          var c = document.createElement('canvas'); c.width = w; c.height = hh;
          c.getContext('2d').drawImage(img, 0, 0, w, hh);
          var data = c.toDataURL('image/png');
          if (data.length > 160000) data = c.toDataURL('image/jpeg', 0.85);
          doc.biz.logo = data; doc.sample = false;
          if (!save()) { doc.biz.logo = ''; save(); }
          fillForm(); refresh();
        };
        img.onerror = function () { EDU.toast(t('img_bad')); };
        img.src = String(rd.result);
      };
      rd.onerror = function () { EDU.toast(t('img_bad')); };
      rd.readAsDataURL(f);
    });
  });
  $('#logoDel').addEventListener('click', function () { doc.biz.logo = ''; save(); fillForm(); refresh(); });

  /* print, file, new, sample */
  $('#printBtn').addEventListener('click', function () { window.print(); });
  $('#saveFile').addEventListener('click', function () {
    var name = 'quotation-' + (doc.no.trim().replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'draft') + '.json';
    EDU.download(name, JSON.stringify({ app: SLUG, version: 1, doc: doc }, null, 1), 'application/json');
  });
  $('#openFile').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return;
      if (f.size > 2000000) { EDU.toast(t('file_bad')); return; }
      return EDU.readText(f).then(function (txt) {
        var x = null;
        try { x = JSON.parse(txt); } catch (e) { x = null; }
        if (!x || x.app !== SLUG || !x.doc || typeof x.doc !== 'object' || !Array.isArray(x.doc.lines)) { EDU.toast(t('file_bad')); return; }
        doc = sanitize(x.doc); doc.sample = false;
        save();
        fillForm(); refresh(); EDU.toast(t('file_ok'));
      });
    }).catch(function () { EDU.toast(t('file_bad')); });
  });
  function newBlank() {
    if (!confirm(t('confirm_new'))) return;
    var keep = doc.sample ? null : doc.biz, terms = doc.sample ? '' : doc.terms, mode = doc.mode, en = doc.enLabels;
    doc = blankDoc();
    if (keep) doc.biz = keep;
    doc.terms = terms; doc.mode = mode; doc.enLabels = en;
    save(); fillForm(); refresh();
    $('#' + (keep ? 'cName' : 'bName')).focus();
  }
  $('#newBtn').addEventListener('click', newBlank);
  $('#newBtn2').addEventListener('click', newBlank);
  $('#sampleBtn').addEventListener('click', function () {
    if (!doc.sample && !confirm(t('confirm_reset'))) return;
    doc = sampleDoc(); store.remove('doc'); fillForm(); refresh();
  });

  window.addEventListener('resize', fit);
  EDU.onLang(function () {
    if (doc.sample) { var en = doc.enLabels, mode = doc.mode; doc = sampleDoc(); doc.enLabels = en; doc.mode = mode; }
    fillForm(); refresh();
  });
  fillForm();
  refresh();
})();
