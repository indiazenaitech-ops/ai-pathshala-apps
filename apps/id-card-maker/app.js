/* ID Card Maker: student / staff / visitor ID cards drawn on a canvas (so the screen, the PNG and the print are the
 * same picture), with a logo, a photo cropped to the frame, an optional QR code of the ID number (qr.js, made on the
 * device), a CSV batch mode and an A4 print sheet with cut marks (9 portrait or 10 landscape cards of 54 x 86 mm).
 * Nothing is uploaded: images are read with FileReader and kept in this browser only. */
(function () {
  'use strict';
  var SLUG = 'id-card-maker';
  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t, el = EDU.el;
  var store = EDU.store(SLUG);

  var THEMES = [
    { c: '#1d4e89', d: '#f2a900', soft: '#e6eef8' },
    { c: '#1b6b4a', d: '#e0b100', soft: '#e5f3ec' },
    { c: '#8a1c2b', d: '#d9a441', soft: '#f8e9eb' },
    { c: '#b84a0a', d: '#5b2a06', soft: '#fbeee4' },
    { c: '#5b3a9b', d: '#f0b429', soft: '#eee9f8' },
    { c: '#2f3b47', d: '#e2572b', soft: '#e9edf1' }
  ];
  var MAX_CARDS = 300, THUMBS = 12;
  var FIELDS = ['name', 'cls', 'id', 'blood', 'valid', 'contact', 'address'];
  var LIMITS = { name: 80, cls: 60, id: 40, blood: 6, valid: 40, contact: 60, address: 200 };
  var DEF = { mode: 'one', type: 'student', orient: 'portrait', theme: 0, qr: true, copies: 1,
    org: '', valid: '', contact: '', address: '', name: '', cls: '', id: '', blood: '', csv: '', pz: 1, px: 0, py: 0 };

  var state = Object.assign({}, DEF, store.get('state', {}));
  if (!THEMES[state.theme]) state.theme = 0;
  var logoImg = null, photoImg = null, logoUrl = '', photoUrl = '';
  var batchPhotos = {};                       // lower-cased file name (no extension) -> Image, memory only
  var batch = { cards: [], skipped: 0, dup: 0, badBlood: 0, over: 0, noNameCol: false, sample: false };
  var sel = 0, printFresh = false, blobUrls = [], busy = false;

  var cv = $('#card'), printRoot = $('#printRoot');

  /* ------------------------------------------------------------ helpers */
  function norm(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function clip(s, n) { var a = Array.from(norm(s)); return a.length > n ? a.slice(0, n).join('') : a.join(''); }
  function fontStack() { return getComputedStyle(document.body).fontFamily || 'sans-serif'; }
  var FONT = 'sans-serif';
  function setFont(g, size, weight) { g.font = (weight || 400) + ' ' + size + 'px ' + FONT; }

  function wrap(g, text, maxW, maxLines) {
    var words = text.split(/\s+/).filter(Boolean), lines = [], cur = '';
    words.forEach(function (w) {
      var test = cur ? cur + ' ' + w : w;
      if (g.measureText(test).width <= maxW) { cur = test; return; }
      if (cur) lines.push(cur);
      if (g.measureText(w).width <= maxW) { cur = w; return; }
      cur = '';
      Array.from(w).forEach(function (ch) {                      // one very long word: break it
        if (!cur || g.measureText(cur + ch).width <= maxW) cur += ch; else { lines.push(cur); cur = ch; }
      });
    });
    if (cur) lines.push(cur);
    var over = lines.length > maxLines;
    if (over) {
      lines = lines.slice(0, maxLines);
      var last = Array.from(lines[maxLines - 1]);
      while (last.length > 1 && g.measureText(last.join('') + '…').width > maxW) last.pop();
      lines[maxLines - 1] = last.join('') + '…';
    }
    return { lines: lines, over: over };
  }
  /* biggest size that fits: one line down to 80 % of the size, then up to maxLines, then cut with … */
  function fitBlock(g, text, maxW, max, min, maxLines, weight) {
    var size, r;
    for (size = max; size >= Math.max(min, max * 0.8); size -= 1) {
      setFont(g, size, weight);
      if (g.measureText(text).width <= maxW) return { size: size, lines: [text], cut: false };
    }
    for (size = max; size >= min; size -= 1) {
      setFont(g, size, weight);
      r = wrap(g, text, maxW, maxLines);
      if (!r.over) return { size: size, lines: r.lines, cut: false };
    }
    setFont(g, min, weight);
    r = wrap(g, text, maxW, maxLines);
    return { size: min, lines: r.lines, cut: true };
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  function drawQR(g, s, text, x, y, size) {
    var q = window.QRGen ? window.QRGen.encode(text, 'M') : null;
    if (!q || !q.ok) return 0;
    var n = q.size, quiet = 2, tot = n + quiet * 2;
    var dx = Math.round(x * s), dy = Math.round(y * s), ds = Math.round(size * s);
    var m = Math.max(1, Math.floor(ds / tot)), off = Math.max(0, Math.floor((ds - m * tot) / 2));
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#fff'; g.fillRect(dx, dy, ds, ds);
    g.fillStyle = '#000';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      if (q.modules[r][c]) g.fillRect(dx + off + (quiet + c) * m, dy + off + (quiet + r) * m, m, m);
    }
    g.restore();
    return n;
  }

  /* ------------------------------------------------------------ the card */
  /* d: {org,name,cls,id,blood,valid,contact,address,photo,crop}; o: {orient,theme,qr,logo,band,labels,rtl,lh,scale} */
  function drawCard(canvas, d, o) {
    var P = o.orient !== 'landscape', W = P ? 540 : 860, H = P ? 860 : 540, s = o.scale || 1;
    canvas.width = Math.round(W * s); canvas.height = Math.round(H * s);
    var g = canvas.getContext('2d');
    g.setTransform(s, 0, 0, s, 0, 0);
    var th = THEMES[o.theme] || THEMES[0], rtl = !!o.rtl, LH = o.lh || 1.24;
    try { g.direction = rtl ? 'rtl' : 'ltr'; } catch (e) { }
    g.textBaseline = 'alphabetic';
    var aS = rtl ? 'right' : 'left';
    function X(x) { return rtl ? W - x : x; }
    function line(text, x, top, size) { g.fillText(text, x, top + size * (LH / 2 + 0.34)); }
    function block(b, x, top, weight, color, align) {
      setFont(g, b.size, weight); g.fillStyle = color; g.textAlign = align;
      b.lines.forEach(function (l) { line(l, x, top, b.size); top += b.size * LH; });
      return top;
    }
    var info = { qr: 0, rows: 0, cut: false, fits: true };

    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);

    /* header band: logo + organisation + kind of card */
    var hh = P ? 150 : 120, pad = 24, ls = o.logo ? (P ? 86 : 80) : 0;
    g.fillStyle = th.c; g.fillRect(0, 0, W, hh);
    g.fillStyle = th.d; g.fillRect(0, hh, W, 6);
    if (ls) {
      var lx = rtl ? W - pad - ls : pad, ly = (hh - ls) / 2;
      g.fillStyle = '#fff'; roundRect(g, lx, ly, ls, ls, 12); g.fill();
      var iw = o.logo.naturalWidth || o.logo.width, ih = o.logo.naturalHeight || o.logo.height;
      if (iw && ih) {
        var k = Math.min((ls - 10) / iw, (ls - 10) / ih);
        g.drawImage(o.logo, lx + (ls - iw * k) / 2, ly + (ls - ih * k) / 2, iw * k, ih * k);
      }
    }
    var tx0 = pad + (ls ? ls + 14 : 0), tw = W - tx0 - pad;
    var ob = d.org ? fitBlock(g, d.org, tw, P ? 31 : 34, 18, 2, 700) : null;
    var bandSize = 17, bandB = null;
    if (o.band) bandB = fitBlock(g, o.band, tw, bandSize, 12, 1, 600);
    var totalH = (ob ? ob.lines.length * ob.size * LH : 0) + (bandB ? bandB.size * LH + 4 : 0);
    var hy = (hh - totalH) / 2, hx = ls ? X(tx0) : W / 2, hal = ls ? aS : 'center';
    if (ob) { hy = block(ob, hx, hy, 700, '#fff', hal); info.cut = info.cut || ob.cut; }
    if (bandB) { g.globalAlpha = 0.9; block(bandB, hx, hy + 4, 600, '#fff', hal); g.globalAlpha = 1; }

    /* footer band: address */
    var addr = norm(String(d.address || '').replace(/\s*\n+\s*/g, ', ').replace(/,\s*,/g, ','));
    var fh = addr ? (P ? 84 : 60) : 16;
    g.fillStyle = th.c; g.fillRect(0, H - fh, W, fh);
    if (addr) {
      var ab = fitBlock(g, addr, W - 40, 19, 14, 2, 500);
      block(ab, W / 2, H - fh + (fh - ab.lines.length * ab.size * LH) / 2, 500, '#fff', 'center');
      info.cut = info.cut || ab.cut;
    }

    /* photo frame */
    var pw = P ? 200 : 190, ph = P ? 250 : 238;
    var px = P ? (W - pw) / 2 : (rtl ? W - 32 - pw : 32), py = hh + (P ? 26 : 24);
    g.save(); roundRect(g, px, py, pw, ph, 10); g.clip();
    g.fillStyle = th.soft; g.fillRect(px, py, pw, ph);
    var im = d.photo, piw = im && (im.naturalWidth || im.width), pih = im && (im.naturalHeight || im.height);
    if (im && piw && pih) {
      var cr = d.crop || { z: 1, x: 0, y: 0 };
      var sc = Math.max(pw / piw, ph / pih) * (cr.z || 1), dw = piw * sc, dh = pih * sc;
      g.drawImage(im, px + (pw - dw) / 2 - (cr.x || 0) * (dw - pw) / 2, py + (ph - dh) / 2 - (cr.y || 0) * (dh - ph) / 2, dw, dh);
    } else {
      g.fillStyle = th.c; g.globalAlpha = 0.2;
      g.beginPath(); g.arc(px + pw / 2, py + ph * 0.38, pw * 0.2, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(px + pw / 2, py + ph * 1.04, pw * 0.42, ph * 0.4, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }
    g.restore();
    g.strokeStyle = th.c; g.lineWidth = 4; roundRect(g, px, py, pw, ph, 10); g.stroke();

    /* QR code of the ID number, in the end-side bottom corner */
    var qs = o.qr && d.id ? (P ? 118 : 112) : 0, qy = H - fh - 12 - qs;
    if (qs) {
      info.qr = drawQR(g, s, d.id, rtl ? (P ? 40 : 32) : W - (P ? 40 : 32) - qs, qy, qs);
      if (!info.qr) qs = 0;
    }

    /* name, class / designation, detail rows */
    var x0, maxW, y, nameAlign, nameX;
    if (P) { x0 = 44; maxW = W - 88; y = py + ph + 12; nameAlign = 'center'; nameX = W / 2; }
    else { x0 = 32 + pw + 26; maxW = W - x0 - 32; y = py; nameAlign = aS; nameX = X(x0); }
    if (d.name) {
      var nb = fitBlock(g, d.name, P ? W - 48 : maxW, 38, 22, 2, 700);
      y = block(nb, nameX, y, 700, '#111', nameAlign); info.cut = info.cut || nb.cut;
    }
    if (d.cls) {
      var cb = fitBlock(g, d.cls, P ? W - 60 : maxW, 25, 17, 1, 600);
      y = block(cb, nameX, y + 2, 600, th.c, nameAlign); info.cut = info.cut || cb.cut;
    }
    y += 12;
    var L = o.labels || {};
    var rows = [[L.id, d.id], [L.blood, d.blood], [L.valid, d.valid], [L.contact, d.contact]].filter(function (r) { return r[1]; });
    info.rows = rows.length;
    if (rows.length) {
      var size = 23, rowH = Math.round(size * LH) + 7, rw = maxW, rwQ = maxW - (qs ? qs + 14 : 0);
      setFont(g, size, 400);
      var lw = 0;
      rows.forEach(function (r) { lw = Math.max(lw, g.measureText(r[0]).width); });
      lw = Math.min(lw + 14, rw * 0.42);
      if (P && !qs) {                                           // centre the block under the photo
        setFont(g, size, 700);
        var vw = 0;
        rows.forEach(function (r) { vw = Math.max(vw, g.measureText(r[1]).width); });
        x0 = Math.max(x0, (W - Math.min(rw, lw + vw)) / 2);
        rw = W - x0 - 44; rwQ = rw;
      }
      rows.forEach(function (r) {
        var lb = fitBlock(g, r[0], lw - 8, size, 13, 1, 400);
        block(lb, X(x0), y + (size - lb.size) * LH / 2, 400, '#555', aS);
        var vb = fitBlock(g, r[1], (qs && y + rowH > qy - 4 ? rwQ : rw) - lw, size, 13, 1, 700);   // only rows beside the QR are narrower
        block(vb, X(x0 + lw), y + (size - vb.size) * LH / 2, 700, r[0] === L.blood ? '#b3261e' : '#111', aS);
        info.cut = info.cut || vb.cut;
        y += rowH;
      });
    }
    info.fits = y <= H - fh + 2 && (!qs || rows.length <= 4);

    g.strokeStyle = '#c5cbd3'; g.lineWidth = 2; g.strokeRect(1, 1, W - 2, H - 2);
    return info;
  }

  /* ------------------------------------------------------------ data */
  function sharedBlank() { return !norm(state.org) && !norm(state.valid) && !norm(state.contact) && !norm(state.address) && !logoImg; }
  function personBlank() { return !norm(state.name) && !norm(state.cls) && !norm(state.id) && !state.blood && !photoImg; }
  function clsKey() { return state.type === 'staff' ? 'desig' : state.type === 'visitor' ? 'purpose' : 'class'; }
  function shared(useSample) {
    if (useSample) return { org: t('sample_org'), valid: t('sample_valid'), contact: '00000 00000', address: t('sample_address') };
    return { org: clip(state.org, 120), valid: clip(state.valid, 40), contact: clip(state.contact, 60), address: String(state.address || '').slice(0, 200) };
  }
  function oneCard() {
    var pb = personBlank(), sh = shared(pb && sharedBlank());
    var d = pb ? { name: t('sample_name'), cls: t('sample_' + clsKey()), id: 'DEMO-001', blood: 'B+' }
      : { name: clip(state.name, 80), cls: clip(state.cls, 60), id: clip(state.id, 40), blood: state.blood };
    d.org = sh.org; d.valid = sh.valid; d.contact = sh.contact; d.address = sh.address;
    d.photo = photoImg; d.crop = { z: +state.pz || 1, x: +state.px || 0, y: +state.py || 0 };
    d.sample = pb;
    return d;
  }

  var ALIAS = null;
  function aliases() {
    if (ALIAS) return ALIAS;
    var A = {
      name: ['name', 'full name', 'student', 'student name', 'employee name', 'naam'],
      cls: ['class', 'section', 'class section', 'designation', 'post', 'role', 'department', 'dept', 'purpose', 'company'],
      id: ['id', 'id no', 'id number', 'roll', 'roll no', 'roll number', 'admission no', 'adm no', 'emp id', 'employee id', 'code'],
      blood: ['blood', 'blood group', 'bg'],
      valid: ['valid', 'valid till', 'validity', 'valid upto', 'valid up to', 'valid until', 'expiry'],
      contact: ['contact', 'contact no', 'phone', 'mobile', 'mobile no', 'phone no'],
      address: ['address', 'addr']
    };
    var map = {}, keys = { name: ['f_name'], cls: ['f_class', 'f_desig', 'f_purpose', 'c_class'], id: ['f_id', 'c_id'], blood: ['f_blood', 'c_blood'], valid: ['f_valid', 'c_valid'], contact: ['f_contact', 'c_contact'], address: ['f_address'] };
    Object.keys(A).forEach(function (f) { A[f].forEach(function (a) { map[a] = f; }); });
    Object.keys(window.APP_STRINGS || {}).forEach(function (L) {
      Object.keys(keys).forEach(function (f) { keys[f].forEach(function (k) { var v = headKey(window.APP_STRINGS[L][k]); if (v && !map[v]) map[v] = f; }); });
    });
    ALIAS = map;
    return map;
  }
  function headKey(s) { return norm(String(s == null ? '' : s).toLowerCase().replace(/[.:_\-/()#*]+/g, ' ')); }
  function fixBlood(v) {
    var s = norm(v).toUpperCase().replace(/\s+/g, '').replace(/POSITIVE|POS|\+VE|VE\+/g, '+').replace(/NEGATIVE|NEG|-VE|−|–/g, '-').replace(/VE$/, '');
    return /^(A|B|AB|O)[+-]$/.test(s) ? s : null;
  }
  function sampleCsv() {
    return 'name,class,id,blood,valid,contact,address\n' +
      [[t('sample_name'), t('sample_' + clsKey()), 'DEMO-001', 'B+'], [t('sample_name2'), t('sample_' + clsKey()), 'DEMO-002', 'O+'], [t('sample_name3'), t('sample_' + clsKey()), 'DEMO-003', 'A+']]
        .map(function (r) { return r.map(function (v) { return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n') + '\n';
  }
  function parseBatch() {
    var text = String(state.csv || ''), isSample = !text.trim();
    var out = { cards: [], skipped: 0, dup: 0, badBlood: 0, over: 0, noNameCol: false, sample: isSample };
    var rows;
    try { rows = EDU.csv.parse(isSample ? sampleCsv() : text); } catch (e) { rows = []; }
    if (!rows.length) return out;
    var map = aliases(), cols = null, head = rows[0].map(headKey), hits = 0, hasName = false;
    head.forEach(function (h) { if (map[h]) { hits++; if (map[h] === 'name') hasName = true; } });
    if (hasName || hits >= 2) {
      cols = {};
      head.forEach(function (h, i) { var f = map[h]; if (f && cols[f] === undefined) cols[f] = i; });
      rows = rows.slice(1);
      if (cols.name === undefined) { out.noNameCol = true; return out; }
    } else {
      cols = {}; FIELDS.forEach(function (f, i) { cols[f] = i; });
    }
    var sh = shared(isSample && sharedBlank()), seen = {};
    rows.forEach(function (r) {
      var d = {};
      FIELDS.forEach(function (f) { d[f] = cols[f] === undefined ? '' : clip(r[cols[f]], LIMITS[f]); });
      if (!d.name) { if (r.some(function (c) { return norm(c); })) out.skipped++; return; }
      if (out.cards.length >= MAX_CARDS) { out.over++; return; }
      if (d.blood) { var b = fixBlood(r[cols.blood]); if (b) d.blood = b; else { d.blood = ''; out.badBlood++; } }
      if (d.id) { var k = d.id.toLowerCase(); if (seen[k]) out.dup++; seen[k] = 1; }
      d.org = sh.org; d.valid = d.valid || sh.valid; d.contact = d.contact || sh.contact; d.address = d.address || sh.address;
      d.photo = batchPhotos[d.id.toLowerCase()] || batchPhotos[d.name.toLowerCase()] || null;
      d.crop = { z: 1, x: 0, y: 0 };
      d.sample = isSample;
      out.cards.push(d);
    });
    return out;
  }
  function currentCards() {
    if (state.mode === 'many') return batch.cards;
    return [oneCard()];
  }
  function drawOpts(scale) {
    return {
      orient: state.orient, theme: state.theme, qr: !!state.qr, logo: logoImg, scale: scale, rtl: document.documentElement.dir === 'rtl',
      lh: EDU.lang === 'ur' ? 1.5 : 1.24, band: t('band_' + state.type),
      labels: { id: t('c_id'), blood: t('c_blood'), valid: t('c_valid'), contact: t('c_contact') }
    };
  }
  function sheetLayout() {
    return state.orient === 'landscape' ? { cols: 2, rows: 5, cw: 86, ch: 54, gx: 8, gy: 3 } : { cols: 3, rows: 3, cw: 54, ch: 86, gx: 6, gy: 5 };
  }
  function printList() {
    var cards = currentCards();
    if (state.mode === 'many') return cards;
    var n = EDU.clamp(Math.round(+state.copies) || 1, 1, 100), out = [];
    for (var i = 0; i < n; i++) out.push(cards[0]);
    return out;
  }

  /* ------------------------------------------------------------ render */
  var renderTimer = 0, saveTimer = 0;
  function schedule() { clearTimeout(renderTimer); renderTimer = setTimeout(render, 60); clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); }
  function save() { store.set('state', state); }

  function render() {
    FONT = fontStack();
    printFresh = false;
    var many = state.mode === 'many';
    $$('[data-type]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.type === state.type)); });
    $$('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)); });
    $$('[data-orient]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.orient === state.orient)); });
    $$('#swatches .sw').forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === state.theme)); b.setAttribute('aria-label', t('theme_n', { n: i + 1 })); });
    $('#oneBox').hidden = many; $('#manyBox').hidden = !many; $('#copiesBox').hidden = many;
    $('#lblClass').textContent = t('f_' + clsKey());
    $('#fClass').placeholder = t('sample_' + clsKey());
    $('#csv').placeholder = sampleCsv();
    $('#logoThumb').hidden = !logoImg; $('#logoRemove').hidden = !logoImg; if (logoImg) $('#logoThumb').src = logoUrl;
    $('#photoThumb').hidden = !photoImg; $('#photoRemove').hidden = !photoImg; $('#cropBox').hidden = !photoImg; if (photoImg) $('#photoThumb').src = photoUrl;

    if (many) batch = parseBatch();
    var cards = currentCards();
    sel = EDU.clamp(sel, 0, Math.max(0, cards.length - 1));
    var d = cards[sel] || { org: shared(false).org, name: '', cls: '', id: '', blood: '', valid: '', contact: '', address: '' };
    var info = drawCard(cv, d, drawOpts(1));
    cv.className = state.orient;
    cv.setAttribute('aria-label', d.name || t('h_preview'));
    cv.dataset.name = d.name || ''; cv.dataset.org = d.org || ''; cv.dataset.orient = state.orient; cv.dataset.theme = state.theme;
    cv.dataset.qr = info.qr; cv.dataset.rows = info.rows; cv.dataset.fits = info.fits ? '1' : '0'; cv.dataset.cut = info.cut ? '1' : '0';
    cv.dataset.photo = d.photo ? '1' : '0'; cv.dataset.sample = d.sample ? '1' : '0'; cv.dataset.cards = cards.length;

    var usingSample = cards.some(function (c) { return c.sample; });
    $('#sampleNote').hidden = !usingSample;

    /* QR note */
    var qn = $('#qrNote');
    qn.hidden = !(state.qr && !many && !d.id);
    qn.textContent = qn.hidden ? '' : t('qr_need_id');

    /* batch status + thumbnails */
    var th = $('#thumbs'), more = $('#moreNote');
    th.hidden = !many || !cards.length; more.hidden = true;
    th.textContent = '';
    if (many) {
      var st = $('#batchStatus'), w = [];
      st.className = 'callout small' + (cards.length ? ' success' : ' warning');
      st.textContent = batch.noNameCol ? t('batch_no_name_col') : cards.length ? t('batch_status', { n: EDU.fmt(cards.length) }) : t('batch_empty');
      st.dataset.count = cards.length; st.dataset.skipped = batch.skipped; st.dataset.dup = batch.dup; st.dataset.badblood = batch.badBlood; st.dataset.over = batch.over;
      if (batch.skipped) w.push(t('batch_skipped', { n: EDU.fmt(batch.skipped) }));
      if (batch.dup) w.push(t('batch_dup', { n: EDU.fmt(batch.dup) }));
      if (batch.badBlood) w.push(t('batch_badblood', { n: EDU.fmt(batch.badBlood) }));
      if (batch.over) w.push(t('batch_limit', { n: EDU.fmt(MAX_CARDS) }));
      var photos = cards.filter(function (c) { return c.photo; }).length;
      if (Object.keys(batchPhotos).length) w.push(t('batch_photos_matched', { n: EDU.fmt(photos), total: EDU.fmt(cards.length) }));
      var ul = $('#batchWarns'); ul.textContent = ''; ul.hidden = !w.length;
      w.forEach(function (m) { ul.appendChild(el('li', { text: m })); });
      th.className = 'thumbs ' + state.orient;
      cards.slice(0, THUMBS).forEach(function (c, i) {
        var tc = document.createElement('canvas');
        drawCard(tc, c, drawOpts(0.3));
        th.appendChild(el('button', { type: 'button', class: 'no-i18n', 'aria-pressed': String(i === sel), 'aria-label': c.name, onclick: function () { sel = i; render(); } }, tc));
      });
      if (cards.length > THUMBS) { more.hidden = false; more.textContent = t('batch_more', { n: EDU.fmt(cards.length - THUMBS) }); }
    }

    var lay = sheetLayout(), per = lay.cols * lay.rows, n = printList().length;
    $('#sheetInfo').textContent = busy ? $('#sheetInfo').textContent : t('sheet_info', { n: EDU.fmt(n), p: EDU.fmt(Math.max(1, Math.ceil(n / per))), k: per });
    $('#btnPng').disabled = !cards.length; $('#btnPrint').disabled = !cards.length || busy;
  }

  /* ------------------------------------------------------------ print sheet */
  var PW = 210, PH = 296.5;
  function buildSheet(srcs) {
    var lay = sheetLayout(), per = lay.cols * lay.rows;
    var mx = (PW - lay.cols * lay.cw - (lay.cols - 1) * lay.gx) / 2, my = (PH - lay.rows * lay.ch - (lay.rows - 1) * lay.gy) / 2;
    printRoot.textContent = '';
    for (var p = 0; p * per < srcs.length; p++) {
      var pg = el('div', { class: 'pg' }), marks = '';
      srcs.slice(p * per, p * per + per).forEach(function (src, i) {
        var c = i % lay.cols, r = Math.floor(i / lay.cols);
        var x = mx + c * (lay.cw + lay.gx), y = my + r * (lay.ch + lay.gy);
        var slot = el('div', { class: 'slot', style: { left: x + 'mm', top: y + 'mm', width: lay.cw + 'mm', height: lay.ch + 'mm' } }, el('img', { src: src, alt: '' }));
        pg.appendChild(slot);
        var lx = Math.min(3, lay.gx / 2 - 0.4), ly = Math.min(3, lay.gy / 2 - 0.4);
        [[x, y, -1, -1], [x + lay.cw, y, 1, -1], [x, y + lay.ch, -1, 1], [x + lay.cw, y + lay.ch, 1, 1]].forEach(function (k) {
          marks += 'M' + k[0] + ' ' + k[1] + 'h' + (k[2] * lx) + 'M' + k[0] + ' ' + k[1] + 'v' + (k[3] * ly);
        });
      });
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'marks'); svg.setAttribute('viewBox', '0 0 ' + PW + ' ' + PH);
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', marks); path.setAttribute('stroke', '#000'); path.setAttribute('stroke-width', '0.18'); path.setAttribute('fill', 'none');
      svg.appendChild(path); pg.appendChild(svg);
      printRoot.appendChild(pg);
    }
    printRoot.dataset.cards = srcs.length; printRoot.dataset.per = per;
  }
  function freeUrls() { blobUrls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) { } }); blobUrls = []; }
  function toUrl(canvas) {
    return new Promise(function (res) {
      if (!canvas.toBlob) return res(canvas.toDataURL('image/png'));
      canvas.toBlob(function (b) { if (!b) return res(canvas.toDataURL('image/png')); var u = URL.createObjectURL(b); blobUrls.push(u); res(u); }, 'image/png');
    });
  }
  function preparePrint() {
    var list = printList(), o = drawOpts(1.2), c = document.createElement('canvas'), srcs = [], cache = null, i = 0;
    delete printRoot.dataset.ready;
    freeUrls();
    function step() {
      if (i >= list.length) return Promise.resolve();
      $('#sheetInfo').textContent = t('preparing', { n: EDU.fmt(i + 1), total: EDU.fmt(list.length) });
      var d = list[i], same = i > 0 && list[i - 1] === d;
      if (same) { srcs.push(cache); i++; return step(); }
      drawCard(c, d, o);
      return toUrl(c).then(function (u) { cache = u; srcs.push(u); i++; return step(); });
    }
    return step().then(function () {
      buildSheet(srcs);
      return Promise.all($$('img', printRoot).map(function (im) { return im.decode ? im.decode().catch(function () { }) : null; }));
    }).then(function () { printRoot.dataset.ready = String(srcs.length); printFresh = true; });
  }
  $('#btnPrint').addEventListener('click', function () {
    if (busy || !currentCards().length) return;
    busy = true; $('#btnPrint').disabled = true;
    preparePrint().then(function () {
      busy = false; render(); printFresh = true;
      window.print();
    }, function () { busy = false; render(); });
  });
  /* Ctrl+P / the browser menu: build the same sheet straight away */
  window.addEventListener('beforeprint', function () {
    if (printFresh) return;
    var o = drawOpts(1.2), c = document.createElement('canvas'), last = null, lastUrl = '';
    freeUrls();
    buildSheet(printList().map(function (d) {
      if (d === last) return lastUrl;
      drawCard(c, d, o); last = d; lastUrl = c.toDataURL('image/png');
      return lastUrl;
    }));
  });

  /* ------------------------------------------------------------ images */
  function fileToImage(file, maxSide, jpeg) {
    return new Promise(function (res, rej) {
      if (!file) return rej(new Error('none'));
      if (file.type && !/^image\//.test(file.type)) return rej(new Error('type'));
      var r = new FileReader();
      r.onerror = function () { rej(new Error('read')); };
      r.onload = function () {
        var im = new Image();
        im.onerror = function () { rej(new Error('decode')); };
        im.onload = function () {
          var w = im.naturalWidth, h = im.naturalHeight;
          if (!w || !h) return rej(new Error('size'));
          var k = Math.min(1, maxSide / Math.max(w, h)), c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
          var g = c.getContext('2d');
          if (jpeg) { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); }
          g.drawImage(im, 0, 0, c.width, c.height);
          var url;
          try { url = jpeg ? c.toDataURL('image/jpeg', 0.86) : c.toDataURL('image/png'); } catch (e) { return rej(e); }
          urlToImage(url).then(function (out) { res({ url: url, img: out }); }, rej);
        };
        im.src = String(r.result);
      };
      r.readAsDataURL(file);
    });
  }
  function urlToImage(url) {
    return new Promise(function (res, rej) {
      if (!url || !/^data:image\//.test(url)) return rej(new Error('bad'));
      var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { rej(new Error('decode')); }; im.src = url;
    });
  }
  function keep(key, url) { if (!store.set(key, url)) EDU.toast(t('img_not_saved')); }

  $('#logoAdd').addEventListener('click', function () {
    EDU.pickFile('image/*').then(function (f) {
      if (!f) return;
      fileToImage(f, 320, false).then(function (r) { logoImg = r.img; logoUrl = r.url; keep('logo', r.url); render(); }, function () { EDU.toast(t('bad_image')); });
    });
  });
  $('#logoRemove').addEventListener('click', function () { logoImg = null; logoUrl = ''; store.remove('logo'); render(); });
  $('#photoAdd').addEventListener('click', function () {
    EDU.pickFile('image/*').then(function (f) {
      if (!f) return;
      fileToImage(f, 720, true).then(function (r) {
        photoImg = r.img; photoUrl = r.url; state.pz = 1; state.px = 0; state.py = 0; syncInputs(); keep('photo', r.url); save(); render();
      }, function () { EDU.toast(t('bad_image')); });
    });
  });
  $('#photoRemove').addEventListener('click', function () { photoImg = null; photoUrl = ''; store.remove('photo'); render(); });
  $('#photosAdd').addEventListener('click', function () {
    var inp = el('input', { type: 'file', accept: 'image/*', multiple: true, style: { display: 'none' } });
    inp.addEventListener('change', function () {
      var files = Array.prototype.slice.call(inp.files || [], 0, MAX_CARDS), bad = 0, i = 0;
      inp.remove();
      (function next() {
        if (i >= files.length) { if (bad) EDU.toast(t('bad_image')); render(); return; }
        var f = files[i++], key = norm(String(f.name).replace(/\.[^.]*$/, '')).toLowerCase();
        fileToImage(f, 600, true).then(function (r) { if (key) batchPhotos[key] = r.img; }, function () { bad++; }).then(next);
      })();
    });
    document.body.appendChild(inp); inp.click();
  });

  /* ------------------------------------------------------------ inputs */
  var BIND = { fOrg: 'org', fValid: 'valid', fContact: 'contact', fAddress: 'address', fName: 'name', fClass: 'cls', fId: 'id', fBlood: 'blood', csv: 'csv', pZoom: 'pz', pX: 'px', pY: 'py', copies: 'copies' };
  function syncInputs() {
    Object.keys(BIND).forEach(function (id) { var v = state[BIND[id]]; $('#' + id).value = v == null ? '' : v; });
    $('#qrOn').checked = !!state.qr;
  }
  Object.keys(BIND).forEach(function (id) {
    var n = $('#' + id);
    n.addEventListener('input', function () { state[BIND[id]] = n.value; schedule(); });
    n.addEventListener('change', function () { state[BIND[id]] = n.value; schedule(); });
  });
  $('#copies').addEventListener('blur', function () { state.copies = EDU.clamp(Math.round(+state.copies) || 1, 1, 100); $('#copies').value = state.copies; schedule(); });
  $('#qrOn').addEventListener('change', function () { state.qr = $('#qrOn').checked; save(); render(); });
  $$('[data-type]').forEach(function (b) { b.addEventListener('click', function () { state.type = b.dataset.type; save(); render(); }); });
  $$('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { state.mode = b.dataset.mode; sel = 0; save(); render(); }); });
  $$('[data-orient]').forEach(function (b) { b.addEventListener('click', function () { state.orient = b.dataset.orient; save(); render(); }); });
  THEMES.forEach(function (th, i) {
    $('#swatches').appendChild(el('button', { type: 'button', class: 'sw', style: { background: th.c }, onclick: function () { state.theme = i; save(); render(); } }));
  });

  $('#csvOpen').addEventListener('click', function () {
    EDU.pickFile('.csv,.tsv,.txt,text/csv,text/plain').then(function (f) {
      if (!f) return;
      if (f.size > 2 * 1024 * 1024 || /^(image|audio|video)\//.test(f.type || '')) { EDU.toast(t('bad_csv')); return; }
      EDU.readText(f).then(function (txt) {
        if (/\u0000/.test(txt)) { EDU.toast(t('bad_csv')); return; }
        state.csv = txt; sel = 0; syncInputs(); save(); render();
      }, function () { EDU.toast(t('bad_csv')); });
    });
  });
  $('#csvSample').addEventListener('click', function () { EDU.download('id-cards-sample.csv', '﻿' + sampleCsv().replace(/\n/g, '\r\n'), 'text/csv'); });

  $('#btnPng').addEventListener('click', function () {
    var d = currentCards()[sel]; if (!d) return;
    var c = document.createElement('canvas');
    drawCard(c, d, drawOpts(1.2));
    var base = (d.id || d.name || 'card').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'card';
    EDU.downloadCanvas(c, 'id-card-' + base + '.png');
  });

  $('#btnReset').addEventListener('click', function () {
    if (!window.confirm(t('confirm_reset'))) return;
    store.remove('state'); store.remove('logo'); store.remove('photo');
    state = Object.assign({}, DEF); logoImg = photoImg = null; logoUrl = photoUrl = ''; batchPhotos = {}; sel = 0;
    syncInputs(); render();
  });

  /* ------------------------------------------------------------ start */
  syncInputs();
  render();
  EDU.onLang(render);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render, function () { });
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', schedule);   // web fonts arrive after the first draw
  urlToImage(store.get('logo', '')).then(function (im) { logoImg = im; logoUrl = im.src; render(); }, function () { });
  urlToImage(store.get('photo', '')).then(function (im) { photoImg = im; photoUrl = im.src; render(); }, function () { });
})();
