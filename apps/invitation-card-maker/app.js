/* Invitation Card Maker: wedding, engagement, birthday, griha pravesh, naming, pooja, retirement, annual day, shop opening.
 * Everything is drawn on a canvas in the browser: motifs from art.js, the user's photo (object URL / data URL, never
 * uploaded), an optional Google-Maps QR (qr.js) and text that auto-fits (measureText + binary search) with RTL for Urdu.
 * Export PNG, send to WhatsApp (navigator.share), print A5 or 2-up A4, copy the invite text, save drafts on the device. */
(function () {
  'use strict';
  var SLUG = 'invitation-card-maker';
  var D = window.ICM_DATA, A = window.ICM_ART, C = window.APP_CONTENT;
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$;
  var PI = Math.PI, TAU = PI * 2;
  var CODES = EDU.LANGS.map(function (l) { return l.code; });
  var RTL_RE = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
  var INDIC_RE = /[ऀ-෿]/;
  var EMOJI = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"';
  var SAMPLE_PHONE = '+91 98765 43210';
  var PREVIEW_MAX = 1500;
  var TEXT_FIELDS = ['heading', 'invite', 'n1', 'join', 'n2', 'sub', 'closing', 'family', 'schedule'];
  var SYM_DEFAULT = { wedding: 'ganesh', engagement: 'ganesh', reception: 'none', birthday: 'none', anniversary: 'none', housewarming: 'ganesh',
    naming: 'ganesh', pooja: 'om', mundan: 'ganesh', retirement: 'none', annualday: 'none', opening: 'ganesh' };
  var TOP_H = { none: 0, toran: 150, kalash: 200, lights: 110, mandala: 130, balloons: 190, banana: 170, monogram: 150, ribbon: 130, rings: 140 };
  var BOT_H = { none: 0, diyas: 150, lotus: 175, marigold: 120, paisleyrow: 120, mandala: 130, confetti: 120, kolam: 120, stars: 110, hearts: 100 };

  var DES = {}; D.DESIGNS.forEach(function (x) { DES[x.id] = x; });
  var SIZE = {}; D.SIZES.forEach(function (s) { SIZE[s.id] = s; });
  var SYM = {}; D.SYMBOLS.forEach(function (s) { SYM[s.id] = s; });

  /* ---------------------------------------------------------------- state */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function str(v) { return typeof v === 'string' ? v : null; }
  function loadState(saved) {
    saved = obj(saved);
    return {
      occ: D.OCC_DESIGN[saved.occ] ? saved.occ : 'wedding',
      design: DES[saved.design] ? saved.design : null,                 /* null = the occasion's default design */
      pal: obj(saved.pal), seed: obj(saved.seed), custom: obj(saved.custom),
      size: SIZE[saved.size] ? saved.size : 'wa',
      cardLang: CODES.indexOf(saved.cardLang) >= 0 ? saved.cardLang : null,
      font: ['elegant', 'festive', 'simple'].indexOf(saved.font) >= 0 ? saved.font : 'elegant',
      sym: SYM[saved.sym] ? saved.sym : null,                         /* null = auto by occasion + language */
      date: str(saved.date), time: str(saved.time), venue: str(saved.venue), map: str(saved.map) || '', rsvp: str(saved.rsvp),
      shape: ['circle', 'arch', 'round'].indexOf(saved.shape) >= 0 ? saved.shape : 'circle',
      zoom: clamp(+saved.zoom || 1, 1, 3), ox: clamp(+saved.ox || 0, -1, 1), oy: clamp(+saved.oy || 0, -1, 1)
    };
  }
  var S = loadState(store.get('state', {}));
  var saveT = null;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { store.set('state', S); }, 250); }

  var photoRec = store.get('photo', null), photoEl = null;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });
  var canvas = $('#cardCanvas');
  var rev = 0, lastLayout = null;

  /* ---------------------------------------------------------------- content helpers */
  function cardLang() { return S.cardLang || EDU.lang; }
  function CC(lang) { return C[lang] || C.en; }
  function design() { return DES[S.design || D.OCC_DESIGN[S.occ]] || D.DESIGNS[0]; }
  function palette() { var dz = design(), pi = clamp(+S.pal[dz.id] || 0, 0, dz.pals.length - 1); return D.PAL[dz.pals[pi]]; }
  function defaults(occ, lang) { return CC(lang).occ[occ] || C.en.occ[occ]; }
  function textOf(occ, lang) {
    var df = defaults(occ, lang), cu = obj(S.custom[occ + '|' + lang]), out = {};
    TEXT_FIELDS.forEach(function (f) { out[f] = typeof cu[f] === 'string' ? cu[f] : df[f]; });
    return out;
  }
  function symId() {
    if (S.sym) return S.sym;
    var d = SYM_DEFAULT[S.occ] || 'none', lang = cardLang();
    if (d !== 'none' && lang === 'ur') return 'bismillah';
    if (d !== 'none' && lang === 'pa') return 'ikonkar';
    return d;
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function sampleDate() { var d = new Date(); d.setDate(d.getDate() + 30); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function dateVal() { return S.date === null ? sampleDate() : S.date; }
  function timeVal() { return S.time === null ? '19:00' : S.time; }
  function venueVal(lang) { return S.venue === null ? CC(lang).sample.venue : S.venue; }
  function rsvpVal() { return S.rsvp === null ? SAMPLE_PHONE : S.rsvp; }
  function isExample() { var cu = obj(S.custom[S.occ + '|' + cardLang()]); return typeof cu.n1 !== 'string' && S.venue === null; }
  function localeTag(lang) { return EDU.langInfo(lang).tag + '-u-nu-latn'; }
  /* Chrome ships no calendar data for Punjabi ("2026 M12 21, Mon") and Odia (falls back to English), so the month and
     weekday names in content.js are used whenever Intl cannot do the language itself or prints a bare "M12". */
  function fmtDate(iso, lang) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
    var dt = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), 12);
    if (isNaN(dt.getTime())) return '';
    var o = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, s = '';
    try { if (Intl.DateTimeFormat.supportedLocalesOf([EDU.langInfo(lang).tag]).length) s = new Intl.DateTimeFormat(localeTag(lang), o).format(dt); } catch (e) { s = ''; }
    if (s && !/\bM\d{1,2}\b/.test(s)) return s;
    var lb = CC(lang).labels;
    return lb.days[dt.getDay()] + ', ' + dt.getDate() + ' ' + lb.months[dt.getMonth()] + ' ' + dt.getFullYear();
  }
  function fmtTime(hm, lang) {
    if (!hm || !/^\d{2}:\d{2}/.test(hm)) return '';
    var dt = new Date(2026, 0, 1, +hm.slice(0, 2), +hm.slice(3, 5)), s;
    var o = { hour: 'numeric', minute: '2-digit' };
    try { s = new Intl.DateTimeFormat(localeTag(lang), o).format(dt); } catch (e) { s = new Intl.DateTimeFormat('en-IN', o).format(dt); }
    /* "7:00 PM" stays in that order inside an Urdu (right-to-left) line */
    return lang === 'ur' ? '⁦' + s + '⁩' : s;
  }

  /* ---------------------------------------------------------------- QR (map link) */
  var qrCache = { key: null, val: null };
  function mapInfo() {
    var u = String(S.map || '').trim();
    if (!u) return { none: true };
    if (!/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(u)) return { err: 'map_bad' };
    if (qrCache.key === u) return qrCache.val;
    var q = window.QRGen ? QRGen.encode(u, 'M') : { ok: false };
    var val = q.ok ? { ok: true, modules: q.modules, size: q.size, url: u } : { err: 'map_bad' };
    qrCache = { key: u, val: val };
    return val;
  }

  /* ---------------------------------------------------------------- fonts */
  var linked = {};
  function linkFont(spec) {
    if (!spec || !spec.gf || linked[spec.gf]) return;
    linked[spec.gf] = 1;
    if (location.protocol === 'file:' && !navigator.onLine) return;
    /* once the font CSS has arrived, draw again: that first document.fonts.load() then really downloads the font */
    document.head.appendChild(el('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=' + spec.gf + '&display=swap', onload: function () { scheduleRender(50); } }));
  }
  function fontSet(lang) {
    var sc = D.SCRIPT_OF[lang] || 'latn', tbl = D.FONTS[S.font] || {};
    return tbl[sc + '_' + lang] || tbl[sc] || null;
  }
  function families(lang) {
    var sc = D.SCRIPT_OF[lang] || 'latn', fs = fontSet(lang), sys = D.SYS[sc] + (sc !== 'latn' ? ', ' + D.SYS.latn : '') + ', "Nirmala UI", sans-serif, ' + EMOJI;
    var q = function (f) { return '"' + f + '"'; };
    if (!fs) return { heading: sys, names: sys, body: sys, simple: true };
    var disp = fs.display.f, nm = fs.names ? fs.names.f : disp, body = fs.body.f;
    var latn = D.FONTS[S.font].latn, latnBody = latn && latn.body ? latn.body.f : null;
    var tail = (sc !== 'latn' && latnBody ? q(latnBody) + ', ' : '') + sys;
    return { heading: q(disp) + ', ' + (nm !== disp ? q(nm) + ', ' : '') + tail, names: q(nm) + ', ' + tail, body: q(body) + ', ' + tail, simple: false };
  }
  function sacredFam(script) { var f = D.SACRED[script]; return (f ? '"' + f.f + '", ' : '') + D.SYS[script] + ', ' + D.SYS.latn + ', sans-serif'; }
  function withTimeout(p, ms) { return Promise.race([p, new Promise(function (res) { setTimeout(function () { res('timeout'); }, ms); })]); }
  function prepFonts(lang, d) {
    var fs = fontSet(lang), need = [];
    if (fs) { linkFont(fs.display); linkFont(fs.names); linkFont(fs.body); }
    var latn = D.FONTS[S.font] && D.FONTS[S.font].latn;
    if (fs && latn && lang !== 'en') { linkFont(latn.body); }
    if (d.symLineScript) linkFont(D.SACRED[d.symLineScript]);
    if (d.sym && d.sym.glyphScript) linkFont(D.SACRED[d.sym.glyphScript]);
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var fam = families(lang), txt = [d.heading, d.n1, d.n2, d.invite].join(' ') + 'Aa1';
    need.push(document.fonts.load('400 40px ' + fam.heading, txt), document.fonts.load('700 40px ' + fam.names, txt), document.fonts.load('400 40px ' + fam.body, txt));
    if (d.symLine) need.push(document.fonts.load('400 40px ' + d.symFam, d.symLine));
    return withTimeout(Promise.all(need.map(function (p) { return p.catch(function () { }); })), 5000);
  }

  /* ---------------------------------------------------------------- text */
  var seg = null;
  try { if (window.Intl && Intl.Segmenter) seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' }); } catch (e) { seg = null; }
  function graphemes(s) { return seg ? Array.from(seg.segment(s), function (x) { return x.segment; }) : Array.from(s); }
  function lineH(text) { return RTL_RE.test(text) ? 1.9 : INDIC_RE.test(text) ? 1.5 : 1.25; }
  function setFont(ctx, w, px, fam, italic) { ctx.font = (italic ? 'italic ' : '') + w + ' ' + (Math.round(px * 10) / 10) + 'px ' + fam; }
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
        graphemes(w).forEach(function (g) { if (chunk && ctx.measureText(chunk + g).width > maxW) { lines.push(chunk); chunk = g; } else chunk += g; });
        line = chunk;
      });
      if (line) lines.push(line);
    });
    /* a separator never starts a line: "Sharma · Son of" breaks after the dot, not before it */
    for (var i = 1; i < lines.length; i++) {
      var m = lines[i].match(/^([·•|–—-])\s+(.+)$/);
      if (m) { lines[i - 1] += ' ' + m[1]; lines[i] = m[2]; }
    }
    return lines;
  }
  /* largest size (minPx..maxPx) whose wrapped text fits in maxLines; long names shrink instead of overflowing */
  function fit(ctx, text, o) {
    var lines;
    setFont(ctx, o.weight, o.maxPx, o.fam, o.italic); lines = wrap(ctx, text, o.maxW);
    if (lines.length <= o.maxLines) return { px: o.maxPx, lines: lines };
    var lo = o.minPx, hi = o.maxPx, best = null;
    for (var i = 0; i < 14 && hi - lo > 0.5; i++) {
      var mid = (lo + hi) / 2;
      setFont(ctx, o.weight, mid, o.fam, o.italic); lines = wrap(ctx, text, o.maxW);
      if (lines.length <= o.maxLines) { best = { px: mid, lines: lines }; lo = mid; } else hi = mid;
    }
    if (best) return best;
    setFont(ctx, o.weight, o.minPx, o.fam, o.italic);
    return { px: o.minPx, lines: wrap(ctx, text, o.maxW) };
  }
  /* same number of lines but evenly filled (no lonely last word) */
  function balanced(ctx, text, f, o) {
    if (f.lines.length < 2) return f;
    setFont(ctx, o.weight, f.px, o.fam, o.italic);
    var longest = String(text).split(/\s+/).reduce(function (m, w) { return w ? Math.max(m, ctx.measureText(w).width) : m; }, 0);
    var n = f.lines.length, lo = Math.max(o.maxW * 0.35, longest), hi = o.maxW, best = f.lines;
    if (lo >= hi) return f;
    for (var i = 0; i < 10; i++) { var mid = (lo + hi) / 2, ls = wrap(ctx, text, mid); if (ls.length <= n) { hi = mid; best = ls; } else lo = mid; }
    return { px: f.px, lines: best };
  }
  function fitB(ctx, text, o) { return balanced(ctx, text, fit(ctx, text, o), o); }
  function drawLines(ctx, lines, x, y, lh, align, rtl, L) {
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    lines.forEach(function (ln, i) {
      ctx.direction = rtl || RTL_RE.test(ln) ? 'rtl' : 'ltr';
      ctx.fillText(ln, x, y + lh * (i + 0.5));
      if (L) L.lines.push(ln);
    });
  }
  function widest(ctx, lines) { return lines.reduce(function (m, l) { return Math.max(m, ctx.measureText(l).width); }, 0); }
  function softShadow(ctx, pal, u) {
    if (pal.dark) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8 * u; ctx.shadowOffsetY = 2 * u; }
  }

  /* ---------------------------------------------------------------- blocks: each returns { h, draw(y) } */
  function blockPara(ctx, d, text, cx, maxW, u, k, o, L, hitId) {
    var f = fitB(ctx, text, { maxW: maxW, maxLines: o.maxLines, maxPx: o.px * u * k, minPx: o.px * 0.72 * u * k, weight: o.weight || 400, fam: o.fam, italic: o.italic });
    var lh = f.px * lineH(text) * (o.lhk || 1), h = f.lines.length * lh;
    return { h: h, draw: function (y) {
      ctx.save(); setFont(ctx, o.weight || 400, f.px, o.fam, o.italic); ctx.fillStyle = o.col; ctx.globalAlpha = o.alpha || 1;
      drawLines(ctx, f.lines, cx, y, lh, 'center', d.rtl, L); ctx.restore();
      L.hits.push({ id: hitId, x: cx - maxW / 2, y: y, w: maxW, h: h });
    } };
  }
  function blockSymbol(ctx, d, cx, maxW, u, k, L) {
    var sym = d.sym, r = 48 * u * k, lf = null, llh = 0, gap = 10 * u * k;
    if (d.symLine) {
      lf = fit(ctx, d.symLine, { maxW: maxW * 0.8, maxLines: 2, maxPx: 24 * u * k, minPx: 16 * u * k, weight: 400, fam: d.symFam });
      llh = lf.px * lineH(d.symLine);
    }
    var medal = !!(sym.draw || sym.glyph) && !d.symInBand, h = (medal ? 2 * r : 0) + (lf ? (medal ? gap : 0) + lf.lines.length * llh : 0);
    return { h: h, draw: function (y) {
      var yy = y;
      if (medal) {
        ctx.save(); ctx.strokeStyle = d.pal.gold; ctx.lineWidth = 1.5 * u; ctx.globalAlpha = 0.8; A.circle(ctx, cx, yy + r, r); ctx.stroke();
        ctx.globalAlpha = 0.25; A.circle(ctx, cx, yy + r, r - 5 * u); ctx.stroke(); ctx.restore();
        if (sym.draw) A.symbol(ctx, sym.draw, cx, yy + r, r * 1.2, d.pal.gold);
        else {
          ctx.save(); ctx.fillStyle = d.pal.gold; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          setFont(ctx, 400, r * 1.25, sacredFam(sym.glyphScript)); ctx.fillText(sym.glyph, cx, yy + r + r * 0.06); ctx.restore();
        }
        yy += 2 * r + gap;
      }
      if (lf) {
        ctx.save(); setFont(ctx, 400, lf.px, d.symFam); ctx.fillStyle = d.pal.gold;
        drawLines(ctx, lf.lines, cx, yy, llh, 'center', d.symRtl, L); ctx.restore();
      }
      L.hits.push({ id: 'sym', x: cx - r * 2, y: y, w: r * 4, h: h });
    } };
  }
  function blockHeading(ctx, d, cx, maxW, u, k, L) {
    var fam = d.fam.heading, cursive = d.lang === 'en' && S.font === 'elegant';
    var px = (cursive ? 104 : d.rtl ? 64 : 70) * u * k;
    var f = fitB(ctx, d.heading, { maxW: maxW, maxLines: 2, maxPx: px, minPx: px * 0.55, weight: 400, fam: fam });
    var lh = f.px * (cursive ? 1.1 : lineH(d.heading) * 0.95), h = f.lines.length * lh;
    return { h: h, draw: function (y) {
      ctx.save(); setFont(ctx, 400, f.px, fam); softShadow(ctx, d.pal, u);
      ctx.fillStyle = A.lgrad(ctx, 0, y, 0, y + h, [A.shade(d.pal.head, 0.18), d.pal.head, A.shade(d.pal.head, -0.12)]);
      drawLines(ctx, f.lines, cx, y, lh, 'center', d.rtl, L); ctx.restore();
      L.hits.push({ id: 'heading', x: cx - maxW / 2, y: y, w: maxW, h: h });
    } };
  }
  function blockNames(ctx, d, cx, maxW, u, k, L) {
    var fam = d.fam.names, px = (d.rtl ? 66 : 84) * u * k, parts = [];
    var f1 = fitB(ctx, d.n1, { maxW: maxW, maxLines: 2, maxPx: px, minPx: px * 0.5, weight: 700, fam: fam });
    var lh1 = f1.px * lineH(d.n1) * 0.98;
    parts.push({ f: f1, lh: lh1, h: f1.lines.length * lh1, kind: 'name' });
    if (d.n2) {
      if (d.join) {
        var fj = fit(ctx, d.join, { maxW: maxW * 0.8, maxLines: 1, maxPx: 34 * u * k, minPx: 22 * u * k, weight: 400, fam: d.fam.body, italic: !d.rtl });
        parts.push({ f: fj, lh: fj.px * lineH(d.join) * 1.1, h: fj.px * lineH(d.join) * 1.1, kind: 'join' });
      }
      var f2 = fitB(ctx, d.n2, { maxW: maxW, maxLines: 2, maxPx: px, minPx: px * 0.5, weight: 700, fam: fam });
      var lh2 = f2.px * lineH(d.n2) * 0.98;
      parts.push({ f: f2, lh: lh2, h: f2.lines.length * lh2, kind: 'name' });
    }
    var h = parts.reduce(function (s, p) { return s + p.h; }, 0);
    return { h: h, draw: function (y) {
      var yy = y;
      parts.forEach(function (p) {
        ctx.save();
        if (p.kind === 'name') { setFont(ctx, 700, p.f.px, fam); softShadow(ctx, d.pal, u); ctx.fillStyle = A.lgrad(ctx, 0, yy, 0, yy + p.h, [A.shade(d.pal.head, 0.2), d.pal.head, A.shade(d.pal.head, -0.15)]); }
        else { setFont(ctx, 400, p.f.px, d.fam.body, !d.rtl); ctx.fillStyle = d.pal.gold; }
        drawLines(ctx, p.f.lines, cx, yy, p.lh, 'center', d.rtl, L); ctx.restore();
        yy += p.h;
      });
      L.hits.push({ id: 'n1', x: cx - maxW / 2, y: y, w: maxW, h: h });
    } };
  }
  function blockDivider(ctx, d, cx, maxW, u, k, L) {
    return { h: 30 * u * k, draw: function (y) { A.divider(ctx, cx, y + 15 * u * k, Math.min(maxW * 0.45, 360 * u), d.pal.gold, u * k); } };
  }
  function blockPhoto(ctx, d, cx, maxW, u, k, L) {
    var Dm = Math.min(maxW * 0.5, 330 * u) * k, w = S.shape === 'circle' ? Dm : Dm * (S.shape === 'round' ? 0.86 : 0.8), h = Dm, ring = 8 * u;
    return { h: h + 2 * ring, draw: function (y) {
      var cy = y + ring + h / 2;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 20 * u; ctx.shadowOffsetY = 6 * u;
      photoPath(ctx, S.shape, cx, cy, w, h, -ring); ctx.fillStyle = A.lgrad(ctx, 0, cy - h / 2, 0, cy + h / 2, [A.shade(d.pal.gold, 0.35), d.pal.gold, A.shade(d.pal.gold, -0.25)]); ctx.fill(); ctx.restore();
      ctx.save(); photoPath(ctx, S.shape, cx, cy, w, h, 0); ctx.clip(); ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      var img = d.photo, iw = img.naturalWidth || 1, ih = img.naturalHeight || 1, sc = Math.max(w / iw, h / ih) * S.zoom;
      var dw = iw * sc, dh = ih * sc, slackX = dw - w, slackY = dh - h;
      ctx.drawImage(img, cx - w / 2 - slackX * (S.ox + 1) / 2, cy - h / 2 - slackY * (S.oy + 1) / 2, dw, dh); ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2 * u; photoPath(ctx, S.shape, cx, cy, w, h, 3 * u); ctx.stroke(); ctx.restore();
      L.photo = { x: cx - w / 2, y: cy - h / 2, w: w, h: h, slackX: slackX, slackY: slackY };
      L.hits.push({ id: 'photo', x: cx - w / 2, y: cy - h / 2, w: w, h: h });
    } };
  }
  function photoPath(ctx, shape, cx, cy, w, h, inset) {
    var x = cx - w / 2 + inset, y = cy - h / 2 + inset, wi = w - 2 * inset, hi = h - 2 * inset;
    ctx.beginPath();
    if (shape === 'circle') ctx.arc(cx, cy, Math.max(1, wi / 2), 0, TAU);
    else if (shape === 'round') A.rrect(ctx, x, y, wi, hi, wi * 0.14);
    else { var r = wi / 2; ctx.moveTo(x, y + hi); ctx.lineTo(x, y + r); ctx.arc(x + r, y + r, r, PI, TAU); ctx.lineTo(x + wi, y + hi); ctx.closePath(); }
  }
  function qrBox(ctx, d, qs, uk, L, u) {
    /* a long Google-Maps URL needs 50-60 modules: keep every module at least ~3.4 px on a 1080 px card, whatever the text
       shrink factor, so WhatsApp's compression does not kill it (a short maps.app.goo.gl link stays at the compact size) */
    var q = d.qr, n = q.size; qs = Math.max(qs, n * 3.4 * u);
    var mod = qs / n, padQ = Math.max(12 * uk, 3 * mod), cw = qs + 2 * padQ;
    var lf = fit(ctx, d.labels.map, { maxW: cw + 20 * uk, maxLines: 2, maxPx: 18 * uk, minPx: 13 * uk, weight: 400, fam: d.fam.body });
    var llh = lf.px * lineH(d.labels.map), ch = cw + lf.lines.length * llh + 6 * uk;
    return { w: cw + 20 * uk, h: ch, draw: function (x, y) {
      var bx = x + 10 * uk;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 10 * uk; ctx.shadowOffsetY = 3 * uk; ctx.fillStyle = '#ffffff'; A.rrect(ctx, bx, y, cw, cw, 10 * uk); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#111111'; ctx.beginPath();
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.modules[r][c]) ctx.rect(bx + padQ + c * mod, y + padQ + r * mod, mod, mod);
      ctx.fill();
      L.qr = { modules: n, px: qs };
      ctx.save(); setFont(ctx, 400, lf.px, d.fam.body); ctx.fillStyle = d.pal.ink; ctx.globalAlpha = 0.9;
      drawLines(ctx, lf.lines, bx + cw / 2, y + cw + 4 * uk, llh, 'center', d.rtl, L); ctx.restore();
    } };
  }
  function blockDetails(ctx, d, X, Wc, u, k, L) {
    var rows = [];
    if (d.dateText) rows.push({ icon: 'calendar', text: d.dateText, px: 30, weight: 700, id: 'date', max: 2 });
    if (d.timeText) rows.push({ icon: 'clock', text: d.timeText, px: 27, weight: 400, id: 'time', max: 1 });
    if (d.venue) rows.push({ icon: 'pin', text: d.venue, px: 26, weight: 400, id: 'venue', max: 3 });
    var qb = d.qr ? qrBox(ctx, d, 150 * u * k, u * k, L, u) : null;
    if (!rows.length && !qb) return null;
    var pad = 24 * u * k, gapCol = 20 * u * k, rowGap = 10 * u * k, ic = 30 * u * k, icGap = 14 * u * k;
    var textW = Wc - 2 * pad - (qb ? qb.w + gapCol : 0);
    rows.forEach(function (r) {
      r.f = fitB(ctx, r.text, { maxW: textW - ic - icGap, maxLines: r.max, maxPx: r.px * u * k, minPx: r.px * 0.7 * u * k, weight: r.weight, fam: d.fam.body });
      r.lh = r.f.px * lineH(r.text);
    });
    var rowsH = rows.reduce(function (s, r) { return s + r.f.lines.length * r.lh; }, 0) + Math.max(0, rows.length - 1) * rowGap;
    var h = Math.max(rowsH, qb ? qb.h : 0) + 2 * pad;
    return { h: h, draw: function (y) {
      ctx.save(); ctx.fillStyle = d.pal.soft; A.rrect(ctx, X, y, Wc, h, 22 * u); ctx.fill();
      ctx.strokeStyle = A.rgba(d.pal.gold, 0.5); ctx.lineWidth = 1.5 * u; ctx.stroke(); ctx.restore();
      if (qb) qb.draw(d.rtl ? X + pad : X + Wc - pad - qb.w, y + (h - qb.h) / 2);
      var areaX = qb && d.rtl ? X + pad + qb.w + gapCol : X + pad, areaW = textW, ry = y + (h - rowsH) / 2;
      rows.forEach(function (r) {
        setFont(ctx, r.weight, r.f.px, d.fam.body);
        var tw = widest(ctx, r.f.lines), rowW = ic + icGap + tw, sx = qb ? (d.rtl ? areaX + areaW - rowW : areaX) : areaX + (areaW - rowW) / 2;
        var icx = d.rtl ? sx + rowW - ic : sx, tx = d.rtl ? sx + tw : sx + ic + icGap, rh = r.f.lines.length * r.lh;
        A.icon(ctx, r.icon, icx, ry + (r.lh - ic) / 2, ic, d.pal.gold);
        ctx.save(); setFont(ctx, r.weight, r.f.px, d.fam.body); ctx.fillStyle = d.pal.ink;
        drawLines(ctx, r.f.lines, tx, ry, r.lh, d.rtl ? 'right' : 'left', d.rtl, L); ctx.restore();
        L.hits.push({ id: r.id, x: X, y: ry, w: Wc, h: rh });
        ry += rh + rowGap;
      });
    } };
  }
  function blockSchedule(ctx, d, cx, maxW, u, k, L) {
    var tf = fit(ctx, d.labels.programme, { maxW: maxW, maxLines: 1, maxPx: 20 * u * k, minPx: 14 * u * k, weight: 700, fam: d.fam.body });
    var tlh = tf.px * lineH(d.labels.programme), items = d.schedule.map(function (ln) {
      var f = fit(ctx, ln, { maxW: maxW * 0.9, maxLines: 2, maxPx: 24 * u * k, minPx: 17 * u * k, weight: 400, fam: d.fam.body });
      return { f: f, lh: f.px * lineH(ln) };
    });
    var h = tlh + 6 * u * k + items.reduce(function (s, it) { return s + it.f.lines.length * it.lh; }, 0);
    return { h: h, draw: function (y) {
      var yy = y;
      ctx.save(); setFont(ctx, 700, tf.px, d.fam.body); ctx.fillStyle = d.pal.gold;
      if ('letterSpacing' in ctx) ctx.letterSpacing = (3 * u * k) + 'px';
      drawLines(ctx, tf.lines, cx, yy, tlh, 'center', d.rtl, L); ctx.restore();
      yy += tlh + 6 * u * k;
      items.forEach(function (it) {
        ctx.save(); setFont(ctx, 400, it.f.px, d.fam.body); ctx.fillStyle = d.pal.ink; ctx.globalAlpha = 0.92;
        drawLines(ctx, it.f.lines, cx, yy, it.lh, 'center', d.rtl, L); ctx.restore();
        yy += it.f.lines.length * it.lh;
      });
      L.hits.push({ id: 'schedule', x: cx - maxW / 2, y: y, w: maxW, h: h });
    } };
  }
  function blockFooter(ctx, d, cx, maxW, u, k, L) {
    var ff = d.family ? fitB(ctx, d.family, { maxW: maxW, maxLines: 2, maxPx: 24 * u * k, minPx: 17 * u * k, weight: 400, fam: d.fam.body }) : null;
    var flh = ff ? ff.px * lineH(d.family) : 0;
    var rs = d.rsvp ? d.labels.rsvp + ': ' + d.rsvp : '';
    var rf = rs ? fit(ctx, rs, { maxW: maxW * 0.9, maxLines: 1, maxPx: 23 * u * k, minPx: 16 * u * k, weight: 400, fam: d.fam.body }) : null;
    var rlh = rf ? rf.px * lineH(rs) : 0, ic = rf ? rf.px * 0.95 : 0, gap = ff && rf ? 6 * u * k : 0;
    var h = (ff ? ff.lines.length * flh : 0) + gap + rlh;
    return { h: h, draw: function (y) {
      var yy = y;
      if (ff) {
        ctx.save(); setFont(ctx, 400, ff.px, d.fam.body); ctx.fillStyle = d.pal.ink; ctx.globalAlpha = 0.95;
        drawLines(ctx, ff.lines, cx, yy, flh, 'center', d.rtl, L); ctx.restore();
        L.hits.push({ id: 'family', x: cx - maxW / 2, y: yy, w: maxW, h: ff.lines.length * flh });
        yy += ff.lines.length * flh + gap;
      }
      if (rf) {
        setFont(ctx, 400, rf.px, d.fam.body);
        var tw = ctx.measureText(rf.lines[0]).width, rowW = tw + ic + 10 * u * k, sx = cx - rowW / 2;
        var icx = d.rtl ? sx + rowW - ic : sx, tx = d.rtl ? sx + tw : sx + ic + 10 * u * k;
        A.icon(ctx, 'phone', icx, yy + (rlh - ic) / 2, ic, d.pal.gold);
        ctx.save(); setFont(ctx, 400, rf.px, d.fam.body); ctx.fillStyle = d.pal.ink; ctx.globalAlpha = 0.95;
        drawLines(ctx, rf.lines, tx, yy, rlh, d.rtl ? 'right' : 'left', d.rtl, L); ctx.restore();
        L.hits.push({ id: 'rsvp', x: cx - maxW / 2, y: yy, w: maxW, h: rlh });
      }
    } };
  }

  /* ---------------------------------------------------------------- the card */
  /* initials for the monogram skip honorifics: "Shri Rajesh Sharma" -> R, "श्रीमती सुनीता" -> सु */
  var HONORIFIC = /^(shri|shree|sri|smt\.?|mr\.?|mrs\.?|ms\.?|dr\.?|er\.?|prof\.?|श्री|श्रीमती|सौ\.?|चि\.?|कु\.?|ਸ\.?|ਸ਼੍ਰੀ|ਸ਼੍ਰੀਮਤੀ|શ્રી|શ્રીમતી|শ্রী|শ্রীমতী|ଶ୍ରୀ|ଶ୍ରୀମତୀ|திரு|திருமதி|శ్రీ|శ్రీమతి|ಶ್ರೀ|ಶ್ರೀಮತಿ|ശ്രീ|ശ്രീമതി|جناب|محترمہ)\s+/i;
  function bareName(s) { var v = String(s || '').trim(), prev; do { prev = v; v = v.replace(HONORIFIC, ''); } while (v !== prev); return v || String(s || '').trim(); }
  function drawCard(ctx, W, H, d) {
    var u = W / 1080, dz = d.design, L = { hits: [], photo: null, qr: null, lines: [], W: W, H: H };
    ctx.save(); ctx.textBaseline = 'middle';
    A.background(ctx, W, H, d.pal, dz, A.rng(d.seed), u);
    A.frame(ctx, W, H, d.pal, dz.frame, u);
    A.corners(ctx, W, H, d.pal, dz.corner, u);
    var topH = (TOP_H[dz.top] || 0) * u, botH = (BOT_H[dz.bottom] || 0) * u;
    if (dz.top !== 'none') {
      var mono = graphemes(bareName(d.n1))[0] || '', ex = { fam: d.fam.names };
      if (d.n2) mono = mono + (graphemes(bareName(d.n2))[0] || '');
      ex.mono = mono.toUpperCase();
      if (d.symInBand) { ex.symDraw = d.sym.draw; ex.symGlyph = d.sym.glyph; ex.symFam = d.sym.glyphScript ? sacredFam(d.sym.glyphScript) : null; }
      (A.top[dz.top] || A.top.none)(ctx, W, topH, d.pal, A.rng(d.seed + 11), u, ex);
    }
    if (dz.bottom !== 'none') (A.bottom[dz.bottom] || A.bottom.none)(ctx, W, H, botH, d.pal, A.rng(d.seed + 23), u);
    layout(ctx, W, H, d, u, topH, botH, L);
    ctx.restore();
    return L;
  }
  function layout(ctx, W, H, d, u, topH, botH, L) {
    var m = 96 * u, X = m, Wc = W - 2 * m, cx = W / 2;
    var hasCorner = d.design.corner !== 'none', hasArch = d.design.frame === 'arch';
    var Y0 = Math.max(72 * u, topH + 14 * u, hasCorner ? 140 * u : 0, hasArch ? (W - 68 * u) / 2 * 0.55 + 34 * u + 20 * u : 0);
    var Y1 = H - Math.max(72 * u, botH + 14 * u, hasCorner ? 120 * u : 0), Hc = Y1 - Y0;
    function build(k) {
      var B = [], w = Wc * 0.96;
      if (d.sym && d.sym.id !== 'none') B.push(blockSymbol(ctx, d, cx, w, u, k, L));
      if (d.heading) B.push(blockHeading(ctx, d, cx, w, u, k, L));
      if (d.invite) B.push(blockPara(ctx, d, d.invite, cx, w * 0.9, u, k, { px: 27, maxLines: 4, fam: d.fam.body, col: d.pal.ink, alpha: 0.9 }, L, 'invite'));
      if (d.photo) B.push(blockPhoto(ctx, d, cx, w, u, k, L));
      if (d.n1) B.push(blockNames(ctx, d, cx, w, u, k, L));
      if (d.sub) B.push(blockPara(ctx, d, d.sub, cx, w * 0.92, u, k, { px: 24, maxLines: 3, fam: d.fam.body, col: d.pal.ink, alpha: 0.88 }, L, 'sub'));
      var det = blockDetails(ctx, d, X + Wc * 0.03, Wc * 0.94, u, k, L);
      if (det) { B.push(blockDivider(ctx, d, cx, w, u, k, L)); B.push(det); }
      if (d.schedule.length) B.push(blockSchedule(ctx, d, cx, w * 0.9, u, k, L));
      if (d.closing) B.push(blockPara(ctx, d, d.closing, cx, w * 0.9, u, k, { px: 27, maxLines: 2, fam: d.fam.body, col: d.pal.head, italic: !d.rtl && !d.fam.simple }, L, 'closing'));
      if (d.family || d.rsvp) B.push(blockFooter(ctx, d, cx, w * 0.92, u, k, L));
      return B;
    }
    /* everything filled to the maximum on a square card still has to stay inside the frame: shrink the whole text block
       (down to ~a third) and, below 0.6, close the gaps too, so text never runs into the bottom motifs */
    var B, gap, total, k;
    for (k = 1; k >= 0.34; k -= 0.04) {
      B = build(k); gap = (k < 0.6 ? 8 : 20) * u * k;
      total = B.reduce(function (s, b) { return s + b.h; }, 0) + gap * Math.max(0, B.length - 1);
      if (total <= Hc) break;
    }
    var extra = Math.max(0, Hc - total), eg = Math.min(extra / (B.length + 1), 34 * u);
    var y = Y0 + (Hc - total - eg * Math.max(0, B.length - 1)) / 2;
    B.forEach(function (b) { b.draw(y); y += b.h + gap + eg; });
  }

  /* ---------------------------------------------------------------- data for one render */
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function buildData(lang) {
    var dz = design(), pal = palette(), tx = textOf(S.occ, lang), q = mapInfo(), lb = CC(lang).labels;
    var d = { design: dz, pal: pal, lang: lang, rtl: lang === 'ur', fam: families(lang), labels: lb, sym: SYM[symId()],
      dateText: fmtDate(dateVal(), lang), timeText: fmtTime(timeVal(), lang), venue: String(venueVal(lang) || '').trim(), rsvp: String(rsvpVal() || '').trim(),
      qr: q.ok ? q : null, map: q.ok ? q.url : '', photo: photoEl, seed: (hashStr(dz.id) + (+S.seed[dz.id] || 0) * 7919) >>> 0 };
    TEXT_FIELDS.forEach(function (f) { d[f] = String(tx[f] || '').trim(); });
    d.schedule = d.schedule ? d.schedule.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 8) : [];
    if (!d.n1 && d.n2) { d.n1 = d.n2; d.n2 = ''; }       /* only "Name 2" filled in: still a name on the card */
    if (!d.n2) d.join = '';
    /* invocation line: Sanskrit lines in the card's own script (content.js), Gurmukhi / Arabic lines fixed (data.js) */
    var sym = d.sym;
    d.symLine = sym ? (sym.lineKey ? String(lb[sym.lineKey] || '') : sym.line || '') : '';
    d.symLineScript = sym && sym.lineKey ? (lang === 'en' ? 'deva' : null) : (sym ? sym.lineScript : null);
    d.symFam = d.symLineScript ? sacredFam(d.symLineScript) : d.fam.body;
    d.symRtl = d.symLineScript === 'arab' || (!d.symLineScript && d.rtl);
    /* the minimal design has one medallion at the top: it holds the sacred symbol, or the couple's initials when there is none */
    d.symInBand = dz.top === 'monogram' && !!(d.sym && (d.sym.draw || d.sym.glyph));
    return d;
  }

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
    var sz = SIZE[S.size], lang = cardLang(), d = buildData(lang);
    return prepFonts(lang, d).then(function () {
      d = buildData(lang);
      var s = Math.min(1, PREVIEW_MAX / Math.max(sz.w, sz.h)), cw = Math.round(sz.w * s), ch = Math.round(sz.h * s);
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      var ctx = canvas.getContext('2d');
      ctx.setTransform(s, 0, 0, s, 0, 0);
      lastLayout = drawCard(ctx, sz.w, sz.h, d);
      canvas.dataset.w = sz.w; canvas.dataset.h = sz.h; canvas.dataset.occ = S.occ; canvas.dataset.design = d.design.id; canvas.dataset.lang = lang;
      canvas.dataset.text = lastLayout.lines.join('\n');
      canvas.dataset.qr = lastLayout.qr ? lastLayout.qr.modules + 'x' + Math.round(lastLayout.qr.px) : '';
      canvas.dataset.rev = String(++rev);
    });
  }
  function renderFull(sz, lang) {
    var d = buildData(lang);
    return prepFonts(lang, d).then(function () {
      var cv = document.createElement('canvas'); cv.width = sz.w; cv.height = sz.h;
      drawCard(cv.getContext('2d'), sz.w, sz.h, buildData(lang));
      return cv;
    });
  }
  function toBlob(cv, type, q) {
    return new Promise(function (res, rej) { try { cv.toBlob(function (b) { if (b) res(b); else rej(new Error('toBlob failed')); }, type, q); } catch (e) { rej(e); } });
  }
  function fileName(lang, ext) {
    var nm = String(textOf(S.occ, lang).n1 || '').normalize('NFC').replace(/[︀-️⃣]|\uD83C[\uDFFB-\uDFFF]/g, '');
    var base = nm.replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'invite';
    return base + '-' + S.occ + '-' + S.size + '-' + lang + '.' + ext;
  }
  var working = false;
  function busy(on) { working = !!on; $('#busy').hidden = !on; }
  var LRI = String.fromCharCode(0x2066), PDI = String.fromCharCode(0x2069);
  function iso(s) { return LRI + s + PDI; }
  function say(msg) { $('#status').textContent = msg; EDU.toast(msg); }
  function exportPng() {
    if (working) return Promise.resolve();
    var lang = cardLang(); busy(true);
    return renderFull(SIZE[S.size], lang).then(function (cv) { return toBlob(cv, 'image/png'); }).then(function (blob) {
      var name = fileName(lang, 'png'); EDU.download(name, blob); say(t('saved_file', { name: iso(name) })); busy(false);
    }).catch(function (e) { busy(false); console.error(e); });
  }
  function shareCard() {
    if (working) return Promise.resolve();
    var lang = cardLang(); busy(true);
    return renderFull(SIZE[S.size], lang).then(function (cv) { return toBlob(cv, 'image/png'); }).then(function (blob) {
      busy(false);
      var name = fileName(lang, 'png'), files = null, can = false;
      try { files = [new File([blob], name, { type: 'image/png' })]; can = !!(navigator.share && navigator.canShare && navigator.canShare({ files: files })); } catch (e) { can = false; }
      if (can) return navigator.share({ files: files, title: t('app_title'), text: inviteText(buildData(lang)) }).catch(function (err) { if (err && err.name !== 'AbortError') { EDU.download(name, blob); EDU.toast(t('share_none')); } });
      EDU.download(name, blob); EDU.toast(t('share_none'));
    }).catch(function (e) { busy(false); console.error(e); });
  }
  function inviteText(d) {
    var L = [], lb = d.labels;
    if (d.heading) L.push('*' + d.heading + '*');
    if (d.invite) L.push(d.invite);
    var nm = [d.n1, d.join, d.n2].filter(Boolean).join(' ');
    if (nm) L.push('*' + nm + '*');
    if (d.sub) L.push(d.sub);
    L.push('');
    if (d.dateText) L.push('📅 ' + lb.date + ': ' + d.dateText);
    if (d.timeText) L.push('🕖 ' + lb.time + ': ' + d.timeText);
    if (d.venue) L.push('📍 ' + lb.venue + ': ' + d.venue);
    if (d.map) L.push(d.map);
    if (d.schedule.length) { L.push(''); L.push('*' + lb.programme + '*'); d.schedule.forEach(function (s) { L.push('• ' + s); }); }
    L.push('');
    if (d.closing) L.push(d.closing);
    if (d.family) L.push(d.family);
    if (d.rsvp) L.push(lb.rsvp + ': ' + d.rsvp);
    return L.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function copyText() { EDU.copy(inviteText(buildData(cardLang()))).then(function () { $('#status').textContent = t('copied_text'); }); }

  /* print: always the A5 render (300 dpi); one per page, or two side by side on A4 landscape */
  var printing = false;
  window.addEventListener('afterprint', function () { printing = false; $('#printArea').textContent = ''; });
  /* printing from the browser menu (not our buttons): print a copy of the preview instead of a blank page */
  window.addEventListener('beforeprint', function () {
    if (printing) return;
    var area = $('#printArea'); area.textContent = '';
    try { area.appendChild(el('img', { alt: '', class: 'pr-one', src: canvas.toDataURL('image/png') })); } catch (e) { return; }
    $('#pageStyle').textContent = '@page { size: A5 portrait; margin: 0; } .pr-one { width: 100%; height: 100vh; object-fit: contain; }';
  });
  function printCard(two) {
    if (working) return;
    busy(true);
    renderFull(SIZE.a5, cardLang()).then(function (cv) { return toBlob(cv, 'image/png'); }).then(function (blob) {
      var url = URL.createObjectURL(blob), area = $('#printArea'); area.textContent = '';
      $('#pageStyle').textContent = two
        ? '@page { size: A4 landscape; margin: 0; }'
        : '@page { size: A5 portrait; margin: 0; } .pr-one { width: 100%; height: 100vh; object-fit: contain; }';
      var imgs = [], n = two ? 2 : 1, loaded = 0;
      var wrapEl = two ? el('div', { class: 'pr-two' }) : null;
      for (var i = 0; i < n; i++) {
        var img = el('img', { alt: '', class: two ? '' : 'pr-one' });
        img.onload = function () { if (++loaded === n) { busy(false); printing = true; setTimeout(function () { window.print(); }, 60); setTimeout(function () { URL.revokeObjectURL(url); }, 60000); } };
        img.onerror = function () { busy(false); URL.revokeObjectURL(url); };
        imgs.push(img);
        (wrapEl || area).appendChild(img);
      }
      if (wrapEl) area.appendChild(wrapEl);
      imgs.forEach(function (im) { im.src = url; });
    }).catch(function (e) { busy(false); console.error(e); });
  }

  /* ---------------------------------------------------------------- photo (stays on the device) */
  function decodePhoto() {
    if (!photoRec || typeof photoRec.src !== 'string') { photoEl = null; return Promise.resolve(); }
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { photoEl = im; res(); };
      im.onerror = function () { photoEl = null; photoRec = null; store.remove('photo'); res(); };
      im.src = photoRec.src;
    });
  }
  function pickPhoto() {
    EDU.pickFile('image/*').then(function (file) {
      if (!file) return;
      if (file.type && !/^image\//.test(file.type)) { EDU.toast(t('img_bad')); return; }
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var iw = im.naturalWidth || 600, ih = im.naturalHeight || 600, s = Math.min(1, 1400 / Math.max(iw, ih)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(iw * s)); c.height = Math.max(1, Math.round(ih * s));
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        photoRec = { src: c.toDataURL('image/jpeg', 0.86), w: iw, h: ih };
        URL.revokeObjectURL(url);
        S.zoom = 1; S.ox = 0; S.oy = 0; $('#photoZoom').value = 1; save();
        if (!store.set('photo', photoRec)) EDU.toast(t('img_unsaved'));
        decodePhoto().then(function () { syncPhoto(); scheduleRender(); });
      };
      im.onerror = function () { URL.revokeObjectURL(url); EDU.toast(t('img_bad')); };
      im.src = url;
    });
  }
  function removePhoto() { photoRec = null; photoEl = null; store.remove('photo'); syncPhoto(); scheduleRender(); }
  function syncPhoto() {
    var th = $('#photoThumb'); th.textContent = '';
    if (photoRec) th.appendChild(el('img', { src: photoRec.src, alt: '' })); else th.appendChild(el('span', { 'aria-hidden': 'true', text: '🖼️' }));
    $('#photoRemove').hidden = !photoRec; $('#photoOpts').hidden = !photoRec;
    Array.prototype.forEach.call(document.querySelectorAll('#shapeSeg button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.shape === S.shape)); });
    $('#photoZoom').value = S.zoom;
  }

  /* ---------------------------------------------------------------- UI: occasions, designs, palettes, segs */
  function renderOcc() {
    var box = $('#occList'); box.textContent = '';
    D.OCCASIONS.forEach(function (id) {
      var b = el('button', { type: 'button', class: 'occ', 'aria-pressed': String(S.occ === id), dataset: { occ: id },
        onclick: function () { selectOcc(id); } },
        el('span', { class: 'occ-ic', 'aria-hidden': 'true', text: D.OCC_ICON[id] }),
        el('span', { class: 'occ-name', text: defaults(id, EDU.lang).name }));
      box.appendChild(b);
    });
  }
  function selectOcc(id) {
    if (!D.OCC_DESIGN[id]) return;
    S.occ = id; S.design = null; S.sym = null; save();
    Array.prototype.forEach.call(document.querySelectorAll('.occ'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.occ === id)); });
    syncText(); renderDesigns(); renderPalettes(); renderSym(); scheduleRender();
  }
  function renderDesigns() {
    var box = $('#designGrid'), cur = design().id; box.textContent = '';
    D.DESIGNS.forEach(function (dz) {
      var p = D.PAL[dz.pals[clamp(+S.pal[dz.id] || 0, 0, dz.pals.length - 1)]];
      box.appendChild(el('button', { type: 'button', class: 'design' + (p.dark ? ' dark' : ''), 'aria-pressed': String(dz.id === cur), dataset: { design: dz.id },
        style: { '--b1': p.bg[0], '--b2': p.bg[1], '--t': p.ink, '--g': p.gold },
        onclick: function () { S.design = dz.id; save(); renderDesigns(); renderPalettes(); scheduleRender(); } },
        el('span', { class: 'design-ic', 'aria-hidden': 'true', text: dz.icon }),
        el('span', { class: 'design-name', text: t('design_' + dz.id) })));
    });
  }
  function renderPalettes() {
    var dz = design(), box = $('#palSwatches'), cur = clamp(+S.pal[dz.id] || 0, 0, dz.pals.length - 1); box.textContent = '';
    dz.pals.forEach(function (pn, i) {
      var p = D.PAL[pn];
      box.appendChild(el('button', { type: 'button', class: 'swatch', 'aria-pressed': String(i === cur), 'aria-label': t('colour_n', { n: i + 1 }), title: t('colour_n', { n: i + 1 }),
        style: { '--b1': p.bg[0], '--b2': p.bg[1], '--g': p.gold },
        onclick: function () { S.pal[dz.id] = i; save(); renderPalettes(); renderDesigns(); scheduleRender(); } },
        el('span', { class: 'sw-dot', 'aria-hidden': 'true' })));
    });
  }
  function renderSizes() { Array.prototype.forEach.call(document.querySelectorAll('#sizeSeg button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.size === S.size)); }); }
  function renderFontSeg() { Array.prototype.forEach.call(document.querySelectorAll('#fontSeg button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.font === S.font)); }); }
  function renderSym() {
    var box = $('#symSeg'), cur = symId(); box.textContent = '';
    D.SYMBOLS.forEach(function (s) {
      var kids = [];
      if (s.glyph) kids.push(el('span', { class: 'sym-g no-i18n', 'aria-hidden': 'true', text: s.glyph }));
      kids.push(el('span', { text: t('sym_' + s.id) }));
      box.appendChild(el('button', { type: 'button', class: 'chip', 'aria-pressed': String(s.id === cur), dataset: { sym: s.id },
        onclick: function () { S.sym = s.id; save(); renderSym(); scheduleRender(); } }, kids));
    });
  }
  function renderCardLangSel() {
    var sel = $('#cardLang');
    if (!sel.options.length) EDU.LANGS.forEach(function (l) { sel.appendChild(el('option', { value: l.code, text: l.native })); });
    sel.value = cardLang();
  }

  /* ---------------------------------------------------------------- UI: wording + details */
  function syncText() {
    var lang = cardLang(), tx = textOf(S.occ, lang), df = defaults(S.occ, lang), same = true;
    TEXT_FIELDS.forEach(function (f) {
      var inp = $('#f_' + f); inp.value = tx[f]; inp.setAttribute('lang', lang); inp.dir = lang === 'ur' ? 'rtl' : 'auto';
      if (tx[f] !== df[f]) same = false;
    });
    $('#textReset').hidden = same;
    $('#f_venue').value = venueVal(lang); $('#f_venue').setAttribute('lang', lang); $('#f_venue').dir = lang === 'ur' ? 'rtl' : 'auto';
    $('#f_date').value = dateVal(); $('#f_time').value = timeVal(); $('#rsvp').value = rsvpVal(); $('#mapUrl').value = S.map;
    $('#exampleNote').hidden = !isExample();
    updateMapMsg();
  }
  /* the first edit fixes the card language: switching the UI language afterwards must not swap the typed names for the
     sample ones of another language (the user can still pick any card language in the drop-down) */
  function pinLang() { if (!S.cardLang) { S.cardLang = EDU.lang; renderCardLangSel(); } }
  function onTextInput() {
    pinLang();
    var lang = cardLang(), key = S.occ + '|' + lang, df = defaults(S.occ, lang), cu = {}, any = false;
    TEXT_FIELDS.forEach(function (f) { var v = $('#f_' + f).value; if (v !== df[f]) { cu[f] = v; any = true; } });
    if (any) S.custom[key] = cu; else delete S.custom[key];
    $('#textReset').hidden = !any; $('#exampleNote').hidden = !isExample();
    save(); scheduleRender(40);
  }
  function onDetailInput() {
    pinLang();
    S.date = $('#f_date').value || ''; S.time = $('#f_time').value || ''; S.venue = $('#f_venue').value; S.rsvp = $('#rsvp').value; S.map = $('#mapUrl').value;
    $('#exampleNote').hidden = !isExample(); updateMapMsg(); save(); scheduleRender(40);
  }
  function updateMapMsg() {
    var m = $('#mapMsg'), q = mapInfo(); m.className = 'small mb0';
    if (q.none) { m.textContent = ''; m.dataset.state = 'none'; return; }
    if (q.err) { m.textContent = t(q.err); m.classList.add('bad'); m.dataset.state = 'bad'; return; }
    m.textContent = '✓ ' + t('map_ok'); m.classList.add('ok'); m.dataset.state = 'ok';
  }
  function clearExample() {
    pinLang();
    var lang = cardLang(), key = S.occ + '|' + lang, cu = obj(S.custom[key]);
    ['n1', 'n2', 'sub', 'family', 'schedule'].forEach(function (f) { cu[f] = ''; });
    S.custom[key] = cu; S.venue = ''; S.rsvp = ''; save(); syncText(); scheduleRender(); $('#f_n1').focus();
  }

  /* ---------------------------------------------------------------- drafts */
  function drafts() { var d = store.get('drafts', []); return Array.isArray(d) ? d : []; }
  function draftDefaultName() { var tx = textOf(S.occ, cardLang()); return [tx.n1, tx.n2].filter(Boolean).join(' & ') + ' · ' + defaults(S.occ, EDU.lang).name; }
  function saveDraft() {
    var name = $('#draftName').value.trim() || draftDefaultName(), list = drafts();
    list.unshift({ id: Date.now(), name: name.slice(0, 60), at: new Date().toISOString(), state: JSON.parse(JSON.stringify(S)), photo: photoRec });
    var dropped = list.length > 12;
    list = list.slice(0, 12);
    if (!store.set('drafts', list)) {
      var lite = list.map(function (x, i) { return i === 0 ? Object.assign({}, x, { photo: null }) : x; });
      if (!store.set('drafts', lite)) { EDU.toast(t('draft_full')); return; }
      EDU.toast(t('img_unsaved'));
    }
    $('#draftName').value = ''; renderDrafts(); say(t('draft_saved'));
    if (dropped) EDU.toast(t('draft_limit'), 5000);
  }
  function openDraft(id) {
    var d = drafts().filter(function (x) { return x.id === id; })[0]; if (!d) return;
    S = loadState(d.state); photoRec = d.photo || null; store.set('state', S);
    if (photoRec) store.set('photo', photoRec); else store.remove('photo');
    decodePhoto().then(function () { renderAll(); scheduleRender(); say(t('draft_opened')); });
  }
  function deleteDraft(id) {
    if (!confirm(t('draft_delete_q'))) return;
    store.set('drafts', drafts().filter(function (x) { return x.id !== id; })); renderDrafts();
  }
  function renderDrafts() {
    var box = $('#draftList'), list = drafts(); box.textContent = '';
    if (!list.length) { box.appendChild(el('p', { class: 'small muted mb0', text: t('drafts_none') })); return; }
    var fmt; try { fmt = new Intl.DateTimeFormat(localeTag(EDU.lang), { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); } catch (e) { fmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }); }
    list.forEach(function (d) {
      var occName = defaults(d.state && d.state.occ || 'wedding', EDU.lang).name;
      box.appendChild(el('div', { class: 'draft-row', dataset: { id: d.id } },
        el('div', {}, el('div', { class: 'draft-name no-i18n', text: d.name }), el('div', { class: 'draft-meta', text: occName + ' · ' + fmt.format(new Date(d.at)) })),
        el('button', { type: 'button', class: 'btn btn-sm', text: t('draft_open'), onclick: function () { openDraft(d.id); } }),
        el('button', { type: 'button', class: 'btn btn-sm btn-danger', text: t('delete'), 'aria-label': t('delete') + ': ' + d.name, onclick: function () { deleteDraft(d.id); } })));
    });
  }

  /* ---------------------------------------------------------------- canvas interaction */
  var drag = null;
  function cardPoint(e) { var r = canvas.getBoundingClientRect(), sz = SIZE[S.size]; return { x: (e.clientX - r.left) / r.width * sz.w, y: (e.clientY - r.top) / r.height * sz.h }; }
  function inRect(p, b) { return b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }
  var HIT_FIELD = { sym: 'symSeg', heading: 'f_heading', invite: 'f_invite', n1: 'f_n1', sub: 'f_sub', date: 'f_date', time: 'f_time', venue: 'f_venue', schedule: 'f_schedule', closing: 'f_closing', family: 'f_family', rsvp: 'rsvp', photo: 'photoZoom' };
  canvas.addEventListener('pointerdown', function (e) {
    if (!lastLayout || !lastLayout.photo) return;
    var p = cardPoint(e); if (!inRect(p, lastLayout.photo)) return;
    drag = { x: p.x, y: p.y, ox: S.ox, oy: S.oy, moved: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
    e.preventDefault();
  });
  canvas.addEventListener('touchstart', function (e) {
    if (!lastLayout || !lastLayout.photo || e.touches.length !== 1) return;
    if (inRect(cardPoint(e.touches[0]), lastLayout.photo)) e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag || !lastLayout || !lastLayout.photo) return;
    var p = cardPoint(e), ph = lastLayout.photo;
    if (Math.abs(p.x - drag.x) + Math.abs(p.y - drag.y) > 3) drag.moved = true;
    if (ph.slackX > 1) S.ox = clamp(drag.ox - 2 * (p.x - drag.x) / ph.slackX, -1, 1);
    if (ph.slackY > 1) S.oy = clamp(drag.oy - 2 * (p.y - drag.y) / ph.slackY, -1, 1);
    scheduleRender(0);
  });
  function endDrag() { if (drag) { if (drag.moved) save(); setTimeout(function () { drag = null; }, 0); } }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('click', function (e) {
    if ((drag && drag.moved) || !lastLayout) return;
    var p = cardPoint(e), hit = null;
    for (var i = lastLayout.hits.length - 1; i >= 0; i--) if (inRect(p, lastLayout.hits[i])) { hit = lastLayout.hits[i]; break; }
    if (!hit) return;
    var f = $('#' + HIT_FIELD[hit.id]); if (!f) return;
    if (f.tagName === 'DIV') f = f.querySelector('button') || f;
    f.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (err) { f.focus(); } }, 250);
  });
  canvas.addEventListener('keydown', function (e) {
    if (!photoEl) return;
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
  Array.prototype.forEach.call(document.querySelectorAll('#sizeSeg button'), function (b) { b.addEventListener('click', function () { S.size = b.dataset.size; save(); renderSizes(); scheduleRender(); }); });
  $('#dlPng').addEventListener('click', exportPng);
  $('#shareBtn').addEventListener('click', shareCard);
  $('#copyText').addEventListener('click', copyText);
  $('#printA5').addEventListener('click', function () { printCard(false); });
  $('#print2up').addEventListener('click', function () { printCard(true); });
  $('#cardLang').addEventListener('change', function () { S.cardLang = this.value; save(); syncText(); renderSym(); scheduleRender(); });
  TEXT_FIELDS.forEach(function (f) { $('#f_' + f).addEventListener('input', onTextInput); });
  ['f_date', 'f_time', 'f_venue', 'rsvp', 'mapUrl'].forEach(function (id) { $('#' + id).addEventListener('input', onDetailInput); $('#' + id).addEventListener('change', onDetailInput); });
  $('#textReset').addEventListener('click', function () { delete S.custom[S.occ + '|' + cardLang()]; save(); syncText(); scheduleRender(); });
  $('#exampleClear').addEventListener('click', clearExample);
  Array.prototype.forEach.call(document.querySelectorAll('#fontSeg button'), function (b) { b.addEventListener('click', function () { S.font = b.dataset.font; save(); renderFontSeg(); scheduleRender(); }); });
  $('#photoAdd').addEventListener('click', pickPhoto);
  $('#photoRemove').addEventListener('click', removePhoto);
  Array.prototype.forEach.call(document.querySelectorAll('#shapeSeg button'), function (b) { b.addEventListener('click', function () { S.shape = b.dataset.shape; save(); syncPhoto(); scheduleRender(); }); });
  $('#photoZoom').addEventListener('input', function () { S.zoom = clamp(+this.value || 1, 1, 3); save(); scheduleRender(0); });
  $('#draftSave').addEventListener('click', saveDraft);
  $('#draftName').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); saveDraft(); } });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['state', 'photo'].forEach(function (k) { store.remove(k); });
    location.reload();
  });
  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    var k = String(e.key || '').toLowerCase();
    if (k === 's') { e.preventDefault(); exportPng(); }
    else if (k === 'p') { e.preventDefault(); printCard(false); }
  });
  if (document.fonts && document.fonts.addEventListener) {
    var fT = null;
    document.fonts.addEventListener('loadingdone', function () { clearTimeout(fT); fT = setTimeout(function () { scheduleRender(); }, 80); });
  }

  function renderAll() {
    renderCardLangSel(); renderOcc(); renderDesigns(); renderPalettes(); renderSizes(); renderFontSeg(); renderSym(); syncText(); syncPhoto(); renderDrafts();
  }
  EDU.onLang(function () { renderAll(); scheduleRender(); });

  renderAll();
  decodePhoto().then(function () { syncPhoto(); requestRender(); });
})();
