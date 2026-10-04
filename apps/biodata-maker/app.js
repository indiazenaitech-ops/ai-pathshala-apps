/* Marriage Biodata Maker: a printable one-page A4 biodata in 12 languages.
   - Labels on the sheet come from content.js in the chosen label language (or bilingual with English);
     what the user types is never translated.
   - Print / Save as PDF uses the browser's print window (one A4 page, text auto-scaled to fit).
   - The WhatsApp PNG is painted on a canvas from the laid-out sheet (boxes, borders, photo, SVG ornaments, words).
   - Everything stays on this device (EDU.store); nothing is uploaded. */
(function () {
  'use strict';
  var SLUG = 'biodata-maker';
  var C = window.APP_CONTENT;
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, el = EDU.el;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var W = 794, H = 1123;                     /* A4 at 96 dpi */
  var CM_MIN = 50, CM_MAX = 272;              /* a believable adult height; anything else is a typing slip */
  function okCm(c) { return c >= CM_MIN && c <= CM_MAX; }
  var K_MIN = 0.6, K_MAX = 1.18;              /* text scale range used to fit one page */
  var TPLS = ['traditional', 'floral', 'royal', 'minimal', 'marigold', 'mandala', 'classic', 'sidebar'];
  var SYMS = ['none', 'om', 'ganesh', 'ikonkar', 'bismillah', 'cross', 'jain', 'buddha', 'custom'];
  var REL = ['elder_brother', 'younger_brother', 'elder_sister', 'younger_sister', 'brother', 'sister'];
  var OM = 'ॐ', IKONKAR = 'ੴ';
  var BISMILLAH = 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ';
  var SECS = [
    { id: 'personal', fields: [{ k: 'name', wide: true }, { k: 'dob', type: 'date' }, { k: 'tob', type: 'time' }, { k: 'pob' }, { k: 'height', type: 'height', wide: true },
      { k: 'education', wide: true }, { k: 'occupation', wide: true }, { k: 'income' }],
      extras: ['community', 'mother_tongue', 'languages', 'hobbies', 'diet', 'marital', 'about', 'expectations'] },
    { id: 'family', fields: [{ k: 'father' }, { k: 'father_occ' }, { k: 'mother' }, { k: 'mother_occ' }, { k: 'native', wide: true }],
      extras: ['residence', 'family_type', 'grandfather', 'grandmother', 'paternal_uncle', 'maternal_uncle'] },
    { id: 'horoscope', fields: [{ k: 'rashi', list: 'dlRashi' }, { k: 'nakshatra', list: 'dlNak' }, { k: 'gotra' }, { k: 'manglik', type: 'manglik' }],
      extras: ['charan', 'gan', 'nadi', 'kuldevta'] },
    { id: 'contact', fields: [{ k: 'contact_person', wide: true }, { k: 'phone', type: 'tel' }, { k: 'phone2', type: 'tel' }, { k: 'email', type: 'email', wide: true }, { k: 'address', type: 'textarea', wide: true }],
      extras: [] }
  ];
  var FIELD_KEYS = [];
  SECS.forEach(function (s) { s.fields.forEach(function (f) { FIELD_KEYS.push(f.k); }); });
  var SAMPLE_KEY = { contact_person: 'cperson' };
  /* own keys only: a backup saying lab:"__proto__" or k:"constructor" must not reach Object.prototype */
  function has(o, k) { return typeof k === 'string' && !!o && Object.prototype.hasOwnProperty.call(o, k); }
  function isLang(k) { return has(C, k) && EDU.LANGS.some(function (l) { return l.code === k; }); }

  /* ---------------- profiles (several, saved only on this device) ---------------- */
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function emptyExtra() { return { personal: [], family: [], horoscope: [], contact: [] }; }
  function blank() {
    return { id: uid(), sample: false, tpl: 'traditional', sym: 'none', symText: '', heading: '', lab: 'auto', bi: false,
      photo: null, photoSrc: null, crop: null, shape: 'rect', t12: true, hfmt: 'both', horo: true,
      f: {}, hide: {}, sibs: [], extra: emptyExtra() };
  }
  function clearContent(p) {
    p.f = {}; p.hide = {}; p.sibs = []; p.extra = emptyExtra(); p.horo = true; p.sample = false;
    return p;
  }
  function sampleInto(p, L) {
    var s = (isLang(L) ? C[L] : C.en).sample;
    clearContent(p);
    p.sample = true;
    FIELD_KEYS.forEach(function (k) { var v = s[SAMPLE_KEY[k] || k]; if (v !== undefined && v !== null && v !== '') p.f[k] = k === 'height' ? Math.round(+v) : v; });
    p.sibs = s.sibs.map(function (x) { return { r: Math.max(0, REL.indexOf(x.r)), name: x.name, details: x.details, hide: false }; });
    p.extra.personal.push({ k: 'hobbies', label: '', v: s.hobbies, hide: false });
    p.horo = s.horo !== false;
    return p;
  }
  function str(v, max) { return v === undefined || v === null ? '' : String(v).slice(0, max || 600); }
  function normalize(x) {
    if (!x || typeof x !== 'object') return null;
    var p = blank();
    if (typeof x.id === 'string' && x.id) p.id = x.id.slice(0, 40);
    p.sample = !!x.sample;
    if (TPLS.indexOf(x.tpl) >= 0) p.tpl = x.tpl;
    if (SYMS.indexOf(x.sym) >= 0) p.sym = x.sym;
    p.symText = str(x.symText, 80); p.heading = str(x.heading, 60);
    p.lab = isLang(x.lab) ? x.lab : 'auto';
    p.bi = !!x.bi; p.t12 = x.t12 !== false; p.horo = x.horo !== false;
    p.hfmt = ['both', 'ftin', 'cm'].indexOf(x.hfmt) >= 0 ? x.hfmt : 'both';
    p.shape = ['rect', 'round', 'oval'].indexOf(x.shape) >= 0 ? x.shape : 'rect';
    var img = function (v) { return typeof v === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(v) ? v : null; };
    p.photo = img(x.photo); p.photoSrc = img(x.photoSrc);
    if (x.crop && typeof x.crop === 'object') p.crop = { z: EDU.clamp(+x.crop.z || 1, 1, 4), cx: EDU.clamp(+x.crop.cx || 0.5, 0, 1), cy: EDU.clamp(+x.crop.cy || 0.5, 0, 1) };
    var f = x.f && typeof x.f === 'object' ? x.f : {};
    FIELD_KEYS.forEach(function (k) {
      if (k === 'height') { var h = Math.round(+f.height); if (okCm(h)) p.f.height = h; }
      else if (f[k] !== undefined && f[k] !== null && f[k] !== '') p.f[k] = str(f[k]);
    });
    if (['yes', 'no', 'partial'].indexOf(p.f.manglik) < 0) delete p.f.manglik;
    var hd = x.hide && typeof x.hide === 'object' ? x.hide : {};
    Object.keys(hd).forEach(function (k) { if (hd[k] === true) p.hide[k] = true; });
    if (Array.isArray(x.sibs)) p.sibs = x.sibs.slice(0, 30).filter(function (s) { return s && typeof s === 'object'; }).map(function (s) {
      return { r: EDU.clamp(Math.round(+s.r) || 0, 0, REL.length - 1), name: str(s.name, 120), details: str(s.details, 300), hide: !!s.hide };
    });
    if (x.extra && typeof x.extra === 'object') Object.keys(p.extra).forEach(function (sec) {
      if (!Array.isArray(x.extra[sec])) return;
      p.extra[sec] = x.extra[sec].slice(0, 30).filter(function (e) { return e && typeof e === 'object'; }).map(function (e) {
        return { k: has(C.en.l, e.k) ? e.k : 'custom', label: str(e.label, 60), v: str(e.v), hide: !!e.hide };
      });
    });
    return p;
  }

  var profiles = (store.get('profiles', []) || []);
  profiles = Array.isArray(profiles) ? profiles.map(normalize).filter(Boolean) : [];
  if (!profiles.length) profiles = [sampleInto(blank(), EDU.lang)];
  var curId = store.get('cur', profiles[0].id);
  function cur() {
    for (var i = 0; i < profiles.length; i++) if (profiles[i].id === curId) return profiles[i];
    curId = profiles[0].id;
    return profiles[0];
  }

  var saveT = 0, warnedFull = false;
  function saveNow() {
    clearTimeout(saveT);
    var ok = store.set('profiles', profiles);
    store.set('cur', cur().id);
    if (!ok && !warnedFull) { warnedFull = true; EDU.toast(t('storage_full'), 7000); }
    if (ok) warnedFull = false;
  }
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 350); }
  window.addEventListener('pagehide', saveNow);

  /* ---------------- formatting in the label language ---------------- */
  function labLang(p) { return p.lab !== 'auto' && isLang(p.lab) ? p.lab : (isLang(EDU.lang) ? EDU.lang : 'en'); }
  function fill(s, vars) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; }); }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var d = { y: +m[1], mo: +m[2], d: +m[3] };
    return d.mo >= 1 && d.mo <= 12 && d.d >= 1 && d.d <= 31 ? d : null;
  }
  function fmtDate(s, L) { var d = parseDate(s); return d ? d.d + ' ' + C[L].months[d.mo - 1] + ' ' + d.y : (s || ''); }
  function ageOf(s) {
    var d = parseDate(s); if (!d) return null;
    var now = new Date(), a = now.getFullYear() - d.y, m = now.getMonth() + 1;
    if (m < d.mo || (m === d.mo && now.getDate() < d.d)) a--;
    return a;
  }
  function fmtTime(s, L, t12) {
    var m = /^(\d{1,2}):(\d{2})/.exec(s || ''); if (!m || +m[1] > 23 || +m[2] > 59) return s || '';
    var h = +m[1], mi = m[2];
    if (!t12) return (h < 10 ? '0' : '') + h + ':' + mi;
    var idx = h < 4 ? 0 : h < 12 ? 1 : h < 16 ? 2 : h < 20 ? 3 : 4;
    return fill(C[L].time12, { t: ((h % 12) || 12) + ':' + mi, p: C[L].periods[idx] });
  }
  function ftIn(cm) { var tin = cm / 2.54, ft = Math.floor(tin / 12), inch = Math.round(tin - ft * 12); if (inch === 12) { ft++; inch = 0; } return { ft: ft, inch: inch }; }
  function fmtHeight(cm, L, mode) {
    cm = Math.round(+cm); if (!okCm(cm)) return '';
    var fi = ftIn(cm), a = fill(C[L].ftin, { ft: fi.ft, 'in': fi.inch }), b = fill(C[L].cm, { cm: cm });
    return mode === 'cm' ? b : mode === 'ftin' ? a : a + ' (' + b + ')';
  }
  /* the Urdu comma only between Urdu words: "Amit Sharma, Engineer" keeps a normal comma on an Urdu sheet */
  function sepFor(L, parts) { return L === 'ur' && parts.some(function (x) { return RTL_LETTER.test(x); }) ? '، ' : ', '; }
  function val(p, k) { var v = p.f[k]; return v === undefined || v === null ? '' : String(v).trim(); }

  /* rows of one section, in the label language */
  function rowsFor(sec, p, L, skipName) {
    var R = [];
    function lab(k) { return { l: C[L].l[k], en: p.bi && L !== 'en' ? C.en.l[k] : '' }; }
    function push(k, v, cls) { if (!v || p.hide[k]) return; var o = lab(k); o.k = k; o.v = v; o.cls = cls || ''; R.push(o); }
    if (sec === 'personal') {
      if (!skipName) push('name', val(p, 'name'), 'nm');
      var dob = val(p, 'dob');
      push('dob', dob && fmtDate(dob, L));
      var age = ageOf(dob);
      if (age !== null && age >= 0 && age < 130 && !p.hide.age) push('age', fill(C[L].years, { n: age }));
      push('tob', val(p, 'tob') && fmtTime(val(p, 'tob'), L, p.t12));
      push('pob', val(p, 'pob'));
      push('height', fmtHeight(p.f.height, L, p.hfmt));
      ['education', 'occupation', 'income'].forEach(function (k) { push(k, val(p, k)); });
    } else if (sec === 'family') {
      ['father', 'father_occ', 'mother', 'mother_occ'].forEach(function (k) { push(k, val(p, k)); });
      p.sibs.forEach(function (s, i) {
        if (s.hide) return;
        var parts = [s.name, s.details].map(function (x) { return String(x || '').trim(); }).filter(Boolean), v = parts.join(sepFor(L, parts));
        if (!v) return;
        var o = lab(REL[s.r] || 'brother'); o.k = 'sib' + i; o.v = v; o.cls = ''; R.push(o);
      });
      push('native', val(p, 'native'));
    } else if (sec === 'horoscope') {
      if (!p.horo) return R;
      ['rashi', 'nakshatra', 'gotra'].forEach(function (k) { push(k, val(p, k)); });
      var mg = p.f.manglik;
      push('manglik', mg && C[L].manglik[mg] ? C[L].manglik[mg] : '');
    } else {
      ['contact_person', 'phone', 'phone2', 'email', 'address'].forEach(function (k) { push(k, val(p, k)); });
    }
    (p.extra[sec] || []).forEach(function (x, i) {
      var v = String(x.v || '').trim();
      if (x.hide || !v) return;
      var o = x.k !== 'custom' && has(C[L].l, x.k) ? lab(x.k) : { l: String(x.label || '').trim() || '•', en: '' };
      o.k = 'x-' + sec + '-' + i; o.v = v; o.cls = ''; R.push(o);
    });
    return R;
  }

  /* ---------------- SVG ornaments (colours come from the template's CSS classes) ---------------- */
  var BULLET = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 0L10 5L5 10L0 5Z"/></svg>';
  function corners(inner, vb) {
    vb = vb || 100;
    var tf = { tl: '', tr: 'translate(' + vb + ' 0) scale(-1 1)', bl: 'translate(0 ' + vb + ') scale(1 -1)', br: 'translate(' + vb + ' ' + vb + ') scale(-1 -1)' };
    return ['tl', 'tr', 'bl', 'br'].map(function (c) {
      return '<svg class="bd-orn ' + c + '" viewBox="0 0 ' + vb + ' ' + vb + '" aria-hidden="true"><g' + (tf[c] ? ' transform="' + tf[c] + '"' : '') + '>' + inner + '</g></svg>';
    }).join('');
  }
  function petals(n, cx, cy, dist, rx, ry, cls, extra) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var a = 360 * i / n, rad = a * Math.PI / 180, x = cx + dist * Math.cos(rad), y = cy + dist * Math.sin(rad);
      s += '<ellipse class="' + cls + '" cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + a.toFixed(1) + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ')"' + (extra || '') + '/>';
    }
    return s;
  }
  function flower(cx, cy, r, petalCls, centerCls) {
    return petals(5, cx, cy, r * 1.05, r * 0.85, r * 0.62, petalCls) + '<circle class="' + centerCls + '" cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.55).toFixed(2) + '"/>';
  }
  var ORN = {
    traditional: function () {
      var s = '<path class="o-sb" stroke-width="1.3" d="M58 0 A58 58 0 0 1 0 58"/><path class="o-sb" stroke-width="0.8" d="M66 0 A66 66 0 0 1 0 66"/>';
      for (var i = 0; i < 5; i++) {
        var a = i * 22.5, r = a * Math.PI / 180, x = 34 * Math.cos(r), y = 34 * Math.sin(r);
        s += '<ellipse class="o-b" cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" rx="13" ry="5" transform="rotate(' + a + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ')"/>';
        var a2 = (i + 0.5) * 22.5 * Math.PI / 180;
        if (i < 4) s += '<circle class="o-a" cx="' + (50 * Math.cos(a2)).toFixed(2) + '" cy="' + (50 * Math.sin(a2)).toFixed(2) + '" r="2.4"/>';
      }
      return corners(s + '<path class="o-a" d="M0 0 H21 A21 21 0 0 1 0 21 Z"/><circle class="o-b" cx="7" cy="7" r="3"/>');
    },
    floral: function () {
      return corners('<path class="o-gs" stroke-width="1.6" d="M4 78 Q 14 30 26 24 Q 34 14 78 4"/>' +
        '<ellipse class="o-g" cx="46" cy="13" rx="10" ry="3.8" transform="rotate(-18 46 13)"/><ellipse class="o-g" cx="13" cy="46" rx="10" ry="3.8" transform="rotate(108 13 46)"/>' +
        '<ellipse class="o-g" cx="62" cy="8" rx="7" ry="2.8" transform="rotate(12 62 8)"/><ellipse class="o-g" cx="8" cy="62" rx="7" ry="2.8" transform="rotate(78 8 62)"/>' +
        flower(22, 22, 8.5, 'o-p', 'o-y') + flower(41, 33, 5, 'o-p2', 'o-y') + flower(33, 41, 4.2, 'o-p2', 'o-y') +
        '<circle class="o-p2" cx="74" cy="6" r="3.4"/><circle class="o-p2" cx="6" cy="74" r="3.4"/>');
    },
    royal: function () {
      return corners('<path class="o-sb" stroke-width="2" d="M2 58 V2 H58"/><path class="o-sb" stroke-width="1" d="M8 44 V8 H44"/>' +
        '<rect class="o-b" x="9" y="9" width="24" height="24" transform="rotate(45 21 21)"/>' +
        '<rect class="o-a" x="15" y="15" width="12" height="12" transform="rotate(45 21 21)"/>' +
        '<circle class="o-b" cx="21" cy="21" r="2.6"/>', 64);
    },
    mandala: function () {
      return corners('<circle class="o-sb" stroke-width="1.2" cx="50" cy="50" r="47"/><circle class="o-sa" stroke-width="1" cx="50" cy="50" r="34"/>' +
        petals(16, 50, 50, 40, 6.5, 2.6, 'o-sb', ' stroke-width="1"') + petals(12, 50, 50, 27, 7, 3.4, 'o-b', ' fill-opacity="0.55"') +
        petals(8, 50, 50, 15, 6.5, 3.2, 'o-a') + '<circle class="o-b" cx="50" cy="50" r="5.5"/>');
    },
    marigold: function () {
      var s = '<svg class="bd-toran" viewBox="0 0 794 96" aria-hidden="true"><path class="o-sa" stroke-width="1.5" d="M0 10 H794"/>';
      var x, i, n = 5, span = 794 / n;
      for (i = 0; i < n; i++) {
        var x0 = i * span, mid = x0 + span / 2;
        for (x = x0 + 9; x < x0 + span - 4; x += 13) {
          var u = (x - mid) / (span / 2), y = 12 + 40 * (1 - u * u);
          s += '<circle class="' + (Math.round(x / 13) % 2 ? 'o-or' : 'o-or2') + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7"/>';
          s += '<circle class="o-or3" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.4"/>';
        }
      }
      for (i = 0; i <= n; i++) {
        var hx = Math.min(786, Math.max(8, i * span));
        s += '<ellipse class="o-g" cx="' + (hx - 6) + '" cy="30" rx="4" ry="12" transform="rotate(14 ' + (hx - 6) + ' 30)"/>' +
          '<ellipse class="o-g" cx="' + (hx + 6) + '" cy="30" rx="4" ry="12" transform="rotate(-14 ' + (hx + 6) + ' 30)"/>' +
          '<circle class="o-or2" cx="' + hx + '" cy="14" r="8"/><circle class="o-or" cx="' + hx + '" cy="44" r="6"/>';
      }
      for (x = 7; x < 794; x += 14) s += '<circle class="' + (Math.round(x / 14) % 2 ? 'o-or3' : 'o-or') + '" cx="' + x + '" cy="6" r="5"/>';
      return s + '</svg>';
    }
  };
  var DIVIDER = '<svg class="bd-div" viewBox="0 0 200 16" aria-hidden="true"><path class="o-sb" stroke-width="1.5" d="M8 8 H84 M116 8 H192"/><path class="o-b" d="M100 1 L108 8 L100 15 L92 8 Z"/><circle class="o-a" cx="100" cy="8" r="2.4"/><circle class="o-b" cx="86" cy="8" r="2"/><circle class="o-b" cx="114" cy="8" r="2"/></svg>';
  var CROSS = '<svg class="x-cross" viewBox="0 0 40 60" aria-hidden="true"><path class="o-c" d="M17 4 H23 V18 H34 V24 H23 V56 H17 V24 H6 V18 H17 Z"/></svg>';
  var WHEEL = (function () {
    var s = '<svg viewBox="0 0 60 60" aria-hidden="true"><circle class="o-cs" stroke-width="3.5" cx="30" cy="30" r="22"/><circle class="o-cs" stroke-width="1.5" cx="30" cy="30" r="15"/><circle class="o-c" cx="30" cy="30" r="5"/>';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, c = Math.cos(a), sn = Math.sin(a);
      s += '<path class="o-cs" stroke-width="2.2" d="M' + (30 + 5 * c).toFixed(2) + ' ' + (30 + 5 * sn).toFixed(2) + ' L' + (30 + 22 * c).toFixed(2) + ' ' + (30 + 22 * sn).toFixed(2) + '"/>' +
        '<circle class="o-c" cx="' + (30 + 26.5 * c).toFixed(2) + '" cy="' + (30 + 26.5 * sn).toFixed(2) + '" r="2.6"/>';
    }
    return s + '</svg>';
  })();

  /* ---------------- fonts for the label language (online only; offline the device fonts are used) ---------------- */
  var fontsAsked = {};
  function ensureFont(fam) {
    if (!fam || fontsAsked[fam]) return;
    fontsAsked[fam] = 1;
    if (location.protocol === 'file:' && !navigator.onLine) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + fam.replace(/ /g, '+') + ':wght@400;600;700&display=swap';
    document.head.appendChild(l);
  }
  function fontStack(L) {
    var f = EDU.langInfo(L).font;
    return (f ? '"' + f + '", ' : '') + '"Noto Sans", "Nirmala UI", "Mangal", "Segoe UI", system-ui, sans-serif';
  }

  /* ---------------- the sheet ---------------- */
  function symEl(p, L) {
    var box = el('div', { class: 'bd-sym' });
    switch (p.sym) {
      case 'om': box.appendChild(el('span', { class: 'bd-sym-g', lang: 'sa', text: OM })); break;
      case 'ikonkar': box.appendChild(el('span', { class: 'bd-sym-g', lang: 'pa', text: IKONKAR })); break;
      case 'ganesh': box.appendChild(el('span', { class: 'bd-sym-t', text: C[L].ganesh })); break;
      case 'jain': box.appendChild(el('span', { class: 'bd-sym-t', text: C[L].jain })); break;
      case 'bismillah':
        box.appendChild(el('span', { class: 'bd-sym-786', text: '786' }));
        box.appendChild(el('span', { class: 'bd-sym-ar', lang: 'ar', dir: 'rtl', text: BISMILLAH }));
        break;
      case 'cross': box.innerHTML = CROSS; break;
      case 'buddha': box.innerHTML = WHEEL; box.appendChild(el('span', { class: 'bd-sym-t', text: C[L].buddha })); break;
      case 'custom':
        if (!String(p.symText || '').trim()) return null;
        box.appendChild(el('span', { class: 'bd-sym-t', text: p.symText.trim() }));
        break;
      default: return null;
    }
    return box;
  }
  function topEl(p, L) {
    var top = el('div', { class: 'bd-top' });
    var sym = symEl(p, L);
    if (sym) top.appendChild(sym);
    top.appendChild(el('h2', { class: 'bd-heading', text: String(p.heading || '').trim() || C[L].heading }));
    if (p.tpl !== 'minimal' && p.tpl !== 'sidebar') top.insertAdjacentHTML('beforeend', DIVIDER);
    return top;
  }
  function rowEl(r) {
    var l = el('div', { class: 'bd-l' }, el('span', { text: r.l }));
    if (r.en) l.appendChild(el('span', { class: 'en', text: r.en }));
    return el('div', { class: 'bd-row' + (r.cls ? ' ' + r.cls : ''), 'data-k': r.k }, l, el('div', { class: 'bd-c', text: ':' }), el('div', { class: 'bd-v', text: r.v }));
  }
  function secEl(id, rows, p, L) {
    if (!rows.length) return null;
    var title = el('h3', { class: 'bd-sec-t' });
    title.innerHTML = BULLET;
    title.appendChild(el('span', { text: C[L].sec[id] }));
    if (p.bi && L !== 'en') title.appendChild(el('span', { class: 'en', text: '· ' + C.en.sec[id] }));
    var s = el('section', { class: 'bd-sec', 'data-sec': id }, title);
    rows.forEach(function (r) { s.appendChild(rowEl(r)); });
    return s;
  }
  function photoEl(p) {
    return el('div', { class: 'bd-photo sh-' + p.shape }, el('img', { src: p.photo, alt: '' }));
  }
  function buildSheet(p) {
    var L = labLang(p), info = EDU.langInfo(L), hasPhoto = !!p.photo && !p.hide.photo;
    var sheet = el('div', { class: 'bd-sheet no-i18n tpl-' + p.tpl + (hasPhoto ? '' : ' bd-nophoto'), lang: L, dir: info.dir });
    sheet.style.setProperty('--bd-font', fontStack(L));
    if (p.tpl === 'sidebar') sheet.appendChild(el('div', { class: 'bd-sidebg' }));
    var deco = el('div', { class: 'bd-deco', 'aria-hidden': 'true' }, el('div', { class: 'bd-frame' }), el('div', { class: 'bd-frame2' }));
    if (ORN[p.tpl]) deco.insertAdjacentHTML('beforeend', ORN[p.tpl]());
    sheet.appendChild(deco);
    var content = el('div', { class: 'bd-content' }), inner = el('div', { class: 'bd-inner' });
    content.appendChild(inner);
    sheet.appendChild(content);
    var add = function (box, node) { if (node) box.appendChild(node); };
    if (p.tpl === 'sidebar') {
      var side = el('div', { class: 'bd-side' }), main = el('div', { class: 'bd-main' });
      if (hasPhoto) side.appendChild(photoEl(p));
      var nm = val(p, 'name');
      if (nm && !p.hide.name) side.appendChild(el('div', { class: 'bd-name', 'data-k': 'name' }, el('span', { class: 'bd-v', text: nm })));
      add(side, secEl('contact', rowsFor('contact', p, L), p, L));
      main.appendChild(topEl(p, L));
      add(main, secEl('personal', rowsFor('personal', p, L, true), p, L));
      add(main, secEl('family', rowsFor('family', p, L), p, L));
      add(main, secEl('horoscope', rowsFor('horoscope', p, L), p, L));
      inner.appendChild(side);
      inner.appendChild(main);
    } else {
      inner.appendChild(topEl(p, L));
      var hero = el('div', { class: 'bd-hero' });
      hero.appendChild(secEl('personal', rowsFor('personal', p, L), p, L) || el('div'));
      if (hasPhoto) hero.appendChild(photoEl(p));
      inner.appendChild(hero);
      add(inner, secEl('family', rowsFor('family', p, L), p, L));
      add(inner, secEl('horoscope', rowsFor('horoscope', p, L), p, L));
      add(inner, secEl('contact', rowsFor('contact', p, L), p, L));
    }
    /* numbers, phones, e-mails and English text keep left-to-right order inside an Urdu (RTL) sheet */
    if (info.dir === 'rtl') $$('.bd-v', sheet).forEach(function (v) { if (!RTL_CHARS.test(v.textContent)) v.setAttribute('dir', 'ltr'); });
    return sheet;
  }
  var RTL_CHARS = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
  /* strong letters only (the Arabic comma and digits are not letters) */
  var RTL_LETTER = /[\u05D0-\u05EA\u0620-\u064A\u066E-\u06D3\u06D5\u06FA-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFB4F\uFB50-\uFD3D\uFD50-\uFDFF\uFE70-\uFEFC]/;
  var LTR_LETTER = /[A-Za-z\u00C0-\u02AF\u0370-\u052F\u0900-\u0DFF]/;

  /* text scale so everything fits on one page; measured off-screen (works while the preview is hidden on phones) */
  function fitSheet(sheet) {
    var content = sheet.querySelector('.bd-content'), inner = sheet.querySelector('.bd-inner');
    sheet.classList.remove('bd-grow');
    var avail = content.clientHeight - 4;
    function setK(k) { sheet.style.setProperty('--k', k.toFixed(4)); fitName(sheet); }
    function fits(k) { setK(k); return inner.offsetHeight <= avail; }
    sheet.style.setProperty('--sp', '1');
    if (fits(K_MAX)) {
      /* room to spare: spread the lines out a little so the page looks full and calm */
      var a = 1, b = 2.2;
      sheet.style.setProperty('--sp', String(b));
      if (fits(K_MAX)) a = b;
      else for (var j = 0; j < 7; j++) { var m2 = (a + b) / 2; sheet.style.setProperty('--sp', m2.toFixed(3)); if (fits(K_MAX)) a = m2; else b = m2; }
      sheet.style.setProperty('--sp', a.toFixed(3));
      setK(K_MAX);
      return { k: K_MAX, over: false };
    }
    if (!fits(K_MIN)) { sheet.classList.add('bd-grow'); setK(K_MIN); return { k: K_MIN, over: true }; }
    var lo = K_MIN, hi = K_MAX;
    for (var i = 0; i < 9; i++) { var mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    setK(lo);
    return { k: lo, over: false };
  }
  /* the name in the sidebar column: make the font smaller rather than break a word in the middle (Tamil, Telugu and
     Malayalam names are often one long word) */
  function fitName(sheet) {
    var nm = sheet.querySelector('.bd-side .bd-name');
    if (!nm) return;
    nm.style.fontSize = '';
    nm.style.overflowWrap = 'normal';
    var sw = nm.scrollWidth, cw = nm.clientWidth;
    if (sw > cw + 1) {
      /* jump straight to the size that fits the longest word, then fine-tune */
      var s = Math.max(0.95, Math.floor(145 * cw / sw) / 100);
      nm.style.fontSize = s.toFixed(2) + 'em';
      while (nm.scrollWidth > nm.clientWidth + 1 && s > 0.96) { s -= 0.05; nm.style.fontSize = s.toFixed(2) + 'em'; }
    }
    nm.style.overflowWrap = '';
  }
  function makeSheet(p, keep) {
    var root = $('#pngRoot');
    root.innerHTML = '';
    var sheet = buildSheet(p);
    root.appendChild(sheet);
    var fit = fitSheet(sheet);
    if (!keep) root.removeChild(sheet);
    return { sheet: sheet, fit: fit };
  }

  /* ---------------- preview ---------------- */
  var lastFit = { k: 1, over: false };
  function wantFonts(p) {
    ensureFont(EDU.langInfo(labLang(p)).font);
    if (p.sym === 'om') ensureFont('Noto Sans Devanagari');
    if (p.sym === 'ikonkar') ensureFont('Noto Sans Gurmukhi');
    if (p.sym === 'bismillah') ensureFont('Noto Naskh Arabic');
  }
  function renderPreview() {
    clearTimeout(pvT);
    var p = cur();
    wantFonts(p);
    var m = makeSheet(p);
    m.sheet.id = 'bdSheet';
    var box = $('#pvScale');
    box.innerHTML = '';
    box.appendChild(m.sheet);
    lastFit = m.fit;
    var b = $('#fitStatus');
    b.classList.toggle('warn', !!m.fit.over);
    b.textContent = m.fit.over ? '⚠ ' + t('fit_over') : m.fit.k < 0.995 ? t('fit_small', { p: Math.round(m.fit.k * 100) }) : '✓ ' + t('fit_ok');
    scalePreview();
  }
  var pvT = 0;
  function schedulePreview(ms) { clearTimeout(pvT); pvT = setTimeout(renderPreview, ms === undefined ? 140 : ms); }
  var wideMQ = window.matchMedia ? window.matchMedia('(min-width: 980px)') : null;
  function scalePreview() {
    var sheet = $('#bdSheet'), stage = $('#pvStage'), box = $('#pvScale');
    if (!sheet) return;
    var sw = stage.clientWidth - 20;
    if (sw <= 0) return;
    var sh = sheet.offsetHeight || H, k = Math.min(1, sw / W);
    var fs = document.fullscreenElement || document.webkitFullscreenElement;
    if (fs === stage) k = Math.min(sw / W, (window.innerHeight - 40) / sh);
    else if (wideMQ && wideMQ.matches) {
      var extra = $('#pvCard').offsetHeight - stage.offsetHeight;
      var avail = window.innerHeight - 64 - 24 - extra - 20;
      k = Math.max(0.42, Math.min(k, avail / H));
    }
    box.style.width = Math.floor(W * k) + 'px';
    box.style.height = Math.floor(sh * k) + 'px';
    sheet.style.transform = 'scale(' + k.toFixed(4) + ')';
  }

  /* ---------------- form ---------------- */
  function UI() { return isLang(EDU.lang) ? C[EDU.lang] : C.en; }
  function lbl(k) { return UI().l[k] || C.en.l[k] || k; }
  var ICON_EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>';
  var ICON_EYE_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M2 12s3.6-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.6 7-10 7c-2 0-3.7-.7-5.1-1.6M4 4l16 16"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>';

  function eyeBtn(shown, onToggle) {
    var b = el('button', { type: 'button', class: 'eye', 'aria-pressed': String(shown), 'aria-label': t('show_line'), title: t('show_line') });
    b.innerHTML = shown ? ICON_EYE : ICON_EYE_OFF;
    b.addEventListener('click', function () {
      var now = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(now));
      b.innerHTML = now ? ICON_EYE : ICON_EYE_OFF;
      onToggle(now);
    });
    return b;
  }
  function xBtn(onClick) {
    var b = el('button', { type: 'button', class: 'xbtn', 'aria-label': t('remove_line'), title: t('remove_line'), onclick: onClick });
    b.innerHTML = ICON_X;
    return b;
  }
  /* something the user typed changed: the example becomes their own profile */
  function touched() {
    var p = cur();
    if (p.sample) { p.sample = false; $('#sampleNote').hidden = true; }
    save();
    schedulePreview();
    var opt = $$('#profileSel option').filter(function (o) { return o.value === p.id; })[0];
    if (opt) opt.textContent = profName(p, profiles.indexOf(p));
  }
  function designChanged() { save(); schedulePreview(0); }
  function placeholderFor(k) {
    var s = UI().sample, v = s[SAMPLE_KEY[k] || k];
    return typeof v === 'string' && v ? t('eg', { x: v }) : '';
  }

  function fieldEl(F, p) {
    var k = F.k, id = 'f-' + k;
    var wrap = el('div', { class: 'fld' + (F.wide ? ' wide' : '') + (p.hide[k] ? ' off' : ''), 'data-k': k });
    wrap.appendChild(el('label', { for: id, text: lbl(k) }));
    var row = el('div', { class: 'fld-in' }), input;
    if (F.type === 'height') return heightField(p, wrap, row);
    if (F.type === 'manglik') {
      input = el('select', { id: id });
      input.appendChild(el('option', { value: '', text: t('not_set') }));
      ['no', 'yes', 'partial'].forEach(function (v) { input.appendChild(el('option', { value: v, text: UI().manglik[v] })); });
      input.value = p.f[k] || '';
      input.addEventListener('change', function () { if (input.value) p.f[k] = input.value; else delete p.f[k]; touched(); });
    } else {
      input = F.type === 'textarea' ? el('textarea', { id: id, rows: '2', class: 'no-i18n', maxlength: '300' })
        : el('input', { type: F.type || 'text', id: id, class: 'no-i18n', autocomplete: 'off', maxlength: '200', list: F.list });
      if (F.type === 'tel') input.setAttribute('inputmode', 'tel');
      input.value = p.f[k] === undefined ? '' : p.f[k];
      if (F.type !== 'date' && F.type !== 'time') { var ph = placeholderFor(k); if (ph) input.setAttribute('placeholder', ph); }
      input.addEventListener('input', function () {
        if (input.value === '') delete p.f[k]; else p.f[k] = input.value;
        if (k === 'dob') updateAge();
        touched();
      });
    }
    row.appendChild(input);
    row.appendChild(eyeBtn(!p.hide[k], function (on) { if (on) delete p.hide[k]; else p.hide[k] = true; wrap.classList.toggle('off', !on); touched(); }));
    wrap.appendChild(row);
    if (k === 'dob') wrap.appendChild(el('div', { class: 'age-line', id: 'ageLine', 'aria-live': 'polite' }));
    if (k === 'tob') {
      var seg = el('div', { class: 'seg sm', role: 'group', 'aria-label': lbl('tob') });
      [['t12', true, 'time_12'], ['t24', false, 'time_24']].forEach(function (o) {
        seg.appendChild(el('button', { type: 'button', id: 'tf-' + o[0], 'aria-pressed': String(p.t12 === o[1]), text: t(o[2]), onclick: function () {
          p.t12 = o[1];
          $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', String(b === this)); }, this);
          designChanged();
        } }));
      });
      wrap.appendChild(el('div', { class: 'mini-row' }, seg));
    }
    return wrap;
  }
  function updateAge() {
    var box = $('#ageLine'), p = cur();
    if (!box) return;
    box.innerHTML = '';
    var dob = p.f.dob, a = ageOf(dob);
    if (a === null) return;
    if (a < 0) { box.appendChild(el('span', { class: 'bad', text: t('age_bad') })); return; }
    box.appendChild(el('span', { class: 'badge primary', id: 'ageBadge', text: t('age_is', { age: fill(UI().years, { n: a }) }) }));
    var eb = eyeBtn(!p.hide.age, function (on) { if (on) delete p.hide.age; else p.hide.age = true; touched(); });
    eb.id = 'ageEye';
    box.appendChild(eb);
  }
  function heightField(p, wrap, row) {
    var cm = Math.round(+p.f.height) || 0, fi = cm ? ftIn(cm) : null;
    var num = function (id, min, max, v) { var i = el('input', { type: 'number', id: id, min: String(min), max: String(max), step: '1', inputmode: 'numeric', class: 'no-i18n' }); i.value = v === null ? '' : v; return i; };
    var ftI = num('f-height', 3, 8, fi ? fi.ft : null), inI = num('f-height-in', 0, 11, fi ? fi.inch : null), cmI = num('f-height-cm', 90, 250, cm || null);
    /* only a believable height is stored; a slip (1700 cm, -1 ft) is flagged and left off the biodata */
    function mark(bad, inputs) { [ftI, inI, cmI].forEach(function (x) { if (bad && inputs.indexOf(x) >= 0) x.setAttribute('aria-invalid', 'true'); else x.removeAttribute('aria-invalid'); }); }
    function fromFt() {
      var f = parseInt(ftI.value, 10), i = parseInt(inI.value, 10);
      f = isNaN(f) ? 0 : f; i = isNaN(i) ? 0 : i;
      var c = Math.round((f * 12 + i) * 2.54), empty = f === 0 && i === 0;
      var ok = !empty && f >= 0 && i >= 0 && okCm(c);
      if (ok) { p.f.height = c; cmI.value = c; } else { delete p.f.height; cmI.value = ''; }
      mark(!ok && !empty, [ftI, inI]);
      touched();
    }
    function fromCm(done) {
      var c = parseInt(cmI.value, 10), ok = okCm(c);
      if (ok) { p.f.height = c; var x = ftIn(c); ftI.value = x.ft; inI.value = x.inch; }
      else { delete p.f.height; ftI.value = ''; inI.value = ''; }
      /* while typing, flag only what more digits cannot fix (17 may still become 170); on leaving the box, flag any slip */
      mark(!ok && cmI.value !== '' && (done === true || isNaN(c) || c > CM_MAX || c * 10 > CM_MAX), [cmI]);
      if (done !== true) touched();
    }
    /* 5 ft 14 in becomes 6 ft 2 in when the user leaves the box */
    function tidyIn() {
      var f = parseInt(ftI.value, 10) || 0, i = parseInt(inI.value, 10);
      if (i >= 12 && p.f.height) { ftI.value = f + Math.floor(i / 12); inI.value = i % 12; }
    }
    ftI.addEventListener('input', fromFt); inI.addEventListener('input', fromFt); cmI.addEventListener('input', fromCm);
    inI.addEventListener('change', tidyIn);
    cmI.addEventListener('change', function () { fromCm(true); });
    var hg = el('div', { class: 'hgt' },
      el('label', {}, ftI, el('span', { text: t('ft') })),
      el('label', {}, inI, el('span', { text: t('inch') })),
      el('span', { class: 'muted', text: '=' }),
      el('label', {}, cmI, el('span', { text: t('cm_unit') })));
    row.appendChild(hg);
    row.appendChild(eyeBtn(!p.hide.height, function (on) { if (on) delete p.hide.height; else p.hide.height = true; wrap.classList.toggle('off', !on); touched(); }));
    wrap.appendChild(row);
    var sel = el('select', { id: 'hfmt' });
    [['both', 'hs_both'], ['ftin', 'hs_ftin'], ['cm', 'hs_cm']].forEach(function (o) { sel.appendChild(el('option', { value: o[0], text: t(o[1]) })); });
    sel.value = p.hfmt;
    sel.addEventListener('change', function () { p.hfmt = sel.value; designChanged(); });
    wrap.appendChild(el('div', { class: 'mini-row' }, el('label', { for: 'hfmt', text: t('height_show') }), sel));
    return wrap;
  }

  function sibBlock(p) {
    var wrap = el('div', { class: 'sibs' }, el('p', { class: 'sub-h', text: t('siblings') }));
    var list = el('div', { class: 'list', id: 'sibList' });
    p.sibs.forEach(function (s, i) {
      var sel = el('select', { class: 'sib-r', 'aria-label': t('relation') });
      REL.forEach(function (r, j) { sel.appendChild(el('option', { value: String(j), text: lbl(r) })); });
      sel.value = String(s.r);
      sel.addEventListener('change', function () { s.r = +sel.value; touched(); });
      var nm = el('input', { type: 'text', class: 'sib-n no-i18n', maxlength: '120', autocomplete: 'off', 'aria-label': t('sib_name'), placeholder: t('sib_name') });
      nm.value = s.name || '';
      nm.addEventListener('input', function () { s.name = nm.value; touched(); });
      var dt = el('input', { type: 'text', class: 'sib-d no-i18n', maxlength: '300', autocomplete: 'off', 'aria-label': t('sib_details'), placeholder: t('sib_details') });
      dt.value = s.details || '';
      dt.addEventListener('input', function () { s.details = dt.value; touched(); });
      list.appendChild(el('div', { class: 'sib' }, sel, nm,
        eyeBtn(!s.hide, function (on) { s.hide = !on; touched(); }),
        xBtn(function () { p.sibs.splice(i, 1); touched(); buildSections(); var a = $('#addSib'); if (a) a.focus(); }),
        dt));
    });
    wrap.appendChild(list);
    wrap.appendChild(el('div', { class: 'add-row' }, el('button', { type: 'button', class: 'btn btn-sm', id: 'addSib', text: '＋ ' + t('add_sibling'), onclick: function () {
      if (p.sibs.length >= 30) return;
      p.sibs.push({ r: p.sibs.length ? 4 : 0, name: '', details: '', hide: false });
      touched(); buildSections();
      var ins = $$('#sibList .sib-n'); if (ins.length) ins[ins.length - 1].focus();
    } })));
    return wrap;
  }

  function extrasBlock(S, p) {
    var wrap = el('div', { class: 'extras' });
    var list = el('div', { class: 'list', id: 'xl-' + S.id });
    (p.extra[S.id] || []).forEach(function (x, i) {
      var head;
      if (x.k === 'custom' || !has(C.en.l, x.k)) {
        head = el('input', { type: 'text', class: 'xl no-i18n', maxlength: '60', autocomplete: 'off', placeholder: t('line_label'), 'aria-label': t('line_label') });
        head.value = x.label || '';
        head.addEventListener('input', function () { x.label = head.value; touched(); });
      } else head = el('span', { class: 'xl', text: lbl(x.k) });
      var v = el('input', { type: 'text', class: 'xv no-i18n', maxlength: '400', autocomplete: 'off', placeholder: t('line_value'), 'aria-label': x.k === 'custom' ? t('line_value') : lbl(x.k) });
      v.value = x.v || '';
      v.addEventListener('input', function () { x.v = v.value; touched(); });
      list.appendChild(el('div', { class: 'xrow' }, head, v,
        eyeBtn(!x.hide, function (on) { x.hide = !on; touched(); }),
        xBtn(function () { p.extra[S.id].splice(i, 1); touched(); buildSections(); var s2 = $('#add-' + S.id); if (s2) s2.focus(); })));
    });
    wrap.appendChild(list);
    var sel = el('select', { id: 'add-' + S.id, 'aria-label': t('add_line') });
    S.extras.forEach(function (k) { sel.appendChild(el('option', { value: k, text: lbl(k) })); });
    sel.appendChild(el('option', { value: 'custom', text: t('custom_line') }));
    var btn = el('button', { type: 'button', class: 'btn btn-sm', id: 'addx-' + S.id, text: '＋ ' + t('add'), onclick: function () {
      if (p.extra[S.id].length >= 30) return;
      p.extra[S.id].push({ k: sel.value || 'custom', label: '', v: '', hide: false });
      touched(); buildSections();
      var rows = $$('#xl-' + S.id + ' .xrow');
      if (rows.length) { var last = rows[rows.length - 1]; (last.querySelector('input.xl') || last.querySelector('input.xv')).focus(); }
    } });
    wrap.appendChild(el('div', { class: 'add-row' }, el('span', { class: 'small muted', text: t('add_line') }), sel, btn));
    return wrap;
  }

  function buildSections() {
    var p = cur(), box = $('#secCards');
    box.innerHTML = '';
    SECS.forEach(function (S) {
      var card = el('div', { class: 'card', id: 'sec-' + S.id, style: { marginTop: '14px' } });
      var head = el('div', { class: 'sec-h' }, el('h2', { text: UI().sec[S.id] }));
      card.appendChild(head);
      var body = el('div', { class: 'sec-body' });
      if (S.id === 'horoscope') {
        var cb = el('input', { type: 'checkbox', id: 'horoOn' });
        cb.checked = !!p.horo;
        head.appendChild(el('label', { class: 'check' }, cb, el('span', { text: t('show_horoscope') })));
        card.appendChild(el('p', { class: 'hint mt0', style: { marginBottom: '10px' }, text: t('horoscope_hint') }));
        body.hidden = !p.horo;
        cb.addEventListener('change', function () { p.horo = cb.checked; body.hidden = !cb.checked; touched(); });
      }
      var grid = el('div', { class: 'fgrid' });
      S.fields.forEach(function (F) { grid.appendChild(fieldEl(F, p)); });
      body.appendChild(grid);
      if (S.id === 'family') body.appendChild(sibBlock(p));
      body.appendChild(extrasBlock(S, p));
      card.appendChild(body);
      box.appendChild(card);
    });
    updateAge();
  }

  /* ---------------- design card, photo card, profile bar ---------------- */
  var SYM_ICON = { om: OM, ikonkar: IKONKAR, custom: '✎' };
  function buildDesign() {
    var p = cur(), L = labLang(p);
    var tb = $('#tpls');
    tb.innerHTML = '';
    TPLS.forEach(function (id) {
      tb.appendChild(el('button', { type: 'button', class: 'tpl-btn', 'data-tpl': id, 'aria-pressed': String(p.tpl === id), onclick: function () {
        cur().tpl = id; syncDesign(); designChanged();
      } }, el('span', { class: 'tpl-thumb tpl-' + id, 'aria-hidden': 'true' }, el('i', { class: 'h' }), el('i'), el('i'), el('i', { class: 's' }), el('i'), el('i')),
      el('span', { text: t('tpl_' + id) })));
    });
    var sb = $('#syms');
    sb.innerHTML = '';
    SYMS.forEach(function (id) {
      var b = el('button', { type: 'button', class: 'chip sym-btn', 'data-sym': id, 'aria-pressed': String(p.sym === id), onclick: function () {
        cur().sym = id; syncDesign(); designChanged();
        if (id === 'custom') $('#symText').focus();
      } });
      if (id === 'cross') b.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 40 60" aria-hidden="true"><path fill="currentColor" d="M17 4 H23 V18 H34 V24 H23 V56 H17 V24 H6 V18 H17 Z"/></svg>');
      else if (id === 'buddha') b.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="22" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="30" cy="30" r="6" fill="currentColor"/><path stroke="currentColor" stroke-width="4" d="M30 8V52M8 30H52M14 14L46 46M46 14L14 46"/></svg>');
      else if (SYM_ICON[id]) b.appendChild(el('span', { class: 'g', 'aria-hidden': 'true', text: SYM_ICON[id] }));
      b.appendChild(el('span', { text: t('sym_' + id) }));
      sb.appendChild(b);
    });
    var ls = $('#labelLang');
    ls.innerHTML = '';
    ls.appendChild(el('option', { value: 'auto', text: t('label_auto', { l: EDU.langInfo(EDU.lang).native }) }));
    EDU.LANGS.forEach(function (l) { ls.appendChild(el('option', { value: l.code, text: l.native + (l.code === 'en' ? '' : ' (' + l.name + ')') })); });
    syncDesign();
  }
  function syncDesign() {
    var p = cur(), L = labLang(p);
    $$('#tpls .tpl-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-tpl') === p.tpl)); });
    $$('#syms .sym-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-sym') === p.sym)); });
    $('#symTextWrap').hidden = p.sym !== 'custom';
    $('#symText').value = p.symText || '';
    $('#symText').setAttribute('placeholder', C[L].ganesh);
    $('#heading').value = p.heading || '';
    $('#heading').setAttribute('placeholder', t('heading_ph', { h: C[L].heading }));
    $('#labelLang').value = p.lab || 'auto';
    $('#bilingual').checked = !!p.bi;
    $('#bilingual').disabled = L === 'en';
    fillDatalists();
  }
  function fillDatalists() {
    var L = labLang(cur());
    [['#dlRashi', C[L].rashis], ['#dlNak', C[L].nakshatras]].forEach(function (d) {
      var dl = $(d[0]);
      dl.innerHTML = '';
      d[1].forEach(function (v) { dl.appendChild(el('option', { value: v })); });
    });
  }
  function syncPhoto() {
    var p = cur(), has = !!p.photo, th = $('#photoThumb');
    th.hidden = !has;
    if (has) th.src = p.photo; else th.removeAttribute('src');
    $('#btnPhoto').textContent = t(has ? 'change_photo' : 'add_photo');
    $('#btnCrop').hidden = !has || !p.photoSrc;
    $('#btnPhotoDel').hidden = !has;
    $('#noPhoto').hidden = has;
    $$('#shapeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-shape') === p.shape)); });
  }
  function profName(p, i) { return String(p.f.name || '').trim() || t('profile_n', { n: i + 1 }); }
  function buildProfiles() {
    var s = $('#profileSel');
    s.innerHTML = '';
    profiles.forEach(function (p, i) { s.appendChild(el('option', { value: p.id, text: profName(p, i) })); });
    s.value = cur().id;
  }
  function renderAll() {
    buildProfiles();
    buildDesign();
    syncPhoto();
    buildSections();
    $('#sampleNote').hidden = !cur().sample;
    renderPreview();
  }

  /* ---------------- PNG: paint the laid-out sheet on a canvas ----------------
     Every box background, border, the photo, each SVG ornament and every word (at the exact spot the browser
     put it) is drawn in page order. Words are drawn one by one, so Indian scripts and Urdu keep their shaping. */
  var SEG = window.Intl && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  var HAS_LS = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;
  var SVG_PROPS = ['fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin'];

  function solid(c) { return c && c !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(c) ? c : null; }
  function radiusOf(cs, w, h) {
    var r = cs.borderTopLeftRadius || '0px';
    if (/%$/.test(r)) { var f = parseFloat(r) / 100; return { ellipse: f >= 0.5, r: Math.min(w, h) * f }; }
    return { ellipse: false, r: Math.min(parseFloat(r) || 0, w / 2, h / 2) };
  }
  function boxPath(g, x, y, w, h, rad, inset) {
    x += inset; y += inset; w -= inset * 2; h -= inset * 2;
    g.beginPath();
    if (w <= 0 || h <= 0) return;
    if (rad && rad.ellipse) { g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); return; }
    var r = rad ? Math.max(0, Math.min(rad.r - inset, w / 2, h / 2)) : 0;
    if (r > 0.5 && g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h);
  }
  function graphemes(s) {
    var out = [];
    if (SEG) { var it = SEG.segment(s)[Symbol.iterator](), n; while (!(n = it.next()).done) out.push({ s: n.value.segment, i: n.value.index }); return out; }
    var i = 0;
    Array.from(s).forEach(function (ch) { out.push({ s: ch, i: i }); i += ch.length; });
    return out;
  }
  function collect(root) {
    var base = root.getBoundingClientRect(), ops = [], rg = document.createRange();
    function rel(r) { return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }; }
    function words(tn, cs) {
      var s = tn.nodeValue;
      if (!/\S/.test(s)) return;
      var up = cs.textTransform === 'uppercase';
      var st = { font: cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily, color: cs.color, dir: cs.direction, ls: cs.letterSpacing };
      var stL = { font: st.font, color: st.color, dir: 'ltr', ls: st.ls };
      var re = /\S+/g, m;
      while ((m = re.exec(s))) {
        rg.setStart(tn, m.index); rg.setEnd(tn, m.index + m[0].length);
        var rects = rg.getClientRects();
        /* an English word on an Urdu sheet ("Sharma," "(SBI)"): the page orders its commas and brackets together with the
           words around it, so each letter is drawn where the page put it instead of letting the canvas re-order the word */
        var latin = st.dir === 'rtl' && LTR_LETTER.test(m[0]) && !RTL_LETTER.test(m[0]);
        if (rects.length === 1 && !latin) ops.push({ t: 'text', s: up ? m[0].toUpperCase() : m[0], r: rel(rects[0]), st: st });
        else if (rects.length >= 1) {
          graphemes(m[0]).forEach(function (gp) {
            rg.setStart(tn, m.index + gp.i); rg.setEnd(tn, m.index + gp.i + gp.s.length);
            var rr = rg.getClientRects();
            if (rr.length && rr[0].width > 0) ops.push({ t: 'text', s: up ? gp.s.toUpperCase() : gp.s, r: rel(rr[0]), st: latin ? stL : st });
          });
        }
      }
    }
    (function walk(node) {
      var cs = getComputedStyle(node);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      var r = rel(node.getBoundingClientRect()), tag = node.tagName.toLowerCase();
      if (tag === 'svg') { if (r.w > 0 && r.h > 0) ops.push({ t: 'svg', r: r, node: node }); return; }
      var rad = radiusOf(cs, r.w, r.h), bg = solid(cs.backgroundColor);
      if (bg && r.w > 0 && r.h > 0) ops.push({ t: 'fill', r: r, c: bg, rad: rad });
      var b = ['Top', 'Right', 'Bottom', 'Left'].map(function (sd) { return { w: parseFloat(cs['border' + sd + 'Width']) || 0, s: cs['border' + sd + 'Style'], c: cs['border' + sd + 'Color'] }; });
      if (b.some(function (x) { return x.w > 0 && x.s !== 'none' && x.s !== 'hidden'; })) ops.push({ t: 'border', r: r, b: b, rad: rad });
      if (tag === 'img') { if (node.complete && node.naturalWidth) ops.push({ t: 'img', r: r, node: node, rad: rad, bw: b[0].w }); return; }
      for (var ch = node.firstChild; ch; ch = ch.nextSibling) {
        if (ch.nodeType === 1) walk(ch);
        else if (ch.nodeType === 3) words(ch, cs);
      }
    })(root);
    return ops;
  }
  function svgImage(svg, r, S) {
    return new Promise(function (resolve, reject) {
      var clone = svg.cloneNode(true);
      var src = [svg].concat($$('*', svg)), dst = [clone].concat($$('*', clone));
      src.forEach(function (n, i) {
        var c = getComputedStyle(n), d = dst[i];
        SVG_PROPS.forEach(function (pr) { var v = c.getPropertyValue(pr); if (v) d.setAttribute(pr, v); });
        d.removeAttribute('class');
      });
      clone.removeAttribute('style');
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', String(Math.max(1, Math.round(r.w * S))));
      clone.setAttribute('height', String(Math.max(1, Math.round(r.h * S))));
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    });
  }
  function dash(g, x) {
    g.setLineDash(x.s === 'dashed' ? [x.w * 3, x.w * 2] : x.s === 'dotted' ? [0.01, x.w * 2] : []);
    g.lineCap = x.s === 'dotted' ? 'round' : 'butt';
  }
  function paintBorder(g, o) {
    var r = o.r, b = o.b;
    var ok = function (x) { return x.w > 0 && x.s !== 'none' && x.s !== 'hidden'; };
    var same = b.every(function (x) { return x.w === b[0].w && x.s === b[0].s && x.c === b[0].c; });
    if (same) {
      var x = b[0];
      if (!ok(x)) return;
      g.save(); g.strokeStyle = x.c;
      if (x.s === 'double') {
        var t3 = x.w / 3; g.lineWidth = t3;
        boxPath(g, r.x, r.y, r.w, r.h, o.rad, t3 / 2); g.stroke();
        boxPath(g, r.x, r.y, r.w, r.h, o.rad, x.w - t3 / 2); g.stroke();
      } else { dash(g, x); g.lineWidth = x.w; boxPath(g, r.x, r.y, r.w, r.h, o.rad, x.w / 2); g.stroke(); }
      g.restore();
      return;
    }
    var lines = [
      [r.x, r.y + b[0].w / 2, r.x + r.w, r.y + b[0].w / 2, b[0]],
      [r.x + r.w - b[1].w / 2, r.y, r.x + r.w - b[1].w / 2, r.y + r.h, b[1]],
      [r.x, r.y + r.h - b[2].w / 2, r.x + r.w, r.y + r.h - b[2].w / 2, b[2]],
      [r.x + b[3].w / 2, r.y, r.x + b[3].w / 2, r.y + r.h, b[3]]
    ];
    lines.forEach(function (ln) {
      var x = ln[4];
      if (!ok(x)) return;
      g.save(); dash(g, x); g.strokeStyle = x.c; g.lineWidth = x.w;
      g.beginPath(); g.moveTo(ln[0], ln[1]); g.lineTo(ln[2], ln[3]); g.stroke();
      g.restore();
    });
  }
  function paintText(g, o) {
    var st = o.st, r = o.r;
    g.save();
    g.font = st.font; g.fillStyle = st.color; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.direction = st.dir === 'rtl' ? 'rtl' : 'ltr';
    if (HAS_LS && st.ls && st.ls !== 'normal') g.letterSpacing = st.ls;
    var m = g.measureText(o.s), asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    if (!(asc > 0)) { asc = r.h * 0.78; desc = r.h * 0.22; }
    var y = r.y + (r.h - (asc + desc)) / 2 + asc, sx = m.width > 0 ? r.w / m.width : 1;
    if (sx > 0.85 && sx < 1.15 && Math.abs(sx - 1) > 0.01) { g.translate(r.x, y); g.scale(sx, 1); g.fillText(o.s, 0, 0); }
    else g.fillText(o.s, r.x, y);
    g.restore();
  }
  function paintImg(g, o) {
    var r = o.r, b = o.bw || 0, im = o.node, iw = im.naturalWidth, ih = im.naturalHeight;
    var x = r.x + b, y = r.y + b, w = r.w - 2 * b, h = r.h - 2 * b;
    if (w <= 0 || h <= 0) return;
    var k = Math.max(w / iw, h / ih), sw = w / k, sh = h / k;
    g.save();
    boxPath(g, r.x, r.y, r.w, r.h, o.rad, b);
    g.clip();
    g.drawImage(im, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
    g.restore();
  }
  function rasterize(root, S) {
    var ops = collect(root);
    var cw = Math.ceil(root.offsetWidth), ch = Math.ceil(root.offsetHeight);
    var cv = document.createElement('canvas');
    cv.width = cw * S; cv.height = ch * S;
    var g = cv.getContext('2d');
    g.scale(S, S);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, cw, ch);
    var loads = ops.filter(function (o) { return o.t === 'svg'; }).map(function (o) {
      return svgImage(o.node, o.r, S).then(function (img) { o.img = img; }, function () { });
    });
    return Promise.all(loads).then(function () {
      ops.forEach(function (o) {
        try {
          if (o.t === 'fill') { g.fillStyle = o.c; boxPath(g, o.r.x, o.r.y, o.r.w, o.r.h, o.rad, 0); g.fill(); }
          else if (o.t === 'border') paintBorder(g, o);
          else if (o.t === 'img') paintImg(g, o);
          else if (o.t === 'svg') { if (o.img) g.drawImage(o.img, o.r.x, o.r.y, o.r.w, o.r.h); }
          else if (o.t === 'text') paintText(g, o);
        } catch (e) { /* one bad item must not stop the picture */ }
      });
      return cv;
    });
  }
  function fileBase(p) {
    var n = String(p.f.name || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
    return 'biodata' + (n ? '-' + n : '');
  }
  function decodeAll(root) {
    return Promise.all($$('img', root).map(function (im) { return im.decode ? im.decode().catch(function () { }) : null; }));
  }
  var pngBusy = false;
  function savePng() {
    if (pngBusy) return;
    pngBusy = true;
    EDU.toast(t('png_wait'), 1500);
    var p = cur(), m = makeSheet(p, true), root = $('#pngRoot');
    function end() { root.innerHTML = ''; pngBusy = false; }
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([fontsReady, decodeAll(m.sheet)]).then(function () { return rasterize(m.sheet, 2); }).then(function (cv) {
      return new Promise(function (res) { cv.toBlob(res, 'image/png'); });
    }).then(function (blob) {
      end();
      if (!blob) throw new Error('no image');
      EDU.download(fileBase(p) + '.png', blob);
      EDU.toast(t('png_done'));
    }).catch(function (e) {
      end();
      console.warn('[biodata png]', e);
      EDU.toast(t('png_fail'), 6000);
    });
  }

  /* ---------------- print: one A4 page (the browser's "Save as PDF" makes the PDF) ---------------- */
  var printBy = 0;
  function preparePrint() {
    var m = makeSheet(cur());
    var root = $('#printRoot');
    root.innerHTML = '';
    root.appendChild(m.sheet);
    return m.sheet;
  }
  function doPrint() {
    var sheet = preparePrint();
    printBy = Date.now();
    decodeAll(sheet).then(function () {
      printBy = Date.now();
      try { window.print(); } catch (e) { }
    });
  }
  window.addEventListener('beforeprint', function () { if (Date.now() - printBy > 15000) preparePrint(); });
  window.addEventListener('afterprint', function () { printBy = 0; });

  /* ---------------- photo: read on the device, shrink, crop to 4:5 ---------------- */
  var FW = 240, FH = 300;
  function loadImg(src) {
    return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = src; });
  }
  function shrink(dataUrl, max) {
    return loadImg(dataUrl).then(function (im) {
      var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, max / Math.max(w, h));
      if (!w || !h) throw new Error('empty image');
      var cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k));
      var g = cv.getContext('2d');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, cv.width, cv.height);
      g.drawImage(im, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/jpeg', 0.86);
    });
  }
  function cropGeom(im, c) {
    var iw = im.naturalWidth, ih = im.naturalHeight, s = Math.max(FW / iw, FH / ih) * c.z;
    var dw = iw * s, dh = ih * s, hx = FW / 2 / dw, hy = FH / 2 / dh;
    c.cx = EDU.clamp(c.cx, hx, 1 - hx); c.cy = EDU.clamp(c.cy, hy, 1 - hy);
    return { s: s, x: FW / 2 - c.cx * dw, y: FH / 2 - c.cy * dh, iw: iw, ih: ih };
  }
  function cropToData(im, c) {
    var gm = cropGeom(im, c), cv = document.createElement('canvas');
    cv.width = 480; cv.height = 600;
    var g = cv.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 480, 600);
    g.drawImage(im, -gm.x / gm.s, -gm.y / gm.s, FW / gm.s, FH / gm.s, 0, 0, 480, 600);
    return cv.toDataURL('image/jpeg', 0.88);
  }
  function photoChanged() { saveNow(); syncPhoto(); schedulePreview(0); }
  function openCrop() {
    var p = cur();
    if (!p.photoSrc) return;
    loadImg(p.photoSrc).then(function (im) {
      var c = p.crop ? { z: p.crop.z, cx: p.crop.cx, cy: p.crop.cy } : { z: 1, cx: 0.5, cy: 0.42 };
      var frame = el('div', { class: 'crop-frame', id: 'cropFrame', tabindex: '0', role: 'group', 'aria-label': t('crop_hint') });
      var pic = el('img', { src: p.photoSrc, alt: '' });
      frame.appendChild(pic);
      var zoom = el('input', { type: 'range', id: 'cropZoom', min: '1', max: '4', step: '0.01' });
      zoom.value = c.z;
      function draw() {
        var gm = cropGeom(im, c);
        pic.style.width = gm.iw + 'px'; pic.style.height = gm.ih + 'px';
        pic.style.transform = 'translate(' + gm.x.toFixed(1) + 'px,' + gm.y.toFixed(1) + 'px) scale(' + gm.s.toFixed(5) + ')';
      }
      function move(dx, dy) { var gm = cropGeom(im, c); c.cx -= dx / (gm.iw * gm.s); c.cy -= dy / (gm.ih * gm.s); draw(); }
      function setZoom(z) { c.z = EDU.clamp(z, 1, 4); zoom.value = c.z; draw(); }
      zoom.addEventListener('input', function () { setZoom(+zoom.value); });
      var drag = null;
      frame.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; try { frame.setPointerCapture(e.pointerId); } catch (er) { } e.preventDefault(); });
      frame.addEventListener('pointermove', function (e) { if (!drag) return; move(e.clientX - drag.x, e.clientY - drag.y); drag = { x: e.clientX, y: e.clientY }; });
      ['pointerup', 'pointercancel'].forEach(function (ev) { frame.addEventListener(ev, function () { drag = null; }); });
      frame.addEventListener('wheel', function (e) { e.preventDefault(); setZoom(c.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); }, { passive: false });
      frame.addEventListener('keydown', function (e) {
        var k = e.key, step = e.shiftKey ? 40 : 10;
        if (k === 'ArrowLeft') move(step, 0); else if (k === 'ArrowRight') move(-step, 0);
        else if (k === 'ArrowUp') move(0, step); else if (k === 'ArrowDown') move(0, -step);
        else if (k === '+' || k === '=') setZoom(c.z * 1.1); else if (k === '-' || k === '_') setZoom(c.z / 1.1);
        else return;
        e.preventDefault();
      });
      var done = el('button', { type: 'button', class: 'btn btn-primary', id: 'cropDone', text: t('done') });
      var cancel = el('button', { type: 'button', class: 'btn', text: t('cancel') });
      var body = el('div', {},
        el('p', { class: 'hint mt0', text: t('crop_hint') }),
        frame,
        el('div', { class: 'crop-ctl' }, el('label', { for: 'cropZoom', text: t('zoom') }), zoom),
        el('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '14px' } }, cancel, done));
      var close = EDU.modal(body, { title: t('crop_title') });
      cancel.addEventListener('click', function () { close(); });
      done.addEventListener('click', function () {
        try { p.photo = cropToData(im, c); p.crop = { z: c.z, cx: c.cx, cy: c.cy }; } catch (e) { EDU.toast(t('photo_bad')); }
        close(); photoChanged();
        $('#btnPhoto').focus();
      });
      draw();
      setTimeout(function () { frame.focus(); }, 30);
    }, function () { EDU.toast(t('photo_bad')); });
  }
  $('#btnPhoto').addEventListener('click', function () {
    EDU.pickFile('image/*').then(function (file) {
      if (!file) return;
      var r = new FileReader();
      r.onload = function () {
        shrink(String(r.result), 1000).then(function (src) {
          return loadImg(src).then(function (im) {
            var p = cur(), c = { z: 1, cx: 0.5, cy: 0.42 };
            p.photoSrc = src; p.crop = c; p.photo = cropToData(im, c);
            photoChanged();
            openCrop();
          });
        }).catch(function () { EDU.toast(t('photo_bad'), 5000); });
      };
      r.onerror = function () { EDU.toast(t('photo_bad'), 5000); };
      r.readAsDataURL(file);
    });
  });
  $('#btnCrop').addEventListener('click', openCrop);
  $('#btnPhotoDel').addEventListener('click', function () { var p = cur(); p.photo = null; p.photoSrc = null; p.crop = null; photoChanged(); $('#btnPhoto').focus(); });
  $$('#shapeSeg button').forEach(function (b) {
    b.addEventListener('click', function () { cur().shape = b.getAttribute('data-shape'); syncPhoto(); designChanged(); });
  });

  /* ---------------- design inputs ---------------- */
  $('#symText').addEventListener('input', function () { cur().symText = this.value; save(); schedulePreview(); });
  $('#heading').addEventListener('input', function () { cur().heading = this.value; save(); schedulePreview(); });
  $('#labelLang').addEventListener('change', function () { cur().lab = this.value; syncDesign(); designChanged(); });
  $('#bilingual').addEventListener('change', function () { cur().bi = this.checked; designChanged(); });

  /* ---------------- profiles ---------------- */
  function hasContent(p) {
    return Object.keys(p.f).some(function (k) { return String(p.f[k]).trim() !== ''; }) || p.sibs.length > 0 ||
      Object.keys(p.extra).some(function (s) { return p.extra[s].length > 0; });
  }
  function switchTo(id) { curId = id; saveNow(); renderAll(); }
  $('#profileSel').addEventListener('change', function () { switchTo(this.value); });
  $('#btnNew').addEventListener('click', function () {
    var p = blank(), c = cur();
    p.tpl = c.tpl; p.lab = c.lab; p.bi = c.bi;
    profiles.push(p); switchTo(p.id);
    var f = $('#f-name'); if (f) f.focus();
  });
  $('#btnDup').addEventListener('click', function () {
    var p = normalize(JSON.parse(JSON.stringify(cur())));
    p.id = uid(); p.sample = false;
    profiles.splice(profiles.indexOf(cur()) + 1, 0, p);
    switchTo(p.id);
  });
  $('#btnDel').addEventListener('click', function () {
    var p = cur(), i = profiles.indexOf(p);
    if (!confirm(t('confirm_delete', { name: profName(p, i) }))) return;
    profiles.splice(i, 1);
    if (!profiles.length) profiles.push(blank());
    switchTo(profiles[Math.max(0, i - 1)].id);
  });
  $('#btnBlank').addEventListener('click', function () {
    var p = cur();
    if (hasContent(p) && !p.sample && !confirm(t('confirm_blank'))) return;
    clearContent(p);
    saveNow(); renderAll();
    var f = $('#f-name'); if (f) f.focus();
  });
  $('#btnSample').addEventListener('click', function () {
    var p = sampleInto(blank(), EDU.lang), c = cur();
    p.tpl = c.tpl;
    profiles.push(p); switchTo(p.id);
  });

  /* ---------------- backup / restore / clear all ---------------- */
  $('#btnBackup').addEventListener('click', function () {
    saveNow();
    var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var name = 'biodata-backup-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.json';
    EDU.download(name, JSON.stringify({ app: SLUG, v: 1, saved: d.toISOString(), profiles: profiles }, null, 1), 'application/json');
    EDU.toast(t('backup_done'), 4000);
  });
  $('#btnRestore').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (file) {
      if (!file) return;
      return EDU.readText(file).then(function (txt) {
        var data = null;
        try { data = JSON.parse(String(txt).replace(/^﻿/, '')); } catch (e) { }
        var list = data && data.app === SLUG && Array.isArray(data.profiles) ? data.profiles.map(normalize).filter(Boolean) : [];
        if (!list.length) { EDU.toast(t('restore_bad'), 5000); return; }
        var onlySample = profiles.length === 1 && (profiles[0].sample || !hasContent(profiles[0])) && !profiles[0].photo;
        list.forEach(function (p) { p.id = uid(); p.sample = false; });
        var before = profiles, beforeId = curId;
        profiles = onlySample ? list : profiles.concat(list);
        curId = list[0].id;
        /* show it first and only save when it rendered: a broken file must never be stored (it would break every later visit) */
        try { renderAll(); } catch (e) {
          console.warn('[biodata restore]', e);
          profiles = before; curId = beforeId; renderAll();
          EDU.toast(t('restore_bad'), 5000);
          return;
        }
        saveNow();
        EDU.toast(t('restore_done', { n: EDU.fmt(list.length) }), 4000);
      });
    }).catch(function () { EDU.toast(t('restore_bad'), 5000); });
  });
  $('#btnClearAll').addEventListener('click', function () {
    if (!confirm(t('confirm_clear_all'))) return;
    store.remove('profiles'); store.remove('cur');
    profiles = [blank()];
    curId = profiles[0].id;
    saveNow(); renderAll();
    EDU.toast(t('cleared'), 4000);
  });

  /* ---------------- output buttons, phone tabs ---------------- */
  $('#btnPrint').addEventListener('click', doPrint);
  $('#btnFs').addEventListener('click', function () { EDU.fullscreen($('#pvStage')); });
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) { document.addEventListener(ev, function () { setTimeout(scalePreview, 60); }); });
  $('#btnPng').addEventListener('click', savePng);
  function setView(v) {
    var app = $('#app');
    app.classList.toggle('v-edit', v === 'edit');
    app.classList.toggle('v-preview', v === 'preview');
    $('#tabEdit').setAttribute('aria-pressed', String(v === 'edit'));
    $('#tabPreview').setAttribute('aria-pressed', String(v === 'preview'));
    if (v === 'preview') scalePreview();
  }
  $('#tabEdit').addEventListener('click', function () { setView('edit'); });
  $('#tabPreview').addEventListener('click', function () { setView('preview'); });
  $('#goPreview').addEventListener('click', function () { setView('preview'); $('#tabPreview').scrollIntoView({ block: 'start' }); });

  /* ---------------- start ---------------- */
  EDU.onLang(function () {
    var p = cur();
    if (p.sample) sampleInto(p, EDU.lang);
    renderAll();
  });
  var rT = 0;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(scalePreview, 80); });
  if (document.fonts && document.fonts.addEventListener) {
    var fT = 0;
    document.fonts.addEventListener('loadingdone', function () { clearTimeout(fT); fT = setTimeout(renderPreview, 120); });
  }
  /* a saved profile that cannot be shown must not lock the user out: open a fresh example next to it
     (their profiles stay in the list, so Backup and Clear all keep working) */
  try { renderAll(); } catch (e) {
    console.warn('[biodata start]', e);
    var fresh = sampleInto(blank(), EDU.lang);
    profiles.push(fresh); curId = fresh.id;
    renderAll();
  }
})();
