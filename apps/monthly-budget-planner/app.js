/* Monthly Budget Planner
   Income rows, expense categories with a planned amount, daily expense entries that add up to "spent",
   totals, what is left, a savings-goal line, a canvas chart, CSV export, backup/restore and a printable summary.
   Money is kept in paise (integers). Nothing leaves the device. No advice, no product suggestions. */
(function () {
  'use strict';
  var SLUG = 'monthly-budget-planner';
  var store = EDU.store(SLUG);
  var el = EDU.el, $ = EDU.$, t = EDU.t;
  var MAXP = 100 * 1e7 * 100;                       /* ₹100 crore, in paise */
  var CATS = ['rent', 'groceries', 'school', 'travel', 'bills', 'emi', 'medical', 'savings', 'other'];
  var INC_KEYS = ['inc_salary', 'inc_other'];
  var COLORS = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--c7', '--c8', '--primary', '--accent'];
  var MAX_ROWS = 40, MAX_TX = 5000;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- money ---------------- */
  var NF0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  var NF2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function rs(p) {
    p = Math.round(p || 0);
    var neg = p < 0; p = Math.abs(p);
    return (neg ? '−' : '') + '₹' + (p % 100 === 0 ? NF0.format(p / 100) : NF2.format(p / 100));
  }
  function plainAmt(p) { return p ? String(p / 100) : ''; }
  var ZEROS = [0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0x660, 0x6F0];
  function toLatin(s) {
    return String(s == null ? '' : s).replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (code >= ZEROS[i] && code <= ZEROS[i] + 9) return String(code - ZEROS[i]);
      return c;
    });
  }
  /* "1,00,000.50" -> paise; null when it is not a plain amount of 0 or more */
  function parseAmt(s) {
    s = toLatin(s).replace(/[,\s₹]/g, '');
    if (s === '') return 0;
    if (!/^\d*\.?\d*$/.test(s) || s === '.') return null;
    var n = Number(s);
    if (!isFinite(n) || n < 0) return null;
    return Math.min(MAXP, Math.round(n * 100));
  }

  /* ---------------- dates ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymNow() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function shiftMonth(ym, by) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + by;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    if (y < 2000 || y > 2100) return ym;
    return y + '-' + pad(m + 1);
  }
  function monthLabel(ym) {
    try {
      return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { month: 'long', year: 'numeric', numberingSystem: 'latn', calendar: 'gregory' })
        .format(new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1));
    } catch (e) { return ym; }
  }
  function lastDay(ym) { return new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(); }
  function dayLabel(d) { return d.slice(8, 10) + '/' + d.slice(5, 7); }

  /* ---------------- state ---------------- */
  var data, sample = false, chartMode = 'bars';
  function blankMonth() {
    return {
      income: [{ id: 'i1', key: 'inc_salary', name: '', amt: 0 }],
      cats: CATS.map(function (k) { return { id: k, key: k, name: '', plan: 0 }; }),
      tx: [], goal: 0
    };
  }
  /* a clearly made-up month: income 45,000; planned 43,000; spent 30,240 */
  function sampleMonth(ym) {
    var plan = { rent: 12000, groceries: 8000, school: 5000, travel: 2500, bills: 3000, emi: 4000, medical: 1500, savings: 5000, other: 2000 };
    var mo = blankMonth();
    mo.income = [{ id: 'i1', key: 'inc_salary', name: '', amt: 4200000 }, { id: 'i2', key: 'inc_other', name: '', amt: 300000 }];
    mo.cats.forEach(function (c) { c.plan = plan[c.id] * 100; });
    var tx = [['rent', 12000, 1], ['school', 5000, 2], ['emi', 4000, 3], ['savings', 3000, 3], ['groceries', 2350, 4], ['bills', 1450, 5], ['travel', 640, 6], ['groceries', 1800, 9]];
    mo.tx = tx.map(function (x, i) { return { id: 's' + i, cat: x[0], amt: x[1] * 100, note: '', d: ym + '-' + pad(x[2]) }; });
    mo.goal = 500000;
    return mo;
  }
  function loadSample() {
    var now = ymNow();
    data = { v: 1, cur: now, seq: 1, months: {} };
    data.months[now] = sampleMonth(now);
    sample = true;
  }
  function clearSample() { data.months = {}; sample = false; }
  function M() { if (!data.months[data.cur]) data.months[data.cur] = blankMonth(); return data.months[data.cur]; }
  function save() { if (!sample) store.set('data', data); }
  function nid(p) { data.seq = (data.seq || 1) + 1; return p + data.seq; }

  function str(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').slice(0, max); }
  function amtInt(v) { v = Math.round(Number(v)); return isFinite(v) && v > 0 ? Math.min(MAXP, v) : 0; }
  /* accept only the shape this tool writes; anything else is dropped */
  function sanitize(d) {
    if (!d || typeof d !== 'object' || !d.months || typeof d.months !== 'object' || Array.isArray(d.months)) return null;
    var out = { v: 1, cur: /^\d{4}-\d{2}$/.test(d.cur) ? d.cur : ymNow(), seq: amtInt(d.seq) || 1, months: {} }, ok = true;
    Object.keys(d.months).slice(0, 240).forEach(function (ym) {
      var m = d.months[ym];
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ym) || !m || !Array.isArray(m.income) || !Array.isArray(m.cats) || !Array.isArray(m.tx)) { ok = false; return; }
      var mo = { income: [], cats: [], tx: [], goal: amtInt(m.goal) }, ids = {};
      m.income.slice(0, MAX_ROWS).forEach(function (r, i) {
        if (!r || typeof r !== 'object') return;
        mo.income.push({ id: 'i' + (i + 1), key: INC_KEYS.indexOf(r.key) >= 0 ? r.key : '', name: str(r.name, 60), amt: amtInt(r.amt) });
      });
      m.cats.slice(0, MAX_ROWS).forEach(function (r) {
        if (!r || typeof r !== 'object') return;
        var id = str(r.id, 20).replace(/[^a-z0-9]/gi, '');
        if (!id || ids[id]) return;
        ids[id] = 1;
        mo.cats.push({ id: id, key: CATS.indexOf(r.key) >= 0 ? r.key : '', name: str(r.name, 60), plan: amtInt(r.plan) });
      });
      m.tx.slice(0, MAX_TX).forEach(function (r, i) {
        if (!r || typeof r !== 'object' || !ids[r.cat] || !amtInt(r.amt)) return;
        mo.tx.push({ id: 'r' + i, cat: r.cat, amt: amtInt(r.amt), note: str(r.note, 80), d: /^\d{4}-\d{2}-\d{2}$/.test(r.d) ? r.d : ym + '-01' });
      });
      out.months[ym] = mo;
    });
    out.seq = Math.max(out.seq, 1000);
    return ok ? out : null;
  }

  (function boot() {
    var saved = sanitize(store.get('data', null));
    if (saved) { data = saved; sample = false; } else loadSample();
  })();

  /* ---------------- maths ---------------- */
  function calc(mo) {
    var c = { inc: 0, plan: 0, tot: 0, spent: {}, saved: 0 };
    mo.income.forEach(function (r) { c.inc += r.amt; });
    mo.cats.forEach(function (r) { c.plan += r.plan; c.spent[r.id] = 0; });
    mo.tx.forEach(function (x) { if (x.cat in c.spent) { c.spent[x.cat] += x.amt; c.tot += x.amt; } });
    mo.cats.forEach(function (r) { if (r.key === 'savings') c.saved += c.spent[r.id]; });
    c.leftPlan = c.inc - c.plan; c.leftNow = c.inc - c.tot;
    return c;
  }
  function catName(c) { return c.name || (c.key ? t('cat_' + c.key) : t('new_cat')); }
  function incName(r) { return r.name || (r.key ? t(r.key) : ''); }
  function findBy(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }

  /* translated sentence where {vars} become <bdi> nodes, so ₹ amounts stay in one piece in Urdu */
  function tn(key, vars) {
    var frag = document.createDocumentFragment();
    t(key).split(/(\{\w+\})/).forEach(function (part) {
      var m = /^\{(\w+)\}$/.exec(part);
      if (!m || vars[m[1]] === undefined) { if (part) frag.appendChild(document.createTextNode(part)); return; }
      frag.appendChild(el('bdi', { text: String(vars[m[1]]) }));
    });
    return frag;
  }
  function setNode(node, child) { node.textContent = ''; node.appendChild(child); }

  /* ---------------- render ---------------- */
  function renderAll() {
    var mo = M();
    $('#sampleNote').hidden = !sample;
    $('#monthLabel').textContent = monthLabel(data.cur);

    var inc = $('#incList'); inc.textContent = '';
    mo.income.forEach(function (r) {
      inc.appendChild(el('div', { class: 'mb-inc', dataset: { inc: r.id } },
        el('input', { type: 'text', id: 'incName-' + r.id, class: 'no-i18n', maxlength: 60, value: incName(r), 'aria-label': t('name'), dataset: { f: 'inc-name', id: r.id } }),
        el('input', { type: 'text', inputmode: 'decimal', id: 'incAmt-' + r.id, maxlength: 14, value: plainAmt(r.amt), placeholder: '0', 'aria-label': t('amount'), autocomplete: 'off', dataset: { f: 'inc-amt', id: r.id } }),
        el('button', { class: 'btn btn-ghost mb-x', 'aria-label': t('delete'), title: t('delete'), text: '✕', dataset: { act: 'del-inc', id: r.id } })));
    });

    var list = $('#catList'); list.textContent = '';
    mo.cats.forEach(function (c) {
      list.appendChild(el('div', { class: 'mb-row', dataset: { cat: c.id } },
        el('input', { type: 'text', id: 'name-' + c.id, class: 'mb-name no-i18n', maxlength: 60, value: catName(c), 'aria-label': t('category'), dataset: { f: 'cat-name', id: c.id } }),
        el('button', { class: 'btn btn-ghost mb-x', 'aria-label': t('delete'), title: t('delete'), text: '✕', dataset: { act: 'del-cat', id: c.id } }),
        el('label', { class: 'field' }, el('span', { text: t('col_plan') }),
          el('input', { type: 'text', inputmode: 'decimal', id: 'plan-' + c.id, maxlength: 14, value: plainAmt(c.plan), placeholder: '0', autocomplete: 'off', dataset: { f: 'cat-plan', id: c.id } })),
        el('div', { class: 'field' }, el('span', { text: t('col_spent') }), el('bdi', { class: 'mb-spent', id: 'spent-' + c.id })),
        el('div', { class: 'mb-diff small', id: 'diff-' + c.id })));
    });

    var sel = $('#qCat'), keep = sel.value; sel.textContent = '';
    mo.cats.forEach(function (c) { sel.appendChild(el('option', { value: c.id, text: catName(c) })); });
    if (keep && findBy(mo.cats, keep)) sel.value = keep;
    else if (findBy(mo.cats, 'groceries')) sel.value = 'groceries';
    var qd = $('#qDate');
    qd.min = data.cur + '-01'; qd.max = data.cur + '-' + pad(lastDay(data.cur));
    if (!qd.value || qd.value.slice(0, 7) !== data.cur) qd.value = data.cur === ymNow() ? today() : data.cur + '-01';

    var tx = $('#txList'); tx.textContent = '';
    if (!mo.tx.length) tx.appendChild(el('p', { class: 'muted', text: t('no_entries') }));
    mo.tx.slice().sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; }).forEach(function (x) {
      var c = findBy(mo.cats, x.cat);
      tx.appendChild(el('div', { class: 'mb-tx', dataset: { tx: x.id, amt: x.amt } },
        el('bdi', { class: 'small muted', text: dayLabel(x.d) }),
        el('div', { class: 'grow' }, el('b', { class: 'no-i18n', text: c ? catName(c) : '' }), x.note ? el('div', { class: 'small muted no-i18n', text: x.note }) : null),
        el('bdi', { style: { fontWeight: 700 }, text: rs(x.amt) }),
        el('button', { class: 'btn btn-ghost mb-x', 'aria-label': t('delete'), title: t('delete'), text: '✕', dataset: { act: 'del-tx', id: x.id } })));
    });

    var g = $('#goal'); if (document.activeElement !== g) g.value = plainAmt(mo.goal);
    $('#btnBars').setAttribute('aria-pressed', chartMode === 'bars'); $('#btnDonut').setAttribute('aria-pressed', chartMode === 'donut');
    refresh();
  }

  function signed(node, p) { node.textContent = rs(p); node.className = p < 0 ? 'mb-neg' : ''; }
  /* numbers only: called on every keystroke, never rebuilds the inputs */
  function refresh() {
    var mo = M(), c = calc(mo);
    mo.cats.forEach(function (r) {
      var s = $('#spent-' + r.id), d = $('#diff-' + r.id); if (!s) return;
      var sp = c.spent[r.id], left = r.plan - sp;
      s.textContent = rs(sp);
      d.textContent = '';
      if (r.plan || sp) { d.appendChild(tn(left < 0 ? 'over_n' : 'left_n', { amt: rs(Math.abs(left)) })); d.className = 'mb-diff small ' + (left < 0 ? 'mb-neg' : 'muted'); }
      var row = s.closest('.mb-row'); row.dataset.plan = r.plan; row.dataset.spent = sp;
    });
    $('#sIncome').textContent = rs(c.inc); $('#sPlanned').textContent = rs(c.plan); $('#sSpent').textContent = rs(c.tot);
    signed($('#sLeftPlan'), c.leftPlan); signed($('#sLeftNow'), c.leftNow);
    var bar = $('#goalBar'), gt = $('#goalText');
    if (mo.goal > 0) {
      var pct = Math.floor(c.saved * 100 / mo.goal);
      bar.hidden = false; bar.firstElementChild.style.width = Math.min(100, pct) + '%';
      setNode(gt, tn('goal_progress', { saved: rs(c.saved), goal: rs(mo.goal), pct: pct }));
      gt.dataset.pct = pct;
    } else { bar.hidden = true; gt.textContent = ''; gt.dataset.pct = ''; }
    draw(); buildPrint(mo, c);
  }

  /* ---------------- chart (canvas, no library) ---------------- */
  function draw() {
    var cv = $('#chart'), wrap = $('#chartWrap'); if (!cv || !wrap.clientWidth) return;
    var mo = M(), c = calc(mo), W = Math.max(240, wrap.clientWidth), dpr = window.devicePixelRatio || 1;
    var rtl = document.documentElement.dir === 'rtl', ctx;
    var font = getComputedStyle(document.body).fontFamily;
    var cText = EDU.css('--text'), cMuted = EDU.css('--muted'), cBorder = EDU.css('--border');
    function setup(H) {
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px';
      ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.textBaseline = 'middle';
    }
    function rect(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(rtl ? W - x - w : x, y, w, h); }
    function text(s, x, y, col, bold, endSide) {
      ctx.fillStyle = col; ctx.font = (bold ? '700 ' : '') + '13px ' + font;
      var start = !endSide;
      ctx.textAlign = (start !== rtl) ? 'left' : 'right';
      var px = endSide ? W - x : x;
      ctx.fillText(s, rtl ? W - px : px, y);
    }
    function fit(s, maxW) {
      ctx.font = '700 13px ' + font;
      if (ctx.measureText(s).width <= maxW) return s;
      while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
      return s + '…';
    }
    function color(i) { return EDU.css(COLORS[i % COLORS.length]); }

    if (chartMode === 'bars') {
      var rows = [];
      mo.cats.forEach(function (r, i) { if (r.plan || c.spent[r.id]) rows.push({ r: r, i: i, sp: c.spent[r.id] }); });
      if (!rows.length) { setup(70); ctx.textAlign = 'center'; ctx.fillStyle = cMuted; ctx.font = '14px ' + font; ctx.fillText(t('chart_empty'), W / 2, 35); return; }
      var max = 1; rows.forEach(function (o) { max = Math.max(max, o.r.plan, o.sp); });
      setup(34 + rows.length * 58);
      rect(0, 6, 12, 12, cBorder); text(t('col_plan'), 18, 13, cMuted);
      ctx.font = '13px ' + font; var lw = ctx.measureText(t('col_plan')).width + 34;
      rect(lw, 6, 12, 12, color(0)); text(t('col_spent'), lw + 18, 13, cMuted);
      var bw = Math.max(60, W - 124);
      rows.forEach(function (o, n) {
        var y = 34 + n * 58, over = o.sp > o.r.plan;
        text(fit(catName(o.r), W - 10), 0, y + 8, cText, true);
        var w1 = Math.round(bw * o.r.plan / max), w2 = Math.round(bw * o.sp / max);
        rect(0, y + 20, Math.max(w1, 1), 11, cBorder); text(rs(o.r.plan), Math.max(w1, 1) + 6, y + 26, cMuted);
        rect(0, y + 35, Math.max(w2, 1), 11, over ? EDU.css('--danger') : color(o.i)); text(rs(o.sp), Math.max(w2, 1) + 6, y + 41, over ? EDU.css('--danger') : cText);
      });
    } else {
      var parts = [];
      mo.cats.forEach(function (r, i) { if (c.spent[r.id] > 0) parts.push({ r: r, i: i, sp: c.spent[r.id] }); });
      if (!parts.length) { setup(70); ctx.textAlign = 'center'; ctx.fillStyle = cMuted; ctx.font = '14px ' + font; ctx.fillText(t('chart_empty'), W / 2, 35); return; }
      setup(214 + parts.length * 24);
      var cx = W / 2, cy = 100, a = -Math.PI / 2;
      parts.forEach(function (o) {
        var b = a + 2 * Math.PI * o.sp / c.tot;
        ctx.beginPath(); ctx.arc(cx, cy, 92, a, b); ctx.arc(cx, cy, 56, b, a, true); ctx.closePath();
        ctx.fillStyle = color(o.i); ctx.fill(); a = b;
      });
      ctx.textAlign = 'center'; ctx.fillStyle = cMuted; ctx.font = '12px ' + font; ctx.fillText(t('s_spent'), cx, cy - 10);
      ctx.fillStyle = cText; ctx.font = '700 15px ' + font; ctx.fillText(rs(c.tot), cx, cy + 9);
      parts.forEach(function (o, n) {
        var y = 214 + n * 24, right = rs(o.sp) + '  ' + Math.round(o.sp * 100 / c.tot) + '%';
        ctx.font = '13px ' + font; var rw = ctx.measureText(right).width;
        rect(0, y - 6, 12, 12, color(o.i));
        text(fit(catName(o.r), W - rw - 34), 18, y, cText, true);
        text(right, 0, y, cMuted, false, true);
      });
    }
  }

  /* ---------------- printable one-page summary ---------------- */
  function buildPrint(mo, c) {
    var box = $('#printSum'); box.textContent = '';
    function tr(cells, head) {
      return el('tr', {}, cells.map(function (x, i) { return el(head ? 'th' : 'td', { class: i ? 'num' : 'no-i18n' }, i ? el('bdi', { text: x }) : x); }));
    }
    box.appendChild(el('h2', { text: t('print_title', { month: monthLabel(data.cur) }) }));
    if (sample) box.appendChild(el('p', { class: 'small', text: t('sample_note') }));
    var t1 = el('table', { class: 'table' }, tr([t('h_income'), t('amount')], true));
    mo.income.forEach(function (r) { if (r.amt || incName(r)) t1.appendChild(tr([incName(r), rs(r.amt)])); });
    t1.appendChild(tr([t('s_income'), rs(c.inc)], true));
    var t2 = el('table', { class: 'table' }, tr([t('h_expenses'), t('col_plan'), t('col_spent'), t('s_left')], true));
    mo.cats.forEach(function (r) { if (r.plan || c.spent[r.id]) t2.appendChild(tr([catName(r), rs(r.plan), rs(c.spent[r.id]), rs(r.plan - c.spent[r.id])])); });
    t2.appendChild(tr([t('total'), rs(c.plan), rs(c.tot), rs(c.plan - c.tot)], true));
    var t3 = el('table', { class: 'table' },
      tr([t('s_left_plan'), rs(c.leftPlan)]), tr([t('s_left_now'), rs(c.leftNow)]));
    box.appendChild(t1); box.appendChild(t2); box.appendChild(t3);
    if (mo.goal > 0) box.appendChild(el('p', {}, tn('goal_progress', { saved: rs(c.saved), goal: rs(mo.goal), pct: Math.floor(c.saved * 100 / mo.goal) })));
  }

  /* ---------------- edits ---------------- */
  function applyField(mo, f, id, val, node) {
    var p, row;
    if (f === 'goal') { p = parseAmt(val); mo.goal = p || 0; }
    else if (f === 'inc-name' || f === 'inc-amt') {
      row = findBy(mo.income, id); if (!row) return;
      if (f === 'inc-name') { row.name = str(val, 60).trim(); if (!row.name) row.key = ''; else if (row.key && row.name === t(row.key)) row.name = ''; }
      else { p = parseAmt(val); row.amt = p || 0; }
    } else if (f === 'cat-name' || f === 'cat-plan') {
      row = findBy(mo.cats, id); if (!row) return;
      if (f === 'cat-name') { row.name = str(val, 60).trim(); if (row.key && row.name === t('cat_' + row.key)) row.name = ''; }
      else { p = parseAmt(val); row.plan = p || 0; }
    }
    if (node && p !== undefined) node.setAttribute('aria-invalid', p === null ? 'true' : 'false');
  }
  document.getElementById('app').addEventListener('input', function (e) {
    var x = e.target, f = x.dataset && x.dataset.f; if (!f) return;
    var wiped = false, val = x.value;
    if (sample) { clearSample(); wiped = true; }
    applyField(M(), f, x.dataset.id, val, x);
    save();
    if (wiped) {
      renderAll();
      var n = document.getElementById(x.id);
      if (n) { n.value = val; n.focus(); }
      EDU.toast(t('sample_cleared'));
    } else {
      if (f === 'cat-name') { var o = $('#qCat option[value="' + x.dataset.id + '"]'); if (o) o.textContent = val.trim() || catName(findBy(M().cats, x.dataset.id)); }
      refresh();
    }
  });
  /* tidy the typed text when the user leaves an amount box */
  document.getElementById('app').addEventListener('change', function (e) {
    var x = e.target, f = x.dataset && x.dataset.f;
    if (f === 'inc-amt' || f === 'cat-plan' || f === 'goal') { var p = parseAmt(x.value); x.value = plainAmt(p || 0); x.setAttribute('aria-invalid', 'false'); }
    if (f === 'cat-name' && !x.value.trim()) { var c = findBy(M().cats, x.dataset.id); if (c) x.value = catName(c); }
  });

  function csvSafe(s) { s = String(s); return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; }
  function num(p) { return (p / 100).toFixed(2); }
  function exportCsv() {
    var mo = M(), c = calc(mo), rows = [[t('csv_kind'), t('name'), t('col_plan'), t('amount'), t('date'), t('note')]];
    mo.income.forEach(function (r) { rows.push([t('h_income'), csvSafe(incName(r)), '', num(r.amt), '', '']); });
    mo.cats.forEach(function (r) { rows.push([t('h_expenses'), csvSafe(catName(r)), num(r.plan), num(c.spent[r.id]), '', '']); });
    mo.tx.forEach(function (x) { var k = findBy(mo.cats, x.cat); rows.push([t('h_entries'), csvSafe(k ? catName(k) : ''), '', num(x.amt), x.d, csvSafe(x.note)]); });
    rows.push([t('s_income'), '', '', num(c.inc), '', '']); rows.push([t('s_planned'), '', num(c.plan), '', '', '']);
    rows.push([t('s_spent'), '', '', num(c.tot), '', '']); rows.push([t('s_left_plan'), '', '', num(c.leftPlan), '', '']);
    rows.push([t('s_left_now'), '', '', num(c.leftNow), '', '']);
    window.__mbLastCsv = rows;
    EDU.download('budget-' + data.cur + '.csv', EDU.csv.stringify(rows), 'text/csv');
  }
  function hasPlan(mo) { return mo && (mo.income.some(function (r) { return r.amt > 0; }) || mo.cats.some(function (r) { return r.plan > 0; }) || mo.goal > 0); }
  function copyLast() {
    var keys = Object.keys(data.months).filter(function (k) { return k < data.cur && hasPlan(data.months[k]); }).sort();
    if (!keys.length) { EDU.toast(t('copy_none')); return; }
    var src = data.months[keys[keys.length - 1]], mo = M();
    if (hasPlan(mo) && !confirm(t('copy_confirm'))) return;
    mo.income = src.income.map(function (r) { return { id: r.id, key: r.key, name: r.name, amt: r.amt }; });
    mo.cats = src.cats.map(function (r) { return { id: r.id, key: r.key, name: r.name, plan: r.plan }; });
    mo.goal = src.goal;
    mo.tx = mo.tx.filter(function (x) { return findBy(mo.cats, x.cat); });
    save(); renderAll();
    EDU.toast(t('copy_done', { month: monthLabel(keys[keys.length - 1]) }));
  }
  function addExpense() {
    var msg = $('#qMsg'), p = parseAmt($('#qAmt').value);
    if (!p) { msg.textContent = t('err_amount'); $('#qAmt').setAttribute('aria-invalid', 'true'); $('#qAmt').focus(); return; }
    msg.textContent = ''; $('#qAmt').setAttribute('aria-invalid', 'false');
    var cat = $('#qCat').value, d = $('#qDate').value, note = str($('#qNote').value, 80).trim();
    var wiped = sample; if (sample) clearSample();
    var mo = M();
    if (!findBy(mo.cats, cat)) cat = mo.cats.length ? mo.cats[0].id : '';
    if (!cat || mo.tx.length >= MAX_TX) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d.slice(0, 7) !== data.cur) d = data.cur === ymNow() ? today() : data.cur + '-01';
    mo.tx.push({ id: nid('t'), cat: cat, amt: p, note: note, d: d });
    save(); $('#qAmt').value = ''; $('#qNote').value = '';
    renderAll(); $('#qCat').value = cat;
    if (wiped) EDU.toast(t('sample_cleared'));
  }
  function restore() {
    EDU.pickFile('.json,application/json').then(function (file) {
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { EDU.toast(t('restore_bad')); return; }
      EDU.readText(file).then(function (txt) {
        var obj = null; try { obj = JSON.parse(txt); } catch (e) { obj = null; }
        var d = obj && obj.app === SLUG ? sanitize(obj.data) : null;
        if (!d) { EDU.toast(t('restore_bad')); return; }
        if (!sample && !confirm(t('restore_confirm'))) return;
        data = d; sample = false; save(); renderAll(); EDU.toast(t('restore_ok'));
      }, function () { EDU.toast(t('restore_bad')); });
    });
  }

  document.getElementById('app').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act]'); if (!b) return;
    var act = b.dataset.act, id = b.dataset.id, mo, wiped = false;
    function edit() { if (sample) { clearSample(); wiped = true; } mo = M(); }
    function done() { save(); renderAll(); if (wiped) EDU.toast(t('sample_cleared')); }
    if (act === 'prev' || act === 'next') { data.cur = shiftMonth(data.cur, act === 'prev' ? -1 : 1); $('#qDate').value = ''; save(); renderAll(); }
    else if (act === 'copy-last') { if (sample) { clearSample(); save(); renderAll(); EDU.toast(t('sample_cleared')); } copyLast(); }
    else if (act === 'add-exp') addExpense();
    else if (act === 'add-inc') { edit(); if (mo.income.length < MAX_ROWS) mo.income.push({ id: nid('i'), key: '', name: '', amt: 0 }); done(); var li = $('#incList .mb-inc:last-child input'); if (li) li.focus(); }
    else if (act === 'del-inc') { edit(); if (!wiped) mo.income = mo.income.filter(function (r) { return r.id !== id; }); done(); }
    else if (act === 'add-cat') { edit(); if (mo.cats.length < MAX_ROWS) mo.cats.push({ id: nid('c'), key: '', name: '', plan: 0 }); done(); var lc = $('#catList .mb-row:last-child input'); if (lc) { lc.focus(); lc.select(); } }
    else if (act === 'del-cat') {
      if (!sample && M().tx.some(function (x) { return x.cat === id; }) && !confirm(t('del_cat_confirm'))) return;
      edit(); if (!wiped) { mo.cats = mo.cats.filter(function (r) { return r.id !== id; }); mo.tx = mo.tx.filter(function (x) { return x.cat !== id; }); } done();
    }
    else if (act === 'del-tx') { edit(); if (!wiped) mo.tx = mo.tx.filter(function (x) { return x.id !== id; }); done(); }
    else if (act === 'chart-bars' || act === 'chart-donut') { chartMode = act === 'chart-bars' ? 'bars' : 'donut'; renderAll(); }
    else if (act === 'csv') exportCsv();
    else if (act === 'backup') EDU.download('budget-backup-' + today() + '.json', JSON.stringify({ app: SLUG, v: 1, data: data }), 'application/json');
    else if (act === 'restore') restore();
    else if (act === 'print') window.print();
    else if (act === 'reset') { if (!confirm(t('confirm_reset'))) return; store.remove('data'); loadSample(); $('#qDate').value = ''; renderAll(); }
  });
  $('#qAmt').addEventListener('keydown', function (e) { if (e.key === 'Enter') addExpense(); });
  $('#qNote').addEventListener('keydown', function (e) { if (e.key === 'Enter') addExpense(); });

  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(draw, 120); });
  EDU.onTheme(draw);
  EDU.onLang(function () { $('#qMsg').textContent = ''; renderAll(); });
  renderAll();
})();
