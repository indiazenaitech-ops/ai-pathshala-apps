/* Train a Mood Detector: students teach a Naive Bayes text classifier with example sentences,
   test it, see how every word pushes the guess, and run experiments that fool it. */
(function () {
  'use strict';
  var SLUG = 'sentiment-trainer';
  var MAX_LABELS = 5, MAX_ROWS = 3000, MAX_LEN = 300, MAX_NAME = 30, PEEK_STEP = 12;
  var PRESETS = { happy: { emoji: '😊', color: 4 }, sad: { emoji: '😞', color: 7 }, angry: { emoji: '😠', color: 5 } };
  var PRESET_ORDER = ['happy', 'sad', 'angry'];
  var COLORS = [4, 7, 5, 3, 2, 1, 6];
  var EMOJIS = ['😊', '😞', '😠', '😨', '😲', '😐', '🤩', '😂', '😴', '🤢', '😍', '👍', '👎', '❤️', '⭐', '🏏', '🍛', '📚', '🎵', '🐶', '🏷️'];
  var NEW_EMOJIS = ['😨', '😲', '😐', '🤩', '😴', '🏷️'];
  var TRY_KINDS = ['happy', 'sad', 'angry', 'neg', 'sarcasm'];
  var store = EDU.store(SLUG);
  var NB = window.MoodNB;
  var $ = EDU.$, el = EDU.el, t = EDU.t;

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- helpers ---------------- */
  function content(L) { var C = window.APP_CONTENT || {}; return C[L || EDU.lang] || C.en; }
  function tag() { return EDU.langInfo(EDU.lang).tag; }
  function pct(p) {
    if (!isFinite(p)) p = 0;
    if (p > 0.995 && p < 1) return '>' + EDU.fmt(0.99, { style: 'percent' });
    if (p > 0 && p < 0.005) return '<' + EDU.fmt(0.01, { style: 'percent' });
    return EDU.fmt(p, { style: 'percent', maximumFractionDigits: 0 });
  }
  function smallPct(p) { return EDU.fmt(p, { style: 'percent', minimumSignificantDigits: 2, maximumSignificantDigits: 2 }); }
  function times(x) { return EDU.fmt(x, { maximumFractionDigits: x < 10 ? 1 : 0 }); }
  function hash(str) { var h = 5381; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return h; }
  function lc(l) { return 'var(--c' + l.color + ')'; }

  /* ---------------- state ---------------- */
  var S, model = null, evalRes = null, trainedRows = [], trainedSig = null;
  var undoStack = [], expRes = {}, selectedFeat = null, peekLimit = PEEK_STEP, peekSort = 'count', exp1Touched = false, freshRow = null;

  function newId(p) { S.seq = (S.seq || 0) + 1; return p + S.seq; }
  function mkPreset(preset) { return { id: newId('L'), preset: preset, name: null, emoji: PRESETS[preset].emoji, color: PRESETS[preset].color }; }
  function sampleRowsFor(label, L) {
    var c = content(L);
    if (!label.preset || !c.samples[label.preset]) return [];
    return c.samples[label.preset].map(function (txt) { return { id: newId('r'), text: txt, label: label.id }; });
  }
  function allSampleRows() {
    var rows = [];
    S.labels.forEach(function (l) { rows = rows.concat(sampleRowsFor(l)); });
    return rows;
  }
  function defaultState() {
    S = { v: 1, seq: 0, labels: [], rows: [], edited: false, dataLang: EDU.lang, pairs: false, test: '', trained: false };
    S.labels = [mkPreset('happy'), mkPreset('sad')];
    S.rows = allSampleRows();
    S.test = content().tries.happy;
    return S;
  }
  function loadState() {
    var s = store.get('state', null);
    try {
      if (!s || !Array.isArray(s.labels) || !Array.isArray(s.rows)) return defaultState();
      var ids = {}, seq = parseInt(s.seq, 10) || 0;
      var labels = s.labels.filter(function (l) { return l && typeof l.id === 'string' && !ids[l.id] && (ids[l.id] = 1); }).slice(0, MAX_LABELS).map(function (l) {
        var col = parseInt(l.color, 10);
        return {
          id: l.id, preset: PRESETS[l.preset] ? l.preset : null,
          name: typeof l.name === 'string' && l.name.trim() ? l.name.slice(0, MAX_NAME) : null,
          emoji: typeof l.emoji === 'string' && l.emoji ? l.emoji.slice(0, 8) : '🏷️',
          color: col >= 1 && col <= 8 ? col : 1
        };
      });
      if (labels.length < 2) return defaultState();
      var keep = {}; labels.forEach(function (l) { keep[l.id] = 1; });
      var rows = s.rows.filter(function (r) { return r && typeof r.text === 'string' && r.text.trim() && keep[r.label]; }).slice(0, MAX_ROWS)
        .map(function (r, i) { return { id: typeof r.id === 'string' ? r.id : 'x' + i, text: r.text.slice(0, MAX_LEN), label: r.label }; });
      S = { v: 1, seq: Math.max(seq, labels.length + rows.length + 1), labels: labels, rows: rows, edited: !!s.edited,
        dataLang: EDU.LANGS.some(function (x) { return x.code === s.dataLang; }) ? s.dataLang : 'en', pairs: !!s.pairs,
        test: typeof s.test === 'string' ? s.test.slice(0, MAX_LEN) : '', trained: !!s.trained };
      return S;
    } catch (e) { return defaultState(); }
  }
  function save() { store.set('state', S); }
  function labelById(id) { for (var i = 0; i < S.labels.length; i++) if (S.labels[i].id === id) return S.labels[i]; return null; }
  function labelName(l) {
    if (!l) return '?';
    if (l.name) return l.name;
    var c = content();
    if (l.preset && c.labels[l.preset]) return c.labels[l.preset];
    return t('new_label', { n: S.labels.indexOf(l) + 1 });
  }
  function rowsOf(id) { return S.rows.filter(function (r) { return r.label === id; }); }
  function sig() { return hash(JSON.stringify([S.labels.map(function (l) { return l.id; }), S.rows.map(function (r) { return r.label + '\u0001' + r.text; }), S.pairs])); }
  function stale() { return !!model && trainedSig !== sig(); }
  function dataChanged() { undoStack = []; S.edited = true; save(); renderUndo(); }
  function presetLabel(p) { for (var i = 0; i < S.labels.length; i++) if (S.labels[i].preset === p) return S.labels[i]; return null; }
  function targetLabel() { return presetLabel('sad') || S.labels[1]; }
  function hasHappySad() { return !!(presetLabel('happy') && presetLabel('sad')); }

  /* ---------------- the model ---------------- */
  function featsOf(text) {
    var toks = NB.tokenize(text, tag());
    var feats = NB.features(toks, S.pairs), display = {};
    toks.forEach(function (k, i) {
      var d = k.raw.toLowerCase();
      if (!display[k.tok]) display[k.tok] = d;
      if (S.pairs && i + 1 < toks.length) { var f = k.tok + ' ' + toks[i + 1].tok; if (!display[f]) display[f] = d + ' ' + toks[i + 1].raw.toLowerCase(); }
    });
    return { toks: toks, feats: feats, display: display };
  }
  function emptyLabel() { for (var i = 0; i < S.labels.length; i++) if (!rowsOf(S.labels[i].id).length) return S.labels[i]; return null; }
  function buildDocs() { return S.rows.map(function (r) { var f = featsOf(r.text); return { feats: f.feats, label: r.label, display: f.display }; }); }
  function train() {
    if (emptyLabel()) return false;
    var docs = buildDocs();
    model = NB.train(docs, S.labels.map(function (l) { return l.id; }), { pairs: S.pairs });
    model.pairsOn = S.pairs;
    evalRes = NB.evaluate(model, docs);
    trainedRows = S.rows.slice();
    trainedSig = sig();
    S.trained = true; save();
    return true;
  }
  function predictText(text) {
    if (!model) return null;
    var toks = NB.tokenize(text, tag());
    var feats = NB.features(toks, model.pairsOn);
    var p = NB.predict(model, feats);
    p.toks = toks; p.feats = feats;
    return p;
  }
  function disp(f) { return (model && model.display[f]) || f; }

  /* ---------------- step 1: labels + sentences ---------------- */
  function renderLabels(focusLabelId, focusName) {
    var wrap = $('#labs');
    var scrolls = {};
    EDU.$$('.lab-card', wrap).forEach(function (c) { var ul = $('.sent-list', c); if (ul) scrolls[c.dataset.id] = ul.scrollTop; });
    wrap.innerHTML = '';
    S.labels.forEach(function (l, i) {
      var rows = rowsOf(l.id);
      var sel = el('select', { class: 'lab-emoji', 'aria-label': t('label_emoji'), title: t('label_emoji') });
      var opts = EMOJIS.indexOf(l.emoji) >= 0 ? EMOJIS : [l.emoji].concat(EMOJIS);
      opts.forEach(function (e) { sel.appendChild(el('option', { value: e, text: e })); });
      sel.value = l.emoji;
      sel.addEventListener('change', function () { l.emoji = sel.value; save(); renderOthers(); });
      var name = el('input', { type: 'text', class: 'lab-name no-i18n', maxlength: String(MAX_NAME), 'aria-label': t('label_name'), title: t('label_name'), spellcheck: 'false' });
      name.value = labelName(l);
      name.addEventListener('input', function () { var v = name.value.trim(); l.name = v ? v.slice(0, MAX_NAME) : null; save(); renderOthers(); });
      name.addEventListener('change', function () { if (!name.value.trim()) name.value = labelName(l); });
      var del = el('button', { type: 'button', class: 'btn btn-ghost lab-del no-print', 'aria-label': t('delete_label'), title: t('delete_label'), text: '🗑', onclick: function () { deleteLabel(l); } });
      if (S.labels.length <= 2) del.disabled = true;

      var inp = el('input', { type: 'text', class: 'add-input no-i18n', maxlength: String(MAX_LEN), placeholder: t('add_sentence_ph'), 'aria-label': t('add_sentence_ph'), dataset: { label: l.id }, autocomplete: 'off' });
      var form = el('form', { class: 'add-row no-print', onsubmit: function (e) { e.preventDefault(); addSentences(l.id, inp.value); } },
        inp, el('button', { type: 'submit', class: 'btn btn-sm', text: t('add') }));

      var list = el('ul', { class: 'sent-list no-i18n', 'aria-label': labelName(l) });
      if (!rows.length) list.appendChild(el('li', { class: 'sent-empty', text: t('empty_label') }));
      rows.slice().reverse().forEach(function (r) {
        list.appendChild(el('li', { class: r.id === freshRow ? 'fresh' : '', dataset: { id: r.id } },
          el('span', { class: 'sent-text', text: r.text }),
          el('button', { type: 'button', class: 'sent-del no-print', 'aria-label': t('remove_sentence'), title: t('remove_sentence'), text: '✕', onclick: function () { removeRow(r.id); } })));
      });
      var card = el('div', { class: 'lab-card', dataset: { id: l.id, idx: String(i), count: String(rows.length) }, style: { '--lc': lc(l) } },
        el('div', { class: 'lab-head' }, sel, name, del),
        el('div', { class: 'lab-meta' }, el('span', { class: 'lab-count', text: t('n_sentences', { n: EDU.fmt(rows.length) }) }),
          rows.length && rows.length < 5 ? el('span', { class: 'small', text: t('few_sentences') }) : null),
        form, list);
      card.style.setProperty('--lc', lc(l));
      wrap.appendChild(card);
      if (scrolls[l.id]) list.scrollTop = scrolls[l.id];
      if (focusLabelId === l.id) setTimeout(function () { (focusName ? name : inp).focus(); if (focusName) name.select(); }, 0);
    });
    freshRow = null;
    $('#add-label-btn').disabled = S.labels.length >= MAX_LABELS;
    var note = $('#lang-note');
    if (S.edited && S.dataLang !== EDU.lang) { note.textContent = t('lang_note'); note.hidden = false; } else note.hidden = true;
  }

  function addSentences(labelId, text) {
    var lines = String(text || '').split(/\r?\n/).map(function (s) { return s.trim().slice(0, MAX_LEN); }).filter(Boolean);
    if (!lines.length) return;
    var added = 0;
    lines.forEach(function (line) {
      if (S.rows.length >= MAX_ROWS) return;
      if (!NB.tokenize(line, tag()).length) { EDU.toast(t('no_words')); return; }
      var r = { id: newId('r'), text: line, label: labelId };
      S.rows.push(r); freshRow = r.id; added++;
    });
    if (S.rows.length >= MAX_ROWS) EDU.toast(t('max_rows', { n: EDU.fmt(MAX_ROWS) }));
    if (!added) return;
    dataChanged();
    renderLabels(labelId);
    renderOthers();
  }
  function removeRow(id) {
    S.rows = S.rows.filter(function (x) { return x.id !== id; });
    dataChanged();
    renderLabels();
    renderOthers();
  }
  function deleteLabel(l) {
    if (S.labels.length <= 2) { EDU.toast(t('min_labels')); return; }
    var n = rowsOf(l.id).length;
    if (n && !confirm(t('confirm_del_label', { name: labelName(l), n: EDU.fmt(n) }))) return;
    S.labels = S.labels.filter(function (x) { return x !== l; });
    S.rows = S.rows.filter(function (r) { return r.label !== l.id; });
    model = null;
    if (n) dataChanged(); else save();
    renderAll();
  }
  function addLabel() {
    if (S.labels.length >= MAX_LABELS) { EDU.toast(t('max_labels', { n: MAX_LABELS })); return; }
    var usedP = {}, usedC = {}, usedE = {};
    S.labels.forEach(function (l) { if (l.preset) usedP[l.preset] = 1; usedC[l.color] = 1; usedE[l.emoji] = 1; });
    var preset = PRESET_ORDER.filter(function (p) { return !usedP[p]; })[0] || null;
    var color = COLORS.filter(function (c) { return !usedC[c]; })[0] || COLORS[S.labels.length % COLORS.length];
    var l;
    if (preset) { l = mkPreset(preset); l.color = usedC[l.color] ? color : l.color; }
    else l = { id: newId('L'), preset: null, name: null, emoji: NEW_EMOJIS.filter(function (e) { return !usedE[e]; })[0] || '🏷️', color: color };
    S.labels.push(l);
    if (preset) S.rows = S.rows.concat(sampleRowsFor(l));
    model = null; undoStack = [];
    save();
    renderAll(l.id, !preset);
    EDU.toast(preset ? t('label_added_samples', { name: labelName(l) }) : t('label_added'));
  }
  function loadSamples() {
    var hasPreset = S.labels.some(function (l) { return !!l.preset; });
    if (!hasPreset) {
      if (S.labels.length + 2 <= MAX_LABELS) {
        var usedC = {}; S.labels.forEach(function (l) { usedC[l.color] = 1; });
        var add = [mkPreset('happy'), mkPreset('sad')];
        add.forEach(function (l) { if (usedC[l.color]) { l.color = COLORS.filter(function (c) { return !usedC[c]; })[0] || l.color; } usedC[l.color] = 1; });
        S.labels = add.concat(S.labels);
      } else {
        if (!confirm(t('confirm_reset'))) return;
        S.labels = [mkPreset('happy'), mkPreset('sad')]; S.rows = [];
      }
      model = null;
    } else if (S.rows.some(function (r) { var l = labelById(r.label); return l && l.preset; }) && !confirm(t('confirm_samples'))) return;
    var presetIds = {};
    S.labels.forEach(function (l) { if (l.preset) presetIds[l.id] = 1; });
    var own = S.rows.filter(function (r) { return !presetIds[r.label]; });
    S.rows = own.concat(allSampleRows());
    S.dataLang = EDU.lang;
    undoStack = []; expRes = {};
    S.edited = own.length > 0;
    if (!S.test.trim()) S.test = content().tries.happy;
    save();
    renderAll();
  }
  function clearAll() {
    if (!S.rows.length) return;
    if (!confirm(t('confirm_clear'))) return;
    S.rows = []; expRes = {};
    dataChanged();
    renderAll();
  }

  /* ---------------- CSV ---------------- */
  function exportCSV() {
    if (!S.rows.length) { EDU.toast(t('nothing_export')); return; }
    var rows = [['text', 'label', 'emoji']];
    S.rows.forEach(function (r) { var l = labelById(r.label); rows.push([r.text, labelName(l), l ? l.emoji : '']); });
    EDU.download('mood-dataset.csv', EDU.csv.stringify(rows), 'text/csv');
  }
  function importCSV() {
    EDU.pickFile('.csv,.txt,text/csv,text/plain').then(function (file) {
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) { EDU.toast(t('import_bad')); return; }
      return EDU.readText(file).then(function (text) { applyCSV(text); });
    }).catch(function () { EDU.toast(t('import_bad')); });
  }
  function applyCSV(text) {
    var rows;
    try { rows = EDU.csv.parse(text); } catch (e) { rows = []; }
    if (!rows.length) { EDU.toast(t('import_bad')); return false; }
    var head = rows[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
    var ti = -1, li = -1, ei = -1;
    head.forEach(function (h, i) {
      if (ti < 0 && /^(text|sentence|sentences|review|message)$/.test(h)) ti = i;
      else if (li < 0 && /^(label|labels|class|mood|category|sentiment)$/.test(h)) li = i;
      else if (ei < 0 && h === 'emoji') ei = i;
    });
    if (ti >= 0 && li >= 0) rows = rows.slice(1); else { ti = 0; li = 1; ei = -1; }
    var data = [], names = [], emo = {};
    rows.forEach(function (r) {
      var tx = String(r[ti] || '').trim().slice(0, MAX_LEN), lb = String(r[li] || '').trim().slice(0, MAX_NAME);
      if (!tx || !lb) return;
      if (names.indexOf(lb) < 0) names.push(lb);
      if (ei >= 0 && r[ei] && !emo[lb]) emo[lb] = String(r[ei]).trim().slice(0, 8);
      data.push({ text: tx, label: lb });
    });
    if (!data.length) { EDU.toast(t('import_bad')); return false; }
    if (names.length < 2) { EDU.toast(t('import_two')); return false; }
    if (names.length > MAX_LABELS) { EDU.toast(t('import_too_many', { n: MAX_LABELS })); return false; }
    if (S.rows.length && !confirm(t('confirm_import', { n: EDU.fmt(data.length) }))) return false;
    var usedC = {}, labels = [];
    names.forEach(function (nm) {
      var ex = S.labels.filter(function (l) { return labelName(l).toLowerCase() === nm.toLowerCase(); })[0];
      if (ex && labels.indexOf(ex) < 0) { labels.push(ex); usedC[ex.color] = 1; if (emo[nm]) ex.emoji = emo[nm]; }
      else labels.push({ id: newId('L'), preset: null, name: nm, emoji: emo[nm] || null, color: 0 });
    });
    var usedE = {};
    labels.forEach(function (l) { if (l.emoji) usedE[l.emoji] = 1; });
    labels.forEach(function (l) {
      if (!l.color) { l.color = COLORS.filter(function (c) { return !usedC[c]; })[0] || COLORS[0]; usedC[l.color] = 1; }
      if (!l.emoji) { l.emoji = EMOJIS.filter(function (e) { return !usedE[e]; })[0] || '🏷️'; usedE[l.emoji] = 1; }
    });
    var byName = {};
    names.forEach(function (nm, i) { byName[nm] = labels[i].id; });
    S.labels = labels;
    S.rows = data.slice(0, MAX_ROWS).map(function (d) { return { id: newId('r'), text: d.text, label: byName[d.label] }; });
    S.dataLang = EDU.lang;
    model = null; expRes = {};
    dataChanged();
    renderAll();
    EDU.toast(t('import_ok', { n: EDU.fmt(S.rows.length) }));
    return true;
  }

  /* ---------------- step 2: train + model view ---------------- */
  function renderTrain() {
    var st = $('#train-status'), btn = $('#train-btn');
    var empty = emptyLabel();
    $('#pairs-chk').checked = !!S.pairs;
    st.className = 'callout small mb0';
    if (!model) {
      if (empty) { st.classList.add('warning'); st.textContent = t('need_data', { name: labelName(empty) }); }
      else st.textContent = t('not_trained');
      btn.classList.toggle('pulse', !empty);
    } else if (stale()) {
      st.classList.add('warning');
      st.textContent = empty ? t('need_data', { name: labelName(empty) }) : t('stale');
      btn.classList.toggle('pulse', !empty);
    } else {
      st.classList.add('success');
      st.textContent = t('trained_ok', { n: EDU.fmt(model.N), v: EDU.fmt(countWords()) });
      btn.classList.remove('pulse');
    }
    renderModel();
  }
  function countWords() { var n = 0; for (var f in model.vocab) if (f.indexOf(' ') < 0) n++; return n; }
  function renderModel() {
    var mv = $('#model-view');
    if (!model) { mv.hidden = true; return; }
    mv.hidden = false;
    $('#st-sentences').textContent = EDU.fmt(model.N);
    $('#st-vocab').textContent = EDU.fmt(countWords());
    $('#st-train-acc').textContent = pct(evalRes.trainAcc);
    $('#st-fair-acc').textContent = pct(evalRes.fairAcc);
    $('#st-fair-acc').dataset.v = String(evalRes.fairAcc);

    var ls = $('#lab-stats'); ls.innerHTML = '';
    model.labels.forEach(function (id, i) {
      var l = labelById(id); if (!l) return;
      var top = NB.topWords(model, i, 6, false);
      var clues = el('div', { class: 'clues' }, el('span', { class: 'small muted', text: t('clue_words') }));
      var cl = el('span', { class: 'no-i18n', style: { display: 'contents' } });
      if (!top.length) clues.appendChild(el('span', { class: 'small muted', text: '—' }));
      top.forEach(function (w) { cl.appendChild(el('span', { class: 'clue', title: t('ratio_tip', { x: times(Math.exp(w.push)), label: labelName(l) }) }, disp(w.f), el('small', { text: '×' + times(Math.exp(w.push)) }))); });
      clues.appendChild(cl);
      ls.appendChild(el('div', { class: 'lab-stat', style: { '--lc': lc(l) } },
        el('div', { class: 'ls-head' }, el('span', { class: 'ls-name' }, l.emoji + ' ', el('span', { class: 'no-i18n', text: labelName(l) })),
          el('span', { class: 'ls-nums', text: t('label_nums', { n: EDU.fmt(model.docs[id]), p: pct(model.docs[id] / model.N), w: EDU.fmt(model.total[id]) }) })),
        clues));
      ls.lastChild.style.setProperty('--lc', lc(l));
    });

    var mist = evalRes.mistakes, ml = $('#mist-list'); ml.innerHTML = '';
    $('#mist-sum').textContent = mist.length ? t('mistakes_t', { n: EDU.fmt(mist.length) }) : t('no_mistakes');
    $('#mistakes').hidden = false;
    mist.slice(0, 40).forEach(function (m) {
      var r = trainedRows[m.index], gl = m.guess >= 0 ? labelById(model.labels[m.guess]) : null, tl = labelById(model.labels[m.label]);
      if (!r) return;
      ml.appendChild(el('li', null, el('span', { text: '“' + r.text + '” ' }),
        el('span', { class: 'muted', text: t('mistake_line', { real: tl ? tl.emoji + ' ' + labelName(tl) : '?', guess: gl ? gl.emoji + ' ' + labelName(gl) : '?' }) })));
    });
    renderPeek();
  }
  function renderPeek() {
    var tb = $('#peek-table');
    tb.innerHTML = '';
    if (!model) return;
    var q = NB.norm($('#peek-filter').value.trim());
    var feats = Object.keys(model.vocab);
    if (q) feats = feats.filter(function (f) { return f.indexOf(q) >= 0 || disp(f).toLowerCase().indexOf(q) >= 0; });
    var push = {};
    if (peekSort === 'clue') feats.forEach(function (f) { push[f] = NB.wordInfo(model, f).push; });
    feats.sort(function (a, b) {
      return (peekSort === 'clue' ? push[b] - push[a] : 0) || model.vocab[b] - model.vocab[a] || (a.indexOf(' ') >= 0) - (b.indexOf(' ') >= 0) || (a < b ? -1 : a > b ? 1 : 0);
    });
    $('#sort-count').setAttribute('aria-pressed', String(peekSort === 'count'));
    $('#sort-clue').setAttribute('aria-pressed', String(peekSort === 'clue'));
    var head = el('tr', null, el('th', { text: t('col_word') }));
    model.labels.forEach(function (id) { var l = labelById(id); head.appendChild(el('th', { class: 'n' }, (l ? l.emoji + ' ' : ''), el('span', { class: 'no-i18n', text: labelName(l) }))); });
    head.appendChild(el('th', { text: t('col_leans') }));
    tb.appendChild(el('thead', null, head));
    var body = el('tbody', { class: 'no-i18n' });
    feats.slice(0, peekLimit).forEach(function (f) {
      var info = NB.wordInfo(model, f);
      var tr = el('tr', null, el('td', { class: 'w' + (f.indexOf(' ') >= 0 ? ' pair' : ''), text: disp(f) }));
      model.labels.forEach(function (id, i) { tr.appendChild(el('td', { class: 'n' + (info.counts[i] ? '' : ' zero'), text: EDU.fmt(info.counts[i]) })); });
      var bl = labelById(model.labels[info.best]);
      tr.appendChild(el('td', { class: 'lean' }, info.push < 0.05 ? el('span', { class: 'muted', text: '=' }) :
        el('span', { title: t('ratio_tip', { x: times(info.ratio), label: labelName(bl) }) }, bl.emoji + ' ×' + times(info.ratio))));
      body.appendChild(tr);
    });
    if (!feats.length) body.appendChild(el('tr', null, el('td', { colspan: String(model.labels.length + 2), class: 'muted', text: t('peek_none') })));
    tb.appendChild(body);
    $('#peek-count').textContent = t('peek_count', { a: EDU.fmt(Math.min(peekLimit, feats.length)), b: EDU.fmt(feats.length) });
    $('#peek-more').hidden = feats.length <= peekLimit;
  }
  function doTrain() {
    var empty = emptyLabel();
    if (empty) { EDU.toast(t('need_data', { name: labelName(empty) })); renderTrain(); return false; }
    train();
    peekLimit = PEEK_STEP;
    renderAfterModel();
    return true;
  }

  /* ---------------- step 3: test ---------------- */
  function renderTries() {
    var c = content(), wrap = $('#tries');
    wrap.innerHTML = '';
    var both = hasHappySad();
    TRY_KINDS.forEach(function (k) {
      if ((k === 'neg' || k === 'sarcasm') ? !both : !presetLabel(k)) return;
      var tricky = k === 'neg' || k === 'sarcasm';
      wrap.appendChild(el('button', { type: 'button', class: 'chip try-chip', dataset: { kind: k }, onclick: function () { setTest(c.tries[k]); } },
        tricky ? el('span', { 'aria-hidden': 'true', text: '🤔' }) : null, c.tries[k]));
    });
    $('#tries-wrap').hidden = !wrap.childNodes.length;
  }
  function setTest(text) {
    S.test = text; $('#test-input').value = text; save();
    selectedFeat = null;
    renderTest();
  }
  function bar(l, p) {
    var b = el('div', { class: 'bar' }, el('span', { style: { width: (Math.max(0, Math.min(1, p)) * 100).toFixed(1) + '%' } }));
    b.style.setProperty('--lc', lc(l));
    return b;
  }
  function renderTest() {
    var res = $('#result'), ex = $('#explain');
    res.innerHTML = '';
    var text = S.test.trim();
    if (!model) { res.appendChild(el('p', { class: 'callout mb0', text: t('train_first') })); ex.hidden = true; res.removeAttribute('data-label'); return; }
    if (!text) { res.appendChild(el('p', { class: 'muted mb0', text: t('type_something') })); ex.hidden = true; res.removeAttribute('data-label'); return; }
    var p = predictText(text);
    var win = labelById(model.labels[p.best]);
    res.dataset.label = win.id;
    res.dataset.idx = String(p.best);
    res.dataset.p = String(p.probs[p.best]);
    res.dataset.probs = p.probs.join(',');
    var verdict = el('div', { class: 'verdict', id: 'verdict' },
      el('span', { class: 'v-emoji', 'aria-hidden': 'true', text: win.emoji }),
      el('div', null, el('div', { class: 'small muted', text: t('guess_is') }), el('div', { class: 'v-name no-i18n', text: labelName(win) }),
        el('div', { class: 'v-sure', id: 'v-sure', text: t('confidence', { p: pct(p.probs[p.best]) }) })));
    verdict.style.setProperty('--lc', lc(win));
    res.appendChild(verdict);
    var bars = el('div', { class: 'bars' });
    model.labels.forEach(function (id, i) {
      var l = labelById(id);
      var row = el('div', { class: 'bar-row' + (i === p.best ? ' win' : ''), dataset: { idx: String(i) } },
        el('span', { class: 'bar-lab' }, l.emoji + ' ', el('span', { class: 'no-i18n', text: labelName(l) })), bar(l, p.probs[i]),
        el('span', { class: 'bar-pct', text: pct(p.probs[i]) }));
      bars.appendChild(row);
    });
    res.appendChild(bars);
    if (!p.known.length) res.appendChild(el('p', { class: 'callout warning small mb0', text: t('no_known') }));
    if (stale()) res.appendChild(el('p', { class: 'muted small mb0', text: t('old_model') }));
    ex.hidden = false;
    renderWords(p);
    renderMaths(p);
  }
  function renderWords(p) {
    var text = S.test, w = $('#words');
    w.innerHTML = '';
    var pos = 0, strongest = null, strongPush = -1, present = {};
    p.toks.forEach(function (k) {
      if (k.start > pos) w.appendChild(document.createTextNode(text.slice(pos, k.start)));
      pos = k.end;
      var info = NB.wordInfo(model, k.tok);
      present[k.tok] = 1;
      var b = el('button', { type: 'button', class: 'wtok', dataset: { f: k.tok }, text: k.raw, onclick: function () { selectedFeat = k.tok; renderWordDetail(); markSel(); } });
      if (!info) { b.classList.add('unk'); b.title = t('word_tip_unknown', { word: k.raw }); }
      else {
        var bl = labelById(model.labels[info.best]);
        if (info.push < 0.05) { b.style.setProperty('--wc', 'var(--c8)'); b.style.setProperty('--wa', '14%'); }
        else { b.style.setProperty('--wc', lc(bl)); b.style.setProperty('--wa', Math.round(16 + Math.min(info.push, 2.5) / 2.5 * 46) + '%'); }
        b.dataset.ratio = String(info.ratio);
        b.dataset.best = bl.id;
        b.title = info.push < 0.05 ? t('word_tip_equal', { word: k.raw }) : t('word_tip', { word: k.raw, x: times(info.ratio), label: labelName(bl) });
        if (info.push > strongPush) { strongPush = info.push; strongest = k.tok; }
      }
      w.appendChild(b);
    });
    if (pos < text.length) w.appendChild(document.createTextNode(text.slice(pos)));
    // pairs
    var pu = $('#pairs-used'); pu.innerHTML = '';
    if (model.pairsOn) {
      var seen = {};
      for (var i = 0; i + 1 < p.toks.length; i++) {
        var f = p.toks[i].tok + ' ' + p.toks[i + 1].tok;
        if (seen[f] || !model.vocab[f]) continue;
        seen[f] = 1; present[f] = 1;
        var info2 = NB.wordInfo(model, f), bl2 = labelById(model.labels[info2.best]);
        var chip = el('button', { type: 'button', class: 'clue wtok-pair', dataset: { f: f }, onclick: (function (ff) { return function () { selectedFeat = ff; renderWordDetail(); markSel(); }; })(f) },
          '“' + p.toks[i].raw + ' ' + p.toks[i + 1].raw + '” ', el('small', { text: info2.push < 0.05 ? '=' : bl2.emoji + ' ×' + times(info2.ratio) }));
        chip.style.setProperty('--lc', lc(bl2));
        pu.appendChild(chip);
        if (info2.push > strongPush) { strongPush = info2.push; strongest = f; }
      }
      if (pu.childNodes.length) pu.insertBefore(el('span', { class: 'small muted', text: t('pairs_t') }), pu.firstChild);
    }
    pu.hidden = !pu.childNodes.length;
    if (!selectedFeat || !present[selectedFeat]) selectedFeat = strongest || (p.toks[0] && p.toks[0].tok) || null;
    // legend
    var lg = $('#legend'); lg.innerHTML = '';
    model.labels.forEach(function (id) {
      var l = labelById(id), sw = el('span', { class: 'sw' });
      sw.style.setProperty('--lc', lc(l));
      lg.appendChild(el('span', null, sw, l.emoji + ' ', el('span', { class: 'no-i18n', text: labelName(l) })));
    });
    lg.appendChild(el('span', null, el('span', { class: 'sw unk' }), t('legend_unknown')));
    renderWordDetail();
    markSel();
  }
  function markSel() {
    EDU.$$('#words .wtok, #pairs-used .wtok-pair').forEach(function (b) { b.classList.toggle('sel', b.dataset.f === selectedFeat); b.setAttribute('aria-pressed', b.dataset.f === selectedFeat ? 'true' : 'false'); });
  }
  function featLabel(f) {
    if (model && model.display[f]) return model.display[f];
    var tk = null;
    EDU.$$('#words .wtok').forEach(function (b) { if (b.dataset.f === f && !tk) tk = b.textContent; });
    return tk || f;
  }
  function renderWordDetail() {
    var box = $('#word-detail');
    box.innerHTML = '';
    if (!model || !selectedFeat) { box.appendChild(el('p', { class: 'muted mb0', text: t('tap_word') })); return; }
    var f = selectedFeat, word = featLabel(f), info = NB.wordInfo(model, f);
    box.appendChild(el('div', { class: 'wd-word no-i18n', text: '“' + word + '”' }));
    if (!info) { box.appendChild(el('p', { class: 'mb0', text: t('wd_unknown', { word: word }) })); return; }
    var tb = el('table', { class: 'table' });
    tb.appendChild(el('thead', null, el('tr', null, el('th', { text: t('col_label') }), el('th', { class: 'n', text: t('col_seen') }), el('th', { text: t('col_chance') }))));
    var body = el('tbody');
    model.labels.forEach(function (id, i) {
      var l = labelById(id);
      body.appendChild(el('tr', null, el('td', null, l.emoji + ' ', el('span', { class: 'no-i18n', text: labelName(l) })), el('td', { class: 'n', text: EDU.fmt(info.counts[i]) }),
        el('td', null, el('span', { class: 'mono small', text: EDU.fmt(info.num[i]) + '/' + EDU.fmt(info.den[i]) + ' = ' }), el('b', { text: smallPct(info.probs[i]) }))));
    });
    tb.appendChild(body);
    box.appendChild(el('div', { class: 'scroll-x' }, tb));
    var bl = labelById(model.labels[info.best]), sl = labelById(model.labels[info.second]);
    box.appendChild(el('p', { class: 'mb0', style: { marginTop: '8px' }, text: info.push < 0.05 ? t('wd_equal', { word: word }) :
      t('wd_more', { word: word, x: times(info.ratio), label: labelName(bl), other: labelName(sl) }) }));
    var dw = $('#word-detail');
    dw.dataset.f = f;
    dw.dataset.ratio = String(info.ratio);
  }
  function sci(logE) {
    if (logE === -Infinity) return '0';
    var l10 = logE / Math.LN10;
    if (l10 >= -3) return EDU.fmt(Math.exp(logE), { maximumSignificantDigits: 2 });
    var e = Math.floor(l10), m = Math.pow(10, l10 - e);
    if (m >= 9.95) { m = 1; e++; }
    return EDU.fmt(m, { maximumFractionDigits: 1 }) + ' × 10<sup>' + (e < 0 ? '−' + EDU.fmt(-e) : EDU.fmt(e)) + '</sup>';
  }
  function renderMaths(p) {
    var tb = $('#maths-table');
    tb.innerHTML = '';
    var head = el('tr', null, el('th', { text: '' }));
    model.labels.forEach(function (id) { var l = labelById(id); head.appendChild(el('th', { class: 'n' }, l.emoji + ' ' + labelName(l))); });
    tb.appendChild(el('thead', null, head));
    var body = el('tbody');
    var r0 = el('tr', null, el('td', { text: t('maths_start') }));
    model.labels.forEach(function (id) {
      r0.appendChild(el('td', { class: 'n' }, el('span', { class: 'frac', text: EDU.fmt(model.docs[id]) + '/' + EDU.fmt(model.N) }), pct(model.docs[id] / model.N)));
    });
    body.appendChild(r0);
    p.known.forEach(function (f) {
      var info = NB.wordInfo(model, f);
      var tr = el('tr', null, el('td', null, '× ', el('b', { text: '“' + featLabel(f) + '”' })));
      model.labels.forEach(function (id, i) { tr.appendChild(el('td', { class: 'n' }, el('span', { class: 'frac', text: EDU.fmt(info.num[i]) + '/' + EDU.fmt(info.den[i]) }), smallPct(info.probs[i]))); });
      body.appendChild(tr);
    });
    var rs = el('tr', { class: 'sum' }, el('td', { text: t('maths_mult') }));
    p.scores.forEach(function (s) { rs.appendChild(el('td', { class: 'n', html: sci(s) })); });
    body.appendChild(rs);
    var rf = el('tr', { class: 'sum win-row' }, el('td', { text: t('maths_share') }));
    p.probs.forEach(function (q, i) {
      var td = el('td', { class: 'n' + (i === p.best ? ' win' : ''), text: pct(q) });
      td.style.setProperty('--lc', lc(labelById(model.labels[i])));
      rf.appendChild(td);
    });
    body.appendChild(rf);
    if (p.unknown.length) {
      var uniq = p.unknown.filter(function (f, i, a) { return a.indexOf(f) === i && f.indexOf(' ') < 0; }).map(featLabel);
      if (uniq.length) body.appendChild(el('tr', null, el('td', { colspan: String(model.labels.length + 1), class: 'muted small', style: { whiteSpace: 'normal' }, text: t('maths_ignored', { words: uniq.join(', ') }) })));
    }
    tb.appendChild(body);
  }

  /* ---------------- step 4: experiments ---------------- */
  function snapshot() {
    undoStack.push({ labels: JSON.parse(JSON.stringify(S.labels)), rows: S.rows.slice(), edited: S.edited, test: S.test });
    if (undoStack.length > 10) undoStack.shift();
  }
  function ensureModel() {
    if (model && !stale()) return true;
    var empty = emptyLabel();
    if (empty) { EDU.toast(t('need_data', { name: labelName(empty) })); return false; }
    train();
    return true;
  }
  function outcome(text) {
    var p = predictText(text);
    return { probs: p.probs.slice(), best: p.best, labels: model.labels.slice() };
  }
  function expWordTok() { var k = NB.tokenize($('#exp1-word').value, tag()); return k.length ? k[0] : null; }
  function exp1Hits(tok) { return tok ? S.rows.filter(function (r) { return NB.tokenize(r.text, tag()).some(function (k) { return k.tok === tok.tok; }); }) : []; }
  function suggestExp1() {
    if (exp1Touched) return;
    var inp = $('#exp1-word'), best = null, bp = -1, m = model && !stale() ? model : null;
    if (!m && !emptyLabel() && S.rows.length) m = NB.train(buildDocs(), S.labels.map(function (l) { return l.id; }), { pairs: false });
    if (m && S.test.trim()) {
      NB.tokenize(S.test, tag()).forEach(function (k) { var i = NB.wordInfo(m, k.tok); if (i && i.push > bp) { bp = i.push; best = k.raw.toLowerCase(); } });
    }
    if (!best && m) { var tw = NB.topWords(m, 0, 1, true)[0]; if (tw) best = m.display[tw.f] || tw.f; }
    inp.value = best || '';
  }
  function renderExp1() {
    var tok = expWordTok(), hits = exp1Hits(tok), btn = $('#exp1-btn');
    btn.textContent = t('exp1_btn', { n: EDU.fmt(hits.length) });
    btn.disabled = !hits.length;
    $('#exp1-info').textContent = !tok ? t('exp1_type') : hits.length ? t('exp1_count', { n: EDU.fmt(hits.length), word: tok.raw }) : t('exp1_none');
  }
  function runExp1() {
    var tok = expWordTok(), hits = exp1Hits(tok);
    if (!hits.length) return;
    var gone = {}; hits.forEach(function (r) { gone[r.id] = 1; });
    var left = S.rows.filter(function (r) { return !gone[r.id]; });
    for (var i = 0; i < S.labels.length; i++) {
      var l = S.labels[i];
      if (!left.some(function (r) { return r.label === l.id; })) { EDU.toast(t('exp1_empty_label', { label: labelName(l) })); return; }
    }
    if (!ensureModel()) return;
    var text = S.test.trim(), before = text ? outcome(text) : null;
    snapshot();
    S.rows = left; S.edited = true;
    train();
    expRes.exp1 = { msg: t('exp1_done', { n: EDU.fmt(hits.length), word: tok.raw }), text: text, before: before, after: text ? outcome(text) : null, focus: before ? before.labels[before.best] : null };
    exp1Touched = false;
    finishExp();
  }
  function runExp2() {
    var c = content(), tl = targetLabel();
    if (!hasHappySad()) return;
    if (!ensureModel()) return;
    var before = outcome(c.bias.test);
    snapshot();
    c.bias.sentences.forEach(function (s) { S.rows.push({ id: newId('r'), text: s, label: tl.id }); });
    S.edited = true;
    train();
    S.test = c.bias.test; $('#test-input').value = S.test; selectedFeat = NB.norm(NB.tokenize(c.bias.word, tag()).map(function (k) { return k.tok; })[0] || '');
    expRes.exp2 = { msg: t('exp2_lesson', { word: c.bias.word, label: labelName(tl) }), text: c.bias.test, before: before, after: outcome(c.bias.test), focus: tl.id };
    finishExp();
  }
  function runExp3() {
    var c = content(), tl = targetLabel();
    if (!hasHappySad()) return;
    if (!ensureModel()) return;
    var before = outcome(c.tries.neg);
    snapshot();
    c.neg.sentences.forEach(function (s) { S.rows.push({ id: newId('r'), text: s, label: tl.id }); });
    S.edited = true;
    train();
    S.test = c.tries.neg; $('#test-input').value = S.test;
    expRes.exp3 = { msg: t('exp3_lesson'), text: c.tries.neg, before: before, after: outcome(c.tries.neg), focus: tl.id };
    finishExp();
  }
  function finishExp() {
    save();
    renderAll();
  }
  function undoExp() {
    var snap = undoStack.pop();
    if (!snap) return;
    S.labels = snap.labels; S.rows = snap.rows; S.edited = snap.edited; S.test = snap.test;
    $('#test-input').value = S.test;
    expRes = {};
    if (model) { if (emptyLabel()) model = null; else train(); }
    save();
    renderAll();
    EDU.toast(t('undone'));
  }
  function renderBA(box, r) {
    box.innerHTML = '';
    if (!r) return;
    var wrap = el('div', { class: 'ba' }, el('p', { class: 'ba-msg mb0', text: r.msg }));
    if (r.before && r.after) {
      var fi = r.before.labels.indexOf(r.focus);
      var fiA = r.after.labels.indexOf(r.focus);
      wrap.dataset.beforeP = String(fi >= 0 ? r.before.probs[fi] : 0);
      wrap.dataset.afterP = String(fiA >= 0 ? r.after.probs[fiA] : 0);
      wrap.dataset.beforeLabel = r.before.labels[r.before.best];
      wrap.dataset.afterLabel = r.after.labels[r.after.best];
      wrap.appendChild(el('q', { class: 'no-i18n', text: r.text }));
      [['exp_before', r.before], ['exp_after', r.after]].forEach(function (pair) {
        var o = pair[1], l = labelById(o.labels[o.best]);
        var sb = el('div', { class: 'sbar', 'aria-hidden': 'true' });
        o.labels.forEach(function (id, i) {
          var li = labelById(id); if (!li) return;
          var seg = el('span', { title: li.emoji + ' ' + labelName(li) + ' ' + pct(o.probs[i]) });
          seg.style.width = (o.probs[i] * 100).toFixed(1) + '%';
          seg.style.setProperty('--lc', lc(li));
          sb.appendChild(seg);
        });
        wrap.appendChild(el('div', { class: 'ba-row' }, el('span', { class: 'ba-k', text: t(pair[0]) }),
          el('div', { class: 'ba-v' }, el('span', { class: 'no-i18n', text: (l ? l.emoji + ' ' + labelName(l) : '?') + ' ' + pct(o.probs[o.best]) }), sb)));
      });
    }
    box.appendChild(wrap);
  }
  function renderExperiments() {
    var c = content(), tl = targetLabel();
    renderExp1();
    renderBA($('#exp1-res'), expRes.exp1);
    $('#exp2-d').textContent = t('exp2_d', { n: EDU.fmt(c.bias.sentences.length), word: c.bias.word, label: labelName(tl) });
    var ul = $('#exp2-list'); ul.innerHTML = '';
    c.bias.sentences.forEach(function (s) { ul.appendChild(el('li', { text: s })); });
    ul.appendChild(el('li', null, el('b', { text: t('exp2_test', { s: c.bias.test }) })));
    renderBA($('#exp2-res'), expRes.exp2);
    $('#exp3-d').textContent = t('exp3_d', { s: c.tries.neg });
    $('#exp3-btn').textContent = t('exp3_btn', { n: EDU.fmt(c.neg.sentences.length), label: labelName(tl) });
    var ok = hasHappySad();
    ['#exp2-btn', '#exp3-btn', '#exp3-try'].forEach(function (sel) { $(sel).disabled = !ok; });
    EDU.$$('.exp-need').forEach(function (p) { p.hidden = ok; p.textContent = t('exp_needs_samples'); });
    renderBA($('#exp3-res'), expRes.exp3);
    renderUndo();
  }
  function renderUndo() { $('#undo-btn').hidden = !undoStack.length; }

  /* ---------------- glue ---------------- */
  function renderAfterModel() { renderTrain(); renderTest(); suggestExp1(); renderExperiments(); }
  function renderOthers() { renderTrain(); renderTries(); renderTest(); renderExperiments(); }
  function renderAll(focusLabelId, focusName) {
    renderLabels(focusLabelId, focusName);
    $('#test-input').value = S.test;
    suggestExp1();
    renderOthers();
  }

  /* ---------------- events ---------------- */
  $('#train-btn').addEventListener('click', function () { doTrain(); });
  $('#pairs-chk').addEventListener('change', function () { S.pairs = $('#pairs-chk').checked; save(); renderTrain(); renderTest(); });
  $('#add-label-btn').addEventListener('click', addLabel);
  $('#samples-btn').addEventListener('click', loadSamples);
  $('#clear-all-btn').addEventListener('click', clearAll);
  $('#export-btn').addEventListener('click', exportCSV);
  $('#import-btn').addEventListener('click', importCSV);
  $('#test-input').addEventListener('input', function () { S.test = $('#test-input').value.slice(0, MAX_LEN); save(); renderTest(); suggestExp1(); renderExp1(); });
  $('#test-clear').addEventListener('click', function () { setTest(''); $('#test-input').focus(); });
  $('#peek-filter').addEventListener('input', function () { peekLimit = PEEK_STEP; renderPeek(); });
  $('#peek-more').addEventListener('click', function () { peekLimit += PEEK_STEP * 2; renderPeek(); });
  $('#sort-count').addEventListener('click', function () { peekSort = 'count'; peekLimit = PEEK_STEP; renderPeek(); });
  $('#sort-clue').addEventListener('click', function () { peekSort = 'clue'; peekLimit = PEEK_STEP; renderPeek(); });
  $('#exp1-word').addEventListener('input', function () { exp1Touched = true; renderExp1(); });
  $('#exp1-btn').addEventListener('click', runExp1);
  $('#exp2-btn').addEventListener('click', runExp2);
  $('#exp3-btn').addEventListener('click', runExp3);
  $('#exp3-try').addEventListener('click', function () {
    if (!ensureModel()) return;
    setTest(content().tries.neg); renderTrain(); renderExperiments();
    var card = $('#test-card'); if (card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#undo-btn').addEventListener('click', undoExp);
  $('#print-btn').addEventListener('click', function () { window.print(); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen(); });
  $('#reset-btn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    defaultState(); model = null; evalRes = null; undoStack = []; expRes = {}; selectedFeat = null; exp1Touched = false;
    $('#peek-filter').value = '';
    save(); renderAll();
  });

  /* Switching language: if the sentences are still the samples, swap them for the new language. */
  EDU.onLang(function () {
    var oldL = S.dataLang, oc = content(oldL), nc = content();
    TRY_KINDS.forEach(function (k) { if (S.test === oc.tries[k]) S.test = nc.tries[k]; });
    if (S.test === oc.bias.test) S.test = nc.bias.test;
    if (!S.edited && oldL !== EDU.lang) {
      S.rows = allSampleRows(); S.dataLang = EDU.lang;
      undoStack = []; expRes = {};
      if (model) { if (emptyLabel()) model = null; else train(); }
      exp1Touched = false;
    }
    save();
    renderAll();
  });

  /* ---------------- start ---------------- */
  loadState();
  if (!S.edited && S.dataLang !== EDU.lang) {
    var oc0 = content(S.dataLang), nc0 = content();
    TRY_KINDS.forEach(function (k) { if (S.test === oc0.tries[k]) S.test = nc0.tries[k]; });
    S.rows = allSampleRows(); S.dataLang = EDU.lang;
  }
  if (S.trained && !emptyLabel()) train();
  save();
  renderAll();
})();
