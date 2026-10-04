/* AI Ethics Discussion Cards: 12 dilemma cards, class vote with live bars, group timer,
   "things to consider", progress and printable cards. Everything stays on this device. */
(function () {
  'use strict';
  var SLUG = 'ai-ethics-dilemmas';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$;

  /* The 6 principles: icon + chart colour token. Names and definitions are in strings.js. */
  var PR = {
    fairness: { icon: '⚖️', c: '--c3' },
    privacy: { icon: '🔒', c: '--c7' },
    safety: { icon: '🛡️', c: '--c4' },
    transparency: { icon: '🔍', c: '--c1' },
    accountability: { icon: '🙋', c: '--c2' },
    honesty: { icon: '🤝', c: '--c5' }
  };
  var PRINCIPLES = Object.keys(PR);

  /* Language-independent card data, in the same order as APP_CONTENT[lang].cards. */
  var CARDS = [
    { id: 'deepfake', icon: '🎭', p: ['privacy', 'honesty', 'safety', 'accountability'] },
    { id: 'ai-grading', icon: '📝', p: ['fairness', 'transparency', 'accountability'] },
    { id: 'face-attendance', icon: '📷', p: ['privacy', 'fairness', 'transparency'] },
    { id: 'ai-homework', icon: '🤖', p: ['honesty', 'fairness', 'accountability'] },
    { id: 'job-screening', icon: '💼', p: ['fairness', 'transparency', 'accountability'] },
    { id: 'self-driving', icon: '🚗', p: ['safety', 'accountability', 'transparency'] },
    { id: 'health-app', icon: '⌚', p: ['privacy', 'transparency', 'honesty'] },
    { id: 'ai-art', icon: '🎨', p: ['honesty', 'fairness', 'transparency'] },
    { id: 'school-cctv', icon: '🎥', p: ['safety', 'privacy', 'transparency', 'accountability'] },
    { id: 'village-jobs', icon: '🌾', p: ['fairness', 'accountability', 'safety'] },
    { id: 'voice-scam', icon: '📞', p: ['safety', 'honesty', 'privacy'] },
    { id: 'endless-feed', icon: '📱', p: ['safety', 'transparency', 'accountability'] }
  ];
  var N = CARDS.length;
  var OPT_COLORS = ['--c1', '--c2', '--c3', '--c4', '--c6'];
  var OTHER_COLOR = '--c8';
  var TIMER_CHOICES = [2, 3, 5];

  /* ---------------- saved state (sanitised: storage may hold anything) ---------------- */
  function asObj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  var state = {
    cur: EDU.clamp(parseInt(store.get('cur', 0), 10) || 0, 0, N - 1),
    votes: asObj(store.get('votes', {})),
    revealed: asObj(store.get('revealed', {})),
    discussed: asObj(store.get('discussed', {})),
    filter: store.get('filter', 'all'),
    timerMin: store.get('timerMin', 3),
    print: asObj(store.get('print', {}))
  };
  if (state.filter !== 'all' && !PR[state.filter]) state.filter = 'all';
  if (TIMER_CHOICES.indexOf(state.timerMin) < 0) state.timerMin = 3;
  state.print = { all: !!state.print.all, teacher: !!state.print.teacher, lines: state.print.lines !== false };
  function save(k) { store.set(k, state[k]); }

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- content ---------------- */
  var EMPTY = { title: '', story: '', options: [], questions: [], consider: [] };
  function cardText(i) {
    var A = window.APP_CONTENT || {};
    var L = A[EDU.lang] && A[EDU.lang].cards ? A[EDU.lang] : A.en;
    var c = L && L.cards && L.cards[i];
    if (!c && A.en && A.en.cards) c = A.en.cards[i];
    return c || EMPTY;
  }
  function pName(p) { return t('p_' + p); }
  function isRtl() { return document.documentElement.dir === 'rtl'; }

  /* votes[id] = [opt1, opt2, ..., another idea] */
  function votesFor(i) {
    var n = cardText(i).options.length + 1;
    var v = state.votes[CARDS[i].id];
    if (!Array.isArray(v)) v = [];
    var out = [];
    for (var k = 0; k < n; k++) out.push(Math.max(0, Math.min(9999, Math.floor(Number(v[k]) || 0))));
    return out;
  }
  function sum(a) { return a.reduce(function (s, x) { return s + x; }, 0); }
  function discussedCount() { return CARDS.filter(function (c) { return !!state.discussed[c.id]; }).length; }

  /* ---------------- navigation ---------------- */
  function go(i, opts) {
    i = ((i % N) + N) % N;
    var changed = i !== state.cur;
    stopReading();
    state.cur = i; save('cur');
    renderCard();
    renderNav();
    renderTiles();
    renderPrint(false);
    if (changed) {
      var sc = $('#scene');
      sc.classList.remove('enter'); void sc.offsetWidth; sc.classList.add('enter');
    }
    if (opts && opts.scroll) {
      var top = $('#toolbar').getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }
  function randomCard() {
    var pool = [], i;
    for (i = 0; i < N; i++) if (i !== state.cur && !state.discussed[CARDS[i].id]) pool.push(i);
    if (!pool.length) for (i = 0; i < N; i++) if (i !== state.cur) pool.push(i);
    go(EDU.pick(pool));
  }

  function renderNav() {
    var sel = $('#jump');
    sel.innerHTML = '';
    for (var i = 0; i < N; i++) {
      sel.appendChild(el('option', { value: String(i), text: EDU.fmt(i + 1) + '. ' + cardText(i).title + (state.discussed[CARDS[i].id] ? ' ✓' : '') }));
    }
    sel.value = String(state.cur);
    var d = discussedCount();
    $('#progBar').style.width = (100 * d / N) + '%';
    $('#progBarWrap').setAttribute('aria-valuenow', String(d));
    $('#progText').textContent = t('progress_n', { n: EDU.fmt(d), total: EDU.fmt(N) });
  }

  /* ---------------- the card ---------------- */
  function renderCard() {
    var i = state.cur, meta = CARDS[i], c = cardText(i);
    $('#sceneIcon').textContent = meta.icon;
    $('#cardNo').textContent = t('card_n_of', { n: EDU.fmt(i + 1), total: EDU.fmt(N) });
    $('#sceneTitle').textContent = c.title;
    $('#story').textContent = c.story;

    var chips = $('#sceneChips');
    chips.innerHTML = '';
    chips.appendChild(el('span', { class: 'pchips-label', text: t('principles_at_stake') + ':' }));
    meta.p.forEach(function (p) {
      chips.appendChild(el('button', {
        class: 'pchip', type: 'button', title: t('p_' + p + '_d'), style: { '--pc': 'var(' + PR[p].c + ')' },
        onclick: function () { EDU.toast(pName(p) + ': ' + t('p_' + p + '_d'), 4500); }
      }, el('span', { 'aria-hidden': 'true', text: PR[p].icon }), pName(p)));
    });

    /* options: each row = text + live bar + counter */
    var list = $('#opts');
    list.innerHTML = '';
    var labels = c.options.concat([t('other_option')]);
    labels.forEach(function (label, k) {
      var other = k === labels.length - 1;
      var num = EDU.fmt(k + 1);
      var li = el('li', { class: 'opt' + (other ? ' other' : ''), style: { '--oc': 'var(' + (other ? OTHER_COLOR : OPT_COLORS[k % OPT_COLORS.length]) + ')' }, 'data-k': String(k) },
        el('span', { class: 'opt-num', 'aria-hidden': 'true', text: num }),
        el('div', { class: 'opt-text', text: label }),
        el('div', { class: 'opt-bar' },
          el('div', { class: 'bar', 'aria-hidden': 'true' }, el('span', {})),
          el('div', { class: 'bar-meta' })),
        el('div', { class: 'opt-ctl' },
          el('button', { class: 'vbtn minus', type: 'button', 'aria-label': t('remove_vote', { n: num }), text: '−', onclick: function () { addVote(k, -1); } }),
          el('output', { class: 'vcount', 'aria-live': 'polite' }),
          el('button', { class: 'vbtn plus', type: 'button', 'aria-label': t('add_vote', { n: num }), text: '+', onclick: function () { addVote(k, 1); } })));
      list.appendChild(li);
    });
    updateVotes();

    var q = $('#questions');
    q.innerHTML = '';
    c.questions.forEach(function (x) { q.appendChild(el('li', { text: x })); });

    var cl = $('#considerList');
    cl.innerHTML = '';
    c.consider.forEach(function (x) { cl.appendChild(el('li', { text: x })); });
    updateConsider();
    updateReadBtn();
  }

  function addVote(k, d) {
    var i = state.cur, v = votesFor(i);
    if (k < 0 || k >= v.length) return;
    v[k] = Math.max(0, Math.min(9999, v[k] + d));
    state.votes[CARDS[i].id] = v;
    save('votes');
    updateVotes();
    renderTilesLight();
  }

  function updateVotes() {
    var v = votesFor(state.cur), total = sum(v), max = Math.max.apply(null, v);
    var rows = EDU.$$('#opts .opt');
    rows.forEach(function (row, k) {
      var n = v[k] || 0, pct = total ? Math.round(100 * n / total) : 0;
      row.querySelector('.bar > span').style.width = (total ? (100 * n / total) : 0) + '%';
      row.querySelector('.bar-meta').textContent = t('votes_n', { n: EDU.fmt(n) }) + ' · ' + EDU.fmt(pct) + '%';
      row.querySelector('.vcount').textContent = EDU.fmt(n);
      row.querySelector('.vbtn.minus').disabled = n === 0;
      row.classList.toggle('lead', total > 0 && n === max);
    });
    var sumEl = $('#voteSum');
    if (!total) { sumEl.textContent = t('no_votes'); }
    else {
      var leaders = [];
      v.forEach(function (n, k) { if (n === max) leaders.push(EDU.fmt(k + 1)); });
      sumEl.textContent = t('total_votes', { n: EDU.fmt(total) }) + ' · ' +
        (leaders.length === 1 ? t('most_chosen', { n: leaders[0] }) : t('tie', { list: leaders.join(', ') }));
    }
    $('#clearVotesBtn').disabled = total === 0;
  }

  /* ---------------- things to consider + discussed ---------------- */
  function updateConsider() {
    var id = CARDS[state.cur].id, open = !!state.revealed[id], done = !!state.discussed[id];
    $('#considerList').hidden = !open;
    $('#revealBtn').setAttribute('aria-expanded', String(open));
    $('#revealLabel').textContent = open ? t('hide_consider') : t('show_consider');
    $('#revealBtn').className = open ? 'btn' : 'btn btn-primary';
    $('#discussedBtn').setAttribute('aria-pressed', String(done));
    $('#discussedLabel').textContent = done ? t('discussed') : t('mark_discussed');
  }
  $('#revealBtn').addEventListener('click', function () {
    var id = CARDS[state.cur].id;
    state.revealed[id] = !state.revealed[id];
    if (state.revealed[id]) { state.discussed[id] = true; save('discussed'); }
    save('revealed');
    updateConsider(); renderNav(); renderTiles();
  });
  $('#discussedBtn').addEventListener('click', function () {
    var id = CARDS[state.cur].id;
    if (state.discussed[id]) delete state.discussed[id]; else state.discussed[id] = true;
    save('discussed');
    updateConsider(); renderNav(); renderTiles();
  });

  /* ---------------- read aloud (sentence by sentence: long utterances get cut off in some browsers) ---------------- */
  var reading = false, readQueue = [], readPoll = null, readRun = 0;
  function updateReadBtn() {
    $('#readBtn').setAttribute('aria-pressed', String(reading));
    $('#readIcon').textContent = reading ? '⏹' : '🔊';
    $('#readLabel').textContent = reading ? t('stop_reading') : t('read_aloud');
  }
  function stopReading() {
    readQueue = [];
    readRun++;                       /* late "end" events of a cancelled sentence must not start the next run */
    if (reading) { reading = false; EDU.stopSpeaking(); }
    if (readPoll) { clearInterval(readPoll); readPoll = null; }
    updateReadBtn();
  }
  function speakNext(run) {
    if (!reading || run !== readRun) return;
    if (!readQueue.length) { stopReading(); return; }
    var part = readQueue.shift();
    EDU.speak(part, { onend: function () { setTimeout(function () { speakNext(run); }, 120); } }).then(function (ok) {
      if (!ok && run === readRun) { stopReading(); EDU.toast(t('no_voice'), 5000); }
    });
  }
  /* Split into sentences; an option number ("2.") is kept with the option text that follows it. */
  function sentences(text) {
    var parts = (text.match(/[^.!?।۔]+[.!?।۔]*["”']?\s*/g) || [text]).map(function (s) { return s.trim(); }).filter(Boolean);
    var out = [];
    parts.forEach(function (s) {
      if (out.length && /^\d+\.$/.test(out[out.length - 1])) out[out.length - 1] += ' ' + s; else out.push(s);
    });
    return out;
  }
  function readAloud() {
    if (reading) { stopReading(); return; }
    var c = cardText(state.cur);
    var text = c.title + '. ' + c.story + ' ' + c.options.map(function (o, k) { return (k + 1) + '. ' + o; }).join(' ');
    stopReading();
    readQueue = sentences(text);
    reading = true; updateReadBtn();
    speakNext(readRun);
    var idle = 0;
    readPoll = setInterval(function () {           /* safety net if a voice errors without "onend" */
      var busy = 'speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending);
      idle = busy ? 0 : idle + 1;
      if (idle > 8) stopReading();
    }, 500);
  }
  $('#readBtn').addEventListener('click', readAloud);

  /* ---------------- group timer ---------------- */
  var timer = { total: state.timerMin * 60, left: state.timerMin * 60, running: false, endAt: 0, iv: null, done: false };
  function fmtTime(s) {
    s = Math.max(0, Math.ceil(s));
    var m = Math.floor(s / 60), r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }
  function renderTimerSeg() {
    var seg = $('#timerSeg');
    seg.innerHTML = '';
    seg.setAttribute('aria-label', t('timer_title'));
    TIMER_CHOICES.forEach(function (m) {
      seg.appendChild(el('button', { type: 'button', 'aria-pressed': String(m === state.timerMin), 'data-min': String(m), text: t('minutes_n', { n: EDU.fmt(m) }), onclick: function () { setTimerMin(m); } }));
    });
  }
  function setTimerMin(m) {
    state.timerMin = m; save('timerMin');
    resetTimer();
    renderTimerSeg();
  }
  function updateTimer() {
    $('#timerDisplay').textContent = fmtTime(timer.left);
    $('#timerBar').style.width = (100 * timer.left / timer.total) + '%';
    $('#timerStartIcon').textContent = timer.running ? '⏸' : '▶';
    $('#timerStartLabel').textContent = timer.running ? t('pause') : (timer.left < timer.total && timer.left > 0 ? t('resume') : t('start'));
    var box = $('#timer');
    box.classList.toggle('ending', timer.running && timer.left <= 10);
    box.classList.toggle('done', timer.done);
    var msg = $('#timerMsg');
    msg.hidden = !timer.done;
    msg.textContent = timer.done ? t('time_up') : '';
  }
  function tick() {
    timer.left = Math.max(0, (timer.endAt - Date.now()) / 1000);
    if (timer.left <= 0) {
      clearInterval(timer.iv); timer.iv = null; timer.running = false; timer.done = true; timer.left = 0;
      beep();
    }
    updateTimer();
  }
  function startPause() {
    if (timer.running) {
      timer.left = Math.max(0, (timer.endAt - Date.now()) / 1000);
      clearInterval(timer.iv); timer.iv = null; timer.running = false;
    } else {
      unlockAudio();                 /* inside the tap: iOS/Safari only allow sound from a context started by a user gesture */
      if (timer.left <= 0) { timer.left = timer.total; }
      timer.done = false;
      timer.endAt = Date.now() + timer.left * 1000;
      timer.running = true;
      timer.iv = setInterval(tick, 200);
    }
    updateTimer();
  }
  function resetTimer() {
    if (timer.iv) clearInterval(timer.iv);
    timer = { total: state.timerMin * 60, left: state.timerMin * 60, running: false, endAt: 0, iv: null, done: false };
    updateTimer();
  }
  var audioCtx = null;
  function unlockAudio() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === 'suspended' && audioCtx.resume) { var p = audioCtx.resume(); if (p && p.catch) p.catch(function () { }); }
      return audioCtx;
    } catch (e) { return null; }
  }
  function beep() {
    try {
      if (!unlockAudio()) return;
      var now = audioCtx.currentTime;
      [0, 0.35, 0.7].forEach(function (d) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, now + d);
        g.gain.exponentialRampToValueAtTime(0.25, now + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + d + 0.25);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(now + d); o.stop(now + d + 0.27);
      });
    } catch (e) { /* sound is optional */ }
  }
  $('#timerStart').addEventListener('click', startPause);
  $('#timerReset').addEventListener('click', resetTimer);

  /* ---------------- principles + all cards ---------------- */
  function cardsWith(p) { return CARDS.filter(function (c) { return c.p.indexOf(p) >= 0; }).length; }
  function renderPrinciples() {
    var box = $('#ptiles');
    box.innerHTML = '';
    PRINCIPLES.forEach(function (p) {
      box.appendChild(el('button', {
        class: 'ptile', type: 'button', style: { '--pc': 'var(' + PR[p].c + ')' }, 'data-p': p,
        onclick: function () { setFilter(p); var cc = $('#cardsCard'); if (cc.scrollIntoView) cc.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      },
        el('span', { class: 'pt-icon', 'aria-hidden': 'true', text: PR[p].icon }),
        el('span', { class: 'pt-name', text: pName(p) }),
        el('span', { class: 'pt-def', text: t('p_' + p + '_d') }),
        el('span', { class: 'pt-count', text: t('n_cards', { n: EDU.fmt(cardsWith(p)) }) + ' ›' })));
    });
  }
  function setFilter(f) { state.filter = f; save('filter'); renderTiles(); }
  function renderFilters() {
    var box = $('#filters');
    box.innerHTML = '';
    box.appendChild(el('span', { class: 'small muted', text: t('show_about') + ':' }));
    ['all'].concat(PRINCIPLES).forEach(function (f) {
      var label = f === 'all' ? t('filter_all') + ' (' + EDU.fmt(N) + ')' : pName(f) + ' (' + EDU.fmt(cardsWith(f)) + ')';
      box.appendChild(el('button', { class: 'chip', type: 'button', 'data-f': f, 'aria-pressed': String(state.filter === f), onclick: function () { setFilter(f); } },
        f === 'all' ? null : el('span', { 'aria-hidden': 'true', text: PR[f].icon }), label));
    });
  }
  function renderTiles() {
    renderFilters();
    var box = $('#tiles');
    box.innerHTML = '';
    CARDS.forEach(function (meta, i) {
      if (state.filter !== 'all' && meta.p.indexOf(state.filter) < 0) return;
      var done = !!state.discussed[meta.id];
      var total = sum(votesFor(i));
      box.appendChild(el('button', {
        class: 'tile' + (done ? ' done' : ''), type: 'button', 'data-i': String(i), 'aria-current': i === state.cur ? 'true' : null,
        onclick: function () { go(i, { scroll: true }); }
      },
        el('span', { class: 't-icon', 'aria-hidden': 'true', text: meta.icon }),
        el('span', {},
          el('span', { class: 't-no' },
            el('span', { text: t('card_n', { n: EDU.fmt(i + 1) }) }),
            total ? el('span', { class: 't-votes', text: '· ' + t('votes_n', { n: EDU.fmt(total) }) }) : null,
            done ? el('span', { class: 't-done' }, el('span', { 'aria-hidden': 'true', text: '✓ ' }), t('discussed')) : null),
          el('span', { class: 't-title', text: cardText(i).title }),
          el('span', { class: 't-p', 'aria-hidden': 'true', title: meta.p.map(pName).join(', '), text: meta.p.map(function (p) { return PR[p].icon; }).join(' ') }))));
    });
  }
  /* cheap refresh of the vote count on the current tile */
  function renderTilesLight() { renderTiles(); }

  /* ---------------- printing ---------------- */
  function printCard(i) {
    var meta = CARDS[i], c = cardText(i), opts = state.print;
    var optList = el('ul', { class: 'pc-opts' });
    c.options.concat([t('other_option') + ': ____________________']).forEach(function (o, k) {
      optList.appendChild(el('li', {}, el('span', { class: 'box', 'aria-hidden': 'true' }), el('span', { text: EDU.fmt(k + 1) + '. ' + o })));
    });
    var qs = el('ol', { class: 'pc-qs' });
    c.questions.forEach(function (q) { qs.appendChild(el('li', { text: q })); });
    var answer = null;
    if (opts.lines) {
      answer = el('div', { class: 'pc-answer' },
        el('p', { text: t('our_choice') }), el('div', { class: 'pc-line' }),
        el('p', { text: t('our_reason') }), el('div', { class: 'pc-line' }), el('div', { class: 'pc-line' }), el('div', { class: 'pc-line' }));
    }
    var consider = null;
    if (opts.teacher) {
      var ul = el('ul', {});
      c.consider.forEach(function (x) { ul.appendChild(el('li', { text: x })); });
      consider = el('div', { class: 'pc-consider' }, el('strong', { text: '💡 ' + t('consider_title') }), ul);
    }
    return el('article', { class: 'pcard' },
      el('div', { class: 'pc-head' },
        el('span', { class: 'pc-num', text: EDU.fmt(i + 1) }),
        el('span', { class: 'pc-icon', 'aria-hidden': 'true', text: meta.icon }),
        el('h2', { text: c.title })),
      el('p', { class: 'pc-prin' }, el('strong', { text: t('principles_at_stake') + ': ' }), meta.p.map(pName).join(' · ')),
      el('p', { class: 'pc-story', text: c.story }),
      el('h3', { text: t('vote_title') }), optList,
      el('h3', { text: t('discuss_title') }), qs,
      answer, consider,
      el('p', { class: 'pc-foot', text: t('brand') + ' · ' + t('app_title') }));
  }
  function renderPrint(all) {
    var area = $('#printArea');
    area.innerHTML = '';
    area.classList.toggle('lines', !!state.print.lines);
    if (all) {
      var rules = el('ul', { class: 'p-rules' });
      ['rule_1', 'rule_2', 'rule_3', 'rule_4'].forEach(function (k) { rules.appendChild(el('li', { text: t(k) })); });
      area.appendChild(el('div', { class: 'p-head' }, el('h1', { text: t('app_title') }), el('strong', { text: t('rules_title') + ': ' }), rules));
    }
    (all ? CARDS.map(function (_, i) { return i; }) : [state.cur]).forEach(function (i) { area.appendChild(printCard(i)); });
  }
  function openPrintDialog() {
    var p = { all: state.print.all, teacher: state.print.teacher, lines: state.print.lines };
    var seg = el('div', { class: 'seg', role: 'group' });
    function segBtn(val, key) {
      return el('button', { type: 'button', id: 'printScope-' + (val ? 'all' : 'this'), 'aria-pressed': String(p.all === val), text: t(key), onclick: function () {
        p.all = val; EDU.$$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', String(b === this)); }, this);
      } });
    }
    seg.appendChild(segBtn(false, 'print_this'));
    seg.appendChild(segBtn(true, 'print_all'));
    var cbT = el('input', { type: 'checkbox', id: 'printTeacher' }); cbT.checked = p.teacher;
    var cbL = el('input', { type: 'checkbox', id: 'printLines' }); cbL.checked = p.lines;
    var printGo = el('button', { class: 'btn btn-primary btn-lg', type: 'button', id: 'printGo' }, el('span', { 'aria-hidden': 'true', text: '🖨️ ' }), t('print'));
    var box = el('div', { class: 'stack' }, seg,
      el('label', { class: 'check', for: 'printTeacher' }, cbT, el('span', { text: t('print_teacher') })),
      el('label', { class: 'check', for: 'printLines' }, cbL, el('span', { text: t('print_lines') })),
      el('div', { class: 'row' }, printGo));
    var close = EDU.modal(box, { title: t('print_title') });
    printGo.addEventListener('click', function () {
      state.print = { all: p.all, teacher: cbT.checked, lines: cbL.checked };
      save('print');
      close();
      renderPrint(state.print.all);
      setTimeout(function () { window.print(); }, 60);
    });
  }
  window.addEventListener('afterprint', function () { renderPrint(false); });
  $('#printBtn').addEventListener('click', openPrintDialog);

  /* ---------------- present mode (projector / smartboard) ---------------- */
  function setPresenting(on) {
    document.documentElement.classList.toggle('presenting', on);
    $('#exitPresentBtn').hidden = !on;
  }
  $('#presentBtn').addEventListener('click', function () {
    setPresenting(true);
    if (!(document.fullscreenElement || document.webkitFullscreenElement)) EDU.fullscreen();
    window.scrollTo(0, 0);
    $('#exitPresentBtn').focus({ preventScroll: true });   /* the button just pressed is now hidden */
  });
  $('#exitPresentBtn').addEventListener('click', function () {
    setPresenting(false);
    if (document.fullscreenElement || document.webkitFullscreenElement) EDU.fullscreen();
    $('#presentBtn').focus({ preventScroll: true });
  });
  function onFsChange() { if (!(document.fullscreenElement || document.webkitFullscreenElement)) setPresenting(false); }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  /* ---------------- toolbar ---------------- */
  $('#prevBtn').addEventListener('click', function () { go(state.cur - 1); });
  $('#nextBtn').addEventListener('click', function () { go(state.cur + 1); });
  $('#randomBtn').addEventListener('click', randomCard);
  $('#jump').addEventListener('change', function () { go(parseInt(this.value, 10) || 0); });
  $('#clearVotesBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_clear_votes'))) return;
    delete state.votes[CARDS[state.cur].id];
    save('votes'); updateVotes(); renderTiles();
  });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    state.votes = {}; state.revealed = {}; state.discussed = {}; state.filter = 'all';
    ['votes', 'revealed', 'discussed', 'filter'].forEach(save);
    resetTimer();
    go(0);
  });

  /* keyboard: 1-5 vote (Shift = remove), arrows = card, R = random */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || (tg && tg.isContentEditable)) return;
    if (document.querySelector('.edu-modal-back')) return;
    var m = /^(Digit|Numpad)([1-9])$/.exec(e.code || '');
    var digit = m ? parseInt(m[2], 10) : (/^[1-9]$/.test(e.key) ? parseInt(e.key, 10) : 0);
    if (digit) { addVote(digit - 1, e.shiftKey ? -1 : 1); e.preventDefault(); return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var fwd = (e.key === 'ArrowRight') !== isRtl();
      go(state.cur + (fwd ? 1 : -1)); e.preventDefault(); return;
    }
    if (e.key === 'r' || e.key === 'R') { randomCard(); e.preventDefault(); }
  });

  /* ---------------- render everything ---------------- */
  function renderAll() {
    stopReading();
    renderCard();
    renderNav();
    renderTimerSeg();
    updateTimer();
    renderPrinciples();
    renderTiles();
    renderPrint(false);
  }
  EDU.onLang(renderAll);
  renderAll();
})();
