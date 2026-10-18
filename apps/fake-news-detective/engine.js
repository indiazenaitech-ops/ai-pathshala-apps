/* Fake News Detective: the message-checker engine (pure functions, no DOM).
   FND.analyze(text, lists) looks for the patterns that misleading forwards share: urgency words, "forward to
   10 people", SHOUTING, !!!, shortened links, look-alike domains, money / OTP requests, "100% true", miracle
   cures, free gifts, strong emotion and news with no source. It returns the flags found, where they are in the
   text (for highlighting) and a caution level. It is a pattern check only: it can never say a message is true.
   Word lists come from content.js (per language); the English list is always merged in because Indian
   forwards mix English into every language. */
window.FND = (function () {
  'use strict';

  var SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'cutt.ly', 'rb.gy', 'is.gd', 'v.gd', 'shorturl.at', 'tiny.cc', 's.id',
    't.ly', 'rebrand.ly', 'ow.ly', 'buff.ly', 'bit.do', 'soo.gd', 'shorte.st', 'adf.ly', 'clck.ru', 'tr.im', 'short.io', 'lnkd.in',
    'qr.ae', 'wa.link', 'tinyurl.co', 'cutt.us', 'u.to', 'x.co', 'surl.li', 'shorturl.com', 'urlz.fr', 'bitly.com', 'rb.gy'];
  /* endings that honest Indian organisations almost never use, and that free / throw-away domains love */
  var SUS_TLD = ['xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'buzz', 'club', 'online', 'site', 'live', 'pw', 'win', 'vip', 'icu',
    'cam', 'bar', 'click', 'link', 'loan', 'work', 'fun', 'rest', 'monster', 'quest', 'sbs', 'cfd', 'lol', 'mom', 'best', 'today',
    'cyou', 'shop', 'store', 'cloud', 'space', 'website', 'tech', 'host', 'press', 'in.net', 'co.in.net', 'gov.in.net', 'wiki', 'zip', 'mov'];
  /* last labels we accept as a web address at all (so "today.Please" in a sentence is not a link) */
  var KNOWN_TLD = ['com', 'in', 'org', 'net', 'co', 'info', 'gov', 'edu', 'ac', 'nic', 'biz', 'io', 'me', 'app', 'dev', 'ai', 'us', 'uk', 'ly',
    'gl', 'gd', 'gy', 'id', 'cc', 'at', 'ru', 'ae', 'im', 'st', 'do', 'be', 'to', 'fr', 'li', 'tv', 'pk', 'bd', 'lk', 'np', 'sg', 'de', 'it',
    'es', 'nl', 'ca', 'au', 'jp', 'cn', 'kr', 'br', 'za', 'ng', 'ke', 'eu', 'asia', 'mobi', 'name', 'pro', 'news', 'blog', 'page', 'xyz',
    'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'buzz', 'club', 'online', 'site', 'live', 'pw', 'win', 'vip', 'icu', 'cam', 'bar', 'click', 'link',
    'loan', 'work', 'fun', 'rest', 'monster', 'quest', 'sbs', 'cfd', 'lol', 'mom', 'best', 'today', 'cyou', 'shop', 'store', 'cloud',
    'space', 'website', 'tech', 'host', 'press', 'wiki', 'zip', 'mov', 'fit', 'life', 'world', 'one', 'run', 'mart', 'money', 'cash',
    'bank', 'help', 'support', 'care', 'center', 'service', 'services', 'solutions'];
  /* brand words people copy into fake addresses, and the real domains they belong to */
  var BRANDS = {
    sbi: ['sbi.co.in', 'onlinesbi.sbi', 'sbi'], onlinesbi: ['sbi.co.in', 'onlinesbi.sbi'], yono: ['sbi.co.in', 'onlinesbi.sbi'],
    hdfc: ['hdfcbank.com', 'hdfc.com'], icici: ['icicibank.com', 'iciciprulife.com'], axisbank: ['axisbank.com'], kotak: ['kotak.com'],
    pnb: ['pnbindia.in'], bankofbaroda: ['bankofbaroda.in'], canara: ['canarabank.com'], unionbank: ['unionbankofindia.co.in'],
    paytm: ['paytm.com', 'paytmbank.com'], phonepe: ['phonepe.com'], gpay: ['google.com', 'pay.google.com'], googlepay: ['google.com'],
    bhim: ['bhimupi.org.in', 'npci.org.in'], npci: ['npci.org.in'], whatsapp: ['whatsapp.com', 'wa.me', 'whatsapp.net'],
    google: ['google.com', 'google.co.in', 'goo.gl', 'google.in'], gmail: ['gmail.com', 'google.com'], youtube: ['youtube.com', 'youtu.be'],
    facebook: ['facebook.com', 'fb.com', 'fb.me'], instagram: ['instagram.com'], twitter: ['twitter.com', 'x.com'], telegram: ['telegram.org', 't.me'],
    amazon: ['amazon.in', 'amazon.com', 'amzn.to', 'amzn.in'], flipkart: ['flipkart.com', 'fkrt.it'], myntra: ['myntra.com'], meesho: ['meesho.com'],
    swiggy: ['swiggy.com'], zomato: ['zomato.com'], irctc: ['irctc.co.in'], indiapost: ['indiapost.gov.in'], uidai: ['uidai.gov.in'],
    aadhaar: ['uidai.gov.in'], aadhar: ['uidai.gov.in'], pib: ['pib.gov.in'], ncert: ['ncert.nic.in'], cbse: ['cbse.gov.in', 'cbse.nic.in'],
    airtel: ['airtel.in'], jio: ['jio.com'], bsnl: ['bsnl.co.in'], vodafone: ['myvi.in', 'vodafoneidea.com'], netflix: ['netflix.com'],
    epfo: ['epfindia.gov.in'], incometax: ['incometax.gov.in'], rbi: ['rbi.org.in'], lic: ['licindia.in'], sebi: ['sebi.gov.in'],
    microsoft: ['microsoft.com', 'live.com', 'outlook.com'], apple: ['apple.com', 'icloud.com'], samsung: ['samsung.com'],
    scholarship: ['scholarships.gov.in'], digilocker: ['digilocker.gov.in'], umang: ['umang.gov.in'], cowin: ['cowin.gov.in'],
    pmkisan: ['pmkisan.gov.in'], ayushman: ['pmjay.gov.in', 'nha.gov.in'], ndtv: ['ndtv.com'], aajtak: ['aajtak.in'], bbc: ['bbc.com', 'bbc.co.uk']
  };
  /* words that honest addresses rarely carry but fake "bank / gift / job" pages always do */
  var SUS_WORDS = ['kyc', 'verify', 'verification', 'update', 'secure', 'login', 'signin', 'account', 'support', 'helpdesk', 'customer', 'offer',
    'gift', 'free', 'prize', 'lucky', 'recharge', 'reward', 'cashback', 'claim', 'bonus', 'win', 'winner', 'lottery', 'alert', 'block', 'unblock',
    'suspend', 'refund', 'otp', 'wallet', 'pay-', '-pay', 'upi', 'job', 'recruit', 'vacancy', 'loan', 'scheme', 'yojana', 'sarkari', 'pm-', 'official',
    'track', 'parcel', 'delivery', 'customs', 'tax-', '-tax', 'bank-', '-bank', 'helpline', 'care-', '-care'];
  var TRUSTED_END = ['gov.in', 'nic.in', 'ac.in', 'edu.in', 'res.in', 'org.in', 'gov', 'edu', 'mil'];
  var BRAND_KEYS = Object.keys(BRANDS).sort(function (a, b) { return b.length - a.length; });
  var WEIGHTS = { urgent: 2, fwd: 2, shortlink: 2, lookalike: 3, otp: 3, money: 2, gift: 2, true100: 2, miracle: 2, caps: 1, exclaim: 1, emo: 1, nosource: 1 };
  var ORDER = ['lookalike', 'otp', 'shortlink', 'money', 'gift', 'urgent', 'fwd', 'true100', 'miracle', 'caps', 'exclaim', 'emo', 'nosource'];
  var LIST_CODES = ['urgent', 'fwd', 'money', 'otp', 'true100', 'miracle', 'gift', 'emo'];
  var URL_RE = /(?:https?:\/\/)?(?:www\.)?((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24})(?::\d{2,5})?((?:\/|\?)[^\s<>"'()ऀ-෿؀-ۿ]*)?/gi;
  var EMOJI_RE = /[\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F300}-\u{1F5FF}]️?/gu;
  var STRONG_EMOJI = /[\u{1F631}\u{1F62D}\u{1F621}\u{1F64F}\u{1F525}\u{1F494}\u{1F622}\u{1F628}\u{1F92F}\u{1F6A8}\u{26A0}\u{1F4A5}\u{2757}\u{203C}\u{1F449}\u{1F446}\u{1F198}\u{1F62B}\u{1F630}\u{1F61F}\u{1F624}\u{1F4A2}\u{1F3C3}]️?/gu;

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* one pattern term -> RegExp. "*" at the end of a Latin word allows a suffix (forward* = forwarded),
     "#" stands for a number, spaces match any white space. Latin terms get word boundaries; terms in Indian
     scripts match inside words too (suffixes stick to the word in these languages). */
  var cache = {};
  function termRegex(term) {
    if (cache[term]) return cache[term];
    var t = term.trim(), openEnd = /\*$/.test(t);
    var latinStart = /^[a-z0-9]/i.test(t), latinEnd = /[a-z0-9]$/i.test(t);
    var body = esc(t).replace(/\\\*/g, '[a-z]*').replace(/\\#/g, '#').replace(/#/g, '\\d[\\d,.]*').replace(/\s+/g, '\\s+');
    var re = (latinStart ? '(?<![a-z0-9])' : '') + body + (latinEnd && !openEnd ? '(?![a-z0-9\'\u2019])' : '');
    cache[term] = new RegExp(re, 'giu');
    return cache[term];
  }
  /* "never share your OTP" is advice, not a request: a hit right after a negation is dropped */
  var NEG_RE = /(?<!\p{L})(never|do not|don't|dont|won't|will not|not|no one|nobody|without|kabhi|nahi|nahin|mat|कभी|नहीं|मत|না|কখনো|नका|कधीही|नाही|ક્યારેય|નહીં|નહિ|ਕਦੇ|ਨਾ|ਨਹੀਂ|କେବେ|ନାହିଁ|ஒருபோதும்|வேண்டாம்|கூடாது|ఎప్పుడూ|వద్దు|కాదు|ಎಂದಿಗೂ|ಬೇಡ|ಬಾರದು|ഒരിക്കലും|വേണ്ട|അരുത്|کبھی|نہ|مت|نہیں)(?!\p{L})[^\p{L}]*(?:\p{L}+[^\p{L}]+){0,3}$/iu;
  function negated(text, s) { return NEG_RE.test(text.slice(Math.max(0, s - 40), s)); }

  function splitList(s) { return String(s || '').split('|').map(function (x) { return x.trim(); }).filter(Boolean); }

  /* lists: { urgent: 'a|b|c', fwd: ..., ... } possibly already merged by the caller */
  function mergeLists(a, b) {
    var out = {};
    [a, b].forEach(function (L) {
      if (!L) return;
      Object.keys(L).forEach(function (k) { out[k] = (out[k] ? out[k] + '|' : '') + String(L[k] || ''); });
    });
    return out;
  }

  function findTerms(text, listStr) {
    var hits = [], seen = {};
    splitList(listStr).forEach(function (term) {
      var re = termRegex(term), m;
      re.lastIndex = 0;
      while ((m = re.exec(text))) {
        var key = m.index + ':' + m[0].length;
        if (!seen[key] && m[0].length) { seen[key] = 1; hits.push({ s: m.index, e: m.index + m[0].length, txt: m[0] }); }
        if (m[0].length === 0) re.lastIndex++;
        if (hits.length > 40) break;
      }
    });
    hits.sort(function (x, y) { return x.s - y.s; });
    return hits;
  }

  function normHost(h) { return h.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e').replace(/5/g, 's').replace(/4/g, 'a').replace(/7/g, 't').replace(/rn/g, 'm').replace(/vv/g, 'w'); }
  function endsWithDomain(host, dom) { return host === dom || host.slice(-(dom.length + 1)) === '.' + dom; }
  function lastLabel(host) { var p = host.split('.'); return p[p.length - 1]; }
  function tldOf(host) {
    var p = host.split('.'), last = p[p.length - 1];
    if (p.length >= 3 && ['co', 'gov', 'nic', 'ac', 'org', 'net', 'edu', 'in'].indexOf(p[p.length - 2]) >= 0) return p.slice(-2).join('.');
    return last;
  }

  /* classify one host: 'short' | 'lookalike' | null, with a reason code */
  function judgeHost(host) {
    host = host.toLowerCase().replace(/\.$/, '');
    if (KNOWN_TLD.indexOf(lastLabel(host)) < 0) return null;
    if (SHORTENERS.indexOf(host) >= 0) return { kind: 'short' };
    if (TRUSTED_END.some(function (d) { return endsWithDomain(host, d); })) return null;
    var tld = tldOf(host), labels = host.split('.');
    if (SUS_TLD.indexOf(tld) >= 0 || SUS_TLD.indexOf(labels.slice(-2).join('.')) >= 0 || SUS_TLD.indexOf(labels.slice(-3).join('.')) >= 0) return { kind: 'lookalike', why: 'tld' };
    var flat = host.replace(/[-.]/g, ''), nflat = normHost(flat);
    /* "gov" anywhere in an address that is not a real .gov.in / .nic.in site */
    if (/gov|govt|sarkar|sarkari|nic$/.test(nflat)) return { kind: 'lookalike', why: 'gov' };
    for (var i = 0; i < BRAND_KEYS.length; i++) {
      var b = BRAND_KEYS[i];
      if (nflat.indexOf(b) < 0) continue;
      var ok = BRANDS[b].some(function (d) { return endsWithDomain(host, d); });
      if (ok) return null;
      return { kind: 'lookalike', why: flat.indexOf(b) < 0 ? 'digits' : 'brand', brand: b };
    }
    var name = labels.slice(0, -1).join('-');
    for (var j = 0; j < SUS_WORDS.length; j++) {
      var w = SUS_WORDS[j];
      if (w.indexOf('-') >= 0 ? name.indexOf(w) >= 0 : (name === w || name.split('-').indexOf(w) >= 0 || (w.length >= 5 && name.indexOf(w) >= 0))) return { kind: 'lookalike', why: 'words' };
    }
    if (/[0-9]/.test(labels[0]) && /[a-z]/.test(labels[0]) && normHost(labels[0]) !== labels[0]) return { kind: 'lookalike', why: 'digits' };
    return null;
  }

  function findLinks(text) {
    var out = [], m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(text))) {
      var host = m[1].toLowerCase();
      if (KNOWN_TLD.indexOf(lastLabel(host)) < 0) continue;
      /* an e-mail address is not a link */
      if (m.index > 0 && text[m.index - 1] === '@') continue;
      var end = m.index + m[0].length;
      while (end > m.index && /[.,;:!?)]/.test(text[end - 1])) end--;
      out.push({ s: m.index, e: end, txt: text.slice(m.index, end), host: host, judge: judgeHost(host) });
      if (out.length > 20) break;
    }
    return out;
  }

  function capsInfo(text) {
    var latin = (text.match(/[A-Za-z]/g) || []).length, upper = (text.match(/[A-Z]/g) || []).length;
    var words = [], re = /[A-Z][A-Z'’]{3,}/g, m;
    while ((m = re.exec(text))) {
      /* skip common acronyms that are fine in capitals */
      if (/^(OTP|UPI|KYC|GST|PAN|ATM|CVV|PIN|SMS|NCERT|CBSE|PIB|WHO|NASA|ISRO|IIT|NEET|CUET|JEE|HTML|CSV|PDF|UPSC|SSC|MLA|MP|CEO|CM|PM|RBI|SBI|HDFC|ICICI|ISI|FSSAI|AIIMS)$/.test(m[0])) continue;
      words.push({ s: m.index, e: m.index + m[0].length, txt: m[0] });
    }
    var run = 0, bestRun = 0, lastEnd = -1;
    words.forEach(function (w) {
      var gap = text.slice(lastEnd, w.s);
      run = lastEnd >= 0 && /^[^A-Za-z]{0,4}$/.test(gap) ? run + 1 : 1;
      bestRun = Math.max(bestRun, run); lastEnd = w.e;
    });
    return { latin: latin, upper: upper, ratio: latin ? upper / latin : 0, words: words, run: bestRun };
  }

  function mergeRanges(ranges) {
    ranges.sort(function (a, b) { return a.s - b.s || b.e - a.e; });
    var out = [];
    ranges.forEach(function (r) {
      var last = out[out.length - 1];
      if (last && r.s < last.e) { last.e = Math.max(last.e, r.e); return; }
      out.push({ s: r.s, e: r.e, code: r.code });
    });
    return out;
  }

  function analyze(text, lists) {
    text = String(text || '');
    lists = lists || {};
    var flags = {}, ranges = [];
    function add(code, hit, extra) {
      var f = flags[code] || (flags[code] = { code: code, weight: WEIGHTS[code] || 1, hits: [], extra: extra || null });
      if (hit) { f.hits.push(hit); ranges.push({ s: hit.s, e: hit.e, code: code }); }
    }
    var wordCount = (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu) || []).length;

    /* word lists */
    LIST_CODES.forEach(function (code) {
      findTerms(text, lists[code]).forEach(function (h) {
        if ((code === 'otp' || code === 'money' || code === 'fwd') && negated(text, h.s)) return;
        add(code, h);
      });
    });

    /* links */
    var links = findLinks(text);
    links.forEach(function (l) {
      if (!l.judge) return;
      if (l.judge.kind === 'short') add('shortlink', { s: l.s, e: l.e, txt: l.txt });
      else add('lookalike', { s: l.s, e: l.e, txt: l.txt, why: l.judge.why, brand: l.judge.brand || '' });
    });

    /* SHOUTING */
    var caps = capsInfo(text);
    if ((caps.latin >= 12 && caps.ratio >= 0.5 && caps.words.length) || caps.run >= 3) {
      caps.words.forEach(function (w) { add('caps', w); });
      if (!flags.caps) add('caps', null);
    }

    /* !!! and ??? */
    var exclCount = (text.match(/[!‼❗❕]/g) || []).length, m;
    var runRe = /[!‼❗❕?]{2,}/g, runs = [];
    while ((m = runRe.exec(text))) runs.push({ s: m.index, e: m.index + m[0].length, txt: m[0] });
    if (exclCount >= 3 || runs.some(function (r) { return /[!‼❗❕]/.test(r.txt); })) {
      runs.forEach(function (r) { add('exclaim', r); });
      if (!flags.exclaim) add('exclaim', null);
    }

    /* strong emotion: emoji storms (words from the "emo" list were added above) */
    var strong = 0, emRe = new RegExp(STRONG_EMOJI.source, 'gu'), emHits = [];
    while ((m = emRe.exec(text))) { strong++; emHits.push({ s: m.index, e: m.index + m[0].length, txt: m[0] }); }
    var emojiTotal = (text.match(EMOJI_RE) || []).length;
    if (strong >= 3 || emojiTotal >= 6) emHits.forEach(function (h) { add('emo', h); });
    if ((strong >= 3 || emojiTotal >= 6) && !flags.emo) add('emo', null);

    /* news with nobody behind it: claim words, but no "who / when / where to check" and no link at all */
    var claims = findTerms(text, lists.claim), sources = findTerms(text, lists.source);
    var hasDate = /\b(19|20)\d\d\b|\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/.test(text);
    var distinctClaims = {};
    claims.forEach(function (h) { distinctClaims[h.txt.toLowerCase()] = 1; });
    if (wordCount >= 12 && Object.keys(distinctClaims).length >= 2 && !sources.length && !links.length && !hasDate) {
      claims.slice(0, 3).forEach(function (h) { add('nosource', h); });
    }

    var list = ORDER.filter(function (c) { return flags[c]; }).map(function (c) { return flags[c]; });
    /* three or more hits of the same kind count a little extra (a message shouting "win" four times) */
    var points = list.reduce(function (s, f) { return s + f.weight + (f.hits.length >= 3 ? 1 : 0); }, 0);
    var level = (points >= 5 || list.length >= 3) ? 'high' : points >= 1 ? 'medium' : 'low';
    return {
      text: text, flags: list, points: points, level: level, ranges: mergeRanges(ranges),
      stats: { words: wordCount, latin: caps.latin, upper: caps.upper, capsRatio: caps.ratio, excl: exclCount, links: links.map(function (l) { return l.host; }), emojis: emojiTotal }
    };
  }

  return { analyze: analyze, judgeHost: judgeHost, findLinks: findLinks, mergeLists: mergeLists, WEIGHTS: WEIGHTS, ORDER: ORDER, LIST_CODES: LIST_CODES };
})();
