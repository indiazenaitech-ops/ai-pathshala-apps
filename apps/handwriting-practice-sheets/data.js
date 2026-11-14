/* Handwriting Practice Sheets: letters of each script, fonts and guide-line styles.
   verify-allow-mixed-scripts  (this file intentionally contains every script)

   Each entry:
     label   string key for the picker (strings.js)
     font    font-family stack: only fonts that are already on phones and computers (no web fonts)
     guide   'four' = four-line (English), 'head' = hanging head-line scripts, 'two' = body lines, 'base' = Urdu base line
     ref     letter measured on this device to place the guide lines for the font that is really used
     rtl     rows run right to left
     v / c   vowels / consonants (or just "all" for English, numbers and Urdu) */
window.HP_DATA = (function () {
  'use strict';
  function L(s) { return s.split(' '); }
  var ROUND = '"Comic Sans MS", "Comic Neue", "Chalkboard SE", "Chalkboard", "Andika", "Noto Sans", "Segoe UI", sans-serif';
  var PLAIN = 'Arial, "Helvetica Neue", Helvetica, "Noto Sans", "Liberation Sans", sans-serif';
  var DEVA = '"Noto Sans Devanagari", "Nirmala UI", "Mangal", "Kohinoor Devanagari", "Devanagari Sangam MN", "Lohit Devanagari", sans-serif';
  var S = {
    en_caps: { label: 'en_caps', latin: true, guide: 'four', all: L('A B C D E F G H I J K L M N O P Q R S T U V W X Y Z') },
    en_small: { label: 'en_small', latin: true, guide: 'four', all: L('a b c d e f g h i j k l m n o p q r s t u v w x y z') },
    nums: { label: 'nums', latin: true, guide: 'four', all: L('0 1 2 3 4 5 6 7 8 9') },
    deva_hi: { label: 'ln_hi', guide: 'head', ref: 'क', font: DEVA,
      v: L('अ आ इ ई उ ऊ ऋ ए ऐ ओ औ अं अः'),
      c: L('क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह क्ष त्र ज्ञ ड़ ढ़') },
    deva_mr: { label: 'ln_mr', guide: 'head', ref: 'क', font: DEVA,
      v: L('अ आ इ ई उ ऊ ऋ ए ऐ ओ औ अं अः ॲ ऑ'),
      c: L('क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह ळ क्ष ज्ञ') },
    beng: { label: 'ln_bn', guide: 'head', ref: 'ক',
      font: '"Noto Sans Bengali", "Nirmala UI", "Vrinda", "Shonar Bangla", "Kohinoor Bangla", "Bangla Sangam MN", "Lohit Bengali", sans-serif',
      v: L('অ আ ই ঈ উ ঊ ঋ এ ঐ ও ঔ'),
      c: L('ক খ গ ঘ ঙ চ ছ জ ঝ ঞ ট ঠ ড ঢ ণ ত থ দ ধ ন প ফ ব ভ ম য র ল শ ষ স হ ড় ঢ় য় ৎ') },
    gujr: { label: 'ln_gu', guide: 'two', ref: 'ક',
      font: '"Noto Sans Gujarati", "Nirmala UI", "Shruti", "Gujarati Sangam MN", "Lohit Gujarati", sans-serif',
      v: L('અ આ ઇ ઈ ઉ ઊ ઋ એ ઐ ઓ ઔ અં અઃ'),
      c: L('ક ખ ગ ઘ ઙ ચ છ જ ઝ ઞ ટ ઠ ડ ઢ ણ ત થ દ ધ ન પ ફ બ ભ મ ય ર લ વ શ ષ સ હ ળ ક્ષ જ્ઞ') },
    guru: { label: 'ln_pa', guide: 'head', ref: 'ਕ',
      font: '"Noto Sans Gurmukhi", "Nirmala UI", "Raavi", "Gurmukhi MN", "Gurmukhi Sangam MN", "Lohit Gurmukhi", sans-serif',
      v: L('ਅ ਆ ਇ ਈ ਉ ਊ ਏ ਐ ਓ ਔ'),
      c: L('ੳ ਅ ੲ ਸ ਹ ਕ ਖ ਗ ਘ ਙ ਚ ਛ ਜ ਝ ਞ ਟ ਠ ਡ ਢ ਣ ਤ ਥ ਦ ਧ ਨ ਪ ਫ ਬ ਭ ਮ ਯ ਰ ਲ ਵ ੜ ਸ਼ ਖ਼ ਗ਼ ਜ਼ ਫ਼ ਲ਼') },
    orya: { label: 'ln_or', guide: 'two', ref: 'କ',
      font: '"Noto Sans Oriya", "Noto Sans Odia", "Nirmala UI", "Kalinga", "Oriya Sangam MN", "Lohit Odia", sans-serif',
      v: L('ଅ ଆ ଇ ଈ ଉ ଊ ଋ ଏ ଐ ଓ ଔ'),
      c: L('କ ଖ ଗ ଘ ଙ ଚ ଛ ଜ ଝ ଞ ଟ ଠ ଡ ଢ ଣ ତ ଥ ଦ ଧ ନ ପ ଫ ବ ଭ ମ ଯ ୟ ର ଲ ଳ ୱ ଶ ଷ ସ ହ କ୍ଷ ଡ଼ ଢ଼') },
    taml: { label: 'ln_ta', guide: 'two', ref: 'க',
      font: '"Noto Sans Tamil", "Nirmala UI", "Latha", "Tamil Sangam MN", "Lohit Tamil", sans-serif',
      v: L('அ ஆ இ ஈ உ ஊ எ ஏ ஐ ஒ ஓ ஔ ஃ'),
      c: L('க ங ச ஞ ட ண த ந ப ம ய ர ல வ ழ ள ற ன ஜ ஷ ஸ ஹ') },
    telu: { label: 'ln_te', guide: 'two', ref: 'ర',
      font: '"Noto Sans Telugu", "Nirmala UI", "Gautami", "Telugu Sangam MN", "Lohit Telugu", sans-serif',
      v: L('అ ఆ ఇ ఈ ఉ ఊ ఋ ఎ ఏ ఐ ఒ ఓ ఔ అం అః'),
      c: L('క ఖ గ ఘ ఙ చ ఛ జ ఝ ఞ ట ఠ డ ఢ ణ త థ ద ధ న ప ఫ బ భ మ య ర ల వ శ ష స హ ళ క్ష ఱ') },
    knda: { label: 'ln_kn', guide: 'two', ref: 'ರ',
      font: '"Noto Sans Kannada", "Nirmala UI", "Tunga", "Kannada Sangam MN", "Lohit Kannada", sans-serif',
      v: L('ಅ ಆ ಇ ಈ ಉ ಊ ಋ ಎ ಏ ಐ ಒ ಓ ಔ ಅಂ ಅಃ'),
      c: L('ಕ ಖ ಗ ಘ ಙ ಚ ಛ ಜ ಝ ಞ ಟ ಠ ಡ ಢ ಣ ತ ಥ ದ ಧ ನ ಪ ಫ ಬ ಭ ಮ ಯ ರ ಲ ವ ಶ ಷ ಸ ಹ ಳ') },
    mlym: { label: 'ln_ml', guide: 'two', ref: 'ക',
      font: '"Noto Sans Malayalam", "Nirmala UI", "Kartika", "Malayalam Sangam MN", "Lohit Malayalam", sans-serif',
      v: L('അ ആ ഇ ഈ ഉ ഊ ഋ എ ഏ ഐ ഒ ഓ ഔ അം അഃ'),
      c: L('ക ഖ ഗ ഘ ങ ച ഛ ജ ഝ ഞ ട ഠ ഡ ഢ ണ ത ഥ ദ ധ ന പ ഫ ബ ഭ മ യ ര ല വ ശ ഷ സ ഹ ള ഴ റ') },
    arab: { label: 'ln_ur', guide: 'base', ref: 'ا', refDown: 'ع', rtl: true,
      font: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", "Noto Naskh Arabic", "Geeza Pro", "Segoe UI", "Arial", serif',
      all: L('ا ب پ ت ٹ ث ج چ ح خ د ڈ ذ ر ڑ ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن ں و ہ ھ ء ی ے') }
  };
  Object.keys(S).forEach(function (k) {
    var s = S[k];
    if (!s.all) {                                   // vowels first, then consonants; a letter in both lists is kept once
      var seen = {};
      s.all = s.v.concat(s.c).filter(function (ch) { if (seen[ch]) return false; seen[ch] = 1; return true; });
    }
  });
  /* Unicode block -> script used for words typed by the user */
  var RANGES = [[0x0900, 0x097F, 'deva_hi'], [0x0980, 0x09FF, 'beng'], [0x0A00, 0x0A7F, 'guru'], [0x0A80, 0x0AFF, 'gujr'], [0x0B00, 0x0B7F, 'orya'],
    [0x0B80, 0x0BFF, 'taml'], [0x0C00, 0x0C7F, 'telu'], [0x0C80, 0x0CFF, 'knda'], [0x0D00, 0x0D7F, 'mlym'],
    [0x0600, 0x06FF, 'arab'], [0x0750, 0x077F, 'arab'], [0xFB50, 0xFDFF, 'arab'], [0xFE70, 0xFEFF, 'arab']];
  /* Pen start points for print letters as taught in most Indian schools (top to bottom, left to right, round letters
     start near 1 o'clock): fraction of the letter's ink box, x from the left, y from the top. The app then moves the
     dot onto the nearest stroke of the font that is really used. */
  var START = {
    A: [.5, 0], B: [0, 0], C: [.9, .2], D: [0, 0], E: [0, 0], F: [0, 0], G: [.9, .2], H: [0, 0], I: [.5, 0], J: [.7, 0], K: [0, 0], L: [0, 0], M: [0, 0],
    N: [0, 0], O: [.62, 0], P: [0, 0], Q: [.62, 0], R: [0, 0], S: [.88, .16], T: [.5, 0], U: [0, 0], V: [0, 0], W: [0, 0], X: [0, 0], Y: [0, 0], Z: [0, 0],
    a: [.82, .22], b: [0, 0], c: [.9, .24], d: [.74, .48], e: [.1, .5], f: [.9, .1], g: [.82, .14], h: [0, 0], i: [.5, .45], j: [.75, .35], k: [0, 0], l: [.5, 0], m: [0, 0],
    n: [0, 0], o: [.62, 0], p: [0, 0], q: [.82, .14], r: [0, 0], s: [.88, .18], t: [.42, 0], u: [0, 0], v: [0, 0], w: [0, 0], x: [0, 0], y: [0, 0], z: [0, 0],
    0: [.55, 0], 1: [.15, .25], 2: [.08, .22], 3: [.08, .12], 4: [.62, 0], 5: [.2, 0], 6: [.8, .05], 7: [0, 0], 8: [.82, .16], 9: [.86, .2]
  };
  return {
    order: ['en_caps', 'en_small', 'nums', 'deva_hi', 'deva_mr', 'beng', 'gujr', 'guru', 'orya', 'taml', 'telu', 'knda', 'mlym', 'arab'],
    scripts: S, ranges: RANGES, start: START, round: ROUND, plain: PLAIN,
    byLang: { en: 'en_caps', hi: 'deva_hi', mr: 'deva_mr', bn: 'beng', gu: 'gujr', pa: 'guru', or: 'orya', ta: 'taml', te: 'telu', kn: 'knda', ml: 'mlym', ur: 'arab' }
  };
})();
