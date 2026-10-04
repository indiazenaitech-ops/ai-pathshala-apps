/* Chemical Equation Balancer: chemistry core (no DOM).
   - parseEquation(text): reads formulas with subscripts, ( ) and [ ] groups, hydrates (CuSO4·5H2O / CuSO4.5H2O),
     optional states (s)(l)(g)(aq), optional charges (Fe^3+, SO4^2-, Na+, e-) and optional coefficients.
   - balance(eq): exact nullspace of the atom matrix with fractions (BigInt when available) → smallest whole numbers.
   Errors are thrown / returned as Err {key, vars, idx} so the UI can translate them. */
(function (root) {
  'use strict';

  var B = typeof BigInt === 'function' ? BigInt : Number;   // exact integers; Number fallback for very old browsers
  var ZERO = B(0), ONE = B(1);

  var SYMBOLS = ('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr ' +
    'Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re ' +
    'Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh ' +
    'Fl Mc Lv Ts Og').split(' ');
  var SYM = {};
  SYMBOLS.forEach(function (s) { SYM[s] = true; });
  var MAX_SPECIES = 20;

  function Err(key, vars, idx) { this.key = key; this.vars = vars || {}; this.idx = idx || null; }

  /* ---------------- fractions ---------------- */
  function absB(a) { return a < ZERO ? -a : a; }
  function gcd(a, b) { a = absB(a); b = absB(b); while (b !== ZERO) { var t = a % b; a = b; b = t; } return a; }
  function F(n, d) {
    if (d === undefined) d = ONE;
    if (d < ZERO) { n = -n; d = -d; }
    var g = gcd(n, d);
    if (g !== ZERO && g !== ONE) { n = n / g; d = d / g; }
    return { n: n, d: d };
  }
  function fadd(a, b) { return F(a.n * b.d + b.n * a.d, a.d * b.d); }
  function fsub(a, b) { return F(a.n * b.d - b.n * a.d, a.d * b.d); }
  function fmul(a, b) { return F(a.n * b.n, a.d * b.d); }
  function fdiv(a, b) { return F(a.n * b.d, a.d * b.n); }
  function fneg(a) { return { n: -a.n, d: a.d }; }
  function fstr(a) { return a.d === ONE ? String(a.n) : String(a.n) + '/' + String(a.d); }

  /* ---------------- text clean-up ---------------- */
  var SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function normalize(s) {
    s = String(s == null ? '' : s);
    s = s.replace(/[​-‍⁠﻿]/g, '');   // invisible joiners (pasted text, or the "->" kept unbroken in help text)
    s = s.replace(/[₀-₉]/g, function (c) { return String(c.charCodeAt(0) - 0x2080); });
    s = s.replace(/[⁰¹²³⁴-⁹⁺⁻]+/g, function (m) {
      return '^' + m.replace(/[\s\S]/g, function (c) {
        if (c === '⁺') return '+';
        if (c === '⁻') return '-';
        return String(SUPD.indexOf(c));
      });
    });
    s = s.replace(/[０-９]/g, function (c) { return String(c.charCodeAt(0) - 0xFF10); });
    s = s.replace(/[−–—－]/g, '-').replace(/＋/g, '+').replace(/[↑↓]/g, '');
    s = s.replace(/[·•∙⋅・*]/g, '·');
    s = s.replace(/\s+/g, ' ').trim();
    s = s.replace(/[\s.।۔]+$/, '');      // a full stop typed at the end of the equation (".", Hindi "।", Urdu "۔")
    return s;
  }

  var ARROW_RE = /<=+>|<-+>|⇌|⇄|↔|⟷|-+>|=+>|→|⟶|⇒|⟹|=+/g;

  /* split one side at "+" signs, keeping "+" that belong to a charge (Na+, Fe^3+, Ca++) */
  function splitSpecies(side) {
    var out = [], buf = '', depth = 0;
    for (var i = 0; i < side.length; i++) {
      var ch = side.charAt(i);
      if (ch === '{') depth++;
      else if (ch === '}') depth = Math.max(0, depth - 1);
      if (ch === '+' && depth === 0) {
        var touching = buf.length > 0 && !/\s$/.test(buf);
        var after = side.slice(i + 1);
        var nextCh = after.replace(/^\s+/, '').charAt(0);
        /* "Na+", "Ca++", "Fe^3+", and "Ag+(aq)" / "Na+ (aq)" (NCERT style: a state right after the charge) */
        var isCharge = /\^\d*$/.test(buf) || (touching && (nextCh === '' || nextCh === '+' || /^\s*\(\s*(s|l|g|aq)\s*\)/i.test(after)));
        if (!isCharge) { out.push(buf); buf = ''; continue; }
      }
      buf += ch;
    }
    out.push(buf);
    return out.map(function (x) { return x.trim(); });
  }

  function parseCharge(s) {
    var m, sign;
    if ((m = /\^\{?(\d*)([+-])\}?$/.exec(s))) { sign = m[2] === '-' ? -1 : 1; return { q: sign * (m[1] ? parseInt(m[1], 10) : 1), rest: s.slice(0, m.index) }; }
    if ((m = /\^\{?([+-])(\d+)\}?$/.exec(s))) { sign = m[1] === '-' ? -1 : 1; return { q: sign * parseInt(m[2], 10), rest: s.slice(0, m.index) }; }
    if ((m = /\{(\d*)([+-])\}$/.exec(s))) { sign = m[2] === '-' ? -1 : 1; return { q: sign * (m[1] ? parseInt(m[1], 10) : 1), rest: s.slice(0, m.index) }; }
    if ((m = /(\++|-+)$/.exec(s))) {
      sign = m[1].charAt(0) === '-' ? -1 : 1;
      var rest = s.slice(0, m.index), q = sign * m[1].length;
      /* Plain "Fe3+", "Zn2+", "O2-", "SO42-", "Cr2O72-": the digit before a single sign is the size of the charge when
         (a) the formula is one element symbol (monatomic ion: Fe3+ = Fe³⁺, O2- = O²⁻), or
         (b) it ends in 2+ digits whose last digit is 2-9 (SO42- = SO₄²⁻, PO43- = PO₄³⁻, Hg22+ = Hg₂²⁺).
         Otherwise the digit is a subscript (NH4+ = NH₄⁺, MnO4- = MnO₄⁻, NO3- = NO₃⁻). */
      var compact = rest.replace(/\s+/g, '');
      var dm = m[1].length === 1 ? /(\d+)$/.exec(compact) : null;
      if (dm) {
        var digits = dm[1], lastD = +digits.charAt(digits.length - 1), head = compact.slice(0, dm.index);
        if (lastD >= 2 && (digits.length >= 2 || (/^[A-Z][a-z]?$/.test(head) && SYM[head]))) {
          return { q: sign * lastD, rest: head + digits.slice(0, -1), plain: true };
        }
      }
      return { q: q, rest: rest };
    }
    return null;
  }

  function readInt(s, pos) {
    var m = /^\d+/.exec(s.slice(pos));
    return m ? { n: parseInt(m[0], 10), len: m[0].length } : { n: 1, len: 0 };
  }

  function addTo(acc, el, n) {
    if (!Object.prototype.hasOwnProperty.call(acc.counts, el)) { acc.counts[el] = 0; acc.order.push(el); }
    acc.counts[el] += n;
  }

  function group(s, pos, close, raw) {
    var acc = { counts: {}, order: [] };
    while (pos < s.length) {
      var c = s.charAt(pos);
      if (/[A-Z]/.test(c)) {
        var sym = c, nx = s.charAt(pos + 1);
        if (nx && /[a-z]/.test(nx)) {
          if (SYM[c + nx]) sym = c + nx;
          else throw new Err('err_element', { e: c + nx });
        } else if (!SYM[c]) throw new Err('err_element', { e: c });
        pos += sym.length;
        var r = readInt(s, pos); pos += r.len;
        if (r.n < 1 || r.n > 9999) throw new Err('err_formula', { f: raw });
        addTo(acc, sym, r.n);
      } else if (c === '(' || c === '[') {
        var g = group(s, pos + 1, c === '(' ? ')' : ']', raw);
        pos = g.pos;
        var r2 = readInt(s, pos); pos += r2.len;
        if (!g.order.length || r2.n < 1 || r2.n > 9999) throw new Err('err_formula', { f: raw });
        g.order.forEach(function (el) { addTo(acc, el, g.counts[el] * r2.n); });
      } else if (c === ')' || c === ']') {
        if (c === close) { acc.pos = pos + 1; return acc; }
        throw new Err('err_bracket', { f: raw });
      } else if (/[a-z]/.test(c)) {
        throw new Err('err_lower', { f: raw });
      } else if (/\d/.test(c)) {
        throw new Err('err_formula', { f: raw });
      } else {
        throw new Err('err_bad_char', { c: c });
      }
    }
    if (close) throw new Err('err_bracket', { f: raw });
    acc.pos = pos;
    return acc;
  }

  /* formula without coefficient / state / charge, e.g. "CuSO4·5H2O", "K4[Fe(CN)6]" */
  function parseFormula(s, raw) {
    var acc = { counts: {}, order: [] };
    var parts = [], depth = 0, buf = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === '(' || c === '[') depth++;
      else if (c === ')' || c === ']') depth--;
      if ((c === '·' || c === '.') && depth === 0) { parts.push(buf); buf = ''; continue; }
      buf += c;
    }
    parts.push(buf);
    /* multiplier of each part: 5 (CuSO4·5H2O), and also halves like plaster of Paris CaSO4·½H2O / CaSO4·1/2H2O */
    var FR = { '½': [1, 2], '¼': [1, 4], '¾': [3, 4], '⅓': [1, 3], '⅔': [2, 3] };
    var items = parts.map(function (p, k) {
      var num = 1, den = 1, m;
      if ((m = /^(\d*)([½¼¾⅓⅔])/.exec(p))) {
        var fr = FR[m[2]], w = m[1] ? parseInt(m[1], 10) : 0;
        num = w * fr[1] + fr[0]; den = fr[1];
      } else if ((m = /^(\d+)\/(\d+)/.exec(p))) {
        num = parseInt(m[1], 10); den = parseInt(m[2], 10);
      } else if ((m = /^(\d+)/.exec(p))) {
        num = parseInt(m[1], 10);
      }
      if (m) {
        if (k === 0) throw new Err('err_formula', { f: raw });
        p = p.slice(m[0].length);
        if (num < 1 || den < 1 || den > 12 || num / den > 999) throw new Err('err_formula', { f: raw });
      }
      if (!p) throw new Err('err_formula', { f: raw });
      return { p: p, num: num, den: den };
    });
    /* a fractional multiplier: count whole units instead, CaSO4·½H2O → (CaSO4)2·H2O (same substance, written the standard way) */
    var L = items.reduce(function (a, it) { var x = a, y = it.den; while (y) { var t = x % y; x = y; y = t; } return a / x * it.den; }, 1);
    items.forEach(function (it, k) {
      var mult = it.num * (L / it.den);
      if (mult > 9999) throw new Err('err_formula', { f: raw });
      var g = group(it.p, 0, null, raw);
      g.order.forEach(function (el) { addTo(acc, el, g.counts[el] * mult); });
    });
    if (L > 1) {
      acc.display = items.map(function (it, k) {
        var mult = it.num * (L / it.den);
        return k === 0 ? '(' + it.p + ')' + L : (mult > 1 ? mult : '') + it.p;
      }).join('·');
    }
    return acc;
  }

  var STATE_RE = /\s*\(\s*(s|l|g|aq)\s*\)\s*$/i;

  function parseSpecies(raw, side) {
    var s = raw.trim();
    if (!s) throw new Err('err_plus');
    var sp = { side: side, raw: s, coef: null, charge: 0, state: '', electron: false, formula: '', counts: {}, order: [], atoms: 0 };
    if (/^-\s*\d/.test(s) || /^[½¼¾⅓⅔]/.test(s)) throw new Err('err_coef');          // -2H2, ½O2
    var m = /^(\d+)\s*/.exec(s);
    if (m) {
      sp.coef = parseInt(m[1], 10); s = s.slice(m[0].length);
      if (!(sp.coef >= 1) || sp.coef > 99999) throw new Err('err_coef');
      if (/^[\/.,]\s*\d/.test(s) || /^[½¼¾⅓⅔]/.test(s)) throw new Err('err_coef');   // 1/2O2, 1.5O2
    }
    var st = STATE_RE.exec(s);
    if (st) { sp.state = st[1].toLowerCase(); s = s.slice(0, st.index); }
    var ch = parseCharge(s.trim());
    if (ch) { sp.charge = ch.q; s = ch.rest; }
    if (!sp.state) { st = STATE_RE.exec(s); if (st) { sp.state = st[1].toLowerCase(); s = s.slice(0, st.index); } }
    s = s.replace(/\s+/g, '');
    if (!s) throw new Err('err_formula', { f: raw.trim() });
    if (s === 'e') {
      if (ch && ch.q !== -1) throw new Err('err_formula', { f: raw.trim() });
      sp.electron = true; sp.charge = -1; sp.formula = 'e';
      return sp;
    }
    var f = parseFormula(s, raw.trim());
    sp.formula = f.display || s.replace(/\./g, '·');
    sp.counts = f.counts; sp.order = f.order;
    sp.atoms = f.order.reduce(function (a, el) { return a + f.counts[el]; }, 0);
    return sp;
  }

  function parseEquation(input) {
    var s = normalize(input);
    if (!s) throw new Err('err_empty');
    var arrows = s.match(ARROW_RE) || [];
    if (arrows.length !== 1) throw new Err('err_arrow');
    var sides = s.split(ARROW_RE).map(function (x) { return x.trim(); });
    if (!sides[0] || !sides[1]) throw new Err('err_side_empty');
    var species = [];
    [0, 1].forEach(function (side) {
      splitSpecies(sides[side]).forEach(function (raw) { species.push(parseSpecies(raw, side)); });
    });
    if (species.length > MAX_SPECIES) throw new Err('err_too_many', { n: MAX_SPECIES });
    var elements = [];
    species.forEach(function (sp) { sp.order.forEach(function (el) { if (elements.indexOf(el) < 0) elements.push(el); }); });
    return {
      text: s, species: species, elements: elements,
      hasCharge: species.some(function (sp) { return sp.charge !== 0; }),
      userCoefs: species.some(function (sp) { return sp.coef !== null; })
    };
  }

  /* ---------------- linear algebra ---------------- */
  function buildRows(eq) {
    var rows = eq.elements.map(function (el) {
      return { label: el, isCharge: false, a: eq.species.map(function (sp) { return (sp.side === 0 ? 1 : -1) * (sp.counts[el] || 0); }) };
    });
    if (eq.hasCharge) rows.push({ label: '', isCharge: true, a: eq.species.map(function (sp) { return (sp.side === 0 ? 1 : -1) * sp.charge; }) });
    return rows;
  }

  /* nullspace of A (m × n) with the columns visited in `order` (last = preferred free variable) */
  function nullspace(A, n, order) {
    var M = A.map(function (row) { return order.map(function (j) { return F(B(row[j])); }); });
    var m = M.length, piv = [], r = 0, c, i, k;
    for (c = 0; c < n && r < m; c++) {
      var p = -1;
      for (i = r; i < m; i++) if (M[i][c].n !== ZERO) { p = i; break; }
      if (p < 0) continue;
      var tmp = M[r]; M[r] = M[p]; M[p] = tmp;
      var pv = M[r][c];
      for (k = 0; k < n; k++) M[r][k] = fdiv(M[r][k], pv);
      for (i = 0; i < m; i++) {
        if (i === r || M[i][c].n === ZERO) continue;
        var f = M[i][c];
        for (k = 0; k < n; k++) M[i][k] = fsub(M[i][k], fmul(f, M[r][k]));
      }
      piv.push(c); r++;
    }
    var free = [];
    for (c = 0; c < n; c++) if (piv.indexOf(c) < 0) free.push(c);
    var basis = free.map(function (fc) {
      var v = [];
      for (k = 0; k < n; k++) v.push(F(ZERO));
      v[fc] = F(ONE);
      piv.forEach(function (pc, ri) { v[pc] = fneg(M[ri][fc]); });
      var out = new Array(n);
      for (k = 0; k < n; k++) out[order[k]] = v[k];
      return out;
    });
    return { basis: basis, free: free.map(function (fc) { return order[fc]; }), rank: piv.length };
  }

  function lcm(a, b) { return a / gcd(a, b) * b; }
  function toInts(v) {
    var L = v.reduce(function (acc, x) { return lcm(acc, x.d); }, ONE);
    var ints = v.map(function (x) { return x.n * (L / x.d); });
    var g = ints.reduce(function (acc, x) { return gcd(acc, x); }, ZERO);
    if (g !== ZERO && g !== ONE) ints = ints.map(function (x) { return x / g; });
    return { ints: ints, L: L, g: g };
  }

  /* solve element by element from the free variable (= 1), the way a student would */
  function derive(rows, n, free) {
    var known = {}, used = [], lines = [];
    known[free] = F(ONE);
    var progress = true;
    while (progress) {
      progress = false;
      for (var ri = 0; ri < rows.length; ri++) {
        if (used[ri]) continue;
        var a = rows[ri].a, unk = [];
        for (var j = 0; j < n; j++) if (a[j] !== 0 && !(j in known)) unk.push(j);
        if (!unk.length) { used[ri] = true; continue; }
        if (unk.length === 1) {
          var x = unk[0], s = F(ZERO);
          for (var k = 0; k < n; k++) if (a[k] !== 0 && k !== x) s = fadd(s, fmul(F(B(a[k])), known[k]));
          known[x] = fdiv(fneg(s), F(B(a[x])));
          lines.push({ row: ri, solve: x, value: known[x] });
          used[ri] = true; progress = true;
          break;    // restart from the first row so the order reads naturally
        }
      }
    }
    var rest = [];
    for (var q = 0; q < n; q++) if (!(q in known)) rest.push(q);
    return { lines: lines, rest: rest };
  }

  function balance(eq) {
    var sp = eq.species, n = sp.length, i;
    for (i = 0; i < eq.elements.length; i++) {
      var el = eq.elements[i];
      var left = sp.some(function (s) { return s.side === 0 && s.counts[el]; });
      var right = sp.some(function (s) { return s.side === 1 && s.counts[el]; });
      if (!left || !right) return { status: 'error', err: new Err('err_only_side', { e: el }) };
    }
    var rows = buildRows(eq);
    var pref = 0;
    for (i = 1; i < n; i++) if (sp[i].atoms > sp[pref].atoms) pref = i;
    var order = [];
    for (i = 0; i < n; i++) if (i !== pref) order.push(i);
    order.push(pref);
    var ns = nullspace(rows.map(function (r) { return r.a; }), n, order);

    if (!ns.basis.length) {
      var key = 'err_impossible';
      if (eq.hasCharge) {
        var noCharge = nullspace(rows.filter(function (r) { return !r.isCharge; }).map(function (r) { return r.a; }), n, order);
        if (noCharge.basis.length) key = 'err_charge';
      }
      return { status: 'error', err: new Err(key) };
    }

    if (ns.basis.length === 1) {
      var v = ns.basis[0], t = toInts(v), ints = t.ints;
      var zeros = [], neg = [], pos = [];
      ints.forEach(function (x, j) { if (x === ZERO) zeros.push(j); else if (x < ZERO) neg.push(j); else pos.push(j); });
      if (zeros.length) return { status: 'error', err: new Err('err_zero', {}, zeros) };
      if (neg.length) return { status: 'error', err: new Err('err_side', {}, neg.length <= pos.length ? neg : pos) };
      /* "let x = 1" for the substance that lets us solve one element at a time (ties: the biggest formula) */
      var free = -1, steps = null;
      for (var j0 = 0; j0 < n; j0++) {
        var st = derive(rows, n, j0);
        if (!steps || st.rest.length < steps.rest.length || (st.rest.length === steps.rest.length && sp[j0].atoms > sp[free].atoms)) { free = j0; steps = st; }
      }
      var vf = v.map(function (x) { return fdiv(x, v[free]); });
      return { status: 'ok', coefs: ints, rows: rows, free: free, values: vf, mult: toInts(vf).L, steps: steps };
    }

    /* more than one independent solution: look for a small positive combination */
    var bases = ns.basis.map(function (b) { return toInts(b).ints; });
    var best = null, bestSum = null, W = 6, k = bases.length;
    if (k <= 3) {
      var w = [];
      for (i = 0; i < k; i++) w.push(1);
      for (;;) {
        var combo = [];
        for (var j = 0; j < n; j++) {
          var s = ZERO;
          for (var q = 0; q < k; q++) s += B(w[q]) * bases[q][j];
          combo.push(s);
        }
        if (combo.every(function (x) { return x > ZERO; })) {
          var g = combo.reduce(function (acc, x) { return gcd(acc, x); }, ZERO);
          combo = combo.map(function (x) { return x / g; });
          var sum = combo.reduce(function (acc, x) { return acc + x; }, ZERO);
          if (best === null || sum < bestSum) { best = combo; bestSum = sum; }
        }
        var d = 0;
        while (d < k && w[d] === W) { w[d] = 1; d++; }
        if (d === k) break;
        w[d]++;
      }
    }
    if (!best) return { status: 'error', err: new Err('many_none') };
    return { status: 'many', coefs: best, rows: rows, dims: k };
  }

  /* atom (and charge) count on both sides for given coefficients */
  function tally(eq, coefs) {
    return buildRows(eq).map(function (row) {
      var l = ZERO, r = ZERO, lp = [], rp = [];
      eq.species.forEach(function (sp, j) {
        var per = row.isCharge ? sp.charge : (sp.counts[row.label] || 0);
        if (!per) return;
        var c = B(coefs[j]);
        if (sp.side === 0) { l += c * B(per); lp.push([String(coefs[j]), per]); }
        else { r += c * B(per); rp.push([String(coefs[j]), per]); }
      });
      return { label: row.label, isCharge: row.isCharge, l: l, r: r, lp: lp, rp: rp, ok: l === r };
    });
  }

  /* k if coefs = k × ans (positive integer k), else 0 */
  function multipleOf(coefs, ans) {
    var c0 = B(coefs[0]), a0 = B(ans[0]);
    if (a0 === ZERO || c0 % a0 !== ZERO) return 0;
    var k = c0 / a0;
    for (var j = 0; j < ans.length; j++) if (B(coefs[j]) !== k * B(ans[j])) return 0;
    return k;
  }

  /* ---------------- plain-text formatting (Unicode sub/superscripts) ---------------- */
  var SUBS = '₀₁₂₃₄₅₆₇₈₉';
  function subDigits(s) { return String(s).replace(/\d/g, function (d) { return SUBS.charAt(+d); }); }
  function supDigits(s) { return String(s).replace(/\d/g, function (d) { return SUPD.charAt(+d); }); }
  function chargeText(q) {
    if (!q) return '';
    var a = Math.abs(q);
    return (a > 1 ? supDigits(a) : '') + (q > 0 ? '⁺' : '⁻');
  }
  function formulaText(f) {
    return String(f).split('·').map(function (seg, i) {
      var lead = '', m = /^(\d+)/.exec(seg);
      if (m && i > 0) { lead = m[1]; seg = seg.slice(m[1].length); }
      return (i > 0 ? '·' : '') + lead + subDigits(seg);
    }).join('');
  }
  function speciesText(sp, withState) {
    return formulaText(sp.formula) + chargeText(sp.charge) + (withState && sp.state ? '(' + sp.state + ')' : '');
  }
  function equationText(eq, coefs, withState) {
    var sides = [[], []];
    eq.species.forEach(function (sp, j) {
      var c = coefs ? String(coefs[j]) : '';
      sides[sp.side].push((c && c !== '1' ? c : '') + speciesText(sp, withState));
    });
    return sides[0].join(' + ') + ' → ' + sides[1].join(' + ');
  }

  root.EB_CHEM = {
    Err: Err, normalize: normalize, parseEquation: parseEquation, balance: balance, tally: tally, multipleOf: multipleOf,
    fstr: fstr, formulaText: formulaText, speciesText: speciesText, equationText: equationText, chargeText: chargeText,
    MAX_SPECIES: MAX_SPECIES, isElement: function (s) { return !!SYM[s]; }
  };
})(typeof window !== 'undefined' ? window : this);
