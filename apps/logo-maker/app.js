/* Logo Maker: name + tagline + a built-in icon (icons.js) in 4 layouts, colour themes, offline system fonts.
   One SVG is the single source: the previews show it, the SVG download is it (text kept as text), and the PNGs are
   that SVG drawn on a canvas at 512 / 1024 px, so all of them look the same. Text is measured on a canvas with the
   same fonts to lay the logo out. Nothing leaves the device. */
(function () {
  'use strict';
  var SLUG = 'logo-maker';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var ICONS = window.LOGO_ICONS, ICON_IDS = window.LOGO_ICON_IDS;
  var LAYOUTS = ['side', 'top', 'badge', 'mono'], SHAPES = ['none', 'circle', 'square', 'hex'];
  /* [main, inside the shape, name, tagline]; name colours are mid-tones that read on light AND dark backgrounds
     (except "black ink", which is meant for light paper and gets a hint) */
  var THEMES = {
    saffron: ['#f97316', '#ffffff', '#c2410c', '#ea580c'], leaf: ['#16a34a', '#ffffff', '#15803d', '#16a34a'],
    ocean: ['#0284c7', '#ffffff', '#0369a1', '#0284c7'], royal: ['#7c3aed', '#ffffff', '#7c3aed', '#8b5cf6'],
    rose: ['#e11d48', '#ffffff', '#be123c', '#e11d48'], gold: ['#ca8a04', '#ffffff', '#a16207', '#ca8a04'],
    teal: ['#0d9488', '#ffffff', '#0f766e', '#0d9488'], ink: ['#111827', '#ffffff', '#111827', '#4b5563'],
    sky: ['#38bdf8', '#0c4a6e', '#0284c7', '#0ea5e9'], mango: ['#facc15', '#422006', '#a16207', '#ca8a04']
  };
  var THEME_IDS = Object.keys(THEMES);
  var FONTS = {
    sans: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', 'Nirmala UI', sans-serif",
    serif: "Georgia, Cambria, 'Times New Roman', 'Noto Serif', 'Nirmala UI', serif",
    round: "'Arial Rounded MT Bold', 'Varela Round', Nunito, Quicksand, ui-rounded, 'Segoe UI', 'Nirmala UI', sans-serif",
    heavy: "Impact, Haettenschweiler, 'Arial Black', 'Franklin Gothic Heavy', 'Nirmala UI', sans-serif",
    mono: "'Courier New', Courier, ui-monospace, 'Nirmala UI', monospace",
    hand: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', 'Chalkboard SE', 'Nirmala UI', cursive"
  };
  var FONT_IDS = Object.keys(FONTS);
  var DARK = '#1b1f27';
  var DEF = { name: null, tag: null, initials: '', icon: 'cup', layout: 'side', shape: 'circle', theme: 'saffron', col: THEMES.saffron.slice(),
    font: 'sans', bold: true, upper: false, bg: 'none', bgc: '#fff7e6', pic: 'fit' };

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------------------------------------------------------- settings */
  function hex(v, d) { return /^#[0-9a-f]{6}$/i.test(v) ? String(v).toLowerCase() : d; }
  function one(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function cleanSet(o) {
    o = o && typeof o === 'object' ? o : {};
    var col = Array.isArray(o.col) && o.col.length === 4 ? o.col.map(function (c, i) { return hex(c, DEF.col[i]); }) : DEF.col.slice();
    return {
      name: typeof o.name === 'string' ? o.name.slice(0, 40) : null, tag: typeof o.tag === 'string' ? o.tag.slice(0, 60) : null,
      initials: typeof o.initials === 'string' ? o.initials.slice(0, 6) : '', icon: one(o.icon, ICON_IDS, DEF.icon),
      layout: one(o.layout, LAYOUTS, DEF.layout), shape: one(o.shape, SHAPES, DEF.shape),
      theme: o.theme === 'custom' || THEMES[o.theme] ? o.theme : DEF.theme, col: col,
      font: one(o.font, FONT_IDS, DEF.font), bold: o.bold === undefined ? true : !!o.bold, upper: !!o.upper,
      bg: one(o.bg, ['none', 'white', 'colour'], DEF.bg), bgc: hex(o.bgc, DEF.bgc), pic: o.pic === 'square' ? 'square' : 'fit'
    };
  }
  var S = cleanSet(store.get('set', null));
  function save() { store.set('set', S); }
  function nameText() { return S.name === null ? t('sample_name') : S.name; }
  function tagText() { return S.tag === null ? t('sample_tag') : S.tag; }
  function shown(s) { s = String(s || '').replace(/\s+/g, ' ').trim(); return S.upper ? s.toLocaleUpperCase() : s; }

  /* ---------------------------------------------------------------- text helpers */
  var MC = document.createElement('canvas').getContext('2d');
  MC.textBaseline = 'middle';
  var HAS_IMPACT = (function () {
    MC.font = '40px monospace'; var a = MC.measureText('mmmmmmmmmlliWWQ').width;
    MC.font = '40px Impact, monospace'; return Math.abs(MC.measureText('mmmmmmmmmlliWWQ').width - a) > 0.5;
  })();
  function weight(bold) { return S.font === 'heavy' ? (HAS_IMPACT ? 400 : 900) : bold ? 700 : 400; }
  function meas(s, size, wt) {
    MC.font = wt + ' ' + size + 'px ' + FONTS[S.font];
    var m = MC.measureText(s), asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    if (!isFinite(asc) || !isFinite(desc)) { asc = size * 0.55; desc = size * 0.45; }
    return { w: m.width, asc: Math.max(asc, size * 0.3), desc: Math.max(desc, size * 0.15) };
  }
  function isRtl(s) { var m = /[A-Za-zÀ-ɏ֐-ࣿऀ-෿]/.exec(s || ''); return !!m && /[֐-ࣿ]/.test(m[0]); }
  function chars(s) { return Array.from ? Array.from(s) : String(s).split(''); }
  function clip(s, size, wt, maxW) {
    if (meas(s, size, wt).w <= maxW) return s;
    var c = chars(s);
    while (c.length > 1 && meas(c.join('') + '…', size, wt).w > maxW) c.pop();
    return c.join('').trim() + '…';
  }
  function split2(text, size, wt) {
    var words = text.split(' '), best = null;
    if (words.length < 2) return [text];
    for (var k = 1; k < words.length; k++) {
      var a = words.slice(0, k).join(' '), b = words.slice(k).join(' '), m = Math.max(meas(a, size, wt).w, meas(b, size, wt).w);
      if (!best || m < best.m) best = { m: m, l: [a, b] };
    }
    return best.l;
  }
  /* fit text in maxW: one line, or two balanced lines when wrap is allowed, shrinking down to minSize, then "…" */
  function fit(text, size, minSize, maxW, wt, wrap) {
    text = String(text || '').replace(/\s+/g, ' ').trim();
    if (!text) return null;
    var s = size, lines = [text];
    for (var g = 0; g < 40; g++) {
      lines = wrap && meas(text, s, wt).w > maxW ? split2(text, s, wt) : [text];
      var wm = Math.max.apply(null, lines.map(function (l) { return meas(l, s, wt).w; }));
      if (wm <= maxW || s <= minSize) break;
      s = Math.max(minSize, s * 0.93);
    }
    lines = lines.map(function (l) { return clip(l, s, wt, maxW); });
    var ms = lines.map(function (l) { return meas(l, s, wt); });
    var asc = Math.max.apply(null, ms.map(function (m) { return m.asc; })), desc = Math.max.apply(null, ms.map(function (m) { return m.desc; }));
    var lh = Math.max(s * 1.16, asc + desc + s * 0.1);
    return { lines: lines, ms: ms, size: s, wt: wt, lh: lh, h: lh * lines.length, w: Math.max.apply(null, ms.map(function (m) { return m.w; })) };
  }
  /* first letter (with its vowel signs, and a joined consonant after a virama) of the first two words */
  var VIRAMA = /[्্੍્୍்్್്]/;
  function firstCluster(w) {
    var c = chars(w), i = 0;
    while (i < c.length && !/[\p{L}\p{N}]/u.test(c[i])) i++;
    if (i >= c.length) return '';
    var s = c[i++];
    while (i < c.length) {
      var ch = c[i];
      if (/\p{M}/u.test(ch)) { s += ch; i++; if (VIRAMA.test(ch) && i < c.length && /\p{L}/u.test(c[i])) s += c[i++]; }
      else if (ch === '‍' || ch === '‌') { s += ch; i++; }
      else break;
    }
    return s;
  }
  function autoInitials(name) {
    return String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(firstCluster).join('').toLocaleUpperCase();
  }
  function initialsText() { var own = String(S.initials || '').replace(/\s+/g, '').trim(); return own ? own.toLocaleUpperCase() : autoInitials(nameText()); }

  /* ---------------------------------------------------------------- the logo as SVG */
  function r1(n) { return Math.round(n * 10) / 10; }
  function build(square) {
    var c = { main: S.col[0], on: S.col[1], name: S.col[2], tag: S.col[3] };
    var parts = [], bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    function grow(x0, y0, x1, y1) { bb.x0 = Math.min(bb.x0, x0); bb.y0 = Math.min(bb.y0, y0); bb.x1 = Math.max(bb.x1, x1); bb.y1 = Math.max(bb.y1, y1); }
    function addLines(F, top, cx, edge, rtl, fill, op) {
      if (!F) return;
      F.lines.forEach(function (l, i) {
        var m = F.ms[i], y = top + F.lh * (i + 0.5), x = edge === null ? cx : rtl ? edge - m.w / 2 : edge + m.w / 2;
        parts.push({ t: 'text', s: l, x: x, y: y, size: F.size, wt: F.wt, fill: fill, op: op || 1 });
        grow(x - m.w / 2, y - m.asc, x + m.w / 2, y + m.desc);
      });
    }
    function addShape(kind, cx, cy, size, fill) { parts.push({ t: 'shape', kind: kind, cx: cx, cy: cy, size: size, fill: fill }); grow(cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2); }
    function addIcon(x, y, size, fill) { if (S.icon === 'none') return; parts.push({ t: 'icon', id: S.icon, x: x, y: y, size: size, fill: fill }); grow(x, y, x + size, y + size); }
    /* an icon, alone or on a shape, in a size x size box with its top-left corner at x, y */
    function iconBox(x, y, size) {
      if (S.shape !== 'none') { addShape(S.shape, x + size / 2, y + size / 2, size, c.main); var k = size * 0.58; addIcon(x + (size - k) / 2, y + (size - k) / 2, k, c.on); }
      else addIcon(x, y, size, c.main);
    }
    var name = shown(nameText()), tag = shown(tagText()), wtN = weight(S.bold), wtT = S.font === 'heavy' ? weight(true) : 400;
    /* a square picture of "icon beside name" would be a thin strip in the middle, so the square one is stacked */
    var hasIcon = S.icon !== 'none', L = square && S.layout === 'side' ? 'top' : S.layout, nameF, tagF, y;
    if (L === 'side') {
      nameF = fit(name, 100, 44, 900, wtN, true); tagF = fit(tag, 44, 24, 900, wtT, false);
      var gapNT = nameF && tagF ? 12 : 0, blockH = (nameF ? nameF.h : 0) + gapNT + (tagF ? tagF.h : 0);
      var blockW = Math.max(nameF ? nameF.w : 0, tagF ? tagF.w : 0), I = hasIcon ? Math.max(160, Math.min(260, (blockH || 160) * 1.15)) : 0;
      var rtl = isRtl(name || tag), gap = I && blockW ? 34 : 0;
      if (I) iconBox(rtl ? blockW + gap : 0, -I / 2, I);
      var edge = rtl ? blockW : I + gap, top = -blockH / 2;
      addLines(nameF, top, 0, edge, rtl, c.name);
      addLines(tagF, top + (nameF ? nameF.h : 0) + gapNT, 0, edge, rtl, c.tag);
    } else if (L === 'top' || L === 'mono') {
      y = 0;
      var ini = L === 'mono' ? initialsText() : '';
      if (ini) {
        var M = 240, n = chars(ini).filter(function (ch) { return !/\p{M}/u.test(ch); }).length, onShape = S.shape !== 'none';
        var base = onShape ? (n <= 1 ? 0.56 : n === 2 ? 0.44 : 0.33) : (n <= 1 ? 0.8 : n === 2 ? 0.62 : 0.46);
        if (onShape) addShape(S.shape, 0, M / 2, M, c.main);
        var iniF = fit(ini, M * base, 16, onShape ? M * 0.72 : M * 1.5, weight(true), false), im = iniF.ms[0];
        var cy = M / 2 + (im.asc - im.desc) / 2;                      /* centre the letters themselves, not the line box */
        parts.push({ t: 'text', s: iniF.lines[0], x: 0, y: cy, size: iniF.size, wt: iniF.wt, fill: onShape ? c.on : c.main, op: 1 });
        grow(-im.w / 2, cy - im.asc, im.w / 2, cy + im.desc);
        if (!onShape) grow(-M / 2, 0, M / 2, M);
        y = M + 30;
      } else if (hasIcon) { var IT = 190; iconBox(-IT / 2, 0, IT); y = IT + 30; }
      var nm = L === 'mono' ? 90 : 100, tg = L === 'mono' ? 40 : 44;
      nameF = fit(name, nm, 40, 1000, wtN, true); tagF = fit(tag, tg, 22, 1000, wtT, false);
      if (nameF) { addLines(nameF, y, 0, null, false, c.name); y += nameF.h + 12; }
      addLines(tagF, y, 0, null, false, c.tag);
    } else {                                                            /* round badge */
      var R = 300, iconS = 0.42 * R, H;
      parts.push({ t: 'shape', kind: 'circle', cx: 0, cy: 0, size: 2 * R, fill: c.main });
      parts.push({ t: 'ring', r: 0.9 * R, w: 0.022 * R, stroke: c.on });
      grow(-R, -R, R, R);
      for (var pass = 0; pass < 3; pass++) {
        var k2 = [1, 0.82, 0.68][pass];
        nameF = fit(name, 0.3 * R * k2, 0.1 * R, 1.48 * R, wtN, true); tagF = fit(tag, 0.12 * R * k2, 0.065 * R, 1.15 * R, wtT, false);
        iconS = 0.42 * R * k2;
        H = (hasIcon ? iconS + 0.05 * R : 0) + (nameF ? nameF.h : 0) + (tagF ? 0.05 * R + tagF.h : 0);
        if (H <= 1.42 * R) break;
      }
      y = -H / 2;
      if (hasIcon) { parts.push({ t: 'icon', id: S.icon, x: -iconS / 2, y: y, size: iconS, fill: c.on }); y += iconS + 0.05 * R; }
      if (nameF) { addLines(nameF, y, 0, null, false, c.on); y += nameF.h + 0.05 * R; }
      addLines(tagF, y, 0, null, false, c.on, 0.88);
    }
    var empty = !parts.length;
    if (empty) grow(0, 0, 100, 100);
    var w = bb.x1 - bb.x0, h = bb.y1 - bb.y0, pad = Math.max(12, Math.max(w, h) * (square ? 0.1 : 0.06));
    var x0 = bb.x0 - pad, y0 = bb.y0 - pad, W = w + 2 * pad, Hh = h + 2 * pad;
    if (square) { var side = Math.max(W, Hh); x0 -= (side - W) / 2; y0 -= (side - Hh) / 2; W = Hh = side; }
    W = Math.ceil(W); Hh = Math.ceil(Hh);
    var bg = S.bg === 'white' ? '#ffffff' : S.bg === 'colour' ? S.bgc : '';
    var fam = FONTS[S.font];
    var out = ['<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + Hh + '" viewBox="' + r1(x0) + ' ' + r1(y0) + ' ' + W + ' ' + Hh + '">'];
    if (bg) out.push('<rect x="' + r1(x0) + '" y="' + r1(y0) + '" width="' + W + '" height="' + Hh + '" fill="' + bg + '"/>');
    parts.forEach(function (p) {
      if (p.t === 'shape') {
        var s = p.size;
        if (p.kind === 'circle') out.push('<circle cx="' + r1(p.cx) + '" cy="' + r1(p.cy) + '" r="' + r1(s / 2) + '" fill="' + p.fill + '"/>');
        else if (p.kind === 'square') out.push('<rect x="' + r1(p.cx - s / 2) + '" y="' + r1(p.cy - s / 2) + '" width="' + r1(s) + '" height="' + r1(s) + '" rx="' + r1(s * 0.22) + '" fill="' + p.fill + '"/>');
        else {
          var pts = [], rr = s / 2 * 1.04;
          for (var k = 0; k < 6; k++) { var a = (-90 + k * 60) * Math.PI / 180; pts.push(r1(p.cx + rr * Math.cos(a)) + ',' + r1(p.cy + rr * Math.sin(a))); }
          out.push('<polygon points="' + pts.join(' ') + '" fill="' + p.fill + '"/>');
        }
      } else if (p.t === 'ring') out.push('<circle cx="0" cy="0" r="' + r1(p.r) + '" fill="none" stroke="' + p.stroke + '" stroke-width="' + r1(p.w) + '"/>');
      else if (p.t === 'icon') out.push('<g transform="translate(' + r1(p.x) + ' ' + r1(p.y) + ') scale(' + (Math.round(p.size / 24 * 1000) / 1000) + ')">' + ICONS[p.id](p.fill) + '</g>');
      else if (p.t === 'text') {
        out.push('<text x="' + r1(p.x) + '" y="' + r1(p.y) + '" font-family="' + fam + '" font-size="' + r1(p.size) + '" font-weight="' + p.wt + '" fill="' + p.fill + '"' +
          (p.op < 1 ? ' fill-opacity="' + p.op + '"' : '') + ' text-anchor="middle" dominant-baseline="central"' + (isRtl(p.s) ? ' direction="rtl"' : '') + '>' + EDU.esc(p.s) + '</text>');
      }
    });
    out.push('</svg>');
    return { svg: out.join(''), w: W, h: Hh, empty: empty };
  }
  function dataUrl(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }

  /* ---------------------------------------------------------------- colours: contrast hints */
  function rgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function lum(h) { return rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (a, v, i) { return a + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function hints() {
    var c = S.col, out = [], name = shown(nameText()) || shown(tagText());
    var inside = S.layout === 'badge' || (S.layout === 'mono' && S.shape !== 'none') || (S.icon !== 'none' && S.shape !== 'none' && S.layout !== 'mono');
    if (inside && contrast(c[0], c[1]) < 2.2) out.push(t('hint_inside'));
    if (S.layout !== 'badge' && name) {
      if (S.bg === 'none') {
        if (contrast(c[2], DARK) < 2.2) out.push(t('hint_dark'));
        if (contrast(c[2], '#ffffff') < 2.2) out.push(t('hint_light'));
      } else if (contrast(c[2], S.bg === 'white' ? '#ffffff' : S.bgc) < 2.2) out.push(t('hint_bg'));
    }
    return out;
  }

  /* ---------------------------------------------------------------- interface */
  var cur = null;
  function render() {
    var fitL = build(S.pic === 'square'), sq = S.pic === 'square' ? fitL : build(true), view = S.pic === 'square' ? build(false) : fitL;
    cur = { file: fitL, square: sq };
    $('#pvLight').src = dataUrl(view.svg); $('#pvDark').src = dataUrl(view.svg);
    $('#pvAv').src = dataUrl(sq.svg); $('#pvAv2').src = dataUrl(sq.svg);
    var hs = hints(), hint = $('#hint');
    hint.hidden = !hs.length; hint.textContent = hs.join(' ');
    $('#emptyMsg').hidden = !fitL.empty;
    ['#png512', '#png1024', '#svgBtn'].forEach(function (id) { $(id).disabled = fitL.empty; });
    var k = 1024 / Math.max(fitL.w, fitL.h);
    $('#picSize').textContent = t('pic_size', { w: Math.round(fitL.w * k), h: Math.round(fitL.h * k) }) + (S.bg === 'none' ? ' ' + t('pic_transparent') : '');
    $('#avatarTip').hidden = !(S.bg === 'none' || S.pic !== 'square');
  }
  var queued = false;
  function soon() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; render(); }); }
  function pressed(sel, attr, val) { $$(sel + ' [data-' + attr + ']').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset[attr] === String(val))); }); }
  function layIcon(id) {
    var s = '<svg viewBox="0 0 48 32" aria-hidden="true" fill="currentColor">';
    if (id === 'side') s += '<circle cx="9" cy="16" r="7"/><rect x="20" y="10" width="24" height="5" rx="2"/><rect x="20" y="18.5" width="16" height="3.5" rx="1.5" opacity=".7"/>';
    else if (id === 'top') s += '<circle cx="24" cy="8" r="6"/><rect x="10" y="17" width="28" height="5" rx="2"/><rect x="15" y="25" width="18" height="3.5" rx="1.5" opacity=".7"/>';
    else if (id === 'badge') s += '<circle cx="24" cy="16" r="15"/><rect x="14" y="13.5" width="20" height="5" rx="2" fill="var(--surface)"/>';
    else s += '<rect x="15" y="1" width="18" height="18" rx="5"/><text x="24" y="14" font-size="9" font-weight="800" text-anchor="middle" fill="var(--surface)" font-family="system-ui, sans-serif">AB</text><rect x="10" y="23" width="28" height="4.5" rx="2"/>';
    return s + '</svg>';
  }
  function renderControls() {
    var lb = $('#layouts'); lb.innerHTML = '';
    LAYOUTS.forEach(function (id) {
      var b = el('button', { type: 'button', class: 'lay-btn', 'aria-pressed': String(S.layout === id), dataset: { layout: id }, html: layIcon(id) });
      b.appendChild(el('span', { text: t('lay_' + id) }));
      lb.appendChild(b);
    });
    var ib = $('#icons'); ib.innerHTML = '';
    ICON_IDS.forEach(function (id) {
      var svg = id === 'none' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 18L18 6" stroke="currentColor" stroke-width="2"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[id]('currentColor') + '</svg>';
      ib.appendChild(el('button', { type: 'button', class: 'ic-btn', 'aria-pressed': String(S.icon === id), 'aria-label': t('ic_' + id), title: t('ic_' + id), dataset: { icon: id }, html: svg }));
    });
    var tb = $('#themes'); tb.innerHTML = '';
    THEME_IDS.forEach(function (id) {
      var c = THEMES[id];
      tb.appendChild(el('button', { type: 'button', class: 'th-btn', 'aria-pressed': String(S.theme === id), 'aria-label': t('th_' + id), title: t('th_' + id), dataset: { theme: id },
        style: { background: 'linear-gradient(135deg, ' + c[0] + ' 0 55%, ' + c[2] + ' 55% 100%)' } }));
    });
    var fb = $('#fonts'); fb.innerHTML = '';
    FONT_IDS.forEach(function (id) {
      var b = el('button', { type: 'button', class: 'font-btn', 'aria-pressed': String(S.font === id), dataset: { font: id } });
      b.appendChild(el('span', { class: 'aa', text: 'Aa', 'aria-hidden': 'true', style: { fontFamily: FONTS[id], fontWeight: id === 'heavy' ? (HAS_IMPACT ? 400 : 900) : 700 } }));
      b.appendChild(el('span', { text: t('font_' + id) }));
      fb.appendChild(b);
    });
    syncControls();
  }
  function syncControls() {
    pressed('#layouts', 'layout', S.layout); pressed('#icons', 'icon', S.icon); pressed('#themes', 'theme', S.theme); pressed('#fonts', 'font', S.font);
    pressed('#shapeSeg', 'shape', S.shape); pressed('#bgSeg', 'bg', S.bg); pressed('#picSeg', 'pic', S.pic);
    $('#shapeWrap').hidden = S.layout === 'badge';
    $('#iniWrap').hidden = S.layout !== 'mono';
    $('#initials').placeholder = autoInitials(nameText()) || '';
    var n = nameText(), tg = tagText();
    if ($('#name').value !== n && document.activeElement !== $('#name')) $('#name').value = n;
    if ($('#tag').value !== tg && document.activeElement !== $('#tag')) $('#tag').value = tg;
    if ($('#initials').value !== S.initials && document.activeElement !== $('#initials')) $('#initials').value = S.initials;
    $('#upper').checked = S.upper; $('#bold').checked = S.bold; $('#bold').disabled = S.font === 'heavy';
    ['#cMain', '#cOn', '#cName', '#cTag'].forEach(function (id, i) { $(id).value = S.col[i]; });
    $('#bgPick').value = S.bgc; $('#bgPick').hidden = S.bg !== 'colour';
    $('#png512Lbl').textContent = t('btn_png', { n: 512 }); $('#png1024Lbl').textContent = t('btn_png', { n: 1024 });
  }
  function change() { save(); syncControls(); soon(); }

  function delegate(sel, attr, fn) {
    $(sel).addEventListener('click', function (e) { var b = e.target.closest('[data-' + attr + ']'); if (!b || b.disabled) return; fn(b.dataset[attr]); change(); });
  }
  delegate('#layouts', 'layout', function (v) { S.layout = v; });
  delegate('#icons', 'icon', function (v) { S.icon = v; });
  delegate('#themes', 'theme', function (v) { S.theme = v; S.col = THEMES[v].slice(); });
  delegate('#fonts', 'font', function (v) { S.font = v; });
  delegate('#shapeSeg', 'shape', function (v) { S.shape = v; });
  delegate('#bgSeg', 'bg', function (v) { S.bg = v; });
  delegate('#picSeg', 'pic', function (v) { S.pic = v; });
  $('#name').addEventListener('input', function () { S.name = this.value.slice(0, 40); save(); $('#initials').placeholder = autoInitials(S.name) || ''; soon(); });
  $('#tag').addEventListener('input', function () { S.tag = this.value.slice(0, 60); save(); soon(); });
  $('#initials').addEventListener('input', function () { S.initials = this.value.slice(0, 6); save(); soon(); });
  $('#upper').addEventListener('change', function () { S.upper = this.checked; change(); });
  $('#bold').addEventListener('change', function () { S.bold = this.checked; change(); });
  ['#cMain', '#cOn', '#cName', '#cTag'].forEach(function (id, i) {
    $(id).addEventListener('input', function () { S.col[i] = hex(this.value, S.col[i]); S.theme = 'custom'; save(); pressed('#themes', 'theme', S.theme); soon(); });
  });
  $('#bgPick').addEventListener('input', function () { S.bgc = hex(this.value, S.bgc); S.bg = 'colour'; save(); pressed('#bgSeg', 'bg', S.bg); soon(); });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    S = cleanSet(null); save(); $('#name').value = ''; $('#tag').value = ''; $('#initials').value = '';
    renderControls(); render();
  });

  /* ---------------------------------------------------------------- downloads */
  function fileBase() {
    var s = String(nameText() || '').normalize('NFKD').replace(/[^\x00-\x7F]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
    return 'logo' + (s ? '-' + s : '');
  }
  function png(n) {
    var L = build(S.pic === 'square'), k = n / Math.max(L.w, L.h), cw = Math.max(1, Math.round(L.w * k)), ch = Math.max(1, Math.round(L.h * k));
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () {
        try {
          var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
          var x = cv.getContext('2d'); x.drawImage(img, 0, 0, cw, ch);
          cv.toBlob(function (b) { if (b) res({ blob: b, w: cw, h: ch }); else rej(new Error('png')); }, 'image/png');
        } catch (e) { rej(e); }
      };
      img.onerror = function () { rej(new Error('svg')); };
      img.src = dataUrl(L.svg);
    });
  }
  function savePng(n) {
    return png(n).then(function (r) { EDU.download(fileBase() + '-' + n + '.png', r.blob); return r; }, function () { EDU.toast(t('msg_png_fail')); return null; });
  }
  $('#png512').addEventListener('click', function () { savePng(512); });
  $('#png1024').addEventListener('click', function () { savePng(1024); });
  $('#svgBtn').addEventListener('click', function () {
    var L = build(S.pic === 'square');
    EDU.download(fileBase() + '.svg', new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + L.svg + '\n'], { type: 'image/svg+xml' }));
  });

  EDU.onLang(function () { renderControls(); render(); });
  renderControls(); render();

  /* for the interaction test */
  window.LOGO = {
    get set() { return S; },
    svg: function (square) { return build(!!square).svg; },
    initials: initialsText, png: png, hints: hints
  };
})();
