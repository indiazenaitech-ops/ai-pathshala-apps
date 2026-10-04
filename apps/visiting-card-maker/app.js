/* Visiting Card Maker: designs a business card (front + back) in the browser, with a vCard / UPI / WhatsApp QR
 * made on the device (qr.js, no library), prints it 10-up on A4 with crop marks, exports a 300 dpi PNG for
 * WhatsApp and makes cards for a whole team from a CSV. Names, phone numbers and logos never leave the device
 * (saved only with EDU.store). */
(function () {
  'use strict';
  var SLUG = 'visiting-card-maker';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc;

  var TEMPLATES = ['classic', 'shop', 'clinic', 'minimal', 'bold', 'creative', 'elegant', 'split', 'tutor', 'services'];
  var DARK_FRONT = { bold: 1, elegant: 1 };
  var DARK_BACK = { shop: 1, bold: 1, split: 1, services: 1, creative: 1, elegant: 1 };
  var COLORS = ['#0b4f5c', '#9f1239', '#c2410c', '#15803d', '#1d4ed8', '#6d28d9', '#b7791f', '#111827'];
  var SIZES = { '89': [89, 51], '85': [85, 55] };            // mm: Indian standard 3.5 x 2 in, and the 85 x 55 card
  var BLEED = 3, MAX_SAVED = 12, MAX_TEAM = 300, PX_MM = 96 / 25.4, QUIET = 2, DPI = 300;
  var VPA_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  var SAMPLE = { phone: '+91 98765 43210', email: 'priya.sharma@example.com', gstin: '09ABCPS1234K1ZK', insta: '@sharma.electricals' };
  var SAMPLE_KEYS = ['name', 'desig', 'biz', 'tag', 'addr'];
  var CSV_HEAD = ['Name', 'Designation', 'Phone', 'Phone 2', 'WhatsApp', 'Email'];
  var CSV_ALIAS = {
    name: ['name', 'full name', 'employee', 'employee name', 'person', 'naam', 'नाम', 'নাম', 'નામ', 'ਨਾਮ', 'பெயர்', 'పేరు', 'ಹೆಸರು', 'പേര്', 'نام'],
    desig: ['designation', 'title', 'role', 'post', 'position', 'desig', 'job title', 'पद', 'पदनाम', 'হুদা', 'হোদা', 'પદ', 'ਪਦ', 'பதவி', 'హోదా', 'ಹುದ್ದೆ', 'തസ്തിക', 'عہدہ'],
    phone: ['phone', 'phone 1', 'phone1', 'mobile', 'mobile no', 'mobile number', 'contact', 'contact no', 'number', 'mob', 'tel', 'फ़ोन', 'फोन', 'मोबाइल', 'ফোন', 'મોબાઇલ', 'ਫ਼ੋਨ', 'தொலைபேசி', 'ఫోన్', 'ಫೋನ್', 'ഫോൺ', 'فون'],
    phone2: ['phone 2', 'phone2', 'alt phone', 'alternate', 'landline', 'office', 'office phone', 'second phone'],
    wa: ['whatsapp', 'whats app', 'wa', 'whatsapp no', 'whatsapp number', 'व्हाट्सऐप', 'व्हाट्सएप', 'واٹس ایپ'],
    email: ['email', 'e-mail', 'mail', 'email id', 'ईमेल', 'ইমেইল', 'ઇમેઇલ', 'ਈਮੇਲ', 'மின்னஞ்சல்', 'ఇమెయిల్', 'ಇಮೇಲ್', 'ഇമെയിൽ', 'ای میل']
  };
  var ICONS = {
    tel: '<path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/>',
    mail: '<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>',
    web: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3a15 15 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4a14 14 0 0 1 1.9 4h-3.8A14 14 0 0 1 12 4zM4.3 14a8 8 0 0 1 0-4h3.4a16 16 0 0 0 0 4H4.3zm.8 2h3a15 15 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.3-3.6A15 15 0 0 0 8.1 8zM12 20a14 14 0 0 1-1.9-4h3.8a14 14 0 0 1-1.9 4zm2.3-6H9.7a14 14 0 0 1 0-4h4.6a14 14 0 0 1 0 4zm.3 5.6a15 15 0 0 0 1.4-3.6h3a8 8 0 0 1-4.4 3.6zm1.7-5.6a16 16 0 0 0 0-4h3.4a8 8 0 0 1 0 4h-3.4z"/>',
    pin: '<path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>',
    wa: '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20z"/><path d="M8.6 7.5c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3l-2-.9c-.3-.1-.5-.2-.7.2l-.9 1.1c-.2.2-.3.2-.6.1a7 7 0 0 1-2.1-1.3 8 8 0 0 1-1.5-1.8c-.2-.3 0-.4.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.4-.5-.6-.5z"/>',
    insta: '<path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9zm4.5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm4.8-3.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z"/>',
    fb: '<path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/>'
  };
  function icon(name, cls) { return '<svg class="' + cls + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + ICONS[name] + '</svg>'; }

  /* ---------------- state (validated, so a broken store never crashes the app) ---------------- */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function str(v, max) { return typeof v === 'string' ? v.slice(0, max || 200) : ''; }
  function isLogo(v) { return typeof v === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(v) && v.length < 400000; }
  function langOk(c) { return EDU.LANGS.some(function (l) { return l.code === c; }); }
  function normCard(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var bl = raw.bl && typeof raw.bl === 'object' ? raw.bl : {};
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      sample: !!raw.sample,
      name: str(raw.name, 80), desig: str(raw.desig, 80), biz: str(raw.biz, 90), tag: str(raw.tag, 120),
      phone: str(raw.phone, 30), phone2: str(raw.phone2, 30), wa: str(raw.wa, 30), email: str(raw.email, 80), web: str(raw.web, 80),
      addr: str(raw.addr, 200), gstin: str(raw.gstin, 15), insta: str(raw.insta, 40), fb: str(raw.fb, 40),
      logo: isLogo(raw.logo) ? raw.logo : '', chip: raw.chip !== false,
      tpl: TEMPLATES.indexOf(raw.tpl) >= 0 ? raw.tpl : 'classic',
      color: EDU.clamp(Math.round(+raw.color) || 0, 0, COLORS.length - 1),
      size: raw.size === '85' ? '85' : '89',
      clang: langOk(raw.clang) ? raw.clang : 'auto',
      back: ['brand', 'bilingual', 'none'].indexOf(raw.back) >= 0 ? raw.back : 'brand',
      bl: { lang: langOk(bl.lang) ? bl.lang : (EDU.lang === 'en' ? 'hi' : 'en'), sample: bl.sample !== false,
        name: str(bl.name, 80), desig: str(bl.desig, 80), biz: str(bl.biz, 90), tag: str(bl.tag, 120), addr: str(bl.addr, 200) },
      qr: ['none', 'vcard', 'upi', 'wa'].indexOf(raw.qr) >= 0 ? raw.qr : 'vcard',
      qrSide: raw.qrSide === 'front' ? 'front' : 'back',
      upi: str(raw.upi, 100)
    };
  }
  function sampleCard() {
    return normCard({ sample: true, tpl: 'shop', phone: SAMPLE.phone, wa: SAMPLE.phone, email: SAMPLE.email, gstin: SAMPLE.gstin, insta: SAMPLE.insta });
  }
  function normRow(r) {
    r = r && typeof r === 'object' ? r : {};
    return { name: str(r.name, 80), desig: str(r.desig, 80), phone: str(r.phone, 30), phone2: str(r.phone2, 30), wa: str(r.wa, 30), email: str(r.email, 80) };
  }
  function loadState() {
    var s = store.get('state', {}) || {};
    if (typeof s !== 'object' || Array.isArray(s)) s = {};
    var pr = s.print && typeof s.print === 'object' ? s.print : {};
    var obj = function (x) { return x && typeof x === 'object'; };
    return {
      card: s.card ? normCard(s.card) : sampleCard(),
      saved: (Array.isArray(s.saved) ? s.saved : []).filter(obj).map(normCard).slice(0, MAX_SAVED),
      team: (Array.isArray(s.team) ? s.team : []).filter(obj).map(normRow).slice(0, MAX_TEAM),
      teamText: str(s.teamText, 40000),
      print: { backs: pr.backs !== false, marks: pr.marks !== false, bleed: !!pr.bleed }
    };
  }
  var state = loadState();
  var saveTimer = 0;
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); }
  function saveNow() { clearTimeout(saveTimer); if (store.set('state', state) === false) EDU.toast(t('store_full'), 5000); }
  window.addEventListener('pagehide', saveNow);

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- helpers ---------------- */
  var DIGIT_ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function asciiDigits(s) {                        // digits typed on an Indian-language or Urdu keyboard become 0-9
    s = String(s == null ? '' : s);
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var k = s.charCodeAt(i), d = -1;
      for (var j = 0; j < DIGIT_ZEROS.length; j++) if (k >= DIGIT_ZEROS[j] && k <= DIGIT_ZEROS[j] + 9) { d = k - DIGIT_ZEROS[j]; break; }
      out += d >= 0 ? String(d) : s.charAt(i);
    }
    return out;
  }
  function digits(s) { return asciiDigits(s).replace(/\D/g, ''); }
  function clean(s) { return String(s == null ? '' : s).replace(/[ \t]+/g, ' ').trim(); }
  function oneLine(s) { return clean(s).replace(/\s*\n\s*/g, ', '); }
  function latCls(text) { return /[^\x00-\x7F]/.test(text || '') ? '' : ' lat'; }
  function ts(key, L) { var S = window.APP_STRINGS || {}; return (S[L] && S[L][key]) || (S.en && S.en[key]) || key; }
  function cardLang(c) { return c.clang === 'auto' ? EDU.lang : c.clang; }
  function sampleText(L) { var o = {}; SAMPLE_KEYS.forEach(function (k) { o[k] = ts('sample_' + k, L); }); return o; }
  function fontStackFor(L) {
    var f = EDU.langInfo(L).font;
    return (f ? '"' + f + '", ' : '') + '"Noto Sans", system-ui, "Segoe UI", "Nirmala UI", Roboto, sans-serif';
  }
  var fontLinks = {};
  function ensureFont(L) {                         // the shell loads only the page language's font
    var f = EDU.langInfo(L).font;
    if (!f || fontLinks[f]) return;
    fontLinks[f] = 1;
    if (location.protocol === 'file:' && !navigator.onLine) return;
    if (EDU.langInfo(EDU.lang).font === f) return;
    document.head.appendChild(el('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;600;700&display=swap' }));
  }
  /* Indian mobile number -> international digits for wa.me (10 digits = +91) */
  function waNumber(raw) {
    raw = String(raw || '').trim();
    var d = digits(raw);
    if (d.length === 10 && /^[6-9]/.test(d)) return '91' + d;
    if (d.length === 11 && d.charAt(0) === '0') return '91' + d.slice(1);
    if (d.length === 12 && d.slice(0, 2) === '91') return d;
    if (raw.charAt(0) === '+' && d.length >= 8 && d.length <= 15) return d;
    return '';
  }
  function telVal(raw) { raw = String(raw || '').trim(); var d = raw.replace(/[^\d+]/g, '').replace(/(.)\+/g, '$1'); return digits(d).length >= 6 ? d : ''; }
  function withScheme(u) { return /^[a-z][a-z0-9+.-]*:\/\//i.test(u) ? u : 'https://' + u; }
  /* GSTIN: 2-digit state, PAN, entity number, Z, check character (mod-36 checksum) */
  var B36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function gstinOk(g) {
    g = String(g || '').toUpperCase().replace(/\s+/g, '');
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return false;
    var sum = 0;
    for (var i = 0; i < 14; i++) { var p = B36.indexOf(g.charAt(i)) * (i % 2 ? 2 : 1); sum += Math.floor(p / 36) + p % 36; }
    return B36.charAt((36 - sum % 36) % 36) === g.charAt(14);
  }

  /* ---------------- QR payloads ---------------- */
  function vEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, function (m) { return '\\' + m; }); }
  /* vCard 3.0, UTF-8: every phone's contact app imports it */
  function vcard(c) {
    var name = clean(c.name), L = ['BEGIN:VCARD', 'VERSION:3.0', 'N:;' + vEsc(name) + ';;;', 'FN:' + vEsc(name)];
    if (clean(c.biz)) L.push('ORG:' + vEsc(clean(c.biz)));
    if (clean(c.desig)) L.push('TITLE:' + vEsc(clean(c.desig)));
    var p1 = telVal(c.phone), p2 = telVal(c.phone2), w = telVal(c.wa);
    if (p1) L.push('TEL;TYPE=CELL,VOICE:' + p1);
    if (p2 && p2 !== p1) L.push('TEL;TYPE=WORK,VOICE:' + p2);
    if (w && w !== p1 && w !== p2) L.push('TEL;TYPE=CELL:' + w);
    if (clean(c.email)) L.push('EMAIL;TYPE=INTERNET:' + clean(c.email));
    if (clean(c.web)) L.push('URL:' + withScheme(clean(c.web)));
    if (clean(c.addr)) L.push('ADR;TYPE=WORK:;;' + vEsc(oneLine(c.addr)) + ';;;;');
    var notes = [];
    if (clean(c.gstin)) notes.push('GSTIN ' + clean(c.gstin).toUpperCase());
    if (clean(c.insta)) notes.push('Instagram ' + clean(c.insta));
    if (clean(c.fb)) notes.push('Facebook ' + clean(c.fb));
    if (notes.length) L.push('NOTE:' + vEsc(notes.join('\n')));
    L.push('END:VCARD');
    return L.join('\r\n');
  }
  function qrInfo(c) {
    var r = { type: c.qr, payload: '', q: null, warn: '' };
    if (c.qr === 'none') return r;
    if (c.qr === 'vcard') {
      if (!clean(c.name)) { r.warn = t('vcard_need_name'); return r; }
      r.payload = vcard(c);
    } else if (c.qr === 'upi') {
      var vpa = clean(c.upi).toLowerCase();
      if (!VPA_RE.test(vpa)) { r.warn = t('upi_bad'); return r; }
      var pn = clean(c.biz) || clean(c.name);
      r.payload = 'upi://pay?pa=' + vpa + (pn ? '&pn=' + encodeURIComponent(pn) : '') + '&cu=INR';
    } else {
      var n = waNumber(c.wa || c.phone);
      if (!n) { r.warn = t('wa_bad'); return r; }
      r.payload = 'https://wa.me/' + n;
    }
    var q = QRGen.encode(r.payload, 'M');
    if (q.ok && q.size > 57 && c.qr === 'vcard') { var q2 = QRGen.encode(r.payload, 'L'); if (q2.ok) q = q2; }   // a long vCard: fewer squares beat more error correction
    if (!q.ok) { r.warn = t('qr_dense'); r.payload = ''; return r; }
    r.q = q;
    if (q.size > 65) r.warn = t('qr_dense');
    return r;
  }
  function qrSvg(q) {
    var n = q.size, total = n + 2 * QUIET, d = '';
    for (var y = 0; y < n; y++) {
      var x = 0;
      while (x < n) {
        if (q.modules[y][x]) { var x0 = x; while (x < n && q.modules[y][x]) x++; d += 'M' + (x0 + QUIET) + ' ' + (y + QUIET) + 'h' + (x - x0) + 'v1h-' + (x - x0) + 'z'; }
        else x++;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges" aria-hidden="true"><rect width="' + total + '" height="' + total + '" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>';
  }

  /* ---------------- one face of a card (DOM, sized in cqw so preview = print = PNG) ---------------- */
  function faceData(c, side) {
    var L = cardLang(c), src = c;
    if (side === 'back' && c.back === 'bilingual') { L = c.bl.lang; src = c.bl; }
    return { L: L, dir: EDU.langInfo(L).dir, name: clean(src.name), desig: clean(src.desig), biz: clean(src.biz), tag: clean(src.tag), addr: clean(src.addr),
      phone: clean(c.phone), phone2: clean(c.phone2), wa: clean(c.wa), email: clean(c.email), web: clean(c.web),
      gstin: clean(c.gstin).toUpperCase(), insta: clean(c.insta), fb: clean(c.fb) };
  }
  function textEl(cls, text) { return text ? el('div', { class: cls + latCls(text), text: text, dir: 'auto' }) : null; }
  function line(ic, text, cls, extraHtml, native) {
    var ln = el('div', { class: 'vc-line' + (cls ? ' ' + cls : '') });
    ln.innerHTML = icon(ic, 'ic');
    ln.appendChild(el('span', { class: native ? latCls(text).trim() : 'ltr', text: text, dir: native ? 'auto' : 'ltr' }));
    if (extraHtml) ln.insertAdjacentHTML('beforeend', extraHtml);
    return ln;
  }
  function qrEl(qi, L) {
    return el('div', { class: 'vc-qr' }, el('div', { class: 'qrbox', html: qrSvg(qi.q) }), el('div', { class: 'qrtxt', text: ts('c_scan_' + qi.type, L) }));
  }
  function makeFace(c, side, qi) {
    var d = faceData(c, side), isBack = side === 'back', brand = isBack && c.back === 'brand';
    var qrSide = c.back === 'none' ? 'front' : c.qrSide, qr = qi.q && qrSide === side ? qi : null;
    var dark = brand ? DARK_BACK[c.tpl] : DARK_FRONT[c.tpl];   // a bilingual back uses the front layout (white card), so only the brand back is dark
    var node = el('div', { class: 'vc s' + c.size + ' tpl-' + c.tpl + (brand ? ' bk' : '') + (c.chip ? ' chip' : '') + (qr ? ' has-qr' : '') + (dark ? ' on-dark' : ''),
      lang: d.L, dir: d.dir, style: { '--c': COLORS[c.color], '--cfont': fontStackFor(d.L) } });
    var logo = c.logo ? el('div', { class: 'vc-logo' }, el('img', { src: c.logo, alt: '' })) : null;
    var head = el('div', { class: 'vc-head' }, textEl('vc-biz', d.biz), textEl('vc-tag', d.tag));
    if (brand) {
      node.appendChild(el('div', { class: 'vc-brand' }, logo, head, d.web ? el('div', { class: 'vc-web ltr', text: d.web }) : null));
      if (qr) node.appendChild(qrEl(qr, d.L));
      return node;
    }
    node.appendChild(el('div', { class: 'vc-brand' }, logo, head));
    node.appendChild(el('div', { class: 'vc-who' }, textEl('vc-name', d.name), textEl('vc-desig', d.desig)));
    var info = el('div', { class: 'vc-info' }), waSame = d.wa && digits(d.wa) === digits(d.phone);
    if (d.phone) info.appendChild(line('tel', d.phone, 'tel', waSame ? icon('wa', 'wa-ic') : ''));
    if (d.phone2) info.appendChild(line('tel', d.phone2, ''));
    if (d.wa && !waSame) info.appendChild(line('wa', d.wa, ''));
    if (d.email) info.appendChild(line('mail', d.email, ''));
    if (d.web) info.appendChild(line('web', d.web, ''));
    if (d.addr) info.appendChild(line('pin', oneLine(d.addr), 'addr', '', true));
    var foot = [];
    if (d.gstin) foot.push(el('span', { class: 'ltr' }, el('b', { text: ts('c_gstin', d.L) + ' ' }), d.gstin));
    if (d.insta) foot.push(el('span', { class: 'ltr', html: icon('insta', 'ic') + esc(d.insta) }));
    if (d.fb) foot.push(el('span', { class: 'ltr', html: icon('fb', 'ic') + esc(d.fb) }));
    if (foot.length) info.appendChild(el('div', { class: 'vc-foot' }, foot));
    node.appendChild(info);
    if (qr) node.appendChild(qrEl(qr, d.L));
    return node;
  }

  /* shrink the text step by step (--fs) until nothing overflows the card; measured at the real printed size.
   * Below 0.8 the card goes "tight": the QR caption is dropped and the logo and QR get a little smaller (they don't
   * scale with the text, so a long Hindi name next to a logo band and a QR could never fit otherwise). If it still
   * overflows at the floor the face is marked "cut" and the user gets a clear warning. */
  var FS_TIGHT = 0.8, FS_MIN = 0.5;
  var measureEl = null;
  function measureBox() {
    if (!measureEl) { measureEl = el('div', { class: 'measure-wrap no-i18n', 'aria-hidden': 'true' }); document.body.appendChild(measureEl); }
    return measureEl;
  }
  function shrinkLoop(node, fs) {
    function over() { return node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1; }
    node.style.setProperty('--fs', String(fs));
    while (over() && fs > FS_MIN) {
      if (fs <= FS_TIGHT && !node.classList.contains('tight')) { node.classList.add('tight'); continue; }
      fs = Math.round((fs - 0.05) * 100) / 100;
      node.style.setProperty('--fs', String(fs));
    }
    node.classList.toggle('cut', over());
    node.dataset.fs = fs;
    node.dataset.cut = over() ? '1' : '';
    return fs;
  }
  function fitFace(node, wPx, hPx) {
    var box = measureBox();
    box.style.width = wPx + 'px';                   // the box is the query container, so 1cqw = wPx / 100
    box.appendChild(node);
    node.style.height = hPx + 'px';
    node.classList.remove('tight', 'cut');
    var fs = shrinkLoop(node, 1);
    node.style.height = '';
    box.removeChild(node);
    return fs;
  }
  /* text wraps a little differently at each pixel size, so the preview is checked again at its own width */
  function refit(node) { return shrinkLoop(node, +node.dataset.fs || 1); }

  /* ---------------- the card being shown: your own, or one person from the team list ---------------- */
  var teamIdx = -1, cur = null, curQr = null;
  function teamCard(row) {
    var c = normCard(Object.assign({}, state.card, { id: 'team', sample: false, name: row.name, desig: row.desig, phone: row.phone, phone2: row.phone2, wa: row.wa, email: row.email }));
    c.bl = Object.assign({}, state.card.bl, { sample: false, name: row.name, desig: row.desig });
    return c;
  }
  function activeCard() { return teamIdx >= 0 && state.team[teamIdx] ? teamCard(state.team[teamIdx]) : state.card; }
  /* an untouched sample card shows the sample text in the card language; the back keeps sample text only while the front is a sample */
  function syncSample() {
    var c = state.card;
    if (c.sample) { var s = sampleText(cardLang(c)); SAMPLE_KEYS.forEach(function (k) { c[k] = s[k]; }); }
    if (c.bl.sample) {
      if (c.sample) { var b = sampleText(c.bl.lang); SAMPLE_KEYS.forEach(function (k) { c.bl[k] = b[k]; }); }
      else { SAMPLE_KEYS.forEach(function (k) { c.bl[k] = ''; }); c.bl.sample = false; }
    }
  }

  function show(id, on, text) { var n = $(id); n.hidden = !on; if (text !== undefined) n.textContent = text || ''; }
  function render() {
    syncSample();
    var c = activeCard(), qi = qrInfo(c);
    cur = c; curQr = qi;
    var W = SIZES[c.size][0], H = SIZES[c.size][1], pw = W * PX_MM, ph = H * PX_MM;
    var front = makeFace(c, 'front', qi), fsF = fitFace(front, pw, ph);
    if (c.sample) { front.classList.add('sample-mark'); front.dataset.sample = t('sample_mark'); }
    front.setAttribute('role', 'img');
    front.setAttribute('aria-label', t('card_alt', { name: c.name || c.biz || '' }));
    front.dataset.qr = qi.q && (c.back === 'none' || c.qrSide === 'front') ? qi.q.size : 0;
    $('#front').innerHTML = ''; $('#front').appendChild(front);
    fsF = Math.min(fsF, refit(front));
    var hasBack = c.back !== 'none', fsB = 1;
    $('#backFace').hidden = !hasBack;
    $('#btnPngBack').hidden = !hasBack;
    $('#back').innerHTML = '';
    if (hasBack) {
      var back = makeFace(c, 'back', qi);
      fsB = fitFace(back, pw, ph);
      if (c.back === 'bilingual' && c.bl.sample) { back.classList.add('sample-mark'); back.dataset.sample = t('sample_mark'); }
      back.setAttribute('role', 'img');
      back.setAttribute('aria-label', t('card_alt', { name: c.name || c.biz || '' }));
      back.dataset.qr = qi.q && c.qrSide === 'back' ? qi.q.size : 0;
      $('#back').appendChild(back);
      fsB = Math.min(fsB, refit(back));
    }
    var cut = !!(front.dataset.cut || (hasBack && $('#back .vc') && $('#back .vc').dataset.cut));
    $('#fitWarn').textContent = t(cut ? 'fit_cut' : 'fit_warn');
    $('#fitWarn').hidden = Math.min(fsF, fsB) >= FS_TIGHT && !cut;
    $('#fitWarn').classList.toggle('danger', cut); $('#fitWarn').classList.toggle('warning', !cut);
    show('#qrWarn', !!qi.warn, qi.warn);
    $('#qrPayload').textContent = qi.payload || t('qr_none_msg');
    $('#qrSideField').hidden = c.qr === 'none' || !hasBack;
    $('#upiField').hidden = c.qr !== 'upi';
    $('#blBox').hidden = state.card.back !== 'bilingual';
    $('#chipRow').hidden = !state.card.logo;
    $('#sampleNote').hidden = !state.card.sample || teamIdx >= 0;
    $('#btnTeamMe').hidden = teamIdx < 0;
    var g = clean(state.card.gstin);
    $('#gstinWarn').hidden = !g || gstinOk(g);
    $('#sizeBadge').textContent = W + ' × ' + H + ' mm';
    syncSegs();
    printInfo();
  }
  var rTimer = 0;
  function renderSoon() { clearTimeout(rTimer); rTimer = setTimeout(render, 30); }

  /* ---------------- print: A4 sheets, 2 x 5 cards (2 x 4 with bleed), crop marks, backs mirrored for duplex ---------------- */
  function layout(size, bleed) {
    var W = SIZES[size][0], H = SIZES[size][1], b = bleed ? BLEED : 0, bw = W + 2 * b, bh = H + 2 * b;
    var cols = 2, rows = bleed ? 4 : 5, g = bleed ? 5 : (size === '89' ? 5 : 2.5);
    var gw = cols * bw + (cols - 1) * g, gh = rows * bh + (rows - 1) * g;
    return { W: W, H: H, b: b, bw: bw, bh: bh, cols: cols, rows: rows, g: g, ox: (210 - gw) / 2, oy: (297 - gh) / 2, per: cols * rows };
  }
  function cropMarks(x, y, Lo) {                   // x, y = trim corner in mm; marks start outside the bleed
    var W = Lo.W, H = Lo.H, gap = Lo.b + 0.5, mk = Math.min(3, Lo.g + 2 * Lo.b - 0.6), d = '';
    function h(x1, x2, yy) { d += 'M' + x1.toFixed(2) + ' ' + yy.toFixed(2) + 'H' + x2.toFixed(2); }
    function v(xx, y1, y2) { d += 'M' + xx.toFixed(2) + ' ' + y1.toFixed(2) + 'V' + y2.toFixed(2); }
    [y, y + H].forEach(function (yy) { h(x - gap - mk, x - gap, yy); h(x + W + gap, x + W + gap + mk, yy); });
    [x, x + W].forEach(function (xx) { v(xx, y - gap - mk, y - gap); v(xx, y + H + gap, y + H + gap + mk); });
    return d;
  }
  function page(chunk, side, Lo) {
    var pg = el('div', { class: 'pg' }), d = '';
    chunk.forEach(function (x, i) {
      var r = Math.floor(i / Lo.cols), c = i % Lo.cols;
      if (side === 'b') c = Lo.cols - 1 - c;            // mirrored, so the backs line up when the sheet is flipped on its long edge
      var xmm = Lo.ox + c * (Lo.bw + Lo.g), ymm = Lo.oy + r * (Lo.bh + Lo.g);
      if (x[side]) pg.appendChild(el('div', { class: 'slot', style: { left: xmm + 'mm', top: ymm + 'mm', width: Lo.bw + 'mm', height: Lo.bh + 'mm' } }, x[side]));
      d += cropMarks(xmm + Lo.b, ymm + Lo.b, Lo);
    });
    if (state.print.marks) pg.insertAdjacentHTML('beforeend', '<svg class="marks" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" aria-hidden="true"><path d="' + d + '" stroke="#000" stroke-width=".2" fill="none"/></svg>');
    return pg;
  }
  function buildPrint(cards) {
    var root = $('#printRoot');
    root.innerHTML = '';
    if (!cards.length) return;
    var Lo = layout(cards[0].size, state.print.bleed), pw = Lo.bw * PX_MM, ph = Lo.bh * PX_MM;
    var faces = cards.map(function (c) {
      var qi = qrInfo(c), f = makeFace(c, 'front', qi), b = null;
      fitFace(f, pw, ph);
      if (c.back !== 'none' && state.print.backs) { b = makeFace(c, 'back', qi); fitFace(b, pw, ph); }
      return { f: f, b: b };
    });
    for (var p = 0; p < faces.length; p += Lo.per) {
      var chunk = faces.slice(p, p + Lo.per);
      root.appendChild(page(chunk, 'f', Lo));
      if (chunk.some(function (x) { return x.b; })) root.appendChild(page(chunk, 'b', Lo));
    }
    root.dataset.cards = cards.length;
  }
  function sheetCopies() { var c = activeCard(), Lo = layout(c.size, state.print.bleed), out = []; for (var i = 0; i < Lo.per; i++) out.push(c); return out; }
  function teamCards() { return state.team.map(teamCard); }
  var printMode = 'single', printBuilt = false;
  function printInfo() {
    var c = activeCard(), Lo = layout(c.size, state.print.bleed), pages = c.back !== 'none' && state.print.backs ? 2 : 1;
    $('#printInfo').textContent = t('print_info', { n: EDU.fmt(Lo.per), p: EDU.fmt(pages) });
    var n = state.team.length, tp = Math.ceil(n / Lo.per) * pages;
    $('#teamCount').textContent = n ? t('team_count', { n: EDU.fmt(n), p: EDU.fmt(tp) }) : '';
    $('#btnTeamPrint').disabled = !n;
  }
  function doPrint(mode) {
    printMode = mode;
    buildPrint(mode === 'team' ? teamCards() : sheetCopies());
    printBuilt = true;
    window.print();
    setTimeout(function () { printBuilt = false; printMode = 'single'; }, 2000);
  }
  window.addEventListener('beforeprint', function () { if (!printBuilt) buildPrint(printMode === 'team' ? teamCards() : sheetCopies()); });
  window.addEventListener('afterprint', function () { printBuilt = false; printMode = 'single'; });
  $('#btnPrint').addEventListener('click', function () { doPrint('single'); });
  $('#btnTeamPrint').addEventListener('click', function () { if (state.team.length) doPrint('team'); });

  /* ---------------- PNG at 300 dpi: the card's HTML is drawn through an SVG image onto a canvas ---------------- */
  var fontCache = {};
  function blobToDataUrl(b) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result)); }; r.onerror = rej; r.readAsDataURL(b); }); }
  /* best effort: embed the card language's web font so the PNG matches the screen; falls back to the system font offline */
  function fontCss(L) {
    var f = EDU.langInfo(L).font;
    if (!f || !window.fetch || !navigator.onLine) return Promise.resolve('');
    if (fontCache[f] !== undefined) return Promise.resolve(fontCache[f]);
    var cssUrl = 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;600;700&display=swap';
    var work = fetch(cssUrl).then(function (r) { return r.ok ? r.text() : ''; }).then(function (css) {
      var SKIP = /\/\*\s*(latin-ext|cyrillic(-ext)?|greek(-ext)?|vietnamese)\s*\*\//;
      var blocks = css.split(/(?=\/\*[^*]*\*\/\s*@font-face)/).filter(function (b) { return /@font-face/.test(b) && !SKIP.test(b); });
      var urls = [];
      blocks.join('').replace(/url\((https:[^)]+)\)/g, function (m, u) { if (urls.indexOf(u) < 0) urls.push(u); return m; });
      return Promise.all(urls.map(function (u) { return fetch(u).then(function (r) { return r.blob(); }).then(blobToDataUrl).catch(function () { return ''; }); })).then(function (datas) {
        var out = blocks.join('\n').replace(/url\((https:[^)]+)\)/g, function (m, u) { var d = datas[urls.indexOf(u)]; return d ? 'url(' + d + ')' : m; });
        fontCache[f] = out;
        return out;
      });
    }).catch(function () { return ''; });
    return Promise.race([work, new Promise(function (res) { setTimeout(function () { res(''); }, 8000); })]);
  }
  function exportPng(side) {
    var c = cur, qi = curQr;
    if (!c || (side === 'back' && c.back === 'none')) return;
    var W = SIZES[c.size][0], H = SIZES[c.size][1], pw = Math.round(W / 25.4 * DPI), ph = Math.round(H / 25.4 * DPI);
    var node = makeFace(c, side, qi);
    fitFace(node, W * PX_MM, H * PX_MM);
    node.style.height = ph + 'px';
    var btn = $(side === 'back' ? '#btnPngBack' : '#btnPngFront');
    btn.disabled = true;
    var L = faceData(c, side).L;
    fontCss(L).then(function (fc) {
      var css = $('#cardCss').textContent + '\n' + fc;
      var xml = new XMLSerializer().serializeToString(node);
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + pw + '" height="' + ph + '"><foreignObject width="100%" height="100%">' +
        '<div xmlns="http://www.w3.org/1999/xhtml" class="vc-box" style="width:' + pw + 'px;height:' + ph + 'px;margin:0;padding:0"><style>' + css.replace(/<\/style/gi, '') + '</style>' + xml + '</div></foreignObject></svg>';
      return new Promise(function (res, rej) {
        var img = new Image();
        img.onload = function () {
          try {
            var cv = document.createElement('canvas'); cv.width = pw; cv.height = ph;
            var ctx = cv.getContext('2d');
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, pw, ph);
            ctx.drawImage(img, 0, 0, pw, ph);
            cv.toDataURL('image/png');                 // throws if the canvas is tainted
            res(cv);
          } catch (e) { rej(e); }
        };
        img.onerror = function () { rej(new Error('svg')); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      });
    }).then(function (cv) {
      EDU.downloadCanvas(cv, fileName(c, side));
      EDU.toast(t('png_done', { w: EDU.fmt(pw), h: EDU.fmt(ph) }));
    }).catch(function () { EDU.toast(t('png_fail'), 6000); }).then(function () { btn.disabled = false; });
  }
  function fileName(c, side) {
    var base = String(c.name || c.biz || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return 'visiting-card-' + (base ? base + '-' : '') + side + '.png';      // a Hindi or Tamil name has no Latin letters: visiting-card-front.png
  }
  $('#btnPngFront').addEventListener('click', function () { exportPng('front'); });
  $('#btnPngBack').addEventListener('click', function () { exportPng('back'); });

  /* ---------------- inputs ---------------- */
  var FIELDS = { fName: 'name', fDesig: 'desig', fBiz: 'biz', fTag: 'tag', fPhone: 'phone', fPhone2: 'phone2', fWa: 'wa', fEmail: 'email', fWeb: 'web', fAddr: 'addr', fGstin: 'gstin', fInsta: 'insta', fFb: 'fb', fUpi: 'upi' };
  var BL_FIELDS = { bName: 'name', bDesig: 'desig', bBiz: 'biz', bTag: 'tag', bAddr: 'addr' };
  function syncInputs() {
    var c = state.card;
    Object.keys(FIELDS).forEach(function (id) { $('#' + id).value = c[FIELDS[id]]; });
    Object.keys(BL_FIELDS).forEach(function (id) { $('#' + id).value = c.bl[BL_FIELDS[id]]; });
    $('#cLang').value = c.clang;
    $('#blLang').value = c.bl.lang;
    $('#logoChip').checked = c.chip;
    var lp = $('#logoPrev');
    lp.hidden = !c.logo; if (c.logo) lp.src = c.logo; else lp.removeAttribute('src');
    $('#btnLogoDel').hidden = !c.logo;
    $('#optBacks').checked = state.print.backs;
    $('#optMarks').checked = state.print.marks;
    $('#optBleed').checked = state.print.bleed;
    $('#teamCsv').value = state.teamText;
  }
  function syncSegs() {
    var c = state.card;
    TEMPLATES.forEach(function (id) { $('#tp-' + id).setAttribute('aria-pressed', String(c.tpl === id)); });
    $$('#swatches .swatch').forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === c.color)); });
    $$('#segSize button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === c.size)); });
    $$('#segBack button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === c.back)); });
    $$('#segQr button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === c.qr)); });
    $$('#segQrSide button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === c.qrSide)); });
  }
  function leaveTeamPreview() { if (teamIdx >= 0) { teamIdx = -1; renderTeam(); } }
  Object.keys(FIELDS).forEach(function (id) {
    $('#' + id).addEventListener('input', function () {
      var k = FIELDS[id];
      state.card[k] = this.value;
      if (SAMPLE_KEYS.indexOf(k) >= 0 && state.card.sample) {   // typing your own text turns the sample into your card
        state.card.sample = false;
        if (state.card.phone === SAMPLE.phone) { state.card.phone = ''; $('#fPhone').value = ''; }
        if (state.card.wa === SAMPLE.phone) { state.card.wa = ''; $('#fWa').value = ''; }
        if (state.card.email === SAMPLE.email) { state.card.email = ''; $('#fEmail').value = ''; }
        if (state.card.gstin === SAMPLE.gstin) { state.card.gstin = ''; $('#fGstin').value = ''; }
        if (state.card.insta === SAMPLE.insta) { state.card.insta = ''; $('#fInsta').value = ''; }
      }
      leaveTeamPreview(); saveSoon(); renderSoon();
    });
  });
  Object.keys(BL_FIELDS).forEach(function (id) {
    $('#' + id).addEventListener('input', function () { state.card.bl[BL_FIELDS[id]] = this.value; state.card.bl.sample = false; leaveTeamPreview(); saveSoon(); renderSoon(); });
  });
  $('#fGstin').addEventListener('blur', function () { var v = clean(this.value).toUpperCase(); if (v !== this.value) { this.value = v; state.card.gstin = v; saveSoon(); render(); } });
  $('#fUpi').addEventListener('blur', function () { var v = clean(this.value).toLowerCase(); if (v !== this.value) { this.value = v; state.card.upi = v; saveSoon(); render(); } });
  function segClick(sel, fn) { $$(sel + ' button').forEach(function (b) { b.addEventListener('click', function () { fn(b.dataset.v); leaveTeamPreview(); saveSoon(); render(); }); }); }
  segClick('#segSize', function (v) { state.card.size = v; });
  segClick('#segQr', function (v) { state.card.qr = v; if (v === 'upi') setTimeout(function () { $('#fUpi').focus(); }, 50); });
  segClick('#segQrSide', function (v) { state.card.qrSide = v; });
  segClick('#segBack', function (v) {
    state.card.back = v;
    if (v === 'bilingual' && state.card.bl.lang === cardLang(state.card)) { state.card.bl.lang = otherLang(cardLang(state.card)); $('#blLang').value = state.card.bl.lang; }
    if (v === 'bilingual' && !state.card.sample && !state.card.bl.sample && !SAMPLE_KEYS.some(function (k) { return state.card.bl[k]; })) setTimeout(function () { $('#bName').focus(); }, 50);
    ensureFont(state.card.bl.lang);
  });
  /* a bilingual card needs two different languages: when the front is changed to the back's language, the back flips
   * to the page language (a Hindi page: English front -> Hindi back), or to Hindi / English */
  function otherLang(L) { return EDU.lang !== L ? EDU.lang : (L === 'hi' ? 'en' : 'hi'); }
  $('#cLang').addEventListener('change', function () {
    state.card.clang = this.value;
    if (state.card.bl.lang === cardLang(state.card)) { state.card.bl.lang = otherLang(cardLang(state.card)); $('#blLang').value = state.card.bl.lang; ensureFont(state.card.bl.lang); }
    ensureFont(cardLang(state.card)); leaveTeamPreview(); saveSoon(); render();
  });
  $('#blLang').addEventListener('change', function () { state.card.bl.lang = this.value; ensureFont(this.value); leaveTeamPreview(); saveSoon(); render(); });
  $('#logoChip').addEventListener('change', function () { state.card.chip = this.checked; saveSoon(); render(); });
  ['optBacks', 'optMarks', 'optBleed'].forEach(function (id) {
    $('#' + id).addEventListener('change', function () { state.print[id.slice(3).toLowerCase()] = this.checked; saveSoon(); render(); });
  });
  function buildTemplates() {
    var box = $('#tpls'); box.innerHTML = '';
    TEMPLATES.forEach(function (id) {
      box.appendChild(el('button', { type: 'button', class: 'tp', id: 'tp-' + id, 'aria-pressed': String(state.card.tpl === id), style: { '--c': COLORS[state.card.color] },
        onclick: function () { state.card.tpl = id; leaveTeamPreview(); saveSoon(); render(); } },
        el('span', { class: 'mini m-' + id, 'aria-hidden': 'true' }, el('i')), el('span', { i18n: 'tpl_' + id })));
    });
  }
  function buildSwatches() {
    var box = $('#swatches'); box.innerHTML = '';
    COLORS.forEach(function (c, i) {
      box.appendChild(el('button', { type: 'button', class: 'swatch', id: 'color-' + i, style: { background: c }, 'aria-pressed': String(i === state.card.color),
        'aria-label': t('color_n', { n: EDU.fmt(i + 1) }), title: t('color_n', { n: EDU.fmt(i + 1) }),
        onclick: function () { state.card.color = i; $$('#tpls .tp').forEach(function (b) { b.style.setProperty('--c', c); }); leaveTeamPreview(); saveSoon(); render(); } }));
    });
  }
  function buildLangSelects() {
    var sel = $('#cLang'); sel.innerHTML = '';
    sel.appendChild(el('option', { value: 'auto', text: t('clang_auto') }));
    EDU.LANGS.forEach(function (l) { sel.appendChild(el('option', { value: l.code, text: l.native })); });
    sel.value = state.card.clang;
    var bl = $('#blLang'); bl.innerHTML = '';
    EDU.LANGS.forEach(function (l) { bl.appendChild(el('option', { value: l.code, text: l.native })); });
    bl.value = state.card.bl.lang;
  }

  /* ---------------- logo (read and shrunk on the device, never uploaded) ---------------- */
  $('#btnLogo').addEventListener('click', function () {
    EDU.pickFile('image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml').then(function (file) {
      if (!file) return;
      if (!/^image\//.test(file.type || '') || file.size > 15 * 1024 * 1024) { EDU.toast(t('logo_bad')); return; }
      var fr = new FileReader();
      fr.onerror = function () { EDU.toast(t('logo_bad')); };
      fr.onload = function () {
        var im = new Image();
        im.onerror = function () { EDU.toast(t('logo_bad')); };
        im.onload = function () {
          var k = Math.min(1, 480 / Math.max(im.width || 1, im.height || 1)), w = Math.max(1, Math.round((im.width || 1) * k)), h = Math.max(1, Math.round((im.height || 1) * k));
          var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          var cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, w, h);
          var url = cv.toDataURL('image/png');                     // PNG keeps a transparent background
          if (url.length > 300000) { cx.globalCompositeOperation = 'destination-over'; cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); url = cv.toDataURL('image/jpeg', 0.86); }
          state.card.logo = url; leaveTeamPreview(); saveSoon(); syncInputs(); render();
        };
        im.src = String(fr.result);
      };
      fr.readAsDataURL(file);
    });
  });
  $('#btnLogoDel').addEventListener('click', function () { state.card.logo = ''; saveSoon(); syncInputs(); render(); $('#btnLogo').focus(); });

  /* ---------------- saved cards ---------------- */
  function renderSaved() {
    var row = $('#savedRow'); row.innerHTML = '';
    if (!state.saved.length) { row.appendChild(el('p', { class: 'small muted mb0', text: t('saved_none') })); return; }
    state.saved.forEach(function (p, i) {
      var name = p.name || p.biz || '—', sub = p.name ? p.biz : (p.desig || '');
      row.appendChild(el('span', { class: 'sv no-i18n', 'data-on': String(p.id === state.card.id) },
        el('button', { type: 'button', class: 'sv-use', 'aria-label': t('use_card', { name: name }), title: name, onclick: function () { useSaved(i); } },
          el('span', { dir: 'auto', text: name }), sub ? el('small', { dir: 'auto', text: sub }) : null),
        el('button', { type: 'button', class: 'sv-del', 'aria-label': t('del_card', { name: name }), title: t('del_card', { name: name }), text: '✕',
          onclick: function () {
            if (!confirm(t('confirm_del'))) return;
            state.saved.splice(i, 1); saveNow(); renderSaved(); EDU.toast(t('removed_toast'));
            var next = $$('#savedRow .sv-use')[Math.min(i, state.saved.length - 1)];
            (next || $('#btnSave')).focus();
          } })));
    });
  }
  function useSaved(i) {
    var p = state.saved[i]; if (!p) return;
    state.card = normCard(JSON.parse(JSON.stringify(p)));
    teamIdx = -1;
    ensureFont(cardLang(state.card)); ensureFont(state.card.bl.lang);
    saveNow(); syncInputs(); renderSaved(); render();
  }
  $('#btnSave').addEventListener('click', function () {
    var c = state.card;
    if (c.sample) { EDU.toast(t('save_sample')); $('#fName').focus(); return; }
    var copy = normCard(JSON.parse(JSON.stringify(c))), idx = -1;
    state.saved.forEach(function (x, i) { if (x.id === copy.id) idx = i; });
    if (idx >= 0) state.saved[idx] = copy;
    else if (state.saved.length >= MAX_SAVED) { EDU.toast(t('max_saved', { n: EDU.fmt(MAX_SAVED) })); return; }
    else state.saved.push(copy);
    if (store.set('state', state) === false) { if (idx < 0) state.saved.pop(); EDU.toast(t('store_full'), 6000); renderSaved(); return; }
    renderSaved(); EDU.toast(t('saved_toast'));
  });
  /* a new card for another person in the same business: keeps the design, logo and business details */
  $('#btnNew').addEventListener('click', function () {
    var c = state.card, n = normCard(Object.assign({}, c, { id: uid(), sample: false, name: '', desig: '', phone: '', phone2: '', wa: '', email: '' }));
    if (c.sample) { n.biz = ''; n.tag = ''; n.addr = ''; n.gstin = ''; n.insta = ''; n.fb = ''; n.web = ''; }
    n.bl = Object.assign({}, c.bl, { sample: false, name: '', desig: '' });
    if (c.sample || c.bl.sample) { n.bl.biz = ''; n.bl.tag = ''; n.bl.addr = ''; }
    state.card = n; teamIdx = -1;
    saveSoon(); syncInputs(); renderSaved(); render();
    $('#fName').focus();
  });
  $('#btnReset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state');
    state = loadState(); teamIdx = -1;
    syncInputs(); buildLangSelects(); buildTemplates(); buildSwatches(); renderSaved(); renderTeam(); render();
  });

  /* ---------------- team mode: CSV -> one card per person ---------------- */
  function parseTeam(text) {
    var rows = EDU.csv.parse(String(text || '')).map(function (r) { return r.map(function (x) { return clean(x); }); }).filter(function (r) { return r.some(Boolean); });
    if (!rows.length) return { rows: [] };
    var head = rows[0].map(function (h) { return h.toLowerCase().replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim(); });
    var col = {}, found = 0;
    Object.keys(CSV_ALIAS).forEach(function (k) {
      var i = -1;
      head.forEach(function (h, j) { if (i < 0 && CSV_ALIAS[k].indexOf(h) >= 0 && Object.keys(col).every(function (x) { return col[x] !== j; })) i = j; });
      if (i >= 0) { col[k] = i; found++; }
    });
    var data = rows;
    if (col.name !== undefined || found >= 2) data = rows.slice(1);       // a header line
    else col = { name: 0, desig: 1, phone: 2, wa: 3, email: 4 };            // no header: Name, Designation, Phone, WhatsApp, Email
    var out = [];
    data.forEach(function (r) {
      var row = normRow({ name: r[col.name] || '', desig: col.desig !== undefined ? r[col.desig] || '' : '', phone: col.phone !== undefined ? r[col.phone] || '' : '',
        phone2: col.phone2 !== undefined ? r[col.phone2] || '' : '', wa: col.wa !== undefined ? r[col.wa] || '' : '', email: col.email !== undefined ? r[col.email] || '' : '' });
      if (row.name || row.phone) out.push(row);
    });
    return { rows: out.slice(0, MAX_TEAM), cut: out.length > MAX_TEAM };
  }
  function renderTeam() {
    var body = $('#teamBody'); body.innerHTML = '';
    var n = state.team.length;
    $('#teamNone').hidden = !!n;
    $('#teamTable').hidden = !n;
    state.team.forEach(function (r, i) {
      body.appendChild(el('tr', { class: (i === teamIdx ? 'cur ' : '') + 'no-i18n' },
        el('td', { text: EDU.fmt(i + 1) }), el('td', { class: 'nm', text: r.name, dir: 'auto' }), el('td', { class: 'nm', text: r.desig, dir: 'auto' }),
        el('td', { text: r.phone, dir: 'ltr' }), el('td', { text: r.wa, dir: 'ltr' }), el('td', { text: r.email, dir: 'ltr' }),
        el('td', {}, el('button', { type: 'button', class: 'btn btn-sm', text: t('team_preview'), 'aria-label': t('team_preview') + ': ' + r.name, onclick: function () { teamIdx = i; renderTeam(); render(); } }))));
    });
    $('#btnTeamMe').hidden = teamIdx < 0;
    printInfo();
  }
  var teamTimer = 0;
  function readTeam(text, fromFile) {
    var res = parseTeam(text);
    state.team = res.rows; state.teamText = String(text || '').slice(0, 40000);
    teamIdx = -1;
    show('#teamMsg', !!res.cut, res.cut ? t('team_too_many', { n: EDU.fmt(MAX_TEAM) }) : '');
    if (fromFile && !res.rows.length) show('#teamMsg', true, t('team_bad_file'));
    saveSoon(); renderTeam(); render();
  }
  $('#teamCsv').addEventListener('input', function () { var v = this.value; clearTimeout(teamTimer); teamTimer = setTimeout(function () { readTeam(v, false); }, 300); });
  $('#btnTeamFile').addEventListener('click', function () {
    EDU.pickFile('.csv,.txt,text/csv,text/plain').then(function (file) {
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { show('#teamMsg', true, t('team_bad_file')); return; }
      EDU.readText(file).then(function (text) {
        // an .xlsx or other binary file renamed .csv: control characters or replacement characters mean it is not text
        if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text) || (text.match(/�/g) || []).length > 2) { show('#teamMsg', true, t('team_bad_file')); return; }
        $('#teamCsv').value = text.slice(0, 40000); readTeam(text, true);
      }, function () { show('#teamMsg', true, t('team_bad_file')); });
    });
  });
  $('#btnSampleCsv').addEventListener('click', function () {
    var rows = [CSV_HEAD,
      ['Anil Mehta', 'Sales Manager', '+91 98200 11223', '', '9820011223', 'anil.mehta@example.com'],
      ['Sunita Rao', 'Accounts', '+91 99000 44556', '080 2345 6789', '', 'sunita.rao@example.com'],
      ['Imran Khan', 'Service Engineer', '+91 97000 77889', '', '9700077889', '']];
    EDU.download('team-cards-sample.csv', EDU.csv.stringify(rows), 'text/csv;charset=utf-8');
  });
  $('#btnTeamClear').addEventListener('click', function () { $('#teamCsv').value = ''; readTeam('', false); });
  $('#btnTeamMe').addEventListener('click', function () { teamIdx = -1; renderTeam(); render(); });

  /* ---------------- language, fonts ---------------- */
  EDU.onLang(function () {
    buildLangSelects(); buildTemplates(); buildSwatches();
    ensureFont(cardLang(state.card)); if (state.card.back === 'bilingual') ensureFont(state.card.bl.lang);
    renderSaved(); renderTeam();
    render(); syncInputs();
  });
  var fontTimer = 0;
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', function () { clearTimeout(fontTimer); fontTimer = setTimeout(render, 80); });
  }

  buildLangSelects();
  buildTemplates();
  buildSwatches();
  syncInputs();
  ensureFont(cardLang(state.card));
  if (state.card.back === 'bilingual') ensureFont(state.card.bl.lang);
  renderSaved();
  renderTeam();
  render();
  syncInputs();
})();
