/* Token Explorer: characters, words and a live-trained byte-level BPE tokenizer. */
(function () {
  'use strict';
  var SLUG = 'tokenizer-lab';
  var T = window.TOKLAB;
  var C = window.APP_CONTENT || {};
  var EXTRA = window.TOKLAB_EN_EXTRA || '';
  var store = EDU.store(SLUG);
  var MAX = T.MAX_MERGES, CHIP_CAP = 1500, INPUT_CAP = 50000, IDS_CAP = 3000;
  var MODES = ['char', 'word', 'bpe'], SRCS = ['en', 'lang', 'both', 'all', 'own'];
  var CTX_SIZES = [4096, 8192, 32768, 128000, 1000000];
  var WORDS_PER_PAGE = 300, DEFAULT_N = 300;
  var LCODES = EDU.LANGS.map(function (l) { return l.code; });

  function asStr(v) { return typeof v === 'string' ? v : null; }
  var state = {
    mode: MODES.indexOf(store.get('mode')) >= 0 ? store.get('mode') : 'bpe',
    src: SRCS.indexOf(store.get('src')) >= 0 ? store.get('src') : null,       // null = automatic default
    merges: store.get('merges', null) === null ? null : EDU.clamp(parseInt(store.get('merges'), 10) || 0, 0, MAX),   // null = default
    own: asStr(store.get('own', '')) || '',
    input: asStr(store.get('input', null)),                                     // null = example sentence of the current language
    showIds: store.get('showIds', true) !== false,
    ctx: CTX_SIZES.indexOf(store.get('ctx')) >= 0 ? store.get('ctx') : 8192,
    bytesDemo: asStr(store.get('bytesDemo', null))
  };

  EDU.init({ slug: SLUG, title: 'app_title' });

  var $ = EDU.$, t = EDU.t, fmt = EDU.fmt, el = EDU.el;
  var inputEl = $('#input'), ownEl = $('#own-text'), mergesEl = $('#merges'), byteEl = $('#byte-in');

  function content(L) { return C[L] || C.en; }
  function native(L) { return EDU.langInfo(L).native; }
  function dec(n, d) { return fmt(n, { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function inputText() { var s = state.input === null ? content(EDU.lang).sentence : state.input; return s.length > INPUT_CAP ? s.slice(0, INPUT_CAP) : s; }

  /* ---------- training corpora and models (cached) ---------- */
  function effSrc() {
    var s = state.src || (EDU.lang === 'en' ? 'en' : 'both');
    if ((s === 'lang' || s === 'both') && EDU.lang === 'en') s = 'en';
    return s;
  }
  function corpusText(src) {
    var L = EDU.lang;
    if (src === 'en') return C.en.sample + '\n' + EXTRA;
    if (src === 'lang') return content(L).sample;
    if (src === 'both') return C.en.sample + '\n' + content(L).sample;
    if (src === 'all') return LCODES.map(function (c) { return content(c).sample; }).join('\n');
    return state.own;
  }
  var models = {};
  function getModel(src) {
    var key = (src === 'lang' || src === 'both') ? src + ':' + EDU.lang : src;
    var txt = corpusText(src), m = models[key];
    if (!m || m.srcText !== txt) {
      m = T.train(txt, MAX);
      m.srcText = txt; m.disp = {};
      models[key] = m;
    }
    return m;
  }
  function model() { return getModel(effSrc()); }
  /* Number of merges in use: the slider value, or by default 300 (fewer if the training text allows fewer). */
  function N() { return state.merges === null ? Math.min(DEFAULT_N, model().merges.length) : state.merges; }

  /* ---------- token display helpers ---------- */
  function tokenView(m, id) {
    if (m.disp[id]) return m.disp[id];
    var parts = T.pieces(m.vocab[id]);
    var v = {
      parts: parts,
      raw: parts.every(function (p) { return p.raw; }),
      s: parts.filter(function (p) { return !p.raw; }).map(function (p) { return p.s; }).join('')
    };
    m.disp[id] = v;
    return v;
  }
  /* A token made of text parts and raw-byte parts (‹E0 A4› = piece of a character). */
  function fillParts(node, parts) {
    parts.forEach(function (p) {
      if (p.raw) node.appendChild(el('span', { class: 'rb', dir: 'ltr', text: '‹' + p.s + '›' }));
      else fillText(node, p.s, false);
    });
    return node;
  }
  /* Show spaces / newlines visibly and put a dotted circle before a lone vowel sign. */
  function fillText(node, s, raw) {
    if (raw) { node.textContent = '‹' + s + '›'; return node; }
    if (T.isMark(s)) node.appendChild(el('span', { class: 'sp', text: '◌' }));
    var buf = '';
    function flush() { if (buf) { node.appendChild(document.createTextNode(buf)); buf = ''; } }
    Array.from(s).forEach(function (ch) {
      var vis = ch === ' ' ? '␣' : ch === '\n' ? '↵' : ch === '\t' ? '⇥' : ch === '\r' ? '' : null;
      if (vis === null) buf += ch;
      else if (vis) { flush(); node.appendChild(el('span', { class: 'sp', text: vis })); }
    });
    flush();
    return node;
  }
  var RTL = new RegExp('[' + String.fromCharCode(0x590) + '-' + String.fromCharCode(0x8FF) + ']');
  function hexCode(cp) { var h = cp.toString(16).toUpperCase(); while (h.length < 4) h = '0' + h; return 'U+' + h; }

  /* ---------- tokenizers ---------- */
  function tokenize(text) {
    var out = [];
    if (state.mode === 'char') {
      Array.from(text).forEach(function (ch) { var cp = ch.codePointAt(0); out.push({ s: ch, id: cp, title: hexCode(cp) }); });
    } else if (state.mode === 'word') {
      var vocab = T.wordVocab(model(), 'en');
      T.words(text, 'en').forEach(function (w) { var id = vocab.get(w.text.toLowerCase()) || 0; out.push({ s: w.text, id: id, unk: !id }); });
    } else {
      var m = model();
      T.encode(m, N(), text).forEach(function (id) { var v = tokenView(m, id); out.push({ parts: v.parts, raw: v.raw, id: id }); });
    }
    return out;
  }

  /* ---------- rendering ---------- */
  function renderMode() {
    MODES.forEach(function (md) { $('#mode-' + md).setAttribute('aria-pressed', String(state.mode === md)); });
    $('#mode-note').textContent = t('mode_note_' + state.mode);
    $('#train-block').hidden = state.mode === 'char';
    $('#bpe-block').hidden = state.mode !== 'bpe';
    $('#stat-unk-wrap').hidden = state.mode !== 'word';
    $('#stats').classList.toggle('five', state.mode === 'word');
    $('#show-ids').checked = state.showIds;
  }

  function renderSrc() {
    var src = effSrc(), L = EDU.lang;
    $('#src-lang').textContent = t('src_lang', { lang: native(L) });
    $('#src-lang').hidden = $('#src-both').hidden = L === 'en';
    SRCS.forEach(function (s) { $('#src-' + s).setAttribute('aria-pressed', String(src === s)); });
    $('#own-wrap').hidden = src !== 'own';
    if (document.activeElement !== ownEl && ownEl.value !== state.own) ownEl.value = state.own;
    $('#own-empty').hidden = !(src === 'own' && !state.own.trim());
    var m = model();
    $('#corpus-info').textContent = t('corpus_info', { chars: fmt(m.chars), bytes: fmt(m.bytes), chunks: fmt(m.chunks) });
  }

  function renderMerges() {
    var m = model(), max = m.merges.length, n = N(), eff = Math.min(n, max);
    mergesEl.value = String(n);
    $('#merges-val').textContent = fmt(n);
    $('#vocab-size').textContent = t('vocab_size', { v: fmt(256 + eff), n: fmt(eff) });
    var early = $('#merges-early');
    early.hidden = !(n > max);
    if (n > max) early.textContent = t('merges_early', { n: fmt(max) });
    var list = $('#merge-list');
    list.textContent = '';
    $('#merge-empty').hidden = eff > 0;
    var frag = document.createDocumentFragment();
    for (var i = eff - 1; i >= 0; i--) {
      var mm = m.merges[i], a = tokenView(m, mm.a), b = tokenView(m, mm.b), c = tokenView(m, mm.id);
      var rtl = RTL.test(c.s);
      frag.appendChild(el('li', { class: i === eff - 1 ? 'newest' : null },
        el('span', { class: 'mn', text: '#' + (i + 1) }),
        el('span', { class: 'mg', dir: rtl ? 'rtl' : 'ltr' },
          fillParts(el('span', { class: 'mt' + (a.raw ? ' raw' : '') }), a.parts),
          el('span', { class: 'op', text: '+' }),
          fillParts(el('span', { class: 'mt' + (b.raw ? ' raw' : '') }), b.parts),
          el('span', { class: 'op', text: rtl ? String.fromCharCode(8592) : String.fromCharCode(8594) }),
          fillParts(el('span', { class: 'mt' + (c.raw ? ' raw' : '') }), c.parts)),
        el('span', { class: 'mc', text: '×' + fmt(mm.count) })));
    }
    list.appendChild(frag);
  }

  var lastIds = [];
  function renderTokens() {
    var text = inputText(), toks = tokenize(text);
    var chars = Array.from(text).length, bytes = T.utf8(text).length, unk = 0;
    var box = $('#chips');
    box.textContent = '';
    box.classList.toggle('no-ids', !state.showIds);
    if (!toks.length) box.appendChild(el('span', { class: 'muted small', text: t('empty_input') }));
    var frag = document.createDocumentFragment();
    toks.forEach(function (tk, i) {
      if (tk.unk) unk++;
      if (i >= CHIP_CAP) return;
      var chip = el('span', { class: 'tk ' + (tk.unk ? 'unk' : 'k' + (i % 6)) + (tk.raw ? ' raw' : ''), 'data-id': String(tk.id),
        title: tk.unk ? t('unk_title') : tk.title ? tk.title + ' · ' + t('tok_title', { i: fmt(i + 1), id: tk.id }) : t('tok_title', { i: fmt(i + 1), id: tk.id }) });
      chip.appendChild(tk.parts ? fillParts(el('span', { class: 'tx' }), tk.parts) : fillText(el('span', { class: 'tx' }), tk.s, false));
      chip.appendChild(el('span', { class: 'id', text: tk.unk ? '[UNK] 0' : String(tk.id) }));
      frag.appendChild(chip);
    });
    box.appendChild(frag);
    var more = $('#chips-more');
    more.hidden = toks.length <= CHIP_CAP;
    if (toks.length > CHIP_CAP) more.textContent = t('chips_more', { n: fmt(toks.length - CHIP_CAP), m: fmt(CHIP_CAP) });
    $('#chips-hint').textContent = t('hint_' + state.mode);
    $('#stat-tokens').textContent = fmt(toks.length);
    $('#stat-chars').textContent = fmt(chars);
    $('#stat-bytes').textContent = fmt(bytes);
    $('#stat-cpt').textContent = toks.length ? dec(chars / toks.length, 2) : '0';
    $('#stat-unk').textContent = fmt(unk);
    $('#mode-badge').textContent = state.mode === 'bpe' ? t('badge_bpe', { n: fmt(Math.min(N(), model().merges.length)) }) : t('mode_' + state.mode);
    lastIds = toks.map(function (x) { return x.id; });
    $('#ids-wrap').hidden = !state.showIds;
    var shown = lastIds.slice(0, IDS_CAP).join(', ');
    $('#ids-box').textContent = '[' + shown + (lastIds.length > IDS_CAP ? ', …' : '') + ']';
  }

  /* The chart always uses the slider value (300 by default), so it looks the same in every language. */
  function cmpN() { return state.merges === null ? DEFAULT_N : state.merges; }
  function renderCompare() {
    var n = cmpN(), en = getModel('en'), mu = getModel('all');
    var rows = LCODES.map(function (L) {
      var s = content(L).sentence;
      return { L: L, s: s, chars: Array.from(s).length, a: T.encode(en, n, s).length, b: T.encode(mu, n, s).length };
    });
    var base = rows[0], max = 1;
    rows.forEach(function (r) { max = Math.max(max, r.a, r.b); });
    $('#cmp-intro').textContent = t('cmp_intro', { n: fmt(n) });
    $('#cmp-en-m').textContent = t('cmp_m', { n: fmt(Math.min(n, en.merges.length)) });
    $('#cmp-mu-m').textContent = t('cmp_m', { n: fmt(Math.min(n, mu.merges.length)) });
    var wrap = $('#cmp-rows');
    wrap.textContent = '';
    rows.forEach(function (r) {
      var info = EDU.langInfo(r.L);
      function line(cls, v, ref) {
        return el('div', { class: 'bar-line' },
          el('span', { class: 'bar ' + cls, style: { inlineSize: (100 * v / max * 0.8).toFixed(1) + '%' } }),
          el('span', { class: 'bar-num', dir: 'ltr' }, fmt(v), ' ', el('span', { class: 'x', text: '×' + dec(v / ref, 1) })));
      }
      wrap.appendChild(el('div', { class: 'cmp-row' + (r.L === EDU.lang ? ' me' : ''), 'data-lang': r.L, 'data-en': String(r.a), 'data-multi': String(r.b) },
        el('div', { class: 'cmp-lang' },
          el('b', { text: info.native + (r.L === 'en' ? '' : ' · ' + info.name) }),
          el('span', { class: 'cmp-sent', lang: r.L, dir: info.dir, title: r.s, text: r.s })),
        el('div', { class: 'cmp-bars' }, line('en', r.a, base.a), line('mu', r.b, base.b))));
    });
    var focus = EDU.lang;
    if (focus === 'en') {
      var worst = rows[1];
      rows.forEach(function (r) { if (r.L !== 'en' && r.a / base.a > worst.a / base.a) worst = r; });
      focus = worst.L;
    }
    var f = rows.filter(function (r) { return r.L === focus; })[0];
    $('#cmp-summary').textContent = t('cmp_summary', { lang: EDU.lang === 'en' ? EDU.langInfo(focus).name : native(focus), x: dec(f.a / base.a, 1), y: dec(f.b / base.b, 1) });
    var budget = $('#cmp-budget');
    budget.hidden = !(n > 0 && base.b > base.a);
    if (!budget.hidden) budget.textContent = t('cmp_budget', { a: fmt(base.a), b: fmt(base.b), n: fmt(n) });
  }

  function renderCtx() {
    var sel = $('#ctx-size');
    sel.textContent = '';
    CTX_SIZES.forEach(function (n) { sel.appendChild(el('option', { value: String(n), text: t('ctx_tokens', { n: fmt(n) }) })); });
    sel.value = String(state.ctx);
    var text = inputText(), out = $('#ctx-out');
    var words = T.words(text, 'en').filter(function (w) { return w.word; }).length;
    var toks = T.encode(model(), N(), text).length;
    if (!words || !toks) { out.textContent = t('ctx_need'); return; }
    var fit = Math.floor(state.ctx * words / toks);
    // put the two results in bold without using HTML from translations
    var tpl = t('ctx_result', { w: fmt(state.ctx), tpw: dec(toks / words, 1) });
    out.textContent = '';
    out.setAttribute('data-fit', String(fit));
    tpl.split(/(\{words\}|\{pages\})/).forEach(function (p) {
      if (p === '{words}') out.appendChild(el('b', { text: fmt(fit) }));
      else if (p === '{pages}') out.appendChild(el('b', { text: dec(fit / WORDS_PER_PAGE, 1) }));
      else if (p) out.appendChild(document.createTextNode(p));
    });
  }

  function renderBytes() {
    var def = 'A' + (EDU.lang === 'en' ? C.en.letter : content(EDU.lang).letter) + '₹😊';
    var s = state.bytesDemo === null ? def : state.bytesDemo;
    if (document.activeElement !== byteEl && byteEl.value !== s) byteEl.value = s;
    var body = $('#byte-body'), chars = Array.from(s).slice(0, 24), total = 0;
    body.textContent = '';
    chars.forEach(function (ch) {
      var b = T.utf8(ch); total += b.length;
      body.appendChild(el('tr', {},
        el('td', {}, fillText(el('span', { class: 'ch' }), ch, false)),
        el('td', { class: 'mono', text: hexCode(ch.codePointAt(0)) }),
        el('td', { class: 'bytes-td' }, el('span', { dir: 'ltr' }, b.map(function (x) { return el('span', { class: 'bt', text: T.hex(x) }); })))));
    });
    $('#byte-total').textContent = t('byte_total', { c: fmt(chars.length), b: fmt(total) });
  }

  function grow() { inputEl.style.height = 'auto'; inputEl.style.height = Math.min(320, Math.max(110, inputEl.scrollHeight + 4)) + 'px'; }
  function renderInput() {
    var s = inputText();
    if (document.activeElement !== inputEl && inputEl.value !== s) inputEl.value = s;
    grow();
  }

  function renderPlay() { $('#play').textContent = playTimer ? t('stop') : t('play'); }

  function renderAll() {
    renderInput(); renderMode(); renderSrc(); renderMerges(); renderTokens(); renderCompare(); renderCtx(); renderBytes(); renderPlay();
  }

  /* ---------- play: watch the merge list grow ---------- */
  var playTimer = null;
  function stopPlay() { if (playTimer) { clearInterval(playTimer); playTimer = null; } renderPlay(); }
  function startPlay() {
    var target = Math.min(MAX, model().merges.length);
    if (!target) { EDU.toast(t('own_empty')); return; }
    state.merges = 0;
    onMerges();
    playTimer = setInterval(function () {
      var n = state.merges, step = n < 20 ? 1 : n < 100 ? 3 : 10;
      state.merges = Math.min(target, n + step);
      onMerges();
      if (state.merges >= target) stopPlay();
    }, 110);
    renderPlay();
  }
  function onMerges() {
    store.set('merges', state.merges);
    renderMerges(); renderTokens(); renderCompare(); renderCtx();
  }

  /* ---------- events ---------- */
  function debounce(fn, ms) { var h; return function () { clearTimeout(h); h = setTimeout(fn, ms); }; }
  var saveInput = debounce(function () { store.set('input', state.input); }, 300);
  var retrainOwn = debounce(function () { store.set('own', state.own); renderSrc(); renderMerges(); renderTokens(); renderCtx(); }, 250);

  inputEl.addEventListener('input', function () { state.input = inputEl.value; grow(); saveInput(); renderTokens(); renderCtx(); });
  function setInput(v) { state.input = v; store.set('input', v); inputEl.value = inputText(); grow(); renderTokens(); renderCtx(); }
  $('#ex-lang').addEventListener('click', function () { setInput(null); });
  $('#ex-en').addEventListener('click', function () { setInput(C.en.sentence); });
  $('#ex-mix').addEventListener('click', function () { setInput(content(EDU.lang).mix); });
  $('#clear-input').addEventListener('click', function () { setInput(''); inputEl.focus(); });

  MODES.forEach(function (md) {
    $('#mode-' + md).addEventListener('click', function () {
      if (md !== 'bpe') stopPlay();
      state.mode = md; store.set('mode', md);
      renderMode(); renderSrc(); renderMerges(); renderTokens(); renderCtx();
    });
  });
  SRCS.forEach(function (s) {
    $('#src-' + s).addEventListener('click', function () {
      stopPlay();
      state.src = s; store.set('src', s);
      renderSrc(); renderMerges(); renderTokens(); renderCtx();
      if (s === 'own' && !state.own.trim()) ownEl.focus();
    });
  });
  ownEl.addEventListener('input', function () { state.own = ownEl.value; retrainOwn(); });
  mergesEl.addEventListener('input', function () { stopPlay(); state.merges = EDU.clamp(parseInt(mergesEl.value, 10) || 0, 0, MAX); onMerges(); });
  $('#play').addEventListener('click', function () { if (playTimer) stopPlay(); else startPlay(); });
  $('#show-ids').addEventListener('change', function () { state.showIds = $('#show-ids').checked; store.set('showIds', state.showIds); renderTokens(); });
  $('#copy-ids').addEventListener('click', function () { EDU.copy('[' + lastIds.join(', ') + ']'); });
  $('#ctx-size').addEventListener('change', function () { state.ctx = parseInt($('#ctx-size').value, 10) || 8192; store.set('ctx', state.ctx); renderCtx(); });
  byteEl.addEventListener('input', function () { state.bytesDemo = byteEl.value; store.set('bytesDemo', state.bytesDemo); renderBytes(); });
  $('#print-btn').addEventListener('click', function () { window.print(); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen(); });
  $('#reset-btn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    stopPlay();
    ['mode', 'src', 'merges', 'own', 'input', 'showIds', 'ctx', 'bytesDemo'].forEach(function (k) { store.remove(k); });
    state.mode = 'bpe'; state.src = null; state.merges = null; state.own = ''; state.input = null;
    state.showIds = true; state.ctx = 8192; state.bytesDemo = null;
    inputEl.value = ''; ownEl.value = ''; byteEl.value = '';
    renderAll();
  });

  EDU.onLang(function () { stopPlay(); renderAll(); });
  renderAll();
})();
