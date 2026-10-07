/* Statistics & Sampling Lab: random samples, sampling distributions (CLT), standard error, confidence intervals,
   sampling bias and mean vs median. Everything is drawn on canvas and runs on the device. */
(function () {
  'use strict';
  var SLUG = 'sampling-lab';
  var S = window.SLSTATS, t = EDU.t, $ = EDU.$;
  var store = EDU.store(SLUG);
  var VILLAGE = '6500 7200 8000 8800 9500 10000 11000 12000 12500 14000 15000 16500 18000 21000 25000';
  var RICH = 1000000;                     /* ₹ 10 lakh a month: the crorepati */
  var RANGE = { heights: [125, 185], income: [0, 150000], dice: [0.5, 6.5] };

  function defaults() { return { pop: 'heights', n: 30, seed: 2026, conf: 0.95, tab: 'clt', biasN: 100, mmList: VILLAGE, mmRich: true }; }
  var st = Object.assign(defaults(), store.get('state', {}));
  if (!RANGE[st.pop]) st.pop = 'heights';
  function save() { store.set('state', st); }

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------- formatting ---------- */
  function num(x, d) { return EDU.fmt(x, { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function iso(x) { return '⁦' + x + '⁩'; }
  function fv(v, extra) {                 /* a value of the current population, with its unit */
    if (!isFinite(v)) return '—';
    if (st.pop === 'income') return iso('₹' + EDU.fmt(Math.round(v)));
    if (st.pop === 'heights') return t('u_cm', { v: iso(num(v, 1 + (extra || 0))) });
    return iso(num(v, 2 + (extra || 0)));
  }
  function rupees(v) { return '₹' + EDU.fmt(Math.round(v)); }

  /* ---------- random streams (one per experiment, all from the seed) ---------- */
  var R = {};
  function reseed() { R.clt = S.rng(st.seed); R.ci = S.rng(st.seed + 101); R.bias = S.rng(st.seed + 202); }

  /* ---------- canvas helpers ---------- */
  function prep(cv) {
    var dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 300, h = cv.clientHeight || 200;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    g.font = '13px "Noto Sans", system-ui, sans-serif'; g.textBaseline = 'alphabetic';
    return { g: g, w: w, h: h };
  }
  function col(v) { return EDU.css(v); }
  function alpha(c, a) {
    var m = /^#([0-9a-f]{6})$/i.exec(c);
    if (!m) return c;
    var n = parseInt(m[1], 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function ticksFor(pop) {
    if (pop === 'heights') return [130, 140, 150, 160, 170, 180];
    if (pop === 'income') return [0, 25000, 50000, 75000, 100000, 125000, 150000];
    return [1, 2, 3, 4, 5, 6];
  }
  function tickLabel(pop, v, narrow) {
    if (pop === 'income') return v === 0 ? '0' : (narrow ? EDU.fmt(v / 1000) + 'k' : EDU.fmt(v));
    return EDU.fmt(v);
  }
  function axis(c, x0, x1, X, ticks, labelFn, label) {
    var g = c.g, y = c.h - 34;
    g.strokeStyle = col('--border'); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(X(x0), y + 0.5); g.lineTo(X(x1), y + 0.5); g.stroke();
    g.fillStyle = col('--muted'); g.textAlign = 'center';
    ticks.forEach(function (v) {
      var x = X(v);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 5); g.stroke();
      var lb = labelFn(v), hw = g.measureText(lb).width / 2 + 2;
      g.fillText(lb, Math.min(c.w - hw, Math.max(hw, x)), y + 18);
    });
    g.fillStyle = col('--text'); g.font = '600 12px "Noto Sans", system-ui, sans-serif';
    g.fillText(label, (X(x0) + X(x1)) / 2, c.h - 3);
    g.font = '13px "Noto Sans", system-ui, sans-serif';
    return y;
  }
  function vline(c, x, top, bottom, color, width, dash) {
    var g = c.g; g.save(); g.strokeStyle = color; g.lineWidth = width || 2; if (dash) g.setLineDash(dash);
    g.beginPath(); g.moveTo(x, top); g.lineTo(x, bottom); g.stroke(); g.restore();
  }
  function emptyText(c, key) {
    var g = c.g; g.fillStyle = col('--muted'); g.textAlign = 'center'; g.font = '14px "Noto Sans", system-ui, sans-serif';
    g.fillText(t(key), c.w / 2, (c.h - 34) / 2);
  }

  /* ================= 1. samples and the CLT ================= */
  var means = [], lastSample = null, popBins = {};
  function pop() { return S.population(st.pop); }
  function se() { return pop().sigma / Math.sqrt(st.n); }

  function popHistogram(kind) {
    if (popBins[kind]) return popBins[kind];
    var p = S.population(kind), rg = RANGE[kind], nb = kind === 'dice' ? 6 : 60, w = (rg[1] - rg[0]) / nb, counts = new Array(nb).fill(0);
    for (var i = 0; i < p.values.length; i++) counts[Math.min(nb - 1, Math.max(0, Math.floor((p.values[i] - rg[0]) / w)))]++;
    popBins[kind] = { counts: counts, w: w, lo: rg[0] };
    return popBins[kind];
  }
  /* bins for the sample means: on the 1/n grid for dice, else fine bins that also show a narrow bell */
  function meanBins() {
    var rg = RANGE[st.pop], span = rg[1] - rg[0];
    if (st.pop === 'dice' && st.n <= 12) return { lo: 1 - 0.5 / st.n, w: 1 / st.n };
    var w = Math.max(span / 600, Math.min(span / 100, se() / 3));
    return { lo: rg[0], w: w };
  }

  function takeSamples(k) {
    var p = pop();
    for (var i = 0; i < k; i++) {
      var xs = S.sample(p, st.n, R.clt), s = 0;
      for (var j = 0; j < xs.length; j++) s += xs[j];
      means.push(s / xs.length);
      if (i === k - 1) lastSample = xs;
    }
    renderClt();
  }

  function renderClt() {
    var p = pop(), m = means.length;
    function setv(id, txt, val) { var e = $('#' + id); e.textContent = txt; e.dataset.value = val === undefined || !isFinite(val) ? '' : String(val); }
    setv('v-mu', fv(p.mu, 1), p.mu);
    setv('v-sigma', fv(p.sigma, 1), p.sigma);
    setv('v-xbar', lastSample ? fv(means[m - 1], 1) : '—', lastSample ? means[m - 1] : NaN);
    setv('v-count', EDU.fmt(m), m);
    var mm = NaN, sdm = NaN;
    if (m) { var su = 0; means.forEach(function (x) { su += x; }); mm = su / m; }
    if (m > 1) { var ss = 0; means.forEach(function (x) { ss += (x - mm) * (x - mm); }); sdm = Math.sqrt(ss / (m - 1)); }
    setv('v-mm', m ? fv(mm, 1) : '—', mm);
    setv('v-sdm', m > 1 ? fv(sdm, 1) : '—', sdm);
    setv('v-se', fv(se(), 1), se());
    $('#v-se').dataset.sigma = String(p.sigma); $('#v-se').dataset.n = String(st.n);
    /* hint */
    var hint;
    if (!m) hint = t('hint_start');
    else if (m < 100) hint = t('hint_more');
    else if (st.n === 1) hint = t('hint_n1');
    else hint = t('hint_compare', { o: fv(sdm, 1), s: fv(se(), 1) }) + (st.pop === 'income' && st.n < 15 ? ' ' + t('hint_skew') : ' ' + t('hint_bell'));
    $('#clt-hint').textContent = hint;
    drawPop(); drawDist();
  }

  function drawPop() {
    var c = prep($('#c-pop')), p = pop(), rg = RANGE[st.pop], hb = popHistogram(st.pop);
    var L = 12, Rr = 12, T = 18, X = function (v) { return L + (v - rg[0]) / (rg[1] - rg[0]) * (c.w - L - Rr); };
    var y0 = axis(c, rg[0], rg[1], X, ticksFor(st.pop), function (v) { return tickLabel(st.pop, v, c.w < 520); }, t('axis_' + st.pop));
    var mx = Math.max.apply(null, hb.counts), H = y0 - T - 14, g = c.g;
    g.fillStyle = alpha(col('--c1'), 0.35);
    hb.counts.forEach(function (k, i) {
      var x0 = X(hb.lo + i * hb.w), x1 = X(hb.lo + (i + 1) * hb.w), h = k / mx * H;
      g.fillRect(x0 + 0.5, y0 - h, Math.max(1, x1 - x0 - 1), h);
    });
    vline(c, X(p.mu), T - 4, y0, col('--c1'), 2.5);
    if (lastSample) {
      var jr = S.rng(lastSample.length * 7 + 3);
      g.fillStyle = alpha(col('--c2'), 0.85);
      lastSample.forEach(function (v) {
        var x = X(Math.min(rg[1], Math.max(rg[0], v + (st.pop === 'dice' ? (jr() - 0.5) * 0.5 : 0))));
        g.beginPath(); g.arc(x, y0 - 6 - jr() * Math.min(40, H * 0.3), 3.2, 0, 2 * Math.PI); g.fill();
      });
      vline(c, X(means[means.length - 1]), T - 4, y0, col('--c2'), 2.5, [6, 4]);
    }
  }

  function drawDist() {
    var c = prep($('#c-dist')), p = pop(), rg = RANGE[st.pop], g = c.g;
    var L = 12, Rr = 12, T = 14, X = function (v) { return L + (v - rg[0]) / (rg[1] - rg[0]) * (c.w - L - Rr); };
    var y0 = axis(c, rg[0], rg[1], X, ticksFor(st.pop), function (v) { return tickLabel(st.pop, v, c.w < 520); }, t('axis_mean_' + st.pop));
    if (!means.length) { emptyText(c, 'dist_empty'); return; }
    var b = meanBins(), counts = {}, mx = 0;
    means.forEach(function (v) { var k = Math.floor((v - b.lo) / b.w + 1e-9); counts[k] = (counts[k] || 0) + 1; if (counts[k] > mx) mx = counts[k]; });
    var s = se(), peak = means.length * b.w / (s * Math.sqrt(2 * Math.PI));
    var bell = $('#bell').checked, top = Math.max(mx, bell ? peak : 0), H = y0 - T - 4;
    g.fillStyle = alpha(col('--c2'), 0.75);
    Object.keys(counts).forEach(function (k) {
      var x0 = X(b.lo + k * b.w), x1 = X(b.lo + (+k + 1) * b.w), h = counts[k] / top * H;
      g.fillRect(x0, y0 - h, Math.max(1.5, x1 - x0 - (x1 - x0 > 4 ? 1 : 0)), h);
    });
    vline(c, X(p.mu), T, y0, col('--c1'), 2);
    if (bell) {
      g.strokeStyle = col('--c3'); g.lineWidth = 2.5; g.beginPath();
      var steps = 400;
      for (var i = 0; i <= steps; i++) {
        var v = rg[0] + (rg[1] - rg[0]) * i / steps, z = (v - p.mu) / s;
        var y = y0 - means.length * b.w * Math.exp(-z * z / 2) / (s * Math.sqrt(2 * Math.PI)) / top * H;
        if (i) g.lineTo(X(v), y); else g.moveTo(X(v), y);
      }
      g.stroke();
    }
  }

  /* ================= 2. confidence intervals ================= */
  var intervals = [];
  function drawIntervals(k) {
    if (st.n < 2) return;
    var p = pop();
    for (var i = 0; i < k; i++) {
      var xs = S.sample(p, st.n, R.ci), r = S.ci(xs, st.conf);
      r.hit = r.lo <= p.mu && p.mu <= r.hi;
      intervals.push(r);
    }
    renderCi();
  }
  function renderCi() {
    var p = pop(), tot = intervals.length, hit = intervals.filter(function (r) { return r.hit; }).length;
    var cnt = $('#ci-count');
    cnt.dataset.covered = String(hit); cnt.dataset.total = String(tot);
    cnt.textContent = tot ? t('ci_count', { k: iso(EDU.fmt(hit)), m: iso(EDU.fmt(tot)), p: iso(num(hit / tot * 100, 1) + '%') }) : '';
    $('#ci-msg').textContent = st.n < 2 ? t('ci_need2') : '';
    $('#ci1').disabled = $('#ci100').disabled = st.n < 2;
    ['90', '95', '99'].forEach(function (c) { $('#conf-' + c).setAttribute('aria-pressed', String(Math.round(st.conf * 100) === +c)); });
    var tc = st.n >= 2 ? S.tcrit(st.conf, st.n - 1) : NaN;
    $('#ci-formula').textContent = st.n >= 2 ? t('ci_formula', { t: iso(num(tc, 3)), n: iso(EDU.fmt(st.n)), c: iso(EDU.fmt(Math.round(st.conf * 100))) }) : '';
    var c = prep($('#c-ci')), g = c.g;
    var half = 5 * p.sigma / Math.sqrt(Math.max(2, st.n)) * (st.n < 5 ? 2 : 1), lo = Math.max(p.min, p.mu - half), hi = Math.min(p.max, p.mu + half);
    var L = 14, Rr = 14, T = 10, X = function (v) { return L + (v - lo) / (hi - lo) * (c.w - L - Rr); };
    var y0 = c.h - 34;
    g.strokeStyle = col('--border'); g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, y0 + 0.5); g.lineTo(c.w - Rr, y0 + 0.5); g.stroke();
    g.fillStyle = col('--muted'); g.textAlign = 'center';
    [lo + (p.mu - lo) * 0.2, p.mu, hi - (hi - p.mu) * 0.2].forEach(function (v) {
      g.fillText(st.pop === 'income' ? rupees(v) : num(v, st.pop === 'dice' ? 2 : 1), X(v), y0 + 18);
    });
    g.fillStyle = col('--text'); g.font = '600 12px "Noto Sans", system-ui, sans-serif'; g.fillText(t('axis_' + st.pop), c.w / 2, c.h - 3);
    if (!tot) { emptyText(c, st.n < 2 ? 'ci_need2_short' : 'ci_empty'); return; }
    var show = intervals.slice(-100), rows = 100, rowH = (y0 - T - 4) / rows;
    show.forEach(function (r, i) {
      var y = T + (i + 0.5) * rowH, x0 = Math.max(L, X(r.lo)), x1 = Math.min(c.w - Rr, X(r.hi));
      g.strokeStyle = r.hit ? col('--success') : col('--danger'); g.lineWidth = Math.max(1.5, Math.min(3, rowH * 0.6));
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
      g.fillStyle = g.strokeStyle; g.beginPath(); g.arc(Math.min(c.w - Rr, Math.max(L, X(r.mean))), y, Math.max(1.5, Math.min(3, rowH * 0.5)), 0, 2 * Math.PI); g.fill();
    });
    vline(c, X(p.mu), T - 6, y0, col('--c1'), 2.5);
  }

  /* ================= 3. sampling bias ================= */
  var biasRes = null, pools = null;
  var METHODS = [{ id: 'random', key: 'm_random', color: '--c4' }, { id: 'city', key: 'm_city', color: '--c2' }, { id: 'online', key: 'm_online', color: '--c3' }];
  function getPools() {
    if (pools) return pools;
    var p = S.population('income'), all = [], city = [], online = [];
    for (var i = 0; i < p.values.length; i++) { all.push(i); if (p.extra.place[i] === 0) city.push(i); if (p.extra.online[i]) online.push(i); }
    pools = { random: all, city: city, online: online };
    return pools;
  }
  function runBias() {
    var p = S.population('income'), P = getPools();
    biasRes = { n: st.biasN, rows: METHODS.map(function (m) {
      var est = [];
      for (var k = 0; k < 200; k++) { var xs = S.sample(p, st.biasN, R.bias, P[m.id]), s = 0; xs.forEach(function (x) { s += x; }); est.push(s / xs.length); }
      var avg = est.reduce(function (a, b) { return a + b; }, 0) / est.length;
      return { m: m, est: est, avg: avg, err: (avg - p.mu) / p.mu };
    }) };
    renderBias();
  }
  function renderBias() {
    var p = S.population('income');
    [20, 100, 500].forEach(function (n) { $('#bn-' + n).setAttribute('aria-pressed', String(st.biasN === n)); });
    var body = $('#bias-body'); body.innerHTML = '';
    METHODS.forEach(function (m, i) {
      var r = biasRes && biasRes.rows[i];
      var tr = EDU.el('tr', { id: 'bias-' + m.id, dataset: r ? { avg: String(r.avg), err: String(r.err) } : {} },
        EDU.el('td', {}, EDU.el('span', { class: 'sw', style: { '--sw': 'var(' + m.color + ')' } }), EDU.el('span', { i18n: m.key })),
        EDU.el('td', { class: 'v sl-num', text: r ? rupees(r.avg) : '—' }),
        EDU.el('td', { class: 'v sl-num ' + (r ? (Math.abs(r.err) < 0.05 ? 'good' : 'bad') : ''), text: r ? (r.err >= 0 ? '+' : '−') + num(Math.abs(r.err) * 100, 1) + '%' : '—' }));
      body.appendChild(tr);
    });
    body.appendChild(EDU.el('tr', {}, EDU.el('td', { i18n: 'bias_truth' }), EDU.el('td', { class: 'v sl-num', text: rupees(p.mu) }), EDU.el('td', { class: 'v', text: '' })));
    $('#bias-note').textContent = biasRes ? t('bias_note', { mu: iso(rupees(p.mu)), n: iso(EDU.fmt(biasRes.n)) }) : t('bias_hint');
    var c = prep($('#c-bias')), g = c.g;
    var lo = 10000, hi = 60000;
    if (biasRes) biasRes.rows.forEach(function (r) { r.est.forEach(function (v) { if (v < lo) lo = v; if (v > hi) hi = v; }); });
    lo = Math.floor(lo / 10000) * 10000; hi = Math.ceil(hi / 10000) * 10000;
    var L = 14, Rr = 14, X = function (v) { return L + (v - lo) / (hi - lo) * (c.w - L - Rr); }, ticks = [];
    var step = (hi - lo) / 10000 > 6 ? 20000 : 10000;
    for (var v = lo; v <= hi; v += step) ticks.push(v);
    var y0 = axis(c, lo, hi, X, ticks, function (v) { return c.w < 520 ? EDU.fmt(v / 1000) + 'k' : EDU.fmt(v); }, t('axis_bias'));
    var bandH = (y0 - 12) / 3;
    METHODS.forEach(function (m, i) {
      var yc = 6 + bandH * (i + 0.5);
      g.strokeStyle = alpha(col('--border'), 1); g.lineWidth = 1; g.beginPath(); g.moveTo(L, yc + 0.5); g.lineTo(c.w - Rr, yc + 0.5); g.stroke();
      if (!biasRes) return;
      var jr = S.rng(17 + i);
      g.fillStyle = alpha(col(m.color), 0.55);
      biasRes.rows[i].est.forEach(function (v) { g.beginPath(); g.arc(X(v), yc + (jr() - 0.5) * bandH * 0.6, 3, 0, 2 * Math.PI); g.fill(); });
      vline(c, X(biasRes.rows[i].avg), yc - bandH * 0.4, yc + bandH * 0.4, col(m.color), 3);
    });
    vline(c, X(p.mu), 2, y0, col('--text'), 2, [5, 4]);
    if (!biasRes) emptyText(c, 'bias_empty');
  }

  /* ================= 4. mean vs median ================= */
  function parseList(txt) {
    var out = [], bad = 0;
    String(txt || '').split(/[\s;]+/).forEach(function (tok) {
      if (!tok) return;
      tok = tok.replace(/^₹/, '').replace(/^,+|,+$/g, '');
      var parts = /^\d{1,3}(,\d{2})*,\d{3}$/.test(tok) || /^\d{1,3}(,\d{3})+$/.test(tok) ? [tok.replace(/,/g, '')] : tok.split(',');
      parts.forEach(function (x) {
        if (x === '') return;
        if (/^\d+(\.\d+)?$/.test(x)) out.push(Number(x)); else bad++;
      });
    });
    return { vals: out, bad: bad };
  }
  function meanOf(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
  function renderMm() {
    var pr = parseList(st.mmList), v = pr.vals;
    $('#mm-rich').textContent = t(st.mmRich ? 'mm_rich_remove' : 'mm_rich_add');
    $('#mm-rich').setAttribute('aria-pressed', String(st.mmRich));
    var ok = v.length >= 2;
    $('#mm-msg').textContent = !ok ? t('mm_err_few') : pr.bad ? t('mm_err_bad', { n: EDU.fmt(pr.bad) }) : '';
    var with_ = v.concat([RICH]);
    var m0 = ok ? meanOf(v) : NaN, d0 = ok ? S.median(v) : NaN, m1 = ok ? meanOf(with_) : NaN, d1 = ok ? S.median(with_) : NaN;
    function setv(id, val, signed) {
      var e = $('#' + id); e.dataset.value = isFinite(val) ? String(val) : '';
      e.textContent = !isFinite(val) ? '—' : (signed ? '+' : '') + rupees(val);
    }
    setv('mm-m0', m0); setv('mm-d0', d0); setv('mm-m1', m1); setv('mm-d1', d1);
    setv('mm-mean-shift', m1 - m0, true); setv('mm-median-shift', d1 - d0, true);
    $('#mm-note').textContent = ok ? t('mm_note', { m: iso(rupees(m1 - m0)), d: iso(rupees(d1 - d0)), k: iso(EDU.fmt(with_.filter(function (x) { return x < m1; }).length)), n: iso(EDU.fmt(with_.length)) }) : '';
    /* dot plot */
    var c = prep($('#c-mm')), g = c.g;
    if (!ok) return;
    var data = st.mmRich ? with_ : v, mx = Math.max.apply(null, data) * 1.05 || 1;
    var L = 14, Rr = 18, X = function (x) { return L + x / mx * (c.w - L - Rr); };
    var nice = [1, 2, 2.5, 5], unit = Math.pow(10, Math.floor(Math.log10(mx / 5))), stp = unit;
    for (var i = 0; i < nice.length; i++) if (mx / (nice[i] * unit) <= 6) { stp = nice[i] * unit; break; }
    var ticks = []; for (var tv = 0; tv <= mx; tv += stp) ticks.push(tv);
    var y0 = axis(c, 0, mx, X, ticks, function (x) { return c.w < 520 && x >= 1000 ? EDU.fmt(x / 1000) + 'k' : EDU.fmt(x); }, t('axis_mm'));
    var mean = st.mmRich ? m1 : m0, med = st.mmRich ? d1 : d0;
    var placed = {}, cnt = {}, maxK = 1;
    data.forEach(function (x) { var px = Math.round(X(x) / 8); cnt[px] = (cnt[px] || 0) + 1; if (cnt[px] > maxK) maxK = cnt[px]; });
    var stepY = Math.min(11, (y0 - 70) / maxK);
    data.forEach(function (x, idx) {
      var px = Math.round(X(x) / 8), k = placed[px] = (placed[px] || 0) + 1;
      var rich = st.mmRich && idx === data.length - 1;
      g.fillStyle = rich ? col('--c5') : col('--c1');
      g.beginPath(); g.arc(X(x), y0 - 10 - (k - 1) * stepY, rich ? 8 : Math.min(5, Math.max(3, stepY / 2 + 1)), 0, 2 * Math.PI); g.fill();
    });
    vline(c, X(mean), 26, y0, col('--c2'), 3);
    vline(c, X(med), 46, y0, col('--c3'), 3, [6, 4]);
    g.font = '700 13px "Noto Sans", system-ui, sans-serif';
    function label(x, y, txt, color) {
      var w = g.measureText(txt).width, lx = Math.min(c.w - w / 2 - 4, Math.max(w / 2 + 4, x));
      g.fillStyle = color; g.textAlign = 'center'; g.fillText(txt, lx, y);
    }
    var far = Math.abs(X(mean) - X(med)) > 70;
    label(X(mean), 18, t('lbl_mean') + ' ' + rupees(mean), col('--c2'));
    label(X(med), far ? 18 : 40, t('lbl_median') + ' ' + rupees(med), col('--c3'));
  }

  /* ================= 5. quiz ================= */
  function renderQuiz(keepAnswers) {
    var Q = (window.APP_CONTENT[EDU.lang] || window.APP_CONTENT.en).quiz, box = $('#quiz');
    var prev = keepAnswers ? Q.map(function (q, i) { var c = box.querySelector('input[name="q' + i + '"]:checked'); return c ? +c.value : -1; }) : [];
    box.innerHTML = '';
    Q.forEach(function (q, i) {
      var d = EDU.el('fieldset', { class: 'sl-q', id: 'q' + i, style: { border: '1px solid var(--border)' } });
      d.appendChild(EDU.el('legend', { class: 'ab-sr', style: { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }, text: q.q }));
      d.appendChild(EDU.el('p', { class: 'qt', text: (i + 1) + '. ' + q.q }));
      q.o.forEach(function (o, j) {
        var inp = EDU.el('input', { type: 'radio', name: 'q' + i, value: String(j) });
        if (prev[i] === j) inp.checked = true;
        d.appendChild(EDU.el('label', {}, inp, EDU.el('span', { text: o })));
      });
      d.appendChild(EDU.el('p', { class: 'why muted' }));
      box.appendChild(d);
    });
    $('#quiz-score').textContent = '';
  }
  function checkQuiz() {
    var Q = (window.APP_CONTENT[EDU.lang] || window.APP_CONTENT.en).quiz, score = 0;
    Q.forEach(function (q, i) {
      var fs = $('#q' + i), chosen = fs.querySelector('input:checked'), labels = EDU.$$('label', fs);
      labels.forEach(function (l, j) { l.classList.toggle('right', j === q.a); l.classList.toggle('wrong', !!chosen && +chosen.value === j && j !== q.a); });
      if (chosen && +chosen.value === q.a) score++;
      fs.querySelector('.why').textContent = q.why;
    });
    var s = $('#quiz-score'); s.dataset.score = String(score);
    s.textContent = t('quiz_score', { k: iso(EDU.fmt(score)), n: iso(EDU.fmt(Q.length)) });
  }

  /* ================= settings, tabs, events ================= */
  function renderSettings() {
    EDU.$$('.sl-pops button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.pop === st.pop)); });
    $('#pop-note').textContent = t('pop_note_' + st.pop);
    $('#n-range').value = String(st.n); $('#n-out').textContent = EDU.fmt(st.n);
    EDU.$$('.sl-chips .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.n === st.n)); });
    $('#seed').value = String(st.seed);
  }
  function showTab(id) {
    st.tab = id; save();
    EDU.$$('.sl-tabs [role=tab]').forEach(function (b) {
      var on = b.dataset.tab === id;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      $('#p-' + b.dataset.tab).hidden = !on;
    });
    redraw();
  }
  function redraw() {
    if (st.tab === 'clt') renderClt();
    else if (st.tab === 'ci') renderCi();
    else if (st.tab === 'bias') renderBias();
    else if (st.tab === 'mm') renderMm();
  }
  function resetRuns() { means = []; lastSample = null; intervals = []; biasRes = null; reseed(); }

  EDU.$$('.sl-pops button').forEach(function (b) {
    b.addEventListener('click', function () { st.pop = b.dataset.pop; save(); resetRuns(); renderSettings(); redraw(); });
  });
  function setN(n) {
    n = Math.round(EDU.clamp(+n || 1, 1, 200));
    if (n === st.n) return;
    st.n = n; save(); means = []; lastSample = null; intervals = []; renderSettings(); redraw();
  }
  $('#n-range').addEventListener('input', function () { setN(this.value); });
  EDU.$$('.sl-chips .chip').forEach(function (b) { b.addEventListener('click', function () { setN(b.dataset.n); }); });
  $('#seed').addEventListener('change', function () {
    var v = parseInt(String(this.value).replace(/\D/g, ''), 10);
    st.seed = isFinite(v) ? v % 1000000000 : 1; save(); resetRuns(); renderSettings(); redraw();
  });
  $('#new-seed').addEventListener('click', function () { st.seed = 1 + Math.floor(Math.random() * 99999); save(); resetRuns(); renderSettings(); redraw(); });
  $('#take1').addEventListener('click', function () { takeSamples(1); });
  $('#take100').addEventListener('click', function () { takeSamples(100); });
  $('#take1000').addEventListener('click', function () { takeSamples(1000); });
  $('#clt-clear').addEventListener('click', function () { means = []; lastSample = null; renderClt(); });
  $('#bell').addEventListener('change', drawDist);
  [['90', 0.9], ['95', 0.95], ['99', 0.99]].forEach(function (c) {
    $('#conf-' + c[0]).addEventListener('click', function () { st.conf = c[1]; save(); intervals = []; renderCi(); });
  });
  $('#ci1').addEventListener('click', function () { drawIntervals(1); });
  $('#ci100').addEventListener('click', function () { drawIntervals(100); });
  $('#ci-clear').addEventListener('click', function () { intervals = []; renderCi(); });
  [20, 100, 500].forEach(function (n) { $('#bn-' + n).addEventListener('click', function () { st.biasN = n; save(); biasRes = null; renderBias(); }); });
  $('#bias-run').addEventListener('click', runBias);
  $('#mm-list').value = st.mmList;
  $('#mm-list').addEventListener('input', function () { st.mmList = this.value; save(); renderMm(); });
  $('#mm-rich').addEventListener('click', function () { st.mmRich = !st.mmRich; save(); renderMm(); });
  $('#mm-sample').addEventListener('click', function () { st.mmList = VILLAGE; $('#mm-list').value = VILLAGE; save(); renderMm(); });
  $('#quiz-check').addEventListener('click', checkQuiz);
  $('#quiz-again').addEventListener('click', function () { renderQuiz(false); });
  EDU.$$('.sl-tabs [role=tab]').forEach(function (b, i, all) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      if (document.documentElement.dir === 'rtl') d = -d;
      var nb = all[(i + d + all.length) % all.length]; nb.focus(); showTab(nb.dataset.tab);
    });
  });
  $('#present').addEventListener('click', function () {
    var m = $('#app'), on = !m.classList.contains('present');
    m.classList.toggle('present', on);
    if (on !== !!document.fullscreenElement) EDU.fullscreen();
    setTimeout(redraw, 200);
  });
  document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement) { $('#app').classList.remove('present'); setTimeout(redraw, 100); } });
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    st = defaults(); save(); $('#mm-list').value = st.mmList; resetRuns(); renderSettings(); renderQuiz(false); showTab('clt');
  });
  var rsz; window.addEventListener('resize', function () { clearTimeout(rsz); rsz = setTimeout(redraw, 150); });
  EDU.onTheme && EDU.onTheme(redraw);
  EDU.onLang(function () { renderSettings(); renderQuiz(true); redraw(); });

  reseed(); renderSettings(); renderQuiz(false); showTab(st.tab);
})();
