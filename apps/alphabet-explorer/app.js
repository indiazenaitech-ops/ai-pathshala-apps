/* Alphabet Explorer: letters of 10 Indian scripts + English.
   Letters tab (vowel / consonant grids + a big letter card with sound and a picture word),
   vowel-sign chart (barakhadi / uyirmei / gunintam; Urdu: aerab + letter shapes),
   a tracing canvas that measures how much of the letter was covered, a printable
   tracing worksheet, and a "listen & tap" game. Data: data.js (window.AE_DATA). */
(function () {
  'use strict';
  var SLUG = 'alphabet-explorer';
  var D = window.AE_DATA;
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var store = EDU.store(SLUG);
  var TABS = ['letters', 'signs', 'trace', 'game'];
  var LANG_SCRIPT = { en: 'deva', hi: 'deva', mr: 'deva', bn: 'beng', pa: 'guru', gu: 'gujr', or: 'orya', ta: 'taml', te: 'telu', kn: 'knda', ml: 'mlym', ur: 'arab' };
  var ROUNDS = 10;
  var ZWJ = '‍';
  var CARRIES = { 'ੳ': ['ਉ', 'ਊ', 'ਓ'], 'ੲ': ['ਇ', 'ਈ', 'ਏ'] };
  var VIRAMA = /[्্੍્୍்్್്]/;
  var MARK;
  try { MARK = new RegExp('^[\\p{M}\\u200C\\u200D]$', 'u'); } catch (e) { MARK = /^[̀-ͯऀ-ःऺ-ॏ॑-ॗॢॣঁ-ঃ়-ৗৢৣਁ-ਃ਼-ੑੰੱੵઁ-ઃ઼-્ૢૣଁ-ଃ଼-ୗୢୣஂா-ௗఀ-ఄా-ౖౢౣಁ-ಃ಼-ೖೢೣഀ-ഃ഻഼ാ-ൗൢൣً-ٰٟ‌‍]$/; }

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ================================================================ data */
  var cache = {};
  function rootOf(it) { return it ? String(it.roman).replace(/(a|ô)$/, '') : ''; }
  function getScript(id) {
    if (cache[id]) return cache[id];
    var s = D.scripts[id];
    var info = {};
    Object.keys(s.L).forEach(function (ch) {
      var p = s.L[ch].split('|');
      info[ch] = { ch: ch, roman: p[0] || '', word: p[1] || '', emoji: p[2] || '', wroman: p[3] || '', flags: p[4] || '', say: p[5] || '' };
    });
    var groups = s.groups.map(function (g) {
      return { id: g.id, label: g.label, native: g.native, rows: g.rows.map(function (r) { return r.split(' '); }) };
    });
    var flat = [], seen = {};
    groups.forEach(function (g) {
      g.rows.forEach(function (r) { r.forEach(function (ch) { if (!seen[ch]) { seen[ch] = 1; flat.push({ ch: ch, group: g.id }); } }); });
    });
    var signs = null;
    if (s.signs) {
      var bases = [];
      if (s.signs.bases) {
        var roots = s.signs.roots ? s.signs.roots.split(' ') : null;
        s.signs.bases.split(' ').forEach(function (b, i) { bases.push({ ch: b, root: roots ? roots[i] : rootOf(info[b] || info[b + '்']) }); });
      } else {
        groups.forEach(function (g) {
          if (g.id !== 'consonants') return;
          g.rows.forEach(function (r) { r.forEach(function (ch) { if (info[ch].flags.indexOf('c') < 0) bases.push({ ch: ch, root: rootOf(info[ch]) }); }); });
        });
      }
      signs = {
        tab: s.signs.tab, head: s.signs.head.split(' '), roman: s.signs.roman.split(' '), bases: bases,
        marks: s.signs.marks.split(' ').map(function (m) { return m === '-' ? '' : m; })
      };
    }
    var set = function (str) { var o = {}; String(str || '').split(' ').forEach(function (c) { if (c) o[c] = 1; }); return o; };
    var f = s.forms || {}, same = {};
    String(s.same || '').split('|').forEach(function (grp, k) { grp.split(' ').forEach(function (c) { if (c) same[c] = k + 1; }); });
    cache[id] = {
      id: id, s: s, info: info, groups: groups, flat: flat, signs: signs, lang: s.voice[0], same: same,
      nj: set(f.nj), eo: set(f.eo), ao: set(f.ao), latin: !!s.latin, rtl: s.dir === 'rtl'
    };
    return cache[id];
  }

  /* ================================================================ state */
  /* saved values may be missing, old or hand-edited: never trust their type */
  function validScript(id) { return typeof id === 'string' && Object.prototype.hasOwnProperty.call(D.scripts, id) ? id : null; }
  function objOf(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  var state = {
    script: validScript(store.get('script', null)) || LANG_SCRIPT[EDU.lang] || 'deva',
    picked: !!validScript(store.get('script', null)),
    tab: TABS.indexOf(store.get('tab', 'letters')) >= 0 ? store.get('tab', 'letters') : 'letters',
    sel: objOf(store.get('sel', {})),
    base: objOf(store.get('base', {})),
    traceIdx: objOf(store.get('traceIdx', {})),
    best: objOf(store.get('best', {})),
    slow: !!store.get('slow', false),
    hint: !!store.get('hint', false),
    pool: String(store.get('pool', 'all')),
    nopt: [3, 4, 6].indexOf(store.get('nopt', 4)) >= 0 ? store.get('nopt', 4) : 4
  };
  function save() {
    store.set('sel', state.sel); store.set('base', state.base); store.set('traceIdx', state.traceIdx);
    store.set('best', state.best); store.set('slow', state.slow); store.set('hint', state.hint);
    store.set('pool', state.pool); store.set('nopt', state.nopt); store.set('tab', state.tab);
    if (state.picked) store.set('script', state.script);
  }
  function cur() { return getScript(state.script); }
  function scName(sc) { return t(sc.s.name); }
  function display(sc, ch) { return sc.latin ? ch + ch.toLowerCase() : ch; }
  function selIndex(sc) { var i = state.sel[sc.id] | 0; return i >= 0 && i < sc.flat.length ? i : 0; }
  function groupOf(sc, gid) { for (var i = 0; i < sc.groups.length; i++) if (sc.groups[i].id === gid) return sc.groups[i]; return sc.groups[0]; }

  /* ================================================================ fonts */
  var fontAsked = {};
  function loadFont(sc) {
    var f = sc.s.font;
    if (!f || fontAsked[f]) return;
    fontAsked[f] = 1;
    if (location.protocol === 'file:' && navigator.onLine === false) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;700&display=swap';
    document.head.appendChild(l);
    if (document.fonts && document.fonts.load) {
      l.addEventListener('load', function () {
        document.fonts.load('64px "' + f + '"', sc.flat[0].ch).then(function () { fontGen++; if (state.script === sc.id) { drawTrace(); fitPicker(); } }).catch(function () { });
      });
    }
  }
  function applyScriptStyle() {
    var sc = cur(), app = $('#app');
    app.style.setProperty('--sf', sc.s.stack);
    app.style.setProperty('--sf-lh', String(sc.s.lh || 1.4));
    app.classList.toggle('is-arab', sc.id === 'arab');
    app.classList.toggle('is-latn', sc.latin);
    app.classList.toggle('is-wide', sc.id === 'taml' || sc.id === 'mlym');   /* கௌ കൈ: wide vowel-sign syllables */
    loadFont(sc);
  }
  /* letter content keeps its own language + direction, whatever the page language is */
  function scriptAttrs(node, sc) { node.setAttribute('lang', sc.lang); node.setAttribute('dir', sc.rtl ? 'rtl' : 'ltr'); return node; }

  /* ================================================================ speech */
  var voice = { id: null, code: null, ok: null };
  var speakToken = 0, warned = {};
  function voiceCodes(sc) {
    var codes = sc.s.voice.slice();
    if (sc.id === 'deva' && EDU.lang === 'mr') codes = ['mr', 'hi'];
    return codes;
  }
  function checkVoice() {
    var sc = cur(), codes = voiceCodes(sc);
    voice = { id: sc.id, code: codes[0], ok: null };
    renderVoice();
    EDU.getVoices().then(function (voices) {
      if (state.script !== sc.id) return;
      var found = null;
      for (var i = 0; i < codes.length && !found; i++) if (EDU.voiceFor(voices, codes[i])) found = codes[i];
      if (!('speechSynthesis' in window)) voice.ok = false;
      else if (found) { voice.code = found; voice.ok = true; }
      else voice.ok = codes[0] === 'en' && voices.length > 0;
      renderVoice();
      renderGameHint();
    });
  }
  function renderVoice() {
    var box = $('#voice-status'), name = t('ln_' + (voice.code || cur().lang));
    box.dataset.voice = voice.ok === null ? 'check' : voice.ok ? 'ok' : 'none';
    box.textContent = voice.ok === null ? t('voice_check') : voice.ok ? '🔊 ' + t('voice_ok', { lang: name }) : '🔇 ' + t('voice_none', { lang: name });
  }
  function say(text, then) {
    var my = ++speakToken, sc = cur();
    if (!text) return Promise.resolve(false);
    return EDU.speak(text, {
      lang: voice.code || sc.lang, rate: state.slow ? 0.55 : 0.85,
      onend: function () { if (then && my === speakToken) setTimeout(function () { if (my === speakToken) then(); }, 250); }
    }).then(function (ok) {
      if (!ok && !warned[sc.id]) { warned[sc.id] = 1; EDU.toast(t('voice_none', { lang: t('ln_' + (voice.code || sc.lang)) })); }
      return ok;
    });
  }
  function letterSay(it) { return it.say || it.ch; }
  function sayLetter(it, withWord) {
    return say(letterSay(it), withWord && it.word ? function () { say(it.word); } : null);
  }

  /* split a word into letter clusters (base + signs, conjuncts joined by a virama unless split) */
  function clusters(word, split) {
    var ch = Array.from(word), out = [], i = 0;
    while (i < ch.length) {
      var c = ch[i++];
      while (i < ch.length && MARK.test(ch[i])) {
        var m = ch[i++]; c += m;
        if (!split && VIRAMA.test(m) && i < ch.length && !MARK.test(ch[i]) && /\S/.test(ch[i])) c += ch[i++];
      }
      out.push(c);
    }
    return out;
  }
  /* example word with the letter marked (not for Urdu: Nastaliq joins must not be split) */
  function wordHTML(sc, it) {
    var w = it.word;
    if (sc.id === 'arab') return EDU.esc(w);
    if (sc.latin) {
      var k = w.toLowerCase().indexOf(it.ch.toLowerCase());
      return k < 0 ? EDU.esc(w) : EDU.esc(w.slice(0, k)) + '<mark>' + EDU.esc(w.charAt(k)) + '</mark>' + EDU.esc(w.slice(k + 1));
    }
    var cl = clusters(w, sc.id === 'taml'), targets = [it.ch];   /* Tamil pulli letters stand alone (no conjuncts) */
    if (it.ch.length > 1 && /^[अঅਅઅଅఅಅഅ]/.test(it.ch)) targets.push(it.ch.slice(1));
    if (CARRIES[it.ch]) targets = targets.concat(CARRIES[it.ch]);   /* Gurmukhi ੳ is written as ਉ ਊ ਓ inside words */
    if (VIRAMA.test(it.ch.slice(-1))) targets.push(it.ch.slice(0, -1));
    for (var a = 0; a < targets.length; a++) {
      for (var b = 0; b < cl.length; b++) {
        if (cl[b].indexOf(targets[a]) >= 0) {
          return cl.map(function (c, j) { return j === b ? '<mark>' + EDU.esc(c) + '</mark>' : EDU.esc(c); }).join('');
        }
      }
    }
    return EDU.esc(w);
  }

  /* ================================================================ picker + tabs */
  function renderPicker() {
    var bar = $('#script-bar');
    bar.innerHTML = '';
    D.order.forEach(function (id) {
      var sc = getScript(id);
      var g = el('span', { class: 'g', 'aria-hidden': 'true', text: sc.s.glyph, style: { fontFamily: sc.s.stack } });
      scriptAttrs(g, sc);
      bar.appendChild(el('button', {
        type: 'button', class: 'sc-btn', 'aria-pressed': id === state.script ? 'true' : 'false', dataset: { script: id },
        onclick: function () { setScript(id, true); }
      }, g, el('span', { class: 'n', text: scName(sc) })));
    });
    fitPicker();
    var sc = cur();
    var list = sc.s.uses.map(function (c) { return t('ln_' + c); }).join(EDU.lang === 'ur' ? '، ' : ', ');
    $('#uses').textContent = t('used_for', { list: list });
  }
  /* Phones show the picker as a 4-column grid. If a script name (e.g. தேவநாகரி) does not fit,
     use 3 wider columns; only if it still does not fit may a word break. */
  function fitPicker() {
    var bar = $('#script-bar');
    bar.classList.remove('c3', 'wrap-any');
    if (getComputedStyle(bar).display !== 'grid') return;
    var over = function () {
      return $$('.sc-btn .n', bar).some(function (n) {
        var r = document.createRange(); r.selectNodeContents(n);
        return r.getBoundingClientRect().width > n.clientWidth + 1;
      });
    };
    if (over()) { bar.classList.add('c3'); if (over()) bar.classList.add('wrap-any'); }
  }
  function setScript(id, byUser) {
    if (!D.scripts[id]) return;
    if (byUser) state.picked = true;
    var hadFocus = !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('#script-bar'));
    if (state.script !== id) { state.script = id; stopGame(); traceStrokes = []; lastEval = { cover: 0, out: 0 }; }
    save();
    applyScriptStyle();
    checkVoice();
    renderAll();
    if (hadFocus) { var nb = $('#script-bar [aria-pressed="true"]'); if (nb) nb.focus(); }
  }
  function setTab(tab) {
    if (TABS.indexOf(tab) < 0) tab = 'letters';
    if (tab === 'signs' && !cur().signs) tab = 'letters';
    state.tab = tab; save();
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    TABS.forEach(function (k) { $('#panel-' + k).hidden = k !== tab; });
    if (tab === 'trace') { sizeCanvas(); drawTrace(); }
  }
  function renderTabs() {
    var sc = cur();
    $('#tab-signs').hidden = !sc.signs;
    $('#tab-signs-lbl').textContent = t(sc.signs ? sc.signs.tab : 'tab_signs');
    setTab(state.tab);
  }

  /* ================================================================ letters */
  function renderLetters() {
    var sc = cur(), box = $('#groups'), selCh = sc.flat[selIndex(sc)].ch;
    box.innerHTML = '';
    sc.groups.forEach(function (g) {
      var count = 0; g.rows.forEach(function (r) { count += r.length; });
      var head = el('div', { class: 'grp-head' },
        el('h3', { text: t(g.label) }),
        g.native && g.native !== t(g.label) ? scriptAttrs(el('span', { class: 'grp-native sf', text: g.native }), sc) : null,
        el('span', { class: 'badge', text: t('n_letters', { n: EDU.fmt(count) }) }));
      var body;
      var cell = function (ch) {
        var it = sc.info[ch];
        var b = el('button', { type: 'button', class: 'lt', dataset: { ch: ch, group: g.id }, 'aria-current': ch === selCh ? 'true' : 'false',
          onclick: function () { pickLetter(ch, true); } },
          scriptAttrs(el('span', { class: 'ch', text: display(sc, ch) }), sc),
          el('span', { class: 'ro no-i18n', text: it.roman || ' ' }));
        return b;
      };
      if (g.rows.length === 1) {
        body = scriptAttrs(el('div', { class: 'lt-auto' }), sc);
        g.rows[0].forEach(function (ch) { body.appendChild(cell(ch)); });
      } else {
        body = scriptAttrs(el('div', { class: 'lt-rows' }), sc);
        g.rows.forEach(function (r) {
          var row = el('div', { class: 'lt-row', style: { '--n': String(Math.max(5, r.length)) } });
          r.forEach(function (ch) { row.appendChild(cell(ch)); });
          body.appendChild(row);
        });
      }
      box.appendChild(el('section', { class: 'grp', dataset: { group: g.id } }, head, body));
    });
  }
  function pickLetter(ch, speak) {
    var sc = cur();
    for (var i = 0; i < sc.flat.length; i++) if (sc.flat[i].ch === ch) { state.sel[sc.id] = i; break; }
    save();
    $$('#groups .lt').forEach(function (b) { b.setAttribute('aria-current', b.dataset.ch === ch ? 'true' : 'false'); });
    renderBig();
    if (speak) {
      sayLetter(sc.info[ch], true);
      var card = $('#big-card'), r = card.getBoundingClientRect();
      if (r.bottom < 60 || r.top > window.innerHeight - 80) { try { card.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { card.scrollIntoView(); } }
    }
  }
  function stepLetter(d) {
    var sc = cur(), i = (selIndex(sc) + d + sc.flat.length) % sc.flat.length;
    pickLetter(sc.flat[i].ch, true);
  }
  function urduForms(sc, ch) {
    if (sc.ao[ch]) return [ch, null, null, null];
    var fin = ZWJ + ch;
    if (sc.eo[ch]) return [ch, null, null, fin];
    if (sc.nj[ch]) return [ch, ch, fin, fin];
    return [ch, ch + ZWJ, ZWJ + ch + ZWJ, fin];
  }
  function renderBig() {
    var sc = cur(), idx = selIndex(sc), item = sc.flat[idx], it = sc.info[item.ch];
    $('#big-group').textContent = t(groupOf(sc, item.group).label);
    $('#big-pos').textContent = t('letter_of', { i: EDU.fmt(idx + 1), n: EDU.fmt(sc.flat.length) });
    var big = scriptAttrs($('#big-ch'), sc);
    big.textContent = sc.latin ? it.ch + ' ' + it.ch.toLowerCase() : it.ch;
    big.setAttribute('aria-label', t('hear') + ': ' + it.ch);
    var tj = $('#tam-join');
    if (sc.id === 'taml' && VIRAMA.test(it.ch.slice(-1))) { tj.hidden = false; tj.textContent = it.ch + ' + அ = ' + it.ch.slice(0, -1); }
    else tj.hidden = true;
    $('#big-roman-line').hidden = !it.roman;
    $('#big-roman').textContent = it.roman;
    var hasWord = !!it.word;
    $('#big-ex').hidden = !hasWord;
    $('#big-emoji').textContent = it.emoji;
    scriptAttrs($('#big-word'), sc).innerHTML = hasWord ? wordHTML(sc, it) : '';
    $('#big-wroman').textContent = it.wroman;
    var note = !hasWord ? t('rare') : it.flags.indexOf('m') >= 0 ? t('mid_word') : '';
    $('#big-note').textContent = note;
    $('#big-note').hidden = !note;
    $('#big-hear-word').disabled = !hasWord;
    var forms = $('#big-forms'), fnote = $('#forms-note');
    forms.innerHTML = '';
    if (sc.id === 'arab') {
      var f = urduForms(sc, it.ch), labels = ['f_alone', 'f_start', 'f_middle', 'f_end'];
      f.forEach(function (x, k) {
        forms.appendChild(el('div', { class: 'form-box' + (x ? '' : ' off'), dataset: { form: labels[k] } },
          scriptAttrs(el('span', { class: 'fx', text: x || '–' }), sc), el('span', { class: 'fl', text: t(labels[k]) })));
      });
      forms.hidden = false;
      fnote.hidden = !(sc.nj[it.ch] && !sc.ao[it.ch]);
      fnote.textContent = t('no_join');
    } else { forms.hidden = true; fnote.hidden = true; }
  }

  /* ================================================================ vowel signs */
  function baseIndex(sc) { var i = state.base[sc.id] | 0; return i >= 0 && i < sc.signs.bases.length ? i : 0; }
  function syllable(sg, base, j) { return base.ch + sg.marks[j]; }
  function renderSigns() {
    var sc = cur(), sg = sc.signs;
    if (!sg) return;
    var arab = sc.id === 'arab';
    $('#signs-h').textContent = t(arab ? 'aerab_h' : 'signs_h');
    $('#signs-help').textContent = t(arab ? 'aerab_help' : 'signs_help');
    var bi = baseIndex(sc), bar = scriptAttrs($('#base-bar'), sc);
    bar.innerHTML = '';
    sg.bases.forEach(function (b, i) {
      bar.appendChild(el('button', { type: 'button', text: b.ch, 'aria-pressed': i === bi ? 'true' : 'false', dataset: { base: b.ch },
        onclick: function (e) {
          var hadFocus = document.activeElement === e.currentTarget;
          state.base[sc.id] = i; save(); renderSigns(); say(b.ch + sg.marks[0]);
          if (hadFocus) { var nb = $('#base-bar [aria-pressed="true"]'); if (nb) nb.focus(); }   /* keyboard users keep their place */
        } }));
    });
    var base = sg.bases[bi], row = scriptAttrs($('#sign-row'), sc);
    row.innerHTML = '';
    sg.marks.forEach(function (m, j) {
      var syl = syllable(sg, base, j);
      row.appendChild(el('button', { type: 'button', class: 'sg', dataset: { syl: syl },
        onclick: function (e) {
          var btn = e.currentTarget;
          $$('#sign-row .sg').forEach(function (x) { x.classList.remove('playing'); });
          btn.classList.add('playing');
          say(syl);
        } },
        el('span', { class: 'v', text: sg.head[j] }),
        el('span', { class: 's', text: syl }),
        el('span', { class: 'ro lat no-i18n', text: base.root + sg.roman[j] })));
    });
    if ($('#chart-box').open) renderChart();
    var fb = $('#forms-box');
    fb.hidden = !arab;
    if (arab) renderFormsTable();
  }
  var chartFor = null;
  function renderChart() {
    var sc = cur(), sg = sc.signs, tbl = scriptAttrs($('#chart'), sc);
    if (!sg) return;
    if (chartFor === sc.id + EDU.lang) return;
    chartFor = sc.id + EDU.lang;
    tbl.innerHTML = '';
    var thead = el('thead'), hr = el('tr', {}, el('th', { text: '' }));
    sg.head.forEach(function (h) { hr.appendChild(el('th', { scope: 'col', text: h })); });
    thead.appendChild(hr);
    var tb = el('tbody');
    sg.bases.forEach(function (b) {
      var tr = el('tr', {}, el('td', { class: 'rh' }, el('button', { type: 'button', text: b.ch, dataset: { say: b.ch + sg.marks[0] } })));
      sg.marks.forEach(function (m, j) { tr.appendChild(el('td', {}, el('button', { type: 'button', text: syllable(sg, b, j), dataset: { say: syllable(sg, b, j) } }))); });
      tb.appendChild(tr);
    });
    tbl.appendChild(thead); tbl.appendChild(tb);
  }
  function renderFormsTable() {
    var sc = cur(), tbl = scriptAttrs($('#forms-table'), sc), labels = ['f_alone', 'f_start', 'f_middle', 'f_end'];
    tbl.innerHTML = '';
    var hr = el('tr', {}, el('th', { text: '' }));
    labels.forEach(function (k) { hr.appendChild(el('th', { scope: 'col', text: t(k) })); });
    var tb = el('tbody');
    sc.flat.forEach(function (x) {
      var f = urduForms(sc, x.ch), tr = el('tr', {}, el('td', { class: 'rh fx' }, el('button', { type: 'button', text: x.ch, dataset: { say: letterSay(sc.info[x.ch]) } })));
      f.forEach(function (v) { tr.appendChild(el('td', { class: 'fx', text: v || '–' })); });
      tb.appendChild(tr);
    });
    tbl.appendChild(el('thead', {}, hr)); tbl.appendChild(tb);
    tbl.setAttribute('aria-label', t('forms_h'));
  }

  /* ================================================================ tracing */
  var canvas = $('#trace-canvas'), ctx = canvas.getContext('2d');
  var traceStrokes = [], drawing = null, lastEval = { cover: 0, out: 0 };
  function traceIndex(sc) { var i = state.traceIdx[sc.id] | 0; return i >= 0 && i < sc.flat.length ? i : 0; }
  function traceText(sc) { var ch = sc.flat[traceIndex(sc)].ch; return sc.latin ? ch + ch.toLowerCase() : ch; }
  function sizeCanvas() {
    var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!r.width) return false;
    var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return true;
  }
  function penWidth(W) { return Math.max(8, W * 0.045); }
  /* The real ink box of a glyph, in em units from the text origin, found by drawing it once
     and scanning the pixels. measureText() is not enough: for many Indic and Urdu glyphs
     (and for offline fallback fonts such as Nirmala UI) Chrome reports a descent the glyph
     does not have, which pushed the letter up and made it ~25% too small. */
  var inkCache = {};
  function inkBox(text, stack) {
    var key = fontGen + '|' + stack + '|' + text;
    if (Object.prototype.hasOwnProperty.call(inkCache, key)) return inkCache[key];
    var R = 100, CW = 560, CH = 460, OX = 80, OY = 300, box = null;
    try {
      var cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
      var c = cv.getContext('2d', { willReadFrequently: true });
      c.direction = 'ltr'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.font = R + 'px ' + stack; c.fillStyle = '#000';
      c.fillText(text, OX, OY);
      var d = c.getImageData(0, 0, CW, CH).data, x0 = CW, x1 = -1, y0 = CH, y1 = -1, x, y, row;
      for (y = 0; y < CH; y++) {
        row = y * CW * 4;
        for (x = 0; x < CW; x++) if (d[row + x * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
      }
      if (x1 >= x0 && y1 >= y0) box = { l: (x0 - OX) / R, r: (x1 + 1 - OX) / R, t: (y0 - OY) / R, b: (y1 + 1 - OY) / R };
    } catch (e) { box = null; }
    inkCache[key] = box;
    return box;
  }
  /* place the glyph so that its real ink box fits ~78% of the canvas, centred */
  function fitGlyph(c, text, W, H, stack) {
    /* set direction + alignment before measuring: a canvas inherits dir="rtl" on Urdu pages */
    c.direction = 'ltr'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    var ink = inkBox(text, stack);
    if (ink && ink.r > ink.l && ink.b > ink.t) {
      var s = Math.min(W * 0.78 / (ink.r - ink.l), H * 0.74 / (ink.b - ink.t), H * 1.6);
      c.font = s + 'px ' + stack;
      return { size: s, x: W / 2 - (ink.l + ink.r) / 2 * s, y: H / 2 - (ink.t + ink.b) / 2 * s };
    }
    var size = H * 0.6;
    c.font = size + 'px ' + stack;
    var m = c.measureText(text);
    var gw = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || m.width);
    var gh = (m.actualBoundingBoxAscent || size * 0.75) + (m.actualBoundingBoxDescent || size * 0.25);
    if (!gw || !gh) { gw = m.width || size; gh = size; }
    var k = Math.min(W * 0.78 / gw, H * 0.74 / gh);
    size = size * k;
    c.font = size + 'px ' + stack;
    m = c.measureText(text);
    var left = m.actualBoundingBoxLeft || 0, right = m.actualBoundingBoxRight || m.width;
    var asc = m.actualBoundingBoxAscent || size * 0.75, desc = m.actualBoundingBoxDescent || size * 0.25;
    return { size: size, x: W / 2 - (right - left) / 2, y: H / 2 + (asc - desc) / 2 };
  }
  function glyphPath(c, text, W, H, stack, mode, lw) {
    var g = fitGlyph(c, text, W, H, stack);
    if (mode === 'fill' || mode === 'both') c.fillText(text, g.x, g.y);
    if (mode === 'stroke' || mode === 'both') { c.lineWidth = lw; c.lineJoin = 'round'; c.strokeText(text, g.x, g.y); }
  }
  function strokePaths(c, W, H, lw) {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = lw;
    traceStrokes.forEach(function (s) {
      c.beginPath();
      s.forEach(function (p, i) { if (i) c.lineTo(p[0] * W, p[1] * H); else c.moveTo(p[0] * W, p[1] * H); });
      if (s.length === 1) c.lineTo(s[0][0] * W + 0.1, s[0][1] * H);
      c.stroke();
    });
  }
  /* The page background, guide lines and faint letter are drawn once into an offscreen layer
     (redrawn only when the letter, size, theme or fonts change); each pointer move just copies it. */
  var bgLayer = document.createElement('canvas'), bgKey = '', fontGen = 0;
  function drawBackground(sc, text, W, H) {
    var guide = $('#trace-guide').checked, dark = EDU.theme() === 'dark';
    var key = [sc.id, text, W, H, guide, dark, fontGen].join('|');
    if (key === bgKey) return bgLayer;
    bgKey = key;
    bgLayer.width = W; bgLayer.height = H;
    var g = bgLayer.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = EDU.css('--surface') || '#fff';
    g.fillRect(0, 0, W, H);
    /* handwriting guide lines */
    g.strokeStyle = EDU.css('--border') || '#ddd'; g.lineWidth = Math.max(1, W / 400);
    g.setLineDash([W / 60, W / 60]);
    g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();
    g.setLineDash([]);
    if (guide) {
      /* dashed outline: stroke the glyph, then cut its inside away, so the overlapping
         contours inside a letter (seams of the font) never show */
      var o = document.createElement('canvas'); o.width = W; o.height = H;
      var oc = o.getContext('2d');
      oc.strokeStyle = EDU.css('--muted') || '#777';
      oc.setLineDash([W / 90, W / 120]);
      glyphPath(oc, text, W, H, sc.s.stack, 'stroke', Math.max(3, W / 160));
      oc.setLineDash([]);
      oc.globalCompositeOperation = 'destination-out';
      oc.fillStyle = '#000';
      glyphPath(oc, text, W, H, sc.s.stack, 'fill');
      g.globalAlpha = dark ? 0.4 : 0.22;
      g.fillStyle = EDU.css('--primary') || '#0b4f5c';
      glyphPath(g, text, W, H, sc.s.stack, 'fill');
      g.globalAlpha = dark ? 0.8 : 0.55;
      g.drawImage(o, 0, 0);
      g.globalAlpha = 1;
    }
    return bgLayer;
  }
  function drawTrace() {
    if (state.tab !== 'trace' || !sizeCanvas()) { renderTraceInfo(); return; }
    var sc = cur(), W = canvas.width, H = canvas.height, text = traceText(sc);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(drawBackground(sc, text, W, H), 0, 0);
    ctx.strokeStyle = EDU.css('--accent') || '#d9501c';
    strokePaths(ctx, W, H, penWidth(W));
    renderTraceInfo();
  }
  /* how much of the letter is covered, and how much ink fell outside it (small offscreen canvases) */
  var E = 180, evA = document.createElement('canvas'), evB = document.createElement('canvas');
  evA.width = evA.height = evB.width = evB.height = E;
  function evaluateTrace() {
    if (!traceStrokes.length) { lastEval = { cover: 0, out: 0 }; return lastEval; }
    var sc = cur(), text = traceText(sc), W = canvas.width || 400, H = canvas.height || 400;
    var sx = E / W, a = evA.getContext('2d'), b = evB.getContext('2d');
    var pen = penWidth(W) * sx;
    /* A = the letter, B = the child's strokes drawn twice as thick: coverage = A pixels inside B */
    a.setTransform(1, 0, 0, 1, 0, 0); a.clearRect(0, 0, E, E); a.fillStyle = '#000'; a.strokeStyle = '#000';
    glyphPath(a, text, E, E * H / W, sc.s.stack, 'fill');
    b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, E, E); b.strokeStyle = '#000';
    strokePaths(b, E, E * H / W, pen * 2.2);
    var A = a.getImageData(0, 0, E, E).data, B = b.getImageData(0, 0, E, E).data;
    var inLetter = 0, covered = 0, i;
    for (i = 3; i < A.length; i += 4) if (A[i] > 100) { inLetter++; if (B[i] > 60) covered++; }
    /* outside: strokes at real width vs the letter grown by a pen width */
    a.clearRect(0, 0, E, E);
    glyphPath(a, text, E, E * H / W, sc.s.stack, 'both', pen * 2.4);
    b.clearRect(0, 0, E, E);
    strokePaths(b, E, E * H / W, pen);
    A = a.getImageData(0, 0, E, E).data; B = b.getImageData(0, 0, E, E).data;
    var ink = 0, outside = 0;
    for (i = 3; i < B.length; i += 4) if (B[i] > 100) { ink++; if (A[i] < 60) outside++; }
    lastEval = { cover: inLetter ? covered / inLetter : 0, out: ink ? outside / ink : 0 };
    return lastEval;
  }
  function renderTraceInfo() {
    var sc = cur(), idx = traceIndex(sc), ch = sc.flat[idx].ch;
    scriptAttrs($('#trace-ch'), sc).textContent = display(sc, ch);
    $('#trace-pos').textContent = t('letter_of', { i: EDU.fmt(idx + 1), n: EDU.fmt(sc.flat.length) });
    var p = Math.round(lastEval.cover * 100);
    $('#cover-txt').textContent = t('cover', { p: EDU.fmt(p) });
    $('#cover-bar').style.width = p + '%';
    var stage = $('#trace-stage');
    stage.dataset.cover = String(p); stage.dataset.strokes = String(traceStrokes.length); stage.dataset.letter = ch;
    var msg, stars = 0;
    if (!traceStrokes.length) msg = t('trace_start');
    else if (lastEval.cover >= 0.7 && lastEval.out <= 0.3) { msg = t('trace_great'); stars = 3; }
    else if (lastEval.cover >= 0.4) { msg = t('trace_good'); stars = 2; }
    else { msg = t('trace_more'); stars = lastEval.cover >= 0.15 ? 1 : 0; }
    if (traceStrokes.length && lastEval.out > 0.45) msg = t('trace_neat');
    $('#trace-msg').textContent = msg;
    $('#trace-stars').textContent = Array(stars + 1).join('⭐');
  }
  function setTraceIndex(i) {
    var sc = cur(), n = sc.flat.length;
    state.traceIdx[sc.id] = ((i % n) + n) % n; save();
    traceStrokes = []; lastEval = { cover: 0, out: 0 };
    drawTrace();
  }
  function pointFrom(e) {
    var r = canvas.getBoundingClientRect();
    return [EDU.clamp((e.clientX - r.left) / r.width, 0, 1), EDU.clamp((e.clientY - r.top) / r.height, 0, 1)];
  }
  canvas.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (x) { }
    drawing = [pointFrom(e)];
    traceStrokes.push(drawing);
    drawTrace();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drawing) return;
    var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (!evs.length) evs = [e];
    evs.forEach(function (ev) { drawing.push(pointFrom(ev)); });
    drawTrace();
  });
  function endStroke() {
    if (!drawing) return;
    drawing = null;
    evaluateTrace();
    drawTrace();
  }
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('lostpointercapture', endStroke);

  /* printable tracing worksheet for the group of the current trace letter */
  function buildSheet() {
    var sc = cur(), gid = sc.flat[traceIndex(sc)].group, g = groupOf(sc, gid), sheet = $('#print-sheet');
    sheet.innerHTML = '';
    sheet.appendChild(el('h2', { text: t('sheet_title', { script: scName(sc) }) + ' · ' + t(g.label) }));
    sheet.appendChild(el('div', { class: 'sheet-meta' }, el('span', { text: t('name_lbl') + ': ____________________' }), el('span', { text: t('date_lbl') + ': ____________' })));
    var grid = scriptAttrs(el('div', { class: 'sheet-grid' }), sc);
    grid.style.fontFamily = sc.s.stack;
    g.rows.forEach(function (r) {
      r.forEach(function (ch) {
        var txt = display(sc, ch);
        grid.appendChild(el('div', { class: 'sheet-cell model', text: txt }));
        grid.appendChild(el('div', { class: 'sheet-cell hollow', text: txt }));
        grid.appendChild(el('div', { class: 'sheet-cell faint', text: txt }));
        grid.appendChild(el('div', { class: 'sheet-cell' }));
      });
    });
    sheet.appendChild(grid);
  }

  /* ================================================================ listen & tap game */
  var game = null;
  function poolLetters(sc) {
    var ids = state.pool === 'all' ? null : state.pool, out = [];
    sc.groups.forEach(function (g) {
      if (g.id === 'extra') return;
      if (ids && g.id !== ids) return;
      g.rows.forEach(function (r) { r.forEach(function (ch) { if (out.indexOf(ch) < 0) out.push(ch); }); });
    });
    return out;
  }
  function renderGameControls() {
    var sc = cur(), seg = $('#pool-seg');
    var pools = ['all'].concat(sc.groups.filter(function (g) { return g.id !== 'extra'; }).map(function (g) { return g.id; }));
    if (pools.indexOf(state.pool) < 0) state.pool = 'all';
    seg.innerHTML = '';
    if (pools.length > 2) {
      pools.forEach(function (p) {
        seg.appendChild(el('button', { type: 'button', dataset: { pool: p }, 'aria-pressed': p === state.pool ? 'true' : 'false',
          text: p === 'all' ? t('pool_all') : t(groupOf(sc, p).label),
          onclick: function () { state.pool = p; save(); stopGame(); renderGameControls(); } }));
      });
    }
    seg.hidden = pools.length <= 2;
    var nseg = $('#n-seg');
    nseg.innerHTML = '';
    [3, 4, 6].forEach(function (n) {
      nseg.appendChild(el('button', { type: 'button', dataset: { n: String(n) }, 'aria-pressed': n === state.nopt ? 'true' : 'false',
        'aria-label': t('choices') + ': ' + n, text: EDU.fmt(n),
        onclick: function () { state.nopt = n; save(); stopGame(); renderGameControls(); } }));
    });
    $('#hint-chk').checked = state.hint;
    var b = bestOf(sc);
    $('#game-best').textContent = b !== null ? '🏆 ' + t('best', { b: EDU.fmt(b), n: EDU.fmt(ROUNDS) }) : '';
    $('#game-start-lbl').textContent = t(game && game.done ? 'play_again' : 'game_start');
    if (game && !game.done) renderRound();
    if (game && game.done) renderEnd();
  }
  function bestOf(sc) {
    var b = state.best[sc.id];
    return typeof b === 'number' && b >= 0 && b <= ROUNDS ? Math.round(b) : null;
  }
  function stopGame() {
    game = null;
    $('#game-play').hidden = true;
    $('#game-end').hidden = true;
    $('#game-start').hidden = false;
    $('#game-start-lbl').textContent = t('game_start');
  }
  function startGame() {
    var sc = cur(), pool = poolLetters(sc), seq = [];
    while (seq.length < ROUNDS) seq = seq.concat(EDU.shuffle(pool));
    seq = seq.slice(0, ROUNDS);
    for (var i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1] && pool.length > 1) { var j = (i + 1) % seq.length; var x = seq[i]; seq[i] = seq[j]; seq[j] = x; }
    game = { script: sc.id, pool: pool, seq: seq, round: 0, score: 0, answered: false, done: false, opts: [] };
    $('#game-end').hidden = true;
    $('#game-play').hidden = false;
    $('#game-start').hidden = true;
    nextRound(true);
  }
  function nextRound(first) {
    if (!game) return;
    if (!first) game.round++;
    if (game.round >= ROUNDS) return endGame();
    var sc = cur(), target = game.seq[game.round], n = Math.min(state.nopt, game.pool.length);
    /* never offer a letter that sounds the same as the answer (Bengali জ / য), or two answers would be right */
    var others = EDU.shuffle(game.pool.filter(function (c) { return !soundsSame(sc, c, target); })).slice(0, n - 1);
    game.opts = EDU.shuffle(others.concat([target]));
    game.answered = false;
    renderRound();
    say(letterSay(sc.info[target]));
  }
  function soundsSame(sc, a, b) {
    if (a === b) return true;
    var ra = sc.info[a].roman, rb = sc.info[b].roman;
    return !!(ra && ra === rb) || !!(sc.same[a] && sc.same[a] === sc.same[b]);
  }
  function hintOn() { return state.hint || voice.ok === false; }
  function renderGameHint() {
    if (!game || game.done) return;
    var sc = cur(), it = sc.info[game.seq[game.round]], on = hintOn();
    $('#game-hint').textContent = on ? (it.roman || it.word) : '';
    $('#game-ask').textContent = on && voice.ok === false ? t('find_this') : t('which_letter');
  }
  function renderRound() {
    var sc = cur(), target = game.seq[game.round];
    var q = $('#game-q');
    q.dataset.round = String(game.round + 1); q.dataset.answer = target;
    $('#game-round').textContent = t('round_of', { i: EDU.fmt(game.round + 1), n: EDU.fmt(ROUNDS) });
    $('#game-score').textContent = t('score_n', { s: EDU.fmt(game.score) });
    $('#game-prog').style.width = (game.round / ROUNDS * 100) + '%';
    renderGameHint();
    var grid = scriptAttrs($('#game-opts'), sc);
    grid.style.setProperty('--n', String(game.opts.length === 6 ? 3 : game.opts.length));
    grid.innerHTML = '';
    game.opts.forEach(function (ch) {
      grid.appendChild(el('button', { type: 'button', class: 'gopt', dataset: { ch: ch }, text: display(sc, ch), disabled: game.answered,
        onclick: function (e) { answer(ch, e.currentTarget); } }));
    });
    $('#game-fb').textContent = '';
  }
  function answer(ch, btn) {
    if (!game || game.answered) return;
    game.answered = true;
    var target = game.seq[game.round], ok = ch === target;
    if (ok) game.score++;
    $$('#game-opts .gopt').forEach(function (b) {
      b.disabled = true;
      if (b.dataset.ch === target) b.classList.add('ok');
    });
    if (!ok) btn.classList.add('no');
    $('#game-score').textContent = t('score_n', { s: EDU.fmt(game.score) });
    $('#game-fb').textContent = ok ? '✅ ' + t('correct') : '❌ ' + t('right_was', { l: display(cur(), target) });
    $('#game-fb').className = 'game-fb ' + (ok ? 'ok' : 'bad');
    var g = game;
    setTimeout(function () { if (game === g) nextRound(false); }, ok ? 900 : 1700);
  }
  function endGame() {
    var sc = cur();
    game.done = true;
    $('#game-play').hidden = true;
    $('#game-end').hidden = false;
    $('#game-start').hidden = false;
    var s = game.score, b = bestOf(sc);
    if (b === null || s > b) { state.best[sc.id] = s; save(); }
    renderGameControls();   /* also draws the end card (renderEnd) */
  }
  /* end card text: called again on a language change so it never stays in the old language */
  function renderEnd() {
    var s = game.score;
    $('#end-score').textContent = EDU.fmt(s) + ' / ' + EDU.fmt(ROUNDS);
    $('#end-stars').textContent = Array((s >= 9 ? 3 : s >= 6 ? 2 : 1) + 1).join('⭐');
    $('#end-msg').textContent = t('game_over', { s: EDU.fmt(s), n: EDU.fmt(ROUNDS) }) + ' ' + t(s >= 9 ? 'cheer_hi' : s >= 6 ? 'cheer_mid' : 'cheer_lo');
    $('#game-end').dataset.score = String(s);
  }

  /* ================================================================ print */
  function printTitle(mode) {
    var sc = cur();
    $('#print-title').textContent = t('app_title') + ' · ' + scName(sc) + ' · ' + t(mode === 'chart' ? (sc.signs ? sc.signs.tab : 'tab_letters') : 'tab_letters');
  }
  function doPrint(mode) {
    document.body.dataset.print = mode;
    if (mode === 'chart') { $('#chart-box').open = true; renderChart(); }
    if (mode === 'sheet') buildSheet();
    printTitle(mode);
    window.print();
  }
  window.addEventListener('beforeprint', function () {
    if (document.body.dataset.print) return;
    var mode = state.tab === 'signs' ? 'chart' : state.tab === 'trace' ? 'sheet' : 'letters';
    if (mode === 'chart') { $('#chart-box').open = true; renderChart(); }
    if (mode === 'sheet') buildSheet();
    document.body.dataset.print = mode;
    printTitle(mode);
  });
  window.addEventListener('afterprint', function () { delete document.body.dataset.print; });

  /* ================================================================ wiring */
  function renderAll() {
    renderPicker();
    renderTabs();
    renderLetters();
    renderBig();
    renderSigns();
    renderGameControls();
    $('#slow').checked = state.slow;
    drawTrace();
  }
  $$('#tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var vis = $$('#tabs [role="tab"]').filter(function (x) { return !x.hidden; }), i = vis.indexOf(b);
      var fwd = (e.key === 'ArrowRight') !== (document.documentElement.dir === 'rtl');
      var nb = vis[(i + (fwd ? 1 : -1) + vis.length) % vis.length];
      setTab(nb.dataset.tab); nb.focus(); e.preventDefault();
    });
  });
  $('#big-hear').addEventListener('click', function () { var sc = cur(); sayLetter(sc.info[sc.flat[selIndex(sc)].ch], false); });
  $('#big-ch').addEventListener('click', function () { var sc = cur(); sayLetter(sc.info[sc.flat[selIndex(sc)].ch], true); });
  $('#big-ch').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#big-ch').click(); } });
  $('#big-hear-word').addEventListener('click', function () { var sc = cur(); say(sc.info[sc.flat[selIndex(sc)].ch].word); });
  $('#big-prev').addEventListener('click', function () { stepLetter(-1); });
  $('#big-next').addEventListener('click', function () { stepLetter(1); });
  $('#big-fs').addEventListener('click', function () { EDU.fullscreen($('#big-card')); });
  $('#big-trace').addEventListener('click', function () {
    if (document.fullscreenElement || document.webkitFullscreenElement) EDU.fullscreen();
    var sc = cur(); state.traceIdx[sc.id] = selIndex(sc); traceStrokes = []; lastEval = { cover: 0, out: 0 }; save();
    setTab('trace');
    try { $('#tabs').scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { }
  });
  document.addEventListener('keydown', function (e) {
    if (state.tab !== 'letters' || e.altKey || e.ctrlKey || e.metaKey) return;
    var tg = e.target && e.target.tagName;
    if (tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA' || (e.target.getAttribute && e.target.getAttribute('role') === 'tab')) return;
    var rtl = cur().rtl;
    if (e.key === 'ArrowRight') { stepLetter(rtl ? -1 : 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { stepLetter(rtl ? 1 : -1); e.preventDefault(); }
  });
  $('#chart-box').addEventListener('toggle', function () { if ($('#chart-box').open) renderChart(); });
  $('#chart').addEventListener('click', function (e) { var b = e.target.closest('button[data-say]'); if (b) say(b.dataset.say); });
  $('#forms-table').addEventListener('click', function (e) { var b = e.target.closest('button[data-say]'); if (b) say(b.dataset.say); });
  $('#chart-print').addEventListener('click', function () { doPrint('chart'); });
  $('#trace-prev').addEventListener('click', function () { setTraceIndex(traceIndex(cur()) - 1); });
  $('#trace-next').addEventListener('click', function () { setTraceIndex(traceIndex(cur()) + 1); });
  $('#trace-clear').addEventListener('click', function () { traceStrokes = []; lastEval = { cover: 0, out: 0 }; drawTrace(); });
  $('#trace-guide').addEventListener('change', drawTrace);
  $('#trace-hear').addEventListener('click', function () { var sc = cur(); sayLetter(sc.info[sc.flat[traceIndex(sc)].ch], false); });
  /* full screen takes the canvas AND its buttons, so a child at the smartboard can Clear / Next */
  $('#trace-fs').addEventListener('click', function () { EDU.fullscreen($('#trace-wrap')); });
  $('#sheet-print').addEventListener('click', function () { doPrint('sheet'); });
  $('#game-start').addEventListener('click', startGame);
  $('#game-hear').addEventListener('click', function () { if (game && !game.done) say(letterSay(cur().info[game.seq[game.round]])); });
  $('#hint-chk').addEventListener('change', function () { state.hint = $('#hint-chk').checked; save(); renderGameHint(); });
  $('#slow').addEventListener('change', function () { state.slow = $('#slow').checked; save(); });
  $('#print-btn').addEventListener('click', function () {
    doPrint(state.tab === 'signs' ? 'chart' : state.tab === 'trace' ? 'sheet' : 'letters');
  });
  $('#reset-btn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['script', 'tab', 'sel', 'base', 'traceIdx', 'best', 'slow', 'hint', 'pool', 'nopt'].forEach(function (k) { store.remove(k); });
    state.script = LANG_SCRIPT[EDU.lang] || 'deva'; state.picked = false; state.tab = 'letters';
    state.sel = {}; state.base = {}; state.traceIdx = {}; state.best = {}; state.slow = false; state.hint = false; state.pool = 'all'; state.nopt = 4;
    traceStrokes = []; lastEval = { cover: 0, out: 0 }; stopGame(); chartFor = null; $('#chart-box').open = false;
    applyScriptStyle(); checkVoice(); renderAll();
  });
  document.addEventListener('fullscreenchange', function () { setTimeout(drawTrace, 60); });
  var rz = null;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { drawTrace(); fitPicker(); }, 120); });
  EDU.onTheme(function () { drawTrace(); });
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { fontGen++; drawTrace(); fitPicker(); });
  EDU.onLang(function (lang) {
    chartFor = null;
    if (!state.picked && LANG_SCRIPT[lang] && LANG_SCRIPT[lang] !== state.script) { state.script = LANG_SCRIPT[lang]; stopGame(); traceStrokes = []; lastEval = { cover: 0, out: 0 }; }
    applyScriptStyle();
    checkVoice();
    renderAll();
    if (!game || game.done) $('#game-start-lbl').textContent = t(game && game.done ? 'play_again' : 'game_start');
  });

  applyScriptStyle();
  checkVoice();
  stopGame();
  renderAll();
})();
