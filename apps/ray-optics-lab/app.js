/* Lens & Mirror Ray Lab: UI (device picker, sliders, drag, results, formula, NCERT table, quiz, uses). */
(function () {
  'use strict';
  var O = window.RayOptics, D = window.RayDraw, $ = EDU.$, $$ = EDU.$$, t = EDU.t;
  var SLUG = 'ray-optics-lab', store = EDU.store(SLUG);
  var DEF = { dev: 'concave_mirror', f: 10, u: 15, h: 4, inf: false, rays: [true, true, true, true] };
  var MINUS = '−';

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  function clampInt(v, a, b) { v = Math.round(+v); return EDU.clamp(isFinite(v) ? v : a, a, b); }
  function clampHalf(v) { v = Math.round(+v * 2) / 2; return EDU.clamp(isFinite(v) ? v : DEF.h, O.H_MIN, O.H_MAX); }
  function load() {
    var s = store.get('state', null) || {}, o = JSON.parse(JSON.stringify(DEF));
    if (O.DEVICES.indexOf(s.dev) >= 0) o.dev = s.dev;
    if (isFinite(s.f)) o.f = clampInt(s.f, O.F_MIN, O.F_MAX);
    if (isFinite(s.u)) o.u = clampInt(s.u, 1, O.uMax(o.f));
    if (isFinite(s.h)) o.h = clampHalf(s.h);
    o.inf = s.inf === true;
    if (Array.isArray(s.rays) && s.rays.length === 4) o.rays = s.rays.map(Boolean);
    return o;
  }
  var S = load(), sol = null, viewInfo = null;
  var cv = $('#rl-canvas'), ctx = cv.getContext('2d'), CW = 0, CH = 0, DPR = 0, printing = false;

  /* ---------- number formatting (Latin digits, true minus sign) ---------- */
  function nf(n, d) {
    if (n === Infinity) return '∞';
    if (n === -Infinity) return MINUS + '∞';
    if (typeof n !== 'number' || isNaN(n)) return '—';
    var p = Math.pow(10, d == null ? 2 : d), r = Math.round(n * p) / p;
    if (Math.abs(r) < 1e-12) r = 0;
    return (r < 0 ? MINUS : '') + EDU.fmt(Math.abs(r), { maximumFractionDigits: d == null ? 2 : d, useGrouping: false });
  }
  function sg(n, d) { var s = nf(n, d); return (n > 0 && s !== '0') ? '+' + s : s; }
  function par(n) { return n < 0 ? '(' + nf(n) + ')' : nf(n); }
  function fr(n, d) { var q = O.frac(n, d); if (q[0] === 0) return '0'; if (q[1] === 1) return nf(q[0]); return (q[0] < 0 ? MINUS : '') + nf(Math.abs(q[0])) + '/' + nf(q[1]); }
  function cm(s) { return s + ' cm'; }

  /* ---------- main update ---------- */
  function update(from) {
    S.u = clampInt(S.u, 1, O.uMax(S.f));
    sol = O.solve(S.dev, S.f, S.inf ? Infinity : S.u, S.h);
    syncInputs(from);
    renderDevices(); renderRays(); renderResults(); renderFormula(); renderTable(); draw();
    var cap = $('#print-cap');
    cap.textContent = t('dev_' + S.dev) + ' · ';
    cap.appendChild(EDU.el('bdi', { dir: 'ltr', text: 'f = ' + cm(sg(sol.f)) + ' · u = ' + (S.inf ? MINUS + '∞' : cm(nf(sol.u))) + ' · h = ' + cm(nf(S.h)) }));
    store.set('state', S);
  }

  function syncInputs(from) {
    var um = O.uMax(S.f);
    $('#u-range').max = um; $('#u-num').max = um;
    var set = function (id, v) { if (id !== from) $(id).value = v; };
    set('#f-range', S.f); set('#f-num', S.f);
    set('#u-range', S.u); set('#u-num', S.inf ? '' : S.u);
    $('#u-num').placeholder = S.inf ? '∞' : '';
    set('#h-range', S.h); set('#h-num', S.h);
    $('#far').setAttribute('aria-pressed', S.inf ? 'true' : 'false');
  }

  function renderDevices() {
    $$('.rl-dev').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.dev === S.dev ? 'true' : 'false'); });
  }

  var raysKey = '';
  function rayNames() {
    if (S.inf) return ['ray_n', 'ray_n', 'ray_n'];
    if (O.isMirror(S.dev)) return ['ray_par', 'ray_c', 'ray_f', 'ray_p'];
    return ['ray_par', 'ray_o', S.dev === 'convex_lens' ? 'ray_f1' : 'ray_f2'];
  }
  function renderRays() {
    var box = $('#rays'), key = S.dev + S.inf + EDU.lang;
    if (key !== raysKey) {
      raysKey = key;
      $$('.rl-ray', box).forEach(function (b) { b.remove(); });
      rayNames().forEach(function (k, i) {
        box.appendChild(EDU.el('button', { type: 'button', class: 'chip rl-ray', id: 'ray-' + i, style: { '--col': 'var(--' + D.RAY_VARS[i] + ')' },
          onclick: function () { S.rays[i] = !S.rays[i]; update(); } },
          EDU.el('span', { class: 'dot', 'aria-hidden': 'true' }), EDU.el('span', { text: t(k, { n: i + 1 }) })));
      });
    }
    $$('.rl-ray', box).forEach(function (b, i) { b.setAttribute('aria-pressed', S.rays[i] ? 'true' : 'false'); });
  }

  /* ---------- results ---------- */
  function stat(key, val, id) {
    return EDU.el('div', { class: 'rl-stat' }, EDU.el('span', { class: 'k', text: t(key) }), EDU.el('span', { class: 'val', id: id, text: val }));
  }
  function renderResults() {
    var R = sol, box = $('#stats');
    var mTxt = R.objInf ? '≈ 0' : (R.imgInf ? '∞' : sg(R.m));
    var h2Txt = R.objInf ? '≈ 0' : (R.imgInf ? '∞' : cm(sg(R.h2)));
    box.textContent = '';
    box.appendChild(stat('r_u', R.objInf ? MINUS + '∞' : cm(nf(R.u)), 'out-u'));
    box.appendChild(stat('r_v', R.imgInf ? sg(R.v) : cm(sg(R.v)), 'out-v'));
    box.appendChild(stat('r_f', cm(sg(R.f)), 'out-f'));
    box.appendChild(stat('r_m', mTxt, 'out-m'));
    box.appendChild(stat('r_h', cm(nf(R.h)), 'out-h'));
    box.appendChild(stat('r_h2', h2Txt, 'out-h2'));
    if (!R.mirror) box.appendChild(stat('r_p', sg(R.power) + ' D', 'out-p'));

    var res = $('#results').dataset;
    res.dev = R.dev; res.row = R.row; res.u = R.u; res.v = R.v; res.m = R.m;
    res.real = R.real; res.inverted = R.inverted; res.size = R.size;

    var b = $('#badges'); b.textContent = '';
    b.appendChild(EDU.el('span', { class: 'badge ' + (R.real ? 'success' : 'accent'), id: 'b-nature', text: t(R.real ? 'nat_real' : 'nat_virtual') }));
    b.appendChild(EDU.el('span', { class: 'badge primary', id: 'b-orient', text: t(R.inverted ? 'nat_inverted' : 'nat_erect') }));
    b.appendChild(EDU.el('span', { class: 'badge', id: 'b-size', text: t('size_' + R.size) }));

    var p = $('#pos'); p.textContent = '';
    p.appendChild(EDU.el('dt', { text: t('r_obj_pos') })); p.appendChild(EDU.el('dd', { id: 'obj-pos', text: t(R.info.obj) }));
    p.appendChild(EDU.el('dt', { text: t('r_img_pos') })); p.appendChild(EDU.el('dd', { id: 'img-pos', text: t(R.info.img) }));

    var why = [];
    if (R.objInf) why.push('why_obj_inf');
    else if (R.imgInf) why.push('why_inf');
    else {
      why.push(R.mirror ? (R.real ? 'why_mirror_real' : 'why_mirror_virtual') : (R.real ? 'why_lens_real' : 'why_lens_virtual'));
      why.push(R.inverted ? 'why_m_neg' : 'why_m_pos');
      why.push(R.size === 'same' ? 'why_m_same' : (R.size === 'big' ? 'why_m_big' : 'why_m_small'));
    }
    var w = $('#why'); w.textContent = '';
    why.forEach(function (k) { w.appendChild(EDU.el('li', { text: t(k) })); });
  }

  function renderFormula() {
    var R = sol, f = R.f, u = R.u, box = $('#formula'), q;
    box.textContent = '';
    var head = function (k) { box.appendChild(EDU.el('div', { class: 'fh', dir: 'auto', text: t(k) })); };
    var line = function (s, cls) { box.appendChild(EDU.el('div', { class: cls || '', text: s })); };
    head(R.mirror ? 'form_mirror' : 'form_lens');
    line(R.mirror ? '1/v + 1/u = 1/f' : '1/v ' + MINUS + ' 1/u = 1/f');
    line(R.mirror ? '1/v = 1/f ' + MINUS + ' 1/u' : '1/v = 1/f + 1/u');
    if (R.objInf) {
      line('u = ' + MINUS + '∞  ⇒  1/u = 0');
      line('1/v = 1/f  ⇒  v = f = ' + cm(sg(f)), 'ans');
    } else {
      line('1/v = 1/' + par(f) + (R.mirror ? ' ' + MINUS + ' ' : ' + ') + '1/' + par(u));
      if (R.imgInf) line('1/v = 0  ⇒  v = ∞', 'ans');
      else {
        line('1/v = ' + fr(R.num, R.den));
        q = O.frac(R.num, R.den);
        line('v = ' + (Math.abs(q[0]) !== 1 ? fr(q[1], q[0]) + ' = ' : '') + cm(sg(R.v)), 'ans');
      }
    }
    head('form_mag');
    if (R.objInf) line('m ≈ 0');
    else if (R.imgInf) line('m = ∞');
    else {
      line(R.mirror ? 'm = ' + MINUS + 'v/u = ' + MINUS + par(R.v) + '/' + par(u) + ' = ' + sg(R.m) : 'm = v/u = ' + par(R.v) + '/' + par(u) + ' = ' + sg(R.m), 'ans');
      line('h′ = m × h = ' + par(R.m) + ' × ' + nf(R.h) + ' = ' + cm(sg(R.h2)));
    }
    if (!R.mirror) {
      head('form_power');
      line('P = 1/f = 100/f(cm) = 100/' + par(f) + ' = ' + sg(R.power) + ' D', 'ans');
    }
  }

  function renderTable() {
    var body = $('#ncert-body');
    body.textContent = '';
    $('#table-dev').textContent = t('dev_' + S.dev);
    O.ROWS[S.dev].forEach(function (row) {
      var cur = row.id === sol.row;
      var btn = EDU.el('button', { type: 'button', class: 'rl-rowbtn', id: 'rowbtn-' + row.id, text: t(row.obj), onclick: function () { placeRow(row.id); } });
      var tr = EDU.el('tr', { class: cur ? 'cur' : '', dataset: { row: row.id }, 'aria-current': cur ? 'true' : null },
        EDU.el('td', {}, btn), EDU.el('td', { text: t(row.img) }), EDU.el('td', { text: t('size_' + row.size) }),
        EDU.el('td', { text: t(row.real ? 'nature_ri' : 'nature_ve') }));
      tr.addEventListener('click', function (e) { if (e.target !== btn) placeRow(row.id); });
      body.appendChild(tr);
    });
  }
  function placeRow(id) {
    var u = O.placeU(S.dev, id, S.f);
    if (isFinite(u)) { S.inf = false; S.u = u; } else S.inf = true;
    update();
  }

  /* ---------- canvas ---------- */
  function palette() {
    if (printing) return { surface: '#ffffff', text: '#111111', muted: '#555555', border: '#bbbbbb', primary: '#0b4f5c', accent: '#d9501c',
      c1: '#0b7285', c2: '#e8590c', c3: '#5f3dc4', c4: '#2b8a3e', c5: '#c2255c', c7: '#1971c2' };
    var o = {};
    ['surface', 'text', 'muted', 'border', 'primary', 'accent', 'c1', 'c2', 'c3', 'c4', 'c5', 'c7'].forEach(function (k) { o[k] = EDU.css('--' + k); });
    return o;
  }
  function sizeCanvas() {
    var lab = $('#lab'), w = Math.max(200, Math.floor($('#stage').clientWidth) - 2), h;
    if (document.fullscreenElement === lab) {
      /* height of everything in the card except the canvas stays the same, so this does not feed back */
      var top = lab.getBoundingClientRect().top - lab.scrollTop, last = lab.lastElementChild.getBoundingClientRect().bottom;
      var other = (last - top) + 14 - (CH || 0);
      h = Math.max(240, Math.round(window.innerHeight - other - 6));
    }
    else h = Math.round(EDU.clamp(w * 0.5, 280, 520));
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    if (w === CW && h === CH && dpr === DPR) return;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px';
    CW = w; CH = h; DPR = dpr;
  }
  function draw() {
    if (!sol) return;
    sizeCanvas();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    viewInfo = D.draw(ctx, CW, CH, sol, { C: palette(), t: t, rays: S.rays, font: getComputedStyle(document.body).fontFamily, rtl: document.documentElement.dir === 'rtl' });
    var note = '';
    if (sol.objInf) note = t('note_point');
    else if (sol.imgInf) note = t('note_inf_img');
    else if (viewInfo.imgOff) note = t('note_off', { v: cm(sg(sol.v)) });
    var miss = false;
    $$('.rl-ray').forEach(function (b, i) {
      var gone = viewInfo.drawn.indexOf(i) < 0;
      b.classList.toggle('rl-miss', gone);
      if (gone && S.rays[i]) miss = true;
    });
    if (miss) note = (note ? note + ' ' : '') + t('ray_miss');
    $('#note').textContent = note;
    cv.setAttribute('aria-valuemin', '1');
    cv.setAttribute('aria-valuemax', String(O.uMax(S.f)));
    cv.setAttribute('aria-valuenow', String(S.inf ? O.uMax(S.f) : S.u));
    cv.setAttribute('aria-valuetext', (S.inf ? '∞' : cm(EDU.fmt(S.u))) + ', ' + t(sol.info.obj));
  }

  var dragging = false;
  function evX(e) { var r = cv.getBoundingClientRect(); return (e.clientX - r.left) * (CW / (r.width || CW)); }
  function moveTo(xw) {
    var u = clampInt(-xw, 1, O.uMax(S.f));
    if (u === S.u && !S.inf) return;
    S.u = u; S.inf = false; update();
  }
  cv.addEventListener('pointerdown', function (e) {
    if (!viewInfo) return;
    var xw = viewInfo.wx(evX(e));
    if (xw > -0.3) return;
    dragging = true;
    try { cv.setPointerCapture(e.pointerId); } catch (er) { }
    try { cv.focus({ preventScroll: true }); } catch (er) { }
    moveTo(xw);
    e.preventDefault();
  });
  cv.addEventListener('pointermove', function (e) { if (dragging && viewInfo) moveTo(viewInfo.wx(evX(e))); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { cv.addEventListener(ev, function () { dragging = false; }); });
  cv.addEventListener('keydown', function (e) {
    var k = e.key, u = S.inf ? O.uMax(S.f) : S.u, n = null;
    if (k === 'ArrowLeft' || k === 'ArrowUp') n = u + 1;
    else if (k === 'ArrowRight' || k === 'ArrowDown') n = u - 1;
    else if (k === 'PageUp') n = u + 5;
    else if (k === 'PageDown') n = u - 5;
    else if (k === 'Home') n = 1;
    else if (k === 'End') n = O.uMax(S.f);
    if (n === null) return;
    e.preventDefault();
    S.inf = false; S.u = clampInt(n, 1, O.uMax(S.f)); update();
  });

  /* ---------- controls ---------- */
  $$('.rl-dev').forEach(function (b) { b.addEventListener('click', function () { S.dev = b.dataset.dev; update(); }); });
  function setVal(key, val, from) {
    if (key === 'f') S.f = clampInt(val, O.F_MIN, O.F_MAX);
    else if (key === 'u') { S.u = clampInt(val, 1, O.uMax(S.f)); S.inf = false; }
    else S.h = clampHalf(val);
    update(from);
  }
  [['f', '#f-range', '#f-num'], ['u', '#u-range', '#u-num'], ['h', '#h-range', '#h-num']].forEach(function (p) {
    var r = $(p[1]), n = $(p[2]);
    r.addEventListener('input', function () { setVal(p[0], r.value); });
    n.addEventListener('input', function () {
      var v = parseFloat(n.value);
      if (n.value === '' || !isFinite(v) || v < +n.min || v > +n.max) return;
      setVal(p[0], v, p[2]);
    });
    n.addEventListener('change', function () { syncInputs(); });
  });
  $('#far').addEventListener('click', function () { S.inf = !S.inf; update(); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#lab')); });
  document.addEventListener('fullscreenchange', function () { setTimeout(draw, 80); });
  $('#png-btn').addEventListener('click', function () { EDU.downloadCanvas(cv, 'ray-diagram-' + S.dev.replace('_', '-') + '.png'); });
  $('#print-btn').addEventListener('click', function () { window.print(); });
  window.addEventListener('beforeprint', function () { printing = true; draw(); });
  window.addEventListener('afterprint', function () { printing = false; draw(); });
  $('#reset-btn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    S = JSON.parse(JSON.stringify(DEF));
    score = { ok: 0, n: 0 }; store.set('score', score);
    newQuestion(); update();
  });
  if (window.ResizeObserver) new ResizeObserver(function () { draw(); }).observe($('#stage'));
  else window.addEventListener('resize', draw);
  EDU.onTheme(draw);

  /* ---------- quiz ---------- */
  var Q = store.get('quiz', null), score = store.get('score', { ok: 0, n: 0 }), ans = {}, checked = false;
  if (!score || !isFinite(score.ok) || !isFinite(score.n)) score = { ok: 0, n: 0 };
  function validQ(q) { return q && O.QUIZ_POS[q.dev] && O.ROWS[q.dev] && q.answer && Array.isArray(q.order) && isFinite(q.f); }
  if (!validQ(Q)) Q = O.quiz();
  function newQuestion() { Q = O.quiz(); ans = {}; checked = false; store.set('quiz', Q); renderQuiz(); }
  function renderQuiz() {
    $('#q-dev').textContent = t('dev_' + Q.dev);
    $('#q-text').textContent = Q.u == null ? t('quiz_q_inf', { f: cm(EDU.fmt(Q.f)) }) : t('quiz_q', { u: cm(EDU.fmt(Q.u)), f: cm(EDU.fmt(Q.f)) });
    var sel = $('#q-pos');
    sel.textContent = '';
    sel.appendChild(EDU.el('option', { value: '', text: t('q_choose') }));
    Q.order.forEach(function (k) { sel.appendChild(EDU.el('option', { value: k, text: t(k) })); });
    sel.value = ans.pos || '';
    $$('#quiz [data-k]').forEach(function (b) { b.setAttribute('aria-pressed', ans[b.dataset.k] === b.dataset.v ? 'true' : 'false'); });
    $('#q-score').textContent = t('q_score', { a: EDU.fmt(score.ok), b: EDU.fmt(score.n) });
    showFeedback();
  }
  function showFeedback() {
    var fb = $('#q-feedback'), sel = $('#q-pos');
    $$('#quiz .is-right, #quiz .is-wrong').forEach(function (e) { e.classList.remove('is-right', 'is-wrong'); });
    fb.textContent = ''; fb.className = ''; delete fb.dataset.right;
    if (!checked) return;
    var right = 0;
    ['pos', 'nat', 'ori', 'size'].forEach(function (k) { if (ans[k] === Q.answer[k]) right++; });
    sel.classList.add(ans.pos === Q.answer.pos ? 'is-right' : 'is-wrong');
    $$('#quiz [data-k]').forEach(function (b) {
      var k = b.dataset.k, v = b.dataset.v;
      if (v === Q.answer[k]) b.classList.add('is-right');
      else if (ans[k] === v) b.classList.add('is-wrong');
    });
    var row = O.rowInfo(Q.dev, Q.row);
    fb.className = 'callout ' + (right === 4 ? 'success' : 'danger');
    fb.dataset.right = right;
    [right === 4 ? t('q_right') : t('q_wrong', { n: right }),
      t('q_hint', { f: cm(EDU.fmt(Q.f)), c: cm(EDU.fmt(2 * Q.f)) }),
      t('th_obj') + ': ' + t(row.obj),
      t('th_img') + ': ' + t(row.img),
      t('th_size') + ': ' + t('size_' + row.size) + ' · ' + t(row.real ? 'nature_ri' : 'nature_ve')
    ].forEach(function (s) { fb.appendChild(EDU.el('p', { text: s })); });
  }
  $$('#quiz [data-k]').forEach(function (b) {
    b.addEventListener('click', function () { ans[b.dataset.k] = b.dataset.v; if (checked) { checked = false; } renderQuiz(); });
  });
  $('#q-pos').addEventListener('change', function () { ans.pos = $('#q-pos').value || undefined; checked = false; showFeedback(); });
  $('#q-check').addEventListener('click', function () {
    ans.pos = $('#q-pos').value || undefined;
    if (!ans.pos || !ans.nat || !ans.ori || !ans.size) {
      var fb = $('#q-feedback'); fb.className = 'callout warning'; fb.textContent = t('q_need'); return;
    }
    if (!Q.done) {
      var right = ['pos', 'nat', 'ori', 'size'].filter(function (k) { return ans[k] === Q.answer[k]; }).length;
      score.n++; if (right === 4) score.ok++;
      Q.done = true; store.set('score', score); store.set('quiz', Q);
    }
    checked = true; renderQuiz();
  });
  $('#q-next').addEventListener('click', newQuestion);
  $('#q-show').addEventListener('click', function () {
    S.dev = Q.dev; S.f = Q.f;
    if (Q.u == null) S.inf = true; else { S.inf = false; S.u = Q.u; }
    update();
    $('#lab').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- everyday uses ---------- */
  var USES = [
    { k: 'torch', icon: '🔦', dev: 'concave_mirror', row: 'at_f' },
    { k: 'solar', icon: '☀️', dev: 'concave_mirror', row: 'inf' },
    { k: 'shave', icon: '🪞', dev: 'concave_mirror', row: 'p_f' },
    { k: 'rear', icon: '🚗', dev: 'convex_mirror', at: 2.5 },
    { k: 'mag', icon: '🔍', dev: 'convex_lens', row: 'f1_o' },
    { k: 'proj', icon: '📽️', dev: 'convex_lens', row: 'f1_2f1' },
    { k: 'cam', icon: '📷', dev: 'convex_lens', row: 'beyond_2f1' },
    { k: 'spec', icon: '👓', dev: 'concave_lens', at: 2 }
  ];
  function renderUses() {
    var box = $('#uses');
    box.textContent = '';
    USES.forEach(function (x) {
      box.appendChild(EDU.el('div', { class: 'rl-use' },
        EDU.el('h3', {}, EDU.el('span', { 'aria-hidden': 'true', text: x.icon }), EDU.el('span', { text: t('use_' + x.k + '_t') })),
        EDU.el('p', { text: t('use_' + x.k + '_d') }),
        EDU.el('button', { type: 'button', class: 'btn btn-sm', id: 'use-' + x.k, text: t('use_show'), onclick: function () {
          S.dev = x.dev;
          if (x.row) { var u = O.placeU(x.dev, x.row, S.f); if (isFinite(u)) { S.inf = false; S.u = u; } else S.inf = true; }
          else { S.inf = false; S.u = Math.round(x.at * S.f); }
          update();
          $('#lab').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } })));
    });
  }

  EDU.onLang(function () { raysKey = ''; update(); renderUses(); renderQuiz(); });
  update();
  renderUses();
  renderQuiz();

  /* hooks for the automated test */
  window.RayLab = {
    get state() { return S; }, get sol() { return sol; }, quiz: function () { return Q; },
    toPx: function (xw) { return viewInfo ? viewInfo.X(xw) : null; }, axisY: function () { return viewInfo ? viewInfo.y0 : null; }
  };
})();
