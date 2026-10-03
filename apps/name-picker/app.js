/* Name Picker & Groups: fair random picker (spinning wheel + card flip), daily attendance,
   saved class lists and a balanced group maker with "keep apart" pairs.
   Everything runs on this device; class lists are kept with EDU.store('name-picker'). */
(function () {
  'use strict';
  var SLUG = 'name-picker';
  var MAX_NAMES = 500, MAX_LEN = 60, MAX_PICK = 20, MAX_GROUP_VAL = 60, MAX_HISTORY = 1000;
  var TAU = Math.PI * 2, POINTER = -Math.PI / 2;           // the pointer sits at 12 o'clock
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, el = EDU.el;
  var fmt = function (n) { return EDU.fmt(n); };
  var store = EDU.store(SLUG);
  var CONTENT = window.APP_CONTENT || {};

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- fair randomness (crypto.getRandomValues, no modulo bias) ---------------- */
  var cryptoObj = window.crypto || window.msCrypto;
  function rnd32() {
    if (cryptoObj && cryptoObj.getRandomValues) { var a = new Uint32Array(1); cryptoObj.getRandomValues(a); return a[0]; }
    return Math.floor(Math.random() * 4294967296);
  }
  function randBelow(n) {                     // uniform integer in [0, n)
    if (n <= 1) return 0;
    var limit = 4294967296 - (4294967296 % n), x;
    do { x = rnd32(); } while (x >= limit);
    return x % n;
  }
  function randUnit() { return rnd32() / 4294967296; }
  function shuffle(arr) {                      // Fisher–Yates
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = randBelow(i + 1), x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function clampInt(v, lo, hi, d) { v = parseInt(v, 10); if (isNaN(v)) v = d; return Math.max(lo, Math.min(hi, v)); }
  function mod(a, m) { return ((a % m) + m) % m; }

  /* ---------------- content + data ---------------- */
  function content() { return CONTENT[EDU.lang] || CONTENT.en || {}; }
  function sampleNames() { return (content().names || []).slice(); }
  var SAMPLE_COUNT = ((CONTENT.en || {}).names || []).length;

  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function uid() { return 'c' + Date.now().toString(36) + rnd32().toString(36).slice(0, 4); }
  function blankClass(isSample, name, names) {
    return { id: uid(), name: name || '', sample: !!isSample, names: names || [], picked: [], absent: [], absentDay: today(), apart: [], groups: null, groupsOk: true };
  }
  function arr(a) { return Array.isArray(a) ? a : []; }
  function uniq(a) { var seen = {}, out = []; a.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; }
  function idxOk(n) { return function (i) { return typeof i === 'number' && i % 1 === 0 && i >= 0 && i < n; }; }

  function cleanClass(c) {
    if (!c || typeof c !== 'object') return null;
    var o = blankClass(!!c.sample, typeof c.name === 'string' ? c.name.slice(0, 60) : '',
      arr(c.names).filter(function (x) { return typeof x === 'string' && x.trim(); }).map(function (x) { return x.slice(0, MAX_LEN); }).slice(0, MAX_NAMES));
    if (typeof c.id === 'string' && c.id) o.id = c.id;
    var ok = idxOk(o.sample ? SAMPLE_COUNT : o.names.length);
    o.picked = arr(c.picked).filter(ok).slice(-MAX_HISTORY);
    o.absent = uniq(arr(c.absent).filter(ok));
    o.absentDay = typeof c.absentDay === 'string' ? c.absentDay : today();
    o.apart = arr(c.apart).filter(function (p) { return Array.isArray(p) && ok(p[0]) && ok(p[1]) && p[0] !== p[1]; });
    o.groups = Array.isArray(c.groups) && c.groups.length && c.groups.every(function (g) { return Array.isArray(g) && g.every(ok); }) ? c.groups : null;
    o.groupsOk = c.groupsOk !== false;
    return o;
  }

  var data = (function () {
    var d = store.get('data', null), classes = [];
    if (d && Array.isArray(d.classes)) classes = d.classes.map(cleanClass).filter(Boolean);
    if (!classes.length) classes = [blankClass(true)];
    var cur = d && classes.some(function (c) { return c.id === d.current; }) ? d.current : classes[0].id;
    return { classes: classes, current: cur };
  })();

  var DEFAULTS = { mode: 'wheel', pickN: 1, noRepeat: true, sound: true, groupBy: 'count', groupCount: 4, groupSize: 4, theme: 'num', tab: 'pick' };
  var settings = (function () {
    var s = store.get('settings', null), o = {};
    Object.keys(DEFAULTS).forEach(function (k) { o[k] = s && typeof s[k] === typeof DEFAULTS[k] ? s[k] : DEFAULTS[k]; });
    if (['wheel', 'cards'].indexOf(o.mode) < 0) o.mode = 'wheel';
    if (['count', 'size'].indexOf(o.groupBy) < 0) o.groupBy = 'count';
    if (['num', 'planets', 'rivers', 'birds'].indexOf(o.theme) < 0) o.theme = 'num';
    if (['pick', 'groups', 'list'].indexOf(o.tab) < 0) o.tab = 'pick';
    o.pickN = clampInt(o.pickN, 1, MAX_PICK, 1);
    o.groupCount = clampInt(o.groupCount, 2, MAX_GROUP_VAL, 4);
    o.groupSize = clampInt(o.groupSize, 2, MAX_GROUP_VAL, 4);
    return o;
  })();

  function save() { store.set('data', data); }
  function saveSettings() { store.set('settings', settings); }

  function cls() {
    for (var i = 0; i < data.classes.length; i++) if (data.classes[i].id === data.current) return data.classes[i];
    data.current = data.classes[0].id;
    return data.classes[0];
  }
  function namesOf(c) { return c.sample ? sampleNames() : c.names; }
  function className(c) {
    if (c.name) return c.name;
    return c.sample ? t('sample_class') : t('new_class_name', { n: fmt(data.classes.indexOf(c) + 1) });
  }
  function checkDay(c) { var d = today(); if (c.absentDay !== d) { c.absent = []; c.absentDay = d; } }
  function presentIdx(c) {
    checkDay(c);
    var n = namesOf(c).length, ab = {}, out = [];
    c.absent.forEach(function (i) { ab[i] = 1; });
    for (var i = 0; i < n; i++) if (!ab[i]) out.push(i);
    return out;
  }
  function pool(c) {
    var p = presentIdx(c);
    if (!settings.noRepeat) return p;
    var done = {};
    c.picked.forEach(function (i) { done[i] = 1; });
    return p.filter(function (i) { return !done[i]; });
  }

  /* ---------------- sound (WebAudio, no files) ---------------- */
  var actx = null;
  function audio() {
    if (!settings.sound) return null;
    try {
      if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; actx = new AC(); }
      if (actx.state === 'suspended' && actx.resume) actx.resume();
      return actx;
    } catch (e) { return null; }
  }
  function beep(freq, delay, len, vol, type) {
    var a = audio(); if (!a) return;
    try {
      var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
      o.connect(g); g.connect(a.destination);
      o.start(t0); o.stop(t0 + len + 0.03);
    } catch (e) { /* audio is optional */ }
  }
  function tick() { beep(1300, 0, 0.035, 0.07, 'square'); }
  function fanfare() { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { beep(f, i * 0.09, i === 3 ? 0.5 : 0.16, 0.12, 'triangle'); }); }

  /* ---------------- wheel drawing ---------------- */
  var canvas = $('#wheel'), ctx = canvas.getContext('2d');
  var wheel = { items: [], rot: 0, highlight: [] };
  var busy = false, lastPick = [], token = 0, listDirty = false;
  var pal = null, fontFam = null, labelCache = {};

  function palette() {
    if (!pal) {
      pal = { c: [] };
      for (var i = 1; i <= 8; i++) pal.c.push(EDU.css('--c' + i) || '#888888');
      ['surface', 'surface-2', 'border', 'text', 'muted', 'primary', 'accent'].forEach(function (k) { pal[k] = EDU.css('--' + k); });
    }
    return pal;
  }
  function family() { if (!fontFam) fontFam = getComputedStyle(document.body).fontFamily || 'sans-serif'; return fontFam; }
  function inkFor(color) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(color).trim());
    if (!m) return '#ffffff';
    var v = parseInt(m[1], 16);
    var lin = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    var L = 0.2126 * lin((v >> 16) & 255) + 0.7152 * lin((v >> 8) & 255) + 0.0722 * lin(v & 255);
    return L > 0.2 ? '#111111' : '#ffffff';
  }
  function colorIndex(i, n) { var k = i % 8; if (n > 1 && i === n - 1 && k === 0) k = 3; return k; }
  var segmenter = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  function graphemes(s) { return segmenter ? Array.from(segmenter.segment(s), function (x) { return x.segment; }) : Array.from(s); }
  function fit(s, maxW, key) {
    var k = key + '|' + s;
    if (labelCache[k] !== undefined) return labelCache[k];
    var out = s;
    if (ctx.measureText(s).width > maxW) {
      var g = graphemes(s);
      while (g.length > 1 && ctx.measureText(g.join('') + '…').width > maxW) g.pop();
      out = g.join('') + '…';
    }
    labelCache[k] = out;
    return out;
  }

  function drawWheel() {
    var W = canvas.width; if (!W) return;
    var cssW = canvas.getBoundingClientRect().width || W, k = W / cssW;
    var P = palette(), cx = W / 2, cy = W / 2, R = W / 2 - 2 * k, r = R - 7 * k;
    var pw = Math.max(10 * k, r * 0.05), ph = Math.max(20 * k, r * 0.1);       // pointer size
    var textEnd = Math.min(r - 12 * k, R - ph - 3 * k);                          // names stop before the pointer tip
    var items = wheel.items, n = items.length, names = namesOf(cls());
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, W);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = P.border; ctx.fill();
    if (!n) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = P['surface-2']; ctx.fill();
      ctx.fillStyle = P.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 ' + Math.round(Math.max(14 * k, r * 0.07)) + 'px ' + family();
      ctx.fillText(t('wheel_empty'), cx, cy + r * 0.45);
    } else {
      var seg = TAU / n, hl = wheel.highlight, hlSet = {};
      hl.forEach(function (i) { hlSet[i] = 1; });
      var fs = Math.round(Math.max(8 * k, Math.min(30 * k, seg * r * 0.4, r * 0.105)));
      var maxW = textEnd - r * 0.27, showText = seg * r * 0.62 >= 7 * k;      // 0.27r ≈ edge of the centre button
      ctx.font = '700 ' + fs + 'px ' + family();
      var key = fs + '|' + Math.round(maxW) + '|' + EDU.lang;
      for (var i = 0; i < n; i++) {
        var a0 = wheel.rot + i * seg, col = P.c[colorIndex(i, n)], dim = hl.length && !hlSet[items[i]];
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a0 + seg); ctx.closePath();
        ctx.globalAlpha = dim ? 0.3 : 1; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
        if (n > 1) { ctx.lineWidth = Math.max(1, (n > 80 ? 0.6 : 1.8) * k); ctx.strokeStyle = P.surface; ctx.stroke(); }
        if (showText) {
          ctx.save();
          ctx.translate(cx, cy); ctx.rotate(a0 + seg / 2);
          ctx.fillStyle = inkFor(col); ctx.globalAlpha = dim ? 0.55 : 1;
          ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          ctx.fillText(fit(String(names[items[i]] || ''), maxW, key), textEnd, 0);
          ctx.restore();
        }
      }
      // ring around the chosen segment(s)
      hl.forEach(function (ix) {
        var p = items.indexOf(ix); if (p < 0) return;
        var a0 = wheel.rot + p * seg;
        ctx.beginPath(); ctx.arc(cx, cy, r - 3 * k, a0 + 0.004, a0 + seg - 0.004);
        ctx.lineWidth = 6 * k; ctx.strokeStyle = P.accent; ctx.stroke();
      });
    }
    // centre disc (the HTML "Spin" button sits on top of it)
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.15, 0, TAU); ctx.fillStyle = P.surface; ctx.fill();
    // pointer at the top
    ctx.beginPath(); ctx.moveTo(cx - pw, 2 * k); ctx.lineTo(cx + pw, 2 * k); ctx.lineTo(cx, ph); ctx.closePath();
    ctx.lineJoin = 'round'; ctx.lineWidth = 3 * k; ctx.strokeStyle = P.surface; ctx.stroke();
    ctx.fillStyle = P.accent; ctx.fill();
    canvas.setAttribute('aria-label', t('wheel_aria', { n: fmt(n) }));
  }

  function sizeCanvas() {
    var wrap = $('#wheelWrap');
    if (wrap.hidden) return;
    var w = Math.round(wrap.clientWidth);
    if (!w) return;
    var px = Math.round(w * Math.min(window.devicePixelRatio || 1, 2));
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; labelCache = {}; }
    drawWheel();
  }
  function refreshWheel() {                     // show the current pool on the wheel (not during a spin)
    if (busy) return;
    wheel.items = pool(cls());
    wheel.highlight = [];
    drawWheel();
  }

  function reducedMotion() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function segAt(rot, n) { return Math.floor(mod(POINTER - rot, TAU) / (TAU / n)) % n; }

  function spinTo(pos, done) {
    var n = wheel.items.length, seg = TAU / n, red = reducedMotion();
    var target = POINTER - (pos + 0.15 + 0.7 * randUnit()) * seg;   // land inside the chosen segment, never on a line
    var start = wheel.rot, delta = mod(target - start, TAU) + TAU * (red ? 1 : 5 + randBelow(3));
    var dur = red ? 700 : 4300 + randBelow(1300), t0 = null, last = segAt(start, n), lastTick = 0;
    function frame(now) {
      if (t0 === null) t0 = now;
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);   // ease-out quart: fast start, slow finish
      wheel.rot = start + delta * e;
      var s = segAt(wheel.rot, n);
      if (s !== last) { last = s; if (now - lastTick > 28) { lastTick = now; tick(); } }
      drawWheel();
      if (p < 1) requestAnimationFrame(frame);
      else { wheel.rot = mod(wheel.rot, TAU); done(); }
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- card flip mode ---------------- */
  function buildCards(count, names) {
    var wrap = $('#cardsWrap');
    wrap.innerHTML = '';
    wrap.className = 'cards ' + (count === 1 ? 'one' : count <= 4 ? 'few' : 'many');
    for (var i = 0; i < count; i++) {
      wrap.appendChild(el('div', { class: 'flip' + (names ? ' flipped' : '') },
        el('div', { class: 'flip-in' },
          el('div', { class: 'face back', 'aria-hidden': 'true' }, '?'),
          el('div', { class: 'face front no-i18n' }, names ? names[i] : ''))));
    }
  }
  function renderCardsIdle() {
    if (busy) return;
    var names = namesOf(cls());
    if (lastPick.length) { buildCards(lastPick.length, lastPick.map(function (i) { return names[i] || ''; })); return; }
    var avail = pool(cls()).length || presentIdx(cls()).length;
    buildCards(Math.max(1, Math.min(settings.pickN, avail || 1)), null);
  }
  function flipCards(chosen, done) {
    var names = namesOf(cls()), wrap = $('#cardsWrap'), red = reducedMotion();
    buildCards(chosen.length, null);
    wrap.classList.add('shuffling');
    var iv = setInterval(tick, 110);
    setTimeout(function () {
      clearInterval(iv);
      wrap.classList.remove('shuffling');
      var cards = $$('.flip', wrap), gap = red ? 0 : 140;
      cards.forEach(function (cd, i) {
        $('.front', cd).textContent = names[chosen[i]] || '';
        setTimeout(function () { cd.classList.add('flipped'); tick(); }, gap * i);
      });
      setTimeout(done, red ? 60 : gap * (cards.length - 1) + 650);
    }, red ? 200 : 950);
  }

  /* ---------------- picking ---------------- */
  function setBusy(b) {
    busy = b;
    ['#spinBtn', '#hubBtn', '#classSel', '#restoreBtn'].forEach(function (s) { $(s).disabled = b; });
    $$('#modeSeg button').forEach(function (x) { x.disabled = b; });
    $('#pickCard').setAttribute('aria-busy', b ? 'true' : 'false');
  }

  /* On phones the wheel / cards sit above the Pick button: bring them into view so the result is seen. */
  function revealStage() {
    if (document.fullscreenElement) return;
    var r = $('.pick-stage').getBoundingClientRect(), top = $('.edu-top');
    var hb = top ? Math.max(0, top.getBoundingClientRect().bottom) : 0;
    if (r.top >= hb - 2 && r.bottom <= window.innerHeight + 2) return;
    try { window.scrollTo({ top: Math.max(0, window.pageYOffset + r.top - hb - 8), behavior: reducedMotion() ? 'auto' : 'smooth' }); }
    catch (e) { window.scrollTo(0, Math.max(0, window.pageYOffset + r.top - hb - 8)); }
  }

  function doPick() {
    if (busy) return;
    var c = cls();
    if (!namesOf(c).length) { EDU.toast(t('empty_list')); return; }
    if (!presentIdx(c).length) { EDU.toast(t('no_present')); return; }
    var p = pool(c);
    if (!p.length) {                            // everyone had a turn → new round
      c.picked = []; save();
      p = pool(c);
      EDU.toast(t('new_round'));
      renderHistory();
    }
    var k = Math.min(settings.pickN, p.length);
    var chosen = shuffle(p).slice(0, k);
    var tok = token;
    lastPick = [];
    audio();                                    // unlock audio inside the click
    setBusy(true);
    var w = $('#winner');
    w.innerHTML = ''; w.classList.remove('multi', 'many', 'sr-only');
    w.appendChild(el('span', { class: 'winner-hint', text: '…' }));
    revealStage();
    if (settings.mode === 'wheel') {
      wheel.items = p.slice();
      wheel.highlight = [];
      spinTo(wheel.items.indexOf(chosen[0]), function () {
        wheel.highlight = chosen.slice();
        drawWheel();
        finish(chosen, tok);
      });
    } else {
      flipCards(chosen, function () { finish(chosen, tok); });
    }
  }

  function finish(chosen, tok) {
    setBusy(false);
    if (tok !== token) { refreshWheel(); renderPick(); return; }   // the list changed during the spin
    var c = cls();
    c.picked = c.picked.concat(chosen);
    if (c.picked.length > MAX_HISTORY) c.picked = c.picked.slice(-MAX_HISTORY);
    lastPick = chosen;
    save();
    renderWinner(); renderRemaining(); renderHistory();
    fanfare();
  }

  /* ---------------- rendering: shared ---------------- */
  function renderClassBar() {
    var sel = $('#classSel');
    sel.innerHTML = '';
    data.classes.forEach(function (c) { sel.appendChild(el('option', { value: c.id, text: className(c) })); });
    sel.value = cls().id;
    var c = cls(), n = namesOf(c).length;
    checkDay(c);
    var a = c.absent.length;
    $('#classInfo').textContent = a ? t('class_info_absent', { n: fmt(n), a: fmt(a) }) : t('class_info', { n: fmt(n) });
  }

  function showTab(name, focus) {
    if (settings.tab === 'list' && name !== 'list') maybeAutosave();
    settings.tab = name; saveSettings();
    ['pick', 'groups', 'list'].forEach(function (k) {
      var b = $('#tab-' + k), on = k === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#panel-' + k).hidden = !on;
    });
    if (focus) $('#tab-' + name).focus();
    if (name === 'pick') { sizeCanvas(); if (settings.mode === 'cards') renderCardsIdle(); }
    if (name === 'groups') renderGroupSettings();
    if (name === 'list') renderList();
  }

  /* ---------------- rendering: picker ---------------- */
  function renderWinner() {
    var w = $('#winner'), names = namesOf(cls()), cards = settings.mode === 'cards';
    w.innerHTML = '';
    w.classList.toggle('multi', lastPick.length > 1);
    w.classList.toggle('many', lastPick.length > 3);
    w.classList.toggle('sr-only', cards && lastPick.length > 0);   // in card mode the cards themselves show the names
    if (!lastPick.length) { w.appendChild(el('span', { class: 'winner-hint', text: t(cards ? 'cards_hint' : 'winner_hint') })); return; }
    lastPick.forEach(function (i) { w.appendChild(el('span', { class: 'winner-name no-i18n', text: names[i] || '' })); });
  }
  function renderRemaining() {
    var c = cls(), present = presentIdx(c).length, left = pool(c).length, bar = $('#remainBar');
    if (settings.noRepeat) {
      $('#remaining').textContent = t('remaining', { n: fmt(left), total: fmt(present) });
      bar.hidden = false;
      $('span', bar).style.width = (present ? Math.round(left / present * 100) : 0) + '%';
    } else {
      $('#remaining').textContent = t('all_can_repeat');
      bar.hidden = true;
    }
    var lbl = $('#restoreLbl'), key = settings.noRepeat ? 'restore' : 'clear_history';
    lbl.setAttribute('data-i18n', key); lbl.textContent = t(key);
    $('#restoreBtn').disabled = busy || !c.picked.length;
  }
  function renderHistory() {
    var c = cls(), names = namesOf(c), h = $('#history');
    h.innerHTML = '';
    if (!c.picked.length) { h.appendChild(el('p', { class: 'muted small mb0', text: t('none_yet') })); return; }
    var start = Math.max(0, c.picked.length - 200);   // show the latest 200
    for (var k = start; k < c.picked.length; k++) {
      h.appendChild(el('span', { class: 'chip pchip' }, el('b', { text: fmt(k + 1) }), el('span', { class: 'no-i18n', text: names[c.picked[k]] || '?' })));
    }
  }
  function renderPick() {
    var wheelMode = settings.mode === 'wheel';
    $$('#modeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === settings.mode ? 'true' : 'false'); });
    $('#wheelWrap').hidden = !wheelMode;
    $('#cardsWrap').hidden = wheelMode;
    $('#wheelTip').hidden = !wheelMode;
    var lbl = $('#spinLbl'), key = wheelMode ? 'spin' : 'pick_btn';
    lbl.setAttribute('data-i18n', key); lbl.textContent = t(key);
    $('#pickN').value = settings.pickN;
    $('#noRepeat').checked = settings.noRepeat;
    var sb = $('#soundBtn');
    sb.setAttribute('aria-pressed', settings.sound ? 'true' : 'false');
    $('.ic-on', sb).hidden = !settings.sound;
    $('.ic-off', sb).hidden = settings.sound;
    if (!wheelMode) renderCardsIdle();
    if (!busy) renderWinner();
    renderRemaining(); renderHistory();
    if (wheelMode) sizeCanvas();
  }

  /* ---------------- groups ---------------- */
  function groupName(i) {
    var list = settings.theme === 'num' ? null : content()[settings.theme];
    if (!list || !list.length) return t('group_n', { n: fmt(i + 1) });
    var round = Math.floor(i / list.length);
    return list[i % list.length] + (round ? ' ' + fmt(round + 1) : '');
  }

  /* Split ids into g balanced groups (sizes differ by at most 1). Pairs in `apart` are kept in
     different groups when possible: students with the most constraints are placed first, and we
     retry with fresh random orders until every pair is separated. */
  function partition(ids, g, apart) {
    var n = ids.length, base = Math.floor(n / g), extra = n % g;
    var conflicts = {};
    apart.forEach(function (p) {
      (conflicts[p[0]] = conflicts[p[0]] || []).push(p[1]);
      (conflicts[p[1]] = conflicts[p[1]] || []).push(p[0]);
    });
    var tries = apart.length ? 400 : 1, best = null, bestBad = Infinity;
    for (var attempt = 0; attempt < tries; attempt++) {
      var caps = shuffle(range(g).map(function (i) { return base + (i < extra ? 1 : 0); }));
      var order = shuffle(ids);
      if (apart.length) order.sort(function (a, b) { return (conflicts[b] || []).length - (conflicts[a] || []).length; });
      var groups = range(g).map(function () { return []; }), where = {}, bad = 0;
      order.forEach(function (s) {
        var free = [], clean = [];
        for (var i = 0; i < g; i++) {
          if (groups[i].length >= caps[i]) continue;
          free.push(i);
          if (!(conflicts[s] || []).some(function (o) { return where[o] === i; })) clean.push(i);
        }
        var choices = clean.length ? clean : free;
        if (!clean.length) bad++;
        var pick = choices[randBelow(choices.length)];
        groups[pick].push(s); where[s] = pick;
      });
      if (bad < bestBad) { bestBad = bad; best = groups; }
      if (!bad) break;
    }
    best.forEach(function (gr) { gr.sort(function (a, b) { return a - b; }); });   // roll-list order inside a group
    return { groups: best, ok: bestBad === 0 };
  }

  function makeGroups() {
    var c = cls(), present = presentIdx(c), n = present.length;
    if (n < 2) { EDU.toast(t('too_few')); return; }
    var g = settings.groupBy === 'count'
      ? Math.min(settings.groupCount, n)
      : Math.ceil(n / Math.min(settings.groupSize, n));
    var inClass = {};
    present.forEach(function (i) { inClass[i] = 1; });
    var res = partition(present, Math.max(1, g), c.apart.filter(function (p) { return inClass[p[0]] && inClass[p[1]]; }));
    c.groups = res.groups; c.groupsOk = res.ok;
    save();
    renderGroups();
    if (!res.ok) EDU.toast(t('apart_failed'));
  }

  function renderGroupSettings() {
    var by = settings.groupBy;
    $$('#groupBySeg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.by === by ? 'true' : 'false'); });
    $('#groupValLabel').textContent = t(by === 'count' ? 'count_label' : 'size_label');
    $('#groupVal').value = by === 'count' ? settings.groupCount : settings.groupSize;
    var th = $('#groupTheme');
    th.innerHTML = '';
    [['num', 'names_num'], ['planets', 'names_planets'], ['rivers', 'names_rivers'], ['birds', 'names_birds']].forEach(function (o) {
      th.appendChild(el('option', { value: o[0], text: t(o[1]) }));
    });
    th.value = settings.theme;
    renderPairs();
  }

  function renderPairs() {
    var c = cls(), names = namesOf(c), A = $('#apartA'), B = $('#apartB');
    var va = A.value, vb = B.value;
    [A, B].forEach(function (s) {
      s.innerHTML = '';
      names.forEach(function (nm, i) { s.appendChild(el('option', { value: String(i), text: nm })); });
    });
    if (names.length) {
      A.value = va !== '' && +va < names.length ? va : '0';
      B.value = vb !== '' && +vb < names.length ? vb : String(Math.min(1, names.length - 1));
    }
    var ul = $('#pairs');
    ul.innerHTML = '';
    c.apart.forEach(function (p, k) {
      ul.appendChild(el('li', {},
        el('span', { class: 'no-i18n', text: (names[p[0]] || '?') + ' ↔ ' + (names[p[1]] || '?') }),
        el('button', { type: 'button', 'aria-label': t('remove_pair'), title: t('remove_pair'), text: '✕', onclick: function () {
          c.apart.splice(k, 1); save(); renderPairs();
        } })));
    });
  }

  function renderGroups() {
    var c = cls(), out = $('#groups'), has = !!(c.groups && c.groups.length);
    out.innerHTML = '';
    $('#groupsEmpty').hidden = has;
    $('#groupActions').hidden = !has;
    $('#apartWarn').hidden = !has || c.groupsOk !== false;
    $('#printTitle').textContent = t('print_title', { cls: className(c) });
    $('#printDate').textContent = dateStr();
    if (!has) { $('#groupsSummary').textContent = ''; return; }
    var names = namesOf(c), total = 0;
    c.groups.forEach(function (g, i) {
      total += g.length;
      var card = el('article', { class: 'gcard' },
        el('header', { class: 'ghead' }, el('h3', { text: groupName(i) }), el('span', { class: 'badge', text: fmt(g.length) })),
        el('ol', { class: 'gmembers no-i18n' }, g.map(function (ix) { return el('li', { text: names[ix] || '?' }); })));
      card.style.setProperty('--gc', 'var(--c' + (i % 8 + 1) + ')');
      card.style.animationDelay = Math.min(i * 40, 600) + 'ms';
      out.appendChild(card);
    });
    $('#groupsSummary').textContent = t('groups_summary', { n: fmt(total), g: fmt(c.groups.length) });
  }

  function groupsText() {
    var c = cls(), names = namesOf(c);
    var lines = [className(c) + ' · ' + $('#groupsSummary').textContent, ''];
    c.groups.forEach(function (g, i) {
      lines.push(groupName(i) + ' (' + fmt(g.length) + '): ' + g.map(function (ix) { return names[ix]; }).join(', '));
    });
    return lines.join('\n');
  }
  function dateStr() {
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag + '-u-nu-latn', { dateStyle: 'long' }).format(new Date()); }
    catch (e) { return new Date().toDateString(); }
  }

  /* ---------------- class list ---------------- */
  function cleanName(s) {
    s = String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
    s = s.replace(/^["']+|["']+$/g, '').trim();
    s = s.replace(/^\d{1,4}\s*[.)\]:-]+\s*(?=\S)/, '');     // "12. Aarav" / "3) Diya" → name only
    s = s.slice(0, MAX_LEN).trim();
    return HAS_WORD.test(s) ? s : '';                         // drop cells that are only punctuation
  }
  var HAS_WORD = (function () { try { return new RegExp('[\\p{L}\\p{N}]', 'u'); } catch (e) { return /[^\s.,;:'"()\[\]{}\-_|\/\\*#!?]/; } })();
  function parseNames(raw) {
    raw = String(raw || '');
    var parts = raw.split(/\r\n|\r|\n/);
    if (parts.filter(function (x) { return x.trim(); }).length <= 1 && /[,;،]/.test(raw)) parts = raw.split(/[,;،]/);
    return parts.map(cleanName).filter(Boolean);
  }
  function sameList(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }

  /* Keep picked / absent / keep-apart info for names that are still in the new list. */
  function remapper(oldNames, newNames) {
    var pos = {}, seen = {};
    newNames.forEach(function (nm, i) { (pos[nm] = pos[nm] || []).push(i); });
    var map = oldNames.map(function (nm) {
      var k = seen[nm] || 0; seen[nm] = k + 1;
      return pos[nm] && pos[nm][k] !== undefined ? pos[nm][k] : -1;
    });
    return function (i) { return map[i] === undefined ? -1 : map[i]; };
  }
  function setNames(c, names) {
    var m = remapper(namesOf(c), names);
    c.picked = c.picked.map(m).filter(function (i) { return i >= 0; });
    c.absent = uniq(c.absent.map(m).filter(function (i) { return i >= 0; }));
    c.apart = c.apart.map(function (p) { return [m(p[0]), m(p[1])]; }).filter(function (p) { return p[0] >= 0 && p[1] >= 0 && p[0] !== p[1]; });
    c.groups = null; c.groupsOk = true;
    c.sample = false;
    c.names = names;
  }
  function afterListChange() {
    token++; lastPick = []; listDirty = false;
    save();
    refreshWheel();
    renderAll();
  }

  function saveList(quiet) {
    var c = cls(), names = parseNames($('#namesInput').value);
    listDirty = false;
    var cut = names.length > MAX_NAMES;
    if (cut) names = names.slice(0, MAX_NAMES);
    if ((c.sample && sameList(names, sampleNames())) || (!c.sample && sameList(names, c.names))) { renderList(); return; }
    setNames(c, names);
    afterListChange();
    if (!quiet || cut) EDU.toast(cut ? t('too_many', { n: fmt(MAX_NAMES) }) : t('list_saved', { n: fmt(names.length) }));
  }
  function maybeAutosave() { if (listDirty) saveList(true); }

  function namesFromFile(text) {
    text = String(text || '').replace(/^﻿/, '');
    var first = text.split(/\r\n|\r|\n/).filter(function (l) { return HAS_WORD.test(l); })[0] || '';
    var counts = { ',': (first.match(/,/g) || []).length, ';': (first.match(/;/g) || []).length, '\t': (first.match(/\t/g) || []).length };
    var delim = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
    var rows;
    if (!counts[delim]) rows = text.split(/\r\n|\r|\n/).map(function (l) { return [l]; });
    else if (delim === ',') rows = EDU.csv.parse(text);
    else rows = text.split(/\r\n|\r|\n/).map(function (l) { return l.split(delim); });
    rows = rows.filter(function (r) { return r.some(function (x) { return HAS_WORD.test(String(x)); }); });
    if (!rows.length) return [];
    var width = Math.max.apply(null, rows.map(function (r) { return r.length; }));
    // a header cell that ends with "name" (Name, Student Name, नाम, छात्र का नाम …) but is not a parent's name
    var NAME_HDR = /(^|[\s_'’-])(names?|naam|नाम|নাম|नाव|નામ|ਨਾਂ|ਨਾਮ|ନାମ|பெயர்|పేరు|ಹೆಸರು|പേര്|نام)\s*$/i;
    var PARENT_HDR = /father|mother|parent|guardian|पिता|माता|अभिभावक|वडील|आई/i;
    var col = -1, header = false;
    rows[0].forEach(function (cell, i) {
      var v = String(cell).trim();
      if (col < 0 && NAME_HDR.test(v) && !PARENT_HDR.test(v)) { col = i; header = true; }
    });
    if (col < 0) {                               // pick the column with the most "name-like" cells
      var bestScore = -1;
      for (var i = 0; i < width; i++) {
        var score = rows.filter(function (r) { var v = String(r[i] || '').trim(); return v && !/^[\d\s.\/:-]+$/.test(v); }).length;
        if (score > bestScore) { bestScore = score; col = i; }
      }
    }
    return rows.slice(header ? 1 : 0).map(function (r) { return cleanName(r[col]); }).filter(Boolean);
  }

  function importCsv() {
    EDU.pickFile('.csv,.txt,text/csv,text/plain').then(function (file) {
      if (!file) return null;
      return EDU.readText(file).then(function (text) {
        var names = namesFromFile(text);
        if (!names.length) { EDU.toast(t('import_failed')); return; }
        var c = cls();
        if (!c.sample && c.names.length && !confirm(t('confirm_replace'))) return;
        var cut = names.length > MAX_NAMES;
        names = names.slice(0, MAX_NAMES);
        var hadName = !!c.name;
        setNames(c, names);
        if (!hadName) c.name = String(file.name || '').replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim().slice(0, 40);
        afterListChange();
        EDU.toast(cut ? t('too_many', { n: fmt(MAX_NAMES) }) : t('imported_n', { n: fmt(names.length) }));
      });
    }).catch(function () { EDU.toast(t('import_failed')); });
  }

  function renderAttendance() {
    var c = cls(), names = namesOf(c), box = $('#attendance'), ab = {};
    checkDay(c);
    c.absent.forEach(function (i) { ab[i] = 1; });
    box.innerHTML = '';
    names.forEach(function (nm, i) {
      var present = !ab[i];
      box.appendChild(el('button', { type: 'button', class: 'chip att', 'aria-pressed': present ? 'true' : 'false', dataset: { i: String(i) } },
        el('span', { class: 'ic', 'aria-hidden': 'true', text: present ? '✓' : '✕' }),
        el('span', { class: 'no-i18n', text: nm })));
    });
    $('#allPresent').disabled = !c.absent.length;
  }
  function renderList() {
    var c = cls(), names = namesOf(c);
    var cn = $('#className');
    if (document.activeElement !== cn) cn.value = c.name || (c.sample ? t('sample_class') : '');
    if (!listDirty) $('#namesInput').value = names.join('\n');
    $('#listStatus').textContent = listDirty ? t('unsaved') : t('class_info', { n: fmt(names.length) });
    $('#sampleBtn').disabled = c.sample;
    renderAttendance();
  }

  function renderAll() {
    renderClassBar();
    renderPick();
    renderGroupSettings();
    renderGroups();
    renderList();
  }

  /* ---------------- events ---------------- */
  // tabs (click + arrow keys)
  $$('#tabs [role="tab"]').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });
  $('#tabs').addEventListener('keydown', function (e) {
    var order = ['pick', 'groups', 'list'], i = order.indexOf(settings.tab), rtl = document.documentElement.dir === 'rtl';
    var step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, Home: -9, End: 9 }[e.key];
    if (!step) return;
    e.preventDefault();
    i = step === -9 ? 0 : step === 9 ? 2 : (i + step + 3) % 3;
    showTab(order[i], true);
  });

  $('#classSel').addEventListener('change', function () {
    maybeAutosave();
    data.current = this.value; token++; lastPick = []; listDirty = false;
    save(); refreshWheel(); renderAll();
  });

  // picker
  $('#spinBtn').addEventListener('click', doPick);
  $('#hubBtn').addEventListener('click', doPick);
  canvas.addEventListener('click', doPick);
  $('#cardsWrap').addEventListener('click', doPick);
  document.addEventListener('keydown', function (e) {
    if (e.key !== ' ' || settings.tab !== 'pick' || e.ctrlKey || e.altKey || e.metaKey) return;
    var tg = e.target, tag = (tg && tg.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A|SUMMARY)$/.test(tag) || (tg && tg.isContentEditable)) return;
    if (document.querySelector('.edu-modal-back')) return;
    e.preventDefault();
    doPick();
  });
  $$('#modeSeg button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (busy) return;
      settings.mode = b.dataset.mode; saveSettings();
      renderPick();
    });
  });
  function onPickN() {
    settings.pickN = clampInt($('#pickN').value, 1, MAX_PICK, 1); saveSettings();
    if (settings.mode === 'cards' && !lastPick.length) renderCardsIdle();
  }
  $('#pickN').addEventListener('input', onPickN);
  $('#pickN').addEventListener('change', function () { onPickN(); $('#pickN').value = settings.pickN; });
  $('#noRepeat').addEventListener('change', function () {
    settings.noRepeat = this.checked; saveSettings();
    refreshWheel(); renderRemaining();
    if (settings.mode === 'cards' && !lastPick.length) renderCardsIdle();
  });
  $('#restoreBtn').addEventListener('click', function () {
    var c = cls(); c.picked = []; save();
    refreshWheel(); renderRemaining(); renderHistory();
    if (settings.mode === 'cards' && !lastPick.length) renderCardsIdle();
  });
  $('#soundBtn').addEventListener('click', function () {
    settings.sound = !settings.sound; saveSettings();
    renderPick();
    if (settings.sound) tick();
  });
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen($('#pickCard')); });

  // steppers (−/+ buttons next to number inputs)
  $$('.stepper [data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      var inp = document.getElementById(b.dataset.for);
      var lo = +inp.min || 0, hi = +inp.max || 999;
      inp.value = clampInt((+inp.value || 0) + (+b.dataset.step), lo, hi, lo);
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  // groups
  $$('#groupBySeg button').forEach(function (b) {
    b.addEventListener('click', function () { settings.groupBy = b.dataset.by; saveSettings(); renderGroupSettings(); });
  });
  function onGroupVal() {
    var v = clampInt($('#groupVal').value, 2, MAX_GROUP_VAL, 4);
    if (settings.groupBy === 'count') settings.groupCount = v; else settings.groupSize = v;
    saveSettings();
  }
  $('#groupVal').addEventListener('input', onGroupVal);
  $('#groupVal').addEventListener('change', function () { onGroupVal(); $('#groupVal').value = settings.groupBy === 'count' ? settings.groupCount : settings.groupSize; });
  $('#groupTheme').addEventListener('change', function () { settings.theme = this.value; saveSettings(); renderGroups(); });
  $('#makeGroups').addEventListener('click', makeGroups);
  $('#reshuffleBtn').addEventListener('click', makeGroups);
  $('#copyGroups').addEventListener('click', function () { if (cls().groups) EDU.copy(groupsText()); });
  $('#printGroups').addEventListener('click', function () { window.print(); });
  $('#csvGroups').addEventListener('click', function () {
    var c = cls(); if (!c.groups) return;
    var names = namesOf(c), rows = [[t('csv_group'), t('csv_name')]];
    c.groups.forEach(function (g, i) { g.forEach(function (ix) { rows.push([groupName(i), names[ix]]); }); });
    EDU.download('groups.csv', EDU.csv.stringify(rows), 'text/csv');
  });
  $('#fsGroups').addEventListener('click', function () { EDU.fullscreen($('#groupsOut')); });
  $('#addPair').addEventListener('click', function () {
    var c = cls(), a = parseInt($('#apartA').value, 10), b = parseInt($('#apartB').value, 10);
    if (isNaN(a) || isNaN(b)) return;
    if (a === b) { EDU.toast(t('same_pair')); return; }
    var p = [Math.min(a, b), Math.max(a, b)];
    if (c.apart.some(function (q) { return q[0] === p[0] && q[1] === p[1]; })) { EDU.toast(t('pair_exists')); return; }
    c.apart.push(p); save(); renderPairs();
  });

  // class list
  $('#newClass').addEventListener('click', function () {
    maybeAutosave();
    var c = blankClass(false, t('new_class_name', { n: fmt(data.classes.length + 1) }), []);
    data.classes.push(c); data.current = c.id;
    afterListChange();
    showTab('list');
    $('#namesInput').focus();
  });
  $('#delClass').addEventListener('click', function () {
    var c = cls();
    if (!confirm(t('confirm_delete_class', { name: className(c) }))) return;
    data.classes = data.classes.filter(function (x) { return x !== c; });
    if (!data.classes.length) data.classes.push(blankClass(true));
    data.current = data.classes[0].id;
    afterListChange();
  });
  $('#className').addEventListener('input', function () {
    var c = cls(), v = this.value.trim().slice(0, 40);
    c.name = (c.sample && v === t('sample_class')) ? '' : v;
    save(); renderClassBar();
  });
  $('#className').addEventListener('change', function () { renderList(); });
  $('#namesInput').addEventListener('input', function () { listDirty = true; $('#listStatus').textContent = t('unsaved'); });
  $('#namesInput').addEventListener('change', function () { maybeAutosave(); });
  $('#saveList').addEventListener('click', function () { saveList(false); });
  $('#importBtn').addEventListener('click', importCsv);
  $('#sampleBtn').addEventListener('click', function () {
    var c = cls();
    if (c.sample) return;
    if (c.names.length && !confirm(t('confirm_sample'))) return;
    c.sample = true; c.names = []; c.picked = []; c.absent = []; c.apart = []; c.groups = null; c.groupsOk = true;
    afterListChange();
  });
  $('#rollFill').addEventListener('click', function () {
    var n = clampInt($('#rollN').value, 1, MAX_NAMES, 40), c = cls();
    if (!c.sample && c.names.length && !confirm(t('confirm_replace'))) return;
    setNames(c, range(n).map(function (i) { return String(i + 1); }));
    afterListChange();
    EDU.toast(t('list_saved', { n: fmt(n) }));
  });
  $('#attendance').addEventListener('click', function (e) {
    var b = e.target.closest('.att'); if (!b) return;
    var c = cls(), i = parseInt(b.dataset.i, 10), at = c.absent.indexOf(i);
    if (at >= 0) c.absent.splice(at, 1); else c.absent.push(i);
    c.absentDay = today();
    save();
    refreshWheel(); renderClassBar(); renderAttendance(); renderRemaining();
    if (settings.mode === 'cards' && !lastPick.length) renderCardsIdle();
  });
  $('#allPresent').addEventListener('click', function () {
    var c = cls(); c.absent = []; save();
    refreshWheel(); renderClassBar(); renderAttendance(); renderRemaining();
  });

  // keep the canvas sharp and sized
  if (window.ResizeObserver) new ResizeObserver(function () { requestAnimationFrame(sizeCanvas); }).observe($('#wheelWrap'));
  else window.addEventListener('resize', sizeCanvas);
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', function () { fontFam = null; labelCache = {}; drawWheel(); });
  }
  EDU.onTheme(function () { pal = null; drawWheel(); });
  EDU.onLang(function () { fontFam = null; labelCache = {}; renderAll(); });
  window.addEventListener('beforeunload', maybeAutosave);

  /* ---------------- start ---------------- */
  wheel.items = pool(cls());
  renderAll();
  showTab(settings.tab);
})();
