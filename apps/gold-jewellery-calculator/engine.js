/* Gold & Silver Jewellery Price Calculator: the maths, with no DOM.
   All money is rounded to paise line by line (as a jeweller's bill does) and then added up.
   window.GOLD_ENGINE is also used by tools/tests/gold-jewellery-calculator.test.js. */
(function () {
  'use strict';

  var TOLA = 11.664;                         // grams in one tola
  var PURITY = {
    gold: [{ id: '24k', pct: 99.9 }, { id: '22k', pct: 91.6 }, { id: '18k', pct: 75 }, { id: '14k', pct: 58.5 }],
    silver: [{ id: '999', pct: 99.9 }, { id: '925', pct: 92.5 }, { id: '900', pct: 90 }]
  };
  var UNIT_GRAMS = { g: 1, g10: 10, kg: 1000 };   // how many grams one quoted rate covers

  function num(v, d) { var n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v).replace(/[,\s₹]/g, '')); return isFinite(n) ? n : (d || 0); }
  function r2(x) { return Math.round((x + (x >= 0 ? 1e-9 : -1e-9)) * 100) / 100; }
  function r3(x) { return Math.round((x + 1e-9) * 1000) / 1000; }

  /* rate for one gram of pure (100 %) metal, then for the chosen purity */
  function ratePerGram(rate, unit) { return rate / (UNIT_GRAMS[unit] || 10); }
  function rateAtPurity(rate, unit, pct) { return ratePerGram(rate, unit) * pct / 100; }

  /* o = { rate, unit, purity (%), weight (g), mkMode: 'pct'|'gram'|'flat', mk, wastage (%), stones (₹),
           gst (%), mkSep (bool: making billed at mkGst %), mkGst (%), hallmarkOn, hallmark (₹) } */
  function estimate(o) {
    var rpg = rateAtPurity(num(o.rate), o.unit, num(o.purity));
    var w = num(o.weight);
    var metal = r2(rpg * w);
    var wastage = r2(metal * num(o.wastage) / 100);
    var mk = num(o.mk), making;
    if (o.mkMode === 'gram') making = r2(mk * w);
    else if (o.mkMode === 'flat') making = r2(mk);
    else making = r2(metal * mk / 100);
    var stones = r2(num(o.stones));
    var subtotal = r2(metal + wastage + making + stones);
    var gstRate = num(o.gst), mkGstRate = num(o.mkGst);
    var gstMetal, gstMaking;
    if (o.mkSep) { gstMetal = r2((metal + wastage + stones) * gstRate / 100); gstMaking = r2(making * mkGstRate / 100); }
    else { gstMetal = r2(subtotal * gstRate / 100); gstMaking = 0; }
    var gst = r2(gstMetal + gstMaking);
    var hallmark = o.hallmarkOn ? r2(num(o.hallmark)) : 0;
    var total = r2(subtotal + gst + hallmark);
    return { ratePerGram: rpg, pureGrams: r3(w * num(o.purity) / 100), metal: metal, wastage: wastage, making: making, stones: stones,
      subtotal: subtotal, gstMetal: gstMetal, gstMaking: gstMaking, gst: gst, hallmark: hallmark, total: total,
      makingPct: metal > 0 ? making / metal * 100 : 0 };
  }

  /* The shop quoted `quote` for the same piece: what making charge (as % of metal value) is hidden inside it? */
  function impliedMaking(o, quote) {
    var e = estimate(o), q = num(quote);
    if (!(q > 0) || !(e.metal > 0)) return null;
    var base = e.metal + e.wastage + e.stones, g = num(o.gst) / 100, mg = num(o.mkGst) / 100, making;
    if (o.mkSep) making = (q - e.hallmark - base * (1 + g)) / (1 + mg);
    else making = (q - e.hallmark) / (1 + g) - base;
    return { making: r2(making), pct: making / e.metal * 100, diff: r2(q - e.total), estimate: e.total };
  }

  /* Old gold given in exchange: metal value at today's rate minus the shop's deduction (melting / purity loss). */
  function oldGold(rate, unit, purity, weight, deductionPct) {
    var value = r2(rateAtPurity(num(rate), unit, num(purity)) * num(weight));
    var ded = r2(value * num(deductionPct) / 100);
    return { value: value, deduction: ded, credit: r2(value - ded) };
  }

  /* Resale: shops pay for the metal only, minus a deduction, never for making or stones. */
  function resale(metalValue, deductionPct) {
    var ded = r2(num(metalValue) * num(deductionPct) / 100);
    return { deduction: ded, value: r2(num(metalValue) - ded) };
  }

  function pureGrams(weight, purityPct) { return r3(num(weight) * num(purityPct) / 100); }
  function tolaToGrams(tola) { return r3(num(tola) * TOLA); }
  function gramsToTola(g) { return r3(num(g) / TOLA); }

  /* ---------------- amount in words (English and Hindi, Indian system) */
  var EN1 = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
    'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var EN10 = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  var HI = ('शून्य एक दो तीन चार पाँच छह सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस ' +
    'बीस इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस उनतीस तीस इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस ' +
    'चालीस इकतालीस बयालीस तैंतालीस चवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास पचास इक्यावन बावन तिरपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ ' +
    'साठ इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उन्यासी ' +
    'अस्सी इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे इक्यानबे बानबे तिरानबे चौरानबे पंचानबे छियानबे सत्तानबे अट्ठानबे निन्यानबे').split(' ');
  var W = {
    en: { w99: function (n) { return n < 20 ? EN1[n] : EN10[Math.floor(n / 10)] + (n % 10 ? '-' + EN1[n % 10] : ''); }, zero: 'Zero', hundred: 'Hundred', thousand: 'Thousand', lakh: 'Lakh', crore: 'Crore' },
    hi: { w99: function (n) { return HI[n]; }, zero: 'शून्य', hundred: 'सौ', thousand: 'हज़ार', lakh: 'लाख', crore: 'करोड़' }
  };
  function intWords(n, L) {
    if (n === 0) return L.zero;
    var p = [], crore = Math.floor(n / 10000000), rem = n % 10000000;
    if (crore) p.push(intWords(crore, L) + ' ' + L.crore);
    var lakh = Math.floor(rem / 100000); rem %= 100000;
    if (lakh) p.push(L.w99(lakh) + ' ' + L.lakh);
    var th = Math.floor(rem / 1000); rem %= 1000;
    if (th) p.push(L.w99(th) + ' ' + L.thousand);
    var h = Math.floor(rem / 100); rem %= 100;
    if (h) p.push(L.w99(h) + ' ' + L.hundred);
    if (rem) p.push(L.w99(rem));
    return p.join(' ');
  }
  function words(amount, lang) {
    var p = Math.round(Math.abs(num(amount)) * 100), r = Math.floor(p / 100), f = p % 100;
    if (r > 999999999999999) return '';
    if (lang === 'hi') return intWords(r, W.hi) + ' रुपये' + (f ? ' और ' + W.hi.w99(f) + ' पैसे' : '') + ' मात्र';
    return 'Rupees ' + intWords(r, W.en) + (f ? ' and ' + W.en.w99(f) + ' Paise' : '') + ' Only';
  }

  window.GOLD_ENGINE = { TOLA: TOLA, PURITY: PURITY, UNIT_GRAMS: UNIT_GRAMS, num: num, r2: r2, r3: r3, ratePerGram: ratePerGram, rateAtPurity: rateAtPurity,
    estimate: estimate, impliedMaking: impliedMaking, oldGold: oldGold, resale: resale, pureGrams: pureGrams, tolaToGrams: tolaToGrams, gramsToTola: gramsToTola, words: words };
})();
