/* UPI QR & Payment Standee: builds a UPI "Scan & Pay" QR on the device (qr.js, no library, works offline),
 * lays it out as a counter standee, table tent, sticker sheet or phone image, and has a counter mode that shows
 * a QR with the bill amount. The UPI ID, name and logo never leave the device (saved only with EDU.store). */
(function () {
  'use strict';
  var SLUG = 'upi-qr-standee';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$;

  var SAMPLE_VPA = 'yourname@bank';               // obviously a placeholder: "@bank" is not a real UPI handle
  var SAMPLE_PN = 'Sharma General Store';
  var VPA_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  var NOTE_MAX = 50, MAX_SAVED = 12, QUIET = 4, MIN_CM = 2.5;
  var COLORS = ['#0b4f5c', '#c2410c', '#15803d', '#1d4ed8', '#9f1239', '#111827'];
  var DESIGNS = [
    { id: 'standee', icon: '🪧', key: 'd_standee' },
    { id: 'tent', icon: '⛺', key: 'd_tent' },
    { id: 'stickers', icon: '🏷', key: 'd_stickers' },
    { id: 'image', icon: '🖼', key: 'd_image' }
  ];
  var IMG_SIZE = { status: [1080, 1920], square: [1080, 1080] };
  var PAGE_MM = { A5: 148, A4: 210 };

  /* ---------------- state (validated, so a broken store never crashes the app) ---------------- */
  function str(v, max) { return typeof v === 'string' ? v.slice(0, max || 400) : ''; }
  function isLogo(v) { return typeof v === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(v) && v.length < 400000; }
  function cleanProfile(p) {
    if (!p || typeof p !== 'object') return null;
    var vpa = str(p.vpa, 300).trim().toLowerCase();
    if (!VPA_RE.test(vpa)) return null;
    return { vpa: vpa, pn: str(p.pn, 99), shop: str(p.shop, 60), logo: isLogo(p.logo) ? p.logo : '', color: EDU.clamp(+p.color || 0, 0, COLORS.length - 1) };
  }
  function loadState() {
    var s = store.get('state', {}) || {};
    if (typeof s !== 'object' || Array.isArray(s)) s = {};
    var langs = EDU.LANGS.map(function (l) { return l.code; });
    return {
      vpa: typeof s.vpa === 'string' ? s.vpa.slice(0, 400) : SAMPLE_VPA,
      pn: typeof s.pn === 'string' ? s.pn.slice(0, 99) : SAMPLE_PN,
      shop: typeof s.shop === 'string' ? s.shop.slice(0, 60) : null,          // null = sample name in the standee language
      amt: str(s.amt, 14), note: str(s.note, 120),
      logo: isLogo(s.logo) ? s.logo : '',
      slang: langs.indexOf(s.slang) >= 0 ? s.slang : 'auto',
      addEn: s.addEn !== false,
      color: EDU.clamp(Math.round(+s.color) || 0, 0, COLORS.length - 1),
      design: DESIGNS.some(function (d) { return d.id === s.design; }) ? s.design : 'standee',
      paper: s.paper === 'A4' ? 'A4' : 'A5',
      stickers: +s.stickers === 12 ? 12 : 6,
      img: s.img === 'square' ? 'square' : 'status',
      saved: (Array.isArray(s.saved) ? s.saved : []).map(cleanProfile).filter(Boolean).slice(0, MAX_SAVED)
    };
  }
  var state = loadState();
  var saveTimer = 0;
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); }
  function saveNow() { clearTimeout(saveTimer); store.set('state', state); }
  window.addEventListener('pagehide', saveNow);

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- helpers ---------------- */
  /* digits typed on an Indian-language or Urdu keyboard become 0-9 */
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
  function chars(s) { return Array.from(String(s)); }
  /* language of the printed standee: the page language unless the user chose another one */
  function stLang() { return state.slang === 'auto' ? EDU.lang : state.slang; }
  function ts(key, L) {
    var S = window.APP_STRINGS || {};
    return (S[L] && S[L][key]) || (S.en && S.en[key]) || key;
  }
  function fontStackFor(L) {
    var f = EDU.langInfo(L).font;
    return (f ? '"' + f + '", ' : '') + '"Noto Sans", system-ui, "Segoe UI", "Nirmala UI", Roboto, sans-serif';
  }
  /* the shell loads the page language's web font; a different standee language needs its own */
  var fontLinks = {};
  function ensureFont(L) {
    var f = EDU.langInfo(L).font;
    if (!f || fontLinks[f]) return;
    fontLinks[f] = 1;
    if (location.protocol === 'file:' && !navigator.onLine) return;
    if (EDU.langInfo(EDU.lang).font === f) return;
    document.head.appendChild(el('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;700;800&display=swap' }));
  }
  function money(v) { return '₹' + EDU.fmt(+v, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  /* ---------------- UPI payload ---------------- */
  function cleanVpa(raw) { return String(raw || '').trim().toLowerCase(); }
  function parseAmount(raw) {
    var s = asciiDigits(raw).replace(/[\s,₹]/g, '').replace(/^(rs\.?|inr)/i, '').replace(/\/[-=]$/, '');   // "Rs. 1,250/-" -> 1250
    if (!s) return { empty: true };
    if (/^-/.test(s)) return { err: 'err_amt_neg' };
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return { err: 'err_amt_bad' };
    var parts = s.split('.'), dec = parts[1] || '';
    if (dec.length > 2) return { err: 'err_amt_dec' };
    var n = parseFloat(s);
    if (!(n > 0)) return { err: 'err_amt_neg' };
    var whole = (parts[0] || '0').replace(/^0+(?=\d)/, '');
    return { v: whole + '.' + (dec + '00').slice(0, 2), n: n };
  }
  function cleanNote(raw) {
    var s = String(raw || '').replace(/\s+/g, ' ').trim(), c = chars(s);
    return { v: c.slice(0, NOTE_MAX).join('').trim(), cut: c.length > NOTE_MAX };
  }
  function cleanName(raw) { return String(raw || '').replace(/\s+/g, ' ').trim(); }
  /* upi://pay?pa=<VPA>&pn=<name>&am=<amount>&cu=INR&tn=<note> (the UPI deep-link format every UPI app reads) */
  function upiLink(vpa, pn, am, tn) {
    return 'upi://pay?pa=' + vpa + (pn ? '&pn=' + encodeURIComponent(pn) : '') + (am ? '&am=' + am : '') + '&cu=INR' + (tn ? '&tn=' + encodeURIComponent(tn) : '');
  }
  /* everything the designs need, re-computed on each change */
  function compute() {
    var vpa = cleanVpa(state.vpa), r = { vpa: vpa, ok: false, errs: [], warns: [] };
    if (!vpa) r.vpaErr = t('err_vpa_empty');
    else if (!VPA_RE.test(vpa)) r.vpaErr = t('err_vpa', { v: vpa.length > 40 ? chars(vpa).slice(0, 39).join('') + '…' : vpa });
    r.pn = cleanName(state.pn);
    r.pnScript = /[^\x00-\x7F]/.test(r.pn);
    var a = parseAmount(state.amt);
    r.amtErr = a.err ? t(a.err) : '';
    r.am = a.v || '';
    r.amBig = !!(a.n && a.n > 100000);
    var nt = cleanNote(state.note);
    r.tn = nt.v; r.noteCut = nt.cut;
    r.L = stLang();
    /* an untouched "Name on the standee" shows the sample shop only next to the sample UPI ID; with a real UPI ID it
       uses the payee name, so a sample name never ends up on someone's printed standee */
    r.shop = state.shop === null ? (vpa === SAMPLE_VPA ? ts('sample_shop', r.L) : r.pn) : state.shop.trim();
    if (!r.vpaErr && !r.amtErr) {
      r.payload = upiLink(vpa, r.pn, r.am, r.tn);
      var q = QRGen.encode(r.payload, 'M');
      if (q.ok) { r.q = q; r.ok = true; }
    }
    if (!r.payload) r.payload = '';
    return r;
  }

  /* ---------------- QR drawing ---------------- */
  function svgPath(q) {
    var n = q.size, d = '';
    for (var y = 0; y < n; y++) {
      var x = 0;
      while (x < n) {
        if (q.modules[y][x]) {
          var x0 = x;
          while (x < n && q.modules[y][x]) x++;
          d += 'M' + (x0 + QUIET) + ' ' + (y + QUIET) + 'h' + (x - x0) + 'v1h-' + (x - x0) + 'z';
        } else x++;
      }
    }
    return d;
  }
  var svgCache = { key: '', svg: '' };
  /* quiet zone of 4 squares on every side, black on white, error correction level M */
  function qrSvg(q) {
    if (!q) {                                       // a faded placeholder while the UPI ID is wrong
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33" aria-hidden="true"><rect width="33" height="33" fill="#fff"/>' +
        '<path fill="#000" d="M4 4h7v7h-7zM22 4h7v7h-7zM4 22h7v7h-7zM14 14h5v5h-5z"/></svg>';
    }
    var key = q.size + ':' + q.mask + ':' + q.modules.map(function (r) { return r.map(function (b) { return b ? 1 : 0; }).join(''); }).join('');
    if (svgCache.key !== key) {
      var total = q.size + 2 * QUIET;
      svgCache = { key: key, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges" aria-hidden="true">' +
        '<rect width="' + total + '" height="' + total + '" fill="#fff"/><path fill="#000" d="' + svgPath(q) + '"/></svg>' };
    }
    return svgCache.svg;
  }

  /* ---------------- printable designs (DOM, sized in cqw so the preview prints the same) ---------------- */
  var QRW_DEFAULT = { standee: 62, tent: 40, stickers: 70 };
  function div(cls, text, extra) { return el('div', Object.assign({ class: cls, text: text }, extra || {})); }
  /* names typed in English letters keep a Latin font (and normal line height) on an Urdu or Tamil standee */
  function latCls(text) { return /[^\x00-\x7F]/.test(text || '') ? '' : ' lat-txt'; }
  function qrBox(cls, r) { return el('div', { class: 'qrbox ' + cls, html: qrSvg(r.q) }); }
  function logoEl(cls) { return state.logo ? el('img', { class: cls, src: state.logo, alt: '' }) : null; }
  function enLine(r, cls) { return state.addEn && r.L !== 'en' ? div(cls + ' lat', ts('st_scan', 'en'), { lang: 'en', dir: 'ltr' }) : null; }
  /* a long UPI ID wraps after the @ (name@ / bank), not in the middle of the bank handle */
  function vpaLine(r, cls) {
    var d = div(cls + ' ltr', 'UPI ID: ', { dir: 'ltr' }), v = r.vpa || '—', at = v.indexOf('@');
    if (at < 0) d.appendChild(document.createTextNode(v));
    else { d.appendChild(document.createTextNode(v.slice(0, at + 1))); d.appendChild(document.createElement('wbr')); d.appendChild(document.createTextNode(v.slice(at + 1))); }
    return d;
  }

  function buildStandee(r) {
    return [
      el('div', { class: 'st-band' }, logoEl('st-logo'), r.shop ? div('st-shop clamp2' + latCls(r.shop), r.shop, { dir: 'auto' }) : null),
      el('div', { class: 'st-mid' },
        el('div', null, div('st-scan', ts('st_scan', r.L)), enLine(r, 'st-en')),
        qrBox('st-qr', r),
        r.am ? el('div', { class: 'st-amt ltr' }, el('small', { text: ts('st_amount', r.L) }), money(r.am)) : null,
        el('div', null, r.pn ? div('st-payee' + latCls(r.pn), r.pn, { dir: 'auto' }) : null, vpaLine(r, 'st-vpa'))),
      div('st-foot', ts('st_check', r.L))
    ];
  }
  function tentPanel(r, flip) {
    return el('div', { class: 'tt-panel' + (flip ? ' flip' : '') },
      el('div', { class: 'tt-band' }, logoEl(''), div('tt-shop clamp2' + latCls(r.shop), r.shop || ' ', { dir: 'auto' })),
      el('div', { class: 'tt-scanrow' }, div('tt-scan', ts('st_scan', r.L)), enLine(r, 'tt-en')),
      el('div', { class: 'tt-body' },
        qrBox('tt-qr', r),
        el('div', { class: 'tt-text' },
          r.am ? div('tt-amt ltr', money(r.am), { dir: 'ltr' }) : null,
          r.pn ? div('tt-payee' + latCls(r.pn), r.pn, { dir: 'auto' }) : null,
          vpaLine(r, 'tt-vpa'),
          div('tt-check', ts('st_check', r.L)))));
  }
  function buildTent(r) {
    return [tentPanel(r, true), tentPanel(r, false), el('div', { class: 'tt-fold', 'aria-hidden': 'true' }, el('span', { text: t('fold_here') }))];
  }
  function buildStickers(r) {
    var grid = el('div', { class: 'sk-grid' });
    for (var i = 0; i < state.stickers; i++) {
      grid.appendChild(el('div', { class: 'sk' }, el('div', { class: 'sk-in' },
        r.shop ? div('sk-shop clamp2' + latCls(r.shop), r.shop, { dir: 'auto' }) : null,
        qrBox('sk-qr', r),
        div('sk-scan', ts('st_scan', r.L)),               // never cut: the fit step makes room for it
        r.am ? div('sk-vpa ltr', money(r.am), { dir: 'ltr' }) : div('sk-vpa ltr', r.vpa, { dir: 'ltr' }))));
    }
    return [grid];
  }

  /* shrink the QR step by step until nothing overflows its panel (long names, logo, Urdu line height) */
  function fitTargets(sheet) {
    if (state.design === 'standee') return [sheet];
    if (state.design === 'tent') return EDU.$$('.tt-panel', sheet);
    var first = $('.sk', sheet);
    return first ? [first] : [];
  }
  function fits(list) { return list.every(function (n) { return n.scrollHeight <= n.clientHeight + 1 && n.scrollWidth <= n.clientWidth + 1; }); }
  var PRINT_PX = { A5: 148 * 96 / 25.4, A4: 210 * 96 / 25.4 };
  var QRW_MIN = { standee: 46, tent: 32, stickers: 52 };
  function fitSheet() {
    var sheet = $('#sheet'), st = sheet.style;
    if (state.design === 'image' || !sheet.clientHeight) return;
    var list = fitTargets(sheet), d = state.design, w = QRW_DEFAULT[d];
    function setW(x) { w = x; st.setProperty('--qrw', x); }
    /* biggest even QR width in [min, default] that fits (binary search: a smaller QR never fits worse) */
    function search(min) {
      var lo = min, hi = QRW_DEFAULT[d];
      setW(hi); if (fits(list)) return true;
      setW(lo); if (!fits(list)) return false;
      while (hi - lo > 2) {
        var mid = lo + Math.max(1, Math.floor((hi - lo) / 4)) * 2;
        setW(mid); if (fits(list)) lo = mid; else hi = mid;
      }
      setW(lo);
      return true;
    }
    /* measure at the real paper width: text wraps a little differently at each size, and print is what counts */
    st.width = PRINT_PX[d === 'standee' ? state.paper : 'A4'] + 'px'; st.maxWidth = 'none'; st.flex = 'none';
    sheet.classList.remove('tight');
    /* first shrink only the QR a little. If a long name, logo or tall script still does not fit, or smaller text
       would give a clearly bigger QR (long Tamil or Malayalam lines on stickers), use the smaller text */
    var okN = search(QRW_MIN[d]), wN = w;
    if (!okN || wN < QRW_DEFAULT[d]) {
      sheet.classList.add('tight');
      search(24);
      if (okN && w < wN + 6) { sheet.classList.remove('tight'); setW(wN); }
    }
    st.width = ''; st.maxWidth = ''; st.flex = '';
    while (w > 24 && !fits(list)) setW(w - 2);         // the small preview must not overflow either
    sheet.dataset.qrw = w;
    sizeInfo();
  }
  /* real printed size of the code (without its white border), from the share of the paper width it takes */
  function sizeInfo() {
    var info = $('#sizeInfo'), warn = $('#sizeWarn');
    if (state.design === 'image') {
      var sz = IMG_SIZE[state.img];
      info.textContent = t('size_px', { w: EDU.fmt(sz[0]), h: EDU.fmt(sz[1]) });
      warn.hidden = true;
      return;
    }
    if (!cur || !cur.q) { info.textContent = ''; warn.hidden = true; return; }
    var w = +$('#sheet').dataset.qrw || QRW_DEFAULT[state.design], n = cur.q.size, mm;
    if (state.design === 'stickers') mm = (w - 5.6) / 100 * (210 * 0.94 / (state.stickers === 12 ? 3 : 2));
    else mm = (w - 3.2) / 100 * (state.design === 'standee' ? PAGE_MM[state.paper] : 210);
    var cm = mm * n / (n + 2 * QUIET) / 10;
    info.textContent = t('size_info', { cm: EDU.fmt(Math.round(cm * 10) / 10) });
    warn.hidden = cm >= MIN_CM;
    $('#sheet').dataset.cm = cm.toFixed(2);
  }

  function renderSheet(r) {
    var sheet = $('#sheet'), L = r.L, d = state.design;
    var paper = d === 'standee' ? state.paper : 'A4';
    sheet.className = 'sheet no-i18n d-' + d + ' p-' + paper + (L === 'ur' ? ' is-ur' : '') + (r.ok ? '' : ' is-off');
    sheet.style.setProperty('--band', COLORS[state.color]);
    sheet.style.setProperty('--sfont', fontStackFor(L));
    sheet.style.setProperty('--cols', state.stickers === 12 ? 3 : 2);
    sheet.style.setProperty('--rows', state.stickers === 12 ? 4 : 3);
    sheet.setAttribute('lang', L);
    sheet.setAttribute('dir', EDU.langInfo(L).dir);
    sheet.setAttribute('aria-label', t('qr_alt', { name: r.pn || r.shop || r.vpa }));
    sheet.dataset.ok = r.ok ? '1' : '0';
    sheet.dataset.size = r.q ? r.q.size : '0';
    sheet.innerHTML = '';
    var parts = d === 'tent' ? buildTent(r) : d === 'stickers' ? buildStickers(r) : buildStandee(r);
    parts.forEach(function (p) { if (p) sheet.appendChild(p); });
    $('#pageSize').textContent = '@page { size: ' + (d === 'standee' ? paper : 'A4') + ' portrait; margin: ' + (d === 'image' ? '10mm' : '0') + '; }';
    fitSheet();
  }

  /* ---------------- PNG poster (canvas): WhatsApp status, square post, or the standee as an image ---------------- */
  function graphemes(s) {
    try { if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s), function (x) { return x.segment; }); } catch (e) { }
    return Array.from(s);
  }
  function wrapLines(ctx, text, maxW, maxLines) {
    var words = String(text).trim().split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) {
      var test = cur ? cur + ' ' + w : w;
      if (!cur || ctx.measureText(test).width <= maxW) cur = test; else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    var out = [];
    lines.forEach(function (ln) {                       // split words wider than the line
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
  var RTL_RE = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
  function rrect(ctx, x, y, w, h, rad) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad); else ctx.rect(x, y, w, h);
    ctx.fill();
  }
  function drawQrBox(ctx, q, x, y, s, band) {
    var b = Math.max(2, s * 0.012), p = s * 0.012;
    ctx.fillStyle = band; rrect(ctx, x, y, s, s, s * 0.05);
    ctx.fillStyle = '#fff'; rrect(ctx, x + b, y + b, s - 2 * b, s - 2 * b, s * 0.04);
    var total = q.size + 2 * QUIET, inner = s - 2 * (b + p), m = inner / total;
    if (m >= 2) m = Math.floor(m);                    // whole pixels per square: sharp edges for scanners
    var ox = Math.round(x + (s - m * total) / 2), oy = Math.round(y + (s - m * total) / 2);
    ctx.fillStyle = '#000';
    for (var yy = 0; yy < q.size; yy++) for (var xx = 0; xx < q.size; xx++) {
      if (q.modules[yy][xx]) ctx.fillRect(ox + (xx + QUIET) * m, oy + (yy + QUIET) * m, Math.ceil(m), Math.ceil(m));
    }
  }
  var logoImg = null;
  function loadLogoImg(cb) {
    logoImg = null;
    if (!state.logo) { if (cb) cb(); return; }
    var im = new Image();
    im.onload = function () { logoImg = im; if (cb) cb(); };
    im.onerror = function () { if (cb) cb(); };
    im.src = state.logo;
  }
  function drawPoster(cv, W, H, r) {
    var L = r.L, fam = fontStackFor(L), lat = '"Noto Sans", system-ui, "Segoe UI", Roboto, sans-serif';
    var band = COLORS[state.color], sq = H / W < 1.2, pad = W * 0.06, maxW = W - 2 * pad, cx = W / 2;
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    function famFor(text) { return /[^\x00-\x7F]/.test(text) ? fam : lat; }     // English shop names keep a Latin font
    function block(text, px, weight, f, maxLines, color) {
      if (!text) return null;
      ctx.font = weight + ' ' + Math.round(px) + 'px ' + f;
      var lines = wrapLines(ctx, text, maxW, maxLines), lh = px * (f === fam && L === 'ur' ? 1.8 : 1.3);
      return { lines: lines, font: ctx.font, color: color, lh: lh, h: lines.length * lh, rtl: RTL_RE.test(text) };
    }
    function drawBlock(bk, y) {
      ctx.font = bk.font; ctx.fillStyle = bk.color;
      try { ctx.direction = bk.rtl ? 'rtl' : 'ltr'; } catch (e) { }
      bk.lines.forEach(function (ln, i) { ctx.fillText(ln, cx, y + bk.lh * i + bk.lh / 2); });
      return y + bk.h;
    }
    /* lay everything out at text scale f; shrink the text until the QR gets a good share of the image */
    function layout(f) {
      var z = (sq ? 1 : 1.12) * f, o = {};
      o.shopB = block(r.shop, W * (sq ? 0.06 : 0.078) * f, 800, famFor(r.shop), 2, '#fff');
      o.logoS = logoImg ? W * (sq ? 0.11 : 0.16) * f : 0;
      o.bandH = pad * 0.8 * f + (o.logoS ? o.logoS + W * 0.025 * f : 0) + (o.shopB ? o.shopB.h : 0) + pad * 0.7 * f;
      o.footB = block(ts('st_check', L), W * 0.03 * z, 600, fam, 3, '#fff');
      o.footH = o.footB.h + W * 0.05 * f;
      o.tight = W * 0.012 * f;
      var g = [];                                       // groups are spaced evenly; lines inside a group stay close
      g.push([block(ts('st_scan', L), W * (sq ? 0.045 : 0.056) * f, 800, fam, 4, '#111'),     // fixed text is never cut short
        state.addEn && L !== 'en' ? block(ts('st_scan', 'en'), W * 0.033 * z, 600, lat, 1, '#444') : null]);
      g.push('qr');
      if (r.am) g.push([block(money(r.am), W * 0.075 * z, 800, lat, 1, '#111')]);
      g.push([r.pn ? block(r.pn, W * 0.042 * z, 700, famFor(r.pn), 2, '#111') : null, block('UPI ID: ' + r.vpa, W * 0.034 * z, 600, lat, 2, '#222')]);
      o.groups = g.map(function (x) { return x === 'qr' ? x : x.filter(Boolean); });
      o.gh = function (x) { return x.reduce(function (h, bk, i) { return h + bk.h + (i ? o.tight : 0); }, 0); };
      var fixed = o.bandH + o.footH;
      o.groups.forEach(function (x) { if (x !== 'qr') fixed += o.gh(x); });
      var gaps = o.groups.length + 1;
      o.qs = Math.min(H - fixed - gaps * W * 0.035, W * (sq ? 0.5 : 0.74));
      o.gap = (H - fixed - o.qs) / gaps;
      return o;
    }
    var f = 1, o = layout(f);
    while (o.qs < W * (sq ? 0.4 : 0.6) && f > 0.6) { f -= 0.06; o = layout(f); }
    o.qs = Math.max(o.qs, W * 0.25);
    /* header band: logo + shop name */
    ctx.fillStyle = band; ctx.fillRect(0, 0, W, o.bandH);
    var y = pad * 0.8 * f;
    if (o.logoS) {
      var s = o.logoS;
      ctx.fillStyle = '#fff'; rrect(ctx, cx - s / 2, y, s, s, s * 0.18);
      var ip = s * 0.08, k = Math.min((s - 2 * ip) / logoImg.width, (s - 2 * ip) / logoImg.height);
      var iw = logoImg.width * k, ih = logoImg.height * k;
      ctx.drawImage(logoImg, cx - iw / 2, y + (s - ih) / 2, iw, ih);
      y += s + W * 0.025 * f;
    }
    if (o.shopB) drawBlock(o.shopB, y);
    /* middle: scan line, QR, amount, payee */
    y = o.bandH + o.gap;
    o.groups.forEach(function (g) {
      if (g === 'qr') { drawQrBox(ctx, r.q, cx - o.qs / 2, y, o.qs, band); y += o.qs + o.gap; return; }
      g.forEach(function (bk, i) { y = drawBlock(bk, y + (i ? o.tight : 0)); });
      y += o.gap;
    });
    /* footer band */
    ctx.fillStyle = band; ctx.fillRect(0, H - o.footH, W, o.footH);
    drawBlock(o.footB, H - o.footH + W * 0.025 * f);
    try { ctx.direction = 'ltr'; } catch (e) { }
  }
  /* wait (briefly) for the standee language's web font so the PNG is not drawn in a fallback font */
  function fontReady(L) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var p = document.fonts.load('800 40px ' + fontStackFor(L), ts('st_scan', L)).catch(function () { });
    return Promise.race([p, new Promise(function (res) { setTimeout(res, 1500); })]);
  }
  function renderImage(r) {
    var cv = $('#imgCanvas'), sz = IMG_SIZE[state.img];
    cv.setAttribute('aria-label', t('qr_alt', { name: r.pn || r.shop || r.vpa }));
    cv.dataset.ok = r.ok ? '1' : '0';
    cv.classList.toggle('is-sq', state.img === 'square');
    if (!r.ok) {
      cv.width = sz[0]; cv.height = sz[1];
      var c = cv.getContext('2d'); c.fillStyle = '#f2f2f2'; c.fillRect(0, 0, sz[0], sz[1]);
      return;
    }
    drawPoster(cv, sz[0], sz[1], r);
  }

  /* ---------------- main render ---------------- */
  var cur = null;
  function show(id, on, text) { var n = $(id); n.hidden = !on; if (text !== undefined) n.textContent = text || ''; }
  function render() {
    var r = compute();
    cur = r;
    show('#vpaErr', !!r.vpaErr, r.vpaErr);
    show('#sampleNote', r.vpa === SAMPLE_VPA);
    var pnMsg = r.pnScript ? t('warn_pn_script') : (!r.pn && !r.vpaErr ? t('warn_pn_empty') : '');
    show('#pnWarn', !!pnMsg, pnMsg);
    show('#amtErr', !!r.amtErr, r.amtErr);
    show('#amtWarn', r.amBig && !r.amtErr);
    show('#noteCut', r.noteCut);
    $('#noteCount').textContent = EDU.fmt(chars(r.tn).length) + '/' + EDU.fmt(NOTE_MAX);
    $('#vpa').setAttribute('aria-invalid', String(!!r.vpaErr));
    $('#amt').setAttribute('aria-invalid', String(!!r.amtErr));
    $('#payload').textContent = r.payload || '—';
    ['#btnPrint', '#btnPng', '#btnCopy'].forEach(function (s) { $(s).disabled = !r.ok; });
    $('#btnCounter').disabled = !!r.vpaErr;
    $('#btnPrint').hidden = state.design === 'image';
    $('#btnPng').classList.toggle('wide', state.design === 'image');
    syncDesignUI();
    var img = state.design === 'image';
    $('#sheet').hidden = img;
    $('#imgCanvas').hidden = !img;
    renderSheet(r);
    if (img) renderImage(r);
    sizeInfo();
    renderSaved();
    if (cmOpen) cmUpdate();
  }
  var rTimer = 0;
  function renderSoon() { clearTimeout(rTimer); rTimer = setTimeout(render, 30); }

  /* ---------------- inputs ---------------- */
  function syncInputs() {
    $('#vpa').value = state.vpa;
    $('#pn').value = state.pn;
    $('#shop').value = state.shop === null ? '' : state.shop;
    $('#shop').placeholder = ts('sample_shop', stLang());
    $('#amt').value = state.amt;
    $('#note').value = state.note;
    $('#addEn').checked = state.addEn;
    $('#slang').value = state.slang;
    var lp = $('#logoPrev');
    lp.hidden = !state.logo; if (state.logo) lp.src = state.logo; else lp.removeAttribute('src');
    $('#btnLogoDel').hidden = !state.logo;
    EDU.$$('#swatches .swatch').forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === state.color)); });
  }
  function buildLangSelect() {
    var sel = $('#slang'); sel.innerHTML = '';
    sel.appendChild(el('option', { value: 'auto', text: t('slang_auto') }));
    EDU.LANGS.forEach(function (l) { sel.appendChild(el('option', { value: l.code, text: l.native })); });
    sel.value = state.slang;
  }
  function buildSwatches() {
    var box = $('#swatches'); box.innerHTML = '';
    COLORS.forEach(function (c, i) {
      box.appendChild(el('button', { type: 'button', class: 'swatch', id: 'color-' + i, style: { background: c }, 'aria-pressed': String(i === state.color),
        'aria-label': t('color_n', { n: EDU.fmt(i + 1) }), title: t('color_n', { n: EDU.fmt(i + 1) }),
        onclick: function () { state.color = i; saveSoon(); syncInputs(); render(); } }));
    });
  }
  function buildDesigns() {
    var box = $('#designs'); box.innerHTML = '';
    DESIGNS.forEach(function (d) {
      box.appendChild(el('button', { type: 'button', class: 'dz', id: 'd-' + d.id, 'aria-pressed': String(state.design === d.id),
        onclick: function () { state.design = d.id; saveSoon(); render(); } },
        el('span', { class: 'ico', 'aria-hidden': 'true', text: d.icon }), el('span', { i18n: d.key })));
    });
  }
  function syncDesignUI() {
    DESIGNS.forEach(function (d) { $('#d-' + d.id).setAttribute('aria-pressed', String(state.design === d.id)); });
    $('#segPaper').hidden = state.design !== 'standee';
    $('#segStk').hidden = state.design !== 'stickers';
    $('#segImg').hidden = state.design !== 'image';
    EDU.$$('#segPaper button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === state.paper)); });
    EDU.$$('#segStk button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.v === state.stickers)); b.textContent = t('stickers_n', { n: EDU.fmt(+b.dataset.v) }); });
    EDU.$$('#segImg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === state.img)); });
  }

  /* a pasted "upi://pay?..." link (e.g. copied from a bank app) fills the fields */
  function readUpiLink(v) {
    if (!/^\s*upi:\/\//i.test(v)) return false;
    try {
      var q = {};                                       // parameter names in any case (UPI://PAY?PA=...)
      new URL(v.trim()).searchParams.forEach(function (val, k) { k = k.toLowerCase(); if (!(k in q)) q[k] = val; });
      var pa = cleanVpa(q.pa);
      if (!pa) return false;
      /* the link describes the whole payment: fields it leaves out are cleared, not kept from before */
      state.vpa = pa;
      state.pn = String(q.pn || '').slice(0, 99);
      state.amt = String(q.am || '').slice(0, 14);
      state.note = String(q.tn || '').slice(0, 120);
      syncInputs();
      EDU.toast(t('link_read'));
      return true;
    } catch (e) { return false; }
  }
  function onField(id, key) {
    $(id).addEventListener('input', function () {
      if (key === 'vpa' && readUpiLink(this.value)) { saveSoon(); render(); return; }
      state[key] = this.value;
      /* typing your own UPI ID clears the untouched sample payee name, so it cannot slip into a real QR */
      if (key === 'vpa' && state.pn === SAMPLE_PN && cleanVpa(this.value) !== SAMPLE_VPA) { state.pn = ''; $('#pn').value = ''; }
      saveSoon(); renderSoon();
    });
  }
  onField('#vpa', 'vpa'); onField('#pn', 'pn'); onField('#shop', 'shop'); onField('#amt', 'amt'); onField('#note', 'note');
  $('#vpa').addEventListener('blur', function () {                   // tidy: no spaces at the ends, lower case
    var v = cleanVpa(this.value);
    if (v !== this.value) { this.value = v; state.vpa = v; saveSoon(); render(); }
  });
  $('#addEn').addEventListener('change', function () { state.addEn = this.checked; saveSoon(); render(); });
  $('#slang').addEventListener('change', function () {
    state.slang = this.value; ensureFont(stLang());
    $('#shop').placeholder = ts('sample_shop', stLang());
    saveSoon(); render();
  });
  EDU.$$('#segPaper button').forEach(function (b) { b.addEventListener('click', function () { state.paper = b.dataset.v; saveSoon(); render(); }); });
  EDU.$$('#segStk button').forEach(function (b) { b.addEventListener('click', function () { state.stickers = +b.dataset.v; saveSoon(); render(); }); });
  EDU.$$('#segImg button').forEach(function (b) { b.addEventListener('click', function () { state.img = b.dataset.v; saveSoon(); render(); }); });

  /* ---------------- logo (read and shrunk on the device, never uploaded) ---------------- */
  $('#btnLogo').addEventListener('click', function () {
    EDU.pickFile('image/png,image/jpeg,image/webp,image/gif,image/bmp').then(function (file) {
      if (!file) return;
      if (!/^image\//.test(file.type || '') || file.size > 15 * 1024 * 1024) { EDU.toast(t('logo_bad')); return; }
      var fr = new FileReader();
      fr.onerror = function () { EDU.toast(t('logo_bad')); };
      fr.onload = function () {
        var im = new Image();
        im.onerror = function () { EDU.toast(t('logo_bad')); };
        im.onload = function () {
          var k = Math.min(1, 240 / Math.max(im.width, im.height)), w = Math.max(1, Math.round(im.width * k)), h = Math.max(1, Math.round(im.height * k));
          var c = document.createElement('canvas'); c.width = w; c.height = h;
          var cx = c.getContext('2d'); cx.drawImage(im, 0, 0, w, h);
          var url = c.toDataURL('image/png');
          if (url.length > 350000) { cx.globalCompositeOperation = 'destination-over'; cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); url = c.toDataURL('image/jpeg', 0.86); }
          state.logo = url; saveSoon(); syncInputs(); loadLogoImg(render);
        };
        im.src = String(fr.result);
      };
      fr.readAsDataURL(file);
    });
  });
  $('#btnLogoDel').addEventListener('click', function () { state.logo = ''; logoImg = null; saveSoon(); syncInputs(); render(); $('#btnLogo').focus(); });

  /* ---------------- saved UPI IDs ---------------- */
  function renderSaved() {
    var row = $('#savedRow'); row.innerHTML = '';
    if (!state.saved.length) { row.appendChild(el('p', { class: 'small muted saved-none', text: t('saved_none') })); return; }
    var now = cur ? cur.vpa : '';
    state.saved.forEach(function (p, i) {
      var name = p.shop || p.pn || p.vpa;
      row.appendChild(el('span', { class: 'sv no-i18n', 'data-on': String(p.vpa === now) },
        el('button', { type: 'button', class: 'sv-use', 'aria-label': t('use_id', { id: p.vpa }), title: p.vpa, onclick: function () { useProfile(i); } },
          el('span', { dir: 'auto', text: name }), el('small', { text: p.vpa })),
        el('button', { type: 'button', class: 'sv-del', 'aria-label': t('del_id', { id: p.vpa }), title: t('del_id', { id: p.vpa }), text: '✕',
          onclick: function () {
            state.saved.splice(i, 1); saveSoon(); renderSaved(); EDU.toast(t('removed_toast'));
            var next = EDU.$$('#savedRow .sv-use')[Math.min(i, state.saved.length - 1)];
            (next || $('#btnSave')).focus();
          } })));
    });
  }
  function useProfile(i) {
    var p = state.saved[i]; if (!p) return;
    state.vpa = p.vpa; state.pn = p.pn; state.shop = p.shop; state.logo = p.logo; state.color = p.color;
    saveSoon(); syncInputs(); loadLogoImg(render);
  }
  $('#btnSave').addEventListener('click', function () {
    var r = compute();
    if (r.vpaErr) { EDU.toast(r.vpaErr); $('#vpa').focus(); return; }
    var p = { vpa: r.vpa, pn: r.pn, shop: state.shop === null ? r.shop : state.shop.trim(), logo: state.logo, color: state.color };
    var idx = -1;
    state.saved.forEach(function (x, i) { if (x.vpa === p.vpa) idx = i; });
    if (idx >= 0) state.saved[idx] = p;
    else if (state.saved.length >= MAX_SAVED) { EDU.toast(t('max_saved', { n: EDU.fmt(MAX_SAVED) })); return; }
    else state.saved.push(p);
    saveNow(); renderSaved(); EDU.toast(t('saved_toast'));
  });

  /* ---------------- actions ---------------- */
  function fileName() {
    var base = String(cur.shop || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    if (!base) base = cur.vpa.split('@')[0].replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    return 'upi-qr-' + (base || 'shop') + (state.design === 'image' ? '-' + state.img : '') + '.png';
  }
  $('#btnPng').addEventListener('click', function () {
    if (!cur || !cur.ok) return;
    var r = cur;
    fontReady(r.L).then(function () {
      var cv;
      if (state.design === 'image') { cv = $('#imgCanvas'); renderImage(r); }
      else { cv = document.createElement('canvas'); drawPoster(cv, 1240, 1754, r); }   // the standee as an A-size image
      EDU.downloadCanvas(cv, fileName());
    });
  });
  $('#btnPrint').addEventListener('click', function () { if (cur && cur.ok && state.design !== 'image') { fitSheet(); window.print(); } });
  $('#btnCopy').addEventListener('click', function () { if (cur && cur.ok) EDU.copy(cur.payload); });
  $('#btnReset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state');
    state = loadState(); logoImg = null;
    syncInputs(); buildLangSelect(); render();
  });

  /* ---------------- counter mode: QR with the bill amount, shown to the customer ---------------- */
  var cmOpen = false, wakeLock = null;
  function cmUpdate() {
    var r = cur, a = parseAmount($('#cmAmt').value), qr = $('#cmQr'), msg = $('#cmMsg');
    $('#cmShop').textContent = r.shop || '';
    $('#cmPayee').textContent = (r.pn ? r.pn + ' · ' : '') + r.vpa;
    msg.classList.toggle('err', !!a.err);
    var q = null, payload = '';
    if (!a.err && !a.empty && !r.vpaErr) {
      payload = upiLink(r.vpa, r.pn, a.v, r.tn);
      q = QRGen.encode(payload, 'M');
      if (!q.ok) q = null;
    }
    qr.classList.toggle('is-off', !q);
    qr.innerHTML = q ? qrSvg(q) : '';
    qr.dataset.payload = q ? payload : '';
    qr.setAttribute('aria-label', t('qr_alt', { name: r.pn || r.shop || r.vpa }));
    $('#cmAmount').textContent = q ? money(a.v) : '';
    msg.textContent = a.err ? t(a.err) : (q ? '' : t('cm_type'));
  }
  function openCounter() {
    if (!cur || cur.vpaErr) return;
    cmOpen = true;
    var box = $('#counter');
    box.hidden = false;
    $('#cmAmt').value = '';
    cmUpdate();
    EDU.fullscreen(box);
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { wakeLock = w; }, function () { }); } catch (e) { }
    $('#cmAmt').focus();
  }
  function closeCounter() {
    if (!cmOpen) return;
    cmOpen = false;
    $('#counter').hidden = true;
    try { if (wakeLock) wakeLock.release(); } catch (e) { }
    wakeLock = null;
    function back() { if (!cmOpen) $('#btnCounter').focus(); }
    /* focus cannot move to the page while it is still full screen, so return it once full screen has ended */
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      document.addEventListener('fullscreenchange', function once() { document.removeEventListener('fullscreenchange', once); back(); });
      setTimeout(back, 500);
      EDU.fullscreen();
    } else back();
  }
  $('#btnCounter').addEventListener('click', openCounter);
  $('#cmClose').addEventListener('click', closeCounter);
  $('#cmNew').addEventListener('click', function () { $('#cmAmt').value = ''; cmUpdate(); $('#cmAmt').focus(); });
  $('#cmAmt').addEventListener('input', cmUpdate);
  $('#cmAmt').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); this.blur(); } });   // hides the phone keyboard so the QR is in view
  document.addEventListener('keydown', function (e) {
    if (!cmOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeCounter(); return; }
    if (e.key === 'Tab') {                                                   // keep focus inside the counter screen
      var f = EDU.$$('#counter input, #counter button'), i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (cmOpen && document.visibilityState === 'visible' && navigator.wakeLock && !wakeLock) {
      try { navigator.wakeLock.request('screen').then(function (w) { wakeLock = w; }, function () { }); } catch (e) { }
    }
  });

  /* ---------------- language, fonts, resize ---------------- */
  EDU.onLang(function () {
    buildLangSelect(); buildSwatches(); ensureFont(stLang());
    $('#shop').placeholder = ts('sample_shop', stLang());
    render();
  });
  var fontTimer = 0;
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', function () { clearTimeout(fontTimer); fontTimer = setTimeout(render, 80); });
  }
  var rsTimer = 0;
  window.addEventListener('resize', function () { clearTimeout(rsTimer); rsTimer = setTimeout(fitSheet, 150); });
  window.addEventListener('beforeprint', fitSheet);

  buildLangSelect();
  buildSwatches();
  buildDesigns();
  syncInputs();
  ensureFont(stLang());
  loadLogoImg();
  render();
  if (state.logo) loadLogoImg(render);
})();
