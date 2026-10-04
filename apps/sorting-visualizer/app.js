/* Sorting Algorithms Visualizer — AI Pathshala Apps.
   Each algorithm is a generator that sorts a real array and yields one event per
   operation (compare / swap / write / mark).  record() runs it once and stores a
   snapshot per event, so Play, Step, Step back and the scrubber are all instant. */
(function () {
  'use strict';
  var SLUG = 'sorting-visualizer';
  var store = EDU.store(SLUG);
  var ALGOS = ['bubble', 'selection', 'insertion', 'merge', 'quick'];
  var MIN_N = 5, MAX_N = 60, CUSTOM_MIN = 2, FRAME_LIMIT = 40000;

  var INFO = {
    bubble:    { best: 'O(n)',       avg: 'O(n²)',      worst: 'O(n²)',      space: 'O(1)',     stable: true },
    selection: { best: 'O(n²)',      avg: 'O(n²)',      worst: 'O(n²)',      space: 'O(1)',     stable: false },
    insertion: { best: 'O(n)',       avg: 'O(n²)',      worst: 'O(n²)',      space: 'O(1)',     stable: true },
    merge:     { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)',     stable: true },
    quick:     { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)',      space: 'O(log n)', stable: false }
  };

  /* Python-style code shown in the panel (line numbers below match these arrays, 1-based). */
  var CODE = {
    bubble: [
      'def bubble_sort(a):',
      '    n = len(a)',
      '    for i in range(n - 1):',
      '        swapped = False',
      '        for j in range(n - 1 - i):',
      '            if a[j] > a[j+1]:',
      '                a[j], a[j+1] = a[j+1], a[j]',
      '                swapped = True',
      '        if not swapped:',
      '            break'
    ],
    selection: [
      'def selection_sort(a):',
      '    n = len(a)',
      '    for i in range(n - 1):',
      '        m = i',
      '        for j in range(i + 1, n):',
      '            if a[j] < a[m]:',
      '                m = j',
      '        if m != i:',
      '            a[i], a[m] = a[m], a[i]'
    ],
    insertion: [
      'def insertion_sort(a):',
      '    for i in range(1, len(a)):',
      '        key = a[i]',
      '        j = i - 1',
      '        while j >= 0 and a[j] > key:',
      '            a[j+1] = a[j]',
      '            j -= 1',
      '        a[j+1] = key'
    ],
    merge: [
      'def merge_sort(a, lo, hi):',
      '    if lo >= hi:',
      '        return',
      '    mid = (lo + hi) // 2',
      '    merge_sort(a, lo, mid)',
      '    merge_sort(a, mid + 1, hi)',
      '    merge(a, lo, mid, hi)',
      '',
      'def merge(a, lo, mid, hi):',
      '    left = a[lo:mid+1]',
      '    right = a[mid+1:hi+1]',
      '    i, j, k = 0, 0, lo',
      '    while i < len(left) and j < len(right):',
      '        if left[i] <= right[j]:',
      '            a[k] = left[i]; i += 1',
      '        else:',
      '            a[k] = right[j]; j += 1',
      '        k += 1',
      '    a[k:hi+1] = left[i:] + right[j:]'
    ],
    quick: [
      'def quick_sort(a, lo, hi):',
      '    if lo < hi:',
      '        p = partition(a, lo, hi)',
      '        quick_sort(a, lo, p - 1)',
      '        quick_sort(a, p + 1, hi)',
      '',
      'def partition(a, lo, hi):',
      '    pivot = a[hi]',
      '    i = lo - 1',
      '    for j in range(lo, hi):',
      '        if a[j] <= pivot:',
      '            i += 1',
      '            a[i], a[j] = a[j], a[i]',
      '    a[i+1], a[hi] = a[hi], a[i+1]',
      '    return i + 1'
    ]
  };

  /* ------------------------------------------------------------------ algorithms
     Event fields: line (code line or [lines]), msg (string key), mv (message vars),
     vv (variables panel), cmp [idx], swp [i, j], wr idx, piv idx, mk idx (smallest so far),
     range [lo, hi], mid, hole idx (insertion slot), aux (held-aside values),
     ptr {name: idx}, dc / ds / dw = +comparisons / +swaps / +array writes.
     S.done[i]: 0 = not sorted, 1 = sorted part (not final), 2 = final place. */
  function* gBubble(a, S) {
    var n = a.length;
    for (var i = 0; i < n - 1; i++) {
      var swapped = false, last = n - 1 - i;
      yield { line: 3, msg: 'bub_pass', mv: { p: i + 1 }, vv: { n: n, i: i }, range: [0, last] };
      for (var j = 0; j < last; j++) {
        var big = a[j] > a[j + 1];
        var vv = { i: i, j: j, swapped: swapped };
        yield { line: 6, msg: big ? 'bub_cmp_yes' : 'bub_cmp_no', mv: { x: a[j], y: a[j + 1] }, vv: vv, cmp: [j, j + 1], range: [0, last], ptr: { j: j }, dc: 1 };
        if (big) {
          var x = a[j], y = a[j + 1];
          a[j] = y; a[j + 1] = x; swapped = true;
          yield { line: 7, msg: 'm_swap', mv: { x: x, y: y }, vv: { i: i, j: j, swapped: true }, swp: [j, j + 1], range: [0, last], ptr: { j: j }, ds: 1, dw: 2 };
        }
      }
      if (!swapped) {
        for (var q = 0; q < n; q++) S.done[q] = 2;
        yield { line: [9, 10], msg: 'bub_early', vv: { i: i, swapped: false } };
        return;
      }
      S.done[last] = 2;
      yield { line: 9, msg: 'bub_place', mv: { x: a[last], k: last }, vv: { i: i, swapped: swapped } };
    }
  }

  function* gSelection(a, S) {
    var n = a.length;
    for (var i = 0; i < n - 1; i++) {
      var m = i, range = [i, n - 1];
      yield { line: 4, msg: 'sel_pass', mv: { p: i + 1, i: i }, vv: { i: i, m: m }, mk: m, range: range, ptr: { i: i, m: m } };
      for (var j = i + 1; j < n; j++) {
        var less = a[j] < a[m];
        yield { line: 6, msg: less ? 'sel_cmp_yes' : 'sel_cmp_no', mv: { x: a[j], y: a[m] }, vv: { i: i, j: j, m: m }, cmp: [j], mk: m, range: range, ptr: { i: i, j: j, m: m }, dc: 1 };
        if (less) {
          m = j;
          yield { line: 7, msg: 'sel_newmin', mv: { x: a[m], j: j }, vv: { i: i, j: j, m: m }, mk: m, range: range, ptr: { i: i, j: j, m: m } };
        }
      }
      if (m !== i) {
        var t = a[i]; a[i] = a[m]; a[m] = t;
        S.done[i] = 2;
        yield { line: 9, msg: 'sel_swap', mv: { x: a[i], i: i }, vv: { i: i, m: m }, swp: [i, m], ptr: { i: i, m: m }, ds: 1, dw: 2 };
      } else {
        S.done[i] = 2;
        yield { line: 8, msg: 'sel_noswap', mv: { x: a[i], i: i }, vv: { i: i, m: m }, ptr: { i: i, m: m } };
      }
    }
  }

  function* gInsertion(a, S) {
    var n = a.length;
    S.done[0] = 1;
    for (var i = 1; i < n; i++) {
      var key = a[i];
      yield { line: 3, msg: 'ins_pick', mv: { x: key, i: i }, vv: { i: i, key: key }, hole: i, aux: { kind: 'key', val: key, at: i }, ptr: { i: i } };
      var j = i - 1;
      while (j >= 0) {
        var big = a[j] > key;
        yield { line: 5, msg: big ? 'ins_cmp_yes' : 'ins_cmp_no', mv: { x: key, y: a[j] }, vv: { i: i, key: key, j: j }, cmp: [j], hole: j + 1, aux: { kind: 'key', val: key, at: j + 1 }, ptr: { i: i, j: j }, dc: 1 };
        if (!big) break;
        a[j + 1] = a[j];
        yield { line: 6, msg: 'ins_shift', mv: { y: a[j], j: j, k: j + 1 }, vv: { i: i, key: key, j: j }, wr: j + 1, hole: j, aux: { kind: 'key', val: key, at: j }, ptr: { i: i, j: j }, dw: 1 };
        j--;
      }
      a[j + 1] = key;
      for (var q = 0; q <= i; q++) if (S.done[q] < 1) S.done[q] = 1;
      yield { line: 8, msg: 'ins_place', mv: { x: key, k: j + 1 }, vv: { i: i, key: key, j: j }, wr: j + 1, ptr: { i: i, j: j }, dw: 1 };
    }
  }

  function* gMerge(a, S) {
    var n = a.length;
    function* sort(lo, hi) {
      if (lo >= hi) {
        if (lo === hi) {
          if (S.done[lo] < 1) S.done[lo] = 1;
          yield { line: [2, 3], msg: 'mrg_base', mv: { lo: lo }, vv: { lo: lo, hi: hi }, range: [lo, hi], ptr: { lo: lo } };
        }
        return;
      }
      var mid = (lo + hi) >> 1;
      yield { line: 4, msg: 'mrg_split', mv: { lo: lo, hi: hi, mid: mid }, vv: { lo: lo, hi: hi, mid: mid }, range: [lo, hi], mid: mid, ptr: { lo: lo, mid: mid, hi: hi } };
      yield* sort(lo, mid);
      yield* sort(mid + 1, hi);
      yield* merge(lo, mid, hi);
    }
    function* merge(lo, mid, hi) {
      var left = a.slice(lo, mid + 1), right = a.slice(mid + 1, hi + 1);
      var i = 0, j = 0, k = lo, fin = (lo === 0 && hi === n - 1), range = [lo, hi];
      function aux(cmp) { return { kind: 'merge', lo: lo, mid: mid, left: left, right: right, i: i, j: j, cmp: !!cmp }; }
      function vv() { return { lo: lo, mid: mid, hi: hi, i: i, j: j, k: k, left: left, right: right }; }
      yield { line: [10, 11, 12], msg: 'mrg_copy', mv: { lo: lo, mid: mid, m1: mid + 1, hi: hi }, vv: vv(), range: range, mid: mid, aux: aux(), ptr: { lo: lo, mid: mid, hi: hi } };
      while (i < left.length && j < right.length) {
        var takeLeft = left[i] <= right[j];
        yield { line: 14, msg: takeLeft ? 'mrg_cmp_left' : 'mrg_cmp_right', mv: { x: left[i], y: right[j] }, vv: vv(), range: range, mid: mid, aux: aux(true), ptr: { k: k }, dc: 1 };
        var line;
        if (takeLeft) { a[k] = left[i]; i++; line = 15; } else { a[k] = right[j]; j++; line = 17; }
        if (fin) S.done[k] = 2;
        yield { line: line, msg: 'mrg_write', mv: { x: a[k], k: k }, vv: vv(), range: range, mid: mid, aux: aux(), wr: k, ptr: { k: k }, dw: 1 };
        k++;
      }
      while (i < left.length || j < right.length) {
        a[k] = i < left.length ? left[i++] : right[j++];
        if (fin) S.done[k] = 2;
        yield { line: 19, msg: 'mrg_rest', mv: { x: a[k], k: k }, vv: vv(), range: range, mid: mid, aux: aux(), wr: k, ptr: { k: k }, dw: 1 };
        k++;
      }
      for (var q = lo; q <= hi; q++) if (S.done[q] < 1) S.done[q] = 1;
      yield { line: 7, msg: 'mrg_merged', mv: { lo: lo, hi: hi }, vv: { lo: lo, mid: mid, hi: hi }, range: range };
    }
    yield* sort(0, n - 1);
  }

  function* gQuick(a, S) {
    var n = a.length;
    function* sort(lo, hi) {
      if (lo < hi) {
        var p = yield* partition(lo, hi);
        yield* sort(lo, p - 1);
        yield* sort(p + 1, hi);
      } else if (lo === hi) {
        S.done[lo] = 2;
        yield { line: 2, msg: 'qk_base', mv: { lo: lo }, vv: { lo: lo, hi: hi }, range: [lo, hi], ptr: { lo: lo } };
      }
    }
    function* partition(lo, hi) {
      var pivot = a[hi], i = lo - 1, range = [lo, hi];
      yield { line: [8, 9], msg: 'qk_part', mv: { lo: lo, hi: hi, p: pivot }, vv: { lo: lo, hi: hi, pivot: pivot, i: i }, piv: hi, range: range, ptr: { lo: lo, hi: hi } };
      for (var j = lo; j < hi; j++) {
        var small = a[j] <= pivot;
        yield { line: 11, msg: small ? 'qk_cmp_yes' : 'qk_cmp_no', mv: { x: a[j], p: pivot }, vv: { lo: lo, hi: hi, pivot: pivot, i: i, j: j }, cmp: [j], piv: hi, range: range, ptr: { i: i, j: j }, dc: 1 };
        if (small) {
          i++;
          var t = a[i]; a[i] = a[j]; a[j] = t;
          if (i !== j) yield { line: [12, 13], msg: 'qk_swap', mv: { i: i, j: j, x: a[i] }, vv: { lo: lo, hi: hi, pivot: pivot, i: i, j: j }, swp: [i, j], piv: hi, range: range, ptr: { i: i, j: j }, ds: 1, dw: 2 };
          else yield { line: [12, 13], msg: 'qk_swap_self', mv: { x: a[i], i: i }, vv: { lo: lo, hi: hi, pivot: pivot, i: i, j: j }, swp: [i], piv: hi, range: range, ptr: { i: i, j: j }, ds: 1, dw: 2 };
        }
      }
      var k = i + 1, t2 = a[k]; a[k] = a[hi]; a[hi] = t2;
      S.done[k] = 2;
      yield { line: [14, 15], msg: 'qk_pivot', mv: { p: pivot, k: k }, vv: { lo: lo, hi: hi, pivot: pivot, i: i }, swp: k === hi ? [k] : [k, hi], range: range, ptr: { lo: lo, hi: hi }, ds: 1, dw: 2 };
      return k;
    }
    yield* sort(0, n - 1);
  }

  var GENS = { bubble: gBubble, selection: gSelection, insertion: gInsertion, merge: gMerge, quick: gQuick };

  /* Run one algorithm on a copy of `input`. countOnly = just the totals (for the table). */
  function record(algo, input, countOnly) {
    var a = input.slice(), n = a.length, S = { done: [] };
    for (var q = 0; q < n; q++) S.done.push(0);
    var frames = [], C = 0, SW = 0, W = 0, steps = 0;
    function snap(e) {
      e.a = a.slice(); e.d = S.done.slice(); e.C = C; e.SW = SW; e.W = W;
      frames.push(e);
    }
    if (!countOnly) snap({ line: 0, msg: 'm_ready', vv: {} });
    var it = GENS[algo](a, S), r;
    while (!(r = it.next()).done) {
      var e = r.value;
      C += e.dc || 0; SW += e.ds || 0; W += e.dw || 0; steps++;
      if (!countOnly) snap(e);
      if (steps > FRAME_LIMIT) break;
    }
    for (q = 0; q < n; q++) S.done[q] = 2;
    steps++;
    if (!countOnly) snap({ line: 0, msg: 'm_done', mv: { c: C, w: W, s: steps }, vv: {}, kind: 'done' });
    return { frames: frames, C: C, SW: SW, W: W, steps: steps, sorted: a };
  }

  /* ------------------------------------------------------------------ data */
  function makeData(kind, n) {
    var v, i;
    if (kind === 'few') {
      var vals = [15, 40, 65, 90];
      v = [];
      for (i = 0; i < n; i++) v.push(vals[i % 4]);       /* every value appears, then shuffle */
      return EDU.shuffle(v);
    }
    var pool = [];
    for (i = 5; i <= 99; i++) pool.push(i);
    v = EDU.shuffle(pool).slice(0, n);                      /* distinct values 5..99 */
    if (kind === 'random') return v;
    v.sort(function (x, y) { return x - y; });
    if (kind === 'reversed') return v.reverse();
    var swaps = Math.max(1, Math.round(n / 8));             /* nearly sorted: a few short swaps */
    for (var s = 0; s < swaps; s++) {
      var p = EDU.randInt(0, n - 2), q = Math.min(n - 1, p + EDU.randInt(1, 2)), t = v[p];
      v[p] = v[q]; v[q] = t;
    }
    return v;
  }

  /* Accept digits typed on Indian-language keyboards too (०१२, ১২, ௧௨, ۱۲ ...). */
  var DIGIT_ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function latinDigits(s) {
    return s.replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (ch) {
      var c = ch.charCodeAt(0);
      for (var k = 0; k < DIGIT_ZEROS.length; k++) if (c >= DIGIT_ZEROS[k] && c <= DIGIT_ZEROS[k] + 9) return String(c - DIGIT_ZEROS[k]);
      return ch;
    });
  }
  function parseNums(text) {
    var toks = latinDigits(String(text || '')).replace(/٫/g, '.').split(/[\s,;،|]+/).filter(Boolean);
    var nums = [], bad = [];
    toks.forEach(function (tk) {
      var v = Number(tk);
      if (/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(tk) && isFinite(v) && Math.abs(v) < 1e15) nums.push(v); else bad.push(tk);
    });
    return { nums: nums, bad: bad };
  }

  function validArr(v) {
    if (!Array.isArray(v) || v.length < CUSTOM_MIN || v.length > MAX_N) return null;
    for (var i = 0; i < v.length; i++) if (typeof v[i] !== 'number' || !isFinite(v[i])) return null;
    return v.slice();
  }
  function pickAlgo(v, d) { return ALGOS.indexOf(v) >= 0 ? v : d; }

  /* ------------------------------------------------------------------ state */
  var PRESETS = ['random', 'nearly', 'reversed', 'few', 'custom'];
  var st = {
    algoA: pickAlgo(store.get('algoA', 'bubble'), 'bubble'),
    algoB: pickAlgo(store.get('algoB', 'insertion'), 'insertion'),
    compare: store.get('compare', false) === true,
    size: EDU.clamp(parseInt(store.get('size', 16), 10) || 16, MIN_N, MAX_N),
    speed: EDU.clamp(parseInt(store.get('speed', 5), 10) || 5, 1, 10),
    preset: store.get('preset', 'random'),
    arr: validArr(store.get('arr', null))
  };
  if (PRESETS.indexOf(st.preset) < 0) st.preset = 'random';
  if (!st.arr) { if (st.preset === 'custom') st.preset = 'random'; st.arr = makeData(st.preset, st.size); }
  function save() {
    store.set('algoA', st.algoA); store.set('algoB', st.algoB); store.set('compare', st.compare);
    store.set('size', st.size); store.set('speed', st.speed); store.set('preset', st.preset); store.set('arr', st.arr);
  }

  /* speed 1..10 → [delay ms, steps per tick] */
  var SPEEDS = [[1400, 1], [1000, 1], [700, 1], [480, 1], [320, 1], [200, 1], [120, 1], [60, 1], [30, 2], [16, 5]];
  var pos = 0, playing = false, timer = null, counts = {}, customNote = null;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  /* ------------------------------------------------------------------ build UI */
  function algoChips(box, which) {
    ALGOS.forEach(function (al) {
      box.appendChild(EDU.el('button', {
        type: 'button', class: 'chip' + (which === 'b' ? ' b' : ''), 'data-algo': al, 'aria-pressed': 'false',
        'data-i18n': 'algo_' + al, text: EDU.t('algo_' + al), onclick: function () { setAlgo(which, al); }
      }));
    });
  }
  algoChips(EDU.$('#algo-a'), 'a');
  algoChips(EDU.$('#algo-b'), 'b');

  function mkLane(key) {
    function stat(id, lblKey) {
      var num = EDU.el('span', { class: 'num num-font', id: id + '-' + key, 'data-value': '0', text: '0' });
      return { box: EDU.el('div', { class: 'stat' }, EDU.el('span', { class: 'lbl', 'data-i18n': lblKey, text: EDU.t(lblKey) }), num), num: num };
    }
    var title = EDU.el('h2', { class: 'sv-lane-title', id: 'name-' + key });
    var badge = EDU.el('span', { class: 'badge success', id: 'done-' + key, hidden: true });
    var sc = stat('comps', 'st_comps'), ss = stat('swaps', 'st_swaps'), sw = stat('writes', 'st_writes');
    var cv = EDU.el('canvas', { class: 'sv-cv', id: 'cv-' + key, role: 'img' });
    var msg = EDU.el('p', { class: 'sv-msg callout', id: 'msg-' + key, 'aria-live': 'polite' });
    var root = EDU.el('div', { class: 'sv-lane', id: 'lane-' + key },
      EDU.el('div', { class: 'sv-lane-head' }, title, badge, EDU.el('div', { class: 'sv-stats' }, sc.box, ss.box, sw.box)), msg, cv);
    EDU.$('#lanes').appendChild(root);
    return { key: key, root: root, title: title, badge: badge, comps: sc.num, swaps: ss.num, writes: sw.num, cv: cv, msg: msg, algo: null, frames: [] };
  }
  var lanes = [mkLane('a'), mkLane('b')];

  /* ------------------------------------------------------------------ helpers */
  /* Up to 6 decimals, so typed numbers like 0.003 and 0.001 never both show as "0". */
  function nf(v) { return EDU.fmt(v, { maximumFractionDigits: 6 }); }
  function pyNum(v) { return String(Math.round(v * 1e6) / 1e6); }
  /* In Urdu (RTL) every number is wrapped in a left-to-right isolate. Without it, the invisible
     LRM that Intl puts before a minus sign glues "-5، 3" into one LTR run, so the sentence reads
     "3 ... -5" from the right and the comparison means the opposite. */
  function fmtVars(mv) {
    var o = {}, rtl = document.documentElement.dir === 'rtl';
    Object.keys(mv || {}).forEach(function (k) {
      o[k] = typeof mv[k] === 'number' ? (rtl ? '⁦' + nf(mv[k]) + '⁩' : nf(mv[k])) : mv[k];
    });
    return o;
  }
  function totalSteps() {
    var m = 0;
    lanes.forEach(function (L) { if (L.algo) m = Math.max(m, L.frames.length - 1); });
    return m;
  }
  function frameOf(L) { return L.frames[Math.min(pos, L.frames.length - 1)]; }
  function setNum(el, v) { el.textContent = EDU.fmt(v); el.setAttribute('data-value', String(v)); }

  function hiPy(line) {
    return EDU.esc(line).replace(/\b(def|for|in|if|else|while|and|not|return|break|True|False)\b|\b(range|len)\b|\b(\d+)\b/g, function (m, kw, bi, nu) {
      if (kw) return '<span class="kw">' + kw + '</span>';
      if (bi) return '<span class="bi">' + bi + '</span>';
      return '<span class="nu">' + nu + '</span>';
    });
  }
  function renderCode() {
    EDU.$('#code').innerHTML = CODE[st.algoA].map(function (ln, i) {
      return '<span class="ln" data-ln="' + (i + 1) + '"><span class="no">' + (i + 1) + '</span>' + hiPy(ln) + '</span>';
    }).join('');
  }
  /* a = the array in the current frame (sorted on the last frame, not the starting numbers) */
  function renderVars(vv, a) {
    var box = EDU.$('#vars');
    box.innerHTML = '';
    var keys = Object.keys(vv || {});
    a = a || st.arr;
    if (!keys.length) { box.appendChild(EDU.el('code', { class: 'empty', id: 'vars-a', text: 'a = [' + a.slice(0, 12).map(pyNum).join(', ') + (a.length > 12 ? ', …' : '') + ']' })); return; }
    keys.forEach(function (k) {
      var v = vv[k], s;
      if (typeof v === 'boolean') s = v ? 'True' : 'False';
      else if (Array.isArray(v)) s = '[' + v.slice(0, 10).map(pyNum).join(', ') + (v.length > 10 ? ', …' : '') + ']';
      else s = pyNum(v);
      box.appendChild(EDU.el('code', { text: k + ' = ' + s }));
    });
  }

  /* ------------------------------------------------------------------ drawing */
  var COL = {};
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    ['--sv-bar', '--sv-cmp', '--sv-swp', '--sv-ok', '--sv-part', '--sv-piv', '--sv-range', '--sv-temp', '--text', '--muted', '--border', '--accent']
      .forEach(function (k) { COL[k] = cs.getPropertyValue(k).trim() || '#888'; });
  }
  function barColor(f, i) {
    if ((f.swp && f.swp.indexOf(i) >= 0) || f.wr === i) return COL['--sv-swp'];
    if (f.piv === i || f.mk === i) return COL['--sv-piv'];
    if (f.cmp && f.cmp.indexOf(i) >= 0) return COL['--sv-cmp'];
    if (f.d[i] === 2) return COL['--sv-ok'];
    if (f.d[i] === 1) return COL['--sv-part'];
    return COL['--sv-bar'];
  }
  function barPath(ctx, x, y, w, h) {
    var r = Math.max(0, Math.min(4, w / 3, h / 2));
    ctx.beginPath();
    ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h);
    ctx.closePath();
  }

  function draw(L, f) {
    var cv = L.cv, rect = cv.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var W = rect.width, H = rect.height, dpr = Math.min(3, window.devicePixelRatio || 1);
    var pw = Math.round(W * dpr), ph = Math.round(H * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var a = f.a, n = a.length, hasAux = L.algo === 'merge' || L.algo === 'insertion';
    var padX = 8, slot = (W - 2 * padX) / n;
    var gap = slot >= 12 ? Math.min(8, slot * 0.16) : (slot >= 5 ? 1 : 0.5), bw = Math.max(1, slot - gap);
    var labels = slot >= 15, vals = labels;
    var font = '"Noto Sans", system-ui, "Segoe UI", sans-serif';
    var fs = Math.max(9, Math.min(17, slot * 0.62));
    if (labels) {                                                  /* shrink so the widest number fits its bar */
      ctx.font = '700 ' + fs + 'px ' + font;
      var widest = 0, src = L.frames.length ? L.frames[0].a : a;    /* every value ever shown (bars, key, copies) comes from the input */
      for (var w0 = 0; w0 < src.length; w0++) widest = Math.max(widest, ctx.measureText(nf(src[w0])).width);
      if (widest > slot - 2) {
        var fit = fs * (slot - 2) / widest;
        vals = fit >= 7;                                           /* very long numbers: no value labels instead of overlapping text */
        fs = Math.max(8, fit);
      }
    }
    var topPad = labels ? fs + 8 : 8, idxH = labels ? 15 : 0, ptrH = labels ? 29 : 8;
    var avail = H - topPad - idxH - ptrH - 4;
    var auxH = hasAux ? Math.round(avail * 0.27) : 0, auxPad = hasAux ? (labels ? fs + 10 : 10) : 0;
    var mainH = avail - auxH - auxPad, base = topPad + mainH;
    var vmin = Math.min(0, Math.min.apply(null, a)), vmax = Math.max.apply(null, a);
    if (vmax <= vmin) vmax = vmin + 1;
    function hOf(v, full) { return 3 + (v - vmin) / (vmax - vmin) * (full - 3); }
    function xOf(i) { return padX + i * slot + gap / 2; }
    ctx.textAlign = 'center';

    if (f.range) {                                                 /* part being worked on */
      ctx.fillStyle = COL['--sv-range'];
      ctx.fillRect(padX + f.range[0] * slot, 2, (f.range[1] - f.range[0] + 1) * slot, base + idxH - 2);
    }
    if (typeof f.mid === 'number') {                               /* merge: where the halves meet */
      var mx = padX + (f.mid + 1) * slot;
      ctx.strokeStyle = COL['--muted']; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(mx, 4); ctx.lineTo(mx, base); ctx.stroke(); ctx.setLineDash([]);
    }
    for (var i = 0; i < n; i++) {
      var x = xOf(i), h = hOf(a[i], mainH), y = base - h, hollow = f.hole === i && f.wr !== i;
      if (hollow) {
        ctx.setLineDash([4, 3]); ctx.strokeStyle = COL['--sv-temp']; ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, Math.max(1, bw - 2), Math.max(1, h - 2)); ctx.setLineDash([]);
      } else {
        ctx.fillStyle = barColor(f, i); barPath(ctx, x, y, bw, h); ctx.fill();
      }
      if (labels) {
        ctx.font = '700 ' + fs + 'px ' + font; ctx.fillStyle = hollow ? COL['--muted'] : COL['--text'];
        if (vals) ctx.fillText(nf(a[i]), x + bw / 2, y - 5);
        ctx.font = '400 ' + Math.min(12, fs) + 'px ' + font; ctx.fillStyle = COL['--muted'];
        ctx.fillText(String(i), x + bw / 2, base + 12);
      }
    }
    if (f.ptr) {                                                   /* i, j, k ... under the bars */
      var at = {};
      Object.keys(f.ptr).forEach(function (k) { var p = f.ptr[k]; if (p >= 0 && p < n) (at[p] = at[p] || []).push(k); });
      ctx.fillStyle = COL['--accent'];
      Object.keys(at).forEach(function (p) {
        var cx = xOf(+p) + bw / 2;
        if (labels) {                                              /* one name per line so neighbours never overlap */
          ctx.font = '700 ' + Math.min(13, Math.max(10, slot * 0.6)) + 'px ui-monospace, Consolas, monospace';
          at[p].forEach(function (name, r) { ctx.fillText(name, cx, base + idxH + 12 + r * 13); });
        }
        else { ctx.beginPath(); ctx.moveTo(cx, base + 2); ctx.lineTo(cx - 3, base + 7); ctx.lineTo(cx + 3, base + 7); ctx.closePath(); ctx.fill(); }
      });
    }
    if (hasAux) {                                                  /* values held aside: key / left + right copies */
      var aTop = base + idxH + ptrH + 2, aBase = H - 4;
      ctx.globalAlpha = 0.45; ctx.fillStyle = COL['--border']; ctx.fillRect(padX, aTop, W - 2 * padX, aBase - aTop); ctx.globalAlpha = 1;
      var auxBar = function (idx, v, color, alpha) {
        var x2 = xOf(idx), h2 = hOf(v, auxH), y2 = aBase - h2;
        ctx.globalAlpha = alpha; ctx.fillStyle = color; barPath(ctx, x2, y2, bw, h2); ctx.fill();
        if (vals) { ctx.font = '700 ' + fs + 'px ' + font; ctx.fillStyle = COL['--text']; ctx.fillText(nf(v), x2 + bw / 2, y2 - 4); }
        ctx.globalAlpha = 1;
      };
      var X = f.aux;
      if (X && X.kind === 'key') auxBar(X.at, X.val, COL['--sv-temp'], 1);
      if (X && X.kind === 'merge') {
        X.left.forEach(function (v, q) { auxBar(X.lo + q, v, q === X.i && X.cmp ? COL['--sv-cmp'] : COL['--sv-temp'], q < X.i ? 0.2 : 1); });
        X.right.forEach(function (v, q) { auxBar(X.mid + 1 + q, v, q === X.j && X.cmp ? COL['--sv-cmp'] : COL['--sv-temp'], q < X.j ? 0.2 : 1); });
        var dx = padX + (X.mid + 1) * slot;
        ctx.strokeStyle = COL['--muted']; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(dx, aTop + 2); ctx.lineTo(dx, aBase); ctx.stroke(); ctx.setLineDash([]);
      }
    }
  }
  function drawAll() { lanes.forEach(function (L) { if (L.algo && L.frames.length) draw(L, frameOf(L)); }); }

  /* ------------------------------------------------------------------ render */
  function update() {
    var total = totalSteps();
    if (pos > total) pos = total;
    lanes.forEach(function (L) {
      if (!L.algo) return;
      var f = frameOf(L);
      setNum(L.comps, f.C); setNum(L.swaps, f.SW); setNum(L.writes, f.W);
      L.msg.textContent = EDU.t(f.msg, fmtVars(f.mv));
      L.msg.setAttribute('data-kind', f.kind || '');
      L.badge.hidden = !(pos > 0 && pos >= L.frames.length - 1);
      draw(L, f);
    });
    var fa = frameOf(lanes[0]), on = Array.isArray(fa.line) ? fa.line : [fa.line];
    EDU.$$('#code .ln').forEach(function (el) { el.classList.toggle('on', on.indexOf(+el.getAttribute('data-ln')) >= 0); });
    renderVars(fa.vv, fa.a);
    var scrub = EDU.$('#scrub');
    scrub.max = String(Math.max(1, total)); scrub.value = String(pos);
    EDU.$('#st-step').textContent = EDU.fmt(pos) + ' / ' + EDU.fmt(total);
    EDU.$('#back').disabled = pos <= 0;
    EDU.$('#step').disabled = pos >= total;
    renderRace(total);
  }

  function renderRace(total) {
    var box = EDU.$('#race');
    if (!st.compare || pos < total || total === 0) { box.hidden = true; return; }
    var A = lanes[0].frames[lanes[0].frames.length - 1], B = lanes[1].frames[lanes[1].frames.length - 1];
    var nA = EDU.t('algo_' + lanes[0].algo), nB = EDU.t('algo_' + lanes[1].algo);
    var txt = A.C === B.C ? EDU.t('race_tie', { x: EDU.fmt(A.C) })
      : EDU.t('race_win', A.C < B.C ? { name: nA, x: EDU.fmt(A.C), y: EDU.fmt(B.C) } : { name: nB, x: EDU.fmt(B.C), y: EDU.fmt(A.C) });
    /* The lanes move one step per tick, so the lane with fewer steps shows "Done!" first. When that is
       not the comparison winner (e.g. quick vs merge), say why, so the class is not confused. */
    var sA = lanes[0].frames.length - 1, sB = lanes[1].frames.length - 1;
    var firstA = sA < sB, winA = A.C < B.C;
    if (sA !== sB && (A.C === B.C || firstA !== winA)) {
      txt += ' ' + EDU.t('race_note', firstA ? { name: nA, a: EDU.fmt(sA), b: EDU.fmt(sB) } : { name: nB, a: EDU.fmt(sB), b: EDU.fmt(sA) });
    }
    box.textContent = txt;
    box.hidden = false;
  }

  function renderPlay() {
    var b = EDU.$('#play');
    b.setAttribute('aria-pressed', playing ? 'true' : 'false');
    EDU.$('#play-ico').textContent = playing ? '⏸' : '▶';
    EDU.$('#play-txt').textContent = EDU.t(playing ? 'pause' : 'play');
  }

  function renderTables() {
    var best = Infinity;
    ALGOS.forEach(function (al) { best = Math.min(best, counts[al].C); });
    var tb = EDU.$('#count-table tbody');
    tb.innerHTML = '';
    ALGOS.forEach(function (al) {
      var r = counts[al];
      tb.appendChild(EDU.el('tr', { class: al === st.algoA ? 'cur' : '', 'data-algo': al },
        EDU.el('td', null, EDU.el('button', { type: 'button', class: 'pick', 'data-algo': al, text: EDU.t('algo_' + al), onclick: function () { setAlgo('a', al); EDU.$('#stage').scrollIntoView({ behavior: 'smooth', block: 'start' }); } }),
          r.C === best ? EDU.el('span', { class: 'star', 'aria-hidden': 'true', text: ' ★' }) : null),
        EDU.el('td', { class: 'n c-comps', 'data-value': String(r.C), text: EDU.fmt(r.C) }),
        EDU.el('td', { class: 'n c-swaps', 'data-value': String(r.SW), text: EDU.fmt(r.SW) }),
        EDU.el('td', { class: 'n c-writes', 'data-value': String(r.W), text: EDU.fmt(r.W) }),
        EDU.el('td', { class: 'n c-steps', 'data-value': String(r.steps), text: EDU.fmt(r.steps) })));
    });
    EDU.$('#table-note').textContent = EDU.t('table_note', { n: EDU.fmt(st.arr.length) });
    var ct = EDU.$('#cheat-table tbody');
    ct.innerHTML = '';
    ALGOS.forEach(function (al) {
      var I = INFO[al];
      ct.appendChild(EDU.el('tr', { class: al === st.algoA ? 'cur' : '' },
        EDU.el('th', { scope: 'row', text: EDU.t('algo_' + al) }),
        EDU.el('td', null, EDU.el('span', { class: 'cx no-i18n', text: I.best })),
        EDU.el('td', null, EDU.el('span', { class: 'cx no-i18n', text: I.avg })),
        EDU.el('td', null, EDU.el('span', { class: 'cx no-i18n', text: I.worst })),
        EDU.el('td', null, EDU.el('span', { class: 'cx no-i18n', text: I.space })),
        EDU.el('td', null, EDU.el('span', { class: I.stable ? 'yes' : 'no', text: EDU.t(I.stable ? 'yes' : 'no') }))));
    });
  }

  function renderAbout() {
    var al = st.algoA, I = INFO[al];
    EDU.$('#about-title').textContent = EDU.t('about_title', { name: EDU.t('algo_' + al) });
    EDU.$('#about-idea').textContent = EDU.t('idea_' + al);
    EDU.$('#about-life').textContent = EDU.t('life_' + al);
    EDU.$('#about-try').textContent = EDU.t('try_' + al);
    ['best', 'avg', 'worst', 'space'].forEach(function (k) { var e = EDU.$('#cx-' + k); e.textContent = I[k]; e.classList.add('no-i18n'); });
    var s = EDU.$('#cx-stable');
    s.innerHTML = '';
    s.appendChild(EDU.el('span', { class: I.stable ? 'yes' : 'no', text: EDU.t(I.stable ? 'yes' : 'no') }));
  }

  function renderStatic() {
    EDU.$$('#algo-a .chip').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-algo') === st.algoA ? 'true' : 'false'); });
    EDU.$$('#algo-b .chip').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-algo') === st.algoB ? 'true' : 'false'); });
    EDU.$$('#presets .chip').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-preset') === st.preset ? 'true' : 'false'); });
    EDU.$('#cmp-on').checked = st.compare;
    EDU.$('#algo-b-wrap').hidden = !st.compare;
    EDU.$('#sv-main').classList.toggle('cmp', st.compare);
    lanes[1].root.hidden = !st.compare;
    lanes.forEach(function (L) {
      if (!L.algo) return;
      var name = EDU.t('algo_' + L.algo);
      L.title.textContent = name;
      L.badge.textContent = EDU.t('lane_done');
      L.cv.setAttribute('aria-label', EDU.t('canvas_aria', { name: name, n: EDU.fmt(st.arr.length) }));
    });
    EDU.$('#size').value = String(st.size);
    EDU.$('#size-out').textContent = EDU.fmt(st.arr.length);
    EDU.$('#speed').value = String(st.speed);
    var cm = EDU.$('#custom-msg');
    var cvars = customNote && customNote.list ? { list: customNote.list.map(function (s) { return document.documentElement.dir === 'rtl' ? '⁦' + s + '⁩' : s; }).join(', ') } : (customNote && customNote.vars);
    cm.textContent = customNote ? EDU.t(customNote.key, cvars) : '';
    cm.className = 'sv-custom-msg small' + (customNote ? ' ' + customNote.cls : '');
    renderPlay();
    renderAbout();
    renderTables();
  }

  /* Recompute everything after the algorithm or the numbers change. */
  function rebuild() {
    stopPlay();
    lanes[0].algo = st.algoA;
    lanes[1].algo = st.compare ? st.algoB : null;
    lanes.forEach(function (L) { L.frames = L.algo ? record(L.algo, st.arr).frames : []; });
    counts = {};
    ALGOS.forEach(function (al) { counts[al] = record(al, st.arr, true); });
    pos = 0;
    save();
    renderCode();
    renderStatic();
    update();
  }

  /* ------------------------------------------------------------------ playback */
  function stopPlay() { if (playing) setPlaying(false); }
  function setPlaying(on) {
    if (on && pos >= totalSteps()) pos = 0;
    playing = on;
    if (timer) { clearTimeout(timer); timer = null; }
    lanes.forEach(function (L) { L.msg.setAttribute('aria-live', on ? 'off' : 'polite'); });
    renderPlay();
    if (on) { update(); timer = setTimeout(tick, Math.min(300, SPEEDS[st.speed - 1][0])); }
  }
  function tick() {
    timer = null;
    if (!playing) return;
    var total = totalSteps();
    pos = Math.min(total, pos + SPEEDS[st.speed - 1][1]);
    update();
    if (pos >= total) { setPlaying(false); return; }
    timer = setTimeout(tick, SPEEDS[st.speed - 1][0]);
  }
  function go(p) { stopPlay(); pos = EDU.clamp(p, 0, totalSteps()); update(); }

  function setAlgo(which, al) {
    if (which === 'a') st.algoA = al; else st.algoB = al;
    rebuild();
  }
  function newData(kind) {
    st.preset = kind;
    st.arr = makeData(kind, st.size);
    customNote = null;
    rebuild();
  }

  /* ------------------------------------------------------------------ events */
  EDU.$('#play').addEventListener('click', function () { setPlaying(!playing); });
  EDU.$('#step').addEventListener('click', function () { go(pos + 1); });
  EDU.$('#back').addEventListener('click', function () { go(pos - 1); });
  EDU.$('#reset').addEventListener('click', function () { go(0); });
  EDU.$('#scrub').addEventListener('input', function (e) { go(parseInt(e.target.value, 10) || 0); });
  EDU.$('#speed').addEventListener('input', function (e) { st.speed = EDU.clamp(parseInt(e.target.value, 10) || 5, 1, 10); store.set('speed', st.speed); });
  EDU.$('#fs').addEventListener('click', function () { EDU.fullscreen(EDU.$('#sv-main')); });
  EDU.$('#print').addEventListener('click', function () { window.print(); });
  EDU.$('#cmp-on').addEventListener('change', function (e) { st.compare = e.target.checked; rebuild(); });
  EDU.$$('#presets .chip').forEach(function (b) { b.addEventListener('click', function () { newData(b.getAttribute('data-preset')); }); });
  EDU.$('#size').addEventListener('input', function (e) {
    st.size = EDU.clamp(parseInt(e.target.value, 10) || 16, MIN_N, MAX_N);
    newData(st.preset === 'custom' ? 'random' : st.preset);
  });
  var customIn = EDU.$('#custom');
  customIn.value = store.get('custom', '');
  EDU.$('#custom-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var r = parseNums(customIn.value);
    store.set('custom', customIn.value);
    if (r.bad.length) {
      customNote = { key: 'custom_err_bad', list: r.bad.slice(0, 5).map(function (s) { return s.length > 24 ? s.slice(0, 23) + '…' : s; }), cls: 'bad' };
      renderStatic(); return;
    }
    if (r.nums.length < CUSTOM_MIN) { customNote = { key: 'custom_err_empty', vars: null, cls: 'bad' }; renderStatic(); return; }
    var trimmed = r.nums.length > MAX_N;
    st.arr = r.nums.slice(0, MAX_N);
    st.preset = 'custom';
    st.size = EDU.clamp(st.arr.length, MIN_N, MAX_N);
    customNote = { key: trimmed ? 'custom_trimmed' : 'custom_ok', vars: { n: EDU.fmt(st.arr.length) }, cls: 'good' };
    rebuild();
  });

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tg && tg.isContentEditable) || document.querySelector('.edu-modal-back')) return;
    if (e.key === ' ' || e.key === 'Spacebar') { if (tag === 'BUTTON' || tag === 'SUMMARY' || tag === 'A') return; e.preventDefault(); setPlaying(!playing); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(pos + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(pos - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
  });

  var raf = 0;
  function redrawSoon() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; drawAll(); }); }
  if (window.ResizeObserver) new ResizeObserver(redrawSoon).observe(EDU.$('#lanes'));
  window.addEventListener('resize', redrawSoon);
  document.addEventListener('fullscreenchange', function () { setTimeout(drawAll, 60); });
  EDU.onTheme(function () { readColors(); drawAll(); });
  EDU.onLang(function () { renderStatic(); update(); });
  window.addEventListener('beforeprint', function () { stopPlay(); });

  /* for the automated test */
  window.SV_DEBUG = function () {
    return {
      algoA: st.algoA, algoB: st.algoB, compare: st.compare, preset: st.preset, arr: st.arr.slice(), pos: pos, total: totalSteps(), playing: playing,
      lanes: lanes.filter(function (L) { return L.algo; }).map(function (L) {
        var f = frameOf(L);
        return { algo: L.algo, C: f.C, SW: f.SW, W: f.W, a: f.a.slice(), line: f.line, msg: f.msg, frames: L.frames.length };
      }),
      counts: ALGOS.reduce(function (o, al) { o[al] = { C: counts[al].C, SW: counts[al].SW, W: counts[al].W, steps: counts[al].steps, sorted: counts[al].sorted.slice() }; return o; }, {})
    };
  };

  readColors();
  rebuild();
})();
