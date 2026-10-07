/* Spam Classifier Lab: a multinomial Naive Bayes spam filter (with Laplace smoothing) that students
   train on labelled SMS messages, test on a held-out set, read step by step, and try to fool.
   The maths lives in pure functions (window.SpamNB) so the interaction test can check it exactly. */
(function () {
  'use strict';

  /* ===================== Naive Bayes: pure functions ===================== */
  var NB = (function () {
    var WORD_RE;
    try { WORD_RE = new RegExp("[\\p{L}\\p{M}\\p{N}]+(?:['’][\\p{L}\\p{M}\\p{N}]+)*", 'gu'); }
    catch (e) { WORD_RE = /[^\s.,!?;:"“”‘’()\[\]{}<>\/\\|।॥۔؟،\-–—…*#@₹$%&+=~`^]+/g; }

    /* One spelling for one word: NFC, lower case, invisible joiners removed. */
    function norm(w) {
      var s = String(w);
      try { s = s.normalize('NFC'); } catch (e) { }
      return s.toLowerCase().replace(/[​-‍︎️]/g, '');
    }
    /* Split on spaces and punctuation. Letters, combining marks (Indic matras) and digits stay together. */
    function tokenize(text) {
      var out = [], m;
      text = String(text == null ? '' : text);
      WORD_RE.lastIndex = 0;
      while ((m = WORD_RE.exec(text))) {
        if (m[0] === '') { WORD_RE.lastIndex++; continue; }
        var k = norm(m[0]);
        if (k) out.push(k);
      }
      return out;
    }
    function fresh() { return Object.create(null); }          /* no prototype: "constructor" is just a word */

    /* train(docs) : docs = [{tokens: [...], label: 'spam' | 'ham'}]  ->  model = the word counts */
    function train(docs, alpha) {
      var m = { alpha: alpha === undefined ? 1 : alpha, classes: ['spam', 'ham'], N: 0,
        nDocs: { spam: 0, ham: 0 }, nWords: { spam: 0, ham: 0 }, counts: { spam: fresh(), ham: fresh() }, vocab: fresh(), V: 0 };
      (docs || []).forEach(function (d) {
        if (!d || (d.label !== 'spam' && d.label !== 'ham')) return;
        m.N++; m.nDocs[d.label]++;
        var c = m.counts[d.label];
        (d.tokens || []).forEach(function (w) {
          c[w] = (c[w] || 0) + 1;
          m.nWords[d.label]++;
          if (!m.vocab[w]) { m.vocab[w] = 0; m.V++; }
          m.vocab[w]++;
        });
      });
      return m;
    }
    function count(m, w, c) { return m.counts[c][w] || 0; }
    /* P(class) = messages of that class / all messages */
    function prior(m, c) { return m.N ? m.nDocs[c] / m.N : 0; }
    /* P(word | class) with Laplace (add-one) smoothing = (count + 1) / (all words in class + V) */
    function prob(m, w, c) { return (count(m, w, c) + m.alpha) / (m.nWords[c] + m.alpha * m.V); }
    /* log-odds of one word: > 0 pushes to spam, < 0 to ham */
    function logOdds(m, w) { return Math.log(prob(m, w, 'spam')) - Math.log(prob(m, w, 'ham')); }

    /* classify(model, tokens) -> every number the UI shows. Words never seen in training are skipped. */
    function classify(m, tokens) {
      var seen = fresh(), order = [], unknown = [], words = [];
      (tokens || []).forEach(function (w) {
        if (!m.vocab[w]) { if (unknown.indexOf(w) < 0) unknown.push(w); return; }
        if (!seen[w]) { seen[w] = 0; order.push(w); }
        seen[w]++;
      });
      var ps0 = prior(m, 'spam'), ph0 = prior(m, 'ham');
      var ls = Math.log(ps0), lh = Math.log(ph0);                 /* -Infinity when a class has no messages */
      order.forEach(function (w) {
        var n = seen[w], ps = prob(m, w, 'spam'), ph = prob(m, w, 'ham');
        words.push({ w: w, n: n, cs: count(m, w, 'spam'), ch: count(m, w, 'ham'), ps: ps, ph: ph, lo: Math.log(ps) - Math.log(ph) });
        ls += n * Math.log(ps); lh += n * Math.log(ph);
      });
      var p;
      if (ls === -Infinity && lh === -Infinity) p = 0.5;
      else if (ls === -Infinity) p = 0;
      else if (lh === -Infinity) p = 1;
      else { var mx = Math.max(ls, lh), es = Math.exp(ls - mx), eh = Math.exp(lh - mx); p = es / (es + eh); }
      return { words: words, unknown: unknown, prior: { spam: ps0, ham: ph0 }, logScore: { spam: ls, ham: lh },
        product: { spam: Math.exp(ls), ham: Math.exp(lh) }, logOdds: ls - lh, pSpam: p,
        label: p > 0.5 ? 'spam' : (p < 0.5 ? 'ham' : 'tie') };
    }

    /* Confusion matrix over labelled docs. Spam is the "positive" class; a tie lets the message through. */
    function evaluate(m, docs) {
      var r = { tp: 0, fp: 0, fn: 0, tn: 0, n: 0, acc: 0, precision: null, recall: null, mistakes: [] };
      (docs || []).forEach(function (d, i) {
        var c = classify(m, d.tokens), pred = c.label === 'spam' ? 'spam' : 'ham';
        r.n++;
        if (d.label === 'spam') { if (pred === 'spam') r.tp++; else r.fn++; }
        else { if (pred === 'spam') r.fp++; else r.tn++; }
        if (pred !== d.label) {
          var wrong = c.words.filter(function (x) { return pred === 'spam' ? x.lo > 0 : x.lo < 0; })
            .sort(function (a, b) { return Math.abs(b.lo) * b.n - Math.abs(a.lo) * a.n; }).slice(0, 3).map(function (x) { return x.w; });
          r.mistakes.push({ index: i, pred: pred, real: d.label, pSpam: c.pSpam, words: wrong });
        }
      });
      r.acc = r.n ? (r.tp + r.tn) / r.n : 0;
      r.precision = (r.tp + r.fp) ? r.tp / (r.tp + r.fp) : null;
      r.recall = (r.tp + r.fn) ? r.tp / (r.tp + r.fn) : null;
      return r;
    }

    /* Deterministic hold-out split: seeded shuffle, then the first `frac` of the ids (default 25 %). */
    function rng(seed) {
      var a = (seed >>> 0) || 1;
      return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
    }
    function holdout(ids, seed, frac) {
      var r = rng(seed), a = (ids || []).slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
      return a.slice(0, Math.round(a.length * (frac === undefined ? 0.25 : frac)));
    }
    return { tokenize: tokenize, norm: norm, train: train, count: count, prior: prior, prob: prob, logOdds: logOdds, classify: classify, evaluate: evaluate, holdout: holdout };
  })();
  window.SpamNB = NB;

  /* ===================== app ===================== */
  var SLUG = 'spam-classifier-lab';
  var MAX_ROWS = 2000, MAX_LEN = 300, PEEK_STEP = 15, LO_SCALE = 2.5;
  var TRY_KINDS = ['spam', 'ham', 'tricky'];
  var SORTS = ['count', 'spam', 'ham'];
  var store = EDU.store(SLUG);
  var $ = EDU.$, el = EDU.el, t = EDU.t;

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- helpers ---------------- */
  function content(L) { var C = window.APP_CONTENT || {}; return C[L || EDU.lang] || C.en; }
  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function pct(p) {
    if (!isFinite(p)) p = 0;
    /* a Naive Bayes share is never exactly 0 or 100 %; rounding must not make the filter look "100 % sure" */
    if (p > 0 && p < 0.005) return '<' + EDU.fmt(0.01, { style: 'percent' });
    if (p < 1 && p >= 0.995) return '>' + EDU.fmt(0.99, { style: 'percent' });
    return EDU.fmt(p, { style: 'percent', maximumFractionDigits: 0 });
  }
  function acc(p) {                                            /* 29 of 30 right must not round up to 100 % */
    p = isFinite(p) ? p : 0;
    var r = Math.round(p * 100);
    if (p < 1 && r >= 100) r = 99;
    return EDU.fmt(r / 100, { style: 'percent', maximumFractionDigits: 0 });
  }
  function f3(x) { return EDU.fmt(x, { maximumSignificantDigits: 3 }); }
  function times(x) { return EDU.fmt(x, { maximumFractionDigits: x < 10 ? 1 : 0 }); }
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '' };
  /* Small numbers as "1.3 × 10⁻⁹" so the underflow lesson is visible. null = too tiny to show. */
  function sci(x) {
    if (!isFinite(x) || x <= 0) return null;
    if (x >= 0.001) return f3(x);
    var e = x.toExponential(2).split('e');
    return EDU.fmt(parseFloat(e[0]), { maximumFractionDigits: 2 }) + ' × 10' + e[1].replace(/./g, function (c) { return SUP[c] === undefined ? c : SUP[c]; });
  }
  function ltr(text, cls) { return el('span', { class: 'num' + (cls ? ' ' + cls : ''), dir: 'ltr', text: text }); }
  function lblName(c) { return t(c === 'spam' ? 'lbl_spam' : 'lbl_ham'); }
  function rowText(r) {
    var c = content();
    if (r.si !== undefined) return (c[r.sk] || [])[r.si] || '';
    if (r.ei !== undefined) return (c.more_ham || [])[r.ei] || '';
    return r.text;
  }
  function rowLabel(r) { return r.si !== undefined ? r.sk : (r.ei !== undefined ? 'ham' : r.label); }

  /* ---------------- state ---------------- */
  var S, model = null, docsTrain = [], docsTest = [], evalRes = null, testIds = {}, byId = {};
  var peekLimit = PEEK_STEP, freshId = null;

  function newId(p) { S.seq = (S.seq || 0) + 1; return p + S.seq; }
  function sampleRows() {
    var rows = [], c = content();
    ['spam', 'ham'].forEach(function (k) { (c[k] || []).forEach(function (_, i) { rows.push({ id: newId('s'), sk: k, si: i }); }); });
    return rows;
  }
  function defaultState() {
    S = { v: 1, seq: 0, rows: [], test: '', holdout: true, seed: 1, present: false, sort: 'count', addAs: 'spam', ui: EDU.lang };
    S.rows = sampleRows();
    S.test = content().tries.spam;
    return S;
  }
  function loadState() {
    var s = store.get('state', null);
    try {
      if (!s || !Array.isArray(s.rows)) return defaultState();
      var en = content('en'), ids = {}, rows = [];
      s.rows.forEach(function (r) {
        if (!r || typeof r.id !== 'string' || ids[r.id]) return;
        var row = null;
        if (typeof r.si === 'number' && (r.sk === 'spam' || r.sk === 'ham') && r.si >= 0 && r.si < en[r.sk].length) row = { id: r.id, sk: r.sk, si: r.si };
        else if (typeof r.ei === 'number' && r.ei >= 0 && r.ei < en.more_ham.length) row = { id: r.id, ei: r.ei };
        else if (typeof r.text === 'string' && r.text.trim() && (r.label === 'spam' || r.label === 'ham')) row = { id: r.id, text: r.text.slice(0, MAX_LEN), label: r.label };
        if (row) { ids[r.id] = 1; rows.push(row); }
      });
      S = { v: 1, seq: Math.max(parseInt(s.seq, 10) || 0, rows.length + 1), rows: rows.slice(0, MAX_ROWS),
        test: typeof s.test === 'string' ? s.test.slice(0, MAX_LEN) : '', holdout: s.holdout !== false,
        seed: Math.max(1, parseInt(s.seed, 10) || 1), present: !!s.present, sort: SORTS.indexOf(s.sort) >= 0 ? s.sort : 'count',
        addAs: s.addAs === 'ham' ? 'ham' : 'spam', ui: EDU.LANGS.some(function (x) { return x.code === s.ui; }) ? s.ui : null };
      return S;
    } catch (e) { return defaultState(); }
  }
  function save() { S.ui = EDU.lang; store.set('state', S); }
  function rowsOf(label) { return S.rows.filter(function (r) { return rowLabel(r) === label; }); }
  function expRows() { return S.rows.filter(function (r) { return r.ei !== undefined; }); }
  function hasText(text, label) {
    var k = NB.norm(text.trim());
    return S.rows.some(function (r) { return rowLabel(r) === label && NB.norm(rowText(r).trim()) === k; });
  }

  /* ---------------- build the model from the current rows ---------------- */
  function rebuild() {
    testIds = {}; byId = {};
    if (S.holdout) {
      ['spam', 'ham'].forEach(function (k, ki) {
        var ids = S.rows.filter(function (r) { return r.si !== undefined && r.sk === k; }).map(function (r) { return r.id; });
        NB.holdout(ids, S.seed * 7919 + ki + 1).forEach(function (id) { testIds[id] = 1; });
      });
    }
    docsTrain = []; docsTest = [];
    S.rows.forEach(function (r) {
      var d = { id: r.id, text: rowText(r), label: rowLabel(r) };
      d.tokens = NB.tokenize(d.text);
      byId[r.id] = d;
      (testIds[r.id] ? docsTest : docsTrain).push(d);
    });
    model = docsTrain.length ? NB.train(docsTrain) : null;
    evalRes = model ? NB.evaluate(model, S.holdout ? docsTest : docsTrain) : null;
  }
  function changed() { save(); rebuild(); renderAll(); }

  /* ---------------- 1. check a message ---------------- */
  function renderChecker() {
    var msg = $('#msg');
    if (msg.value !== S.test) msg.value = S.test;
    var status = $('#check-status'), result = $('#result'), explain = $('#explain'), verdict = $('#verdict');
    var say = function (key, cls) { status.textContent = t(key); status.className = 'callout small mb0' + (cls ? ' ' + cls : ''); status.hidden = false; };
    status.hidden = true;
    if (!model) { say('no_model', 'warning'); result.hidden = true; explain.hidden = true; verdict.dataset.label = ''; verdict.dataset.p = ''; return; }
    if (!S.test.trim()) { say('empty_msg'); result.hidden = true; explain.hidden = true; verdict.dataset.label = ''; verdict.dataset.p = ''; return; }
    var tokens = NB.tokenize(S.test), c = NB.classify(model, tokens);
    if (!(model.nDocs.spam && model.nDocs.ham)) say('need_both', 'warning');
    else if (!tokens.length) say('no_words');
    result.hidden = false; explain.hidden = false;
    verdict.dataset.label = c.label; verdict.dataset.p = String(c.pSpam);
    $('#v-icon').textContent = c.label === 'spam' ? '🚫' : (c.label === 'ham' ? '✅' : '🤔');
    $('#v-name').textContent = t(c.label === 'spam' ? 'verdict_spam' : (c.label === 'ham' ? 'verdict_ham' : 'verdict_tie'));
    $('#v-sure').textContent = c.label === 'tie' ? t('tie_note') : t('sure', { p: pct(c.label === 'spam' ? c.pSpam : 1 - c.pSpam) });
    $('#pbar-spam').style.width = (c.pSpam * 100) + '%';
    $('#pbar-ham').style.width = ((1 - c.pSpam) * 100) + '%';
    $('#p-spam').textContent = pct(c.pSpam);
    $('#p-ham').textContent = pct(1 - c.pSpam);
    renderBars(tokens, c);
    renderMaths(c);
  }

  /* evidence bars: one per different word, in the order typed */
  function renderBars(tokens, c) {
    var wrap = $('#bars'); wrap.innerHTML = '';
    var seen = Object.create(null), order = [];
    tokens.forEach(function (w) { if (!seen[w]) { seen[w] = 1; order.push(w); } });
    var info = Object.create(null);
    c.words.forEach(function (x) { info[x.w] = x; });
    var maxLo = LO_SCALE;
    c.words.forEach(function (x) { if (Math.abs(x.lo) > maxLo) maxLo = Math.abs(x.lo); });
    order.forEach(function (w) {
      var x = info[w], side = !x ? 'unk' : (x.lo > 1e-9 ? 'spam' : (x.lo < -1e-9 ? 'ham' : 'even'));
      var row = el('div', { class: 'ev-row ' + side, dataset: { word: w, lo: x ? String(x.lo) : '' } });
      var word = el('span', { class: 'ev-word', text: w });
      if (x && x.n > 1) word.appendChild(el('small', { text: ' ×' + EDU.fmt(x.n) }));
      var track = el('div', { class: 'ev-track', 'aria-hidden': 'true' });
      if (x && side !== 'even') track.appendChild(el('span', { class: 'ev-fill ' + side, style: { width: (Math.min(1, Math.abs(x.lo) / maxLo) * 50) + '%' } }));
      var val;
      if (!x) val = t('new_word');
      else if (side === 'even') val = t('even_word');
      else val = t(side === 'spam' ? 'times_spam' : 'times_ham', { x: times(Math.exp(Math.abs(x.lo))) });
      row.appendChild(word); row.appendChild(track); row.appendChild(el('span', { class: 'ev-val', text: val }));
      wrap.appendChild(row);
    });
  }

  function renderMaths(c) {
    var body = $('#maths-body'); body.innerHTML = '';
    var m = model, n = m.N, s = m.nDocs.spam, h = m.nDocs.ham;
    var step = function (key, vars) { return el('p', { class: 'maths-step', text: t(key, vars) }); };
    /* step 1: prior */
    body.appendChild(step('step_prior', { n: EDU.fmt(n), s: EDU.fmt(s), h: EDU.fmt(h) }));
    body.appendChild(el('p', { class: 'formula no-i18n', text: t('prior_line', { s: EDU.fmt(s), h: EDU.fmt(h), n: EDU.fmt(n), ps: f3(c.prior.spam), ph: f3(c.prior.ham) }) }));
    /* step 2: every word */
    body.appendChild(step('step_words'));
    body.appendChild(el('p', { class: 'formula', text: t('formula_word') }));
    body.appendChild(el('p', { class: 'muted small mb0 no-i18n', text: t('vocab_line', { v: EDU.fmt(m.V), ws: EDU.fmt(m.nWords.spam), wh: EDU.fmt(m.nWords.ham) }) }));
    if (c.words.length) {
      var table = el('table', { class: 'table maths no-i18n', id: 'maths-table' });
      var thead = el('thead'), tr = el('tr');
      [['col_word'], ['col_counts'], ['col_pspam'], ['col_pham'], ['col_push']].forEach(function (k) { tr.appendChild(el('th', { text: t(k[0]) })); });
      thead.appendChild(tr); table.appendChild(thead);
      var tbody = el('tbody');
      var ds = m.nWords.spam + m.alpha * m.V, dh = m.nWords.ham + m.alpha * m.V;
      c.words.forEach(function (x) {
        var r = el('tr', { dataset: { word: x.w } });
        var wcell = el('td', { class: 'w', text: x.w });
        if (x.n > 1) wcell.appendChild(el('small', { class: 'muted', text: ' ×' + EDU.fmt(x.n) }));
        r.appendChild(wcell);
        r.appendChild(el('td', {}, ltr(EDU.fmt(x.cs) + ' / ' + EDU.fmt(x.ch))));
        var tdS = el('td', { class: 'ps' }, ltr(f3(x.ps)), el('span', { class: 'frac', text: '(' + EDU.fmt(x.cs) + ' + 1) ÷ (' + EDU.fmt(m.nWords.spam) + ' + ' + EDU.fmt(m.V) + ') = ' + EDU.fmt(x.cs + 1) + ' ÷ ' + EDU.fmt(ds) }));
        var tdH = el('td', { class: 'ph' }, ltr(f3(x.ph)), el('span', { class: 'frac', text: '(' + EDU.fmt(x.ch) + ' + 1) ÷ (' + EDU.fmt(m.nWords.ham) + ' + ' + EDU.fmt(m.V) + ') = ' + EDU.fmt(x.ch + 1) + ' ÷ ' + EDU.fmt(dh) }));
        r.appendChild(tdS); r.appendChild(tdH);
        var side = x.lo > 1e-9 ? 'spam' : (x.lo < -1e-9 ? 'ham' : 'even');
        r.appendChild(el('td', {}, el('span', { class: 'push ' + side, text: side === 'even' ? t('lean_even') : lblName(side) + ' ×' + times(Math.exp(Math.abs(x.lo))) })));
        tbody.appendChild(r);
      });
      table.appendChild(tbody);
      body.appendChild(el('div', { class: 'scroll-x' }, table));
    }
    if (c.unknown.length) body.appendChild(el('p', { class: 'muted small mb0 no-i18n', text: t('unknown_line', { words: c.unknown.join(', ') }) }));
    /* step 3: multiply */
    body.appendChild(step('step_multiply'));
    var box = el('div', { class: 'score-box no-i18n' });
    ['spam', 'ham'].forEach(function (k) {
      var parts = [f3(c.prior[k])], shown = 0;
      c.words.forEach(function (x) { for (var i = 0; i < x.n; i++) { if (shown < 12) parts.push(f3(k === 'spam' ? x.ps : x.ph)); shown++; } });
      var chain = parts.join(' × ') + (shown > 12 ? ' × …' : '');
      var val = sci(c.product[k]);
      var row = el('div', { class: 'score-row ' + k });
      row.appendChild(el('span', { class: 'k', text: t(k === 'spam' ? 'score_spam' : 'score_ham') + ': ' }));
      row.appendChild(ltr(val === null ? '' : val));
      if (val === null) row.appendChild(el('span', { class: 'muted small', text: ' ' + t('tiny') }));
      row.appendChild(el('span', { class: 'chain', text: chain + ' = ' + (val === null ? '≈ 0' : val) }));
      box.appendChild(row);
    });
    body.appendChild(box);
    /* step 4: compare */
    body.appendChild(step('step_compare'));
    var a = sci(c.product.spam), b = sci(c.product.ham);
    if (a !== null && b !== null) body.appendChild(el('p', { class: 'formula final no-i18n', text: t('final_line', { a: a, b: b, p: pct(c.pSpam) }) }));
    else body.appendChild(el('p', { class: 'formula final no-i18n', text: t('final_only', { p: pct(c.pSpam) }) }));
    var lo = isFinite(c.logOdds) ? EDU.fmt(c.logOdds, { maximumFractionDigits: 2, signDisplay: 'always' }) : (c.logOdds > 0 ? '+∞' : '−∞');
    body.appendChild(el('p', { class: 'muted small mb0', text: t('log_note', { lo: lo }) }));
  }

  function setTest(text) { S.test = String(text || '').slice(0, MAX_LEN); save(); renderChecker(); }

  /* ---------------- 2. teach it ---------------- */
  function renderData() {
    ['spam', 'ham'].forEach(function (k) {
      var list = $('#list-' + k), rows = rowsOf(k), scroll = list.scrollTop;
      list.innerHTML = '';
      $('#cnt-' + k).textContent = t('n_msgs', { n: EDU.fmt(rows.length) });
      $('#cnt-' + k).dataset.n = rows.length;
      if (!rows.length) { list.appendChild(el('li', { class: 'msg-empty', text: t('empty_label') })); return; }
      rows.forEach(function (r) {
        var li = el('li', { dataset: { id: r.id }, class: r.id === freshId ? 'fresh' : '' });
        li.appendChild(el('span', { class: 'msg-text', text: rowText(r) }));
        if (testIds[r.id]) li.appendChild(el('span', { class: 'badge accent', text: t('test_badge'), title: t('test_badge_title') }));
        li.appendChild(el('button', { type: 'button', class: 'msg-del no-print', 'aria-label': t('remove_msg'), title: t('remove_msg'), text: '✕', onclick: function () { removeRow(r.id); } }));
        list.appendChild(li);
      });
      list.scrollTop = scroll;
    });
    freshId = null;
    $('#add-spam').setAttribute('aria-pressed', S.addAs === 'spam' ? 'true' : 'false');
    $('#add-ham').setAttribute('aria-pressed', S.addAs === 'ham' ? 'true' : 'false');
    renderExp();
  }
  function removeRow(id) {
    S.rows = S.rows.filter(function (r) { return r.id !== id; });
    changed();
  }
  function addRows(label, text) {
    var lines = String(text || '').split(/\r?\n/).map(function (s) { return s.trim().slice(0, MAX_LEN); }).filter(Boolean);
    if (!lines.length) return 0;
    var added = 0, dup = 0;
    lines.forEach(function (line) {
      if (S.rows.length >= MAX_ROWS) return;
      if (hasText(line, label)) { dup++; return; }
      var row = { id: newId('u'), text: line, label: label };
      S.rows.push(row); freshId = row.id; added++;
    });
    if (S.rows.length >= MAX_ROWS) EDU.toast(t('max_rows', { n: EDU.fmt(MAX_ROWS) }));
    else if (!added && dup) EDU.toast(t('dup_msg'));
    if (added) changed();
    return added;
  }
  function addFromInput() {
    var inp = $('#add-input');
    if (addRows(S.addAs, inp.value)) { inp.value = ''; }
    inp.focus();
  }
  function loadSamples() {
    var have = {};
    S.rows.forEach(function (r) { if (r.si !== undefined) have[r.sk + ':' + r.si] = 1; });
    var missing = [], c = content();
    ['spam', 'ham'].forEach(function (k) { c[k].forEach(function (_, i) { if (!have[k + ':' + i]) missing.push({ sk: k, si: i }); }); });
    if (!missing.length) { EDU.toast(t('samples_all')); return; }
    if (!confirm(t('confirm_samples'))) return;
    var fresh = missing.map(function (x) { return { id: newId('s'), sk: x.sk, si: x.si }; });
    S.rows = fresh.concat(S.rows);
    changed();
  }
  function clearAll() {
    if (!S.rows.length) return;
    if (!confirm(t('confirm_clear'))) return;
    S.rows = []; changed();
  }
  function exportCSV() {
    if (!S.rows.length) { EDU.toast(t('nothing_export')); return; }
    var rows = [['text', 'label']];
    S.rows.forEach(function (r) { rows.push([rowText(r), rowLabel(r)]); });
    EDU.download('spam-classifier-messages.csv', EDU.csv.stringify(rows), 'text/csv');
  }
  function labelFromCSV(v) {
    var k = NB.norm(String(v || '').trim()).replace(/[\s_-]+/g, ' ');
    if (!k) return null;
    var spam = ['spam', '1', 'yes', 'true'], ham = ['ham', 'not spam', 'notspam', 'real', 'genuine', 'legit', 'normal', '0', 'no', 'false'];
    Object.keys(window.APP_STRINGS || {}).forEach(function (L) {
      var S2 = window.APP_STRINGS[L];
      if (S2.lbl_spam) spam.push(NB.norm(S2.lbl_spam).replace(/[\s_-]+/g, ' '));
      if (S2.lbl_ham) ham.push(NB.norm(S2.lbl_ham).replace(/[\s_-]+/g, ' '));
    });
    if (spam.indexOf(k) >= 0) return 'spam';
    if (ham.indexOf(k) >= 0) return 'ham';
    return null;
  }
  function importCSV() {
    EDU.pickFile('.csv,.txt,text/csv,text/plain').then(function (f) {
      if (!f) return;
      return EDU.readText(f).then(function (txt) {
        var rows = EDU.csv.parse(String(txt || '').replace(/^﻿/, ''));
        if (!rows.length) { EDU.toast(t('import_bad')); return; }
        var head = rows[0].map(function (x) { return String(x || '').trim().toLowerCase(); });
        var ti = head.indexOf('text'), li = head.indexOf('label');
        var start = 0;
        if (ti >= 0 && li >= 0) start = 1; else { ti = 0; li = 1; }
        var items = [];
        for (var i = start; i < rows.length; i++) {
          var r = rows[i]; if (!r || r.length < 2) continue;
          var text = String(r[ti] || '').trim().slice(0, MAX_LEN), label = labelFromCSV(r[li]);
          if (!text || !label) continue;
          items.push({ text: text, label: label });
        }
        if (!items.length) { EDU.toast(t('import_bad')); return; }
        if (!confirm(t('confirm_import', { n: EDU.fmt(items.length) }))) return;
        var added = 0;
        items.forEach(function (it) {
          if (S.rows.length >= MAX_ROWS || hasText(it.text, it.label)) return;
          S.rows.push({ id: newId('u'), text: it.text, label: it.label }); added++;
        });
        changed();
        EDU.toast(t('import_ok', { n: EDU.fmt(added) }));
      });
    }).catch(function () { EDU.toast(t('import_bad')); });
  }

  /* experiment: 3 real messages that use "won" / "congratulations" / "prize" */
  function renderExp() {
    var c = content(), rows = expRows(), has = rows.length > 0;
    $('#exp-msg').textContent = '“' + c.tries.tricky + '”';
    $('#exp-btn').disabled = has || !model;
    $('#undo-btn').hidden = !has;
    var res = $('#exp-res'); res.innerHTML = '';
    if (!has || !model) return;
    /* before = model without the experiment rows; after = the current model */
    var expIds = {}; rows.forEach(function (r) { expIds[r.id] = 1; });
    var before = NB.classify(NB.train(docsTrain.filter(function (d) { return !expIds[d.id]; })), NB.tokenize(c.tries.tricky)).pSpam;
    var after = NB.classify(model, NB.tokenize(c.tries.tricky)).pSpam;
    var ba = el('div', { class: 'ba', dataset: { before: String(before), after: String(after) } });
    [['exp_before', before], ['exp_after', after]].forEach(function (x) {
      var bar = el('div', { class: 'sbar', 'aria-hidden': 'true' }, el('span', { style: { width: (x[1] * 100) + '%' } }));
      ba.appendChild(el('div', { class: 'ba-row' }, el('span', { class: 'ba-k', text: t(x[0]) }), el('div', { class: 'ba-v' }, el('span', { class: 'num', text: pct(x[1]) + ' ' + t('spam_word') }), bar)));
    });
    ba.appendChild(el('p', { class: 'ba-msg mb0', text: t(Math.abs(before - after) >= 0.1 ? 'exp_result' : 'exp_small', { a: pct(before), b: pct(after) }) }));
    res.appendChild(ba);
  }
  function runExp() {
    if (!model || expRows().length) return;
    var c = content();
    setTest(c.tries.tricky);
    var fresh = c.more_ham.map(function (_, i) { return { id: newId('e'), ei: i }; });
    S.rows = S.rows.concat(fresh);
    freshId = fresh[fresh.length - 1].id;
    changed();
    var card = $('#check-card'); if (card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function undoExp() { S.rows = S.rows.filter(function (r) { return r.ei === undefined; }); changed(); }

  /* ---------------- 3. fair test ---------------- */
  function renderEval() {
    $('#holdout-chk').checked = !!S.holdout;
    $('#st-train').textContent = EDU.fmt(docsTrain.length);
    $('#st-test').textContent = EDU.fmt(S.holdout ? docsTest.length : 0);
    $('#st-vocab').textContent = EDU.fmt(model ? model.V : 0);
    var r = evalRes, show = !!(r && r.n);
    $('#st-acc').textContent = show ? acc(r.acc) : '–';
    $('#st-acc').dataset.v = show ? String(r.acc) : '';
    $('#cheat-note').hidden = !(show && !S.holdout);
    $('#acc-none').hidden = show;
    $('#eval-grid').hidden = !show;
    $('#reshuffle-btn').disabled = !S.holdout;
    if (!show) return;
    ['tp', 'fp', 'fn', 'tn'].forEach(function (k) { var td = $('#cm-' + k); td.dataset.n = r[k]; td.querySelector('.cnt').textContent = EDU.fmt(r[k]); });
    $('#pr-line').textContent = t('precision_line', { p: r.precision === null ? '—' : acc(r.precision) });
    $('#rc-line').textContent = t('recall_line', { p: r.recall === null ? '—' : acc(r.recall) });
    $('#mist-sum').textContent = t('mistakes_t', { n: EDU.fmt(r.mistakes.length) });
    $('#no-mist').hidden = r.mistakes.length > 0;
    var ul = $('#mist-list'); ul.innerHTML = '';
    var docs = S.holdout ? docsTest : docsTrain;
    r.mistakes.forEach(function (mk) {
      var d = docs[mk.index];
      var li = el('li');
      li.appendChild(el('span', { class: 'mist-text no-i18n', text: d.text }));
      li.appendChild(el('span', { class: 'mist-meta', text: t('mistake_line', { guess: lblName(mk.pred), real: lblName(mk.real), p: pct(mk.pSpam) }) }));
      li.appendChild(el('span', { class: 'mist-meta no-i18n', text: mk.words.length ? t('mistake_why', { words: mk.words.join(', ') }) : t('mistake_why_none') }));
      li.appendChild(el('button', { type: 'button', class: 'btn btn-sm no-print', text: t('see_why'), onclick: function () {
        setTest(d.text);
        var card = $('#check-card'); if (card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } }));
      ul.appendChild(li);
    });
  }

  /* ---------------- 4. peek inside ---------------- */
  function renderPeek() {
    var table = $('#peek-table'), count = $('#peek-count'), more = $('#peek-more');
    table.innerHTML = '';
    SORTS.forEach(function (k) { $('#sort-' + k).setAttribute('aria-pressed', S.sort === k ? 'true' : 'false'); });
    $('#vocab-line').textContent = model ? t('vocab_line', { v: EDU.fmt(model.V), ws: EDU.fmt(model.nWords.spam), wh: EDU.fmt(model.nWords.ham) }) : '';
    if (!model) { count.textContent = t('no_model'); more.hidden = true; return; }
    var q = NB.norm($('#peek-filter').value.trim());
    var words = Object.keys(model.vocab).filter(function (w) { return !q || w.indexOf(q) >= 0; }).map(function (w) {
      return { w: w, cs: NB.count(model, w, 'spam'), ch: NB.count(model, w, 'ham'), ps: NB.prob(model, w, 'spam'), ph: NB.prob(model, w, 'ham'), lo: NB.logOdds(model, w), n: model.vocab[w] };
    });
    words.sort(function (a, b) {
      if (S.sort === 'spam') return b.lo - a.lo || b.n - a.n || (a.w < b.w ? -1 : 1);
      if (S.sort === 'ham') return a.lo - b.lo || b.n - a.n || (a.w < b.w ? -1 : 1);
      return b.n - a.n || (a.w < b.w ? -1 : 1);
    });
    count.textContent = words.length ? t('peek_count', { a: EDU.fmt(Math.min(peekLimit, words.length)), b: EDU.fmt(words.length) }) : t('peek_none');
    more.hidden = words.length <= peekLimit;
    if (!words.length) return;
    var thead = el('thead'), tr = el('tr');
    tr.appendChild(el('th', { text: t('col_word') }));
    tr.appendChild(el('th', { class: 'n', text: t('col_spam_n') }));
    tr.appendChild(el('th', { class: 'n', text: t('col_ham_n') }));
    tr.appendChild(el('th', { class: 'n', text: t('col_pspam') }));
    tr.appendChild(el('th', { class: 'n', text: t('col_pham') }));
    tr.appendChild(el('th', { text: t('col_leans') }));
    thead.appendChild(tr); table.appendChild(thead);
    var tbody = el('tbody');
    words.slice(0, peekLimit).forEach(function (x) {
      var r = el('tr', { dataset: { word: x.w } });
      r.appendChild(el('td', { class: 'w', text: x.w }));
      r.appendChild(el('td', { class: 'n' + (x.cs ? '' : ' zero'), text: EDU.fmt(x.cs) }));
      r.appendChild(el('td', { class: 'n' + (x.ch ? '' : ' zero'), text: EDU.fmt(x.ch) }));
      r.appendChild(el('td', { class: 'n' }, ltr(f3(x.ps))));
      r.appendChild(el('td', { class: 'n' }, ltr(f3(x.ph))));
      var side = x.lo > 1e-9 ? 'spam' : (x.lo < -1e-9 ? 'ham' : 'even');
      r.appendChild(el('td', {}, el('span', { class: 'push ' + side, text: side === 'even' ? t('lean_even') : lblName(side) + ' ×' + times(Math.exp(Math.abs(x.lo))) })));
      tbody.appendChild(r);
    });
    table.appendChild(tbody);
  }

  /* ---------------- glue ---------------- */
  function renderPresent() {
    $('#app').classList.toggle('present', !!S.present);
    $('#proj-btn').setAttribute('aria-pressed', S.present ? 'true' : 'false');
  }
  function renderAll() { renderChecker(); renderData(); renderEval(); renderPeek(); renderPresent(); }

  /* ---------------- events ---------------- */
  $('#msg').addEventListener('input', function () { S.test = $('#msg').value.slice(0, MAX_LEN); save(); renderChecker(); });
  $('#msg-clear').addEventListener('click', function () { setTest(''); $('#msg').focus(); });
  EDU.$$('.try-chip').forEach(function (b) { b.addEventListener('click', function () { setTest(content().tries[b.dataset.kind]); }); });
  $('#add-spam').addEventListener('click', function () { S.addAs = 'spam'; save(); renderData(); });
  $('#add-ham').addEventListener('click', function () { S.addAs = 'ham'; save(); renderData(); });
  $('#add-btn').addEventListener('click', addFromInput);
  $('#add-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addFromInput(); } });
  $('#add-input').addEventListener('paste', function (e) {               /* a pasted list adds one message per line */
    var txt = e.clipboardData && e.clipboardData.getData('text/plain');
    if (txt && /[\r\n]/.test(txt.trim())) { e.preventDefault(); if (addRows(S.addAs, txt)) $('#add-input').value = ''; }
  });
  $('#samples-btn').addEventListener('click', loadSamples);
  $('#clear-btn').addEventListener('click', clearAll);
  $('#export-btn').addEventListener('click', exportCSV);
  $('#import-btn').addEventListener('click', importCSV);
  $('#exp-btn').addEventListener('click', runExp);
  $('#undo-btn').addEventListener('click', undoExp);
  $('#holdout-chk').addEventListener('change', function () { S.holdout = $('#holdout-chk').checked; changed(); });
  $('#reshuffle-btn').addEventListener('click', function () { S.seed = (S.seed % 100000) + 1; changed(); });
  $('#peek-filter').addEventListener('input', function () { peekLimit = PEEK_STEP; renderPeek(); });
  $('#peek-more').addEventListener('click', function () { peekLimit += PEEK_STEP * 2; renderPeek(); });
  SORTS.forEach(function (k) { $('#sort-' + k).addEventListener('click', function () { S.sort = k; peekLimit = PEEK_STEP; save(); renderPeek(); }); });
  $('#proj-btn').addEventListener('click', function () {
    S.present = !S.present; save(); renderPresent();
    if (S.present && !document.fullscreenElement) EDU.fullscreen();
    else if (!S.present && document.fullscreenElement) EDU.fullscreen();
  });
  $('#print-btn').addEventListener('click', function () { window.print(); });
  $('#reset-btn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    defaultState(); peekLimit = PEEK_STEP; $('#peek-filter').value = ''; $('#add-input').value = '';
    changed();
  });

  /* If the message box still holds one of the ready-made messages from another language, show it in this one. */
  function translateTest() {
    var nc = content();
    EDU.LANGS.forEach(function (L) {
      var oc = content(L.code);
      if (!oc || oc === nc) return;
      TRY_KINDS.forEach(function (k) { if (S.test === oc.tries[k]) S.test = nc.tries[k]; });
    });
  }
  EDU.onLang(function () { translateTest(); peekLimit = PEEK_STEP; changed(); });

  /* ---------------- start ---------------- */
  loadState();
  translateTest();
  rebuild();
  save();
  renderAll();
})();
