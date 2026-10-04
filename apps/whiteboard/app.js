/* Digital Whiteboard: UI, pointer input, pages, undo/redo, saving, files.
   Drawing itself lives in board.js (window.WBDraw). */
(function () {
  'use strict';
  var D = window.WBDraw, t = EDU.t, $ = EDU.$;
  var store = EDU.store('whiteboard');
  var MAX_PAGES = 50, MAX_UNDO = 80;
  var PEN_W = [3, 6, 12, 24], HL_W = [18, 28, 42, 66], ER_R = [10, 22, 42, 72], TEXT_S = [28, 42, 64, 96], DOT = [4, 8, 13, 20];

  var ICON = {
    pen: '<path d="M4 20l4.5-1L19 8.5 15.5 5 5 15.5 4 20z"/><path d="M13.5 7l3.5 3.5"/>',
    hl: '<path d="M14 4l6 6-8.5 8.5H6V13z"/><path d="M6 18.5L3.5 21H9"/><path d="M10 8l6 6"/>',
    eraser: '<path d="M9 20h11"/><path d="M4.6 15.4l9.8-9.8a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 19H8.2z"/><path d="M9 11l5 5"/>',
    line: '<path d="M5 19L19 5"/>',
    arrow: '<path d="M5 19L19 5"/><path d="M10 5h9v9"/>',
    rect: '<rect x="3.5" y="6" width="17" height="12" rx="1"/>',
    circle: '<circle cx="12" cy="12" r="8.5"/>',
    text: '<path d="M5 7V4.5h14V7"/><path d="M12 4.5v15"/><path d="M9 19.5h6"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    clear: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    png: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    hide: '<path d="M6 15l6-6 6 6"/>',
    prev: '<path d="M15 5l-7 7 7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    add: '<path d="M12 5v14M5 12h14"/>',
    del: '<path d="M4 7h16"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/><path d="M9.5 12l5 5M14.5 12l-5 5"/>'
  };
  function svg(name, cls) { return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + ICON[name] + '</svg>'; }

  var TOOLS = [
    { id: 'pen', key: 'p', label: 'tool_pen' }, { id: 'hl', key: 'h', label: 'tool_hl' },
    { id: 'eraser', key: 'e', label: 'tool_eraser' }, { id: 'line', key: 'l', label: 'tool_line' },
    { id: 'arrow', key: 'a', label: 'tool_arrow' }, { id: 'rect', key: 'r', label: 'tool_rect' },
    { id: 'circle', key: 'c', label: 'tool_circle' }, { id: 'text', key: 't', label: 'tool_text' }
  ];
  var COLOR_KEYS = ['col_0', 'col_1', 'col_2', 'col_3', 'col_4', 'col_5', 'col_6', 'col_7'];
  var SIZE_KEYS = ['size_1', 'size_2', 'size_3', 'size_4'];
  var BOARD_KEYS = { white: 'board_white', green: 'board_green', black: 'board_black' };

  EDU.init({ slug: 'whiteboard', title: 'app_title', wide: true });

  /* ---------------- state ---------------- */
  var prefs = store.get('prefs', null) || {};
  prefs = {
    tool: TOOLS.some(function (x) { return x.id === prefs.tool; }) ? prefs.tool : 'pen',
    color: (/^p[0-7]$/.test(prefs.color) || prefs.color === 'custom') ? prefs.color : 'p0',
    hlColor: (/^p[0-7]$/.test(prefs.hlColor) || prefs.hlColor === 'custom') ? prefs.hlColor : 'p6',   /* highlighter starts yellow */
    custom: /^#[0-9a-f]{6}$/i.test(prefs.custom) ? prefs.custom : '#e11d48',
    size: [0, 1, 2, 3].indexOf(prefs.size) >= 0 ? prefs.size : 1,
    hidden: prefs.hidden === true
  };
  var saved = store.get('board', null);
  /* a brand-new board on a phone held upright starts with a tall page, and in the dark theme it
     starts as a blackboard (no glaring white rectangle at night) */
  var portraitPhone = (window.innerWidth || 1000) < 700 && (window.innerHeight || 0) > (window.innerWidth || 0);
  var pages = (saved && D.cleanPages(saved.pages, MAX_PAGES)) ||
    [D.newPage({ shape: portraitPhone ? 'tall' : 'wide', board: EDU.theme() === 'dark' ? 'black' : 'white' })];
  var cur = saved ? EDU.clamp(saved.cur | 0, 0, pages.length - 1) : 0;
  var hist = {};                       /* page id → { u: [snapshots], r: [snapshots] } (memory only) */
  var view = { cssW: 0, cssH: 0, dpr: 1, scale: 1 };
  var drag = null, hover = null, textAt = null, raf = 0;

  var wb = $('#wb'), stage = $('#wb-stage'), cwrap = $('#wb-cwrap'), base = $('#wb-base'), live = $('#wb-live');
  var ta = $('#wb-text'), bctx = base.getContext('2d'), lctx = live.getContext('2d');
  var btn = {};

  function page() { return pages[cur]; }
  function colorKey() { return prefs.tool === 'hl' ? 'hlColor' : 'color'; }    /* pen and highlighter keep their own colour */
  function curColor() { var c = prefs[colorKey()]; return c === 'custom' ? prefs.custom : c; }
  function savePrefs() { store.set('prefs', prefs); }
  function r1(v) { return Math.round(v * 10) / 10; }

  /* ---------------- toolbar ---------------- */
  function ib(id, icon, key, opts) {
    opts = opts || {};
    var b = EDU.el('button', { type: 'button', class: 'wb-ib' + (opts.cls ? ' ' + opts.cls : ''), id: id,
      'data-i18n-aria-label': key, 'data-i18n-title': key, 'aria-label': t(key), title: t(key) });
    b.innerHTML = svg(icon, opts.flip ? 'flip-rtl' : '');
    if (opts.label) b.appendChild(EDU.el('span', { class: 'wb-lbl', i18n: key, 'aria-hidden': 'true' }));
    if (opts.onclick) b.addEventListener('click', opts.onclick);
    return b;
  }
  function fill(sel, icon, opts) { var b = $(sel); b.innerHTML = svg(icon, opts && opts.flip ? 'flip-rtl' : ''); return b; }

  function buildToolbar() {
    var tools = $('#wb-tools');
    TOOLS.forEach(function (x) {
      var b = ib('tool-' + x.id, x.id, x.label, { label: true, onclick: function () { setTool(x.id); } });
      b.dataset.tool = x.id;
      b.setAttribute('aria-keyshortcuts', x.key.toUpperCase());
      tools.appendChild(b);
    });

    var colors = $('#wb-colors');
    for (var i = 0; i < 8; i++) {
      (function (i) {
        var b = EDU.el('button', { type: 'button', class: 'wb-sw', 'data-color': 'p' + i });
        b.addEventListener('click', function () { setColor('p' + i); });
        colors.appendChild(b);
      })(i);
    }
    var custom = EDU.el('label', { class: 'wb-custom', id: 'wb-custom', 'data-i18n-title': 'col_custom', title: t('col_custom') },
      EDU.el('input', { type: 'color', id: 'wb-custom-in', value: prefs.custom, 'data-i18n-aria-label': 'col_custom', 'aria-label': t('col_custom') }),
      EDU.el('i'));
    colors.appendChild(custom);
    $('#wb-custom-in').addEventListener('input', function (e) {
      if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { prefs.custom = e.target.value; setColor('custom'); }
    });
    $('#wb-custom-in').addEventListener('click', function () { if (prefs[colorKey()] !== 'custom') setColor('custom'); });
    /* while the text box is open, a colour or size click restyles the text being typed: keep the
       focus (and the typing) in the box instead of finishing it in the old colour */
    ['#wb-colors', '#wb-sizes'].forEach(function (sel) {
      $(sel).addEventListener('mousedown', function (e) { if (textAt && e.target.closest('button')) e.preventDefault(); });
    });

    var sizes = $('#wb-sizes');
    SIZE_KEYS.forEach(function (k, i) {
      var b = EDU.el('button', { type: 'button', class: 'wb-ib', 'data-size': i, 'data-i18n-aria-label': k, 'data-i18n-title': k, 'aria-label': t(k), title: t(k) },
        EDU.el('span', { class: 'wb-dot', style: { width: DOT[i] + 'px', height: DOT[i] + 'px' } }));
      b.addEventListener('click', function () { setSize(i); });
      sizes.appendChild(b);
    });

    var sel = $('#wb-bg');
    D.BGS.forEach(function (bg) { sel.appendChild(EDU.el('option', { value: bg, i18n: 'bg_' + bg })); });
    sel.addEventListener('change', function () { setPageProp('bg', sel.value); });

    var boards = $('#wb-boards');
    Object.keys(D.BOARDS).forEach(function (k) {
      var b = EDU.el('button', { type: 'button', class: 'wb-board-sw', 'data-board': k, style: { background: D.BOARDS[k].fill },
        'data-i18n-aria-label': BOARD_KEYS[k], 'data-i18n-title': BOARD_KEYS[k], 'aria-label': t(BOARD_KEYS[k]), title: t(BOARD_KEYS[k]) });
      b.addEventListener('click', function () { setPageProp('board', k); });
      boards.appendChild(b);
    });

    var acts = $('#wb-actions');
    btn.undo = ib('wb-undo', 'undo', 'undo', { label: true, flip: true, onclick: undo });
    btn.redo = ib('wb-redo', 'redo', 'redo', { label: true, flip: true, onclick: redo });
    btn.clear = ib('wb-clear', 'clear', 'clear_page', { label: true, cls: 'wb-danger', onclick: clearPage });
    btn.png = ib('wb-png', 'png', 'save_png', { label: true, onclick: savePng });
    btn.full = ib('wb-full', 'full', 'fullscreen', { label: true, onclick: toggleFull });
    btn.hide = ib('wb-hide', 'hide', 'hide_tools', { label: true, onclick: function () { setHidden(true); } });
    [btn.undo, btn.redo, btn.clear, btn.png, btn.full, btn.hide].forEach(function (b) { acts.appendChild(b); });

    fill('#wb-prev', 'prev', { flip: true }).addEventListener('click', function () { goPage(cur - 1); });
    fill('#wb-next', 'next', { flip: true }).addEventListener('click', function () { goPage(cur + 1); });
    fill('#wb-add', 'add').addEventListener('click', addPage);
    fill('#wb-del', 'del').addEventListener('click', delPage);
    $('#wb-show').addEventListener('click', function () { setHidden(false); });
    EDU.$$('#wb-shape button').forEach(function (b) { b.addEventListener('click', function () { setPageProp('shape', b.dataset.shape); }); });
    $('#wb-print-btn').addEventListener('click', printAll);
    $('#wb-export').addEventListener('click', exportBoard);
    $('#wb-import').addEventListener('click', importBoard);
    $('#wb-new').addEventListener('click', newBoard);
  }

  function renderColors() {
    var pg = page(), sel = prefs[colorKey()], marker = prefs.tool === 'hl';
    EDU.$$('#wb-colors .wb-sw').forEach(function (b, i) {
      var key = (i === 0 && D.isDark(pg)) ? 'col_0d' : COLOR_KEYS[i];
      b.style.background = D.color('p' + i, pg, marker);
      b.setAttribute('aria-label', t(key)); b.title = t(key);
      b.setAttribute('aria-pressed', String(sel === 'p' + i));
    });
    var c = $('#wb-custom');
    c.setAttribute('data-on', String(sel === 'custom'));
    c.querySelector('i').style.background = prefs.custom;
    $('#wb-custom-in').value = prefs.custom;
  }

  function syncControls() {
    var pg = page();
    wb.dataset.tool = prefs.tool;
    EDU.$$('#wb-tools .wb-ib').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tool === prefs.tool)); });
    EDU.$$('#wb-sizes .wb-ib').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.size === prefs.size)); });
    EDU.$$('#wb-boards button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.board === pg.board)); });
    EDU.$$('#wb-shape button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.shape === pg.shape)); });
    $('#wb-bg').value = pg.bg;
    renderColors();
    wb.classList.toggle('wb-notools', prefs.hidden);
    $('#wb-show').hidden = !prefs.hidden;
    btn.hide.setAttribute('aria-pressed', 'false');
  }

  function setTool(id) { commitText(); prefs.tool = id; savePrefs(); syncControls(); hover = null; schedule(); }
  function setColor(c) {
    if (prefs.tool === 'eraser') { prefs.tool = 'pen'; syncControls(); }
    prefs[colorKey()] = c; savePrefs(); renderColors();
    if (textAt) { textAt.color = curColor(); positionText(); }
  }
  function setSize(i) {
    prefs.size = i; savePrefs(); syncControls(); schedule();
    if (textAt) { textAt.size = TEXT_S[i]; positionText(); }
  }
  function setHidden(h) {
    commitText(); prefs.hidden = h; savePrefs(); syncControls(); fit(true);
    (h ? $('#wb-show') : btn.hide).focus();
  }

  /* ---------------- canvas sizing + drawing ---------------- */
  function isFull() { return wb.classList.contains('wb-full'); }
  function fit(force) {
    var S = D.dims(page());
    var availW = stage.clientWidth || 300;
    var availH;
    if (isFull()) availH = stage.clientHeight || window.innerHeight;
    else {
      /* keep the toolbar and the whole board on one screen (below the sticky header) */
      var top = document.querySelector('.edu-top'), bar = $('#wb-bar');
      var barH = prefs.hidden || !bar ? 0 : bar.offsetHeight;
      /* a phone's toolbar wraps into 5 rows: counting all of it would shrink the board to a stamp on a
         small (360 x 640) phone, so reserve room for about two rows and let the rest scroll */
      if ((window.innerWidth || 1000) < 761) barH = Math.min(barH, 100);
      var used = (top ? top.offsetHeight : 0) + barH + 40;
      availH = Math.max(240, (window.innerHeight || 700) - used);
    }
    var w = Math.max(120, Math.floor(Math.min(availW, availH * S.w / S.h)));
    var h = Math.round(w * S.h / S.w);
    var dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
    if (!force && w === view.cssW && h === view.cssH && dpr === view.dpr) return;
    view = { cssW: w, cssH: h, dpr: dpr, scale: w / S.w };
    cwrap.style.width = w + 'px'; cwrap.style.height = h + 'px';
    [base, live].forEach(function (c) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); });
    redraw();
    positionText();
  }
  function setXf(ctx) { var k = view.scale * view.dpr; ctx.setTransform(k, 0, 0, k, 0, 0); }
  function clearCtx(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
  function redraw() {
    clearCtx(bctx); setXf(bctx);
    D.render(bctx, page());
    cwrap.style.background = D.BOARDS[page().board].fill;
    wb.dataset.count = page().s.length;
    schedule();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(drawLive); }
  function drawLive() {
    raf = 0;
    clearCtx(lctx); setXf(lctx);
    if (drag && drag.stroke) D.drawStroke(lctx, drag.stroke, page());
    var er = drag ? drag.tool === 'eraser' : prefs.tool === 'eraser';
    var at = drag && drag.last ? drag.last : hover;
    if (er && at) {
      var r = ER_R[prefs.size], dk = D.isDark(page());
      lctx.save();
      lctx.beginPath(); lctx.arc(at.x, at.y, r, 0, Math.PI * 2);
      lctx.fillStyle = dk ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.06)'; lctx.fill();
      lctx.lineWidth = 2 / view.scale; lctx.strokeStyle = dk ? 'rgba(255,255,255,.8)' : 'rgba(30,30,30,.7)'; lctx.stroke();
      lctx.restore();
    }
  }

  /* ---------------- history (undo / redo) ---------------- */
  function H() { var id = page().id; return hist[id] || (hist[id] = { u: [], r: [] }); }
  function snapshot() { var p = page(); return { s: p.s.slice(), bg: p.bg, board: p.board, shape: p.shape }; }
  function pushHistory(snap) { var h = H(); h.u.push(snap || snapshot()); if (h.u.length > MAX_UNDO) h.u.shift(); h.r = []; }
  function restore(snap) {
    var p = page(), reshape = p.shape !== snap.shape;
    p.s = snap.s.slice(); p.bg = snap.bg; p.board = snap.board; p.shape = snap.shape;
    if (reshape) fit(true); else redraw();
    changed();
  }
  /* (ignored while a pen or the eraser is still on the board, so history never mixes two states) */
  function undo() { if (drag) return; commitText(); var h = H(); if (!h.u.length) return; h.r.push(snapshot()); restore(h.u.pop()); }
  function redo() { if (drag) return; commitText(); var h = H(); if (!h.r.length) return; h.u.push(snapshot()); restore(h.r.pop()); }
  function updateUndo() {
    var h = H();
    btn.undo.disabled = !h.u.length; btn.redo.disabled = !h.r.length;
    btn.clear.disabled = !page().s.length;
  }
  /* call after every change of the current page */
  function changed() {
    wb.dataset.count = page().s.length;
    syncControls(); updateUndo(); scheduleSave(); scheduleThumb(page().id);
  }
  function commit(s) {
    pushHistory();
    page().s.push(s);
    D.drawStroke(bctx, s, page());
    changed();
  }
  function setPageProp(prop, val) {
    commitText();
    var p = page();
    if (p[prop] === val) return;
    pushHistory();
    p[prop] = val;
    if (prop === 'shape') fit(true); else redraw();
    changed();
  }
  function clearPage() {
    commitText();
    if (!page().s.length) return;
    if (!confirm(t('confirm_clear'))) return;
    pushHistory(); page().s = []; redraw(); changed();
  }

  /* ---------------- pointer input (mouse, touch, stylus) ---------------- */
  function toLogical(e) {
    var r = live.getBoundingClientRect(), S = D.dims(page());
    return { x: (e.clientX - r.left) / (r.width || 1) * S.w, y: (e.clientY - r.top) / (r.height || 1) * S.h };
  }
  function constrain(s, x, y) {
    var x0 = s.p[0], y0 = s.p[1], dx = x - x0, dy = y - y0;
    if (s.t === 'line' || s.t === 'arrow') {
      var a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4), L = Math.hypot(dx, dy);
      return { x: x0 + L * Math.cos(a), y: y0 + L * Math.sin(a) };
    }
    var d = Math.max(Math.abs(dx), Math.abs(dy));
    return { x: x0 + (dx < 0 ? -d : d), y: y0 + (dy < 0 ? -d : d) };
  }
  function eraseAt(ax, ay, bx, by) {
    var r = ER_R[prefs.size], p = page(), dist = Math.hypot(bx - ax, by - ay);
    var steps = Math.max(1, Math.ceil(dist / (r / 2))), hitAny = false;
    for (var k = 0; k <= steps; k++) {
      var x = ax + (bx - ax) * k / steps, y = ay + (by - ay) * k / steps;
      for (var i = p.s.length - 1; i >= 0; i--) {
        if (D.hit(p.s[i], x, y, r)) { p.s.splice(i, 1); hitAny = true; }
      }
    }
    if (hitAny) { drag.changed = true; clearCtx(bctx); setXf(bctx); D.render(bctx, p); wb.dataset.count = p.s.length; }
  }

  live.addEventListener('pointerdown', function (e) {
    if (drag) {
      if (e.pointerType === 'pen' && drag.ptype === 'touch') { drag = null; schedule(); }   /* stylus wins over a resting palm */
      else return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    if (textAt) { commitText(); if (prefs.tool === 'text') return; }
    var pt = toLogical(e);
    var tool = (e.pointerType === 'pen' && (e.button === 5 || (e.buttons & 32))) ? 'eraser' : prefs.tool;
    try { live.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (tool === 'text') { drag = { id: e.pointerId, ptype: e.pointerType, tool: 'text', at: pt }; return; }   /* the box opens on pointerup */
    drag = { id: e.pointerId, ptype: e.pointerType, tool: tool, last: pt };
    if (tool === 'pen' || tool === 'hl') {
      drag.stroke = { t: tool, c: curColor(), w: (tool === 'hl' ? HL_W : PEN_W)[prefs.size], p: [r1(pt.x), r1(pt.y)] };
      if (tool === 'pen' && e.pointerType === 'pen' && e.pressure > 0) drag.stroke.pr = [Math.round(e.pressure * 100)];
    } else if (tool === 'eraser') {
      drag.before = snapshot(); drag.changed = false;
      eraseAt(pt.x, pt.y, pt.x, pt.y);
    } else {
      drag.stroke = { t: tool === 'circle' ? 'ellipse' : tool, c: curColor(), w: PEN_W[prefs.size], p: [r1(pt.x), r1(pt.y), r1(pt.x), r1(pt.y)] };
    }
    schedule();
  });

  live.addEventListener('pointermove', function (e) {
    if (!drag) {
      if (prefs.tool === 'eraser' && e.pointerType !== 'touch') { hover = toLogical(e); schedule(); }
      return;
    }
    if (e.pointerId !== drag.id || drag.tool === 'text') return;
    var evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
    if (!evs.length) evs = [e];
    var s = drag.stroke, minD = 1.4 / (view.scale || 1);
    evs.forEach(function (ev) {
      var pt = toLogical(ev);
      if (drag.tool === 'eraser') { eraseAt(drag.last.x, drag.last.y, pt.x, pt.y); drag.last = pt; return; }
      drag.last = pt;
      if (s.t === 'pen' || s.t === 'hl') {
        var n = s.p.length;
        if (Math.hypot(pt.x - s.p[n - 2], pt.y - s.p[n - 1]) < minD) return;
        s.p.push(r1(pt.x), r1(pt.y));
        if (s.pr) s.pr.push(Math.round((ev.pressure > 0 ? ev.pressure : 0.5) * 100));
      } else {
        var q = e.shiftKey ? constrain(s, pt.x, pt.y) : pt;
        s.p[2] = r1(q.x); s.p[3] = r1(q.y);
      }
    });
    schedule();
  });

  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag; drag = null;
    if (d.tool === 'text') { if (e && e.type === 'pointerup') openText(d.at); return; }
    if (d.tool === 'eraser') {
      if (d.changed) { pushHistory(d.before); changed(); }
    } else if (d.stroke) {
      var s = d.stroke, p = s.p, tiny = 3 / (view.scale || 1);
      var keep = (s.t === 'pen' || s.t === 'hl') ||
        ((s.t === 'rect' || s.t === 'ellipse') ? (Math.abs(p[2] - p[0]) > tiny || Math.abs(p[3] - p[1]) > tiny) : Math.hypot(p[2] - p[0], p[3] - p[1]) > tiny);
      if (s.pr && s.pr.length !== p.length / 2) delete s.pr;
      if (keep) commit(s);
    }
    if (e && e.pointerType === 'touch') hover = null;
    schedule();
  }
  live.addEventListener('pointerup', endDrag);
  live.addEventListener('pointercancel', endDrag);
  live.addEventListener('lostpointercapture', endDrag);
  live.addEventListener('pointerleave', function () { if (!drag && hover) { hover = null; schedule(); } });
  live.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* ---------------- text tool ---------------- */
  function openText(pt) {
    var S = D.dims(page()), size = TEXT_S[prefs.size];
    textAt = { x: EDU.clamp(pt.x, 0, S.w - 20), y: EDU.clamp(pt.y - size * 0.6, 0, Math.max(0, S.h - size * D.LINE_H)), size: size, color: curColor() };
    ta.value = ''; ta.hidden = false;
    positionText();
    textAt.opened = Date.now();
    ta.focus();
    setTimeout(function () { if (textAt && document.activeElement !== ta) ta.focus(); }, 30);
  }
  function positionText() {
    if (!textAt) return;
    var k = view.scale;
    ta.style.left = (textAt.x * k) + 'px';
    ta.style.top = (textAt.y * k) + 'px';
    ta.style.fontSize = (textAt.size * k) + 'px';
    ta.style.lineHeight = String(D.LINE_H);
    ta.style.color = D.color(textAt.color, page());
    ta.style.width = Math.max(60, view.cssW - textAt.x * k - 2) + 'px';
    ta.style.height = 'auto';
    ta.style.height = Math.min(view.cssH - textAt.y * k, ta.scrollHeight + 4) + 'px';
  }
  function commitText() {
    if (!textAt) return;
    var at = textAt, v = ta.value.replace(/\s+$/, '');
    textAt = null; ta.hidden = true; ta.value = '';
    if (!v.trim()) return;
    var s = { t: 'text', c: at.color, w: 1, p: [r1(at.x), r1(at.y)], s: at.size, tx: v.slice(0, 2000) };
    var m = D.measure(bctx, s); s.bw = m.w; s.bh = m.h;
    commit(s);
  }
  ta.addEventListener('input', positionText);
  ta.addEventListener('keydown', function (e) {
    /* Hindi, Tamil, Urdu … typing tools (IME) use Enter to pick a word: never finish the text then */
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(); }
    else if (e.key === 'Escape') { e.preventDefault(); textAt = null; ta.hidden = true; ta.value = ''; }
  });
  ta.addEventListener('blur', function () {
    /* ignore a stray blur right after the box opened (some browsers move focus on the same tap) */
    if (textAt && !ta.value && Date.now() - (textAt.opened || 0) < 350) { setTimeout(function () { if (textAt) ta.focus(); }, 0); return; }
    setTimeout(commitText, 0);
  });

  /* ---------------- pages + thumbnails ---------------- */
  var thumbs = {}, dirty = {}, thumbT = 0;
  function paintThumb(pg) {
    var c = thumbs[pg.id] || (thumbs[pg.id] = document.createElement('canvas'));
    D.paint(c, pg, 0.1);
    delete dirty[pg.id];
    return c;
  }
  function scheduleThumb(id) {
    dirty[id] = 1;
    clearTimeout(thumbT);
    thumbT = setTimeout(function () { pages.forEach(function (pg) { if (dirty[pg.id]) paintThumb(pg); }); }, 250);
  }
  function renderPages() {
    var box = $('#wb-thumbs');
    box.textContent = '';
    pages.forEach(function (pg, i) {
      var c = (thumbs[pg.id] && !dirty[pg.id]) ? thumbs[pg.id] : paintThumb(pg);
      var b = EDU.el('button', { type: 'button', class: 'wb-thumb', 'data-page': i, 'aria-label': t('page_n', { n: EDU.fmt(i + 1) }),
        title: t('page_n', { n: EDU.fmt(i + 1) }), 'aria-current': i === cur ? 'true' : 'false' }, c, EDU.el('b', { text: EDU.fmt(i + 1) }));
      b.addEventListener('click', function () { goPage(i); });
      box.appendChild(b);
    });
    var active = box.children[cur];
    if (active) {                         /* scroll the strip sideways only, never the page */
      var br = box.getBoundingClientRect(), ar = active.getBoundingClientRect();
      if (ar.left < br.left) box.scrollLeft -= (br.left - ar.left) + 8;
      else if (ar.right > br.right) box.scrollLeft += (ar.right - br.right) + 8;
    }
    $('#wb-pageno').textContent = t('page_n_of', { n: EDU.fmt(cur + 1), m: EDU.fmt(pages.length) });
    $('#wb-prev').disabled = cur === 0;
    $('#wb-next').disabled = cur === pages.length - 1;
    $('#wb-add').disabled = pages.length >= MAX_PAGES;
    wb.dataset.pages = pages.length;
    wb.dataset.page = cur + 1;
  }
  function goPage(i) {
    commitText();
    if (i < 0 || i >= pages.length) return;
    if (drag) {                          /* page changed mid-stroke (PageDown): keep an eraser's work undoable */
      var d = drag; drag = null;
      if (d.tool === 'eraser' && d.changed) { pushHistory(d.before); scheduleThumb(page().id); }
    }
    cur = i;
    fit(true); syncControls(); updateUndo(); renderPages(); scheduleSave();
  }
  function addPage() {
    commitText();
    if (pages.length >= MAX_PAGES) { EDU.toast(t('max_pages', { n: MAX_PAGES })); return; }
    var p = page();
    pages.splice(cur + 1, 0, D.newPage({ bg: p.bg, board: p.board, shape: p.shape }));
    goPage(cur + 1);
  }
  function delPage() {
    commitText();
    if (page().s.length && !confirm(t('confirm_del_page'))) return;
    if (pages.length === 1) {
      if (!page().s.length) return;
      pushHistory(); page().s = []; redraw(); changed(); return;
    }
    var id = page().id;
    delete hist[id]; delete thumbs[id]; delete dirty[id];
    pages.splice(cur, 1);
    goPage(Math.min(cur, pages.length - 1));
  }

  /* ---------------- saving (vector strokes, not images) ---------------- */
  var saveT = 0, warnedBig = false, warnedFail = false;
  function scheduleSave() { clearTimeout(saveT); saveT = setTimeout(saveNow, 300); }
  function saveNow() {
    clearTimeout(saveT); saveT = 0;
    var data = { v: 1, cur: cur, pages: pages };
    var size = 0;
    try { size = JSON.stringify(data).length; } catch (e) { return; }
    /* all library apps share one browser storage area (about 5 MB), so keep the board well below it */
    if (size > 3e6) {
      if (!warnedBig) { warnedBig = true; EDU.toast(t('too_big'), 7000); }
      return;
    }
    warnedBig = false;
    /* EDU.store.set returns false when the browser storage is full (other apps can fill it too);
       big boards are also read back, in case an older runtime gives no answer */
    var ok = store.set('board', data) !== false;
    if (ok && size > 4e5) {
      var back = store.get('board', null), n = function (ps) { return ps.reduce(function (a, p) { return a + (p.s ? p.s.length : 0); }, 0); };
      ok = !!(back && Array.isArray(back.pages) && back.pages.length === pages.length && n(back.pages) === n(pages));
    }
    if (!ok && !warnedFail) EDU.toast(t('save_failed'), 8000);
    warnedFail = !ok;
    wb.dataset.saved = ok ? '1' : '0';
  }
  window.addEventListener('pagehide', function () { commitText(); if (saveT) saveNow(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && saveT) saveNow(); });

  /* ---------------- files: PNG, print, board file ---------------- */
  function stamp() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function savePng() {
    commitText();
    EDU.downloadCanvas(D.paint(document.createElement('canvas'), page(), 1.5), 'whiteboard-' + stamp() + '-page-' + (cur + 1) + '.png');
  }
  /* One figure per page. The Print button uses pictures (and waits for them); the browser's own
     Print (Ctrl+P, menu) gets canvases, which are ready at once, so it never prints a blank sheet. */
  function fillPrint(asCanvas) {
    var box = $('#wb-print'), imgs = [];
    box.textContent = '';
    pages.forEach(function (pg, i) {
      /* a chalkboard page prints on white paper with dark ink (palette colours switch back), saving toner */
      var paper = D.isDark(pg) ? { bg: pg.bg, board: 'white', shape: pg.shape, s: pg.s } : pg;
      var label = t('page_n', { n: EDU.fmt(i + 1) }), c = D.paint(document.createElement('canvas'), paper, 1), pic;
      if (asCanvas) { pic = c; c.setAttribute('role', 'img'); c.setAttribute('aria-label', label); }
      else { pic = EDU.el('img', { alt: label, src: c.toDataURL('image/png') }); imgs.push(pic); }
      box.appendChild(EDU.el('figure', {}, pic, EDU.el('figcaption', { text: t('app_title') + ' · ' + label })));
    });
    return imgs;
  }
  function printAll() {
    commitText();
    var imgs = fillPrint(false);
    Promise.all(imgs.map(function (im) { return im.decode ? im.decode().catch(function () { }) : null; }))
      .then(function () { setTimeout(function () { window.print(); }, 50); });
  }
  window.addEventListener('beforeprint', function () { commitText(); if (!$('#wb-print').children.length) fillPrint(true); });
  window.addEventListener('afterprint', function () { $('#wb-print').textContent = ''; });

  function exportBoard() {
    commitText();
    var data = { app: 'ai-pathshala-whiteboard', v: 1, saved: new Date().toISOString(), pages: pages };
    EDU.download('whiteboard-' + stamp() + '.json', JSON.stringify(data), 'application/json');
  }
  function loadPages(list, msgKey) {
    pages = list; cur = 0; hist = {}; thumbs = {}; dirty = {};
    goPage(0);
    if (msgKey) EDU.toast(t(msgKey, { n: EDU.fmt(pages.length) }));
  }
  function importBoard() {
    commitText();
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return null;
      if (f.size > 30 * 1024 * 1024) { EDU.toast(t('bad_file')); return null; }
      return EDU.readText(f).then(function (txt) {
        var data = null;
        try { data = JSON.parse(txt); } catch (e) { data = null; }
        var list = data && D.cleanPages(Array.isArray(data) ? data : data.pages, MAX_PAGES);
        if (!list) { EDU.toast(t('bad_file')); return; }
        var hasInk = pages.some(function (p) { return p.s.length; });
        if (hasInk && !confirm(t('confirm_open'))) return;
        loadPages(list, 'opened');
      });
    }).catch(function () { EDU.toast(t('bad_file')); });
  }
  function newBoard() {
    commitText();
    if (!confirm(t('confirm_new'))) return;
    var p = page();
    loadPages([D.newPage({ bg: p.bg, board: p.board, shape: p.shape })]);
  }

  /* ---------------- full screen (with a fallback for phones without the API) ---------------- */
  function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function toggleFull() {
    commitText();
    if (fsElement()) { EDU.fullscreen(); return; }
    if (wb.classList.contains('wb-max')) { wb.classList.remove('wb-max'); onFull(); return; }
    var req = wb.requestFullscreen || wb.webkitRequestFullscreen;
    var maximise = function () { wb.classList.add('wb-max'); onFull(); };
    if (!req) { maximise(); return; }
    try {
      var r = req.call(wb);
      if (r && r.catch) r.catch(maximise);
    } catch (e) { maximise(); }
  }
  function onFull() {
    var on = fsElement() === wb || wb.classList.contains('wb-max');
    wb.classList.toggle('wb-full', on);
    btn.full.setAttribute('aria-pressed', String(on));
    requestAnimationFrame(function () { fit(true); });
  }
  document.addEventListener('fullscreenchange', onFull);
  document.addEventListener('webkitfullscreenchange', onFull);

  /* ---------------- keyboard shortcuts ---------------- */
  document.addEventListener('keydown', function (e) {
    var tg = e.target, tag = tg && tg.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tg && tg.isContentEditable)) return;
    if (document.querySelector('.edu-modal-back')) return;
    var k = String(e.key || '').toLowerCase(), mod = e.ctrlKey || e.metaKey;
    /* Hindi (InScript), Bengali, Urdu … keyboards give a non-Latin key: use the key's position instead */
    if (!/^[a-z]$/.test(k) && /^Key[A-Z]$/.test(e.code || '')) k = e.code.slice(3).toLowerCase();
    if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); redo(); return; }
    if (mod || e.altKey) return;
    if (e.key === 'PageDown') { e.preventDefault(); goPage(cur + 1); return; }
    if (e.key === 'PageUp') { e.preventDefault(); goPage(cur - 1); return; }
    if (e.key === 'Escape' && wb.classList.contains('wb-max')) { toggleFull(); return; }
    for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].key === k) { setTool(TOOLS[i].id); return; }
  });

  /* ---------------- start ---------------- */
  buildToolbar();
  EDU.apply(wb);
  syncControls();
  updateUndo();
  renderPages();
  fit(true);
  if (window.ResizeObserver) new ResizeObserver(function () { fit(false); }).observe(stage);
  /* phones: ignore small height changes (address bar hiding while scrolling) and the on-screen keyboard while typing */
  var lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener('resize', function () {
    var w = window.innerWidth, h = window.innerHeight;
    if (!isFull() && w === lastW && (textAt || Math.abs(h - lastH) < 160)) return;
    lastW = w; lastH = h;
    fit(false);
  });
  EDU.onLang(function () { renderColors(); renderPages(); fit(false); });
})();
