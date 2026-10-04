/* Age & Date Calculator
   Exact age (years, months, days) as on any date, eligibility check for exams and jobs, date difference,
   add / subtract days, weeks, months, years and working days, notice period / last working day, countdown.
   All date maths uses plain calendar numbers (year, month, day) — no time zones, no UTC, no drift.
   Everything runs on this device. Nothing is sent anywhere. */
(function () {
  'use strict';
  var SLUG = 'age-date-calculator';
  var store = EDU.store(SLUG);
  var el = EDU.el, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc;

  /* EDU.t, but in right-to-left pages every inserted value (dates, numbers) is wrapped in a first-strong
     isolate, so Urdu sentences keep "15-08-1990" in one piece. */
  function rtl() { return document.documentElement.dir === 'rtl'; }
  /* in RTL text a line may break after the hyphen inside "30-10-2026"; a word joiner (U+2060) keeps dates whole */
  function nb(v) { return rtl() ? String(v).replace(/(\d)-(?=\d)/g, '$1-\u2060') : v; }
  function t(key, vars) {
    if (vars && rtl()) {
      var o = {};
      Object.keys(vars).forEach(function (k) { o[k] = '⁨' + nb(vars[k]) + '⁩'; });
      vars = o;
    }
    return EDU.t(key, vars);
  }
  function plain(s) { return typeof s === 'string' ? s.replace(/[⁦-⁩⁠]/g, '') : s; }
  function fmtN(n) { return EDU.fmt(n, { maximumFractionDigits: 0 }); }

  /* ================================================================ calendar maths (pure, integers only) */
  var D = {};
  D.isLeap = function (y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; };
  D.dim = function (y, m) { return [31, D.isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; };
  D.valid = function (o) {
    return !!o && Number.isInteger(o.y) && Number.isInteger(o.m) && Number.isInteger(o.d) &&
      o.y >= 1 && o.y <= 9999 && o.m >= 1 && o.m <= 12 && o.d >= 1 && o.d <= D.dim(o.y, o.m);
  };
  /* days since 1970-01-01 (proleptic Gregorian; Howard Hinnant's days_from_civil) */
  D.toDays = function (o) {
    var y = o.y, m = o.m, d = o.d;
    y -= m <= 2 ? 1 : 0;
    var era = Math.floor(y / 400), yoe = y - era * 400;
    var doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  };
  D.fromDays = function (z) {
    z += 719468;
    var era = Math.floor(z / 146097), doe = z - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var y = yoe + era * 400, doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153), d = doy - Math.floor((153 * mp + 2) / 5) + 1, m = mp + (mp < 10 ? 3 : -9);
    return { y: y + (m <= 2 ? 1 : 0), m: m, d: d };
  };
  D.cmp = function (a, b) { return D.toDays(a) - D.toDays(b); };
  D.eq = function (a, b) { return a.y === b.y && a.m === b.m && a.d === b.d; };
  D.weekday = function (o) { var w = (D.toDays(o) + 4) % 7; return w < 0 ? w + 7 : w; };   /* 0 = Sunday */
  D.addDays = function (o, n) { return D.fromDays(D.toDays(o) + n); };
  /* add months; if that day does not exist, use the last day of the month (31 Jan + 1 month = 28/29 Feb) */
  D.addMonths = function (o, n) {
    var t0 = o.y * 12 + (o.m - 1) + n, y = Math.floor(t0 / 12), m = t0 - y * 12 + 1;
    return { y: y, m: m, d: Math.min(o.d, D.dim(y, m)) };
  };
  D.addYears = function (o, n) { return D.addMonths(o, n * 12); };
  D.today = function () { var n = new Date(); return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() }; };
  /* exact difference a -> b (a <= b) as whole years, months, days: step whole months from a, then count days */
  D.diffYMD = function (a, b) {
    if (D.cmp(a, b) > 0) { var x = a; a = b; b = x; }
    var months = (b.y - a.y) * 12 + (b.m - a.m);
    if (D.cmp(D.addMonths(a, months), b) > 0) months--;
    var anchor = D.addMonths(a, months);
    return { y: Math.floor(months / 12), m: months % 12, d: D.toDays(b) - D.toDays(anchor), months: months, days: D.toDays(b) - D.toDays(a) };
  };
  D.parseISO = function (s) {
    var m = /^(\d{1,6})-(\d{1,2})-(\d{1,2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var o = { y: +m[1], m: +m[2], d: +m[3] };
    return D.valid(o) ? o : null;
  };
  /* accepts 26-01-2027, 26/01/2027, 26.01.2027, 2027-01-26, 26-1-27 is NOT accepted (year must be 4 digits) */
  D.parseLoose = function (s) {
    s = String(s || '').trim();
    var m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s), o;
    if (m) o = { y: +m[1], m: +m[2], d: +m[3] };
    else { m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s); if (m) o = { y: +m[3], m: +m[2], d: +m[1] }; }
    return o && D.valid(o) ? o : null;
  };
  D.iso = function (o) { return String(o.y).padStart(4, '0') + '-' + String(o.m).padStart(2, '0') + '-' + String(o.d).padStart(2, '0'); };
  D.fmt = function (o) { return String(o.d).padStart(2, '0') + '-' + String(o.m).padStart(2, '0') + '-' + String(o.y).padStart(4, '0'); };

  /* working days: off = { sat: bool, sun: bool, bank: bool (2nd & 4th Saturday only) }, hol = Set of ISO strings */
  D.isOff = function (o, off, hol) {
    var w = D.weekday(o);
    if (w === 0 && off.sun) return true;
    if (w === 6) {
      if (off.sat) return true;
      if (off.bank) { var k = Math.ceil(o.d / 7); if (k === 2 || k === 4) return true; }
    }
    return !!(hol && hol[D.iso(o)]);
  };
  /* working days in [a, b] inclusive (a <= b); 0 if b < a */
  D.workBetween = function (a, b, off, hol) {
    var n = D.toDays(b) - D.toDays(a);
    if (n < 0) return 0;
    if (n > 400000) return NaN;
    var c = 0, cur = D.toDays(a);
    for (var i = 0; i <= n; i++, cur++) if (!D.isOff(D.fromDays(cur), off, hol)) c++;
    return c;
  };
  /* move n working days forward (n > 0) or backward (n < 0); the start day itself is not counted */
  D.addWork = function (o, n, off, hol) {
    var step = n < 0 ? -1 : 1, left = Math.abs(n), cur = D.toDays(o), guard = 0;
    while (left > 0 && guard++ < 2000000) { cur += step; if (!D.isOff(D.fromDays(cur), off, hol)) left--; }
    return D.fromDays(cur);
  };
  /* previous working day on or before o */
  D.prevWork = function (o, off, hol) {
    var cur = D.toDays(o), guard = 0;
    while (D.isOff(D.fromDays(cur), off, hol) && guard++ < 1000) cur--;
    return D.fromDays(cur);
  };
  window.ADC_DATES = D;   /* exposed so the interaction test can cross-check the maths */

  /* ================================================================ state */
  var TODAY = D.today();
  var defaults = {
    tab: 'age',
    dob: '1990-08-15', asonMode: 'today', ason: '2026-08-15',
    eligMin: 21, eligMax: 32, eligRelax: 0, cutoff: '2027-01-01',
    d1: D.iso(TODAY), d2: D.iso(D.addMonths(TODAY, 3)), dIncl: false,
    aStart: D.iso(TODAY), aOp: 'add', aN: 30, aUnit: 'days',
    nStart: '2026-10-01', nDays: 30, nMode: 'cal', nDay1: false,
    cName: '', cDate: D.iso({ y: TODAY.y + 1, m: 1, d: 1 }),
    wkMode: 'satsun', holidays: '',
    people: [], events: []
  };
  var S = {};
  Object.keys(defaults).forEach(function (k) {
    var dv = defaults[k], v = store.get(k, dv);
    if (Array.isArray(dv)) v = Array.isArray(v) ? v.filter(function (x) { return x && typeof x === 'object'; }) : [];
    else if (typeof dv === 'boolean') v = !!v;
    else if (typeof dv === 'number') v = (typeof v === 'number' && isFinite(v)) || v === '' ? v : dv;
    else if (typeof v !== 'string') v = dv;
    S[k] = v;
  });
  var hol = {}, holBad = 0;

  function save(k) { store.set(k, S[k]); }
  function setS(k, v) { S[k] = v; save(k); }

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ================================================================ small UI helpers */
  function wdName(o) { return t('wd' + D.weekday(o)); }
  function dateLong(o) { return nb(D.fmt(o)) + ' (' + wdName(o) + ')'; }
  function unit(n, one, many) { return t(n === 1 ? one : many, { n: fmtN(n) }); }
  function ymdText(r) { return unit(r.y, 'year_1', 'year_n') + ', ' + unit(r.m, 'month_1', 'month_n') + ', ' + unit(r.d, 'day_1', 'day_n'); }
  function ymdShort(r) {
    var parts = [];
    if (r.y) parts.push(unit(r.y, 'year_1', 'year_n'));
    if (r.m) parts.push(unit(r.m, 'month_1', 'month_n'));
    if (r.d || !parts.length) parts.push(unit(r.d, 'day_1', 'day_n'));
    return parts.join(', ');
  }
  function offRule() { return { sat: S.wkMode === 'satsun', sun: true, bank: S.wkMode === 'bank' }; }
  function readDate(id, hintId) {
    var inp = $('#' + id), o = D.parseISO(inp.value), h = $('#' + hintId);
    if (h) {
      h.textContent = o ? dateLong(o) : t('err_date');
      h.classList.toggle('err', !o);
    }
    inp.setAttribute('aria-invalid', o ? 'false' : 'true');
    return o;
  }
  function stat(label, value, cls) {
    return el('div', { class: 'ad-stat' + (cls ? ' ' + cls : '') }, el('span', { text: label }), el('b', { text: nb(value) }));
  }
  function errCard(msg) { return el('p', { class: 'ad-err', text: msg }); }
  function actions(getText, idPrefix) {
    var text = getText();
    var wa = el('a', { class: 'btn btn-wa', id: idPrefix + 'Wa', target: '_blank', rel: 'noopener', href: EDU.waLink(plain(text + '\n\n' + t('share_tail', { url: EDU.shareUrl() }))) },
      el('span', { 'aria-hidden': 'true', text: '💬' }), ' ', el('span', { text: t('wa_share') }));
    var cp = el('button', { type: 'button', class: 'btn', id: idPrefix + 'Copy', onclick: function () { EDU.copy(plain(getText())); } },
      el('span', { 'aria-hidden': 'true', text: '📋' }), ' ', el('span', { text: t('copy_result') }));
    return el('div', { class: 'ad-actions no-print' }, cp, wa);
  }
  function seg(id, key, onChange) {
    var box = $('#' + id);
    function paint() { $$('button', box).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === S[key] ? 'true' : 'false'); }); }
    $$('button', box).forEach(function (b) {
      b.addEventListener('click', function () { setS(key, b.dataset.v); paint(); onChange(); });
    });
    paint();
    return paint;
  }
  function bindDate(id, key, onChange) {
    var inp = $('#' + id);
    inp.value = S[key] || '';
    inp.addEventListener('input', function () { setS(key, inp.value); onChange(); });
    inp.addEventListener('change', function () { setS(key, inp.value); onChange(); });
  }
  function bindNum(id, key, onChange) {
    var inp = $('#' + id);
    inp.value = S[key] === '' || S[key] === null ? '' : S[key];
    inp.addEventListener('input', function () {
      var v = inp.value.trim();
      setS(key, v === '' ? '' : Number(v));
      onChange();
    });
  }
  /* null = empty, NaN = not a whole number, Infinity = whole but outside lo..hi */
  function intOf(v, lo, hi) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    if (!Number.isInteger(n)) return NaN;
    if (n < lo || n > hi) return Infinity;
    return n;
  }
  function bad(n) { return n !== null && !Number.isFinite(n); }
  function numErr(n) { return Number.isNaN(n) ? t('err_num') : t('err_range'); }

  /* ================================================================ AGE */
  function asOnDate() { return S.asonMode === 'today' ? TODAY : D.parseISO(S.ason); }
  function ageText(dob, ason) {
    var r = D.diffYMD(dob, ason);
    return t('age_line', { dob: D.fmt(dob), d: D.fmt(ason), age: ymdText(r) });
  }
  function renderAge() {
    var dob = readDate('dob', 'dobHint'), ason = asOnDate(), box = $('#ageRes');
    $('#asonBox').hidden = S.asonMode !== 'custom';
    if (S.asonMode === 'custom') ason = readDate('ason', 'asonHint');
    box.textContent = '';
    box.appendChild(el('div', { class: 'ad-res-head' }, el('h2', { text: t('age_result') }), ason ? el('span', { class: 'ad-today', text: t('as_on', { d: D.fmt(ason) }) }) : null));
    if (!dob || !ason) { box.appendChild(errCard(t('err_date'))); renderElig(dob); renderPeople(); return; }
    if (D.cmp(dob, ason) > 0) { box.appendChild(errCard(t('err_future_dob'))); renderElig(dob); renderPeople(); return; }
    var r = D.diffYMD(dob, ason);
    box.appendChild(el('div', { class: 'ad-ymd' },
      el('div', {}, el('b', { id: 'ageY', text: fmtN(r.y) }), el('span', { text: t('lbl_years') })),
      el('div', {}, el('b', { id: 'ageM', text: fmtN(r.m) }), el('span', { text: t('lbl_months') })),
      el('div', {}, el('b', { id: 'ageD', text: fmtN(r.d) }), el('span', { text: t('lbl_days') }))));
    /* next birthday: first anniversary strictly after "as on" (29 Feb -> 28 Feb in a non-leap year) */
    var k = r.y + 1, nb = D.addYears(dob, k);
    if (D.cmp(nb, ason) <= 0) { k++; nb = D.addYears(dob, k); }
    var toGo = D.toDays(nb) - D.toDays(ason), isBday = r.m === 0 && r.d === 0 && r.y > 0;
    var stats = el('div', { class: 'ad-stats' },
      stat(t('total_months'), fmtN(r.months)), stat(t('total_weeks'), fmtN(Math.floor(r.days / 7)) + ' + ' + fmtN(r.days % 7)), stat(t('total_days'), fmtN(r.days)),
      stat(t('born_wd'), wdName(dob)),
      stat(t('next_bday'), D.fmt(nb) + ' · ' + wdName(nb) + ' · ' + t('turning', { n: fmtN(k) }), 'hl'),
      stat(t('days_to_go'), isBday ? t('bday_today') : unit(toGo, 'day_1', 'day_n'), isBday ? 'hl' : ''));
    stats.lastChild.querySelector('b').id = 'nextBdayIn';
    stats.children[4].querySelector('b').id = 'nextBday';
    stats.children[2].querySelector('b').id = 'ageDays';
    stats.children[0].querySelector('b').id = 'ageMonths';
    box.appendChild(stats);
    if (dob.m === 2 && dob.d === 29) box.appendChild(el('p', { class: 'ad-note muted', text: t('feb29_note') }));
    box.appendChild(actions(function () { return ageText(dob, ason) + '\n' + t('born_wd') + ': ' + wdName(dob) + '\n' + t('next_bday') + ': ' + D.fmt(nb) + ' (' + wdName(nb) + ')'; }, 'age'));
    renderElig(dob);
    renderPeople();
  }

  function renderElig(dob) {
    var out = $('#eligOut'), cut = readDate('cutoff', 'cutoffHint');
    var mn = intOf(S.eligMin, 0, 150), mx = intOf(S.eligMax, 0, 150), rlRaw = intOf(S.eligRelax, 0, 50), rl = rlRaw === null ? 0 : rlRaw;
    $('#eligMin').setAttribute('aria-invalid', bad(mn) ? 'true' : 'false');
    $('#eligMax').setAttribute('aria-invalid', bad(mx) ? 'true' : 'false');
    $('#eligRelax').setAttribute('aria-invalid', bad(rl) ? 'true' : 'false');
    out.textContent = '';
    if (!cut) { out.appendChild(errCard(t('err_date'))); return; }
    if (bad(mn) || bad(mx) || bad(rl)) { out.appendChild(errCard(numErr(bad(mn) ? mn : bad(mx) ? mx : rl))); return; }
    if (mn === null && mx === null) { out.appendChild(el('p', { class: 'ad-empty', text: t('elig_none') })); return; }
    var maxAll = mx === null ? null : mx + rl;
    /* "has completed N years on the cut-off" = the Nth birthday (29 Feb -> 28 Feb in a common year) is on or before the cut-off.
       The person is tested directly with that rule; the qualifying range is derived from it so both always agree. */
    function hasDone(d, n) { return D.cmp(D.addYears(d, n), cut) <= 0; }
    var latest = null, earliest = null;
    if (mn !== null) { latest = D.addYears(cut, -mn); while (hasDone(D.addDays(latest, 1), mn)) latest = D.addDays(latest, 1); }
    if (maxAll !== null) { earliest = D.addDays(D.addYears(cut, -maxAll), 1); while (hasDone(earliest, maxAll)) earliest = D.addDays(earliest, 1); }
    var wrap = el('div', { class: 'callout ad-callout', id: 'eligBox' });
    var ok = true, msg = '';
    if (dob) {
      if (!hasDone(dob, mn || 0)) {
        ok = false;
        var from = D.addYears(dob, mn || 0), gap = D.diffYMD(cut, from);
        msg = t('elig_young', { short: ymdShort(gap), d: D.fmt(from) });
      } else if (maxAll !== null && hasDone(dob, maxAll)) {
        ok = false;
        var crossed = D.addYears(dob, maxAll), over = D.diffYMD(crossed, cut);
        msg = t('elig_old', { over: ymdShort(over), d: D.fmt(crossed) });
      } else msg = t('elig_yes', { age: ymdText(D.diffYMD(dob, cut)), d: D.fmt(cut) });
      wrap.classList.add(ok ? 'success' : 'danger');
      wrap.appendChild(el('p', { id: 'eligMsg', text: msg }));
    } else {
      wrap.appendChild(el('p', { id: 'eligMsg', text: t('elig_nodob') }));
    }
    var range = latest && earliest ? t('elig_range', { a: D.fmt(earliest), b: D.fmt(latest) }) :
      latest ? t('elig_range_max', { b: D.fmt(latest) }) : t('elig_range_min', { a: D.fmt(earliest) });
    if (latest && earliest && D.cmp(earliest, latest) > 0) range = t('elig_impossible');
    wrap.appendChild(el('p', { id: 'eligRange', class: 'small', text: range }));
    wrap.appendChild(el('p', { class: 'tiny muted', text: t('elig_rule') }));
    out.appendChild(wrap);
    out.appendChild(actions(function () { return t('elig_title') + '\n' + plain(msg || t('elig_nodob')) + '\n' + plain(range); }, 'elig'));
  }

  function renderPeople() {
    var ul = $('#pList'), ason = asOnDate();
    ul.textContent = '';
    if (!S.people.length) { ul.appendChild(el('li', {}, el('p', { class: 'ad-empty', text: t('p_empty') }))); return; }
    S.people.forEach(function (p, i) {
      var dob = D.parseISO(p.dob), info = '';
      if (!dob) return;
      if (dob && ason && D.cmp(dob, ason) <= 0) {
        var r = D.diffYMD(dob, ason), k = r.y + 1, nb = D.addYears(dob, k);
        if (D.cmp(nb, ason) <= 0) nb = D.addYears(dob, ++k);
        info = ymdShort(r) + ' · ' + t('next_bday') + ' ' + D.fmt(nb);
      }
      ul.appendChild(el('li', {},
        el('div', {}, el('div', { class: 'nm', text: p.name || t('p_noname') }), el('div', { class: 'dt', text: t('dob') + ' ' + (dob ? D.fmt(dob) : '?') + ' · ' + wdName(dob || TODAY) })),
        el('div', { class: 'ops' },
          el('button', { type: 'button', class: 'btn btn-sm', text: t('p_use'), onclick: function () { setS('dob', p.dob); $('#dob').value = p.dob; $('#pName').value = p.name || ''; renderAge(); } }),
          el('button', { type: 'button', class: 'btn btn-sm btn-danger', 'aria-label': t('delete'), text: '🗑', onclick: function () { S.people.splice(i, 1); save('people'); renderPeople(); } })),
        el('div', { class: 'ag', text: info })));
    });
  }

  /* ================================================================ DIFFERENCE */
  function renderDiff() {
    var a = readDate('d1', 'd1Hint'), b = readDate('d2', 'd2Hint'), box = $('#diffRes');
    box.textContent = '';
    box.appendChild(el('h2', { text: t('diff_result') }));
    if (!a || !b) { box.appendChild(errCard(t('err_date'))); return; }
    var swapped = false;
    if (D.cmp(a, b) > 0) { var x = a; a = b; b = x; swapped = true; }
    var incl = S.dIncl ? 1 : 0, r = D.diffYMD(a, b), days = r.days + incl;
    var work = D.workBetween(incl ? a : D.addDays(a, 1), b, offRule(), hol);
    box.appendChild(el('div', { class: 'ad-big sm', id: 'diffYMD', text: ymdText(r) }));
    box.appendChild(el('p', { class: 'muted small', text: D.fmt(a) + ' → ' + D.fmt(b) + (incl ? ' · ' + t('d_incl_on') : '') }));
    var st = el('div', { class: 'ad-stats' },
      stat(t('total_days'), fmtN(days), 'hl'), stat(t('lbl_weeks'), fmtN(Math.floor(days / 7)) + ' + ' + fmtN(days % 7)), stat(t('total_months'), fmtN(r.months)),
      stat(t('work_days'), Number.isNaN(work) ? '—' : fmtN(work)), stat(t('weekend_hol'), Number.isNaN(work) ? '—' : fmtN(days - work)));
    st.children[0].querySelector('b').id = 'diffDays'; st.children[1].querySelector('b').id = 'diffWeeks';
    st.children[2].querySelector('b').id = 'diffMonths'; st.children[3].querySelector('b').id = 'diffWork';
    box.appendChild(st);
    if (swapped) box.appendChild(el('p', { class: 'ad-note muted', text: t('diff_swapped') }));
    box.appendChild(el('p', { class: 'tiny muted ad-note', text: t('work_note') }));
    box.appendChild(actions(function () {
      return t('diff_title') + ': ' + D.fmt(a) + ' → ' + D.fmt(b) + '\n' + ymdText(r) + '\n' + t('total_days') + ': ' + fmtN(days) + '\n' + t('work_days') + ': ' + fmtN(work);
    }, 'diff'));
  }

  /* ================================================================ ADD / SUBTRACT */
  function renderAdd() {
    var a = readDate('aStart', 'aStartHint'), box = $('#addRes'), n = intOf(S.aN, 0, 100000);
    $('#aN').setAttribute('aria-invalid', bad(n) ? 'true' : 'false');
    $$('#aChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(+c.dataset.n === S.aN && c.dataset.u === S.aUnit)); });
    box.textContent = '';
    box.appendChild(el('h2', { text: t('a_result') }));
    if (!a) { box.appendChild(errCard(t('err_date'))); return; }
    if (n === null || bad(n)) { box.appendChild(errCard(n === null ? t('err_num') : numErr(n))); return; }
    var sign = S.aOp === 'sub' ? -1 : 1, res, u = S.aUnit;
    if (u === 'days') res = D.addDays(a, sign * n);
    else if (u === 'weeks') res = D.addDays(a, sign * 7 * n);
    else if (u === 'months') res = D.addMonths(a, sign * n);
    else if (u === 'years') res = D.addYears(a, sign * n);
    else res = D.addWork(a, sign * n, offRule(), hol);
    if (!D.valid(res)) { box.appendChild(errCard(t('err_range'))); return; }
    var unitName = t('unit_' + u), opSym = sign < 0 ? '−' : '+';
    box.appendChild(el('div', { class: 'ad-big', id: 'aOut', text: D.fmt(res) }));
    box.appendChild(el('p', { class: 'muted', id: 'aOutWd', text: wdName(res) }));
    box.appendChild(el('p', { class: 'ad-note', text: D.fmt(a) + ' ' + opSym + ' ' + fmtN(n) + ' ' + unitName + ' = ' + D.fmt(res) }));
    var cal = Math.abs(D.toDays(res) - D.toDays(a));
    var st = el('div', { class: 'ad-stats two' }, stat(t('cal_days_moved'), fmtN(cal)), stat(t('weeks_moved'), fmtN(Math.floor(cal / 7)) + ' + ' + fmtN(cal % 7)));
    box.appendChild(st);
    if (u === 'work') box.appendChild(el('p', { class: 'tiny muted ad-note', text: t('work_note') }));
    if ((u === 'months' || u === 'years') && res.d !== a.d) box.appendChild(el('p', { class: 'ad-note muted', text: t('month_end_note') }));
    box.appendChild(actions(function () { return D.fmt(a) + ' ' + opSym + ' ' + fmtN(n) + ' ' + unitName + ' = ' + D.fmt(res) + ' (' + wdName(res) + ')'; }, 'add'));
  }

  /* ================================================================ NOTICE PERIOD */
  function renderNotice() {
    var a = readDate('nStart', 'nStartHint'), box = $('#noticeRes'), n = intOf(S.nDays, 0, 1000);
    $('#nDays').setAttribute('aria-invalid', bad(n) ? 'true' : 'false');
    $$('#nChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(+c.dataset.n === S.nDays)); });
    box.textContent = '';
    box.appendChild(el('h2', { text: t('n_result') }));
    if (!a) { box.appendChild(errCard(t('err_date'))); return; }
    if (n === null || bad(n)) { box.appendChild(errCard(n === null ? t('err_num') : numErr(n))); return; }
    var off = offRule(), count = S.nDay1 ? n - 1 : n, last;
    if (count < 0) count = 0;
    last = S.nMode === 'work' ? D.addWork(a, count, off, hol) : D.addDays(a, count);
    if (!D.valid(last)) { box.appendChild(errCard(t('err_range'))); return; }
    box.appendChild(el('div', { class: 'ad-big', id: 'nOut', text: D.fmt(last) }));
    box.appendChild(el('p', { class: 'muted', id: 'nOutWd', text: wdName(last) }));
    box.appendChild(el('p', { class: 'ad-note', text: t('n_line', { d: D.fmt(a), n: fmtN(n), mode: t(S.nMode === 'work' ? 'n_mode_work' : 'n_mode_cal') }) }));
    var leftCal = D.toDays(last) - D.toDays(TODAY), leftWork = D.toDays(last) >= D.toDays(TODAY) ? D.workBetween(D.addDays(TODAY, 1), last, off, hol) : 0;
    var st = el('div', { class: 'ad-stats' },
      stat(t('n_left'), leftCal >= 0 ? fmtN(leftCal) : t('n_done')), stat(t('n_left_work'), leftCal >= 0 ? fmtN(leftWork) : '—'),
      stat(t('n_served'), fmtN(Math.max(0, Math.min(D.toDays(TODAY) - D.toDays(a), D.toDays(last) - D.toDays(a))))));
    st.children[0].querySelector('b').id = 'nLeft';
    box.appendChild(st);
    if (D.isOff(last, off, hol)) {
      var prev = D.prevWork(last, off, hol);
      box.appendChild(el('p', { class: 'callout warning ad-callout small', id: 'nNote', text: t('n_weekend', { d: D.fmt(prev) + ' (' + wdName(prev) + ')' }) }));
    }
    box.appendChild(el('p', { class: 'tiny muted ad-note', text: t('n_help') }));
    box.appendChild(actions(function () { return t('notice_title') + '\n' + plain(t('n_line', { d: D.fmt(a), n: fmtN(n), mode: t(S.nMode === 'work' ? 'n_mode_work' : 'n_mode_cal') })) + '\n' + t('n_result') + ': ' + D.fmt(last) + ' (' + wdName(last) + ')'; }, 'notice'));
  }

  /* ================================================================ COUNTDOWN */
  function countInfo(target) {
    var left = D.toDays(target) - D.toDays(TODAY);
    if (left === 0) return t('c_today');
    if (left < 0) return t('c_past', { n: fmtN(-left) });
    return t(left === 1 ? 'c_left1' : 'c_left', { n: fmtN(left) });
  }
  function renderCount() {
    var tg = readDate('cDate', 'cDateHint'), box = $('#countRes');
    box.textContent = '';
    var name = (S.cName || '').trim();
    box.appendChild(el('h2', { class: name ? 'no-i18n' : '', text: name || t('count_result') }));
    if (!tg) { box.appendChild(errCard(t('err_date'))); renderEvents(); return; }
    var left = D.toDays(tg) - D.toDays(TODAY), abs = Math.abs(left);
    box.appendChild(el('div', { class: 'ad-big', id: 'cOut', text: fmtN(abs) }));
    box.appendChild(el('p', { class: 'muted', id: 'cOutLbl', text: left === 0 ? t('c_today') : left < 0 ? t('c_past', { n: fmtN(abs) }) : unit(abs, 'day_1', 'day_n') + ' · ' + t('c_to_go') }));
    var r = left >= 0 ? D.diffYMD(TODAY, tg) : D.diffYMD(tg, TODAY);
    var st = el('div', { class: 'ad-stats' },
      stat(t('c_date'), D.fmt(tg) + ' · ' + wdName(tg), 'hl'), stat(t('lbl_weeks'), fmtN(Math.floor(abs / 7)) + ' + ' + fmtN(abs % 7)), stat(t('months_days'), ymdShort(r)),
      stat(t('work_days'), left > 0 ? fmtN(D.workBetween(D.addDays(TODAY, 1), tg, offRule(), hol)) : '—'), stat(t('c_weekends'), left > 0 ? fmtN(countWeekends(TODAY, tg)) : '—'));
    st.children[2].querySelector('b').id = 'cDetail';
    box.appendChild(st);
    box.appendChild(actions(function () { return (name ? name + '\n' : '') + D.fmt(tg) + ' (' + wdName(tg) + ')\n' + plain(countInfo(tg)); }, 'count'));
    renderEvents();
  }
  function countWeekends(a, b) {   /* Sundays strictly after a up to b */
    var n = 0, cur = D.toDays(a) + 1, end = D.toDays(b);
    if (end - cur > 400000) return NaN;
    for (; cur <= end; cur++) { var w = (cur + 4) % 7; if (w === 0) n++; }
    return n;
  }
  function renderEvents() {
    var ul = $('#cList');
    ul.textContent = '';
    if (!S.events.length) { ul.appendChild(el('li', {}, el('p', { class: 'ad-empty', text: t('c_empty') }))); return; }
    var items = S.events.slice().sort(function (p, q) { return D.cmp(D.parseISO(p.date) || TODAY, D.parseISO(q.date) || TODAY); });
    items.forEach(function (ev) {
      var d = D.parseISO(ev.date);
      if (!d) return;
      ul.appendChild(el('li', {},
        el('div', {}, el('div', { class: 'nm', text: ev.name || t('c_noname') }), el('div', { class: 'dt', text: d ? dateLong(d) : '?' })),
        el('div', { class: 'ops' },
          el('button', { type: 'button', class: 'btn btn-sm', text: t('p_use'), onclick: function () { setS('cName', ev.name || ''); setS('cDate', ev.date); $('#cName').value = S.cName; $('#cDate').value = S.cDate; renderCount(); } }),
          el('button', { type: 'button', class: 'btn btn-sm btn-danger', 'aria-label': t('delete'), text: '🗑', onclick: function () { var i = S.events.indexOf(ev); if (i >= 0) S.events.splice(i, 1); save('events'); renderEvents(); } })),
        el('div', { class: 'ag', text: d ? countInfo(d) : '' })));
    });
  }

  /* ================================================================ working-day settings */
  function parseHolidays() {
    hol = {}; holBad = 0;
    var seen = 0;
    String(S.holidays || '').split(/\r?\n|,|;/).forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var m = /(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})/.exec(line), o = m ? D.parseLoose(m[1]) : null;
      if (o) { hol[D.iso(o)] = 1; seen++; } else holBad++;
    });
    var h = $('#holHint');
    h.textContent = t('hol_count', { n: fmtN(Object.keys(hol).length) }) + (holBad ? ' · ' + t('hol_bad', { n: fmtN(holBad) }) : '');
    h.classList.toggle('err', holBad > 0);
    return seen;
  }
  function renderWork() { parseHolidays(); renderDiff(); renderAdd(); renderNotice(); renderCount(); }

  /* ================================================================ tabs */
  var TABS = ['age', 'diff', 'add', 'notice', 'count'];
  function showTab(id) {
    if (TABS.indexOf(id) < 0) id = 'age';
    setS('tab', id);
    TABS.forEach(function (k) {
      var b = $('#tab-' + k), p = $('#p-' + k), on = k === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      p.hidden = !on;
    });
    $('#workCard').hidden = !(id === 'diff' || id === 'add' || id === 'notice');
  }
  $$('#tabs button').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var i = TABS.indexOf(b.dataset.tab), j = -1;
      if (e.key === 'ArrowRight') j = (i + 1) % TABS.length; else if (e.key === 'ArrowLeft') j = (i + TABS.length - 1) % TABS.length;
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = TABS.length - 1;
      if (j >= 0) { e.preventDefault(); showTab(TABS[j]); $('#tab-' + TABS[j]).focus(); }
    });
  });

  /* ================================================================ wiring */
  bindDate('dob', 'dob', renderAge);
  bindDate('ason', 'ason', renderAge);
  seg('asonMode', 'asonMode', renderAge);
  bindNum('eligMin', 'eligMin', function () { renderElig(D.parseISO(S.dob)); });
  bindNum('eligMax', 'eligMax', function () { renderElig(D.parseISO(S.dob)); });
  bindNum('eligRelax', 'eligRelax', function () { renderElig(D.parseISO(S.dob)); });
  bindDate('cutoff', 'cutoff', function () { renderElig(D.parseISO(S.dob)); });
  $('#pAdd').addEventListener('click', function () {
    var dob = D.parseISO(S.dob), name = $('#pName').value.trim();
    if (!dob) { EDU.toast(t('err_date')); return; }
    S.people.push({ name: name.slice(0, 40), dob: S.dob });
    save('people');
    $('#pName').value = '';
    EDU.toast(t('p_saved'));
    renderPeople();
  });
  $('#pName').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('#pAdd').click(); } });

  bindDate('d1', 'd1', renderDiff);
  bindDate('d2', 'd2', renderDiff);
  $('#dIncl').checked = !!S.dIncl;
  $('#dIncl').addEventListener('change', function () { setS('dIncl', this.checked); renderDiff(); });

  bindDate('aStart', 'aStart', renderAdd);
  seg('aOp', 'aOp', renderAdd);
  bindNum('aN', 'aN', renderAdd);
  $('#aUnit').value = S.aUnit;
  $('#aUnit').addEventListener('change', function () { setS('aUnit', this.value); renderAdd(); });
  $$('#aChips .chip').forEach(function (c) {
    c.addEventListener('click', function () { setS('aN', +c.dataset.n); setS('aUnit', c.dataset.u); $('#aN').value = S.aN; $('#aUnit').value = S.aUnit; renderAdd(); });
  });

  bindDate('nStart', 'nStart', renderNotice);
  bindNum('nDays', 'nDays', renderNotice);
  seg('nMode', 'nMode', renderNotice);
  $('#nDay1').checked = !!S.nDay1;
  $('#nDay1').addEventListener('change', function () { setS('nDay1', this.checked); renderNotice(); });
  $$('#nChips .chip').forEach(function (c) {
    c.addEventListener('click', function () { setS('nDays', +c.dataset.n); $('#nDays').value = S.nDays; renderNotice(); });
  });

  bindDate('cDate', 'cDate', renderCount);
  $('#cName').value = S.cName || '';
  $('#cName').addEventListener('input', function () { setS('cName', this.value); renderCount(); });
  $('#cAdd').addEventListener('click', function () {
    var d = D.parseISO(S.cDate);
    if (!d) { EDU.toast(t('err_date')); return; }
    S.events.push({ name: (S.cName || '').trim().slice(0, 60), date: S.cDate });
    save('events');
    EDU.toast(t('c_saved'));
    renderEvents();
  });

  seg('wkMode', 'wkMode', renderWork);
  $('#holidays').value = S.holidays || '';
  $('#holidays').addEventListener('input', function () { setS('holidays', this.value); renderWork(); });

  $('#resetAll').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    Object.keys(defaults).forEach(function (k) { store.remove(k); S[k] = Array.isArray(defaults[k]) ? [] : defaults[k]; });
    location.reload();
  });

  function renderAll() {
    $('#todayBadge').textContent = t('today_is', { d: D.fmt(TODAY) + ' · ' + wdName(TODAY) });
    showTab(S.tab);
    parseHolidays();
    renderAge(); renderDiff(); renderAdd(); renderNotice(); renderCount();
  }
  EDU.onLang(renderAll);
  renderAll();
})();
