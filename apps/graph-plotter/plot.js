/* Graph Plotter: the canvas view (grid, curves, markers, legend, tracing, pan / zoom / pinch).
   var plot = GPLOT(canvas, hooks)
   hooks: fns() -> [{i, f, color, name, src}] (visible, valid)  · P() -> {a,b,c,deg} · piAxis() · deg()
          points() -> [{kind, fi, fj, x, y}] · colors() -> {...} · onView(busy) · onTrace(info|null) */
(function () {
  'use strict';
  var M = window.GMATH;

  window.GPLOT = function (canvas, hooks) {
    var ctx = canvas.getContext('2d');
    var W = 300, Hh = 200, DPR = 1;
    var V = { cx: 0, cy: 0, sx: 40, sy: 40 };
    var trace = null, raf = 0;

    function X(x) { return W / 2 + (x - V.cx) * V.sx; }
    function Y(y) { return Hh / 2 - (y - V.cy) * V.sy; }
    function wx(px) { return V.cx + (px - W / 2) / V.sx; }
    function wy(py) { return V.cy - (py - Hh / 2) / V.sy; }
    function cy(py) { return Math.max(-4 * Hh, Math.min(5 * Hh, py)); }
    function fontPx() { return W >= 900 ? 14 : W >= 600 ? 13 : 12; }

    function resize(w, h) {
      DPR = Math.min(window.devicePixelRatio || 1, 2.5);
      W = Math.max(160, Math.round(w)); Hh = Math.max(160, Math.round(h));
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(Hh * DPR);
      canvas.style.height = Hh + 'px';
      draw();
    }
    function fit(x0, x1, y0, y1) {
      V.cx = (x0 + x1) / 2; V.cy = (y0 + y1) / 2;
      V.sx = W / (x1 - x0); V.sy = Hh / (y1 - y0);
    }
    /* equal scales on both axes, x from -half to +half */
    function square(half, cx, cyv) {
      V.sx = V.sy = W / (2 * half); V.cx = cx || 0; V.cy = cyv || 0;
    }
    function clampScale() {
      V.sx = Math.min(1e9, Math.max(1e-7, V.sx)); V.sy = Math.min(1e9, Math.max(1e-7, V.sy));
      if (!isFinite(V.cx)) V.cx = 0; if (!isFinite(V.cy)) V.cy = 0;
    }
    function zoomAt(f, px, py) {
      var x = wx(px), y = wy(py);
      V.sx *= f; V.sy *= f; clampScale();
      V.cx = x - (px - W / 2) / V.sx; V.cy = y + (py - Hh / 2) / V.sy;
      trace = null; hooks.onTrace(null);
      schedule();
    }
    function pan(dxPx, dyPx) { V.cx -= dxPx / V.sx; V.cy += dyPx / V.sy; trace = null; hooks.onTrace(null); schedule(); }

    function schedule() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; draw(); }); }

    /* -------------------------------------------------------------- drawing */
    function text(s, x, y, color, halo, align, base, font) {
      ctx.font = font || (fontPx() + 'px system-ui, "Segoe UI", Roboto, sans-serif');
      ctx.textAlign = align || 'left'; ctx.textBaseline = base || 'top';
      if (halo) { ctx.lineWidth = 4; ctx.strokeStyle = halo; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
      ctx.fillStyle = color; ctx.fillText(s, x, y);
    }

    function grid(c) {
      var usePi = hooks.piAxis() && !hooks.deg();
      var stepX = (usePi && M.piStep(V.sx, 56)) || M.niceStep(V.sx, 84);
      var isPi = usePi && Math.abs(stepX / Math.PI - Math.round(stepX / Math.PI * 12) / 12) < 1e-9;
      var stepY = M.niceStep(V.sy, 64);
      var div = function (s) { var m = s / Math.pow(10, Math.floor(Math.log(s) / Math.LN10 + 1e-9)); return Math.round(m) === 2 ? 4 : 5; };
      var minX = stepX / (isPi ? 2 : div(stepX)), minY = stepY / div(stepY);
      var x0 = wx(0), x1 = wx(W), y0 = wy(Hh), y1 = wy(0), k, p;

      function lines(step, alpha, width) {
        ctx.globalAlpha = alpha; ctx.strokeStyle = c.grid; ctx.lineWidth = width; ctx.beginPath();
        for (k = Math.ceil(x0 / step); k * step <= x1 && k - Math.ceil(x0 / step) < 2000; k++) { p = Math.round(X(k * step)) + 0.5; ctx.moveTo(p, 0); ctx.lineTo(p, Hh); }
        ctx.stroke();
      }
      function linesY(step, alpha, width) {
        ctx.globalAlpha = alpha; ctx.strokeStyle = c.grid; ctx.lineWidth = width; ctx.beginPath();
        for (k = Math.ceil(y0 / step); k * step <= y1 && k - Math.ceil(y0 / step) < 2000; k++) { p = Math.round(Y(k * step)) + 0.5; ctx.moveTo(0, p); ctx.lineTo(W, p); }
        ctx.stroke();
      }
      lines(minX, 0.45, 1); linesY(minY, 0.45, 1);
      lines(stepX, 1, 1); linesY(stepY, 1, 1);
      ctx.globalAlpha = 1;

      // axes
      var ax = X(0), ay = Y(0);
      ctx.strokeStyle = c.axis; ctx.lineWidth = 1.6; ctx.beginPath();
      if (ay >= 0 && ay <= Hh) { ctx.moveTo(0, Math.round(ay) + 0.5); ctx.lineTo(W, Math.round(ay) + 0.5); }
      if (ax >= 0 && ax <= W) { ctx.moveTo(Math.round(ax) + 0.5, 0); ctx.lineTo(Math.round(ax) + 0.5, Hh); }
      ctx.stroke();

      // tick labels (stick to the edge when an axis is off screen); drawn after the curves so markers never hide them
      var fp = fontPx(), deg = hooks.deg() ? '°' : '', L = [];
      var later = function () { var a = arguments; L.push(function () { text.apply(null, a); }); };
      var ly = Math.min(Math.max(ay + 7, 4), Hh - fp - 6);
      var lastEnd = -1e9;
      for (k = Math.ceil(x0 / stepX); k * stepX <= x1; k++) {
        var vx = k * stepX; if (Math.abs(vx) < stepX * 1e-6) continue;
        var s = (isPi ? M.piTick(vx) : M.tick(vx, stepX)) + deg, px = X(vx);
        ctx.font = fp + 'px system-ui, sans-serif';
        var w = ctx.measureText(s).width;
        if (px - w / 2 < lastEnd + 6 || px - w / 2 < 2 || px + w / 2 > W - 2) continue;
        later(s, px, ly, c.label, c.bg, 'center', 'top'); lastEnd = px + w / 2;
      }
      var rightSide = ax < 40, leftEdge = ax > W - 4;
      var lx = rightSide ? Math.max(ax, 0) + 6 : leftEdge ? W - 6 : ax - 6;
      for (k = Math.ceil(y0 / stepY); k * stepY <= y1; k++) {
        var vy = k * stepY; if (Math.abs(vy) < stepY * 1e-6) continue;
        var py = Y(vy); if (py < fp || py > Hh - fp) continue;
        later(M.tick(vy, stepY), lx, py, c.label, c.bg, rightSide ? 'left' : 'right', 'middle');
      }
      if (ax >= 0 && ax <= W && ay >= 0 && ay <= Hh) later('0', ax - 5, ay + 7, c.label, c.bg, 'right', 'top');
      var it = 'italic 700 ' + (fp + 3) + 'px Georgia, "Times New Roman", serif';
      if (ay >= 0 && ay <= Hh) later('x', W - 8, ay - 6, c.axis, c.bg, 'right', 'bottom', it);
      if (ax >= 0 && ax <= W) later('y', ax + 8, 6, c.axis, c.bg, 'left', 'top', it);
      return function () { L.forEach(function (f) { f(); }); };
    }

    function curve(o, P) {
      var f = o.f, step = DPR >= 2 ? 0.5 : 1, have = false, started = false, xp = 0, yp = 0;
      ctx.strokeStyle = o.color; ctx.lineWidth = W >= 900 ? 3 : 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      function mv(x, y) { ctx.moveTo(X(x), cy(Y(y))); }
      function ln(x, y) { ctx.lineTo(X(x), cy(Y(y))); }
      for (var px = -2; px <= W + 2; px += step) {
        var x = wx(px), y = M.ev(f, x, P);
        if (y !== y) {
          if (have) { var e = M.edge(f, P, xp, x); ln(e[0], e[1]); }
          have = false; started = true; continue;
        }
        if (!have) {
          if (started) { var e2 = M.edge(f, P, x, wx(px - step)); mv(e2[0], e2[1]); ln(x, y); } else mv(x, y);
        } else {
          var br = Math.abs(y - yp) * V.sy > 1.5 ? M.findBreak(f, P, xp, yp, x, y, V.sy) : null;
          if (br) { ln(br[0], br[1]); mv(br[2], br[3]); }
          ln(x, y);
        }
        have = true; started = true; xp = x; yp = y;
      }
      ctx.stroke();
    }

    function marker(p, color, c) {
      var x = X(p.x), y = Y(p.y);
      if (x < -10 || x > W + 10 || y < -10 || y > Hh + 10) return false;
      ctx.lineWidth = 2;
      if (p.kind === 'inter') {
        ctx.beginPath(); ctx.arc(x, y, 7.5, 0, Math.PI * 2); ctx.fillStyle = c.bg; ctx.fill();
        ctx.strokeStyle = c.axis; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fillStyle = c.axis; ctx.fill();
      } else if (p.kind === 'min' || p.kind === 'max') {
        ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 7, y); ctx.closePath();
        ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = c.bg; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = c.bg; ctx.stroke();
      }
      return true;
    }

    function coord(x, y) { return '(' + M.fmt(x, 2) + ', ' + M.fmt(y, 2) + ')'; }

    function points(c, colorOf) {
      var list = hooks.points(), shown = [];
      list.forEach(function (p) { if (marker(p, colorOf(p.fi), c)) shown.push(p); });
      if (shown.length > 10) return;
      var boxes = [], fp = fontPx() - 1;
      ctx.font = fp + 'px system-ui, sans-serif';
      shown.forEach(function (p) {
        var s = coord(p.x, p.y), w = ctx.measureText(s).width, x = X(p.x) + 9, y = Y(p.y) - fp - 9;
        if (x + w > W - 4) x = X(p.x) - 9 - w;
        if (y < 2) y = Y(p.y) + 9;
        var r = [x, y, x + w, y + fp + 2];
        if (boxes.some(function (b) { return r[0] < b[2] && r[2] > b[0] && r[1] < b[3] && r[3] > b[1]; })) return;
        boxes.push(r);
        text(s, x, y, c.text, c.bg, 'left', 'top', fp + 'px system-ui, sans-serif');
      });
    }

    function legend(fns, c) {
      if (!fns.length) return;
      var fp = W < 480 ? 12 : 14, lh = fp + 8, font = fp + 'px ui-monospace, Consolas, monospace';
      ctx.font = font;
      var rows = fns.slice(0, 8).map(function (o) {
        var s = o.src.length > 30 ? o.src.slice(0, 29) + '…' : o.src;
        return { o: o, s: o.name + '(x) = ' + s };
      });
      var w = 0; rows.forEach(function (r) { w = Math.max(w, ctx.measureText(r.s).width); });
      w = Math.min(w + 34, W * 0.7);
      var hgt = rows.length * lh + 8;
      ctx.globalAlpha = 0.9; ctx.fillStyle = c.bg; ctx.fillRect(8, 8, w, hgt); ctx.globalAlpha = 1;
      ctx.strokeStyle = c.grid; ctx.lineWidth = 1; ctx.strokeRect(8.5, 8.5, w, hgt);
      rows.forEach(function (r, k) {
        var y = 12 + k * lh + lh / 2;
        ctx.strokeStyle = r.o.color; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(15, y); ctx.lineTo(31, y); ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.rect(8, 8, w - 4, hgt); ctx.clip();
        text(r.s, 37, y, c.text, null, 'left', 'middle', font);
        ctx.restore();
      });
    }

    function drawTrace(c, colorOf) {
      if (!trace || trace.kind === 'undef') return;
      var x = X(trace.x), y = Y(trace.y), col = colorOf(trace.fi);
      if (x < 0 || x > W || y < 0 || y > Hh) return;
      ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = c.label; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(x, Y(0) >= 0 && Y(0) <= Hh ? Y(0) : (y < Y(0) ? Hh : 0)); ctx.lineTo(x, y);
      ctx.moveTo(X(0) >= 0 && X(0) <= W ? X(0) : 0, y); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = c.bg; ctx.stroke();
      var fp = fontPx() + 2, s = coord(trace.x, trace.y);
      ctx.font = '700 ' + fp + 'px system-ui, sans-serif';
      var w = ctx.measureText(s).width + 16, h = fp + 12, bx = x + 12, by = y - h - 12;
      if (bx + w > W - 4) bx = x - 12 - w;
      if (by < 4) by = y + 12;
      ctx.fillStyle = c.text; ctx.globalAlpha = 0.92; ctx.fillRect(bx, by, w, h); ctx.globalAlpha = 1;
      text(s, bx + 8, by + h / 2, c.bg, null, 'left', 'middle', '700 ' + fp + 'px system-ui, sans-serif');
    }

    function draw() {
      var c = hooks.colors(), P = hooks.P(), fns = hooks.fns();
      var colorOf = function (i) { for (var k = 0; k < fns.length; k++) if (fns[k].i === i) return fns[k].color; return c.text; };
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      try { ctx.direction = 'ltr'; } catch (e) { }   // maths reads left to right, even on an Urdu page
      ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, Hh);
      var labels = grid(c);
      fns.forEach(function (o) { curve(o, P); });
      labels();
      points(c, colorOf);
      legend(fns, c);
      drawTrace(c, colorOf);
      canvas.dataset.cx = M.raw(V.cx); canvas.dataset.cy = M.raw(V.cy);
      canvas.dataset.sx = M.raw(V.sx); canvas.dataset.sy = M.raw(V.sy);
    }

    /* -------------------------------------------------------------- tracing */
    function traceAt(px, py, touch) {
      var P = hooks.P(), fns = hooks.fns(), pt = null, cv = null;
      hooks.points().forEach(function (p) {
        var d = Math.hypot(X(p.x) - px, Y(p.y) - py);
        if (d < (touch ? 26 : 16) && (!pt || d < pt.d)) pt = { d: d, kind: 'point', p: p, fi: p.fi, x: p.x, y: p.y };
      });
      var q = M.niceStep(V.sx, 3), x = Math.round(wx(px) / q) * q;
      if (Math.abs(x) < q * 1e-6) x = 0;
      var lim = touch ? 70 : 44;
      fns.forEach(function (o) {
        var y = M.ev(o.f, x, P);
        if (y !== y) return;
        var d = Math.abs(Y(y) - py);
        if (d < lim && (!cv || d < cv.d)) cv = { d: d, kind: 'curve', fi: o.i, x: x, y: y };
      });
      /* a special point wins when it is really close, or closer than any curve */
      var best = pt && (pt.d <= (touch ? 14 : 9) || !cv || pt.d < cv.d) ? pt : cv;
      if (!best && fns.length === 1 && M.ev(fns[0].f, x, P) !== M.ev(fns[0].f, x, P)) best = { kind: 'undef', fi: fns[0].i, x: x };
      trace = best;
      hooks.onTrace(best);
      schedule();
    }
    function clearTrace() { if (trace) { trace = null; hooks.onTrace(null); schedule(); } }

    /* -------------------------------------------------------------- input */
    var ptrs = {}, drag = null, pinch = null;
    function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function count() { return Object.keys(ptrs).length; }
    function startPinch() {
      var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]];
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      pinch = { d: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)), wx: wx(mx), wy: wy(my), sx: V.sx, sy: V.sy };
    }
    canvas.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
      ptrs[e.pointerId] = pos(e);
      if (count() === 1) drag = { x: ptrs[e.pointerId].x, y: ptrs[e.pointerId].y, cx: V.cx, cy: V.cy, moved: false, id: e.pointerId };
      else if (count() === 2) { drag = null; startPinch(); }
      if (e.pointerType === 'mouse') canvas.focus({ preventScroll: true });
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', function (e) {
      var p = pos(e);
      if (!ptrs[e.pointerId]) { if (e.pointerType === 'mouse') traceAt(p.x, p.y, false); return; }
      ptrs[e.pointerId] = p;
      if (pinch && count() >= 2) {
        var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]];
        var f = Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        V.sx = pinch.sx * f; V.sy = pinch.sy * f; clampScale();
        V.cx = pinch.wx - (mx - W / 2) / V.sx; V.cy = pinch.wy + (my - Hh / 2) / V.sy;
        trace = null; hooks.onTrace(null); hooks.onView(true); schedule();
      } else if (drag) {
        var dx = p.x - drag.x, dy = p.y - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 5) drag.moved = true;
        if (drag.moved) {
          V.cx = drag.cx - dx / V.sx; V.cy = drag.cy + dy / V.sy;
          trace = null; hooks.onTrace(null); hooks.onView(true); schedule();
        }
      }
    });
    function end(e) {
      if (!ptrs[e.pointerId]) return;
      var p = ptrs[e.pointerId], wasPinch = !!pinch, wasDrag = drag && drag.moved;
      delete ptrs[e.pointerId];
      if (drag && !drag.moved && e.type === 'pointerup') traceAt(p.x, p.y, e.pointerType !== 'mouse');
      if (wasPinch || wasDrag) hooks.onView(false);
      drag = null;
      if (count() < 2) pinch = null;
      if (count() === 1) { var id = Object.keys(ptrs)[0]; drag = { x: ptrs[id].x, y: ptrs[id].y, cx: V.cx, cy: V.cy, moved: true, id: id }; }
    }
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !count()) clearTrace(); });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var p = pos(e), dy = e.deltaY * (e.deltaMode === 1 ? 30 : e.deltaMode === 2 ? 300 : 1);
      zoomAt(Math.exp(-Math.max(-300, Math.min(300, dy)) * 0.0018), p.x, p.y);
      hooks.onView(false);
    }, { passive: false });
    canvas.addEventListener('keydown', function (e) {
      var k = e.key, step = e.shiftKey ? 0.02 : 0.1, done = true;
      if (k === 'ArrowLeft') pan(W * step, 0);
      else if (k === 'ArrowRight') pan(-W * step, 0);
      else if (k === 'ArrowUp') pan(0, Hh * step);
      else if (k === 'ArrowDown') pan(0, -Hh * step);
      else if (k === '+' || k === '=') zoomAt(1.4, W / 2, Hh / 2);
      else if (k === '-' || k === '_') zoomAt(1 / 1.4, W / 2, Hh / 2);
      else done = false;
      if (done) { e.preventDefault(); hooks.onView(false); }
    });

    return {
      resize: resize, draw: draw, schedule: schedule, fit: fit, square: square, zoomAt: zoomAt, pan: pan,
      traceAt: traceAt, clearTrace: clearTrace,
      toScreen: function (x, y) { return { x: X(x), y: Y(y) }; },
      toWorld: function (px, py) { return { x: wx(px), y: wy(py) }; },
      range: function () { return { x0: wx(0), x1: wx(W), y0: wy(Hh), y1: wy(0) }; },
      getView: function () { return { cx: V.cx, cy: V.cy, sx: V.sx, sy: V.sy }; },
      setView: function (v) { if (v && isFinite(v.cx) && isFinite(v.cy) && v.sx > 0 && v.sy > 0) { V.cx = +v.cx; V.cy = +v.cy; V.sx = +v.sx; V.sy = +v.sy; clampScale(); } },
      size: function () { return { w: W, h: Hh }; },
      get trace() { return trace; }
    };
  };
})();
