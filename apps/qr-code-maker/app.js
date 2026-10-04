/* QR Code Maker: builds QR codes on the device (qr.js, no library, works offline),
 * prints poster sheets of many codes, and has a learning mode that colours the parts of a code. */
(function () {
  'use strict';
  var SLUG = 'qr-code-maker';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$;
  var MAX_SHEET = 60;
  var SAMPLE_PHONE = '+91 12345 67890';          // not a real Indian mobile series, so nobody gets called
  var ECLS = ['L', 'M', 'Q', 'H'], ECL_PCT = { L: 7, M: 15, Q: 25, H: 30 };
  var DEFAULT_OPT = { size: 600, ecl: 'M', fg: '#000000', bg: '#ffffff', margin: 4, parts: false };
  var DEFAULT_SHEET = { heading: '', cols: 3, showText: true, numbers: true, items: [] };
  /* learning-mode colours (drawn on the code, so they do not follow the page theme) */
  var PARTS = {
    1: { key: 'part_finder', dark: '#d9480f', light: '#ffe3d1' },
    2: { key: 'part_timing', dark: '#2b8a3e', light: '#d3f9d8' },
    3: { key: 'part_align', dark: '#6741d9', light: '#e5dbff' },
    4: { key: 'part_format', dark: '#c2255c', light: '#ffdeeb' },
    5: { key: 'part_version', dark: '#1971c2', light: '#d0ebff' }
  };
  var QUIET = '#fff3bf';

  function f(fn) { return fn; }                         // marks a sample that is read from strings.js at render time
  var TYPES = {
    link: { icon: '🔗', fields: [
      { k: 'url', id: 'f-url', label: 'f_url', hint: 'f_url_hint', kind: 'url', req: true, ltr: true, sample: f(function () { return t('sample_url'); }) }
    ] },
    text: { icon: '📝', fields: [
      { k: 'text', id: 'f-text', label: 'f_text', hint: 'f_text_hint', kind: 'area', rows: 4, req: true, sample: f(function () { return t('sample_text'); }) }
    ] },
    wifi: { icon: '📶', note: 'wifi_warn', fields: [
      { k: 'ssid', id: 'f-ssid', label: 'f_ssid', kind: 'text', req: true, half: true, sample: 'School-Library' },
      { k: 'pass', id: 'f-pass', label: 'f_pass', kind: 'text', half: true, ltr: true, sample: 'learn@2026' },
      { k: 'sec', id: 'f-sec', label: 'f_sec', kind: 'select', half: true, sample: 'WPA', options: [['WPA', 'sec_wpa'], ['WEP', 'sec_wep'], ['nopass', 'sec_none']] },
      { k: 'hidden', id: 'f-hidden', label: 'f_hidden', kind: 'check', half: true, sample: false }
    ] },
    phone: { icon: '📞', fields: [
      { k: 'num', id: 'f-phone', label: 'f_phone', hint: 'f_phone_hint', kind: 'tel', req: true, ltr: true, sample: SAMPLE_PHONE }
    ] },
    wa: { icon: '💬', fields: [
      { k: 'num', id: 'f-wanum', label: 'f_wa_num', hint: 'f_wa_hint', kind: 'tel', req: true, ltr: true, sample: SAMPLE_PHONE },
      { k: 'msg', id: 'f-wamsg', label: 'f_wa_msg', kind: 'area', rows: 2, sample: f(function () { return t('sample_wa'); }) }
    ] },
    email: { icon: '✉️', fields: [
      { k: 'to', id: 'f-to', label: 'f_email_to', kind: 'email', req: true, ltr: true, sample: 'office@example.com' },
      { k: 'sub', id: 'f-subject', label: 'f_subject', kind: 'text', sample: f(function () { return t('sample_subject'); }) },
      { k: 'body', id: 'f-body', label: 'f_body', kind: 'area', rows: 3, sample: '' }
    ] },
    vcard: { icon: '👤', fields: [
      { k: 'name', id: 'f-name', label: 'f_name', kind: 'text', req: true, half: true, sample: f(function () { return t('sample_name'); }) },
      { k: 'org', id: 'f-org', label: 'f_org', kind: 'text', half: true, sample: f(function () { return t('sample_org'); }) },
      { k: 'role', id: 'f-role', label: 'f_role', kind: 'text', half: true, sample: f(function () { return t('sample_role'); }) },
      { k: 'tel', id: 'f-vtel', label: 'f_phone', kind: 'tel', half: true, ltr: true, sample: SAMPLE_PHONE },
      { k: 'email', id: 'f-vemail', label: 'f_email', kind: 'email', half: true, ltr: true, sample: 'teacher@example.com' },
      { k: 'url', id: 'f-vurl', label: 'f_website', kind: 'url', half: true, ltr: true, sample: '' }
    ] }
  };
  var TYPE_ORDER = ['link', 'text', 'wifi', 'phone', 'wa', 'email', 'vcard'];

  /* ---------------- state (validated, so a broken store never crashes the app) ---------------- */
  function isHex(c) { return typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c); }
  function marginOr4(v) { var m = Math.round(+v); return isNaN(m) ? 4 : EDU.clamp(m, 0, 10); }   // 0 is a valid margin
  function loadState() {
    var o = Object.assign({}, DEFAULT_OPT, store.get('opt', {}) || {});
    o.size = EDU.clamp(Math.round(+o.size || DEFAULT_OPT.size), 200, 1200);
    if (ECLS.indexOf(o.ecl) < 0) o.ecl = 'M';
    if (!isHex(o.fg)) o.fg = DEFAULT_OPT.fg;
    if (!isHex(o.bg)) o.bg = DEFAULT_OPT.bg;
    o.margin = marginOr4(o.margin);
    o.parts = !!o.parts;
    var s = Object.assign({}, DEFAULT_SHEET, store.get('sheet', {}) || {});
    if ([2, 3, 4].indexOf(+s.cols) < 0) s.cols = 3; else s.cols = +s.cols;
    s.heading = typeof s.heading === 'string' ? s.heading : '';
    s.showText = s.showText !== false; s.numbers = s.numbers !== false;
    s.items = (Array.isArray(s.items) ? s.items : []).filter(function (it) {
      return it && typeof it.payload === 'string' && it.payload && TYPES[it.type];
    }).slice(0, MAX_SHEET).map(function (it, i) {
      return { id: String(it.id || ('i' + i + Date.now())), type: it.type, title: String(it.title || ''), payload: it.payload,
        summary: String(it.summary || ''), ecl: ECLS.indexOf(it.ecl) >= 0 ? it.ecl : 'M',
        fg: isHex(it.fg) ? it.fg : '#000000', bg: isHex(it.bg) ? it.bg : '#ffffff', margin: marginOr4(it.margin), secret: !!it.secret };
    });
    var fields = store.get('fields', {});
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) fields = {};
    var type = store.get('type', 'link');
    return { type: TYPES[type] ? type : 'link', f: fields, opt: o, sheet: s };
  }
  var state = loadState();

  var saveTimer = 0;
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 250);
  }
  function saveNow() {
    clearTimeout(saveTimer);
    store.set('type', state.type); store.set('fields', state.f); store.set('opt', state.opt); store.set('sheet', state.sheet);
  }
  window.addEventListener('pagehide', saveNow);

  function fieldDef(type, k) {
    var list = TYPES[type].fields;
    for (var i = 0; i < list.length; i++) if (list[i].k === k) return list[i];
    return null;
  }
  /* value of a field: what the user typed, or the sample (in the current language) if never touched */
  function val(type, k) {
    var fv = state.f[type];
    if (fv && Object.prototype.hasOwnProperty.call(fv, k)) return fv[k];
    if (k === 'caption') return t('cap_' + type);
    var d = fieldDef(type, k);
    if (!d) return '';
    return typeof d.sample === 'function' ? d.sample() : d.sample;
  }
  function setField(type, k, v) {
    if (!state.f[type] || typeof state.f[type] !== 'object') state.f[type] = {};
    state.f[type][k] = v;
    saveSoon();
    renderQR();
  }

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- payload builders ---------------- */
  /* digits typed on an Indian-language or Urdu keyboard (Devanagari, Bengali, Tamil, Urdu ... digits) become 0-9 */
  var DIGIT_ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function asciiDigits(s) {
    s = String(s == null ? '' : s);
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var k = s.charCodeAt(i), d = -1;
      for (var j = 0; j < DIGIT_ZEROS.length; j++) if (k >= DIGIT_ZEROS[j] && k <= DIGIT_ZEROS[j] + 9) { d = k - DIGIT_ZEROS[j]; break; }
      out += d >= 0 ? String(d) : s.charAt(i);
    }
    return out;
  }
  function cleanPhone(s) { return asciiDigits(s).replace(/[\s\-().\/]/g, ''); }
  function wifiEsc(s) { return String(s).replace(/([\\;,:"])/g, '\\$1'); }
  function vEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,'); }
  var DEFAULT_SCHEME = 'https:' + '//';                // added when a teacher types "ncert.nic.in"
  var LOCAL_SCHEME = 'http:' + '//';                   // school servers such as "192.168.4.1:8080" (Kolibri) rarely have https
  function withScheme(u) {
    var hostPort = /^[a-z0-9-]+(\.[a-z0-9-]+)*:\d+([\/?#]|$)/i.test(u);          // "localhost:8080/quiz" is a host, not a scheme
    if (!hostPort && /^[a-z][a-z0-9+.\-]*:/i.test(u)) return u;
    var local = (hostPort && !/:443([\/?#]|$)/.test(u)) || /^(localhost|\d{1,3}(\.\d{1,3}){3})([:\/?#]|$)/i.test(u);
    return (local ? LOCAL_SCHEME : DEFAULT_SCHEME) + u;
  }
  function urlLooksBad(u) {
    if (/\s/.test(u)) return true;
    try {
      var p = new URL(u);
      if (/^https?:$/.test(p.protocol) && p.hostname.indexOf('.') < 0 && p.hostname !== 'localhost') return true;
    } catch (e) { return true; }
    return false;
  }
  function short(s, n) { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  function build(type) {
    var v = function (k) { var x = val(type, k); return x == null ? '' : x; };
    var r = { payload: '', summary: '', missing: null, warns: [] };
    switch (type) {
      case 'link': {
        var u = String(v('url')).trim();
        if (!u) { r.missing = 'f_url'; break; }
        u = withScheme(u);
        if (urlLooksBad(u)) r.warns.push('warn_url');
        r.payload = u; r.summary = u;
        break;
      }
      case 'text': {
        var tx = String(v('text'));
        if (!tx.trim()) { r.missing = 'f_text'; break; }
        r.payload = tx.replace(/\s+$/, ''); r.summary = short(tx, 90);
        break;
      }
      case 'wifi': {
        var ssid = String(v('ssid')), pass = String(v('pass')), sec = v('sec'), hidden = !!v('hidden');
        if (['WPA', 'WEP', 'nopass'].indexOf(sec) < 0) sec = 'WPA';
        if (!ssid.trim()) { r.missing = 'f_ssid'; break; }
        if (sec === 'WPA' && (pass.length < 8 || pass.length > 63)) r.warns.push('warn_wifi_pass');
        r.payload = 'WIFI:T:' + sec + ';S:' + wifiEsc(ssid) + ';' + (sec !== 'nopass' ? 'P:' + wifiEsc(pass) + ';' : '') + (hidden ? 'H:true;' : '') + ';';
        r.summary = 'Wi-Fi: ' + ssid;                    // never print the password on a sheet
        break;
      }
      case 'phone': {
        var n = cleanPhone(v('num'));
        if (!n) { r.missing = 'f_phone'; break; }
        if (!/^\+?\d{6,15}$/.test(n)) r.warns.push('warn_phone');
        r.payload = 'tel:' + n; r.summary = String(v('num')).trim();
        break;
      }
      case 'wa': {
        var raw = asciiDigits(v('num')).trim(), d = raw.replace(/\D/g, ''), msg = String(v('msg')).trim();
        if (!d) { r.missing = 'f_wa_num'; if (raw) r.warns.push('warn_phone'); break; }
        if (d.slice(0, 2) === '00') d = d.slice(2);        // 0091 98765 43210: 00 is the international prefix
        if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
        if (d.length === 10 && raw.charAt(0) !== '+') d = '91' + d;
        if (!/^\d{10,15}$/.test(d)) r.warns.push('warn_phone');
        r.payload = 'https://wa.me/' + d + (msg ? '?text=' + encodeURIComponent(msg) : '');
        r.summary = 'WhatsApp: +' + d;
        break;
      }
      case 'email': {
        var to = String(v('to')).trim(), sub = String(v('sub')).trim(), body = String(v('body')).trim(), q = [];
        if (!to) { r.missing = 'f_email_to'; break; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) r.warns.push('warn_email');
        if (sub) q.push('subject=' + encodeURIComponent(sub));
        if (body) q.push('body=' + encodeURIComponent(body.replace(/\r?\n/g, '\r\n')));
        r.payload = 'mailto:' + to + (q.length ? '?' + q.join('&') : ''); r.summary = to;
        break;
      }
      case 'vcard': {
        var name = String(v('name')).trim(), org = String(v('org')).trim(), role = String(v('role')).trim();
        var tel = cleanPhone(v('tel')), em = String(v('email')).trim(), web = String(v('url')).trim();
        if (!name) { r.missing = 'f_name'; break; }
        if (tel && !/^\+?\d{6,15}$/.test(tel)) r.warns.push('warn_phone');
        if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) r.warns.push('warn_email');
        var L = ['BEGIN:VCARD', 'VERSION:3.0', 'N:;' + vEsc(name) + ';;;', 'FN:' + vEsc(name)];
        if (org) L.push('ORG:' + vEsc(org));
        if (role) L.push('TITLE:' + vEsc(role));
        if (tel) L.push('TEL;TYPE=CELL:' + tel);
        if (em) L.push('EMAIL:' + em);
        if (web) L.push('URL:' + withScheme(web));
        L.push('END:VCARD');
        r.payload = L.join('\r\n'); r.summary = name + (tel ? ' · ' + tel : '');
        break;
      }
    }
    return r;
  }

  /* ---------------- drawing ---------------- */
  function fontStack() {
    try { return getComputedStyle(document.body).fontFamily || 'sans-serif'; } catch (e) { return 'sans-serif'; }
  }
  function graphemes(s) {
    try { if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s), function (x) { return x.segment; }); } catch (e) { }
    return Array.from(s);
  }
  function wrapText(ctx, text, maxW, maxLines) {
    var words = String(text).trim().split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) {
      var test = cur ? cur + ' ' + w : w;
      if (!cur || ctx.measureText(test).width <= maxW) cur = test; else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    var out = [];
    lines.forEach(function (ln) {                       // split words that are wider than the line
      var g = graphemes(ln);
      while (g.length > 1 && ctx.measureText(g.join('')).width > maxW) {
        var i = g.length - 1;
        while (i > 1 && ctx.measureText(g.slice(0, i).join('')).width > maxW) i--;
        out.push(g.slice(0, i).join('')); g = g.slice(i);
      }
      out.push(g.join(''));
    });
    if (out.length > maxLines) {
      out = out.slice(0, maxLines);
      var last = graphemes(out[maxLines - 1]);
      while (last.length > 1 && ctx.measureText(last.join('') + '…').width > maxW) last.pop();
      out[maxLines - 1] = last.join('') + '…';
    }
    return out;
  }
  var RTL_RE = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
  function capLineHeight(cap) { return RTL_RE.test(cap) ? 1.9 : 1.45; }   // Urdu Nastaliq letters reach far above and below the line

  /* draw a code (plus optional caption) into a canvas; o = {scale, margin, fg, bg, caption, parts} */
  function drawQR(canvas, q, o) {
    var n = q.size, m = o.margin, s = o.scale, W = (n + 2 * m) * s;
    var ctx = canvas.getContext('2d');
    var cap = (o.caption || '').trim(), lines = [], fs = Math.max(14, Math.round(W * 0.06)), lh = Math.round(fs * capLineHeight(cap));
    /* the caption may use the outer half of the quiet zone, but always leaves 2 empty squares under the code */
    var capTop = o.parts ? W + s : W - Math.max(0, m - 2) * s, H = W;
    if (cap) {
      ctx.font = '700 ' + fs + 'px ' + fontStack();
      lines = wrapText(ctx, cap, W - 2 * Math.max(fs * 0.6, s * 2), 3);
      if (m < 2) capTop = W + s * 2;
      H = Math.round(capTop + lines.length * lh + fs * 0.55);
    }
    canvas.width = W; canvas.height = H;
    ctx = canvas.getContext('2d');
    var fg = o.parts ? '#111111' : o.fg, bg = o.parts ? '#ffffff' : o.bg;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (o.parts && m > 0) {
      ctx.fillStyle = QUIET;
      ctx.fillRect(0, 0, W, m * s); ctx.fillRect(0, (n + m) * s, W, m * s);
      ctx.fillRect(0, m * s, m * s, n * s); ctx.fillRect((n + m) * s, m * s, m * s, n * s);
    }
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var dark = q.modules[y][x], kind = q.kinds[y][x], col = null;
        if (o.parts && PARTS[kind]) col = dark ? PARTS[kind].dark : PARTS[kind].light;
        else if (dark) col = fg;
        if (col) { ctx.fillStyle = col; ctx.fillRect((x + m) * s, (y + m) * s, s, s); }
      }
    }
    if (lines.length) {
      ctx.font = '700 ' + fs + 'px ' + fontStack();
      ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      try { ctx.direction = RTL_RE.test(cap) ? 'rtl' : 'ltr'; } catch (e) { }
      lines.forEach(function (ln, i) { ctx.fillText(ln, W / 2, capTop + lh * i + lh / 2); });
    }
    return { W: W, H: H };
  }

  /* vector version (crisp at any print size); unit = one square */
  function svgPath(q, margin) {
    var n = q.size, d = '';
    for (var y = 0; y < n; y++) {
      var x = 0;
      while (x < n) {
        if (q.modules[y][x]) {
          var x0 = x;
          while (x < n && q.modules[y][x]) x++;
          d += 'M' + (x0 + margin) + ' ' + (y + margin) + 'h' + (x - x0) + 'v1h-' + (x - x0) + 'z';
        } else x++;
      }
    }
    return d;
  }
  function svgFor(q, fg, bg, margin) {
    var total = q.size + 2 * margin;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect width="' + total + '" height="' + total + '" fill="' + bg + '"/><path fill="' + fg + '" d="' + svgPath(q, margin) + '"/></svg>';
  }
  function svgFile(q, o) {
    var n = q.size, m = o.margin, U = 10, W = (n + 2 * m) * U, H = W, cap = (o.caption || '').trim(), extra = '';
    if (cap) {
      var c = document.createElement('canvas').getContext('2d'), fs = Math.round(W * 0.06), lh = Math.round(fs * capLineHeight(cap));
      c.font = '700 ' + fs + 'px ' + fontStack();
      var lines = wrapText(c, cap, W - 2 * Math.max(fs * 0.6, U * 2), 3), top = m < 2 ? W + U * 2 : W - Math.max(0, m - 2) * U;
      H = Math.round(top + lines.length * lh + fs * 0.55);
      var dir = RTL_RE.test(cap) ? ' direction="rtl"' : '';
      lines.forEach(function (ln, i) {
        extra += '<text x="' + (W / 2) + '" y="' + Math.round(top + lh * i + lh / 2) + '" font-size="' + fs + '" font-weight="700" font-family="Noto Sans, Nirmala UI, Arial, sans-serif" text-anchor="middle" dominant-baseline="middle" fill="' + o.fg + '"' + dir + '>' + EDU.esc(ln) + '</text>';
      });
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<rect width="' + W + '" height="' + H + '" fill="' + o.bg + '"/>' +
      '<g transform="scale(' + U + ')" shape-rendering="crispEdges"><path fill="' + o.fg + '" d="' + svgPath(q, m) + '"/></g>' + extra + '</svg>';
  }

  /* ---------------- colour contrast (WCAG formula) ---------------- */
  function lum(hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) { var A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); }

  /* ---------------- UI: type chips + fields ---------------- */
  function buildTypes() {
    var box = $('#types'); box.innerHTML = '';
    TYPE_ORDER.forEach(function (ty) {
      var b = el('button', { type: 'button', class: 'qr-type', id: 'type-' + ty, 'aria-pressed': String(ty === state.type),
        onclick: function () {
          if (state.type === ty) return;
          state.type = ty; saveSoon();
          EDU.$$('.qr-type', box).forEach(function (x) { x.setAttribute('aria-pressed', String(x.id === 'type-' + ty)); });
          buildFields(); renderQR();
        } },
        el('span', { class: 'ico', 'aria-hidden': 'true', text: TYPES[ty].icon }),
        el('span', { i18n: 'type_' + ty }));
      box.appendChild(b);
    });
  }

  function buildFields() {
    var box = $('#fields'); box.innerHTML = '';
    var type = state.type, def = TYPES[type];
    def.fields.forEach(function (fd) {
      var v = val(type, fd.k), input, wrap;
      if (fd.kind === 'check') {
        input = el('input', { type: 'checkbox', id: fd.id });
        input.checked = !!v;
        wrap = el('label', { class: 'check qr-check' + (fd.half ? '' : ' full') }, input, el('span', { text: t(fd.label) }));
      } else {
        if (fd.kind === 'area') input = el('textarea', { id: fd.id, rows: fd.rows || 3, dir: 'auto', spellcheck: 'false' });
        else if (fd.kind === 'select') {
          input = el('select', { id: fd.id });
          fd.options.forEach(function (o) { input.appendChild(el('option', { value: o[0], text: t(o[1]) })); });
        } else {
          input = el('input', { id: fd.id, type: { url: 'url', tel: 'tel', email: 'email' }[fd.kind] || 'text', dir: fd.ltr ? 'ltr' : 'auto',
            autocomplete: 'off', spellcheck: 'false', autocapitalize: fd.ltr ? 'off' : null });
        }
        input.value = v == null ? '' : String(v);
        var lab = el('label', { for: fd.id }, el('span', { text: t(fd.label) }), fd.req || fd.kind === 'select' ? null : el('span', { class: 'qr-opt', text: ' · ' + t('optional') }));
        wrap = el('div', { class: 'field' + (fd.half ? '' : ' full') }, lab, input, fd.hint ? el('span', { class: 'hint', text: t(fd.hint) }) : null);
      }
      input.addEventListener(fd.kind === 'check' || fd.kind === 'select' ? 'change' : 'input', function () {
        setField(type, fd.k, fd.kind === 'check' ? input.checked : input.value);
      });
      box.appendChild(wrap);
    });
    if (def.note) box.appendChild(el('div', { class: 'callout warning small full', text: '⚠ ' + t(def.note) }));
    $('#f-caption').value = val(type, 'caption');
  }

  /* ---------------- UI: options ---------------- */
  function buildEcl() {
    var seg = $('#eclSeg'); seg.innerHTML = '';
    ECLS.forEach(function (e) {
      seg.appendChild(el('button', { type: 'button', id: 'ecl-' + e, 'aria-pressed': String(state.opt.ecl === e), text: e + ' · ' + ECL_PCT[e] + '%',
        onclick: function () { state.opt.ecl = e; syncOptions(); saveSoon(); renderQR(); } }));
    });
  }
  function syncOptions() {
    var o = state.opt;
    $('#o-size').value = o.size;
    $('#o-margin').value = o.margin;
    $('#o-margin-out').textContent = t('o_margin_val', { n: EDU.fmt(o.margin) });
    $('#o-fg').value = o.fg; $('#o-bg').value = o.bg;
    $('#o-parts').checked = o.parts;
    $('#partsLegend').hidden = !o.parts;
    ECLS.forEach(function (e) { var b = $('#ecl-' + e); if (b) b.setAttribute('aria-pressed', String(o.ecl === e)); });
    var r = contrast(o.fg, o.bg), warn = [];
    if (r < 3) warn.push(t('warn_contrast', { r: EDU.fmt(Math.round(r * 10) / 10) }));
    if (lum(o.fg) > lum(o.bg)) warn.push(t('warn_inverted'));
    var cw = $('#colorWarn');
    cw.textContent = warn.join(' ');
    cw.hidden = !warn.length;
  }

  /* ---------------- render the main code ---------------- */
  var cur = null;
  function setActions(on) {
    ['#btnPng', '#btnSvg', '#btnCopyImg', '#btnPrint', '#btnBig', '#btnAdd', '#btnCopyText'].forEach(function (s) { $(s).disabled = !on; });
  }
  function badge(text, cls) { return el('span', { class: 'badge' + (cls ? ' ' + cls : ''), text: text }); }

  function renderQR() {
    var o = state.opt, r = build(state.type), cap = String(val(state.type, 'caption') || '').trim();
    var canvas = $('#qrCanvas'), wrap = canvas.parentNode, info = $('#qrInfo'), status = $('#qrStatus');
    var msgs = [], q = null;
    if (r.missing) msgs.push(['danger', t('err_required', { field: t(r.missing) })]);
    else {
      q = QRGen.encode(r.payload, o.ecl);
      if (!q.ok) { msgs.push(['danger', t(o.ecl === 'L' ? 'err_too_long_l' : 'err_too_long', { b: EDU.fmt(q.bytes), e: o.ecl, max: EDU.fmt(q.maxBytes) })]); q = null; }
    }
    r.warns.forEach(function (k) { msgs.push(['warning', t(k)]); });
    info.innerHTML = '';
    if (q) {
      var total = q.size + 2 * o.margin, sc = Math.max(1, Math.floor(o.size / total));
      var dim = drawQR(canvas, q, { scale: sc, margin: o.margin, fg: o.fg, bg: o.bg, caption: cap, parts: o.parts });
      wrap.classList.remove('is-off');
      canvas.dataset.version = q.version; canvas.dataset.size = q.size; canvas.dataset.ecl = o.ecl;
      canvas.dataset.bytes = q.bytes; canvas.dataset.mask = q.mask; canvas.dataset.ok = '1';
      canvas.setAttribute('aria-label', t('qr_alt', { text: short(r.summary || r.payload, 80) }));
      $('#o-size-out').textContent = EDU.fmt(dim.W) + ' × ' + EDU.fmt(dim.H) + ' px';
      info.appendChild(badge(t('info_version', { v: EDU.fmt(q.version) }), 'primary'));
      info.appendChild(badge(t('info_grid', { size: q.size + '×' + q.size })));
      info.appendChild(badge(t('info_bytes', { b: EDU.fmt(q.bytes), max: EDU.fmt(QRGen.maxBytes(o.ecl)) })));
      info.appendChild(badge(t('info_mask', { m: q.mask })));
      if (q.version >= 10) msgs.push(['', t('warn_dense', { cm: EDU.fmt(Math.ceil(total * 0.06)) })]);
      if (o.margin < 2) msgs.push(['warning', t('warn_margin')]);
      if (o.parts) msgs.push(['', t('note_parts')]);
    } else {
      wrap.classList.add('is-off');
      canvas.dataset.ok = '0';
      $('#o-size-out').textContent = '—';
      canvas.setAttribute('aria-label', t('h_preview'));
    }
    status.innerHTML = '';
    msgs.forEach(function (mm) { status.appendChild(el('div', { class: 'callout small' + (mm[0] ? ' ' + mm[0] : ''), text: mm[1] })); });
    $('#payload').textContent = r.payload || '';
    cur = { r: r, q: q, caption: cap };
    setActions(!!q);
  }

  /* ---------------- actions ---------------- */
  function fileBase() {
    var slug = String(cur && cur.caption || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return 'qr-' + (slug || state.type);
  }
  function downloadPng() { if (cur && cur.q) EDU.downloadCanvas($('#qrCanvas'), fileBase() + '.png'); }
  function downloadSvg() {
    if (!cur || !cur.q) return;
    EDU.download(fileBase() + '.svg', svgFile(cur.q, { margin: state.opt.margin, fg: state.opt.fg, bg: state.opt.bg, caption: cur.caption }), 'image/svg+xml');
  }
  function copyImage() {
    if (!cur || !cur.q) return;
    var canvas = $('#qrCanvas');
    if (!navigator.clipboard || !navigator.clipboard.write || !window.ClipboardItem) { EDU.toast(t('copy_img_fail')); return; }
    try {
      var blob = new Promise(function (res, rej) { canvas.toBlob(function (b) { if (b) res(b); else rej(new Error('no blob')); }, 'image/png'); });
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        .then(function () { EDU.toast(t('img_copied')); }, function () { EDU.toast(t('copy_img_fail')); });
    } catch (e) { EDU.toast(t('copy_img_fail')); }
  }
  function printMode(mode) {
    document.body.classList.remove('pm-single', 'pm-sheet');
    document.body.classList.add(mode);
  }
  /* The chosen layout stays on the page until the next print. Android Chrome returns from print() before it
     renders the pages, so switching back on a timer (or on an early 'afterprint') could print the wrong layout.
     Ctrl+P on its own always prints the single code. */
  var printReq = null, printAt = 0;
  function doPrint(mode) {
    printReq = mode; printAt = Date.now();
    printMode(mode);
    try { window.print(); } catch (e) { }
  }
  window.addEventListener('beforeprint', function () {
    printMode(printReq && Date.now() - printAt < 60000 ? printReq : 'pm-single');
  });

  /* big-screen view for the projector / smartboard */
  var bigOpen = false;
  function openBig() {
    if (!cur || !cur.q) return;
    var o = state.opt, total = cur.q.size + 2 * o.margin;
    var target = Math.min(1600, Math.max(700, Math.round(Math.min(screen.width || 1000, screen.height || 1000) * (window.devicePixelRatio || 1))));
    drawQR($('#bigCanvas'), cur.q, { scale: Math.max(2, Math.floor(target / total)), margin: o.margin, fg: o.fg, bg: o.bg, caption: cur.caption, parts: o.parts });
    var bv = $('#bigView');
    bv.style.background = o.parts ? '#ffffff' : o.bg;
    bv.style.color = o.parts ? '#111111' : o.fg;
    bv.hidden = false; bigOpen = true;
    EDU.fullscreen(bv);
    $('#bigClose').focus();
  }
  var refocusBig = false;
  function closeBig() {
    if (!bigOpen) return;
    bigOpen = false;
    $('#bigView').hidden = true;
    if (document.fullscreenElement || document.webkitFullscreenElement) { refocusBig = true; EDU.fullscreen(); }
    $('#btnBig').focus();
  }
  document.addEventListener('keydown', function (e) {
    if (!bigOpen) return;
    if (e.key === 'Escape') closeBig();
    else if (e.key === 'Tab') { e.preventDefault(); $('#bigClose').focus(); }   // the close button is the only control in the view
  });
  document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement) return;
    if (bigOpen) { refocusBig = true; closeBig(); }
    if (refocusBig) { refocusBig = false; $('#btnBig').focus(); }   // leaving fullscreen drops the focus
  });

  /* ---------------- poster sheet ---------------- */
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function addToSheet() {
    if (!cur || !cur.q) return;
    var S = state.sheet;
    if (S.items.length >= MAX_SHEET) { EDU.toast(t('sheet_full', { n: EDU.fmt(MAX_SHEET) })); return; }
    S.items.push({ id: newId(), type: state.type, title: cur.caption || t('station_n', { n: EDU.fmt(S.items.length + 1) }),
      payload: cur.r.payload, summary: cur.r.summary || short(cur.r.payload, 90), ecl: state.opt.ecl,
      fg: state.opt.fg, bg: state.opt.bg, margin: state.opt.margin });
    saveSoon(); renderSheet();
    EDU.toast(t('added_toast', { n: EDU.fmt(S.items.length) }));
  }
  function addSample() {
    var S = state.sheet;
    if (S.items.length + 4 > MAX_SHEET) { EDU.toast(t('sheet_full', { n: EDU.fmt(MAX_SHEET) })); return; }
    for (var i = 1; i <= 4; i++) {
      var clue = t('hunt_' + i);
      /* secret: the clue is shown here for the teacher but never printed, or nobody would need to scan */
      S.items.push({ id: newId(), type: 'text', title: t('station_n', { n: EDU.fmt(i) }), payload: clue, summary: clue, ecl: 'M', fg: '#000000', bg: '#ffffff', margin: 4, secret: true });
    }
    if (!S.heading.trim()) { S.heading = t('hunt_heading'); $('#sheetHeading').value = S.heading; }
    saveSoon(); renderSheet();
    EDU.toast(t('added_toast', { n: EDU.fmt(S.items.length) }));
  }
  var svgCache = {};
  function itemSvg(it) {
    var key = [it.payload, it.ecl, it.fg, it.bg, it.margin].join('\u0001');
    if (svgCache[key] === undefined) {
      var q = QRGen.encode(it.payload, it.ecl);
      svgCache[key] = q.ok ? svgFor(q, it.fg, it.bg, it.margin) : '';
    }
    return svgCache[key];
  }
  function renderSheet() {
    var S = state.sheet, grid = $('#sheetGrid');
    grid.innerHTML = '';
    grid.style.setProperty('--cols', S.cols);
    grid.classList.toggle('no-nums', !S.numbers);
    $('#sheetEmpty').hidden = S.items.length > 0;
    $('#sheetCount').textContent = t(S.items.length === 1 ? 'sheet_count_one' : 'sheet_count', { n: EDU.fmt(S.items.length) });
    var h = $('#sheetH'); h.textContent = S.heading.trim(); h.classList.toggle('is-empty', !S.heading.trim());
    $('#btnSheetPrint').disabled = !S.items.length; $('#btnSheetClear').disabled = !S.items.length;
    EDU.$$('#colsSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.cols === S.cols)); });
    $('#sheetShowText').checked = S.showText; $('#sheetNumbers').checked = S.numbers;
    $('#sheetSecret').hidden = !(S.showText && S.items.some(function (it) { return it.secret; }));
    S.items.forEach(function (it, i) {
      var typeName = t('type_' + it.type);
      var title = el('input', { type: 'text', class: 'si-title-input no-print', dir: 'auto', 'aria-label': t('item_title') + ' ' + EDU.fmt(i + 1), maxlength: '60' });
      title.value = it.title;
      var printTitle = el('div', { class: 'si-title print-only', dir: 'auto', text: it.title });
      var qr = el('div', { class: 'si-qr', role: 'img', 'aria-label': it.title || typeName });
      title.addEventListener('input', function () {
        it.title = title.value; printTitle.textContent = title.value; qr.setAttribute('aria-label', title.value || typeName); saveSoon();
      });
      qr.innerHTML = itemSvg(it);
      var card = el('div', { class: 'sheet-item no-i18n', dataset: { id: it.id } },
        S.numbers ? el('span', { class: 'si-num', 'aria-hidden': 'true', text: EDU.fmt(i + 1) }) : null,
        el('span', { class: 'si-type no-print', role: 'img', 'aria-label': typeName, title: typeName, text: TYPES[it.type].icon }),
        printTitle, title, qr,
        S.showText ? el('div', { class: 'si-text' + (it.secret ? ' si-secret no-print' : ''), dir: 'auto', text: (it.secret ? '🔒 ' : '') + it.summary }) : null,
        el('div', { class: 'si-actions no-print' },
          el('button', { type: 'button', class: 'btn btn-sm btn-ghost si-up', 'aria-label': t('move_up'), title: t('move_up'), disabled: i === 0, text: '↑',
            onclick: function () { move(i, -1); } }),
          el('button', { type: 'button', class: 'btn btn-sm btn-ghost si-down', 'aria-label': t('move_down'), title: t('move_down'), disabled: i === S.items.length - 1, text: '↓',
            onclick: function () { move(i, 1); } }),
          el('button', { type: 'button', class: 'btn btn-sm btn-ghost btn-danger si-del', 'aria-label': t('delete'), title: t('delete'), text: '✕',
            onclick: function () {
              S.items.splice(i, 1); saveSoon(); renderSheet();
              var dels = EDU.$$('#sheetGrid .si-del'), next = dels[Math.min(i, dels.length - 1)];
              (next || $('#btnSheetSample')).focus();           // keep keyboard users in the sheet
            } })));
      grid.appendChild(card);
    });
  }
  function move(i, d) {
    var a = state.sheet.items, j = i + d;
    if (j < 0 || j >= a.length) return;
    var x = a[i]; a[i] = a[j]; a[j] = x;
    saveSoon(); renderSheet();
    var btn = EDU.$$('#sheetGrid .sheet-item')[j];
    if (btn) { var b = $(d < 0 ? '.si-up' : '.si-down', btn); if (b && !b.disabled) b.focus(); }
  }

  /* ---------------- wiring ---------------- */
  $('#f-caption').addEventListener('input', function () { setField(state.type, 'caption', this.value); });
  $('#o-size').addEventListener('input', function () { state.opt.size = +this.value; saveSoon(); renderQR(); });
  $('#o-margin').addEventListener('input', function () { state.opt.margin = +this.value; syncOptions(); saveSoon(); renderQR(); });
  ['o-fg', 'o-bg'].forEach(function (id) {
    $('#' + id).addEventListener('input', function () {
      if (!isHex(this.value)) return;
      state.opt[id === 'o-fg' ? 'fg' : 'bg'] = this.value.toLowerCase(); syncOptions(); saveSoon(); renderQR();
    });
  });
  $('#o-swap').addEventListener('click', function () { var o = state.opt, x = o.fg; o.fg = o.bg; o.bg = x; syncOptions(); saveSoon(); renderQR(); });
  $('#o-bw').addEventListener('click', function () { state.opt.fg = '#000000'; state.opt.bg = '#ffffff'; syncOptions(); saveSoon(); renderQR(); });
  $('#o-parts').addEventListener('change', function () { state.opt.parts = this.checked; syncOptions(); saveSoon(); renderQR(); });

  $('#btnPng').addEventListener('click', downloadPng);
  $('#btnSvg').addEventListener('click', downloadSvg);
  $('#btnCopyImg').addEventListener('click', copyImage);
  $('#btnPrint').addEventListener('click', function () { doPrint('pm-single'); });
  $('#btnBig').addEventListener('click', openBig);
  $('#bigClose').addEventListener('click', closeBig);
  $('#btnAdd').addEventListener('click', addToSheet);
  $('#btnCopyText').addEventListener('click', function () { if (cur && cur.r.payload) EDU.copy(cur.r.payload); });

  $('#sheetHeading').addEventListener('input', function () {
    state.sheet.heading = this.value; var h = $('#sheetH');
    h.textContent = this.value.trim(); h.classList.toggle('is-empty', !this.value.trim()); saveSoon();
  });
  EDU.$$('#colsSeg button').forEach(function (b) {
    b.addEventListener('click', function () { state.sheet.cols = +b.dataset.cols; saveSoon(); renderSheet(); });
  });
  $('#sheetShowText').addEventListener('change', function () { state.sheet.showText = this.checked; saveSoon(); renderSheet(); });
  $('#sheetNumbers').addEventListener('change', function () { state.sheet.numbers = this.checked; saveSoon(); renderSheet(); });
  $('#btnSheetPrint').addEventListener('click', function () { if (state.sheet.items.length) doPrint('pm-sheet'); });
  $('#btnSheetSample').addEventListener('click', addSample);
  $('#btnSheetClear').addEventListener('click', function () {
    if (!state.sheet.items.length || !confirm(t('confirm_clear_sheet'))) return;
    state.sheet.items = []; saveSoon(); renderSheet();
  });
  $('#btnReset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['type', 'fields', 'opt', 'sheet'].forEach(function (k) { store.remove(k); });
    state = loadState();
    $('#sheetHeading').value = '';
    buildTypes(); buildFields(); buildEcl(); syncOptions(); renderQR(); renderSheet();
  });

  function renderAll() {
    buildFields(); syncOptions(); renderQR(); renderSheet();
  }
  EDU.onLang(renderAll);

  /* re-draw the caption once the language's web font has arrived */
  var fontTimer = 0;
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', function () { clearTimeout(fontTimer); fontTimer = setTimeout(renderQR, 60); });
  }

  /* on phones the code itself comes first; the "what is inside" box opens on tap */
  try { if (window.matchMedia && matchMedia('(max-width: 899px)').matches) $('#insideBox').open = false; } catch (e) { }

  buildTypes();
  buildEcl();
  $('#sheetHeading').value = state.sheet.heading;
  renderAll();
})();
