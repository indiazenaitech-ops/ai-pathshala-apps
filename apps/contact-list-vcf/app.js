/* Excel/CSV to Contacts (VCF): paste a customer list, clean Indian mobile numbers, merge duplicates and
   download a vCard 3.0 file, a cleaned CSV or a Google Contacts CSV; also VCF -> CSV. Nothing leaves the device. */
(function () {
  'use strict';
  var SLUG = 'contact-list-vcf';
  var store = EDU.store(SLUG);
  var $ = EDU.$, t = EDU.t, el = EDU.el;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var ROLES = ['name', 'last', 'phone', 'phone2', 'email', 'company', 'label', 'note'];
  var PAGE = 150;
  var DEFAULTS = { cc: '91', titleCase: true, dedupe: true, landline: true, intl: true, prefix: '', suffix: '', splitN: 256, fname: 'contacts' };

  function loadOpts() {
    var o = Object.assign({}, DEFAULTS, store.get('opts', {}) || {});
    o.cc = String(o.cc || '').replace(/\D/g, '').slice(0, 4) || '91';
    o.splitN = EDU.clamp(parseInt(o.splitN, 10) || 256, 1, 100000);
    o.prefix = String(o.prefix || '').slice(0, 30); o.suffix = String(o.suffix || '').slice(0, 30);
    o.fname = String(o.fname || 'contacts').slice(0, 40);
    ['titleCase', 'dedupe', 'landline', 'intl'].forEach(function (k) { o[k] = !!o[k]; });
    return o;
  }
  var opts = loadOpts();
  function saveOpts() { store.set('opts', opts); }

  var S = { rows: [], ncol: 0, header: false, headerManual: null, manual: {}, map: {}, items: [], contacts: [], stats: null,
    filter: 'all', shown: PAGE, example: false, vcf: null, job: null };

  /* ---------------- digits and phone numbers ---------------- */
  var ZEROS = [0x660, 0x6F0, 0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0xFF10];
  /* digits typed on an Indian-language keyboard (९८७ / ৯৮৭ / ௯௮௭ / ۹۸۷) become 0-9 */
  function asciiDigits(s) {
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯０-９]/g, function (c) {
      var k = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (k >= ZEROS[i] && k <= ZEROS[i] + 9) return String(k - ZEROS[i]);
      return c;
    });
  }
  function isSci(s) { return /^\d(\.\d+)?e\+?\d+$/i.test(String(s).replace(/\s/g, '')); }
  function isDateLike(s) { s = String(s).trim(); return /^\d{4}-\d{1,2}-\d{1,2}([ T].*)?$/.test(s) || /^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}$/.test(s); }

  /* "98765 43210 / 91234 56789" -> two numbers of the same person */
  function splitNumbers(cell) {
    var s = asciiDigits(cell).trim();
    if (!s) return [];
    var parts = s.split(/\s*(?:[,;\/|\n]|\bor\b|\band\b|&|\bya\b|या|اور)\s*/i).map(function (x) { return x.trim(); }).filter(Boolean);
    if (parts.length > 1 && parts.every(function (p) { return isSci(p) || p.replace(/\D/g, '').length >= 6; })) return parts;
    return [s];
  }

  /* One number written any common way -> { kind, e164 }.  kind: mobile | landline | intl | sci | len | text | empty */
  function normPhone(raw, cc) {
    var s = asciiDigits(raw).trim();
    if (!s) return { kind: 'empty' };
    var compact = s.replace(/[\s\-().]/g, '');
    if (isSci(s) || isSci(compact)) return { kind: 'sci' };
    var d = compact.replace(/\D/g, '');
    if (!d || (d.length < 6 && /\p{L}/u.test(compact))) return { kind: 'text' };
    var plus = compact.charAt(0) === '+';
    if (!plus && /^00\d{8,}/.test(d)) { plus = true; d = d.slice(2); }          // 0091 98765 43210
    var nat;
    if (plus) {
      if (d.indexOf(cc) !== 0) {                                                 // another country
        if (d.length < 8 || d.length > 15) return { kind: 'len', n: d.length };
        return { kind: 'intl', e164: '+' + d };
      }
      nat = d.slice(cc.length).replace(/^0+/, '');                              // +91 0 98765 43210
    } else {
      nat = d.replace(/^0+/, '');                                                // 098765 43210: 0 is the trunk prefix
      if (cc === '91') {
        if (nat.length === 12 && nat.indexOf('91') === 0) nat = nat.slice(2);   // 91 98765 43210
        else if (nat.length === 13 && nat.indexOf('910') === 0) nat = nat.slice(3);
      } else if (nat.indexOf(cc) === 0 && nat.length - cc.length >= 8) nat = nat.slice(cc.length);
    }
    if (cc === '91') {
      if (nat.length !== 10) return { kind: 'len', n: nat.length };
      return { kind: /^[6-9]/.test(nat) ? 'mobile' : 'landline', e164: '+91' + nat };
    }
    if (nat.length < 6 || nat.length > 12) return { kind: 'len', n: nat.length };
    return { kind: 'mobile', e164: '+' + cc + nat };
  }
  /* "+91 98765 43210": with a space Excel keeps it as text (+919876543210 would become 9.19877E+11) */
  function pretty(e164) {
    if (/^\+91\d{10}$/.test(e164)) return '+91 ' + e164.slice(3, 8) + ' ' + e164.slice(8);
    var cc = opts.cc;
    if (e164.indexOf('+' + cc) === 0 && e164.length > cc.length + 4) return '+' + cc + ' ' + e164.slice(cc.length + 1);
    return e164.length > 8 ? e164.slice(0, -7) + ' ' + e164.slice(-7) : e164;
  }
  function isPhoneLike(v) {
    var s = asciiDigits(v).trim();
    if (!s || isDateLike(s)) return false;
    if (isSci(s)) return true;
    var letters = (s.match(/\p{L}/gu) || []).length, d = s.replace(/\D/g, '').length;
    return d >= 7 && d <= 15 && letters <= 4;
  }
  function isEmailLike(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()); }
  function isNameLike(v) { v = String(v).trim(); return v.length > 0 && v.length <= 60 && /\p{L}/u.test(v) && !isEmailLike(v) && !isPhoneLike(v) && !isDateLike(v) && !/^https?:/i.test(v); }

  /* ---------------- names ---------------- */
  function cleanText(s) { return String(s == null ? '' : s).replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim(); }
  function cleanName(s) { return cleanText(s).replace(/^[\s"'“”‘’,.;:\-–|]+|[\s"'“”‘’,.;:\-–|]+$/g, '').trim(); }
  function titleCase(s) {
    return s.replace(/[A-Za-z][A-Za-z']*/g, function (w) {
      var lower = w.toLowerCase(), upper = w.toUpperCase();
      if (w !== lower && w !== upper) return w;                 // McDonald, D'Souza: typed with care already
      if (w === upper && w.length <= 2) return w;               // initials: RK, M
      return w.charAt(0).toUpperCase() + lower.slice(1);
    });
  }

  /* ---------------- which column is what ---------------- */
  var HDR = {
    name: /(^|\b)(name|full ?name|customer|contact|party|person|client|student|member|नाम|ग्राहक|নাম|નામ|ਨਾਮ|ନାମ|பெயர்|పేరు|ಹೆಸರು|പേര്|نام)/i,
    last: /(last ?name|surname|family|उपनाम|सरनेम|कुलनाम|পদবি|અટક|ਗੋਤ)/i,
    phone: /(phone|mobile|\bmob\b|cell|contact ?no|number|whatsapp|\btel|फ़ोन|फोन|मोबाइल|नंबर|नम्बर|ফোন|মোবাইল|নম্বর|ફોન|મોબાઇલ|નંબર|ਫੋਨ|ਫ਼ੋਨ|ਮੋਬਾਈਲ|ਨੰਬਰ|ଫୋନ|ମୋବାଇଲ|ନମ୍ବର|தொலைபேசி|கைபேசி|மொபைல்|எண்|ఫోన్|మొబైల్|నంబర్|ಫೋನ್|ಮೊಬೈಲ್|ನಂಬರ್|ഫോൺ|മൊബൈൽ|നമ്പർ|فون|موبائل|نمبر)/i,
    phone2: /(phone ?2|mobile ?2|number ?2|alt|other ?(phone|mobile|number)|second|दूसरा)/i,
    email: /(e-?mail|ईमेल|ई-मेल|ইমেল|ইমেইল|ઈમેલ|ઇમેઇલ|ਈਮੇਲ|ଇମେଲ|மின்னஞ்சல்|ఇమెయిల్|ಇಮೇಲ್|ഇമെയിൽ|ای میل)/i,
    company: /(company|firm|shop|business|\borg|store|दुकान|कंपनी|फर्म|व्यवसाय|দোকান|কোম্পানি|કંપની|દુકાન|ਕੰਪਨੀ|ਦੁਕਾਨ|କମ୍ପାନୀ|ଦୋକାନ|நிறுவனம்|கடை|కంపెనీ|షాప్|ಕಂಪನಿ|ಅಂಗಡಿ|കമ്പനി|കട|کمپنی|دکان)/i,
    label: /(group|label|category|\btag|type|segment|समूह|ग्रुप|श्रेणी|গ্রুপ|ગ્રુપ|ਗਰੁੱਪ|ଗ୍ରୁପ|குழு|గ్రూప్|ಗುಂಪು|ഗ്രൂപ്പ്|گروپ)/i,
    note: /(note|remark|comment|address|नोट|टिप्पणी|पता|নোট|ঠিকানা|નોંધ|સરનામું|ਨੋਟ|ਪਤਾ|ନୋଟ|ଠିକଣା|குறிப்பு|முகவரி|నోట్|చిరునామా|ಟಿಪ್ಪಣಿ|ವಿಳಾಸ|കുറിപ്പ്|വിലാസം|نوٹ|پتہ)/i
  };
  var HDR_ORDER = ['phone2', 'phone', 'email', 'last', 'company', 'label', 'note', 'name'];
  function headerRole(h) { h = cleanText(h); if (!h) return null; for (var i = 0; i < HDR_ORDER.length; i++) if (HDR[HDR_ORDER[i]].test(h)) return HDR_ORDER[i]; return null; }
  function looksLikeHeader(rows) {
    if (rows.length < 2) return false;
    var r0 = rows[0];
    if (r0.some(function (c) { return isPhoneLike(c) || isEmailLike(c); })) return false;
    if (r0.some(function (c) { return headerRole(c); })) return true;
    return rows.slice(1, 30).some(function (r) { return r.some(isPhoneLike); });
  }
  function autoMap(rows, header) {
    var map = {}, used = {};
    ROLES.forEach(function (r) { map[r] = -1; });
    if (header) rows[0].forEach(function (h, i) { var r = headerRole(h); if (r && map[r] === -1) { map[r] = i; used[i] = true; } });
    var data = rows.slice(header ? 1 : 0, (header ? 1 : 0) + 400), score = [];
    for (var c = 0; c < S.ncol; c++) {
      var ph = 0, em = 0, nm = 0, n = 0;
      data.forEach(function (r) { var v = r[c]; if (v == null || !String(v).trim()) return; n++; if (isPhoneLike(v)) ph++; else if (isEmailLike(v)) em++; else if (isNameLike(v)) nm++; });
      score.push({ c: c, ph: n ? ph / n : 0, em: n ? em / n : 0, nm: n ? nm / n : 0, n: n });
    }
    function best(key, min) { var b = null; score.forEach(function (s) { if (used[s.c] || !s.n) return; if (s[key] >= min && (!b || s[key] > b[key])) b = s; }); return b; }
    var b;
    if (map.phone === -1 && (b = best('ph', 0.4))) { map.phone = b.c; used[b.c] = true; }
    if (map.phone2 === -1 && (b = best('ph', 0.7))) { map.phone2 = b.c; used[b.c] = true; }
    if (map.email === -1 && (b = best('em', 0.4))) { map.email = b.c; used[b.c] = true; }
    if (map.name === -1) {                                     // the leftmost column that looks like names
      for (var i = 0; i < score.length; i++) if (!used[score[i].c] && score[i].n && score[i].nm >= 0.5) { map.name = score[i].c; used[score[i].c] = true; break; }
    }
    return map;
  }

  /* ---------------- pasted text -> rows ---------------- */
  var LOOSE_END = /^(.*?)[\s:\-–|]*((?:\+|0{0,2})\(?\d[\d\s\-().]{7,}\d)\s*$/u, LOOSE_START = /^((?:\+|0{0,2})\(?\d[\d\s\-().]{7,}\d)[\s:\-–|]*(.*)$/u;
  function splitLoose(line) {                                  // "Ramesh Kumar - 98765 43210" without tabs or commas
    var s = cleanText(line); if (!s) return [];
    var m = LOOSE_END.exec(s); if (m) return [cleanName(m[1]), m[2].trim()];
    m = LOOSE_START.exec(s); if (m) return [cleanName(m[2]), m[1].trim()];
    return [s];
  }
  function parseText(text) {
    text = String(text || '').replace(/\r\n?/g, '\n');
    var rows = [];
    try { rows = EDU.csv.parse(text); } catch (e) { rows = []; }
    rows = rows.map(function (r) { return r.map(cleanText); }).filter(function (r) { return r.some(Boolean); });
    var ncol = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    if (ncol <= 1) rows = text.split('\n').map(splitLoose).filter(function (r) { return r.some(Boolean); });
    return rows;
  }

  /* ---------------- cleaning job (chunked, so 10k+ lines keep the page responsive) ---------------- */
  function cell(row, role) { var c = S.map[role]; return c > -1 && row[c] != null ? String(row[c]) : ''; }
  function startJob() {
    if (S.job) { clearTimeout(S.job.timer); S.job = null; }
    S.ncol = S.rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    S.header = S.headerManual === null ? looksLikeHeader(S.rows) : S.headerManual;
    var auto = autoMap(S.rows, S.header);
    S.map = {};
    ROLES.forEach(function (r) { var m = S.manual[r]; S.map[r] = (m !== undefined && m < S.ncol) ? m : auto[r]; });
    var data = S.rows.slice(S.header ? 1 : 0);
    var job = { data: data, i: 0, items: [], byPhone: {}, stats: { rows: 0, invalid: 0, dups: 0, landline: 0, intl: 0, noname: 0 }, timer: null };
    S.job = job;
    step(job);
  }
  function step(job) {
    var end = Math.min(job.i + 2000, job.data.length);
    for (; job.i < end; job.i++) processRow(job, job.data[job.i], job.i + (S.header ? 2 : 1));
    if (job.i < job.data.length) { showProgress(job.i, job.data.length); job.timer = setTimeout(function () { step(job); }, 0); return; }
    finishJob(job);
  }
  function processRow(job, row, line) {
    var name = cleanName(cell(row, 'name')), last = cleanName(cell(row, 'last'));
    if (last) name = (name + ' ' + last).trim();
    if (opts.titleCase) name = titleCase(name);
    var rawPhones = splitNumbers(cell(row, 'phone')).concat(splitNumbers(cell(row, 'phone2')));
    var email = cleanText(cell(row, 'email')), company = cleanText(cell(row, 'company')), label = cleanText(cell(row, 'label')), note = cleanText(cell(row, 'note'));
    var phones = [], bad = [], seen = {};
    rawPhones.forEach(function (r) {
      var p = normPhone(r, opts.cc);
      if (!p.e164) { bad.push({ kind: p.kind, raw: r, n: p.n }); return; }
      if (seen[p.e164]) return;
      seen[p.e164] = true;
      if ((p.kind === 'landline' && !opts.landline) || (p.kind === 'intl' && !opts.intl)) bad.push({ kind: p.kind + '_off', raw: r });
      else phones.push(p);
    });
    if (!rawPhones.length) bad.push({ kind: 'empty', raw: '' });
    if (!name && !phones.length && !email && !company && !rawPhones.length) return;      // an empty line
    job.stats.rows++;
    job.stats.invalid += bad.filter(function (b) { return b.kind !== 'landline_off' && b.kind !== 'intl_off'; }).length;
    if (!phones.length) { job.items.push({ line: line, name: name, also: [], email: email, company: company, label: label, note: note, phones: [], bad: bad, merged: 0, flags: [], status: 'bad' }); return; }
    if (opts.dedupe) {
      var hit = null;
      for (var i = 0; i < phones.length && !hit; i++) hit = job.byPhone[phones[i].e164] || null;
      if (hit) {
        hit.merged++; job.stats.dups++;
        phones.forEach(function (p) { if (!job.byPhone[p.e164]) { hit.phones.push(p); job.byPhone[p.e164] = hit; } });
        if (!hit.name && name) hit.name = name;
        else if (name && hit.name && name.toLowerCase() !== hit.name.toLowerCase() && hit.also.indexOf(name) < 0) hit.also.push(name);
        if (!hit.email) hit.email = email; if (!hit.company) hit.company = company; if (!hit.label) hit.label = label; if (!hit.note) hit.note = note;
        hit.bad = hit.bad.concat(bad);
        return;
      }
    }
    var it = { line: line, name: name, also: [], email: email, company: company, label: label, note: note, phones: phones, bad: bad, merged: 0, flags: [], status: 'ok' };
    phones.forEach(function (p) { job.byPhone[p.e164] = it; });
    job.items.push(it);
  }
  function finishJob(job) {
    var st = job.stats;
    job.items.forEach(function (it) {
      if (it.status === 'bad') return;
      it.flags = [];
      if (it.phones.some(function (p) { return p.kind === 'landline'; })) { it.flags.push('landline'); st.landline++; }
      if (it.phones.some(function (p) { return p.kind === 'intl'; })) { it.flags.push('intl'); st.intl++; }
      if (!it.name) { it.flags.push('noname'); st.noname++; }
      if (it.merged) it.flags.push('merged');
      if (it.bad.length) it.flags.push('dropped');
      it.status = it.flags.length ? 'warn' : 'ok';
      it.display = ((opts.prefix ? opts.prefix.trim() + ' ' : '') + (it.name || pretty(it.phones[0].e164)) + (opts.suffix ? ' ' + opts.suffix.trim() : '')).trim();
    });
    S.items = job.items;
    S.contacts = job.items.filter(function (i) { return i.status !== 'bad'; });
    st.contacts = S.contacts.length; st.bad = job.items.length - st.contacts;
    S.stats = st; S.job = null; S.shown = PAGE;
    hideProgress();
    renderAll();
  }
  function showProgress(i, n) { $('#prog').hidden = false; $('#prog-bar').style.width = Math.round(100 * i / n) + '%'; $('#prog-txt').textContent = t('processing', { n: EDU.fmt(n) }); }
  function hideProgress() { $('#prog').hidden = true; }

  /* ---------------- exports ---------------- */
  function vEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,'); }
  function noteOf(it) { return [it.note, it.also.length ? t('note_also', { names: it.also.join(', ') }) : ''].filter(Boolean).join(' | '); }
  function nParts(it) {
    if (opts.prefix || opts.suffix || !it.name) return { given: it.display, family: '' };
    var w = it.name.split(' ');
    if (w.length < 2) return { given: it.name, family: '' };
    return { given: w.slice(0, -1).join(' '), family: w[w.length - 1] };
  }
  function vcard(it) {
    var np = nParts(it), L = ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + vEsc(np.family) + ';' + vEsc(np.given) + ';;;', 'FN:' + vEsc(it.display)];
    if (it.company) L.push('ORG:' + vEsc(it.company));
    it.phones.forEach(function (p) { L.push('TEL;TYPE=' + (p.kind === 'landline' ? 'VOICE' : 'CELL') + ':' + p.e164); });
    if (it.email) L.push('EMAIL;TYPE=INTERNET:' + vEsc(it.email));
    if (it.label) L.push('CATEGORIES:' + vEsc(it.label));
    var note = noteOf(it);
    if (note) L.push('NOTE:' + vEsc(note));
    L.push('END:VCARD');
    return L.join('\r\n');
  }
  function vcfText(list) { return list.map(vcard).join('\r\n') + '\r\n'; }

  var G_HEAD = ['Name', 'Given Name', 'Additional Name', 'Family Name', 'Name Prefix', 'Name Suffix', 'Notes', 'Group Membership',
    'E-mail 1 - Type', 'E-mail 1 - Value', 'Phone 1 - Type', 'Phone 1 - Value', 'Phone 2 - Type', 'Phone 2 - Value', 'Organization 1 - Type', 'Organization 1 - Name'];
  function telType(p) { return p.kind === 'landline' ? 'Work' : 'Mobile'; }
  function googleRows() {
    return [G_HEAD].concat(S.contacts.map(function (it) {
      var np = nParts(it), p1 = it.phones[0], p2 = it.phones[1];
      return [it.display, np.given, '', np.family, '', '', noteOf(it), '* myContacts' + (it.label ? ' ::: ' + it.label : ''),
        it.email ? 'Other' : '', it.email, p1 ? telType(p1) : '', p1 ? p1.e164 : '', p2 ? telType(p2) : '', p2 ? p2.e164 : '', it.company ? 'Work' : '', it.company];
    }));
  }
  function flagText(it) {
    return it.flags.map(function (f) {
      if (f === 'landline') return t('st_landline'); if (f === 'intl') return t('st_intl'); if (f === 'noname') return t('st_noname');
      if (f === 'merged') return t('st_merged', { n: EDU.fmt(it.merged + 1) }); return '';
    }).filter(Boolean).join(' · ') || t('st_ok');
  }
  function cleanRows() {
    var head = [t('th_name'), t('csv_phone', { n: '1' }), t('csv_phone', { n: '2' }), t('th_email'), t('th_company'), t('th_label'), t('th_note'), t('th_status'), t('th_line')];
    return [head].concat(S.contacts.map(function (it) {
      var p = it.phones.map(function (x) { return pretty(x.e164); });
      return [it.display, p[0] || '', p.slice(1).join(' / '), it.email, it.company, it.label, noteOf(it), flagText(it), it.line];
    }));
  }
  function base() { var f = cleanText(opts.fname).replace(/[\\\/:*?"<>|]+/g, '').trim(); return f || 'contacts'; }
  function partName(i) { var n = String(i + 1); return base() + '-part-' + (n.length < 2 ? '0' + n : n) + '.vcf'; }
  function dl(name, content, mime) { EDU.download(name, content, mime); EDU.toast(t('done_dl', { name: name })); }

  /* a store-only ZIP (no compression, no library) for the split parts */
  var CRC_TABLE = (function () { var tb = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); tb[n] = c >>> 0; } return tb; })();
  function crc32(u8) { var c = -1; for (var i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ -1) >>> 0; }
  function zipStore(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0, cdSize = 0;
    var now = new Date(), dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
    var dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, name.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
      central.push(ch.buffer, name);
      cdSize += 46 + name.length;
      offset += 30 + name.length + data.length;
    });
    var eocd = new DataView(new ArrayBuffer(22));
    eocd.setUint32(0, 0x06054b50, true); eocd.setUint16(4, 0, true); eocd.setUint16(6, 0, true); eocd.setUint16(8, files.length, true); eocd.setUint16(10, files.length, true);
    eocd.setUint32(12, cdSize, true); eocd.setUint32(16, offset, true); eocd.setUint16(20, 0, true);
    return new Blob(parts.concat(central, [eocd.buffer]), { type: 'application/zip' });
  }
  function partsList() {
    var N = opts.splitN, out = [];
    for (var i = 0; i * N < S.contacts.length; i++) out.push({ name: partName(i), text: vcfText(S.contacts.slice(i * N, (i + 1) * N)) });
    return out;
  }

  /* ---------------- VCF -> rows (vCard 2.1 / 3.0 / 4.0) ---------------- */
  function unesc(s) { return String(s).replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1').trim(); }
  function qpDecode(s, charset) {
    var bytes = [];
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === '=' && /^[0-9A-Fa-f]{2}$/.test(s.substr(i + 1, 2))) { bytes.push(parseInt(s.substr(i + 1, 2), 16)); i += 2; }
      else bytes.push(c.charCodeAt(0) & 0xFF);
    }
    try { return new TextDecoder((charset || 'utf-8').toLowerCase()).decode(new Uint8Array(bytes)); }
    catch (e) { return new TextDecoder().decode(new Uint8Array(bytes)); }
  }
  function parseVcf(text) {
    text = String(text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    var lines = text.split('\n'), merged = [], out = [], cur = null;
    lines.forEach(function (line) {
      var last = merged.length - 1;
      if (last >= 0 && /^[ \t]/.test(line)) { merged[last] += line.slice(1); return; }                       // folded line
      if (last >= 0 && /ENCODING=QUOTED-PRINTABLE/i.test(merged[last]) && /=$/.test(merged[last])) { merged[last] = merged[last].slice(0, -1) + line; return; }
      merged.push(line);
    });
    merged.forEach(function (l) {
      if (!l.trim()) return;
      var up = l.trim().toUpperCase();
      if (up === 'BEGIN:VCARD') { cur = { name: '', fn: '', n: '', tels: [], emails: [], org: '', title: '', cats: '', note: '', adr: '', bday: '' }; return; }
      if (up === 'END:VCARD') { if (cur) { finishCard(cur); out.push(cur); } cur = null; return; }
      if (!cur) return;
      var idx = l.indexOf(':'); if (idx < 0) return;
      var head = l.slice(0, idx), val = l.slice(idx + 1), hp = head.split(';');
      var pname = hp[0].replace(/^[^.]*\./, '').toUpperCase(), params = hp.slice(1).join(';').toUpperCase();
      if (/ENCODING=QUOTED-PRINTABLE/.test(params)) val = qpDecode(val, (params.match(/CHARSET=([\w\-]+)/) || [])[1]);
      else if (/ENCODING=B\b|ENCODING=BASE64/.test(params)) return;                                          // photos
      switch (pname) {
        case 'FN': cur.fn = cur.fn || unesc(val); break;
        case 'N': cur.n = cur.n || val; break;
        case 'TEL': var tv = val.replace(/^tel:/i, '').trim(); if (tv && cur.tels.indexOf(tv) < 0) cur.tels.push(tv); break;
        case 'EMAIL': if (val.trim()) cur.emails.push(val.trim()); break;
        case 'ORG': cur.org = cur.org || unesc(val.split(/;/)[0]); break;
        case 'TITLE': cur.title = cur.title || unesc(val); break;
        case 'CATEGORIES': cur.cats = cur.cats || val.split(',').map(unesc).filter(Boolean).join(' / '); break;
        case 'NOTE': cur.note = cur.note || unesc(val).replace(/\n/g, ' '); break;
        case 'ADR': cur.adr = cur.adr || val.split(';').map(unesc).filter(Boolean).join(', '); break;
        case 'BDAY': cur.bday = cur.bday || val.trim(); break;
      }
    });
    return out;
  }
  function finishCard(c) {
    if (!c.fn && c.n) { var p = c.n.split(';').map(unesc); c.fn = [p[3], p[1], p[2], p[0], p[4]].filter(Boolean).join(' ').trim(); }
    c.name = cleanText(c.fn);
  }
  function tsvCell(v) { return cleanText(v).replace(/\t/g, ' '); }
  function vcfToTsv(list) {
    var rows = [[t('col_name'), t('col_phone'), t('col_phone2'), t('col_email'), t('col_company'), t('col_label'), t('col_note')]];
    list.forEach(function (c) { rows.push([c.name, c.tels[0] || '', c.tels.slice(1).join(' / '), c.emails[0] || '', c.org, c.cats, [c.title, c.note].filter(Boolean).join(' | ')]); });
    return rows.map(function (r) { return r.map(tsvCell).join('\t'); }).join('\n');
  }
  function csvTel(v) { if (!v) return ''; var p = normPhone(v, opts.cc); return p.e164 ? pretty(p.e164) : v; }
  function vcfCsvRows(list) {
    var head = [t('th_name'), t('csv_phone', { n: '1' }), t('csv_phone', { n: '2' }), t('csv_phone', { n: '3' }), t('th_email'), t('th_company'), t('th_title'), t('th_label'), t('th_note'), t('th_address'), t('th_bday')];
    return [head].concat(list.map(function (c) { return [c.name, csvTel(c.tels[0]), csvTel(c.tels[1]), csvTel(c.tels[2]), c.emails[0] || '', c.org, c.title, c.cats, c.note, c.adr, c.bday]; }));
  }

  /* ---------------- files: UTF-8, UTF-16 "Unicode text" from Excel, old ANSI ---------------- */
  function decodeBytes(u8) {
    if (u8.length >= 2 && u8[0] === 0xFF && u8[1] === 0xFE) return new TextDecoder('utf-16le').decode(u8.subarray(2));
    if (u8.length >= 2 && u8[0] === 0xFE && u8[1] === 0xFF) return new TextDecoder('utf-16be').decode(u8.subarray(2));
    var n = Math.min(u8.length, 400), zeros = 0, odd = Math.floor(n / 2);
    for (var i = 1; i < n; i += 2) if (u8[i] === 0) zeros++;
    if (odd > 10 && zeros >= odd * 0.9) return new TextDecoder('utf-16le').decode(u8);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u8); }
    catch (e) { return new TextDecoder('windows-1252').decode(u8); }
  }
  function readSmart(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { try { res(decodeBytes(new Uint8Array(r.result))); } catch (e) { rej(e); } };
      r.onerror = function () { rej(r.error); };
      r.readAsArrayBuffer(file);
    });
  }

  /* ---------------- rendering ---------------- */
  function renderAll() { renderMap(); renderStats(); renderFilters(); renderTable(); renderExport(); renderNotes(); }
  function renderNotes() {
    $('#example-note').hidden = !S.example;
    $('#vcf-note').hidden = !S.vcf;
    if (S.vcf) $('#vcf-note-txt').textContent = t('vcf_read', { n: EDU.fmt(S.vcf.length) });
  }
  function colLabel(c) {
    var h = S.header ? (S.rows[0][c] || '') : '', first = '';
    if (!h) for (var i = S.header ? 1 : 0; i < Math.min(S.rows.length, 20); i++) if (S.rows[i][c]) { first = S.rows[i][c]; break; }
    var sample = (h || first || '').slice(0, 22);
    return t('col_n', { n: EDU.fmt(c + 1) }) + (sample ? ': ' + sample : '');
  }
  function renderMap() {
    var box = $('#map'); box.innerHTML = '';
    $('#map-card').hidden = !S.ncol;
    $('#has-header').checked = S.header;
    if (!S.ncol) return;
    ROLES.forEach(function (role) {
      var sel = el('select', { id: 'map-' + role, class: 'no-i18n' });
      sel.appendChild(el('option', { value: '-1', text: t('none_opt') }));
      for (var c = 0; c < S.ncol; c++) sel.appendChild(el('option', { value: String(c), text: colLabel(c) }));
      sel.value = String(S.map[role]);
      sel.addEventListener('change', function () { S.manual[role] = parseInt(sel.value, 10); startJob(); });
      box.appendChild(el('label', { class: 'field' }, el('span', { text: t('col_' + role) }), sel));
    });
  }
  function renderStats() {
    var box = $('#stats'); box.innerHTML = '';
    var st = S.stats || { rows: 0, contacts: 0, invalid: 0, dups: 0, landline: 0, noname: 0 };
    [['rows', st.rows, ''], ['contacts', st.contacts, st.contacts ? 'good' : ''], ['invalid', st.invalid, st.invalid ? 'bad' : ''],
      ['dups', st.dups, st.dups ? 'warn' : ''], ['landline', st.landline, st.landline ? 'warn' : ''], ['noname', st.noname, st.noname ? 'warn' : '']].forEach(function (d) {
      box.appendChild(el('div', { class: 'cv-stat ' + d[2], id: 'stat-' + d[0] }, el('div', { class: 'cv-stat-l', text: t('stat_' + d[0]) }), el('div', { class: 'cv-stat-v', text: EDU.fmt(d[1]) })));
    });
  }
  function renderFilters() {
    var box = $('#filters'); box.innerHTML = '';
    var counts = { all: S.items.length, ok: 0, warn: 0, bad: 0 };
    S.items.forEach(function (i) { counts[i.status]++; });
    ['all', 'ok', 'warn', 'bad'].forEach(function (f) {
      box.appendChild(el('button', { type: 'button', id: 'filter-' + f, text: t('filter_' + f) + ' (' + EDU.fmt(counts[f]) + ')', 'aria-pressed': String(S.filter === f),
        onclick: function () { S.filter = f; S.shown = PAGE; renderFilters(); renderTable(); } }));
    });
  }
  function filtered() { return S.items.filter(function (i) { return S.filter === 'all' || i.status === S.filter; }); }
  function reasonText(b) {
    if (!b) return '';
    switch (b.kind) {
      case 'sci': return t('bad_sci'); case 'len': return t('bad_len', { n: EDU.fmt(b.n || 0) }); case 'text': return t('bad_text'); case 'empty': return t('bad_empty');
      case 'landline_off': return t('st_landline_off'); case 'intl_off': return t('st_intl_off');
    }
    return '';
  }
  function statusTd(it) {
    var td = el('td', { class: 'cv-status' });
    if (it.status === 'bad') {
      td.appendChild(el('span', { class: 'cv-chip bad', text: '✗ ' + t('filter_bad') }));
      td.appendChild(el('span', { class: 'cv-reason', text: reasonText(it.bad[0]) }));
      return td;
    }
    td.appendChild(el('span', { class: 'cv-chip ' + it.status, text: (it.status === 'ok' ? '✓ ' : '⚠ ') + t(it.status === 'ok' ? 'st_ok' : 'filter_warn') }));
    var notes = [];
    it.flags.forEach(function (f) {
      if (f === 'landline') notes.push(t('st_landline'));
      if (f === 'intl') notes.push(t('st_intl'));
      if (f === 'noname') notes.push(t('st_noname'));
      if (f === 'merged') notes.push(t('st_merged', { n: EDU.fmt(it.merged + 1) }));
      if (f === 'dropped') notes.push(t('st_dropped', { n: EDU.fmt(it.bad.length) }) + ': ' + reasonText(it.bad[0]));
    });
    if (notes.length) td.appendChild(el('span', { class: 'cv-reason', text: notes.join(' · ') }));
    return td;
  }
  function renderTable() {
    var tbl = $('#table'), list = filtered(), show = list.slice(0, S.shown);
    tbl.innerHTML = '';
    var msg = !S.rows.length ? t('empty_list') : (!list.length ? t('no_rows_filter') : '');
    $('#empty-msg').textContent = msg; $('#empty-msg').hidden = !msg;
    $('#tablewrap').hidden = !list.length;
    if (!list.length) { $('#more').hidden = true; $('#showing').textContent = ''; return; }
    var tr = el('tr');
    ['th_line', 'th_name', 'th_phone', 'th_email', 'th_company', 'th_label', 'th_status'].forEach(function (k) { tr.appendChild(el('th', { text: t(k), scope: 'col' })); });
    tbl.appendChild(el('thead', {}, tr));
    var tb = el('tbody');
    show.forEach(function (it) {
      var row = el('tr', { class: 'cv-' + it.status, dataset: { status: it.status, line: String(it.line) } });
      row.appendChild(el('td', { class: 'cv-line', text: EDU.fmt(it.line) }));
      var nameTd = el('td', { class: 'cv-name' }, document.createTextNode(it.status === 'bad' ? it.name : it.display));
      if (it.also.length) nameTd.appendChild(el('span', { class: 'cv-also', text: t('note_also', { names: it.also.join(', ') }) }));
      row.appendChild(nameTd);
      var numTd = el('td');
      it.phones.forEach(function (p) { numTd.appendChild(el('span', { class: 'cv-num', text: pretty(p.e164) + (p.kind === 'landline' ? ' ⚠' : p.kind === 'intl' ? ' 🌐' : '') })); });
      it.bad.forEach(function (b) { if (b.raw) numTd.appendChild(el('span', { class: 'cv-num cv-badnum', text: b.raw })); });
      row.appendChild(numTd);
      row.appendChild(el('td', { text: it.email }));
      row.appendChild(el('td', { class: 'cv-name', text: it.company }));
      row.appendChild(el('td', { class: 'cv-name', text: it.label }));
      row.appendChild(statusTd(it));
      tb.appendChild(row);
    });
    tbl.appendChild(tb);
    $('#showing').textContent = t('showing', { a: EDU.fmt(show.length), b: EDU.fmt(list.length) });
    var more = $('#more');
    more.hidden = show.length >= list.length;
    more.textContent = t('show_more', { n: EDU.fmt(Math.min(PAGE, list.length - show.length)) });
  }
  function renderExport() {
    var n = S.contacts.length, has = n > 0, N = opts.splitN, k = has ? Math.ceil(n / N) : 0;
    ['#dl-vcf', '#dl-csv', '#dl-google', '#copy-numbers', '#dl-zip'].forEach(function (s) { $(s).disabled = !has; });
    $('#vcf-count').textContent = EDU.fmt(n);
    $('#dl-zip').hidden = k < 2;
    $('#parts-summary').textContent = has ? t('parts_summary', { n: EDU.fmt(k), m: EDU.fmt(N) }) : '';
    var parts = $('#parts'); parts.innerHTML = '';
    if (k >= 2) for (var i = 0; i < Math.min(k, 400); i++) (function (i) {
      var a = i * N, b = Math.min(n, (i + 1) * N);
      parts.appendChild(el('button', { type: 'button', class: 'btn btn-sm cv-part', text: '⬇ ' + t('part_n', { n: EDU.fmt(i + 1), a: EDU.fmt(a + 1), b: EDU.fmt(b) }),
        onclick: function () { dl(partName(i), vcfText(S.contacts.slice(a, b)), 'text/vcard'); } }));
    })(i);
    if (k > 400) parts.appendChild(el('span', { class: 'muted small', text: '…' }));
    $('#preview').textContent = has ? vcfText(S.contacts.slice(0, 3)) : '';
  }

  /* ---------------- input ---------------- */
  var timer = null;
  function parseAndRun() {
    S.rows = parseText($('#paste').value);
    var ncol = S.rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    if (ncol !== S.ncol) { S.manual = {}; S.headerManual = null; }       // a different list: guess again
    startJob();
  }
  function resetInput() { S.manual = {}; S.headerManual = null; S.vcf = null; S.filter = 'all'; }
  function loadExample() { resetInput(); S.example = true; $('#paste').value = t('sample_tsv'); parseAndRun(); }
  function ownData() { if (S.example) { S.example = false; store.set('used', true); } }

  $('#paste').addEventListener('input', function () {
    if (S.example && $('#paste').value !== t('sample_tsv')) ownData();
    S.vcf = null;
    clearTimeout(timer); timer = setTimeout(parseAndRun, 350);
  });
  $('#load-example').addEventListener('click', loadExample);
  $('#clear').addEventListener('click', function () {
    ownData(); store.set('used', true); resetInput();
    $('#paste').value = ''; S.rows = []; S.ncol = 0; S.items = []; S.contacts = []; S.stats = null;
    if (S.job) { clearTimeout(S.job.timer); S.job = null; hideProgress(); }
    renderAll(); $('#paste').focus();
  });
  function importText(text, kind) {
    if (kind === 'vcf') {
      var list = parseVcf(text);
      if (!list.length) { EDU.toast(t('bad_file')); return false; }
      ownData(); resetInput(); S.vcf = list;
      $('#paste').value = vcfToTsv(list);
      parseAndRun();
      return true;
    }
    if (!String(text).trim()) { EDU.toast(t('bad_file')); return false; }
    ownData(); resetInput();
    $('#paste').value = text;
    parseAndRun();
    EDU.toast(t('lines_read', { n: EDU.fmt(S.rows.length) }));
    return true;
  }
  $('#open-csv').addEventListener('click', function () {
    EDU.pickFile('.csv,.txt,.tsv,text/csv,text/plain,text/tab-separated-values').then(function (f) {
      if (!f) return;
      return readSmart(f).then(function (txt) { importText(txt, 'csv'); });
    }).catch(function () { EDU.toast(t('bad_file')); });
  });
  $('#open-vcf').addEventListener('click', function () {
    EDU.pickFile('.vcf,.vcard,text/vcard,text/x-vcard').then(function (f) {
      if (!f) return;
      return readSmart(f).then(function (txt) { importText(txt, 'vcf'); });
    }).catch(function () { EDU.toast(t('bad_file')); });
  });
  $('#dl-vcf-csv').addEventListener('click', function () { if (S.vcf) dl(base() + '-from-vcf.csv', EDU.csv.stringify(vcfCsvRows(S.vcf)), 'text/csv'); });
  $('#has-header').addEventListener('change', function () { S.headerManual = this.checked; startJob(); });
  $('#more').addEventListener('click', function () { S.shown += PAGE; renderTable(); });

  /* options */
  function bindCheck(id, key) {
    var c = $(id); c.checked = opts[key];
    c.addEventListener('change', function () { opts[key] = c.checked; saveOpts(); if (S.rows.length) startJob(); });
  }
  bindCheck('#opt-title', 'titleCase'); bindCheck('#opt-dedupe', 'dedupe'); bindCheck('#opt-landline', 'landline'); bindCheck('#opt-intl', 'intl');
  $('#cc').value = opts.cc;
  $('#cc').addEventListener('input', function () {
    opts.cc = asciiDigits(this.value).replace(/\D/g, '').slice(0, 4) || '91'; saveOpts();
    clearTimeout(timer); timer = setTimeout(function () { if (S.rows.length) startJob(); }, 300);
  });
  var optTimer = null;
  ['prefix', 'suffix'].forEach(function (k) {
    var inp = $('#' + k); inp.value = opts[k];
    inp.addEventListener('input', function () { opts[k] = inp.value.slice(0, 30); saveOpts(); clearTimeout(optTimer); optTimer = setTimeout(function () { if (S.rows.length) startJob(); }, 250); });
  });
  $('#fname').value = opts.fname;
  $('#fname').addEventListener('input', function () { opts.fname = this.value.slice(0, 40); saveOpts(); });
  $('#split-n').value = opts.splitN;
  $('#split-n').addEventListener('input', function () { var v = parseInt(asciiDigits(this.value), 10); if (!isNaN(v) && v >= 1) { opts.splitN = EDU.clamp(v, 1, 100000); saveOpts(); renderExport(); } });

  /* downloads */
  $('#dl-vcf').addEventListener('click', function () { if (!S.contacts.length) { EDU.toast(t('nothing_to_export')); return; } dl(base() + '.vcf', vcfText(S.contacts), 'text/vcard'); });
  $('#dl-csv').addEventListener('click', function () { if (!S.contacts.length) return; dl(base() + '-clean.csv', EDU.csv.stringify(cleanRows()), 'text/csv'); });
  $('#dl-google').addEventListener('click', function () { if (!S.contacts.length) return; dl(base() + '-google.csv', EDU.csv.stringify(googleRows()), 'text/csv'); });
  $('#copy-numbers').addEventListener('click', function () {
    var nums = [];
    S.contacts.forEach(function (c) { c.phones.forEach(function (p) { nums.push(p.e164); }); });
    if (nums.length) EDU.copy(nums.join(', '));
  });
  $('#dl-zip').addEventListener('click', function () { if (!S.contacts.length) return; dl(base() + '-parts.zip', zipStore(partsList()), 'application/zip'); });

  /* language change: the example is re-loaded in the new language, everything else is just re-drawn */
  EDU.onLang(function () { if (S.example) loadExample(); else if (S.rows.length) startJob(); else renderAll(); });

  if (!store.get('used', false)) loadExample(); else renderAll();

  /* hooks for the automated test (read-only helpers, no user data) */
  window.CLV_TEST = { importText: importText, normPhone: normPhone, parseVcf: parseVcf, zipStore: zipStore, partsList: partsList };
})();
