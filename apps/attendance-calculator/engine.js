/* Attendance maths, kept apart from the page so it can be checked by hand and by the test.
   All work is done in whole numbers (target in tenths of a percent) so there are no rounding surprises.
     h = classes held, a = classes attended, T = required percentage (1..100, at most one decimal)
     need:    smallest x with (a + x) / (h + x) >= T/100   ->  x = ceil((T*h - 100*a) / (100 - T))
     canMiss: largest  y with  a / (h + y)     >= T/100   ->  y = floor(100*a / T - h)
     plan:    n classes are left; largest m (0..n) with (a + n - m) / (h + n) >= T/100 */
(function (root) {
  'use strict';

  function t10(T) { return Math.round(Number(T) * 10); }            // 75 -> 750, 67.5 -> 675

  /* percentage, rounded DOWN to 2 decimals, so 74.999% is never shown as 75% */
  function pct(a, h) { return h > 0 ? Math.floor(a * 10000 / h) / 100 : 0; }

  function meets(a, h, T) { return h > 0 && a * 1000 >= t10(T) * h; }

  /* classes to attend in a row to reach T. 0 = already there. Infinity = can never be reached. */
  function need(h, a, T) {
    var t = t10(T), gap = t * h - 1000 * a;
    if (gap <= 0) return 0;
    if (t >= 1000) return Infinity;
    return Math.ceil(gap / (1000 - t));
  }

  /* classes that can still be missed while staying at or above T. 0 when below T. */
  function canMiss(h, a, T) {
    var t = t10(T), spare = 1000 * a - t * h;
    if (spare < 0 || t <= 0) return 0;
    return Math.floor(spare / t);
  }

  /* n classes remain this term */
  function plan(h, a, n, T) {
    var t = t10(T), total = h + n;
    var spare = 1000 * (a + n) - t * total;                           // >= 0 when the target can still be met
    var possible = spare >= 0;
    var maxMiss = possible ? Math.min(n, Math.floor(spare / 1000)) : 0;
    return {
      total: total,
      possible: possible,
      maxMiss: maxMiss,
      mustAttend: n - maxMiss,
      needTotal: Math.ceil(t * total / 1000),                         // attended classes needed by the end
      finalPct: pct(a + n - maxMiss, total),
      bestPct: pct(a + n, total),
      worstPct: pct(a, total)
    };
  }

  /* '' when fine, else an error code */
  function check(h, a) {
    if (!isWhole(h) || !isWhole(a)) return 'whole';
    if (a > h) return 'more';
    return '';
  }
  function isWhole(v) { return typeof v === 'number' && isFinite(v) && v >= 0 && Math.floor(v) === v; }

  root.ATT = { pct: pct, meets: meets, need: need, canMiss: canMiss, plan: plan, check: check, isWhole: isWhole };
})(typeof window !== 'undefined' ? window : this);
