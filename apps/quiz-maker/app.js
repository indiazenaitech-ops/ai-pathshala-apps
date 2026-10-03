/* Quiz Maker & Player: make MCQ / true-false quizzes, play them on the projector with
   team scores, practise on phones (share link with the quiz packed in the URL hash),
   print worksheets with an answer key, import/export JSON + CSV. Everything stays on the device. */
(function () {
  'use strict';
  var SLUG = 'quiz-maker';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$;
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  var TEAM_LETTERS = ['A', 'B', 'C', 'D'];
  var TIMERS = [0, 10, 20, 30, 60];
  var MAX_OPTS = 6, MAX_Q = 200;

  /* ---------------------------------------------------------------- model */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function str(v, max) { return String(v == null ? '' : v).replace(/\r\n?/g, '\n').trim().slice(0, max || 1000); }

  /* Returns a clean question or null. type 'tf' answer: 0 = True, 1 = False. */
  function normQuestion(q) {
    if (!q || typeof q !== 'object') return null;
    var text = str(q.text, 1000);
    if (!text) return null;
    var out = { id: q.id && typeof q.id === 'string' ? q.id : uid(), type: q.type === 'tf' ? 'tf' : 'mcq', text: text, options: [], answer: 0, explain: str(q.explain, 600) };
    var ans = parseInt(q.answer, 10);
    if (out.type === 'tf') { out.answer = ans === 1 ? 1 : 0; return out; }
    var raw = Array.isArray(q.options) ? q.options : [];
    var newAns = -1;
    raw.forEach(function (o, i) {
      var s = str(o, 300);
      if (!s || out.options.length >= MAX_OPTS) return;
      if (i === ans) newAns = out.options.length;
      out.options.push(s);
    });
    if (out.options.length < 2 || newAns < 0) return null;
    out.answer = newAns;
    return out;
  }
  function normQuiz(raw) {
    raw = raw || {};
    var qs = (Array.isArray(raw.questions) ? raw.questions : []).map(normQuestion).filter(Boolean).slice(0, MAX_Q);
    var qz = { id: typeof raw.id === 'string' ? raw.id : uid(), title: str(raw.title, 120), questions: qs, updated: Date.now() };
    if (raw.sample) qz.sample = raw.sample;
    return qz;
  }
  function sampleQuiz(lang, id) {
    var C = window.APP_CONTENT || {};
    var c = C[lang] || C.en || { title: '', questions: [] };
    var q = normQuiz({ title: c.title, questions: c.questions, sample: lang });
    if (id) q.id = id;
    return q;
  }

  /* ---------------------------------------------------------------- state */
  var quizzes = store.get('quizzes', null);
  if (!Array.isArray(quizzes)) quizzes = null; else quizzes = quizzes.map(normQuiz);
  if (!quizzes || !quizzes.length) quizzes = [sampleQuiz(EDU.lang)];
  var currentId = store.get('current', quizzes[0].id);
  var settings = Object.assign({ timer: 0, teams: 4, shuffleQ: false, shuffleO: false, names: ['', '', '', ''], key: true, lines: true, expl: false }, store.get('settings', {}));
  if (!Array.isArray(settings.names)) settings.names = ['', '', '', ''];
  var scores = store.get('scores', [0, 0, 0, 0]);
  if (!Array.isArray(scores) || scores.length !== 4) scores = [0, 0, 0, 0];
  var tab = store.get('tab', 'edit');
  var shared = null;            // quiz opened from a share link (#quiz=...)

  function cur() {
    if (shared) return shared;
    for (var i = 0; i < quizzes.length; i++) if (quizzes[i].id === currentId) return quizzes[i];
    currentId = quizzes[0].id;
    return quizzes[0];
  }
  function saveQuizzes() { store.set('quizzes', quizzes); store.set('current', currentId); }
  function saveSettings() { store.set('settings', settings); }
  function touch(qz) { delete qz.sample; qz.updated = Date.now(); saveQuizzes(); }
  function titleOf(qz) { return qz.title || t('untitled'); }

  /* ---------------------------------------------------------------- helpers */
  function optsOf(q) { return q.type === 'tf' ? [t('true'), t('false')] : q.options; }
  function letterCls(i) { return 'lt' + (i ? ' l' + i : ''); }
  function ltMini(i) { return el('span', { class: 'lt-mini', 'aria-hidden': 'true', text: LETTERS[i] }); }
  function teamName(i) { return (settings.names[i] || '').trim() || t('team_n', { n: TEAM_LETTERS[i] }); }
  /* A play deck: [{ q, perm }] where perm = display order of original option indexes. */
  function makeDeck(questions, shufQ, shufO) {
    var list = shufQ ? EDU.shuffle(questions) : questions.slice();
    return list.map(function (q) {
      var idx = optsOf(q).map(function (_, i) { return i; });
      return { q: q, perm: (shufO && q.type === 'mcq') ? EDU.shuffle(idx) : idx };
    });
  }
  /* "B. New Delhi" as a node; the letter is a <bdi> so it stays first in Urdu (RTL) too. */
  function ansNode(card, origIdx) {
    var q = card.q, opts = optsOf(q);
    if (q.type === 'tf') return el('span', { text: opts[origIdx] });
    return el('span', { class: 'no-i18n' }, ltMini(card.perm.indexOf(origIdx)), opts[origIdx]);
  }
  function setBar(span, frac) { span.style.width = Math.round(EDU.clamp(frac, 0, 1) * 100) + '%'; }

  var audioCtx = null;
  function beep() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      [0, 0.22].forEach(function (d) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, audioCtx.currentTime + d);
        g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + d + 0.18);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(audioCtx.currentTime + d); o.stop(audioCtx.currentTime + d + 0.2);
      });
    } catch (e) { /* no audio: fine */ }
  }

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------------------------------------------------------- quiz bar */
  var quizSel = $('#quizSel');
  function renderQuizBar() {
    quizSel.innerHTML = '';
    quizzes.forEach(function (qz) {
      quizSel.appendChild(el('option', { value: qz.id, text: titleOf(qz) + '  (' + EDU.fmt(qz.questions.length) + ')' }));
    });
    quizSel.value = cur().id;
    quizSel.setAttribute('aria-label', t('my_quizzes'));
  }
  quizSel.addEventListener('change', function () {
    currentId = quizSel.value; store.set('current', currentId);
    resetEditor(); stopClass(); resetPractice(); render();
  });
  $('#newQuiz').addEventListener('click', function () {
    var qz = normQuiz({ title: '', questions: [] });
    quizzes.push(qz); currentId = qz.id; saveQuizzes();
    resetEditor(); stopClass(); resetPractice(); setTab('edit');
    $('#quizTitle').focus();
  });
  $('#dupQuiz').addEventListener('click', function () {
    var src = cur();
    var copy = normQuiz(JSON.parse(JSON.stringify(src)));
    copy.id = uid(); delete copy.sample;
    copy.questions.forEach(function (q) { q.id = uid(); });
    copy.title = t('copy_of', { name: titleOf(src) }).slice(0, 120);
    quizzes.push(copy); currentId = copy.id; saveQuizzes();
    resetEditor(); stopClass(); resetPractice(); render();
    EDU.toast(t('copy_made'));
  });
  $('#delQuiz').addEventListener('click', function () {
    var qz = cur();
    if (!confirm(t('confirm_delete_quiz', { name: titleOf(qz) }))) return;
    quizzes = quizzes.filter(function (x) { return x.id !== qz.id; });
    if (!quizzes.length) quizzes.push(sampleQuiz(EDU.lang));
    currentId = quizzes[0].id; saveQuizzes();
    resetEditor(); stopClass(); resetPractice(); render();
  });

  /* ---------------------------------------------------------------- tabs */
  var TABS = ['edit', 'class', 'practice', 'share'];
  function setTab(name) {
    if (TABS.indexOf(name) < 0) name = 'edit';
    if (shared) name = 'practice';
    tab = name; if (!shared) store.set('tab', tab);
    if (name !== 'class') pauseTimer();
    render();
  }
  EDU.$$('#tabs button').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var rtl = document.documentElement.dir === 'rtl';
      var step = (e.key === 'ArrowRight') !== rtl ? 1 : -1;
      var i = (TABS.indexOf(b.getAttribute('data-tab')) + step + TABS.length) % TABS.length;
      setTab(TABS[i]); $('#tab-' + TABS[i]).focus(); e.preventDefault();
    });
  });
  function renderTabs() {
    TABS.forEach(function (name) {
      var on = name === tab;
      var b = $('#tab-' + name);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#p-' + name).hidden = !on;
    });
  }

  /* ---------------------------------------------------------------- editor */
  var ed = { id: null, type: 'mcq', options: ['', '', '', ''], answer: -1 };
  function resetEditor(keepType) {
    ed = { id: null, type: keepType ? ed.type : 'mcq', options: ['', '', '', ''], answer: -1 };
    $('#qText').value = ''; $('#qExplain').value = ''; $('#edMsg').textContent = '';
    $('#tfTrue').checked = true;
  }
  function renderOptRows() {
    var box = $('#optList');
    box.innerHTML = '';
    ed.options.forEach(function (val, i) {
      var radio = el('input', { type: 'radio', name: 'mcqAns', id: 'ans' + i, 'aria-label': t('mark_correct', { n: LETTERS[i] }), title: t('mark_correct', { n: LETTERS[i] }) });
      radio.checked = ed.answer === i;
      radio.addEventListener('change', function () { if (radio.checked) { ed.answer = i; $('#edMsg').textContent = ''; } });
      var input = el('input', { type: 'text', id: 'opt' + i, maxlength: 300, placeholder: t('option_n', { n: LETTERS[i] }), 'aria-label': t('option_n', { n: LETTERS[i] }) });
      input.value = val;
      input.addEventListener('input', function () { ed.options[i] = input.value; });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); var nx = $('#opt' + (i + 1)); if (nx) nx.focus(); else saveQuestion(); }
      });
      var rm = ed.options.length > 2 ? el('button', { type: 'button', class: 'edu-iconbtn', 'aria-label': t('remove_option'), title: t('remove_option'), text: '✕', onclick: function () {
        ed.options.splice(i, 1);
        if (ed.answer === i) ed.answer = -1; else if (ed.answer > i) ed.answer--;
        renderOptRows();
      } }) : null;
      box.appendChild(el('div', { class: 'optrow' }, radio, el('span', { class: 'lt-sm', 'aria-hidden': 'true', text: LETTERS[i] }), input, rm));
    });
    $('#addOpt').disabled = ed.options.length >= MAX_OPTS;
  }
  function renderEditor() {
    var qz = cur();
    var idx = -1;
    if (ed.id) qz.questions.forEach(function (q, i) { if (q.id === ed.id) idx = i; });
    if (ed.id && idx < 0) ed.id = null;
    $('#edHead').textContent = ed.id ? t('edit_question', { n: EDU.fmt(idx + 1) }) : t('add_question');
    $('#saveQ').textContent = ed.id ? t('update_question') : t('save_question');
    $('#cancelEdit').hidden = !ed.id;
    $('#typeMcq').setAttribute('aria-pressed', ed.type === 'mcq' ? 'true' : 'false');
    $('#typeTf').setAttribute('aria-pressed', ed.type === 'tf' ? 'true' : 'false');
    $('#typeSeg').setAttribute('aria-label', t('question_type'));
    $('#mcqBox').hidden = ed.type !== 'mcq';
    $('#tfBox').hidden = ed.type !== 'tf';
    renderOptRows();
  }
  $('#typeMcq').addEventListener('click', function () { ed.type = 'mcq'; renderEditor(); });
  $('#typeTf').addEventListener('click', function () { ed.type = 'tf'; renderEditor(); });
  $('#addOpt').addEventListener('click', function () {
    if (ed.options.length >= MAX_OPTS) return;
    ed.options.push(''); renderOptRows();
    var last = $('#opt' + (ed.options.length - 1)); if (last) last.focus();
  });
  $('#cancelEdit').addEventListener('click', function () { resetEditor(); render(); });
  $('#jumpAdd').addEventListener('click', function () {
    if (ed.id) { resetEditor(); render(); }
    $('#editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#qText').focus({ preventScroll: true });
  });
  $('#saveQ').addEventListener('click', saveQuestion);

  function saveQuestion() {
    var qz = cur(), msg = $('#edMsg');
    var text = str($('#qText').value, 1000);
    if (!text) { msg.textContent = t('err_no_text'); $('#qText').focus(); return; }
    var raw = { id: ed.id || uid(), type: ed.type, text: text, explain: $('#qExplain').value };
    if (ed.type === 'tf') raw.answer = $('#tfFalse').checked ? 1 : 0;
    else {
      var filled = ed.options.filter(function (o) { return str(o); }).length;
      if (filled < 2) { msg.textContent = t('err_options'); var f = $('#opt0'); if (f) f.focus(); return; }
      if (ed.answer < 0 || !str(ed.options[ed.answer])) { msg.textContent = t('err_correct'); return; }
      raw.options = ed.options.slice(); raw.answer = ed.answer;
    }
    var q = normQuestion(raw);
    if (!q) { msg.textContent = t('err_options'); return; }
    if (ed.id) {
      qz.questions = qz.questions.map(function (x) { return x.id === ed.id ? q : x; });
      EDU.toast(t('updated'));
    } else {
      if (qz.questions.length >= MAX_Q) { msg.textContent = t('too_many', { n: EDU.fmt(MAX_Q) }); return; }
      qz.questions.push(q);
      EDU.toast(t('added'));
    }
    touch(qz); resetEditor(true); render();
    $('#qText').focus();
  }

  function startEdit(q) {
    ed = { id: q.id, type: q.type, options: q.type === 'mcq' ? q.options.slice() : ['', '', '', ''], answer: q.type === 'mcq' ? q.answer : -1 };
    $('#qText').value = q.text; $('#qExplain').value = q.explain || ''; $('#edMsg').textContent = '';
    $('#tfTrue').checked = q.type !== 'tf' || q.answer === 0; $('#tfFalse').checked = q.type === 'tf' && q.answer === 1;
    render();
    $('#editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#qText').focus({ preventScroll: true });
  }
  function moveQ(i, d) {
    var qz = cur(), j = i + d;
    if (j < 0 || j >= qz.questions.length) return;
    var a = qz.questions[i]; qz.questions[i] = qz.questions[j]; qz.questions[j] = a;
    touch(qz); render();
    var btn = $('#qList .qitem:nth-child(' + (j + 1) + ') [data-act="' + (d < 0 ? 'up' : 'down') + '"]');
    if (btn && !btn.disabled) btn.focus();
  }
  function deleteQ(i) {
    var qz = cur();
    if (!confirm(t('confirm_delete_q', { n: EDU.fmt(i + 1) }))) return;
    var gone = qz.questions.splice(i, 1)[0];
    if (gone && ed.id === gone.id) resetEditor();
    touch(qz); render(); EDU.toast(t('deleted_q'));
  }

  function renderList() {
    var qz = cur(), box = $('#qList');
    box.innerHTML = '';
    $('#qCount').textContent = t('q_count', { n: EDU.fmt(qz.questions.length) });
    if (!qz.questions.length) { box.appendChild(el('div', { class: 'empty', text: t('no_questions') })); return; }
    qz.questions.forEach(function (q, i) {
      var opts = optsOf(q);
      var ul = el('ul', { class: 'qopts' + (q.type === 'mcq' ? ' no-i18n' : '') });
      opts.forEach(function (o, k) {
        var right = k === q.answer;
        ul.appendChild(el('li', { class: right ? 'is-correct' : '' }, q.type === 'mcq' ? ltMini(k) : null, o, right ? '  ✓' : null));
      });
      var n = EDU.fmt(i + 1);
      var acts = el('div', { class: 'qactions' },
        el('button', { type: 'button', class: 'edu-iconbtn', 'data-act': 'up', 'aria-label': t('move_up', { n: n }), title: t('move_up', { n: n }), text: '↑', disabled: i === 0, onclick: function () { moveQ(i, -1); } }),
        el('button', { type: 'button', class: 'edu-iconbtn', 'data-act': 'down', 'aria-label': t('move_down', { n: n }), title: t('move_down', { n: n }), text: '↓', disabled: i === qz.questions.length - 1, onclick: function () { moveQ(i, 1); } }),
        el('button', { type: 'button', class: 'edu-iconbtn', 'data-act': 'edit', 'aria-label': t('edit_question', { n: n }), title: t('edit_question', { n: n }), text: '✎', onclick: function () { startEdit(q); } }),
        el('button', { type: 'button', class: 'edu-iconbtn', 'data-act': 'del', 'aria-label': t('delete_question', { n: n }), title: t('delete_question', { n: n }), text: '🗑', onclick: function () { deleteQ(i); } }));
      box.appendChild(el('div', { class: 'qitem' + (ed.id === q.id ? ' editing' : ''), 'data-qid': q.id },
        el('div', { class: 'qnum', text: n }),
        el('div', { class: 'qbody' },
          el('span', { class: 'badge', text: q.type === 'tf' ? t('type_tf') : t('type_mcq') }),
          el('div', { class: 'qtext no-i18n', text: q.text }),
          ul,
          q.explain ? el('div', { class: 'qexpl no-i18n', text: '💡 ' + q.explain }) : null),
        acts));
    });
  }

  var titleInput = $('#quizTitle');
  titleInput.addEventListener('input', function () {
    if (shared) return;
    var qz = cur();
    qz.title = titleInput.value.slice(0, 120); touch(qz); renderQuizBar();
  });

  /* ---------------------------------------------------------------- import / export */
  var CSV_HEAD = ['question', 'option1', 'option2', 'option3', 'option4', 'option5', 'option6', 'correct', 'explanation'];
  function safeName(s) { return (String(s || '').replace(/[\\/:*?"<>|#%\n\r\t]+/g, ' ').trim().slice(0, 60) || 'quiz'); }
  function quizToCsvRows(qz) {
    var rows = [CSV_HEAD];
    qz.questions.forEach(function (q) {
      var o = q.type === 'tf' ? [t('true'), t('false')] : q.options.slice();
      while (o.length < MAX_OPTS) o.push('');
      rows.push([q.text].concat(o, [q.answer + 1, q.explain || '']));
    });
    return rows;
  }
  function exportable(qz) {
    return { app: 'quiz-maker', version: 1, quiz: { title: qz.title, questions: qz.questions.map(function (q) {
      return { type: q.type, text: q.text, options: q.type === 'mcq' ? q.options : [], answer: q.answer, explain: q.explain || '' };
    }) } };
  }
  $('#exportJson').addEventListener('click', function () {
    var qz = cur();
    EDU.download(safeName(titleOf(qz)) + '.json', JSON.stringify(exportable(qz), null, 2), 'application/json');
  });
  $('#exportCsv').addEventListener('click', function () {
    var qz = cur();
    EDU.download(safeName(titleOf(qz)) + '.csv', EDU.csv.stringify(quizToCsvRows(qz)), 'text/csv');
  });
  $('#csvTemplate').addEventListener('click', function () {
    EDU.download('quiz-template.csv', EDU.csv.stringify(quizToCsvRows(sampleQuiz(EDU.lang))), 'text/csv');
  });

  /* words that mean True / False in any of our languages (for CSV import) */
  function tfWords(key) {
    var out = {};
    out[key] = 1; out[key.charAt(0)] = 1;
    var S = window.APP_STRINGS || {};
    Object.keys(S).forEach(function (L) { if (S[L] && S[L][key]) out[String(S[L][key]).trim().toLowerCase()] = 1; });
    return out;
  }
  function ansIndex(v) {
    v = String(v == null ? '' : v).trim().toUpperCase().replace(/^OPTION\s*/, '').replace(/[().]/g, '');
    if (/^[1-6]$/.test(v)) return +v - 1;
    if (v.length === 1 && LETTERS.indexOf(v) >= 0) return LETTERS.indexOf(v);
    return -1;
  }
  /* CSV: question, option1..option6, correct (1-6 or A-F), explanation. Fewer option columns are OK. */
  function parseCsv(text, title) {
    var rows = EDU.csv.parse(text), qs = [], skipped = 0;
    if (!rows.length) return null;
    var T = tfWords('true'), F = tfWords('false');
    var head = rows[0].map(function (c) { return String(c).trim().toLowerCase(); });
    var cCol = -1, eCol = -1;
    head.forEach(function (h, i) {
      if (cCol < 0 && i > 0 && /^(correct|answer|ans\b|key\b|सही|उत्तर)/.test(h)) cCol = i;
      if (eCol < 0 && /^(expl|reason|व्याख्या)/.test(h)) eCol = i;
    });
    var hasHead = cCol > 0 || /^(question|q\b|प्रश्न|सवाल)/.test(head[0] || '');
    if (hasHead) rows = rows.slice(1);
    rows.forEach(function (r) {
      r = r.map(function (c) { return String(c == null ? '' : c); });
      var c = cCol, e = eCol;
      if (c < 0) {
        var cells = r.slice(); while (cells.length && !cells[cells.length - 1].trim()) cells.pop();
        var n = cells.length;
        if (n >= 4 && ansIndex(cells[n - 1]) >= 0) { c = n - 1; e = -1; }
        else if (n >= 5 && ansIndex(cells[n - 2]) >= 0) { c = n - 2; e = n - 1; }
      } else if (e < 0) e = c + 1;
      if (c < 3 || !str(r[0])) { if (r.some(function (x) { return x.trim(); })) skipped++; return; }
      var opts = r.slice(1, c), ans = ansIndex(r[c]);
      var filled = opts.map(function (o) { return o.trim().toLowerCase(); }).filter(Boolean);
      var raw;
      if (filled.length === 2 && T[filled[0]] && F[filled[1]]) raw = { type: 'tf', text: r[0], answer: ans === 1 ? 1 : 0 };
      else raw = { type: 'mcq', text: r[0], options: opts, answer: ans };
      raw.explain = e >= 0 && e < r.length ? r[e] : '';
      var q = normQuestion(raw);
      if (q) qs.push(q); else skipped++;
    });
    return { quizzes: [normQuiz({ title: title, questions: qs })], skipped: skipped };
  }
  function parseImport(text, filename) {
    var title = String(filename || '').replace(/\.[^.]*$/, '').replace(/[_]+/g, ' ').trim().slice(0, 120);
    text = String(text || '').replace(/^﻿/, '').trim();
    if (!text) return null;
    if (text.charAt(0) === '{' || text.charAt(0) === '[') {
      var data; try { data = JSON.parse(text); } catch (e) { return null; }
      var raws = [];
      if (Array.isArray(data)) {
        if (data.length && data[0] && Array.isArray(data[0].questions)) raws = data;
        else raws = [{ title: title, questions: data }];
      } else if (data && Array.isArray(data.quizzes)) raws = data.quizzes;
      else if (data && data.quiz) raws = [data.quiz];
      else if (data && Array.isArray(data.questions)) raws = [data];
      var skipped = 0;
      var out = raws.map(function (r) {
        var qz = normQuiz({ title: (r && r.title) || title, questions: r && r.questions });
        skipped += ((r && Array.isArray(r.questions)) ? r.questions.length : 0) - qz.questions.length;
        return qz;
      });
      return { quizzes: out, skipped: skipped };
    }
    return parseCsv(text, title);
  }
  function addImported(res) {
    var total = 0;
    var good = (res && res.quizzes || []).filter(function (q) { return q.questions.length; });
    if (!good.length) { EDU.toast(t('import_failed'), 6000); return false; }
    good.forEach(function (q) { q.id = uid(); total += q.questions.length; quizzes.push(q); });
    currentId = good[0].id; saveQuizzes();
    resetEditor(); stopClass(); resetPractice(); setTab('edit');
    EDU.toast(t('imported', { n: EDU.fmt(total) }) + (res.skipped ? ' ' + t('skipped_rows', { n: EDU.fmt(res.skipped) }) : ''), 5000);
    return true;
  }
  $('#importBtn').addEventListener('click', function () {
    EDU.pickFile('.json,.csv,.txt,application/json,text/csv').then(function (file) {
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { EDU.toast(t('import_failed'), 6000); return; }
      return EDU.readText(file).then(function (txt) { addImported(parseImport(txt, file.name)); });
    }).catch(function () { EDU.toast(t('import_failed'), 6000); });
  });

  /* ---------------------------------------------------------------- class quiz (projector) */
  var cq = null;   // { deck, i, revealed, picked, finished, deadline, timerId, timeUp }
  function syncShuffleBoxes() {
    ['shufQ', 'prShufQ'].forEach(function (id) { $('#' + id).checked = !!settings.shuffleQ; });
    ['shufO', 'prShufO'].forEach(function (id) { $('#' + id).checked = !!settings.shuffleO; });
  }
  ['shufQ', 'prShufQ'].forEach(function (id) {
    $('#' + id).addEventListener('change', function (e) { settings.shuffleQ = e.target.checked; saveSettings(); syncShuffleBoxes(); });
  });
  ['shufO', 'prShufO'].forEach(function (id) {
    $('#' + id).addEventListener('change', function (e) { settings.shuffleO = e.target.checked; saveSettings(); syncShuffleBoxes(); });
  });

  function renderClassSetup() {
    var qz = cur();
    $('#classQuizName').textContent = '';
    $('#classQuizName').appendChild(el('strong', { class: 'no-i18n', text: titleOf(qz) }));
    $('#classQuizName').appendChild(document.createTextNode(' · ' + t('q_count', { n: EDU.fmt(qz.questions.length) })));
    var ts = $('#timerSeg'); ts.innerHTML = ''; ts.setAttribute('aria-label', t('timer'));
    TIMERS.forEach(function (s) {
      ts.appendChild(el('button', { type: 'button', 'aria-pressed': settings.timer === s ? 'true' : 'false', text: s ? t('seconds', { n: EDU.fmt(s) }) : t('timer_off'),
        onclick: function () { settings.timer = s; saveSettings(); renderClassSetup(); } }));
    });
    var tm = $('#teamSeg'); tm.innerHTML = ''; tm.setAttribute('aria-label', t('teams'));
    [0, 2, 3, 4].forEach(function (n) {
      tm.appendChild(el('button', { type: 'button', 'aria-pressed': settings.teams === n ? 'true' : 'false', text: n ? EDU.fmt(n) : t('no_teams'),
        onclick: function () { settings.teams = n; saveSettings(); renderClassSetup(); renderScoreboard(); } }));
    });
    var ti = $('#teamInputs'); ti.innerHTML = '';
    for (var i = 0; i < Math.max(2, settings.teams); i++) (function (i) {
      var inp = el('input', { type: 'text', maxlength: 30, id: 'teamName' + i, placeholder: t('team_n', { n: TEAM_LETTERS[i] }), 'aria-label': t('team_n', { n: TEAM_LETTERS[i] }) });
      inp.value = settings.names[i] || '';
      inp.addEventListener('input', function () { settings.names[i] = inp.value; saveSettings(); renderScoreboard(); });
      ti.appendChild(inp);
    })(i);
    $('#startClass').disabled = !qz.questions.length;
    syncShuffleBoxes();
  }

  function startClass() {
    var qz = cur();
    if (!qz.questions.length) { EDU.toast(t('empty_quiz')); return; }
    stopClass(true);
    cq = { deck: makeDeck(qz.questions, settings.shuffleQ, settings.shuffleO), i: 0, revealed: false, picked: -1, finished: false, timerId: null, timeUp: false };
    renderCQ(); startTimer();
    $('#classStage').scrollIntoView({ block: 'start' });
    $('#cqReveal').focus({ preventScroll: true });
  }
  function stopClass(keepFull) {
    pauseTimer(); cq = null;
    if (!keepFull && (document.fullscreenElement || document.webkitFullscreenElement)) EDU.fullscreen();
  }
  $('#startClass').addEventListener('click', startClass);
  $('#cqExit').addEventListener('click', function () { stopClass(); render(); });
  $('#cqFull').addEventListener('click', function () { EDU.fullscreen($('#classStage')); });
  $('#cqRestartTimer').addEventListener('click', startTimer);
  $('#cqReveal').addEventListener('click', toggleReveal);
  $('#cqNext').addEventListener('click', function () { goCQ(1); });
  $('#cqPrev').addEventListener('click', function () { goCQ(-1); });
  $('#resetScores').addEventListener('click', function () {
    if (!confirm(t('confirm_reset_scores'))) return;
    scores = [0, 0, 0, 0]; store.set('scores', scores); renderScoreboard(); if (cq && cq.finished) renderCQ();
  });

  function toggleReveal() {
    if (!cq || cq.finished) return;
    cq.revealed = !cq.revealed;
    if (cq.revealed) { pauseTimer(); cq.timeUp = false; }
    renderCQ();
  }
  function goCQ(d) {
    if (!cq) return;
    var n = cq.deck.length;
    if (cq.finished) { if (d < 0) { cq.finished = false; cq.i = n - 1; } else return; }
    else if (cq.i + d >= n) { cq.finished = true; }
    else if (cq.i + d < 0) return;
    else cq.i += d;
    cq.revealed = false; cq.picked = -1;
    if (cq.finished) pauseTimer(); else startTimer();
    renderCQ();
  }
  function startTimer() {
    pauseTimer();
    if (!cq) return;
    cq.timeUp = false;
    if (!cq.finished && settings.timer && !cq.revealed) {
      cq.deadline = Date.now() + settings.timer * 1000;
      cq.timerId = setInterval(tick, 200);
    }
    renderTimer();
  }
  function pauseTimer() { if (cq && cq.timerId) { clearInterval(cq.timerId); cq.timerId = null; } }
  function tick() {
    if (!cq) return;
    if (cq.deadline - Date.now() <= 0) { pauseTimer(); cq.timeUp = true; beep(); }
    renderTimer();
  }
  function renderTimer() {
    var tm = $('#cqTimer');
    tm.className = 'qm-timer';
    var show = cq && !cq.finished && settings.timer;
    $('#cqRestartTimer').hidden = !show;
    if (!show) { tm.textContent = ''; return; }
    if (cq.timeUp) { tm.textContent = t('time_up'); tm.classList.add('up'); return; }
    if (!cq.timerId) { tm.textContent = ''; return; }
    var left = Math.max(0, Math.ceil((cq.deadline - Date.now()) / 1000));
    tm.textContent = EDU.fmt(left);
    if (left <= 5) tm.classList.add('low');
  }

  function addPoint(i, d) {
    scores[i] = EDU.clamp((scores[i] || 0) + d, -99, 999);
    store.set('scores', scores); renderScoreboard();
    if (cq && cq.finished) renderCQ();
  }
  function renderScoreboard() {
    var sb = $('#scoreboard');
    sb.innerHTML = '';
    var n = settings.teams, done = !!(cq && cq.finished);
    sb.hidden = !n || done; $('#scoreTools').hidden = !n;
    if (!n || done) return;
    var top = Math.max.apply(null, scores.slice(0, n));
    for (var i = 0; i < n; i++) (function (i) {
      var name = teamName(i);
      sb.appendChild(el('div', { class: 'team t' + i + (top > 0 && scores[i] === top ? ' lead' : '') },
        el('div', { class: 'team-name' + ((settings.names[i] || '').trim() ? ' no-i18n' : ''), text: name }),
        el('div', { class: 'team-score', id: 'teamScore' + i, 'aria-live': 'polite', text: EDU.fmt(scores[i]) }),
        el('div', { class: 'row' },
          el('button', { type: 'button', class: 'btn', dir: 'ltr', id: 'teamMinus' + i, 'aria-label': t('minus_point', { team: name }), title: t('minus_point', { team: name }), text: '−1', onclick: function () { addPoint(i, -1); } }),
          el('button', { type: 'button', class: 'btn btn-primary', dir: 'ltr', id: 'teamPlus' + i, 'aria-label': t('plus_point', { team: name }), title: t('plus_point', { team: name }), text: '+1', onclick: function () { addPoint(i, 1); } }))));
    })(i);
  }

  function renderCQ() {
    $('#classSetup').hidden = !!cq;
    $('#classStage').hidden = !cq;
    if (!cq) { pauseTimer(); return; }
    renderScoreboard();
    var n = cq.deck.length;
    $('#cqQuestion').hidden = cq.finished;
    $('#cqFinish').hidden = !cq.finished;
    if (cq.finished) {
      $('#cqProgress').textContent = t('finished');
      setBar($('#cqBar'), 1);
      renderTimer();
      renderFinish();
      return;
    }
    var card = cq.deck[cq.i], q = card.q, opts = optsOf(q);
    $('#cqProgress').textContent = t('q_of', { n: EDU.fmt(cq.i + 1), total: EDU.fmt(n) });
    setBar($('#cqBar'), (cq.i + 1) / n);
    $('#cqText').textContent = q.text;
    var box = $('#cqOpts'); box.innerHTML = '';
    card.perm.forEach(function (orig, pos) {
      var cls = 'opt-tile', mark = '';
      if (cq.picked === pos) cls += ' picked';
      if (cq.revealed && orig === q.answer) { cls += ' is-right'; mark = '✓'; }
      else if (cq.revealed && cq.picked === pos) { cls += ' is-wrong'; mark = '✗'; }
      box.appendChild(el('button', { type: 'button', class: cls, 'aria-pressed': cq.picked === pos ? 'true' : 'false', onclick: function () { cq.picked = cq.picked === pos ? -1 : pos; renderCQ(); } },
        q.type === 'mcq' ? el('span', { class: letterCls(pos), 'aria-hidden': 'true', text: LETTERS[pos] }) : null,
        el('span', { class: q.type === 'mcq' ? 'no-i18n' : '', text: opts[orig] }),
        mark ? el('span', { class: 'mark', 'aria-hidden': 'true', text: mark }) : null));
    });
    var ans = $('#cqAnswer');
    ans.hidden = !cq.revealed; ans.innerHTML = '';
    if (cq.revealed) {
      ans.appendChild(el('div', { style: { fontWeight: '700' } }, t('correct_answer') + ': ', ansNode(card, q.answer)));
      if (q.explain) ans.appendChild(el('div', { class: 'no-i18n', style: { marginTop: '6px' }, text: '💡 ' + q.explain }));
    }
    $('#cqReveal').textContent = cq.revealed ? t('hide_answer') : t('reveal');
    $('#cqPrev').disabled = cq.i === 0;
    $('#cqNext').querySelector('[data-i18n]').textContent = cq.i === n - 1 ? t('finish') : t('next');
    renderTimer();
  }
  function renderFinish() {
    var f = $('#cqFinish'); f.innerHTML = '';
    f.appendChild(el('div', { class: 'big-number', text: '🏆' }));
    f.appendChild(el('h2', { text: t('finished') }));
    var n = settings.teams;
    if (n) {
      var order = []; for (var i = 0; i < n; i++) order.push(i);
      order.sort(function (a, b) { return scores[b] - scores[a]; });
      var top = scores[order[0]], tied = order.filter(function (i) { return scores[i] === top; }).length > 1;
      f.appendChild(el('p', { class: 'present', style: { fontWeight: '800' }, text: top <= 0 ? t('no_points') : tied ? t('tie') : t('winner', { team: teamName(order[0]) }) }));
      f.appendChild(el('ol', { class: 'rank' }, order.map(function (i) {
        return el('li', {}, el('span', { class: (settings.names[i] || '').trim() ? 'no-i18n' : '', text: teamName(i) }), el('span', { text: EDU.fmt(scores[i]) }));
      })));
    }
    f.appendChild(el('div', { class: 'row', style: { justifyContent: 'center' } },
      el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'playAgain', text: t('play_again'), onclick: startClass }),
      el('button', { type: 'button', class: 'btn btn-lg', text: t('previous'), onclick: function () { goCQ(-1); } })));
  }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || '';
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable);
    if (typing) return;
    var onCtl = /^(BUTTON|A|SUMMARY)$/.test(tag);
    if (tab === 'class' && cq && !shared) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { goCQ(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { goCQ(-1); e.preventDefault(); }
      else if ((e.key === ' ' || e.key === 'Enter') && !onCtl) { toggleReveal(); e.preventDefault(); }
      else if (e.key === 'f' || e.key === 'F') { EDU.fullscreen($('#classStage')); }
      else if (/^[1-4]$/.test(e.key) && +e.key <= settings.teams) { addPoint(+e.key - 1, 1); }
    } else if (tab === 'practice' && pr && !pr.done && !pr.answers[pr.i]) {
      var k = String(e.key).toUpperCase(), pos = /^[1-6]$/.test(k) ? +k - 1 : LETTERS.indexOf(k);
      if (pos >= 0 && pos < pr.deck[pr.i].perm.length) { answerPractice(pos); e.preventDefault(); }
    }
  });

  /* ---------------------------------------------------------------- practice (students) */
  var pr = null;   // { deck, i, answers: [{ chosen, ok }], done }
  function resetPractice() { pr = null; }
  function startPractice(onlyQs) {
    var qz = cur();
    var qs = onlyQs || qz.questions;
    if (!qs.length) { EDU.toast(t('empty_quiz')); return; }
    pr = { deck: makeDeck(qs, settings.shuffleQ, settings.shuffleO), i: 0, answers: [], done: false };
    renderPractice();
    var first = $('#prOpts .opt-tile'); if (first) first.focus({ preventScroll: true });
    $('#prQ').scrollIntoView({ block: 'nearest' });
  }
  function answerPractice(pos) {
    if (!pr || pr.done || pr.answers[pr.i]) return;
    var card = pr.deck[pr.i], orig = card.perm[pos];
    pr.answers[pr.i] = { chosen: orig, ok: orig === card.q.answer };
    renderPractice();
    $('#prNext').focus({ preventScroll: true });
  }
  $('#prStartBtn').addEventListener('click', function () { startPractice(); });
  $('#prNext').addEventListener('click', function () {
    if (!pr) return;
    if (pr.i < pr.deck.length - 1) pr.i++; else pr.done = true;
    renderPractice();
    var target = pr.done ? $('#prEnd') : $('#prQ');
    target.scrollIntoView({ block: 'nearest' });
    var first = $('#prOpts .opt-tile'); if (!pr.done && first) first.focus({ preventScroll: true });
  });
  $('#prAgain').addEventListener('click', function () { startPractice(); });
  $('#prMistakes').addEventListener('click', function () {
    if (!pr) return;
    var wrong = pr.deck.filter(function (c, i) { return pr.answers[i] && !pr.answers[i].ok; }).map(function (c) { return c.q; });
    if (wrong.length) startPractice(wrong);
  });
  function okCount() { return pr ? pr.answers.filter(function (a) { return a && a.ok; }).length : 0; }

  function renderPractice() {
    var qz = cur();
    $('#prTitle').textContent = titleOf(qz);
    $('#prCount').textContent = t('q_count', { n: EDU.fmt(qz.questions.length) });
    $('#prStartBtn').disabled = !qz.questions.length;
    $('#prStart').hidden = !!pr;
    $('#prQ').hidden = !pr || pr.done;
    $('#prEnd').hidden = !pr || !pr.done;
    syncShuffleBoxes();
    if (!pr) return;
    if (pr.done) { renderPracticeEnd(); return; }
    var card = pr.deck[pr.i], q = card.q, n = pr.deck.length, a = pr.answers[pr.i];
    $('#prProgress').textContent = t('q_of', { n: EDU.fmt(pr.i + 1), total: EDU.fmt(n) });
    $('#prRunning').textContent = '✓ ' + EDU.fmt(okCount());
    $('#prRunning').setAttribute('title', t('score'));
    setBar($('#prBar'), (pr.i + (a ? 1 : 0)) / n);
    $('#prText').textContent = q.text;
    var box = $('#prOpts'); box.innerHTML = '';
    var opts = optsOf(q);
    card.perm.forEach(function (orig, pos) {
      var cls = 'opt-tile', mark = '';
      if (a && orig === q.answer) { cls += ' is-right'; mark = '✓'; }
      else if (a && orig === a.chosen) { cls += ' is-wrong'; mark = '✗'; }
      box.appendChild(el('button', { type: 'button', class: cls, disabled: !!a, onclick: function () { answerPractice(pos); } },
        q.type === 'mcq' ? el('span', { class: letterCls(pos), 'aria-hidden': 'true', text: LETTERS[pos] }) : null,
        el('span', { class: q.type === 'mcq' ? 'no-i18n' : '', text: opts[orig] }),
        mark ? el('span', { class: 'mark', 'aria-hidden': 'true', text: mark }) : null));
    });
    var fb = $('#prFeedback'); fb.innerHTML = '';
    if (a) {
      var c = el('div', { class: 'callout ' + (a.ok ? 'success' : 'danger') + ' stack' },
        el('div', { style: { fontWeight: '800', fontSize: '1.1rem' }, text: a.ok ? '✓ ' + t('correct') : '✗ ' + t('wrong') }),
        a.ok ? null : el('div', {}, t('correct_answer') + ': ', el('strong', {}, ansNode(card, q.answer))),
        q.explain ? el('div', { class: 'no-i18n', text: '💡 ' + q.explain }) : null);
      fb.appendChild(c);
    }
    var nx = $('#prNext');
    nx.hidden = !a;
    nx.textContent = pr.i === n - 1 ? t('see_result') : t('next_q');
  }
  function renderPracticeEnd() {
    var qz = cur(), total = pr.deck.length, right = okCount();
    var pct = total ? Math.round(right / total * 100) : 0;
    $('#prScore').textContent = EDU.fmt(right) + ' / ' + EDU.fmt(total);
    $('#prMsg').textContent = t('you_scored', { score: EDU.fmt(right), total: EDU.fmt(total), p: EDU.fmt(pct) }) + ' ' + (pct >= 80 ? t('msg_great') : pct >= 50 ? t('msg_good') : t('msg_try'));
    setBar($('#prScoreBar'), total ? right / total : 0);
    var rv = $('#prReview'); rv.innerHTML = '';
    var wrong = 0;
    pr.deck.forEach(function (card, i) {
      var a = pr.answers[i];
      if (!a || a.ok) return;
      wrong++;
      rv.appendChild(el('div', { class: 'review-item' },
        el('div', { class: 'qtext no-i18n', text: card.q.text }),
        el('div', { class: 'bad' }, '✗ ' + t('your_answer') + ': ', ansNode(card, a.chosen)),
        el('div', { class: 'ok' }, '✓ ' + t('correct_answer') + ': ', ansNode(card, card.q.answer)),
        card.q.explain ? el('div', { class: 'qexpl no-i18n', text: '💡 ' + card.q.explain }) : null));
    });
    if (wrong) rv.insertBefore(el('h3', { class: 'mb0', text: t('review_wrong') }), rv.firstChild);
    else rv.appendChild(el('div', { class: 'callout success', text: '🎉 ' + t('all_correct') }));
    $('#prMistakes').hidden = !wrong;
    $('#prShareScore').href = 'https://wa.me/?text=' + encodeURIComponent(t('score_msg', { score: EDU.fmt(right), total: EDU.fmt(total), quiz: titleOf(qz) }));
  }

  /* ---------------------------------------------------------------- share link */
  function packQuiz(qz) {
    return { v: 1, t: qz.title, q: qz.questions.map(function (q) {
      var a = [q.text, q.type === 'tf' ? 0 : q.options, q.answer];
      if (q.explain) a.push(q.explain);
      return a;
    }) };
  }
  function unpackQuiz(d) {
    if (!d || !Array.isArray(d.q)) return null;
    return normQuiz({ title: d.t, questions: d.q.map(function (a) {
      if (!Array.isArray(a)) return null;
      var mcq = Array.isArray(a[1]);
      return { type: mcq ? 'mcq' : 'tf', text: a[0], options: mcq ? a[1] : [], answer: a[2], explain: a[3] };
    }) });
  }
  /* Short quizzes: '#quiz=' + EDU.pack(json) (works in every browser).
     Long quizzes: '#qz=' + deflate-compressed json when the browser can compress (about half the length
     for Indian scripts); every phone browser from the last few years can open both. */
  var PLAIN_MAX = 1800;
  function b64url(bytes) { var bin = ''; for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64url(s) { var b = s.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '='; var bin = atob(b), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  function pipeBytes(bytes, stream) { return new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
  function linkHash(qz) {
    var obj = packQuiz(qz), plain = 'quiz=' + EDU.pack(obj);
    if (plain.length <= PLAIN_MAX || !window.CompressionStream) return Promise.resolve(plain);
    try {
      return pipeBytes(new TextEncoder().encode(JSON.stringify(obj)), new CompressionStream('deflate')).then(function (z) {
        var c = 'qz=' + b64url(z);
        return c.length < plain.length * 0.8 ? c : plain;
      }).catch(function () { return plain; });
    } catch (e) { return Promise.resolve(plain); }
  }
  /* -> Promise: quiz, null (broken link) or false (no quiz in the URL) */
  function parseHash(h) {
    var m = String(h || '').match(/^#(quiz|qz)=([A-Za-z0-9_-]+)/);
    if (!m) return Promise.resolve(false);
    if (m[1] === 'quiz') return Promise.resolve(unpackQuiz(EDU.unpack(m[2])));
    if (!window.DecompressionStream) return Promise.resolve(null);
    try {
      return pipeBytes(unb64url(m[2]), new DecompressionStream('deflate')).then(function (b) {
        return unpackQuiz(JSON.parse(new TextDecoder().decode(b)));
      }).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }
  var shareSeq = 0;
  function renderShare() {
    var qz = cur(), has = qz.questions.length > 0, seq = ++shareSeq;
    $('#shareUrl').setAttribute('aria-label', t('share_link'));
    if (!has) { $('#shareUrl').value = ''; $('#linkLen').textContent = t('empty_quiz'); $('#longNote').hidden = true; }
    else linkHash(qz).then(function (h) {
      if (seq !== shareSeq) return;
      var url = location.href.split('#')[0] + '#' + h;
      $('#shareUrl').value = url;
      $('#linkLen').textContent = t('link_len', { n: EDU.fmt(url.length) });
      $('#waLink').href = 'https://wa.me/?text=' + encodeURIComponent(t('wa_msg', { quiz: titleOf(qz) }) + '\n' + url);
      $('#openLink').href = url;
      var ln = $('#longNote');
      ln.hidden = url.length <= 6000; ln.textContent = t('link_long');
    });
    ['copyLink', 'nativeShare'].forEach(function (id) { $('#' + id).disabled = !has; });
    ['waLink', 'openLink'].forEach(function (id) { var a = $('#' + id); a.setAttribute('aria-disabled', has ? 'false' : 'true'); a.style.pointerEvents = has ? '' : 'none'; });
    $('#nativeShare').hidden = !navigator.share;
    var sn = $('#shareNote');
    sn.hidden = location.protocol !== 'file:'; sn.textContent = t('share_file_note');
    $('#pKey').checked = !!settings.key; $('#pLines').checked = !!settings.lines; $('#pExpl').checked = !!settings.expl;
    $('#pExpl').disabled = !settings.key;
    $('#printBtn').disabled = !has;
  }
  $('#copyLink').addEventListener('click', function () { EDU.copy($('#shareUrl').value); });
  $('#nativeShare').addEventListener('click', function () { EDU.share($('#shareUrl').value, titleOf(cur())); });
  $('#pKey').addEventListener('change', function (e) { settings.key = e.target.checked; saveSettings(); renderShare(); });
  $('#pLines').addEventListener('change', function (e) { settings.lines = e.target.checked; saveSettings(); });
  $('#pExpl').addEventListener('change', function (e) { settings.expl = e.target.checked; saveSettings(); });

  /* ---------------------------------------------------------------- print worksheet + answer key */
  function buildPrint() {
    var qz = cur(), pa = $('#printArea');
    pa.innerHTML = '';
    pa.appendChild(el('h1', { class: 'no-i18n', text: titleOf(qz) }));
    if (settings.lines) pa.appendChild(el('div', { class: 'pw-lines' }, ['name_line', 'class_line', 'roll_line', 'date_line'].map(function (k) {
      return el('span', { text: t(k) + ': ' + (k === 'name_line' ? '______________________' : '__________') });
    })));
    pa.appendChild(el('div', { class: 'pw-instr' }, el('span', { text: t('print_instructions') }), el('span', { text: t('marks', { n: EDU.fmt(qz.questions.length) }) })));
    qz.questions.forEach(function (q, i) {
      var opts = optsOf(q);
      pa.appendChild(el('div', { class: 'pw-q' },
        el('div', { class: 'qt' }, EDU.fmt(i + 1) + '. ', el('span', { class: 'no-i18n', text: q.text })),
        el('ul', { class: 'pw-opts' }, opts.map(function (o, k) { return el('li', { class: q.type === 'mcq' ? 'no-i18n' : '' }, q.type === 'mcq' ? [el('bdi', { text: '(' + LETTERS[k] + ')' }), ' '] : null, o); }))));
    });
    if (settings.key && qz.questions.length) {
      var key = el('div', { class: 'pw-key' },
        el('h2', {}, t('answer_key') + ' · ', el('span', { class: 'no-i18n', text: titleOf(qz) })));
      var ol = el('ol');
      qz.questions.forEach(function (q) {
        var a = q.type === 'mcq' ? [el('bdi', { text: '(' + LETTERS[q.answer] + ')' }), ' ' + q.options[q.answer]] : optsOf(q)[q.answer];
        ol.appendChild(el('li', {}, el('strong', { class: q.type === 'mcq' ? 'no-i18n' : '' }, a),
          settings.expl && q.explain ? el('div', { class: 'no-i18n', text: q.explain }) : null));
      });
      key.appendChild(ol);
      pa.appendChild(key);
    }
  }
  $('#printBtn').addEventListener('click', function () {
    if (!cur().questions.length) { EDU.toast(t('empty_quiz')); return; }
    buildPrint(); window.print();
  });
  window.addEventListener('beforeprint', buildPrint);

  /* ---------------------------------------------------------------- shared-link mode */
  function readHash() {
    return parseHash(location.hash).then(function (qz) {
      if (qz === false) return false;
      if (!qz || !qz.questions.length) { $('#badLink').hidden = false; return false; }
      $('#badLink').hidden = true;
      shared = qz; pr = null; stopClass(); tab = 'practice';
      return true;
    });
  }
  window.addEventListener('hashchange', function () { readHash().then(function (ok) { if (ok) render(); }); });
  $('#saveShared').addEventListener('click', function () {
    if (!shared) return;
    var copy = normQuiz(JSON.parse(JSON.stringify(shared)));
    copy.id = uid(); copy.questions.forEach(function (q) { q.id = uid(); });
    quizzes.push(copy); currentId = copy.id; saveQuizzes();
    EDU.toast(t('saved_shared'));
  });
  $('#leaveShared').addEventListener('click', function () {
    shared = null; pr = null; tab = store.get('tab', 'edit');
    try { history.replaceState(history.state, '', location.href.split('#')[0]); } catch (e) { location.hash = ''; }
    render();
  });

  /* ---------------------------------------------------------------- reset + render */
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    stopClass(); pr = null; shared = null;
    quizzes = [sampleQuiz(EDU.lang)]; currentId = quizzes[0].id; saveQuizzes();
    settings = { timer: 0, teams: 4, shuffleQ: false, shuffleO: false, names: ['', '', '', ''], key: true, lines: true, expl: false }; saveSettings();
    scores = [0, 0, 0, 0]; store.set('scores', scores);
    resetEditor(); setTab('edit');
  });

  function render() {
    var isShared = !!shared;
    $('#quizBar').hidden = isShared; $('#tabs').hidden = isShared; $('#helpBox').hidden = isShared;
    $('#sharedBanner').hidden = !isShared;
    if (isShared) tab = 'practice';
    renderTabs();
    if (!isShared) renderQuizBar();
    var qz = cur();
    if (document.activeElement !== titleInput) titleInput.value = qz.title;
    renderList(); renderEditor(); renderClassSetup(); renderCQ(); renderPractice(); renderShare();
  }

  /* An untouched sample quiz follows the language; quizzes people typed are never translated. */
  EDU.onLang(function (lang) {
    var changed = false;
    quizzes = quizzes.map(function (q) {
      if (q.sample && q.sample !== lang) { changed = true; return sampleQuiz(lang, q.id); }
      return q;
    });
    if (changed) { saveQuizzes(); if (!shared) { pr = null; stopClass(true); } }
    render();
  });

  /* A student opening a share link sees only the practice screen (no flash of the teacher view). */
  var app = $('#app'), linked = /^#(quiz|qz)=/.test(location.hash || '');
  if (linked) app.style.visibility = 'hidden';
  render();
  readHash().then(function (ok) { if (ok) render(); }, function () { }).then(function () { app.style.visibility = ''; });
})();
