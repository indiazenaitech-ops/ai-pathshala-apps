/* Projectile Motion Lab: physics (pure functions, no DOM).  window.PMPHYS
   Units: metres, seconds, degrees for angles.  p = { u, a, h, g, drag } */
(function () {
  'use strict';
  var RAD = Math.PI / 180;

  /* Cricket ball in Earth air near the ground (approximate):
     mass 0.156 kg, diameter 7.2 cm, drag coefficient Cd ~ 0.5, air density 1.2 kg/m^3.
     Drag force F = 1/2 * rho * Cd * A * v^2, so the drag acceleration is k * v^2
     with k = rho * Cd * A / (2m) ~ 0.0078 per metre (terminal speed ~ 35 m/s). */
  var BALL = { m: 0.156, d: 0.072, cd: 0.5, rho: 1.2 };
  var K_AIR = 0.5 * BALL.rho * BALL.cd * Math.PI * Math.pow(BALL.d / 2, 2) / BALL.m;
  var GRAV = { earth: 9.8, moon: 1.6, mars: 3.7, jupiter: 24.8 };

  /* Exact NCERT formulas (no air). Works for launch from height h >= 0. */
  function formula(p) {
    var th = p.a * RAD, g = p.g, h = Math.max(0, p.h || 0);
    var ux = p.u * Math.cos(th), uy = p.u * Math.sin(th);
    if (Math.abs(ux) < 1e-9) ux = 0;
    var T = (uy + Math.sqrt(uy * uy + 2 * g * h)) / g;
    if (!isFinite(T) || T < 0) T = 0;
    var H = uy > 0 ? h + uy * uy / (2 * g) : h;
    var vy = uy - g * T;
    return { T: T, R: ux * T, H: H, tTop: uy > 0 ? uy / g : 0, vEnd: Math.sqrt(ux * ux + vy * vy), ux: ux, uy: uy };
  }

  /* Numerical simulation (RK4). With no air this matches the formulas exactly
     (constant acceleration), with air it shows what the formulas leave out. */
  function simulate(p, lite) {
    var g = p.g, k = p.drag ? K_AIR : 0, th = p.a * RAD;
    var x = 0, y = Math.max(0, p.h || 0), vx = p.u * Math.cos(th), vy = p.u * Math.sin(th);
    if (Math.abs(vx) < 1e-9) vx = 0;
    var est = formula(p).T;
    var dt = Math.min(0.01, Math.max(1e-4, est / 3000));
    var every = 1;
    var samples = lite ? null : [{ t: 0, x: x, y: y, vx: vx, vy: vy }];
    var t = 0, H = y, tTop = 0, xTop = 0, n = 0, maxSteps = 400000;
    function ax(vx, vy) { return -k * Math.sqrt(vx * vx + vy * vy) * vx; }
    function ay(vx, vy) { return -g - k * Math.sqrt(vx * vx + vy * vy) * vy; }

    if (y <= 0 && vy <= 0) {
      return { T: 0, R: 0, H: 0, tTop: 0, xTop: 0, vEnd: p.u, samples: samples || [] };
    }
    while (n++ < maxSteps) {
      var a1x = ax(vx, vy), a1y = ay(vx, vy);
      var v2x = vx + 0.5 * dt * a1x, v2y = vy + 0.5 * dt * a1y, a2x = ax(v2x, v2y), a2y = ay(v2x, v2y);
      var v3x = vx + 0.5 * dt * a2x, v3y = vy + 0.5 * dt * a2y, a3x = ax(v3x, v3y), a3y = ay(v3x, v3y);
      var v4x = vx + dt * a3x, v4y = vy + dt * a3y, a4x = ax(v4x, v4y), a4y = ay(v4x, v4y);
      var nx = x + dt / 6 * (vx + 2 * v2x + 2 * v3x + v4x);
      var ny = y + dt / 6 * (vy + 2 * v2y + 2 * v3y + v4y);
      var nvx = vx + dt / 6 * (a1x + 2 * a2x + 2 * a3x + a4x);
      var nvy = vy + dt / 6 * (a1y + 2 * a2y + 2 * a3y + a4y);

      if (vy > 0 && nvy <= 0) {               /* highest point inside this step */
        var f = vy / (vy - nvy);
        var yTop = y + 0.5 * vy * f * dt;
        if (yTop > H) { H = yTop; tTop = t + f * dt; xTop = x + (nx - x) * f; }
      }
      if (ny <= 0) {                           /* lands inside this step: solve y + vy*s + ay*s^2/2 = 0 */
        var A = a1y, s;
        var disc = vy * vy - 2 * A * y;
        if (A < -1e-9 && disc >= 0) s = (-vy - Math.sqrt(disc)) / A;
        else s = dt * y / (y - ny);
        if (!(s >= 0 && s <= dt)) s = dt * y / (y - ny);
        var fx = s / dt;
        var lx = x + vx * s + 0.5 * a1x * s * s;
        var lvx = vx + (nvx - vx) * fx, lvy = vy + (nvy - vy) * fx;
        t += s;
        if (samples) samples.push({ t: t, x: lx, y: 0, vx: lvx, vy: lvy });
        if (H <= Math.max(0, p.h || 0) && vy <= 0) { tTop = 0; xTop = 0; }
        return { T: t, R: lx, H: H, tTop: tTop, xTop: xTop, vEnd: Math.sqrt(lvx * lvx + lvy * lvy), samples: samples || [] };
      }
      x = nx; y = ny; vx = nvx; vy = nvy; t += dt;
      if (y > H) { H = y; tTop = t; xTop = x; }
      if (samples && n % every === 0) {
        samples.push({ t: t, x: x, y: y, vx: vx, vy: vy });
        if (samples.length > 1200) {          /* keep about 600-1200 points for drawing */
          samples = samples.filter(function (q, i) { return i % 2 === 0; });
          every *= 2;
        }
      }
    }
    return { T: t, R: x, H: H, tTop: tTop, xTop: xTop, vEnd: Math.sqrt(vx * vx + vy * vy), samples: samples || [] };
  }

  /* State (x, y, vx, vy) at time t along a simulated path (linear between samples). */
  function stateAt(sim, t) {
    var s = sim.samples;
    if (!s.length) return { t: 0, x: 0, y: 0, vx: 0, vy: 0 };
    if (t <= 0) return s[0];
    if (t >= sim.T) return s[s.length - 1];
    var lo = 0, hi = s.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (s[mid].t <= t) lo = mid; else hi = mid; }
    var A = s[lo], B = s[hi], span = B.t - A.t || 1, f = (t - A.t) / span;
    return { t: t, x: A.x + (B.x - A.x) * f, y: A.y + (B.y - A.y) * f, vx: A.vx + (B.vx - A.vx) * f, vy: A.vy + (B.vy - A.vy) * f };
  }

  function copy(p, a) { return { u: p.u, a: a, h: p.h, g: p.g, drag: p.drag }; }
  function rangeAt(p, a) { return p.drag ? simulate(copy(p, a), true).R : formula(copy(p, a)).R; }

  /* Angle (0.1 degree) that gives the longest range for these settings. */
  function bestAngle(p) {
    var best = { a: 0, R: -1 }, a, r;
    for (a = 0; a <= 90; a += 1) { r = rangeAt(p, a); if (r > best.R + 1e-12) best = { a: a, R: r }; }
    var lo = Math.max(0, best.a - 1), hi = Math.min(90, best.a + 1);
    for (var i = Math.round(lo * 10); i <= Math.round(hi * 10); i++) {
      a = i / 10; r = rangeAt(p, a);
      if (r > best.R + 1e-12) best = { a: a, R: r };
    }
    return best;
  }

  window.PMPHYS = { RAD: RAD, GRAV: GRAV, K_AIR: K_AIR, BALL: BALL, formula: formula, simulate: simulate, stateAt: stateAt, bestAngle: bestAngle };
})();
