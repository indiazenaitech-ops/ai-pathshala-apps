/* Rangoli & Kolam Maker: UI (tabs, tools, pointer input, history, saving, export, print). */
(function () {
  'use strict';
  var A = window.RArt, t = EDU.t, $ = EDU.$, $$ = EDU.$$;
  var SLUG = 'rangoli-maker', store = EDU.store(SLUG);
  var MAX_DESIGNS = 10, MAX_UNDO = 60, EXPORT_PX = 1600;
  var PALETTE = [['white', '#ffffff'], ['red', '#d62839'], ['yellow', '#f9c80e'], ['orange', '#f77f00'], ['pink', '#e83e8c'], ['green', '#2a9d3f'],
    ['blue', '#1e6fd9'], ['indigo', '#3a2f9e'], ['purple', '#8e3fbf'], ['teal', '#0fa3a3'], ['brown', '#9c4a1a'], ['black', '#1c1c1c']];
  var FOLDS = [1, 4, 6, 8, 12, 16];
  var PEN_W = [5, 9, 15, 26], ER_W = [14, 26, 42, 70], ST_S = [18, 30, 46, 66], K_W = [4, 7, 10, 14];
  var STAMPS = [['dot', '●'], ['petal', '🌸'], ['leaf', '🍃'], ['diya', '🪔'], ['flower', '🌼']];
  var BGS = ['tile', 'oxide', 'dark', 'paper'];
  var GUIDES = ['off', 'circles', 'grid'];
  var GRIDS = ['square', 'diamond', 'tri'];
  var STUDIO_TOOLS = [['brush', '🖌️'], ['eraser', '🧽'], ['stamp', '🌸'], ['fill', '🪣']];
  var KOLAM_TOOLS = [['kline', '➰'], ['loop', '⭕'], ['kpen', '✏️'], ['paint', '🎨'], ['kerase', '✂️']];
  var TABS = ['studio', 'kolam', 'color', 'gallery'];

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'wa_game', wide: true });

  /* ---------------------------------------------------------------- state (vector data only) */
  function num(v, d) { v = +v; return isFinite(v) ? v : d; }
  function numArr(a) { return Array.isArray(a) ? a.map(function (v) { return num(v, 0); }) : []; }
  function color(c, d) { return /^#[0-9a-f]{6}$/i.test(String(c)) ? String(c).toLowerCase() : d; }
  function cleanStudioItem(it) {
    if (!it || typeof it !== 'object') return null;
    var f = EDU.clamp(num(it.f, 1) | 0, 1, 16), m = it.m ? 1 : 0;
    if (it.t === 'pen' || it.t === 'erase') { var p = numArr(it.p); if (p.length < 2) return null; return { t: it.t, p: p, c: color(it.c, '#d62839'), w: EDU.clamp(num(it.w, 9), 1, 120), f: f, m: m }; }
    if (it.t === 'stamps') { var q = numArr(it.p); if (q.length < 2) return null; return { t: 'stamps', k: STAMPS.some(function (s) { return s[0] === it.k; }) ? it.k : 'dot', p: q, s: EDU.clamp(num(it.s, 30), 4, 200), c: color(it.c, '#d62839'), f: f, m: m }; }
    if (it.t === 'fill') return { t: 'fill', x: num(it.x, 500), y: num(it.y, 500), c: color(it.c, '#d62839'), f: f, m: m };
    return null;
  }
  function cleanKolamItem(it) {
    if (!it || typeof it !== 'object' || (it.t !== 'kl' && it.t !== 'pen')) return null;
    var p = numArr(it.p); if (p.length < 2) return null;
    return { t: it.t, p: p, cl: it.cl ? 1 : 0, c: color(it.c, '#ffffff'), w: EDU.clamp(num(it.w, 7), 1, 40), f: EDU.clamp(num(it.f, 1) | 0, 1, 4) };
  }
  function cleanDoc(mode, d) {
    d = d && typeof d === 'object' ? d : {};
    if (mode === 'studio') return {
      bg: BGS.indexOf(d.bg) >= 0 ? d.bg : 'tile', fold: FOLDS.indexOf(d.fold) >= 0 ? d.fold : 8, mirror: d.mirror === undefined ? true : !!d.mirror,
      guides: GUIDES.indexOf(d.guides) >= 0 ? d.guides : 'circles', items: (Array.isArray(d.items) ? d.items : []).map(cleanStudioItem).filter(Boolean), sid: d.sid || null
    };
    if (mode === 'kolam') {
      var g = GRIDS.indexOf(d.g) >= 0 ? d.g : 'square', lat = A.lattice(g, num(d.n, 5));
      return { bg: BGS.indexOf(d.bg) >= 0 ? d.bg : 'oxide', g: lat.g, n: lat.n, fold: A.folds(lat.g).indexOf(d.fold) >= 0 ? d.fold : 1,
        items: (Array.isArray(d.items) ? d.items : []).map(cleanKolamItem).filter(Boolean),
        ghost: Array.isArray(d.ghost) ? d.ghost.map(cleanKolamItem).filter(Boolean) : null, sid: d.sid || null };
    }
    var fills = {}, tpl = A.TEMPLATE_IDS.indexOf(d.tpl) >= 0 ? d.tpl : 'lotus';
    if (d.fills && typeof d.fills === 'object') Object.keys(d.fills).forEach(function (k) { var c = color(d.fills[k], null); if (c && /^[a-z]\d{1,3}$/.test(k)) fills[k] = c; });
    return { tpl: tpl, fills: fills, sid: d.sid || null };
  }
  function defaults() {
    var s = A.starter('sikku5');
    return {
      studio: cleanDoc('studio', { items: A.sampleStudio() }),
      kolam: cleanDoc('kolam', { g: s.g, n: s.n, items: s.items }),
      color: cleanDoc('color', { tpl: 'lotus' })
    };
  }
  var S = (function () {
    var saved = store.get('cur', null), d = defaults();
    if (!saved || typeof saved !== 'object') return d;
    return { studio: saved.studio ? cleanDoc('studio', saved.studio) : d.studio, kolam: saved.kolam ? cleanDoc('kolam', saved.kolam) : d.kolam, color: saved.color ? cleanDoc('color', saved.color) : d.color };
  })();
  var P = (function () {
    var p = store.get('prefs', {}) || {};
    return {
      tab: TABS.indexOf(p.tab) >= 0 ? p.tab : 'studio',
      tool: STUDIO_TOOLS.some(function (x) { return x[0] === p.tool; }) ? p.tool : 'brush',
      ktool: KOLAM_TOOLS.some(function (x) { return x[0] === p.ktool; }) ? p.ktool : 'kline',
      color: color(p.color, '#d62839'), kcolor: color(p.kcolor, '#ffffff'), ccolor: color(p.ccolor, '#f77f00'),
      size: EDU.clamp(num(p.size, 1) | 0, 0, 3), stamp: STAMPS.some(function (s) { return s[0] === p.stamp; }) ? p.stamp : 'petal',
      symFill: p.symFill === undefined ? true : !!p.symFill, snap: p.snap === undefined ? true : !!p.snap, smode: p.smode === 'trace' ? 'trace' : 'use'
    };
  })();
  var designs = (function () {
    var list = store.get('designs', []);
    if (!Array.isArray(list)) return [];
    return list.filter(function (x) { return x && x.id && x.mode && ['studio', 'kolam', 'color'].indexOf(x.mode) >= 0; }).slice(0, MAX_DESIGNS).map(function (x) {
      return { id: String(x.id), name: String(x.name || '').slice(0, 40), mode: x.mode, at: num(x.at, Date.now()), doc: cleanDoc(x.mode, x.doc), thumb: typeof x.thumb === 'string' && x.thumb.indexOf('data:image/') === 0 ? x.thumb : '' };
    });
  })();
  var hist = { studio: { u: [], r: [] }, kolam: { u: [], r: [] }, color: { u: [], r: [] } };
  var note = '';          /* a one-off message added to the status line (cleared on the next change) */
  var forcedSeed = null;  /* test hook: makes "New sikku kolam" deterministic */

  function mode() { return P.tab === 'gallery' ? 'studio' : P.tab; }
  function doc() { return S[mode()]; }
  function curColor() { return P.tab === 'kolam' ? P.kcolor : P.tab === 'color' ? P.ccolor : P.color; }
  function setCurColor(c) { if (P.tab === 'kolam') P.kcolor = c; else if (P.tab === 'color') P.ccolor = c; else P.color = c; }

  /* ---------------------------------------------------------------- saving (this device only) */
  var saveTimer = 0;
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 350); }
  function saveNow() {
    clearTimeout(saveTimer);
    var ok = store.set('cur', S);
    store.set('prefs', P);
    if (!ok && !saveNow.warned) { saveNow.warned = true; EDU.toast(t('save_failed')); }
    if (ok) saveNow.warned = false;
  }
  function saveDesigns() {
    var ok = store.set('designs', designs);
    if (!ok) EDU.toast(t('save_failed'));
    return ok;
  }

  /* ---------------------------------------------------------------- DOM */
  var work = $('#rm-work'), stage = $('#rm-stage'), cwrap = $('#rm-cwrap'), svgWrap = $('#rm-svgwrap');
  var bgC = $('#rm-bg'), artC = $('#rm-art'), liveC = $('#rm-live');
  var bctx = bgC.getContext('2d'), actx = artC.getContext('2d', { willReadFrequently: true }), lctx = liveC.getContext('2d');
  var view = { css: 0, px: 0, k: 1 };
  var latCache = null;
  function lat() {
    var d = S.kolam;
    if (!latCache || latCache.g !== d.g || latCache.n !== d.n) latCache = A.lattice(d.g, d.n);
    return latCache;
  }

  function ib(id, icon, key, extra) {
    var b = EDU.el('button', Object.assign({ type: 'button', class: 'rm-ib', id: id, 'aria-label': t(key), title: t(key), 'data-key': key }, extra || {}),
      EDU.el('span', { class: 'rm-ic', 'aria-hidden': 'true', text: icon }), EDU.el('span', { class: 'rm-lbl', text: t(key) }));
    return b;
  }
  function segBtn(attrs, key, text) {
    var b = EDU.el('button', Object.assign({ type: 'button' }, attrs), text !== undefined ? text : t(key));
    if (key) b.setAttribute('data-i18n', key);
    return b;
  }
  function press(container, attr, val) { $$('[' + attr + ']', container).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === String(val))); }); }

  function buildStatic() {
    /* palette */
    var pal = $('#rm-pal'); pal.innerHTML = '';
    PALETTE.forEach(function (p) {
      pal.appendChild(EDU.el('button', { type: 'button', class: 'rm-sw', 'data-c': p[1], style: { background: p[1] }, 'aria-label': t('col_' + p[0]), title: t('col_' + p[0]), onclick: function () { setCurColor(p[1]); syncControls(); scheduleSave(); } }));
    });
    var custom = EDU.el('label', { class: 'rm-custom', id: 'rm-customlbl', title: t('custom_color') },
      EDU.el('input', { type: 'color', id: 'rm-custom', 'aria-label': t('custom_color') }), EDU.el('i', { 'aria-hidden': 'true' }));
    pal.appendChild(custom);
    $('#rm-custom').addEventListener('input', function (e) { setCurColor(color(e.target.value, '#d62839')); syncControls(); scheduleSave(); });

    var sz = $('#rm-size'); sz.innerHTML = '';
    ['size_s', 'size_m', 'size_l', 'size_xl'].forEach(function (k, i) { sz.appendChild(segBtn({ 'data-size': i, onclick: function () { P.size = i; syncControls(); scheduleSave(); } }, k)); });

    var st = $('#rm-stamps'); st.innerHTML = '';
    STAMPS.forEach(function (s) {
      var b = EDU.el('button', { type: 'button', 'data-stamp': s[0], onclick: function () { P.stamp = s[0]; P.tool = 'stamp'; buildTools(); syncControls(); scheduleSave(); } },
        EDU.el('span', { 'aria-hidden': 'true', text: s[1] + ' ' }), EDU.el('span', { 'data-i18n': 'st_' + s[0], text: t('st_' + s[0]) }));
      st.appendChild(b);
    });

    var fo = $('#rm-fold'); fo.innerHTML = '';
    FOLDS.forEach(function (f) { fo.appendChild(segBtn({ 'data-f': f, onclick: function () { S.studio.fold = f; afterSetting(); } }, null, String(f))); });
    $('#rm-mirror').addEventListener('change', function (e) { S.studio.mirror = e.target.checked; afterSetting(); });

    var gu = $('#rm-guides'); gu.innerHTML = '';
    GUIDES.forEach(function (g) { gu.appendChild(segBtn({ 'data-g': g, onclick: function () { S.studio.guides = g; afterSetting(); } }, 'g_' + g)); });

    var bg = $('#rm-bgs'); bg.innerHTML = '';
    BGS.forEach(function (b) { bg.appendChild(segBtn({ 'data-bg': b, onclick: function () { doc().bg = b; afterSetting(); } }, 'bg_' + b)); });

    var gr = $('#rm-grid'); gr.innerHTML = '';
    GRIDS.forEach(function (g) { gr.appendChild(segBtn({ 'data-grid': g, onclick: function () { setGrid(g, g === S.kolam.g ? S.kolam.n : { square: 5, diamond: 7, tri: 6 }[g]); } }, 'grid_' + g)); });
    $('#rm-gsize').addEventListener('change', function (e) { setGrid(S.kolam.g, +e.target.value); });
    $('#rm-snap').addEventListener('change', function (e) { P.snap = e.target.checked; scheduleSave(); renderHint(); });
    $('#rm-symfill').addEventListener('change', function (e) { P.symFill = e.target.checked; scheduleSave(); });
    $$('#rm-smode button').forEach(function (b) { b.addEventListener('click', function () { P.smode = b.getAttribute('data-sm'); syncControls(); scheduleSave(); }); });

    /* starters */
    var sw = $('#rm-starters'); sw.innerHTML = '';
    A.STARTERS.forEach(function (s) {
      var cv = document.createElement('canvas'); cv.width = cv.height = 140;
      var sd = A.starter(s.id), c = cv.getContext('2d'), k = 140 / A.W, la = A.lattice(sd.g, sd.n);
      c.setTransform(k, 0, 0, k, 0, 0); A.drawBg(c, 'oxide');
      A.renderKolam(c, { bg: 'oxide', items: sd.items }, la, k);
      sw.appendChild(EDU.el('button', { type: 'button', class: 'rm-thumb', 'data-starter': s.id, onclick: function () { useStarter(s.id); } },
        cv, EDU.el('span', { 'data-i18n': 'k_' + s.id, text: t('k_' + s.id) })));
    });
    /* templates */
    var tp = $('#rm-tpls'); tp.innerHTML = '';
    A.TEMPLATE_IDS.forEach(function (id) {
      var b = EDU.el('button', { type: 'button', class: 'rm-thumb', 'data-tpl': id, onclick: function () { setTemplate(id); } });
      b.innerHTML = '<svg viewBox="0 0 1000 1000" aria-hidden="true">' + A.TEMPLATES[id].map(function (r) {
        return '<path d="' + r.d + '" fill="#fff"' + (r.g === 'page' ? '' : ' stroke="#2b2118" stroke-width="9"') + '/>';
      }).join('') + '</svg>';
      b.appendChild(EDU.el('span', { 'data-i18n': 't_' + id, text: t('t_' + id) }));
      tp.appendChild(b);
    });
    /* tabs */
    $$('#rm-tabs [role="tab"]').forEach(function (b) { b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); }); });
    $('#rm-tabs').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = TABS.indexOf(P.tab), rtl = document.documentElement.dir === 'rtl', step = (e.key === 'ArrowRight') !== rtl ? 1 : -1;
      setTab(TABS[(i + step + TABS.length) % TABS.length]); $('#tab-' + P.tab).focus(); e.preventDefault();
    });
  }

  function buildTools() {
    var box = $('#rm-tools'); box.innerHTML = '';
    var list = P.tab === 'kolam' ? KOLAM_TOOLS : P.tab === 'color' ? [] : STUDIO_TOOLS;
    list.forEach(function (x) {
      var key = 'tool_' + x[0];
      box.appendChild(ib('tool-' + x[0], x[0] === 'stamp' ? (STAMPS.filter(function (s) { return s[0] === P.stamp; })[0] || STAMPS[1])[1] : x[1], key, {
        'data-tool': x[0], onclick: function () { if (P.tab === 'kolam') P.ktool = x[0]; else P.tool = x[0]; syncControls(); renderHint(); scheduleSave(); }
      }));
    });
    box.hidden = !list.length;
  }

  function relabel() {
    $$('.rm-ib[data-key]').forEach(function (b) { var k = b.getAttribute('data-key'); b.setAttribute('aria-label', t(k)); b.title = t(k); var l = $('.rm-lbl', b); if (l) l.textContent = t(k); });
    $$('#rm-pal .rm-sw').forEach(function (b) { var p = PALETTE.filter(function (x) { return x[1] === b.getAttribute('data-c'); })[0]; if (p) { b.setAttribute('aria-label', t('col_' + p[0])); b.title = t('col_' + p[0]); } });
    $('#rm-customlbl').title = t('custom_color'); $('#rm-custom').setAttribute('aria-label', t('custom_color'));
    var ul = $('#rm-names'); ul.innerHTML = '';
    for (var i = 1; i <= 11; i++) ul.appendChild(EDU.el('li', { text: t('nm_' + i) }));
    buildGsize();
    drawDemos();
  }

  function buildGsize() {
    var sel = $('#rm-gsize'), g = S.kolam.g, opts = [];
    if (g === 'square') for (var n = 3; n <= 9; n++) opts.push([n, n + ' × ' + n]);
    else if (g === 'diamond') for (var m = 3; m <= 13; m += 2) { var rows = []; for (var r = 1; r <= m; r += 2) rows.push(r); opts.push([m, rows.concat(rows.slice(0, -1).reverse()).join('-')]); }
    else for (var q = 3; q <= 9; q++) opts.push([q, t('rows_n', { n: q })]);
    sel.innerHTML = '';
    opts.forEach(function (o) { sel.appendChild(EDU.el('option', { value: o[0], text: o[1] })); });
    sel.value = String(S.kolam.n);
  }

  /* ---------------------------------------------------------------- tabs + controls */
  function setTab(tab) {
    if (TABS.indexOf(tab) < 0) return;
    endDrag();
    P.tab = tab;
    var gallery = tab === 'gallery';
    work.hidden = gallery; $('#rm-galsec').hidden = !gallery;
    $$('#rm-tabs [role="tab"]').forEach(function (b) { var on = b.getAttribute('data-tab') === tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    $$('[data-for]').forEach(function (el) { el.hidden = el.getAttribute('data-for').split(' ').indexOf(tab) < 0; });
    cwrap.hidden = tab === 'color'; svgWrap.hidden = tab !== 'color';
    if (gallery) renderGallery();
    else {
      buildTools();
      $('#rm-name').value = currentName();
      fit(true);
      if (tab === 'color') renderSvg();
    }
    syncControls(); renderStatus(); renderHint();
    scheduleSave();
  }
  function currentName() { var d = doc(); if (!d.sid) return ''; var x = designs.filter(function (z) { return z.id === d.sid; })[0]; return x ? x.name : ''; }

  function syncControls() {
    var m = P.tab, d = S[m === 'gallery' ? 'studio' : m];
    if (m === 'gallery') return;
    var cc = curColor();
    $$('#rm-pal .rm-sw').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-c') === cc)); });
    var isPal = PALETTE.some(function (p) { return p[1] === cc; });
    $('#rm-customlbl').setAttribute('data-on', String(!isPal)); $('#rm-custom').value = cc; $('#rm-customlbl i').style.background = cc;
    press($('#rm-size'), 'data-size', P.size);
    press($('#rm-tools'), 'data-tool', m === 'kolam' ? P.ktool : P.tool);
    if (m === 'studio') {
      press($('#rm-stamps'), 'data-stamp', P.stamp);
      press($('#rm-fold'), 'data-f', d.fold);
      $('#rm-mirror').checked = !!d.mirror;
      press($('#rm-guides'), 'data-g', d.guides);
      var stIc = $('#tool-stamp .rm-ic'); if (stIc) stIc.textContent = (STAMPS.filter(function (s) { return s[0] === P.stamp; })[0] || STAMPS[1])[1];
    }
    if (m === 'studio' || m === 'kolam') press($('#rm-bgs'), 'data-bg', d.bg);
    if (m === 'kolam') {
      press($('#rm-grid'), 'data-grid', d.g);
      var fo = $('#rm-kfold'), allowed = A.folds(d.g);
      if (fo.getAttribute('data-for-grid') !== d.g) {
        fo.innerHTML = ''; fo.setAttribute('data-for-grid', d.g);
        allowed.forEach(function (f) { fo.appendChild(segBtn({ 'data-kf': f, onclick: function () { S.kolam.fold = f; afterSetting(); } }, null, String(f))); });
      }
      press(fo, 'data-kf', d.fold);
      $('#rm-snap').checked = P.snap;
      if ($('#rm-gsize').value !== String(d.n) || $('#rm-gsize').getAttribute('data-g') !== d.g) { $('#rm-gsize').setAttribute('data-g', d.g); buildGsize(); }
      press($('#rm-smode'), 'data-sm', P.smode);
      $('#rm-ghostoff').hidden = !(d.ghost && d.ghost.length);
    }
    if (m === 'color') { press($('#rm-tpls'), 'data-tpl', d.tpl); $('#rm-symfill').checked = P.symFill; }
    var h = hist[m];
    $('#rm-undo').disabled = !h.u.length; $('#rm-redo').disabled = !h.r.length;
    $('#rm-clear').disabled = m === 'color' ? !Object.keys(d.fills).length : !(d.items.length || (d.ghost && d.ghost.length));
  }
  function afterSetting() {
    note = '';
    if (P.tab === 'color') renderSvg(); else { drawBgLayer(); if (P.tab === 'kolam') drawArt(); }
    syncControls(); renderStatus(); scheduleSave();
  }

  /* ---------------------------------------------------------------- status line (aria-live) */
  function renderStatus() {
    var m = P.tab, d = S[m], s = '';
    if (m === 'gallery') return;
    if (m === 'studio') {
      var f = d.fold, mir = d.mirror;
      if (f === 1 && !mir) s = t('status_free');
      else if (f === 1) s = t('status_mirror1');
      else if (!mir) s = t('status_rot', { n: f, a: EDU.fmt(360 / f, { maximumFractionDigits: 1 }) });
      else s = t('status_rot_mirror', { n: f, a: EDU.fmt(360 / f, { maximumFractionDigits: 1 }) });
      s += ' ' + t('copies_n', { n: f * (mir ? 2 : 1) });
    } else if (m === 'kolam') {
      s = t('kolam_status', { d: EDU.fmt(lat().dots.length), l: EDU.fmt(d.items.length) });
    } else {
      var regs = A.TEMPLATES[d.tpl].filter(function (r) { return r.g !== 'page'; });
      var done = regs.filter(function (r) { return d.fills[r.id]; }).length;
      s = t('color_status', { n: EDU.fmt(done), m: EDU.fmt(regs.length) });
    }
    $('#rm-status').textContent = s + (note ? ' ' + note : '');
  }
  function renderHint() {
    var m = P.tab, k = '';
    if (m === 'studio') k = 'hint_' + P.tool;
    else if (m === 'kolam') k = P.ktool === 'kline' && !P.snap ? 'hint_kpen' : 'hint_' + P.ktool;
    else if (m === 'color') k = 'hint_color';
    $('#rm-hint').textContent = k ? t(k) : '';
  }

  /* ---------------------------------------------------------------- canvas size + layers */
  function stageSize() {
    var availW = stage.clientWidth || 320, size = availW;
    var full = document.fullscreenElement === work || document.webkitFullscreenElement === work;
    if (full || window.innerWidth >= 900) {
      var top = full ? 0 : ((document.querySelector('.edu-top') || {}).offsetHeight || 0);
      var bar = $('#rm-bar').offsetHeight || 50;
      size = Math.min(availW, Math.max(300, window.innerHeight - top - bar - (full ? 70 : 110)));
    }
    return Math.max(200, Math.floor(size));
  }
  function fit(force) {
    var size = stageSize();
    svgWrap.style.width = size + 'px';
    if (P.tab !== 'studio' && P.tab !== 'kolam') return;
    var dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
    var px = Math.max(300, Math.min(1600, Math.round(size * dpr)));
    if (!force && size === view.css && px === view.px) return;
    view = { css: size, px: px, k: px / A.W };
    cwrap.style.width = size + 'px'; cwrap.style.height = size + 'px';
    [bgC, artC, liveC].forEach(function (c) { c.width = px; c.height = px; });
    drawBgLayer(); drawArt(); scheduleLive();
  }
  function drawBgLayer() {
    var d = doc();
    bctx.setTransform(view.k, 0, 0, view.k, 0, 0);
    A.drawBg(bctx, d.bg);
    if (P.tab === 'studio') A.drawGuides(bctx, d.bg, d.guides, d.fold, d.mirror);
  }
  function clearCtx(c) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); }
  function drawArt() {
    clearCtx(actx);
    if (P.tab === 'studio') A.renderStudio(actx, S.studio.items, view.k);
    else if (P.tab === 'kolam') A.renderKolam(actx, S.kolam, lat(), view.k, { ghost: true });
    updateCounts();
  }
  function updateCounts() {
    artC.dataset.strokes = S.studio.items.length;
    artC.dataset.copies = A.countCopies(S.studio.items);
    artC.dataset.lines = S.kolam.items.length;
    artC.dataset.mode = P.tab;
  }

  /* ---------------------------------------------------------------- history */
  function snap(m) {
    var d = S[m];
    if (m === 'color') return { tpl: d.tpl, fills: Object.assign({}, d.fills) };
    if (m === 'kolam') return { items: d.items.slice(), g: d.g, n: d.n, ghost: d.ghost ? d.ghost.slice() : null, fold: d.fold };
    return { items: d.items.slice() };
  }
  function pushHist(m, s) { var h = hist[m]; h.u.push(s || snap(m)); if (h.u.length > MAX_UNDO) h.u.shift(); h.r = []; }
  function restore(m, s) { Object.keys(s).forEach(function (k) { S[m][k] = s[k]; }); refresh(); }
  function undo() { var m = P.tab; if (m === 'gallery' || drag) return; var h = hist[m]; if (!h.u.length) return; h.r.push(snap(m)); restore(m, h.u.pop()); }
  function redo() { var m = P.tab; if (m === 'gallery' || drag) return; var h = hist[m]; if (!h.r.length) return; h.u.push(snap(m)); restore(m, h.r.pop()); }
  function refresh() {
    note = '';
    if (P.tab === 'color') renderSvg(); else { drawBgLayer(); drawArt(); }
    syncControls(); renderStatus(); scheduleSave();
  }
  function changed() { note = ''; updateCounts(); syncControls(); renderStatus(); scheduleSave(); }
  function clearDesign() {
    var m = P.tab, d = S[m];
    if (m === 'gallery') return;
    var empty = m === 'color' ? !Object.keys(d.fills).length : !(d.items.length || (d.ghost && d.ghost.length));
    if (empty) return;
    if (!confirm(t(m === 'color' ? 'confirm_clear_fills' : 'confirm_clear'))) return;
    pushHist(m);
    if (m === 'color') d.fills = {}; else { d.items = []; if (m === 'kolam') d.ghost = null; }
    refresh();
  }

  /* ---------------------------------------------------------------- pointer input */
  var drag = null, hover = null, raf = 0;
  function toLogical(e) {
    var r = liveC.getBoundingClientRect();
    return { x: (e.clientX - r.left) / (r.width || 1) * A.W, y: (e.clientY - r.top) / (r.height || 1) * A.W };
  }
  function scheduleLive() { if (!raf) raf = requestAnimationFrame(drawLive); }
  function drawLive() {
    raf = 0;
    clearCtx(lctx);
    if (P.tab === 'studio' && drag && drag.item) {
      var it = drag.item;
      if (it.t === 'erase') {
        lctx.save(); lctx.globalAlpha = 0.55;
        A.drawItem(lctx, { t: 'pen', p: it.p, c: A.bgInfo(S.studio.bg).dark ? '#000000' : '#ffffff', w: it.w, f: it.f, m: it.m }, view.k);
        lctx.restore();
      } else A.drawItem(lctx, it, view.k);
    }
    if (P.tab === 'kolam' && drag && drag.item) {
      var ki = drag.item;
      if (ki.t === 'kl') {
        var pts = ki.p.slice();
        if (!ki.cl && drag.last) pts.push(A.r1(drag.last.x), A.r1(drag.last.y));
        A.drawKolamItem(lctx, { t: 'kl', p: pts, cl: ki.cl, c: ki.c, w: ki.w, f: ki.f }, view.k);
      } else A.drawKolamItem(lctx, ki, view.k);
    }
    var at = drag && drag.last ? drag.last : hover;
    if (at && P.tab === 'kolam' && (P.ktool === 'kline' && P.snap)) {
      var la = lat(), si = A.nearestSnap(la, at.x, at.y, la.d * 0.45);
      if (si >= 0) {
        var s = la.snaps[si];
        lctx.setTransform(view.k, 0, 0, view.k, 0, 0);
        lctx.beginPath(); lctx.arc(s.x, s.y, Math.max(8, la.d * 0.12), 0, Math.PI * 2);
        lctx.strokeStyle = 'rgba(255,200,0,0.95)'; lctx.lineWidth = 3; lctx.stroke();
      }
    }
    if (at && P.tab === 'studio' && P.tool === 'eraser' && !drag) {
      lctx.setTransform(view.k, 0, 0, view.k, 0, 0);
      lctx.beginPath(); lctx.arc(at.x, at.y, ER_W[P.size] / 2, 0, Math.PI * 2);
      lctx.strokeStyle = A.bgInfo(S.studio.bg).dark ? 'rgba(255,255,255,.8)' : 'rgba(30,30,30,.7)'; lctx.lineWidth = 2 / view.k * (view.px / (view.css || 1)); lctx.stroke();
    }
  }

  liveC.addEventListener('pointerdown', function (e) {
    if (drag) { if (e.pointerType === 'pen' && drag.ptype === 'touch') { drag = null; scheduleLive(); } else return; }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try { liveC.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    var pt = toLogical(e), r1 = A.r1;
    drag = { id: e.pointerId, ptype: e.pointerType, last: pt };
    if (P.tab === 'studio') {
      var d = S.studio, base = { f: d.fold, m: d.mirror ? 1 : 0 };
      if (P.tool === 'brush') drag.item = Object.assign({ t: 'pen', p: [r1(pt.x), r1(pt.y)], c: P.color, w: PEN_W[P.size] }, base);
      else if (P.tool === 'eraser') drag.item = Object.assign({ t: 'erase', p: [r1(pt.x), r1(pt.y)], w: ER_W[P.size] }, base);
      else if (P.tool === 'stamp') drag.item = Object.assign({ t: 'stamps', k: P.stamp, p: [r1(pt.x), r1(pt.y)], s: ST_S[P.size], c: P.color }, base);
      else if (P.tool === 'fill') { drag = null; commitStudio(Object.assign({ t: 'fill', x: r1(pt.x), y: r1(pt.y), c: P.color }, base)); return; }
    } else if (P.tab === 'kolam') {
      var la = lat(), K = S.kolam;
      if (P.ktool === 'kline' && P.snap) {
        drag.item = { t: 'kl', p: [], cl: 0, c: P.kcolor, w: K_W[P.size], f: K.fold };
        drag.snaps = [];
        addSnap(pt);
      } else if (P.ktool === 'kline' || P.ktool === 'kpen') {
        drag.item = { t: 'pen', p: [r1(pt.x), r1(pt.y)], c: P.kcolor, w: K_W[P.size], f: K.fold };
      } else if (P.ktool === 'loop') {
        drag = null;
        var dot = A.nearestDot(la, pt.x, pt.y);
        if (dot) commitKolam({ t: 'kl', p: A.loopAround(la, dot), cl: 1, c: P.kcolor, w: K_W[P.size], f: K.fold });
        return;
      } else if (P.ktool === 'paint' || P.ktool === 'kerase') {
        drag.hit = {};
        drag.before = snap('kolam');
        hitKolamAt(pt);
      }
    }
    scheduleLive();
  });
  function addSnap(pt) {
    var la = lat(), si = A.nearestSnap(la, pt.x, pt.y, la.d * 0.42), it = drag.item, sn = drag.snaps;
    if (si < 0 || it.cl) return;
    var n = sn.length;
    if (n && sn[n - 1] === si) return;
    if (n >= 2 && sn[n - 2] === si) { sn.pop(); it.p.splice(-2, 2); return; }   /* moving back undoes the last step */
    if (n >= 3 && sn[0] === si) { it.cl = 1; return; }                          /* back at the start: closed loop */
    sn.push(si); it.p.push(A.r1(la.snaps[si].x), A.r1(la.snaps[si].y));
  }
  function hitKolamAt(pt) {
    var K = S.kolam, i = A.hitKolam(K.items, pt.x, pt.y, Math.max(10, lat().d * 0.18));
    if (i < 0) return;
    if (P.ktool === 'kerase') { K.items.splice(i, 1); drag.changed = true; drawArt(); }
    else if (K.items[i].c !== P.kcolor) { K.items[i] = Object.assign({}, K.items[i], { c: P.kcolor }); drag.changed = true; drawArt(); }
  }
  liveC.addEventListener('pointermove', function (e) {
    if (!drag) { hover = (e.pointerType !== 'touch') ? toLogical(e) : null; if ((P.tab === 'studio' && P.tool === 'eraser') || (P.tab === 'kolam' && P.ktool === 'kline')) scheduleLive(); return; }
    if (e.pointerId !== drag.id) return;
    var evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
    if (!evs.length) evs = [e];
    var minD = 1.6 * A.W / (view.css || 500);
    evs.forEach(function (ev) {
      var pt = toLogical(ev), it = drag.item;
      drag.last = pt;
      if (!it) { if (P.tab === 'kolam' && (P.ktool === 'paint' || P.ktool === 'kerase')) hitKolamAt(pt); return; }
      if (it.t === 'kl') { addSnap(pt); return; }
      var n = it.p.length;
      if (it.t === 'stamps') {
        var gap = it.s * 1.15;
        if (Math.hypot(pt.x - it.p[n - 2], pt.y - it.p[n - 1]) >= gap) it.p.push(A.r1(pt.x), A.r1(pt.y));
        return;
      }
      if (Math.hypot(pt.x - it.p[n - 2], pt.y - it.p[n - 1]) < minD) return;
      it.p.push(A.r1(pt.x), A.r1(pt.y));
    });
    scheduleLive();
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag; drag = null;
    if (P.tab === 'studio' && d.item) commitStudio(d.item);
    else if (P.tab === 'kolam') {
      if (d.item && d.item.t === 'kl') { if (d.item.p.length >= 4) commitKolam(d.item); }
      else if (d.item) commitKolam(d.item);
      else if (d.changed) { pushHist('kolam', d.before); changed(); }
    }
    if (e && e.pointerType === 'touch') hover = null;
    scheduleLive();
  }
  liveC.addEventListener('pointerup', endDrag);
  liveC.addEventListener('pointercancel', endDrag);
  liveC.addEventListener('lostpointercapture', endDrag);
  liveC.addEventListener('pointerleave', function () { if (!drag && hover) { hover = null; scheduleLive(); } });
  liveC.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function commitStudio(it) {
    pushHist('studio');
    S.studio.items.push(it);
    A.drawItem(actx, it, view.k);      /* only the new stroke is drawn: no full redraw */
    changed();
  }
  function commitKolam(it) {
    pushHist('kolam');
    S.kolam.items.push(it);
    A.drawKolamItem(actx, it, view.k);
    changed();
  }

  /* ---------------------------------------------------------------- kolam: dots, starters, surprise */
  function setGrid(g, n) {
    var K = S.kolam, la = A.lattice(g, n);
    if (la.g === K.g && la.n === K.n) { syncControls(); return; }
    if ((K.items.length || (K.ghost && K.ghost.length)) && !confirm(t('confirm_new_grid'))) { syncControls(); return; }
    pushHist('kolam');
    K.g = la.g; K.n = la.n; K.items = []; K.ghost = null;
    if (A.folds(K.g).indexOf(K.fold) < 0) K.fold = 1;
    refresh();
  }
  function placeLines(items, g, n, msgKey) {
    var K = S.kolam;
    pushHist('kolam');
    K.g = g; K.n = n;
    if (A.folds(g).indexOf(K.fold) < 0) K.fold = 1;
    if (P.smode === 'trace') { K.ghost = items; K.items = []; }
    else { K.items = items; K.ghost = null; }
    refresh();
    if (msgKey) { note = t(msgKey); renderStatus(); }
  }
  function useStarter(id) {
    var s = A.starter(id);
    var items = s.items.map(function (x) { return Object.assign({}, x, { c: P.smode === 'use' ? P.kcolor : x.c }); });
    placeLines(items, s.g, s.n, items.length === 1 ? 'one_line' : '');
  }
  function surprise() {
    var K = S.kolam, seed = forcedSeed !== null ? forcedSeed : (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    var items = A.surprise(K.g, K.n, seed, P.kcolor, K_W[P.size]);
    placeLines(items, K.g, K.n, items.length === 1 ? 'one_line' : '');
  }

  /* ---------------------------------------------------------------- colour-in (SVG) */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function renderSvg() {
    var d = S.color, regs = A.TEMPLATES[d.tpl], n = 0;
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 1000 1000'); svg.setAttribute('id', 'rm-svg');
    svg.setAttribute('role', 'group'); svg.setAttribute('aria-label', t('svg_label'));
    regs.forEach(function (r) {
      var p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', r.d); p.setAttribute('data-r', r.id); p.setAttribute('data-g', r.g);
      p.setAttribute('fill', d.fills[r.id] || '#ffffff');
      if (r.g !== 'page') { p.setAttribute('stroke', '#2b2118'); p.setAttribute('stroke-width', '3'); p.setAttribute('stroke-linejoin', 'round'); }
      p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button');
      p.setAttribute('aria-label', r.g === 'page' ? t('region_bg') : t('region_n', { n: ++n }));
      svg.appendChild(p);
    });
    svgWrap.innerHTML = ''; svgWrap.appendChild(svg);
    svg.dataset.filled = Object.keys(d.fills).length;
  }
  function fillRegion(path) {
    var d = S.color, id = path.getAttribute('data-r'), g = path.getAttribute('data-g'), c = P.ccolor;
    var targets = P.symFill && g !== 'page' ? $$('path[data-g="' + g + '"]', svgWrap) : [path];
    if (targets.every(function (p) { return d.fills[p.getAttribute('data-r')] === c; })) return;
    pushHist('color');
    targets.forEach(function (p) { d.fills[p.getAttribute('data-r')] = c; p.setAttribute('fill', c); });
    void id;
    $('#rm-svg').dataset.filled = Object.keys(d.fills).length;
    changed();
  }
  svgWrap.addEventListener('click', function (e) { var p = e.target.closest && e.target.closest('path[data-r]'); if (p) fillRegion(p); });
  svgWrap.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var p = e.target.closest && e.target.closest('path[data-r]'); if (p) { e.preventDefault(); fillRegion(p); }
  });
  function setTemplate(id) {
    var d = S.color;
    if (d.tpl === id) return;
    pushHist('color');
    d.tpl = id; d.fills = {}; d.sid = null;
    $('#rm-name').value = '';
    refresh();
  }

  /* ---------------------------------------------------------------- export: picture of any design */
  function renderDesign(m, d, px, outline) {
    var cv = document.createElement('canvas'); cv.width = cv.height = px;
    var c = cv.getContext('2d'), k = px / A.W;
    if (m === 'color') { A.renderTemplate(c, d.tpl, d.fills, k, { outline: outline }); return cv; }
    c.setTransform(k, 0, 0, k, 0, 0);
    if (outline) { c.fillStyle = '#ffffff'; c.fillRect(0, 0, A.W, A.W); } else A.drawBg(c, d.bg);
    var art = document.createElement('canvas'); art.width = art.height = px;
    var ac = art.getContext('2d', { willReadFrequently: true });
    if (m === 'studio') A.renderStudio(ac, d.items, k, { outline: outline });
    else A.renderKolam(ac, d, A.lattice(d.g, d.n), k, { outline: outline });
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(art, 0, 0);
    return cv;
  }
  function stamp() { var d = new Date(), z = function (v) { return (v < 10 ? '0' : '') + v; }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  function fileBase() {
    var nm = ($('#rm-name').value || '').trim().replace(/[\\/:*?"<>|\u0000-\u001f︀-️]+/g, '').replace(/\s+/g, '-').slice(0, 30);
    return (nm || { studio: 'rangoli', kolam: 'kolam', color: 'colouring' }[mode()]) + '-' + stamp();
  }
  var busy = false;
  function downloadPng() {
    if (busy || P.tab === 'gallery') return;
    busy = true;
    var cv = renderDesign(mode(), doc(), EXPORT_PX, false), name = fileBase() + '.png';
    cv.toBlob(function (b) { busy = false; if (b) { EDU.download(name, b); EDU.toast(t('png_done')); } }, 'image/png');
    setTimeout(function () { busy = false; }, 4000);
  }
  function fillPrint(outline) {
    var m = mode(), cv = renderDesign(m, doc(), EXPORT_PX, outline);
    var img = $('#rm-print-img');
    img.src = cv.toDataURL('image/png');
    img.alt = t('app_title');
    var nm = ($('#rm-name').value || '').trim();
    $('#rm-print-cap').textContent = (nm ? nm + ' · ' : '') + t(outline ? 'print_cap_outline' : 'print_cap_color');
    $('#rm-print').dataset.kind = outline ? 'outline' : 'color';
    return img;
  }
  var printing = false;
  function printDesign(outline) {
    if (P.tab === 'gallery') return;
    var img = fillPrint(outline);
    printing = true;
    var go = function () { setTimeout(function () { window.print(); }, 60); };
    if (img.complete && img.naturalWidth) go(); else img.onload = go;
  }
  /* the browser's own Print (Ctrl+P) prints the colour picture instead of a blank page */
  window.addEventListener('beforeprint', function () { if (!printing) fillPrint(false); });
  window.addEventListener('afterprint', function () { printing = false; });

  /* ---------------------------------------------------------------- My designs (gallery) */
  function thumbOf(m, d) { try { return renderDesign(m, d, 180, false).toDataURL('image/jpeg', 0.82); } catch (e) { return ''; } }
  function cloneDoc(m, d) { return cleanDoc(m, JSON.parse(JSON.stringify(d))); }
  function saveDesign() {
    var m = mode(), d = doc();
    if (P.tab === 'gallery') return;
    var nm = ($('#rm-name').value || '').trim().slice(0, 40);
    var existing = d.sid ? designs.filter(function (x) { return x.id === d.sid; })[0] : null;
    if (!existing && designs.length >= MAX_DESIGNS) { EDU.toast(t('gallery_full')); say(t('gallery_full')); return; }
    var copy = cloneDoc(m, d);
    if (existing) {
      existing.doc = copy; existing.at = Date.now(); existing.thumb = thumbOf(m, copy); existing.name = nm || existing.name;
      copy.sid = existing.id;
    } else {
      var id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      nm = nm || t('design_n', { n: designs.length + 1 });
      d.sid = id; copy.sid = id;
      designs.unshift({ id: id, name: nm, mode: m, at: Date.now(), doc: copy, thumb: thumbOf(m, copy) });
      $('#rm-name').value = nm;
    }
    if (saveDesigns()) { say(t(existing ? 'updated_ok' : 'saved_ok')); EDU.toast(t(existing ? 'updated_ok' : 'saved_ok')); }
    scheduleSave();
  }
  function say(msg) { note = msg; renderStatus(); }
  function fmtDate(ms) {
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', numberingSystem: 'latn' }).format(new Date(ms)); }
    catch (e) { return new Date(ms).toLocaleString(); }
  }
  function renderGallery() {
    var box = $('#rm-gallery'); box.innerHTML = '';
    $('#rm-gempty').hidden = designs.length > 0;
    $('#rm-gcount').textContent = t('gallery_count', { n: EDU.fmt(designs.length), m: EDU.fmt(MAX_DESIGNS) });
    designs.forEach(function (x) {
      var card = EDU.el('div', { class: 'card flat rm-design', 'data-id': x.id },
        x.thumb ? EDU.el('img', { src: x.thumb, alt: t('thumb_alt', { name: x.name }) }) : null,
        EDU.el('div', { class: 'rm-dname no-i18n', text: x.name }),
        EDU.el('div', { class: 'row small muted' }, EDU.el('span', { class: 'badge', text: t('tab_' + x.mode) }), EDU.el('span', { class: 'no-i18n', text: fmtDate(x.at) })),
        EDU.el('div', { class: 'row' },
          EDU.el('button', { type: 'button', class: 'btn btn-primary btn-sm', 'data-act': 'open', text: t('open'), onclick: function () { openDesign(x.id); } }),
          EDU.el('button', { type: 'button', class: 'btn btn-sm', 'data-act': 'dup', text: t('duplicate'), onclick: function () { dupDesign(x.id); } }),
          EDU.el('button', { type: 'button', class: 'btn btn-sm btn-danger', 'data-act': 'del', text: t('delete'), onclick: function () { delDesign(x.id); } })));
      box.appendChild(card);
    });
  }
  function openDesign(id) {
    var x = designs.filter(function (z) { return z.id === id; })[0]; if (!x) return;
    pushHist(x.mode);
    S[x.mode] = cloneDoc(x.mode, x.doc); S[x.mode].sid = x.id;
    setTab(x.mode);
    $('#rm-name').value = x.name;
    refresh();
    say(t('opened', { name: x.name }));
  }
  function dupDesign(id) {
    var x = designs.filter(function (z) { return z.id === id; })[0]; if (!x) return;
    if (designs.length >= MAX_DESIGNS) { EDU.toast(t('gallery_full')); return; }
    var nid = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), copy = cloneDoc(x.mode, x.doc);
    copy.sid = nid;
    designs.splice(designs.indexOf(x) + 1, 0, { id: nid, name: t('copy_of', { name: x.name }).slice(0, 40), mode: x.mode, at: Date.now(), doc: copy, thumb: x.thumb });
    saveDesigns(); renderGallery();
  }
  function delDesign(id) {
    var x = designs.filter(function (z) { return z.id === id; })[0]; if (!x) return;
    if (!confirm(t('confirm_delete', { name: x.name }))) return;
    designs.splice(designs.indexOf(x), 1);
    ['studio', 'kolam', 'color'].forEach(function (m) { if (S[m].sid === id) S[m].sid = null; });
    saveDesigns(); renderGallery(); scheduleSave();
  }

  /* ---------------------------------------------------------------- "what is symmetry" pictures */
  function drawDemos() {
    function leafPath(deg) {
      var a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      function q(x, y) { return (60 + x * ca - y * sa).toFixed(1) + ' ' + (60 + x * sa + y * ca).toFixed(1); }
      return 'M' + q(0, -8) + 'C' + q(18, -16) + ' ' + q(26, -38) + ' ' + q(4, -50) + 'C' + q(6, -36) + ' ' + q(-2, -20) + ' ' + q(0, -8) + 'Z';
    }
    var rot = '', mir = '';
    for (var i = 0; i < 6; i++) rot += '<path d="' + leafPath(i * 60) + '" fill="' + (i ? '#f77f00' : '#d62839') + '"/>';
    for (var j = 0; j < 4; j++) {
      mir += '<path d="' + leafPath(j * 90) + '" fill="#2a9d3f"/>';
      mir += '<path d="' + leafPath(j * 90) + '" fill="#2a9d3f" transform="translate(120 0) scale(-1 1)"/>';
    }
    mir += '<line x1="60" y1="4" x2="60" y2="116" stroke="#1e6fd9" stroke-width="2.5" stroke-dasharray="6 5"/>';
    mir += '<line x1="4" y1="60" x2="116" y2="60" stroke="#1e6fd9" stroke-width="2.5" stroke-dasharray="6 5"/>';
    rot += '<path d="M60 20 A40 40 0 0 1 94.6 40" fill="none" stroke="#1e6fd9" stroke-width="3" marker-end="url(#rm-arr)"/>';
    $('#rm-demo-rot').innerHTML = '<defs><marker id="rm-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#1e6fd9"/></marker></defs>' +
      '<circle cx="60" cy="60" r="56" fill="#fff7ea" stroke="#e3d8c9"/>' + rot + '<circle cx="60" cy="60" r="5" fill="#3a2f9e"/>';
    $('#rm-demo-mir').innerHTML = '<circle cx="60" cy="60" r="56" fill="#fff7ea" stroke="#e3d8c9"/>' + mir + '<circle cx="60" cy="60" r="5" fill="#3a2f9e"/>';
  }

  /* ---------------------------------------------------------------- buttons, keys, resize */
  $('#rm-undo').addEventListener('click', undo);
  $('#rm-redo').addEventListener('click', redo);
  $('#rm-clear').addEventListener('click', clearDesign);
  $('#rm-fs').addEventListener('click', function () { EDU.fullscreen(work); });
  $('#rm-surprise').addEventListener('click', surprise);
  $('#rm-ghostoff').addEventListener('click', function () { if (!S.kolam.ghost) return; pushHist('kolam'); S.kolam.ghost = null; refresh(); });
  $('#rm-save').addEventListener('click', saveDesign);
  $('#rm-png').addEventListener('click', downloadPng);
  $('#rm-print-c').addEventListener('click', function () { printDesign(false); });
  $('#rm-print-o').addEventListener('click', function () { printDesign(true); });
  $('#rm-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['cur', 'prefs', 'designs'].forEach(function (k) { store.remove(k); });
    S = defaults(); designs = []; hist = { studio: { u: [], r: [] }, kolam: { u: [], r: [] }, color: { u: [], r: [] } };
    latCache = null; setTab('studio');
  });
  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    var tg = e.target, tn = tg && tg.tagName;
    if (tn === 'INPUT' || tn === 'TEXTAREA' || tn === 'SELECT' || (tg && tg.isContentEditable)) return;
    if (e.code === 'KeyZ' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey)) { e.preventDefault(); redo(); }
  });
  var rz = 0;
  function onResize() { if (rz) return; rz = requestAnimationFrame(function () { rz = 0; fit(false); }); }
  window.addEventListener('resize', onResize);
  document.addEventListener('fullscreenchange', function () { setTimeout(function () { fit(true); }, 60); });
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(stage);
  window.addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', function () { if (document.hidden) saveNow(); });

  EDU.onLang(function () {
    relabel();
    if (P.tab === 'gallery') renderGallery(); else if (P.tab === 'color') renderSvg();
    syncControls(); renderStatus(); renderHint();
  });

  /* hooks for the automated test (they never change normal use) */
  window.__gameTest = { seed: function (n) { forcedSeed = n === null ? null : (n >>> 0); } };
  window.RANGOLI = {
    renderPNG: function (outline) { return renderDesign(mode(), doc(), 600, !!outline).toDataURL('image/png'); },
    state: function () { return JSON.parse(JSON.stringify(S)); },
    designs: function () { return designs.length; }
  };

  buildStatic();
  relabel();
  setTab(P.tab);
})();
