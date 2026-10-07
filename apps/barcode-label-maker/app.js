/* Barcode & MRP Label Maker: EAN-13 / Code 128 product labels for shops and small brands.
   Encoders: barcode.js (window.BARCODE) and qr.js (window.QRGen), both offline, no library.
   Labels are laid out in real millimetres so a sheet prints at true size (print at 100%).
   Everything stays on this device (EDU.store); CSV files are read in the browser, never uploaded. */
(function () {
  'use strict';
  var SLUG = 'barcode-label-maker';
  var store = EDU.store(SLUG);
  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;
  var B = window.BARCODE, Q = window.QRGen;
  var PX_MM = 96 / 25.4;

  /* sheet presets, all in mm */
  var PRESETS = {
    a4_65: { page: 'a4', pageW: 210, pageH: 297, w: 38.1, h: 21.2, cols: 5, rows: 13, top: 10.7, left: 4.67, gx: 2.54, gy: 0 },
    a4_24: { page: 'a4', pageW: 210, pageH: 297, w: 70, h: 37, cols: 3, rows: 8, top: 0.5, left: 0, gx: 0, gy: 0 },
    roll: { page: 'roll', pageW: 102, pageH: 25, w: 50, h: 25, cols: 2, rows: 1, top: 0, left: 0, gx: 2, gy: 0 }
  };
  var CUSTOM_DEF = { page: 'a4', w: 48.5, h: 25.4, cols: 4, rows: 10, top: 21.5, left: 8, gx: 0, gy: 0 };

  function sampleItems() {
    return [
      { id: uid(), type: 'auto', code: '890123456789', name: 'Basmati Rice Premium', mrp: '145', qty: '1 kg', batch: 'B-2610', copies: 10 },
      { id: uid(), type: 'auto', code: 'MT-250-ELAICHI', name: 'Masala Tea Elaichi', mrp: '120', qty: '250 g', batch: 'T-118', copies: 5 }
    ];
  }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function blankItem() { return { id: '', type: 'auto', code: '', name: '', mrp: '', qty: '', batch: '', copies: 1 }; }

  /* ---------------- state ---------------- */
  var S = load();
  function load() {
    var g = store.get('state', null);
    var def = {
      cur: { id: '', type: 'auto', code: '890123456789', name: 'Basmati Rice Premium', mrp: '145', qty: '1 kg', batch: 'B-2610', copies: 1 },
      editing: '',
      items: sampleItems(),
      common: { pkd: '', bb: '', fssai: '', mfd: '', qr: '', incl: true },
      ll: 'en',
      sheet: { preset: 'a4_65', custom: Object.assign({}, CUSTOM_DEF), offX: 0, offY: 0, skip: 0, border: false }
    };
    if (!g || typeof g !== 'object') return def;
    var s = def;
    if (g.cur && typeof g.cur === 'object') s.cur = cleanItem(g.cur);
    if (Array.isArray(g.items)) s.items = g.items.slice(0, 2000).map(cleanItem);
    if (g.common && typeof g.common === 'object') ['pkd', 'bb', 'fssai', 'mfd', 'qr'].forEach(function (k) { s.common[k] = String(g.common[k] || '').slice(0, 300); });
    if (g.common && typeof g.common.incl === 'boolean') s.common.incl = g.common.incl;
    s.ll = g.ll === 'ui' ? 'ui' : 'en';
    if (g.sheet && typeof g.sheet === 'object') {
      if (PRESETS[g.sheet.preset] || g.sheet.preset === 'custom') s.sheet.preset = g.sheet.preset;
      if (g.sheet.custom && typeof g.sheet.custom === 'object') Object.keys(CUSTOM_DEF).forEach(function (k) { if (k === 'page') s.sheet.custom.page = g.sheet.custom.page === 'roll' ? 'roll' : 'a4'; else if (isFinite(+g.sheet.custom[k])) s.sheet.custom[k] = +g.sheet.custom[k]; });
      s.sheet.offX = num(g.sheet.offX, -15, 15, 0); s.sheet.offY = num(g.sheet.offY, -15, 15, 0);
      s.sheet.skip = Math.round(num(g.sheet.skip, 0, 500, 0)); s.sheet.border = !!g.sheet.border;
    }
    s.editing = (g.editing && s.items.some(function (x) { return x.id === g.editing; })) ? g.editing : '';
    return s;
  }
  function cleanItem(x) {
    var it = blankItem();
    it.id = String(x.id || uid());
    it.type = ['auto', 'ean13', 'code128'].indexOf(x.type) >= 0 ? x.type : 'auto';
    ['code', 'name', 'mrp', 'qty', 'batch'].forEach(function (k) { it[k] = String(x[k] == null ? '' : x[k]).slice(0, k === 'name' ? 80 : 60); });
    it.copies = Math.round(num(x.copies, 1, 2000, 1));
    return it;
  }
  function num(v, lo, hi, d) { v = parseFloat(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
  function save() { store.set('state', S); }

  /* ---------------- barcode of one item ---------------- */
  function resolve(item) {
    var code = String(item.code || '');
    var kind = item.type;
    if (kind === 'auto') kind = /^\d{12,13}$/.test(code.replace(/[\s-]/g, '')) ? 'ean13' : 'code128';
    var res = kind === 'ean13' ? B.ean13(code) : B.code128(code.trim());
    var q = kind === 'ean13' ? [11, 7] : [10, 10];
    return { kind: kind, res: res, quiet: q, modules: res.ok ? res.bits.length + q[0] + q[1] : 0,
      human: res.ok ? (kind === 'ean13' ? res.groups.join(' ') : code.trim()) : '' };
  }
  function codeError(r) {
    var e = r.res.error;
    if (r.kind === 'ean13') {
      if (e === 'empty') return t('err_empty');
      if (e === 'digits') return t('err_ean_digits');
      if (e === 'length') return t('err_ean_length');
      if (e === 'check') return t('err_ean_check', { d: String(r.res.check) });
    } else {
      if (e === 'empty') return t('err_empty');
      if (e === 'chars') return t('err_c128_chars');
      if (e === 'long') return t('err_c128_long');
    }
    return '';
  }

  /* ---------------- label words (English or the page language) ---------------- */
  function L(key, vars) {
    if (S.ll === 'ui') return t(key, vars);
    var v = (window.APP_STRINGS.en || {})[key] || key;
    if (vars) v = v.replace(/\{(\w+)\}/g, function (m, x) { return vars[x] !== undefined ? vars[x] : m; });
    return v;
  }
  function money(v) {
    var x = parseFloat(String(v).replace(/[,₹\s]/g, ''));
    if (!isFinite(x) || x < 0) return '';
    return '₹' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);
  }
  function monthText(v) { var m = /^(\d{4})-(\d{2})$/.exec(v || ''); return m ? m[2] + '/' + m[1] : ''; }

  /* ---------------- SVG helpers ---------------- */
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function barsSvg(r) {
    var s = svgEl('svg', { class: 'l-bars', viewBox: '0 0 ' + r.modules + ' 10', preserveAspectRatio: 'none', 'shape-rendering': 'crispEdges', role: 'img', 'aria-label': (r.kind === 'ean13' ? 'EAN-13 ' : 'Code 128 ') + r.human });
    s.setAttribute('data-bits', r.res.bits);
    s.setAttribute('data-q', r.quiet[0]);
    s.setAttribute('data-modules', r.modules);
    if (r.kind === 'code128') s.setAttribute('data-values', r.res.values.concat([r.res.check, 106]).join(','));
    var d = '';
    B.toBars(r.res.bits).forEach(function (b) { d += 'M' + (b.x + r.quiet[0]) + ' 0h' + b.w + 'v10h-' + b.w + 'z'; });
    s.appendChild(svgEl('path', { d: d, fill: '#000' }));
    return s;
  }
  function qrData(text) {
    if (!text || !Q) return null;
    var q = Q.encode(text, 'M');
    return q && q.ok ? q : null;
  }
  function qrSvg(q, sizeMM) {
    var n = q.size + 2;
    var s = svgEl('svg', { class: 'l-qr', viewBox: '0 0 ' + n + ' ' + n, width: sizeMM + 'mm', height: sizeMM + 'mm', 'shape-rendering': 'crispEdges', 'aria-hidden': 'true' });
    var d = '';
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.modules[y][x]) d += 'M' + (x + 1) + ' ' + (y + 1) + 'h1v1h-1z';
    s.appendChild(svgEl('rect', { width: n, height: n, fill: '#fff' }));
    s.appendChild(svgEl('path', { d: d, fill: '#000' }));
    s.setAttribute('data-n', n);
    return s;
  }

  /* ---------------- one label (real size in mm) ---------------- */
  function labelGeom(w, h) {
    var pad = Math.max(0.8, Math.min(2.2, h * 0.05));
    var fs = Math.max(1.75, Math.min(3.4, h * 0.1));
    return { w: w, h: h, pad: pad, fs: fs };
  }
  function makeLabel(item, w, h, qr, opts) {
    opts = opts || {};
    var g = labelGeom(w, h), c = S.common, r = resolve(item);
    var lbl = el('div', { class: 'lbl no-i18n' + (opts.outline ? ' outline' : ''), dir: S.ll === 'ui' ? (document.documentElement.dir || 'ltr') : 'ltr', lang: S.ll === 'ui' ? EDU.lang : 'en',
      style: { width: w + 'mm', height: h + 'mm', padding: g.pad + 'mm', fontSize: g.fs + 'mm' } });
    var main = el('div', { class: 'l-main' });
    if (item.name.trim()) main.appendChild(el('div', { class: 'tx l-name', text: item.name.trim() }));
    var m = money(item.mrp);
    if (m) main.appendChild(el('div', { class: 'l-line' }, el('span', { class: 'tx l-mrp', text: L('lb_mrp') + ' ' + m }), c.incl ? el('span', { class: 'tx l-incl', text: L('lb_incl') }) : null));
    if (item.qty.trim()) main.appendChild(el('div', { class: 'tx l-qty', text: L('lb_qty') + ': ' + item.qty.trim() }));
    if (r.res.ok) {
      main.appendChild(barsSvg(r));
      main.appendChild(el('div', { class: 'tx l-hr', text: r.human }));
    } else {
      main.appendChild(el('div', { class: 'l-bars', style: { display: 'grid', placeItems: 'center', border: '.3mm dashed #c00', color: '#c00', fontSize: '.8em', textAlign: 'center' }, text: '⚠' }));
    }
    var small = [];
    if (item.batch.trim()) small.push(L('lb_batch') + ': ' + item.batch.trim());
    if (monthText(c.pkd)) small.push(L('lb_pkd') + ': ' + monthText(c.pkd));
    if (small.length) main.appendChild(el('div', { class: 'tx l-sm', text: small.join(' · ') }));
    if (c.bb.trim()) main.appendChild(el('div', { class: 'tx l-sm', text: L('lb_bb') + ': ' + c.bb.trim() }));
    if (c.fssai.trim()) main.appendChild(el('div', { class: 'tx l-sm', text: L('lb_fssai') + ': ' + c.fssai.trim() }));
    if (c.mfd.trim()) main.appendChild(el('div', { class: 'tx l-sm', text: L('lb_mfd') + ': ' + c.mfd.trim() }));
    lbl.appendChild(main);
    if (qr) {
      var qs = Math.min(h - 2 * g.pad, (w - 2 * g.pad) * 0.34);
      if (qs >= 8) lbl.appendChild(qrSvg(qr, Math.round(qs * 10) / 10));
    }
    lbl._r = r;
    return lbl;
  }

  /* ---------------- sheet geometry ---------------- */
  function geom() {
    var p = S.sheet.preset;
    if (PRESETS[p]) return Object.assign({ id: p }, PRESETS[p]);
    var c = S.sheet.custom;
    var g = { id: 'custom', page: c.page, w: num(c.w, 10, 200, 40), h: num(c.h, 8, 280, 25), cols: Math.round(num(c.cols, 1, 12, 1)), rows: Math.round(num(c.rows, 1, 40, 1)),
      top: num(c.top, 0, 60, 0), left: num(c.left, 0, 60, 0), gx: num(c.gx, 0, 30, 0), gy: num(c.gy, 0, 30, 0) };
    if (g.page === 'roll') {
      g.rows = 1;
      g.pageW = Math.round((g.left * 2 + g.cols * g.w + (g.cols - 1) * g.gx) * 10) / 10;
      g.pageH = Math.round((g.top * 2 + g.h) * 10) / 10;
    } else { g.pageW = 210; g.pageH = 297; }
    return g;
  }
  function perPage(g) { return g.cols * g.rows; }

  /* ---------------- editor ---------------- */
  var F = { code: $('#f-code'), name: $('#f-name'), mrp: $('#f-mrp'), qty: $('#f-qty'), batch: $('#f-batch'), copies: $('#f-copies') };
  function fillEditor() {
    var c = S.cur;
    F.code.value = c.code; F.name.value = c.name; F.mrp.value = c.mrp; F.qty.value = c.qty; F.batch.value = c.batch; F.copies.value = c.copies;
    $$('[data-type]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-type') === c.type ? 'true' : 'false'); });
  }
  ['code', 'name', 'mrp', 'qty', 'batch'].forEach(function (k) {
    F[k].addEventListener('input', function () { S.cur[k] = F[k].value; save(); renderEditor(); renderPreview(); });
  });
  F.copies.addEventListener('input', function () { S.cur.copies = Math.round(num(F.copies.value, 1, 2000, 1)); save(); });
  F.copies.addEventListener('change', function () { F.copies.value = S.cur.copies; });
  $$('[data-type]').forEach(function (b) {
    b.addEventListener('click', function () { S.cur.type = b.getAttribute('data-type'); save(); fillEditor(); renderEditor(); renderPreview(); });
  });

  function renderEditor() {
    var r = resolve(S.cur), box = $('#codeStatus');
    box.innerHTML = '';
    var ok = r.res.ok;
    box.setAttribute('data-ok', ok ? '1' : '0');
    box.setAttribute('data-kind', r.kind);
    box.setAttribute('data-full', ok && r.kind === 'ean13' ? r.res.code : '');
    box.setAttribute('data-check', r.kind === 'ean13' && r.res.check >= 0 ? String(r.res.check) : '');
    if (ok) {
      var kindName = r.kind === 'ean13' ? 'EAN-13' : 'Code 128';
      var p = el('div', { class: 'callout success small' });
      if (r.kind === 'ean13') {
        var digits = String(S.cur.code).replace(/[\s-]/g, '');
        p.appendChild(el('div', null, el('strong', { text: kindName + ' ✓ ' }),
          el('span', { text: t(digits.length === 12 ? 'ean_added' : 'ean_valid', { d: String(r.res.check) }) + ' ' }),
          el('span', { class: 'full no-i18n', text: r.res.code })));
        if (/^890/.test(r.res.code)) p.appendChild(el('div', { class: 'muted', text: t('ean_890') }));
      } else {
        p.appendChild(el('div', null, el('strong', { text: kindName + ' ✓ ' }), el('span', { text: t('c128_ok', { n: String(r.res.values.length + 2) }) })));
        if (S.cur.type === 'auto') p.appendChild(el('div', { class: 'muted', text: t('auto_c128') }));
      }
      box.appendChild(p);
    } else {
      box.appendChild(el('div', { class: 'callout danger small', id: 'codeErr', text: '⚠ ' + codeError(r) }));
    }
    $('#btnAdd').disabled = !ok; $('#btnFill').disabled = !ok; $('#btnUpdate').disabled = !ok;
    var editing = !!S.editing;
    $('#btnAdd').hidden = editing; $('#btnFill').hidden = editing;
    $('#btnUpdate').hidden = !editing; $('#btnCancelEdit').hidden = !editing;
    $('#editNote').hidden = !editing;
    if (editing) $('#editNote').textContent = t('editing_note');
  }

  function addItem(copies) {
    var it = cleanItem(Object.assign({}, S.cur, { id: uid(), copies: copies || S.cur.copies }));
    S.items.push(it);
    save(); renderSheet();
    EDU.toast(t('added_n', { n: EDU.fmt(it.copies) }));
  }
  $('#btnAdd').addEventListener('click', function () { addItem(); });
  $('#btnFill').addEventListener('click', function () {
    var g = geom(), pp = perPage(g), used = S.sheet.skip + totalLabels();
    var left = pp - (used % pp);
    addItem(left);
  });
  $('#btnUpdate').addEventListener('click', function () {
    var i = S.items.findIndex(function (x) { return x.id === S.editing; });
    if (i >= 0) S.items[i] = cleanItem(Object.assign({}, S.cur, { id: S.editing }));
    S.editing = ''; save(); renderEditor(); renderSheet();
    EDU.toast(t('saved_local'));
  });
  $('#btnCancelEdit').addEventListener('click', function () { S.editing = ''; save(); renderEditor(); });

  /* ---------------- common fields ---------------- */
  var CF = { pkd: $('#f-pkd'), bb: $('#f-bb'), fssai: $('#f-fssai'), mfd: $('#f-mfd'), qr: $('#f-qr') };
  function fillCommon() {
    Object.keys(CF).forEach(function (k) { CF[k].value = S.common[k]; });
    $('#f-incl').checked = !!S.common.incl;
    $$('[data-ll]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-ll') === S.ll ? 'true' : 'false'); });
    fssaiCheck();
  }
  function fssaiCheck() { var v = S.common.fssai.replace(/\s/g, ''); $('#fssaiWarn').hidden = !v || /^\d{14}$/.test(v); }
  Object.keys(CF).forEach(function (k) {
    CF[k].addEventListener('input', function () { S.common[k] = CF[k].value; save(); fssaiCheck(); renderPreview(); renderSheetSoon(); });
  });
  $('#f-incl').addEventListener('change', function () { S.common.incl = $('#f-incl').checked; save(); renderPreview(); renderSheetSoon(); });
  $$('[data-ll]').forEach(function (b) {
    b.addEventListener('click', function () { S.ll = b.getAttribute('data-ll'); save(); fillCommon(); renderPreview(); renderSheet(); });
  });

  /* ---------------- preview of one label ---------------- */
  var lastQr = { text: null, q: null };
  function curQr() {
    var txt = S.common.qr.trim();
    if (txt !== lastQr.text) { lastQr = { text: txt, q: qrData(txt) }; }
    return lastQr.q;
  }
  function renderPreview() {
    var g = geom(), box = $('#labelPreview');
    var lbl = makeLabel(S.cur, g.w, g.h, curQr());
    box.innerHTML = '';
    box.appendChild(lbl);
    var avail = Math.max(180, Math.min(($('.lp-wrap').clientWidth || 320) - 28, 520));
    var s = Math.min(avail / (g.w * PX_MM), 300 / (g.h * PX_MM), 4);
    lbl.style.transform = 'scale(' + s + ')';
    box.style.width = (g.w * PX_MM * s) + 'px';
    box.style.height = (g.h * PX_MM * s) + 'px';
    box.setAttribute('data-scale', String(s));
    $('#labelSize').textContent = t('label_size', { w: fmtMM(g.w), h: fmtMM(g.h) });

    /* warnings: thin bars, too little room for the bars, QR too long */
    var warn = $('#labelWarn'); warn.innerHTML = '';
    var r = lbl._r;
    if (r.res.ok) {
      var qrW = lbl.querySelector('.l-qr') ? parseFloat(lbl.querySelector('.l-qr').getAttribute('width')) + 1 : 0;
      var barsW = g.w - 2 * labelGeom(g.w, g.h).pad - qrW;
      var mod = barsW / r.modules;
      lbl.setAttribute('data-module', mod.toFixed(3));
      if (mod < 0.19) warn.appendChild(el('p', { class: 'callout warning small mb0', id: 'warnThin', text: t('warn_thin', { m: mod.toFixed(2) }) }));
      var bars = lbl.querySelector('svg.l-bars');
      var bh = bars.getBoundingClientRect().height / s / PX_MM;
      lbl.setAttribute('data-bar-h', bh.toFixed(1));
      if (bh < 5) warn.appendChild(el('p', { class: 'callout warning small mb0', id: 'warnShort', text: t('warn_short') }));
    }
    if (S.common.qr.trim() && !curQr()) warn.appendChild(el('p', { class: 'callout warning small mb0', text: t('warn_qr_long') }));
    if (S.common.qr.trim() && curQr() && !lbl.querySelector('.l-qr')) warn.appendChild(el('p', { class: 'callout warning small mb0', text: t('warn_qr_small') }));
    $('#btnPng').disabled = !r.res.ok;
  }
  function fmtMM(v) { return EDU.fmt(Math.round(v * 10) / 10); }

  /* ---------------- items list ---------------- */
  function totalLabels() { var n = 0; S.items.forEach(function (it) { if (resolve(it).res.ok) n += it.copies; }); return n; }
  function renderItems() {
    var tb = $('#itemsBody'); tb.innerHTML = '';
    var bad = [];
    S.items.forEach(function (it, i) {
      var r = resolve(it), ok = r.res.ok;
      if (!ok) bad.push((it.name || it.code || '#' + (i + 1)) + ': ' + codeError(r));
      var cp = el('input', { type: 'number', class: 'copies', min: '1', max: '2000', step: '1', value: String(it.copies), 'aria-label': t('col_copies') });
      cp.addEventListener('input', function () { it.copies = Math.round(num(cp.value, 1, 2000, 1)); save(); renderSheetSoon(); });
      cp.addEventListener('change', function () { cp.value = it.copies; });
      tb.appendChild(el('tr', { class: ok ? '' : 'err', 'data-id': it.id },
        el('td', { class: 'nm no-i18n', text: it.name || '—' }),
        el('td', { class: 'code no-i18n' }, ok && r.kind === 'ean13' ? r.res.code : it.code, el('div', { class: 'tiny muted', text: ok ? (r.kind === 'ean13' ? 'EAN-13' : 'Code 128') : '⚠ ' + codeError(r) })),
        el('td', { class: 'no-i18n', text: money(it.mrp) || '—' }),
        el('td', null, cp),
        el('td', { class: 'acts' },
          el('button', { type: 'button', class: 'btn btn-sm', 'data-act': 'edit', title: t('edit'), 'aria-label': t('edit'), onclick: function () {
            S.cur = cleanItem(it); S.editing = it.id; save(); fillEditor(); renderEditor(); renderPreview();
            $('#productCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); F.code.focus({ preventScroll: true });
          } }, '✏️'),
          el('button', { type: 'button', class: 'btn btn-sm', 'data-act': 'del', title: t('delete'), 'aria-label': t('delete'), onclick: function () {
            S.items = S.items.filter(function (x) { return x.id !== it.id; });
            if (S.editing === it.id) S.editing = '';
            save(); renderEditor(); renderSheet();
          } }, '🗑️'))));
    });
    $('#itemsEmpty').hidden = S.items.length > 0;
    $('#itemsErr').hidden = !bad.length;
    $('#itemsErr').textContent = bad.length ? t('items_skipped', { n: EDU.fmt(bad.length) }) + ' ' + bad.slice(0, 4).join(' · ') : '';
  }

  /* ---------------- sheet pages ---------------- */
  var sheetTimer = null;
  function renderSheetSoon() { clearTimeout(sheetTimer); sheetTimer = setTimeout(renderSheet, 150); }
  function renderSheet() {
    clearTimeout(sheetTimer);
    renderItems();
    var g = geom(), pp = perPage(g), sh = S.sheet;
    $$('[data-preset]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-preset') === sh.preset ? 'true' : 'false'); });
    $('#customBox').hidden = sh.preset !== 'custom';
    $('#pageRule').textContent = '@page { size: ' + g.pageW + 'mm ' + g.pageH + 'mm; margin: 0; }';

    /* does it fit on the page? */
    var usedW = g.left + g.cols * g.w + (g.cols - 1) * g.gx, usedH = g.top + g.rows * g.h + (g.rows - 1) * g.gy;
    var fw = $('#fitWarn');
    fw.hidden = !(usedW > g.pageW + 0.5 || usedH > g.pageH + 0.5);
    if (!fw.hidden) fw.textContent = t('warn_fit', { w: fmtMM(usedW), h: fmtMM(usedH), pw: fmtMM(g.pageW), ph: fmtMM(g.pageH) });

    /* list of labels to print */
    var list = [];
    S.items.forEach(function (it) { if (resolve(it).res.ok) for (var k = 0; k < it.copies; k++) list.push(it); });
    var skip = Math.min(sh.skip, pp - 1);
    var slots = skip + list.length;
    var pages = list.length ? Math.ceil(slots / pp) : 0;
    var box = $('#sheetPages'); box.innerHTML = '';
    $('#sheetInfo').textContent = list.length ? t(pages === 1 ? 'sheet_info_one' : 'sheet_info', { n: EDU.fmt(list.length), p: EDU.fmt(pages), per: EDU.fmt(pp) }) : t('sheet_info_none');
    $('#sheetInfo').setAttribute('data-labels', String(list.length));
    $('#sheetInfo').setAttribute('data-pages', String(pages));
    $('#sheetInfo').setAttribute('data-per', String(pp));
    $('#btnPrint').disabled = !list.length;
    if (!list.length) return;

    var qr = curQr();
    var avail = Math.max(240, (box.clientWidth || 600) - 26);
    var s = Math.min(1, avail / (g.pageW * PX_MM));
    if (g.page === 'roll' || g.id === 'roll') s = Math.min(s, 2);
    var MAX_SHOW = 3, li = 0;
    /* identical labels are built once and cloned */
    var cache = {};
    for (var p = 0; p < pages; p++) {
      var frame = el('div', { class: 'page-frame' + (p >= MAX_SHOW ? ' more' : '') + (p === pages - 1 ? ' last' : ''), style: { width: (g.pageW * PX_MM * s) + 'px', height: (g.pageH * PX_MM * s) + 'px' } });
      var page = el('div', { class: 'page', style: { width: g.pageW + 'mm', height: g.pageH + 'mm', transform: 'scale(' + s + ')' } });
      for (var k = 0; k < pp; k++) {
        var slot = p * pp + k;
        var col = k % g.cols, row = Math.floor(k / g.cols);
        var x = g.left + col * (g.w + g.gx) + sh.offX, y = g.top + row * (g.h + g.gy) + sh.offY;
        if (slot < skip) {
          page.appendChild(el('div', { class: 'slot-skip', style: { left: x + 'mm', top: y + 'mm', width: g.w + 'mm', height: g.h + 'mm' } }));
          continue;
        }
        if (li >= list.length) break;
        var it = list[li++];
        if (!cache[it.id]) cache[it.id] = makeLabel(it, g.w, g.h, qr, { outline: true });
        var lb = cache[it.id].cloneNode(true);
        if (!sh.border) lb.classList.add('no-print-outline');
        lb.style.left = x + 'mm'; lb.style.top = y + 'mm';
        page.appendChild(lb);
      }
      frame.appendChild(page);
      box.appendChild(frame);
      if (p < MAX_SHOW) box.appendChild(el('div', { class: 'page-no', text: t('page_n', { n: EDU.fmt(p + 1), total: EDU.fmt(pages) }) }));
    }
    if (pages > MAX_SHOW) box.appendChild(el('p', { class: 'small muted mb0', text: t('more_pages', { n: EDU.fmt(pages - MAX_SHOW) }) }));
  }

  /* presets and custom size */
  $$('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () { S.sheet.preset = b.getAttribute('data-preset'); save(); fillSheetForm(); renderPreview(); renderSheet(); });
  });
  var CU = ['w', 'h', 'cols', 'rows', 'top', 'left', 'gx', 'gy'];
  function fillSheetForm() {
    var c = S.sheet.custom;
    CU.forEach(function (k) { $('#c-' + k).value = c[k]; });
    $('#c-page').value = c.page;
    $('#c-rows').disabled = c.page === 'roll';
    $('#o-x').value = S.sheet.offX; $('#o-y').value = S.sheet.offY; $('#o-skip').value = S.sheet.skip;
    $('#o-border').checked = !!S.sheet.border;
  }
  CU.forEach(function (k) {
    $('#c-' + k).addEventListener('input', function () {
      var v = parseFloat($('#c-' + k).value);
      if (!isFinite(v)) return;
      S.sheet.custom[k] = v; save(); renderPreview(); renderSheetSoon();
    });
  });
  $('#c-page').addEventListener('change', function () { S.sheet.custom.page = $('#c-page').value === 'roll' ? 'roll' : 'a4'; $('#c-rows').disabled = S.sheet.custom.page === 'roll'; save(); renderSheet(); });
  $('#o-x').addEventListener('input', function () { S.sheet.offX = num($('#o-x').value, -15, 15, 0); save(); renderSheetSoon(); });
  $('#o-y').addEventListener('input', function () { S.sheet.offY = num($('#o-y').value, -15, 15, 0); save(); renderSheetSoon(); });
  $('#o-skip').addEventListener('input', function () { S.sheet.skip = Math.round(num($('#o-skip').value, 0, 500, 0)); save(); renderSheetSoon(); });
  $('#o-border').addEventListener('change', function () { S.sheet.border = $('#o-border').checked; save(); renderSheet(); });

  /* ---------------- CSV ---------------- */
  var HEAD = { name: /^(name|product|item|naam|product name|item name)$/i, code: /^(code|barcode|ean|sku|gtin|ean13|ean-13)$/i, mrp: /^(mrp|price|rate|mrp \(₹\)|mrp \(rs\)|mrp rs)$/i,
    qty: /^(qty|quantity|net qty|net quantity|weight|size)$/i, batch: /^(batch|batch no|batch no\.|lot)$/i, copies: /^(copies|labels|count|no\. of labels|nos)$/i };
  function importRows(rows) {
    rows = rows.filter(function (r) { return r && r.some(function (v) { return String(v || '').trim(); }); });
    if (!rows.length) return 0;
    var map = { name: 0, code: 1, mrp: 2, qty: 3, batch: -1, copies: -1 };
    var head = rows[0].map(function (v) { return String(v || '').trim(); });
    var found = {};
    head.forEach(function (h, i) { Object.keys(HEAD).forEach(function (k) { if (HEAD[k].test(h) && found[k] === undefined) found[k] = i; }); });
    if (found.code !== undefined || found.name !== undefined) {
      map = { name: -1, code: -1, mrp: -1, qty: -1, batch: -1, copies: -1 };
      Object.keys(found).forEach(function (k) { map[k] = found[k]; });
      rows = rows.slice(1);
    }
    var n = 0;
    rows.slice(0, 2000).forEach(function (r) {
      function get(k) { return map[k] >= 0 ? String(r[map[k]] == null ? '' : r[map[k]]).trim().replace(/^'(?=[=+\-@\d])/, '') : ''; }
      var it = cleanItem({ type: 'auto', name: get('name'), code: get('code'), mrp: get('mrp').replace(/[₹,]|rs\.?/gi, '').trim(), qty: get('qty'), batch: get('batch'), copies: get('copies') || 1 });
      if (!it.code && !it.name) return;
      S.items.push(it); n++;
    });
    return n;
  }
  $('#btnImport').addEventListener('click', function () {
    EDU.pickFile('.csv,text/csv,text/plain').then(function (f) {
      if (!f) return;
      if (f.size > 2 * 1024 * 1024) { EDU.toast(t('csv_too_big')); return; }
      return EDU.readText(f).then(function (txt) {
        var n = importRows(EDU.csv.parse(String(txt).replace(/^﻿/, '')));
        save(); renderSheet();
        EDU.toast(n ? t('csv_done', { n: EDU.fmt(n) }) : t('csv_none'), 4000);
      });
    }).catch(function () { EDU.toast(t('csv_none')); });
  });
  $('#btnSampleCsv').addEventListener('click', function () {
    EDU.download('labels-sample.csv', EDU.csv.stringify([
      ['name', 'code', 'mrp', 'qty', 'batch', 'copies'],
      ['Basmati Rice Premium', '890123456789', '145', '1 kg', 'B-2610', '10'],
      ['Haldi Powder', '8901234567012', '45', '100 g', 'H-07', '5'],
      ['Masala Tea Elaichi', 'MT-250-ELAICHI', '120', '250 g', 'T-118', '5']
    ]), 'text/csv');
  });
  $('#btnClear').addEventListener('click', function () {
    if (!S.items.length || !confirm(t('confirm_clear'))) return;
    S.items = []; S.editing = ''; save(); renderEditor(); renderSheet();
  });

  /* ---------------- print ---------------- */
  $('#btnPrint').addEventListener('click', function () { renderSheet(); setTimeout(function () { try { window.print(); } catch (e) { } }, 60); });

  /* ---------------- PNG of one label at 300 dpi (layout measured from the real label) ---------------- */
  function labelPng() {
    var g = geom();
    var lbl = makeLabel(S.cur, g.w, g.h, curQr());
    var holder = el('div', { style: { position: 'fixed', left: '-10000px', top: '0', visibility: 'hidden' } }, lbl);
    document.body.appendChild(holder);
    var base = lbl.getBoundingClientRect();
    var k = (300 / 25.4) / (base.width / g.w);
    var cv = document.createElement('canvas');
    cv.width = Math.round(base.width * k); cv.height = Math.round(base.height * k);
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#000';
    $$('.tx', lbl).forEach(function (e) {
      var r = e.getBoundingClientRect(); if (!r.width) return;
      var cs = getComputedStyle(e);
      ctx.font = cs.fontWeight + ' ' + (parseFloat(cs.fontSize) * k) + 'px ' + cs.fontFamily;
      var rtl = cs.direction === 'rtl';
      ctx.direction = rtl ? 'rtl' : 'ltr';
      var align = cs.textAlign === 'center' ? 'center' : (rtl ? 'right' : 'left');
      ctx.textAlign = align; ctx.textBaseline = 'middle';
      var maxW = r.width * k, txt = e.textContent, tw = ctx.measureText(txt).width, sx = 1;
      if (e.scrollWidth > e.clientWidth + 1) {      // already cut with "…" on the label: cut it the same way
        while (txt.length > 1 && ctx.measureText(txt + '…').width > maxW) txt = txt.slice(0, -1);
        txt += '…';
      } else if (tw > maxW) sx = maxW / tw;          // canvas fonts measure a little wider: squeeze, never cut
      var x = align === 'center' ? (r.left + r.width / 2 - base.left) * k : (align === 'right' ? (r.right - base.left) * k : (r.left - base.left) * k);
      var yy = (r.top + r.height / 2 - base.top) * k;
      ctx.save(); ctx.translate(x, yy); ctx.scale(sx, 1); ctx.fillText(txt, 0, 0); ctx.restore();
    });
    var bars = lbl.querySelector('svg.l-bars');
    if (bars) {
      var br = bars.getBoundingClientRect(), mods = +bars.getAttribute('data-modules'), q = +bars.getAttribute('data-q');
      var mw = br.width * k / mods;
      B.toBars(bars.getAttribute('data-bits')).forEach(function (b) {
        ctx.fillRect(Math.round((br.left - base.left) * k + (b.x + q) * mw), Math.round((br.top - base.top) * k), Math.round(b.w * mw), Math.round(br.height * k));
      });
    }
    var qs = lbl.querySelector('svg.l-qr'), qd = curQr();
    if (qs && qd) {
      var qr = qs.getBoundingClientRect(), n = qd.size + 2, cell = qr.width * k / n;
      for (var y = 0; y < qd.size; y++) for (var x = 0; x < qd.size; x++) if (qd.modules[y][x])
        ctx.fillRect((qr.left - base.left) * k + (x + 1) * cell, (qr.top - base.top) * k + (y + 1) * cell, Math.ceil(cell), Math.ceil(cell));
    }
    holder.remove();
    return cv;
  }
  $('#btnPng').addEventListener('click', function () {
    var cv = labelPng();
    var name = (S.cur.name || 'label').trim().replace(/[^\wऀ-෿-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'label';
    EDU.downloadCanvas(cv, name + '.png');
  });

  /* ---------------- start ---------------- */
  function renderAll() { fillEditor(); fillCommon(); fillSheetForm(); renderEditor(); renderPreview(); renderSheet(); }
  EDU.onLang(renderAll);
  var rz = null;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { renderPreview(); renderSheet(); }, 200); });
  renderAll();
})();
