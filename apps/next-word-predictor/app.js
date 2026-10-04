/* Next-Word Predictor: a tiny n-gram (Markov chain) language model that runs on the device.
   Training = counting which word came after which words. Predicting = turning counts into chances. */
(function () {
  'use strict';
  var SLUG = 'next-word-predictor';
  var MAX_CHARS = 200000;          // ~30,000 words: plenty for a class, still instant on a cheap phone
  var MIN_WORDS = 5;
  var SEP = '\u0001';
  var END_CHARS = '.!?।॥۔؟';
  /* Poems: in a text made of short lines, every line break is learned as its own "end of line" token,
     so the model writes line by line and invented lines can be found. Shown as ↵. */
  var NL = '\n', NL_SHOW = '↵';
  var LINE_CHARS = '\n\r\u2028\u2029↵';
  var LINE_RE = new RegExp('[' + LINE_CHARS + ']');
  var store = EDU.store(SLUG);
  var $ = EDU.$, el = EDU.el, t = EDU.t;

  EDU.init({ slug: SLUG, title: 'app_title' });

  function clampInt(v, lo, hi, d) { v = parseInt(v, 10); if (isNaN(v)) v = d; return Math.max(lo, Math.min(hi, v)); }
  function clampNum(v, lo, hi, d) { v = parseFloat(v); if (isNaN(v)) v = d; return Math.max(lo, Math.min(hi, v)); }

  var S = {
    src: store.get('src', 'sample') === 'custom' ? 'custom' : 'sample',
    custom: String(store.get('custom', '') || ''),
    n: clampInt(store.get('n', 2), 0, 3, 2),
    temp: clampNum(store.get('temp', 0.8), 0, 2, 0.8),
    len: clampInt(store.get('len', 25), 5, 80, 25)
  };
  var model = null, lastOut = null, trainTimer = null, toldCustom = false;

  function content() {
    var C = window.APP_CONTENT || {};
    return C[EDU.lang] || C.en || { title: '', text: '', start: '', fake: '' };
  }
  function trainingText() { return S.src === 'sample' ? content().text : S.custom; }

  /* ---------------- tokenizer (Unicode-aware) ---------------- */
  var segs = {};
  function getSeg() {
    var L = EDU.lang;
    if (segs[L] === undefined) {
      segs[L] = null;
      try { if (window.Intl && Intl.Segmenter) segs[L] = new Intl.Segmenter(EDU.langInfo(L).tag, { granularity: 'word' }); } catch (e) { segs[L] = null; }
    }
    return segs[L];
  }
  var FALLBACK_RE = (function () {
    var tail = '|[' + END_CHARS + ']+|[' + LINE_CHARS + ']+';
    try { return new RegExp('[\\p{L}\\p{M}\\p{N}\\u200c\\u200d]+(?:[\'’][\\p{L}\\p{M}\\p{N}\\u200c\\u200d]+)*' + tail, 'gu'); }
    catch (e) { return new RegExp('[^\\s.,!?;:"“”‘’()\\[\\]{}<>/|।॥۔؟،\\u21b5]+' + tail, 'g'); }
  })();
  var END_ONLY_RE = new RegExp('^[' + END_CHARS + ']+$');
  var LINE_ONLY_RE = new RegExp('^[' + LINE_CHARS + ']+$');
  /* The end mark inside a piece of punctuation/space; a line break counts only in poem mode. */
  function endMark(s, lines) {
    for (var i = 0; i < s.length; i++) if (END_CHARS.indexOf(s[i]) >= 0) return s[i] === '॥' ? '।' : s[i];
    return lines && LINE_RE.test(s) ? NL : null;
  }
  function isEnd(tok) { return tok === NL || (!!tok && tok.length === 1 && END_CHARS.indexOf(tok) >= 0); }
  /* Poem mode when most lines are short and full stops are rarely in the middle of a line
     (a pasted textbook page with long lines, or prose wrapped mid-sentence, stays in normal mode). */
  function looksLikeLines(text) {
    var lines = String(text || '').split(/\r\n|[\n\r\u2028\u2029]/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (lines.length < 3) return false;
    var lens = lines.map(function (s) { return s.length; }).sort(function (a, b) { return a - b; });
    if (lens[Math.floor(lens.length / 2)] > 60) return false;
    var mid = 0, re = new RegExp('[' + END_CHARS + '](?=[\\s"“”\'’)\\]]*[^\\s"“”\'’)\\]' + END_CHARS + '])', 'g');
    lines.forEach(function (s) { mid += (s.match(re) || []).length; });
    return mid <= lines.length / 3;
  }
  function tokenize(text, lines) {
    text = String(text || '');
    var out = [], seg = getSeg();
    /* No two end marks in a row, except that in poem mode a line break after "." / "!" / "।" is kept too,
       so a line that ends with a full stop still ends the line. */
    function pushEnd(m) {
      var last = out[out.length - 1];
      if (m && out.length && (!isEnd(last) || (m === NL && last !== NL))) out.push(m);
    }
    if (seg) {
      var it = seg.segment(text)[Symbol.iterator](), r;
      while (!(r = it.next()).done) {
        if (r.value.isWordLike) out.push(r.value.segment);
        else pushEnd(endMark(r.value.segment, lines));
      }
    } else {
      (text.match(FALLBACK_RE) || []).forEach(function (w) {
        if (LINE_ONLY_RE.test(w)) { if (lines) pushEnd(NL); }
        else if (END_ONLY_RE.test(w)) pushEnd(endMark(w, false));
        else out.push(w);
      });
    }
    return out;
  }
  function norm(w) { return isEnd(w) ? w : w.toLocaleLowerCase(); }

  /* ---------------- the model ---------------- */
  function train(text) {
    text = String(text || '').slice(0, MAX_CHARS);
    var lines = looksLikeLines(text);
    var raw = tokenize(text, lines);
    var toks = [], surf = new Map(), first = new Map(), endCount = new Map();
    raw.forEach(function (w, i) {
      var k = norm(w);
      if (!first.has(k)) first.set(k, toks.length);
      var m = surf.get(k); if (!m) { m = new Map(); surf.set(k, m); }
      // spelling seen at the start of a sentence ("Every") only breaks ties with mid-sentence spellings ("every")
      var initial = !i || isEnd(raw[i - 1]);
      m.set(w, (m.get(w) || 0) + (initial ? 0.001 : 1));
      if (isEnd(k)) endCount.set(k, (endCount.get(k) || 0) + 1);
      toks.push(k);
    });
    var disp = new Map();   // most common spelling of each word (keeps "I", names, etc.)
    surf.forEach(function (m, k) { var best = k, bc = -1; m.forEach(function (c, w) { if (c > bc) { bc = c; best = w; } }); disp.set(k, best); });
    var tables = [];
    for (var n = 0; n <= 3; n++) {
      var tab = new Map();
      for (var i = n; i < toks.length; i++) {
        var key = n ? toks.slice(i - n, i).join(SEP) : '';
        var m = tab.get(key); if (!m) { m = new Map(); tab.set(key, m); }
        m.set(toks[i], (m.get(toks[i]) || 0) + 1);
      }
      tables.push(tab);
    }
    var words = 0, vocab = new Set(), endTok = null, ec = 0;
    toks.forEach(function (k) { if (!isEnd(k)) { words++; vocab.add(k); } });
    endCount.forEach(function (c, k) { if (c > ec) { ec = c; endTok = k; } });
    if (lines && endCount.has(NL)) endTok = NL;   // poem: an empty start means "start of a line"
    return { toks: toks, disp: disp, first: first, tables: tables, words: words, vocab: vocab.size, endTok: endTok,
      lines: lines, joined: SEP + toks.join(SEP) + SEP };
  }

  /* Look at the last n words; if that exact sequence was never seen, use fewer words (back-off). */
  function predict(ctx) {
    if (!model || !model.toks.length) return null;
    var virt = !ctx.length && !!model.endTok;           // empty start = "start of a sentence"
    var c = virt ? [model.endTok] : ctx;
    var want = Math.min(S.n, c.length);
    for (var k = want; k >= 0; k--) {
      var key = k ? c.slice(c.length - k).join(SEP) : '';
      var m = model.tables[k].get(key);
      if (m && m.size) {
        var total = 0, list = [];
        m.forEach(function (cnt, w) { total += cnt; list.push({ w: w, c: cnt }); });
        list.forEach(function (x) { x.p = x.c / total; });
        list.sort(function (a, b) { return b.c - a.c || model.first.get(a.w) - model.first.get(b.w); });
        return { k: k, want: want, list: list, total: total, ctx: k ? c.slice(c.length - k) : [], virt: virt };
      }
    }
    return null;
  }

  /* Temperature sampling: weight = count^(1/T). T = 0 always takes the top word. */
  function choose(list, temp, avoidEnd) {
    var L = list;
    if (avoidEnd) { var f = list.filter(function (x) { return !isEnd(x.w); }); if (f.length) L = f; }
    var item = L[0];
    if (temp >= 0.05 && L.length > 1) {
      var mx = -Infinity, ws = L.map(function (x) { var v = Math.log(x.c) / temp; if (v > mx) mx = v; return v; });
      var sum = 0;
      ws = ws.map(function (v) { var e = Math.exp(v - mx); sum += e; return e; });
      var r = Math.random() * sum;
      item = L[L.length - 1];
      for (var i = 0; i < L.length; i++) { r -= ws[i]; if (r <= 0) { item = L[i]; break; } }
    }
    return { item: item, top: item.c === L[0].c };
  }

  function generate(startToks, nWords, temp) {
    var ctx = startToks.slice(), out = [], words = 0, guard = nWords * 2 + 4;
    while (words < nWords && guard-- > 0) {
      var pr = predict(ctx);
      if (!pr) break;
      var last = ctx[ctx.length - 1];
      var ch = choose(pr.list, temp, !last || isEnd(last));
      out.push({ w: ch.item.w, p: ch.item.p, top: ch.top, k: pr.k, backoff: pr.k < pr.want });
      ctx.push(ch.item.w);
      if (!isEnd(ch.item.w)) words++;
    }
    return out;
  }

  function seqInText(seq) { return model.joined.indexOf(SEP + seq.join(SEP) + SEP) >= 0; }

  /* ---------------- display helpers ---------------- */
  function dispTok(k) { return k === NL ? NL_SHOW : (model && model.disp.get(k)) || k; }
  function cap(s) { return s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s; }
  function joinToks(toks) {
    var s = '';
    toks.forEach(function (k, i) { s += (i && (!isEnd(k) || k === NL) ? ' ' : '') + dispTok(k); });
    return s;
  }
  function endLabel(k) { return t(k === NL ? 'end_line' : 'end_mark'); }
  function startLabel() { return t(model && model.lines ? 'line_start' : 'sent_start'); }
  function pct(p) { return EDU.fmt(p, { style: 'percent', maximumFractionDigits: p < 0.1 && p > 0 ? 1 : 0 }); }
  function bucket(p) { return p >= 0.5 ? 'p-high' : p >= 0.2 ? 'p-mid' : p >= 0.05 ? 'p-low' : 'p-rare'; }
  function startTokens() { return tokenize($('#start-input').value, !!(model && model.lines)).map(norm); }

  /* ---------------- training ---------------- */
  function retrain() {
    clearTimeout(trainTimer); trainTimer = null;
    model = train(trainingText());
    lastOut = null;
    setPrintText();
    renderStats(); renderPredict(); renderOutput(); renderPeek();
  }
  function retrainSoon() { clearTimeout(trainTimer); trainTimer = setTimeout(retrain, 400); }
  function flushTrain() { if (trainTimer) retrain(); }   // text was just edited: learn it before using the model
  /* The printout shows the training text, but only its beginning when it is very long. */
  var PRINT_CHARS = 3000;
  function setPrintText() {
    var txt = trainingText();
    $('#train-print').textContent = txt.length > PRINT_CHARS ? txt.slice(0, PRINT_CHARS).replace(/\s+\S*$/, '') + ' …' : txt;
  }

  function saveStart() { store.set('start', { lang: EDU.lang, text: $('#start-input').value }); }
  function loadStart() {
    var st = store.get('start', null);
    $('#start-input').value = (st && typeof st.text === 'string' && (S.src === 'custom' || st.lang === EDU.lang)) ? st.text : content().start;
  }

  /* ---------------- rendering ---------------- */
  function renderControls() {
    $('#src-sample').setAttribute('aria-pressed', String(S.src === 'sample'));
    $('#src-custom').setAttribute('aria-pressed', String(S.src === 'custom'));
    $('#src-note').textContent = S.src === 'sample' ? t('sample_name', { title: content().title }) : t('saved_local');
    for (var i = 0; i <= 3; i++) $('#n-' + i).setAttribute('aria-pressed', String(S.n === i));
    $('#n-hint').textContent = S.n === 0 ? t('n_hint_0') : S.n === 1 ? t('n_hint_1') : t('n_hint', { n: S.n, m: S.n + 1 });
    $('#len').value = S.len;
    $('#temp').value = S.temp;
    $('#len-label').textContent = t('len_label', { n: EDU.fmt(S.len) });
    $('#temp-label').textContent = t('temp_label', { t: EDU.fmt(S.temp, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
    $('#hallu-text').textContent = t('hallu_1', { ex: content().fake });
  }

  function renderStats() {
    if (!model) return;
    var pairs = 0;
    model.tables[S.n].forEach(function (m) { pairs += m.size; });
    $('#stat-words').textContent = EDU.fmt(model.words);
    $('#stat-vocab').textContent = EDU.fmt(model.vocab);
    $('#stat-ngrams').textContent = EDU.fmt(pairs);
    $('#stat-ngrams-sub').textContent = t('stat_ngrams_sub', { m: S.n + 1 });
    var need = $('#need-text');
    need.hidden = model.words >= MIN_WORDS;
    need.textContent = t('need_text', { n: MIN_WORDS });
    $('#lines-note').hidden = !model.lines;
    $('#lines-note').textContent = t('lines_note');
    $('#cut-note').hidden = !(S.src === 'custom' && $('#train-text').value.length > MAX_CHARS);
    $('#cut-note').textContent = t('text_cut', { n: EDU.fmt(MAX_CHARS) });
  }

  function renderPredict() {
    var toks = startTokens();
    var pr = predict(toks);
    var chips = $('#ctx-chips');
    chips.innerHTML = '';
    var used = pr ? pr.k : 0, want = pr ? pr.want : 0;
    if (!toks.length) {
      chips.appendChild(el('span', { class: 'tok' + (used ? ' on' : ''), text: startLabel() }));
    } else {
      var shown = toks.slice(-8);
      if (toks.length > 8) chips.appendChild(el('span', { class: 'muted', text: '…' }));
      shown.forEach(function (w, i) {
        var fromEnd = shown.length - i, cls = 'tok';
        if (fromEnd <= used) cls += ' on'; else if (fromEnd <= want) cls += ' skip';
        if (model && !isEnd(w) && !model.first.has(w)) cls += ' unk';
        chips.appendChild(el('span', { class: cls, text: dispTok(w) }));
      });
    }
    var notes = [];
    var unk = [];
    toks.forEach(function (w) { if (model && !isEnd(w) && !model.first.has(w) && unk.indexOf(w) < 0) unk.push(w); });
    if (unk.length) notes.push(t('unknown', { w: unk.slice(0, 3).join(', ') }));
    if (pr && pr.k < pr.want) notes.push(t('backoff', { k: pr.k }));
    $('#ctx-note').textContent = notes.join(' ');
    $('#ctx-note').className = 'small mb0' + (notes.length ? ' callout warning' : '');

    var list = $('#cands');
    list.innerHTML = '';
    $('#pick-btn').disabled = !pr;
    if (!pr) {
      list.appendChild(el('p', { class: 'muted mb0', text: t('no_guess') }));
      $('#explain').textContent = '';
      return;
    }
    var atStart = !toks.length || isEnd(toks[toks.length - 1]);   // the guess would begin a sentence
    // a sentence cannot start with a full stop (only possible with memory 0): show words there
    var shownList = atStart ? pr.list.filter(function (x) { return !isEnd(x.w); }) : pr.list;
    (shownList.length ? shownList : pr.list).slice(0, 5).forEach(function (x) {
      var seen = t('seen', { c: EDU.fmt(x.c), t: EDU.fmt(pr.total) });
      list.appendChild(el('button', { type: 'button', class: 'cand', 'data-w': x.w, onclick: function () { appendWord(x.w); } },
        el('span', { class: 'cand-word' },
          el('span', { class: 'cand-w', text: atStart && !isEnd(x.w) ? cap(dispTok(x.w)) : dispTok(x.w) }),
          el('small', { text: isEnd(x.w) ? endLabel(x.w) + ' · ' + seen : seen })),
        el('span', { class: 'cand-bar', 'aria-hidden': 'true' }, el('span', { style: { width: (x.p * 100).toFixed(1) + '%' } })),
        el('span', { class: 'cand-pct', text: pct(x.p) })));
    });
    var ctxTxt = pr.virt ? startLabel() : joinToks(pr.ctx);
    $('#explain').textContent = pr.k === 0 ? t('explain_none', { t: EDU.fmt(pr.total) }) : t('explain_ctx', { ctx: ctxTxt, t: EDU.fmt(pr.total) });
  }

  function appendWord(w) {
    var inp = $('#start-input');
    var v = inp.value.replace(/\s+$/, '');
    var toks = startTokens(), last = toks[toks.length - 1];
    var shown = dispTok(w);
    if (!isEnd(w) && (!toks.length || isEnd(last))) shown = cap(shown);
    inp.value = isEnd(w) && w !== NL ? v + shown : (v ? v + ' ' : '') + shown;
    saveStart(); renderPredict();
  }

  function renderOutput() {
    var box = $('#output'), sum = $('#sent-summary'), rate = $('#top-rate');
    box.innerHTML = '';
    sum.hidden = true; sum.dataset.new = '0'; sum.dataset.judged = '0';
    rate.textContent = '';
    if (!lastOut || !lastOut.gen.length) { box.appendChild(el('span', { class: 'muted', text: t('out_empty') })); return; }
    var items = lastOut.start.map(function (w) { return { w: w, start: true }; }).concat(lastOut.gen);
    var sents = [], cur = [];
    items.forEach(function (it) { cur.push(it); if (isEnd(it.w)) { sents.push(cur); cur = []; } });
    if (cur.length) sents.push(cur);
    var judged = 0, fresh = 0, first = true, prevEnd = true;
    sents.forEach(function (s) {
      var nWords = s.filter(function (it) { return !isEnd(it.w); }).length;
      var hasGen = s.some(function (it) { return !it.start; });
      var isNew = false;
      if (nWords >= 3 && hasGen) { judged++; isNew = !seqInText(s.map(function (it) { return it.w; })); if (isNew) fresh++; }
      var span = el('span', { class: 'sent' + (isNew ? ' sent-new' : '') });
      s.forEach(function (it, i) {
        var end = isEnd(it.w), nl = it.w === NL;
        if (!first && (!end || nl)) (i ? span : box).appendChild(document.createTextNode(' '));
        var txt = dispTok(it.w);
        if (prevEnd && !end) txt = cap(txt);
        var cls = 'w ' + (it.start ? 'w-start' : 'w-gen ' + bucket(it.p)) + (end ? ' w-end' : '') + (nl ? ' w-nl' : '');
        var w = el('span', { class: cls, text: txt });
        if (!it.start) { w.dataset.p = it.p.toFixed(4); w.title = t('word_tip', { p: pct(it.p) }) + (end ? ' · ' + endLabel(it.w) : ''); }
        span.appendChild(w);
        first = false; prevEnd = end;
      });
      box.appendChild(span);
      if (s[s.length - 1].w === NL) box.appendChild(el('br'));   // poem mode: the model ended the line
    });
    if (judged) {
      sum.hidden = false;
      sum.dataset.new = String(fresh); sum.dataset.judged = String(judged);
      sum.className = 'callout small mb0' + (fresh ? ' warning' : ' success');
      sum.textContent = fresh ? t('sum_new', { a: EDU.fmt(fresh), b: EDU.fmt(judged) }) : t('sum_copy');
    }
    var gw = lastOut.gen.filter(function (g) { return !isEnd(g.w); });
    var tops = gw.filter(function (g) { return g.top; }).length;
    if (gw.length) rate.textContent = t('top_rate', { a: EDU.fmt(tops), b: EDU.fmt(gw.length) });
  }

  /* Plain text of the output for Copy / Read aloud; poem lines keep their line breaks. */
  function outputText() {
    if (!lastOut || !lastOut.gen.length) return '';
    return $('#output').textContent.split(NL_SHOW).map(function (s) { return s.replace(/\s+/g, ' ').trim(); }).join('\n').trim();
  }

  function renderPeek() {
    var body = $('#peek-body');
    body.innerHTML = '';
    var rows = [];
    if (model) model.tables[S.n].forEach(function (m, key) {
      m.forEach(function (c, w) { rows.push({ ctx: key, w: w, c: c }); });
    });
    rows.sort(function (a, b) { return b.c - a.c; });
    if (!rows.length) { body.appendChild(el('tr', {}, el('td', { colspan: '4', class: 'muted', text: t('peek_empty') }))); return; }
    rows.slice(0, 10).forEach(function (r) {
      var ctx = r.ctx ? joinToks(r.ctx.split(SEP)) : '—';
      body.appendChild(el('tr', {},
        el('td', { text: ctx }),
        el('td', { class: 'arrow', 'aria-hidden': 'true', text: document.documentElement.dir === 'rtl' ? '←' : '→' }),
        el('td', {}, el('b', { text: dispTok(r.w) }), isEnd(r.w) ? el('span', { class: 'muted small', text: ' (' + endLabel(r.w) + ')' }) : null),
        el('td', { class: 'n', text: EDU.fmt(r.c) })));
    });
  }

  function renderAll() { renderControls(); renderStats(); renderPredict(); renderOutput(); renderPeek(); }

  /* ---------------- events ---------------- */
  var ta = $('#train-text');
  ta.addEventListener('input', function () {
    if (S.src === 'sample') {
      S.src = 'custom'; store.set('src', 'custom');
      if (!toldCustom) { toldCustom = true; EDU.toast(t('edited_custom')); }
      renderControls();
    }
    S.custom = ta.value.slice(0, MAX_CHARS);
    store.set('custom', S.custom);
    retrainSoon();
  });
  $('#train-btn').addEventListener('click', function () {
    if (S.src === 'custom') { S.custom = ta.value.slice(0, MAX_CHARS); store.set('custom', S.custom); }
    retrain();
    EDU.toast(model.words >= MIN_WORDS ? t('trained', { n: EDU.fmt(model.words) }) : t('need_text', { n: MIN_WORDS }));
  });
  $('#src-sample').addEventListener('click', function () {
    S.src = 'sample'; store.set('src', 'sample');
    ta.value = content().text;
    $('#start-input').value = content().start; saveStart();
    renderControls(); retrain();
  });
  $('#src-custom').addEventListener('click', function () {
    S.src = 'custom'; store.set('src', 'custom');
    ta.value = S.custom;
    renderControls(); retrain();
    ta.focus();
  });
  $('#clear-text').addEventListener('click', function () {
    // the class's own text is saved on this device: never wipe it without asking
    if (S.custom.trim() && !confirm(t('confirm_clear'))) return;
    S.src = 'custom'; S.custom = ''; ta.value = '';
    store.set('src', 'custom'); store.set('custom', '');
    renderControls(); retrain(); ta.focus();
  });
  $('#open-btn').addEventListener('click', function () {
    EDU.pickFile('.txt,text/plain').then(function (f) {
      if (!f) return null;
      return EDU.readText(f).then(function (txt) {
        if (!txt || !txt.trim() || /\u0000/.test(txt.slice(0, 2000))) { EDU.toast(t('file_bad')); return; }
        if (txt.length > MAX_CHARS) { txt = txt.slice(0, MAX_CHARS); EDU.toast(t('file_cut')); }
        S.src = 'custom'; S.custom = txt; ta.value = txt;
        store.set('src', 'custom'); store.set('custom', txt);
        renderControls(); retrain();
      });
    }).catch(function () { EDU.toast(t('file_bad')); });
  });
  for (var i = 0; i <= 3; i++) (function (n) {
    $('#n-' + n).addEventListener('click', function () {
      S.n = n; store.set('n', n);
      renderControls(); renderStats(); renderPredict(); renderPeek();
    });
  })(i);

  var inp = $('#start-input');
  inp.addEventListener('input', function () { saveStart(); renderPredict(); });
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); var b = $('#cands .cand'); if (b) b.click(); }
  });
  $('#undo-btn').addEventListener('click', function () {
    var v = inp.value.replace(/\s+$/, '');
    if (v && END_CHARS.indexOf(v.slice(-1)) >= 0) v = v.slice(0, -1);
    else v = v.replace(/\S+$/, '');
    inp.value = v.replace(/\s+$/, '');
    saveStart(); renderPredict(); inp.focus();
  });
  $('#clear-start').addEventListener('click', function () { inp.value = ''; saveStart(); renderPredict(); inp.focus(); });
  $('#pick-btn').addEventListener('click', function () {
    flushTrain();
    var toks = startTokens(), pr = predict(toks);
    if (!pr) return;
    var last = toks[toks.length - 1];
    appendWord(choose(pr.list, S.temp, !last || isEnd(last)).item.w);
  });

  $('#len').addEventListener('input', function () { S.len = clampInt(this.value, 5, 80, 25); store.set('len', S.len); renderControls(); });
  $('#temp').addEventListener('input', function () { S.temp = clampNum(this.value, 0, 2, 0.8); store.set('temp', S.temp); renderControls(); });
  $('#write-btn').addEventListener('click', function () {
    flushTrain();
    if (!model || !model.toks.length) { EDU.toast(t('no_guess')); return; }
    var st = startTokens();
    lastOut = { start: st, gen: generate(st, S.len, S.temp) };
    renderOutput();
  });
  $('#speak-btn').addEventListener('click', function () {
    var txt = outputText();
    if (!txt) { EDU.toast(t('out_empty')); return; }
    EDU.speak(txt, { rate: 0.95 }).then(function (ok) { if (!ok) EDU.toast(t('no_voice')); });
  });
  $('#copy-btn').addEventListener('click', function () {
    var txt = outputText();
    if (!txt) { EDU.toast(t('out_empty')); return; }
    EDU.copy(txt);
  });
  $('#print-btn').addEventListener('click', function () { window.print(); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen(); });
  $('#reset-btn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['src', 'custom', 'n', 'temp', 'len', 'start'].forEach(function (k) { store.remove(k); });
    S.src = 'sample'; S.custom = ''; S.n = 2; S.temp = 0.8; S.len = 25;
    ta.value = content().text;
    inp.value = content().start;
    renderControls(); retrain();
  });

  EDU.onLang(function () {
    if (S.src === 'sample') {
      ta.value = content().text;
      inp.value = content().start; saveStart();
      retrain();
    }
    renderAll();
  });

  /* ---------------- start ---------------- */
  ta.value = trainingText();
  loadStart();
  model = train(trainingText());
  setPrintText();
  renderAll();
})();
