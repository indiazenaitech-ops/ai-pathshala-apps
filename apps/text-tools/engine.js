/* Text Tools engine: pure text functions (no DOM, no EDU), so the same code also runs inside a Web Worker
   (app.js builds the worker from TT_FACTORY.toString()). Every function takes text and returns new text
   plus a count of what changed. Only Latin letters change case; Indian scripts pass through untouched. */
function TT_FACTORY() {
  'use strict';
  var HAS_SEG = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function';
  function rx(src, flags, fb) { try { return new RegExp(src, flags); } catch (e) { return fb; } }
  var IND = '\\u0900-\\u0DFF\\u0600-\\u06FF\\u0750-\\u077F';
  var RE_LATIN = rx('\\p{Script=Latin}', 'u', /[A-Za-zÀ-ɏḀ-ỿ]/);
  var RE_LATIN_G = rx('\\p{Script=Latin}', 'gu', /[A-Za-zÀ-ɏḀ-ỿ]/g);
  var RE_LETTER = rx('\\p{L}', 'u', new RegExp('[A-Za-z\\u00C0-\\u024F' + IND + ']'));
  var RE_WORDCH = rx('^[\\p{L}\\p{M}\\p{N}_]$', 'u', new RegExp('^[A-Za-z0-9_\\u00C0-\\u024F' + IND + ']$'));
  var RE_HASWORD = rx('[\\p{L}\\p{N}]', 'u', new RegExp('[A-Za-z0-9\\u00C0-\\u024F' + IND + ']'));
  var RE_EDGE = rx('^([^\\p{L}\\p{N}]*)([^]*?)([^\\p{L}\\p{N}]*)$', 'u', /^([^A-Za-z0-9À-ɏऀ-෿؀-ۿ]*)([^]*?)([^A-Za-z0-9À-ɏऀ-෿؀-ۿ]*)$/);
  var RE_PUNCT = rx('\\p{P}', 'gu', /[!-\/:-@\[-`{-~¡-¿‐-‧‰-⁞।॥॰،؛؟۔]/g);
  var RE_PUNCT_1 = rx('^\\p{P}$', 'u', /^[!-\/:-@\[-`{-~]$/);
  var RE_NUMTOK = rx('\\p{Nd}+(?:[.,:\\/\\-]\\p{Nd}+)*', 'gu', /[0-9०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]+(?:[.,:\/\-][0-9०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]+)*/g);
  var RE_EMOJI = rx('(?:[#*0-9]\\uFE0F?\\u20E3|\\p{Regional_Indicator}{1,2}|(?![\\u00A9\\u00AE\\u2122])\\p{Extended_Pictographic}(?:\\uFE0F|\\uFE0E|[\\u{1F3FB}-\\u{1F3FF}]|[\\u{E0020}-\\u{E007F}])*(?:\\u200D(?:\\p{Extended_Pictographic})(?:\\uFE0F|[\\u{1F3FB}-\\u{1F3FF}])*)*)', 'gu',
    /(?:[☀-➿]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])*(?:\u200D(?:[☀-➿]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF])\uFE0F?)*/g);
  var RE_LIST = rx('^\\s*(?:[-*\\u2022\\u25AA\\u25E6\\u25CF\\u25CB\\u25A0\\u25A1\\u27A2\\u25BA\\u2713\\u2714\\u2013\\u2014]|\\(?\\p{Nd}{1,3}[.)]|\\(?[a-zA-Z]\\)|\\(?[ivxIVX]{1,4}[.)])\\s+', 'u',
    /^\s*(?:[-*•▪◦●○■□➢►✓✔–—]|\(?[0-9०-९]{1,3}[.)]|\(?[a-zA-Z]\)|\(?[ivxIVX]{1,4}[.)])\s+/);
  var RE_NUMBERING = rx('^\\s*\\(?\\p{Nd}{1,4}[.):]\\s+', 'u', /^\s*\(?[0-9०-९]{1,4}[.):]\s+/);
  var TERM = /[.!?।॥۔؟]["'”’)\]]*$/;

  /* ---------------- small helpers ---------------- */
  function set(words) { var o = Object.create(null); words.split(/\s+/).forEach(function (w) { if (w) o[w] = 1; }); return o; }
  function nfc(s) { return s.normalize ? s.normalize('NFC') : s; }
  function isBlank(l) { return !/\S/.test(l); }
  function lowerLatin(s) { return s.replace(RE_LATIN_G, function (c) { return c.toLowerCase(); }); }
  function upperLatin(s) { return s.replace(RE_LATIN_G, function (c) { return c.toUpperCase(); }); }
  function hasLatin(s) { return RE_LATIN.test(s); }
  /* the first Latin letter of a word becomes a capital (only when the word starts with a letter, so "10th" stays) */
  function capFirst(s) {
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (RE_LATIN.test(c)) return s.slice(0, i) + c.toUpperCase() + s.slice(i + 1);
      if (RE_LETTER.test(c) || /[0-9]/.test(c)) return s;
    }
    return s;
  }
  /* "\n" and "\t" typed in a box mean a new line and a tab */
  function unesc(s) { return String(s == null ? '' : s).replace(/\\(n|t|\\)/g, function (m, c) { return c === 'n' ? '\n' : c === 't' ? '\t' : '\\'; }); }
  /* Text without its trailing line breaks (kept as "tail", so line tools never move them). */
  function splitLines(text) {
    var m = /\n+$/.exec(text), tail = m ? m[0] : '';
    var body = tail ? text.slice(0, text.length - tail.length) : text;
    return { lines: body === '' && tail ? [] : body.split('\n'), tail: tail };
  }
  function joinLines(sl, lines) { return lines.join('\n') + sl.tail; }
  var segCache = {};
  function segmenter(locale, gran) {
    if (!HAS_SEG) return null;
    var k = (locale || 'en') + ':' + gran;
    if (segCache[k] === undefined) { try { segCache[k] = new Intl.Segmenter(locale || 'en', { granularity: gran }); } catch (e) { segCache[k] = null; } }
    return segCache[k];
  }
  /* letters as the eye sees them: कि = 1, हूँ = 1 (code points when Intl.Segmenter is missing) */
  function graphemes(s, locale) {
    var sg = segmenter(locale, 'grapheme');
    if (!sg) return Array.from(s);
    var out = [], it = sg.segment(s)[Symbol.iterator](), r;
    while (!(r = it.next()).done) out.push(r.value.segment);
    return out;
  }
  function graphemeCount(s, locale) {
    var sg = segmenter(locale, 'grapheme');
    if (!sg) return Array.from(s).length;
    var n = 0, it = sg.segment(s)[Symbol.iterator]();
    while (!it.next().done) n++;
    return n;
  }
  /* Remove every match of re and tidy the spaces left behind ("Hello, world!" -> "Hello world"). */
  function removeTidy(text, re, keep) {
    var MARK = '\uFFFF', n = 0;
    if (text.indexOf(MARK) >= 0) MARK = '\uFDD0';
    re.lastIndex = 0;
    var s = text.replace(re, function (m) { if (keep && keep(m)) return m; n++; return MARK; });
    if (!n) return { text: text, n: 0 };
    var run = new RegExp('([^\\S\\n]*)' + MARK + '(?:[^\\S\\n]*' + MARK + ')*([^\\S\\n]*)', 'g');
    s = s.replace(run, function (m, a, b, off, str) {
      var before = off === 0 ? '\n' : str[off - 1], after = str[off + m.length];
      if (before === '\n' || after === undefined || after === '\n') return '';
      if (/[,.;:!?)\]}।॥۔،]/.test(after) || /[(\[{]/.test(before)) return '';
      return /[^\S\n]/.test(m) ? ' ' : '';
    });
    return { text: s, n: n };
  }

  /* ---------------- case (Latin letters only) ---------------- */
  var SMALL = set('a an the and but or nor for so yet as at by if in of off on per to up via vs vs. v.');
  var ABBR = set('e.g. i.e. mr. mrs. ms. dr. prof. vs. sh. smt. st. no. rs.');
  /* iPhone, eBay, McDonald, YouTube, WhatsApp, PhD keep their inner capitals */
  var INNER = /^(?:[a-z]?[A-Z][a-z]+(?:[A-Z][a-z]*)+|[a-z][A-Z][a-z]+)$/;
  /* a short word in capitals (CBSE, UPI, GST, NCERT) is an acronym and keeps its capitals */
  function allCapsWord(core) {
    var L = core.replace(/[^A-Za-zÀ-ɏ]/g, '');
    return L.length >= 2 && L.length <= 6 && L === L.toUpperCase() && L !== L.toLowerCase() && !(STOP[L.toLowerCase()] && !/^(?:IT|US)$/.test(L));
  }
  /* a line written mostly in capitals is "shouting": every word is changed, acronyms cannot be told apart */
  function lineHasLower(line) {
    var up = (line.match(/[A-ZÀ-ÖØ-Þ]/g) || []).length, lo = (line.match(/[a-zß-öø-ÿ]/g) || []).length;
    return lo > 0 && up / (up + lo) <= 0.7;
  }
  function edges(w) { var m = RE_EDGE.exec(w); return m ? { lead: m[1], core: m[2], trail: m[3] } : { lead: '', core: w, trail: '' }; }
  function eachWord(line, fn) { return line.replace(/\S+/g, fn); }

  function upper(text) { return upperLatin(text); }
  function lower(text) { return lowerLatin(text); }
  function inverse(text) {
    return text.replace(RE_LATIN_G, function (c) { var u = c.toUpperCase(); return c === u ? c.toLowerCase() : u; });
  }
  function alternate(text) {
    var i = 0;
    return text.replace(RE_LATIN_G, function (c) { return (i++ % 2) ? c.toUpperCase() : c.toLowerCase(); });
  }
  /* Title Case: small words (a, of, the …) stay small unless they start or end the title or follow a colon. */
  function title(text, o) {
    o = o || {};
    return text.split('\n').map(function (line) {
      if (!hasLatin(line)) return line;
      var caps = !lineHasLower(line), words = line.match(/\S+/g) || [], first = -1, last = -1, i;
      for (i = 0; i < words.length; i++) if (RE_LETTER.test(words[i])) { if (first < 0) first = i; last = i; }
      var k = -1, prev = '';
      return eachWord(line, function (w) {
        k++;
        var e = edges(w), core = e.core, out = core;
        var afterBreak = k > first && (/[:.!?—–]$/.test(prev) || /^[—–-]+$/.test(prev));
        prev = w;
        if (!hasLatin(core)) return w;
        var lc = core.toLowerCase();
        if (o.small !== false && SMALL[lc] && k !== first && k !== last && !afterBreak) out = lowerLatin(core);
        else if (!caps && o.keepCaps !== false && allCapsWord(core)) out = core;
        else if (!caps && INNER.test(core)) out = core;
        else {
          out = lowerLatin(core).split(/([\-‐–\/])/).map(function (part, p) {
            if (p % 2) return part;
            if (p > 0 && o.small !== false && SMALL[part]) return part;
            return capFirst(part);
          }).join('');
        }
        return e.lead + out + e.trail;
      });
    }).join('\n');
  }
  /* Sentence case: everything small, then a capital at the start of every line and after . ! ? । ॥ ۔ ؟ */
  function sentence(text, o) {
    o = o || {};
    return text.split('\n').map(function (line) {
      if (!hasLatin(line)) return line;
      var caps = !lineHasLower(line), start = true;
      return eachWord(line, function (w) {
        var e = edges(w), core = e.core, out = core, wasStart = start;
        start = TERM.test(w) && !ABBR[w.toLowerCase()];
        if (!hasLatin(core)) { if (RE_LETTER.test(core)) return w; start = start || wasStart; return w; }
        if (!caps && o.keepCaps !== false && allCapsWord(core)) out = core;
        else if (!caps && INNER.test(core)) out = core;
        else out = lowerLatin(core);
        if (/^i(?:['’](?:m|ll|ve|d))?$/.test(out)) out = 'I' + out.slice(1);
        if (wasStart) out = capFirst(out);
        return e.lead + out + e.trail;
      });
    }).join('\n');
  }

  /* ---------------- clean up ---------------- */
  var HS = '[^\\S\\n]';   // horizontal white space (NBSP, tabs, thin spaces … but not line breaks)
  function trimLines(text) {
    var n = 0;
    var out = text.split('\n').map(function (l) {
      var t = l.replace(/^[^\S\n]+|[^\S\n]+$/g, '').replace(/^\u200B+|\u200B+$/g, '');
      if (t !== l) n++;
      return t;
    }).join('\n');
    return { text: out, n: n };
  }
  /* runs of spaces become one space, odd spaces (no-break, thin) become a normal space, line ends are trimmed.
     Tabs are left alone (they separate columns copied from Excel); use "Tabs to spaces" for those. */
  var ODD_SP = '\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000';
  var RE_SPRUN = new RegExp('[ ' + ODD_SP + ']{2,}|[' + ODD_SP + ']', 'g');
  function collapseSpaces(text) {
    var n = 0;
    var out = text.split('\n').map(function (l) {
      var r = l.replace(RE_SPRUN, function () { n++; return ' '; });
      var t = r.replace(/^ +| +$/g, '');
      if (t !== r && t === r.trim()) n++;
      return t;
    }).join('\n');
    return { text: out, n: n };
  }
  function count(s, re) { var m = s.match(re); return m ? m.length : 0; }
  function removeEmptyLines(text) {
    var lines = text.split('\n'), out = lines.filter(function (l) { return !isBlank(l); });
    return { text: out.join('\n'), n: lines.length - out.length };
  }
  /* blank lines in a row become one; blank lines at the very start and end go */
  function squeezeEmptyLines(text) {
    var lines = text.split('\n'), out = [], n = 0;
    lines.forEach(function (l) {
      if (isBlank(l)) { if (!out.length || out[out.length - 1] === '') { n++; return; } out.push(''); }
      else out.push(l);
    });
    while (out.length && out[out.length - 1] === '') { out.pop(); n++; }
    return { text: out.join('\n'), n: n };
  }
  function median(a) { if (!a.length) return 0; var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.floor(s.length / 2)]; }
  /* Join lines broken by a PDF or an e-mail into paragraphs. Blank lines, list items and short lines that end a
     paragraph (or a heading) keep their line break; a word cut with a hyphen ("infor-\nmation") is joined again. */
  function joinBroken(text, o) {
    o = o || {};
    var lines = text.split('\n'), out = [], n = 0, lens = [];
    lines.forEach(function (l) { if (!isBlank(l)) lens.push(l.trim().length); });
    var med = lens.length >= 4 ? median(lens) : 0, shortCut = o.smart === false || med < 20 ? 0 : med * 0.62;
    var open = false, lastLen = 0;
    lines.forEach(function (raw) {
      var l = raw.replace(/^[^\S\n]+|[^\S\n]+$/g, '');
      if (!l) { out.push(''); open = false; return; }
      var prev = open ? out[out.length - 1] : '';
      var isList = o.keepLists !== false && RE_LIST.test(l);
      var prevShort = shortCut && lastLen < shortCut;
      /* a short line without an end mark after a finished sentence is a heading: keep it on its own line */
      var heading = shortCut && l.length < shortCut && TERM.test(prev) && !TERM.test(l) && !/^[a-z\u00DF-\u00FF]/.test(l);
      if (open && !isList && !prevShort && !heading) {
        if (/[A-Za-z\u00C0-\u024F][-\u00AD]$/.test(prev) && /^[a-z\u00DF-\u00FF]/.test(l)) out[out.length - 1] = prev.slice(0, -1) + l;
        else out[out.length - 1] = prev + ' ' + l;
        n++;
      } else out.push(l);
      lastLen = l.length;
      open = true;
    });
    return { text: out.join('\n'), n: n };
  }
  function removeBreaks(text) {
    var parts = text.split('\n'), out = '', n = 0;
    parts.forEach(function (raw, i) {
      var l = raw.replace(/^[^\S\n]+|[^\S\n]+$/g, '');
      if (i > 0) n++;
      if (!l) return;
      if (!out) out = l;
      else if (/[A-Za-zÀ-ɏ][-\u00AD]$/.test(out) && /^[a-zß-ÿ]/.test(l)) out = out.slice(0, -1) + l;
      else out += ' ' + l;
    });
    return { text: out, n: n };
  }
  var ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0', ndash: '–', mdash: '—', hellip: '…',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', copy: '©', reg: '®', trade: '™', bull: '•',
    middot: '·', laquo: '«', raquo: '»', times: '×', divide: '÷', deg: '°', rupee: '₹', euro: '€', pound: '£' };
  function decodeEntities(s) {
    return s.replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{2,8});/gi, function (m, e) {
      if (e[0] === '#') {
        var cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        if (cp > 0 && cp <= 0x10FFFF && !(cp >= 0xD800 && cp <= 0xDFFF)) { try { return String.fromCodePoint(cp); } catch (x) { return m; } }
        return m;
      }
      var v = ENT[e.toLowerCase()];
      return v === undefined ? m : v;
    });
  }
  function stripHtml(text) {
    var n = 0, s = text;
    s = s.replace(/<!--[^]*?-->/g, function () { n++; return ''; });
    s = s.replace(/<(script|style|noscript|template)\b[^>]*>[^]*?<\/\1\s*>/gi, function () { n++; return ''; });
    s = s.replace(/<br\s*\/?>/gi, function () { n++; return '\n'; });
    s = s.replace(/<li\b[^>]*>/gi, function () { n++; return '• '; });
    s = s.replace(/<\/(p|div|li|h[1-6]|tr|table|ul|ol|section|article|header|footer|blockquote|pre|dt|dd|figcaption)\s*>/gi, function () { n++; return '\n'; });
    s = s.replace(/<\/t[dh]\s*>/gi, function () { n++; return '\t'; });
    s = s.replace(/<\/?[A-Za-z][^<>]*>|<![^<>]*>/g, function () { n++; return ''; });
    if (!n && !/&(#x?[0-9a-f]+|[a-z]{2,8});/i.test(s)) return { text: text, n: 0 };
    s = decodeEntities(s);
    s = s.split('\n').map(function (l) { return l.replace(/[^\S\n]+$/g, ''); }).join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '');
    if (!/\n$/.test(text)) s = s.replace(/\n+$/, '');
    return { text: s, n: n };
  }
  function removeEmojis(text) { return removeTidy(text, RE_EMOJI); }
  function removeNumbers(text) { return removeTidy(text, RE_NUMTOK); }
  /* a dash or slash between two words becomes a space ("and/or" -> "and or"), other marks just go.
     Vowel signs (matras) and the virama are marks, not punctuation, so Indian words stay whole. */
  function removePunct(text, o) {
    var keep = o && o.keepDanda ? function (m) { return /^[।॥۔]$/.test(m); } : null, k = 0;
    var s = text.replace(/([^\s\-‐-―\/])[\-‐-―\/]+(?=[^\s\-‐-―\/])/g, function (m, c) {
      if (RE_PUNCT_1.test(c)) return m;
      k++; return c + ' ';
    });
    var r = removeTidy(s, RE_PUNCT, keep);
    return { text: r.text, n: r.n + k };
  }
  function curlyQuotes(text) {
    var n = 0;
    var s = text.replace(/"/g, function (m, off, str) {
      n++;
      var p = off ? str[off - 1] : '';
      return !p || /[\s(\[{—–\-‘“]/.test(p) ? '“' : '”';
    });
    s = s.replace(/'/g, function (m, off, str) {
      n++;
      var p = off ? str[off - 1] : '', q = str[off + 1] || '';
      if (p && RE_WORDCH.test(p)) return '’';
      return (!p || /[\s(\[{—–\-“]/.test(p)) && q && !/\s/.test(q) ? '‘' : '’';
    });
    return { text: s, n: n };
  }
  function straightQuotes(text) {
    var n = 0;
    var s = text.replace(/[“”„‟]/g, function () { n++; return '"'; }).replace(/[‘’‚‛]/g, function () { n++; return "'"; });
    return { text: s, n: n };
  }
  function tabsToSpaces(text, size) {
    size = Math.max(1, Math.min(16, size | 0 || 4));
    var n = 0;
    var s = text.split('\n').map(function (line) {
      if (line.indexOf('\t') < 0) return line;
      var out = '', col = 0;
      for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (c === '\t') { var k = size - (col % size); out += new Array(k + 1).join(' '); col += k; n++; }
        else { out += c; col++; }
      }
      return out;
    }).join('\n');
    return { text: s, n: n };
  }
  /* indentation: every `size` spaces become a tab; inside a line, 2 or more spaces become one tab (good for Excel) */
  function spacesToTabs(text, size) {
    size = Math.max(1, Math.min(16, size | 0 || 4));
    var n = 0;
    var s = text.split('\n').map(function (line) {
      var m = /^ +/.exec(line), lead = '', rest = line;
      if (m && m[0].length >= size) {
        var t = Math.floor(m[0].length / size);
        n += t;
        lead = new Array(t + 1).join('\t') + new Array(m[0].length - t * size + 1).join(' ');
        rest = line.slice(m[0].length);
      }
      rest = rest.replace(/(\S) {2,}(?=\S)/g, function (x, c) { n++; return c + '\t'; });
      return lead + rest;
    }).join('\n');
    return { text: s, n: n };
  }
  function quickClean(text) {
    var s = collapseSpaces(text).text;
    s = trimLines(s).text;
    s = squeezeEmptyLines(s).text;
    return { text: s, n: text.length - s.length };
  }

  /* ---------------- lines ---------------- */
  function dedupe(text, o) {
    o = o || {};
    var sl = splitLines(text), seen = Object.create(null), out = [], n = 0;
    sl.lines.forEach(function (l) {
      if (isBlank(l)) { out.push(l); return; }          // empty lines are kept (they separate paragraphs)
      var k = o.trim === false ? l : l.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
      k = nfc(o.matchCase === false ? k.toLowerCase() : k);
      if (seen[k]) { n++; return; }
      seen[k] = 1; out.push(l);
    });
    return { text: joinLines(sl, out), n: n, left: out.filter(function (l) { return !isBlank(l); }).length };
  }
  /* the first number in a line: "Roll 12" -> 12, "₹1,20,000" -> 120000, "-3.5" -> -3.5, "१२" -> 12 */
  var IDIG = '०০੦૦୦௦౦೦൦٠۰';
  function westDigits(s) {
    return s.replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g, function (c) {
      var cp = c.charCodeAt(0);
      for (var i = 0; i < IDIG.length; i++) { var z = IDIG.charCodeAt(i); if (cp >= z && cp <= z + 9) return String(cp - z); }
      return c;
    });
  }
  var RE_FIRSTNUM = /(^|[^\d.])(-|−)?(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+(?:\.\d+)?|\.\d+)/;
  function firstNumber(l) {
    var m = RE_FIRSTNUM.exec(westDigits(l));
    if (!m) return null;
    var v = parseFloat(m[3].replace(/,/g, ''));
    if (!isFinite(v)) return null;
    return m[2] ? -v : v;
  }
  function collatorFor(locale, o) {
    try { return new Intl.Collator(locale || 'en', { numeric: true, sensitivity: o && o.matchCase ? 'variant' : 'accent', caseFirst: 'upper' }); }
    catch (e) { return { compare: function (a, b) { return a < b ? -1 : a > b ? 1 : 0; } }; }
  }
  function sortLines(text, o) {
    o = o || {};
    var sl = splitLines(text), col = collatorFor(o.locale, o), mode = o.mode || 'az';
    var full = sl.lines.filter(function (l) { return !isBlank(l); }), blanks = sl.lines.length - full.length;
    var items = full.map(function (l, i) {
      var t = l.replace(/^\s+/, '');
      return { l: l, t: t, i: i, len: mode === 'len' || mode === 'lenr' ? graphemeCount(t.replace(/\s+$/, ''), o.locale) : 0, num: mode === 'num' ? firstNumber(l) : 0 };
    });
    var cmpText = function (a, b) { return col.compare(a.t, b.t) || a.i - b.i; };
    var f = {
      az: cmpText,
      za: function (a, b) { return col.compare(b.t, a.t) || a.i - b.i; },
      len: function (a, b) { return a.len - b.len || cmpText(a, b); },
      lenr: function (a, b) { return b.len - a.len || cmpText(a, b); },
      num: function (a, b) {
        if (a.num === null || b.num === null) return a.num === null && b.num === null ? cmpText(a, b) : a.num === null ? 1 : -1;
        return (o.desc ? b.num - a.num : a.num - b.num) || cmpText(a, b);
      }
    }[mode] || cmpText;
    items.sort(f);
    var out = items.map(function (x) { return x.l; });
    for (var k = 0; k < blanks; k++) out.push('');
    return { text: joinLines(sl, out), n: full.length };
  }
  function reverseLines(text) {
    var sl = splitLines(text);
    return { text: joinLines(sl, sl.lines.slice().reverse()), n: sl.lines.length };
  }
  function shuffleLines(text) {
    var sl = splitLines(text), a = sl.lines.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
    return { text: joinLines(sl, a), n: a.length };
  }
  var NUM_STYLES = { dot: '{n}. ', par: '{n}) ', br: '({n}) ', dash: '{n} - ', colon: '{n}: ', tab: '{n}\t' };
  function numberLines(text, o) {
    o = o || {};
    var sl = splitLines(text), k = isFinite(o.start) ? Math.round(o.start) : 1, n = 0;
    var tpl = NUM_STYLES[o.style] || NUM_STYLES.dot, width = 0;
    if (o.pad) { var cnt = sl.lines.filter(function (l) { return o.skipEmpty === false || !isBlank(l); }).length; width = String(k + cnt - 1).length; }
    var out = sl.lines.map(function (l) {
      if (o.skipEmpty !== false && isBlank(l)) return l;
      var s = String(k++); while (s.length < width) s = '0' + s;
      n++;
      return tpl.replace('{n}', s) + l;
    });
    return { text: joinLines(sl, out), n: n };
  }
  function unnumberLines(text) {
    var n = 0, out = text.split('\n').map(function (l) {
      var m = RE_LIST.exec(l);
      if (!m) return l;
      n++;
      return l.slice(m[0].length);
    });
    return { text: out.join('\n'), n: n };
  }
  function affixLines(text, o) {
    o = o || {};
    var pre = unesc(o.prefix), suf = unesc(o.suffix), sl = splitLines(text), n = 0;
    if (!pre && !suf) return { text: text, n: 0 };
    var out = sl.lines.map(function (l) {
      if (o.skipEmpty !== false && isBlank(l)) return l;
      n++;
      return pre + l + suf;
    });
    return { text: joinLines(sl, out), n: n };
  }
  function filterLines(text, o) {
    o = o || {};
    var w = unesc(o.word || '');
    if (!w) return { text: text, n: 0, err: 'empty' };
    var needle = o.matchCase ? nfc(w) : nfc(w).toLowerCase(), n = 0;
    var out = text.split('\n').filter(function (l) {
      var hay = o.matchCase ? nfc(l) : nfc(l).toLowerCase();
      var has = hay.indexOf(needle) >= 0;
      var keep = o.keep ? has : !has;
      if (!keep) n++;
      return keep;
    });
    return { text: out.join('\n'), n: n, left: out.length };
  }
  function splitText(text, o) {
    o = o || {};
    var d = unesc(o.delim == null ? ',' : o.delim);
    if (!d) return { text: text, n: 0, err: 'empty' };
    var parts = text.split(d), out = [];
    parts.forEach(function (p) {
      var x = o.trim === false ? p : p.replace(/^[^\S\n]+|[^\S\n]+$/g, '');
      if (o.dropEmpty !== false && !/\S/.test(x)) return;
      out.push(x);
    });
    return { text: out.join('\n'), n: out.length, pieces: parts.length };
  }
  function joinText(text, o) {
    o = o || {};
    var d = unesc(o.delim == null ? ', ' : o.delim), lines = text.split('\n'), out = [];
    lines.forEach(function (l) {
      var x = o.trim === false ? l : l.replace(/^[^\S\n]+|[^\S\n]+$/g, '');
      if (o.skipEmpty !== false && !x) return;
      out.push(x);
    });
    return { text: out.join(d), n: out.length };
  }

  /* ---------------- find & replace ---------------- */
  var WORD_U = '[\\p{L}\\p{M}\\p{N}_]', WORD_B = '[A-Za-z0-9_\\u00C0-\\u024F\\u0900-\\u0DFF\\u0600-\\u06FF\\u0750-\\u077F]';
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'); }
  /* (a+)+, (\w*)*, (x|x?)+ … : a group that is repeated and holds a repeat can take forever on some texts */
  function risky(src) {
    return /\((?:[^()\\]|\\.)*(?:[+*]|\{\d+,\d*\})(?:[^()\\]|\\.)*\)(?:[+*]|\{\d+,?\d*\})/.test(src) ||
           /\((?:[^()\\]|\\.)*\|(?:[^()\\]|\\.)*\)(?:[+*]|\{\d+,\d*\})/.test(src) && /(\.\*|\\[sSwWdD]\*)/.test(src);
  }
  var MAX_PATTERN = 1000;
  function buildRe(o) {
    var src = o.regex ? String(o.find || '') : escapeRe(unesc(o.find || ''));
    if (!src) return { err: 'empty' };
    if (src.length > MAX_PATTERN) return { err: 'long' };
    var flags = 'gm' + (o.matchCase ? '' : 'i'), re = null, msg = '';
    var attempts = o.whole ?
      [['(?<!' + WORD_U + ')(?:' + src + ')(?!' + WORD_U + ')', flags + 'u'], ['(?<!' + WORD_B + ')(?:' + src + ')(?!' + WORD_B + ')', flags]] :
      [[src, flags + 'u'], [src, flags]];
    for (var i = 0; i < attempts.length && !re; i++) {
      try { re = new RegExp(attempts[i][0], attempts[i][1]); } catch (e) { if (!msg) msg = String(e.message || e).replace(/^Invalid regular expression: /, ''); }
    }
    if (!re && o.whole) {   // very old browsers without look-behind: plain \b (English only)
      try { re = new RegExp('\\b(?:' + src + ')\\b', flags); } catch (e) { }
    }
    if (!re) return { err: 'bad', msg: msg.slice(0, 160) };
    return { re: re, risky: o.regex && risky(src) };
  }
  function replaceAll(text, o) {
    var b = buildRe(o);
    if (b.err) return { text: text, n: 0, err: b.err, msg: b.msg };
    if (o.guard && b.risky) return { text: text, n: 0, err: 'risky' };
    var n = 0, rep = o.regex ? unesc(o.repl || '') : unesc(o.repl || '');
    var out = o.regex ?
      text.replace(b.re, function () { n++; var args = arguments; return expandRepl(rep, args); }) :
      text.replace(b.re, function () { n++; return rep; });
    return { text: out, n: n };
  }
  /* $1 … $99, $& (whole match), $$ (a dollar sign), $<name> */
  function expandRepl(rep, args) {
    if (rep.indexOf('$') < 0) return rep;
    var groups = typeof args[args.length - 1] === 'object' ? args[args.length - 1] : null;
    var nCap = args.length - (groups ? 4 : 3);
    return rep.replace(/\$(\$|&|\d{1,2}|<([^>]+)>)/g, function (m, k, name) {
      if (k === '$') return '$';
      if (k === '&') return args[0];
      if (name !== undefined) return groups && groups[name] != null ? groups[name] : '';
      var i = parseInt(k, 10);
      if (i >= 1 && i <= nCap) return args[i] == null ? '' : args[i];
      if (k.length === 2) { var j = parseInt(k[0], 10); if (j >= 1 && j <= nCap) return (args[j] == null ? '' : args[j]) + k[1]; }
      return m;
    });
  }
  function findAll(text, o) {
    var b = buildRe(o);
    if (b.err) return { n: 0, pos: [], err: b.err, msg: b.msg };
    if (o.guard && b.risky) return { n: 0, pos: [], err: 'risky' };
    var re = b.re, pos = [], n = 0, m, MAXP = 50000;
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      n++;
      if (pos.length < MAXP) pos.push(m.index, m.index + m[0].length);
      if (m[0] === '') re.lastIndex += (text.codePointAt(re.lastIndex) > 0xFFFF ? 2 : 1);
      if (re.lastIndex > text.length) break;
    }
    return { n: n, pos: pos };
  }

  /* ---------------- extract ---------------- */
  var TLD = 'com|in|org|net|edu|gov|info|biz|ai|io|app|dev|me|co|online|site|store|shop|tech|xyz|live|news|blog|today|world';
  var RE_EMAIL = /[A-Za-z0-9](?:[A-Za-z0-9._%+\-]*[A-Za-z0-9_%+\-])?@[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,24}/g;
  /* addresses that start with http(s) or www., plus bare names such as cbse.gov.in or example.com/fees (known endings only) */
  var RE_URL = rx('(?:https?:\\/\\/|www\\.)[^\\s<>"\'`]+|(?<![@\\w.\\-\\/])(?:[a-z0-9](?:[a-z0-9\\-]*[a-z0-9])?\\.)+(?:' + TLD + ')(?:\\.in)?(?![\\w\\-@])(?:\\/[^\\s<>"\'`]*)?', 'gi',
    /(?:https?:\/\/|www\.)[^\s<>"'`]+/gi);
  function cleanUrl(u) {
    for (;;) {
      var last = u.slice(-1);
      if (/[.,;:!?'"’”।॥]/.test(last)) { u = u.slice(0, -1); continue; }
      if (last === ')' && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length) { u = u.slice(0, -1); continue; }
      if (last === ']' && u.indexOf('[') < 0) { u = u.slice(0, -1); continue; }
      return u;
    }
  }
  var RE_TAG = rx('(^|[^\\p{L}\\p{M}\\p{N}_&#/])#([\\p{L}\\p{M}\\p{N}_]+)', 'gu', /(^|[^A-Za-z0-9_&#\/ऀ-෿])#([A-Za-z0-9_À-ɏऀ-෿؀-ۿ]+)/g);
  var RE_HASLETTER = rx('\\p{L}', 'u', /[A-Za-zÀ-ɏऀ-෿؀-ۿ]/);
  var RE_NUMX = rx('(?<![\\p{L}\\p{N}.,])[\\-\\u2212]?(?:\\p{Nd}{1,3}(?:,\\p{Nd}{2,3})+|\\p{Nd}+)(?:\\.\\p{Nd}+)?', 'gu', /[\-−]?(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d+)?/g);
  /* Indian mobile numbers in any common way of writing: +91 98765 43210, 098765-43210, 9876543210, (+91) 98765.43210 */
  var RE_PHONERUN = /\+?\(?\+?\d[\d \-.()\u00A0]*\d/g;
  function phoneDigits(d) {
    if (d.length === 10 && /^[6-9]/.test(d)) return d;
    if (d.length === 11 && /^0[6-9]/.test(d)) return d.slice(1);
    if (d.length === 12 && /^91[6-9]/.test(d)) return d.slice(2);
    if (d.length === 13 && /^091[6-9]/.test(d)) return d.slice(3);
    if (d.length === 14 && /^0091[6-9]/.test(d)) return d.slice(4);
    return null;
  }
  function phones(text) {
    var out = [], m;
    RE_PHONERUN.lastIndex = 0;
    while ((m = RE_PHONERUN.exec(text))) {
      var s = m.index, e = s + m[0].length;
      if (s > 0 && /[A-Za-z0-9_]/.test(text[s - 1])) continue;            // part of an ID such as AB9876543210
      if (e < text.length && /[A-Za-z0-9_]/.test(text[e])) continue;
      var groups = m[0].split(/[ \-.()\u00A0]+/).filter(Boolean), i = 0;
      while (i < groups.length) {
        var acc = '', best = -1, bestNum = null;
        for (var j = i; j < groups.length; j++) {
          acc += groups[j].replace(/\D/g, '');
          if (acc.length > 14) break;
          var p = phoneDigits(acc);
          /* "0731 2345678" is a landline (STD code + number), not a mobile */
          if (p && acc.length === 11 && j > i && /^0\d{2,4}$/.test(groups[i].replace(/\D/g, ''))) p = null;
          if (p) { best = j; bestNum = p; }
        }
        if (best >= 0) { out.push('+91 ' + bestNum); i = best + 1; } else i++;
      }
    }
    return out;
  }
  function extract(text, o) {
    o = o || {};
    var items = [], m, kind = o.kind || 'emails', sum = 0;
    if (kind === 'emails') {
      RE_EMAIL.lastIndex = 0;
      while ((m = RE_EMAIL.exec(text))) items.push(m[0]);
    } else if (kind === 'urls') {
      RE_URL.lastIndex = 0;
      while ((m = RE_URL.exec(text))) { var u = cleanUrl(m[0]); if (/[a-z0-9]\.[a-z]/i.test(u)) items.push(u); }
    } else if (kind === 'phones') items = phones(text);
    else if (kind === 'tags') {
      RE_TAG.lastIndex = 0;
      while ((m = RE_TAG.exec(text))) { if (RE_HASLETTER.test(m[2])) items.push('#' + m[2]); if (!m[0].length) RE_TAG.lastIndex++; }
    } else if (kind === 'numbers') {
      RE_NUMX.lastIndex = 0;
      while ((m = RE_NUMX.exec(text))) items.push(m[0].replace('−', '-'));
    }
    var total = items.length;
    if (o.unique !== false) {
      var seen = Object.create(null);
      items = items.filter(function (x) {
        var k = kind === 'emails' || kind === 'tags' || kind === 'urls' ? nfc(x).toLowerCase() : kind === 'numbers' ? westDigits(x) : x;
        if (kind === 'urls') k = k.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        if (seen[k]) return false;
        seen[k] = 1; return true;
      });
    }
    if (kind === 'numbers') items.forEach(function (x) { var v = parseFloat(westDigits(x).replace(/,/g, '')); if (isFinite(v)) sum += v; });
    return { items: items, n: items.length, total: total, sum: kind === 'numbers' ? Math.round(sum * 1e6) / 1e6 : null };
  }

  /* ---------------- word frequency ---------------- */
  var STOP = set(
    'the a an and or but if of to in on at by for with from as is am are was were be been being it its this that these those there here ' +
    'i me my we our us you your he him his she her they them their what which who whom will would shall should can could may might must ' +
    'do does did has have had not no so very too also than then all any some such into about up out over only just more most each both ' +
    'how when where why because while after before again let one s t ' +
    'का के की को में से है हैं था थे थी थीं और या पर ने भी तो ही यह वह ये वे इस उस इन उन एक कि जो कर हो होता होती होते हुआ हुई हुए लिए साथ तक ' +
    'अपना अपने अपनी मैं हम आप तुम नहीं न जा रहा रही रहे गया गई गए अब जब तब कुछ सब हर बहुत क्या क्यों कैसे कौन किसी किस लेकिन तथा एवं व ' +
    'आणि आहे आहेत होते होता होती हे ही हा ते ती तो या पण मध्ये चा ची चे च्या ला ना नाही मी आम्ही तुम्ही त्या साठी असे ' +
    'এবং ও এই সেই যে না করে হয় আর থেকে জন্য তার এর ছিল আছে কিন্তু একটি একটা আমি আমরা তুমি আপনি সে তারা কি কী হবে মধ্যে সব খুব বা যা ' +
    'અને છે હતું હતી હતા તે આ એ માં પણ ના ની નો નું ને થી એક હું અમે તમે કે જે પર માટે સાથે નથી ' +
    'ਅਤੇ ਹੈ ਹਨ ਸੀ ਦੇ ਦੀ ਦਾ ਦੀਆਂ ਨੂੰ ਵਿੱਚ ਇਹ ਉਹ ਤੋਂ ਨੇ ਵੀ ਇੱਕ ਕਿ ਜੋ ਮੈਂ ਅਸੀਂ ਤੁਸੀਂ ਲਈ ਨਾਲ ਨਹੀਂ ਤਾਂ ਹੀ ਕੇ ਜਾਂ ' +
    'ଓ ଏବଂ ଏହି ସେହି ଯେ ନାହିଁ କରି ହୁଏ ଆଉ ପାଇଁ ତାର ଏକ ମୁଁ ଆମେ ତୁମେ ସେ କି ଥିଲା ଅଛି ସହ ବା ' +
    'மற்றும் ஒரு இந்த அந்த என்று இது அது நான் நாம் நாங்கள் நீங்கள் அவர் அவர்கள் உள்ள மிகவும் ஆனால் அல்லது என் தான் ' +
    'మరియు ఒక ఈ ఆ అని ఇది అది నేను మేము మనం మీరు అతను ఆమె వారు కూడా చాలా కానీ లేదా ఉంది నా మా ' +
    'ಮತ್ತು ಒಂದು ಈ ಆ ಎಂದು ಇದು ಅದು ನಾನು ನಾವು ನೀವು ಅವರು ಹಾಗೂ ತುಂಬಾ ಆದರೆ ಅಥವಾ ಇದೆ ನನ್ನ ನಮ್ಮ ಸಹ ಕೂಡ ' +
    'ഒരു ഈ ആ ഇത് അത് ഞാൻ ഞങ്ങൾ നമ്മൾ നിങ്ങൾ അവൻ അവൾ അവർ വളരെ പക്ഷേ ഉണ്ട് ആണ് എന്റെ നമ്മുടെ കൂടി ' +
    'کا کے کی کو میں سے ہے ہیں تھا تھے تھی اور یا پر نے بھی تو ہی یہ وہ اس ان ایک کہ جو کر ہو لیے ساتھ تک اپنا اپنے اپنی ہم آپ تم نہیں گیا گئی گئے کیا بہت لیکن جب اب ہر');
  function wordList(text, locale) {
    var out = [], sg = segmenter(locale, 'word');
    if (sg) {
      var it = sg.segment(text)[Symbol.iterator](), r;
      while (!(r = it.next()).done) if (r.value.isWordLike) out.push(r.value.segment);
      return out;
    }
    return text.match(rx('[\\p{L}\\p{M}\\p{N}_]+', 'gu', /[A-Za-z0-9_À-ɏऀ-෿؀-ۿݐ-ݿ]+/g)) || [];
  }
  var RE_ONLYNUM = rx('^[\\p{N}.,:\\-/]+$', 'u', /^[0-9.,:\-\/]+$/);
  function freq(text, o) {
    o = o || {};
    var words = wordList(text, o.locale), map = Object.create(null), total = 0, uniq = 0, rows = [];
    for (var i = 0; i < words.length; i++) {
      var w = nfc(words[i]).toLowerCase().replace(/['’]s$/, '');
      if (!w) continue;
      total++;
      if (o.skipNum !== false && RE_ONLYNUM.test(w)) continue;
      if (o.skipStop && STOP[w]) continue;
      if (map[w]) map[w][1]++;
      else { map[w] = [w, 1, i]; uniq++; rows.push(map[w]); }
    }
    rows.sort(function (a, b) { return b[1] - a[1] || a[2] - b[2]; });
    var top = Math.max(1, Math.min(1000, o.top || 50));
    return { rows: rows.slice(0, top).map(function (r) { return [r[0], r[1]]; }), total: total, unique: uniq, shown: Math.min(top, rows.length), all: rows.length };
  }

  /* ---------------- counts ---------------- */
  function stats(text, o) {
    o = o || {};
    var lines = text === '' ? 0 : text.split('\n').length;
    var words = 0, m, re = /\S+/g;
    while ((m = re.exec(text))) if (RE_HASWORD.test(m[0])) words++;
    var noBreaks = text.replace(/\r?\n/g, ''), chars;
    if (noBreaks.length <= 400000) chars = graphemeCount(noBreaks, o.locale);
    else chars = Array.from(noBreaks).length - count(noBreaks, rx('\\p{M}', 'gu', /[\u0300-\u036Fऀ-ःऺ-ॏ॑-ॗॢॣ]/g));
    return { chars: chars, words: words, lines: lines };
  }

  /* ---------------- compare two texts (Myers O(ND) diff, linear space, with a time limit) ---------------- */
  /* A, B: integer token ids. Returns runs [type, length, type, length …] (0 same, -1 removed, 1 added).
     When the time limit is reached, the part still open is shown as "removed + added" (correct, just not the
     smallest possible) and approx is true. */
  function diffSeq(A, B, deadline) {
    var out = [], approx = false;
    function push(type, len) {
      if (!len) return;
      var L = out.length;
      if (L && out[L - 2] === type) out[L - 1] += len; else out.push(type, len);
    }
    function rec(a0, a1, b0, b1) {
      var p = 0, s = 0;
      while (a0 + p < a1 && b0 + p < b1 && A[a0 + p] === B[b0 + p]) p++;
      while (a1 - s > a0 + p && b1 - s > b0 + p && A[a1 - s - 1] === B[b1 - s - 1]) s++;
      push(0, p);
      var x0 = a0 + p, x1 = a1 - s, y0 = b0 + p, y1 = b1 - s;
      if (x0 === x1) push(1, y1 - y0);
      else if (y0 === y1) push(-1, x1 - x0);
      else bisect(x0, x1, y0, y1);
      push(0, s);
    }
    function bisect(a0, a1, b0, b1) {
      var N = a1 - a0, M = b1 - b0, maxD = Math.ceil((N + M) / 2), off = maxD, len = 2 * maxD + 2;
      var v1 = new Int32Array(len), v2 = new Int32Array(len), i;
      for (i = 0; i < len; i++) { v1[i] = -1; v2[i] = -1; }
      v1[off + 1] = 0; v2[off + 1] = 0;
      var delta = N - M, front = (delta & 1) !== 0, k1s = 0, k1e = 0, k2s = 0, k2e = 0, timedOut = false;
      for (var d = 0; d < maxD; d++) {
        if (Date.now() > deadline) { timedOut = true; break; }
        for (var k1 = -d + k1s; k1 <= d - k1e; k1 += 2) {
          var i1 = off + k1, x1 = (k1 === -d || (k1 !== d && v1[i1 - 1] < v1[i1 + 1])) ? v1[i1 + 1] : v1[i1 - 1] + 1, y1 = x1 - k1;
          while (x1 < N && y1 < M && A[a0 + x1] === B[b0 + y1]) { x1++; y1++; }
          v1[i1] = x1;
          if (x1 > N) k1e += 2;
          else if (y1 > M) k1s += 2;
          else if (front) {
            var i2 = off + delta - k1;
            if (i2 >= 0 && i2 < len && v2[i2] !== -1 && x1 >= N - v2[i2]) { rec(a0, a0 + x1, b0, b0 + y1); rec(a0 + x1, a1, b0 + y1, b1); return; }
          }
        }
        for (var k2 = -d + k2s; k2 <= d - k2e; k2 += 2) {
          var j2 = off + k2, x2 = (k2 === -d || (k2 !== d && v2[j2 - 1] < v2[j2 + 1])) ? v2[j2 + 1] : v2[j2 - 1] + 1, y2 = x2 - k2;
          while (x2 < N && y2 < M && A[a1 - x2 - 1] === B[b1 - y2 - 1]) { x2++; y2++; }
          v2[j2] = x2;
          if (x2 > N) k2e += 2;
          else if (y2 > M) k2s += 2;
          else if (!front) {
            var j1 = off + delta - k2;
            if (j1 >= 0 && j1 < len && v1[j1] !== -1) {
              var xa = v1[j1], ya = off + xa - j1;
              if (xa >= N - x2) { rec(a0, a0 + xa, b0, b0 + ya); rec(a0 + xa, a1, b0 + ya, b1); return; }
            }
          }
        }
      }
      if (timedOut) approx = true;
      push(-1, N); push(1, M);
    }
    rec(0, A.length, 0, B.length);
    return { runs: out, approx: approx };
  }
  /* tokens for the word / letter comparison: never cut a letter from its matra (कि stays one piece) */
  var RE_TOK_W = rx('[\\p{L}\\p{M}\\p{N}_\\u200C\\u200D]+|[^\\S\\n]+|\\n|\\P{M}\\p{M}*', 'gu', /[A-Za-z0-9_À-ɏऀ-෿؀-ۿݐ-ݿ\u200C\u200D]+|[^\S\n]+|\n|[\uD800-\uDBFF][\uDC00-\uDFFF]|[^]/g);
  var RE_TOK_L = rx('\\P{M}\\p{M}*', 'gu', /[\uD800-\uDBFF][\uDC00-\uDFFF]|[^]/g);
  function tokens(text, by, locale) {
    if (by === 'letter') return graphemes(text, locale);
    var sg = segmenter(locale, 'word');
    if (sg) {
      var out = [], it = sg.segment(text)[Symbol.iterator](), r;
      while (!(r = it.next()).done) {
        var s = r.value.segment;
        if (s.indexOf('\n') >= 0 && s !== '\n') s.split(/(\n)/).forEach(function (p) { if (p) out.push(p); });
        else out.push(s);
      }
      return out;
    }
    return text.match(by === 'letter' ? RE_TOK_L : RE_TOK_W) || [];
  }
  /* A same piece made only of spaces or punctuation between two changes is folded into the change, so
     "big red" -> "small blue" reads as one change, not two (based on the semantic clean-up of Neil Fraser's
     diff-match-patch). Same words always stay visible, and a piece with a line break is never folded.
     Equal ops are [0, newText, oldText] (they can differ when case or spaces are ignored). */
  function cleanup(ops) {
    var eqs = [], lastEq = null, p = 0, l1i = 0, l1d = 0, l2i = 0, l2d = 0;
    while (p < ops.length) {
      if (ops[p][0] === 0) { eqs.push(p); l1i = l2i; l1d = l2d; l2i = 0; l2d = 0; lastEq = ops[p]; }
      else {
        if (ops[p][0] === 1) l2i += ops[p][1].length; else l2d += ops[p][1].length;
        var e = lastEq ? lastEq[1] : '';
        if (e && e.indexOf('\n') < 0 && !RE_HASWORD.test(e) && e.length <= Math.max(l1i, l1d) && e.length <= Math.max(l2i, l2d)) {
          var at = eqs[eqs.length - 1];
          ops.splice(at, 1, [-1, lastEq.length > 2 ? lastEq[2] : e], [1, e]);
          eqs.pop(); if (eqs.length) eqs.pop();
          p = eqs.length ? eqs[eqs.length - 1] : -1;
          l1i = l1d = l2i = l2d = 0; lastEq = null;
        }
      }
      p++;
    }
    return mergeOps(ops);
  }
  function mergeOps(ops) {
    var out = [], del = '', ins = '';
    function flush() { if (del) out.push([-1, del]); if (ins) out.push([1, ins]); del = ins = ''; }
    ops.forEach(function (o) {
      if (o[0] === -1) del += o[1];
      else if (o[0] === 1) ins += o[1];
      else if (o[1] || o[2]) {
        flush();
        var old = o.length > 2 ? o[2] : o[1], L = out[out.length - 1];
        if (L && L[0] === 0) { L[1] += o[1]; L[2] += old; } else out.push([0, o[1], old]);
      }
    });
    flush();
    return out;
  }
  var MAX_LINES = 50000, MAX_TOK = 40000;
  function countUnits(list, by) {
    var n = 0;
    for (var i = 0; i < list.length; i++) if (by === 'letter' ? /\S/.test(list[i]) : RE_HASWORD.test(list[i])) n++;
    return n;
  }
  /* o = { by: 'line'|'word'|'letter', icase, space, locale, ms } */
  function diff(a, b, o) {
    o = o || {};
    var t0 = Date.now(), deadline = t0 + (o.ms || 4000), by = o.by || 'line';
    a = String(a).replace(/\r\n?/g, '\n').replace(/\n$/, '');
    b = String(b).replace(/\r\n?/g, '\n').replace(/\n$/, '');
    var A = a === '' ? [] : a.split('\n'), B = b === '' ? [] : b.split('\n');
    if (A.length > MAX_LINES || B.length > MAX_LINES || a.length + b.length > 6e6) return { err: 'big', max: MAX_LINES };
    var key = function (s) { if (o.space) s = s.replace(/\s+/g, ' ').replace(/^ | $/g, ''); if (o.icase) s = s.toLowerCase(); return nfc(s); };
    var map = new Map(), next = 0;
    var ids = function (list, norm) {
      var r = new Int32Array(list.length);
      for (var i = 0; i < list.length; i++) { var k = norm(list[i]), v = map.get(k); if (v === undefined) { v = next++; map.set(k, v); } r[i] = v; }
      return r;
    };
    var res = diffSeq(ids(A, key), ids(B, key), deadline), runs = res.runs;
    var blocks = [], ai = 0, bi = 0, sum = { add: 0, del: 0, same: 0, uadd: 0, udel: 0, by: by, approx: res.approx, skipped: false };
    for (var r = 0; r < runs.length; r += 2) {
      if (runs[r] === 0) { blocks.push({ t: 'eq', a: ai, b: bi, n: runs[r + 1] }); ai += runs[r + 1]; bi += runs[r + 1]; sum.same += runs[r + 1]; continue; }
      var blk = { t: 'ch', a: ai, b: bi, an: 0, bn: 0, ops: null };
      while (r < runs.length && runs[r] !== 0) { if (runs[r] === -1) blk.an += runs[r + 1]; else blk.bn += runs[r + 1]; r += 2; }
      r -= 2;
      ai += blk.an; bi += blk.bn; sum.del += blk.an; sum.add += blk.bn;
      blocks.push(blk);
    }
    if (by !== 'line') {
      var tkey = function (s) {
        if (o.space && !/\S/.test(s)) return ' ';
        if (o.icase) s = s.toLowerCase();
        return nfc(s);
      };
      blocks.forEach(function (blk) {
        if (blk.t !== 'ch') return;
        var ta = A.slice(blk.a, blk.a + blk.an).join('\n'), tb = B.slice(blk.b, blk.b + blk.bn).join('\n');
        var xa = blk.an ? tokens(ta, by, o.locale) : [], xb = blk.bn ? tokens(tb, by, o.locale) : [];
        if (!blk.an || !blk.bn) {                      // whole lines added or removed: no word-by-word view needed
          sum.udel += countUnits(xa, by); sum.uadd += countUnits(xb, by);
          return;
        }
        if (xa.length > MAX_TOK || xb.length > MAX_TOK || Date.now() > deadline) {
          sum.skipped = true; sum.udel += countUnits(xa, by); sum.uadd += countUnits(xb, by);
          return;
        }
        var tr = diffSeq(ids(xa, tkey), ids(xb, tkey), deadline), ops = [], ia = 0, ib = 0;
        if (tr.approx) sum.approx = true;
        for (var q = 0; q < tr.runs.length; q += 2) {
          var type = tr.runs[q], n = tr.runs[q + 1], part;
          if (type === 1) { part = xb.slice(ib, ib + n); ib += n; sum.uadd += countUnits(part, by); ops.push([1, part.join('')]); }
          else if (type === -1) { part = xa.slice(ia, ia + n); ia += n; sum.udel += countUnits(part, by); ops.push([-1, part.join('')]); }
          else { ops.push([0, xb.slice(ib, ib + n).join(''), xa.slice(ia, ia + n).join('')]); ia += n; ib += n; }
        }
        blk.ops = cleanup(ops);
      });
    }
    return { blocks: blocks, sum: sum, nA: A.length, nB: B.length, ms: Date.now() - t0 };
  }

  /* ---------------- exports ---------------- */
  function caseOp(fn) {
    return function (text, o) {
      var out = fn(text, o), n = 0;
      if (out !== text) { if (out.length === text.length) { for (var i = 0; i < out.length; i++) if (out[i] !== text[i]) n++; } else n = 1; }
      return { text: out, n: n };
    };
  }
  var TT = {
    hasSegmenter: HAS_SEG, unesc: unesc, graphemes: graphemes, graphemeCount: graphemeCount, risky: risky, firstNumber: firstNumber,
    upper: caseOp(upper), lower: caseOp(lower), title: caseOp(title), sentence: caseOp(sentence), alternate: caseOp(alternate), inverse: caseOp(inverse),
    trimLines: trimLines, collapseSpaces: collapseSpaces, removeEmptyLines: removeEmptyLines, squeezeEmptyLines: squeezeEmptyLines,
    joinBroken: joinBroken, removeBreaks: removeBreaks, stripHtml: stripHtml, removeEmojis: removeEmojis, removeNumbers: removeNumbers,
    removePunct: removePunct, curlyQuotes: curlyQuotes, straightQuotes: straightQuotes, tabsToSpaces: tabsToSpaces, spacesToTabs: spacesToTabs,
    quickClean: quickClean, dedupe: dedupe, sortLines: sortLines, reverseLines: reverseLines, shuffleLines: shuffleLines,
    numberLines: numberLines, unnumberLines: unnumberLines, affixLines: affixLines, filterLines: filterLines,
    splitText: splitText, joinText: joinText, buildRe: buildRe, findAll: findAll, replaceAll: replaceAll,
    extract: extract, freq: freq, stats: stats, diff: diff, diffSeq: diffSeq
  };
  /* inside a Web Worker: answer {id, op, args} messages */
  TT.serve = function (scope) {
    scope.onmessage = function (e) {
      var m = e.data || {}, r;
      try { r = TT[m.op] && /^(diff|findAll|replaceAll)$/.test(m.op) ? TT[m.op].apply(null, m.args || []) : { err: 'op' }; }
      catch (err) { r = { err: 'fail', msg: String(err && err.message || err).slice(0, 200) }; }
      scope.postMessage({ id: m.id, r: r });
    };
  };
  return TT;
}
window.TT = TT_FACTORY();
