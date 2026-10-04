/* Web Page Maker (html-playground)
   HTML / CSS / JS editors + live preview in a sandboxed iframe (srcdoc) + console.
   - The page is built from the three tabs: <link href="style.css"> and <script src="script.js">
     are replaced by the CSS / JS tabs (or added automatically if missing).
   - A small "prelude" script inside the preview sends console.log, errors, form data and clicked
     links back with postMessage, and a loop guard stops loops that run for too long.
   - Errors and HTML tag checks point at the line in the right tab. */
(function () {
  'use strict';
  var SLUG = 'html-playground';
  var store = EDU.store(SLUG);
  var D = window.HP_DATA;
  var FILES = ['html', 'css', 'js'];
  var LABEL = { html: 'HTML', css: 'CSS', js: 'JS' };
  var FNAME = { html: 'index.html', css: 'style.css', js: 'script.js' };
  var LOOP_LIMIT_MS = 2000;
  var MAX_ENTRIES = 300;
  var VOID = 'area base br col embed hr img input link meta param source track wbr'.split(' ');
  var t = function (k, v) { return EDU.t(k, v); };
  var $ = EDU.$, $$ = EDU.$$;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  /* ------------------------------------------------------------ state */
  var prefs = Object.assign({ auto: true, close: true, wrap: null, fs: 15, phone: false, view: 'html' }, store.get('prefs', {}) || {});
  if (typeof prefs.wrap !== 'boolean') prefs.wrap = window.innerWidth < 700;
  prefs.fs = EDU.clamp(Number(prefs.fs) || 15, 11, 28);
  var S = { html: '', css: '', js: '', name: '', tpl: null, pristine: false, pid: null, sy: 0, caret: {} };
  var work = $('#hpWork'), frame = $('#hpFrame'), conList = $('#hpConList'), nameInput = $('#hpName');
  var ed = {};
  FILES.forEach(function (f) {
    var box = $('#hpEd-' + f);
    ed[f] = { box: box, ta: $('textarea', box), gin: $('.hp-gutter-in', box), mirror: null, key: '' };
  });
  var view = 'html', lastCode = FILES.indexOf(prefs.view) >= 0 ? prefs.view : 'html';
  var runId = 0, runTimer = 0, pieces = null, needsRun = false;
  var entries = [], marks = { html: {}, js: {} }, renderQueued = false, dropped = 0;
  var cheatGroup = 'html';
  window.HP_STATE = { runs: 0, get entries() { return entries; } };

  function content() { var A = window.APP_CONTENT || {}; return A[EDU.lang] || A.en; }
  function savePrefs() { store.set('prefs', prefs); }
  function isNarrow() { return window.matchMedia ? window.matchMedia('(max-width: 979px)').matches : window.innerWidth < 980; }
  function countNL(s, a, b) { var n = 0; for (var i = a || 0, e = b === undefined ? s.length : b; i < e; i++) if (s.charCodeAt(i) === 10) n++; return n; }
  function htmlEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ------------------------------------------------------------ templates */
  function fillTpl(src, texts, enTexts) {
    var info = EDU.langInfo(EDU.lang);
    return src.replace(/\{\{(?:(js|raw|cm):)?(\w+)\}\}/g, function (m, mode, key) {
      if (key === 'lang') return info.code;
      if (key === 'dirattr') return info.dir === 'rtl' ? ' dir="rtl"' : '';
      var v = texts && texts[key] != null ? texts[key] : (enTexts && enTexts[key] != null ? enTexts[key] : '');
      v = String(v);
      if (mode === 'js') return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n').replace(/<\//g, '<\\/');
      if (mode === 'raw') return v;
      if (mode === 'cm') return v.replace(/\s*\n\s*/g, ' ').replace(/\*\//g, '* /').replace(/--/g, '- -');
      return htmlEsc(v);
    });
  }
  function tplInfo(id) {
    var A = window.APP_CONTENT || {};
    var L = (A[EDU.lang] || A.en).tpl[id], E = A.en.tpl[id];
    return { L: L || E, E: E };
  }
  function loadTemplate(id) {
    var T = D.templates[id];
    if (!T) return;
    var I = tplInfo(id);
    setCode(fillTpl(T.html, I.L.t, I.E.t), fillTpl(T.css, I.L.t, I.E.t), fillTpl(T.js, I.L.t, I.E.t));
    S.tpl = id; S.pristine = true; S.pid = null; S.name = I.L.name; S.sy = 0;
    nameInput.value = S.name;
    renderTips();
    persist();
    run(true);
  }
  function renderTplSelect() {
    var sel = $('#hpTpl');
    sel.innerHTML = '';
    sel.appendChild(EDU.el('option', { value: '', text: t('tpl_choose') }));
    D.order.forEach(function (id) { sel.appendChild(EDU.el('option', { value: id, text: tplInfo(id).L.name })); });
    sel.value = '';
  }
  function renderTips() {
    var box = $('#hpTips'), list = $('#hpTipList');
    list.innerHTML = '';
    var I = S.tpl && D.templates[S.tpl] ? tplInfo(S.tpl) : null;
    if (!I) { box.hidden = true; return; }
    I.L.tips.forEach(function (tip) { list.appendChild(EDU.el('li', { text: tip })); });
    box.hidden = false;
  }

  /* ------------------------------------------------------------ editor */
  function setCode(h, c, j) {
    S.html = h; S.css = c; S.js = j;
    ed.html.ta.value = h; ed.css.ta.value = c; ed.js.ta.value = j;
    marks = { html: {}, js: {} };
    FILES.forEach(function (f) {
      var ta = ed[f].ta;
      ta.scrollTop = 0; ta.scrollLeft = 0;
      try { ta.setSelectionRange(0, 0); } catch (e) { }
      S.caret[f] = null;
      renderGutter(f, true);
    });
    updatePos();
  }
  function lineCount(s) { return countNL(s) + 1; }
  function measureWrap(E, v) {
    var ta = E.ta;
    if (!ta.clientWidth) return null;
    if (!E.mirror) { E.mirror = EDU.el('div', { class: 'hp-mirror', 'aria-hidden': 'true' }); E.box.appendChild(E.mirror); }
    var cs = getComputedStyle(ta);
    var w = ta.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (w <= 0) return null;
    E.mirror.style.width = w + 'px';
    E.mirror.textContent = '';
    var frag = document.createDocumentFragment();
    v.split('\n').forEach(function (ln) { var d = document.createElement('div'); d.textContent = ln || '\u200b'; frag.appendChild(d); });
    E.mirror.appendChild(frag);
    var out = [], kids = E.mirror.children;
    for (var i = 0; i < kids.length; i++) out.push(kids[i].getBoundingClientRect().height);
    E.mirror.textContent = '';
    return out;
  }
  function renderGutter(f, force) {
    var E = ed[f], v = E.ta.value, n = lineCount(v), mk = marks[f] || {};
    var key = n + '|' + Object.keys(mk).map(function (k) { return k + mk[k]; }).join(',');
    if (!prefs.wrap && !force && key === E.key) return;
    E.key = key;
    var heights = prefs.wrap ? measureWrap(E, v) : null;
    var parts = [];
    for (var i = 1; i <= n; i++) {
      var cls = mk[i] ? ' class="hp-m-' + mk[i] + '"' : '';
      var st = heights && heights[i - 1] ? ' style="height:' + heights[i - 1] + 'px"' : '';
      parts.push('<div' + cls + st + '>' + i + '</div>');
    }
    E.gin.innerHTML = parts.join('');
    E.box.style.setProperty('--hp-gw', String(String(n).length));
    syncScroll(f);
  }
  var gutterTimer = {};
  function scheduleGutter(f) {
    if (!prefs.wrap) { renderGutter(f); return; }
    clearTimeout(gutterTimer[f]);
    gutterTimer[f] = setTimeout(function () { renderGutter(f, true); }, 120);
  }
  function syncScroll(f) { var E = ed[f]; E.gin.style.transform = 'translateY(' + (-E.ta.scrollTop) + 'px)'; }
  function rememberCaret(f) { S.caret[f] = ed[f].ta.selectionStart; if (f === lastCode) updatePos(); }
  function updatePos() {
    var ta = ed[lastCode].ta, p = ta.selectionStart || 0, v = ta.value;
    var line = countNL(v, 0, p) + 1, col = p - (v.lastIndexOf('\n', p - 1) + 1) + 1;
    $('#hpPos').textContent = LABEL[lastCode] + ' · ' + t('pos', { line: EDU.fmt(line), col: EDU.fmt(col) });
  }

  function insertText(ta, text) {
    if (document.activeElement !== ta) ta.focus();
    var ok = false, before = ta.value;
    try { ok = document.execCommand('insertText', false, text); } catch (e) { ok = false; }
    if (!ok || (ta.value === before && text)) {
      var s = ta.selectionStart, e2 = ta.selectionEnd;
      ta.setRangeText(text, s, e2, 'end');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  function indent(ta, out) {
    var v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
    var multi = v.slice(s, e).indexOf('\n') >= 0;
    if (!multi && !out) { insertText(ta, '  '); return; }
    var ls = v.lastIndexOf('\n', s - 1) + 1;
    var le = (e > s && v.charAt(e - 1) === '\n') ? e - 1 : e;
    var lineEnd = v.indexOf('\n', le); if (lineEnd < 0) lineEnd = v.length;
    var first = 0, total = 0;
    var lines = v.slice(ls, lineEnd).split('\n').map(function (ln, i) {
      if (out) { var m = /^( {1,2}|\t)/.exec(ln), r = m ? m[0].length : 0; if (i === 0) first = -r; total -= r; return ln.slice(r); }
      if (i === 0) first = 2; total += 2; return '  ' + ln;
    });
    var txt = lines.join('\n');
    if (txt === v.slice(ls, lineEnd)) return;
    ta.setSelectionRange(ls, lineEnd);
    insertText(ta, txt);
    if (!multi) { var p = Math.max(ls, s + first); ta.setSelectionRange(p, p); }
    else ta.setSelectionRange(Math.max(ls, s + first), Math.max(ls, e + total));
  }
  function newline(f, ta) {
    var v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
    var before = v.slice(0, s), after = v.slice(e);
    var ls = before.lastIndexOf('\n') + 1;
    var ind = /^[ \t]*/.exec(before.slice(ls))[0];
    var last = before.slice(-1), next = after.charAt(0);
    var open = false, pair = false;
    var CLOSE = { '{': '}', '[': ']', '(': ')' };
    if (CLOSE[last]) { open = true; pair = next === CLOSE[last]; }
    else if (f === 'html' && last === '>') {
      var lt = before.lastIndexOf('<');
      var m = lt >= 0 ? /^<([a-zA-Z][\w-]*)(\s[^<>]*)?>$/.exec(before.slice(lt)) : null;
      if (m && VOID.indexOf(m[1].toLowerCase()) < 0 && !/\/>$/.test(before) && !/^(html|head|body)$/i.test(m[1])) {
        open = true;
        pair = new RegExp('^</' + m[1] + '\\s*>', 'i').test(after);
      }
    }
    var txt = '\n' + ind + (open ? '  ' : '');
    if (pair) { insertText(ta, txt + '\n' + ind); var p = s + txt.length; ta.setSelectionRange(p, p); }
    else insertText(ta, txt);
  }
  function autoCloseTag(ta) {
    var v = ta.value, s = ta.selectionStart;
    if (s !== ta.selectionEnd) return;
    var before = v.slice(0, s), lt = before.lastIndexOf('<');
    if (lt < 0) return;
    var m = /^<([a-zA-Z][\w-]*)(\s[^<>]*)?>$/.exec(before.slice(lt));
    if (!m || /\/>$/.test(before)) return;
    var tag = m[1].toLowerCase();
    if (VOID.indexOf(tag) >= 0) return;
    var low = before.toLowerCase();
    if (tag !== 'script' && low.lastIndexOf('<script') > low.lastIndexOf('</script')) return;
    if (tag !== 'style' && low.lastIndexOf('<style') > low.lastIndexOf('</style')) return;
    if (new RegExp('^</' + tag + '\\s*>', 'i').test(v.slice(s))) return;
    insertText(ta, '</' + m[1] + '>');
    ta.setSelectionRange(s, s);
  }
  var escArmed = false;
  function onKey(f, e) {
    var ta = ed[f].ta;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(false); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); saveProject(); return; }
    if (e.key === 'Escape') { escArmed = true; return; }
    if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (escArmed) { escArmed = false; return; }
      e.preventDefault();
      indent(ta, e.shiftKey);
      return;
    }
    escArmed = false;
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && !e.isComposing) { e.preventDefault(); newline(f, ta); }
  }
  function onEdit(f, e) {
    var ta = ed[f].ta;
    if (f === 'html' && prefs.close && e && e.inputType === 'insertText' && e.data === '>') autoCloseTag(ta);
    if (S[f] === ta.value) return;
    S[f] = ta.value;
    S.pristine = false;
    scheduleGutter(f);
    rememberCaret(f);
    schedulePersist();
    if (prefs.auto) scheduleRun(); else markStale();
  }
  FILES.forEach(function (f) {
    var ta = ed[f].ta;
    ta.addEventListener('input', function (e) { onEdit(f, e); });
    ta.addEventListener('scroll', function () { syncScroll(f); });
    ta.addEventListener('keydown', function (e) { onKey(f, e); });
    /* not 'select': setSelectionRange() fires it too, and we only want places the user chose */
    ['keyup', 'mouseup', 'touchend', 'focus'].forEach(function (ev) { ta.addEventListener(ev, function () { rememberCaret(f); }); });
  });

  /* symbol keys (keep focus in the editor so phone keyboards stay open) */
  $('#hpKeys').addEventListener('pointerdown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
  $('#hpKeys').addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
  $('#hpKeys').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var ta = ed[lastCode].ta;
    ta.focus();
    if (b.dataset.k === 'tab') indent(ta, false);
    else if (b.dataset.k === 'undo') { try { document.execCommand('undo'); } catch (x) { } }
    else if (b.dataset.k === 'redo') { try { document.execCommand('redo'); } catch (x) { } }
    else if (b.dataset.ins) insertText(ta, b.dataset.ins);
  });

  /* ------------------------------------------------------------ views (tabs) */
  function setView(v, focus) {
    if (v === 'preview' && !isNarrow()) v = lastCode;
    view = v;
    if (v !== 'preview') lastCode = v;
    work.setAttribute('data-view', v);
    FILES.forEach(function (f) { ed[f].box.hidden = f !== lastCode; });
    $$('#hpTabs [role=tab]').forEach(function (b) {
      var on = b.dataset.view === v;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    renderGutter(lastCode, true);
    updatePos();
    if (v === 'preview' && needsRun) run(false);
    if (prefs.view !== lastCode) { prefs.view = lastCode; savePrefs(); }
  }
  $('#hpTabs').addEventListener('click', function (e) { var b = e.target.closest('[role=tab]'); if (b) setView(b.dataset.view); });
  $('#hpTabs').addEventListener('keydown', function (e) {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) < 0) return;
    var tabs = $$('#hpTabs [role=tab]').filter(function (b) { return b.offsetParent !== null; });
    var i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    var rtl = document.documentElement.dir === 'rtl';
    var step = (e.key === 'ArrowRight') !== rtl ? 1 : -1;
    if (e.key === 'Home') i = 0; else if (e.key === 'End') i = tabs.length - 1; else i = (i + step + tabs.length) % tabs.length;
    e.preventDefault();
    setView(tabs[i].dataset.view, true);
  });
  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (view === 'preview' && !isNarrow()) setView(lastCode);
      if (prefs.wrap) renderGutter(lastCode, true);
    }, 150);
  });

  /* ------------------------------------------------------------ editor options */
  function applyPrefs() {
    $('#app').style.setProperty('--hp-fs', prefs.fs + 'px');
    work.classList.toggle('hp-wrap', !!prefs.wrap);
    FILES.forEach(function (f) { ed[f].ta.setAttribute('wrap', prefs.wrap ? 'soft' : 'off'); });
    $('#hpWrap').checked = !!prefs.wrap;
    $('#hpClose').checked = !!prefs.close;
    $('#hpAuto').checked = !!prefs.auto;
    $('#hpW100').setAttribute('aria-pressed', prefs.phone ? 'false' : 'true');
    $('#hpW360').setAttribute('aria-pressed', prefs.phone ? 'true' : 'false');
    $('#hpFrameWrap').classList.toggle('phone', !!prefs.phone);
  }
  function fontStep(d) { prefs.fs = EDU.clamp(prefs.fs + d, 11, 28); savePrefs(); applyPrefs(); renderGutter(lastCode, true); }
  $('#hpFsDown').addEventListener('click', function () { fontStep(-1); });
  $('#hpFsUp').addEventListener('click', function () { fontStep(1); });
  $('#hpWrap').addEventListener('change', function () { prefs.wrap = this.checked; savePrefs(); applyPrefs(); FILES.forEach(function (f) { ed[f].key = ''; }); renderGutter(lastCode, true); });
  $('#hpClose').addEventListener('change', function () { prefs.close = this.checked; savePrefs(); });
  $('#hpAuto').addEventListener('change', function () { prefs.auto = this.checked; savePrefs(); if (prefs.auto && needsRun) run(true); });
  $('#hpW100').addEventListener('click', function () { prefs.phone = false; savePrefs(); applyPrefs(); });
  $('#hpW360').addEventListener('click', function () { prefs.phone = true; savePrefs(); applyPrefs(); });
  $('#hpFs').addEventListener('click', function () { EDU.fullscreen($('#hpOut')); });

  /* ------------------------------------------------------------ loop guard (instrument JS) */
  /* Adds `if(__hpLoop(FILE,LINE))break;` at the start of every for / while / do { } body.
     Loops without { } get the check in their condition instead:
       while (x < 5) x--;        ->  while (!__hpLoop(FILE,LINE)&&(x < 5)) x--;
       for (;;) n++;             ->  for (;!__hpLoop(FILE,LINE);) n++;
     FILE is a number (0 html, 1 js, 2 console line), so the added code has no quote marks and
     also fits inside onclick="…" attributes.
     (this also covers the `while (...)` at the end of a do … while). A hung preview cannot be
     recovered without reloading the whole app, so every loop form a beginner types is guarded.
     A small scanner skips strings, comments, template literals and regular expressions. */
  var LOOP_FILES = ['html', 'js', 'cmd'];
  var KW_RE = /^(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;
  function guardLoops(src, file, baseLine) {
    var n = src.length, ins = [];
    function guardCall(line) { return '__hpLoop(' + LOOP_FILES.indexOf(file) + ',' + line + ')'; }
    /* positions of the `;` that are not nested inside ( ) [ ] { }, strings, comments or regexes */
    function topSemis(a, b) {
      var out = [], depth = 0, prev = '(';
      for (var i = a; i < b;) {
        var c = src[i];
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
        if (c === '/' && src[i + 1] === '/') { while (i < b && src[i] !== '\n') i++; continue; }
        if (c === '/' && src[i + 1] === '*') { var e = src.indexOf('*/', i + 2); i = e < 0 ? b : e + 2; continue; }
        if (c === '"' || c === "'") { i = str(i, c); prev = '"'; continue; }
        if (c === '`') { i = tpl(i); prev = '`'; continue; }
        if (c === '/' && '(,=:[!&|?{};+-*%<>~^'.indexOf(prev) >= 0) { i = rx(i); prev = '/'; continue; }
        if (c === '(' || c === '[' || c === '{') depth++;
        else if (c === ')' || c === ']' || c === '}') depth--;
        else if (c === ';' && depth === 0) out.push(i);
        prev = /[\w$]/.test(c) ? 'a' : c;
        i++;
      }
      return out;
    }
    function isEmptyExpr(a, b) { return !src.slice(a, b).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '').trim(); }
    var lineStarts = [0];
    for (var q = 0; q < n; q++) if (src.charCodeAt(q) === 10) lineStarts.push(q + 1);
    function lineAt(p) { var lo = 0, hi = lineStarts.length - 1; while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= p) lo = mid; else hi = mid - 1; } return baseLine + lo; }
    function ws(j) {
      while (j < n) {
        var c = src[j];
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { j++; continue; }
        if (c === '/' && src[j + 1] === '/') { while (j < n && src[j] !== '\n') j++; continue; }
        if (c === '/' && src[j + 1] === '*') { var e = src.indexOf('*/', j + 2); j = e < 0 ? n : e + 2; continue; }
        break;
      }
      return j;
    }
    function str(j, qc) { j++; while (j < n) { var c = src[j]; if (c === '\\') { j += 2; continue; } if (c === qc) return j + 1; if (c === '\n') return j; j++; } return n; }
    function tpl(j) { j++; while (j < n) { var c = src[j]; if (c === '\\') { j += 2; continue; } if (c === '`') return j + 1; if (c === '$' && src[j + 1] === '{') { j = scan(j + 2, '}') + 1; continue; } j++; } return n; }
    function rx(j) { j++; var cls = false; while (j < n) { var c = src[j]; if (c === '\\') { j += 2; continue; } if (c === '\n') return j; if (cls) { if (c === ']') cls = false; } else if (c === '[') cls = true; else if (c === '/') { j++; while (j < n && /[a-z]/i.test(src[j])) j++; return j; } j++; } return n; }
    function scan(i, until) {
      var depth = 0, prev = '', prevWord = '';
      while (i < n) {
        var c = src[i];
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
        if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
        if (c === '/' && src[i + 1] === '*') { var e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
        if (c === '"' || c === "'") { i = str(i, c); prev = '"'; prevWord = ''; continue; }
        if (c === '`') { i = tpl(i); prev = '`'; prevWord = ''; continue; }
        if (c === '/') {
          if (prev === '' || '(,=:[!&|?{};+-*%<>~^'.indexOf(prev) >= 0 || (prevWord && KW_RE.test(prevWord))) { i = rx(i); prev = '/'; prevWord = ''; continue; }
          i++; prev = '/'; prevWord = ''; continue;
        }
        if (/[A-Za-z_$]/.test(c)) {
          var s0 = i;
          while (i < n && /[\w$]/.test(src[i])) i++;
          var w = src.slice(s0, i);
          if (prev !== '.' && (w === 'for' || w === 'while')) {
            var j = ws(i);
            if (src[j] === 'a' && src.slice(j, j + 5) === 'await') j = ws(j + 5);
            if (src[j] === '(') {
              var k = scan(j + 1, ')');
              var m = ws(k + 1), ln = lineAt(s0);
              if (src[m] === '{') ins.push([m + 1, 0, 'if(' + guardCall(ln) + ')break;']);
              else if (k < n && w === 'while') {
                if (!isEmptyExpr(j + 1, k)) { ins.push([j + 1, 0, '!' + guardCall(ln) + '&&(']); ins.push([k, 1, ')']); }
              } else if (k < n) {
                var sc = topSemis(j + 1, k);
                if (sc.length === 2) {
                  if (isEmptyExpr(sc[0] + 1, sc[1])) ins.push([sc[0] + 1, 0, '!' + guardCall(ln)]);
                  else { ins.push([sc[0] + 1, 0, '!' + guardCall(ln) + '&&(']); ins.push([sc[1], 1, ')']); }
                }
              }
              i = Math.min(n, k + 1); prev = ')'; prevWord = '';
              continue;
            }
          } else if (prev !== '.' && w === 'do') {
            var j2 = ws(i);
            if (src[j2] === '{') ins.push([j2 + 1, 0, 'if(' + guardCall(lineAt(s0)) + ')break;']);
          }
          prev = 'a'; prevWord = w;
          continue;
        }
        if (/[0-9]/.test(c)) { while (i < n && /[\w.]/.test(src[i])) i++; prev = '0'; prevWord = ''; continue; }
        if (c === '(' || c === '[' || c === '{') depth++;
        else if (c === ')' || c === ']' || c === '}') { if (depth === 0 && c === until) return i; depth = Math.max(0, depth - 1); }
        prev = c; prevWord = ''; i++;
      }
      return n;
    }
    try { scan(0, null); } catch (e) { return src; }
    if (!ins.length) return src;
    /* the same spot can be found twice (a loop inside ${…} of a template literal); keep one */
    var seen = {};
    ins = ins.filter(function (x) { var key = x[0] + '|' + x[2]; if (seen[key]) return false; seen[key] = 1; return true; });
    /* insert from the end so earlier positions stay valid; at the same spot the closing ")" goes in first */
    ins.sort(function (a, b) { return b[0] - a[0] || b[1] - a[1]; });
    var out = src;
    ins.forEach(function (x) { out = out.slice(0, x[0]) + x[2] + out.slice(x[0]); });
    return out;
  }
  function lineOf(s, pos) { return countNL(s, 0, pos) + 1; }
  function guardHtmlScripts(html) {
    return html.replace(/(<script\b([^>]*)>)([\s\S]*?)(<\/script\s*>)/gi, function (all, open, attrs, body, close, offset) {
      if (/\bsrc\s*=/i.test(attrs) || !body.trim()) return all;
      var tm = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs);
      if (tm && !/^(text\/javascript|application\/javascript|module)$/i.test(tm[1])) return all;
      return open + guardLoops(body, 'html', lineOf(html, offset + open.length)) + close;
    });
  }
  /* onclick="…" and other event attributes can hold loops too: guard them the same way.
     Comments and the insides of <script> / <style> / <textarea> / <title> are skipped. */
  var TAG_OR_RAW = /<!--[\s\S]*?(?:-->|$)|<(script|style|textarea|title)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)|<[a-zA-Z][\w-]*(?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?>/gi;
  function guardHtmlAttrs(html) {
    return html.replace(TAG_OR_RAW, function (tag, raw, offset) {
      if (raw || tag.charAt(1) === '!' || !/\son[a-z]+\s*=/i.test(tag) || !/\b(for|while|do)\b/.test(tag)) return tag;
      return tag.replace(/(\son[a-z]+\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi, function (all, pre, dq, sq, at) {
        var code = dq != null ? dq : sq, q = dq != null ? '"' : "'";
        return pre + q + guardLoops(code, 'html', lineOf(html, offset + at)) + q;
      });
    });
  }

  /* ------------------------------------------------------------ preview prelude (runs inside the iframe) */
  function PRELUDE(cfg) {
    var P = window.parent, RID = cfg.rid, armed = !cfg.auto;
    /* Messages are sent in one batch per task. A loop that logs 100 000 lines would otherwise send
       100 000 messages and freeze the app on a slow phone; only the newest 300 lines are kept
       (the console shows no more; the same for skipped pop-ups), errors and other messages are never dropped. */
    var later = window.setTimeout.bind(window), queue = [], nLogs = 0, lost = 0, flushing = false, KEEP = 300;
    function flush() {
      flushing = false;
      if (!queue.length) return;
      var items = queue, d = lost;
      queue = []; nLogs = 0; lost = 0;
      try { P.postMessage({ __hp: RID, t: 'batch', items: items, dropped: d }, '*'); } catch (e) { }
    }
    function send(o) {
      queue.push(o);
      if ((o.t === 'log' || o.t === 'modal') && ++nLogs > KEEP * 2) {
        var cut = nLogs - KEEP, kept = [];
        for (var i = 0; i < queue.length; i++) { if ((queue[i].t === 'log' || queue[i].t === 'modal') && cut > 0) { cut--; lost++; } else kept.push(queue[i]); }
        queue = kept; nLogs = KEEP;
      }
      if (!flushing) { flushing = true; later(flush, 0); }
    }
    function fmt(v, d, q) {
      try {
        if (typeof v === 'string') return q ? JSON.stringify(v) : v;
        if (v === null) return 'null';
        if (v === undefined) return 'undefined';
        if (typeof v === 'number' || typeof v === 'boolean') return String(v);
        if (typeof v === 'bigint') return String(v) + 'n';
        if (typeof v === 'function') return 'ƒ ' + (v.name || '') + '()';
        if (typeof v === 'symbol') return v.toString();
        if (v instanceof Error) return v.name + ': ' + v.message;
        if (typeof Element !== 'undefined' && v instanceof Element) {
          var s = '<' + v.tagName.toLowerCase();
          if (v.id) s += ' id="' + v.id + '"';
          if (typeof v.className === 'string' && v.className) s += ' class="' + v.className + '"';
          return s + '>';
        }
        if (v instanceof Date) return v.toString();
        if (d > 2) return Array.isArray(v) ? '[…]' : '{…}';
        var isList = Array.isArray(v) || (typeof NodeList !== 'undefined' && v instanceof NodeList) || (typeof HTMLCollection !== 'undefined' && v instanceof HTMLCollection);
        if (isList) {
          var a = [];
          for (var i = 0; i < Math.min(v.length, 100); i++) a.push(fmt(v[i], d + 1, true));
          return (Array.isArray(v) ? '' : v.constructor.name + ' ') + '[' + a.join(', ') + (v.length > 100 ? ', …' : '') + ']';
        }
        var keys = Object.keys(v), b = [];
        for (var k = 0; k < Math.min(keys.length, 40); k++) b.push(keys[k] + ': ' + fmt(v[keys[k]], d + 1, true));
        return '{' + b.join(', ') + (keys.length > 40 ? ', …' : '') + '}';
      } catch (e) { try { return String(v); } catch (e2) { return '?'; } }
    }
    /* The app's Console is the console of this page: messages are not repeated in the browser's own console. */
    var con = window.console || {};
    ['log', 'info', 'warn', 'error', 'debug', 'dir', 'table', 'trace'].forEach(function (k) {
      con[k] = function () {
        var parts = [];
        for (var i = 0; i < arguments.length; i++) parts.push(fmt(arguments[i], 0, false));
        send({ t: 'log', lv: (k === 'info' || k === 'warn' || k === 'error') ? k : 'log', s: parts.join(' ').slice(0, 4000) });
      };
    });
    con.clear = function () { send({ t: 'clear' }); };
    var counts = {}, timers = {};
    function label(l) { return l === undefined ? 'default' : String(l); }
    function out(lv, s) { send({ t: 'log', lv: lv, s: String(s).slice(0, 4000) }); }
    con.assert = function (ok) {
      if (ok) return;
      var parts = ['Assertion failed'];
      for (var i = 1; i < arguments.length; i++) parts.push(fmt(arguments[i], 0, false));
      out('error', parts.join(' '));
    };
    con.count = function (l) { l = label(l); counts[l] = (counts[l] || 0) + 1; out('log', l + ': ' + counts[l]); };
    con.countReset = function (l) { counts[label(l)] = 0; };
    con.time = function (l) { timers[label(l)] = Date.now(); };
    con.timeLog = function (l) { l = label(l); if (timers[l] != null) out('log', l + ': ' + (Date.now() - timers[l]) + ' ms'); };
    con.timeEnd = function (l) { con.timeLog(l); delete timers[label(l)]; };
    con.group = con.groupCollapsed = function () { if (arguments.length) con.log.apply(con, arguments); };
    con.groupEnd = function () { };
    window.addEventListener('error', function (e) {
      var el = e.target;
      if (el && el !== window && el.tagName) { send({ t: 'res404', s: '<' + el.tagName.toLowerCase() + '> ' + (el.getAttribute('src') || el.getAttribute('href') || '') }); return; }
      send({ t: 'err', s: String(e.message || 'Error'), l: e.lineno || 0 });
      e.preventDefault();
    }, true);
    window.addEventListener('unhandledrejection', function (e) {
      var r = e.reason;
      send({ t: 'err', s: 'Uncaught (in promise) ' + (r && r.message ? (r.name || 'Error') + ': ' + r.message : fmt(r, 0, true)), l: 0 });
      e.preventDefault();
    });
    var t0 = 0, active = false, tripped = false, dialogs = 0;
    window.__hpLoop = function (f, l) {
      var now = Date.now();
      if (!active) { active = true; t0 = now; tripped = false; dialogs = 0; later(function () { active = false; }, 0); }
      if (now - t0 > cfg.limit) { if (!tripped) { tripped = true; send({ t: 'loop', f: f, l: l }); } return true; }
      return false;
    };
    /* alert / confirm / prompt: skipped during auto-updates until the student touches the page, and
       the time spent waiting for an answer does not count for the loop guard (a "guess the number"
       loop with prompt() must not be stopped while the student is typing). After 20 pop-ups in one
       loop the waiting counts again, so a loop that never ends with alert() inside still stops. */
    ['alert', 'confirm', 'prompt'].forEach(function (k) {
      var orig = window[k];
      if (typeof orig !== 'function') return;
      window[k] = function (m) {
        if (!armed) {
          send({ t: 'modal', f: k, s: m === undefined ? '' : String(m) });
          return k === 'confirm' ? false : (k === 'prompt' ? null : undefined);
        }
        flush(); /* show earlier console lines before the pop-up blocks the page */
        var s = Date.now();
        try { return orig.apply(window, arguments); } finally { if (active && ++dialogs <= 20) t0 += Date.now() - s; }
      };
    });
    if (cfg.auto) {
      var arm = function () { armed = true; };
      window.addEventListener('pointerdown', arm, true);
      window.addEventListener('keydown', arm, true);
    }
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var h = a.getAttribute('href') || '';
      if (/^\s*javascript:/i.test(h)) return;
      e.preventDefault();
      if (h.charAt(0) === '#') {
        var id = h.slice(1), el = null;
        try { id = decodeURIComponent(id); } catch (x) { }
        if (id) el = document.getElementById(id) || document.getElementsByName(id)[0];
        if (el) el.scrollIntoView({ behavior: 'smooth' }); else window.scrollTo(0, 0);
        return;
      }
      send({ t: 'link', s: h });
    });
    window.addEventListener('submit', function (e) {
      if (e.defaultPrevented) return;
      e.preventDefault();
      var out = [];
      try { new FormData(e.target).forEach(function (v, k) { out.push(k + ' = ' + (typeof v === 'string' ? v : (v && v.name) || '')); }); } catch (x) { }
      send({ t: 'form', s: out.join(', ') });
    });
    var st = 0;
    window.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(function () { send({ t: 'scroll', y: Math.round(window.scrollY || 0) }); }, 150); }, { passive: true });
    if (cfg.sy) window.addEventListener('load', function () { window.scrollTo(0, cfg.sy); });
    window.addEventListener('message', function (e) {
      var d = e.data;
      if (e.source !== P || !d || d.__hpEval !== RID) return;
      try { var r = (0, eval)(d.code); send({ t: 'res', s: fmt(r, 0, true) }); }
      catch (err) { send({ t: 'err', s: (err && err.name ? err.name + ': ' + err.message : String(err)), l: 0, cmd: 1 }); }
    });
    window.addEventListener('load', function () { send({ t: 'ready' }); });
  }

  /* ------------------------------------------------------------ build the page from the 3 tabs */
  function lastIndexRe(s, re) { var m, last = -1; re.lastIndex = 0; while ((m = re.exec(s))) { last = m.index; if (!m[0].length) re.lastIndex++; } return last; }
  function buildDoc(o) {
    o = o || {};
    var html = S.html, css = S.css, js = S.js;
    if (o.preview) { html = guardHtmlAttrs(guardHtmlScripts(html)); js = guardLoops(js, 'js', 1); }
    var safeCss = css.replace(/<\/style/gi, '<\\/style');
    var safeJs = js.replace(/<\/script/gi, '<\\/script');
    var cssBlock = [{ k: 'inj', s: '<style>\n' }, { k: 'css', s: safeCss, src: 1 }, { k: 'inj', s: (/\n$/.test(safeCss) ? '' : '\n') + '</style>' }];
    var jsBlock = [{ k: 'inj', s: '<script>\n' }, { k: 'js', s: safeJs, src: 1 }, { k: 'inj', s: (/\n$/.test(safeJs) ? '' : '\n') + '</script>' }];
    var pre = o.preview ? [{ k: 'inj', s: '<script>(' + PRELUDE.toString() + ')(' + JSON.stringify({ rid: o.rid, auto: !!o.auto, sy: o.sy || 0, limit: LOOP_LIMIT_MS }) + ');</script>' }] : [];
    var P = [];
    var full = /<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(html);
    if (!full) {
      var info = EDU.langInfo(EDU.lang);
      P.push({ k: 'inj', s: '<!DOCTYPE html>\n<html lang="' + info.code + '"' + (info.dir === 'rtl' ? ' dir="rtl"' : '') + '>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + htmlEsc(S.name || t('untitled')) + '</title>\n' });
      P = P.concat(pre);
      if (css.trim()) P = P.concat(cssBlock, [{ k: 'inj', s: '\n' }]);
      P.push({ k: 'inj', s: '</head>\n<body>\n' });
      P.push({ k: 'html', s: html, src: 1 });
      if (js.trim()) P = P.concat([{ k: 'inj', s: '\n' }], jsBlock);
      P.push({ k: 'inj', s: '\n</body>\n</html>\n' });
    } else {
      var cuts = [], m, at = 0;
      if ((m = /<head\b[^>]*>/i.exec(html))) at = m.index + m[0].length;
      else if ((m = /<html\b[^>]*>/i.exec(html))) at = m.index + m[0].length;
      else if ((m = /<!doctype[^>]*>/i.exec(html))) at = m.index + m[0].length;
      if (pre.length) cuts.push({ a: at, b: at, p: pre });
      var lm = /<link\b[^>]*?\bhref\s*=\s*["']?(?:\.\/)?style\.css["']?[^>]*>/i.exec(html);
      if (lm) cuts.push({ a: lm.index, b: lm.index + lm[0].length, p: cssBlock });
      else if (css.trim()) { var hc = html.search(/<\/head\s*>/i); var cp = hc >= 0 ? hc : at; cuts.push({ a: cp, b: cp, p: cssBlock.concat([{ k: 'inj', s: '\n' }]) }); }
      var sm = /<script\b[^>]*?\bsrc\s*=\s*["']?(?:\.\/)?script\.js["']?[^>]*>\s*<\/script\s*>/i.exec(html);
      if (sm) cuts.push({ a: sm.index, b: sm.index + sm[0].length, p: jsBlock });
      else if (js.trim()) {
        var bc = lastIndexRe(html, /<\/body\s*>/gi);
        if (bc < 0) bc = lastIndexRe(html, /<\/html\s*>/gi);
        if (bc < 0) bc = html.length;
        cuts.push({ a: bc, b: bc, p: jsBlock.concat([{ k: 'inj', s: '\n' }]) });
      }
      cuts.sort(function (x, y) { return x.a - y.a; });
      var pos = 0;
      cuts.forEach(function (c) {
        if (c.a < pos) return;
        if (c.a > pos) P.push({ k: 'html', s: html.slice(pos, c.a), src: lineOf(html, pos) });
        P = P.concat(c.p);
        pos = c.b;
      });
      if (pos < html.length) P.push({ k: 'html', s: html.slice(pos), src: lineOf(html, pos) });
    }
    var line = 1, doc = [];
    P.forEach(function (p) { p.d0 = line; line += countNL(p.s); p.d1 = line; doc.push(p.s); });
    return { doc: doc.join(''), pieces: P };
  }
  function mapLine(L) {
    if (!L || !pieces) return null;
    var cand = null;
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      if ((p.k !== 'js' && p.k !== 'html') || L < p.d0 || L > p.d1) continue;
      var r = { file: p.k, line: p.src + (L - p.d0) };
      if (p.k === 'js') return r;
      if (!cand) cand = r;
    }
    return cand;
  }

  /* ------------------------------------------------------------ HTML tag check */
  var KNOWN = ('html head body title meta link style script noscript base header footer main nav section article aside ' +
    'h1 h2 h3 h4 h5 h6 hgroup address p hr pre blockquote ol ul li dl dt dd figure figcaption div a em strong small s cite q ' +
    'dfn abbr data time code var samp kbd sub sup i b u mark bdi bdo span br wbr ins del picture source img iframe embed object ' +
    'param video audio track map area table caption colgroup col tbody thead tfoot tr td th form label input button select ' +
    'datalist optgroup option textarea output progress meter fieldset legend details summary dialog menu template slot canvas ' +
    'svg math center font marquee big tt strike search ruby rt rp').split(' ');
  var OPTIONAL = 'p li dt dd tr td th thead tbody tfoot option optgroup colgroup caption html head body rt rp'.split(' ');
  var P_CLOSERS = 'address article aside blockquote details div dl fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr main menu nav ol p pre section table ul'.split(' ');
  var RAW = ['script', 'style', 'textarea', 'title'];
  function implied(name, top) {
    if (top === 'p' && P_CLOSERS.indexOf(name) >= 0) return true;
    if (name === 'li' && top === 'li') return true;
    if ((name === 'dt' || name === 'dd') && (top === 'dt' || top === 'dd')) return true;
    if ((name === 'td' || name === 'th') && (top === 'td' || top === 'th')) return true;
    if (name === 'tr' && (top === 'td' || top === 'th' || top === 'tr')) return true;
    if (/^(tbody|thead|tfoot)$/.test(name) && /^(td|th|tr|tbody|thead|tfoot|caption|colgroup)$/.test(top)) return true;
    if (name === 'tr' && /^(caption|colgroup)$/.test(top)) return true;
    if ((name === 'option' || name === 'optgroup') && top === 'option') return true;
    if (name === 'body' && top === 'head') return true;
    return false;
  }
  function lintHtml(src) {
    var issues = [], stack = [], seenUnknown = {};
    var re = /<!--[\s\S]*?-->|<!--|<!doctype[^>]*>|<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/gi;
    var m, lastPos = 0, line = 1;
    function lineAt(p) { line += countNL(src, lastPos, p); lastPos = p; return line; }
    function inForeign() { for (var i = 0; i < stack.length; i++) if (stack[i].name === 'svg' || stack[i].name === 'math') return true; return false; }
    while ((m = re.exec(src)) && issues.length < 30) {
      if (m[0] === '<!--') { issues.push({ key: 'lint_comment', line: lineAt(m.index) }); break; }
      if (!m[2]) continue;
      var close = m[1] === '/', name = m[2].toLowerCase(), ln = lineAt(m.index);
      var foreign = inForeign();
      if (!foreign && name.indexOf('-') < 0 && KNOWN.indexOf(name) < 0 && !seenUnknown[name]) {
        seenUnknown[name] = 1;
        issues.push({ key: 'lint_unknown', line: ln, tag: m[2] });
      }
      if (!close) {
        if (VOID.indexOf(name) >= 0 || m[4] === '/') continue;
        if (RAW.indexOf(name) >= 0) {
          var endRe = new RegExp('</' + name + '\\s*>', 'ig');
          endRe.lastIndex = re.lastIndex;
          var e = endRe.exec(src);
          if (!e) { issues.push({ key: 'lint_unclosed', line: ln, tag: m[2] }); break; }
          re.lastIndex = endRe.lastIndex;
          continue;
        }
        while (stack.length && implied(name, stack[stack.length - 1].name)) stack.pop();
        stack.push({ name: name, tag: m[2], line: ln });
      } else {
        if (VOID.indexOf(name) >= 0) { if (name !== 'br') issues.push({ key: 'lint_void', line: ln, tag: m[2] }); continue; }
        var k = stack.length - 1;
        while (k >= 0 && stack[k].name !== name) k--;
        if (k < 0) {
          if (!/^(html|head|body|tbody|thead|tfoot|colgroup)$/.test(name)) issues.push({ key: 'lint_stray', line: ln, tag: m[2] });
          continue;
        }
        for (var q = stack.length - 1; q > k; q--) {
          if (OPTIONAL.indexOf(stack[q].name) < 0 && !foreign) issues.push({ key: 'lint_unclosed', line: stack[q].line, tag: stack[q].tag });
        }
        stack.length = k;
      }
    }
    stack.forEach(function (it) { if (OPTIONAL.indexOf(it.name) < 0) issues.push({ key: 'lint_unclosed', line: it.line, tag: it.tag }); });
    issues.sort(function (a, b) { return a.line - b.line; });
    return issues.slice(0, 20);
  }

  /* ------------------------------------------------------------ run + console */
  function markStale() { needsRun = true; $('#hpRun').classList.add('hp-stale'); }
  function scheduleRun() { clearTimeout(runTimer); runTimer = setTimeout(function () { run(true); }, 650); }
  function mark(f, line, kind) {
    if (!marks[f] || !line) return;
    if (marks[f][line] !== 'err') marks[f][line] = kind;
  }
  function run(auto) {
    clearTimeout(runTimer);
    runId++;
    window.HP_STATE.runs++;
    needsRun = false;
    $('#hpRun').classList.remove('hp-stale');
    entries = []; dropped = 0;
    marks = { html: {}, js: {} };
    lintHtml(S.html).forEach(function (it) {
      entries.push({ lv: 'warn', key: it.key, vars: { tag: it.tag || '' }, file: 'html', line: it.line });
      mark('html', it.line, 'warn');
    });
    var built = buildDoc({ preview: true, auto: auto, rid: runId, sy: S.sy });
    pieces = built.pieces;
    frame.srcdoc = built.doc;
    renderConsole();
    FILES.forEach(function (f) { renderGutter(f, f === lastCode); });
  }
  function hintFor(msg) {
    if (/has already been declared|redeclaration of/.test(msg)) return 'err_hint_declared';
    if (/Assignment to constant|invalid assignment to const|Attempted to assign to readonly/.test(msg)) return 'err_hint_const';
    if (/is not defined/.test(msg)) return 'err_hint_undefined';
    if (/of (null|undefined)|null is not an object|undefined is not an object/.test(msg)) return 'err_hint_null';
    if (/is not a function/.test(msg)) return 'err_hint_notfn';
    if (/SyntaxError|Unexpected (token|end|identifier|string|number)|missing \)|Invalid or unexpected token|Unterminated/.test(msg)) return 'err_hint_syntax';
    return null;
  }
  function addEntry(x) {
    entries.push(x);
    if (entries.length > MAX_ENTRIES) { entries.splice(0, entries.length - MAX_ENTRIES); dropped++; }
    if (!renderQueued) {
      renderQueued = true;
      (window.requestAnimationFrame || setTimeout)(function () { renderQueued = false; renderConsole(); FILES.forEach(function (f) { renderGutter(f, f === lastCode); }); });
    }
  }
  var ICON = { log: '›', info: 'ℹ', warn: '⚠', error: '✖', res: '←', cmd: '»' };
  function entryEl(x) {
    var row = EDU.el('div', { class: 'hp-con-row ' + x.lv });
    row.appendChild(EDU.el('span', { class: 'hp-con-ico', 'aria-hidden': 'true', text: ICON[x.lv] || '›' }));
    var body = EDU.el('div', { class: 'hp-con-body' });
    var where = x.file && x.line ? t('err_at', { file: LABEL[x.file] || x.file, line: EDU.fmt(x.line) }) : '';
    /* a loop typed in the console line has no file + line: say "Console" instead of empty ( ) */
    var whereText = where || (x.key === 'loop_stopped' ? t('console') : '');
    if (x.key) body.appendChild(EDU.el('span', { class: 'hp-con-msg', text: t(x.key, Object.assign({ where: whereText }, x.vars || {})) }));
    if (x.text != null && x.text !== '') body.appendChild(EDU.el('span', { class: 'hp-con-text no-i18n', text: x.text }));
    if (x.key2) body.appendChild(EDU.el('span', { class: 'hp-con-msg', text: ' ' + t(x.key2) }));
    if (where && (x.file === 'html' || x.file === 'js') && x.key !== 'loop_stopped') {
      body.appendChild(EDU.el('button', { type: 'button', class: 'hp-loc', title: t('jump_title'), text: where, onclick: function () { jumpTo(x.file, x.line); } }));
    } else if (where && x.key === 'loop_stopped') {
      body.appendChild(EDU.el('button', { type: 'button', class: 'hp-loc', title: t('jump_title'), text: '↗', 'aria-label': t('jump_title'), onclick: function () { jumpTo(x.file, x.line); } }));
    }
    if (x.hint) body.appendChild(EDU.el('span', { class: 'hp-con-hint', text: '💡 ' + t(x.hint) }));
    row.appendChild(body);
    return row;
  }
  function renderConsole() {
    var atBottom = conList.scrollHeight - conList.scrollTop - conList.clientHeight < 40;
    conList.textContent = '';
    if (!entries.length) conList.appendChild(EDU.el('div', { class: 'hp-con-empty', text: t('console_empty') }));
    var frag = document.createDocumentFragment();
    if (dropped) frag.appendChild(EDU.el('div', { class: 'hp-con-row cmd' }, EDU.el('span', { class: 'hp-con-ico', text: '…' })));
    entries.forEach(function (x) { frag.appendChild(entryEl(x)); });
    conList.appendChild(frag);
    if (atBottom || entries.length < 8) conList.scrollTop = conList.scrollHeight;
    updateBadges();
  }
  function updateBadges() {
    var ne = 0, nw = 0;
    entries.forEach(function (x) { if (x.lv === 'error') ne++; else if (x.lv === 'warn') nw++; });
    var be = $('#hpErrCount'), bw = $('#hpWarnCount');
    be.hidden = !ne; be.textContent = '✖ ' + EDU.fmt(ne); be.setAttribute('aria-label', t('count_err', { n: EDU.fmt(ne) })); be.title = be.getAttribute('aria-label');
    bw.hidden = !nw; bw.textContent = '⚠ ' + EDU.fmt(nw); bw.setAttribute('aria-label', t('count_warn', { n: EDU.fmt(nw) })); bw.title = bw.getAttribute('aria-label');
    ['html', 'js'].forEach(function (f) {
      var dot = $('#hpDot-' + f), vals = Object.keys(marks[f]).map(function (k) { return marks[f][k]; });
      var hasErr = vals.indexOf('err') >= 0;
      dot.hidden = !vals.length;
      dot.className = 'hp-dot ' + (hasErr ? 'err' : 'warn');
      dot.textContent = hasErr ? '✖' : '⚠';
      dot.setAttribute('aria-label', hasErr ? t('count_err', { n: EDU.fmt(vals.filter(function (v) { return v === 'err'; }).length) }) : t('count_warn', { n: EDU.fmt(vals.length) }));
    });
    var dp = $('#hpDot-preview');
    dp.hidden = !ne;
    dp.className = 'hp-dot err';
    dp.textContent = EDU.fmt(ne);
    dp.setAttribute('aria-label', t('count_err', { n: EDU.fmt(ne) }));
  }
  function jumpTo(f, line) {
    if (FILES.indexOf(f) < 0) return;
    setView(f);
    var ta = ed[f].ta, v = ta.value, start = 0;
    for (var i = 1; i < line; i++) { var nx = v.indexOf('\n', start); if (nx < 0) break; start = nx + 1; }
    var end = v.indexOf('\n', start); if (end < 0) end = v.length;
    ta.focus();
    ta.setSelectionRange(start, end);
    var row = ed[f].gin.children[line - 1];
    if (row) ta.scrollTop = Math.max(0, row.offsetTop - ta.clientHeight / 3);
    syncScroll(f);
    rememberCaret(f);
    if (isNarrow()) ed[f].box.scrollIntoView({ block: 'center' });
  }
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || e.source !== frame.contentWindow || d.__hp !== runId) return;
    if (d.t !== 'batch' || !Array.isArray(d.items)) return;
    if (d.dropped > 0) dropped++;
    d.items.forEach(function (it) { if (it && typeof it === 'object') onPreviewMsg(it); });
  });
  function onPreviewMsg(d) {
    var loc;
    switch (d.t) {
      case 'log': addEntry({ lv: d.lv, text: String(d.s) }); break;
      case 'clear': entries = entries.filter(function (x) { return x.file === 'html' && x.lv === 'warn'; }); dropped = 0; addEntry({ lv: 'info', key: 'console_cleared' }); break;
      case 'err':
        loc = d.cmd ? null : mapLine(d.l);
        addEntry({ lv: 'error', text: d.s, file: loc && loc.file, line: loc && loc.line, hint: hintFor(d.s) });
        if (loc) mark(loc.file, loc.line, 'err');
        break;
      case 'loop':
        var lf = LOOP_FILES[d.f] || 'cmd';
        addEntry({ lv: 'warn', key: 'loop_stopped', file: lf === 'cmd' ? null : lf, line: d.l });
        if (lf !== 'cmd') mark(lf, d.l, 'err');
        break;
      case 'modal': addEntry({ lv: 'info', key: 'modal_skipped', vars: { fn: d.f }, text: d.s }); break;
      case 'link': addEntry({ lv: 'info', key: 'link_clicked', text: d.s }); break;
      case 'form': addEntry(d.s ? { lv: 'info', key: 'form_sent', text: d.s } : { lv: 'info', key: 'form_sent', key2: 'form_empty' }); break;
      case 'res404': addEntry({ lv: 'warn', key: 'res_fail', text: d.s }); break;
      case 'res': addEntry({ lv: 'res', text: d.s }); break;
      case 'scroll': S.sy = d.y || 0; schedulePersist(); break;
    }
  }
  $('#hpConClear').addEventListener('click', function () { entries = []; dropped = 0; renderConsole(); });
  var history_ = [], histPos = 0;
  $('#hpConForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = $('#hpConInput'), code = inp.value;
    if (!code.trim()) return;
    history_.push(code); if (history_.length > 50) history_.shift(); histPos = history_.length;
    inp.value = '';
    addEntry({ lv: 'cmd', text: code });
    /* `let a = 5` then `a * 2`: let / const inside eval() would vanish after the line, so a
       leading let / const becomes var and the variable stays for the next lines (like DevTools). */
    var run1 = code.replace(/^(\s*)(?:let|const)(\s+[A-Za-z_$\[{])/, '$1var$2');
    try { frame.contentWindow.postMessage({ __hpEval: runId, code: guardLoops(run1, 'cmd', 1) }, '*'); } catch (x) { }
  });
  $('#hpConInput').addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' && histPos > 0) { histPos--; this.value = history_[histPos]; e.preventDefault(); }
    else if (e.key === 'ArrowDown' && histPos < history_.length) { histPos++; this.value = history_[histPos] || ''; e.preventDefault(); }
  });
  $('#hpRun').addEventListener('click', function () { run(false); });
  $('#hpRun2').addEventListener('click', function () { run(false); setView('preview'); });

  /* ------------------------------------------------------------ persistence + projects */
  var persistTimer = 0;
  function schedulePersist() { clearTimeout(persistTimer); persistTimer = setTimeout(persist, 400); }
  function persist() {
    clearTimeout(persistTimer);
    var ok = store.set('cur', { html: S.html, css: S.css, js: S.js, name: S.name, tpl: S.tpl, pristine: S.pristine, pid: S.pid, sy: S.sy });
    var el = $('#hpSaved');
    el.dataset.ok = ok ? '1' : '0';
    el.textContent = ok ? '✓ ' + t('autosaved') : '⚠ ' + t('save_failed');
  }
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') persist(); });
  function projects() { var l = store.get('projects', []); return Array.isArray(l) ? l.filter(function (p) { return p && typeof p === 'object' && typeof p.html === 'string'; }) : []; }
  function findProject(id) { return projects().filter(function (p) { return p.id === id; })[0] || null; }
  function isDirty() {
    if (S.pristine) return false;
    if (S.pid) { var p = findProject(S.pid); if (p && p.html === S.html && p.css === S.css && p.js === S.js) return false; }
    return !!(S.html.trim() || S.css.trim() || S.js.trim());
  }
  function currentName() { return (nameInput.value || '').trim().slice(0, 60) || t('untitled'); }
  function updateProjCount() { $('#hpProjCount').textContent = EDU.fmt(projects().length); }
  function saveProject() {
    var list = projects();
    S.name = currentName();
    var rec = { id: S.pid || ('p' + Date.now().toString(36) + Math.floor(Math.random() * 1000)), name: S.name, html: S.html, css: S.css, js: S.js, tpl: S.tpl, at: Date.now() };
    var i = -1;
    list.forEach(function (p, k) { if (p.id === rec.id) i = k; });
    if (i >= 0) list.splice(i, 1);
    list.unshift(rec);
    if (list.length > 200) list.length = 200;
    if (!store.set('projects', list)) { EDU.toast(t('save_failed')); return false; }
    S.pid = rec.id; S.pristine = false;
    persist();
    updateProjCount();
    EDU.toast(t('saved_ok'));
    return true;
  }
  function fileName(name) { return (String(name || '').trim().replace(/[\\/:*?"<>|#%&{}$!'@`=+]+/g, '').replace(/\s+/g, '-').slice(0, 60)) || 'my-page'; }
  function downloadHtml(rec) {
    var keep = { html: S.html, css: S.css, js: S.js, name: S.name };
    if (rec) { S.html = rec.html; S.css = rec.css; S.js = rec.js; S.name = rec.name; }
    var doc = buildDoc({ preview: false }).doc, nm = S.name;
    if (rec) { S.html = keep.html; S.css = keep.css; S.js = keep.js; S.name = keep.name; }
    EDU.download(fileName(nm) + '.html', doc, 'text/html');
  }
  function openRecord(rec) {
    setCode(rec.html || '', rec.css || '', rec.js || '');
    S.name = rec.name || t('untitled'); S.tpl = D.templates[rec.tpl] ? rec.tpl : null; S.pid = rec.id || null; S.pristine = false; S.sy = 0;
    nameInput.value = S.name;
    renderTips(); persist(); run(true);
  }
  function fmtDate(ms) {
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { dateStyle: 'medium', timeStyle: 'short', numberingSystem: 'latn' }).format(new Date(ms)); }
    catch (e) { return new Date(ms).toLocaleString(); }
  }
  function openProjects() {
    var close = null;
    var box = EDU.el('div', { class: 'stack' });
    function fill() {
      box.textContent = '';
      var list = projects();
      if (!list.length) box.appendChild(EDU.el('p', { class: 'muted', text: t('projects_empty') }));
      list.forEach(function (p) {
        box.appendChild(EDU.el('div', { class: 'panel row spread', id: 'hpProj-' + p.id },
          EDU.el('div', { class: 'grow' },
            EDU.el('strong', { class: 'no-i18n', text: p.name || t('untitled') }),
            EDU.el('div', { class: 'tiny muted', text: t('saved_at', { date: fmtDate(p.at || Date.now()) }) })),
          EDU.el('div', { class: 'row' },
            EDU.el('button', { type: 'button', class: 'btn btn-sm btn-primary hp-proj-open', text: t('open_btn'), onclick: function () {
              if (isDirty() && p.id !== S.pid && !confirm(t('confirm_replace'))) return;
              openRecord(p); if (close) close();
            } }),
            EDU.el('button', { type: 'button', class: 'btn btn-sm', 'aria-label': t('download'), title: t('download'), text: '⬇', onclick: function () { downloadHtml(p); } }),
            EDU.el('button', { type: 'button', class: 'btn btn-sm btn-danger hp-proj-del', 'aria-label': t('delete'), title: t('delete'), text: '🗑', onclick: function () {
              if (!confirm(t('confirm_delete', { name: p.name }))) return;
              store.set('projects', projects().filter(function (x) { return x.id !== p.id; }));
              if (S.pid === p.id) { S.pid = null; persist(); }
              updateProjCount(); fill(); EDU.toast(t('deleted'));
            } }))));
      });
      box.appendChild(EDU.el('p', { class: 'tiny muted', text: t('saved_local') }));
    }
    fill();
    close = EDU.modal(box, { title: t('my_projects') });
  }
  $('#hpSave').addEventListener('click', saveProject);
  $('#hpProjects').addEventListener('click', openProjects);
  $('#hpDownload').addEventListener('click', function () { downloadHtml(null); });
  nameInput.addEventListener('input', function () { S.name = nameInput.value; S.pristine = false; schedulePersist(); });

  /* open a .html file: the first inline <style> and <script> go to the CSS and JS tabs */
  function dedent(s) {
    var lines = s.replace(/^\s*\n/, '').replace(/\s+$/, '').split('\n');
    var min = Infinity;
    lines.forEach(function (l) { if (l.trim()) min = Math.min(min, /^[ \t]*/.exec(l)[0].length); });
    if (!isFinite(min)) min = 0;
    return lines.map(function (l) { return l.slice(Math.min(min, /^[ \t]*/.exec(l)[0].length)); }).join('\n') + '\n';
  }
  function splitHtml(src) {
    src = src.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    var css = '', js = '';
    if (!/\bhref\s*=\s*["']?(\.\/)?style\.css/i.test(src)) {
      var sm = /<style\b([^>]*)>([\s\S]*?)<\/style\s*>/i.exec(src);
      if (sm && !/\bmedia\s*=/i.test(sm[1]) && sm[2].trim()) {
        css = dedent(sm[2]);
        src = src.slice(0, sm.index) + '<link rel="stylesheet" href="style.css">' + src.slice(sm.index + sm[0].length);
      }
    }
    if (!/\bsrc\s*=\s*["']?(\.\/)?script\.js/i.test(src)) {
      var re = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, m;
      while ((m = re.exec(src))) {
        if (/\bsrc\s*=/i.test(m[1]) || !m[2].trim()) continue;
        var tm = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(m[1]);
        if (tm && !/^(text|application)\/javascript$/i.test(tm[1])) continue;
        js = dedent(m[2]);
        src = src.slice(0, m.index) + '<script src="script.js"></script>' + src.slice(m.index + m[0].length);
        break;
      }
    }
    return { html: src, css: css, js: js };
  }
  $('#hpOpen').addEventListener('click', function () {
    EDU.pickFile('.html,.htm,text/html').then(function (file) {
      if (!file) return null;
      if (file.size > 1024 * 1024) { EDU.toast(t('file_too_big')); return null; }
      return EDU.readText(file).then(function (text) {
        if (/\u0000/.test(text.slice(0, 2000))) { EDU.toast(t('file_bad')); return; }
        if (isDirty() && !confirm(t('confirm_replace'))) return;
        var parts = splitHtml(text);
        openRecord({ html: parts.html, css: parts.css, js: parts.js, name: file.name.replace(/\.html?$/i, '').slice(0, 60) });
        EDU.toast(t('opened_file', { name: file.name }));
      });
    }).catch(function () { EDU.toast(t('file_bad')); });
  });

  /* share link: the project travels inside the link (#p=...), nothing is uploaded */
  $('#hpShare').addEventListener('click', function () {
    var packed = EDU.pack({ n: currentName(), h: S.html, c: S.css, j: S.js, t: S.tpl });
    if (packed.length > 40000) { EDU.toast(t('link_too_big')); return; }
    EDU.copy(location.href.split('#')[0] + '#p=' + packed);
  });
  function readShared() {
    var m = /[#&]p=([A-Za-z0-9_-]+)/.exec(location.hash || '');
    if (!m) return null;
    var o = EDU.unpack(m[1]);
    try { history.replaceState(history.state, '', location.href.split('#')[0]); } catch (e) { }
    if (!o || typeof o !== 'object') return null;
    return { name: String(o.n || '').slice(0, 60), html: String(o.h || ''), css: String(o.c || ''), js: String(o.j || ''), tpl: o.t };
  }

  $('#hpReset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset_work'))) return;
    prefs = { auto: true, close: true, wrap: window.innerWidth < 700, fs: 15, phone: false, view: 'html' };
    savePrefs(); applyPrefs();
    S.sy = 0;
    loadTemplate('first');
    setView('html');
  });

  $('#hpTpl').addEventListener('change', function () {
    var id = this.value;
    this.value = '';
    if (!id || !D.templates[id]) return;
    if (isDirty() && !confirm(t('confirm_replace'))) return;
    loadTemplate(id);
  });

  /* ------------------------------------------------------------ cheat sheet */
  function braceDepth(s) {
    var d = 0, inC = false;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (inC) { if (c === '*' && s[i + 1] === '/') { inC = false; i++; } continue; }
      if (c === '/' && s[i + 1] === '*') { inC = true; i++; continue; }
      if (c === '{') d++; else if (c === '}') d = Math.max(0, d - 1);
    }
    return d;
  }
  function insertSnippet(g, item) {
    setView(g);
    var ta = ed[g].ta, v = ta.value;
    var pos = S.caret[g];
    var text = item.i;
    if (pos == null || pos > v.length) pos = v.length;
    var lineStart, prefix;
    if (g === 'html') {
      var low = v.toLowerCase();
      var lim = -1, sIdx = low.search(/<script\b[^>]*src\s*=\s*["']?(\.\/)?script\.js/), bIdx = low.lastIndexOf('</body');
      if (sIdx >= 0) lim = sIdx; else if (bIdx >= 0) lim = bIdx;
      /* a cursor left in <head> (e.g. in <title>) is not a place for page content */
      var bm = /<body\b[^>]*>/.exec(low), inHead = !!bm && pos < bm.index + bm[0].length;
      if (lim >= 0 && (S.caret[g] == null || pos > lim || inHead)) {
        lineStart = v.lastIndexOf('\n', lim - 1) + 1;
        var limInd = /^[ \t]*/.exec(v.slice(lineStart))[0];
        if (bIdx === lim && sIdx < 0) limInd += '  ';
        pos = lineStart;
        text = limInd + text.split('\n').join('\n' + limInd) + '\n';
        return doInsert(g, ta, pos, text);
      }
    }
    if (g === 'css' && braceDepth(v.slice(0, pos)) === 0) {
      /* outside any { }: a property gets its own rule, and every rule is kept apart by a blank line
         (rules like :hover or @media used to be glued to the previous "}") */
      if (item.sel) text = item.sel + ' {\n  ' + item.i.split('\n').join('\n  ') + '\n}';
      var head = v.slice(0, pos), tail = v.slice(pos);
      if (head.trim()) {
        if (!/\n[ \t]*$/.test(head)) text = '\n\n' + text;
        else if (!/\n[ \t]*\n[ \t]*$/.test(head)) text = '\n' + text;
      }
      if (tail.trim()) {
        if (!/^[ \t]*\n/.test(tail)) text += '\n\n';
        else if (!/^[ \t]*\n[ \t]*\n/.test(tail)) text += '\n';
      }
    } else if (g === 'css' && item.sel) {
      /* inside a { } rule: a property goes on its own line after the cursor's line,
         not glued to "color: red;" or into the middle of it */
      var ls0 = v.lastIndexOf('\n', pos - 1) + 1, before0 = v.slice(ls0, pos);
      if (before0.trim()) {
        var extra = /\{\s*$/.test(before0) ? '  ' : '';
        if (!extra) { var le0 = v.indexOf('\n', pos); pos = le0 < 0 ? v.length : le0; }
        text = '\n' + extra + item.i.split('\n').join('\n' + extra);
      }
    }
    lineStart = v.lastIndexOf('\n', pos - 1) + 1;
    prefix = v.slice(lineStart, pos);
    var ind = /^[ \t]*/.exec(prefix)[0];
    text = text.split('\n').join('\n' + ind);
    doInsert(g, ta, pos, text);
  }
  function doInsert(g, ta, pos, text) {
    var mark = text.indexOf('§');
    var clean = text.replace('§', '');
    ta.focus();
    ta.setSelectionRange(pos, pos);
    insertText(ta, clean);
    var caret = mark >= 0 ? pos + mark : pos + clean.length;
    ta.setSelectionRange(caret, caret);
    rememberCaret(g);
    var row = ed[g].gin.children[countNL(ta.value, 0, caret)];
    if (row) { ta.scrollTop = Math.max(0, row.offsetTop - ta.clientHeight / 3); syncScroll(g); }
    work.scrollIntoView({ behavior: 'smooth', block: 'start' });
    EDU.toast(t('inserted', { file: FNAME[g] }));
  }
  function renderCheat() {
    var q = ($('#hpCheatQ').value || '').trim().toLowerCase();
    var host = $('#hpCheatList'), desc = content().cheat, any = false;
    host.textContent = '';
    FILES.forEach(function (g) {
      var grp = EDU.el('div', { class: 'hp-cheat-group' + (q ? '' : ' hp-solo'), dataset: { g: g } });
      grp.appendChild(EDU.el('h3', { class: 'hp-cheat-h', text: LABEL[g] + ' · ' + FNAME[g] }));
      var list = EDU.el('div', { class: 'hp-cheat-list' }), hits = 0;
      D.cheat[g].forEach(function (item, i) {
        var d = (desc[g] && desc[g][i]) || '';
        var hit = !q || item.d.toLowerCase().indexOf(q) >= 0 || item.i.toLowerCase().indexOf(q) >= 0 || d.toLowerCase().indexOf(q) >= 0;
        if (hit) hits++;
        var card = EDU.el('div', { class: 'hp-cheat-item' },
          EDU.el('code', { class: 'no-i18n', text: item.d }),
          EDU.el('p', { class: 'small', text: d }),
          EDU.el('button', { type: 'button', class: 'btn btn-sm hp-ins', onclick: function () { insertSnippet(g, item); } },
            EDU.el('span', { 'aria-hidden': 'true', text: '➕' }), ' ', EDU.el('span', { text: t('insert') })));
        card.hidden = !hit;
        list.appendChild(card);
      });
      grp.appendChild(list);
      grp.hidden = q ? !hits : g !== cheatGroup;
      if (!grp.hidden) any = true;
      host.appendChild(grp);
    });
    $('#hpCheatNone').hidden = any;
    $$('#hpCheatSeg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.g === cheatGroup && !q ? 'true' : 'false'); });
  }
  $('#hpCheatSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-g]');
    if (!b) return;
    cheatGroup = b.dataset.g;
    $('#hpCheatQ').value = '';
    renderCheat();
  });
  $('#hpCheatQ').addEventListener('input', renderCheat);

  /* ------------------------------------------------------------ print */
  function fillPrint() {
    var area = $('#hpPrintArea');
    area.textContent = '';
    area.appendChild(EDU.el('h2', { text: t('print_title', { name: currentName() }) }));
    FILES.forEach(function (f) {
      if (!S[f].trim()) return;
      area.appendChild(EDU.el('h3', { text: LABEL[f] + ' · ' + FNAME[f] }));
      var lines = S[f].replace(/\s+$/, '').split('\n'), w = String(lines.length).length;
      area.appendChild(EDU.el('pre', { class: 'hp-print-pre no-i18n', text: lines.map(function (l, i) { var n = String(i + 1); while (n.length < w) n = ' ' + n; return n + '  ' + l; }).join('\n') }));
    });
  }
  window.addEventListener('beforeprint', function () { if (!document.body.classList.contains('hp-pc')) fillPrint(); });
  window.addEventListener('afterprint', function () { document.body.classList.remove('hp-pc'); });
  $('#hpPrint').addEventListener('click', function () { document.body.classList.remove('hp-pc'); fillPrint(); window.print(); });
  $('#hpPrintCheat').addEventListener('click', function () { $('#hpCheat').open = true; document.body.classList.add('hp-pc'); window.print(); });

  /* ------------------------------------------------------------ language */
  function renderLangBits() {
    FILES.forEach(function (f) { ed[f].ta.setAttribute('aria-label', t('editor_label', { file: LABEL[f] + ' (' + FNAME[f] + ')' })); });
    renderTplSelect();
    renderTips();
    renderCheat();
    renderConsole();
    updatePos();
    updateProjCount();
    var sv = $('#hpSaved');
    if (sv.dataset.ok) sv.textContent = sv.dataset.ok === '1' ? '✓ ' + t('autosaved') : '⚠ ' + t('save_failed');
  }
  EDU.onLang(function () {
    if (S.pristine && S.tpl && D.templates[S.tpl]) loadTemplate(S.tpl);
    renderLangBits();
  });

  /* ------------------------------------------------------------ start */
  applyPrefs();
  $('#hpCheat').open = !isNarrow();
  /* A shared link (#p=...) opens that project; unsaved earlier work is first kept in My projects. */
  function openShared(shared, cur) {
    if (cur && typeof cur.html === 'string' && !cur.pristine && (cur.html.trim() || String(cur.css || '').trim() || String(cur.js || '').trim()) &&
      !(cur.html === shared.html && cur.css === shared.css && cur.js === shared.js)) {
      var saved = cur.pid ? findProject(cur.pid) : null;
      if (!(saved && saved.html === cur.html && saved.css === cur.css && saved.js === cur.js)) {
        var list = projects();
        list.unshift({ id: 'p' + Date.now().toString(36), name: (cur.name || t('untitled')) + ' (' + t('backup_suffix') + ')', html: cur.html, css: String(cur.css || ''), js: String(cur.js || ''), tpl: cur.tpl || null, at: Date.now() });
        store.set('projects', list);
        updateProjCount();
      }
    }
    openRecord({ html: shared.html, css: shared.css, js: shared.js, name: shared.name || t('untitled'), tpl: shared.tpl });
    setTimeout(function () { EDU.toast(t('shared_loaded')); }, 300);
  }
  window.addEventListener('hashchange', function () {
    var sh = readShared();
    if (sh) { persist(); openShared(sh, store.get('cur', null)); setView('html'); }
  });
  var cur = store.get('cur', null);
  var shared = readShared();
  if (shared) {
    openShared(shared, cur);
  } else if (cur && typeof cur.html === 'string') {
    if (cur.pristine && cur.tpl && D.templates[cur.tpl]) loadTemplate(cur.tpl);
    else {
      setCode(cur.html, String(cur.css || ''), String(cur.js || ''));
      S.name = String(cur.name || ''); S.tpl = D.templates[cur.tpl] ? cur.tpl : null; S.pid = cur.pid || null; S.pristine = false; S.sy = Number(cur.sy) || 0;
      nameInput.value = S.name;
      run(true);
    }
  } else {
    loadTemplate('first');
  }
  setView(lastCode);
  renderLangBits();
  persist();
})();
