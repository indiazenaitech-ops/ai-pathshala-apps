/* Shopping Calculator: discount, pack comparison, offers, fuel and trip cost.
   Everything is worked out on the device; nothing is sent anywhere. */
(function () {
  'use strict';
  var $ = EDU.$, $$ = EDU.$$;
  var store = EDU.store('shopping-calculator');
  var MAX = 1e12, MAX_PACKS = 5, MIN_PACKS = 2;

  function defaults() {
    return {
      tab: 'disc',
      d: { mode: 'pct', mrp: '1999', pct: '40', extra: '10', flat: '500', paid: '1299' },
      packs: [{ p: '62', q: '500', u: 'g' }, { p: '115', q: '1', u: 'kg' }],
      o: { mode: 'bogo', price: '120', x: '2', y: '1', z: '50' },
      f: { mode: 'trip', unit: 'l', dist: '280', mil: '18', price: '104.5', n: '4', odo1: '12450', odo2: '12890', fuel: '25' }
    };
  }
  var state;
  function load() {
    var d = defaults(), s = store.get('state', null);
    if (!s || typeof s !== 'object') return d;
    try {
      ['d', 'o', 'f'].forEach(function (g) { if (s[g] && typeof s[g] === 'object') Object.keys(d[g]).forEach(function (k) { if (typeof s[g][k] === 'string') d[g][k] = s[g][k].slice(0, 20); }); });
      if (Array.isArray(s.packs) && s.packs.length >= MIN_PACKS) {
        d.packs = s.packs.slice(0, MAX_PACKS).map(function (r) { return { p: String(r && r.p || '').slice(0, 20), q: String(r && r.q || '').slice(0, 20), u: UNITS[r && r.u] ? r.u : 'g' }; });
      }
      if (['disc', 'pack', 'offer', 'fuel'].indexOf(s.tab) >= 0) d.tab = s.tab;
      if (['pct', 'flat', 'rev'].indexOf(d.d.mode) < 0) d.d.mode = 'pct';
      if (['bogo', 'second'].indexOf(d.o.mode) < 0) d.o.mode = 'bogo';
      if (['trip', 'mil'].indexOf(d.f.mode) < 0) d.f.mode = 'trip';
      if (['l', 'kg'].indexOf(d.f.unit) < 0) d.f.unit = 'l';
    } catch (e) { return defaults(); }
    return d;
  }
  var saveTimer = 0;
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { store.set('state', state); }, 150); }

  /* ---------------- maths (also used by the test) ---------------- */
  /* per = how many of this unit make one base unit (1000 g = 1 kg). Dividing by a whole number keeps
     results exact: 33 for 300 g = 33 × 1000 ÷ 300 = 110 per kg, not 110.00000000000001. */
  var UNITS = {
    g: { dim: 'w', per: 1000 }, kg: { dim: 'w', per: 1 },
    ml: { dim: 'v', per: 1000 }, l: { dim: 'v', per: 1 },
    pc: { dim: 'c', per: 1 },
    cm: { dim: 'len', per: 100 }, m: { dim: 'len', per: 1 }
  };
  var BASE = { w: 'kg', v: 'l', c: 'pc', len: 'm' };
  /* round to paise, half up (the tiny nudge fixes cases like 1.005 that are stored as 1.00499…) */
  function r2(x) { return Math.round(x * 100 + 1e-7) / 100; }
  var M = {
    r2: r2,
    discount: function (mrp, pct, extra) {
      var p1 = mrp * (1 - pct / 100), pay = p1 * (1 - (extra || 0) / 100);
      return { p1: r2(p1), pay: r2(pay), save: r2(mrp - r2(pay)), eff: mrp ? (mrp - pay) / mrp * 100 : 0 };
    },
    flat: function (mrp, off) { return { pay: r2(mrp - off), save: r2(off), eff: off / mrp * 100 }; },
    reverse: function (mrp, paid) { return { save: r2(mrp - paid), eff: (mrp - paid) / mrp * 100 }; },
    unitPrice: function (price, qty, unit) { return price * UNITS[unit].per / qty; },
    baseQty: function (qty, unit) { return qty / UNITS[unit].per; },
    bogo: function (price, x, y) { var t = x + y; return { pay: r2(price * x), total: t, eff: y / t * 100, each: r2(price * x / t) }; },
    second: function (price, z) { var p2 = price * (1 - z / 100), pay = price + p2; return { p2: r2(p2), pay: r2(pay), each: r2(pay / 2), eff: z / 2 }; },
    trip: function (dist, mil, price, n) { var fuel = dist / mil, cost = r2(fuel * price); return { fuel: fuel, cost: cost, perKm: price / mil, each: r2(cost / (n || 1)) }; },
    mileage: function (odo1, odo2, fuel) { return (odo2 - odo1) / fuel; }
  };
  window.SHOPCALC = M;
  state = load();

  /* ---------------- helpers ---------------- */
  /* digits typed on an Indian-language or Urdu keyboard (०-९, ০-৯, ௦-௯, ۰-۹ ...) count as 0-9 */
  var ZEROS = [0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0x660, 0x6F0];
  var NATIVE = /[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g;
  function westernDigits(s) {
    return s.replace(NATIVE, function (c) {
      var x = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (x >= ZEROS[i] && x <= ZEROS[i] + 9) return String(x - ZEROS[i]);
      return c;
    }).replace(/٫/g, '.');
  }
  function num(s) {
    s = westernDigits(String(s == null ? '' : s)).replace(/[,\s₹%٪٬،]/g, '');
    if (s === '') return null;
    if (!/^[-−]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s.replace('−', '-'));
  }
  /* returns an error key, or '' when the number is usable */
  function bad(v, zeroOK) {
    if (v === null) return 'err_fill';
    if (isNaN(v)) return 'err_num';
    if (v < 0) return 'err_neg';
    if (v === 0 && !zeroOK) return 'err_zero';
    if (v > MAX) return 'err_big';
    return '';
  }
  function n2(x, max) { return Number(x).toLocaleString('en-IN', { maximumFractionDigits: max == null ? 2 : max }); }
  function money(x) {
    x = r2(x);
    return '₹' + x.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 });
  }
  /* a rate below ₹1 (pins, paper cups) keeps up to 4 decimals, so ₹0.03 and ₹0.034 per piece do not both show as ₹0.03 */
  function rate(x) {
    if (x > 0 && x < 1) return '₹' + x.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return money(x);
  }
  /* In Urdu (right to left) keep every run of numbers and maths reading left to right. */
  function T(key, vars) {
    var s = EDU.t(key, vars);
    if (EDU.lang === 'ur') s = s.replace(/[0-9A-Za-z₹(][0-9A-Za-z₹%÷×=+−.,:()\/ -]*[0-9A-Za-z%)]|[0-9]/g, function (m) { return '⁦' + m + '⁩'; });
    return s;
  }
  function setText(id, txt) { var e = $('#' + id); e.textContent = txt || ''; e.hidden = !txt; }
  function setLines(id, lines) {
    var e = $('#' + id); e.textContent = '';
    lines.forEach(function (l) { e.appendChild(EDU.el('p', { text: l })); });
    e.hidden = !lines.length;
  }
  function show(prefix, errKey) {
    var e = $('#' + prefix + '-err'), ok = $('#' + prefix + '-ok');
    e.hidden = !errKey; ok.hidden = !!errKey;
    e.textContent = errKey ? T(errKey) : '';
  }
  function mark(id, isBad) { var e = $('#' + id); if (e) e.classList.toggle('bad', !!isBad); }
  function get(path) { var p = path.split('.'); return state[p[0]][p[1]]; }
  function set(path, v) { var p = path.split('.'); state[p[0]][p[1]] = v; }
  /* check several fields in order: [id, value, zeroOK]; marks the bad ones, returns the first error */
  function checkAll(list) {
    var first = '';
    list.forEach(function (it) { var e = bad(it[1], it[2]); mark(it[0], e && e !== 'err_fill'); if (e && !first) first = e; });
    var real = '';
    list.forEach(function (it) { var e = bad(it[1], it[2]); if (e && e !== 'err_fill' && !real) real = e; });
    return real || first;
  }

  /* ---------------- 1. discount ---------------- */
  function calcDisc() {
    var d = state.d, mrp = num(d.mrp), e;
    ['d-mrp', 'd-pct', 'd-extra', 'd-flat', 'd-paid'].forEach(function (i) { mark(i, false); });
    if (d.mode === 'pct') {
      var pct = num(d.pct), ex = num(d.extra); if (ex === null) ex = 0;
      e = checkAll([['d-mrp', mrp], ['d-pct', pct, true], ['d-extra', ex, true]]);
      if (!e && pct > 100) { e = 'err_pct'; mark('d-pct', true); }
      if (!e && ex > 100) { e = 'err_pct'; mark('d-extra', true); }
      if (e) return show('d', e);
      var r = M.discount(mrp, pct, ex);
      show('d', '');
      setText('d-lbl', T('r_pay')); setText('d-out', money(r.pay)); setText('d-save', T('r_save', { a: money(r.save) }));
      var lines = [T('w_pct', { d: n2(pct, 4), mrp: money(mrp), a: money(mrp - r.p1), pay: money(r.p1) })];
      if (ex > 0) {
        lines.push(T('w_extra', { e: n2(ex, 4), p1: money(r.p1), b: money(r.p1 - r.pay), pay: money(r.pay) }));
        /* "in total X% off, not Y%" only makes sense when the two really differ (not for 0% + 10%) */
        if (n2(r.eff) !== n2(pct + ex)) lines.push(T('w_total', { eff: n2(r.eff), sum: n2(pct + ex) }));
      }
      setLines('d-work', lines);
    } else if (d.mode === 'flat') {
      var off = num(d.flat);
      e = checkAll([['d-mrp', mrp], ['d-flat', off, true]]);
      if (!e && off > mrp) { e = 'err_flat'; mark('d-flat', true); }
      if (e) return show('d', e);
      var rf = M.flat(mrp, off);
      show('d', '');
      setText('d-lbl', T('r_pay')); setText('d-out', money(rf.pay)); setText('d-save', T('r_save', { a: money(rf.save) }));
      setLines('d-work', [T('w_flat', { mrp: money(mrp), flat: money(off), pay: money(rf.pay), eff: n2(rf.eff) })]);
    } else {
      var paid = num(d.paid);
      e = checkAll([['d-mrp', mrp], ['d-paid', paid, true]]);
      if (!e && paid > mrp) { e = 'err_paid'; mark('d-paid', true); }
      if (e) return show('d', e);
      var rr = M.reverse(mrp, paid);
      show('d', '');
      setText('d-lbl', T('r_disc')); setText('d-out', n2(rr.eff) + '%'); setText('d-save', T('r_save', { a: money(rr.save) }));
      setLines('d-work', [T('w_rev', { mrp: money(mrp), paid: money(paid), save: money(rr.save), eff: n2(rr.eff) })]);
    }
  }

  /* ---------------- 2. packs ---------------- */
  var UNIT_ORDER = ['g', 'kg', 'ml', 'l', 'pc', 'cm', 'm'];
  function buildPacks() {
    var box = $('#pk-rows'); box.textContent = '';
    state.packs.forEach(function (r, i) {
      var sel = EDU.el('select', { id: 'pk-u-' + i, 'aria-label': EDU.t('l_unit') });
      UNIT_ORDER.forEach(function (u) { var o = EDU.el('option', { value: u, text: EDU.t('u_' + u) }); if (u === r.u) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', function () { r.u = sel.value; save(); calcPacks(); });
      var ip = EDU.el('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', id: 'pk-p-' + i, value: r.p });
      var iq = EDU.el('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', id: 'pk-q-' + i, value: r.q });
      ip.addEventListener('input', function () { r.p = ip.value; save(); calcPacks(); });
      iq.addEventListener('input', function () { r.q = iq.value; save(); calcPacks(); });
      var head = EDU.el('div', { class: 'sc-pack-head' },
        EDU.el('span', {}, EDU.el('span', { text: EDU.t('pack_n', { n: i + 1 }) }), ' ', EDU.el('span', { class: 'badge success', id: 'pk-badge-' + i, text: EDU.t('cheapest'), hidden: 'hidden' })));
      if (state.packs.length > MIN_PACKS) {
        head.appendChild(EDU.el('button', { type: 'button', class: 'btn btn-ghost btn-sm sc-del', id: 'pk-del-' + i, 'aria-label': EDU.t('del_pack', { n: i + 1 }), text: '✕',
          onclick: function () { state.packs.splice(i, 1); save(); buildPacks(); calcPacks(); } }));
      }
      box.appendChild(EDU.el('div', { class: 'sc-pack', id: 'pk-row-' + i }, head,
        EDU.el('div', { class: 'sc-pack-row' },
          EDU.el('label', { class: 'field' }, EDU.el('span', { text: EDU.t('l_price') }), ip),
          EDU.el('label', { class: 'field' }, EDU.el('span', { text: EDU.t('l_qty') }), iq),
          EDU.el('label', { class: 'field' }, EDU.el('span', { text: EDU.t('l_unit') }), sel)),
        EDU.el('div', { class: 'sc-up', id: 'pk-up-' + i })));
    });
    $('#pk-add').hidden = state.packs.length >= MAX_PACKS;
  }
  function calcPacks() {
    var rows = [], err = '', real = '';
    state.packs.forEach(function (r, i) {
      var p = num(r.p), q = num(r.q);
      $('#pk-row-' + i).classList.remove('best'); $('#pk-badge-' + i).hidden = true; $('#pk-up-' + i).textContent = '';
      mark('pk-p-' + i, false); mark('pk-q-' + i, false);
      if (p === null && q === null) return;                 /* an empty row is simply skipped */
      var e1 = bad(p), e2 = bad(q);
      mark('pk-p-' + i, e1 && e1 !== 'err_fill'); mark('pk-q-' + i, e2 && e2 !== 'err_fill');
      [e1, e2].forEach(function (e) { if (e && e !== 'err_fill' && !real) real = e; if (e && !err) err = e; });
      if (e1 || e2) return;
      var u = UNITS[r.u];
      rows.push({ i: i, p: p, q: q, u: r.u, dim: u.dim, baseQty: M.baseQty(q, r.u), up: M.unitPrice(p, q, r.u) });
    });
    err = real || err;
    if (!err && rows.length < 2) err = 'err_two';
    if (!err && rows.some(function (r) { return r.dim !== rows[0].dim; })) err = 'err_units';
    if (!err && rows.some(function (r) { return !isFinite(r.up) || r.up > MAX; })) err = 'err_big';
    if (err) return show('pk', err);
    var base = BASE[rows[0].dim], per = EDU.t('per_' + base), best = rows[0];
    rows.forEach(function (r) { if (r.up < best.up) best = r; });
    /* two packs count as the same price when they show the same price per unit (or differ by under 0.005%) */
    function pct(r) { return (r.up - best.up) / r.up * 100; }
    function same(r) { return rate(r.up) === rate(best.up) || n2(pct(r)) === '0'; }
    rows.forEach(function (r) {
      $('#pk-up-' + r.i).textContent = T('up_line', { p: rate(r.up), per: per });
      if (same(r)) { $('#pk-row-' + r.i).classList.add('best'); $('#pk-badge-' + r.i).hidden = false; }
    });
    show('pk', '');
    setText('pk-out', T('up_line', { p: rate(best.up), per: per }));
    setText('pk-best', T('pack_best', { n: best.i + 1 }));
    setLines('pk-cmp', rows.filter(function (r) { return r !== best; }).map(function (r) {
      if (same(r)) return T('pack_same', { n: r.i + 1 });
      return T('pack_cmp', { pc: n2(pct(r)), n: r.i + 1 });
    }));
    setLines('pk-work', rows.map(function (r) {
      return T('w_pack', { n: r.i + 1, price: money(r.p), q: n2(r.baseQty, r.baseQty < 0.001 ? 8 : 4) + ' ' + EDU.t('u_' + base), p: rate(r.up), per: per });
    }));
  }

  /* ---------------- 3. offers ---------------- */
  function isWhole(v) { return v !== null && !isNaN(v) && Math.floor(v) === v; }
  function calcOffer() {
    var o = state.o, price = num(o.price), e;
    ['o-price', 'o-x', 'o-y', 'o-z'].forEach(function (i) { mark(i, false); });
    if (o.mode === 'bogo') {
      var x = num(o.x), y = num(o.y);
      e = checkAll([['o-price', price], ['o-x', x], ['o-y', y]]);
      if (!e && (!isWhole(x) || !isWhole(y))) { e = 'err_whole'; mark('o-x', !isWhole(x)); mark('o-y', !isWhole(y)); }
      if (!e && (x > 1000 || y > 1000)) { e = 'err_big'; mark('o-x', x > 1000); mark('o-y', y > 1000); }
      if (e) return show('o', e);
      var r = M.bogo(price, x, y);
      show('o', '');
      setText('o-out', n2(r.eff) + '%'); setText('o-per', T('r_each', { a: money(r.each) }));
      setLines('o-work', [T('w_bogo', { x: n2(x), t: n2(r.total), y: n2(y), eff: n2(r.eff), pay: money(r.pay), each: money(r.each) })]);
    } else {
      var z = num(o.z);
      e = checkAll([['o-price', price], ['o-z', z, true]]);
      if (!e && z > 100) { e = 'err_pct'; mark('o-z', true); }
      if (e) return show('o', e);
      var s = M.second(price, z);
      show('o', '');
      setText('o-out', n2(s.eff) + '%'); setText('o-per', T('r_each', { a: money(s.each) }));
      setLines('o-work', [T('w_second', { p: money(price), p2: money(s.p2), pay: money(s.pay), each: money(s.each), eff: n2(s.eff), z: n2(z, 4) })]);
    }
  }

  /* ---------------- 4. fuel ---------------- */
  function calcFuel() {
    var f = state.f, u = f.unit, uLbl = EDU.t('u_' + u), kmPer = EDU.t(u === 'l' ? 'unit_kmpl' : 'unit_kmpkg'), e;
    $('#f-mil-lbl').textContent = EDU.t(u === 'l' ? 'l_mil_l' : 'l_mil_kg');
    $('#f-price-lbl').textContent = EDU.t(u === 'l' ? 'l_fprice_l' : 'l_fprice_kg');
    $('#m-fuel-lbl').textContent = EDU.t(u === 'l' ? 'l_filled_l' : 'l_filled_kg');
    ['f-dist', 'f-mil', 'f-price', 'f-n', 'm-odo1', 'm-odo2', 'm-fuel'].forEach(function (i) { mark(i, false); });
    $('#m-use').hidden = true;
    if (f.mode === 'trip') {
      var dist = num(f.dist), mil = num(f.mil), price = num(f.price), n = num(f.n); if (n === null) n = 1;
      e = checkAll([['f-dist', dist], ['f-mil', mil], ['f-price', price], ['f-n', n]]);
      if (!e && (!isWhole(n) || n > 1000)) { e = 'err_people'; mark('f-n', true); }
      if (!e && !(dist / mil * price <= MAX)) e = 'err_big';
      if (e) return show('f', e);
      var r = M.trip(dist, mil, price, n);
      show('f', '');
      setText('f-lbl', T('r_cost')); setText('f-out', money(r.cost));
      setText('f-fuel', T('r_fuel', { a: n2(r.fuel) + ' ' + uLbl }));
      setText('f-perkm', T('r_perkm', { a: money(r.perKm) }));
      setText('f-each', n > 1 ? T('r_share', { n: n2(n), a: money(r.each) }) : '');
      /* the cost line works from the distance itself (not the rounded litres), so the sum on screen is exact */
      setLines('f-work', [T('w_trip', { d: n2(dist, 4), m: n2(mil, 4), f: n2(r.fuel) + ' ' + uLbl, p: money(price), c: money(r.cost) })]);
    } else {
      var a = num(f.odo1), b = num(f.odo2), fuel = num(f.fuel);
      e = checkAll([['m-odo1', a, true], ['m-odo2', b], ['m-fuel', fuel]]);
      if (!e && b <= a) { e = 'err_odo'; mark('m-odo2', true); }
      if (!e && !((b - a) / fuel <= MAX)) e = 'err_big';
      if (e) return show('f', e);
      var m = M.mileage(a, b, fuel);
      show('f', '');
      setText('f-lbl', T('r_mil')); setText('f-out', n2(m) + ' ' + kmPer);
      setText('f-fuel', ''); setText('f-perkm', ''); setText('f-each', '');
      setLines('f-work', [T('w_mil', { a: n2(a, 4), b: n2(b, 4), d: n2(b - a, 4), f: n2(fuel, 4) + ' ' + uLbl, m: n2(m) + ' ' + kmPer })]);
      $('#m-use').hidden = false;
    }
  }

  /* ---------------- shell ---------------- */
  function syncInputs() {
    $$('[data-k]').forEach(function (el) { var v = get(el.dataset.k); if (el.value !== v) el.value = v; });
  }
  function render() {
    ['disc', 'pack', 'offer', 'fuel'].forEach(function (t) {
      $('#tab-' + t).setAttribute('aria-selected', state.tab === t ? 'true' : 'false');
      $('#pane-' + t).hidden = state.tab !== t;
    });
    $$('[data-set]').forEach(function (b) { b.setAttribute('aria-pressed', get(b.dataset.set) === b.dataset.val ? 'true' : 'false'); });
    $$('[data-show]').forEach(function (el) { var c = el.dataset.show.split('='); el.hidden = get(c[0]) !== c[1]; });
    calcDisc(); calcPacks(); calcOffer(); calcFuel();
  }

  EDU.init({ slug: 'shopping-calculator', title: 'app_title', waKey: 'shell_wa_tool' });

  $$('.sc-tabs button').forEach(function (b) { b.addEventListener('click', function () { state.tab = b.dataset.tab; save(); render(); }); });
  $$('[data-set]').forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.set, b.dataset.val); save(); render(); }); });
  $$('[data-k]').forEach(function (el) { el.addEventListener('input', function () { set(el.dataset.k, el.value); save(); render(); }); });
  $('#pk-add').addEventListener('click', function () {
    if (state.packs.length >= MAX_PACKS) return;
    state.packs.push({ p: '', q: '', u: state.packs[state.packs.length - 1].u });
    save(); buildPacks(); calcPacks();
    var last = $('#pk-p-' + (state.packs.length - 1)); if (last) last.focus();
  });
  $('#m-use').addEventListener('click', function () {
    var m = M.mileage(num(state.f.odo1), num(state.f.odo2), num(state.f.fuel));
    if (!isFinite(m) || m <= 0) return;
    state.f.mil = String(Math.round(m * 100) / 100); state.f.mode = 'trip';
    save(); syncInputs(); render();
  });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    var tab = state.tab; state = defaults(); state.tab = tab;
    store.set('state', state); syncInputs(); buildPacks(); render();
  });

  EDU.onLang(function () { buildPacks(); render(); });
  syncInputs(); buildPacks(); render();
})();
