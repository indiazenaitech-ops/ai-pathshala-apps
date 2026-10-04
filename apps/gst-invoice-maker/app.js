/* GST Invoice & Quotation Maker: tax invoices, bills of supply, quotations, proforma invoices,
   delivery challans and payment receipts for Indian businesses. All money is computed in whole
   paise (integers), tax follows the place of supply (same state -> CGST + SGST, else IGST),
   and everything (profile, customers, items, documents) is stored only on this device. */
(function () {
  'use strict';
  var SLUG = 'gst-invoice-maker';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc;

  /* ================================================================ reference data */
  var TYPES = ['inv', 'bos', 'qtn', 'pi', 'dc', 'rcpt'];
  var PREFIX = { inv: 'INV', bos: 'BOS', qtn: 'QTN', pi: 'PI', dc: 'DC', rcpt: 'RCPT' };
  /* GST state codes (25 Daman & Diu and 28 old Andhra Pradesh are no longer issued) */
  var STATES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
    '20', '21', '22', '23', '24', '26', '27', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '97'];
  var EXPORT_POS = '96';
  /* GST unit quantity codes (UQC) */
  var UQC = [['BAG', 'Bags'], ['BAL', 'Bale'], ['BDL', 'Bundles'], ['BKL', 'Buckles'], ['BOU', 'Billion of units'], ['BOX', 'Box'],
    ['BTL', 'Bottles'], ['BUN', 'Bunches'], ['CAN', 'Cans'], ['CBM', 'Cubic metres'], ['CCM', 'Cubic centimetres'], ['CMS', 'Centimetres'],
    ['CTN', 'Cartons'], ['DOZ', 'Dozens'], ['DRM', 'Drums'], ['GGK', 'Great gross'], ['GMS', 'Grammes'], ['GRS', 'Gross'], ['GYD', 'Gross yards'],
    ['KGS', 'Kilograms'], ['KLR', 'Kilolitre'], ['KME', 'Kilometre'], ['LTR', 'Litres'], ['MLT', 'Millilitre'], ['MTR', 'Metres'],
    ['MTS', 'Metric ton'], ['NOS', 'Numbers'], ['OTH', 'Others'], ['PAC', 'Packs'], ['PCS', 'Pieces'], ['PRS', 'Pairs'], ['QTL', 'Quintal'],
    ['ROL', 'Rolls'], ['SET', 'Sets'], ['SQF', 'Square feet'], ['SQM', 'Square metres'], ['SQY', 'Square yards'], ['TBS', 'Tablets'],
    ['TGM', 'Ten gross'], ['THD', 'Thousands'], ['TON', 'Tonnes'], ['TUB', 'Tubes'], ['UGS', 'US gallons'], ['UNT', 'Units'], ['YDS', 'Yards']];
  var UQC_SET = {};
  UQC.forEach(function (u) { UQC_SET[u[0]] = 1; });
  var RATES = ['0', '0.25', '3', '5', '18', '40'];               // GST 2.0 slabs from 22 Sep 2025
  var USUAL_BP = [0, 10, 25, 150, 300, 500, 1800, 2800, 4000];   // + 0.1 (merchant export), 1.5 (diamonds), 28 (tobacco, until cess ends)
  var GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  var B36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var MAX_LINES = 500;
  /* one line may be worth at most ₹1,000 crore: keeps every total (500 lines, tax + cess) exact in whole paise */
  var MAX_LINE_PAISE = 1e12;

  /* ================================================================ small helpers */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function str(v, max) { return String(v == null ? '' : v).replace(/\r\n?/g, '\n').slice(0, max || 300); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function arr(v) { return Array.isArray(v) ? v.filter(function (x) { return x && typeof x === 'object'; }) : []; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || ''); }
  function dmy(s) { return isDate(s) ? s.slice(8, 10) + '-' + s.slice(5, 7) + '-' + s.slice(0, 4) : ''; }
  function addDays(s, n) { var d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  /* Financial year of a date: 1 April .. 31 March */
  function fyOf(s) {
    var y, m;
    if (isDate(s)) { y = +s.slice(0, 4); m = +s.slice(5, 7); } else { var d = new Date(); y = d.getFullYear(); m = d.getMonth() + 1; }
    var st = m >= 4 ? y : y - 1;
    return { start: st, short: pad2(st % 100) + '-' + pad2((st + 1) % 100), long: st + '-' + pad2((st + 1) % 100) };
  }

  /* Digits typed on Indian-language keyboards (०-९, ০-৯, ੦-੯, ૦-૯, ୦-୯, ௦-௯, ౦-౯, ೦-೯, ൦-൯, ٠-٩, ۰-۹) -> 0-9 */
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
  function rs(p) { return '₹' + money(p); }
  function plain(p) { return Math.floor(p / 100) + '.' + pad2(p % 100); }        // 118000.00 for CSV / UPI
  function qtyStr(q) {                                                               // thousandths -> "2.5"
    var neg = q < 0; if (neg) q = -q;
    var s = Math.floor(q / 1000) + (q % 1000 ? '.' + String(1000 + q % 1000).slice(1).replace(/0+$/, '') : '');
    return (neg ? '-' : '') + s;
  }
  function bpStr(bp) { return qtyStr(bp * 10); }                                     // 1800 -> "18", 25 -> "0.25"
  function pct(s) { return String(s == null ? '' : s).trim().replace(/\s*%$/, ''); } // "18%" -> "18" (rates are often typed with %)
  /* spreadsheet apps run cells that start with = + - @ as formulas: keep text cells as text */
  function cellText(v) { v = String(v == null ? '' : v); return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; }

  /* ================================================================ GSTIN */
  function gstCheckChar(s14) {
    var sum = 0;
    for (var i = 0; i < 14; i++) {
      var p = B36.indexOf(s14.charAt(i)) * (i % 2 ? 2 : 1);
      sum += Math.floor(p / 36) + p % 36;
    }
    return B36.charAt((36 - sum % 36) % 36);
  }
  function checkGstin(g) {
    g = String(g || '').toUpperCase().replace(/\s+/g, '');
    if (!g) return { state: 'empty', g: g };
    if (!GSTIN_RE.test(g)) return { state: 'format', g: g };
    var code = g.slice(0, 2);
    if (STATES.indexOf(code) < 0) return { state: 'statecode', code: code, g: g };
    var c = gstCheckChar(g.slice(0, 14));
    if (c !== g.charAt(14)) return { state: 'check', expect: c, code: code, g: g };
    return { state: 'ok', code: code, pan: g.slice(2, 12), g: g };
  }
  function gstinMsg(r) {
    if (r.state === 'empty') return { cls: '', text: '' };
    if (r.state === 'format') return { cls: 'bad', text: t('gst_bad_format') };
    if (r.state === 'statecode') return { cls: 'bad', text: t('gst_bad_state', { code: r.code }) };
    if (r.state === 'check') return { cls: 'bad', text: t('gst_bad_check', { c: r.expect }) };
    return { cls: 'ok', text: '✓ ' + t('gst_ok', { state: stateName(r.code), pan: r.pan }) + ' ' + t('gst_portal') };
  }
  function stateName(code) { return code ? t('st_' + code) : ''; }

  /* ================================================================ stored state */
  function defaultSettings() {
    return { tab: 'make', docLang: 'both', prefixes: {}, round: true, upi: true, bank: true, incl: false, cess: false,
      remember: true, copies: [true, false, false], gst: '18' };
  }
  var BLANK_PROFILE = { name: '', address: '', gstin: '', state: '', pan: '', phone: '', email: '', composition: false, lut: '',
    bankName: '', accName: '', accNo: '', ifsc: '', upi: '', logo: '', sign: '', terms: '' };
  /* stored data and backup files are normalised the same way, so a hand-edited backup cannot break the page */
  function normSettings(raw) {
    var s = Object.assign(defaultSettings(), raw && typeof raw === 'object' ? raw : {});
    if (!s.prefixes || typeof s.prefixes !== 'object' || Array.isArray(s.prefixes)) s.prefixes = {};
    Object.keys(s.prefixes).forEach(function (k) { if (TYPES.indexOf(k) < 0 || typeof s.prefixes[k] !== 'string') delete s.prefixes[k]; });
    if (!Array.isArray(s.copies) || s.copies.length !== 3) s.copies = [true, false, false];
    s.copies = s.copies.map(Boolean);
    if (['en', 'ui', 'both'].indexOf(s.docLang) < 0) s.docLang = 'both';
    if (typeof s.gst !== 'string') s.gst = '18';
    return s;
  }
  function normProfile(raw) {
    var p = Object.assign({}, BLANK_PROFILE, raw && typeof raw === 'object' ? raw : {});
    Object.keys(BLANK_PROFILE).forEach(function (k) { if (typeof p[k] !== typeof BLANK_PROFILE[k]) p[k] = BLANK_PROFILE[k]; });
    ['logo', 'sign'].forEach(function (k) { if (p[k] && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(p[k])) p[k] = ''; });   // only images made on this device
    return p;
  }
  function normRec(keys) {
    return function (r) { var o = { id: typeof r.id === 'string' && r.id ? r.id : uid() }; keys.forEach(function (k) { o[k] = r[k] == null ? '' : str(r[k], 300); }); return o; };
  }
  var normCust = normRec(['name', 'gstin', 'state', 'address', 'phone', 'email']), normItem = normRec(['name', 'hsn', 'unit', 'rate', 'gst', 'cess']);
  var settings = normSettings(store.get('settings', {}));
  var profile = normProfile(store.get('profile', {}));
  var customers = arr(store.get('customers', [])).map(normCust);
  var items = arr(store.get('items', [])).map(normItem);
  var docs = arr(store.get('docs', [])).map(normDoc).filter(Boolean);
  var draft = normDoc(store.get('draft', null));
  var dirty = !!store.get('dirty', false);

  function saveSettings() { store.set('settings', settings); }
  function warnFull(ok) { if (ok === false) EDU.toast(t('store_full'), 5000); return ok !== false; }

  /* The seller printed on documents: the user's own profile, or a clearly marked sample until they add one. */
  function profileEmpty() { return !String(profile.name).trim() && !String(profile.gstin).trim(); }
  function sampleSeller() {
    return Object.assign({}, BLANK_PROFILE, {
      name: t('sample_seller'), address: t('sample_seller_addr'), gstin: '27AAPFS1234K1ZW', state: '27', pan: 'AAPFS1234K',
      phone: '+91 98220 12345', email: '', bankName: t('sample_bank'), accName: t('sample_seller'), accNo: '30123456789',
      ifsc: 'SBIN0001234', upi: 'sharma.traders@example', terms: t('sample_terms'), sample: true
    });
  }
  function seller() { return profileEmpty() ? sampleSeller() : profile; }
  function sellerState() { var s = seller(); return s.state || (checkGstin(s.gstin).state === 'ok' ? s.gstin.slice(0, 2) : ''); }

  /* ================================================================ documents */
  function newLine(src) {
    src = src || {};
    return { id: uid(), desc: str(src.desc, 300), hsn: str(src.hsn, 12), qty: src.qty === undefined ? '1' : str(src.qty, 20),
      unit: src.unit === undefined ? 'NOS' : str(src.unit, 8), rate: str(src.rate, 20), disc: str(src.disc, 20),
      gst: src.gst === undefined ? String(settings.gst || '18') : str(src.gst, 10), cess: str(src.cess, 10) };
  }
  function normParty(p, keys) { p = p && typeof p === 'object' ? p : {}; var o = {}; keys.forEach(function (k) { o[k] = str(p[k], k === 'address' ? 300 : 120); }); return o; }
  function normDoc(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var d = {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      type: TYPES.indexOf(raw.type) >= 0 ? raw.type : 'inv',
      no: str(raw.no, 40), autoNo: !!raw.autoNo, date: isDate(raw.date) ? raw.date : today(), due: isDate(raw.due) ? raw.due : '',
      ref: str(raw.ref, 60), pos: str(raw.pos, 2), posManual: !!raw.posManual,
      supply: ['normal', 'lut', 'igst'].indexOf(raw.supply) >= 0 ? raw.supply : 'normal', rcm: !!raw.rcm,
      cust: normParty(raw.cust, ['name', 'gstin', 'state', 'address', 'phone', 'email']),
      ship: normParty(raw.ship, ['name', 'state', 'address']),
      lines: arr(raw.lines).slice(0, MAX_LINES).map(function (l) { var n = newLine(l); if (typeof l.id === 'string' && l.id) n.id = l.id; return n; }),
      incl: !!raw.incl, round: raw.round !== false, upi: raw.upi !== false, bank: raw.bank !== false,
      notes: str(raw.notes, 600), terms: str(raw.terms, 1200),
      tr: normParty(raw.tr, ['vehicle', 'transporter', 'ewb']),
      rc: normParty(raw.rc, ['amount', 'mode', 'ref', 'against']),
      paid: !!raw.paid, saved: typeof raw.saved === 'number' ? raw.saved : 0
    };
    d.ship.on = !!(raw.ship && raw.ship.on);
    if (['upi', 'cash', 'bank', 'cheque', 'card'].indexOf(d.rc.mode) < 0) d.rc.mode = 'upi';
    if (raw.sample) d.sample = raw.sample;
    if (raw.sum && typeof raw.sum === 'object') d.sum = raw.sum;
    if (!d.lines.length) d.lines.push(newLine());
    return d;
  }
  function prefixOf(type) { return (String(settings.prefixes[type] || '').trim() || PREFIX[type]).replace(/[^A-Za-z0-9-]/g, '').slice(0, 8) || PREFIX[type]; }
  function seriesBase(type, date) { return prefixOf(type) + '/' + fyOf(date).short + '/'; }
  /* highest number already saved in this series (same type, same FY), as a number */
  function lastInSeries(type, date, exceptId) {
    var base = seriesBase(type, date).toUpperCase(), max = 0;
    docs.forEach(function (d) {
      if (d.type !== type || d.id === exceptId) return;
      var no = d.no.toUpperCase();
      if (no.indexOf(base) === 0 && /^\d+$/.test(no.slice(base.length))) max = Math.max(max, +no.slice(base.length));
    });
    return max;
  }
  function nextNo(type, date, exceptId) {
    var n = lastInSeries(type, date, exceptId) + 1;
    return seriesBase(type, date) + (n < 10000 ? String(10000 + n).slice(1) : n);
  }
  function blankDoc(type) {
    var d = normDoc({ type: type || 'inv', date: today(), autoNo: true });
    d.pos = sellerState();
    d.terms = String(seller().terms || '');
    d.incl = !!settings.incl; d.round = settings.round !== false; d.upi = settings.upi !== false; d.bank = settings.bank !== false;
    d.no = nextNo(d.type, d.date, d.id);
    return d;
  }
  /* Sample invoice in the page language (a Pune shop billing a Bengaluru customer: IGST) */
  function sampleDoc(lang, keep) {
    var d = blankDoc('inv');
    if (keep) { d.id = keep.id; d.no = keep.no; d.date = keep.date; d.autoNo = keep.autoNo; }
    d.cust = { name: t('sample_cust'), gstin: '29AAKCK5678L1ZL', state: '29', address: t('sample_cust_addr'), phone: '', email: '' };
    d.pos = '29';
    d.due = addDays(d.date, 15);
    d.lines = [
      newLine({ desc: t('sample_i1'), hsn: '9405', qty: '10', unit: 'NOS', rate: '350', gst: '18' }),
      newLine({ desc: t('sample_i2'), hsn: '8544', qty: '4', unit: 'ROL', rate: '1450', disc: '5%', gst: '18' }),
      newLine({ desc: t('sample_i3'), hsn: '8541', qty: '2', unit: 'NOS', rate: '14500', gst: '5' }),
      newLine({ desc: t('sample_i4'), hsn: '995461', qty: '1', unit: 'OTH', rate: '1500', gst: '18' })
    ];
    d.notes = t('notes_ph');
    d.sample = lang;
    return d;
  }
  if (!draft) { draft = sampleDoc(EDU.lang); dirty = false; }
  else if (draft.sample && draft.sample !== EDU.lang) draft = sampleDoc(EDU.lang, draft);

  /* ================================================================ calculation (all in paise) */
  function taxMode(doc) {
    if (doc.type === 'rcpt' || doc.type === 'bos' || seller().composition) return 'none';
    if (doc.supply === 'lut') return 'lut';
    if (doc.supply === 'igst') return 'inter';
    var ss = sellerState(), pos = doc.pos || ss;
    return !ss || pos === ss ? 'intra' : 'inter';
  }
  function isServiceHsn(h) { return /^99\d{4}$/.test(String(h || '').replace(/\s/g, '')); }
  /* A price that already includes GST is split into taxable value + tax that add back to exactly that price
     (a ₹100 item must not be billed ₹100.01). Values next to price x 100 / (100 + rate) are tried and the one
     whose tax is closest to rate x taxable value wins; within a state CGST = SGST, so the tax must be an even
     number of paise. The tax is then within about a paisa of the rate. */
  function splitInclusive(value, gb, cb, mode) {
    var t0 = mulDiv(value, 10000, 10000 + gb + cb), best = null;
    for (var d = 0; d <= 4; d++) {
      for (var sg = -1; sg <= 1; sg += 2) {
        var tx = t0 + d * sg;
        if (tx < 0 || (d === 0 && sg > 0)) continue;
        var ce = mulDiv(tx, cb, 10000), tax = value - tx - ce;
        if (tax < 0 || (mode === 'intra' && tax % 2)) continue;
        var err = Math.abs(tax * 10000 - tx * gb);
        if (!best || err < best.err) best = { taxable: tx, tax: tax, cess: ce, err: err };
      }
    }
    return best;
  }
  function calc(doc) {
    var mode = taxMode(doc), taxed = mode === 'intra' || mode === 'inter';
    var R = { mode: mode, taxed: taxed, rcm: !!doc.rcm && taxed && (doc.type === 'inv' || doc.type === 'pi'), lines: [], taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0,
      errors: [], warns: [], hasDisc: false, hasCess: false, count: 0, services: true };
    var needHsn = doc.type === 'inv' || doc.type === 'bos';
    doc.lines.forEach(function (ln, i) {
      var n = i + 1, o = { ln: ln, n: n, ok: false, errs: [], bad: {} };
      R.lines.push(o);
      if (!String(ln.desc).trim() && !String(ln.rate).trim() && !String(ln.hsn).trim()) { o.empty = true; return; }
      var q = parseScaled(ln.qty, 1000), r = parseScaled(ln.rate, 100), gb = parseScaled(pct(ln.gst), 100), cb = parseScaled(pct(ln.cess), 100);
      if (r === null) r = 0;
      if (gb === null) gb = 0;
      if (cb === null) cb = 0;
      if (q !== q && q !== null) { o.errs.push(t('err_num', { n: n, v: ln.qty })); o.bad.qty = 1; }
      else if (q === null || q <= 0) { o.errs.push(t('err_qty', { n: n })); o.bad.qty = 1; }
      if (r !== r || r < 0) { o.errs.push(t('err_num', { n: n, v: ln.rate })); o.bad.rate = 1; }
      if (gb !== gb || gb < 0 || gb > 10000) { o.errs.push(t('err_gst', { n: n })); o.bad.gst = 1; }
      if (cb !== cb || cb < 0 || cb > 50000) { o.errs.push(t('err_num', { n: n, v: ln.cess })); o.bad.cess = 1; }
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
      var value = gross - disc, taxable = value;
      var cg = 0, sg = 0, ig = 0, ce = 0;
      var inc = doc.incl && taxed && !R.rcm ? splitInclusive(value, gb, cb, mode) : null;   // back-calculate from a GST-inclusive price
      if (inc) {
        taxable = inc.taxable; ce = inc.cess;
        if (mode === 'intra') { cg = inc.tax / 2; sg = cg; } else ig = inc.tax;
      } else if (taxed) {
        if (doc.incl && !R.rcm) taxable = mulDiv(value, 10000, 10000 + gb + cb);
        if (mode === 'intra') { cg = mulDiv(taxable, gb, 20000); sg = cg; } else ig = mulDiv(taxable, gb, 10000);
        ce = mulDiv(taxable, cb, 10000);
      }
      o.ok = true; o.q = q; o.r = r; o.gb = gb; o.cb = cb; o.gross = gross; o.disc = disc; o.discPct = /%$/.test(ds) ? ds : '';
      o.taxable = taxable; o.cgst = cg; o.sgst = sg; o.igst = ig; o.cess = ce; o.tax = cg + sg + ig + ce; o.total = taxable + o.tax;
      if (disc) R.hasDisc = true;
      if (cb) R.hasCess = true;
      R.taxable += taxable; R.cgst += cg; R.sgst += sg; R.igst += ig; R.cess += ce; R.count++;
      if (!isServiceHsn(ln.hsn)) R.services = false;
      /* gentle warnings */
      var h = String(ln.hsn || '').replace(/\s/g, '');
      if (!h && needHsn) R.warns.push(t('warn_no_hsn', { n: n }));
      else if (h && !/^(\d{4}|\d{6}|\d{8})$/.test(h)) R.warns.push(t('warn_hsn', { n: n }));
      var u = String(ln.unit || '').trim().toUpperCase();
      if (u && !UQC_SET[u]) R.warns.push(t('warn_unit', { n: n, u: ln.unit }));
      if (mode !== 'none' && USUAL_BP.indexOf(gb) < 0) R.warns.push(t('warn_rate', { n: n, r: bpStr(gb) }));
    });
    if (!R.count) R.services = false;
    R.tax = R.cgst + R.sgst + R.igst + R.cess;
    if (doc.type === 'rcpt') {
      var a = parseScaled(doc.rc.amount, 100);
      R.rcAmount = a !== null && a === a && a > 0 ? a : 0;
      R.exact = R.total = R.rcAmount; R.roundOff = 0;
      return R;
    }
    R.exact = R.taxable + (R.rcm ? 0 : R.tax);
    R.total = doc.round ? Math.round(R.exact / 100) * 100 : R.exact;
    R.roundOff = R.total - R.exact;
    /* tax summary by HSN/SAC and rate */
    var groups = {}, list = [];
    R.lines.forEach(function (o) {
      if (!o.ok) return;
      var h = String(o.ln.hsn || '').trim() || '-', k = h + '|' + o.gb + '|' + o.cb;
      if (!groups[k]) { groups[k] = { hsn: h, gb: o.gb, cb: o.cb, taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 }; list.push(groups[k]); }
      var g = groups[k];
      g.taxable += o.taxable; g.cgst += o.cgst; g.sgst += o.sgst; g.igst += o.igst; g.cess += o.cess;
    });
    list.sort(function (a, b) { return a.hsn < b.hsn ? -1 : a.hsn > b.hsn ? 1 : a.gb - b.gb; });
    R.hsn = list;
    return R;
  }

  /* Document-level checks: [{lv:'err'|'warn', text}] (errors in numbers block saving, the rest are reminders) */
  function docChecks(doc, R) {
    var out = [], S = seller();
    function add(lv, text, k) { out.push({ lv: lv, text: text, k: k || '' }); }
    var no = String(doc.no || '').trim();
    if (!isDate(doc.date)) add('err', t('no_date'), 'no_date');
    if (!no) add('err', t('no_empty'), 'no_empty');
    else {
      var dup = docs.some(function (d) { return d.id !== doc.id && d.type === doc.type && d.no.trim().toUpperCase() === no.toUpperCase(); });
      if (dup) add('err', t('dup_number', { no: no }), 'dup_number');
      if (no.length > 16) add('warn', t('no_long', { n: no.length }), 'no_long');
      if (/[^A-Za-z0-9\/-]/.test(no)) add('warn', t('no_chars'), 'no_chars');
      var fy = fyOf(doc.date), m = no.match(/\/(\d{2})-(\d{2})\//);
      if (m && m[1] + '-' + m[2] !== fy.short) add('warn', t('no_fy', { fy: fy.long }), 'no_fy');
      var base = seriesBase(doc.type, doc.date);
      if (no.toUpperCase().indexOf(base.toUpperCase()) === 0 && /^\d+$/.test(no.slice(base.length))) {
        var last = lastInSeries(doc.type, doc.date, doc.id), mine = +no.slice(base.length);
        if (last && mine > last + 1) add('warn', t('no_gap', { last: base + String(10000 + last).slice(1) }), 'no_gap');
      }
    }
    R.errors.forEach(function (e) { add('err', e); });
    if (doc.type !== 'rcpt' && !R.count && !R.errors.length) add('err', t('warn_no_lines'));
    if (doc.type === 'rcpt' && !R.rcAmount) add('err', t('err_rc_amount'));
    if (!String(doc.cust.name).trim()) add('warn', t('warn_cust'));
    var cg = checkGstin(doc.cust.gstin);
    if (cg.state !== 'empty' && cg.state !== 'ok') add('warn', t('warn_cust_gstin'));
    if (doc.type === 'inv' && cg.state === 'empty' && R.taxable >= 5000000 && (!String(doc.cust.address).trim() || !doc.cust.state)) add('warn', t('warn_b2c_big'));
    if ((doc.type === 'inv' || doc.type === 'bos') && checkGstin(S.gstin).state !== 'ok') add('warn', t('warn_seller_gstin'));
    if (doc.type === 'inv' && S.composition) add('warn', t('warn_compo'));
    if (doc.type !== 'rcpt' && !doc.pos && R.mode !== 'none') add('warn', t('warn_pos'));
    R.warns.forEach(function (w) { add('warn', w); });
    return out;
  }

  /* ================================================================ document language */
  function tEn(key, vars) {
    var S = window.APP_STRINGS || {}, C = EDU.COMMON || {};
    var v = S.en && S.en[key] !== undefined ? S.en[key] : (C.en && C.en[key] !== undefined ? C.en[key] : key);
    if (vars) v = String(v).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return v;
  }
  function docMode() { return EDU.lang === 'en' ? 'en' : settings.docLang; }
  /* label in the chosen document language(s); block=true puts the local word on its own line (table heads) */
  function D(key, vars, block) {
    var m = docMode(), en = tEn(key, vars), lo = t(key, vars);
    if (m === 'en' || en === lo) return esc(en);
    if (m === 'ui') return '<bdi>' + esc(lo) + '</bdi>';
    return esc(en) + (block ? '<span class="lc"><bdi>' + esc(lo) + '</bdi></span>' : ' <span class="lc-i">/ <bdi>' + esc(lo) + '</bdi></span>');
  }
  function wordsFor(paise, lang) {
    var r = Math.floor(paise / 100), p = paise % 100, key = p ? 'words_rs_paise' : 'words_rs';
    var tpl = lang === 'en' ? tEn(key) : t(key);
    return tpl.replace('{w}', GST_WORDS.say(r, lang)).replace('{p}', GST_WORDS.say(p, lang));
  }
  function copyLabels(doc, R) {
    if (doc.type === 'dc') return ['copy_orig_cons', 'copy_dup_tr', 'copy_trip_cons'];
    if (doc.type === 'inv' || doc.type === 'bos') return R && R.services ? ['copy_orig', 'copy_dup_sup'] : ['copy_orig', 'copy_dup_tr', 'copy_trip'];
    return [];
  }

  /* ================================================================ the printable sheet */
  function qrSvg(text, px) {
    if (!window.QRGen) return '';
    var q;
    try { q = QRGen.encode(text, 'M'); } catch (e) { return ''; }
    if (!q || !q.ok) return '';
    var n = q.size, m = 3, d = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (q.modules[y][x]) d += 'M' + (x + m) + ' ' + (y + m) + 'h1v1h-1z';
    var s = n + 2 * m;
    return '<svg class="sh-qr" id="upiQr" viewBox="0 0 ' + s + ' ' + s + '" width="' + px + '" height="' + px + '" shape-rendering="crispEdges" role="img" aria-label="UPI QR"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  function upiUri(S, paise, note) {
    return 'upi://pay?pa=' + encodeURIComponent(String(S.upi).trim()).replace(/%40/g, '@') + '&pn=' + encodeURIComponent(String(S.name).trim().slice(0, 40)) +
      '&am=' + plain(paise) + '&cu=INR&tn=' + encodeURIComponent(String(note).slice(0, 50));
  }
  function validUpi(v) { return /^[A-Za-z0-9.\-_]{2,256}@[A-Za-z][A-Za-z0-9.\-]{1,64}$/.test(String(v || '').trim()); }
  function txt(s) { return esc(s); }
  function partyStateLine(code) { return code ? D('state') + ': <b>' + D('st_' + code) + '</b> &nbsp; ' + D('state_code') + ': <b>' + esc(code) + '</b>' : ''; }

  /* The document is built in parts (full header, compact header, item rows, total row, bottom block) and then
     laid out on real A4 pages: rows are measured at print width, so every page gets the column headings, later
     pages a compact header, and the preview shows exactly what prints. */
  var PAGE_H = 1047, PAGE_SAFE = 18;          // A4 (297 mm) minus 2 x 10 mm margins, in CSS px
  function docParts(doc, R, copyKey) {
    var S = seller(), type = doc.type, h = [], P = {};
    var showGst = R.mode !== 'none', cust = doc.cust, cg = checkGstin(cust.gstin);
    var copyHtml = copyKey ? '<div class="sh-copy">' + D(copyKey) + '</div>' : '';
    P.wm = S.sample ? '<div class="sh-wm" aria-hidden="true"><span>' + esc(tEn('sample_mark')) + '</span></div>' : '';
    /* title band */
    h.push('<div class="sh-top"><div class="sh-title">' + D('dt_' + type) + '</div>' + copyHtml + '</div>');
    /* seller + meta */
    h.push('<div class="sh-head"><div class="sh-seller">');
    if (S.logo) h.push('<img class="sh-logo" src="' + esc(S.logo) + '" alt="">');
    h.push('<div><div class="sh-name">' + (String(S.name).trim() ? txt(S.name) : '<span style="color:#999">' + D('d_your_biz') + '</span>') + '</div>');
    if (String(S.address).trim()) h.push('<div class="sh-addr">' + txt(S.address) + '</div>');
    var sg = checkGstin(S.gstin), sst = sellerState();
    if (S.gstin) h.push('<div class="sh-kv">' + D('gstin') + ': <b>' + esc(S.gstin.toUpperCase()) + '</b></div>');
    var pan = S.pan || (sg.state === 'ok' ? sg.pan : '');
    if (pan) h.push('<div class="sh-kv">' + D('pan') + ': <b>' + esc(pan.toUpperCase()) + '</b></div>');
    if (sst) h.push('<div class="sh-kv">' + partyStateLine(sst) + '</div>');
    var contact = [S.phone, S.email].filter(function (x) { return String(x || '').trim(); }).map(esc).join(' &middot; ');
    if (contact) h.push('<div class="sh-kv">' + contact + '</div>');
    h.push('</div></div>');
    var meta = [[D('d_no'), '<span id="shNo">' + esc(doc.no) + '</span>'], [D('doc_date'), esc(dmy(doc.date))]];
    if (doc.due && type !== 'rcpt' && type !== 'dc') meta.push([D(type === 'qtn' ? 'valid_till' : 'due_date'), esc(dmy(doc.due))]);
    if (String(doc.ref).trim() && type !== 'rcpt') meta.push([D('ref_no'), txt(doc.ref)]);
    if (type !== 'rcpt') {
      var pos = doc.supply !== 'normal' && !doc.pos ? EXPORT_POS : doc.pos;
      if (pos) meta.push([D('pos'), esc(pos) + '-' + D('st_' + pos)]);
    }
    if (type === 'inv' || type === 'pi') meta.push([D('rcm_short'), D(doc.rcm && R.taxed ? 'yes' : 'no')]);
    if (type !== 'rcpt' && type !== 'qtn') {
      if (String(doc.tr.vehicle).trim()) meta.push([D('vehicle'), esc(doc.tr.vehicle.toUpperCase())]);
      if (String(doc.tr.transporter).trim()) meta.push([D('transporter'), txt(doc.tr.transporter)]);
      if (String(doc.tr.ewb).trim()) meta.push([D('ewb'), esc(doc.tr.ewb)]);
    }
    h.push('<table class="sh-meta"><tbody>' + meta.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table></div>');
    /* parties */
    var ship = doc.ship.on && (String(doc.ship.name).trim() || String(doc.ship.address).trim());
    h.push('<div class="sh-parties' + (ship ? '' : ' one') + '"><div class="sh-box"><div class="sh-lab">' + D(type === 'rcpt' ? 'd_received_from' : 'bill_to') + '</div>');
    h.push('<div class="sh-pname">' + (String(cust.name).trim() ? txt(cust.name) : '&nbsp;') + '</div>');
    if (String(cust.address).trim()) h.push('<div class="sh-addr">' + txt(cust.address) + '</div>');
    h.push('<div class="sh-kv">' + D('gstin') + ': <b>' + (cg.state === 'empty' ? D('d_unreg') : esc(cg.g)) + '</b></div>');
    var cst = cust.state || (cg.state === 'ok' ? cg.code : '');
    if (cst) h.push('<div class="sh-kv">' + partyStateLine(cst) + '</div>');
    var cc = [cust.phone, cust.email].filter(function (x) { return String(x || '').trim(); }).map(esc).join(' &middot; ');
    if (cc) h.push('<div class="sh-kv">' + cc + '</div>');
    h.push('</div>');
    if (ship) {
      h.push('<div class="sh-box"><div class="sh-lab">' + D('ship_to') + '</div><div class="sh-pname">' + txt(doc.ship.name || cust.name) + '</div>');
      if (String(doc.ship.address).trim()) h.push('<div class="sh-addr">' + txt(doc.ship.address) + '</div>');
      if (doc.ship.state) h.push('<div class="sh-kv">' + partyStateLine(doc.ship.state) + '</div>');
      h.push('</div>');
    }
    h.push('</div>');
    P.full = h.join('');
    /* compact header for the following pages */
    P.mini = '<div class="sh-mini"><div class="sh-mini-l"><div class="sh-mini-n">' + txt(S.name || '') + '</div><div>' + D('dt_' + type) + ' &middot; ' + D('d_no') + ' <b>' + esc(doc.no) + '</b> &middot; ' +
      esc(dmy(doc.date)) + (String(cust.name).trim() ? ' &middot; ' + D('bill_to') + ': <b>' + txt(cust.name) + '</b>' : '') + '</div></div>' + copyHtml + '</div>';
    P.computer = D('d_computer');
    P.cont = D('d_continued');
    P.pageOf = function (n, N) { return D('d_page', { n: n, total: N }); };
    if (type === 'rcpt') { P.body = renderReceipt(doc, R, S); return P; }

    /* item table */
    var cols = [['#', 'ctr'], [D('col_desc', null, true), ''], [D('col_hsn', null, true), 'ctr'], [D('col_qty', null, true), 'r'], [D('col_unit', null, true), 'ctr'], [D('col_rate', null, true), 'r']];
    if (R.hasDisc) cols.push([D('col_disc', null, true), 'r']);
    cols.push([D(showGst ? 'taxable' : 'col_amount', null, true), 'r']);
    if (showGst) { cols.push([D('col_gst', null, true), 'r']); cols.push([D('d_tax_amt', null, true), 'r']); }
    if (showGst && R.hasCess) cols.push([D('cess', null, true), 'r']);
    if (showGst) cols.push([D('col_amount', null, true), 'r']);
    P.cols = '<tr>' + cols.map(function (c) { return '<th class="' + c[1] + '">' + c[0] + '</th>'; }).join('') + '</tr>';
    P.rows = [];
    var sr = 0, totQ = {};
    R.lines.forEach(function (o) {
      if (!o.ok) return;
      sr++;
      var ln = o.ln, unit = String(ln.unit || '').toUpperCase(), r = [];
      totQ[unit] = (totQ[unit] || 0) + o.q;
      r.push('<tr data-line="' + sr + '"><td class="ctr">' + sr + '</td><td class="d">' + txt(ln.desc) + '</td><td class="ctr">' + esc(ln.hsn) + '</td>' +
        '<td class="r">' + qtyStr(o.q) + '</td><td class="ctr">' + esc(unit) + '</td><td class="r">' + money(o.r) + '</td>');
      if (R.hasDisc) r.push('<td class="r">' + (o.disc ? money(o.disc) + (o.discPct ? '<span class="sub">' + esc(o.discPct) + '</span>' : '') : '') + '</td>');
      r.push('<td class="r">' + money(o.taxable) + '</td>');
      if (showGst) r.push('<td class="r">' + bpStr(o.gb) + '%</td><td class="r">' + money(o.cgst + o.sgst + o.igst) + '</td>');
      if (showGst && R.hasCess) r.push('<td class="r">' + (o.cess ? money(o.cess) + '<span class="sub">' + bpStr(o.cb) + '%</span>' : '') + '</td>');
      if (showGst) r.push('<td class="r">' + money(o.total) + '</td>');
      P.rows.push(r.join('') + '</tr>');
    });
    if (!sr) P.rows.push('<tr><td colspan="' + cols.length + '" class="ctr" style="padding:18px;color:#999">' + D('warn_no_lines') + '</td></tr>');
    var units = Object.keys(totQ), tr = [];
    tr.push('<tr class="tot"><td></td><td>' + D('d_total') + '</td><td></td><td class="r">' + (units.length === 1 ? qtyStr(totQ[units[0]]) : '') + '</td><td class="ctr">' + (units.length === 1 ? esc(units[0]) : '') + '</td><td></td>');
    if (R.hasDisc) tr.push('<td></td>');
    tr.push('<td class="r">' + money(R.taxable) + '</td>');
    if (showGst) tr.push('<td></td><td class="r">' + money(R.cgst + R.sgst + R.igst) + '</td>');
    if (showGst && R.hasCess) tr.push('<td class="r">' + money(R.cess) + '</td>');
    if (showGst) tr.push('<td class="r">' + money(R.taxable + R.tax) + '</td>');
    P.total = tr.join('') + '</tr>';

    /* bottom: words, tax summary, payment | totals, signature; declarations */
    h = [];
    h.push('<div class="sh-bottom"><div class="sh-left">');
    h.push('<div class="sh-sec"><div class="sh-sec-t">' + D('amount_words') + '</div><div class="sh-words" id="shWords">' + esc(wordsFor(R.total, 'en')) +
      (docMode() !== 'en' ? '<span class="loc"><bdi>' + esc(wordsFor(R.total, EDU.lang)) + '</bdi></span>' : '') + '</div></div>');
    if (showGst && R.hsn.length) {
      var intra = R.mode === 'intra';
      h.push('<div class="sh-sec"><div class="sh-sec-t">' + D('d_hsn_summary') + '</div><table class="sh-hsn"><thead><tr><th rowspan="2">' + D('col_hsn') + '</th><th rowspan="2">' + D('taxable') + '</th>');
      h.push(intra ? '<th colspan="2">' + D('cgst') + '</th><th colspan="2">' + D('sgst') + '</th>' : '<th colspan="2">' + D('igst') + '</th>');
      if (R.hasCess) h.push('<th rowspan="2">' + D('cess') + '</th>');
      h.push('<th rowspan="2">' + D('d_total_tax') + '</th></tr><tr>');
      h.push(intra ? '<th>%</th><th>' + D('d_amt') + '</th><th>%</th><th>' + D('d_amt') + '</th>' : '<th>%</th><th>' + D('d_amt') + '</th>');
      h.push('</tr></thead><tbody>');
      R.hsn.forEach(function (g) {
        h.push('<tr><td>' + esc(g.hsn) + '</td><td>' + money(g.taxable) + '</td>');
        h.push(intra ? '<td>' + bpStr(g.gb / 2) + '</td><td>' + money(g.cgst) + '</td><td>' + bpStr(g.gb / 2) + '</td><td>' + money(g.sgst) + '</td>'
          : '<td>' + bpStr(g.gb) + '</td><td>' + money(g.igst) + '</td>');
        if (R.hasCess) h.push('<td>' + money(g.cess) + '</td>');
        h.push('<td>' + money(g.cgst + g.sgst + g.igst + g.cess) + '</td></tr>');
      });
      h.push('<tr class="t"><td>' + D('d_total') + '</td><td>' + money(R.taxable) + '</td>' + (intra ? '<td></td><td>' + money(R.cgst) + '</td><td></td><td>' + money(R.sgst) + '</td>' : '<td></td><td>' + money(R.igst) + '</td>') +
        (R.hasCess ? '<td>' + money(R.cess) + '</td>' : '') + '<td>' + money(R.tax) + '</td></tr></tbody></table></div>');
    }
    var payDoc = type === 'inv' || type === 'bos' || type === 'pi' || type === 'qtn';
    var bank = payDoc && doc.bank && String(S.accNo).trim();
    var upi = (type === 'inv' || type === 'bos' || type === 'pi') && doc.upi && validUpi(S.upi) && R.total > 0;
    /* payment block (bank + UPI QR) sits in the right column, under the totals */
    var pay = '';
    if (bank || upi) {
      pay = '<div class="sh-pay">';
      if (upi) {
        var uri = upiUri(S, R.total, doc.no);
        pay += '<div class="sh-qrbox" data-upi="' + esc(uri) + '">' + qrSvg(uri, 96) + '<div>' + D('d_upi_scan', { amt: rs(R.total) }) + '</div><div class="sh-upi">' + esc(S.upi) + '</div></div>';
      }
      if (bank) {
        pay += '<div class="sh-sec sh-bank"><div class="sh-sec-t">' + D('d_bank') + '</div>';
        if (S.accName) pay += '<div>' + txt(S.accName) + '</div>';
        if (S.bankName) pay += '<div>' + txt(S.bankName) + '</div>';
        pay += '<div>' + D('d_acc') + ': <b>' + esc(S.accNo) + '</b></div>';
        if (S.ifsc) pay += '<div>' + D('ifsc') + ': <b>' + esc(String(S.ifsc).toUpperCase()) + '</b></div>';
        pay += '</div>';
      }
      pay += '</div>';
    }
    var terms = String(doc.terms || '').trim();
    if (terms) h.push('<div class="sh-sec"><div class="sh-sec-t">' + D('terms') + '</div><div class="sh-terms">' + txt(terms) + '</div></div>');
    if (String(doc.notes || '').trim()) h.push('<div class="sh-sec"><div class="sh-sec-t">' + D('notes') + '</div><div class="sh-terms">' + txt(doc.notes) + '</div></div>');
    h.push('</div><div class="sh-right"><table class="sh-tot"><tbody>');
    h.push('<tr><td>' + D('taxable') + '</td><td>' + money(R.taxable) + '</td></tr>');
    if (R.mode === 'intra') h.push('<tr><td>' + D('cgst') + '</td><td>' + money(R.cgst) + '</td></tr><tr><td>' + D('sgst') + '</td><td>' + money(R.sgst) + '</td></tr>');
    else if (R.mode === 'inter' || R.mode === 'lut') h.push('<tr><td>' + D('igst') + '</td><td>' + money(R.igst) + '</td></tr>');
    if (R.cess) h.push('<tr><td>' + D('cess') + '</td><td>' + money(R.cess) + '</td></tr>');
    if (R.rcm) h.push('<tr class="note"><td colspan="2">' + D('rcm_pay', { amt: money(R.tax) }) + '</td></tr>');
    if (doc.round) h.push('<tr><td>' + D('round_off') + '</td><td>' + (R.roundOff > 0 ? '+' : '') + money(R.roundOff) + '</td></tr>');
    h.push('<tr class="grand"><td>' + D('grand_total') + '</td><td id="shTotal">' + rs(R.total) + '</td></tr></tbody></table>');
    h.push(pay);
    h.push(signBlock(S));
    h.push('</div></div>');
    var decl = [];
    if (R.mode === 'lut') decl.push(D('d_lut') + (String(S.lut || '').trim() ? ' (LUT ARN: ' + esc(S.lut.toUpperCase()) + ')' : ''));
    if (doc.supply === 'igst' && R.taxed) decl.push(D('d_exp_igst'));
    if (S.composition && type !== 'qtn' && type !== 'dc') decl.push(D('d_composition'));
    if (R.rcm) decl.push(D('d_rcm_note'));
    decl.forEach(function (d) { h.push('<div class="sh-decl">' + d + '</div>'); });
    P.bottom = h.join('');
    return P;
  }
  function signBlock(S) {
    var nm = String(S.name || '').trim(), line = docMode() === 'ui' ? t('d_for', { name: nm }) : tEn('d_for', { name: nm });
    return '<div class="sh-sign"><div class="who">' + (nm ? '<bdi>' + esc(line) + '</bdi>' : '&nbsp;') + '</div>' +
      (S.sign ? '<img src="' + esc(S.sign) + '" alt="">' : '<div class="sp"></div>') + '<div>' + D('d_sign') + '</div></div>';
  }
  function renderReceipt(doc, R, S) {
    var h = [];
    h.push('<div class="sh-rc">' + D('d_received', { name: String(doc.cust.name || '').trim() || '—' }, true) + '<span class="amt" id="shTotal">' + rs(R.total) + '</span>');
    h.push('<div class="sh-words" id="shWords">' + esc(wordsFor(R.total, 'en')) + (docMode() !== 'en' ? '<span class="loc"><bdi>' + esc(wordsFor(R.total, EDU.lang)) + '</bdi></span>' : '') + '</div></div>');
    var rows = [[D('rc_mode'), D('mode_' + doc.rc.mode)]];
    if (String(doc.rc.ref).trim()) rows.push([D('rc_ref'), esc(doc.rc.ref)]);
    if (String(doc.rc.against).trim()) rows.push([D('rc_against'), esc(doc.rc.against)]);
    h.push('<table class="sh-meta" style="max-width:420px"><tbody>' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>');
    if (String(doc.notes || '').trim()) h.push('<div class="sh-sec" style="margin-top:10px"><div class="sh-sec-t">' + D('notes') + '</div><div class="sh-terms">' + txt(doc.notes) + '</div></div>');
    h.push(signBlock(S));
    return h.join('');
  }

  /* hidden A4-width box used to measure rows (fixed + zero height, so it never widens the page) */
  var measureEl = null;
  function measureBox() {
    if (!measureEl) {
      var wrap = el('div', { class: 'measure-wrap', 'aria-hidden': 'true' });
      measureEl = el('div', { class: 'sheet no-i18n' });
      wrap.appendChild(measureEl);
      document.body.appendChild(wrap);
    }
    return measureEl;
  }
  function pageHtml(P, pg) {
    var h = P.wm + '<div class="pg-body">' + (pg.first ? P.full : P.mini);
    if (pg.rows) h += '<table class="sh-items fixed">' + pg.colgroup + '<thead>' + P.cols + '</thead><tbody>' + pg.rows.join('') + (pg.total ? P.total : '') + '</tbody></table>';
    if (pg.bottom) h += P.bottom;
    return h + '</div><div class="pg-foot"><span>' + (pg.n < pg.N ? P.cont : P.computer) + '</span><span>' + (pg.N > 1 ? P.pageOf(pg.n, pg.N) : '') + '</span></div>';
  }
  /* -> array of page HTML strings */
  function paginate(P) {
    if (!P.rows) return [P.wm + '<div class="pg-body">' + P.full + P.body + '</div><div class="pg-foot"><span>' + P.computer + '</span><span></span></div>'];
    var M = measureBox();
    M.innerHTML = '<div class="pg-full">' + P.full + '</div><div class="pg-mini">' + P.mini + '</div><table class="sh-items"><thead>' + P.cols + '</thead><tbody>' +
      P.rows.join('') + P.total + '</tbody></table><div class="pg-bot">' + P.bottom + '</div><div class="pg-foot"><span>x</span><span>y</span></div>';
    var q = function (s) { return M.querySelector(s); };
    var hFull = q('.pg-full').getBoundingClientRect().height, hMini = q('.pg-mini').getBoundingClientRect().height;
    var table = q('.sh-items'), hHead = table.tHead.getBoundingClientRect().height, trs = table.tBodies[0].rows, rowH = [];
    for (var i = 0; i < trs.length; i++) rowH.push(trs[i].getBoundingClientRect().height);
    var totalH = rowH.pop();
    var hBot = q('.pg-bot').getBoundingClientRect().height, hFoot = q('.pg-foot').getBoundingClientRect().height;
    var widths = Array.prototype.map.call(table.tHead.rows[0].cells, function (c) { return c.getBoundingClientRect().width; });
    var tw = widths.reduce(function (a, b) { return a + b; }, 0);
    if (tw < 50) {                                  // could not measure (e.g. already in print layout): one flowing page
      M.innerHTML = '';
      return [pageHtml(P, { first: true, rows: P.rows, total: true, bottom: true, n: 1, N: 1, colgroup: '' })];
    }
    var colgroup = '<colgroup>' + widths.map(function (w) { return '<col style="width:' + (w / tw * 100).toFixed(3) + '%">'; }).join('') + '</colgroup>';
    var cap = PAGE_H - PAGE_SAFE - hFoot, pages = [], cur = { first: true, rows: [], hs: [], used: hFull + hHead };
    var top = hMini + hHead;
    rowH.forEach(function (rh, i) {
      if (cur.rows.length && cur.used + rh > cap) { pages.push(cur); cur = { rows: [], hs: [], used: top }; }
      cur.rows.push(P.rows[i]); cur.hs.push(rh); cur.used += rh;
    });
    if (cur.used + totalH + hBot <= cap) { cur.total = cur.bottom = true; pages.push(cur); }
    else {
      /* carry the last rows to a new page so the totals and the amount in words never stand alone */
      var moved = [], mh = 0;
      while (cur.rows.length > 1 && moved.length < 3 && top + mh + cur.hs[cur.hs.length - 1] + totalH + hBot <= cap) { mh += cur.hs.pop(); moved.unshift(cur.rows.pop()); }
      if (moved.length) { pages.push(cur); pages.push({ rows: moved, total: true, bottom: true }); }
      else {
        cur.rows = cur.rows.concat(moved);
        if (cur.used + totalH <= cap) { cur.total = true; pages.push(cur); pages.push({ bottom: true }); }
        else { var last = cur.rows.pop(); pages.push(cur); pages.push({ rows: [last], total: true, bottom: top + rowH[rowH.length - 1] + totalH + hBot <= cap }); if (!pages[pages.length - 1].bottom) pages.push({ bottom: true }); }
      }
    }
    M.innerHTML = '';
    return pages.map(function (pg, i) { pg.n = i + 1; pg.N = pages.length; pg.colgroup = colgroup; return pageHtml(P, pg); });
  }
  function sheetsHtml(doc, R, copyKey) {
    return paginate(docParts(doc, R, copyKey)).map(function (p, i) { return '<div class="sheet no-i18n" data-page="' + (i + 1) + '">' + p + '</div>'; }).join('');
  }

  /* ================================================================ form: fill from the draft */
  function fillSelectStates(sel, opts) {
    opts = opts || {};
    var v = sel.value;
    sel.innerHTML = '';
    sel.appendChild(el('option', { value: '', text: opts.blank || t('choose_state') }));
    STATES.forEach(function (c) { sel.appendChild(el('option', { value: c, text: c + ' · ' + t('st_' + c) })); });
    if (opts.exportPos) sel.appendChild(el('option', { value: EXPORT_POS, text: EXPORT_POS + ' · ' + t('st_96') }));
    sel.value = v;
  }
  var F = {};   // form fields by id
  ['docNo', 'docDate', 'docDue', 'docRef', 'docPos', 'docSupply', 'docRcm', 'custName', 'custGstin', 'custState', 'custPhone', 'custEmail', 'custAddr',
    'shipOn', 'shipName', 'shipState', 'shipAddr', 'optIncl', 'optCess', 'rcAmount', 'rcMode', 'rcRef', 'rcAgainst', 'docNotes', 'docTerms',
    'trVehicle', 'trName', 'trEwb', 'optRound', 'optUpi', 'optBank'].forEach(function (id) { F[id] = $('#' + id); });
  var BIND = {   // field id -> [object getter, key]
    docNo: ['', 'no'], docDate: ['', 'date'], docDue: ['', 'due'], docRef: ['', 'ref'], docPos: ['', 'pos'], docSupply: ['', 'supply'], docRcm: ['', 'rcm'],
    custName: ['cust', 'name'], custGstin: ['cust', 'gstin'], custState: ['cust', 'state'], custPhone: ['cust', 'phone'], custEmail: ['cust', 'email'], custAddr: ['cust', 'address'],
    shipOn: ['ship', 'on'], shipName: ['ship', 'name'], shipState: ['ship', 'state'], shipAddr: ['ship', 'address'],
    optIncl: ['', 'incl'], optRound: ['', 'round'], optUpi: ['', 'upi'], optBank: ['', 'bank'],
    rcAmount: ['rc', 'amount'], rcMode: ['rc', 'mode'], rcRef: ['rc', 'ref'], rcAgainst: ['rc', 'against'],
    docNotes: ['', 'notes'], docTerms: ['', 'terms'], trVehicle: ['tr', 'vehicle'], trName: ['tr', 'transporter'], trEwb: ['tr', 'ewb']
  };
  function holder(path) { return path ? draft[path] : draft; }
  function fillForm() {
    Object.keys(BIND).forEach(function (id) {
      var b = BIND[id], f = F[id], v = holder(b[0])[b[1]];
      if (f.type === 'checkbox') f.checked = !!v; else f.value = v == null ? '' : v;
    });
    F.optCess.checked = !!settings.cess || draft.lines.some(function (l) { return String(l.cess || '').trim(); });
    renderLines();
    updateTypeUi();
    updateGstinMsg();
    $('#shipBox').hidden = !draft.ship.on;
  }
  function updateTypeUi() {
    var type = draft.type;
    $$('#typeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.type === type)); });
    var rc = type === 'rcpt';
    $('#itemsCard').hidden = rc;
    $('#rcptCard').hidden = !rc;
    $('#supplyRow').hidden = rc;
    $('#refField').hidden = rc;
    $('#dueField').hidden = rc || type === 'dc';
    $('#dueLabel').textContent = t(type === 'qtn' ? 'valid_till' : 'due_date');
    $('#rcmField').hidden = !(type === 'inv' || type === 'pi');
    $('#moreBox').hidden = rc || type === 'qtn';
    $('#optBox').hidden = rc;
    $('#toInvoice').hidden = !(type === 'qtn' || type === 'pi' || type === 'dc');
    $('#toReceipt').hidden = !(type === 'inv' || type === 'bos');
    $('#sumHead').textContent = t('dt_' + type);
    fillSelectStates(F.docPos, { exportPos: true });
    F.docPos.value = draft.pos;
  }
  function updateGstinMsg() {
    var r = checkGstin(draft.cust.gstin), m = gstinMsg(r), box = $('#custGstinMsg');
    if (r.state === 'empty') { box.className = 'msg muted'; box.textContent = String(draft.cust.name).trim() ? t('gst_empty') : ''; }
    else { box.className = 'msg ' + m.cls; box.textContent = m.text; }
    F.custGstin.classList.toggle('bad', r.state !== 'empty' && r.state !== 'ok');
    F.custGstin.setAttribute('aria-invalid', String(r.state !== 'empty' && r.state !== 'ok'));
    box.dataset.state = r.state;
  }

  /* ---------------------------------------------------------------- item lines */
  var linesBox = $('#lines');
  var LINE_FIELDS = [
    ['desc', 'col_desc', { dir: 'auto', list: 'itemList', maxlength: '300' }],
    ['hsn', 'col_hsn', { inputmode: 'numeric', maxlength: '12', dir: 'ltr' }],
    ['qty', 'col_qty', { inputmode: 'decimal', maxlength: '20', dir: 'ltr' }],
    ['unit', 'col_unit', { list: 'uqcList', maxlength: '8', dir: 'ltr', class: 'up' }],
    ['rate', 'col_rate', { inputmode: 'decimal', maxlength: '20', dir: 'ltr' }],
    ['disc', 'col_disc', { maxlength: '20', dir: 'ltr' }],
    ['gst', 'col_gst', { list: 'rateList', inputmode: 'decimal', maxlength: '10', dir: 'ltr' }],
    ['cess', 'col_cess', { inputmode: 'decimal', maxlength: '10', dir: 'ltr' }]
  ];
  function renderLines() {
    linesBox.innerHTML = '';
    linesBox.classList.toggle('has-cess', !!F.optCess.checked);
    var head = el('div', { class: 'ln ln-head', 'aria-hidden': 'true' }, el('span', { text: '#' }));
    LINE_FIELDS.forEach(function (f) {
      var s = el('span', { class: 'c-' + f[0] + (/^(qty|rate|disc|gst|cess)$/.test(f[0]) ? ' h-num' : ''), text: t(f[1]) });
      head.appendChild(s);
    });
    head.appendChild(el('span', { class: 'c-amt h-num', text: t('col_amount') }));
    head.appendChild(el('span', { class: 'c-del' }));
    linesBox.appendChild(head);
    draft.lines.forEach(function (ln, i) { linesBox.appendChild(lineRow(ln, i)); });
  }
  function lineRow(ln, i) {
    var row = el('div', { class: 'ln', dataset: { id: ln.id } });
    row.appendChild(el('div', { class: 'c-n', text: String(i + 1) }));
    LINE_FIELDS.forEach(function (f) {
      var id = 'l' + ln.id + '-' + f[0];
      var inp = el('input', Object.assign({ type: 'text', id: id, autocomplete: 'off', spellcheck: 'false', 'data-k': f[0] }, f[2]));
      if (f[0] === 'desc') inp.setAttribute('placeholder', t('desc_ph'));
      if (f[0] === 'disc') inp.setAttribute('placeholder', '0');
      inp.value = ln[f[0]];
      row.appendChild(el('div', { class: 'c c-' + f[0] }, el('label', { class: 'cap', for: id, text: t(f[1]) }), inp));
    });
    row.appendChild(el('div', { class: 'c c-amt' }, el('span', { class: 'cap', text: t('col_amount') }),
      el('output', { class: 'amt tnum', 'aria-live': 'off' }), el('span', { class: 'amt-sub tnum' })));
    row.appendChild(el('div', { class: 'c-del' }, el('button', { class: 'edu-iconbtn del', type: 'button', 'aria-label': t('del_line', { n: i + 1 }), title: t('del_line', { n: i + 1 }), text: '✕' })));
    return row;
  }
  function updateLineAmounts(R) {
    var rows = $$('.ln[data-id]', linesBox);
    rows.forEach(function (row, i) {
      var o = R.lines[i]; if (!o) return;
      var out = $('.amt', row), sub = $('.amt-sub', row);
      row.classList.toggle('has-err', !!o.errs.length);
      ['qty', 'rate', 'disc', 'gst', 'cess'].forEach(function (k) {
        var inp = $('input[data-k="' + k + '"]', row);
        inp.classList.toggle('bad', !!o.bad[k]);
        inp.setAttribute('aria-invalid', String(!!o.bad[k]));
      });
      if (o.empty) { out.textContent = ''; sub.textContent = ''; out.dataset.paise = '0'; return; }
      if (!o.ok) { out.textContent = '—'; sub.textContent = ''; out.dataset.paise = ''; row.title = o.errs.join(' '); return; }
      row.title = '';
      out.dataset.paise = String(o.total);
      out.textContent = money(R.taxed ? o.total : o.taxable);
      sub.textContent = R.taxed ? money(o.taxable) + ' + ' + money(o.tax) : '';
    });
  }

  /* ---------------------------------------------------------------- summary panel */
  /* amounts are isolated left-to-right so a sign stays in front of the number in Urdu (+0.20, not 0.20+) */
  function setAmt(id, p, rowId, show, text) {
    var c = $('#' + id); c.textContent = ''; c.appendChild(el('bdi', { dir: 'ltr', text: text || money(p) })); c.dataset.paise = String(p);
    if (rowId) $('#' + rowId).classList.toggle('hide', !show);
  }
  var lastR = null;
  function updateSummary(R) {
    lastR = R;
    var rc = draft.type === 'rcpt';
    setAmt('sumTaxable', R.taxable, 'rowTaxable', !rc);
    setAmt('sumCgst', R.cgst, 'rowCgst', R.mode === 'intra');
    setAmt('sumSgst', R.sgst, 'rowSgst', R.mode === 'intra');
    setAmt('sumIgst', R.igst, 'rowIgst', R.mode === 'inter' || R.mode === 'lut');
    setAmt('sumCess', R.cess, 'rowCess', !!R.cess);
    setAmt('sumRound', R.roundOff, 'rowRound', !rc && draft.round, (R.roundOff > 0 ? '+' : '') + money(R.roundOff));   // same sign as on the printed invoice
    var tot = $('#sumTotal'); tot.textContent = rs(R.total); tot.dataset.paise = String(R.total);
    $('#wordsEn').textContent = wordsFor(R.total, 'en');
    var wl = $('#wordsLocal');
    wl.hidden = EDU.lang === 'en'; wl.textContent = EDU.lang === 'en' ? '' : wordsFor(R.total, EDU.lang);
    var mb = $('#modeBadge');
    mb.textContent = rc ? t('dt_rcpt') : t(R.rcm ? 'mode_rcm' : 'mode_' + R.mode);
    mb.dataset.mode = R.mode;
    var rn = $('#rcmNote'); rn.hidden = !R.rcm; rn.textContent = R.rcm ? t('rcm_pay', { amt: money(R.tax) }) : '';
    var ch = docChecks(draft, R), ul = $('#checks');
    ul.innerHTML = '';
    if (!ch.length) ul.appendChild(el('li', { class: 'ok', text: '✓ ' + t('all_ok') }));
    ch.forEach(function (c) { ul.appendChild(el('li', { class: c.lv, text: (c.lv === 'err' ? '✖ ' : '⚠ ') + c.text })); });
    var cnt = $('#checksCount'); cnt.textContent = String(ch.length); cnt.className = 'badge ' + (ch.some(function (c) { return c.lv === 'err'; }) ? 'danger' : ch.length ? 'accent' : 'success');
    var noMsg = $('#noMsg'), noIssue = numberIssues(ch);
    noMsg.className = 'msg ' + (noIssue.err ? 'bad' : 'warn');
    noMsg.textContent = noIssue.text;
    var dateBad = ch.some(function (c) { return c.k === 'no_date'; });
    F.docNo.classList.toggle('bad', ch.some(function (c) { return c.lv === 'err' && (c.k === 'no_empty' || c.k === 'dup_number'); }));
    F.docDate.classList.toggle('bad', dateBad);
    F.docDate.setAttribute('aria-invalid', String(dateBad));
    updateSaveState();
    updateWa(R);
  }
  function numberIssues(ch) {
    var found = ch.filter(function (c) { return /^(no_|dup_number)/.test(c.k); });
    return { err: found.some(function (c) { return c.lv === 'err'; }), text: found.map(function (c) { return c.text; }).join(' ') };
  }
  function isSaved() { return docs.some(function (d) { return d.id === draft.id; }); }
  function updateSaveState() {
    var s = $('#saveState'), ok = isSaved() && !dirty;
    s.className = 'savestate ' + (ok ? 'ok' : 'no');
    s.textContent = ok ? '✓ ' + t('st_saved') : t('st_unsaved');
  }

  /* ---------------------------------------------------------------- preview */
  var pvTimer = 0;
  function firstCopy(R) {
    var labels = copyLabels(draft, R);
    if (!labels.length) return '';
    for (var i = 0; i < labels.length; i++) if (settings.copies[i]) return labels[i];
    return labels[0];
  }
  function renderPreview() {
    var R = lastR || calc(draft);
    $('#sheet').innerHTML = sheetsHtml(draft, R, firstCopy(R));
    renderCopyChecks(R);
    fitPreview();
  }
  function schedulePreview() { clearTimeout(pvTimer); pvTimer = setTimeout(renderPreview, 90); }
  function fitPreview() {
    var wrap = $('#pvWrap'), sh = $('#sheet');
    if (!wrap.offsetParent) return;
    var avail = wrap.clientWidth - 24, sc = pvFull ? 1 : Math.min(1, avail / 794);
    wrap.classList.toggle('full', pvFull);
    $('#pvZoom').setAttribute('aria-pressed', String(pvFull));
    $('#pvZoomLbl').textContent = t(pvFull ? 'zoom_fit' : 'zoom_full');
    $('#pvZoom').hidden = avail >= 794;
    sh.style.transform = sc < 1 ? 'scale(' + sc + ')' : '';
    sh.style.marginLeft = sc < 1 ? '0' : Math.max(0, (avail - 794) / 2) + 'px';
    wrap.style.height = Math.ceil(sh.offsetHeight * sc + 24) + 'px';
  }
  window.addEventListener('resize', function () { clearTimeout(pvTimer); pvTimer = setTimeout(fitPreview, 120); });
  var pvFull = false;
  $('#pvZoom').addEventListener('click', function () { pvFull = !pvFull; fitPreview(); });
  function renderCopyChecks(R) {
    var box = $('#copyChecks'), labels = copyLabels(draft, R);
    box.innerHTML = '';
    if (!labels.length) { box.appendChild(el('span', { class: 'tiny muted', text: '' })); return; }
    box.appendChild(el('span', { class: 'small muted', text: t('copies') + ':' }));
    labels.forEach(function (k, i) {
      var cb = el('input', { type: 'checkbox', id: 'copy' + i });
      cb.checked = !!settings.copies[i];
      cb.addEventListener('change', function () {
        settings.copies[i] = cb.checked;
        if (!settings.copies.some(Boolean)) { settings.copies[0] = true; }
        saveSettings(); renderPreview();
      });
      box.appendChild(el('label', { class: 'check' }, cb, el('span', { text: t(k) })));
    });
  }

  /* ---------------------------------------------------------------- change handling */
  var saveTimer = 0;
  function persistDraft() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { saveTimer = 0; store.set('draft', draft); store.set('dirty', dirty); }, 250); }
  /* closing or reloading the tab right after typing must not lose the last keystrokes */
  window.addEventListener('pagehide', function () {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = 0; store.set('draft', draft); store.set('dirty', dirty); }
    if (pfTimer) { clearTimeout(pfTimer); pfTimer = 0; store.set('profile', profile); }
  });
  function changed(opts) {
    opts = opts || {};
    if (!opts.keepSample) delete draft.sample;
    if (!opts.clean) dirty = true;
    var R = calc(draft);
    updateLineAmounts(R);
    updateSummary(R);
    schedulePreview();
    persistDraft();
  }
  function onField(e) {
    var id = e.target.id, b = BIND[id];
    if (!b) return;
    var f = e.target, v = f.type === 'checkbox' ? f.checked : f.value;
    if (id === 'custGstin' || id === 'trVehicle') v = String(v).toUpperCase();
    holder(b[0])[b[1]] = v;
    if (id === 'docNo') draft.autoNo = false;
    if (id === 'docDate' && draft.autoNo) { draft.no = nextNo(draft.type, draft.date, draft.id); F.docNo.value = draft.no; }
    if (id === 'docPos') draft.posManual = true;
    if (id === 'custGstin') {
      var r = checkGstin(v);
      if (r.state === 'ok') {
        draft.cust.state = r.code; F.custState.value = r.code;
        if (!draft.posManual && draft.supply === 'normal') { draft.pos = r.code; F.docPos.value = r.code; }
      }
      updateGstinMsg();
    }
    if (id === 'custName') updateGstinMsg();
    if (id === 'custState' && !draft.posManual && draft.supply === 'normal' && v) { draft.pos = v; F.docPos.value = v; }
    if (id === 'docSupply' && v !== 'normal' && !draft.posManual) { draft.pos = EXPORT_POS; F.docPos.value = EXPORT_POS; }
    if (id === 'docSupply' && v === 'normal' && draft.pos === EXPORT_POS) { draft.pos = draft.cust.state || sellerState(); F.docPos.value = draft.pos; }
    if (id === 'shipOn') $('#shipBox').hidden = !v;
    if (id === 'optIncl') { settings.incl = !!v; saveSettings(); }
    if (id === 'optRound' || id === 'optUpi' || id === 'optBank') { settings[b[1]] = !!v; saveSettings(); }
    changed();
  }
  $('#p-make').addEventListener('input', function (e) { if (e.target.closest('#lines')) return; if (e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT') onField(e); });
  $('#p-make').addEventListener('change', function (e) {
    if (e.target.closest('#lines') || e.target.closest('#copyChecks')) return;
    if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') onField(e);
    if (e.target.id === 'custName') fillCustomerFromMaster();
    if (e.target.id === 'rcAgainst') fillFromInvoice();
  });
  F.optCess.addEventListener('change', function () { settings.cess = F.optCess.checked; saveSettings(); linesBox.classList.toggle('has-cess', F.optCess.checked); });

  /* line inputs */
  linesBox.addEventListener('input', function (e) {
    var inp = e.target, row = inp.closest('.ln[data-id]'); if (!row) return;
    var ln = lineById(row.dataset.id); if (!ln) return;
    ln[inp.dataset.k] = inp.dataset.k === 'unit' ? inp.value.toUpperCase() : inp.value;
    if (inp.dataset.k === 'gst' && pct(inp.value)) settings.gst = pct(inp.value);
    changed();
  });
  linesBox.addEventListener('change', function (e) {
    var inp = e.target, row = inp.closest('.ln[data-id]'); if (!row) return;
    if (inp.dataset.k === 'desc') fillItemFromMaster(row);
    if (inp.dataset.k === 'unit') { inp.value = inp.value.toUpperCase(); }
    if (inp.dataset.k === 'gst') saveSettings();
  });
  linesBox.addEventListener('click', function (e) {
    var b = e.target.closest('button.del'); if (!b) return;
    var row = b.closest('.ln[data-id]'), idx = draft.lines.findIndex(function (l) { return l.id === row.dataset.id; });
    if (idx < 0) return;
    draft.lines.splice(idx, 1);
    if (!draft.lines.length) draft.lines.push(newLine());
    renderLines(); changed();
    var rows = $$('.ln[data-id]', linesBox), focusRow = rows[Math.min(idx, rows.length - 1)];
    if (focusRow) $('input[data-k="desc"]', focusRow).focus();
  });
  /* keyboard: Enter in the item name jumps to its quantity; Enter elsewhere opens the next line */
  linesBox.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
    var inp = e.target, row = inp.closest('.ln[data-id]'); if (!row || inp.tagName !== 'INPUT') return;
    e.preventDefault();
    if (inp.dataset.k === 'desc' && !e.shiftKey) { fillItemFromMaster(row); $('input[data-k="qty"]', row).select(); return; }
    var rows = $$('.ln[data-id]', linesBox), i = rows.indexOf(row);
    if (i === rows.length - 1) addLine(); else $('input[data-k="desc"]', rows[i + 1]).focus();
  });
  function lineById(id) { for (var i = 0; i < draft.lines.length; i++) if (draft.lines[i].id === id) return draft.lines[i]; return null; }
  function addLine() {
    if (draft.lines.length >= MAX_LINES) return;
    var prev = draft.lines[draft.lines.length - 1];
    draft.lines.push(newLine({ gst: prev && String(prev.gst).trim() ? prev.gst : undefined }));
    linesBox.appendChild(lineRow(draft.lines[draft.lines.length - 1], draft.lines.length - 1));
    changed();
    var rows = $$('.ln[data-id]', linesBox);
    $('input[data-k="desc"]', rows[rows.length - 1]).focus();
  }
  $('#addLine').addEventListener('click', addLine);

  /* masters -> form */
  function findItem(name) { name = String(name || '').trim().toLowerCase(); if (!name) return null; for (var i = 0; i < items.length; i++) if (String(items[i].name).trim().toLowerCase() === name) return items[i]; return null; }
  function findCustomer(name, gstin) {
    gstin = String(gstin || '').trim().toUpperCase(); name = String(name || '').trim().toLowerCase();
    for (var i = 0; i < customers.length; i++) {
      var c = customers[i];
      if (gstin && String(c.gstin).toUpperCase() === gstin) return c;
      if (!gstin && name && String(c.name).trim().toLowerCase() === name) return c;
    }
    return null;
  }
  function fillItemFromMaster(row) {
    var ln = lineById(row.dataset.id); if (!ln) return;
    var it = findItem(ln.desc); if (!it) return;
    if (String(ln.rate).trim() && String(ln.hsn).trim()) return;
    ['hsn', 'unit', 'rate', 'gst', 'cess'].forEach(function (k) { if (it[k] !== undefined && String(it[k]) !== '') { ln[k] = String(it[k]); $('input[data-k="' + k + '"]', row).value = ln[k]; } });
    if (String(ln.cess).trim() && !F.optCess.checked) { F.optCess.checked = true; linesBox.classList.add('has-cess'); }
    changed();
  }
  function useCustomer(c) {
    draft.cust = { name: c.name || '', gstin: c.gstin || '', state: c.state || '', address: c.address || '', phone: c.phone || '', email: c.email || '' };
    if (!draft.posManual && draft.supply === 'normal' && draft.cust.state) draft.pos = draft.cust.state;
    fillForm(); changed();
  }
  function fillCustomerFromMaster() {
    var c = findCustomer(draft.cust.name, '');
    if (c && !String(draft.cust.gstin).trim() && !String(draft.cust.address).trim()) useCustomer(c);
  }
  function fillFromInvoice() {
    var no = String(draft.rc.against || '').trim().toUpperCase(); if (!no) return;
    var inv = docs.filter(function (d) { return (d.type === 'inv' || d.type === 'bos' || d.type === 'pi') && d.no.toUpperCase() === no; })[0];
    if (!inv) return;
    if (!String(draft.cust.name).trim()) draft.cust = clone(inv.cust);
    if (!String(draft.rc.amount).trim() && inv.sum) draft.rc.amount = balanceText(inv.sum.total, inv.no, draft.id);
    fillForm(); changed();
  }

  /* ---------------------------------------------------------------- doc type, new, save, convert */
  $('#typeSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-type]'); if (!b || b.dataset.type === draft.type) return;
    setType(b.dataset.type);
  });
  function setType(type) {
    if (isSaved()) { openDraft(convert(draft, type)); dirty = true; changed({ keepSample: true }); return; }
    draft.type = type;
    draft.autoNo = true;                       // every document type has its own number series
    draft.no = nextNo(type, draft.date, draft.id);
    if (type === 'rcpt' && !String(draft.rc.amount).trim() && lastR && lastR.total) draft.rc.amount = plain(lastR.total);
    fillForm(); changed({ keepSample: true });
  }
  /* money already received against a bill (all saved receipts, so part payments add up) */
  function receivedFor(no, exceptId) {
    no = String(no || '').trim().toUpperCase();
    if (!no) return 0;
    return docs.reduce(function (a, d) {
      return a + (d.type === 'rcpt' && d.id !== exceptId && String(d.rc.against || '').trim().toUpperCase() === no && d.sum ? d.sum.total || 0 : 0);
    }, 0);
  }
  function balanceText(total, no, exceptId) { var due = total - receivedFor(no, exceptId); return plain(due > 0 ? due : total); }
  function convert(src, type) {
    var d = normDoc(clone(src));
    d.id = uid(); d.type = type; d.autoNo = true; d.date = today(); d.paid = false; d.saved = 0; delete d.sum; delete d.sample;
    d.no = nextNo(type, d.date, d.id);
    if (src.type === 'qtn' || src.type === 'pi' || src.type === 'dc') d.ref = src.no;
    if (type === 'rcpt') {
      var R = calc(src);
      d.rc = { amount: balanceText(R.total, src.no), mode: 'upi', ref: '', against: src.no };
      d.notes = '';
    }
    if (type === 'qtn' || type === 'pi') d.due = addDays(d.date, 15); else if (src.type !== type) d.due = '';
    return d;
  }
  function openDraft(d) {
    draft = d;
    fillForm();
    var R = calc(draft); updateLineAmounts(R); updateSummary(R); renderPreview();
    store.set('draft', draft);
  }
  function hasContent() { return draft.lines.some(function (l) { return String(l.desc).trim() || String(l.rate).trim(); }) || String(draft.cust.name).trim(); }
  $('#newDoc').addEventListener('click', function () {
    if (dirty && !draft.sample && hasContent() && !confirm(t('new_confirm'))) return;
    dirty = false; openDraft(blankDoc(draft.type)); updateSaveState(); store.set('dirty', false);
    var first = $('#custName'); if (first) first.focus();
  });
  $('#dupDoc').addEventListener('click', function () { var d = convert(draft, draft.type); d.ref = draft.ref; dirty = true; openDraft(d); updateSaveState(); });
  $('#toInvoice').addEventListener('click', function () { dirty = true; openDraft(convert(draft, 'inv')); updateSaveState(); });
  $('#toReceipt').addEventListener('click', function () { dirty = true; openDraft(convert(draft, 'rcpt')); updateSaveState(); });

  function upsertMasters(doc) {
    if (!settings.remember) return;
    var c = doc.cust;
    if (String(c.name).trim()) {
      var ex = findCustomer(c.name, checkGstin(c.gstin).state === 'ok' ? c.gstin : '') || findCustomer(c.name, '');
      var rec = { name: c.name.trim(), gstin: String(c.gstin || '').toUpperCase(), state: c.state, address: c.address, phone: c.phone, email: c.email };
      if (ex) Object.assign(ex, rec); else customers.push(Object.assign({ id: uid() }, rec));
      store.set('customers', customers);
    }
    if (doc.type === 'rcpt') return;
    doc.lines.forEach(function (l) {
      if (!String(l.desc).trim()) return;
      var it = findItem(l.desc), rec = { name: l.desc.trim(), hsn: l.hsn, unit: l.unit, rate: l.rate, gst: l.gst, cess: l.cess };
      if (it) Object.assign(it, rec); else items.push(Object.assign({ id: uid() }, rec));
    });
    store.set('items', items);
  }
  function saveDoc() {
    var R = calc(draft), ch = docChecks(draft, R);
    /* errors block saving (a wrong number, no date, a line that is not a number would print a wrong document);
       reminders (warnings) do not */
    var blocking = ch.filter(function (c) { return c.lv === 'err'; });
    if (blocking.length) {
      var b0 = blocking[0];
      EDU.toast(b0.text, 4000);
      $('#checksBox').open = true;
      if (b0.k === 'no_date') F.docDate.focus();
      else if (b0.k === 'dup_number' || b0.k === 'no_empty') F.docNo.focus();
      else if (draft.type === 'rcpt') F.rcAmount.focus();
      else { var bad = $('#lines input.bad') || $('#lines .ln[data-id] input[data-k="desc"]'); if (bad) bad.focus(); }
      return false;
    }
    draft.no = String(draft.no).trim();
    draft.saved = Date.now();
    delete draft.sample;
    draft.sum = { taxable: R.taxable, cgst: R.cgst, sgst: R.sgst, igst: R.igst, cess: R.cess, round: R.roundOff, total: R.total, mode: R.mode, rcm: R.rcm };
    var copy = clone(draft), i = docs.findIndex(function (d) { return d.id === draft.id; });
    if (i >= 0) docs[i] = copy; else docs.push(copy);
    /* receipts that add up to the full amount (one payment or several part payments) mark the bill as paid */
    if (draft.type === 'rcpt' && String(draft.rc.against).trim()) {
      var key = draft.rc.against.trim().toUpperCase(), got = receivedFor(key);
      docs.forEach(function (d) { if ((d.type === 'inv' || d.type === 'bos' || d.type === 'pi') && d.no.toUpperCase() === key && d.sum && got >= d.sum.total) d.paid = true; });
    }
    if (!warnFull(store.set('docs', docs))) { docs = arr(store.get('docs', [])).map(normDoc).filter(Boolean); return false; }
    upsertMasters(draft);
    dirty = false; draft.autoNo = false;
    store.set('draft', draft); store.set('dirty', false);
    EDU.toast(t('saved_as', { no: draft.no }));
    refreshLists();
    changed({ clean: true, keepSample: true });
    return true;
  }
  $('#saveDoc').addEventListener('click', saveDoc);

  /* ---------------------------------------------------------------- print, WhatsApp, text */
  var printRoot = $('#printRoot'), oldTitle = '', builtAt = 0;
  function buildPrint(e) {
    if (e && e.type === 'beforeprint' && Date.now() - builtAt < 3000) return;   // the Print button just built it
    builtAt = Date.now();
    var R = calc(draft), labels = copyLabels(draft, R), list = [];
    if (!labels.length) list = [''];
    else labels.forEach(function (k, i) { if (settings.copies[i]) list.push(k); });
    if (!list.length) list = [labels[0]];
    printRoot.innerHTML = list.map(function (k) { return '<div class="copyset">' + sheetsHtml(draft, R, k) + '</div>'; }).join('');
    oldTitle = document.title;
    document.title = (draft.no + ' ' + (draft.cust.name || '')).replace(/[\/\\:*?"<>|]+/g, '-').trim();
  }
  window.addEventListener('beforeprint', buildPrint);
  window.addEventListener('afterprint', function () { if (oldTitle) document.title = oldTitle; oldTitle = ''; });
  $('#printDoc').addEventListener('click', function () { buildPrint(); window.print(); });

  function docText(R) {
    var S = seller(), lines = [];
    lines.push(t('wa_head', { doc: t('dt_' + draft.type), no: draft.no, date: dmy(draft.date) }));
    lines.push(t('wa_from', { name: S.name }));
    if (String(draft.cust.name).trim()) lines.push(t('wa_to', { name: draft.cust.name.trim() }));
    if (draft.type !== 'rcpt') {
      R.lines.forEach(function (o) { if (o.ok) lines.push('• ' + String(o.ln.desc).trim() + ' × ' + qtyStr(o.q) + ' = ' + rs(R.taxed ? o.total : o.taxable)); });
      if (R.taxed) lines.push(t('taxable') + ': ' + rs(R.taxable) + ' · GST: ' + rs(R.tax));
    }
    lines.push(t('wa_amount', { amt: money(R.total) }));
    if (draft.due && (draft.type === 'inv' || draft.type === 'pi' || draft.type === 'bos')) lines.push(t('wa_due', { date: dmy(draft.due) }));
    if (draft.due && draft.type === 'qtn') lines.push(t('valid_till') + ': ' + dmy(draft.due));
    if ((draft.type === 'inv' || draft.type === 'pi' || draft.type === 'bos') && validUpi(S.upi) && R.total > 0) lines.push(t('wa_upi', { upi: S.upi }));
    lines.push(t('wa_thanks'));
    return lines.join('\n');
  }
  function updateWa(R) {
    var phone = asciiDigits(draft.cust.phone).replace(/\D/g, ''), to = '';
    if (phone.length === 11 && phone.charAt(0) === '0') phone = phone.slice(1);          // 098220 12345
    if (phone.length === 13 && phone.slice(0, 3) === '091') phone = phone.slice(1);      // 091 98220 12345
    if (phone.length === 10) to = '91' + phone; else if (phone.length === 12 && phone.slice(0, 2) === '91') to = phone;
    $('#waDoc').href = 'https://wa.me/' + to + '?text=' + encodeURIComponent(docText(R));
  }
  $('#copyDoc').addEventListener('click', function () { EDU.copy(docText(calc(draft))); });

  /* keyboard shortcuts */
  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    var k = (e.key || '').toLowerCase();
    if (k === 's') { e.preventDefault(); if (currentTab === 'make') saveDoc(); }
  });

  /* ================================================================ tabs */
  var currentTab = ['make', 'docs', 'masters', 'profile'].indexOf(settings.tab) >= 0 ? settings.tab : 'make';
  function showTab(name, focus) {
    currentTab = name;
    $$('#tabs button').forEach(function (b) { var on = b.dataset.tab === name; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    ['make', 'docs', 'masters', 'profile'].forEach(function (n) { $('#p-' + n).hidden = n !== name; });
    settings.tab = name; saveSettings();
    if (name === 'make') renderPreview();
    if (name === 'docs') renderDocs();
  }
  $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('button[data-tab]'); if (b) showTab(b.dataset.tab); });
  $('#tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var names = ['make', 'docs', 'masters', 'profile'], i = names.indexOf(currentTab), rtl = document.documentElement.dir === 'rtl';
    var step = (e.key === 'ArrowRight') !== rtl ? 1 : -1;
    showTab(names[(i + step + names.length) % names.length], true); e.preventDefault();
  });
  $('#goProfile').addEventListener('click', function () { showTab('profile'); $('#pfName').focus(); });

  /* ================================================================ saved documents */
  var fType = $('#fType'), fFy = $('#fFy'), fMonth = $('#fMonth'), fSearch = $('#fSearch');
  function monthName(m) {
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { month: 'long', numberingSystem: 'latn' }).format(new Date(2026, m - 1, 15)); }
    catch (e) { return String(m); }
  }
  function fillDocFilters() {
    var tv = fType.value, fv = fFy.value, mv = fMonth.value;
    fType.innerHTML = '';
    fType.appendChild(el('option', { value: '', text: t('all_types') }));
    TYPES.forEach(function (ty) { fType.appendChild(el('option', { value: ty, text: t('dt_' + ty) })); });
    fType.value = tv;
    var fys = {}; fys[fyOf(today()).long] = 1;
    docs.forEach(function (d) { fys[fyOf(d.date).long] = 1; });
    fFy.innerHTML = '';
    Object.keys(fys).sort().reverse().forEach(function (f) { fFy.appendChild(el('option', { value: f, text: f })); });
    fFy.value = fv && fys[fv] ? fv : fyOf(today()).long;
    fMonth.innerHTML = '';
    fMonth.appendChild(el('option', { value: '', text: t('all_months') }));
    [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3].forEach(function (m) { fMonth.appendChild(el('option', { value: String(m), text: monthName(m) })); });
    fMonth.value = mv;
  }
  function filteredDocs() {
    var ty = fType.value, fy = fFy.value, m = fMonth.value, q = fSearch.value.trim().toLowerCase();
    return docs.filter(function (d) {
      if (ty && d.type !== ty) return false;
      if (fy && fyOf(d.date).long !== fy) return false;
      if (m && +d.date.slice(5, 7) !== +m) return false;
      if (q && (d.no + ' ' + d.cust.name + ' ' + d.cust.gstin).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (a.no < b.no ? 1 : -1); });
  }
  function sumOf(d) { return d.sum || (function () { var R = calc(d); return { taxable: R.taxable, cgst: R.cgst, sgst: R.sgst, igst: R.igst, cess: R.cess, round: R.roundOff, total: R.total, mode: R.mode, rcm: R.rcm }; })(); }
  function renderDocs() {
    fillDocFilters();
    var list = filteredDocs(), body = $('#docBody');
    body.innerHTML = '';
    $('#noDocs').hidden = list.length > 0;
    $('#docTable').hidden = !list.length;
    var sales = list.filter(function (d) { return d.type === 'inv' || d.type === 'bos'; }), tx = 0, tax = 0, tot = 0;
    sales.forEach(function (d) { var s = sumOf(d); tx += s.taxable; tax += s.rcm ? 0 : s.cgst + s.sgst + s.igst + s.cess; tot += s.total; });
    var st = $('#docStats'); st.innerHTML = '';
    [[t('n_docs_k'), EDU.fmt(list.length)], [t('taxable'), rs(tx)], [t('sum_gst'), rs(tax)], [t('sum_total'), rs(tot)]].forEach(function (p, i) {
      st.appendChild(el('div', { class: 'stat', id: 'stat' + i }, el('div', { class: 'v', text: p[1] }), el('div', { class: 'k', text: p[0] })));
    });
    list.forEach(function (d) {
      var s = sumOf(d), tr = el('tr', { dataset: { id: d.id }, class: d.id === draft.id ? 'cur' : '' });
      tr.appendChild(el('td', { class: 'no-i18n mono-in', dir: 'ltr', text: d.no }));
      tr.appendChild(el('td', { class: 'tnum', text: dmy(d.date) }));
      tr.appendChild(el('td', { class: 'cust no-i18n', dir: 'auto', text: d.cust.name || '—' }));
      tr.appendChild(el('td', { text: t('dt_' + d.type) }));
      tr.appendChild(el('td', { class: 'num', text: money(s.total) }));
      var stc = el('td');
      if (d.type === 'inv' || d.type === 'bos' || d.type === 'pi') {
        var cb = el('input', { type: 'checkbox', class: 'paid-cb', 'aria-label': t('paid') + ' ' + d.no });
        cb.checked = !!d.paid;
        stc.appendChild(el('label', { class: 'check' }, cb, el('span', { text: t(d.paid ? 'paid' : 'unpaid') })));
      }
      tr.appendChild(stc);
      tr.appendChild(el('td', {}, el('div', { class: 'row' },
        el('button', { class: 'btn btn-sm', type: 'button', 'data-act': 'open', text: t('open') }),
        el('button', { class: 'btn btn-sm', type: 'button', 'data-act': 'dup', text: t('dup_doc') }),
        el('button', { class: 'edu-iconbtn', type: 'button', 'data-act': 'del', 'aria-label': t('delete') + ' ' + d.no, title: t('delete'), text: '🗑' }))));
      body.appendChild(tr);
    });
  }
  [fType, fFy, fMonth].forEach(function (s) { s.addEventListener('change', renderDocs); });
  fSearch.addEventListener('input', renderDocs);
  $('#docBody').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var id = b.closest('tr').dataset.id, d = docs.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    var act = b.dataset.act;
    if (act === 'open') {
      if (dirty && !draft.sample && hasContent() && !isSaved() && !confirm(t('new_confirm'))) return;
      var c = normDoc(clone(d)); c.autoNo = false; dirty = false; openDraft(c); store.set('dirty', false); updateSaveState(); showTab('make');
      window.scrollTo(0, 0);
    } else if (act === 'dup') {
      var n = convert(d, d.type); n.ref = d.ref; dirty = true; openDraft(n); updateSaveState(); showTab('make');
    } else if (act === 'del') {
      if (!confirm(t('confirm_delete', { no: d.no }))) return;
      docs = docs.filter(function (x) { return x.id !== id; });
      store.set('docs', docs);
      EDU.toast(t('deleted'));
      if (draft.id === id) { dirty = true; }
      refreshLists(); renderDocs(); changed({ keepSample: true });
    }
  });
  $('#docBody').addEventListener('change', function (e) {
    if (!e.target.classList.contains('paid-cb')) return;
    var id = e.target.closest('tr').dataset.id;
    docs.forEach(function (d) { if (d.id === id) d.paid = e.target.checked; });
    store.set('docs', docs);
    renderDocs();
  });

  /* invoice register for the accountant (tax invoices + bills of supply) */
  $('#regCsv').addEventListener('click', function () {
    var list = filteredDocs().filter(function (d) { return d.type === 'inv' || d.type === 'bos'; }).reverse();
    var rows = [['Type', 'Invoice No', 'Invoice Date', 'Customer', 'Customer GSTIN', 'Place of Supply', 'Reverse Charge', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Cess', 'Round Off', 'Invoice Value', 'Paid']];
    list.forEach(function (d) {
      var s = sumOf(d), pos = d.pos || '';
      rows.push([tEn('dt_' + d.type), cellText(d.no), dmy(d.date), cellText(d.cust.name), String(d.cust.gstin || '').toUpperCase(), pos ? pos + '-' + tEn('st_' + pos) : '',
        s.rcm ? 'Y' : 'N', plain(s.taxable), plain(s.igst), plain(s.cgst), plain(s.sgst), plain(s.cess), (s.round < 0 ? '-' : '') + plain(Math.abs(s.round)), plain(s.total), d.paid ? 'Y' : 'N']);
    });
    var name = 'gst-register-' + (fFy.value || fyOf(today()).long) + (fMonth.value ? '-' + pad2(+fMonth.value) : '') + '.csv';
    EDU.download(name, EDU.csv.stringify(rows), 'text/csv');
  });

  /* backup / restore */
  $('#backupJson').addEventListener('click', function () {
    var data = { app: SLUG, version: 1, exported: new Date().toISOString(), profile: profile, settings: settings, customers: customers, items: items, docs: docs };
    EDU.download('gst-invoice-backup-' + today() + '.json', JSON.stringify(data, null, 1), 'application/json');
  });
  $('#restoreJson').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return null;
      return EDU.readText(f).then(function (txt) {
        var data = null; try { data = JSON.parse(txt); } catch (e) { }
        if (!data || data.app !== SLUG || !Array.isArray(data.docs)) { EDU.toast(t('restore_bad'), 4000); return; }
        if (!confirm(t('restore_confirm'))) return;
        profile = normProfile(data.profile);
        settings = normSettings(data.settings);
        customers = arr(data.customers).map(normCust); items = arr(data.items).map(normItem); docs = arr(data.docs).map(normDoc).filter(Boolean);
        ['profile', 'settings', 'customers', 'items'].forEach(function (k) { store.set(k, k === 'profile' ? profile : k === 'settings' ? settings : k === 'customers' ? customers : items); });
        warnFull(store.set('docs', docs));
        EDU.toast(t('restore_ok', { n: docs.length }));
        fillProfile(); refreshLists(); renderDocs(); dirty = false; openDraft(blankDoc('inv'));
      });
    }).catch(function () { EDU.toast(t('restore_bad'), 4000); });
  });

  /* ================================================================ customers & items */
  var editCust = null, editItem = null;
  function refreshLists() {
    $('#docCount').textContent = docs.length ? EDU.fmt(docs.length) : '';
    var cl = $('#custList'); cl.innerHTML = '';
    customers.forEach(function (c) { cl.appendChild(el('option', { value: c.name, label: [c.gstin, c.state ? t('st_' + c.state) : ''].filter(Boolean).join(' · ') })); });
    var il = $('#itemList'); il.innerHTML = '';
    items.forEach(function (it) { il.appendChild(el('option', { value: it.name, label: [it.hsn, it.rate ? '₹' + it.rate : '', it.gst !== '' ? it.gst + '%' : ''].filter(Boolean).join(' · ') })); });
    var inl = $('#invList'); inl.innerHTML = '';
    docs.filter(function (d) { return d.type === 'inv' || d.type === 'bos' || d.type === 'pi'; }).forEach(function (d) { inl.appendChild(el('option', { value: d.no, label: d.cust.name })); });
    renderMasters();
  }
  function renderMasters() {
    var cb = $('#custBody'); cb.innerHTML = '';
    $('#noCust').hidden = customers.length > 0;
    customers.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }).forEach(function (c) {
      cb.appendChild(el('tr', { dataset: { id: c.id } },
        el('td', { class: 'nm' }, el('strong', { class: 'no-i18n', dir: 'auto', text: c.name }), el('div', { class: 'tiny muted' },
          el('span', { class: 'mono-in no-i18n', dir: 'ltr', text: [c.gstin, c.phone].filter(Boolean).join(' · ') }), c.state ? ' ' + t('st_' + c.state) : '')),
        el('td', { class: 'acts-cell' }, el('div', { class: 'm-acts' },
          el('button', { class: 'btn btn-sm', type: 'button', 'data-act': 'use', text: t('use') }),
          el('button', { class: 'edu-iconbtn', type: 'button', 'data-act': 'edit', 'aria-label': t('edit') + ' ' + c.name, title: t('edit'), text: '✎' }),
          el('button', { class: 'edu-iconbtn', type: 'button', 'data-act': 'del', 'aria-label': t('delete') + ' ' + c.name, title: t('delete'), text: '🗑' })))));
    });
    var ib = $('#itemBody'); ib.innerHTML = '';
    $('#noItems').hidden = items.length > 0;
    items.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }).forEach(function (it) {
      ib.appendChild(el('tr', { dataset: { id: it.id } },
        el('td', { class: 'nm no-i18n', dir: 'auto' }, el('strong', { text: it.name }), el('div', { class: 'tiny muted mono-in', dir: 'ltr', text: [it.hsn, it.unit].filter(Boolean).join(' · ') })),
        el('td', { class: 'num', text: it.rate !== '' ? '₹' + it.rate : '' }),
        el('td', { class: 'num', text: it.gst !== '' ? it.gst + '%' : '' }),
        el('td', { class: 'acts-cell' }, el('div', { class: 'm-acts' },
          el('button', { class: 'edu-iconbtn', type: 'button', 'data-act': 'edit', 'aria-label': t('edit') + ' ' + it.name, title: t('edit'), text: '✎' }),
          el('button', { class: 'edu-iconbtn', type: 'button', 'data-act': 'del', 'aria-label': t('delete') + ' ' + it.name, title: t('delete'), text: '🗑' })))));
    });
  }
  var MC = { name: $('#mcName'), gstin: $('#mcGstin'), state: $('#mcState'), phone: $('#mcPhone'), email: $('#mcEmail'), address: $('#mcAddr') };
  var MI = { name: $('#miName'), hsn: $('#miHsn'), unit: $('#miUnit'), rate: $('#miRate'), gst: $('#miGst'), cess: $('#miCess') };
  function clearCustForm() { editCust = null; Object.keys(MC).forEach(function (k) { MC[k].value = ''; }); $('#mcMsg').textContent = ''; }
  function clearItemForm() { editItem = null; Object.keys(MI).forEach(function (k) { MI[k].value = ''; }); MI.unit.value = 'NOS'; MI.gst.value = '18'; $('#miMsg').textContent = ''; }
  MC.gstin.addEventListener('input', function () {
    var r = checkGstin(MC.gstin.value), m = gstinMsg(r), box = $('#mcMsg');
    box.className = 'msg ' + m.cls; box.textContent = m.text;
    if (r.state === 'ok') MC.state.value = r.code;
  });
  $('#mcSave').addEventListener('click', function () {
    var rec = {}; Object.keys(MC).forEach(function (k) { rec[k] = String(MC[k].value).trim(); });
    rec.gstin = rec.gstin.toUpperCase();
    if (!rec.name) { $('#mcMsg').className = 'msg bad'; $('#mcMsg').textContent = t('warn_cust'); MC.name.focus(); return; }
    var ex = editCust ? customers.filter(function (c) { return c.id === editCust; })[0] : findCustomer(rec.name, rec.gstin);
    if (ex) Object.assign(ex, rec); else customers.push(Object.assign({ id: uid() }, rec));
    warnFull(store.set('customers', customers)); clearCustForm(); refreshLists(); EDU.toast(t('saved_local'));
  });
  $('#mcClear').addEventListener('click', clearCustForm);
  $('#custBody').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var id = b.closest('tr').dataset.id, c = customers.filter(function (x) { return x.id === id; })[0]; if (!c) return;
    if (b.dataset.act === 'use') { useCustomer(c); showTab('make'); $('#custName').focus(); }
    else if (b.dataset.act === 'edit') { editCust = id; Object.keys(MC).forEach(function (k) { MC[k].value = c[k] || ''; }); MC.name.focus(); }
    else if (b.dataset.act === 'del' && confirm(t('confirm_delete', { no: c.name }))) { customers = customers.filter(function (x) { return x.id !== id; }); store.set('customers', customers); refreshLists(); }
  });
  $('#miSave').addEventListener('click', function () {
    var rec = {}; Object.keys(MI).forEach(function (k) { rec[k] = String(MI[k].value).trim(); });
    rec.unit = rec.unit.toUpperCase();
    if (!rec.name) { $('#miMsg').className = 'msg bad'; $('#miMsg').textContent = t('warn_item_name'); MI.name.focus(); return; }
    rec.gst = pct(rec.gst); rec.cess = pct(rec.cess);
    var r = parseScaled(rec.rate, 100), g = parseScaled(rec.gst, 100);
    if ((r !== null && (r !== r || r < 0)) || (g !== null && (g !== g || g < 0 || g > 10000))) { $('#miMsg').className = 'msg bad'; $('#miMsg').textContent = t('err_item_num'); return; }
    var ex = editItem ? items.filter(function (x) { return x.id === editItem; })[0] : findItem(rec.name);
    if (ex) Object.assign(ex, rec); else items.push(Object.assign({ id: uid() }, rec));
    warnFull(store.set('items', items)); clearItemForm(); refreshLists(); EDU.toast(t('saved_local'));
  });
  $('#miClear').addEventListener('click', clearItemForm);
  $('#itemBody').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var id = b.closest('tr').dataset.id, it = items.filter(function (x) { return x.id === id; })[0]; if (!it) return;
    if (b.dataset.act === 'edit') { editItem = id; Object.keys(MI).forEach(function (k) { MI[k].value = it[k] || ''; }); MI.name.focus(); }
    else if (b.dataset.act === 'del' && confirm(t('confirm_delete', { no: it.name }))) { items = items.filter(function (x) { return x.id !== id; }); store.set('items', items); refreshLists(); }
  });
  function importCsv(kind) {
    EDU.pickFile('.csv,text/csv,text/plain').then(function (f) {
      if (!f) return null;
      return EDU.readText(f).then(function (txt) {
        /* a picture, PDF or Excel (.xlsx) file read as text is full of control characters: refuse it
           instead of filling the list with junk */
        var head = txt.slice(0, 4096), junk = (head.match(/�/g) || []).length;
        if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(head) || junk > head.length / 20) { EDU.toast(t('csv_bad'), 5000); return; }
        var rows = EDU.csv.parse(txt).map(function (r) { return r.map(function (v) { return String(v == null ? '' : v).replace(/^'(?=[=+\-@])/, ''); }); }), n = 0;
        rows.forEach(function (r, i) {
          var name = String(r[0] || '').trim();
          if (!name || (i === 0 && /^(name|item|customer|नाम)/i.test(name))) return;
          if (kind === 'items') {
            var rec = { name: name.slice(0, 160), hsn: str(r[1], 12).trim(), unit: str(r[2], 8).trim().toUpperCase(), rate: str(r[3], 20).trim(), gst: pct(str(r[4], 10)), cess: pct(str(r[5], 10)) };
            var ex = findItem(rec.name); if (ex) Object.assign(ex, rec); else items.push(Object.assign({ id: uid() }, rec)); n++;
          } else {
            var code = asciiDigits(str(r[2], 40)).trim(), g = str(r[1], 15).trim().toUpperCase();
            if (/^\d$/.test(code)) code = '0' + code;
            if (STATES.indexOf(code) < 0) code = checkGstin(g).state === 'ok' ? g.slice(0, 2) : '';
            var c = { name: name.slice(0, 120), gstin: g, state: code, address: str(r[3], 300).trim(), phone: str(r[4], 20).trim(), email: str(r[5], 80).trim() };
            var ec = findCustomer(c.name, c.gstin); if (ec) Object.assign(ec, c); else customers.push(Object.assign({ id: uid() }, c)); n++;
          }
        });
        warnFull(store.set(kind, kind === 'items' ? items : customers));
        refreshLists(); EDU.toast(t('imported_n', { n: n }));
      });
    }).catch(function () { EDU.toast(t('restore_bad')); });
  }
  $('#miImport').addEventListener('click', function () { importCsv('items'); });
  $('#mcImport').addEventListener('click', function () { importCsv('customers'); });
  $('#miExport').addEventListener('click', function () {
    var rows = [['name', 'hsn_sac', 'unit', 'rate', 'gst_percent', 'cess_percent']].concat(items.map(function (i) { return [cellText(i.name), i.hsn, i.unit, i.rate, i.gst, i.cess]; }));
    EDU.download('items.csv', EDU.csv.stringify(rows), 'text/csv');
  });
  $('#mcExport').addEventListener('click', function () {
    var rows = [['name', 'gstin', 'state_code', 'address', 'phone', 'email']].concat(customers.map(function (c) { return [cellText(c.name), c.gstin, c.state, cellText(c.address), cellText(c.phone), cellText(c.email)]; }));
    EDU.download('customers.csv', EDU.csv.stringify(rows), 'text/csv');
  });
  var remember = $('#remember');
  remember.addEventListener('change', function () { settings.remember = remember.checked; saveSettings(); });

  /* ================================================================ my business (profile) */
  var pfTimer = 0;
  function saveProfile() { clearTimeout(pfTimer); pfTimer = setTimeout(function () { pfTimer = 0; warnFull(store.set('profile', profile)); }, 200); }
  function fillProfile() {
    $$('[data-p]').forEach(function (f) { var k = f.dataset.p; if (f.type === 'checkbox') f.checked = !!profile[k]; else f.value = profile[k] || ''; });
    fillSelectStates($('#pfState')); $('#pfState').value = profile.state || '';
    $('#pfTerms').placeholder = t('sample_terms');
    renderThumbs(); profileMsgs(); renderPrefixes(); fillDocLang();
    remember.checked = settings.remember !== false;
    $('#sampleBanner').hidden = !profileEmpty();
  }
  function profileMsgs() {
    var r = checkGstin(profile.gstin), m = gstinMsg(r), box = $('#pfGstinMsg');
    var msgs = [];
    if (m.text) msgs.push(m.text);
    var pan = String(profile.pan || '').toUpperCase();
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) msgs.push(t('pan_bad'));
    else if (pan && r.state === 'ok' && pan !== r.pan) msgs.push(t('pan_mismatch'));
    box.className = 'msg ' + (r.state === 'ok' && msgs.length === 1 ? 'ok' : msgs.length ? 'bad' : '');
    box.textContent = msgs.join(' ');
    var bm = [], ifsc = String(profile.ifsc || '').toUpperCase();
    if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) bm.push(t('ifsc_bad'));
    if (String(profile.upi || '').trim() && !validUpi(profile.upi)) bm.push(t('upi_bad'));
    var bb = $('#pfBankMsg'); bb.className = 'msg bad'; bb.textContent = bm.join(' ');
    $('#pfGstin').classList.toggle('bad', r.state !== 'empty' && r.state !== 'ok');
    $('#pfUpi').classList.toggle('bad', !!String(profile.upi || '').trim() && !validUpi(profile.upi));
    $('#pfIfsc').classList.toggle('bad', !!ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc));
  }
  $('#p-profile').addEventListener('input', function (e) {
    var f = e.target, k = f.dataset.p; if (!k) return;
    var wasEmpty = profileEmpty();
    var v = f.type === 'checkbox' ? f.checked : f.value;
    if (/^(gstin|pan|ifsc|lut)$/.test(k)) v = String(v).toUpperCase().replace(/\s+/g, '');
    profile[k] = v;
    if (k === 'gstin') {
      var r = checkGstin(v);
      if (r.state === 'ok') {
        profile.state = r.code; $('#pfState').value = r.code;
        if (!profile.pan || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(profile.pan)) { profile.pan = r.pan; $('#pfPan').value = r.pan; }
      }
    }
    profileMsgs(); saveProfile();
    if (wasEmpty !== profileEmpty()) onSellerChanged(); else { changed({ keepSample: true, clean: !dirty }); }
    $('#sampleBanner').hidden = !profileEmpty();
  });
  $('#p-profile').addEventListener('change', function (e) {
    var f = e.target, k = f.dataset.p;
    if (k === 'state' || k === 'composition') { profile[k] = f.type === 'checkbox' ? f.checked : f.value; saveProfile(); onSellerChanged(); }
  });
  /* seller state changed: an untouched place of supply follows the customer; recompute everything */
  function onSellerChanged() {
    if (!draft.pos && !draft.posManual) { draft.pos = draft.cust.state || sellerState(); F.docPos.value = draft.pos; }
    if (draft.sample) { draft.terms = String(seller().terms || ''); F.docTerms.value = draft.terms; }
    changed({ keepSample: true, clean: !dirty });
  }
  function renderThumbs() {
    [['logo', '#logoThumb', '#logoDel'], ['sign', '#signThumb', '#signDel']].forEach(function (x) {
      var box = $(x[1]); box.innerHTML = '';
      if (profile[x[0]]) box.appendChild(el('img', { src: profile[x[0]], alt: '' }));
      $(x[2]).hidden = !profile[x[0]];
    });
  }
  function pickImage(key, maxW, maxH) {
    EDU.pickFile('image/png,image/jpeg,image/webp').then(function (f) {
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var img = new Image();
        img.onload = function () {
          var sc = Math.min(1, maxW / img.width, maxH / img.height), w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
          var c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          var data = c.toDataURL('image/png');
          if (data.length > 160000) data = c.toDataURL('image/jpeg', 0.85);
          profile[key] = data;
          if (warnFull(store.set('profile', profile))) { renderThumbs(); changed({ keepSample: true, clean: !dirty }); }
          else { profile[key] = ''; }
        };
        img.onerror = function () { EDU.toast(t('img_bad')); };
        img.src = String(rd.result);
      };
      rd.onerror = function () { EDU.toast(t('img_bad')); };
      rd.readAsDataURL(f);
    });
  }
  $('#logoPick').addEventListener('click', function () { pickImage('logo', 360, 180); });
  $('#signPick').addEventListener('click', function () { pickImage('sign', 360, 140); });
  $('#logoDel').addEventListener('click', function () { profile.logo = ''; store.set('profile', profile); renderThumbs(); changed({ keepSample: true, clean: !dirty }); });
  $('#signDel').addEventListener('click', function () { profile.sign = ''; store.set('profile', profile); renderThumbs(); changed({ keepSample: true, clean: !dirty }); });
  function renderPrefixes() {
    var g = $('#prefGrid'); g.innerHTML = '';
    TYPES.forEach(function (ty) {
      var id = 'pref-' + ty, inp = el('input', { type: 'text', id: id, class: 'mono-in up', dir: 'ltr', maxlength: '8', autocomplete: 'off', placeholder: PREFIX[ty], 'data-prefix': ty });
      inp.value = settings.prefixes[ty] || '';
      g.appendChild(el('label', { class: 'field', for: id }, el('span', { text: t('dt_' + ty) }), inp));
    });
  }
  $('#prefGrid').addEventListener('input', function (e) {
    var ty = e.target.dataset.prefix; if (!ty) return;
    settings.prefixes[ty] = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    saveSettings();
    if (draft.autoNo && draft.type === ty) { draft.no = nextNo(ty, draft.date, draft.id); F.docNo.value = draft.no; }
    changed({ keepSample: true, clean: !dirty });
  });
  var docLangSel = $('#docLang');
  function fillDocLang() {
    var nat = EDU.langInfo(EDU.lang).native;
    docLangSel.innerHTML = '';
    docLangSel.appendChild(el('option', { value: 'en', text: t('dl_en') }));
    if (EDU.lang !== 'en') {
      docLangSel.appendChild(el('option', { value: 'both', text: t('dl_both', { lang: nat }) }));
      docLangSel.appendChild(el('option', { value: 'ui', text: t('dl_ui', { lang: nat }) }));
    }
    docLangSel.value = EDU.lang === 'en' ? 'en' : settings.docLang;
    docLangSel.disabled = EDU.lang === 'en';
  }
  docLangSel.addEventListener('change', function () { settings.docLang = docLangSel.value; saveSettings(); renderPreview(); updateSummary(calc(draft)); });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('reset_confirm'))) return;
    ['profile', 'customers', 'items', 'docs', 'draft', 'dirty'].forEach(function (k) { store.remove(k); });
    profile = Object.assign({}, BLANK_PROFILE); customers = []; items = []; docs = [];
    dirty = false; draft = sampleDoc(EDU.lang);
    fillProfile(); refreshLists(); openDraft(draft); showTab('make');
  });

  /* ================================================================ language change + start */
  function fillStatic() {
    var ul = $('#uqcList'); ul.innerHTML = '';
    UQC.forEach(function (u) { ul.appendChild(el('option', { value: u[0], label: u[1] })); });
    var rl = $('#rateList'); rl.innerHTML = '';
    RATES.forEach(function (r) { rl.appendChild(el('option', { value: r, label: r + '%' })); });
    [F.custState, F.shipState, $('#mcState')].forEach(function (s) { fillSelectStates(s); });
  }
  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });
  fillStatic();
  fillProfile();
  refreshLists();
  clearItemForm();
  fillForm();
  showTab(currentTab);
  (function () { var R = calc(draft); updateLineAmounts(R); updateSummary(R); renderPreview(); })();
  window.addEventListener('load', fitPreview);
  if (window.ResizeObserver) new ResizeObserver(function () { fitPreview(); }).observe($('#sheet'));
  /* web fonts for Indian scripts arrive after the first paint: lay the pages out again with the real glyph widths */
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { if (currentTab === 'make') schedulePreview(); });

  EDU.onLang(function () {
    if (draft.sample) draft = sampleDoc(EDU.lang, draft);
    fillStatic();
    fillProfile();
    refreshLists();
    fillForm();
    var R = calc(draft); updateLineAmounts(R); updateSummary(R); renderPreview();
    if (currentTab === 'docs') renderDocs();
    store.set('draft', draft);
  });
})();
