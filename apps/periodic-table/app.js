/* Periodic Table Explorer: interactive table, element details with Bohr model, quiz, Class 9–10 corner. */
(function () {
  'use strict';
  var SLUG = 'periodic-table';
  var D = window.PT_DATA, ELS = D.elements, BYZ = D.byZ;
  var NAMES = window.PT_NAMES || {};
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var SHELL_LETTERS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
  var MODES = ['sym2name', 'name2sym', 'num2sym', 'valency'];
  var RANGES = [20, 30, 54, 118];
  var HL = ['', 'first20', 'radio', '|grp_type', 'metal', 'nonmetal', 'metalloid', '|by_block', 's', 'p', 'd', 'f', '|by_state', 'solid', 'liquid', 'gas'];

  function defaults() {
    return { tab: 'table', sel: 11, colour: 'family', hl: '', qmode: 'sym2name', qrange: 20, best: {} };
  }
  var S = defaults();
  (function load() {
    var tab = store.get('tab', S.tab); if (['table', 'quiz', 'cbse'].indexOf(tab) >= 0) S.tab = tab;
    var sel = +store.get('sel', S.sel); if (BYZ[sel]) S.sel = sel;
    var c = store.get('colour', S.colour); if (['family', 'block', 'state'].indexOf(c) >= 0) S.colour = c;
    var hl = store.get('hl', ''); if (HL.indexOf(hl) >= 0 && hl.charAt(0) !== '|') S.hl = hl;
    var qm = store.get('qmode', S.qmode); if (MODES.indexOf(qm) >= 0) S.qmode = qm;
    var qr = +store.get('qrange', S.qrange); if (RANGES.indexOf(qr) >= 0) S.qrange = qr;
    var b = store.get('best', {}); if (b && typeof b === 'object') S.best = b;
  })();
  var legendKey = '', query = '', hoverZ = 0;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  /* ---------------- helpers ---------------- */
  function lname(e) { var a = NAMES[EDU.lang]; return (a && a[e.z - 1]) || e.name; }
  function content() { var C = window.APP_CONTENT || {}; return C[EDU.lang] || C.en || {}; }
  function colourKey(e) { return S.colour === 'block' ? e.block : S.colour === 'state' ? e.state : e.cat; }
  function cfgHTML(cfg) { return EDU.esc(cfg).replace(/(\d)([spdf])(\d+)/g, '$1$2<sup>$3</sup>'); }
  function fullCfgHTML(e) { return D.expand(e.config).map(function (s) { return s.n + s.l + '<sup>' + s.e + '</sup>'; }).join(' '); }
  /* shell lists are a notation ("2, 8, 1"), so keep them left-to-right even inside Urdu sentences */
  function shellsText(e) { return '⁦' + e.shells.join(', ') + '⁩'; }
  function valenceE(e) { return (e.block === 's' || e.block === 'p') ? e.shells[e.shells.length - 1] : null; }
  function setK(node, key) { node.style.setProperty('--k', 'var(--k-' + key + ')'); }
  function hlMatch(e, hl) {
    switch (hl) {
      case 'metal': case 'nonmetal': case 'metalloid': return e.type === hl;
      case 's': case 'p': case 'd': case 'f': return e.block === hl;
      case 'solid': case 'liquid': case 'gas': return e.state === hl;
      case 'radio': return e.radioactive;
      case 'first20': return e.z <= 20;
      default: return true;
    }
  }
  function legendItems() {
    if (S.colour === 'block') return ['s', 'p', 'd', 'f'].map(function (b) { return { key: b, label: t('block_name', { b: b }) }; });
    if (S.colour === 'state') return ['solid', 'liquid', 'gas', 'unknown'].map(function (s) { return { key: s, label: t('state_' + s) }; });
    return D.cats.map(function (c) { return { key: c, label: t('cat_' + c) }; });
  }
  function isNarrow() { return window.matchMedia && matchMedia('(max-width: 760px)').matches; }

  /* ---------------- tabs ---------------- */
  function showTab(name) {
    S.tab = name; store.set('tab', name);
    $$('#tabs [role="tab"]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === name)); b.tabIndex = b.dataset.tab === name ? 0 : -1; });
    $('#p-table').hidden = name !== 'table';
    $('#p-quiz').hidden = name !== 'quiz';
    $('#p-cbse').hidden = name !== 'cbse';
    if (name === 'quiz' && !Q.cur && !Q.done) newRound();
  }
  $$('#tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); });
    b.addEventListener('keydown', function (ev) {
      var tabs = $$('#tabs [role="tab"]'), i = tabs.indexOf(b);
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
        var dir = (ev.key === 'ArrowRight') === (document.documentElement.dir !== 'rtl') ? 1 : -1;
        var nb = tabs[(i + dir + tabs.length) % tabs.length]; nb.focus(); showTab(nb.dataset.tab); ev.preventDefault();
      }
    });
  });

  /* ---------------- table ---------------- */
  var grid = $('#pt-grid'), tiles = [], pos = {}, feat = null;

  function buildGrid() {
    grid.innerHTML = ''; tiles = []; pos = {};
    for (var g = 1; g <= 18; g++) grid.appendChild(el('div', { class: 'pt-gl', 'aria-hidden': 'true', style: { gridColumn: String(g + 1), gridRow: '1' }, text: String(g) }));
    for (var p = 1; p <= 7; p++) grid.appendChild(el('div', { class: 'pt-pl', 'aria-hidden': 'true', style: { gridColumn: '1', gridRow: String(p + 1) }, text: String(p) }));
    grid.appendChild(el('div', { class: 'pt-spacer', 'aria-hidden': 'true', style: { gridColumn: '1 / -1' } }));
    grid.appendChild(el('div', { class: 'pt-frow-label', style: { gridRow: '10' }, text: t('lanthanoids') + ' 58–71' }));
    grid.appendChild(el('div', { class: 'pt-frow-label', style: { gridRow: '11' }, text: t('actinoids') + ' 90–103' }));
    feat = el('div', { class: 'pt-feat', id: 'pt-feat' });
    grid.appendChild(feat);
    ELS.forEach(function (e) {
      pos[e.row + ',' + e.col] = e.z;
      var b = el('button', {
        type: 'button', class: 'pt-tile', dataset: { z: String(e.z) },
        style: { gridColumn: String(e.col), gridRow: String(e.row) },
        'aria-label': t('tile_aria', { name: lname(e), s: e.sym, n: e.z })
      },
        el('span', { class: 'pt-num', 'aria-hidden': 'true', text: String(e.z) }),
        el('span', { class: 'pt-sym', 'aria-hidden': 'true', text: e.sym }),
        el('span', { class: 'pt-name', 'aria-hidden': 'true', text: lname(e) }),
        el('span', { class: 'pt-mass', 'aria-hidden': 'true', text: e.mass }));
      tiles.push(b);
      grid.appendChild(b);
    });
    colourTiles(); markSelected(); applyFilters(); renderFeat();
  }

  function colourTiles() { tiles.forEach(function (b) { setK(b, colourKey(BYZ[b.dataset.z])); }); }
  function markSelected() {
    tiles.forEach(function (b) {
      var on = +b.dataset.z === S.sel;
      b.classList.toggle('sel', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      b.tabIndex = on ? 0 : -1;
    });
  }

  /* Search forgives the spelling variants people really type: ताँबा = तांबा (chandrabindu/anusvara),
     ज़िंक = जिंक (nukta), फॉस्फोरस = फास्फोरस, Malayalam chillu forms, Arabic vs Urdu letter shapes,
     zero-width joiners and accents. Query and names go through the same function. */
  var NORM_MAP = {
    'ँ': 'ं', 'ঁ': 'ং', 'ਁ': 'ਂ', 'ੰ': 'ਂ', 'ઁ': 'ં', 'ଁ': 'ଂ',
    'ॉ': 'ा', 'ॅ': 'े', 'ऑ': 'आ', 'ऍ': 'ए', 'ॲ': 'आ',
    'ૉ': 'ા', 'ૅ': 'ે', 'ઑ': 'આ', 'ઍ': 'એ',
    'ൺ': 'ണ്', 'ൻ': 'ന്', 'ർ': 'ര്', 'ൽ': 'ല്', 'ൾ': 'ള്',
    'ي': 'ی', 'ى': 'ی', 'ك': 'ک', 'ه': 'ہ', 'ة': 'ہ'
  };
  function norm(s) {
    s = String(s == null ? '' : s).trim().toLowerCase();
    try { s = s.normalize('NFD'); } catch (e) { /* very old browser: compare as typed */ }
    return s.replace(/[​-‍⁠﻿̀-ًͯ-़়਼઼଼಼ٰٟ]/g, '')
      .replace(/[ँঁਁੰઁଁॉॅऑऍॲૉૅઑઍൺ-ൾيىكهة]/g, function (c) { return NORM_MAP[c]; });
  }
  var ALIASES = window.PT_ALIASES || {};
  var searchIndex = null;
  function getIndex() {
    if (searchIndex) return searchIndex;
    searchIndex = ELS.map(function (e) {
      var names = [e.name, e.latin, e.alias].concat(ALIASES[e.z] || []);
      Object.keys(NAMES).forEach(function (L) { names.push(NAMES[L][e.z - 1]); });
      return { e: e, sym: e.sym.toLowerCase(), names: names.filter(Boolean).map(norm) };
    });
    return searchIndex;
  }
  function searchMatches(q) {
    q = norm(q).replace(/\s+/g, ' ');
    if (!q) return null;
    if (/^\d+$/.test(q)) { var e0 = BYZ[+q]; return e0 ? [{ e: e0, score: 100 }] : []; }
    var res = [];
    getIndex().forEach(function (it) {
      var e = it.e;
      var score = it.sym === q ? 100 : 0;
      it.names.forEach(function (n) {
        if (n === q) score = Math.max(score, 90);
        else if (n.indexOf(q) === 0) score = Math.max(score, 60);
        else if (q.length >= 2 && n.indexOf(q) > 0) score = Math.max(score, 30);
      });
      if (score) res.push({ e: e, score: score });
    });
    res.sort(function (a, b) { return b.score - a.score || a.e.z - b.e.z; });
    return res;
  }

  function applyFilters() {
    var matches = searchMatches(query);
    var hits = {};
    if (matches) matches.forEach(function (m) { hits[m.e.z] = 1; });
    tiles.forEach(function (b) {
      var e = BYZ[b.dataset.z];
      var on = hlMatch(e, S.hl) && (!legendKey || colourKey(e) === legendKey) && (!matches || hits[e.z]);
      b.classList.toggle('dim', !on);
      b.classList.toggle('hit', !!matches && !!hits[e.z]);
    });
    var st = $('#pt-status');
    st.textContent = matches ? (matches.length ? t('n_found', { n: EDU.fmt(matches.length) }) : t('no_match')) : '';
    return matches;
  }

  function featTile(e, cls) {
    var box = el('div', { class: cls, 'aria-hidden': 'true' },
      el('span', { class: cls === 'pt-big' ? 'b-num' : 'pt-feat-num', text: String(e.z) }),
      el('span', { class: cls === 'pt-big' ? 'b-sym' : 'pt-feat-sym', text: e.sym }),
      el('span', { class: cls === 'pt-big' ? 'b-mass' : 'pt-feat-mass', text: e.mass }));
    setK(box, colourKey(e));
    return box;
  }

  function renderFeat() {
    if (!feat) return;
    var e = BYZ[hoverZ || S.sel];
    feat.innerHTML = '';
    if (!e) { feat.appendChild(el('p', { class: 'muted', text: t('featured_hint') })); return; }
    feat.appendChild(featTile(e, 'pt-feat-tile'));
    /* the table itself is always left-to-right, but the sentences in this box follow the language (Urdu = RTL) */
    feat.appendChild(el('div', { class: 'pt-feat-info', dir: document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr' },
      el('div', { class: 'pt-feat-name', text: lname(e) }),
      EDU.lang !== 'en' ? el('div', { class: 'pt-feat-en no-i18n', lang: 'en', text: e.name }) : null,
      el('div', { class: 'pt-feat-cat', text: t('cat_' + e.cat) + ' · ' + t('block_name', { b: e.block }) }),
      el('div', { class: 'pt-feat-cfg no-i18n' }, el('span', { class: 'ltr', html: cfgHTML(e.config) }))));
  }

  function selectZ(z, opts) {
    if (!BYZ[z]) return;
    opts = opts || {};
    S.sel = z; store.set('sel', z);
    hoverZ = 0;
    markSelected(); renderFeat(); renderDetail();
    if (opts.focus) { var tb = tiles.filter(function (b) { return +b.dataset.z === z; })[0]; if (tb) tb.focus(); }
    if (opts.scroll && isNarrow()) $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  grid.addEventListener('click', function (ev) {
    var b = ev.target.closest('.pt-tile'); if (!b) return;
    selectZ(+b.dataset.z, { scroll: true });
  });
  grid.addEventListener('pointerover', function (ev) {
    if (ev.pointerType && ev.pointerType !== 'mouse') return;
    var b = ev.target.closest('.pt-tile'); if (!b) return;
    var z = +b.dataset.z; if (z !== hoverZ) { hoverZ = z; renderFeat(); }
  });
  grid.addEventListener('pointerleave', function () { if (hoverZ) { hoverZ = 0; renderFeat(); } });
  function neighbour(e, dr, dc) {
    var r = e.row, c = e.col;
    for (var i = 0; i < 20; i++) {
      r += dr; c += dc;
      if (r < 2 || r > 11 || c < 2 || c > 19) return null;
      if (r === 9) continue;
      var z = pos[r + ',' + c]; if (z) return BYZ[z];
    }
    return null;
  }
  grid.addEventListener('keydown', function (ev) {
    var b = ev.target.closest('.pt-tile'); if (!b) return;
    var e = BYZ[b.dataset.z], n = null;
    if (ev.key === 'ArrowRight') n = neighbour(e, 0, 1);
    else if (ev.key === 'ArrowLeft') n = neighbour(e, 0, -1);
    else if (ev.key === 'ArrowDown') n = neighbour(e, 1, 0);
    else if (ev.key === 'ArrowUp') n = neighbour(e, -1, 0);
    else if (ev.key === 'Home') n = BYZ[1];
    else if (ev.key === 'End') n = BYZ[118];
    else return;
    ev.preventDefault();
    if (n) selectZ(n.z, { focus: true });
  });

  /* toolbar */
  var search = $('#pt-search');
  search.addEventListener('input', function () {
    query = search.value;
    var m = applyFilters();
    if (m && m.length && m[0].score >= 90 && m[0].e.z !== S.sel) selectZ(m[0].e.z);
  });
  search.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    var m = searchMatches(search.value);
    if (m && m.length) selectZ(m[0].e.z, { scroll: true });
  });
  $$('#pt-colour button').forEach(function (b) {
    b.addEventListener('click', function () {
      S.colour = b.dataset.v; store.set('colour', S.colour); legendKey = '';
      renderColourSeg(); colourTiles(); renderLegend(); applyFilters(); renderFeat(); renderDetail();
    });
  });
  function renderColourSeg() { $$('#pt-colour button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === S.colour)); }); }
  var hlSel = $('#pt-hl');
  hlSel.addEventListener('change', function () { S.hl = hlSel.value; store.set('hl', S.hl); applyFilters(); });
  function renderHlSelect() {
    hlSel.innerHTML = '';
    var parent = hlSel;
    HL.forEach(function (v) {
      if (v.charAt(0) === '|') { parent = el('optgroup', { label: t(v.slice(1)) }); hlSel.appendChild(parent); return; }
      var label = v === '' ? t('hl_all') : /^[spdf]$/.test(v) ? t('block_name', { b: v }) : t('hl_' + v);
      parent.appendChild(el('option', { value: v, text: label }));
    });
    hlSel.value = S.hl;
  }
  function renderLegend() {
    var box = $('#pt-legend'); box.innerHTML = '';
    legendItems().forEach(function (it) {
      var sw = el('span', { class: 'pt-sw', 'aria-hidden': 'true' }); setK(sw, it.key);
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': String(legendKey === it.key), dataset: { k: it.key } }, sw, el('span', { text: it.label }));
      b.addEventListener('click', function () { legendKey = legendKey === it.key ? '' : it.key; renderLegend(); applyFilters(); });
      box.appendChild(b);
    });
  }
  $('#pt-fs').addEventListener('click', function () { EDU.fullscreen($('#pt-card')); });
  function printAs(mode) {
    document.body.setAttribute('data-print', mode);
    setTimeout(function () { window.print(); }, 30);
  }
  window.addEventListener('afterprint', function () { document.body.removeAttribute('data-print'); });
  $('#pt-print').addEventListener('click', function () { printAs('table'); });

  /* ---------------- detail ---------------- */
  function bohrSVG(e) {
    var c = 120, svg = document.createElementNS(SVGNS, 'svg');
    var n = e.massNumber - e.z;
    svg.setAttribute('viewBox', '0 0 240 240'); svg.setAttribute('role', 'img'); svg.id = 'bohr';
    svg.setAttribute('aria-label', t('bohr_caption', { p: e.z, n: n, s: shellsText(e) }));
    setK(svg, colourKey(e));
    function mk(tag, attrs, parent) { var x = document.createElementNS(SVGNS, tag); for (var k in attrs) x.setAttribute(k, attrs[k]); (parent || svg).appendChild(x); return x; }
    /* Shell letters sit on a vertical axis above the nucleus; electrons are spread evenly
       around each ring, starting half a step away from that axis so they never cover a letter. */
    e.shells.forEach(function (count, k) {
      var r = 42 + k * 22;
      mk('circle', { cx: c, cy: c, r: r, class: 'bohr-ring' });
      var g = mk('g', { class: 'bohr-shell' });
      for (var i = 0; i < count; i++) {
        var a = -Math.PI / 2 + 2 * Math.PI * (i + 0.5) / count;
        mk('circle', { cx: (c + r * Math.cos(a)).toFixed(2), cy: (c + r * Math.sin(a)).toFixed(2), r: 5.5, class: 'bohr-e' }, g);
      }
    });
    e.shells.forEach(function (count, k) {
      var lbl = mk('text', { x: c, y: (c - (42 + k * 22) + 4).toFixed(1), 'text-anchor': 'middle', class: 'bohr-lbl' });
      lbl.textContent = SHELL_LETTERS[k];
    });
    mk('circle', { cx: c, cy: c, r: 26, class: 'bohr-nuc' });
    var t1 = mk('text', { x: c, y: c - 3, 'text-anchor': 'middle', class: 'bohr-nuc-t' }); t1.textContent = e.z + 'p';
    var t2 = mk('text', { x: c, y: c + 11, 'text-anchor': 'middle', class: 'bohr-nuc-t' }); t2.textContent = n + 'n';
    return svg;
  }

  function renderDetail() {
    var e = BYZ[S.sel], box = $('#detail'), C = content();
    box.innerHTML = '';
    var speakBtn = el('button', { type: 'button', class: 'btn', id: 'd-speak', 'aria-label': t('hear_name'), title: t('hear_name'), text: '🔊' });
    speakBtn.addEventListener('click', function () {
      EDU.speak(e.name, { lang: 'en', rate: 0.85 }).then(function (ok) { if (!ok) EDU.toast(t('no_voice')); });
    });
    var prev = el('button', { type: 'button', class: 'btn', id: 'd-prev', disabled: e.z === 1, text: t('previous') });
    var next = el('button', { type: 'button', class: 'btn', id: 'd-next', disabled: e.z === 118, text: t('next') });
    prev.addEventListener('click', function () { selectZ(e.z - 1); });
    next.addEventListener('click', function () { selectZ(e.z + 1); });

    var badges = el('div', { class: 'pt-badges' },
      el('span', { class: 'badge primary', text: t('cat_' + e.cat) }),
      el('span', { class: 'badge', text: t('block_name', { b: e.block }) }),
      el('span', { class: 'badge', text: t('state_' + e.state) }),
      e.radioactive ? el('span', { class: 'badge danger', text: '☢ ' + t('radioactive') }) : null);

    var big = featTile(e, 'pt-big'); big.id = 'd-tile';
    big.querySelector('.b-sym').id = 'd-sym';
    box.appendChild(el('div', { class: 'pt-dhead' }, big,
      el('div', { class: 'grow' },
        el('h2', { id: 'd-name', text: lname(e) }),
        EDU.lang !== 'en' ? el('p', { class: 'muted mb0', text: t('in_english', { name: e.name }) }) : null,
        badges),
      el('div', { class: 'row pt-dnav no-print' }, speakBtn, prev, next)));

    var dl = el('dl', { class: 'pt-facts' });
    function row(label, value, id, isHtml) {
      dl.appendChild(el('dt', { text: label }));
      var dd = el('dd', id ? { id: id } : {});
      if (value && value.nodeType) dd.appendChild(value); else if (isHtml) dd.innerHTML = value; else dd.textContent = value;
      dl.appendChild(dd);
    }
    row(t('d_number'), EDU.fmt(e.z));
    row(t('d_mass'), e.mass);
    row(t('d_group'), e.group ? EDU.fmt(e.group) : '— (' + t(e.cat === 'lanthanoid' ? 'lanthanoids' : 'actinoids') + ')');
    row(t('d_period'), EDU.fmt(e.period));
    row(t('d_family'), t('cat_' + e.cat));
    row(t('d_type'), t('type_' + e.type));
    row(t('d_state'), t('state_' + e.state));
    row(t('d_en'), e.en != null ? EDU.fmt(e.en, { maximumFractionDigits: 2 }) : t('not_known'));
    row(t('d_config'), el('span', { class: 'ltr no-i18n', html: cfgHTML(e.config) }), 'd-config');
    if (e.z <= 36 && /\[/.test(e.config)) row(t('d_full'), el('span', { class: 'ltr no-i18n', html: fullCfgHTML(e) }));
    var sh = el('span', { class: 'ltr' }, el('span', { id: 'd-shells', text: e.shells.join(', ') }));
    if (e.z <= 20) sh.appendChild(el('span', { class: 'muted small pt-kl', text: '(' + SHELL_LETTERS.slice(0, e.shells.length).join(', ') + ')' }));
    row(t('d_shells'), sh);
    var ve = valenceE(e);
    if (ve !== null) row(t('d_valence'), EDU.fmt(ve));
    /* lists of numbers stay left-to-right (as the shells do), also in Urdu */
    if (e.valency) row(t('d_valency'), el('span', { class: 'ltr', text: e.valency.map(function (v) { return EDU.fmt(v); }).join(', ') }), 'd-valency');
    if (e.massNumber) row(t('d_particles'), t('particles_val', { p: e.z, n: e.massNumber - e.z, e: e.z, a: e.massNumber }));

    var left = el('div', { class: 'stack' }, dl);
    if (/\[/.test(e.mass)) left.appendChild(el('p', { class: 'tiny muted mb0', text: t('mass_note') }));
    if (e.latin) left.appendChild(el('p', { class: 'small mb0', text: t('latin_note', { name: e.latin }) }));
    if (e.superheavy) left.appendChild(el('p', { class: 'callout warning small mb0', text: t('predicted') }));
    var use = C.uses && C.uses[e.z];
    if (use) left.appendChild(el('div', { class: 'callout accent', id: 'd-uses' }, el('strong', { text: t('uses_title') }), el('p', { class: 'mb0', text: use })));

    var right = el('div', { class: 'pt-bohr' }, el('h3', { text: t('bohr_title') }));
    if (e.z <= 20) {
      right.appendChild(bohrSVG(e));
      right.appendChild(el('p', { class: 'small muted', text: t('bohr_caption', { p: e.z, n: e.massNumber - e.z, s: shellsText(e) }) }));
    } else {
      right.appendChild(el('p', { class: 'small muted', text: t('bohr_only20') }));
    }
    box.appendChild(el('div', { class: 'pt-dbody' }, left, right));
  }

  /* ---------------- quiz ---------------- */
  var Q = { n: 10, i: 0, correct: 0, answered: 0, used: [], cur: null, done: false };
  function bestKey() { return S.qmode === 'valency' ? 'valency' : S.qmode + '-' + S.qrange; }
  function quizPool() { var max = S.qmode === 'valency' ? 20 : S.qrange; return ELS.filter(function (e) { return e.z <= max; }); }
  function newRound() {
    Q.i = 0; Q.correct = 0; Q.answered = 0; Q.used = []; Q.cur = null; Q.done = false;
    nextQuestion();
  }
  function pickDistractors(e, pool) {
    var others = pool.filter(function (o) { return o.z !== e.z; });
    var pref = [];
    if (S.qmode === 'name2sym') pref = others.filter(function (o) { return o.sym.charAt(0) === e.sym.charAt(0); });
    else if (S.qmode === 'num2sym') pref = others.filter(function (o) { return Math.abs(o.z - e.z) <= 3; });
    else pref = others.filter(function (o) { return o.period === e.period || o.group === e.group; });
    var out = EDU.shuffle(pref).slice(0, 2);
    EDU.shuffle(others).forEach(function (o) { if (out.length < 3 && out.indexOf(o) < 0) out.push(o); });
    return out;
  }
  function nextQuestion() {
    if (Q.i >= Q.n) { finishRound(); return; }
    var pool = quizPool();
    var fresh = pool.filter(function (e) { return Q.used.indexOf(e.z) < 0; });
    var e = EDU.pick(fresh.length ? fresh : pool);
    Q.used.push(e.z);
    var opts = S.qmode === 'valency' ? [0, 1, 2, 3, 4] : EDU.shuffle([e].concat(pickDistractors(e, pool))).map(function (o) { return o.z; });
    Q.cur = { z: e.z, opts: opts, picked: null };
    Q.i++;
    renderQuiz();
  }
  function correctValue() { var e = BYZ[Q.cur.z]; return S.qmode === 'valency' ? e.valency[0] : e.z; }
  function answer(v) {
    if (!Q.cur || Q.cur.picked !== null) return;
    Q.cur.picked = v; Q.answered++;
    if (v === correctValue()) Q.correct++;
    renderQuiz();
    var nb = $('#q-next'); if (nb) nb.focus();
  }
  function finishRound() {
    Q.done = true; Q.cur = null;
    var k = bestKey();
    if (!(S.best[k] >= Q.correct)) { S.best[k] = Q.correct; store.set('best', S.best); }
    renderQuiz();
  }
  function explainValency(e) {
    var v = e.shells[e.shells.length - 1], sh = shellsText(e), nm = lname(e);
    if (e.z === 1) return t('ex_h');
    if (e.z === 2 || v === 8) return t('ex_full', { name: nm, shells: sh });
    /* carbon and silicon share their 4 electrons; boron (a metalloid) also shares its 3 rather than losing them */
    if (v === 4 || e.z === 5) return t('ex_share', { name: nm, shells: sh, v: v });
    if (v < 4) return t('ex_lose', { name: nm, shells: sh, v: v });
    return t('ex_gain', { name: nm, shells: sh, v: v, val: 8 - v });
  }
  function renderQuiz() {
    $$('#q-mode button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === S.qmode)); });
    var rs = $('#q-range');
    rs.innerHTML = '';
    RANGES.forEach(function (r) { rs.appendChild(el('option', { value: String(r), text: r === 118 ? t('range_all') : t('range_first', { n: r }) })); });
    rs.value = String(S.qmode === 'valency' ? 20 : S.qrange);
    rs.disabled = S.qmode === 'valency';
    $('#q-score').textContent = t('score_val', { c: Q.correct, n: Q.answered });
    var best = S.best[bestKey()];
    $('#q-best').textContent = best != null ? t('best_score', { b: best, n: Q.n }) : '';
    $('#q-bar').style.width = (100 * (Q.done ? Q.n : Math.max(0, Q.i - (Q.cur && Q.cur.picked === null ? 1 : 0))) / Q.n) + '%';
    $('#q-progress').textContent = t('q_progress', { i: Math.min(Q.i, Q.n), n: Q.n });
    $('#q-stage').hidden = Q.done;
    $('#q-end').hidden = !Q.done;
    if (Q.done) {
      $('#q-end-score').textContent = t('score_val', { c: Q.correct, n: Q.n });
      $('#q-end-msg').textContent = t('round_done', { c: Q.correct, n: Q.n }) + ' ' + t(Q.correct === Q.n ? 'msg_perfect' : Q.correct >= 6 ? 'msg_good' : 'msg_try');
      $('#q-end-best').textContent = t('best_score', { b: S.best[bestKey()] || 0, n: Q.n });
      return;
    }
    if (!Q.cur) return;
    var e = BYZ[Q.cur.z], qt = $('#q-text');
    qt.dataset.z = String(e.z);
    if (S.qmode === 'sym2name') qt.textContent = t('ask_sym2name', { s: e.sym });
    else if (S.qmode === 'name2sym') qt.textContent = t('ask_name2sym', { name: lname(e) });
    else if (S.qmode === 'num2sym') qt.textContent = t('ask_num2sym', { n: e.z });
    else qt.textContent = t('ask_valency', { name: lname(e), s: e.sym });

    var box = $('#q-options'); box.innerHTML = '';
    var picked = Q.cur.picked, right = correctValue();
    Q.cur.opts.forEach(function (v, i) {
      var b = el('button', { type: 'button', class: 'btn q-opt', dataset: { v: String(v) } }, el('span', { class: 'q-key', 'aria-hidden': 'true', text: String(i + 1) }));
      if (S.qmode === 'valency') b.appendChild(el('span', { class: 'q-big', text: String(v) }));
      else if (S.qmode === 'sym2name') {
        var o = BYZ[v];
        b.appendChild(el('span', { text: lname(o) }));
        if (EDU.lang !== 'en') b.appendChild(el('span', { class: 'q-sub no-i18n', lang: 'en', text: o.name }));
      } else b.appendChild(el('span', { class: 'q-big', text: BYZ[v].sym }));
      if (picked !== null) {
        b.disabled = true;
        if (v === right) b.classList.add('ok');
        else if (v === picked) b.classList.add('bad');
      }
      b.addEventListener('click', function () { answer(v); });
      box.appendChild(b);
    });
    var fb = $('#q-feedback'); fb.innerHTML = '';
    if (picked !== null) {
      var ok = picked === right;
      var verdict = ok ? t('correct') : t('wrong');
      fb.appendChild(el('strong', { class: ok ? 'ok' : 'bad', text: verdict }));
      /* "Not quite" has no full stop of its own: keep it from running into the next sentence */
      fb.appendChild(document.createTextNode(/[!?.।۔:]\s*$/.test(verdict) ? ' ' : ': '));
      fb.appendChild(el('span', { text: S.qmode === 'valency' ? explainValency(e) : t('ans_fact', { s: e.sym, name: lname(e), n: e.z }) }));
    }
    $('#q-next').disabled = picked === null;
  }
  $$('#q-mode button').forEach(function (b) {
    b.addEventListener('click', function () { S.qmode = b.dataset.v; store.set('qmode', S.qmode); newRound(); });
  });
  $('#q-range').addEventListener('change', function () { S.qrange = +$('#q-range').value; store.set('qrange', S.qrange); newRound(); });
  $('#q-next').addEventListener('click', nextQuestion);
  $('#q-again').addEventListener('click', newRound);
  document.addEventListener('keydown', function (ev) {
    if (S.tab !== 'quiz' || Q.done || !Q.cur) return;
    if (ev.target && /^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName)) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var n = parseInt(ev.key, 10);
    if (n >= 1 && n <= Q.cur.opts.length && Q.cur.picked === null) { answer(Q.cur.opts[n - 1]); ev.preventDefault(); }
    /* Enter = next question, unless a control has focus (then Enter must activate that control) */
    else if (ev.key === 'Enter' && Q.cur.picked !== null && !(ev.target && ev.target.closest && ev.target.closest('button, a, summary, [role="tab"]'))) { nextQuestion(); ev.preventDefault(); }
  });
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['tab', 'sel', 'colour', 'hl', 'qmode', 'qrange', 'best'].forEach(function (k) { store.remove(k); });
    var keepTab = S.tab;
    S = defaults(); S.tab = keepTab; store.set('tab', keepTab);
    legendKey = ''; query = ''; search.value = ''; hoverZ = 0;
    /* start the new round BEFORE re-rendering: the old question may belong to another mode
       (a valency question has options 0–4, which are not element numbers) */
    newRound(); renderAll();
  });

  /* ---------------- Class 9–10 corner ---------------- */
  function renderCbse() {
    var C = content();
    // first 20 table
    var tb = $('#first20'); tb.innerHTML = '';
    var head = el('tr', {}, el('th', { text: t('col_no') }), el('th', { text: t('col_sym') }), el('th', { class: 'nm', text: t('col_name') }), el('th', { text: t('col_massno') }),
      el('th', { text: 'K' }), el('th', { text: 'L' }), el('th', { text: 'M' }), el('th', { text: 'N' }), el('th', { text: t('d_valence') }), el('th', { text: t('d_valency') }));
    tb.appendChild(el('thead', {}, head));
    var body = el('tbody');
    ELS.slice(0, 20).forEach(function (e) {
      var nameBtn = el('button', { type: 'button', class: 'linkbtn', text: lname(e) });
      nameBtn.addEventListener('click', function () { showTab('table'); selectZ(e.z); $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      var tr = el('tr', {}, el('td', { text: String(e.z) }), el('td', { class: 'no-i18n' }, el('strong', { text: e.sym })), el('td', { class: 'nm' }, nameBtn), el('td', { text: String(e.massNumber) }));
      for (var k = 0; k < 4; k++) tr.appendChild(el('td', { text: e.shells[k] != null ? String(e.shells[k]) : '' }));
      tr.appendChild(el('td', { text: String(valenceE(e)) }));
      tr.appendChild(el('td', {}, el('span', { class: 'ltr', text: e.valency.join(', ') })));
      body.appendChild(tr);
    });
    tb.appendChild(body);
    // trends
    var ul = $('#trends'); ul.innerHTML = '';
    (C.trends || []).forEach(function (s) { ul.appendChild(el('li', { text: s })); });
    // triads (computed from the data)
    var tr3 = $('#triads'); tr3.innerHTML = '';
    tr3.appendChild(el('thead', {}, el('tr', {}, el('th', { text: t('col_triad') }), el('th', { text: t('col_avg') }), el('th', { text: t('col_middle') }))));
    var tbody = el('tbody');
    [[3, 11, 19], [20, 38, 56], [17, 35, 53]].forEach(function (tri) {
      var a = BYZ[tri[0]], m = BYZ[tri[1]], b = BYZ[tri[2]];
      var avg = (a.massValue + b.massValue) / 2;
      tbody.appendChild(el('tr', {},
        el('td', { class: 'no-i18n', title: [lname(a), lname(m), lname(b)].join(', ') }, el('strong', { text: a.sym + ', ' + m.sym + ', ' + b.sym })),
        el('td', {}, el('span', { class: 'ltr', text: '(' + a.mass + ' + ' + b.mass + ') ÷ 2 = ' + EDU.fmt(avg, { maximumFractionDigits: 2 }) })),
        el('td', {}, el('span', { class: 'ltr', text: m.sym + ' = ' + m.mass }))));
    });
    tr3.appendChild(tbody);
    // Mendeleev vs modern
    var mt = $('#mend'); mt.innerHTML = '';
    mt.appendChild(el('thead', {}, el('tr', {}, el('th', { text: t('col_point') }), el('th', { text: t('col_mend') }), el('th', { text: t('col_modern') }))));
    var mb = el('tbody');
    (C.cmp || []).forEach(function (r) {
      mb.appendChild(el('tr', {}, el('td', { text: r[0] }),
        el('td', { 'data-label': t('col_mend'), text: r[1] }),
        el('td', { 'data-label': t('col_modern'), text: r[2] })));
    });
    mt.appendChild(mb);
  }
  $('#ws-print').addEventListener('click', function () { printAs('ws'); });

  function renderWorksheet() {
    var ws = $('#ws'); ws.innerHTML = '';
    ws.appendChild(el('h1', { text: t('ws_title') }));
    ws.appendChild(el('p', { text: t('ws_line') }));
    ws.appendChild(el('p', { text: t('ws_instr') }));
    function table(withAnswers) {
      var tbl = el('table', { class: 'ws-table' });
      tbl.appendChild(el('thead', {}, el('tr', {}, el('th', { text: t('col_no') }), el('th', { text: t('col_sym') }), el('th', { text: t('col_name') }), el('th', { text: t('d_shells') }), el('th', { text: t('d_valency') }))));
      var b = el('tbody');
      ELS.slice(0, 20).forEach(function (e) {
        var giveSym = e.z % 2 === 1;
        b.appendChild(el('tr', {},
          el('td', { text: String(e.z) }),
          el('td', { text: withAnswers || giveSym ? e.sym : '' }),
          el('td', { text: withAnswers || !giveSym ? lname(e) : '' }),
          el('td', {}, withAnswers ? el('span', { class: 'ltr', text: e.shells.join(', ') }) : null),
          el('td', {}, withAnswers ? el('span', { class: 'ltr', text: e.valency.join(', ') }) : null)));
      });
      tbl.appendChild(b);
      return tbl;
    }
    ws.appendChild(table(false));
    ws.appendChild(el('div', { class: 'ws-key' }, el('h2', { text: t('ws_key') }), table(true)));
  }

  function renderTips() {
    var ul = $('#tips'); ul.innerHTML = '';
    (content().tips || []).forEach(function (s) { ul.appendChild(el('li', { text: s })); });
  }

  /* ---------------- render all ---------------- */
  function renderAll() {
    renderTips(); renderColourSeg(); renderHlSelect(); renderLegend(); buildGrid(); renderDetail();
    renderCbse(); renderWorksheet(); renderQuiz(); showTab(S.tab);
  }
  EDU.onLang(renderAll);
  renderAll();
})();
