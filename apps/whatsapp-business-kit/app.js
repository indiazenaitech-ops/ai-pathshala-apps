/* WhatsApp Business Link Kit
   - click-to-chat links (https://wa.me/<digits>?text=...) from a number typed in any Indian format
   - ready business messages in 12 languages with fill-in words {name} {amount} {date} {shop} {upi} {link}
   - a preview that renders WhatsApp formatting (*bold* _italic_ ~strike~ ```mono``` `code` > quote, lists)
   - personal links for a customer list pasted from Excel / CSV: the user opens each chat and presses Send
     in WhatsApp (no automation, no bulk API); "sent" ticks are saved on this device only
   - a "Chat on WhatsApp" floating button snippet for websites
   Customer numbers and messages never leave the device: everything is computed here, saved with EDU.store. */
(function () {
  'use strict';
  var SLUG = 'whatsapp-business-kit';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc;
  var CODES = EDU.LANGS.map(function (l) { return l.code; });

  var HTTPS = 'https:' + '//';
  var WA = HTTPS + 'wa.me/';
  var WEB = HTTPS + 'web.whatsapp.com/send';
  var APP = 'whatsapp://send';
  var TPLS = ['order', 'payment', 'appt', 'offer', 'stock', 'delivery', 'review', 'thanks'];
  var TPL_ICON = { order: '✅', payment: '💰', appt: '📅', offer: '🪔', stock: '🛍️', delivery: '🚚', review: '⭐', thanks: '🙏', blank: '📝' };
  var PH = ['name', 'amount', 'date', 'shop', 'upi', 'link'];
  var OPTIONAL = { upi: 1, link: 1 };          // an empty UPI ID / link drops its whole line
  var COLS = ['name', 'phone', 'amount', 'date'];
  var MAX_ROWS = 1000, LONG_URL = 2000;
  var EMOJIS = ['🙏', '😊', '🎉', '✅', '📦', '🚚', '🛍️', '🛒', '💰', '💳', '📅', '⏰', '📍', '📞', '🎁', '🪔', '🌙', '✨', '🔥', '⭐', '👍', '❤️', '🥳', '🏷️', '💯', '👋', '🌸', '🎊'];
  var SWATCHES = ['#25D366', '#128C7E', '#075E54', '#0F7A41', '#0B4F5C'];
  var INK = { white: '#ffffff', dark: '#111b21' };
  var WA_PATH = 'M12 2.2a9.8 9.8 0 0 0-8.5 14.7L2.2 21.8l5-1.3A9.8 9.8 0 1 0 12 2.2zm0 1.8a8 8 0 1 1-4.1 14.9l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4z';
  var WA_PATH2 = 'M8.7 7.3c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.2s1 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3l-1.9-.9c-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2z';
  function waSvg(size) {
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false"><path fill="currentColor" d="' + WA_PATH + '"/><path fill="currentColor" d="' + WA_PATH2 + '"/></svg>';
  }
  var coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);

  /* ------------------------------------------------------------ state */
  function str(v, d) { return typeof v === 'string' ? v : d; }
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  var saved = store.get('state', null);
  if (!saved || typeof saved !== 'object') saved = {};
  var su = saved.utm && typeof saved.utm === 'object' ? saved.utm : {};
  var sb = saved.b && typeof saved.b === 'object' ? saved.b : {};
  var S = {
    tab: oneOf(saved.tab, ['link', 'list', 'button'], 'link'),
    cc: str(saved.cc, '91'),
    phone: str(saved.phone, ''),
    tpl: oneOf(saved.tpl, TPLS.concat(['blank']), 'order'),
    msg: str(saved.msg, null),                    // null = the chosen template, untouched (follows the language)
    msgLang: oneOf(saved.msgLang, CODES, null),   // null = same as the app language
    f: {},                                        // fill-in details; null = sample value for the message language
    utm: { on: !!su.on, source: str(su.source, 'whatsapp'), medium: str(su.medium, 'social'), campaign: str(su.campaign, '') },
    list: str(saved.list, null),                  // null = example list in the message language
    map: null,                                    // null = detect columns automatically
    header: typeof saved.header === 'boolean' ? saved.header : null,
    firstName: !!saved.firstName,
    sent: {},
    openMode: oneOf(saved.openMode, ['wa', 'web', 'app'], coarse ? 'wa' : 'web'),
    b: {
      phone: str(sb.phone, ''), greet: str(sb.greet, null), text: str(sb.text, null),
      style: oneOf(sb.style, ['round', 'pill'], 'round'), pos: oneOf(sb.pos, ['right', 'left'], 'right'),
      color: /^#[0-9a-f]{6}$/i.test(sb.color || '') ? sb.color : '#25D366', ink: oneOf(sb.ink, ['white', 'dark'], 'white'),
      mobileIcon: typeof sb.mobileIcon === 'boolean' ? sb.mobileIcon : true
    }
  };
  PH.forEach(function (k) { S.f[k] = saved.f && typeof saved.f[k] === 'string' ? saved.f[k] : null; });
  if (saved.map && typeof saved.map === 'object') {
    var okMap = COLS.every(function (k) { return typeof saved.map[k] === 'number' && saved.map[k] >= -1 && saved.map[k] < 50; });
    if (okMap) S.map = { name: saved.map.name, phone: saved.map.phone, amount: saved.map.amount, date: saved.map.date };
  }
  if (saved.sent && typeof saved.sent === 'object') {
    Object.keys(saved.sent).slice(-5000).forEach(function (k) { if (typeof saved.sent[k] === 'number') S.sent[k] = saved.sent[k]; });
  }

  var saveTimer = 0;
  function saveNow() { clearTimeout(saveTimer); store.set('state', S); }
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); }
  window.addEventListener('pagehide', saveNow);

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ------------------------------------------------------------ language + content */
  function msgL() { return S.msgLang || EDU.lang; }
  function C(L) { var A = window.APP_CONTENT || {}; return A[L || msgL()] || A.en || {}; }
  function langTag(L) { return EDU.langInfo(L || msgL()).tag; }
  function tplText(key, L) { return key === 'blank' ? '' : ((C(L).tpl || {})[key] || ''); }
  function msgText() { return S.msg !== null ? S.msg : tplText(S.tpl); }
  function dateFmt(L, opts) {
    try { return new Intl.DateTimeFormat(langTag(L), Object.assign({ numberingSystem: 'latn' }, opts)); }
    catch (e) { return new Intl.DateTimeFormat('en-IN', opts); }
  }
  function defaultDate() { var d = new Date(); d.setDate(d.getDate() + 3); return dateFmt(msgL(), { day: 'numeric', month: 'long' }).format(d); }
  function fillDefault(k) {
    var c = C(), s = c.sample || {};
    if (k === 'name') return s.name || '';
    if (k === 'shop') return s.shop || '';
    if (k === 'amount') return '1250';
    if (k === 'date') return defaultDate();
    return '';
  }
  function fill(k) { return S.f[k] !== null ? S.f[k] : fillDefault(k); }

  /* ------------------------------------------------------------ numbers */
  var ZEROS = [0x660, 0x6F0, 0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0xFF10];
  /* digits typed on an Indian-language keyboard (९८७ / ৯৮৭ / ௯௮௭ / ۹۸۷ ...) become 0-9 */
  function asciiDigits(s) {
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯０-９]/g, function (c) {
      var k = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (k >= ZEROS[i] && k <= ZEROS[i] + 9) return String(k - ZEROS[i]);
      return c;
    });
  }
  /* Phone number in any common Indian way of writing it -> digits with country code (for wa.me).
     kind: empty | mobile | landline | len (India, not 10 digits) | intl | bad | sci (Excel 9.87E+09) */
  /* "98765 43210 / 91234 56789" (two numbers in one cell): use the first one */
  function firstNumber(s) {
    var parts = String(s).split(/\s*(?:[,;\/|]|\bor\b|\bya\b|या|اور|\n)\s*/i).filter(function (x) { return x.trim(); });
    if (parts.length > 1 && parts.every(function (x) { return x.replace(/\D/g, '').length >= 8; })) return parts[0];
    return s;
  }
  function normPhone(raw, cc) {
    var s = firstNumber(asciiDigits(raw).trim());
    var code = asciiDigits(cc).replace(/\D/g, '') || '91';
    if (!s) return { kind: 'empty', digits: '' };
    var compact = s.replace(/\s/g, '');
    if (/^\d(\.\d+)?e\+?\d+$/i.test(compact)) return { kind: 'sci', digits: '' };
    var d = s.replace(/\D/g, '');
    if (!d) return { kind: 'bad', digits: '' };
    if (compact.charAt(0) === '+') { /* already has the country code */ }
    else if (d.slice(0, 2) === '00') d = d.slice(2);              // 0091 98765 43210
    else {
      var nat = d.replace(/^0+/, '');                            // 098765 43210: 0 is the trunk prefix
      if (nat.indexOf(code) === 0 && nat.length - code.length >= (code === '91' ? 10 : 8)) d = nat;   // 91 98765 43210
      else d = code + nat;
    }
    if (/^910\d{10}$/.test(d)) d = '91' + d.slice(3);              // +91 0 98765 43210
    if (d.slice(0, 2) === '91') {
      var n = d.slice(2);
      if (n.length !== 10) return { kind: 'len', digits: d, n: n.length };
      return { kind: /^[6-9]/.test(n) ? 'mobile' : 'landline', digits: d };
    }
    if (d.length < 8 || d.length > 15) return { kind: 'bad', digits: d };
    return { kind: 'intl', digits: d };
  }
  function phoneOk(p) { return p.kind === 'mobile' || p.kind === 'landline' || p.kind === 'intl'; }
  function prettyPhone(d) {
    if (/^91\d{10}$/.test(d)) return '+91 ' + d.slice(2, 7) + ' ' + d.slice(7);
    return d ? '+' + d : '';
  }
  /* for the CSV download: "+91 98765 43210" stays text in Excel ("+919876543210" would become 9.19877E+11) */
  function csvPhone(d) {
    if (/^91\d{10}$/.test(d)) return prettyPhone(d);
    var code = asciiDigits(S.cc).replace(/\D/g, '');
    if (code && d.indexOf(code) === 0 && d.length > code.length) return '+' + code + ' ' + d.slice(code.length);
    return '+' + d.slice(0, d.length - 7) + ' ' + d.slice(-7);
  }
  function statusOf(p) {
    switch (p.kind) {
      case 'empty': return { cls: 'info', icon: 'ℹ️', text: t('st_empty') };
      case 'mobile': return { cls: 'ok', icon: '✓', text: t('st_mobile'), num: prettyPhone(p.digits) };
      case 'landline': return { cls: 'warn', icon: '⚠️', text: t('st_landline'), num: prettyPhone(p.digits) };
      case 'intl': return { cls: 'ok', icon: '✓', text: t('st_intl'), num: prettyPhone(p.digits) };
      case 'len': return { cls: 'bad', icon: '✕', text: t('st_len', { n: EDU.fmt(p.n) }) };
      case 'sci': return { cls: 'bad', icon: '✕', text: t('st_sci') };
      default: return { cls: 'bad', icon: '✕', text: t('st_bad') };
    }
  }
  function showStatus(node, p, emptyText, emptyCls) {
    var s = statusOf(p);
    if (p.kind === 'empty' && emptyText) { s.text = emptyText; s.cls = emptyCls || s.cls; s.icon = '⚠️'; }
    node.className = 'status ' + s.cls;
    node.dataset.kind = p.kind;
    node.textContent = '';
    node.appendChild(el('span', { 'aria-hidden': 'true', text: s.icon + ' ' }));
    node.appendChild(el('span', { text: s.text }));
    if (s.num) { node.appendChild(document.createTextNode(' · ')); node.appendChild(el('bdi', { class: 'num-ltr', dir: 'ltr', text: s.num })); }
  }

  /* ------------------------------------------------------------ links */
  /* encodeURIComponent throws on a lone surrogate (half an emoji, e.g. after cutting text): replace it */
  function wellFormed(s) {
    s = String(s);
    if (s.toWellFormed) return s.toWellFormed();
    return s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g, function (m, p) { return p === undefined ? '�' : p + '�'; });
  }
  function enc(s) { return encodeURIComponent(wellFormed(s)); }       // newline -> %0A, emoji -> UTF-8 bytes
  function waUrl(d, text) { return WA + (d || '') + (text ? '?text=' + enc(text) : ''); }
  function qs(d, text) { var q = []; if (d) q.push('phone=' + d); if (text) q.push('text=' + enc(text)); return q.length ? '?' + q.join('&') : ''; }
  function openUrl(d, text, mode) { return mode === 'web' ? WEB + qs(d, text) : mode === 'app' ? APP + qs(d, text) : waUrl(d, text); }
  function openTarget(mode) { return mode === 'web' ? 'wa_kit' : mode === 'app' ? '_self' : '_blank'; }
  function setOpen(a, d, text, mode) {
    a.href = openUrl(d, text, mode);
    a.target = openTarget(mode);
  }

  /* ------------------------------------------------------------ message building */
  var PH_ANY = /\{(name|amount|date|shop|upi|link)\}/gi;
  /* Replace fill-in words. Lines with an empty optional word ({upi}, {link}) are dropped;
     other empty words stay visible as {name} and are reported in `missing`. */
  function fillMsg(tpl, v) {
    var missing = [], out = [];
    String(tpl == null ? '' : tpl).replace(/\r\n?/g, '\n').split('\n').forEach(function (line) {
      var drop = false;
      line.replace(PH_ANY, function (m, k) { k = k.toLowerCase(); if (OPTIONAL[k] && !String(v[k] == null ? '' : v[k]).trim()) drop = true; return m; });
      if (drop) return;
      out.push(line.replace(PH_ANY, function (m, k) {
        k = k.toLowerCase();
        var val = String(v[k] == null ? '' : v[k]).trim();
        if (!val) { if (missing.indexOf(k) < 0) missing.push(k); return m; }
        return val;
      }));
    });
    return { text: out.join('\n'), missing: missing };
  }
  function utmVal(v) { return String(v || '').trim().toLowerCase().replace(/\s+/g, '_'); }
  var URL_RE = /\bhttps?:\/\/[^\s<>"]+/gi;
  function splitTrail(url) {
    var trail = (url.match(/[.,!?;:'")\]}*_~]+$/) || [''])[0];
    return [url.slice(0, url.length - trail.length), trail];
  }
  /* Add utm_source / utm_medium / utm_campaign to every website link (not to WhatsApp links). */
  function applyUtm(text) {
    var n = 0, first = '', src = utmVal(S.utm.source), med = utmVal(S.utm.medium), camp = utmVal(S.utm.campaign);
    var out = String(text).replace(URL_RE, function (url) {
      var parts = splitTrail(url), u;
      try { u = new URL(parts[0]); } catch (e) { return url; }
      if (/(^|\.)(wa\.me|whatsapp\.com)$/i.test(u.hostname)) return url;
      var changed = false;
      [['utm_source', src], ['utm_medium', med], ['utm_campaign', camp]].forEach(function (p) {
        if (p[1] && !u.searchParams.has(p[0])) { u.searchParams.set(p[0], p[1]); changed = true; }
      });
      if (!changed) return url;
      n++;
      var s = u.toString();
      if (!first) first = s;
      return s + parts[1];
    });
    return { text: out, n: n, first: first };
  }
  function countLinks(text) { return (String(text).match(URL_RE) || []).length; }
  function finalMessage(tpl, v) {
    var r = fillMsg(tpl, v);
    if (S.utm.on) { var u = applyUtm(r.text); r.text = u.text; r.utm = u; }
    return r;
  }
  /* ₹1,250 / Rs. 1250 / 1250.5 -> "1,250" / "1,250.50" (Indian grouping, Latin digits); other text as typed */
  function fmtAmount(v) {
    var s = asciiDigits(v).trim();
    var core = s.replace(/^(₹|rs\.?|inr)\s*/i, '').replace(/\s*\/-\s*$/, '').replace(/\s+/g, '');
    if (/^(\d{1,3}(,\d{2,3})+|\d+)(\.\d+)?$/.test(core) && core.replace(/\D/g, '').length <= 15) {   // more digits lose precision: keep as typed
      var n = parseFloat(core.replace(/,/g, ''));
      if (isFinite(n)) return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
    }
    return s.replace(/^₹\s*/, '');
  }
  /* 2026-10-15 -> "15 October 2026" in the message language; an Excel date number (45945) from a date column too */
  function fmtDate(v, fromColumn) {
    var s = asciiDigits(v).trim(), m, d = null;
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))) {
      d = new Date(+m[1], +m[2] - 1, +m[3]);
      if (d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) d = null;     // 2026-02-30 is not a date: keep as typed
    }
    else if (fromColumn && /^\d{5}(\.\d+)?$/.test(s) && +s > 20000 && +s < 80000) {
      d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+s) * 864e5);
      d = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    if (d && !isNaN(d.getTime())) { try { return dateFmt(msgL(), { day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch (e) { } }
    return s;
  }
  var HONOR = /^(mr|mrs|ms|miss|dr|prof|shri|shree|sri|smt|kum|km|श्री|श्रीमती|सुश्री|कुमारी|डॉ|डॉक्टर|শ্রী|শ্রীমতী|ডঃ|ডা|ਸ਼੍ਰੀ|ਸ੍ਰੀ|ਸ੍ਰੀਮਤੀ|ਡਾ|શ્રી|શ્રીમતી|ડૉ|ଶ୍ରୀ|ଶ୍ରୀମତୀ|ଡାକ୍ତର|ଡଃ|திரு|திருமதி|செல்வி|டாக்டர்|శ్రీ|శ్రీమతి|డా|ಶ್ರೀ|ಶ್ರೀಮತಿ|ಡಾ|ശ്രീ|ശ്രീമതി|ഡോ|ڈاکٹر|جناب|محترم|محترمہ)\.?$/i;
  function firstNameOf(n) {
    var w = String(n).trim().split(/\s+/);
    if (w.length > 1 && HONOR.test(w[0])) return w[0] + ' ' + w[1];
    return w[0] || '';
  }
  function baseVals() {
    var v = {};
    PH.forEach(function (k) { v[k] = fill(k); });
    v.amount = fmtAmount(v.amount);
    v.date = fmtDate(v.date, false);
    return v;
  }

  /* ------------------------------------------------------------ WhatsApp formatting -> HTML */
  var NB = '[^\\p{L}\\p{N}\\p{M}]';                 // a "word boundary" character for WhatsApp markers
  var MARKS = [['\\*', 'strong'], ['_', 'em'], ['~', 's']].map(function (x) {
    var c = x[0];
    return { tag: x[1], re: new RegExp('(^|' + NB + ')' + c + '([^\\s' + c + '](?:[^' + c + '\\n]*?[^\\s' + c + '])?)' + c + '(?=$|' + NB + ')', 'gu') };
  });
  function renderWa(text) {
    var toks = [];
    function tok(html) { toks.push(html); return '\u0001' + (toks.length - 1) + '\u0002'; }
    var s = String(text == null ? '' : text).replace(/\r\n?/g, '\n').replace(/[\u0001\u0002]/g, '');
    s = s.replace(/```([\s\S]*?)```/g, function (m, x) { return x ? tok('<span class="wa-mono">' + esc(x) + '</span>') : m; });
    s = s.replace(/`([^`\n]+)`/g, function (m, x) { return tok('<code class="wa-ic">' + esc(x) + '</code>'); });
    s = s.replace(URL_RE, function (url) { var p = splitTrail(url); return p[0] ? tok('<span class="wa-a">' + esc(p[0]) + '</span>') + p[1] : url; });
    s = s.replace(/\{(name|amount|date|shop|upi|link)\}/gi, function (m) { return tok('<span class="wa-ph">' + esc(m) + '</span>'); });
    function inline(x) {
      x = esc(x);
      MARKS.forEach(function (mk) { x = x.replace(mk.re, function (m, pre, body) { return pre + '<' + mk.tag + '>' + body + '</' + mk.tag + '>'; }); });
      return x;
    }
    var blocks = s.split('\n').map(function (line) {
      var m;
      if ((m = /^>\s?(.*)$/.exec(line))) return { type: 'quote', html: m[1].trim() ? inline(m[1]) : '<br>' };
      if ((m = /^[*-]\s+(.*)$/.exec(line))) return { type: 'ul', html: inline(m[1]) };
      if ((m = /^(\d{1,3})\.\s+(.*)$/.exec(line))) return { type: 'ol', html: inline(m[2]), n: +m[1] };
      return { type: 'p', html: line.trim() ? inline(line) : '<br>' };
    });
    var out = '', i = 0;
    while (i < blocks.length) {
      var b = blocks[i];
      if (b.type === 'p') { out += '<div class="wa-line" dir="auto">' + b.html + '</div>'; i++; continue; }
      var items = [], j = i;
      while (j < blocks.length && blocks[j].type === b.type) { items.push(blocks[j]); j++; }
      if (b.type === 'quote') out += '<blockquote class="wa-quote">' + items.map(function (x) { return '<div class="wa-line" dir="auto">' + x.html + '</div>'; }).join('') + '</blockquote>';
      else {
        var tagName = b.type === 'ul' ? 'ul' : 'ol';
        out += '<' + tagName + ' class="wa-list" dir="auto"' + (b.type === 'ol' && items[0].n !== 1 ? ' start="' + items[0].n + '"' : '') + '>' +
          items.map(function (x) { return '<li>' + x.html + '</li>'; }).join('') + '</' + tagName + '>';
      }
      i = j;
    }
    return out.replace(/\u0001(\d+)\u0002/g, function (m, k) { return toks[+k] || ''; });
  }
  /* one-line summary without the *, _, ~ and ``` markers (for the customer rows) */
  function plainWa(text) {
    var s = String(text || '').replace(/```/g, '').replace(/`([^`\n]+)`/g, '$1');
    MARKS.forEach(function (mk) { s = s.replace(mk.re, function (m, pre, body) { return pre + body; }); });
    return s.replace(/^>\s?|^[*-]\s+/gm, '');
  }
  function nowTime() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function bubbleHtml(text) {
    var body = String(text).trim() ? renderWa(text) : '<div class="wa-line wa-empty">…</div>';
    return body + '<span class="wa-meta" dir="ltr">' + nowTime() + '<span class="tick" aria-hidden="true">✓✓</span></span>';
  }
  var seg = null;
  try { if (window.Intl && Intl.Segmenter) seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' }); } catch (e) { seg = null; }
  function charCount(s) { if (!s) return 0; return seg ? Array.from(seg.segment(s)).length : Array.from(s).length; }
  function wordCount(s) { return String(s).trim() ? String(s).trim().split(/\s+/).length : 0; }

  /* ------------------------------------------------------------ text editing helpers */
  function replaceRange(ta, s, e, text, selStart, selEnd) {
    ta.focus();
    ta.setSelectionRange(s, e);
    var ok = false;
    try { ok = text ? document.execCommand('insertText', false, text) : document.execCommand('delete'); } catch (x) { ok = false; }
    if (!ok || ta.value.slice(s, s + text.length) !== text) {
      ta.setRangeText(text, s, e, 'end');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (selStart !== undefined) ta.setSelectionRange(selStart, selEnd === undefined ? selStart : selEnd);
  }
  /* *bold* _italic_ ~strike~ ```mono``` `code` around the selection (or at the cursor). Markers must touch
     the text, so spaces at the ends of the selection stay outside; each line is wrapped on its own. */
  function wrapSel(ta, mark) {
    var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value, sel = v.slice(s, e);
    if (!sel) { replaceRange(ta, s, e, mark + mark, s + mark.length); return; }
    if (v.slice(s - mark.length, s) === mark && v.slice(e, e + mark.length) === mark) {      // toggle off
      replaceRange(ta, s - mark.length, e + mark.length, sel, s - mark.length, e - mark.length); return;
    }
    if (sel.length > mark.length * 2 && sel.slice(0, mark.length) === mark && sel.slice(-mark.length) === mark) {
      var inner = sel.slice(mark.length, sel.length - mark.length);
      replaceRange(ta, s, e, inner, s, s + inner.length); return;
    }
    var lines = mark === '```' ? [sel] : sel.split('\n');
    var rep = lines.map(function (l) {
      if (!l.trim()) return l;
      var lead = l.match(/^\s*/)[0], trail = l.match(/\s*$/)[0];
      return lead + mark + l.trim() + mark + trail;
    }).join('\n');
    replaceRange(ta, s, e, rep, s, s + rep.length);
  }
  /* > quote, - bullet, 1. numbered: toggles a prefix on every selected line */
  function prefixLines(ta, kind) {
    var v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
    var ls = v.lastIndexOf('\n', s - 1) + 1, le = v.indexOf('\n', e > s && v.charAt(e - 1) === '\n' ? e - 1 : e);
    if (le < 0) le = v.length;
    var lines = v.slice(ls, le).split('\n');
    var re = kind === 'quote' ? /^>\s?/ : kind === 'bullet' ? /^[*-]\s+/ : /^\d{1,3}\.\s+/;
    var all = lines.every(function (l) { return !l.trim() || re.test(l); });
    var n = 0;
    var rep = lines.map(function (l) {
      if (all) return l.replace(re, '');
      if (!l.trim() && lines.length > 1) return l;
      n++;
      return (kind === 'quote' ? '> ' : kind === 'bullet' ? '- ' : n + '. ') + l.replace(re, '');
    }).join('\n');
    replaceRange(ta, ls, le, rep, ls + rep.length);
  }
  function insertAtCursor(ta, text) {
    var s = ta.selectionStart, e = ta.selectionEnd;
    replaceRange(ta, s, e, text, s + text.length);
  }
  function copyQuiet(text) {
    function fallback() {
      var ta = el('textarea', { style: { position: 'fixed', top: '-1000px' } });
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { }
      ta.remove();
    }
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(fallback);
    fallback();
    return Promise.resolve();
  }

  /* ------------------------------------------------------------ LINK & MESSAGE tab */
  var cur = { text: '', digits: '', link: '' };
  var ta = $('#msg');

  function buildStatic() {
    /* message language picker (native names, never translated) */
    var ml = $('#msgLang');
    ml.textContent = '';
    EDU.LANGS.forEach(function (l) { ml.appendChild(el('option', { value: l.code, text: l.native })); });
    ml.value = msgL();
    /* template chips */
    var chips = $('#tplChips');
    chips.textContent = '';
    TPLS.concat(['blank']).forEach(function (k) {
      chips.appendChild(el('button', { type: 'button', class: 'chip tpl', id: 'tpl-' + k, dataset: { tpl: k }, 'aria-pressed': 'false' },
        el('span', { 'aria-hidden': 'true', text: TPL_ICON[k] }), el('span', { text: t('tpl_' + k) })));
    });
    /* insert fill-in words */
    var ins = $('#insBar');
    $$('.ins', ins).forEach(function (b) { b.remove(); });
    PH.forEach(function (k) {
      ins.appendChild(el('button', { type: 'button', class: 'btn btn-sm ins', id: 'ins-' + k, dataset: { ph: k }, title: '{' + k + '}' },
        el('span', { 'aria-hidden': 'true', text: '+' }), el('span', { text: t('ph_' + k) })));
    });
    $$('.wa-ic-svg').forEach(function (n) { n.innerHTML = waSvg(20); });
  }

  function syncInput(id, value) {
    var n = $(id);
    if (n && document.activeElement !== n && n.value !== value) n.value = value;
  }

  function renderLink() {
    syncInput('#cc', S.cc);
    syncInput('#phone', S.phone);
    var p = normPhone(S.phone, S.cc);
    showStatus($('#phoneStatus'), p);
    $('#msgLang').value = msgL();
    var raw = msgText();
    if (ta.value !== raw && (S.msg === null || document.activeElement !== ta)) ta.value = raw;
    /* untouched details show the example in grey (placeholder); the preview still uses it */
    PH.forEach(function (k) {
      syncInput('#f-' + k, S.f[k] !== null ? S.f[k] : '');
      var n = $('#f-' + k), ex = fillDefault(k);
      if (ex) n.placeholder = ex;
      /* dir="auto" looks only at the value: an empty box would show an Urdu example left-to-right */
      if (k === 'name' || k === 'date' || k === 'shop') n.dir = n.value ? 'auto' : (EDU.langInfo(msgL()).dir === 'rtl' ? 'rtl' : 'auto');
    });
    $$('#tplChips .tpl').forEach(function (b) { b.setAttribute('aria-pressed', S.msg === null && b.dataset.tpl === S.tpl ? 'true' : 'false'); });

    var r = finalMessage(raw, baseVals());
    var text = r.text;
    var link = waUrl(p.digits, text);
    cur = { text: text, digits: p.digits, link: link };
    $('#linkOut').value = link;
    $('#openWa').href = link;
    $('#openWeb').href = openUrl(p.digits, text, 'web');
    $('#openWeb').hidden = coarse;
    $('#toQr').href = '../qr-code-maker/index.html?lang=' + EDU.lang;
    $('#preview').innerHTML = bubbleHtml(text);
    $('#pvWho').textContent = p.digits ? prettyPhone(p.digits) : t('pv_anyone');
    $('#pvWho').dir = p.digits ? 'ltr' : 'auto';

    var mw = $('#missingWarn');
    mw.hidden = !r.missing.length;
    if (r.missing.length) mw.textContent = '⚠️ ' + t('missing', { list: r.missing.map(function (k) { return t('ph_' + k); }).join(', ') });

    $('#charCount').textContent = t('count', { n: EDU.fmt(charCount(text)), w: EDU.fmt(wordCount(text)) });
    $('#linkLen').textContent = t('link_len', { n: EDU.fmt(link.length) });
    var lw = $('#longWarn');
    lw.hidden = link.length <= LONG_URL;
    if (!lw.hidden) lw.textContent = '⚠️ ' + t('long_warn', { n: EDU.fmt(link.length) });
    $('#openHint').textContent = t(coarse ? 'hint_phone' : 'hint_desktop');
    $('#keysHint').hidden = coarse;                // keyboard shortcuts mean nothing on a touch phone

    /* UTM */
    $('#utmOn').checked = S.utm.on;
    syncInput('#utm-source', S.utm.source);
    syncInput('#utm-medium', S.utm.medium);
    syncInput('#utm-campaign', S.utm.campaign);
    var us = $('#utmStatus');
    us.textContent = '';
    if (S.utm.on) {
      if (r.utm && r.utm.n) {
        us.appendChild(el('span', { class: 'ok', text: '✓ ' + t('utm_count', { n: EDU.fmt(r.utm.n) }) }));
        us.appendChild(el('span', { class: 'tag-sample', style: { display: 'block' }, dir: 'ltr', text: r.utm.first }));
      } else if (countLinks(text)) us.appendChild(el('span', { class: 'ok', text: '✓ ' + t('utm_count', { n: EDU.fmt(0) }) }));
      else us.appendChild(el('span', { class: 'muted', text: t('utm_none') }));
    }
  }

  function pickTemplate(key) {
    var now = msgText().trim();
    var isTpl = S.msg === null || !now || TPLS.some(function (k) { return tplText(k).trim() === now; });
    if (!isTpl && !window.confirm(t('replace_confirm'))) return;
    S.tpl = key;
    S.msg = key === 'blank' ? '' : null;
    ta.value = msgText();
    renderLink(); save();
    ta.focus();
  }
  /* Ctrl+Enter: same as pressing "Open in WhatsApp" (window.open with 'noopener' always returns null,
     so a "popup blocked" fallback would also send this page away to wa.me) */
  function openCurrent() { $('#openWa').click(); }

  /* ------------------------------------------------------------ CUSTOMER LIST tab */
  function sampleList() {
    var c = C(), head = c.head || ['Name', 'Phone', 'Amount', 'Due date'], people = c.people || [];
    var phones = ['98765 43210', '+91 91234 56789', '070000 12345'], amounts = ['1250', '2500', '800'];
    var lines = [head.join(',')];
    people.slice(0, 3).forEach(function (p, i) {
      var d = new Date(); d.setDate(d.getDate() + 5 + i * 3);
      var iso = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      lines.push([p, phones[i], amounts[i], iso].join(','));
    });
    return lines.join('\n');
  }
  function listText() { return S.list !== null ? S.list : sampleList(); }

  var HEAD_NAME = /name|नाम|নাম|नाव|નામ|ਨਾਮ|ନାମ|பெயர்|పేరు|ಹೆಸರು|പേര്|نام/i;
  var HEAD = {
    phone: /phone|mobile|\bmob\b|whats|contact|\bcell|number|\bno\.?$|फ़ोन|फोन|मोबाइल|नंबर|नम्बर|ফোন|মোবাইল|નંબર|ફોન|મોબાઇલ|ਫ਼ੋਨ|ਫੋਨ|ਮੋਬਾਈਲ|ଫୋନ|ମୋବାଇଲ|தொலைபேசி|கைபேசி|மொபைல்|ఫోన్|మొబైల్|ಫೋನ್|ಮೊಬೈಲ್|ഫോൺ|മൊബൈൽ|فون|موبائل|نمبر/i,
    amount: /amount|\bamt\b|balance|\bbill|total|price|rupee|\brs\b|₹|\binr\b|\bfees?\b|\bdues?\b|outstanding|pending|payable|\brent\b|\bemi\b|udh(a)?ar|baa?ki|राशि|रकम|रक्कम|बकाया|बाकी|बाक़ी|उधार|फ़ीस|फीस|शुल्क|किस्त|টাকা|পরিমাণ|বাকি|રકમ|બાકી|ਰਕਮ|ਬਕਾਇਆ|ରାଶି|ବାକି|தொகை|கட்டணம்|బకాయి|మొత్తం|బాకీ|ಮೊತ್ತ|ಬಾಕಿ|തുക|ബാക്കി|رقم|بقایا|فیس/i,
    date: /date|\bdue\b|\bday\b|when|time|तारीख|तारीख़|दिनांक|तिथि|তারিখ|તારીખ|ਤਾਰੀਖ|ତାରିଖ|தேதி|తేదీ|ದಿನಾಂಕ|തീയതി|تاریخ/i,
    name: /customer|client|party|student|member|ग्राहक|গ্রাহক|ગ્રાહક|ਗਾਹਕ|ଗ୍ରାହକ|வாடிக்கையாளர்|కస్టమర్|ಗ್ರಾಹಕ|ഉപഭോക്താവ്|گاہک/i
  };
  /* "Sr No", "Bill No", "Invoice No", "Roll No", "Customer ID", "#", "क्रमांक": numbers that are not phones or amounts */
  var SERIAL_HEAD = /(^|[\s._\-\/(])(no|nos|num|number|#|id|code|नंबर|नम्बर|नं|सं|संख्या|क्रमांक)\.?\)?$|^(#|s\.?\s?no\.?|sr\.?(\s?no\.?)?|sl\.?(\s?no\.?)?|serial.*|roll.*|क्र.*|अनु.*|ক্রম.*|ક્રમ.*|வ\.?\s?எண்.*|ক্রমিক.*|نمبر شمار)$/i;
  /* all the meanings a heading can have (validated against the data in detect) */
  function headKinds(cell) {
    var c = String(cell || '').toLowerCase().trim();
    if (!c) return [];
    var ks = [];
    if (HEAD_NAME.test(c) || HEAD.name.test(c)) ks.push('name');
    ['phone', 'amount', 'date'].forEach(function (k) { if (HEAD[k].test(c)) ks.push(k); });
    if (SERIAL_HEAD.test(c)) ks = ks.indexOf('phone') >= 0 ? ['phone'] : ['serial'];
    return ks;
  }
  function isDateLike(v) {
    var s = asciiDigits(v).trim();
    return /^\d{4}-\d{1,2}-\d{1,2}([ T].*)?$/.test(s) || /^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}$/.test(s) ||
      /^\d{1,2}(st|nd|rd|th)?[\s\-\/.]+[\p{L}\p{M}]{3,}\.?([\s\-\/.,]+\d{2,4})?$/u.test(s) ||
      /^[\p{L}\p{M}]{3,}\.?\s+\d{1,2}(st|nd|rd|th)?(,?\s+\d{2,4})?$/u.test(s);
  }
  function isSci(v) { return /^\d(\.\d+)?e\+?\d+$/i.test(String(v).replace(/\s/g, '')); }
  function isPhoneLike(v) {
    var s = firstNumber(asciiDigits(v).trim());
    if (!s) return false;
    if (isSci(s)) return true;
    if (/\p{L}/u.test(s) || isDateLike(s)) return false;
    var d = s.replace(/\D/g, '');
    return (d.length >= 10 && d.length <= 15) || (s.charAt(0) === '+' && d.length >= 8 && d.length <= 15);
  }
  function isAmountLike(v) {
    var s = asciiDigits(v).trim().replace(/^(₹|rs\.?|inr)\s*/i, '').replace(/\s*\/-$/, '');
    return /^\d[\d,]*(\.\d{1,2})?$/.test(s) && s.replace(/\D/g, '').length <= 9 && !isDateLike(v);
  }
  function isNameLike(v) { return /\p{L}/u.test(String(v)) && !isDateLike(v) && !isPhoneLike(v); }

  function parseRows(text) {
    var rows = [];
    try { rows = EDU.csv.parse(String(text || '')); } catch (e) { rows = []; }
    return rows.map(function (r) { return r.map(function (c) { return String(c == null ? '' : c).trim(); }); })
      .filter(function (r) { return r.some(function (c) { return c; }); });
  }
  var DATE_WORD = /date|तारीख|तारीख़|दिनांक|तिथि|তারিখ|તારીખ|ਤਾਰੀਖ|ତାରିଖ|தேதி|తేదీ|ದಿನಾಂಕ|തീയതി|تاریخ/i;
  /* Which column is name / phone / amount / date? Headings give candidates, the data decides:
     "Sr No | Name | Mobile" must not use the serial numbers as phones or amounts. */
  function detect(rows) {
    var ncol = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    var first = rows[0] || [], kinds = first.map(headKinds);
    var anyKind = kinds.some(function (k) { return k.length; });
    var firstPhone = first.some(isPhoneLike);
    var header = !firstPhone && (anyKind || rows.slice(1).some(function (r) { return r.some(isPhoneLike); }));
    var data = (header ? rows.slice(1) : rows).slice(0, 80);
    var map = { name: -1, phone: -1, amount: -1, date: -1 }, used = {};
    var TEST = { phone: isPhoneLike, amount: isAmountLike, name: isNameLike, date: function (v) { return isDateLike(v) || /^\d{5}$/.test(asciiDigits(v).trim()); } };
    function score(c, test) {        // share of filled cells that look right; -1 = (almost) empty column
      var filled = 0, ok = 0;
      data.forEach(function (r) { var v = r[c] || ''; if (v) { filled++; if (test(v)) ok++; } });
      if (filled < Math.max(1, data.length * 0.3)) return -1;
      return ok / filled;
    }
    function serialData(c) {         // 1, 2, 3 ... is a serial number column, never an amount
      var nums = data.map(function (r) { return asciiDigits(r[c] || '').trim(); }).filter(Boolean);
      return nums.length >= 2 && nums.every(function (v, i) { return /^\d{1,6}$/.test(v) && (i === 0 || +v === +nums[i - 1] + 1); });
    }
    function take(k, c) { map[k] = c; used[c] = 1; }
    /* 1. columns whose heading says what they are, checked against their data */
    if (header) ['phone', 'amount', 'date', 'name'].forEach(function (k) {
      var bi = -1, bs = -2;
      kinds.forEach(function (ks, c) {
        if (used[c] || ks.indexOf(k) < 0) return;
        if (k === 'amount' && DATE_WORD.test(first[c])) return;          // "Due date" is a date
        var s = data.length ? score(c, TEST[k]) : 1;
        if (s > bs) { bs = s; bi = c; }
      });
      if (bi < 0) return;
      var trust = k === 'date' ? DATE_WORD.test(first[bi]) || bs >= 0.3 : k === 'name' ? bs >= 0.3 : bs >= 0.5;
      if (trust || !data.length) take(k, bi);
      else if (k === 'phone' && bs >= 0) {
        /* a "Phone" column full of bad numbers: still use it, unless another column has real phone numbers */
        var other = false;
        for (var c = 0; c < ncol; c++) if (!used[c] && c !== bi && score(c, isPhoneLike) >= 0.5) other = true;
        if (!other) take(k, bi);
      }
    });
    /* 2. the rest from the data, skipping columns whose heading means something else */
    function best(kind) {
      if (map[kind] >= 0) return;
      var bi = -1, bs = 0;
      for (var c = 0; c < ncol; c++) {
        if (used[c]) continue;
        if (header && kinds[c].length && kinds[c].indexOf(kind) < 0) continue;
        if (kind === 'amount' && serialData(c)) continue;
        var sc = score(c, kind === 'date' ? isDateLike : TEST[kind]);     // a bare 45945 is a date only under a date heading
        if (sc > bs) { bs = sc; bi = c; }
      }
      if (bi >= 0 && bs >= 0.5) take(kind, bi);
    }
    best('phone'); best('date'); best('amount'); best('name');
    return { header: header, map: map, ncol: ncol };
  }
  function buildRows() {
    var raw = parseRows(listText());
    var det = detect(raw);
    var ncol = det.ncol;
    if (S.map && COLS.some(function (k) { return S.map[k] >= ncol; })) S.map = null;
    var header = S.header !== null ? S.header : det.header;
    var map = S.map || det.map;
    var data = header ? raw.slice(1) : raw;
    var truncated = data.length > MAX_ROWS;
    data = data.slice(0, MAX_ROWS);
    var tpl = msgText(), base = baseVals(), seen = {};
    var rows = data.map(function (r, i) {
      function get(k) { return map[k] >= 0 ? (r[map[k]] || '') : null; }
      var name = get('name'), phoneRaw = get('phone'), amount = get('amount'), date = get('date');
      var v = {};
      /* the grey example details (Priya, Sharma General Store, ₹1,250 ...) are never sent to a real customer list:
         an untouched one counts as missing, so the row warns instead */
      PH.forEach(function (k) { v[k] = S.list !== null && S.f[k] === null ? '' : base[k]; });
      v.name = name !== null ? (S.firstName ? firstNameOf(name) : name) : '';
      if (amount !== null) v.amount = fmtAmount(amount);
      if (date !== null) v.date = fmtDate(date, true);
      var m = finalMessage(tpl, v);
      var p = phoneRaw === null || !phoneRaw ? { kind: 'empty', digits: '' } : normPhone(phoneRaw, S.cc);
      var valid = phoneOk(p);
      var dup = valid && seen[p.digits] ? seen[p.digits] : 0;
      if (valid && !dup) seen[p.digits] = i + 1;
      var key = (p.digits || phoneRaw || '') + '|' + String(name || '').toLowerCase();
      return {
        i: i, name: name || '', phoneRaw: phoneRaw || '', p: p, valid: valid, dup: dup, key: key,
        amount: amount !== null && amount ? v.amount : '', date: date !== null ? v.date : '',
        msg: m.text, missing: m.missing, link: valid ? waUrl(p.digits, m.text) : '', sent: !!S.sent[key]
      };
    });
    return { rows: rows, ncol: ncol, header: header, map: map, raw: raw, truncated: truncated, total: (header ? raw.length - 1 : raw.length) };
  }
  function short(s, n) { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  var R = null;
  function renderList() {
    var lt = $('#listIn'), txt = listText();
    if (lt.value !== txt && document.activeElement !== lt) lt.value = txt;
    R = buildRows();
    /* column pickers */
    COLS.forEach(function (k) {
      var sel = $('#map-' + k);
      sel.textContent = '';
      sel.appendChild(el('option', { value: '-1', text: t('col_none') }));
      for (var c = 0; c < R.ncol; c++) {
        var sample = (R.raw[0] || [])[c] || '';
        sel.appendChild(el('option', { value: String(c), text: t('col_n', { n: c + 1 }) + (sample ? ' · ' + short(sample, 22) : '') }));
      }
      sel.value = String(R.map[k]);
    });
    $('#hasHeader').checked = !!R.header;
    $('#firstName').checked = S.firstName;
    $('#openMode').value = S.openMode;
    $('#listTpl').innerHTML = bubbleHtml(msgText());

    var rowsBox = $('#rows');
    rowsBox.textContent = '';
    var valid = R.rows.filter(function (r) { return r.valid; });
    var done = valid.filter(function (r) { return r.sent; }).length;
    var bad = R.rows.filter(function (r) { return !r.valid; }).length;
    var frag = document.createDocumentFragment();
    R.rows.forEach(function (r) {
      var warns = [];
      if (!r.valid) warns.push({ soft: false, text: r.p.kind === 'empty' ? t('no_phone') : statusOf(r.p).text });
      else if (r.p.kind === 'landline') warns.push({ soft: true, text: statusOf(r.p).text });
      if (r.dup) warns.push({ soft: true, text: t('row_dup', { n: EDU.fmt(r.dup) }) });
      if (r.missing.length) warns.push({ soft: true, text: t('missing_row', { list: r.missing.map(function (k) { return t('ph_' + k); }).join(', ') }) });
      var cls = 'lrow' + (r.sent && r.valid ? ' sent' : '') + (!r.valid ? ' bad' : warns.length ? ' warn' : '');
      var meta = el('div', { class: 'lmeta' });
      meta.appendChild(el('bdi', { class: 'num-ltr no-i18n', dir: 'ltr', text: r.valid ? prettyPhone(r.p.digits) : (r.phoneRaw || '—') }));
      if (r.amount) meta.appendChild(el('span', { class: 'no-i18n', text: '₹' + r.amount }));
      if (r.date) meta.appendChild(el('span', { class: 'no-i18n', text: r.date }));
      var open = el('a', { class: 'btn btn-wa btn-sm lopen', rel: 'noopener', dataset: { i: r.i } },
        el('span', { 'aria-hidden': 'true', html: waSvg(18) }), el('span', { text: t('open_chat') }));
      if (r.valid) setOpen(open, r.p.digits, r.msg, S.openMode);
      else { open.setAttribute('aria-disabled', 'true'); open.removeAttribute('href'); }
      var check = el('input', { type: 'checkbox', class: 'lsent', dataset: { i: r.i }, 'aria-label': t('mark_sent') + ': ' + (r.name || r.phoneRaw) });
      check.checked = r.sent && r.valid;
      check.disabled = !r.valid;
      frag.appendChild(el('div', { class: cls, role: 'listitem', dataset: { i: r.i } },
        el('label', { class: 'lcheck', title: t('mark_sent') }, check),
        el('div', { class: 'lmain' },
          el('div', { class: 'lname' }, el('span', { class: 'lnum', text: EDU.fmt(r.i + 1) + '.' }), el('bdi', { class: 'no-i18n', dir: 'auto', text: ' ' + (r.name || '—') }),
            r.sent && r.valid ? el('span', { class: 'ltick', text: ' ✓' }) : null),
          meta,
          el('div', { class: 'lmsg no-i18n', dir: 'auto', text: short(plainWa(r.msg), 140) }),
          warns.map(function (w) { return el('div', { class: 'lwarn' + (w.soft ? ' soft' : ''), text: '⚠️ ' + w.text }); })),
        el('div', { class: 'lact' }, open,
          el('button', { type: 'button', class: 'edu-iconbtn lview', dataset: { i: r.i }, 'aria-label': t('view_msg'), title: t('view_msg'), text: '👁' }),
          el('button', { type: 'button', class: 'edu-iconbtn lcopy', dataset: { i: r.i }, 'aria-label': t('copy_link'), title: t('copy_link'), text: '⧉', disabled: !r.valid }))));
    });
    rowsBox.appendChild(frag);
    $('#listEmpty').hidden = R.rows.length > 0;
    var info = R.rows.length ? t('rows_info', { n: EDU.fmt(R.rows.length) }) + (bad ? ' · ' + t('rows_bad', { n: EDU.fmt(bad) }) : '') : '';
    $('#rowsInfo').textContent = info;
    var pr = $('#listProgress');
    pr.textContent = t('progress', { done: EDU.fmt(done), total: EDU.fmt(valid.length) });
    pr.dataset.done = done; pr.dataset.total = valid.length;
    pr.hidden = !valid.length;
    $('#listBar').style.width = valid.length ? Math.round(done / valid.length * 100) + '%' : '0';
    var next = valid.filter(function (r) { return !r.sent; })[0];
    var on = $('#openNext');
    on.hidden = !next;
    if (next) {
      setOpen(on, next.p.digits, next.msg, S.openMode);
      on.dataset.i = next.i;
      $('#openNextTxt').textContent = t('open_next', { n: EDU.fmt(valid.length - done) });
    } else { on.removeAttribute('href'); delete on.dataset.i; }
    $('#allDone').hidden = !(valid.length && !next);
    var tm = $('#tooMany');
    tm.hidden = !R.truncated;
    if (R.truncated) tm.textContent = '⚠️ ' + t('too_many', { n: EDU.fmt(MAX_ROWS) });
    $('#exportCsv').disabled = !R.rows.length;
    $('#printList').disabled = !R.rows.length;
    $('#clearTicks').disabled = !done;
  }
  function rowAt(i) { return R && R.rows[+i]; }
  function markSent(r, on) {
    if (!r || !r.valid) return;
    if (on) S.sent[r.key] = Date.now(); else delete S.sent[r.key];
    saveNow();
  }
  function showRow(r) {
    var input = el('input', { type: 'text', class: 'modal-link no-i18n', readonly: true, value: r.link || '' });
    var open = el('a', { class: 'btn btn-wa', rel: 'noopener' }, el('span', { 'aria-hidden': 'true', html: waSvg(18) }), el('span', { text: t('open_chat') }));
    var close;
    if (r.valid) setOpen(open, r.p.digits, r.msg, S.openMode); else open.setAttribute('aria-disabled', 'true');
    open.addEventListener('click', function () { if (!r.valid) return; markSent(r, true); setTimeout(function () { if (close) close(); renderList(); }, 0); });
    var body = el('div', {},
      el('div', { class: 'modal-bubble' }, el('div', { class: 'wa-bubble no-i18n', html: bubbleHtml(r.msg) })),
      r.valid ? input : el('p', { class: 'callout danger small', text: r.p.kind === 'empty' ? t('no_phone') : statusOf(r.p).text }),
      el('div', { class: 'row', style: { marginTop: '12px' } }, open,
        el('button', { type: 'button', class: 'btn', text: t('copy_link'), disabled: !r.valid, onclick: function () { EDU.copy(r.link); } }),
        el('button', { type: 'button', class: 'btn', text: t('copy_msg'), onclick: function () { EDU.copy(r.msg); } })));
    close = EDU.modal(body, { title: (r.name || prettyPhone(r.p.digits) || '—') });
  }
  function exportCsv() {
    if (!R || !R.rows.length) return;
    var rows = [['#', t('col_name'), t('col_phone'), t('col_amount'), t('col_date'), t('th_message'), t('ph_link'), t('mark_sent')]];
    R.rows.forEach(function (r) {
      rows.push([r.i + 1, r.name, r.valid ? csvPhone(r.p.digits) : r.phoneRaw, r.amount, r.date, r.msg, r.link, r.sent && r.valid ? '✓' : '']);
    });
    EDU.download('whatsapp-links.csv', EDU.csv.stringify(rows), 'text/csv');
  }
  function printList() {
    if (!R || !R.rows.length) return;
    var area = $('#printArea');
    area.textContent = '';
    var today = dateFmt(EDU.lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    area.appendChild(el('h1', { text: t('print_title') + ' · ' + today }));
    var head = el('tr', {}, ['#', t('mark_sent'), t('col_name'), t('col_phone'), t('col_amount'), t('col_date')].map(function (h) { return el('th', { text: h }); }));
    var body = el('tbody', {}, R.rows.map(function (r) {
      return el('tr', {},
        el('td', { text: EDU.fmt(r.i + 1) }), el('td', { class: 'box', text: r.sent && r.valid ? '☑' : '☐' }),
        el('td', { dir: 'auto', text: r.name }), el('td', { dir: 'ltr', text: r.valid ? prettyPhone(r.p.digits) : r.phoneRaw }),
        el('td', { text: r.amount ? '₹' + r.amount : '' }), el('td', { dir: 'auto', text: r.date }));
    }));
    area.appendChild(el('table', {}, el('thead', {}, head), body));
    window.print();
  }

  /* ------------------------------------------------------------ WEBSITE BUTTON tab */
  function bGreet() { return S.b.greet !== null ? S.b.greet : (C().btn_greet || ''); }
  function bText() { return S.b.text !== null ? S.b.text : (C().btn_text || ''); }
  function lum(hex) {
    var n = parseInt(hex.slice(1), 16);
    var c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function snippet(href, text) {
    var b = S.b, side = b.pos === 'left' ? 'left' : 'right', round = b.style === 'round';
    var label = esc(text.trim() || 'WhatsApp');
    var shape = round ? 'width:60px;height:60px;justify-content:center;border-radius:50%;' : 'padding:12px 20px 12px 16px;border-radius:999px;';
    var lines = [
      '<!-- WhatsApp chat button -->',
      '<a class="wa-chat-btn" href="' + esc(href) + '" target="_blank" rel="noopener" aria-label="' + label + '" title="' + label + '">',
      '  <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path fill="currentColor" d="' + WA_PATH + '"/><path fill="currentColor" d="' + WA_PATH2 + '"/></svg>'
    ];
    if (!round) lines.push('  <span>' + label + '</span>');
    lines.push('</a>', '<style>',
      '.wa-chat-btn{position:fixed;bottom:20px;' + side + ':20px;z-index:2147483000;display:inline-flex;align-items:center;gap:8px;' + shape +
      'background:' + b.color + ';color:' + INK[b.ink] + ';font:600 16px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.25);transition:transform .15s}',
      '.wa-chat-btn:hover{transform:translateY(-2px)}',
      '.wa-chat-btn:focus-visible{outline:3px solid #111;outline-offset:3px}');
    if (!round && b.mobileIcon) lines.push('@media (max-width:480px){.wa-chat-btn{width:60px;height:60px;padding:0;justify-content:center;border-radius:50%}.wa-chat-btn span{display:none}}');
    lines.push('@media print{.wa-chat-btn{display:none}}', '</style>');
    return lines.join('\n');
  }
  function renderButton() {
    syncInput('#b-phone', S.b.phone);
    syncInput('#b-greet', bGreet());
    syncInput('#b-text', bText());
    var p = normPhone(S.b.phone, S.cc);
    showStatus($('#bStatus'), p, t('btn_phone_warn'), 'warn');
    var greet = bGreet().trim(), text = bText().trim() || 'WhatsApp';
    var href = waUrl(p.digits, greet);
    $('#bCode').textContent = snippet(href, text);
    var a = $('#bPreview');
    a.href = href;
    a.className = 'bp no-i18n ' + S.b.style;
    a.setAttribute('aria-label', text);
    a.title = text;
    a.innerHTML = waSvg(28) + (S.b.style === 'pill' ? '<span>' + esc(text) + '</span>' : '');
    a.style.background = S.b.color;
    a.style.color = INK[S.b.ink];
    a.style.left = S.b.pos === 'left' ? '16px' : 'auto';
    a.style.right = S.b.pos === 'right' ? '16px' : 'auto';
    [['#b-style', S.b.style], ['#b-pos', S.b.pos], ['#b-ink', S.b.ink]].forEach(function (x) {
      $$(x[0] + ' button').forEach(function (btn) { btn.setAttribute('aria-pressed', btn.dataset.v === x[1] ? 'true' : 'false'); });
    });
    $('#b-color').value = S.b.color.toLowerCase();
    $$('#b-swatches .swatch').forEach(function (sw) { sw.setAttribute('aria-pressed', sw.dataset.c.toLowerCase() === S.b.color.toLowerCase() ? 'true' : 'false'); });
    $('#b-mobile').checked = S.b.mobileIcon;
    $('#b-mobile-wrap').hidden = S.b.style !== 'pill';
    $('#contrastWarn').hidden = !(S.b.style === 'pill' && contrast(S.b.color, INK[S.b.ink]) < 3);
  }

  /* ------------------------------------------------------------ tabs + render */
  function setTab(k, focus) {
    S.tab = k;
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.dataset.tab === k;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    ['link', 'list', 'button'].forEach(function (x) { $('#p-' + x).hidden = x !== k; });
    renderTab();
    save();
  }
  function renderTab() {
    if (S.tab === 'link') renderLink();
    else if (S.tab === 'list') renderList();
    else renderButton();
  }
  function render() {
    buildStatic();
    renderTab();
  }

  /* ------------------------------------------------------------ events: link tab */
  $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('[role="tab"]'); if (b) setTab(b.dataset.tab); });
  $('#tabs').addEventListener('keydown', function (e) {
    var keys = ['link', 'list', 'button'], i = keys.indexOf(S.tab), rtl = document.documentElement.dir === 'rtl';
    var fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === fwd) i = (i + 1) % 3; else if (e.key === back) i = (i + 2) % 3;
    else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = 2; else return;
    e.preventDefault();
    setTab(keys[i], true);
  });
  $('#cc').addEventListener('input', function () { S.cc = this.value; renderLink(); save(); });
  $('#phone').addEventListener('input', function () { S.phone = this.value; renderLink(); save(); });
  $('#msgLang').addEventListener('change', function () {
    S.msgLang = this.value === EDU.lang ? null : this.value;
    renderLink(); save();
  });
  $('#tplChips').addEventListener('click', function (e) { var b = e.target.closest('.tpl'); if (b) pickTemplate(b.dataset.tpl); });
  ta.addEventListener('input', function () { S.msg = ta.value; renderLink(); save(); });
  ta.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    var k = e.key.toLowerCase();
    if (k === 'enter') { e.preventDefault(); openCurrent(); return; }
    var mark = !e.shiftKey && k === 'b' ? '*' : !e.shiftKey && k === 'i' ? '_' : e.shiftKey && k === 'x' ? '~' : e.shiftKey && k === 'm' ? '```' : null;
    if (mark) { e.preventDefault(); wrapSel(ta, mark); }
  });
  $('#fmtBar').addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });   // keep the selection
  $('#fmtBar').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'fmt-emoji') { toggleEmoji(); return; }
    if (b.dataset.fmt) wrapSel(ta, b.dataset.fmt);
    else if (b.dataset.line) prefixLines(ta, b.dataset.line);
  });
  function toggleEmoji(force) {
    var pop = $('#emojiPop'), btn = $('#fmt-emoji');
    var show = force === undefined ? pop.hidden : force;
    if (show && !pop.firstChild) EMOJIS.forEach(function (em) { pop.appendChild(el('button', { type: 'button', text: em, 'aria-label': em })); });
    pop.hidden = !show;
    btn.setAttribute('aria-expanded', show ? 'true' : 'false');
  }
  $('#emojiPop').addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
  $('#emojiPop').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) insertAtCursor(ta, b.textContent); });
  $('#emojiPop').addEventListener('keydown', function (e) { if (e.key === 'Escape') { toggleEmoji(false); $('#fmt-emoji').focus(); } });
  $('#insBar').addEventListener('mousedown', function (e) { if (e.target.closest('.ins')) e.preventDefault(); });
  $('#insBar').addEventListener('click', function (e) { var b = e.target.closest('.ins'); if (b) insertAtCursor(ta, '{' + b.dataset.ph + '}'); });
  PH.forEach(function (k) {
    $('#f-' + k).addEventListener('input', function () { S.f[k] = this.value; renderLink(); save(); });
  });
  $('#utmOn').addEventListener('change', function () { S.utm.on = this.checked; renderLink(); save(); });
  ['source', 'medium', 'campaign'].forEach(function (k) {
    $('#utm-' + k).addEventListener('input', function () { S.utm[k] = this.value; renderLink(); save(); });
  });
  $('#copyLink').addEventListener('click', function () { EDU.copy(cur.link); });
  $('#copyMsg').addEventListener('click', function () { EDU.copy(cur.text); });
  $('#toQr').addEventListener('click', function () { copyQuiet(cur.link).then(function () { EDU.toast(t('qr_toast'), 4500); }); });
  $('#linkOut').addEventListener('focus', function () { this.select(); });

  /* ------------------------------------------------------------ events: list tab */
  /* UTF-8 (with or without BOM) and UTF-16 ("Unicode Text") files; Excel's plain "CSV (Comma delimited)" is saved
     in the Windows code page, so names like "José" would turn into "Jos�": decode those as windows-1252 */
  function readCsvText(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onerror = rej;
      r.onload = function () {
        var b = new Uint8Array(r.result);
        try {
          if (b[0] === 0xFF && b[1] === 0xFE) return res(new TextDecoder('utf-16le').decode(b));
          if (b[0] === 0xFE && b[1] === 0xFF) return res(new TextDecoder('utf-16be').decode(b));
          try { return res(new TextDecoder('utf-8', { fatal: true }).decode(b)); }
          catch (e) { return res(new TextDecoder('windows-1252').decode(b)); }
        } catch (e2) { EDU.readText(file).then(res, rej); }
      };
      r.readAsArrayBuffer(file);
    });
  }
  var listTimer = 0;
  $('#listIn').addEventListener('input', function () {
    S.list = this.value;
    clearTimeout(listTimer);
    listTimer = setTimeout(function () { renderList(); save(); }, 120);
  });
  $('#loadSample').addEventListener('click', function () { S.list = null; S.map = null; S.header = null; $('#listIn').value = listText(); renderList(); save(); });
  $('#clearList').addEventListener('click', function () { S.list = ''; S.map = null; S.header = null; $('#listIn').value = ''; renderList(); save(); $('#listIn').focus(); });
  $('#importCsv').addEventListener('click', function () {
    EDU.pickFile('.csv,.tsv,.txt,text/csv,text/plain').then(function (file) {
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { EDU.toast(t('file_bad')); return; }
      return readCsvText(file).then(function (txt) {
        if (/^(PK|%PDF|\{\\rtf)/.test(txt) ||/\u0000/.test(txt.slice(0, 2000))) { EDU.toast(t('file_bad')); return; }
        S.list = txt.replace(/^﻿/, ''); S.map = null; S.header = null;
        $('#listIn').value = S.list;
        renderList(); save();
      });
    }).catch(function () { EDU.toast(t('file_bad')); });
  });
  $('#redetect').addEventListener('click', function () { S.map = null; S.header = null; renderList(); save(); });
  COLS.forEach(function (k) {
    $('#map-' + k).addEventListener('change', function () {
      var m = S.map ? Object.assign({}, S.map) : Object.assign({}, R.map), v = +this.value;
      COLS.forEach(function (o) { if (o !== k && m[o] === v && v >= 0) m[o] = -1; });   // one column, one meaning
      m[k] = v; S.map = m;
      renderList(); save();
    });
  });
  $('#hasHeader').addEventListener('change', function () { S.header = this.checked; renderList(); save(); });
  $('#firstName').addEventListener('change', function () { S.firstName = this.checked; renderList(); save(); });
  $('#openMode').addEventListener('change', function () { S.openMode = this.value; renderList(); save(); });
  $('#editMsg').addEventListener('click', function () { setTab('link'); ta.focus(); });
  $('#rows').addEventListener('change', function (e) {
    var c = e.target.closest('.lsent');
    if (!c) return;
    markSent(rowAt(c.dataset.i), c.checked);
    renderList();
    var again = $('#rows .lsent[data-i="' + c.dataset.i + '"]');
    if (again) again.focus();
  });
  $('#rows').addEventListener('click', function (e) {
    var o = e.target.closest('.lopen'), v = e.target.closest('.lview'), cp = e.target.closest('.lcopy');
    if (o) {
      var r = rowAt(o.dataset.i);
      if (!r || !r.valid) { e.preventDefault(); return; }
      markSent(r, true);
      setTimeout(renderList, 0);          // after the browser has followed the link
    } else if (v) showRow(rowAt(v.dataset.i));
    else if (cp) { var r2 = rowAt(cp.dataset.i); if (r2 && r2.link) EDU.copy(r2.link); }
  });
  var lastNext = 0;
  $('#openNext').addEventListener('click', function (e) {
    var r = rowAt(this.dataset.i);
    /* a double-click (or a quick second tap) must not open the NEXT customer too and tick them as sent */
    if (!r || e.detail > 1 || Date.now() - lastNext < 1200) { e.preventDefault(); return; }
    lastNext = Date.now();
    markSent(r, true);
    var self = this;
    setTimeout(function () { renderList(); self.focus(); }, 0);
  });
  $('#exportCsv').addEventListener('click', exportCsv);
  $('#printList').addEventListener('click', printList);
  $('#clearTicks').addEventListener('click', function () {
    if (!window.confirm(t('clear_ticks_confirm'))) return;
    if (R) R.rows.forEach(function (r) { delete S.sent[r.key]; });
    saveNow(); renderList();
  });

  /* ------------------------------------------------------------ events: button tab */
  (function () {
    var box = $('#b-swatches');
    SWATCHES.forEach(function (c) { box.insertBefore(el('button', { type: 'button', class: 'swatch no-i18n', dataset: { c: c }, style: { background: c }, 'aria-label': c, title: c }), $('#b-color')); });
  })();
  $('#b-phone').addEventListener('input', function () { S.b.phone = this.value; renderButton(); save(); });
  $('#b-greet').addEventListener('input', function () { S.b.greet = this.value; renderButton(); save(); });
  $('#b-text').addEventListener('input', function () { S.b.text = this.value; renderButton(); save(); });
  [['#b-style', 'style'], ['#b-pos', 'pos'], ['#b-ink', 'ink']].forEach(function (x) {
    $(x[0]).addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.b[x[1]] = b.dataset.v; renderButton(); save(); });
  });
  $('#b-swatches').addEventListener('click', function (e) { var b = e.target.closest('.swatch'); if (!b) return; S.b.color = b.dataset.c; renderButton(); save(); });
  $('#b-color').addEventListener('input', function () { if (/^#[0-9a-f]{6}$/i.test(this.value)) { S.b.color = this.value; renderButton(); save(); } });
  $('#b-mobile').addEventListener('change', function () { S.b.mobileIcon = this.checked; renderButton(); save(); });
  $('#copyCode').addEventListener('click', function () { EDU.copy($('#bCode').textContent); });
  $('#dlCode').addEventListener('click', function () {
    var page = '<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>WhatsApp chat button</title>\n</head>\n<body>\n' +
      '<!-- Copy from here ... -->\n' + $('#bCode').textContent + '\n<!-- ... to here, and paste it just before </body> on your website. -->\n</body>\n</html>\n';
    EDU.download('whatsapp-chat-button.html', page, 'text/html');
  });

  $('#resetAll').addEventListener('click', function () {
    if (!window.confirm(t('confirm_reset'))) return;
    clearTimeout(saveTimer);
    window.removeEventListener('pagehide', saveNow);
    store.remove('state');
    location.reload();
  });

  EDU.onLang(render);
  render();
  setTab(S.tab);
})();
