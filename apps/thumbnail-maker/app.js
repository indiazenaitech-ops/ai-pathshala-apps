/* YouTube Thumbnail Maker: a 1280x720 thumbnail / 1080x1920 Shorts cover drawn on a canvas in the browser.
 * Photo (never uploaded), a big auto-fitting headline with outline + shadow in any Indian script (Google Fonts when
 * online, device fonts offline), highlighted words, drawn stickers (arrow, circle, badge, emoji), channel strip,
 * contrast check, 160 px mini preview, PNG/JPG export kept under YouTube's 2 MB limit, saved A/B versions. */
(function () {
  'use strict';
  var SLUG = 'thumbnail-maker';
  var C = window.APP_CONTENT;
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$;
  var PI = Math.PI, TAU = PI * 2;
  var CODES = EDU.LANGS.map(function (l) { return l.code; });
  var SIZES = { yt: { w: 1280, h: 720 }, shorts: { w: 1080, h: 1920 } };
  var MAX_BYTES = 2 * 1024 * 1024, MAX_VARIANTS = 8;
  var EMOJIS = ['😮', '🔥', '✅', '❌', '💯', '🤔', '😂', '🎯', '⚡', '📚', '💰', '🎉', '😱', '👉', '⭐', '🚀'];
  var POS = { tl: [0.14, 0.15], t: [0.5, 0.12], tr: [0.86, 0.15], l: [0.13, 0.5], c: [0.5, 0.5], r: [0.87, 0.5], bl: [0.14, 0.85], b: [0.5, 0.87], br: [0.86, 0.85] };

  /* ---------------------------------------------------------------- scripts & fonts */
  var SCRIPT_RE = {
    deva: /[ऀ-ॿ]/, beng: /[ঀ-৿]/, guru: /[਀-੿]/, gujr: /[઀-૿]/, orya: /[଀-୿]/,
    taml: /[஀-௿]/, telu: /[ఀ-౿]/, knda: /[ಀ-೿]/, mlym: /[ഀ-ൿ]/,
    arab: /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/
  };
  var RTL_RE = SCRIPT_RE.arab;
  var SYS = {
    latn: '"Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial',
    deva: '"Nirmala UI", "Noto Sans Devanagari", "Kohinoor Devanagari", "Devanagari Sangam MN", Mangal',
    beng: '"Nirmala UI", "Noto Sans Bengali", "Kohinoor Bangla", "Bangla Sangam MN", Vrinda',
    guru: '"Nirmala UI", "Noto Sans Gurmukhi", "Gurmukhi Sangam MN", "Mukta Mahee", Raavi',
    gujr: '"Nirmala UI", "Noto Sans Gujarati", "Kohinoor Gujarati", "Gujarati Sangam MN", Shruti',
    orya: '"Nirmala UI", "Noto Sans Oriya", "Oriya Sangam MN", Kalinga',
    taml: '"Nirmala UI", "Noto Sans Tamil", "Tamil Sangam MN", Latha',
    telu: '"Nirmala UI", "Noto Sans Telugu", "Kohinoor Telugu", "Telugu Sangam MN", Gautami',
    knda: '"Nirmala UI", "Noto Sans Kannada", "Kannada Sangam MN", Tunga',
    mlym: '"Nirmala UI", "Noto Sans Malayalam", "Malayalam Sangam MN", Kartika',
    arab: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", "Noto Naskh Arabic", "Segoe UI", Tahoma'
  };
  var EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"';
  /* Google Fonts (free, OFL) display families per style and script: [family, axis spec] */
  var GF = {
    bold: { latn: ['Noto Sans', 'wght@900'], deva: ['Noto Sans Devanagari', 'wght@900'], beng: ['Noto Sans Bengali', 'wght@900'], gujr: ['Noto Sans Gujarati', 'wght@900'], guru: ['Noto Sans Gurmukhi', 'wght@900'], orya: ['Noto Sans Oriya', 'wght@900'], taml: ['Noto Sans Tamil', 'wght@900'], telu: ['Noto Sans Telugu', 'wght@900'], knda: ['Noto Sans Kannada', 'wght@900'], mlym: ['Noto Sans Malayalam', 'wght@900'], arab: ['Noto Nastaliq Urdu', 'wght@700'] },
    round: { latn: ['Baloo 2', 'wght@800'], deva: ['Baloo 2', 'wght@800'], beng: ['Baloo Da 2', 'wght@800'], gujr: ['Baloo Bhai 2', 'wght@800'], guru: ['Baloo Paaji 2', 'wght@800'], orya: ['Baloo Bhaina 2', 'wght@800'], taml: ['Baloo Thambi 2', 'wght@800'], telu: ['Baloo Tammudu 2', 'wght@800'], knda: ['Baloo Tamma 2', 'wght@800'], mlym: ['Baloo Chettan 2', 'wght@800'], arab: ['Noto Nastaliq Urdu', 'wght@700'] },
    tall: { latn: ['Anton', ''] }
  };
  function mainScript(text) {
    var s = String(text || '');
    for (var k in SCRIPT_RE) if (SCRIPT_RE[k].test(s)) return k;
    return 'latn';
  }
  function isRTL(text) {
    var m = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿A-Za-zऀ-෿]/.exec(String(text || ''));
    return !!m && RTL_RE.test(m[0]);
  }
  var gfLinked = {}, gfLoaded = {};
  function q(f) { return '"' + f + '"'; }
  function ensureGF(fam, spec) {
    if (gfLinked[fam]) return;
    gfLinked[fam] = 1;
    if (location.protocol === 'file:' && !navigator.onLine) return;
    var l = el('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=' + fam.replace(/ /g, '+') + (spec ? ':' + spec : '') + '&display=swap' });
    l.addEventListener('load', function () { scheduleRender(60); });
    document.head.appendChild(l);
  }
  /* font stack for one piece of text: web display font (if loaded) -> device script font -> Latin -> emoji */
  function fontFor(style, text) {
    var sc = mainScript(text), st = style;
    if (st === 'tall' && sc !== 'latn') st = 'bold';
    var fams = [], gf = [], g = GF[st][sc];
    if (g) { ensureGF(g[0], g[1]); fams.push(q(g[0])); gf.push(g[0]); }
    if (sc !== 'latn') { var gl = GF[st].latn; if (gl) { ensureGF(gl[0], gl[1]); fams.push(q(gl[0])); gf.push(gl[0]); } }
    fams.push(SYS[sc]); if (sc !== 'latn') fams.push(SYS.latn);
    fams.push('"Nirmala UI"', 'sans-serif', EMOJI_FONT);
    var weight = st === 'round' ? 800 : st === 'tall' ? 400 : sc === 'arab' ? 700 : 900;
    if (st === 'tall' && !gfLoaded['Anton']) weight = 900;   /* Anton not here (offline): keep the fallback heavy */
    return { fam: fams.join(', '), weight: weight, sc: sc, gf: gf, rtl: isRTL(text) };
  }
  function withTimeout(p, ms) { return Promise.race([p, new Promise(function (res) { setTimeout(function () { res('timeout'); }, ms); })]); }
  function prepFonts(items) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var loads = [];
    items.forEach(function (it) {
      if (!it.text) return;
      var f = it.font;
      loads.push(document.fonts.load(f.weight + ' 40px ' + f.fam, it.text + 'Aa1').catch(function () { return []; }));
      f.gf.forEach(function (fam) {
        loads.push(document.fonts.load((fam === 'Anton' ? 400 : f.weight) + ' 40px ' + q(fam), it.text).then(function (arr) { gfLoaded[fam] = arr && arr.length > 0; }).catch(function () { }));
      });
    });
    return withTimeout(Promise.all(loads), 3500);
  }

  /* ---------------------------------------------------------------- colours */
  function hexRgb(h) { h = String(h || '#000000').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbHex(r, g, b) { return '#' + [r, g, b].map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function shade(h, amt) { var c = hexRgb(h); return rgbHex.apply(null, c.map(function (v) { return amt < 0 ? v * (1 + amt) : v + (255 - v) * amt; })); }
  function rgba(h, a) { var c = hexRgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function lum(rgb) { var a = rgb.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
  function contrast(rgb1, rgb2) { var a = lum(rgb1), b = lum(rgb2); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); }
  function isLight(h) { return lum(hexRgb(h)) > 0.45; }
  function validHex(v) { return /^#[0-9a-fA-F]{6}$/.test(String(v || '')); }

  /* ---------------------------------------------------------------- templates (colours, layout, pattern) */
  var TPL = [
    { id: 'edu_board', icon: '🧮', layout: 'left', font: 'bold', shape: 'round', pattern: 'chalk', align: 'start', hiStyle: 'color', outline: true, shadow: true, plate: false, st: { badge: true, arrow: true }, emoji: '📚',
      col: { bg: '#14532d', bg2: '#052e16', text: '#ffffff', hi: '#fde047', outline: '#052e16', accent: '#fde047', strip: '#fde047', stripText: '#052e16', badge: '#ef4444', badgeText: '#ffffff', arrow: '#fde047', circle: '#ef4444' } },
    { id: 'edu_bright', icon: '💡', layout: 'right', font: 'round', shape: 'circle', pattern: 'lines', align: 'start', hiStyle: 'box', outline: true, shadow: true, plate: false, st: { badge: true, emoji: true }, emoji: '✅',
      col: { bg: '#1d4ed8', bg2: '#0ea5e9', text: '#ffffff', hi: '#fde047', outline: '#1e3a8a', accent: '#fde047', strip: '#ffffff', stripText: '#1e3a8a', badge: '#f97316', badgeText: '#ffffff', arrow: '#fde047', circle: '#f97316' } },
    { id: 'news_red', icon: '📰', layout: 'left', font: 'tall', shape: 'rect', pattern: 'stripes', align: 'start', hiStyle: 'box', outline: true, shadow: true, plate: false, st: { badge: true }, emoji: '😮',
      col: { bg: '#b91c1c', bg2: '#7f1d1d', text: '#ffffff', hi: '#fde047', outline: '#111827', accent: '#fde047', strip: '#111827', stripText: '#ffffff', badge: '#ffffff', badgeText: '#b91c1c', arrow: '#fde047', circle: '#fde047' } },
    { id: 'news_blue', icon: '📊', layout: 'split', font: 'bold', shape: 'rect', pattern: 'grid', align: 'start', hiStyle: 'color', outline: true, shadow: true, plate: false, st: { badge: true }, emoji: '📈',
      col: { bg: '#0f172a', bg2: '#1e3a8a', text: '#ffffff', hi: '#fbbf24', outline: '#020617', accent: '#fbbf24', strip: '#fbbf24', stripText: '#0f172a', badge: '#fbbf24', badgeText: '#0f172a', arrow: '#fbbf24', circle: '#f87171' } },
    { id: 'vlog_sun', icon: '🌅', layout: 'full', font: 'round', shape: 'rect', pattern: 'rays', align: 'start', hiStyle: 'color', outline: true, shadow: true, plate: false, st: { emoji: true, badge: true }, emoji: '🌴',
      col: { bg: '#f97316', bg2: '#db2777', text: '#ffffff', hi: '#fef08a', outline: '#7c2d12', accent: '#fef08a', strip: '#ffffff', stripText: '#9d174d', badge: '#ffffff', badgeText: '#db2777', arrow: '#fef08a', circle: '#ffffff' } },
    { id: 'vlog_clean', icon: '🤍', layout: 'right', font: 'bold', shape: 'round', pattern: 'none', align: 'start', hiStyle: 'color', outline: false, shadow: false, plate: false, st: { arrow: true, circle: true }, emoji: '😮',
      col: { bg: '#ffffff', bg2: '#e2e8f0', text: '#0f172a', hi: '#dc2626', outline: '#ffffff', accent: '#dc2626', strip: '#0f172a', stripText: '#ffffff', badge: '#dc2626', badgeText: '#ffffff', arrow: '#dc2626', circle: '#dc2626' } },
    { id: 'tech_dark', icon: '💻', layout: 'left', font: 'tall', shape: 'rect', pattern: 'grid', align: 'start', hiStyle: 'color', outline: true, shadow: true, plate: false, st: { badge: true, arrow: true }, emoji: '⚡',
      col: { bg: '#0a0a0a', bg2: '#1f2937', text: '#ffffff', hi: '#22d3ee', outline: '#000000', accent: '#22d3ee', strip: '#22d3ee', stripText: '#0a0a0a', badge: '#22d3ee', badgeText: '#0a0a0a', arrow: '#22d3ee', circle: '#a3e635' } },
    { id: 'food', icon: '🍲', layout: 'right', font: 'round', shape: 'circle', pattern: 'dots', align: 'start', hiStyle: 'box', outline: true, shadow: true, plate: false, st: { badge: true, emoji: true }, emoji: '😋',
      col: { bg: '#fff7ed', bg2: '#fdba74', text: '#7c2d12', hi: '#dc2626', outline: '#ffffff', accent: '#dc2626', strip: '#dc2626', stripText: '#ffffff', badge: '#16a34a', badgeText: '#ffffff', arrow: '#dc2626', circle: '#dc2626' } },
    { id: 'motivation', icon: '🏆', layout: 'full', font: 'tall', shape: 'rect', pattern: 'none', align: 'center', hiStyle: 'color', outline: true, shadow: true, plate: false, st: {}, emoji: '🔥',
      col: { bg: '#111111', bg2: '#2a2a2a', text: '#ffffff', hi: '#f59e0b', outline: '#000000', accent: '#f59e0b', strip: '#f59e0b', stripText: '#111111', badge: '#f59e0b', badgeText: '#111111', arrow: '#f59e0b', circle: '#f59e0b' } },
    { id: 'comedy', icon: '😂', layout: 'split', font: 'round', shape: 'rect', pattern: 'dots', align: 'start', hiStyle: 'box', outline: true, shadow: true, plate: false, st: { emoji: true, badge: true }, emoji: '😂',
      col: { bg: '#7e22ce', bg2: '#4c1d95', text: '#ffffff', hi: '#facc15', outline: '#3b0764', accent: '#facc15', strip: '#facc15', stripText: '#3b0764', badge: '#facc15', badgeText: '#3b0764', arrow: '#facc15', circle: '#facc15' } }
  ];
  var TPLS = {}; TPL.forEach(function (tp) { TPLS[tp.id] = tp; });
  var ST_KEYS = ['arrow', 'circle', 'badge', 'emoji'];
  /* default sticker spots per layout (normalised 0..1): badge away from the photo, arrow pointing at it */
  function stickerSpots(layout, vertical) {
    if (!vertical) {
      if (layout === 'left') return { badge: [0.12, 0.15], arrow: [0.56, 0.8, 200], circle: [0.24, 0.45], emoji: [0.4, 0.8] };
      if (layout === 'full') return { badge: [0.86, 0.15], arrow: [0.82, 0.32, 60], circle: [0.66, 0.42], emoji: [0.12, 0.17] };
      if (layout === 'split') return { badge: [0.88, 0.15], arrow: [0.42, 0.8, 0], circle: [0.76, 0.45], emoji: [0.5, 0.82] };
      return { badge: [0.88, 0.15], arrow: [0.44, 0.8, 0], circle: [0.76, 0.45], emoji: [0.6, 0.82] };
    }
    if (layout === 'right') return { badge: [0.84, 0.58], arrow: [0.14, 0.62, 45], circle: [0.5, 0.74], emoji: [0.86, 0.82] };
    if (layout === 'full') return { badge: [0.82, 0.1], arrow: [0.8, 0.3, 60], circle: [0.5, 0.22], emoji: [0.15, 0.12] };
    return { badge: [0.82, 0.08], arrow: [0.84, 0.42, 225], circle: [0.5, 0.25], emoji: [0.15, 0.42] };
  }

  /* ---------------------------------------------------------------- state */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function str(v) { return typeof v === 'string' ? v : null; }
  function num(v, d, lo, hi) { v = +v; return isFinite(v) ? clamp(v, lo, hi) : d; }
  function bool(v) { return typeof v === 'boolean' ? v : null; }
  function freshState() {
    var st = {};
    ST_KEYS.forEach(function (k) { st[k] = { on: null, x: null, y: null, size: 1, rot: null, text: null, ch: null }; });
    return { tpl: 'edu_bright', size: 'yt', textLang: null, headline: null, sub: null, hi: null, hiStyle: null, font: null, layout: null, shape: null,
      textScale: 1, outline: null, shadow: null, plate: null, cols: {}, zoom: 1, ox: 0, oy: 0, st: st, brand: { on: true, channel: null, pos: 'auto' }, guide: false };
  }
  function sanitize(raw) {
    raw = obj(raw);
    var S = freshState();
    if (TPLS[raw.tpl]) S.tpl = raw.tpl;
    if (SIZES[raw.size]) S.size = raw.size;
    if (CODES.indexOf(raw.textLang) >= 0) S.textLang = raw.textLang;
    S.headline = str(raw.headline); S.sub = str(raw.sub);
    S.hi = Array.isArray(raw.hi) ? raw.hi.filter(function (i) { return typeof i === 'number' && i >= 0 && i < 40; }) : null;
    S.hiStyle = raw.hiStyle === 'color' || raw.hiStyle === 'box' ? raw.hiStyle : null;
    S.font = ['bold', 'round', 'tall'].indexOf(raw.font) >= 0 ? raw.font : null;
    S.layout = ['left', 'right', 'full', 'split'].indexOf(raw.layout) >= 0 ? raw.layout : null;
    S.shape = ['rect', 'round', 'circle'].indexOf(raw.shape) >= 0 ? raw.shape : null;
    S.textScale = num(raw.textScale, 1, 0.7, 1.3);
    S.outline = bool(raw.outline); S.shadow = bool(raw.shadow); S.plate = bool(raw.plate);
    var cols = obj(raw.cols); ['bg', 'text', 'hi', 'outline'].forEach(function (k) { if (validHex(cols[k])) S.cols[k] = cols[k].toLowerCase(); });
    S.zoom = num(raw.zoom, 1, 1, 3); S.ox = num(raw.ox, 0, -1, 1); S.oy = num(raw.oy, 0, -1, 1);
    var rs = obj(raw.st);
    ST_KEYS.forEach(function (k) {
      var r = obj(rs[k]), s = S.st[k];
      s.on = bool(r.on); s.x = r.x === null || r.x === undefined ? null : num(r.x, 0.5, 0.02, 0.98); s.y = r.y === null || r.y === undefined ? null : num(r.y, 0.5, 0.02, 0.98);
      s.size = num(r.size, 1, 0.5, 1.8); s.rot = r.rot === null || r.rot === undefined ? null : num(r.rot, 0, 0, 359);
      s.text = str(r.text); s.ch = str(r.ch);
    });
    var b = obj(raw.brand); S.brand.on = b.on === undefined ? true : !!b.on; S.brand.channel = str(b.channel); S.brand.pos = ['auto', 'top', 'bottom'].indexOf(b.pos) >= 0 ? b.pos : 'auto';
    S.guide = !!raw.guide;
    return S;
  }
  var S = sanitize(store.get('state', {}));
  var VARS = (function () { var v = store.get('variants', []); return Array.isArray(v) ? v.filter(function (x) { return x && typeof x === 'object' && typeof x.thumb === 'string'; }).slice(0, MAX_VARIANTS) : []; })();
  var saveT = null;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { store.set('state', S); }, 250); }
  function saveVars() { if (!store.set('variants', VARS)) EDU.toast(t('img_unsaved')); }

  /* images stay on the device: { src: dataURL, w, h } + decoded <img> */
  var imgRec = { photo: store.get('photo', null), logo: store.get('logo', null) };
  var imgEl = { photo: null, logo: null };

  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });
  var canvas = $('#thumb'), mini = $('#mini');
  var full = document.createElement('canvas');   /* guide-free full-size render, used for export, mini and variants */
  var rev = 0, lastLayout = null;

  /* ---------------------------------------------------------------- effective config (template defaults + user overrides) */
  function textLang() { return S.textLang || EDU.lang; }
  function CC(lang) { return C[lang] || C.en; }
  function parseSample(s) {
    var words = String(s || '').split(/\s+/).filter(Boolean), hi = [], inRun = false, out = [];
    words.forEach(function (w, i) {
      var start = w.charAt(0) === '*', end = w.length > 1 && w.charAt(w.length - 1) === '*';
      if (start) inRun = true;
      if (inRun) hi.push(i);
      if (end) inRun = false;
      out.push(w.replace(/^\*+|\*+$/g, ''));
    });
    return { text: out.join(' '), hi: hi };
  }
  function sample(stateObj, lang) { var tp = CC(lang).tpl[stateObj.tpl] || C.en.tpl[stateObj.tpl]; return { name: tp.name, headline: parseSample(tp.headline), sub: tp.sub, badge: tp.badge, channel: CC(lang).channel }; }
  function words(s) { return String(s || '').trim().split(/\s+/).filter(Boolean); }
  function cfgFrom(st, lang) {
    var tp = TPLS[st.tpl] || TPL[0], sm = sample(st, lang), sz = SIZES[st.size] || SIZES.yt, vertical = sz.h > sz.w;
    var headline = st.headline !== null ? st.headline : sm.headline.text;
    var hi = st.headline !== null ? (st.hi || []) : (st.hi !== null ? st.hi : sm.headline.hi);
    var col = {}; for (var k in tp.col) col[k] = tp.col[k];
    ['bg', 'text', 'hi', 'outline'].forEach(function (k) { if (st.cols[k]) col[k] = st.cols[k]; });
    if (st.cols.bg) col.bg2 = shade(st.cols.bg, isLight(st.cols.bg) ? -0.18 : -0.35);
    var layout = st.layout || tp.layout;
    var spots = stickerSpots(layout, vertical), stickers = {};
    ST_KEYS.forEach(function (k) {
      var s = st.st[k], sp = spots[k];
      stickers[k] = { on: s.on !== null ? s.on : !!tp.st[k], x: s.x !== null ? s.x : sp[0], y: s.y !== null ? s.y : sp[1], size: s.size, rot: s.rot !== null ? s.rot : (sp[2] || 0),
        text: s.text !== null ? s.text : sm.badge, ch: s.ch !== null ? s.ch : tp.emoji, custom: s.x !== null };
    });
    return {
      tp: tp, W: sz.w, H: sz.h, vertical: vertical, layout: layout, shape: st.shape || tp.shape, font: st.font || tp.font, align: tp.align,
      headline: headline.trim(), hi: hi, hiStyle: st.hiStyle || tp.hiStyle, sub: (st.sub !== null ? st.sub : sm.sub).trim(),
      outline: st.outline !== null ? st.outline : tp.outline, shadow: st.shadow !== null ? st.shadow : tp.shadow, plate: st.plate !== null ? st.plate : tp.plate,
      textScale: st.textScale, col: col, pattern: tp.pattern, zoom: st.zoom, ox: st.ox, oy: st.oy, stickers: stickers,
      brand: { on: st.brand.on, channel: (st.brand.channel !== null ? st.brand.channel : sm.channel).trim(), pos: st.brand.pos === 'auto' ? (vertical ? 'top' : 'bottom') : st.brand.pos },
      photo: imgEl.photo, logo: imgEl.logo
    };
  }

  /* ---------------------------------------------------------------- text measuring */
  var seg = null;
  try { if (window.Intl && Intl.Segmenter) seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' }); } catch (e) { seg = null; }
  function graphemes(s) { return seg ? Array.from(seg.segment(s), function (x) { return x.segment; }) : Array.from(s); }
  function lineH(text) { return RTL_RE.test(text) ? 1.75 : /[ऀ-෿]/.test(text) ? 1.42 : 1.15; }
  function setFont(ctx, f, px) { ctx.font = f.weight + ' ' + (Math.round(px * 10) / 10) + 'px ' + f.fam; }
  function wrap(ctx, text, maxW) {
    var lines = [], line = '';
    words(text).forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width <= maxW) { line = test; return; }
      if (line) lines.push(line);
      if (ctx.measureText(w).width <= maxW) { line = w; return; }
      var chunk = '';
      graphemes(w).forEach(function (g) { if (chunk && ctx.measureText(chunk + g).width > maxW) { lines.push(chunk); chunk = g; } else chunk += g; });
      line = chunk;
    });
    if (line) lines.push(line);
    return lines;
  }
  function fit(ctx, text, f, o) {
    var lines;
    setFont(ctx, f, o.maxPx); lines = wrap(ctx, text, o.maxW);
    /* prefer a smaller size over breaking a word in the middle (long Tamil/Malayalam words) */
    var nW = words(text).length, whole = function (ls) { return ls.join(' ').split(' ').length === nW; };
    var ok = function (ls, px, nb) { return ls.length <= o.maxLines && (!o.maxH || ls.length * px * o.lh <= o.maxH) && (!nb || whole(ls)); };
    if (ok(lines, o.maxPx, true)) return { px: o.maxPx, lines: lines };
    var best = null, floor = o.minPx;
    /* one very long word (common in Tamil/Malayalam): let the size go lower so the word stays whole */
    setFont(ctx, f, o.minPx);
    var longW = words(text).reduce(function (m, w) { return Math.max(m, ctx.measureText(w).width); }, 0);
    if (longW > o.maxW) floor = Math.max(o.maxPx * 0.22, o.minPx * o.maxW / longW * 0.98);
    [true, false].forEach(function (nb) {
      if (best) return;
      var lo = nb ? floor : o.minPx, hi = o.maxPx;
      for (var i = 0; i < 14 && hi - lo > 0.5; i++) {
        var mid = (lo + hi) / 2;
        setFont(ctx, f, mid); lines = wrap(ctx, text, o.maxW);
        if (ok(lines, mid, nb)) { best = { px: mid, lines: lines }; lo = mid; } else hi = mid;
      }
    });
    if (best) return best;
    setFont(ctx, f, o.minPx);
    lines = wrap(ctx, text, o.maxW);
    if (lines.length > o.maxLines) { lines = lines.slice(0, o.maxLines); lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*\S*$/, '') + '…'; }
    return { px: o.minPx, lines: lines };
  }
  function balanced(ctx, text, f, r, maxW) {
    if (r.lines.length < 2) return r;
    setFont(ctx, f, r.px);
    var longest = words(text).reduce(function (m, w) { return Math.max(m, ctx.measureText(w).width); }, 0);
    var n = r.lines.length, lo = Math.max(maxW * 0.4, longest), hi = maxW, best = r.lines;
    if (lo >= hi) return r;
    for (var i = 0; i < 10; i++) { var mid = (lo + hi) / 2, ls = wrap(ctx, text, mid); if (ls.length <= n) { hi = mid; best = ls; } else lo = mid; }
    return { px: r.px, lines: best };
  }
  /* per-word boxes of each line, so single words can be highlighted and the stroke/fill passes line up */
  function wordRuns(ctx, f, px, lines, allWords, hiSet) {
    setFont(ctx, f, px);
    var idx = 0, out = [];
    lines.forEach(function (ln) {
      var ws = ln.split(' '), x = 0, run = [], total = ctx.measureText(ln).width;
      ws.forEach(function (w, i) {
        var prefix = ws.slice(0, i).join(' ');
        var off = i ? ctx.measureText(prefix + ' ').width : 0;
        var wi = idx + i, hiOn = hiSet[wi] === true && allWords[wi] === w;
        run.push({ text: w, off: off, w: ctx.measureText(w).width, hi: hiOn });
      });
      idx += ws.length;
      out.push({ text: ln, w: total, words: run, rtl: isRTL(ln) });
    });
    return out;
  }

  /* ---------------------------------------------------------------- drawing helpers */
  function rrect(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function lgrad(ctx, x0, y0, x1, y1, cols) { var g = ctx.createLinearGradient(x0, y0, x1, y1); cols.forEach(function (c, i) { g.addColorStop(i / (cols.length - 1), c); }); return g; }
  function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }

  function drawBackground(ctx, W, H, cfg) {
    ctx.fillStyle = lgrad(ctx, 0, 0, W, H, [cfg.col.bg, cfg.col.bg2]); ctx.fillRect(0, 0, W, H);
    var u = Math.min(W, H), p = cfg.pattern, ink = isLight(cfg.col.bg) ? '#000000' : '#ffffff';
    ctx.save();
    if (p === 'chalk' || p === 'grid') {
      ctx.strokeStyle = rgba(p === 'grid' ? cfg.col.accent : ink, p === 'grid' ? 0.16 : 0.1); ctx.lineWidth = Math.max(1, u * 0.0018);
      var step = u * (p === 'grid' ? 0.09 : 0.11);
      ctx.beginPath();
      for (var x = step; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (var y = step; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
      if (p === 'grid') { var rg = ctx.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.8, H * 0.2, u * 0.7); rg.addColorStop(0, rgba(cfg.col.accent, 0.22)); rg.addColorStop(1, rgba(cfg.col.accent, 0)); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); }
    } else if (p === 'lines') {
      ctx.strokeStyle = rgba(ink, 0.16); ctx.lineWidth = Math.max(1, u * 0.002);
      ctx.beginPath(); for (var ly = u * 0.12; ly < H; ly += u * 0.1) { ctx.moveTo(0, ly); ctx.lineTo(W, ly); } ctx.stroke();
      ctx.strokeStyle = rgba(cfg.col.accent, 0.5); ctx.lineWidth = u * 0.006; ctx.beginPath(); ctx.moveTo(W * 0.06, 0); ctx.lineTo(W * 0.06, H); ctx.stroke();
    } else if (p === 'stripes') {
      ctx.fillStyle = rgba(ink, 0.07);
      for (var sx = -H; sx < W + H; sx += u * 0.12) { ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + u * 0.05, 0); ctx.lineTo(sx + u * 0.05 - H, H); ctx.lineTo(sx - H, H); ctx.closePath(); ctx.fill(); }
    } else if (p === 'dots') {
      ctx.fillStyle = rgba(ink, 0.14);
      var d = u * 0.06;
      for (var dy = d / 2; dy < H; dy += d) for (var dx = d / 2 + ((Math.round(dy / d) % 2) ? d / 2 : 0); dx < W; dx += d) { ctx.beginPath(); ctx.arc(dx, dy, u * 0.009, 0, TAU); ctx.fill(); }
    } else if (p === 'rays') {
      ctx.fillStyle = rgba('#ffffff', 0.12);
      var cx = W * 0.85, cy = -H * 0.1, R = Math.max(W, H) * 1.6;
      for (var a = 0; a < TAU; a += TAU / 14) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a, a + TAU / 28); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
  }

  /* geometry per layout: photo box (with its clip path), text box, strip */
  function geom(cfg) {
    var W = cfg.W, H = cfg.H, v = cfg.vertical, u = Math.min(W, H), pad = u * 0.045;
    var sh = cfg.brand.on ? (v ? H * 0.052 : H * 0.095) : 0, top = cfg.brand.pos === 'top' ? sh : 0, bot = cfg.brand.pos === 'bottom' ? sh : 0;
    var g = { pad: pad, strip: sh ? { x: 0, y: cfg.brand.pos === 'top' ? 0 : H - sh, w: W, h: sh } : null, valign: 'middle' };
    var L = cfg.layout;
    if (!v) {
      if (L === 'left') { g.photo = { x: 0, y: 0, w: W * 0.47, h: H }; g.text = { x: W * 0.47 + pad, y: pad + top, w: W * 0.53 - 2 * pad, h: H - 2 * pad - top - bot }; }
      else if (L === 'right') { g.photo = { x: W * 0.53, y: 0, w: W * 0.47, h: H }; g.text = { x: pad, y: pad + top, w: W * 0.53 - 2 * pad, h: H - 2 * pad - top - bot }; }
      else if (L === 'split') { g.photo = { x: W * 0.38, y: 0, w: W * 0.62, h: H, poly: [[W * 0.47, 0], [W, 0], [W, H], [W * 0.38, H]] }; g.text = { x: pad, y: pad + top, w: W * 0.4 - pad, h: H - 2 * pad - top - bot }; }
      else { g.photo = { x: 0, y: 0, w: W, h: H, full: true }; g.text = { x: pad * 1.2, y: H * 0.3 + top, w: W - pad * 2.4, h: H * 0.7 - pad - top - bot }; g.valign = 'bottom'; }
    } else {
      var safe = H * 0.12;   /* Shorts UI covers the bottom */
      if (L === 'right') { g.photo = { x: 0, y: H * 0.5, w: W, h: H * 0.5 }; g.text = { x: pad, y: pad + top, w: W - 2 * pad, h: H * 0.5 - 2 * pad - top }; }
      else if (L === 'full') { g.photo = { x: 0, y: 0, w: W, h: H, full: true }; g.text = { x: pad, y: H * 0.38 + top, w: W - 2 * pad, h: H * 0.62 - top - Math.max(bot, safe) - pad }; g.valign = 'bottom'; }
      else if (L === 'split') { g.photo = { x: 0, y: 0, w: W, h: H * 0.58, poly: [[0, 0], [W, 0], [W, H * 0.58], [0, H * 0.5]] }; g.text = { x: pad, y: H * 0.58 + pad, w: W - 2 * pad, h: H * 0.42 - 2 * pad - Math.max(bot, safe) }; }
      else { g.photo = { x: 0, y: top, w: W, h: H * 0.5 - top }; g.text = { x: pad, y: H * 0.5 + pad, w: W - 2 * pad, h: H * 0.5 - 2 * pad - Math.max(bot, safe) }; }
    }
    return g;
  }
  function photoPath(ctx, b, cfg, inset) {
    var u = Math.min(cfg.W, cfg.H);
    ctx.beginPath();
    if (b.poly) { b.poly.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); return { x: b.x, y: b.y, w: b.w, h: b.h }; }
    if (b.full || cfg.shape === 'rect') { ctx.rect(b.x, b.y, b.w, b.h); return { x: b.x, y: b.y, w: b.w, h: b.h }; }
    var m = u * 0.04 + (inset || 0), x = b.x + m, y = b.y + m, w = b.w - 2 * m, h = b.h - 2 * m;
    if (cfg.shape === 'circle') { var d = Math.min(w, h) * 0.98, cx = b.x + b.w / 2, cy = b.y + b.h / 2; ctx.arc(cx, cy, d / 2, 0, TAU); return { x: cx - d / 2, y: cy - d / 2, w: d, h: d }; }
    rrect(ctx, x, y, w, h, u * 0.07); return { x: x, y: y, w: w, h: h };
  }
  function drawPhoto(ctx, cfg, g, L) {
    var b = g.photo, u = Math.min(cfg.W, cfg.H), img = cfg.photo;
    var framed = !b.full && !b.poly && cfg.shape !== 'rect';
    if (framed) { /* coloured frame + shadow behind the shaped photo */
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = u * 0.04; ctx.shadowOffsetY = u * 0.012;
      photoPath(ctx, b, cfg, -u * 0.012); ctx.fillStyle = cfg.col.accent; ctx.fill(); ctx.restore();
    }
    ctx.save();
    var r = photoPath(ctx, b, cfg, 0); ctx.clip();
    if (img) {
      var iw = img.naturalWidth || 1, ih = img.naturalHeight || 1, sc = Math.max(r.w / iw, r.h / ih) * cfg.zoom, dw = iw * sc, dh = ih * sc, slackX = dw - r.w, slackY = dh - r.h;
      ctx.fillStyle = '#222'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.drawImage(img, r.x - slackX * (cfg.ox + 1) / 2, r.y - slackY * (cfg.oy + 1) / 2, dw, dh);
      L.photo = { x: r.x, y: r.y, w: r.w, h: r.h, slackX: slackX, slackY: slackY }; L.photoScale = sc;
    } else { /* drawn placeholder: soft gradient + person silhouette + "your photo here" */
      var cx = r.x + r.w / 2, cy = r.y + r.h / 2, R = Math.min(r.w, r.h);
      ctx.fillStyle = lgrad(ctx, r.x, r.y, r.x + r.w, r.y + r.h, [shade(cfg.col.accent, -0.55), shade(cfg.col.bg2, -0.2)]); ctx.fillRect(r.x, r.y, r.w, r.h);
      var rg = ctx.createRadialGradient(cx, cy - R * 0.05, 0, cx, cy, R * 0.75); rg.addColorStop(0, rgba(cfg.col.accent, 0.5)); rg.addColorStop(1, rgba(cfg.col.accent, 0)); ctx.fillStyle = rg; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(255,255,255,.28)';
      var hr = R * 0.17, hy = cy - R * 0.1;
      ctx.beginPath(); ctx.arc(cx, hy, hr, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - R * 0.42, r.y + r.h + 2); ctx.quadraticCurveTo(cx - R * 0.42, hy + hr * 1.35, cx, hy + hr * 1.3); ctx.quadraticCurveTo(cx + R * 0.42, hy + hr * 1.35, cx + R * 0.42, r.y + r.h + 2); ctx.closePath(); ctx.fill();
      var ph = t('ph_photo'), pf = fontFor('bold', ph);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var f0 = fit(ctx, ph, pf, { maxW: r.w * 0.8, maxLines: 2, maxPx: R * 0.085, minPx: R * 0.04, lh: lineH(ph) });
      f0.lines.forEach(function (ln, i) { ctx.direction = isRTL(ln) ? 'rtl' : 'ltr'; ctx.fillText(ln, cx, r.y + r.h * 0.84 + i * f0.px * lineH(ph)); });
      ctx.direction = 'ltr';
      L.photo = null; L.photoScale = 0;
    }
    if (b.full) { /* scrim so the text reads over any photo */
      var dir = g.valign === 'bottom';
      ctx.fillStyle = lgrad(ctx, 0, dir ? cfg.H * 0.2 : 0, 0, dir ? cfg.H : cfg.H * 0.8, dir ? ['rgba(0,0,0,0)', 'rgba(0,0,0,.45)', 'rgba(0,0,0,.85)'] : ['rgba(0,0,0,.85)', 'rgba(0,0,0,.45)', 'rgba(0,0,0,0)']);
      ctx.fillRect(0, 0, cfg.W, cfg.H);
    }
    ctx.restore();
    if (b.poly) { /* accent stripe along the slanted edge */
      ctx.save(); ctx.fillStyle = cfg.col.accent; ctx.beginPath();
      var p0 = b.poly[0], p3 = b.poly[3], th = u * 0.018;
      if (cfg.vertical) { ctx.moveTo(p0[0], b.poly[2][1]); ctx.lineTo(b.poly[2][0], b.poly[2][1]); ctx.lineTo(b.poly[2][0], b.poly[2][1] + th); ctx.lineTo(p0[0], p3[1] + th); ctx.lineTo(p0[0], p3[1]); }
      else { ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p0[0] + th, p0[1]); ctx.lineTo(p3[0] + th, p3[1]); ctx.lineTo(p3[0], p3[1]); }
      ctx.closePath(); ctx.fill(); ctx.restore();
    } else if (!framed && !b.full) {
      ctx.save(); ctx.fillStyle = cfg.col.accent;
      if (cfg.vertical) ctx.fillRect(b.x, cfg.layout === 'right' ? b.y : b.y + b.h - u * 0.012, b.w, u * 0.012);
      else ctx.fillRect(cfg.layout === 'left' ? b.x + b.w - u * 0.012 : b.x, b.y, u * 0.012, b.h);
      ctx.restore();
    }
    L.hits.push({ id: 'photo', x: r.x, y: r.y, w: r.w, h: r.h });
  }

  function sampleAvg(ctx, x, y, w, h) {
    try {
      var d = ctx.getImageData(Math.max(0, Math.floor(x)), Math.max(0, Math.floor(y)), Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h))).data, r = 0, g = 0, b = 0, n = 0;
      for (var i = 0; i < d.length; i += 4 * 23) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      return n ? [r / n, g / n, b / n] : null;
    } catch (e) { return null; }
  }
  function drawText(ctx, cfg, g, L) {
    var box = g.text, W = cfg.W, H = cfg.H, u = Math.min(W, H * 1.25), hiSet = {};
    cfg.hi.forEach(function (i) { hiSet[i] = true; });
    var hf = fontFor(cfg.font, cfg.headline), sf = fontFor(cfg.font, cfg.sub), allWords = words(cfg.headline);
    var lh = lineH(cfg.headline), maxLines = cfg.vertical ? 4 : (allWords.length > 6 ? 4 : 3);
    var maxPx = u * (cfg.vertical ? 0.15 : 0.165) * cfg.textScale, minPx = maxPx * 0.38;
    var subPx = 0, subLines = [], subLh = lineH(cfg.sub), gap = 0;
    var budget = box.h;
    if (cfg.sub) { subPx = clamp(maxPx * 0.34, u * 0.03, u * 0.07); budget -= subPx * subLh * 1 + maxPx * 0.12; }
    var r = fit(ctx, cfg.headline, hf, { maxW: box.w, maxLines: maxLines, maxPx: maxPx, minPx: minPx, lh: lh, maxH: Math.max(budget, minPx * lh) });
    r = balanced(ctx, cfg.headline, hf, r, box.w);
    var runs = wordRuns(ctx, hf, r.px, r.lines, allWords, hiSet);
    var headH = r.lines.length * r.px * lh;
    if (cfg.sub) {
      subPx = clamp(r.px * 0.36, u * 0.03, u * 0.07); gap = r.px * 0.14;
      setFont(ctx, sf, subPx); subLines = wrap(ctx, cfg.sub, box.w).slice(0, 2);
    }
    var subH = subLines.length * subPx * subLh, totalH = headH + (subLines.length ? gap + subH : 0);
    var y0 = g.valign === 'bottom' ? box.y + box.h - totalH : box.y + (box.h - totalH) / 2;
    y0 = Math.max(box.y, y0);
    var rtl = hf.rtl, align = cfg.align;
    function lineStart(w) { /* x of the line's start edge */
      if (align === 'center') return rtl ? box.x + (box.w + w) / 2 : box.x + (box.w - w) / 2;
      return rtl ? box.x + box.w : box.x;
    }
    var widest = runs.reduce(function (m, ln) { return Math.max(m, ln.w); }, 0);
    var blockX = align === 'center' ? box.x + (box.w - widest) / 2 : rtl ? box.x + box.w - widest : box.x;
    L.text = { x: blockX, y: y0, w: widest, h: totalH };
    /* readability: text colour vs what is behind it (plate / outline count as the background) */
    var bgAvg = sampleAvg(ctx, blockX, y0, Math.max(widest, 10), Math.max(headH, 10));
    var cTxt = hexRgb(cfg.col.text), ratio = bgAvg ? contrast(cTxt, bgAvg) : 1;
    if (cfg.plate) ratio = Math.max(ratio, contrast(cTxt, hexRgb(cfg.col.outline)));
    if (cfg.outline) ratio = Math.max(ratio, contrast(cTxt, hexRgb(cfg.col.outline)));
    L.contrast = ratio;
    if (!cfg.headline) return;

    var sw = r.px * 0.13, pad = r.px * 0.16;
    if (cfg.plate) {
      ctx.save(); ctx.fillStyle = rgba(cfg.col.outline, 0.8);
      rrect(ctx, blockX - pad * 1.4, y0 - pad * 0.8, widest + pad * 2.8, totalH + pad * 1.6, r.px * 0.18); ctx.fill(); ctx.restore();
    }
    ctx.textBaseline = 'middle';
    var boxed = cfg.hiStyle === 'box', hiInk = isLight(cfg.col.hi) ? '#111111' : '#ffffff';
    /* pass 0: highlight boxes */
    runs.forEach(function (ln, li) {
      var ly = y0 + (li + 0.5) * r.px * lh, xs = lineStart(ln.w);
      ln.words.forEach(function (wd) {
        if (!wd.hi || !boxed) return;
        var x = rtl ? xs - wd.off - wd.w : xs + wd.off;
        ctx.save(); ctx.fillStyle = cfg.col.hi;
        if (cfg.shadow) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = r.px * 0.12; ctx.shadowOffsetY = r.px * 0.04; }
        ctx.translate(x + wd.w / 2, ly); ctx.rotate(-0.025);
        rrect(ctx, -wd.w / 2 - pad * 0.7, -r.px * 0.56, wd.w + pad * 1.4, r.px * 1.12, r.px * 0.14); ctx.fill(); ctx.restore();
      });
    });
    setFont(ctx, hf, r.px);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.miterLimit = 2;
    /* pass 1: strokes (with the shadow), pass 2: fills */
    [0, 1].forEach(function (pass) {
      runs.forEach(function (ln, li) {
        var ly = y0 + (li + 0.5) * r.px * lh, xs = lineStart(ln.w);
        ln.words.forEach(function (wd) {
          var x = rtl ? xs - wd.off : xs + wd.off;
          var wRtl = isRTL(wd.text) || (rtl && !/[A-Za-z0-9]/.test(wd.text));
          ctx.direction = wRtl ? 'rtl' : 'ltr';
          ctx.textAlign = rtl ? 'right' : 'left';
          var inBox = boxed && wd.hi;
          if (pass === 0) {
            if (inBox) return;
            ctx.save();
            if (cfg.shadow) { ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = r.px * 0.14; ctx.shadowOffsetY = r.px * 0.05; }
            if (cfg.outline) { ctx.strokeStyle = cfg.col.outline; ctx.lineWidth = sw; ctx.strokeText(wd.text, x, ly); }
            else if (cfg.shadow) { ctx.fillStyle = cfg.col.text; ctx.fillText(wd.text, x, ly); }
            ctx.restore();
          } else {
            ctx.fillStyle = inBox ? hiInk : wd.hi ? cfg.col.hi : cfg.col.text;
            ctx.fillText(wd.text, x, ly);
          }
        });
      });
    });
    if (subLines.length) {
      setFont(ctx, sf, subPx);
      var sy = y0 + headH + gap, srtl = sf.rtl;
      subLines.forEach(function (ln, i) {
        var w = ctx.measureText(ln).width, x = align === 'center' ? box.x + box.w / 2 : srtl ? box.x + box.w : box.x;
        if (align === 'center') x = srtl ? x + w / 2 : x - w / 2;
        var ly = sy + (i + 0.5) * subPx * subLh;
        ctx.direction = srtl ? 'rtl' : 'ltr'; ctx.textAlign = srtl ? 'right' : 'left';
        ctx.save();
        if (cfg.outline) { ctx.strokeStyle = cfg.col.outline; ctx.lineWidth = subPx * 0.16; ctx.strokeText(ln, x, ly); }
        if (cfg.shadow) { ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = subPx * 0.15; ctx.shadowOffsetY = subPx * 0.05; }
        ctx.fillStyle = cfg.col.text; ctx.globalAlpha = 0.95; ctx.fillText(ln, x, ly); ctx.restore();
      });
    }
    ctx.direction = 'ltr'; ctx.textAlign = 'left';
    L.hits.push({ id: 'text', x: blockX, y: y0, w: widest, h: totalH });
  }

  /* ---------------------------------------------------------------- stickers (all drawn, no artwork files) */
  function drawStickers(ctx, cfg, L) {
    var W = cfg.W, H = cfg.H, u = Math.min(W, H);
    ST_KEYS.forEach(function (k) {
      var s = cfg.stickers[k];
      if (!s.on) return;
      var cx = s.x * W, cy = s.y * H, size = s.size, hit;
      ctx.save();
      if (k === 'arrow') {
        var len = u * 0.3 * size, th = len * 0.13;
        ctx.translate(cx, cy); ctx.rotate(s.rot * PI / 180);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        var path = function () { ctx.beginPath(); ctx.moveTo(-len / 2, len * 0.16); ctx.quadraticCurveTo(0, -len * 0.3, len * 0.42, -len * 0.02); };
        var head = function (extra) { ctx.beginPath(); ctx.moveTo(len / 2 + extra, 0); ctx.lineTo(len * 0.2 - extra * 0.6, -len * 0.22 - extra); ctx.lineTo(len * 0.26 - extra * 0.3, len * 0.2 + extra); ctx.closePath(); };
        ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = th; ctx.shadowOffsetY = th * 0.4;
        ctx.strokeStyle = cfg.col.outline; ctx.lineWidth = th * 1.9; path(); ctx.stroke(); noShadow(ctx);
        ctx.fillStyle = cfg.col.outline; head(th * 0.45); ctx.fill();
        ctx.strokeStyle = cfg.col.arrow; ctx.lineWidth = th; path(); ctx.stroke();
        ctx.fillStyle = cfg.col.arrow; head(0); ctx.fill();
        hit = { x: cx - len * 0.55, y: cy - len * 0.35, w: len * 1.1, h: len * 0.7 };
      } else if (k === 'circle') {
        var rx = u * 0.2 * size, ry = u * 0.15 * size, lw = u * 0.018 * size;
        ctx.translate(cx, cy); ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = lw; ctx.shadowOffsetY = lw * 0.3;
        ctx.strokeStyle = cfg.col.circle; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, -0.08, 0.3, TAU + 0.1); ctx.stroke();
        ctx.lineWidth = lw * 0.7; ctx.beginPath(); ctx.ellipse(rx * 0.04, ry * 0.06, rx * 0.96, ry * 1.04, 0.1, 0.9, TAU + 0.6); ctx.stroke();
        hit = { x: cx - rx - lw, y: cy - ry - lw, w: 2 * (rx + lw), h: 2 * (ry + lw) };
      } else if (k === 'badge') {
        var R = u * 0.13 * size, txt = String(s.text || '').trim();
        ctx.translate(cx, cy); ctx.rotate(-0.14);
        ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = R * 0.25; ctx.shadowOffsetY = R * 0.08;
        ctx.fillStyle = cfg.col.badge; ctx.beginPath();
        for (var i = 0; i < 28; i++) { var a = i * TAU / 28, rr = i % 2 ? R * 0.84 : R; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.closePath(); ctx.fill(); noShadow(ctx);
        ctx.strokeStyle = rgba(cfg.col.badgeText, 0.55); ctx.lineWidth = R * 0.03; ctx.beginPath(); ctx.arc(0, 0, R * 0.74, 0, TAU); ctx.stroke();
        if (txt) {
          var bf = fontFor('bold', txt), fr = fit(ctx, txt, bf, { maxW: R * 1.3, maxLines: 2, maxPx: R * 0.5, minPx: R * 0.18, lh: lineH(txt) });
          var blh = fr.px * lineH(txt), by = -(fr.lines.length * blh) / 2;
          setFont(ctx, bf, fr.px); ctx.fillStyle = cfg.col.badgeText; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          fr.lines.forEach(function (ln, j) { ctx.direction = isRTL(ln) ? 'rtl' : 'ltr'; ctx.fillText(ln, 0, by + (j + 0.5) * blh); });
          ctx.direction = 'ltr';
        }
        hit = { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R };
      } else {
        var es = u * 0.22 * size, ch = String(s.ch || '😮').trim() || '😮';
        ctx.translate(cx, cy);
        ctx.font = es + 'px ' + EMOJI_FONT + ', sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = es * 0.12; ctx.shadowOffsetY = es * 0.05;
        ctx.fillStyle = '#000'; ctx.fillText(ch, 0, es * 0.06);
        hit = { x: cx - es * 0.6, y: cy - es * 0.6, w: es * 1.2, h: es * 1.2 };
      }
      ctx.restore();
      hit.id = 'st:' + k; L.hits.push(hit);
    });
  }

  function drawStrip(ctx, cfg, g, L) {
    var s = g.strip; if (!s) return;
    var u = Math.min(cfg.W, cfg.H), name = cfg.brand.channel, logo = cfg.logo, full = g.photo.full;
    ctx.save();
    ctx.fillStyle = full ? rgba(cfg.col.strip, 0.92) : cfg.col.strip; ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = rgba(isLight(cfg.col.strip) ? '#000000' : '#ffffff', 0.18); ctx.fillRect(s.x, cfg.brand.pos === 'top' ? s.y + s.h - u * 0.004 : s.y, s.w, u * 0.004);
    var rtl = isRTL(name), pad = s.h * 0.35, x = rtl ? s.x + s.w - pad : s.x + pad, cy = s.y + s.h / 2, d = s.h * 0.74;
    if (logo) {
      var lx = rtl ? x - d : x;
      ctx.save(); ctx.beginPath(); ctx.arc(lx + d / 2, cy, d / 2, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
      var iw = logo.naturalWidth || 1, ih = logo.naturalHeight || 1, sc = Math.max(d / iw, d / ih);
      ctx.drawImage(logo, lx + d / 2 - iw * sc / 2, cy - ih * sc / 2, iw * sc, ih * sc); ctx.restore();
      x = rtl ? lx - s.h * 0.22 : lx + d + s.h * 0.22;
    }
    if (name) {
      var nf = fontFor('bold', name), maxW = rtl ? x - s.x - pad : s.x + s.w - pad - x;
      var fr = fit(ctx, name, nf, { maxW: maxW, maxLines: 1, maxPx: s.h * 0.46, minPx: s.h * 0.22, lh: 1 });
      setFont(ctx, nf, fr.px); ctx.fillStyle = cfg.col.stripText; ctx.textBaseline = 'middle';
      ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(fr.lines[0] || '', x, cy + (nf.sc === 'arab' ? -s.h * 0.08 : 0));
      ctx.direction = 'ltr';
    }
    ctx.restore();
    L.hits.push({ id: 'strip', x: s.x, y: s.y, w: s.w, h: s.h });
  }
  /* preview only: where YouTube draws its own UI over the picture */
  function drawGuides(ctx, cfg) {
    var W = cfg.W, H = cfg.H;
    ctx.save(); ctx.setLineDash([W * 0.01, W * 0.006]); ctx.lineWidth = Math.max(2, W * 0.002); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.fillStyle = 'rgba(0,0,0,.5)';
    if (!cfg.vertical) { var bw = W * 0.1, bh = H * 0.085; rrect(ctx, W - bw - W * 0.015, H - bh - H * 0.03, bw, bh, bh * 0.2); ctx.fill(); ctx.stroke(); }
    else {
      ctx.fillRect(0, H * 0.8, W, H * 0.2); ctx.beginPath(); ctx.moveTo(0, H * 0.8); ctx.lineTo(W, H * 0.8); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(W * 0.92, H * (0.5 + i * 0.085), W * 0.045, 0, TAU); ctx.fill(); }
      ctx.fillRect(W * 0.05, H * 0.85, W * 0.55, H * 0.02); ctx.fillRect(W * 0.05, H * 0.89, W * 0.35, H * 0.016);
    }
    ctx.restore();
  }
  function drawAll(ctx, cfg) {
    var L = { hits: [], photo: null, photoScale: 0, text: null, contrast: 0 }, g = geom(cfg);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
    if (!g.photo.full) drawBackground(ctx, cfg.W, cfg.H, cfg);
    else if (!cfg.photo) drawBackground(ctx, cfg.W, cfg.H, cfg);
    drawPhoto(ctx, cfg, g, L);
    drawText(ctx, cfg, g, L);
    drawStickers(ctx, cfg, L);
    drawStrip(ctx, cfg, g, L);
    ctx.restore();
    return L;
  }

  /* ---------------------------------------------------------------- render loop */
  var rendering = false, pending = false, rTimer = null;
  function scheduleRender(ms) { clearTimeout(rTimer); rTimer = setTimeout(requestRender, ms || 0); }
  function requestRender() {
    if (rendering) { pending = true; return; }
    rendering = true;
    var done = function () { rendering = false; if (pending) { pending = false; requestRender(); } };
    renderPreview().then(done, function (e) { console.error(e); done(); });
  }
  function fontItems(cfg) {
    var items = [{ text: cfg.headline, font: fontFor(cfg.font, cfg.headline) }, { text: cfg.sub, font: fontFor(cfg.font, cfg.sub) }, { text: cfg.brand.channel, font: fontFor('bold', cfg.brand.channel) }];
    if (cfg.stickers.badge.on) items.push({ text: cfg.stickers.badge.text, font: fontFor('bold', cfg.stickers.badge.text) });
    if (!cfg.photo) items.push({ text: t('ph_photo'), font: fontFor('bold', t('ph_photo')) });
    return items;
  }
  function renderCanvas(cv, cfg) {
    if (cv.width !== cfg.W) cv.width = cfg.W;
    if (cv.height !== cfg.H) cv.height = cfg.H;
    return drawAll(cv.getContext('2d'), cfg);
  }
  function renderPreview() {
    var cfg = cfgFrom(S, textLang());
    return prepFonts(fontItems(cfg)).then(function () {
      cfg = cfgFrom(S, textLang());
      lastLayout = renderCanvas(full, cfg);
      if (canvas.width !== cfg.W) canvas.width = cfg.W;
      if (canvas.height !== cfg.H) canvas.height = cfg.H;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, cfg.W, cfg.H); ctx.drawImage(full, 0, 0);
      if (S.guide) drawGuides(ctx, cfg);
      var mw = 160, mh = Math.round(160 * cfg.H / cfg.W);
      if (mini.width !== mw) mini.width = mw; if (mini.height !== mh) mini.height = mh;
      var mc = mini.getContext('2d'); mc.clearRect(0, 0, mw, mh); mc.imageSmoothingQuality = 'high'; mc.drawImage(full, 0, 0, mw, mh);
      canvas.dataset.w = cfg.W; canvas.dataset.h = cfg.H; canvas.dataset.tpl = S.tpl; canvas.dataset.rev = String(++rev);
      canvas.dataset.contrast = (Math.round(lastLayout.contrast * 10) / 10).toFixed(1);
      updateChecks(cfg); updatePhotoWarn();
    });
  }
  function updateChecks(cfg) {
    var c = $('#contrast'), r = Math.round(lastLayout.contrast * 10) / 10, rs = EDU.fmt(r, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (!cfg.headline) { c.textContent = ''; c.removeAttribute('data-level'); }
    else { var lvl = r >= 4.5 ? 'good' : r >= 3 ? 'ok' : 'low'; c.dataset.level = lvl; c.textContent = t('contrast_' + lvl, { r: rs }); }
    var n = words(cfg.headline).length, wh = $('#wordsHint');
    if (!n) { wh.textContent = ''; wh.removeAttribute('data-level'); }
    else { wh.dataset.level = n > 6 ? 'many' : 'ok'; wh.textContent = t(n > 6 ? 'words_many' : 'words_ok', { n: EDU.fmt(n) }); }
  }
  function updatePhotoWarn() {
    var w = $('#photoWarn'), rec = imgRec.photo, L = lastLayout || {};
    if (rec && imgEl.photo && L.photoScale > 1.6) { w.textContent = t('low_res', { w: EDU.fmt(rec.w), h: EDU.fmt(rec.h) }); w.hidden = false; } else w.hidden = true;
  }

  /* ---------------------------------------------------------------- export (under 2 MB) */
  function toBlob(cv, type, qv) { return new Promise(function (res, rej) { try { cv.toBlob(function (b) { if (b) res(b); else rej(new Error('toBlob failed')); }, type, qv); } catch (e) { rej(e); } }); }
  function fmtBytes(n) { return n >= 1048576 ? EDU.fmt(n / 1048576, { maximumFractionDigits: 2 }) + ' MB' : EDU.fmt(Math.max(1, Math.round(n / 1024))) + ' KB'; }
  function fileName(cfg, ext) {
    var base = String(cfg.headline || '').normalize('NFC').replace(/[︀-️⃣]|\uD83C[\uDFFB-\uDFFF]/g, '').replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 36) || 'thumbnail';
    return 'thumbnail-' + base + '-' + cfg.W + 'x' + cfg.H + '.' + ext;
  }
  /* PNG if it fits, otherwise JPG at falling quality until it is under YouTube's 2 MB */
  function encodeUnderLimit(cv, wantJpg) {
    var qs = [0.92, 0.86, 0.8, 0.72, 0.64, 0.55, 0.45];
    function jpg(i) { return toBlob(cv, 'image/jpeg', qs[i]).then(function (b) { return b.size <= MAX_BYTES || i === qs.length - 1 ? { blob: b, ext: 'jpg', fell: !wantJpg } : jpg(i + 1); }); }
    if (wantJpg) return jpg(0);
    return toBlob(cv, 'image/png').then(function (b) { if (b.size <= MAX_BYTES) return { blob: b, ext: 'png' }; return jpg(0).then(function (r) { r.pngSize = b.size; return r; }); });
  }
  var working = false;
  function busy(on) { working = !!on; $('#busy').hidden = !on; }
  var LRI = String.fromCharCode(0x2066), PDI = String.fromCharCode(0x2069);
  function iso(s) { return LRI + s + PDI; }
  function say(msg) { $('#status').textContent = msg; EDU.toast(msg); }
  function exportOne(wantJpg) {
    if (working) return Promise.resolve();
    busy(true);
    var cfg = cfgFrom(S, textLang());
    return prepFonts(fontItems(cfg)).then(function () {
      var cv = document.createElement('canvas'); renderCanvas(cv, cfgFrom(S, textLang()));
      return encodeUnderLimit(cv, wantJpg);
    }).then(function (r) {
      var name = fileName(cfg, r.ext);
      EDU.download(name, r.blob);
      canvas.dataset.lastBytes = String(r.blob.size); canvas.dataset.lastType = r.ext;
      if (r.blob.size > MAX_BYTES) say(t('too_big'));
      else if (r.fell) say(t('saved_jpg_fallback', { png: fmtBytes(r.pngSize), size: fmtBytes(r.blob.size) }));
      else say(t('saved_file', { name: iso(name), size: fmtBytes(r.blob.size) }));
      busy(false);
    }).catch(function (e) { busy(false); console.error(e); });
  }

  /* ---------------------------------------------------------------- images */
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
  function hasAlpha(g, w, h) { try { var px = g.getImageData(0, 0, w, h).data; for (var i = 3; i < px.length; i += 4 * 29) if (px[i] < 250) return true; } catch (e) { } return false; }
  function pickImage(kind) {
    EDU.pickFile('image/*').then(function (file) {
      if (!file) return;
      if (file.type && !/^image\//.test(file.type)) { EDU.toast(t('img_bad')); return; }
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var iw = im.naturalWidth || 600, ih = im.naturalHeight || 600, max = kind === 'logo' ? 500 : 1600;
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
  function removeImage(kind) { imgRec[kind] = null; imgEl[kind] = null; store.remove(kind); syncImages(); scheduleRender(); }
  function syncImages() {
    ['photo', 'logo'].forEach(function (kind) {
      var th = $('#' + kind + 'Thumb'); th.textContent = '';
      if (imgRec[kind]) th.appendChild(el('img', { src: imgRec[kind].src, alt: '' }));
      else th.appendChild(el('span', { 'aria-hidden': 'true', text: kind === 'logo' ? '🏷️' : '🖼️' }));
      $('#' + kind + 'Remove').hidden = !imgRec[kind];
    });
    $('#zoomField').hidden = !imgRec.photo;
    $('#photoAddTxt').setAttribute('data-i18n', imgRec.photo ? 'photo_replace' : 'photo_add');
    $('#photoAddTxt').textContent = t(imgRec.photo ? 'photo_replace' : 'photo_add');
  }

  /* ---------------------------------------------------------------- UI: templates, segs, text */
  function pressed(sel, attr, val) { Array.prototype.forEach.call(document.querySelectorAll(sel), function (b) { b.setAttribute('aria-pressed', String(b.dataset[attr] === String(val))); }); }
  function renderTplList() {
    var box = $('#tplList'); box.textContent = '';
    TPL.forEach(function (tp) {
      var nm = (CC(EDU.lang).tpl[tp.id] || C.en.tpl[tp.id]).name;
      box.appendChild(el('button', { type: 'button', class: 'tpl', 'aria-pressed': String(S.tpl === tp.id), dataset: { tpl: tp.id }, onclick: function () { selectTpl(tp.id); } },
        el('span', { class: 'tpl-sw', 'aria-hidden': 'true', style: { '--b1': tp.col.bg, '--b2': tp.col.bg2, '--tx': tp.col.text, '--hi': tp.col.hi } }, el('span', { class: 'tpl-ph' })),
        el('span', { class: 'tpl-name' }, el('span', { 'aria-hidden': 'true', text: tp.icon + ' ' }), nm)));
    });
  }
  function selectTpl(id) {
    if (!TPLS[id]) return;
    S.tpl = id;
    /* a new template brings its own look: text stays if the user typed it, everything else follows the template */
    S.layout = null; S.shape = null; S.font = null; S.hiStyle = null; S.outline = null; S.shadow = null; S.plate = null; S.cols = {};
    if (S.headline === null) S.hi = null;
    ST_KEYS.forEach(function (k) { var s = S.st[k]; s.on = null; s.x = null; s.y = null; s.rot = null; if (k === 'badge' && S.headline === null) s.text = null; if (k === 'emoji') s.ch = null; });
    save(); pressed('.tpl', 'tpl', id); syncAll(); scheduleRender();
  }
  function renderLayoutLabels() {
    var v = SIZES[S.size].h > SIZES[S.size].w;
    $('#layoutSeg [data-layout="left"]').setAttribute('data-i18n', v ? 'lay_top' : 'lay_left');
    $('#layoutSeg [data-layout="right"]').setAttribute('data-i18n', v ? 'lay_bottom' : 'lay_right');
    EDU.apply($('#layoutSeg'));
  }
  function renderHiChips() {
    var cfg = cfgFrom(S, textLang()), box = $('#hiChips'), ws = words(cfg.headline), set = {};
    cfg.hi.forEach(function (i) { set[i] = true; });
    box.textContent = '';
    box.appendChild(el('button', { type: 'button', class: 'chip', 'aria-pressed': String(!cfg.hi.length), 'data-i18n': 'hi_none', text: t('hi_none'), onclick: function () { S.hi = []; if (S.headline === null) { S.headline = cfg.headline; } save(); renderHiChips(); syncTextReset(); scheduleRender(); } }));
    ws.forEach(function (w, i) {
      box.appendChild(el('button', { type: 'button', class: 'chip', lang: textLang(), dir: 'auto', 'aria-pressed': String(!!set[i]), dataset: { i: i }, text: w, onclick: function () {
        var cur = cfg.hi.slice(), at = cur.indexOf(i);
        if (at >= 0) cur.splice(at, 1); else cur.push(i);
        if (S.headline === null) S.headline = cfg.headline;   /* pin the sample text so the choice sticks */
        S.hi = cur.sort(function (a, b) { return a - b; }); save(); renderHiChips(); syncTextReset(); scheduleRender();
      } }));
    });
  }
  function syncText() {
    var cfg = cfgFrom(S, textLang());
    $('#headline').value = cfg.headline; $('#sub').value = cfg.sub;
    ['headline', 'sub'].forEach(function (id) { $('#' + id).setAttribute('lang', textLang()); $('#' + id).dir = isRTL($('#' + id).value) ? 'rtl' : 'auto'; });
    renderHiChips(); syncTextReset();
    pressed('#hiStyleSeg button', 'hi', cfg.hiStyle); pressed('#fontSeg button', 'font', cfg.font);
    $('#textSize').value = S.textScale; $('#textSizeOut').value = Math.round(S.textScale * 100) + '%';
    $('#outline').checked = cfg.outline; $('#shadow').checked = cfg.shadow; $('#plate').checked = cfg.plate;
  }
  function syncTextReset() { $('#textReset').hidden = S.headline === null && S.sub === null && S.hi === null; }
  function onHeadline() {
    var v = $('#headline').value, cfg = cfgFrom(S, textLang()), n = words(v).length;
    S.headline = v;
    S.hi = (cfg.hi || []).filter(function (i) { return i < n; });
    $('#headline').dir = isRTL(v) ? 'rtl' : 'auto';
    save(); renderHiChips(); syncTextReset(); scheduleRender(40);
  }
  function renderTextLangSel() {
    var sel = $('#textLang');
    if (!sel.options.length) EDU.LANGS.forEach(function (l) { sel.appendChild(el('option', { value: l.code, text: l.native })); });
    sel.value = textLang();
  }
  function syncPhoto() {
    var cfg = cfgFrom(S, textLang());
    pressed('#sizeSeg button', 'size', S.size); pressed('#layoutSeg button', 'layout', cfg.layout); pressed('#shapeSeg button', 'shape', cfg.shape);
    $('#shapeField').hidden = cfg.layout === 'full' || cfg.layout === 'split';
    $('#photoZoom').value = S.zoom; $('#guide').checked = S.guide;
    renderLayoutLabels();
  }
  function syncBrand() {
    var cfg = cfgFrom(S, textLang());
    $('#brandOn').checked = cfg.brand.on; $('#channel').value = cfg.brand.channel; $('#channel').dir = isRTL(cfg.brand.channel) ? 'rtl' : 'auto';
    pressed('#brandPosSeg button', 'pos', S.brand.pos);
  }
  function syncColours() {
    var cfg = cfgFrom(S, textLang());
    $('#colBg').value = cfg.col.bg; $('#colText').value = cfg.col.text; $('#colHi').value = cfg.col.hi; $('#colOutline').value = cfg.col.outline;
  }

  /* ---------------------------------------------------------------- UI: stickers */
  function posKey(s) {
    if (!s.custom) { for (var k in POS) if (Math.abs(POS[k][0] - s.x) < 0.001 && Math.abs(POS[k][1] - s.y) < 0.001) return k; return 'custom'; }
    for (var k2 in POS) if (Math.abs(POS[k2][0] - s.x) < 0.001 && Math.abs(POS[k2][1] - s.y) < 0.001) return k2;
    return 'custom';
  }
  function buildStickers() {
    var box = $('#stickers'); box.textContent = '';
    ST_KEYS.forEach(function (k) {
      var body = el('div', { class: 'stack st-body' });
      var sizeIn = el('input', { type: 'range', id: 'st_' + k + '_size', min: '0.5', max: '1.8', step: '0.05' });
      var sizeOut = el('output', { for: 'st_' + k + '_size' });
      var posSel = el('select', { id: 'st_' + k + '_pos' });
      Object.keys(POS).forEach(function (p) { posSel.appendChild(el('option', { value: p, i18n: 'pos_' + p })); });
      posSel.appendChild(el('option', { value: 'custom', i18n: 'pos_custom', disabled: true }));
      body.appendChild(el('div', { class: 'grid-2' },
        el('label', { class: 'field' }, el('span', { i18n: 'st_size' }), el('div', { class: 'range-row' }, sizeIn, sizeOut)),
        el('label', { class: 'field' }, el('span', { i18n: 'st_pos' }), posSel)));
      if (k === 'arrow') {
        var rotIn = el('input', { type: 'range', id: 'st_arrow_rot', min: '0', max: '359', step: '1' }), rotOut = el('output', { for: 'st_arrow_rot' });
        body.appendChild(el('label', { class: 'field' }, el('span', { i18n: 'st_rot' }), el('div', { class: 'range-row' }, rotIn, rotOut)));
        rotIn.addEventListener('input', function () { S.st.arrow.rot = +this.value; rotOut.value = this.value + '°'; save(); scheduleRender(0); });
      }
      if (k === 'badge') {
        var bt = el('input', { type: 'text', id: 'badgeText', maxlength: '20', class: 'no-i18n', dir: 'auto', autocomplete: 'off' });
        body.appendChild(el('label', { class: 'field' }, el('span', { i18n: 'badge_text' }), bt));
        bt.addEventListener('input', function () { S.st.badge.text = this.value; save(); scheduleRender(40); });
      }
      if (k === 'emoji') {
        var chips = el('div', { class: 'row emoji-chips no-i18n', id: 'emojiChips', role: 'group' });
        var custom = el('input', { type: 'text', id: 'emojiCustom', maxlength: '4', class: 'no-i18n', autocomplete: 'off' });
        body.appendChild(el('div', { class: 'field' }, el('span', { i18n: 'emoji_pick' }), chips));
        body.appendChild(el('label', { class: 'field' }, el('span', { i18n: 'emoji_custom' }), custom));
        custom.addEventListener('input', function () { var v = graphemes(this.value.trim())[0] || ''; if (v) { S.st.emoji.ch = v; save(); renderEmojiChips(); scheduleRender(40); } });
      }
      var on = el('input', { type: 'checkbox', id: 'st_' + k + '_on' });
      var det = el('details', { class: 'sticker', id: 'st_' + k },
        el('summary', {}, el('label', { class: 'check' }, on, el('span', { i18n: 'st_' + k })), el('span', { class: 'st-arrow', 'aria-hidden': 'true', text: '▾' })), body);
      on.addEventListener('click', function (e) { e.stopPropagation(); });
      on.addEventListener('change', function () { S.st[k].on = this.checked; if (this.checked) det.open = true; save(); scheduleRender(); });
      sizeIn.addEventListener('input', function () { S.st[k].size = +this.value; sizeOut.value = Math.round(this.value * 100) + '%'; save(); scheduleRender(0); });
      posSel.addEventListener('change', function () { var p = POS[this.value]; if (!p) return; S.st[k].x = p[0]; S.st[k].y = p[1]; save(); scheduleRender(); });
      box.appendChild(det);
    });
  }
  function renderEmojiChips() {
    var box = $('#emojiChips'), cur = cfgFrom(S, textLang()).stickers.emoji.ch; box.textContent = '';
    var list = EMOJIS.slice(); if (list.indexOf(cur) < 0) list.unshift(cur);
    list.forEach(function (e) { box.appendChild(el('button', { type: 'button', class: 'chip', 'aria-pressed': String(e === cur), 'aria-label': e, text: e, onclick: function () { S.st.emoji.ch = e; save(); renderEmojiChips(); scheduleRender(); } })); });
  }
  function syncStickers() {
    var cfg = cfgFrom(S, textLang());
    ST_KEYS.forEach(function (k) {
      var s = cfg.stickers[k];
      $('#st_' + k + '_on').checked = s.on;
      $('#st_' + k + '_size').value = s.size; $('#st_' + k + '_size').nextSibling.value = Math.round(s.size * 100) + '%';
      $('#st_' + k + '_pos').value = posKey(s);
      if (k === 'arrow') { $('#st_arrow_rot').value = s.rot; $('#st_arrow_rot').nextSibling.value = s.rot + '°'; }
      if (k === 'badge') { $('#badgeText').value = s.text; }
    });
    renderEmojiChips();
    $('#emojiCustom').value = '';
  }

  /* ---------------------------------------------------------------- variants (A/B versions) */
  function freeLetter() { var used = VARS.map(function (v) { return v.name; }); for (var i = 0; i < 26; i++) { var L = String.fromCharCode(65 + i); if (used.indexOf(L) < 0) return L; } return '?'; }
  function snapshot() { var s = JSON.parse(JSON.stringify(S)); delete s.guide; return s; }
  function saveVariant() {
    if (working) return;
    if (VARS.length >= MAX_VARIANTS) { EDU.toast(t('variant_max')); return; }
    var cfg = cfgFrom(S, textLang()), tc = document.createElement('canvas'), tw = 320, th = Math.round(320 * cfg.H / cfg.W);
    tc.width = tw; tc.height = th; var g = tc.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(full, 0, 0, tw, th);
    var v = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: freeLetter(), title: cfg.headline.slice(0, 60), lang: textLang(), state: snapshot(), thumb: tc.toDataURL('image/jpeg', 0.72), at: Date.now() };
    VARS.push(v); saveVars(); renderVariants(); say(t('variant_saved', { name: v.name }));
  }
  function useVariant(v) {
    var guide = S.guide;
    S = sanitize(v.state); S.guide = guide; S.textLang = v.lang || S.textLang;
    save(); pressed('.tpl', 'tpl', S.tpl); syncAll(); scheduleRender(); say(t('variant_restored', { name: v.name }));
  }
  function downloadVariant(v) {
    var st = sanitize(v.state), cfg = cfgFrom(st, v.lang || textLang());
    return prepFonts(fontItems(cfg)).then(function () {
      var cv = document.createElement('canvas'); renderCanvas(cv, cfgFrom(st, v.lang || textLang()));
      return encodeUnderLimit(cv, false);
    }).then(function (r) { EDU.download('thumbnail-' + v.name + '-' + cfg.W + 'x' + cfg.H + '.' + r.ext, r.blob); });
  }
  function renderVariants() {
    var box = $('#varList'); box.textContent = '';
    VARS.forEach(function (v) {
      box.appendChild(el('figure', { class: 'variant', dataset: { id: v.id, name: v.name }, lang: v.lang || 'en' },
        el('img', { src: v.thumb, alt: t('variant_aria', { name: v.name, title: v.title }) }),
        el('span', { class: 'var-letter', 'aria-hidden': 'true', text: v.name }),
        el('figcaption', { dir: 'auto', text: v.title || '…' }),
        el('div', { class: 'row' },
          el('button', { type: 'button', class: 'btn btn-sm btn-primary var-use', text: t('variant_use'), onclick: function () { useVariant(v); } }),
          el('button', { type: 'button', class: 'btn btn-sm', text: t('download'), onclick: function () { downloadVariant(v); } }),
          el('button', { type: 'button', class: 'btn btn-sm btn-danger var-del', 'aria-label': t('delete') + ' ' + v.name, text: t('delete'), onclick: function () { VARS = VARS.filter(function (x) { return x.id !== v.id; }); saveVars(); renderVariants(); } }))));
    });
    $('#varNone').hidden = !!VARS.length; $('#varActs').hidden = VARS.length < 2;
  }

  /* ---------------------------------------------------------------- canvas interaction: drag photo / stickers, keyboard */
  var drag = null;
  function canvasPoint(e) { var r = canvas.getBoundingClientRect(), sz = SIZES[S.size]; return { x: (e.clientX - r.left) / r.width * sz.w, y: (e.clientY - r.top) / r.height * sz.h }; }
  function inRect(p, b) { return b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }
  function hitAt(p) {
    if (!lastLayout) return null;
    for (var i = lastLayout.hits.length - 1; i >= 0; i--) { var h = lastLayout.hits[i]; if (h.id.indexOf('st:') === 0 && inRect(p, h)) return h; }
    if (lastLayout.photo && inRect(p, lastLayout.photo)) return { id: 'photo' };
    for (var j = lastLayout.hits.length - 1; j >= 0; j--) if (inRect(p, lastLayout.hits[j])) return lastLayout.hits[j];
    return null;
  }
  canvas.addEventListener('pointerdown', function (e) {
    var p = canvasPoint(e), h = hitAt(p);
    if (!h || (h.id !== 'photo' && h.id.indexOf('st:') !== 0)) return;
    var st = h.id.indexOf('st:') === 0 ? h.id.slice(3) : null, cfg = cfgFrom(S, textLang());
    drag = { x: p.x, y: p.y, st: st, sx: st ? cfg.stickers[st].x : 0, sy: st ? cfg.stickers[st].y : 0, ox: S.ox, oy: S.oy, moved: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
  });
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    var h = hitAt(canvasPoint(e.touches[0]));
    if (h && (h.id === 'photo' || h.id.indexOf('st:') === 0)) e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var p = canvasPoint(e), sz = SIZES[S.size];
    if (Math.abs(p.x - drag.x) + Math.abs(p.y - drag.y) > 3) drag.moved = true;
    if (drag.st) { S.st[drag.st].x = clamp(drag.sx + (p.x - drag.x) / sz.w, 0.02, 0.98); S.st[drag.st].y = clamp(drag.sy + (p.y - drag.y) / sz.h, 0.02, 0.98); }
    else if (lastLayout && lastLayout.photo) {
      var ph = lastLayout.photo;
      if (ph.slackX > 1) S.ox = clamp(drag.ox - 2 * (p.x - drag.x) / ph.slackX, -1, 1);
      if (ph.slackY > 1) S.oy = clamp(drag.oy - 2 * (p.y - drag.y) / ph.slackY, -1, 1);
    }
    scheduleRender(0);
  });
  function endDrag() {
    if (!drag) return;
    if (drag.moved) { save(); if (drag.st) $('#st_' + drag.st + '_pos').value = 'custom'; }
    canvas.style.cursor = '';
    setTimeout(function () { drag = null; }, 0);
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  var FOCUS = { text: 'headline', strip: 'channel', photo: 'photoAdd' };
  canvas.addEventListener('click', function (e) {
    if (drag && drag.moved) return;
    var h = hitAt(canvasPoint(e)); if (!h) return;
    var id = h.id.indexOf('st:') === 0 ? 'st_' + h.id.slice(3) + '_size' : FOCUS[h.id];
    var f = id && $('#' + id); if (!f) return;
    if (h.id.indexOf('st:') === 0) $('#st_' + h.id.slice(3)).open = true;
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
  Array.prototype.forEach.call(document.querySelectorAll('#sizeSeg button'), function (b) { b.addEventListener('click', function () { S.size = b.dataset.size; save(); syncPhoto(); syncBrand(); syncStickers(); scheduleRender(); }); });
  $('#guide').addEventListener('change', function () { S.guide = this.checked; save(); scheduleRender(); });
  $('#dlPng').addEventListener('click', function () { exportOne(false); });
  $('#dlJpg').addEventListener('click', function () { exportOne(true); });
  $('#varSave').addEventListener('click', saveVariant);
  $('#varDlAll').addEventListener('click', function () { VARS.reduce(function (p, v) { return p.then(function () { return downloadVariant(v); }).then(function () { return new Promise(function (r) { setTimeout(r, 450); }); }); }, Promise.resolve()); });
  $('#headline').addEventListener('input', onHeadline);
  $('#sub').addEventListener('input', function () { S.sub = this.value; this.dir = isRTL(this.value) ? 'rtl' : 'auto'; save(); syncTextReset(); scheduleRender(40); });
  $('#textLang').addEventListener('change', function () { S.textLang = this.value; save(); syncText(); syncBrand(); syncStickers(); scheduleRender(); });
  Array.prototype.forEach.call(document.querySelectorAll('#hiStyleSeg button'), function (b) { b.addEventListener('click', function () { S.hiStyle = b.dataset.hi; save(); pressed('#hiStyleSeg button', 'hi', S.hiStyle); scheduleRender(); }); });
  Array.prototype.forEach.call(document.querySelectorAll('#fontSeg button'), function (b) { b.addEventListener('click', function () { S.font = b.dataset.font; save(); pressed('#fontSeg button', 'font', S.font); scheduleRender(); }); });
  $('#textSize').addEventListener('input', function () { S.textScale = clamp(+this.value || 1, 0.7, 1.3); $('#textSizeOut').value = Math.round(S.textScale * 100) + '%'; save(); scheduleRender(0); });
  ['outline', 'shadow', 'plate'].forEach(function (k) { $('#' + k).addEventListener('change', function () { S[k] = this.checked; save(); scheduleRender(); }); });
  $('#textReset').addEventListener('click', function () { S.headline = null; S.sub = null; S.hi = null; S.st.badge.text = null; save(); syncText(); syncStickers(); scheduleRender(); });
  $('#photoAdd').addEventListener('click', function () { pickImage('photo'); });
  $('#photoRemove').addEventListener('click', function () { removeImage('photo'); });
  $('#logoAdd').addEventListener('click', function () { pickImage('logo'); });
  $('#logoRemove').addEventListener('click', function () { removeImage('logo'); });
  $('#photoZoom').addEventListener('input', function () { S.zoom = clamp(+this.value || 1, 1, 3); save(); scheduleRender(0); });
  Array.prototype.forEach.call(document.querySelectorAll('#layoutSeg button'), function (b) { b.addEventListener('click', function () { S.layout = b.dataset.layout; ST_KEYS.forEach(function (k) { S.st[k].x = null; S.st[k].y = null; S.st[k].rot = null; }); save(); syncPhoto(); syncStickers(); scheduleRender(); }); });
  Array.prototype.forEach.call(document.querySelectorAll('#shapeSeg button'), function (b) { b.addEventListener('click', function () { S.shape = b.dataset.shape; save(); syncPhoto(); scheduleRender(); }); });
  $('#brandOn').addEventListener('change', function () { S.brand.on = this.checked; save(); scheduleRender(); });
  $('#channel').addEventListener('input', function () { S.brand.channel = this.value; this.dir = isRTL(this.value) ? 'rtl' : 'auto'; save(); scheduleRender(40); });
  Array.prototype.forEach.call(document.querySelectorAll('#brandPosSeg button'), function (b) { b.addEventListener('click', function () { S.brand.pos = b.dataset.pos; save(); syncBrand(); scheduleRender(); }); });
  [['colBg', 'bg'], ['colText', 'text'], ['colHi', 'hi'], ['colOutline', 'outline']].forEach(function (p) {
    $('#' + p[0]).addEventListener('input', function () { if (validHex(this.value)) { S.cols[p[1]] = this.value.toLowerCase(); save(); scheduleRender(30); } });
  });
  $('#colReset').addEventListener('click', function () { S.cols = {}; save(); syncColours(); scheduleRender(); });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['state', 'photo', 'logo', 'variants'].forEach(function (k) { store.remove(k); });
    location.reload();
  });
  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    if (String(e.key || '').toLowerCase() === 's') { e.preventDefault(); exportOne(false); }
  });
  if (document.fonts && document.fonts.addEventListener) {
    var fT = null;
    document.fonts.addEventListener('loadingdone', function () { clearTimeout(fT); fT = setTimeout(function () { scheduleRender(); }, 80); });
  }
  window.addEventListener('online', function () { gfLinked = {}; scheduleRender(); });

  function syncAll() { renderTextLangSel(); syncText(); syncPhoto(); syncStickers(); syncBrand(); syncColours(); syncImages(); renderVariants(); }
  buildStickers();
  renderTplList();
  syncAll();
  EDU.onLang(function () { renderTplList(); syncAll(); scheduleRender(); });
  EDU.onTheme(function () { scheduleRender(); });
  Promise.all([decode('photo'), decode('logo')]).then(function () { syncImages(); requestRender(); });
})();
