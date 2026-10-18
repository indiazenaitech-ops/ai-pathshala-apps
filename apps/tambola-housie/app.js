/* Tambola Tickets & Caller (Housie): valid 90-ball tickets from a short game code (print 6 or 12 per A4 page),
   a number caller with voice, a 1-90 board and a projector mode, a claim checker, prizes + a printable rules
   sheet, and a "play on phone" ticket. Everything stays on this device: EDU.store('tambola-housie'). */
(function () {
  'use strict';
  var SLUG = 'tambola-housie';
  var T = window.TAMBOLA;
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, el = EDU.el, esc = EDU.esc;
  var store = EDU.store(SLUG);
  var MAX_COUNT = 600, MAX_PLAY = 6, MAX_WIN = 100;
  var EVERY = [3, 4, 5, 6, 8, 10, 12, 15, 20, 30];
  var COUNT_CHIPS = [6, 12, 24, 36, 60, 120];
  var TABS = ['tickets', 'caller', 'check', 'prizes', 'play'];
  var PAT = T.PATTERNS;
  var DEF_ON = { early5: true, top: true, middle: true, bottom: true, corners: true, full: true, full2: false, full3: false };
  var LANG_CODES = EDU.LANGS.map(function (l) { return l.code; });

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- small helpers ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function int(v, lo, hi, d) { v = parseInt(v, 10); if (isNaN(v)) v = d; return Math.max(lo, Math.min(hi, v)); }
  function str(v, max) { return typeof v === 'string' ? v.slice(0, max) : ''; }
  function isObj(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function list(a) { return a.join(', '); }
  function setVal(sel, v) { var e = $(sel); if (e && document.activeElement !== e && e.value !== String(v)) e.value = v; }

  /* EDU.toast() draws on <body>, which is hidden while the caller is full screen: keep the toasts inside it. */
  function placeToasts() {
    var w = $('.edu-toast-wrap'), host = document.fullscreenElement || document.webkitFullscreenElement || document.body;
    if (w && w.parentNode !== host) host.appendChild(w);
  }
  function toast(msg) { EDU.toast(msg); placeToasts(); }

  /* ---------------- saved state (cleaned, so a broken store never breaks the app) ---------------- */
  var DEF = { count: 24, strips: true, start: 1, pp: 6, every: 8, voice: true, vlang: 'ui', digits: true, slow: false, manual: false, tab: 'tickets' };
  function cleanCfg(s) {
    s = isObj(s) ? s : {};
    var o = {
      party: typeof s.party === 'string' ? s.party.slice(0, 80) : null,           // null = default party name (follows the language)
      date: typeof s.date === 'string' && (s.date === '' || /^\d{4}-\d{2}-\d{2}$/.test(s.date)) ? s.date : null,   // null = today
      count: int(s.count, 1, MAX_COUNT, DEF.count),
      strips: typeof s.strips === 'boolean' ? s.strips : DEF.strips,
      start: int(s.start, 1, T.MAX_TICKET, DEF.start),
      pp: s.pp === 12 ? 12 : 6,
      every: EVERY.indexOf(s.every) >= 0 ? s.every : DEF.every,
      vlang: s.vlang === 'ui' || LANG_CODES.indexOf(s.vlang) >= 0 ? s.vlang : 'ui',
      tab: TABS.indexOf(s.tab) >= 0 ? s.tab : DEF.tab
    };
    ['voice', 'digits', 'slow', 'manual'].forEach(function (k) { o[k] = typeof s[k] === 'boolean' ? s[k] : DEF[k]; });
    return o;
  }
  function cleanGame(g) {
    g = isObj(g) ? g : {};
    var o = { code: T.codeOk(g.code) ? T.normCode(g.code) : T.randomCode(), called: [], winners: [] }, seen = {};
    (Array.isArray(g.called) ? g.called : []).forEach(function (n) {
      if (typeof n === 'number' && n >= 1 && n <= 90 && n % 1 === 0 && !seen[n]) { seen[n] = 1; o.called.push(n); }
    });
    (Array.isArray(g.winners) ? g.winners : []).forEach(function (w) {
      if (isObj(w) && PAT.indexOf(w.p) >= 0 && o.winners.length < MAX_WIN) {
        o.winners.push({ p: w.p, no: int(w.no, 0, T.MAX_TICKET, 0), code: T.codeOk(w.code) ? T.normCode(w.code) : '', at: int(w.at, 0, 90, 0) });
      }
    });
    return o;
  }
  function cleanPrizes(a) {
    var by = {};
    (Array.isArray(a) ? a : []).forEach(function (z) { if (isObj(z) && PAT.indexOf(z.p) >= 0) by[z.p] = z; });
    return PAT.map(function (p) {
      var z = by[p] || {};
      return { p: p, on: typeof z.on === 'boolean' ? z.on : DEF_ON[p], name: str(z.name, 40), prize: str(z.prize, 40) };
    });
  }
  function cleanPlay(p) {
    p = isObj(p) ? p : {};
    var o = { code: T.codeOk(p.code) ? T.normCode(p.code) : '', tickets: [] };
    (Array.isArray(p.tickets) ? p.tickets : []).forEach(function (x) {
      if (!isObj(x) || !T.codeOk(x.code) || o.tickets.length >= MAX_PLAY) return;
      var no = int(x.no, 0, T.MAX_TICKET, 0), code = T.normCode(x.code);
      if (!no) return;
      var have = T.numbersOf(T.ticket(code, no)), marks = [];
      (Array.isArray(x.marks) ? x.marks : []).forEach(function (n) { if (have.indexOf(n) >= 0 && marks.indexOf(n) < 0) marks.push(n); });
      o.tickets.push({ code: code, no: no, marks: marks });
    });
    return o;
  }
  function cleanChk(c) {
    c = isObj(c) ? c : {};
    return { src: c.src === 'typed' ? 'typed' : 'game', typed: str(c.typed, 400), claim: PAT.indexOf(c.claim) >= 0 ? c.claim : 'full',
      code: T.codeOk(c.code) ? T.normCode(c.code) : '', no: int(c.no, 1, T.MAX_TICKET, 1) };
  }

  var cfg, game, prizes, notes, play, chk;
  function load() {
    cfg = cleanCfg(store.get('settings', null));
    game = cleanGame(store.get('game', null));
    prizes = cleanPrizes(store.get('prizes', null));
    notes = str(store.get('notes', ''), 1000);
    play = cleanPlay(store.get('play', null));
    chk = cleanChk(store.get('check', null));
    if (!store.get('game', null)) saveGame();      // the first random code stays the same after a reload
  }
  function saveCfg() { store.set('settings', cfg); }
  function saveGame() { store.set('game', game); }
  function savePrizes() { store.set('prizes', prizes); }
  function savePlay() { store.set('play', play); }
  function saveChk() { store.set('check', chk); }
  load();

  /* ---------------- derived values ---------------- */
  /* the tickets to print: numbers start..end; full sheets = whole strips of 6 (every number 1-90 once per sheet) */
  function rng() {
    var count = int(cfg.count, 1, MAX_COUNT, DEF.count), start = int(cfg.start, 1, T.MAX_TICKET, 1);
    if (cfg.strips) { count = Math.ceil(count / 6) * 6; start = Math.floor((start - 1) / 6) * 6 + 1; }
    if (start + count - 1 > T.MAX_TICKET) start = Math.max(1, T.MAX_TICKET - count + 1);
    return { start: start, count: count, end: start + count - 1 };
  }
  function perPage() { return cfg.pp === 12 ? 12 : 6; }
  function partyName() { return cfg.party === null ? t('def_party') : cfg.party.trim(); }
  function dateISO() { return cfg.date === null ? todayISO() : cfg.date; }
  function dateText() {
    var s = dateISO(), p = s.split('-');
    if (p.length !== 3) return '';
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    if (isNaN(d.getTime())) return '';
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag + '-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' }).format(d); }
    catch (e) { return s; }
  }
  function prizeOf(p) { for (var i = 0; i < prizes.length; i++) if (prizes[i].p === p) return prizes[i]; return prizes[0]; }
  function prizeName(p) { var z = prizeOf(p); return z.name.trim() || t('pz_' + p); }
  function enabledPrizes() { return prizes.filter(function (z) { return z.on; }); }
  function claimList() { var a = enabledPrizes(); return (a.length ? a : prizes).map(function (z) { return z.p; }); }
  function prizeLine() {
    return enabledPrizes().map(function (z) { return prizeName(z.p) + (z.prize.trim() ? ' ' + z.prize.trim() : ''); }).join(' · ');
  }
  function wonBy(p) { return game.winners.filter(function (w) { return w.p === p; }); }
  function calledSet() { var s = {}; game.called.forEach(function (n) { s[n] = 1; }); return s; }

  /* one ticket as HTML. o = { left, right, play: marks-object for tap-to-mark, cls: fn(n) -> extra classes } */
  function ticketHTML(tk, o) {
    var h = '<div class="tk' + (o.play ? ' play' : '') + '">';
    if (o.left !== undefined) h += '<div class="tk-head"><span class="tk-party no-i18n">' + esc(o.left) + '</span><span class="tk-no">' + esc(o.right || '') + '</span></div>';
    h += '<div class="tk-grid" dir="ltr">';
    for (var r = 0; r < T.ROWS; r++) {
      for (var c = 0; c < T.COLS; c++) {
        var n = tk.rows[r][c];
        if (!n) { h += '<span class="tk-c e"></span>'; continue; }
        if (o.play) {
          var on = !!o.play[n];
          h += '<button type="button" class="tk-c' + (on ? ' mark' : '') + '" data-n="' + n + '" aria-pressed="' + on + '"><span>' + n + '</span></button>';
        } else {
          h += '<span class="tk-c' + (o.cls ? o.cls(n) : '') + '" data-n="' + n + '"><span>' + n + '</span></span>';
        }
      }
    }
    return h + '</div></div>';
  }
  function tkLabel(no, code) { return t('tk_no', { no: no }) + ' · ' + code; }

  /* =====================================================================
     TICKETS
     ===================================================================== */
  var pgIdx = 0, sendNo = 0;

  function renderTicketForm() {
    setVal('#party', cfg.party === null ? t('def_party') : cfg.party);
    setVal('#pdate', dateISO());
    setVal('#code', game.code);
    var r = rng();
    if (document.activeElement !== $('#count')) $('#count').value = r.count;
    if (document.activeElement !== $('#start')) $('#start').value = r.start;
    $('#strips').checked = cfg.strips;
    $$('#perPage button').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.pp === perPage() ? 'true' : 'false'); });
    var chips = $('#countChips');
    if (!chips.children.length) {
      COUNT_CHIPS.forEach(function (n) { chips.appendChild(el('button', { type: 'button', class: 'chip', dataset: { n: n }, text: String(n) })); });
    }
    $$('.chip', chips).forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.n === r.count ? 'true' : 'false'); });
  }

  function renderTickets() {
    var r = rng(), per = perPage(), pages = Math.ceil(r.count / per), party = partyName();
    pgIdx = Math.max(0, Math.min(pgIdx, pages - 1));
    var sum = [t('sum_tickets', { n: r.count }), t('sum_range', { a: r.start, b: r.end }), t('sum_pages', { n: pages })];
    if (cfg.strips) sum.push(t('sum_strips', { n: r.count / 6 }));
    $('#tkSummary').innerHTML = sum.map(function (s, i) { return '<span class="badge' + (i ? '' : ' primary') + '">' + esc(s) + '</span>'; }).join('') +
      '<span class="badge accent">' + esc(t('sheet_code', { code: game.code })) + '</span>';
    var h = '';
    for (var i = 0; i < per; i++) {
      var no = r.start + pgIdx * per + i;
      if (no > r.end) break;
      h += ticketHTML(T.ticket(game.code, no), { left: party, right: tkLabel(no, game.code) });
    }
    $('#tkList').innerHTML = h;
    $('#pgLbl').textContent = t('page_no', { n: pgIdx + 1, total: pages });
    $('#pgPrev').disabled = pgIdx <= 0;
    $('#pgNext').disabled = pgIdx >= pages - 1;
    if (!(sendNo >= r.start && sendNo <= r.end)) sendNo = r.start;
    updateSend();
  }

  function playUrl(code, no) { return EDU.shareUrl() + '#play=' + code + '-' + no; }
  function updateSend() {
    setVal('#sendNo', sendNo);
    var url = playUrl(game.code, sendNo);
    $('#sendWa').href = EDU.waLink(t('wa_ticket', { party: partyName() || t('app_title'), no: sendNo, code: game.code, url: url }));
  }

  function applyCode(v) {
    var c = T.normCode(v);
    if (!T.codeOk(c)) { $('#codeErr').hidden = false; return false; }
    $('#codeErr').hidden = true;
    if (c === game.code) { $('#code').value = c; return true; }
    if (game.called.length && !confirm(t('code_change_confirm'))) { $('#code').value = game.code; return false; }
    game.code = c;
    saveGame();
    $('#code').value = c;
    pgIdx = 0;
    renderTickets(); renderCaller(false); renderCheckForm(); renderRules();
    return true;
  }

  /* ---------------- printing (6 or 12 tickets per A4 page, or the rules sheet) ---------------- */
  function sheetHead(pg, pages) {
    var meta = [dateText(), t('sheet_code', { code: game.code }), t('page_no', { n: pg, total: pages })].filter(Boolean).join(' · ');
    var pl = prizeLine();
    return '<header class="sh-head"><div class="sh-top"><div class="sh-party no-i18n">' + esc(partyName() || t('app_title')) + '</div><div class="sh-meta">' + esc(meta) + '</div></div>' +
      (pl ? '<div class="sh-prizes">' + esc(t('h_prizes')) + ': ' + esc(pl) + '</div>' : '') + '</header>';
  }
  function printTicketHTML(tk, party) {
    var h = '<div class="pt"><div class="pt-head"><span class="pt-party">' + esc(party) + '</span><span class="pt-no">' + esc(tkLabel(tk.no, tk.code)) + '</span></div><div class="pt-grid" dir="ltr">';
    for (var r = 0; r < T.ROWS; r++) for (var c = 0; c < T.COLS; c++) {
      var n = tk.rows[r][c];
      h += n ? '<div class="pt-c">' + n + '</div>' : '<div class="pt-c e"></div>';
    }
    return h + '</div></div>';
  }
  function buildTicketPrint() {
    var r = rng(), per = perPage(), pages = Math.ceil(r.count / per), party = partyName(), h = '';
    for (var pg = 0; pg < pages; pg++) {
      h += '<section class="sheet sheet-' + per + '">' + sheetHead(pg + 1, pages) + '<div class="p-grid">';
      for (var i = 0; i < per; i++) {
        var no = r.start + pg * per + i;
        h += no > r.end ? '<div class="p-slot empty"></div>' : '<div class="p-slot">' + printTicketHTML(T.ticket(game.code, no), party) + '</div>';
      }
      h += '</div></section>';
    }
    $('#print-root').innerHTML = h;
  }
  function buildRulesPrint() { $('#print-root').innerHTML = '<section class="sheet rules-sheet">' + rulesHTML() + '</section>'; }
  var printBy = 0;
  function doPrint(kind) {
    if (kind === 'rules') buildRulesPrint(); else buildTicketPrint();
    document.body.classList.add('tb-printing');
    printBy = Date.now();
    try { window.print(); } catch (e) { }
  }
  /* Ctrl+P / browser menu: print what the open tab is about. Some phones fire beforeprint late, so a Print
     button press is respected for 15 s. */
  window.addEventListener('beforeprint', function () {
    if (Date.now() - printBy < 15000) return;
    if (cfg.tab === 'tickets') { buildTicketPrint(); document.body.classList.add('tb-printing'); }
    else if (cfg.tab === 'prizes') { buildRulesPrint(); document.body.classList.add('tb-printing'); }
    else document.body.classList.remove('tb-printing');
  });

  function downloadCsv() {
    var r = rng(), rows = [[t('csv_ticket'), t('csv_code'), t('csv_row')].concat(T.RANGE.map(function (x) { return x[0] + '-' + x[1]; }))];
    for (var no = r.start; no <= r.end; no++) {
      var tk = T.ticket(game.code, no);
      for (var i = 0; i < T.ROWS; i++) rows.push([no, game.code, i + 1].concat(tk.rows[i].map(function (n) { return n || ''; })));
    }
    EDU.download('tambola-tickets-' + game.code + '-' + r.start + '-' + r.end + '.csv', EDU.csv.stringify(rows), 'text/csv');
  }

  /* =====================================================================
     NUMBER CALLER
     ===================================================================== */
  var autoOn = false, autoTimer = null, autoDue = 0, autoRAF = 0, wake = null;

  function voiceLang() { return cfg.vlang === 'ui' ? EDU.lang : cfg.vlang; }
  /* a string from another language's table (the voice can speak a language other than the screen's) */
  function tl(L, key, vars) {
    var S = window.APP_STRINGS || {}, v = (S[L] && S[L][key]) || (S.en && S.en[key]) || key;
    return vars ? String(v).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; }) : v;
  }
  function phrase(n, L) {
    if (cfg.digits && n >= 10) return tl(L, 'say_ab', { a: Math.floor(n / 10), b: n % 10, n: n });
    return tl(L, 'say_n', { n: n });
  }
  var voiceWarned = {};
  function sayNumber(n, force) {
    if (!n || (!cfg.voice && !force)) return;
    var L = voiceLang();
    EDU.speak(phrase(n, L), { lang: L, rate: cfg.slow ? 0.7 : 0.95 }).then(function (ok) {
      if (ok) return;
      if (!voiceWarned[L]) { voiceWarned[L] = 1; toast(t('no_voice')); }
      showVoiceNote(false);
    });
  }
  function showVoiceNote(ok) {
    var note = $('#voiceNote');
    note.hidden = ok || !cfg.voice;
    note.textContent = ok ? '' : t('no_voice');
  }
  function checkVoice() {
    if (!cfg.voice) { showVoiceNote(true); return; }
    if (!('speechSynthesis' in window)) { showVoiceNote(false); return; }
    var L = voiceLang();
    EDU.getVoices().then(function (vs) {
      if (voiceLang() !== L) return;
      showVoiceNote(!!EDU.voiceFor(vs, L) || (L === 'en' && vs.length > 0));
    });
  }

  function remaining() {
    var s = calledSet(), r = [];
    for (var n = 1; n <= 90; n++) if (!s[n]) r.push(n);
    return r;
  }
  function callNumber(n) {
    if (game.called.indexOf(n) >= 0 || game.called.length >= 90) return;
    game.called.push(n);
    saveGame();
    renderCaller(true);
    sayNumber(n);
    if (game.called.length >= 90) { stopAuto(); toast(t('all_called')); }
  }
  function drawNext() {
    var left = remaining();
    if (!left.length) { stopAuto(); toast(t('all_called')); return false; }
    callNumber(left[T.randBelow(left.length)]);
    return true;
  }
  function manualNext() {
    if (cfg.manual) return;
    drawNext();
    if (autoOn) schedule();
  }

  function schedule() {
    clearTimeout(autoTimer);
    var ms = cfg.every * 1000;
    autoDue = Date.now() + ms;
    autoTimer = setTimeout(function () {
      if (!autoOn) return;
      if (drawNext() && autoOn) schedule(); else stopAuto();
    }, ms);
    tick();
  }
  function tick() {
    cancelAnimationFrame(autoRAF);
    if (!autoOn) return;
    var ms = cfg.every * 1000, left = Math.max(0, autoDue - Date.now());
    $('#autoFill').style.width = (100 - (left / ms) * 100).toFixed(1) + '%';
    autoRAF = requestAnimationFrame(tick);
  }
  function startAuto() {
    if (cfg.manual || game.called.length >= 90) return;
    autoOn = true;
    renderAutoBtn();
    drawNext();
    if (autoOn) schedule();
    updateWake();
  }
  function stopAuto() {
    var was = autoOn;
    autoOn = false;
    clearTimeout(autoTimer);
    cancelAnimationFrame(autoRAF);
    if (was) { renderAutoBtn(); updateWake(); }
  }
  function toggleAuto() { if (autoOn) stopAuto(); else startAuto(); }
  function renderAutoBtn() {
    var b = $('#autoBtn');
    b.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    $('#autoIc').textContent = autoOn ? '⏸' : '▶';
    $('#autoLbl').textContent = autoOn ? t('pause') : t('btn_auto');
    $('#autoBar').hidden = !autoOn;
    if (!autoOn) $('#autoFill').style.width = '0';
  }

  function takeBack(n) {
    var i = game.called.indexOf(n);
    if (i < 0) return;
    if (!confirm(t('undo_confirm', { n: n }))) return;
    stopAuto();
    game.called.splice(i, 1);
    saveGame();
    renderCaller(false);
    toast(t('undone', { n: n }));
  }
  function undo() { if (game.called.length) takeBack(game.called[game.called.length - 1]); }
  function repeat() { var k = game.called.length; if (k) sayNumber(game.called[k - 1], true); }
  function newGame() {
    if (!confirm(t('new_game_confirm'))) return;
    stopAuto();
    EDU.stopSpeaking();
    game.called = [];
    game.winners = [];
    saveGame();
    renderCaller(false); renderWinners(); renderClaimSelect();
    lastCheck = null; showCheckIntro();
  }
  function goCheck() {
    stopAuto();
    selectTab('check');
    var f = chk.src === 'typed' ? $('#typed') : $('#chkNo');
    f.focus();
    if (f.select) f.select();
  }

  /* projector mode: real full screen where the browser allows it, otherwise a fixed overlay */
  function isPresenting() { return $('#callerCard').classList.contains('presenting'); }
  function setPresenting(on) {
    $('#callerCard').classList.toggle('presenting', on);
    $('#fsBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('#fsLbl').textContent = on ? t('exit_fs') : t('fullscreen');
    placeToasts();
    updateWake();
  }
  function toggleFs() {
    var card = $('#callerCard'), d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) { EDU.fullscreen(); return; }
    if (isPresenting()) { setPresenting(false); return; }
    setPresenting(true);
    if (card.requestFullscreen || card.webkitRequestFullscreen) EDU.fullscreen(card);
  }
  function onFsChange() {
    var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    setPresenting(fsEl === $('#callerCard'));
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  /* keep the screen on during a game (Screen Wake Lock, where the browser has it) */
  function updateWake() {
    var want = (autoOn || isPresenting()) && document.visibilityState === 'visible';
    try {
      if (want && !wake && navigator.wakeLock && navigator.wakeLock.request) {
        wake = 'pending';
        navigator.wakeLock.request('screen').then(function (w) {
          wake = w;
          w.addEventListener('release', function () { if (wake === w) wake = null; });
          if (!(autoOn || isPresenting())) { w.release(); wake = null; }
        }).catch(function () { wake = null; });
      } else if (!want && wake && wake !== 'pending') { wake.release(); wake = null; }
    } catch (e) { wake = null; }
  }
  document.addEventListener('visibilitychange', updateWake);

  function renderBoard() {
    var b = $('#board'), mode = cfg.manual ? 'm' : 'v';
    if (b.getAttribute('data-mode') !== mode) {
      var h = '';
      for (var n = 1; n <= 90; n++) {
        h += mode === 'm' ? '<button type="button" class="bc" data-n="' + n + '" aria-pressed="false">' + n + '</button>' : '<span class="bc" data-n="' + n + '">' + n + '</span>';
      }
      b.innerHTML = h;
      b.setAttribute('data-mode', mode);
    }
    var on = calledSet(), cur = game.called[game.called.length - 1];
    $$('.bc', b).forEach(function (c) {
      var n = +c.getAttribute('data-n');
      c.classList.toggle('on', !!on[n]);
      c.classList.toggle('cur', n === cur);
      if (mode === 'm') c.setAttribute('aria-pressed', on[n] ? 'true' : 'false');
    });
  }
  function renderWonMini() {
    var box = $('#wonMini');
    box.innerHTML = '';
    game.winners.forEach(function (w) {
      box.appendChild(el('span', { class: 'badge success', text: '🏆 ' + prizeName(w.p) + ': ' + (w.no ? t('tk_no', { no: w.no }) : t('typed_ticket')) }));
    });
  }
  function renderCaller(pop) {
    var called = game.called, k = called.length, cur = called[k - 1];
    $('#clTitle').textContent = partyName() || t('app_title');
    $('#clCode').textContent = t('sheet_code', { code: game.code });
    var ball = $('#ball');
    ball.classList.toggle('idle', !k);
    $('#ballNum').textContent = k ? String(cur) : '?';
    if (pop && k) { ball.classList.remove('pop'); void ball.offsetWidth; ball.classList.add('pop'); }
    $('#callInfo').textContent = k >= 90 ? t('all_called') : k ? t('call_no', { k: k }) : (cfg.manual ? t('manual_start') : t('press_next'));
    var prev = called.slice(Math.max(0, k - 6), Math.max(0, k - 1)).reverse();
    $('#lastWrap').hidden = !prev.length;
    $('#last5').innerHTML = prev.map(function (n) { return '<span class="coin">' + n + '</span>'; }).join('');
    $('#calledN').textContent = t('called_n', { n: k });
    $('#leftN').textContent = t('left_n', { n: 90 - k });
    $('#callBar').style.width = (k / 90 * 100).toFixed(1) + '%';
    $('#nextBtn').disabled = k >= 90;
    $('#nextBtn').hidden = cfg.manual;
    $('#autoBtn').hidden = cfg.manual;
    $('#autoBtn').disabled = k >= 90;
    $('#undoBtn').disabled = !k;
    $('#repeatBtn').disabled = !k;
    $('#manualHint').hidden = !cfg.manual;
    $('#orderList').textContent = k ? list(called) : t('order_none');
    renderBoard();
    renderAutoBtn();
    renderWonMini();
  }
  function renderCallerSettings() {
    var ev = $('#every'), vl = $('#vlang');
    ev.innerHTML = '';
    EVERY.forEach(function (s) { ev.appendChild(el('option', { value: s, text: t('every_s', { n: s }) })); });
    ev.value = String(cfg.every);
    vl.innerHTML = '';
    vl.appendChild(el('option', { value: 'ui', text: t('vlang_ui', { lang: EDU.langInfo(EDU.lang).native }) }));
    EDU.LANGS.forEach(function (l) { vl.appendChild(el('option', { value: l.code, text: l.native })); });
    vl.value = cfg.vlang;
    $('#voice').checked = cfg.voice;
    $('#digits').checked = cfg.digits;
    $('#slow').checked = cfg.slow;
    $('#manual').checked = cfg.manual;
    $('#fsLbl').textContent = isPresenting() ? t('exit_fs') : t('fullscreen');
    checkVoice();
  }

  /* =====================================================================
     CHECK A CLAIM
     ===================================================================== */
  var lastCheck = null;     // 'check' | 'find' — re-run after a language switch or new calls

  function renderClaimSelect() {
    var sel = $('#claim'), opts = claimList();
    if (opts.indexOf(chk.claim) < 0) chk.claim = opts.indexOf('full') >= 0 ? 'full' : opts[0];
    sel.innerHTML = '';
    opts.forEach(function (p) { sel.appendChild(el('option', { value: p, text: prizeName(p) + (wonBy(p).length ? ' ✓' : '') })); });
    sel.value = chk.claim;
    $('#claimDesc').textContent = t('pd_' + chk.claim);
  }
  function renderCheckForm() {
    $$('#srcSeg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.src === chk.src ? 'true' : 'false'); });
    $('#srcGame').hidden = chk.src !== 'game';
    $('#srcTyped').hidden = chk.src !== 'typed';
    $('#findBtn').hidden = chk.src !== 'game';
    setVal('#chkCode', chk.code || game.code);
    setVal('#chkNo', chk.no);
    setVal('#typed', chk.typed);
    renderClaimSelect();
  }
  function showCheckIntro() {
    var out = $('#checkOut');
    out.innerHTML = '';
    out.appendChild(el('p', { class: 'muted mb0', text: game.called.length ? t('check_intro') : t('no_calls') + ' ' + t('check_intro') }));
  }
  function showError(msg) {
    var out = $('#checkOut');
    out.innerHTML = '';
    out.appendChild(el('p', { class: 'callout danger mb0', text: msg }));
  }

  function parseTyped(text) {
    var lines = String(text || '').split(/\r?\n/).map(T.parseNums).filter(function (a) { return a.length; });
    var all = [].concat.apply([], lines);
    if (!all.length) return { error: t('err_typed_empty') };
    var rows;
    if (lines.length === 3) rows = lines;
    else if (all.length === 15) rows = [all.slice(0, 5), all.slice(5, 10), all.slice(10)];
    else return { error: t('err_typed_count') };
    if (rows.some(function (r) { return r.length > 9; })) return { error: t('err_typed_count') };
    var r = T.fromRows(rows);
    if (r.error === 'range') return { error: t('err_typed_range', { list: list(r.list) }) };
    if (r.error === 'dup') return { error: t('err_typed_dup', { list: list(r.list) }) };
    if (r.error === 'col') return { error: t('err_typed_col', { a: r.list[0], b: r.list[1] }) };
    if (r.error) return { error: t('err_typed_count') };
    return { tk: r.tk };
  }
  function ticketForCheck() {
    if (chk.src === 'typed') return parseTyped($('#typed').value);
    var code = T.normCode($('#chkCode').value), no = parseInt($('#chkNo').value, 10);
    if (!T.codeOk(code)) return { error: t('err_code') };
    if (!(no >= 1 && no <= T.MAX_TICKET)) return { error: t('err_no', { max: T.MAX_TICKET }) };
    return { tk: T.ticket(code, no) };
  }

  function showCheck() {
    lastCheck = 'check';
    var r = ticketForCheck();
    if (r.error) { showError(r.error); return; }
    var tk = r.tk, p = chk.claim, res = T.check(tk, p, game.called), name = prizeName(p), on = calledSet();
    var need = {}, miss = {};
    if (!res.any) { res.need.forEach(function (n) { need[n] = 1; }); res.missing.forEach(function (n) { miss[n] = 1; }); }
    var all = T.numbersOf(tk), hits = all.filter(function (n) { return on[n]; });
    var verdict = res.ok ? (tk.typed ? t('v_ok_typed', { prize: name }) : t('v_ok', { prize: name, no: tk.no }))
      : (res.any ? t('v_no5', { have: res.have }) : t('v_no', { n: res.left }));
    var facts = [];
    if (!game.called.length) facts.push(t('no_calls'));
    facts.push(t('have_n', { n: hits.length, total: all.length }));
    if (!res.ok && !res.any && res.missing.length) facts.push(t('missing', { list: list(res.missing) }));
    if (res.ok && res.completedAt >= 0) {
      facts.push(t('done_at', { k: res.completedAt + 1, n: game.called[res.completedAt] }));
      var since = game.called.length - 1 - res.completedAt;
      if (since > 0) facts.push(t('since', { m: since }));
    }
    if (p === 'full2' || p === 'full3') facts.push(t('house_note'));
    var out = $('#checkOut');
    out.innerHTML = '<p class="verdict ' + (res.ok ? 'ok' : 'no') + '" id="verdict" data-ok="' + res.ok + '">' + esc(verdict) + '</p>' +
      ticketHTML(tk, {
        left: tk.typed ? t('typed_ticket') : t('tk_no', { no: tk.no }), right: tk.typed ? '' : t('sheet_code', { code: tk.code }),
        cls: function (n) { return (on[n] ? ' hit' : '') + (need[n] ? ' need' : '') + (miss[n] ? ' miss' : ''); }
      }) +
      '<div class="legend"><span><i class="lg-hit"></i>' + esc(t('legend_hit')) + '</span>' + (res.any ? '' : '<span><i class="lg-miss"></i>' + esc(t('legend_miss')) + '</span>') + '</div>' +
      '<ul class="facts">' + facts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>';
    if (res.ok) {
      var done = game.winners.some(function (w) { return w.p === p && w.no === (tk.typed ? 0 : tk.no) && w.code === (tk.typed ? '' : tk.code); });
      out.appendChild(el('div', null, el('button', {
        type: 'button', class: 'btn btn-accent', id: 'winBtn', disabled: done,
        onclick: function () { recordWinner(p, tk, res.completedAt + 1); this.disabled = true; }
      }, el('span', { 'aria-hidden': 'true', text: '🏆' }), el('span', { text: t('btn_winner') }))));
    }
  }
  function recordWinner(p, tk, at) {
    var no = tk.typed ? 0 : tk.no, code = tk.typed ? '' : tk.code;
    if (!game.winners.some(function (w) { return w.p === p && w.no === no && w.code === code; }) && game.winners.length < MAX_WIN) {
      game.winners.push({ p: p, no: no, code: code, at: at });
      saveGame();
    }
    renderWinners(); renderWonMini(); renderClaimSelect();
    toast(t('winner_saved', { prize: prizeName(p), who: no ? t('tk_no', { no: no }) : t('typed_ticket') }));
  }

  function showFind() {
    lastCheck = 'find';
    var code = T.normCode($('#chkCode').value);
    if (!T.codeOk(code)) { showError(t('err_code')); return; }
    var r = rng(), p = chk.claim, found = [];
    for (var no = r.start; no <= r.end; no++) {
      var res = T.check(T.ticket(code, no), p, game.called);
      if (res.ok) found.push({ no: no, at: res.completedAt });
    }
    found.sort(function (a, b) { return a.at - b.at || a.no - b.no; });
    var out = $('#checkOut');
    out.innerHTML = '';
    out.appendChild(el('p', { class: 'mb0', id: 'findHead', dataset: { n: found.length }, text: found.length ? t('find_some', { prize: prizeName(p), a: r.start, b: r.end, n: found.length }) : t('find_none', { prize: prizeName(p), a: r.start, b: r.end }) }));
    if (found.length) {
      var box = el('div', { class: 'found-list' });
      found.slice(0, 200).forEach(function (f) {
        box.appendChild(el('button', { type: 'button', class: 'chip found', dataset: { no: f.no }, text: t('found_chip', { no: f.no, k: f.at + 1 }) }));
      });
      out.appendChild(box);
    }
    out.appendChild(el('p', { class: 'hint', text: t('find_hint') }));
  }
  function rerunCheck() { if (lastCheck === 'find' && chk.src === 'game') showFind(); else if (lastCheck) showCheck(); }

  function renderWinners() {
    var ul = $('#winners');
    ul.innerHTML = '';
    if (!game.winners.length) { ul.appendChild(el('li', { class: 'none', text: t('no_winners') })); return; }
    game.winners.forEach(function (w, i) {
      var who = w.no ? tkLabel(w.no, w.code || game.code) : t('typed_ticket');
      ul.appendChild(el('li', null,
        el('span', { text: '🏆 ' + prizeName(w.p) + ': ' + who + (w.at ? ' · ' + t('on_call', { k: w.at }) : '') }),
        el('button', { type: 'button', class: 'edu-iconbtn', 'aria-label': t('delete'), title: t('delete'), text: '✕', dataset: { i: i } })));
    });
  }

  /* =====================================================================
     PRIZES + RULES
     ===================================================================== */
  function buildPrizes() {
    var box = $('#prizeList');
    box.innerHTML = '';
    prizes.forEach(function (z) {
      box.appendChild(el('div', { class: 'pz', dataset: { p: z.p } },
        el('label', { class: 'pz-on' }, el('input', { type: 'checkbox', class: 'pz-cb' })),
        el('input', { type: 'text', class: 'pz-name no-i18n', maxlength: 40, autocomplete: 'off' }),
        el('input', { type: 'text', class: 'pz-prize no-i18n', maxlength: 40, autocomplete: 'off' }),
        el('p', { class: 'pz-desc' })));
    });
  }
  function syncPrizes() {
    $$('#prizeList .pz').forEach(function (row) {
      var z = prizeOf(row.dataset.p), def = t('pz_' + z.p);
      var cb = $('.pz-cb', row), nm = $('.pz-name', row), pr = $('.pz-prize', row);
      cb.checked = z.on;
      cb.setAttribute('aria-label', t('col_play') + ': ' + def);
      row.classList.toggle('off', !z.on);
      if (document.activeElement !== nm) nm.value = z.name || def;
      nm.setAttribute('aria-label', t('col_name') + ': ' + def);
      if (document.activeElement !== pr) pr.value = z.prize;
      pr.setAttribute('aria-label', t('col_win') + ': ' + def);
      pr.setAttribute('placeholder', t('prize_ph'));
      $('.pz-desc', row).textContent = t('pd_' + z.p);
    });
    setVal('#notes', notes);
  }
  function rulesHTML() {
    var meta = [dateText(), t('sheet_code', { code: game.code })].filter(Boolean).join(' · ');
    var h = '<div class="rules"><div class="r-head"><strong class="r-party no-i18n">' + esc(partyName() || t('app_title')) + '</strong><span>' + esc(meta) + '</span></div>';
    h += '<h3 class="r-title">' + esc(t('rules_title')) + '</h3><ol class="r-rules">';
    for (var i = 1; i <= 6; i++) h += '<li>' + esc(t('rule_' + i)) + '</li>';
    h += '</ol>';
    var on = enabledPrizes();
    if (on.length) {
      h += '<h4 class="r-sub">' + esc(t('h_prizes')) + '</h4><div class="scroll-x"><table class="r-table"><thead><tr><th>' + esc(t('th_claim')) + '</th><th>' + esc(t('th_how')) + '</th><th>' + esc(t('col_win')) + '</th></tr></thead><tbody>';
      on.forEach(function (z) {
        h += '<tr><td><strong>' + esc(prizeName(z.p)) + '</strong></td><td>' + esc(t('pd_' + z.p)) + '</td><td class="no-i18n">' + esc(z.prize.trim()) + '</td></tr>';
      });
      h += '</tbody></table></div>';
    }
    if (notes.trim()) h += '<p class="r-notes no-i18n">' + esc(notes.trim()) + '</p>';
    return h + '</div>';
  }
  function renderRules() { $('#rulesPreview').innerHTML = rulesHTML(); }

  /* =====================================================================
     PLAY ON PHONE
     ===================================================================== */
  function playCard(x, i) {
    var tk = T.ticket(x.code, x.no), marks = {};
    x.marks.forEach(function (n) { marks[n] = 1; });
    var card = el('div', { class: 'card stack play-card', dataset: { i: i } },
      el('div', { class: 'row' },
        el('h3', { class: 'mb0', text: tkLabel(x.no, x.code) }),
        el('button', { type: 'button', class: 'edu-iconbtn pl-remove', 'aria-label': t('remove_ticket'), title: t('remove_ticket'), text: '✕' })),
      el('div', { html: ticketHTML(tk, { play: marks }) }),
      el('p', { class: 'play-status', 'aria-live': 'polite' }),
      el('p', { class: 'play-done', 'aria-live': 'polite' }),
      el('div', null, el('button', { type: 'button', class: 'btn btn-sm pl-clear' }, el('span', { 'aria-hidden': 'true', text: '↺' }), el('span', { text: t('btn_clear_marks') }))));
    updatePlayCard(card, x);
    return card;
  }
  function updatePlayCard(card, x) {
    var tk = T.ticket(x.code, x.no), got = T.completedBy(tk, x.marks);
    $('.play-status', card).textContent = t('play_marked', { n: x.marks.length, total: T.numbersOf(tk).length });
    var done = $('.play-done', card);
    done.textContent = got.length ? '🎉 ' + t('play_has', { list: got.map(prizeName).join(', ') }) : '';
    done.className = 'play-done' + (got.length ? ' callout success' : '');
    done.hidden = !got.length;
    $$('.tk-c[data-n]', card).forEach(function (b) {
      var on = x.marks.indexOf(+b.dataset.n) >= 0;
      b.classList.toggle('mark', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function renderPlay() {
    setVal('#playCode', play.code);
    var box = $('#playList');
    box.innerHTML = '';
    play.tickets.forEach(function (x, i) { box.appendChild(playCard(x, i)); });
  }
  function playError(msg) { var e = $('#playErr'); e.textContent = msg || ''; e.hidden = !msg; }
  function addPlay(code, no) {
    code = T.normCode(code);
    if (!T.codeOk(code)) { playError(t('err_code')); return false; }
    if (!(no >= 1 && no <= T.MAX_TICKET)) { playError(t('err_no', { max: T.MAX_TICKET })); return false; }
    playError('');
    play.code = code;
    var i = -1;
    play.tickets.forEach(function (x, j) { if (x.code === code && x.no === no) i = j; });
    if (i < 0) {
      if (play.tickets.length >= MAX_PLAY) { playError(t('play_max', { n: MAX_PLAY })); savePlay(); return false; }
      play.tickets.push({ code: code, no: no, marks: [] });
      i = play.tickets.length - 1;
    } else toast(t('play_dup'));
    savePlay();
    renderPlay();
    return i;
  }
  /* a link from the host: ...#play=CODE-17 opens ticket 17 of that game on this phone */
  function readHash() {
    var m = /(?:^|[#&])play=([A-Za-z0-9]{3,16})-(\d{1,5})(?:$|&)/.exec(location.hash || '');
    if (!m) return false;
    var no = parseInt(m[2], 10);
    if (addPlay(m[1], no) === false) return false;
    selectTab('play');
    return true;
  }

  /* =====================================================================
     TABS + everything together
     ===================================================================== */
  function selectTab(id, focus) {
    if (TABS.indexOf(id) < 0) id = 'tickets';
    if (cfg.tab === 'caller' && id !== 'caller' && autoOn) { stopAuto(); toast(t('auto_paused')); }
    cfg.tab = id;
    saveCfg();
    TABS.forEach(function (x) {
      var b = $('#tab-' + x), on = x === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#panel-' + x).hidden = !on;
    });
    if (focus) $('#tab-' + id).focus();
    if (id === 'check' && lastCheck) rerunCheck();
    if (id === 'caller') checkVoice();
  }

  function renderAll() {
    renderTicketForm(); renderTickets();
    renderCallerSettings(); renderCaller(false);
    renderCheckForm(); renderWinners();
    syncPrizes(); renderRules();
    renderPlay();
    if (lastCheck) rerunCheck(); else showCheckIntro();
  }

  /* ---------------- events: tickets ---------------- */
  $('#party').addEventListener('input', function () {
    var v = this.value.slice(0, 80);
    cfg.party = v.trim() === t('def_party') ? null : v;
    saveCfg();
    renderTickets(); renderCaller(false); renderRules();
  });
  $('#party').addEventListener('change', function () { if (cfg.party === null) this.value = t('def_party'); });
  $('#pdate').addEventListener('input', function () { cfg.date = this.value || ''; saveCfg(); renderRules(); });
  $('#code').addEventListener('input', function () { if (T.codeOk(this.value)) $('#codeErr').hidden = true; });
  $('#code').addEventListener('change', function () { applyCode(this.value); });
  $('#code').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyCode(this.value); } });
  $('#newCode').addEventListener('click', function () {
    var c;
    do { c = T.randomCode(); } while (c === game.code);
    if (applyCode(c)) toast(t('code_new', { code: c }));
  });
  $('#count').addEventListener('input', function () {
    var v = parseInt(this.value, 10);
    if (v >= 1) { cfg.count = Math.min(MAX_COUNT, v); saveCfg(); pgIdx = 0; renderTickets(); renderTicketForm(); }
  });
  $('#count').addEventListener('change', function () {
    cfg.count = int(this.value, 1, MAX_COUNT, cfg.count);
    cfg.count = rng().count;
    saveCfg();
    this.value = cfg.count;
    renderTicketForm(); renderTickets();
  });
  $('#countChips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    cfg.count = +b.dataset.n;
    saveCfg();
    pgIdx = 0;
    $('#count').value = rng().count;
    renderTicketForm(); renderTickets();
  });
  $('#strips').addEventListener('change', function () {
    cfg.strips = this.checked;
    var r = rng();
    cfg.count = r.count; cfg.start = r.start;
    saveCfg();
    pgIdx = 0;
    $('#count').value = r.count; $('#start').value = r.start;
    renderTicketForm(); renderTickets();
  });
  $('#start').addEventListener('input', function () {
    var v = parseInt(this.value, 10);
    if (v >= 1) { cfg.start = Math.min(T.MAX_TICKET, v); saveCfg(); pgIdx = 0; renderTickets(); }
  });
  $('#start').addEventListener('change', function () {
    cfg.start = int(this.value, 1, T.MAX_TICKET, 1);
    cfg.start = rng().start;
    saveCfg();
    this.value = cfg.start;
    renderTickets();
  });
  $('#perPage').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    cfg.pp = +b.dataset.pp === 12 ? 12 : 6;
    saveCfg();
    pgIdx = 0;
    renderTicketForm(); renderTickets();
  });
  $('#pgPrev').addEventListener('click', function () { pgIdx--; renderTickets(); });
  $('#pgNext').addEventListener('click', function () { pgIdx++; renderTickets(); });
  $('#printTk').addEventListener('click', function () { if (T.codeOk($('#code').value) && T.normCode($('#code').value) !== game.code) applyCode($('#code').value); doPrint('tickets'); });
  $('#csvTk').addEventListener('click', downloadCsv);
  $('#sendNo').addEventListener('input', function () {
    var v = parseInt(this.value, 10);
    if (v >= 1 && v <= T.MAX_TICKET) { sendNo = v; updateSend(); }
  });
  $('#sendCopy').addEventListener('click', function () { EDU.copy(playUrl(game.code, sendNo)); });

  /* ---------------- events: caller ---------------- */
  $('#nextBtn').addEventListener('click', manualNext);
  $('#autoBtn').addEventListener('click', toggleAuto);
  $('#undoBtn').addEventListener('click', undo);
  $('#repeatBtn').addEventListener('click', repeat);
  $('#claimBtn').addEventListener('click', goCheck);
  $('#fsBtn').addEventListener('click', toggleFs);
  $('#newGameBtn').addEventListener('click', newGame);
  $('#board').addEventListener('click', function (e) {
    var c = e.target.closest('button.bc');
    if (!c || !cfg.manual) return;
    var n = +c.dataset.n;
    if (game.called.indexOf(n) >= 0) takeBack(n); else callNumber(n);
  });
  $('#every').addEventListener('change', function () { cfg.every = int(this.value, 3, 30, 8); saveCfg(); if (autoOn) schedule(); });
  $('#vlang').addEventListener('change', function () {
    cfg.vlang = this.value === 'ui' || LANG_CODES.indexOf(this.value) >= 0 ? this.value : 'ui';
    saveCfg();
    checkVoice();
  });
  ['voice', 'digits', 'slow'].forEach(function (k) {
    $('#' + k).addEventListener('change', function () { cfg[k] = this.checked; saveCfg(); if (k === 'voice') { if (!cfg.voice) EDU.stopSpeaking(); checkVoice(); } });
  });
  $('#manual').addEventListener('change', function () { cfg.manual = this.checked; saveCfg(); stopAuto(); renderCaller(false); });
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape' && isPresenting() && !(document.fullscreenElement || document.webkitFullscreenElement)) { setPresenting(false); return; }
    if (cfg.tab !== 'caller' || document.querySelector('.edu-modal-back')) return;
    var tg = e.target, tag = tg && tg.tagName, k = (e.key || '').toLowerCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tg && tg.isContentEditable)) return;
    var isTab = tg && tg.getAttribute && tg.getAttribute('role') === 'tab';
    if (k === ' ' || k === 'spacebar') {
      if ((tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY') && !isTab) return;
      e.preventDefault();
      manualNext();
    } else if (k === 'n') manualNext();
    else if (k === 'a') toggleAuto();
    else if (k === 'r') repeat();
    else if (k === 'f') toggleFs();
  });

  /* ---------------- events: check ---------------- */
  $('#srcSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    chk.src = b.dataset.src === 'typed' ? 'typed' : 'game';
    saveChk();
    renderCheckForm();
  });
  $('#chkCode').addEventListener('input', function () { var c = T.normCode(this.value); chk.code = c === game.code ? '' : c; saveChk(); });
  $('#chkNo').addEventListener('input', function () { var v = parseInt(this.value, 10); if (v >= 1) { chk.no = Math.min(T.MAX_TICKET, v); saveChk(); } });
  $('#typed').addEventListener('input', function () { chk.typed = this.value.slice(0, 400); saveChk(); });
  $('#claim').addEventListener('change', function () {
    chk.claim = PAT.indexOf(this.value) >= 0 ? this.value : 'full';
    saveChk();
    $('#claimDesc').textContent = t('pd_' + chk.claim);
    if (lastCheck) rerunCheck();
  });
  $('#checkBtn').addEventListener('click', showCheck);
  $('#findBtn').addEventListener('click', showFind);
  ['#chkCode', '#chkNo'].forEach(function (s) {
    $(s).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); showCheck(); } });
  });
  $('#checkOut').addEventListener('click', function (e) {
    var b = e.target.closest('.found');
    if (!b) return;
    chk.no = +b.dataset.no;
    saveChk();
    setVal('#chkNo', chk.no);
    showCheck();
  });
  $('#winners').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-i]');
    if (!b) return;
    game.winners.splice(+b.dataset.i, 1);
    saveGame();
    renderWinners(); renderWonMini(); renderClaimSelect();
    if (lastCheck === 'check') showCheck();
  });

  /* ---------------- events: prizes ---------------- */
  function prizeChanged() { savePrizes(); renderRules(); renderClaimSelect(); renderWinners(); renderWonMini(); }
  $('#prizeList').addEventListener('input', function (e) {
    var row = e.target.closest('.pz');
    if (!row) return;
    var z = prizeOf(row.dataset.p);
    if (e.target.classList.contains('pz-name')) { var v = e.target.value.slice(0, 40); z.name = v.trim() === t('pz_' + z.p) ? '' : v; }
    else if (e.target.classList.contains('pz-prize')) z.prize = e.target.value.slice(0, 40);
    prizeChanged();
  });
  $('#prizeList').addEventListener('change', function (e) {
    var row = e.target.closest('.pz');
    if (!row) return;
    var z = prizeOf(row.dataset.p);
    if (e.target.classList.contains('pz-cb')) { z.on = e.target.checked; row.classList.toggle('off', !z.on); prizeChanged(); }
    if (e.target.classList.contains('pz-name') && !z.name.trim()) { z.name = ''; e.target.value = t('pz_' + z.p); }
  });
  $('#notes').addEventListener('input', function () { notes = this.value.slice(0, 1000); store.set('notes', notes); renderRules(); });
  $('#printRules').addEventListener('click', function () { doPrint('rules'); });
  $('#defPrizes').addEventListener('click', function () {
    if (!confirm(t('def_prizes_confirm'))) return;
    prizes = cleanPrizes(null);
    savePrizes();
    syncPrizes(); prizeChanged();
  });

  /* ---------------- events: play on phone ---------------- */
  function openFromForm() {
    var i = addPlay($('#playCode').value, parseInt($('#playNo').value, 10));
    if (i === false) return;
    var card = $$('#playList .play-card')[i];
    if (card && card.scrollIntoView) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  $('#openBtn').addEventListener('click', openFromForm);
  ['#playCode', '#playNo'].forEach(function (s) {
    $(s).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); openFromForm(); } });
  });
  $('#playList').addEventListener('click', function (e) {
    var card = e.target.closest('.play-card');
    if (!card) return;
    var i = +card.dataset.i, x = play.tickets[i];
    if (!x) return;
    var cell = e.target.closest('button.tk-c');
    if (cell) {
      var n = +cell.dataset.n, j = x.marks.indexOf(n);
      if (j >= 0) x.marks.splice(j, 1); else x.marks.push(n);
      savePlay();
      updatePlayCard(card, x);
      return;
    }
    if (e.target.closest('.pl-clear')) { x.marks = []; savePlay(); updatePlayCard(card, x); return; }
    if (e.target.closest('.pl-remove')) { play.tickets.splice(i, 1); savePlay(); renderPlay(); }
  });
  window.addEventListener('hashchange', readHash);

  /* ---------------- tabs + reset ---------------- */
  $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('[role="tab"]'); if (b) selectTab(b.dataset.tab); });
  $('#tabs').addEventListener('keydown', function (e) {
    var i = TABS.indexOf(cfg.tab), rtl = document.documentElement.dir === 'rtl';
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var step = (e.key === 'ArrowRight') !== rtl ? 1 : -1;
      selectTab(TABS[(i + step + TABS.length) % TABS.length], true);
      e.preventDefault();
    } else if (e.key === 'Home') { selectTab(TABS[0], true); e.preventDefault(); }
    else if (e.key === 'End') { selectTab(TABS[TABS.length - 1], true); e.preventDefault(); }
  });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    stopAuto();
    EDU.stopSpeaking();
    if (isPresenting()) setPresenting(false);
    ['settings', 'game', 'prizes', 'notes', 'play', 'check'].forEach(function (k) { store.remove(k); });
    load();
    pgIdx = 0; sendNo = 0; lastCheck = null;
    buildPrizes();
    renderAll();
    selectTab('tickets');
  });

  /* ---------------- start ---------------- */
  buildPrizes();
  renderAll();
  if (!readHash()) selectTab(cfg.tab);
  EDU.onLang(renderAll);
})();
