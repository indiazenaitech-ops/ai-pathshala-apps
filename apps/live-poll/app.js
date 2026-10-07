/* Live Poll & Voting.
 * HOST (signed in with Google; "Demo Host" in Demo mode): make polls, run one on the projector, watch a live
 * bar chart while participants vote on their phones, then export CSV / PNG.
 * PARTICIPANT (this same page with ?code=XXXXXX): optional nickname (empty = Guest-NNNN), one vote per question.
 * It talks to the cloud ONLY through window.EDUCloud (shared/cloud.js), fitting the quiz API without changes:
 *   - a poll is saved as a quiz whose questions all have a dummy correct:0 that is NEVER revealed;
 *     the answer type travels in the private `explain` field as "poll:<kind>" (only the owner can read it);
 *   - "next question" = startQuestion(i + 1), the last one = endSession(); revealQuestion and writeScores
 *     are never called (no scores, fewer writes);
 *   - timePerQ is the maximum (600 s) and no countdown is shown: the host closes voting.
 * Host views (hash routing): #  dashboard · #new · #sample · #edit/<quizId> · #host/<code> · #results/<code> */
(function () {
  'use strict';
  var SLUG = 'live-poll';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$;
  var C = window.EDUCloud;
  var LIM = Object.assign({ name: 20, title: 150, questions: 200, question: 1000, option: 300, minOptions: 2, maxOptions: 6, maxTime: 600 }, (C && C.LIMITS) || {});
  var KINDS = ['mc', 'yesno', 'yesnomaybe', 'stars', 'agree', 'slot'];
  var KIND_KEY = { mc: 'type_mc', yesno: 'type_yesno', yesnomaybe: 'type_yesnomaybe', stars: 'type_stars', agree: 'type_agree', slot: 'type_slot' };
  var SCALE = { stars: 1, agree: 1 };
  var JOIN_TEXT = 'apnipathshala.ai/apps/live-poll';
  var KEEP_MS = 12 * 3600 * 1000;
  var PROBE_MS = 25000;
  var IN_APP = /\b(FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Snapchat|Line\/)|; wv\)/i.test(navigator.userAgent || '');
  var G_ICON = '<svg class="gicon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.570-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.970-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

  var main = EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ------------------------------------------------------------------ helpers */
  function str(v, max) { return String(v === null || v === undefined ? '' : v).replace(/\r\n?/g, '\n').trim().slice(0, max || 1000); }
  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
  function fmt(n, o) { return EDU.fmt(Number(n) || 0, o); }
  function param(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }
  function fmtDate(ms) {
    if (typeof ms !== 'number' || !isFinite(ms)) return '';
    try {
      return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', numberingSystem: 'latn' }).format(new Date(ms));
    } catch (e) { return new Date(ms).toISOString().slice(0, 16).replace('T', ' '); }
  }
  function hostName(h) { return h ? (h.demo ? t('demo_host') : (h.name || h.email || '')) : ''; }
  function nav(hash) { if ((location.hash || '#') === hash) route(); else location.hash = hash; }
  function iconBtn(text, label, disabled, onclick, extra) {
    var b = el('button', { type: 'button', class: 'edu-iconbtn', 'aria-label': label, title: label, text: text, disabled: !!disabled, onclick: onclick });
    if (extra) Object.keys(extra).forEach(function (k) { b.setAttribute(k, extra[k]); });
    return b;
  }
  /* Indian-script / Arabic-Indic digits typed on a phone keyboard → 0-9 */
  /* simpler and exact: the digit value is the code point minus the zero of its block */
  var ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function latinDigits (s) {
    return String(s == null ? '' : s).replace(/[^\x00-\x7F]/g, function (ch) {
      var c = ch.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (c >= ZEROS[i] && c <= ZEROS[i] + 9) return String(c - ZEROS[i]);
      return ch;
    });
  }

  function errMsg(err, ctx) {
    if (!err || err.cancelled) return '';
    var c = String(err.code || 'unknown');
    if (c === 'not-found' && C.isDemo) return t('err_not_found_demo');
    if (c === 'permission-denied' && ctx === 'join') return t('err_cant_join');
    if (c === 'permission-denied' && ctx === 'vote') return t('err_too_late');
    if (c === 'invalid-input' && ctx === 'join') return t('err_bad_name');
    var key = 'err_' + c.replace(/-/g, '_');
    return t(EDU.has(key) ? key : 'err_unknown');
  }
  function logErr(err) { try { console.warn('[live-poll]', err && err.code, err && err.message); } catch (e) { } }
  function report(err) { var m = errMsg(err); if (m) EDU.toast(m, 6000); logErr(err); }
  function demoLink(err) {
    if (C.isDemo || !err || ['not-configured', 'quota-exceeded', 'offline'].indexOf(err.code) < 0) return null;
    return el('a', { href: C.demoUrl(), text: t('use_demo') });
  }
  function errorRow(err, retry) {
    return el('div', { class: 'callout danger err-row', role: 'alert' },
      el('span', { text: errMsg(err) || t('err_unknown') }),
      retry ? el('button', { type: 'button', class: 'btn btn-sm', text: t('try_again'), onclick: retry }) : null,
      demoLink(err));
  }
  function legalLinks() {
    EDU.$$('a.lnk-privacy').forEach(function (a) { a.href = '../../legal/privacy.html?lang=' + EDU.lang; });
    EDU.$$('a.lnk-terms').forEach(function (a) { a.href = '../../legal/terms.html?lang=' + EDU.lang; });
  }
  function updateOnline() { $('#offlineBanner').hidden = !!C.isDemo || navigator.onLine !== false; }
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);

  /* ------------------------------------------------------------------ poll <-> quiz document */
  function content() { var all = window.APP_CONTENT || {}; return all[EDU.lang] || all.en; }
  function kindOf(explain) { var m = /^poll:([a-z]+)$/.exec(String(explain || '')); return m && KINDS.indexOf(m[1]) >= 0 ? m[1] : 'mc'; }
  function toQuiz(poll) {
    var q = {
      title: str(poll.title, LIM.title), lang: EDU.lang,
      questions: poll.questions.map(function (x) {
        return { q: str(x.q, LIM.question), options: x.options.map(function (o) { return str(o, LIM.option); }), correct: 0, explain: 'poll:' + (x.kind || 'mc') };
      })
    };
    if (poll.id) q.id = poll.id;
    return q;
  }
  function fromQuiz(q) {
    return {
      id: q.id, title: q.title || '',
      questions: (q.questions || []).map(function (x) { return { q: x.q || x.text || '', kind: kindOf(x.explain), options: (x.options || []).slice(0, LIM.maxOptions) }; })
    };
  }
  function samplePoll() {
    var c = content().sample;
    return { title: c.title, questions: c.questions.map(function (q) { return { q: q.q, kind: q.kind, options: q.options.slice() }; }) };
  }

  /* ------------------------------------------------------------------ state */
  var VIEWS = ['loading', 'signin', 'dash', 'edit', 'host', 'results', 'part'];
  var view = 'loading';
  var host = null, hostKnown = false;
  var cloudReady = !!C.isDemo, readyErr = null, signinErr = null;
  var polls = null, pollsErr = null, sessions = null, sessionsErr = null;
  var H = null, E = null, R = null;
  var busyHosting = false;
  var PART_CODE = C.normalizeCode(latinDigits(param('code') || ''));

  function show(name) {
    view = name;
    VIEWS.forEach(function (v) { var n = $('#v-' + v); if (n) n.hidden = v !== name; });
    var big = name === 'host';
    $('#intro').hidden = big || name === 'part';
    $('#howto').hidden = big || name === 'edit' || name === 'part';
    $('#privacyLine').hidden = big;
    $('#demoBanner').hidden = !C.isDemo || big;
    main.classList.toggle('edu-wide', big);
    document.body.classList.toggle('edu-wide-page', big);
  }

  /* my live polls: the sessions list of the account also holds Live Quiz sessions, so this device
     remembers which codes were started from Live Poll */
  function myCodes() { var a = store.get('codes', []); return Array.isArray(a) ? a : []; }
  function addCode(code) { var a = myCodes().filter(function (c) { return c !== code; }); a.unshift(code); store.set('codes', a.slice(0, 200)); }
  function dropCode(code) { store.set('codes', myCodes().filter(function (c) { return c !== code; })); store.remove('hide:' + code); }

  /* ================================================================== HOST */
  function route() {
    closeHost();
    E = null; R = null;
    if (PART_CODE) return;
    if (!hostKnown) { show('loading'); return; }
    if (!host) { renderSignin(); show('signin'); return; }
    var p = (location.hash || '').replace(/^#\/?/, '').split('/');
    var code = C.normalizeCode(p[1] || '');
    if (p[0] === 'host' && code) return openHost(code);
    if (p[0] === 'results' && code) return openResults(code);
    if (p[0] === 'new' || p[0] === 'sample') return openEditor(p[0]);
    if (p[0] === 'edit' && /^[A-Za-z0-9_-]{1,64}$/.test(p[1] || '')) return openEditor(p[1]);
    openDash();
  }
  window.addEventListener('hashchange', function () { if (!PART_CODE) route(); });

  /* ------------------------------------------------------------------ sign in + join box */
  var wantSample = false;
  function renderSignin() {
    var btn = $('#signIn');
    btn.innerHTML = '';
    if (C.isDemo) {
      btn.className = 'btn btn-primary btn-lg signin-btn';
      btn.disabled = false;
      btn.appendChild(el('span', { 'aria-hidden': 'true', text: '▶' }));
      btn.appendChild(el('span', { text: t('signin_demo') }));
    } else {
      btn.className = 'btn btn-lg btn-google signin-btn';
      btn.disabled = !cloudReady && !readyErr;
      if (btn.disabled) btn.appendChild(el('span', { text: t('loading') }));
      else { btn.insertAdjacentHTML('beforeend', G_ICON); btn.appendChild(el('span', { text: t('signin_google') })); }
    }
    $('#runSampleNow').disabled = !C.isDemo && !cloudReady;
    $('#inappHint').hidden = C.isDemo || !IN_APP;
    var box = $('#signinErr'), m = errMsg(signinErr);
    box.innerHTML = '';
    if (m) { box.appendChild(el('span', { text: m })); var a = demoLink(signinErr); if (a) { box.appendChild(document.createTextNode(' ')); box.appendChild(a); } }
    box.hidden = !m;
  }
  function doSignIn(sample) {
    signinErr = null;
    wantSample = !!sample;
    renderSignin();
    $('#signIn').disabled = true;
    /* straight from the click, so the Google popup is allowed */
    C.signInTeacher().then(function () { }, function (e) { signinErr = e; wantSample = false; logErr(e); }).then(function () {
      if (view === 'signin') renderSignin();
    });
  }
  $('#signIn').addEventListener('click', function () { if (!this.disabled) doSignIn(false); });
  $('#runSampleNow').addEventListener('click', function () {
    if (host) { hostPoll(samplePoll(), this); return; }
    doSignIn(true);
  });
  $('#joinForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var c = C.normalizeCode(latinDigits($('#joinCode').value));
    $('#joinCodeErr').hidden = !!c;
    if (!c) { $('#joinCode').focus(); return; }
    location.href = partUrl(c);
  });

  /* ------------------------------------------------------------------ dashboard */
  function openDash() { show('dash'); renderDash(); loadPolls(); loadSessions(); }
  function renderDash() {
    $('#hello').textContent = t('hello', { name: hostName(host) });
    $('#accName').textContent = hostName(host);
    $('#dataNote').textContent = t(C.isDemo ? 'data_demo' : 'data_cloud');
    renderPolls(); renderSessions();
  }
  function loadPolls() {
    pollsErr = null;
    return C.listQuizzes().then(function (l) { polls = l; }, function (e) { pollsErr = e; logErr(e); })
      .then(function () { if (view === 'dash') renderPolls(); });
  }
  function loadSessions() {
    sessionsErr = null;
    return C.listSessions().then(function (l) { sessions = l; }, function (e) { sessionsErr = e; logErr(e); })
      .then(function () { if (view === 'dash') renderSessions(); });
  }
  function renderPolls() {
    var box = $('#pollList');
    box.innerHTML = '';
    var s = samplePoll();
    box.appendChild(el('div', { class: 'prow sample' },
      el('div', { class: 'pinfo' }, el('div', { class: 'pname' }, el('span', { class: 'badge accent', text: t('sample_badge') }), ' ', s.title),
        el('div', { class: 'small muted', text: t('n_questions', { n: fmt(s.questions.length) }) })),
      el('div', { class: 'acts' },
        el('button', { type: 'button', class: 'btn btn-primary', id: 'hostSample', text: '▶ ' + t('run_live'), onclick: function () { hostPoll(samplePoll(), this); } }),
        el('button', { type: 'button', class: 'btn', id: 'copySample', text: t('edit_copy'), onclick: function () { nav('#sample'); } }))));
    if (pollsErr) { box.appendChild(errorRow(pollsErr, loadPolls)); return; }
    if (!polls) { box.appendChild(el('p', { class: 'muted', text: t('loading') })); return; }
    if (!polls.length) { box.appendChild(el('p', { class: 'muted mb0', text: t('no_polls') })); return; }
    polls.forEach(function (q) {
      box.appendChild(el('div', { class: 'prow cloud-poll', 'data-id': q.id },
        el('div', { class: 'pinfo' }, el('div', { class: 'pname no-i18n', text: q.title }),
          el('div', { class: 'small muted', text: t('n_questions', { n: fmt(q.count) }) + (q.updatedAt ? ' · ' + fmtDate(q.updatedAt) : '') })),
        el('div', { class: 'acts' },
          el('button', { type: 'button', class: 'btn btn-primary btn-sm', 'data-act': 'host', text: '▶ ' + t('run_live'), onclick: function () { hostCloudPoll(q.id, this); } }),
          el('button', { type: 'button', class: 'btn btn-sm', 'data-act': 'edit', text: t('edit'), onclick: function () { nav('#edit/' + q.id); } }),
          el('button', { type: 'button', class: 'btn btn-sm btn-danger', 'data-act': 'delete', text: t('delete'), onclick: function () { deletePoll(q); } }))));
    });
  }
  function stateLabel(st) { return st === 'ended' ? t('state_ended') : st === 'lobby' ? t('state_lobby') : t('state_live'); }
  function renderSessions() {
    var box = $('#sessList');
    box.innerHTML = '';
    if (sessionsErr) { box.appendChild(errorRow(sessionsErr, loadSessions)); return; }
    if (!sessions) { box.appendChild(el('p', { class: 'muted', text: t('loading') })); return; }
    var mine = myCodes();
    var list = sessions.filter(function (s) { return mine.indexOf(s.code) >= 0; });
    if (!list.length) { box.appendChild(el('p', { class: 'muted mb0', text: t('no_sessions') })); return; }
    list.forEach(function (s) {
      var ended = s.state === 'ended';
      box.appendChild(el('div', { class: 'prow sess', 'data-code': s.code },
        el('div', { class: 'pinfo' }, el('div', { class: 'pname no-i18n', text: s.title }),
          el('div', { class: 'small muted' }, t('code_n', { code: s.code }), ' · ', stateLabel(s.state), ' · ', t('participants_n', { n: fmt(s.players) }), ' · ', el('span', { dir: 'ltr', text: fmtDate(s.createdAt) }))),
        el('div', { class: 'acts' },
          ended ? null : el('button', { type: 'button', class: 'btn btn-sm btn-primary', 'data-act': 'resume', text: t('resume'), onclick: function () { nav('#host/' + s.code); } }),
          el('button', { type: 'button', class: 'btn btn-sm', 'data-act': 'results', text: t('results'), onclick: function () { nav('#results/' + s.code); } }),
          el('button', { type: 'button', class: 'btn btn-sm btn-danger', 'data-act': 'delete', text: t('delete'), onclick: function () { deleteSession(s.code); } }))));
    });
  }
  function hostPoll(poll, btn) {
    if (busyHosting) return;
    busyHosting = true;
    if (btn) btn.disabled = true;
    C.createSession(toQuiz(poll), { timePerQ: LIM.maxTime, shuffle: false, shuffleOptions: false })
      .then(function (r) { addCode(r.code); nav('#host/' + r.code); }, report)
      .then(function () { busyHosting = false; if (btn) btn.disabled = false; });
  }
  function hostCloudPoll(id, btn) {
    btn.disabled = true;
    C.getQuiz(id).then(function (q) { btn.disabled = false; hostPoll(fromQuiz(q), btn); }, function (e) { btn.disabled = false; report(e); });
  }
  function deletePoll(q) {
    if (!window.confirm(t('confirm_delete_poll', { title: q.title }))) return;
    C.deleteQuiz(q.id).then(function () { EDU.toast(t('deleted')); return loadPolls(); }, report);
  }
  function deleteSession(code) {
    if (!window.confirm(t('confirm_delete_session'))) return;
    C.deleteSession(code).then(function () {
      dropCode(code);
      EDU.toast(t('deleted'));
      if (view === 'results') nav('#'); else loadSessions();
    }, report);
  }
  $('#newPoll').addEventListener('click', function () { nav('#new'); });
  $('#signOut').addEventListener('click', function () { C.signOut().catch(report); });
  $('#deleteAccount').addEventListener('click', function () {
    var chk = el('input', { type: 'checkbox', id: 'delChk' });
    var go = el('button', { type: 'button', class: 'btn btn-danger', id: 'delGo', text: t('delete_forever'), disabled: true });
    chk.addEventListener('change', function () { go.disabled = !chk.checked; });
    var close = EDU.modal(el('div', { class: 'stack' },
      el('p', { text: t('delete_account_text') }),
      el('label', { class: 'check' }, chk, el('span', { text: t('delete_account_check') })),
      el('div', { class: 'row' }, go, el('button', { type: 'button', class: 'btn', text: t('cancel'), onclick: function () { close(); } }))), { title: t('delete_account') });
    go.addEventListener('click', function () {
      go.disabled = true;
      C.deleteTeacherAccount().then(function () {
        store.remove('draft'); store.remove('codes');
        close();
        EDU.toast(t('account_deleted'), 5000);
      }, function (e) { go.disabled = !chk.checked; report(e); });
    });
  });

  /* ------------------------------------------------------------------ editor */
  function presets() { return content().presets; }
  function blankQ() { return { q: '', kind: 'mc', options: ['', '', '', ''] }; }
  function draftKey(key) { return (host ? host.uid : '') + ':' + key; }
  function saveDraft() { if (E && E.poll) store.set('draft', { key: draftKey(E.key), poll: E.poll, at: Date.now() }); }
  function touched() { if (!E) return; E.dirty = true; clearTimeout(E.saveT); E.saveT = setTimeout(saveDraft, 400); }
  function openEditor(key) {
    show('edit');
    E = { key: key, poll: null, dirty: false };
    var d = store.get('draft', null);
    if (d && d.key === draftKey(key) && d.poll && Array.isArray(d.poll.questions)) {
      E.poll = d.poll; E.dirty = true;
      EDU.toast(t('draft_restored'), 4000);
      renderEditor(); return;
    }
    if (key === 'new') { E.poll = { title: '', questions: [blankQ()] }; renderEditor(); return; }
    if (key === 'sample') { E.poll = samplePoll(); renderEditor(); return; }
    var myE = E;
    $('#v-edit').innerHTML = '';
    $('#v-edit').appendChild(el('div', { class: 'card muted', text: t('loading') }));
    C.getQuiz(key).then(function (q) { if (E === myE) { E.poll = fromQuiz(q); renderEditor(); } },
      function (e) { report(e); if (E === myE) nav('#'); });
  }
  function renderEditor() {
    var box = $('#v-edit'), p = E.poll;
    box.innerHTML = '';
    var card = el('div', { class: 'card stack' });
    box.appendChild(card);
    card.appendChild(el('div', { class: 'ed-head' }, el('h2', { class: 'mb0', text: t('edit_poll') }),
      el('button', { type: 'button', class: 'btn btn-ghost', text: t('back_dash'), onclick: cancelEdit })));
    var title = el('input', { type: 'text', id: 'pTitle', class: 'no-i18n', maxlength: LIM.title, value: p.title || '' });
    title.addEventListener('input', function () { p.title = title.value; touched(); });
    card.appendChild(el('label', { class: 'field' }, el('span', { text: t('poll_title') }), title));
    p.questions.forEach(function (q, i) { card.appendChild(qCard(q, i)); });
    card.appendChild(el('div', {}, el('button', { type: 'button', class: 'btn', id: 'addQ', text: '+ ' + t('add_question'), disabled: p.questions.length >= LIM.questions, onclick: addQuestion })));
    card.appendChild(el('div', { class: 'ed-actions' },
      el('button', { type: 'button', class: 'btn btn-primary', id: 'savePoll', text: t('save_poll'), onclick: saveEdit }),
      el('button', { type: 'button', class: 'btn', id: 'cancelEdit', text: t('cancel'), onclick: cancelEdit }),
      el('p', { class: 'ed-msg', id: 'edMsg', role: 'alert' })));
  }
  function qCard(q, i) {
    var N = E.poll.questions.length, n = fmt(i + 1);
    var card = el('div', { class: 'qcard', 'data-i': i });
    card.appendChild(el('div', { class: 'qcard-head' }, el('h3', { text: t('question_n', { n: n }) }),
      el('div', { class: 'row' },
        iconBtn('↑', t('move_up', { n: n }), i === 0, function () { moveQ(i, -1); }),
        iconBtn('↓', t('move_down', { n: n }), i === N - 1, function () { moveQ(i, 1); }),
        iconBtn('🗑', t('delete_question', { n: n }), N === 1, function () { deleteQ(i); }))));
    var ta = el('textarea', { id: 'pq' + i, class: 'no-i18n', maxlength: LIM.question, placeholder: t('question_ph'), 'aria-label': t('question_n', { n: n }) });
    ta.value = q.q || '';
    ta.addEventListener('input', function () { q.q = ta.value; touched(); });
    card.appendChild(ta);
    var sel = el('select', { id: 'pk' + i }, KINDS.map(function (k) { return el('option', { value: k, text: t(KIND_KEY[k]), selected: q.kind === k }); }));
    sel.addEventListener('change', function () {
      q.kind = sel.value;
      if (q.kind !== 'mc') q.options = presets()[q.kind].slice();
      touched(); renderEditor(); focusEl('#pk' + i);
    });
    card.appendChild(el('label', { class: 'field' }, el('span', { text: t('type_label') }), sel));
    var opts = el('div', { class: 'stack' });
    q.options.forEach(function (o, j) {
      var inp = el('input', { type: 'text', id: 'po' + i + '_' + j, class: 'no-i18n', maxlength: LIM.option, value: o, 'aria-label': t('option_n', { n: fmt(j + 1) }), placeholder: t('option_n', { n: fmt(j + 1) }) });
      inp.addEventListener('input', function () { q.options[j] = inp.value; touched(); });
      opts.appendChild(el('div', { class: 'orow o' + j }, el('span', { class: 'odot', 'aria-hidden': 'true' }), inp,
        q.options.length > LIM.minOptions ? iconBtn('✕', t('remove_option', { n: fmt(j + 1) }), false, function () { q.options.splice(j, 1); touched(); renderEditor(); }) : null));
    });
    card.appendChild(opts);
    if (q.options.length < LIM.maxOptions) {
      card.appendChild(el('div', {}, el('button', { type: 'button', class: 'btn btn-sm', id: 'addOpt' + i, text: '+ ' + t('add_option'), onclick: function () {
        q.options.push(''); touched(); renderEditor(); focusEl('#po' + i + '_' + (q.options.length - 1));
      } })));
    }
    return card;
  }
  function focusEl(sel) { var n = $(sel); if (n) { n.focus(); if (n.scrollIntoView) n.scrollIntoView({ block: 'center' }); } }
  function addQuestion() { E.poll.questions.push(blankQ()); touched(); renderEditor(); focusEl('#pq' + (E.poll.questions.length - 1)); }
  function moveQ(i, d) { var a = E.poll.questions, x = a[i]; a[i] = a[i + d]; a[i + d] = x; touched(); renderEditor(); }
  function deleteQ(i) { E.poll.questions.splice(i, 1); touched(); renderEditor(); }
  function validateEdit() {
    var p = E.poll, title = str(p.title, LIM.title);
    if (!title) return { err: t('err_title'), focus: '#pTitle' };
    if (!p.questions.length) return { err: t('err_no_questions') };
    var out = [];
    for (var i = 0; i < p.questions.length; i++) {
      var q = p.questions[i], txt = str(q.q, LIM.question);
      if (!txt) return { err: t('err_q_text', { n: fmt(i + 1) }), focus: '#pq' + i };
      var opts = q.options.map(function (o) { return str(o, LIM.option); }).filter(Boolean).slice(0, LIM.maxOptions);
      if (opts.length < LIM.minOptions) return { err: t('err_q_options', { n: fmt(i + 1) }), focus: '#po' + i + '_0' };
      out.push({ q: txt, kind: q.kind || 'mc', options: opts });
    }
    return { poll: { id: p.id, title: title, questions: out.slice(0, LIM.questions) } };
  }
  function saveEdit() {
    var r = validateEdit(), msg = $('#edMsg');
    if (r.err) { msg.textContent = r.err; if (r.focus) focusEl(r.focus); return; }
    msg.textContent = '';
    var btn = $('#savePoll'), myE = E;
    btn.disabled = true;
    clearTimeout(E.saveT);
    C.saveQuiz(toQuiz(r.poll)).then(function () {
      store.remove('draft');
      EDU.toast(t('saved'));
      if (E === myE) { E.dirty = false; nav('#'); }
    }, function (e) { btn.disabled = false; report(e); });
  }
  function cancelEdit() {
    if (E && E.dirty && !window.confirm(t('confirm_discard'))) return;
    if (E) clearTimeout(E.saveT);
    store.remove('draft');
    E = null;
    nav('#');
  }

  /* ------------------------------------------------------------------ QR (qr.js, offline) */
  function qrSvg(text) {
    var r = window.QRGen && window.QRGen.encode(text, 'M');
    if (!r || !r.ok) return '';
    var n = r.size, m = 2, size = n + 2 * m, d = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (r.modules[y][x]) d += 'M' + (x + m) + ' ' + (y + m) + 'h1v1h-1z';
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges" role="img" aria-label="' + EDU.esc(t('scan_qr')) + '"><rect width="' + size + '" height="' + size + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  /* Participant address: online the public page of this app; in Demo mode (and local test servers) this
     page next to us, so another tab of this browser can join. */
  function partUrl(code) {
    var local = /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$/.test(location.hostname);
    if (!C.isDemo && !local) return EDU.SITE.url + 'apps/live-poll/?code=' + code;
    try {
      var u = new URL('index.html', location.href);
      u.search = ''; u.hash = '';
      u.searchParams.set('code', code);
      if (C.isDemo && param('mock')) u.searchParams.set('mock', '1');
      if (EDU.lang !== 'en') u.searchParams.set('lang', EDU.lang);
      return u.href;
    } catch (e) { return 'index.html?code=' + code; }
  }

  /* ------------------------------------------------------------------ host a live poll */
  function hideKey(code) { return 'hide:' + code; }
  function openHost(code) {
    show('host');
    H = { code: code, st: null, screen: '', busy: false, stop: null, hidden: !!store.get(hideKey(code), false), msgFrom: null };
    $('#hTitle').textContent = '';
    $('#hCode').textContent = t('code_n', { code: code });
    $('#hMsg').hidden = true;
    var stage = $('#hStage');
    stage.innerHTML = '';
    stage.appendChild(el('p', { class: 'big-msg', text: t('connecting') }));
    updateCtrl();
    var myH = H;
    H.stop = C.hostWatch(code, function (st) { if (H === myH) onHostState(st); }, function (e) { if (H === myH) hostErr(e, 'watch'); });
  }
  function closeHost() {
    if (!H) return;
    try { if (H.stop) H.stop(); } catch (e) { }
    H = null;
    if (document.fullscreenElement || document.webkitFullscreenElement) EDU.fullscreen();
  }
  function hostErr(e, from) {
    if (!H) return;
    logErr(e);
    var m = errMsg(e);
    if (!m) return;
    var box = $('#hMsg');
    box.innerHTML = '';
    box.appendChild(el('span', { text: m }));
    var a = demoLink(e);
    if (a) { box.appendChild(document.createTextNode(' ')); box.appendChild(a); }
    box.hidden = false;
    H.msgFrom = from;
  }
  function phaseOf(s) { return s.state === 'lobby' ? 'lobby' : s.state === 'ended' ? 'final' : 'question'; }
  function onHostState(st) {
    H.st = st;
    if (H.msgFrom === 'watch') { $('#hMsg').hidden = true; H.msgFrom = null; }
    var s = st.session;
    if (!s) {
      H.screen = 'gone';
      var stage = $('#hStage');
      stage.innerHTML = '';
      stage.appendChild(el('p', { class: 'big-msg', id: 'sessionGone', text: t('session_gone') }));
      updateCtrl(); return;
    }
    $('#hTitle').textContent = s.title || '';
    var key = phaseOf(s) + ':' + s.current + ':' + (H.hidden ? 1 : 0);
    if (key !== H.screen) { H.screen = key; renderStage(); } else updateStage();
    updateCtrl();
  }
  function renderStage() {
    var s = H.st.session, ph = phaseOf(s), stage = $('#hStage');
    stage.innerHTML = '';
    stage.setAttribute('data-phase', ph);
    if (ph === 'lobby') renderLobby(stage);
    else if (ph === 'question') renderQuestion(stage);
    else renderFinal(stage, H.st, { host: true });
    var r = $('#host').getBoundingClientRect();
    if (r.top < 0) $('#host').scrollIntoView({ block: 'start' });
  }
  function updateStage() {
    var ph = phaseOf(H.st.session);
    if (ph === 'lobby') updateLobby();
    else if (ph === 'question') { updatePlayers(); updateBars($('#hStage'), H.st, H.st.session.current); }
    else { var stage = $('#hStage'); stage.innerHTML = ''; renderFinal(stage, H.st, { host: true }); }
  }
  function sentence(tpl, node) {
    var p = el('p', { class: 'join-line' });
    String(tpl).split('{url}').forEach(function (txt, k) { if (k) p.appendChild(node.cloneNode(true)); if (txt) p.appendChild(document.createTextNode(txt)); });
    return p;
  }
  function joinBlock(code, compact) {
    var url = partUrl(code);
    var box = el('div', { class: 'join-box' },
      sentence(t('join_line'), el('b', { class: 'join-url no-i18n', dir: 'ltr', text: JOIN_TEXT })),
      el('div', { class: 'join-code', id: 'lobbyCode', dir: 'ltr', 'data-code': code, 'aria-label': code.split('').join(' '), text: code.slice(0, 3) + ' ' + code.slice(3) }),
      el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn btn-sm', id: 'copyLink', text: t('copy_link'), onclick: function () { EDU.copy(url).then(function () { EDU.toast(t('copied')); }, function () { }); } }),
        C.isDemo ? el('a', { class: 'btn btn-sm', id: 'openPart', href: url, target: '_blank', rel: 'noopener' }, el('span', { 'aria-hidden': 'true', text: '📱 ' }), el('span', { text: t('open_participant') })) : null));
    if (compact) return box;
    return el('div', { class: 'lobby' }, box,
      el('figure', { class: 'qr-box' }, el('div', { class: 'qr-img', id: 'qrImg', 'data-url': url, html: qrSvg(url) }), el('figcaption', { text: t('scan_qr') })));
  }
  function renderLobby(stage) {
    stage.appendChild(joinBlock(H.code));
    stage.appendChild(el('div', { class: 'players-head' }, el('h2', { id: 'joinedN' }), el('button', { type: 'button', class: 'btn', id: 'lockBtn', onclick: toggleLock })));
    stage.appendChild(el('p', { class: 'lock-note', id: 'lockNote', hidden: true, text: '🔒 ' + t('locked_note') }));
    stage.appendChild(el('div', { class: 'pchips', id: 'players' }));
    stage.appendChild(el('p', { class: 'muted', id: 'lobbyHint' }));
    updateLobby();
  }
  function updateLobby() {
    updatePlayers();
    var players = H.st.players || [];
    var hint = $('#lobbyHint');
    if (hint) hint.textContent = players.length ? '' : t('waiting_participants');
  }
  function updatePlayers() {
    var s = H.st.session, players = H.st.players || [];
    var h = $('#joinedN');
    if (h) { h.textContent = t('joined_n', { n: fmt(players.length) }); h.setAttribute('data-n', players.length); }
    var lock = $('#lockBtn');
    if (lock) {
      lock.textContent = (s.locked ? '🔓 ' : '🔒 ') + t(s.locked ? 'unlock' : 'lock');
      lock.setAttribute('aria-pressed', s.locked ? 'true' : 'false');
      lock.disabled = !!H.busy;
    }
    var note = $('#lockNote');
    if (note) note.hidden = !s.locked;
    var box = $('#players');
    if (!box) return;
    var seen = {}, keep = {};
    players.forEach(function (p) { keep[p.id] = 1; });
    EDU.$$('.pchip', box).forEach(function (c) { var id = c.getAttribute('data-id'); if (keep[id]) seen[id] = c; else c.remove(); });
    players.forEach(function (p, k) {
      var chip = seen[p.id] || el('span', { class: 'pchip', 'data-id': p.id },
        el('span', { class: 'nm no-i18n', dir: 'auto', text: p.name }),
        el('button', { type: 'button', class: 'kick', 'aria-label': t('remove_p', { name: p.name }), title: t('remove_p', { name: p.name }), text: '✕', onclick: function () { kick(p); } }));
      if (box.children[k] !== chip) box.insertBefore(chip, box.children[k] || null);
    });
  }
  function toggleLock() { var s = H && H.st && H.st.session; if (s) act(function () { return C.lockSession(H.code, !s.locked); }); }
  function kick(p) { if (window.confirm(t('confirm_remove_p', { name: p.name }))) act(function () { return C.kickPlayer(H.code, p.id); }); }

  /* counts of one question: [{count}] + total votes */
  function tally(st, i) {
    var q = st.session.questions[i], counts = q.options.map(function () { return 0; });
    var a = (st.answers && st.answers[i]) || {};
    Object.keys(a).forEach(function (pid) { var c = a[pid] && a[pid].choice; if (isInt(c) && c >= 0 && c < counts.length) counts[c]++; });
    var total = counts.reduce(function (x, y) { return x + y; }, 0);
    return { counts: counts, total: total };
  }
  function kindAt(st, i) { return kindOf(st.key && st.key.explain && st.key.explain[i]); }
  function avgText(st, i, tl) {
    if (!SCALE[kindAt(st, i)] || !tl.total) return '';
    var sum = tl.counts.reduce(function (acc, c, j) { return acc + c * (j + 1); }, 0);
    return t('average', { n: fmt(sum / tl.total, { maximumFractionDigits: 1, minimumFractionDigits: 1 }), max: fmt(tl.counts.length) });
  }
  function pct(c, total) { return total ? Math.round(100 * c / total) : 0; }
  function barsEl(st, i, hidden, id) {
    var q = st.session.questions[i];
    return el('div', { class: 'bars' + (hidden ? ' hidden-res' : ''), id: id || null, 'data-q': i }, q.options.map(function (o, j) {
      return el('div', { class: 'barrow o' + j, 'data-i': j },
        el('span', { class: 'btext no-i18n', dir: 'auto', text: o }),
        el('span', { class: 'btrack', 'aria-hidden': 'true' }, el('span', { class: 'bfill' })),
        el('b', { class: 'bnum' }));
    }));
  }
  function updateBars(root, st, i) {
    var bars = root.querySelector('.bars[data-q="' + i + '"]');
    if (!bars) return;
    var tl = tally(st, i), hidden = bars.classList.contains('hidden-res');
    var max = Math.max(1, Math.max.apply(null, tl.counts));
    EDU.$$('.barrow', bars).forEach(function (row, j) {
      var c = tl.counts[j];
      row.setAttribute('data-count', hidden ? '' : c);
      row.querySelector('.bfill').style.width = hidden ? '0' : (100 * c / max) + '%';
      var num = row.querySelector('.bnum');
      num.innerHTML = '';
      if (!hidden) { num.appendChild(document.createTextNode(fmt(c) + ' ')); num.appendChild(el('small', { dir: 'ltr', text: '(' + fmt(pct(c, tl.total)) + '%)' })); }
    });
    var vl = root.querySelector('.votes-line[data-q="' + i + '"]');
    if (vl) { vl.textContent = t('votes_line', { n: fmt(tl.total), total: fmt((st.players || []).length) }); vl.setAttribute('data-n', tl.total); }
    var av = root.querySelector('.avg[data-q="' + i + '"]');
    if (av) { var a = hidden ? '' : avgText(st, i, tl); av.textContent = a; av.hidden = !a; }
  }
  function renderQuestion(stage) {
    var st = H.st, s = st.session, i = s.current, q = s.questions[i];
    stage.appendChild(el('div', { class: 'qhead' },
      el('span', { class: 'badge primary', id: 'qNum', text: t('question_of', { n: fmt(i + 1), total: fmt(s.questions.length) }) }),
      el('span', { class: 'badge success', text: '● ' + t('voting_open') })));
    stage.appendChild(el('h2', { class: 'qtext no-i18n', id: 'qText', dir: 'auto', text: q.q }));
    if (H.hidden) stage.appendChild(el('div', { class: 'hidden-box', id: 'hiddenBox', text: '🙈 ' + t('results_hidden') }));
    stage.appendChild(barsEl(st, i, H.hidden, 'bars'));
    stage.appendChild(el('p', { class: 'avg', 'data-q': i, hidden: true }));
    stage.appendChild(el('p', { class: 'votes-line', id: 'votesLine', 'data-q': i, 'aria-live': 'polite' }));
    var join = joinBlock(H.code, true);
    stage.appendChild(el('details', { class: 'small' }, el('summary', { text: t('late_hint') }), join));
    stage.appendChild(el('div', { class: 'players-head' }, el('h2', { id: 'joinedN' }), el('button', { type: 'button', class: 'btn btn-sm', id: 'lockBtn', onclick: toggleLock })));
    stage.appendChild(el('p', { class: 'lock-note', id: 'lockNote', hidden: true, text: '🔒 ' + t('locked_note') }));
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (H && H.st) { updatePlayers(); updateBars($('#hStage'), H.st, i); } }); });
    updatePlayers();
    updateBars(stage, st, i);
  }

  /* Final results: every question with its chart (host view and past results). */
  function renderFinal(box, st, opts) {
    var s = st.session, qs = s.questions || [];
    box.appendChild(el('h2', { class: 'stage-title', text: '📊 ' + t('final_results') }));
    box.appendChild(el('p', { class: 'votes-line', id: 'finalCount', 'data-n': (st.players || []).length, text: t('participants_n', { n: fmt((st.players || []).length) }) }));
    qs.forEach(function (q, i) {
      var b = el('section', { class: 'final-block', 'data-q': i },
        el('h3', { class: 'no-i18n', dir: 'auto', text: t('col_q', { n: fmt(i + 1) }) + '. ' + q.q }),
        barsEl(st, i, false),
        el('p', { class: 'avg', 'data-q': i, hidden: true }),
        el('p', { class: 'votes-line small', 'data-q': i }));
      box.appendChild(b);
      updateBars(b, st, i);
    });
    if (!qs.length) box.appendChild(el('p', { class: 'big-msg', text: t('nobody_voted') }));
    var acts = el('div', { class: 'final-acts no-print' });
    acts.appendChild(el('button', { type: 'button', class: 'btn btn-primary', id: 'exportCsv', text: '⬇ ' + t('export_csv'), onclick: function () { exportCsv(st); } }));
    acts.appendChild(el('button', { type: 'button', class: 'btn', id: 'exportPng', text: '🖼 ' + t('download_png'), onclick: function () { exportPng(st); } }));
    if (opts.host && st.key) acts.appendChild(el('button', { type: 'button', class: 'btn', id: 'hostAgain', text: t('host_again'), onclick: function () { hostPoll(pollFromSession(st), this); } }));
    if (opts.results) {
      if (s.state !== 'ended') acts.appendChild(el('button', { type: 'button', class: 'btn', id: 'resumeSession', text: t('resume'), onclick: function () { nav('#host/' + (st.code || s.code)); } }));
      acts.appendChild(el('button', { type: 'button', class: 'btn btn-danger', id: 'delSession', text: t('delete'), onclick: function () { deleteSession(st.code || s.code); } }));
    }
    box.appendChild(acts);
  }
  function pollFromSession(st) {
    var s = st.session;
    return { title: s.title, questions: s.questions.map(function (q, i) { return { q: q.q, kind: kindAt(st, i), options: q.options.slice() }; }) };
  }
  function cell(v) { v = v === null || v === undefined ? '' : String(v); return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; }
  function exportCsv(st) {
    var s = st.session;
    if (!s) return;
    var code = st.code || s.code, qs = s.questions || [];
    var rows = [[cell(s.title), fmtDate(s.createdAt), t('code_n', { code: code }), t('participants_n', { n: (st.players || []).length })], [],
      ['#', t('col_question'), t('col_option'), t('col_count'), t('col_percent')]];
    qs.forEach(function (q, i) {
      var tl = tally(st, i);
      q.options.forEach(function (o, j) { rows.push([t('col_q', { n: i + 1 }), j ? '' : cell(q.q), cell(o), tl.counts[j], pct(tl.counts[j], tl.total)]); });
      var a = avgText(st, i, tl);
      rows.push([t('col_q', { n: i + 1 }), '', a || t('total'), tl.total, tl.total ? 100 : 0]);
    });
    rows.push([]);
    rows.push([t('col_name'), t('col_joined')].concat(qs.map(function (q, i) { return t('col_q', { n: i + 1 }); })));
    (st.players || []).forEach(function (p) {
      rows.push([cell(p.name), fmtDate(p.joinedAt)].concat(qs.map(function (q, i) {
        var a = st.answers && st.answers[i] && st.answers[i][p.id];
        return a && isInt(a.choice) ? cell(q.options[a.choice]) : '';
      })));
    });
    EDU.download('live-poll-' + code + '.csv', EDU.csv.stringify(rows), 'text/csv');
  }
  function exportPng(st) {
    var s = st.session, qs = s.questions || [];
    var W = 1200, pad = 40, rowH = 46, font = '"Noto Sans", system-ui, sans-serif';
    var H2 = 110 + qs.reduce(function (h, q) { return h + 90 + q.options.length * rowH; }, 0);
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = Math.min(H2, 16000);
    var g = cv.getContext('2d');
    var bg = EDU.css('--surface') || '#fff', tx = EDU.css('--text') || '#111', mu = EDU.css('--muted') || '#666', tr = EDU.css('--surface-2') || '#eee';
    var cols = ['#1565c0', '#c62828', '#b45309', '#2e7d32', '#6a1b9a', '#00695c'];
    g.fillStyle = bg; g.fillRect(0, 0, W, cv.height);
    g.direction = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
    g.textBaseline = 'middle';
    g.fillStyle = tx; g.font = '800 34px ' + font;
    g.fillText(String(s.title || '').slice(0, 70), pad, 50, W - 2 * pad);
    g.fillStyle = mu; g.font = '600 20px ' + font;
    g.fillText(t('participants_n', { n: fmt((st.players || []).length) }) + ' · ' + fmtDate(s.createdAt), pad, 86, W - 2 * pad);
    var y = 120;
    qs.forEach(function (q, i) {
      var tl = tally(st, i), max = Math.max(1, Math.max.apply(null, tl.counts));
      g.fillStyle = tx; g.font = '700 26px ' + font;
      g.fillText((i + 1) + '. ' + String(q.q).replace(/\s+/g, ' ').slice(0, 80), pad, y + 20, W - 2 * pad);
      var a = avgText(st, i, tl);
      g.fillStyle = mu; g.font = '600 18px ' + font;
      g.fillText(t('votes_line', { n: fmt(tl.total), total: fmt((st.players || []).length) }) + (a ? ' · ' + a : ''), pad, y + 54, W - 2 * pad);
      y += 76;
      q.options.forEach(function (o, j) {
        g.fillStyle = tx; g.font = '600 20px ' + font;
        g.fillText(String(o).slice(0, 30), pad, y + rowH / 2, 320);
        g.fillStyle = tr; g.fillRect(380, y + 10, 640, rowH - 20);
        g.fillStyle = cols[j % 6]; g.fillRect(380, y + 10, 640 * tl.counts[j] / max, rowH - 20);
        g.fillStyle = tx; g.font = '700 20px ' + font;
        g.fillText(fmt(tl.counts[j]) + ' (' + pct(tl.counts[j], tl.total) + '%)', 1035, y + rowH / 2, W - 1035 - 10);
        y += rowH;
      });
      y += 14;
    });
    EDU.downloadCanvas(cv, 'live-poll-' + (st.code || s.code) + '.png');
  }

  /* ------------------------------------------------------------------ host controls */
  function act(fn) {
    if (!H || H.busy) return Promise.resolve();
    var myH = H;
    H.busy = true;
    updateCtrl();
    return Promise.resolve().then(fn).then(function () {
      if (H === myH && H.msgFrom === 'act') { $('#hMsg').hidden = true; H.msgFrom = null; }
    }, function (e) { if (H === myH) hostErr(e, 'act'); }).then(function () {
      if (H !== myH) return;
      H.busy = false;
      updateCtrl();
      if (H.st && H.st.session) updatePlayers();
    });
  }
  function next() {
    if (!H || !H.st || !H.st.session || H.busy) return;
    var s = H.st.session, ph = phaseOf(s), n = s.questions.length;
    if (ph === 'lobby') act(function () { return C.startQuestion(H.code, 0); });
    else if (ph === 'question') {
      if (s.current + 1 < n) { var i = s.current + 1; act(function () { return C.startQuestion(H.code, i); }); }
      else act(function () { return C.endSession(H.code); });
    }
  }
  function prev() {
    if (!H || !H.st || !H.st.session || H.busy) return;
    var s = H.st.session;
    if (phaseOf(s) === 'question' && s.current > 0) { var i = s.current - 1; act(function () { return C.startQuestion(H.code, i); }); }
  }
  function toggleHide() {
    if (!H) return;
    H.hidden = !H.hidden;
    store.set(hideKey(H.code), H.hidden);
    H.screen = '';
    if (H.st && H.st.session) onHostState(H.st); else updateCtrl();
  }
  function updateCtrl() {
    var nextB = $('#nextBtn'), prevB = $('#prevBtn'), end = $('#endBtn'), hide = $('#hideBtn');
    var s = H && H.st && H.st.session, ph = s ? phaseOf(s) : 'none', busy = !!(H && H.busy);
    var label = '';
    if (ph === 'lobby') label = t('start_voting');
    else if (ph === 'question') label = s.current + 1 < s.questions.length ? t('next_q') : t('close_end');
    nextB.hidden = !label;
    nextB.textContent = label;
    nextB.disabled = busy;
    nextB.setAttribute('data-phase', ph);
    prevB.hidden = !(ph === 'question' && s.current > 0);
    prevB.disabled = busy;
    end.hidden = ph !== 'question' || s.current + 1 >= s.questions.length;
    end.disabled = busy;
    hide.hidden = ph !== 'question';
    var hid = !!(H && H.hidden);
    hide.textContent = (hid ? '👁 ' : '🙈 ') + t(hid ? 'show_results' : 'hide_results');
    hide.setAttribute('aria-pressed', hid ? 'true' : 'false');
    $('#hKeys').hidden = ph !== 'question' && ph !== 'lobby';
  }
  $('#nextBtn').addEventListener('click', next);
  $('#prevBtn').addEventListener('click', prev);
  $('#hideBtn').addEventListener('click', toggleHide);
  $('#endBtn').addEventListener('click', function () { if (window.confirm(t('confirm_end'))) act(function () { return C.endSession(H.code); }); });
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen(); });
  $('#hBack').addEventListener('click', function () { nav('#'); });

  document.addEventListener('keydown', function (e) {
    if (view !== 'host' || !H || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('.edu-modal-back')) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag || '') || (tg && tg.isContentEditable)) return;
    var k = e.key, space = k === ' ' || k === 'Spacebar', rtl = document.documentElement.dir === 'rtl';
    var fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (space || k === fwd || k === 'PageDown') {
      if (space && tg && tg.closest && tg.closest('button, a, summary, [role="button"]')) return;
      e.preventDefault(); next();
    } else if (k === back || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === 'h' || k === 'H') toggleHide();
    else if (k === 'f' || k === 'F') EDU.fullscreen();
  });

  /* ------------------------------------------------------------------ past results */
  function openResults(code) {
    show('results');
    R = { code: code, st: null, err: null };
    renderResults();
    var myR = R;
    C.sessionResults(code).then(function (st) { if (R === myR) { R.st = st; renderResults(); } },
      function (e) { if (R === myR) { R.err = e; logErr(e); renderResults(); } });
  }
  function renderResults() {
    var box = $('#v-results');
    box.innerHTML = '';
    if (!R) return;
    var card = el('div', { class: 'card stack', id: 'resultsCard' });
    box.appendChild(card);
    card.appendChild(el('div', { class: 'ed-head' }, el('h2', { class: 'mb0', text: t('results') }),
      el('button', { type: 'button', class: 'btn btn-ghost', id: 'resBack', text: t('back_dash'), onclick: function () { nav('#'); } })));
    if (R.err) { card.appendChild(errorRow(R.err, function () { openResults(R.code); })); return; }
    if (!R.st) { card.appendChild(el('p', { class: 'muted', text: t('loading') })); return; }
    var s = R.st.session;
    if (!s) { card.appendChild(el('p', { class: 'muted', text: t('session_gone') })); return; }
    card.appendChild(el('p', { class: 'muted mb0' }, el('b', { class: 'no-i18n', text: s.title }), ' · ', t('code_n', { code: R.code }), ' · ', el('span', { dir: 'ltr', text: fmtDate(s.createdAt) })));
    var inner = el('div', { class: 'stack' });
    card.appendChild(inner);
    renderFinal(inner, R.st, { results: true });
    card.appendChild(el('p', { class: 'small muted mb0', text: t('keep_note') }));
  }

  /* ================================================================== PARTICIPANT */
  /* Demo mode: every TAB is its own player (cloud-mock keeps its id in sessionStorage), so the remembered
     poll is kept per tab; online, one device = one player (EDU.store). */
  var mem = (function () {
    if (!C.isDemo) return store;
    var K = 'edu.' + SLUG + '.tab.', box = {};
    function ss() { try { return window.sessionStorage; } catch (e) { return null; } }
    return {
      get: function (k, d) {
        var raw = null;
        try { var s = ss(); raw = s ? s.getItem(K + k) : box[k]; } catch (e) { raw = box[k]; }
        if (raw === null || raw === undefined) return d;
        try { return JSON.parse(raw); } catch (e) { return d; }
      },
      set: function (k, v) { var raw = JSON.stringify(v); box[k] = raw; try { var s = ss(); if (s) s.setItem(K + k, raw); } catch (e) { } },
      remove: function (k) { delete box[k]; try { var s = ss(); if (s) s.removeItem(K + k); } catch (e) { } }
    };
  })();
  var P = { phase: 'probe', st: null, stop: null, wid: 0, timer: null, err: null, nameErr: null, pending: null, name: '', autoTried: false, leaving: false, done: '', sig: '' };

  function saved() {
    var v = mem.get('joined', null);
    if (!v || v.code !== PART_CODE || !(Date.now() - (Number(v.at) || 0) < KEEP_MS)) return null;
    return v;
  }
  function remember(name) { mem.set('joined', { code: PART_CODE, name: name, at: Date.now() }); }
  function forget() { mem.remove('joined'); }

  function pEndWatch() { P.wid++; if (P.stop) { try { P.stop(); } catch (e) { } } P.stop = null; clearTimeout(P.timer); }
  function pWatch() {
    pEndWatch();
    var id = P.wid;
    P.stop = C.playerWatch(PART_CODE, function (st) { if (id === P.wid) pState(st); }, function (e) { if (id === P.wid) { logErr(e); P.err = errMsg(e); if (P.phase === 'probe') P.phase = 'stop'; pRender(true); } });
    P.timer = setTimeout(function () { if (P.phase === 'probe') { pEndWatch(); P.phase = 'stop'; P.err = t('err_offline'); pRender(true); } }, PROBE_MS);
  }
  function startPart() {
    show('part');
    P.phase = 'probe';
    pRender(true);
    pWatch();
  }
  function pState(st) {
    P.st = st;
    clearTimeout(P.timer);
    if (P.leaving) return;
    var s = st.session;
    if (P.phase === 'probe' || P.phase === 'name') {
      if (!s) { P.phase = 'stop'; P.err = errMsg({ code: 'not-found' }); forget(); pEndWatch(); }
      else if (st.me) { P.phase = 'game'; P.name = st.me.name; remember(st.me.name); }
      else if (st.kicked) { P.phase = 'stop'; P.err = t('p_removed'); forget(); pEndWatch(); }
      else if (s.state === 'ended') { P.phase = 'stop'; P.err = t('err_session_ended'); forget(); pEndWatch(); }
      else if (saved() && !P.autoTried) { P.autoTried = true; doJoin(saved().name, true); return; }      /* reload: join again = same player */
      else if (s.locked) { P.phase = 'stop'; P.err = t('err_session_locked'); pEndWatch(); }
      else if (P.phase === 'probe') P.phase = 'name';
    }
    pRender(false);
  }
  function guestName() { return C.normalizeName(t('guest_name', { n: String(EDU.randInt(1000, 9999)) })) || ('Guest-' + EDU.randInt(1000, 9999)); }
  function doJoin(typed, isRejoin) {
    var raw = String(typed || '').trim();
    var guest = !raw;
    var name = guest ? guestName() : C.normalizeName(raw);
    if (!name) { P.nameErr = t('err_bad_name'); pRender(true); return; }
    P.phase = 'joining'; P.nameErr = null;
    pRender(true);
    var tries = 0;
    (function attempt() {
      C.joinSession(PART_CODE, name).then(function (r) {
        P.name = r.name; remember(r.name);
        if (!guest) store.set('lastName', r.name);
        P.phase = 'game';
        pRender(true);
      }, function (e) {
        if (guest && e && e.code === 'name-taken' && tries++ < 4) { name = guestName(); attempt(); return; }
        logErr(e);
        if (isRejoin) { forget(); P.phase = P.st && P.st.session && P.st.session.state !== 'ended' && !(e && e.code === 'permission-denied') ? 'name' : 'stop'; if (P.phase === 'stop') P.err = errMsg(e, 'join'); pRender(true); return; }
        P.phase = e && /^(not-found|session-ended|session-locked)$/.test(e.code) ? 'stop' : 'name';
        if (P.phase === 'stop') { P.err = errMsg(e, 'join'); pEndWatch(); } else P.nameErr = errMsg(e, 'join');
        pRender(true);
      });
    })();
  }
  function vote(i, choice) {
    var p = P.pending;
    if (p && p.i === i && p.state === 'sending') return;
    var mine = P.st && P.st.myAnswers ? P.st.myAnswers[i] : undefined;
    if (isInt(mine)) return;
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) { }
    P.pending = { i: i, choice: choice, state: 'sending' };
    pRender(true);
    C.submitAnswer(PART_CODE, i, choice).then(function () {
      if (P.pending && P.pending.i === i) P.pending.state = 'sent';
      pRender(true);
    }, function (e) {
      if (!P.pending || P.pending.i !== i) return;
      logErr(e);
      var hard = e && /^(permission-denied|session-ended|not-found|invalid-input)$/.test(e.code);
      P.pending = { i: i, choice: choice, state: hard ? 'closed' : 'failed', msg: errMsg(e, 'vote') };
      pRender(true);
    });
  }
  function leave(confirmKey, doneKey) {
    if (!window.confirm(t(confirmKey))) return;
    P.leaving = true;
    C.leaveSession(PART_CODE).then(function () {
      pEndWatch(); forget();
      P.phase = 'stop'; P.err = ''; P.done = doneKey; P.leaving = false;
      pRender(true);
    }, function (e) { P.leaving = false; report(e); pRender(true); });
  }
  function anotherLink() {
    return el('div', { class: 'pp-acts' },
      el('a', { class: 'btn btn-primary', id: 'joinAnother', href: './' + (EDU.lang !== 'en' ? '?lang=' + EDU.lang : '') + (C.isDemo && param('mock') ? (EDU.lang !== 'en' ? '&' : '?') + 'mock=1' : ''), text: t('join_another') }),
      el('a', { class: 'btn', href: '../../index.html', text: t('more_apps') }));
  }
  function card() { var c = el('div', { class: 'card stack' }); for (var i = 0; i < arguments.length; i++) if (arguments[i]) c.appendChild(arguments[i]); return c; }
  function pRender(force) {
    var box = $('#v-part');
    var st = P.st, s = st && st.session;
    /* skip a repaint when nothing the participant sees has changed (keeps focus while typing) */
    var sig = JSON.stringify([P.phase, P.err, P.nameErr, P.done, P.pending, EDU.lang, s && [s.state, s.current, s.title, s.locked], st && st.me && st.me.name, st && st.myAnswers, st && st.kicked]);
    if (!force && sig === P.sig) return;
    P.sig = sig;
    box.innerHTML = '';
    box.setAttribute('data-phase', P.phase);
    if (P.phase === 'probe') { box.appendChild(card(el('p', { class: 'muted', text: t('connecting') }))); return; }
    if (P.phase === 'stop') {
      var msg = P.done ? t(P.done) : (P.err || t('err_unknown'));
      box.appendChild(card(el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: P.done ? '👋' : '⚠️' }),
        el('h2', { id: 'pMsg', role: 'status', text: msg }), anotherLink()));
      return;
    }
    if (P.phase === 'name' || P.phase === 'joining') {
      var inp = el('input', { id: 'pName', type: 'text', maxlength: LIM.name, autocomplete: 'nickname', dir: 'auto', class: 'no-i18n', placeholder: t('name_ph') });
      inp.value = P.typed !== undefined ? P.typed : (C.isDemo ? '' : (store.get('lastName', '') || ''));
      inp.addEventListener('input', function () { P.typed = inp.value; });
      inp.readOnly = P.phase === 'joining';
      var form = el('form', { class: 'stack', id: 'pJoinForm', novalidate: true },
        el('label', { class: 'field' }, el('span', { text: t('name_label') }), inp),
        el('p', { class: 'small muted mb0', text: t('name_hint') }),
        P.nameErr ? el('p', { class: 'callout danger', id: 'pNameErr', role: 'alert', text: P.nameErr }) : null,
        el('button', { type: 'submit', class: 'btn btn-primary btn-lg', id: 'pJoin', disabled: P.phase === 'joining', text: t(P.phase === 'joining' ? 'joining' : 'join_btn') }));
      form.addEventListener('submit', function (e) { e.preventDefault(); if (P.phase === 'name') doJoin(inp.value, false); });
      box.appendChild(card(el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: '🗳️' }),
        el('h2', { text: t('p_join_title') }),
        el('p', { class: 'mb0' }, el('span', { class: 'muted', text: t('p_poll') + ': ' }), el('b', { class: 'no-i18n', dir: 'auto', text: (s && s.title) || '' }), ' · ', el('span', { dir: 'ltr', text: t('code_n', { code: PART_CODE }) })),
        form));
      if (P.phase === 'name' && force !== 'nofocus') setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) { } }, 0);
      return;
    }
    /* game */
    if (!s) { box.appendChild(card(el('h2', { id: 'pMsg', text: t('p_gone') }), anotherLink())); return; }
    if (st.kicked || (!st.me && !P.leaving && P.phase === 'game' && st.session.state !== 'ended' && P.seenMe)) {
      forget();
      box.appendChild(card(el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: '🚫' }), el('h2', { id: 'pMsg', text: t('p_removed') }), anotherLink()));
      return;
    }
    if (st.me) P.seenMe = true;
    var you = el('p', { class: 'small muted mb0' }, el('span', { text: t('p_you', { name: '' }).replace(/\s*$/, '') + ' ' }), el('b', { class: 'no-i18n', dir: 'auto', text: (st.me && st.me.name) || P.name }));
    if (s.state === 'ended') {
      box.appendChild(card(el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: '🙏' }),
        el('h2', { id: 'pEnd', text: t('p_end_title') }), el('p', { text: t('p_end_text') }), you));
      box.appendChild(card(el('h3', { text: t('remove_title') }), el('p', { class: 'small muted', text: t('remove_hint') }),
        el('div', { class: 'pp-acts' }, el('button', { type: 'button', class: 'btn btn-danger', id: 'removeMe', text: t('remove_me'), onclick: function () { leave('confirm_remove', 'removed_done'); } })),
        anotherLink()));
      return;
    }
    if (s.state === 'lobby' || !s.questions || !s.questions[s.current]) {
      box.appendChild(card(el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: '🎉' }),
        el('h2', { id: 'pLobby', text: t('p_lobby_title') }), el('p', { text: t('p_lobby_wait') }),
        el('p', { class: 'mb0' }, el('b', { class: 'no-i18n', dir: 'auto', text: s.title || '' })), you,
        el('div', { class: 'pp-acts' }, el('button', { type: 'button', class: 'linkbtn', id: 'leaveBtn', text: t('leave_btn'), onclick: function () { leave('confirm_leave', 'p_left'); } }))));
      return;
    }
    var i = s.current, q = s.questions[i];
    var mine = st.myAnswers ? st.myAnswers[i] : undefined;
    var p = P.pending && P.pending.i === i ? P.pending : null;
    var head = el('p', { class: 'small muted mb0', text: t('question_of', { n: fmt(i + 1), total: fmt(s.questions.length) }) });
    var qtext = el('p', { class: 'p-q no-i18n', dir: 'auto', text: q.q });
    if (isInt(mine) || (p && p.state === 'sent')) {
      var c = isInt(mine) ? mine : p.choice;
      box.appendChild(card(el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: '✅' }),
        el('h2', { id: 'pSent', 'data-q': i, text: t('p_sent_title') }), head, qtext,
        el('p', {}, el('span', { class: 'muted', text: t('your_vote') + ': ' }), el('b', { class: 'no-i18n', id: 'pMine', dir: 'auto', text: q.options[c] || '' })),
        el('p', { class: 'muted', text: t('p_sent_wait') }), you));
      return;
    }
    if (p && p.state === 'closed') {
      box.appendChild(card(el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: '⏳' }), el('h2', { id: 'pClosed', text: t('p_closed_title') }), el('p', { class: 'muted', text: p.msg || t('p_closed_wait') }), you));
      return;
    }
    var list = el('div', { class: 'vote-list', role: 'group', 'aria-label': t('p_pick') }, q.options.map(function (o, j) {
      return el('button', { type: 'button', class: 'vote-btn o' + j + (p && p.choice === j ? ' picked' : ''), 'data-i': j, disabled: !!(p && p.state === 'sending'), onclick: function () { vote(i, j); } },
        el('span', { class: 'odot', 'aria-hidden': 'true' }), el('span', { class: 'vt no-i18n', dir: 'auto', text: o }));
    }));
    var extra = null;
    if (p && p.state === 'sending') extra = el('p', { class: 'muted', role: 'status', text: t('p_sending') });
    if (p && p.state === 'failed') extra = el('div', { class: 'callout danger', role: 'alert' }, el('b', { text: t('lost_title') }), el('p', { class: 'mb0', text: p.msg }),
      el('button', { type: 'button', class: 'btn btn-sm', id: 'sendAgain', text: t('send_again'), onclick: function () { var c2 = p.choice; P.pending = null; vote(i, c2); } }));
    box.appendChild(card(head, qtext, el('p', { class: 'small muted mb0', text: t('p_pick') }), list, extra, you));
  }

  /* ------------------------------------------------------------------ language + start */
  EDU.onLang(function () {
    legalLinks();
    if (view === 'part') { pRender('nofocus'); return; }
    if (view === 'signin') renderSignin();
    else if (view === 'dash') renderDash();
    else if (view === 'edit' && E && E.poll) renderEditor();
    else if (view === 'host' && H) { $('#hCode').textContent = t('code_n', { code: H.code }); if (H.st) { H.screen = ''; onHostState(H.st); } else updateCtrl(); }
    else if (view === 'results') renderResults();
  });

  legalLinks();
  updateOnline();
  if (PART_CODE) {
    startPart();
  } else {
    show('loading');
    if (!C.isDemo) {
      C.ready().then(function () {
        cloudReady = true;
        var re = C.redirectError && C.redirectError();
        if (re) signinErr = re;
      }, function (e) { readyErr = e; signinErr = e; logErr(e); }).then(function () { if (view === 'signin') renderSignin(); });
    }
    C.onTeacher(function (h) {
      var prev = host, first = !hostKnown;
      host = h || null;
      hostKnown = true;
      if (!first && prev && host && prev.uid === host.uid) { if (view === 'dash') renderDash(); return; }
      polls = sessions = null;
      if (host && wantSample) { wantSample = false; route(); hostPoll(samplePoll(), null); return; }
      route();
    });
  }
})();
