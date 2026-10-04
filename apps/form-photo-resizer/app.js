/* Form Photo & Signature Resizer: makes a photo, signature, thumb impression or handwritten
   declaration match the exact pixels / cm / KB of Indian exam, job and government portals.
   Everything happens in this browser tab: the picture is never uploaded, never stored.
   Pipeline: decode (EXIF orientation, ≤ 4000 px) → mip levels → crop / rotate (editor) →
   render at target size → adjust (photo: brightness, contrast, whiten background, name + date strip;
   paper: shadow removal, ink clean-up, ink colour, transparency) → size engine (JPEG quality search,
   optional pixel steps, COM padding up to the minimum KB) → JFIF / pHYs DPI patch → download / print. */
(function () {
  'use strict';
  var SLUG = 'form-photo-resizer';
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, el = EDU.el;
  var D = window.FPR_DATA;
  var MAX_SIDE = 4000;
  var FNAME = { photo: 'photo', sign: 'signature', thumb: 'thumb', decl: 'declaration' };
  var TYPE_KEY = { photo: 'type_photo', sign: 'type_sign', thumb: 'type_thumb', decl: 'type_decl' };
  var DPIS = [72, 96, 100, 150, 200, 240, 300, 600];

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ------------------------------------------------------------ saved settings */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function defaults() {
    return {
      type: 'photo',
      preset: { photo: 'ibps_photo', sign: 'ibps_sign', thumb: 'ibps_thumb', decl: 'ibps_decl' },
      over: {},                      /* edits of an official preset, by preset id */
      custom: clone(D.custom),       /* "Custom size" values per type */
      unit: 'px', lock: true,
      adj: {
        photo: { b: 0, c: 0, whiten: 0 },
        sign: { b: 0, c: 0, shadow: true, clean: true, thick: 50, ink: 'auto', transparent: false },
        thumb: { b: 0, c: 0, shadow: true, clean: false, thick: 50, ink: 'auto', transparent: false },
        decl: { b: 0, c: 0, shadow: true, clean: true, thick: 50, ink: 'auto', transparent: false }
      },
      guide: true, strip: false, name: ''
    };
  }
  var S = (function () {
    var d = defaults(), s = store.get('s', null);
    if (!s || typeof s !== 'object') return d;
    var out = d;
    if (D.types.indexOf(s.type) >= 0) out.type = s.type;
    if (s.preset && typeof s.preset === 'object') D.types.forEach(function (ty) { if (typeof s.preset[ty] === 'string') out.preset[ty] = s.preset[ty]; });
    if (s.over && typeof s.over === 'object') out.over = s.over;
    if (s.custom && typeof s.custom === 'object') D.types.forEach(function (ty) { if (s.custom[ty]) out.custom[ty] = Object.assign({}, d.custom[ty], s.custom[ty]); });
    if (s.unit === 'cm') out.unit = 'cm';
    if (s.lock === false) out.lock = false;
    if (s.adj && typeof s.adj === 'object') D.types.forEach(function (ty) { if (s.adj[ty]) out.adj[ty] = Object.assign({}, d.adj[ty], s.adj[ty]); });
    out.guide = s.guide !== false; out.strip = !!s.strip;
    return out;
  })();
  /* The name typed for the strip is personal: it stays in memory only, so the next person at a shared
     computer (cyber café, office) does not find it filled in. */
  function save() { store.set('s', Object.assign({}, S, { name: '' })); }

  /* ------------------------------------------------------------ presets and the active rule */
  function presetById(id) { for (var i = 0; i < D.presets.length; i++) if (D.presets[i].id === id) return D.presets[i]; return null; }
  function isCustom() { return S.preset[S.type] === 'custom'; }
  function curPreset() {
    var p = presetById(S.preset[S.type]);
    return p && p.type === S.type ? p : null;
  }
  function paperMode() { return S.type !== 'photo'; }
  function adj() { return S.adj[S.type]; }

  /* The rule the file must meet: official values + the person's edits. */
  function spec() {
    var p = curPreset(), base, o;
    if (!p) { base = S.custom[S.type]; o = {}; }
    else { base = p; o = S.over[p.id] || {}; }
    var pick = function (k, d) { return o[k] !== undefined ? o[k] : (base[k] !== undefined ? base[k] : d); };
    var sp = {
      w: Math.round(+pick('w', 200)), h: Math.round(+pick('h', 230)), dpi: +pick('dpi', 200),
      min: +pick('min', 0), max: +pick('max', 50), fmt: pick('fmt', 'jpg') === 'png' ? 'png' : 'jpg',
      flexOn: o.flexOn !== undefined ? !!o.flexOn : (p ? !!p.flex : !!base.flexOn)
    };
    var fr = p && p.flex ? p.flex : null;
    sp.minW = fr ? Math.min(fr[0], sp.w) : Math.max(16, Math.round(sp.w * 0.4));
    sp.minH = fr ? Math.min(fr[1], sp.h) : Math.max(16, Math.round(sp.h * 0.4));
    return sp;
  }
  function edited() {
    var p = curPreset();
    if (!p) return false;
    var o = S.over[p.id];
    return !!(o && Object.keys(o).length);
  }
  function specError(sp) {
    if (!(sp.w >= 16 && sp.w <= 6000 && sp.h >= 16 && sp.h <= 6000)) return t('err_size');
    if (!(sp.dpi >= 50 && sp.dpi <= 1200)) return t('err_size');
    if (!(sp.max > 0)) return t('err_max');
    if (!(sp.min >= 0)) return t('err_max');
    if (sp.min > sp.max) return t('err_min_max', { min: fmtNum(sp.min), max: fmtNum(sp.max) });
    return '';
  }
  function setOver(key, val) {
    var p = curPreset();
    if (!p) { S.custom[S.type][key] = val; }
    else {
      var o = S.over[p.id] || (S.over[p.id] = {});
      var official = key === 'flexOn' ? !!p.flex : (key === 'fmt' ? (p.fmt || 'jpg') : p[key]);
      if (val === official) delete o[key]; else o[key] = val;
      if (!Object.keys(o).length) delete S.over[p.id];
    }
    save();
  }

  /* ------------------------------------------------------------ formatting */
  /* keep "200 × 230 px" or "20–50 KB" in left-to-right order inside Urdu sentences */
  function iso(s) { return '⁦' + s + '⁩'; }
  function dims(w, h) { return iso(w + ' × ' + h); }
  function fmtNum(n, dec) { return EDU.fmt(+n, { maximumFractionDigits: dec === undefined ? 1 : dec }); }
  function cmOf(px, dpi) { return px / dpi * 2.54; }
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '-' + m[2] + '-' + m[1] : '';
  }
  function todayIso() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function kbRange(sp) {
    if (sp.min > 0) return iso(t('kb_range', { min: fmtNum(sp.min), max: fmtNum(sp.max) }));
    return t('kb_max', { max: fmtNum(sp.max) });
  }
  function presetLabel(p) {
    if (!p) return t('custom');
    return p.label ? (p.exam ? p.exam + ' · ' + t(p.label) : t(p.label)) : p.exam;
  }

  /* ------------------------------------------------------------ setup card */
  var presetSel = $('#preset');
  function renderTypes() {
    EDU.$$('#types button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.type === S.type)); });
  }
  function renderPresetOptions() {
    presetSel.innerHTML = '';
    D.groups.forEach(function (g) {
      var list = D.presets.filter(function (p) { return p.g === g && p.type === S.type; });
      if (!list.length) return;
      var og = el('optgroup', { label: t('grp_' + g) });
      list.forEach(function (p) {
        var px = p.w + ' × ' + p.h + ' px';
        var kb = p.min > 0 ? t('kb_range', { min: p.min, max: p.max }) : t('kb_max', { max: p.max });
        og.appendChild(el('option', { value: p.id, text: presetLabel(p) + ' — ' + px + ', ' + kb }));
      });
      presetSel.appendChild(og);
    });
    presetSel.appendChild(el('option', { value: 'custom', text: '✏️ ' + t('custom') }));
    if (!curPreset() && !isCustom()) {
      var first = D.presets.filter(function (p) { return p.type === S.type; })[0];
      S.preset[S.type] = first ? first.id : 'custom';
    }
    presetSel.value = S.preset[S.type];
    setSelectDir();
  }
  /* the closed select shows exam names in Latin script: lay it out left-to-right unless the label starts in Urdu */
  function setSelectDir() {
    var o = presetSel.options[presetSel.selectedIndex], m = o ? o.text.match(/[A-Za-zऀ-෿؀-ۿ]/) : null;
    presetSel.dir = m && /[؀-ۿ]/.test(m[0]) ? 'rtl' : 'ltr';
  }
  function chip(text, cls) {
    var latin = !/[֐-ࣿﭐ-﻿]/.test(text);   /* no Urdu letters: show it left-to-right */
    return el('span', { class: 'chip ' + (cls || ''), text: text, dir: latin ? 'ltr' : null });
  }
  function renderSpec() {
    var sp = spec(), p = curPreset();
    var box = $('#specChips');
    box.innerHTML = '';
    if (p && p.exam) box.appendChild(el('span', { class: 'chip no-i18n', dir: 'ltr', text: p.exam }));
    box.appendChild(chip(sp.w + ' × ' + sp.h + ' px', 'main'));
    box.appendChild(chip(kbRange(sp), 'main'));
    box.appendChild(chip(sp.fmt.toUpperCase()));
    var cmW = p && p.cm && !edited() ? p.cm[0] : cmOf(sp.w, sp.dpi), cmH = p && p.cm && !edited() ? p.cm[1] : cmOf(sp.h, sp.dpi);
    box.appendChild(chip(t('cm_val', { w: fmtNum(cmW, 2), h: fmtNum(cmH, 2) })));
    box.appendChild(chip(sp.dpi + ' DPI'));
    if (sp.flexOn) box.appendChild(chip(t('req_flex', { size: dims(sp.minW, sp.minH) })));
    var note = $('#specNote');
    note.hidden = !(p && p.note);
    if (p && p.note) note.textContent = t(p.note);
    $('#specChecked').textContent = p ? t('req_checked', { date: iso(fmtDate(p.checked)) }) : t('req_custom');
    $('#editedBadge').hidden = !edited();
    $('#restore').hidden = !edited();
    renderEditBox();
  }

  /* edit box (size, DPI, KB, format) */
  var editOpen = false;
  function renderEditBox() {
    var sp = spec();
    $('#editBox').hidden = !editOpen;
    $('#editToggle').setAttribute('aria-expanded', String(editOpen));
    EDU.$$('#unitSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.unit === S.unit)); });
    var act = document.activeElement;
    if (act !== $('#inW')) $('#inW').value = S.unit === 'cm' ? +cmOf(sp.w, sp.dpi).toFixed(2) : sp.w;
    if (act !== $('#inH')) $('#inH').value = S.unit === 'cm' ? +cmOf(sp.h, sp.dpi).toFixed(2) : sp.h;
    /* step counts from min: min 0.1 with step 1 would make 200 "invalid" and the arrows jump to 200.1 */
    ['#inW', '#inH'].forEach(function (s) { $(s).min = S.unit === 'cm' ? '0.01' : '1'; $(s).step = S.unit === 'cm' ? '0.01' : '1'; });
    var dsel = $('#inDpi');
    if (DPIS.indexOf(sp.dpi) < 0 && !dsel.querySelector('option[value="' + sp.dpi + '"]')) dsel.appendChild(el('option', { value: String(sp.dpi), text: String(sp.dpi) }));
    dsel.value = String(sp.dpi);
    $('#inFmt').value = sp.fmt;
    if (act !== $('#inMin')) $('#inMin').value = sp.min;
    if (act !== $('#inMax')) $('#inMax').value = sp.max;
    $('#inFlex').checked = sp.flexOn;
    $('#lockBtn').setAttribute('aria-pressed', String(S.lock));
    $('#lockBtn').textContent = S.lock ? '🔒' : '🔓';
    var e = specError(sp);
    $('#specErr').hidden = !e;
    $('#specErr').textContent = e;
  }
  function pxFromInput(v) {
    var n = parseFloat(v);
    if (!isFinite(n) || n <= 0) return NaN;
    return S.unit === 'cm' ? Math.round(n / 2.54 * spec().dpi) : Math.round(n);
  }
  /* With the lock on, the shape is taken when the person starts editing a field. Re-reading it after
     every key press would lose it: typing "300" passes through "3", which rounds the height to 3 too. */
  var lockRatio = null;
  ['#inW', '#inH'].forEach(function (s) {
    $(s).addEventListener('focus', function () { var sp = spec(); lockRatio = sp.w > 0 && sp.h > 0 ? sp.w / sp.h : null; });
    $(s).addEventListener('blur', function () { lockRatio = null; });
  });
  function onDimInput(which) {
    var sp = spec();
    var v = pxFromInput($(which === 'w' ? '#inW' : '#inH').value);
    if (!isFinite(v)) return;
    var ratio = lockRatio || sp.w / sp.h;
    if (which === 'w') {
      setOver('w', v);
      if (S.lock) { var h = Math.max(1, Math.round(v / ratio)); setOver('h', h); $('#inH').value = S.unit === 'cm' ? +cmOf(h, sp.dpi).toFixed(2) : h; }
    } else {
      setOver('h', v);
      if (S.lock) { var w = Math.max(1, Math.round(v * ratio)); setOver('w', w); $('#inW').value = S.unit === 'cm' ? +cmOf(w, sp.dpi).toFixed(2) : w; }
    }
    specChanged();
  }
  function specChanged(keepCrop) {
    renderSpec();
    if (img && !keepCrop) clampView();
    drawEditor();
    schedule();
  }

  /* ------------------------------------------------------------ image loading */
  var img = null;          /* { lv: [canvas…], W, H, srcW, srcH, scaled } */
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function ctx2d(c, opts) { var x = c.getContext('2d', opts || undefined); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; return x; }

  function probe(blob) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { res({ img: im, w: im.naturalWidth, h: im.naturalHeight, url: url }); };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('decode')); };
      im.src = url;
    });
  }
  /* Decode with EXIF orientation applied and the long side capped at 4000 px (48 MP phone photos). */
  function decode(blob) {
    return probe(blob).then(function (p) {
      if (!p.w || !p.h) throw new Error('empty');
      var s = Math.min(1, MAX_SIDE / Math.max(p.w, p.h));
      var W = Math.max(1, Math.round(p.w * s)), H = Math.max(1, Math.round(p.h * s));
      var viaElement = function () { return p.img; };
      var getSource = (typeof createImageBitmap === 'function')
        ? createImageBitmap(blob, s < 1 ? { imageOrientation: 'from-image', resizeWidth: W, resizeHeight: H, resizeQuality: 'high' } : { imageOrientation: 'from-image' })
          .then(function (bmp) {
            /* a browser that ignored the orientation option would hand back a sideways picture */
            if ((bmp.width > bmp.height) !== (W > H) && Math.abs(bmp.width - bmp.height) > 2) { if (bmp.close) bmp.close(); return viaElement(); }
            return bmp;
          }).catch(viaElement)
        : Promise.resolve(viaElement());
      return getSource.then(function (src) {
        var c = canvas(W, H), x = ctx2d(c);
        x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);          /* PNG transparency → white */
        x.drawImage(src, 0, 0, W, H);
        if (src.close) src.close();
        URL.revokeObjectURL(p.url);
        return { canvas: c, srcW: p.w, srcH: p.h, scaled: s < 1 };
      });
    });
  }
  function buildMips(c) {
    var lv = [c];
    while (Math.max(lv[lv.length - 1].width, lv[lv.length - 1].height) > 320) {
      var prev = lv[lv.length - 1], n = canvas(Math.ceil(prev.width / 2), Math.ceil(prev.height / 2));
      ctx2d(n).drawImage(prev, 0, 0, n.width, n.height);
      lv.push(n);
    }
    return lv;
  }
  /* each type (photo, signature, thumb, declaration) keeps its own picture and crop while the page is open */
  var pics = {};
  function showPicArea() {
    $('#drop').hidden = !!img;
    $('#editWrap').hidden = !img;
    $('#changePic').hidden = !img;
    $('#straighten').value = String(view.fine);
    $('#straightenOut').textContent = (view.fine > 0 ? '+' : '') + view.fine + '°';
    if (img) { sizeEditor(); renderLoadInfo(); }
  }
  function setImage(c, info) {
    img = { lv: buildMips(c), W: c.width, H: c.height, srcW: info.srcW || c.width, srcH: info.srcH || c.height, scaled: !!info.scaled, sample: !!info.sample };
    view = { rot: 0, fine: 0, ux: 0, uy: 0, cw: 100 };
    $('#loadErr').hidden = true;
    showPicArea();
    if (paperMode()) { if (!autoCrop(true)) fillView(); }
    else if (img.sample) { view.ux = 0; view.uy = -40; view.cw = 600 * photoAspect(); clampView(); }   /* head ≈ 75 % of the photo */
    else fillView();
    drawEditor();
    schedule(0);
  }
  function renderLoadInfo() {
    if (!img) return;
    $('#editWrap').setAttribute('data-w', img.W);
    $('#editWrap').setAttribute('data-h', img.H);
    var mp = img.srcW * img.srcH / 1e6;
    $('#loadInfo').textContent = img.sample ? t('loaded_sample') :
      (img.scaled ? t('big_scaled', { mp: fmtNum(mp), size: dims(img.W, img.H) }) : t('loaded', { size: dims(img.W, img.H) }));
  }
  var loadSeq = 0;
  function loadBlob(blob) {
    if (!blob) return;
    var my = ++loadSeq, type = S.type;          /* only the newest file counts, and only for the type it was added to */
    $('#loadErr').hidden = true;
    $('#loadInfo').textContent = t('loading');
    decode(blob).then(function (r) { if (my === loadSeq && type === S.type) setImage(r.canvas, r); })
      .catch(function () {
        if (my !== loadSeq || type !== S.type) return;
        var e = $('#loadErr');
        e.textContent = t('err_open');
        e.hidden = false;
        if (!img) { $('#drop').hidden = false; $('#loadInfo').textContent = ''; }
        else renderLoadInfo();                   /* the old picture stays: don't leave "Loading…" on screen */
      });
  }

  /* ------------------------------------------------------------ crop geometry
     Rotated space: the picture turned by θ around its centre. The crop frame is an axis-aligned
     rectangle there: centre (ux, uy) and width cw, in full-resolution pixels. */
  var view = { rot: 0, fine: 0, ux: 0, uy: 0, cw: 100 };
  function theta() { return (view.rot * 90 + view.fine) * Math.PI / 180; }
  function rotSize(a) {
    a = a === undefined ? theta() : a;
    var c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
    return { w: img.W * c + img.H * s, h: img.W * s + img.H * c };
  }
  function stripPx(h) { return (S.type === 'photo' && S.strip) ? Math.max(12, Math.round(h * 0.16)) : 0; }
  function photoAspect() { var sp = spec(); return sp.w / Math.max(1, sp.h - stripPx(sp.h)); }
  function cwCover() { var r = rotSize(), a = photoAspect(); return Math.min(r.w, r.h * a); }
  function cwFit() { var r = rotSize(), a = photoAspect(); return Math.max(r.w, r.h * a); }
  function cwBounds() { return { min: Math.max(8, cwCover() / 12), max: cwFit() * 1.3 }; }
  function clampView() {
    if (!img) return;
    var b = cwBounds(), r = rotSize();
    view.cw = EDU.clamp(view.cw, b.min, b.max);
    view.ux = EDU.clamp(view.ux, -r.w / 2, r.w / 2);
    view.uy = EDU.clamp(view.uy, -r.h / 2, r.h / 2);
    syncZoom();
  }
  function syncZoom() {
    var b = cwBounds();
    var v = Math.log(b.max / view.cw) / Math.log(b.max / b.min);
    $('#zoom').value = String(Math.round(EDU.clamp(v, 0, 1) * 1000));
  }
  function fillView() { view.ux = 0; view.uy = 0; view.cw = cwCover(); clampView(); }
  function fitView() { view.ux = 0; view.uy = 0; view.cw = cwFit(); clampView(); }
  function zoomBy(f, sx, sy) {
    /* zoom around a screen point (sx, sy) of the editor, or the frame centre */
    var fr = frameRect(), ks = fr.w / view.cw;
    var px = sx === undefined ? 0 : (sx - (fr.x + fr.w / 2)) / ks;
    var py = sy === undefined ? 0 : (sy - (fr.y + fr.ph / 2)) / ks;
    var b = cwBounds(), ncw = EDU.clamp(view.cw / f, b.min, b.max), real = view.cw / ncw;
    view.ux += px - px / real; view.uy += py - py / real;
    view.cw = ncw;
    clampView(); drawEditor(); schedule();
  }
  function rotateTo(rot, fine) {
    /* keep the picture point under the frame centre where it is */
    var a0 = theta(), c0 = Math.cos(a0), s0 = Math.sin(a0);
    var px = c0 * view.ux + s0 * view.uy, py = -s0 * view.ux + c0 * view.uy;   /* R(-θ)·u */
    view.rot = ((rot % 4) + 4) % 4; view.fine = fine;
    var a1 = theta(), c1 = Math.cos(a1), s1 = Math.sin(a1);
    view.ux = c1 * px - s1 * py; view.uy = s1 * px + c1 * py;
    clampView(); drawEditor(); schedule();
  }
  function mipFor(scale) {
    var m = scale >= 1 ? 0 : Math.floor(Math.log(1 / scale) / Math.LN2);
    return img.lv[EDU.clamp(m, 0, img.lv.length - 1)];
  }
  /* draw the picture so that the crop centre lands at (cx, cy) of ctx, k = target px per source px */
  function drawPicture(x, cx, cy, k) {
    x.save();
    x.translate(cx, cy); x.scale(k, k); x.translate(-view.ux, -view.uy); x.rotate(theta());
    x.drawImage(mipFor(k * (x.__dpr || 1)), -img.W / 2, -img.H / 2, img.W, img.H);
    x.restore();
  }

  /* ------------------------------------------------------------ editor canvas */
  var ed = $('#editor'), edx = ed.getContext('2d'), dpr = 1, cssW = 0, cssH = 0;
  function sizeEditor() {
    dpr = Math.min(2.5, window.devicePixelRatio || 1);
    cssW = ed.clientWidth; cssH = ed.clientHeight;
    if (!cssW || !cssH) return;
    ed.width = Math.round(cssW * dpr); ed.height = Math.round(cssH * dpr);
    edx.__dpr = dpr;
  }
  function frameRect() {
    var sp = spec(), pad = 22, aw = Math.max(40, cssW - pad * 2), ah = Math.max(40, cssH - pad * 2), a = sp.w / sp.h;
    var w = Math.min(aw, ah * a), h = w / a;
    var st = stripPx(sp.h);
    return { x: (cssW - w) / 2, y: (cssH - h) / 2, w: w, h: h, ph: h * (sp.h - st) / sp.h };
  }
  var drawQueued = false;
  function drawEditor() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(function () { drawQueued = false; paintEditor(); });
  }
  function paintEditor() {
    if (!img || $('#editWrap').hidden) return;
    if (ed.clientWidth !== cssW || ed.clientHeight !== cssH) sizeEditor();
    if (!cssW) return;
    var x = edx, fr = frameRect(), a = adj();
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.fillStyle = EDU.css('--surface-2') || '#eee';
    x.fillRect(0, 0, cssW, cssH);
    x.fillStyle = '#fff';
    x.fillRect(fr.x, fr.y, fr.w, fr.ph);
    if ('filter' in x) x.filter = 'brightness(' + (1 + a.b / 110) + ') contrast(' + (1 + a.c / 70) + ')';
    drawPicture(x, fr.x + fr.w / 2, fr.y + fr.ph / 2, fr.w / view.cw);
    if ('filter' in x) x.filter = 'none';
    /* dim everything outside the frame */
    x.save();
    x.beginPath(); x.rect(0, 0, cssW, cssH); x.rect(fr.x, fr.y, fr.w, fr.h);
    x.fillStyle = 'rgba(8,16,20,0.58)'; x.fill('evenodd');
    x.restore();
    if (fr.h - fr.ph > 0.5) drawStrip(x, fr.x, fr.y + fr.ph, fr.w, fr.h - fr.ph);
    if (S.type === 'photo' && S.guide) {
      /* head (top of hair to chin) should fill 70–80 % of the photo height */
      var cx = fr.x + fr.w / 2, cy = fr.y + fr.ph * 0.48;
      x.save();
      x.lineWidth = 2; x.setLineDash([7, 5]);
      [0.70, 0.80].forEach(function (f, i) {
        var ry = fr.ph * f / 2, rx = ry * 0.74;
        x.strokeStyle = i ? 'rgba(255,255,255,0.95)' : 'rgba(255,122,69,0.95)';
        x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.stroke();
      });
      x.setLineDash([]);
      x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(cx, fr.y + 4); x.lineTo(cx, fr.y + fr.ph - 4); x.stroke();
      x.restore();
    }
    x.lineWidth = 2; x.strokeStyle = EDU.css('--accent') || '#d9501c';
    x.strokeRect(fr.x - 1, fr.y - 1, fr.w + 2, fr.h + 2);
  }

  /* pointer: drag = move, two fingers = pinch zoom, wheel = zoom */
  var pts = {};
  function ptsList() { return Object.keys(pts).map(function (k) { return pts[k]; }); }
  ed.addEventListener('pointerdown', function (e) {
    if (!img) return;
    ed.setPointerCapture(e.pointerId);
    pts[e.pointerId] = { x: e.offsetX, y: e.offsetY };
  });
  ed.addEventListener('pointermove', function (e) {
    var p = pts[e.pointerId];
    if (!p || !img) return;
    var list = ptsList();
    var fr = frameRect(), ks = fr.w / view.cw;
    if (list.length === 1) {
      view.ux -= (e.offsetX - p.x) / ks; view.uy -= (e.offsetY - p.y) / ks;
      p.x = e.offsetX; p.y = e.offsetY;
      clampView(); drawEditor(); schedule();
    } else if (list.length === 2) {
      var other = list[0] === p ? list[1] : list[0];
      var d0 = Math.hypot(p.x - other.x, p.y - other.y);
      var d1 = Math.hypot(e.offsetX - other.x, e.offsetY - other.y);
      var mx = (e.offsetX + other.x) / 2, my = (e.offsetY + other.y) / 2;
      p.x = e.offsetX; p.y = e.offsetY;
      if (d0 > 4 && d1 > 4) zoomBy(d1 / d0, mx, my);
    }
  });
  function endPtr(e) { delete pts[e.pointerId]; }
  ed.addEventListener('pointerup', endPtr);
  ed.addEventListener('pointercancel', endPtr);
  ed.addEventListener('wheel', function (e) {
    if (!img) return;
    e.preventDefault();
    zoomBy(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016)), e.offsetX, e.offsetY);
  }, { passive: false });
  ed.addEventListener('keydown', function (e) {
    if (!img) return;
    var step = view.cw * (e.shiftKey ? 0.1 : 0.02), k = e.key, done = true;
    if (k === 'ArrowLeft') view.ux -= step;
    else if (k === 'ArrowRight') view.ux += step;
    else if (k === 'ArrowUp') view.uy -= step;
    else if (k === 'ArrowDown') view.uy += step;
    else if (k === '+' || k === '=') { zoomBy(1.08); return e.preventDefault(); }
    else if (k === '-' || k === '_') { zoomBy(1 / 1.08); return e.preventDefault(); }
    else if (k === 'r') { rotateTo(view.rot + 1, view.fine); return e.preventDefault(); }
    else if (k === 'R') { rotateTo(view.rot - 1, view.fine); return e.preventDefault(); }
    else if (k === 'f' || k === 'F') { fillView(); }
    else if (k === '0') { fitView(); }
    else done = false;
    if (done) { e.preventDefault(); clampView(); drawEditor(); schedule(); }
  });

  /* ------------------------------------------------------------ name + date strip */
  function drawStrip(x, sx, sy, w, h) {
    x.save();
    x.fillStyle = '#fff'; x.fillRect(sx, sy, w, h);
    x.fillStyle = '#000'; x.textAlign = 'center'; x.textBaseline = 'middle';
    var name = (S.name || '').trim(), date = fmtDate($('#stripDate').value) || fmtDate(todayIso());
    var lines = name ? [name, date] : [date];
    lines.forEach(function (line, i) {
      var fs = h * (lines.length > 1 ? 0.4 : 0.56);
      do { x.font = '700 ' + fs.toFixed(1) + 'px "Noto Sans", Arial, "Nirmala UI", sans-serif'; fs *= 0.93; }
      while (x.measureText(line).width > w * 0.94 && fs > 4);
      var yy = sy + h * (lines.length > 1 ? (i ? 0.73 : 0.3) : 0.52);
      x.fillText(line, sx + w / 2, yy);
    });
    x.restore();
  }

  /* ------------------------------------------------------------ pixel processing */
  function lut(b, c) {
    var g = Math.pow(2, -b / 50), f = c >= 0 ? 1 + c / 50 : 1 + c / 100, L = new Uint8ClampedArray(256);
    for (var i = 0; i < 256; i++) { var v = 255 * Math.pow(i / 255, g); L[i] = (v - 128) * f + 128; }
    return L;
  }
  function applyLut(d, L) { for (var i = 0; i < d.length; i += 4) { d[i] = L[d[i]]; d[i + 1] = L[d[i + 1]]; d[i + 2] = L[d[i + 2]]; } }

  /* Whiten background: the plain wall colour is read from the frame edges; wall-coloured pixels that
     touch the edge (flood fill, so a similar colour inside the face is left alone) are pushed to white.
     Very light pixels anywhere get a gentle lift. No AI, so it suits plain light walls. */
  function whitenBg(d, w, h, s) {
    if (s <= 0) return;
    var rs = [], gs = [], bs = [], i, x, y;
    function sample(px, py) { var o = (py * w + px) * 4; rs.push(d[o]); gs.push(d[o + 1]); bs.push(d[o + 2]); }
    for (x = 0; x < w; x += 2) { sample(x, 0); sample(x, Math.min(h - 1, 2)); }
    for (y = 0; y < Math.round(h * 0.6); y += 2) { sample(0, y); sample(w - 1, y); sample(Math.min(w - 1, 2), y); sample(Math.max(0, w - 3), y); }
    var med = function (a) { a.sort(function (p, q) { return p - q; }); return a[a.length >> 1]; };
    var br = med(rs), bg = med(gs), bb = med(bs);
    var tol = 0.07 + 0.2 * s, n = w * h, sim = new Float32Array(n);
    for (i = 0; i < n; i++) {
      var o = i * 4, dr = d[o] - br, dg = d[o + 1] - bg, db = d[o + 2] - bb;
      var dist = Math.sqrt(dr * dr + dg * dg + db * db) / 441.7;
      sim[i] = dist <= tol * 0.55 ? 1 : (dist >= tol ? 0 : 1 - (dist - tol * 0.55) / (tol * 0.45));
    }
    var seen = new Uint8Array(n), stack = new Int32Array(n), sp = 0;
    function push(p) { if (!seen[p] && sim[p] > 0.35) { seen[p] = 1; stack[sp++] = p; } }
    for (x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
    for (y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (sp) {
      var p = stack[--sp], px = p % w;
      if (px > 0) push(p - 1);
      if (px < w - 1) push(p + 1);
      if (p >= w) push(p - w);
      if (p < n - w) push(p + w);
    }
    var gain = Math.min(1, 0.45 + s * 0.75), thr = 232 - 40 * s;
    for (i = 0; i < n; i++) {
      var q = i * 4, f = seen[i] ? sim[i] * gain : 0;
      var L = 0.299 * d[q] + 0.587 * d[q + 1] + 0.114 * d[q + 2];
      if (L > thr) f = Math.max(f, (L - thr) / (255 - thr) * s * 0.9);
      if (f > 0) { d[q] += (255 - d[q]) * f; d[q + 1] += (255 - d[q + 1]) * f; d[q + 2] += (255 - d[q + 2]) * f; }
    }
  }

  /* Paper background (lighting, shadow, paper tint) per channel: block maxima → dilate → blur → bilinear. */
  function paperBg(d, w, h) {
    var B = Math.max(8, Math.round(Math.max(w, h) / 40)), gw = Math.ceil(w / B), gh = Math.ceil(h / B);
    var out = [new Float32Array(gw * gh), new Float32Array(gw * gh), new Float32Array(gw * gh)];
    var x, y, c, gx, gy;
    for (y = 0; y < h; y++) {
      gy = (y / B) | 0;
      for (x = 0; x < w; x++) {
        gx = (x / B) | 0;
        var o = (y * w + x) * 4, gi = gy * gw + gx;
        for (c = 0; c < 3; c++) if (d[o + c] > out[c][gi]) out[c][gi] = d[o + c];
      }
    }
    function filter(src, op) {
      var dst = new Float32Array(src.length);
      for (gy = 0; gy < gh; gy++) for (gx = 0; gx < gw; gx++) {
        var acc = op === 'max' ? 0 : 0, cnt = 0;
        for (var yy = Math.max(0, gy - 1); yy <= Math.min(gh - 1, gy + 1); yy++) for (var xx = Math.max(0, gx - 1); xx <= Math.min(gw - 1, gx + 1); xx++) {
          var v = src[yy * gw + xx];
          if (op === 'max') { if (v > acc) acc = v; } else { acc += v; cnt++; }
        }
        dst[gy * gw + gx] = op === 'max' ? acc : acc / cnt;
      }
      return dst;
    }
    for (c = 0; c < 3; c++) out[c] = filter(filter(filter(out[c], 'max'), 'avg'), 'avg');
    return function (x2, y2, ch) {
      var fx = EDU.clamp(x2 / B - 0.5, 0, gw - 1), fy = EDU.clamp(y2 / B - 0.5, 0, gh - 1);
      var x0 = fx | 0, y0 = fy | 0, x1 = Math.min(gw - 1, x0 + 1), y1 = Math.min(gh - 1, y0 + 1), ax = fx - x0, ay = fy - y0, g = out[ch];
      return (g[y0 * gw + x0] * (1 - ax) + g[y0 * gw + x1] * ax) * (1 - ay) + (g[y1 * gw + x0] * (1 - ax) + g[y1 * gw + x1] * ax) * ay;
    };
  }
  var INK = { black: [0, 0, 0], blue: [16, 42, 140] };
  /* returns 'black' | 'blue' used (for auto) */
  function processPaper(d, w, h, a, transparent) {
    var x, y, i, o;
    if (a.shadow) {
      var bgAt = paperBg(d, w, h);
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
        o = (y * w + x) * 4;
        for (var c = 0; c < 3; c++) {
          var bgv = Math.max(70, bgAt(x, y, c));
          d[o + c] = Math.min(255, d[o + c] * 255 / bgv);
        }
      }
    }
    applyLut(d, lut(a.b, a.c));
    if (!a.clean) return null;
    var thr = 0.5 + 0.4 * (a.thick / 100), n = w * h;
    var Lv = new Float32Array(n);
    for (i = 0; i < n; i++) { o = i * 4; Lv[i] = (0.299 * d[o] + 0.587 * d[o + 1] + 0.114 * d[o + 2]) / 255; }
    var ink = a.ink;
    if (ink === 'auto') {
      var sb = 0, sr = 0, cnt = 0;
      for (i = 0; i < n; i++) if (Lv[i] < thr - 0.12) { o = i * 4; sb += d[o + 2]; sr += (d[o] + d[o + 1]) / 2; cnt++; }
      ink = cnt && (sb - sr) / cnt > 14 ? 'blue' : 'black';
    }
    var col = INK[ink] || INK.black;
    for (i = 0; i < n; i++) {
      o = i * 4;
      var al = EDU.clamp((thr - Lv[i]) / 0.16 + 0.5, 0, 1);
      if (transparent) { d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = Math.round(al * 255); }
      else { d[o] = 255 + (col[0] - 255) * al; d[o + 1] = 255 + (col[1] - 255) * al; d[o + 2] = 255 + (col[2] - 255) * al; d[o + 3] = 255; }
    }
    return ink;
  }

  /* Draw the final picture at w × h (photo area + optional strip). */
  function renderFinal(w, h, transparent) {
    var a = adj(), st = stripPx(h), ph = h - st;
    var out = canvas(w, h), ox = ctx2d(out);
    if (!paperMode()) {
      ox.fillStyle = '#fff'; ox.fillRect(0, 0, w, h);
      ox.__dpr = 1;
      drawPicture(ox, w / 2, ph / 2, w / view.cw);
      var id = ox.getImageData(0, 0, w, ph);
      applyLut(id.data, lut(a.b, a.c));
      whitenBg(id.data, w, ph, a.whiten / 100);
      ox.putImageData(id, 0, 0);
      if (st) drawStrip(ox, 0, ph, w, st);
      return out;
    }
    /* paper: clean at up to 3× the target size, then scale down for smooth ink edges */
    var s = EDU.clamp(Math.min(3, 1800 / Math.max(w, h)), 1, 3);
    var ww = Math.round(w * s), wh = Math.round(h * s), work = canvas(ww, wh), wx = ctx2d(work);
    wx.fillStyle = '#fff'; wx.fillRect(0, 0, ww, wh);
    wx.__dpr = 1;
    drawPicture(wx, ww / 2, wh / 2, ww / view.cw);
    var wd = wx.getImageData(0, 0, ww, wh);
    var useAlpha = transparent && a.clean;
    processPaper(wd.data, ww, wh, a, useAlpha);
    wx.putImageData(wd, 0, 0);
    if (!useAlpha) { ox.fillStyle = '#fff'; ox.fillRect(0, 0, w, h); }
    if (s > 2) {
      var mid = canvas(Math.round(w * 2), Math.round(h * 2));
      ctx2d(mid).drawImage(work, 0, 0, mid.width, mid.height);
      work = mid;
    }
    ox.drawImage(work, 0, 0, w, h);
    return out;
  }

  /* ------------------------------------------------------------ file bytes: JPEG / PNG */
  function toBlob(c, type, q) {
    return new Promise(function (res) {
      if (c.toBlob) c.toBlob(function (b) { res(b); }, type, q);
      else res(null);
    });
  }
  function bytesOf(blob) {
    if (blob.arrayBuffer) return blob.arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
    return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(new Uint8Array(r.result)); }; r.readAsArrayBuffer(blob); });
  }
  /* Write the DPI into the JFIF APP0 header (insert one if the encoder left it out). */
  function patchJfif(b, dpi) {
    if (b[0] !== 0xFF || b[1] !== 0xD8) return b;
    var isJfif = b[2] === 0xFF && b[3] === 0xE0 && b[6] === 0x4A && b[7] === 0x46 && b[8] === 0x49 && b[9] === 0x46 && b[10] === 0;
    if (!isJfif) {
      var app0 = [0xFF, 0xE0, 0, 16, 0x4A, 0x46, 0x49, 0x46, 0, 1, 1, 1, dpi >> 8, dpi & 255, dpi >> 8, dpi & 255, 0, 0];
      var nb = new Uint8Array(b.length + app0.length);
      nb.set(b.subarray(0, 2), 0); nb.set(app0, 2); nb.set(b.subarray(2), 2 + app0.length);
      return nb;
    }
    b[13] = 1; b[14] = dpi >> 8; b[15] = dpi & 255; b[16] = dpi >> 8; b[17] = dpi & 255;
    return b;
  }
  /* Grow a JPEG to `target` bytes with COM (comment) segments right after APP0: a valid file, same picture. */
  var PAD_TEXT = 'Padding added by AI Pathshala Form Photo Resizer to reach the minimum file size asked by the form. The picture is unchanged. ';
  function padJpeg(b, target) {
    var need = target - b.length;
    if (need <= 4) return b;
    var at = 2;
    if (b[2] === 0xFF && b[3] === 0xE0) at = 4 + ((b[4] << 8) | b[5]);
    var segs = [];
    while (need > 4) {
      var payload = Math.min(65533, need - 4);
      segs.push(payload);
      need -= payload + 4;
    }
    var total = segs.reduce(function (s, p) { return s + p + 4; }, 0);
    var nb = new Uint8Array(b.length + total), pos = at;
    nb.set(b.subarray(0, at), 0);
    segs.forEach(function (p) {
      nb[pos] = 0xFF; nb[pos + 1] = 0xFE; nb[pos + 2] = (p + 2) >> 8; nb[pos + 3] = (p + 2) & 255;
      for (var i = 0; i < p; i++) nb[pos + 4 + i] = i < PAD_TEXT.length ? PAD_TEXT.charCodeAt(i) : 0x20;
      pos += p + 4;
    });
    nb.set(b.subarray(at), pos);
    return nb;
  }
  var CRC = (function () { var tb = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; tb[n] = c >>> 0; } return tb; })();
  function crc32(b, s, e) { var c = 0xFFFFFFFF; for (var i = s; i < e; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function pngChunk(type, data) {
    var out = new Uint8Array(12 + data.length), len = data.length;
    out[0] = len >>> 24; out[1] = (len >> 16) & 255; out[2] = (len >> 8) & 255; out[3] = len & 255;
    for (var i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
    out.set(data, 8);
    var c = crc32(out, 4, 8 + len);
    out[8 + len] = c >>> 24; out[9 + len] = (c >> 16) & 255; out[10 + len] = (c >> 8) & 255; out[11 + len] = c & 255;
    return out;
  }
  /* PNG: add pHYs (DPI) after IHDR, and an optional tEXt chunk to reach the minimum size */
  function patchPng(b, dpi, padTo) {
    if (b[1] !== 0x50 || b[2] !== 0x4E || b[3] !== 0x47) return b;
    var ppm = Math.round(dpi / 0.0254);
    var phys = pngChunk('pHYs', new Uint8Array([ppm >>> 24, (ppm >> 16) & 255, (ppm >> 8) & 255, ppm & 255, ppm >>> 24, (ppm >> 16) & 255, (ppm >> 8) & 255, ppm & 255, 1]));
    var at = 8 + 12 + 13;      /* signature + IHDR */
    var extra = [phys], size = b.length + phys.length;
    if (padTo && padTo > size + 12) {
      var n = padTo - size - 12, key = 'Comment\0', data = new Uint8Array(n);
      for (var i = 0; i < n; i++) data[i] = i < key.length ? key.charCodeAt(i) : (i - key.length < PAD_TEXT.length ? PAD_TEXT.charCodeAt(i - key.length) : 0x20);
      extra.push(pngChunk('tEXt', data));
    }
    var add = extra.reduce(function (s, c) { return s + c.length; }, 0), nb = new Uint8Array(b.length + add), pos = at;
    nb.set(b.subarray(0, at), 0);
    extra.forEach(function (c) { nb.set(c, pos); pos += c.length; });
    nb.set(b.subarray(at), pos);
    return nb;
  }

  /* Size engine. Window = [min × 1024, max × 1000] bytes so the file passes whether the portal counts
     KB as 1024 or 1000 bytes; we aim 2 % inside it. */
  function sizeWindow(sp) {
    var lo = sp.min * 1024, hi = sp.max * 1000;
    if (sp.min > 0 && lo > hi) { lo = sp.min * 1000; hi = sp.max * 1024; }
    var aimLo = lo > 0 ? lo + Math.max(150, lo * 0.02) : 0, aimHi = hi - Math.max(150, hi * 0.02);
    if (aimLo >= aimHi) { aimLo = lo; aimHi = hi; }
    return { lo: lo, hi: hi, aimLo: aimLo, aimHi: aimHi };
  }
  function makeFile(sp, isStale) {
    var win = sizeWindow(sp), w = sp.w, h = sp.h, steps = 0;
    var a = adj(), transparent = paperMode() && a.transparent && a.clean;
    var fmt = transparent ? 'png' : sp.fmt;
    function shrink() {
      if (!sp.flexOn || steps >= 30) return false;
      var f = 0.9, nw = Math.round(w * f), nh = Math.round(h * f);
      if (nw < sp.minW || nh < sp.minH) {
        var k = Math.max(sp.minW / w, sp.minH / h);
        if (k >= 0.999) return false;
        nw = Math.round(w * k); nh = Math.round(h * k);
      }
      if (nw === w && nh === h) return false;
      w = nw; h = nh; steps++;
      return true;
    }
    function finish(bytes, q, state, extra) {
      return Object.assign({ bytes: bytes, w: w, h: h, q: q, fmt: fmt, state: state, scaled: w !== sp.w || h !== sp.h, dpi: sp.dpi, win: win }, extra || {});
    }
    function attemptPng() {
      var cv = renderFinal(w, h, transparent);
      return toBlob(cv, 'image/png').then(bytesOf).then(function (b) {
        if (isStale()) return null;
        if (b.length + 21 > win.aimHi && win.hi < Infinity) {
          if (shrink()) return attemptPng();
          return finish(patchPng(b, sp.dpi), null, 'png_big');
        }
        if (b.length + 21 < win.aimLo) return finish(patchPng(b, sp.dpi, Math.round(win.aimLo + Math.min(1024, (win.aimHi - win.aimLo) * 0.1))), null, 'padded', { unpadded: b.length + 21 });
        return finish(patchPng(b, sp.dpi), null, 'ok');
      });
    }
    function attemptJpeg() {
      var cv = renderFinal(w, h, false), cache = {};
      function enc(q) {
        var key = Math.round(q * 100);
        if (cache[key]) return Promise.resolve(cache[key]);
        return toBlob(cv, 'image/jpeg', key / 100).then(bytesOf).then(function (b) { b = patchJfif(b, sp.dpi); cache[key] = b; return b; });
      }
      return enc(0.95).then(function (b95) {
        if (isStale()) return null;
        if (b95.length <= win.aimHi) {
          if (b95.length >= win.aimLo) return finish(b95, 95, 'ok');
          /* under the minimum: best quality first, then pad */
          return enc(1).then(function (b100) {
            if (b100.length >= win.aimLo && b100.length <= win.aimHi) return finish(b100, 100, 'ok');
            var base = b100.length <= win.aimHi ? b100 : b95, q = base === b100 ? 100 : 95;
            var target = Math.round(Math.min(win.aimHi, win.aimLo + Math.max(512, (win.aimHi - win.aimLo) * 0.08)));
            return finish(padJpeg(base, target), q, 'padded', { unpadded: base.length });
          });
        }
        return enc(0.3).then(function (b30) {
          if (isStale()) return null;
          if (b30.length > win.aimHi) {
            if (shrink()) return attemptJpeg();
            return finish(b30, 30, 'impossible');
          }
          /* binary search: highest quality whose file fits under the maximum */
          var lo = 30, hi = 95, best = b30, bestQ = 30;
          function step() {
            if (hi - lo <= 1) return Promise.resolve();
            var mid = Math.round((lo + hi) / 2);
            return enc(mid / 100).then(function (b) {
              if (b.length <= win.aimHi) { best = b; bestQ = mid; lo = mid; } else hi = mid;
              return isStale() ? null : step();
            });
          }
          return step().then(function () {
            if (isStale()) return null;
            if (best.length < win.aimLo) {
              var target = Math.round(Math.min(win.aimHi, win.aimLo + 512));
              return finish(padJpeg(best, target), bestQ, 'padded', { unpadded: best.length });
            }
            return finish(best, bestQ, 'ok');
          });
        });
      });
    }
    return fmt === 'png' ? attemptPng() : attemptJpeg();
  }

  /* ------------------------------------------------------------ run + show the result */
  var job = 0, timer = null, last = null, outUrl = null;
  var resultEl = $('#result');
  function schedule(delay) {
    clearTimeout(timer);
    job++;                                   /* anything still running is now out of date */
    resultEl.setAttribute('data-busy', '1');
    resultEl.classList.add('fpr-busy');
    timer = setTimeout(run, delay === undefined ? 160 : delay);
  }
  function run() {
    var my = ++job;
    var sp = spec(), e = specError(sp);
    var stale = function () { return my !== job; };
    if (!img) { showResult(null); return; }
    if (e) { last = { state: 'error', msg: e }; showResult(last); return; }
    makeFile(sp, stale).then(function (r) {
      if (!r || stale()) return;
      last = r;
      showResult(r);
    }).catch(function (err) {
      if (stale()) return;
      last = { state: 'error', msg: t('err_process') };
      showResult(last);
      if (window.console) console.warn(err);
    });
  }
  function fileName(r) { return FNAME[S.type] + '_' + r.w + 'x' + r.h + '_' + Math.max(1, Math.round(r.bytes.length / 1024)) + 'KB.' + (r.fmt === 'png' ? 'png' : 'jpg'); }
  function showResult(r) {
    var has = !!img;
    $('#resultEmpty').hidden = has;
    resultEl.hidden = !has;
    resultEl.setAttribute('data-busy', '0');
    resultEl.classList.remove('fpr-busy');
    if (!has || !r) return;
    var status = $('#status'), dl = $('#download');
    resultEl.setAttribute('data-state', r.state);
    $('#outImg').hidden = r.state === 'error';
    if (r.state === 'error') {
      status.className = 'callout danger small mb0';
      status.textContent = r.msg;
      dl.disabled = true;
      $('#downloadTxt').textContent = t('download');
      ['rPx', 'rPrint', 'rFile', 'rQual'].forEach(function (id) { $('#' + id).textContent = '—'; });
      return;
    }
    var sp = spec(), kb = r.bytes.length / 1024, kB = r.bytes.length / 1000;
    ['w', 'h', 'dpi', 'q', 'fmt'].forEach(function (k) { resultEl.setAttribute('data-' + k, r[k] == null ? '' : String(r[k])); });
    resultEl.setAttribute('data-bytes', String(r.bytes.length));
    if (outUrl) URL.revokeObjectURL(outUrl);
    var blob = new Blob([r.bytes], { type: r.fmt === 'png' ? 'image/png' : 'image/jpeg' });
    outUrl = URL.createObjectURL(blob);
    r.blob = blob;
    var im = $('#outImg');
    im.src = outUrl;
    var zoom = EDU.clamp(Math.min(260 / r.h, 320 / r.w), 0.25, 3);
    im.style.width = Math.round(r.w * zoom) + 'px';
    var inside = r.state !== 'impossible' && r.state !== 'png_big' && r.bytes.length >= r.win.lo && r.bytes.length <= r.win.hi;
    $('#rPx').innerHTML = '';
    $('#rPx').appendChild(el('bdi', { dir: 'ltr', text: r.w + ' × ' + r.h + ' px' }));
    if (r.scaled) $('#rPx').appendChild(el('span', { class: 'muted small', text: ' (' + t('was_px', { size: dims(sp.w, sp.h) }) + ')' }));
    $('#rPrint').textContent = t('print_val', { size: iso(fmtNum(cmOf(r.w, r.dpi), 2) + ' × ' + fmtNum(cmOf(r.h, r.dpi), 2) + ' cm'), dpi: r.dpi });
    var fileCell = $('#rFile');
    fileCell.innerHTML = '';
    fileCell.appendChild(el('bdi', { dir: 'ltr', text: fmtNum(kb) + ' KB (' + fmtNum(kB) + ' kB) ' }));
    fileCell.appendChild(el('span', { class: inside ? 'fpr-ok' : 'fpr-bad', style: { whiteSpace: 'nowrap' }, text: (inside ? '✓ ' : '✗ ') + kbRange(sp) }));
    $('#rQualRow').hidden = r.q == null;
    $('#rQual').textContent = r.q == null ? '' : r.q + '%';
    var msg, cls = 'success';
    var pxTxt = iso(r.w + ' × ' + r.h + ' px'), kbTxt = iso(fmtNum(kb) + ' KB');
    if (r.state === 'ok') msg = t('st_ok', { px: pxTxt, kb: kbTxt });
    else if (r.state === 'padded') msg = t('st_ok', { px: pxTxt, kb: kbTxt }) + ' ' + t('st_padded', { min: fmtNum(sp.min), was: fmtNum(r.unpadded ? r.unpadded / 1024 : kb) });
    else if (r.state === 'impossible') { cls = 'danger'; msg = t('st_impossible', { px: pxTxt, kb: kbTxt, max: fmtNum(sp.max) }) + ' ' + (sp.flexOn ? t('st_impossible_flex') : t('st_impossible_fix')); }
    else if (r.state === 'png_big') { cls = 'warning'; msg = t('st_png_big', { kb: kbTxt, max: fmtNum(sp.max) }); }
    if (r.scaled && r.state !== 'impossible') msg += ' ' + t('st_scaled', { px: pxTxt });
    if (r.fmt === 'png' && sp.fmt === 'jpg' && r.state !== 'impossible') { msg += ' ' + t('st_png_note'); if (cls === 'success') cls = 'warning'; }
    status.className = 'callout ' + cls + ' small mb0';
    status.textContent = msg;
    dl.disabled = r.state === 'impossible';
    $('#downloadTxt').innerHTML = '';
    $('#downloadTxt').appendChild(el('span', { text: '⬇ ' + t('download') }));
    $('#downloadTxt').appendChild(el('span', { class: 'fname no-i18n', dir: 'ltr', text: fileName(r) }));
    $('#printNote').textContent = t('print_note', { size: iso(fmtNum(cmOf(r.w, r.dpi), 2) + ' × ' + fmtNum(cmOf(r.h, r.dpi), 2) + ' cm') });
  }
  $('#download').addEventListener('click', function () {
    if (!last || !last.blob || last.state === 'impossible' || last.state === 'error') return;
    EDU.download(fileName(last), last.blob);
  });
  $('#printBtn').addEventListener('click', function () {
    if (!last || !outUrl || last.state === 'error') return;
    var n = +$('#copies').value || 1, area = $('#printArea');
    area.innerHTML = '';
    var sheet = el('div', { class: 'pr-sheet' });
    for (var i = 0; i < n; i++) {
      sheet.appendChild(el('img', { src: outUrl, alt: '', style: { width: cmOf(last.w, last.dpi).toFixed(3) + 'cm', height: cmOf(last.h, last.dpi).toFixed(3) + 'cm' } }));
    }
    area.appendChild(sheet);
    setTimeout(function () { window.print(); }, 60);
  });

  /* ------------------------------------------------------------ auto-crop to ink */
  function autoCrop(silent) {
    if (!img) return false;
    var r = rotSize(), m = Math.min(1, 700 / Math.max(r.w, r.h));
    var cw = Math.max(8, Math.round(r.w * m)), ch = Math.max(8, Math.round(r.h * m));
    var c = canvas(cw, ch), x = ctx2d(c, { willReadFrequently: true });
    x.fillStyle = '#fff'; x.fillRect(0, 0, cw, ch);
    var save = { ux: view.ux, uy: view.uy };
    view.ux = 0; view.uy = 0; x.__dpr = 1;
    drawPicture(x, cw / 2, ch / 2, m);
    view.ux = save.ux; view.uy = save.uy;
    var d = x.getImageData(0, 0, cw, ch).data, bgAt = paperBg(d, cw, ch);
    var cols = new Float64Array(cw), rows = new Float64Array(ch), total = 0;
    var mx = Math.round(cw * 0.02), my = Math.round(ch * 0.02);
    for (var yy = my; yy < ch - my; yy++) for (var xx = mx; xx < cw - mx; xx++) {
      var o = (yy * cw + xx) * 4;
      var L = 0.299 * d[o] + 0.587 * d[o + 1] + 0.114 * d[o + 2];
      var B = 0.299 * bgAt(xx, yy, 0) + 0.587 * bgAt(xx, yy, 1) + 0.114 * bgAt(xx, yy, 2);
      if (L < Math.max(40, B) * 0.7) { cols[xx]++; rows[yy]++; total++; }
    }
    if (total < 30) { if (!silent) EDU.toast(t('autocrop_none')); return false; }
    function bounds(arr) {
      var cut = total * 0.004, acc = 0, a = 0, b = arr.length - 1, i;
      for (i = 0; i < arr.length; i++) { acc += arr[i]; if (acc > cut) { a = i; break; } }
      acc = 0;
      for (i = arr.length - 1; i >= 0; i--) { acc += arr[i]; if (acc > cut) { b = i; break; } }
      return [a, b + 1];
    }
    var bx = bounds(cols), by = bounds(rows);
    var bw = (bx[1] - bx[0]) / m, bh = (by[1] - by[0]) / m;
    view.ux = ((bx[0] + bx[1]) / 2 - cw / 2) / m;
    view.uy = ((by[0] + by[1]) / 2 - ch / 2) / m;
    var asp = photoAspect();
    view.cw = Math.max(bw * 1.16, bh * 1.16 * asp, 8);
    clampView();
    if (!silent) { drawEditor(); schedule(); }
    return true;
  }

  /* ------------------------------------------------------------ samples (drawn here, no files) */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var r = Math.imul(seed ^ seed >>> 15, 1 | seed); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function noise(c, amt, seed) {
    var x = c.getContext('2d'), id = x.getImageData(0, 0, c.width, c.height), d = id.data, R = rng(seed);
    for (var i = 0; i < d.length; i += 4) { var n = (R() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(id, 0, 0);
  }
  function paper(x, w, h) {
    var g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#f4efe4'); g.addColorStop(0.55, '#e9e2d4'); g.addColorStop(1, '#b9b2a5');   /* phone shadow */
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  }
  function scribble(x, R, x0, y0, len, hgt, wid) {
    x.beginPath(); x.moveTo(x0, y0);
    var px = x0;
    while (px < x0 + len) {
      var dx = 10 + R() * 22 * wid;
      x.bezierCurveTo(px + dx * 0.3, y0 - hgt * (0.4 + R()), px + dx * 0.7, y0 + hgt * (0.2 + R() * 0.6), px + dx, y0 + (R() - 0.5) * hgt * 0.4);
      px += dx;
    }
    x.stroke();
  }
  function sampleCanvas(type) {
    var R = rng(7 + type.length), c, x;
    if (type === 'photo') {
      c = canvas(900, 1200); x = c.getContext('2d');
      var g = x.createLinearGradient(0, 0, 900, 1200);
      g.addColorStop(0, '#e3e6ea'); g.addColorStop(1, '#c4cad2');
      x.fillStyle = g; x.fillRect(0, 0, 900, 1200);
      var sh = x.createRadialGradient(640, 520, 50, 640, 560, 420);              /* soft shadow on the wall */
      sh.addColorStop(0, 'rgba(90,95,105,0.35)'); sh.addColorStop(1, 'rgba(90,95,105,0)');
      x.fillStyle = sh; x.fillRect(0, 0, 900, 1200);
      x.fillStyle = '#28427a';                                                      /* shirt */
      x.beginPath(); x.moveTo(90, 1200); x.bezierCurveTo(110, 930, 260, 880, 450, 870); x.bezierCurveTo(640, 880, 790, 930, 810, 1200); x.fill();
      x.fillStyle = '#f2f2f2';
      x.beginPath(); x.moveTo(390, 880); x.lineTo(450, 990); x.lineTo(510, 880); x.closePath(); x.fill();
      x.fillStyle = '#b47c55';                                                      /* neck + face */
      x.fillRect(395, 700, 110, 190);
      x.beginPath(); x.ellipse(450, 560, 165, 215, 0, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(287, 575, 26, 48, 0, 0, Math.PI * 2); x.ellipse(613, 575, 26, 48, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#1e140e';                                                      /* hair */
      x.beginPath(); x.ellipse(450, 445, 178, 120, 0, Math.PI, 0); x.lineTo(628, 520); x.bezierCurveTo(560, 420, 360, 420, 272, 520); x.closePath(); x.fill();
      x.beginPath(); x.ellipse(450, 400, 170, 75, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff';
      x.beginPath(); x.ellipse(385, 560, 28, 15, 0, 0, Math.PI * 2); x.ellipse(515, 560, 28, 15, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#2a1a10';
      x.beginPath(); x.arc(385, 560, 11, 0, Math.PI * 2); x.arc(515, 560, 11, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#2a1a10'; x.lineWidth = 9; x.lineCap = 'round';
      x.beginPath(); x.moveTo(350, 520); x.quadraticCurveTo(385, 505, 420, 518); x.moveTo(480, 518); x.quadraticCurveTo(515, 505, 550, 520); x.stroke();
      x.strokeStyle = '#8d5a3b'; x.lineWidth = 6;
      x.beginPath(); x.moveTo(450, 585); x.quadraticCurveTo(440, 640, 455, 650); x.stroke();
      x.strokeStyle = '#7a3a2c'; x.lineWidth = 8;
      x.beginPath(); x.moveTo(400, 690); x.quadraticCurveTo(450, 725, 500, 690); x.stroke();
      noise(c, 26, 11);
      return c;
    }
    c = canvas(type === 'decl' ? 1600 : (type === 'thumb' ? 900 : 1400), type === 'decl' ? 1100 : (type === 'thumb' ? 900 : 800));
    x = c.getContext('2d');
    paper(x, c.width, c.height);
    x.lineCap = 'round'; x.lineJoin = 'round';
    if (type === 'thumb') {
      x.strokeStyle = 'rgba(70,50,150,0.85)'; x.lineWidth = 5;
      for (var k = 0; k < 26; k++) {
        x.beginPath();
        for (var a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
          var rr = 12 + k * 9 + Math.sin(a * 3 + k) * 3;
          var px = 430 + Math.cos(a) * rr * 0.78, py = 460 + Math.sin(a) * rr;
          if (a === 0) x.moveTo(px, py); else x.lineTo(px, py);
        }
        x.closePath(); x.stroke();
      }
    } else if (type === 'decl') {
      x.strokeStyle = '#141414'; x.lineWidth = 4;
      for (var ln = 0; ln < 6; ln++) scribble(x, R, 220, 260 + ln * 95, ln === 5 ? 600 : 1150, 26, 1);
      x.lineWidth = 5;
      scribble(x, R, 1000, 900, 340, 60, 1.6);
    } else {
      x.strokeStyle = '#1b2f95'; x.lineWidth = 7;
      scribble(x, R, 470, 470, 560, 110, 2.2);
      x.beginPath(); x.moveTo(460, 545); x.quadraticCurveTo(760, 520, 1060, 548); x.stroke();
    }
    noise(c, 18, 5);
    return c;
  }
  $('#sample').addEventListener('click', function () { setImage(sampleCanvas(S.type), { sample: true }); });

  /* ------------------------------------------------------------ add picture: pick, camera, paste, drop */
  $('#pickBtn').addEventListener('click', function () { $('#fileIn').value = ''; $('#fileIn').click(); });
  $('#camBtn').addEventListener('click', function () {
    var ci = $('#camIn');
    ci.setAttribute('capture', S.type === 'photo' ? 'user' : 'environment');
    ci.value = ''; ci.click();
  });
  ['#fileIn', '#camIn'].forEach(function (sel) {
    $(sel).addEventListener('change', function (e) { var f = e.target.files && e.target.files[0]; if (f) loadBlob(f); });
  });
  $('#changePic').addEventListener('click', function () {
    var d = $('#drop');
    d.hidden = !d.hidden;
    if (!d.hidden) $('#pickBtn').focus();
  });
  $('#pasteBtn').addEventListener('click', function () {
    if (!navigator.clipboard || !navigator.clipboard.read) { EDU.toast(t('paste_hint')); return; }
    navigator.clipboard.read().then(function (items) {
      for (var i = 0; i < items.length; i++) {
        var ty = items[i].types.filter(function (x) { return /^image\//.test(x); })[0];
        if (ty) return items[i].getType(ty).then(loadBlob);
      }
      EDU.toast(t('paste_none'));
    }).catch(function () { EDU.toast(t('paste_hint')); });
  });
  document.addEventListener('paste', function (e) {
    var items = (e.clipboardData && e.clipboardData.items) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && /^image\//.test(items[i].type)) {
        var tg = e.target;
        if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA') && tg.type !== 'file') return;
        e.preventDefault();
        loadBlob(items[i].getAsFile());
        return;
      }
    }
  });
  (function () {
    var depth = 0, zones = [$('#drop'), $('#stage')];
    function on(v) { zones.forEach(function (z) { z.classList.toggle('over', v); }); }
    document.addEventListener('dragenter', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { depth++; on(true); } });
    document.addEventListener('dragleave', function () { depth = Math.max(0, depth - 1); if (!depth) on(false); });
    document.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) e.preventDefault(); });
    document.addEventListener('drop', function (e) {
      depth = 0; on(false);
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      e.preventDefault();
      loadBlob(f);
    });
  })();
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && last && last.blob && last.state !== 'impossible' && last.state !== 'error') {
      e.preventDefault();
      $('#download').click();
    }
  });

  /* ------------------------------------------------------------ controls */
  EDU.$$('#types button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (S.type === b.dataset.type) return;
      pics[S.type] = img ? { img: img, view: view } : null;
      S.type = b.dataset.type; save();
      var p = pics[S.type];
      img = p ? p.img : null;
      view = p ? p.view : { rot: 0, fine: 0, ux: 0, uy: 0, cw: 100 };
      last = null;
      $('#loadErr').hidden = true;
      showPicArea();
      renderAll();
      if (img) clampView();
      drawEditor(); schedule(0);
    });
  });
  presetSel.addEventListener('change', function () {
    S.preset[S.type] = presetSel.value; save(); setSelectDir();
    renderSpec(); renderAdjust();
    if (img) { if (paperMode() && autoCrop(true)) { } else clampView(); }
    drawEditor(); schedule();
  });
  $('#editToggle').addEventListener('click', function () { editOpen = !editOpen; renderEditBox(); if (editOpen) $('#inW').focus(); });
  $('#restore').addEventListener('click', function () { var p = curPreset(); if (p) delete S.over[p.id]; save(); specChanged(); });
  EDU.$$('#unitSeg button').forEach(function (b) { b.addEventListener('click', function () { S.unit = b.dataset.unit; save(); renderEditBox(); }); });
  $('#lockBtn').addEventListener('click', function () { S.lock = !S.lock; save(); renderEditBox(); });
  $('#inW').addEventListener('input', function () { onDimInput('w'); });
  $('#inH').addEventListener('input', function () { onDimInput('h'); });
  ['#inW', '#inH', '#inMin', '#inMax'].forEach(function (s) { $(s).addEventListener('change', function () { renderEditBox(); }); });
  $('#inDpi').addEventListener('change', function () {
    var sp = spec(), nd = +$('#inDpi').value;
    if (S.unit === 'cm') {         /* keep the size in cm: the pixels follow the DPI */
      setOver('w', Math.round(cmOf(sp.w, sp.dpi) / 2.54 * nd));
      setOver('h', Math.round(cmOf(sp.h, sp.dpi) / 2.54 * nd));
    }
    setOver('dpi', nd);
    specChanged();
  });
  $('#inFmt').addEventListener('change', function () { setOver('fmt', $('#inFmt').value); specChanged(true); });
  function kbInput(key, sel) {
    var v = parseFloat($(sel).value);
    if (!isFinite(v) || v < 0) return;
    setOver(key, Math.round(v * 10) / 10);
    specChanged(true);
  }
  $('#inMin').addEventListener('input', function () { kbInput('min', '#inMin'); });
  $('#inMax').addEventListener('input', function () { kbInput('max', '#inMax'); });
  $('#inFlex').addEventListener('change', function () { setOver('flexOn', $('#inFlex').checked); specChanged(true); });

  $('#rotL').addEventListener('click', function () { rotateTo(view.rot - 1, view.fine); });
  $('#rotR').addEventListener('click', function () { rotateTo(view.rot + 1, view.fine); });
  $('#straighten').addEventListener('input', function () {
    var v = +$('#straighten').value;
    $('#straightenOut').textContent = (v > 0 ? '+' : '') + v + '°';
    if (img) rotateTo(view.rot, v);
  });
  $('#zoom').addEventListener('input', function () {
    if (!img) return;
    var b = cwBounds(), v = +$('#zoom').value / 1000;
    view.cw = b.max * Math.pow(b.min / b.max, v);
    drawEditor(); schedule();
  });
  $('#zoomIn').addEventListener('click', function () { if (img) zoomBy(1.15); });
  $('#zoomOut').addEventListener('click', function () { if (img) zoomBy(1 / 1.15); });
  $('#fillBtn').addEventListener('click', function () { if (img) { fillView(); drawEditor(); schedule(); } });
  $('#fitBtn').addEventListener('click', function () { if (img) { fitView(); drawEditor(); schedule(); } });
  $('#autoCrop').addEventListener('click', function () { autoCrop(false); });

  function bindRange(id, key, outId) {
    $(id).addEventListener('input', function () {
      adj()[key] = +$(id).value; save();
      $(outId).textContent = (adj()[key] > 0 && key !== 'whiten' && key !== 'thick' ? '+' : '') + adj()[key];
      drawEditor(); schedule();
    });
  }
  bindRange('#bright', 'b', '#brightOut');
  bindRange('#contrast', 'c', '#contrastOut');
  bindRange('#whiten', 'whiten', '#whitenOut');
  bindRange('#thick', 'thick', '#thickOut');
  $('#shadow').addEventListener('change', function () { adj().shadow = $('#shadow').checked; save(); schedule(); });
  $('#clean').addEventListener('change', function () { adj().clean = $('#clean').checked; save(); renderAdjust(); schedule(); });
  $('#transparent').addEventListener('change', function () { adj().transparent = $('#transparent').checked; save(); schedule(); });
  EDU.$$('#inkSeg button').forEach(function (b) { b.addEventListener('click', function () { adj().ink = b.dataset.ink; save(); renderAdjust(); schedule(); }); });
  $('#faceGuide').addEventListener('change', function () { S.guide = $('#faceGuide').checked; save(); drawEditor(); });
  $('#stripOn').addEventListener('change', function () { S.strip = $('#stripOn').checked; save(); renderAdjust(); if (img) clampView(); drawEditor(); schedule(); });
  $('#stripName').addEventListener('input', function () { S.name = $('#stripName').value.slice(0, 40); save(); drawEditor(); schedule(); });
  $('#stripDate').addEventListener('input', function () { drawEditor(); schedule(); });
  $('#stripDate').value = todayIso();

  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    /* keep the type that is open: its picture stays on screen, so it must keep its own tools */
    var keepType = S.type;
    S = defaults(); S.type = keepType; save();
    editOpen = false;
    $('#stripDate').value = todayIso();
    renderAll();
    if (img) { fillView(); if (paperMode()) autoCrop(true); }
    drawEditor(); schedule();
  });

  function renderAdjust() {
    var a = adj(), paper = paperMode();
    $('#photoTools').hidden = paper;
    $('#paperTools').hidden = !paper;
    $('#bright').value = a.b; $('#brightOut').textContent = (a.b > 0 ? '+' : '') + a.b;
    $('#contrast').value = a.c; $('#contrastOut').textContent = (a.c > 0 ? '+' : '') + a.c;
    if (!paper) {
      $('#whiten').value = a.whiten; $('#whitenOut').textContent = a.whiten;
      $('#faceGuide').checked = S.guide;
      $('#stripOn').checked = S.strip;
      $('#stripFields').hidden = !S.strip;
      $('#stripName').value = S.name;
    } else {
      $('#shadow').checked = a.shadow;
      $('#clean').checked = a.clean;
      $('#thickWrap').hidden = !a.clean; $('#inkWrap').hidden = !a.clean;
      $('#transWrap').hidden = !a.clean; $('#transHelp').hidden = !a.clean;
      $('#thick').value = a.thick; $('#thickOut').textContent = a.thick;
      EDU.$$('#inkSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.ink === a.ink)); });
      $('#transparent').checked = !!a.transparent;
    }
    $('#autoCrop').hidden = !paper;
    $('#cropHelp').textContent = paper ? t('crop_help_paper') : t('crop_help_photo');
  }
  function renderAll() {
    renderTypes();
    renderPresetOptions();
    renderSpec();
    renderAdjust();
    renderLoadInfo();
    if (last) showResult(last); else showResult(null);
  }

  window.addEventListener('resize', function () { if (img) { sizeEditor(); drawEditor(); } });
  EDU.onTheme(function () { drawEditor(); });
  EDU.onLang(function () { renderAll(); drawEditor(); });
  renderAll();
})();
