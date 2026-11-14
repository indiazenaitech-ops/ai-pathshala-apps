/* Attendance Calculator: a student's own attendance against a required percentage.
   Maths lives in engine.js (window.ATT). Everything is saved with EDU.store and never leaves the device. */
(function () {
  'use strict';
  var SLUG = 'attendance-calculator';
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t, esc = EDU.esc, A = window.ATT;
  var store = EDU.store(SLUG);
  var MAX_SUBS = 30;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- state ---------------- */
  var seq = 1;
  function blank() { return { T: '75', h: '', a: '', n: '', tab: 'overall', subs: [], example: false }; }
  function exampleSubs() {
    var rows = [[42, 36], [40, 26], [38, 30], [30, 30], [24, 15]];
    return rows.map(function (r, i) { return { id: seq++, key: 's_sub' + (i + 1), name: '', h: String(r[0]), a: String(r[1]), t: '' }; });
  }
  function example() { var s = blank(); s.h = '40'; s.a = '26'; s.n = '30'; s.subs = exampleSubs(); s.example = true; return s; }

  var state = store.get('state', null);
  if (!state || typeof state !== 'object' || !Array.isArray(state.subs)) state = example();
  ['T', 'h', 'a', 'n'].forEach(function (k) { state[k] = typeof state[k] === 'string' ? state[k] : ''; });
  if (['overall', 'subjects', 'planner'].indexOf(state.tab) < 0) state.tab = 'overall';
  state.subs = state.subs.slice(0, MAX_SUBS).map(function (s) {
    return { id: seq++, key: typeof s.key === 'string' ? s.key : '', name: String(s.name || '').slice(0, 60), h: String(s.h || ''), a: String(s.a || ''), t: String(s.t || '') };
  });
  function save() { store.set('state', state); }

  /* ---------------- parsing ---------------- */
  function num(s) {                                   // '' -> null, whole number -> number, anything else -> NaN
    s = String(s == null ? '' : s).trim();
    if (!s) return null;
    return /^\d{1,6}$/.test(s) ? Number(s) : NaN;
  }
  function target(s) {                                // 1..100 with at most one decimal, else NaN
    s = String(s == null ? '' : s).trim().replace(/%$/, '').trim();
    if (!/^\d{1,3}(\.\d)?$/.test(s)) return NaN;
    var v = Number(s);
    return v >= 1 && v <= 100 ? v : NaN;
  }
  function fp(p) { return EDU.fmt(p, { maximumFractionDigits: 2 }) + '%'; }
  function fn(n) { return EDU.fmt(n); }
  function ratio(a, h) { return fn(a) + ' ÷ ' + fn(h) + ' × 100 = ' + fp(A.pct(a, h)); }
  /* a translated line with a left-to-right formula inside it */
  function line(key, vars) {
    var v = {}; Object.keys(vars || {}).forEach(function (k) { v[k] = vars[k]; });
    var f = v.f; v.f = '\u0001';
    return esc(t(key, v)).replace('\u0001', '<bdi dir="ltr">' + esc(f || '') + '</bdi>');
  }

  /* one held/attended pair against a target */
  function judge(hs, as, T) {
    var h = num(hs), a = num(as);
    if (h === null && a === null) return { kind: 'empty' };
    if ((h !== null && isNaN(h)) || (a !== null && isNaN(a))) return { kind: 'err', err: 'err_whole' };
    if (h === null || a === null) return { kind: 'empty' };
    return judgeNums(h, a, T);
  }
  function judgeNums(h, a, T) {
    if (a > h) return { kind: 'err', err: 'err_more' };
    if (h === 0) return { kind: 'zero', h: 0, a: 0 };
    var r = { kind: 'res', h: h, a: a, p: A.pct(a, h), ok: A.meets(a, h, T), T: T };
    if (r.ok) {
      r.y = A.canMiss(h, a, T);
      r.mode = T >= 100 ? 'full' : (r.y > 0 ? 'miss' : 'miss0');
    } else {
      r.x = A.need(h, a, T);
      r.mode = r.x === Infinity ? 'never' : 'need';
    }
    return r;
  }
  function longMsg(r) {
    var tt = fn(r.T);
    if (r.mode === 'full') return t('msg_full100');
    if (r.mode === 'miss') return t(r.y === 1 ? 'msg_miss_1' : 'msg_miss', { y: fn(r.y), t: tt });
    if (r.mode === 'miss0') return t('msg_miss0', { t: tt });
    if (r.mode === 'never') return t('msg_never', { m: fn(r.h - r.a) });
    return t(r.x === 1 ? 'msg_need_1' : 'msg_need', { x: fn(r.x), t: tt });
  }
  function shortMsg(r) {
    var tt = fn(r.T);
    if (r.mode === 'full') return t('sub_full');
    if (r.mode === 'miss') return t('sub_miss', { y: fn(r.y) });
    if (r.mode === 'miss0') return t('sub_miss0');
    if (r.mode === 'never') return t('sub_never', { t: tt });
    return t('sub_need', { x: fn(r.x), t: tt });
  }
  function badge(el, ok) {
    el.className = 'badge ' + (ok ? 'success' : 'danger');
    el.textContent = t(ok ? 'st_safe' : 'st_low');
  }

  /* ---------------- overall ---------------- */
  function renderOverall(T) {
    var err = $('#ovErr'), empty = $('#ovEmpty'), body = $('#ovBody');
    err.textContent = ''; empty.textContent = ''; body.hidden = true;
    if (isNaN(T)) return;
    var r = judge(state.h, state.a, T);
    if (r.kind === 'empty') { empty.textContent = t('msg_empty'); return; }
    if (r.kind === 'err') { err.textContent = t(r.err); return; }
    if (r.kind === 'zero') { empty.textContent = t('msg_zero'); return; }
    body.hidden = false;
    var pctEl = $('#ovPct');
    pctEl.textContent = fp(r.p); pctEl.className = 'res-pct ' + (r.ok ? 'ok' : 'low');
    pctEl.dataset.pct = String(r.p);
    badge($('#ovBadge'), r.ok);
    var fill = $('#ovFill'); fill.style.width = r.p + '%'; fill.className = 'bar-fill' + (r.ok ? '' : ' low');
    $('#ovMark').style.insetInlineStart = 'calc(' + T + '% - 1px)'; $('#ovMarkT').textContent = fp(T);
    var msg = $('#ovMsg'); msg.textContent = longMsg(r);
    msg.dataset.mode = r.mode; msg.dataset.n = r.mode === 'need' ? String(r.x) : (r.ok ? String(r.y) : '');
    var tt = fn(T), L = [line('work_now', { f: ratio(r.a, r.h) })];
    if (r.mode === 'need') {
      L.push(line('work_need', { x: fn(r.x), t: tt, f: ratio(r.a + r.x, r.h + r.x) }));
      if (r.x >= 2) L.push(line('work_need_prev', { x: fn(r.x - 1), f: ratio(r.a + r.x - 1, r.h + r.x - 1) }));
    } else if (r.mode === 'miss') {
      L.push(line('work_miss', { y: fn(r.y), t: tt, f: ratio(r.a, r.h + r.y) }));
      L.push(line('work_miss_next', { y: fn(r.y + 1), t: tt, f: ratio(r.a, r.h + r.y + 1) }));
    } else if (r.mode === 'miss0') {
      L.push(line('work_miss_next', { y: fn(1), t: tt, f: ratio(r.a, r.h + 1) }));
    } else if (r.mode === 'never') {
      L.push(esc(t('work_never', { m: fn(r.h - r.a) })));
    }
    $('#ovWork').innerHTML = L.map(function (x) { return '<li>' + x + '</li>'; }).join('');
  }

  /* ---------------- subjects ---------------- */
  function subName(s) { return s.name || (s.key ? t(s.key) : ''); }
  function buildSubs() {
    var list = $('#subList'); list.innerHTML = '';
    state.subs.forEach(function (s) {
      var row = EDU.el('div', { class: 'sub', dataset: { id: s.id } });
      var name = EDU.el('input', { type: 'text', class: 'sub-name no-i18n', maxlength: '60', value: subName(s), placeholder: t('sub_name_ph'), 'aria-label': t('sub_name'), autocomplete: 'off' });
      name.addEventListener('input', function () { s.name = name.value.slice(0, 60); s.key = ''; touched(); save(); });
      var del = EDU.el('button', { type: 'button', class: 'btn btn-danger no-print sub-del', 'aria-label': t('sub_remove'), title: t('sub_remove'), text: '✕' });
      del.addEventListener('click', function () {
        state.subs = state.subs.filter(function (x) { return x !== s; });
        touched(); save(); buildSubs(); renderSubs();
      });
      row.appendChild(EDU.el('div', { class: 'sub-top' }, name, del));
      var nums = EDU.el('div', { class: 'three' });
      [['h', 'col_held', 'numeric', '40'], ['a', 'col_att', 'numeric', '30'], ['t', 'col_target', 'decimal', '']].forEach(function (c) {
        var inp = EDU.el('input', { type: 'text', inputmode: c[2], maxlength: '7', dir: 'ltr', autocomplete: 'off', class: 'sub-' + c[0], value: s[c[0]], placeholder: c[3] });
        inp.addEventListener('input', function () { s[c[0]] = inp.value; touched(); save(); renderSubs(); });
        nums.appendChild(EDU.el('label', { class: 'field' }, EDU.el('span', { text: t(c[1]) }), inp));
      });
      row.appendChild(nums);
      row.appendChild(EDU.el('div', { class: 'sub-res', 'aria-live': 'polite' }));
      list.appendChild(row);
    });
    $('#btnAddSub').disabled = state.subs.length >= MAX_SUBS;
  }
  function renderSubs() {
    var T = target(state.T), okT = !isNaN(T);
    $('#subIntro').textContent = t('sub_intro', { t: okT ? fn(T) : '75' });
    $('#subEmpty').textContent = state.subs.length ? '' : t('sub_empty');
    var sumH = 0, sumA = 0, k = 0, low = 0;
    state.subs.forEach(function (s) {
      var row = $('.sub[data-id="' + s.id + '"]'); if (!row) return;
      var out = $('.sub-res', row), tin = $('.sub-t', row);
      tin.placeholder = okT ? String(T) : '75';
      row.classList.remove('is-ok', 'is-low'); out.innerHTML = '';
      var own = String(s.t || '').trim(), Ts = own ? target(own) : T;
      if (isNaN(Ts)) { if (own) out.appendChild(EDU.el('span', { class: 'sub-err', text: t('err_target') })); return; }
      var r = judge(s.h, s.a, Ts);
      if (r.kind === 'err') { out.appendChild(EDU.el('span', { class: 'sub-err', text: t(r.err) })); return; }
      if (r.kind === 'empty') return;
      k++; sumH += r.h; sumA += r.a;
      if (r.kind === 'zero') { out.appendChild(EDU.el('span', { class: 'muted sub-msg', text: t('sub_zero') })); return; }
      if (!r.ok) low++;
      row.classList.add(r.ok ? 'is-ok' : 'is-low');
      var b = EDU.el('span', {}); badge(b, r.ok);
      var p = EDU.el('span', { class: 'sub-pct ' + (r.ok ? 'ok' : 'low'), text: fp(r.p), dataset: { pct: String(r.p) } });
      var m = EDU.el('span', { class: 'sub-msg', text: shortMsg(r), dataset: { mode: r.mode, n: r.mode === 'need' ? String(r.x) : (r.ok ? String(r.y) : '') } });
      out.appendChild(p); out.appendChild(b); out.appendChild(m);
    });
    var box = $('#subTotal');
    if (!okT || !k || sumH === 0) { box.hidden = true; return; }
    box.hidden = false;
    var r2 = judgeNums(sumH, sumA, T);
    var tp = $('#totPct'); tp.textContent = fp(r2.p); tp.className = 'res-pct ' + (r2.ok ? 'ok' : 'low'); tp.dataset.pct = String(r2.p);
    badge($('#totBadge'), r2.ok);
    $('#totCount').innerHTML = '<bdi dir="ltr">' + esc(fn(sumA) + ' / ' + fn(sumH)) + '</bdi>';
    $('#totMsg').textContent = longMsg(r2);
    $('#totNote').textContent = low ? t('sub_lowcount', { n: fn(low), k: fn(k) }) : t('sub_allok', { k: fn(k) });
  }

  /* ---------------- planner ---------------- */
  function renderPlanner(T) {
    var err = $('#plErr'), empty = $('#plEmpty'), body = $('#plBody');
    err.textContent = ''; empty.textContent = ''; body.hidden = true;
    if (isNaN(T)) return;
    var h = num(state.h), a = num(state.a), n = num(state.n);
    if ([h, a, n].some(function (v) { return v !== null && isNaN(v); })) { err.textContent = t('err_whole'); return; }
    if (h !== null && a !== null && a > h) { err.textContent = t('err_more'); return; }
    if (h === null || a === null || n === null || n === 0) { empty.textContent = t('plan_empty'); return; }
    var p = A.plan(h, a, n, T), tt = fn(T);
    body.hidden = false;
    var msg = $('#plMsg'), key, vars = { n: fn(n), m: fn(p.maxMiss), k: fn(p.mustAttend), t: tt, p: fp(p.possible ? p.finalPct : p.bestPct) };
    if (!p.possible) key = 'plan_impossible';
    else if (p.maxMiss === n) key = 'plan_all_free';
    else if (p.maxMiss === 0) key = 'plan_none';
    else key = 'plan_can_miss';
    msg.textContent = t(key, vars);
    msg.className = 'callout res-msg ' + (p.possible ? 'success' : 'danger');
    msg.dataset.miss = String(p.maxMiss); msg.dataset.possible = p.possible ? '1' : '0';
    function tile(id, val) {
      var e = $(id); e.textContent = fp(val); e.dataset.pct = String(val);
      e.className = 'tile-v ' + (val * 10 >= Math.round(T * 10) ? 'ok' : 'low');
    }
    $('#plBestL').textContent = t('plan_best', { n: fn(n) }); tile('#plBest', p.bestPct);
    $('#plWorstL').textContent = t('plan_worst', { n: fn(n) }); tile('#plWorst', p.worstPct);
    var lim = $('#plLimit').parentNode;
    lim.hidden = !p.possible || p.maxMiss === 0 || p.maxMiss === n;
    $('#plLimitL').textContent = t('plan_limit', { m: fn(p.maxMiss), k: fn(p.mustAttend) }); tile('#plLimit', p.finalPct);
    var L = [
      line('plan_w1', { f: fn(h) + ' + ' + fn(n) + ' = ' + fn(p.total) }),
      esc(t('plan_w2', { t: tt, total: fn(p.total), need: fn(p.needTotal) })),
      p.possible
        ? esc(t('plan_w3', { a: fn(a), k: fn(Math.max(0, p.needTotal - a)), n: fn(n), m: fn(p.maxMiss) }))
        : esc(t('plan_w3x', { a: fn(a), n: fn(n), best: fn(a + n), need: fn(p.needTotal) }))
    ];
    $('#plWork').innerHTML = L.map(function (x) { return '<li>' + x + '</li>'; }).join('');
  }

  /* ---------------- shell ---------------- */
  function renderTabs() {
    $$('.tabs [role="tab"]').forEach(function (b) {
      var on = b.dataset.tab === state.tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      $('#' + b.getAttribute('aria-controls')).hidden = !on;
    });
  }
  function renderTarget() {
    var T = target(state.T);
    $('#targetErr').textContent = isNaN(T) ? t('err_target') : '';
    $$('#targetSeg button').forEach(function (b) { b.setAttribute('aria-pressed', !isNaN(T) && Number(b.dataset.t) === T ? 'true' : 'false'); });
    return T;
  }
  function renderResults() {
    var T = renderTarget();
    $('#exNote').hidden = !state.example;
    renderOverall(T); renderSubs(); renderPlanner(T);
  }
  function fillInputs() {
    $('#target').value = state.T;
    $('#held').value = state.h; $('#pHeld').value = state.h;
    $('#att').value = state.a; $('#pAtt').value = state.a;
    $('#left').value = state.n;
  }
  function renderAll() { fillInputs(); renderTabs(); buildSubs(); renderResults(); }
  function touched() { if (state.example) { state.example = false; $('#exNote').hidden = true; } }

  function bind(id, key, mirror) {
    var e = $(id);
    e.addEventListener('input', function () {
      state[key] = e.value; if (mirror) $(mirror).value = e.value;
      touched(); save(); renderResults();
    });
  }
  bind('#target', 'T'); bind('#held', 'h', '#pHeld'); bind('#pHeld', 'h', '#held');
  bind('#att', 'a', '#pAtt'); bind('#pAtt', 'a', '#att'); bind('#left', 'n');

  $('#targetSeg').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    state.T = b.dataset.t; $('#target').value = state.T; save(); renderResults();
  });
  $$('.tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { state.tab = b.dataset.tab; save(); renderTabs(); });
  });
  $('#btnAddSub').addEventListener('click', function () {
    if (state.subs.length >= MAX_SUBS) return;
    var s = { id: seq++, key: '', name: '', h: '', a: '', t: '' };
    state.subs.push(s); touched(); save(); buildSubs(); renderSubs();
    var inp = $('.sub[data-id="' + s.id + '"] .sub-name'); if (inp) inp.focus();
  });
  $('#btnSample').addEventListener('click', function () {
    if (state.subs.length && !confirm(t('confirm_sample'))) return;
    state.subs = exampleSubs(); save(); buildSubs(); renderSubs();
  });
  $('#btnClearSubs').addEventListener('click', function () {
    if (!state.subs.length) return;
    if (!confirm(t('confirm_clear_subs'))) return;
    state.subs = []; touched(); save(); buildSubs(); renderSubs();
  });
  function clearAll() { var tab = state.tab; state = blank(); state.tab = tab; save(); renderAll(); }
  $('#btnClearEx').addEventListener('click', clearAll);
  $('#btnReset').addEventListener('click', function () { if (confirm(t('confirm_reset'))) clearAll(); });
  $('#btnPrint').addEventListener('click', function () { window.print(); });

  EDU.onLang(renderAll);
  renderAll();
})();
