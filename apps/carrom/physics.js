/* Carrom: physics engine (no DOM). Top-down 2D, units: cm, g, s.
   Sizes follow the ICF / AICF laws: playing surface 74 cm, pockets 4.45 cm, carrom men 3.18 cm and 5.5 g,
   striker 4.13 cm and 15 g, base lines 47 cm long, 10.15 cm from the frame, the two lines 3.18 cm apart.
   Deterministic: the same start position and the same shot always give the same result (fixed time step,
   sub-steps chosen from the state only, no randomness).

   CRPHYS.rack(side)                 -> 19 pieces in the starting rosette (side 1 = breaker at the bottom, -1 = top)
   CRPHYS.piece(id, kind, x, y)      -> one piece ('w' white, 'b' black, 'q' queen, 's' striker)
   CRPHYS.world(pieces)              -> { p: pieces, t, ev: [] }
   CRPHYS.fitStriker(pieces, side, x)-> nearest x on that base line where the striker does not overlap a piece (or null)
   CRPHYS.dir(side, deg)             -> unit vector of a shot: 0° = straight ahead, + = towards the screen's right
   CRPHYS.fire(world, dx, dy, power) -> give the striker its speed (power 0..1)
   CRPHYS.step(world)                -> one fixed 1/120 s step (with sub-steps); returns true while anything moves
   CRPHYS.run(world, maxT)           -> step until everything is at rest; returns world.ev (events) */
