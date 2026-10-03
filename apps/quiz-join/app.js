/* Join a Live Quiz: the STUDENT side of the Live Class Quiz (spec: LIVE_SPEC.md, API: firebase/API.md).
 *
 * Phone-first flow: quiz code → nickname → waiting room → question → answer sent → result → … → final rank.
 * It talks to the cloud ONLY through window.EDUCloud (shared/cloud.js; Demo mode = shared/cloud-mock.js).
 * There is no sign-in UI: the student is an anonymous player under the hood.
 * Reload-safe: {code, nickname} are kept with EDU.store, and the same device (Demo mode: the same tab) is the
 * same player, so a reload goes straight back to the current screen without typing anything.
 * Cost: one playerWatch() (= the session doc + my own player doc) from the code check until the student leaves. */
(function () {
  'use strict';

  var SLUG = 'quiz-join';
  var KEEP_MS = 12 * 3600 * 1000;      /* forget an unfinished quiz on this device after 12 hours */
  var GRACE_MS = 600;                  /* answers stay open this long after the countdown reaches 0 */
  var PROBE_MS = 25000;                /* no reply at all for this long = offline */
  var Cloud = window.EDUCloud;
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$;

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ------------------------------------------------------------------ helpers */
  /* Indian-script and Arabic-Indic digits (e.g. from an Urdu or Hindi keyboard) → 0-9 */
  var DIGIT_BASES = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function latinDigits(s) {
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (ch) {
      var c = ch.charCodeAt(0);
      for (var i = 0; i < DIGIT_BASES.length; i++) if (c >= DIGIT_BASES[i] && c <= DIGIT_BASES[i] + 9) return String(c - DIGIT_BASES[i]);
      return ch;
    });
  }
  function fmt(n) { return EDU.fmt(Number(n) || 0); }
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }
  function param(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }

  /* the six answer shapes ▲ ◆ ● ■ ★ ⬟ as inline SVG (the same on every phone, no font needed) */
  var SHAPES = [
    '<path d="M12 2.4 22.6 20.6H1.4z"/>',
    '<path d="M12 1.4 22.6 12 12 22.6 1.4 12z"/>',
    '<circle cx="12" cy="12" r="10.4"/>',
    '<rect x="2.2" y="2.2" width="19.6" height="19.6" rx="2"/>',
    '<path d="m12 1.4 3.1 6.8 7.4.7-5.6 5 1.6 7.3L12 17.4l-6.5 3.8 1.6-7.3-5.6-5 7.4-.7z"/>',
    '<path d="M12 1.6 22.6 9.3l-4 12.6H5.4l-4-12.6z"/>'
  ];
  function shapeSvg(k) { return '<svg class="shape" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + SHAPES[k % SHAPES.length] + '</svg>'; }
  /* tick / cross / dash drawn as SVG: text glyphs (✓ ✗) fall back to odd fonts, e.g. Nastaliq in Urdu */
  var ICONS = { ok: '<path d="M5 12.8l4.4 4.4L19.2 7.4"/>', bad: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', none: '<path d="M6 12h12"/>' };
  function iconSvg(k) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[k] + '</g></svg>';
  }

  /* An answer button (tag 'button') or a read-only copy of one (tag 'div'). */
  function answerEl(tag, k, text, attrs, extraClass) {
    var a = { class: 'ans c' + (k % 6) + (extraClass ? ' ' + extraClass : '') };
    if (attrs) for (var x in attrs) a[x] = attrs[x];
    var txt = String(text == null ? '' : text);
    if (txt.length > 70 && !extraClass) a['class'] += ' small-txt';
    return el(tag, a, el('span', { 'aria-hidden': 'true', html: shapeSvg(k) }), el('span', { class: 'ans-txt no-i18n', dir: 'auto', text: txt }));
  }
  function dots() { return el('span', { class: 'dots', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')); }
  function waiting(text) { return el('p', { class: 'waiting' }, el('span', { text: text }), dots()); }

  /* ------------------------------------------------------------------ nickname filter */
  /* A simple filter for English, Hindi and Hinglish swear words (kept base64-encoded so the source stays clean).
     "sub" words are blocked anywhere in the name; "tok" words only as a whole word, so that names such as
     Kshitij, Gandhi, Assam or Peacock are fine. Letters may be repeated ("fuuuck") or spaced ("f u c k"). */
  var BAD = (function () {
    function dec(b64) {
      try {
        var bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder('utf-8').decode(bytes).split(',');
      } catch (e) { return []; }
    }
    function rx(words, whole) {
      var parts = words.filter(Boolean).map(function (w) {
        return Array.from(w).map(function (c) { return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '+'; }).join('');
      });
      if (!parts.length) return null;
      try { return new RegExp(whole ? '^(?:' + parts.join('|') + ')$' : parts.join('|')); } catch (e) { return null; }
    }
    return {
      sub: rx(dec('ZnVjayxiaXRjaCxiYXN0YXJkLGFzc2hvbGUsY3VudCx3aG9yZSxuaWdnZXIsbmlnZ2EscmV0YXJkLHBlbmlzLHZhZ2luYSxwb3JuLGRpbGRvLHdhbmtlcixzbHV0LGNodXRpeWEsY2h1dGlhLGNodXR5YSxjaG9vdGl5YSxtYWRhcmNob2QsbWFkZXJjaG9kLG1hZGFyamF0LGJlaGVuY2hvZCxiaGVuY2hvZCxiZW5jaG9kLGJob3NkaSxiaG9zZGEsYmhvc2FkLGdhYW5kdSxnYW5kdSxoYXJhbWtob3IsaGFyYW16YWRhLGhhcmFtamFkYSxoYXJhbWksa3V0aXlhLGxhdmRlLGxhd2RlLGxvZHUsamhhYXR1LGpoYW50dSxiaGFkd2EsYmhhZHdlLGNoaW5hbCxjaG9kdSzgpJrgpYLgpKTgpL/gpK/gpL4s4KSa4KWB4KSk4KS/4KSv4KS+LOCkruCkvuCkpuCksOCkmuCli+CkpizgpKzgpLngpKjgpJrgpYvgpKYs4KSs4KS54KSo4KSa4KWL4KSmLOCkreClh+CkqOCkmuCli+CkpizgpK3gpYvgpLjgpKHgpYAs4KSt4KWL4KS44KSh4KS+LOCkl+CkvuCkguCkoeClgizgpLngpLDgpL7gpK7gpYAs4KS54KSw4KS+4KSu4KSW4KWL4KSwLOCkueCksOCkvuCkruCknOCkvuCkpuCkvizgpJXgpYHgpKTgpL/gpK/gpL4s4KSy4KWM4KSh4KS+LOCksuCljOCkoeClhyzgpLLgpLXgpKHgpL4s4KSt4KSh4KS14KS+LOCkmuCli+CkpizgpJ3gpL7gpILgpJ8s4KSd4KS+4KSf4KWCLOCkm+Ckv+CkqOCkvuCksg=='), false),
      tok: rx(dec('c2hpdCxhc3MsYXJzZSxkaWNrLGNvY2ssc2V4LHNleHkscmFwZSxmYWcsa3lzLGdhbmQsZ2FhbmQsbHVuZCxsb2RhLGxhdWRhLGxhdmRhLGxhd2RhLHJhbmRpLHRhdHRpLGJzZGssYmtsLG1rYyxjaG9kLHB1c3N5LGJvb2JzLHRpdHMsbnVkZSxzdWFyLGt1dHRhLGt1dHRlLGZ1ayxmY2ssd3RmLHN0ZnUs4KSX4KS+4KSC4KShLOCksuCkguCkoSzgpLDgpILgpKHgpYAs4KSf4KSf4KWN4KSf4KWALOCkuOClgeCkheCksCzgpJXgpYHgpKTgpY3gpKTgpL4s4KSV4KWB4KSk4KWN4KSk4KWH'), true)
    };
  })();
  var LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '|': 'i', '+': 't' };
  function isRude(name) {
    var s = String(name);
    try { s = s.normalize('NFKC'); } catch (e) { }
    s = latinDigits(s).toLowerCase()
      .replace(/[​-‍⁠﻿]/g, '')
      .replace(/़/g, '').replace(/ँ/g, 'ं')          /* nukta, chandrabindu → plain letters */
      .replace(/[0134578@$!|+]/g, function (c) { return LEET[c]; });
    var tokens = s.split(/[\s\d\-_.,:;'"`~^*#%&=?<>()[\]{}\\/]+/).filter(Boolean);
    var joined = tokens.join('');
    if (BAD.sub && BAD.sub.test(joined)) return true;
    if (BAD.tok && (BAD.tok.test(joined) || tokens.some(function (w) { return BAD.tok.test(w); }))) return true;
    return false;
  }
  /* privacy: a nickname must not be a phone number or an email address */
  function looksPrivate(name) {
    var s = latinDigits(name);
    return (s.match(/\d/g) || []).length >= 7 || /\S+@\S+\.\S+/.test(s);
  }

  /* ------------------------------------------------------------------ state */
  var S = {
    phase: 'code',        /* code | probe | name | joining | game */
    code: null,
    resume: false,        /* the probe is a reload / return to a remembered quiz */
    resumeName: '',
    name: '',
    st: null,             /* last playerWatch state */
    stop: null, wid: 0,   /* current watcher */
    probeTimer: null,
    seenMe: false,
    leaving: false,
    reveals: {},          /* question index → [correct, my choice] (for "You got 3 of 5 right") */
    pending: null,        /* {i, choice, state: 'sending'|'sent'|'failed'|'closed', errKey} */
    codeErr: null, nameErr: null, gameErr: null,
    view: '', viewKey: '', sig: '', timer: null, lastSecs: null
  };

  var codeInput = $('#codeInput'), nameInput = $('#nameInput');

  /* ------------------------------------------------------------------ memory (this device only) */
  function remember() {
    if (!S.code) return;
    store.set('current', { code: S.code, name: S.name || '', at: Date.now(), reveals: S.reveals });
  }
  function forget() { store.remove('current'); }
  function loadSaved() {
    var v = store.get('current', null);
    if (!v || typeof v !== 'object' || !Cloud.normalizeCode(v.code)) return null;
    if (!(Date.now() - (Number(v.at) || 0) < KEEP_MS)) { forget(); return null; }
    return v;
  }

  /* ------------------------------------------------------------------ errors */
  var KNOWN = ['offline', 'quota-exceeded', 'not-found', 'session-locked', 'session-ended', 'name-taken',
    'invalid-input', 'not-configured', 'permission-denied', 'unknown'];
  function errKey(e, ctx) {
    var c = e && e.code;
    if (KNOWN.indexOf(c) < 0) c = 'unknown';
    if (c === 'not-found') return Cloud.isDemo ? 'err_not_found_demo' : 'err_not_found';
    if (c === 'permission-denied') return ctx === 'join' ? 'err_cant_join' : ctx === 'answer' ? 'err_too_late' : 'err_permission_denied';
    if (c === 'invalid-input' && ctx === 'join') return 'err_bad_name';
    return 'err_' + c.replace(/-/g, '_');
  }

  /* ------------------------------------------------------------------ static screens (code, nickname) */
  function paintSlots() {
    var v = codeInput.value, spans = EDU.$$('#slots span');
    spans.forEach(function (sp, i) {
      sp.textContent = v.charAt(i) || '';
      sp.classList.toggle('on', i < v.length);
      sp.classList.toggle('cur', i === Math.min(v.length, 5));
    });
    $('#codeBox').classList.toggle('bad', !!S.codeErr);
  }
  function setCodeErr(k) { S.codeErr = k || null; paintErrors(); paintSlots(); }
  function setNameErr(k) { S.nameErr = k || null; paintErrors(); }
  function paintErrors() {
    var ce = $('#codeErr'), ne = $('#nameErr');
    ce.hidden = !S.codeErr; ce.textContent = S.codeErr ? t(S.codeErr) : '';
    ne.hidden = !S.nameErr; ne.textContent = S.nameErr ? t(S.nameErr) : '';
  }

  function playing() { return S.phase === 'game' && /^(question|sent|timeup|result)$/.test(S.view); }

  function show() {
    var p = S.phase;
    $('#scrCode').hidden = !(p === 'code' || p === 'probe');
    $('#scrName').hidden = !(p === 'name' || p === 'joining');
    $('#scrGame').hidden = p !== 'game';
    $('#intro').hidden = p === 'game';
    $('#demoBanner').hidden = !Cloud.isDemo || playing();
    $('#extras').hidden = playing();
    $('#offlineBanner').hidden = Cloud.isDemo || navigator.onLine !== false;
    var cb = $('#codeNext');
    cb.disabled = p === 'probe';
    cb.setAttribute('aria-busy', p === 'probe' ? 'true' : 'false');
    cb.textContent = t(p === 'probe' ? (S.resume ? 'connecting' : 'checking') : 'next');
    codeInput.readOnly = p === 'probe';
    var jb = $('#joinBtn');
    jb.disabled = p === 'joining';
    jb.setAttribute('aria-busy', p === 'joining' ? 'true' : 'false');
    jb.textContent = t(p === 'joining' ? 'joining' : 'join_btn');
    nameInput.readOnly = p === 'joining';
    $('#privacyLink').href = EDU.ROOT + 'legal/privacy.html?lang=' + EDU.lang;
    paintErrors();
  }

  function toCode(errK, focus) {
    S.phase = 'code';
    S.resume = false;
    setCodeErr(errK);
    show();
    if (focus) { try { codeInput.focus({ preventScroll: true }); codeInput.select(); } catch (e) { } }
  }
  function toName() {
    S.phase = 'name';
    $('#quizTitle').textContent = (S.st && S.st.session && S.st.session.title) || '';
    if (!nameInput.value) nameInput.value = S.resumeName || store.get('lastName', '') || '';
    setNameErr(null);
    show();
    try { window.scrollTo(0, 0); } catch (e) { }
    try { nameInput.focus({ preventScroll: true }); } catch (e) { }
  }

  /* ------------------------------------------------------------------ watching the session */
  function endWatch() {
    S.wid++;
    if (S.stop) { try { S.stop(); } catch (e) { } }
    S.stop = null;
    clearTimeout(S.probeTimer);
    S.probeTimer = null;
    stopTimer();
  }
  function startWatch(code) {
    endWatch();
    var id = S.wid;
    S.stop = Cloud.playerWatch(code,
      function (st) { if (id === S.wid) onState(st); },
      function (e) { if (id === S.wid) onWatchErr(e); });
  }

  /* Check the code: one watcher = the session + my own player doc. It stays on for the whole quiz.
     resume: returning to the quiz remembered on this device; quiet: also hide "ended / gone" errors
     (a plain reload long after the quiz), but never when the code came from a link or the keyboard. */
  function probe(code, resume, quiet) {
    if (code !== S.code) { S.reveals = {}; S.pending = null; nameInput.value = resume ? nameInput.value : ''; }
    S.code = code;
    S.resume = !!resume;
    S.quiet = !!quiet;
    S.st = null;
    S.seenMe = false;
    S.phase = 'probe';
    setCodeErr(null);
    show();
    startWatch(code);
    S.probeTimer = setTimeout(function () {
      if (S.phase !== 'probe') return;
      endWatch();
      toCode('err_offline');
    }, PROBE_MS);
  }

  function onState(st) {
    if (!st || st.code !== S.code) return;
    S.st = st;
    if (S.leaving) return;
    var s = st.session;
    if (S.phase === 'probe') {
      clearTimeout(S.probeTimer);
      if (!s) { endWatch(); if (S.resume) forget(); toCode(S.quiet ? null : errKey({ code: 'not-found' })); return; }
      if (st.me) { enterGame(); return; }
      if (st.kicked) { endWatch(); forget(); toCode('err_cant_join'); return; }
      if (s.state === 'ended') { endWatch(); if (S.resume) forget(); toCode(S.quiet ? null : 'err_session_ended'); return; }
      if (s.locked) { endWatch(); toCode('err_session_locked'); return; }
      toName();
      return;
    }
    if (S.phase === 'name') {
      if (!s) { endWatch(); toCode(errKey({ code: 'not-found' })); return; }
      if (st.me) { enterGame(); return; }
      if (st.kicked) { endWatch(); toCode('err_cant_join'); return; }
      if (s.state === 'ended') { endWatch(); toCode('err_session_ended'); return; }
      $('#quizTitle').textContent = s.title || '';
      return;
    }
    if (S.phase === 'game') renderGame();
  }

  function onWatchErr(e) {
    var k = errKey(e);
    if (S.phase === 'probe') { endWatch(); toCode(k); return; }
    if (S.phase === 'name' || S.phase === 'joining') { setNameErr(k); return; }
    if (S.phase === 'game') { S.gameErr = k; renderGame(true); }
  }

  function reconnect() {
    S.gameErr = null;
    startWatch(S.code);
    renderGame(true);
  }

  /* ------------------------------------------------------------------ actions */
  function submitCode() {
    if (S.phase !== 'code') return;
    var c = Cloud.normalizeCode(latinDigits(codeInput.value));
    if (!c) { setCodeErr('err_bad_code'); return; }
    probe(c, false, false);
  }

  function join() {
    if (S.phase !== 'name') return;
    var name = Cloud.normalizeName(nameInput.value);
    if (!name) { setNameErr('err_bad_name'); return; }
    if (looksPrivate(name)) { setNameErr('err_private_name'); return; }
    if (isRude(name)) { setNameErr('err_rude_name'); return; }
    S.phase = 'joining';
    setNameErr(null);
    show();
    Cloud.joinSession(S.code, name).then(function (r) {
      if (S.phase !== 'joining') return;
      S.name = r.name;
      store.set('lastName', r.name);
      enterGame();
    }, function (e) {
      if (S.phase !== 'joining') return;
      var k = errKey(e, 'join');
      if (e && (e.code === 'not-found' || e.code === 'session-ended')) { endWatch(); toCode(k); return; }
      S.phase = 'name';
      setNameErr(k);
      show();
      try { nameInput.focus({ preventScroll: true }); nameInput.select(); } catch (x) { }
    });
  }

  function enterGame() {
    S.phase = 'game';
    S.gameErr = null;
    S.sig = '';
    S.view = '';
    S.viewKey = '';
    if (S.st && S.st.me) { S.seenMe = true; S.name = S.st.me.name; }
    remember();
    show();
    renderGame(true);
  }

  /* back to the code screen, ready for another quiz */
  function another() {
    endWatch();
    forget();
    S.code = null; S.st = null; S.pending = null; S.reveals = {}; S.view = ''; S.leaving = false;
    codeInput.value = '';
    paintSlots();
    $('#scrGame').textContent = '';
    toCode(null, true);
    try { window.scrollTo(0, 0); } catch (e) { }
  }

  /* leave during the waiting room, or "Remove me" after the end (also deletes my answers) */
  function leave(confirmKey, doneKey) {
    if (!window.confirm(t(confirmKey))) return;
    S.leaving = true;
    Cloud.leaveSession(S.code).then(function () {
      if (doneKey === 'removed_done') { store.remove('lastName'); nameInput.value = ''; }
      another();
      if (doneKey) EDU.toast(t(doneKey), 3600);
    }, function (e) {
      S.leaving = false;
      EDU.toast(t(errKey(e)), 3600);
      renderGame(true);
    });
  }

  function tapAnswer(i, choice) {
    var p = S.pending;
    if (p && p.i === i && (p.state === 'sending' || p.state === 'sent')) return;
    var mine = S.st && S.st.myAnswers ? S.st.myAnswers[i] : undefined;
    if (mine !== undefined && mine !== null) return;
    buzz(35);
    S.pending = { i: i, choice: choice, state: 'sending' };
    renderGame();
    Cloud.submitAnswer(S.code, i, choice).then(function () {
      if (S.pending && S.pending.i === i) S.pending.state = 'sent';
      renderGame();
    }, function (e) {
      if (!S.pending || S.pending.i !== i) return;
      var hard = e && (e.code === 'permission-denied' || e.code === 'session-ended' || e.code === 'not-found' || e.code === 'invalid-input');
      S.pending = { i: i, choice: choice, state: hard ? 'closed' : 'failed', errKey: errKey(e, 'answer') };
      renderGame(true);
    });
  }

  /* ------------------------------------------------------------------ timing */
  function qTime(s, i) { var q = s.questions && s.questions[i]; return Math.max(1, Number(q && q.time) || Number(s.timePerQ) || 20); }
  function leftMs(s, i) {
    var total = qTime(s, i) * 1000;
    if (typeof s.questionStartedAt !== 'number') return total;
    return Math.min(total, total - (Cloud.now() - s.questionStartedAt));
  }
  function stopTimer() { if (S.timer) { clearInterval(S.timer); S.timer = null; } S.lastSecs = null; }
  function tick() {
    var st = S.st, s = st && st.session;
    if (!s || s.state !== 'question' || S.view !== 'question') { stopTimer(); return; }
    var i = s.current, total = qTime(s, i) * 1000, left = leftMs(s, i);
    var bar = $('#timerBar'), secs = $('#secs');
    if (bar) {
      bar.firstChild.style.width = Math.max(0, Math.min(100, left / total * 100)) + '%';
      bar.classList.toggle('low', left < 5000);
      var n = Math.max(0, Math.ceil(left / 1000));
      if (n !== S.lastSecs) {
        S.lastSecs = n;
        if (secs) secs.textContent = n;
        bar.setAttribute('aria-valuenow', n);
        bar.setAttribute('aria-valuetext', t('time_left', { n: n }));
      }
    }
    if (left < -GRACE_MS) renderGame();
  }

  /* ------------------------------------------------------------------ game screens */
  function gamebar(st) {
    return el('div', { class: 'gamebar' },
      el('span', { class: 'chip me-chip' }, el('span', { 'aria-hidden': 'true', text: '👤' }), el('span', { class: 'no-i18n', dir: 'auto', text: st.me.name })),
      el('span', { class: 'chip score-chip', id: 'scoreChip' }, t('score') + ': ' + fmt(st.me.score)));
  }
  function screen(name, attrs) {
    var a = { class: 'qj-screen', 'data-screen': name };
    if (attrs) for (var k in attrs) a[k] = attrs[k];
    var box = el('div', a);
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) box.appendChild(arguments[i]);
    return box;
  }

  function vWait(key) {
    return { name: 'wait', sig: ['wait', key], build: function () {
      return screen('wait', { class: 'qj-screen card qj-card' }, el('div', { class: 'spinner', 'aria-hidden': 'true' }), el('h2', { text: t(key) }));
    } };
  }

  function vMsg(key, icon) {
    return { name: 'msg', sig: ['msg', key], build: function () {
      return screen('msg', { class: 'qj-screen card qj-card', 'data-msg': key },
        el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: icon }),
        el('h2', { text: t(key) }),
        el('div', { class: 'qj-actions' }, el('button', { class: 'btn btn-primary btn-lg', type: 'button', id: 'anotherBtn', text: t('join_another'), onclick: another })));
    } };
  }

  function vLobby(st) {
    var s = st.session, me = st.me;
    return { name: 'lobby', sig: ['lobby', me.name, s.playerCount, s.title], build: function () {
      return screen('lobby', { class: 'qj-screen card qj-card' },
        el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: '🎉' }),
        el('h2', { text: t('lobby_title') }),
        el('p', { class: 'lead', text: t('lobby_look') }),
        el('span', { class: 'qj-lbl', text: t('name_label') }),
        el('div', { class: 'nick no-i18n', dir: 'auto', text: me.name }),
        el('p', { class: 'quizname' }, el('span', { text: t('quiz_label') }), ' ', el('strong', { class: 'no-i18n', dir: 'auto', text: s.title || '' })),
        waiting(t('lobby_wait')),
        s.playerCount > 0 ? el('p', { class: 'muted', text: t('players_n', { n: fmt(s.playerCount) }) }) : null,
        el('div', { class: 'qj-actions' }, el('button', { class: 'btn-link', type: 'button', id: 'leaveBtn', text: t('leave_btn'), onclick: function () { leave('confirm_leave', null); } })));
    } };
  }

  function vQuestion(st, i) {
    var s = st.session, q = (s.questions && s.questions[i]) || { q: '', options: [] }, opts = q.options || [];
    var long = opts.some(function (o) { return String(o).length > 38; });
    return { name: 'question', sig: ['q', i, q.q, opts, st.me.name, st.me.score], build: function () {
      var total = qTime(s, i);
      var grid = el('div', { class: 'answers' + (long ? ' one' : ''), id: 'answers' });
      opts.forEach(function (o, k) {
        grid.appendChild(answerEl('button', k, o, { type: 'button', 'data-choice': k, onclick: function () { tapAnswer(i, k); } }));
      });
      return screen('question', { 'data-q': i },
        gamebar(st),
        el('div', { class: 'card qcard' },
          el('div', { class: 'qmeta' },
            el('span', { class: 'badge primary', text: t('q_of', { n: i + 1, total: (s.questions || []).length }) }),
            el('span', { class: 'secs', id: 'secs', 'aria-hidden': 'true' })),
          el('div', { class: 'progress timer', id: 'timerBar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-label': t('time_left', { n: total }) }, el('span', { style: { width: '100%' } })),
          el('h2', { class: 'qtext no-i18n', dir: 'auto', text: q.q })),
        el('p', { class: 'pick muted', text: t('pick_answer') }),
        grid);
    } };
  }

  function vSent(st, i, choice, state, errK) {
    var s = st.session, q = (s.questions && s.questions[i]) || { options: [] };
    return { name: 'sent', sig: ['sent', i, choice, state, errK, st.me.name, st.me.score], build: function () {
      var head = state === 'sending'
        ? [el('div', { class: 'spinner', 'aria-hidden': 'true' }), el('h2', { text: t('sending') })]
        : state === 'failed'
          ? [el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: '📶' }), el('h2', { text: t('lost_title') })]
          : [el('div', { class: 'sent-icon', 'aria-hidden': 'true', html: iconSvg('ok') }), el('h2', { text: t('sent_title') })];
      var box = screen('sent', { 'data-q': i, 'data-state': state }, gamebar(st));
      var card = el('div', { class: 'card qj-card' }, head,
        el('div', { class: 'yours' }, el('span', { class: 'qj-lbl', text: t('your_answer') }), answerEl('div', choice, (q.options || [])[choice], null, 'mini')));
      if (state === 'failed') {
        card.appendChild(el('p', { class: 'callout danger qj-err', role: 'alert', text: t(errK || 'err_unknown') }));
        card.appendChild(el('div', { class: 'qj-actions' }, el('button', { class: 'btn btn-primary btn-lg', type: 'button', id: 'sendAgain', text: t('send_again'), onclick: function () { S.pending = null; tapAnswer(i, choice); } })));
      } else if (state !== 'sending') {
        card.appendChild(waiting(t('sent_wait')));
      }
      box.appendChild(card);
      return box;
    } };
  }

  function vTimeup(st, i, errK) {
    return { name: 'timeup', sig: ['timeup', i, errK, st.me.name, st.me.score], build: function () {
      return screen('timeup', { 'data-q': i }, gamebar(st),
        el('div', { class: 'card qj-card' },
          el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: '⏰' }),
          el('h2', { text: t(errK || 'timeup_title') }),
          el('p', { class: 'lead', text: t('timeup_wait') }),
          dots()));
    } };
  }

  function noteReveal(i, correct, mine) {
    var v = [correct, mine === undefined ? null : mine];
    var old = S.reveals[i];
    if (old && old[0] === v[0] && old[1] === v[1]) return;
    S.reveals[i] = v;
    remember();
  }

  function vResult(st, i) {
    var s = st.session, r = s.reveal, me = st.me, q = (s.questions && s.questions[i]) || { options: [] };
    var mine = st.myAnswers ? st.myAnswers[i] : undefined;
    if ((mine === undefined || mine === null) && S.pending && S.pending.i === i && S.pending.state === 'sent') mine = S.pending.choice;
    var has = mine !== undefined && mine !== null;
    var kind = !has ? 'none' : mine === r.correct ? 'correct' : 'wrong';
    var pts = kind === 'correct' ? (me.lastQ === i && typeof me.last === 'number' ? me.last : null) : 0;
    noteReveal(i, r.correct, has ? mine : null);
    return { name: 'result', sig: ['res', i, kind, pts, me.score, r.correct, r.explain || '', me.name], build: function () {
      var head = el('div', { class: 'res ' + kind },
        el('div', { class: 'res-icon', 'aria-hidden': 'true', html: iconSvg(kind === 'correct' ? 'ok' : kind === 'wrong' ? 'bad' : 'none') }),
        el('h2', { text: t(kind === 'correct' ? 'correct' : kind === 'wrong' ? 'wrong' : 'res_none') }),
        kind === 'none' ? null
          : pts === null
            ? el('p', { class: 'pts wait' }, el('span', { text: t('points_wait') }), ' ', dots())
            : el('p', { class: 'pts', 'data-points': pts, text: t('points_plus', { n: fmt(pts) }) }));
      var card = el('div', { class: 'card qj-card' });
      if (kind !== 'correct' && typeof r.correct === 'number' && q.options && q.options[r.correct] !== undefined) {
        card.appendChild(el('div', { class: 'right-ans' }, el('span', { class: 'qj-lbl', text: t('right_answer') }), answerEl('div', r.correct, q.options[r.correct], null, 'mini')));
      }
      if (r.explain) card.appendChild(el('div', { class: 'explain panel' }, el('strong', { text: t('why') }), el('p', { class: 'no-i18n', dir: 'auto', text: r.explain })));
      card.appendChild(el('div', { class: 'total' }, el('span', { class: 'qj-lbl', text: t('total_points') }), el('span', { class: 'big-number', id: 'totalScore', 'data-score': me.score || 0, text: fmt(me.score) })));
      card.appendChild(el('p', { class: 'muted mb0', text: t('next_soon') }));
      return screen('result', { 'data-q': i, 'data-result': kind }, gamebar(st), head, card);
    } };
  }

  function revealStats() {
    var asked = 0, right = 0;
    Object.keys(S.reveals).forEach(function (k) {
      var v = S.reveals[k];
      if (!v) return;
      asked++;
      if (v[1] !== null && v[1] === v[0]) right++;
    });
    return { asked: asked, right: right };
  }

  function vFinal(st) {
    var me = st.me, s = st.session, rank = typeof me.rank === 'number' ? me.rank : null, n = Number(s.playerCount) || 0;
    var score = Number(me.score) || 0, rs = revealStats();
    var msgKey = score <= 0 ? 'msg_try' : rank === 1 ? 'msg_first' : rank && rank <= 3 ? 'msg_top3' : 'msg_good';
    var icon = score <= 0 ? '🌱' : rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎉';
    return { name: 'final', sig: ['final', rank, n, score, rs, me.name, s.title], build: function () {
      var rankText = rank ? (n >= rank ? t('final_rank', { rank: fmt(rank), n: fmt(n) }) : t('final_rank_only', { rank: fmt(rank) })) : '';
      var card = el('div', { class: 'card qj-card final-card' },
        el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: icon }),
        el('h2', { text: t('final_title') }),
        el('div', { class: 'nick no-i18n', dir: 'auto', text: me.name }),
        rankText ? el('p', { class: 'rank-line', id: 'rankLine', text: rankText }) : null,
        el('div', { class: 'score-line' }, el('span', { class: 'big-number', id: 'finalScore', text: fmt(score) }), el('span', { class: 'qj-lbl', text: t('points_word') })),
        rs.asked ? el('p', { class: 'muted mb0', id: 'rightLine', text: t('final_right', { c: fmt(rs.right), n: fmt(rs.asked) }) }) : null,
        el('p', { class: 'msg', text: t(msgKey) }),
        el('div', { class: 'qj-actions' },
          el('button', { class: 'btn btn-primary btn-lg', type: 'button', id: 'anotherBtn', text: t('join_another'), onclick: another }),
          el('a', { class: 'btn btn-lg', id: 'moreApps', href: EDU.ROOT + 'index.html?lang=' + EDU.lang, text: t('more_apps') })));
      var remove = el('div', { class: 'card remove-card' },
        el('h3', { text: t('remove_title') }),
        el('p', { text: t('remove_hint') }),
        el('button', { class: 'btn btn-danger', type: 'button', id: 'removeMe', text: t('remove_me'), onclick: function () { leave('confirm_remove', 'removed_done'); } }));
      return screen('final', { 'data-rank': rank || '', 'data-score': score, 'data-right': rs.right, 'data-asked': rs.asked }, card, remove);
    } };
  }

  /* which screen fits the latest state */
  function pickView(st) {
    if (!st) return vWait('connecting');
    var s = st.session;
    if (!s) { endWatch(); forget(); return vMsg('closed_title', '🚪'); }
    if (st.kicked) { endWatch(); forget(); return vMsg('removed_title', '🚫'); }
    if (!st.me) {
      if (S.seenMe) { endWatch(); forget(); return vMsg('left_title', '👋'); }
      return vWait('joining');
    }
    S.seenMe = true;
    if (st.me.name && st.me.name !== S.name) { S.name = st.me.name; remember(); }
    if (s.state === 'lobby') return vLobby(st);
    if (s.state === 'question') {
      var i = s.current;
      if (S.pending && S.pending.i !== i) S.pending = null;
      var mine = st.myAnswers ? st.myAnswers[i] : undefined;
      if (mine !== undefined && mine !== null) return vSent(st, i, mine, 'sent');
      if (S.pending) {
        if (S.pending.state === 'closed') return vTimeup(st, i, S.pending.errKey);
        return vSent(st, i, S.pending.choice, S.pending.state, S.pending.errKey);
      }
      if (leftMs(s, i) < -GRACE_MS) return vTimeup(st, i, null);
      return vQuestion(st, i);
    }
    if (s.state === 'reveal' && s.reveal && typeof s.reveal.index === 'number') return vResult(st, s.reveal.index);
    if (s.state === 'ended') return vFinal(st);
    return vWait('connecting');
  }

  function errorBar() {
    return el('div', { class: 'callout danger row spread', role: 'alert', style: { marginBottom: '12px' } },
      el('span', { class: 'grow', text: t(S.gameErr) }),
      el('button', { class: 'btn btn-sm', type: 'button', id: 'retryBtn', text: t('try_again'), onclick: reconnect }));
  }

  function renderGame(force) {
    if (S.phase !== 'game') return;
    var view = pickView(S.st);
    if (S.phase !== 'game') return;
    var sig = EDU.lang + '|' + JSON.stringify(view.sig) + '|' + (S.gameErr || '');
    if (!force && sig === S.sig) return;
    var newScreen = view.name + JSON.stringify(view.sig.slice(0, 2)) !== S.view + S.viewKey;
    S.sig = sig;
    S.view = view.name;
    S.viewKey = JSON.stringify(view.sig.slice(0, 2));
    var box = $('#scrGame');
    box.textContent = '';
    if (S.gameErr) box.appendChild(errorBar());
    box.appendChild(view.build());
    show();
    if (view.name === 'question') {
      if (!S.timer) S.timer = setInterval(tick, 200);
      S.lastSecs = null;
      tick();
    } else stopTimer();
    if (newScreen) {
      try { window.scrollTo(0, 0); } catch (e) { }
      var h = box.querySelector('h2');
      if (h && view.name !== 'question') { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { } }
    }
  }

  /* ------------------------------------------------------------------ wiring */
  codeInput.addEventListener('input', function () {
    var v = latinDigits(codeInput.value).replace(/\D/g, '').slice(0, 6);
    if (v !== codeInput.value) codeInput.value = v;
    if (S.codeErr) setCodeErr(null); else paintSlots();
    if (v.length === 6 && S.phase === 'code') submitCode();
  });
  codeInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submitCode(); } });
  ['focus', 'blur', 'keyup', 'click'].forEach(function (ev) { codeInput.addEventListener(ev, paintSlots); });
  $('#codeNext').addEventListener('click', submitCode);

  nameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); join(); } });
  nameInput.addEventListener('input', function () { if (S.nameErr) setNameErr(null); });
  $('#joinBtn').addEventListener('click', join);
  $('#changeCode').addEventListener('click', function () {
    endWatch();
    S.st = null;
    toCode(null, true);
  });

  window.addEventListener('online', show);
  window.addEventListener('offline', show);

  EDU.onLang(function () {
    show();
    paintSlots();
    if (S.phase === 'game') renderGame(true);
  });

  /* ------------------------------------------------------------------ start */
  (function start() {
    var saved = loadSaved();
    var raw = latinDigits(param('code') || '').replace(/\D/g, '').slice(0, 6);
    var urlCode = Cloud.normalizeCode(raw);
    if (saved) { S.resumeName = saved.name || ''; }
    if (urlCode && (!saved || saved.code !== urlCode)) {
      codeInput.value = urlCode;
      paintSlots();
      probe(urlCode, false, false);
    } else if (saved) {
      codeInput.value = saved.code;
      S.code = saved.code;
      S.reveals = saved.reveals && typeof saved.reveals === 'object' ? saved.reveals : {};
      S.name = saved.name || '';
      paintSlots();
      probe(saved.code, true, !urlCode);
    } else {
      codeInput.value = raw;
      paintSlots();
      toCode(raw ? 'err_bad_code' : null, !raw);
    }
  })();
})();
