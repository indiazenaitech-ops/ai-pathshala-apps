/* Cash Counter: count notes and coins by denomination, compare with an expected amount,
   work out change to return, print/share a slip, keep a small history. Nothing leaves the device.
   Amount in words: window.CASH_WORDS (words.js, a copy of the table used by the receipt makers). */
(function () {
  'use strict';
  var SLUG = 'cash-counter';
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t, esc = EDU.esc, W = window.CASH_WORDS;
  var store = EDU.store(SLUG);
  var NOTES = [500, 200, 100, 50, 20, 10], COINS = [20, 10, 5, 2, 1];
  var CHANGE = [['n', 500], ['n', 200], ['n', 100], ['n', 50], ['n', 20], ['n', 10], ['c', 5], ['c', 2], ['c', 1]];
  var QUICK = [50, 100, 200, 500, 1000, 2000];
  var MAX_COUNT = 999999, MAX_CUSTOM = 6, MAX_DEN = 100000, MAX_HIST = 50, MAX_WORDS = 99999999999;
  var COLORS = { n2000: '#c2478f', n500: '#8d9488', n200: '#f0a13a', n100: '#a79acb', n50: '#56b7c9', n20: '#b9c948', n10: '#9a6a44', c: '#c9b26a' };

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- state ---------------- */
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function blank() { return { counts: {}, custom: [], expected: '', by: '', note: '', date: '', due: '', given: '', tab: 'count' }; }
  var state = store.get('state', null);
  if (!state || typeof state !== 'object') state = blank();
  (function clean() {
    var b = blank();
    Object.keys(b).forEach(function (k) { if (typeof state[k] !== typeof b[k] || state[k] === null) state[k] = b[k]; });
    if (!Array.isArray(state.custom)) state.custom = [];
    state.custom = state.custom.filter(function (c) { return c && (c.k === 'n' || c.k === 'c') && validDen(c.v); }).slice(0, MAX_CUSTOM);
    if (['count', 'change', 'history'].indexOf(state.tab) < 0) state.tab = 'count';
    Object.keys(state.counts).forEach(function (id) { state.counts[id] = cnt(state.counts[id]); });
  })();
  var history = store.get('history', []);
  if (!Array.isArray(history)) history = [];
  function save() { store.set('state', state); }
  function saveHist() { store.set('history', history); }

  function validDen(v) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v && v >= 1 && v <= MAX_DEN; }
  function cnt(v) { var m = /^\d{1,6}/.exec(String(v == null ? '' : v).trim()); return m ? Math.min(MAX_COUNT, Number(m[0])) : 0; }
  function dens() {                                        // [{id, k:'n'|'c', v, custom}]
    var out = [];
    NOTES.forEach(function (v) { out.push({ id: 'n' + v, k: 'n', v: v }); });
    COINS.forEach(function (v) { out.push({ id: 'c' + v, k: 'c', v: v }); });
    state.custom.forEach(function (c) { out.push({ id: c.k + c.v, k: c.k, v: c.v, custom: true }); });
    return out;
  }
  function totals() {
    var r = { notes: 0, coins: 0, amtNotes: 0, amtCoins: 0, total: 0, rows: [] };
    dens().forEach(function (d) {
      var c = state.counts[d.id] || 0; if (!c) return;
      if (d.k === 'n') { r.notes += c; r.amtNotes += c * d.v; } else { r.coins += c; r.amtCoins += c * d.v; }
      r.rows.push([d.k, d.v, c]);
    });
    r.total = r.amtNotes + r.amtCoins;
    return r;
  }

  /* ---------------- formatting ---------------- */
  function fn(n) { return EDU.fmt(n); }
  /* in right-to-left text keep "₹500" together and in that order */
  function iso(x) { return document.documentElement.dir === 'rtl' ? '\u2066' + x + '\u2069' : x; }
  function rs(n) { return iso('₹' + EDU.fmt(n, { maximumFractionDigits: 0 })); }             // whole rupees
  function money(paise) {                                                                    // paise -> ₹1,234.50
    var neg = paise < 0; paise = Math.abs(paise);
    return iso((neg ? '−' : '') + '₹' + EDU.fmt(paise / 100, { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 }));
  }
  function amount(s) {                                     // '' -> null, valid -> paise, else NaN
    s = String(s == null ? '' : s).replace(/[₹,\s]/g, '');
    if (!s) return null;
    if (!/^\d{1,11}(\.\d{1,2})?$/.test(s)) return NaN;
    return Math.round(Number(s) * 100);
  }
  function words(n) { return n > 0 && n <= MAX_WORDS ? t('words_rs', { w: W.say(n, EDU.lang) }) : ''; }
  function denLabel(k, v) { return t(k === 'n' ? 'den_note' : 'den_coin', { v: fn(v) }).replace(/₹[\d,.]+/, function (m) { return iso(m); }); }
  function dateText(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return iso || '';
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { day: 'numeric', month: 'short', year: 'numeric', numberingSystem: 'latn' }).format(d); }
    catch (e) { return iso; }
  }
  function slipDate() { return /^\d{4}-\d{2}-\d{2}$/.test(state.date) ? state.date : today(); }
  function diffText(total, expPaise) {
    if (expPaise === null || isNaN(expPaise)) return null;
    var d = total * 100 - expPaise;
    if (d === 0) return { cls: 'success', text: t('diff_match'), d: 0 };
    if (d < 0) return { cls: 'danger', text: t('diff_short', { amt: money(-d) }), d: d };
    return { cls: 'warning', text: t('diff_excess', { amt: money(d) }), d: d };
  }

  /* ---------------- count tab ---------------- */
  function buildDens() {
    var list = $('#denList'); list.innerHTML = '';
    var groups = [['n', 'notes_h', 'hNotes'], ['c', 'coins_h', 'hCoins'], ['x', 'other_h', 'hOther']];
    var all = dens();
    groups.forEach(function (g) {
      var rows = all.filter(function (d) { return g[0] === 'x' ? d.custom : (!d.custom && d.k === g[0]); });
      if (!rows.length) return;
      list.appendChild(EDU.el('div', { class: 'den-h' }, EDU.el('span', { text: t(g[1]) })));
      rows.forEach(function (d) { list.appendChild(denRow(d)); });
    });
  }
  function denRow(d) {
    var label = denLabel(d.k, d.v);
    var row = EDU.el('div', { class: 'den', dataset: { id: d.id, v: String(d.v), k: d.k } });
    var ico = EDU.el('span', { class: 'den-ico' + (d.k === 'c' ? ' coin' : ''), 'aria-hidden': 'true', style: { background: d.k === 'c' ? COLORS.c : (COLORS[d.id] || '#9fb3a5') } });
    var name = EDU.el('div', { class: 'den-name', title: label }, ico, EDU.el('span', { class: 'num', text: rs(d.v) }));
    if (d.custom) {
      var rm = EDU.el('button', { type: 'button', class: 'btn btn-ghost btn-sm den-rm', 'aria-label': t('remove_denom', { d: label }), title: t('remove_denom', { d: label }), text: '✕' });
      rm.addEventListener('click', function () {
        state.custom = state.custom.filter(function (c) { return c.k + c.v !== d.id; });
        delete state.counts[d.id]; save(); buildDens(); renderCount();
      });
      name.appendChild(rm);
    }
    name.appendChild(EDU.el('span', { class: 'x', 'aria-hidden': 'true', text: '×' }));
    var inp = EDU.el('input', { type: 'text', inputmode: 'numeric', maxlength: '6', dir: 'ltr', autocomplete: 'off', class: 'den-in', placeholder: '0', 'aria-label': t('aria_count', { d: label }), value: state.counts[d.id] ? String(state.counts[d.id]) : '' });
    function set(v, keepText) {
      v = Math.max(0, Math.min(MAX_COUNT, v));
      if (v) state.counts[d.id] = v; else delete state.counts[d.id];
      if (!keepText) inp.value = v ? String(v) : '';
      save(); renderCount();
    }
    inp.addEventListener('input', function () {
      var m = /^\d{0,6}/.exec(inp.value.trim()), clean = m ? m[0] : '';
      if (clean !== inp.value) inp.value = clean;
      set(clean ? Number(clean) : 0, true);
    });
    inp.addEventListener('focus', function () { try { inp.select(); } catch (e) { } });
    inp.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      var ins = $$('.den-in'), i = ins.indexOf(inp);
      if (i >= 0 && ins[i + 1]) ins[i + 1].focus(); else $('#expected').focus();
      ev.preventDefault();
    });
    var minus = EDU.el('button', { type: 'button', class: 'btn den-minus', 'aria-label': t('aria_minus', { d: label }), text: '−' });
    var plus = EDU.el('button', { type: 'button', class: 'btn den-plus', 'aria-label': t('aria_plus', { d: label }), text: '+' });
    minus.addEventListener('click', function () { set((state.counts[d.id] || 0) - 1); });
    plus.addEventListener('click', function () { set((state.counts[d.id] || 0) + 1); });
    row.appendChild(name);
    row.appendChild(EDU.el('div', { class: 'step' }, minus, inp, plus));
    row.appendChild(EDU.el('div', { class: 'den-total num' }));
    return row;
  }
  function renderCount() {
    var T = totals();
    $$('#denList .den').forEach(function (row) {
      var c = state.counts[row.dataset.id] || 0, out = $('.den-total', row);
      out.textContent = rs(c * Number(row.dataset.v));
      out.classList.toggle('zero', !c);
      out.dataset.amt = String(c * Number(row.dataset.v));
    });
    $('#emptyHelp').hidden = T.total > 0;
    $('#nNotes').textContent = t('n_notes', { n: fn(T.notes) }); $('#nNotes').dataset.n = String(T.notes);
    $('#nCoins').textContent = t('n_coins', { n: fn(T.coins) }); $('#nCoins').dataset.n = String(T.coins);
    $('#amtNotes').textContent = rs(T.amtNotes); $('#amtCoins').textContent = rs(T.amtCoins);
    var g = $('#grand'); g.textContent = rs(T.total); g.dataset.total = String(T.total);
    $('#grandWords').textContent = words(T.total);
    var exp = amount(state.expected), diff = $('#diff');
    $('#expErr').textContent = exp !== null && isNaN(exp) ? t('err_amount') : '';
    var d = diffText(T.total, exp);
    diff.textContent = d ? d.text : ''; diff.className = 'callout diff msg ' + (d ? d.cls : '');
    diff.dataset.diff = d ? String(d.d) : '';
    renderSlip(T, d);
  }
  function renderSlip(T, d) {
    var h = '<h1>' + esc(t('slip_title')) + '</h1>';
    h += '<p class="s-meta">' + esc(t('date_label')) + ': ' + esc(dateText(slipDate())) + '</p>';
    if (state.by.trim()) h += '<p class="s-meta">' + esc(t('by_label')) + ': ' + esc(state.by.trim()) + '</p>';
    h += '<table><thead><tr><th>' + esc(t('slip_denom')) + '</th><th class="r">' + esc(t('slip_count')) + '</th><th class="r">' + esc(t('slip_amount')) + '</th></tr></thead><tbody>';
    T.rows.forEach(function (r) {
      h += '<tr><td>' + esc(denLabel(r[0], r[1])) + '</td><td class="r"><span class="num">' + fn(r[2]) + '</span></td><td class="r"><span class="num">' + rs(r[1] * r[2]) + '</span></td></tr>';
    });
    h += '</tbody><tfoot><tr><td>' + esc(t('total')) + '</td><td class="r"><span class="num">' + fn(T.notes + T.coins) + '</span></td><td class="r"><span class="num">' + rs(T.total) + '</span></td></tr></tfoot></table>';
    h += '<p class="s-meta">' + esc(t('n_notes', { n: fn(T.notes) })) + ' · ' + esc(t('n_coins', { n: fn(T.coins) })) + '</p>';
    h += '<p class="s-total">' + esc(t('grand_total')) + ': <span class="num">' + rs(T.total) + '</span></p>';
    if (words(T.total)) h += '<p class="s-meta">' + esc(words(T.total)) + '</p>';
    if (d) h += '<p class="s-meta">' + esc(t('slip_expected')) + ': <span class="num">' + money(amount(state.expected)) + '</span> · <b>' + esc(d.text) + '</b></p>';
    if (state.note.trim()) h += '<p class="s-meta">' + esc(t('note_label')) + ': ' + esc(state.note.trim()) + '</p>';
    h += '<div class="s-sign"><span>' + esc(t('slip_sign')) + '</span></div>';
    $('#slip').innerHTML = h;
  }
  function slipText() {
    var T = totals(), d = diffText(T.total, amount(state.expected)), L = ['*' + t('slip_title') + '*', t('date_label') + ': ' + dateText(slipDate())];
    if (state.by.trim()) L.push(t('by_label') + ': ' + state.by.trim());
    L.push('');
    T.rows.forEach(function (r) { L.push(denLabel(r[0], r[1]) + ' × ' + fn(r[2]) + ' = ' + rs(r[1] * r[2])); });
    L.push('', t('n_notes', { n: fn(T.notes) }) + ' · ' + t('n_coins', { n: fn(T.coins) }));
    L.push('*' + t('grand_total') + ': ' + rs(T.total) + '*');
    if (words(T.total)) L.push(words(T.total));
    if (d) L.push(t('slip_expected') + ': ' + money(amount(state.expected)) + ' · ' + d.text);
    if (state.note.trim()) L.push(t('note_label') + ': ' + state.note.trim());
    return L.join('\n');
  }

  /* ---------------- change tab ---------------- */
  function breakup(rupees) {
    var out = [];
    CHANGE.forEach(function (c) {
      var n = Math.floor(rupees / c[1]);
      if (n) { out.push([c[0], c[1], n]); rupees -= n * c[1]; }
    });
    return out;
  }
  function buildChips() {
    var box = $('#givenChips'); box.innerHTML = '';
    QUICK.forEach(function (v) {
      var b = EDU.el('button', { type: 'button', class: 'chip', dataset: { v: String(v) } }, EDU.el('span', { class: 'num', text: rs(v) }));
      b.addEventListener('click', function () { state.given = String(v); $('#given').value = state.given; save(); renderChange(); });
      box.appendChild(b);
    });
  }
  function renderChange() {
    var err = $('#chErr'), empty = $('#chEmpty'), info = $('#chInfo'), body = $('#chBody');
    err.textContent = ''; empty.textContent = ''; info.textContent = ''; body.hidden = true;
    var due = amount(state.due), given = amount(state.given);
    $$('#givenChips .chip').forEach(function (b) { b.setAttribute('aria-pressed', given === Number(b.dataset.v) * 100 ? 'true' : 'false'); });
    if ((due !== null && isNaN(due)) || (given !== null && isNaN(given))) { err.textContent = t('err_amount'); return; }
    if (due === null || given === null) { empty.textContent = t('ch_empty'); return; }
    var ch = given - due;
    info.dataset.change = String(ch);
    if (ch < 0) { info.className = 'callout warning msg'; info.textContent = t('ch_less', { amt: money(-ch) }); return; }
    if (ch === 0) { info.className = 'callout success msg'; info.textContent = t('ch_exact'); return; }
    body.hidden = false;
    var a = $('#chAmt'); a.textContent = money(ch); a.dataset.change = String(ch);
    $('#chWork').textContent = money(given) + ' − ' + money(due) + ' = ' + money(ch);
    var rupees = Math.floor(ch / 100), paise = ch % 100, rows = breakup(rupees), pieces = 0;
    $('#chList').innerHTML = rows.map(function (r) {
      pieces += r[2];
      return '<li data-k="' + r[0] + '" data-v="' + r[1] + '" data-n="' + r[2] + '"><span>' + esc(denLabel(r[0], r[1])) + '</span><span class="cnt num">× ' + fn(r[2]) + '</span><span class="amt num">' + rs(r[1] * r[2]) + '</span></li>';
    }).join('');
    $('#chBreakH').hidden = !rows.length;
    $('#chPieces').textContent = rows.length ? t('ch_pieces', { n: fn(pieces) }) : '';
    $('#chPieces').dataset.n = String(pieces);
    $('#chPaise').textContent = paise ? t('ch_paise', { amt: money(paise) }) : '';
  }

  /* ---------------- history ---------------- */
  function rowsText(rows) { return rows.map(function (r) { return rs(r[1]) + '×' + fn(r[2]); }).join(', '); }
  function renderHistory() {
    var list = $('#histList'); list.innerHTML = '';
    $('#histEmpty').textContent = history.length ? '' : t('hist_empty');
    $('#histActions').hidden = !history.length;
    $('#histKeep').textContent = t('hist_keep', { n: fn(MAX_HIST) });
    history.forEach(function (h) {
      var d = diffText(h.total, h.expected === undefined ? null : h.expected);
      var item = EDU.el('div', { class: 'h-item', dataset: { id: String(h.id), total: String(h.total) } });
      var left = EDU.el('div', {});
      left.appendChild(EDU.el('div', { class: 'h-total' }, EDU.el('span', { class: 'num', text: rs(h.total) })));
      var meta = EDU.el('div', { class: 'h-meta' });
      meta.appendChild(document.createTextNode(dateText(h.date)));
      if (h.by) { meta.appendChild(document.createTextNode(' · ')); meta.appendChild(EDU.el('span', { class: 'no-i18n', text: h.by })); }
      left.appendChild(meta);
      if (d) left.appendChild(EDU.el('div', {}, EDU.el('span', { class: 'badge ' + (d.cls === 'warning' ? 'accent' : d.cls), text: d.text, style: { whiteSpace: 'normal' } })));
      left.appendChild(EDU.el('div', { class: 'h-rows' }, EDU.el('span', { class: 'num', text: rowsText(h.rows || []) })));
      if (h.note) left.appendChild(EDU.el('div', { class: 'h-meta no-i18n', text: h.note }));
      var del = EDU.el('button', { type: 'button', class: 'btn btn-danger h-del', 'aria-label': t('hist_delete'), title: t('hist_delete'), text: '✕' });
      del.addEventListener('click', function () { history = history.filter(function (x) { return x !== h; }); saveHist(); renderHistory(); });
      item.appendChild(EDU.el('div', { class: 'h-top' }, left, del));
      list.appendChild(item);
    });
  }
  function historyCsv() {
    var rows = [[t('date_label'), t('by_label'), t('grand_total'), t('slip_expected'), t('slip_diff'), t('notes_h'), t('coins_h'), t('slip_denom'), t('note_label')]];
    history.forEach(function (h) {
      var hasExp = typeof h.expected === 'number';
      rows.push([h.date, h.by || '', h.total, hasExp ? h.expected / 100 : '', hasExp ? (h.total * 100 - h.expected) / 100 : '', h.notes, h.coins,
        (h.rows || []).map(function (r) { return r[1] + (r[0] === 'c' ? 'c' : '') + 'x' + r[2]; }).join('; '), h.note || '']);
    });
    return EDU.csv.stringify(rows);
  }

  /* ---------------- shell ---------------- */
  function renderTabs() {
    $$('.tabs [role="tab"]').forEach(function (b) {
      var on = b.dataset.tab === state.tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      $('#' + b.getAttribute('aria-controls')).hidden = !on;
    });
  }
  function fill() {
    $('#expected').value = state.expected; $('#by').value = state.by; $('#note').value = state.note;
    $('#date').value = slipDate(); $('#due').value = state.due; $('#given').value = state.given;
  }
  function renderAll() { fill(); renderTabs(); buildDens(); buildChips(); renderCount(); renderChange(); renderHistory(); }

  [['#expected', 'expected', renderCount], ['#by', 'by', renderCount], ['#note', 'note', renderCount], ['#date', 'date', renderCount],
    ['#due', 'due', renderChange], ['#given', 'given', renderChange]].forEach(function (b) {
    var e = $(b[0]);
    e.addEventListener('input', function () { state[b[1]] = e.value; save(); b[2](); });
  });
  $$('.tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { state.tab = b.dataset.tab; save(); renderTabs(); });
  });
  $('#btnSample').addEventListener('click', function () {
    state.counts = { n500: 6, n200: 4, n100: 12, n50: 7, n20: 10, n10: 15, c10: 8, c5: 11, c2: 9, c1: 6 };
    state.expected = '5900'; state.by = t('s_by'); state.note = t('s_note');
    save(); fill(); buildDens(); renderCount();
  });
  $('#btnAddDen').addEventListener('click', function () {
    var raw = $('#newVal').value.trim(), v = /^\d{1,6}$/.test(raw) ? Number(raw) : NaN, k = $('#newKind').value === 'c' ? 'c' : 'n';
    var taken = dens().some(function (d) { return d.id === k + v; });
    if (!validDen(v) || taken || state.custom.length >= MAX_CUSTOM) { $('#denErr').textContent = t('err_denom'); return; }
    $('#denErr').textContent = '';
    state.custom.push({ k: k, v: v }); save(); $('#newVal').value = '';
    buildDens(); renderCount();
    var inp = $('.den[data-id="' + k + v + '"] .den-in'); if (inp) inp.focus();
  });
  $('#newVal').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); $('#btnAddDen').click(); } });
  $('#btnClear').addEventListener('click', function () {
    if (!confirm(t('confirm_clear'))) return;
    state.counts = {}; state.expected = ''; state.note = ''; state.date = '';
    save(); fill(); buildDens(); renderCount();
  });
  $('#btnSave').addEventListener('click', function () {
    var T = totals();
    if (!T.total) { EDU.toast(t('toast_nothing')); return; }
    var exp = amount(state.expected), h = { id: Date.now(), date: slipDate(), by: state.by.trim(), note: state.note.trim(), total: T.total, notes: T.notes, coins: T.coins, rows: T.rows };
    if (exp !== null && !isNaN(exp)) h.expected = exp;
    history.unshift(h); history = history.slice(0, MAX_HIST); saveHist(); renderHistory();
    EDU.toast(t('toast_saved'));
  });
  $('#btnPrint').addEventListener('click', function () {
    if (!totals().total) { EDU.toast(t('toast_nothing')); return; }
    window.print();
  });
  $('#btnShare').addEventListener('click', function () {
    if (!totals().total) { EDU.toast(t('toast_nothing')); return; }
    var text = slipText(), touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (navigator.share && touch) navigator.share({ text: text }).catch(function () { });
    else EDU.copy(text);
  });
  $('#btnCsv').addEventListener('click', function () { if (history.length) EDU.download('cash-count-history.csv', historyCsv(), 'text/csv'); });
  $('#btnHistClear').addEventListener('click', function () {
    if (!confirm(t('confirm_hist_clear'))) return;
    history = []; saveHist(); renderHistory();
  });

  window.CASH = { slipText: slipText, historyCsv: historyCsv, breakup: breakup, totals: totals, words: words };
  EDU.onLang(renderAll);
  renderAll();
})();
