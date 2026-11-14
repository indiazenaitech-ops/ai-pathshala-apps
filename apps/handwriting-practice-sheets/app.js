/* Handwriting Practice Sheets: printable A4 tracing worksheets, drawn as SVG with the fonts already on the device.
   Each row: guide lines, a solid model letter, dotted or light-grey copies to trace, then empty space.
   Guide lines are placed by measuring the font that is really used, so they fit on every phone and computer.
   Data: data.js (window.HP_DATA). Nothing is uploaded; settings are kept with EDU.store. */
(function () {
  'use strict';
  var SLUG = 'handwriting-practice-sheets';
  var D = window.HP_DATA, $ = EDU.$, $$ = EDU.$$, t = EDU.t, el = EDU.el, esc = EDU.esc;
  var store = EDU.store(SLUG);

  var DEF = { script: null, sel: {}, custom: null, title: null, size: 'm', rows: 'auto', style: 'dot', fill: 'half', repeat: 1, dot: true, nameLine: true, font: 'round' };
  var SIZES = { s: 8, m: 11, l: 15, xl: 20 };                 // height of a tall letter in mm
  var ROW_CHOICES = [3, 4, 5, 6, 7, 8, 10, 12];
  var MAX_ROWS = 240, MAX_LINES = 60, MAX_CHARS = 40;
  var PAGE_W = 210, PAGE_H = 297, MX = 13, BOTTOM = 284;
  var PAGE_FONT = 'system-ui, -apple-system, "Segoe UI", "Nirmala UI", "Noto Sans", "Noto Nastaliq Urdu", sans-serif';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load() {
    var s = store.get('state', null), o = clone(DEF);
    if (!s || typeof s !== 'object') return o;
    if (typeof s.script === 'string' && (D.scripts[s.script] || s.script === 'custom')) o.script = s.script;
    if (s.sel && typeof s.sel === 'object') {
      Object.keys(s.sel).forEach(function (k) {
        if (D.scripts[k] && Array.isArray(s.sel[k])) o.sel[k] = s.sel[k].filter(function (i) { return i === Math.floor(i) && i >= 0 && i < D.scripts[k].all.length; });
      });
    }
    if (typeof s.custom === 'string') o.custom = s.custom.slice(0, 1500);
    if (typeof s.title === 'string') o.title = s.title.slice(0, 60);
    if (SIZES[s.size]) o.size = s.size;
    if (s.rows === 'auto' || ROW_CHOICES.indexOf(+s.rows) >= 0) o.rows = s.rows === 'auto' ? 'auto' : +s.rows;
    if (s.style === 'dot' || s.style === 'grey') o.style = s.style;
    if (['half', 'full', 'model'].indexOf(s.fill) >= 0) o.fill = s.fill;
    if ([1, 2, 3, 4].indexOf(+s.repeat) >= 0) o.repeat = +s.repeat;
    o.dot = s.dot !== false; o.nameLine = s.nameLine !== false;
    if (s.font === 'plain') o.font = 'plain';
    return o;
  }
  var state = load();
  function save() { store.set('state', state); }

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- which script, which letters ---------------- */
  function curScript() { return state.script || D.byLang[EDU.lang] || 'en_caps'; }
  function latinFont() { return state.font === 'plain' ? D.plain : D.round; }
  function fontOf(key) { var s = D.scripts[key]; return s.latin ? latinFont() : s.font; }
  function selected(key) {
    var s = D.scripts[key], sel = state.sel[key];
    if (!sel) return s.all.map(function (_, i) { return i; });
    return sel.slice().sort(function (a, b) { return a - b; });
  }
  /* script of a word typed by the user: the first letter that belongs to an Indian script or Urdu decides */
  function scriptOfText(text) {
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      for (var j = 0; j < D.ranges.length; j++) if (c >= D.ranges[j][0] && c <= D.ranges[j][1]) return D.ranges[j][2];
    }
    return 'en_small';
  }
  function customLines() {
    var txt = state.custom == null ? t('sample_text') : state.custom;
    return String(txt).split(/\r?\n/).map(function (s) { return s.replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS); })
      .filter(Boolean).slice(0, MAX_LINES);
  }

  /* ---------------- measuring the real font ---------------- */
  var mctx = document.createElement('canvas').getContext('2d'), mCache = {};
  function meas(font, text) {
    var k = font + '|' + text, m = mCache[k];
    if (m) return m;
    mctx.font = '100px ' + font;
    var r = mctx.measureText(text);
    m = { w: r.width / 100,
      up: (typeof r.actualBoundingBoxAscent === 'number' ? r.actualBoundingBoxAscent : 72) / 100,
      down: (typeof r.actualBoundingBoxDescent === 'number' ? r.actualBoundingBoxDescent : 0) / 100 };
    return (mCache[k] = m);
  }
  /* guide lines for one script, in em units above (+) or below (-) the base line */
  function guide(key) {
    var s = D.scripts[key], f = fontOf(key), k = 'g|' + key + '|' + f;
    if (mCache[k]) return mCache[k];
    var g, top, dn, up;
    if (s.guide === 'four') {
      top = Math.max(meas(f, 'H').up, meas(f, 'l').up) || .72;
      var x = meas(f, 'x').up || top * .7; dn = Math.max(meas(f, 'p').down, top * .25);
      g = { top: top, up: top, down: dn, lines: [[top, 'o'], [x, 'd'], [0, 'b'], [-dn, 'o']] };
    } else {
      /* Indian scripts and Urdu: measure every letter of the alphabet, so tall and deep letters stay inside the row */
      var asc = [], mu = 0, md = 0;
      s.all.forEach(function (ch) { var m = meas(f, ch); asc.push(m.up); if (m.up > mu) mu = m.up; if (m.down > md) md = m.down; });
      asc.sort(function (a, b) { return a - b; });
      if (s.guide === 'base') {
        top = meas(f, s.ref).up || .7; up = Math.max(mu, top) * 1.03; dn = Math.max(md, top * .3) * 1.05;
        g = { top: top, up: up, down: dn, lines: [[up, 'o'], [0, 'b'], [-dn, 'o']] };
      } else if (s.guide === 'head') {
        top = meas(f, s.ref).up || .7; up = Math.max(mu * 1.03, top * 1.3); dn = Math.max(md * 1.05, top * .3);
        g = { top: top, up: up, down: dn, lines: [[up, 'o'], [top * .965, 'b'], [0, 'i'], [-dn, 'o']] };
      } else {
        top = asc[Math.floor(asc.length / 2)] || .7; up = Math.max(mu * 1.03, top * 1.2); dn = Math.max(md * 1.05, top * .25);
        g = { top: top, up: up, down: dn, lines: [[up, 'o'], [top, 'i'], [0, 'b'], [-dn, 'o']] };
      }
    }
    return (mCache[k] = g);
  }

  /* where the pen starts (English letters and numbers): the point from data.js, moved onto the nearest stroke of the real font */
  var ictx = null;
  function inkStart(font, ch) {
    var p = D.start[ch]; if (!p) return null;
    var k = 's|' + font + '|' + ch;
    if (k in mCache) return mCache[k];
    var N = 300, OX = 70, OY = 210, FS = 160, out = null;
    try {
      if (!ictx) { var c = document.createElement('canvas'); c.width = N; c.height = N; ictx = c.getContext('2d', { willReadFrequently: true }); }
      ictx.clearRect(0, 0, N, N); ictx.font = FS + 'px ' + font; ictx.fillStyle = '#000'; ictx.fillText(ch, OX, OY);
      var px = ictx.getImageData(0, 0, N, N).data, x0 = N, y0 = N, x1 = -1, y1 = -1, ink = [], x, y;
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (px[(y * N + x) * 4 + 3] > 110) {
        ink.push(x, y); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      if (ink.length) {
        var tx = x0 + p[0] * (x1 - x0), ty = y0 + p[1] * (y1 - y0), best = 1e9, bx = tx, by = ty, i, d;
        for (i = 0; i < ink.length; i += 2) { d = (ink[i] - tx) * (ink[i] - tx) + (ink[i + 1] - ty) * (ink[i + 1] - ty); if (d < best) { best = d; bx = ink[i]; by = ink[i + 1]; } }
        var sx = 0, sy = 0, n = 0, R = 81;                       // centre of the stroke around that point
        for (i = 0; i < ink.length; i += 2) { d = (ink[i] - bx) * (ink[i] - bx) + (ink[i + 1] - by) * (ink[i + 1] - by); if (d <= R) { sx += ink[i]; sy += ink[i + 1]; n++; } }
        out = { x: (sx / n - OX) / FS, y: (sy / n - OY) / FS };
      }
    } catch (e) { out = null; }
    return (mCache[k] = out);
  }

  /* ---------------- building the sheets ---------------- */
  function num(v) { return (Math.round(v * 100) / 100).toString(); }
  var LINE = {
    b: 'stroke="#3f7fc4" stroke-width="0.38"',                       // main writing line
    i: 'stroke="#7fa9d8" stroke-width="0.26"',                       // inner line
    d: 'stroke="#7fa9d8" stroke-width="0.26" stroke-dasharray="1.6 1.4"',
    o: 'stroke="#e79a9a" stroke-width="0.24"'                        // outer lines
  };

  function plan() {
    var key = curScript(), items = [], notes = [], blank = false;
    if (key === 'custom') {
      customLines().forEach(function (line) { items.push({ text: line, key: scriptOfText(line) }); });
      if (!items.length) { blank = true; notes.push(t('empty_custom')); }
    } else {
      selected(key).forEach(function (i) { items.push({ text: D.scripts[key].all[i], key: key }); });
      if (!items.length) { blank = true; notes.push(t('pick_one')); }
    }
    var rows = [];
    items.forEach(function (it) { for (var r = 0; r < state.repeat; r++) rows.push(it); });
    if (rows.length > MAX_ROWS) { rows = rows.slice(0, MAX_ROWS); notes.push(t('too_many', { n: MAX_ROWS })); }

    var body = SIZES[state.size], band = 0, blankKey = key === 'custom' ? scriptOfText(EDU.lang === 'en' ? 'a' : t('def_title')) : key;
    (blank ? [{ key: blankKey }] : rows).forEach(function (it) {
      var g = guide(it.key), fs = body / g.top;
      it.g = g; it.fs = fs; band = Math.max(band, (g.up + g.down) * fs);
    });
    var title = state.title == null ? t('def_title') : state.title.trim();
    var y0 = 12 + (title ? 13 : 0) + (state.nameLine ? 11 : 0);
    var gap = EDU.clamp(body * .42, 3.5, 8), avail = BOTTOM - y0;
    var maxRows = Math.max(1, Math.floor((avail + gap) / (band + gap)));
    var perPage = state.rows === 'auto' ? maxRows : Math.min(state.rows, maxRows);
    if (state.rows !== 'auto' && state.rows > maxRows) notes.push(t('rows_fit', { n: maxRows }));
    if (blank) { var bg = guide(blankKey); rows = []; for (var b = 0; b < perPage; b++) rows.push({ text: '', key: blankKey, g: bg, fs: body / bg.top }); }
    return { rows: rows, perPage: perPage, pitch: avail / perPage, band: band, y0: y0, title: title, notes: notes, count: blank ? 0 : rows.length };
  }

  function rowSvg(it, top, pitch, band) {
    var s = D.scripts[it.key], font = fontOf(it.key), g = it.g, fs = it.fs, rtl = !!s.rtl, rowW = PAGE_W - 2 * MX;
    var w = it.text ? meas(font, it.text).w : 0, n = 0, traces = 0;
    if (it.text) {
      if (w * fs > rowW - 2) fs = (rowW - 2) / w;                    // a long word is made smaller so that it fits
      var cell = w * fs + Math.max(fs * .28, 2.5);
      n = Math.max(1, Math.floor(rowW / cell));
      traces = state.fill === 'model' ? 0 : state.fill === 'full' || n <= 2 ? n - 1 : Math.ceil((n - 1) / 2);
    }
    var base = top + (pitch - band) / 2 + (band - (g.up + g.down) * fs) / 2 + g.up * fs;
    var h = ['<g class="row" data-text="' + esc(it.text) + '" data-traces="' + traces + '" data-rtl="' + (rtl ? 1 : 0) + '">'];
    var model = '', LINES = g.lines.map(function (ln) {                 // drawn over the traceable letters, under the model letter
      var y = num(base - ln[0] * fs);
      return '<line class="gl" x1="' + MX + '" x2="' + (PAGE_W - MX) + '" y1="' + y + '" y2="' + y + '" ' + LINE[ln[1]] + '/>';
    }).join('');
    if (it.text) {
      var cw = rowW / n, sw = EDU.clamp(fs * .022, .28, .62), attrs = ' y="' + num(base) + '" font-size="' + num(fs) + '" font-family="' + esc(font) + '" text-anchor="middle"' + (rtl ? ' direction="rtl"' : '') + '>' + esc(it.text) + '</text>';
      var trace = state.style === 'grey' ? ' fill="#c6c9ce"'
        : ' fill="#fff" paint-order="stroke" stroke="#4f5863" stroke-width="' + num(sw * 2) + '" stroke-dasharray="0.01 ' + num(sw * 2.3) + '" stroke-linecap="round" stroke-linejoin="round"';   // the white fill hides the inner half and any overlapping contours
      var dots = [];
      for (var i = 0; i <= traces; i++) {
        var cx = rtl ? PAGE_W - MX - (i + .5) * cw : MX + (i + .5) * cw;
        var tx = '<text class="' + (i ? 'tr' : 'model') + '" x="' + num(cx) + '"' + (i ? trace : ' fill="#111"') + attrs;
        if (i) h.push(tx); else model = tx;
        if (i && state.dot && s.latin) {
          var left = cx - w * fs / 2, pre = '';
          for (var c = 0; c < it.text.length; c++) {
            var ch = it.text.charAt(c), p = inkStart(font, ch);
            if (p) dots.push('<circle class="sd" cx="' + num(left + (pre ? meas(font, pre).w : 0) * fs + p.x * fs) + '" cy="' + num(base + p.y * fs) + '" r="' + num(EDU.clamp(fs * .05, .55, 1.3)) + '" fill="#e03131"/>');
            pre += ch;
          }
        }
      }
      h.push(LINES, model, dots.join(''));
    } else h.push(LINES);
    h.push('</g>');
    return h.join('');
  }

  function pageSvg(P, pageNo, rows) {
    var rtlUi = document.documentElement.dir === 'rtl', h = [];
    h.push('<svg class="page" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + PAGE_W + ' ' + PAGE_H + '" role="img" aria-label="' + esc(t('page_n', { n: pageNo })) + '">');
    h.push('<rect width="' + PAGE_W + '" height="' + PAGE_H + '" fill="#fff"/>');
    var y = 12;
    if (P.title) {
      var tw = meas(PAGE_FONT, P.title).w, tfs = Math.min(6.2, (PAGE_W - 2 * MX) / (tw || 1));
      h.push('<text class="ttl" x="' + PAGE_W / 2 + '" y="' + (y + 8) + '" font-size="' + num(tfs) + '" font-weight="700" font-family="' + esc(PAGE_FONT) + '" text-anchor="middle" fill="#111"' + (rtlUi ? ' direction="rtl"' : '') + '>' + esc(P.title) + '</text>');
      y += 13;
    }
    if (state.nameLine) {
      var fsz = 4, ly = y + 6.5, a = t('name_lbl') + ':', b = t('date_lbl') + ':', aw = meas(PAGE_FONT, a).w * fsz, bw = meas(PAGE_FONT, b).w * fsz;
      var x1 = MX, x2 = MX + 112, e1 = MX + 104, e2 = PAGE_W - MX;
      var X = function (v) { return num(rtlUi ? PAGE_W - v : v); }, dirA = rtlUi ? ' direction="rtl"' : '';
      var txt = function (s, x) { return '<text class="nl" x="' + X(x) + '" y="' + num(ly) + '" font-size="' + fsz + '" font-family="' + esc(PAGE_FONT) + '" fill="#333"' + dirA + '>' + esc(s) + '</text>'; };
      var ln = function (xa, xb) { return '<line x1="' + X(xa) + '" x2="' + X(xb) + '" y1="' + num(ly + .6) + '" y2="' + num(ly + .6) + '" stroke="#777" stroke-width="0.25"/>'; };
      h.push(txt(a, x1), ln(x1 + aw + 2, e1), txt(b, x2), ln(x2 + bw + 2, e2));
    }
    rows.forEach(function (it, i) { h.push(rowSvg(it, P.y0 + i * P.pitch, P.pitch, P.band)); });
    h.push('<text x="' + PAGE_W / 2 + '" y="291.5" font-size="2.6" font-family="' + esc(PAGE_FONT) + '" text-anchor="middle" fill="#9aa1aa">apnipathshala.ai</text>');
    h.push('</svg>');
    return h.join('');
  }

  function render() {
    var P = plan(), html = [], pages = Math.max(1, Math.ceil(P.rows.length / P.perPage));
    for (var p = 0; p < pages; p++) html.push(pageSvg(P, p + 1, P.rows.slice(p * P.perPage, (p + 1) * P.perPage)));
    $('#pages').innerHTML = html.join('');
    $('#status').textContent = t('status', { p: EDU.fmt(pages), r: EDU.fmt(P.count) });
    var msg = $('#msg'); msg.innerHTML = '';
    P.notes.forEach(function (n) { msg.appendChild(el('p', { class: 'callout warning small', text: n, style: { margin: '0' } })); });
  }

  /* ---------------- controls ---------------- */
  function seg(id, value) { $$('#' + id + ' button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === String(value))); }); }
  function renderLetters() {
    var key = curScript(), box = $('#letters'); box.innerHTML = '';
    var custom = key === 'custom';
    $('#lettersBox').hidden = custom; $('#customBox').hidden = !custom;
    $('#fontBox').hidden = !(custom || D.scripts[key].latin);
    if (custom) return;
    var s = D.scripts[key], on = {};
    selected(key).forEach(function (i) { on[i] = 1; });
    box.dir = s.rtl ? 'rtl' : 'ltr';
    box.style.fontFamily = fontOf(key);
    s.all.forEach(function (ch, i) {
      box.appendChild(el('button', { type: 'button', text: ch, 'aria-pressed': String(!!on[i]), dataset: { i: String(i) } }));
    });
    $('#selVow').hidden = $('#selCon').hidden = !s.v;
  }
  function renderControls() {
    var key = curScript(), sel = $('#script'); sel.innerHTML = '';
    D.order.forEach(function (k) { sel.appendChild(el('option', { value: k, text: t(D.scripts[k].label) })); });
    sel.appendChild(el('option', { value: 'custom', text: t('custom') }));
    sel.value = key;
    var rows = $('#rows'); rows.innerHTML = '';
    rows.appendChild(el('option', { value: 'auto', text: t('rows_auto') }));
    ROW_CHOICES.forEach(function (n) { rows.appendChild(el('option', { value: String(n), text: String(n) })); });
    rows.value = String(state.rows);
    $('#title').value = state.title == null ? t('def_title') : state.title;
    $('#customText').value = state.custom == null ? t('sample_text') : state.custom;
    $('#fill').value = state.fill; $('#repeat').value = String(state.repeat); $('#font').value = state.font;
    $('#startDot').checked = state.dot; $('#nameLine').checked = state.nameLine;
    seg('size', state.size); seg('style', state.style);
    renderLetters();
  }
  function changed() { save(); render(); }
  function setSel(list) { state.sel[curScript()] = list; renderLetters(); changed(); }

  $('#script').addEventListener('change', function () { state.script = this.value; renderLetters(); changed(); });
  $('#letters').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var key = curScript(), i = +b.dataset.i, sel = selected(key), at = sel.indexOf(i);
    if (at >= 0) sel.splice(at, 1); else sel.push(i);
    state.sel[key] = sel;
    b.setAttribute('aria-pressed', String(at < 0));
    changed();
  });
  $('#selAll').addEventListener('click', function () { delete state.sel[curScript()]; renderLetters(); changed(); });
  $('#selNone').addEventListener('click', function () { setSel([]); });
  function group(g) {
    var s = D.scripts[curScript()], want = {};
    (s[g] || []).forEach(function (ch) { want[ch] = 1; });
    setSel(s.all.map(function (ch, i) { return want[ch] ? i : -1; }).filter(function (i) { return i >= 0; }));
  }
  $('#selVow').addEventListener('click', function () { group('v'); });
  $('#selCon').addEventListener('click', function () { group('c'); });
  $('#customText').addEventListener('input', function () { state.custom = this.value; changed(); });
  $('#title').addEventListener('input', function () { state.title = this.value; changed(); });
  ['size', 'style'].forEach(function (id) {
    $('#' + id).addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      state[id] = b.dataset.v; seg(id, state[id]); changed();
    });
  });
  $('#fill').addEventListener('change', function () { state.fill = this.value; changed(); });
  $('#rows').addEventListener('change', function () { state.rows = this.value === 'auto' ? 'auto' : +this.value; changed(); });
  $('#repeat').addEventListener('change', function () { state.repeat = +this.value || 1; changed(); });
  $('#font').addEventListener('change', function () { state.font = this.value === 'plain' ? 'plain' : 'round'; renderLetters(); changed(); });
  $('#startDot').addEventListener('change', function () { state.dot = this.checked; changed(); });
  $('#nameLine').addEventListener('change', function () { state.nameLine = this.checked; changed(); });
  $('#printBtn').addEventListener('click', function () { window.print(); });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    state = clone(DEF); store.remove('state'); renderControls(); render();
  });

  EDU.onLang(function () { renderControls(); render(); });
  renderControls();
  render();
})();
