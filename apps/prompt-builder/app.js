/* Prompt Builder — AI Pathshala Apps.
   Builds a structured prompt (role, task, context, audience, format, tone, length,
   language, rules, example) written in the chosen ANSWER language. No AI calls here:
   the user copies the prompt into any free AI chatbot. Everything stays on the device. */
(function () {
  'use strict';
  var SLUG = 'prompt-builder';
  var store = EDU.store(SLUG);
  var CODES = EDU.LANGS.map(function (l) { return l.code; });
  var AUD = ['c1_5', 'c6_8', 'c9_10', 'c11_12', 'ug', 'teachers', 'parents', 'general'];
  var FMT = ['list', 'table', 'paragraph', 'quiz', 'steps', 'letter'];
  var TONE = ['friendly', 'formal', 'encouraging', 'simple', 'fun', 'neutral'];
  var LEN = ['vshort', 'short', 'medium', 'long'];
  var TEXT = ['role', 'task', 'context', 'cons', 'ex'];
  var CHECKS = ['role', 'task', 'context', 'aud', 'fmt', 'cons'];
  var WEIGHT = { role: 15, task: 30, context: 15, aud: 15, fmt: 15, cons: 10 };
  var MAX_FAVS = 60;
  /* Template settings (the texts live in content.js, per language). */
  var TPL = [
    { id: 'lesson5e', icon: '📘', aud: 'c6_8', fmt: 'steps', tone: 'friendly', len: 'long' },
    { id: 'mcq10', icon: '❓', aud: 'c9_10', fmt: 'quiz', tone: 'simple', len: 'medium' },
    { id: 'explain', icon: '💡', aud: 'c6_8', fmt: 'paragraph', tone: 'simple', len: 'short' },
    { id: 'rubric', icon: '📊', aud: 'teachers', fmt: 'table', tone: 'formal', len: 'medium' },
    { id: 'parentletter', icon: '✉️', aud: 'parents', fmt: 'letter', tone: 'formal', len: 'vshort' },
    { id: 'story', icon: '📖', aud: 'c1_5', fmt: 'paragraph', tone: 'fun', len: 'short' },
    { id: 'essayfb', icon: '✍️', aud: 'c9_10', fmt: 'list', tone: 'encouraging', len: 'medium' },
    { id: 'timetable', icon: '🗓️', aud: 'c9_10', fmt: 'table', tone: 'encouraging', len: 'medium' },
    { id: 'debate', icon: '🎤', aud: 'c11_12', fmt: 'list', tone: 'neutral', len: 'medium' },
    { id: 'summary', icon: '📝', aud: 'c9_10', fmt: 'list', tone: 'simple', len: 'short' },
    { id: 'interview', icon: '💼', aud: 'ug', fmt: 'paragraph', tone: 'encouraging', len: 'short' }
  ];

  EDU.init({ slug: SLUG, title: 'app_title' });

  var $ = EDU.$, el = EDU.el, t = EDU.t;
  var F = {
    role: $('#f-role'), task: $('#f-task'), context: $('#f-context'), cons: $('#f-cons'), ex: $('#f-ex'),
    aud: $('#f-aud'), fmt: $('#f-fmt'), tone: $('#f-tone'), len: $('#f-len'), lang: $('#f-lang'),
    ask: $('#f-ask'), unsure: $('#f-unsure')
  };

  /* ---------------- data helpers ---------------- */
  function C(lang) { var all = window.APP_CONTENT || {}; return all[lang] || all.en; }
  function tplMeta(id) { for (var i = 0; i < TPL.length; i++) if (TPL[i].id === id) return TPL[i]; return null; }
  function langName(code) { return t('lang_' + code); }

  function blank(alang, manual) {
    return { role: '', task: '', context: '', cons: '', ex: '', aud: '', fmt: '', tone: '', len: '',
      ask: false, unsure: true, alang: alang || EDU.lang, manual: !!manual, tpl: null };
  }
  function normalize(o) {
    var s = blank();
    if (!o || typeof o !== 'object') return s;
    TEXT.forEach(function (k) { if (typeof o[k] === 'string') s[k] = o[k].slice(0, 8000); });
    if (AUD.indexOf(o.aud) >= 0) s.aud = o.aud;
    if (FMT.indexOf(o.fmt) >= 0) s.fmt = o.fmt;
    if (TONE.indexOf(o.tone) >= 0) s.tone = o.tone;
    if (LEN.indexOf(o.len) >= 0) s.len = o.len;
    s.ask = !!o.ask; s.unsure = !!o.unsure;
    if (CODES.indexOf(o.alang) >= 0) s.alang = o.alang;
    s.manual = !!o.manual;
    if (o.tpl && tplMeta(o.tpl.id) && CODES.indexOf(o.tpl.lang) >= 0) s.tpl = { id: o.tpl.id, lang: o.tpl.lang };
    return s;
  }
  function copyState(s) { return JSON.parse(JSON.stringify(s)); }

  function loadTemplate(id, lang, keepSettings) {
    var m = tplMeta(id), tx = C(lang).templates[id];
    if (!m || !tx) return;
    TEXT.forEach(function (k) { S[k] = tx[k] || ''; });
    if (!keepSettings) { S.aud = m.aud; S.fmt = m.fmt; S.tone = m.tone; S.len = m.len; S.ask = false; S.unsure = true; }
    S.tpl = { id: id, lang: lang };
  }
  /* True when the form still holds an untouched template (so it can be re-localised). */
  function isPristine() {
    if (!S.tpl) return false;
    var tx = C(S.tpl.lang).templates[S.tpl.id];
    return !!tx && TEXT.every(function (k) { return S[k] === (tx[k] || ''); });
  }
  function hasText() { return TEXT.some(function (k) { return S[k].trim() !== ''; }); }

  /* ---------------- prompt assembly ---------------- */
  function stripEnd(x) { return x.replace(/[\s.!?,;:।॥۔。]+$/, ''); }
  /* The role frame already says "You are … ." (in the answer language). Students often type
     "You are a teacher" or "Act as …" anyway, which would give "You are You are a teacher."
     Remove such a lead-in (and the frame's own ending, e.g. Hindi "हैं") from the typed role. */
  var ROLE_LEAD = /^(?:you\s+are|you['’]re|act\s+(?:as|like)|pretend\s+to\s+be|imagine\s+(?:that\s+)?you\s+are)\s+/i;
  function cleanRole(role, alang) {
    var r = stripEnd(role.replace(/\s*[\r\n]+\s*/g, ' ').trim());
    var parts = (C(alang).asm.role || '').split('{x}');
    var pre = (parts[0] || '').trim(), suf = stripEnd((parts[1] || '').trim());
    var r0 = r.replace(ROLE_LEAD, '');
    if (pre && r0 === r && r.length > pre.length + 1 && r.slice(0, pre.length).toLowerCase() === pre.toLowerCase() &&
        /^\s/.test(r.slice(pre.length)) && !/^\s+(?:का|के|की|को|से|کا|کے|کی|کو|سے)(?:\s|$)/.test(r.slice(pre.length))) r0 = r.slice(pre.length).trim();
    if (suf && r0.length > suf.length + 1 && r0.slice(-suf.length) === suf && /\s$/.test(r0.slice(0, -suf.length))) r0 = stripEnd(r0.slice(0, -suf.length));
    return r0 || r;
  }
  function fill(frame, x) { return frame.replace('{x}', function () { return x; }); }
  /* A list marker at the start of a rule line: "- ", "• ", "1. ", "2) ". A number such as "3.5 marks"
     is part of the rule, not a marker, so a digit right after the dot keeps it. */
  var BULLET = /^\s*(?:[-*•●▪◦–]|\d{1,2}[.)](?!\d))\s*/;
  function cleanLine(l) { return l.replace(BULLET, '').trim(); }
  function lines(text) {
    return String(text || '').split(/\r?\n/).map(cleanLine).filter(Boolean);
  }
  function assemble(s) {
    var A = C(s.alang).asm, paras = [], p;
    var role = cleanRole(s.role, s.alang), task = s.task.trim(), ctx = s.context.trim(), cons = lines(s.cons), ex = s.ex.trim();
    if (!role && !task && !ctx && !cons.length && !ex) return '';
    if (role) paras.push(fill(A.role, role));
    if (task) paras.push(fill(A.task, task));
    if (ctx) paras.push(fill(A.context, ctx));
    p = [];
    if (s.aud) p.push(fill(A.aud, A.audv[s.aud]));
    if (s.fmt) p.push(A.fmt[s.fmt]);
    if (s.tone) p.push(fill(A.tone, A.tonev[s.tone]));
    if (s.len) p.push(A.len[s.len]);
    p.push(A.lang);
    paras.push(p.join('\n'));
    if (cons.length) paras.push(A.rules + '\n' + cons.map(function (c) { return '- ' + c; }).join('\n'));
    if (ex) paras.push(A.example + '\n"""\n' + ex + '\n"""');
    p = [];
    if (s.ask) p.push(A.ask);
    if (s.unsure) p.push(A.unsure);
    if (p.length) paras.push(p.join('\n'));
    return paras.join('\n\n');
  }

  /* ---------------- quality + safety ---------------- */
  function brackets(s) {
    var found = [];
    TEXT.forEach(function (k) {
      (s[k].match(/\[[^\[\]\n]{1,80}\]/g) || []).forEach(function (b) { if (found.indexOf(b) < 0) found.push(b); });
    });
    return found;
  }
  function quality(s) {
    var len = function (x) { return x.trim().replace(/\s+/g, ' ').length; };
    var st = { role: len(s.role) >= 3, task: len(s.task) >= 12, context: len(s.context) >= 10,
      aud: !!s.aud, fmt: !!s.fmt, cons: lines(s.cons).length > 0 };
    var score = 0;
    CHECKS.forEach(function (k) { if (st[k]) score += WEIGHT[k]; });
    var taskShort = !st.task && len(s.task) > 0;
    if (taskShort) score += 10;
    var br = brackets(s);
    if (br.length) score = Math.max(0, score - 15);
    var level = score >= 90 ? 3 : score >= 70 ? 2 : score >= 40 ? 1 : 0;
    return { st: st, score: score, taskShort: taskShort, br: br, level: level };
  }
  function personalData(s) {
    var txt = TEXT.map(function (k) { return s[k]; }).join('\n'), found = [];
    if (/(^|\D)[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}(?!\d)/.test(txt)) found.push('pii_aadhaar');
    if (/(^|\D)(?:\+?91[ -]?|0)?[6-9]\d{4}[ -]?\d{5}(?!\d)/.test(txt)) found.push('pii_phone');
    if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/.test(txt)) found.push('pii_email');
    return found;
  }

  /* ---------------- state ---------------- */
  /* A damaged timestamp (e.g. 1e20) would make Intl/Date throw while drawing the list. */
  function validTime(x) { x = +x; return x > 0 && x < 8.64e15 ? x : Date.now(); }
  var S = blank();
  var favs = (function (a) {
    return (Array.isArray(a) ? a : []).filter(function (f) { return f && typeof f === 'object' && f.s; }).map(function (f) {
      return { id: String(f.id || Math.random()), name: String(f.name || '').slice(0, 80), at: validTime(f.at), s: normalize(f.s) };
    }).filter(function (f) { return assemble(f.s) !== ''; }).slice(0, MAX_FAVS);   /* skip damaged/empty entries */
  })(store.get('favs', []));

  function save() { store.set('draft', S); }

  /* ---------------- rendering ---------------- */
  /* Grow textareas with their content (up to a limit) so long texts stay readable on phones. */
  function autosize(ta) {
    if (!ta || ta.tagName !== 'TEXTAREA') return;
    ta.style.height = 'auto';
    if (ta.scrollHeight) ta.style.height = Math.min(ta.scrollHeight + 2, 380) + 'px';
  }
  function autosizeAll() { TEXT.forEach(function (k) { autosize(F[k]); }); }
  function fillForm() {
    TEXT.forEach(function (k) { if (F[k].value !== S[k]) F[k].value = S[k]; autosize(F[k]); });
    F.aud.value = S.aud; F.fmt.value = S.fmt; F.tone.value = S.tone; F.len.value = S.len;
    F.ask.checked = S.ask; F.unsure.checked = S.unsure;
    F.lang.value = S.alang;
  }
  function readForm() {
    TEXT.forEach(function (k) { S[k] = F[k].value; });
    S.aud = F.aud.value; S.fmt = F.fmt.value; S.tone = F.tone.value; S.len = F.len.value;
    S.ask = F.ask.checked; S.unsure = F.unsure.checked;
  }

  function renderLangSelect() {
    F.lang.innerHTML = '';
    EDU.LANGS.forEach(function (l) {
      var local = langName(l.code);
      var same = local === l.native || l.code === EDU.lang;
      F.lang.appendChild(el('option', { value: l.code, text: same ? l.native : l.native + ' (' + local + ')' }));
    });
    F.lang.value = S.alang;
  }

  function renderTemplates() {
    var box = $('#tpls'), cur = EDU.lang, pristine = isPristine();
    box.innerHTML = '';
    TPL.forEach(function (m) {
      var tx = C(cur).templates[m.id];
      box.appendChild(el('button', {
        type: 'button', class: 'tpl', 'data-tpl': m.id, title: tx.desc,
        'aria-pressed': String(pristine && S.tpl.id === m.id),
        onclick: function () { pickTemplate(m.id); }
      }, el('span', { class: 'tpl-ico', 'aria-hidden': 'true', text: m.icon }),
         el('span', { class: 'tpl-t', text: tx.title }),
         el('span', { class: 'tpl-d', text: tx.desc })));
    });
  }

  function chipActive(i) {
    var have = lines(S.cons);
    return [S.alang, EDU.lang].some(function (L) { return have.indexOf(C(L).chips[i].text) >= 0; });
  }
  function renderChips() {
    var box = $('#chips');
    EDU.$$('.chip', box).forEach(function (c) { c.remove(); });
    C(EDU.lang).chips.forEach(function (ch, i) {
      box.appendChild(el('button', { type: 'button', class: 'chip', 'data-chip': String(i), 'aria-pressed': String(chipActive(i)),
        title: C(S.alang).chips[i].text, text: ch.label, onclick: function () { toggleChip(i); } }));
    });
  }

  function escHtml(x) { return EDU.esc(x); }
  function renderPreview() {
    var text = assemble(S), info = EDU.langInfo(S.alang), pv = $('#preview');
    pv.setAttribute('lang', info.code);
    pv.setAttribute('dir', info.dir);
    pv.innerHTML = escHtml(text).replace(/\[[^\[\]\n]{1,80}\]/g, function (m) { return '<mark>' + m + '</mark>'; });
    pv.hidden = !text;
    $('#preview-empty').hidden = !!text;
    $('#preview-note').textContent = t('preview_note', { lang: langName(S.alang) });
    $('#lang-badge').textContent = langName(S.alang);
    var words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    $('#counts').textContent = text ? t('counts', { c: EDU.fmt(text.length), w: EDU.fmt(words) }) : '';
    $('#btn-copy').disabled = !text;
    return text;
  }

  function renderQuality() {
    var q = quality(S);
    var num = $('#q-score'), bar = $('#q-bar');
    var pill = $('#score-pill');
    pill.textContent = q.score + '/100';
    /* keep "no-print": the score is not part of the printed prompt */
    pill.className = 'badge no-print ' + ['danger', 'accent', 'primary', 'success'][q.level];
    $('#jump-score').textContent = '· ' + q.score + '/100';
    num.textContent = String(q.score);
    num.className = 'score-num lvl-' + q.level;
    bar.style.width = q.score + '%';
    bar.className = 'lvl-' + q.level;
    var lv = $('#q-level');
    lv.innerHTML = '';
    lv.appendChild(el('strong', { class: 'lvl-' + q.level, text: t('lvl_' + q.level) }));
    var list = $('#q-list');
    list.innerHTML = '';
    CHECKS.forEach(function (k) {
      var ok = q.st[k], half = k === 'task' && q.taskShort;
      list.appendChild(el('li', { class: ok ? 'ok' : half ? 'half' : 'miss', 'data-k': k },
        el('span', { class: 'ic', 'aria-hidden': 'true', text: ok ? '✓' : half ? '½' : '' }),
        el('span', { text: t('q_' + k) }),
        el('span', { class: 'sr-only', style: { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }, text: ok ? ' ✓' : ' ✗' })));
    });
    var tips = $('#q-tips');
    tips.innerHTML = '';
    if (q.br.length) tips.appendChild(el('li', { class: 'tip-br', text: t('tip_brackets', { list: q.br.slice(0, 4).join(', ') + (q.br.length > 4 ? ' …' : '') }) }));
    CHECKS.forEach(function (k) {
      if (q.st[k]) return;
      tips.appendChild(el('li', { 'data-tip': k, text: t(k === 'task' && q.taskShort ? 'tip_task_short' : 'tip_' + k) }));
    });
    if (!tips.children.length) tips.appendChild(el('li', { class: 'ok', text: t('all_good') }));
    var pd = personalData(S), box = $('#pii');
    box.hidden = !pd.length;
    box.textContent = pd.length ? t('pii_warn', { what: pd.map(function (k) { return t(k); }).join(', ') }) : '';
    return q;
  }

  function dateStr(ms) {
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag + '-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms)); }
    catch (e) { try { return new Date(ms).toISOString().slice(0, 10); } catch (e2) { return ''; } }
  }
  function renderFavs() {
    var box = $('#favs');
    box.innerHTML = '';
    $('#favs-empty').hidden = favs.length > 0;
    $('#favs-count').textContent = t('saved_count', { n: EDU.fmt(favs.length) });
    favs.forEach(function (f) {
      var text = assemble(f.s);
      box.appendChild(el('article', { class: 'card flat fav', 'data-id': f.id },
        el('div', { class: 'row spread nowrap' },
          el('span', { class: 'fav-name no-i18n', dir: 'auto', text: f.name || t('untitled') }),
          el('span', { class: 'badge primary', text: langName(f.s.alang) })),
        el('span', { class: 'tiny muted', text: dateStr(f.at) }),
        el('p', { class: 'small fav-snip no-i18n', dir: EDU.langInfo(f.s.alang).dir, lang: f.s.alang, text: text }),
        el('div', { class: 'row' },
          el('button', { type: 'button', class: 'btn btn-sm btn-primary fav-load', text: t('fav_load'), onclick: function () { loadFav(f.id); } }),
          el('button', { type: 'button', class: 'btn btn-sm fav-copy', text: t('copy'), onclick: function () { EDU.copy(text); } }),
          el('button', { type: 'button', class: 'btn btn-sm btn-danger fav-del', text: t('delete'), onclick: function () { delFav(f.id); } }))));
    });
  }

  function update() {
    renderPreview();
    renderQuality();
    EDU.$$('.tpl').forEach(function (b) { b.setAttribute('aria-pressed', String(isPristine() && S.tpl.id === b.getAttribute('data-tpl'))); });
    EDU.$$('#chips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(chipActive(+c.getAttribute('data-chip')))); });
    save();
  }
  function renderAll() {
    renderLangSelect();
    renderTemplates();
    renderChips();
    renderFavs();
    fillForm();
    update();
  }

  /* ---------------- actions ---------------- */
  function pickTemplate(id) {
    if (hasText() && !isPristine() && !confirm(t('confirm_replace'))) return;
    loadTemplate(id, S.alang, false);
    fillForm();
    update();
    EDU.toast(t('tpl_loaded', { name: C(EDU.lang).templates[id].title }));
    if (window.innerWidth < 980) { try { $('#builder').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { } }
  }
  function changeAnswerLang(code, manual) {
    if (CODES.indexOf(code) < 0 || code === S.alang) { if (manual) S.manual = true; return; }
    var pristine = isPristine();
    S.alang = code;
    if (manual) S.manual = true;
    if (pristine) {
      loadTemplate(S.tpl.id, code, true);
      fillForm();
      if (manual) EDU.toast(t('tpl_switched', { lang: langName(code) }));
    }
    F.lang.value = code;
    EDU.$$('#chips .chip').forEach(function (c) { c.title = C(code).chips[+c.getAttribute('data-chip')].text; });
    update();
  }
  function toggleChip(i) {
    readForm();
    var have = lines(S.cons), texts = [C(S.alang).chips[i].text, C(EDU.lang).chips[i].text];
    var present = have.filter(function (l) { return texts.indexOf(l) >= 0; });
    if (present.length) {
      S.cons = S.cons.split(/\r?\n/).filter(function (l) {
        return texts.indexOf(cleanLine(l)) < 0;
      }).join('\n').replace(/^\n+|\n+$/g, '');
    } else {
      S.cons = S.cons.replace(/\s+$/, '') + (S.cons.trim() ? '\n' : '') + texts[0];
    }
    F.cons.value = S.cons;
    autosize(F.cons);
    update();
  }
  function resetForm() {
    if (hasText() && !confirm(t('confirm_clear'))) return;
    S = blank(S.alang, S.manual);
    fillForm();
    update();
    try { F.task.focus(); } catch (e) { }
  }
  function currentText() { return assemble(S); }
  function autoName() {
    if (S.tpl) return C(EDU.lang).templates[S.tpl.id].title;
    var x = S.task.trim().replace(/\s+/g, ' ');
    return x ? (x.length > 48 ? x.slice(0, 47) + '…' : x) : t('untitled');
  }
  function saveFav() {
    readForm();
    if (!currentText()) { EDU.toast(t('nothing_to_copy')); return; }
    var typed = $('#fav-name').value.trim().slice(0, 80), name = typed || autoName().slice(0, 80);
    /* A double tap (or pressing Save twice) must not fill the list with copies of the same prompt.
       (The first tap empties the name box, so the second one has no name of its own.) */
    var last = favs[0];
    if (last && (!typed || typed === last.name) && JSON.stringify(normalize(last.s)) === JSON.stringify(normalize(S))) {
      $('#fav-name').value = '';
      EDU.toast(t('fav_saved'));
      return;
    }
    var before = favs.slice();
    favs.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name, at: Date.now(), s: copyState(S) });
    if (favs.length > MAX_FAVS) favs.length = MAX_FAVS;
    /* store.set() returns false when the browser storage is full or blocked: don't pretend it worked */
    if (store.set('favs', favs) === false) { favs = before; EDU.toast(t('fav_failed'), 5000); return; }
    $('#fav-name').value = '';
    renderFavs();
    EDU.toast(t('fav_saved'));
  }
  function loadFav(id) {
    var f = favs.filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    if (hasText() && !isPristine() && !confirm(t('confirm_load'))) return;
    S = normalize(copyState(f.s));
    S.manual = true;
    fillForm();
    update();
    EDU.toast(t('fav_loaded'));
    try { $('#preview-card').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { }
  }
  function delFav(id) {
    if (!confirm(t('confirm_del'))) return;
    favs = favs.filter(function (x) { return x.id !== id; });
    store.set('favs', favs);
    renderFavs();
  }
  /* Public address of this app (also from a downloaded ZIP opened as file://, whose own path would
     only work on this computer), plus the packed prompt in the #hash. */
  function shareBase() {
    try { if (typeof EDU.shareUrl === 'function') { var u = EDU.shareUrl(EDU.lang); if (/^https?:\/\//.test(u)) return u; } } catch (e) { }
    return location.href.split('#')[0];
  }
  function shareLink() {
    readForm();
    if (!currentText()) { EDU.toast(t('nothing_to_copy')); return; }
    var s = copyState(S); delete s.manual;
    EDU.share(shareBase() + '#p=' + EDU.pack(s), t('app_title'));
  }
  /* A prompt packed into the address (#p=…) by "Share link". */
  function sharedFromHash() {
    try {
      var m = /[#&]p=([A-Za-z0-9_-]+)/.exec(location.hash || '');
      var o = m ? EDU.unpack(m[1]) : null;
      return o && typeof o === 'object' && !Array.isArray(o) ? o : null;
    } catch (e) { return null; }
  }
  function dropHash() { try { history.replaceState(history.state, '', location.href.split('#')[0]); } catch (e) { } }
  function localDate() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /* ---------------- events ---------------- */
  TEXT.forEach(function (k) { F[k].addEventListener('input', function () { autosize(F[k]); readForm(); update(); }); });
  /* Enter in the one-line role box jumps to the task (but not while an Indic keyboard/IME is composing). */
  F.role.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); F.task.focus(); } });
  ['aud', 'fmt', 'tone', 'len', 'ask', 'unsure'].forEach(function (k) { F[k].addEventListener('change', function () { readForm(); update(); }); });
  F.lang.addEventListener('change', function () { readForm(); changeAnswerLang(F.lang.value, true); });
  $('#btn-reset').addEventListener('click', resetForm);
  $('#btn-copy').addEventListener('click', function () {
    var text = currentText();
    if (!text) { EDU.toast(t('nothing_to_copy')); return; }
    EDU.copy(text);
  });
  $('#btn-save').addEventListener('click', saveFav);
  $('#fav-name').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) saveFav(); });
  $('#btn-share').addEventListener('click', shareLink);
  $('#btn-dl').addEventListener('click', function () {
    var text = currentText();
    if (!text) { EDU.toast(t('nothing_to_copy')); return; }
    EDU.download('prompt-' + localDate() + '.txt', text);   /* local date, not UTC (IST is +5:30) */
  });
  $('#btn-print').addEventListener('click', function () { window.print(); });
  $('#btn-fs').addEventListener('click', function () { EDU.fullscreen($('#preview-card')); });

  /* Phones: a floating button jumps to the prompt while the form is on screen. */
  (function jumpButton() {
    var btn = $('#jump'), seen = { builder: false, preview: false };
    if (!('IntersectionObserver' in window)) return;
    btn.addEventListener('click', function () {
      try { $('#preview-card').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { }
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id === 'builder' ? 'builder' : 'preview'] = en.isIntersecting; });
      btn.hidden = !(seen.builder && !seen.preview);
    }, { threshold: 0 });
    io.observe($('#builder'));
    io.observe($('#preview-card'));
  })();

  /* Until the answer language is picked by hand it follows the page language, but only while the form
     is empty or holds an untouched template (which is then re-localised). Once the user has typed,
     their words are in the old language, so switching the scaffold would give a mixed-language prompt
     ("आप a maths teacher हैं।"); the answer language then stays until they change it themselves. */
  function followPageLang(code) {
    if (S.manual || S.alang === code || CODES.indexOf(code) < 0) return;
    var pristine = isPristine();
    if (!pristine && hasText()) return;
    S.alang = code;
    if (pristine) loadTemplate(S.tpl.id, code, true);
  }
  EDU.onLang(function (code) {
    followPageLang(code);
    renderAll();
  });

  /* Textareas grow with their text. Their width changes when a phone turns or a window is resized,
     and the line height changes when the Indic web font arrives, so measure again then
     (the one-line role box has no scrollbar, so it would otherwise cut text off). */
  (function () {
    var timer = null;
    window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(autosizeAll, 120); });
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(autosizeAll); } catch (e) { }
    try { if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', autosizeAll); } catch (e) { }
  })();

  /* A shared link pasted into a tab where the app is already open only changes the #hash. */
  window.addEventListener('hashchange', function () {
    var o = sharedFromHash();
    if (!o) return;
    dropHash();
    readForm();
    if (hasText() && !isPristine() && !confirm(t('confirm_load'))) return;
    S = normalize(o);
    S.manual = true;
    renderAll();
    EDU.toast(t('shared_loaded'));
  });

  /* ---------------- start ---------------- */
  (function start() {
    var fromLink = sharedFromHash(), d = store.get('draft', null);
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      S = normalize(d);
      followPageLang(EDU.lang);
    } else {
      S = blank(EDU.lang, false);
      loadTemplate('explain', EDU.lang, false);
    }
    if (fromLink) {
      dropHash();
      /* Opening a shared link must not silently wipe a prompt the user was still writing
         (the draft is saved automatically, and people rely on that). */
      var incoming = normalize(fromLink);
      if (!hasText() || isPristine() || assemble(incoming) === assemble(S) || confirm(t('confirm_load'))) {
        S = incoming;
        S.manual = true;
        setTimeout(function () { EDU.toast(t('shared_loaded')); }, 300);
      }
    }
    renderAll();
  })();
})();
