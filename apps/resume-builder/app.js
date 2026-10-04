/* Resume & CV Builder: form-based resume builder with a live A4 preview.
   Everything stays on this device (EDU.store). Printing uses the browser's own "Save as PDF",
   which shapes every Indian script correctly. Resume headings come from content.js in the
   "language of headings" the user picks; the user's own text is never translated. */
(function () {
  'use strict';
  var SLUG = 'resume-builder';
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc;
  var store = EDU.store(SLUG);
  var C = window.APP_CONTENT;

  var TEMPLATES = ['ats', 'ats2', 'fresher', 'modern', 'govt'];
  var ATS = { ats: 1, ats2: 1 };
  var ORDER = ['summary', 'experience', 'internships', 'projects', 'education', 'skills', 'certs', 'languages', 'achievements'];
  var SIDE = { skills: 1, languages: 1, certs: 1 };          /* sidebar sections in the Modern template */
  var LIST_SECS = { experience: 1, internships: 1, projects: 1, education: 1, certs: 1 };
  var FIELDS = {
    experience: ['role', 'org', 'place', 'start', 'end', 'current', 'bullets'],
    internships: ['role', 'org', 'place', 'start', 'end', 'current', 'bullets'],
    projects: ['title', 'tech', 'link', 'bullets'],
    education: ['degree', 'inst', 'board', 'year', 'score', 'type'],
    certs: ['name', 'issuer', 'year']
  };
  var ADD_KEY = { experience: 'add_job', internships: 'add_intern', projects: 'add_project', education: 'add_edu', certs: 'add_cert' };
  var MAX_ITEMS = 40;                       /* entries per section (more is never a real resume) */
  var PERSONAL_KEYS = ['phone', 'email', 'address', 'dob', 'father', 'photo', 'ctc_cur', 'ctc_exp'];
  var MM = 96 / 25.4;                       /* CSS px per mm */
  var PAGE_PAD_Y = 12 * MM;                 /* matches .rb-page padding and @page margin */
  var PAGE_BODY_H = (297 - 24) * MM;        /* printable height of one A4 page */

  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  /* ---------------- model ---------------- */
  var uid = function () { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  function str(v, max) { return v == null ? '' : String(v).slice(0, max || 4000); }
  /* a real language code from content.js (never an inherited name such as "toString" from a hand-edited file) */
  function isLang(code) { return typeof code === 'string' && Object.prototype.hasOwnProperty.call(C, code); }
  function content(code) { return isLang(code) ? C[code] : C.en; }

  function blankContact() {
    return { name: '', title: '', phone: '', email: '', city: '', address: '', links: '', photo: '', dob: '', father: '', nationality: '', notice: '', ctc_cur: '', ctc_exp: '', place: '', date: '' };
  }
  function blankItem(sec) {
    var it = { id: uid() };
    FIELDS[sec].forEach(function (f) { it[f] = f === 'current' ? false : (f === 'type' ? 'pct' : ''); });
    return it;
  }
  function blankResume(lang, tpl) {
    return {
      id: uid(), name: '', tpl: tpl || 'ats', lang: lang || 'en', sample: null,
      opts: { photo: false, personal: false, job: false, decl: false },
      c: blankContact(), summary: '', skills: '', languages: '', achievements: '',
      experience: [], internships: [], projects: [], education: [], certs: [],
      order: ORDER.slice(), hidden: {}, collapsed: {}
    };
  }
  function sampleResume(lang, keep) {
    var S = content(lang).sample;
    var r = blankResume(lang, keep && keep.tpl);
    if (keep) { r.id = keep.id; r.name = keep.name; r.opts = keep.opts; r.order = keep.order; r.hidden = keep.hidden; r.collapsed = keep.collapsed; }
    r.sample = lang;
    r.c.name = S.name; r.c.title = S.title; r.c.city = S.city;
    r.c.phone = '+91 98765 43210'; r.c.email = 'priya.sharma@example.com'; r.c.links = 'linkedin.com/in/priya-sharma';
    r.summary = S.summary;
    function jobs(arr) {
      return arr.map(function (j) { return { id: uid(), role: j.role, org: j.org, place: j.place, start: j.start, end: j.end, current: !j.end, bullets: j.bullets.join('\n') }; });
    }
    r.experience = jobs(S.exp);
    r.internships = jobs(S.intern);
    r.projects = S.projects.map(function (p) { return { id: uid(), title: p.title, tech: p.tech, link: '', bullets: p.bullets.join('\n') }; });
    r.education = S.edu.map(function (e) { return { id: uid(), degree: e.degree, inst: e.inst, board: e.board, year: e.year, score: e.score, type: e.type }; });
    r.certs = S.certs.map(function (c) { return { id: uid(), name: c.name, issuer: c.issuer, year: c.year }; });
    r.skills = S.skills; r.languages = S.languages; r.achievements = S.achievements.join('\n');
    return r;
  }
  /* Make any stored or imported object safe to use (missing fields, wrong types, unknown values). */
  function normalize(o) {
    var r = blankResume();
    if (!o || typeof o !== 'object') return r;
    r.id = typeof o.id === 'string' && o.id ? o.id : uid();
    r.name = str(o.name, 80);
    r.tpl = TEMPLATES.indexOf(o.tpl) >= 0 ? o.tpl : 'ats';
    r.lang = isLang(o.lang) ? o.lang : 'en';
    r.sample = isLang(o.sample) ? o.sample : null;
    var op = o.opts || {};
    Object.keys(r.opts).forEach(function (k) { r.opts[k] = !!op[k]; });
    var c = o.c || {};
    Object.keys(r.c).forEach(function (k) { r.c[k] = str(c[k], k === 'photo' ? 400000 : 600); });
    if (r.c.photo && !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(r.c.photo)) r.c.photo = '';
    ['summary', 'skills', 'languages', 'achievements'].forEach(function (k) { r[k] = str(o[k], 6000); });
    Object.keys(LIST_SECS).forEach(function (sec) {
      r[sec] = (Array.isArray(o[sec]) ? o[sec] : []).slice(0, MAX_ITEMS).map(function (x) {
        var it = blankItem(sec);
        if (x && typeof x === 'object') FIELDS[sec].forEach(function (f) {
          if (f === 'current') it[f] = !!x[f];
          else if (f === 'type') it[f] = x[f] === 'cgpa' ? 'cgpa' : 'pct';
          else it[f] = str(x[f], f === 'bullets' ? 6000 : 300);
        });
        return it;
      });
    });
    var ord = Array.isArray(o.order) ? o.order.filter(function (s, i, a) { return ORDER.indexOf(s) >= 0 && a.indexOf(s) === i; }) : [];
    ORDER.forEach(function (s) { if (ord.indexOf(s) < 0) ord.push(s); });
    r.order = ord;
    ORDER.forEach(function (s) { if (o.hidden && o.hidden[s]) r.hidden[s] = true; if (o.collapsed && o.collapsed[s]) r.collapsed[s] = true; });
    return r;
  }

  /* ---------------- storage ---------------- */
  var stored = store.get('resumes', []);
  var resumes = (Array.isArray(stored) ? stored : []).map(normalize);
  var currentId = store.get('current', null);
  if (!resumes.length) resumes = [sampleResume('en')];
  var R = resumes.filter(function (x) { return x.id === currentId; })[0] || resumes[0];
  var saveTimer = null, warnedFull = false;
  function saveNow() {
    clearTimeout(saveTimer); saveTimer = null;
    var ok = store.set('resumes', resumes);
    store.set('current', R.id);
    if (!ok && !warnedFull) { warnedFull = true; EDU.toast(t('save_fail'), 6000); }
    if (ok) warnedFull = false;
  }
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 350); }
  window.addEventListener('pagehide', function () { if (saveTimer) saveNow(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && saveTimer) saveNow(); });

  /* the user changed something: the resume is theirs now, not the untouched example */
  function touched() {
    if (R.sample) { R.sample = null; $('#sampleNote').hidden = true; }
    save(); schedulePreview();
  }

  /* ---------------- helpers ---------------- */
  var H = function () { return content(R.lang); };
  function lines(s) { return String(s || '').split(/\r?\n/).map(function (x) { return x.replace(/^\s*[-•*●▪·]\s*/, '').trim(); }).filter(Boolean); }
  function commaList(s) { return String(s || '').split(/[,،\n]/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function fmtDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || ''); }
  function phoneDigits(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length === 12 && d.slice(0, 2) === '91') d = d.slice(2);
    else if (d.length === 11 && d[0] === '0') d = d.slice(1);
    return d;
  }
  function formatPhone(v) {
    v = String(v || '').trim();
    if (!v) return '';
    if (/^\+(?!91)/.test(v.replace(/\s/g, ''))) return v;          /* another country's number: leave it */
    var d = phoneDigits(v);
    return d.length === 10 ? '+91 ' + d.slice(0, 5) + ' ' + d.slice(5) : v;
  }
  function phoneBad(v) {
    v = String(v || '').trim();
    if (!v || /^\+(?!91)/.test(v.replace(/\s/g, ''))) return false;
    return phoneDigits(v).length !== 10;
  }
  /* "8.4" -> "CGPA 8.4/10", "85" -> "85%"; anything that is not a plain number ("8.4/10", "A1",
     "First Division", "9.2 out of 10") is shown exactly as typed */
  function scoreText(e) {
    var s = String(e.score || '').trim();
    if (e.type === 'cgpa') s = s.replace(/^cgpa\s*[:\-]?\s*/i, '');
    if (!s) return '';
    var num = /^\d{1,3}([.,]\d{1,3})?$/.test(s);
    if (e.type === 'cgpa') return H().l.cgpa + ' ' + (num ? s + '/10' : s);
    return num ? s + '%' : s;
  }
  function hasItem(sec, it) {
    return FIELDS[sec].some(function (f) { return f !== 'current' && f !== 'type' && String(it[f] || '').trim(); });
  }
  function secHasContent(sec) {
    if (LIST_SECS[sec]) return R[sec].some(function (it) { return hasItem(sec, it); });
    return !!String(R[sec] || '').trim();
  }
  function personalHas() { return ['dob', 'father', 'nationality', 'address'].some(function (k) { return String(R.c[k] || '').trim(); }); }
  function jobHas() { return ['notice', 'ctc_cur', 'ctc_exp'].some(function (k) { return String(R.c[k] || '').trim(); }); }
  function photoShown() { return R.opts.photo && R.c.photo && !ATS[R.tpl]; }

  /* ================= the form ================= */
  var secRoot = $('#sections');
  var lastField = null;

  function displayName(r) {
    var n = r.name || r.c.name || t('untitled');
    return r.name ? n : n + (r.c.title ? ' · ' + r.c.title : '');
  }
  function renderPicker() {
    var sel = $('#resumeSel');
    sel.innerHTML = '';
    resumes.forEach(function (r) { sel.appendChild(el('option', { value: r.id, text: displayName(r) })); });
    sel.value = R.id;
    $('#delResume').disabled = false;
  }
  function renderDesign() {
    $('#resumeName').value = R.name;
    var list = $('#tplList');
    list.innerHTML = '';
    TEMPLATES.forEach(function (id) {
      var inp = el('input', { type: 'radio', name: 'tpl', value: id, id: 'tpl-' + id });
      inp.checked = R.tpl === id;
      list.appendChild(el('label', { class: 'rb-tpl', for: 'tpl-' + id }, inp,
        el('span', { class: 'rb-thumb t-' + id, 'aria-hidden': 'true' }),
        el('span', null, el('b', { text: t('tpl_' + id) }), el('small', { text: t('tpl_' + id + '_d') }))));
    });
    var hl = $('#headLang');
    if (!hl.options.length) EDU.LANGS.forEach(function (l) { hl.appendChild(el('option', { value: l.code, text: l.native })); });
    hl.value = R.lang;
    $('#optPhoto').checked = R.opts.photo; $('#optPersonal').checked = R.opts.personal;
    $('#optJob').checked = R.opts.job; $('#optDecl').checked = R.opts.decl;
    $('#atsPhotoNote').hidden = !(R.opts.photo && ATS[R.tpl]);
    $('#sampleNote').hidden = !R.sample;
  }
  function renderVerbs() {
    var box = $('#verbList');
    box.innerHTML = '';
    H().verbs.forEach(function (v) {
      box.appendChild(el('button', { type: 'button', class: 'chip', text: v, lang: R.lang, onclick: function () { insertVerb(v); } }));
    });
  }

  /* ---- small builders ---- */
  function fieldWrap(labelKey, ctrl, cls, extra) {
    return el('label', { class: 'field' + (cls ? ' ' + cls : ''), for: ctrl.id }, el('span', { text: t(labelKey) }), ctrl, extra || null);
  }
  function textInput(id, value, attrs) {
    var i = el('input', Object.assign({ type: 'text', id: id, dir: 'auto', autocomplete: 'off', maxlength: 300 }, attrs || {}));
    i.value = value || '';
    return i;
  }
  function textArea(id, value, attrs) {
    var a = el('textarea', Object.assign({ id: id, dir: 'auto', rows: 4, maxlength: 6000 }, attrs || {}));
    a.value = value || '';
    return a;
  }
  function cField(k, labelKey, ph, cls, attrs) {
    var i = textInput('f-' + k, R.c[k], Object.assign({ 'data-bind': 'c.' + k, placeholder: ph ? t(ph) : null }, attrs || {}));
    return fieldWrap(labelKey, i, cls);
  }
  function hintsLine(kind, ta, aiFn) {
    var hints = el('div', { class: 'rb-hints', 'aria-live': 'polite' });
    ta.dataset.hints = kind;
    ta._hints = hints;
    var row = el('div', { class: 'rb-help-line' }, hints);
    if (aiFn) row.appendChild(el('button', { type: 'button', class: 'btn btn-sm', title: t('ai_hint'), onclick: aiFn },
      el('span', { 'aria-hidden': 'true', text: '✨' }), ' ', el('span', { text: t('ai_btn') })));
    updateHints(ta);
    return row;
  }
  function updateHints(ta) {
    var box = ta._hints;
    if (!box) return;
    var v = ta.value, out = [];
    if (ta.dataset.hints === 'summary') {
      out.push(v.length > 450 ? ['warn', t('chars_long', { n: EDU.fmt(v.length), max: EDU.fmt(450) })] : ['', t('chars', { n: EDU.fmt(v.length) })]);
    } else {
      var ls = lines(v), longest = 0;
      ls.forEach(function (l) { longest = Math.max(longest, l.length); });
      out.push(longest > 200 ? ['warn', t('chars_long', { n: EDU.fmt(longest), max: EDU.fmt(200) })] : ['', t('chars', { n: EDU.fmt(v.length) })]);
      var noNum = ls.filter(function (l) { return !/[\p{Nd}%₹]/u.test(l); }).length;
      if (ls.length && noNum) out.push(['warn', t('hint_numbers', { n: EDU.fmt(noNum), total: EDU.fmt(ls.length) })]);
      if (ls.some(function (l) { return /^(responsible for|worked on|helped|assisted|duties|handled|was involved|was responsible)/i.test(l); })) out.push(['warn', t('hint_weak')]);
    }
    box.innerHTML = '';
    out.forEach(function (o) { box.appendChild(el('span', { class: o[0], text: o[1] })); });
  }
  function aiCopy(tplKey, role, text) {
    if (!String(text || '').trim()) { EDU.toast(t('ai_empty'), 4000); return; }
    EDU.copy(t(tplKey, { role: role || R.c.title || '-', text: text }));
  }

  /* ---- section cards ---- */
  function iconBtn(sym, key, act, extra) {
    return el('button', Object.assign({ type: 'button', class: 'rb-icon', 'aria-label': t(key), title: t(key), 'data-act': act, text: sym }, extra || {}));
  }
  function secCard(id, titleKey, body, movable) {
    var collapsed = !!R.collapsed[id];
    var head = el('div', { class: 'rb-sec-head' });
    if (movable) head.appendChild(el('button', { type: 'button', class: 'rb-icon rb-handle', 'aria-label': t('drag'), title: t('drag'), 'data-act': 'drag', text: '⠿' }));
    head.appendChild(el('h2', { id: 'h-' + id, text: t(titleKey) }));
    var tools = el('div', { class: 'rb-sec-tools' });
    if (movable) {
      tools.appendChild(el('span', { class: 'badge', 'data-empty': id, hidden: secHasContent(id), text: t('empty_hidden') }));
      var chk = el('input', { type: 'checkbox', 'data-show': id });
      chk.checked = !R.hidden[id];
      tools.appendChild(el('label', { class: 'check rb-show' }, chk, el('span', { text: t('show_section') })));
      var idx = R.order.indexOf(id);
      tools.appendChild(iconBtn('↑', 'move_up', 'up', { disabled: idx === 0 }));
      tools.appendChild(iconBtn('↓', 'move_down', 'down', { disabled: idx === R.order.length - 1 }));
    }
    tools.appendChild(el('button', { type: 'button', class: 'rb-icon rb-collapse', 'aria-expanded': collapsed ? 'false' : 'true', 'aria-controls': 'b-' + id, 'aria-label': t(titleKey), 'data-act': 'collapse', text: '▾' }));
    head.appendChild(tools);
    var card = el('section', { class: 'card rb-sec' + (collapsed ? ' collapsed' : ''), id: 'sec-' + id, 'data-sec': id, 'aria-labelledby': 'h-' + id },
      head, el('div', { class: 'rb-sec-body', id: 'b-' + id }, body));
    if (movable) card.setAttribute('data-movable', '1');
    return card;
  }

  function contactBody() {
    var grid = el('div', { class: 'rb-grid' },
      cField('name', 'f_name', 'ph_name', 'full', { autocomplete: 'name', maxlength: 120 }),
      cField('title', 'f_title', 'ph_title', 'full', { maxlength: 160 }));
    var ph = textInput('f-phone', R.c.phone, { type: 'tel', 'data-bind': 'c.phone', placeholder: '+91 98765 43210', autocomplete: 'tel', inputmode: 'tel', dir: 'ltr', maxlength: 40 });
    var bad = el('span', { class: 'rb-phone-bad', id: 'phoneBad', role: 'status', hidden: !phoneBad(R.c.phone), text: t('phone_bad') });
    ph.addEventListener('blur', function () {
      var f = formatPhone(ph.value);
      if (f !== ph.value) { ph.value = f; R.c.phone = f; touched(); }
      bad.hidden = !phoneBad(ph.value);
    });
    grid.appendChild(fieldWrap('f_phone', ph, '', bad));
    grid.appendChild(cField('email', 'f_email', 'ph_email', '', { type: 'email', autocomplete: 'email', dir: 'ltr', maxlength: 160 }));
    grid.appendChild(cField('city', 'f_city', 'ph_city', '', { maxlength: 120 }));
    grid.appendChild(cField('links', 'f_links', 'ph_links', '', { dir: 'ltr', maxlength: 240 }));
    if (R.opts.photo) {
      var img = el('img', { alt: '', id: 'photoThumb', hidden: !R.c.photo });
      if (R.c.photo) img.src = R.c.photo;
      var msg = el('p', { class: 'small mb0', id: 'photoMsg', role: 'status' });
      grid.appendChild(el('div', { class: 'field full' }, el('span', { text: t('opt_photo') }),
        el('div', { class: 'rb-photo' }, img,
          el('button', { type: 'button', class: 'btn btn-sm', id: 'photoPick', onclick: pickPhoto }, el('span', { 'aria-hidden': 'true', text: '🖼' }), ' ', el('span', { text: t('photo_pick') })),
          el('button', { type: 'button', class: 'btn btn-sm btn-ghost', id: 'photoRemove', hidden: !R.c.photo, onclick: function () { R.c.photo = ''; renderSections(); touched(); } }, t('photo_remove'))),
        el('span', { class: 'hint', text: t('photo_note') }), msg));
    }
    return grid;
  }

  function itemTitle(sec, it) {
    var parts = sec === 'projects' ? [it.title] : sec === 'education' ? [it.degree, it.inst] : sec === 'certs' ? [it.name] : [it.role, it.org];
    return parts.filter(function (x) { return String(x || '').trim(); }).join(' · ');
  }
  function itemCard(sec, it, i) {
    var p = 'f-' + sec + '-' + i + '-';
    var bind = function (f) { return { 'data-sec': sec, 'data-idx': i, 'data-f': f }; };
    var tx = itemTitle(sec, it);
    var title = el('span', { class: 'rb-item-title' + (tx ? ' no-i18n' : ''), dir: 'auto', text: tx || t('new_item') });
    var head = el('div', { class: 'rb-item-head' }, title,
      iconBtn('↑', 'move_up', 'item-up', { 'data-sec': sec, 'data-idx': i, disabled: i === 0 }),
      iconBtn('↓', 'move_down', 'item-down', { 'data-sec': sec, 'data-idx': i, disabled: i === R[sec].length - 1 }),
      iconBtn('✕', 'remove', 'item-del', { 'data-sec': sec, 'data-idx': i, class: 'rb-icon danger' }));
    var grid = el('div', { class: 'rb-grid' });
    function tf(f, key, ph, cls, attrs) { grid.appendChild(fieldWrap(key, textInput(p + f, it[f], Object.assign(bind(f), { placeholder: ph ? t(ph) : null }, attrs || {})), cls)); }
    if (sec === 'experience' || sec === 'internships') {
      tf('role', 'f_role', null, '');
      tf('org', 'f_org', null, '');
      tf('place', 'f_place', null, '');
      var cur = el('input', Object.assign({ type: 'checkbox', id: p + 'current' }, bind('current')));
      cur.checked = !!it.current;
      grid.appendChild(el('div', { class: 'field rb-cur' }, el('label', { class: 'check', for: p + 'current' }, cur, el('span', { text: t('f_current') }))));
      tf('start', 'f_start', 'ph_month', '', { maxlength: 40 });
      tf('end', 'f_end', 'ph_month', '', { maxlength: 40, disabled: !!it.current });
    } else if (sec === 'projects') {
      tf('title', 'f_ptitle', null, 'full');
      tf('tech', 'f_tech', null, '');
      tf('link', 'f_link', null, '', { dir: 'ltr' });
    } else if (sec === 'education') {
      tf('degree', 'f_degree', 'ph_degree', 'full');
      tf('inst', 'f_inst', null, '');
      tf('board', 'f_board', 'ph_board', '');
      tf('year', 'f_year', null, '', { maxlength: 20, inputmode: 'numeric' });
      var row = el('div', { class: 'field' }, el('span', { text: t('f_score') }));
      var sc = textInput(p + 'score', it.score, Object.assign(bind('score'), { maxlength: 24, 'aria-label': t('f_score'), style: { flex: '1 1 90px', minWidth: '80px' } }));
      var ty = el('select', Object.assign({ id: p + 'type', 'aria-label': t('f_score'), style: { flex: '1 0 auto', width: 'auto', maxWidth: '100%' } }, bind('type')),
        el('option', { value: 'pct', text: t('score_pct') }), el('option', { value: 'cgpa', text: t('score_cgpa') }));
      ty.value = it.type;
      row.appendChild(el('div', { class: 'row', style: { gap: '6px' } }, sc, ty));   /* the select drops below when the column is narrow */
      grid.appendChild(row);
    } else if (sec === 'certs') {
      tf('name', 'f_cname', null, 'full');
      tf('issuer', 'f_issuer', null, '');
      tf('year', 'f_year', null, '', { maxlength: 20 });
    }
    if (FIELDS[sec].indexOf('bullets') >= 0) {
      var ta = textArea(p + 'bullets', it.bullets, Object.assign(bind('bullets'), { placeholder: t('ph_bullets'), rows: 4 }));
      var wrap = fieldWrap('f_bullets', ta, 'full');
      wrap.appendChild(hintsLine('bullets', ta, function () { aiCopy('ai_prompt', sec === 'projects' ? it.title : it.role, it.bullets); }));
      grid.appendChild(wrap);
    }
    return el('div', { class: 'rb-item', 'data-sec': sec, 'data-idx': i }, head, grid);
  }
  function listBody(sec) {
    var box = el('div', { id: 'list-' + sec });
    R[sec].forEach(function (it, i) { box.appendChild(itemCard(sec, it, i)); });
    var add = el('button', { type: 'button', class: 'btn btn-sm rb-add', id: 'add-' + sec, 'data-act': 'add', 'data-sec': sec, disabled: R[sec].length >= MAX_ITEMS },
      el('span', { 'aria-hidden': 'true', text: '＋' }), ' ', el('span', { text: t(ADD_KEY[sec]) }));
    return el('div', null, box, add);
  }
  function textBody(sec) {
    var cfg = {
      summary: { label: 'sec_summary', ph: 'ph_summary', hint: 'summary_hint', rows: 4 },
      skills: { label: 'sec_skills', ph: 'ph_skills', hint: 'skills_hint', rows: 3 },
      languages: { label: 'sec_languages', ph: 'ph_langs', hint: 'langs_hint', rows: 2 },
      achievements: { label: 'sec_achievements', ph: 'ph_ach', hint: 'ach_hint', rows: 3 }
    }[sec];
    var ta = textArea('f-' + sec, R[sec], { 'data-bind': sec, placeholder: t(cfg.ph), rows: cfg.rows, 'aria-describedby': 'hint-' + sec });
    var wrap = el('div', { class: 'field' }, el('span', { class: 'hint', id: 'hint-' + sec, text: t(cfg.hint) }), ta);
    if (sec === 'summary') {
      wrap.appendChild(hintsLine('summary', ta, function () { aiCopy('ai_prompt_summary', R.c.title, R.summary); }));
      wrap.appendChild(el('p', { class: 'tiny muted mb0', text: t('ai_hint') }));
    }
    if (sec === 'achievements') wrap.appendChild(hintsLine('bullets', ta, null));
    return wrap;
  }
  function personalBody() {
    return el('div', { class: 'rb-grid' },
      cField('dob', 'f_dob', null, '', { type: 'date', dir: 'ltr' }),
      cField('father', 'f_father', null, '', { maxlength: 120 }),
      cField('nationality', 'f_nationality', 'ph_nationality', '', { maxlength: 60 }),
      fieldWrap('f_address', textArea('f-address', R.c.address, { 'data-bind': 'c.address', placeholder: t('ph_address'), rows: 2, maxlength: 400, autocomplete: 'street-address' }), 'full'));
  }
  function jobBody() {
    return el('div', { class: 'stack' },
      el('p', { class: 'callout warning small mb0', text: t('ctc_hint') }),
      el('div', { class: 'rb-grid' },
        cField('notice', 'f_notice', 'ph_notice', 'full', { maxlength: 80 }),
        cField('ctc_cur', 'f_ctc_cur', 'ph_ctc', '', { maxlength: 60 }),
        cField('ctc_exp', 'f_ctc_exp', 'ph_ctc', '', { maxlength: 60 })));
  }
  function declBody() {
    return el('div', { class: 'stack' },
      el('p', { class: 'small muted mb0', text: t('decl_hint') }),
      el('div', { class: 'rb-grid' },
        cField('place', 'f_decl_place', 'ph_city', '', { maxlength: 80 }),
        cField('date', 'f_decl_date', null, '', { type: 'date', dir: 'ltr' })));
  }

  function renderSections(focusSel) {
    var y = window.scrollY;
    secRoot.innerHTML = '';
    secRoot.appendChild(secCard('contact', 'sec_contact', contactBody(), false));
    R.order.forEach(function (sec) {
      secRoot.appendChild(secCard(sec, 'sec_' + sec, LIST_SECS[sec] ? listBody(sec) : textBody(sec), true));
    });
    if (R.opts.job) secRoot.appendChild(secCard('job', 'opt_job', jobBody(), false));
    if (R.opts.personal) secRoot.appendChild(secCard('personal', 'sec_personal', personalBody(), false));
    if (R.opts.decl) secRoot.appendChild(secCard('declaration', 'sec_declaration', declBody(), false));
    window.scrollTo(window.scrollX, y);
    if (focusSel) { var f = $(focusSel); if (f) { f.focus({ preventScroll: true }); f.scrollIntoView({ block: 'center' }); } }
  }
  function updateBadges() {
    $$('[data-empty]', secRoot).forEach(function (b) { b.hidden = secHasContent(b.getAttribute('data-empty')); });
  }

  /* ---- editing (one delegated listener for every field) ---- */
  secRoot.addEventListener('input', function (e) {
    var x = e.target, v = x.type === 'checkbox' ? x.checked : x.value;
    if (x.hasAttribute('data-show')) { var s = x.getAttribute('data-show'); if (v) delete R.hidden[s]; else R.hidden[s] = true; save(); schedulePreview(); return; }
    if (x.dataset.bind) {
      var path = x.dataset.bind.split('.');
      if (path.length === 2) R.c[path[1]] = v; else R[path[0]] = v;
      if (x.id === 'f-phone') { var b = $('#phoneBad'); if (b && !phoneBad(v)) b.hidden = true; }
    } else if (x.dataset.sec && x.dataset.f) {
      var it = R[x.dataset.sec][+x.dataset.idx];
      if (!it) return;
      it[x.dataset.f] = v;
      if (x.dataset.f === 'current') {
        var end = $('#f-' + x.dataset.sec + '-' + x.dataset.idx + '-end');
        if (end) end.disabled = !!v;
      }
      var card = x.closest('.rb-item'), tt = card && $('.rb-item-title', card);
      if (tt) { var tx = itemTitle(x.dataset.sec, it); tt.textContent = tx || t('new_item'); tt.classList.toggle('no-i18n', !!tx); }
    } else return;
    if (x._hints) updateHints(x);
    updateBadges();
    touched();
  });
  secRoot.addEventListener('focusin', function (e) {
    var x = e.target;
    if (x.matches('textarea, input[type="text"]')) lastField = x;
  });
  secRoot.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    var act = b.getAttribute('data-act'), card = b.closest('.rb-sec'), sec = card && card.getAttribute('data-sec');
    if (act === 'collapse') {
      var open = b.getAttribute('aria-expanded') !== 'false';
      if (open) R.collapsed[sec] = true; else delete R.collapsed[sec];
      card.classList.toggle('collapsed', open); b.setAttribute('aria-expanded', open ? 'false' : 'true');
      save();
    } else if (act === 'up' || act === 'down') {
      moveSection(sec, act === 'up' ? -1 : 1);
      renderSections('#sec-' + sec + ' [data-act="' + act + '"]:not(:disabled), #sec-' + sec + ' [data-act="collapse"]');
      save(); schedulePreview();
    } else if (act === 'add') {
      var s2 = b.getAttribute('data-sec');
      if (R[s2].length >= MAX_ITEMS) return;
      R[s2].push(blankItem(s2));
      delete R.collapsed[s2]; delete R.hidden[s2];
      renderSections('#f-' + s2 + '-' + (R[s2].length - 1) + '-' + FIELDS[s2][0]);
      touched();
    } else if (act === 'item-up' || act === 'item-down' || act === 'item-del') {
      var s3 = b.getAttribute('data-sec'), i = +b.getAttribute('data-idx'), arr = R[s3];
      if (act === 'item-del') {
        if (hasItem(s3, arr[i]) && !confirm(t('remove') + '?')) return;
        arr.splice(i, 1);
        renderSections('#add-' + s3);
      } else {
        var j = act === 'item-up' ? i - 1 : i + 1;
        if (j < 0 || j >= arr.length) return;
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        renderSections('.rb-item[data-sec="' + s3 + '"][data-idx="' + j + '"] [data-act="' + act + '"]');
      }
      touched();
    }
  });
  function moveSection(sec, d) {
    var i = R.order.indexOf(sec), j = i + d;
    if (i < 0 || j < 0 || j >= R.order.length) return;
    R.order.splice(i, 1); R.order.splice(j, 0, sec);
  }

  /* ---- drag a section by its ⠿ handle (mouse, touch, pen); arrow keys on the handle also move it ---- */
  /* Moving the card in the DOM drops the pointer capture, so the move/up listeners sit on the document
     for the whole drag: letting go anywhere (over the preview, the header, outside the window) ends it. */
  var drag = null;
  secRoot.addEventListener('pointerdown', function (e) {
    var h = e.target.closest('.rb-handle');
    if (!h || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    var card = h.closest('.rb-sec');
    drag = { card: card, handle: h, id: e.pointerId, moved: false };
    card.classList.add('dragging');
    try { h.setPointerCapture(e.pointerId); } catch (err) { }
    document.addEventListener('pointermove', dragMove);
    document.addEventListener('pointerup', endDrag);
    document.addEventListener('pointercancel', endDrag);
    window.addEventListener('blur', endDrag);
  });
  function dragMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (e.pointerType === 'mouse' && !(e.buttons & 1)) { endDrag(); return; }   /* button let go outside the window */
    var under = document.elementFromPoint(e.clientX, e.clientY);
    var over = under && under.closest('.rb-sec[data-movable]');
    if (over && over !== drag.card && over.parentNode === secRoot) {
      var r = over.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      var ref = after ? over.nextSibling : over;
      if (ref !== drag.card && ref !== drag.card.nextSibling) {
        secRoot.insertBefore(drag.card, ref);
        drag.moved = true;
        try { drag.handle.setPointerCapture(drag.id); } catch (err) { }
      }
    }
    if (e.clientY < 70) window.scrollBy(0, -14); else if (e.clientY > window.innerHeight - 50) window.scrollBy(0, 14);
  }
  function endDrag(e) {
    if (!drag || (e && e.pointerId != null && e.pointerId !== drag.id)) return;
    var d = drag; drag = null;
    document.removeEventListener('pointermove', dragMove);
    document.removeEventListener('pointerup', endDrag);
    document.removeEventListener('pointercancel', endDrag);
    window.removeEventListener('blur', endDrag);
    d.card.classList.remove('dragging');
    if (!d.moved) return;
    R.order = $$('.rb-sec[data-movable]', secRoot).map(function (c) { return c.getAttribute('data-sec'); });
    renderSections('#sec-' + d.card.getAttribute('data-sec') + ' .rb-handle');
    save(); schedulePreview();
  }
  secRoot.addEventListener('keydown', function (e) {
    var h = e.target.closest && e.target.closest('.rb-handle');
    if (!h || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    var sec = h.closest('.rb-sec').getAttribute('data-sec');
    moveSection(sec, e.key === 'ArrowUp' ? -1 : 1);
    renderSections('#sec-' + sec + ' .rb-handle');
    save(); schedulePreview();
  });

  /* ---- action verbs go into the last box the user typed in ---- */
  function insertVerb(v) {
    var f = lastField;
    if (!f || !document.body.contains(f) || f.disabled) { EDU.copy(v); return; }
    var s = f.selectionStart == null ? f.value.length : f.selectionStart, en = f.selectionEnd == null ? s : f.selectionEnd;
    var before = f.value.slice(0, s), after = f.value.slice(en);
    var ins = (before && !/\s$/.test(before) ? ' ' : '') + v + (after && /^\s/.test(after) ? '' : ' ');
    f.value = before + ins + after;
    f.focus();
    try { f.setSelectionRange(before.length + ins.length, before.length + ins.length); } catch (err) { }
    f.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* ---- photo: resized on the device, never uploaded ---- */
  function pickPhoto() {
    EDU.pickFile('image/*,.heic,.heif').then(function (file) {
      if (!file) return;
      var msg = $('#photoMsg');
      var say = function (k) { if (msg) { msg.textContent = t(k); msg.className = 'small mb0 bad'; } EDU.toast(t(k), 6000); };
      if (/\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type)) return say('photo_heic');
      if (file.type && !/^image\//.test(file.type)) return say('photo_bad');
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var max = 420, s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.naturalWidth * s)); cv.height = Math.max(1, Math.round(img.naturalHeight * s));
        var g = cv.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
        g.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        R.c.photo = cv.toDataURL('image/jpeg', 0.86);
        renderSections('#photoPick');
        touched();
      };
      img.onerror = function () { URL.revokeObjectURL(url); say('photo_bad'); };
      img.src = url;
    });
  }

  /* ================= the resume preview ================= */
  var page = $('#page'), scaleBox = $('#scaleBox'), scaleWrap = $('#scaleWrap'), stage = $('#stage');
  var fontsLoaded = {};
  function loadResumeFont(code) {
    var info = EDU.langInfo(code);
    if (!info.font || fontsLoaded[info.font]) return;
    fontsLoaded[info.font] = 1;
    if (location.protocol === 'file:' && !navigator.onLine) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + info.font.replace(/ /g, '+') + ':wght@400;600;700&display=swap';
    l.onload = function () { if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAndScale); };
    document.head.appendChild(l);
  }

  var B = function (s) { return '<bdi>' + esc(s) + '</bdi>'; };
  function ul(items) { return items.length ? '<ul>' + items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : ''; }
  function paras(s) { return String(s || '').split(/\r?\n+/).map(function (x) { return x.trim(); }).filter(Boolean).map(function (x) { return '<p>' + esc(x) + '</p>'; }).join(''); }
  function dates(it) {
    var s = String(it.start || '').trim(), e = it.current ? H().l.present : String(it.end || '').trim();
    if (!s && !e) return '';
    return '<span class="rv-date">' + B(s) + (s && e ? ' – ' : '') + B(e) + '</span>';
  }
  function joinSub(parts) { return parts.filter(function (x) { return String(x || '').trim(); }).map(function (x) { return esc(String(x).trim()); }).join(', '); }
  function sec(id, heading, body) { return body ? '<section class="rv-sec" data-sec="' + id + '"><h2>' + esc(heading) + '</h2>' + body + '</section>' : ''; }

  function jobItems(list) {
    return list.filter(function (it) { return hasItem('experience', it); }).map(function (it) {
      var main = String(it.role || '').trim() || String(it.org || '').trim();
      var sub = it.role && String(it.role).trim() ? joinSub([it.org, it.place]) : joinSub([it.place]);
      return '<div class="rv-item"><div class="rv-row"><b>' + esc(main) + '</b>' + dates(it) + '</div>' +
        (sub ? '<div class="rv-sub">' + sub + '</div>' : '') + ul(lines(it.bullets)) + '</div>';
    }).join('');
  }
  function projectItems() {
    var h = H();
    return R.projects.filter(function (it) { return hasItem('projects', it); }).map(function (it) {
      var link = String(it.link || '').trim();
      return '<div class="rv-item"><div class="rv-row"><b>' + esc(it.title) + '</b>' + (link ? '<span class="rv-date">' + B(link) + '</span>' : '') + '</div>' +
        (String(it.tech || '').trim() ? '<div class="rv-sub">' + esc(h.l.tools) + ': ' + esc(it.tech) + '</div>' : '') + ul(lines(it.bullets)) + '</div>';
    }).join('');
  }
  function eduBody() {
    var h = H(), list = R.education.filter(function (it) { return hasItem('education', it); });
    if (!list.length) return '';
    if (R.tpl === 'govt') {
      return '<table class="rv-edu"><thead><tr><th>' + esc(h.l.course) + '</th><th>' + esc(h.l.board) + '</th><th>' + esc(h.l.year) + '</th><th>' + esc(h.l.marks) + '</th></tr></thead><tbody>' +
        list.map(function (e) {
          return '<tr><td><b>' + esc(e.degree) + '</b>' + (String(e.inst || '').trim() ? '<br><span class="rv-sub">' + esc(e.inst) + '</span>' : '') + '</td><td>' + esc(e.board) + '</td><td>' + B(e.year) + '</td><td>' + B(scoreText(e)) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    return list.map(function (e) {
      var sub = joinSub([e.inst, e.board]), sc = scoreText(e);
      return '<div class="rv-item"><div class="rv-row"><b>' + esc(e.degree || e.inst) + '</b>' + (String(e.year || '').trim() ? '<span class="rv-date">' + B(e.year) + '</span>' : '') + '</div>' +
        ((sub || sc) ? '<div class="rv-sub">' + sub + (sub && sc ? ' · ' : '') + (sc ? B(sc) : '') + '</div>' : '') + '</div>';
    }).join('');
  }
  function certBody() {
    var list = R.certs.filter(function (it) { return hasItem('certs', it); });
    return list.length ? '<ul>' + list.map(function (c) {
      var extra = joinSub([c.issuer]) + (String(c.year || '').trim() ? (String(c.issuer || '').trim() ? ' ' : '') + '(' + B(c.year) + ')' : '');
      return '<li><b>' + esc(c.name) + '</b>' + (extra ? (String(c.name || '').trim() ? ', ' : '') + extra : '') + '</li>';
    }).join('') + '</ul>' : '';
  }
  function skillsBody(inSide) {
    var list = commaList(R.skills);
    if (!list.length) return '';
    if (inSide) return ul(list);
    if (R.tpl === 'fresher') return '<div class="rv-chips">' + list.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div>';
    return '<p>' + list.map(esc).join(', ') + '</p>';
  }
  function secBody(id, inSide) {
    switch (id) {
      case 'summary': return paras(R.summary);
      case 'experience': return jobItems(R.experience);
      case 'internships': return jobItems(R.internships);
      case 'projects': return projectItems();
      case 'education': return eduBody();
      case 'skills': return skillsBody(inSide);
      case 'certs': return certBody();
      case 'languages': var ls = commaList(R.languages); return ls.length ? (inSide ? ul(ls) : '<p>' + ls.map(esc).join(', ') + '</p>') : '';
      case 'achievements': return ul(lines(R.achievements));
    }
    return '';
  }
  function kv(pairs) {
    pairs = pairs.filter(function (p) { return String(p[1] || '').trim(); });
    return pairs.length ? '<dl class="rv-kv">' + pairs.map(function (p) { return '<dt>' + esc(p[0]) + '</dt><dd>' + (p[2] ? B(p[1]) : esc(p[1])) + '</dd>'; }).join('') + '</dl>' : '';
  }
  function jobSec() {
    var l = H().l;
    return R.opts.job ? sec('job', H().h.job, kv([[l.notice, R.c.notice], [l.ctc_cur, R.c.ctc_cur], [l.ctc_exp, R.c.ctc_exp]])) : '';
  }
  function personalSec() {
    var l = H().l;
    return R.opts.personal ? sec('personal', H().h.personal, kv([[l.dob, fmtDate(R.c.dob), 1], [l.father, R.c.father], [l.nationality, R.c.nationality], [l.address, R.c.address]])) : '';
  }
  function declSec() {
    if (!R.opts.decl) return '';
    var h = H(), l = h.l;
    var left = '<div><div>' + esc(l.place) + ': ' + esc(R.c.place || R.c.city || '') + '</div><div>' + esc(l.date) + ': ' + B(fmtDate(R.c.date)) + '</div></div>';
    var right = '<div class="sig">' + (String(R.c.name || '').trim() ? esc(R.c.name) : esc(l.signature)) + '</div>';
    return '<section class="rv-sec rv-decl" data-sec="declaration"><h2>' + esc(h.h.declaration) + '</h2><p>' + esc(h.decl) + '</p><div class="rv-sign">' + left + right + '</div></section>';
  }
  function contactParts() {
    var c = R.c, l = H().l;
    return [['phone', l.phone, c.phone], ['email', l.email, c.email], ['city', '', c.city], ['links', l.links, c.links]]
      .filter(function (p) { return String(p[2] || '').trim(); });
  }
  function photoTag() { return photoShown() ? '<img class="rv-photo" alt="" src="' + esc(R.c.photo) + '">' : ''; }
  /* Name, title and contact come first in the document (and in the PDF's text order, which job-portal
     software reads); the photo, when shown, follows them in a flex row instead of being positioned. */
  function headHTML(withContact) {
    var c = R.c, photo = R.tpl !== 'modern' ? photoTag() : '';
    var out = '<div class="rv-id"><h1>' + esc(c.name) + '</h1>';
    if (String(c.title || '').trim()) out += '<div class="rv-title">' + esc(c.title) + '</div>';
    if (withContact) {
      var parts = contactParts();
      if (parts.length) out += '<div class="rv-contact">' + parts.map(function (p) { return B(p[2]); }).join(' | ') + '</div>';
    }
    out += '</div>';
    return '<header class="rv-head' + (photo ? ' with-photo' : '') + '">' + out + photo + '</header>';
  }
  function visibleSecs(filter) {
    return R.order.filter(function (s) { return !R.hidden[s] && (!filter || filter(s)); });
  }
  function buildHTML() {
    var h = H();
    if (R.tpl === 'modern') {
      var parts = contactParts(), side = photoTag();
      if (parts.length) side += '<section class="rv-sec rv-contact" data-sec="contact"><h2>' + esc(h.l.contact) + '</h2>' +
        parts.map(function (p) { return '<div>' + (p[1] ? '<b>' + esc(p[1]) + '</b>' : '') + B(p[2]) + '</div>'; }).join('') + '</section>';
      visibleSecs(function (s) { return SIDE[s]; }).forEach(function (s) { side += sec(s, h.h[s], secBody(s, true)); });
      side += jobSec() + personalSec();
      var main = headHTML(false);
      visibleSecs(function (s) { return !SIDE[s]; }).forEach(function (s) { main += sec(s, h.h[s], secBody(s, false)); });
      main += declSec();
      return '<div class="rv-cols"><aside class="rv-side">' + side + '</aside><div class="rv-main">' + main + '</div></div>';
    }
    var out = headHTML(true);
    visibleSecs().forEach(function (s) { out += sec(s, h.h[s], secBody(s, false)); });
    return out + jobSec() + personalSec() + declSec();
  }

  var previewQueued = false;
  function schedulePreview() {
    if (previewQueued) return;
    previewQueued = true;
    requestAnimationFrame(function () { previewQueued = false; renderPreview(); });
  }
  function renderPreview() {
    var info = EDU.langInfo(R.lang);
    loadResumeFont(R.lang);
    page.className = 'rb-page no-i18n tpl-' + R.tpl + (photoShown() ? ' has-photo' : '');
    page.setAttribute('lang', info.code);
    page.setAttribute('dir', info.dir);
    page.style.setProperty('--rb-script', info.font ? '"' + info.font + '"' : '"Noto Sans"');
    if (info.code === 'ur') page.style.setProperty('--rb-latin', '"Noto Nastaliq Urdu", "Segoe UI"'); else page.style.removeProperty('--rb-latin');
    page.innerHTML = '<div class="rv-body">' + buildHTML() + '</div>';
    var empty = !String(R.c.name || '').trim() && !ORDER.some(secHasContent);
    $('#emptyMsg').hidden = !empty;
    var o = $('#resumeSel option[value="' + R.id + '"]');
    if (o) o.textContent = displayName(R);
    fitAndScale();
  }

  /* ---- scale the A4 page to the column, mark page breaks, and show how full the page is ---- */
  function fitAndScale() {
    var body = $('.rv-body', page);
    /* fractional height (offsetHeight is rounded): a spill of even 1px makes a second PDF page */
    var shown = scaleBox.getBoundingClientRect().width / (210 * MM);
    var contentH = !body ? 0 : shown > 0.05 ? body.getBoundingClientRect().height / shown : body.offsetHeight;
    var pages = Math.max(1, Math.ceil((contentH - 0.25) / PAGE_BODY_H));
    var pct = Math.round(contentH / PAGE_BODY_H * 100);
    $$('.rb-break', scaleBox).forEach(function (b) { b.remove(); });
    for (var k = 1; k < pages; k++) {
      scaleBox.appendChild(el('div', { class: 'rb-break', style: { top: (PAGE_PAD_Y + k * PAGE_BODY_H) + 'px' } }, el('span', { text: t('page_n', { n: EDU.fmt(k + 1) }) })));
    }
    var txt = $('#fitText'), bar = $('#fitBar');
    txt.className = 'small'; bar.className = '';
    if (pages > 1) { txt.textContent = t('fit_over', { n: EDU.fmt(pages) }); txt.classList.add('over'); bar.className = 'over'; }
    else if (pct < 60) { txt.textContent = t('fit_low', { p: EDU.fmt(pct) }); bar.className = 'low'; }
    else txt.textContent = t('fit_one', { p: EDU.fmt(pct) });
    bar.style.width = Math.min(100, Math.max(2, pct / pages)) + '%';
    page.dataset.pages = pages;
    scalePage();
  }
  function scalePage() {
    var avail = stage.clientWidth - 24;
    if (avail <= 0) return;
    var w = 210 * MM, s = Math.min(1, avail / w);
    scaleBox.style.transform = 'scale(' + s + ')';
    scaleWrap.style.width = Math.floor(w * s) + 'px';
    scaleWrap.style.height = Math.ceil(page.offsetHeight * s) + 'px';
  }
  if (window.ResizeObserver) new ResizeObserver(function () { scalePage(); }).observe(stage);
  window.addEventListener('resize', scalePage);
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { fitAndScale(); });

  /* ---- print / Save as PDF: a clean copy of the page goes into #print-root ---- */
  var oldTitle = null;
  function preparePrint() {
    var root = $('#print-root');
    root.innerHTML = '';
    var copy = page.cloneNode(true);
    copy.removeAttribute('id');
    root.appendChild(copy);
    if (oldTitle === null) oldTitle = document.title;
    var n = String(R.c.name || R.name || '').trim();
    if (n) document.title = n;
  }
  function restoreTitle() { if (oldTitle !== null) { document.title = oldTitle; oldTitle = null; } }
  $('#printBtn').addEventListener('click', function () {
    if (saveTimer) saveNow();
    renderPreview();
    preparePrint();
    try { window.print(); } catch (e) { }
    setTimeout(restoreTitle, 1500);
  });
  window.addEventListener('beforeprint', preparePrint);
  window.addEventListener('afterprint', restoreTitle);

  /* ---- resumes: pick / new / duplicate / delete ---- */
  function select(r, focusSel) {
    R = r;
    renderAll(focusSel);
    saveNow();
  }
  $('#resumeSel').addEventListener('change', function (e) {
    var r = resumes.filter(function (x) { return x.id === e.target.value; })[0];
    if (r) select(r);
  });
  $('#newResume').addEventListener('click', function () {
    var r = blankResume(R.lang, R.tpl);
    resumes.push(r);
    select(r, '#f-name');
  });
  $('#dupResume').addEventListener('click', function () {
    var r = normalize(JSON.parse(JSON.stringify(R)));
    r.id = uid(); r.sample = null; r.name = t('copy_of', { name: displayName(R) }).slice(0, 80);
    resumes.splice(resumes.indexOf(R) + 1, 0, r);
    select(r, '#resumeName');
  });
  $('#delResume').addEventListener('click', function () {
    if (!confirm(t('confirm_delete'))) return;
    var i = resumes.indexOf(R);
    resumes.splice(i, 1);
    if (!resumes.length) resumes.push(blankResume('en'));
    select(resumes[Math.max(0, i - 1)]);
  });
  $('#resumeName').addEventListener('input', function (e) {
    R.name = e.target.value;
    var o = $('#resumeSel option[value="' + R.id + '"]');
    if (o) o.textContent = displayName(R);
    save();
  });
  $('#startBlank').addEventListener('click', function () {
    var b = blankResume(R.lang, R.tpl);
    b.id = R.id; b.name = R.name; b.opts = R.opts; b.order = R.order; b.hidden = R.hidden;
    resumes[resumes.indexOf(R)] = b;
    select(b, '#f-name');
  });

  /* ---- template, headings language, optional parts ---- */
  $('#tplList').addEventListener('change', function (e) {
    if (e.target.name !== 'tpl') return;
    R.tpl = e.target.value;
    var opened = false;
    if (R.tpl === 'govt') {
      if (!R.opts.personal) { R.opts.personal = true; opened = true; }
      if (!R.opts.decl) { R.opts.decl = true; opened = true; }
    }
    $('#optPersonal').checked = R.opts.personal; $('#optDecl').checked = R.opts.decl;
    $('#atsPhotoNote').hidden = !(R.opts.photo && ATS[R.tpl]);
    if (opened) renderSections();
    save(); renderPreview();
  });
  $('#headLang').addEventListener('change', function (e) {
    var L = isLang(e.target.value) ? e.target.value : 'en';
    if (R.sample) {
      var s = sampleResume(L, R);
      resumes[resumes.indexOf(R)] = s; R = s;
      renderSections();
      renderPicker();
    } else R.lang = L;
    renderVerbs();
    save(); renderPreview();
  });
  [['optPhoto', 'photo'], ['optPersonal', 'personal'], ['optJob', 'job'], ['optDecl', 'decl']].forEach(function (p) {
    $('#' + p[0]).addEventListener('change', function (e) {
      R.opts[p[1]] = e.target.checked;
      $('#atsPhotoNote').hidden = !(R.opts.photo && ATS[R.tpl]);
      renderSections();
      save(); renderPreview();
    });
  });

  /* ---- backup: JSON export / import, example, clear personal details, reset ---- */
  function fileBase(s) { return String(s || '').trim().replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '').replace(/\s+/g, '-').slice(0, 60); }
  $('#exportJson').addEventListener('click', function () {
    if (saveTimer) saveNow();
    var data = { app: SLUG, version: 1, exported: new Date().toISOString(), resume: R };
    var base = fileBase(R.name || R.c.name);
    EDU.download('resume' + (base ? '-' + base : '') + '.json', JSON.stringify(data, null, 2), 'application/json');
  });
  $('#importJson').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (file) {
      if (!file) return null;
      return EDU.readText(file).then(function (text) {
        var o = null;
        try { o = JSON.parse(String(text).replace(/^﻿/, '')); } catch (e) { }
        var src = o && o.resume && typeof o.resume === 'object' ? o.resume : o;
        if (!src || typeof src !== 'object' || Array.isArray(src) || !(src.c || src.experience || src.education)) { EDU.toast(t('import_bad'), 5000); return; }
        var r = normalize(src);
        r.id = uid(); r.sample = null;
        resumes.push(r);
        select(r);
        EDU.toast(t('imported', { name: displayName(r) }));
      });
    }).catch(function () { EDU.toast(t('import_bad'), 5000); });
  });
  $('#loadExample').addEventListener('click', function () {
    var r = sampleResume(R.lang, null);
    r.tpl = R.tpl;
    resumes.push(r);
    select(r);
  });
  $('#clearPersonal').addEventListener('click', function () {
    if (!confirm(t('confirm_clear'))) return;
    PERSONAL_KEYS.forEach(function (k) { R.c[k] = ''; });
    if (saveTimer) clearTimeout(saveTimer);
    renderSections();
    renderPreview();
    saveNow();
    EDU.toast(t('cleared'));
  });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    resumes = [sampleResume('en')];
    select(resumes[0]);
  });

  /* ---- phone view: switch between the form and the preview ---- */
  function setView(v) {
    $('#layout').setAttribute('data-view', v);
    $('#viewEdit').setAttribute('aria-pressed', String(v === 'edit'));
    $('#viewPreview').setAttribute('aria-pressed', String(v === 'preview'));
    if (v === 'preview') { renderPreview(); }
    var top = $('#viewSeg').getBoundingClientRect().top + window.scrollY - 70;
    if (window.scrollY > top) window.scrollTo(0, Math.max(0, top));
  }
  $('#viewEdit').addEventListener('click', function () { setView('edit'); });
  $('#viewPreview').addEventListener('click', function () { setView('preview'); });

  /* Ctrl/Cmd + S saves right away (it saves by itself anyway) */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); saveNow(); EDU.toast(t('saved_local')); }
  });

  function renderAll(focusSel) {
    renderPicker();
    renderDesign();
    renderVerbs();
    renderSections(focusSel);
    renderPreview();
  }
  EDU.onLang(function () { renderAll(); });
  renderAll();
  store.set('current', R.id);
})();
