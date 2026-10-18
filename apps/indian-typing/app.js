/* Type in Indian Languages: UI. Engine: translit.js + typing.js (ITYPE), converter: convert.js (ISCRIPT).
   Everything runs on this device; nothing is sent anywhere. */
(function () {
  'use strict';
  var SLUG = 'indian-typing';
  var IT = window.ITYPE, IS = window.ISCRIPT, CORE = window.ITYPE_CORE;
  var t = EDU.t, el = EDU.el, $ = EDU.$;
  var store = EDU.store(SLUG);

  var NATIVE = { hi: 'हिन्दी', mr: 'मराठी', sa: 'संस्कृतम्', ne: 'नेपाली', bn: 'বাংলা', as: 'অসমীয়া', pa: 'ਪੰਜਾਬੀ', gu: 'ગુજરાતી',
    or: 'ଓଡ଼ିଆ', ta: 'தமிழ்', te: 'తెలుగు', kn: 'ಕನ್ನಡ', ml: 'മലയാളം', ur: 'اردو' };
  var FONT = {
    deva: '"Noto Sans Devanagari", "Nirmala UI", "Mangal", "Kohinoor Devanagari", sans-serif',
    beng: '"Noto Sans Bengali", "Nirmala UI", "Vrinda", "Shonar Bangla", sans-serif', asm: '"Noto Sans Bengali", "Nirmala UI", "Vrinda", sans-serif',
    guru: '"Noto Sans Gurmukhi", "Nirmala UI", "Raavi", sans-serif', gujr: '"Noto Sans Gujarati", "Nirmala UI", "Shruti", sans-serif',
    orya: '"Noto Sans Oriya", "Noto Sans Odia", "Nirmala UI", "Kalinga", sans-serif', taml: '"Noto Sans Tamil", "Nirmala UI", "Latha", sans-serif',
    telu: '"Noto Sans Telugu", "Nirmala UI", "Gautami", sans-serif', knda: '"Noto Sans Kannada", "Nirmala UI", "Tunga", sans-serif',
    mlym: '"Noto Sans Malayalam", "Nirmala UI", "Kartika", sans-serif', arab: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", "Noto Naskh Arabic", serif',
    roman: '"Noto Sans", system-ui, sans-serif', keys: 'ui-monospace, "Cascadia Code", Consolas, monospace'
  };
  var WEBFONT = { deva: 'Noto Sans Devanagari', beng: 'Noto Sans Bengali', asm: 'Noto Sans Bengali', guru: 'Noto Sans Gurmukhi', gujr: 'Noto Sans Gujarati',
    orya: 'Noto Sans Oriya', taml: 'Noto Sans Tamil', telu: 'Noto Sans Telugu', knda: 'Noto Sans Kannada', mlym: 'Noto Sans Malayalam', arab: 'Noto Nastaliq Urdu' };
  var SAMPLE = {
    hi: 'namaste! meraa naam priyaa hai| aap kaise hain?\nkal subah 10 baje dukaan khulegii|', mr: 'namaskaar! maajhe naav aditii aahe| tumhii kase aahaat?',
    sa: 'vasudhaiva kuTumbakam^|', ne: 'namaste! tapaaIMlaaI kasto chha?', bn: 'namaskaar! aamaar naam riyaa| aapani keman aachhen?',
    as: 'namaskaar! mor naam priyaa|', pa: 'sat srii akaal! meraa naaM simaran hai|', gu: 'kem chho? maaruM naam priyaa chhe.',
    or: 'namaskaara! mora naa~ priyaa|', ta: 'vaNakkam! en peyar priyaa. neengaL eppaDi irukkiReergaL?', te: 'namaskaaram! naa pEru priya. meeru elaa unnaaru?',
    kn: 'namaskaara! nanna hesaru priyaa. neevu hEgiddeeri?', ml: 'namaskaaram! ente pEru priya. sukhamaaNO?', ur: 'aadaab! meraa naam priyaa hai. aap kaise hain?'
  };
  var EXAMPLES = {
    deva: ['namaste', 'bhaarat', 'kRShNa', 'vidyaalay', 'hindii', 'dhanyavaad', 'shrii', 'x', 'gyaan', 'pyaar', 'zindagii', 'la.Dakaa'],
    beng: ['bhaarat', 'aamaar', 'baa~Nlaa', 'ganga', 'maayaa', 'ut^sab', 'rabiindranaath', 'shubha'],
    guru: ['pa~njaab', 'pakkaa', 'sikkh', 'gurmukhii', 'muuMh', 'shabad', 'khushii', 'kann'],
    gujr: ['gujaraatii', 'kem chho', 'aMbaa', 'dhanyavaad', 'amadaavaad', 'saaruM'],
    orya: ['o.Diaa', 'jagannaath', 'priyaa', 'bhubaneshvar', 'dhanyavaad', 'wa'],
    taml: ['vaNakkam', 'tamizh', 'naan', 'anbu', 'nanri', 'engaL', 'kaatru', 'fan', 'pattam', 'veeDu'],
    telu: ['telugu', 'namaskaaram', 'andaru', 'amma', 'baagunnaaraa', 'hyderaabaad'],
    knda: ['kannaDa', 'bengaLuuru', 'namaskaara', 'hEgiddeeri', 'mysooru'],
    mlym: ['malayaaLam', 'ente', 'avan', 'kEraLam', 'santhOSham', 'kuttikaL', 'thamizh', 'paal'],
    arab: ['urdu', 'aap kaise hain', 'shukriyaa', 'pyaar', 'kitaab', 'haaN', 'Kush', 'aao']
  };
  var DEF_LANG = { en: 'hi', hi: 'hi', mr: 'mr', bn: 'bn', gu: 'gu', pa: 'pa', or: 'or', ta: 'ta', te: 'te', kn: 'kn', ml: 'ml', ur: 'ur' };
  var CONV_SAMPLE = 'भारत एक विशाल देश है। यहाँ अनेक भाषाएँ बोली जाती हैं।\nवणक्कम्! आप कैसे हैं?';

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool', wide: true });

  var DEF = { lang: null, mode: 'live', roman: null, inline: '', smart: true, cap: true, digits: false, fs: 1.5, tab: 'type', convIn: null, convTo: null };
  var S = Object.assign({}, DEF, store.get('state', {}));
  if (!IT.LANGS[S.lang]) S.lang = DEF_LANG[EDU.lang] || 'hi';
  if (S.mode !== 'inline') S.mode = 'live';
  if (['type', 'guide', 'conv'].indexOf(S.tab) < 0) S.tab = 'type';
  S.fs = EDU.clamp(+S.fs || 1.5, 1, 3.5);
  if (S.roman == null) S.roman = SAMPLE[S.lang];
  if (S.convIn == null) S.convIn = CONV_SAMPLE;
  if (IS.TARGETS.indexOf(S.convTo) < 0) S.convTo = defaultTarget();

  var roman = $('#roman'), out = $('#out'), convIn = $('#convIn'), convOut = $('#convOut');
  var timer = null, saveTimer = null, convTimer = null, lastPos = null;

  function sc() { return IT.LANGS[S.lang].sc; }
  function langName(l) { return t('lang_' + l); }
  function hasDict() { return !!IT.LANGS[S.lang].dict; }
  function opts() { return { smart: S.smart && hasDict(), capfix: S.cap, digits: S.digits }; }
  function conv(s) { return IT.convert(s, S.lang, opts()); }
  function defaultTarget() { var m = { bn: 'beng', pa: 'guru', gu: 'gujr', or: 'orya', ta: 'taml', te: 'telu', kn: 'knda', ml: 'mlym' }; return m[EDU.lang] || 'taml'; }

  /* ---------- saving */
  function saveNow() {
    clearTimeout(saveTimer); saveTimer = null;
    S.roman = roman.value; if (S.mode === 'inline') S.inline = out.value;
    S.convIn = convIn.value;
    var keep = {}; Object.keys(DEF).forEach(function (k) { keep[k] = S[k]; });
    ['roman', 'inline', 'convIn'].forEach(function (k) { if (String(keep[k] || '').length > 200000) keep[k] = ''; });
    store.set('state', keep);
  }
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 400); }
  window.addEventListener('pagehide', function () { if (saveTimer) saveNow(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && saveTimer) saveNow(); });

  /* ---------- fonts for the chosen script */
  var loaded = {};
  function applyFont() {
    var s = sc();
    document.getElementById('app').style.setProperty('--sf', FONT[s]);
    document.getElementById('app').style.setProperty('--fs', S.fs + 'rem');
    var f = WEBFONT[s];
    if (f && !loaded[f] && f !== (EDU.langInfo(EDU.lang).font) && !(location.protocol === 'file:' && !navigator.onLine)) {
      loaded[f] = 1;
      document.head.appendChild(el('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;600&display=swap' }));
    }
    var rtl = s === 'arab';
    out.dir = rtl ? 'rtl' : 'ltr';
    out.style.textAlign = rtl ? 'right' : 'left';
  }

  /* ---------- typing */
  function countWords(s) { var m = s.match(/[^\s।॥.,;:!?()"'‘’“”،؟۔\-]+/g); return m ? m.length : 0; }
  function stats() {
    var v = out.value;
    $('#stats').textContent = v ? t('stats', { chars: EDU.fmt(Array.from(v).length), words: EDU.fmt(countWords(v)) }) : '';
    $('#waBtn').href = 'https://wa.me/?text=' + encodeURIComponent(v);
  }
  function convertLive() {
    clearTimeout(timer); timer = null;
    if (S.mode !== 'live') return;
    out.value = conv(roman.value);
    stats();
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(convertLive, roman.value.length > 20000 ? 300 : 40); save(); }
  function fresh() { if (timer) convertLive(); }

  // One-box mode: the English word just before the cursor changes when a space or punctuation is typed
  var RUN = /((?:[A-Za-z~^_|#]|\.(?=[A-Za-z]))+)([.,!?;:)\]"'’”]*)$/;
  function inlineInput() {
    var pos = out.selectionStart, v = out.value;
    if (pos == null || pos < 1) { stats(); save(); return; }
    var ch = v[pos - 1];
    if (/[\s,!?;:)\]"]/.test(ch)) {
      var before = v.slice(0, pos - 1), m = RUN.exec(before);
      if (m && /[A-Za-z]/.test(m[1])) {
        var c = conv(m[1]) + IT.convert(m[2], S.lang, opts());
        var head = before.slice(0, m.index);
        out.value = head + c + v.slice(pos - 1);
        var caret = head.length + c.length + 1;
        out.setSelectionRange(caret, caret);
      }
    }
    stats(); save();
  }
  function convertAll() {
    var v = out.value.replace(/(?:[A-Za-z~^_|#]|\.(?=[A-Za-z]))+/g, function (w) { return /[A-Za-z]/.test(w) ? conv(w) : w; });
    out.value = v; stats(); save();
  }

  function applyMode() {
    var inl = S.mode === 'inline';
    $('#modeLive').setAttribute('aria-pressed', String(!inl));
    $('#modeInline').setAttribute('aria-pressed', String(inl));
    $('#romanCard').hidden = inl;
    $('#boxes').classList.toggle('inline', inl);
    $('#convertAllBtn').hidden = !inl;
    out.readOnly = !inl;
    $('#modeHelp').textContent = t(inl ? 'mode_help_inline' : 'mode_help_live');
    $('#palHelp').textContent = t(inl ? 'pal_help_inline' : 'pal_help_live');
    out.placeholder = inl ? t('out_ph_inline', { lang: langName(S.lang) }) : '';
    if (inl) { out.value = S.inline || ''; stats(); } else convertLive();
  }
  function setMode(m) {
    if (m === S.mode) return;
    if (S.mode === 'inline') S.inline = out.value;
    else if (m === 'inline' && !S.inline) S.inline = out.value ? out.value + ' ' : '';   // continue with what was typed
    S.mode = m; applyMode(); save();
  }

  function hint() {
    var h = $('#hint'); h.textContent = '';
    h.appendChild(document.createTextNode(t('hint_try') + ' '));
    EXAMPLES[sc() === 'asm' ? 'beng' : sc()].slice(0, 3).forEach(function (w, i) {
      if (i) h.appendChild(document.createTextNode(' · '));
      h.appendChild(el('span', { class: 'pair' }, el('kbd', { text: w }), ' → ', el('span', { class: 'it-preview', text: conv(w) })));
    });
  }

  /* ---------- letter keyboard */
  function uniq(a) { var seen = {}; return a.filter(function (c) { if (!c || seen[c]) return false; seen[c] = 1; return true; }); }
  function paletteGroups() {
    var s = sc(), chr = CORE.chr, cons = CORE.cons, VOW = CORE.VOW, d = CORE.S[s];
    if (s === 'arab') return [
      ['g_con', 'ا آ ب پ ت ٹ ث ج چ ح خ د ڈ ذ ر ڑ ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن ں و ہ ھ ء ی ے ئ ؤ'.split(' ')],
      ['g_sig', ['َ', 'ِ', 'ُ', 'ّ', 'ً', 'ٰ']], ['g_pun', ['،', '؟', '۔', '؛', '٪']], ['g_num', '۰۱۲۳۴۵۶۷۸۹'.split('')]];
    var vowNames = d.south ? ['a', 'aa', 'i', 'ii', 'u', 'uu', 'R', 'es', 'e', 'ai', 'os', 'o', 'au'] : ['a', 'aa', 'i', 'ii', 'u', 'uu', 'R', 'e', 'ai', 'o', 'au', 'aw'];
    var vowels = uniq(vowNames.map(function (v) { return chr(s, VOW[v][0]); }).filter(function (c) { return c.length === 1; }));
    var mat = uniq(vowNames.slice(1).map(function (v) { var m = chr(s, VOW[v][1]); return m && m.length === 1 && /\p{M}/u.test(m) ? m : ''; }));
    var cs = []; for (var o = 0x15; o <= 0x39; o++) cs.push(chr(s, o));
    cs = uniq(cs.filter(function (c) { return c && /\p{L}/u.test(c[0]); }));
    var extra = [];
    if (d.nukta) [0x15, 0x16, 0x17, 0x1C, 0x21, 0x22, 0x2B, 0x2F].forEach(function (o) { extra.push(cons(s, o, true).normalize('NFC')); });
    extra = extra.concat({ deva: ['क्ष', 'त्र', 'ज्ञ', 'श्र', 'ऱ', 'ळ', 'ॐ'], beng: ['ক্ষ', 'জ্ঞ', 'ৎ', 'ৰ', 'ৱ'], asm: ['ক্ষ', 'ৎ', 'ৰ', 'ৱ'], guru: ['ੲ', 'ੳ', 'ੴ'],
      gujr: ['ક્ષ', 'જ્ઞ', 'ૐ'], orya: ['କ୍ଷ', 'ୟ', 'ୱ'], taml: ['க்ஷ', 'ஶ', 'ஸ்ரீ', 'ஃ'], telu: ['క్ష', 'ఱ'], knda: ['ಕ್ಷ', 'ಱ', 'ೞ'], mlym: ['ക്ഷ', 'ൻ', 'ർ', 'ൽ', 'ൾ', 'ൺ', 'ൿ'] }[s] || []);
    var signs = uniq([chr(s, 0x02), chr(s, 0x01), chr(s, 0x03), chr(s, 0x4D), chr(s, 0x3D)].filter(function (c) { return c && c.length === 1; }));
    if (s === 'guru') signs = ['ੰ', 'ਂ', 'ੱ', '੍', 'ਃ'];
    var nums = []; for (o = 0x66; o <= 0x6F; o++) nums.push(chr(s, o));
    var pun = d.danda ? ['।', '॥'] : [];
    return [['g_vow', vowels], ['g_mat', mat], ['g_con', cs], ['g_extra', uniq(extra)], ['g_sig', signs], ['g_num', nums], ['g_pun', pun.concat(['₹', '-', '?', '!'])]];
  }
  function renderPalette() {
    var p = $('#palette'), seen = {}; p.textContent = '';
    paletteGroups().forEach(function (g) {
      g[1] = g[1].filter(function (c) { if (seen[c]) return false; seen[c] = 1; return true; });
      if (!g[1].length) return;
      var box = el('div', { class: 'it-keys no-i18n' });
      g[1].forEach(function (c) {
        var show = /^\p{M}/u.test(c) ? '◌' + c : c;
        box.appendChild(el('button', { type: 'button', class: 'it-key' + (c.length > 3 ? ' sm' : ''), text: show, title: c, 'data-ch': c, dir: sc() === 'arab' ? 'rtl' : 'ltr' }));
      });
      p.appendChild(el('h3', { text: t(g[0]) }));
      p.appendChild(box);
    });
  }
  function insertAt(box, s) {
    var a = box.selectionStart, b = box.selectionEnd;
    if (a == null || (document.activeElement !== box && lastPos && lastPos.box === box)) { a = lastPos ? lastPos.a : box.value.length; b = lastPos ? lastPos.b : a; }
    if (a == null) { a = b = box.value.length; }
    box.value = box.value.slice(0, a) + s + box.value.slice(b);
    var c = a + s.length;
    box.focus({ preventScroll: true }); box.setSelectionRange(c, c);
    lastPos = { box: box, a: c, b: c };
  }
  $('#palette').addEventListener('pointerdown', function (e) { if (e.target.closest('.it-key')) e.preventDefault(); });  // keep the cursor in the box
  $('#palette').addEventListener('click', function (e) {
    var b = e.target.closest('.it-key'); if (!b) return;
    var ch = b.getAttribute('data-ch');
    if (S.mode === 'inline') { insertAt(out, ch); stats(); save(); }
    else { insertAt(roman, ch); schedule(); }
  });
  function remember(box) { lastPos = { box: box, a: box.selectionStart, b: box.selectionEnd }; }
  ['keyup', 'click', 'select', 'blur'].forEach(function (ev) { roman.addEventListener(ev, function () { remember(roman); }); out.addEventListener(ev, function () { if (S.mode === 'inline') remember(out); }); });

  /* ---------- typing guide (made from the same key table as the engine) */
  function pairEl(r) {
    return el('span', { class: 'it-pair no-i18n' }, el('kbd', { text: r }), el('span', { class: 'arr', 'aria-hidden': 'true', text: '→' }), el('span', { class: 'u', dir: sc() === 'arab' ? 'rtl' : 'auto', text: conv(r) }));
  }
  function guideSample(row, key) {
    var last = row.tok[row.tok.length - 1];
    if (row.g === 'vow') return [key, IT.convert('k' + key, S.lang, {})];
    if (row.g === 'sig') {
      var s = row.tok[0].s;
      if (s === 'virama') return ['k' + key];
      if (s === 'zwnj' || s === 'zwj') return ['k' + key + 'Sh'];
      if (s === 'avagraha') return ['so' + key + 'ham'];
      return ['ka' + key];
    }
    if (row.g === 'pun' || (last && last.k === 'V') || (last && last.dead) || (last && last.k === 'X')) return [key];
    return [key + 'a'];
  }
  var RULES = [
    ['rule_conj', null, ['shakti', 'pyaar', 'svar']], ['rule_end', 'north', ['raam', 'bhaarat']], ['rule_end_s', 'south', ['raam', 'paal']],
    ['rule_vowel', null, ['naI', 'aaiye']], ['rule_caps', null, ['tamaaTar', 'Daal', 'aam']], ['rule_nasal', 'anus', ['hindii', 'saMsaar', 'maa~']],
    ['rule_deva', 'deva', ['x', 'gyaan', 'OM']], ['rule_bn', 'assim', ['gangaa', 'baa~Nlaa', 'maayaa', 'ut^sab']], ['rule_pa', 'guru', ['pakkaa', 'pa~njaab', 'muuMh']],
    ['rule_ta', 'taml', ['naan', 'anbu', 'tamizh', 'kaatru', 'fan']], ['rule_ml', 'mlym', ['ente', 'avan', 'malayaaLam', 'kuttikaL']],
    ['rule_dr', 'telkan', ['amma', 'andaru', 'pEru']], ['rule_ur', 'arab', ['aap kaise hain?', 'maiN', 'Kush']],
    ['rule_virama', 'brahmic', ['jagat^', 'k_Sh']], ['rule_english', null, ['##WhatsApp## karo']], ['rule_smart', 'dict', ['bharat', 'kya', 'main']]
  ];
  function ruleApplies(w) {
    var s = sc(), d = CORE.S[s];
    if (!w) return true;
    if (w === 'north') return !!d.north || s === 'arab';
    if (w === 'south') return !!d.south;
    if (w === 'anus') return s === 'deva' || s === 'gujr' || s === 'telu' || s === 'knda';
    if (w === 'assim') return d.nasal === 'assim';
    if (w === 'telkan') return s === 'telu' || s === 'knda';
    if (w === 'brahmic') return s !== 'arab';
    if (w === 'dict') return hasDict();
    return w === s || (w === 'deva' && s === 'deva');
  }
  function renderGuide() {
    var T = IT.table(S.lang), body = $('#guideBody'); body.textContent = '';
    $('#guideTitle').textContent = t('guide_title', { lang: langName(S.lang) });
    var groups = ['vow', 'con', 'spe', 'nuk', 'sig', 'pun'], grid = el('div', { class: 'it-ggrid' });
    groups.forEach(function (g) {
      var rows = T.rows.filter(function (r) { return r.g === g; });
      if (!rows.length) return;
      var tb = el('tbody');
      rows.forEach(function (r) {
        var keys = r.keys.slice(), smp = guideSample(r, keys[0]);
        var outTxt = IT.convert(smp[0], S.lang, {});
        if (!outTxt || /[A-Za-z]/.test(outTxt.replace(/##/g, ''))) return;
        var kc = el('td', { class: 'no-i18n' }); keys.forEach(function (k) { kc.appendChild(el('kbd', { text: guideSample(r, k)[0] })); });
        var tr = el('tr', {}, kc, el('td', { class: 'o no-i18n', dir: sc() === 'arab' ? 'rtl' : 'ltr', text: outTxt }));
        if (g === 'vow') tr.appendChild(el('td', { class: 'o no-i18n', dir: sc() === 'arab' ? 'rtl' : 'ltr', text: smp[1] }));
        tb.appendChild(tr);
      });
      var head = el('tr', {}, el('th', { text: t('col_type') }), el('th', { text: t('col_get') }));
      if (g === 'vow') head.appendChild(el('th', { text: t('col_with') }));
      grid.appendChild(el('section', { class: 'card flat' }, el('h3', { text: t('g_' + g) }), el('div', { class: 'scroll-x' }, el('table', { class: 'table' }, el('thead', {}, head), tb))));
    });
    body.appendChild(grid);
    var ex = el('div', { class: 'it-ex' }); EXAMPLES[sc() === 'asm' ? 'beng' : sc()].forEach(function (w) { ex.appendChild(pairEl(w)); });
    body.appendChild(el('section', { class: 'card flat', style: { marginTop: '16px' } }, el('h3', { text: t('g_ex') }), ex));
    var ol = el('ol', { class: 'it-rules' });
    RULES.forEach(function (r) {
      if (!ruleApplies(r[1])) return;
      var e2 = el('div', { class: 'it-ex' }); r[2].forEach(function (w) { e2.appendChild(pairEl(w)); });
      ol.appendChild(el('li', {}, el('span', { text: t(r[0]) }), e2));
    });
    body.appendChild(el('section', { class: 'card flat', style: { marginTop: '16px' } }, el('h3', { text: t('g_rules') }), ol));
  }

  /* ---------- script converter */
  function convNow() {
    clearTimeout(convTimer); convTimer = null;
    var src = convIn.value, r = IS.convertEx(src, S.convTo), found = IS.detect(src);
    convOut.value = r.text;
    convOut.style.fontFamily = FONT[S.convTo] || FONT.roman;
    convOut.dir = 'ltr';
    convOut.style.height = 'auto'; convOut.style.height = Math.min(Math.max(convOut.scrollHeight + 4, 140), 640) + 'px';
    var msg = [];
    if (src.trim() && !found) msg.push(t('conv_none'));
    else if (found) msg.push(t('conv_from', { script: scriptName(found) }));
    if (r.approx) msg.push(t('conv_approx', { n: EDU.fmt(r.approx) }));
    $('#convStats').textContent = msg.join(' · ');
    save();
  }
  function scriptName(s) {
    return { deva: t('sc_deva'), beng: t('lang_bn'), asm: t('lang_as'), guru: t('sc_guru'), gujr: t('lang_gu'), orya: t('lang_or'), taml: t('lang_ta'),
      telu: t('lang_te'), knda: t('lang_kn'), mlym: t('lang_ml'), roman: t('sc_roman'), keys: t('sc_keys') }[s] || s;
  }
  function fillConvTo() {
    var sel = $('#convTo'); sel.textContent = '';
    IS.TARGETS.forEach(function (g) { sel.appendChild(el('option', { value: g, text: scriptName(g) })); });
    sel.value = S.convTo;
  }

  /* ---------- language picker, tabs */
  function fillLangs() {
    var sel = $('#lang'); sel.textContent = '';
    IT.ORDER.forEach(function (l) { sel.appendChild(el('option', { value: l, text: langName(l) + ' · ' + NATIVE[l] })); });
    sel.value = S.lang;
  }
  function setTab(tb) {
    S.tab = tb;
    EDU.$$('#tabs [role=tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === tb)); b.tabIndex = b.dataset.tab === tb ? 0 : -1; });
    ['type', 'guide', 'conv'].forEach(function (n) { $('#panel-' + n).hidden = n !== tb; });
    if (tb === 'guide') renderGuide();
    if (tb === 'conv') convNow();
    save();
  }
  function applyLang() {
    applyFont();
    $('#outTitle').textContent = t('out_title', { lang: langName(S.lang) });
    $('#smartWrap').hidden = !hasDict();
    $('#optSmart').checked = S.smart; $('#optCap').checked = S.cap; $('#optDigits').checked = S.digits;
    hint(); renderPalette(); applyMode();
    if (S.tab === 'guide') renderGuide();
  }

  /* ---------- events */
  $('#lang').addEventListener('change', function () {
    var old = S.lang; S.lang = this.value;
    if (roman.value.trim() === '' || roman.value === SAMPLE[old]) roman.value = SAMPLE[S.lang];
    applyLang(); save();
  });
  $('#optSmart').addEventListener('change', function () { S.smart = this.checked; applyLang(); save(); });
  $('#optCap').addEventListener('change', function () { S.cap = this.checked; applyLang(); save(); });
  $('#optDigits').addEventListener('change', function () { S.digits = this.checked; applyLang(); save(); });
  $('#modeLive').addEventListener('click', function () { setMode('live'); roman.focus(); });
  $('#modeInline').addEventListener('click', function () { setMode('inline'); out.focus(); });
  roman.addEventListener('input', schedule);
  out.addEventListener('input', function () { if (S.mode === 'inline') inlineInput(); });
  $('#convertAllBtn').addEventListener('click', convertAll);
  $('#copyBtn').addEventListener('click', function () { fresh(); if (!out.value) { EDU.toast(t('nothing')); return; } EDU.copy(out.value); });
  $('#waBtn').addEventListener('click', function (e) { fresh(); stats(); if (!out.value) { e.preventDefault(); EDU.toast(t('nothing')); } });
  $('#dlBtn').addEventListener('click', function () { fresh(); if (!out.value) { EDU.toast(t('nothing')); return; } EDU.download(S.lang + '-text.txt', '﻿' + out.value.replace(/\r?\n/g, '\r\n'), 'text/plain'); });
  $('#printBtn').addEventListener('click', function () {
    fresh(); if (!out.value) { EDU.toast(t('nothing')); return; }
    var pa = $('#printArea'); pa.textContent = ''; pa.appendChild(el('pre', { dir: sc() === 'arab' ? 'rtl' : 'ltr', text: out.value })); window.print();
  });
  $('#guidePrint').addEventListener('click', function () {
    renderGuide(); var pa = $('#printArea'); pa.textContent = '';
    pa.appendChild(el('h2', { text: t('guide_title', { lang: langName(S.lang) }) })); pa.appendChild($('#guideBody').cloneNode(true)); window.print();
  });
  $('#sampleBtn').addEventListener('click', function () {
    if (S.mode === 'inline') { out.value = conv(SAMPLE[S.lang]) + ' '; stats(); save(); out.focus(); }
    else { roman.value = SAMPLE[S.lang]; convertLive(); save(); }
  });
  $('#clearBtn').addEventListener('click', function () {
    if (S.mode === 'inline') { out.value = ''; S.inline = ''; stats(); out.focus(); } else { roman.value = ''; convertLive(); roman.focus(); }
    save();
  });
  function setFs(v) { S.fs = EDU.clamp(Math.round(v * 4) / 4, 1, 3.5); document.getElementById('app').style.setProperty('--fs', S.fs + 'rem'); save(); }
  $('#fontDown').addEventListener('click', function () { setFs(S.fs - 0.25); });
  $('#fontUp').addEventListener('click', function () { setFs(S.fs + 0.25); });
  EDU.$$('#tabs [role=tab]').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var tabs = EDU.$$('#tabs [role=tab]'), i = tabs.indexOf(b), rtl = document.documentElement.dir === 'rtl';
      var step = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
      if (!step) return; e.preventDefault(); var n = tabs[(i + step + tabs.length) % tabs.length]; n.focus(); setTab(n.dataset.tab);
    });
  });
  convIn.addEventListener('input', function () { clearTimeout(convTimer); convTimer = setTimeout(convNow, convIn.value.length > 20000 ? 300 : 60); });
  $('#convTo').addEventListener('change', function () { S.convTo = this.value; convNow(); });
  $('#convSample').addEventListener('click', function () { convIn.value = CONV_SAMPLE; convNow(); });
  $('#convSwap').addEventListener('click', function () {
    if (S.convTo === 'roman' || S.convTo === 'keys') { EDU.toast(t('conv_swap_no')); return; }
    var from = IS.detect(convIn.value); convIn.value = convOut.value;
    if (from) { S.convTo = from; $('#convTo').value = from; }
    convNow();
  });
  $('#convCopy').addEventListener('click', function () { if (!convOut.value) { EDU.toast(t('nothing')); return; } EDU.copy(convOut.value); });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state');
    S = Object.assign({}, DEF, { lang: DEF_LANG[EDU.lang] || 'hi' });
    S.roman = SAMPLE[S.lang]; S.convIn = CONV_SAMPLE; S.convTo = defaultTarget();
    roman.value = S.roman; out.value = ''; convIn.value = S.convIn;
    fillLangs(); fillConvTo(); applyLang(); setTab('type');
  });

  /* ---------- start */
  roman.value = S.roman;
  convIn.value = S.convIn;
  fillLangs(); fillConvTo(); applyLang(); setTab(S.tab);
  EDU.onLang(function () { fillLangs(); fillConvTo(); applyLang(); if (S.tab === 'conv') convNow(); });
  window.IT_APP = { get state() { return S; }, convert: conv };
})();
