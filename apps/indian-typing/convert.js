/* Indian Typing: script converter (window.ISCRIPT). Shows text of one Brahmic script in another script, or in
   simple Roman letters, so a reader can sound it out. It is reading help, not translation.
   Needs translit.js (ITYPE_CORE).  verify-allow-mixed-scripts */
(function () {
  'use strict';
  var K = window.ITYPE_CORE, SC = K.S, chr = K.chr, cons = K.cons;
  var BLOCKS = { 0x0900: 'deva', 0x0980: 'beng', 0x0A00: 'guru', 0x0A80: 'gujr', 0x0B00: 'orya', 0x0B80: 'taml', 0x0C00: 'telu', 0x0C80: 'knda', 0x0D00: 'mlym' };
  var NORTH = { deva: 1, beng: 1, guru: 1, gujr: 1, orya: 1 };
  var TARGETS = ['deva', 'beng', 'asm', 'guru', 'gujr', 'orya', 'taml', 'telu', 'knda', 'mlym', 'roman', 'keys'];
  var TA_OWN = {}; [0x15, 0x19, 0x1A, 0x1C, 0x1E, 0x1F, 0x23, 0x24, 0x28, 0x29, 0x2A, 0x2E, 0x2F, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x37, 0x38, 0x39].forEach(function (o) { TA_OWN[o] = 1; });
  var CHILLU = { 0x7A: 0x23, 0x7B: 0x28, 0x7C: 0x30, 0x7D: 0x32, 0x7E: 0x33, 0x7F: 0x15 };

  function isCons(o) { return o >= 0x15 && o <= 0x39; }
  function isMatra(o) { return (o >= 0x3E && o <= 0x4C) || o === 0x62 || o === 0x63 || o === 0x57; }
  function isIndep(o) { return (o >= 0x05 && o <= 0x14) || o === 0x60 || o === 0x61; }

  /* text -> units */
  function parse(text) {
    var s = String(text || '').normalize('NFC'), u = [];
    for (var i = 0; i < s.length; i++) {
      var cp = s.charCodeAt(i), blk = cp & ~0x7F, sc = BLOCKS[blk], o = cp - blk;
      if (!sc) { u.push({ t: 'X', s: s[i] }); continue; }
      if (cp === 0x0964 || cp === 0x0965) { u.push({ t: 'X', s: s[i], danda: true }); continue; }
      var x = { sc: sc };
      if (sc === 'beng' && o === 0x70) { x.t = 'C'; x.o = 0x30; }
      else if (sc === 'beng' && o === 0x71) { x.t = 'C'; x.o = 0x35; }
      else if (sc === 'beng' && o === 0x4E) { u.push({ t: 'C', o: 0x24, sc: sc }); x.t = 'VIR'; }
      else if (sc === 'orya' && o === 0x5F) { x.t = 'C'; x.o = 0x2F; }
      else if (sc === 'orya' && o === 0x71) { x.t = 'C'; x.o = 0x35; }
      else if (sc === 'guru' && o === 0x70) { x.t = 'S'; x.o = 0x02; }
      else if (sc === 'guru' && o === 0x71) { x.t = 'GEM'; }
      else if (sc === 'mlym' && CHILLU[o]) { u.push({ t: 'C', o: CHILLU[o], sc: sc }); x.t = 'VIR'; }
      else if (sc === 'mlym' && o === 0x57) { x.t = 'M'; x.o = 0x4C; }
      else if (sc === 'taml' && o === 0x57) { x.t = 'M'; x.o = 0x4C; }
      else if (o === 0x3C) { var p = u[u.length - 1]; if (p && p.t === 'C') { p.nk = true; continue; } x.t = 'X'; x.s = ''; }
      else if (o === 0x4D) x.t = 'VIR';
      else if (o >= 0x01 && o <= 0x03) { x.t = 'S'; x.o = o; }
      else if (isCons(o)) { x.t = 'C'; x.o = o; }
      else if (isMatra(o)) { x.t = 'M'; x.o = o; }
      else if (isIndep(o)) { x.t = 'I'; x.o = o; }
      else if (o >= 0x66 && o <= 0x6F) { x.t = 'D'; x.o = o; }
      else if (o === 0x3D) { x.t = 'S'; x.o = 0x3D; }
      else if (o === 0x50) { x.t = 'X'; x.s = s[i]; }
      else { x.t = 'X'; x.s = s[i]; }
      u.push(x);
    }
    return u;
  }

  function wordEnd(u, i) { var n = u[i]; return !n || n.t === 'X' || n.t === 'D'; }

  /* ---------- to a Brahmic script */
  var NAS = function (o) { return o >= 0x15 && o <= 0x18 ? 0x19 : o >= 0x1A && o <= 0x1D ? 0x1E : o >= 0x1F && o <= 0x22 ? 0x23 : o >= 0x24 && o <= 0x27 ? 0x28 : 0x2E; };
  function toScript(u, tg) {
    var out = '', approx = 0, d = SC[tg], vir = chr(tg, 0x4D), lastV = 'a', lastInd = false, prevC = null;
    function vowelOff(o, srcSc) {
      if (d.north) { if (o === 0x0E) return 0x0F; if (o === 0x12) return 0x13; if (o === 0x46) return 0x47; if (o === 0x4A) return 0x4B; }
      return o;
    }
    function own(o) {                               // is this letter really in the target script, or the nearest one?
      if (tg === 'taml') return TA_OWN[o];
      var c = chr(tg, o); return d.map && d.map[o] ? true : c === String.fromCharCode(d.base + o);
    }
    for (var i = 0; i < u.length; i++) {
      var x = u[i], n = u[i + 1];
      if (x.t === 'C') {
        if (tg === 'guru' && n && n.t === 'VIR' && u[i + 2] && u[i + 2].t === 'C' && !u[i + 2].nk && !x.nk && (u[i + 2].o === x.o || u[i + 2].o === x.o + 1 && /^(15|17|1a|1c|1f|21|24|26|2a|2c)$/.test(x.o.toString(16)))) {
          out += 'ੱ'; i++; continue;                 // पक्का -> ਪੱਕਾ
        }
        var c = cons(tg, x.o, x.nk);
        if (!own(x.o) || (x.nk && !d.nukta && tg !== 'taml')) approx++;
        out += c; prevC = x; lastV = 'a'; lastInd = false;
        if (u[i - 1] && u[i - 1].t === 'GEM') { out = out.slice(0, -c.length) + c + vir + c; }
        if (wordEnd(u, i + 1) && NORTH[x.sc] && d.south) {      // Hindi भारत is said "bhaarat": show the dead last letter
          if (d.chillu && d.chillu[x.o]) out = out.slice(0, -c.length) + d.chillu[x.o];
          else if (d.finalM && x.o === 0x2E) out = out.slice(0, -c.length) + chr(tg, 0x02);
          else out += vir;
        }
      } else if (x.t === 'GEM') {
        continue;
      } else if (x.t === 'VIR') {
        if (tg === 'guru' && n && n.t === 'C' && !(n.o === 0x30 || n.o === 0x39 || n.o === 0x35 || n.o === 0x2F)) continue;
        out += vir;
      } else if (x.t === 'M') {
        var mo = vowelOff(x.o); out += chr(tg, mo); lastV = mo; lastInd = false;
        if (mo === 0x43 && tg === 'taml') approx++;
      } else if (x.t === 'I') {
        var io = vowelOff(x.o); out += chr(tg, io); lastV = io; lastInd = true;
      } else if (x.t === 'S') {
        if (tg === 'taml' && (x.o === 0x02 || x.o === 0x01)) { out += TA_NAS(n); continue; }
        if (tg === 'guru' && (x.o === 0x02 || x.o === 0x01)) {
          var tip = lastInd ? (lastV === 0x05 || lastV === 0x07 || lastV === 0x09) : (lastV === 'a' || lastV === 0x3F || lastV === 0x41 || lastV === 0x42);
          out += tip ? 'ੰ' : 'ਂ'; continue;
        }
        var sc2 = chr(tg, x.o); if (!sc2 && x.o === 0x01) sc2 = chr(tg, 0x02); out += sc2;
      } else if (x.t === 'D') {
        out += chr(tg, x.o);
      } else {
        out += x.danda && d.south ? (x.s === '॥' ? '.' : '.') : x.s;
      }
    }
    function TA_NAS(nx) { return (nx && nx.t === 'C' ? TA_NAS_C(nx.o) : 'ம') + '்'; }
    function TA_NAS_C(o) { return K.S.taml.cons[NAS(o)]; }
    return { text: out.normalize('NFC'), approx: approx };
  }

  /* ---------- to Roman letters */
  var R1 = { 0x15: 'k', 0x16: 'kh', 0x17: 'g', 0x18: 'gh', 0x19: 'ng', 0x1A: 'ch', 0x1B: 'chh', 0x1C: 'j', 0x1D: 'jh', 0x1E: 'ny', 0x1F: 't', 0x20: 'th',
    0x21: 'd', 0x22: 'dh', 0x23: 'n', 0x24: 't', 0x25: 'th', 0x26: 'd', 0x27: 'dh', 0x28: 'n', 0x29: 'n', 0x2A: 'p', 0x2B: 'ph', 0x2C: 'b', 0x2D: 'bh',
    0x2E: 'm', 0x2F: 'y', 0x30: 'r', 0x31: 'r', 0x32: 'l', 0x33: 'l', 0x34: 'zh', 0x35: 'v', 0x36: 'sh', 0x37: 'sh', 0x38: 's', 0x39: 'h' };
  var RK = Object.assign({}, R1, { 0x19: '~N', 0x1B: 'chh', 0x1E: '~n', 0x1F: 'T', 0x20: 'Th', 0x21: 'D', 0x22: 'Dh', 0x23: 'N', 0x31: 'rr', 0x33: 'L', 0x37: 'Sh' });
  var N1 = { 0x15: 'q', 0x16: 'kh', 0x17: 'gh', 0x1C: 'z', 0x2B: 'f', 0x21: 'r', 0x22: 'rh', 0x2F: 'y' };
  var NK = { 0x15: 'q', 0x16: 'K', 0x17: 'G', 0x1C: 'z', 0x2B: 'f', 0x21: '.D', 0x22: '.Dh', 0x2F: 'y' };
  var V1 = { 0x05: 'a', 0x06: 'aa', 0x07: 'i', 0x08: 'ee', 0x09: 'u', 0x0A: 'oo', 0x0B: 'ri', 0x60: 'ree', 0x0C: 'lri', 0x0D: 'e', 0x0E: 'e', 0x0F: 'e', 0x10: 'ai', 0x11: 'o', 0x12: 'o', 0x13: 'o', 0x14: 'au', 0x61: 'lri',
    0x3E: 'aa', 0x3F: 'i', 0x40: 'ee', 0x41: 'u', 0x42: 'oo', 0x43: 'ri', 0x44: 'ree', 0x62: 'lri', 0x45: 'e', 0x46: 'e', 0x47: 'e', 0x48: 'ai', 0x49: 'o', 0x4A: 'o', 0x4B: 'o', 0x4C: 'au' };
  var VK = Object.assign({}, V1, { 0x08: 'ii', 0x0A: 'uu', 0x0B: 'R', 0x60: 'RRI', 0x40: 'ii', 0x42: 'uu', 0x43: 'R', 0x44: 'RRI', 0x11: 'aw', 0x49: 'aw' });
  function toRoman(u, keys) {
    var out = '', C = keys ? RK : R1, NN = keys ? NK : N1, V = keys ? VK : V1;
    function vow(o, sc) {
      if (keys && !NORTH[sc]) { if (o === 0x0F || o === 0x47) return 'E'; if (o === 0x13 || o === 0x4B) return 'O'; }
      return V[o] || '';
    }
    for (var i = 0; i < u.length; i++) {
      var x = u[i], n = u[i + 1];
      if (x.t === 'C') {
        var c = (x.nk && NN[x.o]) || C[x.o] || '';
        if (u[i - 1] && u[i - 1].t === 'GEM') c = c.length > 1 && /h$/.test(c) && c !== 'sh' ? c.slice(0, -1) + c : c + c;
        out += c;
        if (n && (n.t === 'M' || n.t === 'VIR')) continue;
        if (wordEnd(u, i + 1) && NORTH[x.sc]) continue;          // भारत -> bhaarat
        out += 'a';
      } else if (x.t === 'M') out += vow(x.o, x.sc);
      else if (x.t === 'I') out += vow(x.o, x.sc);
      else if (x.t === 'VIR') { if (keys && NORTH[x.sc] && wordEnd(u, i + 1)) out += '^'; }
      else if (x.t === 'S') {
        if (x.o === 0x03) out += keys ? 'H' : 'h';
        else if (x.o === 0x3D) out += keys ? '.a' : '';
        else if (keys) out += x.o === 0x01 ? '~' : 'M';
        else out += (n && n.t === 'C' && n.o >= 0x2A && n.o <= 0x2E) || (!NORTH[x.sc] && wordEnd(u, i + 1)) ? 'm' : 'n';
      } else if (x.t === 'D') out += String(x.o - 0x66);
      else if (x.t === 'X') out += x.danda ? '.' : x.s;
    }
    return out;
  }

  function convertEx(text, target) {
    var u = parse(text);
    if (target === 'roman' || target === 'keys') return { text: toRoman(u, target === 'keys'), approx: 0 };
    if (!SC[target] || SC[target].arab) target = 'deva';
    return toScript(u, target);
  }
  function detect(text) {
    var cnt = {}, best = null;
    String(text || '').replace(/[ऀ-ൿ]/g, function (c) { var s = BLOCKS[c.charCodeAt(0) & ~0x7F]; cnt[s] = (cnt[s] || 0) + 1; return c; });
    Object.keys(cnt).forEach(function (s) { if (!best || cnt[s] > cnt[best]) best = s; });
    return best;
  }
  window.ISCRIPT = { TARGETS: TARGETS, convert: function (t, g) { return convertEx(t, g).text; }, convertEx: convertEx, detect: detect };
})();
