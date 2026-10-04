/* Festival Greeting & Offer Poster: a small "Canva" for Indian festival wishes and shop offers.
 * Everything is drawn on a canvas in the browser: procedural ornaments (art.js), the user's logo and
 * photo (read with FileReader-style object URLs, never uploaded), a UPI / WhatsApp / link QR (qr.js),
 * and text that auto-fits (measureText + binary search), with RTL for Urdu.
 * Export PNG / JPG, share files to WhatsApp (navigator.share), print A4 / A5, and make 3 languages at once. */
(function () {
  'use strict';
  var SLUG = 'festival-poster-maker';
  var D = window.FPM_DATA, A = window.FPM_ART, C = window.APP_CONTENT;
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$;
  var PI = Math.PI, TAU = PI * 2;
  var CODES = EDU.LANGS.map(function (l) { return l.code; });
  var SCRIPT_OF = { en: 'latn', hi: 'deva', mr: 'deva', bn: 'beng', pa: 'guru', gu: 'gujr', or: 'orya', ta: 'taml', te: 'telu', kn: 'knda', ml: 'mlym', ur: 'arab' };
  var SYS = {
    latn: '"Noto Sans", "Segoe UI", Roboto, "Helvetica Neue", Arial',
    deva: '"Noto Sans Devanagari", "Nirmala UI", "Kohinoor Devanagari", "Devanagari Sangam MN", Mangal',
    beng: '"Noto Sans Bengali", "Nirmala UI", "Kohinoor Bangla", "Bangla Sangam MN", Vrinda',
    guru: '"Noto Sans Gurmukhi", "Nirmala UI", "Gurmukhi Sangam MN", "Mukta Mahee", Raavi',
    gujr: '"Noto Sans Gujarati", "Nirmala UI", "Kohinoor Gujarati", "Gujarati Sangam MN", Shruti',
    orya: '"Noto Sans Oriya", "Nirmala UI", "Oriya Sangam MN", Kalinga',
    taml: '"Noto Sans Tamil", "Nirmala UI", "Tamil Sangam MN", Latha',
    telu: '"Noto Sans Telugu", "Nirmala UI", "Kohinoor Telugu", "Telugu Sangam MN", Gautami',
    knda: '"Noto Sans Kannada", "Nirmala UI", "Kannada Sangam MN", Tunga',
    mlym: '"Noto Sans Malayalam", "Nirmala UI", "Malayalam Sangam MN", Kartika',
    arab: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", "Noto Naskh Arabic", "Segoe UI", Tahoma'
  };
  var EMOJI = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"';
  /* optional festive OFL fonts (Fontsource on jsDelivr, pinned): Baloo family per script + Noto Nastaliq Urdu */
  var FONT_CDN = 'https://cdn.jsdelivr.net/npm/@fontsource/';
  var FESTIVE = {
    latn: ['baloo-2', 'baloo-2-latin'], deva: ['baloo-2', 'baloo-2-devanagari'], beng: ['baloo-da-2', 'baloo-da-2-bengali'],
    gujr: ['baloo-bhai-2', 'baloo-bhai-2-gujarati'], guru: ['baloo-paaji-2', 'baloo-paaji-2-gurmukhi'], orya: ['baloo-bhaina-2', 'baloo-bhaina-2-oriya'],
    taml: ['baloo-thambi-2', 'baloo-thambi-2-tamil'], telu: ['baloo-tammudu-2', 'baloo-tammudu-2-telugu'], knda: ['baloo-tamma-2', 'baloo-tamma-2-kannada'],
    mlym: ['baloo-chettan-2', 'baloo-chettan-2-malayalam'], arab: ['noto-nastaliq-urdu', 'noto-nastaliq-urdu-arabic']
  };
  var RTL_RE = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
  var INDIC_RE = /[ऀ-෿]/;
  var UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/;
  var SAMPLE_PHONE = '+91 98765 43210';
  var PREVIEW_MAX = 2000;

  var TPL = {}; D.TEMPLATES.forEach(function (tp) { TPL[tp.id] = tp; });
  var SIZE = {}; D.SIZES.forEach(function (s) { SIZE[s.id] = s; });

  /* ---------------------------------------------------------------- state */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  var saved = obj(store.get('state', {}));
  var S = {
    tpl: TPL[saved.tpl] ? saved.tpl : null,
    size: SIZE[saved.size] ? saved.size : 'story',
    posterLang: CODES.indexOf(saved.posterLang) >= 0 ? saved.posterLang : null,
    font: saved.font === 'festive' ? 'festive' : 'simple',
    pal: obj(saved.pal), seed: obj(saved.seed), custom: obj(saved.custom), dates: obj(saved.dates),
    biz: saved.biz && typeof saved.biz === 'object' ? saved.biz : null,
    qr: ['none', 'upi', 'wa', 'link'].indexOf(saved.qr) >= 0 ? saved.qr : 'none',
    upi: typeof saved.upi === 'string' ? saved.upi : '', link: typeof saved.link === 'string' ? saved.link : '',
    logoPlate: saved.logoPlate === undefined ? true : !!saved.logoPlate, shape: ['circle', 'arch', 'round'].indexOf(saved.shape) >= 0 ? saved.shape : 'circle',
    zoom: clamp(+saved.zoom || 1, 1, 3), ox: clamp(+saved.ox || 0, -1, 1), oy: clamp(+saved.oy || 0, -1, 1),
    multi: Array.isArray(saved.multi) ? saved.multi.filter(function (c, i, a) { return CODES.indexOf(c) >= 0 && a.indexOf(c) === i; }).slice(0, 3) : null
  };
  if (S.biz) ['name', 'offer', 'phone', 'address', 'handle'].forEach(function (k) { S.biz[k] = typeof S.biz[k] === 'string' ? S.biz[k] : ''; });
  var saveT = null;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { store.set('state', S); }, 250); }

  /* images: { src: dataURL, w, h } + decoded <img> */
  var imgRec = { logo: store.get('logo', null), photo: store.get('photo', null) };
  var imgEl = { logo: null, photo: null };

  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  var canvas = $('#poster');
  var rev = 0, lastLayout = null, previewScale = 1;

  /* ---------------------------------------------------------------- dates */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function dayNum(s) { return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5; }
  function addDays(s, n) { var d = new Date((dayNum(s) + n) * 864e5); return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate()); }
  /* a festival still counts while it is on (span = extra days): Navratri's 9 nights, New Year in the first week of
     January (so a 2 Jan poster still says the new year, not the next one) */
  function stillOn(d, tp, today) { return (tp.span ? addDays(d, tp.span) : d) >= today; }
  function builtinNext(tp, today) {
    if (tp.fixed) {
      var y = +today.slice(0, 4);
      for (var yy = y - 1; yy <= y + 1; yy++) if (stillOn(yy + '-' + tp.fixed, tp, today)) return yy + '-' + tp.fixed;
      return null;
    }
    var ds = (tp.dates || []).filter(function (x) { return stillOn(x, tp, today); }).sort();
    return ds[0] || null;
  }
  function nextDate(tp) {
    if (tp.kind !== 'fest') return null;
    var today = todayStr(), o = S.dates[tp.id];
    if (typeof o === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o) && stillOn(o, tp, today)) return o;
    return builtinNext(tp, today);
  }
  function sortedFestivals() {
    var list = D.TEMPLATES.filter(function (tp) { return tp.kind === 'fest'; }).map(function (tp, i) { return { tp: tp, date: nextDate(tp), i: i }; });
    list.sort(function (a, b) {
      if (a.date && b.date) return a.date < b.date ? -1 : a.date > b.date ? 1 : a.i - b.i;
      if (a.date) return -1; if (b.date) return 1; return a.i - b.i;
    });
    return list;
  }
  if (!S.tpl) S.tpl = (sortedFestivals()[0] || { tp: D.TEMPLATES[0] }).tp.id;

  /* ---------------------------------------------------------------- content helpers */
  function posterLang() { return S.posterLang || EDU.lang; }
  function CC(lang) { return C[lang] || C.en; }
  function suggested(id, lang) { var c = CC(lang).tpl[id] || C.en.tpl[id]; return { greet: c.greet, wish: c.wish }; }
  function posterText(id, lang) {
    var s = suggested(id, lang), cu = obj(S.custom[id + '|' + lang]);
    return { greet: typeof cu.greet === 'string' ? cu.greet : s.greet, wish: typeof cu.wish === 'string' ? cu.wish : s.wish };
  }
  function sampleBiz(lang) { var sm = CC(lang).sample; return { name: sm.name, offer: sm.offer, phone: SAMPLE_PHONE, address: sm.address, handle: sm.handle }; }
  function bizVals(lang) { return S.biz || sampleBiz(lang); }

  /* ---------------------------------------------------------------- QR */
  var qrCache = { key: null, val: null };
  function waDigits(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length === 10) return '91' + d;
    if (d.length === 11 && d.charAt(0) === '0') return '91' + d.slice(1);
    if (d.length === 12 && d.slice(0, 2) === '91') return d;
    if (d.length >= 11 && d.length <= 15 && String(phone).trim().charAt(0) === '+') return d;
    return null;
  }
  function qrInfo(biz) {
    if (S.qr === 'none') return { none: true };
    var payload, label;
    if (S.qr === 'upi') {
      var id = S.upi.trim();
      if (!UPI_RE.test(id)) return { err: id ? 'upi_bad' : 'upi_empty' };
      var pn = (biz.name || '').trim();
      payload = 'upi://pay?pa=' + encodeURIComponent(id).replace(/%40/g, '@') + (pn && /^[A-Za-z0-9 .&'-]{1,60}$/.test(pn) ? '&pn=' + encodeURIComponent(pn) : '') + '&cu=INR';
      label = 'pay';
    } else if (S.qr === 'wa') {
      var dg = waDigits(biz.phone);
      if (!dg) return { err: 'wa_need' };
      payload = 'https://wa.me/' + dg; label = 'chat';
    } else {
      var u = S.link.trim();
      if (!/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(u)) return { err: u ? 'link_bad' : 'link_empty' };
      payload = u; label = 'link';
    }
    if (qrCache.key === payload) return qrCache.val;
    var q = window.QRGen ? QRGen.encode(payload, 'M') : { ok: false };
    var val = q.ok ? { ok: true, modules: q.modules, size: q.size, payload: payload, label: label } : { err: 'qr_long' };
    qrCache = { key: payload, val: val };
    return val;
  }

  /* ---------------------------------------------------------------- fonts */
  var fontOK = {}, fontPromise = {}, fontFailAt = {};
  var FONT_RETRY_MS = 60000;   /* after a failed download, don't retry on every keystroke (offline / slow CDN) */
  function stack(sc, festive) {
    var parts = [];
    if (festive && fontOK[sc]) parts.push('"FPM ' + sc + '"');
    if (festive && fontOK.latn && sc !== 'latn') parts.push('"FPM latn"');
    parts.push(SYS[sc] || SYS.latn);
    if (sc !== 'latn') parts.push(SYS.latn);
    parts.push('"Nirmala UI"', 'sans-serif', EMOJI);
    return parts.join(', ');
  }
  function withTimeout(p, ms) { return Promise.race([p, new Promise(function (res) { setTimeout(function () { res('timeout'); }, ms); })]); }
  function ensureFestive(sc) {
    if (fontPromise[sc]) return fontPromise[sc];
    if (!window.FontFace || !document.fonts || !FESTIVE[sc]) { fontPromise[sc] = Promise.resolve(false); return fontPromise[sc]; }
    if (fontFailAt[sc] && Date.now() - fontFailAt[sc] < FONT_RETRY_MS) return Promise.resolve(false);
    var f = FESTIVE[sc], faces = [];
    var loads = ['700', '500'].map(function (w) {
      var ff = new FontFace('FPM ' + sc, 'url(' + FONT_CDN + f[0] + '@5.2.6/files/' + f[1] + '-' + w + '-normal.woff2) format("woff2")', { weight: w, style: 'normal' });
      faces.push(ff);
      document.fonts.add(ff);
      return ff.load();
    });
    function failed() {
      fontOK[sc] = false; fontFailAt[sc] = Date.now(); delete fontPromise[sc];
      faces.forEach(function (ff) { try { document.fonts.delete(ff); } catch (e) { } });
      return false;
    }
    var all = Promise.all(loads);
    fontPromise[sc] = withTimeout(all, 12000).then(function (r) {
      if (r === 'timeout') {
        /* slow network: draw with the simple font now, switch over if the download finishes later */
        fontOK[sc] = false; fontFailAt[sc] = Date.now(); delete fontPromise[sc];
        all.then(function () { fontOK[sc] = true; delete fontFailAt[sc]; fontPromise[sc] = Promise.resolve(true); scheduleRender(); }, failed);
        return false;
      }
      fontOK[sc] = true; delete fontFailAt[sc];
      return true;
    }, failed);
    return fontPromise[sc];
  }
  function prepFonts(lang, sample) {
    var sc = SCRIPT_OF[lang], festive = S.font === 'festive';
    var p = festive ? Promise.all([ensureFestive(sc), sc === 'latn' ? true : ensureFestive('latn')]) : Promise.resolve();
    return p.then(function (r) {
      if (festive && r && (!r[0] || !r[1]) && !prepFonts.warned) { prepFonts.warned = true; EDU.toast(t('font_failed')); }
      if (!document.fonts || !document.fonts.load) return;
      var fam = stack(sc, festive), txt = (sample || '') + 'Aa1';
      return withTimeout(Promise.all(['700', '500', '600'].map(function (w) { return document.fonts.load(w + ' 40px ' + fam, txt).catch(function () { }); })), 4000);
    });
  }

  /* ---------------------------------------------------------------- text */
  var seg = null;
  try { if (window.Intl && Intl.Segmenter) seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' }); } catch (e) { seg = null; }
  function graphemes(s) { return seg ? Array.from(seg.segment(s), function (x) { return x.segment; }) : Array.from(s); }
  function lineH(text) { return RTL_RE.test(text) ? 1.75 : INDIC_RE.test(text) ? 1.42 : 1.2; }
  function setFont(ctx, w, px, fam) { ctx.font = w + ' ' + (Math.round(px * 10) / 10) + 'px ' + fam; }
  function wrap(ctx, text, maxW) {
    var lines = [];
    String(text).split(/\r?\n/).forEach(function (para) {
      para = para.trim(); if (!para) return;
      var line = '';
      para.split(/\s+/).forEach(function (w) {
        var test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width <= maxW) { line = test; return; }
        if (line) lines.push(line);
        if (ctx.measureText(w).width <= maxW) { line = w; return; }
        var chunk = '';
        graphemes(w).forEach(function (g) {
          if (chunk && ctx.measureText(chunk + g).width > maxW) { lines.push(chunk); chunk = g; } else chunk += g;
        });
        line = chunk;
      });
      if (line) lines.push(line);
    });
    return lines;
  }
  /* largest font size (minPx..maxPx) whose wrapped text fits in maxLines: auto-shrinks long names */
  function fit(ctx, text, o) {
    var lines;
    setFont(ctx, o.weight, o.maxPx, o.fam); lines = wrap(ctx, text, o.maxW);
    if (lines.length <= o.maxLines) return { px: o.maxPx, lines: lines };
    var lo = o.minPx, hi = o.maxPx, best = null;
    for (var i = 0; i < 14 && hi - lo > 0.5; i++) {
      var mid = (lo + hi) / 2;
      setFont(ctx, o.weight, mid, o.fam); lines = wrap(ctx, text, o.maxW);
      if (lines.length <= o.maxLines) { best = { px: mid, lines: lines }; lo = mid; } else hi = mid;
    }
    if (best) return best;
    setFont(ctx, o.weight, o.minPx, o.fam);
    return { px: o.minPx, lines: wrap(ctx, text, o.maxW) };
  }
  /* same number of lines, but as even as possible (no single orphan word on the last line) */
  function balanced(ctx, text, f, o) {
    if (f.lines.length < 2) return f;
    setFont(ctx, o.weight, f.px, o.fam);
    /* never narrower than the longest word: a narrower box would split a word in the middle
       (e.g. "ईद-उल-अ / ज़हा") and still count as "the same number of lines" */
    var longest = String(text).split(/\s+/).reduce(function (m, w) { return w ? Math.max(m, ctx.measureText(w).width) : m; }, 0);
    var n = f.lines.length, lo = Math.max(o.maxW * 0.35, longest), hi = o.maxW, best = f.lines;
    if (lo >= hi) return f;
    for (var i = 0; i < 10; i++) {
      var mid = (lo + hi) / 2, ls = wrap(ctx, text, mid);
      if (ls.length <= n) { hi = mid; best = ls; } else lo = mid;
    }
    return { px: f.px, lines: best };
  }
  function fitB(ctx, text, o) { return balanced(ctx, text, fit(ctx, text, o), o); }
  function drawLines(ctx, lines, x, y, lh, align) {
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    lines.forEach(function (ln, i) { ctx.direction = RTL_RE.test(ln) ? 'rtl' : 'ltr'; ctx.fillText(ln, x, y + lh * (i + 0.5)); });
  }
  function widest(ctx, lines) { return lines.reduce(function (m, l) { return Math.max(m, ctx.measureText(l).width); }, 0); }
  function gradText(ctx, y, h, cols) {
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    cols.forEach(function (c, i) { g.addColorStop(cols.length === 1 ? 0 : i / (cols.length - 1), c); });
    return g;
  }
  function textShadow(ctx, pal, s, strong) {
    if (pal.dark) { ctx.shadowColor = 'rgba(0,0,0,' + (strong ? 0.5 : 0.38) + ')'; ctx.shadowBlur = (strong ? 16 : 9) * s; ctx.shadowOffsetY = (strong ? 4 : 2) * s; }
    else { ctx.shadowColor = 'rgba(255,255,255,.85)'; ctx.shadowBlur = (strong ? 12 : 8) * s; ctx.shadowOffsetY = 0; }
  }
  function divider(ctx, cx, y, w, col, s) {
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5 * s; ctx.globalAlpha = 0.9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx - 20 * s, y); ctx.moveTo(cx + 20 * s, y); ctx.lineTo(cx + w / 2, y); ctx.stroke();
    A.diamond(ctx, cx, y, 10 * s); ctx.fill();
    [-1, 1].forEach(function (sd) { A.circle(ctx, cx + sd * (w / 2 + 9 * s), y, 4.5 * s); ctx.fill(); });
    ctx.restore();
  }
  function icon(ctx, kind, x, y, s, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1, s * 0.1); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'phone') {
      A.rrect(ctx, x + s * 0.24, y + s * 0.04, s * 0.52, s * 0.92, s * 0.12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * 0.42, y + s * 0.16); ctx.lineTo(x + s * 0.58, y + s * 0.16); ctx.stroke();
      A.circle(ctx, x + s * 0.5, y + s * 0.8, s * 0.06); ctx.fill();
    } else if (kind === 'pin') {
      var cx = x + s / 2;
      ctx.beginPath(); ctx.moveTo(cx, y + s * 0.96);
      ctx.bezierCurveTo(cx - s * 0.5, y + s * 0.5, cx - s * 0.4, y + s * 0.04, cx, y + s * 0.04);
      ctx.bezierCurveTo(cx + s * 0.4, y + s * 0.04, cx + s * 0.5, y + s * 0.5, cx, y + s * 0.96); ctx.stroke();
      A.circle(ctx, cx, y + s * 0.38, s * 0.12); ctx.fill();
    } else {
      var gx = x + s / 2, gy = y + s / 2, r = s * 0.42;
      A.circle(ctx, gx, gy, r); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(gx, gy, r * 0.42, r, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx - r, gy); ctx.lineTo(gx + r, gy); ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------------------------------------------------------------- blocks */
  function blockHeader(ctx, d, cx, maxW, u, k, fam, L, logoMax) {
    var lh0 = (logoMax || 128) * u * k, logo = d.logo, lw = 0, lhh = 0, plate = 0;
    if (logo) {
      var r = (logo.naturalWidth || 1) / (logo.naturalHeight || 1);
      lhh = lh0; lw = lhh * r;
      if (lw > maxW * 0.6) { lw = maxW * 0.6; lhh = lw / r; }
      plate = d.logoPlate ? 14 * u * k : 0;
    }
    var nf = d.name ? fitB(ctx, d.name, { maxW: maxW * 0.9, maxLines: 2, maxPx: 54 * u * k, minPx: 26 * u * k, weight: 700, fam: fam }) : null;
    var nlh = nf ? nf.px * lineH(d.name) : 0, gap = logo && nf ? 12 * u * k : 0;
    var h = (logo ? lhh + 2 * plate : 0) + gap + (nf ? nf.lines.length * nlh : 0);
    return { id: 'name', h: h, draw: function (y) {
      var yy = y;
      if (logo) {
        if (plate) {
          ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 12 * u; ctx.fillStyle = '#ffffff';
          var near = lw / lhh > 0.75 && lw / lhh < 1.33;
          if (near) { A.circle(ctx, cx, yy + plate + lhh / 2, Math.max(lw, lhh) / 2 + plate); ctx.fill(); }
          else { A.rrect(ctx, cx - lw / 2 - plate, yy, lw + 2 * plate, lhh + 2 * plate, plate * 1.4); ctx.fill(); }
          ctx.restore();
        }
        ctx.drawImage(logo, cx - lw / 2, yy + plate, lw, lhh);
        L.logoScale = lw / (logo.naturalWidth || lw);
        L.hits.push({ id: 'logo', x: cx - lw / 2 - plate, y: yy, w: lw + 2 * plate, h: lhh + 2 * plate });
        yy += lhh + 2 * plate + gap;
      }
      if (nf) {
        ctx.save(); setFont(ctx, 700, nf.px, fam); ctx.fillStyle = d.pal.gold; textShadow(ctx, d.pal, u, false);
        drawLines(ctx, nf.lines, cx, yy, nlh);
        ctx.restore();
        if (nf.lines.length === 1) {
          setFont(ctx, 700, nf.px, fam);
          var w = ctx.measureText(nf.lines[0]).width, fl = Math.min(90 * u * k, (maxW - w) / 2 - 24 * u * k);
          if (fl > 24 * u * k) {
            ctx.save(); ctx.strokeStyle = d.pal.gold; ctx.fillStyle = d.pal.gold; ctx.lineWidth = 2 * u * k; ctx.globalAlpha = 0.8;
            var my = yy + nlh / 2;
            [-1, 1].forEach(function (sd) {
              var x0 = cx + sd * (w / 2 + 16 * u * k), x1 = x0 + sd * fl;
              ctx.beginPath(); ctx.moveTo(x0, my); ctx.lineTo(x1, my); ctx.stroke();
              A.diamond(ctx, x1 + sd * 6 * u * k, my, 6 * u * k); ctx.fill();
            });
            ctx.restore();
          }
        }
        L.hits.push({ id: 'name', x: cx - maxW / 2, y: yy, w: maxW, h: nf.lines.length * nlh });
      }
    } };
  }
  function blockGreet(ctx, d, cx, maxW, u, k, fam, L, maxPx) {
    var txt = d.greet, ml = txt.length > 26 ? 3 : 2;
    var f = fitB(ctx, txt, { maxW: maxW * 0.96, maxLines: ml, maxPx: maxPx * u * k, minPx: 40 * u * k, weight: 700, fam: fam });
    var lh = f.px * lineH(txt), divH = 36 * u * k, th = f.lines.length * lh;
    return { id: 'greet', h: th + divH, draw: function (y) {
      ctx.save(); setFont(ctx, 700, f.px, fam); textShadow(ctx, d.pal, u, true);
      ctx.fillStyle = gradText(ctx, y, th, d.pal.head);
      drawLines(ctx, f.lines, cx, y, lh); ctx.restore();
      setFont(ctx, 700, f.px, fam);
      divider(ctx, cx, y + th + divH * 0.55, Math.min(widest(ctx, f.lines) * 0.8, maxW * 0.6, 420 * u), d.pal.gold, u * k);
      L.hits.push({ id: 'greet', x: cx - maxW / 2, y: y, w: maxW, h: th });
    } };
  }
  function blockWish(ctx, d, cx, maxW, u, k, fam, L, maxPx) {
    var o = { maxW: maxW * 0.9, maxLines: 2, maxPx: maxPx * u * k, minPx: maxPx * 0.8 * u * k, weight: 500, fam: fam };
    var f = fit(ctx, d.wish, o);
    if (f.lines.length > 2) { o.maxLines = 3; o.minPx = 24 * u * k; f = fit(ctx, d.wish, o); }
    f = balanced(ctx, d.wish, f, o);
    var lh = f.px * lineH(d.wish) * 1.04, h = f.lines.length * lh;
    return { id: 'wish', h: h, draw: function (y) {
      ctx.save(); setFont(ctx, 500, f.px, fam); ctx.fillStyle = d.pal.text; textShadow(ctx, d.pal, u, false);
      drawLines(ctx, f.lines, cx, y, lh); ctx.restore();
      L.hits.push({ id: 'wish', x: cx - maxW / 2, y: y, w: maxW, h: h });
    } };
  }
  function blockOffer(ctx, d, cx, maxW, u, k, fam, L, maxPx) {
    var px = 46 * u * k, py = 20 * u * k;
    var f = fitB(ctx, d.offer, { maxW: maxW * 0.86 - 2 * px, maxLines: 2, maxPx: maxPx * u * k, minPx: 26 * u * k, weight: 700, fam: fam });
    var lh = f.px * lineH(d.offer), th = f.lines.length * lh;
    setFont(ctx, 700, f.px, fam);
    var w = widest(ctx, f.lines) + 2 * px, h = th + 2 * py;
    return { id: 'offer', h: h, draw: function (y) {
      var x = cx - w / 2, r = Math.min(h / 2, 46 * u);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 18 * u; ctx.shadowOffsetY = 6 * u;
      ctx.fillStyle = A.lgrad(ctx, 0, y, 0, y + h, d.pal.offer); A.rrect(ctx, x, y, w, h, r); ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2 * u; A.rrect(ctx, x + 7 * u, y + 7 * u, w - 14 * u, h - 14 * u, Math.max(2, r - 7 * u)); ctx.stroke(); ctx.restore();
      A.sparkle(ctx, x + 4 * u, y + 6 * u, 16 * u * k, d.pal.dark ? '#ffffff' : d.pal.gold);
      A.sparkle(ctx, x + w - 4 * u, y + h - 6 * u, 13 * u * k, d.pal.dark ? '#ffffff' : d.pal.gold);
      ctx.save(); setFont(ctx, 700, f.px, fam); ctx.fillStyle = d.pal.offerText;
      drawLines(ctx, f.lines, cx, y + py, lh); ctx.restore();
      L.hits.push({ id: 'offer', x: x, y: y, w: w, h: h });
    } };
  }
  function qrCard(ctx, d, qs, uk, fam) {
    var q = d.qr, n = q.size, mod = qs / n, padQ = Math.max(16 * uk, 3 * mod), cw = qs + 2 * padQ;
    var lf = fit(ctx, d.qrLabel, { maxW: cw - 12 * uk, maxLines: 2, maxPx: 24 * uk, minPx: 14 * uk, weight: 600, fam: fam });
    var llh = lf.px * lineH(d.qrLabel), ch = cw + lf.lines.length * llh + 4 * uk;
    return { w: cw, h: ch, draw: function (x, y, L) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 14 * uk; ctx.shadowOffsetY = 4 * uk;
      ctx.fillStyle = '#ffffff'; A.rrect(ctx, x, y, cw, ch, 14 * uk); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#111111'; ctx.beginPath();
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.modules[r][c]) ctx.rect(x + padQ + c * mod, y + padQ + r * mod, mod, mod);
      ctx.fill();
      ctx.save(); setFont(ctx, 600, lf.px, fam); ctx.fillStyle = '#222222';
      drawLines(ctx, lf.lines, x + cw / 2, y + cw - padQ * 0.2, llh); ctx.restore();
      L.hits.push({ id: 'qr', x: x, y: y, w: cw, h: ch });
    } };
  }
  function blockContact(ctx, d, X, Wc, u, k, fam, L, withQR) {
    var items = [];
    if (d.phone) items.push(['phone', d.phone, 'phone']);
    if (d.address) items.push(['pin', d.address, 'address']);
    if (d.handle) items.push(['web', d.handle, 'handle']);
    var qc = withQR && d.qr ? qrCard(ctx, d, 186 * u * k, u * k, fam) : null;
    if (!items.length && !qc) return null;
    var pad = 22 * u * k, gapCol = 26 * u * k, rowGap = 8 * u * k;
    var textW = Wc - 2 * pad - (qc ? qc.w + gapCol : 0), px0 = 37 * u * k, ic = px0 * 0.95, icGap = 14 * u * k;
    var rows = items.map(function (it) {
      var o = { maxW: textW - ic - icGap, maxLines: 1, maxPx: px0, minPx: 21 * u * k, weight: 500, fam: fam };
      var f = fit(ctx, it[1], o);
      /* a long address squeezed onto one line gets tiny: two readable lines are better */
      if (f.lines.length > 1 || (f.px < px0 * 0.8 && /\S\s+\S/.test(it[1]))) {
        var o2 = { maxW: o.maxW, maxLines: 2, maxPx: px0, minPx: o.minPx, weight: 500, fam: fam };
        var f2 = fitB(ctx, it[1], o2);
        if (f.lines.length > 1 || f2.px > f.px * 1.12) f = f2;
      }
      return { icon: it[0], id: it[2], f: f, lh: f.px * lineH(it[1]) };
    });
    var rowsH = rows.reduce(function (s, r) { return s + r.f.lines.length * r.lh; }, 0) + Math.max(0, rows.length - 1) * rowGap;
    var h = Math.max(rowsH, qc ? qc.h : 0) + (items.length ? 2 * pad : 0);
    return { id: 'contact', h: h, draw: function (y) {
      if (!items.length) { qc.draw(X + (Wc - qc.w) / 2, y, L); return; }
      ctx.save(); ctx.fillStyle = d.pal.panel; A.rrect(ctx, X, y, Wc, h, 24 * u); ctx.fill();
      ctx.strokeStyle = A.rgba(d.pal.gold, 0.45); ctx.lineWidth = 2 * u; ctx.stroke(); ctx.restore();
      if (qc) qc.draw(d.rtl ? X + pad : X + Wc - pad - qc.w, y + (h - qc.h) / 2, L);
      var areaX = qc ? (d.rtl ? X + pad + qc.w + gapCol : X + pad) : X + pad, areaW = textW;
      var ry = y + (h - rowsH) / 2;
      rows.forEach(function (r) {
        setFont(ctx, 500, r.f.px, fam);
        var tw = widest(ctx, r.f.lines), rowW = ic + icGap + tw, sx;
        if (!qc) sx = areaX + (areaW - rowW) / 2; else sx = d.rtl ? areaX + areaW - rowW : areaX;
        var icx = d.rtl ? sx + rowW - ic : sx, tx = d.rtl ? sx + tw : sx + ic + icGap;
        icon(ctx, r.icon, icx, ry + (r.lh - ic) / 2, ic, d.pal.gold);
        ctx.save(); setFont(ctx, 500, r.f.px, fam); ctx.fillStyle = d.pal.text;
        drawLines(ctx, r.f.lines, tx, ry, r.lh, d.rtl ? 'right' : 'left'); ctx.restore();
        L.hits.push({ id: r.id, x: sx, y: ry, w: rowW, h: r.f.lines.length * r.lh });
        ry += r.f.lines.length * r.lh + rowGap;
      });
    } };
  }

  /* ---------------------------------------------------------------- hero (art or photo) */
  function photoPath(ctx, shape, cx, cy, w, h, inset) {
    var x = cx - w / 2 + inset, y = cy - h / 2 + inset, wi = w - 2 * inset, hi = h - 2 * inset;
    ctx.beginPath();
    if (shape === 'circle') ctx.arc(cx, cy, Math.max(1, wi / 2), 0, TAU);
    else if (shape === 'round') A.rrect(ctx, x, y, wi, hi, wi * 0.14);
    else { var r = wi / 2; ctx.moveTo(x, y + hi); ctx.lineTo(x, y + r); ctx.arc(x + r, y + r, r, PI, TAU); ctx.lineTo(x + wi, y + hi); ctx.closePath(); }
  }
  function drawHero(ctx, box, d, u, L) {
    var cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    A.glow(ctx, cx, cy, Math.max(box.w, box.h) * 0.62, d.pal.glow, d.pal.dark ? 0.22 : 0.32);
    if (!d.photo) {
      (A.hero[d.tpl.hero] || A.hero.diyas)(ctx, box, d.pal, A.rng(d.seed + 37), u, { year: d.year });
      L.hits.push({ id: 'hero', x: box.x, y: box.y, w: box.w, h: box.h });
      return;
    }
    var img = d.photo, D0 = Math.min(box.w * (box.land ? 0.74 : 0.6), box.h * 0.9);
    var w = d.shape === 'circle' ? D0 : D0 * (d.shape === 'round' ? 0.86 : 0.8), h = D0, ring = 10 * u;
    var ms = D0 * 0.34, my = cy + h / 2 - ms * 0.42;
    [-1, 1].forEach(function (sd) {
      var mx = clamp(cx + sd * (w / 2 + ms * (box.land ? 0.2 : 0.62)), Math.max(ms * 0.6, box.x + (box.land ? ms * 0.55 : -ms * 0.2)), Math.min(L.W - ms * 0.6, box.x + box.w - (box.land ? ms * 0.55 : -ms * 0.2)));
      (A.mini[d.tpl.mini] || A.mini.sparkle)(ctx, mx, my, ms, d.pal, A.rng(d.seed + 41 + sd), u);
    });
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 24 * u; ctx.shadowOffsetY = 8 * u;
    photoPath(ctx, d.shape, cx, cy, w, h, -ring); ctx.fillStyle = A.lgrad(ctx, 0, cy - h / 2, 0, cy + h / 2, [A.shade(d.pal.gold, 0.35), d.pal.gold, A.shade(d.pal.gold, -0.25)]); ctx.fill(); ctx.restore();
    ctx.save(); photoPath(ctx, d.shape, cx, cy, w, h, 0); ctx.clip();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    var iw = img.naturalWidth || 1, ih = img.naturalHeight || 1, sc = Math.max(w / iw, h / ih) * d.zoom;
    var dw = iw * sc, dh = ih * sc, slackX = dw - w, slackY = dh - h;
    ctx.drawImage(img, cx - w / 2 - slackX * (d.ox + 1) / 2, cy - h / 2 - slackY * (d.oy + 1) / 2, dw, dh);
    ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5 * u; photoPath(ctx, d.shape, cx, cy, w, h, 4 * u); ctx.stroke(); ctx.restore();
    L.photo = { x: cx - w / 2, y: cy - h / 2, w: w, h: h, slackX: slackX, slackY: slackY };
    L.photoScale = sc;
    L.hits.push({ id: 'photo', x: cx - w / 2, y: cy - h / 2, w: w, h: h });
  }

  /* ---------------------------------------------------------------- poster layout */
  function drawPoster(ctx, W, H, d) {
    var land = W / H > 1.3, u = Math.min(W, H * 1.25) / 1080;
    var L = { hits: [], photo: null, logoScale: 0, photoScale: 0, W: W, H: H };
    ctx.save();
    ctx.textBaseline = 'middle';
    A.background(ctx, W, H, d.pal, d.tpl, A.rng(d.seed), u);
    A.border(ctx, W, H, d.pal, d.tpl.border, u);
    var topH = land ? H * 0.16 : clamp(H * 0.085, 110 * u, 240 * u);
    var botH = land ? H * 0.14 : clamp(H * 0.085, 110 * u, 240 * u);
    (A.top[d.tpl.top] || A.top.none)(ctx, W, topH, d.pal, A.rng(d.seed + 11), u);
    (A.bottom[d.tpl.bottom] || A.bottom.none)(ctx, W, H, botH, d.pal, A.rng(d.seed + 23), u);
    var fam = stack(d.sc, d.festive);
    if (land) layoutLand(ctx, W, H, d, u, topH, botH, fam, L); else layoutPortrait(ctx, W, H, d, u, topH, botH, fam, L);
    ctx.restore();
    return L;
  }
  function stackDraw(blocks, gap, Y0, avail, heroH, box, ctx, d, u, L) {
    var extra = Math.max(0, avail - heroH), eg = extra / (blocks.length + 1), y = Y0 + eg;
    blocks.forEach(function (b) {
      if (b.hero) { drawHero(ctx, { x: box.x, y: y, w: box.w, h: heroH }, d, u, L); y += heroH; }
      else { b.draw(y); y += b.h; }
      y += gap + eg;
    });
  }
  function layoutPortrait(ctx, W, H, d, u, topH, botH, fam, L) {
    var m = 70 * u, X = m, Wc = W - 2 * m, cx = W / 2;
    var Y0 = topH + 4 * u, Y1 = H - botH - 4 * u, Hc = Y1 - Y0;
    function build(k) {
      var B = [];
      if (d.logo || d.name) B.push(blockHeader(ctx, d, cx, Wc, u, k, fam, L));
      B.push({ hero: true, h: 0 });
      if (d.greet) B.push(blockGreet(ctx, d, cx, Wc, u, k, fam, L, 148));
      if (d.wish) B.push(blockWish(ctx, d, cx, Wc, u, k, fam, L, 48));
      if (d.offer) B.push(blockOffer(ctx, d, cx, Wc, u, k, fam, L, 50));
      var cb = blockContact(ctx, d, X, Wc, u, k, fam, L, true); if (cb) B.push(cb);
      return B;
    }
    var heroMin = Hc * (d.photo ? 0.24 : 0.15), heroMax = Hc * (d.photo ? 0.44 : 0.4), B, gap, avail, k;
    for (k = 1; k >= 0.55; k -= 0.05) {
      B = build(k); gap = 24 * u * k;
      avail = Hc - B.reduce(function (s, b) { return s + b.h; }, 0) - gap * (B.length - 1);
      if (avail >= heroMin) break;
    }
    var heroH = Math.min(Math.max(avail, 0), heroMax);
    if (heroH < 70 * u) { B = B.filter(function (b) { return !b.hero; }); avail += gap; heroH = 0; }
    stackDraw(B, gap, Y0, avail, heroH, { x: X, w: Wc }, ctx, d, u, L);
  }
  function layoutLand(ctx, W, H, d, u, topH, botH, fam, L) {
    var m = 56 * u, gapC = 30 * u, artW = W * 0.34;
    var Y0 = topH + 2 * u, Y1 = H - botH - 2 * u, Hc = Y1 - Y0;
    var artX = d.rtl ? m : W - m - artW, textX = d.rtl ? m + artW + gapC : m, textW = W - 2 * m - artW - gapC, tcx = textX + textW / 2;
    function build(k) {
      var B = [];
      if (d.logo || d.name) B.push(blockHeader(ctx, d, tcx, textW, u, k, fam, L, 92));
      if (d.greet) B.push(blockGreet(ctx, d, tcx, textW, u, k, fam, L, 108));
      if (d.wish) B.push(blockWish(ctx, d, tcx, textW, u, k, fam, L, 34));
      if (d.offer) B.push(blockOffer(ctx, d, tcx, textW, u, k, fam, L, 40));
      var cb = blockContact(ctx, d, textX, textW, u, k, fam, L, true); if (cb) B.push(cb);
      return B;
    }
    var B, gap, avail, k;
    for (k = 1; k >= 0.5; k -= 0.05) {
      B = build(k); gap = 16 * u * k;
      avail = Hc - B.reduce(function (s, b) { return s + b.h; }, 0) - gap * Math.max(0, B.length - 1);
      if (avail >= 0) break;
    }
    stackDraw(B, gap, Y0, avail, 0, { x: textX, w: textW }, ctx, d, u, L);
    drawHero(ctx, { x: artX, y: Y0, w: artW, h: Hc, land: true }, d, u, L);
  }

  /* ---------------------------------------------------------------- data for one render */
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function buildData(lang) {
    var tp = TPL[S.tpl], pi = clamp(+S.pal[tp.id] || 0, 0, tp.pals.length - 1), pal = D.PAL[tp.pals[pi]];
    var txt = posterText(tp.id, lang), biz = bizVals(lang), q = qrInfo(biz), nd = nextDate(tp), sc = SCRIPT_OF[lang];
    return {
      tpl: tp, pal: pal, lang: lang, sc: sc, rtl: lang === 'ur', festive: S.font === 'festive',
      greet: String(txt.greet || '').trim(), wish: String(txt.wish || '').trim(),
      name: String(biz.name || '').trim(), offer: String(biz.offer || '').trim(), phone: String(biz.phone || '').trim(),
      address: String(biz.address || '').trim(), handle: String(biz.handle || '').trim(),
      logo: imgEl.logo, logoPlate: S.logoPlate, photo: imgEl.photo, shape: S.shape, zoom: S.zoom, ox: S.ox, oy: S.oy,
      qr: q.ok ? q : null, qrLabel: q.ok ? CC(lang).labels[q.label] : '',
      seed: (hashStr(tp.id) + (+S.seed[tp.id] || 0) * 7919) >>> 0,
      year: nd ? +nd.slice(0, 4) : new Date().getFullYear() + 1
    };
  }
  function sampleText(d) { return [d.greet, d.wish, d.name, d.offer, d.address, d.handle, d.qrLabel].join(' '); }

  /* ---------------------------------------------------------------- rendering */
  var rendering = false, pending = false, rTimer = null;
  function scheduleRender(ms) { clearTimeout(rTimer); rTimer = setTimeout(requestRender, ms || 0); }
  function requestRender() {
    if (rendering) { pending = true; return; }
    rendering = true;
    var done = function () { rendering = false; if (pending) { pending = false; requestRender(); } };
    renderPreview().then(done, function (e) { console.error(e); done(); });
  }
  function renderPreview() {
    var sz = SIZE[S.size], lang = posterLang(), d = buildData(lang);
    return prepFonts(lang, sampleText(d)).then(function () {
      d = buildData(lang);
      d.festive = S.font === 'festive';
      var s = Math.min(1, PREVIEW_MAX / Math.max(sz.w, sz.h)), cw = Math.round(sz.w * s), ch = Math.round(sz.h * s);
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      var ctx = canvas.getContext('2d');
      ctx.setTransform(s, 0, 0, s, 0, 0);
      lastLayout = drawPoster(ctx, sz.w, sz.h, d);
      previewScale = s;
      canvas.dataset.w = sz.w; canvas.dataset.h = sz.h; canvas.dataset.tpl = S.tpl; canvas.dataset.lang = lang;
      canvas.dataset.rev = String(++rev);
      canvas.classList.toggle('has-photo', !!imgEl.photo);
      updateImgWarnings();
    });
  }
  function renderFull(lang) {
    var sz = SIZE[S.size], d = buildData(lang);
    return prepFonts(lang, sampleText(d)).then(function () {
      var cv = document.createElement('canvas'); cv.width = sz.w; cv.height = sz.h;
      drawPoster(cv.getContext('2d'), sz.w, sz.h, buildData(lang));
      return cv;
    });
  }
  function toBlob(cv, type, q) {
    return new Promise(function (res, rej) {
      try { cv.toBlob(function (b) { if (b) res(b); else rej(new Error('toBlob failed')); }, type, q); } catch (e) { rej(e); }
    });
  }
  function fileName(lang, ext) {
    /* drop emoji variation selectors / skin tones (they are "marks" and would survive the filter below) */
    var nm = String(bizVals(lang).name || '').normalize('NFC').replace(/[\uFE00-\uFE0F\u20E3]|\uD83C[\uDFFB-\uDFFF]/g, '');
    var base = nm.replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'poster';
    return base + '-' + S.tpl + '-' + S.size + '-' + lang + '.' + ext;
  }
  var working = false;   /* one export at a time: a double tap on a slow phone must not save two copies */
  function busy(on) { working = !!on; $('#busy').hidden = !on; }
  /* keep file names and phone numbers in one piece inside Urdu (RTL) sentences */
  var LRI = String.fromCharCode(0x2066), PDI = String.fromCharCode(0x2069);
  function iso(s) { return LRI + s + PDI; }
  function exportOne(type) {
    if (working) return Promise.resolve();
    var lang = posterLang(), ext = type === 'image/jpeg' ? 'jpg' : 'png';
    busy(true);
    return renderFull(lang).then(function (cv) { return toBlob(cv, type, 0.92); }).then(function (blob) {
      var name = fileName(lang, ext);
      EDU.download(name, blob);
      say(t('saved_file', { name: iso(name) }));
      busy(false);
    }).catch(function (e) { busy(false); console.error(e); });
  }
  function shareItems(items) {
    var files = null;
    try { files = items.map(function (it) { return new File([it.blob], it.name, { type: it.blob.type }); }); } catch (e) { files = null; }
    var can = false;
    try { can = !!(files && navigator.share && navigator.canShare && navigator.canShare({ files: files })); } catch (e) { can = false; }
    if (can) {
      return navigator.share({ files: files, title: t('app_title') }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        items.forEach(function (it) { EDU.download(it.name, it.blob); }); EDU.toast(t('share_none'));
      });
    }
    items.forEach(function (it) { EDU.download(it.name, it.blob); });
    EDU.toast(t('share_none'));
    return Promise.resolve();
  }
  function shareOne() {
    if (working) return Promise.resolve();
    var lang = posterLang();
    busy(true);
    return renderFull(lang).then(function (cv) { return toBlob(cv, 'image/png'); }).then(function (blob) {
      busy(false);
      return shareItems([{ blob: blob, name: fileName(lang, 'png') }]);
    }).catch(function (e) { busy(false); console.error(e); });
  }
  var printReady = false;   /* true while #printImg holds a fresh full-size poster made by the Print button */
  function pageCss(sz, sel) {
    return sz.print
      ? '@page { size: ' + sz.print + ' portrait; margin: 0; } ' + sel + ' { width: 100%; height: 100vh; object-fit: contain; }'
      : '@page { margin: 10mm; } ' + sel + ' { width: 100%; max-height: 95vh; object-fit: contain; }';
  }
  /* printing from the browser menu (not our button): print a copy of the preview instead of a blank page */
  window.addEventListener('beforeprint', function () {
    if (printReady) return;
    var cv = document.createElement('canvas');
    cv.width = canvas.width; cv.height = canvas.height; cv.id = 'printCanvas';
    try { cv.getContext('2d').drawImage(canvas, 0, 0); } catch (e) { return; }
    var old = $('#printCanvas'); if (old) old.remove();
    $('#printArea').appendChild(cv);
    $('#pageStyle').textContent = pageCss(SIZE[S.size], '#printCanvas') + ' #printCanvas { display: block; margin: 0 auto; } #printImg { display: none !important; }';
  });
  window.addEventListener('afterprint', function () {
    printReady = false;
    var c = $('#printCanvas'); if (c) c.remove();
  });
  function printPoster() {
    if (working) return;
    var sz = SIZE[S.size];
    busy(true);
    renderFull(posterLang()).then(function (cv) { return toBlob(cv, 'image/png'); }).then(function (blob) {
      var img = $('#printImg'), url = URL.createObjectURL(blob);
      $('#pageStyle').textContent = pageCss(sz, '#printImg');
      img.onload = function () { busy(false); printReady = true; setTimeout(function () { window.print(); }, 50); setTimeout(function () { URL.revokeObjectURL(url); }, 60000); };
      img.onerror = function () { busy(false); URL.revokeObjectURL(url); };
      img.src = url;
    }).catch(function (e) { busy(false); console.error(e); });
  }
  function say(msg) { $('#status').textContent = msg; EDU.toast(msg); }

  /* ---------------------------------------------------------------- images (stay on the device) */
  function decode(kind) {
    var rec = imgRec[kind];
    if (!rec || typeof rec.src !== 'string') { imgEl[kind] = null; return Promise.resolve(); }
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { imgEl[kind] = im; res(); };
      im.onerror = function () { imgEl[kind] = null; imgRec[kind] = null; store.remove(kind); res(); };
      im.src = rec.src;
    });
  }
  function hasAlpha(g, w, h) {
    try { var px = g.getImageData(0, 0, w, h).data; for (var i = 3; i < px.length; i += 4 * 29) if (px[i] < 250) return true; } catch (e) { }
    return false;
  }
  function pickImage(kind) {
    EDU.pickFile('image/*').then(function (file) {
      if (!file) return;
      if (file.type && !/^image\//.test(file.type)) { EDU.toast(t('img_bad')); return; }
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var iw = im.naturalWidth || 600, ih = im.naturalHeight || 600, max = kind === 'logo' ? 900 : 1800;
        var s = Math.min(1, max / Math.max(iw, ih)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(iw * s)); c.height = Math.max(1, Math.round(ih * s));
        var g = c.getContext('2d'); g.drawImage(im, 0, 0, c.width, c.height);
        var png = kind === 'logo' || hasAlpha(g, c.width, c.height);
        var rec = { src: png ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.88), w: iw, h: ih };
        URL.revokeObjectURL(url);
        imgRec[kind] = rec;
        if (kind === 'photo') { S.zoom = 1; S.ox = 0; S.oy = 0; $('#photoZoom').value = 1; save(); }
        if (!store.set(kind, rec)) EDU.toast(t('img_unsaved'));
        decode(kind).then(function () { syncImages(); scheduleRender(); });
      };
      im.onerror = function () { URL.revokeObjectURL(url); EDU.toast(t('img_bad')); };
      im.src = url;
    });
  }
  function removeImage(kind) {
    imgRec[kind] = null; imgEl[kind] = null; store.remove(kind);
    syncImages(); scheduleRender();
  }
  function syncImages() {
    ['logo', 'photo'].forEach(function (kind) {
      var th = $('#' + kind + 'Thumb'); th.textContent = '';
      if (imgRec[kind]) th.appendChild(el('img', { src: imgRec[kind].src, alt: '' }));
      else th.appendChild(el('span', { 'aria-hidden': 'true', text: kind === 'logo' ? '🏷️' : '🖼️' }));
      $('#' + kind + 'Remove').hidden = !imgRec[kind];
    });
    $('#photoOpts').hidden = !imgRec.photo;
  }
  function updateImgWarnings() {
    var L = lastLayout || {};
    [['logo', L.logoScale], ['photo', L.photoScale]].forEach(function (p) {
      var w = $('#' + p[0] + 'Warn'), rec = imgRec[p[0]], scale = p[1] || 0;
      if (rec && imgEl[p[0]] && scale > 1.6) { w.textContent = t('low_res', { w: EDU.fmt(rec.w), h: EDU.fmt(rec.h) }); w.hidden = false; }
      else w.hidden = true;
    });
  }

  /* ---------------------------------------------------------------- UI: occasions */
  function dateFmt() {
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag + '-u-nu-latn', { day: 'numeric', month: 'short' }); }
    catch (e) { return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }); }
  }
  function whenText(date) {
    if (!date) return t('when_unknown');
    var n = dayNum(date) - dayNum(todayStr()), f = dateFmt(), dd = f.format(new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), 12)));
    var rel = n < 0 ? t('when_now') : n === 0 ? t('when_today') : n === 1 ? t('when_tomorrow') : t('when_in', { n: EDU.fmt(n) });
    return rel + ' · ' + dd;
  }
  function occButton(tp, date) {
    var pal = D.PAL[tp.pals[clamp(+S.pal[tp.id] || 0, 0, tp.pals.length - 1)]];
    var name = (CC(EDU.lang).tpl[tp.id] || C.en.tpl[tp.id]).name;
    var soon = date && dayNum(date) - dayNum(todayStr()) <= 1;
    var b = el('button', { type: 'button', class: 'occ' + (pal.dark ? ' dark' : ''), 'aria-pressed': String(S.tpl === tp.id), dataset: { tpl: tp.id },
      style: { '--b1': pal.bg[0], '--b2': pal.bg[1], '--t': pal.text, '--g': pal.gold } },
      el('span', { class: 'occ-ic', 'aria-hidden': 'true', text: tp.icon }),
      el('span', { class: 'occ-name', text: name }));
    if (tp.kind === 'fest') b.appendChild(el('span', { class: 'occ-when' + (soon ? ' soon' : ''), text: whenText(date) }));
    b.addEventListener('click', function () { selectTpl(tp.id); });
    return b;
  }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFC'); }
  function renderOcc() {
    var q = norm($('#occSearch').value).trim();
    var match = function (tp) {
      if (!q) return true;
      /* names in all 12 languages: a Hindi speaker using the English screen can still type "दिवाली" */
      var hay = [tp.id].concat(CODES.map(function (c) { return (CC(c).tpl[tp.id] || C.en.tpl[tp.id]).name; })).map(norm).join(' ');
      return hay.indexOf(q) >= 0;
    };
    var fest = sortedFestivals().filter(function (x) { return match(x.tp); });
    var biz = D.TEMPLATES.filter(function (tp) { return tp.kind === 'biz' && match(tp); });
    var lf = $('#occFest'), lb = $('#occBiz'); lf.textContent = ''; lb.textContent = '';
    fest.forEach(function (x) { lf.appendChild(occButton(x.tp, x.date)); });
    biz.forEach(function (tp) { lb.appendChild(occButton(tp, null)); });
    $('#occFestH').hidden = !fest.length; $('#occBizH').hidden = !biz.length;
    $('#occNone').hidden = !!(fest.length || biz.length);
  }
  function selectTpl(id) {
    if (!TPL[id]) return;
    S.tpl = id; save();
    Array.prototype.forEach.call(document.querySelectorAll('.occ'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.tpl === id)); });
    syncText(); renderPalettes(); scheduleRender();
  }

  /* ---------------------------------------------------------------- UI: sizes, text, business, QR, style */
  function renderSizes() {
    Array.prototype.forEach.call(document.querySelectorAll('#sizeSeg button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.size === S.size)); });
  }
  function syncText() {
    var lang = posterLang(), tx = posterText(S.tpl, lang);
    $('#greet').value = tx.greet; $('#wish').value = tx.wish;
    var s = suggested(S.tpl, lang);
    $('#textReset').hidden = tx.greet === s.greet && tx.wish === s.wish;
    ['greet', 'wish'].forEach(function (id) { $('#' + id).setAttribute('lang', lang); $('#' + id).dir = lang === 'ur' ? 'rtl' : 'auto'; });
  }
  function onTextInput() {
    var lang = posterLang(), key = S.tpl + '|' + lang, s = suggested(S.tpl, lang), cu = {};
    var g = $('#greet').value, w = $('#wish').value;
    if (g !== s.greet) cu.greet = g;
    if (w !== s.wish) cu.wish = w;
    if (cu.greet !== undefined || cu.wish !== undefined) S.custom[key] = cu; else delete S.custom[key];
    $('#textReset').hidden = !S.custom[key];
    save(); scheduleRender(40);
  }
  var BIZ_FIELDS = { name: 'bizName', offer: 'offer', phone: 'phone', address: 'address', handle: 'handle' };
  function syncBiz() {
    var b = bizVals(posterLang());
    Object.keys(BIZ_FIELDS).forEach(function (k) { $('#' + BIZ_FIELDS[k]).value = b[k] || ''; });
    updateExampleNote(); renderOfferIdeas(); updateQrMsg();
  }
  function updateExampleNote() {
    var sm = sampleBiz(posterLang()), any = false;
    Object.keys(BIZ_FIELDS).forEach(function (k) { var v = $('#' + BIZ_FIELDS[k]).value; if (v && v === sm[k]) any = true; });
    $('#exampleNote').hidden = !any;
  }
  function onBizInput() {
    var b = {};
    Object.keys(BIZ_FIELDS).forEach(function (k) { b[k] = $('#' + BIZ_FIELDS[k]).value; });
    S.biz = b; save(); updateExampleNote(); updateQrMsg(); scheduleRender(40);
  }
  function clearExample() {
    var sm = sampleBiz(posterLang());
    Object.keys(BIZ_FIELDS).forEach(function (k) { var f = $('#' + BIZ_FIELDS[k]); if (f.value === sm[k]) f.value = ''; });
    onBizInput(); $('#bizName').focus();
  }
  function renderOfferIdeas() {
    var box = $('#offerIdeas'); box.textContent = '';
    box.appendChild(el('span', { class: 'muted', text: t('offer_ideas') }));
    CC(posterLang()).offers.forEach(function (o) {
      box.appendChild(el('button', { type: 'button', class: 'chip idea', text: o, onclick: function () { $('#offer').value = o; onBizInput(); } }));
    });
  }
  function renderQrSeg() {
    Array.prototype.forEach.call(document.querySelectorAll('#qrSeg button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.qr === S.qr)); });
    $('#upiField').hidden = S.qr !== 'upi'; $('#linkField').hidden = S.qr !== 'link';
    $('#qrCheck').hidden = S.qr === 'none';
    updateQrMsg();
  }
  function updateQrMsg() {
    var m = $('#qrMsg'), b = bizVals(posterLang()), q = qrInfo(b);
    m.className = 'small mb0';
    if (q.none || q.err === 'upi_empty' || q.err === 'link_empty') { m.textContent = ''; return; }
    if (q.err) { m.textContent = t(q.err); m.classList.add('bad'); m.dataset.state = 'bad'; return; }
    m.dataset.state = 'ok'; m.classList.add('ok');
    m.textContent = S.qr === 'upi' ? '✓ ' + t('upi_ok', { name: iso(S.upi.trim()) }) : S.qr === 'wa' ? '✓ ' + t('wa_ok', { phone: iso('+' + waDigits(b.phone)) }) : '✓ ' + iso(q.payload);
  }
  function renderPalettes() {
    var tp = TPL[S.tpl], box = $('#palSwatches'), cur = clamp(+S.pal[tp.id] || 0, 0, tp.pals.length - 1);
    box.textContent = '';
    tp.pals.forEach(function (pn, i) {
      var p = D.PAL[pn];
      box.appendChild(el('button', { type: 'button', class: 'swatch', 'aria-pressed': String(i === cur), 'aria-label': t('colour_n', { n: i + 1 }), title: t('colour_n', { n: i + 1 }),
        style: { '--b1': p.bg[0], '--b2': p.bg[1], '--g': p.gold },
        onclick: function () { S.pal[tp.id] = i; save(); renderPalettes(); renderOcc(); scheduleRender(); } },
        el('span', { class: 'sw-dot', 'aria-hidden': 'true' })));
    });
  }
  function renderFontSeg() {
    Array.prototype.forEach.call(document.querySelectorAll('#fontSeg button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.font === S.font)); });
  }
  function renderPosterLangSel() {
    var sel = $('#posterLang');
    if (!sel.options.length) EDU.LANGS.forEach(function (l) { sel.appendChild(el('option', { value: l.code, text: l.native })); });
    sel.value = posterLang();
  }
  function renderShape() {
    Array.prototype.forEach.call(document.querySelectorAll('#shapeSeg button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.shape === S.shape)); });
  }

  /* ---------------------------------------------------------------- multi-language */
  var multiResults = [];
  function defaultMulti() {
    var out = [posterLang()];
    ['hi', 'en', 'ta', 'bn'].forEach(function (c) { if (out.length < 3 && out.indexOf(c) < 0) out.push(c); });
    return out;
  }
  function renderMultiChips() {
    if (!S.multi || !S.multi.length) S.multi = defaultMulti();
    var box = $('#multiLangs'); box.textContent = '';
    EDU.LANGS.forEach(function (l) {
      box.appendChild(el('button', { type: 'button', class: 'chip', 'aria-pressed': String(S.multi.indexOf(l.code) >= 0), dataset: { lang: l.code }, lang: l.code, text: l.native,
        onclick: function () {
          var i = S.multi.indexOf(l.code);
          if (i >= 0) S.multi.splice(i, 1);
          else if (S.multi.length >= 3) { EDU.toast(t('multi_max')); return; }
          else S.multi.push(l.code);
          save(); renderMultiChips();
        } }));
    });
    var mk = $('#multiMake');
    mk.textContent = t('multi_make', { n: EDU.fmt(S.multi.length) });
    mk.disabled = !S.multi.length;
  }
  function makeMulti() {
    var langs = (S.multi || []).slice(0, 3);
    if (!langs.length || working) return Promise.resolve();
    multiResults.forEach(function (r) { URL.revokeObjectURL(r.url); });
    multiResults = [];
    var out = $('#multiOut'); out.textContent = ''; $('#multiActs').hidden = true;
    busy(true);
    return langs.reduce(function (p, L) {
      return p.then(function () {
        return renderFull(L).then(function (cv) { return toBlob(cv, 'image/png'); }).then(function (blob) {
          multiResults.push({ lang: L, blob: blob, name: fileName(L, 'png'), url: URL.createObjectURL(blob) });
        });
      });
    }, Promise.resolve()).then(function () {
      busy(false);
      multiResults.forEach(function (r) {
        out.appendChild(el('figure', { class: 'multi-item', dataset: { lang: r.lang } },
          el('img', { src: r.url, alt: EDU.langInfo(r.lang).native }),
          el('figcaption', { class: 'no-i18n', lang: r.lang, text: EDU.langInfo(r.lang).native }),
          el('div', { class: 'row' },
            el('button', { type: 'button', class: 'btn btn-sm', text: t('download'), onclick: function () { EDU.download(r.name, r.blob); } }),
            el('button', { type: 'button', class: 'btn btn-sm btn-wa', text: t('share'), onclick: function () { shareItems([r]); } }))));
      });
      $('#multiActs').hidden = !multiResults.length;
    }).catch(function (e) { busy(false); console.error(e); });
  }

  /* ---------------------------------------------------------------- dates dialog */
  function openDates() {
    var today = todayStr(), rows = [];
    var list = el('div', { class: 'dates-list' });
    D.TEMPLATES.filter(function (tp) { return tp.kind === 'fest' && !tp.fixed; }).forEach(function (tp) {
      var nd = nextDate(tp) || '';
      var inp = el('input', { type: 'date', value: nd, min: nd && nd < today ? nd : today, 'aria-label': CC(EDU.lang).tpl[tp.id].name });
      rows.push({ tp: tp, inp: inp });
      list.appendChild(el('label', { class: 'date-row' }, el('span', { text: tp.icon + ' ' + CC(EDU.lang).tpl[tp.id].name }), inp));
    });
    var close;
    var box = el('div', { class: 'stack' },
      el('p', { class: 'small muted', text: t('dates_help') }), list,
      el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn btn-primary', id: 'datesSave', text: t('save'), onclick: function () {
          rows.forEach(function (r) {
            var v = r.inp.value, b = builtinNext(r.tp, today);
            if (v && /^\d{4}-\d{2}-\d{2}$/.test(v) && v !== b) S.dates[r.tp.id] = v; else delete S.dates[r.tp.id];
          });
          save(); renderOcc(); scheduleRender(); close();
        } }),
        el('button', { type: 'button', class: 'btn', text: t('dates_reset'), onclick: function () { S.dates = {}; save(); renderOcc(); scheduleRender(); close(); } }),
        el('button', { type: 'button', class: 'btn btn-ghost', text: t('cancel'), onclick: function () { close(); } })));
    close = EDU.modal(box, { title: t('dates_title') });
  }

  /* ---------------------------------------------------------------- canvas interaction */
  var drag = null;
  function posterPoint(e) {
    var r = canvas.getBoundingClientRect(), sz = SIZE[S.size];
    return { x: (e.clientX - r.left) / r.width * sz.w, y: (e.clientY - r.top) / r.height * sz.h };
  }
  function inRect(p, b) { return b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }
  var HIT_FIELD = { name: 'bizName', logo: 'logoAdd', greet: 'greet', wish: 'wish', offer: 'offer', phone: 'phone', address: 'address', handle: 'handle', qr: 'qrSeg', hero: 'palSwatches', photo: 'photoZoom' };
  canvas.addEventListener('pointerdown', function (e) {
    if (!lastLayout || !lastLayout.photo) return;
    var p = posterPoint(e);
    if (!inRect(p, lastLayout.photo)) return;
    drag = { x: p.x, y: p.y, ox: S.ox, oy: S.oy, moved: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
    e.preventDefault();
  });
  /* on phones, a finger on the photo moves the photo; anywhere else on the poster still scrolls the page */
  canvas.addEventListener('touchstart', function (e) {
    if (!lastLayout || !lastLayout.photo || e.touches.length !== 1) return;
    if (inRect(posterPoint(e.touches[0]), lastLayout.photo)) e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag || !lastLayout || !lastLayout.photo) return;
    var p = posterPoint(e), ph = lastLayout.photo;
    if (Math.abs(p.x - drag.x) + Math.abs(p.y - drag.y) > 3) drag.moved = true;
    if (ph.slackX > 1) S.ox = clamp(drag.ox - 2 * (p.x - drag.x) / ph.slackX, -1, 1);
    if (ph.slackY > 1) S.oy = clamp(drag.oy - 2 * (p.y - drag.y) / ph.slackY, -1, 1);
    scheduleRender(0);
  });
  function endDrag() { if (drag) { if (drag.moved) save(); setTimeout(function () { drag = null; }, 0); } }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('click', function (e) {
    if (drag && drag.moved) return;
    if (!lastLayout) return;
    var p = posterPoint(e), hit = null;
    for (var i = lastLayout.hits.length - 1; i >= 0; i--) if (inRect(p, lastLayout.hits[i])) { hit = lastLayout.hits[i]; break; }
    if (!hit) return;
    var f = $('#' + HIT_FIELD[hit.id]);
    if (!f) return;
    if (f.tagName === 'DIV') f = f.querySelector('button') || f;
    f.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (err) { f.focus(); } }, 250);
  });
  canvas.addEventListener('keydown', function (e) {
    if (!imgEl.photo) return;
    var step = e.shiftKey ? 0.2 : 0.05, used = true;
    if (e.key === 'ArrowLeft') S.ox = clamp(S.ox + step, -1, 1);
    else if (e.key === 'ArrowRight') S.ox = clamp(S.ox - step, -1, 1);
    else if (e.key === 'ArrowUp') S.oy = clamp(S.oy + step, -1, 1);
    else if (e.key === 'ArrowDown') S.oy = clamp(S.oy - step, -1, 1);
    else if (e.key === '+' || e.key === '=') S.zoom = clamp(S.zoom + 0.1, 1, 3);
    else if (e.key === '-') S.zoom = clamp(S.zoom - 0.1, 1, 3);
    else used = false;
    if (used) { e.preventDefault(); $('#photoZoom').value = S.zoom; save(); scheduleRender(0); }
  });

  /* ---------------------------------------------------------------- wiring */
  $('#occSearch').addEventListener('input', renderOcc);
  $('#datesBtn').addEventListener('click', openDates);
  Array.prototype.forEach.call(document.querySelectorAll('#sizeSeg button'), function (b) {
    b.addEventListener('click', function () { S.size = b.dataset.size; save(); renderSizes(); scheduleRender(); });
  });
  $('#dlPng').addEventListener('click', function () { exportOne('image/png'); });
  $('#dlJpg').addEventListener('click', function () { exportOne('image/jpeg'); });
  $('#shareBtn').addEventListener('click', shareOne);
  $('#printBtn').addEventListener('click', printPoster);
  $('#posterLang').addEventListener('change', function () {
    S.posterLang = this.value; save();
    syncText(); if (!S.biz) syncBiz(); else { renderOfferIdeas(); updateExampleNote(); }
    updateQrMsg(); scheduleRender();
  });
  $('#greet').addEventListener('input', onTextInput);
  $('#wish').addEventListener('input', onTextInput);
  $('#textReset').addEventListener('click', function () { delete S.custom[S.tpl + '|' + posterLang()]; save(); syncText(); scheduleRender(); });
  Object.keys(BIZ_FIELDS).forEach(function (k) { $('#' + BIZ_FIELDS[k]).addEventListener('input', onBizInput); });
  $('#exampleClear').addEventListener('click', clearExample);
  $('#logoAdd').addEventListener('click', function () { pickImage('logo'); });
  $('#photoAdd').addEventListener('click', function () { pickImage('photo'); });
  $('#logoRemove').addEventListener('click', function () { removeImage('logo'); });
  $('#photoRemove').addEventListener('click', function () { removeImage('photo'); });
  $('#logoPlate').addEventListener('change', function () { S.logoPlate = this.checked; save(); scheduleRender(); });
  Array.prototype.forEach.call(document.querySelectorAll('#shapeSeg button'), function (b) {
    b.addEventListener('click', function () { S.shape = b.dataset.shape; save(); renderShape(); scheduleRender(); });
  });
  $('#photoZoom').addEventListener('input', function () { S.zoom = clamp(+this.value || 1, 1, 3); save(); scheduleRender(0); });
  Array.prototype.forEach.call(document.querySelectorAll('#qrSeg button'), function (b) {
    b.addEventListener('click', function () { S.qr = b.dataset.qr; save(); renderQrSeg(); scheduleRender(); if (S.qr === 'upi') $('#upiId').focus(); else if (S.qr === 'link') $('#linkUrl').focus(); });
  });
  $('#upiId').addEventListener('input', function () { S.upi = this.value; save(); updateQrMsg(); scheduleRender(60); });
  $('#linkUrl').addEventListener('input', function () { S.link = this.value; save(); updateQrMsg(); scheduleRender(60); });
  Array.prototype.forEach.call(document.querySelectorAll('#fontSeg button'), function (b) {
    b.addEventListener('click', function () {
      S.font = b.dataset.font; save(); renderFontSeg();
      if (S.font === 'festive') { prepFonts.warned = false; fontFailAt = {}; say(t('font_loading')); }
      scheduleRender();
    });
  });
  $('#shuffleBtn').addEventListener('click', function () { S.seed[S.tpl] = (+S.seed[S.tpl] || 0) + 1; save(); scheduleRender(); });
  $('#multiMake').addEventListener('click', makeMulti);
  $('#multiDl').addEventListener('click', function () { multiResults.forEach(function (r, i) { setTimeout(function () { EDU.download(r.name, r.blob); }, i * 400); }); });
  $('#multiShare').addEventListener('click', function () { shareItems(multiResults); });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['state', 'logo', 'photo'].forEach(function (k) { store.remove(k); });
    location.reload();
  });
  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    var k = String(e.key || '').toLowerCase();
    if (k === 's') { e.preventDefault(); exportOne('image/png'); }
    else if (k === 'p') { e.preventDefault(); printPoster(); }
  });
  if (document.fonts && document.fonts.addEventListener) {
    var fT = null;
    document.fonts.addEventListener('loadingdone', function () { clearTimeout(fT); fT = setTimeout(function () { scheduleRender(); }, 80); });
  }

  function renderAll() {
    renderPosterLangSel(); renderOcc(); renderSizes(); syncText(); syncBiz(); renderQrSeg(); renderPalettes();
    renderFontSeg(); renderShape(); renderMultiChips(); syncImages();
    $('#upiId').value = S.upi; $('#linkUrl').value = S.link; $('#logoPlate').checked = S.logoPlate; $('#photoZoom').value = S.zoom;
  }
  EDU.onLang(function () { renderAll(); scheduleRender(); });

  renderAll();
  Promise.all([decode('logo'), decode('photo')]).then(function () { syncImages(); requestRender(); });
})();
