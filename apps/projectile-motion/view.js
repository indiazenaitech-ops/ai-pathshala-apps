/* Projectile Motion Lab: canvas drawing.  var view = PMVIEW(canvas)
   view.resize(cssWidth, cssHeight) · view.draw(scene) · view.toScreen(x, y) · view.info()
   scene = { trails:[{n, color, sim, prog, latest}], balls:[{st, u}], aim:{u,a,h}|null, vectors, multi:[st..],
             target:{x,w}|null, h, labels:{x,y}, clock:{t, rate}|null, colors:{...}, font } */
(function () {
  'use strict';
  var P = window.PMPHYS;

  window.PMVIEW = function (canvas) {
    var ctx = canvas.getContext('2d');
    var W = 600, Hc = 340, DPR = 1;
    var M = { l: 46, r: 14, t: 12, b: 54 };
    var V = { xmin: -4, xmax: 50, ymax: 20, s: 10 };
    var C = {}, FONT = 'system-ui, sans-serif', AUTO = null;

    function X(x) { return M.l + (x - V.xmin) * V.s; }
    function Y(y) { return Hc - M.b - y * V.s; }

    function resize(w, h) {
      DPR = Math.min(window.devicePixelRatio || 1, 2.5);
      W = Math.max(240, Math.round(w)); Hc = Math.max(200, Math.round(h));
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(Hc * DPR);
      canvas.style.height = Hc + 'px';
    }

    function niceStep(raw) {
      var p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), m = raw / p;
      return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
    }

    /* Equal scale on both axes (1 m across = 1 m up) so angles look right. */
    function fit(ext) {
      var pw = W - M.l - M.r, ph = Hc - M.t - M.b;
      var xmax = Math.max(10, ext.xmax * 1.06), ymax = Math.max(5, ext.ymax * 1.14);
      var xmin = -Math.max(0.07 * xmax, 1);
      V.s = Math.min(pw / (xmax - xmin), ph / ymax);
      var extraX = pw / V.s - (xmax - xmin);
      V.xmin = xmin - Math.min(extraX * 0.25, Math.max(0, (pw / V.s) * 0.06));
      V.xmax = V.xmin + pw / V.s;
      V.ymax = ph / V.s;
    }

    function font(px, weight) { return (weight || 600) + ' ' + px + 'px ' + FONT; }
    function text(s, x, y, color, align, base, px, weight, halo) {
      ctx.font = font(px || 12, weight);
      ctx.textAlign = align || 'left'; ctx.textBaseline = base || 'middle';
      if (halo !== false) { ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = C.surface; ctx.strokeText(s, x, y); }
      ctx.fillStyle = color; ctx.fillText(s, x, y);
    }
    function trim(v) { var r = Math.round(v * 100) / 100; return String(r); }

    function grid() {
      var major = niceStep(70 / V.s), minor = major / (String(major).charAt(0) === '2' ? 4 : 5);
      var y0 = Y(0), k, p, fs = W >= 700 ? 13 : 12;
      function vlines(step) {
        ctx.beginPath();
        for (k = Math.ceil(V.xmin / step); k * step <= V.xmax; k++) { p = Math.round(X(k * step)) + 0.5; ctx.moveTo(p, M.t); ctx.lineTo(p, y0); }
        ctx.stroke();
      }
      function hlines(step) {
        ctx.beginPath();
        for (k = 1; k * step <= V.ymax; k++) { p = Math.round(Y(k * step)) + 0.5; ctx.moveTo(M.l, p); ctx.lineTo(W - M.r, p); }
        ctx.stroke();
      }
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      if (minor * V.s >= 9) { ctx.globalAlpha = 0.35; vlines(minor); hlines(minor); }
      ctx.globalAlpha = 0.9; vlines(major); hlines(major);
      ctx.globalAlpha = 1;
      /* ground band */
      ctx.fillStyle = C.ground; ctx.fillRect(0, y0, W, Hc - y0);
      ctx.strokeStyle = C.grass; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, y0 + 1.5); ctx.lineTo(W, y0 + 1.5); ctx.stroke();
      /* y axis line at x = 0 */
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.globalAlpha = .55;
      ctx.beginPath(); ctx.moveTo(Math.round(X(0)) + 0.5, M.t); ctx.lineTo(Math.round(X(0)) + 0.5, y0); ctx.stroke();
      ctx.globalAlpha = 1;
      /* tick labels */
      for (k = Math.ceil(V.xmin / major); k * major <= V.xmax; k++) {
        p = X(k * major); if (k * major < 0 || p > W - 10) continue;
        text(trim(k * major), p, y0 + 13, C.muted, 'center', 'middle', fs, 600, false);
      }
      for (k = 1; k * major <= V.ymax; k++) {
        p = Y(k * major); if (p < M.t + 6) continue;
        text(trim(k * major), M.l - 6, p, C.muted, 'right', 'middle', fs, 600, false);
      }
      text('0', M.l - 6, y0, C.muted, 'right', 'middle', fs, 600, false);
      /* axis titles */
      text(C.lx, W - M.r, y0 + 43, C.text, 'right', 'middle', fs, 700, false);
      text(C.ly, M.l + 6, M.t + 10, C.text, 'left', 'middle', fs, 700, true);
    }

    function tower(h, faint) {
      if (!(h > 0)) return;
      ctx.save(); if (faint) ctx.globalAlpha = 0.4;
      var x1 = X(0), x0 = Math.min(x1 - 10, X(V.xmin) + 2), top = Y(h), y0 = Y(0);
      x0 = Math.max(x0, x1 - Math.max(14, Math.min(48, (x1 - X(V.xmin)) - 4)));
      ctx.fillStyle = C.tower; ctx.fillRect(x0, top, x1 - x0, y0 - top);
      ctx.strokeStyle = C.towerEdge; ctx.lineWidth = 1.5; ctx.strokeRect(x0 + 0.75, top + 0.75, x1 - x0 - 1.5, y0 - top - 1.5);
      /* brick lines */
      ctx.globalAlpha = .35; ctx.beginPath();
      for (var yy = top + 8; yy < y0; yy += 8) { ctx.moveTo(x0, Math.round(yy) + 0.5); ctx.lineTo(x1, Math.round(yy) + 0.5); }
      ctx.stroke(); ctx.restore();
    }

    function stumps(tg) {
      var xa = X(tg.x - tg.w / 2), xb = X(tg.x + tg.w / 2), y0 = Y(0), cx = X(tg.x);
      ctx.fillStyle = C.targetSoft; ctx.fillRect(Math.min(xa, cx - 6), y0 - 4, Math.max(xb - xa, 12), 9);
      ctx.strokeStyle = C.target; ctx.lineWidth = 2; ctx.strokeRect(Math.min(xa, cx - 6) + 1, y0 - 4, Math.max(xb - xa, 12) - 2, 9);
      var hgt = 30, gap = 6;
      ctx.strokeStyle = C.stump; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath();
      for (var i = -1; i <= 1; i++) { ctx.moveTo(cx + i * gap, y0 - 2); ctx.lineTo(cx + i * gap, y0 - hgt); }
      ctx.stroke();
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - gap - 2, y0 - hgt - 3); ctx.lineTo(cx + gap + 2, y0 - hgt - 3); ctx.stroke();
      ctx.lineCap = 'butt';
      text(trim(tg.x) + ' m', cx, y0 - hgt - 14, C.target, 'center', 'middle', 12, 700);
    }

    function path(sim, upto) {
      var s = sim.samples; if (!s.length) return;
      ctx.beginPath(); ctx.moveTo(X(s[0].x), Y(s[0].y));
      for (var i = 1; i < s.length && s[i].t <= upto; i++) ctx.lineTo(X(s[i].x), Y(s[i].y));
      if (upto < sim.T) { var st = P.stateAt(sim, upto); ctx.lineTo(X(st.x), Y(st.y)); }
      ctx.stroke();
    }

    function badge(n, x, y, color) {
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = C.surface; ctx.stroke();
      text(String(n), x, y + 0.5, '#fff', 'center', 'middle', 11, 800, false);
    }

    function dims(tr) {
      var sim = tr.sim, y0 = Y(0), xa = X(0), xb = X(sim.R);
      ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2;
      if (sim.tTop > 0 && sim.H > 0) {
        var tx = X(sim.xTop), ty = Y(sim.H);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, y0); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(tx, ty, 3.5, 0, Math.PI * 2); ctx.fillStyle = tr.color; ctx.fill();
        text('H = ' + trim(sim.H) + ' m', tx + 6, ty - 12, C.text, tx > W * 0.75 ? 'right' : 'left', 'middle', 12, 700);
      }
      ctx.setLineDash([]);
      if (sim.R > 0.5 && xb - xa > 40) {
        var yy = y0 + 28;
        ctx.strokeStyle = C.text; ctx.lineWidth = 1.2; ctx.beginPath();
        ctx.moveTo(xa, yy); ctx.lineTo(xb, yy); ctx.moveTo(xa, yy - 4); ctx.lineTo(xa, yy + 4); ctx.moveTo(xb, yy - 4); ctx.lineTo(xb, yy + 4); ctx.stroke();
        ctx.fillStyle = C.ground; var lab = 'R = ' + trim(sim.R) + ' m';
        ctx.font = font(12, 700); var tw = ctx.measureText(lab).width + 10;
        ctx.fillRect((xa + xb) / 2 - tw / 2, yy - 8, tw, 16);
        text(lab, (xa + xb) / 2, yy, C.text, 'center', 'middle', 12, 700, false);
      }
      ctx.restore();
    }

    function arrow(x, y, dx, dy, color, label, lw) {
      var len = Math.sqrt(dx * dx + dy * dy); if (len < 3) return;
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 2.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
      var ang = Math.atan2(dy, dx), hl = Math.min(10, len * 0.45);
      ctx.beginPath(); ctx.moveTo(x + dx, y + dy);
      ctx.lineTo(x + dx - hl * Math.cos(ang - 0.45), y + dy - hl * Math.sin(ang - 0.45));
      ctx.lineTo(x + dx - hl * Math.cos(ang + 0.45), y + dy - hl * Math.sin(ang + 0.45));
      ctx.closePath(); ctx.fill();
      if (label) text(label, x + dx + (dx >= 0 ? 5 : -5) * (Math.abs(dx) > Math.abs(dy) ? 1 : 0), y + dy + (Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? 9 : -9) : 0), color, Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 'left' : 'right') : 'center', 'middle', 12, 800);
    }

    function vectors(st, u, full) {
      var k = 56 / Math.max(u, 1), x = X(st.x), y = Y(st.y);
      if (full) arrow(x, y, st.vx * k, -st.vy * k, C.vv, 'v', 2);
      arrow(x, y, st.vx * k, 0, C.vx, full ? 'vx' : '', 3);
      arrow(x, y, 0, -st.vy * k, C.vy, full ? 'vy' : '', 3);
    }

    function ball(x, y, r) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      var gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.2, x, y, r);
      gr.addColorStop(0, '#f05a4f'); gr.addColorStop(1, '#9b1610');
      ctx.fillStyle = gr; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = '#5c0b07'; ctx.stroke();
      ctx.clip();
      ctx.strokeStyle = '#fff6e8'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(x - r * 1.55, y, r * 1.35, -0.6, 0.6); ctx.stroke();
      ctx.beginPath(); ctx.arc(x - r * 1.85, y, r * 1.35, -0.55, 0.55); ctx.stroke();
      ctx.restore();
    }

    function aim(a) {
      var x = X(0), y = Y(a.h), th = a.a * P.RAD, L = Math.min(150, 34 + a.u * 1.9);
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = C.aim; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + L * Math.cos(th), y - L * Math.sin(th)); ctx.stroke();
      ctx.setLineDash([]);
      arrow(x + (L - 2) * Math.cos(th), y - (L - 2) * Math.sin(th), 2 * Math.cos(th), -2 * Math.sin(th), C.aim, '', 2);
      /* angle arc */
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40, y); ctx.stroke();
      if (a.a > 0.5) {
        ctx.beginPath(); ctx.arc(x, y, 28, -th, 0); ctx.strokeStyle = C.aim; ctx.lineWidth = 1.6; ctx.stroke();
      }
      var mid = th / 2, lx = x + 44 * Math.cos(Math.max(mid, 0.12)), ly = y - 44 * Math.sin(Math.max(mid, 0.12));
      text('θ = ' + trim(a.a) + '°', lx + 4, ly, C.text, 'left', 'middle', 12, 700);
      ctx.restore();
    }

    /* Height that fits the trails (not the sliders, so the page never jumps while dragging). */
    function autoHeight(sc) {
      if (!AUTO) return;
      var eX = 0, eY = 0;
      sc.trails.forEach(function (tr) { eX = Math.max(eX, tr.sim.R); eY = Math.max(eY, tr.sim.H); });
      if (sc.target) eX = Math.max(eX, sc.target.x + sc.target.w);
      if (!sc.trails.length) eY = Math.max(eY, sc.h || 0);
      var xm = Math.max(10, eX * 1.06), xs = xm + Math.max(0.07 * xm, 1), ys = Math.max(5, eY * 1.14);
      var want = Math.round(M.t + M.b + (W - M.l - M.r) * ys / xs);
      want = Math.max(AUTO.min, Math.min(AUTO.max, want));
      if (Math.abs(want - Hc) > 4) resize(W, want);
    }

    function draw(sc) {
      C = sc.colors; FONT = sc.font || FONT; C.lx = sc.labels.x; C.ly = sc.labels.y;
      if (!sc.busy) autoHeight(sc);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = C.surface; ctx.fillRect(0, 0, W, Hc);
      var ext = { xmax: 0, ymax: Math.max(0, sc.h || 0) };
      sc.trails.forEach(function (tr) { ext.xmax = Math.max(ext.xmax, tr.sim.R); ext.ymax = Math.max(ext.ymax, tr.sim.H); });
      if (sc.target) ext.xmax = Math.max(ext.xmax, sc.target.x + sc.target.w);
      if (sc.aim) ext.ymax = Math.max(ext.ymax, sc.aim.h + 2);
      fit(ext);
      grid();
      if (sc.hMax > (sc.h || 0)) tower(sc.hMax, true);
      tower(sc.h);
      if (sc.target) stumps(sc.target);
      var latest = null;
      sc.trails.forEach(function (tr) {
        ctx.strokeStyle = tr.color; ctx.lineWidth = tr.latest ? 3.5 : 2.5; ctx.globalAlpha = tr.latest ? 1 : 0.85;
        ctx.lineJoin = 'round';
        path(tr.sim, tr.prog);
        ctx.globalAlpha = 1;
        if (tr.latest) latest = tr;
      });
      if (latest && latest.prog >= latest.sim.T && !sc.clock) dims(latest);
      /* number badges at landing spots (lifted when they would overlap) */
      var placed = [];
      sc.trails.forEach(function (tr) {
        if (tr.prog < tr.sim.T) return;
        var bx = X(tr.sim.R), by = Y(0) - 14;
        if (bx > W - 12) bx = W - 12;
        for (var i = 0; i < placed.length; i++) if (Math.abs(placed[i][0] - bx) < 20 && Math.abs(placed[i][1] - by) < 20) { by -= 22; i = -1; }
        placed.push([bx, by]);
        ctx.beginPath(); ctx.arc(X(tr.sim.R), Y(0), 4, 0, Math.PI * 2); ctx.fillStyle = tr.color; ctx.fill();
        badge(tr.n, bx, by, tr.color);
      });
      if (sc.aim) aim(sc.aim);
      var r = W >= 900 ? 9 : 7;
      if (sc.multi && sc.multi.length) sc.multi.forEach(function (o) { vectors(o.st, o.vmax, false); ctx.beginPath(); ctx.arc(X(o.st.x), Y(o.st.y), 3, 0, Math.PI * 2); ctx.fillStyle = C.text; ctx.fill(); });
      sc.balls.forEach(function (b) {
        if (sc.vectors) vectors(b.st, b.vmax, true);
        ball(X(b.st.x), Y(b.st.y), b.ghost ? r - 1 : r);
      });
      if (sc.vectors) {                         /* arrow key, bottom-left of the ground band */
        var ly = Y(0) + 43, lx = M.l - 30;
        text('→ vx', lx, ly, C.vx, 'left', 'middle', 12, 800, false);
        text('↑ vy', lx + 46, ly, C.vy, 'left', 'middle', 12, 800, false);
        text('↗ v', lx + 92, ly, C.vv, 'left', 'middle', 12, 800, false);
      }
      if (sc.clock) {
        var cl = 't = ' + sc.clock.t.toFixed(2) + ' s' + (sc.clock.rate > 1.05 ? '   ⏩ ×' + (Math.round(sc.clock.rate * 10) / 10) : sc.clock.rate < 0.95 ? '   ×' + (Math.round(sc.clock.rate * 100) / 100) : '');
        text(cl, W - M.r - 8, M.t + (sc.vectors ? 32 : 12), C.text, 'right', 'middle', 13, 800);
      }
    }

    return {
      resize: resize, draw: draw, setAuto: function (r) { AUTO = r; },
      toScreen: function (x, y) { return { x: X(x), y: Y(y) }; },
      info: function () { return { xmin: V.xmin, xmax: V.xmax, ymax: V.ymax, s: V.s, W: W, H: Hc }; }
    };
  };
})();
