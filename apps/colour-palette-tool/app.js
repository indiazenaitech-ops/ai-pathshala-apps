/* Colour Palette Tool: palettes from a base colour, WCAG contrast check, colours from a photo, saved palettes.
   Everything runs on the device. Photos are only drawn on a canvas in this page; nothing is uploaded. */
(function () {
  'use strict';
  var $ = EDU.$, $$ = EDU.$$;
  var store = EDU.store('colour-palette-tool');
  var MAX_SAVED = 30, DEFAULT_BASE = '#FF9933', DEFAULT_FG = '#1B1B1B';

  /* ---------------- colour maths (also used by the test) ---------------- */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function hexToRgb(hex) {
    var m = /^\s*#?([0-9a-f]{3}|[0-9a-f]{6})\s*$/i.exec(String(hex || ''));
    if (!m) return null;
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  function two(n) { var s = clamp(Math.round(n), 0, 255).toString(16).toUpperCase(); return s.length < 2 ? '0' + s : s; }
  function rgbToHex(c) { return '#' + two(c.r) + two(c.g) + two(c.b); }
  /* h in degrees 0–360, s and l in percent 0–100 (not rounded) */
  function rgbToHsl(c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, h = 0, s = 0, l = (max + min) / 2;
    if (d > 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return { h: h, s: s * 100, l: l * 100 };
  }
  function hslToRgb(c) {
    var h = ((c.h % 360) + 360) % 360, s = clamp(c.s, 0, 100) / 100, l = clamp(c.l, 0, 100) / 100;
    var k = (1 - Math.abs(2 * l - 1)) * s, x = k * (1 - Math.abs((h / 60) % 2 - 1)), m = l - k / 2, r = 0, g = 0, b = 0;
    if (h < 60) { r = k; g = x; } else if (h < 120) { r = x; g = k; } else if (h < 180) { g = k; b = x; }
    else if (h < 240) { g = x; b = k; } else if (h < 300) { r = x; b = k; } else { r = k; b = x; }
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
  }
  function hslHex(h, s, l) { return rgbToHex(hslToRgb({ h: h, s: s, l: l })); }
  /* WCAG 2 relative luminance and contrast ratio */
  function luminance(c) {
    function f(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function contrast(hexA, hexB) {
    var a = hexToRgb(hexA), b = hexToRgb(hexB); if (!a || !b) return NaN;
    var la = luminance(a), lb = luminance(b), hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }
  /* shown ratio is cut (not rounded up) to 2 decimals, so 4.499 never shows as a passing 4.5 */
  function ratioText(r) { return (Math.floor(r * 100 + 1e-9) / 100) + ':1'; }
  function parseRgb(s) {
    var m = /^\s*(?:rgb\s*\()?\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*\)?\s*$/i.exec(String(s || ''));
    if (!m) return null;
    var c = { r: +m[1], g: +m[2], b: +m[3] };
    return (c.r > 255 || c.g > 255 || c.b > 255) ? null : c;
  }
  function parseHsl(s) {
    var m = /^\s*(?:hsl\s*\()?\s*(\d{1,3}(?:\.\d+)?)\s*(?:deg|°)?\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)\s*%?\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)\s*%?\s*\)?\s*$/i.exec(String(s || ''));
    if (!m) return null;
    var c = { h: +m[1], s: +m[2], l: +m[3] };
    return (c.h > 360 || c.s > 100 || c.l > 100) ? null : c;
  }
  function normHex(s) { var c = hexToRgb(s); return c ? rgbToHex(c) : null; }
  function rgbText(hex) { var c = hexToRgb(hex); return 'rgb(' + c.r + ', ' + c.g + ', ' + c.b + ')'; }
  function hslText(hex) { var c = rgbToHsl(hexToRgb(hex)); return 'hsl(' + Math.round(c.h) % 360 + ', ' + Math.round(c.s) + '%, ' + Math.round(c.l) + '%)'; }
  function code(hex, fmt) { return fmt === 'rgb' ? rgbText(hex) : fmt === 'hsl' ? hslText(hex) : hex; }

  var KINDS = ['comp', 'ana', 'tri', 'shade', 'tint'];
  function palette(kind, baseHex) {
    var c = rgbToHsl(hexToRgb(baseHex)), h = c.h, s = c.s, l = c.l, out = [];
    if (kind === 'comp') out = [baseHex, hslHex(h + 180, s, l)];
    else if (kind === 'ana') out = [hslHex(h - 30, s, l), baseHex, hslHex(h + 30, s, l)];
    else if (kind === 'tri') out = [baseHex, hslHex(h + 120, s, l), hslHex(h + 240, s, l)];
    else if (kind === 'shade') { out = [baseHex]; [0.8, 0.6, 0.4, 0.2].forEach(function (k) { out.push(hslHex(h, s, l * k)); }); }
    else if (kind === 'tint') { out = [baseHex]; [0.2, 0.4, 0.6, 0.8].forEach(function (k) { out.push(hslHex(h, s, l + (100 - l) * k)); }); }
    return out;
  }
  /* The main colours of a picture: count pixels in a coarse colour grid (16 steps per channel),
     then take the biggest groups that are clearly different from each other. */
  function mainColours(data, want) {
    var map = {}, total = 0, i, key;
    for (i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      key = (data[i] >> 4) << 8 | (data[i + 1] >> 4) << 4 | (data[i + 2] >> 4);
      var b = map[key] || (map[key] = { n: 0, r: 0, g: 0, b: 0 });
      b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2]; total++;
    }
    var list = Object.keys(map).map(function (k) { var b = map[k]; return { n: b.n, r: b.r / b.n, g: b.g / b.n, b: b.b / b.n }; });
    list.sort(function (a, b) { return b.n - a.n; });
    var picked = [];
    [70, 40, 20].forEach(function (minDist) {
      list.forEach(function (c) {
        if (picked.length >= want || picked.indexOf(c) >= 0) return;
        if (picked.length && c.n < total * 0.004) return;          /* ignore specks */
        var far = picked.every(function (p) { return Math.sqrt((p.r - c.r) * (p.r - c.r) + (p.g - c.g) * (p.g - c.g) + (p.b - c.b) * (p.b - c.b)) >= minDist; });
        if (far) picked.push(c);
      });
    });
    return picked.map(rgbToHex);
  }
  function paletteText(name, colors) {
    return [name].concat(colors.map(function (h) { return h + '    ' + rgbText(h) + '    ' + hslText(h); })).join('\r\n') + '\r\n';
  }
  function paletteCard(name, colors) {
    var W = 1000, pad = 40, top = 110, sh = 300, cv = document.createElement('canvas');
    cv.width = W; cv.height = top + sh + 160;
    var g = cv.getContext('2d'), w = (W - pad * 2) / colors.length;
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#1B1B1B'; g.textBaseline = 'middle'; g.textAlign = 'center';
    g.font = '700 40px system-ui, "Noto Sans", "Nirmala UI", sans-serif';
    g.fillText(name, W / 2, 60, W - pad * 2);
    colors.forEach(function (h, i) {
      var x = pad + i * w;
      g.fillStyle = h; g.fillRect(Math.round(x), top, Math.ceil(w), sh);
      g.fillStyle = '#1B1B1B';
      g.font = '700 ' + (colors.length > 3 ? 26 : 32) + 'px ui-monospace, Consolas, monospace';
      g.fillText(h, x + w / 2, top + sh + 40, w - 10);
      g.fillStyle = '#555555';
      g.font = '400 ' + (colors.length > 3 ? 18 : 22) + 'px ui-monospace, Consolas, monospace';
      g.fillText(rgbText(h), x + w / 2, top + sh + 80, w - 10);
      g.fillText(hslText(h), x + w / 2, top + sh + 112, w - 10);
    });
    g.strokeStyle = '#DDDDDD'; g.lineWidth = 2; g.strokeRect(pad, top, W - pad * 2, sh);
    return cv;
  }
  window.CPT = { hexToRgb: hexToRgb, rgbToHex: rgbToHex, rgbToHsl: rgbToHsl, hslToRgb: hslToRgb, contrast: contrast, ratioText: ratioText,
    palette: palette, mainColours: mainColours, paletteText: paletteText, paletteCard: paletteCard, parseRgb: parseRgb, parseHsl: parseHsl };

  /* ---------------- state ---------------- */
  var state = {
    tab: 'pal', base: DEFAULT_BASE, fmt: 'hex', fg: DEFAULT_FG, bg: DEFAULT_BASE, saved: []
  };
  (function load() {
    var s = store.get('state', null);
    if (!s || typeof s !== 'object') return;
    if (['pal', 'con', 'photo', 'saved'].indexOf(s.tab) >= 0) state.tab = s.tab;
    if (['hex', 'rgb', 'hsl'].indexOf(s.fmt) >= 0) state.fmt = s.fmt;
    ['base', 'fg', 'bg'].forEach(function (k) { var h = normHex(s[k]); if (h) state[k] = h; });
    if (Array.isArray(s.saved)) {
      state.saved = s.saved.filter(function (p) { return p && Array.isArray(p.colors) && p.colors.length && p.colors.every(normHex); })
        .slice(0, MAX_SAVED).map(function (p) {
          return { id: String(p.id || Date.now()), kind: KINDS.concat('photo').indexOf(p.kind) >= 0 ? p.kind : 'photo', base: normHex(p.base) || '', colors: p.colors.slice(0, 8).map(normHex) };
        });
    }
  })();
  function save() { store.set('state', state); }
  var photo = { loaded: false, picked: '', main: [] };   /* the photo itself is never stored */

  function palName(p) { return EDU.t('k_' + p.kind) + (p.base ? ' · ' + p.base : ''); }
  function copyCode(text) {
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.top = '-1000px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { }
      ta.remove();
    }
    try {
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(fallback); else fallback();
    } catch (e) { }
    window.CPT.lastCopied = text;
    EDU.toast(EDU.t('copied_code', { code: text }));
  }

  /* one palette: swatches you can tap to copy, and Save / PNG / text buttons */
  function group(p, opts) {
    var name = palName(p);
    var sws = EDU.el('div', { class: 'cp-sws' });
    p.colors.forEach(function (h) {
      var txt = code(h, state.fmt);
      sws.appendChild(EDU.el('button', { type: 'button', class: 'cp-sw no-i18n', 'data-hex': h, 'aria-label': EDU.t('sw_aria', { code: txt }), title: txt, style: { '--c': h },
        onclick: function () { copyCode(txt); } },
        EDU.el('span', { class: 'cp-chip' }), EDU.el('span', { class: 'cp-code', text: txt })));
    });
    var acts = EDU.el('div', { class: 'cp-acts' });
    if (opts.saved) {
      acts.appendChild(EDU.el('button', { type: 'button', class: 'btn btn-sm btn-danger cp-del', text: EDU.t('delete'),
        onclick: function () { state.saved = state.saved.filter(function (x) { return x.id !== p.id; }); save(); renderSaved(); } }));
    } else {
      acts.appendChild(EDU.el('button', { type: 'button', class: 'btn btn-sm btn-primary cp-save', text: EDU.t('b_save'), onclick: function () { savePalette(p); } }));
    }
    acts.appendChild(EDU.el('button', { type: 'button', class: 'btn btn-sm cp-png', text: EDU.t('b_png'),
      onclick: function () { EDU.downloadCanvas(paletteCard(name, p.colors), 'palette-' + p.colors[0].slice(1) + '.png'); } }));
    acts.appendChild(EDU.el('button', { type: 'button', class: 'btn btn-sm cp-txt', text: EDU.t('b_txt'),
      onclick: function () { EDU.download('palette-' + p.colors[0].slice(1) + '.txt', paletteText(name, p.colors), 'text/plain'); } }));
    /* the code sits in its own left-to-right box so "#FF9933" never turns into "FF9933#" in Urdu */
    var h3 = EDU.el('h3', {}, EDU.t('k_' + p.kind), p.base ? [' · ', EDU.el('bdi', { dir: 'ltr', class: 'no-i18n', text: p.base })] : null);
    var g = EDU.el('div', { class: 'card cp-group' }, h3, sws, acts);
    if (opts.id) g.id = opts.id;
    return g;
  }
  function savePalette(p) {
    var same = state.saved.some(function (x) { return x.kind === p.kind && x.colors.join() === p.colors.join(); });
    if (same) return EDU.toast(EDU.t('saved_dup'));
    if (state.saved.length >= MAX_SAVED) return EDU.toast(EDU.t('saved_full', { n: MAX_SAVED }));
    state.saved.unshift({ id: Date.now() + '-' + Math.floor(Math.random() * 1e6), kind: p.kind, base: p.base, colors: p.colors.slice() });
    save(); renderSaved(); EDU.toast(EDU.t('saved_ok'));
  }

  /* ---------------- 1. palettes ---------------- */
  function syncBase(skip) {
    if (skip !== 'pick') $('#base-pick').value = state.base.toLowerCase();
    if (skip !== 'hex') $('#base-hex').value = state.base;
    if (skip !== 'rgb') $('#base-rgb').value = rgbText(state.base);
    if (skip !== 'hsl') $('#base-hsl').value = hslText(state.base);
  }
  function renderPalettes() {
    $$('#fmt-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.fmt === state.fmt ? 'true' : 'false'); });
    var box = $('#palettes'); box.textContent = '';
    KINDS.forEach(function (k) { box.appendChild(group({ kind: k, base: state.base, colors: palette(k, state.base) }, { id: 'g-' + k })); });
  }
  function setBase(hex, skip) {
    state.base = hex; save();
    ['base-hex', 'base-rgb', 'base-hsl'].forEach(function (i) { $('#' + i).classList.remove('bad'); });
    $('#base-err').hidden = true;
    syncBase(skip); renderPalettes();
  }
  /* while typing, a wrong code only gets a red border; the help message shows when you leave the field */
  function baseField(id, name, parse) {
    var el = $('#' + id);
    el.addEventListener('input', function () {
      var hex = parse(el.value);
      if (hex) setBase(hex, name);
      else el.classList.add('bad');
    });
    el.addEventListener('blur', function () { if (el.classList.contains('bad')) $('#base-err').hidden = false; else syncBase(); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') el.blur(); });
  }

  /* ---------------- 2. contrast ---------------- */
  function badge(id, ok) {
    var e = $('#' + id);
    e.className = 'badge ' + (ok ? 'success' : 'danger');
    e.textContent = (ok ? '✓ ' : '✗ ') + EDU.t(ok ? 'pass' : 'fail');
    e.dataset.pass = ok ? '1' : '0';
  }
  function syncContrast(skip) {
    if (skip !== 'fgp') $('#c-fg').value = state.fg.toLowerCase();
    if (skip !== 'bgp') $('#c-bg').value = state.bg.toLowerCase();
    if (skip !== 'fg') $('#c-fg-hex').value = state.fg;
    if (skip !== 'bg') $('#c-bg-hex').value = state.bg;
  }
  function renderContrast() {
    var r = contrast(state.fg, state.bg);
    $('#c-ratio').textContent = ratioText(r);
    badge('c-n-aa', r >= 4.5); badge('c-n-aaa', r >= 7); badge('c-l-aa', r >= 3); badge('c-l-aaa', r >= 4.5);
    var v = $('#c-verdict');
    v.className = 'callout ' + (r >= 4.5 ? 'success' : r >= 3 ? 'warning' : 'danger');
    v.textContent = EDU.t(r >= 4.5 ? 'v_good' : r >= 3 ? 'v_ok' : 'v_bad');
    var s = $('#c-sample'); s.style.background = state.bg; s.style.color = state.fg;
  }
  function setContrast(which, hex, skip) {
    state[which] = hex; save();
    $('#c-' + which + '-hex').classList.remove('bad');
    $('#c-err').hidden = !$$('#pane-con .cp-code-in.bad').length;
    syncContrast(skip); renderContrast();
  }
  function anyCode(v) {
    var c = parseRgb(v), h = parseHsl(v);
    return normHex(v) || (c && rgbToHex(c)) || (h && rgbToHex(hslToRgb(h))) || null;
  }
  function contrastField(which) {
    var el = $('#c-' + which + '-hex');
    el.addEventListener('input', function () {
      var hex = anyCode(el.value);
      if (hex) setContrast(which, hex, which);
      else el.classList.add('bad');
    });
    el.addEventListener('blur', function () { if (el.classList.contains('bad')) $('#c-err').hidden = false; else syncContrast(); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') el.blur(); });
    $('#c-' + which).addEventListener('input', function () { setContrast(which, normHex(this.value), which + 'p'); });
  }

  /* ---------------- 3. photo ---------------- */
  function showPhotoError(on) { $('#ph-err').hidden = !on; }
  function afterDraw() {
    var cv = $('#ph-canvas'), sm = document.createElement('canvas');
    var k = Math.min(1, 96 / Math.max(cv.width, cv.height));
    sm.width = Math.max(1, Math.round(cv.width * k)); sm.height = Math.max(1, Math.round(cv.height * k));
    var g = sm.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(cv, 0, 0, sm.width, sm.height);
    photo.main = mainColours(g.getImageData(0, 0, sm.width, sm.height).data, 5);
    photo.loaded = true; photo.picked = '';
    showPhotoError(false); renderPhoto();
  }
  function loadFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type || '')) { showPhotoError(true); return; }
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var cv = $('#ph-canvas'), k = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
      if (!img.naturalWidth || !img.naturalHeight) { URL.revokeObjectURL(url); showPhotoError(true); return; }
      cv.width = Math.max(1, Math.round(img.naturalWidth * k)); cv.height = Math.max(1, Math.round(img.naturalHeight * k));
      var g = cv.getContext('2d', { willReadFrequently: true });
      g.imageSmoothingEnabled = k < 1;
      g.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      try { afterDraw(); } catch (e) { showPhotoError(true); }
    };
    img.onerror = function () { URL.revokeObjectURL(url); showPhotoError(true); };
    img.src = url;
  }
  function drawSample() {
    var cv = $('#ph-canvas'); cv.width = 480; cv.height = 320;
    var g = cv.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#1D3557'; g.fillRect(0, 0, 480, 320);                       /* night-blue floor */
    g.fillStyle = '#F4F1DE'; g.beginPath(); g.arc(240, 160, 140, 0, 6.2832); g.fill();
    var cols = ['#E63946', '#F1A208'];
    for (var i = 0; i < 8; i++) {                                              /* rangoli petals */
      var a = i * Math.PI / 4;
      g.fillStyle = cols[i % 2]; g.beginPath(); g.arc(240 + Math.cos(a) * 85, 160 + Math.sin(a) * 85, 34, 0, 6.2832); g.fill();
    }
    g.fillStyle = '#2A9D8F'; g.beginPath(); g.arc(240, 160, 46, 0, 6.2832); g.fill();
    afterDraw();
  }
  function pickAt(ev) {
    if (!photo.loaded) return;
    var cv = $('#ph-canvas'), r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var x = clamp(Math.floor((ev.clientX - r.left) / r.width * cv.width), 0, cv.width - 1);
    var y = clamp(Math.floor((ev.clientY - r.top) / r.height * cv.height), 0, cv.height - 1);
    var d;
    try { d = cv.getContext('2d', { willReadFrequently: true }).getImageData(x, y, 1, 1).data; } catch (e) { return; }
    if (d[3] < 128) return;                       /* a see-through pixel has no colour to pick */
    var hex = rgbToHex({ r: d[0], g: d[1], b: d[2] });
    if (hex === photo.picked) return;
    photo.picked = hex;
    renderPhoto();
  }
  function renderPhoto() {
    $('#ph-work').hidden = !photo.loaded; $('#ph-empty').hidden = photo.loaded;
    $('#ph-picked').hidden = !photo.picked;
    if (photo.picked) { $('#ph-dot').style.background = photo.picked; $('#ph-picked-code').textContent = code(photo.picked, state.fmt); }
    var box = $('#ph-main'); box.textContent = '';
    if (photo.loaded && photo.main.length) box.appendChild(group({ kind: 'photo', base: '', colors: photo.main }, { id: 'g-photo' }));
    else if (photo.loaded) box.appendChild(EDU.el('p', { class: 'muted', i18n: 'ph_none' }));
  }

  /* ---------------- 4. saved ---------------- */
  function renderSaved() {
    var box = $('#saved-list'); box.textContent = '';
    state.saved.forEach(function (p) { box.appendChild(group(p, { saved: true })); });
    $('#sv-empty').hidden = state.saved.length > 0;
  }

  /* ---------------- shell ---------------- */
  function renderTabs() {
    ['pal', 'con', 'photo', 'saved'].forEach(function (t) {
      $('#tab-' + t).setAttribute('aria-selected', state.tab === t ? 'true' : 'false');
      $('#pane-' + t).hidden = state.tab !== t;
    });
  }
  function renderAll() { renderTabs(); renderPalettes(); renderContrast(); renderPhoto(); renderSaved(); }

  EDU.init({ slug: 'colour-palette-tool', title: 'app_title', waKey: 'shell_wa_tool' });

  $$('.cp-tabs button').forEach(function (b) { b.addEventListener('click', function () { state.tab = b.dataset.tab; save(); renderTabs(); }); });
  $$('#fmt-seg button').forEach(function (b) { b.addEventListener('click', function () { state.fmt = b.dataset.fmt; save(); renderAll(); }); });
  $('#base-pick').addEventListener('input', function () { var h = normHex(this.value); if (h) setBase(h, 'pick'); });
  baseField('base-hex', 'hex', normHex);
  baseField('base-rgb', 'rgb', function (v) { var c = parseRgb(v); return c ? rgbToHex(c) : null; });
  baseField('base-hsl', 'hsl', function (v) { var c = parseHsl(v); return c ? rgbToHex(hslToRgb(c)) : null; });
  contrastField('fg'); contrastField('bg');
  $('#c-swap').addEventListener('click', function () {
    var t = state.fg; state.fg = state.bg; state.bg = t; save();
    $$('#pane-con .cp-code-in').forEach(function (e) { e.classList.remove('bad'); }); $('#c-err').hidden = true;
    syncContrast(); renderContrast();
  });
  $('#c-usebase').addEventListener('click', function () { $('#c-bg-hex').classList.remove('bad'); setContrast('bg', state.base); });
  $('#ph-pick').addEventListener('click', function () { $('#ph-file').click(); });
  $('#ph-file').addEventListener('change', function () { loadFile(this.files && this.files[0]); this.value = ''; });
  $('#ph-sample').addEventListener('click', drawSample);
  var dragging = false;
  $('#ph-canvas').addEventListener('pointerdown', function (e) { dragging = true; pickAt(e); });
  $('#ph-canvas').addEventListener('pointermove', function (e) { if (dragging) pickAt(e); });
  window.addEventListener('pointerup', function () { dragging = false; });
  window.addEventListener('pointercancel', function () { dragging = false; });
  /* a photo can also be dropped on the photo tab (desktop) */
  $('#pane-photo').addEventListener('dragover', function (e) { e.preventDefault(); });
  $('#pane-photo').addEventListener('drop', function (e) {
    e.preventDefault();
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) loadFile(f);
  });
  $('#ph-copy').addEventListener('click', function () { if (photo.picked) copyCode(code(photo.picked, state.fmt)); });
  $('#ph-use').addEventListener('click', function () {
    if (!photo.picked) return;
    setBase(photo.picked); EDU.toast(EDU.t('base_set'));
    state.tab = 'pal'; save(); renderTabs();
  });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    state.base = DEFAULT_BASE; state.fmt = 'hex'; state.fg = DEFAULT_FG; state.bg = DEFAULT_BASE; state.saved = []; state.tab = 'pal';
    photo.loaded = false; photo.picked = ''; photo.main = [];
    $$('.cp-code-in').forEach(function (e) { e.classList.remove('bad'); }); $('#base-err').hidden = true; $('#c-err').hidden = true; showPhotoError(false);
    save(); syncBase(); syncContrast(); renderAll();
  });

  EDU.onLang(renderAll);
  syncBase(); syncContrast(); renderAll();
})();
