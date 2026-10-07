/* Recommendation Lab: three recommenders side by side, with the maths shown, plus a filter-bubble simulator.
   - Popular: count of the 40 built-in users who gave 4–5 stars ("likes"), average rating breaks ties.
   - Similar videos (content-based): taste profile = Σ (stars − 3) per tag; score = cosine(profile, video's 0/1 tag vector).
   - People like you (user–user collaborative filtering): similarity = cosine of (stars − 3) over videos both rated (≥ 2 in common);
     the top K users with similarity > 0 are the neighbours; predicted stars = 3 + Σ sim·(r − 3) / Σ sim over neighbours who rated it.
   Ties keep catalogue order and are marked "=". All data is made up (content.js); nothing leaves the device. */
(function () {
  'use strict';
  var SLUG = 'recommendation-lab';
  EDU.init({ slug: SLUG, title: 'app_title' });
  var t = EDU.t, $ = EDU.$, el = EDU.el;
  var store = EDU.store(SLUG);
  var D = window.RECO_DATA, NI = D.items.length, GEN = D.genres;
  var K = 6, TOP = 5, EPS = 1e-9;
  var USERS = D.ratings.map(function (s) { return s.split('').map(Number); });

  /* example ratings: "you" loves cricket and science, the friend loves music and study */
  var EX_YOU = '545400000200000003450000300100';
  var EX_FRIEND = '000000300554000540000000000002';

  function arr(str) { var a = []; for (var i = 0; i < NI; i++) { var v = parseInt(String(str || '')[i], 10); a.push(v >= 0 && v <= 5 ? v : 0); } return a; }
  function load() {
    var d = store.get('state', null) || {};
    var hasYou = typeof d.you === 'string';
    return {
      you: arr(hasYou ? d.you : EX_YOU), friend: arr(d.friend || ''),
      rater: d.rater === 'friend' ? 'friend' : 'you',
      filter: GEN.indexOf(d.filter) >= 0 ? d.filter : 'all', onlyRated: !!d.onlyRated,
      hist: (Array.isArray(d.hist) ? d.hist : []).filter(function (i) { return i >= 0 && i < NI; }).slice(-60),
      now: typeof d.now === 'number' && d.now >= 0 && d.now < NI ? d.now : -1, explore: !!d.explore
    };
  }
  var S = load();
  var open = {};   // which "Why?" boxes are open: 'pop-3'
  function save() { store.set('state', { you: S.you.join(''), friend: S.friend.join(''), rater: S.rater, filter: S.filter, onlyRated: S.onlyRated, hist: S.hist, now: S.now, explore: S.explore }); }

  function C() { var c = window.APP_CONTENT || {}; return c[EDU.lang] || c.en; }
  function title(i) { return C().items[i]; }
  function gname(g) { return t('g_' + g); }
  function f2(x) { return EDU.fmt(x, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function f1(x) { return EDU.fmt(x, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function signed(x) { return (x > 0 ? '+' : x < 0 ? '−' : '') + EDU.fmt(Math.abs(x), { maximumFractionDigits: 2 }); }
  function mine() { return S.rater === 'friend' ? S.friend : S.you; }
  function other() { return S.rater === 'friend' ? S.you : S.friend; }
  function countRated(a) { return a.filter(function (v) { return v > 0; }).length; }

  /* ---------------- recommenders ---------------- */
  function popular(rated) {
    var rows = [];
    for (var i = 0; i < NI; i++) {
      var likes = 0, sum = 0, n = 0;
      USERS.forEach(function (u) { if (u[i]) { n++; sum += u[i]; if (u[i] >= 4) likes++; } });
      rows.push({ i: i, likes: likes, avg: n ? sum / n : 0, n: n });
    }
    rows.sort(function (a, b) { return b.likes - a.likes || b.avg - a.avg || a.i - b.i; });
    var out = rows.filter(function (r) { return !rated[r.i]; }).slice(0, TOP);
    out.forEach(function (r, k) { r.tie = k > 0 && r.likes === out[k - 1].likes && Math.abs(r.avg - out[k - 1].avg) < EPS; });
    return { list: out, all: rows };
  }

  function profileOf(a) {
    var p = {}; GEN.forEach(function (g) { p[g] = 0; });
    a.forEach(function (st, i) { if (st) D.items[i].tags.forEach(function (g) { p[g] += st - 3; }); });
    return p;
  }
  function contentBased(a) {
    var p = profileOf(a), np = Math.sqrt(GEN.reduce(function (s, g) { return s + p[g] * p[g]; }, 0));
    if (np < EPS) return { need: true, profile: p, np: 0, list: [] };
    var rows = [];
    for (var i = 0; i < NI; i++) {
      if (a[i]) continue;
      var tags = D.items[i].tags, dot = tags.reduce(function (s, g) { return s + p[g]; }, 0), nv = Math.sqrt(tags.length);
      rows.push({ i: i, dot: dot, nv: nv, cos: dot / (np * nv) });
    }
    rows.sort(function (x, y) { return (y.cos - x.cos > EPS ? 1 : x.cos - y.cos > EPS ? -1 : 0) || x.i - y.i; });
    var out = rows.slice(0, TOP);
    out.forEach(function (r, k) { r.tie = k > 0 && Math.abs(r.cos - out[k - 1].cos) < EPS; });
    return { profile: p, np: np, list: out };
  }

  function similarity(a, b) {
    var dot = 0, na = 0, nb = 0, n = 0;
    for (var i = 0; i < NI; i++) if (a[i] && b[i]) { n++; var x = a[i] - 3, y = b[i] - 3; dot += x * y; na += x * x; nb += y * y; }
    if (n < 2 || na < EPS || nb < EPS) return { sim: 0, n: n };
    return { sim: dot / Math.sqrt(na * nb), n: n };
  }
  function others() {
    var list = USERS.map(function (u, k) { return { r: u, name: C().names[k], k: k }; });
    var o = other();
    if (countRated(o) >= 2) list.push({ r: o, name: t(S.rater === 'friend' ? 'you_name' : 'friend_name'), k: 'other' });
    return list;
  }
  function collaborative(a) {
    if (countRated(a) < 3) return { need: true, list: [], neigh: [] };
    var neigh = others().map(function (u) { var s = similarity(a, u.r); return { name: u.name, k: u.k, r: u.r, sim: s.sim, n: s.n }; })
      .filter(function (u) { return u.sim > EPS; })
      .sort(function (x, y) { return y.sim - x.sim || y.n - x.n || (typeof x.k === 'number' ? x.k : 99) - (typeof y.k === 'number' ? y.k : 99); })
      .slice(0, K);
    var rows = [];
    for (var i = 0; i < NI; i++) {
      if (a[i]) continue;
      var num = 0, den = 0, who = [];
      neigh.forEach(function (u) { if (u.r[i]) { num += u.sim * (u.r[i] - 3); den += u.sim; who.push({ name: u.name, sim: u.sim, r: u.r[i] }); } });
      if (!who.length) continue;
      rows.push({ i: i, num: num, den: den, pred: 3 + num / den, who: who });
    }
    rows.sort(function (x, y) { return (y.pred - x.pred > EPS ? 1 : x.pred - y.pred > EPS ? -1 : 0) || y.who.length - x.who.length || x.i - y.i; });
    var out = rows.slice(0, TOP);
    out.forEach(function (r, k) { r.tie = k > 0 && Math.abs(r.pred - out[k - 1].pred) < EPS && r.who.length === out[k - 1].who.length; });
    return { list: out, neigh: neigh };
  }

  /* ---------------- section 1: rating list ---------------- */
  function renderFilter() {
    var sel = $('#filterSel'); sel.textContent = '';
    sel.appendChild(el('option', { value: 'all', text: t('filter_all') }));
    GEN.forEach(function (g) { sel.appendChild(el('option', { value: g, text: gname(g) })); });
    sel.value = S.filter;
    $('#onlyRated').checked = S.onlyRated;
  }
  function tagChips(i) { return D.items[i].tags.map(function (g) { return el('span', { class: 'tag', text: gname(g) }); }); }
  function starRow(i) {
    var a = mine(), box = el('div', { class: 'stars', role: 'group', 'aria-label': title(i) });
    for (var s = 1; s <= 5; s++) {
      box.appendChild(el('button', { type: 'button', class: s <= a[i] ? 'on' : '', 'aria-pressed': String(a[i] === s), dataset: { i: String(i), s: String(s) },
        'aria-label': t('star_aria', { n: s, title: title(i) }), text: '★' }));
    }
    return box;
  }
  function renderList() {
    var a = mine(), ul = $('#vlist'); ul.textContent = '';
    var shown = 0;
    for (var i = 0; i < NI; i++) {
      if (S.filter !== 'all' && D.items[i].tags.indexOf(S.filter) < 0) continue;
      if (S.onlyRated && !a[i]) continue;
      shown++;
      ul.appendChild(el('li', { class: 'vrow' + (a[i] ? ' rated' : ''), id: 'v' + i },
        el('span', { class: 'vicon', 'aria-hidden': 'true', text: D.items[i].icon }),
        el('div', { class: 'vmain' }, el('div', { class: 'vtitle', text: title(i) }),
          el('div', { class: 'vmeta' }, tagChips(i), el('span', { text: '· ' + t('mins', { n: EDU.fmt(D.items[i].mins) }) }))),
        starRow(i)));
    }
    if (!shown) ul.appendChild(el('li', { class: 'muted', text: t('no_videos') }));
  }
  function renderRaterBits() {
    EDU.$$('#raterSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.rater === S.rater)); });
    $('#ratedLine').textContent = t(S.rater === 'friend' ? 'rated_friend' : 'rated_you', { n: EDU.fmt(countRated(mine())), total: EDU.fmt(NI) });
    $('#forWho').textContent = t(S.rater === 'friend' ? 'for_friend' : 'for_you');
  }

  /* ---------------- section 2: comparison ---------------- */
  function recItem(kind, r, k, scoreEls, whyText) {
    var key = kind + '-' + r.i, isOpen = !!open[key];
    var li = el('li', { class: 'rec', dataset: { i: String(r.i) } },
      el('div', { class: 'rec-top' },
        el('span', { class: 'rank', text: (r.tie ? '=' : EDU.fmt(k + 1)) }),
        el('span', { class: 'vicon', 'aria-hidden': 'true', text: D.items[r.i].icon }),
        el('div', { class: 'vmain' },
          el('div', { class: 'vtitle', text: title(r.i) }),
          el('div', { class: 'vmeta' }, tagChips(r.i)),
          el('div', { class: 'score' }, scoreEls, r.tie ? el('span', { class: 'tie', title: t('tie_hint'), text: '= ' + t('tie_badge') }) : null))));
    var btn = el('button', { type: 'button', class: 'btn btn-sm btn-ghost why-btn', 'aria-expanded': String(isOpen), text: t(isOpen ? 'why_hide' : 'why') });
    btn.addEventListener('click', function () { open[key] = !open[key]; renderCompare(); });
    li.appendChild(btn);
    if (isOpen) li.appendChild(el('p', { class: 'why', text: whyText() }));
    return li;
  }

  var last = {};
  function renderCompare() {
    var a = mine(), anyTie = false;
    // popular
    var pop = popular(a), ol = $('#recPop'); ol.textContent = '';
    pop.list.forEach(function (r, k) {
      anyTie = anyTie || r.tie;
      ol.appendChild(recItem('pop', r, k, [t('pop_score', { likes: EDU.fmt(r.likes), total: EDU.fmt(USERS.length) }), el('br'), el('span', { class: 'muted', text: t('pop_avg', { avg: f1(r.avg), n: EDU.fmt(r.n) }) })],
        function () { return t('pop_why', { likes: EDU.fmt(r.likes), total: EDU.fmt(USERS.length), avg: f2(r.avg) }); }));
    });
    if (!pop.list.length) ol.appendChild(el('li', { class: 'muted', text: t('no_recs') }));
    // content-based
    var cb = contentBased(a);
    ol = $('#recCb'); ol.textContent = '';
    $('#cbNeed').hidden = !cb.need; $('#cbNeed').textContent = t('need_ratings_content');
    cb.list.forEach(function (r, k) {
      anyTie = anyTie || r.tie;
      var p = Math.round(r.cos * 100);
      ol.appendChild(recItem('cb', r, k, t('match_pct', { p: EDU.fmt(p) }), function () {
        var tags = D.items[r.i].tags;
        return t('content_why', { tags: tags.map(gname).join(', '), terms: tags.map(function (g) { return gname(g) + ' ' + signed(cb.profile[g]); }).join(', '),
          dot: signed(r.dot).replace(/^\+/, ''), np: f2(cb.np), nv: f2(r.nv), cos: f2(r.cos), p: EDU.fmt(p) });
      }));
    });
    if (!cb.need && !cb.list.length) ol.appendChild(el('li', { class: 'muted', text: t('no_recs') }));
    var pr = $('#profile'); pr.textContent = '';
    GEN.slice().sort(function (x, y) { return cb.profile[y] - cb.profile[x]; }).forEach(function (g) {
      var v = cb.profile[g];
      if (!v) return;
      pr.appendChild(el('span', { class: 'pchip ' + (v > 0 ? 'pos' : 'neg'), text: gname(g) + ' ' + signed(v) }));
    });
    if (!pr.childNodes.length) pr.appendChild(el('span', { class: 'muted small', text: '—' }));
    // collaborative
    var cf = collaborative(a);
    ol = $('#recCf'); ol.textContent = '';
    $('#cfNeed').hidden = !cf.need; $('#cfNeed').textContent = t('need_ratings_cf');
    cf.list.forEach(function (r, k) {
      anyTie = anyTie || r.tie;
      ol.appendChild(recItem('cf', r, k, [t('pred_stars', { s: f1(r.pred) }), ' ', el('span', { class: 'muted', text: t('cf_from', { n: EDU.fmt(r.who.length) }) })], function () {
        return t('cf_why', { list: r.who.map(function (w) { return t('cf_why_item', { name: w.name, sim: f2(w.sim), r: EDU.fmt(w.r) }); }).join('; '),
          num: f2(r.num), den: f2(r.den), pred: f2(r.pred) });
      }));
    });
    if (!cf.need && cf.neigh.length && !cf.list.length) ol.appendChild(el('li', { class: 'muted', text: t('no_recs') }));
    var nl = $('#neighbours'); nl.textContent = '';
    if (!cf.need && !cf.neigh.length) nl.appendChild(el('li', { class: 'muted', text: t('no_neighbours') }));
    cf.neigh.forEach(function (u) {
      nl.appendChild(el('li', {}, el('span', { class: 'nm no-i18n', text: u.name }),
        el('span', { class: 'small muted', text: t('neighbour_line', { sim: f2(u.sim), n: EDU.fmt(u.n) }) }),
        el('span', { class: 'simbar', 'aria-hidden': 'true' }, el('span', { style: { width: Math.round(u.sim * 100) + '%' } }))));
    });
    $('#tieHint').hidden = !anyTie;
    last = { pop: pop.list, cb: cb, cf: cf };
  }

  /* ---------------- section 3: filter bubble ---------------- */
  var POP = popular(new Array(NI).fill(0)).all;   // all videos, most popular first
  var popRank = {}; POP.forEach(function (r, k) { popRank[r.i] = k; });
  function main(i) { return D.items[i].tags[0]; }
  function feed() {
    var exclude = S.now;
    if (!S.hist.length) {   // cold start: the most popular video of each topic, one per topic
      var seen = {}, out = [];
      POP.forEach(function (r) { if (out.length < TOP && !seen[main(r.i)] && r.i !== exclude) { seen[main(r.i)] = 1; out.push({ i: r.i }); } });
      return out;
    }
    var w = {}; GEN.forEach(function (g) { w[g] = 0; });
    S.hist.forEach(function (i) { D.items[i].tags.forEach(function (g) { w[g] += 3; }); });
    var nw = Math.sqrt(GEN.reduce(function (s, g) { return s + w[g] * w[g]; }, 0));
    var rows = [];
    for (var i = 0; i < NI; i++) {
      if (i === exclude) continue;
      var tags = D.items[i].tags, dot = tags.reduce(function (s, g) { return s + w[g]; }, 0);
      rows.push({ i: i, cos: dot / (nw * Math.sqrt(tags.length)) });
    }
    rows.sort(function (a, b) { return (b.cos - a.cos > EPS ? 1 : a.cos - b.cos > EPS ? -1 : 0) || popRank[a.i] - popRank[b.i]; });
    var list = rows.slice(0, TOP);
    if (S.explore) {   // keep the top 3, then the most popular video from two topics that are not in the list yet
      list = list.slice(0, 3);
      var have = {}; list.forEach(function (r) { D.items[r.i].tags.forEach(function (g) { have[g] = 1; }); });
      var watchedG = {}; S.hist.forEach(function (i) { D.items[i].tags.forEach(function (g) { watchedG[g] = (watchedG[g] || 0) + 1; }); });
      var fresh = GEN.filter(function (g) { return !have[g]; }).sort(function (a, b) { return (watchedG[a] || 0) - (watchedG[b] || 0) || GEN.indexOf(a) - GEN.indexOf(b); });
      fresh.slice(0, 2).forEach(function (g) {
        var r = POP.find(function (x) { return main(x.i) === g && x.i !== exclude; });
        if (r) list.push({ i: r.i, explore: true });
      });
    }
    return list;
  }
  function variety(list) { var s = {}; list.forEach(function (r) { s[main(r.i)] = (s[main(r.i)] || 0) + 1; }); return s; }
  function renderBubble() {
    var now = $('#now'); now.textContent = '';
    if (S.now >= 0) now.appendChild(el('span', { class: 'vicon', 'aria-hidden': 'true', text: D.items[S.now].icon }));
    now.appendChild(el('div', { class: 'vmain' }, el('div', { class: 'lbl', text: '▶ ' + t('now_playing') }),
      el('div', { class: 'vtitle', text: S.now >= 0 ? title(S.now) : t('nothing_playing') }),
      S.now >= 0 ? el('div', { class: 'vmeta' }, tagChips(S.now)) : null));
    var list = feed(), ul = $('#next'); ul.textContent = '';
    list.forEach(function (r) {
      ul.appendChild(el('li', { class: r.explore ? 'explore' : '', dataset: { i: String(r.i), genre: main(r.i) } },
        el('span', { class: 'vicon', 'aria-hidden': 'true', text: D.items[r.i].icon }),
        el('div', { class: 'vmain' }, el('div', { class: 'vtitle', text: title(r.i) }), el('div', { class: 'vmeta' }, tagChips(r.i))),
        el('button', { type: 'button', class: 'btn btn-sm btn-primary watch', dataset: { i: String(r.i) }, text: '▶ ' + t('watch') })));
    });
    var v = variety(list), n = Object.keys(v).length, topG = Object.keys(v).sort(function (a, b) { return v[b] - v[a]; })[0], topN = v[topG] || 0;
    var fill = $('#meterFill'), colr = n >= 4 ? 'var(--success)' : n >= 3 ? 'var(--warning)' : 'var(--danger)';
    fill.style.width = (n / TOP * 100) + '%'; fill.style.background = colr;
    $('#meter').setAttribute('aria-valuenow', String(n));
    $('#meter').setAttribute('aria-label', t('variety'));
    $('#varietyNum').textContent = EDU.fmt(n);
    $('#varietyNum').dataset.value = String(n);
    $('#varietyTxt').textContent = t('variety_n', { n: EDU.fmt(n) });
    var msg = $('#feedMsg'), code;
    if (!S.hist.length) code = 'cold'; else if (topN >= 4) code = 'bubble'; else if (n <= 3) code = 'narrow'; else code = 'ok';
    msg.textContent = code === 'bubble' ? t('feed_bubble', { n: EDU.fmt(topN), genre: gname(topG) }) : t('feed_' + code);
    msg.className = 'feed-msg callout' + (code === 'bubble' ? ' danger' : code === 'narrow' ? ' warning' : code === 'ok' ? ' success' : '');
    msg.dataset.code = code;
    $('#exploreChk').checked = S.explore;
    $('#histCount').textContent = S.hist.length ? t('watched_n', { n: EDU.fmt(S.hist.length) }) : t('history_empty');
    var h = $('#hist'); h.textContent = '';
    S.hist.slice(-30).forEach(function (i) { h.appendChild(el('span', { title: title(i), text: D.items[i].icon })); });
    var gb = $('#gbar'); gb.textContent = '';
    if (S.hist.length) {
      var cnt = {}; S.hist.forEach(function (i) { cnt[main(i)] = (cnt[main(i)] || 0) + 1; });
      var mx = Math.max.apply(null, GEN.map(function (g) { return cnt[g] || 0; }));
      GEN.forEach(function (g) {
        if (!cnt[g]) return;
        gb.appendChild(el('div', {}, el('span', { class: 'gl', text: gname(g) }), el('span', { class: 'gb', style: { width: Math.round(cnt[g] / mx * 60) + '%' } }), el('span', { text: EDU.fmt(cnt[g]) })));
      });
    }
  }

  function renderAll() { renderFilter(); renderRaterBits(); renderList(); renderCompare(); renderBubble(); }
  function afterRating() { save(); renderRaterBits(); renderCompare(); }

  /* ---------------- events ---------------- */
  $('#vlist').addEventListener('click', function (e) {
    var b = e.target.closest('.stars button'); if (!b) return;
    var i = +b.dataset.i, s = +b.dataset.s, a = mine();
    a[i] = a[i] === s ? 0 : s;
    var row = $('#v' + i);
    if (S.onlyRated && !a[i]) renderList();
    else if (row) {
      row.classList.toggle('rated', !!a[i]);
      var old = row.querySelector('.stars'), nr = starRow(i); row.replaceChild(nr, old);
      var f = nr.querySelector('[data-s="' + s + '"]'); if (f) f.focus();
    }
    afterRating();
  });
  EDU.$$('#raterSeg button').forEach(function (b) { b.addEventListener('click', function () { S.rater = b.dataset.rater; open = {}; save(); renderRaterBits(); renderList(); renderCompare(); }); });
  $('#filterSel').addEventListener('change', function (e) { S.filter = e.target.value; save(); renderList(); });
  $('#onlyRated').addEventListener('change', function (e) { S.onlyRated = e.target.checked; save(); renderList(); });
  $('#exampleBtn').addEventListener('click', function () {
    var ex = arr(S.rater === 'friend' ? EX_FRIEND : EX_YOU);
    if (S.rater === 'friend') S.friend = ex; else S.you = ex;
    open = {}; renderList(); afterRating();
  });
  $('#clearBtn').addEventListener('click', function () {
    if (S.rater === 'friend') S.friend = arr(''); else S.you = arr('');
    open = {}; renderList(); afterRating();
  });
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen($('#cmpCard')); });
  $('#next').addEventListener('click', function (e) {
    var b = e.target.closest('.watch'); if (!b) return;
    var i = +b.dataset.i;
    S.now = i; S.hist.push(i); if (S.hist.length > 60) S.hist.shift();
    save(); renderBubble();
    var first = $('#next .watch'); if (first) first.focus();
  });
  $('#exploreChk').addEventListener('change', function (e) { S.explore = e.target.checked; save(); renderBubble(); });
  $('#clearHist').addEventListener('click', function () { S.hist = []; S.now = -1; save(); renderBubble(); });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state'); S = load(); open = {}; renderAll();
  });

  EDU.onLang(renderAll);
  renderAll();

  window.RECO_DEBUG = function () {
    var a = mine();
    return {
      rater: S.rater, ratings: a.slice(), rated: countRated(a),
      pop: last.pop.map(function (r) { return { i: r.i, likes: r.likes, avg: r.avg, tie: r.tie }; }),
      cb: last.cb.need ? null : last.cb.list.map(function (r) { return { i: r.i, cos: r.cos, tags: D.items[r.i].tags, tie: r.tie }; }),
      profile: last.cb.profile,
      cf: last.cf.need ? null : last.cf.list.map(function (r) { return { i: r.i, pred: r.pred, tags: D.items[r.i].tags, n: r.who.length, tie: r.tie }; }),
      neigh: (last.cf.neigh || []).map(function (u) { return { name: u.name, k: u.k, sim: u.sim, n: u.n }; }),
      feed: feed().map(function (r) { return { i: r.i, genre: main(r.i), explore: !!r.explore }; }), hist: S.hist.slice()
    };
  };
})();
