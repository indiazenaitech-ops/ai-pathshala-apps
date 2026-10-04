/* Live Class Quiz (teacher app).
 * Sign in (Google, or "Demo Teacher" in Demo mode), keep quizzes in the cloud, host a live quiz on the
 * projector while students answer on phones (apps/quiz-join) with a 6-digit code and a nickname,
 * then show the leaderboard, a podium and export the results as CSV.
 * It talks to the cloud ONLY through window.EDUCloud (shared/cloud.js, see firebase/API.md).
 * In Demo mode nothing leaves this browser: open the student page in another tab to try it.
 * Views (hash routing): #  dashboard · #new · #sample · #edit/<quizId> · #host/<code> · #results/<code> */
(function () {
  'use strict';
  var SLUG = 'live-quiz';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$;
  var C = window.EDUCloud;
  var SHAPES = ['▲', '◆', '●', '■', '★', '⬟'];
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  var TIMES = [10, 20, 30, 60];
  var LIM = Object.assign({ title: 150, questions: 200, question: 1000, option: 300, explain: 600, minOptions: 2, maxOptions: 6, minTime: 5, maxTime: 600, defaultTime: 20 }, (C && C.LIMITS) || {});
  var JOIN_TEXT = 'apnipathshala.ai/join';
  var QR_SRC = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
  var RING_C = 2 * Math.PI * 52;
  var IN_APP = /\b(FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Snapchat|Line\/)|; wv\)/i.test(navigator.userAgent || '');
  var G_ICON = '<svg class="gicon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

  var main = EDU.init({ slug: SLUG, title: 'app_title' });

  /* ------------------------------------------------------------------ state */
  var settings = Object.assign({ time: 20, shuffleQ: false, shuffleO: false }, store.get('settings', null) || {});
  if (TIMES.indexOf(settings.time) < 0) settings.time = 20;
  function saveSettings() { store.set('settings', settings); }

  var VIEWS = ['loading', 'signin', 'dash', 'edit', 'host', 'results'];
  var view = 'loading';
  var teacher = null, teacherKnown = false;
  var cloudReady = !!C.isDemo, readyErr = null, signinErr = null;
  var quizzes = null, quizzesErr = null, sessions = null, sessionsErr = null;
  var H = null;            // live host session
  var E = null;            // quiz editor
  var R = null;            // results of a past session
  var hosting = false;     // a createSession call is running

  /* ------------------------------------------------------------------ helpers */
  function str(v, max) { return String(v === null || v === undefined ? '' : v).replace(/\r\n?/g, '\n').trim().slice(0, max || 1000); }
  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
  function clampInt(v, lo, hi) { v = Math.round(Number(v)); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo; }
  function fmtDate(ms) {
    if (typeof ms !== 'number' || !isFinite(ms)) return '';
    try {
      return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', numberingSystem: 'latn' }).format(new Date(ms));
    } catch (e) { return new Date(ms).toISOString().slice(0, 16).replace('T', ' '); }
  }
  function safeName(s) { return String(s || '').replace(/[\\/:*?"<>|#%\n\r\t]+/g, ' ').trim().slice(0, 60) || 'quiz'; }
  function teacherName(tch) { return tch ? (tch.demo ? t('demo_teacher') : (tch.name || tch.email || '')) : ''; }
  function initial(s) { var a = Array.from(String(s || '').trim()); return a.length ? a[0].toUpperCase() : '?'; }
  function nav(hash) {
    var cur = location.hash || '#';
    if (cur === hash) route(); else location.hash = hash;
  }
  function iconBtn(text, label, disabled, onclick, extra) {
    var b = el('button', { type: 'button', class: 'edu-iconbtn', 'aria-label': label, title: label, text: text, disabled: !!disabled, onclick: onclick });
    if (extra) Object.keys(extra).forEach(function (k) { b.setAttribute(k, extra[k]); });
    return b;
  }

  /* Error → translated message (nothing for a sign-in window the user closed). */
  function errMsg(err) {
    if (!err || err.cancelled) return '';
    var key = 'err_' + String((err && err.code) || 'unknown').replace(/-/g, '_');
    return t(EDU.has(key) ? key : 'err_unknown');
  }
  function logErr(err) { try { console.warn('[live-quiz]', err && err.code, err && err.message); } catch (e) { } }
  function report(err) { var m = errMsg(err); if (m) EDU.toast(m, 6000); logErr(err); }
  /* "Use Demo mode instead" link for errors that Demo mode can get around (only shown in online mode). */
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

  function show(name) {
    view = name;
    VIEWS.forEach(function (v) { var n = $('#v-' + v); if (n) n.hidden = v !== name; });
    var isHost = name === 'host';
    $('#intro').hidden = isHost;
    $('#howto').hidden = isHost || name === 'edit';
    $('#demoBanner').hidden = !C.isDemo || isHost;
    main.classList.toggle('edu-wide', isHost);
    document.body.classList.toggle('edu-wide-page', isHost);
  }

  function legalLinks() {
    EDU.$$('a.lnk-privacy').forEach(function (a) { a.href = '../../legal/privacy.html?lang=' + EDU.lang; });
    EDU.$$('a.lnk-terms').forEach(function (a) { a.href = '../../legal/terms.html?lang=' + EDU.lang; });
  }

  function updateOnline() { $('#offlineBanner').hidden = !!C.isDemo || navigator.onLine !== false; }
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);

  /* ------------------------------------------------------------------ sample quiz (content.js) */
  function sampleQuiz() {
    var all = window.APP_CONTENT || {};
    var c = all[EDU.lang] || all.en;
    return {
      title: c.title, lang: EDU.lang,
      questions: c.questions.map(function (q) {
        var o = { q: q.q, options: q.options.slice(), correct: q.correct, explain: q.explain || '' };
        if (q.time) o.time = q.time;
        return o;
      })
    };
  }

  /* ------------------------------------------------------------------ routing */
  function route() {
    closeHost();
    E = null; R = null;
    if (!teacherKnown) { show('loading'); return; }
    if (!teacher) { renderSignin(); show('signin'); return; }
    var p = (location.hash || '').replace(/^#\/?/, '').split('/');
    var code = C.normalizeCode(p[1] || '');
    if (p[0] === 'host' && code) return openHost(code);
    if (p[0] === 'results' && code) return openResults(code);
    if (p[0] === 'new' || p[0] === 'sample') return openEditor(p[0]);
    if (p[0] === 'edit' && /^[A-Za-z0-9_-]{1,64}$/.test(p[1] || '')) return openEditor(p[1]);
    openDash();
  }
  window.addEventListener('hashchange', route);

  /* ------------------------------------------------------------------ sign in */
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
      if (!cloudReady && !readyErr) {
        btn.disabled = true;
        btn.appendChild(el('span', { text: t('loading') }));
      } else {
        btn.disabled = false;
        btn.insertAdjacentHTML('beforeend', G_ICON);
        btn.appendChild(el('span', { text: t('signin_google') }));
      }
    }
    $('#inappHint').hidden = C.isDemo || !IN_APP;
    var box = $('#signinErr');
    var m = errMsg(signinErr);
    box.innerHTML = '';
    if (m) { box.appendChild(el('span', { text: m })); var a = demoLink(signinErr); if (a) { box.appendChild(document.createTextNode(' ')); box.appendChild(a); } }
    box.hidden = !m;
  }
  $('#signIn').addEventListener('click', function () {
    var btn = this;
    if (btn.disabled) return;
    signinErr = null;
    renderSignin();
    btn.disabled = true;
    /* called straight from the click so the Google popup is allowed */
    C.signInTeacher().then(function () { }, function (e) { signinErr = e; logErr(e); }).then(function () {
      if (view === 'signin') renderSignin();
    });
  });

  /* ------------------------------------------------------------------ dashboard */
  function openDash() {
    show('dash');
    renderDash();
    loadQuizzes();
    loadSessions();
  }
  function renderDash() { renderAccount(); renderSettings(); renderQuizzes(); renderSessions(); }

  function renderAccount() {
    if (!teacher) return;
    var name = teacherName(teacher);
    $('#hello').textContent = t('hello', { name: name });
    $('#avatar').textContent = $('#avatar2').textContent = initial(name);
    var nm = $('#accName');
    nm.textContent = name;
    nm.classList.toggle('no-i18n', !teacher.demo);
    $('#accEmail').textContent = teacher.email || '';
    $('#dataNote').textContent = t(C.isDemo ? 'data_demo' : 'data_cloud');
  }

  function renderSettings() {
    var seg = $('#timeSeg');
    seg.innerHTML = '';
    seg.setAttribute('aria-label', t('time_per_q'));
    TIMES.forEach(function (s) {
      seg.appendChild(el('button', {
        type: 'button', 'aria-pressed': settings.time === s ? 'true' : 'false', 'data-time': s,
        text: t('sec', { n: EDU.fmt(s) }),
        onclick: function () { settings.time = s; saveSettings(); renderSettings(); }
      }));
    });
    $('#shufQ').checked = !!settings.shuffleQ;
    $('#shufO').checked = !!settings.shuffleO;
  }
  $('#shufQ').addEventListener('change', function () { settings.shuffleQ = this.checked; saveSettings(); });
  $('#shufO').addEventListener('change', function () { settings.shuffleO = this.checked; saveSettings(); });

  function loadQuizzes() {
    quizzesErr = null;
    return C.listQuizzes().then(function (list) { quizzes = list; }, function (e) { quizzesErr = e; logErr(e); })
      .then(function () { if (view === 'dash') renderQuizzes(); });
  }
  function loadSessions() {
    sessionsErr = null;
    return C.listSessions().then(function (list) { sessions = list; }, function (e) { sessionsErr = e; logErr(e); })
      .then(function () { if (view === 'dash') renderSessions(); });
  }

  function renderQuizzes() {
    var box = $('#quizList');
    box.innerHTML = '';
    var s = sampleQuiz();
    box.appendChild(el('div', { class: 'qrow sample', id: 'sampleRow' },
      el('div', { class: 'qinfo' },
        el('div', { class: 'qname' }, el('span', { class: 'badge accent', text: t('sample_badge') }), ' ', el('span', { text: s.title })),
        el('div', { class: 'small muted qmeta', text: t('n_questions', { n: EDU.fmt(s.questions.length) }) })),
      el('div', { class: 'acts' },
        el('button', { type: 'button', class: 'btn btn-primary', id: 'hostSample', onclick: function () { hostQuiz(sampleQuiz(), this); } },
          el('span', { 'aria-hidden': 'true', text: '▶' }), el('span', { text: t('host') })),
        el('button', { type: 'button', class: 'btn', id: 'copySample', text: t('edit_copy'), onclick: function () { nav('#sample'); } }))));
    if (quizzesErr) { box.appendChild(errorRow(quizzesErr, loadQuizzes)); return; }
    if (quizzes === null) { box.appendChild(el('p', { class: 'muted', text: t('loading') })); return; }
    if (!quizzes.length) { box.appendChild(el('p', { class: 'muted mb0', id: 'noQuizzes', text: t('no_quizzes') })); return; }
    quizzes.forEach(function (q) {
      box.appendChild(el('div', { class: 'qrow cloud-quiz', 'data-id': q.id },
        el('div', { class: 'qinfo' },
          el('div', { class: 'qname no-i18n', text: q.title }),
          el('div', { class: 'small muted qmeta' }, t('n_questions', { n: EDU.fmt(q.count) }), q.updatedAt ? ' · ' : '', q.updatedAt ? el('span', { dir: 'ltr', text: fmtDate(q.updatedAt) }) : null)),
        el('div', { class: 'acts' },
          el('button', { type: 'button', class: 'btn btn-primary btn-sm', 'data-act': 'host', onclick: function () { hostCloudQuiz(q.id, this); } },
            el('span', { 'aria-hidden': 'true', text: '▶' }), el('span', { text: t('host') })),
          el('button', { type: 'button', class: 'btn btn-sm', 'data-act': 'edit', text: t('edit'), onclick: function () { nav('#edit/' + q.id); } }),
          el('button', { type: 'button', class: 'btn btn-sm', 'data-act': 'download', text: t('download'), onclick: function () { downloadQuiz(q.id); } }),
          el('button', { type: 'button', class: 'btn btn-sm btn-danger', 'data-act': 'delete', text: t('delete'), onclick: function () { deleteQuiz(q); } }))));
    });
  }

  function stateLabel(st) { return st === 'ended' ? t('state_ended') : st === 'lobby' ? t('state_lobby') : t('state_live'); }
  function renderSessions() {
    var box = $('#sessList');
    box.innerHTML = '';
    if (sessionsErr) { box.appendChild(errorRow(sessionsErr, loadSessions)); return; }
    if (sessions === null) { box.appendChild(el('p', { class: 'muted', text: t('loading') })); return; }
    if (!sessions.length) { box.appendChild(el('p', { class: 'muted mb0', id: 'noSessions', text: t('no_sessions') })); return; }
    sessions.forEach(function (s) {
      var ended = s.state === 'ended';
      box.appendChild(el('div', { class: 'qrow srow', 'data-code': s.code, 'data-state': s.state },
        el('div', { class: 'qinfo' },
          el('div', { class: 'qname' }, el('span', { class: 'no-i18n', text: s.title }), ' ', el('span', { class: 'badge' + (ended ? '' : ' success'), text: stateLabel(s.state) })),
          el('div', { class: 'small muted qmeta' }, el('span', { dir: 'ltr', text: fmtDate(s.createdAt) }), ' · ', t('code_n', { code: s.code }), ' · ', t('players_n', { n: EDU.fmt(s.players || 0) }))),
        el('div', { class: 'acts' },
          ended ? null : el('button', { type: 'button', class: 'btn btn-sm btn-primary', 'data-act': 'resume', text: t('resume'), onclick: function () { nav('#host/' + s.code); } }),
          el('button', { type: 'button', class: 'btn btn-sm', 'data-act': 'results', text: t('results'), onclick: function () { nav('#results/' + s.code); } }),
          el('button', { type: 'button', class: 'btn btn-sm btn-danger', 'data-act': 'delete', text: t('delete'), onclick: function () { deleteSession(s.code); } }))));
    });
  }

  function hostQuiz(quiz, btn) {
    if (hosting) return Promise.resolve();
    hosting = true;
    if (btn) btn.disabled = true;
    return C.createSession(quiz, { timePerQ: settings.time, shuffle: !!settings.shuffleQ, shuffleOptions: !!settings.shuffleO })
      .then(function (r) { nav('#host/' + r.code); }, report)
      .then(function () { hosting = false; if (btn) btn.disabled = false; });
  }
  function hostCloudQuiz(id, btn) {
    if (hosting) return;
    btn.disabled = true;
    C.getQuiz(id).then(function (q) {
      btn.disabled = false;
      return hostQuiz({ id: id, title: q.title, lang: q.lang, questions: q.questions }, btn);
    }, function (e) { btn.disabled = false; report(e); });
  }

  /* Quiz Maker's export format, so a downloaded quiz opens in Quiz Maker too (time is extra). */
  function toQuizMaker(q) {
    return {
      app: 'quiz-maker', version: 1,
      quiz: {
        title: q.title, questions: q.questions.map(function (x) {
          var o = { type: 'mcq', text: x.q, options: x.options, answer: x.correct, explain: x.explain || '' };
          if (x.time) o.time = x.time;
          return o;
        })
      }
    };
  }
  function downloadQuiz(id) {
    C.getQuiz(id).then(function (q) {
      EDU.download(safeName(q.title) + '.json', JSON.stringify(toQuizMaker(q), null, 2), 'application/json');
    }, report);
  }
  function deleteQuiz(q) {
    if (!window.confirm(t('confirm_delete_quiz', { title: q.title }))) return;
    C.deleteQuiz(q.id).then(function () { EDU.toast(t('deleted')); return loadQuizzes(); }, report);
  }
  function deleteSession(code) {
    if (!window.confirm(t('confirm_delete_session'))) return;
    C.deleteSession(code).then(function () {
      EDU.toast(t('deleted'));
      if (view === 'dash') loadSessions(); else nav('#');
    }, report);
  }

  /* ------------------------------------------------------------------ account */
  $('#signOut').addEventListener('click', function () { C.signOut().catch(report); });
  $('#deleteAccount').addEventListener('click', function () {
    var chk = el('input', { type: 'checkbox', id: 'delChk' });
    var go = el('button', { type: 'button', class: 'btn btn-danger', id: 'delGo', disabled: true, text: t('delete_forever') });
    var close;
    chk.addEventListener('change', function () { go.disabled = !chk.checked; });
    go.addEventListener('click', function () {
      if (!chk.checked) return;
      go.disabled = true;
      /* straight from the click: Firebase may open a re-login popup first */
      C.deleteTeacherAccount().then(function () {
        store.remove('draft');
        quizzes = sessions = null;
        close();
        EDU.toast(t('account_deleted'), 6000);
        nav('#');
      }, function (e) { go.disabled = !chk.checked; report(e); });
    });
    var body = el('div', { class: 'stack' },
      el('p', { class: 'callout danger', text: t('delete_account_text') }),
      el('p', { class: 'small muted', text: t('delete_account_tip') }),
      el('label', { class: 'check', for: 'delChk' }, chk, el('span', { text: t('delete_account_check') })),
      el('div', { class: 'row' }, go, el('button', { type: 'button', class: 'btn', text: t('cancel'), onclick: function () { close(); } })));
    close = EDU.modal(body, { title: t('delete_account') });
  });

  /* ------------------------------------------------------------------ import */
  /* One question from Quiz Maker ({type, text, options, answer, explain}) or from this app ({q, options,
     correct, explain, time}) → clean question, or null. True/false gets two translated options. */
  function normQ(src) {
    if (!src || typeof src !== 'object') return null;
    var text = str(src.q !== undefined && src.q !== null ? src.q : src.text, LIM.question);
    if (!text) return null;
    var ans = parseInt(src.correct !== undefined && src.correct !== null ? src.correct : src.answer, 10);
    var raw = Array.isArray(src.options) ? src.options : [];
    var opts = [], corr = -1;
    if (src.type === 'tf' && raw.filter(function (o) { return str(o); }).length < 2) {
      opts = [t('opt_true'), t('opt_false')];
      corr = ans === 1 ? 1 : 0;
    } else {
      raw.forEach(function (o, j) {
        var s = str(o, LIM.option);
        if (!s || opts.length >= LIM.maxOptions) return;
        if (j === ans) corr = opts.length;
        opts.push(s);
      });
    }
    if (opts.length < LIM.minOptions || corr < 0) return null;
    var out = { q: text, options: opts, correct: corr };
    var ex = str(src.explain, LIM.explain);
    if (ex) out.explain = ex;
    var tm = parseInt(src.time, 10);
    if (tm > 0) out.time = clampInt(tm, LIM.minTime, LIM.maxTime);
    return out;
  }
  function toQuiz(raw, fallbackTitle) {
    raw = raw || {};
    var qs = [], skipped = 0;
    (Array.isArray(raw.questions) ? raw.questions : []).forEach(function (x) {
      var q = normQ(x);
      if (q && qs.length < LIM.questions) qs.push(q); else skipped++;
    });
    var title = str(raw.title, LIM.title).replace(/\s+/g, ' ') || str(fallbackTitle, LIM.title) || t('untitled');
    var lang = typeof raw.sample === 'string' ? raw.sample : raw.lang;
    if (!/^[a-z]{2}$/.test(String(lang || ''))) lang = EDU.lang;
    return { quiz: qs.length ? { title: title, lang: lang, questions: qs } : null, skipped: skipped };
  }

  function ansIndex(v) {
    v = String(v === null || v === undefined ? '' : v).trim().toUpperCase().replace(/^OPTION\s*/, '').replace(/[().]/g, '');
    if (/^[1-6]$/.test(v)) return +v - 1;
    return v.length === 1 ? LETTERS.indexOf(v) : -1;
  }
  /* Quiz Maker CSV: question, option1..option6, correct (1-6 or A-F), explanation [, time]. Header optional. */
  function parseCsv(text, title) {
    var rows = EDU.csv.parse(text);
    if (!rows.length) return null;
    var head = rows[0].map(function (c) { return String(c).trim().toLowerCase(); });
    var cCol = -1, eCol = -1, tCol = -1;
    head.forEach(function (h, i) {
      if (cCol < 0 && i > 0 && /^(correct|answer|ans\b|key\b|सही|उत्तर)/.test(h)) cCol = i;
      if (eCol < 0 && /^(expl|reason|व्याख्या)/.test(h)) eCol = i;
      if (tCol < 0 && i > 0 && /^(time|sec|seconds|समय)/.test(h)) tCol = i;
    });
    if (cCol > 0 || /^(question|q\b|प्रश्न|सवाल)/.test(head[0] || '')) rows = rows.slice(1);
    var qs = [], skipped = 0;
    rows.forEach(function (r) {
      r = r.map(function (c) { return String(c === null || c === undefined ? '' : c); });
      var c = cCol, e = eCol;
      if (c < 0) {
        var cells = r.slice();
        while (cells.length && !cells[cells.length - 1].trim()) cells.pop();
        var n = cells.length;
        if (n >= 4 && ansIndex(cells[n - 1]) >= 0) { c = n - 1; e = -1; }
        else if (n >= 5 && ansIndex(cells[n - 2]) >= 0) { c = n - 2; e = n - 1; }
      } else if (e < 0 && tCol !== c + 1) e = c + 1;
      if (c < 3 || !(r[0] || '').trim()) { if (r.some(function (x) { return x.trim(); })) skipped++; return; }
      var q = normQ({ q: r[0], options: r.slice(1, c), correct: ansIndex(r[c]), explain: e >= 0 && e < r.length ? r[e] : '', time: tCol >= 0 ? r[tCol] : '' });
      if (q && qs.length < LIM.questions) qs.push(q); else skipped++;
    });
    return { quizzes: qs.length ? [{ title: str(title, LIM.title) || t('untitled'), lang: EDU.lang, questions: qs }] : [], skipped: skipped };
  }
  function parseImport(text, filename) {
    var title = String(filename || '').replace(/\.[^.]*$/, '').replace(/_+/g, ' ').trim();
    text = String(text || '').replace(/^﻿/, '').trim();
    if (!text) return null;
    if (text.charAt(0) === '{' || text.charAt(0) === '[') {
      var data;
      try { data = JSON.parse(text); } catch (e) { return null; }
      var raws = [];
      if (Array.isArray(data)) raws = data.length && data[0] && Array.isArray(data[0].questions) ? data : [{ title: title, questions: data }];
      else if (data && Array.isArray(data.quizzes)) raws = data.quizzes;
      else if (data && data.quiz && typeof data.quiz === 'object') raws = [data.quiz];
      else if (data && Array.isArray(data.questions)) raws = [data];
      var out = { quizzes: [], skipped: 0 };
      raws.forEach(function (r) { var x = toQuiz(r, title); out.skipped += x.skipped; if (x.quiz) out.quizzes.push(x.quiz); });
      return out;
    }
    return parseCsv(text, title);
  }

  function saveMany(list, skipped) {
    var n = 0;
    return list.reduce(function (p, q) {
      return p.then(function () { return C.saveQuiz(q).then(function () { n++; }); });
    }, Promise.resolve()).then(function () { }, report).then(function () {
      if (n) EDU.toast(t('imported_n', { n: EDU.fmt(n) }) + (skipped ? ' ' + t('skipped_n', { n: EDU.fmt(skipped) }) : ''), 5000);
      return loadQuizzes();
    });
  }

  /* Quizzes that Quiz Maker saved on this device (read-only: EDU.store('quiz-maker').quizzes). */
  function quizMakerQuizzes() {
    var list = EDU.store('quiz-maker').get('quizzes', null);
    return Array.isArray(list) ? list.filter(function (q) { return q && Array.isArray(q.questions) && q.questions.length; }) : [];
  }
  $('#importQm').addEventListener('click', function () {
    var list = quizMakerQuizzes();
    var body = el('div', { class: 'stack', id: 'qmBox' });
    var close;
    if (!list.length) {
      body.appendChild(el('p', { id: 'qmNone', text: t('qm_none') }));
      body.appendChild(el('div', {}, el('a', { class: 'btn', href: '../quiz-maker/index.html?lang=' + EDU.lang, text: t('open_qm') })));
    } else {
      var boxes = list.map(function (q, k) {
        var cb = el('input', { type: 'checkbox', id: 'qmi' + k, checked: true });
        body.appendChild(el('label', { class: 'check qm-item', for: 'qmi' + k }, cb,
          el('span', {}, el('span', { class: 'no-i18n', text: str(q.title) || t('untitled') }), ' ',
            el('span', { class: 'muted small', text: '(' + t('n_questions', { n: EDU.fmt(q.questions.length) }) + ')' }))));
        return cb;
      });
      var go = el('button', { type: 'button', class: 'btn btn-primary', id: 'qmGo', text: t('import_selected') });
      go.addEventListener('click', function () {
        var picked = [], skipped = 0;
        list.forEach(function (q, k) {
          if (!boxes[k].checked) return;
          var r = toQuiz(q, '');
          skipped += r.skipped;
          if (r.quiz) picked.push(r.quiz);
        });
        if (!picked.length) { EDU.toast(t('import_failed'), 5000); return; }
        go.disabled = true;
        saveMany(picked, skipped).then(function () { close(); });
      });
      body.appendChild(el('div', { class: 'row' }, go));
    }
    close = EDU.modal(body, { title: t('qm_title') });
  });
  $('#importFile').addEventListener('click', function () {
    EDU.pickFile('.json,.csv,.txt,application/json,text/csv').then(function (file) {
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) throw new Error('too big');
      return EDU.readText(file).then(function (txt) {
        var res = parseImport(txt, file.name);
        if (!res || !res.quizzes.length) { EDU.toast(t('import_failed'), 6000); return; }
        return saveMany(res.quizzes, res.skipped);
      });
    }).catch(function () { EDU.toast(t('import_failed'), 6000); });
  });
  $('#newQuiz').addEventListener('click', function () { nav('#new'); });

  /* ------------------------------------------------------------------ quiz editor */
  function blankQ() { return { q: '', options: ['', '', '', ''], correct: -1, explain: '', time: '' }; }
  function editable(q) {
    return {
      title: q.title || '', lang: q.lang || EDU.lang,
      questions: (q.questions || []).map(function (x) {
        return { q: x.q || '', options: (x.options || []).slice(), correct: isInt(x.correct) ? x.correct : -1, explain: x.explain || '', time: x.time ? String(x.time) : '' };
      })
    };
  }
  function draftKey(key) { return (teacher ? teacher.uid : '') + ':' + key; }
  function saveDraft() { if (E && E.quiz) store.set('draft', { key: draftKey(E.key), quiz: E.quiz, at: Date.now() }); }
  function touched() {
    if (!E) return;
    E.dirty = true;
    clearTimeout(E.saveT);
    E.saveT = setTimeout(saveDraft, 300);
    var m = $('#edMsg');
    if (m) m.textContent = '';
  }

  function openEditor(key) {
    show('edit');
    E = { key: key, id: key === 'new' || key === 'sample' ? null : key, quiz: null, dirty: false };
    var d = store.get('draft', null);
    if (d && d.key === draftKey(key) && d.quiz && Array.isArray(d.quiz.questions) && d.quiz.questions.length) {
      E.quiz = d.quiz;
      E.dirty = true;
      renderEditor();
      EDU.toast(t('draft_restored'), 4000);
      return;
    }
    if (key === 'new') E.quiz = { title: '', lang: EDU.lang, questions: [blankQ()] };
    else if (key === 'sample') E.quiz = editable(sampleQuiz());
    renderEditor();
    if (E.quiz) return;
    var myE = E;
    C.getQuiz(key).then(function (q) {
      if (E !== myE) return;
      E.quiz = editable(q);
      renderEditor();
    }, function (e) { report(e); if (E === myE) nav('#'); });
  }

  function renderEditor() {
    var box = $('#v-edit');
    box.innerHTML = '';
    if (!E) return;
    var card = el('div', { class: 'card stack editor' });
    box.appendChild(card);
    card.appendChild(el('div', { class: 'ed-head' },
      el('h2', { class: 'mb0', text: t(E.id ? 'edit_quiz' : 'new_quiz') }),
      el('button', { type: 'button', class: 'btn btn-ghost', id: 'edBack', text: t('back_dash'), onclick: cancelEdit })));
    if (!E.quiz) { card.appendChild(el('p', { class: 'muted', text: t('loading') })); return; }
    var qz = E.quiz;
    var title = el('input', { type: 'text', id: 'qzTitle', maxlength: LIM.title });
    title.value = qz.title;
    title.addEventListener('input', function () { qz.title = title.value; touched(); });
    card.appendChild(el('label', { class: 'field', for: 'qzTitle' }, el('b', { text: t('quiz_title') }), title));
    var list = el('div', { class: 'stack', id: 'qCards' });
    qz.questions.forEach(function (q, i) { list.appendChild(qCard(q, i)); });
    card.appendChild(list);
    if (qz.questions.length < LIM.questions) {
      card.appendChild(el('div', {}, el('button', { type: 'button', class: 'btn', id: 'addQ', onclick: addQuestion },
        el('span', { 'aria-hidden': 'true', text: '+' }), el('span', { text: t('add_question') }))));
    }
    card.appendChild(el('div', { class: 'ed-actions' },
      el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'saveQuiz', text: t('save_quiz'), onclick: saveEdit }),
      el('button', { type: 'button', class: 'btn', id: 'cancelEdit', text: t('cancel'), onclick: cancelEdit }),
      el('p', { class: 'ed-msg', id: 'edMsg', role: 'alert', 'aria-live': 'assertive' })));
  }

  function qCard(q, i) {
    var N = E.quiz.questions.length, n = i + 1;
    var card = el('section', { class: 'qcard', 'data-qi': i });
    card.appendChild(el('div', { class: 'qcard-head' },
      el('h3', { text: t('question_n', { n: EDU.fmt(n) }) }),
      el('div', { class: 'row' },
        iconBtn('↑', t('move_up', { n: n }), i === 0, function () { moveQ(i, -1); }, { 'data-act': 'up' }),
        iconBtn('↓', t('move_down', { n: n }), i === N - 1, function () { moveQ(i, 1); }, { 'data-act': 'down' }),
        iconBtn('🗑', t('delete_question', { n: n }), N === 1, function () { deleteQ(i); }, { 'data-act': 'del' }))));
    var ta = el('textarea', { id: 'qq' + i, rows: 2, maxlength: LIM.question, 'aria-label': t('question_n', { n: n }) });
    ta.value = q.q;
    ta.addEventListener('input', function () { q.q = ta.value; touched(); });
    card.appendChild(ta);
    card.appendChild(el('p', { class: 'small muted mb0', text: t('tick_correct') }));
    var opts = el('div', { class: 'opts' });
    q.options.forEach(function (o, j) {
      var label = t('mark_correct', { n: LETTERS[j] });
      var radio = el('input', { type: 'radio', name: 'cor' + i, id: 'qc' + i + '_' + j, 'aria-label': label, title: label });
      radio.checked = q.correct === j;
      radio.addEventListener('change', function () {
        q.correct = j; touched();
        EDU.$$('.orow', opts).forEach(function (r, k) { r.classList.toggle('is-correct', k === j); });
      });
      var inp = el('input', { type: 'text', id: 'qo' + i + '_' + j, maxlength: LIM.option, placeholder: t('option_n', { n: LETTERS[j] }), 'aria-label': t('option_n', { n: LETTERS[j] }) });
      inp.value = o;
      inp.addEventListener('input', function () { q.options[j] = inp.value; touched(); });
      opts.appendChild(el('div', { class: 'orow t' + j + (q.correct === j ? ' is-correct' : '') },
        el('span', { class: 'oshape', 'aria-hidden': 'true', text: SHAPES[j] }), radio, inp,
        q.options.length > LIM.minOptions ? iconBtn('✕', t('remove_option', { n: LETTERS[j] }), false, function () { removeOption(i, j); }) : null));
    });
    card.appendChild(opts);
    if (q.options.length < LIM.maxOptions) {
      card.appendChild(el('div', {}, el('button', { type: 'button', class: 'btn btn-sm', id: 'addOpt' + i, onclick: function () {
        q.options.push(''); touched(); renderEditor(); focusEl('#qo' + i + '_' + (q.options.length - 1));
      } }, el('span', { 'aria-hidden': 'true', text: '+' }), el('span', { text: t('add_option') }))));
    }
    var ex = el('textarea', { id: 'qe' + i, rows: 2, maxlength: LIM.explain });
    ex.value = q.explain || '';
    ex.addEventListener('input', function () { q.explain = ex.value; touched(); });
    var tm = el('input', { type: 'number', id: 'qt' + i, min: LIM.minTime, max: LIM.maxTime, step: 1, inputmode: 'numeric', placeholder: t('time_ph') + ': ' + t('sec', { n: EDU.fmt(settings.time) }) });
    tm.value = q.time || '';
    tm.addEventListener('input', function () { q.time = tm.value; touched(); });
    card.appendChild(el('div', { class: 'ed-extra' },
      el('label', { class: 'field', for: 'qe' + i }, el('span', { text: t('explain_label') }), ex),
      el('label', { class: 'field', for: 'qt' + i }, el('span', { text: t('time_label') }), tm)));
    return card;
  }
  function focusEl(sel) { var n = $(sel); if (n) { n.focus(); if (n.scrollIntoView) n.scrollIntoView({ block: 'center' }); } }
  function addQuestion() {
    E.quiz.questions.push(blankQ());
    touched(); renderEditor();
    focusEl('#qq' + (E.quiz.questions.length - 1));
  }
  function moveQ(i, d) {
    var qs = E.quiz.questions, j = i + d;
    if (j < 0 || j >= qs.length) return;
    var x = qs[i]; qs[i] = qs[j]; qs[j] = x;
    touched(); renderEditor();
  }
  function deleteQ(i) {
    if (E.quiz.questions.length < 2) return;
    E.quiz.questions.splice(i, 1);
    touched(); renderEditor();
  }
  function removeOption(i, j) {
    var q = E.quiz.questions[i];
    if (q.options.length <= LIM.minOptions) return;
    q.options.splice(j, 1);
    if (q.correct === j) q.correct = -1; else if (q.correct > j) q.correct--;
    touched(); renderEditor();
  }

  /* Editor model → clean quiz, or {err, focus} with a translated message for the first problem. */
  function validateEdit() {
    var qz = E.quiz;
    var title = str(qz.title, LIM.title).replace(/\s+/g, ' ');
    if (!title) return { err: t('err_title'), focus: '#qzTitle' };
    var out = [];
    for (var i = 0; i < qz.questions.length; i++) {
      var q = qz.questions[i], n = EDU.fmt(i + 1);
      var text = str(q.q, LIM.question);
      var filled = q.options.map(function (o) { return str(o, LIM.option); });
      if (!text && !filled.some(Boolean) && !str(q.explain)) continue;      // a blank question is ignored
      if (!text) return { err: t('err_q_text', { n: n }), focus: '#qq' + i };
      var opts = [], corr = -1;
      filled.forEach(function (o, j) { if (!o) return; if (j === q.correct) corr = opts.length; opts.push(o); });
      if (opts.length < LIM.minOptions) return { err: t('err_q_options', { n: n }), focus: '#qo' + i + '_' + (filled[0] ? 1 : 0) };
      if (corr < 0) return { err: t('err_q_correct', { n: n }), focus: '#qc' + i + '_0' };
      var item = { q: text, options: opts, correct: corr };
      var ex = str(q.explain, LIM.explain);
      if (ex) item.explain = ex;
      var tm = parseInt(q.time, 10);
      if (tm > 0) item.time = clampInt(tm, LIM.minTime, LIM.maxTime);
      out.push(item);
    }
    if (!out.length) return { err: t('err_no_questions'), focus: '#qq0' };
    return { quiz: { title: title, lang: qz.lang || EDU.lang, questions: out } };
  }
  function saveEdit() {
    if (!E || !E.quiz) return;
    var r = validateEdit();
    var msg = $('#edMsg');
    if (r.err) { msg.textContent = r.err; focusEl(r.focus); return; }
    msg.textContent = '';
    if (E.id) r.quiz.id = E.id;
    var btn = $('#saveQuiz');
    btn.disabled = true;
    var myE = E;
    clearTimeout(E.saveT);
    C.saveQuiz(r.quiz).then(function () {
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

  /* ------------------------------------------------------------------ QR code (qrcode-generator, CDN) */
  var qrLoading = null;
  function loadQr() {
    if (typeof window.qrcode === 'function') return Promise.resolve(window.qrcode);
    if (qrLoading) return qrLoading;
    qrLoading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      var timer = setTimeout(fail, 15000);
      function fail() { clearTimeout(timer); qrLoading = null; reject(new Error('qr')); }
      s.src = QR_SRC;
      s.async = true;
      s.onload = function () { clearTimeout(timer); if (typeof window.qrcode === 'function') resolve(window.qrcode); else fail(); };
      s.onerror = fail;
      document.head.appendChild(s);
    });
    return qrLoading;
  }
  function drawQr(url) {
    var box = $('#qrImg');
    if (!box) return;
    loadQr().then(function (qrcode) {
      if (!document.body.contains(box)) return;
      var q = qrcode(0, 'M');
      q.addData(url);
      q.make();
      var n = q.getModuleCount(), m = 2, size = n + 2 * m, d = '';
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
      box.innerHTML = '<svg viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges" role="img"><rect width="' + size + '" height="' + size + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
      box.firstChild.setAttribute('aria-label', t('scan_qr'));
      box.setAttribute('data-ready', '1');
    }, function () {
      if (!document.body.contains(box)) return;
      box.innerHTML = '';
      box.appendChild(el('span', { class: 'qr-off', text: t('qr_offline') }));
    });
  }

  /* Where students join. Online: the short public address (LIVE_SPEC). Demo mode, and a local dev server
     with the Firebase emulators: the student app next to this one, so a tab of this browser can join. */
  function joinUrl(code) {
    var local = /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$/.test(location.hostname);
    if (!C.isDemo && !local) return EDU.SITE.url + 'join/?code=' + code;
    try {
      var u = new URL('../quiz-join/index.html', location.href);
      u.searchParams.set('code', code);
      if (C.isDemo) u.searchParams.set('mock', '1');
      if (EDU.lang !== 'en') u.searchParams.set('lang', EDU.lang);
      return u.href;
    } catch (e) { return '../quiz-join/index.html?code=' + code; }
  }

  /* ------------------------------------------------------------------ host */
  function phaseOf(s) {
    if (s.state === 'lobby') return 'lobby';
    if (s.state === 'question') return 'question';
    if (s.state === 'reveal') return H && H.boardFor === s.current ? 'board' : 'reveal';
    return 'final';
  }
  function qTime(s, i) { var q = s.questions && s.questions[i]; return (q && q.time) || s.timePerQ || LIM.defaultTime; }
  function timeLeft(s) {
    var T = qTime(s, s.current), st = s.questionStartedAt;
    if (typeof st !== 'number') return T;
    return Math.max(0, T - (C.now() - st) / 1000);
  }
  function answeredCount(st, i) {
    var a = (st.answers && st.answers[i]) || {};
    return st.players.filter(function (p) { return a[p.id]; }).length;
  }

  function openHost(code) {
    show('host');
    H = { code: code, st: null, screen: '', boardFor: -1, busy: false, auto: {}, scoring: false, scoreFails: 0, msgFrom: null, stop: null, timer: null, autoT: null, boardSig: '' };
    $('#hTitle').textContent = '';
    $('#hCode').textContent = t('code_n', { code: code });
    $('#hMsg').hidden = true;
    var stage = $('#hStage');
    stage.innerHTML = '';
    stage.appendChild(el('p', { class: 'big-msg', text: t('connecting') }));
    updateCtrl();
    var myH = H;
    H.stop = C.hostWatch(code, function (st) { if (H === myH) onHostState(st); }, function (e) { if (H === myH) hostErr(e, 'watch'); });
    H.timer = setInterval(tick, 250);
  }
  function closeHost() {
    if (!H) return;
    try { if (H.stop) H.stop(); } catch (e) { }
    clearInterval(H.timer);
    clearTimeout(H.autoT);
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

  function onHostState(st) {
    H.st = st;
    if (H.msgFrom === 'watch') { $('#hMsg').hidden = true; H.msgFrom = null; }
    var s = st.session;
    if (!s) { H.screen = 'gone'; renderGone(); updateCtrl(); return; }
    $('#hTitle').textContent = s.title || '';
    $('#hCode').textContent = t('code_n', { code: H.code });
    var key = phaseOf(s) + ':' + s.current;
    if (key !== H.screen) { H.screen = key; renderScreen(true); } else updateScreen();
    updateCtrl();
    if (s.state === 'reveal') maybeScore();
    if (s.state === 'question') checkAllAnswered();
  }

  function renderScreen(fresh) {
    var s = H.st.session, ph = phaseOf(s);
    var stage = $('#hStage');
    stage.innerHTML = '';
    stage.setAttribute('data-phase', ph);
    if (ph === 'lobby') renderLobby(stage);
    else if (ph === 'question') renderQuestion(stage);
    else if (ph === 'reveal') renderReveal(stage);
    else if (ph === 'board') renderBoard(stage, fresh);
    else renderFinal(stage, H.st, { host: true, anim: fresh });
    /* a new screen starts at its top (the teacher may have scrolled down to the buttons) */
    var host = $('#host'), r = host.getBoundingClientRect();
    if (r.top < 0) host.scrollIntoView({ block: 'start' });
  }
  function updateScreen() {
    var s = H.st.session, ph = phaseOf(s);
    if (ph === 'lobby') updateLobby();
    else if (ph === 'question') updateAnswered();
    else if (ph === 'reveal') updateBars();
    else if (ph === 'board') { if (boardSig() !== H.boardSig) renderBoard($('#hStage'), false); }
    else { var stage = $('#hStage'); stage.innerHTML = ''; renderFinal(stage, H.st, { host: true, anim: false }); }
  }
  function renderGone() {
    var stage = $('#hStage');
    stage.innerHTML = '';
    stage.setAttribute('data-phase', 'gone');
    stage.appendChild(el('p', { class: 'big-msg', id: 'sessionGone', text: t('session_gone') }));
    stage.appendChild(el('div', { class: 'final-acts' }, el('button', { type: 'button', class: 'btn btn-primary', text: t('back_dash'), onclick: function () { nav('#'); } })));
  }

  /* fill a translated sentence that has a {url} placeholder with an element */
  function sentence(tpl, node) {
    var parts = String(tpl).split('{url}');
    var p = el('p', { class: 'join-line' });
    parts.forEach(function (txt, k) { if (k) p.appendChild(node.cloneNode(true)); if (txt) p.appendChild(document.createTextNode(txt)); });
    return p;
  }

  function renderLobby(stage) {
    var code = H.code;
    var url = joinUrl(code);
    var joinBox = el('div', { class: 'join-box' },
      sentence(t('join_line'), el('b', { class: 'join-url no-i18n', dir: 'ltr', text: JOIN_TEXT })),
      el('div', { class: 'join-code', id: 'lobbyCode', dir: 'ltr', 'data-code': code, 'aria-label': code.split('').join(' '), text: code.slice(0, 3) + ' ' + code.slice(3) }));
    if (C.isDemo) {
      joinBox.appendChild(el('a', { class: 'btn demo-open', id: 'openStudent', href: url, target: '_blank', rel: 'noopener' },
        el('span', { 'aria-hidden': 'true', text: '📱' }), el('span', { text: t('open_student') })));
    }
    stage.appendChild(el('div', { class: 'lobby' }, joinBox,
      el('figure', { class: 'qr-box' },
        el('div', { class: 'qr-img', id: 'qrImg', 'data-url': url }, el('span', { class: 'muted', text: t('loading') })),
        el('figcaption', { text: t('scan_qr') }))));
    var lock = el('button', { type: 'button', class: 'btn', id: 'lockBtn', onclick: toggleLock });
    stage.appendChild(el('div', { class: 'players-head' }, el('h2', { id: 'joinedN' }), lock));
    stage.appendChild(el('p', { class: 'lock-note', id: 'lockNote', hidden: true, text: '🔒 ' + t('locked_note') }));
    stage.appendChild(el('div', { class: 'pchips', id: 'players' }));
    stage.appendChild(el('p', { class: 'lobby-hint', id: 'lobbyHint' }));
    drawQr(url);
    updateLobby();
  }
  function updateLobby() {
    var st = H.st, s = st.session, players = st.players || [];
    var h = $('#joinedN');
    if (!h) return;
    h.textContent = t('joined_n', { n: EDU.fmt(players.length) });
    h.setAttribute('data-n', players.length);
    var lock = $('#lockBtn');
    lock.textContent = (s.locked ? '🔓 ' : '🔒 ') + t(s.locked ? 'unlock' : 'lock');
    lock.setAttribute('aria-pressed', s.locked ? 'true' : 'false');
    lock.disabled = !!H.busy;
    $('#lockNote').hidden = !s.locked;
    var box = $('#players');
    var seen = {}, keep = {};
    players.forEach(function (p) { keep[p.id] = 1; });
    EDU.$$('.pchip', box).forEach(function (c) {
      var id = c.getAttribute('data-id');
      if (keep[id]) seen[id] = c; else c.remove();
    });
    /* keep the join order; a chip that is already in the right place is NOT moved, because moving a
       node in the DOM restarts its pop-in animation (every chip would blink at each new join) */
    players.forEach(function (p, k) {
      var chip = seen[p.id] || el('span', { class: 'pchip', 'data-id': p.id },
        el('span', { class: 'pname no-i18n', text: p.name }),
        el('button', { type: 'button', class: 'kick', 'aria-label': t('kick', { name: p.name }), title: t('kick', { name: p.name }), text: '✕', onclick: function () { kick(p); } }));
      if (box.children[k] !== chip) box.insertBefore(chip, box.children[k] || null);
    });
    $('#lobbyHint').textContent = players.length ? '' : t('waiting_players');
  }
  function toggleLock() {
    var s = H && H.st && H.st.session;
    if (!s) return;
    act(function () { return C.lockSession(H.code, !s.locked); });
  }
  function kick(p) {
    if (!window.confirm(t('confirm_kick', { name: p.name }))) return;
    act(function () { return C.kickPlayer(H.code, p.id); });
  }

  function ringHtml() {
    return '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle class="rtrack" cx="60" cy="60" r="52"/>' +
      '<circle class="rbar" id="ringBar" cx="60" cy="60" r="52" transform="rotate(-90 60 60)" stroke-dasharray="' + RING_C.toFixed(2) + '" stroke-dashoffset="0"/></svg>' +
      '<span class="rnum" id="ringNum"></span>';
  }
  function renderQuestion(stage) {
    var s = H.st.session, i = s.current, q = s.questions[i];
    stage.appendChild(el('div', { class: 'qhead' },
      el('span', { class: 'badge primary qnum', id: 'qNum', text: t('question_of', { n: EDU.fmt(i + 1), total: EDU.fmt(s.questions.length) }) }),
      el('div', { class: 'ring', id: 'ring', html: ringHtml() })));
    stage.appendChild(el('h2', { class: 'qtext no-i18n', id: 'qText', text: q.q }));
    stage.appendChild(el('div', { class: 'tiles n' + q.options.length, id: 'tiles' }, q.options.map(function (o, j) {
      return el('div', { class: 'tile t' + j }, el('span', { class: 'shape', 'aria-hidden': 'true', text: SHAPES[j] }), el('span', { class: 'no-i18n', text: o }));
    })));
    stage.appendChild(el('p', { class: 'answered', id: 'answered', 'aria-live': 'polite' }));
    updateAnswered();
    tick();
  }
  function updateAnswered() {
    var a = $('#answered');
    if (!a) return;
    var st = H.st, s = st.session, N = st.players.length, n = answeredCount(st, s.current);
    var all = N > 0 && n >= N, up = timeLeft(s) <= 0;
    a.textContent = t('answered_n', { n: EDU.fmt(n), total: EDU.fmt(N) }) + (all ? ' · ' + t('all_answered') : up ? ' · ' + t('time_up') : '');
    a.setAttribute('data-n', n);
    a.setAttribute('data-total', N);
    a.classList.toggle('done', all);
  }
  function tick() {
    if (!H || !H.st || !H.st.session) return;
    var s = H.st.session;
    if (s.state !== 'question') return;
    var T = qTime(s, s.current), left = timeLeft(s);
    var bar = $('#ringBar'), num = $('#ringNum'), ring = $('#ring');
    if (bar) bar.setAttribute('stroke-dashoffset', (RING_C * (1 - left / T)).toFixed(2));
    if (num) num.textContent = EDU.fmt(Math.ceil(left));
    if (ring) ring.classList.toggle('low', left <= 5);
    if (left <= 0) {
      if (H.upShown !== s.current + 1) { H.upShown = s.current + 1; updateAnswered(); }
      autoReveal(s.current, 400);
    }
  }
  function checkAllAnswered() {
    var st = H.st, N = st.players.length;
    if (N > 0 && answeredCount(st, st.session.current) >= N) autoReveal(st.session.current, 900);
  }
  function autoReveal(i, delay) {
    if (!H || H.auto[i]) return;
    H.auto[i] = true;
    clearTimeout(H.autoT);
    H.autoT = setTimeout(function () { reveal(i); }, delay);
  }
  function reveal(i) {
    if (!H) return;
    H.auto[i] = true;
    if (H.busy) { clearTimeout(H.autoT); H.autoT = setTimeout(function () { reveal(i); }, 300); return; }
    var s = H.st && H.st.session;
    if (!s || s.state !== 'question' || s.current !== i) return;
    act(function () { return C.revealQuestion(H.code, i); });
  }

  function correctOf(st, i) {
    var s = st.session;
    if (s.reveal && s.reveal.index === i && isInt(s.reveal.correct)) return s.reveal.correct;
    return st.key && st.key.correct && isInt(st.key.correct[i]) ? st.key.correct[i] : -1;
  }
  function choiceCounts(st, i) {
    var s = st.session, counts = s.questions[i].options.map(function () { return 0; });
    var a = (st.answers && st.answers[i]) || {};
    Object.keys(a).forEach(function (pid) { var c = a[pid] && a[pid].choice; if (isInt(c) && c >= 0 && c < counts.length) counts[c]++; });
    return counts;
  }
  function renderReveal(stage) {
    var st = H.st, s = st.session, i = s.current, q = s.questions[i];
    var c = correctOf(st, i);
    stage.appendChild(el('div', { class: 'qhead' },
      el('span', { class: 'badge primary qnum', text: t('question_of', { n: EDU.fmt(i + 1), total: EDU.fmt(s.questions.length) }) })));
    stage.appendChild(el('h2', { class: 'qtext no-i18n', id: 'qText', text: q.q }));
    stage.appendChild(el('div', { class: 'bars', id: 'bars' }, q.options.map(function (o, j) {
      return el('div', { class: 'barrow t' + j + (j === c ? ' is-correct' : ' is-wrong'), 'data-i': j },
        el('span', { class: 'bshape', 'aria-hidden': 'true', text: SHAPES[j] }),
        el('span', { class: 'btext no-i18n', text: o }),
        el('span', { class: 'btrack', 'aria-hidden': 'true' }, el('span', { class: 'bfill' })),
        el('b', { class: 'bcount', text: '0' }),
        el('span', { class: 'tick', 'aria-label': j === c ? t('correct_answer') : null, text: j === c ? '✓' : '' }));
    })));
    var explain = (s.reveal && s.reveal.explain) || (st.key && st.key.explain && st.key.explain[i]) || '';
    if (c >= 0) {
      stage.appendChild(el('div', { class: 'callout success explain', id: 'explain' },
        el('strong', {}, t('correct_answer') + ': ', el('span', { class: 'no-i18n', text: SHAPES[c] + ' ' + q.options[c] })),
        explain ? el('p', { class: 'no-i18n', text: explain }) : null));
    }
    /* let the bars grow from zero */
    requestAnimationFrame(function () { requestAnimationFrame(updateBars); });
  }
  function updateBars() {
    if (!H || !H.st || !$('#bars')) return;
    var counts = choiceCounts(H.st, H.st.session.current);
    var max = Math.max(1, Math.max.apply(null, counts));
    EDU.$$('#bars .barrow').forEach(function (row, j) {
      row.querySelector('.bfill').style.width = (100 * counts[j] / max) + '%';
      row.querySelector('.bcount').textContent = EDU.fmt(counts[j]);
      row.setAttribute('data-count', counts[j]);
    });
  }

  /* Host scores each revealed question (LIVE_SPEC scoring via EDUCloud.computeScores; re-running is safe). */
  function maybeScore() {
    if (!H || H.scoring || !H.st || H.scoreFails > 3) return;
    var s = H.st.session;
    var i = s.reveal ? s.reveal.index : s.current;
    var upd = C.computeScores(H.st, i);
    if (!Object.keys(upd).length) return;
    var myH = H;
    H.scoring = true;
    C.writeScores(H.code, upd).then(function () { if (H === myH) H.scoreFails = 0; }, function (e) {
      if (H === myH) { H.scoreFails++; hostErr(e, 'act'); }
    }).then(function () {
      if (H !== myH) return;
      H.scoring = false;
      setTimeout(maybeScore, 60);     // answers that arrived meanwhile
    });
  }

  function boardSig() {
    var list = C.rankPlayers(H.st.players).slice(0, 5);
    return list.map(function (p) { return p.id + ':' + p.score + ':' + (p.lastQ === H.st.session.current ? p.last : ''); }).join('|');
  }
  function countUp(node, from, to, ms) {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from === to) { node.textContent = EDU.fmt(to); return; }
    var t0 = null;
    node.textContent = EDU.fmt(from);
    function step(ts) {
      if (!document.body.contains(node)) return;
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / ms);
      node.textContent = EDU.fmt(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function renderBoard(stage, fresh) {
    var st = H.st, i = st.session.current;
    var top = C.rankPlayers(st.players).slice(0, 5);
    stage.innerHTML = '';
    stage.setAttribute('data-phase', 'board');
    stage.appendChild(el('h2', { class: 'stage-title', text: '🏆 ' + t('leaderboard') }));
    H.boardSig = boardSig();
    if (!top.length) { stage.appendChild(el('p', { class: 'big-msg', text: t('nobody_joined') })); return; }
    var ol = el('ol', { class: 'board' + (fresh ? '' : ' no-anim'), id: 'board' });
    top.forEach(function (p, k) {
      var gained = p.lastQ === i ? (Number(p.last) || 0) : 0;
      var sc = el('b', { class: 'sc', 'data-score': p.score, text: EDU.fmt(p.score) });
      ol.appendChild(el('li', { style: { '--i': String(k) }, 'data-id': p.id },
        el('span', { class: 'rk', text: EDU.fmt(p.rank) }),
        el('span', { class: 'nm no-i18n', text: p.name }),
        el('span', { class: 'plus', dir: 'ltr', text: gained ? '+' + EDU.fmt(gained) : '' }),
        sc));
      if (fresh && gained) countUp(sc, p.score - gained, p.score, 900 + k * 130);
    });
    stage.appendChild(ol);
  }

  /* Final podium + full table (host view and past results). */
  function correctCount(st, pid) {
    var n = 0, qs = st.session.questions || [];
    for (var i = 0; i < qs.length; i++) {
      var a = st.answers && st.answers[i] && st.answers[i][pid];
      if (a && a.choice === correctOf(st, i)) n++;
    }
    return n;
  }
  function renderFinal(box, st, opts) {
    opts = opts || {};
    var s = st.session, ranked = C.rankPlayers(st.players || []), nq = (s.questions || []).length;
    box.appendChild(el('h2', { class: 'stage-title', text: '🎉 ' + t('final_results') }));
    if (!ranked.length) box.appendChild(el('p', { class: 'big-msg', id: 'nobody', text: t('nobody_joined') }));
    else {
      var pod = el('div', { class: 'podium' + (opts.anim === false ? ' no-anim' : ''), id: 'podium' });
      ranked.slice(0, 3).forEach(function (p, k) {
        pod.appendChild(el('div', { class: 'pod p' + (k + 1), 'data-id': p.id },
          el('div', { class: 'pname no-i18n', text: (k === 0 ? '👑 ' : '') + p.name }),
          el('div', { class: 'pscore', text: t('points_n', { n: EDU.fmt(p.score) }) }),
          el('div', { class: 'pblock' }, el('span', { text: EDU.fmt(p.rank) }))));
      });
      box.appendChild(pod);
      var tb = el('tbody');
      ranked.forEach(function (p) {
        tb.appendChild(el('tr', { 'data-id': p.id },
          el('td', { text: EDU.fmt(p.rank) }),
          el('td', { class: 'no-i18n', text: p.name }),
          el('td', { text: EDU.fmt(p.score) }),
          el('td', { dir: 'ltr', text: EDU.fmt(correctCount(st, p.id)) + ' / ' + EDU.fmt(nq) })));
      });
      box.appendChild(el('div', { class: 'scroll-x final-table' }, el('table', { class: 'table', id: 'finalTable' },
        el('thead', {}, el('tr', {}, el('th', { text: t('col_rank') }), el('th', { text: t('col_nick') }), el('th', { text: t('score') }), el('th', { text: t('col_correct') }))),
        tb)));
    }
    var acts = el('div', { class: 'final-acts no-print' });
    acts.appendChild(el('button', { type: 'button', class: 'btn btn-primary', id: 'exportCsv', onclick: function () { exportCsv(st); } },
      el('span', { 'aria-hidden': 'true', text: '⬇' }), el('span', { text: t('export_csv') })));
    if (opts.host && st.key) acts.appendChild(el('button', { type: 'button', class: 'btn', id: 'hostAgain', text: t('host_again'), onclick: function () { hostQuiz(quizFromSession(st), this); } }));
    if (opts.results) {
      if (s.state !== 'ended') acts.appendChild(el('button', { type: 'button', class: 'btn', id: 'resumeSession', text: t('resume'), onclick: function () { nav('#host/' + (st.code || s.code)); } }));
      acts.appendChild(el('button', { type: 'button', class: 'btn btn-danger', id: 'delSession', text: t('delete'), onclick: function () { deleteSession(st.code || s.code); } }));
    }
    box.appendChild(acts);
  }
  function quizFromSession(st) {
    var s = st.session, key = st.key || {};
    var quiz = {
      title: s.title, lang: s.lang,
      questions: s.questions.map(function (q, i) {
        var o = { q: q.q, options: q.options.slice(), correct: (key.correct || [])[i] };
        var ex = (key.explain || [])[i];
        if (ex) o.explain = ex;
        /* the session gives every question a time; keep only real per-question times, so the
           teacher's current "time per question" setting applies to the others */
        if (q.time && q.time !== s.timePerQ) o.time = q.time;
        return o;
      })
    };
    if (s.quizId) quiz.id = s.quizId;
    return quiz;
  }

  /* CSV: one row per student (rank, nickname, score, correct answers, the letter chosen for each
     question with ✓/✗), then the answer key. Cells that Excel would run as formulas get a leading '. */
  function cell(v) { v = v === null || v === undefined ? '' : String(v); return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; }
  function exportCsv(st) {
    var s = st.session;
    if (!s) return;
    var code = st.code || s.code, qs = s.questions || [];
    var rows = [[t('col_rank'), t('col_nick'), t('score'), t('col_correct')].concat(qs.map(function (q, i) { return t('col_q', { n: i + 1 }); }))];
    C.rankPlayers(st.players || []).forEach(function (p) {
      var nc = 0;
      var cells = qs.map(function (q, i) {
        var a = st.answers && st.answers[i] && st.answers[i][p.id];
        if (!a || !isInt(a.choice)) return '';
        var ok = a.choice === correctOf(st, i);
        if (ok) nc++;
        return (LETTERS[a.choice] || '?') + (ok ? ' ✓' : ' ✗');
      });
      rows.push([p.rank, cell(p.name), p.score, nc].concat(cells));
    });
    rows.push([]);
    rows.push(['#', t('col_question'), t('correct_answer')]);
    qs.forEach(function (q, i) {
      var c = correctOf(st, i);
      rows.push([t('col_q', { n: i + 1 }), cell(q.q), c >= 0 ? LETTERS[c] + ': ' + q.options[c] : '']);
    });
    rows.push([]);
    rows.push([cell(s.title), fmtDate(s.createdAt), t('code_n', { code: code })]);
    EDU.download('live-quiz-' + code + '.csv', EDU.csv.stringify(rows), 'text/csv');
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
      if (H.st && H.st.session && phaseOf(H.st.session) === 'lobby') updateLobby();
    });
  }
  function primary() {
    if (!H || !H.st || !H.st.session || H.busy) return;
    var s = H.st.session, ph = phaseOf(s), i = s.current, n = s.questions.length;
    if (ph === 'lobby') {
      if (!H.st.players.length) { EDU.toast(t('need_player')); return; }
      act(function () { return C.startQuestion(H.code, 0); });
    } else if (ph === 'question') reveal(i);
    else if (ph === 'reveal') { H.boardFor = i; H.screen = ''; onHostState(H.st); }
    else if (ph === 'board') {
      if (i + 1 < n) act(function () { return C.startQuestion(H.code, i + 1); });
      else finish();
    }
  }
  function skip() {
    if (!H || !H.st || !H.st.session || H.busy) return;
    var s = H.st.session;
    if (s.state !== 'question') return;
    H.auto[s.current] = true;
    clearTimeout(H.autoT);
    if (s.current + 1 < s.questions.length) { var nx = s.current + 1; act(function () { return C.startQuestion(H.code, nx); }); }
    else finish();
  }
  /* End: final scores + everyone's rank (so phones can show "You came 3rd"), then state 'ended'. */
  function finish() {
    if (!H || !H.st || !H.st.session) return;
    clearTimeout(H.autoT);
    act(function () {
      var st = H.st, s = st.session;
      var pending = s.state === 'reveal' ? C.computeScores(st, s.reveal ? s.reveal.index : s.current) : {};
      var players = st.players.map(function (p) {
        var c = {}; for (var k in p) c[k] = p[k];
        if (pending[p.id]) for (var f in pending[p.id]) c[f] = pending[p.id][f];
        return c;
      });
      var upd = {};
      C.rankPlayers(players).forEach(function (p) {
        upd[p.id] = { rank: p.rank };
        if (pending[p.id]) for (var f in pending[p.id]) upd[p.id][f] = pending[p.id][f];
      });
      return (Object.keys(upd).length ? C.writeScores(H.code, upd) : Promise.resolve()).then(function () { return C.endSession(H.code); });
    });
  }

  function updateCtrl() {
    var next = $('#nextBtn'), skipB = $('#skipBtn'), end = $('#endBtn');
    var s = H && H.st && H.st.session;
    var ph = s ? phaseOf(s) : 'none';
    var busy = !!(H && H.busy);
    var label = '', i = s ? s.current : -1, n = s ? s.questions.length : 0;
    if (ph === 'lobby') label = t('start_quiz');
    else if (ph === 'question') label = t('show_answer');
    else if (ph === 'reveal') label = t('leaderboard');
    else if (ph === 'board') label = i + 1 < n ? t('next_question') : t('final_results');
    next.hidden = !label;
    next.textContent = label;
    next.disabled = busy || (ph === 'lobby' && !(H.st.players || []).length);
    next.setAttribute('data-phase', ph);
    skipB.hidden = ph !== 'question';
    skipB.disabled = busy;
    end.hidden = ['question', 'reveal', 'board'].indexOf(ph) < 0;
    end.disabled = busy;
    $('#hKeys').hidden = !label;
  }
  $('#nextBtn').addEventListener('click', primary);
  $('#skipBtn').addEventListener('click', skip);
  $('#endBtn').addEventListener('click', function () { if (window.confirm(t('confirm_end'))) finish(); });
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen(); });
  $('#hBack').addEventListener('click', function () { nav('#'); });

  /* Keyboard (projector clickers send PageDown / →): Space or → = the big "next" button. */
  document.addEventListener('keydown', function (e) {
    if (view !== 'host' || !H || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('.edu-modal-back')) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag || '') || (tg && tg.isContentEditable)) return;
    var k = e.key;
    var space = k === ' ' || k === 'Spacebar';
    var rtl = document.documentElement.dir === 'rtl';
    if (space || k === 'ArrowRight' || k === 'PageDown' || (rtl && k === 'ArrowLeft')) {
      if (space && tg && tg.closest && tg.closest('button, a, summary, [role="button"]')) return;   // the browser clicks it
      e.preventDefault();
      primary();
    } else if (k === 'f' || k === 'F') EDU.fullscreen();
  });

  /* ------------------------------------------------------------------ results of a past session */
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
    card.appendChild(el('div', { class: 'ed-head' },
      el('h2', { class: 'mb0', text: t('results') }),
      el('button', { type: 'button', class: 'btn btn-ghost', id: 'resBack', text: t('back_dash'), onclick: function () { nav('#'); } })));
    if (R.err) { card.appendChild(errorRow(R.err, function () { openResults(R.code); })); return; }
    if (!R.st) { card.appendChild(el('p', { class: 'muted', text: t('loading') })); return; }
    var s = R.st.session;
    if (!s) { card.appendChild(el('p', { class: 'muted', text: t('session_gone') })); return; }
    card.appendChild(el('p', { class: 'muted mb0' }, el('b', { class: 'no-i18n', text: s.title }), ' · ', t('code_n', { code: R.code }), ' · ', el('span', { dir: 'ltr', text: fmtDate(s.createdAt) })));
    var inner = el('div', { class: 'stack' });
    card.appendChild(inner);
    renderFinal(inner, R.st, { results: true, anim: false });
    card.appendChild(el('p', { class: 'small muted mb0', text: t('keep_note') }));
  }

  /* ------------------------------------------------------------------ language + start */
  EDU.onLang(function () {
    legalLinks();
    if (view === 'signin') renderSignin();
    else if (view === 'dash') renderDash();
    else if (view === 'edit') renderEditor();
    else if (view === 'host' && H) {
      $('#hCode').textContent = t('code_n', { code: H.code });
      if (H.st) { H.screen = ''; onHostState(H.st); } else updateCtrl();
    } else if (view === 'results') renderResults();
  });

  if (!C.isDemo) {
    /* load the Firebase SDK early, so the Google popup can open inside the click */
    C.ready().then(function () {
      cloudReady = true;
      var re = C.redirectError && C.redirectError();
      if (re) signinErr = re;
    }, function (e) { readyErr = e; signinErr = e; logErr(e); }).then(function () { if (view === 'signin') renderSignin(); });
  }
  C.onTeacher(function (tch) {
    var prev = teacher, first = !teacherKnown;
    teacher = tch || null;
    teacherKnown = true;
    if (!first && prev && teacher && prev.uid === teacher.uid) { if (view === 'dash') renderAccount(); return; }
    quizzes = sessions = null;
    quizzesErr = sessionsErr = null;
    route();
  });

  legalLinks();
  updateOnline();
  show('loading');
})();
