/* Lens & Mirror Ray Lab: pure optics, no DOM.
   New Cartesian sign convention: pole P / optical centre O at x = 0, incident light travels
   left → right (+x), the object stands on the left (u < 0), heights above the axis are +.
   Mirror: 1/v + 1/u = 1/f, m = −v/u.   Lens: 1/v − 1/u = 1/f, m = v/u.
   Concave mirror and concave lens have f < 0; convex mirror and convex lens have f > 0. */
window.RayOptics = (function () {
  'use strict';
  var EPS = 1e-6;
  var DEVICES = ['concave_mirror', 'convex_mirror', 'convex_lens', 'concave_lens'];
  var F_MIN = 5, F_MAX = 30, H_MIN = 1, H_MAX = 8;

  function isMirror(dev) { return dev === 'concave_mirror' || dev === 'convex_mirror'; }
  function signedF(dev, fAbs) { return (dev === 'concave_mirror' || dev === 'concave_lens') ? -fAbs : fAbs; }
  /* object can be dragged up to 3.4 f (beyond C / 2F₁ is always reachable) */
  function uMax(fAbs) { return Math.round(3.4 * fAbs); }

  /* NCERT Class 10 tables (Light: Reflection and Refraction). `at` = object distance in units of |f|. */
  var ROWS = {
    concave_mirror: [
      { id: 'inf', obj: 'pos_inf', img: 'pos_at_f', size: 'point', real: true },
      { id: 'beyond_c', obj: 'pos_beyond_c', img: 'pos_f_c', size: 'dim', real: true, at: 2.7 },
      { id: 'at_c', obj: 'pos_at_c', img: 'pos_at_c', size: 'same', real: true, at: 2 },
      { id: 'c_f', obj: 'pos_c_f', img: 'pos_beyond_c', size: 'big', real: true, at: 1.5 },
      { id: 'at_f', obj: 'pos_at_f', img: 'pos_inf', size: 'huge', real: true, at: 1 },
      { id: 'p_f', obj: 'pos_p_f', img: 'pos_behind', size: 'big', real: false, at: 0.5 }
    ],
    convex_mirror: [
      { id: 'inf', obj: 'pos_inf', img: 'pos_behind_f', size: 'point', real: false },
      { id: 'front', obj: 'pos_inf_p', img: 'pos_behind_pf', size: 'dim', real: false, at: 1.5 }
    ],
    convex_lens: [
      { id: 'inf', obj: 'pos_inf', img: 'pos_at_f2', size: 'point', real: true },
      { id: 'beyond_2f1', obj: 'pos_beyond_2f1', img: 'pos_f2_2f2', size: 'dim', real: true, at: 2.7 },
      { id: 'at_2f1', obj: 'pos_at_2f1', img: 'pos_at_2f2', size: 'same', real: true, at: 2 },
      { id: 'f1_2f1', obj: 'pos_f1_2f1', img: 'pos_beyond_2f2', size: 'big', real: true, at: 1.5 },
      { id: 'at_f1', obj: 'pos_at_f1', img: 'pos_inf', size: 'huge', real: true, at: 1 },
      { id: 'f1_o', obj: 'pos_f1_o', img: 'pos_same_side', size: 'big', real: false, at: 0.5 }
    ],
    concave_lens: [
      { id: 'inf', obj: 'pos_inf', img: 'pos_at_f1', size: 'point', real: false },
      { id: 'front', obj: 'pos_inf_o', img: 'pos_f1_o', size: 'dim', real: false, at: 1.5 }
    ]
  };

  /* answer choices for "Where is the image?" in the quiz (real answers + sensible distractors) */
  var QUIZ_POS = {
    concave_mirror: ['pos_at_f', 'pos_f_c', 'pos_at_c', 'pos_beyond_c', 'pos_inf', 'pos_behind'],
    convex_mirror: ['pos_behind_pf', 'pos_behind_f', 'pos_f_c', 'pos_beyond_c'],
    convex_lens: ['pos_at_f2', 'pos_f2_2f2', 'pos_at_2f2', 'pos_beyond_2f2', 'pos_inf', 'pos_same_side'],
    concave_lens: ['pos_f1_o', 'pos_at_f1', 'pos_f2_2f2', 'pos_beyond_2f2']
  };

  function rowInfo(dev, id) {
    var rows = ROWS[dev] || [];
    for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
    return rows[0];
  }

  /* which NCERT row an object distance belongs to */
  function rowFor(dev, fAbs, uAbs) {
    if (!isFinite(uAbs)) return 'inf';
    if (dev === 'convex_mirror' || dev === 'concave_lens') return 'front';
    var lens = dev === 'convex_lens', d = uAbs - 2 * fAbs, e = uAbs - fAbs;
    if (d > EPS) return lens ? 'beyond_2f1' : 'beyond_c';
    if (Math.abs(d) <= EPS) return lens ? 'at_2f1' : 'at_c';
    if (e > EPS) return lens ? 'f1_2f1' : 'c_f';
    if (Math.abs(e) <= EPS) return lens ? 'at_f1' : 'at_f';
    return lens ? 'f1_o' : 'p_f';
  }

  /* object distance (size, cm) that puts the object in a given row */
  function placeU(dev, id, fAbs) {
    var row = rowInfo(dev, id);
    if (!row || !row.at) return Infinity;
    return Math.max(1, Math.min(uMax(fAbs), Math.round(row.at * fAbs)));
  }

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b > EPS) { var t = a % b; a = b; b = t; } return a || 1; }
  /* reduce n/d (integers) with the sign on the numerator */
  function frac(n, d) {
    if (d < 0) { n = -n; d = -d; }
    if (Math.round(n) === n && Math.round(d) === d) { var g = gcd(n, d); n = n / g; d = d / g; }
    return [n, d];
  }

  /* Solve one set-up. fAbs, uAbs in cm (uAbs may be Infinity), h = object height in cm. */
  function solve(dev, fAbs, uAbs, h) {
    var mirror = isMirror(dev), f = signedF(dev, fAbs);
    var r = { dev: dev, mirror: mirror, f: f, fAbs: fAbs, h: h, objInf: !isFinite(uAbs), imgInf: false };
    r.u = r.objInf ? -Infinity : -uAbs;
    r.row = rowFor(dev, fAbs, uAbs);
    r.info = rowInfo(dev, r.row);
    if (r.objInf) {
      r.v = f; r.m = 0; r.h2 = 0;
    } else {
      /* 1/v = num/den  (mirror: 1/f − 1/u, lens: 1/f + 1/u) */
      r.num = mirror ? r.u - f : r.u + f;
      r.den = f * r.u;
      if (Math.abs(r.num) < EPS) { r.imgInf = true; r.v = mirror ? -Infinity : Infinity; r.m = NaN; r.h2 = NaN; }
      else { r.v = r.den / r.num; r.m = mirror ? -r.v / r.u : r.v / r.u; r.h2 = r.m * h; }
    }
    if (r.objInf || r.imgInf) {
      r.real = r.info.real; r.inverted = r.info.real; r.size = r.info.size;
    } else {
      r.real = mirror ? r.v < 0 : r.v > 0;
      r.inverted = r.m < 0;
      var am = Math.abs(r.m);
      r.size = Math.abs(am - 1) < 1e-9 ? 'same' : (am > 1 ? 'big' : 'dim');
    }
    r.power = mirror ? null : 100 / f;            /* dioptre, f in metres = f(cm)/100 */
    return r;
  }

  /* quiz question: device, focal length, object distance, and the expected answer */
  function quiz(rand) {
    rand = rand || Math.random;
    var pick = function (a) { return a[Math.floor(rand() * a.length)]; };
    var ri = function (a, b) { return a + Math.floor(rand() * (b - a + 1)); };
    var dev = pick(['concave_mirror', 'concave_mirror', 'convex_lens', 'convex_lens', 'convex_mirror', 'concave_lens']);
    var rows = ROWS[dev], row;
    if (rand() < 0.12) row = rows[0];
    else row = pick(rows.slice(1));
    var f = pick([10, 12, 15, 20, 25]), u;
    switch (row.id) {
      case 'inf': u = Infinity; break;
      case 'beyond_c': case 'beyond_2f1': u = ri(2 * f + 2, uMax(f)); break;
      case 'at_c': case 'at_2f1': u = 2 * f; break;
      case 'c_f': case 'f1_2f1': u = ri(f + 2, 2 * f - 2); break;
      case 'at_f': case 'at_f1': u = f; break;
      case 'p_f': case 'f1_o': u = ri(Math.max(2, Math.round(0.3 * f)), f - 2); break;
      default: u = ri(3, uMax(f));
    }
    var order = QUIZ_POS[dev].slice();
    for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var x = order[i]; order[i] = order[j]; order[j] = x; }
    return {
      dev: dev, f: f, u: isFinite(u) ? u : null, row: row.id, order: order,
      answer: { pos: row.img, nat: row.real ? 'real' : 'virtual', ori: row.real ? 'inverted' : 'erect',
        size: row.size === 'point' ? 'dim' : (row.size === 'huge' ? 'big' : row.size) }
    };
  }

  return { DEVICES: DEVICES, ROWS: ROWS, QUIZ_POS: QUIZ_POS, F_MIN: F_MIN, F_MAX: F_MAX, H_MIN: H_MIN, H_MAX: H_MAX,
    isMirror: isMirror, signedF: signedF, uMax: uMax, rowInfo: rowInfo, rowFor: rowFor, placeU: placeU,
    frac: frac, solve: solve, quiz: quiz };
})();
