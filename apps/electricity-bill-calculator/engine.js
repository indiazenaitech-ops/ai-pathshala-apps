/* Electricity Bill & Energy Calculator: pure maths, no DOM.
   window.EBC = appliance catalogue, sample state tariffs (approximate, Oct 2026) and the formulas
   for units, slab bills (telescopic / non-telescopic), duty, surcharge, subsidy, savings, meter and solar.
   Everything here is checked by hand in tools/tests/electricity-bill-calculator.test.js. */
(function () {
  'use strict';

  /* 30 common Indian appliances: id, typical watts, typical hours per day, typical quantity.
     Names come from strings.js (key ap_<id>). "note" keys point to extra hints in strings.js. */
  var APPLIANCES = [
    { id: 'led', w: 9, h: 5, q: 6, cat: 'light' },
    { id: 'cfl', w: 15, h: 5, q: 2, cat: 'light' },
    { id: 'bulb', w: 60, h: 5, q: 2, cat: 'light' },
    { id: 'tube', w: 36, h: 5, q: 2, cat: 'light' },
    { id: 'fan', w: 75, h: 8, q: 3, cat: 'fan' },
    { id: 'bldc', w: 30, h: 8, q: 1, cat: 'fan' },
    { id: 'cooler', w: 200, h: 6, q: 1 },
    { id: 'ac1', w: 1000, h: 5, q: 1, cat: 'ac', note: 'note_ac' },
    { id: 'ac15', w: 1500, h: 5, q: 1, cat: 'ac', note: 'note_ac' },
    { id: 'fridge', w: 150, h: 8, q: 1, cat: 'fridge', note: 'note_fridge' },
    { id: 'tv', w: 50, h: 4, q: 1, standby: true },
    { id: 'geyser', w: 2000, h: 0.5, q: 1 },
    { id: 'iron', w: 1000, h: 0.25, q: 1 },
    { id: 'washer', w: 500, h: 0.5, q: 1 },
    { id: 'mixer', w: 500, h: 0.25, q: 1 },
    { id: 'induction', w: 1800, h: 1, q: 1 },
    { id: 'microwave', w: 1200, h: 0.25, q: 1, standby: true },
    { id: 'kettle', w: 1500, h: 0.25, q: 1 },
    { id: 'pump', w: 750, h: 0.5, q: 1 },
    { id: 'laptop', w: 60, h: 4, q: 1, standby: true },
    { id: 'desktop', w: 200, h: 4, q: 1, standby: true },
    { id: 'charger', w: 10, h: 2, q: 2, standby: true },
    { id: 'router', w: 10, h: 24, q: 1 },
    { id: 'settop', w: 20, h: 4, q: 1, standby: true },
    { id: 'heater', w: 2000, h: 2, q: 1 },
    { id: 'dryer', w: 1200, h: 0.1, q: 1 },
    { id: 'toaster', w: 800, h: 0.1, q: 1 },
    { id: 'ricecooker', w: 700, h: 0.5, q: 1 },
    { id: 'vacuum', w: 1000, h: 0.25, q: 1 },
    { id: 'inverter', w: 300, h: 3, q: 1 }
  ];
  var BY_ID = {};
  APPLIANCES.forEach(function (a) { BY_ID[a.id] = a; });

  /* Sample domestic tariffs, approximate, Oct 2026. Every number is editable in the app.
     slabs: [{ upto: units (null = no limit), rate: ₹ per unit }], fixed: ₹ per kW of sanctioned load per month,
     duty: electricity duty / tax %, fuel: fuel / power purchase surcharge %, free: subsidy units (0 = none). */
  var TARIFFS = [
    { id: 'delhi', slabs: [[200, 3], [400, 4.5], [800, 6.5], [1200, 7], [null, 8]], fixed: 20, duty: 5, fuel: 8, free: 200, telescopic: true },
    { id: 'maharashtra', slabs: [[100, 4.71], [300, 10.29], [500, 14.55], [null, 16.64]], fixed: 40, duty: 16, fuel: 0, free: 0, telescopic: true },
    { id: 'up', slabs: [[150, 5.5], [300, 6], [500, 6.5], [null, 7]], fixed: 110, duty: 5, fuel: 0, free: 0, telescopic: true },
    { id: 'karnataka', slabs: [[100, 4.75], [200, 7], [null, 8.5]], fixed: 110, duty: 9, fuel: 0, free: 200, telescopic: true },
    { id: 'tamilnadu', slabs: [[100, 0], [200, 2.35], [400, 4.7], [500, 6.3], [null, 8.4]], fixed: 0, duty: 0, fuel: 0, free: 0, telescopic: true },
    { id: 'gujarat', slabs: [[50, 5.85], [200, 6.6], [null, 7.85]], fixed: 25, duty: 15, fuel: 0, free: 0, telescopic: true },
    { id: 'westbengal', slabs: [[102, 5.26], [180, 5.86], [300, 6.7], [600, 7.3], [900, 7.6], [null, 8.99]], fixed: 15, duty: 10, fuel: 0, free: 0, telescopic: true },
    { id: 'rajasthan', slabs: [[50, 4.75], [150, 6.5], [300, 7.35], [500, 7.65], [null, 7.95]], fixed: 100, duty: 6, fuel: 7, free: 100, telescopic: true },
    { id: 'mp', slabs: [[50, 4.27], [150, 5.23], [300, 6.61], [null, 6.8]], fixed: 60, duty: 9, fuel: 10, free: 0, telescopic: true },
    { id: 'telangana', slabs: [[100, 3.1], [200, 4.8], [300, 7.7], [400, 9], [800, 9.5], [null, 10]], fixed: 10, duty: 0, fuel: 0, free: 200, telescopic: true },
    { id: 'punjab', slabs: [[100, 4.19], [300, 6.64], [null, 7.75]], fixed: 35, duty: 13, fuel: 0, free: 300, telescopic: true },
    { id: 'kerala', slabs: [[50, 3.25], [100, 4.05], [150, 5.1], [200, 6.95], [250, 8.2], [null, 8.8]], fixed: 45, duty: 10, fuel: 0, free: 0, telescopic: true }
  ];
  var TARIFF_BY_ID = {};
  TARIFFS.forEach(function (x) { TARIFF_BY_ID[x.id] = x; });

  function num(v, d) { v = +v; return isFinite(v) ? v : (d || 0); }
  function r2(x) { return Math.round(x * 100) / 100; }

  /* appliance: qty × watts × hours/day × days / 1000 = kWh (units) */
  function units(w, qty, hours, days) {
    return num(w) * num(qty) * num(hours) * num(days) / 1000;
  }

  /* items: [{ id, w, q, h }] -> { total, rows: [{ ...item, units, share }] sorted by units desc, top3 } */
  function audit(items, days) {
    var rows = items.map(function (it) {
      var u = units(it.w, it.q, it.h, days);
      return { id: it.id, w: num(it.w), q: num(it.q), h: num(it.h), units: u };
    });
    var total = rows.reduce(function (s, r) { return s + r.units; }, 0);
    rows.forEach(function (r) { r.share = total > 0 ? r.units / total : 0; });
    var ranked = rows.slice().sort(function (a, b) { return b.units - a.units; });
    return { total: total, rows: rows, ranked: ranked, top3: ranked.slice(0, 3).filter(function (r) { return r.units > 0; }) };
  }

  /* slabs: [[upto|null, rate], ...] sorted by upto. Returns rows per slab and the energy charge.
     telescopic: each block billed at its own rate; non-telescopic: all units at the rate of the slab the total falls in. */
  function slabBill(u, slabs, telescopic) {
    u = Math.max(0, num(u));
    var rows = [], energy = 0, from = 0, i;
    var clean = normSlabs(slabs);
    if (telescopic) {
      for (i = 0; i < clean.length && from < u; i++) {
        var upto = clean[i][0], rate = clean[i][1];
        var to = (upto === null) ? u : Math.min(upto, u);
        var n = to - from;
        if (n <= 0) break;
        rows.push({ from: from + (from > 0 ? 1 : 0), to: upto === null ? null : upto, units: n, rate: rate, amount: r2(n * rate) });
        energy += n * rate;
        from = to;
      }
    } else {
      var hit = clean[clean.length - 1];
      for (i = 0; i < clean.length; i++) { if (clean[i][0] === null || u <= clean[i][0]) { hit = clean[i]; break; } }
      if (hit && u > 0) {
        rows.push({ from: 0, to: hit[0], units: u, rate: hit[1], amount: r2(u * hit[1]) });
        energy = u * hit[1];
      }
    }
    return { rows: rows, energy: r2(energy) };
  }

  /* keep only sane slabs, sorted, last one open-ended */
  function normSlabs(slabs) {
    var out = (slabs || []).map(function (s) {
      var upto = (s[0] === null || s[0] === '' || s[0] === undefined) ? null : Math.max(0, num(s[0]));
      return [upto, Math.max(0, num(s[1]))];
    }).filter(function (s) { return s[0] === null || s[0] > 0; });
    out.sort(function (a, b) { if (a[0] === null) return 1; if (b[0] === null) return -1; return a[0] - b[0]; });
    var seenOpen = false;
    out = out.filter(function (s) { if (s[0] === null) { if (seenOpen) return false; seenOpen = true; } return true; });
    if (!out.length) out = [[null, 0]];
    if (out[out.length - 1][0] !== null) out.push([null, out[out.length - 1][1]]);
    return out;
  }

  /* Full bill. opts: { units, slabs, telescopic, fixedPerKw, loadKw, dutyPct, fuelPct, subsidy (bool), freeUnits }
     Order: free units are taken off first (subsidy), slabs apply to the billed units, fixed charge = ₹/kW × load,
     fuel surcharge % on the energy charge, electricity duty % on energy + fixed + surcharge. */
  function bill(o) {
    var u = Math.max(0, num(o.units));
    var free = o.subsidy ? Math.max(0, num(o.freeUnits)) : 0;
    var billed = Math.max(0, u - free);
    var sb = slabBill(billed, o.slabs, o.telescopic !== false);
    var fixed = r2(Math.max(0, num(o.fixedPerKw)) * Math.max(0, num(o.loadKw)));
    var fuel = r2(sb.energy * Math.max(0, num(o.fuelPct)) / 100);
    var duty = r2((sb.energy + fixed + fuel) * Math.max(0, num(o.dutyPct)) / 100);
    var total = r2(sb.energy + fixed + fuel + duty);
    return {
      units: u, freeUsed: Math.min(u, free), billed: billed, rows: sb.rows, energy: sb.energy,
      fixed: fixed, fuel: fuel, duty: duty, total: total,
      perUnit: u > 0 ? total / u : 0
    };
  }

  /* marginal rate: the rate of the slab the billed units fall into (0 if nothing billed) */
  function marginalRate(billed, slabs) {
    var clean = normSlabs(slabs);
    if (billed <= 0) return clean[0][1];
    for (var i = 0; i < clean.length; i++) if (clean[i][0] === null || billed <= clean[i][0]) return clean[i][1];
    return clean[clean.length - 1][1];
  }

  /* Savings coach. items as in audit, days, switches: { led, ac24, fridge5, bldc, standby }.
     Returns per switch the kWh saved per month, and a total. Rupees are computed by the caller with a rate. */
  var AC_PER_DEG = 0.06, AC_DEG = 6, FRIDGE5_SAVE = 0.30, CO2_PER_UNIT = 0.8, STANDBY_W = 2;
  function savings(items, days, sw) {
    var out = { led: 0, ac24: 0, fridge5: 0, bldc: 0, standby: 0, total: 0 };
    items.forEach(function (it) {
      var a = BY_ID[it.id] || {};
      var u = units(it.w, it.q, it.h, days);
      if (sw.led && (it.id === 'bulb' || it.id === 'cfl' || it.id === 'tube') && num(it.w) > 9) {
        out.led += units(num(it.w) - 9, it.q, it.h, days);
      }
      if (sw.ac24 && a.cat === 'ac') out.ac24 += u * AC_PER_DEG * AC_DEG;
      if (sw.fridge5 && a.cat === 'fridge') out.fridge5 += u * FRIDGE5_SAVE;
      if (sw.bldc && it.id === 'fan' && num(it.w) > 30) out.bldc += units(num(it.w) - 30, it.q, it.h, days);
      if (sw.standby && a.standby) {
        var idle = Math.max(0, 24 - num(it.h));
        out.standby += units(STANDBY_W, it.q, idle, days);
      }
    });
    out.total = out.led + out.ac24 + out.fridge5 + out.bldc + out.standby;
    return out;
  }
  function co2(unitsKwh) { return num(unitsKwh) * CO2_PER_UNIT; }

  /* meter: previous and current reading -> units; null when the reading went backwards or is missing */
  function meter(prev, cur) {
    var p = num(prev, NaN), c = num(cur, NaN);
    if (!isFinite(p) || !isFinite(c) || p < 0 || c < 0) return null;
    if (c < p) return null;
    return c - p;
  }

  /* rooftop solar: kW × units per kW per day × days (India: about 4 units per kW per day, varies by city) */
  var SOLAR_PER_KW_DAY = 4;
  function solar(kw, perKwDay, days) {
    return Math.max(0, num(kw)) * Math.max(0, num(perKwDay === undefined ? SOLAR_PER_KW_DAY : perKwDay)) * Math.max(0, num(days === undefined ? 30 : days));
  }

  /* science: P = V × I, E = P × t, 1 kWh = 3.6 × 10^6 J */
  function power(v, i) { return num(v) * num(i); }
  function energyKwh(wattsP, hours) { return num(wattsP) * num(hours) / 1000; }
  var J_PER_KWH = 3.6e6;

  window.EBC = {
    APPLIANCES: APPLIANCES, BY_ID: BY_ID, TARIFFS: TARIFFS, TARIFF_BY_ID: TARIFF_BY_ID,
    AC_PER_DEG: AC_PER_DEG, AC_DEG: AC_DEG, FRIDGE5_SAVE: FRIDGE5_SAVE, CO2_PER_UNIT: CO2_PER_UNIT, STANDBY_W: STANDBY_W,
    SOLAR_PER_KW_DAY: SOLAR_PER_KW_DAY, J_PER_KWH: J_PER_KWH,
    units: units, audit: audit, slabBill: slabBill, normSlabs: normSlabs, bill: bill, marginalRate: marginalRate,
    savings: savings, co2: co2, meter: meter, solar: solar, power: power, energyKwh: energyKwh, r2: r2
  };
})();
