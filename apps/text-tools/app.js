/* Text Tools: Clean & Compare. One big text box + tools in tabs (case, clean up, lines, find & replace,
   extract, top words) and a "compare two texts" checker. Every change can be undone. Heavy work (regex,
   comparing) runs in a Web Worker with a time limit, so a bad pattern or a huge text never freezes the page.
   Everything stays on this device (EDU.store). */
(function () {
  'use strict';
  var SLUG = 'text-tools';
  var store = EDU.store(SLUG);
  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var $ = EDU.$, $$ = EDU.$$, t = EDU.t, fmt = EDU.fmt, TT = window.TT;
  var C = function () { var A = window.APP_CONTENT || {}; return A[EDU.lang] || A.en; };
  var loc = function () { return EDU.langInfo(EDU.lang).tag; };
  var ta = $('#text');

  /* ---------------- saved state ---------------- */
  var DEF_OPTS = { small: true, caps: true, danda: false, tabsize: 4, dcase: true, sort: 'az', nstyle: 'dot', nstart: 1,
    prefix: '', suffix: '', word: '', wcase: false, delim: ', ', fcase: false, fwhole: false, fregex: false, find: '', repl: '',
    kind: 'emails', unique: true, fqTop: 50, fqSkip: true };
  function loadOpts() {
    var o = store.get('opts', {}), r = {};
    Object.keys(DEF_OPTS).forEach(function (k) { r[k] = o && typeof o[k] === typeof DEF_OPTS[k] ? o[k] : DEF_OPTS[k]; });
    return r;
  }
  var O = loadOpts();
  var savedText = store.get('text', null);
  var S = {
    isSample: typeof savedText !== 'string' || !!store.get('sample', false),
    text: '', undo: [], redo: [], tab: store.get('tab', 'case'),
    burst: null, saveOk: true, msgKey: null, msgVars: null, msgCls: ''
  };
  S.text = S.isSample ? C().sample : savedText;
  if (['case', 'clean', 'lines', 'find', 'extract', 'freq'].indexOf(S.tab) < 0) S.tab = 'case';
  ta.value = S.text;

  /* ---------------- undo / redo ---------------- */
  var MAX_STEPS = 60, MAX_CHARS = 30e6;
  function trimHistory(list) {
    var total = 0;
    for (var i = list.length - 1; i >= 0; i--) { total += list[i].text.length; if (total > MAX_CHARS || list.length - i > MAX_STEPS) { list.splice(0, i + 1); break; } }
  }
  function snapshot() { return { text: S.text, sample: S.isSample, sel: [ta.selectionStart, ta.selectionEnd] }; }
  function endBurst() { if (S.burst) { clearTimeout(S.burst); S.burst = null; } }
  /* a tool, Clear, Sample or Open changed the text: remember the old text so Undo can bring it back */
  function commit(text, opts) {
    opts = opts || {};
    endBurst();
    if (text === S.text && !opts.force) return false;
    S.undo.push(snapshot());
    trimHistory(S.undo);
    S.redo = [];
    setText(text, !!opts.sample);
    return true;
  }
  function setText(text, sample) {
    S.text = text; S.isSample = !!sample;
    if (ta.value !== text) ta.value = text;
    afterChange();
  }
  function restore(snap) {
    S.text = snap.text; S.isSample = !!snap.sample;
    ta.value = snap.text;
    try { ta.setSelectionRange(Math.min(snap.sel[0], snap.text.length), Math.min(snap.sel[1], snap.text.length)); } catch (e) { }
    afterChange();
  }
  function undo() {
    endBurst();
    if (!S.undo.length) { say('msg_no_undo', null, 'warn'); return; }
    S.redo.push(snapshot());
    restore(S.undo.pop());
    say('msg_undone', { n: fmt(S.undo.length) }, '');
  }
  function redo() {
    endBurst();
    if (!S.redo.length) { say('msg_no_redo', null, 'warn'); return; }
    S.undo.push(snapshot());
    restore(S.redo.pop());
    say('msg_redone', null, '');
  }
  function renderHistory() {
    $('#undo').disabled = !S.undo.length;
    $('#redo').disabled = !S.redo.length;
    $('#undo').dataset.steps = String(S.undo.length);
    $('#redo').dataset.steps = String(S.redo.length);
  }
  /* typing: one Undo step for each burst of typing (a pause of 1 second starts a new step) */
  ta.addEventListener('input', function () {
    if (!S.burst) {
      S.undo.push({ text: S.text, sample: S.isSample, sel: [ta.selectionStart, ta.selectionStart] });
      trimHistory(S.undo);
      S.redo = [];
    } else clearTimeout(S.burst);
    S.burst = setTimeout(function () { S.burst = null; }, 1000);
    S.text = ta.value; S.isSample = false;
    afterChange(true);
  });
  ta.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    var k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
  });
  $('#undo').addEventListener('click', undo);
  $('#redo').addEventListener('click', redo);

  /* ---------------- counts, saving, live panels ---------------- */
  var countTimer = null, saveTimer = null, liveTimer = null;
  function renderCounts() {
    var st = TT.stats(S.text, { locale: loc() }), c = $('#counts');
    $('#n-chars').textContent = fmt(st.chars);
    $('#n-words').textContent = fmt(st.words);
    $('#n-lines').textContent = fmt(st.lines);
    c.dataset.chars = String(st.chars); c.dataset.words = String(st.words); c.dataset.lines = String(st.lines);
  }
  function renderSave() {
    var el = $('#save-state');
    el.className = 'tt-save' + (S.saveOk ? '' : ' warn');
    el.textContent = !S.saveOk ? '⚠\uFE0F ' + t('st_not_saved') : S.isSample ? t('st_sample') : '💾 ' + t('st_saved');
  }
  function save() {
    clearTimeout(saveTimer); saveTimer = null;
    var ok = store.set('text', S.text) !== false;
    if (!ok) store.remove('text');
    store.set('sample', S.isSample);
    if (ok !== S.saveOk) { S.saveOk = ok; }
    renderSave();
  }
  function afterChange(typing) {
    renderHistory();
    clearTimeout(countTimer);
    if (typing && S.text.length > 30000) countTimer = setTimeout(renderCounts, 300); else renderCounts();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, typing ? 700 : 50);
    clearTimeout(liveTimer);
    liveTimer = setTimeout(renderLive, typing ? (S.text.length > 50000 ? 900 : 350) : 0);
    find.dirty = true;
  }
  window.addEventListener('pagehide', function () { if (saveTimer) save(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && saveTimer) save(); });

  /* ---------------- messages ---------------- */
  function say(key, vars, cls) {
    S.msgKey = key; S.msgVars = vars || null; S.msgCls = cls || '';
    renderMsg();
  }
  function renderMsg() {
    var m = $('#msg');
    m.className = 'tt-msg' + (S.msgCls ? ' ' + S.msgCls : '');
    m.textContent = S.msgKey ? (S.msgCls === 'ok' ? '✓ ' : S.msgCls === 'bad' ? '⚠\uFE0F ' : '') + t(S.msgKey, S.msgVars || undefined) : '';
    if (S.msgVars && S.msgVars.raw !== undefined) m.dataset.n = String(S.msgVars.raw); else delete m.dataset.n;
    m.dataset.key = S.msgKey || '';
  }

  /* ---------------- tabs ---------------- */
  var TABS = ['case', 'clean', 'lines', 'find', 'extract', 'freq'];
  function selectTab(id, focus) {
    S.tab = id; store.set('tab', id);
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.dataset.tab === id;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    TABS.forEach(function (x) { $('#p-' + x).hidden = x !== id; });
    renderLive();
  }
  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[role="tab"]');
    if (b) selectTab(b.dataset.tab, false);
  });
  $('#tabs').addEventListener('keydown', function (e) {
    var i = TABS.indexOf(S.tab), rtl = document.documentElement.dir === 'rtl';
    var d = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : e.key === 'ArrowDown' ? 3 : e.key === 'ArrowUp' ? -3 : 0;
    if (e.key === 'Home') { e.preventDefault(); selectTab(TABS[0], true); }
    else if (e.key === 'End') { e.preventDefault(); selectTab(TABS[TABS.length - 1], true); }
    else if (d) { e.preventDefault(); selectTab(TABS[(i + d + TABS.length * 3) % TABS.length], true); }
  });

  /* ---------------- options (inputs keep their values) ---------------- */
  var BIND = [['o-small', 'small'], ['o-caps', 'caps'], ['o-danda', 'danda'], ['o-dcase', 'dcase'], ['o-wcase', 'wcase'],
    ['f-case', 'fcase'], ['f-whole', 'fwhole'], ['f-regex', 'fregex'], ['ex-unique', 'unique'], ['fq-skip', 'fqSkip'],
    ['o-tabsize', 'tabsize'], ['o-sort', 'sort'], ['o-nstyle', 'nstyle'], ['o-nstart', 'nstart'], ['o-prefix', 'prefix'],
    ['o-suffix', 'suffix'], ['o-word', 'word'], ['o-delim', 'delim'], ['f-find', 'find'], ['f-repl', 'repl'], ['fq-top', 'fqTop']];
  function saveOpts() { store.set('opts', O); }
  function readInput(el, key) {
    if (el.type === 'checkbox') O[key] = el.checked;
    else if (typeof DEF_OPTS[key] === 'number') { var v = Number(el.value); O[key] = isFinite(v) && el.value.trim() !== '' ? v : DEF_OPTS[key]; }
    else O[key] = el.value;
  }
  function writeInputs() {
    BIND.forEach(function (b) {
      var el = $('#' + b[0]);
      if (el.type === 'checkbox') el.checked = !!O[b[1]];
      else el.value = String(O[b[1]]);
    });
  }
  BIND.forEach(function (b) {
    var el = $('#' + b[0]);
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () {
      readInput(el, b[1]); saveOpts();
      if (/^f-/.test(b[0])) { find.dirty = true; renderFindInfo(); }
      if (b[0] === 'o-sort') renderSortNote();
      if (b[0] === 'ex-unique' || b[0] === 'fq-skip' || b[0] === 'fq-top') renderLive();
    });
  });

  function buildSelects() {
    var sort = $('#o-sort'); sort.innerHTML = '';
    [['az', 'so_az'], ['za', 'so_za'], ['len', 'so_len'], ['lenr', 'so_lenr'], ['num', 'so_num'], ['numr', 'so_numr']].forEach(function (x) {
      sort.appendChild(EDU.el('option', { value: x[0], text: t(x[1]) }));
    });
    var ns = $('#o-nstyle'); ns.innerHTML = '';
    [['dot', '1.  2.  3.'], ['par', '1)  2)  3)'], ['br', '(1)  (2)  (3)'], ['dash', '1 -  2 -'], ['colon', '1:  2:  3:'], ['tab', null]].forEach(function (x) {
      ns.appendChild(EDU.el('option', { value: x[0], text: x[1] || t('ns_tab') }));
    });
    var top = $('#fq-top'); top.innerHTML = '';
    [20, 50, 100, 500].forEach(function (n) { top.appendChild(EDU.el('option', { value: String(n), text: t('fq_top_n', { n: fmt(n) }) })); });
    writeInputs();
  }
  function renderSortNote() {
    var name = EDU.langInfo(EDU.lang).native;
    $('#sort-note').textContent = t(/^num/.test(O.sort) ? 'so_note_num' : /^len/.test(O.sort) ? 'so_note_len' : 'so_note_az', { lang: name });
  }

  /* ---------------- running a tool ---------------- */
  var OPS = {
    quickClean: { msg: 'msg_quick' }, trimLines: { msg: 'msg_trim' }, collapseSpaces: { msg: 'msg_spaces' },
    removeEmptyLines: { msg: 'msg_empty' }, squeezeEmptyLines: { msg: 'msg_squeeze' }, joinBroken: { msg: 'msg_join' },
    removeBreaks: { msg: 'msg_breaks' }, stripHtml: { msg: 'msg_html' }, removeEmojis: { msg: 'msg_emoji' },
    removeNumbers: { msg: 'msg_numbers' }, removePunct: { msg: 'msg_punct', o: function () { return { keepDanda: O.danda }; } },
    curlyQuotes: { msg: 'msg_quotes' }, straightQuotes: { msg: 'msg_quotes' },
    tabsToSpaces: { msg: 'msg_tabs', o: function () { return O.tabsize; } }, spacesToTabs: { msg: 'msg_tabs2', o: function () { return O.tabsize; } },
    dedupe: { msg: 'msg_dedupe', o: function () { return { matchCase: O.dcase }; } },
    sortLines: { msg: 'msg_sort', o: function () { return { mode: O.sort === 'numr' ? 'num' : O.sort, desc: O.sort === 'numr', locale: loc() }; } },
    reverseLines: { msg: 'msg_reverse' }, shuffleLines: { msg: 'msg_shuffle', always: true },
    numberLines: { msg: 'msg_number', o: function () { return { style: O.nstyle, start: O.nstart }; } }, unnumberLines: { msg: 'msg_unnumber' },
    affixLines: { msg: 'msg_affix', need: 'affix', o: function () { return { prefix: O.prefix, suffix: O.suffix }; } },
    keepLines: { fn: 'filterLines', msg: 'msg_keep', need: 'word', o: function () { return { word: O.word, keep: true, matchCase: O.wcase }; } },
    dropLines: { fn: 'filterLines', msg: 'msg_drop', need: 'word', o: function () { return { word: O.word, keep: false, matchCase: O.wcase }; } },
    splitText: { msg: 'msg_split', need: 'delim', o: function () { return { delim: O.delim }; } },
    joinText: { msg: 'msg_joinw', o: function () { return { delim: O.delim }; } }
  };
  function runOp(name) {
    var def = OPS[name];
    if (!def) return;
    if (!S.text) { say('msg_empty_text', null, 'warn'); ta.focus(); return; }
    if (def.need === 'word' && !O.word) { say('msg_need_word', null, 'warn'); $('#o-word').focus(); return; }
    if (def.need === 'affix' && !O.prefix && !O.suffix) { say('msg_need_affix', null, 'warn'); $('#o-prefix').focus(); return; }
    if (def.need === 'delim' && !O.delim) { say('msg_need_delim', null, 'warn'); $('#o-delim').focus(); return; }
    var r;
    try { r = TT[def.fn || name](S.text, def.o ? def.o() : undefined); }
    catch (e) { say('msg_failed', null, 'bad'); return; }
    var changed = commit(r.text);
    if (!changed && !def.always) { say('msg_nothing', null, 'warn'); return; }
    say(def.msg, { n: fmt(r.n), raw: r.n, left: fmt(r.left !== undefined ? r.left : 0) }, 'ok');
  }
  $$('[data-op]').forEach(function (b) { b.addEventListener('click', function () { runOp(b.dataset.op); }); });

  $$('[data-case]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!S.text) { say('msg_empty_text', null, 'warn'); ta.focus(); return; }
      var r = TT[b.dataset.case](S.text, { small: O.small, keepCaps: O.caps });
      if (!commit(r.text)) { say(/[A-Za-z]/.test(S.text) ? 'msg_nothing' : 'msg_case_none', null, 'warn'); return; }
      say('msg_case', { n: fmt(r.n), raw: r.n }, 'ok');
    });
  });

  $$('#delims [data-delim]').forEach(function (b) {
    b.addEventListener('click', function () {
      O.delim = b.dataset.delim; $('#o-delim').value = O.delim; saveOpts();
      $$('#delims [data-delim]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });
  });
  function renderDelims() { $$('#delims [data-delim]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.delim === O.delim)); }); }
  $('#o-delim').addEventListener('input', renderDelims);

  /* ---------------- editor buttons ---------------- */
  $('#sample').addEventListener('click', function () {
    if (S.isSample && S.text === C().sample) { say('msg_sample', null, 'ok'); return; }
    commit(C().sample, { sample: true, force: true });
    say('msg_sample', null, 'ok');
  });
  $('#clear').addEventListener('click', function () {
    if (!S.text) { ta.focus(); return; }
    commit('');
    say('msg_cleared', null, 'ok');
    ta.focus();
  });
  $('#copy').addEventListener('click', function () {
    if (!S.text) { say('msg_empty_text', null, 'warn'); return; }
    EDU.copy(S.text);
  });
  function today() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  $('#download').addEventListener('click', function () {
    if (!S.text) { say('msg_empty_text', null, 'warn'); return; }
    EDU.download('text-' + today() + '.txt', '\uFEFF' + S.text.replace(/\r?\n/g, '\r\n'), 'text/plain');
  });
  var MAX_FILE = 25 * 1024 * 1024;
  function loadFile(f) {
    if (!f) return;
    if (f.size > MAX_FILE) { say('msg_file_big', { mb: fmt(25) }, 'bad'); return; }
    EDU.readText(f).then(function (txt) {
      txt = String(txt).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
      if (/\u0000/.test(txt.slice(0, 4000))) { say('msg_file_bad', null, 'bad'); return; }
      commit(txt, { force: true });
      say('msg_opened', { name: f.name, n: fmt(TT.stats(txt).lines) }, 'ok');
    }).catch(function () { say('msg_file_bad', null, 'bad'); });
  }
  $('#open').addEventListener('click', function () {
    EDU.pickFile('.txt,.csv,.tsv,.md,.html,.htm,.xml,.json,.srt,.vtt,.log,text/*').then(loadFile);
  });
  ta.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) e.preventDefault(); });
  ta.addEventListener('drop', function (e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) { e.preventDefault(); loadFile(f); }
  });
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['opts', 'tab', 'cmpA', 'cmpB', 'cmpSample', 'cmp'].forEach(function (k) { store.remove(k); });
    O = loadOpts(); writeInputs(); renderDelims(); renderSortNote();
    commit(C().sample, { sample: true, force: true });
    CM.reset();
    selectTab('case', false);
    say('msg_reset', null, 'ok');
  });

  /* print the text with Ctrl+P (the compare card has its own Print button) */
  window.addEventListener('beforeprint', function () { $('#print-text').textContent = S.text; });
  window.addEventListener('afterprint', function () { document.body.classList.remove('tt-pr-cmp'); });

  /* ---------------- background worker (regex + compare) with a watchdog ---------------- */
  var W = (function () {
    var worker = null, ok = true, seq = 0, jobs = {};
    function make() {
      if (!ok) return null;
      if (worker) return worker;
      try {
        var src = TT_FACTORY.toString() + '\nTT_FACTORY().serve(self);';
        var url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
        worker = new Worker(url);
        worker.onmessage = function (e) {
          var j = jobs[e.data && e.data.id];
          if (!j) return;
          delete jobs[e.data.id]; clearTimeout(j.timer);
          j.resolve(e.data.r);
        };
        worker.onerror = function (e) { if (e && e.preventDefault) e.preventDefault(); fail(); };
      } catch (e) { ok = false; worker = null; }
      return worker;
    }
    function fail() {
      ok = false;
      if (worker) { try { worker.terminate(); } catch (e) { } }
      worker = null;
      Object.keys(jobs).forEach(function (id) { var j = jobs[id]; delete jobs[id]; clearTimeout(j.timer); j.resolve(j.sync()); });
    }
    function kill() {
      if (worker) { try { worker.terminate(); } catch (e) { } }
      worker = null;
    }
    /* run TT[op](...args) in the worker; after `limit` ms the worker is stopped and {err:'slow'} comes back */
    function run(op, args, limit) {
      var sync = function () { try { return TT[op].apply(null, args); } catch (e) { return { err: 'fail' }; } };
      var w = make();
      if (!w) return Promise.resolve(sync());
      return new Promise(function (resolve) {
        var id = ++seq;
        jobs[id] = { resolve: resolve, sync: sync, timer: setTimeout(function () {
          if (!jobs[id]) return;
          delete jobs[id];
          kill();
          resolve({ err: 'slow' });
        }, limit || 4000) };
        try { w.postMessage({ id: id, op: op, args: args }); } catch (e) { delete jobs[id]; resolve(sync()); }
      });
    }
    return { run: run, get available() { return ok; } };
  })();

  /* ---------------- find & replace ---------------- */
  var find = { dirty: true, pos: [], n: 0, cur: -1, err: null, busy: false, token: 0 };
  function findOpts(guard) {
    return { find: O.find, repl: O.repl, matchCase: O.fcase, whole: O.fwhole, regex: O.fregex, guard: !!guard };
  }
  var REGEX_TEXT_MAX = 3e6, ERRS = { empty: 1, long: 1, bad: 1, risky: 1, slow: 1, long_text: 1 };
  function errKey(e) { return 'fr_err_' + (ERRS[e] ? e : 'fail'); }
  /* plain words are searched right here; regex patterns go to the worker so a bad one cannot hang the page */
  function search() {
    if (!find.dirty) return Promise.resolve(find);
    var my = ++find.token;
    if (!O.find) { find.dirty = false; find.n = 0; find.pos = []; find.err = null; return Promise.resolve(find); }
    if (O.fregex && S.text.length > REGEX_TEXT_MAX) { find.err = 'long_text'; find.n = 0; find.pos = []; find.dirty = false; return Promise.resolve(find); }
    var p = O.fregex ? W.run('findAll', [S.text, findOpts(!W.available)], 3000) : Promise.resolve(TT.findAll(S.text, findOpts(false)));
    find.busy = true;
    return p.then(function (r) {
      if (my !== find.token) return find;
      find.busy = false; find.dirty = false;
      find.err = r.err || null; find.msg = r.msg || '';
      find.n = r.n || 0; find.pos = r.pos || []; find.cur = -1;
      return find;
    });
  }
  function renderFindInfo() {
    var el = $('#f-info');
    var my = find.token + 1;
    search().then(function (f) {
      if (!$('#f-info')) return;
      el.className = 'tt-info' + (f.err ? ' bad' : '');
      el.dataset.n = String(f.err ? -1 : f.n);
      if (!O.find) el.textContent = t('fr_type');
      else if (f.err) el.textContent = '⚠\uFE0F ' + t('fr_err_' + f.err, { max: fmt(1000) }) + (f.err === 'bad' && f.msg ? ' (' + f.msg + ')' : '');
      else if (!f.n) el.textContent = t('fr_none');
      else el.textContent = (f.cur >= 0 ? t('fr_at', { i: fmt(f.cur + 1), n: fmt(f.n) }) : t('fr_count', { n: fmt(f.n) }));
      void my;
    });
  }
  /* select a match in the text box and scroll it into view (a hidden copy of the box measures where it is) */
  function showRange(s, e) {
    ta.focus();
    try { ta.setSelectionRange(s, e); } catch (x) { return; }
    try {
      var cs = getComputedStyle(ta), m = document.createElement('div');
      ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'wordSpacing', 'paddingTop', 'paddingLeft', 'paddingRight', 'direction', 'tabSize'].forEach(function (p) { m.style[p] = cs[p]; });
      m.style.cssText += ';position:fixed;top:-99999px;visibility:hidden;white-space:pre-wrap;overflow-wrap:break-word;box-sizing:border-box;border:0;width:' + ta.clientWidth + 'px';
      m.textContent = ta.value.slice(0, s) || '.';
      document.body.appendChild(m);
      var h = m.scrollHeight;
      m.remove();
      ta.scrollTop = Math.max(0, h - ta.clientHeight / 3);
    } catch (x) { }
  }
  function gotoMatch(next) {
    if (!S.text) { say('msg_empty_text', null, 'warn'); return; }
    if (!O.find) { say('msg_need_find', null, 'warn'); $('#f-find').focus(); return; }
    search().then(function (f) {
      if (f.err || !f.n) { renderFindInfo(); return; }
      var count = f.pos.length / 2, from = ta.selectionEnd || 0, i;
      if (next && f.cur >= 0) i = (f.cur + 1) % count;
      else { for (i = 0; i < count && f.pos[2 * i] < (next ? from : ta.selectionStart || 0); i++); if (i >= count) i = 0; }
      f.cur = i;
      showRange(f.pos[2 * i], f.pos[2 * i + 1]);
      renderFindInfo();
    });
  }
  $('#f-go').addEventListener('click', function () { find.cur = -1; gotoMatch(false); });
  $('#f-next').addEventListener('click', function () { gotoMatch(true); });
  $('#f-find').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); gotoMatch(find.cur >= 0); } });
  $('#f-repl').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); replaceAll(); } });
  function replaceAll() {
    if (!S.text) { say('msg_empty_text', null, 'warn'); return; }
    if (!O.find) { say('msg_need_find', null, 'warn'); $('#f-find').focus(); return; }
    if (O.fregex && S.text.length > REGEX_TEXT_MAX) { say('fr_err_long_text', null, 'bad'); return; }
    var before = S.text;
    var p = O.fregex ? W.run('replaceAll', [before, findOpts(!W.available)], 4000) : Promise.resolve(TT.replaceAll(before, findOpts(false)));
    $('#f-all').disabled = true;
    p.then(function (r) {
      $('#f-all').disabled = false;
      if (S.text !== before) return;                       // the text changed meanwhile: do nothing
      if (r.err) { say(errKey(r.err), { max: fmt(1000) }, 'bad'); return; }
      if (!r.n) { say('fr_none', null, 'warn'); return; }
      commit(r.text, { force: true });
      say('msg_replaced', { n: fmt(r.n), raw: r.n }, 'ok');
      renderFindInfo();
    });
  }
  $('#f-all').addEventListener('click', replaceAll);

  /* ---------------- extract ---------------- */
  var lastEx = { items: [] }, LIVE_MAX = 2000000;
  function renderExtract() {
    $$('#ex-kind [data-kind]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.kind === O.kind)); });
    var part = S.text.length > LIVE_MAX, r = TT.extract(part ? S.text.slice(0, LIVE_MAX) : S.text, { kind: O.kind, unique: O.unique });
    lastEx = r;
    var info = $('#ex-info'), name = t('ex_' + O.kind);
    info.dataset.n = String(r.n); info.dataset.total = String(r.total);
    if (!r.total) info.textContent = t('ex_none', { what: name });
    else if (O.unique && r.total > r.n) info.textContent = t('ex_found_dup', { n: fmt(r.n), what: name, total: fmt(r.total), d: fmt(r.total - r.n) });
    else info.textContent = t('ex_found', { n: fmt(r.n), what: name });
    if (O.kind === 'numbers' && r.n) info.textContent += ' · ' + t('ex_sum', { s: fmt(r.sum, { maximumFractionDigits: 6 }) });
    var out = $('#ex-out'), val = r.items.join('\n');
    if (out.value !== val) out.value = val;
    $('#ex-note').textContent = (part ? t('partial', { n: fmt(LIVE_MAX) }) + ' ' : '') + (O.kind === 'phones' ? t('ex_note_phones') : O.kind === 'numbers' ? t('ex_note_numbers') : '');
  }
  $$('#ex-kind [data-kind]').forEach(function (b) {
    b.addEventListener('click', function () { O.kind = b.dataset.kind; saveOpts(); renderExtract(); });
  });
  $('#ex-copy').addEventListener('click', function () {
    if (!lastEx.items.length) { say('msg_ex_empty', null, 'warn'); return; }
    EDU.copy(lastEx.items.join('\n'));
  });
  $('#ex-use').addEventListener('click', function () {
    if (!lastEx.items.length) { say('msg_ex_empty', null, 'warn'); return; }
    commit(lastEx.items.join('\n'), { force: true });
    say('msg_ex_used', { n: fmt(lastEx.items.length) }, 'ok');
  });

  /* ---------------- top words ---------------- */
  var lastFq = null;
  function renderFreq() {
    var part = S.text.length > LIVE_MAX, r = TT.freq(part ? S.text.slice(0, LIVE_MAX) : S.text, { locale: loc(), skipStop: O.fqSkip, top: O.fqTop });
    lastFq = r;
    var body = $('#fq-body');
    body.innerHTML = '';
    $('#fq-info').textContent = (r.total ? t('fq_info', { total: fmt(r.total), unique: fmt(r.unique) }) : t('fq_empty')) + (part ? ' ' + t('partial', { n: fmt(LIVE_MAX) }) : '');
    $('#fq-info').dataset.total = String(r.total);
    var max = r.rows.length ? r.rows[0][1] : 1;
    r.rows.forEach(function (row, i) {
      var pct = r.total ? row[1] / r.total * 100 : 0;
      body.appendChild(EDU.el('tr', { 'data-word': row[0], 'data-count': String(row[1]) },
        EDU.el('td', { class: 'n', text: fmt(i + 1) }),
        EDU.el('td', { class: 'w no-i18n', dir: 'auto', text: row[0] }),
        EDU.el('td', { class: 'n', text: fmt(row[1]) }),
        EDU.el('td', { class: 'bar' }, EDU.el('span', { style: { width: Math.max(2, row[1] / max * 100).toFixed(1) + '%' } }),
          EDU.el('span', { class: 'pct', text: fmt(pct, { maximumFractionDigits: 1 }) + '%' }))));
    });
    $('#fq-wrap').hidden = !r.rows.length;
  }
  $('#fq-csv').addEventListener('click', function () {
    if (!S.text) { say('msg_empty_text', null, 'warn'); return; }
    var all = TT.freq(S.text, { locale: loc(), skipStop: O.fqSkip, top: 100000 });
    var rows = [[t('fq_word'), t('fq_count')]].concat(all.rows.map(function (r) { return [r[0], r[1]]; }));
    EDU.download('top-words-' + today() + '.csv', EDU.csv.stringify(rows), 'text/csv');
  });

  /* the visible tab's live panel follows the text */
  function renderLive() {
    if (S.tab === 'extract') renderExtract();
    else if (S.tab === 'freq') renderFreq();
    else if (S.tab === 'find') renderFindInfo();
  }

  /* ---------------- compare two texts ---------------- */
  var CM = (function () {
    var esc = EDU.esc, A = $('#cmp-a'), B = $('#cmp-b'), CTX = 3, STEP = 1500;
    var P, isSample, res = null, linesA = [], linesB = [], expanded = {}, cap = STEP, token = 0, timer = null, saveTimer2 = null;
    function defaults() {
      var st = store.get('cmp', null) || {};
      return { by: ['line', 'word', 'letter'].indexOf(st.by) >= 0 ? st.by : 'word',
        view: st.view === 'inline' || st.view === 'side' ? st.view : (window.innerWidth < 700 ? 'inline' : 'side'),
        icase: !!st.icase, space: !!st.space };
    }
    function saveP() { store.set('cmp', P); }
    function saveTexts() {
      clearTimeout(saveTimer2); saveTimer2 = null;
      store.set('cmpSample', isSample);
      if (isSample) { store.remove('cmpA'); store.remove('cmpB'); return; }
      if (store.set('cmpA', A.value) === false || store.set('cmpB', B.value) === false) { store.remove('cmpA'); store.remove('cmpB'); }
    }
    function loadTexts() {
      if (isSample) { A.value = C().cmpA; B.value = C().cmpB; }
      else { A.value = String(store.get('cmpA', '') || ''); B.value = String(store.get('cmpB', '') || ''); }
    }
    function renderControls() {
      $$('#cmp-by [data-by]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.by === P.by)); });
      $$('#cmp-view [data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === P.view)); });
      $('#cmp-icase').checked = P.icase; $('#cmp-space').checked = P.space;
    }
    function split(s) { s = String(s).replace(/\r\n?/g, '\n').replace(/\n$/, ''); return s === '' ? [] : s.split('\n'); }

    function run() {
      clearTimeout(timer); timer = null;
      var a = A.value, b = B.value, my = ++token;
      if (!a.trim() && !b.trim()) { res = null; renderState('empty'); return Promise.resolve(); }
      var slow = setTimeout(function () { if (my === token) renderState('busy'); }, 150);
      $('#cmp-go').disabled = true;
      return W.run('diff', [a, b, { by: P.by, icase: P.icase, space: P.space, locale: loc(), ms: 3500 }], 9000).then(function (r) {
        clearTimeout(slow);
        if (my !== token) return;
        $('#cmp-go').disabled = false;
        if (!r || r.err) { res = null; renderState(r && r.err === 'big' ? 'big' : 'slow', r); return; }
        res = r; linesA = split(a); linesB = split(b); expanded = {}; cap = STEP;
        render();
      });
    }
    function schedule() {
      clearTimeout(timer);
      if (A.value.length + B.value.length > 300000) { token++; res = null; renderState('stale'); return; }
      timer = setTimeout(run, 600);
    }

    /* ---- summary ---- */
    function tile(cls, num, key) {
      return '<div class="tt-tile ' + cls + '"><b>' + esc(num) + '</b><span>' + esc(t(key)) + '</span></div>';
    }
    function renderState(state, r) {
      var box = $('#cmp-sum');
      box.dataset.state = state;
      ['add', 'del', 'same', 'ladd', 'ldel'].forEach(function (k) { delete box.dataset[k]; });
      var key = { empty: 'cmp_empty', busy: 'cmp_busy', big: 'cmp_err_big', slow: 'cmp_err_slow', stale: 'cmp_stale' }[state];
      box.innerHTML = '<p class="callout' + (state === 'big' || state === 'slow' ? ' warning' : '') + ' small">' + esc(t(key, { n: fmt(r && r.max || 50000) })) + '</p>';
      $('#cmp-out').innerHTML = '';
      $('#cmp-legend').hidden = true;
    }
    function render() {
      var s = res.sum, box = $('#cmp-sum'), by = s.by, changed = 0;
      res.blocks.forEach(function (b) { if (b.t === 'ch') changed += Math.max(b.an, b.bn); });
      var add = by === 'line' ? s.add : s.uadd, del = by === 'line' ? s.del : s.udel, same = !s.add && !s.del;
      box.dataset.state = same ? 'same' : 'diff';
      box.dataset.add = String(add); box.dataset.del = String(del); box.dataset.same = String(s.same);
      box.dataset.ladd = String(s.add); box.dataset.ldel = String(s.del); box.dataset.changed = String(changed);
      var html = '';
      if (same) html = '<p class="callout success small">✓ ' + esc(t(P.icase || P.space ? 'cmp_same_ign' : 'cmp_same')) + '</p>';
      else {
        html = tile('add', '+' + fmt(add), 'sum_add_' + by) + tile('del', '−' + fmt(del), 'sum_del_' + by) +
          (by === 'line' ? tile('', fmt(s.same), 'sum_same') : tile('', fmt(changed), 'sum_changed'));
        if (s.approx) html += '<p class="callout warning small">' + esc(t('cmp_approx')) + '</p>';
        else if (s.skipped) html += '<p class="callout warning small">' + esc(t('cmp_skipped')) + '</p>';
      }
      box.innerHTML = html;
      $('#cmp-legend').hidden = same;
      renderRows();
    }

    /* ---- rows ---- */
    var NL_DEL = '<del class="nl" aria-hidden="true">↵</del>', NL_INS = '<ins class="nl" aria-hidden="true">↵</ins>';
    /* one side (-1 old, 1 new) of a word/letter change as html lines */
    function sideLines(ops, side) {
      var lines = [''];
      ops.forEach(function (o) {
        if (o[0] !== 0 && o[0] !== side) return;
        var parts = (o[0] === 0 && side < 0 && o.length > 2 ? o[2] : o[1]).split('\n');
        parts.forEach(function (p, i) {
          if (i > 0) { if (o[0] !== 0) lines[lines.length - 1] += side < 0 ? NL_DEL : NL_INS; lines.push(''); }
          if (p) lines[lines.length - 1] += o[0] === 0 ? esc(p) : (side < 0 ? '<del>' : '<ins>') + esc(p) + (side < 0 ? '</del>' : '</ins>');
        });
      });
      return lines;
    }
    /* old and new in one stream (track-changes style); rows follow the new text's lines */
    function mergedLines(ops, a0, b0) {
      var rows = [{ a: a0, b: b0, h: '', d: 0, i: 0, e: 0 }], cur = rows[0], la = a0, lb = b0;
      ops.forEach(function (o) {
        var parts = o[1].split('\n');
        parts.forEach(function (p, k) {
          if (k > 0) {
            if (o[0] === -1) { la++; cur.h += NL_DEL; cur.d = 1; }
            else {
              if (o[0] === 1) { cur.h += NL_INS; cur.i = 1; } else { la++; cur.e = 1; }
              lb++;
              cur = { a: la, b: lb, h: '', d: 0, i: 0, e: 0 }; rows.push(cur);
            }
          }
          if (!p) return;
          if (o[0] === 0) { cur.h += esc(p); cur.e = 1; }
          else if (o[0] === -1) { cur.h += '<del>' + esc(p) + '</del>'; cur.d = 1; }
          else { cur.h += '<ins>' + esc(p) + '</ins>'; cur.i = 1; }
        });
      });
      return rows;
    }
    function rowSide(la, lb, ha, hb, ca, cb) {
      return '<tr><td class="ln">' + (la ? la : '') + '</td><td class="mk ' + ca + '">' + (ca === 'd' ? '−' : '') + '</td><td class="tx ' + ca + '">' + ha + '</td>' +
        '<td class="ln">' + (lb ? lb : '') + '</td><td class="mk ' + cb + '">' + (cb === 'a' ? '+' : '') + '</td><td class="tx ' + cb + '">' + hb + '</td></tr>';
    }
    function rowInline(la, lb, mk, cls, h) {
      return '<tr><td class="ln">' + (la ? la : '') + '</td><td class="ln">' + (lb ? lb : '') + '</td><td class="mk ' + cls + '">' + mk + '</td><td class="tx ' + cls + '">' + h + '</td></tr>';
    }
    function renderRows() {
      var out = $('#cmp-out'), side = P.view === 'side', html = [], count = 0, more = false, blocks = res.blocks;
      if (!res.sum.add && !res.sum.del) { out.innerHTML = ''; return; }
      var cols = side ? 6 : 4;
      function add(row) { if (more) return false; html.push(row); if (++count >= cap) more = true; return !more; }
      function eqRow(i, j) { return add(side ? rowSide(i + 1, j + 1, esc(linesA[i]), esc(linesB[j]), '', '') : rowInline(i + 1, j + 1, '', '', esc(linesB[j]))); }
      for (var bi = 0; bi < blocks.length && !more; bi++) {
        var b = blocks[bi], k;
        if (b.t === 'eq') {
          var first = bi === 0, last = bi === blocks.length - 1, n = b.n, show;
          if (expanded[bi] || n <= (first || last ? CTX : 2 * CTX) + 1) show = [[0, n]];
          else if (first) show = [null, [n - CTX, n]];
          else if (last) show = [[0, CTX], null];
          else show = [[0, CTX], null, [n - CTX, n]];
          for (var si = 0; si < show.length && !more; si++) {
            var rg = show[si];
            if (!rg) {
              var hidden = n - (first || last ? CTX : 2 * CTX);
              html.push('<tr class="fold"><td colspan="' + cols + '"><button type="button" class="tt-fold" data-fold="' + bi + '">⋯ ' + esc(t('cmp_fold', { n: fmt(hidden) })) + '</button></td></tr>');
              continue;
            }
            for (k = rg[0]; k < rg[1] && eqRow(b.a + k, b.b + k); k++);
          }
        } else if (!b.ops) {
          /* whole lines (line mode, lines only added or removed, or a block too long to compare word by word) */
          if (side) {
            for (k = 0; k < Math.max(b.an, b.bn); k++) {
              if (!add(rowSide(k < b.an ? b.a + k + 1 : 0, k < b.bn ? b.b + k + 1 : 0, k < b.an ? esc(linesA[b.a + k]) : '', k < b.bn ? esc(linesB[b.b + k]) : '',
                k < b.an ? 'd' : 'x', k < b.bn ? 'a' : 'x'))) break;
            }
          } else {
            for (k = 0; k < b.an && add(rowInline(b.a + k + 1, 0, '−', 'd', esc(linesA[b.a + k]))); k++);
            for (k = 0; k < b.bn && add(rowInline(0, b.b + k + 1, '+', 'a', esc(linesB[b.b + k]))); k++);
          }
        } else if (side) {
          var L = sideLines(b.ops, -1), R = sideLines(b.ops, 1);
          for (k = 0; k < Math.max(L.length, R.length); k++) {
            var hasL = k < L.length, hasR = k < R.length;
            var ca = !hasL ? 'x' : /<del/.test(L[k]) ? 'd' : '', cb = !hasR ? 'x' : /<ins/.test(R[k]) ? 'a' : '';
            if (!add(rowSide(hasL ? b.a + k + 1 : 0, hasR ? b.b + k + 1 : 0, hasL ? L[k] : '', hasR ? R[k] : '', ca, cb))) break;
          }
        } else {
          var M = mergedLines(b.ops, b.a + 1, b.b + 1);
          for (k = 0; k < M.length; k++) {
            var m = M[k], mk = m.d && m.i ? '±' : m.d ? '−' : m.i ? '+' : '', cls = m.d && m.i ? 'm' : m.d ? 'd' : m.i ? 'a' : '';
            if (!add(rowInline(m.e || m.d ? m.a : 0, m.e || m.i ? m.b : 0, mk, cls, m.h))) break;
          }
        }
      }
      if (more) html.push('<tr class="fold"><td colspan="' + cols + '"><button type="button" class="tt-fold" data-more="1">' + esc(t('cmp_more')) + '</button></td></tr>');
      var colg = side ? '<colgroup><col class="c-ln"><col class="c-mk"><col><col class="c-ln"><col class="c-mk"><col></colgroup>' :
        '<colgroup><col class="c-ln"><col class="c-ln"><col class="c-mk"><col></colgroup>';
      out.innerHTML = '<table class="tt-dt ' + (side ? 'side' : 'inline') + '">' + colg + '<tbody>' + html.join('') + '</tbody></table>';
    }
    $('#cmp-out').addEventListener('click', function (e) {
      var f = e.target.closest('.tt-fold');
      if (!f || !res) return;
      if (f.dataset.more) cap += STEP; else expanded[f.dataset.fold] = true;
      renderRows();
    });

    /* ---- text for Copy: "- old" / "+ new" lines, or [-old-]{+new+} inside lines ---- */
    function resultText() {
      var out = [];
      res.blocks.forEach(function (b) {
        var k;
        if (b.t === 'eq') { for (k = 0; k < b.n; k++) out.push('  ' + linesB[b.b + k]); return; }
        if (!b.ops) {
          for (k = 0; k < b.an; k++) out.push('- ' + linesA[b.a + k]);
          for (k = 0; k < b.bn; k++) out.push('+ ' + linesB[b.b + k]);
          return;
        }
        var line = '';
        b.ops.forEach(function (o) {
          var parts = o[1].split('\n');
          parts.forEach(function (p, i) {
            if (i > 0) {
              if (o[0] === -1) { line += '[-↵-]'; return void (p && (line += '[-' + p + '-]')); }
              if (o[0] === 1) line += '{+↵+}';
              out.push('~ ' + line); line = '';
            }
            if (p) line += o[0] === 0 ? p : o[0] === -1 ? '[-' + p + '-]' : '{+' + p + '+}';
          });
        });
        out.push('~ ' + line);
      });
      return out.join('\n');
    }

    /* ---- controls ---- */
    $('#cmp-by').addEventListener('click', function (e) {
      var b = e.target.closest('[data-by]'); if (!b) return;
      P.by = b.dataset.by; saveP(); renderControls(); run();
    });
    $('#cmp-view').addEventListener('click', function (e) {
      var b = e.target.closest('[data-view]'); if (!b) return;
      P.view = b.dataset.view; saveP(); renderControls();
      if (res) renderRows();
    });
    $('#cmp-icase').addEventListener('change', function () { P.icase = this.checked; saveP(); run(); });
    $('#cmp-space').addEventListener('change', function () { P.space = this.checked; saveP(); run(); });
    [A, B].forEach(function (el) {
      el.addEventListener('input', function () {
        isSample = false;
        clearTimeout(saveTimer2); saveTimer2 = setTimeout(saveTexts, 700);
        schedule();
      });
    });
    $('#cmp-go').addEventListener('click', function () { run(); });
    $('#cmp-swap').addEventListener('click', function () {
      var x = A.value; A.value = B.value; B.value = x;
      isSample = false; saveTexts(); run();
    });
    $('#cmp-sample').addEventListener('click', function () { isSample = true; loadTexts(); saveTexts(); run(); });
    function useMain(el) {
      if (!S.text) { EDU.toast(t('msg_empty_text')); return; }
      el.value = S.text; isSample = false; saveTexts(); run();
    }
    $('#cmp-a-main').addEventListener('click', function () { useMain(A); });
    $('#cmp-b-main').addEventListener('click', function () { useMain(B); });
    $('#cmp-copy').addEventListener('click', function () {
      if (!res) { EDU.toast(t('cmp_nothing')); return; }
      EDU.copy(resultText());
    });
    $('#cmp-print').addEventListener('click', function () {
      if (!res) { EDU.toast(t('cmp_nothing')); return; }
      var all = cap; cap = 1e9; renderRows();
      document.body.classList.add('tt-pr-cmp');
      window.print();
      cap = all;
      setTimeout(function () { document.body.classList.remove('tt-pr-cmp'); renderRows(); }, 800);
    });
    window.addEventListener('pagehide', function () { if (saveTimer2) saveTexts(); });

    return {
      init: function () { P = defaults(); isSample = store.get('cmpSample', true) !== false; loadTexts(); renderControls(); return run(); },
      reset: function () { store.remove('cmp'); P = defaults(); isSample = true; loadTexts(); saveTexts(); renderControls(); run(); },
      onLang: function () {
        if (isSample) { loadTexts(); run(); }
        else if (res) render();
        else if ($('#cmp-sum').dataset.state && $('#cmp-sum').dataset.state !== 'idle') renderState($('#cmp-sum').dataset.state);
      },
      run: run
    };
  })();

  /* ---------------- language ---------------- */
  EDU.onLang(function () {
    if (S.isSample) {
      S.text = C().sample; ta.value = S.text;
      store.set('text', S.text); store.set('sample', true);
    }
    buildSelects(); renderDelims(); renderSortNote(); renderMsg(); renderSave(); renderCounts(); renderHistory();
    find.dirty = true; renderLive();
    CM.onLang();
  });

  /* ---------------- start ---------------- */
  buildSelects();
  renderDelims();
  renderSortNote();
  selectTab(S.tab, false);
  afterChange();
  CM.init();
  window.TT_APP = { state: S, opts: O, compare: CM };
})();
