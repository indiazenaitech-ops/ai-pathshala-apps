/* Number grouping and number words (English: Indian + international; Hindi: Indian).
   Works on digit strings of up to 15 digits (all exact in a JS Number). */
window.UCWords = (function () {
  'use strict';
  var EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  /* Hindi words 0–99 (each is unique in Hindi, so a full table is needed) */
  var HI = ('शून्य एक दो तीन चार पाँच छह सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस ' +
    'बीस इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस उनतीस तीस इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस ' +
    'चालीस इकतालीस बयालीस तैंतालीस चवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास पचास इक्यावन बावन तिरपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ ' +
    'साठ इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उन्यासी ' +
    'अस्सी इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे इक्यानबे बानबे तिरानबे चौरानबे पंचानबे छियानबे सत्तानबे अट्ठानबे निन्यानबे').split(' ');

  function clean(s) {
    s = String(s == null ? '' : s).replace(/[\s,_'’]/g, '');
    if (!/^\d{1,15}$/.test(s)) return null;
    s = s.replace(/^0+(?=\d)/, '');
    return s;
  }
  function groupIndian(s) {
    if (s.length <= 3) return s;
    var last3 = s.slice(-3), rest = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  function groupIntl(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function en99(n) { return n < 20 ? EN[n] : EN_TENS[Math.floor(n / 10)] + (n % 10 ? '-' + EN[n % 10] : ''); }
  function en999(n) {
    var h = Math.floor(n / 100), r = n % 100, p = [];
    if (h) p.push(EN[h] + ' hundred');
    if (r) p.push(en99(r));
    return p.join(' ');
  }
  function enIndianN(n) {
    if (n === 0) return 'zero';
    var p = [], crore = Math.floor(n / 1e7), rem = n % 1e7;
    if (crore) p.push(enIndianN(crore) + ' crore');
    var lakh = Math.floor(rem / 1e5); rem %= 1e5;
    if (lakh) p.push(en99(lakh) + ' lakh');
    var th = Math.floor(rem / 1000); rem %= 1000;
    if (th) p.push(en99(th) + ' thousand');
    if (rem) p.push(en999(rem));
    return p.join(' ');
  }
  function enIntlN(n) {
    if (n === 0) return 'zero';
    var scales = [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']], p = [];
    for (var i = 0; i < scales.length; i++) {
      var q = Math.floor(n / scales[i][0]);
      if (q) { p.push(en999(q) + ' ' + scales[i][1]); n -= q * scales[i][0]; }
    }
    if (n) p.push(en999(n));
    return p.join(' ');
  }
  function hi999(n) {
    var h = Math.floor(n / 100), r = n % 100, p = [];
    if (h) p.push(HI[h] + ' सौ');
    if (r) p.push(HI[r]);
    return p.join(' ');
  }
  function hiIndianN(n) {
    if (n === 0) return HI[0];
    var p = [], crore = Math.floor(n / 1e7), rem = n % 1e7;
    if (crore) p.push(hiIndianN(crore) + ' करोड़');
    var lakh = Math.floor(rem / 1e5); rem %= 1e5;
    if (lakh) p.push(HI[lakh] + ' लाख');
    var th = Math.floor(rem / 1000); rem %= 1000;
    if (th) p.push(HI[th] + ' हज़ार');
    if (rem) p.push(hi999(rem));
    return p.join(' ');
  }
  /* Short forms with localized period names: words = {thousand, lakh, crore, million, billion, trillion} */
  function shortIndian(n, w) {
    if (n < 1000) return String(n);
    var p = [], crore = Math.floor(n / 1e7), rem = n % 1e7;
    if (crore) p.push(groupIndian(String(crore)) + ' ' + w.crore);
    var lakh = Math.floor(rem / 1e5); rem %= 1e5;
    if (lakh) p.push(lakh + ' ' + w.lakh);
    var th = Math.floor(rem / 1000); rem %= 1000;
    if (th) p.push(th + ' ' + w.thousand);
    if (rem) p.push(String(rem));
    return p.join(' ');
  }
  function shortIntl(n, w) {
    if (n < 1000) return String(n);
    var scales = [[1e12, w.trillion], [1e9, w.billion], [1e6, w.million], [1e3, w.thousand]], p = [];
    for (var i = 0; i < scales.length; i++) {
      var q = Math.floor(n / scales[i][0]);
      if (q) { p.push(groupIntl(String(q)) + ' ' + scales[i][1]); n -= q * scales[i][0]; }
    }
    if (n) p.push(String(n));
    return p.join(' ');
  }
  return {
    clean: clean, groupIndian: groupIndian, groupIntl: groupIntl,
    enIndian: function (s) { return enIndianN(Number(s)); },
    enIntl: function (s) { return enIntlN(Number(s)); },
    hiIndian: function (s) { return hiIndianN(Number(s)); },
    shortIndian: function (s, w) { return shortIndian(Number(s), w); },
    shortIntl: function (s, w) { return shortIntl(Number(s), w); }
  };
})();
