/* AI or Not? Sorting Game: sort everyday things into "Uses AI" / "No AI". */
(function () {
  'use strict';
  var SLUG = 'ai-around-us';
  var ROUND_SIZE = 10;

  /* Language-neutral facts. Names and reasons live in content.js (12 languages). */
  var ITEMS = [
    { id: 'face_unlock', emoji: '🤳', ai: true, tag: 'pattern' },
    { id: 'yt_recs', emoji: '▶️', ai: true, tag: 'predict' },
    { id: 'maps_traffic', emoji: '🗺️', ai: true, tag: 'predict' },
    { id: 'voice_assistant', emoji: '🎙️', ai: true, tag: 'learn' },
    { id: 'spam_filter', emoji: '📧', ai: true, tag: 'learn' },
    { id: 'keyboard', emoji: '⌨️', ai: true, tag: 'predict' },
    { id: 'chatbot', emoji: '💬', ai: true, tag: 'predict' },
    { id: 'face_filter', emoji: '🐶', ai: true, tag: 'pattern' },
    { id: 'self_driving', emoji: '🚗', ai: true, tag: 'decide' },
    { id: 'translate', emoji: '🌐', ai: true, tag: 'learn' },
    { id: 'fraud', emoji: '💳', ai: true, tag: 'pattern' },
    { id: 'smart_speaker', emoji: '🔊', ai: true, tag: 'learn' },
    { id: 'crop_doctor', emoji: '🌿', ai: true, tag: 'pattern' },
    { id: 'calculator', emoji: '🧮', ai: false, tag: 'rule' },
    { id: 'fan_regulator', emoji: '🌀', ai: false, tag: 'manual' },
    { id: 'light_switch', emoji: '💡', ai: false, tag: 'manual' },
    { id: 'traffic_light', emoji: '🚦', ai: false, tag: 'rule' },
    { id: 'microwave', emoji: '⏲️', ai: false, tag: 'rule' },
    { id: 'printed_map', emoji: '📜', ai: false, tag: 'manual' },
    { id: 'alarm_clock', emoji: '⏰', ai: false, tag: 'rule' },
    { id: 'torch', emoji: '🔦', ai: false, tag: 'manual' },
    { id: 'bicycle', emoji: '🚲', ai: false, tag: 'manual' },
    { id: 'tv_remote', emoji: '📺', ai: false, tag: 'rule' },
    { id: 'pressure_cooker', emoji: '🍲', ai: false, tag: 'sensor' },
    { id: 'street_light', emoji: '🌃', ai: false, tag: 'sensor' },
    { id: 'weighing_scale', emoji: '⚖️', ai: false, tag: 'sensor' }
  ];
  /* Fixed mixed order for the printed worksheet (AI and non-AI interleaved irregularly). */
  var WS_ORDER = ['calculator', 'face_unlock', 'yt_recs', 'fan_regulator', 'traffic_light', 'maps_traffic', 'torch',
    'spam_filter', 'voice_assistant', 'alarm_clock', 'keyboard', 'printed_map', 'microwave', 'chatbot', 'street_light',
    'face_filter', 'bicycle', 'translate', 'tv_remote', 'self_driving', 'fraud', 'pressure_cooker', 'light_switch',
    'smart_speaker', 'weighing_scale', 'crop_doctor'];

  var BY_ID = {};
  ITEMS.forEach(function (it) { BY_ID[it.id] = it; });
  window.AIAU = { items: ITEMS };            // read by the interaction test

  var $ = EDU.$, el = EDU.el, t = EDU.t;
  var store = EDU.store(SLUG);

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- content helpers ---------------- */
  function content() {
    var C = window.APP_CONTENT || {};
    return C[EDU.lang] || C.en || { items: {} };
  }
  function info(id) {
    var c = content().items[id];
    if (!c) c = ((window.APP_CONTENT || {}).en || { items: {} }).items[id] || { name: id, why: '' };
    return c;
  }
  function binName(b) { return t(b === 'ai' ? 'bin_ai' : 'bin_no'); }
  function answerOf(id) { return BY_ID[id].ai ? 'ai' : 'no'; }
  function tagText(id) { return t('tag_' + BY_ID[id].tag); }

  /* ---------------- state ---------------- */
  var stats = store.get('stats', null);
  if (!stats || typeof stats !== 'object') stats = { best: -1, rounds: 0 };
  if (typeof stats.best !== 'number') stats.best = -1;
  if (typeof stats.rounds !== 'number') stats.rounds = 0;

  function makeRound() {
    var ai = EDU.shuffle(ITEMS.filter(function (i) { return i.ai; })).slice(0, ROUND_SIZE / 2);
    var no = EDU.shuffle(ITEMS.filter(function (i) { return !i.ai; })).slice(0, ROUND_SIZE / 2);
    return { ids: EDU.shuffle(ai.concat(no)).map(function (i) { return i.id; }), place: {}, order: [], checked: false };
  }
  function validRound(r) {
    if (!r || !Array.isArray(r.ids) || r.ids.length !== ROUND_SIZE) return false;
    if (r.ids.some(function (id) { return !BY_ID[id]; })) return false;
    if (!r.place || typeof r.place !== 'object' || !Array.isArray(r.order)) return false;
    return Object.keys(r.place).every(function (id) { return r.ids.indexOf(id) >= 0 && (r.place[id] === 'ai' || r.place[id] === 'no'); });
  }
  var round = store.get('round', null);
  if (!validRound(round)) round = makeRound();
  round.order = round.order.filter(function (id) { return round.place[id]; });
  Object.keys(round.place).forEach(function (id) { if (round.order.indexOf(id) < 0) round.order.push(id); });
  if (round.checked && round.order.length !== ROUND_SIZE) round.checked = false;

  function makeDeck() { return { order: EDU.shuffle(ITEMS.map(function (i) { return i.id; })), i: 0, revealed: false, ai: 0, no: 0, right: 0, counted: 0 }; }
  var deck = store.get('deck', null);
  if (!deck || !Array.isArray(deck.order) || deck.order.length !== ITEMS.length || deck.order.some(function (id) { return !BY_ID[id]; }) || typeof deck.i !== 'number') deck = makeDeck();
  ['ai', 'no', 'right', 'counted'].forEach(function (k) { deck[k] = Math.max(0, Math.floor(Number(deck[k]) || 0)); });
  deck.i = EDU.clamp(Math.floor(deck.i), 0, ITEMS.length);

  var tab = store.get('tab', 'play');
  if (['play', 'class', 'cards'].indexOf(tab) < 0) tab = 'play';
  var filter = 'all';
  var selected = null;
  var usingKeyboard = false;

  function saveRound() { store.set('round', round); }
  function saveDeck() { store.set('deck', deck); }
  function saveStats() { store.set('stats', stats); }

  /* ---------------- play: actions ---------------- */
  function placeCard(id, bin) {
    if (round.checked || !BY_ID[id] || round.ids.indexOf(id) < 0) return;
    round.place[id] = bin;
    round.order = round.order.filter(function (x) { return x !== id; });
    round.order.push(id);
    selected = null;
    saveRound();
    renderPlay();
    if (usingKeyboard) focusNext();
  }
  function unplace(id) {
    if (round.checked || !round.place[id]) return;
    delete round.place[id];
    round.order = round.order.filter(function (x) { return x !== id; });
    selected = null;
    saveRound();
    renderPlay();
  }
  function select(id) {
    if (round.checked) return;
    selected = (selected === id) ? null : id;
    renderPlay();
    var b = selected && document.querySelector('#panel-play [data-id="' + selected + '"]');
    if (b && usingKeyboard) b.focus();
  }
  function focusNext() {
    var next = $('#tray .sort-card') || $('#check');
    if (next && !next.disabled) next.focus();
  }
  function scoreOf() {
    return round.ids.filter(function (id) { return round.place[id] === answerOf(id); }).length;
  }
  function check() {
    if (round.checked || round.order.length < ROUND_SIZE) return;
    round.checked = true;
    selected = null;
    var s = scoreOf();
    stats.rounds += 1;
    if (s > stats.best) stats.best = s;
    saveStats(); saveRound();
    renderPlay(); renderStats();
    var r = $('#results');
    if (r && r.scrollIntoView) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function newRound() {
    round = makeRound(); selected = null; saveRound(); renderPlay();
    var tw = $('#tray-wrap'); if (tw && tw.scrollIntoView && tw.getBoundingClientRect().top < 0) tw.scrollIntoView({ block: 'start' });
  }
  function resetAll() {
    if (!confirm(t('confirm_reset'))) return;
    stats = { best: -1, rounds: 0 }; saveStats();
    deck = makeDeck(); saveDeck();
    newRound(); renderStats(); renderClass();
  }

  /* ---------------- play: rendering ---------------- */
  function cardButton(id, cls, extra) {
    var c = info(id);
    var b = el('button', { type: 'button', class: cls, 'data-id': id, 'aria-pressed': selected === id ? 'true' : 'false', title: c.name },
      el('span', { class: 'emo', 'aria-hidden': 'true', text: BY_ID[id].emoji }),
      el('span', { class: 'nm', text: c.name }));
    if (extra) b.appendChild(extra);
    return b;
  }

  function renderPlay() {
    var tray = $('#tray');
    tray.innerHTML = '';
    var left = round.ids.filter(function (id) { return !round.place[id]; });
    left.forEach(function (id) { tray.appendChild(cardButton(id, 'sort-card')); });
    if (!left.length && !round.checked) tray.appendChild(el('p', { class: 'tray-done', text: '✅ ' + t('all_sorted') }));
    $('#tray-wrap').hidden = round.checked;

    ['ai', 'no'].forEach(function (b) {
      var body = $('#bin-' + b + ' .bin-body');
      body.innerHTML = '';
      var ids = round.order.filter(function (id) { return round.place[id] === b; });
      ids.forEach(function (id) {
        var mark = null, cls = 'chip-card';
        if (round.checked) {
          var ok = answerOf(id) === b;
          cls += ok ? ' ok' : ' bad';
          mark = el('span', { class: 'mark', 'aria-label': ok ? t('correct') : t('wrong'), text: ok ? '✓' : '✗' });
        }
        var chip = cardButton(id, cls, mark);
        if (round.checked) chip.setAttribute('aria-disabled', 'true');
        body.appendChild(chip);
      });
      if (!ids.length) body.appendChild(el('p', { class: 'bin-empty', text: t('bin_empty') }));
      $('#cnt-' + b).textContent = EDU.fmt(ids.length);
      var bin = $('#bin-' + b);
      bin.classList.toggle('ready', !!selected && !round.checked && round.place[selected] !== b);
      $('#bin-' + b + '-btn').setAttribute('aria-label', binName(b) + ' (' + EDU.fmt(ids.length) + ')');
    });

    var status = $('#play-status');
    if (round.checked) status.textContent = '';
    else if (selected) status.textContent = t('choose_for', { name: info(selected).name });
    else status.textContent = t('sorted_n', { n: EDU.fmt(round.order.length), total: EDU.fmt(ROUND_SIZE) });

    var chk = $('#check');
    chk.hidden = round.checked;
    chk.disabled = round.order.length < ROUND_SIZE;
    $('#new-round').classList.toggle('btn-primary', round.checked);

    // tap-to-choose bar (phones)
    var bar = $('#choose-bar');
    bar.hidden = !(selected && !round.checked && tab === 'play');
    if (selected) {
      $('#choose-text').textContent = t('choose_for', { name: info(selected).name });
      $('#choose-back').hidden = !round.place[selected];
      $('#choose-ai').disabled = round.place[selected] === 'ai';
      $('#choose-no').disabled = round.place[selected] === 'no';
    }
    renderResults();
  }

  function starsEl(n) {
    var s = el('span', { class: 'stars', role: 'img', 'aria-label': t('stars_label', { n: EDU.fmt(n) }) });
    for (var i = 0; i < 3; i++) s.appendChild(el('span', { class: i < n ? 'on' : 'off', 'aria-hidden': 'true', text: '★' }));
    return s;
  }

  function renderResults() {
    var box = $('#results');
    box.innerHTML = '';
    if (!round.checked) { box.hidden = true; return; }
    box.hidden = false;
    var s = scoreOf();
    var stars = s >= 9 ? 3 : s >= 7 ? 2 : s >= 5 ? 1 : 0;
    box.appendChild(el('div', { class: 'callout ' + (stars >= 2 ? 'success' : 'accent') },
      el('div', { class: 'score-box' },
        el('div', { class: 'score-big' }, el('span', { id: 'score-num', text: EDU.fmt(s) }), el('span', { class: 'muted', text: '/' + EDU.fmt(ROUND_SIZE) })),
        starsEl(stars),
        el('div', { class: 'grow' },
          el('p', { class: 'mb0', style: { fontWeight: '700', fontSize: '1.1rem' }, id: 'score-text', text: t('score_of', { n: EDU.fmt(s), total: EDU.fmt(ROUND_SIZE) }) }),
          el('p', { class: 'mb0', id: 'score-msg', text: t('msg_' + stars) })))));
    box.appendChild(el('h3', { class: 'mb0', text: t('results_title') }));
    var list = el('div', { class: 'res-list' });
    var ids = round.ids.slice().sort(function (a, b) {
      var wa = round.place[a] === answerOf(a) ? 1 : 0, wb = round.place[b] === answerOf(b) ? 1 : 0;
      return wa - wb;
    });
    ids.forEach(function (id) {
      var ok = round.place[id] === answerOf(id), c = info(id), ans = answerOf(id);
      var badges = el('div', { class: 'badges' },
        el('span', { class: 'badge ' + (ans === 'ai' ? 'ans-ai' : 'ans-no'), text: t('answer_is', { a: binName(ans) }) }),
        el('span', { class: 'badge', text: tagText(id) }));
      if (!ok) badges.appendChild(el('span', { class: 'badge danger', text: t('your_answer', { a: binName(round.place[id]) }) }));
      list.appendChild(el('article', { class: 'res' + (ok ? '' : ' bad'), 'data-id': id },
        el('div', { class: 'emo', 'aria-hidden': 'true', text: BY_ID[id].emoji }),
        el('div', { class: 'grow' },
          el('h3', {}, el('span', { class: ok ? 'ok' : 'bad', 'aria-label': ok ? t('correct') : t('wrong'), text: (ok ? '✓ ' : '✗ ') }), c.name),
          badges,
          el('p', { text: c.why }))));
    });
    box.appendChild(list);
  }

  function renderStats() {
    $('#best').hidden = stats.best < 0;   // nothing to show before the first round (and avoids "–/10" bidi flips in Urdu)
    $('#best').textContent = '🏆 ' + t('best_n', { n: EDU.fmt(Math.max(0, stats.best)), total: EDU.fmt(ROUND_SIZE) });
    $('#rounds').textContent = t('rounds_n', { n: EDU.fmt(stats.rounds) });
  }

  /* ---------------- drag (mouse, pen, and touch on big screens) ---------------- */
  var drag = null, suppressClick = false;
  function targetAt(x, y) {
    var n = document.elementFromPoint(x, y);
    if (!n) return null;
    var b = n.closest('.bin');
    if (b) return b.getAttribute('data-bin');
    if (n.closest('#tray-wrap')) return 'tray';
    return null;
  }
  function highlight(tgt) {
    ['ai', 'no'].forEach(function (b) { $('#bin-' + b).classList.toggle('hover', tgt === b); });
  }
  function endDrag() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    if (drag && drag.ghost) drag.ghost.remove();
    if (drag && drag.el) drag.el.classList.remove('dragging');
    document.body.classList.remove('is-dragging');
    highlight(null);
    drag = null;
  }
  function onDown(e) {
    usingKeyboard = false;
    var c = e.target.closest('[data-id]');
    if (!c || round.checked || drag) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = { id: c.getAttribute('data-id'), el: c, x0: e.clientX, y0: e.clientY, pid: e.pointerId, active: false };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.active) {
      if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < 8) return;
      var r = drag.el.getBoundingClientRect();
      drag.offX = drag.x0 - r.left; drag.offY = drag.y0 - r.top;
      var g = drag.el.cloneNode(true);
      g.classList.add('drag-ghost'); g.removeAttribute('id'); g.removeAttribute('data-id');
      g.setAttribute('aria-hidden', 'true');
      g.style.width = r.width + 'px';
      document.body.appendChild(g);
      drag.ghost = g; drag.active = true;
      drag.el.classList.add('dragging');
      document.body.classList.add('is-dragging');
    }
    e.preventDefault();
    drag.ghost.style.transform = 'translate(' + (e.clientX - drag.offX) + 'px,' + (e.clientY - drag.offY) + 'px)';
    highlight(targetAt(e.clientX, e.clientY));
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var d = drag;
    var tgt = d.active ? targetAt(e.clientX, e.clientY) : null;
    endDrag();
    if (!d.active) return;
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    if (tgt === 'ai' || tgt === 'no') { if (round.place[d.id] !== tgt) placeCard(d.id, tgt); else { selected = null; renderPlay(); } }
    else if (tgt === 'tray') unplace(d.id);
  }
  function onCancel(e) { if (drag && e.pointerId === drag.pid) endDrag(); }

  /* ---------------- play: events ---------------- */
  var play = $('#panel-play');
  play.addEventListener('pointerdown', onDown);
  play.addEventListener('click', function (e) {
    if (suppressClick) return;
    var c = e.target.closest('[data-id]');
    if (c) { select(c.getAttribute('data-id')); return; }
    var b = e.target.closest('[data-bin]');
    if (b && selected) placeCard(selected, b.getAttribute('data-bin'));
  });
  $('#check').addEventListener('click', check);
  $('#new-round').addEventListener('click', newRound);
  $('#reset').addEventListener('click', resetAll);
  $('#choose-ai').addEventListener('click', function () { if (selected) placeCard(selected, 'ai'); });
  $('#choose-no').addEventListener('click', function () { if (selected) placeCard(selected, 'no'); });
  $('#choose-back').addEventListener('click', function () { if (selected) unplace(selected); });
  $('#choose-x').addEventListener('click', function () { selected = null; renderPlay(); });

  /* ---------------- class vote (projector) ---------------- */
  function voteBox(b) {
    var cls = 'vote' + (b === 'no' ? ' no' : '');
    return el('div', { class: cls },
      el('div', {},
        el('div', { class: 'vote-title' }, el('span', { 'aria-hidden': 'true', text: (b === 'ai' ? '🤖 ' : '⚙️ ') }), binName(b)),
        el('div', { class: 'vote-sub', text: t('votes_label') })),
      el('div', { class: 'vote-row' },
        el('button', { type: 'button', class: 'vote-btn', id: 'vote-' + b + '-minus', 'aria-label': t('vote_minus', { bin: binName(b) }), text: '−', disabled: deck.revealed,
          onclick: function () { vote(b, -1); } }),
        el('span', { class: 'vote-count', id: 'votes-' + b, 'aria-live': 'polite', text: EDU.fmt(deck[b]) }),
        el('button', { type: 'button', class: 'vote-btn', id: 'vote-' + b + '-plus', 'aria-label': t('vote_plus', { bin: binName(b) }), text: '+', disabled: deck.revealed,
          onclick: function () { vote(b, 1); } })));
  }
  function vote(b, d) {
    if (deck.revealed || deck.i >= deck.order.length) return;
    deck[b] = EDU.clamp(deck[b] + d, 0, 999);
    saveDeck();
    var n = $('#votes-' + b); if (n) n.textContent = EDU.fmt(deck[b]);
  }
  function reveal() {
    if (deck.revealed || deck.i >= deck.order.length) return;
    deck.revealed = true;
    var id = deck.order[deck.i];
    if (deck.ai + deck.no > 0 && deck.ai !== deck.no) {
      deck.counted += 1;
      if ((deck.ai > deck.no ? 'ai' : 'no') === answerOf(id)) deck.right += 1;
    }
    saveDeck(); renderClass();
    var nx = $('#next'); if (nx) nx.focus();
  }
  function nextCard() {
    if (deck.i >= deck.order.length) return;
    deck.i += 1; deck.revealed = false; deck.ai = 0; deck.no = 0;
    saveDeck(); renderClass();
    var rv = $('#reveal'); if (rv) rv.focus(); else { var rs = $('#restart-deck'); if (rs) rs.focus(); }
  }
  function restartDeck() { deck = makeDeck(); saveDeck(); renderClass(); }
  function readAloud() {
    if (deck.i >= deck.order.length) return;
    var id = deck.order[deck.i], c = info(id);
    var text = c.name + (deck.revealed ? '. ' + binName(answerOf(id)) + '. ' + c.why : '?');
    EDU.speak(text).then(function (ok) { if (!ok) EDU.toast(t('no_voice')); });
  }

  function renderClass() {
    var st = $('#class-stage');
    st.innerHTML = '';
    var total = deck.order.length;
    var scoreTxt = deck.counted ? t('class_score', { n: EDU.fmt(deck.right), total: EDU.fmt(deck.counted) }) : '';
    var top = el('div', { class: 'row spread' },
      el('div', { class: 'row' },
        el('span', { class: 'badge primary', id: 'card-counter', text: t('card_n', { n: EDU.fmt(Math.min(deck.i + 1, total)), total: EDU.fmt(total) }) }),
        el('span', { class: 'badge success', id: 'class-score', hidden: !deck.counted, text: scoreTxt })),
      el('div', { class: 'row' },
        deck.i < total ? el('button', { type: 'button', class: 'btn btn-sm', id: 'speak-btn', onclick: readAloud }, el('span', { 'aria-hidden': 'true', text: '🔊' }), t('read_aloud')) : null,
        el('button', { type: 'button', class: 'btn btn-sm', id: 'fs-btn', onclick: function () { EDU.fullscreen(st); } }, el('span', { 'aria-hidden': 'true', text: '⛶' }), t('fullscreen'))));
    st.appendChild(top);

    if (deck.i >= total) {
      st.appendChild(el('div', { class: 'deck-done', id: 'deck-done' },
        el('div', { class: 'big-emoji', 'aria-hidden': 'true', text: '🎉' }),
        el('p', { class: 'big-name', text: t('deck_done') }),
        deck.counted ? el('p', { class: 'present', text: t('class_score', { n: EDU.fmt(deck.right), total: EDU.fmt(deck.counted) }) }) : null,
        el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'restart-deck', onclick: restartDeck }, el('span', { 'aria-hidden': 'true', text: '🔀' }), t('restart_deck'))));
      return;
    }

    var id = deck.order[deck.i], c = info(id), ans = answerOf(id);
    st.setAttribute('data-id', id);
    st.appendChild(el('div', { class: 'big-card' },
      el('div', { class: 'big-emoji', id: 'class-emoji', 'aria-hidden': 'true', text: BY_ID[id].emoji }),
      el('div', { class: 'big-name', id: 'class-name', text: c.name })));
    st.appendChild(el('div', { class: 'votes' }, voteBox('ai'), voteBox('no')));

    var ctr = el('div', { class: 'class-controls' });
    if (!deck.revealed) ctr.appendChild(el('button', { type: 'button', class: 'btn btn-accent btn-lg', id: 'reveal', onclick: reveal }, el('span', { 'aria-hidden': 'true', text: '👀' }), t('reveal')));
    else ctr.appendChild(el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'next', onclick: nextCard }, t('next'), el('span', { 'aria-hidden': 'true', class: 'edu-back-arrow', text: ' →' })));
    st.appendChild(ctr);

    var ansBox = el('div', { id: 'class-answer', 'aria-live': 'polite', class: 'class-answer' + (ans === 'no' ? ' no' : ''), hidden: !deck.revealed });
    if (deck.revealed) {
      ansBox.appendChild(el('p', { class: 'answer-banner' }, el('span', { 'aria-hidden': 'true', text: ans === 'ai' ? '🤖 ' : '⚙️ ' }), binName(ans)));
      ansBox.appendChild(el('span', { class: 'badge', text: tagText(id) }));
      ansBox.appendChild(el('p', { text: c.why }));
      if (deck.ai + deck.no > 0) {
        var msg;
        if (deck.ai === deck.no) msg = t('votes_tied');
        else {
          var maj = deck.ai > deck.no ? 'ai' : 'no';
          msg = t(maj === ans ? 'majority_right' : 'majority_wrong', { a: binName(maj) });
        }
        ansBox.appendChild(el('p', { class: 'verdict', id: 'verdict', text: msg }));
      }
    }
    st.appendChild(ansBox);
    st.appendChild(el('p', { class: 'tiny muted center mb0 keys-hint', text: t('keys_hint') }));
  }

  /* ---------------- all cards ---------------- */
  function renderGallery() {
    EDU.$$('#filters button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-f') === filter ? 'true' : 'false'); });
    var g = $('#gallery');
    g.innerHTML = '';
    ITEMS.filter(function (it) { return filter === 'all' || answerOf(it.id) === filter; }).forEach(function (it) {
      var c = info(it.id), ans = answerOf(it.id);
      g.appendChild(el('article', { class: 'card flat g-card', 'data-id': it.id },
        el('div', { class: 'g-top' },
          el('span', { class: 'emo', 'aria-hidden': 'true', text: it.emoji }),
          el('h3', { text: c.name })),
        el('div', { class: 'row', style: { gap: '5px' } },
          el('span', { class: 'badge ' + (ans === 'ai' ? 'ans-ai' : 'ans-no'), text: (ans === 'ai' ? '🤖 ' : '⚙️ ') + binName(ans) }),
          el('span', { class: 'badge', text: tagText(it.id) })),
        el('p', { text: c.why })));
    });
  }

  /* ---------------- printable worksheet + answer key ---------------- */
  function renderPrint() {
    var ps = $('#print-sheet');
    ps.innerHTML = '';
    var box = function () { return el('span', { class: 'ws-box', 'aria-hidden': 'true' }); };
    var head = el('tr', {}, el('th', { class: 'ws-c', text: '#' }), el('th', { text: t('ws_item') }),
      el('th', { class: 'ws-c', text: t('bin_ai') }), el('th', { class: 'ws-c', text: t('bin_no') }), el('th', { text: t('ws_reason'), style: { width: '38%' } }));
    var body = el('tbody');
    WS_ORDER.forEach(function (id, i) {
      body.appendChild(el('tr', {}, el('td', { class: 'ws-c', text: EDU.fmt(i + 1) }),
        el('td', { text: BY_ID[id].emoji + ' ' + info(id).name }), el('td', { class: 'ws-c' }, box()), el('td', { class: 'ws-c' }, box()), el('td')));
    });
    ps.appendChild(el('h1', { text: '🤖 ' + t('ws_title') }));
    ps.appendChild(el('p', { text: t('ws_name') }));
    ps.appendChild(el('p', { text: t('ws_instr') }));
    ps.appendChild(el('table', { class: 'ws-table' }, el('thead', {}, head), body));

    var key = el('div', { class: 'ws-key' });
    key.appendChild(el('h2', { text: t('ws_key') + ' · ' + t('ws_title') }));
    var kb = el('tbody');
    WS_ORDER.forEach(function (id, i) {
      var c = info(id);
      kb.appendChild(el('tr', {}, el('td', { class: 'ws-c', text: EDU.fmt(i + 1) }), el('td', { text: c.name }),
        el('td', { text: binName(answerOf(id)) }), el('td', { class: 'ws-small', text: c.why })));
    });
    key.appendChild(el('table', { class: 'ws-table' },
      el('thead', {}, el('tr', {}, el('th', { class: 'ws-c', text: '#' }), el('th', { text: t('ws_item') }), el('th', { text: t('result') }), el('th', { text: t('ws_reason') }))), kb));
    key.appendChild(el('div', { class: 'ws-sum' },
      el('strong', { text: t('sum_title') }),
      el('ul', {}, el('li', { text: t('tag_learn') + ': ' + t('sum_learn') }), el('li', { text: t('tag_pattern') + ': ' + t('sum_pattern') }), el('li', { text: t('sum_predict_h') + ': ' + t('sum_predict') })),
      el('p', { class: 'mb0', text: t('sum_not') })));
    ps.appendChild(key);
    ps.appendChild(el('p', { class: 'tiny', text: t('brand') + ' · ' + t('app_title') }));
  }

  /* ---------------- tabs ---------------- */
  function showTab(name) {
    tab = name; store.set('tab', tab);
    ['play', 'class', 'cards'].forEach(function (n) {
      var b = $('#tab-' + n);
      b.setAttribute('aria-selected', n === tab ? 'true' : 'false');
      b.tabIndex = n === tab ? 0 : -1;
      $('#panel-' + n).hidden = n !== tab;
    });
    if (tab !== 'play') selected = null;
    renderPlay();
  }
  EDU.$$('.tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var order = ['play', 'class', 'cards'], i = order.indexOf(tab);
      var fwd = (e.key === 'ArrowRight') !== (document.documentElement.dir === 'rtl');
      var n = order[(i + (fwd ? 1 : 2)) % 3];
      showTab(n); $('#tab-' + n).focus(); e.preventDefault();
    });
  });
  EDU.$$('#filters button').forEach(function (b) {
    b.addEventListener('click', function () { filter = b.getAttribute('data-f'); renderGallery(); });
  });
  $('#print-btn').addEventListener('click', function () { renderPrint(); window.print(); });

  /* ---------------- keyboard shortcuts ---------------- */
  document.addEventListener('keydown', function (e) {
    usingKeyboard = true;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target, tn = tg && tg.tagName;
    if (tn === 'INPUT' || tn === 'TEXTAREA' || tn === 'SELECT') return;
    var k = (e.key || '').toLowerCase();
    if (tab === 'play') {
      if (e.key === 'Escape' && selected) { selected = null; renderPlay(); return; }
      if (selected && (k === 'a' || k === 'n')) { placeCard(selected, k === 'a' ? 'ai' : 'no'); e.preventDefault(); }
    } else if (tab === 'class') {
      if (k === 'a') { vote('ai', 1); e.preventDefault(); }
      else if (k === 'n') { vote('no', 1); e.preventDefault(); }
      else if ((e.key === ' ' || e.key === 'Enter') && (!tn || tn === 'BODY' || tg.id === 'class-stage' || tg.id === 'panel-class')) {
        e.preventDefault();
        if (deck.i >= deck.order.length) return;
        if (deck.revealed) nextCard(); else reveal();
      }
    }
  });
  document.addEventListener('pointerdown', function () { usingKeyboard = false; }, true);

  /* ---------------- start ---------------- */
  function renderAll() { renderStats(); renderPlay(); renderClass(); renderGallery(); renderPrint(); }
  window.addEventListener('beforeprint', renderPrint);
  EDU.onLang(renderAll);
  showTab(tab);
  renderAll();
})();
