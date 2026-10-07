/* Workplace Scam & Cyber Drill: cyber-safety training for adults at work.
   Facts per scenario: data.js (window.DRILL_DATA). Words in 12 languages: content.js (window.APP_CONTENT).
   In message texts, [[code|words]] marks a red flag (or a safe sign when code is "ok").
   Everything stays on the device: EDU.store only, no server, no employee tracking. */
(function () {
  'use strict';
  var SLUG = 'workplace-scam-drill';
  var store = EDU.store(SLUG);
  var DATA = window.DRILL_DATA || [];
  var BY_ID = {};
  DATA.forEach(function (d) { BY_ID[d.id] = d; });
  var FLAG_ICON = { sender: '📵', urgent: '⏰', secret: '🤫', money: '💸', newacct: '🏦', link: '🔗', attach: '📎', otp: '🔑', threat: '😨', prize: '🎁', odd: '✍️', remote: '🖥️', upi: '📲', data: '🗂️', ok: '✅' };
  var CH_ICON = { email: '✉️', wa: '📱', sms: '💬', call: '📞', video: '📹', tg: '✈️', notif: '🔔', other: '📌' };
  var TEAM_COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c7)'];
  var MARK = /\[\[(\w+)\|([^\]]*)\]\]/g;
  var SENT_END = /[.!?।۔؟]+(?=\s|$)/g;
  var URL_RE = /((?:[a-z0-9-]+\.)+example\.(?:com|net|org)(?:\/[\w\-./?=&]*)?)/gi;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;

  /* ---------------- content helpers ---------------- */
  function C(id) {
    var all = window.APP_CONTENT || {};
    var L = all[EDU.lang] && all[EDU.lang].scenarios && all[EDU.lang].scenarios[id];
    return L || (all.en && all.en.scenarios && all.en.scenarios[id]) || { title: '', ctx: '', who: '', subject: '', text: '', why: '', todo: '' };
  }
  function parse(text) {
    var out = [], last = 0, m;
    text = String(text || '');
    MARK.lastIndex = 0;
    while ((m = MARK.exec(text))) {
      if (m.index > last) out.push({ code: null, s: text.slice(last, m.index) });
      out.push({ code: m[1], s: m[2] });
      last = MARK.lastIndex;
    }
    if (last < text.length) out.push({ code: null, s: text.slice(last) });
    return out;
  }
  function plain(text) { return String(text || '').replace(MARK, '$2'); }
  /* distinct red-flag codes of a scenario, numbered in reading order; the sender flag comes first */
  function flagsOf(d, text) {
    var list = [];
    if (d.senderFlag) list.push('sender');
    parse(text).forEach(function (s) { if (s.code && s.code !== 'ok' && list.indexOf(s.code) < 0) list.push(s.code); });
    return list;
  }
  function splitSentences(s) {
    var out = [], last = 0, m;
    SENT_END.lastIndex = 0;
    while ((m = SENT_END.exec(s))) { out.push(s.slice(last, m.index + m[0].length)); last = m.index + m[0].length; }
    if (last < s.length) out.push(s.slice(last));
    return out;
  }
  /* tappable pieces: every flagged phrase, and every sentence (or sentence fragment) in between.
     key: 'f:<code>:<n>' for flags (stable across languages), 'p:<i>' for plain pieces */
  function chunksOf(text) {
    var chunks = [], occ = {};
    parse(text).forEach(function (seg) {
      if (seg.code) {
        occ[seg.code] = (occ[seg.code] || 0) + 1;
        chunks.push({ code: seg.code, s: seg.s, key: 'f:' + seg.code + ':' + occ[seg.code] });
      } else {
        splitSentences(seg.s).forEach(function (p) { chunks.push({ code: null, s: p, key: 'p:' + chunks.length }); });
      }
    });
    return chunks;
  }
  function hasLetters(s) { return /\p{L}/u.test(s); }
  function n(x) { return EDU.fmt(x); }
  function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }

  /* Fake links never open; they stay left-to-right inside Urdu text. */
  function addText(parent, s, revealed) {
    var last = 0, m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(s))) {
      if (m.index > last) parent.appendChild(document.createTextNode(s.slice(last, m.index)));
      var u = el('span', { class: 'lnk ltr no-i18n', role: 'link', tabindex: '0', text: m[1] });
      u.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); EDU.toast(t(revealed ? 'link_tap' : 'link_game'), 4000); });
      parent.appendChild(u);
      last = URL_RE.lastIndex;
    }
    if (last < s.length) parent.appendChild(document.createTextNode(s.slice(last)));
  }

  /* click + Enter/Space on an inline role=button span (a real <button> cannot flow inside a sentence) */
  function onPress(node, fn) {
    node.addEventListener('click', function (e) { if (e.target.closest('.lnk')) return; fn(); });
    node.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  }

  /* ---------------- mock message card ----------------
     opts: { interactive, revealed, marked (Set of keys), onMark(key, on), onFlag(code), big, id } */
  function card(d, o) {
    o = o || {};
    var c = C(d.id), codes = flagsOf(d, c.text), nums = {};
    codes.forEach(function (f, i) { nums[f] = i + 1; });
    var marked = o.marked || new Set();

    function flagBtn(code, key, content) {
      var found = marked.has(key);
      var b = el('span', { role: 'button', tabindex: '0', class: 'chunk ' + (code === 'ok' ? 'ok' : 'rf') + (found ? ' found' : ''), title: t('flag_' + code), 'data-code': code, 'data-key': key }, content);
      if (code !== 'ok') b.appendChild(el('span', { class: 'fnum' + (found ? ' tick' : ''), 'aria-hidden': 'true', text: found ? '✓' + nums[code] : String(nums[code]) }));
      else b.appendChild(el('span', { class: 'fnum ok', 'aria-hidden': 'true', text: '✓' }));
      onPress(b, function () { if (o.onFlag) o.onFlag(code, b); });
      return b;
    }
    function liveBtn(key, content, code) {
      var b = el('span', { role: 'button', tabindex: '0', class: 'chunk live', 'aria-pressed': marked.has(key) ? 'true' : 'false', 'data-key': key, 'data-code': code || null }, content);
      onPress(b, function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (o.onMark) o.onMark(key, on);
      });
      return b;
    }

    /* sender line */
    var fromText = el('bdi', { class: 'ltr no-i18n', text: d.from });
    var fromNode = fromText;
    if (d.from && o.interactive && !o.revealed) fromNode = liveBtn('f:sender:1', fromText, d.senderFlag ? 'sender' : null);
    else if (d.from && o.revealed && d.senderFlag) fromNode = flagBtn('sender', 'f:sender:1', fromText);

    var isEmail = d.ch === 'email';
    var nameEl = el('div', { class: 'mock-name' }, c.who ? el('span', { text: c.who }) : (isEmail ? el('span', { text: t('ch_email') }) : fromNode));
    var subEl = el('div', { class: 'mock-sub' }, (c.who && d.from && !isEmail) ? [fromNode, ' · '] : null, el('span', { text: t('ch_' + d.ch) }));
    var head = el('div', { class: 'mock-head' },
      el('span', { class: 'mock-av', 'aria-hidden': 'true', text: CH_ICON[d.ch] || '💬' }),
      el('div', { class: 'mock-who' }, nameEl, subEl),
      el('span', { class: 'mock-time no-i18n', text: d.time }));

    /* message text as chunks */
    var body = el('p', { class: 'msg-text no-i18n mb0' });
    var chunks = chunksOf(c.text);
    chunks.forEach(function (ch, i) {
      var raw = ch.s, txt = raw.trim();
      if (!txt) return;
      var node;
      if (!hasLetters(txt) && !ch.code) node = document.createTextNode(txt);
      else if (!o.revealed) {
        if (o.interactive) { node = liveBtn(ch.key, null, ch.code); addText(node, txt, false); }
        else { node = el('span'); addText(node, txt, false); }
      } else if (ch.code) {
        node = flagBtn(ch.code, ch.key, null);
        var inner = el('span'); addText(inner, txt, true); node.insertBefore(inner, node.firstChild);
      } else { node = el('span'); addText(node, txt, true); }
      body.appendChild(node);
      var next = chunks[i + 1];
      if (/\s$/.test(raw) || (next && /^\s/.test(next.s))) body.appendChild(document.createTextNode(' '));
    });

    var bubble = el('div', { class: 'bubble' });
    if (isEmail) {
      bubble.appendChild(el('dl', { class: 'email-meta' },
        el('dt', { text: t('em_from') }), el('dd', null, fromNode),
        el('dt', { text: t('em_to') }), el('dd', null, el('bdi', { class: 'ltr no-i18n', text: d.to || '' })),
        el('dt', { text: t('em_subject') }), el('dd', { class: 'subj no-i18n', text: c.subject || '' })));
    }
    if (d.ch === 'call' || d.ch === 'video') bubble.appendChild(el('div', { class: 'call-live' }, el('span', { class: 'dot', 'aria-hidden': 'true' }), el('span', { text: t(d.ch === 'video' ? 'live_video' : 'live_call') })));
    bubble.appendChild(body);
    if (d.attach) bubble.appendChild(el('div', { class: 'attach-chip' }, '📎 ', el('span', { class: 'no-i18n', text: d.attach })));
    var screen = el('div', { class: 'mock-body' }, bubble);
    return el('article', { class: 'mock ch-' + d.ch + (o.big ? ' big' : '') + (o.revealed ? ' rev' : ''), id: o.id || null, 'data-id': d.id, 'aria-label': t('ch_' + d.ch) }, head, screen);
  }

  function readAloudBtn(d) {
    return el('button', { type: 'button', class: 'btn btn-sm', onclick: function () {
      var c = C(d.id);
      EDU.speak(plain((c.who ? c.who + '. ' : '') + (c.subject ? c.subject + '. ' : '') + c.text)).then(function (ok) { if (!ok) EDU.toast(t('no_voice')); });
    } }, '🔊 ', el('span', { text: t('read_aloud') }));
  }

  /* Explanation block shown after the answer. marked = Set of keys the user tapped (or null) */
  function revealInfo(d, marked, explainBox) {
    var c = C(d.id), box = el('div', { class: 'stack reveal' });
    if (d.scam) {
      var flags = flagsOf(d, c.text), foundKeys = {};
      if (marked) marked.forEach(function (k) { var p = k.split(':'); if (p[0] === 'f' && p[1] !== 'ok') foundKeys[p[1]] = true; });
      box.appendChild(el('h3', { class: 'rf-head', text: '🚩 ' + t('red_flags') + ' (' + n(flags.length) + ')' }));
      var ol = el('ol', { class: 'flags', id: 'flagList' });
      flags.forEach(function (f, i) {
        ol.appendChild(el('li', { 'data-code': f },
          el('span', { class: 'fnum', text: String(i + 1) }),
          el('span', { class: 'fi', 'aria-hidden': 'true', text: FLAG_ICON[f] || '🚩' }),
          el('div', null, el('strong', { text: t('flag_' + f) }), marked ? el('span', { class: foundKeys[f] ? 'found-tag' : 'missed-tag', text: ' ' + t(foundKeys[f] ? 'flag_found' : 'flag_missed') }) : null, el('small', { text: t('fdesc_' + f) }))));
      });
      box.appendChild(ol);
      box.appendChild(el('p', { class: 'small muted mb0', text: t('tap_flag_hint') }));
      box.appendChild(el('div', null, el('h3', { text: t('why') }), el('p', { class: 'mb0', text: c.why })));
    } else {
      box.appendChild(el('h3', { class: 'ok-head', text: '✅ ' + t('safe_signs') }));
      box.appendChild(el('ul', { class: 'flags safe' }, el('li', null, el('span', { class: 'fi', 'aria-hidden': 'true', text: '✅' }), el('div', null, el('span', { text: c.why })))));
    }
    box.appendChild(el('div', { class: 'callout accent' }, el('strong', { text: '👉 ' + t('what_to_do') }), el('p', { class: 'mb0', text: c.todo })));
    return box;
  }
  /* shows the explanation of one tapped flag */
  function explain(box, code) {
    box.hidden = false;
    box.innerHTML = '';
    box.className = 'card explain ' + (code === 'ok' ? 'ok-box' : 'rf-box');
    box.appendChild(el('span', { class: 'fi', 'aria-hidden': 'true', text: FLAG_ICON[code] || '🚩' }));
    box.appendChild(el('div', null, el('strong', { text: (code === 'ok' ? t('safe_sign') : t('red_flag')) + ': ' + t('flag_' + code) }), el('p', { class: 'mb0 small', text: t('fdesc_' + code) })));
    $$('#flagList li').forEach(function (li) { li.classList.toggle('hit', li.getAttribute('data-code') === code); });
  }

  /* ---------------- tabs ---------------- */
  var TABS = ['drill', 'team', 'todo', 'cert'];
  var activeTab = store.get('tab', 'drill');
  if (TABS.indexOf(activeTab) < 0) activeTab = 'drill';
  function showTab(name) {
    if (name !== activeTab) EDU.stopSpeaking();
    activeTab = name;
    store.set('tab', name);
    TABS.forEach(function (x) {
      $('#tab-' + x).setAttribute('aria-selected', x === name ? 'true' : 'false');
      $('#tab-' + x).tabIndex = x === name ? 0 : -1;
      $('#panel-' + x).hidden = x !== name;
    });
    renderAll();
  }
  TABS.forEach(function (x, i) {
    var b = $('#tab-' + x);
    b.addEventListener('click', function () { showTab(x); });
    b.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      if (document.documentElement.dir === 'rtl') dir = -dir;
      var nx = TABS[(i + dir + TABS.length) % TABS.length];
      showTab(nx); $('#tab-' + nx).focus();
    });
  });

  /* ---------------- drill (self practice) ---------------- */
  var drill = loadDrill();
  function newDrillState(shuffled) {
    var ids = DATA.map(function (d) { return d.id; });
    if (shuffled) ids = EDU.shuffle(ids);
    return { order: ids, idx: 0, answers: {}, done: false, shuffled: !!shuffled };
  }
  function loadDrill() {
    var g = store.get('drill', null);
    if (!g || !Array.isArray(g.order) || g.order.length !== DATA.length || g.order.some(function (id) { return !BY_ID[id]; })) return newDrillState(false);
    if (!g.answers || typeof g.answers !== 'object') g.answers = {};
    g.idx = EDU.clamp(parseInt(g.idx, 10) || 0, 0, g.order.length - 1);
    Object.keys(g.answers).forEach(function (id) {
      var a = g.answers[id];
      if (!a || (a.v !== 'scam' && a.v !== 'safe') || !BY_ID[id]) { delete g.answers[id]; return; }
      if (!Array.isArray(a.marked)) a.marked = [];
    });
    return g;
  }
  function saveDrill() { store.set('drill', drill); }
  function drillScore() {
    var s = 0;
    Object.keys(drill.answers).forEach(function (id) { if ((drill.answers[id].v === 'scam') === BY_ID[id].scam) s++; });
    return s;
  }
  function flagsFound(a, d) {
    if (!d.scam) return 0;
    var codes = flagsOf(d, C(d.id).text), found = 0;
    codes.forEach(function (f) { if (a.marked.some(function (k) { return k.indexOf('f:' + f + ':') === 0; })) found++; });
    return found;
  }
  function flagTotals() {
    var found = 0, total = 0;
    DATA.forEach(function (d) {
      if (!d.scam) return;
      total += flagsOf(d, C(d.id).text).length;
      var a = drill.answers[d.id];
      if (a) found += flagsFound(a, d);
    });
    return { found: found, total: total };
  }
  function answeredCount() { return Object.keys(drill.answers).length; }
  /* result of the last finished drill, used by the certificate */
  function saveResult() {
    var ft = flagTotals();
    store.set('lastResult', { score: drillScore(), n: DATA.length, found: ft.found, total: ft.total, date: new Date().toISOString().slice(0, 10) });
  }

  var liveMarks = new Set();      // marks of the current, unanswered scenario
  function currentId() { return drill.order[drill.idx]; }

  function renderDrill() {
    var root = $('#drill'), res = $('#results');
    root.innerHTML = '';
    if (drill.done) { root.hidden = true; res.hidden = false; renderResults(); return; }
    root.hidden = false; res.hidden = true;
    var id = currentId(), d = BY_ID[id], c = C(id), a = drill.answers[id] || null;
    var revealed = !!a;
    var marked = revealed ? new Set(a.marked) : liveMarks;
    var answered = answeredCount();

    /* top bar */
    var ft = flagTotals();
    var top = el('div', { class: 'topbar' },
      el('span', { class: 'pill', text: t('drill_progress', { n: n(drill.idx + 1), total: n(DATA.length) }) }),
      el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(DATA.length), 'aria-valuenow': String(answered), 'aria-label': t('answered_n', { n: n(answered), total: n(DATA.length) }) }, el('span', { style: { width: pct(answered, DATA.length) + '%' } })),
      el('span', { class: 'pill good' }, '🏆 ', el('span', { text: t('score') + ': ' }), el('b', { id: 'score', text: n(drillScore()) }), el('span', { class: 'muted', text: ' / ' + n(answered) })),
      el('span', { class: 'pill' }, '🚩 ', el('b', { id: 'flagsFound', text: n(ft.found) }), el('span', { class: 'muted small', text: ' ' + t('flags_found') })),
      el('button', { type: 'button', class: 'btn btn-sm', id: 'prevBtn', disabled: drill.idx === 0, onclick: function () { go(drill.idx - 1); } }, el('span', { class: 'flip', 'aria-hidden': 'true', text: '◀' }), ' ', el('span', { text: t('previous') })),
      el('button', { type: 'button', class: 'btn btn-sm', id: 'skipBtn', disabled: drill.idx >= DATA.length - 1, onclick: function () { go(drill.idx + 1); } }, el('span', { text: t('next') }), ' ', el('span', { class: 'flip', 'aria-hidden': 'true', text: '▶' })),
      el('button', { type: 'button', class: 'btn btn-sm', id: 'shuffleBtn', title: t('shuffle_hint'), onclick: function () { if (!confirm(t('confirm_restart'))) return; drill = newDrillState(true); liveMarks = new Set(); saveDrill(); renderDrill(); } }, '🔀 ', el('span', { text: t('shuffle') })),
      el('button', { type: 'button', class: 'btn btn-sm btn-danger', id: 'restartBtn', onclick: function () { if (!confirm(t('confirm_restart'))) return; drill = newDrillState(false); liveMarks = new Set(); saveDrill(); renderDrill(); } }, el('span', { text: t('restart') })));
    root.appendChild(top);

    /* left: scenario card */
    var left = el('div', null,
      el('p', { class: 'ctx' }, el('span', { class: 'badge primary', text: t('cat_' + d.cat) }), el('span', { class: 'muted', text: c.ctx })),
      el('h2', { class: 'mb0', id: 'scTitle', style: { fontSize: '1.2rem', margin: '0 0 10px' }, text: c.title }));
    var mock = card(d, { interactive: !revealed, revealed: revealed, marked: marked, id: 'card',
      onMark: function (key, on) { if (on) liveMarks.add(key); else liveMarks.delete(key); $('#markedN').textContent = t('marked_n', { n: n(liveMarks.size) }); },
      onFlag: function (code) { explain($('#flagExplain'), code); } });
    left.appendChild(mock);
    if (!revealed) left.appendChild(el('div', { class: 'mark-hint' }, el('span', { class: 'muted', text: t('step_mark_hint') }), el('span', { class: 'badge', id: 'markedN', text: t('marked_n', { n: n(liveMarks.size) }) })));
    else left.appendChild(el('div', { class: 'mark-hint' }, readAloudBtn(d)));
    var explainBox = el('div', { class: 'card explain', id: 'flagExplain', 'aria-live': 'polite', hidden: true });
    left.appendChild(el('div', { style: { marginTop: '12px', maxWidth: '480px', marginInline: 'auto' } }, explainBox));

    /* right: steps */
    var right = el('div', { class: 'steps', id: 'stepPanel' });
    if (!revealed) {
      right.appendChild(el('section', { class: 'card' },
        el('h3', { class: 'step', 'data-step': '1', text: t('step_mark') }),
        el('p', { class: 'muted small mb0', text: t('step_mark_more') })));
      right.appendChild(el('section', { class: 'card' },
        el('h3', { class: 'step', 'data-step': '2', id: 'ask', tabindex: '-1', text: t('step_verdict') }),
        el('div', { class: 'answers' },
          el('button', { type: 'button', class: 'btn ans ans-safe', id: 'ansSafe', onclick: function () { answer('safe'); } }, el('span', { class: 'ic', 'aria-hidden': 'true', text: '✅' }), el('span', { text: t('ans_safe') })),
          el('button', { type: 'button', class: 'btn ans ans-scam', id: 'ansScam', onclick: function () { answer('scam'); } }, el('span', { class: 'ic', 'aria-hidden': 'true', text: '🚩' }), el('span', { text: t('ans_scam') }))),
        el('p', { class: 'tiny muted mb0', style: { marginTop: '8px' }, text: t('kbd_hint') })));
    } else {
      var right1 = (a.v === 'scam') === d.scam;
      var vk = right1 ? (d.scam ? 'verdict_right_scam' : 'verdict_right_safe') : (d.scam ? 'verdict_wrong_scam' : 'verdict_wrong_safe');
      var vcard = el('section', { class: 'card callout ' + (right1 ? 'success' : 'danger'), id: 'verdict', 'data-right': right1 ? '1' : '0', 'aria-live': 'polite' },
        el('p', { class: 'verdict-big', text: (right1 ? '🎉 ' : '🤔 ') + t(vk) }));
      if (d.scam) {
        var fl = flagsOf(d, c.text).length;
        vcard.appendChild(el('p', { class: 'mb0', id: 'flagsResult', text: t('flags_result', { found: n(flagsFound(a, d)), total: n(fl) }) }));
      }
      right.appendChild(vcard);
      right.appendChild(el('section', { class: 'card' }, revealInfo(d, marked, explainBox)));
      var last = drill.idx >= DATA.length - 1 || answeredCount() >= DATA.length;
      right.appendChild(el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'next', onclick: function () { nextScenario(); } }, el('span', { text: t(last ? 'finish' : 'next_scenario') }), ' ', el('span', { class: 'flip', 'aria-hidden': 'true', text: '▶' }))));
    }
    root.appendChild(el('div', { class: 'board' }, left, right));
  }

  function answer(v) {
    var id = currentId();
    if (drill.answers[id]) return;
    drill.answers[id] = { v: v, marked: Array.from(liveMarks) };
    liveMarks = new Set();
    saveDrill();
    renderDrill();
    var nb = $('#next'); if (nb) nb.focus({ preventScroll: true });
    scrollToEl($('#stepPanel'));
  }
  function nextScenario() {
    /* go to the next unanswered scenario; when all are answered, show the results */
    if (answeredCount() >= DATA.length) { drill.done = true; saveDrill(); saveResult(); renderDrill(); scrollToEl($('#results')); return; }
    var i = drill.idx + 1;
    while (i < DATA.length && drill.answers[drill.order[i]]) i++;
    if (i >= DATA.length) { i = 0; while (i < DATA.length && drill.answers[drill.order[i]]) i++; }
    go(Math.min(i, DATA.length - 1));
  }
  function go(i) {
    EDU.stopSpeaking();
    drill.idx = EDU.clamp(i, 0, DATA.length - 1);
    liveMarks = new Set();
    saveDrill();
    renderDrill();
    scrollToEl($('#drill'));
    var q = $('#ask'); if (q) q.focus({ preventScroll: true });
  }
  function headerBottom() { var h = $('.edu-top'); return h && h.offsetHeight ? Math.max(0, h.getBoundingClientRect().bottom) : 0; }
  function scrollToEl(e) {
    if (!e) return;
    var y = window.pageYOffset + e.getBoundingClientRect().top - headerBottom() - 8;
    if (e.getBoundingClientRect().top >= headerBottom() && e.getBoundingClientRect().top < window.innerHeight * 0.6) return;
    try { window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); } catch (x) { window.scrollTo(0, Math.max(0, y)); }
  }

  function renderResults() {
    var res = $('#results');
    res.innerHTML = '';
    var score = drillScore(), ft = flagTotals(), p = pct(score, DATA.length);
    var msg = p >= 85 ? 'results_msg_high' : p >= 60 ? 'results_msg_mid' : 'results_msg_low';
    var wrap = el('section', { class: 'card', 'aria-live': 'polite' },
      el('h2', { text: '🏁 ' + t('results_title') }),
      el('div', { class: 'result-nums' },
        el('div', { class: 'rn' }, el('b', { id: 'finalScore', text: n(score) + ' / ' + n(DATA.length) }), el('span', { text: t('results_score', { pct: n(p) }) })),
        el('div', { class: 'rn' }, el('b', { id: 'finalFlags', text: n(ft.found) + ' / ' + n(ft.total) }), el('span', { text: t('results_flags') }))),
      el('p', { class: 'callout ' + (p >= 85 ? 'success' : p >= 60 ? 'accent' : 'warning'), text: t(msg) }),
      el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'getCert', onclick: function () { showTab('cert'); window.scrollTo(0, 0); } }, '🏅 ', el('span', { text: t('get_cert') })),
        el('button', { type: 'button', class: 'btn', id: 'playAgain', onclick: function () { drill = newDrillState(true); liveMarks = new Set(); saveDrill(); renderDrill(); window.scrollTo(0, 0); } }, '🔀 ', el('span', { text: t('play_again') }))));
    var list = el('ul', { class: 'review', id: 'review' });
    drill.order.forEach(function (id, i) {
      var d = BY_ID[id], c = C(id), a = drill.answers[id];
      var good = a && (a.v === 'scam') === d.scam;
      var row = el('button', { type: 'button', class: 'review-row ' + (good ? 'good' : 'badr'), 'data-id': id, onclick: function () { drill.done = false; drill.idx = i; saveDrill(); renderDrill(); window.scrollTo(0, 0); } },
        el('span', { class: 'mark', 'aria-hidden': 'true', text: good ? '✅' : '❌' }),
        el('div', null, el('div', { class: 'who', text: c.title }),
          el('div', { class: 'snip', text: t(good ? 'rev_right' : 'rev_wrong') + (d.scam ? ' · ' + t('flags_result', { found: n(a ? flagsFound(a, d) : 0), total: n(flagsOf(d, c.text).length) }) : '') })),
        el('span', { class: 'badge ' + (d.scam ? 'danger' : 'success'), text: d.scam ? t('ans_scam') : t('ans_safe') }));
      list.appendChild(el('li', null, row));
    });
    wrap.appendChild(el('h3', { text: t('review_title') }));
    wrap.appendChild(el('p', { class: 'small muted', text: t('review_hint') }));
    wrap.appendChild(list);
    res.appendChild(wrap);
  }

  /* keyboard: 1 = genuine, 2 = scam (only in the drill, not inside inputs) */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (activeTab !== 'drill' || drill.done) return;
    if (e.key === '1' && $('#ansSafe')) { e.preventDefault(); answer('safe'); }
    else if (e.key === '2' && $('#ansScam')) { e.preventDefault(); answer('scam'); }
  });

  /* ---------------- team quiz (projector) ---------------- */
  var team = loadTeam();
  var timer = { left: 0, total: 60, running: false, iv: null, done: false };
  function loadTeam() {
    var g = store.get('team', null);
    var def = { stage: 'setup', nTeams: 3, names: [], secs: 60, count: 10, order: [], idx: 0, revealed: false, awards: {} };
    if (!g || typeof g !== 'object') return def;
    g.nTeams = EDU.clamp(parseInt(g.nTeams, 10) || 3, 2, 6);
    if (!Array.isArray(g.names)) g.names = [];
    g.names = g.names.slice(0, 6).map(function (x) { return String(x || '').slice(0, 30); });
    if ([30, 60, 90].indexOf(g.secs) < 0) g.secs = 60;
    if ([6, 10, DATA.length].indexOf(g.count) < 0) g.count = 10;
    if (g.stage !== 'play' && g.stage !== 'done') g.stage = 'setup';
    if (!Array.isArray(g.order) || g.order.some(function (id) { return !BY_ID[id]; })) { g.order = []; g.stage = 'setup'; }
    if (g.stage !== 'setup' && !g.order.length) g.stage = 'setup';
    g.idx = EDU.clamp(parseInt(g.idx, 10) || 0, 0, Math.max(0, g.order.length - 1));
    if (!g.awards || typeof g.awards !== 'object') g.awards = {};
    g.revealed = !!g.revealed;
    return g;
  }
  function saveTeam() { store.set('team', team); }
  function teamName(i) { return (team.names[i] || '').trim() || t('team_name', { n: n(i + 1) }); }
  function teamScore(i) { var s = 0; Object.keys(team.awards).forEach(function (k) { if ((team.awards[k] || []).indexOf(i) >= 0) s++; }); return s; }
  function pickOrder(count) {
    var safe = EDU.shuffle(DATA.filter(function (d) { return !d.scam; })), scam = EDU.shuffle(DATA.filter(function (d) { return d.scam; }));
    if (count >= DATA.length) return EDU.shuffle(DATA).map(function (d) { return d.id; });
    var nSafe = Math.max(2, Math.round(count * safe.length / DATA.length));
    return EDU.shuffle(safe.slice(0, nSafe).concat(scam.slice(0, count - nSafe))).map(function (d) { return d.id; });
  }
  function stopTimer() { if (timer.iv) clearInterval(timer.iv); timer.iv = null; timer.running = false; }
  function resetTimer() { stopTimer(); timer.total = team.secs; timer.left = team.secs; timer.done = false; paintTimer(); }
  function paintTimer() {
    var box = $('#timer'); if (!box) return;
    var m = Math.floor(timer.left / 60), s = timer.left % 60;
    $('#timerDisplay', box).textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    $('#timerBar', box).style.width = (timer.total ? timer.left * 100 / timer.total : 0) + '%';
    box.classList.toggle('ending', timer.left > 0 && timer.left <= 10);
    box.classList.toggle('done', timer.left === 0 && timer.done);
    var msg = $('#timerMsg', box); msg.hidden = !(timer.left === 0 && timer.done); msg.textContent = t('times_up');
    $('#timerStartLabel', box).textContent = t(timer.running ? 'pause' : (timer.left === timer.total ? 'start' : 'resume'));
    $('#timerStartIcon', box).textContent = timer.running ? '⏸' : '▶';
    $('#timerStart', box).disabled = timer.left === 0;
  }
  function toggleTimer() {
    if (timer.running) { stopTimer(); paintTimer(); return; }
    if (timer.left <= 0) return;
    timer.running = true;
    timer.iv = setInterval(function () {
      timer.left--;
      if (timer.left <= 0) { timer.left = 0; timer.done = true; stopTimer(); }
      paintTimer();
    }, 1000);
    paintTimer();
  }

  function renderTeam() {
    var root = $('#panel-team');
    root.innerHTML = '';
    if (team.stage === 'setup') { stopTimer(); renderTeamSetup(root); }
    else if (team.stage === 'play') renderTeamPlay(root);
    else renderTeamDone(root);
  }
  function renderTeamSetup(root) {
    var card1 = el('section', { class: 'card stack' },
      el('h2', { text: '📽️ ' + t('team_setup_title') }),
      el('p', { class: 'muted mb0', text: t('team_setup_hint') }));
    var grid = el('div', { class: 'grid-2' });
    var left = el('div', { class: 'stack' });
    var segT = el('div', { class: 'seg', role: 'group', 'aria-label': t('teams_n') });
    for (var k = 2; k <= 6; k++) (function (k) {
      segT.appendChild(el('button', { type: 'button', 'data-n': String(k), 'aria-pressed': team.nTeams === k ? 'true' : 'false', text: n(k), onclick: function () { team.nTeams = k; saveTeam(); renderTeam(); } }));
    })(k);
    left.appendChild(el('div', { class: 'field' }, el('span', { text: t('teams_n') }), segT));
    var list = el('div', { class: 'team-list', id: 'teamNames' });
    for (var i = 0; i < team.nTeams; i++) (function (i) {
      var inp = el('input', { type: 'text', class: 'no-i18n', id: 'team' + i, maxlength: '30', value: team.names[i] || '', placeholder: t('team_name', { n: n(i + 1) }), 'aria-label': t('team_name_label') + ' ' + n(i + 1) });
      inp.addEventListener('input', function () { team.names[i] = inp.value; saveTeam(); });
      list.appendChild(el('div', { class: 'team-row' }, el('span', { class: 'team-dot', style: { '--tc': TEAM_COLORS[i] }, 'aria-hidden': 'true' }), inp));
    })(i);
    left.appendChild(list);
    var right = el('div', { class: 'stack' });
    var segS = el('div', { class: 'seg', role: 'group', 'aria-label': t('timer_label') });
    [30, 60, 90].forEach(function (s) {
      segS.appendChild(el('button', { type: 'button', 'data-sec': String(s), 'aria-pressed': team.secs === s ? 'true' : 'false', text: t('sec_n', { n: n(s) }), onclick: function () { team.secs = s; saveTeam(); renderTeam(); } }));
    });
    right.appendChild(el('div', { class: 'field' }, el('span', { text: t('timer_label') }), segS));
    var segC = el('div', { class: 'seg', role: 'group', 'aria-label': t('scenarios_n') });
    [6, 10, DATA.length].forEach(function (cnt) {
      segC.appendChild(el('button', { type: 'button', 'data-count': String(cnt), 'aria-pressed': team.count === cnt ? 'true' : 'false', text: cnt === DATA.length ? t('all_scenarios') + ' (' + n(cnt) + ')' : n(cnt), onclick: function () { team.count = cnt; saveTeam(); renderTeam(); } }));
    });
    right.appendChild(el('div', { class: 'field' }, el('span', { text: t('scenarios_n') }), segC));
    right.appendChild(el('p', { class: 'small muted mb0', text: t('team_rules') }));
    grid.appendChild(left); grid.appendChild(right);
    card1.appendChild(grid);
    card1.appendChild(el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'teamStart', onclick: function () {
        team.order = pickOrder(team.count); team.idx = 0; team.revealed = false; team.awards = {}; team.stage = 'play'; saveTeam(); resetTimer(); renderTeam(); window.scrollTo(0, 0);
      } }, '▶ ', el('span', { text: t('start_quiz') })),
      el('button', { type: 'button', class: 'btn', id: 'presentBtn', onclick: togglePresent }, '⛶ ', el('span', { text: t('fullscreen') }))));
    root.appendChild(card1);
  }
  function renderTeamPlay(root) {
    var id = team.order[team.idx], d = BY_ID[id], c = C(id);
    var top = el('div', { class: 'topbar' },
      el('span', { class: 'pill', id: 'teamProgress', text: t('drill_progress', { n: n(team.idx + 1), total: n(team.order.length) }) }),
      el('div', { class: 'progress' }, el('span', { style: { width: pct(team.idx, team.order.length) + '%' } })),
      el('button', { type: 'button', class: 'btn btn-sm', id: 'presentBtn', onclick: togglePresent }, '⛶ ', el('span', { text: t(document.documentElement.classList.contains('presenting') ? 'exit_present' : 'fullscreen') })),
      el('button', { type: 'button', class: 'btn btn-sm btn-danger tool-extra', id: 'teamEnd', onclick: function () { if (!confirm(t('confirm_end_quiz'))) return; team.stage = 'done'; saveTeam(); stopTimer(); renderTeam(); } }, el('span', { text: t('end_quiz') })));
    root.appendChild(top);

    var left = el('div', null,
      el('p', { class: 'ctx' }, el('span', { class: 'badge primary', text: t('cat_' + d.cat) }), el('span', { class: 'muted', text: c.ctx })),
      el('h2', { style: { fontSize: '1.25rem', margin: '0 0 10px' }, text: c.title }));
    var explainBox = el('div', { class: 'card explain', id: 'teamExplain', 'aria-live': 'polite', hidden: true });
    left.appendChild(card(d, { interactive: false, revealed: team.revealed, id: 'teamCard', big: true, onFlag: function (code) { explain(explainBox, code); } }));
    left.appendChild(el('div', { class: 'mark-hint' }, readAloudBtn(d)));
    left.appendChild(el('div', { style: { marginTop: '12px' } }, explainBox));

    var side = el('div', { class: 'steps', id: 'teamSide' });
    if (!team.revealed) {
      var tbox = el('div', { class: 'timer card', id: 'timer' },
        el('h3', { class: 'step', 'data-step': '1', text: t('team_step_decide') }),
        el('div', { class: 'timer-big', id: 'timerDisplay', role: 'timer', 'aria-label': t('time_left') }),
        el('div', { class: 'progress' }, el('span', { id: 'timerBar' })),
        el('div', { class: 'row', style: { marginTop: '10px' } },
          el('button', { type: 'button', class: 'btn btn-primary', id: 'timerStart', onclick: toggleTimer }, el('span', { id: 'timerStartIcon', 'aria-hidden': 'true', text: '▶' }), ' ', el('span', { id: 'timerStartLabel' })),
          el('button', { type: 'button', class: 'btn', id: 'timerReset', onclick: resetTimer }, '↺ ', el('span', { text: t('reset') }))),
        el('p', { class: 'callout accent mb0', id: 'timerMsg', 'aria-live': 'assertive', hidden: true, style: { marginTop: '10px' } }));
      side.appendChild(tbox);
      side.appendChild(el('section', { class: 'card' },
        el('h3', { class: 'step', 'data-step': '2', text: t('team_step_reveal') }),
        el('div', { class: 'answers' },
          el('span', { class: 'btn ans ans-safe', 'aria-hidden': 'true' }, el('span', { class: 'ic', text: '✅' }), el('span', { text: t('ans_safe') })),
          el('span', { class: 'btn ans ans-scam', 'aria-hidden': 'true' }, el('span', { class: 'ic', text: '🚩' }), el('span', { text: t('ans_scam') }))),
        el('button', { type: 'button', class: 'btn btn-primary btn-lg w100', id: 'reveal', style: { marginTop: '12px' }, onclick: function () { stopTimer(); team.revealed = true; saveTeam(); renderTeam(); } }, '💡 ', el('span', { text: t('reveal') }))));
    } else {
      var v = el('section', { class: 'card callout ' + (d.scam ? 'danger' : 'success'), id: 'teamVerdict', 'data-scam': d.scam ? '1' : '0', 'aria-live': 'polite' },
        el('p', { class: 'verdict-big mb0', text: (d.scam ? '🚩 ' : '✅ ') + t(d.scam ? 'answer_scam' : 'answer_safe') }));
      side.appendChild(v);
      var awards = team.awards[team.idx] || [];
      var aw = el('div', { class: 'award', id: 'award' });
      for (var i = 0; i < team.nTeams; i++) (function (i) {
        var on = awards.indexOf(i) >= 0;
        aw.appendChild(el('button', { type: 'button', class: 'btn', 'data-team': String(i), 'aria-pressed': on ? 'true' : 'false', style: { '--tc': TEAM_COLORS[i] }, onclick: function () {
          var list = team.awards[team.idx] || [];
          var j = list.indexOf(i);
          if (j >= 0) list.splice(j, 1); else list.push(i);
          team.awards[team.idx] = list; saveTeam(); renderTeam();
        } }, el('span', { 'aria-hidden': 'true', text: on ? '✓' : '+1' }), el('span', { class: 'no-i18n', text: teamName(i) })));
      })(i);
      side.appendChild(el('section', { class: 'card' }, el('h3', { class: 'step', 'data-step': '3', text: t('award_hint') }), aw));
      side.appendChild(el('section', { class: 'card' }, revealInfo(d, null, explainBox)));
      var last = team.idx >= team.order.length - 1;
      side.appendChild(el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'teamNext', onclick: function () {
          if (last) { team.stage = 'done'; } else { team.idx++; team.revealed = false; }
          saveTeam(); resetTimer(); renderTeam(); window.scrollTo(0, 0);
        } }, el('span', { text: t(last ? 'finish_quiz' : 'next_scenario') }), ' ', el('span', { class: 'flip', 'aria-hidden': 'true', text: '▶' }))));
    }
    side.appendChild(scoreboard());
    root.appendChild(el('div', { class: 'board big' }, left, side));
    if (!team.revealed) { if (timer.total !== team.secs && timer.left === timer.total) { timer.total = team.secs; timer.left = team.secs; } paintTimer(); }
  }
  function scoreboard() {
    var box = el('section', { class: 'card', id: 'scoreboard' }, el('h3', { text: '🏆 ' + t('scoreboard') }));
    var max = 1, scores = [];
    for (var i = 0; i < team.nTeams; i++) { scores.push(teamScore(i)); max = Math.max(max, scores[i]); }
    var bars = el('div', { class: 'bars' });
    for (var j = 0; j < team.nTeams; j++) {
      bars.appendChild(el('div', { class: 'bar-row', style: { '--tc': TEAM_COLORS[j] } },
        el('span', { class: 'bname no-i18n', text: teamName(j) }),
        el('div', { class: 'bar' }, el('span', { style: { width: (scores[j] * 100 / max) + '%' } })),
        el('b', { class: 'tscore', 'data-team': String(j), text: n(scores[j]) })));
    }
    box.appendChild(bars);
    return box;
  }
  function renderTeamDone(root) {
    var scores = [], max = 0;
    for (var i = 0; i < team.nTeams; i++) { scores.push(teamScore(i)); max = Math.max(max, scores[i]); }
    var winners = [];
    scores.forEach(function (s, i) { if (s === max) winners.push(teamName(i)); });
    var box = el('section', { class: 'card stack', id: 'teamDone', 'aria-live': 'polite' },
      el('h2', { text: '🏁 ' + t('quiz_done') }),
      el('p', { class: 'winner callout success', id: 'winner', text: winners.length === 1 ? '🏆 ' + t('winner', { team: winners[0] }) : '🤝 ' + t('tie_teams', { list: winners.join(', ') }) }),
      scoreboard(),
      el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'newQuiz', onclick: function () { team.stage = 'setup'; team.order = []; team.awards = {}; team.idx = 0; team.revealed = false; saveTeam(); renderTeam(); } }, '🔁 ', el('span', { text: t('new_quiz') })),
        el('button', { type: 'button', class: 'btn', onclick: function () { showTab('todo'); window.scrollTo(0, 0); } }, '🛡️ ', el('span', { text: t('tab_todo') }))));
    root.appendChild(box);
  }
  function togglePresent() {
    var on = !document.documentElement.classList.contains('presenting');
    document.documentElement.classList.toggle('presenting', on);
    if (on) { try { EDU.fullscreen(); } catch (e) { } }
    else if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) { } }
    renderTeam();
  }
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && document.documentElement.classList.contains('presenting')) { document.documentElement.classList.remove('presenting'); renderTeam(); }
  });

  /* ---------------- what to do / posters ---------------- */
  var printMode = '';
  function doPrint(mode) {
    printMode = mode;
    $('#app').setAttribute('data-print', mode);
    setTimeout(function () { try { window.print(); } catch (e) { } }, 50);
  }
  window.addEventListener('afterprint', function () { $('#app').removeAttribute('data-print'); printMode = ''; });
  $('#printPosters').addEventListener('click', function () { doPrint('posters'); });

  /* ---------------- certificate ---------------- */
  var cert = store.get('cert', { name: '', org: '', trainer: '' });
  if (!cert || typeof cert !== 'object') cert = { name: '', org: '', trainer: '' };
  ['name', 'org', 'trainer'].forEach(function (k) {
    var inp = $('#cert' + k.charAt(0).toUpperCase() + k.slice(1));
    inp.value = cert[k] || '';
    inp.addEventListener('input', function () { cert[k] = inp.value; store.set('cert', cert); renderCert(); });
  });
  function fmtDate(iso) {
    var d = iso ? new Date(iso + 'T00:00:00') : new Date();
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag || 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch (e) { return d.toDateString(); }
  }
  function renderCert() {
    var r = store.get('lastResult', null);
    if (r && !(isFinite(r.score) && isFinite(r.n) && r.n > 0)) r = null;
    $('#certNoResult').hidden = !!r;
    var box = $('#cert');
    box.innerHTML = '';
    box.setAttribute('dir', document.documentElement.dir || 'ltr');
    var name = (cert.name || '').trim() || t('cert_name_blank');
    box.appendChild(el('div', { class: 'c-seal', 'aria-hidden': 'true', text: '🛡️' }));
    box.appendChild(el('div', { class: 'c-brand', text: t('brand') + ' · ' + t('app_title') }));
    box.appendChild(el('div', { class: 'c-org no-i18n', text: (cert.org || '').trim() }));
    box.appendChild(el('div', { class: 'c-head', text: t('cert_heading') }));
    box.appendChild(el('div', { class: 'c-lead', text: t('cert_lead') }));
    box.appendChild(el('div', { class: 'c-name no-i18n', text: name }));
    box.appendChild(el('div', { class: 'c-body', text: t('cert_body') }));
    box.appendChild(el('div', { class: 'c-score', text: r ? t('cert_score', { score: n(r.score), n: n(r.n), pct: n(pct(r.score, r.n)) }) : t('cert_score_blank') }));
    if (r && r.total) box.appendChild(el('div', { class: 'c-flags', text: t('cert_flags', { found: n(r.found), total: n(r.total) }) }));
    box.appendChild(el('div', { class: 'c-pledge', text: '“' + t('cert_pledge') + '”' }));
    box.appendChild(el('div', { class: 'c-foot' },
      el('div', { class: 'c-sig' }, el('b', { class: 'no-i18n', text: (cert.trainer || '').trim() }), el('span', { text: t('cert_sig') })),
      el('div', { class: 'c-date', text: t('cert_date', { date: fmtDate(r && r.date) }) }),
      el('div', { class: 'c-sig' }, el('b', { class: 'no-i18n', text: name }), el('span', { text: t('cert_sig2') }))));
    box.appendChild(el('div', { class: 'c-disc', text: t('cert_disclaimer') }));
  }
  $('#printCert').addEventListener('click', function () { doPrint('cert'); });
  $('#goDrill').addEventListener('click', function () { showTab('drill'); window.scrollTo(0, 0); });

  /* ---------------- render everything ---------------- */
  function renderAll() {
    if (activeTab === 'drill') renderDrill();
    else if (activeTab === 'team') renderTeam();
    renderCert();
  }
  EDU.onLang(function () { renderAll(); });
  showTab(activeTab);
})();
