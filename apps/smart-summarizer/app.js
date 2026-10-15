/* AI Text Summarizer: paste notes, a chapter, an article or a circular (or open a .txt / PDF) and get
   the key points.
   Engine A (always, offline, zero download, all 12 languages): extractive summary with TextRank over
   TF-IDF sentence similarity. Script-aware sentence splitting (. ? ! … । ॥ ۔ ؟ and new lines, with
   abbreviation / initials / decimal handling), language-agnostic tokens (Unicode letters + marks), light
   stemming (English suffixes, prefix stems for agglutinative scripts) and stop-words for every language.
   Engine B (optional): Chrome's built-in Summarizer API (Gemini Nano, on the device) when the browser has
   it and the text is English (the only Indian-site language it supports today). Anything missing or
   failing falls back to engine A.
   pdf.js 3.11.174 (jsDelivr, pinned) is loaded only when the user opens a PDF. Text never leaves the device;
   EDU.store keeps the text and settings. */
(function () {
  'use strict';
  var SLUG = 'smart-summarizer';
  var CDN = 'https://cdn.jsdelivr.net/npm/';
  var PDF = {
    lib: CDN + 'pdfjs-dist@3.11.174/build/pdf.min.js',
    worker: CDN + 'pdfjs-dist@3.11.174/build/pdf.worker.min.js',
    cmaps: CDN + 'pdfjs-dist@3.11.174/cmaps/',
    fonts: CDN + 'pdfjs-dist@3.11.174/standard_fonts/'
  };
  var MAX_CHARS = 300000;          // text the engine reads (about 150 pages)
  var MAX_STORE = 200000;          // text kept in EDU.store
  var MAX_GRAPH = 1500;            // sentences in the TextRank graph (beyond: first 1500)
  var MAX_PDF_MB = 60, MAX_TXT_MB = 8, MAX_PDF_PAGES = 400;
  var READ_WPM = 180;              // average silent reading speed (words per minute)

  var store = EDU.store(SLUG);
  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });
  var $ = EDU.$, t = EDU.t, fmt = EDU.fmt, esc = EDU.esc;

  /* =================================================================== text helpers */
  function rx(src, flags, fallback) { try { return new RegExp(src, flags); } catch (e) { return fallback; } }
  var IND = '\\u0900-\\u0DFF\\u0600-\\u06FF\\u0750-\\u077F';
  var RE_WORDCHAR = rx('[\\p{L}\\p{N}]', 'u', new RegExp('[A-Za-z0-9\\u00C0-\\u024F' + IND + ']'));
  var RE_LM = rx('[\\p{L}\\p{M}]', 'u', new RegExp('[A-Za-z\\u00C0-\\u024F' + IND + ']'));
  var RE_TOKEN = rx('[\\p{L}\\p{M}\\p{N}\\u200C\\u200D]+(?:[\'’][\\p{L}]+)?', 'gu', new RegExp('[A-Za-z0-9\\u00C0-\\u024F' + IND + '\\u200C\\u200D]+', 'g'));
  var RE_NUMONLY = rx('^[\\p{N}]+$', 'u', /^[0-9]+$/);
  var RE_LETTERS = rx('\\p{L}', 'gu', /[A-Za-z\u0904-\u0939\u0958-\u0961\u0985-\u09B9\u0A05-\u0A39\u0A85-\u0AB9\u0B05-\u0B39\u0B85-\u0BB9\u0C05-\u0C39\u0C85-\u0CB9\u0D05-\u0D3A]/g);
  var RE_LISTNO = rx('^\\s*(?:\\p{Nd}{1,3}|[ivxIVX]{1,4})$', 'u', /^\s*(?:[0-9०-९]{1,3}|[ivxIVX]{1,4})$/);
  var RE_BULLET = /^\s*(?:[•\-*–—·▪●◦►✓✔]|\(?[0-9०-९]{1,3}[.)]|\(?[a-zA-Z][.)])\s+/;
  var TERM_LAT = '.!?…', TERM_IND = '।॥۔؟', CLOSE = '"\'”’)]}»›';
  var TERM_ANY = /[.!?…।॥۔؟:;"'”’)]\s*$/;

  function nfc(s) { return s.normalize ? s.normalize('NFC') : s; }
  /* "Monsoon Brings Relief to Maharashtra Farmers": a headline in Title Case, not a sentence. */
  function isTitleLine(str) {
    if (/[.!?…।॥۔؟:;,]["'”’)\]]*\s*$/.test(str)) return false;
    var w = str.match(/[A-Za-z][A-Za-z'’-]{3,}/g) || [];
    if (w.length < 3) return false;
    var cap = w.filter(function (x) { return /^[A-Z]/.test(x); }).length;
    return cap / w.length >= 0.75;
  }
  function isSpace(c) { return /\s/.test(c); }

  /* Abbreviations whose full stop does not end a sentence (copied idea from the Word Counter app). */
  var ABBR = Object.create(null);
  ('mr mrs ms dr prof sr jr st mt vs eg ie govt dept rd co ltd pvt jan feb mar apr jun jul aug sep sept oct nov dec ' +
   'approx fig vol ch pp smt shri sh kum rs std hon col gen lt capt sgt ave est misc ref sec ans no ' +
   'डॉ प्रो पं स्व कु सौ श्री ई पू क्र ता दि रु').split(' ').forEach(function (w) { ABBR[w] = 1; });

  function prevWord(line, i) { var j = i; while (j > 0 && RE_LM.test(line[j - 1])) j--; return line.slice(j, i); }
  function prevToken(line, i) { var j = i; while (j > 0 && (line[j - 1] === '.' || RE_LM.test(line[j - 1]))) j--; while (line[j] === '.') j++; return line.slice(j, i); }
  function oneLetter(p) {
    if (/^[A-Z]$/.test(p)) return true;
    if (!/^[ऀ-෿]+$/.test(p)) return false;
    var m = p.match(RE_LETTERS);
    return !!m && m.length === 1;
  }
  function isInitial(line, li, k, start) {
    var p = li - 1;
    while (p >= start && isSpace(line[p])) p--;
    if (p < start || '("\'“‘[«'.indexOf(line[p]) >= 0) return true;
    if (line[p] === '.') return true;
    if (ABBR[prevWord(line, p + 1).toLowerCase()]) return true;
    var nt = /^([^\s.]{1,6})\.(?:\s|$)/.exec(line.slice(k, k + 8));
    return !!nt && oneLetter(nt[1]);
  }

  /* Hard-wrapped lines (text copied from a PDF or an e-mail) are joined back into paragraphs, so a new line
     only ends a sentence when it really ends one: after . ? ! । ۔ etc., a short heading, a bullet or a blank line. */
  function unwrap(raw) {
    var lines = raw.replace(/\r\n?/g, '\n').replace(/[\u00A0\u2007\u202F\t]/g, ' ').replace(/\u00AD/g, '').split('\n');
    var out = [], cur = null;
    for (var i = 0; i < lines.length; i++) {
      var L = lines[i].replace(/ {2,}/g, ' ').trim();
      if (!L) { if (cur !== null) { out.push(cur); cur = null; } out.push(''); continue; }
      if (cur === null) { cur = L; continue; }
      var prevLong = Array.from(cur.split('\n').pop()).length >= 45;
      if (prevLong && !TERM_ANY.test(cur) && !RE_BULLET.test(L) && !isTitleLine(cur)) {
        if (/[A-Za-z]-$/.test(cur) && /^[a-z]/.test(L)) cur = cur.slice(0, -1) + L;   // "evapo-\nration"
        else cur += ' ' + L;
      } else { out.push(cur); cur = L; }
    }
    if (cur !== null) out.push(cur);
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  /* Sentences with offsets. End at . ! ? … । ॥ ۔ ؟ (and | typed as a danda) and at every line end.
     Abbreviations (Dr., Rs., डॉ.), initials (A. P. J.), list numbers (1. ii.), decimals (5.30) and a full
     stop followed by a small letter do not end a sentence. */
  function splitSentences(text) {
    var out = [], lineRe = /[^\n]+/g, m, para = 0, lastEnd = 0;
    function push(s, e) {
      while (s < e && isSpace(text[s])) s++;
      while (e > s && isSpace(text[e - 1])) e--;
      if (s < e && RE_WORDCHAR.test(text.slice(s, e))) out.push({ s: s, e: e, p: para });
    }
    while ((m = lineRe.exec(text))) {
      if (/\n\s*\n/.test(text.slice(lastEnd, m.index))) para++;
      lastEnd = m.index + m[0].length;
      var line = m[0], base = m.index, n = line.length, start = 0, i = 0;
      while (i < n) {
        var ch = line[i];
        var ind = TERM_IND.indexOf(ch) >= 0, lat = TERM_LAT.indexOf(ch) >= 0, pipe = ch === '|';
        if (!ind && !lat && !pipe) { i++; continue; }
        var j = i + 1, onlyLat = lat;
        while (j < n) {
          var c = line[j];
          if (TERM_IND.indexOf(c) >= 0 || c === '|') { onlyLat = false; ind = ind || c !== '|'; j++; }
          else if (TERM_LAT.indexOf(c) >= 0 || CLOSE.indexOf(c) >= 0) j++;
          else break;
        }
        var atEnd = j >= n, spaceAfter = !atEnd && isSpace(line[j]), boundary;
        if (ind) boundary = true;
        else if (!atEnd && !spaceAfter) boundary = false;
        else if (pipe) boundary = true;
        else {
          boundary = true;
          if (onlyLat && !atEnd) {
            var k = j; while (k < n && isSpace(line[k])) k++;
            if (k < n && /[a-z]/.test(line[k])) boundary = false;
          }
          if (boundary && ch === '.' && j === i + 1 && !atEnd) {
            var nx = j; while (nx < n && isSpace(line[nx])) nx++;
            var tok = prevToken(line, i), w = tok.toLowerCase();
            if (tok.indexOf('.') >= 0) {
              if (ABBR[w.replace(/\./g, '')]) boundary = false;
              else if (tok.split('.').every(oneLetter)) {
                var q = i - tok.length - 1; while (q >= 0 && isSpace(line[q])) q--;
                if (prevWord(line, q + 1).toLowerCase() !== 'the') boundary = false;
              }
            }
            else if (w === 'no') { if (/[0-9०-९]/.test(line[nx] || '')) boundary = false; }
            else if (w && ABBR[w]) boundary = false;
            else if ((/^[A-Za-z]$/.test(tok) || oneLetter(tok)) && isInitial(line, i - tok.length, nx, start)) boundary = false;
            else if (i <= 16 && RE_LISTNO.test(line.slice(0, i))) boundary = false;
          }
        }
        if (boundary) { push(base + start, base + j); start = j; }
        i = j;
      }
      if (start < n) push(base + start, base + n);
    }
    return out;
  }

  /* -------- stop-words (small "function words"; they carry no topic) -------- */
  var STOP = Object.create(null);
  (
    // English
    'the a an and or but if of to in on at by for with from as is am are was were be been being it its this that these those there here ' +
    'i me my we our us you your he him his she her they them their what which who whom whose will would shall should can could may might must ' +
    'do does did done has have had having not no nor so very too also than then all any some such into about up down out over under only just ' +
    'more most each both how when where why because while after before again let one two other others own same few many much per via ' +
    'get got make made said say says like well even still yet ever never always often around through during without within between ' +
    'among upon onto off since until unless though although whether either neither another every lot lots its it\'s that\'s called use used using ' +
    // Hindi
    'का के की को में से है हैं था थे थी थीं और या पर ने भी तो ही यह वह ये वे इस उस इन उन एक कि जो कर करना करते करती किया हो होता होती होते ' +
    'होना हुआ हुई हुए लिए साथ तक अपना अपने अपनी मैं हम आप तुम मेरा मेरी मेरे हमारा हमारी हमारे नहीं न जा जाता जाती जाते रहा रही रहे रहता रहती ' +
    'सकता सकती सकते सकें गया गई गए दिया अब जब तब कुछ सब हर बहुत क्या क्यों कैसे कौन किसी किस द्वारा लेकिन परंतु किंतु तथा एवं व वाले वाली वाला ' +
    'कहते कहा कहलाता कहलाती जिसे जिसको जिन जिस इसे उसे इसी उसी वापस फिर आदि यदि अगर इसलिए क्योंकि भी लगभग छोटे छोटी ' +
    // Marathi
    'आणि आहे आहेत होते होता होती हे ही हा ते ती तो या की पण मध्ये चा ची चे च्या ला ना नाही मी आम्ही तुम्ही त्या साठी असे केले म्हणतात याला त्याला असते असतात काही ' +
    // Bengali
    'এবং ও এই সেই যে না করে হয় আর থেকে জন্য তার এর ছিল আছে কিন্তু একটি একটা আমি আমরা তুমি আপনি সে তারা কি কী হবে মধ্যে সব খুব বা যা এক আমাদের তোমাদের আপনার তাদের বলে একে তাই হল কিছু ছোট ' +
    // Gujarati
    'અને છે હતું હતી હતા તે આ એ માં પણ ના ની નો નું ને થી એક હું અમે તમે કે જે પર માટે સાથે નથી કહે તેને જેને તેથી થાય નાનાં ' +
    // Punjabi
    'ਅਤੇ ਹੈ ਹਨ ਸੀ ਦੇ ਦੀ ਦਾ ਦੀਆਂ ਨੂੰ ਵਿੱਚ ਇਹ ਉਹ ਤੋਂ ਨੇ ਵੀ ਇੱਕ ਕਿ ਜੋ ਮੈਂ ਅਸੀਂ ਤੁਸੀਂ ਲਈ ਨਾਲ ਨਹੀਂ ਤਾਂ ਹੀ ਕੇ ਜਾਂ ਕਹਿੰਦੇ ਇਸ ਜਿਸ ਉਸ ਤੱਕ ਉੱਤੇ ਕੁਝ ' +
    // Odia
    'ଓ ଏବଂ ଏହି ସେହି ଯେ ନାହିଁ କରି ହୁଏ ଆଉ ପାଇଁ ତାର ଏକ ମୁଁ ଆମେ ତୁମେ ସେ କି ଥିଲା ଅଛି ସହ ବା କୁହାଯାଏ ଏହାକୁ ତେଣୁ ମଧ୍ୟ କିଛି ଛୋଟ ' +
    // Tamil
    'மற்றும் ஒரு இந்த அந்த என்று இது அது நான் நாம் நாங்கள் நீங்கள் அவர் அவர்கள் உள்ள மிகவும் ஆனால் அல்லது என் தான் பெயர் இதற்கு அதன் எனவே போன்ற பகுதி சிறிய ' +
    // Telugu
    'మరియు ఒక ఈ ఆ అని ఇది అది నేను మేము మనం మీరు అతను ఆమె వారు కూడా చాలా కానీ లేదా ఉంది నా మా అంటారు దీన్ని అందుకే వంటి కొంత చిన్న ' +
    // Kannada
    'ಮತ್ತು ಒಂದು ಈ ಆ ಎಂದು ಇದು ಅದು ನಾನು ನಾವು ನೀವು ಅವರು ಹಾಗೂ ತುಂಬಾ ಆದರೆ ಅಥವಾ ಇದೆ ನನ್ನ ನಮ್ಮ ಸಹ ಕೂಡ ಎನ್ನುತ್ತಾರೆ ಇದನ್ನು ಆದ್ದರಿಂದ ಸ್ವಲ್ಪ ಮೇಲಿನ ' +
    // Malayalam
    'ഒരു ഈ ആ ഇത് അത് ഞാൻ ഞങ്ങൾ നമ്മൾ നിങ്ങൾ അവൻ അവൾ അവർ വളരെ പക്ഷേ ഉണ്ട് ആണ് എന്റെ നമ്മുടെ കൂടി എന്നു എന്ന് പറയുന്നു ഇതിനെ അതിനാൽ ചെറിയ ചെയ്യുന്നു ' +
    // Urdu
    'کا کے کی کو میں سے ہے ہیں تھا تھے تھی اور یا پر نے بھی تو ہی یہ وہ اس ان ایک کہ جو کر ہو لیے ساتھ تک اپنا اپنے اپنی ہم آپ تم نہیں گیا گئی گئے کیا بہت لیکن جب اب ہر رہا رہی رہے کہتے اسے جسے جاتا جاتی جاتے ہوتا ہوتی ہوتے کچھ پھر جیسے جیسی جیسا کرتے کرنا کرتی والے والی والا سب'
  ).split(/\s+/).forEach(function (w) { if (w) STOP[nfc(w)] = 1; });

  /* -------- stems -------- */
  function scriptOf(text) {
    var sample = text.length > 4000 ? text.slice(0, 4000) : text, counts = {}, best = 'latn', bestN = 0;
    var R = [['deva', /[\u0900-\u097F]/g], ['beng', /[\u0980-\u09FF]/g], ['guru', /[\u0A00-\u0A7F]/g], ['gujr', /[\u0A80-\u0AFF]/g],
             ['orya', /[\u0B00-\u0B7F]/g], ['taml', /[\u0B80-\u0BFF]/g], ['telu', /[\u0C00-\u0C7F]/g], ['knda', /[\u0C80-\u0CFF]/g],
             ['mlym', /[\u0D00-\u0D7F]/g], ['arab', /[\u0600-\u06FF\u0750-\u077F]/g], ['latn', /[A-Za-z]/g]];
    R.forEach(function (r) { var m = sample.match(r[1]); counts[r[0]] = m ? m.length : 0; if (counts[r[0]] > bestN) { bestN = counts[r[0]]; best = r[0]; } });
    return best;
  }
  function stemEn(w) {
    if (w.length <= 3) return w;
    w = w.replace(/['’]s$/, '');
    if (/ies$/.test(w) && w.length > 4) return w.slice(0, -3) + 'y';
    if (/sses$/.test(w)) return w.slice(0, -2);
    if (/(ches|shes|xes|zes)$/.test(w)) return w.slice(0, -2);
    if (/[^su]s$/.test(w)) w = w.slice(0, -1);
    if (/ing$/.test(w) && w.length > 5) { w = w.slice(0, -3); if (/(.)\1$/.test(w) && !/(ll|ss|zz)$/.test(w)) w = w.slice(0, -1); return w; }
    if (/ed$/.test(w) && w.length > 4) { w = w.slice(0, -2); if (/(.)\1$/.test(w) && !/(ll|ss|zz)$/.test(w)) w = w.slice(0, -1); return w; }
    if (/ly$/.test(w) && w.length > 5) return w.slice(0, -2);
    if (/e$/.test(w) && w.length > 4) return w.slice(0, -1);
    return w;
  }
  var DEVA_SUF = ['ियों', 'ियाँ', 'ियां', 'ाओं', 'ाएँ', 'ाएं', 'ों', 'ें', 'ीं', 'ाँ', 'ां'];
  var URDU_SUF = ['یوں', 'وں', 'یں', 'ؤں'];
  /* Case endings that Dravidian languages glue onto words (நீரை, நீரின், நீரில் → நீர்). Longest first. */
  var SUF = {
    deva: DEVA_SUF,
    arab: URDU_SUF,
    taml: ['த்திலிருந்து', 'இலிருந்து', 'ிலிருந்து', 'த்திற்கு', 'த்தில்', 'த்தின்', 'த்தை', 'களில்', 'களின்', 'களை', 'ுக்கும்', 'க்கும்', 'ுக்கு', 'க்கு', 'ிடம்', 'ுடன்', 'ோடு', 'கள்', 'ில்', 'ின்', 'ால்', 'ும்', 'ையே', 'ை', 'ாக'],
    mlym: ['ത്തിന്റെ', 'ിന്റെ', 'ത്തിൽ', 'ത്തെ', 'യിലെ', 'യിൽ', 'ിലെ', 'ിൽ', 'ുകൾ', 'കൾ', 'ുടെ', 'ും', 'ിന്', 'ാണ്', 'െ'],
    knda: ['ಗಳಲ್ಲಿ', 'ಗಳನ್ನು', 'ಗಳಿಗೆ', 'ಗಳು', 'ದಲ್ಲಿ', 'ನಲ್ಲಿ', 'ಯಲ್ಲಿ', 'ವನ್ನು', 'ನ್ನು', 'ದಿಂದ', 'ಕ್ಕೆ', 'ಗೆ', 'ವು'],
    telu: ['ల్లోని', 'ల్లో', 'లలో', 'లకు', 'లను', 'ాన్ని', 'ానికి', 'లో', 'కు', 'ని', 'ను', 'లు'],
    beng: ['গুলোর', 'গুলো', 'দের', 'য়ের', 'ের', 'তে', 'কে', 'টি', 'র'],
    gujr: ['ઓમાં', 'ઓનું', 'માંથી', 'માં', 'નું', 'ની', 'નો', 'ના', 'થી', 'ને', 'ઓ'],
    orya: ['ଗୁଡ଼ିକ', 'ମାନେ', 'ରୁ', 'ରେ', 'କୁ', 'ର']
  };
  var PREFIX = { deva: 7, beng: 6, guru: 6, gujr: 6, orya: 6, taml: 6, telu: 6, knda: 6, mlym: 6, arab: 7 };
  var RE_TAIL = /[\u094D\u09CD\u0A4D\u0ACD\u0B4D\u0BCD\u0C4D\u0CCD\u0D4D]$/;   // a final virama (நீர் = நீர)
  function stem(w, script) {
    if (script === 'latn' && /^[a-z'’]+$/.test(w)) return stemEn(w);
    var suf = SUF[script], i;
    if (suf) for (i = 0; i < suf.length; i++) {
      var s = suf[i];
      if (Array.from(w).length > Array.from(s).length + 2 && w.slice(-s.length) === s) { w = w.slice(0, -s.length); break; }
    }
    w = w.replace(RE_TAIL, '');
    var cap = PREFIX[script];
    if (cap) { var cps = Array.from(w); if (cps.length > cap) w = cps.slice(0, cap).join(''); }
    return w;
  }
  function tokenize(str, script) {
    var out = [], m;
    RE_TOKEN.lastIndex = 0;
    while ((m = RE_TOKEN.exec(str))) {
      var raw = m[0];
      if (!raw) { RE_TOKEN.lastIndex++; continue; }
      var low = nfc(raw.toLocaleLowerCase()).replace(/[\u200C\u200D]/g, '');
      var stop = !!STOP[low] || !!STOP[low.replace(/['’]s$/, '')];
      var num = RE_NUMONLY.test(low);
      var short = /^[a-z'’]+$/.test(low) ? low.length < 3 : Array.from(low).length < 2;
      out.push({ raw: raw, w: low, st: (stop || num || short) ? null : stem(low, script) });
    }
    return out;
  }

  /* Words that point back to an earlier sentence ("It travels…", "यह…"): such a sentence reads oddly on its own. */
  var BACKREF = Object.create(null);
  ('it its this that these those they their he she his her such ' +
   'यह वह ये वे इसकी इसका इसके इसे उसकी उसका उसके उसे ' +
   'এটি এটা এই তার এদের এগুলো ' +
   'ते ती तो हे ही त्याचा त्याची त्याचे ' +
   'તે તેનો તેની તેનું આ ' +
   'ਇਹ ਉਹ ਇਸ ਉਸ ਇਸ ' +
   'ଏହା ଏହାର ସେ ତାହା ' +
   'அது இது அவை இவை அதன் இதற்கு ' +
   'అది ఇది అవి ఇవి దీన్ని దాని ' +
   'ಅದು ಇದು ಅವು ಇವು ಇದನ್ನು ಅದರ ' +
   'അത് ഇത് അവ ഇവ ഇതിനെ അതിന്റെ ' +
   'یہ وہ اس اسے ان').split(' ').forEach(function (w) { if (w) BACKREF[nfc(w)] = 1; });

  /* =================================================================== engine A: TextRank */
  function summarize(rawText, opts) {
    var cut = rawText.length > MAX_CHARS;
    var text = unwrap(cut ? rawText.slice(0, MAX_CHARS) : rawText);
    var script = scriptOf(text);
    var sents = splitSentences(text);
    var totalWords = 0, df = Object.create(null), i, j, k;
    var info = Object.create(null);           // stem -> { n: count, forms: {surface: count}, first }
    sents.forEach(function (s, si) {
      var toks = tokenize(text.slice(s.s, s.e), script), tf = Object.create(null);
      s.words = toks.length; totalWords += toks.length;
      toks.forEach(function (tk) {
        if (!tk.st) return;
        tf[tk.st] = (tf[tk.st] || 0) + 1;
        var I = info[tk.st] || (info[tk.st] = { n: 0, forms: Object.create(null), first: si, sents: [] });
        I.n++;
        I.forms[tk.raw] = (I.forms[tk.raw] || 0) + 1;
        if (I.sents[I.sents.length - 1] !== si) I.sents.push(si);
      });
      s.tf = tf;
      Object.keys(tf).forEach(function (w) { df[w] = (df[w] || 0) + 1; });
    });
    var N = sents.length;
    var res = { text: text, script: script, sents: sents, chosen: [], keywords: [], totalWords: totalWords, summaryWords: 0, cut: cut, k: 0 };
    if (!N) return res;

    // TF-IDF vectors
    sents.forEach(function (s) {
      var v = Object.create(null), norm = 0;
      Object.keys(s.tf).forEach(function (w) {
        var x = (1 + Math.log(s.tf[w])) * (1 + Math.log(N / df[w]));
        v[w] = x; norm += x * x;
      });
      s.vec = v; s.norm = Math.sqrt(norm);
    });

    // similarity graph (inverted index; dense matrix of at most MAX_GRAPH^2 floats)
    var G = Math.min(N, MAX_GRAPH);
    var sim = new Float32Array(G * G), post = Object.create(null);
    for (i = 0; i < G; i++) for (var w in sents[i].vec) (post[w] || (post[w] = [])).push(i);
    Object.keys(post).forEach(function (w) {
      var L = post[w];
      for (var a = 0; a < L.length; a++) {
        var ia = L[a], wa = sents[ia].vec[w];
        for (var b = a + 1; b < L.length; b++) {
          var ib = L[b], x = wa * sents[ib].vec[w];
          sim[ia * G + ib] += x; sim[ib * G + ia] += x;
        }
      }
    });
    for (i = 0; i < G; i++) for (j = 0; j < G; j++) {
      var d = sents[i].norm * sents[j].norm;
      sim[i * G + j] = d ? sim[i * G + j] / d : 0;
    }
    // PageRank
    var D = 0.85, out = new Float64Array(G), sc = new Float64Array(G), nx = new Float64Array(G);
    for (i = 0; i < G; i++) { var o = 0; for (j = 0; j < G; j++) o += sim[i * G + j]; out[i] = o; sc[i] = 1 / G; }
    for (var it = 0; it < 100; it++) {
      var delta = 0;
      for (i = 0; i < G; i++) {
        var sum = 0;
        for (j = 0; j < G; j++) { var x2 = sim[j * G + i]; if (x2 && out[j]) sum += x2 / out[j] * sc[j]; }
        nx[i] = (1 - D) / G + D * sum;
      }
      for (i = 0; i < G; i++) { delta += Math.abs(nx[i] - sc[i]); sc[i] = nx[i]; }
      if (delta < 1e-7) break;
    }
    var firstInPara = {};
    sents.forEach(function (s, si) {
      var base = si < G ? sc[si] : 0;
      var f = 1;
      var ended = /[.!?…।॥۔؟]["'”’)\]]*$/.test(text.slice(s.s, s.e));
      if (!ended && (s.words < 8 || isTitleLine(text.slice(s.s, s.e)))) f *= 0.15;   // a heading or label line, not a sentence
      else if (s.words < 5) f *= 0.55;                     // very short sentences say little
      else if (s.words > 55) f *= 0.85;                    // very long run-ons
      var fw = /^[^\s,;:]+/.exec(text.slice(s.s, Math.min(s.e, s.s + 40)));
      if (fw && BACKREF[nfc(fw[0].replace(/[.!?'"“”‘’()]/g, '').toLocaleLowerCase())]) f *= 0.8;
      if (si === 0) f *= 1.12;                             // the opening sentence usually names the topic
      else if (firstInPara[s.p] === undefined) f *= 1.04;
      if (firstInPara[s.p] === undefined) firstInPara[s.p] = si;
      s.score = base * f;
    });

    // how many
    var want = opts.mode === 'pct' ? Math.round(N * opts.pct / 100) : opts.n;
    want = Math.max(1, Math.min(N, want));
    res.k = want;
    // greedy pick by score, skipping near-duplicates
    var order = sents.map(function (s, si) { return si; }).sort(function (a, b) { return sents[b].score - sents[a].score || a - b; });
    var chosen = [];
    function cos(a, b) { if (a < G && b < G) return sim[a * G + b]; return 0; }
    for (k = 0; k < order.length && chosen.length < want; k++) {
      var c = order[k];
      if (chosen.some(function (x) { return cos(x, c) > 0.65; })) continue;
      chosen.push(c);
    }
    for (k = 0; k < order.length && chosen.length < want; k++) if (chosen.indexOf(order[k]) < 0) chosen.push(order[k]);
    chosen.sort(function (a, b) { return a - b; });
    res.chosen = chosen;
    res.summaryWords = chosen.reduce(function (acc, si) { return acc + sents[si].words; }, 0);

    // keywords: frequent topic words, weighted by how central their sentences are
    var maxSc = 0; sents.forEach(function (s) { if (s.score > maxSc) maxSc = s.score; });
    var kws = Object.keys(info).map(function (st) {
      var I = info[st], cen = 0;
      I.sents.forEach(function (si) { cen += maxSc ? sents[si].score / maxSc : 0; });
      var form = Object.keys(I.forms).sort(function (a, b) { return I.forms[b] - I.forms[a] || a.length - b.length; })[0];
      var lower = form.toLocaleLowerCase();
      if (I.forms[form] && Object.keys(I.forms).some(function (f) { return f === lower; })) form = lower;
      return { st: st, word: form, n: I.n, score: I.n + cen, first: I.first };
    }).filter(function (x) { return x.n >= 2 || N <= 3; });
    kws.sort(function (a, b) { return b.score - a.score || a.first - b.first; });
    res.keywords = kws.slice(0, 8);
    return res;
  }
  window.SmartSummarizer = { summarize: summarize, splitSentences: splitSentences, unwrap: unwrap };   // for tests / curious users

  /* =================================================================== state */
  var DEF = { mode: 'points', n: 5, pct: 30, engine: 'quick', aiType: 'key-points', tab: 'points' };
  var S = Object.assign({}, DEF, store.get('settings', {}));
  if (['points', 'pct'].indexOf(S.mode) < 0) S.mode = 'points';
  S.n = EDU.clamp(+S.n || 5, 3, 10);
  S.pct = EDU.clamp(Math.round((+S.pct || 30) / 5) * 5, 10, 60);
  if (['points', 'hl'].indexOf(S.tab) < 0) S.tab = 'points';
  var sampleLang = store.get('sampleLang', null);  // the text is the untouched sample of this language
  var srcName = store.get('srcName', '');
  var R = null;              // engine A result
  var aiRes = null;          // engine B result { items:[], para:bool }
  var runTimer = 0;

  var C = function () { var A = window.APP_CONTENT || {}; return A[EDU.lang] || A.en; };
  function sampleText(lang) { var A = window.APP_CONTENT || {}, c = A[lang] || A.en; return c.title + '\n\n' + c.paras.join('\n\n'); }

  var ta = $('#text');
  var saved = store.get('text', null);
  if (saved === null) { ta.value = sampleText(EDU.lang); sampleLang = EDU.lang; }
  else {
    ta.value = saved;
    // the untouched sample of another language (the language was changed on another page): show this language's sample
    if (sampleLang && sampleLang !== EDU.lang && saved === sampleText(sampleLang)) { ta.value = sampleText(EDU.lang); sampleLang = EDU.lang; }
  }

  function saveSettings() { store.set('settings', { mode: S.mode, n: S.n, pct: S.pct, engine: S.engine, aiType: S.aiType, tab: S.tab }); }
  var saveTimer = 0;
  function saveText() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var v = ta.value;
      store.set('text', v.length > MAX_STORE ? v.slice(0, MAX_STORE) : v);
      store.set('sampleLang', sampleLang);
      store.set('srcName', srcName);
    }, 400);
  }

  /* =================================================================== rendering */
  function countWords(s) { var m = s.match(RE_TOKEN); return m ? m.length : 0; }
  function renderInStats() {
    var v = ta.value;
    if (!v.trim()) { $('#inStats').textContent = ''; return; }
    var n = splitSentences(unwrap(v.length > MAX_CHARS ? v.slice(0, MAX_CHARS) : v)).length;
    $('#inStats').textContent = t('in_stats', { w: fmt(countWords(v)), s: fmt(n) });
  }
  function cleanPoint(s) { return s.replace(RE_BULLET, '').trim(); }
  function sentText(si) { var s = R.sents[si]; return R.text.slice(s.s, s.e); }
  function readTime(words) {
    var sec = words / READ_WPM * 60;
    if (sec < 60) return t('sec_n', { n: fmt(Math.max(10, Math.round(sec / 10) * 10)) });
    return t('min_n', { n: fmt(Math.round(sec / 60)) });
  }
  function pointsList() {
    if (aiRes) return aiRes.items.slice();
    if (!R) return [];
    return R.chosen.map(function (si) { return cleanPoint(sentText(si)); });
  }

  function renderLen() {
    $$('#modeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode)); });
    var r = $('#lenRange');
    if (S.mode === 'pct') { r.min = 10; r.max = 60; r.step = 5; r.value = S.pct; $('#lenOut').textContent = t('pct_val', { n: fmt(S.pct) }); }
    else { r.min = 3; r.max = 10; r.step = 1; r.value = S.n; $('#lenOut').textContent = t('n_points', { n: fmt(S.n) }); }
    r.setAttribute('aria-valuetext', $('#lenOut').textContent);
  }
  function $$(sel) { return EDU.$$(sel); }

  function aiOk() { return AI.state === 'available' || AI.state === 'downloadable' || AI.state === 'downloading'; }
  function engine() { return S.engine === 'chrome' && aiOk() ? 'chrome' : 'quick'; }
  function renderEngine() {
    $('#engRow').hidden = !aiOk();
    var eng = engine();
    $$('#engSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.eng === eng)); });
    $$('#typeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.type === S.aiType)); });
    var chrome = eng === 'chrome';
    $('#aiOpts').hidden = !chrome;
    $('#aiFirst').hidden = !(chrome && AI.state !== 'available');
    $('#goBtn').textContent = t(chrome ? 'btn_chrome_run' : 'btn_summarize');
  }

  function renderOut() {
    var hasText = !!ta.value.trim();
    var ol = $('#points'), note = $('#outNote'), hl = $('#hl');
    ol.innerHTML = ''; hl.innerHTML = '';
    var usable = R && R.sents.length;
    var ok = hasText && usable && (aiRes || R.sents.length >= 2);
    $('#outBody').hidden = !ok;
    $('#outEmpty').hidden = ok;
    $('#outEmpty').textContent = !hasText ? t('empty_out') : t('too_short', { n: fmt(2) });
    ['copyBtn', 'dlBtn', 'printBtn'].forEach(function (id) { $('#' + id).disabled = !ok; });
    $('#engBadge').hidden = !ok;
    if (!ok) { $('#stats').textContent = ''; $('#kw').innerHTML = ''; return; }

    // tabs
    $$('#outTabs button').forEach(function (b) { var on = b.dataset.tab === S.tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    $('#pane-points').hidden = S.tab !== 'points';
    $('#pane-hl').hidden = S.tab !== 'hl';

    var items = pointsList();
    ol.classList.toggle('ss-para', !!(aiRes && aiRes.para));
    items.forEach(function (p, i) {
      var li = EDU.el('li', {});
      if (!aiRes) {
        var b = EDU.el('button', { class: 'ss-pt', type: 'button', text: p, title: t('show_in_text'), onclick: function () { showInText(i); } });
        li.appendChild(b);
      } else li.textContent = p;
      ol.appendChild(li);
    });
    $('#engBadge').textContent = aiRes ? t('badge_chrome') : t('badge_quick');
    $('#engBadge').className = 'badge ' + (aiRes ? 'accent' : 'primary');
    var notes = [];
    if (aiRes) notes.push(t('by_chrome'));
    else {
      notes.push(t('by_quick'));
      if (R.sents.length <= R.k) notes.push(t('all_kept', { n: fmt(R.sents.length) }));
    }
    if (R.cut) notes.push(t('text_cut', { n: fmt(MAX_CHARS) }));
    if (aiNote) notes.push(t(aiNote));
    note.textContent = notes.join(' ');

    // highlighted original
    if (aiRes) { $('#hlNote').textContent = t('hl_na'); hl.hidden = true; }
    else {
      $('#hlNote').textContent = t('hl_note');
      hl.hidden = false;
      var html = '', pos = 0;
      R.chosen.forEach(function (si, i) {
        var s = R.sents[si];
        html += esc(R.text.slice(pos, s.s)) + '<mark class="ss-mark" id="ss-m' + i + '"><b class="ss-num">' + (i + 1) + '</b>' + esc(R.text.slice(s.s, s.e)) + '</mark>';
        pos = s.e;
      });
      html += esc(R.text.slice(pos));
      hl.innerHTML = html;
    }

    // stats
    var sw = aiRes ? countWords(items.join(' ')) : R.summaryWords;
    var parts = [];
    if (!aiRes) parts.push(t('sum_stats', { k: fmt(R.chosen.length), n: fmt(R.sents.length) }));
    parts.push(t('words_stats', { w1: fmt(R.totalWords), w2: fmt(sw) }));
    var saved = Math.max(0, R.totalWords - sw);
    $('#stats').innerHTML = '';
    parts.forEach(function (p) { $('#stats').appendChild(EDU.el('span', { class: 'ss-stat', text: p })); });
    if (saved >= 20) $('#stats').appendChild(EDU.el('span', { class: 'ss-stat ss-save', text: '⏱ ' + t('saved_time', { t: readTime(saved) }) }));

    // keywords
    var kw = $('#kw'); kw.innerHTML = '';
    if (!R.keywords.length) kw.appendChild(EDU.el('span', { class: 'muted small', text: t('no_keywords') }));
    R.keywords.forEach(function (k) { kw.appendChild(EDU.el('span', { class: 'chip ss-kwchip', text: k.word })); });
  }

  function showInText(i) {
    S.tab = 'hl'; saveSettings(); renderOut();
    var m = document.getElementById('ss-m' + i);
    if (!m) return;
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
    m.classList.remove('ss-flash'); void m.offsetWidth; m.classList.add('ss-flash');
    m.tabIndex = -1;
    try { m.focus({ preventScroll: true }); } catch (e) { }   // keyboard users keep their place (the list was re-drawn)
  }

  function aiStop() {
    if (!AI.busy) return;
    AI.seq++; AI.busy = false;
    try { AI.abort && AI.abort.abort(); } catch (e) { }
    aiProgress(false); $('#goBtn').disabled = false;
  }
  function runA() {
    clearTimeout(runTimer);
    aiStop();   // new text or settings: a running Chrome AI summary of the old text is dropped
    var v = ta.value;
    aiRes = null; aiNote = '';
    if (!v.trim()) { R = null; renderOut(); return; }
    R = summarize(v, { mode: S.mode, n: S.n, pct: S.pct });
    renderOut();
  }
  function schedule(ms) {
    clearTimeout(runTimer);
    if (ta.value.length > 60000) $('#outNote').textContent = t('working');
    runTimer = setTimeout(runA, ms);
  }

  /* =================================================================== engine B: Chrome's Summarizer API */
  var AI = { state: 'none', busy: false, abort: null, seq: 0 };
  var aiNote = '';
  function aiApi() {
    try { return (typeof self !== 'undefined' && 'Summarizer' in self && self.Summarizer && typeof self.Summarizer.availability === 'function' && typeof self.Summarizer.create === 'function') ? self.Summarizer : null; }
    catch (e) { return null; }
  }
  function mapAvail(a) {
    if (a === 'readily') return 'available';
    if (a === 'after-download') return 'downloadable';
    if (a === 'no') return 'unavailable';
    return ['available', 'downloadable', 'downloading', 'unavailable'].indexOf(a) >= 0 ? a : 'unavailable';
  }
  function aiCreateOpts(type, length) {
    return { type: type, format: 'plain-text', length: length, expectedInputLanguages: ['en'], outputLanguage: 'en', expectedContextLanguages: ['en'] };
  }
  function aiCheck() {
    var api = aiApi();
    if (!api) { AI.state = 'none'; renderEngine(); return; }
    var p;
    try { p = Promise.resolve(api.availability(aiCreateOpts('key-points', 'medium'))); } catch (e) { p = Promise.reject(e); }
    p.then(function (a) { AI.state = mapAvail(a); }, function () { AI.state = 'none'; }).then(renderEngine);
  }
  function isEnglishText(s) {
    var letters = s.match(rx('\\p{L}', 'gu', /[A-Za-zऀ-෿؀-ۿ]/g)) || [];
    if (!letters.length) return false;
    var lat = letters.filter(function (c) { return /[A-Za-z]/.test(c); }).length;
    return lat / letters.length > 0.9;
  }
  function aiProgress(show, frac) {
    $('#aiBox').hidden = !show;
    if (!show) return;
    var bar = $('#aiBar');
    if (frac === null || frac === undefined) { $('#aiMsg').textContent = t('ai_working'); bar.parentNode.hidden = true; }
    else {
      var pct = Math.round(EDU.clamp(frac, 0, 1) * 100);
      $('#aiMsg').textContent = t('ai_downloading', { p: fmt(pct) });
      bar.parentNode.hidden = false; bar.style.width = pct + '%';
      bar.parentNode.setAttribute('aria-valuenow', String(pct));
    }
  }
  function aiFallback(key) {
    AI.busy = false; aiProgress(false);
    $('#goBtn').disabled = false;
    runA();
    aiNote = key; renderOut();
  }
  function parseAi(txt, para) {
    txt = String(txt || '').replace(/\r/g, '').trim();
    if (!txt) return [];
    if (para) return [txt.replace(/\s*\n+\s*/g, ' ')];
    var lines = txt.split(/\n+/).map(function (l) { return l.replace(/^\s*(?:[*•\-–]|\d{1,2}[.)])\s*/, '').replace(/\*\*/g, '').trim(); }).filter(Boolean);
    return lines;
  }
  function readStream(stream, onText) {
    var reader = stream.getReader(), acc = '';
    function pump() {
      return reader.read().then(function (r) {
        if (r.done) return acc;
        var chunk = String(r.value || '');
        acc = chunk.indexOf(acc) === 0 && acc ? chunk : acc + chunk;   // older Chrome sent the whole text so far
        onText(acc);
        return pump();
      });
    }
    return pump();
  }
  function runB() {
    var api = aiApi(), v = ta.value;
    if (!v.trim()) { runA(); return; }
    if (!api) { aiFallback('ai_fallback_err'); return; }
    if (!isEnglishText(v)) { aiFallback('ai_fallback_lang'); return; }
    if (AI.busy) return;
    AI.busy = true; $('#goBtn').disabled = true;
    var my = ++AI.seq;
    if (!R) R = summarize(v, { mode: S.mode, n: S.n, pct: S.pct });
    var k = S.mode === 'pct' ? R.k : S.n;
    var length = k <= 3 ? 'short' : k <= 5 ? 'medium' : 'long';
    var para = S.aiType === 'tldr';
    var ctrl = window.AbortController ? new AbortController() : null;
    AI.abort = ctrl;
    var opts = aiCreateOpts(para ? 'tldr' : 'key-points', length);
    opts.monitor = function (m) {
      try { m.addEventListener('downloadprogress', function (e) { aiProgress(true, typeof e.loaded === 'number' ? (e.total && e.total > 1 ? e.loaded / e.total : e.loaded) : 0); }); } catch (e) { }
    };
    if (ctrl) opts.signal = ctrl.signal;
    aiProgress(true, AI.state === 'available' ? null : 0);
    var inst = null;
    var input = unwrap(v.length > MAX_CHARS ? v.slice(0, MAX_CHARS) : v);
    Promise.resolve().then(function () { return api.create(opts); }).then(function (s) {
      inst = s; AI.state = 'available';
      aiProgress(true, null);
      // keep the input inside the model's quota: if it is too long, give it the key sentences picked by engine A
      if (typeof s.measureInputUsage === 'function' && typeof s.inputQuota === 'number' && isFinite(s.inputQuota)) {
        return Promise.resolve(s.measureInputUsage(input)).then(function (u) {
          if (u > s.inputQuota) {
            var big = summarize(v, { mode: 'pct', pct: 30, n: 5 });
            input = big.chosen.map(function (si) { return big.text.slice(big.sents[si].s, big.sents[si].e); }).join(' ');
            return Promise.resolve(s.measureInputUsage(input)).then(function (u2) { if (u2 > s.inputQuota) input = input.slice(0, Math.floor(input.length * s.inputQuota / u2 * 0.9)); });
          }
        }).catch(function () { });
      }
    }).then(function () {
      var sOpts = ctrl ? { signal: ctrl.signal } : undefined;
      if (typeof inst.summarizeStreaming === 'function') {
        var stream = inst.summarizeStreaming(input, sOpts);
        if (stream && typeof stream.getReader === 'function') {
          return readStream(stream, function (txt) {
            if (my !== AI.seq) return;
            aiRes = { items: parseAi(txt, para), para: para }; aiNote = ''; renderOut();
          });
        }
      }
      return inst.summarize(input, sOpts);
    }).then(function (txt) {
      if (my !== AI.seq) { try { inst.destroy && inst.destroy(); } catch (e) { } return; }
      var items = parseAi(txt, para);
      if (!items.length) throw new Error('empty');
      aiRes = { items: items, para: para }; aiNote = '';
      AI.busy = false; aiProgress(false); $('#goBtn').disabled = false;
      renderOut();
      try { inst.destroy && inst.destroy(); } catch (e) { }
    }).catch(function (e) {
      try { inst && inst.destroy && inst.destroy(); } catch (e2) { }
      if (my !== AI.seq) return;
      if (e && e.name === 'AbortError') { AI.busy = false; aiProgress(false); $('#goBtn').disabled = false; runA(); return; }
      console.warn('[' + SLUG + '] Chrome Summarizer failed, using the quick method:', e && (e.message || e.name));
      aiCheck();
      aiFallback('ai_fallback_err');
    });
  }

  /* =================================================================== files (.txt, PDF) */
  var pdfLibP = null, pdfWorker = null, lastFile = null;
  function loadScript(src, ok) {
    return new Promise(function (resolve, reject) {
      if (ok()) return resolve();
      var s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      var timer = setTimeout(function () { s.remove(); reject(new Error('timeout')); }, 60000);
      s.onload = function () { clearTimeout(timer); ok() ? resolve() : reject(new Error('missing')); };
      s.onerror = function () { clearTimeout(timer); s.remove(); reject(new Error('load failed')); };
      document.head.appendChild(s);
    });
  }
  function ensurePdf() {
    if (!pdfLibP) {
      pdfLibP = loadScript(PDF.lib, function () { return !!window.pdfjsLib; }).then(function () {
        var lib = window.pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc = PDF.worker;
        if (!pdfWorker) {
          /* A Blob worker that imports the CDN worker works on https and from a downloaded folder (file://). */
          try {
            var url = URL.createObjectURL(new Blob(["importScripts('" + PDF.worker + "');"], { type: 'application/javascript' }));
            pdfWorker = new lib.PDFWorker({ port: new Worker(url, { name: 'ss-pdf' }) });
          } catch (e) { pdfWorker = null; }
        }
        return lib;
      });
      pdfLibP.catch(function () { pdfLibP = null; });
    }
    return pdfLibP;
  }
  var fileState = null;   // { kind: 'busy'|'ok'|'err', key, vars, retry, ocr }
  function setFile(st) { fileState = st; renderFile(); }
  function renderFile() {
    var box = $('#fileBox');
    if (!fileState) { box.hidden = true; return; }
    box.hidden = false;
    box.className = 'callout small ss-file' + (fileState.kind === 'err' ? ' danger' : fileState.kind === 'ok' ? ' success' : '');
    $('#fileSpin').hidden = fileState.kind !== 'busy';
    var v = Object.assign({}, fileState.vars || {});
    $('#fileMsg').textContent = t(fileState.key, v) + (fileState.offline ? ' ' + t('err_offline') : '');
    $('#fileRetry').hidden = !fileState.retry;
    $('#fileOcr').hidden = !fileState.ocr;
    var pr = $('#fileProg');
    pr.hidden = !(fileState.kind === 'busy' && fileState.frac !== undefined);
    if (!pr.hidden) $('#fileBar').style.width = Math.round(fileState.frac * 100) + '%';
  }
  function setText(v, name) {
    var cut = v.length > MAX_CHARS;
    ta.value = cut ? v.slice(0, MAX_CHARS) : v;
    sampleLang = null; srcName = name || '';
    saveText(); renderInStats(); runA();
    return cut;
  }
  function openFile(f) {
    if (!f) return;
    lastFile = f;
    var name = f.name || '';
    var isPdf = /\.pdf$/i.test(name) || f.type === 'application/pdf';
    var isTxt = /\.(txt|text|md|csv|tsv|srt|vtt|log)$/i.test(name) || /^text\//.test(f.type || '');
    if (!isPdf && !isTxt) { setFile({ kind: 'err', key: 'err_file' }); return; }
    var limit = isPdf ? MAX_PDF_MB : MAX_TXT_MB;
    if (f.size > limit * 1024 * 1024) { setFile({ kind: 'err', key: 'err_big', vars: { n: fmt(limit) } }); return; }
    if (isTxt) {
      EDU.readText(f).then(function (txt) {
        var cut = setText(txt.replace(/^\uFEFF/, ''), name);
        setFile({ kind: 'ok', key: cut ? 'text_cut' : 'file_done', vars: { name: name, n: fmt(MAX_CHARS) } });
      }, function () { setFile({ kind: 'err', key: 'err_file' }); });
      return;
    }
    setFile({ kind: 'busy', key: 'pdf_loading' });
    ensurePdf().then(function (lib) {
      setFile({ kind: 'busy', key: 'pdf_opening', vars: { name: name } });
      return f.arrayBuffer().then(function (buf) {
        var params = { data: new Uint8Array(buf), isEvalSupported: false, cMapUrl: PDF.cmaps, cMapPacked: true, standardFontDataUrl: PDF.fonts };
        if (pdfWorker) params.worker = pdfWorker;
        return lib.getDocument(params).promise.catch(function (e) {
          throw { pdf: true, pw: !!(e && e.name === 'PasswordException') };
        });
      }).then(function (doc) {
        var n = Math.min(doc.numPages, MAX_PDF_PAGES), pages = [], i = 0;
        function next() {
          i++;
          if (i > n) return Promise.resolve();
          setFile({ kind: 'busy', key: 'pdf_reading', vars: { i: fmt(i), n: fmt(n) }, frac: (i - 1) / n });
          return doc.getPage(i).then(function (pg) { return pg.getTextContent(); }).then(function (tc) {
            var s = '';
            tc.items.forEach(function (it) {
              if (typeof it.str !== 'string') return;
              s += it.str;
              if (it.hasEOL) s += '\n';
            });
            pages.push(s);
          }, function () { pages.push(''); }).then(function () { return new Promise(function (r) { setTimeout(r, 0); }); }).then(next);
        }
        return next().then(function () {
          try { doc.destroy(); } catch (e) { }
          var txt = pages.join('\n\n');
          var letters = (txt.match(RE_TOKEN) || []).join('').length;
          if (letters < 20 * Math.max(1, Math.min(n, 3))) { setFile({ kind: 'err', key: 'err_pdf_scan', ocr: true }); return; }
          var cut = setText(txt, name);
          setFile({ kind: 'ok', key: cut ? 'text_cut' : (doc.numPages > n ? 'pdf_many' : 'pdf_done'), vars: { n: fmt(cut ? MAX_CHARS : n), name: name } });
        });
      });
    }, function (e) {
      console.warn('[' + SLUG + '] pdf.js failed to load:', e && e.message);
      setFile({ kind: 'err', key: 'err_pdf_lib', retry: true, offline: navigator.onLine === false });
      return 'handled';
    }).catch(function (e) {
      if (e === 'handled') return;
      if (e && e.pdf) setFile({ kind: 'err', key: e.pw ? 'err_pdf_pw' : 'err_pdf_bad' });
      else { console.warn('[' + SLUG + ']', e); setFile({ kind: 'err', key: 'err_pdf_bad' }); }
    });
  }

  /* =================================================================== events */
  ta.addEventListener('input', function () {
    sampleLang = null; srcName = '';
    if (fileState && fileState.kind !== 'busy') setFile(null);
    saveText(); renderInStats();
    schedule(ta.value.length > 30000 ? 700 : 300);
  });
  $('#sampleBtn').addEventListener('click', function () {
    ta.value = sampleText(EDU.lang); sampleLang = EDU.lang; srcName = '';
    setFile(null); saveText(); renderInStats(); runA();
  });
  $('#clearBtn').addEventListener('click', function () {
    ta.value = ''; sampleLang = null; srcName = '';
    setFile(null); saveText(); renderInStats(); runA(); ta.focus();
  });
  $('#fileIn').addEventListener('change', function () {
    var f = this.files && this.files[0];
    this.value = '';
    openFile(f);
  });
  $('#fileRetry').addEventListener('click', function () { if (lastFile) openFile(lastFile); });
  var inCard = $('#inCard'), dragDepth = 0;
  inCard.addEventListener('dragenter', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); dragDepth++; inCard.classList.add('ss-drag'); } });
  inCard.addEventListener('dragover', function (e) { if (dragDepth) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
  inCard.addEventListener('dragleave', function () { if (dragDepth && --dragDepth === 0) inCard.classList.remove('ss-drag'); });
  inCard.addEventListener('drop', function (e) {
    if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
    e.preventDefault(); dragDepth = 0; inCard.classList.remove('ss-drag');
    openFile(e.dataTransfer.files[0]);
  });

  $$('#modeSeg button').forEach(function (b) {
    b.addEventListener('click', function () { S.mode = b.dataset.mode; saveSettings(); renderLen(); runA(); });
  });
  $('#lenRange').addEventListener('input', function () {
    var v = +this.value;
    if (S.mode === 'pct') S.pct = v; else S.n = v;
    saveSettings(); renderLen(); schedule(80);
  });
  $$('#engSeg button').forEach(function (b) {
    b.addEventListener('click', function () { S.engine = b.dataset.eng; saveSettings(); renderEngine(); if (S.engine === 'quick') runA(); });
  });
  $$('#typeSeg button').forEach(function (b) {
    b.addEventListener('click', function () { S.aiType = b.dataset.type; saveSettings(); renderEngine(); });
  });
  $('#goBtn').addEventListener('click', function () {
    if (engine() === 'chrome' && aiApi()) runB(); else runA();
    if (window.matchMedia && window.matchMedia('(max-width: 979px)').matches) $('#outHead').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#aiCancel').addEventListener('click', function () { runA(); });   // runA stops the Chrome AI run (aiStop)
  $$('#outTabs button').forEach(function (b) {
    b.addEventListener('click', function () { S.tab = b.dataset.tab; saveSettings(); renderOut(); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var other = $$('#outTabs button').filter(function (x) { return x !== b; })[0];
      other.click(); other.focus(); e.preventDefault();
    });
  });

  function exportText() {
    var items = pointsList(), lines = [];
    var title = srcName ? srcName : (sampleLang ? C().title : '');
    lines.push(t('out_h') + (title ? ': ' + title : ''));
    lines.push('');
    if (aiRes && aiRes.para) lines.push(items.join(' '));
    else items.forEach(function (p, i) { lines.push((i + 1) + '. ' + p); });
    if (R && R.keywords.length) { lines.push(''); lines.push(t('keywords_h') + ': ' + R.keywords.map(function (k) { return k.word; }).join(', ')); }
    lines.push('');
    lines.push(aiRes ? t('by_chrome') : t('by_quick'));
    return lines.join('\n');
  }
  $('#copyBtn').addEventListener('click', function () { EDU.copy(exportText()); });
  $('#dlBtn').addEventListener('click', function () {
    var base = (srcName || 'summary').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 50) || 'summary';
    EDU.download(base + (srcName ? '-summary' : '') + '.txt', '\uFEFF' + exportText().replace(/\n/g, '\r\n'), 'text/plain');
  });
  $('#printBtn').addEventListener('click', function () {
    var prev = S.tab;
    if (S.tab !== 'points') { S.tab = 'points'; renderOut(); }
    $('#printTitle').textContent = t('app_title') + (srcName ? ' · ' + srcName : '');
    window.print();
    if (prev !== S.tab) { S.tab = prev; renderOut(); }
  });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    Object.assign(S, DEF); saveSettings();
    ta.value = sampleText(EDU.lang); sampleLang = EDU.lang; srcName = '';
    setFile(null); saveText(); renderLen(); renderEngine(); renderInStats(); runA();
  });

  EDU.onLang(function () {
    if (sampleLang && sampleLang !== EDU.lang && ta.value === sampleText(sampleLang)) {
      ta.value = sampleText(EDU.lang); sampleLang = EDU.lang; saveText(); runA();
    }
    renderLen(); renderEngine(); renderInStats(); renderFile(); renderOut();
  });

  renderLen(); renderEngine(); renderInStats(); runA();
  aiCheck();
})();
