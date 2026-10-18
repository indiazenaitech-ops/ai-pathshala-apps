/* Gold & Silver Price Calculator: the maths, with no DOM, exact with BigInt.
   Units:  money in paise · weight in micrograms (µg, 1 g = 10^6 µg) · fineness in 1/100 of a part per thousand
   (916 → 91600, 999 → 99900) · percentages and GST rates in 1/100 % (12% → 1200, 3% → 300).
   A rate is paise per "rate unit" (1 g, 10 g, 1 tola, 1 sovereign or 1 kg), kept with that unit's weight in µg.
   Every amount is rounded to the paisa once, half away from zero, the way a jeweller's bill is written. */
(function () {
  'use strict';
  var UG = 1000000n;                       // µg in 1 gram
  var TOLA = 11663800n;                    // µg in 1 tola = 11.6638 g (180 troy grains)
  /* weight units: [numerator, denominator] in µg, so masha (1/12 tola) and ratti (1/96 tola) stay exact */
  var WUNITS = { g: [UG, 1n], tola: [TOLA, 1n], sov: [8n * UG, 1n], masha: [TOLA, 12n], ratti: [TOLA, 96n], kg: [1000n * UG, 1n], ct: [200000n, 1n] };
  var RUNITS = { '10g': 10n * UG, g: UG, tola: TOLA, sov: 8n * UG, kg: 1000n * UG };
  var FULL = 100000n;                      // fineness 1000 (pure) in fineness units
  var PCT = 10000n;                        // 100 % in percentage units

  /* ------------------------------------------------------------ parsing */
  var DIGIT_ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function latinDigits(s) {
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < DIGIT_ZEROS.length; i++) if (code >= DIGIT_ZEROS[i] && code <= DIGIT_ZEROS[i] + 9) return String(code - DIGIT_ZEROS[i]);
      return c;
    }).replace(/٫/g, '.').replace(/[٬،]/g, ',');
  }
  /* "₹1,34,207.50" → { v: BigInt in 10^-scale units } or { err: 'empty' | 'number' | 'negative' | 'big' } */
  function parseDec(raw, scale, maxInt) {
    var s = latinDigits(raw).trim().replace(/₹|\binr\b|\brs\.?/gi, '').replace(/\/-\s*$/, '').replace(/[\s,_'’]/g, '');
    if (!s) return { err: 'empty' };
    var neg = false;
    if (/^[-−–]/.test(s)) { neg = true; s = s.slice(1); }
    else if (s.charAt(0) === '+') s = s.slice(1);
    var m = /^(\d*)(?:\.(\d*))?$/.exec(s);
    if (!m || (!m[1] && !m[2])) return { err: 'number' };
    var ip = m[1].replace(/^0+/, '') || '0', fp = m[2] || '';
    if (ip.length > maxInt) return { err: 'big' };
    var keep = (fp + '000000000000').slice(0, scale);
    var v = BigInt(ip) * (10n ** BigInt(scale)) + BigInt(keep || '0');
    if (fp.length > scale && fp.charCodeAt(scale) >= 53) v += 1n;     // round half up
    if (v >= 10n ** BigInt(maxInt + scale)) return { err: 'big' };
    if (neg && v > 0n) return { err: 'negative' };
    return { v: v };
  }
  function divRound(n, d) {                // n / d rounded half away from zero (d > 0)
    var neg = n < 0n; if (neg) n = -n;
    var q = (n * 2n + d) / (2n * d);
    return neg ? -q : q;
  }

  /* ------------------------------------------------------------ units and purity */
  /* a typed weight (value × 10^6 in the given unit) → µg */
  function toUg(v6, unit) { var u = WUNITS[unit] || WUNITS.g; return divRound(v6 * u[0], u[1] * UG); }
  /* purity factor used to go from the 999 rate to another fineness, as IBJA publishes its rates:
     916, 750, 585 … = 999 rate × fineness ÷ 1000, and the bullion grades 990+ = 999 rate × fineness ÷ 999
     (so 999 stays 999 and 995 = 999 × 995/999). Returned as [num, den]. */
  function fac(F) { return F >= 99000n ? [F, 99900n] : [F, FULL]; }
  function derive(baseP, F) { var f = fac(F); return divRound(baseP * f[0], f[1]); }           // 999 rate → rate for F
  function toBase(P, F) { var f = fac(F); return F > 0n ? divRound(P * f[1], f[0]) : 0n; }      // rate for F → 999 rate
  function convert(P, Ffrom, Fto, Ufrom, Uto) {    // a rate for (Ffrom, Ufrom) → rate for (Fto, Uto), one rounding
    var a = fac(Ffrom), b = fac(Fto);
    return divRound(P * a[1] * b[0] * Uto, a[0] * b[1] * Ufrom);
  }
  function perGram(P, U) { return divRound(P * UG, U); }

  /* ------------------------------------------------------------ jewellery price
     o = { gw, sw (µg), P (paise per rate unit, for this purity), U (µg in the rate unit), F (fineness),
           mkType: 'pct'|'pg'|'flat', mk (1/100 % of metal value | paise per gram of net weight | paise),
           wstType: 'pct'|'g', wst (1/100 % of net weight | µg), disc (1/100 %, on making + wastage),
           stones, other (paise), mode: 'buy'|'own', jw (GST on making for job work, 1/100 %), inter, round }
     Buying from a jeweller: GST 3% on everything (metal + wastage + making − discount + stones + other).
     Own gold made into jewellery (job work): the customer's gold is not charged; extra gold (wastage) and stones
     carry 3%, making and other charges carry the job-work rate (5%, or 18% if the bill says so). */
  function gstOn(tv, rate, inter) {
    if (inter) return { cg: 0n, sg: 0n, ig: divRound(tv * rate, PCT) };
    var h = divRound(tv * rate, 2n * PCT);
    return { cg: h, sg: h, ig: 0n };
  }
  function price(o) {
    var r = { err: null };
    r.nw = o.gw - (o.sw || 0n);
    if (r.nw < 0n) { r.err = 'stone'; return r; }
    r.mv = divRound(r.nw * o.P, o.U);
    if (o.wstType === 'g') { r.wug = o.wst || 0n; r.wv = divRound(r.wug * o.P, o.U); }
    else { r.wug = divRound(r.nw * (o.wst || 0n), PCT); r.wv = divRound(r.nw * (o.wst || 0n) * o.P, PCT * o.U); }
    if (o.mkType === 'pg') r.mk = divRound(r.nw * (o.mk || 0n), UG);
    else if (o.mkType === 'flat') r.mk = o.mk || 0n;
    else r.mk = divRound(r.mv * (o.mk || 0n), PCT);
    r.dmk = divRound(r.mk * (o.disc || 0n), PCT);
    r.dw = divRound(r.wv * (o.disc || 0n), PCT);
    r.disc = r.dmk + r.dw;
    r.st = o.stones || 0n; r.ot = o.other || 0n;
    r.own = o.mode === 'own';
    if (!r.own) {
      r.tv = r.mv + r.wv + r.mk - r.disc + r.st + r.ot;
      r.g3 = gstOn(r.tv, 300n, !!o.inter);
      r.tvJ = 0n; r.gJ = { cg: 0n, sg: 0n, ig: 0n };
      r.tv3 = r.tv;
    } else {
      r.tv3 = r.wv - r.dw + r.st;                     // extra gold + stones from the jeweller: 3%
      r.tvJ = r.mk - r.dmk + r.ot;                    // labour (job work): 5% or as billed
      r.g3 = gstOn(r.tv3, 300n, !!o.inter);
      r.gJ = gstOn(r.tvJ, o.jw || 500n, !!o.inter);
      r.tv = r.tv3 + r.tvJ;
    }
    r.gst3 = r.g3.cg + r.g3.sg + r.g3.ig;
    r.gstJ = r.gJ.cg + r.gJ.sg + r.gJ.ig;
    r.gst = r.gst3 + r.gstJ;
    r.total = r.tv + r.gst; r.ro = 0n;
    if (o.round) { var rt = divRound(r.total, 100n) * 100n; r.ro = rt - r.total; r.total = rt; }
    r.rateG = perGram(o.P, o.U);                                      // metal rate per gram, this purity
    r.baseG = toBase(r.rateG, o.F);                                   // the matching 999 rate per gram
    r.pureUg = divRound(r.nw * o.F, FULL);                            // pure metal inside
    r.perG = r.nw > 0n ? divRound(r.total * UG, r.nw) : 0n;           // what you pay per gram of net weight
    r.perPure = r.pureUg > 0n ? divRound(r.total * UG, r.pureUg) : 0n;  // per gram of pure metal (buying)
    r.extra = r.total - (r.own ? 0n : r.mv);                          // paid above the metal value
    return r;
  }

  /* ------------------------------------------------------------ old gold exchange
     o = { gw, sw, P, U, F, ded (1/100 %), newAmt (paise or null) } */
  function exchange(o) {
    var r = { err: null };
    r.nw = o.gw - (o.sw || 0n);
    if (r.nw < 0n) { r.err = 'stone'; return r; }
    r.pureUg = divRound(r.nw * o.F, FULL);
    r.gv = divRound(r.nw * o.P, o.U);
    r.dedAmt = divRound(r.gv * (o.ded || 0n), PCT);
    r.value = r.gv - r.dedAmt;
    r.netPureUg = divRound(r.pureUg * (PCT - (o.ded || 0n)), PCT);   // pure metal you are paid for
    r.rateG = perGram(o.P, o.U);
    r.valueG = r.nw > 0n ? divRound(r.value * UG, r.nw) : 0n;
    r.pay = o.newAmt === null || o.newAmt === undefined ? null : o.newAmt - r.value;
    return r;
  }

  /* ------------------------------------------------------------ compare: index list of the cheapest totals */
  function cheapest(totals) {           // totals: array of BigInt or null → indexes of the lowest (ties kept)
    var best = null, idx = [];
    totals.forEach(function (v, i) {
      if (v === null || v === undefined) return;
      if (best === null || v < best) { best = v; idx = [i]; }
      else if (v === best) idx.push(i);
    });
    return idx;
  }

  /* ------------------------------------------------------------ text */
  function groupIN(s) {
    if (s.length <= 3) return s;
    return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
  }
  function money(p, sign) {            // BigInt paise → "₹1,34,207.00"
    var neg = p < 0n; if (neg) p = -p;
    var f = (p % 100n).toString();
    var s = '₹' + groupIN((p / 100n).toString()) + '.' + (f.length < 2 ? '0' : '') + f;
    return neg ? '−' + s : (sign && p > 0n ? '+' + s : s);
  }
  function inputText(p) {              // paise → what goes back into an input: "1,34,207" or "999.50"
    var neg = p < 0n; if (neg) p = -p;
    var f = p % 100n;
    return (neg ? '-' : '') + groupIN((p / 100n).toString()) + (f ? '.' + (f < 10n ? '0' : '') + f.toString() : '');
  }
  function decTxt(v, scale, keep) {    // BigInt with `scale` decimals → "12.5" (trailing zeros dropped, at most `keep` decimals)
    var neg = v < 0n; if (neg) v = -v;
    if (keep !== undefined && keep < scale) { v = divRound(v, 10n ** BigInt(scale - keep)); scale = keep; }
    var d = 10n ** BigInt(scale), ip = (v / d).toString(), fp = (v % d).toString().padStart(scale, '0').replace(/0+$/, '');
    return (neg ? '−' : '') + groupIN(ip) + (fp ? '.' + fp : '');
  }
  function grams(ug) { return decTxt(ug, 6, 3); }          // µg → "9.25"
  function pctTxt(p) { return decTxt(p, 2); }              // 1250 → "12.5"
  function fineTxt(F) { return decTxt(F, 2); }             // 91600 → "916"
  function ratio(a, b) { return b === 0n ? NaN : Number(a * 1000000n / b) / 10000; }   // a / b in %
  function facTxt(F) {                 // "0.916" or "995/999": shown next to a worked-out rate
    if (F >= 99000n) return fineTxt(F) + '/999';
    return decTxt(F, 5);
  }

  window.GS_CALC = {
    UG: UG, TOLA: TOLA, WUNITS: WUNITS, RUNITS: RUNITS, FULL: FULL, PCT: PCT,
    latinDigits: latinDigits, parseDec: parseDec, divRound: divRound, toUg: toUg,
    fac: fac, derive: derive, toBase: toBase, convert: convert, perGram: perGram,
    price: price, exchange: exchange, cheapest: cheapest,
    groupIN: groupIN, money: money, inputText: inputText, decTxt: decTxt, grams: grams, pctTxt: pctTxt, fineTxt: fineTxt,
    facTxt: facTxt, ratio: ratio
  };
})();
