/* Small barcode encoders written from the public specifications (GS1 General Specifications for EAN-13,
 * ISO/IEC 15417 for Code 128). No library, works offline.
 *   BARCODE.ean13(digits)  -> { ok, code, check, bits, guards, groups, error }   bits = 95 modules, no quiet zone
 *   BARCODE.code128(text)  -> { ok, text, values, check, bits, error }           bits = 11*n + 13 modules
 *   BARCODE.ean13Check(12digits) -> check digit 0-9
 *   BARCODE.toBars(bits) -> [{x, w}] runs of dark modules
 */
(function (root) {
  'use strict';

  /* ---------------- EAN-13 ---------------- */
  var L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  var PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  function G(d) { return R(d).split('').reverse().join(''); }               // G = R mirrored (L inverted, then reversed)
  function R(d) { return L[d].replace(/[01]/g, function (c) { return c === '0' ? '1' : '0'; }); }   // R = L inverted

  function ean13Check(d12) {
    var s = 0;
    for (var i = 0; i < 12; i++) s += (+d12.charAt(i)) * (i % 2 === 0 ? 1 : 3);
    return (10 - (s % 10)) % 10;
  }

  function ean13(input) {
    var d = String(input == null ? '' : input).replace(/[\s-]/g, '');
    var r = { ok: false, code: '', check: -1, bits: '', guards: [], groups: [], error: '' };
    if (!d) { r.error = 'empty'; return r; }
    if (!/^\d+$/.test(d)) { r.error = 'digits'; return r; }
    if (d.length !== 12 && d.length !== 13) { r.error = 'length'; return r; }
    var check = ean13Check(d.slice(0, 12));
    if (d.length === 13 && (+d.charAt(12)) !== check) { r.error = 'check'; r.check = check; return r; }
    var code = d.slice(0, 12) + check;
    var par = PARITY[+code.charAt(0)];
    var bits = '101';
    for (var i = 1; i <= 6; i++) bits += par.charAt(i - 1) === 'L' ? L[+code.charAt(i)] : G(+code.charAt(i));
    bits += '01010';
    for (var j = 7; j <= 12; j++) bits += R(+code.charAt(j));
    bits += '101';
    r.ok = true; r.code = code; r.check = check; r.bits = bits;
    r.guards = [[0, 3], [45, 50], [92, 95]];                       // taller bars (module index ranges)
    r.groups = [code.charAt(0), code.slice(1, 7), code.slice(7)];  // human-readable: 8 901234 567890
    return r;
  }

  /* ---------------- Code 128 ---------------- */
  var C128 = ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232', '2331112'];
  var START_B = 104, START_C = 105, CODE_B = 100, CODE_C = 99, STOP = 106;

  function digitsAhead(s, i) { var n = 0; while (i + n < s.length && s.charCodeAt(i + n) >= 48 && s.charCodeAt(i + n) <= 57) n++; return n; }

  /* subset B for text, subset C for runs of 4+ digits (or an all-digit even-length code) */
  function code128(input) {
    var s = String(input == null ? '' : input);
    var r = { ok: false, text: s, values: [], check: -1, bits: '', error: '' };
    if (!s.length) { r.error = 'empty'; return r; }
    if (s.length > 48) { r.error = 'long'; return r; }
    for (var k = 0; k < s.length; k++) { var cc = s.charCodeAt(k); if (cc < 32 || cc > 126) { r.error = 'chars'; return r; } }
    var vals = [], i = 0, set;
    var lead = digitsAhead(s, 0);
    if (lead >= 4 || (lead === s.length && lead % 2 === 0 && lead >= 2)) { set = 'C'; vals.push(START_C); } else { set = 'B'; vals.push(START_B); }
    while (i < s.length) {
      var run = digitsAhead(s, i);
      if (set === 'B') {
        if (run >= 4 || (run >= 2 && i + run === s.length && run % 2 === 0)) {
          if (run % 2 === 1) { vals.push(s.charCodeAt(i) - 32); i++; }    // odd digit stays in B, then switch
          vals.push(CODE_C); set = 'C';
          continue;
        }
        vals.push(s.charCodeAt(i) - 32); i++;
      } else {
        if (run >= 2) { vals.push(+s.substr(i, 2)); i += 2; }
        else { vals.push(CODE_B); set = 'B'; }
      }
    }
    var sum = vals[0];
    for (var j = 1; j < vals.length; j++) sum += vals[j] * j;
    var check = sum % 103;
    var all = vals.concat([check, STOP]);
    var bits = '';
    for (var m = 0; m < all.length; m++) {
      var p = C128[all[m]];
      for (var q = 0; q < p.length; q++) bits += (q % 2 === 0 ? '1' : '0').repeat(+p.charAt(q));
    }
    r.ok = true; r.values = vals; r.check = check; r.bits = bits;
    return r;
  }

  function toBars(bits) {
    var out = [], i = 0;
    while (i < bits.length) {
      if (bits.charAt(i) === '1') { var j = i; while (j < bits.length && bits.charAt(j) === '1') j++; out.push({ x: i, w: j - i }); i = j; }
      else i++;
    }
    return out;
  }

  root.BARCODE = { ean13: ean13, ean13Check: ean13Check, code128: code128, toBars: toBars, _patterns: C128 };
})(typeof window !== 'undefined' ? window : this);
