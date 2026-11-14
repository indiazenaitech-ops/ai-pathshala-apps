/* Word Puzzle Maker: screen + print. The puzzle logic lives in engine.js (window.WPM). */
(function () {
  'use strict';
  var SLUG = 'word-puzzle-maker';
  var store = EDU.store(SLUG), $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t, W = window.WPM;

  EDU.init({ slug: SLUG, title: 'app_title' });

  var DEFAULTS = { mode: 'search', title: '', words: '', sample: true, size: 0, level: 0, seed: 7, list: true, hints: false, name: true, key: true };
  var st = load();
  var parsed = null, puzzle = null;

  function load() {
    var s = store.get('state', null), o = {}, k;
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    if (s && typeof s === 'object') for (k in DEFAULTS) if (typeof s[k] === typeof DEFAULTS[k]) o[k] = s[k];
    if (['search', 'cross', 'scramble'].indexOf(o.mode) < 0) o.mode = 'search';
    return o;
  }
  function sample() {
    var c = (window.APP_CONTENT || {})[EDU.lang] || window.APP_CONTENT.en;
    return { title: c.title, words: c.words.map(function (w) { return w[0] + ' : ' + w[1]; }).join('\n') };
  }
  function useSample() { var s = sample(); st.title = s.title; st.words = s.words; st.sample = true; }
  if (st.sample) useSample();

  /* ---------- building the sheets ---------- */
  function fontFactor(script, base) { return (script === 'latin' || script === 'arab' || script === 'other' || script === 'hebr') ? base : base * 0.76; }

  function head(isKey) {
    var frag = document.createDocumentFragment();
    var h = el('div', { class: 'sh-head' },
      el('h2', { class: 'sh-title no-i18n', dir: 'auto', text: st.title.trim() || t('tab_' + st.mode) }));
    if (isKey) h.appendChild(el('span', { class: 'sh-tag', text: t('key_title') }));
    frag.appendChild(h);
    if (!isKey && st.name) {
      frag.appendChild(el('div', { class: 'sh-name' },
        el('span', null, el('span', { text: t('sheet_name') + ':' }), el('span', { class: 'ln' })),
        el('span', null, el('span', { text: t('sheet_date') + ':' }), el('span', { class: 'ln short' }))));
    }
    return frag;
  }

  function searchSheet(p, isKey) {
    var frag = head(isKey);
    if (!isKey) {
      var ins = (st.list ? t('ins_search') : t('ins_search_n', { n: EDU.fmt(p.placed.length) })) + ' ' + t(['hint_easy', 'hint_medium', 'hint_hard'][p.level]);
      frag.appendChild(el('p', { class: 'sh-ins', text: ins }));
    } else frag.appendChild(el('p', { class: 'sh-ins' }));
    var hit = {};
    if (isKey) p.placed.forEach(function (w) { for (var i = 0; i < w.cells.length; i++) hit[(w.r + w.dr * i) + ',' + (w.c + w.dc * i)] = 1; });
    var grid = el('div', { class: 'ws-grid no-i18n sc-' + p.script + (isKey ? ' is-key' : ''), dir: p.rtl ? 'rtl' : 'ltr' });
    for (var r = 0; r < p.size; r++) for (var c = 0; c < p.size; c++) {
      grid.appendChild(el('div', { class: 'cell' + (hit[r + ',' + c] ? ' hit' : ''), dataset: { r: r, c: c }, text: p.grid[r][c] }));
    }
    frag.appendChild(el('div', { class: 'gwrap', style: { '--n': p.size, '--cell': '44px', '--f': fontFactor(p.script, 0.55) } }, grid));
    if (st.list || isKey) {
      var ul = el('ul', { class: 'wlist no-i18n' + (isKey ? ' is-keylist' : '') });
      p.placed.forEach(function (w) { ul.appendChild(el('li', { dir: 'auto', text: w.word })); });
      frag.appendChild(ul);
    }
    return frag;
  }

  function crossSheet(p, isKey) {
    var frag = head(isKey);
    frag.appendChild(el('p', { class: 'sh-ins', text: isKey ? '' : t('ins_cross') }));
    var grid = el('div', { class: 'cw-grid no-i18n sc-' + p.script + (isKey ? ' is-key' : ''), dir: p.rtl ? 'rtl' : 'ltr' });
    for (var r = 0; r < p.rows; r++) for (var c = 0; c < p.cols; c++) {
      var g = p.grid[r][c];
      if (!g) { grid.appendChild(el('div', { class: 'cw-gap' })); continue; }
      var cell = el('div', { class: 'cw-cell', dataset: { r: r, c: c } });
      if (g.num) cell.appendChild(el('span', { class: 'num', text: String(g.num) }));
      if (isKey) cell.appendChild(el('span', { class: 'ch', text: g.ch }));
      grid.appendChild(cell);
    }
    frag.appendChild(el('div', { class: 'gwrap', style: { '--n': p.cols, '--cell': '40px', '--f': fontFactor(p.script, 0.5) } }, grid));
    var clues = el('div', { class: 'clues' });
    [['across', p.across], ['down', p.down]].forEach(function (pair) {
      if (!pair[1].length) return;
      var ul = el('ul');
      pair[1].forEach(function (w) {
        var li = el('li', null, el('span', { class: 'n', text: w.num + '.' }));
        if (isKey) li.appendChild(el('span', { class: 'ans no-i18n', dir: 'auto', text: w.word }));
        else {
          li.appendChild(el('span', { class: 'no-i18n', dir: 'auto', text: w.clue || '…………' }));
          li.appendChild(el('span', { class: 'len', text: '(' + w.cells.length + ')' }));
        }
        ul.appendChild(li);
      });
      clues.appendChild(el('div', { class: 'clue-col', dataset: { dir: pair[0] } }, el('h3', { text: t(pair[0]) }), ul));
    });
    frag.appendChild(clues);
    return frag;
  }

  function scrambleSheet(p, isKey) {
    var frag = head(isKey);
    frag.appendChild(el('p', { class: 'sh-ins', text: isKey ? '' : t('ins_scramble') }));
    var list = el('div', { class: 'sc-list' });
    p.items.forEach(function (it, i) {
      var boxes = el('span', { class: 'sc-boxes no-i18n sc-' + p.script, dir: p.rtl ? 'rtl' : 'ltr' });
      it.cells.forEach(function (ch) { boxes.appendChild(el('span', { class: 'sc-box', text: isKey ? ch : '' })); });
      var row = el('div', { class: 'sc-row', dataset: { key: it.key } },
        el('span', { class: 'sc-n', text: (i + 1) + '.' }),
        el('span', { class: 'sc-j no-i18n', dir: p.rtl ? 'rtl' : 'ltr', text: it.jumbled.join(' ') }),
        boxes);
      if (!isKey && st.hints && it.clue) row.appendChild(el('span', { class: 'sc-hint no-i18n', dir: 'auto', text: it.clue }));
      list.appendChild(row);
    });
    frag.appendChild(list);
    return frag;
  }

  /* ---------- status ---------- */
  function join(a) { return a.length > 8 ? a.slice(0, 8).join(', ') + ' … +' + EDU.fmt(a.length - 8) : a.join(', '); }
  function status() {
    var box = $('#status'), n = parsed.entries.length;
    box.innerHTML = '';
    box.className = 'callout';
    var warn = [];
    if (parsed.dupes.length) warn.push(t('warn_dupes', { w: join(parsed.dupes) }));
    if (parsed.short.length) warn.push(t('warn_short', { w: join(parsed.short) }));
    if (parsed.extra) warn.push(t('warn_max', { n: EDU.fmt(W.MAX_WORDS) }));
    if (!n) {
      box.appendChild(el('p', { text: t('empty') }));
    } else {
      var placed = st.mode === 'scramble' ? puzzle.items.length : puzzle.placed.length;
      box.appendChild(el('p', { id: 'status-count', text: t('status_placed', { n: EDU.fmt(placed), m: EDU.fmt(n) }) }));
      if (st.mode === 'search') {
        if (puzzle.tooLong.length) warn.push(t(st.size ? 'warn_unplaced' : 'warn_long', { w: join(puzzle.tooLong) }));
        if (puzzle.unplaced.length) warn.push(t('warn_unplaced', { w: join(puzzle.unplaced) }));
      } else if (st.mode === 'cross') {
        if (puzzle.unplaced.length) warn.push(t('warn_long', { w: join(puzzle.unplaced) }));
        if (puzzle.loose.length) warn.push(t('warn_loose', { w: join(puzzle.loose) }));
      }
      if (placed === n && !warn.length) box.className = 'callout success';
    }
    if (warn.length && box.className === 'callout') box.className = 'callout warning';
    warn.forEach(function (m) { box.appendChild(el('p', { class: 'warn', dir: 'auto', text: m })); });
  }

  /* ---------- render ---------- */
  function build() {
    parsed = W.parse(st.words);
    var o = { size: st.size, level: st.level, seed: st.seed };
    puzzle = st.mode === 'cross' ? W.makeCrossword(parsed, o) : st.mode === 'scramble' ? W.makeScramble(parsed, o) : W.makeSearch(parsed, o);
  }
  function pressed(sel, attr, val) {
    $$(sel + ' button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === String(val))); });
  }
  function syncControls() {
    pressed('#mode', 'data-mode', st.mode);
    pressed('#size', 'data-size', st.size);
    pressed('#level', 'data-level', st.level);
    if ($('#title').value !== st.title) $('#title').value = st.title;
    if ($('#words').value !== st.words) $('#words').value = st.words;
    $('#opt-list').checked = st.list; $('#opt-hints').checked = st.hints; $('#opt-name').checked = st.name; $('#opt-key').checked = st.key;
    $('#opts-search').hidden = st.mode !== 'search';
    $('#wrap-list').hidden = st.mode !== 'search';
    $('#wrap-hints').hidden = st.mode !== 'scramble';
    $('#level-hint').textContent = t(['hint_easy', 'hint_medium', 'hint_hard'][st.level]);
  }
  function render() {
    build();
    syncControls();
    status();
    var sheet = $('#sheet'), key = $('#sheet-key'), has = parsed.entries.length > 0;
    sheet.innerHTML = ''; key.innerHTML = '';
    sheet.hidden = !has; key.hidden = !has || !st.key;
    if (has) {
      var make = st.mode === 'cross' ? crossSheet : st.mode === 'scramble' ? scrambleSheet : searchSheet;
      sheet.appendChild(make(puzzle, false));
      if (st.key) key.appendChild(make(puzzle, true));
    }
    $('#btn-print').disabled = !has;
    $('#btn-new').disabled = !has;
    store.set('state', st);
  }

  /* ---------- events ---------- */
  function seg(sel, attr, apply) {
    $(sel).addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      apply(b.getAttribute(attr)); render();
    });
  }
  seg('#mode', 'data-mode', function (v) { st.mode = v; });
  seg('#size', 'data-size', function (v) { st.size = +v; });
  seg('#level', 'data-level', function (v) { st.level = +v; });
  $('#title').addEventListener('input', function () { st.title = this.value; st.sample = false; render(); });
  var timer = null;
  $('#words').addEventListener('input', function () {
    st.words = this.value; st.sample = false;
    clearTimeout(timer); timer = setTimeout(render, 60);
  });
  [['#opt-list', 'list'], ['#opt-hints', 'hints'], ['#opt-name', 'name'], ['#opt-key', 'key']].forEach(function (p) {
    $(p[0]).addEventListener('change', function () { st[p[1]] = this.checked; render(); });
  });
  $('#btn-new').addEventListener('click', function () { st.seed = (st.seed * 31 + 17 + Math.floor(Math.random() * 100000)) % 2147483647 || 1; render(); });
  $('#btn-sample').addEventListener('click', function () { useSample(); render(); });
  $('#btn-clear').addEventListener('click', function () { st.words = ''; st.title = ''; st.sample = false; render(); $('#words').focus(); });
  $('#btn-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state');
    for (var k in DEFAULTS) st[k] = DEFAULTS[k];
    useSample(); render();
  });
  $('#btn-print').addEventListener('click', function () { clearTimeout(timer); render(); setTimeout(function () { try { window.print(); } catch (e) { } }, 60); });

  EDU.onLang(function () { if (st.sample) useSample(); render(); });
  window.WPM_APP = { puzzle: function () { return puzzle; }, parsed: function () { return parsed; }, state: st, render: render };
  render();
})();
