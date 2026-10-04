/* Python Playground: run real Python (Pyodide / CPython 3.12 in WebAssembly) in the browser.
   Python runs on the main thread so that input() can use a normal prompt box. A loop guard
   (sys.monitoring) asks the student whether to stop programs that run too long. */
(function () {
  'use strict';
  var SLUG = 'python-playground';
  var PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/';
  var GUARD_SECS = 6;
  var MAX_OUT = 200000;          // characters kept in the output panel
  var MAX_FILE_KB = 300;
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  /* ------------------------------------------------------------ examples */
  function cleanCode(s) { return String(s || '').replace(/\r\n?/g, '\n').replace(/^\n+/, '').replace(/\s+$/, '') + '\n'; }
  var EXAMPLES = EDU.$$('script[type="text/x-python"][data-ex]').map(function (s) {
    return { id: s.getAttribute('data-ex'), group: s.getAttribute('data-group'), pkg: s.hasAttribute('data-pkg'), code: cleanCode(s.textContent) };
  });
  var GROUPS = [{ id: 'g11', key: 'grp_11' }, { id: 'g12cs', key: 'grp_12cs' }, { id: 'g12ip', key: 'grp_12ip' }];
  var BOOT = $('#pp-boot').textContent;
  function exById(id) { for (var i = 0; i < EXAMPLES.length; i++) if (EXAMPLES[i].id === id) return EXAMPLES[i]; return null; }

  /* ------------------------------------------------------------ state */
  var ed = $('#code'), sel = $('#exSel'), outEl = $('#out'), gutter = $('#gutter');
  var state = {
    ready: false, running: false, runs: 0, version: '', queued: false,
    phase: 'loading', busyKey: '', busyVars: null, lastErr: null, errMarked: false, info: null,
    exId: store.get('ex', 'hello'), fileName: '', guard: store.get('guard', true), fs: store.get('fs', 0)
  };
  window.PP_STATE = state;     // read by the interaction test

  var saved = store.get('code', null);
  if (typeof saved === 'string' && saved.length) ed.value = saved;
  else { state.exId = 'hello'; ed.value = exById('hello').code; }
  if (state.exId && !exById(state.exId)) state.exId = '';

  // A shared link (#py=...) brings code with it. The student's own earlier work is kept, and a
  // button under the editor brings it back (opening a link must never silently wipe homework).
  var prevCode = '';
  (function () {
    var m = /^#py=([A-Za-z0-9_-]+)$/.exec(location.hash || '');
    if (!m) return;
    var obj = EDU.unpack(m[1]);
    try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { }
    if (obj && typeof obj.c === 'string') {
      var old = ed.value;
      if (old.trim() && !isPristine(old) && old !== obj.c) prevCode = old;
      ed.value = obj.c; state.exId = obj.e && exById(obj.e) ? obj.e : '';
      saveCode(); store.set('ex', state.exId);
      if (!prevCode) setTimeout(function () { EDU.toast(t('loaded_link')); }, 400);
    }
  })();

  function isPristine(v) {
    if (typeof v !== 'string') v = ed.value;
    if (!v.trim()) return true;
    for (var i = 0; i < EXAMPLES.length; i++) if (EXAMPLES[i].code === v) return true;
    return false;
  }

  /* ------------------------------------------------------------ status bar */
  var statusBox = $('#ppStatus'), statusText = $('#ppStatusText'), statusBtn = $('#ppStatusBtn'), spin = $('#ppSpin'), elapsedEl = $('#ppElapsed');
  var loadT0 = 0, tickTimer = null, restarting = false;

  function setPhase(p) { state.phase = p; renderStatus(); }
  function setBusy(key, vars) { state.busyKey = key; state.busyVars = vars || null; renderStatus(); }

  function renderStatus() {
    var p = state.phase, cls = 'callout pp-status no-print', txt = '', btn = '', busy = false;
    if (state.busyKey && state.ready) { txt = t(state.busyKey, state.busyVars || undefined); busy = true; }
    else if (p === 'loading') { txt = t(restarting ? 'st_restart' : 'st_loading'); busy = true; if (loadT0 && Date.now() - loadT0 > 45000) txt += ' ' + t('st_slow'); }
    else if (p === 'ready') { txt = t('st_ready', { v: state.version }); cls += ' success'; }
    else if (p === 'failed') { txt = t('st_failed'); cls += ' danger'; btn = 'try_again'; }
    else if (p === 'savedata') { txt = t('st_savedata'); cls += ' warning'; btn = 'load_now'; }
    else if (p === 'crashed') { txt = t('st_crashed'); cls += ' danger'; btn = 'restart'; }
    // Only touch what changed: the box is an aria-live region and the timer ticks every second.
    if (statusBox.className !== cls) statusBox.className = cls;
    if (statusText.textContent !== txt) statusText.textContent = txt;
    spin.hidden = !busy;
    if (btn) { statusBtn.hidden = false; statusBtn.textContent = t(btn); statusBtn.dataset.act = btn; } else statusBtn.hidden = true;
    var el = (p === 'loading' && loadT0 && !state.busyKey) ? t('sec', { n: EDU.fmt(Math.round((Date.now() - loadT0) / 1000)) }) : '';
    if (elapsedEl.textContent !== el) elapsedEl.textContent = el;
  }
  statusBtn.addEventListener('click', function () {
    var act = statusBtn.dataset.act;
    if (act === 'restart') restart(); else boot();
  });

  /* ------------------------------------------------------------ output */
  var segs = [], outLen = 0, truncated = false, tail = '', figN = 0, outHasContent = false;
  function clearOut() {
    outEl.textContent = ''; segs = []; outLen = 0; errLen = 0; truncated = false; tail = ''; outHasContent = false;
    $('#outEmpty').hidden = false;
  }
  var errLen = 0;
  function addOut(kind, s) {
    if (!s) return;
    tail = (tail + s).slice(-800);
    if (truncated) {
      if (kind !== 'err' || errLen > 20000) return;      // keep showing the error message after a flood of print()
      errLen += s.length; segs.push({ kind: 'err', text: s }); return;
    }
    if (outLen + s.length > MAX_OUT) { s = s.slice(0, Math.max(0, MAX_OUT - outLen)); truncated = true; }
    outLen += s.length;
    var last = segs[segs.length - 1];
    if (last && last.kind === kind) last.text += s; else segs.push({ kind: kind, text: s });
    if (truncated) sysNote('out_trunc', '\n', '\n');
  }
  function flushOut() {
    if (!segs.length) return;
    var frag = document.createDocumentFragment();
    segs.forEach(function (sg) {
      if (sg.kind === 'img') { frag.appendChild(figureEl(sg.b64)); return; }
      if (sg.kind === 'sys') { frag.appendChild(EDU.el('span', { class: 's', text: sg.text, dataset: { k: sg.key, pre: sg.pre, post: sg.post } })); return; }
      var cls = sg.kind === 'err' ? 'e' : sg.kind === 'in' ? 'i' : '';
      frag.appendChild(cls ? EDU.el('span', { class: cls, text: sg.text }) : document.createTextNode(sg.text));
    });
    segs = [];
    outEl.appendChild(frag);
    outHasContent = true;
    $('#outEmpty').hidden = true;
    outEl.scrollTop = outEl.scrollHeight;
  }
  /* App notes inside the output (not printed by the program); they follow the language picker. */
  function sysNote(key, pre, post) { segs.push({ kind: 'sys', key: key, pre: pre || '', post: post || '', text: (pre || '') + t(key) + (post || '') }); }
  function renderSysNotes() {
    EDU.$$('.s[data-k]', outEl).forEach(function (n) { n.textContent = n.dataset.pre + t(n.dataset.k) + n.dataset.post; });
  }
  function figureEl(b64) {
    figN++;
    var n = figN, src = 'data:image/png;base64,' + b64;
    return EDU.el('span', { class: 'pp-fig' },
      EDU.el('img', { src: src, alt: t('chart_alt'), 'data-i18n-alt': 'chart_alt' }),
      EDU.el('button', {
        type: 'button', class: 'btn btn-sm', 'data-i18n': 'chart_dl', text: t('chart_dl'),
        onclick: function () { EDU.download('chart-' + n + '.png', b64ToBlob(b64)); }
      }));
  }
  function b64ToBlob(b64) {
    var bin = atob(b64), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: 'image/png' });
  }
  function outText() {
    var s = '';
    outEl.childNodes.forEach(function (n) { if (!(n.classList && n.classList.contains('pp-fig'))) s += n.textContent; });
    return s;
  }

  /* bridge used by the Python side (module "_pp") */
  var dialogMs = 0;
  var bridge = {
    write: function (kind, s) { addOut(String(kind), String(s)); },
    image: function (b64) { segs.push({ kind: 'img', b64: String(b64) }); tail = ''; },
    ask: function (p) {
      p = String(p == null ? '' : p);
      var before = tail.replace(/\n$/, '').split('\n').slice(-6).join('\n').trim();
      tail = '';
      var msg = t('ask_title') + (before ? '\n\n' + before : '') + (p ? '\n\n' + p : '');
      var w0 = performance.now(), r = window.prompt(msg, '');
      dialogMs += performance.now() - w0;          // typing time is not program time
      return r === null || r === undefined ? null : String(r);
    },
    stop_ask: function (n) {
      var w0 = performance.now(), ok = !!window.confirm(t('guard_q', { n: EDU.fmt(n) }));
      dialogMs += performance.now() - w0;
      return ok;
    }
  };

  /* ------------------------------------------------------------ Pyodide */
  var py = null, runner = null, mplReady = false, bootPromise = null, scriptPromise = null;

  function loadScriptOnce() {
    if (typeof window.loadPyodide === 'function') return Promise.resolve();
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = PYODIDE_URL + 'pyodide.js';
      s.async = true;
      s.onload = function () { if (typeof window.loadPyodide === 'function') resolve(); else { scriptPromise = null; reject(new Error('no loadPyodide')); } };
      s.onerror = function () { s.remove(); scriptPromise = null; reject(new Error('pyodide.js failed')); };
      document.head.appendChild(s);
    });
    return scriptPromise;
  }

  function startTick() { stopTick(); tickTimer = setInterval(renderStatus, 1000); }
  function stopTick() { if (tickTimer) clearInterval(tickTimer); tickTimer = null; }

  function boot() {
    if (bootPromise) return bootPromise;
    state.ready = false; state.busyKey = '';
    loadT0 = Date.now(); setPhase('loading'); startTick(); updateRunBtn();
    bootPromise = loadScriptOnce().then(function () {
      return window.loadPyodide({ indexURL: PYODIDE_URL, stdout: function () { }, stderr: function () { } });
    }).then(function (inst) {
      inst.registerJsModule('_pp', bridge);
      inst.runPython(BOOT);
      py = inst;
      runner = inst.globals.get('_pp_run');
      mplReady = false;
      state.version = String(inst.runPython('import sys; sys.version.split()[0]'));
      state.ready = true; restarting = false;
      setPhase('ready');
    }).catch(function (e) {
      py = null; runner = null; state.ready = false; state.queued = false;
      setPhase('failed');
      if (window.console && console.warn) console.warn('[python-playground] Pyodide failed to load:', e && e.message);
    }).then(function () {
      stopTick(); bootPromise = null; updateRunBtn(); renderStatus();
      if (state.ready && state.queued) { state.queued = false; run(); }
    });
    return bootPromise;
  }

  function restart() {
    if (bootPromise || state.running) return;
    try { if (runner) runner.destroy(); } catch (e) { }
    py = null; runner = null; mplReady = false; state.ready = false;
    restarting = true;
    clearOut(); hideHint(); setInfo(null);
    boot();
  }

  /* ------------------------------------------------------------ running */
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  var IMPORT_RE = /^[ \t]*(?:import|from)[ \t]+[A-Za-z_]/m;
  var PANDAS_PLOT_RE = /^[ \t]*(?:import[ \t]+pandas|from[ \t]+pandas[ \t.])/m;

  function ensurePackages(code) {
    if (!IMPORT_RE.test(code)) return Promise.resolve(true);
    var failed = false, names = '';
    // a background download (example just picked) holds Pyodide's package lock: show it
    if (preload && preload.inst === py && preload.names) { names = preload.names; setBusy('st_pkg', { pkgs: names }); }
    // df.plot() / s.hist() need matplotlib even when the program never imports it (Class 12 IP)
    var scan = code;
    if (PANDAS_PLOT_RE.test(code) && /\.(plot|hist|boxplot)\b/.test(code)) scan += '\nimport matplotlib\n';
    return py.loadPackagesFromImports(scan, {
      messageCallback: function (m) {
        var mm = /^Loading (.+)$/.exec(String(m));
        if (mm) { names = mm[1]; setBusy('st_pkg', { pkgs: names }); }
      },
      errorCallback: function () { failed = true; }
    }).then(function () { return !failed; }, function () { return false; }).then(function (ok) {
      if (!ok) { setInfo({ key: 'st_pkg_fail', vars: { pkgs: names || 'Python' }, cls: 'bad' }); return false; }
      if (py.loadedPackages && py.loadedPackages.matplotlib && !mplReady) {
        setBusy('st_mpl');
        return wait(40).then(function () { py.runPython('_pp_setup_mpl()'); mplReady = true; return true; });
      }
      return true;
    });
  }

  function run() {
    if (state.running) return;
    if (!state.ready || !py) {
      state.queued = true;
      EDU.toast(t('queued'));
      if (!bootPromise) boot();
      return;
    }
    var code = ed.value;
    // Save first: a program that freezes the tab must not cost the student their last edits.
    clearTimeout(saveTimer); saveTimer = null; saveCode();
    state.running = true; updateRunBtn();
    clearOut(); hideHint(); setInfo(null);
    state.lastErr = null; state.errMarked = false; renderGutter(true);
    var ms = 0;
    Promise.resolve().then(function () { return ensurePackages(code); }).then(function (ok) {
      if (!ok) return null;
      setBusy('st_running');
      return wait(40).then(function () {
        var t0 = performance.now();
        dialogMs = 0;
        var raw = runner(code, state.guard ? GUARD_SECS : 0);
        ms = Math.max(0, performance.now() - t0 - dialogMs);
        return JSON.parse(String(raw));
      });
    }).then(function (res) {
      flushOut();
      if (res) finish(res, ms);
    }).catch(function (e) {
      flushOut();
      addOut('err', '\n' + String((e && e.message) || e).slice(0, 2000) + '\n'); flushOut();
      var msg = String((e && e.message) || e);
      if (/fatal|memory access out of bounds|unreachable|Maximum call stack/i.test(msg)) { state.ready = false; py = null; runner = null; setPhase('crashed'); }
      setInfo({ key: 'done_err0', vars: { err: 'Error' }, cls: 'bad' });
    }).then(function () {
      state.running = false; state.busyKey = ''; state.runs++;
      updateRunBtn(); renderStatus();
      if (window.innerWidth < 920) {
        var r = $('#outCard').getBoundingClientRect();
        if (r.top > window.innerHeight * 0.6 || r.bottom < 0) $('#outCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function finish(res, ms) {
    if (res.ok) {
      if (!outHasContent) { sysNote('no_output', '', '\n'); flushOut(); }
      var sec = Math.max(ms, 1) / 1000;
      setInfo({ key: 'done_ok', vars: { s: EDU.fmt(sec, { maximumFractionDigits: sec < 0.1 ? 3 : 2 }) }, cls: 'ok' });
      return;
    }
    state.lastErr = res; state.errMarked = !!res.line;
    renderGutter(true);
    if (res.why) setInfo({ key: 'done_stopped', cls: 'bad' });
    else if (res.line) setInfo({ key: 'done_err', vars: { err: res.type, n: res.line }, cls: 'bad' });
    else setInfo({ key: 'done_err0', vars: { err: res.type }, cls: 'bad' });
    renderHint();
  }

  function setInfo(info) { state.info = info; renderInfo(); }
  function renderInfo() {
    var el = $('#runInfo'), info = state.info;
    if (!info) { el.textContent = ''; el.className = 'pp-info small'; return; }
    el.textContent = t(info.key, info.vars || undefined);
    el.className = 'pp-info small ' + (info.cls || '');
  }

  var HINT_ALIAS = { TabError: 'IndentationError', UnboundLocalError: 'NameError', ImportError: 'ModuleNotFoundError' };
  var HINT_NOLINE = { ModuleNotFoundError: 1, RecursionError: 1 };
  function hintText(err) {
    if (err.why === 'guard') return t('hint_stopped');
    if (err.why === 'cancel') return t('hint_cancelled');
    var ty = HINT_ALIAS[err.type] || err.type;
    if (HINT_NOLINE[ty]) return t('hint_' + ty);
    if (err.line && EDU.has('hint_' + ty)) return t('hint_' + ty, { n: err.line });
    return t('hint_generic');
  }
  function renderHint() {
    var err = state.lastErr, box = $('#hint'), go = $('#gotoBtn');
    if (!err) { box.hidden = true; return; }
    $('#hintText').textContent = hintText(err);
    if (err.line && !err.why) { go.hidden = false; go.textContent = t('goto_line', { n: err.line }); } else go.hidden = true;
    box.hidden = false;
  }
  function hideHint() { $('#hint').hidden = true; }
  $('#gotoBtn').addEventListener('click', function () { if (state.lastErr && state.lastErr.line) gotoLine(state.lastErr.line); });

  function updateRunBtn() {
    var b = $('#runBtn');
    b.disabled = state.running;
    b.setAttribute('aria-busy', state.running ? 'true' : 'false');
    $('#restartBtn').disabled = !!bootPromise || state.running;
  }

  /* ------------------------------------------------------------ editor */
  var saveTimer = null;
  function saveCode() { store.set('code', ed.value); }
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { saveTimer = null; saveCode(); }, 300); }
  function flushSave() { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; saveCode(); } }
  // reload / tab close / app switch within 300 ms of typing must not lose the last keys
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushSave(); });

  var lastLines = -1, lastMark = -1;
  function renderGutter(force) {
    var n = 1, v = ed.value;
    for (var i = 0; i < v.length; i++) if (v.charCodeAt(i) === 10) n++;
    var mark = state.errMarked && state.lastErr ? state.lastErr.line : 0;
    if (!force && n === lastLines && mark === lastMark) return syncGutter();
    var html = '';
    for (var k = 1; k <= n; k++) html += k === mark ? '<div class="pp-eline">' + k + '</div>' : '<div>' + k + '</div>';
    gutter.innerHTML = html;
    gutter.parentNode.style.setProperty('--pp-gw', String(Math.max(2, String(n).length)));
    lastLines = n; lastMark = mark;
    syncGutter();
  }
  function syncGutter() { gutter.style.transform = 'translateY(' + (-ed.scrollTop) + 'px)'; }

  function renderPos() {
    var p = ed.selectionStart || 0, v = ed.value.slice(0, p);
    var line = v.split('\n').length, col = p - v.lastIndexOf('\n');
    $('#ppPos').textContent = t('pos', { l: EDU.fmt(line), c: EDU.fmt(col) });
  }

  function lineBounds(v, a, b) {
    var s = v.lastIndexOf('\n', a - 1) + 1;
    var e = v.indexOf('\n', b > a && v[b - 1] === '\n' ? b - 1 : b);
    if (e < 0) e = v.length;
    return [s, e];
  }
  function insertText(txt) {
    ed.focus();
    var ok = false;
    try { ok = document.execCommand('insertText', false, txt); } catch (e) { ok = false; }
    if (!ok) {
      ed.setRangeText(txt, ed.selectionStart, ed.selectionEnd, 'end');
      ed.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  function replaceRange(s, e, txt, selS, selE) {
    ed.focus();
    ed.setSelectionRange(s, e);
    insertText(txt);
    if (selS !== undefined) ed.setSelectionRange(selS, selE);
  }
  function indentSel(dir) {
    var v = ed.value, a = ed.selectionStart, b = ed.selectionEnd;
    if (dir > 0 && a === b) { insertText('    '); return; }
    var lb = lineBounds(v, a, b), block = v.slice(lb[0], lb[1]);
    var lines = block.split('\n'), firstDelta = 0, total = 0;
    var out = lines.map(function (ln, i) {
      var d;
      if (dir > 0) { d = ln.length ? 4 : 0; ln = (ln.length ? '    ' : '') + ln; }
      else { var m = /^ {1,4}|^\t/.exec(ln); d = m ? -m[0].length : 0; ln = ln.slice(m ? m[0].length : 0); }
      if (i === 0) firstDelta = d; total += d;
      return ln;
    }).join('\n');
    if (out === block) return;
    var ns = a === b ? Math.max(lb[0], a + firstDelta) : Math.max(lb[0], a + firstDelta);
    var ne = a === b ? ns : b + total;
    replaceRange(lb[0], lb[1], out, ns, ne);
  }
  function toggleComment() {
    var v = ed.value, a = ed.selectionStart, b = ed.selectionEnd, lb = lineBounds(v, a, b);
    var lines = v.slice(lb[0], lb[1]).split('\n');
    var allC = lines.every(function (l) { return !l.trim() || /^\s*#/.test(l); });
    var out = lines.map(function (l) {
      if (!l.trim()) return l;
      return allC ? l.replace(/^(\s*)# ?/, '$1') : l.replace(/^(\s*)/, '$1# ');
    }).join('\n');
    replaceRange(lb[0], lb[1], out, lb[0], lb[0] + out.length);
  }

  var escFree = false;
  ed.addEventListener('keydown', function (e) {
    if (e.isComposing) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); return; }
    if (e.key === 'Escape') { escFree = true; return; }
    if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (escFree) { escFree = false; return; }        // let Tab move focus after Esc
      e.preventDefault(); indentSel(e.shiftKey ? -1 : 1); return;
    }
    escFree = false;
    if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.code === 'Slash')) { e.preventDefault(); toggleComment(); return; }
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var v = ed.value, p = ed.selectionStart;
      var ls = v.lastIndexOf('\n', p - 1) + 1, line = v.slice(ls, p);
      var indent = (/^[ \t]*/.exec(line) || [''])[0];
      var code = line.replace(/#.*$/, '').replace(/\s+$/, '');
      if (/:$/.test(code)) indent += '    ';
      else if (/^\s*(return|pass|break|continue|raise)\b/.test(line) && indent.length >= 4) indent = indent.slice(0, indent.length - 4);
      e.preventDefault();
      insertText('\n' + indent);
      return;
    }
    if (e.key === 'Backspace' && ed.selectionStart === ed.selectionEnd) {
      var v2 = ed.value, p2 = ed.selectionStart, ls2 = v2.lastIndexOf('\n', p2 - 1) + 1, before = v2.slice(ls2, p2);
      if (before.length && /^ +$/.test(before)) {
        var del = before.length % 4 || 4;
        e.preventDefault();
        ed.setSelectionRange(p2 - del, p2);
        var ok = false;
        try { ok = document.execCommand('delete'); } catch (er) { ok = false; }
        if (!ok) { ed.setRangeText('', p2 - del, p2, 'end'); ed.dispatchEvent(new Event('input', { bubbles: true })); }
      }
    }
  });
  ed.addEventListener('input', function () {
    if (state.errMarked) { state.errMarked = false; }
    renderGutter(); renderPos(); scheduleSave();
  });
  ed.addEventListener('scroll', syncGutter);
  ['keyup', 'click', 'select', 'focus'].forEach(function (ev) { ed.addEventListener(ev, renderPos); });

  function gotoLine(n) {
    var lines = ed.value.split('\n');
    n = EDU.clamp(n, 1, lines.length);
    var s = 0;
    for (var i = 0; i < n - 1; i++) s += lines[i].length + 1;
    ed.focus();
    ed.setSelectionRange(s, s + lines[n - 1].length);
    var lh = parseFloat(getComputedStyle(ed).lineHeight) || 22;
    ed.scrollTop = Math.max(0, (n - 4) * lh);
    syncGutter(); renderPos();
    var r = ed.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) ed.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // On-screen coding keys (phones, smartboards): keep focus in the editor.
  EDU.$$('#ppKeys button').forEach(function (b) {
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-key'), ins = b.getAttribute('data-ins');
      if (k === 'indent') { ed.focus(); indentSel(1); return; }
      if (k === 'dedent') { ed.focus(); indentSel(-1); return; }
      if (ins) {
        var a = ed.selectionStart, z = ed.selectionEnd;
        if (ins.length === 2 && ins !== '==') {
          var inner = ed.value.slice(a, z);
          insertText(ins[0] + inner + ins[1]);
          if (!inner) ed.setSelectionRange(a + 1, a + 1);
        } else insertText(ins);
      }
    });
  });

  function renderLinkNote() {
    var box = $('#linkNote');
    box.hidden = !prevCode;
    if (prevCode) { $('#linkNoteText').textContent = t('loaded_link'); $('#restoreBtn').textContent = t('restore_mine'); }
  }
  $('#restoreBtn').addEventListener('click', function () {
    if (!prevCode) return;
    ed.value = prevCode; prevCode = '';
    state.exId = ''; store.set('ex', ''); sel.value = ''; prevSel = ''; state.fileName = '';
    state.lastErr = null; state.errMarked = false;
    saveCode(); renderGutter(true); renderPos(); renderNote(); renderLinkNote();
    clearOut(); hideHint(); setInfo(null);
  });

  /* ------------------------------------------------------------ examples menu */
  function renderExamples() {
    sel.textContent = '';
    sel.appendChild(EDU.el('option', { value: '', text: t('ex_mine') }));
    GROUPS.forEach(function (g) {
      var og = EDU.el('optgroup', { label: t(g.key) });
      EXAMPLES.forEach(function (ex) { if (ex.group === g.id) og.appendChild(EDU.el('option', { value: ex.id, text: t('ex_' + ex.id) })); });
      sel.appendChild(og);
    });
    sel.value = state.exId || '';
  }
  function renderNote() {
    var note = $('#exNote'), ex = exById(state.exId);
    note.textContent = '';
    if (!ex) { note.hidden = true; return; }
    note.hidden = false;
    note.appendChild(EDU.el('span', { text: t('exn_' + ex.id) }));
    if (ex.pkg) note.appendChild(EDU.el('span', { class: 'badge accent no-print', text: t('ex_note_pkg') }));
  }
  function loadExample(id, keepOut) {
    var ex = exById(id);
    state.exId = ex ? id : '';
    store.set('ex', state.exId);
    if (ex) { ed.value = ex.code; state.fileName = ''; }
    if (prevCode) { prevCode = ''; renderLinkNote(); }
    ed.scrollTop = 0; ed.scrollLeft = 0;
    state.lastErr = null; state.errMarked = false;
    saveCode(); renderGutter(true); renderPos(); renderNote();
    if (!keepOut) { clearOut(); hideHint(); setInfo(null); }
    // fetch pandas / matplotlib in the background so Run is quicker
    if (ex && ex.pkg && state.ready && py && !state.running) preloadPackages(ex.code);
  }
  /* Background download for pandas / matplotlib examples. The status bar says what is being
     downloaded, so a slow school network does not look like a frozen Run button. */
  var preload = null;
  function preloadPackages(code) {
    var job = { inst: py, names: '' };
    preload = job;
    job.inst.loadPackagesFromImports(code, {
      messageCallback: function (m) {
        var mm = /^Loading (.+)$/.exec(String(m));
        if (!mm || py !== job.inst) return;
        job.names = mm[1];
        if (!state.running || state.busyKey === 'st_pkg') setBusy('st_pkg', { pkgs: job.names });
      },
      errorCallback: function () { }
    }).catch(function () { }).then(function () {
      if (preload === job) preload = null;
      if (!state.running && state.busyKey === 'st_pkg') setBusy('');
    });
  }
  var prevSel = state.exId || '';
  sel.addEventListener('change', function () {
    var id = sel.value;
    if (!id) { state.exId = ''; store.set('ex', ''); prevSel = ''; renderNote(); return; }
    if (!isPristine() && !window.confirm(t('confirm_replace'))) { sel.value = prevSel; return; }
    prevSel = id;
    loadExample(id);
  });

  /* ------------------------------------------------------------ buttons */
  $('#runBtn').addEventListener('click', run);
  $('#restartBtn').addEventListener('click', restart);
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen(); });
  $('#clearOutBtn').addEventListener('click', function () { clearOut(); hideHint(); setInfo(null); });
  $('#copyOutBtn').addEventListener('click', function () { EDU.copy(outText()); });
  $('#resetBtn').addEventListener('click', function () {
    if (!window.confirm(t('confirm_reset_code'))) return;
    var id = exById(state.exId) ? state.exId : 'hello';
    sel.value = id; prevSel = id;
    loadExample(id);
  });
  $('#dlBtn').addEventListener('click', function () {
    var name = state.fileName || (state.exId ? state.exId.replace(/[^a-z0-9_]/gi, '_') + '.py' : 'my_program.py');
    EDU.download(name, ed.value, 'text/x-python');
  });
  $('#openBtn').addEventListener('click', function () {
    EDU.pickFile('.py,.txt,.pyw,text/x-python,text/plain').then(function (f) {
      if (!f) return;
      if (f.size > MAX_FILE_KB * 1024) { EDU.toast(t('file_too_big', { n: MAX_FILE_KB })); return; }
      if (!isPristine() && !window.confirm(t('confirm_open'))) return;
      return EDU.readText(f).then(function (txt) {
        ed.value = String(txt).replace(/\r\n?/g, '\n').replace(/^﻿/, '');
        state.exId = ''; store.set('ex', ''); sel.value = ''; prevSel = '';
        state.fileName = /\.py$/i.test(f.name) ? f.name : f.name.replace(/\.[^.]*$/, '') + '.py';
        state.lastErr = null; state.errMarked = false;
        saveCode(); renderGutter(true); renderPos(); renderNote();
        clearOut(); hideHint(); setInfo(null);
        EDU.toast(t('file_opened', { name: f.name }));
      });
    }).catch(function () { EDU.toast(t('try_again')); });
  });
  $('#shareBtn').addEventListener('click', function () {
    var packed = EDU.pack({ c: ed.value, e: state.exId || '' });
    var base = location.href.split('#')[0];
    var url = base + '#py=' + packed;
    var input = EDU.el('input', { type: 'text', class: 'pp-share-url', readonly: true, value: url, 'aria-label': t('share_link') });
    var box = EDU.el('div', { class: 'stack' },
      EDU.el('p', { class: 'mb0', text: t('share_help') }),
      location.protocol === 'file:' ? EDU.el('p', { class: 'callout warning small mb0', text: t('share_file_note') }) : null,
      url.length > 6000 ? EDU.el('p', { class: 'callout warning small mb0', text: t('share_long') }) : null,
      input,
      EDU.el('div', { class: 'row' },
        EDU.el('button', { type: 'button', class: 'btn btn-primary', onclick: function () { EDU.copy(url); } }, EDU.el('span', { 'aria-hidden': 'true', text: '⧉ ' }), t('copy')),
        EDU.el('a', { class: 'btn', href: 'https://wa.me/?text=' + encodeURIComponent(t('app_title') + ': ' + url), target: '_blank', rel: 'noopener' }, t('whatsapp')),
        EDU.el('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { close(); } }, t('close'))));
    var close = EDU.modal(box, { title: t('share_title') });
    setTimeout(function () { try { input.focus(); input.select(); } catch (e) { } }, 50);
  });
  function fillPrint() {
    var lines = ed.value.replace(/\n$/, '').split('\n'), w = String(lines.length).length;
    $('#printCode').textContent = lines.map(function (l, i) { var n = String(i + 1); while (n.length < w) n = ' ' + n; return n + '  ' + l; }).join('\n');
  }
  $('#printBtn').addEventListener('click', function () { fillPrint(); window.print(); });
  window.addEventListener('beforeprint', fillPrint);

  function applyFs() {
    var app = $('#app');
    if (state.fs) app.style.setProperty('--pp-fs', state.fs + 'px'); else app.style.removeProperty('--pp-fs');
    renderGutter(true);
  }
  function currentFs() { return state.fs || parseFloat(getComputedStyle(ed).fontSize) || 15; }
  $('#fsUp').addEventListener('click', function () { state.fs = EDU.clamp(Math.round(currentFs()) + 2, 11, 32); store.set('fs', state.fs); applyFs(); });
  $('#fsDown').addEventListener('click', function () { state.fs = EDU.clamp(Math.round(currentFs()) - 2, 11, 32); store.set('fs', state.fs); applyFs(); });

  var guardChk = $('#guardChk');
  guardChk.checked = !!state.guard;
  guardChk.addEventListener('change', function () { state.guard = guardChk.checked; store.set('guard', state.guard); });

  /* ------------------------------------------------------------ language */
  function render() {
    renderExamples(); renderNote(); renderStatus(); renderInfo(); renderPos(); renderSysNotes(); renderLinkNote();
    if (state.lastErr) renderHint();
    $('#guardLbl').textContent = t('guard_label', { n: GUARD_SECS });
    EDU.$$('.pp-fig img').forEach(function (img) { img.alt = t('chart_alt'); });
  }
  EDU.onLang(render);
  render();
  applyFs();
  renderGutter(true);

  /* ------------------------------------------------------------ start */
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  function autoStart() { if (saveData) setPhase('savedata'); else boot(); }
  if (document.readyState === 'complete') setTimeout(autoStart, 50);
  else window.addEventListener('load', function () { setTimeout(autoStart, 50); });
  updateRunBtn();
})();
