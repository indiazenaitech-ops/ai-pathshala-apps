/* Report Card Remarks: a comment bank for teachers. Template based, no AI, no network.
   Remarks live in data-<lang>.js as window.RCR_DATA[lang] = { r: { area: [[..],[..],[..],[..]] | [..] } }.
   Every language has the same shape, so a remark id (area.level.index) means the same remark in every language.
   In a remark, {name} is the student's name and [boy|girl|neutral] is a three-way choice, used only in
   languages whose grammar needs it (Hindi, Punjabi, Urdu). With no name typed, a blank line is shown. */
(function () {
  'use strict';
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t, el = EDU.el;
  var store = EDU.store('report-card-remarks');
  var DATA = window.RCR_DATA || {};
  var AREAS = ['overall', 'academics', 'behaviour', 'participation', 'homework', 'attendance', 'reading', 'writing', 'maths', 'improve', 'wishes'];
  var FLAT = { improve: 1, wishes: 1 };
  var MAX_PICKS = 3;
  var VAR = /\[([^\[\]|]*)\|([^\[\]|]*)\|([^\[\]|]*)\]/g;
  var BLANK = '______';

  var st = {
    name: store.get('name', ''),
    g: store.get('g', 2),
    rlang: store.get('rlang', ''),       // '' = same as the app language
    area: store.get('area', 'overall'),
    level: store.get('level', 1),
    favs: store.get('favs', []),
    picks: []
  };
  /* anything read back from storage is checked, so an old or broken value can never crash the page */
  st.name = typeof st.name === 'string' ? st.name.slice(0, 60) : '';
  if ([0, 1, 2].indexOf(st.g) < 0) st.g = 2;
  if (AREAS.indexOf(st.area) < 0) st.area = 'overall';
  if ([0, 1, 2, 3].indexOf(st.level) < 0) st.level = 1;
  st.favs = Array.isArray(st.favs) ? st.favs.filter(function (id) { return typeof id === 'string' && /^[a-z]+\.\d\.\d+$/.test(id); }) : [];
  if (typeof st.rlang !== 'string' || (st.rlang && !DATA[st.rlang])) st.rlang = '';

  EDU.init({ slug: 'report-card-remarks', title: 'app_title', waKey: 'shell_wa_tool' });

  function rl() { var c = st.rlang || EDU.lang; return DATA[c] ? c : 'en'; }
  function cleanName(s) { return String(s || '').replace(/[\[\]{}|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60); }
  function fill(text, name, g, lang) {
    var n = cleanName(name) || BLANK;
    var out = String(text).replace(VAR, function (m, a, b, c) { return [a, b, c][g] !== undefined ? [a, b, c][g] : c; }).split('{name}').join(n);
    out = out.replace(/\s+/g, ' ').trim();
    if (lang === 'en') out = out.charAt(0).toUpperCase() + out.slice(1);
    return out;
  }
  function raw(id, lang) {
    var p = id.split('.'), d = (DATA[lang] || DATA.en).r[p[0]];
    if (!d) return null;
    var arr = FLAT[p[0]] ? d : d[+p[1]];
    return arr && arr[+p[2]] !== undefined ? arr[+p[2]] : null;
  }
  function textOf(id) { var r = raw(id, rl()); return r === null ? null : fill(r, st.name, st.g, rl()); }
  function idsFor(area, level) {
    var d = (DATA[rl()] || DATA.en).r[area], arr = FLAT[area] ? d : d[level], lv = FLAT[area] ? 0 : level;
    return arr.map(function (x, i) { return area + '.' + lv + '.' + i; });
  }
  var pronCache = {};
  function needsPronoun(lang) {
    if (!(lang in pronCache)) pronCache[lang] = new RegExp(VAR.source).test(JSON.stringify((DATA[lang] || DATA.en).r));
    return pronCache[lang];
  }
  function save() { ['name', 'g', 'rlang', 'area', 'level', 'favs'].forEach(function (k) { store.set(k, st[k]); }); }

  function copyText(text) {
    if (!text) return;
    window.RCR.last = text;
    EDU.copy(text);
    $('#status').textContent = t(cleanName(st.name) ? 'copied' : 'copied_blank');
  }

  function item(id) {
    var text = textOf(id); if (text === null) return null;
    var lang = rl(), fav = st.favs.indexOf(id) >= 0, picked = st.picks.indexOf(id) >= 0;
    return el('li', { class: 'rcr-item', dataset: { id: id } },
      el('button', { class: 'rcr-text no-i18n', type: 'button', lang: lang, dir: EDU.langInfo(lang).dir, text: text, title: t('tap_copy'), onclick: function () { copyText(textOf(id)); } }),
      el('div', { class: 'rcr-act' },
        el('button', { type: 'button', class: 'rcr-add' + (picked ? ' on' : ''), 'aria-label': t(picked ? 'remove_pick' : 'add_combo'), title: t(picked ? 'remove_pick' : 'add_combo'), text: picked ? '✓' : '+', onclick: function () { togglePick(id); } }),
        el('button', { type: 'button', class: 'rcr-fav', 'aria-pressed': String(fav), 'aria-label': t(fav ? 'fav_remove' : 'fav_add'), title: t(fav ? 'fav_remove' : 'fav_add'), text: fav ? '★' : '☆', onclick: function () { toggleFav(id); } })
      ));
  }
  function fillList(ul, ids) {
    ul.textContent = '';
    ids.forEach(function (id) { var li = item(id); if (li) ul.appendChild(li); });
  }

  function togglePick(id) {
    var i = st.picks.indexOf(id);
    if (i >= 0) st.picks.splice(i, 1);
    else if (st.picks.length >= MAX_PICKS) { EDU.toast(t('combo_full')); return; }
    else st.picks.push(id);
    render(true);
  }
  function toggleFav(id) {
    var i = st.favs.indexOf(id);
    if (i >= 0) st.favs.splice(i, 1); else st.favs.unshift(id);
    st.favs = st.favs.slice(0, 200);
    save(); render(false);
  }
  function comboText() { return st.picks.map(textOf).filter(Boolean).join(' '); }

  function render(updateCombo) {
    var lang = rl();
    // remark language picker
    var sel = $('#rlang');
    sel.textContent = '';
    sel.appendChild(el('option', { value: '', text: t('rlang_same') }));
    EDU.LANGS.forEach(function (L) { if (DATA[L.code]) sel.appendChild(el('option', { value: L.code, class: 'no-i18n', text: L.native })); });
    sel.value = st.rlang;
    if (document.activeElement !== $('#name')) $('#name').value = st.name;
    // he / she / they: only when the remark language needs it
    $('#pronBox').hidden = !needsPronoun(lang);
    $$('#pron button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.g === st.g)); });
    // areas and levels
    var ar = $('#areas'); ar.textContent = '';
    AREAS.forEach(function (a) {
      ar.appendChild(el('button', { class: 'chip', type: 'button', 'aria-pressed': String(a === st.area), dataset: { area: a }, text: t('a_' + a), onclick: function () { st.area = a; save(); render(false); } }));
    });
    $('#levelBox').hidden = !!FLAT[st.area];
    var lv = $('#levels'); lv.textContent = '';
    [0, 1, 2, 3].forEach(function (i) {
      lv.appendChild(el('button', { class: 'chip', type: 'button', 'aria-pressed': String(i === st.level), dataset: { level: String(i) }, text: t('l_' + i), onclick: function () { st.level = i; save(); render(false); } }));
    });
    // remarks
    var ids = idsFor(st.area, st.level);
    fillList($('#list'), ids);
    $('#count').textContent = t('n_remarks', { n: EDU.fmt(ids.length) });
    $('#printHead').textContent = t('a_' + st.area) + (FLAT[st.area] ? '' : ' · ' + t('l_' + st.level));
    // favourites
    var favIds = st.favs.filter(function (id) { return raw(id, lang) !== null; });
    fillList($('#favs'), favIds);
    $('#favEmpty').hidden = favIds.length > 0;
    $('#favCount').textContent = EDU.fmt(favIds.length);
    // combined remark
    var pk = $('#picks'); pk.textContent = '';
    st.picks.forEach(function (id, i) {
      pk.appendChild(el('button', { class: 'chip no-i18n', type: 'button', title: t('remove_pick'), 'aria-label': t('remove_pick'), onclick: function () { togglePick(id); } },
        el('span', { lang: lang, dir: EDU.langInfo(lang).dir, text: (i + 1) + '. ' + (textOf(id) || '') }), el('b', { text: '×' })));
    });
    var ta = $('#comboText');
    ta.lang = lang; ta.dir = EDU.langInfo(lang).dir;
    if (updateCombo) ta.value = comboText();
    EDU.apply($('#app'));
  }

  $('#name').addEventListener('input', function () { st.name = this.value.slice(0, 60); save(); render(true); });
  $('#rlang').addEventListener('change', function () { st.rlang = this.value; save(); render(true); });
  $('#pron').addEventListener('click', function (e) { var b = e.target.closest('[data-g]'); if (!b) return; st.g = +b.dataset.g; save(); render(true); });
  $('#comboCopy').addEventListener('click', function () {
    var v = $('#comboText').value.trim();
    if (!v) { EDU.toast(t('combo_empty')); return; }
    copyText(v);
  });
  $('#comboClear').addEventListener('click', function () { st.picks = []; $('#comboText').value = ''; render(true); });
  $('#printBtn').addEventListener('click', function () { window.print(); });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    st = { name: '', g: 2, rlang: '', area: 'overall', level: 1, favs: [], picks: [] };
    save(); $('#name').value = ''; $('#status').textContent = ''; render(true);
  });

  window.RCR = { AREAS: AREAS, FLAT: FLAT, fill: fill, last: '', state: function () { return JSON.parse(JSON.stringify(st)); }, rl: rl };

  EDU.onLang(function () { $('#status').textContent = ''; render(true); });
  render(true);
})();
