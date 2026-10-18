/* Cricket Scorer: setup, scoring pad, live board, scorecard, chart, history.
   The match is { id, cfg, ev: [events] }; every screen is rebuilt from CRK.compute(cfg, ev),
   so Undo just drops the last event. Everything is saved with EDU.store on this device only. */
(function () {
  'use strict';
  var SLUG = 'cricket-scorer', HIST_MAX = 10;
  var store = EDU.store(SLUG), el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var C = window.CRK;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  function isRtl() { return document.documentElement.dir === 'rtl'; }
  /* EDU.t with every inserted value isolated, so names and scores stay whole in Urdu */
  function t(key, vars) {
    if (vars && isRtl()) { var o = {}; Object.keys(vars).forEach(function (k) { o[k] = '⁨' + vars[k] + '⁩'; }); vars = o; }
    return EDU.t(key, vars);
  }
  function plain(s) { return String(s).replace(/[⁦-⁩]/g, ''); }
  function n(v) { return EDU.fmt(v); }
  function dec(v, d) { return v === null || !isFinite(v) ? '-' : EDU.fmt(v, { minimumFractionDigits: d, maximumFractionDigits: d }); }

  /* ------------------------------------------------------------ state */
  var live = store.get('live', null);
  if (!live || typeof live !== 'object' || !Array.isArray(live.ev) || !live.cfg) live = null;
  var hist = store.get('history', []);
  if (!Array.isArray(hist)) hist = [];
  hist = hist.filter(function (h) { return h && h.cfg && Array.isArray(h.ev); });
  var setup = store.get('setup', null);
  var armed = { x: '', b: '' };      /* wd | nb, and b | lb */
  var changing = false;              /* choosing a new bowler mid-over */
  var viewing = null;                /* a saved match shown in the scorecard */
  var scTab = -1;                    /* innings tab in the scorecard (-1 = all) */
  var M = null;

  function save() {
    if (live) store.set('live', live); else store.remove('live');
    syncHistory();
  }
  function syncHistory() {
    if (!live) return;
    var i = -1;
    hist.forEach(function (h, k) { if (h.id === live.id) i = k; });
    var done = M && M.done;
    if (done) {
      var item = { id: live.id, at: live.at || Date.now(), cfg: live.cfg, ev: live.ev.slice() };
      if (i >= 0) hist[i] = item; else hist.unshift(item);
      hist = hist.slice(0, HIST_MAX);
    } else if (i >= 0) hist.splice(i, 1);          /* the result was undone */
    store.set('history', hist);
  }

  /* ------------------------------------------------------------ names */
  function teamName(cfg, i) { return cfg.teams[i].name || EDU.t(i ? 'def_team2' : 'def_team1'); }
  function pName(cfg, team, p) { return (cfg.teams[team].players[p]) || EDU.t('def_player', { n: n(p + 1) }); }

  /* ------------------------------------------------------------ setup form */
  var F = { t1: $('#suT1'), t2: $('#suT2'), pps: $('#suPps'), ov: $('#suOvers'), unl: $('#suUnl'), p1: $('#suP1'), p2: $('#suP2'),
    toss: $('#suToss'), wd: $('#suWd'), nb: $('#suNb'), fh: $('#suFh'), alone: $('#suAlone'), max: $('#suMax') };
  var decision = 'bat';

  function parseNames(txt) {
    return String(txt || '').split(/\r?\n|,(?=\s*\S)/).map(function (s) {
      return s.replace(/^\s*(\d{1,2}[.)\]:-]|[-*•·]|\(\d{1,2}\))\s*/, '').replace(/\s*\((c|wk|c\s*&\s*wk|captain)\)\s*$/i, '').replace(/\s+/g, ' ').trim().slice(0, 30);
    }).filter(Boolean);
  }
  var defs = ['', ''];                /* default team names in the language they were shown in */
  function fillSetup() {
    var c = C.sanitize(setup || {});
    var d1 = EDU.t('def_team1'), d2 = EDU.t('def_team2');
    defs = [d1, d2];
    F.t1.value = c.teams[0].name || d1; F.t2.value = c.teams[1].name || d2;
    F.pps.value = c.pps; F.ov.value = c.overs || 5; F.unl.checked = c.overs === 0;
    F.p1.value = c.teams[0].players.filter(Boolean).join('\n');
    F.p2.value = c.teams[1].players.filter(Boolean).join('\n');
    decision = c.decision;
    F.wd.value = String(c.rules.wd); F.nb.value = String(c.rules.nb);
    F.fh.checked = c.rules.freeHit; F.alone.checked = c.rules.lastAlone; F.max.value = c.rules.maxOv;
    renderToss(c.toss);
    setupLabels();
  }
  function renderToss(sel) {
    var v = sel === undefined ? F.toss.value : String(sel);
    F.toss.innerHTML = '';
    [0, 1].forEach(function (i) { F.toss.appendChild(el('option', { value: String(i), text: (i ? F.t2 : F.t1).value.trim() || EDU.t(i ? 'def_team2' : 'def_team1') })); });
    F.toss.value = v === '1' ? '1' : '0';
    $$('#suDec button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === decision)); });
  }
  function setupLabels() {
    [[F.p1, '#suP1L', '#suP1C', F.t1, 'def_team1'], [F.p2, '#suP2L', '#suP2C', F.t2, 'def_team2']].forEach(function (a) {
      $(a[1]).textContent = t('lbl_players_of', { team: a[3].value.trim() || EDU.t(a[4]) });
      var k = parseNames(a[0].value).length;
      $(a[2]).textContent = k ? t('names_count', { n: n(k) }) : '';
    });
    F.ov.disabled = F.unl.checked;
  }
  function readSetup() {
    var d1 = defs[0], d2 = defs[1];
    var a = F.t1.value.trim(), b = F.t2.value.trim();
    var max = Math.max(parseNames(F.p1.value).length, parseNames(F.p2.value).length);
    var pps = parseInt(F.pps.value, 10);
    if (!(pps >= 2)) pps = 6;
    return C.sanitize({
      teams: [{ name: a === d1 ? '' : a, players: parseNames(F.p1.value) }, { name: b === d2 ? '' : b, players: parseNames(F.p2.value) }],
      pps: Math.min(11, pps), overs: F.unl.checked ? 0 : parseInt(F.ov.value, 10) || 5,
      toss: F.toss.value === '1' ? 1 : 0, decision: decision,
      rules: { wd: +F.wd.value, nb: +F.nb.value, freeHit: F.fh.checked, lastAlone: F.alone.checked, maxOv: parseInt(F.max.value, 10) || 0 },
      _max: max
    });
  }
  /* pasting a longer list than "players per side" raises it (up to 11) */
  function onNames() {
    var k = Math.max(parseNames(F.p1.value).length, parseNames(F.p2.value).length);
    var pps = parseInt(F.pps.value, 10) || 0;
    if (k > pps && k <= 11) F.pps.value = k;
    setupLabels();
  }
  F.p1.addEventListener('input', onNames); F.p2.addEventListener('input', onNames);
  [F.t1, F.t2].forEach(function (i) { i.addEventListener('input', function () { renderToss(); setupLabels(); }); });
  F.unl.addEventListener('change', setupLabels);
  $$('#suDec button').forEach(function (b) { b.addEventListener('click', function () { decision = b.dataset.v; renderToss(); }); });
  $('#setupForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var cfg = readSetup();
    setup = cfg; store.set('setup', cfg);
    startMatch(cfg, []);
  });
  $('#btnSample').addEventListener('click', function () {
    var cfg = C.sanitize({ pps: 6, overs: 2, toss: 1, decision: 'bowl', rules: { wd: 1, nb: 1, freeHit: true } });
    var ev = [{ t: 'open', s: 0, n: 1 }, { t: 'bowl', p: 5 }];
    var balls = [[1], [4], [0, 'wd'], [0], [6], [2], [1, 'lb'], null, [1], [0], [4], [2, 'nb'], [0], [1]];
    balls.forEach(function (b, i) {
      if (b === null) ev.push({ t: 'bowl', p: 4 });
      else ev.push({ t: 'ball', r: b[0], x: b[1] || '' });
      if (i === 5) { ev.push({ t: 'ball', r: 0, x: '', w: { k: 'caught', f: 2 } }); ev.push({ t: 'bat', p: 2 }); }
    });
    ev.push({ t: 'open', s: 0, n: 1 }, { t: 'bowl', p: 5 });
    [[1], [0], [4], [0, 'wd'], [1]].forEach(function (b) { ev.push({ t: 'ball', r: b[0], x: b[1] || '' }); });
    startMatch(cfg, ev);
  });
  function startMatch(cfg, ev) {
    live = { id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: Date.now(), cfg: cfg, ev: ev };
    armed = { x: '', b: '' }; changing = false; viewing = null; scTab = -1;
    recompute(); save(); renderAll();
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------ events */
  function recompute() { M = live ? C.compute(live.cfg, live.ev) : null; }
  function push(ev) {
    if (!live) return;
    var before = M ? M.bad : 0;
    live.ev.push(ev);
    recompute();
    if (M.bad > before) { live.ev.pop(); recompute(); return; }   /* refused by the engine */
    armed = { x: '', b: '' }; changing = false;
    save(); renderAll();
  }
  function undo() {
    if (!live || !live.ev.length) return;
    live.ev.pop(); armed = { x: '', b: '' }; changing = false;
    recompute(); save(); renderAll();
    EDU.toast(EDU.t('undone'));
  }
  function inn() { return M.inns[M.cur]; }
  function curInn() { return M.done ? M.inns[M.inns.length - 1] : inn(); }

  /* ------------------------------------------------------------ result text */
  function resultText(MM) {
    var r = MM.result, cfg = MM.cfg;
    if (!r) return '';
    if (r.type === 'tie') return EDU.t('res_tie');
    var tm = teamName(cfg, r.win);
    if (r.type === 'super') return t('res_super', { team: tm });
    if (r.type === 'runs') return r.n === 1 ? t('res_run1', { team: tm }) : t('res_runs', { team: tm, n: n(r.n) });
    var s = r.n === 1 ? t('res_wkt1', { team: tm }) : t('res_wkts', { team: tm, n: n(r.n) });
    if (r.balls > 0) s += ' ' + (r.balls === 1 ? EDU.t('res_ball1') : t('res_balls', { n: n(r.balls) }));
    return s;
  }
  function innLabel(I) { return I.sup ? EDU.t('inn_super') : EDU.t(I.idx % 2 ? 'inn_2' : 'inn_1'); }
  function tossText(cfg) { return t(cfg.decision === 'bat' ? 'toss_bat' : 'toss_bowl', { team: teamName(cfg, cfg.toss) }); }

  /* ------------------------------------------------------------ live board */
  function chip(c) {
    var lab = C.label(c), cls = 'bc';
    if (c.w) cls += ' bw'; else if (c.x === 'wd' || c.x === 'nb') cls += ' bx'; else if (c.x === '' && c.r === 4) cls += ' b4'; else if (c.x === '' && c.r === 6) cls += ' b6';
    return el('span', { class: cls, text: lab });
  }
  function renderBoard() {
    var I = curInn(), cfg = M.cfg;
    var bd = $('#board');
    $('#bInn').textContent = innLabel(I);
    $('#bFh').hidden = !(I.fh && !M.done && !I.done);
    $('#bTeam').textContent = teamName(cfg, I.bat);
    $('#sTotal').textContent = I.runs + '/' + I.wkts;
    $('#sOvers').textContent = C.oversText(I.legal);
    $('#sOvMax').textContent = I.ovLimit ? '/' + I.ovLimit : '';
    $('#sCrr').textContent = dec(C.rate(I.runs, I.legal), 2);
    var chase = I.target > 0;
    $('#stTarget').hidden = !chase; $('#stRrr').hidden = !chase || !I.ovLimit || M.done;
    var left = C.ballsLeft(I), need = I.target - I.runs;
    if (chase) {
      $('#sTarget').textContent = I.target;
      $('#sRrr').textContent = left > 0 ? dec(need * C.BPO / left, 2) : '-';
    }
    $('#bNeed').textContent = chase && !M.done && need > 0 ? (left >= 0 ? t('need_balls', { team: teamName(cfg, I.bat), r: n(need), b: n(left) }) : t('need_runs', { team: teamName(cfg, I.bat), r: n(need) })) : '';
    $('#bResult').textContent = M.done ? resultText(M) : '';
    bd.dataset.score = I.runs + '/' + I.wkts; bd.dataset.overs = C.oversText(I.legal);
    /* batters + bowler */
    var rows = $('#bRows'); rows.innerHTML = '';
    var on = [];
    if (I.s >= 0) on.push([I.s, true]);
    if (I.ns >= 0) on.push([I.ns, false]);
    on.forEach(function (a) {
      var b = I.bt[a[0]];
      rows.appendChild(el('div', { class: 'b-row' + (a[1] ? ' on' : ''), 'data-p': String(b.p) },
        el('span', { class: 'nm', text: pName(cfg, I.bat, b.p) }), el('span', { class: 'fig num', text: b.r + ' (' + b.b + ')' })));
    });
    bd.dataset.striker = I.s >= 0 ? String(I.bt[I.s].p) : '';
    var bwI = I.bowler >= 0 ? I.bowler : I.prevBowler;
    if (bwI >= 0 && I.bw[bwI]) {
      var w = I.bw[bwI];
      rows.appendChild(el('div', { class: 'b-row bw' }, el('span', { class: 'nm', text: pName(cfg, I.bowl, w.p) }),
        el('span', { class: 'fig num', text: C.oversText(w.balls) + '-' + w.m + '-' + w.r + '-' + w.w })));
    }
    rows.hidden = !rows.children.length;
    /* this over */
    var ov = I.ov[I.ov.length - 1], chips = $('#bOver'); chips.innerHTML = '';
    if (ov && !(ov.done && I.bowler >= 0)) ov.balls.forEach(function (c) { chips.appendChild(chip(c)); });
    $('#bPart').textContent = I.started && !I.done && !M.done ? EDU.t('lbl_partnership') + ': ' + I.ps.r + ' (' + I.ps.b + ')' : '';
    $('#bToss').textContent = tossText(cfg);
    renderFsBtn();
  }

  /* ------------------------------------------------------------ prompts */
  function overCount(I, wi) { return I.bw[wi] ? I.bw[wi].balls / C.BPO : 0; }
  function bowlerPicks(I, onPick) {
    var cfg = M.cfg, wrap = el('div', { class: 'picks' });
    for (var p = 0; p < cfg.pps; p++) (function (p) {
      var wi = -1; I.bw.forEach(function (b, k) { if (b.p === p) wi = k; });
      var last = wi >= 0 && wi === I.prevBowler && I.bowler < 0;
      var cur = wi >= 0 && wi === I.bowler;
      var quota = cfg.rules.maxOv && wi >= 0 && overCount(I, wi) >= cfg.rules.maxOv;
      var figs = wi >= 0 ? C.oversText(I.bw[wi].balls) + '-' + I.bw[wi].m + '-' + I.bw[wi].r + '-' + I.bw[wi].w : '';
      var sub = last ? EDU.t('tag_last_over') : quota ? EDU.t('tag_quota') : figs;
      var b = el('button', { type: 'button', class: 'btn pick' + (last || quota ? ' warnd' : ''), id: 'pick-bowl-' + p, disabled: cur || undefined },
        el('span', { class: 'no-i18n', text: pName(cfg, I.bowl, p) }), sub ? el('small', { class: last || quota ? '' : 'num', text: sub }) : null);
      b.addEventListener('click', function () {
        if (last && !confirm(plain(t('warn_same_bowler', { name: pName(cfg, I.bowl, p) })))) return;
        if (quota && !confirm(plain(t('warn_maxov', { name: pName(cfg, I.bowl, p), n: n(cfg.rules.maxOv) })))) return;
        onPick(p);
      });
      wrap.appendChild(b);
    })(p);
    return wrap;
  }
  function renderPrompt() {
    var box = $('#prompt'), cfg = M.cfg; box.innerHTML = '';
    var nd = M.need, I = inn();
    if (M.done && nd.k === 'tie') {
      box.appendChild(el('p', { text: EDU.t('res_tie') }));
      box.appendChild(el('p', { class: 'hint', text: EDU.t('super_note') }));
      box.appendChild(el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn btn-accent', id: 'btnSuper', text: EDU.t('btn_super'), onclick: function () { push({ t: 'super' }); } }),
        el('button', { type: 'button', class: 'btn', text: EDU.t('btn_newmatch'), onclick: newMatch })));
      return;
    }
    if (M.done) {
      box.appendChild(el('p', { text: resultText(M) }));
      box.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary', id: 'btnNew2', text: EDU.t('btn_newmatch'), onclick: newMatch })));
      return;
    }
    if (nd.k === 'open') {
      var team = teamName(cfg, I.bat);
      box.appendChild(el('p', { text: t('prompt_open', { team: team }) }));
      if (I.target) box.appendChild(el('p', { class: 'hint', text: t('need_runs', { team: team, r: n(I.target) }) }));
      var mk = function (id, lab, side, sel) {
        var s = el('select', { id: id, class: 'no-i18n' });
        for (var p = 0; p < cfg.pps; p++) s.appendChild(el('option', { value: String(p), text: pName(cfg, side, p) }));
        s.value = String(sel);
        return el('div', { class: 'field' }, el('label', { for: id, text: EDU.t(lab) }), s);
      };
      box.appendChild(el('div', { class: 'op-grid' }, mk('opS', 'lbl_striker', I.bat, 0), mk('opN', 'lbl_nonstriker', I.bat, 1), mk('opB', 'lbl_bowler', I.bowl, cfg.pps - 1)));
      var msg = el('p', { class: 'callout danger small', role: 'alert', hidden: true, text: EDU.t('err_same_openers') });
      box.appendChild(msg);
      box.appendChild(el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'btnPlay', text: EDU.t('btn_play'), onclick: function () {
        var s = +$('#opS').value, nn = +$('#opN').value, b = +$('#opB').value;
        if (s === nn) { msg.hidden = false; return; }
        live.ev.push({ t: 'open', s: s, n: nn });
        push({ t: 'bowl', p: b });
      } }));
      return;
    }
    if (nd.k === 'bat') {
      box.appendChild(el('p', { text: EDU.t('prompt_bat') }));
      var wrap = el('div', { class: 'picks' });
      C.available(M, I).forEach(function (p) {
        var bi = -1; I.bt.forEach(function (b, k) { if (b.p === p) bi = k; });
        var sub = bi >= 0 ? EDU.t('st_retired') + ' ' + I.bt[bi].r + ' (' + I.bt[bi].b + ')' : '';
        wrap.appendChild(el('button', { type: 'button', class: 'btn pick', id: 'pick-bat-' + p, onclick: function () { push({ t: 'bat', p: p }); } },
          el('span', { class: 'no-i18n', text: pName(cfg, I.bat, p) }), sub ? el('small', { text: sub }) : null));
      });
      box.appendChild(wrap);
      return;
    }
    if (nd.k === 'bowl' || changing) {
      box.appendChild(el('p', { text: changing ? EDU.t('prompt_chbowl') : t('prompt_bowl', { n: n(Math.floor(I.legal / C.BPO) + 1) }) }));
      box.appendChild(bowlerPicks(I, function (p) { push({ t: 'bowl', p: p }); }));
      if (changing) box.appendChild(el('div', { class: 'row', style: { marginTop: '10px' } }, el('button', { type: 'button', class: 'btn', text: EDU.t('cancel'), onclick: function () { changing = false; renderAll(); } })));
    }
  }

  /* ------------------------------------------------------------ pad */
  var X_KEY = { wd: 'btn_wd', nb: 'btn_nb', b: 'btn_bye', lb: 'btn_lb' };
  function renderPad() {
    var nd = M.need, I = inn(), canBall = nd.k === 'ball' && !changing && !M.done;
    var pad = $('#pad');
    pad.setAttribute('aria-disabled', String(!canBall));
    $$('#padRuns .key, .pad-x .btn').forEach(function (b) { b.disabled = !canBall; });
    $('#xWd').setAttribute('aria-pressed', String(armed.x === 'wd'));
    $('#xNb').setAttribute('aria-pressed', String(armed.x === 'nb'));
    $('#xB').setAttribute('aria-pressed', String(armed.b === 'b'));
    $('#xLb').setAttribute('aria-pressed', String(armed.b === 'lb'));
    var names = [];
    if (armed.x) names.push(EDU.t(X_KEY[armed.x]));
    if (armed.b) names.push(EDU.t(X_KEY[armed.b]));
    var h = $('#armHint');
    h.textContent = names.length ? t('armed', { x: names.join(' + ') }) : EDU.t('pad_hint');
    h.classList.toggle('on', !!names.length);
    var started = !M.done && I.started;
    $('#btnUndo').disabled = !live.ev.length;
    $('#btnSwap').disabled = !(canBall && I.s >= 0 && I.ns >= 0);
    $('#btnChBowl').disabled = !canBall;
    $('#btnRetire').disabled = !canBall;
    $('#btnEnd').disabled = !(started && !I.done);
  }
  function toggleX(x) {
    if (x === 'wd' || x === 'nb') { armed.x = armed.x === x ? '' : x; if (armed.x === 'wd') armed.b = ''; }
    else { armed.b = armed.b === x ? '' : x; if (armed.b && armed.x === 'wd') armed.x = ''; }
    renderPad();
  }
  function ballEv(r, w) {
    var ev = { t: 'ball', r: r, x: armed.x || armed.b || '' };
    if (armed.x === 'nb' && armed.b) ev.nbx = armed.b;
    if (w) ev.w = w;
    return ev;
  }
  function runs(r) { if (M && M.need.k === 'ball' && !changing) push(ballEv(r)); }
  $$('#padRuns .key').forEach(function (b) { b.addEventListener('click', function () { runs(+b.dataset.run); }); });
  $$('.pad-x [data-x]').forEach(function (b) { b.addEventListener('click', function () { toggleX(b.dataset.x); }); });
  $('#btnUndo').addEventListener('click', undo);
  $('#btnSwap').addEventListener('click', function () { push({ t: 'swap' }); });
  $('#btnChBowl').addEventListener('click', function () { changing = true; renderAll(); $('#prompt').scrollIntoView({ block: 'nearest' }); });
  $('#btnEnd').addEventListener('click', function () { if (confirm(EDU.t('confirm_end'))) push({ t: 'end' }); });
  $('#btnWkt').addEventListener('click', wicketDialog);
  $('#btnRetire').addEventListener('click', retireDialog);
  $('#btnNew').addEventListener('click', newMatch);
  function newMatch() {
    if (live && !M.done && live.ev.length && !confirm(EDU.t('confirm_new'))) return;
    if (live) { setup = live.cfg; store.set('setup', setup); }
    live = null; M = null; viewing = null; save(); fillSetup(); renderAll();
    window.scrollTo(0, 0);
  }

  function segGroup(id, labelKey, opts, val, onChange) {
    var lid = id + 'L';
    var seg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': lid, id: id });
    opts.forEach(function (o) {
      seg.appendChild(el('button', { type: 'button', id: id + '-' + o[0], 'aria-pressed': String(o[0] === val), text: o[1], onclick: function () {
        $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', String(b === this)); }, this);
        onChange(o[0]);
      } }));
    });
    return el('div', { class: 'field' }, el('b', { id: lid, text: EDU.t(labelKey) }), seg);
  }

  function wicketDialog() {
    if (!M || M.need.k !== 'ball' || changing) return;
    var I = inn(), cfg = M.cfg, x = armed.x || armed.b || '';
    var kinds = C.allowedKinds(x, I.fh);
    var st = { k: kinds.indexOf('bowled') >= 0 ? 'bowled' : 'runout', f: -1, who: 'S', r: 0, end: '' };
    var form = el('div', { class: 'wk-form', id: 'wkForm' });
    if (kinds.length < 5) form.appendChild(el('p', { class: 'callout warning small mb0', text: EDU.t('only_runout') }));
    var extra = el('div', { class: 'wk-form' });
    form.appendChild(segGroup('wk', 'h_wicket', kinds.map(function (k) { return [k, EDU.t('k_' + k)]; }), st.k, function (k) { st.k = k; draw(); }));
    form.appendChild(extra);
    function fielderSel() {
      var s = el('select', { id: 'wkF', class: 'no-i18n' }, el('option', { value: '-1', text: EDU.t('opt_none') }));
      for (var p = 0; p < cfg.pps; p++) s.appendChild(el('option', { value: String(p), text: pName(cfg, I.bowl, p) }));
      s.value = String(st.f);
      s.addEventListener('change', function () { st.f = +s.value; });
      return el('div', { class: 'field' }, el('label', { for: 'wkF', text: EDU.t('lbl_fielder') }), s);
    }
    function draw() {
      extra.innerHTML = '';
      if (st.k === 'caught' || st.k === 'runout' || st.k === 'stumped') extra.appendChild(fielderSel());
      if (st.k === 'runout' || st.k === 'obstruct') {
        var sN = pName(cfg, I.bat, I.bt[I.s].p);
        var who = [['S', sN]];
        if (I.ns >= 0) who.push(['N', pName(cfg, I.bat, I.bt[I.ns].p)]);
        extra.appendChild(segGroup('wkWho', 'lbl_who_out', who, st.who, function (v) { st.who = v; st.end = ''; draw(); }));
        if (st.k === 'runout') {
          var rs = el('select', { id: 'wkR' });
          for (var r = 0; r <= 4; r++) rs.appendChild(el('option', { value: String(r), text: n(r) }));
          rs.value = String(st.r);
          rs.addEventListener('change', function () { st.r = +rs.value; st.end = ''; draw(); });
          extra.appendChild(el('div', { class: 'field' }, el('label', { for: 'wkR', text: EDU.t('lbl_runs_done') }), rs));
        }
        if (I.ns >= 0) {
          var end = st.end || C.defaultEnd(st.who, st.r);
          extra.appendChild(segGroup('wkEnd', 'lbl_end', [['S', EDU.t('end_s')], ['N', EDU.t('end_n')]], end, function (v) { st.end = v; }));
        }
      }
    }
    draw();
    var close;
    form.appendChild(el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn btn-out btn-lg', id: 'wkOk', text: EDU.t('btn_out'), onclick: function () {
        var w = { k: st.k, f: st.f };
        var r = 0;
        if (st.k === 'runout' || st.k === 'obstruct') {
          w.who = I.ns >= 0 ? st.who : 'S';
          r = st.k === 'runout' ? st.r : 0;
          w.end = st.end || C.defaultEnd(w.who, r);
        }
        close();
        push(ballEv(r, w));
      } }),
      el('button', { type: 'button', class: 'btn', text: EDU.t('cancel'), onclick: function () { close(); } })));
    close = EDU.modal(form, { title: EDU.t('btn_wkt') });
  }

  function retireDialog() {
    if (!M || M.need.k !== 'ball') return;
    var I = inn(), cfg = M.cfg, st = { who: 'S', out: false };
    var form = el('div', { class: 'wk-form' });
    var who = [['S', pName(cfg, I.bat, I.bt[I.s].p)]];
    if (I.ns >= 0) who.push(['N', pName(cfg, I.bat, I.bt[I.ns].p)]);
    form.appendChild(segGroup('rtWho', 'lbl_who_out', who, 'S', function (v) { st.who = v; }));
    form.appendChild(segGroup('rtHow', 'h_retire', [['h', EDU.t('opt_hurt')], ['o', EDU.t('opt_retout')]], 'h', function (v) { st.out = v === 'o'; }));
    var close;
    form.appendChild(el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn btn-primary', id: 'rtOk', text: EDU.t('done'), onclick: function () { close(); push({ t: 'retire', who: st.who, out: st.out }); } }),
      el('button', { type: 'button', class: 'btn', text: EDU.t('cancel'), onclick: function () { close(); } })));
    close = EDU.modal(form, { title: EDU.t('btn_retire') });
  }

  document.addEventListener('keydown', function (e) {
    if (!live || !M || e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target;
    if (tg && (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable)) return;
    if (document.querySelector('.edu-modal-back')) return;
    if (/^[0-6]$/.test(e.key)) { runs(+e.key); e.preventDefault(); }
    else if (e.key === 'w' || e.key === 'W') { wicketDialog(); e.preventDefault(); }
    else if (e.key === 'u' || e.key === 'U') { undo(); e.preventDefault(); }
    else if (e.key === 'Escape' && fsOn()) { toggleFs(); }
  });

  /* ------------------------------------------------------------ scorecard tables */
  function dismissal(cfg, I, b) {
    if (b.st === 'bat') return EDU.t('st_notout');
    if (b.st === 'ret') return EDU.t('st_retired');
    var h = b.how || {}, bw = h.bw >= 0 ? pName(cfg, I.bowl, h.bw) : '', f = h.f >= 0 ? pName(cfg, I.bowl, h.f) : '';
    switch (h.k) {
      case 'bowled': return t('dis_bowled', { bw: bw });
      case 'caught': return h.f < 0 ? t('dis_caught_nf', { bw: bw }) : h.f === h.bw ? t('dis_cb', { bw: bw }) : t('dis_caught', { f: f, bw: bw });
      case 'lbw': return t('dis_lbw', { bw: bw });
      case 'runout': return h.f < 0 ? EDU.t('dis_runout_nf') : t('dis_runout', { f: f });
      case 'stumped': return h.f < 0 ? t('dis_stumped_nf', { bw: bw }) : t('dis_stumped', { f: f, bw: bw });
      case 'hitwicket': return t('dis_hitwicket', { bw: bw });
      case 'obstruct': return EDU.t('dis_obstruct');
      case 'retout': return EDU.t('dis_retout');
    }
    return '';
  }
  function sr(r, b) { return b ? dec(r * 100 / b, 1) : '-'; }
  function th(key, numCol) { return el('th', { class: numCol ? 'n' : '', scope: 'col', text: EDU.t(key) }); }
  function batTable(tbl, MM, I, liveMode) {
    var cfg = MM.cfg; tbl.innerHTML = '';
    tbl.appendChild(el('thead', null, el('tr', null, th('col_batter'), th('col_r', 1), th('col_b', 1), th('col_4s', 1), th('col_6s', 1), th('col_sr', 1))));
    var tb = el('tbody');
    var list = I.bt.map(function (b, k) { return [b, k]; });
    if (liveMode) list = list.filter(function (a) { return a[1] === I.s || a[1] === I.ns; });
    list.forEach(function (a) {
      var b = a[0], on = a[1] === I.s && !MM.done && !I.done;
      tb.appendChild(el('tr', { class: on ? 'on' : '' },
        el('td', null, el('span', { class: 'no-i18n', text: pName(cfg, I.bat, b.p) + (on ? ' *' : '') }), liveMode ? null : el('span', { class: 'how', text: dismissal(cfg, I, b) })),
        el('td', { class: 'n num', text: String(b.r) }), el('td', { class: 'n num', text: String(b.b) }),
        el('td', { class: 'n num', text: String(b.f4) }), el('td', { class: 'n num', text: String(b.f6) }), el('td', { class: 'n num', text: sr(b.r, b.b) })));
    });
    if (!list.length) tb.appendChild(el('tr', null, el('td', { colspan: '6', class: 'muted', text: '-' })));
    tbl.appendChild(tb);
    if (!liveMode) {
      var ex = I.ex, exT = ex.wd + ex.nb + ex.b + ex.lb;
      tbl.appendChild(el('tfoot', null,
        el('tr', null, el('td', { text: EDU.t('lbl_extras') }), el('td', { class: 'n num', text: String(exT) }), el('td', { colspan: '4', class: 'num', text: 'wd ' + ex.wd + ', nb ' + ex.nb + ', b ' + ex.b + ', lb ' + ex.lb })),
        el('tr', null, el('td', { text: EDU.t('total') }), el('td', { class: 'n num', text: I.runs + '/' + I.wkts }), el('td', { colspan: '4', class: 'num', text: C.oversText(I.legal) + ' ' + EDU.t('lbl_overs_word') + (I.legal ? ' · ' + EDU.t('lbl_crr') + ' ' + dec(C.rate(I.runs, I.legal), 2) : '') }))));
    }
  }
  function bowlTable(tbl, MM, I, liveMode) {
    var cfg = MM.cfg; tbl.innerHTML = '';
    tbl.appendChild(el('thead', null, el('tr', null, th('col_bowler'), th('col_o', 1), th('col_m', 1), th('col_r', 1), th('col_w', 1), th('col_econ', 1))));
    var tb = el('tbody'), list = I.bw.map(function (b, k) { return [b, k]; });
    if (liveMode) list = list.filter(function (a) { return a[1] === I.bowler || (I.bowler < 0 && a[1] === I.prevBowler); });
    list.forEach(function (a) {
      var w = a[0];
      var extras = (w.wd ? w.wd + 'wd ' : '') + (w.nb ? w.nb + 'nb' : '');
      tb.appendChild(el('tr', { class: a[1] === I.bowler && !MM.done ? 'on' : '' },
        el('td', null, el('span', { class: 'no-i18n', text: pName(cfg, I.bowl, w.p) }), extras ? el('span', { class: 'how num', text: extras.trim() }) : null),
        el('td', { class: 'n num', text: C.oversText(w.balls) }), el('td', { class: 'n num', text: String(w.m) }), el('td', { class: 'n num', text: String(w.r) }),
        el('td', { class: 'n num', text: String(w.w) }), el('td', { class: 'n num', text: dec(C.rate(w.r, w.balls), 2) })));
    });
    if (!list.length) tb.appendChild(el('tr', null, el('td', { colspan: '6', class: 'muted', text: '-' })));
    tbl.appendChild(tb);
  }
  function fowText(MM, I) {
    if (!I.fow.length) return EDU.t('fow_none');
    return I.fow.map(function (f) { return f.r + '/' + f.w + ' (' + pName(MM.cfg, I.bat, f.p) + ', ' + C.oversText(f.balls) + ' ' + EDU.t('ov_short') + ')'; }).join(' · ');
  }
  function renderLiveTables() {
    var I = curInn();
    batTable($('#tBat'), M, I, true);
    bowlTable($('#tBowl'), M, I, true);
    $('#lvFow').textContent = fowText(M, I);
  }

  function shownMatch() {
    if (viewing) { for (var i = 0; i < hist.length; i++) if (hist[i].id === viewing) return C.compute(hist[i].cfg, hist[i].ev); viewing = null; }
    return M;
  }
  function renderScorecard() {
    var MM = shownMatch(), body = $('#scBody');
    $('#scSaved').hidden = !viewing;
    $('#scCard').hidden = !MM;
    if (!MM) return;
    body.innerHTML = '';
    $('#scResult').textContent = MM.done ? resultText(MM) : '';
    var played = MM.inns.filter(function (I) { return I.started; });
    if (scTab >= played.length) scTab = -1;
    if (played.length > 1) {
      var tabs = el('div', { class: 'sc-tabs no-print', role: 'group', 'aria-label': EDU.t('h_scorecard') });
      var all = el('button', { type: 'button', class: 'chip', 'aria-pressed': String(scTab < 0), text: EDU.t('sc_all'), onclick: function () { scTab = -1; renderScorecard(); } });
      tabs.appendChild(all);
      played.forEach(function (I, k) {
        tabs.appendChild(el('button', { type: 'button', class: 'chip', 'aria-pressed': String(scTab === k), text: teamName(MM.cfg, I.bat) + (I.sup ? ' · ' + EDU.t('inn_super') : ''), onclick: function () { scTab = k; renderScorecard(); } }));
      });
      body.appendChild(tabs);
    }
    body.appendChild(el('p', { class: 'sc-meta muted', text: plain(t('match_vs', { a: teamName(MM.cfg, 0), b: teamName(MM.cfg, 1) })) + ' · ' + tossText(MM.cfg) }));
    if (!played.length) body.appendChild(el('p', { class: 'empty', text: EDU.t('sc_empty') }));
    played.forEach(function (I, k) {
      if (scTab >= 0 && scTab !== k) return;
      var bt = el('table', { class: 'table' }), bw = el('table', { class: 'table' });
      batTable(bt, MM, I, false); bowlTable(bw, MM, I, false);
      var dnb = C.available(MM, I).filter(function (p) { return !I.bt.some(function (b) { return b.p === p; }); }).map(function (p) { return pName(MM.cfg, I.bat, p); });
      body.appendChild(el('div', { class: 'sc-inn', 'data-inn': String(k) },
        el('div', { class: 'sc-head' }, el('b', { class: 'no-i18n', text: teamName(MM.cfg, I.bat) }), el('span', { class: 'muted', text: innLabel(I) }),
          el('b', { class: 'num', text: I.runs + '/' + I.wkts + ' (' + C.oversText(I.legal) + ')' })),
        el('div', { class: 'scroll-x' }, bt),
        dnb.length ? el('p', { class: 'sc-meta' }, el('b', { text: EDU.t('did_not_bat') + ': ' }), el('span', { class: 'no-i18n', text: dnb.join(', ') })) : null,
        el('p', { class: 'sc-meta' }, el('b', { text: EDU.t('lbl_fow') + ': ' }), el('span', { text: fowText(MM, I) })),
        el('div', { class: 'scroll-x' }, bw)));
    });
    renderChart(MM);
    var txt = summary(MM);
    $('#btnWa').href = EDU.waLink(txt);
  }

  /* ------------------------------------------------------------ over-by-over chart (SVG, theme aware via CSS classes) */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, text) {
    var e = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function renderChart(MM) {
    var box = $('#chart'), leg = $('#legend'), tbl = $('#chartTbl');
    box.innerHTML = ''; leg.innerHTML = ''; tbl.innerHTML = '';
    var sets = MM.inns.filter(function (I) { return !I.sup && I.ov.length; });
    $('#chartBox').hidden = !sets.length;
    if (!sets.length) return;
    var nOv = 0, maxR = 0;
    sets.forEach(function (I) { nOv = Math.max(nOv, I.ov.length, I.ovLimit || 0); I.ov.forEach(function (o) { maxR = Math.max(maxR, o.runs); }); });
    nOv = Math.max(nOv, 1);
    var step = maxR <= 8 ? 2 : maxR <= 16 ? 4 : maxR <= 30 ? 5 : 10, top = Math.max(step * 2, Math.ceil(maxR / step) * step);
    var W = Math.max(280, Math.round(box.clientWidth || 600)), H = 210, padL = 30, padR = 8, padT = 16, padB = 26;
    var pw = W - padL - padR, ph = H - padT - padB, slot = pw / nOv;
    var bar = Math.max(2, Math.min(18, (slot - 4) / sets.length - 2));
    var svg = sv('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': EDU.t('chart_aria') });
    for (var v = 0; v <= top; v += step) {
      var y = padT + ph - v / top * ph;
      svg.appendChild(sv('line', { class: 'grid', x1: padL, x2: W - padR, y1: y, y2: y }));
      svg.appendChild(sv('text', { class: 'tick', x: padL - 6, y: y + 4, 'text-anchor': 'end' }, String(v)));
    }
    var every = nOv > 30 ? 5 : nOv > 15 ? 2 : 1;
    for (var o = 0; o < nOv; o++) {
      if ((o + 1) % every === 0 || o === 0) svg.appendChild(sv('text', { class: 'tick', x: padL + slot * o + slot / 2, y: H - 8, 'text-anchor': 'middle' }, String(o + 1)));
    }
    var groupW = sets.length * bar + (sets.length - 1) * 2;
    sets.forEach(function (I, si) {
      I.ov.forEach(function (ov, oi) {
        var x = padL + slot * oi + (slot - groupW) / 2 + si * (bar + 2);
        var h = ov.runs / top * ph, y0 = padT + ph;
        var r = Math.min(4, bar / 2, h);
        var d = h <= 0 ? '' : 'M' + x + ',' + y0 + 'V' + (y0 - h + r) + 'Q' + x + ',' + (y0 - h) + ' ' + (x + r) + ',' + (y0 - h) + 'H' + (x + bar - r) + 'Q' + (x + bar) + ',' + (y0 - h) + ' ' + (x + bar) + ',' + (y0 - h + r) + 'V' + y0 + 'Z';
        var g = sv('g', { tabindex: '0', class: 'bar-g' });
        var tip = plain(t('chart_tip', { team: teamName(MM.cfg, I.bat), n: n(oi + 1), r: n(ov.runs), w: n(ov.wk) }));
        g.appendChild(sv('title', {}, tip));
        g.appendChild(sv('rect', { x: x - 1, y: padT, width: bar + 2, height: ph, fill: 'transparent' }));
        if (d) g.appendChild(sv('path', { d: d, class: 's' + (si + 1) }));
        for (var k = 0; k < ov.wk; k++) g.appendChild(sv('circle', { class: 'wk', cx: x + bar / 2, cy: y0 - h - 6 - k * 9, r: 4 }));
        svg.appendChild(g);
      });
    });
    box.appendChild(svg);
    sets.forEach(function (I, si) { leg.appendChild(el('span', null, el('i', { style: { background: 'var(--s' + (si + 1) + ')' } }), teamName(MM.cfg, I.bat))); });
    leg.appendChild(el('span', null, el('i', { class: 'wk-k' }), EDU.t('col_w')));
    /* the same numbers as a table */
    var hr = el('tr', null, el('th', { scope: 'col', text: EDU.t('col_over') }));
    sets.forEach(function (I) { hr.appendChild(el('th', { scope: 'col', class: 'n no-i18n', text: teamName(MM.cfg, I.bat) })); });
    tbl.appendChild(el('thead', null, hr));
    var tb = el('tbody'), maxOv = Math.max.apply(null, sets.map(function (I) { return I.ov.length; }));
    for (var i = 0; i < maxOv; i++) {
      var tr = el('tr', null, el('td', { class: 'num', text: String(i + 1) }));
      sets.forEach(function (I) { var ov = I.ov[i]; tr.appendChild(el('td', { class: 'n num', text: ov ? ov.runs + (ov.wk ? ' / ' + ov.wk + 'W' : '') : '' })); });
      tb.appendChild(tr);
    }
    tbl.appendChild(tb);
  }

  /* ------------------------------------------------------------ text summary (WhatsApp / copy) */
  function summary(MM) {
    var cfg = MM.cfg, L = [];
    L.push('🏏 ' + plain(t('match_vs', { a: teamName(cfg, 0), b: teamName(cfg, 1) })));
    L.push(plain(tossText(cfg)));
    MM.inns.forEach(function (I) {
      if (!I.started) return;
      L.push('');
      L.push((I.sup ? EDU.t('inn_super') + ': ' : '') + teamName(cfg, I.bat) + ' ' + I.runs + '/' + I.wkts + ' (' + C.oversText(I.legal) + ' ' + EDU.t('ov_short') + ')');
      var bats = I.bt.slice().sort(function (a, b) { return b.r - a.r || a.b - b.b; }).slice(0, 3).filter(function (b) { return b.b || b.r; });
      if (bats.length) L.push(EDU.t('sum_top_bat') + ': ' + bats.map(function (b) { return pName(cfg, I.bat, b.p) + ' ' + b.r + (b.st === 'bat' ? '*' : '') + ' (' + b.b + ')'; }).join(', '));
      var bws = I.bw.slice().sort(function (a, b) { return b.w - a.w || a.r - b.r; }).slice(0, 2);
      if (bws.length) L.push(EDU.t('sum_top_bowl') + ': ' + bws.map(function (w) { return pName(cfg, I.bowl, w.p) + ' ' + w.w + '/' + w.r + ' (' + C.oversText(w.balls) + ')'; }).join(', '));
    });
    if (MM.done) { L.push(''); L.push('🏆 ' + plain(resultText(MM))); }
    else {
      var I = MM.inns[MM.cur];
      if (I.target && I.started) { var left = C.ballsLeft(I); L.push(''); L.push(plain(left >= 0 ? t('need_balls', { team: teamName(cfg, I.bat), r: n(I.target - I.runs), b: n(left) }) : t('need_runs', { team: teamName(cfg, I.bat), r: n(I.target - I.runs) }))); }
    }
    L.push('');
    L.push(EDU.t('sum_footer') + ' ' + EDU.shareUrl());
    return L.join('\n');
  }
  $('#btnCopy').addEventListener('click', function () { var MM = shownMatch(); if (MM) EDU.copy(summary(MM)); });
  $('#btnPrint').addEventListener('click', function () { window.print(); });
  $('#btnCloseSaved').addEventListener('click', function () { viewing = null; scTab = -1; renderAll(); });

  /* ------------------------------------------------------------ history */
  var DTF = null;
  function dateText(ms) {
    try { DTF = DTF || new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', numberingSystem: 'latn' }); return DTF.format(new Date(ms)); }
    catch (e) { return new Date(ms).toLocaleString(); }
  }
  function renderHistory() {
    var box = $('#histList'); box.innerHTML = '';
    if (!hist.length) { box.appendChild(el('p', { class: 'empty', text: EDU.t('history_empty') })); return; }
    hist.forEach(function (h) {
      var MM = C.compute(h.cfg, h.ev);
      var a = MM.inns[0], b = MM.inns[1];
      var score = teamName(MM.cfg, a.bat) + ' ' + a.runs + '/' + a.wkts + (b ? ' · ' + teamName(MM.cfg, b.bat) + ' ' + b.runs + '/' + b.wkts : '');
      box.appendChild(el('div', { class: 'hi-item', 'data-id': h.id },
        el('div', { class: 'txt' }, el('div', { class: 't1 no-i18n', text: score }), el('div', { class: 't2' }, el('span', { text: resultText(MM) }), ' · ', el('span', { class: 'num', text: dateText(h.at) }))),
        el('div', { class: 'row' },
          el('button', { type: 'button', class: 'btn btn-sm', text: EDU.t('btn_open'), onclick: function () { viewing = h.id; scTab = -1; renderAll(); $('#scCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); } }),
          el('button', { type: 'button', class: 'btn btn-sm btn-danger', text: EDU.t('delete'), 'aria-label': EDU.t('delete') + ': ' + plain(score), onclick: function () {
            if (!confirm(EDU.t('delete') + '?')) return;
            hist = hist.filter(function (x) { return x.id !== h.id; });
            if (viewing === h.id) viewing = null;
            if (live && live.id === h.id) live.id = 'm' + Date.now().toString(36);   /* keep the live match out of the list */
            store.set('history', hist); if (live) store.set('live', live); renderAll();
          } }))));
    });
  }

  /* ------------------------------------------------------------ big scoreboard (fullscreen, with a fallback) */
  var pseudo = false;
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function fsOn() { return pseudo || fsEl() === $('#board'); }
  function toggleFs() {
    var bd = $('#board');
    if (pseudo) { pseudo = false; document.documentElement.classList.remove('cs-noscroll'); renderFsBtn(); return; }
    if (fsEl()) { var ex = document.exitFullscreen || document.webkitExitFullscreen; try { var r = ex.call(document); if (r && r.catch) r.catch(function () { }); } catch (e) { } return; }
    var req = bd.requestFullscreen || bd.webkitRequestFullscreen;
    var fallback = function () { pseudo = true; document.documentElement.classList.add('cs-noscroll'); renderFsBtn(); };
    if (!req) return fallback();
    try { var p = req.call(bd); if (p && p.then) p.then(null, fallback); } catch (e) { fallback(); }
  }
  function renderFsBtn() {
    var on = fsOn();
    $('#board').classList.toggle('is-fs', on);
    var b = $('#btnBoard');
    b.textContent = (on ? '✕ ' : '⛶ ') + EDU.t(on ? 'btn_exit_board' : 'btn_board');
    b.setAttribute('aria-pressed', String(on));
  }
  document.addEventListener('fullscreenchange', renderFsBtn);
  document.addEventListener('webkitfullscreenchange', renderFsBtn);
  $('#btnBoard').addEventListener('click', toggleFs);

  /* ------------------------------------------------------------ reset */
  $('#btnReset').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    store.remove('live'); store.remove('history'); store.remove('setup');
    live = null; M = null; hist = []; setup = null; viewing = null;
    fillSetup(); renderAll();
  });

  /* ------------------------------------------------------------ render */
  function renderAll() {
    var on = !!live;
    $('#setupView').hidden = on;
    $('#liveView').hidden = !on;
    if (on) {
      if (!M) recompute();
      renderBoard(); renderPrompt(); renderPad(); renderLiveTables();
    }
    renderScorecard();
    renderHistory();
  }
  var rsT = null;
  window.addEventListener('resize', function () { clearTimeout(rsT); rsT = setTimeout(function () { var MM = shownMatch(); if (MM) renderChart(MM); }, 150); });
  EDU.onLang(function () {
    DTF = null;
    if (!live) {   /* swap untouched default team names to the new language */
      var keep = readSetup();
      setup = keep; fillSetup();
    }
    renderAll();
  });
  EDU.onTheme(function () { var MM = shownMatch(); if (MM) renderChart(MM); });

  fillSetup();
  recompute();
  renderAll();
})();
