/* Handwriting Practice Sheets: tracing and four-line practice pages for 12 Indian scripts, printed on A4.
   Each page is one SVG in millimetres (186 x 273 = A4 minus 12 mm margins), so the preview and the print match. */
(function () {
  'use strict';
  var SLUG = 'handwriting-sheets';
  var D = window.HW_DATA, ST = window.HW_STROKES;
  var store = EDU.store(SLUG);
  var PW = 186, PH = 273;                                   // printable area of an A4 page in mm
  var SIZES = { s: 9, m: 12, l: 16, xl: 22 };               // height of one ruled row (top line to bottom line), mm
  var GAPS = { tight: 0.3, normal: 0.55, wide: 0.95 };      // space between copies, as a share of the row height
  var TRACK = { tight: 0.6, normal: 2, wide: 4.5 };         // extra space between school-print letters (grid units)
  var DEF = {
    lang: null, type: 'letters', group: null, base: 0, nMode: 'digits', nFrom: 1, nTo: 20, native: false,
    custom: '', split: 'word', size: 'l', copies: '4', blanks: '1', rpp: 'auto', spacing: 'normal', ruling: 'auto',
    colors: 'rb', trace: 'dots', latin: 'print', start: true, header: true, title: '', name: '', school: '', klass: '',
    date: '', stars: true
  };
  var S = Object.assign({}, DEF, store.get('s', {}));

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  var $ = function (s) { return EDU.$(s); };
  function save() { store.set('s', S); }
  function sheetLang() { return (S.lang && D.langs[S.lang]) ? S.lang : (D.langs[EDU.lang] ? EDU.lang : 'en'); }
  function LS(key, vars) {                                   // a string in the SHEET language (the header is printed in it)
    var tbl = (window.APP_STRINGS || {})[sheetLang()] || {};
    var s = tbl[key] != null ? tbl[key] : EDU.t(key);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function f2(n) { return Math.round(n * 100) / 100; }

  /* ------------------------------------------------------------ letter sets */
  function groupsOf(code) {
    var L = D.langs[code], gs = L.groups.map(function (g) { return { id: g.id, label: 'g_' + g.id, items: g.items }; });
    if (L.signs) gs.push({ id: 'matras', label: L.signs.label === 'aerab' ? 'g_aerab' : 'g_matras' });
    return gs;
  }
  function curGroup() {
    var gs = groupsOf(sheetLang());
    for (var i = 0; i < gs.length; i++) if (gs[i].id === S.group) return gs[i];
    return gs[0];
  }
  function bases() { var sg = D.langs[sheetLang()].signs; return sg ? sg.bases.split(' ') : []; }
  function digitsOf(n) {
    var L = D.langs[sheetLang()];
    var s = String(n);
    if (S.native && L.digits) s = s.replace(/[0-9]/g, function (d) { return L.digits.charAt(+d); });
    return s;
  }
  function numRange() {
    var lo = S.nMode === 'names' ? 1 : 0;
    var a = EDU.clamp(parseInt(S.nFrom, 10) || 0, lo, 100), b = EDU.clamp(parseInt(S.nTo, 10) || 0, lo, 100);
    if (a > b) { var t = a; a = b; b = t; }
    return [a, b];
  }
  function splitWords(t) { return t.split(/\s+/).filter(Boolean); }

  function buildItems() {
    var code = sheetLang(), L = D.langs[code], out = [];
    if (S.type === 'letters') {
      var g = curGroup();
      if (g.id === 'matras') {
        var b = bases(), base = b[EDU.clamp(S.base | 0, 0, b.length - 1)];
        L.signs.marks.split(' ').forEach(function (m) { out.push({ text: m === '-' ? base : base + m }); });
      } else splitWords(g.items).forEach(function (x) { out.push({ text: x }); });
    } else if (S.type === 'numbers') {
      var r = numRange();
      for (var n = r[0]; n <= r[1]; n++) {
        if (S.nMode === 'names') out.push({ text: L.names[n - 1], label: digitsOf(n) });
        else out.push({ text: digitsOf(n) });
      }
    } else if (S.type === 'words') {
      splitWords(L.words).forEach(function (w) { out.push({ text: w }); });
    } else if (S.type === 'sentences') {
      L.sentences.forEach(function (s) { out.push({ text: s }); });
    } else {
      var txt = String(S.custom || '').slice(0, 4000);
      var parts = S.split === 'line' ? txt.split(/\n/).map(function (s) { return s.replace(/\s+/g, ' ').trim(); }).filter(Boolean) : splitWords(txt);
      parts.slice(0, 300).forEach(function (p) { out.push({ text: p.slice(0, 200) }); });
    }
    return out;
  }

  /* ------------------------------------------------------------ fonts and measuring */
  var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
  var mcache = {};
  function measureFont(stack, m) {
    var key = stack + '|' + m.body + m.up + m.down;
    if (mcache[key]) return mcache[key];
    ctx.font = '100px ' + stack;
    function q(s) { var r = ctx.measureText(s); return { a: r.actualBoundingBoxAscent || 0, d: r.actualBoundingBoxDescent || 0 }; }
    var b = q(m.body), u = q(m.up), d = q(m.down);
    var up = Math.max(b.a, u.a) / 100, body = b.a / 100, down = Math.max(d.d, b.d, 0) / 100;
    if (!(up > 0.2 && up < 3) || !(body > 0.1) || !(down >= 0 && down < 2)) { up = 0.95; body = 0.55; down = 0.3; }   // fonts not ready / unknown
    return (mcache[key] = { up: up, body: Math.min(body, up), down: Math.max(down, 0.12) });
  }
  function textWidth(stack, text) { ctx.font = '100px ' + stack; return ctx.measureText(text).width / 100; }

  var SCRIPTS = [['deva', /[ऀ-ॿ]/], ['beng', /[ঀ-৿]/], ['guru', /[਀-੿]/], ['gujr', /[઀-૿]/],
    ['orya', /[଀-୿]/], ['taml', /[஀-௿]/], ['telu', /[ఀ-౿]/], ['knda', /[ಀ-೿]/],
    ['mlym', /[ഀ-ൿ]/], ['arab', /[؀-ۿݐ-ݿ]/], ['latn', /[A-Za-z]/]];
  function langForText(text) {                       // custom text may be in another script than the sheet language
    var code = sheetLang(), sc = D.langs[code].sc;
    for (var i = 0; i < SCRIPTS.length; i++) {
      if (SCRIPTS[i][1].test(text)) {
        if (SCRIPTS[i][0] === sc) return code;
        for (var k in D.langs) if (D.langs[k].sc === SCRIPTS[i][0]) return k;
      }
    }
    return code;
  }
  function strokeOK(text) {
    for (var i = 0; i < text.length; i++) { var c = text.charAt(i); if (c !== ' ' && !ST.glyphs[c]) return false; }
    return true;
  }

  /* A profile knows how to rule a row and draw text in it, for one row height H. */
  var profiles = {};
  function profile(code, stroke, H) {
    var key = code + (stroke ? ':s' : ':f');
    if (profiles[key]) return profiles[key];
    var L = D.langs[code], P = { code: code, L: L, stroke: stroke, dir: L.dir, head: L.head, H: H };
    var pad = 0.03 * H, inner = 0.94 * H;
    if (stroke) {
      var g = inner / 3;
      P.s = g / 10; P.top = pad; P.mid = pad + g; P.base = pad + 2 * g; P.bot = pad + 3 * g;
    } else {
      var m = measureFont(L.stack, L.m);
      P.F = inner / (m.up + m.down);
      P.top = pad; P.base = pad + m.up * P.F; P.mid = P.base - m.body * P.F; P.bot = P.base + m.down * P.F;
    }
    return (profiles[key] = P);
  }
  function itemProfile(text, H) {
    var code = S.type === 'custom' ? langForText(text) : sheetLang();
    var stroke = D.langs[code].sc === 'latn' && S.latin === 'print' && strokeOK(text);
    return profile(code, stroke, H);
  }
  function widthOf(P, text) {
    if (!P.stroke) return textWidth(P.L.stack, text) * P.F;
    var u = 0, tr = TRACK[S.spacing] || 2;
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      if (c === ' ') { u += ST.space; continue; }
      u += ST.glyphs[c][0] + 2 * ST.side + (i ? tr : 0);
    }
    return u * P.s;
  }

  /* start point and direction of each school-print stroke, measured once on a hidden SVG path */
  var hidden = null, startCache = {};
  function strokeStart(d) {
    if (startCache[d]) return startCache[d];
    if (!hidden) {
      hidden = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      hidden.setAttribute('aria-hidden', 'true');
      hidden.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;inset-inline-start:0;top:0';
      document.body.appendChild(hidden);
    }
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d); hidden.appendChild(p);
    var len = 0; try { len = p.getTotalLength(); } catch (e) { len = 0; }
    var r = null;
    if (len > 0) {
      var a = p.getPointAtLength(0), t1 = p.getPointAtLength(Math.min(len, 3.2)), t2 = p.getPointAtLength(Math.min(len, 5.6));
      var dx = t2.x - t1.x, dy = t2.y - t1.y, dl = Math.sqrt(dx * dx + dy * dy) || 1;
      r = { x: a.x, y: a.y, ax: t2.x, ay: t2.y, ux: dx / dl, uy: dy / dl, arrow: len > 7 };
    }
    hidden.removeChild(p);
    return (startCache[d] = r);
  }

  /* ------------------------------------------------------------ colours */
  var SCHEMES = {
    rb: { red: '#e0605b', blue: '#6d9de0', head: '#e0605b' },
    grey: { red: '#b4b4b4', blue: '#b4b4b4', head: '#999999' },
    blue: { red: '#8db3e6', blue: '#8db3e6', head: '#6d9de0' },
    black: { red: '#6a6a6a', blue: '#8a8a8a', head: '#555555' }
  };
  var INK = '#1d1d1d', TRACE = '#7a7a7a', TRACE_FILL = '#e9e9e9', GREY_FILL = '#c6c6c6', DOT1 = '#18a058', DOT2 = '#e08a1e';

  function rulingFor(P) {
    var r = S.ruling;
    if (r === 'auto') return P.head ? 'head' : 'four';
    if (r === 'head' && !P.head) return 'four';
    return r;
  }
  function hline(y, x1, x2, color, w, dash) {
    return '<line x1="' + f2(x1) + '" y1="' + f2(y) + '" x2="' + f2(x2) + '" y2="' + f2(y) + '" stroke="' + color + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
  }
  function guides(P, y0, x1, x2) {
    var c = SCHEMES[S.colors] || SCHEMES.rb, r = rulingFor(P), o = '';
    if (r === 'none') return '';
    if (r === 'plain') return hline(y0 + P.base, x1, x2, c.blue, 0.28);
    if (r === 'head') {
      o += hline(y0 + P.top, x1, x2, c.blue, 0.18, '1.2 0.9');
      o += hline(y0 + P.mid, x1, x2, c.head, 0.36);
      o += hline(y0 + P.base, x1, x2, c.blue, 0.24);
      o += hline(y0 + P.bot, x1, x2, c.blue, 0.18, '1.2 0.9');
      return o;
    }
    o += hline(y0 + P.top, x1, x2, c.red, 0.24);
    o += hline(y0 + P.mid, x1, x2, c.blue, 0.22);
    o += hline(y0 + P.base, x1, x2, c.blue, 0.22);
    o += hline(y0 + P.bot, x1, x2, c.red, 0.24);
    return o;
  }

  /* draw one copy of a text; x = left edge in page mm, y0 = top of the row */
  function drawText(P, text, x, y0, w, kind, hint) {
    var model = kind === 'model', o = '';
    if (!P.stroke) {
      var fam = esc(P.L.stack.replace(/"/g, "'"));
      var paint = model ? 'fill="' + INK + '"'
        : S.trace === 'grey' ? 'fill="' + GREY_FILL + '"'
          : 'fill="' + TRACE_FILL + '" stroke="' + TRACE + '" stroke-width="' + f2(Math.max(0.16, P.F * 0.016)) + '" stroke-dasharray="' + f2(P.F * 0.05) + ' ' + f2(P.F * 0.04) + '" stroke-linejoin="round"';
      return '<text x="' + f2(x + w / 2) + '" y="' + f2(y0 + P.base) + '" font-size="' + f2(P.F) + '" font-family="' + fam + '" text-anchor="middle"' +
        (P.dir === 'rtl' ? ' direction="rtl"' : '') + ' ' + paint + '>' + esc(text) + '</text>';
    }
    var s = P.s, cx = x, tr = TRACK[S.spacing] || 2, hints = '';
    var dotted = !model && S.trace !== 'grey';
    var col = model ? INK : (S.trace === 'grey' ? GREY_FILL : TRACE);
    var sw = model ? 1.75 : (dotted ? 1.5 : 1.9);
    var strokeAttr = 'fill="none" stroke="' + col + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"' + (dotted ? ' stroke-dasharray="0 2.7"' : '');
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === ' ') { cx += ST.space * s; continue; }
      if (i) cx += tr * s;
      var gl = ST.glyphs[ch], gx = cx + ST.side * s;
      o += '<g transform="translate(' + f2(gx) + ',' + f2(y0 + P.top) + ') scale(' + f2(s * 1000) / 1000 + ')">';
      gl[1].forEach(function (d) { o += '<path d="' + d + '" ' + strokeAttr + '/>'; });
      (gl[2] || []).forEach(function (pt) { o += '<circle cx="' + pt[0] + '" cy="' + pt[1] + '" r="' + (model ? 1.3 : 1.15) + '" fill="' + (model ? INK : col) + '"/>'; });
      if (S.start && hint) {
        gl[1].slice().reverse().forEach(function (d, kr) {        // last stroke first, so stroke 1's green dot is on top
          var k = gl[1].length - 1 - kr;
          var st = strokeStart(d); if (!st) return;
          var c = k ? DOT2 : DOT1;
          hints += '<circle cx="' + f2(st.x) + '" cy="' + f2(st.y) + '" r="1.5" fill="' + c + '"/>';
          if (st.arrow) {
            var px = -st.uy, py = st.ux, tx = st.ax + st.ux * 1.7, ty = st.ay + st.uy * 1.7, bx = st.ax - st.ux * 1.1, by = st.ay - st.uy * 1.1;
            hints += '<path d="M' + f2(tx) + ',' + f2(ty) + ' L' + f2(bx + px * 1.35) + ',' + f2(by + py * 1.35) + ' L' + f2(bx - px * 1.35) + ',' + f2(by - py * 1.35) + 'Z" fill="' + c + '"/>';
          }
        });
        o += hints; hints = '';
      }
      o += '</g>';
      cx += (gl[0] + 2 * ST.side) * s;
    }
    return o;
  }

  /* ------------------------------------------------------------ layout */
  function graphemes(t) {
    if (window.Intl && Intl.Segmenter) { try { return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(t), function (x) { return x.segment; }); } catch (e) { /* fall through */ } }
    return Array.from(t);
  }
  function chunks(P, text, maxW) {                     // break a long sentence into pieces that fit one line
    if (widthOf(P, text) <= maxW) return [text];
    var words = text.split(' '), out = [], cur = '';
    words.forEach(function (w) {
      var tryS = cur ? cur + ' ' + w : w;
      if (widthOf(P, tryS) <= maxW) { cur = tryS; return; }
      if (cur) out.push(cur);
      if (widthOf(P, w) <= maxW) { cur = w; return; }
      var piece = '';                                    // one very long word: break between letters
      graphemes(w).forEach(function (gch) {
        if (piece && widthOf(P, piece + gch) > maxW) { out.push(piece); piece = gch; } else piece += gch;
      });
      cur = piece;
    });
    if (cur) out.push(cur);
    return out;
  }

  function layout() {
    var H = SIZES[S.size] || 16;
    profiles = {};
    var items = buildItems();
    var hasLabel = items.some(function (it) { return it.label; });
    var labelSize = Math.min(0.42 * H, 7);
    var gutter = 0;
    if (hasLabel) {
      var mw = 0; items.forEach(function (it) { if (it.label) mw = Math.max(mw, textWidth('"Noto Sans", sans-serif', it.label)); });
      gutter = mw * labelSize + 3.5;
    }
    var A = PW - gutter, gap = (GAPS[S.spacing] || 0.55) * H;
    var copies = S.copies === 'fill' ? Infinity : EDU.clamp(parseInt(S.copies, 10) || 0, 0, 20);
    var blanks = EDU.clamp(parseInt(S.blanks, 10) || 0, 0, 5);
    var blankP = profile(sheetLang(), D.langs[sheetLang()].sc === 'latn' && S.latin === 'print', H);
    var blocks = [];
    items.forEach(function (it, idx) {
      var P = itemProfile(it.text, H);
      var parts = chunks(P, it.text, A);
      var lines = [], line = { P: P, cells: [], label: it.label, item: idx }, x = 0;
      function newLine() { lines.push(line); line = { P: P, cells: [], item: idx }; x = 0; }
      function place(t, kind, forceNew) {
        var w = widthOf(P, t);
        if (line.cells.length && (forceNew || x + w > A + 0.01)) newLine();
        line.cells.push({ t: t, kind: kind, x: x, w: w });
        x += w + gap;
      }
      parts.forEach(function (p) { place(p, 'model', false); });
      if (copies === Infinity) {
        if (parts.length === 1) { var w1 = widthOf(P, parts[0]), guard = 0; while (x + w1 <= A + 0.01 && guard++ < 60) place(parts[0], 'trace', false); }
        else parts.forEach(function (p) { place(p, 'trace', false); });
      } else {
        for (var c = 0; c < copies; c++) parts.forEach(function (p, k) { place(p, 'trace', parts.length > 1 && k === 0); });
      }
      lines.push(line);
      var all = []; lines.forEach(function (l) { all = all.concat(l.cells); });
      var hintCells = all.filter(function (c) { return c.kind === 'trace'; });
      if (!hintCells.length) hintCells = all;
      var n0 = Math.max(1, parts.length);
      hintCells.slice(0, n0).forEach(function (c) { c.hint = true; });
      for (var b = 0; b < blanks; b++) lines.push({ P: P, cells: [], item: idx, blank: true });
      blocks.push(lines);
    });
    return { H: H, gutter: gutter, labelSize: labelSize, blocks: blocks, blankP: blankP, count: items.length };
  }

  function paginate(Lo) {
    var headH = S.header ? 33 : 0, footH = 6;
    var avail = PH - headH - footH;
    var minPitch = Lo.H + Math.max(4, 0.42 * Lo.H);
    var maxRows = Math.max(1, Math.floor(avail / minPitch));
    var want = S.rpp === 'auto' ? maxRows : EDU.clamp(parseInt(S.rpp, 10) || maxRows, 1, 40);
    var rpp = Math.min(want, maxRows);
    var pages = [], cur = [];
    Lo.blocks.forEach(function (lines) {
      if (cur.length && cur.length + lines.length > rpp && lines.length <= rpp) { pages.push(cur); cur = []; }
      lines.forEach(function (ln) { if (cur.length >= rpp) { pages.push(cur); cur = []; } cur.push(ln); });
    });
    if (cur.length || !pages.length) pages.push(cur);
    var last = pages[pages.length - 1];                      // fill the last page with empty ruled lines to write on
    while (last.length < rpp) last.push({ P: Lo.blankP, cells: [], blank: true, filler: true });
    var rows = 0; Lo.blocks.forEach(function (b) { rows += b.length; });
    return { pages: pages, rpp: rpp, want: want, maxRows: maxRows, headH: headH, avail: avail, pitch: avail / rpp, rows: rows };
  }

  /* ------------------------------------------------------------ header */
  function headerSVG(total) {
    var code = sheetLang(), L = D.langs[code], rtl = L.dir === 'rtl';
    var fam = esc(L.stack.replace(/"/g, "'") + ", 'Noto Sans', sans-serif");
    var X = function (x) { return rtl ? PW - x : x; };
    var anchor = function (a) { return a; };          // with direction="rtl", "start" is already the right edge
    var dirA = rtl ? ' direction="rtl"' : '';
    var o = '', boxW = S.stars ? 31 : 0, textEnd = PW - (boxW ? boxW + 4 : 0);
    function txt(x, y, size, s, a, extra) {
      return '<text x="' + f2(X(x)) + '" y="' + f2(y) + '" font-size="' + size + '" font-family="' + fam + '" text-anchor="' + anchor(a) + '"' + dirA + ' ' + (extra || 'fill="#222"') + '>' + esc(s) + '</text>';
    }
    function fitSize(s, size, maxW) { var w = textWidth(L.stack + ', "Noto Sans", sans-serif', s) * size; return w > maxW ? f2(size * maxW / w) : size; }
    var title = String(S.title || '').trim() || autoTitle();
    o += txt(textEnd / 2, 8.6, fitSize(title, 6.2, textEnd - 4), title, 'middle', 'fill="#111" font-weight="700"');
    var school = String(S.school || '').trim();
    if (school) o += txt(textEnd / 2, 14.6, fitSize(school, 3.9, textEnd - 4), school, 'middle', 'fill="#444"');
    /* Name ____ Class ____ Date ____ */
    var fields = [[LS('h_name'), S.name, 2.3], [LS('h_class'), S.klass, 1], [LS('h_date'), fmtDate(S.date), 1.35]];
    var tw = 0; fields.forEach(function (f) { tw += f[2]; });
    var fx = 0, y = 24.4, lsz = 3.8;
    fields.forEach(function (f) {
      var segW = (textEnd - 6) * f[2] / tw + (f === fields[fields.length - 1] ? 6 : 0), lab = f[0] + ':';
      var lw = textWidth(L.stack + ', "Noto Sans", sans-serif', lab) * lsz;
      o += txt(fx, y, lsz, lab, 'start', 'fill="#222" font-weight="600"');
      var l1 = fx + lw + 1.2, l2 = fx + segW - 3;
      if (l2 > l1 + 4) {
        o += '<line x1="' + f2(X(l1)) + '" y1="' + (y + 0.9) + '" x2="' + f2(X(l2)) + '" y2="' + (y + 0.9) + '" stroke="#555" stroke-width="0.25"/>';
        var v = String(f[1] || '').trim();
        if (v) o += txt(l1 + 1, y - 0.2, fitSize(v, 4.4, l2 - l1 - 2), v, 'start', 'fill="#1d3f8f"');
      }
      fx += segW;
    });
    if (boxW) {
      var bx = rtl ? 0 : PW - boxW;
      o += '<rect x="' + bx + '" y="0.6" width="' + boxW + '" height="26.4" rx="2.4" fill="none" stroke="#9a9a9a" stroke-width="0.3"/>';
      o += '<text x="' + f2(bx + boxW / 2) + '" y="5.6" font-size="3.1" font-family="' + fam + '" text-anchor="middle" fill="#555"' + dirA + '>' + esc(LS('h_teacher')) + '</text>';
      var sx = bx + 8.5, sy = 16.8, pts = [];
      for (var k = 0; k < 10; k++) { var ang = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 2.7 : 6.4; pts.push(f2(sx + r * Math.cos(ang)) + ',' + f2(sy + r * Math.sin(ang))); }
      o += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="#c9a227" stroke-width="0.45" stroke-linejoin="round"/>';
      var mx = bx + boxW - 8.5;
      o += '<circle cx="' + f2(mx) + '" cy="' + sy + '" r="6" fill="none" stroke="#c9a227" stroke-width="0.45"/>' +
        '<circle cx="' + f2(mx - 2.1) + '" cy="' + (sy - 1.6) + '" r="0.65" fill="#c9a227"/><circle cx="' + f2(mx + 2.1) + '" cy="' + (sy - 1.6) + '" r="0.65" fill="#c9a227"/>' +
        '<path d="M' + f2(mx - 3.2) + ',' + (sy + 1.2) + ' Q' + f2(mx) + ',' + (sy + 4.6) + ' ' + f2(mx + 3.2) + ',' + (sy + 1.2) + '" fill="none" stroke="#c9a227" stroke-width="0.45" stroke-linecap="round"/>';
    }
    o += '<line x1="0" y1="29.6" x2="' + PW + '" y2="29.6" stroke="#bdbdbd" stroke-width="0.3"/>';
    return o;
  }
  function fmtDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ''));
    return m ? m[3] + '-' + m[2] + '-' + m[1] : String(v || '');
  }
  function autoTitle() {
    if (S.type === 'letters') {
      var g = curGroup(), set = LS(g.label);
      if (g.id === 'matras') set += ': ' + (bases()[EDU.clamp(S.base | 0, 0, bases().length - 1)] || '');
      return LS('tt_letters', { set: set });
    }
    if (S.type === 'numbers') { var r = numRange(); return LS(S.nMode === 'names' ? 'tt_names' : 'tt_numbers', { a: digitsOf(r[0]), b: digitsOf(r[1]) }); }
    return LS('tt_' + S.type);
  }

  /* ------------------------------------------------------------ render */
  var lastInfo = null;
  function render() {
    var Lo = layout(), Pg = paginate(Lo);
    var total = Pg.pages.length, html = '';
    var head = S.header ? headerSVG(total) : '';
    var rtlSheet = D.langs[sheetLang()].dir === 'rtl';
    Pg.pages.forEach(function (lines, pi) {
      var o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + PW + ' ' + PH + '" role="img" aria-label="' + esc(EDU.t('page_aria', { n: pi + 1, total: total })) + '">';
      o += '<rect x="0" y="0" width="' + PW + '" height="' + PH + '" fill="#fff"/>';
      o += head;
      var openItem = -1;
      lines.forEach(function (ln, li) {
        var y0 = Pg.headH + li * Pg.pitch + (Pg.pitch - Lo.H) / 2;
        var P = ln.P, rtl = P.dir === 'rtl';
        if (ln.item !== openItem) { if (openItem >= 0) o += '</g>'; openItem = ln.item != null && !ln.filler ? ln.item : -1; if (openItem >= 0) o += '<g class="hw-item" data-i="' + openItem + '">'; }
        o += guides(P, y0, 0, PW);
        if (ln.label) {
          var lx = rtl ? PW - Lo.gutter + 1 : Lo.gutter - 2.2;
          o += '<text x="' + f2(lx) + '" y="' + f2(y0 + P.base) + '" font-size="' + f2(Lo.labelSize) + '" font-family="\'Noto Sans\', sans-serif" font-weight="700" fill="#1d3f8f" text-anchor="' + (rtl ? 'start' : 'end') + '">' + esc(ln.label) + '</text>';
        }
        ln.cells.forEach(function (c) {
          var x = rtl ? PW - Lo.gutter - c.x - c.w : Lo.gutter + c.x;
          o += '<g class="hw-' + c.kind + '">' + drawText(P, c.t, x, y0, c.w, c.kind, c.hint) + '</g>';
        });
      });
      if (openItem >= 0) o += '</g>';
      if (total > 1) o += '<text x="' + PW / 2 + '" y="' + (PH - 1.2) + '" font-size="3" font-family="\'Noto Sans\', sans-serif" text-anchor="middle" fill="#888">' + (pi + 1) + ' / ' + total + '</text>';
      o += '</svg>';
      html += '<div class="hw-page' + (rtlSheet ? ' rtl' : '') + '">' + o + '</div>';
    });
    var box = $('#pages');
    box.innerHTML = html;
    box.dataset.pages = String(total);
    box.dataset.rpp = String(Pg.rpp);
    lastInfo = { total: total, rows: Pg.rows, rpp: Pg.rpp, want: Pg.want, maxRows: Pg.maxRows, count: Lo.count };
    status();
  }
  function status() {
    if (!lastInfo) return;
    var i = lastInfo, msg = EDU.t(i.total === 1 ? 'status_one' : 'status_many', { n: EDU.fmt(i.total), rows: EDU.fmt(i.rpp) });
    $('#status').textContent = msg;
    var notes = [];
    if (S.rpp !== 'auto' && i.want > i.maxRows) notes.push(EDU.t('fit_note', { n: EDU.fmt(i.maxRows) }));
    if (S.type === 'custom' && !i.count) notes.push(EDU.t('empty_note'));
    var nb = $('#fit-note'); nb.textContent = notes.join(' '); nb.hidden = !notes.length;
  }
  var timer = 0;
  function schedule() { clearTimeout(timer); timer = setTimeout(render, 70); }

  /* ------------------------------------------------------------ controls */
  function fillLangSelect() {
    var sel = $('#sheet-lang'), cur = sheetLang();
    sel.innerHTML = '';
    D.order.forEach(function (code) {
      var info = EDU.langInfo(code) || { native: code };
      var o = document.createElement('option'); o.value = code; o.textContent = info.native || info.name || code;
      sel.appendChild(o);
    });
    sel.value = cur;
  }
  function fillGroups() {
    var box = $('#groups'), cur = curGroup();
    box.innerHTML = '';
    groupsOf(sheetLang()).forEach(function (g) {
      var b = EDU.el('button', { type: 'button', 'data-group': g.id, text: EDU.t(g.label) });
      b.setAttribute('aria-pressed', String(g.id === cur.id));
      b.addEventListener('click', function () { S.group = g.id; save(); sync(); schedule(); });
      box.appendChild(b);
    });
    var bsel = $('#base'), bs = bases();
    bsel.innerHTML = '';
    bs.forEach(function (ch, i) { var o = document.createElement('option'); o.value = String(i); o.textContent = ch; bsel.appendChild(o); });
    bsel.value = String(EDU.clamp(S.base | 0, 0, Math.max(0, bs.length - 1)));
    var fam = D.langs[sheetLang()].stack;
    bsel.style.fontFamily = fam;
  }
  function sync() {
    var code = sheetLang(), L = D.langs[code];
    $('#sheet-lang').value = code;
    fillGroups();
    EDU.$$('.seg[data-opt]').forEach(function (seg) {
      var k = seg.getAttribute('data-opt');
      EDU.$$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', String(String(S[k]) === b.getAttribute('data-v'))); });
    });
    $('#grp-letters').hidden = S.type !== 'letters';
    $('#grp-base').hidden = curGroup().id !== 'matras';
    $('#grp-numbers').hidden = S.type !== 'numbers';
    $('#grp-custom').hidden = S.type !== 'custom';
    $('#grp-native').hidden = !L.digits;
    $('#names-note').hidden = !(S.type === 'numbers' && S.nMode === 'names');
    var latinUsed = L.sc === 'latn' || (S.type === 'custom' && /[A-Za-z]/.test(S.custom || ''));
    $('#grp-latin').hidden = !latinUsed;
    $('#grp-start').hidden = !latinUsed || S.latin !== 'print';
    $('#rule-head').hidden = !L.head;
    $('#n-from').min = $('#n-to').min = S.nMode === 'names' ? '1' : '0';
    $('#n-from').value = S.nFrom; $('#n-to').value = S.nTo;
    $('#opt-native').checked = !!S.native;
    $('#custom').value = S.custom;
    $('#custom').dir = 'auto';
    ['copies', 'blanks', 'rpp'].forEach(function (k) { $('#' + k).value = String(S[k]); });
    $('#opt-start').checked = !!S.start;
    $('#opt-header').checked = !!S.header;
    $('#opt-stars').checked = !!S.stars;
    $('#head-fields').hidden = !S.header;
    $('#f-title').value = S.title; $('#f-name').value = S.name; $('#f-school').value = S.school; $('#f-class').value = S.klass; $('#f-date').value = S.date;
  }

  EDU.$$('.seg[data-opt]').forEach(function (seg) {
    var k = seg.getAttribute('data-opt');
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]'); if (!b) return;
      S[k] = b.getAttribute('data-v');
      save(); sync(); schedule();
    });
  });
  $('#sheet-lang').addEventListener('change', function (e) {
    S.lang = e.target.value; S.group = null; S.base = 0; profiles = {};
    save(); sync(); schedule();
  });
  $('#base').addEventListener('change', function (e) { S.base = parseInt(e.target.value, 10) || 0; save(); schedule(); });
  [['#n-from', 'nFrom'], ['#n-to', 'nTo']].forEach(function (p) {
    $(p[0]).addEventListener('input', function (e) { S[p[1]] = e.target.value === '' ? '' : EDU.clamp(parseInt(e.target.value, 10) || 0, 0, 100); save(); schedule(); });
    $(p[0]).addEventListener('change', function () { var r = numRange(); S.nFrom = r[0]; S.nTo = r[1]; save(); sync(); schedule(); });
  });
  $('#opt-native').addEventListener('change', function (e) { S.native = e.target.checked; save(); schedule(); });
  $('#custom').addEventListener('input', function (e) {
    S.custom = e.target.value; save();
    var latinUsed = D.langs[sheetLang()].sc === 'latn' || /[A-Za-z]/.test(S.custom);
    $('#grp-latin').hidden = !latinUsed; $('#grp-start').hidden = !latinUsed || S.latin !== 'print';
    schedule();
  });
  ['copies', 'blanks', 'rpp'].forEach(function (k) { $('#' + k).addEventListener('change', function (e) { S[k] = e.target.value; save(); schedule(); }); });
  $('#opt-start').addEventListener('change', function (e) { S.start = e.target.checked; save(); schedule(); });
  $('#opt-header').addEventListener('change', function (e) { S.header = e.target.checked; $('#head-fields').hidden = !S.header; save(); schedule(); });
  $('#opt-stars').addEventListener('change', function (e) { S.stars = e.target.checked; save(); schedule(); });
  [['#f-title', 'title'], ['#f-name', 'name'], ['#f-school', 'school'], ['#f-class', 'klass'], ['#f-date', 'date']].forEach(function (p) {
    $(p[0]).addEventListener('input', function (e) { S[p[1]] = e.target.value.slice(0, 120); save(); schedule(); });
  });
  $('#btn-print').addEventListener('click', function () { render(); window.print(); });
  $('#btn-reset').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    S = Object.assign({}, DEF); save(); sync(); render();
  });

  /* re-measure when a web font arrives (the sheet font may differ from the page font) */
  if (document.fonts) {
    try { document.fonts.addEventListener('loadingdone', function () { mcache = {}; schedule(); }); } catch (e) { /* old browser */ }
    if (document.fonts.ready) document.fonts.ready.then(function () { mcache = {}; schedule(); });
  }

  EDU.onLang(function () {
    if (!S.lang) profiles = {};
    fillLangSelect(); sync(); render();
  });
  fillLangSelect(); sync(); render();
})();
