/* Turtle Coding: block + text coding with a drawing turtle. */
(function () {
  'use strict';
  var E = window.TurtleEngine, CONTENT = window.APP_CONTENT || {};
  var SLUG = 'turtle-coding';
  var store = EDU.store(SLUG);
  EDU.init({ slug: SLUG, title: 'app_title', wide: true });
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;
  function C() { return CONTENT[EDU.lang] || CONTENT.en; }
  function fmt(n) { return EDU.fmt(n, { maximumFractionDigits: 2 }); }
  function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] !== undefined ? v[k] : m; }); }
  function stars(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '★' : '☆'; return s; }

  var WORLD = 220;                       /* the canvas shows x and y from -220 to 220 */
  var ICON = { fd: '⬆', bk: '⬇', rt: '↻', lt: '↺', repeat: '🔁', pu: '✋', pd: '✏️', color: '🎨', width: '〰', home: '🏠', clear: '🧽' };
  var NOCOUNT = ['color', 'width', 'pu', 'pd'];
  var CHALLENGES = [
    { id: 'square', code: 'repeat 4 [ forward 100 right 90 ]', starter: 'forward 100' },
    { id: 'triangle', code: 'repeat 3 [ forward 120 right 120 ]' },
    { id: 'staircase', code: 'repeat 5 [ forward 30 right 90 forward 30 left 90 ]' },
    { id: 'house', code: 'repeat 4 [ forward 100 right 90 ]\nforward 100 right 30 forward 100 right 120 forward 100' },
    { id: 'polygon' },
    { id: 'star', code: 'repeat 5 [ forward 150 right 144 ]' },
    { id: 'circle', code: 'repeat 36 [ forward 10 right 10 ]' },
    { id: 'flower', code: 'repeat 8 [ repeat 4 [ forward 70 right 90 ] right 45 ]' }
  ];
  var CH_IDS = CHALLENGES.map(function (c) { return c.id; });
  var POLY = { 5: 100, 6: 90, 8: 70, 9: 60, 10: 55, 12: 45 };
  var ANGLE_ROWS = { 3: 120, 4: 100, 5: 90, 6: 80, 8: 60, 10: 50 };
  var EXAMPLES = {
    sun: 'color orange\nwidth 3\nrepeat 12 [\n  forward 100\n  back 100\n  right 30\n]',
    chakra: 'color blue\nwidth 3\nrepeat 24 [\n  forward 80\n  back 80\n  right 15\n]\npenup\nforward 80\nright 90\npendown\nrepeat 72 [\n  forward 7\n  right 5\n]',
    rangoli: 'width 2\nrepeat 8 [\n  color pink\n  repeat 4 [\n    forward 70\n    right 90\n  ]\n  color orange\n  repeat 3 [\n    forward 70\n    right 120\n  ]\n  right 45\n]',
    flower: 'color purple\nwidth 2\nrepeat 12 [\n  repeat 36 [\n    forward 6\n    right 10\n  ]\n  right 30\n]'
  };
  var PEN = {
    light: { red: '#d62828', orange: '#e8740c', yellow: '#d19a00', green: '#2b9348', blue: '#1d4ed8', purple: '#7b2cbf', pink: '#d63384', brown: '#8b5a2b' },
    dark: { red: '#ff6b6b', orange: '#ffa94d', yellow: '#ffd43b', green: '#69db7c', blue: '#74c0fc', purple: '#b197fc', pink: '#f783ac', brown: '#d2a679' }
  };

  /* ---------------- state ---------------- */
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  var savedList = store.get('saved', []);
  var S = {
    ws: obj(store.get('ws', {})), stars: obj(store.get('stars', {})),
    polyN: POLY[store.get('polyN', 6)] ? Number(store.get('polyN', 6)) : 6,
    cur: store.get('cur', 'free'),
    speed: EDU.clamp(Math.round(Number(store.get('speed', 6))) || 6, 1, 10),
    grid: store.get('grid', true) !== false,
    saved: Array.isArray(savedList) ? savedList.filter(function (s) { return s && typeof s.name === 'string' && typeof s.code === 'string'; }) : [],
    tab: 'blocks', target: null, prog: [], undo: [], codeDirty: false, hint: false, result: null,
    status: { key: 'status_ready' }, codeMsg: null
  };
  if (S.cur !== 'free' && CH_IDS.indexOf(S.cur) < 0) S.cur = 'free';
  var target = null;   /* current challenge outline: { segs, count } */

  function chById(id) { for (var i = 0; i < CHALLENGES.length; i++) if (CHALLENGES[i].id === id) return CHALLENGES[i]; return null; }
  function chName(id) { var c = C().challenges[id]; return c ? c.name : id; }
  function polyVars() { return { n: fmt(S.polyN), s: fmt(POLY[S.polyN]), a: fmt(360 / S.polyN) }; }
  function safeParse(code) { try { return E.parse(code); } catch (e) { return []; } }
  function defaultCode(id) { if (id === 'free') return EXAMPLES.sun; var ch = chById(id); return (ch && ch.starter) || ''; }
  function refCode(id) {
    if (id === 'polygon') { var n = S.polyN; return 'repeat ' + n + ' [ forward ' + POLY[n] + ' right ' + (360 / n) + ' ]'; }
    var ch = chById(id); return ch ? ch.code : '';
  }
  function computeTarget() {
    if (S.cur === 'free') { target = null; return; }
    var p = safeParse(refCode(S.cur));
    target = { segs: E.simulate(p).segs, count: E.countBlocks(p, NOCOUNT) };
  }
  function loadWorkspace(id) {
    S.cur = id; store.set('cur', id);
    S.prog = safeParse(typeof S.ws[id] === 'string' ? S.ws[id] : defaultCode(id));
    S.undo = []; S.target = null; S.codeDirty = false; S.result = null; S.hint = false; S.codeMsg = null;
    computeTarget();
  }
  function persist() { S.ws[S.cur] = E.toCode(S.prog); store.set('ws', S.ws); }
  function pushUndo() { S.undo.push(E.toCode(S.prog)); if (S.undo.length > 60) S.undo.shift(); }
  function changed() { persist(); renderProgram(); syncCode(); updateCounts(); }
  function mutate(fn) { haltForEdit(); pushUndo(); fn(); changed(); }

  function find(id, list, parent) {
    list = list || S.prog;
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (b.id === id) return { b: b, list: list, i: i, parent: parent || null };
      if (b.body) { var r = find(id, b.body, b); if (r) return r; }
    }
    return null;
  }
  function contains(b, id) { return b.id === id || !!(b.body && b.body.some(function (x) { return contains(x, id); })); }

  /* ---------------- editing ---------------- */
  function insertLoc() {
    var f = S.target && find(S.target);
    if (f && f.b.body) return { list: f.b.body, index: f.b.body.length };
    S.target = null;
    return { list: S.prog, index: S.prog.length };
  }
  function addBlock(type) {
    var b = E.make(type);
    mutate(function () { var loc = insertLoc(); loc.list.splice(loc.index, 0, b); });
    flash(b.id);
    return b;
  }
  function moveBlock(id, dir) {
    var f = find(id); if (!f) return;
    var list = f.list, i = f.i, b = f.b, moved = false;
    mutate(function () {
      if (dir < 0) {
        if (i > 0) {
          var prev = list[i - 1];
          list.splice(i, 1);
          if (prev.body) prev.body.push(b); else list.splice(i - 1, 0, b);   /* step into a Repeat above */
          moved = true;
        } else if (f.parent) {
          var pf = find(f.parent.id); list.splice(i, 1); pf.list.splice(pf.i, 0, b); moved = true;   /* step out of the Repeat */
        }
      } else if (i < list.length - 1) {
        var next = list[i + 1];
        list.splice(i, 1);
        if (next.body) next.body.unshift(b); else list.splice(i + 1, 0, b);
        moved = true;
      } else if (f.parent) {
        var pf2 = find(f.parent.id); list.splice(i, 1); pf2.list.splice(pf2.i + 1, 0, b); moved = true;
      }
      if (!moved) S.undo.pop();
    });
    var r = rowEl(id), btn = r && r.querySelector('[data-act="' + (dir < 0 ? 'up' : 'down') + '"]');
    if (btn) btn.focus();
    if (moved) flash(id);
  }
  function delBlock(id) {
    var f = find(id); if (!f) return;
    mutate(function () { f.list.splice(f.i, 1); if (S.target && contains(f.b, S.target)) S.target = null; });
  }
  function setProgram(code) {
    var p = safeParse(code);
    mutate(function () { S.prog = p; S.target = null; S.codeDirty = false; });
    syncCode();
  }
  function undo() {
    if (!S.undo.length) return;
    haltForEdit();
    S.prog = safeParse(S.undo.pop()); S.target = null; S.codeDirty = false;
    changed();
  }

  /* ---------------- program view ---------------- */
  function rowEl(id) { return document.querySelector('#prog .tc-row[data-id="' + id + '"]:not(.tc-end)'); }
  function flash(id) {
    var r = rowEl(id); if (!r) return;
    r.classList.remove('tc-flash'); void r.offsetWidth; r.classList.add('tc-flash');
    var rc = r.getBoundingClientRect();
    if (rc.bottom > window.innerHeight || rc.top < 60) r.scrollIntoView({ block: 'nearest' });
  }
  function renderProgram() {
    var box = $('#prog'); box.textContent = '';
    if (!S.prog.length) box.appendChild(el('p', { class: 'tc-empty muted', text: t('empty_program') }));
    else box.appendChild(renderList(S.prog, 'root'));
    renderTargetNote();
    if (A.curId && (A.mode === 'run' || A.mode === 'step')) setHighlight(A.curId);
  }
  function renderList(list, owner) {
    var w = el('div', { class: 'tc-list', role: 'list', dataset: { owner: owner } });
    list.forEach(function (b) { w.appendChild(renderBlock(b)); });
    return w;
  }
  function renderBlock(b) {
    if (b.t !== 'repeat') return blockRow(b, true);
    var wrap = el('div', { class: 'tc-rep' + (S.target === b.id ? ' tc-target' : ''), role: 'listitem', dataset: { rep: b.id } });
    wrap.appendChild(blockRow(b, false));
    var body = el('div', { class: 'tc-body' });
    if (b.body.length) body.appendChild(renderList(b.body, b.id));
    else body.appendChild(el('p', { class: 'tc-empty-rep', dataset: { owner: b.id }, text: t('empty_repeat') }));
    wrap.appendChild(body);
    wrap.appendChild(el('div', { class: 'tc-row tc-end cat-loop', dataset: { id: b.id, end: '1' } },
      el('span', { class: 'tc-handle', 'aria-hidden': 'true' }), el('span', { class: 'tc-main', text: t('end_repeat') })));
    return wrap;
  }
  function blockRow(b, item) {
    var T = E.TYPES[b.t], name = t('blk_' + b.t);
    var row = el('div', { class: 'tc-row cat-' + T.cat, role: item ? 'listitem' : null, dataset: { id: b.id, t: b.t } });
    var handle = el('span', { class: 'tc-handle', title: t('drag_handle'), 'aria-hidden': 'true', text: '⠿' });
    handle.addEventListener('pointerdown', function (e) { startHandleDrag(e, b); });
    var main = el('div', { class: 'tc-main' }, el('span', { class: 'tc-name' },
      el('span', { class: 'tc-ico', 'aria-hidden': 'true', text: ICON[b.t] }), el('span', { class: 'tc-lbl', text: name })));
    if (T.num) {
      var unit = (b.t === 'fd' || b.t === 'bk') ? t('u_steps') : (b.t === 'rt' || b.t === 'lt') ? '°' : b.t === 'repeat' ? t('u_times') : '';
      main.appendChild(el('span', { class: 'tc-val' }, numInput(b, name), unit ? el('span', { class: 'tc-unit', text: unit }) : null));
    }
    if (T.color) {
      var sw = el('span', { class: 'tc-sw', style: { background: penColor(b.c) } });
      main.appendChild(el('span', { class: 'tc-val' }, sw, colorSelect(b, name, sw)));
    }
    if (b.t === 'repeat') {
      var it = A.iterText[b.id];
      main.appendChild(el('span', { class: 'badge accent tc-iter', hidden: !it, dataset: { iter: b.id }, text: it || '' }));
      var on = S.target === b.id;
      main.appendChild(el('button', {
        type: 'button', class: 'btn btn-sm tc-in', 'aria-pressed': on ? 'true' : 'false', text: '+ ' + t('add_inside'),
        onclick: function () { S.target = S.target === b.id ? null : b.id; renderProgram(); var r = rowEl(b.id); if (r) r.querySelector('.tc-in').focus(); }
      }));
    }
    var acts = el('div', { class: 'tc-acts' },
      el('button', { type: 'button', class: 'btn btn-ghost', 'aria-label': t('move_up') + ': ' + name, title: t('move_up'), text: '▲', dataset: { act: 'up' }, onclick: function () { moveBlock(b.id, -1); } }),
      el('button', { type: 'button', class: 'btn btn-ghost', 'aria-label': t('move_down') + ': ' + name, title: t('move_down'), text: '▼', dataset: { act: 'down' }, onclick: function () { moveBlock(b.id, 1); } }),
      el('button', { type: 'button', class: 'btn btn-ghost btn-danger', 'aria-label': t('delete') + ': ' + name, title: t('delete'), text: '✕', dataset: { act: 'del' }, onclick: function () { delBlock(b.id); } }));
    row.appendChild(handle); row.appendChild(main); row.appendChild(acts);
    return row;
  }
  function numInput(b, name) {
    var T = E.TYPES[b.t];
    var inp = el('input', { type: 'number', class: 'tc-num', value: String(b.n), step: T.int ? '1' : 'any', min: String(T.min), max: String(T.max), 'aria-label': name });
    inp.addEventListener('change', function () {
      var raw = inp.value.trim(), v = raw === '' ? NaN : Number(raw);
      if (!isFinite(v)) { inp.value = String(b.n); return; }
      var nv = E.clampNum(b.t, v);
      inp.value = String(nv);
      if (nv === b.n) return;
      haltForEdit(); pushUndo(); b.n = nv; persist(); syncCode(); updateCounts();
    });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') inp.blur(); });
    return inp;
  }
  function colorSelect(b, name, sw) {
    var sel = el('select', { class: 'tc-colsel', 'aria-label': name });
    E.COLORS.forEach(function (c) { sel.appendChild(el('option', { value: c, text: t('col_' + c) })); });
    sel.value = b.c;
    sel.addEventListener('change', function () {
      if (E.COLORS.indexOf(sel.value) < 0 || sel.value === b.c) return;
      haltForEdit(); pushUndo(); b.c = sel.value; sw.style.background = penColor(b.c); persist(); syncCode();
    });
    return sel;
  }
  function renderTargetNote() {
    if (S.target && !find(S.target)) S.target = null;
    var box = $('#target-note'); box.textContent = '';
    if (S.target) {
      box.appendChild(el('span', { text: t('target_repeat') }));
      box.appendChild(el('button', { type: 'button', class: 'btn btn-sm', id: 'to-main', text: t('back_to_main'), onclick: function () { S.target = null; renderProgram(); } }));
    } else box.appendChild(el('span', { class: 'muted', text: t('target_main') }));
  }
  function renderPalette() {
    var pal = $('#pal'); pal.textContent = '';
    E.ORDER.forEach(function (type) {
      var b = el('button', { type: 'button', class: 'btn tc-pb cat-' + E.TYPES[type].cat, id: 'pal-' + type, dataset: { t: type } },
        el('span', { class: 'tc-ico', 'aria-hidden': 'true', text: ICON[type] }), el('span', { text: t('blk_' + type) }));
      b.addEventListener('click', function () { if (dragJustEnded) return; addBlock(type); });
      b.addEventListener('pointerdown', function (e) { palettePointerDown(e, type); });
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      pal.appendChild(b);
    });
  }
  function updateCounts() {
    $('#blk-count').textContent = t('n_blocks', { n: fmt(E.countBlocks(S.prog)) });
    $('#undo').disabled = !S.undo.length;
  }

  /* ---------------- code tab ---------------- */
  function syncCode() {
    var code = E.toCode(S.prog);
    if (!S.codeDirty) $('#code').value = code;
    $('#print-code').textContent = code;
  }
  function setCodeMsg(m) { S.codeMsg = m; renderCodeMsg(); }
  function renderCodeMsg() {
    var p = $('#code-msg'), m = S.codeMsg;
    p.textContent = m ? t(m.key, m.vars) : '';
    p.dataset.kind = m ? m.kind : '';
  }
  function applyCode(quiet) {
    if (!S.codeDirty) return true;
    var p;
    try { p = E.parse($('#code').value); }
    catch (e) {
      if (!(e instanceof E.ParseError)) throw e;
      setCodeMsg({ key: e.key, vars: e.vars, kind: 'error' });
      showTab('code', true);
      return false;
    }
    haltForEdit(); pushUndo();
    S.prog = p; S.target = null; S.codeDirty = false;
    changed();
    setCodeMsg(quiet ? null : { key: 'code_ok', kind: 'ok' });
    return true;
  }
  function showTab(name, force) {
    if (!force && name === 'blocks' && S.codeDirty && !applyCode(true)) return;
    S.tab = name;
    $('#tab-blocks').setAttribute('aria-selected', String(name === 'blocks'));
    $('#tab-code').setAttribute('aria-selected', String(name === 'code'));
    $('#pane-blocks').hidden = name !== 'blocks';
    $('#pane-code').hidden = name !== 'code';
    store.set('tab', name);
  }
  function renderCmdTable() {
    var rows = [['forward 50', 'fd'], ['back 50', 'bk'], ['right 90', 'rt'], ['left 90', 'lt'], ['repeat 4 [ … ]', 'repeat'],
      ['penup', 'pu'], ['pendown', 'pd'], ['color red', 'color'], ['width 5', 'width'], ['home', 'home'], ['clear', 'clear']];
    var tb = $('#cmd-table'); tb.textContent = '';
    tb.appendChild(el('thead', {}, el('tr', {}, el('th', { text: t('tab_code') }), el('th', { text: t('block') }))));
    var body = el('tbody');
    rows.forEach(function (r) {
      body.appendChild(el('tr', {}, el('td', {}, el('code', { text: r[0] })), el('td', {}, ICON[r[1]] + ' ' + t('blk_' + r[1]))));
    });
    body.appendChild(el('tr', {}, el('td', {}, el('code', { text: E.COLORS.join(' ') })),
      el('td', { text: E.COLORS.map(function (c) { return t('col_' + c); }).join(', ') })));
    tb.appendChild(body);
  }

  /* ---------------- canvas ---------------- */
  var cv = $('#cv'), ctx = cv.getContext('2d');
  var layer = document.createElement('canvas'), lctx = layer.getContext('2d');
  var view = { W: 0, s: 1, dpr: 1 }, col = {}, printing = false;
  function readColors() {
    if (printing) { col = { surface: '#ffffff', text: '#111111', border: '#d0d0d0', muted: '#666666', accent: '#d9501c' }; return; }
    col = { surface: EDU.css('--surface') || '#fff', text: EDU.css('--text') || '#111', border: EDU.css('--border') || '#ddd', muted: EDU.css('--muted') || '#666', accent: EDU.css('--accent') || '#d9501c' };
  }
  function penColor(c) {
    if (c === 'black' || !PEN.light[c]) return col.text || '#111';
    return PEN[printing ? 'light' : (EDU.theme() === 'dark' ? 'dark' : 'light')][c];
  }
  function X(x) { return view.W / 2 + x * view.s; }
  function Y(y) { return view.W / 2 - y * view.s; }
  function strokeSeg(g, s) {
    g.strokeStyle = penColor(s.c); g.lineWidth = Math.max(1, s.w * view.s); g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(X(s.x1), Y(s.y1)); g.lineTo(X(s.x2), Y(s.y2)); g.stroke();
  }
  function clearLayer() { lctx.clearRect(0, 0, layer.width, layer.height); }
  function redrawLayer() { clearLayer(); A.segs.forEach(function (s) { strokeSeg(lctx, s); }); }
  function resize(force) {
    var css = Math.floor($('#cv-wrap').clientWidth) || 300;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.max(120, Math.round(css * dpr));
    if (!force && W === view.W) return;
    cv.width = cv.height = W; layer.width = layer.height = W;
    view.W = W; view.dpr = dpr; view.s = W / (2 * WORLD);
    redrawLayer(); draw();
  }
  function drawGrid() {
    var g = ctx, W = view.W, d = view.dpr;
    g.lineWidth = d; g.strokeStyle = col.border; g.beginPath();
    for (var v = -200; v <= 200; v += 50) { if (!v) continue; g.moveTo(X(v), 0); g.lineTo(X(v), W); g.moveTo(0, Y(v)); g.lineTo(W, Y(v)); }
    g.stroke();
    g.globalAlpha = 0.5; g.strokeStyle = col.muted; g.lineWidth = 1.5 * d; g.beginPath();
    g.moveTo(X(0), 0); g.lineTo(X(0), W); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = col.muted; g.font = Math.round(11 * d) + 'px system-ui, sans-serif';
    [-200, -100, 100, 200].forEach(function (v) {
      g.textAlign = v > 0 ? 'right' : 'left'; g.textBaseline = 'bottom';
      g.fillText(String(v), X(v) + (v > 0 ? -3 : 3) * d, Y(0) - 3 * d);
      g.textAlign = 'left'; g.textBaseline = v > 0 ? 'top' : 'bottom';
      g.fillText(String(v), X(0) + 4 * d, Y(v) + (v > 0 ? 3 : -3) * d);
    });
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  }
  function drawTarget() {
    var g = ctx; g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col.accent;
    g.beginPath();
    target.segs.forEach(function (s) { g.moveTo(X(s.x1), Y(s.y1)); g.lineTo(X(s.x2), Y(s.y2)); });
    g.globalAlpha = 0.16; g.lineWidth = Math.max(6, 12 * view.s); g.stroke();
    g.globalAlpha = 0.75; g.lineWidth = Math.max(1, 1.5 * view.dpr); g.setLineDash([6 * view.dpr, 6 * view.dpr]); g.stroke();
    g.restore();
  }
  function drawTurtle(tu) {
    var g = ctx, sz = Math.max(20 * view.dpr, Math.min(46 * view.dpr, view.W / 15)) / 36;
    g.save(); g.translate(X(tu.x), Y(tu.y)); g.rotate(tu.h * Math.PI / 180); g.scale(sz, sz);
    g.fillStyle = '#74b816';
    [[-12, -8], [12, -8], [-12, 9], [12, 9]].forEach(function (p) { g.beginPath(); g.ellipse(p[0], p[1], 5, 4, 0, 0, 2 * Math.PI); g.fill(); });
    g.beginPath(); g.moveTo(0, 19); g.lineTo(-3.5, 12); g.lineTo(3.5, 12); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(0, -18, 5.5, 6.5, 0, 0, 2 * Math.PI); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(-2.4, -20, 1.2, 0, 2 * Math.PI); g.arc(2.4, -20, 1.2, 0, 2 * Math.PI); g.fill();
    g.fillStyle = '#2b8a3e'; g.strokeStyle = '#1b5e20'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(0, 0, 12, 14, 0, 0, 2 * Math.PI); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 0, 6.5, 7.5, 0, 0, 2 * Math.PI); g.stroke();
    g.restore();
    var r = 4 * view.dpr;
    g.beginPath(); g.arc(X(tu.x), Y(tu.y), r, 0, 2 * Math.PI);
    if (tu.pen) { g.fillStyle = penColor(tu.c); g.fill(); g.lineWidth = 1.5 * view.dpr; g.strokeStyle = '#ffffff'; g.stroke(); }
    else { g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 2 * view.dpr; g.strokeStyle = '#1b5e20'; g.stroke(); }
  }
  function shownTurtle() {
    var tu = A.tu;
    if (!A.ops || A.prog <= 0 || A.i >= A.ops.length) return { tu: tu, seg: null };
    var op = A.ops[A.i], d = { x: tu.x, y: tu.y, h: tu.h, pen: tu.pen, c: tu.c, w: tu.w }, seg = null;
    if (op.op === 'fd' || op.op === 'bk' || op.op === 'home') {
      var p = E.moveTarget(tu, op);
      d.x = tu.x + (p.x - tu.x) * A.prog; d.y = tu.y + (p.y - tu.y) * A.prog;
      if (tu.pen) seg = { x1: tu.x, y1: tu.y, x2: d.x, y2: d.y, c: tu.c, w: tu.w };
    } else if (op.op === 'rt') d.h = tu.h + op.n * A.prog;
    else if (op.op === 'lt') d.h = tu.h - op.n * A.prog;
    return { tu: d, seg: seg };
  }
  function draw() {
    if (!view.W) return;
    var g = ctx, sh = shownTurtle();
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]);
    g.fillStyle = col.surface; g.fillRect(0, 0, view.W, view.W);
    if (S.grid) drawGrid();
    if (target) drawTarget();
    g.drawImage(layer, 0, 0);
    if (sh.seg) strokeSeg(g, sh.seg);
    drawTurtle(sh.tu);
    cv.dataset.segs = String(A.segs.length);
    updateReadout(sh.tu);
  }
  function updateReadout(tu) {
    var x = Math.round(tu.x) || 0, y = Math.round(tu.y) || 0, h = Math.round(E.normDeg(tu.h)) % 360;
    var r = $('#readout');
    r.textContent = t('readout', { x: fmt(x), y: fmt(y), h: fmt(h) });
    r.dataset.x = x; r.dataset.y = y; r.dataset.h = h; r.dataset.pen = tu.pen ? 'down' : 'up';
  }

  /* ---------------- running ---------------- */
  var A = { mode: 'idle', ops: null, i: 0, prog: 0, tu: E.newTurtle(), segs: [], total: 0, done: 0, raf: 0, curId: null, iterText: {} };
  var VM = [1.2, 2, 3.2, 5, 8, 12, 18, 30, 55];          /* steps per frame for speed 1..9 */
  var VT = [2.5, 4, 6, 9, 14, 20, 30, 50, 90];           /* degrees per frame */
  var PAUSE = [14, 10, 7, 5, 3, 2, 1, 0, 0];             /* frames for pen / colour blocks */
  function opCost(op, tu) {
    var sp = S.speed;
    if (sp >= 10 || op.op === 'iter') return 0;
    if (op.op === 'fd' || op.op === 'bk') return Math.abs(op.n) / VM[sp - 1];
    if (op.op === 'home') return Math.sqrt(tu.x * tu.x + tu.y * tu.y) / VM[sp - 1] + PAUSE[sp - 1];
    if (op.op === 'rt' || op.op === 'lt') return Math.abs(op.n) / VT[sp - 1];
    return PAUSE[sp - 1];
  }
  function cancel() { if (A.raf) cancelAnimationFrame(A.raf); A.raf = 0; }
  function setHighlight(id) {
    $$('#prog .tc-on').forEach(function (r) { if (r.dataset.id !== id) r.classList.remove('tc-on'); });
    var r = id && rowEl(id); if (r) r.classList.add('tc-on');
  }
  function clearRunMarks() {
    A.curId = null; A.iterText = {};
    $$('#prog .tc-on').forEach(function (r) { r.classList.remove('tc-on'); });
    $$('#prog [data-iter]').forEach(function (b) { b.hidden = true; b.textContent = ''; });
    $('#stepcount').textContent = '';
  }
  function flushUI() {
    setHighlight(A.curId);
    Object.keys(A.iterText).forEach(function (id) {
      var b = document.querySelector('#prog [data-iter="' + id + '"]');
      if (b) { b.textContent = A.iterText[id]; b.hidden = false; }
    });
    $('#stepcount').textContent = A.total ? t('step_of', { n: fmt(A.done), total: fmt(A.total) }) : '';
  }
  function completeOp(op) {
    if (op.op === 'clear') { A.segs = []; clearLayer(); }
    else if (op.op === 'iter') A.iterText[op.id] = op.i + '/' + op.n;
    else { var s = E.apply(A.tu, op); if (s) { A.segs.push(s); strokeSeg(lctx, s); } }
    if (op.op !== 'iter') { A.done++; A.curId = op.id; }
    A.i++; A.prog = 0;
  }
  function resetCanvasState() {
    cancel();
    A.tu = E.newTurtle(); A.segs = []; A.ops = null; A.i = 0; A.prog = 0; A.done = 0; A.total = 0;
    clearRunMarks(); clearLayer();
  }
  function startSession() {
    if (!applyCode(true)) { setStatus('err_in_code', null, 'error'); return false; }
    cancel();
    var ops = E.compile(S.prog);
    if (!ops) { setStatus('err_too_many', { max: fmt(E.MAX_OPS) }, 'error'); return false; }
    var total = ops.filter(function (o) { return o.op !== 'iter'; }).length;
    if (!total) { setStatus('err_empty', null, 'error'); return false; }
    resetCanvasState();
    A.ops = ops; A.total = total; S.result = null; renderResult();
    return true;
  }
  function frame() {
    A.raf = 0;
    if (A.mode !== 'run') return;
    var budget = 1, guard = 0;
    while (A.i < A.ops.length && guard++ < 4000) {
      var op = A.ops[A.i], cost = opCost(op, A.tu);
      if (cost <= 0) { completeOp(op); continue; }
      var remain = cost * (1 - A.prog);
      if (remain <= budget) { budget -= remain; completeOp(op); if (budget <= 1e-9) break; }
      else { A.prog += budget / cost; A.curId = op.id; break; }
    }
    flushUI(); draw();
    if (A.i >= A.ops.length) finish(); else A.raf = requestAnimationFrame(frame);
  }
  function loop() { if (!A.raf) A.raf = requestAnimationFrame(frame); }
  function run() {
    if (A.mode === 'step') { A.mode = 'run'; setStatus('status_running'); updateButtons(); loop(); return; }
    if (!startSession()) { updateButtons(); return; }
    A.mode = 'run'; setStatus('status_running'); updateButtons(); loop();
  }
  function step() {
    if (A.mode !== 'run' && A.mode !== 'step') { if (!startSession()) { updateButtons(); return; } }
    cancel(); A.mode = 'step';
    var last = null;
    while (A.i < A.ops.length) { var op = A.ops[A.i]; completeOp(op); if (op.op !== 'iter') { last = op; break; } }
    flushUI(); draw();
    if (A.i >= A.ops.length) { finish(); return; }
    setStatus('status_step', { n: fmt(A.done), total: fmt(A.total) }, null, last);
    updateButtons();
  }
  function stop() {
    if (A.mode !== 'run' && A.mode !== 'step') return;
    cancel(); A.mode = 'idle'; A.prog = 0;
    clearRunMarks(); draw();
    setStatus('status_stopped', { n: fmt(A.done) });
    updateButtons();
  }
  function haltForEdit() {
    if (A.mode !== 'run' && A.mode !== 'step') return;
    cancel(); A.mode = 'idle'; A.prog = 0;
    clearRunMarks(); draw();
    setStatus('status_ready');
    updateButtons();
  }
  function finish() {
    cancel(); A.mode = 'done';
    clearRunMarks(); draw();
    setStatus('status_done', { total: fmt(A.total) }, 'done');
    updateButtons();
    if (S.cur !== 'free' && target) evaluate();
  }
  function instantRun() {
    var ops = E.compile(S.prog);
    resetCanvasState();
    if (!ops) return;
    ops.forEach(completeOp);
    A.ops = null; A.mode = 'done'; A.curId = null; A.iterText = {};
  }
  function updateButtons() {
    var busy = A.mode === 'run' || A.mode === 'step';
    $('#stop').disabled = !busy;
    $('#status').dataset.state = A.mode;
  }
  function describe(op) {
    var s = t('blk_' + op.op);
    if (op.n !== undefined) s += ' \u2066' + fmt(op.n) + (op.op === 'rt' || op.op === 'lt' ? '°' : '') + '\u2069';
    if (op.c) s += ': ' + t('col_' + op.c);
    return s;
  }
  function setStatus(key, vars, kind, op) { S.status = { key: key, vars: vars || null, kind: kind || '', op: op || null }; renderStatus(); }
  function renderStatus() {
    var st = S.status, v = Object.assign({}, st.vars || {});
    if (st.op) v.block = describe(st.op);
    var p = $('#status');
    p.textContent = t(st.key, v);
    p.dataset.kind = st.kind || '';
  }

  /* ---------------- challenges ---------------- */
  function evaluate() {
    var r = E.check(A.segs, target.segs), res = { pass: r.pass, cov: r.cov, empty: !!r.empty, stars: 0 };
    if (r.pass) {
      res.rep = E.hasType(S.prog, 'repeat');
      res.short = E.countBlocks(S.prog, NOCOUNT) <= target.count;
      res.stars = 1 + (res.rep ? 1 : 0) + (res.short ? 1 : 0);
      if (res.stars > (S.stars[S.cur] || 0)) { S.stars[S.cur] = res.stars; store.set('stars', S.stars); }
    }
    S.result = res;
    renderChips(); renderResult();
  }
  function renderChips() {
    var box = $('#ch-list'); box.textContent = '';
    box.appendChild(el('button', { type: 'button', class: 'chip', id: 'ch-free', 'aria-pressed': String(S.cur === 'free'), text: t('free_draw'), onclick: function () { switchWs('free'); } }));
    CHALLENGES.forEach(function (ch, i) {
      var st = S.stars[ch.id] || 0;
      box.appendChild(el('button', { type: 'button', class: 'chip', id: 'ch-' + ch.id, 'aria-pressed': String(S.cur === ch.id), onclick: function () { switchWs(ch.id); } },
        el('span', { text: (i + 1) + '. ' + chName(ch.id) }),
        el('span', { class: 'tc-stars', role: 'img', 'aria-label': t('stars_aria', { n: st }), text: stars(st) })));
    });
    var done = CHALLENGES.filter(function (ch) { return S.stars[ch.id] > 0; }).length;
    $('#ch-progress').textContent = t('progress', { n: fmt(done), total: fmt(CHALLENGES.length) });
  }
  function renderChallengePanel() {
    var p = $('#ch-panel'); p.textContent = '';
    $('#tc').classList.toggle('is-free', S.cur === 'free');
    if (S.cur === 'free') {
      var ex = el('div', { class: 'tc-ex' }, el('h3', { text: t('examples_h') }));
      var chips = el('div', { class: 'tc-chips' });
      Object.keys(EXAMPLES).forEach(function (id) {
        chips.appendChild(el('button', { type: 'button', class: 'chip', id: 'ex-' + id, text: C().examples[id], onclick: function () { loadExample(id); } }));
      });
      ex.appendChild(chips);
      p.appendChild(ex);
      p.appendChild(el('p', { class: 'small muted', style: { margin: '10px 0 0' }, text: t('free_tip') }));
      return;
    }
    var c = C().challenges[S.cur], v = polyVars();
    var box = el('div', { class: 'tc-task' },
      el('h3', { text: c.name }),
      el('p', { id: 'ch-task', text: fill(c.task, v) }),
      el('p', { class: 'small muted tc-tip', text: t('challenge_tip') }));
    var row = el('div', { class: 'row' });
    var hb = el('button', { type: 'button', class: 'btn btn-sm tc-hint-btn', id: 'hint-btn', 'aria-expanded': String(S.hint), text: '💡 ' + t(S.hint ? 'hint_hide' : 'hint_show'),
      onclick: function () { S.hint = !S.hint; renderChallengePanel(); var b = $('#hint-btn'); if (b) b.focus(); } });
    row.appendChild(hb);
    if (S.cur === 'polygon') row.appendChild(el('button', { type: 'button', class: 'btn btn-sm', id: 'poly-new', text: '🎲 ' + t('new_sides'), onclick: newPolygon }));
    box.appendChild(row);
    if (S.hint) box.appendChild(el('p', { class: 'callout tc-hint', id: 'hint', text: fill(c.hint, v) }));
    box.appendChild(el('div', { class: 'tc-result', id: 'ch-result', 'aria-live': 'polite' }));
    p.appendChild(box);
    renderResult();
  }
  function renderResult() {
    var box = $('#ch-result'); if (!box) return;
    var r = S.result; box.textContent = ''; box.className = 'tc-result';
    box.dataset.stars = r ? String(r.stars) : ''; box.dataset.pass = r ? String(r.pass) : '';
    if (!r) return;
    if (r.pass) {
      box.className = 'tc-result callout success';
      var ok = function (yes, text) { return el('li', {}, el('span', { 'aria-hidden': 'true', text: yes ? '✅' : '⬜' }), el('span', { text: text })); };
      box.appendChild(el('div', { class: 'tc-bigstars', role: 'img', 'aria-label': t('stars_aria', { n: r.stars }), text: stars(r.stars) }));
      box.appendChild(el('strong', { text: t('ch_pass', { name: chName(S.cur) }) }));
      box.appendChild(el('ul', {}, ok(true, t('ch_star_shape')), ok(r.rep, t('ch_star_repeat')), ok(r.short, t('ch_star_short', { n: fmt(target.count) }))));
    } else {
      box.className = 'tc-result callout warning';
      box.textContent = r.empty ? t('ch_nothing') : (r.cov >= 0.97 ? t('ch_extra') : t('ch_partial', { p: fmt(Math.floor(r.cov * 100)) }));
    }
  }
  function newPolygon() {
    var keys = Object.keys(POLY).map(Number).filter(function (n) { return n !== S.polyN; });
    S.polyN = EDU.pick(keys); store.set('polyN', S.polyN);
    computeTarget(); S.result = null;
    renderChallengePanel(); draw();
  }
  function switchWs(id) {
    if (S.codeDirty && !applyCode(true)) return;
    haltForEdit();
    loadWorkspace(id);
    resetCanvasState(); A.mode = 'idle';
    renderAll();
    setStatus('status_ready');
    updateButtons();
  }
  function loadExample(id) {
    if (S.cur !== 'free') switchWs('free');
    setProgram(EXAMPLES[id]);
    run();
  }

  /* ---------------- saved programs + share link ---------------- */
  function renderSaved() {
    var ul = $('#saved-list'); ul.textContent = '';
    if (!S.saved.length) { ul.appendChild(el('li', { class: 'muted small', text: t('no_saved') })); return; }
    S.saved.forEach(function (sv, i) {
      ul.appendChild(el('li', {},
        el('span', { class: 'nm no-i18n', text: sv.name }),
        el('span', { class: 'badge', text: t('n_blocks', { n: fmt(E.countBlocks(safeParse(sv.code))) }) }),
        el('button', { type: 'button', class: 'btn btn-sm', dataset: { open: i }, text: t('open'), onclick: function () { setProgram(sv.code); resetCanvasState(); A.mode = 'idle'; draw(); setStatus('loaded'); updateButtons(); } }),
        el('button', { type: 'button', class: 'btn btn-sm btn-danger', 'aria-label': t('delete') + ': ' + sv.name, text: '✕', onclick: function () {
          if (!confirm(t('confirm_delete', { name: sv.name }))) return;
          S.saved.splice(S.saved.indexOf(sv), 1); store.set('saved', S.saved); renderSaved();
        } })));
    });
  }
  function saveProgram() {
    if (!applyCode(true)) return;
    var inp = $('#save-name'), name = inp.value.trim().slice(0, 60) || t('untitled', { n: S.saved.length + 1 });
    S.saved = S.saved.filter(function (s) { return s.name !== name; });
    S.saved.unshift({ name: name, code: E.toCode(S.prog) });
    if (S.saved.length > 60) S.saved.length = 60;
    if (store.set('saved', S.saved) === false) { EDU.toast(t('err_file')); return; }
    inp.value = '';
    renderSaved();
    EDU.toast(t('saved_ok'));
  }
  function shareLink() {
    if (!applyCode(true)) return;
    try {
      var u = new URL(location.href);
      u.searchParams.set('lang', EDU.lang);
      u.searchParams.set('prog', EDU.pack({ c: E.toCode(S.prog) }));
      EDU.copy(u.toString());
    } catch (e) { EDU.toast(t('err_file')); }
  }
  function readLink() {
    try {
      var q = new URLSearchParams(location.search).get('prog');
      if (!q) return false;
      var u = new URL(location.href); u.searchParams.delete('prog'); history.replaceState(history.state, '', u.toString());
      var o = EDU.unpack(q);
      if (!o || typeof o.c !== 'string') return false;
      var p = E.parse(o.c);
      loadWorkspace('free');
      pushUndo(); S.prog = p; persist();
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- angle helper ---------------- */
  function polySvg(n) {
    var pts = [], a0 = -Math.PI / 2 + (n % 2 ? 0 : Math.PI / n);
    for (var i = 0; i < n; i++) { var a = a0 + i * 2 * Math.PI / n; pts.push((16 * Math.cos(a)).toFixed(1) + ',' + (16 * Math.sin(a)).toFixed(1)); }
    return '<svg viewBox="-19 -19 38 38" width="40" height="40"><polygon points="' + pts.join(' ') + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  }
  function renderAngles() {
    var box = $('#ang-list'); box.textContent = '';
    Object.keys(ANGLE_ROWS).forEach(function (k) {
      var n = Number(k), a = 360 / n;
      box.appendChild(el('div', { class: 'tc-ang' },
        el('div', { class: 'tc-ang-h' }, el('span', { class: 'tc-poly', 'aria-hidden': 'true', html: polySvg(n) }), el('strong', { text: t('sh_' + n) })),
        el('div', { class: 'small' }, t('sides') + ': ', el('b', { class: 'num', text: fmt(n) })),
        el('div', { class: 'small' }, t('turn') + ': ', el('b', { class: 'num', text: fmt(a) + '°' }), ' ', el('span', { class: 'muted num', text: '(360 ÷ ' + fmt(n) + ')' })),
        el('div', { class: 'small' }, t('inner') + ': ', el('b', { class: 'num', text: fmt(180 - a) + '°' })),
        el('button', { type: 'button', class: 'btn btn-sm', id: 'try-' + n, text: '▶ ' + t('try_it'), 'aria-label': t('try_it') + ': ' + t('sh_' + n), onclick: function () {
          if (S.cur !== 'free') switchWs('free');
          setProgram(['repeat ' + n + ' [', '  forward ' + ANGLE_ROWS[n], '  right ' + a, ']'].join('\n'));
          run(); scrollToStage();
        } })));
    });
  }
  function scrollToStage() {
    var r = $('#stage').getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.6) $('#stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------------- drag and drop (mouse, pen, long-press on touch) ---------------- */
  var DR = null, pend = null, dragJustEnded = false;
  function palettePointerDown(e, type) {
    if (e.button) return;
    cancelPend();
    pend = { x: e.clientX, y: e.clientY, id: e.pointerId, touch: e.pointerType === 'touch', src: { kind: 'new', t: type }, timer: 0 };
    var p = pend;
    if (p.touch) p.timer = setTimeout(function () { if (pend === p) startDrag(p, p.x, p.y); }, 450);
    document.addEventListener('pointermove', onPendMove);
    document.addEventListener('pointerup', cancelPend);
    document.addEventListener('pointercancel', cancelPend);
  }
  function onPendMove(e) {
    if (!pend || e.pointerId !== pend.id) return;
    var dx = e.clientX - pend.x, dy = e.clientY - pend.y, d2 = dx * dx + dy * dy;
    if (pend.touch) { if (d2 > 100) cancelPend(); return; }
    if (d2 > 40) startDrag(pend, e.clientX, e.clientY);
  }
  function cancelPend() {
    if (pend && pend.timer) clearTimeout(pend.timer);
    pend = null;
    document.removeEventListener('pointermove', onPendMove);
    document.removeEventListener('pointerup', cancelPend);
    document.removeEventListener('pointercancel', cancelPend);
  }
  function startHandleDrag(e, b) {
    if (e.button) return;
    e.preventDefault();
    startDrag({ id: e.pointerId, touch: e.pointerType === 'touch', src: { kind: 'move', id: b.id, t: b.t } }, e.clientX, e.clientY);
  }
  function startDrag(p, x, y) {
    cancelPend();
    haltForEdit();
    DR = { src: p.src, id: p.id, drop: null, ghost: el('div', { class: 'tc-ghost cat-' + E.TYPES[p.src.t].cat, text: ICON[p.src.t] + ' ' + t('blk_' + p.src.t) }) };
    document.body.appendChild(DR.ghost);
    document.body.classList.add('tc-dragging');
    if (p.touch && navigator.vibrate) { try { navigator.vibrate(15); } catch (e) { } }
    document.addEventListener('pointermove', onDragMove, { passive: false });
    document.addEventListener('pointerup', onDragEnd);
    document.addEventListener('pointercancel', endDrag);
    document.addEventListener('touchmove', blockTouch, { passive: false });
    moveGhost(x, y);
  }
  function blockTouch(e) { if (DR) e.preventDefault(); }
  function onDragMove(e) {
    if (!DR || e.pointerId !== DR.id) return;
    e.preventDefault();
    moveGhost(e.clientX, e.clientY);
    if (e.clientY < 50) window.scrollBy(0, -14); else if (e.clientY > window.innerHeight - 50) window.scrollBy(0, 14);
  }
  function moveGhost(x, y) {
    DR.ghost.style.left = x + 'px'; DR.ghost.style.top = y + 'px';
    var d = dropAt(x, y);
    if (DR.drop && DR.drop.el) DR.drop.el.classList.remove('drop-before', 'drop-after', 'drop-in');
    DR.drop = d;
    if (d && d.el) d.el.classList.add(d.cls);
  }
  function nearestRow(y) {
    var best = null, bd = Infinity;
    $$('#prog .tc-row').forEach(function (r) {
      var rc = r.getBoundingClientRect(), dist = y < rc.top ? rc.top - y : (y > rc.bottom ? y - rc.bottom : 0);
      if (dist < bd) { bd = dist; best = r; }
    });
    return best;
  }
  function dropAt(x, y) {
    var at = document.elementFromPoint(x, y), prog = at && at.closest('#prog');
    if (!prog) return null;
    var mv = DR.src.kind === 'move' ? find(DR.src.id) : null;
    var bad = function (id) { return !!(mv && contains(mv.b, id)); };
    var er = at.closest('.tc-empty-rep');
    if (er) return bad(er.dataset.owner) ? null : { owner: er.dataset.owner, atEnd: false, el: er, cls: 'drop-in' };
    var row = at.closest('.tc-row') || nearestRow(y);
    if (!row) return { owner: null, atEnd: true, el: prog, cls: 'drop-in' };
    var rc = row.getBoundingClientRect(), after = y > rc.top + rc.height / 2, id = row.dataset.id;
    if (bad(id)) return null;
    if (row.dataset.end) return after ? { ref: id, after: true, el: row, cls: 'drop-after' } : { owner: id, atEnd: true, el: row, cls: 'drop-before' };
    if (row.dataset.t === 'repeat' && after) return { owner: id, atEnd: false, el: row, cls: 'drop-after' };
    return { ref: id, after: after, el: row, cls: after ? 'drop-after' : 'drop-before' };
  }
  function resolveDrop(d) {
    if (d.ref) { var f = find(d.ref); return f ? { list: f.list, index: f.i + (d.after ? 1 : 0) } : null; }
    var o = d.owner ? find(d.owner) : null, list = o && o.b.body ? o.b.body : S.prog;
    return { list: list, index: d.atEnd ? list.length : 0 };
  }
  function onDragEnd(e) {
    if (!DR || e.pointerId !== DR.id) return;
    var d = DR.drop, src = DR.src;
    endDrag();
    if (src.kind === 'new') { dragJustEnded = true; setTimeout(function () { dragJustEnded = false; }, 0); }
    if (!d) return;
    var moving = null;
    if (src.kind === 'move') { var f = find(src.id); if (!f) return; moving = f.b; }
    var b = moving || E.make(src.t);
    mutate(function () {
      if (moving) { var f2 = find(moving.id); f2.list.splice(f2.i, 1); }
      var loc = resolveDrop(d) || { list: S.prog, index: S.prog.length };
      loc.list.splice(loc.index, 0, b);
    });
    flash(b.id);
  }
  function endDrag() {
    if (!DR) return;
    if (DR.drop && DR.drop.el) DR.drop.el.classList.remove('drop-before', 'drop-after', 'drop-in');
    DR.ghost.remove();
    document.body.classList.remove('tc-dragging');
    document.removeEventListener('pointermove', onDragMove);
    document.removeEventListener('pointerup', onDragEnd);
    document.removeEventListener('pointercancel', endDrag);
    document.removeEventListener('touchmove', blockTouch);
    DR = null;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && DR) endDrag(); });

  /* ---------------- wiring ---------------- */
  function renderAll() {
    renderPalette(); renderProgram(); renderChips(); renderChallengePanel(); renderSaved(); renderAngles(); renderCmdTable();
    renderStatus(); renderCodeMsg(); updateCounts(); syncCode(); flushUI(); draw();
  }
  $('#run').addEventListener('click', run);
  $('#run2').addEventListener('click', function () { run(); scrollToStage(); });
  $('#step').addEventListener('click', step);
  $('#stop').addEventListener('click', stop);
  $('#undo').addEventListener('click', undo);
  $('#new-prog').addEventListener('click', function () {
    if (S.prog.length && !confirm(t('confirm_new'))) return;
    mutate(function () { S.prog = []; S.target = null; S.codeDirty = false; });
    syncCode();
  });
  $('#speed').addEventListener('input', function () { S.speed = EDU.clamp(Number($('#speed').value) || 6, 1, 10); store.set('speed', S.speed); });
  $('#grid').addEventListener('change', function () { S.grid = $('#grid').checked; store.set('grid', S.grid); draw(); });
  $('#save-png').addEventListener('click', function () { EDU.downloadCanvas(cv, 'turtle-drawing.png'); });
  $('#print-btn').addEventListener('click', function () { window.print(); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#stage')); });
  $('#tab-blocks').addEventListener('click', function () { showTab('blocks'); });
  $('#tab-code').addEventListener('click', function () { showTab('code'); });
  $('#code').addEventListener('input', function () { S.codeDirty = true; if (S.codeMsg) setCodeMsg(null); });
  $('#code').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  });
  $('#apply-code').addEventListener('click', function () {
    if (!S.codeDirty) { setCodeMsg({ key: 'code_ok', kind: 'ok' }); return; }
    applyCode(false);
  });
  $('#copy-code').addEventListener('click', function () { EDU.copy($('#code').value); });
  $('#dl-code').addEventListener('click', function () { EDU.download('turtle-program.txt', $('#code').value + '\n', 'text/plain'); });
  $('#open-file').addEventListener('click', function () {
    EDU.pickFile('.txt,.logo,text/plain').then(function (f) {
      if (!f) return;
      if (f.size > 200000) { EDU.toast(t('err_file')); return; }
      return EDU.readText(f).then(function (txt) { $('#code').value = txt; S.codeDirty = true; showTab('code', true); applyCode(false); });
    }).catch(function () { EDU.toast(t('err_file')); });
  });
  $('#save-btn').addEventListener('click', saveProgram);
  $('#save-name').addEventListener('keydown', function (e) { if (e.key === 'Enter') saveProgram(); });
  $('#share-btn').addEventListener('click', shareLink);
  $('#reset-all').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['ws', 'stars', 'polyN', 'cur', 'saved', 'tab'].forEach(function (k) { store.remove(k); });
    S.ws = {}; S.stars = {}; S.saved = []; S.polyN = 6;
    switchWs('free'); instantRun(); draw();
  });
  window.addEventListener('beforeprint', function () { printing = true; readColors(); redrawLayer(); draw(); });
  window.addEventListener('afterprint', function () { printing = false; readColors(); redrawLayer(); draw(); });
  EDU.onTheme(function () { readColors(); redrawLayer(); draw(); renderProgram(); });
  EDU.onLang(renderAll);
  if (window.ResizeObserver) new ResizeObserver(function () { resize(); }).observe($('#cv-wrap'));
  window.addEventListener('resize', function () { resize(); });

  /* ---------------- start ---------------- */
  readColors();
  var fromLink = readLink();
  if (!fromLink) loadWorkspace(S.cur);
  $('#speed').value = String(S.speed);
  $('#grid').checked = S.grid;
  showTab(store.get('tab', 'blocks') === 'code' ? 'code' : 'blocks', true);
  renderAll();
  resize(true);
  if (S.cur === 'free' && !fromLink) instantRun();
  setStatus(fromLink ? 'link_loaded' : 'status_ready');
  updateButtons();
  draw();

  /* small hook for automated tests and curious teachers */
  window.TurtleApp = { engine: E, state: S, anim: A, check: function () { return target ? E.check(A.segs, target.segs) : null; } };
})();
