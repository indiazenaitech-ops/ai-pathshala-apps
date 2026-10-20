/* Acids, Bases & pH Lab: UI and state. Chemistry maths in engine.js (window.PHLAB), drawing in view.js (window.PHVIEW),
   sentences in strings.js / content.js. State is saved in EDU.store('acid-base-ph-lab') and cleaned on load. */
(function () {
  'use strict';
  var SLUG = 'acid-base-ph-lab';
  var store = EDU.store(SLUG);
  var P = window.PHLAB, V = window.PHVIEW;
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t, esc = EDU.esc;
  var TABS = ['scale', 'ind', 'titr', 'salts', 'life', 'quiz'];
  var SUB_IDS = P.SUBS.map(function (s) { return s.id; });
  var IND_IDS = P.INDS.map(function (i) { return i.id; });
  var FLASK_INDS = ['phenolphthalein', 'methyl_orange', 'universal', 'china_rose'];
  var GROUPS = ['food', 'body', 'nature', 'home', 'lab'];
  var GAME_N = 10, QN = P.QUIZ.length;
  /* pH at which each flask indicator has clearly changed (the "end point" the auto button stops at) and its colour-change band */
  var END = { phenolphthalein: 8.2, methyl_orange: 4.4, universal: 6.5, china_rose: 7.5 };
  var BAND = { phenolphthalein: [8.2, 10], methyl_orange: [3.1, 4.4], universal: null, china_rose: [6.5, 7.5] };

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- content (current language, English as fallback) ---------------- */
  function content() { var c = window.APP_CONTENT || {}; return c[EDU.lang] || c.en || {}; }
  function cx(key) { var c = content(), e = (window.APP_CONTENT || {}).en || {}; return c[key] !== undefined ? c[key] : e[key]; }

  /* ---------------- state ---------------- */
  function num(v, lo, hi, d) { v = Number(v); if (!isFinite(v)) v = d; return Math.min(hi, Math.max(lo, v)); }
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function defaults() {
    return { tab: 'scale', sub: 'lemon', ind: { sub: 'lemon', ind: 'blue_litmus' }, game: null, bestGame: null,
      titr: { va: 25, ca: 0.1, cb: 0.1, vb: 0, ind: 'phenolphthalein' }, salts: {}, saltsReveal: false, quiz: null, bestQuiz: null };
  }
  function cleanGame(g) {
    if (!g || typeof g !== 'object' || !Array.isArray(g.rounds) || g.rounds.length !== GAME_N) return null;
    if (!(Number(g.i) >= 0 && Number(g.i) <= GAME_N - 1)) return null;
    var rounds = g.rounds.map(function (p) { return Math.round(num(p, 0, 14, 7)); });
    var i = Math.round(num(g.i, 0, GAME_N - 1, 0));
    return { rounds: rounds, i: i, score: Math.round(num(g.score, 0, i + 1, 0)), picked: g.picked === null || g.picked === undefined ? null : Math.round(num(g.picked, 0, 14, 0)), done: !!g.done, chart: !!g.chart };
  }
  function cleanQuiz(q) {
    if (!q || typeof q !== 'object') return null;
    if (!(Number(q.i) >= 0 && Number(q.i) <= QN - 1)) return null;   /* an impossible question number: start a fresh quiz */
    var i = Math.round(num(q.i, 0, QN - 1, 0));
    return { i: i, score: Math.round(num(q.score, 0, i + 1, 0)), picked: q.picked === null || q.picked === undefined ? null : Math.round(num(q.picked, 0, 3, 0)), done: !!q.done };
  }
  function load() {
    var d = defaults(), s = store.get('state', null);
    if (!s || typeof s !== 'object') return d;
    var ind = s.ind && typeof s.ind === 'object' ? s.ind : {};
    var tr = s.titr && typeof s.titr === 'object' ? s.titr : {};
    var salts = {};
    if (s.salts && typeof s.salts === 'object') P.SALTS.forEach(function (x) { var v = s.salts[x.id]; if (['acidic', 'basic', 'neutral'].indexOf(v) >= 0) salts[x.id] = v; });
    var best = function (v, max) { return typeof v === 'number' && v >= 0 && v <= max ? Math.round(v) : null; };
    return {
      tab: oneOf(s.tab, TABS, 'scale'),
      sub: oneOf(s.sub, SUB_IDS, 'lemon'),
      ind: { sub: oneOf(ind.sub, SUB_IDS, 'lemon'), ind: oneOf(ind.ind, IND_IDS, 'blue_litmus') },
      game: cleanGame(s.game), bestGame: best(s.bestGame, GAME_N),
      titr: { va: num(tr.va, 1, 100, 25), ca: num(tr.ca, 0.01, 2, 0.1), cb: num(tr.cb, 0.01, 2, 0.1), vb: num(tr.vb, 0, 400, 0), ind: oneOf(tr.ind, FLASK_INDS, 'phenolphthalein') },
      salts: salts, saltsReveal: !!s.saltsReveal,
      quiz: cleanQuiz(s.quiz), bestQuiz: best(s.bestQuiz, QN)
    };
  }
  var S = load();
  function save() { store.set('state', S); }

  /* ---------------- formatting ---------------- */
  function fmt(n, d) { return EDU.fmt(n, { maximumFractionDigits: d === undefined ? 2 : d }); }
  function f2(n) { return EDU.fmt(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function ltr(s) { return '<span class="ltr">' + esc(s) + '</span>'; }
  /* t() with the values escaped and kept left-to-right (numbers and formulas inside Urdu sentences) */
  function th(key, vars) {
    var v = {};
    Object.keys(vars || {}).forEach(function (k) { v[k] = vars[k] && vars[k].html !== undefined ? vars[k].html : ltr(vars[k]); });
    return t(key, v);
  }
  function plain(s) { return { html: esc(s) }; }
  function sup(n) { return String(n).replace(/[0-9-]/g, function (d) { return d === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'.charAt(+d); }); }
  function sciText(x) { var s = P.sci(x); return (s.m === 1 ? '1' : fmt(s.m, 2)) + ' × 10' + sup(s.e); }
  function concHtml(x) {
    var s = P.sci(x), out = '<span class="formula">' + sciText(x) + '</span> ' + esc(t('work_moll'));
    if (s.e >= -4 && s.e <= 0) out += ' <span class="muted">(= ' + ltr(fmt(x, 6)) + ' ' + esc(t('work_moll')) + ')</span>';
    return out;
  }
  function small(x) { if (x === 0) return '0'; if (x >= 1e-4) return fmt(x, 6); return sciText(x); }
  function subName(id) { return t('sub_' + id); }
  function colorName(key) { return t('col_' + key); }
  function natureKey(ph) { return P.nature(ph); }

  /* ---------------- tabs ---------------- */
  function showTab(name) {
    S.tab = name; save();
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.id === 'tab-' + name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#' + b.getAttribute('data-panel')).hidden = !on;
    });
    if (name === 'titr') drawCurve();
  }
  $$('#tabs [role="tab"]').forEach(function (b, i, all) {
    b.addEventListener('click', function () { showTab(b.id.slice(4)); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      if (document.documentElement.dir === 'rtl') d = -d;
      var nx = all[(i + d + all.length) % all.length]; nx.focus(); nx.click();
    });
  });

  /* ================= pH SCALE ================= */
  function renderBar() {
    var bar = $('#ph-bar'); bar.innerHTML = '';
    for (var i = 0; i <= 14; i++) bar.appendChild(el('span', { class: 'ph-seg', style: { background: P.UI_HEX[i], color: P.uiColor(i).ink }, text: EDU.fmt(i) }));
    var marks = $('#ph-marks'); marks.innerHTML = '';
    P.SUBS.forEach(function (s, i) {
      var u = P.uiColor(s.ph);
      marks.appendChild(el('button', { type: 'button', class: 'ph-mark' + (i % 2 ? ' up' : '') + (s.id === S.sub ? ' on' : ''), id: 'mark-' + s.id,
        style: { left: ((s.ph + 0.5) / 15 * 100) + '%', '--mk': u.hex }, 'aria-label': t('mark_aria', { name: subName(s.id), ph: fmt(s.ph) }), 'aria-pressed': String(s.id === S.sub),
        text: s.emoji, onclick: function () { selectSub(s.id); } }));
    });
  }
  function renderSubList() {
    var box = $('#sub-list'); box.innerHTML = '';
    GROUPS.forEach(function (g) {
      box.appendChild(el('div', { class: 'sub-group', text: t('group_' + g) }));
      var grid = el('div', { class: 'sub-grid' });
      P.SUBS.filter(function (s) { return s.group === g; }).forEach(function (s) {
        var u = P.uiColor(s.ph);
        grid.appendChild(el('button', { type: 'button', class: 'sub-chip', id: 'sub-' + s.id, 'aria-pressed': String(s.id === S.sub), style: { '--pk': u.hex, '--pk-ink': u.ink },
          onclick: function () { selectSub(s.id, true); } },
          el('span', { class: 'emoji', 'aria-hidden': 'true', text: s.emoji }),
          el('span', { class: 'nm', text: subName(s.id) }),
          el('span', { class: 'ph ltr', text: 'pH ' + fmt(s.ph) })));
      });
      box.appendChild(grid);
    });
  }
  function selectSub(id, scroll) {
    S.sub = id; save();
    $$('.ph-mark').forEach(function (m) { var on = m.id === 'mark-' + id; m.classList.toggle('on', on); m.setAttribute('aria-pressed', String(on)); });
    $$('.sub-chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c.id === 'sub-' + id)); });
    renderDetail();
    if (scroll) {
      var d = $('#sub-detail'), r = d.getBoundingClientRect(), vh = window.innerHeight || 800;
      if (r.top > vh - 120) { try { d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { d.scrollIntoView(); } }
    }
  }
  function renderDetail() {
    var s = P.SUB_BY[S.sub], box = $('#sub-detail');
    var nat = natureKey(s.ph), u = P.uiColor(s.ph), h = P.hConc(s.ph), oh = P.ohConc(s.ph);
    box.innerHTML = '';
    box.setAttribute('data-sub', s.id); box.setAttribute('data-ph', String(s.ph)); box.setAttribute('data-nature', nat); box.setAttribute('data-h', String(h));
    var left = el('div', { class: 'stack' });
    left.appendChild(el('h2', { class: 'mb0' }, el('span', { class: 'emoji', 'aria-hidden': 'true', text: s.emoji + ' ' }), subName(s.id)));
    left.appendChild(el('div', { class: 'ph-big' },
      el('span', { class: 'disc', style: { background: u.hex }, 'aria-hidden': 'true' }),
      el('div', {}, el('div', { class: 'muted small', text: t('ph_about') }), el('div', { class: 'num', id: 'detail-ph', text: 'pH ' + fmt(s.ph) }))));
    left.appendChild(el('div', { class: 'row' },
      el('span', { class: 'badge nat-' + nat, id: 'detail-nature', style: { fontSize: '.95rem', padding: '4px 12px' }, text: t('nature_' + nat) }),
      el('span', { class: 'muted', text: t('strength_' + P.strength(s.ph)) })));
    left.appendChild(el('p', { class: 'mb0', text: (cx('facts') || {})[s.id] || '' }));
    var conc = el('div', { class: 'conc' });
    conc.appendChild(el('p', { class: 'small muted', text: t('h_conc') }));
    conc.appendChild(el('p', { html: '<span class="formula">[H⁺]</span> = ' + concHtml(h) }));
    conc.appendChild(el('p', { class: 'small muted', text: t('oh_conc') }));
    conc.appendChild(el('p', { html: '<span class="formula">[OH⁻]</span> = ' + concHtml(oh) }));
    conc.appendChild(el('p', { class: 'small mb0', html: th('conc_rule', { ph: fmt(s.ph) }) }));
    left.appendChild(conc);

    var right = el('div', { class: 'stack' });
    var cmps = P.comparisons(s.id);
    if (cmps.length) {
      right.appendChild(el('h3', { class: 'h-sec', text: t('compare_title') }));
      right.appendChild(el('ul', { class: 'cmp', id: 'cmp' }, cmps.map(function (c) {
        var n = c.exact ? fmt(c.factor, 0) : (c.factor < 10 ? fmt(c.factor, 1) : fmt(Math.round(c.factor), 0));
        var nTxt = c.exact ? n : t('cmp_about', { n: n });
        return el('li', { dataset: { with: c.id, factor: String(Math.round(c.factor * 1000) / 1000) }, html: th('cmp_' + c.kind, { n: nTxt, name: plain(subName(c.id)), ph: fmt(c.ph) }) });
      })));
      right.appendChild(el('p', { class: 'small muted', text: t('cmp_rule') }));
    }
    right.appendChild(el('h3', { class: 'h-sec', text: t('ind_table_title') }));
    var tb = el('tbody');
    P.INDS.forEach(function (ind) {
      var r = P.indicate(ind.id, s.ph);
      tb.appendChild(el('tr', { dataset: { ind: ind.id, color: r.color, change: r.change } },
        el('td', { text: t('ind_' + ind.id) }),
        el('td', {}, el('span', { class: 'res' }, el('span', { class: 'swatch', style: { background: r.hex }, 'aria-hidden': 'true' }), resultText(ind.id, r)))));
    });
    right.appendChild(el('div', { class: 'scroll-x' }, el('table', { class: 'table ind-tbl' }, el('thead', {}, el('tr', {}, el('th', { text: t('col_indicator') }), el('th', { text: t('col_result') }))), tb)));
    box.appendChild(el('div', { class: 'detail-grid' }, left, right));
  }
  function resultText(indId, r) {
    var c = colorName(r.color);
    if (r.change === 'yes') return indId === 'universal' ? t('res_shows', { color: c }) : t('res_turns', { color: c });
    if (r.change === 'faint') return t('res_faint', { color: c });
    return indId === 'universal' ? t('res_shows', { color: c }) : t('res_stays', { color: c });
  }

  /* ================= INDICATOR LAB ================= */
  function renderIndLab() {
    var sel = $('#ind-sub'); sel.innerHTML = '';
    P.SUBS.forEach(function (s) { sel.appendChild(el('option', { value: s.id, text: s.emoji + ' ' + subName(s.id) + ' (pH ' + fmt(s.ph) + ')' })); });
    sel.value = S.ind.sub;
    var chips = $('#ind-chips'); chips.innerHTML = '';
    P.INDS.forEach(function (ind) {
      chips.appendChild(el('button', { type: 'button', class: 'chip', id: 'ind-' + ind.id, 'aria-pressed': String(ind.id === S.ind.ind), text: t('ind_' + ind.id),
        onclick: function () { S.ind.ind = ind.id; save(); renderIndLab(); } }));
    });
    var s = P.SUB_BY[S.ind.sub], ind = P.IND_BY[S.ind.ind], r = P.indicate(ind.id, s.ph), nat = natureKey(s.ph);
    var base = P.HEX[ind.base] || '#ccc';
    $('#tube').innerHTML = V.tube({
      liquid: ind.form === 'solution' ? r.hex : '#dbe9f5', form: ind.form, stripBase: base, stripResult: r.hex, dropHex: ind.id === 'universal' ? P.HEX.green : (ind.base === 'colourless' ? '#c9dcef' : base),
      label: t('tube_label', { name: subName(s.id), ind: t('ind_' + ind.id) })
    });
    var res = $('#ind-result'); res.innerHTML = '';
    res.setAttribute('data-color', r.color); res.setAttribute('data-change', r.change); res.setAttribute('data-sub', s.id); res.setAttribute('data-ind', ind.id);
    res.appendChild(el('span', { class: 'swatch', style: { background: r.hex }, 'aria-hidden': 'true' }));
    res.appendChild(el('span', { text: t('ind_' + ind.id) + ': ' + resultText(ind.id, r) }));
    $('#ind-because').innerHTML = th('ind_because', { name: plain(subName(s.id)), nature: plain(t('nature_' + nat).toLowerCase()), ph: fmt(s.ph) });
    $('#ind-why').textContent = (cx('ind_why') || {})[ind.id] || '';
  }
  $('#ind-sub').addEventListener('change', function () { S.ind.sub = oneOf(this.value, SUB_IDS, 'lemon'); save(); renderIndLab(); });

  /* ================= COLOUR GAME ================= */
  function startGame() { S.game = { rounds: P.gameRounds(GAME_N), i: 0, score: 0, picked: null, done: false, chart: S.game ? S.game.chart : false }; save(); renderGame(); }
  function answerGame(p) {
    var g = S.game; if (!g || g.done || g.picked !== null) return;
    g.picked = p;
    if (p === g.rounds[g.i]) g.score++;
    save(); renderGame();
    var nx = $('#game-next'); if (nx) nx.focus();
  }
  function nextGame() {
    var g = S.game; if (!g || g.picked === null) return;
    if (g.i + 1 >= GAME_N) { g.done = true; if (S.bestGame === null || g.score > S.bestGame) S.bestGame = g.score; }
    else { g.i++; g.picked = null; }
    save(); renderGame();
  }
  function chartMini() {
    return el('div', { class: 'chart-mini', 'aria-hidden': 'true' }, P.UI_HEX.map(function (hx, i) { return el('span', { style: { background: hx, color: P.uiColor(i).ink }, text: String(i) }); }));
  }
  function renderGame() {
    var g = S.game, box = $('#game'); box.innerHTML = '';
    box.appendChild(el('h2', { class: 'mb0', text: t('game_title') }));
    box.setAttribute('data-i', g ? String(g.i) : ''); box.setAttribute('data-score', g ? String(g.score) : ''); box.setAttribute('data-done', g && g.done ? '1' : '0');
    if (!g) {
      box.appendChild(el('p', { class: 'muted mb0', text: t('game_intro') }));
      box.appendChild(chartMini());
      box.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'game-start', onclick: startGame }, '🎮 ', t('game_start')),
        S.bestGame !== null ? el('span', { class: 'pill', html: th('game_best', { n: fmt(S.bestGame) + ' / ' + fmt(GAME_N) }) }) : null));
      box.removeAttribute('data-ph');
      return;
    }
    if (g.done) {
      var pct = g.score / GAME_N;
      box.appendChild(el('div', { class: 'final-score', id: 'game-final', dataset: { score: String(g.score) }, text: fmt(g.score) + ' / ' + fmt(GAME_N) }));
      box.appendChild(el('p', { class: 'mb0', html: th('game_done', { score: fmt(g.score), total: fmt(GAME_N) }) }));
      box.appendChild(el('p', { class: 'callout ' + (pct === 1 ? 'success' : pct >= 0.6 ? '' : 'warning'), text: t(pct === 1 ? 'game_perfect' : pct >= 0.6 ? 'game_good' : 'game_keep') }));
      if (S.bestGame !== null) box.appendChild(el('p', { class: 'muted', id: 'game-best', html: th('game_best', { n: fmt(S.bestGame) + ' / ' + fmt(GAME_N) }) }));
      box.appendChild(chartMini());
      box.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'game-again', onclick: startGame }, '🔁 ', t('game_again'))));
      return;
    }
    var ph = g.rounds[g.i], u = P.uiColor(ph);
    box.setAttribute('data-ph', String(ph));
    box.appendChild(el('div', { class: 'game-top' },
      el('p', { class: 'muted mb0 small', text: t('game_intro') }),
      el('div', { class: 'row' },
        el('span', { class: 'pill', id: 'game-progress', html: th('game_round', { n: fmt(g.i + 1), total: fmt(GAME_N) }) }),
        el('span', { class: 'pill' }, t('score') + ': ', el('b', { id: 'game-score', text: fmt(g.score) })))));
    box.appendChild(el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span', { style: { width: Math.round((g.i + (g.picked !== null ? 1 : 0)) / GAME_N * 100) + '%' } })));
    box.appendChild(el('div', { class: 'game-swatch', id: 'game-swatch', role: 'img', 'aria-label': t('game_swatch_aria'), style: { background: u.hex, color: u.ink } }, g.picked !== null ? el('b', { class: 'ltr', text: 'pH ' + fmt(ph) }) : null));
    box.appendChild(el('p', { class: 'lbl mb0', text: t('game_pick') }));
    var keys = el('div', { class: 'ph-keys', id: 'ph-keys' });
    for (var i = 0; i <= 14; i++) (function (p) {
      var cls = g.picked !== null ? (p === ph ? 'hit' : p === g.picked ? 'miss' : '') : '';
      keys.appendChild(el('button', { type: 'button', id: 'ph-key-' + p, class: cls, disabled: g.picked !== null, 'aria-pressed': String(g.picked === p), text: EDU.fmt(p), onclick: function () { answerGame(p); } }));
    })(i);
    box.appendChild(keys);
    if (g.picked !== null) {
      var right = g.picked === ph, near = Math.abs(g.picked - ph) === 1;
      box.appendChild(el('div', { class: 'stack', id: 'game-reveal', dataset: { right: right ? '1' : '0' } },
        el('p', { class: 'verdict ' + (right ? 'ok' : near ? 'near' : 'bad'), id: 'game-verdict', html: th(right ? 'game_correct' : near ? 'game_close' : 'game_wrong', { ph: fmt(ph), color: plain(colorName(u.key)) }) }),
        el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'game-next', onclick: nextGame }, t('next'), ' ', el('span', { 'aria-hidden': 'true', text: document.documentElement.dir === 'rtl' ? '←' : '→' })))));
    }
    var chartBtn = el('button', { type: 'button', class: 'btn btn-sm', id: 'game-chart', 'aria-pressed': String(g.chart), text: t(g.chart ? 'game_hide_chart' : 'game_chart'), onclick: function () { g.chart = !g.chart; save(); renderGame(); } });
    box.appendChild(el('div', { class: 'row' }, chartBtn));
    if (g.chart) box.appendChild(chartMini());
  }

  /* ================= TITRATION ================= */
  var auto = 0;
  function titr() { return P.titration(S.titr.va, S.titr.ca, S.titr.vb, S.titr.cb); }
  function vMax() { var r = titr(), v = isFinite(r.vEq) ? r.vEq * 2 : 50; v = Math.max(10, Math.min(400, Math.ceil(v / 5) * 5)); return v; }
  function flaskResult(r) { return P.indicate(S.titr.ind, r.ph); }
  function setVb(v) { S.titr.vb = num(v, 0, vMax(), 0); S.titr.vb = Math.round(S.titr.vb * 100) / 100; save(); renderTitr(); }
  function stopAuto() { if (auto) { clearInterval(auto); auto = 0; } $('#t-auto').disabled = false; $('#flask').classList.remove('dropping'); }
  function renderTitr() {
    var T = S.titr, r = titr(), vm = vMax(), fr = flaskResult(r);
    $('#t-va').value = String(T.va); $('#t-ca').value = String(T.ca); $('#t-cb').value = String(T.cb);
    var sel = $('#t-ind'); sel.innerHTML = '';
    FLASK_INDS.forEach(function (id) { sel.appendChild(el('option', { value: id, text: t('ind_' + id) })); });
    sel.value = T.ind;
    $('#t-vb').max = String(vm); $('#t-vb').value = String(Math.min(T.vb, vm)); $('#t-vb-num').max = String(vm); $('#t-vb-num').value = String(T.vb);
    /* flask + readout */
    var dropping = !!auto;
    $('#flask').innerHTML = V.flask({ liquid: fr.color === 'colourless' ? '#dbe9f5' : fr.hex, level: 0.35 + 0.55 * (T.va + T.vb) / (T.va + vm), burette: 1 - Math.min(T.vb, vm) / vm, dropping: dropping, dropHex: '#bcd5ee', label: t('titr_flask_aria', { color: colorName(fr.color) }) });
    var phEl = $('#t-ph'); phEl.textContent = f2(r.ph); phEl.setAttribute('data-ph', r.ph.toFixed(2)); phEl.setAttribute('data-vb', String(T.vb)); phEl.setAttribute('data-color', fr.color);
    var st = $('#t-state'); st.textContent = t('titr_state_' + r.kind); st.className = 'ph-state ' + r.kind; st.setAttribute('data-kind', r.kind);
    var hint = $('#t-hint'), diff = r.vEq - T.vb;
    if (r.ph >= END[T.ind] && T.vb <= r.vEq * 1.02 + 0.1) hint.innerHTML = '<b>' + esc(t('titr_endpoint')) + '</b>';
    else if (diff > 1e-9) hint.innerHTML = th('titr_need_more', { v: fmt(diff, 2) });
    else if (diff < -1e-9) hint.innerHTML = th('titr_over', { v: fmt(-diff, 2) });
    else hint.innerHTML = '';
    var veq = $('#t-veq'); veq.innerHTML = th('titr_veq', { va: fmt(T.va), ca: fmt(T.ca), cb: fmt(T.cb), v: fmt(r.vEq, 2) }); veq.setAttribute('data-veq', String(Math.round(r.vEq * 1000) / 1000));
    /* the maths */
    var tb = $('#work tbody'); tb.innerHTML = '';
    function row(label, html, id) { tb.appendChild(el('tr', {}, el('td', { text: label }), el('td', { id: id, html: html }))); }
    row(t('work_na'), ltr(fmt(T.ca) + ' × ' + fmt(T.va) + '/1000 = ' + small(r.nA)) + ' ' + esc(t('work_mol')), 'w-na');
    row(t('work_nb'), ltr(fmt(T.cb) + ' × ' + fmt(T.vb) + '/1000 = ' + small(r.nB)) + ' ' + esc(t('work_mol')), 'w-nb');
    row(t('work_left'), r.kind === 'equal' ? esc(t('work_none')) : '<span class="formula">' + (r.kind === 'acid' ? 'H⁺' : 'OH⁻') + '</span> ' + ltr(small(r.excess)) + ' ' + esc(t('work_mol')), 'w-left');
    row(t('work_vtot'), ltr(fmt(T.va + T.vb, 2) + ' mL = ' + small(r.vTot)) + ' ' + esc(t('work_l')), 'w-vtot');
    row(t('work_conc'), r.kind === 'equal' ? '–' : ltr(small(r.excess) + ' ÷ ' + small(r.vTot) + ' = ' + sciText(r.conc)) + ' ' + esc(t('work_moll')), 'w-conc');
    row(t('work_ph'), '<b>' + ltr(f2(r.ph)) + '</b>', 'w-ph');
    $('#work-note').textContent = t('work_note_' + r.kind);
    drawCurve();
  }
  function drawCurve() {
    if ($('#panel-titr').hidden) return;
    var T = S.titr, r = titr(), vm = vMax(), fr = flaskResult(r);
    V.curve($('#curve'), {
      pts: P.curve(T.va, T.ca, T.cb, vm, 300), vMax: vm, now: { vb: T.vb, ph: r.ph }, vEq: r.vEq, band: BAND[T.ind], bandHex: P.indicate(T.ind, 14).hex,
      colors: { text: EDU.css('--text'), muted: EDU.css('--muted'), grid: EDU.css('--border'), surface: EDU.css('--surface'), primary: EDU.css('--primary'), accent: EDU.css('--accent'), success: EDU.css('--success') },
      labels: { x: t('curve_x'), y: t('curve_y'), now: t('curve_now'), end: t('curve_end') }, font: getComputedStyle(document.body).fontFamily
    });
  }
  function paramInput(id, key, lo, hi) {
    $(id).addEventListener('change', function () { stopAuto(); S.titr[key] = num(this.value, lo, hi, S.titr[key]); S.titr.vb = Math.min(S.titr.vb, 400); save(); renderTitr(); });
  }
  paramInput('#t-va', 'va', 1, 100); paramInput('#t-ca', 'ca', 0.01, 2); paramInput('#t-cb', 'cb', 0.01, 2);
  $('#t-ind').addEventListener('change', function () { stopAuto(); S.titr.ind = oneOf(this.value, FLASK_INDS, 'phenolphthalein'); save(); renderTitr(); });
  $('#t-vb').addEventListener('input', function () { stopAuto(); setVb(this.value); });
  $('#t-vb-num').addEventListener('change', function () { stopAuto(); setVb(this.value); });
  $('#t-drop').addEventListener('click', function () { stopAuto(); setVb(S.titr.vb + 0.05); });
  $('#t-1ml').addEventListener('click', function () { stopAuto(); setVb(S.titr.vb + 1); });
  $('#t-5ml').addEventListener('click', function () { stopAuto(); setVb(S.titr.vb + 5); });
  $('#t-empty').addEventListener('click', function () { stopAuto(); setVb(0); });
  $('#t-auto').addEventListener('click', function () {
    stopAuto();
    var r0 = titr(); if (r0.ph >= END[S.titr.ind]) return;
    $('#t-auto').disabled = true;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    auto = setInterval(function () {
      var r = titr(), step = S.titr.vb < r.vEq - 1.5 ? 0.5 : 0.05;
      S.titr.vb = Math.round((S.titr.vb + step) * 100) / 100;
      var done = titr().ph >= END[S.titr.ind] || S.titr.vb >= vMax();
      if (done) { save(); stopAuto(); renderTitr(); return; }
      save(); renderTitr();
    }, reduce ? 10 : 70);
  });

  function renderStories() {
    var box = $('#stories'); box.innerHTML = '';
    (cx('stories') || []).forEach(function (st, i) {
      var bar = el('div', { class: 'mini-bar', 'aria-hidden': 'true' },
        el('span', { class: 'mini-pin ghost', style: { left: (st.before / 14 * 100) + '%' }, text: 'pH ' + fmt(st.before) }),
        el('span', { class: 'mini-pin', id: 'story-pin-' + i, style: { left: (st.before / 14 * 100) + '%' }, text: 'pH ' + fmt(st.before) }));
      box.appendChild(el('div', { class: 'panel story', id: 'story-' + i },
        el('h3', {}, el('span', { 'aria-hidden': 'true', text: st.emoji + ' ' }), st.title),
        el('p', { text: st.text }),
        el('p', { class: 'eq' }, el('span', { class: 'formula no-i18n', text: st.eq })),
        bar,
        el('div', { class: 'row spread' },
          el('span', { class: 'small muted', html: esc(t('story_before')) + ': ' + ltr('pH ' + fmt(st.before)) + ' (' + esc(st.beforeLabel) + ') → ' + esc(t('story_after')) + ': ' + ltr('pH ' + fmt(st.after)) + ' (' + esc(st.afterLabel) + ')' }),
          el('button', { type: 'button', class: 'btn btn-sm', id: 'story-play-' + i, onclick: function () {
            var pin = $('#story-pin-' + i); pin.style.left = (st.before / 14 * 100) + '%'; pin.textContent = 'pH ' + fmt(st.before);
            setTimeout(function () { pin.style.left = (st.after / 14 * 100) + '%'; pin.textContent = 'pH ' + fmt(st.after); }, 60);
          } }, '▶ ', t('story_play')))));
    });
  }

  /* ================= SALTS ================= */
  function renderSalts() {
    var box = $('#salts-list'); box.innerHTML = '';
    var correct = 0;
    P.SALTS.forEach(function (s) {
      var pick = S.salts[s.id] || null, reveal = S.saltsReveal || pick !== null;
      if (pick === s.nature) correct++;
      var picks = el('div', { class: 'salt-pick', role: 'group', 'aria-label': t('col_guess') });
      ['acidic', 'basic', 'neutral'].forEach(function (n) {
        var cls = reveal ? (n === s.nature ? 'hit' : n === pick ? 'miss' : '') : '';
        picks.appendChild(el('button', { type: 'button', id: 'salt-' + s.id + '-' + n, class: cls, 'aria-pressed': String(pick === n), text: t('nature_' + n),
          onclick: function () { S.salts[s.id] = n; save(); renderSalts(); } }));
      });
      var parent = function (label, f, strong) {
        return el('span', { class: 'salt-parent' }, el('span', { class: 'muted small', text: label + ': ' }), el('span', { class: 'formula no-i18n', text: f }), ' ', el('span', { class: 'badge ' + (strong ? 'accent' : ''), text: t(strong ? 'strong' : 'weak') }));
      };
      box.appendChild(el('div', { class: 'panel salt-card', dataset: { salt: s.id, nature: s.nature, pick: pick || '' } },
        el('div', { class: 'row spread' }, el('span', { class: 'formula salt-f no-i18n', text: s.formula }),
          reveal ? el('span', { class: 'badge nat-' + s.nature, text: t('nature_' + s.nature) }) : null),
        el('div', { class: 'salt-parents' }, parent(t('col_acid'), s.acid, s.acidStrong), parent(t('col_base'), s.base, s.baseStrong)),
        picks,
        reveal ? el('p', { class: 'salt-why', text: t('salts_why_' + s.nature, { acid: s.acid, base: s.base }) }) : null));
    });
    var sc = $('#salts-score'); sc.innerHTML = th('salts_score', { n: fmt(correct), total: fmt(P.SALTS.length) }); sc.setAttribute('data-n', String(correct));
  }
  $('#salts-show').addEventListener('click', function () { S.saltsReveal = true; save(); renderSalts(); });
  function renderUses() {
    var box = $('#uses'); box.innerHTML = '';
    var U = cx('uses') || {};
    P.USES.forEach(function (u) {
      var c = U[u.id] || {};
      box.appendChild(el('div', { class: 'panel use-card' },
        el('h3', {}, el('span', { 'aria-hidden': 'true', text: u.emoji }), el('span', { text: c.name || '' }), el('span', { class: 'formula no-i18n', text: u.formula })),
        el('p', { class: 'lbl mb0', text: t('uses_made') }),
        el('p', { class: 'small', text: c.made || '' }),
        el('p', { class: 'lbl mb0', text: t('uses_uses') }),
        el('ul', {}, (c.uses || []).map(function (x) { return el('li', { class: 'small', text: x }); }))));
    });
  }

  /* ================= DAILY LIFE ================= */
  function renderLife() {
    var box = $('#life'); box.innerHTML = '';
    (cx('daily') || []).forEach(function (d) {
      box.appendChild(el('div', { class: 'card life-card' },
        el('span', { class: 'ic', 'aria-hidden': 'true', text: d.icon }),
        el('div', {}, el('h3', { text: d.title }), el('span', { class: 'badge primary', text: d.tag }), el('p', { style: { marginTop: '6px' }, text: d.text }))));
    });
  }

  /* ================= QUIZ ================= */
  function startQuiz() { S.quiz = { i: 0, score: 0, picked: null, done: false }; save(); renderQuiz(); }
  function answerQuiz(k) {
    var q = S.quiz; if (!q || q.done || q.picked !== null) return;
    q.picked = k;
    if (k === P.QUIZ[q.i].correct) q.score++;
    save(); renderQuiz();
    var nx = $('#quiz-next'); if (nx) nx.focus();
  }
  function nextQuiz() {
    var q = S.quiz; if (!q || q.picked === null) return;
    if (q.i + 1 >= QN) { q.done = true; if (S.bestQuiz === null || q.score > S.bestQuiz) S.bestQuiz = q.score; }
    else { q.i++; q.picked = null; }
    save(); renderQuiz();
    var f = $('#opt-0') || $('#quiz-again'); if (f) f.focus();
  }
  function renderQuiz() {
    var q = S.quiz, box = $('#quiz'); box.innerHTML = '';
    var Q = cx('quiz') || [];
    box.setAttribute('data-i', q ? String(q.i) : ''); box.setAttribute('data-score', q ? String(q.score) : ''); box.setAttribute('data-done', q && q.done ? '1' : '0');
    if (!q) { q = S.quiz = { i: 0, score: 0, picked: null, done: false }; save(); box.setAttribute('data-i', '0'); box.setAttribute('data-score', '0'); }
    if (q.done) {
      var pct = q.score / QN;
      box.appendChild(el('h2', { text: t('quiz_title') }));
      box.appendChild(el('div', { class: 'final-score', id: 'final-score', dataset: { score: String(q.score) }, text: fmt(q.score) + ' / ' + fmt(QN) }));
      box.appendChild(el('p', { class: 'mb0', html: th('quiz_result', { score: fmt(q.score), total: fmt(QN) }) }));
      box.appendChild(el('p', { class: 'callout ' + (pct === 1 ? 'success' : pct >= 0.6 ? '' : 'warning'), text: t(pct === 1 ? 'quiz_perfect' : pct >= 0.6 ? 'quiz_good' : 'quiz_keep') }));
      if (S.bestQuiz !== null) box.appendChild(el('p', { class: 'muted', id: 'quiz-best', html: th('quiz_best', { n: fmt(S.bestQuiz) + ' / ' + fmt(QN) }) }));
      box.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'quiz-again', onclick: startQuiz }, '🔁 ', t('quiz_again'))));
      return;
    }
    var item = Q[q.i] || { q: '', options: ['', '', '', ''], why: '' }, def = P.QUIZ[q.i];
    box.appendChild(el('div', { class: 'game-top' },
      el('h2', { class: 'mb0', text: t('quiz_title') }),
      el('div', { class: 'row' },
        el('span', { class: 'pill', id: 'quiz-progress', html: th('quiz_progress', { n: fmt(q.i + 1), total: fmt(QN) }) }),
        el('span', { class: 'pill' }, t('score') + ': ', el('b', { id: 'quiz-score', text: fmt(q.score) })))));
    box.appendChild(el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span', { style: { width: Math.round((q.i + (q.picked !== null ? 1 : 0)) / QN * 100) + '%' } })));
    box.appendChild(el('p', { style: { fontSize: '1.1rem', fontWeight: '700' }, id: 'quiz-q', dataset: { id: def.id }, text: item.q }));
    var opts = el('div', { class: 'opts', id: 'opts' });
    item.options.forEach(function (o, k) {
      var cls = 'opt' + (q.picked !== null ? (k === def.correct ? ' win' : ' lose') + (k === q.picked ? ' picked' : '') : '');
      opts.appendChild(el('button', { type: 'button', class: cls, id: 'opt-' + k, disabled: q.picked !== null, onclick: function () { answerQuiz(k); } },
        el('span', { class: 'ol', 'aria-hidden': 'true', text: 'ABCD'.charAt(k) }), el('span', { text: o })));
    });
    box.appendChild(opts);
    if (q.picked !== null) {
      var right = q.picked === def.correct;
      box.appendChild(el('div', { class: 'stack', id: 'quiz-reveal', dataset: { right: right ? '1' : '0' } },
        el('p', { class: 'verdict ' + (right ? 'ok' : 'bad'), id: 'quiz-verdict', text: right ? t('correct') : t('wrong') }),
        el('p', { class: 'callout' }, el('b', { text: t('quiz_why') + ' ' }), item.why),
        el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'quiz-next', onclick: nextQuiz }, t('next'), ' ', el('span', { 'aria-hidden': 'true', text: document.documentElement.dir === 'rtl' ? '←' : '→' })))));
    }
  }
  document.addEventListener('keydown', function (e) {
    if (S.tab !== 'quiz' || !S.quiz || S.quiz.done || S.quiz.picked !== null || e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    var k = 'abcd'.indexOf(e.key.toLowerCase()), n = '1234'.indexOf(e.key);
    if (k >= 0) { e.preventDefault(); answerQuiz(k); } else if (n >= 0) { e.preventDefault(); answerQuiz(n); }
  });

  /* ================= WORDS TO KNOW ================= */
  function renderWords() {
    var dl = $('#words-list'); dl.innerHTML = '';
    ['acid', 'base', 'neutral', 'ph', 'indicator', 'neutralisation', 'salt', 'conc'].forEach(function (w) {
      dl.appendChild(el('dt', { style: { fontWeight: '700', marginTop: '8px' }, text: t('word_' + w) }));
      dl.appendChild(el('dd', { style: { marginInlineStart: '0' }, text: t('word_' + w + '_d') }));
    });
  }

  /* ================= PRINTABLE SUMMARY ================= */
  function buildSummary() {
    var box = $('#summary'); box.innerHTML = '';
    box.appendChild(el('h2', { text: t('sum_title') }));
    box.appendChild(el('p', { class: 'small', text: t('sum_name') }));
    box.appendChild(el('ul', {}, ['sum_def_acid', 'sum_def_base', 'sum_def_ph'].map(function (k) { return el('li', { text: t(k) }); })));
    box.appendChild(el('h3', { text: t('sum_scale') }));
    box.appendChild(el('div', { class: 'sum-bar' }, P.UI_HEX.map(function (hx, i) { return el('span', { style: { background: hx, color: P.uiColor(i).ink }, text: String(i) }); })));
    box.appendChild(el('div', { class: 'sum-subs' }, P.SUBS.map(function (s) { return el('span', { html: esc(subName(s.id)) + ' ' + ltr(fmt(s.ph)) }); })));
    box.appendChild(el('h3', { text: t('sum_ind') }));
    var tb = el('tbody');
    P.INDS.forEach(function (ind) {
      var a = P.indicate(ind.id, 2), b = P.indicate(ind.id, 12);
      tb.appendChild(el('tr', {}, el('td', { text: t('ind_' + ind.id) }), el('td', { text: resultText(ind.id, a) }), el('td', { text: resultText(ind.id, b) })));
    });
    box.appendChild(el('table', { class: 'sum-tbl' }, el('thead', {}, el('tr', {}, el('th', { text: t('col_indicator') }), el('th', { html: esc(t('sum_acid')) + ' (pH 2)' }), el('th', { html: esc(t('sum_base')) + ' (pH 12)' }))), tb));
    var two = el('div', { class: 'sum-two' });
    var left = el('div', {});
    left.appendChild(el('h3', { text: t('sum_neut') }));
    left.appendChild(el('p', { text: t('sum_neut_text') }));
    left.appendChild(el('h3', { text: t('sum_life') }));
    left.appendChild(el('ul', {}, (cx('daily') || []).slice(0, 4).map(function (d) { return el('li', {}, el('b', { text: d.title + ': ' }), d.tag); })));
    var right = el('div', {});
    right.appendChild(el('h3', { text: t('sum_salts') }));
    var stb = el('tbody');
    P.SALTS.slice(0, 4).forEach(function (s) {
      stb.appendChild(el('tr', {}, el('td', { class: 'formula', text: s.formula }), el('td', {}, el('span', { class: 'formula', text: s.acid }), ' (' + t(s.acidStrong ? 'strong' : 'weak') + ')'),
        el('td', {}, el('span', { class: 'formula', text: s.base }), ' (' + t(s.baseStrong ? 'strong' : 'weak') + ')'), el('td', { text: t('nature_' + s.nature) })));
    });
    right.appendChild(el('table', { class: 'sum-tbl' }, el('thead', {}, el('tr', {}, el('th', { text: t('col_salt') }), el('th', { text: t('col_acid') }), el('th', { text: t('col_base') }), el('th', { text: t('sum_nature') }))), stb));
    right.appendChild(el('p', { class: 'small', text: t('salts_rule') }));
    two.appendChild(left); two.appendChild(right);
    box.appendChild(two);
    box.appendChild(el('p', { class: 'small', style: { textAlign: 'center', marginTop: '6pt' }, text: t('brand') + ' · ' + t('app_title') }));
  }
  function printSummary() {
    buildSummary();
    document.body.classList.add('printing-summary');
    var done = function () { document.body.classList.remove('printing-summary'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); setTimeout(done, 1500); }, 60);
  }
  $('#print-summary').addEventListener('click', printSummary);
  $('#print-summary-2').addEventListener('click', printSummary);

  /* ================= RESET ================= */
  $('#reset').addEventListener('click', function () {
    if (!window.confirm(t('confirm_reset'))) return;
    stopAuto();
    S = defaults(); save();
    renderAll(); showTab('scale');
  });

  /* ================= RENDER ALL ================= */
  function renderAll() {
    renderBar(); renderSubList(); renderDetail();
    renderIndLab(); renderGame();
    renderTitr(); renderStories();
    renderSalts(); renderUses();
    renderLife(); renderQuiz(); renderWords();
    if ($('#summary').childNodes.length) buildSummary();
  }
  EDU.onLang(renderAll);
  EDU.onTheme(drawCurve);
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(drawCurve, 80); });
  window.addEventListener('beforeprint', function () { if (!$('#summary').childNodes.length) buildSummary(); });
  if (window.ResizeObserver) new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(drawCurve, 50); }).observe($('#curve').parentNode);

  showTab(S.tab);
  renderAll();
  window.PHLabApp = { state: function () { return S; } };
})();
