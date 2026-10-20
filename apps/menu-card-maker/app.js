/* Restaurant Menu Card Maker: menus, items with FSSAI veg / non-veg marks, 6 designs, print layouts (A4 one / two columns,
 * A5, table tent, "Scan for menu" poster), 1080 × 1920 story images, UPI Scan & Pay and WhatsApp-order QR codes.
 * Everything stays on the device: state in EDU.store('menu-card-maker'); the logo is stored as a small data URL. */
(function () {
  'use strict';
  var SLUG = 'menu-card-maker', store = EDU.store(SLUG), $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;
  var DESIGNS = ['classic', 'dhaba', 'cafe', 'royal', 'south', 'dark'];
  var LAYOUTS = ['a4-1', 'a4-2', 'a5', 'tent', 'story', 'poster'];
  var MAX_MENUS = 20, MAX_ITEMS = 300, MAX_CATS = 40;
  var SAMPLE = window.APP_SAMPLE, CONTENT = window.APP_CONTENT;

  /* ---------------- state ---------------- */
  var state = { menus: [], cur: '', tab: 'details' };
  function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
  function str(v, max) { return String(v == null ? '' : v).slice(0, max || 200); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^\d.]/g, '')); return isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0; }
  function cleanItem(it) {
    if (!it || typeof it !== 'object') return null;
    return { id: str(it.id, 20) || uid(), cat: str(it.cat, 20), name: str(it.name, 80), desc: str(it.desc, 160), price: num(it.price), half: num(it.half),
      veg: it.veg !== false && it.veg !== 0 && it.veg !== '0', spice: EDU.clamp(parseInt(it.spice, 10) || 0, 0, 3), chef: !!it.chef, best: !!it.best, out: !!it.out };
  }
  function cleanMenu(m) {
    if (!m || typeof m !== 'object') return null;
    var b = m.biz && typeof m.biz === 'object' ? m.biz : {};
    var cats = (Array.isArray(m.cats) ? m.cats : []).map(function (c) { return c && typeof c === 'object' ? { id: str(c.id, 20) || uid(), name: str(c.name, 60) } : null; }).filter(Boolean).slice(0, MAX_CATS);
    var ids = {}; cats.forEach(function (c) { ids[c.id] = 1; });
    var items = (Array.isArray(m.items) ? m.items : []).map(cleanItem).filter(function (it) { return it && ids[it.cat]; }).slice(0, MAX_ITEMS);
    var logo = typeof b.logo === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(b.logo) && b.logo.length < 400000 ? b.logo : '';
    return { id: str(m.id, 20) || uid(), name: str(m.name, 60) || t('menu_default_name'),
      biz: { name: str(b.name, 60), tagline: str(b.tagline, 90), logo: logo, phone: str(b.phone, 20), address: str(b.address, 120), fssai: str(b.fssai, 14).replace(/\D/g, ''),
        gst: !!b.gst, upi: str(b.upi, 80).trim(), waQr: !!b.waQr, link: str(b.link, 300).trim(), note: str(b.note, 120) },
      cats: cats, items: items, design: DESIGNS.indexOf(m.design) >= 0 ? m.design : 'classic', layout: LAYOUTS.indexOf(m.layout) >= 0 ? m.layout : 'a4-1' };
  }
  function sampleMenu(name) {
    var C = CONTENT[EDU.lang] || CONTENT.en, m = { id: uid(), name: name || t('menu_default_name'), biz: { name: C.biz.name, tagline: C.biz.tagline, address: C.biz.address, phone: '98765 43210', fssai: '', gst: true, upi: '', waQr: true, link: '', note: '', logo: '' },
      cats: [], items: [], design: 'classic', layout: 'a4-1' };
    fillSample(m);
    return cleanMenu(m);
  }
  function fillSample(m) {
    var C = CONTENT[EDU.lang] || CONTENT.en, map = {};
    m.cats = SAMPLE.cats.map(function (k) { var c = { id: uid(), name: C.cats[k] }; map[k] = c.id; return c; });
    m.items = SAMPLE.items.map(function (s, i) { var w = C.items[i] || CONTENT.en.items[i]; return { id: uid(), cat: map[s.cat], name: w.name, desc: w.desc, price: s.price, half: s.half, veg: !!s.veg, spice: s.spice, chef: !!s.chef, best: !!s.best, out: false }; });
  }
  function load() {
    var s = store.get('state', null);
    if (s && typeof s === 'object') {
      state.menus = (Array.isArray(s.menus) ? s.menus : []).map(cleanMenu).filter(Boolean).slice(0, MAX_MENUS);
      state.cur = str(s.cur, 20); state.tab = ['details', 'items', 'design'].indexOf(s.tab) >= 0 ? s.tab : 'details';
    }
    if (!state.menus.length) { state.menus = [sampleMenu()]; state.menus[0].sample = true; }
    if (!state.menus.some(function (m) { return m.id === state.cur; })) state.cur = state.menus[0].id;
  }
  function save() { store.set('state', state); }
  function cur() { for (var i = 0; i < state.menus.length; i++) if (state.menus[i].id === state.cur) return state.menus[i]; return state.menus[0]; }

  /* ---------------- helpers ---------------- */
  function isRtl() { return document.documentElement.dir === 'rtl'; }
  function fmtPrice(n) { return '₹' + EDU.fmt(n, { maximumFractionDigits: 2 }); }
  function phoneDigits(p) { var d = String(p || '').replace(/\D/g, ''); if (d.length === 10) d = '91' + d; if (d.length === 12 && d.slice(0, 2) === '91') return d; if (d.length === 11 && d[0] === '0') return '91' + d.slice(1); return d.length >= 8 ? d : ''; }
  function upiOk(u) { return /^[a-z0-9._-]{2,}@[a-z][a-z0-9.-]{1,}$/i.test(u); }
  function upiLink(m) { var b = m.biz; return 'upi://pay?pa=' + encodeURIComponent(b.upi) + '&pn=' + encodeURIComponent((b.name || 'Menu').slice(0, 40)) + '&cu=INR&tn=' + encodeURIComponent(t('upi_note', { name: b.name || '' }).slice(0, 50)); }
  function waLink(m) { var d = phoneDigits(m.biz.phone); return d ? 'https://wa.me/' + d + '?text=' + encodeURIComponent(t('wa_order_msg', { name: m.biz.name || '' })) : ''; }
  function liveCats(m) { return m.cats.map(function (c) { return { id: c.id, name: c.name, items: m.items.filter(function (it) { return it.cat === c.id && it.name.trim(); }) }; }); }
  function menuText(m, limitItems) {
    var lines = ['*' + (m.biz.name || t('m_menu')) + '*'];
    if (m.biz.tagline) lines.push('_' + m.biz.tagline + '_');
    var n = 0;
    liveCats(m).forEach(function (c) {
      if (!c.items.length) return;
      if (limitItems && n >= limitItems) return;
      lines.push('', '*' + c.name + '*');
      c.items.forEach(function (it) {
        if (limitItems && n >= limitItems) return; n++;
        var p = fmtPrice(it.price) + (it.half > 0 ? ' (' + t('m_half') + ' ' + fmtPrice(it.half) + ')' : '');
        lines.push((it.veg ? '🟢' : '🔺') + ' ' + it.name + (it.out ? ' (' + t('m_out') + ')' : '') + ' - ' + p);
      });
    });
    lines.push('');
    if (m.biz.gst) lines.push(t('m_gst_incl'));
    if (m.biz.phone) lines.push(t('m_call') + ': ' + m.biz.phone);
    if (m.biz.address) lines.push(m.biz.address);
    if (m.biz.fssai) lines.push(t('m_fssai') + ' ' + m.biz.fssai);
    if (m.biz.note) lines.push(m.biz.note);
    return lines.join('\n');
  }
  var qrCache = {};
  function qrFor(text, ecl) { if (!text) return null; var k = (ecl || 'M') + '|' + text; if (!qrCache[k]) { try { qrCache[k] = QRGen.encode(text, ecl || 'M'); } catch (e) { qrCache[k] = null; } } return qrCache[k]; }
  function qrSvg(q) {
    if (!q || !q.ok) return '';
    var n = q.size, m = 2, d = '';
    for (var y = 0; y < n; y++) { var x = 0; while (x < n) { if (q.modules[y][x]) { var x0 = x; while (x < n && q.modules[y][x]) x++; d += 'M' + (x0 + m) + ' ' + (y + m) + 'h' + (x - x0) + 'v1h-' + (x - x0) + 'z'; } else x++; } }
    var tot = n + 2 * m;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + tot + ' ' + tot + '" shape-rendering="crispEdges" role="img" aria-hidden="true"><rect width="' + tot + '" height="' + tot + '" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>';
  }
  var posterInfo = { trimmed: 0 };
  function posterQr(m) {
    posterInfo.trimmed = 0;
    if (m.biz.link && /^https?:\/\//i.test(m.biz.link)) return qrFor(m.biz.link, 'M');
    var total = m.items.filter(function (it) { return it.name.trim(); }).length, lim = total;
    while (lim > 0) { var q = qrFor(menuText(m, lim), 'L'); if (q && q.ok) { if (lim < total) posterInfo.trimmed = lim; return q; } lim = Math.floor(lim * 0.8); }
    var w = waLink(m); return w ? qrFor(w, 'M') : qrFor(m.biz.name || 'Menu', 'M');
  }
  function markSvg(veg) {
    var c = veg ? '#0a8f3c' : '#8b3a0e';
    return '<svg class="m-mark" viewBox="0 0 20 20" aria-label="' + EDU.esc(t(veg ? 'm_veg_legend' : 'm_nonveg_legend')) + '" role="img"><rect x="1" y="1" width="18" height="18" fill="#fff" stroke="' + c + '" stroke-width="2"/>' +
      (veg ? '<circle cx="10" cy="10" r="5.2" fill="' + c + '"/>' : '<path d="M10 4.2 L16 15.4 H4 Z" fill="' + c + '"/>') + '</svg>';
  }

  /* ---------------- init + shell ---------------- */
  load();
  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });
  var ui = {
    menuSel: $('#menuSel'), msg: $('#msg'), catList: $('#catList'), itemsStatus: $('#itemsStatus'), designList: $('#designList'), layoutSeg: $('#layoutSeg'), layoutHint: $('#layoutHint'),
    pvWrap: $('#pvWrap'), pvScale: $('#pvScale'), pvPages: $('#pvPages'), pageInfo: $('#pageInfo'), wa: $('#btnWa'), logoPrev: $('#logoPrev'), logoRm: $('#btnLogoRm'), pageSize: $('#page-size')
  };
  var logoImg = null, logoSrc = '';
  function msg(text, kind) { ui.msg.textContent = text || ''; ui.msg.className = 'msg callout small ' + (kind || ''); }

  /* ---------------- menus bar ---------------- */
  function renderMenuSel() {
    ui.menuSel.innerHTML = '';
    state.menus.forEach(function (m) { ui.menuSel.appendChild(el('option', { value: m.id, text: m.name + (m.sample ? ' (' + t('example') + ')' : '') })); });
    ui.menuSel.value = state.cur;
    $('#btnDelMenu').disabled = state.menus.length <= 1;
  }
  ui.menuSel.addEventListener('change', function () { state.cur = this.value; save(); renderAll(); });
  $('#btnNewMenu').addEventListener('click', function () {
    if (state.menus.length >= MAX_MENUS) { msg(t('menus_max'), 'warning'); return; }
    var name = prompt(t('ask_menu_name'), t('menu_default_name')); if (name === null) return;
    var m = cleanMenu({ id: uid(), name: name || t('menu_default_name'), biz: {}, cats: SAMPLE.cats.slice(0, 4).map(function (k) { return { id: uid(), name: (CONTENT[EDU.lang] || CONTENT.en).cats[k] }; }), items: [] });
    state.menus.push(m); state.cur = m.id; state.tab = 'details'; save(); renderAll();
  });
  $('#btnRenameMenu').addEventListener('click', function () { var m = cur(), name = prompt(t('ask_menu_name'), m.name); if (name === null || !name.trim()) return; m.name = str(name, 60); save(); renderMenuSel(); });
  $('#btnDupMenu').addEventListener('click', function () {
    if (state.menus.length >= MAX_MENUS) { msg(t('menus_max'), 'warning'); return; }
    var m = cleanMenu(JSON.parse(JSON.stringify(cur()))); m.id = uid(); m.name = (m.name + ' 2').slice(0, 60); delete m.sample;
    state.menus.push(m); state.cur = m.id; save(); renderAll();
  });
  $('#btnDelMenu').addEventListener('click', function () {
    var m = cur(); if (state.menus.length <= 1 || !confirm(t('confirm_del_menu', { name: m.name }))) return;
    state.menus = state.menus.filter(function (x) { return x !== m; }); state.cur = state.menus[0].id; save(); renderAll();
  });
  $('#btnSample').addEventListener('click', function () {
    var m = cur(); if (m.items.length && !confirm(t('confirm_sample'))) return;
    fillSample(m); var C = CONTENT[EDU.lang] || CONTENT.en;
    if (!m.biz.name) { m.biz.name = C.biz.name; m.biz.tagline = C.biz.tagline; m.biz.address = C.biz.address; }
    save(); renderAll();
  });
  $('#btnReset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state'); state = { menus: [], cur: '', tab: 'details' }; load(); save(); renderAll(); msg('');
  });
  /* CSV */
  $('#btnExportCsv').addEventListener('click', function () {
    var m = cur(), rows = [['name', 'category', 'price', 'veg', 'half price', 'description']];
    liveCats(m).forEach(function (c) { c.items.forEach(function (it) { rows.push([it.name, c.name, it.price, it.veg ? 'veg' : 'non-veg', it.half > 0 ? it.half : '', it.desc]); }); });
    EDU.download((m.biz.name || 'menu').replace(/[^\w\u0080-￿-]+/g, '_') + '-menu.csv', EDU.csv.stringify(rows), 'text/csv');
  });
  $('#btnImportCsv').addEventListener('click', function () {
    EDU.pickFile('.csv,text/csv,text/plain').then(function (f) { if (!f) return; return EDU.readText(f).then(function (txt) { var n = importCsv(cur(), txt); if (n) { save(); renderAll(); msg(t('csv_imported', { n: EDU.fmt(n) }), 'success'); } else msg(t('csv_bad'), 'danger'); }); }).catch(function () { msg(t('csv_bad'), 'danger'); });
  });
  function importCsv(m, text) {
    var rows = EDU.csv.parse(text); if (!rows.length) return 0;
    var head = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var col = { name: -1, cat: -1, price: -1, veg: -1, half: -1, desc: -1 };
    head.forEach(function (h, i) {
      if (col.name < 0 && /^(name|item|dish|item ?name)$/.test(h)) col.name = i;
      else if (col.cat < 0 && /^(category|cat|section|group)$/.test(h)) col.cat = i;
      else if (col.half < 0 && /half/.test(h)) col.half = i;
      else if (col.price < 0 && /^(price|rate|full|full ?price|amount|mrp)$/.test(h)) col.price = i;
      else if (col.veg < 0 && /^(veg|type|veg\/non-?veg|veg ?or ?non-?veg|nonveg|non-veg)$/.test(h)) col.veg = i;
      else if (col.desc < 0 && /^(desc|description|details|about)$/.test(h)) col.desc = i;
    });
    var hasHead = col.name >= 0 || col.price >= 0;
    if (!hasHead) { col = { name: 0, cat: 1, price: 2, veg: 3, half: 4, desc: 5 }; }
    var body = hasHead ? rows.slice(1) : rows, added = 0, catByName = {};
    m.cats.forEach(function (c) { catByName[c.name.trim().toLowerCase()] = c.id; });
    var newItems = [];
    body.forEach(function (r) {
      var name = str(r[col.name] || '', 80).trim(); if (!name) return;
      var p = col.price >= 0 ? num(r[col.price]) : 0;
      if (!hasHead && !isFinite(parseFloat(r[2]))) return;   // header-less files must have a number in column 3
      var catName = str(col.cat >= 0 ? r[col.cat] : '', 60).trim() || (m.cats[0] ? m.cats[0].name : t('new_cat_name'));
      var key = catName.toLowerCase(), cid = catByName[key];
      if (!cid) { if (m.cats.length >= MAX_CATS) cid = m.cats[0].id; else { var c = { id: uid(), name: catName }; m.cats.push(c); cid = c.id; catByName[key] = cid; } }
      var vegRaw = String(col.veg >= 0 ? r[col.veg] : 'veg').trim().toLowerCase();
      var veg = !/^(non|n$|no$|0$|nonveg|non-veg|non veg|false|egg|chicken|mutton|fish)/.test(vegRaw);
      newItems.push(cleanItem({ id: uid(), cat: cid, name: name, desc: col.desc >= 0 ? r[col.desc] : '', price: p, half: col.half >= 0 ? num(r[col.half]) : 0, veg: veg }));
      added++;
    });
    if (!added) return 0;
    m.items = m.items.concat(newItems).slice(0, MAX_ITEMS);
    return added;
  }

  /* ---------------- tabs ---------------- */
  $$('.tabs [role="tab"]').forEach(function (b, i, all) {
    b.addEventListener('click', function () { state.tab = b.id.replace('tab-', ''); save(); renderTabs(); });
    b.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); var n = all[(i + d + all.length) % all.length]; n.focus(); n.click(); });
  });
  function renderTabs() {
    $$('.tabs [role="tab"]').forEach(function (b) { var on = b.id === 'tab-' + state.tab; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; $('#panel-' + b.id.replace('tab-', '')).hidden = !on; });
  }

  /* ---------------- details ---------------- */
  var fields = { fBiz: 'name', fTag: 'tagline', fPhone: 'phone', fAddr: 'address', fFssai: 'fssai', fUpi: 'upi', fLink: 'link', fNote: 'note' };
  Object.keys(fields).forEach(function (id) {
    $('#' + id).addEventListener('input', function () {
      var m = cur(); m.biz[fields[id]] = id === 'fFssai' ? this.value.replace(/\D/g, '').slice(0, 14) : this.value;
      if (id === 'fFssai' && this.value !== m.biz.fssai) this.value = m.biz.fssai;
      delete m.sample; save(); renderMenuSel(); checkFields(); schedulePreview();
    });
  });
  $('#fGst').addEventListener('change', function () { cur().biz.gst = this.checked; save(); schedulePreview(); });
  $('#fWaQr').addEventListener('change', function () { cur().biz.waQr = this.checked; save(); schedulePreview(); });
  function checkFields() {
    var b = cur().biz;
    $('#fssaiMsg').textContent = b.fssai && b.fssai.length !== 14 ? t('fssai_len') : '';
    $('#upiMsg').textContent = b.upi && !upiOk(b.upi) ? t('upi_bad') : '';
  }
  $('#btnLogo').addEventListener('click', function () {
    EDU.pickFile('image/*').then(function (f) {
      if (!f) return;
      if (!/^image\//.test(f.type)) { msg(t('logo_bad'), 'danger'); return; }
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          var S = 256, k = Math.min(1, S / Math.max(img.width, img.height)), c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          cur().biz.logo = c.toDataURL('image/png'); save(); renderDetails(); schedulePreview();
        };
        img.onerror = function () { msg(t('logo_bad'), 'danger'); };
        img.src = String(r.result);
      };
      r.readAsDataURL(f);
    });
  });
  ui.logoRm.addEventListener('click', function () { cur().biz.logo = ''; save(); renderDetails(); schedulePreview(); });
  function renderDetails() {
    var b = cur().biz;
    Object.keys(fields).forEach(function (id) { $('#' + id).value = b[fields[id]] || ''; });
    $('#fGst').checked = !!b.gst; $('#fWaQr').checked = !!b.waQr;
    ui.logoPrev.hidden = !b.logo; ui.logoRm.hidden = !b.logo; if (b.logo) ui.logoPrev.src = b.logo;
    checkFields();
  }

  /* ---------------- items editor ---------------- */
  var openCats = {};
  function renderItems() {
    var m = cur(), root = ui.catList; root.innerHTML = '';
    m.cats.forEach(function (c, ci) {
      var items = m.items.filter(function (it) { return it.cat === c.id; });
      var det = el('details', { class: 'cat', open: openCats[c.id] !== false && (ci === 0 || openCats[c.id] === true), dataset: { cat: c.id } });
      det.addEventListener('toggle', function () { openCats[c.id] = det.open; });
      var nameIn = el('input', { type: 'text', class: 'no-i18n cat-name', value: c.name, maxlength: 60, 'data-i18n-placeholder': 'ph_cat_name', placeholder: t('ph_cat_name'), 'aria-label': t('ph_cat_name') });
      nameIn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); });
      nameIn.addEventListener('keydown', function (e) { if (e.key === ' ') e.stopPropagation(); });
      nameIn.addEventListener('input', function () { c.name = str(this.value, 60); save(); schedulePreview(); });
      var sum = el('summary', {}, el('span', { class: 'caret', 'aria-hidden': 'true', text: '▸' }), nameIn, el('span', { class: 'badge', text: t('items_in_cat', { n: EDU.fmt(items.length) }) }),
        el('button', { type: 'button', class: 'btn btn-sm ibtn', 'aria-label': t('aria_cat_up'), text: '↑', disabled: ci === 0, onclick: function (e) { e.preventDefault(); moveCat(ci, -1); } }),
        el('button', { type: 'button', class: 'btn btn-sm ibtn', 'aria-label': t('aria_cat_down'), text: '↓', disabled: ci === m.cats.length - 1, onclick: function (e) { e.preventDefault(); moveCat(ci, 1); } }),
        el('button', { type: 'button', class: 'btn btn-sm btn-danger ibtn', 'aria-label': t('aria_cat_del'), text: '🗑', onclick: function (e) { e.preventDefault(); delCat(c); } }));
      var body = el('div', { class: 'cat-body' });
      if (!items.length) body.appendChild(el('p', { class: 'muted small', text: t('no_items'), style: { margin: 0 } }));
      items.forEach(function (it, ii) { body.appendChild(itemRow(m, c, it, ii, items.length)); });
      body.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-sm add-item', text: '＋ ' + t('btn_add_item'), onclick: function () {
        if (m.items.length >= MAX_ITEMS) return;
        m.items.push(cleanItem({ id: uid(), cat: c.id, name: '', price: 0 })); openCats[c.id] = true; delete m.sample; save(); renderItems(); renderMenuSel();
        var last = $('.cat[data-cat="' + c.id + '"] .it:last-of-type .f-name'); if (last) last.focus();
      } })));
      det.appendChild(sum); det.appendChild(body); root.appendChild(det);
    });
    ui.itemsStatus.textContent = t('status_items', { n: EDU.fmt(m.items.length), c: EDU.fmt(m.cats.length) });
  }
  function itemRow(m, c, it, ii, count) {
    var row = el('div', { class: 'it ' + (it.veg ? 'is-veg' : 'is-nonveg') + (it.out ? ' is-out' : ''), dataset: { item: it.id } });
    function upd(fn) { return function () { fn.call(this); delete m.sample; save(); schedulePreview(); }; }
    var name = el('input', { type: 'text', class: 'no-i18n f-name', value: it.name, maxlength: 80, placeholder: t('ph_item_name'), 'aria-label': t('lbl_item_name') });
    name.addEventListener('input', upd(function () { it.name = str(this.value, 80); }));
    var price = el('input', { type: 'text', class: 'no-i18n f-price', dir: 'ltr', inputmode: 'decimal', value: it.price || '', placeholder: '0', 'aria-label': t('lbl_price') });
    price.addEventListener('input', upd(function () { it.price = num(this.value); }));
    var half = el('input', { type: 'text', class: 'no-i18n f-half', dir: 'ltr', inputmode: 'decimal', value: it.half || '', placeholder: '–', 'aria-label': t('lbl_half') });
    half.addEventListener('input', upd(function () { it.half = num(this.value); }));
    var desc = el('input', { type: 'text', class: 'no-i18n f-desc', value: it.desc, maxlength: 160, placeholder: t('ph_desc'), 'aria-label': t('lbl_desc') });
    desc.addEventListener('input', upd(function () { it.desc = str(this.value, 160); }));
    var vegSeg = el('div', { class: 'seg f-veg', role: 'group', 'aria-label': t('lbl_veg') },
      el('button', { type: 'button', class: 'f-veg-y', 'aria-pressed': it.veg ? 'true' : 'false', html: markSvg(true) + ' ' + EDU.esc(t('veg')), onclick: upd(function () { it.veg = true; row.classList.add('is-veg'); row.classList.remove('is-nonveg'); $$('button', vegSeg).forEach(function (b, k) { b.setAttribute('aria-pressed', k === 0 ? 'true' : 'false'); }); }) }),
      el('button', { type: 'button', class: 'f-veg-n', 'aria-pressed': it.veg ? 'false' : 'true', html: markSvg(false) + ' ' + EDU.esc(t('nonveg')), onclick: upd(function () { it.veg = false; row.classList.remove('is-veg'); row.classList.add('is-nonveg'); $$('button', vegSeg).forEach(function (b, k) { b.setAttribute('aria-pressed', k === 1 ? 'true' : 'false'); }); }) }));
    var spice = el('select', { class: 'f-spice', 'aria-label': t('lbl_spice') });
    for (var s = 0; s <= 3; s++) spice.appendChild(el('option', { value: s, text: t('spice_' + s), selected: it.spice === s }));
    spice.addEventListener('change', upd(function () { it.spice = parseInt(this.value, 10) || 0; }));
    function chk(key, cls, label) { var i = el('input', { type: 'checkbox', class: cls, checked: !!it[key] }); i.addEventListener('change', upd(function () { it[key] = this.checked; if (key === 'out') row.classList.toggle('is-out', this.checked); })); return el('label', { class: 'check' }, i, el('span', { text: t(label) })); }
    var moveSel = el('select', { class: 'f-cat no-i18n', 'aria-label': t('lbl_move_to') });
    m.cats.forEach(function (cc) { moveSel.appendChild(el('option', { value: cc.id, text: cc.name || '—', selected: cc.id === c.id })); });
    moveSel.addEventListener('change', function () { it.cat = this.value; openCats[it.cat] = true; save(); renderItems(); schedulePreview(); });
    row.appendChild(el('div', { class: 'it-top' }, el('label', { class: 'field' }, el('span', { text: t('lbl_item_name') }), name), vegSeg));
    row.appendChild(el('div', { class: 'it-grid' },
      el('label', { class: 'field' }, el('span', { text: t('lbl_price') }), price),
      el('label', { class: 'field' }, el('span', { text: t('lbl_half') }), half),
      el('label', { class: 'field' }, el('span', { text: t('lbl_spice') }), spice)));
    row.appendChild(el('label', { class: 'field' }, el('span', { text: t('lbl_desc') }), desc));
    row.appendChild(el('div', { class: 'it-flags' }, chk('chef', 'f-chef', 'chk_chef'), chk('best', 'f-best', 'chk_best'), chk('out', 'f-out', 'chk_out')));
    row.appendChild(el('div', { class: 'it-actions' },
      el('label', { class: 'field' }, el('span', { text: t('lbl_move_to') }), moveSel),
      el('button', { type: 'button', class: 'btn btn-sm ibtn', 'aria-label': t('aria_item_up'), text: '↑', disabled: ii === 0, onclick: function () { moveItem(m, it, -1); } }),
      el('button', { type: 'button', class: 'btn btn-sm ibtn', 'aria-label': t('aria_item_down'), text: '↓', disabled: ii === count - 1, onclick: function () { moveItem(m, it, 1); } }),
      el('button', { type: 'button', class: 'btn btn-sm btn-danger ibtn f-del', 'aria-label': t('aria_item_del'), text: '🗑', onclick: function () { m.items = m.items.filter(function (x) { return x !== it; }); delete m.sample; save(); renderItems(); renderMenuSel(); schedulePreview(); } })));
    return row;
  }
  function moveCat(i, d) { var m = cur(), j = i + d; if (j < 0 || j >= m.cats.length) return; var x = m.cats[i]; m.cats[i] = m.cats[j]; m.cats[j] = x; save(); renderItems(); schedulePreview(); }
  function moveItem(m, it, d) {
    var sib = m.items.filter(function (x) { return x.cat === it.cat; }), i = sib.indexOf(it), j = i + d; if (j < 0 || j >= sib.length) return;
    var a = m.items.indexOf(sib[i]), b = m.items.indexOf(sib[j]); m.items[a] = sib[j]; m.items[b] = sib[i]; save(); renderItems(); schedulePreview();
  }
  function delCat(c) {
    var m = cur(), n = m.items.filter(function (it) { return it.cat === c.id; }).length;
    if (!confirm(t('confirm_del_cat', { name: c.name, n: EDU.fmt(n) }))) return;
    m.cats = m.cats.filter(function (x) { return x !== c; }); m.items = m.items.filter(function (it) { return it.cat !== c.id; }); delete m.sample; save(); renderItems(); renderMenuSel(); schedulePreview();
  }
  $('#btnAddCat').addEventListener('click', function () {
    var m = cur(); if (m.cats.length >= MAX_CATS) return;
    var c = { id: uid(), name: t('new_cat_name') }; m.cats.push(c); openCats[c.id] = true; save(); renderItems();
    var inp = $('.cat[data-cat="' + c.id + '"] .cat-name'); if (inp) { inp.focus(); inp.select(); }
  });

  /* ---------------- design + layout ---------------- */
  var SW = { classic: ['#fbf5e6', '#7a1f1f'], dhaba: ['#fff3c4', '#c2410c'], cafe: ['#ffffff', '#111827'], royal: ['#1b1030', '#e3b84a'], south: ['#f4fbef', '#1b7a3a'], dark: ['#111318', '#ffb347'] };
  function renderDesign() {
    var m = cur(); ui.designList.innerHTML = '';
    DESIGNS.forEach(function (d) {
      ui.designList.appendChild(el('button', { type: 'button', class: 'dchip', dataset: { design: d }, 'aria-pressed': m.design === d ? 'true' : 'false', onclick: function () { m.design = d; save(); renderDesign(); renderPreview(); } },
        el('span', { class: 'sw', style: { background: SW[d][0], color: SW[d][1] }, text: '₹' }), el('span', { text: t('d_' + d) })));
    });
    ui.layoutSeg.innerHTML = '';
    LAYOUTS.forEach(function (l) {
      ui.layoutSeg.appendChild(el('button', { type: 'button', dataset: { layout: l }, 'aria-pressed': m.layout === l ? 'true' : 'false', text: t('l_' + l.replace('-', '_')), onclick: function () { m.layout = l; save(); renderDesign(); renderPreview(); } }));
    });
    ui.layoutHint.textContent = m.layout === 'story' ? t('story_hint') : m.layout === 'tent' ? t('tent_hint') : '';
  }

  /* ---------------- preview (HTML sheets + canvas story) ---------------- */
  function labels() {
    return { half: t('m_half'), full: t('m_full'), scanPay: t('m_scan_pay'), orderWa: t('m_order_wa'), fssai: t('m_fssai'), gstIncl: t('m_gst_incl'), veg: t('m_veg_legend'), nonveg: t('m_nonveg_legend'),
      chef: t('m_chef'), best: t('m_best'), out: t('m_out'), menu: t('m_menu'), scanMenu: t('m_scan_menu'), posterSub: t('m_poster_sub'), call: t('m_call'), contd: t('m_contd'), page: function (x, y) { return t('page_x_of_y', { x: x, y: y }); } };
  }
  function qrSet(m) {
    return { upi: m.biz.upi && upiOk(m.biz.upi) ? qrFor(upiLink(m), 'M') : null, wa: m.biz.waQr && waLink(m) ? qrFor(waLink(m), 'M') : null, menu: m.layout === 'poster' ? posterQr(m) : null };
  }
  function ensureLogo(m, cb) {
    if (!m.biz.logo) { logoImg = null; logoSrc = ''; cb(); return; }
    if (m.biz.logo === logoSrc && logoImg) { cb(); return; }
    var img = new Image(); img.onload = function () { logoImg = img; logoSrc = m.biz.logo; cb(); }; img.onerror = function () { logoImg = null; logoSrc = m.biz.logo; cb(); }; img.src = m.biz.logo;
  }
  function model(m, layout) {
    return { layout: layout || m.layout, design: m.design, rtl: isRtl(), font: getComputedStyle(document.body).fontFamily || 'sans-serif',
      biz: { name: m.biz.name, tagline: m.biz.tagline, logo: logoImg, phone: m.biz.phone, address: m.biz.address, fssai: m.biz.fssai, gst: m.biz.gst, note: m.biz.note, upi: m.biz.upi, link: m.biz.link },
      cats: liveCats(m), labels: labels(), qr: qrSet(m), fmtPrice: fmtPrice };
  }
  function priceHtml(it, hasHalf) {
    var h = '';
    if (hasHalf) h += '<span class="num half">' + (it.half > 0 ? fmtPrice(it.half) : '') + '</span> ';
    return h + '<span class="num">' + fmtPrice(it.price) + '</span>';
  }
  function rowsHtml(cats, L, compact) {
    var h = '';
    cats.forEach(function (c) {
      if (!c.items.length) return;
      var hasHalf = c.items.some(function (it) { return it.half > 0; });
      h += '<section class="m-cat"><h3 class="m-cat-name no-i18n">' + EDU.esc(c.name) + '</h3>';
      if (hasHalf) h += '<div class="m-th"><span>' + EDU.esc(L.half) + '</span><span>' + EDU.esc(L.full) + '</span></div>';
      c.items.forEach(function (it) {
        h += '<div class="m-row no-i18n' + (it.out ? ' out' : '') + '" data-veg="' + (it.veg ? '1' : '0') + '">' + markSvg(it.veg) +
          '<div class="m-txt"><span class="m-iname">' + EDU.esc(it.name) + '</span>' +
          (it.chef ? '<span class="m-badge">' + EDU.esc(L.chef) + '</span>' : '') + (it.best ? '<span class="m-badge">' + EDU.esc(L.best) + '</span>' : '') + (it.out ? '<span class="m-badge out-b">' + EDU.esc(L.out) + '</span>' : '') +
          (it.spice > 0 && !it.out ? '<span class="m-spice" aria-label="' + EDU.esc(t('spice_' + it.spice)) + '">' + new Array(it.spice + 1).join('🌶') + '</span>' : '') +
          (it.desc && !compact ? '<div class="m-desc">' + EDU.esc(it.desc) + '</div>' : '') + '</div><div class="m-price">' + priceHtml(it, hasHalf) + '</div></div>';
      });
      h += '</section>';
    });
    return h;
  }
  function headHtml(b, L) {
    return '<header class="m-head no-i18n">' + (b.logo ? '<img class="m-logo" src="' + b.logo + '" alt="">' : '') + '<h2 class="m-name">' + EDU.esc(b.name || L.menu) + '</h2>' +
      (b.tagline ? '<p class="m-tag">' + EDU.esc(b.tagline) + '</p>' : '') + '<p class="m-word">' + EDU.esc(L.menu) + '</p></header>';
  }
  function qrHtml(q, cap, sub) { return q && q.ok ? '<div class="m-qr">' + qrSvg(q) + EDU.esc(cap) + (sub ? '<span class="num">' + EDU.esc(sub) + '</span>' : '') + '</div>' : ''; }
  function footHtml(m, L, Q) {
    var b = m.biz, lines = '';
    if (b.address) lines += '<p>' + EDU.esc(b.address) + '</p>';
    if (b.phone) lines += '<p>' + EDU.esc(L.call) + ': <span class="num">' + EDU.esc(b.phone) + '</span></p>';
    if (b.fssai) lines += '<p class="m-fssai">' + EDU.esc(L.fssai) + ' <span class="num">' + EDU.esc(b.fssai) + '</span></p>';
    if (b.gst) lines += '<p class="m-gst">' + EDU.esc(L.gstIncl) + '</p>';
    if (b.note) lines += '<p>' + EDU.esc(b.note) + '</p>';
    lines += '<p class="m-legend">' + markSvg(true) + ' ' + EDU.esc(L.veg) + ' &nbsp; ' + markSvg(false) + ' ' + EDU.esc(L.nonveg) + '</p>';
    return '<footer class="m-foot no-i18n"><div class="m-lines">' + lines + '</div><div class="m-qrs">' + qrHtml(Q.upi, L.scanPay, b.upi) + qrHtml(Q.wa, L.orderWa, '') + '</div></footer>';
  }
  function sheetHtml(m, L, Q) {
    var cats = liveCats(m), any = cats.some(function (c) { return c.items.length; });
    var cls = 'sheet d-' + m.design + (m.layout === 'a5' ? ' a5' : '');
    var body = any ? rowsHtml(cats, L) : '<p class="m-empty">' + EDU.esc(t('no_items')) + '</p>';
    return '<article class="' + cls + '" id="sheet1">' + headHtml(m.biz, L) + '<div class="m-body' + (m.layout === 'a4-2' ? ' cols-2' : '') + '">' + body + '</div>' + footHtml(m, L, Q) + '</article>';
  }
  function tentHtml(m, L, Q) {
    var b = m.biz, cats = liveCats(m);
    var side = '<div class="t-side">' + qrHtml(Q.upi, L.scanPay, b.upi) + qrHtml(Q.wa, L.orderWa, '') + '</div>';
    var foot = '<p class="t-foot">' + (b.phone ? EDU.esc(L.call) + ': <span class="num">' + EDU.esc(b.phone) + '</span> · ' : '') + (b.fssai ? EDU.esc(L.fssai) + ' <span class="num">' + EDU.esc(b.fssai) + '</span> · ' : '') + (b.gst ? EDU.esc(L.gstIncl) : '') + '</p>';
    var panel = '<div class="t-main">' + headHtml(b, L) + rowsHtml(cats, L, true) + foot + '</div>' + side;
    return '<article class="sheet tent d-' + m.design + ' no-i18n" id="sheet1"><div class="panel-t p1">' + panel + '</div><div class="tent-fold" aria-hidden="true"></div><div class="panel-t p2">' + panel + '</div></article>';
  }
  function posterHtml(m, L, Q) {
    var b = m.biz, lines = '';
    if (b.address) lines += '<p>' + EDU.esc(b.address) + '</p>';
    if (b.phone) lines += '<p>' + EDU.esc(L.call) + ': <span class="num">' + EDU.esc(b.phone) + '</span></p>';
    if (b.fssai) lines += '<p class="m-fssai">' + EDU.esc(L.fssai) + ' <span class="num">' + EDU.esc(b.fssai) + '</span></p>';
    if (b.note) lines += '<p>' + EDU.esc(b.note) + '</p>';
    return '<article class="sheet poster d-' + m.design + ' no-i18n" id="sheet1">' + (b.logo ? '<img class="m-logo" src="' + b.logo + '" alt="">' : '') + '<h2 class="m-name">' + EDU.esc(b.name || L.menu) + '</h2>' +
      (b.tagline ? '<p class="m-tag">' + EDU.esc(b.tagline) + '</p>' : '') + '<p class="po-title">' + EDU.esc(L.scanMenu) + '</p><p class="po-sub">' + EDU.esc(L.posterSub) + '</p>' +
      '<div class="po-qr">' + qrSvg(Q.menu) + '</div><div class="po-small">' + qrHtml(Q.upi, L.scanPay, b.upi) + qrHtml(Q.wa, L.orderWa, b.phone) + '</div><div class="po-lines">' + lines + '</div></article>';
  }
  var pvTimer = null, storyPages = [];
  function schedulePreview() { clearTimeout(pvTimer); pvTimer = setTimeout(renderPreview, 120); }
  function renderPreview() {
    var m = cur(), L = labels(), Q = qrSet(m);
    ui.pageSize.textContent = '@page { size: ' + (m.layout === 'a5' ? 'A5' : 'A4') + ' portrait; margin: 0; }';
    ui.wa.href = EDU.waLink(menuText(m) + '\n\n' + t('wa_text_foot'));
    msg('');
    if (m.layout === 'story') {
      ui.pvWrap.hidden = true; ui.pvPages.hidden = false; ui.pvPages.innerHTML = '';
      ensureLogo(m, function () {
        storyPages = MENU_RENDER.pages(model(m, 'story'));
        ui.pvPages.innerHTML = '';
        storyPages.forEach(function (c, i) { c.setAttribute('aria-label', t('page_x_of_y', { x: i + 1, y: storyPages.length })); c.className = 'story-page'; ui.pvPages.appendChild(c); });
        ui.pageInfo.textContent = t('pages_n', { n: EDU.fmt(storyPages.length) }) + ' · 1080×1920';
      });
      return;
    }
    ui.pvWrap.hidden = false; ui.pvPages.hidden = true;
    ui.pvScale.innerHTML = m.layout === 'tent' ? tentHtml(m, L, Q) : m.layout === 'poster' ? posterHtml(m, L, Q) : sheetHtml(m, L, Q);
    if (m.layout === 'poster' && posterInfo.trimmed) msg(t('qr_too_long', { n: EDU.fmt(posterInfo.trimmed) }), 'warning');
    ui.pageInfo.textContent = m.layout === 'a5' ? 'A5 · 148×210 mm' : 'A4 · 210×297 mm';
    fitPreview();
  }
  function fitPreview() {
    var sh = $('#sheet1'); if (!sh || ui.pvWrap.hidden) return;
    var w = ui.pvWrap.clientWidth || 1, sw = sh.offsetWidth || 794, k = Math.min(1, w / sw);
    ui.pvScale.style.transformOrigin = isRtl() ? '100% 0' : '0 0';
    ui.pvScale.style.transform = 'scale(' + k + ')';
    ui.pvWrap.style.height = Math.ceil(sh.offsetHeight * k) + 'px';
  }
  window.addEventListener('resize', fitPreview);
  if (window.ResizeObserver) new ResizeObserver(fitPreview).observe(ui.pvWrap);
  window.addEventListener('beforeprint', function () { ui.pvScale.style.transform = 'none'; ui.pvWrap.style.height = 'auto'; });
  window.addEventListener('afterprint', fitPreview);

  /* ---------------- export ---------------- */
  $('#btnPrint').addEventListener('click', function () { window.print(); });
  function fileBase(m) { return ((m.biz.name || 'menu').replace(/[^\w\u0080-￿-]+/g, '_').slice(0, 40) + '-' + m.layout); }
  function exportImages(type) {
    var m = cur();
    ensureLogo(m, function () {
      var pages = MENU_RENDER.pages(model(m));
      var mime = type === 'jpg' ? 'image/jpeg' : 'image/png', ext = type === 'jpg' ? '.jpg' : '.png';
      pages.forEach(function (c, i) {
        setTimeout(function () {
          var src = c;
          if (type === 'jpg') { src = document.createElement('canvas'); src.width = c.width; src.height = c.height; var x = src.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(c, 0, 0); }
          src.toBlob(function (b) { if (b) EDU.download(fileBase(m) + (pages.length > 1 ? '-' + (i + 1) : '') + ext, b); }, mime, 0.92);
        }, i * 400);
      });
    });
  }
  $('#btnPng').addEventListener('click', function () { exportImages('png'); });
  $('#btnJpg').addEventListener('click', function () { exportImages('jpg'); });
  $('#btnCopy').addEventListener('click', function () { EDU.copy(menuText(cur())); });

  /* ---------------- render all ---------------- */
  function renderAll() { renderMenuSel(); renderTabs(); renderDetails(); renderItems(); renderDesign(); renderPreview(); }
  EDU.onLang(function () { qrCache = {}; renderAll(); });
  EDU.onTheme(function () { if (cur().layout === 'story') renderPreview(); });
  renderAll();
  var fontTimer = null;
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { clearTimeout(fontTimer); fontTimer = setTimeout(renderPreview, 80); });
})();
