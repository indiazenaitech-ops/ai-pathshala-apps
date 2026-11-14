/* Text to Handwriting: typed text drawn as handwriting on a notebook page (A4, 1240 x 1754 px).
   Font: Kalam (Latin + Devanagari), bundled as base64 in fonts/kalam.js, so nothing is fetched: works offline and from file://.
   Other scripts use the device font with the same seeded wobble. Everything stays on the device. */
(function () {
  'use strict';
  var SLUG = 'text-to-handwriting';
  var W = 1240, H = 1754, MAX_PAGES = 30, MAX_CHARS = 20000;
  var FAMILY = 'TTH Kalam';
  var FALLBACK = '"Nirmala UI", "Noto Sans", "Noto Sans Devanagari", "Noto Sans Bengali", "Noto Sans Gujarati", "Noto Sans Gurmukhi", "Noto Sans Oriya", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Segoe UI", system-ui, sans-serif';
  var PAPER = '#fdfcf6', RULE = 'rgba(64, 118, 190, .40)', MARGIN = 'rgba(222, 66, 78, .60)';
  var INKS = { blue: '#1d3fc4', black: '#1b1b1f', darkblue: '#0f1f66' };
  var PAPERS = ['ruled', 'margin', 'plain'];
  var RTL_RE = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
  var LETTER_RE = /[A-Za-zÀ-ɏऀ-෿]/;
  /* scripts that have no bundled handwriting font */
  var NOFONT_RE = /[ঀ-෿֐-ࣿיִ-﷿ﹰ-﻿]/;
  /* words made only of these are drawn letter by letter (safe: no joining letters) */
  var SIMPLE_RE = /^[ -ɏ‐-‧‰-›€₹]+$/;

  var $ = EDU.$, $$ = EDU.$$, t = EDU.t;
  var store = EDU.store(SLUG);

  /* ---------------- state ---------------- */
  function defaults() { return { text: null, heading: null, date: null, paper: 'margin', ink: 'blue', size: 42, spacing: 16, vary: 1, seed: 20261 }; }
  function load() {
    var d = defaults(), v = store.get('s', null);
    if (!v || typeof v !== 'object') return d;
    if (typeof v.text === 'string') d.text = v.text.slice(0, MAX_CHARS);
    if (typeof v.heading === 'string') d.heading = v.heading.slice(0, 60);
    if (typeof v.date === 'string') d.date = v.date.slice(0, 24);
    if (PAPERS.indexOf(v.paper) >= 0) d.paper = v.paper;
    if (INKS[v.ink]) d.ink = v.ink;
    if (typeof v.size === 'number' && isFinite(v.size)) d.size = EDU.clamp(Math.round(v.size), 26, 72);
    if (typeof v.spacing === 'number' && isFinite(v.spacing)) d.spacing = EDU.clamp(Math.round(v.spacing), 12, 26);
    if (v.vary === 0 || v.vary === 1 || v.vary === 2) d.vary = v.vary;
    if (typeof v.seed === 'number' && isFinite(v.seed)) d.seed = Math.abs(Math.floor(v.seed)) % 1000000;
    return d;
  }
  var s = load();
  var pageIdx = 0, L = null, fontState = 'loading';     /* loading | kalam | system */

  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  function pad(x) { return (x < 10 ? '0' : '') + x; }
  function today() { var d = new Date(); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function textVal() { return s.text === null ? t('sample_text') : s.text; }
  function headVal() { return s.heading === null ? t('sample_heading') : s.heading; }
  function dateVal() { return s.date === null ? today() : s.date; }
  function save() { store.set('s', s); }

  /* ---------------- seeded random ---------------- */
  function rng(a) {
    a = (a ^ 0x9E3779B9) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rngFor(kind, i) { return rng((s.seed * 7919 + kind * 104729 + Math.imul(i + 1, 2654435761)) >>> 0); }
  function sym(r) { return r() * 2 - 1; }               /* -1 .. 1 */

  /* ---------------- measuring ---------------- */
  var mcv = document.createElement('canvas'); mcv.width = 8; mcv.height = 8;
  var mctx = mcv.getContext('2d');
  var cache = {}, cacheN = 0, cacheFont = '';
  function fontStr(px) { return px + 'px "' + FAMILY + '", ' + FALLBACK; }
  function measure(str, font) {
    if (font !== cacheFont || cacheN > 6000) { cache = {}; cacheN = 0; cacheFont = font; }
    var w = cache[str];
    if (w === undefined) { mctx.font = font; w = mctx.measureText(str).width; cache[str] = w; cacheN++; }
    return w;
  }
  function graphemes(str) {
    try {
      if (window.Intl && Intl.Segmenter) {
        var out = [], it = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(str)[Symbol.iterator](), n;
        while (!(n = it.next()).done) out.push(n.value.segment);
        return out;
      }
    } catch (e) { }
    return Array.from ? Array.from(str) : str.split('');
  }
  function dirOf(str) { return RTL_RE.test(str) ? 'rtl' : (LETTER_RE.test(str) ? 'ltr' : 'n'); }
  function baseDir(str) {
    for (var i = 0; i < str.length; i++) {
      var c = str.charAt(i);
      if (RTL_RE.test(c)) return true;
      if (LETTER_RE.test(c)) return false;
    }
    return false;
  }

  /* ---------------- layout ---------------- */
  function geom() {
    var lineH = Math.round(s.size * s.spacing / 10);
    var left = s.paper === 'margin' ? 176 : 92, right = 78;
    var top = 118 + lineH, bottom = 96;
    return { lineH: lineH, left: left, right: right, top: top, maxW: W - left - right, perPage: Math.max(1, Math.floor((H - bottom - top) / lineH) + 1) };
  }
  function makeWord(str, i, font, rtlPara) {
    var k = s.vary, r = rngFor(1, i), size = s.size;
    var wd = { s: str, dir: dirOf(str), dy: 0, rot: 0, a: 1, w: 0, chars: null };
    /* numbers and punctuation inside a right-to-left line: let the browser place them ("1." etc.) */
    wd.rtlDraw = wd.dir === 'rtl' || (!!rtlPara && wd.dir === 'n');
    if (k) {
      wd.dy = sym(r) * size * 0.028 * k;
      wd.rot = sym(r) * 0.011 * k;
      wd.a = 1 - r() * 0.07 * k;
    }
    if (SIMPLE_RE.test(str) && !wd.rtlDraw) {
      var g = Array.from ? Array.from(str) : str.split(''), x = 0;
      wd.chars = g.map(function (c) {
        var cw = measure(c, font);
        var o = { c: c, x: x, dy: k ? sym(r) * size * 0.014 * k : 0, rot: k ? sym(r) * 0.022 * k : 0 };
        x += cw + (k ? sym(r) * size * 0.022 * k : 0);
        return o;
      });
      wd.w = Math.max(0, x);
    } else {
      wd.w = measure(str, font);
    }
    return wd;
  }
  function splitLong(str, maxW, font) {
    var out = [], cur = '', w = 0, lim = maxW * 0.94;
    graphemes(str).forEach(function (g) {
      var gw = measure(g, font) + s.size * 0.05;
      if (cur && w + gw > lim) { out.push(cur); cur = ''; w = 0; }
      cur += g; w += gw;
    });
    if (cur) out.push(cur);
    return out;
  }
  function layout() {
    var G = geom(), font = fontStr(s.size), spW = measure(' ', font) || s.size * 0.3;
    var lines = [], wi = 0, si = 0, maxLines = G.perPage * MAX_PAGES, cut = false;
    var paras = textVal().replace(/\r\n?/g, '\n').replace(/\t/g, '    ').replace(/\s+$/, '').split('\n');
    for (var p = 0; p < paras.length && !cut; p++) {
      var para = paras[p];
      if (!para.trim()) { lines.push({ toks: [], w: 0, rtl: false }); if (lines.length >= maxLines) cut = p < paras.length - 1; continue; }
      var rtl = baseDir(para), cur = { toks: [], w: 0, rtl: rtl, words: 0 };
      var parts = para.match(/\s+|\S+/g) || [];
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (/^\s/.test(part)) {
          if (cur.words || i === 0) {
            var r = rngFor(2, si++);
            var sw = spW * Math.min(part.length, 12) * (1 + (s.vary ? sym(r) * 0.16 * s.vary : 0));
            cur.toks.push({ sp: true, w: sw, dir: 'n' }); cur.w += sw;
          }
          continue;
        }
        var first = makeWord(part, wi++, font, rtl);
        var pieces = first.w > G.maxW ? splitLong(part, G.maxW, font).map(function (x) { return makeWord(x, wi++, font, rtl); }) : [first];
        for (var j = 0; j < pieces.length; j++) {
          var wd = pieces[j];
          if (cur.words && cur.w + wd.w > G.maxW) {
            lines.push(cur);
            if (lines.length >= maxLines) { cut = true; break; }
            cur = { toks: [], w: 0, rtl: rtl, words: 0 };
          }
          cur.toks.push(wd); cur.w += wd.w; cur.words++;
        }
        if (cut) break;
      }
      if (!cut) { lines.push(cur); if (lines.length >= maxLines && p < paras.length - 1) cut = true; }
    }
    while (lines.length > 1 && !lines[lines.length - 1].toks.length) lines.pop();
    if (lines.length === 1 && !lines[0].toks.length) lines = [];
    var pages = Math.max(1, Math.ceil(lines.length / G.perPage));
    return { G: G, font: font, lines: lines, pages: pages, cut: cut, empty: !lines.length };
  }

  /* visual order of a line: runs of the "other" direction are flipped (simple bidi) */
  function visual(line) {
    var toks = line.toks.slice(), other = line.rtl ? 'ltr' : 'rtl', i = 0;
    while (i < toks.length) {
      if (toks[i].dir !== other) { i++; continue; }
      var j = i, last = i;
      while (j < toks.length && (toks[j].dir === other || toks[j].dir === 'n')) { if (toks[j].dir === other) last = j; j++; }
      if (last > i) { var seg = toks.slice(i, last + 1).reverse(); for (var k = 0; k < seg.length; k++) toks[i + k] = seg[k]; }
      i = last + 1;
    }
    return toks;
  }

  /* ---------------- drawing ---------------- */
  function drawPaper(c, G) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    if (s.paper === 'plain') return;
    c.lineWidth = 2; c.strokeStyle = RULE; c.beginPath();
    var off = Math.round(s.size * 0.16);
    for (var y = G.top - G.lineH + off; y < H - 40; y += G.lineH) { c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); }
    c.stroke();
    if (s.paper === 'margin') {
      c.strokeStyle = MARGIN; c.lineWidth = 2.5; c.beginPath();
      c.moveTo(150.5, 0); c.lineTo(150.5, H); c.moveTo(158.5, 0); c.lineTo(158.5, H); c.stroke();
    }
  }
  function drawWord(c, wd, x, y) {
    c.save();
    c.globalAlpha = wd.a;
    c.translate(x, y + wd.dy);
    if (wd.rot) c.rotate(wd.rot);
    if (wd.chars) {
      c.direction = 'ltr';
      for (var i = 0; i < wd.chars.length; i++) {
        var ch = wd.chars[i];
        if (ch.c === ' ') continue;
        if (ch.rot) { c.save(); c.translate(ch.x, ch.dy); c.rotate(ch.rot); c.fillText(ch.c, 0, 0); c.restore(); }
        else c.fillText(ch.c, ch.x, ch.dy);
      }
    } else {
      c.direction = wd.rtlDraw ? 'rtl' : 'ltr';
      c.fillText(wd.s, 0, 0);
    }
    c.restore();
  }
  function drawHeader(c, G) {
    var head = headVal().trim(), date = dateVal().trim();
    if (!head && !date) return;
    var y = G.top - G.lineH, x0 = G.left, x1 = W - G.right, k = s.vary;
    var r = rngFor(3, 0);
    var hr = baseDir(head);
    c.fillStyle = INKS[s.ink]; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    var dw = 0;
    if (date) {
      var ds = Math.max(24, Math.round(s.size * 0.82));
      c.font = fontStr(ds); dw = Math.min(c.measureText(date).width, (x1 - x0) * 0.45);
      c.save(); c.globalAlpha = 0.95;
      c.translate(hr ? x0 : x1 - dw, y + (k ? sym(r) * 3 * k : 0)); if (k) c.rotate(sym(r) * 0.008 * k);
      c.direction = baseDir(date) ? 'rtl' : 'ltr';
      c.fillText(date, 0, 0, dw); c.restore();
    }
    if (head) {
      var hs = Math.min(84, Math.round(s.size * 1.18));
      c.font = fontStr(hs);
      var room = (x1 - x0) - (dw ? dw + 40 : 0), hw = c.measureText(head).width;
      if (hw > room) { hs = Math.max(18, Math.floor(hs * room / hw)); c.font = fontStr(hs); hw = Math.min(room, c.measureText(head).width); }
      /* centred on the page when it fits beside the date, else pushed to the free side */
      var hx = (W - hw) / 2;
      if (dw) { if (hr) hx = Math.max(hx, x0 + dw + 40); else hx = Math.min(hx, x1 - dw - 40 - hw); }
      hx = Math.max(x0, hx);
      c.save();
      c.translate(hx, y + (k ? sym(r) * 3 * k : 0)); if (k) c.rotate(sym(r) * 0.006 * k);
      c.direction = hr ? 'rtl' : 'ltr';
      c.fillText(head, 0, 0, room);
      /* a hand-drawn underline */
      c.strokeStyle = INKS[s.ink]; c.lineWidth = Math.max(2, hs * 0.045); c.lineCap = 'round'; c.globalAlpha = 0.9;
      var uy = Math.round(hs * 0.2);
      c.beginPath(); c.moveTo(-4, uy + (k ? sym(r) * 2 : 0));
      c.quadraticCurveTo(hw / 2, uy + (k ? sym(r) * 4 * k : 0), hw + 6, uy + (k ? sym(r) * 2 : 0));
      c.stroke();
      c.restore();
    }
  }
  function drawPage(c, idx, preview) {
    var G = L.G;
    drawPaper(c, G);
    if (idx === 0) drawHeader(c, G);
    c.font = L.font; c.fillStyle = INKS[s.ink]; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    var from = idx * G.perPage, to = Math.min(L.lines.length, from + G.perPage), rtlN = 0, words = 0;
    for (var li = from; li < to; li++) {
      var line = L.lines[li];
      if (!line.toks.length) continue;
      var r = rngFor(4, li), k = s.vary;
      var y = G.top + (li - from) * G.lineH;
      var indent = k ? r() * 7 * k : 0, slope = k ? sym(r) * 0.0035 * k : 0;
      var toks = visual(line), x, i, tk;
      if (line.rtl) {
        rtlN++;
        x = W - G.right - indent;
        for (i = 0; i < toks.length; i++) {
          tk = toks[i]; x -= tk.w;
          if (!tk.sp) { drawWord(c, tk, x, y + (W - G.right - x) * slope); words++; }
        }
      } else {
        x = G.left + indent;
        for (i = 0; i < toks.length; i++) {
          tk = toks[i];
          if (!tk.sp) { drawWord(c, tk, x, y + (x - G.left) * slope); words++; }
          x += tk.w;
        }
      }
    }
    c.globalAlpha = 1;
    if (preview && L.empty) {
      c.save();
      c.font = '600 34px ' + FALLBACK; c.fillStyle = 'rgba(60, 70, 90, .55)'; c.textAlign = 'center';
      c.direction = EDU.langInfo(EDU.lang).dir === 'rtl' ? 'rtl' : 'ltr';
      c.fillText(t('empty_hint'), W / 2, G.top + G.lineH * 3, W - 200);
      c.restore();
    }
    return { rtl: rtlN, words: words, lines: to - from };
  }

  /* ---------------- render ---------------- */
  var cv = $('#page'), cx = cv.getContext('2d');
  function setSeg(id, val) { $$('#' + id + ' button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === String(val))); }); }
  function render() {
    L = layout();
    pageIdx = EDU.clamp(pageIdx, 0, L.pages - 1);
    var info = drawPage(cx, pageIdx, true);
    cv.setAttribute('data-pages', L.pages);
    cv.setAttribute('data-page', pageIdx + 1);
    cv.setAttribute('data-lines', L.lines.length);
    cv.setAttribute('data-page-lines', info.lines);
    cv.setAttribute('data-words', info.words);
    cv.setAttribute('data-rtl', info.rtl);
    cv.setAttribute('data-font', fontState);
    cv.setAttribute('data-seed', s.seed);
    $('#page-label').textContent = t('page_of', { n: EDU.fmt(pageIdx + 1), total: EDU.fmt(L.pages) });
    $('#prev').disabled = pageIdx <= 0;
    $('#next').disabled = pageIdx >= L.pages - 1;
    $('#dl-all-label').textContent = t('btn_all', { n: EDU.fmt(L.pages) });
    $('#dl-all').hidden = L.pages < 2;
    var lw = $('#long-warn');
    lw.hidden = !L.cut; lw.textContent = L.cut ? t('too_long', { n: EDU.fmt(MAX_PAGES) }) : '';
    var fn = $('#font-note'), other = NOFONT_RE.test(textVal() + ' ' + headVal());
    fn.textContent = fontState === 'system' ? t('note_font_fail') : (other ? t('note_font_now') : t('note_font'));
    fn.className = 'callout small' + (other || fontState === 'system' ? ' warning' : '');
    $('#size-out').textContent = EDU.fmt(s.size);
    $('#spacing-out').textContent = EDU.fmt(s.spacing / 10, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  function syncInputs() {
    $('#txt').value = textVal();
    $('#heading').value = headVal();
    $('#date').value = dateVal();
    $('#size').value = s.size;
    $('#spacing').value = s.spacing;
    setSeg('paper', s.paper); setSeg('ink', s.ink); setSeg('vary', s.vary);
  }
  var timer = 0;
  function soon() { clearTimeout(timer); timer = setTimeout(render, 90); }

  /* ---------------- events ---------------- */
  $('#txt').addEventListener('input', function () { s.text = this.value.slice(0, MAX_CHARS); save(); soon(); });
  $('#heading').addEventListener('input', function () { s.heading = this.value; save(); soon(); });
  $('#date').addEventListener('input', function () { s.date = this.value; save(); soon(); });
  $('#size').addEventListener('input', function () { s.size = EDU.clamp(parseInt(this.value, 10) || 42, 26, 72); save(); render(); });
  $('#spacing').addEventListener('input', function () { s.spacing = EDU.clamp(parseInt(this.value, 10) || 16, 12, 26); save(); render(); });
  function seg(id, fn) {
    $('#' + id).addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button[data-v]') : null;
      if (!b) return;
      fn(b.getAttribute('data-v')); setSeg(id, b.getAttribute('data-v')); save(); render();
    });
  }
  seg('paper', function (v) { if (PAPERS.indexOf(v) >= 0) s.paper = v; });
  seg('ink', function (v) { if (INKS[v]) s.ink = v; });
  seg('vary', function (v) { s.vary = EDU.clamp(parseInt(v, 10) || 0, 0, 2); });
  $('#shuffle').addEventListener('click', function () {
    s.seed = (s.seed * 31 + 7 + Math.floor(Math.random() * 99991)) % 1000000;
    if (!s.vary) { s.vary = 1; setSeg('vary', 1); }
    save(); render();
  });
  $('#prev').addEventListener('click', function () { if (pageIdx > 0) { pageIdx--; render(); } });
  $('#next').addEventListener('click', function () { if (L && pageIdx < L.pages - 1) { pageIdx++; render(); } });
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    s = defaults(); store.remove('s'); pageIdx = 0; syncInputs(); render();
  });

  /* ---------------- download + print ---------------- */
  function pageCanvas(idx) {
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    drawPage(c.getContext('2d'), idx, false);
    return c;
  }
  function pageBlob(idx) {
    return new Promise(function (resolve) {
      var c = pageCanvas(idx);
      try { c.toBlob(function (b) { resolve(b); }, 'image/png'); } catch (e) { resolve(null); }
    });
  }
  function fileName(idx) { return L.pages > 1 ? 'handwriting-page-' + pad(idx + 1) + '.png' : 'handwriting.png'; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  var busy = false;
  $('#dl').addEventListener('click', function () {
    clearTimeout(timer); render();
    var idx = pageIdx;
    pageBlob(idx).then(function (b) { if (b) EDU.download(fileName(idx), b); });
  });
  $('#dl-all').addEventListener('click', function () {
    if (busy) return;
    clearTimeout(timer); render();
    busy = true;
    var n = L.pages, i = 0, btn = this; btn.disabled = true;
    (function step() {
      if (i >= n) { busy = false; btn.disabled = false; EDU.toast(t('msg_saved', { n: EDU.fmt(n) })); return; }
      var idx = i++;
      pageBlob(idx).then(function (b) { if (b) EDU.download(fileName(idx), b); return wait(450); }).then(step, function () { busy = false; btn.disabled = false; });
    })();
  });

  var printUrls = [];
  function clearPrint() {
    printUrls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) { } });
    printUrls = []; $('#print-pages').textContent = '';
  }
  function buildPrint() {
    clearTimeout(timer); render();
    clearPrint();
    var box = $('#print-pages'), jobs = [];
    for (var i = 0; i < L.pages; i++) jobs.push(pageBlob(i));
    return Promise.all(jobs).then(function (blobs) {
      var waits = [];
      blobs.forEach(function (b) {
        if (!b) return;
        var u = URL.createObjectURL(b); printUrls.push(u);
        var img = EDU.el('img', { alt: '', src: u });
        box.appendChild(EDU.el('div', { class: 'pp' }, img));
        waits.push(img.decode ? img.decode().catch(function () { }) : new Promise(function (r) { img.onload = img.onerror = r; }));
      });
      return Promise.all(waits);
    }).then(function () { box.setAttribute('data-n', printUrls.length); return printUrls.length; });
  }
  $('#print').addEventListener('click', function () {
    var btn = this; btn.disabled = true;
    buildPrint().then(function () { btn.disabled = false; window.print(); }, function () { btn.disabled = false; });
  });
  /* Ctrl+P without the button: fill the print area with the pages (data URLs, built at once) */
  window.addEventListener('beforeprint', function () {
    if ($('#print-pages').children.length) return;
    try {
      for (var i = 0; i < L.pages; i++) $('#print-pages').appendChild(EDU.el('div', { class: 'pp' }, EDU.el('img', { alt: '', src: pageCanvas(i).toDataURL('image/png') })));
    } catch (e) { }
  });
  window.addEventListener('afterprint', function () { setTimeout(clearPrint, 500); });

  /* ---------------- font (from fonts/kalam.js, no network) ---------------- */
  function b64buf(b64) {
    var bin = atob(b64), n = bin.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  }
  function loadFont() {
    var list = window.TTH_FONTS;
    if (!list || !list.length || !window.FontFace || !document.fonts || !window.atob) return Promise.resolve(false);
    try {
      return Promise.all(list.map(function (f) {
        var ff = new FontFace(FAMILY, b64buf(f.data), { weight: '400', style: 'normal', unicodeRange: f.range });
        return ff.load().then(function (x) { document.fonts.add(x); return true; });
      })).then(function () { return true; }, function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }

  EDU.onLang(function () { syncInputs(); render(); });
  syncInputs();
  render();
  loadFont().then(function (ok) {
    fontState = ok ? 'kalam' : 'system';
    cache = {}; cacheN = 0;
    render();
    window.TTH_READY = true;
  });
})();
