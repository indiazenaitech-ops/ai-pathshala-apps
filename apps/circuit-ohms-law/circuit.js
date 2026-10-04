/* Ohm's Law & Circuits: circuit maths + SVG circuit diagram with moving current dots.
   Classic script (no modules). Exposes window.CIRCUIT = { PRESETS, COUNT, solve, View, glow }. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var PRESETS = ['single', 'series2', 'series3', 'parallel2', 'parallel3', 'mixedA', 'mixedB'];
  var COUNT = { single: 1, series2: 2, series3: 3, parallel2: 2, parallel3: 3, mixedA: 3, mixedB: 3 };
  var KIND = { single: 'series', series2: 'series', series3: 'series', parallel2: 'parallel', parallel3: 'parallel', mixedA: 'mixedA', mixedB: 'mixedB' };

  function sum(a) { return a.reduce(function (s, x) { return s + x; }, 0); }

  /* o = { preset, V, R: [r1, r2, r3], closed, shorted } → every voltage, current and power */
  function solve(o) {
    var p = COUNT[o.preset] ? o.preset : 'single';
    var n = COUNT[p], r = o.R.slice(0, n), V = o.V, parts = {}, req;
    if (KIND[p] === 'parallel') { parts.inv = sum(r.map(function (x) { return 1 / x; })); req = 1 / parts.inv; }
    else if (p === 'mixedA') { parts.r23 = r[1] * r[2] / (r[1] + r[2]); req = r[0] + parts.r23; }
    else if (p === 'mixedB') { parts.r12 = r[0] + r[1]; req = parts.r12 * r[2] / (parts.r12 + r[2]); }
    else req = sum(r);
    var on = !!o.closed, sh = on && !!o.shorted;
    var I = on && !sh ? V / req : 0;
    var Vk = [], Ik = [];
    if (I > 0) {
      if (KIND[p] === 'series') r.forEach(function (x) { Ik.push(I); Vk.push(I * x); });
      else if (KIND[p] === 'parallel') r.forEach(function (x) { Vk.push(V); Ik.push(V / x); });
      else if (p === 'mixedA') { var v23 = I * parts.r23; Vk = [I * r[0], v23, v23]; Ik = [I, v23 / r[1], v23 / r[2]]; }
      else { var i12 = V / parts.r12; Vk = [i12 * r[0], i12 * r[1], V]; Ik = [i12, i12, V / r[2]]; }
    } else r.forEach(function () { Vk.push(0); Ik.push(0); });
    return {
      preset: p, kind: KIND[p], n: n, V: V, R: r, req: req, parts: parts, closed: on, shorted: sh,
      I: I, Itop: sh ? Infinity : I, Vk: Vk, Ik: Ik,
      Pk: Vk.map(function (v, i) { return v * Ik[i]; }), P: V * I
    };
  }

  /* how brightly a bulb glows (0..1) for a power P in watts */
  function glow(P) { return P > 0 ? 1 - Math.exp(-P / 1.5) : 0; }

  /* ---------------- geometry ---------------- */
  var TOP = 100, LX = 40, RX = 600, SY = 168, BX = 150, SWL = 305, SWR = 355, AX = 480, AR = 20;

  function layout(p) {
    var L = { h: 495, comps: [], wires: [], joints: [] };
    if (KIND[p] === 'series') {
      L.h = 392;
      var xs = p === 'single' ? [320] : p === 'series2' ? [220, 420] : [160, 320, 480];
      xs.forEach(function (x) { L.comps.push({ x: x, y: 330 }); });
      L.wires.push({ pts: [[LX, SY], [LX, 330], [RX, 330], [RX, SY]], cur: 'L' });
    } else if (p === 'parallel2') {
      L.comps = [{ x: 320, y: 250 }, { x: 320, y: 410 }];
      L.wires.push({ pts: [[LX, SY], [LX, 330], [130, 330]], cur: 'L' },
        { pts: [[130, 330], [130, 250], [510, 250], [510, 330]], cur: 0 },
        { pts: [[130, 330], [130, 410], [510, 410], [510, 330]], cur: 1 },
        { pts: [[510, 330], [RX, 330], [RX, SY]], cur: 'L' });
      L.joints = [[130, 330], [510, 330]];
    } else if (p === 'parallel3') {
      L.comps = [{ x: 270, y: 245 }, { x: 390, y: 345 }, { x: 270, y: 445 }];
      L.wires.push({ pts: [[LX, SY], [LX, 345], [130, 345]], cur: 'L' },
        { pts: [[130, 345], [130, 245], [510, 245], [510, 345]], cur: 0 },
        { pts: [[130, 345], [510, 345]], cur: 1 },
        { pts: [[130, 345], [130, 445], [510, 445], [510, 345]], cur: 2 },
        { pts: [[510, 345], [RX, 345], [RX, SY]], cur: 'L' });
      L.joints = [[130, 345], [510, 345]];
    } else if (p === 'mixedA') {
      L.comps = [{ x: 150, y: 330 }, { x: 410, y: 250 }, { x: 410, y: 420 }];
      L.wires.push({ pts: [[LX, SY], [LX, 330], [260, 330]], cur: 'L' },
        { pts: [[260, 330], [260, 250], [560, 250], [560, 330]], cur: 1 },
        { pts: [[260, 330], [260, 420], [560, 420], [560, 330]], cur: 2 },
        { pts: [[560, 330], [RX, 330], [RX, SY]], cur: 'L' });
      L.joints = [[260, 330], [560, 330]];
    } else { /* mixedB */
      L.comps = [{ x: 240, y: 250 }, { x: 400, y: 250 }, { x: 320, y: 420 }];
      L.wires.push({ pts: [[LX, SY], [LX, 330], [110, 330]], cur: 'L' },
        { pts: [[110, 330], [110, 250], [530, 250], [530, 330]], cur: 0 },
        { pts: [[110, 330], [110, 420], [530, 420], [530, 330]], cur: 2 },
        { pts: [[530, 330], [RX, 330], [RX, SY]], cur: 'L' });
      L.joints = [[110, 330], [530, 330]];
    }
    /* the top of the loop, in the direction of conventional current: right side up, then
       right → left through the ammeter, switch and battery (− to + inside), then down the left side */
    L.wires.unshift({ pts: [[RX, SY], [RX, TOP], [LX, TOP], [LX, SY]], cur: 'T' });
    return L;
  }

  function prep(w) {
    var segs = [], len = 0;
    for (var i = 1; i < w.pts.length; i++) {
      var a = w.pts[i - 1], b = w.pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push({ a: a, b: b, l: l, s: len }); len += l;
    }
    w.segs = segs; w.len = len;
    w.count = Math.max(1, Math.round(len / 30));
    return w;
  }
  function pointAt(w, s) {
    for (var i = 0; i < w.segs.length; i++) {
      var g = w.segs[i];
      if (s <= g.s + g.l || i === w.segs.length - 1) {
        var f = g.l ? (s - g.s) / g.l : 0;
        return [g.a[0] + (g.b[0] - g.a[0]) * f, g.a[1] + (g.b[1] - g.a[1]) * f];
      }
    }
    return w.pts[0];
  }
  /* dot speed ∝ current (120 px/s per ampere). Above 2.5 A the whole circuit is scaled down together,
     so the dots in different branches still compare correctly instead of all hitting the same cap. */
  function speedFor(I, Imax) {
    if (I === Infinity) return 330;
    var k = Imax > 2.5 ? 300 / Imax : 120;
    return Math.min(300, k * Math.abs(I || 0));
  }

  /* ---------------- svg helpers ---------------- */
  function S(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  function T(parent, x, y, text, cls, anchor) {
    var e = S('text', { x: x, y: y, class: cls, 'text-anchor': anchor || 'middle' }, parent);
    e.textContent = text;
    return e;
  }
  function line(parent, x1, y1, x2, y2, cls) { return S('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: cls }, parent); }

  var uid = 0;
  var views = [];
  var reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* View: draws one circuit into an <svg>.
     opts: { onSwitch: fn, switchLabel: fn → string } */
  function View(svg, opts) {
    this.svg = svg; this.opts = opts || {}; this.id = 'cv' + (++uid);
    this.off = []; this.key = ''; this.wires = []; this.dir = 1;
    views.push(this);
  }

  /* st: { preset, V, closed, bulbs, flow:'conv'|'elec', vm:'B'|'R1'..'R3'|'', short, cells }
     res: solve() result; lab: { names:[...], fmt: fn(number) → string, shortTag, vmName, amName, swName, aria } */
  View.prototype.render = function (st, res, lab) {
    var svg = this.svg, self = this, fmt = lab.fmt;
    var hadFocus = document.activeElement && svg.contains(document.activeElement);
    var L = layout(res.preset);
    var y0 = st.vm === 'B' ? 12 : 44;   /* crop the empty band above the top wire */
    svg.setAttribute('viewBox', '20 ' + y0 + ' 600 ' + (L.h - y0));
    svg.classList.toggle('elec', st.flow === 'elec');
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var defs = S('defs', null, svg);
    var gr = S('radialGradient', { id: this.id + '-glow' }, defs);
    S('stop', { offset: '0%', 'stop-color': '#fff3b0', 'stop-opacity': '1' }, gr);
    S('stop', { offset: '45%', 'stop-color': '#ffd43b', 'stop-opacity': '.55' }, gr);
    S('stop', { offset: '100%', 'stop-color': '#ffd43b', 'stop-opacity': '0' }, gr);

    var gW = S('g', { class: 'wires' }, svg), gD = S('g', { class: 'dots', 'aria-hidden': 'true' }, svg), gC = S('g', { class: 'comps' }, svg);

    /* wires (+ the short-circuit wire) */
    var wires = L.wires.slice();
    if (res.shorted || st.short) wires.push({ pts: [[LX, SY], [RX, SY]], cur: 'S', short: true });
    wires.forEach(function (w) {
      prep(w);
      w.el = S('polyline', { points: w.pts.map(function (p) { return p.join(','); }).join(' '), class: 'wire' + (w.short ? ' short' : '') }, gW);
    });
    L.joints.forEach(function (j) { S('circle', { cx: j[0], cy: j[1], r: 6, class: 'joint' }, gC); });
    if (st.short) {
      S('circle', { cx: LX, cy: SY, r: 6, class: 'joint' }, gC); S('circle', { cx: RX, cy: SY, r: 6, class: 'joint' }, gC);
      T(gC, (LX + RX) / 2, SY - 10, '⚡ ' + lab.shortTag, 'lbl warn').setAttribute('direction', document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr');
    }

    /* current through each wire */
    wires.forEach(function (w) {
      if (w.cur === 'T') w.I = res.Itop;
      else if (w.cur === 'S') w.I = res.shorted ? Infinity : 0;
      else if (w.cur === 'L') w.I = res.I;
      else w.I = res.Ik[w.cur] || 0;
    });
    var Imax = Math.max.apply(null, wires.map(function (w) { return isFinite(w.I) ? Math.abs(w.I) : 0; }));
    wires.forEach(function (w) {
      w.speed = reduceMotion ? 0 : speedFor(w.I, Imax);
      w.el.setAttribute('data-cur', String(w.cur)); w.el.setAttribute('data-speed', w.speed.toFixed(2));
    });
    var key = res.preset + (st.short ? 's' : '');
    if (key !== this.key) { this.off = wires.map(function () { return 0; }); this.key = key; }
    this.dir = st.flow === 'elec' ? -1 : 1;
    this.wires = wires;
    this.dotEls = wires.map(function (w) {
      var a = [];
      for (var k = 0; k < w.count; k++) a.push(S('circle', { r: 4.3, class: 'dot' }, gD));
      return a;
    });
    this.place();

    /* battery: n cells, long plate = + */
    var cells = st.cells || Math.max(1, Math.min(8, Math.ceil(st.V / 1.5 - 1e-9)));
    var pitch = 22, x0 = BX - (cells * pitch - 13) / 2, xl = x0 + (cells - 1) * pitch + 9;
    S('rect', { x: x0 - 1, y: TOP - 4, width: xl - x0 + 2, height: 8, class: 'erase' }, gC);
    for (var c = 0; c < cells; c++) {
      var xa = x0 + c * pitch;
      line(gC, xa, TOP - 24, xa, TOP + 24, 'plate long');
      line(gC, xa + 9, TOP - 12, xa + 9, TOP + 12, 'plate short');
      if (c < cells - 1) line(gC, xa + 9, TOP, xa + pitch, TOP, 'wire thin');
    }
    T(gC, x0 - 9, TOP - 26, '+', 'lbl sign');
    T(gC, xl + 10, TOP - 26, '−', 'lbl sign');
    T(gC, BX, TOP + 50, fmt(st.V) + ' V', 'lbl num big');

    /* switch (tap to open / close) */
    S('rect', { x: SWL, y: TOP - 4, width: SWR - SWL, height: 8, class: 'erase' }, gC);
    if (res.closed) line(gC, SWL, TOP, SWR, TOP, 'lever');
    else line(gC, SWL, TOP, SWR - 6, TOP - 32, 'lever');
    S('circle', { cx: SWL, cy: TOP, r: 5.5, class: 'term' }, gC);
    S('circle', { cx: SWR, cy: TOP, r: 5.5, class: 'term' }, gC);
    if (this.opts.onSwitch) {
      var hit = S('rect', { x: SWL - 18, y: TOP - 52, width: SWR - SWL + 36, height: 76, rx: 10, class: 'hit', tabindex: '0', role: 'button',
        'aria-pressed': res.closed ? 'true' : 'false', 'aria-label': lab.swName }, gC);
      var tt = S('title', null, hit); tt.textContent = lab.swName;
      var go = function (e) { if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); self.opts.onSwitch(); };
      hit.addEventListener('click', go); hit.addEventListener('keydown', go);
      if (hadFocus) setTimeout(function () { try { hit.focus(); } catch (e) { } }, 0);
    }

    /* ammeter (current enters at +, on the right) */
    S('circle', { cx: AX, cy: TOP, r: AR, class: 'meter' }, gC);
    T(gC, AX, TOP + 8, 'A', 'mlet num');
    T(gC, AX + AR + 7, TOP - 14, '+', 'tiny-l');
    T(gC, AX - AR - 7, TOP - 14, '−', 'tiny-l');
    var am = T(gC, AX, TOP - 32, (res.Itop === Infinity ? '∞' : fmt(res.Itop)) + ' A', 'lbl num read a' + (res.shorted ? ' warn' : ''));
    am.setAttribute('id', this.id + '-am');
    S('title', null, am).textContent = lab.amName;

    /* resistors or bulbs */
    var bulbs = [];
    L.comps.forEach(function (c, k) {
      S('rect', { x: c.x - 30, y: c.y - 4, width: 60, height: 8, class: 'erase' }, gC);
      if (st.bulbs) {
        var g = glow(res.Pk[k]);
        line(gC, c.x - 30, c.y, c.x - 17, c.y, 'wire');
        line(gC, c.x + 17, c.y, c.x + 30, c.y, 'wire');
        if (g > 0.01) S('circle', { cx: c.x, cy: c.y, r: (19 + 30 * g).toFixed(1), fill: 'url(#' + self.id + '-glow)', opacity: Math.min(1, 0.25 + g).toFixed(2), class: 'halo' }, gC);
        S('circle', { cx: c.x, cy: c.y, r: 17, class: 'bulb-base' }, gC);
        S('circle', { cx: c.x, cy: c.y, r: 17, class: 'bulb-lit', 'fill-opacity': Math.min(1, g * 1.25).toFixed(2) }, gC);
        var b = S('circle', { cx: c.x, cy: c.y, r: 17, class: 'bulb' }, gC);
        b.setAttribute('data-glow', g.toFixed(3));
        line(gC, c.x - 11, c.y - 11, c.x + 11, c.y + 11, 'sym'); line(gC, c.x - 11, c.y + 11, c.x + 11, c.y - 11, 'sym');
        bulbs.push(b);
      } else {
        var z = [[c.x - 30, c.y], [c.x - 22, c.y]], amp = 10;
        for (var i = 0; i < 6; i++) z.push([c.x - 22 + (i + 0.5) * (44 / 6), c.y + (i % 2 ? amp : -amp)]);
        z.push([c.x + 22, c.y], [c.x + 30, c.y]);
        S('polyline', { points: z.map(function (p) { return p.join(','); }).join(' '), class: 'sym res' }, gC);
      }
      T(gC, c.x, c.y + (st.bulbs ? 42 : 36), lab.names[k], 'lbl num');
    });

    /* voltmeter across the chosen part (always in parallel) */
    if (st.vm) {
      var vC, ta, tb, reading;
      if (st.vm === 'B') {
        vC = [BX, 38]; ta = [x0 - 24, TOP]; tb = [xl + 24, TOP]; reading = st.V;
        S('polyline', { points: [ta, [ta[0], vC[1]], [vC[0] - 17, vC[1]]].map(function (p) { return p.join(','); }).join(' '), class: 'vlead' }, gC);
        S('polyline', { points: [tb, [tb[0], vC[1]], [vC[0] + 17, vC[1]]].map(function (p) { return p.join(','); }).join(' '), class: 'vlead' }, gC);
      } else {
        var k = Number(st.vm.slice(1)) - 1;
        var cp = L.comps[k] || L.comps[0]; k = L.comps[k] ? k : 0;
        vC = [cp.x, cp.y - 50]; ta = [cp.x - 30, cp.y]; tb = [cp.x + 30, cp.y]; reading = res.Vk[k];
        [ta, tb].forEach(function (t) {
          var dx = t[0] - vC[0], dy = t[1] - vC[1], d = Math.hypot(dx, dy);
          line(gC, vC[0] + dx / d * 17, vC[1] + dy / d * 17, t[0], t[1], 'vlead');
        });
      }
      S('circle', { cx: ta[0], cy: ta[1], r: 4.5, class: 'vdot' }, gC);
      S('circle', { cx: tb[0], cy: tb[1], r: 4.5, class: 'vdot' }, gC);
      S('circle', { cx: vC[0], cy: vC[1], r: 17, class: 'meter vm' }, gC);
      T(gC, vC[0], vC[1] + 7, 'V', 'mlet num vml');
      var vr = T(gC, st.vm === 'B' ? tb[0] + 9 : vC[0] + 23, vC[1] + 8, fmt(reading) + ' V', 'lbl num read v', 'start');
      vr.setAttribute('id', this.id + '-vm');
      S('title', null, vr).textContent = lab.vmName;
    }
    svg.setAttribute('aria-label', lab.aria || '');
    return { bulbs: bulbs };
  };

  View.prototype.place = function () {
    var self = this;
    this.wires.forEach(function (w, i) {
      var els = self.dotEls[i]; if (!els) return;
      var sp = w.len / w.count, off = self.off[i] || 0;
      for (var k = 0; k < els.length; k++) {
        var s = ((k * sp + off) % w.len + w.len) % w.len;
        var p = pointAt(w, s);
        els[k].setAttribute('cx', p[0].toFixed(1)); els[k].setAttribute('cy', p[1].toFixed(1));
      }
    });
  };

  View.prototype.tick = function (dt) {
    if (!this.wires.length || !this.svg.isConnected || !this.svg.getClientRects().length) return;
    var moved = false, self = this;
    this.wires.forEach(function (w, i) {
      if (!w.speed) return;
      self.off[i] = ((self.off[i] || 0) + self.dir * w.speed * dt) % (w.len * 1000);
      moved = true;
    });
    if (moved) this.place();
  };

  var last = 0;
  function frame(t) {
    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
    for (var i = 0; i < views.length; i++) { try { views[i].tick(dt); } catch (e) { } }
    requestAnimationFrame(frame);
  }
  if (window.requestAnimationFrame) requestAnimationFrame(frame);

  window.CIRCUIT = { PRESETS: PRESETS, COUNT: COUNT, KIND: KIND, solve: solve, View: View, glow: glow };
})();
