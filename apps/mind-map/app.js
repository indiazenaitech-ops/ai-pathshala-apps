/* Mind Map Maker: SVG mind maps with pan/zoom, auto layout, outline view, undo/redo,
   templates, PNG / JSON / text export and print. Everything stays on this device. */
(function () {
  'use strict';
  var SLUG = 'mind-map';
  var store = EDU.store(SLUG);
  var MAX_NODES = 1000, MAX_TEXT = 300, MAX_UNDO = 80, MAX_DEPTH = 40, MAX_MAPS = 80;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var TPLS = ['blank', 'chapter', 'essay', 'project', 'five_w', 'sample'];
  var TPL_ICON = { blank: '⭕', chapter: '📖', essay: '✍️', project: '🛠️', five_w: '❓', sample: '💧' };
  var LAYOUTS = ['both', 'radial', 'tree', 'list'];
  /* light palette for PNG / print (same as the edu.css light tokens) */
  var LIGHT = { primary: '#0b4f5c', ink: '#ffffff', text: '#1b2a30', muted: '#5a6a70', surface: '#ffffff', border: '#e3d8c9', accent: '#d9501c',
    c: ['#0b4f5c', '#0b7285', '#e8590c', '#5f3dc4', '#2b8a3e', '#c2255c', '#b08900', '#1971c2', '#868e96'] };
  var LV = [
    { fs: 22, fw: 700, maxW: 240, px: 18, py: 12 },
    { fs: 17, fw: 600, maxW: 210, px: 14, py: 9 },
    { fs: 15, fw: 500, maxW: 190, px: 12, py: 7 }
  ];
  var HGAP = 54, HGAP_ROOT = 70, VGAP = 14;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  var $ = EDU.$, t = EDU.t;
  var appEl = $('#mm-app'), stage = $('#mm-stage'), vp = $('#mm-vp');
  var gEdges = $('#mm-edges'), gNodes = $('#mm-nodes'), editor = $('#mm-editor'), olBox = $('#mm-outline');

  /* ------------------------------------------------------------ model */
  function uid() { uid.k = (uid.k || 0) + 1; return 'n' + Math.random().toString(36).slice(2, 8) + uid.k.toString(36); }
  function templates() { var C = window.APP_CONTENT || {}; return (C[EDU.lang] || C.en || {}).templates || {}; }
  /* template lines: every two spaces of indent = one level smaller */
  function treeFromLines(lines) {
    var root = null, stack = [];
    (lines || []).forEach(function (raw) {
      var m = /^( *)(.*)$/.exec(String(raw)), s = m[2].trim();
      if (!s) return;
      var n = { id: uid(), text: s.slice(0, MAX_TEXT), children: [] };
      if (!root) { root = n; stack = [n]; return; }
      var d = EDU.clamp(Math.floor(m[1].length / 2), 1, stack.length);
      stack.length = d; stack[d - 1].children.push(n); stack.push(n);
    });
    return root || { id: uid(), text: t('untitled'), children: [] };
  }
  function colorRoot(root) { root.children.forEach(function (c, i) { c.color = (i % 8) + 1; }); }
  function tplData(tpl) { var T = templates(); return T[tpl] || T.blank || { name: t('untitled'), lines: [t('untitled')] }; }
  /* on a phone the "top down" list fits the narrow screen better than a wide "both sides" map */
  function defaultLayout() { return window.matchMedia && matchMedia('(max-width: 600px)').matches ? 'list' : 'both'; }
  function makeMap(tpl) {
    var tc = tplData(tpl), root = treeFromLines(tc.lines); colorRoot(root);
    return { id: uid(), name: tc.name, no: 0, layout: defaultLayout(), root: root, tpl: tpl, dirty: false, autoName: true, updated: Date.now() };
  }
  function regen(m) {                              /* an untouched template map follows the page language */
    var T = templates(), tc = T[m.tpl]; if (!tc) return;
    m.name = tc.name + (m.no > 1 ? ' ' + m.no : '');
    m.root = treeFromLines(tc.lines); colorRoot(m.root);
  }

  /* make any loaded / imported tree safe: strings, arrays, sane sizes, fresh unique ids */
  function cleanNode(n, depth, budget, seen) {
    if (!n || typeof n !== 'object') n = {};
    var out = { id: (typeof n.id === 'string' && n.id && n.id.length < 40 && !seen[n.id]) ? n.id : uid(),
      text: String(n.text == null ? (n.t == null ? '' : n.t) : n.text).slice(0, MAX_TEXT), children: [] };
    seen[out.id] = 1; budget.n++;
    var col = parseInt(n.color, 10); if (col >= 1 && col <= 8) out.color = col;
    if (n.collapsed) out.collapsed = true;
    if (isFinite(n.x) && isFinite(n.y) && n.x !== null && n.y !== null && Math.abs(n.x) < 1e6 && Math.abs(n.y) < 1e6) { out.x = +n.x; out.y = +n.y; }
    var kids = Array.isArray(n.children) ? n.children : (Array.isArray(n.c) ? n.c : []);
    if (depth < MAX_DEPTH) for (var i = 0; i < kids.length && budget.n < MAX_NODES; i++) out.children.push(cleanNode(kids[i], depth + 1, budget, seen));
    return out;
  }
  function cleanMap(m) {
    if (!m || typeof m !== 'object' || !m.root || typeof m.root !== 'object') return null;
    var root = cleanNode(m.root, 0, { n: 0 }, {});
    root.children.forEach(function (c, i) { if (!c.color) c.color = (i % 8) + 1; });
    delete root.color; delete root.collapsed;
    var lay = LAYOUTS.indexOf(m.layout) >= 0 || m.layout === 'free' ? m.layout : 'both';
    if (lay === 'free' && root.x === undefined) lay = 'both';
    var tpl = TPLS.indexOf(m.tpl) >= 0 ? m.tpl : null;
    return { id: typeof m.id === 'string' && m.id && m.id.length < 40 ? m.id : uid(), name: String(m.name || root.text || t('untitled')).slice(0, 120),
      no: EDU.clamp(parseInt(m.no, 10) || 0, 0, 999), layout: lay, root: root, tpl: tpl, dirty: m.dirty !== false || !tpl,
      autoName: !!m.autoName, updated: +m.updated || Date.now() };
  }

  var maps = store.get('maps', null);
  maps = Array.isArray(maps) ? maps.map(cleanMap).filter(Boolean).slice(0, MAX_MAPS) : [];
  if (!maps.length) maps = [makeMap('sample')];
  (function () { var seen = {}; maps.forEach(function (m) { if (seen[m.id]) m.id = uid(); seen[m.id] = 1; }); })();
  maps.forEach(function (m) { if (!m.dirty && m.tpl) regen(m); });
  var curId = store.get('cur', '');
  var map = maps.filter(function (m) { return m.id === curId; })[0] || maps[0];

  var sel = map.root.id;
  var undoStack = [], redoStack = [];
  var view = { s: 1, tx: 0, ty: 0 }, userMoved = false;
  var editing = null;                 /* {id, isNew, before, snap} */
  var dropTarget = null;              /* node id under a dragged idea */
  var idx = {};                       /* id -> {n, p, d, c(colour index), vis} */
  var L = {};                         /* id -> layout box {x, y, w, h, lines, rtl, lh, d, side} */
  var viewMode = store.get('view', 'both');
  if (['map', 'outline', 'both'].indexOf(viewMode) < 0) viewMode = 'both';

  function reindex() {
    idx = {}; var total = 0, vis = 0;
    (function walk(n, p, d, c, visible) {
      var col = d === 0 ? 0 : (n.color || c || 1);
      idx[n.id] = { n: n, p: p, d: d, c: col, vis: visible };
      total++; if (visible) vis++;
      n.children.forEach(function (k) { walk(k, n, d + 1, col, visible && !n.collapsed); });
    })(map.root, null, 0, 0, true);
    appEl.dataset.count = total; appEl.dataset.visible = vis; appEl.dataset.layout = map.layout;
    appEl.dataset.maps = maps.length; appEl.dataset.sel = sel || ''; appEl.dataset.map = map.id;
    return total;
  }
  function info(id) { return idx[id] || null; }
  function countAll(n) { var k = 1; n.children.forEach(function (c) { k += countAll(c); }); return k; }
  function snapshot() { return JSON.stringify({ root: map.root, layout: map.layout }); }
  function pushUndo(s) { undoStack.push(s || snapshot()); if (undoStack.length > MAX_UNDO) undoStack.shift(); redoStack = []; }

  /* ------------------------------------------------------------ text measuring + wrapping */
  var mctx = document.createElement('canvas').getContext('2d');
  var mcache = {};
  var RTL_RE = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
  var famCache = null;
  function family() { return getComputedStyle(document.body).fontFamily || 'sans-serif'; }
  function lv(d) { return LV[Math.min(d, 2)]; }
  function fontStr(d, fam) { var v = lv(d); return v.fw + ' ' + v.fs + 'px ' + (fam || famCache || (famCache = family())); }
  function graphemes(s) {
    if (window.Intl && Intl.Segmenter) { try { return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s), function (x) { return x.segment; }); } catch (e) { } }
    return Array.from(s);
  }
  function wrapText(text, d) {
    var key = Math.min(d, 2) + '|' + text;
    if (mcache[key]) return mcache[key];
    mctx.font = fontStr(d);
    var maxW = lv(d).maxW, lines = [], widest = 0;
    var W = function (s) { return mctx.measureText(s).width; };
    String(text || '').split(/\r?\n/).slice(0, 12).forEach(function (para) {
      var words = para.split(/(\s+)/), line = '';
      words.forEach(function (w) {
        if (!w) return;
        var test = line + w;
        if (W(test.trim()) <= maxW || !line.trim()) {
          if (W(test.trim()) > maxW && !line.trim()) {          /* one very long word: break it */
            var g = graphemes(w), part = '';
            g.forEach(function (ch) { if (W(part + ch) > maxW && part) { lines.push(part); part = ch; } else part += ch; });
            line = part;
          } else line = test;
        } else { lines.push(line.trim()); line = /^\s+$/.test(w) ? '' : w; }
      });
      lines.push(line.trim());
    });
    if (!lines.length) lines = [''];
    lines.forEach(function (l) { widest = Math.max(widest, W(l)); });
    var r = { lines: lines, w: widest, rtl: RTL_RE.test(text) };
    mcache[key] = r;
    return r;
  }
  function measure(n, d) {
    var v = lv(d), wr = wrapText(n.text || '…', d);
    var lh = v.fs * (wr.rtl ? 1.75 : 1.32);
    var w = Math.max(wr.w, d === 0 ? 90 : 40) + v.px * 2, h = wr.lines.length * lh + v.py * 2;
    return { w: Math.ceil(w), h: Math.ceil(h), lines: wr.lines, rtl: wr.rtl, lh: lh, d: d };
  }

  /* ------------------------------------------------------------ layout */
  function visKids(n) { return n.collapsed ? [] : n.children; }
  function measureAll() {
    L = {};
    (function walk(n, d) { L[n.id] = measure(n, d); visKids(n).forEach(function (k) { walk(k, d + 1); }); })(map.root, 0);
  }
  function blockH(n) {
    var b = L[n.id], kids = visKids(n);
    if (!kids.length) return (b.bh = b.h);
    var s = 0; kids.forEach(function (k) { s += blockH(k); });
    s += VGAP * (kids.length - 1);
    return (b.bh = Math.max(b.h, s));
  }
  function placeKids(n, dir) {
    var b = L[n.id], kids = visKids(n);
    if (!kids.length) return;
    var total = -VGAP; kids.forEach(function (k) { total += L[k.id].bh + VGAP; });
    var y = b.y - total / 2;
    kids.forEach(function (k) {
      var kb = L[k.id];
      kb.x = b.x + dir * (b.w / 2 + HGAP + kb.w / 2);
      kb.y = y + kb.bh / 2; kb.side = dir;
      placeKids(k, dir);
      y += kb.bh + VGAP;
    });
  }
  function placeColumn(list, root, dir) {
    var rb = L[root.id], gap = VGAP * 1.6, total = -gap;
    list.forEach(function (k) { total += L[k.id].bh + gap; });
    var y = rb.y - total / 2;
    list.forEach(function (k) {
      var kb = L[k.id];
      kb.x = rb.x + dir * (rb.w / 2 + HGAP_ROOT + kb.w / 2); kb.y = y + kb.bh / 2; kb.side = dir;
      placeKids(k, dir);
      y += kb.bh + gap;
    });
  }
  function layoutTree() {
    var r = map.root, rb = L[r.id]; rb.x = 0; rb.y = 0;
    blockH(r);
    if (map.layout === 'tree') { placeColumn(visKids(r), r, 1); return; }
    /* split the main branches so that both columns are about equally tall (ties: right side gets more) */
    var kids = visKids(r), total = 0, acc = 0, cut = kids.length, diffs = [], best = Infinity, i;
    kids.forEach(function (k) { total += L[k.id].bh; });
    for (i = 1; i <= kids.length; i++) { acc += L[kids[i - 1].id].bh; diffs[i] = Math.abs(2 * acc - total); best = Math.min(best, diffs[i]); }
    for (i = 1; i <= kids.length; i++) if (diffs[i] <= best + 24) cut = i;
    if (kids.length >= 2 && cut === kids.length) cut = kids.length - 1;
    placeColumn(kids.slice(0, cut), r, 1);
    placeColumn(kids.slice(cut).reverse(), r, -1);          /* clockwise, like a clock face */
  }
  function layoutRadial() {
    var r = map.root, maxW = [], sumS = [];
    (function walk(n, d) {
      var b = L[n.id];
      maxW[d] = Math.max(maxW[d] || 0, b.w);
      sumS[d] = (sumS[d] || 0) + (b.w + b.h) / 2 + 22;
      visKids(n).forEach(function (k) { walk(k, d + 1); });
    })(r, 0);
    var rad = [0];
    for (var d = 1; d < maxW.length; d++) {
      var ring = rad[d - 1] + (d === 1 ? Math.max(L[r.id].w, L[r.id].h) * 0.55 : maxW[d - 1] / 2) + maxW[d] / 2 + 46;
      rad[d] = Math.max(ring, sumS[d] / (2 * Math.PI) * 1.15);
    }
    function leaves(n) { var s = 0; visKids(n).forEach(function (c) { s += leaves(c); }); return (L[n.id].lv = Math.max(1, s)); }
    leaves(r);
    (function place(n, d, a0, a1) {
      var b = L[n.id];
      if (d === 0) { b.x = 0; b.y = 0; } else { var a = (a0 + a1) / 2; b.x = Math.cos(a) * rad[d]; b.y = Math.sin(a) * rad[d]; }
      var kids = visKids(n), tot = 0, from = a0;
      kids.forEach(function (k) { tot += L[k.id].lv; });
      kids.forEach(function (k) { var span = (a1 - a0) * L[k.id].lv / tot; place(k, d + 1, from, from + span); from += span; });
    })(r, 0, -Math.PI / 2, Math.PI * 1.5);
  }
  /* free layout: saved positions; new ideas get a spot next to their parent */
  function layoutFree() {
    var r = map.root, rb = L[r.id];
    if (r.x === undefined) { r.x = 0; r.y = 0; }
    rb.x = r.x; rb.y = r.y;
    (function walk(n) {
      visKids(n).forEach(function (k) {
        var kb = L[k.id];
        if (k.x === undefined || k.y === undefined) placeNew(k, n);
        kb.x = k.x; kb.y = k.y;
        walk(k);
      });
    })(r);
  }
  function placeNew(k, p) {
    var pb = L[p.id], kb = L[k.id], r = map.root, isRoot = p === r, side;
    if (isRoot) {
      var right = 0, left = 0;
      p.children.forEach(function (c) { if (c !== k && c.x !== undefined) { if (c.x >= r.x) right++; else left++; } });
      side = right <= left ? 1 : -1;
    } else side = (p.x - r.x) < 0 ? -1 : 1;
    var bottom = null;
    p.children.forEach(function (c) {
      if (c === k || c.x === undefined || !L[c.id]) return;
      if (isRoot && ((c.x >= r.x ? 1 : -1) !== side)) return;
      bottom = Math.max(bottom === null ? -Infinity : bottom, c.y + L[c.id].h / 2);
    });
    k.x = p.x + side * (pb.w / 2 + (isRoot ? HGAP_ROOT : HGAP) + kb.w / 2);
    k.y = bottom === null ? p.y : bottom + VGAP + kb.h / 2;
  }
  function doLayout() {
    measureAll();
    if (map.layout === 'radial') layoutRadial();
    else if (map.layout === 'free') layoutFree();
    else if (map.layout === 'list') layoutList();
    else layoutTree();
  }
  /* "top down": an indented tree that reads like a list and fits a narrow phone screen */
  function layoutList() {
    var y = 0;
    (function walk(n, d) {
      var b = L[n.id];
      b.x = d * 36 + b.w / 2; b.y = y + b.h / 2; b.side = 1;
      y += b.h + (d === 0 ? 18 : 10);
      visKids(n).forEach(function (k) { walk(k, d + 1); });
    })(map.root, 0);
  }
  /* switch to free layout, keeping what is on screen */
  function toFree() {
    if (map.layout === 'free') return;
    (function walk(n) { var b = L[n.id]; if (b) { n.x = Math.round(b.x); n.y = Math.round(b.y); } else { delete n.x; delete n.y; } n.children.forEach(walk); })(map.root);
    map.layout = 'free';
  }
  function clearSub(n) { delete n.x; delete n.y; n.children.forEach(clearSub); }
  function clearPositions() { clearSub(map.root); }

  /* ------------------------------------------------------------ SVG rendering */
  function S(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function colVar(c) { return c === 0 ? 'var(--primary)' : 'var(--c' + c + ')'; }
  function r1(v) { return Math.round(v * 10) / 10; }
  /* curved connector between two boxes: side to side, or top/bottom when they are stacked */
  function edgeGeo(pb, cb, horiz) {
    var dx = cb.x - pb.x, dy = cb.y - pb.y;
    var gx = Math.abs(dx) - (pb.w + cb.w) / 2, gy = Math.abs(dy) - (pb.h + cb.h) / 2;
    var h = horiz || gx >= gy, x1, y1, x2, y2, c1x, c1y, c2x, c2y, k;
    if (h) {
      var sx = dx >= 0 ? 1 : -1;
      x1 = pb.x + sx * pb.w / 2; y1 = pb.y; x2 = cb.x - sx * cb.w / 2; y2 = cb.y;
      k = Math.max(14, Math.abs(x2 - x1) * 0.55);
      c1x = x1 + sx * k; c1y = y1; c2x = x2 - sx * k; c2y = y2;
    } else {
      var sy = dy >= 0 ? 1 : -1;
      x1 = pb.x; y1 = pb.y + sy * pb.h / 2; x2 = cb.x; y2 = cb.y - sy * cb.h / 2;
      k = Math.max(14, Math.abs(y2 - y1) * 0.55);
      c1x = x1; c1y = y1 + sy * k; c2x = x2; c2y = y2 - sy * k;
    }
    return { h: h, pts: [x1, y1, c1x, c1y, c2x, c2y, x2, y2] };
  }
  /* SVG path of the connector (also drawn on the PNG canvas through Path2D) */
  function edgeD(pb, cb) {
    if (map.layout === 'list') {
      var x1 = pb.x - pb.w / 2 + 16, y1 = pb.y + pb.h / 2, x2 = cb.x - cb.w / 2, y2 = cb.y;
      var rr = Math.max(0, Math.min(10, x2 - x1, y2 - y1));
      return 'M' + r1(x1) + ' ' + r1(y1) + 'V' + r1(y2 - rr) + 'Q' + r1(x1) + ' ' + r1(y2) + ' ' + r1(x1 + rr) + ' ' + r1(y2) + 'H' + r1(x2);
    }
    var p = edgeGeo(pb, cb, map.layout === 'both' || map.layout === 'tree').pts;
    return 'M' + r1(p[0]) + ' ' + r1(p[1]) + 'C' + r1(p[2]) + ' ' + r1(p[3]) + ' ' + r1(p[4]) + ' ' + r1(p[5]) + ' ' + r1(p[6]) + ' ' + r1(p[7]);
  }
  /* top down: draw the last branch first, so each piece of the shared trunk has the colour of the branch it leads to */
  function edgeKids(n) { var k = visKids(n); return map.layout === 'list' ? k.slice().reverse() : k; }
  function edgeWidth(d) { return d === 1 ? 4.5 : d === 2 ? 2.8 : 2; }
  /* where the fold button of an idea sits (the side that faces its children) */
  function togglePos(n) {
    var i = info(n.id), b = L[n.id], pb = L[i.p.id];
    if (map.layout === 'both' || map.layout === 'tree' || map.layout === 'list') { var s = b.side || 1; return [s * (b.w / 2 + 11), 0]; }
    var g = edgeGeo(pb, b, false);
    if (g.h) return [(b.x >= pb.x ? 1 : -1) * (b.w / 2 + 11), 0];
    return [0, (b.y >= pb.y ? 1 : -1) * (b.h / 2 + 11)];
  }

  function renderMap() {
    reindex();
    doLayout();
    gEdges.textContent = ''; gNodes.textContent = '';
    var selG = null;
    (function walk(n) {
      var i = idx[n.id], b = L[n.id];
      edgeKids(n).forEach(function (k) {
        var ki = idx[k.id];
        var path = S('path', { class: 'mm-edge', d: edgeD(b, L[k.id]), 'stroke-width': edgeWidth(ki.d) }, gEdges);
        path.style.setProperty('--b', colVar(ki.c));
      });
      var d = i.d, v = lv(d);
      var g = S('g', { class: 'mm-node l' + Math.min(d, 2) + (n.id === sel ? ' sel' : '') + (n.text ? '' : ' empty') + (n.id === dropTarget ? ' drop' : ''),
        transform: 'translate(' + r1(b.x) + ' ' + r1(b.y) + ')', 'data-id': n.id, 'data-root': d === 0 ? '1' : null, 'data-depth': d }, gNodes);
      g.style.setProperty('--b', colVar(i.c));
      var rx = d === 0 ? 16 : d === 1 ? 12 : 9;
      S('rect', { class: 'mm-ring', x: -b.w / 2 - 5, y: -b.h / 2 - 5, width: b.w + 10, height: b.h + 10, rx: rx + 4 }, g);
      S('rect', { class: 'mm-box', x: -b.w / 2, y: -b.h / 2, width: b.w, height: b.h, rx: rx }, g);
      var tx = S('text', { class: 'mm-txt', 'text-anchor': 'middle', 'font-size': v.fs, 'font-weight': v.fw, direction: b.rtl ? 'rtl' : null }, g);
      b.lines.forEach(function (line, li) {
        var ts = S('tspan', { x: 0, y: r1(-b.h / 2 + v.py + (li + 0.5) * b.lh), 'dominant-baseline': 'central' }, tx);
        ts.textContent = line || (n.text ? '' : '…');
      });
      if (d > 0 && n.children.length && (n.collapsed || n.id === sel)) {
        var tp = togglePos(n);
        var tg = S('g', { class: 'mm-tog' + (n.collapsed ? ' closed' : ''), transform: 'translate(' + r1(tp[0]) + ' ' + r1(tp[1]) + ')' }, g);
        S('circle', { r: n.collapsed ? 12 : 10 }, tg);
        var tt = S('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', y: 0.5 }, tg);
        tt.textContent = n.collapsed ? EDU.fmt(Math.min(countAll(n) - 1, 999)) : '−';
      }
      if (n.id === sel) selG = g;
      visKids(n).forEach(walk);
    })(map.root);
    if (selG) gNodes.appendChild(selG);                     /* selected idea on top */
    applyView();
    updateUI();
  }

  /* ------------------------------------------------------------ view (pan / zoom) */
  function stageSize() { return { w: stage.clientWidth, h: stage.clientHeight }; }
  function applyView() {
    vp.setAttribute('transform', 'translate(' + r1(view.tx) + ' ' + r1(view.ty) + ') scale(' + Math.round(view.s * 1000) / 1000 + ')');
    var gs = 24 * view.s;
    stage.style.backgroundSize = gs + 'px ' + gs + 'px';
    stage.style.backgroundPosition = r1(view.tx) + 'px ' + r1(view.ty) + 'px';
    $('#mm-zpct').textContent = Math.round(view.s * 100) + '%';
    if (editing) positionEditor();
  }
  function bounds() {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    Object.keys(idx).forEach(function (id) {
      var b = L[id]; if (!b || !idx[id].vis) return;
      x0 = Math.min(x0, b.x - b.w / 2); x1 = Math.max(x1, b.x + b.w / 2);
      y0 = Math.min(y0, b.y - b.h / 2); y1 = Math.max(y1, b.y + b.h / 2);
    });
    if (!isFinite(x0)) { x0 = -100; y0 = -50; x1 = 100; y1 = 50; }
    return { x0: x0 - 16, y0: y0 - 16, x1: x1 + 16, y1: y1 + 16 };
  }
  function fit() {
    var sz = stageSize(); if (!sz.w || !sz.h) return;
    var b = bounds(), bw = b.x1 - b.x0, bh = b.y1 - b.y0;
    var hint = $('#mm-hint'), top = hint.classList.contains('gone') ? 8 : hint.offsetTop + hint.offsetHeight + 4;
    var bottom = 56, aw = sz.w - 24, ah = Math.max(60, sz.h - top - bottom);
    var s = Math.min(aw / bw, ah / bh);
    if (map.layout === 'list') s = Math.max(s, Math.min(aw / bw, 1));      /* fit the width, scroll down for the rest */
    /* phones: never shrink below a readable size; show the centre topic and let the user pan */
    view.s = EDU.clamp(s, sz.w < 600 ? 0.5 : 0.2, 1.3);
    var rb = L[map.root.id] || { x: 0, y: 0 };
    if (bw * view.s <= aw) view.tx = sz.w / 2 - (b.x0 + bw / 2) * view.s;
    else if (map.layout === 'tree' || map.layout === 'list') view.tx = 12 - b.x0 * view.s;
    else view.tx = sz.w / 2 - rb.x * view.s;
    if (bh * view.s <= ah) view.ty = top + ah / 2 - (b.y0 + bh / 2) * view.s;
    else if (map.layout === 'list') view.ty = top - b.y0 * view.s;
    else view.ty = top + ah / 2 - rb.y * view.s;
    userMoved = false;
    applyView();
  }
  function zoomBy(f, lx, ly) {
    var sz = stageSize();
    if (lx === undefined) { lx = sz.w / 2; ly = sz.h / 2; }
    var ns = EDU.clamp(view.s * f, 0.2, 3);
    view.tx = lx - (lx - view.tx) * ns / view.s;
    view.ty = ly - (ly - view.ty) * ns / view.s;
    view.s = ns; userMoved = true;
    applyView();
  }
  function ensureVisible(id) {
    var b = L[id], sz = stageSize(); if (!b || !sz.w) return;
    var s = view.s;
    var x0 = view.tx + (b.x - b.w / 2) * s, x1 = view.tx + (b.x + b.w / 2) * s;
    var y0 = view.ty + (b.y - b.h / 2) * s, y1 = view.ty + (b.y + b.h / 2) * s;
    var dx = 0, dy = 0;
    if (x1 > sz.w - 20) dx = sz.w - 20 - x1;
    if (x0 + dx < 20) dx = 20 - x0;
    if (y1 > sz.h - 60) dy = sz.h - 60 - y1;
    if (y0 + dy < 12) dy = 12 - y0;
    if (dx || dy) { view.tx += dx; view.ty += dy; applyView(); }
  }
  function hideHint() { $('#mm-hint').classList.add('gone'); }

  /* ------------------------------------------------------------ toolbar + status */
  function updateUI() {
    var i = info(sel), isRoot = !!i && i.d === 0;
    $('#mm-child').disabled = !i;
    $('#mm-sib').disabled = !i;
    $('#mm-edit').disabled = !i;
    $('#mm-del').disabled = !i || isRoot;
    $('#mm-fold').disabled = !i || isRoot || !i.n.children.length;
    $('#mm-colbtn').disabled = !i || isRoot;
    if ($('#mm-colbtn').disabled && !$('#mm-colors').hidden) toggleColors(false);
    $('#mm-undo').disabled = !undoStack.length;
    $('#mm-redo').disabled = !redoStack.length;
    $('#mm-colbtn').style.setProperty('--mm-cur', colVar(i ? i.c : 0));
    EDU.$$('#mm-colors .mm-sw').forEach(function (b) { b.setAttribute('aria-pressed', String(!!i && !isRoot && +b.dataset.c === i.c)); });
    EDU.$$('#mm-layout button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.layout === map.layout)); });
    EDU.$$('#mm-view button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === viewMode)); });
    var st = $('#mm-status'), cnt = +appEl.dataset.count;
    st.textContent = '';
    st.appendChild(EDU.el('b', { text: cnt === 1 ? t('one_idea') : t('n_ideas', { n: EDU.fmt(cnt) }) }));
    if (i) {
      st.appendChild(document.createTextNode(' · ' + t('selected') + ' '));
      st.appendChild(EDU.el('span', { class: 'no-i18n', dir: 'auto', text: (i.n.text || '…').slice(0, 60) }));
    }
    if (map.layout === 'free') st.appendChild(document.createTextNode(' · ' + t('free_note')));
  }

  /* ------------------------------------------------------------ save + render */
  var saveTimer = null, warnedFull = false;
  function saveNow() {
    clearTimeout(saveTimer); saveTimer = null;
    var ok = store.set('maps', maps);
    store.set('cur', map.id); store.set('view', viewMode);
    if (!ok && !warnedFull) { warnedFull = true; EDU.toast(t('save_failed')); }
  }
  function save() { map.updated = Date.now(); clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 300); }
  window.addEventListener('pagehide', function () { if (saveTimer) saveNow(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && saveTimer) saveNow(); });

  function render(opts) {
    opts = opts || {};
    renderMap();
    if (opts.keepOutline) markOutlineSel(); else renderOutline(opts.focus);
  }
  function changed(opts) { map.dirty = true; save(); render(opts); }
  var rafPending = false;
  function scheduleMap() {
    if (rafPending) return; rafPending = true;
    requestAnimationFrame(function () { rafPending = false; renderMap(); markOutlineSel(); });
  }
  /* the map name follows the centre topic until the user renames the map */
  function uniqueName(name, self) {
    var base = name, k = 2;
    while (maps.some(function (m) { return m !== self && m.name === name; })) name = base + ' ' + k++;
    return name;
  }
  function syncName() {
    if (!map.autoName) return;
    var txt = String(map.root.text || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!txt || txt === map.name) return;
    map.name = uniqueName(txt, map); map.no = 0;
    renderMapList();
  }

  /* ------------------------------------------------------------ selection + structure */
  function select(id, opts) {
    if (!idx[id]) id = map.root.id;
    sel = id;
    renderMap(); markOutlineSel();
    if (!opts || !opts.noScroll) ensureVisible(id);
  }
  function nextColor(p) {
    var used = [0, 0, 0, 0, 0, 0, 0, 0, 0], best = 1;
    p.children.forEach(function (c) { if (c.color) used[c.color]++; });
    for (var c = 1; c <= 8; c++) if (used[c] < used[best]) best = c;
    return best;
  }
  function canAdd() {
    if (reindex() >= MAX_NODES) { EDU.toast(t('too_many', { n: EDU.fmt(MAX_NODES) })); return false; }
    return true;
  }
  function addChildOf(p, index) {
    if (!canAdd()) return null;
    pushUndo();
    var n = { id: uid(), text: '', children: [] };
    if (p === map.root) n.color = nextColor(p);
    delete p.collapsed;
    if (index === undefined) p.children.push(n); else p.children.splice(index, 0, n);
    sel = n.id; map.dirty = true; save();
    return n;
  }
  function removeNode(i) { var s = i.p.children, at = s.indexOf(i.n); if (at >= 0) s.splice(at, 1); }
  function mapAddChild() {
    commitEdit();
    var i = info(sel) || info(map.root.id);
    var n = addChildOf(i.n); if (!n) return;
    hideHint(); render(); ensureVisible(n.id); startEdit(n.id, true);
  }
  function mapAddSibling() {
    commitEdit();
    var i = info(sel);
    if (!i || i.d === 0) { mapAddChild(); return; }
    var n = addChildOf(i.p, i.p.children.indexOf(i.n) + 1); if (!n) return;
    hideHint(); render(); ensureVisible(n.id); startEdit(n.id, true);
  }
  function deleteSel() {
    commitEdit();
    var i = info(sel); if (!i) return;
    if (i.d === 0) { EDU.toast(t('cant_delete_root')); return; }
    var k = countAll(i.n), sibs = i.p.children, at = sibs.indexOf(i.n);
    pushUndo(); removeNode(i);
    sel = (sibs[at - 1] || sibs[at] || i.p).id;
    changed();
    if (k > 1) EDU.toast(t('deleted_n', { n: EDU.fmt(k) }));
  }
  function isInside(id, n) { var found = false; (function w(x) { if (x.id === id) found = true; else x.children.forEach(w); })(n); return found; }
  function toggleFold(id) {
    var i = info(id); if (!i || i.d === 0 || !i.n.children.length) return;
    pushUndo();
    if (i.n.collapsed) delete i.n.collapsed; else i.n.collapsed = true;
    if (i.n.collapsed && sel && sel !== id && isInside(sel, i.n)) sel = id;
    changed();
  }
  function setColor(c) {
    var i = info(sel); if (!i || i.d === 0) return;
    if (i.n.color === c) return;
    pushUndo(); i.n.color = c; changed();
  }
  function moveSibling(dir) {
    var i = info(sel); if (!i || i.d === 0) return false;
    var s = i.p.children, at = s.indexOf(i.n), to = at + dir;
    if (to < 0 || to >= s.length) return false;
    pushUndo(); s.splice(at, 1); s.splice(to, 0, i.n);
    if (map.layout === 'free') {                          /* swap places on the canvas too (whole branches) */
      var o = s[at], b1 = L[i.n.id], b2 = L[o.id];
      if (b1 && b2) { shiftSub(i.n, 0, b2.y - b1.y); shiftSub(o, 0, b1.y - b2.y); }
    }
    map.dirty = true; save();
    return true;
  }
  function shiftSub(n, dx, dy) { if (n.x !== undefined) { n.x += dx; n.y += dy; } n.children.forEach(function (k) { shiftSub(k, dx, dy); }); }
  function indent(id) {
    var i = info(id); if (!i || i.d === 0) return false;
    var s = i.p.children, at = s.indexOf(i.n); if (at <= 0) return false;
    pushUndo();
    var prev = s[at - 1]; s.splice(at, 1);
    delete prev.collapsed; prev.children.push(i.n);
    delete i.n.color;
    if (map.layout === 'free') clearSub(i.n);
    return true;
  }
  function outdent(id) {
    var i = info(id); if (!i || i.d <= 1) return false;
    var gp = info(i.p.id).p;
    pushUndo();
    removeNode(i);
    gp.children.splice(gp.children.indexOf(i.p) + 1, 0, i.n);
    if (gp === map.root) i.n.color = i.n.color || nextColor(gp);
    if (map.layout === 'free') clearSub(i.n);
    return true;
  }
  /* drop an idea on another idea: it moves (with its branch) under that idea */
  function reparent(id, targetId, prevLayout) {
    var i = info(id), ti = info(targetId);
    if (!i || !ti || i.d === 0 || i.p === ti.n || isInside(targetId, i.n)) return false;
    removeNode(i);
    delete ti.n.collapsed;
    ti.n.children.push(i.n);
    if (ti.n === map.root) i.n.color = nextColor(ti.n); else delete i.n.color;
    if (prevLayout !== 'free') { map.layout = prevLayout; clearPositions(); } else clearSub(i.n);
    sel = id;
    return true;
  }

  /* ------------------------------------------------------------ undo / redo */
  function restore(s) {
    var o = JSON.parse(s);
    map.root = o.root; map.layout = o.layout;
    reindex();
    if (!idx[sel]) sel = map.root.id;
    map.dirty = true; save(); render(); syncName();
  }
  function undo() { if (editing) cancelEdit(); if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
  function redo() { if (editing) commitEdit(); if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

  /* ------------------------------------------------------------ inline editor */
  function positionEditor() {
    if (!editing) return;
    var b = L[editing.id], i = info(editing.id); if (!b || !i) return;
    var v = lv(i.d), s = view.s, sw = stage.clientWidth, sh = stage.clientHeight;
    var w = Math.min(sw - 16, Math.max(180, (b.w + 28) * s));
    editor.style.fontSize = Math.max(15, v.fs * s) + 'px';
    editor.style.fontWeight = v.fw;
    editor.style.width = w + 'px';
    editor.style.height = 'auto';
    editor.style.height = Math.min(editor.scrollHeight + 4, sh - 16) + 'px';
    var h = editor.offsetHeight, cx = view.tx + b.x * s, cy = view.ty + b.y * s;
    editor.style.left = EDU.clamp(cx - w / 2, 8, Math.max(8, sw - w - 8)) + 'px';
    editor.style.top = EDU.clamp(cy - h / 2, 8, Math.max(8, sh - h - 8)) + 'px';
  }
  function startEdit(id, isNew) {
    if (editing) commitEdit();
    var i = info(id); if (!i) return;
    if (viewMode === 'outline') { sel = id; renderMap(); markOutlineSel(); focusOutline(id); return; }
    sel = id;
    editing = { id: id, isNew: !!isNew, before: i.n.text, snap: isNew ? null : snapshot() };
    editor.value = i.n.text;
    editor.hidden = false;
    renderMap(); ensureVisible(id); positionEditor();
    try { editor.focus({ preventScroll: true }); } catch (e) { editor.focus(); }
    editor.select();
  }
  function commitEdit() {
    if (!editing) return;
    var e = editing; editing = null; editor.hidden = true;
    var i = info(e.id); if (!i) return;
    var txt = editor.value.trim().slice(0, MAX_TEXT);
    if (!txt) {
      if (e.isNew) { removeNode(i); undoStack.pop(); sel = i.p.id; } else i.n.text = e.before;
    } else {
      i.n.text = txt;
      if (txt !== e.before) { if (!e.isNew) pushUndo(e.snap); map.dirty = true; }
    }
    save(); render();
    if (i.d === 0) syncName();
  }
  function cancelEdit() {
    if (!editing) return;
    var e = editing; editing = null; editor.hidden = true;
    var i = info(e.id);
    if (i) { if (e.isNew) { removeNode(i); undoStack.pop(); sel = i.p.id; } else i.n.text = e.before; }
    render();
  }
  editor.addEventListener('input', function () {
    if (!editing) return;
    var i = info(editing.id); if (!i) return;
    i.n.text = editor.value.slice(0, MAX_TEXT);
    syncOutlineValue(i.n.id, i.n.text);
    scheduleMap();
  });
  editor.addEventListener('keydown', function (e) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); stage.focus({ preventScroll: true }); }
    else if (e.key === 'Tab') { e.preventDefault(); commitEdit(); if (!e.shiftKey) mapAddChild(); else stage.focus({ preventScroll: true }); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelEdit(); stage.focus({ preventScroll: true }); }
  });
  editor.addEventListener('blur', function () {
    setTimeout(function () { if (editing && document.activeElement !== editor) commitEdit(); }, 0);
  });
  editor.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

  /* ------------------------------------------------------------ keyboard on the map */
  function navigate(k) {
    var b = L[sel];
    if (!b || !info(sel) || !info(sel).vis) { select(map.root.id); return; }
    var ax = k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : 0, ay = k === 'ArrowDown' ? 1 : k === 'ArrowUp' ? -1 : 0;
    var best = null, bestScore = Infinity;
    Object.keys(idx).forEach(function (id) {
      if (id === sel || !idx[id].vis || !L[id]) return;
      var o = L[id], dx = o.x - b.x, dy = o.y - b.y;
      var along = dx * ax + dy * ay, across = Math.abs(dx * ay) + Math.abs(dy * ax);
      if (along <= 4) return;
      var score = along + across * 2.2;
      if (score < bestScore) { bestScore = score; best = id; }
    });
    if (best) select(best);
  }
  stage.addEventListener('keydown', function (e) {
    if (e.target !== stage) return;
    var k = e.key, mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); return; }
    if (mod) return;
    if ((k === 'Tab' && !e.shiftKey && sel) || (k === 'Insert' && sel)) { e.preventDefault(); mapAddChild(); }
    else if (k === 'Enter') { e.preventDefault(); if (sel) mapAddSibling(); else select(map.root.id); }
    else if (k === 'F2' && sel) { e.preventDefault(); startEdit(sel); }
    else if ((k === 'Delete' || k === 'Backspace') && sel) { e.preventDefault(); deleteSel(); }
    else if (k === ' ' && sel) { e.preventDefault(); toggleFold(sel); }
    else if (k.indexOf('Arrow') === 0) {
      e.preventDefault();
      if (e.altKey && (k === 'ArrowUp' || k === 'ArrowDown')) { if (moveSibling(k === 'ArrowUp' ? -1 : 1)) render(); }
      else navigate(k);
    }
    else if (k === '+' || k === '=') { e.preventDefault(); zoomBy(1.2); }
    else if (k === '-' || k === '_') { e.preventDefault(); zoomBy(1 / 1.2); }
    else if (k === '0') { e.preventDefault(); fit(); }
    else if (k === 'Escape') { if (sel) { sel = null; renderMap(); markOutlineSel(); } }
    else if (k === '?') { e.preventDefault(); showKeys(); }
  });
  document.addEventListener('keydown', function (e) {
    var tg = e.target;
    if (tg === stage || (tg && tg.closest && tg.closest('input,textarea,select,[contenteditable],.edu-modal-back'))) return;
    var mod = e.ctrlKey || e.metaKey;
    if (mod && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if (mod && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); }
  });

  /* ------------------------------------------------------------ pointer: pan, drag, drop, pinch, tap */
  var pointers = {}, gesture = null, lastTap = { id: null, t: 0 }, freeToastShown = false;
  function local(e) { var r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function pcount() { return Object.keys(pointers).length; }
  function pinchInfo() {
    var ps = Object.keys(pointers).map(function (k) { return pointers[k]; });
    return { d: Math.max(1, Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y)), x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 };
  }
  /* which visible idea (not in the dragged branch) is under a point on the stage? */
  function hitNode(p, skip) {
    var wx = (p.x - view.tx) / view.s, wy = (p.y - view.ty) / view.s, best = null;
    Object.keys(idx).forEach(function (id) {
      var b = L[id]; if (!b || !idx[id].vis || skip[id]) return;
      if (Math.abs(wx - b.x) <= b.w / 2 + 4 && Math.abs(wy - b.y) <= b.h / 2 + 4) best = id;
    });
    return best;
  }
  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.mm-zoom') || e.target === editor) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (document.activeElement !== stage) stage.focus({ preventScroll: true });
    if (editing) commitEdit();
    hideHint();
    pointers[e.pointerId] = local(e);
    try { stage.setPointerCapture(e.pointerId); } catch (err) { }
    if (pcount() === 2) {
      var pi = pinchInfo();
      dropTarget = null;
      gesture = { type: 'pinch', d0: pi.d, x0: pi.x, y0: pi.y, s0: view.s, tx0: view.tx, ty0: view.ty };
      return;
    }
    if (pcount() > 2) return;
    var p = pointers[e.pointerId];
    var tog = e.target.closest('.mm-tog');
    if (tog) { gesture = { type: 'none' }; toggleFold(tog.parentNode.getAttribute('data-id')); return; }
    var g = e.target.closest('.mm-node');
    if (g && !g.hasAttribute('data-root')) gesture = { type: 'node', id: g.getAttribute('data-id'), x0: p.x, y0: p.y, lx: p.x, ly: p.y, moved: false };
    else gesture = { type: 'pan', x0: p.x, y0: p.y, tx0: view.tx, ty0: view.ty, moved: false, tapId: g ? g.getAttribute('data-id') : null };
  });
  stage.addEventListener('pointermove', function (e) {
    if (!pointers[e.pointerId] || !gesture) return;
    var p = local(e); pointers[e.pointerId] = p;
    if (gesture.type === 'pinch') {
      if (pcount() < 2) return;
      var pi = pinchInfo(), ns = EDU.clamp(gesture.s0 * pi.d / gesture.d0, 0.2, 3);
      view.tx = pi.x - (gesture.x0 - gesture.tx0) / gesture.s0 * ns;
      view.ty = pi.y - (gesture.y0 - gesture.ty0) / gesture.s0 * ns;
      view.s = ns; userMoved = true; applyView();
      return;
    }
    var dist = Math.hypot(p.x - gesture.x0, p.y - gesture.y0);
    if (gesture.type === 'pan') {
      if (!gesture.moved && dist < 5) return;
      gesture.moved = true; stage.classList.add('panning');
      view.tx = gesture.tx0 + p.x - gesture.x0; view.ty = gesture.ty0 + p.y - gesture.y0;
      userMoved = true; applyView();
    } else if (gesture.type === 'node') {
      if (!gesture.moved) {
        if (dist < 7) return;
        var i = info(gesture.id); if (!i) { gesture = null; return; }
        gesture.moved = true;
        pushUndo();
        gesture.prevLayout = map.layout;
        toFree();
        var list = [], skip = {}; (function w(n) { list.push(n); skip[n.id] = 1; n.children.forEach(w); })(i.n);
        gesture.list = list; gesture.skip = skip;
        sel = gesture.id;
        stage.classList.add('panning');
      }
      var dx = (p.x - gesture.lx) / view.s, dy = (p.y - gesture.ly) / view.s;
      gesture.lx = p.x; gesture.ly = p.y;
      gesture.list.forEach(function (n) { if (n.x !== undefined) { n.x += dx; n.y += dy; } });
      dropTarget = hitNode(p, gesture.skip);
      scheduleMap();
    }
  });
  function endPointer(e) {
    if (!pointers[e.pointerId]) return;
    delete pointers[e.pointerId];
    stage.classList.remove('panning');
    if (!gesture) return;
    if (gesture.type === 'pinch') { gesture = pcount() ? { type: 'none' } : null; return; }
    var gs = gesture;
    if (!pcount()) gesture = null;
    if (e.type !== 'pointerup') { if (gs.type === 'node' && gs.moved) { dropTarget = null; map.dirty = true; save(); render({ keepOutline: true }); } return; }
    if (gs.type === 'pan' && !gs.moved && gs.tapId) tapNode(gs.tapId);
    if (gs.type !== 'node') return;
    if (!gs.moved) { tapNode(gs.id); return; }
    var target = dropTarget; dropTarget = null;
    if (target && reparent(gs.id, target, gs.prevLayout)) { changed(); ensureVisible(gs.id); return; }
    (function w(n) { if (n.x !== undefined) { n.x = Math.round(n.x); n.y = Math.round(n.y); } n.children.forEach(w); })(map.root);
    if (gs.prevLayout !== 'free' && !freeToastShown) { freeToastShown = true; EDU.toast(t('free_toast')); }
    map.dirty = true; save(); render({ keepOutline: true });
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  function tapNode(id) {
    var now = Date.now();
    if (lastTap.id === id && now - lastTap.t < 450) { lastTap.id = null; startEdit(id); return; }
    lastTap = { id: id, t: now };
    if (sel !== id) select(id, { noScroll: true });
  }
  stage.addEventListener('wheel', function (e) {
    var full = appEl.classList.contains('mm-full');
    if (!(e.ctrlKey || e.metaKey) && !full) return;        /* a plain wheel scrolls the page */
    e.preventDefault();
    var p = local(e);
    zoomBy(Math.exp(-e.deltaY * 0.0022), p.x, p.y);
  }, { passive: false });
  stage.addEventListener('contextmenu', function (e) { if (e.target.closest('.mm-node')) e.preventDefault(); });

  /* ------------------------------------------------------------ outline view (editable, in sync) */
  function renderOutline(focusId) {
    olBox.textContent = '';
    var frag = document.createDocumentFragment();
    (function walk(n, d) {
      var i = idx[n.id];
      var row = EDU.el('div', { class: 'ol-row d' + Math.min(d, 2) + (n.id === sel ? ' sel' : ''), role: 'listitem', 'aria-level': d + 1, 'data-id': n.id, style: { '--d': d, '--b': colVar(i ? i.c : 0) } });
      if (d > 0 && n.children.length) {
        row.appendChild(EDU.el('button', { type: 'button', class: 'ol-fold', tabindex: '-1', 'aria-expanded': String(!n.collapsed), 'aria-label': t('fold_tip'), title: t('fold_tip') },
          EDU.el('span', { 'aria-hidden': 'true', text: n.collapsed ? '▸' : '▾' })));
      } else row.appendChild(EDU.el('span', { class: 'ol-sp', 'aria-hidden': 'true' }));
      row.appendChild(EDU.el('span', { class: 'ol-dot', 'aria-hidden': 'true' }));
      var inp = EDU.el('textarea', { class: 'ol-in', rows: '1', dir: 'auto', maxlength: MAX_TEXT, placeholder: '…', 'aria-label': t('idea_level', { n: EDU.fmt(d + 1) }) });
      inp.value = n.text;
      row.appendChild(inp);
      frag.appendChild(row);
      visKids(n).forEach(function (k) { walk(k, d + 1); });
    })(map.root, 0);
    olBox.appendChild(frag);
    sizeOutline();
    if (focusId) focusOutline(focusId);
  }
  /* long ideas wrap onto more lines (CSS field-sizing where supported, else measure) */
  var AUTO_FIT = !!(window.CSS && CSS.supports && CSS.supports('field-sizing', 'content'));
  function autosize(el) {
    if (AUTO_FIT || !el.offsetWidth) return;
    el.style.height = 'auto'; el.style.height = (el.scrollHeight + 2) + 'px';
  }
  function sizeOutline() { if (!AUTO_FIT) EDU.$$('.ol-in', olBox).forEach(autosize); }
  function rowOf(id) { return olBox.querySelector('.ol-row[data-id="' + id + '"]'); }
  function focusOutline(id) {
    var row = rowOf(id); if (!row) return;
    var inp = row.querySelector('.ol-in');
    inp.focus({ preventScroll: true });
    try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) { }
    if (olBox.scrollHeight > olBox.clientHeight + 2) {
      if (row.offsetTop < olBox.scrollTop) olBox.scrollTop = row.offsetTop - 6;
      else if (row.offsetTop + row.offsetHeight > olBox.scrollTop + olBox.clientHeight) olBox.scrollTop = row.offsetTop + row.offsetHeight - olBox.clientHeight + 6;
    } else if (row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
  }
  function markOutlineSel() {
    EDU.$$('.ol-row', olBox).forEach(function (r) { r.classList.toggle('sel', r.getAttribute('data-id') === sel); });
  }
  function syncOutlineValue(id, text) {
    var row = rowOf(id); if (!row) return;
    var inp = row.querySelector('.ol-in'); if (document.activeElement !== inp) { inp.value = text; autosize(inp); }
  }
  function siblingRow(id, dir) {
    var rows = EDU.$$('.ol-row', olBox), at = -1;
    rows.forEach(function (r, k) { if (r.getAttribute('data-id') === id) at = k; });
    var r = rows[at + dir]; return r ? r.getAttribute('data-id') : null;
  }
  var olSnap = null, olChanged = false;
  olBox.addEventListener('focusin', function (e) {
    if (!e.target.classList.contains('ol-in')) return;
    if (editing) commitEdit();
    var id = e.target.closest('.ol-row').getAttribute('data-id');
    olSnap = snapshot(); olChanged = false;
    if (sel !== id) { sel = id; renderMap(); markOutlineSel(); ensureVisible(id); }
  });
  olBox.addEventListener('input', function (e) {
    if (!e.target.classList.contains('ol-in')) return;
    var i = info(e.target.closest('.ol-row').getAttribute('data-id')); if (!i) return;
    if (!olChanged) { pushUndo(olSnap); olChanged = true; }
    autosize(e.target);
    i.n.text = e.target.value.slice(0, MAX_TEXT);
    map.dirty = true; save(); scheduleMap();
    if (i.d === 0) syncName();
  });
  olBox.addEventListener('click', function (e) {
    var fb = e.target.closest('.ol-fold'); if (!fb) return;
    var id = fb.closest('.ol-row').getAttribute('data-id');
    toggleFold(id); focusOutline(id);
  });
  olBox.addEventListener('keydown', function (e) {
    var inp = e.target; if (!inp.classList || !inp.classList.contains('ol-in')) return;
    if (e.isComposing || e.keyCode === 229) return;
    var id = inp.closest('.ol-row').getAttribute('data-id'), i = info(id); if (!i) return;
    var k = e.key, mod = e.ctrlKey || e.metaKey, n;
    if (mod && /^[zy]$/i.test(k)) { e.preventDefault(); if (/y/i.test(k) || e.shiftKey) redo(); else undo(); focusOutline(sel); return; }
    if (k === 'Enter') {
      e.preventDefault();
      n = (i.d === 0 || (i.n.children.length && !i.n.collapsed)) ? addChildOf(i.n, 0) : addChildOf(i.p, i.p.children.indexOf(i.n) + 1);
      if (n) render({ focus: n.id });
    } else if (k === 'Tab') {
      if (i.d === 0) return;                                /* let Tab leave the list from the centre topic */
      e.preventDefault();
      if (e.shiftKey ? outdent(id) : indent(id)) { sel = id; changed({ focus: id }); }
    } else if (k === 'Backspace' && !inp.value && i.d > 0 && !i.n.children.length) {
      e.preventDefault();
      var prev = siblingRow(id, -1);
      pushUndo(); removeNode(i);
      sel = prev || i.p.id;
      changed({ focus: sel });
    } else if (k === 'ArrowUp' || k === 'ArrowDown') {
      e.preventDefault();
      if (e.altKey) { sel = id; if (moveSibling(k === 'ArrowUp' ? -1 : 1)) render({ focus: id }); }
      else { var to = siblingRow(id, k === 'ArrowUp' ? -1 : 1); if (to) focusOutline(to); }
    } else if (k === 'Escape') inp.blur();
  });

  /* ------------------------------------------------------------ maps: list, new, rename, delete */
  function renderMapList() {
    var s = $('#mm-maps'); s.textContent = '';
    maps.forEach(function (m) { s.appendChild(EDU.el('option', { value: m.id, text: m.name || t('untitled') })); });
    s.value = map.id;
    appEl.dataset.maps = maps.length;
  }
  function openMap(m) {
    if (editing) commitEdit();
    map = m; sel = m.root.id; undoStack = []; redoStack = []; dropTarget = null;
    saveNow(); renderMapList(); render(); fit();
  }
  function addMap(m) {
    if (maps.length >= MAX_MAPS) { EDU.toast(t('too_many_maps')); return false; }
    var base = m.name || t('untitled'), k = 1, nm = base;
    while (maps.some(function (x) { return x.name === nm; })) { k++; nm = base + ' ' + k; }
    m.name = nm; m.no = k > 1 ? k : 0;
    maps.push(m); openMap(m);
    return true;
  }
  $('#mm-maps').addEventListener('change', function () {
    var id = this.value, m = maps.filter(function (x) { return x.id === id; })[0];
    if (m) openMap(m);
  });
  function newMapDialog() {
    commitEdit();
    var close, grid = EDU.el('div', { class: 'mm-tpls' });
    TPLS.forEach(function (k) {
      grid.appendChild(EDU.el('button', { type: 'button', class: 'mm-tpl', id: 'tpl-' + k, onclick: function () {
        close();
        if (addMap(makeMap(k)) && k === 'blank') startEdit(map.root.id);
      } }, EDU.el('i', { 'aria-hidden': 'true', text: TPL_ICON[k] }), EDU.el('b', { text: t('tpl_' + k) }), EDU.el('span', { text: t('tpl_' + k + '_d') })));
    });
    close = EDU.modal(EDU.el('div', {}, EDU.el('p', { class: 'muted', text: t('choose_template') }), grid), { title: t('tpl_title') });
    setTimeout(function () { var b = $('#tpl-blank'); if (b) b.focus(); }, 30);
  }
  function renameDialog() {
    commitEdit();
    var inp = EDU.el('input', { type: 'text', id: 'mm-name-in', class: 'w100', maxlength: '120', dir: 'auto' });
    inp.value = map.name;
    var close = EDU.modal(EDU.el('form', { class: 'stack', onsubmit: function (e) {
      e.preventDefault();
      var v = inp.value.replace(/\s+/g, ' ').trim();
      if (v) { map.name = uniqueName(v.slice(0, 120), map); map.no = 0; map.autoName = false; map.dirty = true; saveNow(); renderMapList(); }
      close();
    } }, EDU.el('label', { for: 'mm-name-in', text: t('map_name') }), inp,
      EDU.el('div', { class: 'row' },
        EDU.el('button', { type: 'submit', class: 'btn btn-primary', id: 'mm-name-ok', text: t('save') }),
        EDU.el('button', { type: 'button', class: 'btn', text: t('cancel'), onclick: function () { close(); } }))), { title: t('rename_map') });
    setTimeout(function () { inp.focus(); inp.select(); }, 30);
  }
  function deleteMap() {
    commitEdit();
    if (!confirm(t('confirm_delete_map', { name: map.name }))) return;
    maps = maps.filter(function (m) { return m !== map; });
    if (!maps.length) maps.push(makeMap('blank'));
    openMap(maps[0]);
  }
  function resetAll() {
    commitEdit();
    if (!confirm(t('confirm_reset'))) return;
    maps = [makeMap('sample')];
    openMap(maps[0]);
  }

  /* ------------------------------------------------------------ text outline in / out */
  function outlineText() {
    var out = [];
    (function w(n, d) {
      var txt = (n.text || '').replace(/\s*\n\s*/g, ' ');
      out.push(d === 0 ? txt : new Array(d).join('    ') + '- ' + txt);
      n.children.forEach(function (k) { w(k, d + 1); });
    })(map.root, 0);
    return out.join('\n');
  }
  function mapFromText(txt) {
    var lines = String(txt || '').replace(/\r/g, '').split('\n'), root = null, stack = [], count = 0;
    lines.forEach(function (raw) {
      if (count >= MAX_NODES || !raw.trim()) return;
      var lead = raw.match(/^[ \t 　]*/)[0], ind = 0;
      for (var c = 0; c < lead.length; c++) ind += lead[c] === '\t' ? 4 : 1;
      var s = raw.trim(), h = s.match(/^(#{1,6})\s+/);
      if (h) { ind = (h[1].length - 1) * 4; s = s.slice(h[0].length); }
      s = s.replace(/^([-*+•●○◦▪■►▸→]|\d{1,3}[.)])\s+/, '').trim().slice(0, MAX_TEXT);
      if (!s) return;
      var node = { id: uid(), text: s, children: [] }; count++;
      if (!root) { root = node; stack = [{ ind: -1, n: root }]; return; }
      while (stack.length > 1 && stack[stack.length - 1].ind >= ind) stack.pop();
      if (stack.length > MAX_DEPTH) stack.length = MAX_DEPTH;
      stack[stack.length - 1].n.children.push(node);
      stack.push({ ind: ind, n: node });
    });
    if (!root) return null;
    var m = cleanMap({ name: root.text.replace(/\s+/g, ' ').slice(0, 80), root: root, layout: defaultLayout(), dirty: true });
    m.autoName = true;
    return m;
  }
  function fromTextDialog() {
    commitEdit();
    var ta = EDU.el('textarea', { id: 'mm-paste', rows: '9', dir: 'auto', placeholder: t('from_text_example') });
    var close = EDU.modal(EDU.el('div', { class: 'stack' },
      EDU.el('p', { class: 'muted small mb0', text: t('from_text_hint') }),
      EDU.el('label', { for: 'mm-paste', text: t('from_text_label') }), ta,
      EDU.el('div', { class: 'row' },
        EDU.el('button', { type: 'button', class: 'btn btn-primary', id: 'mm-paste-ok', text: t('make_map'), onclick: function () {
          var m = mapFromText(ta.value);
          if (!m) { EDU.toast(t('paste_empty')); return; }
          close(); addMap(m);
        } }),
        EDU.el('button', { type: 'button', class: 'btn', id: 'mm-paste-ex', text: t('use_example'), onclick: function () { ta.value = t('from_text_example'); ta.focus(); } }))),
      { title: t('from_text') });
    setTimeout(function () { ta.focus(); }, 30);
  }

  /* ------------------------------------------------------------ files: JSON save / open */
  function fileName(ext) {
    var b = String(map.name || '').replace(/[\\/:*?"<>|#%\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    return (b || 'mind-map') + '.' + ext;
  }
  function exportJson() {
    commitEdit();
    var data = { app: 'ai-pathshala-mind-map', version: 1, name: map.name, layout: map.layout, root: map.root };
    EDU.download(fileName('json'), JSON.stringify(data, null, 1), 'application/json');
  }
  function openFile() {
    commitEdit();
    EDU.pickFile('.json,.txt,.md,application/json,text/plain').then(function (f) {
      if (!f) return null;
      if (f.size > 3e6) { EDU.toast(t('bad_file')); return null; }
      return EDU.readText(f).then(function (txt) {
        var m = null, o = null;
        txt = String(txt).replace(/^﻿/, '');
        try { o = JSON.parse(txt); } catch (e) { o = null; }
        if (o && typeof o === 'object' && o.root) m = cleanMap({ name: o.name, layout: o.layout, root: o.root, dirty: true });
        else if (!o && !/^\s*[[{]/.test(txt)) m = mapFromText(txt);
        if (!m) { EDU.toast(t('bad_file')); return; }
        m.id = uid(); m.dirty = true; m.tpl = null;
        if (addMap(m)) EDU.toast(t('imported', { name: m.name }));
      });
    }).catch(function () { EDU.toast(t('bad_file')); });
  }

  /* ------------------------------------------------------------ PNG (canvas drawing of the map) + print */
  function mix(a, b, p) {
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    var ch = function (s) { return Math.round(((x >> s) & 255) * p + ((y >> s) & 255) * (1 - p)); };
    return 'rgb(' + ch(16) + ',' + ch(8) + ',' + ch(0) + ')';
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawCanvas(maxSide) {
    reindex(); doLayout();
    var b = bounds(), pad = 36, foot = 34, fam = family();
    var bw = b.x1 - b.x0 + pad * 2, bh = b.y1 - b.y0 + pad * 2 + foot;
    var sc = Math.min(2, maxSide / Math.max(bw, bh), Math.sqrt(15e6 / (bw * bh)));   /* stay under phone canvas limits */
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(bw * sc)); c.height = Math.max(1, Math.ceil(bh * sc));
    var ctx = c.getContext('2d');
    ctx.scale(sc, sc);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, bw, bh);
    ctx.save();
    ctx.translate(pad - b.x0, pad - b.y0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    (function edges(n) {
      edgeKids(n).forEach(function (k) {
        var ki = idx[k.id];
        ctx.strokeStyle = LIGHT.c[ki.c]; ctx.lineWidth = edgeWidth(ki.d);
        try { ctx.stroke(new Path2D(edgeD(L[n.id], L[k.id]))); } catch (e) { }
        edges(k);
      });
    })(map.root);
    (function nodes(n) {
      var i = idx[n.id], o = L[n.id], d = i.d, v = lv(d), col = LIGHT.c[i.c];
      var rx = d === 0 ? 16 : d === 1 ? 12 : 9;
      rrect(ctx, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, rx);
      ctx.fillStyle = d === 0 ? LIGHT.primary : d === 1 ? mix(col, '#ffffff', 0.2) : '#ffffff'; ctx.fill();
      ctx.strokeStyle = d === 0 ? LIGHT.primary : d === 1 ? col : mix(col, LIGHT.border, 0.6);
      ctx.lineWidth = d === 1 ? 2.5 : 1.6; ctx.stroke();
      ctx.fillStyle = d === 0 ? LIGHT.ink : (n.text ? LIGHT.text : LIGHT.muted);
      ctx.font = fontStr(d, fam); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      try { ctx.direction = o.rtl ? 'rtl' : 'ltr'; } catch (e) { }
      o.lines.forEach(function (line, li) { ctx.fillText(line || (n.text ? '' : '…'), o.x, o.y - o.h / 2 + v.py + (li + 0.5) * o.lh); });
      if (d > 0 && n.collapsed && n.children.length) {
        var tp = togglePos(n);
        ctx.beginPath(); ctx.arc(o.x + tp[0], o.y + tp[1], 12, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = '700 12px "Noto Sans", sans-serif'; try { ctx.direction = 'ltr'; } catch (e) { }
        ctx.fillText(String(Math.min(countAll(n) - 1, 999)), o.x + tp[0], o.y + tp[1] + 0.5);
      }
      visKids(n).forEach(nodes);
    })(map.root);
    ctx.restore();
    ctx.font = '500 12px ' + fam; ctx.fillStyle = LIGHT.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    try { ctx.direction = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'; } catch (e) { }
    ctx.fillText(t('png_footer'), bw / 2, bh - foot / 2 - 4);
    return c;
  }
  function exportPng() {
    commitEdit();
    var c = drawCanvas(4000);
    renderMap();
    EDU.downloadCanvas(c, fileName('png'));
    EDU.toast(t('png_done'));
  }
  function buildPrint() {
    if (editing) commitEdit();
    var box = $('#mm-print'); box.textContent = '';
    var c = drawCanvas(3000);
    box.appendChild(EDU.el('h1', { dir: 'auto', text: map.name }));
    box.appendChild(EDU.el('img', { src: c.toDataURL('image/png'), alt: map.name }));
    box.appendChild(EDU.el('h2', { text: t('outline_title') }));
    var ul = EDU.el('ul');
    (function w(n, parent) {
      var li = EDU.el('li', { dir: 'auto' }, EDU.el(n === map.root ? 'b' : 'span', { text: n.text || '…' }));
      parent.appendChild(li);
      if (n.children.length) { var sub = EDU.el('ul'); li.appendChild(sub); n.children.forEach(function (k) { w(k, sub); }); }
    })(map.root, ul);
    box.appendChild(ul);
    box.appendChild(EDU.el('p', { class: 'mm-pfoot', text: t('png_footer') }));
    renderMap();                                             /* drawCanvas re-ran the layout */
  }
  window.addEventListener('beforeprint', buildPrint);

  /* ------------------------------------------------------------ shortcuts help */
  function showKeys() {
    var rows = [['Tab', 'sc_tab'], ['Enter', 'sc_enter'], ['F2', 'sc_f2'], ['Delete', 'sc_del'], ['Space', 'sc_space'],
      ['← ↑ → ↓', 'sc_arrows'], ['Alt + ↑ ↓', 'sc_altarrows'], ['Ctrl + Z', 'undo_tip'], ['Ctrl + Y', 'redo_tip'],
      ['+  −  0', 'sc_zoom'], ['Esc', 'sc_esc']];
    var tb = EDU.el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(EDU.el('tr', {}, EDU.el('td', { class: 'no-i18n', dir: 'ltr' }, EDU.el('kbd', { text: r[0] })), EDU.el('td', { text: t(r[1]) })));
    });
    EDU.modal(EDU.el('div', { id: 'mm-keys-box' }, EDU.el('div', { class: 'scroll-x' }, EDU.el('table', { class: 'table mm-keys' }, tb)),
      EDU.el('p', { class: 'small muted', style: { marginTop: '10px' }, text: t('sc_pan') }),
      EDU.el('p', { class: 'small muted mb0', text: t('sc_outline') })), { title: t('shortcuts') });
  }

  /* ------------------------------------------------------------ colours, view, full screen */
  function buildSwatches() {
    var box = $('#mm-colors'); box.textContent = '';
    for (var c = 1; c <= 8; c++) {
      box.appendChild(EDU.el('button', { type: 'button', class: 'mm-sw', 'data-c': c, 'data-i18n-aria-label': 'col_' + c, 'data-i18n-title': 'col_' + c,
        style: { background: 'var(--c' + c + ')' }, onclick: (function (cc) { return function () { setColor(cc); }; })(c) }));
    }
    EDU.apply(box);
  }
  function toggleColors(force) {
    var p = $('#mm-colors'), show = force === undefined ? p.hidden : !!force;
    p.hidden = !show; $('#mm-colbtn').setAttribute('aria-expanded', String(show));
  }
  function setView(v) {
    if (editing) commitEdit();
    viewMode = v; $('#mm-body').setAttribute('data-view', v);
    store.set('view', v); updateUI();
    setTimeout(function () { fit(); sizeOutline(); }, 30);
  }
  function toggleFull() {
    var d = document, can = appEl.requestFullscreen || appEl.webkitRequestFullscreen;
    if (d.fullscreenElement || d.webkitFullscreenElement) { EDU.fullscreen(); return; }
    if (appEl.classList.contains('mm-max')) { appEl.classList.remove('mm-max', 'mm-full'); setTimeout(fit, 50); return; }
    if (can) EDU.fullscreen(appEl);
    else { appEl.classList.add('mm-full', 'mm-max'); setTimeout(fit, 50); }
  }
  function onFs() {
    var on = (document.fullscreenElement || document.webkitFullscreenElement) === appEl;
    appEl.classList.toggle('mm-full', on || appEl.classList.contains('mm-max'));
    setTimeout(fit, 80);
  }
  document.addEventListener('fullscreenchange', onFs);
  document.addEventListener('webkitfullscreenchange', onFs);

  /* ------------------------------------------------------------ wiring */
  var on = function (s, fn) { $(s).addEventListener('click', fn); };
  on('#mm-child', mapAddChild);
  on('#mm-sib', mapAddSibling);
  on('#mm-edit', function () { if (sel) startEdit(sel); });
  on('#mm-fold', function () { if (sel) toggleFold(sel); });
  on('#mm-colbtn', function () { toggleColors(); });
  on('#mm-del', deleteSel);
  on('#mm-undo', undo);
  on('#mm-redo', redo);
  on('#mm-keys', showKeys);
  on('#mm-keys2', showKeys);
  on('#mm-full', toggleFull);
  on('#mm-zin', function () { zoomBy(1.25); });
  on('#mm-zout', function () { zoomBy(1 / 1.25); });
  on('#mm-fit', fit);
  on('#mm-new', newMapDialog);
  on('#mm-rename', renameDialog);
  on('#mm-delmap', deleteMap);
  on('#mm-reset', resetAll);
  on('#mm-png', exportPng);
  on('#mm-print-btn', function () { buildPrint(); window.print(); });
  on('#mm-json', exportJson);
  on('#mm-open', openFile);
  on('#mm-copytext', function () { commitEdit(); EDU.copy(outlineText()); });
  on('#mm-fromtext', fromTextDialog);
  EDU.$$('#mm-layout button').forEach(function (b) {
    b.addEventListener('click', function () {
      commitEdit();
      var lay = b.getAttribute('data-layout');
      if (lay !== map.layout) { pushUndo(); map.layout = lay; clearPositions(); map.dirty = true; save(); }
      render({ keepOutline: true }); fit();
    });
  });
  EDU.$$('#mm-view button').forEach(function (b) { b.addEventListener('click', function () { setView(b.getAttribute('data-view')); }); });

  EDU.onLang(function () {
    if (editing) commitEdit();
    mcache = {}; famCache = null;
    maps.forEach(function (m) { if (!m.dirty && m.tpl) regen(m); });
    reindex();
    if (!idx[sel]) sel = map.root.id;
    renderMapList(); render(); fit();
  });
  if (document.fonts && document.fonts.addEventListener) {
    var fontTimer = null;
    document.fonts.addEventListener('loadingdone', function () {
      clearTimeout(fontTimer);
      fontTimer = setTimeout(function () { mcache = {}; famCache = null; renderMap(); if (!userMoved && !editing) fit(); }, 60);
    });
  }
  if (window.ResizeObserver) {
    var lastW = 0, lastH = 0;
    new ResizeObserver(function () {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h || (w === lastW && h === lastH)) return;
      lastW = w; lastH = h;
      if (!userMoved) fit(); else applyView();
    }).observe(stage);
  }

  buildSwatches();
  $('#mm-body').setAttribute('data-view', viewMode);
  renderMapList();
  render();
  fit();
  saveNow();
})();
