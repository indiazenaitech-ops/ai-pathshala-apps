/* Build a Chatbot: editor + chat preview + share link / play mode.
   The matching "brain" lives in engine.js (window.CB_ENGINE). */
(function () {
  'use strict';
  var SLUG = 'chatbot-builder';
  var E = window.CB_ENGINE, CONTENT = window.APP_CONTENT || {};
  var store = EDU.store(SLUG);
  var $ = EDU.$, t = EDU.t, el = EDU.el;
  var AVATARS = ['🦉', '🤖', '🐯', '🦚', '🐘', '🐼', '🦜', '🐬', '🚀', '🌻', '📚', '🧑‍🏫', '🍛', '🏏', '🎨', '🧠'];
  var MAX_INTENTS = 40, MAX_LINES = 60, MAX_REPLIES = 5, MAX_MISSED = 25, MAX_CHAT = 120;
  var LANG_CODES = EDU.LANGS.map(function (l) { return l.code; });
  var EMOJI_RE;
  try { EMOJI_RE = new RegExp('[\\p{Extended_Pictographic}\\u200D\\uFE0F]', 'gu'); } catch (e) { EMOJI_RE = /[\uD83C-\uDBFF][\uDC00-\uDFFF]|[☀-➿‍️]/g; }

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  /* ---------------- bot model ---------------- */
  function content(lang) { return CONTENT[lang] || CONTENT.en; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function str(v, max) { return (typeof v === 'string' ? v : (v == null ? '' : String(v))).slice(0, max); }
  function lines(v, maxN, maxLen) {
    var a = Array.isArray(v) ? v : (typeof v === 'string' ? v.split(/\r?\n/) : []);
    return a.map(function (x) { return str(x, maxLen).trim(); }).filter(Boolean).slice(0, maxN);
  }
  function sampleBot(lang) {
    var L = CONTENT[lang] ? lang : 'en', s = content(L).sample;
    return {
      name: s.name, avatar: s.avatar || '🦉', lang: L, greeting: s.greeting, fallback: s.fallback.slice(),
      threshold: 50, useStop: true, fuzzy: true, stopwords: null,
      intents: s.intents.map(function (it) { return { name: it.name, examples: it.examples.slice(), replies: it.replies.slice() }; }),
      sample: L
    };
  }
  function emptyBot() {
    return { name: t('new_bot_name'), avatar: '🤖', lang: EDU.lang, greeting: t('new_greeting'), fallback: [t('new_fallback')],
      threshold: 50, useStop: true, fuzzy: true, stopwords: null, intents: [], sample: null };
  }
  /* Accept anything (old saves, imported files, share links) and return a safe bot or null. */
  function sanitize(o) {
    if (!o || typeof o !== 'object' || !Array.isArray(o.intents)) return null;
    var thr = Math.round((+o.threshold || 50) / 5) * 5;
    var b = {
      name: str(o.name, 60).trim() || t('new_bot_name'),
      avatar: str(o.avatar, 16).trim() || '🤖',
      lang: LANG_CODES.indexOf(o.lang) >= 0 ? o.lang : EDU.lang,
      greeting: str(o.greeting, 600),
      fallback: lines(o.fallback, 10, 400),
      threshold: EDU.clamp(thr, 10, 100),
      useStop: o.useStop !== false,
      fuzzy: o.fuzzy !== false,
      stopwords: typeof o.stopwords === 'string' ? str(o.stopwords, 6000) : null,
      intents: o.intents.filter(function (x) { return x && typeof x === 'object'; }).slice(0, MAX_INTENTS).map(function (x) {
        return { name: str(x.name, 60).trim() || '?', examples: lines(x.examples, MAX_LINES, 200), replies: lines(x.replies, 20, 500) };
      }),
      sample: (typeof o.sample === 'string' && CONTENT[o.sample]) ? o.sample : null
    };
    if (!b.fallback.length) b.fallback = [t('new_fallback')];
    return b;
  }
  /* Short keys keep the share link small. */
  function toCompact(b) {
    var c = { n: b.name, a: b.avatar, l: b.lang, g: b.greeting, f: b.fallback, t: b.threshold, s: b.useStop ? 1 : 0, z: b.fuzzy ? 1 : 0,
      i: b.intents.map(function (it) { return [it.name, it.examples, it.replies.slice(0, MAX_REPLIES)]; }) };
    if (b.stopwords != null) c.w = b.stopwords;
    return c;
  }
  function fromCompact(c) {
    if (!c || typeof c !== 'object' || !Array.isArray(c.i)) return null;
    return sanitize({ name: c.n, avatar: c.a, lang: c.l, greeting: c.g, fallback: c.f, threshold: c.t, useStop: c.s !== 0, fuzzy: c.z !== 0,
      stopwords: typeof c.w === 'string' ? c.w : null,
      intents: c.i.map(function (x) { return Array.isArray(x) ? { name: x[0], examples: x[1], replies: x[2] } : null; }) });
  }

  /* ---------------- state ---------------- */
  var bot = sanitize(store.get('bot', null)) || sampleBot(EDU.lang);
  if (bot.sample && bot.sample !== EDU.lang && CONTENT[EDU.lang]) bot = sampleBot(EDU.lang);
  var prefs = Object.assign({ think: true, voice: false, playThink: false }, store.get('prefs', {}) || {});
  var missed = (store.get('missed', []) || []).filter(function (s) { return typeof s === 'string'; }).slice(0, MAX_MISSED);
  var play = null;                 // the shared bot while in play mode
  var chat = [], queue = [], busy = false, chatToken = 0, lastReply = {};
  var openSet = { 0: true };
  var compiled = null, compiledFor = null;
  var saveT = 0, healthT = 0;

  function active() { return play || bot; }
  function stopText(b) { return b.stopwords != null ? b.stopwords : content(b.lang).stopwords; }
  function brain(b) {
    if (!compiled || compiledFor !== b) {
      compiled = E.compile({ lang: b.lang, stopwords: stopText(b), intents: b.intents });
      compiledFor = b;
    }
    return compiled;
  }
  function opts(b) { return { threshold: b.threshold, useStop: b.useStop, fuzzy: b.fuzzy }; }
  function thinkOn() { return play ? !!prefs.playThink : !!prefs.think; }
  function savePrefs() { store.set('prefs', prefs); }
  function saveNow() { clearTimeout(saveT); store.set('bot', bot); }
  function touch() {
    bot.sample = null; compiled = null;
    clearTimeout(saveT); saveT = setTimeout(function () { store.set('bot', bot); }, 250);
    clearTimeout(healthT); healthT = setTimeout(renderHealth, 300);
  }

  /* ---------------- chat ---------------- */
  function startChat() {
    chatToken++; queue = []; busy = false; showTyping(false);
    chat = [{ who: 'bot', kind: 'greeting', text: active().greeting || '👋' }];
    renderChat(); refreshSuggest();
  }
  function send(text) {
    text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    if (!text) return;
    chat.push({ who: 'user', text: text });
    if (chat.length > MAX_CHAT) chat.splice(1, chat.length - MAX_CHAT);
    renderChat();
    queue.push(text);
    pump();
  }
  function pickReply(list, key) {
    var arr = list.slice(0, MAX_REPLIES);
    if (!arr.length) return null;
    if (arr.length === 1) return arr[0];
    var i, tries = 0;
    do { i = Math.floor(Math.random() * arr.length); } while (i === lastReply[key] && ++tries < 8);
    lastReply[key] = i;
    return arr[i];
  }
  function pump() {
    if (busy || !queue.length) return;
    busy = true;
    var text = queue.shift(), b = active(), tok = chatToken;
    var res = E.match(brain(b), text, opts(b));
    var kind = res.intent >= 0 ? 'reply' : 'fallback';
    var name = res.intent >= 0 ? b.intents[res.intent].name : '';
    var reply = kind === 'reply' ? pickReply(b.intents[res.intent].replies, res.intent) : pickReply(b.fallback, 'f');
    if (reply == null) reply = kind === 'reply' ? t('no_reply') : '…';
    showTyping(true);
    setTimeout(function () {
      if (tok !== chatToken) return;
      showTyping(false);
      chat.push({ who: 'bot', kind: kind, text: reply, res: res, q: text, intentName: name });
      if (kind === 'fallback' && !play) addMissed(text);
      renderChat(); refreshSuggest();
      if (prefs.voice) speakReply(reply, b.lang);
      busy = false; pump();
    }, 380 + Math.min(900, reply.length * 9));
  }
  function showTyping(on) {
    var row = $('#typingRow');
    row.hidden = !on;
    if (on) {
      $('#typingTxt').textContent = t('typing', { name: active().name });
      var log = $('#chatLog'); log.scrollTop = log.scrollHeight;
    }
  }
  function whyLabel(m) {
    var r = m.res;
    if (m.kind === 'reply') return '🧠 ' + m.intentName + ' · ' + EDU.fmt(r.score) + '%';
    var s = '🧠 ' + t('why_nomatch');
    if (r.best) s += ' · ' + r.best.name + ' ' + EDU.fmt(r.best.score) + '% < ' + EDU.fmt(r.threshold) + '%';
    return s;
  }
  function whyPanel(m) {
    var r = m.res, p = el('div', { class: 'why-panel' }), hits = {};
    if (r.best) r.best.matched.forEach(function (x) { hits[x.user] = 1; });
    var w = el('div', {}, el('b', { text: t('why_words') + ' ' }));
    if (r.words.length) r.words.forEach(function (x) { w.appendChild(el('span', { class: 'wchip' + (hits[x] ? ' hit' : ''), text: x })); });
    else w.appendChild(el('span', { class: 'muted', text: t('why_none') }));
    p.appendChild(w);
    if (r.ignored.length) {
      var ig = el('div', { class: 'muted' }, t('why_ignored') + ' ');
      r.ignored.forEach(function (x) { ig.appendChild(el('span', { class: 'wchip off', text: x })); });
      p.appendChild(ig);
    }
    if (r.best) {
      p.appendChild(el('div', {}, el('b', { text: t('why_example') + ' ' }), '“' + r.best.example + '” ',
        r.best.exact ? el('span', { class: 'badge success', text: '✓ ' + t('why_exact') }) : null));
      var mw = el('div', {}, el('b', { text: t('why_matched') + ' ' }));
      r.best.matched.forEach(function (x) { mw.appendChild(el('span', { class: 'wchip hit', text: x.user === x.ex ? x.user : x.user + ' ≈ ' + x.ex })); });
      p.appendChild(mw);
    }
    var bars = el('div', { class: 'bars' });
    var shown = r.scores.filter(function (s) { return s.score > 0; }).slice(0, 6);
    if (!shown.length) bars.appendChild(el('span', { class: 'muted', text: t('why_none') }));
    shown.forEach(function (s) {
      var thr = el('span', { class: 'thr' });
      thr.style.insetInlineStart = 'calc(' + r.threshold + '% - 1px)';
      bars.appendChild(el('div', { class: 'bar-row' + (r.intent === s.i ? ' win' : '') },
        el('span', { class: 'bar-name', title: s.name, text: s.name }),
        el('span', { class: 'bar' }, el('span', { style: { width: s.score + '%' } }), thr),
        el('span', { class: 'bar-pct', text: EDU.fmt(s.score) + '%' })));
    });
    if (r.scores.length) p.appendChild(el('div', {}, el('b', { text: t('why_scores') }), ' ', el('span', { class: 'muted', text: '(' + t('why_needed', { t: EDU.fmt(r.threshold) }) + ')' }), bars));
    p.appendChild(el('div', { class: 'small' }, r.intent >= 0 ? t('why_picked', { intent: m.intentName }) : t('why_fallback', { t: EDU.fmt(r.threshold) })));
    return p;
  }
  function renderChat(keepScroll) {
    var log = $('#chatLog'), b = active(), think = thinkOn(), top = log.scrollTop;
    log.innerHTML = '';
    chat.forEach(function (m) {
      if (m.who === 'user') {
        log.appendChild(el('div', { class: 'msg user' }, el('div', { class: 'msg-body' }, el('div', { class: 'bubble', text: m.text }))));
        return;
      }
      var body = el('div', { class: 'msg-body' }, el('div', { class: 'bubble', text: m.text }));
      if (think && m.res) {
        var chip = el('button', { type: 'button', class: 'why' + (m.kind === 'fallback' ? ' miss' : ''), 'aria-expanded': m.open ? 'true' : 'false', text: whyLabel(m) });
        chip.addEventListener('click', function () {
          m.open = !m.open;
          renderChat(true);
          if (!m.open) return;
          var panels = $('#chatLog').querySelectorAll('.why-panel'), lg = $('#chatLog');
          for (var k = 0; k < panels.length; k++) {
            if (panels[k].__msg !== m) continue;
            var pr = panels[k].getBoundingClientRect(), lr = lg.getBoundingClientRect();
            if (pr.bottom > lr.bottom) lg.scrollTop += Math.min(pr.bottom - lr.bottom + 8, pr.top - lr.top - 8);
          }
        });
        body.appendChild(chip);
        if (m.open) { var wp = whyPanel(m); wp.__msg = m; body.appendChild(wp); }
      }
      log.appendChild(el('div', { class: 'msg bot ' + m.kind, dataset: { intent: m.kind === 'greeting' ? 'g' : String(m.res.intent), score: m.res ? String(m.res.score) : '' } },
        el('span', { class: 'msg-av', 'aria-hidden': 'true', text: b.avatar }), body));
    });
    log.scrollTop = keepScroll ? top : log.scrollHeight;
  }
  function refreshSuggest() {
    var b = active(), box = $('#suggestChips');
    box.innerHTML = '';
    var groups = b.intents.map(function (it) { return it.examples.slice(); }).filter(function (a) { return a.length; });
    var picks = EDU.shuffle(groups).slice(0, 3).map(function (a) {
      var multi = a.filter(function (x) { return /\s/.test(x); });
      return EDU.pick(multi.length ? multi : a);
    });
    $('#suggest').hidden = !picks.length;
    picks.forEach(function (x) { box.appendChild(el('button', { type: 'button', class: 'chip', text: x, onclick: function () { send(x); } })); });
  }
  function speakReply(text, lang) {
    var clean = String(text).replace(EMOJI_RE, '').trim();
    if (!clean) return;
    EDU.speak(clean, { lang: lang }).then(function (ok) {
      if (!ok) { EDU.toast(t('no_voice')); prefs.voice = false; savePrefs(); $('#voiceToggle').checked = false; }
    });
  }
  function renderChatHead() { var b = active(); $('#chatAvatar').textContent = b.avatar; $('#chatName').textContent = b.name; }

  /* ---------------- unanswered questions ---------------- */
  function addMissed(q) {
    var n = E.normalize(q);
    if (!n) return;
    missed = missed.filter(function (x) { return E.normalize(x) !== n; });
    missed.unshift(q);
    missed = missed.slice(0, MAX_MISSED);
    store.set('missed', missed);
    renderMissed();
  }
  function renderMissed() {
    $('#missedTitle').textContent = t('missed_title', { n: EDU.fmt(missed.length) });
    $('#missedHint').textContent = missed.length ? t('missed_hint') : t('missed_empty');
    var ul = $('#missedList');
    ul.innerHTML = '';
    var c = missed.length && bot.intents.length ? E.compile({ lang: bot.lang, stopwords: stopText(bot), intents: bot.intents }) : null;
    missed.forEach(function (q, i) {
      var sel = el('select', { class: 'no-i18n', 'aria-label': t('missed_pick') });
      bot.intents.forEach(function (it, k) { sel.appendChild(el('option', { value: String(k), text: it.name })); });
      if (c) { var guess = E.match(c, q, { threshold: 0, useStop: bot.useStop, fuzzy: bot.fuzzy }); if (guess.best) sel.value = String(guess.best.i); }
      var add = el('button', { type: 'button', class: 'btn btn-sm btn-primary missed-add', text: t('missed_add'), disabled: !bot.intents.length });
      add.addEventListener('click', function () {
        var k = +sel.value, it = bot.intents[k];
        if (!it) return;
        if (it.examples.indexOf(q) < 0) it.examples.push(q);
        missed.splice(i, 1); store.set('missed', missed);
        openSet = {}; openSet[k] = true;
        touch(); renderIntents(); renderMissed(); refreshSuggest();
        EDU.toast(t('missed_added', { name: it.name }));
      });
      var rm = el('button', { type: 'button', class: 'btn btn-sm btn-ghost', 'aria-label': t('remove'), title: t('remove'), text: '✕' });
      rm.addEventListener('click', function () { missed.splice(i, 1); store.set('missed', missed); renderMissed(); });
      ul.appendChild(el('li', { class: 'missed-item' }, el('span', { class: 'missed-q no-i18n', text: q }), sel, add, rm));
    });
  }

  /* ---------------- editor ---------------- */
  function firstGrapheme(v) {
    try { var it = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(v)[Symbol.iterator]().next(); if (!it.done) return it.value.segment; } catch (e) { }
    return Array.from(v)[0] || '';
  }
  function renderAvatars(keepCustom) {
    var box = $('#avPick');
    box.innerHTML = '';
    AVATARS.forEach(function (a) {
      box.appendChild(el('button', { type: 'button', text: a, 'aria-pressed': bot.avatar === a ? 'true' : 'false', onclick: function () {
        bot.avatar = a; $('#avCustom').value = ''; touch(); renderAvatars(); renderChatHead(); renderChat(true);
      } }));
    });
    if (!keepCustom) $('#avCustom').value = AVATARS.indexOf(bot.avatar) < 0 ? bot.avatar : '';
  }
  function renderBotFields() {
    $('#botName').value = bot.name;
    $('#greeting').value = bot.greeting;
    $('#fallback').value = bot.fallback.join('\n');
    renderAvatars();
  }
  function countText(it) { return t('intent_counts', { e: EDU.fmt(it.examples.length), r: EDU.fmt(Math.min(MAX_REPLIES, it.replies.length)) }); }
  function renderIntents() {
    var list = $('#intentList');
    list.innerHTML = '';
    $('#intentCount').textContent = EDU.fmt(bot.intents.length);
    bot.intents.forEach(function (it, i) {
      var d = el('details', { class: 'intent', dataset: { i: String(i) } });
      d.style.setProperty('--ic', 'var(--c' + (i % 8 + 1) + ')');
      if (openSet[i]) d.open = true;
      var title = el('span', { class: 'in-title no-i18n', text: it.name });
      var count = el('span', { class: 'badge in-count', text: countText(it) });
      var nameIn = el('input', { type: 'text', class: 'in-name no-i18n', maxlength: '60', 'aria-label': t('intent_name') });
      nameIn.value = it.name;
      var exTa = el('textarea', { class: 'in-ex no-i18n', rows: '6', 'aria-label': t('examples') });
      exTa.value = it.examples.join('\n');
      var repTa = el('textarea', { class: 'in-rep no-i18n', rows: '6', 'aria-label': t('replies') });
      repTa.value = it.replies.join('\n');
      var warn = el('div', { class: 'warn-txt', text: '⚠ ' + t('replies_max') });
      warn.hidden = it.replies.length <= MAX_REPLIES;
      var del = el('button', { type: 'button', class: 'btn btn-sm btn-danger in-del' }, el('span', { 'aria-hidden': 'true', text: '🗑' }), t('delete_intent'));
      d.appendChild(el('summary', {}, title, count));
      d.appendChild(el('div', { class: 'intent-body stack' },
        el('label', { class: 'field' }, el('b', { text: t('intent_name') }), nameIn),
        el('div', { class: 'grid-2' },
          el('div', { class: 'field' }, el('b', { text: t('examples') }), el('span', { text: t('examples_hint') }), exTa),
          el('div', { class: 'field' }, el('b', { text: t('replies') }), el('span', { text: t('replies_hint') }), repTa, warn)),
        el('div', { class: 'row' }, del)));
      d.addEventListener('toggle', function () { if (d.open) openSet[i] = true; else delete openSet[i]; });
      nameIn.addEventListener('input', function () { it.name = str(nameIn.value, 60); title.textContent = it.name; touch(); });
      nameIn.addEventListener('change', function () { it.name = it.name.trim() || '?'; title.textContent = it.name; renderMissed(); });
      exTa.addEventListener('input', function () { it.examples = lines(exTa.value, MAX_LINES, 200); count.textContent = countText(it); touch(); });
      exTa.addEventListener('change', refreshSuggest);
      repTa.addEventListener('input', function () { it.replies = lines(repTa.value, 20, 500); count.textContent = countText(it); warn.hidden = it.replies.length <= MAX_REPLIES; touch(); });
      del.addEventListener('click', function () {
        if (!confirm(t('confirm_delete_intent', { name: it.name }))) return;
        bot.intents.splice(i, 1); openSet = {};
        touch(); renderIntents(); renderMissed(); refreshSuggest();
      });
      list.appendChild(d);
    });
  }
  function renderBrain() {
    $('#threshold').value = String(bot.threshold);
    $('#thrLabel').textContent = t('threshold_label', { n: EDU.fmt(bot.threshold) });
    $('#useStop').checked = bot.useStop;
    $('#useFuzzy').checked = bot.fuzzy;
    $('#stopList').value = stopText(bot);
    var sel = $('#botLang');
    if (!sel.options.length) EDU.LANGS.forEach(function (l) { sel.appendChild(el('option', { value: l.code, text: l.native })); });
    sel.value = bot.lang;
  }
  function renderHealth() {
    var h = E.health({ lang: bot.lang, stopwords: stopText(bot), intents: bot.intents }, opts(bot));
    var pct = h.n ? Math.round(100 * h.ok / h.n) : 0;
    var big = $('#healthScore');
    big.textContent = h.n ? EDU.fmt(pct) + '%' : '–';
    big.className = 'health-big ' + (h.n && pct === 100 ? 'ok' : 'bad');
    $('#healthCounts').textContent = t('h_counts', { i: EDU.fmt(h.intents), e: EDU.fmt(h.examples), r: EDU.fmt(h.replies) }) +
      (h.n ? ' · ' + t('h_selftest', { ok: EDU.fmt(h.ok), n: EDU.fmt(h.n) }) : '');
    var ul = $('#healthList');
    ul.innerHTML = '';
    if (!h.issues.length) ul.appendChild(el('li', { class: 'ok', text: '✓ ' + t('h_ok') }));
    h.issues.slice(0, 8).forEach(function (x) { ul.appendChild(el('li', { text: '⚠ ' + t(x.k, x.v) })); });
  }
  function renderTricks() {
    var box = $('#tricks'), tr = content(bot.lang).tricky;
    box.innerHTML = '';
    ['trick_spelling', 'trick_unknown', 'trick_negation'].forEach(function (k, i) {
      var b = el('button', { type: 'button', class: 'btn trick', dataset: { k: String(i) } }, el('span', { text: t(k) }), el('q', { class: 'no-i18n', text: tr[i] }));
      b.addEventListener('click', function () {
        if (!thinkOn()) { prefs.think = true; savePrefs(); $('#thinkToggle').checked = true; renderChat(true); }
        send(tr[i]);
        var r = $('#chatCard').getBoundingClientRect();
        if (r.top < 0 || r.top > window.innerHeight - 120) $('#chatCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      box.appendChild(b);
    });
  }
  function renderPrint() {
    var b = bot, ps = $('#printSheet');
    ps.innerHTML = '';
    ps.appendChild(el('h1', { text: t('print_title') }));
    ps.appendChild(el('p', { text: t('print_name') }));
    ps.appendChild(el('h2', { text: b.avatar + ' ' + b.name }));
    ps.appendChild(el('p', {}, el('b', { text: t('greeting') + ': ' }), b.greeting));
    ps.appendChild(el('p', {}, el('b', { text: t('fallback') + ': ' }), b.fallback.join(' / ')));
    var tb = el('tbody');
    b.intents.forEach(function (it) {
      tb.appendChild(el('tr', {}, el('td', {}, el('b', { text: it.name })),
        el('td', {}, el('ul', {}, it.examples.map(function (x) { return el('li', { text: x }); }))),
        el('td', {}, el('ul', {}, it.replies.slice(0, MAX_REPLIES).map(function (x) { return el('li', { text: x }); })))));
    });
    ps.appendChild(el('table', { class: 'table' }, el('thead', {}, el('tr', {}, el('th', { text: t('intent_name') }), el('th', { text: t('examples') }), el('th', { text: t('replies') }))), tb));
    ps.appendChild(el('p', { class: 'small', text: t('threshold_label', { n: EDU.fmt(b.threshold) }) + ' · ' + (b.useStop ? '✓ ' : '✗ ') + t('use_stop') + ' · ' + (b.fuzzy ? '✓ ' : '✗ ') + t('use_fuzzy') }));
  }
  function renderEditorAll() {
    renderBotFields(); renderIntents(); renderBrain(); renderHealth(); renderTricks(); renderMissed(); renderChatHead();
  }

  /* ---------------- share / play mode ---------------- */
  function shareUrl(b) { return location.href.split('#')[0].split('?')[0] + '#bot=' + EDU.pack(toCompact(b)); }
  function openShare() {
    saveNow();
    var url = shareUrl(bot);
    var inp = el('input', { type: 'text', readonly: true, class: 'no-i18n w100', id: 'shareLink', 'aria-label': t('share_link') });
    inp.value = url;
    var copyBtn = el('button', { type: 'button', class: 'btn btn-primary', id: 'shareCopy' }, el('span', { 'aria-hidden': 'true', text: '📋' }), t('copy'));
    copyBtn.addEventListener('click', function () { EDU.copy(url); });
    var box = el('div', { class: 'stack' },
      el('p', { class: 'mb0', text: t('share_text') }),
      el('label', { class: 'field' }, el('b', { text: t('share_link') }), inp),
      el('p', { class: 'tiny muted mb0', text: t('share_len', { n: EDU.fmt(url.length) }) }),
      url.length > 6000 ? el('div', { class: 'callout warning small', text: t('share_long') }) : null,
      location.protocol === 'file:' ? el('div', { class: 'callout warning small', text: t('share_file') }) : null,
      el('div', { class: 'row' }, copyBtn,
        navigator.share ? el('button', { type: 'button', class: 'btn', onclick: function () { EDU.share(url, bot.name); } }, el('span', { 'aria-hidden': 'true', text: '📤' }), t('share')) : null,
        el('a', { class: 'btn', href: url, target: '_blank', rel: 'noopener', id: 'shareOpen' }, el('span', { 'aria-hidden': 'true', text: '▶' }), t('share_open'))));
    EDU.modal(box, { title: t('share_title') });
    setTimeout(function () { try { inp.focus(); inp.select(); } catch (e) { } }, 60);
  }
  function readHash() {
    var m = /[#&]bot=([^&]+)/.exec(location.hash || '');
    if (!m) return null;
    var b = fromCompact(EDU.unpack(m[1]));
    if (!b) { EDU.toast(t('bad_link')); return null; }
    b.sample = null;
    return b;
  }
  function applyMode() {
    play = readHash();
    document.body.classList.toggle('cb-play', !!play);
    $('#playBar').hidden = !play;
    compiled = null;
    $('#thinkToggle').checked = thinkOn();
    renderChatHead();
    startChat();
  }
  function leavePlay() {
    try { history.replaceState(null, '', location.href.split('#')[0]); } catch (e) { location.hash = ''; }
    applyMode();
  }

  /* ---------------- file actions ---------------- */
  function replaceBot(b) {
    bot = b; compiled = null; saveNow();
    missed = []; store.set('missed', missed);
    openSet = { 0: true };
    renderEditorAll(); startChat();
  }
  function exportBot() {
    var data = Object.assign({ app: SLUG, version: 1 }, clone(bot));
    delete data.sample;
    var fname = (bot.name || 'chatbot').replace(/[\\\/:*?"<>|]+/g, '').trim().slice(0, 40) || 'chatbot';
    EDU.download(fname + '.chatbot.json', JSON.stringify(data, null, 2), 'application/json');
  }
  function importBot() {
    if (!bot.sample && !confirm(t('confirm_replace'))) return;
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return null;
      if (f.size > 2000000) { EDU.toast(t('import_bad')); return null; }
      return EDU.readText(f).then(function (txt) {
        var o = null;
        try { o = JSON.parse(String(txt).replace(/^﻿/, '')); } catch (e) { o = null; }
        var b = o && (Array.isArray(o.i) ? fromCompact(o) : sanitize(o));
        if (!b) { EDU.toast(t('import_bad')); return; }
        b.sample = null;
        replaceBot(b);
        EDU.toast(t('import_ok', { name: b.name }));
      });
    }).catch(function () { EDU.toast(t('import_bad')); });
  }

  /* ---------------- events ---------------- */
  $('#chatForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = $('#chatInput');
    send(inp.value); inp.value = ''; inp.focus();
  });
  $('#restartBtn').addEventListener('click', startChat);
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen($('#chatCard')); });
  $('#thinkToggle').addEventListener('change', function () {
    if (play) prefs.playThink = this.checked; else prefs.think = this.checked;
    savePrefs(); renderChat(true);
  });
  $('#voiceToggle').checked = !!prefs.voice;
  $('#voiceToggle').addEventListener('change', function () {
    prefs.voice = this.checked; savePrefs();
    if (!prefs.voice) EDU.stopSpeaking();
  });

  $('#botName').addEventListener('input', function () { bot.name = str(this.value, 60); touch(); renderChatHead(); });
  $('#botName').addEventListener('change', function () { bot.name = bot.name.trim() || t('new_bot_name'); this.value = bot.name; renderChatHead(); });
  $('#greeting').addEventListener('input', function () {
    bot.greeting = str(this.value, 600); touch();
    if (!play && chat.length === 1) { chat[0].text = bot.greeting || '👋'; renderChat(); }
  });
  $('#fallback').addEventListener('input', function () { bot.fallback = lines(this.value, 10, 400); if (!bot.fallback.length) bot.fallback = []; touch(); });
  $('#fallback').addEventListener('change', function () { if (!bot.fallback.length) { bot.fallback = [t('new_fallback')]; this.value = bot.fallback[0]; touch(); } });
  $('#avCustom').addEventListener('input', function () {
    var v = this.value.trim();
    if (!v) return;
    bot.avatar = firstGrapheme(v); touch(); renderAvatars(true); renderChatHead(); renderChat(true);
  });
  $('#addIntent').addEventListener('click', function () {
    if (bot.intents.length >= MAX_INTENTS) return;
    bot.intents.push({ name: t('new_intent_name', { n: bot.intents.length + 1 }), examples: [], replies: [] });
    openSet = {}; openSet[bot.intents.length - 1] = true;
    touch(); renderIntents(); renderMissed();
    var last = $('#intentList').lastElementChild;
    if (last) {
      last.scrollIntoView({ block: 'center', behavior: 'smooth' });
      var inp = last.querySelector('.in-name');
      if (inp) { inp.focus(); inp.select(); }
    }
  });
  $('#threshold').addEventListener('input', function () {
    bot.threshold = EDU.clamp(+this.value || 50, 10, 100);
    $('#thrLabel').textContent = t('threshold_label', { n: EDU.fmt(bot.threshold) }); touch();
  });
  $('#useStop').addEventListener('change', function () { bot.useStop = this.checked; touch(); });
  $('#useFuzzy').addEventListener('change', function () { bot.fuzzy = this.checked; touch(); });
  $('#stopList').addEventListener('input', function () { bot.stopwords = str(this.value, 6000); touch(); });
  $('#stopRestore').addEventListener('click', function () { bot.stopwords = null; $('#stopList').value = stopText(bot); touch(); });
  $('#botLang').addEventListener('change', function () {
    bot.lang = LANG_CODES.indexOf(this.value) >= 0 ? this.value : 'en';
    if (bot.stopwords == null) $('#stopList').value = stopText(bot);
    touch(); renderTricks();
  });

  $('#sampleBtn').addEventListener('click', function () { if (confirm(t('confirm_sample'))) replaceBot(sampleBot(EDU.lang)); });
  $('#newBtn').addEventListener('click', function () { if (confirm(t('confirm_new'))) replaceBot(emptyBot()); });
  $('#exportBtn').addEventListener('click', exportBot);
  $('#importBtn').addEventListener('click', importBot);
  $('#shareBtn').addEventListener('click', openShare);
  $('#printBtn').addEventListener('click', function () { renderPrint(); window.print(); });
  window.addEventListener('beforeprint', renderPrint);
  $('#playMake').addEventListener('click', leavePlay);
  $('#playEdit').addEventListener('click', function () {
    if (!play || !confirm(t('confirm_replace'))) return;
    var b = clone(play);
    leavePlay();
    replaceBot(b);
    EDU.toast(t('import_ok', { name: b.name }));
  });
  window.addEventListener('hashchange', applyMode);

  EDU.onLang(function () {
    if (bot.sample && bot.sample !== EDU.lang && CONTENT[EDU.lang]) {
      bot = sampleBot(EDU.lang); compiled = null; saveNow();
      missed = []; store.set('missed', missed); openSet = { 0: true };
      renderEditorAll();
      if (!play) startChat();
    } else renderEditorAll();
    renderChat(true);
    if (!$('#typingRow').hidden) showTyping(true);
  });

  renderEditorAll();
  applyMode();
})();
