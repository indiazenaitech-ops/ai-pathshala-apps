/* Number System Converter: binary / octal / decimal / hexadecimal with full working,
   8-bit switches, binary addition, Unicode + UTF-8 explorer and a practice quiz.
   All arithmetic is exact (BigInt), so long numbers and fractions never lose digits. */
(function () {
  'use strict';
  var SLUG = 'number-systems';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ================================================================ exact maths */
  var DIG = '0123456789ABCDEF';
  var BASES = [2, 8, 10, 16];
  var BITS = { 2: 1, 8: 3, 16: 4 };            /* bits per digit for the power-of-two bases */
  var MAXLEN = 40;                              /* digits allowed in the converter */
  var ALLOWED = { 2: '0, 1', 8: '0–7', 10: '0–9', 16: '0–9, A–F' };
  var Z = BigInt(0), ONE = BigInt(1);

  function pad(s, n) { s = String(s); while (s.length < n) s = '0' + s; return s; }
  /* keep digit lists like "0–9, A–F" left-to-right inside Urdu sentences */
  function iso(s) { return '⁦' + s + '⁩'; }
  /* phone keyboards in Indian languages often type native digits (२५, ২৫, ௨௫, ۲۵…): read them as 0–9 */
  var NATIVE_ZERO = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66, 0xFF10];
  function latinDigits(s) {
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯０-９]/g, function (c) {
      var cp = c.charCodeAt(0);
      for (var i = 0; i < NATIVE_ZERO.length; i++) if (cp >= NATIVE_ZERO[i] && cp <= NATIVE_ZERO[i] + 9) return String(cp - NATIVE_ZERO[i]);
      return c;
    }).replace(/٫/g, '.');
  }
  /* sentence end mark per language (used when two strings are joined) */
  var STOP = { hi: '।', bn: '।', pa: '।', or: '।', ur: '۔' };
  function pow(b, e) { var r = ONE, x = BigInt(b); for (var i = 0; i < e; i++) r *= x; return r; }
  function bigFrom(str, base) {
    var n = Z, b = BigInt(base);
    for (var i = 0; i < str.length; i++) n = n * b + BigInt(DIG.indexOf(str[i]));
    return n;
  }
  function bigTo(n, base) { return n.toString(base).toUpperCase(); }
  /* N / 10^K as a decimal string without trailing zeros */
  function fmtScaled(N, K) {
    var s = N.toString();
    if (!K) return s;
    while (s.length <= K) s = '0' + s;
    var ip = s.slice(0, s.length - K), fp = s.slice(s.length - K).replace(/0+$/, '');
    return fp ? ip + '.' + fp : ip;
  }
  function baseName(b) { return t('base' + b); }

  /* Clean and validate a number typed in a base. Returns {ok, base, int, frac} or {err, ch}. */
  function parseNum(raw, base) {
    var s = latinDigits(raw).replace(/[\s_,  ]/g, '').toUpperCase();
    if (base === 16 && /^0X/.test(s)) s = s.slice(2);
    if (base === 2 && /^0B/.test(s)) s = s.slice(2);
    if (base === 8 && /^0O/.test(s)) s = s.slice(2);
    if (!s || s === '.') return { err: 'empty' };
    if (s[0] === '-' || s[0] === '−') return { err: 'minus' };
    if (s[0] === '+') s = s.slice(1);
    if (!s || s === '.') return { err: 'empty' };          /* a lone "+" is not a number */
    if (s.split('.').length > 2) return { err: 'points' };
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === '.') continue;
      var v = DIG.indexOf(c);
      if (v < 0 || v >= base) return { err: 'digit', ch: Array.from(s.slice(i))[0] };
    }
    var parts = s.split('.');
    var ip = parts[0].replace(/^0+/, '') || '0';
    var fp = (parts[1] || '').replace(/0+$/, '');
    if (ip.length + fp.length > MAXLEN) return { err: 'long' };
    return { ok: true, base: base, int: ip, frac: fp };
  }
  function parseErrText(p, base) {
    if (p.err === 'empty') return t('err_empty');
    if (p.err === 'minus') return t('err_minus');
    if (p.err === 'points') return t('err_points');
    if (p.err === 'long') return t('err_long', { n: MAXLEN });
    return t('err_digit', { c: p.ch, base: baseName(base), d: iso(ALLOWED[base]) });
  }

  /* exact value of a fraction part as N / 10^K */
  function fracExact(frac, base) {
    if (!frac) return { N: Z, K: 0 };
    var F = bigFrom(frac, base);
    if (base === 10) return { N: F, K: frac.length };
    var e = BITS[base] * frac.length;            /* F / 2^e  =  F·5^e / 10^e */
    return { N: F * pow(5, e), K: e };
  }
  /* decimal fraction → base b by repeated multiplication (exact, stops after `places`) */
  function fracMul(frac, base, places) {
    var K = frac.length, S = pow(10, K), F = bigFrom(frac, 10), b = BigInt(base), rows = [], digits = '';
    while (F > Z && rows.length < places) {
      var P = F * b, d = P / S;
      rows.push({ f: fmtScaled(F, K), p: fmtScaled(P, K), d: Number(d) });
      digits += DIG[Number(d)];
      F = P % S;
    }
    return { digits: digits, rows: rows, exact: F === Z };
  }
  /* any power-of-two base → binary digits (exact) */
  function toBin(p) {
    var m = BITS[p.base], fb = '';
    for (var i = 0; i < p.frac.length; i++) fb += pad(DIG.indexOf(p.frac[i]).toString(2), m);
    return { int: bigTo(bigFrom(p.int, p.base), 2), frac: fb.replace(/0+$/, '') };
  }
  function padGroups(bin, k) {
    var ip = bin.int, fp = bin.frac;
    var padL = (k - ip.length % k) % k, padR = (k - fp.length % k) % k;
    return { ip: pad(ip, ip.length + padL), fp: fp + '0000'.slice(0, padR), padL: padL, padR: padR };
  }
  function groupBin(bin, k) {
    var g = padGroups(bin, k), a = '', c = '', i;
    for (i = 0; i < g.ip.length; i += k) a += DIG[parseInt(g.ip.substr(i, k), 2)];
    for (i = 0; i < g.fp.length; i += k) c += DIG[parseInt(g.fp.substr(i, k), 2)];
    return { int: a.replace(/^0+/, '') || '0', frac: c.replace(/0+$/, '') };
  }
  /* the number in all four bases: {2:{int,frac,exact}, 8:..., 10:..., 16:...} */
  function convertAll(p, places) {
    var out = {};
    out[p.base] = { int: p.int, frac: p.frac, exact: true };
    if (p.base === 10) {
      var n = bigFrom(p.int, 10);
      [2, 8, 16].forEach(function (b) {
        var fm = p.frac ? fracMul(p.frac, b, places) : { digits: '', exact: true };
        out[b] = { int: bigTo(n, b), frac: fm.digits, exact: fm.exact };
      });
    } else {
      var bin = toBin(p), fe = fracExact(p.frac, p.base);
      out[10] = { int: bigFrom(p.int, p.base).toString(), frac: fe.K ? (fmtScaled(fe.N, fe.K).split('.')[1] || '') : '', exact: true };
      out[2] = { int: bin.int, frac: bin.frac, exact: true };
      [8, 16].forEach(function (b) { if (b !== p.base) { var g = groupBin(bin, BITS[b]); out[b] = { int: g.int, frac: g.frac, exact: true }; } });
    }
    return out;
  }
  function numStr(r) { return r.int + (r.frac ? '.' + r.frac : ''); }
  /* binary is easier to read in groups of 4 bits */
  function pretty(s, base) {
    if (base !== 2) return s;
    var parts = s.split('.'), ip = parts[0], out = '';
    if (ip.length > 8) { for (var i = ip.length; i > 0; i -= 4) out = ip.slice(Math.max(0, i - 4), i) + (out ? ' ' + out : ''); }
    else out = ip;
    return parts.length > 1 ? out + '.' + parts[1] : out;
  }
  /* number with its base as a subscript, e.g. 1011₂ */
  function numEl(s, base, approx, cls) {
    return el('span', { class: cls || 'ns-val', dir: 'ltr' },
      approx ? el('span', { class: 'ns-approx', text: '≈ ' }) : null,
      pretty(s, base), el('sub', { text: String(base) }));
  }
  function sup(b, p) { return [String(b), el('sup', { text: p < 0 ? '−' + (-p) : String(p) })]; }
  function digLabel(c) { var v = DIG.indexOf(c); return v > 9 ? c + '(' + v + ')' : c; }

  /* ================================================================ working (steps) */
  function stepBox(n, title, hint) {
    var box = el('div', { class: 'ns-step' },
      el('div', { class: 'ns-step-h' }, el('span', { class: 'ns-step-n', text: t('step_n', { n: n }) }), el('h3', { text: title })),
      hint ? el('p', { class: 'muted small mb0', text: hint }) : null);
    for (var i = 3; i < arguments.length; i++) if (arguments[i]) box.appendChild(arguments[i]);
    return box;
  }
  function divTable(intStr, b) {
    var n = bigFrom(intStr, 10), bb = BigInt(b), rows = [];
    while (n > Z) { rows.push({ n: n, r: Number(n % bb) }); n = n / bb; }
    var body = el('tbody');
    rows.forEach(function (row, i) {
      body.appendChild(el('tr', null,
        el('td', { class: 'dv', text: String(b) }),
        el('td', { class: 'n', text: row.n.toString() }),
        el('td', { class: 'r' }, row.r > 9 ? [String(row.r), el('small', { text: ' = ' + DIG[row.r] })] : String(row.r)),
        i === 0 ? el('td', { class: 'ns-arrow up', rowspan: String(rows.length + 1), 'aria-hidden': 'true' }) : null));
    });
    body.appendChild(el('tr', { class: 'last' }, el('td'), el('td', { class: 'n', text: '0' }), el('td')));
    var table = el('table', { class: 'ns-div', dir: 'ltr' },
      el('thead', null, el('tr', null, el('th', { text: t('col_divisor') }), el('th', { text: t('col_number') }), el('th', { text: t('col_rem') }), el('th'))),
      body);
    return { table: table, res: rows.map(function (r) { return DIG[r.r]; }).reverse().join('') || '0', count: rows.length };
  }
  function mulTable(rows, b) {
    var body = el('tbody');
    rows.forEach(function (r, i) {
      var dot = r.p.indexOf('.'), ip = dot < 0 ? r.p : r.p.slice(0, dot), rest = dot < 0 ? '' : r.p.slice(dot);
      body.appendChild(el('tr', null,
        el('td', null, r.f + ' × ' + b),
        el('td', null, '= ', el('b', { text: ip }), rest),
        el('td', { class: 'd', text: r.d > 9 ? r.d + ' = ' + DIG[r.d] : String(r.d) }),
        i === 0 ? el('td', { class: 'ns-arrow down', rowspan: String(rows.length), 'aria-hidden': 'true' }) : null));
    });
    return el('table', { class: 'ns-mul', dir: 'ltr' },
      el('thead', null, el('tr', null, el('th', { text: t('col_multiply', { b: b }) }), el('th', { text: t('col_result') }), el('th', { text: t('col_digit') }), el('th'))),
      body);
  }
  function placeSteps(p) {
    var b = p.base, digs = p.int + p.frac, nInt = p.int.length;
    var K = p.frac ? (b === 10 ? p.frac.length : BITS[b] * p.frac.length) : 0;
    var S = pow(10, K), total = Z, terms = [], formula = el('div', { class: 'ns-formula', dir: 'ltr' });
    var body = el('tbody');
    for (var i = 0; i < digs.length; i++) {
      var e = nInt - 1 - i, d = DIG.indexOf(digs[i]);
      var pv = e >= 0 ? pow(b, e) * S : S / pow(b, -e);
      var prod = pv * BigInt(d);
      total += prod;
      if (d) terms.push(fmtScaled(prod, K));
      if (i) formula.appendChild(document.createTextNode(' + '));
      formula.appendChild(el('span', { class: 't' }, el('b', { text: digLabel(digs[i]) }), '×', sup(b, e)));
      body.appendChild(el('tr', { class: d ? '' : 'zero' },
        el('td', { class: 'dg', text: digLabel(digs[i]) }),
        el('td', null, sup(b, e)),
        el('td', { text: fmtScaled(pv, K) }),
        el('td', null, el('b', { text: fmtScaled(prod, K) }))));
    }
    var table = el('div', { class: 'scroll-x' }, el('table', { class: 'ns-place', dir: 'ltr' },
      el('thead', null, el('tr', null, el('th', { text: t('col_digit') }), el('th', { text: t('col_power') }), el('th', { text: t('col_place') }), el('th', { text: t('col_product') }))),
      body));
    var sum = el('div', { class: 'ns-formula', dir: 'ltr' }, '= ' + (terms.length ? terms.join(' + ') : '0') + ' = ', el('b', { text: fmtScaled(total, K) }));
    return [stepBox(1, t('st_place_title'), t('st_place_hint', { b: b }), formula, table),
            stepBox(2, t('st_sum'), null, sum)];
  }
  function groupVisual(bin, k) {
    var g = padGroups(bin, k), wrap = el('div', { class: 'ns-groups', dir: 'ltr' });
    function add(bits, padFrom, padTo) {
      for (var i = 0; i < bits.length; i += k) {
        var chunk = bits.substr(i, k), span = el('div', { class: 'bits' });
        for (var j = 0; j < k; j++) {
          var pos = i + j, isPad = pos >= padFrom && pos < padTo;
          span.appendChild(isPad ? el('span', { class: 'pad', text: chunk[j] }) : document.createTextNode(chunk[j]));
        }
        wrap.appendChild(el('div', { class: 'ns-g' }, span, el('div', { class: 'ar', text: '↓' }),
          el('div', { class: 'dig', text: DIG[parseInt(chunk, 2)] })));
      }
    }
    add(g.ip, 0, g.padL);
    if (g.fp) { wrap.appendChild(el('div', { class: 'ns-pt', text: '.' })); add(g.fp, g.fp.length - g.padR, g.fp.length); }
    return wrap;
  }
  function expandVisual(p) {
    var k = BITS[p.base], wrap = el('div', { class: 'ns-groups', dir: 'ltr' });
    function add(s) {
      for (var i = 0; i < s.length; i++) wrap.appendChild(el('div', { class: 'ns-g top' },
        el('div', { class: 'bits', text: pad(DIG.indexOf(s[i]).toString(2), k) }),
        el('div', { class: 'ar', text: '↓' }),
        el('div', { class: 'dig', text: s[i] })));
    }
    add(p.int);
    if (p.frac) { wrap.appendChild(el('div', { class: 'ns-pt', text: '.' })); add(p.frac); }
    return wrap;
  }
  function answerLine(p, to, all) {
    var r = all[to];
    return el('p', { class: 'callout success ns-answer mb0', dir: 'ltr' },
      numEl(numStr(p), p.base), ' = ', numEl(numStr(r), to, !r.exact));
  }
  function supPowText(k) { return '2' + ['', '¹', '²', '³', '⁴'][k]; }

  /* the full working for p (parsed number) → base `to` */
  function buildSteps(p, to, places) {
    var all = convertAll(p, places), frag = el('div'), from = p.base;
    if (from === 10) {
      var n = 1;
      if (p.int === '0') frag.appendChild(stepBox(n++, t('st_div_title', { b: to }), t('st_zero_int')));
      else {
        var dv = divTable(p.int, to);
        frag.appendChild(stepBox(n++, t('st_div_title', { b: to }), t('st_div_hint', { b: to }),
          el('div', { class: 'scroll-x' }, dv.table),
          el('p', { class: 'mb0' }, t('read_up') + ' ', numEl(dv.res, to))));
      }
      if (p.frac) {
        var fm = fracMul(p.frac, to, places);
        frag.appendChild(stepBox(n++, t('st_mul_title', { b: to }), t('st_mul_hint', { b: to }),
          el('div', { class: 'scroll-x' }, mulTable(fm.rows, to)),
          el('p', { class: 'mb0' }, t('read_down') + ' ', numEl('0.' + fm.digits, to)),
          el('p', { class: fm.exact ? 'small muted mb0' : 'small mb0 ns-approx-note' },
            fm.exact ? t('st_exact') : t('st_stop_places', { n: places, b: to }))));
        frag.appendChild(stepBox(n++, t('st_combine'), null,
          el('p', { class: 'ns-formula mb0', dir: 'ltr' }, all[to].int + ' + 0.' + fm.digits + ' → ', numEl(numStr(all[to]), to, !all[to].exact))));
      }
    } else if (to === 10) {
      placeSteps(p).forEach(function (s) { frag.appendChild(s); });
    } else if (from === 2) {
      var k = BITS[to];
      frag.appendChild(stepBox(1, t('st_group_title', { k: k }), t('st_group_hint', { pow: to + ' = ' + supPowText(k), k: k, name: baseName(to) }), groupVisual(toBin(p), k)));
    } else if (to === 2) {
      frag.appendChild(stepBox(1, t('st_expand_title', { k: BITS[from], name: baseName(from) }), t('st_expand_hint', { k: BITS[from] }), expandVisual(p)));
    } else {
      var bin = toBin(p);
      frag.appendChild(el('p', { class: 'callout mb0', text: t('st_via_binary') }));
      frag.appendChild(stepBox(1, t('st_expand_title', { k: BITS[from], name: baseName(from) }), t('st_expand_hint', { k: BITS[from] }), expandVisual(p),
        el('p', { class: 'mb0' }, numEl(numStr(bin), 2))));
      frag.appendChild(stepBox(2, t('st_group_title', { k: BITS[to] }), t('st_group_hint', { pow: to + ' = ' + supPowText(BITS[to]), k: BITS[to], name: baseName(to) }), groupVisual(bin, BITS[to])));
    }
    frag.appendChild(el('div', { class: 'ns-step' }, answerLine(p, to, all)));
    return frag;
  }

  /* ================================================================ converter tab */
  var conv = Object.assign({ v: '25', base: 10, places: 8, target: 2 }, store.get('conv', {}));
  if (BASES.indexOf(conv.base) < 0) conv.base = 10;
  conv.places = EDU.clamp(parseInt(conv.places, 10) || 8, 1, 24);
  var EXAMPLES = [['25', 10], ['10.625', 10], ['0.1', 10], ['101101', 2], ['1011.101', 2], ['757', 8], ['3F', 16], ['FACE', 16]];
  var numIn = $('#num-in'), placesIn = $('#places');
  numIn.value = conv.v;
  placesIn.value = conv.places;

  function pickButtons(box, items, cur, onPick) {
    /* the buttons are rebuilt on every render: keep keyboard focus on the same choice */
    var ae = document.activeElement, foc = ae && box.contains(ae) ? ae.dataset.v : null;
    box.innerHTML = '';
    items.forEach(function (it) {
      box.appendChild(el('button', { type: 'button', class: 'btn', 'aria-pressed': String(it.v === cur), dataset: { v: String(it.v) },
        onclick: function () { onPick(it.v); } },
        it.short ? [el('span', { class: 'lg', text: it.label }), el('span', { class: 'sh', text: it.short })] : el('span', { text: it.label }),
        it.sub ? el('small', { text: it.sub, dir: it.subLtr ? 'ltr' : null }) : null));
    });
    if (foc != null) { var fb = box.querySelector('[data-v="' + foc + '"]'); if (fb) fb.focus(); }
  }
  function saveConv() { store.set('conv', conv); }
  function renderConvert() {
    pickButtons($('#from'), BASES.map(function (b) { return { v: b, label: baseName(b), short: b === 16 ? t('base16_short') : null, sub: t('base_n', { n: b }) }; }), conv.base, function (b) {
      conv.base = b; if (conv.target === b) conv.target = b === 10 ? 2 : 10; saveConv(); renderConvert(); numIn.focus();
    });
    var ex = $('#examples'); ex.innerHTML = '';
    EXAMPLES.forEach(function (e) {
      ex.appendChild(el('button', { type: 'button', class: 'chip', dir: 'ltr', dataset: { v: e[0], b: String(e[1]) },
        onclick: function () { numIn.value = e[0]; conv.v = e[0]; conv.base = e[1]; if (conv.target === e[1]) conv.target = e[1] === 10 ? 2 : 10; saveConv(); renderConvert(); } },
        e[0], el('sub', { class: 'ns-sub', text: String(e[1]) })));
    });
    var p = parseNum(numIn.value, conv.base);
    var msg = $('#conv-msg'), res = $('#results'), steps = $('#steps');
    numIn.classList.toggle('bad', !!(p.err && p.err !== 'empty'));
    numIn.setAttribute('aria-invalid', String(!!(p.err && p.err !== 'empty')));
    numIn.inputMode = conv.base === 16 ? 'text' : 'decimal';
    $('#places-wrap').hidden = !(p.ok && p.base === 10 && p.frac);
    res.innerHTML = ''; steps.innerHTML = '';
    if (!p.ok) {
      msg.className = 'ns-msg small' + (p.err === 'empty' ? '' : ' bad');
      msg.textContent = parseErrText(p, conv.base);
      res.appendChild(el('p', { class: 'mb0 ' + (p.err === 'empty' ? 'muted' : 'ns-msg bad'), text: parseErrText(p, conv.base) }));
    } else {
      msg.className = 'ns-msg small muted';
      msg.textContent = t('allowed_digits', { base: baseName(conv.base), d: iso(ALLOWED[conv.base]) });
      var all = convertAll(p, conv.places);
      BASES.forEach(function (b) {
        var r = all[b], s = numStr(r);
        res.appendChild(el('div', { class: 'ns-res-row' + (b === p.base ? ' src' : ''), id: 'res-' + b, dataset: { value: s, exact: String(r.exact) } },
          el('div', { class: 'ns-res-name' }, baseName(b), el('small', { text: t('base_n', { n: b }) })),
          numEl(s, b, !r.exact),
          el('button', { type: 'button', class: 'btn btn-sm btn-ghost no-print', 'aria-label': t('copy') + ': ' + baseName(b), title: t('copy'), text: '⧉',
            onclick: function () { EDU.copy(s); } })));
      });
      if (BASES.some(function (b) { return !all[b].exact; })) res.appendChild(el('p', { class: 'small mb0' }, el('span', { class: 'ns-approx', text: '≈ ' }), t('approx_note', { n: conv.places })));
    }
    var targets = BASES.filter(function (b) { return b !== conv.base; });
    if (targets.indexOf(conv.target) < 0) conv.target = targets[0];
    var arrow = document.documentElement.dir === 'rtl' ? '← ' : '→ ';
    pickButtons($('#target'), targets.map(function (b) { return { v: b, label: arrow + baseName(b), short: b === 16 ? t('base16_short') : baseName(b) }; }), conv.target, function (b) {
      conv.target = b; saveConv(); renderConvert();
    });
    if (p.ok) steps.appendChild(buildSteps(p, conv.target, conv.places));
    else steps.appendChild(el('p', { class: 'muted mb0', text: t('steps_wait') }));
  }
  numIn.addEventListener('input', function () { conv.v = numIn.value; saveConv(); renderConvert(); });
  placesIn.addEventListener('input', function () {
    var v = parseInt(placesIn.value, 10);
    if (!isNaN(v)) { conv.places = EDU.clamp(v, 1, 24); saveConv(); renderConvert(); }
  });
  placesIn.addEventListener('change', function () { placesIn.value = conv.places; });

  function renderChart() {
    var tb = $('#chart'); tb.innerHTML = '';
    tb.appendChild(el('thead', null, el('tr', null, [10, 2, 8, 16].map(function (b) {
      return el('th', null, baseName(b), el('br'), el('small', { class: 'muted', text: t('base_n', { n: b }) }));
    }))));
    var body = el('tbody', { dir: 'ltr' });
    for (var i = 0; i <= 15; i++) {
      body.appendChild(el('tr', null, el('td', { text: String(i) }), el('td', { text: pad(i.toString(2), 4) }), el('td', { text: i.toString(8) }), el('td', { text: DIG[i] })));
    }
    tb.appendChild(body);
  }
  /* print only one block (chart / worksheet) */
  function printOnly(node) {
    var area = $('#print-area');
    area.innerHTML = ''; area.appendChild(node);
    document.body.classList.add('ns-printing');
    window.print();
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('ns-printing'); $('#print-area').innerHTML = ''; });
  $('#chart-print').addEventListener('click', function () {
    printOnly(el('div', null, el('h2', { text: t('chart_title') }), $('#chart').cloneNode(true)));
  });

  /* ================================================================ 8-bit switches */
  var CTRL = ['NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL', 'BS', 'TAB', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI',
    'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB', 'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US'];
  var byte = EDU.clamp(parseInt(store.get('byte', 65), 10) || 0, 0, 255);
  function uPlus(cp) { return 'U+' + pad(cp.toString(16).toUpperCase(), 4); }
  function charInfo(v) {
    if (v === 32) return { big: '␠', note: t('space_char') };
    if (v > 32 && v < 127) return { big: String.fromCharCode(v), note: t('ascii_printable') };
    if (v < 32) return { big: CTRL[v], note: t('ctrl_char') };
    if (v === 127) return { big: 'DEL', note: t('ctrl_char') };
    if (v < 160) return { big: '—', note: t('not_ascii') };
    return { big: String.fromCharCode(v), note: t('not_ascii_uni', { u: uPlus(v) }) };
  }
  function buildBits() {
    var box = $('#bits'); box.innerHTML = '';
    for (var i = 7; i >= 0; i--) {
      (function (bit) {
        box.appendChild(el('div', { class: 'ns-bit' },
          el('span', { class: 'pv', text: String(1 << bit) }),
          el('button', { type: 'button', dataset: { bit: String(bit) }, onclick: function () { setByte(byte ^ (1 << bit)); } }),
          el('span', { class: 'ix', text: 'b' + bit })));
      })(i);
    }
    box.appendChild(el('div', { class: 'ns-nib', id: 'nib-hi' }));
    box.appendChild(el('div', { class: 'ns-nib', id: 'nib-lo' }));
  }
  /* the note under the toy is kept as [key, vars] so it is re-translated on a language change */
  var bitMsg = null;
  function showBitMsg() { $('#bit-msg').textContent = bitMsg ? t(bitMsg[0], bitMsg[1]) : ''; }
  function setByte(v, wrapped) {
    byte = ((v % 256) + 256) % 256;
    store.set('byte', byte);
    bitMsg = wrapped ? ['wrap_note'] : null;
    renderBits();
  }
  function renderBits() {
    $$('#bits button').forEach(function (b) {
      var bit = +b.dataset.bit, on = !!(byte & (1 << bit));
      b.textContent = on ? '1' : '0';
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', t('bit_label', { v: 1 << bit, s: on ? t('bit_on') : t('bit_off') }));
    });
    $('#nib-hi').textContent = DIG[byte >> 4];
    $('#nib-lo').textContent = DIG[byte & 15];
    var on = [];
    for (var i = 7; i >= 0; i--) if (byte & (1 << i)) on.push(1 << i);
    var sum = $('#bit-sum'); sum.innerHTML = '';
    sum.setAttribute('dir', 'ltr');
    sum.appendChild(document.createTextNode(pad(byte.toString(2), 8).replace(/(\d{4})(\d{4})/, '$1 $2') + '₂ = ' + (on.length > 1 ? on.join(' + ') + ' = ' : '')));
    sum.appendChild(el('b', { text: String(byte) }));
    $('#bit-dec').textContent = String(byte);
    $('#bit-hex').textContent = pad(DIG[byte >> 4] + DIG[byte & 15], 2);
    $('#bit-oct').textContent = byte.toString(8);
    var ci = charInfo(byte);
    $('#bit-char').textContent = ci.big;
    $('#bit-note').textContent = ci.note;
    var din = $('#bit-dec-in');
    if (document.activeElement !== din) din.value = byte;
    showBitMsg();
  }
  $('#bit-clear').addEventListener('click', function () { setByte(0); });
  $('#bit-inc').addEventListener('click', function () { setByte(byte + 1, byte === 255); });
  $('#bit-dec1').addEventListener('click', function () { setByte(byte - 1, byte === 0); });
  $('#bit-shl').addEventListener('click', function () { setByte((byte << 1) & 255, byte > 127); });
  $('#bit-shr').addEventListener('click', function () { setByte(byte >> 1); });
  $('#bit-not').addEventListener('click', function () { setByte(~byte & 255); });
  $('#bit-dec-in').addEventListener('input', function () {
    if (this.value === '') return;
    var v = Number(this.value);
    if (!isFinite(v)) return;
    if (v !== Math.floor(v) || v < 0 || v > 255) { bitMsg = ['dec_range']; showBitMsg(); return; }
    setByte(v);
  });
  $('#bit-dec-in').addEventListener('change', function () { this.value = byte; });
  $('#bit-char-in').addEventListener('input', function (e) {
    if (e.isComposing) return;
    /* the newest character typed wins, so typing a, b, c… steps through the letters */
    var chars = Array.from(this.value);
    if (!chars.length) return;
    var ch = chars[chars.length - 1];
    if (chars.length > 1) this.value = ch;
    var cp = ch.codePointAt(0);
    if (cp > 255) { bitMsg = ['char_too_big', { ch: ch, u: uPlus(cp) }]; showBitMsg(); return; }
    setByte(cp);
  });

  /* ================================================================ binary addition */
  var addSt = Object.assign({ a: '1011', b: '111' }, store.get('add', {}));
  var addA = $('#add-a'), addB = $('#add-b');
  addA.value = addSt.a; addB.value = addSt.b;
  function cleanBin(s) { return latinDigits(s).replace(/[\s_]/g, ''); }
  function addBinary(a, b) {
    var n = Math.max(a.length, b.length), A = pad(a, n), Bv = pad(b, n), carry = 0, digits = [], carries = [], cols = [];
    for (var i = n - 1; i >= 0; i--) {
      var x = +A[i], y = +Bv[i], s = x + y + carry;
      carries.unshift(carry);
      cols.push({ n: n - i, x: x, y: y, c: carry, s: s, w: s % 2, o: s >> 1 });
      digits.unshift(s % 2);
      carry = s >> 1;
    }
    if (carry) { digits.unshift(1); carries.unshift(1); }
    return { A: A, B: Bv, sum: digits.join(''), carries: carries, cols: cols, extra: !!carry };
  }
  function renderAdd() {
    var a = cleanBin(addA.value), b = cleanBin(addB.value), msg = $('#add-msg');
    var out = $('#add-out'), cols = $('#add-cols'), check = $('#add-check');
    out.innerHTML = ''; cols.innerHTML = ''; check.textContent = '';
    out.dataset.value = ''; out.dataset.extra = ''; delete check.dataset.sum;
    var bad = [[a, addA], [b, addB]].filter(function (x) { x[1].classList.toggle('bad', !/^[01]*$/.test(x[0])); return !/^[01]+$/.test(x[0]); });
    if (bad.length) {
      var wrong = (a + b).replace(/[01]/g, '');
      msg.className = 'ns-msg small' + (wrong ? ' bad' : '');
      msg.textContent = wrong ? t('err_digit', { c: Array.from(wrong)[0], base: baseName(2), d: iso(ALLOWED[2]) }) : t('add_empty');
      check.hidden = true; $('#add-cols-wrap').hidden = true;
      return;
    }
    if (a.length > 32 || b.length > 32) { msg.className = 'ns-msg small bad'; msg.textContent = t('err_long', { n: 32 }); check.hidden = true; $('#add-cols-wrap').hidden = true; return; }
    msg.textContent = '';
    check.hidden = false; $('#add-cols-wrap').hidden = false;
    var r = addBinary(a, b), w = r.sum.length, n = r.A.length;
    function cells(str, cls) { var arr = []; for (var i = 0; i < w - str.length; i++) arr.push(el('td', { class: 'd' })); for (i = 0; i < str.length; i++) arr.push(el('td', { class: cls || 'd', text: str[i] })); return arr; }
    var carryCells = [];
    for (var i = 0; i < w; i++) {
      var c = r.carries[i];
      carryCells.push(el('td', { class: 'd', text: c ? '1' : '' }));
    }
    var va = bigFrom(a, 2), vb = bigFrom(b, 2), vs = va + vb;
    var table = el('table', { class: 'ns-add', dir: 'ltr', id: 'add-table' },
      el('tr', { class: 'cy' }, el('td', { class: 'lab', text: t('carry') }), carryCells, el('td', { class: 'dec' })),
      el('tr', null, el('td', { class: 'lab' }), cells(r.A), el('td', { class: 'dec', text: '(' + va + ')' })),
      el('tr', null, el('td', { class: 'lab', text: '+' }), cells(r.B), el('td', { class: 'dec', text: '(' + vb + ')' })),
      el('tr', { class: 'sum' }, el('td', { class: 'lab', text: t('sum_label') }), cells(r.sum), el('td', { class: 'dec', text: '(' + vs + ')' })));
    out.appendChild(table);
    out.dataset.value = r.sum;
    out.dataset.extra = String(r.extra);
    r.cols.forEach(function (c) {
      cols.appendChild(el('li', { class: 'ns-ltr-nums', tabindex: '0', dataset: { col: String(c.n) } }, t('col_step', { n: c.n, x: c.x, y: c.y, c: c.c, s: c.s.toString(2), w: c.w, o: c.o })));
    });
    if (r.extra) cols.appendChild(el('li', { text: t('add_extra_bit') }));
    check.textContent = t('add_check', { eq: '⁦' + va + ' + ' + vb + ' = ' + vs + ' ✓⁩' });
    check.dataset.sum = vs.toString();
    /* highlight a column when its explanation is pointed at (mouse), focused (keyboard) or tapped
       (touch: smartboards and phones have no hover, so a tap pins the highlight until tapped again) */
    var pin = 0, hov = 0;
    function paint() {
      $$('#add-table td.hl', out).forEach(function (td) { td.classList.remove('hl'); });
      [pin, hov].forEach(function (col) {
        if (!col) return;
        var idx = w - col + 1;                  /* +1 for the label cell */
        $$('#add-table tr', out).forEach(function (tr) { var td = tr.children[idx]; if (td) td.classList.add('hl'); });
      });
      $$('li[data-col]', cols).forEach(function (li) { li.classList.toggle('on', +li.dataset.col === pin); });
    }
    $$('li[data-col]', cols).forEach(function (li) {
      var col = +li.dataset.col;
      li.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hov = col; paint(); } });
      li.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hov = 0; paint(); } });
      li.addEventListener('focus', function () { var kb = true; try { kb = li.matches(':focus-visible'); } catch (e) { } if (kb) { hov = col; paint(); } });
      li.addEventListener('blur', function () { hov = 0; paint(); });
      li.addEventListener('click', function () { pin = pin === col ? 0 : col; paint(); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); } });
    });
  }
  function saveAdd() { addSt = { a: addA.value, b: addB.value }; store.set('add', addSt); renderAdd(); }
  addA.addEventListener('input', saveAdd);
  addB.addEventListener('input', saveAdd);
  $('#add-rand').addEventListener('click', function () {
    addA.value = EDU.randInt(5, 255).toString(2);
    addB.value = EDU.randInt(3, 127).toString(2);
    saveAdd();
  });

  /* ================================================================ text encoding */
  var SCRIPT_RANGES = [[0x0900, 0x097F, 'deva'], [0xA8E0, 0xA8FF, 'deva'], [0x1CD0, 0x1CFF, 'deva'], [0x0980, 0x09FF, 'beng'], [0x0A00, 0x0A7F, 'guru'],
    [0x0A80, 0x0AFF, 'gujr'], [0x0B00, 0x0B7F, 'orya'], [0x0B80, 0x0BFF, 'taml'], [0x0C00, 0x0C7F, 'telu'], [0x0C80, 0x0CFF, 'knda'],
    [0x0D00, 0x0D7F, 'mlym'], [0x0600, 0x06FF, 'arab'], [0x0750, 0x077F, 'arab'], [0xFB50, 0xFDFF, 'arab'], [0xFE70, 0xFEFF, 'arab']];
  var SAMPLES = ['Hello', 'नमस्ते', 'নমস্কার', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'નમસ્તે', 'ନମସ୍କାର', 'வணக்கம்', 'నమస్తే', 'ನಮಸ್ಕಾರ', 'നമസ്കാരം', 'آداب', '₹ 100 😀'];
  var MATRA = { en: 'कि', hi: 'कि', mr: 'कि', bn: 'কি', pa: 'ਕਿ', gu: 'કિ', or: 'କି', ta: 'கி', te: 'కి', kn: 'ಕಿ', ml: 'കി', ur: 'کِ' };
  var PFX = { 1: [1], 2: [3, 2], 3: [4, 2, 2], 4: [5, 2, 2, 2] };          /* UTF-8 marker bits per byte */
  var SPLIT = { 1: [7], 2: [5, 6], 3: [4, 6, 6], 4: [3, 6, 6, 6] };       /* code-point bits per byte */
  var PATTERN = { 1: ['0'], 2: ['110', '10'], 3: ['1110', '10', '10'], 4: ['11110', '10', '10', '10'] };
  var MAXCH = 300;
  var encSt = store.get('enc', null);
  var encCustom = !!(encSt && encSt.custom);
  var encSel = -1, encText = $('#enc-text');
  if (encCustom) encText.value = String(encSt.text || '');

  function utf8(cp) {
    if (cp >= 0xD800 && cp <= 0xDFFF) cp = 0xFFFD;                    /* lone surrogate → replacement char */
    if (cp < 0x80) return [cp];
    if (cp < 0x800) return [0xC0 | (cp >> 6), 0x80 | (cp & 63)];
    if (cp < 0x10000) return [0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
    return [0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
  }
  function hex2(b) { return pad(b.toString(16).toUpperCase(), 2); }
  function scriptOf(cp) {
    if ((cp >= 65 && cp <= 90) || (cp >= 97 && cp <= 122) || (cp >= 0xC0 && cp <= 0x24F && cp !== 0xD7 && cp !== 0xF7)) return 'latin';
    for (var i = 0; i < SCRIPT_RANGES.length; i++) if (cp >= SCRIPT_RANGES[i][0] && cp <= SCRIPT_RANGES[i][1]) return SCRIPT_RANGES[i][2];
    if (cp >= 0x1F000 || (cp >= 0x2600 && cp <= 0x27BF)) return 'emoji';
    if (cp < 0x100 || (cp >= 0x2000 && cp <= 0x2BFF)) return 'common';
    return 'other';
  }
  var MARK = null;
  try { MARK = new RegExp('\\p{M}', 'u'); } catch (e) { MARK = /[̀-ͯऀ-ःऺ-ॏ॑-ॗॢॣ]/; }
  function glyph(ch, cp) {
    if (cp === 32) return '␠';
    if (cp === 10) return '↵';
    if (cp === 9) return '⇥';
    if (cp < 32 || cp === 127) return '·';
    if (cp === 0x200C) return 'ZWNJ';
    if (cp === 0x200D) return 'ZWJ';
    if (MARK.test(ch)) return '◌' + ch;
    return ch;
  }
  function binBytesEl(bytes, colour) {
    var n = bytes.length, wrap = el('span', { dir: 'ltr', class: 'ns-mono' });
    bytes.forEach(function (b, i) {
      var s = pad(b.toString(2), 8), k = PFX[n][i];
      wrap.appendChild(el('span', { class: 'ns-byte' }, el('span', { class: 'ns-pfx', text: s.slice(0, k) }),
        el('b', { class: colour ? 'p' + i : '', text: s.slice(k) })));
    });
    return wrap;
  }
  function renderHow(chars) {
    var box = $('#enc-how'); box.innerHTML = '';
    if (!chars.length) { box.appendChild(el('p', { class: 'muted mb0', text: t('enc_empty') })); return; }
    var ch = chars[EDU.clamp(encSel, 0, chars.length - 1)], cp = ch.codePointAt(0);
    if (cp >= 0xD800 && cp <= 0xDFFF) cp = 0xFFFD;
    var bytes = utf8(cp), n = bytes.length, total = SPLIT[n].reduce(function (a, b) { return a + b; }, 0);
    var bits = pad(cp.toString(2), total), groups = [], pos = 0;
    SPLIT[n].forEach(function (len) { groups.push(bits.substr(pos, len)); pos += len; });
    box.appendChild(el('h2', { class: 'ns-h' }, t(n === 1 ? 'enc_how_one' : 'enc_how', { u: uPlus(cp), n: n }), ' ', el('span', { class: 'no-i18n', style: { color: 'var(--accent)' }, text: glyph(ch, cp) })));
    box.appendChild(el('p', { class: 'mb0', text: '1. ' + t('enc_how_1', { bits: total }) }));
    box.appendChild(el('div', { class: 'ns-bitrow' }, uPlus(cp) + ' = ', groups.map(function (g, i) { return [el('b', { class: 'p' + i, text: g }), ' ']; })));
    box.appendChild(el('p', { class: 'mb0', text: '2. ' + t('enc_how_2') }));
    box.appendChild(el('div', { class: 'ns-bitrow' }, PATTERN[n].map(function (p, i) { return el('span', { class: 'ns-byte' }, el('span', { class: 'ns-pfx', text: p }), 'x'.repeat(8 - p.length)); })));
    box.appendChild(el('div', { class: 'ns-bitrow' }, '→ ', binBytesEl(bytes, true)));
    box.appendChild(el('p', { class: 'mb0', text: '3. ' + t('enc_how_3') }));
    box.appendChild(el('div', { class: 'ns-bitrow', id: 'enc-how-hex' }, bytes.map(function (b, i) { return [i ? ' ' : '', el('span', { class: 'ns-byte', text: hex2(b) })]; })));
  }
  function renderEnc() {
    if (!encCustom) encText.value = t('enc_sample');
    var chars = Array.from(encText.value), shown = chars.slice(0, MAXCH), counts = [0, 0, 0, 0, 0], totalBytes = 0;
    chars.forEach(function (c) { var k = utf8(c.codePointAt(0)).length; counts[k]++; totalBytes += k; });
    $('#enc-n').textContent = String(chars.length);
    $('#enc-bytes').textContent = String(totalBytes);
    $('#enc-u32').textContent = String(chars.length * 4);
    var leg = $('#enc-legend'); leg.innerHTML = '';
    [1, 2, 3, 4].forEach(function (k) { leg.appendChild(el('span', { class: 'badge n' + k }, t('enc_nbytes', { n: k }) + ': ' + counts[k])); });
    if (encSel < 0 || encSel >= shown.length) {
      encSel = 0;
      for (var i = 0; i < shown.length; i++) if (utf8(shown[i].codePointAt(0)).length >= 3) { encSel = i; break; }
    }
    var strip = $('#enc-strip'), body = $('#enc-table tbody');
    strip.innerHTML = ''; body.innerHTML = '';
    shown.forEach(function (ch, i) {
      var cp = ch.codePointAt(0), bytes = utf8(cp), g = glyph(ch, cp);
      strip.appendChild(el('button', { type: 'button', class: 'ns-ch n' + bytes.length, 'aria-pressed': String(i === encSel), dataset: { i: String(i), bytes: bytes.map(hex2).join(' ') },
        onclick: function () { encSel = i; $$('#enc-strip .ns-ch').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.i === i)); }); renderHow(shown); } },
        el('span', { class: 'g no-i18n', text: g }), el('span', { class: 'h', text: uPlus(cp) }), el('span', { class: 'h', text: bytes.map(hex2).join(' ') })));
      body.appendChild(el('tr', null,
        el('td', { class: 'g no-i18n', text: g }),
        el('td', { class: 'c' }, uPlus(cp), el('br'), el('small', { class: 'muted', text: String(cp) })),
        el('td', { text: t('script_' + scriptOf(cp)) }),
        el('td', { class: 'c', text: bytes.map(hex2).join(' ') }),
        el('td', { class: 'c' }, binBytesEl(bytes, false)),
        el('td', { class: 'c', text: String(bytes.length) })));
    });
    $('#enc-limit').textContent = chars.length > MAXCH ? t('enc_limit', { n: MAXCH }) : '';
    if (!chars.length) strip.appendChild(el('p', { class: 'muted mb0', text: t('enc_empty') }));
    renderHow(shown);
    var ex = MATRA[EDU.lang] || MATRA.hi;
    $('#matra-note').textContent = t('matra_note', { x: ex, parts: Array.from(ex).map(function (c) { var cp = c.codePointAt(0); return glyph(c, cp) + ' (' + uPlus(cp) + ')'; }).join(' + ') });
  }
  function renderRules() {
    var rows = [['U+0000 – U+007F', 1, 'A 7 @'], ['U+0080 – U+07FF', 2, 'é ب'], ['U+0800 – U+FFFF', 3, 'क க ₹'], ['U+10000 – U+10FFFF', 4, '😀']];
    var body = $('#utf8-rules tbody'); body.innerHTML = '';
    rows.forEach(function (r) {
      body.appendChild(el('tr', { style: r[1] === 3 ? { background: 'var(--accent-soft)' } : null },
        el('td', { dir: 'ltr', text: r[0] }), el('td', { text: String(r[1]) }),
        el('td', { dir: 'ltr' }, PATTERN[r[1]].map(function (p) { return el('span', { class: 'ns-byte' }, el('span', { class: 'ns-pfx', text: p }), 'x'.repeat(8 - p.length)); })),
        el('td', { text: r[2] })));
    });
  }
  encText.addEventListener('input', function () { encCustom = true; encSel = -1; store.set('enc', { custom: true, text: encText.value }); renderEnc(); });
  SAMPLES.forEach(function (s) {
    $('#enc-samples').appendChild(el('button', { type: 'button', class: 'chip', text: s, onclick: function () {
      encText.value = s; encCustom = true; encSel = -1; store.set('enc', { custom: true, text: s }); renderEnc();
    } }));
  });

  /* ================================================================ practice quiz */
  var LEVELS = ['easy', 'med', 'hard', 'frac'];
  var LVL_SUB = { easy: '2–31', med: '16–255', hard: '256–4095', frac: '5.625' };
  var quiz = Object.assign({ level: 'easy', c: 0, n: 0, streak: 0, best: 0 }, store.get('quiz', {}));
  if (LEVELS.indexOf(quiz.level) < 0) quiz.level = 'easy';
  var q = null, answered = false, answeredAt = 0, fbState = null, qAns = $('#q-ans');

  function makeQ(level) {
    var pairs;
    if (level === 'easy') pairs = [[10, 2], [2, 10], [2, 8], [8, 2], [2, 16], [16, 2]];
    else if (level === 'frac') pairs = [[10, 2], [2, 10], [2, 8], [8, 2], [2, 16], [16, 2], [8, 10], [16, 10]];
    else pairs = [[10, 2], [2, 10], [2, 8], [8, 2], [2, 16], [16, 2], [10, 8], [8, 10], [10, 16], [16, 10], [8, 16], [16, 8]];
    var pr = EDU.pick(pairs), p10;
    if (level === 'frac') {
      p10 = { ok: true, base: 10, int: String(EDU.randInt(1, 31)), frac: pad(String(EDU.randInt(1, 7) * 125), 3).replace(/0+$/, '') };
    } else {
      var lim = { easy: [2, 31], med: [16, 255], hard: [256, 4095] }[level];
      p10 = { ok: true, base: 10, int: String(EDU.randInt(lim[0], lim[1])), frac: '' };
    }
    var all = convertAll(p10, 12);
    return { from: pr[0], to: pr[1], num: numStr(all[pr[0]]), ans: numStr(all[pr[1]]), val: numStr(p10) };
  }
  function newQ() {
    var prev = q, tries = 0;
    do { q = makeQ(quiz.level); tries++; } while (prev && q.num === prev.num && q.from === prev.from && tries < 10);
    answered = false; fbState = null;
    qAns.value = '';
    $('#q-work').hidden = true; $('#q-work').innerHTML = '';
    renderQuiz();
  }
  function showWork() {
    var w = $('#q-work');
    w.innerHTML = '';
    w.appendChild(el('div', { class: 'panel' }, buildSteps(parseNum(q.num, q.from), q.to, 12)));
    w.hidden = false;
  }
  function checkQ() {
    if (!q) return;
    /* Check turns into Next in the same spot: ignore a double tap / held Enter so the feedback is not skipped */
    if (answered) { if (Date.now() - answeredAt < 700) return; newQ(); qAns.focus(); return; }
    var p = parseNum(qAns.value, q.to);
    if (!p.ok) { fbState = { kind: 'err', p: p }; renderFb(); return; }
    answered = true; answeredAt = Date.now();
    var ok = numStr(p) === q.ans;
    quiz.n++;
    if (ok) { quiz.c++; quiz.streak++; quiz.best = Math.max(quiz.best, quiz.streak); } else quiz.streak = 0;
    store.set('quiz', quiz);
    fbState = { kind: ok ? 'ok' : 'bad' };
    if (!ok) showWork();
    renderQuiz();
  }
  function renderFb() {
    var fb = $('#q-fb'); fb.innerHTML = '';
    fb.className = 'ns-fb';
    fb.dataset.result = fbState ? fbState.kind : '';
    $('#q-show-work').hidden = !(answered && fbState && fbState.kind === 'ok' && $('#q-work').hidden);
    if (!fbState) return;
    if (fbState.kind === 'err') { fb.classList.add('bad'); fb.textContent = parseErrText(fbState.p, q.to); return; }
    if (fbState.kind === 'ok') { fb.classList.add('ok'); fb.append(t('correct') + ' ', numEl(q.num, q.from), ' = ', numEl(q.ans, q.to)); }
    else { fb.classList.add('bad'); fb.append(t('wrong') + (STOP[EDU.lang] || '.') + ' ' + t('right_answer') + ' ', numEl(q.ans, q.to)); }
  }
  function renderQuiz() {
    pickButtons($('#levels'), LEVELS.map(function (l) { return { v: l, label: t('lvl_' + l), sub: LVL_SUB[l], subLtr: true }; }), quiz.level, function (l) {
      quiz.level = l; store.set('quiz', quiz); newQ();
    });
    var sc = $('#q-score'); sc.innerHTML = '';
    sc.appendChild(el('span', { class: 'badge primary', id: 'q-score-n', dataset: { c: String(quiz.c), n: String(quiz.n) } }, t('score_line', { c: quiz.c, n: quiz.n })));
    sc.appendChild(el('span', { class: 'badge accent' }, t('streak', { n: quiz.streak })));
    sc.appendChild(el('span', { class: 'badge success' }, t('best_streak', { n: quiz.best })));
    if (!q) return;
    $('#q-text').textContent = t('q_text', { from: baseName(q.from), to: baseName(q.to) });
    var show = $('#q-show'); show.innerHTML = '';
    show.dataset.num = q.num; show.dataset.from = String(q.from); show.dataset.to = String(q.to);
    show.append(pretty(q.num, q.from), el('sub', { text: String(q.from) }), ' = ', el('span', { class: 'qm', text: answered ? '' : '?' }),
      answered ? pretty(q.ans, q.to) : '', el('sub', { text: String(q.to) }));
    $('#q-ans-l').textContent = t('your_answer', { base: baseName(q.to), d: iso(ALLOWED[q.to]) });
    qAns.inputMode = q.to === 16 ? 'text' : 'decimal';
    $('#q-check').textContent = answered ? t('next') : t('check');
    $('#q-check').dataset.mode = answered ? 'next' : 'check';
    $('#q-next').hidden = answered;
    renderFb();
    if (!$('#q-work').hidden) showWork();
  }
  $('#q-check').addEventListener('click', checkQ);
  $('#q-next').addEventListener('click', function () { newQ(); qAns.focus(); });
  qAns.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); checkQ(); } });
  $('#q-show-work').addEventListener('click', function () { showWork(); renderFb(); });
  $('#q-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    quiz.c = 0; quiz.n = 0; quiz.streak = 0; quiz.best = 0; store.set('quiz', quiz); newQ();
  });
  $('#ws-print').addEventListener('click', function () {
    var qs = [], seen = {};
    /* 12 different questions; for the first 300 tries also avoid asking about the same number twice */
    for (var i = 0; qs.length < 12 && i < 400; i++) {
      var w = makeQ(quiz.level), key = w.num + '|' + w.from + '|' + w.to;
      if (seen[key] || (i < 300 && seen['v' + w.val])) continue;
      seen[key] = 1; seen['v' + w.val] = 1; qs.push(w);
    }
    printOnly(el('div', { class: 'ns-ws' },
      el('h2', { text: t('ws_title') + ' · ' + t('lvl_' + quiz.level) }),
      el('p', { text: t('ws_name_line') }),
      el('p', { class: 'muted', text: t('ws_instr') }),
      el('ol', { dir: 'ltr' }, qs.map(function (w) { return el('li', null, numEl(w.num, w.from, false, 'x'), ' = ________', el('sub', { text: String(w.to) })); })),
      el('div', { class: 'key' }, el('h3', { text: t('ws_answers') }),
        el('ol', { dir: 'ltr' }, qs.map(function (w) { return el('li', null, numEl(w.num, w.from, false, 'x'), ' = ', numEl(w.ans, w.to, false, 'x')); })))));
  });

  /* ================================================================ tabs + start */
  var TABS = ['convert', 'bits', 'add', 'text', 'quiz'];
  var tab = store.get('tab', 'convert');
  if (TABS.indexOf(tab) < 0) tab = 'convert';
  function showTab(name, focus) {
    tab = name; store.set('tab', name);
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.dataset.tab === name;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    TABS.forEach(function (n) { $('#p-' + n).hidden = n !== name; });
  }
  $$('#tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      if (document.documentElement.dir === 'rtl') d = -d;
      e.preventDefault();
      showTab(TABS[(TABS.indexOf(tab) + d + TABS.length) % TABS.length], true);
    });
  });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen(); });

  function renderAll() {
    renderConvert(); renderChart(); renderBits(); renderAdd(); renderEnc(); renderRules(); renderQuiz();
  }
  buildBits();
  q = makeQ(quiz.level);
  renderAll();
  showTab(tab);
  EDU.onLang(renderAll);
})();
