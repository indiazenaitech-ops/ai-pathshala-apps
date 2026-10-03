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
      ask: false, unsure: false, alang: alang || EDU.lang, manual: !!manual, tpl: null };
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
  function fill(frame, x) { return frame.replace('{x}', function () { return x; }); }
  function lines(text) {
    return String(text || '').split(/\r?\n/).map(function (l) {
      return l.replace(/^\s*(?:[-*•●▪◦–]|\d{1,2}[.)])\s*/, '').trim();
    }).filter(Boolean);
  }
  function assemble(s) {
    var A = C(s.alang).asm, paras = [], p;
    var role = s.role.trim(), task = s.task.trim(), ctx = s.context.trim(), cons = lines(s.cons), ex = s.ex.trim();
    if (!role && !task && !ctx && !cons.length && !ex) return '';
    if (role) paras.push(fill(A.role, stripEnd(role)));
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
    if (br.length) score = Math.max(0, score - 10);
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
  var S = blank();
  var favs = (function (a) {
    return (Array.isArray(a) ? a : []).filter(function (f) { return f && typeof f === 'object' && f.s; }).slice(0, MAX_FAVS).map(function (f) {
      return { id: String(f.id || Math.random()), name: String(f.name || '').slice(0, 80), at: +f.at || Date.now(), s: normalize(f.s) };
    });
  })(store.get('favs', []));

  function save() { store.set('draft', S); }

  /* ---------------- rendering ---------------- */
  function fillForm() {
    TEXT.forEach(function (k) { if (F[k].value !== S[k]) F[k].value = S[k]; });
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
    catch (e) { return new Date(ms).toISOString().slice(0, 10); }
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
        el('p', { class: 'small fav-snip no-i18n', dir: 'auto', text: text }),
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
        var clean = l.replace(/^\s*(?:[-*•●▪◦–]|\d{1,2}[.)])\s*/, '').trim();
        return texts.indexOf(clean) < 0;
      }).join('\n').replace(/^\n+|\n+$/g, '');
    } else {
      S.cons = S.cons.replace(/\s+$/, '') + (S.cons.trim() ? '\n' : '') + texts[0];
    }
    F.cons.value = S.cons;
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
    var name = $('#fav-name').value.trim() || autoName();
    favs.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name.slice(0, 80), at: Date.now(), s: copyState(S) });
    if (favs.length > MAX_FAVS) favs.length = MAX_FAVS;
    store.set('favs', favs);
    $('#fav-name').value = '';
    renderFavs();
    EDU.toast(t('fav_saved'));
  }
  function loadFav(id) {
    var f = favs.filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    if (hasText() && !isPristine() && !confirm(t('confirm_replace'))) return;
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
  function shareLink() {
    var s = copyState(S); delete s.manual;
    var base = location.href.split('#')[0];
    EDU.share(base + '#p=' + EDU.pack(s), t('app_title'));
  }

  /* ---------------- events ---------------- */
  TEXT.forEach(function (k) { F[k].addEventListener('input', function () { readForm(); update(); }); });
  ['aud', 'fmt', 'tone', 'len', 'ask', 'unsure'].forEach(function (k) { F[k].addEventListener('change', function () { readForm(); update(); }); });
  F.lang.addEventListener('change', function () { readForm(); changeAnswerLang(F.lang.value, true); });
  $('#btn-reset').addEventListener('click', resetForm);
  $('#btn-copy').addEventListener('click', function () {
    var text = currentText();
    if (!text) { EDU.toast(t('nothing_to_copy')); return; }
    EDU.copy(text);
  });
  $('#btn-save').addEventListener('click', saveFav);
  $('#fav-name').addEventListener('keydown', function (e) { if (e.key === 'Enter') saveFav(); });
  $('#btn-share').addEventListener('click', shareLink);
  $('#btn-dl').addEventListener('click', function () {
    var text = currentText();
    if (!text) { EDU.toast(t('nothing_to_copy')); return; }
    EDU.download('prompt-' + new Date().toISOString().slice(0, 10) + '.txt', text);
  });
  $('#btn-print').addEventListener('click', function () { window.print(); });
  $('#btn-fs').addEventListener('click', function () { EDU.fullscreen($('#preview-card')); });

  EDU.onLang(function (code) {
    if (!S.manual && S.alang !== code) {
      var pristine = isPristine();
      S.alang = code;
      if (pristine) loadTemplate(S.tpl.id, code, true);
    }
    renderAll();
  });

  /* ---------------- start ---------------- */
  (function start() {
    var fromLink = null;
    try {
      var m = /[#&]p=([A-Za-z0-9_-]+)/.exec(location.hash || '');
      if (m) fromLink = EDU.unpack(m[1]);
    } catch (e) { fromLink = null; }
    if (fromLink && typeof fromLink === 'object') {
      S = normalize(fromLink);
      S.manual = true;
      try { history.replaceState(history.state, '', location.href.split('#')[0]); } catch (e) { }
      setTimeout(function () { EDU.toast(t('shared_loaded')); }, 300);
    } else {
      var d = store.get('draft', null);
      if (d && typeof d === 'object') {
        S = normalize(d);
        if (!S.manual && S.alang !== EDU.lang) {
          var pristine = isPristine();
          S.alang = EDU.lang;
          if (pristine) loadTemplate(S.tpl.id, EDU.lang, true);
        }
      } else {
        S = blank(EDU.lang, false);
        loadTemplate('explain', EDU.lang, false);
      }
    }
    renderAll();
  })();
})();