(function (root) {
  'use strict';
  var B = {
    HALF: 37,                 /* half of the 74 cm playing surface */
    PR: 2.225,                /* pocket radius (4.45 cm pockets) */
    PC: 37 - 2.225,           /* pocket centre: the pocket touches both cushions */
    CR: 1.59, CM: 5.5,        /* carrom man / queen: 3.18 cm, 5.5 g */
    SR: 2.065, SM: 15,        /* striker: 4.13 cm, 15 g (about 2.7 times heavier than a coin) */
    BASE_OUT: 10.15,          /* outer base line, from the frame */
    BASE_GAP: 3.18,           /* distance between the two base lines */
    BASE_Y: 37 - 10.15 - 3.18 / 2,   /* striker centre: touching both base lines */
    BASE_X: 47 / 2 - 1.59,    /* centre of the base circle at each end of the 47 cm base line */
    CIRCLE_R: 1.59,           /* base circles and centre circle: 3.18 cm */
    OUTER_R: 8.5,             /* outer circle: 17 cm */
    ARROW_IN: 15.25, ARROW_OUT: 41.95   /* arrows along the diagonals (from the centre); 5 cm clear of the pocket */
  };
  var K = {
    FRICTION: 60,     /* sliding friction, cm/s² (μ ≈ 0.06 on a powdered board) */
    DAMP: 0.8,        /* extra drag that grows with speed, 1/s (powder, air) */
    E_COIN: 0.92,     /* coin–coin restitution: almost elastic */
    E_STRIKER: 0.9,   /* striker–coin restitution */
    E_WALL: 0.78,     /* cushion: keeps 78 % of the speed into the cushion */
    WALL_T: 0.96,     /* cushion: keeps 96 % of the speed along the cushion */
    DT: 1 / 120,      /* fixed time step, s */
    MAX_MOVE: 0.25,   /* a piece never moves more than 0.25 cm per sub-step (no tunnelling) */
    MAX_SUB: 64,
    V_REST: 0.8,      /* below 0.8 cm/s everything is at rest */
    VMAX: 420,        /* full-power striker speed, cm/s (4.2 m/s) */
    MAX_T: 30         /* safety stop, simulated seconds */
  };
  var POCKETS = [[-B.PC, -B.PC], [B.PC, -B.PC], [-B.PC, B.PC], [B.PC, B.PC]];
  var GAP = 0.02;     /* tiny gap between the coins of the rosette */
  var DEG = Math.PI / 180;

  function piece(id, kind, x, y) {
    var s = kind === 's';
    return { id: id, k: kind, x: x, y: y, vx: 0, vy: 0, r: s ? B.SR : B.CR, m: s ? B.SM : B.CM, on: true, pk: -1 };
  }

  /* AICF Law 41: queen in the centre circle, six men around her (black and white alternately), and in the second
     row three whites form a "Y" with the whites of the first row; the rest alternate. The stem of the Y points
     at the breaker (who plays white). Coins touch (hexagonal packing) with a 0.02 cm gap. */
  function rack(side) {
    var u = 2 * B.CR + GAP, a0 = (side === -1 ? 270 : 90) * DEG, out = [], nw = 0, nb = 0, i, a;
    out.push(piece('q', 'q', 0, 0));
    function add(kind, dist, ang) {
      var id = kind === 'w' ? 'w' + (nw++) : 'b' + (nb++);
      out.push(piece(id, kind, round6(dist * Math.cos(ang)), round6(dist * Math.sin(ang))));
    }
    for (i = 0; i < 6; i++) add(i % 2 === 0 ? 'w' : 'b', u, a0 + i * 60 * DEG);           /* first row */
    for (i = 0; i < 6; i++) add('w', 2 * u, a0 + i * 60 * DEG);                            /* in line: white */
    for (i = 0; i < 6; i++) { a = a0 + (30 + i * 60) * DEG; add('b', Math.sqrt(3) * u, a); } /* between: black */
    return out;
  }
  function round6(v) { return Math.round(v * 1e6) / 1e6; }

  function world(pieces) { return { p: pieces, t: 0, ev: [], moving: false, steps: 0 }; }

  function strikerOf(w) { for (var i = 0; i < w.p.length; i++) if (w.p[i].k === 's') return w.p[i]; return null; }

  function fits(pieces, x, y, skipId) {
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      if (!p.on || p.k === 's' || p.id === skipId) continue;
      var dx = p.x - x, dy = p.y - y, rr = p.r + B.SR;
      if (dx * dx + dy * dy < rr * rr) return false;
    }
    return true;
  }
  /* nearest free spot on the base line (searches both ways in 0.05 cm steps) */
  function fitStriker(pieces, side, x) {
    var lim = B.BASE_X, y = side * B.BASE_Y;
    x = Math.max(-lim, Math.min(lim, Number(x) || 0));
    if (fits(pieces, x, y)) return x;
    for (var k = 1; k <= Math.ceil(2 * lim / 0.05); k++) {
      var d = k * 0.05;
      if (x + d <= lim && fits(pieces, x + d, y)) return round6(x + d);
      if (x - d >= -lim && fits(pieces, x - d, y)) return round6(x - d);
    }
    return null;
  }

  /* 0° = straight towards the other side; positive = to the right on screen. side 1 shoots up (-y), -1 shoots down. */
  function dir(side, deg) { var a = deg * DEG; return { x: Math.sin(a), y: side === -1 ? Math.cos(a) : -Math.cos(a) }; }
  function angleOf(side, dx, dy) {
    /* inverse of dir(): angle in degrees for a direction vector */
    var fwd = side === -1 ? dy : -dy;
    return Math.atan2(dx, fwd) / DEG;
  }
  function powerToSpeed(p) { p = Math.max(0, Math.min(1, p)); return K.VMAX * Math.pow(p, 1.5); }
  function speedToPower(v) { return Math.max(0, Math.min(1, Math.pow(Math.max(0, v) / K.VMAX, 1 / 1.5))); }

  function fire(w, dx, dy, power) {
    var s = strikerOf(w), L = Math.sqrt(dx * dx + dy * dy) || 1, v = powerToSpeed(power);
    s.vx = dx / L * v; s.vy = dy / L * v;
    w.ev = []; w.t = 0; w.moving = v > 0; w.steps = 0;
    w.ev.push({ type: 'fire', t: 0, v: v, x: s.x, y: s.y, vx: s.vx, vy: s.vy });
  }

  /* one pair: impulse along the line of centres (no spin), then push the overlap apart by inverse mass */
  function collide(w, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
    if (d2 >= rr * rr) return;
    var d = Math.sqrt(d2), nx, ny;
    if (d > 1e-9) { nx = dx / d; ny = dy / d; } else { nx = 1; ny = 0; d = 0; }
    var ia = 1 / a.m, ib = 1 / b.m;
    var vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (vn < 0) {
      var e = a.k === 's' || b.k === 's' ? K.E_STRIKER : K.E_COIN;
      var J = -(1 + e) * vn / (ia + ib);
      var ev = null;
      if (-vn > 2) ev = { type: 'hit', t: w.t, a: a.id, b: b.id, ka: a.k, kb: b.k, vn: -vn, ma: a.m, mb: b.m,
        a0: [a.vx, a.vy], b0: [b.vx, b.vy] };
      a.vx -= J * nx * ia; a.vy -= J * ny * ia;
      b.vx += J * nx * ib; b.vy += J * ny * ib;
      if (ev) { ev.a1 = [a.vx, a.vy]; ev.b1 = [b.vx, b.vy]; w.ev.push(ev); }
    }
    var over = rr - d;
    if (over > 0) {
      var fa = ia / (ia + ib), fb = ib / (ia + ib);
      a.x -= nx * over * fa; a.y -= ny * over * fa;
      b.x += nx * over * fb; b.y += ny * over * fb;
    }
  }

  function wall(w, p) {
    var lim = B.HALF - p.r, hit = 0, vin = null;
    if (p.x < -lim) { p.x = -lim; if (p.vx < 0) { vin = [p.vx, p.vy]; p.vx = -p.vx * K.E_WALL; p.vy *= K.WALL_T; hit = 1; } }
    else if (p.x > lim) { p.x = lim; if (p.vx > 0) { vin = [p.vx, p.vy]; p.vx = -p.vx * K.E_WALL; p.vy *= K.WALL_T; hit = 2; } }
    if (hit && vin) w.ev.push({ type: 'wall', t: w.t, id: p.id, k: p.k, side: hit, x: p.x, y: p.y, vin: vin, vout: [p.vx, p.vy], vn: Math.abs(vin[0]) });
    var hit2 = 0; vin = null;
    if (p.y < -lim) { p.y = -lim; if (p.vy < 0) { vin = [p.vx, p.vy]; p.vy = -p.vy * K.E_WALL; p.vx *= K.WALL_T; hit2 = 3; } }
    else if (p.y > lim) { p.y = lim; if (p.vy > 0) { vin = [p.vx, p.vy]; p.vy = -p.vy * K.E_WALL; p.vx *= K.WALL_T; hit2 = 4; } }
    if (hit2 && vin) w.ev.push({ type: 'wall', t: w.t, id: p.id, k: p.k, side: hit2, x: p.x, y: p.y, vin: vin, vout: [p.vx, p.vy], vn: Math.abs(vin[1]) });
  }

  function step(w) {
    var ps = w.p, n = ps.length, i, j, p, maxV = 0, v;
    for (i = 0; i < n; i++) { p = ps[i]; if (!p.on) continue; v = Math.sqrt(p.vx * p.vx + p.vy * p.vy); if (v > maxV) maxV = v; }
    if (maxV === 0) { w.moving = false; return false; }
    var sub = Math.min(K.MAX_SUB, Math.max(1, Math.ceil(maxV * K.DT / K.MAX_MOVE))), h = K.DT / sub, s, k;
    for (s = 0; s < sub; s++) {
      for (i = 0; i < n; i++) {                       /* sliding friction, then move */
        p = ps[i]; if (!p.on) continue;
        v = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (v > 0) {
          var nv = v - (K.FRICTION + K.DAMP * v) * h;
          if (nv <= 0) { p.vx = 0; p.vy = 0; } else { p.vx *= nv / v; p.vy *= nv / v; }
          p.x += p.vx * h; p.y += p.vy * h;
        }
      }
      for (i = 0; i < n; i++) {                       /* a piece whose centre is over a pocket falls in */
        p = ps[i]; if (!p.on) continue;
        for (k = 0; k < 4; k++) {
          var px = p.x - POCKETS[k][0], py = p.y - POCKETS[k][1];
          if (px * px + py * py < B.PR * B.PR) {
            p.on = false; p.pk = k;
            w.ev.push({ type: 'pocket', t: w.t + (s + 1) * h, id: p.id, k: p.k, pocket: k, v: Math.sqrt(p.vx * p.vx + p.vy * p.vy) });
            p.vx = 0; p.vy = 0; p.x = POCKETS[k][0]; p.y = POCKETS[k][1];
            break;
          }
        }
      }
      for (i = 0; i < n; i++) if (ps[i].on) wall(w, ps[i]);
      for (var it = 0; it < 2; it++) {                /* two passes keep touching clusters stable */
        for (i = 0; i < n; i++) {
          if (!ps[i].on) continue;
          for (j = i + 1; j < n; j++) if (ps[j].on) collide(w, ps[i], ps[j]);
        }
      }
    }
    w.t += K.DT; w.steps++;
    var moving = false;
    for (i = 0; i < n; i++) { p = ps[i]; if (p.on && (p.vx * p.vx + p.vy * p.vy) >= K.V_REST * K.V_REST) { moving = true; break; } }
    if (!moving || w.t >= K.MAX_T) {
      for (i = 0; i < n; i++) { ps[i].vx = 0; ps[i].vy = 0; }
      moving = false;
    }
    w.moving = moving;
    return moving;
  }

  function run(w, maxT) {
    var lim = maxT || K.MAX_T;
    while (step(w) && w.t < lim) { /* keep going */ }
    if (w.t >= lim) { for (var i = 0; i < w.p.length; i++) { w.p[i].vx = 0; w.p[i].vy = 0; } w.moving = false; }
    return w.ev;
  }

  /* --- helpers for the computer player (closed forms of the friction model dv/dt = -a - k v) --- */
  /* distance a piece slides before it stops, starting at speed v */
  function stopDist(v) { var a = K.FRICTION, k = K.DAMP; return v / k - a / (k * k) * Math.log(1 + k * v / a); }
  /* speed left after sliding a distance s from speed v0 (0 if it stops before) */
  function speedAfter(v0, s) {
    if (stopDist(v0) <= s) return 0;
    var lo = 0, hi = v0;
    for (var i = 0; i < 40; i++) {
      var mid = (lo + hi) / 2, a = K.FRICTION, k = K.DAMP;
      var d = (v0 - mid) / k - a / (k * k) * Math.log((a + k * v0) / (a + k * mid));
      if (d > s) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }
  /* start speed needed to still have speed vEnd after sliding a distance s */
  function speedFor(s, vEnd) {
    var lo = vEnd, hi = 5000;
    for (var i = 0; i < 50; i++) { var mid = (lo + hi) / 2; if (speedAfter(mid, s) < vEnd || stopDist(mid) < s) lo = mid; else hi = mid; }
    return hi;
  }

  /* copy of the pieces (for trying shots without touching the real board) */
  function clone(pieces) {
    return pieces.map(function (p) { return { id: p.id, k: p.k, x: p.x, y: p.y, vx: p.vx, vy: p.vy, r: p.r, m: p.m, on: p.on, pk: p.pk }; });
  }

  var api = {
    B: B, K: K, POCKETS: POCKETS, DEG: DEG,
    piece: piece, rack: rack, world: world, strikerOf: strikerOf, fits: fits, fitStriker: fitStriker,
    dir: dir, angleOf: angleOf, powerToSpeed: powerToSpeed, speedToPower: speedToPower,
    fire: fire, step: step, run: run, clone: clone,
    stopDist: stopDist, speedAfter: speedAfter, speedFor: speedFor
  };
  root.CRPHYS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
