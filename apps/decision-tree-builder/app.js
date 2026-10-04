/* Decision Tree Lab: students build a decision tree classifier by hand, test it on
   examples it has never seen, and compare it with the tree the computer grows using
   Gini impurity. Everything runs on the device; state is kept with EDU.store. */
(function () {
  'use strict';
  var SLUG = 'decision-tree-builder';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var EPS = 1e-9;

  /* ------------------------------------------------------------------ data
     Language-independent facts. Names, questions and answers are in content.js.
     animals features: 0 feeds milk [yes,no] · 1 flies [yes,no] · 2 lives in water [yes,no] · 3 legs [0,2,4]
                classes: 0 mammal · 1 bird · 2 fish · 3 reptile
     cricket features: 0 sky [sunny,cloudy,light rain] · 1 heat [hot,mild,cool] · 2 humidity [high,normal] · 3 wind [weak,strong]
                classes: 0 play · 1 no play                                                                 */
  var DATA = {
    animals: {
      nv: [2, 2, 2, 3],
      colors: ['--c2', '--c3', '--c7', '--c4'],
      cicons: ['', '', '', ''],
      vicons: null,
      train: [
        ['🐄', 0, 1, 1, 2, 0], ['🦚', 1, 0, 1, 1, 1], ['🐟', 1, 1, 0, 0, 2], ['🐍', 1, 1, 1, 0, 3], ['🦇', 0, 0, 1, 1, 0],
        ['🦜', 1, 0, 1, 1, 1], ['🐊', 1, 1, 0, 2, 3], ['🐠', 1, 1, 0, 0, 2], ['🐅', 0, 1, 1, 2, 0], ['🐧', 1, 1, 0, 1, 1],
        ['🦎', 1, 1, 1, 2, 3], ['🐘', 0, 1, 1, 2, 0], ['🦉', 1, 0, 1, 1, 1], ['🦈', 1, 1, 0, 0, 2], ['🐢', 1, 1, 0, 2, 3],
        ['🐬', 0, 1, 0, 0, 0], ['🕊️', 1, 0, 1, 1, 1], ['🐡', 1, 1, 0, 0, 2], ['🐪', 0, 1, 1, 2, 0], ['🦎', 1, 1, 1, 2, 3]
      ],
      test: [['🐋', 0, 1, 0, 0, 0], ['🦅', 1, 0, 1, 1, 1], ['🐟', 1, 1, 0, 0, 2], ['🐊', 1, 1, 0, 2, 3], ['🐿️', 0, 1, 1, 2, 0], ['🐍', 1, 1, 0, 0, 3]]
    },
    cricket: {
      nv: [3, 3, 2, 2],
      colors: ['--c4', '--c5'],
      cicons: ['🏏', '🏠'],
      vicons: [['☀️', '☁️', '🌦️'], ['🔥', '🌡️', '❄️'], ['💦', '💧'], ['🍃', '💨']],
      noise: [14],   /* Day 15: cloudy and pleasant, but a maths test the next day */
      train: [
        [0, 0, 0, 0, 1], [0, 0, 0, 1, 1], [1, 0, 0, 0, 0], [2, 1, 0, 0, 0], [2, 2, 1, 0, 0], [2, 2, 1, 1, 1], [1, 2, 1, 1, 0], [0, 1, 0, 0, 1],
        [0, 2, 1, 0, 0], [2, 1, 1, 0, 0], [0, 1, 1, 1, 0], [1, 1, 0, 1, 0], [1, 0, 1, 0, 0], [2, 1, 0, 1, 1], [1, 1, 1, 0, 1], [1, 0, 0, 1, 0]
      ],
      test: [[0, 2, 0, 1, 1], [1, 1, 1, 0, 0], [2, 1, 1, 1, 1], [0, 0, 1, 0, 0], [2, 2, 0, 0, 0], [1, 1, 1, 1, 0]]
    }
  };
  var DS_KEYS = ['animals', 'cricket'];
  var LETTERS = 'ABCDEF';

  function makeItems(key) {
    var D = DATA[key], nf = D.nv.length, out = {};
    ['train', 'test'].forEach(function (kind) {
      out[kind] = D[kind].map(function (r, i) {
        var hasEmoji = typeof r[0] === 'string', o = hasEmoji ? 1 : 0;
        var x = r.slice(o, o + nf);
        return { i: i, kind: kind, x: x, y: r[o + nf], emoji: hasEmoji ? r[0] : D.vicons[0][x[0]] };
      });
    });
    return out;
  }
  var ITEMS = { animals: makeItems('animals'), cricket: makeItems('cricket') };

  /* ------------------------------------------------------------------ state */
  function leaf() { return { f: null }; }
  var savedTrees = store.get('trees', {}) || {};
  var state = {
    ds: DS_KEYS.indexOf(store.get('ds', 'animals')) >= 0 ? store.get('ds', 'animals') : 'animals',
    tab: ['build', 'data', 'learn'].indexOf(store.get('tab', 'build')) >= 0 ? store.get('tab', 'build') : 'build',
    mode: store.get('mode', 'mine') === 'auto' ? 'auto' : 'mine',
    view: store.get('view', 'table') === 'cards' ? 'cards' : 'table',
    hints: store.get('hints', false) === true,
    depths: { animals: 0, cricket: 0 },   /* the computer's max depth, one per dataset */
    depth: 0,                             /* = depths[ds] */
    trees: {},
    sel: { mine: 'r', auto: 'r' },
    steps: null,
    undo: { animals: [], cricket: [] },
    results: {},   /* 'ds|mode' → { key, correct, rows }; a result only counts while its key matches the tree on screen */
    basket: [3, 1]
  };
  (function () {
    var b = store.get('basket', [3, 1]);
    if (Array.isArray(b) && b.length === 2) state.basket = [EDU.clamp(parseInt(b[0], 10) || 0, 0, 12), EDU.clamp(parseInt(b[1], 10) || 0, 0, 12)];
    var dd = store.get('depth', 0), okD = function (d) { return [0, 1, 2, 3, 4].indexOf(d) >= 0; };
    DS_KEYS.forEach(function (ds) {
      var d = dd && typeof dd === 'object' ? dd[ds] : dd;   /* old saves kept one number for both */
      state.depths[ds] = okD(d) ? d : 0;
    });
    state.depth = state.depths[state.ds];
    var r = store.get('results', {});
    if (r && typeof r === 'object') DS_KEYS.forEach(function (ds) {
      ['mine', 'auto'].forEach(function (m) {
        var x = r[ds + '|' + m];
        if (x && typeof x.key === 'string' && Array.isArray(x.rows) && x.rows.length === DATA[ds].test.length &&
            x.rows.every(function (w) { return w && typeof w.pred === 'number' && w.pred >= 0 && w.pred < DATA[ds].colors.length; })) {
          state.results[ds + '|' + m] = { key: x.key, correct: x.rows.filter(function (w) { return !!w.ok; }).length, rows: x.rows.map(function (w) { return { pred: w.pred, ok: !!w.ok }; }) };
        }
      });
    });
  })();

  /* ------------------------------------------------------------------ helpers */
  function D() { return DATA[state.ds]; }
  function IT() { return ITEMS[state.ds]; }
  function C() { var all = window.APP_CONTENT || {}; return (all[EDU.lang] || all.en)[state.ds]; }
  function nClasses() { return D().colors.length; }
  function className(k) { return C().classes[k]; }
  function classText(k) { var ic = D().cicons[k]; return (ic ? ic + ' ' : '') + className(k); }
  function featQ(f) { return C().features[f].q; }
  function featS(f) { return C().features[f].s; }
  function valName(f, v) { return C().features[f].v[v]; }
  function valText(f, v) { var vi = D().vicons; return (vi ? vi[f][v] + ' ' : '') + valName(f, v); }
  function colorVar(k) { return 'var(' + D().colors[k] + ')'; }
  function countText(n) { return n === 1 ? C().count1 : C().count.replace('{n}', EDU.fmt(n)); }
  function itemName(it) {
    var c = C();
    if (state.ds === 'animals') return (it.kind === 'train' ? c.items : c.test)[it.i];
    return it.kind === 'train' ? c.day.replace('{n}', EDU.fmt(it.i + 1)) : c.newday.replace('{n}', LETTERS[it.i]);
  }
  function itemTag(it) { return state.ds === 'animals' ? '' : (it.kind === 'train' ? String(it.i + 1) : LETTERS[it.i]); }
  function f2(x) { return EDU.fmt(x, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function f3(x) { return EDU.fmt(x, { minimumFractionDigits: 3, maximumFractionDigits: 3 }); }
  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
  function isRtl() { return document.documentElement.dir === 'rtl'; }
  function arrow() { return isRtl() ? '←' : '→'; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ------------------------------------------------------------------ maths: Gini + trees */
  function counts(list) {
    var c = [];
    for (var k = 0; k < nClasses(); k++) c.push(0);
    list.forEach(function (it) { c[it.y]++; });
    return c;
  }
  function gini(c) {
    var n = 0, s = 0;
    c.forEach(function (x) { n += x; });
    if (!n) return 0;
    c.forEach(function (x) { s += (x / n) * (x / n); });
    return Math.max(0, 1 - s);
  }
  function majority(c) {
    var b = 0;
    for (var i = 1; i < c.length; i++) if (c[i] > c[b]) b = i;
    var ties = c.filter(function (x) { return x === c[b]; }).length;
    return { i: b, tie: c[b] > 0 && ties > 1 };
  }
  function groupsBy(list, f) {
    var g = [];
    for (var v = 0; v < D().nv[f]; v++) g.push([]);
    list.forEach(function (it) { g[it.x[f]].push(it); });
    return g;
  }
  function nonEmpty(groups) { return groups.filter(function (a) { return a.length; }).length; }
  /* Weighted Gini after splitting on feature f, or null if f does not split this group. */
  function splitGini(list, f) {
    var g = groupsBy(list, f);
    if (nonEmpty(g) < 2) return null;
    var w = 0;
    g.forEach(function (a) { w += a.length / list.length * gini(counts(a)); });
    return w;
  }
  function bestFeature(list) {
    var best = null, bf = -1;
    for (var f = 0; f < D().nv.length; f++) {
      var s = splitGini(list, f);
      if (s !== null && (best === null || s < best - EPS)) { best = s; bf = f; }
    }
    return bf;
  }
  /* The computer's tree: greedy, always takes the question with the lowest weighted Gini.
     maxD 0 = no limit. Ties go to the first feature in the list. */
  function buildAuto(list, depth, maxD) {
    if (gini(counts(list)) < EPS || (maxD > 0 && depth >= maxD)) return leaf();
    var bf = bestFeature(list);
    if (bf < 0) return leaf();
    var node = { f: bf, k: {} };
    groupsBy(list, bf).forEach(function (a, v) { if (a.length) node.k[v] = buildAuto(a, depth + 1, maxD); });
    return node;
  }
  var autoCache = {};
  function autoFull(ds, depth) {
    ds = ds || state.ds; depth = depth === undefined ? state.depth : depth;
    var key = ds + ':' + depth;
    if (!autoCache[key]) {
      var keep = state.ds; state.ds = ds;
      autoCache[key] = buildAuto(ITEMS[ds].train, 0, depth);
      state.ds = keep;
    }
    return autoCache[key];
  }
  function bfsSplits(s) {
    var q = [s], out = [];
    while (q.length) {
      var n = q.shift();
      if (n.f !== null && n.f !== undefined) {
        out.push(n);
        Object.keys(n.k).sort(function (a, b) { return a - b; }).forEach(function (k) { q.push(n.k[k]); });
      }
    }
    return out;
  }
  function truncate(s, allowed) {
    if (s.f === null || s.f === undefined) return leaf();
    if (allowed.indexOf(s) < 0) return { f: null, pending: true };
    var o = { f: s.f, k: {} };
    Object.keys(s.k).forEach(function (k) { o.k[k] = truncate(s.k[k], allowed); });
    return o;
  }
  /* Make a stored tree safe for the current data (bad / old saves never crash the app). */
  function sanitize(s, list, depth) {
    if (!s || typeof s !== 'object' || depth > 8) return leaf();
    var f = s.f;
    if (typeof f !== 'number' || f < 0 || f >= D().nv.length || f !== Math.floor(f)) return leaf();
    var g = groupsBy(list, f);
    if (nonEmpty(g) < 2) return leaf();
    var o = { f: f, k: {} }, kids = s.k && typeof s.k === 'object' ? s.k : {};
    g.forEach(function (a, v) { if (a.length) o.k[v] = sanitize(kids[v], a, depth + 1); });
    return o;
  }
  /* Attach items, counts and Gini to every node of a tree structure. */
  function annotate(s, list, id, depth, val, parent) {
    var c = counts(list), m = majority(c);
    var n = { id: id, s: s, items: list, c: c, g: gini(c), maj: m.i, tie: m.tie, depth: depth, val: val, f: null, kids: [], parent: parent || null, pending: !!(s && s.pending) };
    if (s && s.f !== null && s.f !== undefined && s.k) {
      n.f = s.f;
      groupsBy(list, s.f).forEach(function (a, v) {
        if (a.length) n.kids.push(annotate(s.k[v] || leaf(), a, id + '-' + v, depth + 1, v, n));
      });
      if (n.kids.length < 2) { n.f = null; n.kids = []; }
    }
    return n;
  }
  function allNodes(root) { var out = []; (function rec(n) { out.push(n); n.kids.forEach(rec); })(root); return out; }
  function findNode(root, id) { var hit = null; allNodes(root).forEach(function (n) { if (n.id === id) hit = n; }); return hit; }
  function findStruct(s, id) {
    var parts = id.split('-').slice(1);
    for (var i = 0; i < parts.length; i++) { if (!s || !s.k) return null; s = s.k[parts[i]]; }
    return s || null;
  }
  /* Send one example down the tree. */
  function walk(root, it) {
    var path = [root], n = root, miss = null;
    while (n.f !== null) {
      var v = it.x[n.f], next = null;
      n.kids.forEach(function (k) { if (k.val === v) next = k; });
      if (!next) { miss = v; break; }
      n = next; path.push(n);
    }
    return { path: path, node: n, pred: n.maj, missing: miss, ok: n.maj === it.y };
  }
  function treeStats(root) {
    var st = { q: 0, leaves: 0, depth: 0, correct: 0, ones: 0, n: root.items.length };
    (function rec(n) {
      if (n.f !== null) { st.q++; n.kids.forEach(rec); }
      else { st.leaves++; st.depth = Math.max(st.depth, n.depth); st.correct += n.c[n.maj]; if (n.items.length === 1 && root.items.length > 1) st.ones++; }
    })(root);
    return st;
  }
  function testScore(root) {
    var ok = 0; IT().test.forEach(function (it) { if (walk(root, it).ok) ok++; });
    return ok;
  }

  /* ------------------------------------------------------------------ current tree */
  function myTree() {
    if (!state.trees[state.ds]) state.trees[state.ds] = sanitize(savedTrees[state.ds], IT().train, 0);
    return state.trees[state.ds];
  }
  function shownStruct(mode) {
    mode = mode || state.mode;
    if (mode === 'mine') return myTree();
    var full = autoFull();
    if (state.steps === null) return full;
    return truncate(full, bfsSplits(full).slice(0, state.steps));
  }
  /* My tree does not depend on the computer's max depth, so its key leaves the depth out:
     changing the depth must not throw away my test result. */
  function treeKey(mode) { mode = mode || state.mode; return state.ds + '|' + (mode === 'auto' ? state.depth : '-') + '|' + JSON.stringify(shownStruct(mode)); }
  function resOf(mode) { return state.results[state.ds + '|' + mode] || null; }
  function freshRes(mode, key) { var r = resOf(mode); return r && r.key === key ? r : null; }
  function selId() { return state.sel[state.mode] || 'r'; }
  function saveTrees() { var o = {}; DS_KEYS.forEach(function (k) { if (state.trees[k]) o[k] = state.trees[k]; else if (savedTrees[k]) o[k] = savedTrees[k]; }); store.set('trees', o); }

  var root = null;   // annotated tree that is on screen

  /* ------------------------------------------------------------------ tree drawing */
  var SVGNS = 'http://www.w3.org/2000/svg';
  var NODE_W = 150, GAP_X = 12, GAP_Y = 64, MAX_CHIPS = 24;

  function chip(it) {
    var c = el('span', { class: 'ichip', title: itemName(it) }, it.emoji);
    c.style.setProperty('--k', colorVar(it.y));
    var tag = itemTag(it);
    if (tag) c.appendChild(el('b', { text: tag }));
    return c;
  }
  function classBar(c, big) {
    var bar = el('span', { class: 'cbar' + (big ? ' big' : ''), 'aria-hidden': 'true' });
    c.forEach(function (x, k) { if (x) bar.appendChild(el('i', { style: { flexGrow: String(x), background: colorVar(k) } })); });
    return bar;
  }
  function ansBadge(k, extra) {
    var b = el('span', { class: 'ans' }, classText(k));
    b.style.setProperty('--k', colorVar(k));
    if (extra) b.appendChild(el('span', { class: 'tie', text: extra }));
    return b;
  }

  function nodeEl(n) {
    var isSplit = n.f !== null;
    var b = el('button', {
      type: 'button', class: 'tnode ' + (isSplit ? 'split' : 'leaf') + (n.id === selId() ? ' sel' : ''),
      'data-id': n.id, 'data-f': isSplit ? String(n.f) : '', 'data-maj': String(n.maj), 'data-n': String(n.items.length),
      'aria-pressed': n.id === selId() ? 'true' : 'false'
    });
    b.style.setProperty('--k', colorVar(n.maj));
    b.style.width = NODE_W + 'px';
    var label = [];
    if (isSplit) {
      b.appendChild(el('span', { class: 'tn-q', text: featQ(n.f) }));
      label.push(featQ(n.f));
    } else {
      var box = el('span', { class: 'tn-items', 'aria-hidden': 'true' });
      var sorted = n.items.slice().sort(function (a, z) { return a.y - z.y || a.i - z.i; });
      sorted.slice(0, MAX_CHIPS).forEach(function (it) { box.appendChild(chip(it)); });
      if (sorted.length > MAX_CHIPS) box.appendChild(el('span', { class: 'tn-more', text: '+' + EDU.fmt(sorted.length - MAX_CHIPS) }));
      b.appendChild(box);
      b.appendChild(ansBadge(n.maj, n.tie ? t('tie') : ''));
      label.push(t('leaf_answer', { c: className(n.maj) }));
    }
    b.appendChild(classBar(n.c));
    var cnt = countText(n.items.length), gi = t('gini_val', { g: f2(n.g) });
    b.appendChild(el('span', { class: 'tn-meta' }, el('span', { text: cnt }), el('span', { text: gi })));
    label.push(cnt, gi);
    b.setAttribute('aria-label', label.join(' · '));
    b.addEventListener('click', function () { selectNode(n.id, true); });
    return b;
  }

  function renderTree() {
    var canvas = $('#tree');
    canvas.innerHTML = '';
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'tree-edges');
    svg.setAttribute('aria-hidden', 'true');
    canvas.appendChild(svg);
    allNodes(root).forEach(function (n) {
      n.elm = nodeEl(n);
      if (newIds[n.id]) n.elm.classList.add('new');
      canvas.appendChild(n.elm);
    });
    newIds = {};
    var tok = el('div', { class: 'token', id: 'token', 'aria-hidden': 'true', hidden: true });
    canvas.appendChild(tok);
    layout(true);
  }
  var newIds = {};

  /* Tidy-tree layout in "slot" units: each subtree keeps a contour (min/max x per depth) and
     sibling subtrees are pushed together until they would touch. Small trees stay compact. */
  function contour(n) {
    if (!n.kids.length) { n.kidOff = []; return [[0, 0]]; }
    var conts = n.kids.map(contour), off = [0];
    var acc = conts[0].map(function (c) { return c.slice(); });
    for (var i = 1; i < conts.length; i++) {
      var c = conts[i], shift = -Infinity, d;
      for (d = 0; d < Math.min(acc.length, c.length); d++) shift = Math.max(shift, acc[d][1] - c[d][0] + 1);
      off.push(shift);
      for (d = 0; d < c.length; d++) {
        if (d < acc.length) acc[d] = [Math.min(acc[d][0], c[d][0] + shift), Math.max(acc[d][1], c[d][1] + shift)];
        else acc.push([c[d][0] + shift, c[d][1] + shift]);
      }
    }
    var mid = (off[0] + off[off.length - 1]) / 2;
    n.kidOff = off.map(function (o) { return o - mid; });
    return [[0, 0]].concat(acc.map(function (c) { return [c[0] - mid, c[1] - mid]; }));
  }
  function slotLayout() {
    contour(root);
    var lo = Infinity, hi = -Infinity;
    (function abs(n, u) {
      n.u = u; lo = Math.min(lo, u); hi = Math.max(hi, u);
      n.kids.forEach(function (k, i) { abs(k, u + n.kidOff[i]); });
    })(root, 0);
    allNodes(root).forEach(function (n) { n.u -= lo; });
    return hi - lo + 1;
  }

  function pickNodeWidth(slots) {
    var sc = $('#tree-scroll'), cw = sc ? sc.clientWidth : 360;
    var fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    var phone = window.innerWidth < 600;
    var maxW = fs ? 210 : (phone ? 142 : 172), minW = fs ? 140 : (phone ? 128 : 116);
    var fit = Math.floor(cw / Math.max(1, slots)) - GAP_X;
    return EDU.clamp(fit, minW, maxW);
  }

  function layout(focusSel) {
    if (!root || $('#pane-build').hidden) return;
    var canvas = $('#tree'), sc = $('#tree-scroll');
    var slots = slotLayout();
    var w = pickNodeWidth(slots);
    if (w !== NODE_W) { NODE_W = w; allNodes(root).forEach(function (n) { if (n.elm) n.elm.style.width = NODE_W + 'px'; }); }
    canvas.classList.toggle('narrow', NODE_W < 136);
    var nodes = allNodes(root), SW = NODE_W + GAP_X;
    nodes.forEach(function (n) { n.x = n.u * SW + GAP_X / 2; });
    var treeW = slots * SW, cw = sc.clientWidth || treeW;
    var W = Math.max(treeW, cw), off = (W - treeW) / 2;
    var levelH = [];
    nodes.forEach(function (n) { n.ph = n.elm.offsetHeight; levelH[n.depth] = Math.max(levelH[n.depth] || 0, n.ph); });
    var levelY = [], y = 26;   /* room above the root for the walking emoji */
    for (var d = 0; d < levelH.length; d++) { levelY[d] = y; y += (levelH[d] || 0) + GAP_Y; }
    var H = y - GAP_Y + 18;
    var rtl = isRtl();
    nodes.forEach(function (n) {
      var x = n.x + off;
      if (rtl) x = W - x - NODE_W;
      n.px = x; n.py = levelY[n.depth];
      n.elm.style.transform = 'translate(' + x + 'px,' + n.py + 'px)';
    });
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    var svg = canvas.querySelector('svg.tree-edges');
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    $$('.elabel', canvas).forEach(function (e) { e.remove(); });
    nodes.forEach(function (n) {
      if (!n.parent) return;
      var p = n.parent, x1 = p.px + NODE_W / 2, y1 = p.py + p.ph, x2 = n.px + NODE_W / 2, y2 = n.py, my = (y1 + y2) / 2;
      var path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + my + ', ' + x2 + ' ' + my + ', ' + x2 + ' ' + y2);
      path.setAttribute('data-id', n.id);
      svg.appendChild(path);
      var lab = el('span', { class: 'elabel', 'data-id': n.id, text: valText(p.f, n.val) });
      lab.style.maxWidth = (NODE_W - 4) + 'px';
      canvas.appendChild(lab);
      lab.style.transform = 'translate(' + (x2 - lab.offsetWidth / 2) + 'px,' + (y2 - 22 - lab.offsetHeight / 2) + 'px)';
    });
    markPath(curPath);
    if (focusSel) hScrollTo(findNode(root, selId()) || root, false);
  }

  /* highlight a walk path (array of node ids) */
  var curPath = null;
  function markPath(p) {
    curPath = p;
    var canvas = $('#tree');
    $$('.onpath', canvas).forEach(function (e) { e.classList.remove('onpath'); });
    $$('.hit-ok,.hit-bad', canvas).forEach(function (e) { e.classList.remove('hit-ok', 'hit-bad'); });
    if (!p) return;
    p.ids.forEach(function (id, i) {
      var nd = canvas.querySelector('.tnode[data-id="' + id + '"]');
      if (nd) nd.classList.add('onpath');
      if (i > 0) $$('[data-id="' + id + '"]', canvas).forEach(function (e) { if (!e.classList.contains('tnode')) e.classList.add('onpath'); });
    });
    if (p.result) {
      var last = canvas.querySelector('.tnode[data-id="' + p.ids[p.ids.length - 1] + '"]');
      if (last) last.classList.add(p.result === 'ok' ? 'hit-ok' : 'hit-bad');
    }
  }
  function moveToken(n, emoji) {
    var tok = $('#token');
    if (!tok || !n) return;
    tok.textContent = emoji;
    tok.hidden = false;
    /* sit just above the box's top corner (start side): the branch label and the box text stay readable */
    var x = isRtl() ? n.px + NODE_W - 40 : n.px - 4;
    tok.style.transform = 'translate(' + Math.max(0, x) + 'px,' + Math.max(0, n.py - 30) + 'px)';
    followNode(n);
  }
  /* Phones: the tree is wider (and often taller) than the screen. Bring a box into view when it is
     drawn as the selected box, or when a test example travels to it. */
  function hScrollTo(n, smooth) {
    var sc = $('#tree-scroll');
    if (!sc || !n || !n.elm || sc.scrollWidth <= sc.clientWidth + 1) return;
    var sr = sc.getBoundingClientRect(), r = n.elm.getBoundingClientRect();
    if (!sr.width || (r.left >= sr.left + 4 && r.right <= sr.right - 4)) return;
    var delta = (r.left + r.width / 2) - (sr.left + sr.width / 2);
    if (sc.scrollBy) sc.scrollBy({ left: delta, behavior: smooth && !reduced() ? 'smooth' : 'auto' });
    else sc.scrollLeft += delta;
  }
  function followNode(n) {
    if (!n || !n.elm) return;
    hScrollTo(n, true);
    var r = n.elm.getBoundingClientRect(), fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (fs) return;   /* fullscreen pane scrolls by itself; the page does not */
    var hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr')) || 0;
    var top = hdr + $('#walk').offsetHeight + 8;
    var dy = r.top - 30 < top ? r.top - 30 - top : (r.bottom > window.innerHeight - 8 ? Math.min(r.bottom - window.innerHeight + 24, r.top - 30 - top) : 0);
    if (Math.abs(dy) > 2) window.scrollBy({ top: dy, behavior: reduced() ? 'auto' : 'smooth' });
  }

  /* ------------------------------------------------------------------ selection + editing */
  function selectNode(id, fromUser) {
    state.sel[state.mode] = id;
    $$('#tree .tnode').forEach(function (b) {
      var on = b.getAttribute('data-id') === id;
      b.classList.toggle('sel', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    renderInspector();
    if (fromUser && window.innerWidth < 1200) {
      var ins = $('#ins'), r = ins.getBoundingClientRect();
      if (r.top > window.innerHeight - 80) ins.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  function pushUndo() {
    var u = state.undo[state.ds];
    u.push(JSON.stringify({ tree: myTree(), sel: state.sel.mine }));
    if (u.length > 60) u.shift();
  }
  function changed() {
    stopAnim();
    saveTrees();
    renderBuild();
  }
  function doSplit(id, f) {
    var n = findNode(root, id);
    if (!n || n.f !== null || nonEmpty(groupsBy(n.items, f)) < 2) return;
    pushUndo();
    var s = findStruct(myTree(), id);
    if (!s) return;
    s.f = f; s.k = {};
    var firstMixed = null;
    groupsBy(n.items, f).forEach(function (a, v) {
      if (!a.length) return;
      s.k[v] = leaf();
      newIds[id + '-' + v] = 1;
      if (firstMixed === null && gini(counts(a)) > EPS) firstMixed = id + '-' + v;
    });
    state.sel.mine = firstMixed || id;
    changed();
  }
  function removeSplit(id) {
    var s = findStruct(myTree(), id);
    if (!s || s.f === null) return;
    pushUndo();
    s.f = null; delete s.k;
    state.sel.mine = id;
    changed();
  }
  function undo() {
    var u = state.undo[state.ds];
    if (!u.length) return;
    var prev = JSON.parse(u.pop());
    state.trees[state.ds] = sanitize(prev.tree, IT().train, 0);
    state.sel.mine = prev.sel || 'r';
    changed();
  }
  function clearTree() {
    if (myTree().f === null) return;
    if (!window.confirm(t('confirm_clear'))) return;
    pushUndo();
    state.trees[state.ds] = leaf();
    state.sel.mine = 'r';
    changed();
  }

  /* ------------------------------------------------------------------ inspector */
  function renderInspector() {
    var box = $('#ins');
    box.innerHTML = '';
    if (!root) return;
    var n = findNode(root, selId()) || root;
    var chain = [], p = n;
    while (p.parent) { chain.unshift(p); p = p.parent; }
    var crumbs = [t('root_lbl')].concat(chain.map(function (c) { return featS(c.parent.f) + ' = ' + valName(c.parent.f, c.val); }));
    box.appendChild(el('div', { class: 'row spread' }, el('h2', { class: 'h-sm mb0', i18n: 'sel_h' }),
      el('button', { type: 'button', class: 'btn btn-sm btn-ghost only-narrow', i18n: 'see_tree', onclick: function () { $('#tree-scroll').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }); } })));
    box.appendChild(el('p', { class: 'crumbs small', id: 'ins-path', text: crumbs.join(' ' + arrow() + ' ') }));

    var purity = pct(n.c[n.maj], n.items.length);
    box.appendChild(el('div', { class: 'row small', id: 'ins-stats', 'data-n': String(n.items.length), 'data-gini': String(n.g) },
      el('span', { class: 'badge primary', text: countText(n.items.length) }),
      el('span', { class: 'badge', text: t('gini_val', { g: f2(n.g) }) }),
      el('span', { class: 'badge', text: t('pure_pct', { p: EDU.fmt(purity) }) })));
    box.appendChild(el('p', { class: 'mb0', style: { marginTop: '8px' } }, el('b', { text: t('leaf_answer', { c: className(n.maj) }) }), n.tie ? el('span', { class: 'tie', text: ' ' + t('tie') }) : null));
    var mix = el('div', { class: 'mix' });
    n.c.forEach(function (x, k) { if (x) mix.appendChild(ansBadge(k, '× ' + EDU.fmt(x))); });
    box.appendChild(classBar(n.c, true));
    box.appendChild(mix);
    box.appendChild(el('hr', { class: 'divider' }));

    var act = el('div', { id: 'ins-act' });
    box.appendChild(act);
    if (state.mode === 'mine') inspectorMine(act, n); else inspectorAuto(act, n);
    box.appendChild(el('hr', { class: 'divider' }));
    var grid = el('div', { class: 'igrid', id: 'ins-items' });
    n.items.slice().sort(function (a, z) { return a.y - z.y || a.i - z.i; }).forEach(function (it) {
      var c = el('div', { class: 'icard' }, el('span', { class: 'em', 'aria-hidden': 'true', text: it.emoji }), el('span', { class: 'nm', text: itemName(it) }));
      c.style.setProperty('--k', colorVar(it.y));
      grid.appendChild(c);
    });
    box.appendChild(grid);
  }

  function optionPreview(n, f) {
    /* each "value: count" part is isolated so number-only values (legs 0/2/4) keep their order in RTL */
    var g = groupsBy(n.items, f), box = el('span', { class: 'op' }), first = true;
    g.forEach(function (a, v) {
      if (!a.length) return;
      if (!first) box.appendChild(document.createTextNode(' · '));
      first = false;
      box.appendChild(el('bdi', { text: valName(f, v) + ': ' + EDU.fmt(a.length) }));
    });
    return box;
  }

  function inspectorMine(box, n) {
    if (n.f !== null) {
      box.appendChild(el('p', {}, el('b', { text: t('asks', { q: featQ(n.f) }) })));
      box.appendChild(el('p', { class: 'small muted', i18n: 'after_split' }));
      box.appendChild(el('button', { type: 'button', class: 'btn btn-danger btn-sm', id: 'remove-q', i18n: 'remove_q', onclick: function () { removeSplit(n.id); } }));
      return;
    }
    if (n.g < EPS) {
      box.appendChild(el('p', { class: 'callout success mb0', id: 'pure-msg', i18n: 'pure_msg' }));
      return;
    }
    box.appendChild(el('h3', { class: 'h-sm', i18n: 'choose_q' }));
    var opts = el('div', { class: 'opts' }), scores = [];
    for (var f = 0; f < D().nv.length; f++) scores.push(splitGini(n.items, f));
    var best = null;
    scores.forEach(function (s) { if (s !== null && (best === null || s < best)) best = s; });
    scores.forEach(function (s, f) {
      var b = el('button', { type: 'button', class: 'opt', id: 'split-' + f, disabled: s === null, onclick: function () { doSplit(n.id, f); } },
        el('span', { class: 'oq', text: featQ(f) }),
        s === null ? el('span', { class: 'op', text: t('same_all') }) : optionPreview(n, f));
      if (state.hints && s !== null) {
        if (Math.abs(s - best) < EPS) b.classList.add('best');
        b.appendChild(el('span', { class: 'og', text: t('gini_after', { g: f2(s) }) + (Math.abs(s - best) < EPS ? ' ★' : '') }));
      }
      opts.appendChild(b);
    });
    box.appendChild(opts);
    if (state.hints) box.appendChild(el('p', { class: 'small muted', style: { marginTop: '8px' }, i18n: 'hint_note' }));
  }

  function inspectorAuto(box, n) {
    var full = autoFull(), fullNode = findNode(annotate(full, IT().train, 'r', 0, null), n.id);
    var chosen = fullNode ? fullNode.f : null;
    var scores = [];
    for (var f = 0; f < D().nv.length; f++) scores.push(splitGini(n.items, f));
    if (n.g >= EPS) {
      var tb = el('table', { class: 'table gtable', id: 'gini-table' });
      tb.appendChild(el('thead', {}, el('tr', {}, el('th', { i18n: 'tbl_q' }), el('th', { class: 'num', i18n: 'tbl_gini' }))));
      var body = el('tbody');
      scores.forEach(function (s, f) {
        var tr = el('tr', { class: chosen === f ? 'chosen' : '' },
          el('td', {}, featQ(f), chosen === f ? el('span', { class: 'badge success', style: { marginInlineStart: '6px' }, text: t('chosen') }) : null),
          el('td', { class: 'num', text: s === null ? '—' : f2(s) }));
        body.appendChild(tr);
      });
      tb.appendChild(body);
      box.appendChild(el('div', { class: 'scroll-x' }, tb));
    }
    var msg;
    if (n.f !== null) msg = t('auto_chose', { q: featQ(n.f), a: f2(n.g), b: f2(scores[n.f]) });
    else if (n.pending) msg = t('stop_step');
    else if (n.g < EPS) msg = t('stop_pure');
    else if (state.depth > 0 && n.depth >= state.depth) msg = t('stop_depth');
    else msg = t('stop_none');
    box.appendChild(el('p', { class: 'callout small', id: 'auto-why', style: { marginTop: '10px' }, text: msg }));
    var ties = 0, low = null;
    scores.forEach(function (s) { if (s !== null && (low === null || s < low - EPS)) low = s; });
    scores.forEach(function (s) { if (s !== null && low !== null && Math.abs(s - low) < EPS) ties++; });
    if (n.f !== null && ties > 1) box.appendChild(el('p', { class: 'small muted mb0', i18n: 'tie_note' }));
  }

  /* ------------------------------------------------------------------ stats, test, compare */
  function accText(c, n) { return t('acc_of', { c: EDU.fmt(c), n: EDU.fmt(n), p: EDU.fmt(pct(c, n)) }); }

  function renderStats() {
    var st = treeStats(root), box = $('#stats');
    box.innerHTML = '';
    box.setAttribute('data-correct', String(st.correct));
    box.setAttribute('data-total', String(st.n));
    box.setAttribute('data-q', String(st.q));
    box.setAttribute('data-leaves', String(st.leaves));
    function stat(k, v, id) { return el('div', { class: 'stat', id: id }, el('span', { text: t(k) }), el('b', { text: v })); }
    box.appendChild(stat('train_acc', accText(st.correct, st.n), 'stat-train'));
    box.appendChild(stat('questions', EDU.fmt(st.q), 'stat-q'));
    box.appendChild(stat('leaves', EDU.fmt(st.leaves), 'stat-leaves'));
    box.appendChild(stat('depth', EDU.fmt(st.depth), 'stat-depth'));
    var w = $('#warn-line');
    w.innerHTML = '';
    if (state.mode === 'mine' && st.ones > 0) w.appendChild(el('p', { class: 'callout warning small mb0 warn-line', i18n: 'one_warn' }));
  }

  function renderTestCard() {
    $('#test-h').textContent = t('test_h', { n: EDU.fmt(IT().test.length) });
    var res = freshRes(state.mode, treeKey()), fresh = !!res;
    var tb = $('#test-table');
    tb.innerHTML = '';
    tb.appendChild(el('thead', {}, el('tr', {}, el('th', { i18n: 'th_name' }), el('th', { i18n: 'th_says' }), el('th', { i18n: 'th_real' }), el('th', { 'aria-label': t('result'), text: '' }), el('th', { 'aria-label': t('replay'), text: '' }))));
    var body = el('tbody');
    IT().test.forEach(function (it, i) {
      var r = fresh && res.rows[i];
      var tr = el('tr', { id: 'trow-' + i, 'data-pred': r ? String(r.pred) : '', 'data-ok': r ? (r.ok ? '1' : '0') : '' },
        el('td', {}, el('span', { class: 'nm-cell' }, el('span', { class: 'em', 'aria-hidden': 'true', text: it.emoji }), itemName(it))),
        el('td', {}, r ? ansBadge(r.pred) : el('span', { class: 'muted', text: '?' })),
        el('td', {}, ansBadge(it.y)),
        el('td', { class: r ? (r.ok ? 'ok' : 'bad') : '', text: r ? (r.ok ? '✓' : '✗') : '' }),
        el('td', {}, r ? el('button', { type: 'button', class: 'btn btn-sm btn-ghost replay', 'aria-label': t('replay'), title: t('replay'), text: '▶', onclick: function () { replay(i); } }) : null));
      body.appendChild(tr);
    });
    tb.appendChild(body);
    var sum = $('#test-summary');
    if (fresh) {
      sum.setAttribute('data-done', '1');
      sum.setAttribute('data-correct', String(res.correct));
      sum.innerHTML = '';
      sum.appendChild(el('b', { text: t('test_acc') + ': ' }));
      sum.appendChild(document.createTextNode(accText(res.correct, res.rows.length)));
    } else {
      sum.setAttribute('data-done', '0');
      sum.removeAttribute('data-correct');
      sum.textContent = t('not_run');
      sum.className = 'mb0 muted';
      return;
    }
    sum.className = 'mb0';
  }

  function renderCompare() {
    var mineRoot = annotate(myTree(), IT().train, 'r', 0, null);
    var autoS = autoFull(), autoRoot = annotate(autoS, IT().train, 'r', 0, null);
    var sm = treeStats(mineRoot), sa = treeStats(autoRoot);
    var keyMine = treeKey('mine');
    var keyAuto = state.ds + '|' + state.depth + '|' + JSON.stringify(autoS);   /* the whole computer tree, not a step-by-step part */
    var rm = freshRes('mine', keyMine), ra = freshRes('auto', keyAuto);
    var tm = rm ? rm.correct : null, ta = ra ? ra.correct : null;
    var nT = IT().test.length;
    var tb = $('#cmp-table');
    tb.innerHTML = '';
    tb.appendChild(el('thead', {}, el('tr', {}, el('th', { text: '' }), el('th', { class: 'num', i18n: 'mode_mine' }), el('th', { class: 'num', i18n: 'mode_auto' }))));
    function row(k, a, b, id) { return el('tr', {}, el('th', { scope: 'row', text: t(k) }), el('td', { class: 'num', id: id + '-mine', text: a }), el('td', { class: 'num', id: id + '-auto', text: b })); }
    var body = el('tbody');
    body.appendChild(row('questions', EDU.fmt(sm.q), EDU.fmt(sa.q), 'cmp-q'));
    body.appendChild(row('leaves', EDU.fmt(sm.leaves), EDU.fmt(sa.leaves), 'cmp-leaves'));
    body.appendChild(row('train_acc', EDU.fmt(pct(sm.correct, sm.n)) + '%', EDU.fmt(pct(sa.correct, sa.n)) + '%', 'cmp-train'));
    body.appendChild(row('test_acc', tm === null ? '—' : EDU.fmt(pct(tm, nT)) + '%', ta === null ? '—' : EDU.fmt(pct(ta, nT)) + '%', 'cmp-test'));
    tb.appendChild(body);
    var note = $('#cmp-note'), msgs = [];
    if (tm === null || ta === null) msgs.push(t('cmp_need'));
    else if (tm > ta) msgs.push(t('cmp_better_me'));
    else if (tm === ta) msgs.push(t('cmp_same'));
    else msgs.push(t('cmp_better_ai'));
    if (sm.q > 0 && sm.q < sa.q && sm.correct >= sa.correct) msgs.push(t('cmp_smaller'));
    note.textContent = msgs.join(' ');
    note.className = 'mb0 ' + (tm !== null && ta !== null && tm >= ta ? 'callout success' : 'muted');
  }

  /* ---------- test animation ---------- */
  var anim = null;
  function later(fn, ms) { if (!anim) return; var id = setTimeout(fn, ms); anim.timers.push(id); }
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function stepMs() { return reduced() ? 200 : 650; }

  function walkCaption(it, w, k) {
    var name = itemName(it), n = w.path[k];
    if (k < w.path.length - 1) {
      return { text: t('walk_q', { name: name, q: featQ(n.f), v: valName(n.f, it.x[n.f]) }), cls: '' };
    }
    var txt = w.ok ? t('walk_ok', { name: name, c: className(w.pred) }) : t('walk_bad', { name: name, c: className(w.pred), r: className(it.y) });
    if (w.missing !== null) txt = t('no_branch', { v: valName(w.node.f, w.missing) }) + ' ' + txt;
    return { text: txt, cls: w.ok ? 'ok' : 'bad' };
  }
  /* The caption only sticks under the header while an example is walking down the tree; a long tip
     must not cover the tree on a phone the rest of the time. */
  function setWalk(text, cls) { var p = $('#walk'); p.textContent = text; p.className = 'walk' + (cls ? ' ' + cls : '') + (anim ? ' live' : ''); }

  function animateWalk(it, w, done) {
    var k = 0;
    function step() {
      if (!anim) return;
      var ids = w.path.slice(0, k + 1).map(function (n) { return n.id; });
      var last = k === w.path.length - 1;
      markPath({ ids: ids, result: last ? (w.ok ? 'ok' : 'bad') : null });
      moveToken(w.path[k], it.emoji);
      var cap = walkCaption(it, w, k);
      setWalk(cap.text, cap.cls);
      if (last) { later(done, stepMs() + 350); return; }
      k++;
      later(step, stepMs());
    }
    step();
  }

  function runTest() {
    if (anim || !root) return;
    var tests = IT().test, rows = tests.map(function (it) { return walk(root, it); });
    var key = treeKey(), mode = state.mode;
    anim = { timers: [], rows: rows, key: key, rk: state.ds + '|' + mode, i: 0 };
    $('#run-test').disabled = true;
    $('#skip-test').hidden = false;
    delete state.results[anim.rk];
    renderTestCard();
    var sc = $('#tree-scroll'), r = sc.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.6) sc.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    function next() {
      if (!anim) return;
      if (anim.i >= rows.length) return finishTest();
      var i = anim.i;
      animateWalk(tests[i], rows[i], function () { if (!anim) return; revealRow(i, rows[i]); anim.i++; later(next, 250); });
    }
    later(next, reduced() ? 50 : 400);
  }
  function revealRow(i, r) {
    var tr = $('#trow-' + i);
    if (!tr) return;
    tr.setAttribute('data-pred', String(r.pred));
    tr.setAttribute('data-ok', r.ok ? '1' : '0');
    var cells = tr.children;
    cells[1].innerHTML = ''; cells[1].appendChild(ansBadge(r.pred));
    cells[3].className = r.ok ? 'ok' : 'bad'; cells[3].textContent = r.ok ? '✓' : '✗';
  }
  function finishTest() {
    if (!anim) return;
    var a = anim;
    a.timers.forEach(clearTimeout);
    anim = null;
    var correct = a.rows.filter(function (r) { return r.ok; }).length;
    state.results[a.rk] = { key: a.key, correct: correct, rows: a.rows.map(function (r) { return { pred: r.pred, ok: r.ok }; }) };
    store.set('results', state.results);
    $('#run-test').disabled = false;
    $('#skip-test').hidden = true;
    var tok = $('#token'); if (tok) tok.hidden = true;
    renderTestCard();
    renderCompare();
    setWalk(t('test_done', { c: EDU.fmt(correct), n: EDU.fmt(a.rows.length) }), correct === a.rows.length ? 'ok' : '');
  }
  function skipTest() { if (anim) finishTest(); }
  function stopAnim() {
    if (!anim) return;
    anim.timers.forEach(clearTimeout);
    anim = null;
    $('#run-test').disabled = false;
    $('#skip-test').hidden = true;
    $('#walk').classList.remove('live');
    var tok = $('#token'); if (tok) tok.hidden = true;
  }
  function replay(i) {
    if (anim || !root) return;
    var it = IT().test[i], w = walk(root, it);
    anim = { timers: [], single: true };
    $('#run-test').disabled = true;
    var sc = $('#tree-scroll'), r = sc.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight + 200) sc.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    animateWalk(it, w, function () { stopAnim(); });
  }

  /* ------------------------------------------------------------------ build tab */
  function renderToolbar() {
    $('#mode-mine').setAttribute('aria-pressed', state.mode === 'mine' ? 'true' : 'false');
    $('#mode-auto').setAttribute('aria-pressed', state.mode === 'auto' ? 'true' : 'false');
    $$('.mine-only').forEach(function (e) { e.hidden = state.mode !== 'mine'; });
    $$('.auto-only').forEach(function (e) { e.hidden = state.mode !== 'auto'; });
    $('#undo').disabled = !state.undo[state.ds].length;
    $('#clear-tree').disabled = myTree().f === null;
    $('#hints').checked = state.hints;
    var seg = $('#depth-seg');
    seg.innerHTML = '';
    [1, 2, 3, 4, 0].forEach(function (d) {
      seg.appendChild(el('button', {
        type: 'button', id: 'depth-' + d, 'aria-pressed': state.depth === d ? 'true' : 'false',
        text: d ? EDU.fmt(d) : t('no_limit'), onclick: function () { state.depth = state.depths[state.ds] = d; store.set('depth', state.depths); state.steps = null; state.sel.auto = 'r'; stopAnim(); renderBuild(); renderLearn(); }
      }));
    });
    var total = bfsSplits(autoFull()).length;
    $('#step-next').disabled = state.steps === null || state.steps >= total;
    $('#step-all').disabled = state.steps === null;
    $('#step-label').textContent = state.steps === null ? '' : t('step_of', { a: EDU.fmt(state.steps), b: EDU.fmt(total) });
    $('#run-test').disabled = !!anim;
  }

  function renderBuild() {
    root = annotate(shownStruct(), IT().train, 'r', 0, null);
    if (!findNode(root, selId())) state.sel[state.mode] = 'r';
    $('#target').textContent = C().target;
    renderToolbar();
    curPath = null;
    renderTree();
    renderInspector();
    renderStats();
    renderTestCard();
    renderCompare();
    if (!anim) setWalk(t(state.mode === 'mine' ? 'tip_tap' : 'auto_tip'), '');
  }

  /* ------------------------------------------------------------------ data tab */
  function renderData() {
    var c = C(), its = IT();
    $('#sheet-title').textContent = t('app_title') + ': ' + c.name;
    $('#sheet-target').textContent = c.target;
    $('#view-table').setAttribute('aria-pressed', state.view === 'table' ? 'true' : 'false');
    $('#view-cards').setAttribute('aria-pressed', state.view === 'cards' ? 'true' : 'false');
    var lg = $('#legend');
    lg.innerHTML = '';
    lg.appendChild(el('b', { class: 'small', text: t('answers_lbl') }));
    c.classes.forEach(function (x, k) { lg.appendChild(ansBadge(k)); });
    $('#data-note').textContent = c.note;
    $('#train-h').textContent = t('train_h', { n: EDU.fmt(its.train.length) });
    $('#testdata-h').textContent = t('testdata_h', { n: EDU.fmt(its.test.length) });
    fillItems($('#train-view'), its.train, false);
    fillItems($('#test-view'), its.test, true);
  }
  function fillItems(host, list, isTest) {
    host.innerHTML = '';
    var nf = D().nv.length;
    /* table (always built so the worksheet prints a table) */
    var tb = el('table', { class: 'table dtable' });
    var hr = el('tr', {}, el('th', { text: '#' }), el('th', { i18n: 'th_name' }));
    for (var f = 0; f < nf; f++) hr.appendChild(el('th', { title: featQ(f), text: featS(f) }));
    hr.appendChild(el('th', { i18n: 'th_label' }));
    if (isTest) hr.appendChild(el('th', { class: 'pcol', i18n: 'sheet_says' }));
    tb.appendChild(el('thead', {}, hr));
    var body = el('tbody');
    list.forEach(function (it, i) {
      var noisy = !isTest && (D().noise || []).indexOf(i) >= 0;
      var tr = el('tr', { class: noisy ? 'noisy' : '' }, el('td', { text: isTest ? LETTERS[i] : EDU.fmt(i + 1) }),
        el('td', { class: 'nmcol' }, el('span', { class: 'nm-cell' }, el('span', { class: 'em', 'aria-hidden': 'true', text: it.emoji }), itemName(it), noisy ? el('span', { 'aria-hidden': 'true', text: ' ⚠' }) : null)));
      for (var f2i = 0; f2i < nf; f2i++) tr.appendChild(el('td', { text: valText(f2i, it.x[f2i]) }));
      tr.appendChild(el('td', {}, ansBadge(it.y)));
      if (isTest) tr.appendChild(el('td', { class: 'pcol', text: '' }));
      body.appendChild(tr);
    });
    tb.appendChild(body);
    var tableWrap = el('div', { class: 'scroll-x' + (state.view === 'cards' ? ' print-only' : '') }, tb);
    host.appendChild(tableWrap);
    if (state.view !== 'cards') return;
    var grid = el('div', { class: 'dcards dcards-wrap no-print' });
    list.forEach(function (it, i) {
      var ul = el('ul');
      for (var f = 0; f < nf; f++) ul.appendChild(el('li', {}, el('span', { text: featS(f) }), el('b', { text: valText(f, it.x[f]) })));
      var noisy = !isTest && (D().noise || []).indexOf(i) >= 0;   /* flag the odd day in card view too */
      var card = el('div', { class: 'dcard' + (noisy ? ' noisy' : '') },
        el('div', { class: 'row spread' }, el('span', { class: 'big', 'aria-hidden': 'true', text: it.emoji }), el('span', { class: 'badge', text: isTest ? LETTERS[i] : '#' + EDU.fmt(i + 1) })),
        el('b', {}, itemName(it), noisy ? el('span', { 'aria-hidden': 'true', text: ' ⚠' }) : null), ul, ansBadge(it.y));
      card.style.setProperty('--k', colorVar(it.y));
      grid.appendChild(card);
    });
    host.appendChild(grid);
  }

  /* ------------------------------------------------------------------ learn tab */
  function renderLearn() {
    var c = C(), its = IT(), cnt = counts(its.train), n = its.train.length;
    /* worked Gini example for the start group */
    var parts = cnt.map(function (x) { return '(' + x + '/' + n + ')²'; });
    var g = gini(cnt);
    var names = cnt.map(function (x, k) { return EDU.fmt(x) + ' ' + className(k); }).join(EDU.lang === 'ur' ? '، ' : ', ');
    /* the class names are a line of normal text in the page's own direction (Urdu would be scrambled
       inside the left-to-right formula box); only the formula itself is forced left-to-right */
    var ex = $('#gini-ex');
    ex.innerHTML = '';
    ex.appendChild(el('span', { class: 'gx-names', dir: isRtl() ? 'rtl' : 'ltr', text: names }));
    ex.appendChild(el('span', { class: 'gx-f', dir: 'ltr', text: 'Gini = 1 − ' + parts.join(' − ') + ' = ' + f3(g) }));
    /* depth chart */
    var full = autoFull(state.ds, 0), fullDepth = treeStats(annotate(full, its.train, 'r', 0, null)).depth;
    var rows = [];
    for (var d = 0; d <= fullDepth; d++) {
      var sd = d === 0 ? leaf() : (d === fullDepth ? full : buildAuto(its.train, 0, d));
      var r = annotate(sd, its.train, 'r', 0, null);
      var st = treeStats(r);
      rows.push({ d: d, tr: pct(st.correct, n), te: pct(testScore(r), its.test.length) });
    }
    var bestTe = Math.max.apply(null, rows.map(function (r) { return r.te; }));
    var bestD = rows.filter(function (r) { return r.te === bestTe; })[0].d;
    var last = rows[rows.length - 1];
    /* only mark a "best depth" when deeper trees really do worse on the test (overfitting) */
    var overfit = bestD < fullDepth && last.te < bestTe;
    $('#chart-h').textContent = t('chart_h');
    var chart = $('#chart');
    chart.innerHTML = '';
    var bars = el('div', { class: 'chart', id: 'depth-chart', role: 'img', 'aria-label': t('chart_h') });
    var xl = el('div', { class: 'xlabels', 'aria-hidden': 'true' });
    rows.forEach(function (r) {
      var grp = el('div', { class: 'cg' + (overfit && r.d === bestD ? ' best' : ''), 'data-d': String(r.d), 'data-train': String(r.tr), 'data-test': String(r.te) },
        el('div', { class: 'bars' },
          el('div', { class: 'bar tr', style: { height: (r.tr * 1.8) + 'px' } }, el('span', { text: EDU.fmt(r.tr) + '%' })),
          el('div', { class: 'bar te', style: { height: (r.te * 1.8) + 'px' } }, el('span', { text: EDU.fmt(r.te) + '%' }))));
      bars.appendChild(grp);
      xl.appendChild(el('span', { text: EDU.fmt(r.d) }));
    });
    chart.appendChild(bars);
    chart.appendChild(xl);
    chart.appendChild(el('p', { class: 'center small muted mb0', i18n: 'chart_x' }));
    $('#chart-note').textContent = overfit
      ? t('chart_overfit', { d: EDU.fmt(bestD), p: EDU.fmt(bestTe), q: EDU.fmt(last.te) })
      : t('chart_nooverfit');
    renderBasket();
  }
  function renderBasket() {
    var a = state.basket[0], b = state.basket[1], n = a + b;
    $('#apple-n').textContent = EDU.fmt(a);
    $('#mango-n').textContent = EDU.fmt(b);
    $('#apple-minus').disabled = a <= 0; $('#mango-minus').disabled = b <= 0;
    $('#apple-plus').disabled = a >= 12; $('#mango-plus').disabled = b >= 12;
    var bk = $('#basket');
    bk.textContent = new Array(a + 1).join('🍎') + new Array(b + 1).join('🥭');
    var res = $('#basket-res');
    if (!n) { $('#basket-f').textContent = 'Gini = ?'; res.textContent = t('basket_empty'); res.setAttribute('data-g', ''); return; }
    var g = gini([a, b]);
    $('#basket-f').textContent = 'Gini = 1 − (' + a + '/' + n + ')² − (' + b + '/' + n + ')² = ' + f3(g);
    res.setAttribute('data-g', String(g));
    var extra = g < EPS ? t('basket_pure') : (a === b ? t('basket_mix') : '');
    res.textContent = t('basket_res', { g: f3(g) }) + (extra ? ' ' + extra : '');
  }
  function bump(k, d) {
    state.basket[k] = EDU.clamp(state.basket[k] + d, 0, 12);
    store.set('basket', state.basket);
    renderBasket();
  }

  /* ------------------------------------------------------------------ tabs, dataset, whole page */
  function renderTabs() {
    ['build', 'data', 'learn'].forEach(function (k) {
      var on = state.tab === k;
      $('#tab-' + k).setAttribute('aria-selected', on ? 'true' : 'false');
      $('#tab-' + k).tabIndex = on ? 0 : -1;
      $('#pane-' + k).hidden = !on;
    });
  }
  function renderDsSeg() {
    var all = window.APP_CONTENT || {}, L = all[EDU.lang] || all.en;
    DS_KEYS.forEach(function (k) {
      var b = $('#ds-' + k);
      b.setAttribute('aria-pressed', state.ds === k ? 'true' : 'false');
      b.querySelector('.ds-name').textContent = L[k].name;
    });
  }
  function renderAll() {
    renderDsSeg();
    renderTabs();
    renderBuild();
    renderData();
    renderLearn();
  }

  function setTab(k) {
    if (state.tab === k) return;
    stopAnim();
    state.tab = k; store.set('tab', k);
    renderTabs();
    if (k === 'build') renderBuild();
  }
  function setDs(k) {
    if (state.ds === k) return;
    stopAnim();
    state.ds = k; store.set('ds', k);
    state.depth = state.depths[k];
    state.sel = { mine: 'r', auto: 'r' };
    state.steps = null;
    renderAll();
  }
  function setMode(m) {
    if (state.mode === m) return;
    stopAnim();
    state.mode = m; store.set('mode', m);
    renderBuild();
  }

  /* ------------------------------------------------------------------ print */
  function fitTreeForPrint() {
    var canvas = $('#tree');
    if (!canvas || $('#pane-build').hidden) return;
    var w = parseFloat(canvas.style.width) || canvas.offsetWidth;
    canvas.style.zoom = w > 700 ? String(700 / w) : '';
  }
  function doPrint(mode) {
    document.body.setAttribute('data-print', mode);
    if (mode === 'tree') fitTreeForPrint();
    setTimeout(function () { window.print(); }, 50);
  }
  window.addEventListener('beforeprint', fitTreeForPrint);
  window.addEventListener('afterprint', function () { document.body.removeAttribute('data-print'); var c = $('#tree'); if (c) c.style.zoom = ''; });

  /* ------------------------------------------------------------------ wire up */
  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  DS_KEYS.forEach(function (k) { $('#ds-' + k).addEventListener('click', function () { setDs(k); }); });
  ['build', 'data', 'learn'].forEach(function (k) { $('#tab-' + k).addEventListener('click', function () { setTab(k); }); });
  $('.tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var order = ['build', 'data', 'learn'], i = order.indexOf(state.tab);
    var dir = (e.key === 'ArrowRight') !== isRtl() ? 1 : -1;
    var k = order[(i + dir + 3) % 3];
    setTab(k); $('#tab-' + k).focus();
  });
  $('#mode-mine').addEventListener('click', function () { setMode('mine'); });
  $('#mode-auto').addEventListener('click', function () { setMode('auto'); });
  $('#undo').addEventListener('click', undo);
  $('#clear-tree').addEventListener('click', clearTree);
  $('#hints').addEventListener('change', function () { state.hints = this.checked; store.set('hints', state.hints); renderInspector(); });
  $('#step-start').addEventListener('click', function () { stopAnim(); state.steps = 0; state.sel.auto = 'r'; renderBuild(); });
  $('#step-next').addEventListener('click', function () {
    var order = bfsSplits(autoFull());
    if (state.steps === null || state.steps >= order.length) return;
    stopAnim();
    /* select the group that is about to be split, so the Gini table explains the choice */
    var fullRoot = annotate(autoFull(), IT().train, 'r', 0, null), target = null;
    allNodes(fullRoot).forEach(function (n) { if (n.s === order[state.steps]) target = n; });
    state.steps++;
    if (target) { state.sel.auto = target.id; target.kids.forEach(function (k) { newIds[k.id] = 1; }); }
    renderBuild();
  });
  $('#step-all').addEventListener('click', function () { stopAnim(); state.steps = null; renderBuild(); });
  $('#run-test').addEventListener('click', runTest);
  $('#skip-test').addEventListener('click', skipTest);
  $('#fs').addEventListener('click', function () { EDU.fullscreen($('#pane-build')); });
  $('#print-tree').addEventListener('click', function () { doPrint('tree'); });
  $('#print-sheet').addEventListener('click', function () { doPrint('sheet'); });
  $('#view-table').addEventListener('click', function () { state.view = 'table'; store.set('view', 'table'); renderData(); });
  $('#view-cards').addEventListener('click', function () { state.view = 'cards'; store.set('view', 'cards'); renderData(); });
  $('#apple-minus').addEventListener('click', function () { bump(0, -1); });
  $('#apple-plus').addEventListener('click', function () { bump(0, 1); });
  $('#mango-minus').addEventListener('click', function () { bump(1, -1); });
  $('#mango-plus').addEventListener('click', function () { bump(1, 1); });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z') && state.tab === 'build' && state.mode === 'mine') {
      var tg = e.target && e.target.tagName;
      if (tg === 'INPUT' || tg === 'TEXTAREA') return;
      e.preventDefault(); undo();
    }
  });

  var rz = null;
  function setHdr() { var h = $('.edu-top'); document.documentElement.style.setProperty('--hdr', (h ? h.offsetHeight : 0) + 'px'); }
  function relayoutSoon() { clearTimeout(rz); rz = setTimeout(function () { setHdr(); if (state.tab === 'build' && root) layout(); }, 120); }
  window.addEventListener('resize', relayoutSoon);
  document.addEventListener('fullscreenchange', relayoutSoon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (root) layout(true); });
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { if (root) layout(); });

  EDU.onLang(function () { stopAnim(); renderAll(); setHdr(); });
  renderAll();
  setHdr();
})();
