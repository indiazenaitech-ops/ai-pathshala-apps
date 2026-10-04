/* GST Calculator & GSTIN Checker.
   Money is kept as BigInt paise and rates as BigInt units of 0.0001 %, so totals are exact even for
   very large amounts. Everything runs on this device; nothing is sent anywhere. */
(function () {
  'use strict';
  var SLUG = 'gst-calculator';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var RATES_CHECKED = '2026-10-04';
  var PRESETS = ['0', '0.25', '3', '5', '18', '40'];
  var OLD_RATES = ['12', '28'];
  var D = 1000000n;                 // 100 % in rate units (1 unit = 0.0001 %)
  var MAX_DIGITS = 15;              // digits before the decimal point
  var SAMPLE_GSTIN = '27AAPFU0939F1ZV';
  var CP = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var PAN_TYPES = 'ABCFGHJLPT';
  var LRI = '⁦', PDI = '⁩';

  /* saved state can be old, half-written or edited by hand: read it defensively */
  function str(v, d) { return typeof v === 'string' ? v : typeof v === 'number' && isFinite(v) ? String(v) : (d === undefined ? '' : d); }
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : null; }
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  /* CSV cells typed by the user: stop Excel from treating "=…", "+…", "-…", "@…" as a formula */
  function cell(v) { v = str(v); return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; }

  /* ------------------------------------------------------------ numbers */
  var DIGIT_ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function latinDigits(s) {
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < DIGIT_ZEROS.length; i++) if (code >= DIGIT_ZEROS[i] && code <= DIGIT_ZEROS[i] + 9) return String(code - DIGIT_ZEROS[i]);
      return c;
    }).replace(/٫/g, '.').replace(/[٬،]/g, ',');
  }
  /* "₹1,18,000.50" → { v: BigInt in 10^-scale units } or { err: 'empty'|'number'|'negative'|'big' } */
  function parseDec(raw, scale, maxInt) {
    var s = latinDigits(raw).trim().replace(/₹|\binr\b|\brs\.?/gi, '').replace(/\/-\s*$/, '').replace(/[\s,_'’]/g, '');
    if (!s) return { err: 'empty' };
    var neg = false;
    if (/^[-−–]/.test(s)) { neg = true; s = s.slice(1); }
    else if (s.charAt(0) === '+') s = s.slice(1);
    var m = /^(\d*)(?:\.(\d*))?$/.exec(s);
    if (!m || (!m[1] && !m[2])) return { err: 'number' };
    var ip = m[1].replace(/^0+/, '') || '0', fp = m[2] || '';
    if (ip.length > maxInt) return { err: 'big' };
    var keep = (fp + '0000000000').slice(0, scale);
    var v = BigInt(ip) * (10n ** BigInt(scale)) + BigInt(keep || '0');
    if (fp.length > scale && fp.charCodeAt(scale) >= 53) v += 1n;   // round half up
    if (v >= 10n ** BigInt(maxInt + scale)) return { err: 'big' };  // "999…9.995" rounds past the cap
    if (neg && v > 0n) return { err: 'negative' };
    return { v: v };
  }
  function divRound(n, d) {           // BigInt n / d, rounded half away from zero (d > 0)
    var neg = n < 0n; if (neg) n = -n;
    var q = (n * 2n + d) / (2n * d);
    return neg ? -q : q;
  }
  function groupIN(s) {
    if (s.length <= 3) return s;
    return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
  }
  function money(p, sign) {           // BigInt paise → "₹1,18,000.00"
    var neg = p < 0n; if (neg) p = -p;
    var f = (p % 100n).toString();
    var s = '₹' + groupIN((p / 100n).toString()) + '.' + (f.length < 2 ? '0' : '') + f;
    return neg ? '−' + s : (sign && p > 0n ? '+' + s : s);
  }
  function plain(p) {                 // for CSV: "118000.00"
    var neg = p < 0n; if (neg) p = -p;
    var f = (p % 100n).toString();
    return (neg ? '-' : '') + (p / 100n).toString() + '.' + (f.length < 2 ? '0' : '') + f;
  }
  function inputText(p) {             // paise → what we put back into an input: "1,180" or "999.50"
    var f = p % 100n;
    return groupIN((p / 100n).toString()) + (f ? '.' + (f < 10n ? '0' : '') + f.toString() : '');
  }
  function iso(s) { return LRI + s + PDI; }
  function m(p, sign) { return el('bdi', { class: 'gc-m', text: money(p, sign), dataset: { paise: p.toString() } }); }
  function rateTxt(units) { return String(parseFloat((Number(units) / 10000).toFixed(4))); }
  function halfRateTxt(units) { return String(parseFloat((Number(units) / 20000).toFixed(5))); }
  function pct(x) { return isFinite(x) ? String(parseFloat(x.toFixed(2))) : '–'; }
  function ratio(a, b) { return b === 0n ? NaN : Number(a * 1000000n / b) / 10000; }   // a/b in %

  /* ------------------------------------------------------------ amount in words */
  var EN1 = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
    'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var EN10 = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  var HI = ('शून्य एक दो तीन चार पाँच छह सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस ' +
    'बीस इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस उनतीस तीस इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस ' +
    'चालीस इकतालीस बयालीस तैंतालीस चवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास पचास इक्यावन बावन तिरपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ ' +
    'साठ इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उन्यासी ' +
    'अस्सी इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे इक्यानबे बानबे तिरानबे चौरानबे पंचानबे छियानबे सत्तानबे अट्ठानबे निन्यानबे').split(' ');
  var LANG_WORDS = {
    en: { w99: function (n) { return n < 20 ? EN1[n] : EN10[Math.floor(n / 10)] + (n % 10 ? '-' + EN1[n % 10] : ''); },
      zero: 'Zero', hundred: 'Hundred', thousand: 'Thousand', lakh: 'Lakh', crore: 'Crore' },
    hi: { w99: function (n) { return HI[n]; }, zero: 'शून्य', hundred: 'सौ', thousand: 'हज़ार', lakh: 'लाख', crore: 'करोड़' }
  };
  function intWords(b, W) {          // BigInt ≥ 0, Indian system, recursive above a crore
    if (b === 0n) return W.zero;
    var p = [], crore = b / 10000000n, rem = Number(b % 10000000n);
    if (crore > 0n) p.push(intWords(crore, W) + ' ' + W.crore);
    var lakh = Math.floor(rem / 100000); rem %= 100000;
    if (lakh) p.push(W.w99(lakh) + ' ' + W.lakh);
    var th = Math.floor(rem / 1000); rem %= 1000;
    if (th) p.push(W.w99(th) + ' ' + W.thousand);
    var h = Math.floor(rem / 100); rem %= 100;
    if (h) p.push(W.w99(h) + ' ' + W.hundred);
    if (rem) p.push(W.w99(rem));
    return p.join(' ');
  }
  function wordsEN(p) {
    if (p < 0n) p = -p;
    var r = p / 100n, f = Number(p % 100n), W = LANG_WORDS.en;
    return 'Rupees ' + intWords(r, W) + (f ? ' and ' + W.w99(f) + ' Paise' : '') + ' Only';
  }
  function wordsHI(p) {
    if (p < 0n) p = -p;
    var r = p / 100n, f = Number(p % 100n), W = LANG_WORDS.hi;
    return intWords(r, W) + ' रुपये' + (f ? ' और ' + W.w99(f) + ' पैसे' : '') + ' मात्र';
  }
  function wordsBlock(p, lbl) {
    var box = el('div', { class: 'gc-words' }, el('span', { class: 'lbl', i18n: lbl || 'words_label' }),
      el('p', { class: 'no-i18n', lang: 'en', dir: 'ltr', text: wordsEN(p) }));
    if (EDU.lang === 'hi') box.appendChild(el('p', { class: 'no-i18n', lang: 'hi', text: wordsHI(p) }));
    return box;
  }

  function printWords(pa, p, lbl) {
    pa.appendChild(el('p', { text: t(lbl) + ': ' + wordsEN(p) }));
    if (EDU.lang === 'hi') pa.appendChild(el('p', { lang: 'hi', text: wordsHI(p) }));
  }

  /* ------------------------------------------------------------ dates */
  function fmtDate(d, withTime) {
    try {
      var o = { day: 'numeric', month: 'short', year: 'numeric', numberingSystem: 'latn' };
      if (withTime) { o.hour = '2-digit'; o.minute = '2-digit'; }
      return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, o).format(d);
    } catch (e) { return d.toISOString().slice(0, 16).replace('T', ' '); }
  }
  function isoDay(d) { var z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }
  function stamp(ts) { var d = new Date(ts); return isoDay(d) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

  /* ------------------------------------------------------------ rate picker (chips + custom) */
  function ratePicker(host, key, onChange) {
    var st = obj(store.get(key, null)) || {};
    st = { sel: oneOf(str(st.sel), PRESETS.concat(['custom']), '18'), custom: str(st.custom) };
    var chips = PRESETS.map(function (r) {
      return el('button', { type: 'button', class: 'chip', dataset: { rate: r }, text: r + '%', onclick: function () { st.sel = r; changed(); } });
    });
    var customBtn = el('button', { type: 'button', class: 'chip', dataset: { rate: 'custom' }, i18n: 'rate_custom',
      onclick: function () { st.sel = 'custom'; changed(); input.focus(); input.select(); } });
    var input = el('input', { type: 'text', inputmode: 'decimal', class: 'gc-num', autocomplete: 'off', 'data-i18n-aria-label': 'custom_rate_aria', placeholder: '12' });
    input.value = st.custom || '';
    var wrap = el('span', { class: 'gc-custom' }, input, el('span', { 'aria-hidden': 'true', text: '%' }));
    input.addEventListener('input', function () { st.custom = input.value; st.sel = 'custom'; changed(); });
    host.innerHTML = '';
    chips.forEach(function (c) { host.appendChild(c); });
    host.appendChild(customBtn); host.appendChild(wrap);
    EDU.apply(host);
    function sync() {
      chips.concat([customBtn]).forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.rate === st.sel)); });
      wrap.hidden = st.sel !== 'custom';
    }
    function changed() { store.set(key, st); sync(); onChange(); }
    sync();
    return {
      value: function () {
        var s = st.sel === 'custom' ? st.custom : st.sel;
        var p = parseDec(s, 4, 4);
        if (p.err || p.v > D) return { err: 'rate' };
        return { units: p.v, txt: rateTxt(p.v) };
      },
      set: function (r) {
        if (PRESETS.indexOf(r) >= 0) st.sel = r; else { st.sel = 'custom'; st.custom = r; input.value = r; }
        store.set(key, st); sync();
      },
      input: input
    };
  }

  /* ------------------------------------------------------------ GSTIN */
  function gstCheckChar(s14) {
    var sum = 0;
    for (var i = 0; i < 14; i++) {
      var v = CP.indexOf(s14.charAt(i)) * (i % 2 ? 2 : 1);
      sum += Math.floor(v / 36) + (v % 36);
    }
    return CP.charAt((36 - (sum % 36)) % 36);
  }
  function states() { var c = window.APP_CONTENT || {}; return ((c[EDU.lang] || c.en || {}).states) || {}; }
  function cleanGstin(s) { return latinDigits(s).toUpperCase().replace(/[\s\-./]/g, ''); }
  var PAN_PAT = 'LLLLLDDDDL';
  function checkGstin(raw) {
    var s = cleanGstin(raw), r = { s: s, n: s.length, errs: [], warns: [], bad: {}, valid: false };
    if (!s) { r.empty = true; return r; }
    var badChars = /[^0-9A-Z]/.test(s);
    if (badChars) { r.errs.push(t('g_err_chars')); for (var i = 0; i < s.length; i++) if (/[^0-9A-Z]/.test(s.charAt(i))) r.bad[i] = 1; }
    if (s.length > 15) r.errs.push(t('g_err_len', { n: s.length }));
    if (s.length >= 2) {
      var sc = s.slice(0, 2);
      if (/^\d\d$/.test(sc) && states()[sc]) r.state = sc;
      else { r.errs.push(t('g_err_state', { c: sc })); r.bad[0] = r.bad[1] = 1; }
    }
    if (s.length > 2) {
      var panPart = s.slice(2, 12), panOk = true;
      for (var j = 0; j < panPart.length; j++) {
        var ch = panPart.charAt(j), want = PAN_PAT.charAt(j);
        if ((want === 'L' && !/[A-Z]/.test(ch)) || (want === 'D' && !/[0-9]/.test(ch))) { panOk = false; r.bad[j + 2] = 1; }
      }
      if (!panOk) r.errs.push(t('g_err_pan'));
      else if (panPart.length === 10) r.pan = panPart;
      if (panPart.length >= 4 && /[A-Z]/.test(panPart.charAt(3))) {
        r.holder = panPart.charAt(3);
        if (PAN_TYPES.indexOf(r.holder) < 0) r.warns.push(t('g_warn_type', { c: r.holder }));
      }
    }
    if (s.length >= 13) {
      var e = s.charAt(12);
      if (/[1-9A-Z]/.test(e)) r.entity = CP.indexOf(e); else { r.errs.push(t('g_err_entity')); r.bad[12] = 1; }
    }
    if (s.length >= 14 && s.charAt(13) !== 'Z') r.warns.push(t('g_warn_z', { c: s.charAt(13) }));
    if (s.length >= 14 && !/[^0-9A-Z]/.test(s.slice(0, 14))) r.expected = gstCheckChar(s.slice(0, 14));
    if (s.length >= 15 && r.expected) {
      r.got = s.charAt(14);
      if (r.got !== r.expected) { r.errs.push(t('g_err_check', { e: r.expected, c: r.got })); r.bad[14] = 1; }
    }
    r.partial = s.length < 15;
    r.valid = s.length === 15 && !r.errs.length;
    return r;
  }
  function holderName(c) { return c && PAN_TYPES.indexOf(c) >= 0 ? t('pan_' + c) : t('pan_unknown'); }

  /* ------------------------------------------------------------ tabs */
  var TABS = ['calc', 'bill', 'price', 'gstin'];
  var tab = store.get('tab', 'calc');
  var hashTab = (location.hash || '').slice(1);
  if (TABS.indexOf(hashTab) >= 0) tab = hashTab;
  if (TABS.indexOf(tab) < 0) tab = 'calc';
  function showTab(name, focus) {
    tab = name; store.set('tab', name);
    TABS.forEach(function (n) {
      var b = $('#tab-' + n), p = $('#p-' + n), on = n === name;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; p.hidden = !on;
    });
    if (focus) $('#tab-' + name).focus();
    try { history.replaceState(history.state, '', location.href.split('#')[0] + '#' + name); } catch (e) { }
  }
  $$('#tabs [role="tab"]').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });
  $('#tabs').addEventListener('keydown', function (e) {
    var i = TABS.indexOf(tab), rtl = document.documentElement.dir === 'rtl', n = null;
    if (e.key === 'ArrowRight') n = i + (rtl ? -1 : 1);
    else if (e.key === 'ArrowLeft') n = i + (rtl ? 1 : -1);
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = TABS.length - 1;
    if (n === null) return;
    e.preventDefault();
    showTab(TABS[(n + TABS.length) % TABS.length], true);
  });

  /* ============================================================ 1. GST calculator */
  var calc = obj(store.get('calc', null)) || { amt: '1,000' };
  calc = { amt: str(calc.amt, '1,000'), mode: oneOf(calc.mode, ['add', 'remove'], 'add'), inter: calc.inter === true, cessOn: calc.cessOn === true,
    cess: str(calc.cess), round: calc.round === true };
  var calcRate = ratePicker($('#calc-rates'), 'calcRate', function () { renderCalc(); queueHist(); });
  var lastCalc = null, histTimer = null;
  var hist = store.get('hist', []);
  if (!Array.isArray(hist)) hist = [];
  hist = hist.filter(function (e) {
    return obj(e) && /^\d+$/.test(str(e.amt)) && /^\d+$/.test(str(e.total)) && /^\d+(\.\d+)?$/.test(str(e.rate)) && isFinite(e.ts);
  }).slice(0, 20);

  function saveCalc() { store.set('calc', calc); }
  function computeCalc(o) {
    var r = { base: 0n, cg: 0n, sg: 0n, ig: 0n, cess: 0n, gst: 0n, total: 0n, ro: 0n };
    if (o.mode === 'add') {
      r.base = o.amt;
      if (o.inter) r.ig = divRound(r.base * o.R, D);
      else { r.cg = divRound(r.base * o.R, 2n * D); r.sg = r.cg; }
      r.cess = divRound(r.base * o.C, D);
      r.gst = r.cg + r.sg + r.ig;
      r.total = r.base + r.gst + r.cess;
      if (o.round) { var rt = divRound(r.total, 100n) * 100n; r.ro = rt - r.total; r.total = rt; }
    } else {
      r.total = o.amt;
      var b0 = divRound(r.total * D, D + o.R + o.C);
      if (!o.inter) {
        var sp = splitIntra(r.total, o.R, o.C);
        if (sp) { r.cg = r.sg = sp.h; r.cess = sp.cs; r.gst = 2n * sp.h; r.base = sp.base; return r; }
      }
      r.base = b0;
      var tax = r.total - r.base, T = o.R + o.C;
      var g = T > 0n ? divRound(tax * o.R, T) : 0n;
      r.cess = tax - g; r.gst = g;
      if (o.inter) r.ig = g; else { r.cg = divRound(g, 2n); r.sg = g - r.cg; }
    }
    return r;
  }
  /* GST-inclusive amount T inside one state: CGST and SGST are each half the rate on the same taxable value, so they
     must be equal. Find a taxable value b (within 2 paise of T / (1 + rate)) with b + 2 × round(b × rate/2) + cess = T,
     so every line can be checked forward. ₹100 incl. 18% → 84.74 + 7.63 + 7.63 (not 84.75 + 7.63 + 7.62).
     If no such b exists, keep CGST = SGST from the usual base and let the taxable value take the last paisa. */
  function splitIntra(T, R, C) {
    var b0 = divRound(T * D, D + R + C), steps = [0n, -1n, 1n, -2n, 2n];
    for (var k = 0; k < steps.length; k++) {
      var b = b0 + steps[k]; if (b < 0n) continue;
      var h = divRound(b * R, 2n * D), cs = divRound(b * C, D);
      if (b + 2n * h + cs === T) return { base: b, h: h, cs: cs };
    }
    var h0 = divRound(b0 * R, 2n * D), c0 = divRound(b0 * C, D), b1 = T - 2n * h0 - c0;
    return b1 >= 0n ? { base: b1, h: h0, cs: c0 } : null;
  }
  function readCalc() {
    var a = parseDec(calc.amt, 2, MAX_DIGITS), rv = calcRate.value(), C = 0n, err = '';
    if (calc.cessOn && String(calc.cess || '').trim()) {
      var c = parseDec(calc.cess, 4, 3);
      if (c.err || c.v > 4000000n) err = t('err_cess'); else C = c.v;
    }
    if (a.err && a.err !== 'empty') err = t('err_' + a.err);
    else if (rv.err) err = t('err_rate');
    return { a: a, rv: rv, C: C, err: err };
  }
  function breakRow(id, label, p, cls) {
    return el('tr', { id: id, class: cls || '' }, el('th', { scope: 'row', text: label }), el('td', { class: 'v' }, m(p)));
  }
  function renderCalc() {
    if (document.activeElement !== $('#amt') && $('#amt').value !== calc.amt) $('#amt').value = calc.amt;
    $$('#mode [data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === calc.mode)); });
    $$('#supply [data-supply]').forEach(function (b) { b.setAttribute('aria-pressed', String((b.dataset.supply === 'inter') === !!calc.inter)); });
    $('#mode-hint').textContent = t(calc.mode === 'add' ? 'mode_add_hint' : 'mode_remove_hint');
    $('#cess-on').checked = !!calc.cessOn; $('#cess-box').hidden = !calc.cessOn;
    if (document.activeElement !== $('#cess-rate')) $('#cess-rate').value = calc.cess || '';
    $('#round-on').checked = !!calc.round; $('#round-wrap').hidden = calc.mode !== 'add';

    var x = readCalc(), box = $('#calc-result');
    $('#amt-err').textContent = x.err;
    $('#amt').setAttribute('aria-invalid', String(!!(x.a.err && x.a.err !== 'empty')));
    box.innerHTML = '';
    if (x.err || x.a.err) {
      lastCalc = null;
      box.appendChild(el('p', { class: 'muted gc-res-empty', id: 'res-empty', text: x.err ? x.err : t('res_empty') }));
      return;
    }
    var o = { amt: x.a.v, mode: calc.mode, R: x.rv.units, C: calc.cessOn ? x.C : 0n, inter: !!calc.inter, round: calc.mode === 'add' && !!calc.round };
    var r = computeCalc(o);
    lastCalc = { o: o, r: r, rate: x.rv.txt, cess: o.C ? rateTxt(o.C) : '' };
    var big = calc.mode === 'add' ? r.total : r.base;
    var bigEl = el('div', { class: 'gc-big' + (money(big).length > 15 ? ' long' : ''), id: 'res-big' }, m(big));
    var rows = [breakRow('r-taxable', t('row_taxable'), r.base, calc.mode === 'remove' ? 'hl' : '')];
    if (o.inter) rows.push(breakRow('r-igst', t('row_igst', { r: x.rv.txt }), r.ig));
    else {
      rows.push(breakRow('r-cgst', t('row_cgst', { r: halfRateTxt(o.R) }), r.cg));
      rows.push(breakRow('r-sgst', t('row_sgst', { r: halfRateTxt(o.R) }), r.sg));
    }
    if (calc.cessOn) rows.push(breakRow('r-cess', t('row_cess', { r: rateTxt(o.C) }), r.cess));
    rows.push(breakRow('r-gst', t('row_gst_total'), r.gst));
    if (o.round) rows.push(el('tr', { id: 'r-round' }, el('th', { scope: 'row', text: t('row_roundoff') }), el('td', { class: 'v' }, m(r.ro, true))));
    rows.push(breakRow('r-total', t('row_total'), r.total, 'sum'));
    box.appendChild(el('div', { class: 'gc-res-head' },
      el('span', { class: 'gc-res-lbl', text: t(calc.mode === 'add' ? 'res_total_with' : 'res_base') }),
      el('span', { class: 'badge primary', text: t(calc.mode === 'add' ? 'mode_add' : 'mode_remove') + ' · ' + iso(x.rv.txt + '%') })));
    box.appendChild(bigEl);
    box.appendChild(el('table', { class: 'table gc-break' }, el('tbody', null, rows)));
    box.appendChild(wordsBlock(r.total, 'words_total'));
    box.appendChild(el('div', { class: 'row gc-actions' },
      el('button', { type: 'button', class: 'btn btn-primary', id: 'calc-copy', onclick: copyCalc }, '📋 ', el('span', { i18n: 'copy' })),
      el('button', { type: 'button', class: 'btn', id: 'calc-print', onclick: printCalc }, '🖨 ', el('span', { i18n: 'print' }))));
  }
  function calcLines() {
    var c = lastCalc, r = c.r, o = c.o, L = [];
    L.push(t(o.mode === 'add' ? 'mode_add' : 'mode_remove') + ' · GST ' + c.rate + '% · ' + t(o.inter ? 'supply_inter' : 'supply_intra'));
    L.push([t('row_taxable'), money(r.base)]);
    if (o.inter) L.push([t('row_igst', { r: c.rate }), money(r.ig)]);
    else { L.push([t('row_cgst', { r: halfRateTxt(o.R) }), money(r.cg)]); L.push([t('row_sgst', { r: halfRateTxt(o.R) }), money(r.sg)]); }
    if (o.C) L.push([t('row_cess', { r: c.cess }), money(r.cess)]);
    L.push([t('row_gst_total'), money(r.gst)]);
    if (o.round) L.push([t('row_roundoff'), money(r.ro, true)]);
    L.push([t('row_total'), money(r.total)]);
    return L;
  }
  function copyCalc() {
    if (!lastCalc) return;
    saveHist();
    var txt = calcLines().map(function (l) { return Array.isArray(l) ? l[0] + ': ' + l[1] : l; }).join('\n') + '\n' + wordsEN(lastCalc.r.total) + (EDU.lang === 'hi' ? '\n' + wordsHI(lastCalc.r.total) : '');
    EDU.copy(txt);
  }
  function printCalc() {
    if (!lastCalc) return;
    saveHist();
    var L = calcLines(), pa = $('#print-area');
    pa.innerHTML = '';
    pa.appendChild(el('h1', { text: t('app_title') }));
    pa.appendChild(el('p', { text: L[0] + ' · ' + fmtDate(new Date(), true) }));
    pa.appendChild(el('table', null, el('tbody', null, L.slice(1).map(function (l, i) {
      return el('tr', { class: i === L.length - 2 ? 'pa-grand' : '' }, el('td', { text: l[0] }), el('td', { class: 'v', text: l[1] }));
    }))));
    printWords(pa, lastCalc.r.total, 'words_total');
    window.print();
  }

  /* history (last 20) */
  function queueHist() { clearTimeout(histTimer); histTimer = setTimeout(saveHist, 2500); }
  function saveHist() {
    clearTimeout(histTimer);
    if (!lastCalc) return;
    var c = lastCalc, r = c.r, o = c.o;
    var e = { amt: o.amt.toString(), mode: o.mode, rate: c.rate, inter: o.inter, cess: c.cess, round: o.round,
      base: r.base.toString(), cg: r.cg.toString(), sg: r.sg.toString(), ig: r.ig.toString(), cs: r.cess.toString(), ro: r.ro.toString(), total: r.total.toString(), ts: Date.now() };
    var top = hist[0];
    if (top && top.amt === e.amt && top.mode === e.mode && top.rate === e.rate && top.inter === e.inter && top.cess === e.cess && top.round === e.round) return;
    hist.unshift(e);
    hist = hist.slice(0, 20);
    store.set('hist', hist);
    renderHist();
  }
  function B(s) { try { return BigInt(s || '0'); } catch (e) { return 0n; } }
  function renderHist() {
    var list = $('#hist-list');
    list.innerHTML = '';
    $('#hist-empty').hidden = hist.length > 0;
    $('#hist-csv').disabled = !hist.length; $('#hist-clear').disabled = !hist.length;
    hist.forEach(function (e, i) {
      var inAmt = B(e.amt), out = e.mode === 'add' ? B(e.total) : B(e.base);
      var sub = [t(e.mode === 'add' ? 'mode_add' : 'mode_remove') + ' ' + iso(e.rate + '%'), t(e.inter ? 'supply_inter' : 'supply_intra')];
      if (e.cess) sub.push(t('row_cess', { r: e.cess }));
      sub.push('GST ' + iso(money(B(e.cg) + B(e.sg) + B(e.ig))));
      sub.push(fmtDate(new Date(e.ts), true));
      list.appendChild(el('li', null, el('button', { type: 'button', class: 'gc-hist-item', title: t('hist_load'), dataset: { i: String(i) },
        onclick: function () { loadHist(e); } },
        el('span', { class: 'gc-hist-main' }, m(inAmt), el('span', { class: 'gc-arr', 'aria-hidden': 'true', text: '→' }), el('span', { class: 'out' }, m(out))),
        el('span', { class: 'gc-hist-sub', text: sub.join(' · ') }))));
    });
  }
  function loadHist(e) {
    calc.amt = inputText(B(e.amt)); calc.mode = e.mode; calc.inter = !!e.inter;
    calc.cessOn = !!e.cess; calc.cess = e.cess || ''; calc.round = !!e.round;
    calcRate.set(e.rate);
    $('#amt').value = calc.amt;
    saveCalc(); renderCalc(); showTab('calc');
    $('#amt').focus();
  }
  function histCsv() {
    var rows = [[t('col_time'), t('col_type'), t('col_gst'), t('supply_label'), t('row_taxable'), t('col_cgst'), t('col_sgst'), t('col_igst'), t('col_cess'), t('row_gst_total'), t('row_roundoff'), t('row_total')]];
    hist.forEach(function (e) {
      rows.push([stamp(e.ts), t(e.mode === 'add' ? 'mode_add' : 'mode_remove'), e.rate, t(e.inter ? 'supply_inter' : 'supply_intra'),
        plain(B(e.base)), plain(B(e.cg)), plain(B(e.sg)), plain(B(e.ig)), plain(B(e.cs)), plain(B(e.cg) + B(e.sg) + B(e.ig)), plain(B(e.ro)), plain(B(e.total))]);
    });
    EDU.download('gst-history.csv', EDU.csv.stringify(rows), 'text/csv');
  }

  $('#amt').value = calc.amt;
  $('#amt').addEventListener('input', function () { calc.amt = this.value; saveCalc(); renderCalc(); queueHist(); });
  $('#amt').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); saveHist(); } });
  $$('#mode [data-mode]').forEach(function (b) { b.addEventListener('click', function () { calc.mode = b.dataset.mode; saveCalc(); renderCalc(); queueHist(); }); });
  $$('#supply [data-supply]').forEach(function (b) { b.addEventListener('click', function () { calc.inter = b.dataset.supply === 'inter'; saveCalc(); renderCalc(); queueHist(); }); });
  $('#cess-on').addEventListener('change', function () { calc.cessOn = this.checked; saveCalc(); renderCalc(); queueHist(); if (this.checked) $('#cess-rate').focus(); });
  $('#cess-rate').addEventListener('input', function () { calc.cess = this.value; saveCalc(); renderCalc(); queueHist(); });
  $('#round-on').addEventListener('change', function () { calc.round = this.checked; saveCalc(); renderCalc(); queueHist(); });
  calcRate.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); saveHist(); } });
  $('#hist-clear').addEventListener('click', function () {
    if (!hist.length || !confirm(t('hist_confirm'))) return;
    hist = []; store.set('hist', hist); renderHist();
  });
  $('#hist-csv').addEventListener('click', histCsv);

  /* ============================================================ 2. Quick bill */
  function sampleItems() {
    return [
      { name: t('sample_item1'), hsn: '1006', qty: '2', rate: '650', gst: '5' },
      { name: t('sample_item2'), hsn: '3305', qty: '3', rate: '199', gst: '5' },
      { name: t('sample_item3'), hsn: '8509', qty: '1', rate: '3,499', gst: '18' }
    ];
  }
  function newBill(withSample) {
    return { seller: '', sgstin: '', buyer: '', bgstin: '', no: '1', date: isoDay(new Date()), inter: false, incl: false, round: true,
      items: withSample ? sampleItems() : [{ name: '', hsn: '', qty: '1', rate: '', gst: '18' }] };
  }
  function cleanItem(it) {
    it = obj(it) || {};
    return { name: str(it.name), hsn: str(it.hsn), qty: str(it.qty, '1'), rate: str(it.rate), gst: str(it.gst, '18') || '18' };
  }
  var bill = obj(store.get('bill', null));
  if (!bill || !Array.isArray(bill.items)) bill = newBill(true);
  else {
    bill = { seller: str(bill.seller), sgstin: str(bill.sgstin), buyer: str(bill.buyer), bgstin: str(bill.bgstin), no: str(bill.no),
      date: /^\d{4}-\d\d-\d\d$/.test(str(bill.date)) ? bill.date : isoDay(new Date()), inter: bill.inter === true, incl: bill.incl === true,
      round: bill.round !== false, items: bill.items.filter(obj).map(cleanItem) };
    if (!bill.items.length) bill.items.push(cleanItem({}));
  }
  var lastBill = null;
  function saveBill() { store.set('bill', bill); }

  function computeBill() {
    var lines = [], groups = {}, any = false;
    bill.items.forEach(function (it) {
      var blank = !String(it.name || '').trim() && !String(it.rate || '').trim();
      var q = parseDec(it.qty, 3, 9), p = parseDec(it.rate, 2, MAX_DIGITS), R = parseDec(it.gst, 4, 4);
      var ln = { blank: blank, amt: null };
      if (!blank && !q.err && !p.err && !R.err) {
        ln.amt = divRound(q.v * p.v, 1000n);
        var g = groups[it.gst] || (groups[it.gst] = { rate: rateTxt(R.v), R: R.v, sum: 0n });
        g.sum += ln.amt; any = true;
      } else if (!blank) ln.bad = true;
      lines.push(ln);
    });
    var rows = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) { return a.R < b.R ? -1 : a.R > b.R ? 1 : 0; }).map(function (g) {
      var x = { rate: g.rate, R: g.R, taxable: 0n, cg: 0n, sg: 0n, ig: 0n };
      if (bill.incl) {
        var sp = bill.inter ? null : splitIntra(g.sum, g.R, 0n);
        if (sp) { x.cg = x.sg = sp.h; x.taxable = sp.base; }   // CGST = SGST, and the total stays what was typed
        else {
          x.taxable = divRound(g.sum * D, D + g.R);
          var tax = g.sum - x.taxable;
          if (bill.inter) x.ig = tax; else { x.cg = divRound(tax, 2n); x.sg = tax - x.cg; }
        }
      } else {
        x.taxable = g.sum;
        if (bill.inter) x.ig = divRound(g.sum * g.R, D); else { x.cg = divRound(g.sum * g.R, 2n * D); x.sg = x.cg; }
      }
      x.tax = x.cg + x.sg + x.ig;
      return x;
    });
    var tot = { taxable: 0n, cg: 0n, sg: 0n, ig: 0n, tax: 0n };
    rows.forEach(function (x) { ['taxable', 'cg', 'sg', 'ig', 'tax'].forEach(function (k) { tot[k] += x[k]; }); });
    tot.total = tot.taxable + tot.tax; tot.ro = 0n;
    if (bill.round) { var rt = divRound(tot.total, 100n) * 100n; tot.ro = rt - tot.total; tot.total = rt; }
    return { lines: lines, rows: rows, tot: tot, any: any };
  }

  function rateOptions(sel) {
    var s = el('select', { 'data-f': 'gst' });
    PRESETS.forEach(function (r) { s.appendChild(el('option', { value: r, text: r + '%' })); });
    var og = el('optgroup', { label: t('bill_old_rates') });
    OLD_RATES.forEach(function (r) { og.appendChild(el('option', { value: r, text: r + '%' })); });
    s.appendChild(og);
    if (PRESETS.indexOf(sel) < 0 && OLD_RATES.indexOf(sel) < 0) s.appendChild(el('option', { value: sel, text: sel + '%' }));
    s.value = sel;
    return s;
  }
  function renderBillRows() {
    var host = $('#bill-rows');
    host.innerHTML = '';
    bill.items.forEach(function (it, i) {
      function fld(cls, key, lbl, attrs) {
        var inp = el('input', Object.assign({ type: 'text', 'data-f': key, autocomplete: 'off' }, attrs || {}));
        inp.value = it[key] || '';
        return el('label', { class: 'bl-f ' + cls }, el('span', { class: 'bl-l', text: lbl }), inp);
      }
      var row = el('div', { class: 'bl-row', dataset: { i: String(i) } },
        el('span', { class: 'bl-n', text: String(i + 1) }),
        fld('bl-item', 'name', t('col_item'), { placeholder: t('item_ph') }),
        fld('bl-hsn', 'hsn', t('col_hsn'), { class: 'gc-num', inputmode: 'numeric' }),
        fld('bl-qty', 'qty', t('col_qty'), { class: 'gc-num', inputmode: 'decimal' }),
        fld('bl-rate', 'rate', t('col_rate'), { class: 'gc-num', inputmode: 'decimal' }),
        el('label', { class: 'bl-f bl-gst' }, el('span', { class: 'bl-l', text: t('col_gst') }), rateOptions(String(it.gst))),
        el('div', { class: 'bl-amt', 'aria-live': 'off' }),
        el('button', { type: 'button', class: 'btn btn-ghost bl-del', 'aria-label': t('bill_del_line') + ' ' + (i + 1), title: t('bill_del_line'), text: '✕' }));
      host.appendChild(row);
    });
    renderBillTotals();
  }
  /* fromGstin: a GSTIN was just typed, so pick IGST or CGST + SGST from the two state codes. The user can still
     switch by hand afterwards (place of supply is not always the buyer's state, e.g. hotel stays, bill-to/ship-to). */
  function supplySync(fromGstin) {
    var a = checkGstin(bill.sgstin), b = checkGstin(bill.bgstin), note = '';
    $('#b-sgstin-note').textContent = (!a.empty && !a.valid && !a.partial) || (!a.empty && a.errs.length) ? t('bill_gstin_bad') : '';
    $('#b-bgstin-note').textContent = (!b.empty && !b.valid && !b.partial) || (!b.empty && b.errs.length) ? t('bill_gstin_bad') : '';
    if (a.valid && b.valid) {
      var sa = a.s.slice(0, 2), sb = b.s.slice(0, 2), S = states(), auto = sa !== sb;
      if (fromGstin && bill.inter !== auto) { bill.inter = auto; saveBill(); }
      if (bill.inter === auto) note = auto ? t('bill_auto_inter', { a: S[sa], b: S[sb] }) : t('bill_auto_intra', { a: S[sa] });
    }
    $('#b-auto').textContent = note;
    $$('#b-supply [data-supply]').forEach(function (x) { x.setAttribute('aria-pressed', String((x.dataset.supply === 'inter') === !!bill.inter)); });
  }
  function renderBillTotals(fromGstin) {
    supplySync(fromGstin);
    var c = computeBill();
    lastBill = c;
    $$('#bill-rows .bl-row').forEach(function (row, i) {
      var ln = c.lines[i], cell = $('.bl-amt', row);
      cell.innerHTML = ''; cell.classList.toggle('bad', !!ln.bad);
      if (ln.amt !== null) cell.appendChild(m(ln.amt));
      else if (ln.bad) cell.textContent = t('bill_line_err');
    });
    var sum = $('#bill-summary'), tots = $('#bill-totals');
    sum.innerHTML = ''; tots.innerHTML = '';
    if (!c.any) { sum.appendChild(el('p', { class: 'muted', text: t('bill_empty') })); return; }
    var head = [t('col_gst'), t('col_taxable')].concat(bill.inter ? [t('col_igst')] : [t('col_cgst'), t('col_sgst'), t('row_gst_total')]);
    sum.appendChild(el('table', { class: 'table gc-tbl', id: 'bill-sum-table' },
      el('thead', null, el('tr', null, head.map(function (h, i) { return el('th', { scope: 'col', class: (i ? 'v' : '') + (i === 4 ? ' gc-hide-sm' : ''), text: h }); }))),
      el('tbody', null, c.rows.map(function (x) {
        var cells = [el('td', { class: 'gc-ltr', text: x.rate + '%' }), el('td', { class: 'v' }, m(x.taxable))];
        if (bill.inter) cells.push(el('td', { class: 'v' }, m(x.ig)));
        else { cells.push(el('td', { class: 'v' }, m(x.cg))); cells.push(el('td', { class: 'v' }, m(x.sg))); }
        if (!bill.inter) cells.push(el('td', { class: 'v gc-hide-sm' }, m(x.tax)));
        return el('tr', null, cells);
      }))));
    var T = c.tot, kv = [[t('row_taxable'), T.taxable, 'bt-taxable']];
    if (bill.inter) kv.push([t('col_igst'), T.ig, 'bt-igst']); else { kv.push([t('col_cgst'), T.cg, 'bt-cgst']); kv.push([t('col_sgst'), T.sg, 'bt-sgst']); }
    if (bill.round) kv.push([t('row_roundoff'), T.ro, 'bt-round', true]);
    tots.appendChild(el('dl', { class: 'gc-kv' }, kv.map(function (k) { return el('div', { id: k[2] }, el('dt', { text: k[0] }), el('dd', null, m(k[1], k[3]))); })));
    tots.appendChild(el('p', { class: 'muted mb0', style: { marginTop: '12px' }, text: t('bill_grand') }));
    tots.appendChild(el('div', { class: 'gc-grand', id: 'bill-grand' }, m(T.total)));
    tots.appendChild(wordsBlock(T.total));
  }
  function billFields() {
    $$('[data-bf]').forEach(function (inp) { if (document.activeElement !== inp) inp.value = bill[inp.dataset.bf] || ''; });
    $('#b-incl').checked = !!bill.incl; $('#b-round').checked = !!bill.round;
  }
  function addLine(focus) {
    var last = bill.items[bill.items.length - 1];
    bill.items.push({ name: '', hsn: '', qty: '1', rate: '', gst: last ? last.gst : '18' });
    saveBill(); renderBillRows();
    if (focus) { var rows = $$('#bill-rows .bl-row'); $('[data-f="name"]', rows[rows.length - 1]).focus(); }
  }
  $('#bill-rows').addEventListener('input', function (e) {
    var row = e.target.closest('.bl-row'), f = e.target.getAttribute('data-f');
    if (!row || !f) return;
    bill.items[+row.dataset.i][f] = e.target.value;
    saveBill(); renderBillTotals();
  });
  $('#bill-rows').addEventListener('change', function (e) {
    if (e.target.tagName !== 'SELECT') return;
    var row = e.target.closest('.bl-row');
    bill.items[+row.dataset.i].gst = e.target.value;
    saveBill(); renderBillTotals();
  });
  $('#bill-rows').addEventListener('click', function (e) {
    var b = e.target.closest('.bl-del'); if (!b) return;
    var i = +b.closest('.bl-row').dataset.i;
    bill.items.splice(i, 1);
    if (!bill.items.length) bill.items.push({ name: '', hsn: '', qty: '1', rate: '', gst: '18' });
    saveBill(); renderBillRows();
  });
  $('#bill-rows').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    var row = e.target.closest('.bl-row');
    if (+row.dataset.i === bill.items.length - 1) addLine(true);
    else { var next = $$('#bill-rows .bl-row')[+row.dataset.i + 1]; $('[data-f="' + e.target.getAttribute('data-f') + '"]', next).focus(); }
  });
  $$('[data-bf]').forEach(function (inp) {
    inp.addEventListener('input', function () { bill[inp.dataset.bf] = inp.value; saveBill(); if (/gstin/.test(inp.dataset.bf)) renderBillTotals(true); });
  });
  $$('#b-supply [data-supply]').forEach(function (b) { b.addEventListener('click', function () { bill.inter = b.dataset.supply === 'inter'; saveBill(); renderBillTotals(); }); });
  $('#b-incl').addEventListener('change', function () { bill.incl = this.checked; saveBill(); renderBillTotals(); });
  $('#b-round').addEventListener('change', function () { bill.round = this.checked; saveBill(); renderBillTotals(); });
  $('#bill-add').addEventListener('click', function () { addLine(true); });
  $('#bill-sample').addEventListener('click', function () {
    var typed = bill.items.some(function (it) { return String(it.name || '').trim() || String(it.rate || '').trim(); });
    if (typed && !confirm(t('bill_confirm_sample'))) return;
    bill.items = sampleItems(); saveBill(); renderBillRows();
  });
  $('#bill-new').addEventListener('click', function () {
    if (!confirm(t('bill_confirm_new'))) return;
    var keep = { seller: bill.seller, sgstin: bill.sgstin, no: String(bill.no || '') };
    bill = newBill(false); bill.seller = keep.seller; bill.sgstin = keep.sgstin;
    var mNo = /^(.*?)(\d+)$/.exec(keep.no);   /* "INV-0041" → "INV-0042" */
    bill.no = mNo ? mNo[1] + String(+mNo[2] + 1).padStart(mNo[2].length, '0') : '';
    saveBill(); billFields(); renderBillRows();
    $('#b-buyer').focus();
  });

  function billCsv() {
    var c = lastBill; if (!c || !c.any) { EDU.toast(t('bill_empty')); return; }
    var rows = [[t('bill_seller'), cell(bill.seller), t('bill_seller_gstin'), cell(cleanGstin(bill.sgstin))],
      [t('bill_buyer'), cell(bill.buyer), t('bill_buyer_gstin'), cell(cleanGstin(bill.bgstin))],
      [t('bill_no'), cell(bill.no), t('bill_date'), bill.date], [],
      ['#', t('col_item'), t('col_hsn'), t('col_qty'), t('col_rate'), t('col_gst'), t('col_amount')]];
    bill.items.forEach(function (it, i) {
      var ln = c.lines[i]; if (ln.amt === null) return;
      rows.push([i + 1, cell(it.name), cell(it.hsn), latinDigits(it.qty).replace(/[\s,]/g, ''), plain(parseDec(it.rate, 2, MAX_DIGITS).v), it.gst, plain(ln.amt)]);
    });
    rows.push([]);
    rows.push([t('col_gst'), t('col_taxable'), t('col_cgst'), t('col_sgst'), t('col_igst'), t('row_gst_total')]);
    c.rows.forEach(function (x) { rows.push([x.rate, plain(x.taxable), plain(x.cg), plain(x.sg), plain(x.ig), plain(x.tax)]); });
    rows.push([]);
    rows.push([t('row_taxable'), plain(c.tot.taxable)]);
    rows.push([t('row_gst_total'), plain(c.tot.tax)]);
    if (bill.round) rows.push([t('row_roundoff'), plain(c.tot.ro)]);
    rows.push([t('bill_grand'), plain(c.tot.total)]);
    rows.push([t('words_label'), wordsEN(c.tot.total)]);
    EDU.download('gst-bill-' + (String(bill.no || '1').replace(/[^\w-]+/g, '_')) + '.csv', EDU.csv.stringify(rows), 'text/csv');
  }
  function billText() {
    var c = lastBill, L = [];
    if (bill.seller) L.push(bill.seller + (bill.sgstin ? ' · GSTIN ' + cleanGstin(bill.sgstin) : ''));
    if (bill.buyer || bill.bgstin) L.push(t('bill_to') + ': ' + (bill.buyer || '') + (bill.bgstin ? ' · GSTIN ' + cleanGstin(bill.bgstin) : ''));
    L.push(t('bill_no') + ' ' + (bill.no || '') + ' · ' + (bill.date || ''));
    L.push('');
    bill.items.forEach(function (it, i) {
      var ln = c.lines[i]; if (ln.amt === null) return;
      L.push((i + 1) + '. ' + (it.name || '-') + ' × ' + it.qty + ' @ ' + money(parseDec(it.rate, 2, MAX_DIGITS).v) + ' (' + it.gst + '%) = ' + money(ln.amt));
    });
    L.push('');
    c.rows.forEach(function (x) {
      L.push('GST ' + x.rate + '%: ' + t('col_taxable') + ' ' + money(x.taxable) + (bill.inter ? ', IGST ' + money(x.ig) : ', CGST ' + money(x.cg) + ', SGST ' + money(x.sg)));
    });
    L.push(t('row_gst_total') + ': ' + money(c.tot.tax));
    if (bill.round) L.push(t('row_roundoff') + ': ' + money(c.tot.ro, true));
    L.push(t('bill_grand') + ': ' + money(c.tot.total));
    L.push(wordsEN(c.tot.total));
    if (EDU.lang === 'hi') L.push(wordsHI(c.tot.total));
    return L.join('\n');
  }
  function printBill() {
    var c = lastBill; if (!c || !c.any) { EDU.toast(t('bill_empty')); return; }
    var pa = $('#print-area'); pa.innerHTML = '';
    var dt = bill.date ? fmtDate(new Date(bill.date + 'T00:00:00')) : '';
    pa.appendChild(el('h1', { text: t('bill_title_print') }));
    pa.appendChild(el('div', { class: 'pa-parties' },
      el('div', null, el('strong', { text: bill.seller || '' }), bill.sgstin ? el('div', { text: 'GSTIN: ' + cleanGstin(bill.sgstin) }) : null),
      el('div', null, el('div', { class: 'pa-small', text: t('bill_to') }), el('strong', { text: bill.buyer || '' }), bill.bgstin ? el('div', { text: 'GSTIN: ' + cleanGstin(bill.bgstin) }) : null),
      el('div', null, el('div', { text: t('bill_no') + ' ' + (bill.no || '') }), el('div', { text: t('bill_date') + ': ' + dt }),
        el('div', { class: 'pa-small', text: t(bill.inter ? 'supply_inter' : 'supply_intra') }))));
    pa.appendChild(el('table', null,
      el('thead', null, el('tr', null, ['#', t('col_item'), t('col_hsn'), t('col_qty'), t('col_rate'), t('col_gst'), t('col_amount')].map(function (h, i) { return el('th', { class: i >= 3 ? 'v' : '', text: h }); }))),
      el('tbody', null, bill.items.map(function (it, i) {
        var ln = c.lines[i]; if (ln.amt === null) return null;
        return el('tr', null, el('td', { text: String(i + 1) }), el('td', { text: it.name }), el('td', { text: it.hsn }), el('td', { class: 'v', text: it.qty }),
          el('td', { class: 'v', text: money(parseDec(it.rate, 2, MAX_DIGITS).v) }), el('td', { class: 'v', text: it.gst + '%' }), el('td', { class: 'v', text: money(ln.amt) }));
      }))));
    var sh = [t('col_gst'), t('col_taxable')].concat(bill.inter ? [t('col_igst')] : [t('col_cgst'), t('col_sgst')]).concat([t('row_gst_total')]);
    pa.appendChild(el('table', null,
      el('thead', null, el('tr', null, sh.map(function (h, i) { return el('th', { class: i ? 'v' : '', text: h }); }))),
      el('tbody', null, c.rows.map(function (x) {
        var cells = [el('td', { text: x.rate + '%' }), el('td', { class: 'v', text: money(x.taxable) })];
        if (bill.inter) cells.push(el('td', { class: 'v', text: money(x.ig) }));
        else { cells.push(el('td', { class: 'v', text: money(x.cg) })); cells.push(el('td', { class: 'v', text: money(x.sg) })); }
        cells.push(el('td', { class: 'v', text: money(x.tax) }));
        return el('tr', null, cells);
      }))));
    var tr = [[t('row_taxable'), money(c.tot.taxable)], [t('row_gst_total'), money(c.tot.tax)]];
    if (bill.round) tr.push([t('row_roundoff'), money(c.tot.ro, true)]);
    pa.appendChild(el('table', null, el('tbody', null, tr.map(function (r) { return el('tr', null, el('td', { text: r[0] }), el('td', { class: 'v', text: r[1] })); }),
      el('tr', { class: 'pa-grand' }, el('td', { text: t('bill_grand') }), el('td', { class: 'v', text: money(c.tot.total) })))));
    printWords(pa, c.tot.total, 'words_label');
    pa.appendChild(el('p', { class: 'pa-sign', text: (bill.seller ? bill.seller + ' · ' : '') + t('bill_sign') }));
    window.print();
  }
  $('#bill-csv').addEventListener('click', billCsv);
  $('#bill-print').addEventListener('click', printBill);
  $('#bill-copy').addEventListener('click', function () { if (!lastBill || !lastBill.any) { EDU.toast(t('bill_empty')); return; } EDU.copy(billText()); });

  /* ============================================================ 3. Price planner */
  var price = obj(store.get('price', null)) || { want: '1,000', cost: '400', profit: '25', mrp: '599' };
  price = { want: str(price.want), round: oneOf(str(price.round), ['0', '1', '10', '50', '100'], '10'), cost: str(price.cost), profit: str(price.profit),
    kind: oneOf(price.kind, ['markup', 'margin'], 'markup'), mrp: str(price.mrp) };
  function savePrice() { store.set('price', price); }
  var pqRate = ratePicker($('#pq-rates'), 'pqRate', renderPrice);
  var spRate = ratePicker($('#sp-rates'), 'spRate', renderPrice);
  function kvList(id, items) {
    return el('dl', { class: 'gc-kv', id: id }, items.map(function (k) {
      return el('div', { class: k[2] || '', id: k[3] || null }, el('dt', { text: k[0] }), el('dd', null, k[1]));
    }));
  }
  function amtErr(code) { return t(code === 'negative' ? 'err_negative_amt' : 'err_' + code); }   // no credit-note hint here
  function msgEl(cls, text, id) { return el('p', { class: 'callout gc-msg ' + cls, text: text, id: id || null }); }
  function renderPrice() {
    var rs = $('#pq-round'), cur = price.round;
    rs.innerHTML = '';
    rs.appendChild(el('option', { value: '0', text: t('pq_round_none') }));
    ['1', '10', '50', '100'].forEach(function (n) { rs.appendChild(el('option', { value: n, text: t('pq_round_n', { n: n }) })); });
    rs.value = cur;
    $$('#sp-kind [data-kind]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.kind === price.kind)); });

    /* a) price to quote */
    var out = $('#pq-out'); out.innerHTML = '';
    var w = parseDec(price.want, 2, MAX_DIGITS), rv = pqRate.value();
    if (w.err && w.err !== 'empty') out.appendChild(msgEl('danger', amtErr(w.err)));
    else if (rv.err) out.appendChild(msgEl('danger', t('err_rate')));
    else if (!w.err) {
      var q = divRound(w.v * (D + rv.units), D), step = BigInt(price.round || '0') * 100n;
      if (step > 0n) q = ((q + step - 1n) / step) * step;
      var keep = divRound(q * D, D + rv.units), gst = q - keep;
      out.appendChild(kvList('pq-kv', [[t('pq_quote'), m(q), 'big', 'pq-quote'], [t('pq_gst') + ' (' + iso(rv.txt + '%') + ')', m(gst), '', 'pq-gst'], [t('pq_keep'), m(keep), '', 'pq-keep']]));
      if (keep > w.v) out.appendChild(el('p', { class: 'muted small gc-msg', text: t('pq_extra', { x: iso(money(keep - w.v)) }) }));
    }

    /* b) selling price from cost */
    var so = $('#sp-out'); so.innerHTML = '';
    var c = parseDec(price.cost, 2, MAX_DIGITS), p = parseDec(price.profit, 4, 4), R = spRate.value(), mrp = parseDec(price.mrp, 2, MAX_DIGITS);
    var err = '';
    if (c.err && c.err !== 'empty') err = amtErr(c.err);
    else if (p.err && p.err !== 'empty') err = t(p.err === 'number' ? 'err_number' : 'err_profit');
    else if (R.err) err = t('err_rate');
    else if (mrp.err && mrp.err !== 'empty') err = amtErr(mrp.err);
    else if (!p.err && price.kind === 'margin' && p.v >= D) err = t('err_margin');
    else if (!p.err && p.v > 10n * D) err = t('err_profit');
    if (err) { so.appendChild(msgEl('danger', err)); return; }
    if (c.err) return;
    var P = p.err ? 0n : p.v;
    var ex = price.kind === 'margin' ? divRound(c.v * D, D - P) : divRound(c.v * (D + P), D);
    var g2 = divRound(ex * R.units, D), inc = ex + g2, prof = ex - c.v;
    so.appendChild(kvList('sp-kv', [[t('sp_price_ex'), m(ex), '', 'sp-ex'], [t('pq_gst') + ' (' + iso(R.txt + '%') + ')', m(g2), '', 'sp-gst'],
      [t('sp_price_in'), m(inc), 'big', 'sp-in'], [t('sp_profit_unit'), m(prof), '', 'sp-profit']]));
    so.appendChild(el('p', { class: 'muted small gc-msg', text: t('sp_profit_both', { m: pct(ratio(prof, c.v)), g: pct(ratio(prof, ex)) }) }));
    if (!mrp.err && mrp.v > 0n) {
      var diff = mrp.v - inc;
      if (diff > 0n) so.appendChild(msgEl('success', t('sp_below', { d: iso(money(diff)), p: pct(ratio(diff, mrp.v)) }), 'sp-mrp-msg'));
      else if (diff === 0n) so.appendChild(msgEl('success', t('sp_equal'), 'sp-mrp-msg'));
      else so.appendChild(msgEl('danger', t('sp_above', { d: iso(money(-diff)) }), 'sp-mrp-msg'));
      var bx = divRound(mrp.v * D, D + R.units), pm = bx - c.v;
      so.appendChild(el('p', { class: 'small gc-msg', id: 'sp-at-mrp', text: pm >= 0n
        ? t('sp_at_mrp', { b: iso(money(bx)), p: iso(money(pm)), m: pct(ratio(pm, c.v)) })
        : t('sp_loss_at_mrp', { b: iso(money(bx)), p: iso(money(-pm)) }) }));
    }
  }
  [['#pq-amt', 'want'], ['#sp-cost', 'cost'], ['#sp-profit', 'profit'], ['#sp-mrp', 'mrp']].forEach(function (x) {
    var inp = $(x[0]); inp.value = price[x[1]] || '';
    inp.addEventListener('input', function () { price[x[1]] = inp.value; savePrice(); renderPrice(); });
  });
  $('#pq-round').addEventListener('change', function () { price.round = this.value; savePrice(); renderPrice(); });
  $$('#sp-kind [data-kind]').forEach(function (b) { b.addEventListener('click', function () { price.kind = b.dataset.kind; savePrice(); renderPrice(); }); });

  /* ============================================================ 4. GSTIN checker */
  var gst = str(store.get('gstin', SAMPLE_GSTIN));
  var batch = str(store.get('batch', ''));
  var lastBatch = null, BATCH_MAX = 2000;
  var SEGS = [['gx-st', 'g_seg_state'], ['gx-pan', 'g_seg_pan'], ['gx-en', 'g_seg_entity'], ['gx-z', 'g_seg_z'], ['gx-ck', 'g_seg_check']];
  function segOf(i) { return i < 2 ? 'gx-st' : i < 12 ? 'gx-pan' : i === 12 ? 'gx-en' : i === 13 ? 'gx-z' : 'gx-ck'; }
  function renderGstin() {
    var r = checkGstin(gst), boxes = $('#gx-boxes');
    boxes.innerHTML = '';
    for (var i = 0; i < 15; i++) {
      var ch = r.s.charAt(i);
      boxes.appendChild(el('span', { class: 'gx-c ' + segOf(i) + (ch ? '' : ' empty') + (r.bad[i] ? ' bad' : ''), text: ch || '·' }));
    }
    var lg = $('#gx-legend'); lg.innerHTML = '';
    SEGS.forEach(function (s) { lg.appendChild(el('span', { class: s[0] }, el('i', { 'aria-hidden': 'true' }), t(s[1]))); });
    var st = $('#gx-status'), state, msg;
    if (r.empty) { state = 'empty'; msg = t('g_empty'); }
    else if (r.valid) { state = 'ok'; msg = '✓ ' + t('g_ok'); }
    else if (r.errs.length) { state = 'bad'; msg = '✗ ' + t('g_bad'); }
    else if (r.n === 14 && r.expected) { state = 'wait'; msg = t('g_need15', { c: r.expected }); }
    else { state = 'wait'; msg = t('g_partial', { n: r.n }); }
    st.dataset.state = state; st.textContent = msg;
    var E = $('#gx-errs'), W = $('#gx-warns'), I = $('#gx-info');
    E.innerHTML = ''; W.innerHTML = ''; I.innerHTML = '';
    r.errs.forEach(function (x) { E.appendChild(el('li', { text: x })); });
    r.warns.forEach(function (x) { W.appendChild(el('li', { text: x })); });
    var S = states(), info = [];
    if (r.state) info.push([t('g_state'), el('span', null, el('bdi', { class: 'gc-ltr', text: r.state }), ' · ' + S[r.state]), 'g-state']);
    if (r.pan) info.push([t('g_pan'), el('bdi', { class: 'gc-ltr', text: r.pan }), 'g-pan']);
    if (r.holder) info.push([t('g_holder'), holderName(r.holder), 'g-holder']);
    if (r.entity !== undefined) info.push([t('g_entity'), t('g_entity_val', { n: r.entity }), 'g-entity']);
    if (r.got) info.push([t('g_check'), r.got === r.expected ? '✓ ' + t('g_check_ok', { c: r.got }) : '✗ ' + t('g_check_bad', { c: r.got, e: r.expected }), 'g-check']);
    info.forEach(function (k) { I.appendChild(el('div', { id: k[2] }, el('dt', { text: k[0] }), el('dd', null, k[1]))); });
    $('#g-copy').disabled = r.empty;
  }
  function runBatch() {
    var all = batch.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean), lines = all.slice(0, BATCH_MAX);
    var ok = 0, res = lines.map(function (s) { var r = checkGstin(s); if (r.valid) ok++; return r; });
    lastBatch = res;
    var out = $('#batch-out'); out.innerHTML = '';
    $('#batch-sum').textContent = lines.length ? t('g_batch_sum', { ok: ok, bad: lines.length - ok }) : '';
    $('#batch-csv').disabled = !lines.length;
    if (!lines.length) return;
    if (all.length > BATCH_MAX) out.appendChild(el('p', { class: 'callout warning gc-msg', id: 'batch-limit', text: t('g_batch_limit', { n: String(BATCH_MAX) }) }));
    var S = states();
    out.appendChild(el('table', { class: 'table gc-tbl', id: 'batch-table' },
      el('thead', null, el('tr', null, ['#', t('col_gstin'), t('col_result'), t('col_state'), t('col_holder')].map(function (h, i) { return el('th', { scope: 'col', class: i === 0 || i === 4 ? 'gc-hide-sm' : null, text: h }); }))),
      el('tbody', null, res.map(function (r, i) {
        return el('tr', { dataset: { valid: String(r.valid) } },
          el('td', { class: 'gc-hide-sm', text: String(i + 1) }),
          el('td', { class: 'no-i18n gc-ltr', text: r.s }),
          el('td', { class: r.valid ? 'ok' : 'bad' }, (r.valid ? '✓ ' + t('g_valid') : '✗ ' + t('g_invalid')), r.valid ? null : el('span', { class: 'why', text: r.errs[0] || t('g_partial', { n: r.n }) })),
          el('td', { text: r.state ? S[r.state] : '–' }),
          el('td', { class: 'gc-hide-sm', text: r.pan ? holderName(r.holder) : '–' }));
      }))));
  }
  function batchCsv() {
    if (!lastBatch) return;
    var S = states(), rows = [[t('col_gstin'), t('col_result'), t('col_state'), t('col_holder'), t('g_pan')]];
    lastBatch.forEach(function (r) {
      rows.push([cell(r.s), r.valid ? t('g_valid') : t('g_invalid') + ': ' + (r.errs[0] || t('g_partial', { n: r.n })), r.state ? r.state + ' ' + S[r.state] : '', r.pan ? holderName(r.holder) : '', r.pan || '']);
    });
    EDU.download('gstin-check.csv', EDU.csv.stringify(rows), 'text/csv');
  }
  $('#gstin').value = gst;
  $('#gstin').addEventListener('input', function () { gst = this.value; store.set('gstin', gst); renderGstin(); });
  $('#g-sample').addEventListener('click', function () { gst = SAMPLE_GSTIN; $('#gstin').value = gst; store.set('gstin', gst); renderGstin(); });
  $('#g-clear').addEventListener('click', function () { gst = ''; $('#gstin').value = ''; store.set('gstin', gst); renderGstin(); $('#gstin').focus(); });
  $('#g-copy').addEventListener('click', function () { var s = cleanGstin(gst); if (s) EDU.copy(s); });
  $('#batch-in').value = batch;
  $('#batch-in').addEventListener('input', function () { batch = this.value; store.set('batch', batch); });
  $('#batch-run').addEventListener('click', runBatch);
  $('#batch-csv').addEventListener('click', batchCsv);

  /* ============================================================ everything */
  function renderAll() {
    $('#rates-checked').textContent = t('rates_checked', { d: fmtDate(new Date(RATES_CHECKED + 'T00:00:00')) });
    renderCalc(); renderHist();
    billFields(); renderBillRows();
    renderPrice();
    renderGstin();
    if (lastBatch) runBatch();
  }
  EDU.onLang(renderAll);
  window.addEventListener('afterprint', function () { $('#print-area').innerHTML = ''; });
  showTab(tab);
  renderAll();
})();
