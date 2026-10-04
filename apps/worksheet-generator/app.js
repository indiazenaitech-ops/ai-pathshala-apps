/* Maths Worksheet Generator: UI. Questions come from gen.js (window.WSGEN),
   word-problem text from content.js (window.APP_CONTENT), UI text from strings.js. */
(function () {
  'use strict';
  var SLUG = 'worksheet-generator';
  var G = window.WSGEN, t = EDU.t, esc = EDU.esc, $ = EDU.$, $$ = EDU.$$;
  var store = EDU.store(SLUG);

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  var COUNTS = [10, 15, 20, 25, 30, 35, 40, 45, 50];
  var V_TOPICS = ['add', 'sub', 'mul', 'div', 'dadd'];
  function newSeed() { return 1000 + Math.floor(Math.random() * 90000); }
  function defaults() {
    return { topics: ['add'], mix: false, diff: 'easy', count: 20, cols: 'auto', layout: 'v', digits: 2, carry: 'any',
      tFrom: 2, tTo: 10, rem: 'no', school: '', title: '', key: true, big: false, seed: newSeed() };
  }
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  /* values can come from a shared link or old storage: never trust their type (String({}) style tricks must not crash the app) */
  function prim(v) { return typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean' ? v : ''; }
  function int(v, lo, hi, d) { v = Math.round(Number(prim(v))); return isFinite(v) && prim(v) !== '' ? Math.max(lo, Math.min(hi, v)) : d; }
  /* every chosen topic gets at least one question: 12 topics need at least 15 questions */
  function minCount(c) { return Math.max(10, Math.ceil(c.topics.length / 5) * 5); }
  function sanitize(c) {
    var ids = G.TOPICS.map(function (x) { return x.id; });
    c.topics = (Array.isArray(c.topics) ? c.topics : []).filter(function (x, i, a) { return ids.indexOf(x) >= 0 && a.indexOf(x) === i; });
    if (!c.topics.length) c.topics = ['add'];
    c.mix = !!c.mix;
    if (!c.mix && c.topics.length > 1) c.mix = true;
    c.diff = oneOf(c.diff, ['easy', 'medium', 'hard'], 'easy');
    c.count = int(c.count, 10, 50, 20);
    if (COUNTS.indexOf(c.count) < 0) c.count = Math.round(c.count / 5) * 5;
    if (c.count < minCount(c)) c.count = minCount(c);
    c.cols = oneOf(String(prim(c.cols)), ['auto', '1', '2', '3', '4'], 'auto');
    c.layout = oneOf(c.layout, ['v', 'h'], 'v');
    c.digits = int(c.digits, 1, 6, 2);
    c.carry = oneOf(c.carry, ['any', 'yes', 'no'], 'any');
    c.tFrom = int(c.tFrom, 2, 20, 2); c.tTo = int(c.tTo, 2, 20, 10);
    c.rem = oneOf(c.rem, ['any', 'yes', 'no'], 'no');
    c.school = typeof c.school === 'string' ? c.school.slice(0, 120) : '';
    c.title = typeof c.title === 'string' ? c.title.slice(0, 120) : '';
    c.key = c.key !== false; c.big = c.big === true;
    c.seed = int(c.seed, 1, 99999999, newSeed());
    return c;
  }
  /* copy only the known settings (no __proto__ or other surprises from a link) */
  function merge(into, from) {
    if (!from || typeof from !== 'object' || Array.isArray(from)) return;
    Object.keys(defaults()).forEach(function (k) { if (Object.prototype.hasOwnProperty.call(from, k)) into[k] = from[k]; });
  }

  var cfg = defaults();
  merge(cfg, store.get('cfg', null));
  var fromLink = (function () {
    var m = /[#&]w=([A-Za-z0-9_-]+)/.exec(location.hash || '');
    var o = m ? EDU.unpack(m[1]) : null;
    return o && typeof o === 'object' && !Array.isArray(o) ? o : null;
  })();
  merge(cfg, fromLink);
  sanitize(cfg);

  function sig() { return [cfg.seed, cfg.topics.join(','), cfg.diff, cfg.count, cfg.digits, cfg.carry, cfg.tFrom, cfg.tTo, cfg.rem].join('|'); }
  function loadAnswers() {
    var a = store.get('ans', null);
    return a && typeof a === 'object' && a.sig === sig() && a.v && typeof a.v === 'object' && !Array.isArray(a.v) ? a.v : {};
  }
  var answers = loadAnswers();
  var QS = [], sections = [], showKey = false, lastScore = null;

  function saveCfg() { store.set('cfg', cfg); }
  var ansTimer = 0, ansPending = null;
  function saveAnswers() {
    ansPending = { sig: sig(), v: answers };
    clearTimeout(ansTimer);
    ansTimer = setTimeout(flushAnswers, 250);
  }
  function flushAnswers() {
    clearTimeout(ansTimer);
    if (ansPending) store.set('ans', ansPending);
    ansPending = null;
  }
  function dropAnswers() { clearTimeout(ansTimer); ansPending = null; answers = {}; store.remove('ans'); }
  window.addEventListener('pagehide', flushAnswers);

  /* ---------------- formatting ---------------- */
  function content() { var C = window.APP_CONTENT || {}; return C[EDU.lang] || C.en || { names: [], items: [] }; }
  function fmtMoney(v) { return '₹' + (v % 1 ? v.toFixed(2) : G.fmtInt(v)); }
  function fmtTime(m) {
    var h = Math.floor(m / 60), s = (h % 12 || 12) + ':' + ('0' + (m % 60)).slice(-2);
    return t(h < 12 ? 'tm_morning' : h < 16 ? 'tm_afternoon' : h < 20 ? 'tm_evening' : 'tm_night', { t: s });
  }
  function fmtDur(m) { return t('dur_hm', { h: Math.floor(m / 60), m: m % 60 }); }
  function fracHtml(fr, w) {
    var f = '<span class="frac"><span class="fn">' + fr[0] + '</span><span class="fd">' + fr[1] + '</span></span>';
    return w ? '<span class="mixed">' + w + f + '</span>' : f;
  }
  var OPEN = { '(': 1, '[': 1, '{': 1 }, CLOSE = { ')': 1, ']': 1, '}': 1 };
  function tokHtml(tk, q, qi) {
    if (typeof tk === 'string') return OPEN[tk] || CLOSE[tk] ? esc(tk) : '<span class="op">' + esc(tk) + '</span>';
    if (tk.box) return boxHtml(q, qi);
    if (tk.n !== undefined) { var s = G.fmtInt(tk.n); return tk.par ? '(' + s + ')' : s; }
    if (tk.dc !== undefined) return esc(tk.dc);
    if (tk.fr) return fracHtml(tk.fr, tk.w);
    if (tk.x !== undefined) return (tk.x === 1 ? '' : tk.x) + '<i class="var">x</i>';
    if (tk.s) return esc(t(tk.s));
    return '';
  }
  function partsHtml(parts, q, qi) {
    var out = '';
    parts.forEach(function (tk, i) {
      var prev = parts[i - 1];
      var gap = i > 0 && !(typeof prev === 'string' && OPEN[prev]) && !(typeof tk === 'string' && CLOSE[tk]) && !(prev && prev.tight);
      out += (gap ? ' ' : '') + tokHtml(tk, q, qi);
    });
    return out;
  }
  function fill(tpl, vars, fn) { return esc(tpl).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? fn(vars[k]) : m; }); }
  function wordVar(tk) {
    var C = content();
    if (tk.nm !== undefined) return esc(C.names[tk.nm] || '');
    if (tk.it !== undefined) return esc((C.items[tk.it] || [])[0] || '');
    if (tk.itp !== undefined) return esc((C.items[tk.itp] || [])[1] || '');
    if (tk.rs !== undefined) return '<bdi>' + fmtMoney(tk.rs) + '</bdi>';
    if (tk.tm !== undefined) return '<bdi>' + esc(fmtTime(tk.tm)) + '</bdi>';
    if (tk.du !== undefined) return '<bdi>' + esc(fmtDur(tk.du)) + '</bdi>';
    if (tk.n !== undefined) return G.fmtInt(tk.n);
    return '';
  }

  /* ---------------- answer boxes ---------------- */
  function ansVal(qi, j) { var a = answers[qi], v = Array.isArray(a) ? a[j] : ''; return typeof v === 'string' ? v : ''; }
  function inp(qi, j, o) {
    var v = ansVal(qi, j);
    return '<input class="ans' + (o.cls ? ' ' + o.cls : '') + '" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="' +
      (o.mode || 'decimal') + '" data-q="' + qi + '" data-j="' + j + '" style="--w:' + (o.w || 4) + 'ch" aria-label="' + esc(o.label) + '"' +
      (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + ' value="' + esc(v) + '">';
  }
  function unit(s) { return '<span class="unit">' + esc(s) + '</span>'; }
  function boxHtml(q, qi) {
    var a = q.a, label = t('ans_aria', { n: qi + 1 }), w = Math.max(3, (q.w || 3) + 1);
    switch (a.k) {
      case 'cmp':
        var cur = ansVal(qi, 0);
        return '<select class="ans cmpbox" data-q="' + qi + '" data-j="0" aria-label="' + esc(t('cmp_aria', { n: qi + 1 })) + '">' +
          ['', '<', '>', '='].map(function (s) { return '<option value="' + esc(s) + '"' + (s === cur ? ' selected' : '') + '>' + (s ? esc(s) : '&nbsp;') + '</option>'; }).join('') + '</select>';
      case 'frac': return inp(qi, 0, { w: 5, label: label, mode: 'text', ph: t('ph_frac') });
      case 'time': return inp(qi, 0, { w: 6, label: label, mode: 'text', ph: t('ph_time') });
      case 'exp': return inp(qi, 0, { label: label, mode: 'text', cls: 'wide-in' });
      case 'dur':
        return '<span class="pair">' + inp(qi, 0, { w: 2.5, label: label + ' · ' + t('u_h') }) + unit(t('u_h')) +
          inp(qi, 1, { w: 2.5, label: label + ' · ' + t('u_min') }) + unit(t('u_min')) + '</span>';
      case 'dr':
        return '<span class="pair">' + unit(t('div_q')) + inp(qi, 0, { w: Math.max(3, q.w + 1), label: label + ' · ' + t('div_q') }) +
          unit(t('div_r')) + inp(qi, 1, { w: 2.5, label: label + ' · ' + t('div_r') }) + '</span>';
    }
    var pre = a.rs ? unit('₹') : '', post = a.unit === '%' ? unit('%') : a.unit === 'min' ? unit(t('u_min')) : '';
    return '<span class="pair" dir="ltr">' + pre + inp(qi, 0, { w: w, label: label, mode: q.neg ? 'text' : 'decimal' }) + post + '</span>';
  }

  /* ---------------- questions ---------------- */
  function vHtml(q, qi) {
    /* box width never hints at the answer: room for a carry digit (+), the full product (×) */
    var lens = q.rows.map(function (r) { return r.s.length; }), op = q.rows[q.rows.length - 1].op;
    var L = op === '×' ? lens.reduce(function (s, x) { return s + x; }, 0) : Math.max.apply(null, lens) + (op === '+' ? 1 : 0);
    L = Math.max(L, G.plain(q)[0].length) + 1;
    var h = '<div class="vsum" dir="ltr" style="--cw:' + L + '">';
    q.rows.forEach(function (r) { h += '<span class="vop">' + esc(r.op) + '</span><span class="vn">' + esc(r.s) + '</span>'; });
    h += '<span class="vline"></span>';
    if (q.tall) h += '<span class="vwork" style="--rows:' + q.tall + '"></span><span class="vline vline2"></span>';   /* room for partial products on paper */
    return h + '<span class="vans">' + boxHtml(q, qi) + '</span></div>';
  }
  function ldHtml(q, qi) {
    return '<div class="ldwrap"><div class="ld" dir="ltr"><span class="ld-dv">' + q.ld.dv + '</span><span class="ld-dd">' + q.ld.dd +
      '</span></div><div class="ld-work"></div><div class="ld-ans">' + boxHtml(q, qi) + '</div></div>';
  }
  function qHtml(q, qi) {
    var body, cls = '';
    if (q.f === 'word') {
      var C = content(), tpl = (C[q.grp] || {})[q.tpl] || '';
      body = '<p class="wp">' + fill(tpl, q.v, wordVar) + '</p><div class="wans"><span class="lbl">' + esc(t('answer')) + ':</span> ' + boxHtml(q, qi) + '</div>';
      cls = ' word';
    } else if (q.f === 'txt') {
      var txt = fill(t(q.key), q.vars, function (parts) { return '<bdi class="m">' + partsHtml(parts, q, qi) + '</bdi>'; });
      if (q.eq) body = '<span class="qt">' + txt + '</span> <span class="expr" dir="ltr">= ' + boxHtml(q, qi) + '</span>';
      else if (q.wide) body = '<span class="qt">' + txt + '</span><div class="wide-ans" dir="ltr">' + boxHtml(q, qi) + '</div>';
      else body = '<span class="qt">' + txt + '</span> ' + boxHtml(q, qi);
    } else if (q.f === 'cmp') {
      body = '<span class="expr cmp" dir="ltr">' + partsHtml(q.l, q, qi) + ' ' + boxHtml(q, qi) + ' ' + partsHtml(q.r, q, qi) + '</span>';
    } else if (q.ld && cfg.layout === 'v') { body = ldHtml(q, qi); cls = ' tallq'; }
    else if (q.rows && cfg.layout === 'v') { body = vHtml(q, qi); cls = ' vq'; }
    else {
      body = '<span class="expr" dir="ltr">' + partsHtml(q.parts, q, qi) + '</span>';
      if (q.post) body += '<div class="post"><span class="expr" dir="ltr">' + partsHtml(q.post, q, qi) + '</span></div>';
    }
    return '<div class="q' + cls + '" data-q="' + qi + '" id="q' + qi + '"><span class="qn">' + (qi + 1) + '.</span><div class="qb">' + body +
      '</div><span class="mark" aria-hidden="true"></span></div>';
  }
  function keyHtml(q) {
    var a = q.a;
    switch (a.k) {
      case 'num':
        var s = a.rs ? fmtMoney(a.v) : a.s ? a.s : G.fmtInt(a.v);
        if (a.unit === '%') s += '%'; else if (a.unit === 'min') s += ' ' + t('u_min');
        return (q.post ? '<i class="var">x</i> = ' : '') + esc(s);
      case 'frac':
        if (a.d === 1) return String(a.n);
        return fracHtml([a.n, a.d]) + (a.n > a.d ? ' = ' + fracHtml([a.n % a.d, a.d], Math.floor(a.n / a.d)) : '');
      case 'cmp': return esc(a.v);
      case 'time': return esc(fmtTime(a.v));
      case 'dur': return esc(fmtDur(a.v));
      case 'dr': return esc(t('key_divrem', { q: a.q, r: a.r }));
      case 'exp': return a.terms.map(G.fmtInt).join(' + ');
    }
    return '';
  }
  function instrKey(id) {
    if (id === 'div') return cfg.rem === 'no' ? 'in_div0' : 'in_div';
    return { fcmp: 'in_compare', dmul: 'in_mul', time: 'in_word', money: 'in_word' }[id] || 'in_' + id;
  }
  function sheetTitle() {
    if (cfg.title.trim()) return cfg.title.trim();
    return cfg.topics.length === 1 ? t('tp_' + cfg.topics[0]) : t('ws_mixed');
  }

  /* ---------------- rendering ---------------- */
  var paper = $('#paper'), body = $('#ws-body'), keyBox = $('#ws-key');

  function renderHeader() {
    var school = cfg.school.trim();
    $('#ws-school').textContent = school;
    $('#ws-school').hidden = !school;
    $('#ws-title').textContent = sheetTitle();
    $('#ws-meta').textContent = t('ws_meta', { level: t('d_' + cfg.diff), n: QS.length });
    $('#ws-total').textContent = String(QS.length);
    $('#ws-foot').textContent = t('ws_foot', { code: cfg.seed });
  }
  function renderPaper() {
    var h = '', qi = 0, multi = sections.length > 1;
    sections.forEach(function (sec) {
      var T = G.TOPIC[sec.topic];
      var cols = cfg.cols === 'auto' ? T.cols : Math.min(+cfg.cols, T.cols === 1 ? 2 : 4);
      if (sec.topic === 'div' && cfg.layout === 'v' && cfg.cols === 'auto') cols = 3;
      var colsM = Math.min(cols, T.m);
      if (sec.topic === 'eq' && cfg.diff === 'hard') colsM = 1;
      if (cfg.layout === 'v' && ((/add|sub/.test(sec.topic) && cfg.digits >= 5) || (/mul|dadd/.test(sec.topic) && cfg.diff === 'hard'))) colsM = 1;
      h += '<section class="ws-sec">';
      if (multi) h += '<h3 class="sec-h">' + esc(t('tp_' + sec.topic)) + '</h3>';
      h += '<p class="sec-i">' + esc(t(instrKey(sec.topic))) + '</p>';
      /* sums, fractions, comparisons… do not wrap: fitColumns() measures them (text questions just wrap) */
      var fit = sec.qs.every(function (q) { return q.f !== 'txt' && q.f !== 'word'; });
      h += '<div class="ws-grid"' + (fit ? ' data-fit="1"' : '') + ' style="--c:' + cols + ';--cm:' + colsM + '">';
      sec.qs.forEach(function (q) { h += qHtml(q, qi++); });
      h += '</div></section>';
    });
    body.innerHTML = h || '<p class="muted">' + esc(t('no_topic')) + '</p>';
    paper.classList.toggle('big', cfg.big);
    renderHeader();
    fitColumns();
  }
  /* The widest question of a section (in em, without padding) becomes --qw. The CSS grid then uses
     fewer columns when the chosen number does not fit: a 1024 px laptop, a phone, an A4 page, large print. */
  function fitColumns() {
    $$('.ws-grid[data-fit]', body).forEach(function (g) {
      g.classList.add('measure');
      var fs = parseFloat(getComputedStyle(g).fontSize) || 16, w = 0;
      $$('.q', g).forEach(function (q) {
        var r = q.getBoundingClientRect(), cs = getComputedStyle(q), lo = Infinity, hi = -Infinity;
        $$('.qn, .qb *', q).forEach(function (el) {
          var b = el.getBoundingClientRect();
          if (b.width) { lo = Math.min(lo, b.left); hi = Math.max(hi, b.right); }
        });
        /* content from the number to the far edge of the widest part (works in RTL too) */
        var inner = hi > lo ? hi - lo : r.width - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
        if (inner > w) w = inner;
      });
      g.classList.remove('measure');
      g.style.setProperty('--qw', w > 0 ? (w / fs + 0.15).toFixed(2) + 'em' : '0em');
    });
  }
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fitColumns);
  function renderKey() {
    var h = '<h3 class="key-h">' + esc(t('key_title')) + ' · ' + esc(sheetTitle()) + ' <span class="muted small">(' + esc(t('opt_code')) + ' ' + cfg.seed + ')</span></h3><ol class="key-list">';
    QS.forEach(function (q, i) {
      var text = ['time', 'dur', 'dr'].indexOf(q.a.k) >= 0;
      h += '<li data-q="' + i + '"><span class="kn">' + (i + 1) + '.</span> <span class="kv"' + (text ? '' : ' dir="ltr"') + '>' + keyHtml(q) + '</span></li>';
    });
    keyBox.innerHTML = h + '</ol>';
    keyBox.hidden = !showKey;
    keyBox.classList.toggle('print-on', cfg.key);
    var kb = $('#btn-key');
    kb.textContent = t(showKey ? 'btn_key_hide' : 'btn_key_show');
    kb.setAttribute('aria-pressed', String(showKey));
  }
  var topicsLang = '';
  function renderTopics() {
    if (topicsLang === EDU.lang && $('#tp-add')) {          /* only update state: never replace a chip under the pointer */
      $$('#topics [data-topic]').forEach(function (b) { b.setAttribute('aria-pressed', String(cfg.topics.indexOf(b.getAttribute('data-topic')) >= 0)); });
      return;
    }
    topicsLang = EDU.lang;
    var h = '';
    G.GROUPS.forEach(function (g) {
      h += '<div class="tgrp"><div class="tgrp-h">' + esc(t(g.key)) + '</div><div class="tchips">';
      g.topics.forEach(function (id) {
        var on = cfg.topics.indexOf(id) >= 0, c = G.TOPIC[id].cls;
        h += '<button type="button" class="chip" id="tp-' + id + '" data-topic="' + id + '" aria-pressed="' + on + '">' + esc(t('tp_' + id)) +
          ' <span class="cls" dir="ltr" title="' + esc(t('cls_tip', { c: c })) + '">' + c.replace('-', '–') + '</span></button>';
      });
      h += '</div></div>';
    });
    $('#topics').innerHTML = h;
  }
  function has(list) { return cfg.topics.some(function (x) { return list.indexOf(x) >= 0; }); }
  function renderControls() {
    renderTopics();
    $$('.seg[data-opt]').forEach(function (seg) {
      var opt = seg.getAttribute('data-opt');
      $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', String(String(cfg[opt]) === b.getAttribute('data-v'))); });
    });
    var minC = minCount(cfg);
    $$('#opt-count option').forEach(function (o) { o.disabled = Number(o.value) < minC; });
    $('#opt-count').value = String(cfg.count);
    $('#opt-digits').value = String(cfg.digits);
    $('#opt-tfrom').value = String(cfg.tFrom);
    $('#opt-tto').value = String(cfg.tTo);
    $('#opt-key').checked = cfg.key;
    $('#opt-big').checked = cfg.big;
    $('#opt-mix').checked = cfg.mix;
    if (document.activeElement !== $('#opt-school')) $('#opt-school').value = cfg.school;
    if (document.activeElement !== $('#opt-title')) $('#opt-title').value = cfg.title;
    if (document.activeElement !== $('#opt-seed')) $('#opt-seed').value = String(cfg.seed);
    $('#grp-digits').hidden = !has(['add', 'sub']);
    $('#grp-digits-n').hidden = !has(['add', 'sub']);
    $('#grp-tables').hidden = !has(['tables']);
    $('#grp-rem').hidden = !has(['div']);
    $('#grp-layout').hidden = !has(V_TOPICS);
  }
  function render() {
    sanitize(cfg);
    sections = G.generate(cfg);
    QS = [];
    sections.forEach(function (s) { s.qs.forEach(function (q) { QS.push(q); }); });
    renderControls();
    renderPaper();
    renderKey();
    if (lastScore) applyMarks(true); else showScore(null);
  }
  function changed(regen) {
    sanitize(cfg);
    saveCfg();
    if (regen) {
      lastScore = null;
      flushAnswers();                                       /* a box typed in just now still belongs to the old sheet */
      answers = loadAnswers();
    }
    render();
  }

  /* ---------------- practice: check answers ---------------- */
  function valsFor(i) {
    return $$('.ans[data-q="' + i + '"]', body).sort(function (a, b) { return a.getAttribute('data-j') - b.getAttribute('data-j'); })
      .map(function (el) { return el.value; });
  }
  function applyMarks(silent) {
    var right = 0, blank = 0;
    QS.forEach(function (q, i) {
      var r = G.check(q, valsFor(i)), el = $('#q' + i), mark = el && $('.mark', el);
      if (!el) return;
      el.classList.remove('ok', 'bad');
      if (r === null) { blank++; mark.textContent = ''; mark.removeAttribute('title'); }
      else {
        if (r) right++;
        el.classList.add(r ? 'ok' : 'bad');
        mark.textContent = r ? '✓' : '✗';
        mark.title = t(r ? 'correct' : 'wrong');
      }
    });
    if (!silent && blank === QS.length) { lastScore = null; showScore(null); EDU.toast(t('need_answer')); return; }
    lastScore = { right: right, total: QS.length, blank: blank };
    showScore(lastScore);
  }
  function showScore(s) {
    var box = $('#score');
    box.hidden = !s;
    if (!s) return;
    var pct = s.total ? Math.round(100 * s.right / s.total) : 0;
    $('#score-num').textContent = s.right + ' / ' + s.total;
    $('#score-line').textContent = t('score_line', { n: s.right, total: s.total });
    $('#score-bar').style.width = pct + '%';
    var msg = pct === 100 ? t('score_full') : pct >= 60 ? t('score_good') : t('score_low');
    if (s.blank) msg += ' ' + t('score_blank', { n: s.blank });
    $('#score-msg').textContent = msg;
    box.className = 'callout ' + (pct === 100 ? 'success' : pct >= 60 ? '' : 'warning');
  }
  function clearMarks(el) {
    el.classList.remove('ok', 'bad');
    var m = $('.mark', el); if (m) m.textContent = '';
  }

  /* ---------------- events ---------------- */
  ['#opt-tfrom', '#opt-tto'].forEach(function (sel) {
    var h = '';
    for (var n = 2; n <= 20; n++) h += '<option>' + n + '</option>';
    $(sel).innerHTML = h;
  });
  if (fromLink) $('#app').classList.add('from-link');
  $('#topics').addEventListener('click', function (e) {
    var b = e.target.closest('[data-topic]');
    if (!b) return;
    var id = b.getAttribute('data-topic'), i = cfg.topics.indexOf(id);
    if (!cfg.mix) cfg.topics = [id];
    else if (i >= 0) { if (cfg.topics.length === 1) { EDU.toast(t('no_topic')); return; } cfg.topics.splice(i, 1); }
    else cfg.topics.push(id);
    changed(true);
  });
  $('#opt-mix').addEventListener('change', function () {
    cfg.mix = this.checked;
    if (!cfg.mix && cfg.topics.length > 1) { cfg.topics = [cfg.topics[0]]; changed(true); } else { saveCfg(); }
  });
  $$('.seg[data-opt]').forEach(function (seg) {
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b) return;
      var opt = seg.getAttribute('data-opt'), v = b.getAttribute('data-v');
      cfg[opt] = v;
      changed(['diff', 'carry', 'rem'].indexOf(opt) >= 0);
    });
  });
  [['#opt-count', 'count'], ['#opt-digits', 'digits'], ['#opt-tfrom', 'tFrom'], ['#opt-tto', 'tTo']].forEach(function (p) {
    $(p[0]).addEventListener('change', function () {
      if (Number(this.value) === cfg[p[1]]) return;
      cfg[p[1]] = Number(this.value); changed(true);
    });
  });
  $('#opt-key').addEventListener('change', function () { cfg.key = this.checked; saveCfg(); keyBox.classList.toggle('print-on', cfg.key); });
  $('#opt-big').addEventListener('change', function () { cfg.big = this.checked; saveCfg(); paper.classList.toggle('big', cfg.big); fitColumns(); });
  $('#opt-school').addEventListener('input', function () { cfg.school = this.value.slice(0, 120); saveCfg(); renderHeader(); });
  $('#opt-title').addEventListener('input', function () { cfg.title = this.value.slice(0, 120); saveCfg(); renderHeader(); renderKey(); });
  $('#opt-seed').addEventListener('change', function () {
    var raw = G.latin(this.value).replace(/[,\s]/g, ''), v = Math.round(Number(raw));
    if (!raw || !isFinite(v) || v < 1) { this.value = String(cfg.seed); return; }
    v = Math.min(99999999, v);
    this.value = String(v);                                 /* show the code that is really used: १२३ → 123, 12.7 → 13 */
    if (v === cfg.seed) return;
    cfg.seed = v;
    changed(true);
  });
  $('#btn-new').addEventListener('click', function () {
    var s; do { s = newSeed(); } while (s === cfg.seed);
    cfg.seed = s; dropAnswers();
    changed(true);
  });
  $('#btn-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    cfg = defaults(); dropAnswers(); showKey = false;
    changed(true);
    EDU.toast(t('reset_done'));
  });
  $('#btn-print').addEventListener('click', function () { window.print(); });
  $('#btn-check').addEventListener('click', function () { applyMarks(false); });
  $('#btn-key').addEventListener('click', function () {
    showKey = !showKey; renderKey();
    if (showKey) keyBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#btn-clear').addEventListener('click', function () {
    dropAnswers(); lastScore = null;
    $$('.ans', body).forEach(function (el) { el.value = ''; });
    $$('.q', body).forEach(clearMarks);
    showScore(null);
    EDU.toast(t('cleared'));
  });
  $('#btn-share').addEventListener('click', function () {
    var data = {};
    ['topics', 'mix', 'diff', 'count', 'cols', 'layout', 'digits', 'carry', 'tFrom', 'tTo', 'rem', 'school', 'title', 'big', 'seed'].forEach(function (k) { data[k] = cfg[k]; });
    /* from a downloaded ZIP (file://) a local path is useless on a student's phone: link to the public site instead */
    var base = location.href.split('#')[0];
    if (location.protocol === 'file:' && typeof EDU.shareUrl === 'function') { try { var pub = EDU.shareUrl(EDU.lang); if (/^https?:\/\//.test(pub)) base = pub; } catch (e) { } }
    var url = base + '#w=' + EDU.pack(data);
    EDU.share(url, t('app_title'));
  });
  $('#btn-jump').addEventListener('click', function () { $('#sheet-area').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#btn-full').addEventListener('click', function () { EDU.fullscreen($('#sheet-area')); });

  function onAnswer(e) {
    var el = e.target;
    if (!el.classList || !el.classList.contains('ans')) return;
    var qi = el.getAttribute('data-q'), j = +el.getAttribute('data-j');
    if (!Array.isArray(answers[qi])) answers[qi] = [];
    answers[qi][j] = el.value;
    saveAnswers();
    var qel = $('#q' + qi);
    if (qel && (qel.classList.contains('ok') || qel.classList.contains('bad'))) clearMarks(qel);
  }
  body.addEventListener('input', onAnswer);
  body.addEventListener('change', onAnswer);
  body.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !e.target.classList.contains('ans')) return;
    e.preventDefault();
    var all = $$('.ans', body), i = all.indexOf(e.target);
    if (i >= 0 && i < all.length - 1) all[i + 1].focus(); else $('#btn-check').focus();
  });

  /* for the automated test */
  window.WSG = { count: function () { return QS.length; }, plain: function (i) { return G.plain(QS[i]); }, kind: function (i) { return QS[i].a.k; } };

  /* a second shared link opened in the same tab only changes the #hash: load it properly */
  window.addEventListener('hashchange', function () { if (/[#&]w=[A-Za-z0-9_-]+/.test(location.hash)) location.reload(); });

  EDU.onLang(render);
  render();
  if (fromLink) {
    saveCfg();                                              /* keep the shared sheet, then drop the #w=… so a reload keeps later changes */
    try { history.replaceState(history.state, '', location.href.split('#')[0]); } catch (e) { }
    EDU.toast(t('shared_loaded'));
    setTimeout(function () { $('#sheet-area').scrollIntoView({ block: 'start' }); }, 50);
  }
})();
