/* Time Zone Meeting Planner: IST-first meeting planner for Indian teams working with other countries.
   All conversions use Intl.DateTimeFormat with IANA zones (DST-correct for the chosen date).
   Home zone is Asia/Kolkata. Added cities, working hours, the slot and the title are saved with EDU.store.
   Nothing leaves the device; the .ics file is written in UTC so every calendar shows it correctly. */
(function () {
  'use strict';
  var SLUG = 'timezone-meeting-planner';
  var HOME = 'Asia/Kolkata';
  var MAX_ZONES = 12;
  var DEFAULT_ZONES = ['America/New_York', 'Europe/London', 'Asia/Dubai'];
  var QUICK = ['America/New_York', 'Europe/London', 'Asia/Dubai', 'Asia/Singapore', 'America/Los_Angeles', 'Europe/Berlin', 'Australia/Sydney', 'America/Toronto', 'Asia/Tokyo', 'Asia/Riyadh', 'Asia/Kathmandu'];
  var ABBR = { ist: 'Asia/Kolkata', est: 'America/New_York', edt: 'America/New_York', et: 'America/New_York', cst: 'America/Chicago', cdt: 'America/Chicago', ct: 'America/Chicago', mst: 'America/Denver', mdt: 'America/Denver', pst: 'America/Los_Angeles', pdt: 'America/Los_Angeles', pt: 'America/Los_Angeles', gmt: 'Europe/London', bst: 'Europe/London', cet: 'Europe/Berlin', cest: 'Europe/Berlin', eet: 'Europe/Athens', gst: 'Asia/Dubai', ast: 'Asia/Riyadh', pkt: 'Asia/Karachi', npt: 'Asia/Kathmandu', sgt: 'Asia/Singapore', hkt: 'Asia/Hong_Kong', jst: 'Asia/Tokyo', kst: 'Asia/Seoul', aest: 'Australia/Sydney', aedt: 'Australia/Sydney', awst: 'Australia/Perth', acst: 'Australia/Adelaide', nzst: 'Pacific/Auckland', nzdt: 'Pacific/Auckland', utc: 'UTC', msk: 'Europe/Moscow', sast: 'Africa/Johannesburg', eat: 'Africa/Nairobi', hst: 'Pacific/Honolulu', akst: 'America/Anchorage', brt: 'America/Sao_Paulo', wib: 'Asia/Jakarta', ict: 'Asia/Bangkok' };
  var DURS = [30, 45, 60, 90, 120, 180];
  var HOUR = 3600000, MIN = 60000, DAY = 86400000;
  var COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--c7)', 'var(--c8)'];
  var RATE = ['bad', 'ok', 'good'];

  var store = EDU.store(SLUG);
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;
  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ------------------------------------------------------------ time core (Intl only) */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /* Date.UTC maps years 0-99 to 1900-1999; set the full year explicitly so a typed year such as 0050 stays 50 */
  function utcMs(y, mo, d, h, mi, s) {
    var dt = new Date(Date.UTC(2000, (mo || 1) - 1, d || 1, h || 0, mi || 0, s || 0));
    dt.setUTCFullYear(y);
    return dt.getTime();
  }
  var partsCache = {};
  function partsFmt(tz) {
    if (!partsCache[tz]) partsCache[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    return partsCache[tz];
  }
  /* wall-clock parts of an instant in a zone: {year, month(1-12), day, hour, minute, second} */
  function partsIn(tz, ms) {
    var p = {};
    partsFmt(tz).formatToParts(new Date(ms)).forEach(function (x) { if (x.type !== 'literal') p[x.type] = +x.value; });
    if (p.hour === 24) p.hour = 0;
    return p;
  }
  /* offset of a zone at an instant, in minutes east of UTC (IST = 330, Kathmandu = 345, New York winter = -300) */
  function offsetAt(tz, ms) {
    var p = partsIn(tz, ms);
    var asUTC = utcMs(p.year, p.month, p.day, p.hour, p.minute, p.second || 0);
    return Math.round((asUTC - Math.floor(ms / 1000) * 1000) / MIN);
  }
  /* instant for a wall-clock time in a zone (DST-safe: re-checks the offset at the guessed instant) */
  function wallToUTC(tz, y, mo, d, h, mi) {
    var guess = utcMs(y, mo, d, h || 0, mi || 0);
    var off = offsetAt(tz, guess), utc = guess - off * MIN;
    var off2 = offsetAt(tz, utc);
    if (off2 !== off) utc = guess - off2 * MIN;
    return utc;
  }
  function validTz(tz) { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; } }
  var canonCache = {};
  function canon(tz) {
    if (canonCache[tz] !== undefined) return canonCache[tz];
    var c = null;
    try { c = new Intl.DateTimeFormat('en-US', { timeZone: tz }).resolvedOptions().timeZone || tz; } catch (e) { c = null; }
    canonCache[tz] = c;
    return c;
  }
  function dayNum(p) { return Math.round(utcMs(p.year, p.month, p.day) / DAY); }

  /* DST: a zone "has" DST when its January and July offsets differ; it is "on" when the current offset is the larger one */
  function dstInfo(tz, ms) {
    var y = partsIn(tz, ms).year;
    var jan = offsetAt(tz, utcMs(y, 1, 1)), jul = offsetAt(tz, utcMs(y, 7, 1));
    if (jan === jul) return { has: false, on: false };
    return { has: true, on: offsetAt(tz, ms) === Math.max(jan, jul) };
  }
  /* letter abbreviations we know ourselves, for zones where Intl only says "GMT+8": [standard, daylight] */
  var KNOWN_ABBR = {};
  Object.keys(ABBR).forEach(function (k) {
    if (k.length < 3) return;
    var c = canon(ABBR[k]); if (!c) return;
    (KNOWN_ABBR[c] = KNOWN_ABBR[c] || []).push(k.toUpperCase());
  });
  var abbrCache = {};
  /* EST / BST / IST / AEDT when a locale knows a letter abbreviation, else our own list (GMT, SGT, NPT…), else '' */
  function abbr(tz, ms) {
    var key = tz + '|' + offsetAt(tz, ms);
    if (abbrCache[key] !== undefined) return abbrCache[key];
    var out = '', locs = ['en-US', 'en-GB', 'en-AU', 'en-IN'];
    for (var i = 0; i < locs.length && !out; i++) {
      try {
        var v = new Intl.DateTimeFormat(locs[i], { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date(ms)).filter(function (x) { return x.type === 'timeZoneName'; })[0];
        if (v && /^[A-Z]{2,5}$/.test(v.value)) out = v.value;
      } catch (e) { }
    }
    if (!out) {
      var known = KNOWN_ABBR[canon(tz)], dst = dstInfo(tz, ms);
      if (known) out = (dst.has && dst.on ? known[1] : known[0]) || '';
      else if (offsetAt(tz, ms) === 0 && canon(tz) !== 'UTC') out = 'GMT';
    }
    abbrCache[key] = out;
    return out;
  }
  function fmtOffset(min) {
    if (!min) return 'UTC';
    var a = Math.abs(min), h = Math.floor(a / 60), m = a % 60;
    return 'UTC' + (min < 0 ? '\u2212' : '+') + h + (m ? ':' + pad(m) : '');
  }

  /* ------------------------------------------------------------ localized formatting */
  function locale() { return EDU.langInfo(EDU.lang).tag; }
  var dtfCache = {};
  function dtf(opts) {
    var k = locale() + JSON.stringify(opts);
    if (!dtfCache[k]) {
      try { dtfCache[k] = new Intl.DateTimeFormat(locale(), Object.assign({ numberingSystem: 'latn' }, opts)); }
      catch (e) { dtfCache[k] = new Intl.DateTimeFormat('en-IN', opts); }
    }
    return dtfCache[k];
  }
  function fmtTime(ms, tz) {
    return state.h24 ? dtf({ timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms))
      : dtf({ timeZone: tz, hour: 'numeric', minute: '2-digit', hourCycle: 'h12' }).format(new Date(ms));
  }
  function fmtDay(ms, tz) { return dtf({ timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(ms)); }
  function fmtLongDate(ms, tz) { return dtf({ timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ms)); }
  function fmtRange(start, end, tz) { return fmtTime(start, tz) + ' \u2013 ' + fmtTime(end, tz); }
  function isRTL() { return EDU.langInfo(EDU.lang).dir === 'rtl' || document.documentElement.dir === 'rtl'; }
  /* arrow that points "forward" in the reading direction (Urdu reads right to left) */
  function arrow() { return isRTL() ? '\u2190' : '\u2192'; }
  /* keep a Latin chunk (times, UTC+5:30) in one piece inside right-to-left text: wrap it in a left-to-right isolate.
     Chrome, WhatsApp and most phone apps honour these invisible marks; in LTR languages the text is left untouched */
  function ltr(s) { return isRTL() ? '\u2066' + s + '\u2069' : s; }
  /* label for a whole hour 0..24 (used in the working-hours selects and strip header) */
  function hourLabel(h) {
    if (h === 24) return state.h24 ? '24:00' : hourLabel(0);
    var ms = Date.UTC(2026, 0, 1, h);
    return state.h24 ? dtf({ timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(ms)
      : dtf({ timeZone: 'UTC', hour: 'numeric', hourCycle: 'h12' }).format(ms);
  }
  var periodCache = {};
  function dayPeriod(h) {   // "am" / "pm" in the current locale
    var k = locale() + h;
    if (periodCache[k] === undefined) {
      var parts = dtf({ timeZone: 'UTC', hour: 'numeric', hourCycle: 'h12' }).formatToParts(Date.UTC(2026, 0, 1, h));
      var dp = parts.filter(function (x) { return x.type === 'dayPeriod'; })[0];
      periodCache[k] = dp ? dp.value : (h < 12 ? 'am' : 'pm');
    }
    return periodCache[k];
  }
  function durLabel(d) { return DURS.indexOf(d) >= 0 ? t('dur_' + d) : t('n_min', { n: EDU.fmt(d) }); }

  /* ------------------------------------------------------------ zone catalogue + names */
  var ZONES = [], NAME_KEY = {}, FALLBACK = false;
  function contentCities(lang) { var C = window.APP_CONTENT || {}; return ((C[lang] || C.en || {}).cities) || {}; }
  function buildCatalog() {
    var ids = [];
    try { if (Intl.supportedValuesOf) ids = Intl.supportedValuesOf('timeZone') || []; } catch (e) { ids = []; }
    FALLBACK = !ids.length;
    var keys = Object.keys(contentCities('en')), seen = {};
    keys.concat(ids).forEach(function (id) {
      var c = canon(id); if (!c) return;
      var known = keys.indexOf(id) >= 0;
      if (known && !NAME_KEY[c]) NAME_KEY[c] = id;
      if (seen[c]) return;
      seen[c] = 1;
      ZONES.push({ id: known ? id : c, canon: c });
    });
  }
  /* the id we store: the content key when we know the zone (Asia/Kolkata, not Asia/Calcutta), else the canonical id */
  function prefId(tz) { var c = canon(tz); return c ? (NAME_KEY[c] || c) : tz; }
  function contentKey(tz) { var c = canon(tz); return c ? NAME_KEY[c] : null; }
  function cityName(tz, lang) {
    var key = contentKey(tz);
    if (key) return contentCities(lang || EDU.lang)[key] || contentCities('en')[key] || key;
    var parts = String(tz).split('/');
    return parts[parts.length - 1].replace(/_/g, ' ') + (parts.length > 1 ? ' (' + parts[0] + ')' : '');
  }
  function searchZones(q) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return [];
    var qs = q.replace(/\s+/g, '_');
    var exact = ABBR[q] ? prefId(ABBR[q]) : null;
    var hits = [], hits2 = [], hits3 = [];
    var cur = contentCities(EDU.lang), en = contentCities('en');
    ZONES.forEach(function (z) {
      if (exact && z.id === exact) return;
      var key = contentKey(z.id);
      var names = [key ? (cur[key] || '') : '', key ? (en[key] || '') : '', z.id.replace(/_/g, ' '), z.id, z.canon].join('|').toLowerCase();
      var starts = names.split('|').some(function (n) { return n.indexOf(q) === 0 || n.indexOf('/' + q) >= 0 || n.indexOf(' ' + q) >= 0 || n.indexOf('/' + qs) >= 0; });
      if (starts) hits.push(z.id);
      else if (names.indexOf(q) >= 0 || names.indexOf(qs) >= 0) hits2.push(z.id);
      else if (key && q.length >= 3 && names.indexOf(q.slice(0, 3)) >= 0 && names.indexOf(q.slice(-3)) >= 0) hits3.push(z.id);
    });
    var out = (exact ? [exact] : []).concat(hits, hits2, hits3);
    /* zones with a friendly name first */
    out.sort(function (a, b) { var ka = contentKey(a) ? 0 : 1, kb = contentKey(b) ? 0 : 1; return ka - kb; });
    if (exact) { out = [exact].concat(out.filter(function (x) { return x !== exact; })); }
    return out.slice(0, 10);
  }

  /* ------------------------------------------------------------ state */
  var state;
  function todayParts() { return partsIn(HOME, Date.now()); }
  function iso(p) { return p.year + '-' + pad(p.month) + '-' + pad(p.day); }
  function defaults() {
    var p = todayParts(), h = p.hour + 1, d = p;
    if (h > 20) { h = 10; d = partsIn(HOME, Date.now() + DAY); }
    return { zones: DEFAULT_ZONES.map(function (z) { return { tz: z, ws: 9, we: 18 }; }), home: { ws: 9, we: 18 }, date: iso(d), time: pad(h) + ':00', from: HOME, dur: 60, h24: false, title: '' };
  }
  function hr(v, d) { v = parseInt(v, 10); return isNaN(v) || v < 0 || v > 24 ? d : v; }
  function fixHours(o) { if (o.ws > 23) o.ws = 23; if (o.we <= o.ws) o.we = Math.min(24, o.ws + 1); return o; }
  /* validate anything coming from storage or a share link */
  function clean(s) {
    var d = defaults();
    if (!s || typeof s !== 'object') return d;
    var o = { zones: [] };
    (Array.isArray(s.zones) ? s.zones : []).forEach(function (z) {
      if (o.zones.length >= MAX_ZONES) return;
      var tz = z && typeof z.tz === 'string' ? z.tz : null;
      if (!tz || tz.length > 64 || !validTz(tz) || canon(tz) === canon(HOME)) return;
      if (o.zones.some(function (x) { return canon(x.tz) === canon(tz); })) return;
      o.zones.push(fixHours({ tz: prefId(tz), ws: hr(z.ws, 9), we: hr(z.we, 18) }));
    });
    o.home = fixHours({ ws: hr(s.home && s.home.ws, 9), we: hr(s.home && s.home.we, 18) });
    o.date = /^\d{4}-\d{2}-\d{2}$/.test(s.date) && !isNaN(Date.parse(s.date)) ? s.date : d.date;
    o.time = /^\d{2}:\d{2}$/.test(s.time) && +s.time.slice(0, 2) < 24 && +s.time.slice(3) < 60 ? s.time : d.time;
    o.from = typeof s.from === 'string' && (canon(s.from) === canon(HOME) || o.zones.some(function (z) { return canon(z.tz) === canon(s.from); })) ? prefId(s.from) : HOME;
    o.dur = parseInt(s.dur, 10); if (isNaN(o.dur) || o.dur < 15 || o.dur > 720) o.dur = 60;
    o.h24 = !!s.h24;
    o.title = typeof s.title === 'string' ? s.title.slice(0, 80) : '';
    return o;
  }
  function save() { store.set('state', state); }
  function fromLink() {
    var q;
    try { q = new URLSearchParams(location.search).get('s'); } catch (e) { q = null; }
    if (!q) return null;
    var o = EDU.unpack(q);
    if (!o || typeof o !== 'object' || !Array.isArray(o.p)) { EDU.toast(t('link_bad')); return null; }
    var s = clean({ zones: o.p.map(function (z) { return Array.isArray(z) ? { tz: z[0], ws: z[1], we: z[2] } : null; }), home: { ws: (o.h || [])[0], we: (o.h || [])[1] }, date: o.d, time: o.t, from: o.z, dur: o.u, h24: !!o.c, title: o.n });
    try { var u = new URL(location.href); u.searchParams.delete('s'); history.replaceState(null, '', u.pathname + (u.search || '') + u.hash); } catch (e) { }
    return s;
  }

  /* ------------------------------------------------------------ derived values */
  function startMs() {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(state.date), tm = /^(\d{2}):(\d{2})$/.exec(state.time);
    if (!m || !tm) return null;
    return wallToUTC(state.from, +m[1], +m[2], +m[3], +tm[1], +tm[2]);
  }
  function people() { return [{ tz: HOME, ws: state.home.ws, we: state.home.we, home: true }].concat(state.zones); }
  function ctx() {
    var start = startMs();
    if (start === null || isNaN(start)) return null;
    var hp = partsIn(HOME, start);
    return { start: start, end: start + state.dur * MIN, hp: hp, dayStart: wallToUTC(HOME, hp.year, hp.month, hp.day, 0, 0), people: people() };
  }
  /* 2 = inside working hours, 1 = up to 2 h before/after, 0 = night */
  function rate(p, start, end) {
    var sp = partsIn(p.tz, start), ep = partsIn(p.tz, end - MIN);
    var sMin = sp.hour * 60 + sp.minute, eMin = ep.hour * 60 + ep.minute + 1;
    if (dayNum(ep) !== dayNum(sp)) eMin += 1440;
    if (sMin >= p.ws * 60 && eMin <= p.we * 60) return 2;
    if (sMin >= (p.ws - 2) * 60 && eMin <= (p.we + 2) * 60) return 1;
    return 0;
  }
  function colorOf(i) { return i === 0 ? 'var(--primary)' : COLORS[(i - 1) % COLORS.length]; }

  /* ------------------------------------------------------------ actions */
  function setSlotIST(dayStart, minutes, dur) {
    var ms = dayStart + minutes * MIN, p = partsIn(HOME, ms);
    state.from = HOME; state.date = iso(p); state.time = pad(p.hour) + ':' + pad(p.minute);
    if (dur) state.dur = dur;
    save(); renderAll();
  }
  function addZone(tz) {
    tz = prefId(tz);
    if (!tz || !validTz(tz)) return;
    if (canon(tz) === canon(HOME) || state.zones.some(function (z) { return canon(z.tz) === canon(tz); })) { EDU.toast(t('already_added', { city: cityName(tz) })); return; }
    if (state.zones.length >= MAX_ZONES) { EDU.toast(t('max_people', { n: EDU.fmt(MAX_ZONES) })); return; }
    state.zones.push({ tz: tz, ws: 9, we: 18 });
    save(); renderAll();
    EDU.toast(t('added', { city: cityName(tz) }));
  }
  function removeZone(i) {
    var z = state.zones[i]; if (!z) return;
    if (canon(state.from) === canon(z.tz)) {   // keep the same instant, now expressed in IST
      var ms = startMs(); if (ms !== null) { var p = partsIn(HOME, ms); state.date = iso(p); state.time = pad(p.hour) + ':' + pad(p.minute); }
      state.from = HOME;
    }
    state.zones.splice(i, 1);
    save(); renderAll();
    EDU.toast(t('removed', { city: cityName(z.tz) }));
  }

  /* ------------------------------------------------------------ rendering */
  function renderControls() {
    $('#date').value = state.date; $('#time').value = state.time;
    var dur = $('#dur');
    $$('option[data-extra]', dur).forEach(function (o) { o.remove(); });
    if (DURS.indexOf(state.dur) < 0) dur.appendChild(el('option', { value: String(state.dur), text: durLabel(state.dur), 'data-extra': '1' }));
    dur.value = String(state.dur);
    var from = $('#from'); from.textContent = '';
    people().forEach(function (p) { from.appendChild(el('option', { value: p.tz, text: cityName(p.tz) })); });
    from.value = state.from;
    $$('#hseg button').forEach(function (b) { b.setAttribute('aria-pressed', String((b.dataset.h === '24') === state.h24)); });
    $('#title').value = state.title;
    $('#fallback-note').hidden = !FALLBACK;
  }

  function hourSelect(val, lo, hi, label, onchange) {
    var s = el('select', { 'aria-label': label, onchange: function () { onchange(+s.value); } });
    for (var h = lo; h <= hi; h++) s.appendChild(el('option', { value: String(h), text: hourLabel(h) }));
    s.value = String(val);
    return s;
  }
  function tzBadges(tz, ms) {
    var off = offsetAt(tz, ms), ab = abbr(tz, ms), dst = dstInfo(tz, ms), out = [];
    if (ab) out.push(el('span', { class: 'badge tzb num', text: ab }));
    out.push(el('span', { class: 'badge tzb num', text: fmtOffset(off) }));
    if (dst.on) out.push(el('span', { class: 'badge tzb accent', text: t('dst') }));
    return out;
  }
  function renderPeople(c) {
    var ul = $('#people'); ul.textContent = '';
    var ref = c ? c.start : Date.now();
    c.people.forEach(function (p, i) {
      var zi = i - 1, name = cityName(p.tz);
      var li = el('li', { class: 'prow', 'data-tz': p.tz, style: { '--pc': colorOf(i) } });
      var nm = el('div', { class: 'pname' }, el('b', { text: (p.home ? '\uD83C\uDFE0 ' : '') + name }));
      if (p.home) nm.appendChild(el('span', { class: 'badge primary tzb', text: t('home_badge') }));
      tzBadges(p.tz, ref).forEach(function (b) { nm.appendChild(b); });
      li.appendChild(nm);
      if (!p.home) li.appendChild(el('button', { type: 'button', class: 'btn btn-ghost btn-sm del', 'aria-label': t('remove_city', { city: name }), title: t('remove_city', { city: name }), text: '\u2715', onclick: function () { removeZone(zi); } }));
      var target = p.home ? state.home : state.zones[zi];
      var hours = el('div', { class: 'phours' },
        el('span', { text: t('work_hours') + ':' }),
        hourSelect(p.ws, 0, 23, t('work_hours') + ' \u2013 ' + name, function (v) { target.ws = v; fixHours(target); save(); renderAll(); }),
        el('span', { text: t('to') }),
        hourSelect(p.we, 1, 24, t('work_hours') + ' \u2013 ' + name, function (v) { target.we = v; fixHours(target); save(); renderAll(); }));
      li.appendChild(hours);
      li.appendChild(el('div', { class: 'pnow' }, el('span', { text: t('now_marker') + ': ' }), el('span', { class: 'num pnow-t', 'data-tz': p.tz, text: fmtTime(Date.now(), p.tz) })));
      ul.appendChild(li);
    });
    var q = $('#quick'); q.textContent = '';
    var left = QUICK.filter(function (z) { return !c.people.some(function (p) { return canon(p.tz) === canon(z); }); }).slice(0, 7);
    if (left.length && state.zones.length < MAX_ZONES) {
      q.appendChild(el('span', { class: 'tiny muted', text: t('quick_add') }));
      left.forEach(function (z) { q.appendChild(el('button', { type: 'button', class: 'chip', text: '+ ' + cityName(z), onclick: function () { addZone(z); } })); });
    }
  }

  function renderResults(c) {
    $('#res-date').textContent = fmtLongDate(c.start, HOME) + ' \u00B7 ' + durLabel(state.dur);
    var ul = $('#results'); ul.textContent = '';
    var homeDay = dayNum(c.hp);
    c.people.forEach(function (p, i) {
      var r = rate(p, c.start, c.end), sp = partsIn(p.tz, c.start), ep = partsIn(p.tz, c.end);
      var shift = dayNum(sp) - homeDay;
      var li = el('li', { class: p.home ? 'home' : '', 'data-tz': p.tz, style: { '--pc': colorOf(i) } });
      li.appendChild(el('div', { class: 'rn', text: cityName(p.tz) }));
      var meta = el('div', { class: 'rm' }); tzBadges(p.tz, c.start).forEach(function (b) { meta.appendChild(b); }); li.appendChild(meta);
      li.appendChild(el('div', { class: 'rt num', text: fmtRange(c.start, c.end, p.tz) }));
      var rd = el('div', { class: 'rd' }, el('span', { class: 'num', text: fmtDay(c.start, p.tz) + (dayNum(ep) !== dayNum(sp) ? ' ' + arrow() + ' ' + fmtDay(c.end, p.tz) : '') }));
      if (shift) rd.appendChild(el('span', { class: 'shift', text: shift > 0 ? t('next_day') : t('prev_day') }));
      rd.appendChild(el('span', { class: 'rate ' + RATE[r], text: t(RATE[r]) }));
      li.appendChild(rd);
      ul.appendChild(li);
    });
  }

  var drag = null;
  function renderStrip(c) {
    var wrap = $('#strip-wrap'); wrap.textContent = '';
    var table = el('table', { class: 'strip', role: 'grid', 'aria-label': t('sec_strip') });
    var thead = el('thead'), hrow = el('tr');
    hrow.appendChild(el('th', { class: 'who', scope: 'col', text: t('hour_ist') }));
    var nowH = -1, np = partsIn(HOME, Date.now());
    if (dayNum(np) === dayNum(c.hp)) nowH = np.hour;
    var selCols = [];
    for (var h = 0; h < 24; h++) {
      var cs = c.dayStart + h * HOUR;
      var sel = cs < c.end && cs + HOUR > c.start;
      selCols.push(sel);
      var lbl = state.h24 ? pad(h) : String(h % 12 || 12);
      var b = el('button', { type: 'button', class: 'hb' + (sel ? ' sel' : '') + (h === nowH ? ' now' : ''), 'data-h': String(h), 'aria-label': hourLabel(h) + ' IST' + (h === nowH ? ' (' + t('now_marker') + ')' : ''), 'aria-pressed': String(sel) },
        lbl, el('small', { text: h === nowH ? '\u25CF ' + t('now_marker') : (state.h24 ? ':00' : dayPeriod(h)) }));
      hrow.appendChild(el('th', { class: 'hh', scope: 'col' }, b));
    }
    thead.appendChild(hrow); table.appendChild(thead);
    var tbody = el('tbody');
    var allGood = [];
    for (h = 0; h < 24; h++) allGood.push(0);
    c.people.forEach(function (p, i) {
      var tr = el('tr', { 'data-tz': p.tz });
      tr.appendChild(el('th', { class: 'who', scope: 'row', style: { '--pc': colorOf(i) } }, el('b', { text: cityName(p.tz) }), el('small', { class: 'num', text: fmtOffset(offsetAt(p.tz, c.start)) })));
      for (var h2 = 0; h2 < 24; h2++) {
        var cs2 = c.dayStart + h2 * HOUR, r = rate(p, cs2, cs2 + HOUR), lp = partsIn(p.tz, cs2);
        if (r === 2) allGood[h2]++;
        var shift = dayNum(lp) - dayNum(c.hp);
        var main = state.h24 ? pad(lp.hour) + ':' + pad(lp.minute) : String(lp.hour % 12 || 12) + (lp.minute ? ':' + pad(lp.minute) : '');
        var sub = (state.h24 ? '' : dayPeriod(lp.hour)) + (shift ? ' ' + (shift > 0 ? '+1' : '\u22121') : '');
        tr.appendChild(el('td', { class: 'hc ' + RATE[r] + (selCols[h2] ? ' sel' : ''), 'data-h': String(h2), 'data-r': String(r) }, main, el('small', { class: 'num', text: sub.trim() || '\u00A0' })));
      }
      tbody.appendChild(tr);
    });
    var sum = el('tr', { class: 'sumrow' });
    sum.appendChild(el('th', { class: 'who', scope: 'row', text: t('in_office') }));
    for (h = 0; h < 24; h++) sum.appendChild(el('td', { class: 'sum num' + (allGood[h] === c.people.length ? ' all' : ''), 'data-h': String(h), text: allGood[h] + '/' + c.people.length }));
    tbody.appendChild(sum);
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  function renderBest(c) {
    var box = $('#best'); box.textContent = '';
    var list = [];
    for (var s = 0; s < 48; s++) {
      var st = c.dayStart + s * 30 * MIN, en = st + state.dur * MIN, score = 0, good = 0, rates = [];
      c.people.forEach(function (p) { var r = rate(p, st, en); score += r; if (r === 2) good++; rates.push(r); });
      list.push({ st: st, en: en, score: score, good: good, rates: rates });
    }
    list.sort(function (a, b) { return b.score - a.score || b.good - a.good || a.st - b.st; });
    var n = c.people.length, top = list.slice(0, 5);
    if (!top.length) return;
    if (top[0].good < n) box.appendChild(el('p', { class: 'callout warning small', text: t('no_best') }));
    var ul = el('ul', { class: 'best' });
    top.forEach(function (x) {
      var all = x.good === n;
      var li = el('li', { class: all ? 'all' : '' },
        el('span', { class: 'bt num', text: fmtRange(x.st, x.en, HOME) + ' IST' }),
        el('span', { class: 'dots', 'aria-hidden': 'true' }, x.rates.map(function (r, i) { return el('span', { class: 'dot ' + RATE[r], title: cityName(c.people[i].tz) }); })),
        el('span', { class: 'bn', text: all ? t('best_all') : t('best_some', { n: EDU.fmt(x.good), total: EDU.fmt(n) }) }),
        el('button', { type: 'button', class: 'btn btn-sm use', text: t('use_slot'), 'aria-label': t('use_slot') + ': ' + fmtRange(x.st, x.en, HOME) + ' IST', onclick: function () { setSlotIST(c.dayStart, Math.round((x.st - c.dayStart) / MIN)); } }));
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }

  function siteUrl() { try { return EDU.shareUrl('en'); } catch (e) { return location.href.split(/[?#]/)[0]; } }
  function inviteText(c) {
    var lines = [state.title.trim() || t('default_title'), fmtLongDate(c.start, HOME) + ' \u00B7 ' + t('invite_duration', { d: durLabel(state.dur) }), ''];
    c.people.forEach(function (p) {
      var ab = abbr(p.tz, c.start), tag = ltr('(' + (ab ? ab + ', ' : '') + fmtOffset(offsetAt(p.tz, c.start)) + ')');
      var sp = partsIn(p.tz, c.start), ep = partsIn(p.tz, c.end);
      var when = dayNum(sp) === dayNum(ep) ? ltr(fmtRange(c.start, c.end, p.tz)) + ', ' + fmtDay(c.start, p.tz)
        : ltr(fmtTime(c.start, p.tz)) + ', ' + fmtDay(c.start, p.tz) + ' \u2013 ' + ltr(fmtTime(c.end, p.tz)) + ', ' + fmtDay(c.end, p.tz);
      lines.push('\u2022 ' + cityName(p.tz) + ' ' + tag + ': ' + when);
    });
    lines.push('', t('invite_foot', { url: siteUrl() }));
    return lines.join('\n');
  }
  function shareLink() {
    var o = { v: 1, d: state.date, t: state.time, z: state.from, u: state.dur, h: [state.home.ws, state.home.we], p: state.zones.map(function (z) { return [z.tz, z.ws, z.we]; }), c: state.h24 ? 1 : 0, n: state.title };
    return siteUrl() + '?s=' + EDU.pack(o) + (EDU.lang !== 'en' ? '&lang=' + EDU.lang : '');
  }
  function renderInvite(c) {
    var text = inviteText(c);
    $('#invite').value = text;
    $('#wa').href = EDU.waLink(text);
    $('#share-url').value = shareLink();
  }

  function renderClocks() {
    var box = $('#clocks'); box.textContent = '';
    people().forEach(function (p, i) {
      var now = Date.now();
      var card = el('div', { class: 'ck', 'data-tz': p.tz, style: { '--pc': colorOf(i) } },
        el('div', { class: 'ckn', text: cityName(p.tz) }),
        el('div', { class: 'ckt num', text: fmtTime(now, p.tz) }),
        el('div', { class: 'ckd' }, el('span', { class: 'num ckdt', text: fmtDay(now, p.tz) }), el('span', { class: 'num', text: fmtOffset(offsetAt(p.tz, now)) })));
      box.appendChild(card);
    });
  }
  function tick() {
    var now = Date.now();
    $$('#clocks .ck').forEach(function (card) {
      var tz = card.dataset.tz;
      $('.ckt', card).textContent = fmtTime(now, tz);
      $('.ckdt', card).textContent = fmtDay(now, tz);
    });
    $$('#people .pnow-t').forEach(function (s) { s.textContent = fmtTime(now, s.dataset.tz); });
    var np = partsIn(HOME, now);
    if (np.hour !== lastHour) { lastHour = np.hour; var c = ctx(); if (c) renderStrip(c); }
  }
  var lastHour = partsIn(HOME, Date.now()).hour;

  function renderAll() {
    renderControls();
    var c = ctx();
    $('#time-err').hidden = !!c;
    if (!c) return;
    renderPeople(c); renderResults(c); renderStrip(c); renderBest(c); renderInvite(c); renderClocks();
  }

  /* ------------------------------------------------------------ events */
  $('#date').addEventListener('change', function () {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.value) || isNaN(Date.parse(this.value))) { $('#time-err').hidden = false; return; }
    state.date = this.value; save(); renderAll();
  });
  $('#time').addEventListener('change', function () {
    if (!/^\d{2}:\d{2}/.test(this.value)) { $('#time-err').hidden = false; return; }
    state.time = this.value.slice(0, 5); save(); renderAll();
  });
  $('#dur').addEventListener('change', function () { state.dur = parseInt(this.value, 10) || 60; save(); renderAll(); });
  $('#from').addEventListener('change', function () { state.from = this.value; save(); renderAll(); });
  $$('#hseg button').forEach(function (b) { b.addEventListener('click', function () { state.h24 = b.dataset.h === '24'; save(); renderAll(); }); });
  $('#title').addEventListener('input', function () { state.title = this.value.slice(0, 80); save(); var c = ctx(); if (c) renderInvite(c); });

  /* city search */
  var q = $('#city-q'), results = $('#city-results'), noMatch = $('#no-match');
  function showResults() {
    results.textContent = '';
    var hits = searchZones(q.value);
    noMatch.hidden = !(q.value.trim() && !hits.length);
    hits.forEach(function (tz) {
      var now = Date.now();
      results.appendChild(el('button', { type: 'button', class: 'cres', 'data-tz': tz, onclick: function () { addZone(tz); q.value = ''; showResults(); q.focus(); } },
        el('span', { text: cityName(tz) }), el('span', { class: 'cm num', text: fmtOffset(offsetAt(tz, now)) + ' \u00B7 ' + fmtTime(now, tz) })));
    });
  }
  q.addEventListener('input', showResults);
  q.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); var first = $('.cres', results); if (first) first.click(); }
    else if (e.key === 'Escape') { q.value = ''; showResults(); }
    else if (e.key === 'ArrowDown') { var f = $('.cres', results); if (f) { e.preventDefault(); f.focus(); } }
  });
  results.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    var items = $$('.cres', results), i = items.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    var n = i + (e.key === 'ArrowDown' ? 1 : -1);
    if (n < 0) q.focus(); else if (items[n]) items[n].focus();
  });

  /* strip: tap = start here, mouse drag = start + length, keyboard = arrows + Enter */
  var wrap = $('#strip-wrap');
  function colOf(node) { var c = node && node.closest ? node.closest('[data-h]') : null; return c ? +c.dataset.h : null; }
  function colAt(x, y) { var n = document.elementFromPoint(x, y); return n && wrap.contains(n) ? colOf(n) : null; }
  function paintDrag() {
    var a = Math.min(drag.a, drag.b), b = Math.max(drag.a, drag.b);
    $$('[data-h]', wrap).forEach(function (n) { var h = +n.dataset.h; n.classList.toggle('drag', drag.moved && h >= a && h <= b); });
  }
  wrap.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    var h = colOf(e.target); if (h === null) return;
    drag = { a: h, b: h, moved: false, id: e.pointerId };
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var h = colAt(e.clientX, e.clientY);
    if (h !== null && h !== drag.b) { drag.b = h; drag.moved = true; paintDrag(); }
  });
  document.addEventListener('pointerup', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    var c = ctx(); if (!c) return;
    var a = Math.min(d.a, d.b), b = Math.max(d.a, d.b);
    setSlotIST(c.dayStart, a * 60, d.moved ? Math.min(720, (b - a + 1) * 60) : null);
    var btn = $('.hb[data-h="' + a + '"]', wrap); if (btn && e.pointerType !== 'touch') btn.focus({ preventScroll: true });
  });
  document.addEventListener('pointercancel', function () { if (drag) { drag = null; $$('.drag', wrap).forEach(function (n) { n.classList.remove('drag'); }); } });
  wrap.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.hb') : null;
    if (!b || e.detail !== 0) return;   // keyboard "click" only; pointer taps are handled on pointerup
    var c = ctx(); if (c) { setSlotIST(c.dayStart, +b.dataset.h * 60); var nb = $('.hb[data-h="' + b.dataset.h + '"]', wrap); if (nb) nb.focus({ preventScroll: true }); }
  });
  wrap.addEventListener('keydown', function (e) {
    var b = e.target.closest ? e.target.closest('.hb') : null; if (!b) return;
    var h = +b.dataset.h, n = null;
    if (e.key === 'ArrowRight') n = Math.min(23, h + 1); else if (e.key === 'ArrowLeft') n = Math.max(0, h - 1);
    else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = 23;
    if (n === null) return;
    e.preventDefault();
    var nb = $('.hb[data-h="' + n + '"]', wrap); if (nb) { nb.focus(); nb.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  });

  /* invite actions */
  $('#copy-invite').addEventListener('click', function () { EDU.copy($('#invite').value); });
  $('#share').addEventListener('click', function () { var u = shareLink(); $('#share-url').value = u; EDU.copy(u); });
  $('#ics').addEventListener('click', function () {
    var c = ctx(); if (!c) return;
    var stamp = function (ms) { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var esc = function (s) { return String(s).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, function (ch) { return '\\' + ch; }); };
    var fold = function (line) {   // RFC 5545: lines of at most 75 octets, continuation lines start with a space; never split a UTF-8 character
      var enc = new TextEncoder().encode(line); if (enc.length <= 75) return line;
      var out = [], i = 0, first = true, dec = new TextDecoder();
      while (i < enc.length) {
        var j = Math.min(i + (first ? 75 : 74), enc.length);
        while (j < enc.length && j > i && (enc[j] & 0xC0) === 0x80) j--;
        out.push((first ? '' : ' ') + dec.decode(enc.slice(i, j)));
        i = j; first = false;
      }
      return out.join('\r\n');
    };
    var uid = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '@apnipathshala.ai';
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AI Pathshala//Time Zone Meeting Planner//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + uid, 'DTSTAMP:' + stamp(Date.now()), 'DTSTART:' + stamp(c.start), 'DTEND:' + stamp(c.end),
      'SUMMARY:' + esc(state.title.trim() || t('default_title')), 'DESCRIPTION:' + esc(inviteText(c)), 'END:VEVENT', 'END:VCALENDAR'];
    EDU.download('meeting-' + state.date + '-' + state.time.replace(':', '') + '.ics', lines.map(fold).join('\r\n') + '\r\n', 'text/calendar');
  });
  $('#reset-all').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    state = defaults(); store.remove('state'); renderAll(); EDU.toast(t('reset_done'));
  });

  /* ------------------------------------------------------------ start */
  buildCatalog();
  var linked = fromLink();
  state = linked || clean(store.get('state'));
  if (!linked && state.date < iso(todayParts())) { var d0 = defaults(); state.date = d0.date; state.time = d0.time; }
  if (linked) { save(); EDU.toast(t('link_loaded')); }
  EDU.onLang(function () { dtfCache = {}; periodCache = {}; renderAll(); });
  renderAll();
  setInterval(tick, 1000);
})();
