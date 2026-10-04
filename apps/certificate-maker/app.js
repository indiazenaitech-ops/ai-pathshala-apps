/* Certificate Maker: bulk printable certificates (5 designs, A4 landscape, 12 languages). */
(function () {
  'use strict';
  var SLUG = 'certificate-maker';
  var KIT = window.CERT_KIT, W = KIT.W, H = KIT.H, MAX = 500;
  var TYPES = ['merit', 'participation', 'appreciation', 'excellence', 'completion'];
  var SAMPLE = { names: 'sample_names', event: 'sample_event', school: 'sample_school', sig1n: 'sample_sig1_name', sig1r: 'sample_sig1_role', sig2n: 'sample_sig2_name', sig2r: 'sample_sig2_role' };
  var FIELDS = ['names', 'event', 'school', 'sig1n', 'sig1r', 'sig2n', 'sig2r', 'title', 'message'];
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;
  var store = EDU.store(SLUG);

  /* ---------------- state ----------------
     s.f[field] === undefined/null → use the (translated) default/sample text; a string → the teacher's own text. */
  function defaults() { return { design: 0, type: 'merit', certLang: 'ui', seal: true, logo: null, date: null, f: {} }; }
  function load() {
    var d = defaults(), v = store.get('s', null);
    if (!v || typeof v !== 'object') return d;
    if (typeof v.design === 'number' && v.design >= 0 && v.design < KIT.DESIGNS.length) d.design = Math.floor(v.design);
    if (TYPES.indexOf(v.type) >= 0) d.type = v.type;
    if (v.certLang === 'en') d.certLang = 'en';
    d.seal = v.seal !== false;
    if (typeof v.logo === 'string' && /^data:image\//.test(v.logo)) d.logo = v.logo;
    if (v.date === '' || (typeof v.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.date))) d.date = v.date;
    if (v.f && typeof v.f === 'object') FIELDS.forEach(function (k) { if (typeof v.f[k] === 'string') d.f[k] = v.f[k]; });
    return d;
  }
  var s = load();
  var idx = 0;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });
  document.head.appendChild(el('style', { id: 'cert-css', text: KIT.CSS }));

  /* ---------------- certificate language + texts ---------------- */
  function cl() { return s.certLang === 'en' ? 'en' : EDU.lang; }
  function ct(key, vars) {
    var S = window.APP_STRINGS || {}, L = cl();
    var v = S[L] && S[L][key] !== undefined ? S[L][key] : (S.en || {})[key];
    if (v === undefined) return t(key, vars);
    if (vars) v = String(v).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return v;
  }
  function defaultOf(k) {
    if (SAMPLE[k]) return ct(SAMPLE[k]);
    if (k === 'title') return ct('title_' + s.type);
    if (k === 'message') return ct('msg_' + s.type + (val('event').trim() ? '' : '_gen'));
    return '';
  }
  function val(k) {
    var v = s.f[k];
    if (k === 'title' || k === 'message') return typeof v === 'string' && v.trim() ? v : defaultOf(k);
    return typeof v === 'string' ? v : defaultOf(k);
  }
  function fill(tpl, vars) {
    return String(tpl)
      .replace(/\{(\w+)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m; })
      .replace(/[ \t]+([.,!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  }

  /* ---------------- names + positions ---------------- */
  function norm(p) { return String(p || '').trim().toLowerCase().replace(/[.\s]+$/, '').replace(/\s+/g, ' '); }
  var RANKS = null;
  function rankWords() {
    if (RANKS) return RANKS;
    RANKS = { '1': 1, '1st': 1, 'first': 1, 'i': 1, '2': 2, '2nd': 2, 'second': 2, 'ii': 2, '3': 3, '3rd': 3, 'third': 3, 'iii': 3 };
    var S = window.APP_STRINGS || {};
    Object.keys(S).forEach(function (L) {
      [1, 2, 3].forEach(function (r) {
        ['pos_' + r, 'pos_word_' + r].forEach(function (k) { if (S[L][k]) RANKS[norm(S[L][k])] = r; });
      });
    });
    return RANKS;
  }
  function exactRank(p) { return rankWords()[norm(p)] || 0; }
  /* "1st prize", "First prize", "प्रथम पुरस्कार" → 1 (for the medal colour on the seal) */
  function looseRank(p) {
    var r = exactRank(p); if (r) return r;
    var x = norm(p); if (!x) return 0;
    var m = x.match(/^([123])(st|nd|rd)?(?=\s|$)/);
    var R = rankWords(), best = m ? +m[1] : 0;
    if (!best) Object.keys(R).forEach(function (w) { if (!best && w.length > 2 && x.indexOf(w + ' ') === 0) best = R[w]; });
    /* "First runner-up" is 2nd place and "2nd runner up" is 3rd; a plain "runner-up" / "उपविजेता" is 2nd */
    if (/runners?[\s-]*up|उपविजेता/.test(x)) return best ? (best < 3 ? best + 1 : 0) : 2;
    return best;
  }
  function parseNames(text) {
    var out = [];
    String(text || '').split(/\r?\n/).forEach(function (line) {
      line = line.trim(); if (!line) return;
      var name = line, pos = '';
      if (line.indexOf('\t') >= 0) {                 /* pasted from Excel: [roll] name [position] */
        var cells = line.split('\t').map(function (c) { return c.trim(); }).filter(Boolean);
        if (cells.length > 1 && /^\d+$/.test(cells[0])) cells.shift();
        name = cells[0] || ''; pos = cells.slice(1).join(' ');
      } else {
        line = line.replace(/^\d{1,3}[.)]\s+/, '');   /* "1. Aarav" numbered lists */
        var m = line.match(/^(.*\S)\s*(?:\s[-–—]|\|)\s*(.*)$/);
        /* "Ravi-1st" / "Ravi- प्रथम": a dash without spaces also splits when the part after it is a rank (but not "Mary-Ann") */
        var m2 = m ? null : line.match(/^(.*\S)\s*[-–—]\s*(\S.*)$/);
        if (m) { name = m[1]; pos = m[2]; }
        else if (m2 && looseRank(m2[2]) && !/^[ivx]+$/i.test(m2[2])) { name = m2[1]; pos = m2[2]; }
        else name = line;
      }
      name = name.replace(/\s+/g, ' ').trim().slice(0, 120);
      pos = pos.replace(/\s+/g, ' ').trim().slice(0, 60);
      if (name) out.push({ name: name, pos: pos });
    });
    return out;
  }
  function allPeople() { return parseNames(val('names')); }
  function people() { return allPeople().slice(0, MAX); }

  /* ---------------- dates ---------------- */
  function pad(x) { return (x < 10 ? '0' : '') + x; }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dateISO() { return s.date === null || s.date === undefined ? todayISO() : s.date; }
  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]), L = cl();
    if (isNaN(d.getTime())) return iso;
    var num = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
    try {
      var out = new Intl.DateTimeFormat(EDU.langInfo(L).tag + '-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', numberingSystem: 'latn' }).format(d);
      /* if this browser has no month names for the language, use 14/11/2026 instead of an English month */
      if (L !== 'en' && /[A-Za-z]/.test(out)) return num;
      return out;
    } catch (e) { return num; }
  }

  /* ---------------- one certificate ---------------- */
  function ctx() {
    var d = KIT.DESIGNS[s.design] || KIT.DESIGNS[0], L = cl();
    return {
      d: d, L: L, dir: EDU.langInfo(L).dir,
      title: val('title').trim(), msg: val('message'), event: val('event').trim(), school: val('school').trim(),
      logo: s.logo, date: fmtDate(dateISO()), seal: s.seal,
      sig: [[val('sig1n').trim(), val('sig1r').trim()], [val('sig2n').trim(), val('sig2r').trim()]],
      presented: ct('cert_presented'), dateLabel: ct('cert_date'), placeholder: ct('name_placeholder'), logoAlt: ct('logo_alt')
    };
  }
  var uidN = 0;
  function buildCert(c, person) {
    var u = 'u' + (++uidN);
    var name = person ? person.name : c.placeholder;
    var posRaw = person ? person.pos : '';
    var er = exactRank(posRaw), lr = looseRank(posRaw);
    var posText = er ? ct('pos_' + er) : posRaw;
    var hasHead = !!(c.logo || c.school);
    var cert = el('div', { class: 'cert d-' + c.d.id + (hasHead ? '' : ' no-head'), lang: c.L, dir: c.dir, 'data-rank': String(lr) });
    cert.innerHTML = KIT.frame(c.d, u);
    var body = el('div', { class: 'c-body' });
    if (hasHead) body.appendChild(el('div', { class: 'c-head' },
      c.logo ? el('img', { class: 'c-logo', src: c.logo, alt: c.logoAlt }) : null,
      c.school ? el('div', { class: 'c-school', text: c.school }) : null));
    var mid = el('div', { class: 'c-mid' });
    mid.appendChild(el('div', { class: 'c-title', text: c.title }));
    mid.appendChild(el('div', { class: 'c-pres', text: c.presented }));
    mid.appendChild(el('div', { class: 'c-name', text: name }));
    mid.appendChild(el('div', { class: 'c-flourish', html: KIT.flourish(c.d.accent) }));
    if (posText) mid.appendChild(el('div', { class: 'c-pos', text: posText }));
    mid.appendChild(el('div', { class: 'c-msg', text: fill(c.msg, { name: name, event: c.event, position: posText, school: c.school, date: c.date }) }));
    if (c.date) mid.appendChild(el('div', { class: 'c-date', text: c.dateLabel + ': ' + c.date }));
    body.appendChild(mid);
    function sig(sg) {
      return el('div', { class: 'c-sig' + (sg[0] || sg[1] ? '' : ' empty') }, el('div', { class: 'c-sig-line' }),
        el('div', { class: 'c-sig-name', text: sg[0] || ' ' }), el('div', { class: 'c-sig-role', text: sg[1] || ' ' }));
    }
    body.appendChild(el('div', { class: 'c-foot' }, sig(c.sig[0]),
      el('div', { class: 'c-seal' + (c.seal ? '' : ' off'), html: KIT.seal(KIT.MEDALS[lr] || c.d.seal, u, lr ? String(lr) : '') }),
      sig(c.sig[1])));
    cert.appendChild(body);
    return cert;
  }

  /* shrink long school names, titles, names and messages so they always fit (certs must be in the layout) */
  /* School names and signatures may use 2 lines: a long "Kendriya Vidyalaya No. 2, Air Force Station …" then stays readable
     instead of shrinking to a tiny single line. Results are cached per text + design + language, because in "Print all"
     the school, title and signatures are the same on every certificate. */
  var FIT = '.c-school, .c-title, .c-name, .c-sig-name, .c-sig-role', WRAP2 = '.c-school, .c-sig-name, .c-sig-role';
  function fitKey(e, c) { return e.className + '\u0001' + c.className + '\u0001' + c.lang + '\u0001' + e.textContent; }
  function lineH(e, fs) { var lh = parseFloat(getComputedStyle(e).lineHeight); return lh > 0 ? lh : fs * 1.4; }
  function fitCerts(certs) {
    var items = [], cache = {};
    certs.forEach(function (c) {
      $$('.c-school, .c-title, .c-name, .c-msg, .c-sig-name, .c-sig-role', c).forEach(function (e) { e.style.fontSize = ''; e.classList.remove('c-wrap'); });
      $$(FIT, c).forEach(function (e) { items.push({ e: e, key: fitKey(e, c) }); });
    });
    /* one batched measuring pass, then one writing pass */
    var meas = items.map(function (it) {
      var e = it.e;
      return { e: e, key: it.key, sw: e.scrollWidth, cw: e.clientWidth, fs: parseFloat(getComputedStyle(e).fontSize) || 20, wrap: e.matches(WRAP2), two: false };
    });
    meas.forEach(function (m) {
      if (!(m.cw > 0 && m.sw > m.cw + 1)) return;
      var k = m.cw / m.sw;
      if (m.wrap && k < 0.8) { m.two = true; m.e.classList.add('c-wrap'); }
      else { m.fs = Math.max(11, Math.floor(m.fs * k * 0.97)); m.e.style.fontSize = m.fs + 'px'; }
    });
    meas.forEach(function (m) {
      var hit = cache[m.key];
      if (hit) { m.e.style.fontSize = hit.fs; m.e.classList.toggle('c-wrap', hit.two); return; }
      var e = m.e, guard = 0;
      var over = function () { return e.scrollWidth > e.clientWidth + 1 || (m.two && e.scrollHeight > 2 * lineH(e, m.fs) + 2); };
      while (over() && m.fs > 11 && guard++ < 50) { m.fs -= 1; e.style.fontSize = m.fs + 'px'; }
      cache[m.key] = { fs: e.style.fontSize, two: m.two };
    });
    certs.forEach(function (c) {
      var m = c.querySelector('.c-msg'); if (!m) return;
      var key = fitKey(m, c), hit = cache[key];
      if (hit) { m.style.fontSize = hit.fs; return; }
      var fs = parseFloat(getComputedStyle(m).fontSize) || 21, guard = 0;
      while (m.scrollHeight > m.clientHeight + 1 && fs > 12 && guard++ < 24) { fs -= 1; m.style.fontSize = fs + 'px'; }
      cache[key] = { fs: m.style.fontSize };
    });
    /* when one signature uses 2 lines, keep both signature lines at the same height (read all, then write all) */
    var sigs = certs.map(function (c) {
      var sg = $$('.c-sig', c);
      sg.forEach(function (e) { e.style.marginBottom = ''; });
      return sg.length === 2 && !sg[0].classList.contains('empty') && !sg[1].classList.contains('empty') ? sg : null;
    });
    sigs.map(function (sg) { return sg ? [sg[0].offsetHeight, sg[1].offsetHeight] : null; }).forEach(function (h, i) {
      if (!h || Math.abs(h[0] - h[1]) < 2) return;
      sigs[i][h[0] < h[1] ? 0 : 1].style.marginBottom = Math.abs(h[0] - h[1]) + 'px';
    });
  }

  /* ---------------- saving ---------------- */
  var saveT = 0;
  function saveNow() { clearTimeout(saveT); saveT = 0; store.set('s', s); }
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 250); }
  window.addEventListener('pagehide', function () { if (saveT) saveNow(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && saveT) saveNow(); });

  /* ---------------- preview ---------------- */
  var curCert = null;
  function fitView() {
    var view = $('#view'), sc = $('#scale');
    if (!curCert) return;
    var w = view.clientWidth; if (!w) return;
    var k = w / W;
    var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl && fsEl === $('#stage')) k = Math.min(k, (window.innerHeight - $('.stage-nav').offsetHeight - 50) / H);
    k = EDU.clamp(k, 0.05, 2);
    sc.style.width = Math.floor(W * k) + 'px';
    sc.style.height = Math.floor(H * k) + 'px';
    curCert.style.transform = 'scale(' + k + ')';
  }
  function renderPreview() {
    var list = people();
    idx = EDU.clamp(idx, 0, Math.max(0, list.length - 1));
    var cert = buildCert(ctx(), list[idx] || null);
    var sc = $('#scale');
    sc.innerHTML = '';
    sc.appendChild(cert);
    curCert = cert;
    fitCerts([cert]);
    fitView();
    var n = list.length;
    $('#pos-label').textContent = n ? t('prev_of', { i: EDU.fmt(idx + 1), n: EDU.fmt(n) }) : '—';
    $('#pos-label').setAttribute('data-i', n ? String(idx + 1) : '0');
    $('#prev').disabled = idx <= 0;
    $('#next').disabled = idx >= n - 1;
    $('#empty-note').hidden = n > 0;
    ['#print-all', '#print-one', '#png'].forEach(function (sel) { $(sel).disabled = !n; });
    $('#print-n').textContent = n ? '(' + EDU.fmt(n) + ')' : '';
  }
  function renderCount() {
    var all = allPeople(), n = Math.min(all.length, MAX);
    var c = $('#count');
    c.textContent = n === 1 ? t('count_1') : t('count_n', { n: EDU.fmt(n) });
    c.setAttribute('data-n', String(n));
    var w = $('#names-warn');
    w.hidden = all.length <= MAX;
    if (!w.hidden) w.textContent = t('too_many', { n: EDU.fmt(MAX) });
  }
  function go(step) {
    var n = people().length;
    var ni = EDU.clamp(idx + step, 0, Math.max(0, n - 1));
    if (ni !== idx) { idx = ni; renderPreview(); }
  }

  /* ---------------- form ---------------- */
  var inputs = {};
  FIELDS.forEach(function (k) { inputs[k] = $('#' + k); });

  function fillInputs(force) {
    FIELDS.forEach(function (k) {
      var inp = inputs[k];
      if (!force && document.activeElement === inp) return;
      var v = val(k);
      if (inp.value !== v) inp.value = v;
    });
    var dflt = defaultOf('title');
    inputs.title.placeholder = dflt;
    $('#type').value = s.type;
    $('#certlang').value = s.certLang;
    $('#seal').checked = !!s.seal;
    $('#date').value = dateISO();
    $('#msg-default').hidden = !(typeof s.f.message === 'string' && s.f.message.trim());
    renderLogo();
    renderDesigns();
  }

  FIELDS.forEach(function (k) {
    inputs[k].addEventListener('input', function () {
      var v = inputs[k].value;
      s.f[k] = v === defaultOf(k) || ((k === 'title' || k === 'message') && !v.trim()) ? null : v;
      if (k === 'names') renderCount();
      if (k === 'message') $('#msg-default').hidden = s.f.message === null;
      if (k === 'event') fillInputs();          /* the default message changes when the event is empty */
      save();
      renderPreview();
    });
    inputs[k].addEventListener('blur', function () { fillInputs(); });
  });

  $('#type').addEventListener('change', function () {
    s.type = TYPES.indexOf(this.value) >= 0 ? this.value : 'merit';
    s.f.title = null;                           /* a new type gets its own title */
    fillInputs(true); save(); renderPreview();
  });
  $('#certlang').addEventListener('change', function () {
    s.certLang = this.value === 'en' ? 'en' : 'ui';
    fillInputs(true); save(); renderPreview();
  });
  $('#msg-default').addEventListener('click', function () {
    s.f.message = null; fillInputs(true); save(); renderPreview();
  });
  $('#date').addEventListener('change', function () {
    var v = this.value;
    s.date = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '';
    save(); renderPreview();
  });
  $('#seal').addEventListener('change', function () { s.seal = this.checked; save(); renderPreview(); });

  /* designs */
  function buildDesigns() {
    var box = $('#designs');
    box.innerHTML = '';
    KIT.DESIGNS.forEach(function (d, i) {
      var b = el('button', { type: 'button', class: 'dbtn', 'data-d': String(i), 'aria-pressed': String(i === s.design),
        onclick: function () { s.design = i; renderDesigns(); save(); renderPreview(); } });
      b.innerHTML = KIT.thumb(d, 't' + i);
      b.appendChild(el('span', { i18n: d.key }));
      box.appendChild(b);
    });
  }
  function renderDesigns() {
    $$('#designs .dbtn').forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === s.design)); });
  }

  /* logo: shrink to max 360 px so it stays small in storage */
  function renderLogo() {
    var th = $('#logo-thumb');
    th.hidden = !s.logo;
    if (s.logo) th.src = s.logo; else th.removeAttribute('src');
    $('#logo-remove').hidden = !s.logo;
  }
  function shrink(dataUrl) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || 300, h = img.naturalHeight || 300, k = Math.min(1, 360 / Math.max(w, h));
          var cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k));
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL('image/png'));
        } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }
  $('#logo-add').addEventListener('click', function () {
    EDU.pickFile('image/*').then(function (file) {
      if (!file) return;
      var r = new FileReader();
      r.onload = function () {
        shrink(String(r.result)).then(function (url) {
          s.logo = url; renderLogo(); saveNow(); renderPreview();
        }, function () { EDU.toast(t('logo_bad')); });
      };
      r.onerror = function () { EDU.toast(t('logo_bad')); };
      r.readAsDataURL(file);
    });
  });
  $('#logo-remove').addEventListener('click', function () { s.logo = null; renderLogo(); save(); renderPreview(); });

  /* ---------------- navigation, full screen ---------------- */
  $('#prev').addEventListener('click', function () { go(-1); });
  $('#next').addEventListener('click', function () { go(1); });
  $('#fs').addEventListener('click', function () { EDU.fullscreen($('#stage')); });
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
    document.addEventListener(ev, function () { setTimeout(fitView, 60); });
  });
  document.addEventListener('keydown', function (e) {
    var tg = e.target;
    if (tg && (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable)) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var fwd = (e.key === 'ArrowRight') !== (document.documentElement.dir === 'rtl');
    go(fwd ? 1 : -1);
    e.preventDefault();
  });

  /* ---------------- printing: one certificate per A4 landscape page ---------------- */
  /* time when a Print button built the pages. Some browsers (iOS Safari, Android) return from print() at once and fire
     beforeprint later, so the pages are not rebuilt as "all" during that window (that turned "Print this one" into all). */
  var printBy = 0;
  function preparePrint(which) {
    var root = $('#print-root');
    root.innerHTML = '';
    var list = people(), c = ctx();
    var arr = which === 'one' ? [list[idx] || null] : (list.length ? list : [null]);
    var frag = document.createDocumentFragment();
    var certs = arr.map(function (p) { var x = buildCert(c, p); frag.appendChild(x); return x; });
    root.appendChild(frag);
    fitCerts(certs);
  }
  function doPrint(which) {
    if (!people().length) { EDU.toast(t('no_names')); return; }
    preparePrint(which);
    printBy = Date.now();
    var imgs = $$('#print-root img');
    Promise.all(imgs.map(function (im) { return im.decode ? im.decode().catch(function () { }) : null; })).then(function () {
      printBy = Date.now();
      try { window.print(); } catch (e) { }
    });
  }
  $('#print-all').addEventListener('click', function () { doPrint('all'); });
  $('#print-one').addEventListener('click', function () { doPrint('one'); });
  window.addEventListener('beforeprint', function () { if (Date.now() - printBy > 15000) preparePrint('all'); });
  window.addEventListener('afterprint', function () { printBy = 0; });

  /* ---------------- PNG: the certificate HTML is drawn through an SVG <foreignObject> onto a canvas ---------------- */
  var pngBusy = false;
  function fileName(name) {
    var base = String(name || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '').replace(/\s+/g, '-').slice(0, 60);
    return 'certificate-' + (idx + 1) + (base ? '-' + base : '') + '.png';
  }
  function savePng() {
    var list = people();
    if (!list.length) { EDU.toast(t('no_names')); return; }
    if (pngBusy) return;
    pngBusy = true;
    EDU.toast(t('png_wait'), 1500);
    var person = list[idx], box = $('#measure'), S = 2;
    box.innerHTML = '';
    var cert = buildCert(ctx(), person);
    /* the SVG image cannot use the page's web fonts (e.g. Noto Sans Devanagari) and falls back to system fonts, which can be
       wider: measure with exactly that fallback so long names are not cut off at the edge of the PNG */
    cert.style.setProperty('--font-script', '"Nirmala UI"');
    box.appendChild(cert);
    fitCerts([cert]);
    function fail() { box.innerHTML = ''; pngBusy = false; EDU.toast(t('png_fail'), 6000); }
    function done(blob) {
      box.innerHTML = ''; pngBusy = false;
      if (!blob) { fail(); return; }
      EDU.download(fileName(person.name), blob);
      EDU.toast(t('png_done'));
    }
    var xml;
    try { xml = new XMLSerializer().serializeToString(cert); } catch (e) { fail(); return; }
    var css = KIT.CSS.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W * S + '" height="' + H * S + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<foreignObject x="0" y="0" width="' + W + '" height="' + H + '"><div xmlns="http://www.w3.org/1999/xhtml" style="width:' + W + 'px;height:' + H + 'px;margin:0">' +
      '<style>' + css + '</style>' + xml + '</div></foreignObject></svg>';
    var img = new Image();
    img.onload = function () {
      try {
        var cv = document.createElement('canvas');
        cv.width = W * S; cv.height = H * S;
        var g = cv.getContext('2d');
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, cv.width, cv.height);
        g.drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(done, 'image/png');
      } catch (e) { fail(); }
    };
    img.onerror = fail;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  $('#png').addEventListener('click', savePng);

  /* ---------------- reset ---------------- */
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    s = defaults(); idx = 0;
    store.remove('s');
    fillInputs(true); renderCount(); renderPreview();
  });

  /* ---------------- start ---------------- */
  buildDesigns();
  fillInputs(true);
  renderCount();
  renderPreview();
  EDU.onLang(function () { fillInputs(true); renderCount(); renderPreview(); });
  if ('ResizeObserver' in window) {
    var rafR = 0;
    new ResizeObserver(function () { if (!rafR) rafR = requestAnimationFrame(function () { rafR = 0; fitView(); }); }).observe($('#view'));
  }
  window.addEventListener('resize', fitView);
  if (document.fonts && document.fonts.addEventListener) {
    var fontT = 0;
    document.fonts.addEventListener('loadingdone', function () { clearTimeout(fontT); fontT = setTimeout(renderPreview, 50); });
  }
})();
