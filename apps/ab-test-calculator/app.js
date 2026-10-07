/* A/B Test Calculator: two-proportion z-test, confidence range, Bayesian chance to beat A, sample-size planner. */
(function () {
  'use strict';
  var SLUG = 'ab-test-calculator';
  var S = window.ABSTATS, t = EDU.t, $ = EDU.$;
  var store = EDU.store(SLUG);
  var VERS = ['a', 'b', 'c'], NAMES = { a: 'A', b: 'B', c: 'C' };
  var EXAMPLES = {
    whatsapp: { n: ['1000', '1000', ''], c: ['62', '91', ''], showC: false },
    banner: { n: ['4210', '4185', ''], c: ['118', '131', ''], showC: false },
    notice: { n: ['240', '236', '238'], c: ['151', '178', '170'], showC: true }
  };
  function defaults() {
    return { n: EXAMPLES.whatsapp.n.slice(), c: EXAMPLES.whatsapp.c.slice(), showC: false, alpha: 0.05, ex: 'whatsapp',
      plan: { base: '10', change: '2', mode: 'abs', power: 0.8, alpha: 0.05, versions: 2, daily: '500' } };
  }
  var st = Object.assign(defaults(), store.get('state', {}));
  st.plan = Object.assign(defaults().plan, st.plan || {});

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  function save() { store.set('state', st); }

  /* ---------- formatting ---------- */
  function num(x, d) { return EDU.fmt(x, { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pct(x, d) { return isFinite(x) ? num(x * 100, d === undefined ? 2 : d) + '%' : '—'; }
  function signed(x, d) { if (!isFinite(x)) return '—'; var s = num(Math.abs(x), d); return (x > 0 ? '+' : x < 0 ? '−' : '') + s; }
  function iso(x) { return '\u2066' + x + '\u2069'; }   /* keep numbers left-to-right inside Urdu sentences */
  function pFmt(p) { return p < 0.0001 ? '< 0.0001' : num(p, 4); }
  function alphaPct(a) { return EDU.fmt(a * 100, { maximumFractionDigits: 2 }) + '%'; }
  function parseCount(s) {
    s = String(s == null ? '' : s).replace(/[\s,_]/g, '');
    if (s === '') return { blank: true };
    if (!/^\d+$/.test(s)) return { bad: true };
    var v = Number(s);
    return isFinite(v) && v <= 1e12 ? { v: v } : { bad: true };
  }
  function parseDec(s) {
    s = String(s == null ? '' : s).replace(/[\s,%]/g, '');
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }

  /* ---------- input rows ---------- */
  function buildRows() {
    var box = $('#rows');
    box.innerHTML = '';
    VERS.forEach(function (v, i) {
      if (v === 'c' && !st.showC) return;
      var row = EDU.el('div', { class: 'ab-row ab-v-' + v });
      row.appendChild(EDU.el('div', { class: 'ab-ver' },
        EDU.el('span', { class: 'ab-dot', 'aria-hidden': 'true', text: NAMES[v] }),
        EDU.el('span', {}, EDU.el('span', { i18n: 'ver_' + v }))));
      ['n', 'c'].forEach(function (k) {
        var inp = EDU.el('input', { id: 'in-' + k + '-' + v, type: 'text', inputmode: 'numeric', autocomplete: 'off', class: 'ab-num', value: st[k][i] });
        inp.addEventListener('input', function () { st[k][i] = inp.value; st.ex = ''; save(); renderExNote(); compute(); });
        row.appendChild(EDU.el('label', { class: 'f-' + k },
          EDU.el('span', { class: 'ab-sr', i18n: k === 'n' ? 'col_visitors' : 'col_conv' }), inp));
      });
      row.appendChild(EDU.el('div', { class: 'ab-rate ab-num', id: 'rate-' + v, 'aria-live': 'polite' }));
      box.appendChild(row);
    });
    EDU.apply(box);
    $('#toggle-c').textContent = t(st.showC ? 'remove_c' : 'add_c');
  }

  function renderExNote() {
    EDU.$$('.ab-ex .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.ex === st.ex)); });
    $('#ex-note').textContent = st.ex ? t('ex_' + st.ex + '_note') : '';
  }

  /* ---------- results ---------- */
  var last = null;   /* last valid analysis, for copy + chart */

  function readGroups() {
    var groups = [], errs = [];
    VERS.forEach(function (v, i) {
      if (v === 'c' && !st.showC) return;
      var n = parseCount(st.n[i]), c = parseCount(st.c[i]);
      var inN = $('#in-n-' + v), inC = $('#in-c-' + v);
      var badN = n.blank || n.bad || n.v < 1, badC = c.blank || c.bad || (!n.bad && !n.blank && c.v > n.v);
      if (inN) inN.setAttribute('aria-invalid', String(!!badN));
      if (inC) inC.setAttribute('aria-invalid', String(!!badC));
      if (n.blank || c.blank) errs.push(t('err_blank'));
      else if (n.bad || c.bad) errs.push(t('err_bad'));
      else if (n.v < 1) errs.push(t('err_zero', { v: NAMES[v] }));
      else if (c.v > n.v) errs.push(t('err_more', { v: NAMES[v], c: EDU.fmt(c.v), n: EDU.fmt(n.v) }));
      groups.push({ v: v, n: n.v, c: c.v, ok: !badN && !badC });
      var r = $('#rate-' + v);
      if (r) { r.textContent = (!badN && !badC) ? pct(c.v / n.v) : '—'; r.dataset.value = (!badN && !badC) ? String(c.v / n.v) : ''; }
    });
    errs = errs.filter(function (e, i) { return errs.indexOf(e) === i; });
    return { groups: groups, errs: errs };
  }

  function tile(id, key, val, sub, cls, dataVal) {
    var d = EDU.el('div', { class: 'ab-tile' + (cls ? ' ' + cls : '') });
    d.appendChild(EDU.el('span', { class: 'k', text: key }));
    var v = EDU.el('span', { class: 'v ab-num', id: id, text: val });
    if (dataVal !== undefined) v.dataset.value = String(dataVal);
    d.appendChild(v);
    if (sub) d.appendChild(EDU.el('span', { class: 's', text: sub }));
    return d;
  }

  function compute() {
    var rd = readGroups(), box = $('#result'), warns = $('#warns');
    $('#err').textContent = rd.errs.join(' ');
    box.innerHTML = ''; warns.innerHTML = '';
    if (rd.errs.length) { last = null; box.appendChild(EDU.el('p', { class: 'muted', text: t('res_wait') })); drawChart(); return; }
    var g = rd.groups, A = g[0], k = g.length;
    var alpha = st.alpha / (k - 1);                       /* Bonferroni when B and C are both compared with A */
    var conf = Math.round((1 - alpha) * 1000) / 10;
    var comps = [];
    for (var i = 1; i < k; i++) {
      var X = g[i], r = S.compare(A.n, A.c, X.n, X.c, alpha);
      r.beat = S.probBBeatsA(A.n, A.c, X.n, X.c);
      r.v = X.v;
      comps.push(r);
    }
    last = { groups: g, comps: comps, alpha: alpha, conf: conf };
    if (k > 2) box.appendChild(EDU.el('p', { class: 'callout small', text: t('three_note', { a: iso(alphaPct(alpha)) }) }));

    comps.forEach(function (r) {
      var V = NAMES[r.v], blk = EDU.el('div', { class: 'ab-cmp ab-v-' + r.v, id: 'cmp-' + r.v });
      if (k > 2) blk.appendChild(EDU.el('h3', { text: t('cmp_h', { v: V }) }));
      var kind = r.sig ? (r.diff > 0 ? 'better' : 'worse') : 'unsure';
      var vb = EDU.el('div', { class: 'callout ab-verdict ' + (kind === 'better' ? 'success' : kind === 'worse' ? 'danger' : 'warning'), id: 'verdict-' + r.v });
      vb.dataset.kind = kind;
      vb.appendChild(document.createTextNode(t('verdict_' + kind, { v: V })));
      vb.appendChild(EDU.el('p', { text: t(kind === 'unsure' ? 'verdict_unsure_sub' : 'verdict_sig_sub', { p: iso(pFmt(r.p)), a: iso(alphaPct(alpha)) }) }));
      blk.appendChild(vb);

      var tiles = EDU.el('div', { class: 'ab-tiles' });
      tiles.appendChild(tile('t-diff-' + r.v, t('st_diff', { v: V }), signed(r.diff * 100, 2), t('pts_unit'), r.sig ? (r.diff > 0 ? 'good' : 'bad') : '', r.diff));
      tiles.appendChild(tile('t-up-' + r.v, t('st_uplift'), isFinite(r.uplift) ? signed(r.uplift * 100, 1) + '%' : '—', '', '', isFinite(r.uplift) ? r.uplift : ''));
      tiles.appendChild(tile('t-p-' + r.v, t('st_p'), pFmt(r.p), t('p_need', { a: num(alpha, alpha < 0.01 ? 4 : 3) }), r.sig ? 'good' : '', r.p));
      var ci = tile('t-ci-' + r.v, t('st_ci', { c: EDU.fmt(conf) }), t('st_ci_val', { lo: iso(signed(r.lo * 100, 2)), hi: iso(signed(r.hi * 100, 2)) }), t('pts_unit'), '', '');
      ci.querySelector('.v').classList.add('small');
      ci.querySelector('.v').classList.remove('ab-num');
      ci.querySelector('.v').dataset.lo = String(r.lo); ci.querySelector('.v').dataset.hi = String(r.hi);
      tiles.appendChild(ci);
      tiles.appendChild(tile('t-beat-' + r.v, t('st_beat', { v: V }), pct(r.beat, 1), t('st_beat_sub'), '', r.beat));
      blk.appendChild(tiles);
      blk.appendChild(EDU.el('p', { class: 'muted small ab-cinote', text: t(r.lo > 0 ? 'ci_note_pos' : r.hi < 0 ? 'ci_note_neg' : 'ci_note_zero', { v: V }) }));

      /* the working, step by step */
      var X = g.filter(function (x) { return x.v === r.v; })[0];
      var det = EDU.el('details', { class: 'ab-work' }, EDU.el('summary', { text: t('work_h') }));
      var ol = EDU.el('ol', { class: 'small' });
      [t('work_pool', { v: V, ca: EDU.fmt(A.c), cb: EDU.fmt(X.c), na: EDU.fmt(A.n), nb: EDU.fmt(X.n), p: num(r.pool, 5) }),
        t('work_se', { na: EDU.fmt(A.n), nb: EDU.fmt(X.n), se: num(r.seP, 5) }),
        t('work_z', { d: num(r.diff, 5), se: num(r.seP, 5), z: isFinite(r.z) ? num(r.z, 3) : '∞' }),
        t('work_p', { p: pFmt(r.p) }),
        t('work_ci', { zc: num(r.zc, 3), d: num(r.diff, 5), m: num(r.zc * r.seU, 5) })
      ].forEach(function (s) { ol.appendChild(EDU.el('li', { class: 'ab-num', text: s })); });
      det.appendChild(ol);
      blk.appendChild(det);
      box.appendChild(blk);
    });

    if (k > 2) {
      var best = S.probBest(g, 20000, 2026), bb = EDU.el('div', { class: 'ab-best', id: 'best' });
      bb.appendChild(EDU.el('h3', { text: t('st_best') }));
      g.forEach(function (x, i) {
        var row = EDU.el('div', { class: 'ab-best-row ab-v-' + x.v });
        row.appendChild(EDU.el('span', { class: 'ab-dot', text: NAMES[x.v] }));
        var bar = EDU.el('div', { class: 'bar' }, EDU.el('span', { style: { width: (best[i] * 100).toFixed(1) + '%' } }));
        row.appendChild(bar);
        row.appendChild(EDU.el('b', { class: 'ab-num', text: pct(best[i], 1), dataset: { value: String(best[i]) } }));
        bb.appendChild(row);
      });
      box.appendChild(EDU.el('div', { class: 'ab-cmp' }, bb));
    }

    /* warnings */
    var W = [];
    g.forEach(function (x) { if (x.c < 10 || x.n - x.c < 10) W.push({ id: 'w-small-' + x.v, text: t('warn_small', { v: NAMES[x.v] }) }); });
    var ns = g.map(function (x) { return x.n; });
    var minN = Math.min.apply(null, ns), maxN = Math.max.apply(null, ns);
    if (S.splitP(ns) < 0.001 && maxN / minN > 1.01) {
      var tot = ns.reduce(function (a, b) { return a + b; }, 0);
      W.push({ id: 'w-split', text: t('warn_split', { s: g.map(function (x) { return NAMES[x.v] + ' ' + iso(pct(x.n / tot, 1)); }).join(' · ') }) });
    }
    var plan = planCalc();
    if (plan.ok && minN < plan.n) W.push({ id: 'w-peek', text: t('warn_peek', { x: iso(EDU.fmt(Math.floor(minN / plan.n * 100))), n: iso(EDU.fmt(plan.n)) }) });
    else W.push({ id: 'w-peek-gen', text: t('warn_peek_gen'), info: true });
    W.forEach(function (w) { warns.appendChild(EDU.el('p', { class: 'callout ' + (w.info ? 'small' : 'warning'), id: w.id, text: w.text })); });
    drawChart();
  }

  /* ---------- chart: likely true rate of each version (Beta posteriors) ---------- */
  function drawChart() {
    var box = $('#chart'), leg = $('#legend');
    box.innerHTML = ''; leg.innerHTML = '';
    if (!last) return;
    var g = last.groups;
    var lo = 1, hi = 0;
    g.forEach(function (x) {
      var a = x.c + 1, b = x.n - x.c + 1, m = a / (a + b), sd = Math.sqrt(a * b / ((a + b) * (a + b) * (a + b + 1)));
      lo = Math.min(lo, m - 4.5 * sd); hi = Math.max(hi, m + 4.5 * sd);
    });
    lo = Math.max(0, lo); hi = Math.min(1, hi);
    if (hi - lo < 1e-4) { hi = Math.min(1, lo + 0.01); lo = Math.max(0, hi - 0.01); }
    var W = Math.round(Math.max(320, Math.min(720, box.clientWidth || 720))), H = W < 500 ? 230 : 270, L = 20, R = 20, T = 16, B = 52, iw = W - L - R, ih = H - T - B, N = 200;
    var curves = g.map(function (x) {
      var a = x.c + 1, b = x.n - x.c + 1, pts = [], mx = 0;
      for (var i = 0; i <= N; i++) { var p = lo + (hi - lo) * i / N, d = S.betaPdf(Math.min(1 - 1e-12, Math.max(1e-12, p)), a, b); pts.push([p, d]); if (d > mx) mx = d; }
      return { v: x.v, pts: pts, mx: mx, mode: x.c / x.n };
    });
    var ymax = Math.max.apply(null, curves.map(function (c) { return c.mx; })) || 1;
    var X = function (p) { return L + (p - lo) / (hi - lo) * iw; }, Y = function (d) { return T + ih - d / ymax * ih; };
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('aria-hidden', 'true');
    function mk(tag, attrs, text) { var e = document.createElementNS(ns, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; svg.appendChild(e); return e; }
    var col = { a: EDU.css('--c1'), b: EDU.css('--c2'), c: EDU.css('--c3') }, txt = EDU.css('--text'), mut = EDU.css('--muted'), brd = EDU.css('--border');
    mk('line', { x1: L, x2: W - R, y1: T + ih, y2: T + ih, stroke: brd, 'stroke-width': 1.5 });
    /* nice ticks in % */
    var span = (hi - lo) * 100, steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 25], step = steps[steps.length - 1];
    for (var s = 0; s < steps.length; s++) if (span / steps[s] <= (W < 500 ? 5 : 7)) { step = steps[s]; break; }
    var dec = step < 0.1 ? 2 : step < 1 ? 1 : 0;
    for (var tk = Math.ceil(lo * 100 / step) * step; tk <= hi * 100 + 1e-9; tk += step) {
      var x = X(tk / 100);
      mk('line', { x1: x, x2: x, y1: T + ih, y2: T + ih + 6, stroke: mut, 'stroke-width': 1 });
      mk('text', { x: x, y: T + ih + 22, 'text-anchor': 'middle', 'font-size': 14, fill: mut }, num(tk, dec) + '%');
    }
    mk('text', { x: L + iw / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 14, fill: txt, 'font-weight': 600 }, t('axis_rate'));
    curves.forEach(function (c) {
      var d = 'M' + X(c.pts[0][0]).toFixed(1) + ',' + Y(0).toFixed(1);
      c.pts.forEach(function (p) { d += ' L' + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); });
      d += ' L' + X(c.pts[c.pts.length - 1][0]).toFixed(1) + ',' + Y(0).toFixed(1) + ' Z';
      mk('path', { d: d, fill: col[c.v], 'fill-opacity': 0.16, stroke: col[c.v], 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    });
    curves.forEach(function (c) {
      var x = X(c.mode), y = Y(c.mx);
      mk('line', { x1: x, x2: x, y1: y, y2: T + ih, stroke: col[c.v], 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
      mk('text', { x: x, y: Math.max(14, y - 6), 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: col[c.v] }, NAMES[c.v]);
    });
    box.appendChild(svg);
    box.dataset.curves = String(curves.length);
    g.forEach(function (x) {
      leg.appendChild(EDU.el('span', { class: 'ab-v-' + x.v }, EDU.el('i', {}), EDU.el('span', { class: 'ab-num', text: NAMES[x.v] + ': ' + pct(x.c / x.n) })));
    });
  }

  /* ---------- planner ---------- */
  function planCalc() {
    var P = st.plan, base = parseDec(P.base), ch = parseDec(P.change);
    if (!isFinite(base) || !isFinite(ch)) return { ok: false };
    var p1 = base / 100, p2 = P.mode === 'abs' ? p1 + ch / 100 : p1 * (1 + ch / 100);
    if (!(p1 > 0 && p1 < 1 && p2 > 0 && p2 < 1) || Math.abs(p2 - p1) < 1e-9) return { ok: false, p1: p1, p2: p2 };
    var alpha = P.alpha / (P.versions - 1), r = S.sampleSize(p1, p2, alpha, P.power);
    var daily = parseCount(P.daily), total = r.n * P.versions;
    return { ok: true, p1: p1, p2: p2, n: r.n, raw: r.raw, za: r.za, zb: r.zb, alpha: alpha, total: total,
      days: daily.v > 0 ? Math.ceil(total / daily.v) : NaN };
  }
  function renderPlan() {
    var P = st.plan, r = planCalc();
    $('#pl-abs').setAttribute('aria-pressed', String(P.mode === 'abs'));
    $('#pl-rel').setAttribute('aria-pressed', String(P.mode === 'rel'));
    $('#pl-p80').setAttribute('aria-pressed', String(P.power === 0.8));
    $('#pl-p90').setAttribute('aria-pressed', String(P.power === 0.9));
    $('#pl-s5').setAttribute('aria-pressed', String(P.alpha === 0.05));
    $('#pl-s1').setAttribute('aria-pressed', String(P.alpha === 0.01));
    $('#pl-v2').setAttribute('aria-pressed', String(P.versions === 2));
    $('#pl-v3').setAttribute('aria-pressed', String(P.versions === 3));
    $('#pl-out').hidden = !r.ok;
    $('#pl-err').textContent = r.ok ? '' : t('plan_bad');
    $('#pl-base').setAttribute('aria-invalid', String(!r.ok && !(r.p1 > 0 && r.p1 < 1)));
    $('#pl-change').setAttribute('aria-invalid', String(!r.ok && r.p1 > 0 && r.p1 < 1));
    if (!r.ok) { $('#pl-target').textContent = ''; $('#pl-formula').textContent = ''; $('#pl-n').dataset.value = ''; return; }
    $('#pl-target').textContent = t('plan_target', { a: iso(num(r.p1 * 100, 2)), b: iso(num(r.p2 * 100, 2)) }) + (P.versions > 2 ? ' ' + t('plan_3note', { a: iso(alphaPct(r.alpha)) }) : '');
    $('#pl-n').textContent = EDU.fmt(r.n); $('#pl-n').dataset.value = String(r.n);
    $('#pl-total').textContent = EDU.fmt(r.total); $('#pl-total').dataset.value = String(r.total);
    $('#pl-days').textContent = isFinite(r.days) ? t('plan_days_val', { n: EDU.fmt(r.days) }) : '—';
    $('#pl-days').dataset.value = isFinite(r.days) ? String(r.days) : '';
    $('#pl-formula').textContent = t('plan_formula', { za: num(r.za, 4), zb: num(r.zb, 4), raw: num(r.raw, 1), n: EDU.fmt(r.n) });
  }

  /* ---------- events ---------- */
  EDU.$$('.ab-ex .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var e = EXAMPLES[b.dataset.ex];
      st.n = e.n.slice(); st.c = e.c.slice(); st.showC = e.showC; st.ex = b.dataset.ex;
      save(); buildRows(); renderExNote(); compute();
    });
  });
  $('#toggle-c').addEventListener('click', function () {
    st.showC = !st.showC;
    if (st.showC && !st.n[2] && !st.c[2]) { st.n[2] = st.n[1]; st.c[2] = st.c[1]; }
    save(); buildRows(); compute();
  });
  [['#sig-5', 0.05], ['#sig-1', 0.01]].forEach(function (p) {
    $(p[0]).addEventListener('click', function () { st.alpha = p[1]; save(); renderSig(); compute(); });
  });
  function renderSig() {
    $('#sig-5').setAttribute('aria-pressed', String(st.alpha === 0.05));
    $('#sig-1').setAttribute('aria-pressed', String(st.alpha === 0.01));
  }
  function planInput(id, key) {
    $(id).value = st.plan[key];
    $(id).addEventListener('input', function () { st.plan[key] = $(id).value; save(); renderPlan(); compute(); });
  }
  planInput('#pl-base', 'base'); planInput('#pl-change', 'change'); planInput('#pl-daily', 'daily');
  function planSet(id, key, val) { $(id).addEventListener('click', function () { st.plan[key] = val; save(); renderPlan(); compute(); }); }
  planSet('#pl-abs', 'mode', 'abs'); planSet('#pl-rel', 'mode', 'rel');
  planSet('#pl-p80', 'power', 0.8); planSet('#pl-p90', 'power', 0.9);
  planSet('#pl-s5', 'alpha', 0.05); planSet('#pl-s1', 'alpha', 0.01);
  planSet('#pl-v2', 'versions', 2); planSet('#pl-v3', 'versions', 3);
  $('#pl-use-a').addEventListener('click', function () {
    var n = parseCount(st.n[0]), c = parseCount(st.c[0]);
    if (n.v > 0 && c.v >= 0 && c.v <= n.v) {
      st.plan.base = String(Math.round(c.v / n.v * 10000) / 100);
      $('#pl-base').value = st.plan.base; save(); renderPlan(); compute();
    } else EDU.toast(t('err_blank'));
  });
  $('#copy').addEventListener('click', function () {
    if (!last) { EDU.toast(t('res_wait')); return; }
    var lines = last.groups.map(function (x) { return t('sum_row', { v: NAMES[x.v], r: pct(x.c / x.n), c: EDU.fmt(x.c), n: EDU.fmt(x.n) }); });
    last.comps.forEach(function (r) {
      var V = NAMES[r.v], kind = r.sig ? (r.diff > 0 ? 'better' : 'worse') : 'unsure';
      lines.push(t('verdict_' + kind, { v: V }) + ' ' + t('st_p') + ' = ' + pFmt(r.p) + '; ' + t('st_ci', { c: EDU.fmt(last.conf) }) + ': ' +
        t('st_ci_val', { lo: signed(r.lo * 100, 2), hi: signed(r.hi * 100, 2) }) + ' ' + t('pts_unit') + '; ' + t('st_beat', { v: V }) + ': ' + pct(r.beat, 1));
    });
    EDU.copy(lines.join('\n').replace(/[\u2066\u2069]/g, ''));
  });
  $('#print').addEventListener('click', function () { window.print(); });
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    st = defaults(); save();
    ['base', 'change', 'daily'].forEach(function (k) { $('#pl-' + k).value = st.plan[k]; });
    renderAll();
  });

  function renderAll() { buildRows(); renderExNote(); renderSig(); renderPlan(); compute(); }
  EDU.onLang(renderAll);
  EDU.onTheme && EDU.onTheme(drawChart);
  var rsz; window.addEventListener('resize', function () { clearTimeout(rsz); rsz = setTimeout(drawChart, 150); });
  renderAll();
})();
