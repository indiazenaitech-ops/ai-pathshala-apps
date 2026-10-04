/* Kruti Dev <-> Unicode converter: UI. The conversion engine lives in convert.js (window.KRUTI).
   Everything runs on this device; nothing is uploaded. */
(function () {
  'use strict';
  var SLUG = 'krutidev-unicode';
  var K = window.KRUTI, M = K.MARK;
  var t = EDU.t, el = EDU.el, $ = EDU.$;
  var store = EDU.store(SLUG);

  var SAMPLE_K = "Hkkjr ljdkj\nxzkeh.k fodkl ea=ky;\n\nfo\"k;% izkFkZuk i= dh izkfIr ds lEcU/k esaA\n\negksn;]\n\nmi;qZDr fo\"k; ds lEcU/k esa vkidk i= fnukad 12@09@2026 izkIr gqvkA d`i;k vko';d dk;Zokgh 15 fnu ds Hkhrj iw.kZ djsaA\n\nHkonh;]\njkts'k oekZ\nmi lfpo";
  var SAMPLE_U = "भारत सरकार\nशिक्षा मंत्रालय\n\nविषय: प्रशिक्षण कार्यक्रम की सूचना।\n\nसभी कर्मचारियों को सूचित किया जाता है कि दिनांक 15/10/2026 को प्रातः 10 बजे हिन्दी कार्यशाला आयोजित की जाएगी। कृपया समय पर उपस्थित हों।\n\nआदेश से,\nसुनीता श्रीवास्तव\nनिदेशक (प्रशासन)";
  var BIG = 250000;          // above this many characters: convert in steps and skip the red marks
  var LINES_MAX = 400;
  var MAX_FILE = 30 * 1024 * 1024;

  var DEF = { dir: 'k2u', keep: false, sanskrit: false, font: true, keepWords: '', view: 'text', text: null };
  var S = Object.assign({}, DEF, store.get('state', {}));
  if (S.dir !== 'u2k') S.dir = 'k2u';
  if (S.view !== 'lines') S.view = 'text';

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool', wide: true });

  var input = $('#input'), output = $('#output'), linesView = $('#linesView');
  var last = { text: '', marked: '', unknown: {}, approx: {}, src: '' };
  var gen = 0, busy = false, timer = null, saveTimer = null;

  /* ---------- Kruti Dev font on this device? (it is commercial, so it is never shipped) */
  var KFONT = (function () {
    var names = ['Kruti Dev 010', 'KrutiDev010', 'Kruti Dev 011', 'DevLys 010'];
    try {
      var c = document.createElement('canvas').getContext('2d'), probe = 'dkWQh;kZ Hkkjr mmwwlli 0123';
      for (var i = 0; i < names.length; i++) {
        var differs = ['monospace', 'serif'].some(function (base) {
          c.font = '40px ' + base; var a = c.measureText(probe).width;
          c.font = '40px "' + names[i] + '", ' + base; return Math.abs(c.measureText(probe).width - a) > 0.5;
        });
        if (differs) return names[i];
      }
    } catch (e) { }
    return '';
  })();

  /* ---------- helpers */
  function k2u() { return S.dir === 'k2u'; }
  function opts() { return { keepEnglish: S.keep, sanskrit: S.sanskrit, keepWords: S.keepWords }; }
  function countWords(s) { var m = s.match(/[^\s।॥.,;:!?()"'‘’“”\-]+/g); return m ? m.length : 0; }
  function statsText(s) {
    if (!s) return '';
    return t('stats', { chars: EDU.fmt(s.length), words: EDU.fmt(countWords(s)), lines: EDU.fmt(s.split('\n').length) });
  }
  function boxClass(isKruti) { return 'kd-box ' + (isKruti ? (S.font && KFONT ? 'kd-kfont' : 'kd-mono') : 'kd-uni'); }
  function hex(ch) { var cp = ch.codePointAt(0).toString(16).toUpperCase(); while (cp.length < 4) cp = '0' + cp; return 'U+' + cp; }
  function sum(o) { var n = 0; for (var k in o) n += o[k]; return n; }
  function merge(a, b) { for (var k in b) a[k] = (a[k] || 0) + b[k]; }

  function saveNow() {
    clearTimeout(saveTimer); saveTimer = null;
    var v = input.value;
    store.set('state', { dir: S.dir, keep: S.keep, sanskrit: S.sanskrit, font: S.font, keepWords: S.keepWords, view: S.view, text: v.length <= 150000 ? v : '' });
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 400);
  }
  // closing or reloading the tab right after typing must not lose the last words
  window.addEventListener('pagehide', function () { if (saveTimer) saveNow(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && saveTimer) saveNow(); });

  /* ---------- conversion */
  function sig() { return S.dir + '|' + S.keep + '|' + S.sanskrit + '|' + S.keepWords; }
  function convert() {
    clearTimeout(timer); timer = null;
    var src = input.value, my = ++gen, fn = k2u() ? K.toUnicode : K.toKruti, o = opts(), sg = sig();
    if (src.length <= BIG) { busy = false; last = fn(src, o); last.src = src; last.sig = sg; render(); return; }
    busy = true;
    var lines = src.split('\n'), i = 0, marked = [], unknown = {}, approx = {};
    setStatus('busy', t('status_working', { p: 0 }));
    (function step() {
      if (my !== gen) return;
      var start = i, size = 0;
      while (i < lines.length && size < 60000) { size += lines[i].length + 1; i++; }
      var r = fn(lines.slice(start, i).join('\n'), o);
      marked.push(r.marked); merge(unknown, r.unknown); merge(approx, r.approx);
      if (i < lines.length) { setStatus('busy', t('status_working', { p: Math.round(i / lines.length * 100) })); setTimeout(step, 0); return; }
      var m = marked.join('\n');
      busy = false;
      last = { marked: m, text: m.replace(/[-]/g, ''), unknown: unknown, approx: approx, src: src, sig: sg };
      render();
    })();
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(convert, input.value.length > 30000 ? 450 : 90);
    save();
  }
  /* Copy, download, print and swap must use the result of the text that is in the box NOW: the user may press
     them within the typing debounce, or while a long document is still being converted step by step. */
  function fresh() {
    if (!busy && !timer && last.src === input.value && last.sig === sig()) return;
    clearTimeout(timer); timer = null; gen++; busy = false;
    var src = input.value;
    last = (k2u() ? K.toUnicode : K.toKruti)(src, opts()); last.src = src; last.sig = sig();
    render();
  }

  /* ---------- rendering */
  function setStatus(kind, text) {
    var st = $('#status');
    st.className = 'kd-status' + (kind === 'ok' ? '' : ' ' + kind);
    st.querySelector('.ic').textContent = kind === 'ok' ? '✓' : kind === 'busy' ? '…' : '!';
    $('#statusText').textContent = text;
    st.hidden = kind === 'ok' && !last.src;       // nothing typed yet: no "all converted" tick
  }

  function fillMarked(target, marked) {
    target.textContent = '';
    var frag = document.createDocumentFragment(), re = /([\s\S]*?)|([\s\S]*?)|([\s\S]*?)/g, pos = 0, m;
    while ((m = re.exec(marked))) {
      if (m.index > pos) frag.appendChild(document.createTextNode(marked.slice(pos, m.index).replace(/[-]/g, '')));
      if (m[1] !== undefined) { var mk = el('mark', { class: 'unk', text: m[1] }); mk.dataset.c = m[1]; frag.appendChild(mk); }
      else if (m[2] !== undefined) frag.appendChild(el('span', { class: 'kept', text: m[2] }));
      else { var ap = el('mark', { class: 'apx', text: m[3] }); frag.appendChild(ap); }
      pos = re.lastIndex;
    }
    if (pos < marked.length) frag.appendChild(document.createTextNode(marked.slice(pos).replace(/[-]/g, '')));
    target.appendChild(frag);
  }

  function renderLines() {
    var inL = last.src.split('\n'), outL = last.text.split('\n'), n = Math.min(inL.length, LINES_MAX);
    var tb = el('tbody');
    for (var i = 0; i < n; i++) {
      tb.appendChild(el('tr', {},
        el('td', { text: String(i + 1) }),
        el('td', { class: 'no-i18n ' + (k2u() ? (S.font && KFONT ? 'kd-kfont' : 'kd-mono') : 'kd-uni'), dir: 'ltr', text: inL[i] }),
        el('td', { class: 'no-i18n ' + (k2u() ? 'kd-uni' : (S.font && KFONT ? 'kd-kfont' : 'kd-mono')), dir: 'ltr', text: outL[i] || '' })));
    }
    var table = el('table', { class: 'table' },
      el('thead', {}, el('tr', {}, el('th', { text: t('lines_line') }), el('th', { text: t('lines_in') }), el('th', { text: t('lines_out') }))), tb);
    linesView.textContent = '';
    linesView.appendChild(table);
    if (inL.length > LINES_MAX) linesView.appendChild(el('p', { class: 'small muted', style: { padding: '8px 12px', margin: 0 }, text: t('lines_more', { n: EDU.fmt(LINES_MAX) }) }));
  }

  function chip(ch, n, cls, onClick) {
    var b = el('button', { type: 'button', class: 'kd-chip ' + (cls || ''), title: t('jump_title') },
      el('b', { class: 'no-i18n', dir: 'ltr', text: /\s/.test(ch) ? '␣' : ch }), el('code', { text: hex(ch) }), el('span', { text: t('times', { n: EDU.fmt(n) }) }));
    b.addEventListener('click', onClick);
    return b;
  }

  function jumpTo(ch) {
    if (S.view !== 'text') setView('text');
    var marks = EDU.$$('mark.unk', output), hit = null;
    for (var i = 0; i < marks.length; i++) if (marks[i].dataset.c === ch) { hit = marks[i]; break; }
    if (!hit) return;
    output.scrollTop = Math.max(0, hit.offsetTop - output.clientHeight / 2);
    hit.classList.remove('flash'); void hit.offsetWidth; hit.classList.add('flash');
  }

  function render() {
    var isK = k2u(), outText = last.text, big = last.marked.length > BIG;
    output.className = boxClass(!isK) + ' kd-out no-i18n';
    input.className = boxClass(isK) + ' no-i18n';
    $('#inStats').textContent = statsText(input.value);
    $('#outStats').textContent = statsText(outText);
    $('#outEmpty').hidden = !!outText;
    $('#bigNote').hidden = !big;
    if (S.view === 'text') {
      if (big) output.textContent = outText; else fillMarked(output, last.marked);
    } else renderLines();
    output.hidden = S.view !== 'text';
    linesView.hidden = S.view !== 'lines';

    var nU = sum(last.unknown), keys = Object.keys(last.unknown).sort(function (a, b) { return last.unknown[b] - last.unknown[a]; });
    if (busy) return;
    if (nU) setStatus('warn', t('status_unknown', { n: EDU.fmt(nU) }));
    else setStatus('ok', t('status_ok'));
    $('#unkBox').hidden = !nU;
    var chips = $('#unkChips'); chips.textContent = '';
    keys.slice(0, 40).forEach(function (ch) { chips.appendChild(chip(ch, last.unknown[ch], '', function () { jumpTo(ch); })); });
    $('#unkHint').textContent = t(isK ? 'hint_k2u' : 'hint_u2k');
    var ak = Object.keys(last.approx || {});
    $('#apxBox').hidden = !ak.length;
    var ac = $('#apxChips'); ac.textContent = '';
    ak.forEach(function (ch) { ac.appendChild(chip(ch, last.approx[ch], 'apx', function () { })); });
  }

  /* ---------- direction / options UI */
  function applyDirUI() {
    var isK = k2u();
    $('#dirK2U').setAttribute('aria-pressed', String(isK));
    $('#dirU2K').setAttribute('aria-pressed', String(!isK));
    $('#inTitle').textContent = t(isK ? 'in_k' : 'in_u');
    $('#outTitle').textContent = t(isK ? 'out_u' : 'out_k');
    input.placeholder = t(isK ? 'ph_k' : 'ph_u');
    $('#sanskritWrap').hidden = !isK;
    // "keep English" only matters for Kruti Dev -> Unicode: in the other direction Latin words, emails and links are
    // always kept, and numbers must be converted (in the Kruti font "." is ण् and "/" is ध्, so 10.5 must become 10-5)
    $('#keepOptWrap').hidden = !isK;
    $('#dlAnsiBtn').hidden = isK;
    $('#wordHelp').hidden = isK;
    $('#keepWrap').hidden = !S.keep || !isK;
    $('#optKeep').checked = S.keep;
    $('#optSanskrit').checked = S.sanskrit;
    $('#optFont').checked = !!(S.font && KFONT);
    $('#optFont').disabled = !KFONT;
    $('#fontNote').textContent = t(KFONT ? 'font_found' : 'font_missing');
    $('#keepWords').value = S.keepWords;
    $('#viewText').setAttribute('aria-pressed', String(S.view === 'text'));
    $('#viewLines').setAttribute('aria-pressed', String(S.view === 'lines'));
  }

  function setDir(d) {               // keeps the text (used when pasted text clearly belongs to the other side)
    if (d === S.dir) return;
    S.dir = d;
    applyDirUI(); convert(); save();
  }
  function setView(v) { S.view = v; applyDirUI(); render(); save(); }

  function swap() {
    fresh();
    var res = last.text;
    S.dir = k2u() ? 'u2k' : 'k2u';
    input.value = res;
    applyDirUI(); convert(); save();
    input.focus();
  }

  /* text that came from paste / file / drop: switch direction when it obviously belongs to the other side */
  var KRUTI_WORDS = /(^|[\s\]A-])(dk|ds|dh|gS|esa|ls|fd|dks|vkSj|ij|us|;g|Fkk|Hkh|ugha|gSa)(?=$|[\s\]A-])/g;
  function autoDir(text) {
    var share = K.devanagariShare(text);
    if (k2u() && share > 0.5) { setDir('u2k'); EDU.toast(t('auto_u2k')); return; }
    if (!k2u() && share === 0 && (String(text).slice(0, 5000).match(KRUTI_WORDS) || []).length >= 2) { setDir('k2u'); EDU.toast(t('auto_k2u')); }
  }
  function setInput(text, fromOutside) {
    input.value = text;
    if (fromOutside) autoDir(text);
    convert(); save();
  }

  /* ---------- files */
  function decode(u8) {   // returns null for binary files (images, zip, exe...) renamed to .txt
    if (u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF) return new TextDecoder('utf-8').decode(u8.subarray(3));
    if (u8[0] === 0xFF && u8[1] === 0xFE) return new TextDecoder('utf-16le').decode(u8.subarray(2));
    if (u8[0] === 0xFE && u8[1] === 0xFF) return new TextDecoder('utf-16be').decode(u8.subarray(2));
    var n = Math.min(u8.length, 65536), zeroEven = 0, zeroOdd = 0, ctrl = 0;
    for (var i = 0; i < n; i++) {
      var b = u8[i];
      if (b === 0) { if (i % 2) zeroOdd++; else zeroEven++; }
      else if (b < 9 || (b > 13 && b < 32 && b !== 26)) ctrl++;
    }
    if (zeroOdd + zeroEven) {                    // UTF-16 saved without a BOM, or a binary file
      if (zeroOdd > n * 0.3 && zeroEven < n * 0.02) return new TextDecoder('utf-16le').decode(u8);
      if (zeroEven > n * 0.3 && zeroOdd < n * 0.02) return new TextDecoder('utf-16be').decode(u8);
      return null;
    }
    if (ctrl > Math.max(4, n * 0.01)) return null;
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u8); }
    catch (e) { return new TextDecoder('windows-1252').decode(u8); }   // old Kruti Dev files saved as "ANSI"
  }
  function readFile(f) {
    if (!f) return;
    if (f.size > MAX_FILE) { EDU.toast(t('file_big')); return; }
    if (/\.(docx?|pdf|rtf|odt|xlsx?)$/i.test(f.name)) { EDU.toast(t('file_word')); return; }
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var u8 = new Uint8Array(fr.result);
        var head = String.fromCharCode.apply(null, u8.subarray(0, 5));
        // .docx/.xlsx (zip), PDF, RTF and old .doc files, even when renamed to .txt
        if (/^(PK|%PDF|\{\\rtf)/.test(head) || (u8[0] === 0xD0 && u8[1] === 0xCF && u8[2] === 0x11 && u8[3] === 0xE0)) { EDU.toast(t('file_word')); return; }
        var text = decode(u8);
        if (text == null) { EDU.toast(t('file_bad')); return; }
        setInput(text, true);
        EDU.toast(t('file_opened', { name: f.name }));
      } catch (e) { EDU.toast(t('file_bad')); }
    };
    fr.onerror = function () { EDU.toast(t('file_bad')); };
    fr.readAsArrayBuffer(f);
  }

  /* ---------- events */
  // picking the other direction works like Swap: the result becomes the new text, so nothing is lost
  $('#dirK2U').addEventListener('click', function () { if (!k2u()) swap(); });
  $('#dirU2K').addEventListener('click', function () { if (k2u()) swap(); });
  $('#swap').addEventListener('click', swap);
  $('#viewText').addEventListener('click', function () { setView('text'); });
  $('#viewLines').addEventListener('click', function () { setView('lines'); });
  $('#optKeep').addEventListener('change', function () { S.keep = this.checked; applyDirUI(); convert(); save(); });
  $('#optSanskrit').addEventListener('change', function () { S.sanskrit = this.checked; convert(); save(); });
  $('#optFont').addEventListener('change', function () { S.font = this.checked; render(); save(); });
  $('#keepWords').addEventListener('input', function () { S.keepWords = this.value; schedule(); });

  input.addEventListener('input', schedule);
  input.addEventListener('paste', function () {
    var before = input.value;
    setTimeout(function () { if (!before.trim() || input.value.length > before.length * 2) autoDir(input.value); convert(); }, 0);
  });
  input.addEventListener('dragover', function (e) { e.preventDefault(); });
  input.addEventListener('drop', function (e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) { e.preventDefault(); readFile(f); }
  });

  $('#openBtn').addEventListener('click', function () { EDU.pickFile('.txt,text/plain').then(readFile); });
  $('#pasteBtn').addEventListener('click', function () {
    if (!navigator.clipboard || !navigator.clipboard.readText) { EDU.toast(t('paste_fail')); input.focus(); return; }
    navigator.clipboard.readText().then(function (txt) { if (txt) setInput(txt, true); else input.focus(); })
      .catch(function () { EDU.toast(t('paste_fail')); input.focus(); });
  });
  $('#sampleBtn').addEventListener('click', function () { setInput(k2u() ? SAMPLE_K : SAMPLE_U, false); EDU.toast(t('sample_loaded')); });
  $('#clearBtn').addEventListener('click', function () { setInput('', false); input.focus(); });

  function copyResult() {
    fresh();
    if (!last.text) { EDU.toast(t('nothing')); return; }
    EDU.copy(last.text);
  }
  $('#copyBtn').addEventListener('click', copyResult);
  $('#dlBtn').addEventListener('click', function () {
    fresh();
    if (!last.text) { EDU.toast(t('nothing')); return; }
    EDU.download(k2u() ? 'unicode.txt' : 'krutidev.txt', '﻿' + last.text.replace(/\r?\n/g, '\r\n'), 'text/plain');
  });
  $('#dlAnsiBtn').addEventListener('click', function () {
    fresh();
    if (!last.text) { EDU.toast(t('nothing')); return; }
    var r = K.toAnsiBytes(last.text);
    EDU.download('krutidev-ansi.txt', new Blob([r.bytes], { type: 'text/plain' }));
    if (r.lost) EDU.toast(t('ansi_lost', { n: EDU.fmt(r.lost) }));
  });
  $('#printBtn').addEventListener('click', function () {
    fresh();
    if (!last.text) { EDU.toast(t('nothing')); return; }
    var pa = $('#printArea'); pa.textContent = '';
    pa.appendChild(el('pre', { class: k2u() ? 'kd-uni' : (S.font && KFONT ? 'kd-kfont' : 'kd-mono'), dir: 'ltr', text: last.text }));
    window.print();
  });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    S = Object.assign({}, DEF);
    store.remove('state');
    input.value = SAMPLE_K;
    applyDirUI(); convert();
  });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) swap(); else copyResult(); }
  });

  /* ---------- cheat-sheet */
  var cheatFilter = $('#cheatFilter');
  function tile(pair, wide) {
    var d = el('div', { class: 'kd-tile no-i18n' }, el('span', { class: 'u', text: pair[1] }), el('kbd', { text: pair[0] }));
    d.dataset.q = (pair[0] + ' ' + pair[1]).toLowerCase();
    return d;
  }
  function pairEl(p) {
    return el('span', { class: 'kd-pair no-i18n' }, el('kbd', { text: p[0] }), el('span', { class: 'arr', 'aria-hidden': 'true', text: '→' }), el('span', { class: 'u', text: p[1] }));
  }
  var RULES = [
    ['rule_i', [['fd;k', 'किया'], ['fLFkfr', 'स्थिति'], ['fiz;', 'प्रिय']]],
    ['rule_reph', [['/keZ', 'धर्म'], ['dhfrZ', 'कीर्ति'], ['o"kks±', 'वर्षों']]],
    ['rule_stem', [['[k', 'ख'], ['Hk', 'भ'], ["'k", 'श']]],
    ['rule_punct', [['-', '.'], ['&', '-'], [']', ','], ['\\', '?'], ['A', '।']]],
    ['rule_quotes', [['“k', 'श'], ['‘k', 'ष']]]
  ];
  function renderCheat() {
    var body = $('#cheatBody'), C = K.CHEAT;
    body.textContent = '';
    [['cheat_vowels', C.vowels], ['cheat_matras', C.matras], ['cheat_cons', C.cons], ['cheat_half', C.half], ['cheat_conj', C.conj], ['cheat_punct', C.punct], ['cheat_examples', C.examples, true]]
      .forEach(function (g) {
        var grid = el('div', { class: 'kd-tiles' + (g[2] ? ' wide' : '') });
        g[1].forEach(function (p) { grid.appendChild(tile(p)); });
        body.appendChild(el('section', { class: 'kd-group' }, el('h3', { text: t(g[0]) }), grid));
      });
    var ol = el('ol', { class: 'kd-rules' });
    RULES.forEach(function (r) {
      var ex = el('div', { class: 'ex' }); r[1].forEach(function (p) { ex.appendChild(pairEl(p)); });
      var li = el('li', {}, el('span', { text: t(r[0]) }), ex);
      li.dataset.q = r[1].map(function (p) { return p.join(' '); }).join(' ').toLowerCase();
      ol.appendChild(li);
    });
    body.appendChild(el('section', { class: 'kd-group kd-rules-group' }, el('h3', { text: t('cheat_rules') }), ol));
    filterCheat();
  }
  function filterCheat() {
    var q = cheatFilter.value.trim().toLowerCase(), any = false;
    EDU.$$('.kd-group', $('#cheatBody')).forEach(function (g) {
      var items = EDU.$$('.kd-tile, .kd-rules > li', g), shown = 0;
      items.forEach(function (it) { var ok = !q || it.dataset.q.indexOf(q) >= 0; it.hidden = !ok; if (ok) shown++; });
      g.hidden = !shown; if (shown) any = true;
    });
    $('#cheatNone').hidden = any;
  }
  cheatFilter.addEventListener('input', filterCheat);

  /* ---------- start */
  input.value = S.text == null ? SAMPLE_K : S.text;
  if (S.text == null && S.dir === 'u2k') input.value = SAMPLE_U;
  applyDirUI();
  renderCheat();
  convert();
  EDU.onLang(function () { applyDirUI(); renderCheat(); render(); });
  window.KD_APP = { convert: convert, get last() { return last; } };
})();
