/* Recipe Finder: what is in my kitchen? Everything runs on this device.
   data.js  → window.RF_DATA   (ingredients + recipes: ids, quantities for 2, time, region, meal types, timers)
   content.js → window.APP_CONTENT[lang] (names, search words and steps in 12 languages) */
(function () {
  'use strict';
  var SLUG = 'recipe-finder';
  var D = window.RF_DATA, C = window.APP_CONTENT;
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, el = EDU.el;

  var ING = D.ing, RECS = D.rec, BYID = {};
  RECS.forEach(function (r) { BYID[r.id] = r; });
  var ING_IDS = Object.keys(ING);
  var CATS = ['veg', 'dairy', 'grain', 'dal', 'spice', 'basic', 'fruit', 'meat', 'other'];
  var CAT_EMO = { veg: '🥬', dairy: '🥛', grain: '🌾', dal: '🫘', spice: '🌶️', basic: '🧂', fruit: '🍌', meat: '🍗', other: '🍞' };
  var MEALS = ['breakfast', 'dal', 'sabzi', 'rice', 'roti', 'snack', 'tiffin', 'sweet', 'drink', 'side', 'festival'];
  var MEAL_EMO = { breakfast: '🌅', dal: '🍲', sabzi: '🥘', rice: '🍚', roti: '🫓', snack: '🥟', tiffin: '🍱', sweet: '🍮', drink: '🥤', side: '🥣', festival: '🪔' };
  var REGIONS = ['N', 'S', 'E', 'W', 'all'];
  var PRESETS = {
    basics: ['oil', 'salt', 'turmeric', 'red_chilli', 'cumin', 'mustard_seeds', 'coriander_powder', 'garam_masala', 'hing', 'atta', 'rice', 'sugar'],
    veg: ['onion', 'tomato', 'potato', 'green_chilli', 'ginger', 'garlic', 'coriander', 'lemon'],
    dairy: ['milk', 'curd', 'ghee', 'butter', 'paneer'],
    dal: ['toor', 'moong_dal', 'chana_dal', 'urad', 'besan', 'suji', 'poha']
  };
  var PAGE = 24;

  /* ---------- saved state ---------- */
  var S = {
    have: store.get('have', []).filter(function (id) { return ING[id]; }),
    assume: store.get('assume', true),
    cat: store.get('cat', 'veg'),
    f: Object.assign({ diet: 'any', time: 'any', meal: 'any', region: 'any', fav: false }, store.get('filters', {})),
    favs: store.get('favs', []),
    shop: store.get('shop', []),
    serv: 2
  };
  var shown = PAGE, current = null, cookIdx = 0;
  function save() {
    store.set('have', S.have); store.set('assume', S.assume); store.set('cat', S.cat);
    store.set('filters', S.f); store.set('favs', S.favs); store.set('shop', S.shop);
  }

  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  /* ---------- text helpers ---------- */
  function L() { return C[EDU.lang] || C.en; }
  function ingNames(id) { var v = L().ing[id] || C.en.ing[id] || id; return v.split('|'); }
  function ingName(id) { return ingNames(id)[0]; }
  function recText(id) { return L().rec[id] || C.en.rec[id]; }
  function recName(id) { return recText(id)[0]; }
  function flags(id) { return ' ' + ((ING[id] && ING[id].f) || '') + ' '; }
  function hasFlag(id, f) { return flags(id).indexOf(' ' + f + ' ') >= 0; }

  /* ---------- search: every language + romanised Hindi, spelling variants ---------- */
  function normLatin(s) {
    s = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
    s = s.replace(/ies$/, 'y').replace(/oes$/, 'o').replace(/([^s])s$/, '$1');
    s = s.replace(/ph/g, 'f').replace(/w/g, 'v').replace(/z/g, 'j').replace(/q/g, 'k').replace(/x/g, 'ks')
      .replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/y/g, 'i').replace(/h/g, '').replace(/(.)\1+/g, '$1');
    return s;
  }
  function norm(s) {
    s = String(s || '').trim().normalize('NFC');
    if (/^[\x00-\x7FÀ-ɏ\s]+$/.test(s)) return normLatin(s);
    return s.toLowerCase()
      .replace(/[‌‍़়਼઼଼಼ً-ٰٟ\s.,'"\-()]/g, '')
      .replace(/ँ/g, 'ं').replace(/ঁ/g, 'ং').replace(/ਁ/g, 'ਂ').replace(/ੰ/g, 'ਂ')
      .replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[هة]/g, 'ہ');
  }
  var INDEX = null;
  function buildIndex() {
    INDEX = ING_IDS.map(function (id) {
      var terms = [];
      Object.keys(C).forEach(function (lg) { (C[lg].ing[id] || '').split('|').forEach(function (x) { if (x) terms.push(x); }); });
      (ING[id].r || []).forEach(function (x) { terms.push(x); });
      var seen = {}, list = [];
      terms.forEach(function (x) { var n = norm(x); if (n && !seen[n]) { seen[n] = 1; list.push({ n: n, raw: x }); } });
      return { id: id, terms: list };
    });
  }
  /* returns [{id, score, raw}] best first. 3 = exact, 2 = starts with, 1 = contains */
  function search(q) {
    var n = norm(q);
    if (!n) return [];
    if (!INDEX) buildIndex();
    var out = [];
    INDEX.forEach(function (e, order) {
      var best = 0, raw = '', len = 99;
      e.terms.forEach(function (x) {
        var sc = x.n === n ? 3 : x.n.indexOf(n) === 0 ? 2 : (n.length >= 3 && x.n.indexOf(n) > 0) ? 1 : 0;
        if (sc > best || (sc === best && sc && x.n.length < len)) { best = sc; raw = x.raw; len = x.n.length; }
      });
      if (best) out.push({ id: e.id, score: best, raw: raw, len: len, order: order });
    });
    out.sort(function (a, b) { return b.score - a.score || a.len - b.len || a.order - b.order; });
    return out;
  }

  /* ---------- diet of a recipe (from its required ingredients) ---------- */
  var DIET = {};
  function diet(r) {
    if (DIET[r.id]) return DIET[r.id];
    var meat = false, egg = false, dairy = false, og = false, nj = false, optOG = [], optNJ = [];
    r.i.forEach(function (row) {
      var id = row[0], opt = row[3];
      if (opt) {
        if (hasFlag(id, 'og')) optOG.push(id);
        else if (hasFlag(id, 'nj') || hasFlag(id, 'meat') || hasFlag(id, 'egg')) optNJ.push(id);
        return;
      }
      if (hasFlag(id, 'meat')) meat = true;
      if (hasFlag(id, 'egg')) egg = true;
      if (hasFlag(id, 'dairy') || hasFlag(id, 'nvg')) dairy = true;
      if (hasFlag(id, 'og')) og = true;
      if (hasFlag(id, 'nj')) nj = true;
    });
    var d = { type: meat ? 'nonveg' : egg ? 'egg' : 'veg' };
    d.vegan = d.type === 'veg' && !dairy;
    d.noOG = !og;
    d.jain = !og && !nj && d.type === 'veg';
    d.skip = optOG.concat(d.jain ? optNJ : []);
    DIET[r.id] = d;
    return d;
  }

  /* ---------- matching (a tiny recommender) ---------- */
  function haveSet() { var o = {}; S.have.forEach(function (id) { o[id] = 1; }); return o; }
  function assumed(id) { return hasFlag(id, 'free') || (S.assume && hasFlag(id, 'basic')); }
  function match(r, hs) {
    /* the first main ingredient (the "hero", e.g. paneer in palak paneer) counts double */
    var need = 0, got = 0, w = 0, wgot = 0, missing = [], subs = {};
    r.i.forEach(function (row) {
      var id = row[0];
      if (row[3] || assumed(id)) return;
      var wt = need ? 1 : 2;
      need++; w += wt;
      if (hs[id]) { got++; wgot += wt; return; }
      var alt = (ING[id].s || []).filter(function (s) { return hs[s] || assumed(s); });
      if (alt.length) { wgot += wt / 2; subs[id] = alt; }
      missing.push(id);
    });
    var score = w ? wgot / w : 1;
    return { score: score, pct: Math.floor(score * 100 + 1e-9), missing: missing, subs: subs, need: need, got: got };
  }

  function passFilters(r) {
    var f = S.f, d = diet(r);
    if (f.fav && S.favs.indexOf(r.id) < 0) return false;
    if (f.diet === 'veg' && d.type !== 'veg') return false;
    if (f.diet === 'vegan' && !d.vegan) return false;
    if (f.diet === 'egg' && d.type === 'nonveg') return false;
    if (f.diet === 'nonveg' && d.type === 'veg') return false;
    if (f.diet === 'noog' && !d.noOG) return false;
    if (f.diet === 'jain' && !d.jain) return false;
    if (f.time !== 'any' && r.t > +f.time) return false;
    if (f.meal === 'quick' && r.t > 15) return false;
    if (f.meal !== 'any' && f.meal !== 'quick' && r.m.indexOf(f.meal) < 0) return false;
    if (f.region !== 'any' && r.g !== f.region) return false;
    return true;
  }

  function ranked() {
    var hs = haveSet(), list = RECS.filter(passFilters).map(function (r) { return { r: r, m: match(r, hs) }; });
    if (!S.have.length) list.sort(function (a, b) { return a.r.t - b.r.t || a.r.d - b.r.d; });
    else list.sort(function (a, b) { return b.m.score - a.m.score || a.m.missing.length - b.m.missing.length || a.r.t - b.r.t; });
    return list;
  }

  /* ---------- quantities ---------- */
  var FR = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔' };
  function nice(v) {
    var q = Math.round(v * 4) / 4, th = Math.round(v * 3) / 3;
    var x = Math.abs(th - v) < Math.abs(q - v) ? th : q;
    if (x <= 0) x = v < 0.2 ? 0.25 : x;
    var w = Math.floor(x + 1e-9), fr = Math.round((x - w) * 100) / 100;
    var fs = FR[fr] || (fr ? String(fr).slice(1) : '');
    return { v: x, s: (w ? String(w) : (fs ? '' : '0')) + fs };
  }
  function scaleQty(qty, unit, factor) {
    if (!qty || unit === 'taste') return { v: 0, s: '' };
    var v = qty * factor;
    if (unit === 'g' || unit === 'ml') { var st = v >= 100 ? 10 : 5; v = Math.max(st, Math.round(v / st) * st); return { v: v, s: EDU.fmt(v) }; }
    if (unit === 'l') { if (v < 1) { return { v: v, s: EDU.fmt(Math.round(v * 1000 / 50) * 50), ml: true }; } }
    if (unit === 'pinch' || unit === 'clove' || unit === 'sprig' || unit === 'slice') { v = Math.max(1, Math.round(v)); return { v: v, s: String(v) }; }
    return nice(v);
  }
  function qtyText(qty, unit, factor) {
    if (!qty || unit === 'taste') return t('u_taste');
    var q = scaleQty(qty, unit, factor);
    if (q.ml) return q.s + ' ' + t('u_ml');
    if (unit === 'pc') return q.s;
    return q.s + ' ' + t('u_' + unit);
  }

  /* ---------- kitchen UI ---------- */
  function addHave(id, silent) {
    if (!ING[id] || S.have.indexOf(id) >= 0) return false;
    S.have.push(id); save();
    if (!silent) { renderKitchen(); renderResults(); }
    return true;
  }
  function removeHave(id) {
    S.have = S.have.filter(function (x) { return x !== id; }); save(); renderKitchen(); renderResults();
  }
  function toggleHave(id) { if (S.have.indexOf(id) >= 0) removeHave(id); else addHave(id); }

  function renderSugg() {
    var box = $('#sugg'), q = $('#ingSearch').value;
    box.innerHTML = '';
    if (!q.trim()) return;
    var parts = q.split(/[,،、]/), last = parts[parts.length - 1];
    var res = search(last).slice(0, 10);
    if (!res.length) { box.appendChild(el('span', { class: 'muted-s', text: t('no_match', { q: last.trim() }) })); return; }
    res.forEach(function (x) {
      var nm = ingName(x.id), on = S.have.indexOf(x.id) >= 0;
      var extra = norm(x.raw) !== norm(nm) ? x.raw : '';
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': on ? 'true' : 'false', dataset: { id: x.id }, onclick: function () { toggleHave(x.id); $('#ingSearch').value = ''; renderSugg(); $('#ingSearch').focus(); } },
        (on ? '✓ ' : '+ ') + nm, extra ? el('small', { class: 'no-i18n', text: ' · ' + extra }) : '');
      box.appendChild(b);
    });
  }
  function addFromSearch() {
    var inp = $('#ingSearch'), parts = inp.value.split(/[,،、]/), added = [], notFound = [];
    parts.forEach(function (p) {
      if (!p.trim()) return;
      var r = search(p)[0];
      if (r) { if (addHave(r.id, true)) added.push(r.id); } else notFound.push(p.trim());
    });
    inp.value = notFound.join(', ');
    renderKitchen(); renderResults(); renderSugg();
    if (notFound.length) EDU.toast(t('no_match', { q: notFound.join(', ') }));
    else if (added.length) EDU.toast(t('added_n', { n: added.map(ingName).join(', ') }));
  }

  function renderKitchen() {
    $('#haveTitle').textContent = t('h_have', { n: S.have.length });
    var hl = $('#haveList'); hl.innerHTML = '';
    if (!S.have.length) hl.appendChild(el('span', { class: 'have-empty', text: t('have_empty') }));
    S.have.forEach(function (id) {
      hl.appendChild(el('button', { type: 'button', class: 'chip active', dataset: { id: id }, 'aria-label': t('remove_x', { x: ingName(id) }), onclick: function () { removeHave(id); } },
        ingName(id), el('span', { class: 'x', 'aria-hidden': 'true', text: '✕' })));
    });
    $('#btnClearHave').hidden = !S.have.length;
    $('#assumeSpices').checked = !!S.assume;
    Object.keys(PRESETS).forEach(function (k) { $('[data-preset="' + k + '"]').textContent = '+ ' + t('pre_' + k); });
    var tabs = $('#catTabs'); tabs.innerHTML = '';
    CATS.forEach(function (c) {
      tabs.appendChild(el('button', { type: 'button', 'aria-pressed': S.cat === c ? 'true' : 'false', dataset: { cat: c }, onclick: function () { S.cat = c; save(); renderKitchen(); } },
        CAT_EMO[c] + ' ' + t('cat_' + c)));
    });
    var cc = $('#catChips'); cc.innerHTML = '';
    ING_IDS.filter(function (id) { return ING[id].c === S.cat && !hasFlag(id, 'free'); }).forEach(function (id) {
      var on = S.have.indexOf(id) >= 0;
      cc.appendChild(el('button', { type: 'button', class: 'chip', 'aria-pressed': on ? 'true' : 'false', dataset: { id: id }, onclick: function () { toggleHave(id); } }, (on ? '✓ ' : '') + ingName(id)));
    });
  }

  /* ---------- filters ---------- */
  function fillSelect(sel, opts, val) {
    sel.innerHTML = '';
    opts.forEach(function (o) { sel.appendChild(el('option', { value: o[0], text: o[1] })); });
    sel.value = val;
    if (sel.value !== val) sel.value = opts[0][0];
  }
  function renderFilters() {
    fillSelect($('#fDiet'), [['any', t('f_all')], ['veg', t('d_veg')], ['vegan', t('d_vegan')], ['egg', t('d_egg')], ['nonveg', t('d_nonveg')], ['noog', t('d_noog')], ['jain', t('d_jain')]], S.f.diet);
    fillSelect($('#fTime'), [['any', t('f_all')], ['15', t('t_upto', { n: 15 })], ['30', t('t_upto', { n: 30 })], ['45', t('t_upto', { n: 45 })], ['60', t('t_upto', { n: 60 })]], S.f.time);
    fillSelect($('#fMeal'), [['any', t('f_all')], ['quick', '⚡ ' + t('m_quick')]].concat(MEALS.map(function (m) { return [m, MEAL_EMO[m] + ' ' + t('m_' + m)]; })), S.f.meal);
    fillSelect($('#fRegion'), [['any', t('f_all')]].concat(REGIONS.map(function (g) { return [g, t('r_' + g)]; })), S.f.region);
    $('#fFav').checked = !!S.f.fav;
  }

  /* ---------- results ---------- */
  function recEmoji(r) { return MEAL_EMO[r.m[0]] || '🍽️'; }
  function dietMark(d) { return el('span', { class: 'diet ' + d.type, title: t('d_' + d.type), 'aria-label': t('d_' + d.type), role: 'img' }); }
  var lastList = [];
  function renderResults() {
    var list = ranked(); lastList = list;
    var box = $('#resList'); box.innerHTML = '';
    var full = list.filter(function (x) { return x.m.score >= 0.999; }).length;
    $('#resCount').textContent = S.have.length ? t('res_count', { n: list.length, k: full }) : t('res_count_none', { n: list.length });
    var note = $('#resNote');
    note.hidden = !!S.have.length; note.textContent = S.have.length ? '' : t('quick_note');
    if (!list.length) {
      box.appendChild(el('p', { class: 'empty-msg', text: S.f.fav ? t('no_favs') : t('no_results') }));
    }
    list.slice(0, shown).forEach(function (x) {
      var r = x.r, m = x.m, d = diet(r), fav = S.favs.indexOf(r.id) >= 0;
      var meta = el('div', { class: 'rc-meta' },
        el('span', {}, dietMark(d), ' ', t('d_' + d.type)),
        el('span', { text: '⏱ ' + t('min_n', { n: r.t }) }),
        el('span', { text: t('r_' + r.g) }),
        r.p ? el('span', { text: '⏳ ' + t('soak_short', { n: r.p }) }) : '',
        fav ? el('span', { text: '★' }) : '');
      var kids = [el('span', { class: 'rc-emo', 'aria-hidden': 'true', text: recEmoji(r) }),
        el('span', { class: 'rc-name' }, el('span', { text: recName(r.id) }), S.have.length ? el('span', { class: 'rc-pct' + (m.score >= 0.999 ? ' full' : ''), text: m.pct + '%' }) : ''),
        meta];
      if (S.have.length) {
        var bar = el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span', { class: m.score >= 0.999 ? 'full' : '', style: { width: m.pct + '%' } }));
        var missTxt = m.missing.length ? t('missing_list', { list: m.missing.slice(0, 4).map(ingName).join(', ') + (m.missing.length > 4 ? ' +' + (m.missing.length - 4) : '') }) : t('have_all');
        kids.push(el('div', {}, bar, el('div', { class: 'rc-miss' + (m.missing.length ? '' : ' ok'), text: missTxt })));
      }
      box.appendChild(el('button', { type: 'button', class: 'rcard', dataset: { id: r.id, pct: String(m.pct) }, onclick: function () { openRecipe(r.id); } }, kids));
    });
    $('#btnMore').hidden = list.length <= shown;
  }

  /* ---------- one recipe ---------- */
  function openRecipe(id, serv) {
    var r = BYID[id]; if (!r) return;
    current = r; S.serv = serv || 2;
    document.body.classList.add('rf-viewing');
    $('#mainLayout').hidden = true;
    $('#recipeView').hidden = false;
    renderRecipe();
    window.scrollTo(0, 0);
    $('#btnBack').focus({ preventScroll: true });
  }
  function closeRecipe() {
    current = null;
    document.body.classList.remove('rf-viewing');
    $('#recipeView').hidden = true;
    $('#mainLayout').hidden = false;
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    renderResults();
  }
  function renderRecipe() {
    var r = current; if (!r) return;
    var tx = recText(r.id), d = diet(r), m = match(r, haveSet()), factor = S.serv / 2, hs = haveSet();
    $('#rvEmo').textContent = recEmoji(r);
    $('#rvName').textContent = tx[0];
    var fav = S.favs.indexOf(r.id) >= 0;
    $('#btnFav').textContent = fav ? '★ ' + t('btn_faved') : '☆ ' + t('btn_fav');
    $('#btnFav').setAttribute('aria-pressed', fav ? 'true' : 'false');
    var bd = $('#rvBadges'); bd.innerHTML = '';
    var b = function (txt, cls) { bd.appendChild(el('span', { class: 'badge ' + (cls || ''), text: txt })); };
    bd.appendChild(el('span', { class: 'badge' }, dietMark(d), ' ', t('d_' + d.type)));
    if (d.vegan) b(t('d_vegan'), 'success');
    if (d.jain) b(t('d_jain'), 'success'); else if (d.noOG) b(t('d_noog'), 'success');
    b('⏱ ' + t('min_n', { n: r.t }), 'primary');
    b(t('diff_' + r.d));
    b(t('r_' + r.g));
    r.m.forEach(function (x) { b(MEAL_EMO[x] + ' ' + t('m_' + x)); });
    if (r.p) b('⏳ ' + t('soak_long', { n: r.p }), 'accent');

    var seg = $('#servSeg'); seg.innerHTML = '';
    [1, 2, 4, 6].forEach(function (n) {
      seg.appendChild(el('button', { type: 'button', 'aria-pressed': S.serv === n ? 'true' : 'false', dataset: { n: String(n) }, onclick: function () { S.serv = n; renderRecipe(); } }, String(n)));
    });
    $('#servPrint').textContent = t('servings') + ': ' + S.serv;
    $('#rvSum').textContent = S.have.length ? t('rv_sum', { got: m.need - m.missing.length, need: m.need, pct: m.pct }) : t('rv_sum_none');

    var ul = $('#rvIngs'); ul.innerHTML = '';
    r.i.forEach(function (row) {
      var id = row[0], opt = row[3], isAssumed = assumed(id), have = hs[id];
      var cls = have ? 'have' : isAssumed ? 'assumed' : opt ? 'opt' : 'miss';
      var mk = have ? '✓' : isAssumed ? '•' : opt ? '○' : '✗';
      var q = scaleQty(row[1], row[2], factor);
      var nm = el('span', { class: 'nm' }, ingName(id));
      if (opt) nm.appendChild(el('span', { class: 'tag', text: ' (' + t('optional') + ')' }));
      if (cls === 'miss') nm.appendChild(el('span', { class: 'tag', text: ' · ' + t('missing') }));
      var li = el('li', { class: cls, dataset: { id: id, qty: String(q.v), unit: row[2] } },
        el('span', { class: 'mk', 'aria-hidden': 'true', text: mk }), nm, el('span', { class: 'q', text: qtyText(row[1], row[2], factor) }));
      if (cls === 'miss' || (opt && !have)) {
        var alts = ING[id].s || [];
        if (alts.length) {
          var haveAlt = alts.filter(function (a) { return hs[a] || assumed(a); });
          li.appendChild(el('span', { class: 'sub', text: (haveAlt.length ? '✓ ' : '') + t('sub_try', { list: alts.map(ingName).join(' / ') }) }));
        }
      }
      ul.appendChild(li);
    });
    var jn = $('#rvJain');
    jn.hidden = !d.skip.length;
    jn.textContent = d.skip.length ? t(d.jain ? 'jain_skip' : 'noog_skip', { list: d.skip.map(ingName).join(', ') }) : '';
    $('#btnAddMissing').disabled = !m.missing.length;

    var ol = $('#rvSteps'); ol.innerHTML = '';
    tx.slice(1).forEach(function (s, i) {
      var li = el('li', {}, el('span', { text: s }));
      var mins = r.st[i];
      if (mins) li.appendChild(el('div', {}, el('button', { type: 'button', class: 'btn btn-sm btn-ghost no-print', dataset: { step: String(i) }, onclick: function () { startTimer(r, i); } }, '⏱ ' + t('timer_n', { n: mins }))));
      ol.appendChild(li);
    });
  }
  function toggleFav() {
    if (!current) return;
    var i = S.favs.indexOf(current.id);
    if (i >= 0) S.favs.splice(i, 1); else S.favs.push(current.id);
    save(); renderRecipe();
    EDU.toast(i >= 0 ? t('fav_removed') : t('fav_added'));
  }

  /* ---------- shopping list ---------- */
  function addToShop(rows, factor) {
    var n = 0;
    rows.forEach(function (row) {
      var id = row[0], unit = row[2], qty = row[1] * factor;
      var ex = S.shop.filter(function (x) { return x.id === id; })[0];
      if (ex) {
        if (ex.unit === unit && qty && ex.qty) ex.qty += qty;
        else if (!ex.qty && qty) { ex.qty = qty; ex.unit = unit; }
      } else { S.shop.push({ id: id, qty: qty, unit: unit, done: false }); n++; }
    });
    save(); renderShop();
    return n;
  }
  function shopLine(x) { return ingName(x.id) + (x.qty ? ' — ' + qtyText(x.qty, x.unit, 1) : ''); }
  function shopText() {
    return '🛒 ' + t('h_shop') + '\n' + S.shop.filter(function (x) { return !x.done; }).map(function (x) { return '• ' + shopLine(x); }).join('\n');
  }
  function renderShop() {
    var ul = $('#shopList'); ul.innerHTML = '';
    S.shop.forEach(function (x, i) {
      var cb = el('input', { type: 'checkbox', 'aria-label': t('bought'), onchange: function () { x.done = cb.checked; save(); renderShop(); } });
      cb.checked = !!x.done;
      ul.appendChild(el('li', { class: x.done ? 'done' : '', dataset: { id: x.id } }, cb,
        el('span', { class: 'nm', text: ingName(x.id) }),
        el('span', { class: 'q', text: x.qty ? qtyText(x.qty, x.unit, 1) : '' }),
        el('button', { type: 'button', class: 'icon-btn', 'aria-label': t('remove_x', { x: ingName(x.id) }), text: '✕', onclick: function () { S.shop.splice(i, 1); save(); renderShop(); } })));
    });
    var left = S.shop.filter(function (x) { return !x.done; }).length;
    $('#shopEmpty').hidden = !!S.shop.length;
    $('#shopBtns').hidden = !S.shop.length;
    $('#shopCount').textContent = t('items_n', { n: left });
    $('#btnShopWa').href = EDU.waLink(shopText());
  }

  /* ---------- timers ---------- */
  var timers = [], tick = null, actx = null;
  function beep() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35, 0.7].forEach(function (d) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(0.25, actx.currentTime + d); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + d + 0.3);
        o.start(actx.currentTime + d); o.stop(actx.currentTime + d + 0.3);
      });
    } catch (e) { }
    try { if (navigator.vibrate) navigator.vibrate([300, 150, 300]); } catch (e) { }
  }
  function startTimer(r, i) {
    var mins = r.st[i]; if (!mins) return;
    timers = timers.filter(function (x) { return !(x.rid === r.id && x.step === i); });
    timers.push({ rid: r.id, step: i, end: Date.now() + mins * 60000, done: false });
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { }
    renderTimers();
    if (!tick) tick = setInterval(renderTimers, 1000);
    EDU.toast(t('timer_started', { n: mins }));
  }
  function renderTimers() {
    var box = $('#timers'); box.innerHTML = '';
    var now = Date.now();
    timers.forEach(function (x, k) {
      var left = Math.max(0, Math.round((x.end - now) / 1000));
      if (!left && !x.done) { x.done = true; beep(); EDU.toast(t('timer_done', { name: recName(x.rid), n: x.step + 1 })); }
      var mm = Math.floor(left / 60), ss = left % 60;
      box.appendChild(el('div', { class: 'timer' + (x.done ? ' done' : '') },
        el('span', { class: 'l', text: recName(x.rid) + ' · ' + t('step_n', { n: x.step + 1 }) }),
        el('span', { class: 't', text: x.done ? '0:00' : mm + ':' + (ss < 10 ? '0' : '') + ss }),
        el('button', { type: 'button', 'aria-label': t('stop'), text: '✕', onclick: function () { timers.splice(k, 1); renderTimers(); } })));
    });
    if (!timers.length && tick) { clearInterval(tick); tick = null; }
  }

  /* ---------- cook mode ---------- */
  function speakStep() {
    if (!current) return;
    var s = recText(current.id)[cookIdx + 1];
    EDU.speak(s, { lang: EDU.lang }).then(function (ok) { if (!ok) EDU.toast(t('no_voice')); });
  }
  function renderCook() {
    var r = current, tx = recText(r.id), n = tx.length - 1;
    cookIdx = EDU.clamp(cookIdx, 0, n - 1);
    $('#cookName').textContent = tx[0];
    $('#cookN').textContent = t('step_of', { n: cookIdx + 1, total: n });
    $('#cookText').textContent = tx[cookIdx + 1];
    $('#cookProg').style.width = ((cookIdx + 1) / n * 100) + '%';
    $('#cookPrev').disabled = cookIdx === 0;
    var last = cookIdx === n - 1;
    $('#cookNext').querySelector('span').textContent = last ? t('done') : t('next');
    var mins = r.st[cookIdx], tb = $('#cookTimer');
    tb.hidden = !mins; tb.textContent = mins ? '⏱ ' + t('timer_n', { n: mins }) : '';
    if ($('#cookAuto').checked) speakStep();
  }
  function openCook() {
    if (!current) return;
    cookIdx = 0; $('#cook').hidden = false; document.body.style.overflow = 'hidden';
    renderCook(); $('#cookNext').focus();
  }
  function closeCook() { $('#cook').hidden = true; document.body.style.overflow = ''; EDU.stopSpeaking(); $('#btnCook').focus(); }
  function cookNext() {
    var n = recText(current.id).length - 1;
    if (cookIdx >= n - 1) { EDU.toast(t('enjoy')); closeCook(); return; }
    cookIdx++; renderCook();
  }

  /* ---------- events ---------- */
  var sIn = $('#ingSearch');
  sIn.addEventListener('input', renderSugg);
  sIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addFromSearch(); } });
  EDU.$$('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.dataset.preset, n = 0;
      PRESETS[k].forEach(function (id) { if (addHave(id, true)) n++; });
      renderKitchen(); renderResults();
      EDU.toast(t('added_count', { n: n }));
    });
  });
  $('#assumeSpices').addEventListener('change', function () { S.assume = this.checked; save(); renderResults(); });
  $('#btnClearHave').addEventListener('click', function () { if (!confirm(t('confirm_clear'))) return; S.have = []; save(); renderKitchen(); renderResults(); });
  [['#fDiet', 'diet'], ['#fTime', 'time'], ['#fMeal', 'meal'], ['#fRegion', 'region']].forEach(function (p) {
    $(p[0]).addEventListener('change', function () { S.f[p[1]] = this.value; shown = PAGE; save(); renderResults(); });
  });
  $('#fFav').addEventListener('change', function () { S.f.fav = this.checked; shown = PAGE; save(); renderResults(); });
  $('#btnMore').addEventListener('click', function () { shown += PAGE; renderResults(); });
  $('#btnRandom').addEventListener('click', function () {
    var list = lastList.length ? lastList : ranked();
    if (!list.length) { EDU.toast(t('no_results')); return; }
    var pool = S.have.length ? list.filter(function (x) { return x.m.score >= 0.75; }) : list;
    if (!pool.length) pool = list.slice(0, 10);
    var pick = EDU.pick(pool);
    EDU.toast(t('random_pick', { name: recName(pick.r.id) }));
    openRecipe(pick.r.id);
  });
  $('#btnBack').addEventListener('click', closeRecipe);
  $('#btnFav').addEventListener('click', toggleFav);
  $('#btnAddMissing').addEventListener('click', function () {
    if (!current) return;
    var m = match(current, haveSet());
    var rows = current.i.filter(function (row) { return m.missing.indexOf(row[0]) >= 0; });
    addToShop(rows, S.serv / 2);
    EDU.toast(t('shop_added', { n: rows.length }));
  });
  $('#btnAddAll').addEventListener('click', function () {
    if (!current) return;
    var rows = current.i.filter(function (row) { return !row[3] && !hasFlag(row[0], 'free'); });
    addToShop(rows, S.serv / 2);
    EDU.toast(t('shop_added', { n: rows.length }));
  });
  $('#btnCook').addEventListener('click', openCook);
  $('#btnPrint').addEventListener('click', function () { window.print(); });
  $('#btnShare').addEventListener('click', function () {
    if (!current) return;
    var url = EDU.shareUrl() + '#r=' + EDU.pack({ r: current.id, s: S.serv });
    EDU.share(url, recName(current.id));
  });
  $('#btnShopCopy').addEventListener('click', function () { EDU.copy(shopText()); });
  $('#btnShopClear').addEventListener('click', function () { if (!confirm(t('confirm_clear_shop'))) return; S.shop = []; save(); renderShop(); });
  $('#cookClose').addEventListener('click', closeCook);
  $('#cookPrev').addEventListener('click', function () { cookIdx--; renderCook(); });
  $('#cookNext').addEventListener('click', cookNext);
  $('#cookSpeak').addEventListener('click', speakStep);
  $('#cookTimer').addEventListener('click', function () { startTimer(current, cookIdx); });
  document.addEventListener('keydown', function (e) {
    if ($('#cook').hidden) return;
    if (e.key === 'Escape') closeCook();
    else if (e.key === 'ArrowRight' && !e.target.closest('input')) { if (document.documentElement.dir === 'rtl') { if (cookIdx > 0) { cookIdx--; renderCook(); } } else cookNext(); }
    else if (e.key === 'ArrowLeft' && !e.target.closest('input')) { if (document.documentElement.dir === 'rtl') cookNext(); else if (cookIdx > 0) { cookIdx--; renderCook(); } }
  });

  function renderAll() {
    renderKitchen(); renderFilters(); renderResults(); renderShop(); renderTimers();
    if (current) renderRecipe();
    if (!$('#cook').hidden && current) renderCook();
    if ($('#ingSearch').value) renderSugg();
  }
  EDU.onLang(renderAll);
  renderAll();

  /* shared recipe link: #r=<packed {r: id, s: servings}> */
  var hm = /[#&]r=([\w-]+)/.exec(location.hash);
  if (hm) { var o = EDU.unpack(hm[1]); if (o && BYID[o.r]) openRecipe(o.r, [1, 2, 4, 6].indexOf(o.s) >= 0 ? o.s : 2); }

  window.RF_TEST = { search: search, match: match, diet: diet, ranked: ranked, norm: norm };
})();
