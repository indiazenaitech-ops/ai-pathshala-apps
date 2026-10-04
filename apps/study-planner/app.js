/* Exam Study Planner: date sheet + chapters + free hours -> a day-by-day revision plan.
   Everything stays on the device (EDU.store). No libraries. */
(function () {
  'use strict';
  var SLUG = 'study-planner';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ------------------------------------------------------------ constants */
  var DW = { e: 1, m: 1.5, h: 2 };          // difficulty weight
  var CW = { l: 1.5, o: 1, h: 0.6 };        // confidence weight: weak chapters need more time
  var R2 = { e: 8, m: 12, h: 15 };          // minutes of final quick revision per chapter
  var BASE = 50;                            // first-study minutes for an easy chapter you know "okay"
  var REV1 = 0.35;                          // revision 1 = 35 % of the first-study time
  var PRAC_MIN = 120;                       // practice paper time per subject
  var MAX_DAYS = 366;
  var MAX_SUBJ = 20, MAX_CH = 60;
  var KINDS = ['learn', 'rev1', 'prac', 'rev2'];
  /* sample: Class 10 half-yearly. off = exam day after today; ch = [difficulty, confidence] */
  var SAMPLE = [
    { off: 18, ch: [['m', 'o'], ['m', 'l'], ['h', 'o'], ['e', 'o']] },
    { off: 21, ch: [['e', 'o'], ['m', 'o'], ['h', 'l'], ['m', 'l'], ['m', 'h']] },
    { off: 25, ch: [['m', 'o'], ['h', 'l'], ['m', 'o'], ['h', 'o'], ['h', 'l']] },
    { off: 28, ch: [['h', 'l'], ['e', 'h'], ['e', 'o'], ['m', 'o']] }
  ];

  /* ------------------------------------------------------------ dates (local, YYYY-MM-DD strings) */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) || d.getMonth() !== +m[2] - 1 ? null : d;
  }
  function validDate(s) { return !!parse(s) && +s.slice(0, 4) >= 2000 && +s.slice(0, 4) <= 2100; }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function diffDays(a, b) {
    var x = parse(a), y = parse(b);
    return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()) - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / 864e5);
  }
  function today() { return iso(new Date()); }
  function dow(s) { return (parse(s).getDay() + 6) % 7; }            // 0 = Monday
  function dayNames(key) { return String(t(key)).split(/\s*[,،]\s*/); }
  function dfmt(s, opts) {
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag + '-u-nu-latn', opts).format(parse(s)); }
    catch (e) { return s; }
  }
  function dShort(s) { return dayNames('days_short')[dow(s)] + ', ' + dfmt(s, { day: 'numeric', month: 'short' }); }
  function dLong(s) { return dayNames('days')[dow(s)] + ', ' + dfmt(s, { day: 'numeric', month: 'long', year: 'numeric' }); }
  function dur(min) {
    min = Math.round(min);
    var h = Math.floor(min / 60), m = min % 60;
    if (h && m) return t('dur_hm', { h: EDU.fmt(h), m: EDU.fmt(m) });
    if (h) return t('dur_h', { h: EDU.fmt(h) });
    return t('dur_m', { m: EDU.fmt(m) });
  }

  /* ------------------------------------------------------------ state */
  function sampleSubjects(base) {
    return SAMPLE.map(function (s, i) {
      return {
        id: 's' + (i + 1), ck: i, own: false, name: '', exam: addDays(base, s.off), col: i,
        ch: s.ch.map(function (c, j) { return { id: 's' + (i + 1) + 'c' + (j + 1), ck: j, own: false, name: '', d: c[0], c: c[1] }; })
      };
    });
  }
  function fresh() {
    var d = today();
    return {
      v: 1, sample: true, hideNote: false, name: '', cls: '', start: d,
      hours: [3, 3, 3, 3, 3, 4, 6], leaveFrom: '', leaveHours: 7,
      pomo: 25, light: true, rest: true, prac: true,
      subjects: sampleSubjects(d), plan: null, dirty: false, seq: 1,
      view: 'list', tab: 'plan', showPast: false, calSel: ''
    };
  }
  function num(v, lo, hi, d) { v = parseFloat(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
  function sanitize(s) {
    if (!s || typeof s !== 'object' || !Array.isArray(s.subjects)) return null;
    var f = fresh();
    var out = {};
    Object.keys(f).forEach(function (k) { out[k] = s[k] === undefined ? f[k] : s[k]; });
    if (!validDate(out.start)) out.start = f.start;
    if (!Array.isArray(out.hours) || out.hours.length !== 7) out.hours = f.hours;
    out.hours = out.hours.map(function (h) { return num(h, 0, 16, 0); });
    out.leaveHours = num(out.leaveHours, 0, 16, 7);
    if (out.leaveFrom && !validDate(out.leaveFrom)) out.leaveFrom = '';
    out.pomo = out.pomo === 50 ? 50 : 25;
    ['light', 'rest', 'prac', 'sample', 'hideNote', 'dirty', 'showPast'].forEach(function (k) { out[k] = !!out[k]; });
    out.name = String(out.name || '').slice(0, 60); out.cls = String(out.cls || '').slice(0, 30);
    out.seq = num(out.seq, 1, 1e9, 1);
    out.subjects = out.subjects.filter(function (x) { return x && typeof x === 'object' && x.id; }).slice(0, MAX_SUBJ).map(function (x, i) {
      return {
        id: String(x.id), ck: typeof x.ck === 'number' ? x.ck : null, own: !!x.own, name: String(x.name || '').slice(0, 80),
        exam: validDate(x.exam) ? x.exam : '', col: num(x.col, 0, 7, i % 8) | 0,
        ch: (Array.isArray(x.ch) ? x.ch : []).filter(function (c) { return c && c.id; }).slice(0, MAX_CH).map(function (c) {
          return { id: String(c.id), ck: typeof c.ck === 'number' ? c.ck : null, own: !!c.own, name: String(c.name || '').slice(0, 120),
            d: DW[c.d] ? c.d : 'm', c: CW[c.c] ? c.c : 'o' };
        })
      };
    });
    if (out.plan && (typeof out.plan !== 'object' || !Array.isArray(out.plan.sessions))) out.plan = null;
    if (out.plan) out.plan.sessions = out.plan.sessions.filter(function (x) { return x && x.id && validDate(x.d) && KINDS.indexOf(x.k) >= 0; });
    if (['list', 'cal'].indexOf(out.view) < 0) out.view = 'list';
    if (['plan', 'exams', 'time', 'tips'].indexOf(out.tab) < 0) out.tab = 'plan';
    return out;
  }

  var st = sanitize(store.get('state', null));
  var firstRun = !st;
  if (!st) st = fresh();
  var saveWarned = false;
  function save() {
    if (!store.set('state', st) && !saveWarned) { saveWarned = true; EDU.toast(t('not_saved')); }
  }
  function uid(p) { st.seq = (st.seq || 1) + 1; return p + st.seq.toString(36) + Math.floor(Math.random() * 1296).toString(36); }

  /* ------------------------------------------------------------ names (sample names follow the language until edited) */
  function content() { var A = window.APP_CONTENT || {}; return A[EDU.lang] || A.en || { subj: [], ch: [] }; }
  function subjById(id) { for (var i = 0; i < st.subjects.length; i++) if (st.subjects[i].id === id) return st.subjects[i]; return null; }
  function chById(s, id) { if (!s) return null; for (var i = 0; i < s.ch.length; i++) if (s.ch[i].id === id) return s.ch[i]; return null; }
  function sName(s) {
    if (!s) return '?';
    if (s.own) return s.name.trim() || t('subject_n', { n: EDU.fmt(st.subjects.indexOf(s) + 1) });
    var c = content();
    return (s.ck !== null && c.subj[s.ck]) || s.name || t('subject_n', { n: EDU.fmt(st.subjects.indexOf(s) + 1) });
  }
  function cName(s, ch) {
    if (!ch) return '';
    if (ch.own) return ch.name.trim() || t('chapter_n', { n: EDU.fmt(s.ch.indexOf(ch) + 1) });
    var c = content();
    return (s.ck !== null && ch.ck !== null && c.ch[s.ck] && c.ch[s.ck][ch.ck]) || ch.name || t('chapter_n', { n: EDU.fmt(s.ch.indexOf(ch) + 1) });
  }
  function scol(s) { return 'var(--c' + (((s && s.col) || 0) % 8 + 1) + ')'; }

  /* ------------------------------------------------------------ how much work a chapter needs */
  function work() { return st.pomo === 50 ? 50 : 25; }
  function brk(w) { return (w || work()) === 50 ? 10 : 5; }
  function learnMin(ch) { return BASE * (DW[ch.d] || 1.5) * (CW[ch.c] || 1); }
  function learnN(ch) { return Math.max(1, Math.round(learnMin(ch) / work())); }
  function rev1N(ch) { return Math.max(1, Math.round(learnMin(ch) * REV1 / work())); }
  function rev2N(s) { var m = 0; s.ch.forEach(function (c) { m += R2[c.d] || 12; }); return Math.max(1, Math.ceil(m / work())); }
  function pracN() { return Math.max(1, Math.round(PRAC_MIN / work())); }
  function chapterMin(ch) { return (learnN(ch) + rev1N(ch)) * work(); }
  function slotsFor(d) {
    var h = (st.leaveFrom && d >= st.leaveFrom) ? st.leaveHours : st.hours[dow(d)];
    return Math.floor(num(h, 0, 16, 0) * 60 / (work() + brk()) + 1e-9);
  }

  /* ------------------------------------------------------------ planner */
  function planStart() { var d = today(); return st.start > d ? st.start : d; }

  /* Days from `from` to the last exam with their study capacity (in sessions).
     Exam days come from every subject (also one whose paper is on the first day and is not planned any more). */
  function buildDays(from, active, doneOn) {
    var exIdx = {}, last = 0, examAt = {};
    active.forEach(function (s) { exIdx[s.id] = diffDays(from, s.exam); if (exIdx[s.id] > last) last = exIdx[s.id]; });
    st.subjects.forEach(function (s) { if (validDate(s.exam) && s.exam >= from) examAt[diffDays(from, s.exam)] = 1; });
    var days = [];
    for (var i = 0; i <= last; i++) {
      var d = addDays(from, i), light = [];
      active.forEach(function (s) { if (st.light && exIdx[s.id] === i + 1) light.push(s.id); });
      var normal = slotsFor(d), cap = normal, kind = 'normal';
      if (examAt[i]) { kind = 'exam'; cap = st.rest ? 0 : Math.floor(normal / 2); }
      else if (light.length) { kind = 'light'; cap = Math.ceil(normal / 2); }
      cap = Math.max(0, cap - ((doneOn && doneOn[d]) || 0));
      days.push({ d: d, cap: cap, kind: kind, light: light, out: [] });
    }
    return { days: days, exIdx: exIdx };
  }

  /* subjects to plan: the exam is after the first plan day (on the exam day itself there is nothing left to plan) */
  function sortedActive(from) {
    return st.subjects.filter(function (s) { return validDate(s.exam) && s.exam > from && diffDays(from, s.exam) <= MAX_DAYS; })
      .sort(function (a, b) { return a.exam < b.exam ? -1 : a.exam > b.exam ? 1 : 0; });
  }

  /* Task queues for every subject: study (hard + weak chapters first) -> revision 1 -> practice paper. */
  function buildQueues(active, doneMin) {
    var W = work(), queues = {}, rev2Left = {};
    function doneN(key) { return Math.round(((doneMin && doneMin[key]) || 0) / W); }
    active.forEach(function (s) {
      var q = [];
      var order = s.ch.map(function (c, j) { return { c: c, j: j, w: (DW[c.d] || 1.5) * (CW[c.c] || 1) }; })
        .sort(function (a, b) { return b.w - a.w || a.j - b.j; }).map(function (o) { return o.c; });
      order.forEach(function (c) {
        var d0 = doneN(s.id + '|' + c.id + '|learn'), n = learnN(c) - d0;
        for (var p = 0; p < n; p++) { var part = d0 + p + 1; q.push({ s: s.id, c: c.id, k: 'learn', pr: part === 1 ? 99 : part === 2 ? 5 : 3 }); }
      });
      order.forEach(function (c) {
        var d0 = doneN(s.id + '|' + c.id + '|rev1'), n = rev1N(c) - d0;
        for (var p = 0; p < n; p++) { var part = d0 + p + 1; q.push({ s: s.id, c: c.id, k: 'rev1', pr: part === 1 ? (c.c === 'h' ? 4 : 6) : 2 }); }
      });
      if (st.prac) {
        var np = pracN() - doneN(s.id + '||prac');
        for (var p = 0; p < np; p++) q.push({ s: s.id, c: '', k: 'prac', pr: 1 });
      }
      queues[s.id] = q;
      rev2Left[s.id] = Math.max(0, rev2N(s) - doneN(s.id + '||rev2'));
    });
    return { queues: queues, rev2Left: rev2Left };
  }

  /* If time is too short, drop the least important tasks (EDF feasibility test per exam deadline). */
  function trim(active, queues, cut, fcap) {
    var P = [0];
    for (var i = 0; i < fcap.length; i++) P.push(P[i] + fcap[i]);
    var cuts = active.map(function (s) { return cut[s.id]; }).filter(function (c, i, a) { return a.indexOf(c) === i; }).sort(function (a, b) { return a - b; });
    /* over[c] = must-keep sessions due by deadline c that can never fit (they end up "unplaced");
       they use no time, so later deadlines are checked without them instead of giving up there */
    var over = {}, dropped = 0;
    function overTo(c) { var o = 0; for (var x in over) if (+x <= c) o += over[x]; return o; }
    for (var guard = 0; guard < 20000; guard++) {
      var bad = -1, excess = 0;
      for (var k = 0; k < cuts.length && bad < 0; k++) {
        var c = cuts[k], dem = 0;
        active.forEach(function (s) { if (cut[s.id] <= c) dem += queues[s.id].length; });
        excess = dem - overTo(c) - P[Math.min(c, fcap.length)];
        if (excess > 0) bad = c;
      }
      if (bad < 0) break;
      var best = null;
      active.forEach(function (s) {
        if (cut[s.id] > bad) return;
        var q = queues[s.id];
        for (var j = q.length - 1; j >= 0; j--) {
          if (q[j].pr >= 99) continue;
          if (!best || q[j].pr < best.pr || (q[j].pr === best.pr && q.length > best.len)) best = { s: s.id, j: j, pr: q[j].pr, len: q.length };
        }
      });
      if (!best) { over[bad] = (over[bad] || 0) + excess; continue; }
      queues[best.s].splice(best.j, 1);
      dropped++;
    }
    return dropped;
  }

  /* Fill the days: urgent subjects first (work left / time left), 1-3 subjects a day in blocks,
     paced so that the work is spread evenly and a little buffer stays before the last exam. */
  function fill(days, fcap, active, queues, cut) {
    var N = days.length, P = [0];
    for (var i = 0; i < N; i++) P.push(P[i] + fcap[i]);
    var cuts = active.map(function (s) { return cut[s.id]; }).filter(function (c, i, a) { return a.indexOf(c) === i; }).sort(function (a, b) { return a - b; });
    var maxCut = cuts.length ? cuts[cuts.length - 1] : 0;
    var block = work() === 25 ? 2 : 1;
    function capTo(c, i, left) { return left + P[Math.min(c, N)] - P[i + 1]; }
    /* can the coming days alone (after day i) still hold every remaining task before its exam? */
    function futureFits(i) {
      for (var y = 0; y < cuts.length; y++) {
        var cc = cuts[y];
        if (cc <= i) continue;
        var DD = 0;
        active.forEach(function (s) { if (cut[s.id] > i && cut[s.id] <= cc) DD += queues[s.id].length; });
        if (DD > capTo(cc, i, 0)) return false;
      }
      return true;
    }
    function pracRun(q) { var n = 0; while (n < q.length && q[n].k === 'prac') n++; return n; }
    /* a practice paper is solved in one sitting: don't start it on a day that has too few slots left
       when a day before the exam has room for the whole paper */
    function pracWaits(s, i, left) {
      var q = queues[s.id];
      if (!q.length || q[0].k !== 'prac') return false;
      var n = pracRun(q);
      if (n <= left) return false;
      for (var j = i + 1; j < Math.min(cut[s.id], N); j++) if (fcap[j] >= n) return true;
      return false;
    }
    for (i = 0; i < N; i++) {
      var cap = fcap[i];
      if (!cap) continue;
      var remD = 0;
      active.forEach(function (s) { if (cut[s.id] > i) remD += queues[s.id].length; });
      if (!remD) continue;
      var remC = capTo(maxCut, i, cap);
      var rho = remC > 0 ? remD / remC : 1;
      var target = Math.min(cap, Math.ceil(cap * Math.min(1, rho * 1.15)));
      var maxDistinct = Math.max(1, Math.min(3, Math.ceil(target / block)));
      var used = {}, distinct = 0, last = null, lastS = null, run = 0, lastK = '';
      for (var k = 0; k < cap; k++) {
        var left = cap - k, forced = null;
        for (var x = 0; x < cuts.length && !forced; x++) {
          var c = cuts[x];
          if (c <= i) continue;
          var D = 0;
          active.forEach(function (s) { if (cut[s.id] > i && cut[s.id] <= c) D += queues[s.id].length; });
          if (D > 0 && capTo(c, i, left) - D <= 0) {
            active.forEach(function (s) { if (!forced && cut[s.id] > i && queues[s.id].length) forced = s; });   // active is sorted by exam date: EDF
          }
        }
        /* a practice paper started today is finished in the same sitting */
        var cont = !forced && lastK === 'prac' && lastS && queues[lastS.id].length && queues[lastS.id][0].k === 'prac' ? lastS : null;
        if (!forced && !cont && k >= target) {
          /* stop for today only if the coming days alone can still hold every remaining task */
          if (futureFits(i)) break;
          active.forEach(function (s) { if (!forced && cut[s.id] > i && queues[s.id].length) forced = s; });
        }
        var pick = forced || cont;
        if (!pick) {
          var best = -1, waiting = null;
          active.forEach(function (s) {
            var q = queues[s.id];
            if (!q.length || cut[s.id] <= i) return;
            if (pracWaits(s, i, left)) { waiting = waiting || s; return; }
            var sc = q.length / Math.max(1, capTo(cut[s.id], i, left));
            if (s.id === last && run < block) sc *= 4;
            else if (used[s.id]) sc *= 0.5;
            else if (distinct >= maxDistinct) sc *= 0.2;
            if (sc > best) { best = sc; pick = s; }
          });
          if (!pick && waiting && !futureFits(i)) pick = waiting;
        }
        if (!pick) break;
        var tk = queues[pick.id].shift();
        days[i].out.push(tk);
        lastK = tk.k;
        if (!used[pick.id]) { used[pick.id] = 0; distinct++; }
        used[pick.id]++;
        if (pick.id === last) run++; else { last = pick.id; run = 1; }
        lastS = pick;
      }
    }
    var unplaced = 0;
    active.forEach(function (s) { unplaced += queues[s.id].length; });
    return unplaced;
  }

  function doneStats(sessions) {
    var doneMin = {}, doneOn = {};
    sessions.forEach(function (x) {
      if (!x.done) return;
      var key = x.s + '|' + (x.c || '') + '|' + x.k;
      doneMin[key] = (doneMin[key] || 0) + (x.m || 25);
      doneOn[x.d] = (doneOn[x.d] || 0) + 1;
    });
    return { doneMin: doneMin, doneOn: doneOn };
  }

  /* (Re)make the plan from today (or the start date). Done sessions are kept; everything else is planned again. */
  function generate() {
    var from = planStart(), W = work();
    var keep = ((st.plan && st.plan.sessions) || []).filter(function (x) {
      if (!x.done) return false;
      var s = subjById(x.s);
      return s && (!x.c || chById(s, x.c));
    });
    var ds = doneStats(keep);
    var withDate = st.subjects.filter(function (s) { return validDate(s.exam); });
    var past = withDate.filter(function (s) { return s.exam < from; }).length;
    var far = withDate.filter(function (s) { return s.exam >= from && diffDays(from, s.exam) > MAX_DAYS; }).length;
    var active = sortedActive(from);
    var sessions = keep.slice(), skipped = 0, unplaced = 0;
    if (active.length) {
      var B = buildDays(from, active, ds.doneOn), days = B.days, cut = B.exIdx;
      var Q = buildQueues(active, ds.doneMin), queues = Q.queues;
      /* 1) final revision: reserve it on the light day just before the exam (then the days before it) */
      active.forEach(function (s) {
        var n = Q.rev2Left[s.id], e = cut[s.id];
        for (var i = e - 1; i >= Math.max(0, e - 4) && n > 0; i--) {
          var D = days[i];
          if (D.kind === 'light' && D.light.indexOf(s.id) < 0) continue;
          while (D.cap > 0 && n > 0) { D.out.push({ s: s.id, c: '', k: 'rev2' }); D.cap--; n--; }
        }
        for (; n > 0; n--) queues[s.id].push({ s: s.id, c: '', k: 'rev2', pr: 6 });
      });
      /* 2) light days carry only the final revision */
      var fcap = days.map(function (D) { return D.kind === 'light' ? 0 : D.cap; });
      skipped = trim(active, queues, cut, fcap);
      unplaced = fill(days, fcap, active, queues, cut);
      days.forEach(function (D) {
        var order = [];
        D.out.forEach(function (tk) { if (order.indexOf(tk.s) < 0) order.push(tk.s); });
        order.forEach(function (sid) {
          D.out.forEach(function (tk) { if (tk.s === sid) sessions.push({ id: uid('x'), d: D.d, s: tk.s, c: tk.c, k: tk.k, m: W, done: false }); });
        });
      });
    }
    sessions.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
    st.plan = { made: today(), from: from, sessions: sessions, skipped: skipped, unplaced: unplaced, past: past, far: far, pomo: W };
    st.dirty = false;
    st.showPast = false;          // a new plan starts with the earlier days folded away again
    save();
    return st.plan;
  }

  /* ------------------------------------------------------------ plan helpers for display */
  function planSessions() { return st.plan ? st.plan.sessions : []; }
  function partsMap(list) {
    var groups = {}, map = {};
    list.forEach(function (x) { var k = x.s + '|' + (x.c || '') + '|' + x.k; (groups[k] = groups[k] || []).push(x); });
    Object.keys(groups).forEach(function (k) { var g = groups[k]; g.forEach(function (x, i) { map[x.id] = [i + 1, g.length]; }); });
    return map;
  }
  function kindLabel(k) { return t('kind_' + k); }
  function sessWhat(x) {
    var s = subjById(x.s);
    if (x.k === 'rev2') return t('rev2_what');
    if (x.k === 'prac') return t('prac_what');
    return cName(s, chById(s, x.c));
  }
  function byDate(list) { var m = {}; list.forEach(function (x) { (m[x.d] = m[x.d] || []).push(x); }); return m; }
  function examsOn(d) { return st.subjects.filter(function (s) { return s.exam === d; }); }
  function lightFor(d) { if (!st.light || examsOn(d).length) return []; var n = addDays(d, 1); return st.subjects.filter(function (s) { return s.exam === n; }); }
  function names(list) { return list.map(sName).join(', '); }
  function lastExam(upTo) { var m = ''; st.subjects.forEach(function (s) { if (validDate(s.exam) && s.exam > m && (!upTo || s.exam <= upTo)) m = s.exam; }); return m; }
  function displayRange() {
    var list = planSessions(), anchor = st.plan ? (st.plan.from || st.start) : planStart(), first = anchor;
    if (st.start < first) first = st.start;
    if (list.length && list[0].d < first) first = list[0].d;
    /* an exam left out because it is more than a year away (often a typo in the year) does not stretch the list */
    var last = lastExam(addDays(anchor, MAX_DAYS));
    if (list.length && list[list.length - 1].d > last) last = list[list.length - 1].d;
    if (!last || last < first) last = first;
    if (diffDays(first, last) > MAX_DAYS + 60) last = addDays(first, MAX_DAYS + 60);
    return [first, last];
  }
  function missedList() { var d = today(); return planSessions().filter(function (x) { return !x.done && x.d < d; }); }

  /* ------------------------------------------------------------ tabs */
  function setTab(tab, noRender) {
    st.tab = tab; save();
    if (tab === 'plan' && !noRender) renderPlan();
    $$('#tabs [role=tab]').forEach(function (b) {
      var on = b.getAttribute('data-tab') === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    ['plan', 'exams', 'time', 'tips'].forEach(function (p) { $('#p-' + p).hidden = p !== tab; });
    if (tab === 'time') renderCap();
  }
  $$('#tabs [role=tab]').forEach(function (b, i, all) {
    b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); });
    b.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      if (document.documentElement.dir === 'rtl') dir = -dir;
      var nb = all[(i + dir + all.length) % all.length];
      nb.focus(); setTab(nb.getAttribute('data-tab'));
    });
  });

  /* ------------------------------------------------------------ PLAN tab */
  function renderSummary() { renderCountdown(); renderProgress(); renderToday(); }
  function renderCountdown() {
    var td = today();
    var next = st.subjects.filter(function (s) { return validDate(s.exam) && s.exam >= td; })
      .sort(function (a, b) { return a.exam < b.exam ? -1 : a.exam > b.exam ? 1 : 0; });
    var cdN = $('#cd-days'), cdU = $('#cd-unit'), cdW = $('#cd-what'), cdL = $('#cd-later');
    cdL.textContent = '';
    if (!next.length) {
      cdN.textContent = st.subjects.some(function (s) { return validDate(s.exam); }) ? '🎉' : '—';
      cdU.textContent = st.subjects.some(function (s) { return validDate(s.exam); }) ? t('all_over') : t('no_exams');
      cdW.textContent = '';
    } else {
      var first = next[0].exam, same = next.filter(function (s) { return s.exam === first; }), n = diffDays(td, first);
      cdN.textContent = EDU.fmt(n);
      cdU.textContent = n === 0 ? t('exam_today') : n === 1 ? t('day_left') : t('days_left');
      cdW.textContent = names(same) + ' · ' + dShort(first);
      var rest = next.filter(function (s) { return s.exam !== first; });
      if (rest.length) { var n2 = diffDays(td, rest[0].exam); cdL.textContent = n2 === 1 ? t('then_exam_1', { subject: sName(rest[0]) }) : t('then_exam', { subject: sName(rest[0]), n: EDU.fmt(n2) }); }
    }
  }
  function renderProgress() {
    var list = planSessions(), done = list.filter(function (x) { return x.done; }).length;
    var pct = list.length ? Math.round(done / list.length * 100) : 0;
    $('#pct').textContent = t('pct', { n: EDU.fmt(pct) });
    $('#pct-bar').style.width = pct + '%';
    $('#pct-bar-wrap').setAttribute('aria-valuenow', String(pct));
    $('#done-of').textContent = t('done_of', { done: EDU.fmt(done), total: EDU.fmt(list.length) });
    var sp = $('#subj-prog');
    sp.innerHTML = '';
    st.subjects.slice().sort(function (a, b) { return (a.exam || '9') < (b.exam || '9') ? -1 : 1; }).forEach(function (s) {
      var mine = list.filter(function (x) { return x.s === s.id; });
      if (!mine.length) return;
      var dn = mine.filter(function (x) { return x.done; }).length, p = Math.round(dn / mine.length * 100);
      sp.appendChild(el('div', { class: 'sp-row', style: { '--sc': scol(s) }, 'data-s': s.id },
        el('span', { class: 'sp-name no-i18n', text: sName(s) }),
        el('span', { class: 'small muted sp-pct', text: t('pct', { n: EDU.fmt(p) }) }),
        el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span', { style: { width: p + '%' } }))));
    });
    var ms = missedList().length;
    $('#missed-badge').textContent = ms ? EDU.fmt(ms) : '';
  }

  function renderToday() {
    var td = today(), list = planSessions(), parts = partsMap(list);
    var mine = list.filter(function (x) { return x.d === td; });
    var body = $('#today-body');
    body.innerHTML = '';
    $('#today-h').textContent = t('today_title');
    $('#today-sub').textContent = dShort(td);
    var ex = examsOn(td), lf = lightFor(td);
    if (ex.length) body.appendChild(el('p', { class: 'exam-line', text: '📝 ' + t('exam_of', { subject: names(ex) }) + ' · ' + t('best_wishes') }));
    else if (lf.length && mine.length) body.appendChild(el('p', { class: 'callout small', text: t('light_tip', { subject: names(lf) }) }));
    if (mine.length) {
      var doneN = mine.filter(function (x) { return x.done; }).length;
      body.appendChild(el('p', { class: 'small muted', id: 'today-count', text: t('today_count', { done: EDU.fmt(doneN), n: EDU.fmt(mine.length), time: dur(mine.reduce(function (a, x) { return a + (x.m || 25); }, 0)) }) }));
      body.appendChild(sessList(mine, parts, 't', true));
      if (doneN === mine.length) body.appendChild(el('p', { class: 'callout success small', id: 'today-all', text: '🎉 ' + t('today_all_done') }));
    } else {
      body.appendChild(el('p', { class: 'muted', id: 'today-free', text: ex.length && st.rest ? t('rest_after') : t('today_free') }));
      var nx = list.filter(function (x) { return x.d > td && !x.done; })[0];
      if (nx) body.appendChild(el('p', { class: 'small', text: t('next_study', { date: dShort(nx.d) }) }));
    }
  }

  /* consecutive sessions of the same task (subject + chapter + kind) form one row with one tick box per session */
  function groupRuns(list) {
    var out = [];
    list.forEach(function (x) {
      var g = out[out.length - 1];
      if (g && g[0].s === x.s && g[0].c === x.c && g[0].k === x.k && g[0].d === x.d && (g[0].m || 25) === (x.m || 25)) g.push(x); else out.push([x]);
    });
    return out;
  }
  /* keep "1–5/6" in reading order inside Urdu (right-to-left) text */
  function ltr(s) { return document.documentElement.dir === 'rtl' ? '⁦' + s + '⁩' : s; }
  function runParts(g, parts) {
    var x = g[0], m = x.m || 25, p0 = parts[x.id], p1 = parts[g[g.length - 1].id], lab = kindLabel(x.k);
    if (p0 && p0[1] > 1) lab += ' (' + ltr(t('part', { i: g.length > 1 ? EDU.fmt(p0[0]) + '–' + EDU.fmt(p1[0]) : EDU.fmt(p0[0]), n: EDU.fmt(p0[1]) })) + ')';
    return [lab, g.length > 1 ? t('n_sessions', { n: EDU.fmt(g.length), m: EDU.fmt(m) }) : t('dur_m', { m: EDU.fmt(m) })];
  }
  function runLabel(g, parts) { return runParts(g, parts).join(' · '); }
  function rowState(li) {
    var cbs = $$('.sess-cb', li), td = today(), d = li.getAttribute('data-date');
    var done = cbs.filter(function (c) { return c.checked; }).length;
    var missed = d < td && done < cbs.length;
    li.classList.toggle('done', done === cbs.length);
    li.classList.toggle('missed', missed);
    var b = $('.badge.danger', li);
    if (b && !missed) b.remove();
    if (!b && missed) $('.sess-main', li).appendChild(el('span', { class: 'badge danger', text: t('missed') }));
    var tb = $('.sess-timer', li);
    if (tb) { tb.hidden = done === cbs.length; var nx = cbs.filter(function (c) { return !c.checked; })[0]; if (nx) tb.setAttribute('data-id', nx.getAttribute('data-id')); }
  }
  function sessRow(g, parts, prefix, timer) {
    var x = g[0], s = subjById(x.s), lab = runParts(g, parts);
    var pips = el('span', { class: 'pips' });
    g.forEach(function (y) {
      var p = parts[y.id];
      var cb = el('input', { type: 'checkbox', id: prefix + 'cb-' + y.id, class: 'sess-cb', 'data-id': y.id,
        'aria-label': sName(s) + ' · ' + sessWhat(y) + ' · ' + kindLabel(y.k) + (p && p[1] > 1 ? ' (' + t('part', { i: EDU.fmt(p[0]), n: EDU.fmt(p[1]) }) + ')' : '') });
      cb.checked = !!y.done;
      pips.appendChild(el('label', { class: 'pip', title: t('dur_m', { m: EDU.fmt(y.m || 25) }) }, cb));
    });
    var li = el('li', { class: 'sess', style: { '--sc': scol(s) }, 'data-s': x.s, 'data-c': x.c || '', 'data-k': x.k, 'data-date': x.d, 'data-n': String(g.length) },
      el('div', { class: 'sess-main' },
        el('div', { class: 'sess-txt' },
          el('span', { class: 'sess-subj no-i18n', text: sName(s) }), ' · ',
          el('span', { class: 'sess-ch' + (x.k === 'learn' || x.k === 'rev1' ? ' no-i18n' : ''), text: sessWhat(x) }),
          el('span', { class: 'sess-meta' }, el('span', { text: lab[0] }), ' · ', el('span', { text: lab[1] })))),
      el('div', { class: 'sess-acts' }, pips,
        timer ? el('button', { type: 'button', class: 'btn btn-sm sess-timer', 'aria-label': t('start_timer'), title: t('start_timer'), text: '▶' }) : null));
    rowState(li);
    return li;
  }
  function sessList(list, parts, prefix, timer) {
    var ul = el('ul', { class: 'sess-list' });
    groupRuns(list).forEach(function (g) { ul.appendChild(sessRow(g, parts, prefix, timer)); });
    return ul;
  }

  function dayCard(d, list, parts, prefix) {
    var td = today(), ex = examsOn(d), lf = lightFor(d);
    var mins = list.reduce(function (a, x) { return a + (x.m || 25); }, 0);
    var cls = 'card day' + (d === td ? ' is-today' : '') + (ex.length ? ' is-exam' : lf.length ? ' is-light' : '') + (!list.length && !ex.length ? ' is-free' : '');
    var head = el('div', { class: 'day-h' }, el('span', { class: 'day-date', text: dShort(d) }));
    if (d === td) head.appendChild(el('span', { class: 'badge accent', text: t('today_word') }));
    if (ex.length) head.appendChild(el('span', { class: 'badge danger', text: t('exam_day') }));
    else if (lf.length) head.appendChild(el('span', { class: 'badge info', text: t('light_day') }));
    if (list.length) head.appendChild(el('span', { class: 'day-sum', text: t('day_total', { n: EDU.fmt(list.length), time: dur(mins) }) }));
    else if (!ex.length) head.appendChild(el('span', { class: 'day-sum', text: t('free_day') }));
    var card = el('article', { class: cls, 'data-date': d }, head);
    if (ex.length) card.appendChild(el('p', { class: 'exam-line', text: '📝 ' + t('exam_of', { subject: names(ex) }) }));
    if (list.length) card.appendChild(sessList(list, parts, prefix, d === td));
    if (ex.length && !list.length && st.rest) card.appendChild(el('p', { class: 'day-note muted', text: t('rest_after') }));
    if (lf.length && list.length) card.appendChild(el('p', { class: 'day-note muted', text: t('light_tip', { subject: names(lf) }) }));
    return card;
  }

  function renderList() {
    var box = $('#plan-list');
    box.innerHTML = '';
    var list = planSessions(), parts = partsMap(list), by = byDate(list), R = displayRange(), td = today();
    var startShow = R[0], hidden = 0;
    if (!st.showPast && td > R[0] && td <= R[1]) { startShow = td; hidden = diffDays(R[0], td); }
    if (hidden > 0) {
      box.appendChild(el('button', { type: 'button', class: 'btn btn-sm', id: 'show-past', text: t('show_past', { n: EDU.fmt(hidden) }), onclick: function () { st.showPast = true; save(); renderList(); } }));
    }
    var grid = el('div', { class: 'days' });
    for (var d = startShow, guard = 0; d <= R[1] && guard < MAX_DAYS + 90; d = addDays(d, 1), guard++) grid.appendChild(dayCard(d, by[d] || [], parts, 'l'));
    box.appendChild(grid);
  }

  function renderCal() {
    var box = $('#plan-cal');
    box.innerHTML = '';
    var list = planSessions(), by = byDate(list), R = displayRange(), td = today();
    if (!st.calSel || st.calSel < R[0] || st.calSel > R[1]) st.calSel = td >= R[0] && td <= R[1] ? td : R[0];
    var wd = dayNames('days_short');
    var m0 = parse(R[0]), m1 = parse(R[1]);
    var cur = new Date(m0.getFullYear(), m0.getMonth(), 1), guard = 0;
    while (cur <= m1 && guard++ < 16) {
      var month = el('section', { class: 'card cal-month' }, el('h3', { text: dfmt(iso(cur), { month: 'long', year: 'numeric' }) }));
      var grid = el('div', { class: 'cal-grid' });
      wd.forEach(function (w) { grid.appendChild(el('div', { class: 'cal-wd', 'aria-hidden': 'true', text: w })); });
      /* skip whole weeks before the first day and after the last day of the plan */
      var dim = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate(), n0 = 1, n1 = dim, ym = iso(cur).slice(0, 7);
      if (R[0].slice(0, 7) === ym) n0 = Math.max(1, parse(R[0]).getDate() - dow(R[0]));
      if (R[1].slice(0, 7) === ym) n1 = Math.min(dim, parse(R[1]).getDate() + 6 - dow(R[1]));
      var offset = dow(iso(new Date(cur.getFullYear(), cur.getMonth(), n0)));
      for (var b = 0; b < offset; b++) grid.appendChild(el('div', { 'aria-hidden': 'true' }));
      for (var n = n0; n <= n1; n++) {
        var d = iso(new Date(cur.getFullYear(), cur.getMonth(), n));
        var inR = d >= R[0] && d <= R[1], sl = by[d] || [], ex = examsOn(d), lf = lightFor(d);
        var dn = sl.filter(function (x) { return x.done; }).length;
        var label = dLong(d) + (sl.length ? ' · ' + t('done_of', { done: EDU.fmt(dn), total: EDU.fmt(sl.length) }) : '') + (ex.length ? ' · ' + t('exam_of', { subject: names(ex) }) : '');
        var btn = el('button', {
          type: 'button', class: 'cal-day' + (d === td ? ' is-today' : '') + (ex.length ? ' is-exam' : lf.length ? ' is-light' : '') + (sl.length && dn === sl.length ? ' all-done' : ''),
          'data-date': d, 'aria-label': label, 'aria-pressed': d === st.calSel ? 'true' : 'false', disabled: !inR
        }, el('span', { class: 'cal-n', text: EDU.fmt(n) }));
        if (ex.length) btn.appendChild(el('span', { class: 'cal-ex', 'aria-hidden': 'true', text: '📝' }));
        if (sl.length) {
          var dots = el('span', { class: 'cal-dots', 'aria-hidden': 'true' }), seen = [];
          sl.forEach(function (x) { if (seen.indexOf(x.s) < 0 && seen.length < 4) { seen.push(x.s); dots.appendChild(el('i', { style: { '--sc': scol(subjById(x.s)) } })); } });
          btn.appendChild(dots);
          btn.appendChild(el('span', { class: 'cal-c', 'aria-hidden': 'true', text: EDU.fmt(dn) + '/' + EDU.fmt(sl.length) }));
        }
        grid.appendChild(btn);
      }
      month.appendChild(grid);
      box.appendChild(month);
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    box.appendChild(el('div', { class: 'cal-legend' },
      el('span', {}, el('i', { style: { background: 'var(--danger-soft)', borderColor: 'var(--danger)' } }), t('exam_day')),
      el('span', {}, el('i', { style: { background: 'var(--info-soft)', borderColor: 'var(--info)' } }), t('light_day')),
      el('span', {}, el('i', { style: { outline: '2px solid var(--accent)' } }), t('today_word')),
      el('span', {}, t('tap_day'))));
    var det = el('div', { id: 'cal-detail' });
    det.appendChild(dayCard(st.calSel, by[st.calSel] || [], partsMap(list), 'c'));
    box.appendChild(det);
  }

  function renderMsgs() {
    var box = $('#plan-msgs');
    box.innerHTML = '';
    if (!st.plan) return;
    var p = st.plan, W = p.pomo || work();
    if (st.dirty) box.appendChild(el('div', { class: 'callout warning msg', id: 'msg-dirty' }, el('span', { text: t('plan_outdated') }),
      el('button', { type: 'button', class: 'btn btn-sm btn-primary', id: 'update-plan', text: t('update_plan'), onclick: function () { remake('plan_updated'); } })));
    var ms = missedList().length;
    if (ms) box.appendChild(el('div', { class: 'callout danger msg', id: 'msg-missed' }, el('span', { text: t('missed_n', { n: EDU.fmt(ms) }) }),
      el('button', { type: 'button', class: 'btn btn-sm btn-primary', id: 'reschedule-2', text: t('reschedule'), onclick: reschedule })));
    if (p.skipped) box.appendChild(el('div', { class: 'callout warning msg', id: 'msg-skipped' }, el('span', { text: t('tight_skip', { n: EDU.fmt(p.skipped), time: dur(p.skipped * W) }) })));
    if (p.unplaced) box.appendChild(el('div', { class: 'callout danger msg', id: 'msg-unplaced' }, el('span', { text: t('tight_unplaced', { n: EDU.fmt(p.unplaced), time: dur(p.unplaced * W) }) })));
    if (p.past) box.appendChild(el('div', { class: 'callout msg' }, el('span', { text: t('exams_past', { n: EDU.fmt(p.past) }) })));
    if (p.far) box.appendChild(el('div', { class: 'callout warning msg' }, el('span', { text: t('exams_far', { n: EDU.fmt(p.far) }) })));
  }

  function renderPlan() {
    var has = !!st.plan && (st.plan.sessions.length > 0 || st.subjects.some(function (s) { return validDate(s.exam); }));
    $('#plan-empty').hidden = has;
    $('#plan-main').hidden = !has;
    renderDot();
    if (!has) { renderPrint(); return; }
    renderSummary();
    renderMsgs();
    $('#view-list').setAttribute('aria-pressed', st.view === 'list' ? 'true' : 'false');
    $('#view-cal').setAttribute('aria-pressed', st.view === 'cal' ? 'true' : 'false');
    $('#plan-list').hidden = st.view !== 'list';
    $('#plan-cal').hidden = st.view !== 'cal';
    if (st.view === 'list') renderList(); else renderCal();
    renderPrint();
  }

  /* tick a session without rebuilding the page (keeps focus + scroll) */
  function setDone(id, on) {
    var x = planSessions().filter(function (y) { return y.id === id; })[0];
    if (!x) return;
    x.done = !!on;
    save();
    $$('.sess-cb[data-id="' + id + '"]').forEach(function (cb) {
      cb.checked = x.done;
      var li = cb.closest('.sess');
      if (li) rowState(li);
    });
    if (x.d === today()) {
      var focus = document.activeElement && document.activeElement.id;
      renderToday();
      if (focus && document.getElementById(focus)) document.getElementById(focus).focus();
    }
    renderProgress();
    if (st.view === 'cal') {
      var cell = $('.cal-day[data-date="' + x.d + '"]');
      if (cell) {
        var sl = planSessions().filter(function (y) { return y.d === x.d; }), dn = sl.filter(function (y) { return y.done; }).length;
        var c = $('.cal-c', cell); if (c) c.textContent = EDU.fmt(dn) + '/' + EDU.fmt(sl.length);
        cell.classList.toggle('all-done', sl.length > 0 && dn === sl.length);
      }
    }
    renderMsgs();
    renderPrint();
  }

  document.addEventListener('change', function (e) {
    var cb = e.target;
    if (cb && cb.classList && cb.classList.contains('sess-cb')) {
      setDone(cb.getAttribute('data-id'), cb.checked);
      if (cb.checked) EDU.toast(t('well_done'));
    }
  });
  document.addEventListener('click', function (e) {
    var tb = e.target.closest && e.target.closest('.sess-timer');
    if (tb) { openTimer(tb.getAttribute('data-id')); return; }
    var cd = e.target.closest && e.target.closest('.cal-day');
    if (cd && !cd.disabled) {
      st.calSel = cd.getAttribute('data-date'); save();
      $$('.cal-day[aria-pressed="true"]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      cd.setAttribute('aria-pressed', 'true');
      var list = planSessions(), det = $('#cal-detail');
      det.innerHTML = '';
      det.appendChild(dayCard(st.calSel, byDate(list)[st.calSel] || [], partsMap(list), 'c'));
    }
  });

  function remake(msgKey) {
    var p = generate();
    renderPlan();
    var n = p.sessions.filter(function (x) { return !x.done; }).length;
    EDU.toast(t(msgKey || 'plan_ready', { n: EDU.fmt(n) }));
  }
  function reschedule() {
    var ms = missedList().length;
    if (!st.plan) return;
    if (!ms && !st.dirty) { EDU.toast(t('nothing_missed')); return; }
    generate();
    renderPlan();
    EDU.toast(ms ? t('rescheduled', { n: EDU.fmt(ms) }) : t('plan_updated'));
  }

  $('#reschedule').addEventListener('click', reschedule);
  $('#view-list').addEventListener('click', function () { st.view = 'list'; save(); renderPlan(); });
  $('#view-cal').addEventListener('click', function () { st.view = 'cal'; save(); renderPlan(); });
  $('#go-exams').addEventListener('click', function () { setTab('exams'); });
  $('#print-btn').addEventListener('click', function () { renderPrint(); window.print(); });

  /* ------------------------------------------------------------ focus timer (Pomodoro) */
  function beep() {
    try {
      var A = window.AudioContext || window.webkitAudioContext;
      if (!A) return;
      var ctx = new A(), o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      o.start(); o.stop(ctx.currentTime + 0.85);
      setTimeout(function () { try { ctx.close(); } catch (e) { } }, 1200);
    } catch (e) { }
  }
  function openTimer(id) {
    var x = planSessions().filter(function (y) { return y.id === id; })[0];
    if (!x) return;
    var s = subjById(x.s), W = x.m || 25, B = brk(W);
    var phase = 'focus', left = W * 60, running = true, last = Date.now(), iv = null;
    var big = el('div', { class: 'big-number timer-num', id: 'timer-num', role: 'timer' });
    var lab = el('p', { class: 'timer-lab', id: 'timer-lab' });
    var pauseBtn = el('button', { type: 'button', class: 'btn btn-lg', id: 'timer-pause' });
    var doneBtn = el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'timer-done', text: '✓ ' + t('mark_done') });
    var box = el('div', { class: 'stack timer-box' },
      el('p', { class: 'timer-what no-i18n', text: sName(s) + ' · ' + sessWhat(x) }),
      lab, big, el('div', { class: 'row' }, pauseBtn, doneBtn),
      el('p', { class: 'small muted', text: t('timer_help', { w: EDU.fmt(W), b: EDU.fmt(B) }) }));
    function draw() {
      var sec = Math.max(0, Math.ceil(left));
      big.textContent = pad(Math.floor(sec / 60)) + ':' + pad(sec % 60);
      lab.textContent = phase === 'focus' ? t('focus_time') : phase === 'break' ? t('break_time') : t('timer_over');
      box.classList.toggle('on-break', phase !== 'focus');
      pauseBtn.textContent = running ? '⏸ ' + t('pause') : '▶ ' + t('resume');
      pauseBtn.disabled = phase === 'over';
    }
    function tick() {
      var now = Date.now();
      if (running) left -= (now - last) / 1000;
      last = now;
      if (left <= 0 && running) {
        beep();
        if (phase === 'focus') { phase = 'break'; left = B * 60; EDU.toast(t('timer_break', { m: EDU.fmt(B) })); }
        else { phase = 'over'; running = false; left = 0; }
      }
      draw();
    }
    pauseBtn.addEventListener('click', function () { running = !running; last = Date.now(); draw(); });
    var close = EDU.modal(box, { title: '⏱ ' + t('focus_timer'), onClose: function () { clearInterval(iv); } });
    doneBtn.addEventListener('click', function () { setDone(x.id, true); EDU.toast(t('well_done')); close(); });
    iv = setInterval(tick, 250);
    draw();
  }

  /* ------------------------------------------------------------ export */
  function exportRows() {
    var list = planSessions(), parts = partsMap(list), rows = [];
    var R = displayRange(), by = byDate(list), days = dayNames('days');
    for (var d = R[0], g = 0; d <= R[1] && g < MAX_DAYS + 90; d = addDays(d, 1), g++) {
      examsOn(d).forEach(function (s) { rows.push([d, days[dow(d)], sName(s), '', t('csv_exam'), '', '']); });
      (by[d] || []).forEach(function (x) {
        var s = subjById(x.s), p = parts[x.id];
        rows.push([d, days[dow(d)], sName(s), sessWhat(x), kindLabel(x.k) + (p && p[1] > 1 ? ' (' + p[0] + '/' + p[1] + ')' : ''), x.m || 25, x.done ? t('yes') : t('no')]);
      });
    }
    return rows;
  }
  $('#csv-btn').addEventListener('click', function () {
    var rows = [[t('csv_date'), t('csv_day'), t('subject'), t('csv_what'), t('csv_task'), t('csv_minutes'), t('csv_done')]].concat(exportRows());
    EDU.download('study-plan.csv', EDU.csv.stringify(rows), 'text/csv');
  });

  function icsEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function icsFold(line) {
    var out = '', bytes = 0, enc = window.TextEncoder ? new TextEncoder() : null;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch >= '\ud800' && ch <= '\udbff' && i + 1 < line.length) { ch += line[i + 1]; i++; }
      var b = enc ? enc.encode(ch).length : 3;
      if (bytes + b > 73) { out += '\r\n '; bytes = 1; }
      out += ch; bytes += b;
    }
    return out;
  }
  $('#ics-btn').addEventListener('click', function () {
    var list = planSessions(), parts = partsMap(list), by = byDate(list), stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AI Pathshala//Exam Study Planner//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + icsEsc(t('app_title'))];
    function ev(uidPart, d, summary, desc) {
      L.push('BEGIN:VEVENT', 'UID:' + uidPart + '-' + d.replace(/-/g, '') + '@study-planner.ai-pathshala', 'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + d.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + addDays(d, 1).replace(/-/g, ''),
        'SUMMARY:' + icsEsc(summary), 'TRANSP:TRANSPARENT');
      if (desc) L.push('DESCRIPTION:' + icsEsc(desc));
      L.push('END:VEVENT');
    }
    Object.keys(by).sort().forEach(function (d) {
      var sl = by[d], subs = [];
      sl.forEach(function (x) { if (subs.indexOf(x.s) < 0) subs.push(x.s); });
      var desc = groupRuns(sl).map(function (g, i) { return (i + 1) + '. ' + sName(subjById(g[0].s)) + ' – ' + sessWhat(g[0]) + ' · ' + runLabel(g, parts); }).join('\n');
      ev('study', d, '📚 ' + t('ics_study', { list: subs.map(function (id) { return sName(subjById(id)); }).join(', '), n: EDU.fmt(sl.length) }), desc);
    });
    st.subjects.forEach(function (s) { if (validDate(s.exam)) ev('exam-' + s.id, s.exam, '📝 ' + t('exam_of', { subject: sName(s) }), t('best_wishes')); });
    L.push('END:VCALENDAR');
    EDU.download('study-plan.ics', L.map(icsFold).join('\r\n') + '\r\n', 'text/calendar');
  });

  /* ------------------------------------------------------------ print */
  function renderPrint() {
    var box = $('#print-area');
    box.innerHTML = '';
    box.appendChild(el('h1', { text: '📅 ' + t('print_title') }));
    var who = [st.name, st.cls].filter(function (x) { return x && x.trim(); }).join(' · ');
    box.appendChild(el('p', { class: 'no-i18n', text: (who ? who + ' · ' : '') + t('made_on', { date: dLong(today()) }) }));
    var ds = el('table', { class: 'table' }, el('thead', {}, el('tr', {}, el('th', { text: t('subject') }), el('th', { text: t('exam_date') }), el('th', { text: t('chapters') }))));
    var tb = el('tbody');
    st.subjects.slice().sort(function (a, b) { return (a.exam || '9') < (b.exam || '9') ? -1 : 1; }).forEach(function (s) {
      tb.appendChild(el('tr', {}, el('td', { text: sName(s) }), el('td', { text: validDate(s.exam) ? dShort(s.exam) : '—' }),
        el('td', { text: s.ch.map(function (c) { return cName(s, c); }).join(' · ') || '—' })));
    });
    ds.appendChild(tb);
    box.appendChild(ds);
    if (st.plan) {
      var list = planSessions(), parts = partsMap(list), by = byDate(list), R = displayRange();
      var tbl = el('table', { class: 'table' }, el('thead', {}, el('tr', {}, el('th', { text: t('csv_date') }), el('th', { text: t('print_plan') }))));
      var body = el('tbody');
      for (var d = R[0], g = 0; d <= R[1] && g < MAX_DAYS + 90; d = addDays(d, 1), g++) {
        var sl = by[d] || [], ex = examsOn(d), lf = lightFor(d);
        var cell = el('td');
        if (ex.length) cell.appendChild(el('div', { text: '📝 ' + t('exam_of', { subject: names(ex) }) }));
        if (sl.length) {
          var ul = el('ul');
          groupRuns(sl).forEach(function (g) {
            var boxes = g.map(function (x) { return x.done ? '☑' : '☐'; }).join('');
            ul.appendChild(el('li', {}, el('span', { class: 'pbox', text: boxes + ' ' }), sName(subjById(g[0].s)) + ' – ' + sessWhat(g[0]) + ' · ' + runLabel(g, parts)));
          });
          cell.appendChild(ul);
        } else if (!ex.length) cell.appendChild(el('span', { text: t('free_day') }));
        body.appendChild(el('tr', { class: ex.length ? 'p-exam' : lf.length ? 'p-light' : '' }, el('td', { text: dShort(d) + (lf.length ? ' · ' + t('light_day') : '') }), cell));
      }
      tbl.appendChild(body);
      box.appendChild(tbl);
    }
    box.appendChild(el('p', { class: 'small', text: '💡 ' + t('print_tips') }));
  }

  /* ------------------------------------------------------------ EXAMS tab */
  function markEdited() {
    if (st.sample) { st.sample = false; renderNote(); }
    if (st.plan) st.dirty = true;
    save();
    renderDot();
  }
  function renderDot() {
    var d = $('#tab-plan .tdot');
    if (d) d.remove();
    if (st.dirty && st.plan) $('#tab-plan').appendChild(el('span', { class: 'tdot', title: t('plan_outdated') }));
  }
  function examInfo(s) {
    var parts = [];
    if (validDate(s.exam)) {
      var n = diffDays(today(), s.exam);
      parts.push(n > 1 ? t('exam_in', { n: EDU.fmt(n) }) : n === 1 ? t('exam_tomorrow') : n === 0 ? t('exam_is_today') : t('exam_done'));
    }
    var mins = s.ch.reduce(function (a, c) { return a + chapterMin(c); }, 0);
    parts.push(t('subj_info', { n: EDU.fmt(s.ch.length), time: dur(mins) }));
    return parts.join(' · ');
  }
  function sortedSubjects() {
    return st.subjects.map(function (s, i) { return { s: s, i: i }; }).sort(function (a, b) {
      var x = validDate(a.s.exam) ? a.s.exam : '9999', y = validDate(b.s.exam) ? b.s.exam : '9999';
      return x < y ? -1 : x > y ? 1 : a.i - b.i;
    }).map(function (o) { return o.s; });
  }
  function opt(v, key, cur) { var o = el('option', { value: v, text: t(key) }); if (v === cur) o.selected = true; return o; }

  function chRow(s, c, i) {
    var name = el('input', { type: 'text', class: 'in-cname no-i18n', maxlength: '120', 'aria-label': t('chapter_name'), placeholder: t('chapter_ph'), autocomplete: 'off' });
    name.value = c.own ? c.name : cName(s, c);
    var est = el('span', { class: 'ch-est', text: '≈ ' + dur(chapterMin(c)) });
    function upd() { est.textContent = '≈ ' + dur(chapterMin(c)); updInfo(s); }
    name.addEventListener('input', function () { c.own = true; c.name = name.value; markEdited(); });
    var dSel = el('select', { class: 'in-d', 'aria-label': t('difficulty') }, opt('e', 'diff_e', c.d), opt('m', 'diff_m', c.d), opt('h', 'diff_h', c.d));
    var cSel = el('select', { class: 'in-c', 'aria-label': t('confidence') }, opt('l', 'conf_l', c.c), opt('o', 'conf_o', c.c), opt('h', 'conf_h', c.c));
    dSel.addEventListener('change', function () { c.d = dSel.value; markEdited(); upd(); });
    cSel.addEventListener('change', function () { c.c = cSel.value; markEdited(); upd(); });
    var del = el('button', { type: 'button', class: 'btn btn-ghost del-ch', 'aria-label': t('delete_chapter'), title: t('delete_chapter'), text: '✕' });
    del.addEventListener('click', function () {
      s.ch.splice(s.ch.indexOf(c), 1);
      if (st.plan) st.plan.sessions = st.plan.sessions.filter(function (x) { return !(x.s === s.id && x.c === c.id); });
      markEdited(); renderExams(); renderPlan();
    });
    return el('li', { class: 'ch-row', 'data-cid': c.id }, el('span', { class: 'ch-num', 'aria-hidden': 'true', text: EDU.fmt(i + 1) + '.' }), name, dSel, cSel, est, del);
  }
  function subjWarn(s) {
    if (!validDate(s.exam)) return el('p', { class: 'callout warning small subj-warn', text: t('no_date') });
    if (s.exam < planStart()) return el('p', { class: 'callout small subj-warn', text: t('exam_before_start') });
    return null;
  }
  function updInfo(s) {
    var card = $('.subj[data-sid="' + s.id + '"]');
    if (!card) return;
    var info = $('.subj-info', card), old = $('.subj-warn', card), w = subjWarn(s);
    info.textContent = examInfo(s);
    card.setAttribute('data-exam', s.exam || '');
    if (old) old.remove();
    if (w) info.parentNode.insertBefore(w, info.nextSibling);
  }
  /* keep the date sheet in exam-date order by moving the existing cards (typing and focus are kept) */
  function resortExams() {
    var box = $('#subj-list'), a = document.activeElement;
    var cards = sortedSubjects().map(function (s) { return $('.subj[data-sid="' + s.id + '"]', box); });
    if (cards.some(function (c) { return !c; })) return;
    var cur = $$('.subj', box);
    if (cur.length === cards.length && cur.every(function (c, i) { return c === cards[i]; })) return;
    cards.forEach(function (c) { box.appendChild(c); });
    if (a && box.contains(a) && document.activeElement !== a) a.focus();
  }
  function newChapter(s, name) { var c = { id: uid('c'), ck: null, own: true, name: name || '', d: 'm', c: 'o' }; s.ch.push(c); return c; }

  function subjCard(s) {
    var nameIn = el('input', { type: 'text', class: 'in-sname no-i18n', maxlength: '80', placeholder: t('subject_ph'), autocomplete: 'off' });
    nameIn.value = s.own ? s.name : sName(s);
    nameIn.addEventListener('input', function () { s.own = true; s.name = nameIn.value; markEdited(); });
    var dateIn = el('input', { type: 'date', class: 'in-exam' });
    dateIn.value = s.exam || '';
    /* no re-render while the date is typed (that would reset the half-typed date); re-sort when the field is left */
    dateIn.addEventListener('change', function () {
      var v = validDate(dateIn.value) ? dateIn.value : '';
      if (v !== s.exam) { s.exam = v; markEdited(); updInfo(s); renderSummary(); }
      if (document.activeElement !== dateIn) resortExams();
    });
    dateIn.addEventListener('blur', function () { setTimeout(resortExams, 0); });
    var del = el('button', { type: 'button', class: 'btn btn-danger del-subj', 'aria-label': t('delete_subject'), title: t('delete_subject'), text: '🗑' });
    del.addEventListener('click', function () {
      if (!confirm(t('confirm_delete_subject', { name: sName(s) }))) return;
      st.subjects.splice(st.subjects.indexOf(s), 1);
      if (st.plan) st.plan.sessions = st.plan.sessions.filter(function (x) { return x.s !== s.id; });
      markEdited(); renderExams(); renderPlan();
    });
    var card = el('section', { class: 'card subj', 'data-sid': s.id, 'data-exam': s.exam || '', style: { '--sc': scol(s) } },
      el('div', { class: 'subj-head' },
        el('label', { class: 'field f-name' }, el('span', {}, el('span', { class: 'sdot', 'aria-hidden': 'true' }), ' ', t('subject')), nameIn),
        el('label', { class: 'field' }, el('span', { text: t('exam_date') }), dateIn),
        del),
      el('p', { class: 'small muted subj-info', text: examInfo(s) }), subjWarn(s));
    if (s.ch.length) {
      card.appendChild(el('div', { class: 'ch-head', 'aria-hidden': 'true' },
        el('span', { class: 'h-name', text: t('chapters') }), el('span', { class: 'h-d', text: t('difficulty') }),
        el('span', { class: 'h-c', text: t('confidence') }), el('span', { class: 'h-est', text: t('study_time') })));
      var ol = el('ol', { class: 'ch-list' });
      s.ch.forEach(function (c, i) { ol.appendChild(chRow(s, c, i)); });
      card.appendChild(ol);
    } else card.appendChild(el('p', { class: 'muted small', text: t('no_chapters') }));
    var addBtn = el('button', { type: 'button', class: 'btn btn-sm add-ch', text: '＋ ' + t('add_chapter'), disabled: s.ch.length >= MAX_CH });
    var pasteBtn = el('button', { type: 'button', class: 'btn btn-sm paste-ch', text: '📋 ' + t('paste_chapters'), disabled: s.ch.length >= MAX_CH && !s.ch.some(function (c) { return c.own && !c.name.trim(); }) });
    addBtn.addEventListener('click', function () {
      if (s.ch.length >= MAX_CH) return;
      newChapter(s, ''); markEdited(); renderExams();
      var ins = $$('.subj[data-sid="' + s.id + '"] .in-cname'); if (ins.length) ins[ins.length - 1].focus();
    });
    pasteBtn.addEventListener('click', function () { pasteDialog(s); });
    card.appendChild(el('div', { class: 'row' }, addBtn, pasteBtn));
    return card;
  }
  function pasteDialog(s) {
    var ta = el('textarea', { id: 'paste-ta', rows: '8', class: 'no-i18n', 'aria-label': t('paste_help') });
    var ok = el('button', { type: 'button', class: 'btn btn-primary', id: 'paste-ok', text: t('add') });
    var close = EDU.modal(el('div', { class: 'stack' }, el('p', { class: 'muted', text: t('paste_help') }), ta, el('div', { class: 'row' }, ok)), { title: t('paste_chapters') + ': ' + sName(s) });
    ok.addEventListener('click', function () {
      var lines = ta.value.split(/\r?\n/).map(function (x) { return x.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim(); }).filter(Boolean);
      if (lines.length) {
        /* the empty "Chapter 1" row that a new subject starts with is replaced by the pasted list */
        var blank = s.ch.filter(function (c) { return c.own && !c.name.trim(); });
        blank.forEach(function (c) { s.ch.splice(s.ch.indexOf(c), 1); });
        if (st.plan && blank.length) st.plan.sessions = st.plan.sessions.filter(function (x) { return !(x.s === s.id && blank.some(function (c) { return c.id === x.c; })); });
        lines = lines.slice(0, MAX_CH - s.ch.length);
        lines.forEach(function (l) { newChapter(s, l.slice(0, 120)); });
      }
      close();
      if (lines.length) { markEdited(); renderExams(); EDU.toast(t('chapters_added', { n: EDU.fmt(lines.length) })); }
    });
    setTimeout(function () { ta.focus(); }, 30);
  }
  function renderExams() {
    $('#in-name').value = st.name;
    $('#in-class').value = st.cls;
    var box = $('#subj-list');
    box.innerHTML = '';
    if (!st.subjects.length) box.appendChild(el('p', { class: 'card muted', text: t('no_subjects') }));
    sortedSubjects().forEach(function (s) { box.appendChild(subjCard(s)); });
    $('#add-subject').disabled = st.subjects.length >= MAX_SUBJ;
  }
  function newSubject() {
    var usedCols = st.subjects.map(function (s) { return s.col; }), col = 0;
    while (usedCols.indexOf(col) >= 0 && col < 7) col++;
    if (usedCols.indexOf(col) >= 0) col = st.subjects.length % 8;
    var le = lastExam(), base = planStart();
    var exam = le && le >= base ? addDays(le, 2) : addDays(base, 14);
    var s = { id: uid('s'), ck: null, own: true, name: '', exam: exam, col: col, ch: [] };
    newChapter(s, '');
    st.subjects.push(s);
    return s;
  }
  $('#add-subject').addEventListener('click', function () {
    if (st.subjects.length >= MAX_SUBJ) return;
    var s = newSubject(); markEdited(); renderExams();
    var inp = $('.subj[data-sid="' + s.id + '"] .in-sname');
    if (inp) { inp.focus(); inp.scrollIntoView({ block: 'center' }); }
  });
  $('#in-name').addEventListener('input', function () { st.name = this.value; save(); renderPrint(); });
  $('#in-class').addEventListener('input', function () { st.cls = this.value; save(); renderPrint(); });
  function makePlanClick() {
    if (!st.subjects.some(function (s) { return validDate(s.exam); })) { EDU.toast(t('need_exam')); return; }
    remake('plan_ready');
    setTab('plan');
    window.scrollTo(0, 0);
  }
  $('#make-plan').addEventListener('click', makePlanClick);
  $('#make-plan-2').addEventListener('click', makePlanClick);
  function startEmpty() {
    if (!st.sample && !confirm(t('confirm_empty'))) return;
    var old = st;
    st = fresh();
    ['view', 'start', 'hours', 'leaveFrom', 'leaveHours', 'pomo', 'light', 'rest', 'prac', 'name', 'cls', 'seq'].forEach(function (k) { st[k] = old[k]; });
    st.sample = false; st.hideNote = true; st.subjects = [];
    newSubject();
    st.plan = null; st.tab = 'exams';
    save(); renderAll();
    var inp = $('.in-sname'); if (inp) inp.focus();
  }
  $('#start-empty').addEventListener('click', startEmpty);
  $('#start-empty-2').addEventListener('click', startEmpty);
  $('#reset-all').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    st = fresh(); generate(); renderAll(); EDU.toast(t('reset_done'));
  });

  /* ------------------------------------------------------------ STUDY TIME tab */
  function renderTime() {
    $('#in-start').value = st.start;
    $('#in-leave').value = st.leaveFrom || '';
    $('#in-leave-h').value = String(st.leaveHours);
    var g = $('#hours-grid'), names2 = dayNames('days');
    g.innerHTML = '';
    st.hours.forEach(function (h, i) {
      var inp = el('input', { type: 'number', min: '0', max: '16', step: '0.5', inputmode: 'decimal', id: 'hours-' + i, class: 'in-hours' });
      inp.value = String(h);
      var hint = el('span', { class: 'hint', id: 'hours-hint-' + i });
      inp.addEventListener('input', function () {
        st.hours[i] = num(inp.value, 0, 16, 0); markEdited(); hintFor(i, hint); renderCap();
      });
      inp.addEventListener('change', function () { inp.value = String(st.hours[i]); });   // show the value used (0–16)
      hintFor(i, hint);
      g.appendChild(el('label', { class: 'field', for: 'hours-' + i }, el('span', { class: 'lbl', style: { color: 'var(--text)', fontWeight: '600' }, text: names2[i] }), inp, hint));
    });
    $('#pomo-25').setAttribute('aria-pressed', st.pomo === 25 ? 'true' : 'false');
    $('#pomo-50').setAttribute('aria-pressed', st.pomo === 50 ? 'true' : 'false');
    $('#opt-light').checked = st.light;
    $('#opt-rest').checked = st.rest;
    $('#opt-prac').checked = st.prac;
    renderCap();
  }
  function hintFor(i, hint) {
    var n = Math.floor(st.hours[i] * 60 / (work() + brk()) + 1e-9);
    hint.textContent = t('n_sessions', { n: EDU.fmt(n), m: EDU.fmt(work()) });
  }
  function renderCap() {
    var box = $('#cap-box');
    if (!box) return;
    box.innerHTML = '';
    var from = planStart(), active = sortedActive(from);
    if (!active.length) { box.className = 'callout'; box.appendChild(el('p', { class: 'mb0', text: t('need_exam') })); return; }
    var B = buildDays(from, active, null), have = 0, need = 0, W = work(), r2 = {};
    active.forEach(function (s) { r2[s.id] = rev2N(s); });
    /* a light day only holds the final revision of the next paper, so only that part of it counts */
    B.days.forEach(function (D) { have += D.kind === 'light' ? Math.min(D.cap, D.light.reduce(function (a, id) { return a + r2[id]; }, 0)) : D.cap; });
    active.forEach(function (s) {
      need += rev2N(s) + (st.prac ? pracN() : 0);
      s.ch.forEach(function (c) { need += learnN(c) + rev1N(c); });
    });
    var ok = need <= have, ratio = have ? Math.min(100, Math.round(need / have * 100)) : 100;
    box.className = 'callout ' + (ok ? 'success' : 'danger');
    box.appendChild(el('p', { class: 'mb0', id: 'cap-line', text: t('cap_line', { start: dShort(from), have: dur(have * W), need: dur(need * W) }) }));
    box.appendChild(el('div', { class: 'progress', style: { '--sc': ok ? 'var(--success)' : 'var(--danger)' }, 'aria-hidden': 'true' }, el('span', { style: { width: ratio + '%' } })));
    box.appendChild(el('p', { class: 'mb0 small', id: 'cap-verdict', text: ok ? t('cap_ok') : t('cap_short') }));
  }
  /* a half-typed date (e.g. year 0002 while typing 2026) is ignored; an invalid date is put back only when the field is left */
  $('#in-start').addEventListener('change', function () {
    if (validDate(this.value) && this.value !== st.start) { st.start = this.value; markEdited(); renderCap(); renderExams(); }
  });
  $('#in-start').addEventListener('blur', function () { if (!validDate(this.value)) this.value = st.start; });
  $('#in-leave').addEventListener('change', function () { st.leaveFrom = validDate(this.value) ? this.value : ''; markEdited(); renderCap(); });
  $('#in-leave-h').addEventListener('input', function () { st.leaveHours = num(this.value, 0, 16, 0); markEdited(); renderCap(); });
  $('#in-leave-h').addEventListener('change', function () { this.value = String(st.leaveHours); });   // show the value used (0–16)
  ['25', '50'].forEach(function (v) {
    $('#pomo-' + v).addEventListener('click', function () {
      st.pomo = +v; markEdited(); renderTime(); renderExams();
    });
  });
  [['light', '#opt-light'], ['rest', '#opt-rest'], ['prac', '#opt-prac']].forEach(function (p) {
    $(p[1]).addEventListener('change', function () { st[p[0]] = this.checked; markEdited(); renderCap(); });
  });

  /* ------------------------------------------------------------ TIPS tab */
  var TIPS = [['😴', 'tip_sleep'], ['💧', 'tip_water'], ['⏱️', 'tip_breaks'], ['📵', 'tip_phone'], ['🍎', 'tip_food'], ['🚶', 'tip_move'], ['🧠', 'tip_test'], ['🎒', 'tip_bag'], ['💬', 'tip_talk']];
  function renderTips() {
    var box = $('#tips');
    box.innerHTML = '';
    TIPS.forEach(function (p) { box.appendChild(el('div', { class: 'card tip' }, el('span', { class: 'em', 'aria-hidden': 'true', text: p[0] }), el('p', { text: t(p[1]) }))); });
  }

  /* ------------------------------------------------------------ note + all */
  function renderNote() { $('#sample-note').hidden = !(st.sample && !st.hideNote); }
  $('#hide-note').addEventListener('click', function () { st.hideNote = true; save(); renderNote(); });

  function renderAll() {
    renderNote();
    renderExams();
    renderTime();
    renderTips();
    renderPlan();
    setTab(st.tab, true);
  }

  /* an untouched sample whose exams are all over is moved forward again, so the demo always shows a live plan */
  var staleSample = st.sample && !st.subjects.some(function (s) { return validDate(s.exam) && s.exam >= today(); });
  if (staleSample) { var keep = { view: st.view, hideNote: st.hideNote, tab: st.tab }; st = fresh(); st.view = keep.view; st.hideNote = keep.hideNote; st.tab = keep.tab; }
  if (firstRun || staleSample || (!st.plan && st.sample)) generate();
  EDU.onLang(renderAll);
  renderAll();
})();
