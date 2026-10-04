/* Statistics Calculator: canvas charts (histogram / bar graph, frequency polygon, ogives).
   window.StatChart.draw(canvas, spec) → info { meetX, meetY }
   spec = { kind: 'hist'|'poly'|'ogive', data: {type:'classes', classes:[{l,u,f}], n} | {type:'discrete', items:[{x,f}], n},
            colors: {...}, font, fmt(v), labels: {x, y, yAdj, yCf, less, more, median}, height } */
(function () {
  'use strict';

  function niceStep(raw, integer) {
    if (!(raw > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    var s = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
    return integer ? Math.max(1, Math.round(s)) : s;
  }

  /* where two polylines (each sorted by x) cross: returns {x, y} or null */
  function crossing(A, B) {
    var xs = [];
    A.concat(B).forEach(function (p) { xs.push(p[0]); });
    xs = xs.filter(function (x, i) { return xs.indexOf(x) === i; }).sort(function (a, b) { return a - b; });
    function at(P, x) {
      if (x < P[0][0] - 1e-12 || x > P[P.length - 1][0] + 1e-12) return null;
      for (var i = 0; i + 1 < P.length; i++) {
        if (x >= P[i][0] - 1e-12 && x <= P[i + 1][0] + 1e-12) {
          var dx = P[i + 1][0] - P[i][0];
          return dx ? P[i][1] + (x - P[i][0]) / dx * (P[i + 1][1] - P[i][1]) : P[i][1];
        }
      }
      return P[P.length - 1][1];
    }
    var prev = null;
    for (var i = 0; i < xs.length; i++) {
      var a = at(A, xs[i]), b = at(B, xs[i]);
      if (a === null || b === null) continue;
      var d = a - b;
      if (Math.abs(d) < 1e-12) return { x: xs[i], y: a };
      if (prev && (prev.d < 0) !== (d < 0)) {
        var t = prev.d / (prev.d - d), x = prev.x + t * (xs[i] - prev.x);
        return { x: x, y: at(A, x) };
      }
      prev = { x: xs[i], d: d };
    }
    return null;
  }

  function draw(cv, spec) {
    var dpr = Math.min(3, window.devicePixelRatio || 1);
    var W = Math.max(260, cv.clientWidth || (cv.parentNode && cv.parentNode.clientWidth) || 640);
    var H = spec.height || Math.round(Math.max(250, Math.min(500, W * 0.56)));
    cv.style.height = H + 'px';
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.direction = 'ltr';
    var C = spec.colors, L = spec.labels, fmt = spec.fmt, D = spec.data, kind = spec.kind;
    var fs = spec.fontSize || (W < 520 ? 12 : W < 900 ? 14 : 16);
    function font(w, s) { return (w || 400) + ' ' + (s || fs) + 'px ' + spec.font; }
    ctx.fillStyle = C.surface; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'middle';
    var info = { meetX: null, meetY: null };
    if (!D) return info;

    /* ---------- series ---------- */
    var isCls = D.type === 'classes', n = D.n;
    var xmin, xmax, ymax, xticks = [], bars = [], poly = [], less = [], more = [];
    var adj = false;
    if (isCls) {
      var cls = D.classes, k = cls.length, h0 = cls[0].u - cls[0].l, hL = cls[k - 1].u - cls[k - 1].l;
      var minW = Infinity; cls.forEach(function (c) { minW = Math.min(minW, c.u - c.l); });
      cls.forEach(function (c) {
        var w = c.u - c.l, fa = c.f * minW / w;
        if (Math.abs(w - minW) > 1e-9 * Math.max(1, w)) adj = true;
        bars.push({ x1: c.l, x2: c.u, y: fa, f: c.f });
        poly.push([(c.l + c.u) / 2, fa]);
      });
      poly.unshift([cls[0].l - h0 / 2, 0]); poly.push([cls[k - 1].u + hL / 2, 0]);
      var cum = 0;
      less.push([cls[0].l, 0]);
      cls.forEach(function (c) { more.push([c.l, n - cum]); cum += c.f; less.push([c.u, cum]); });
      more.push([cls[k - 1].u, 0]);
      xticks = [cls[0].l].concat(cls.map(function (c) { return c.u; }));
      if (kind === 'ogive') { xmin = cls[0].l; xmax = cls[k - 1].u; var pad = (xmax - xmin) * 0.03; xmin -= pad; xmax += pad; }
      else { xmin = cls[0].l - h0; xmax = cls[k - 1].u + hL; }
      ymax = kind === 'ogive' ? n : Math.max.apply(null, bars.map(function (b) { return b.y; }));
    } else {
      var items = D.items.filter(function (it) { return it.f > 0; });
      var g = Infinity;
      for (var i = 0; i + 1 < items.length; i++) g = Math.min(g, items[i + 1].x - items[i].x);
      if (!isFinite(g) || g <= 0) g = Math.max(1, Math.abs(items[0].x) * 0.1 || 1);
      var c2 = 0;
      items.forEach(function (it) {
        bars.push({ x1: it.x - g * 0.3, x2: it.x + g * 0.3, y: it.f, f: it.f, c: it.x });
        poly.push([it.x, it.f]);
        more.push([it.x, n - c2]); c2 += it.f; less.push([it.x, c2]);
        xticks.push(it.x);
      });
      xmin = items[0].x - g * 0.8; xmax = items[items.length - 1].x + g * 0.8;
      ymax = kind === 'ogive' ? n : Math.max.apply(null, items.map(function (it) { return it.f; }));
    }
    if (!(xmax > xmin)) { xmin -= 1; xmax += 1; }

    /* ---------- legend (ogive) ---------- */
    var top = 14, legend = [];
    if (kind === 'ogive') {
      legend = [{ c: C.c1, t: L.less, dash: false }, { c: C.c2, t: L.more, dash: false }];
      ctx.font = font(600);
      var lx = 0, lines = 1, maxLine = W - 40;
      legend.forEach(function (it) {
        var w = 34 + ctx.measureText(it.t).width + 18;
        if (lx && lx + w > maxLine) { lines++; lx = 0; }
        it.line = lines - 1; it.w = w; lx += w;
      });
      top = 12 + lines * (fs + 12);
    } else top = Math.round(fs * 1.4);

    /* ---------- y scale ---------- */
    var integerY = kind === 'ogive' || !adj;
    var step = niceStep((ymax || 1) / 5, integerY);
    var yTop = Math.ceil(((ymax || 1) * (kind === 'ogive' ? 1 : 1.1)) / step) * step;
    if (yTop < ymax) yTop += step;
    var yt = []; for (var v = 0; v <= yTop + step * 1e-6; v += step) yt.push(Math.round(v / step) * step);

    ctx.font = font(400);
    var ytw = 0; yt.forEach(function (v) { ytw = Math.max(ytw, ctx.measureText(fmt(v)).width); });
    var left = Math.round(10 + fs * 1.5 + 8 + ytw + 8), right = 18, bottom = Math.round(fs * 3.6 + 12);
    var pw = W - left - right, ph = H - top - bottom;
    function X(x) { return left + (x - xmin) / (xmax - xmin) * pw; }
    function Y(y) { return top + ph - y / yTop * ph; }

    /* grid + y ticks */
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.fillStyle = C.muted; ctx.textAlign = 'right';
    yt.forEach(function (v) {
      var y = Math.round(Y(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + pw, y); ctx.stroke();
      ctx.fillText(fmt(v), left - 8, y);
    });

    /* ---------- marks ---------- */
    var showBars = kind === 'hist' || (kind === 'poly' && isCls);
    if (showBars) {
      bars.forEach(function (b) {
        var x1 = X(b.x1), x2 = X(b.x2), y = Y(b.y), y0 = Y(0);
        ctx.globalAlpha = kind === 'poly' ? 0.28 : 0.85;
        ctx.fillStyle = C.c1; ctx.fillRect(x1, y, x2 - x1, y0 - y);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = kind === 'poly' ? C.c1 : C.surface; ctx.lineWidth = kind === 'poly' ? 1 : 1.5;
        ctx.strokeRect(x1 + 0.5, y + 0.5, Math.max(0, x2 - x1 - 1), Math.max(0, y0 - y - 1));
        if (kind === 'hist' && b.f > 0 && x2 - x1 > fs * 1.3) {
          ctx.fillStyle = C.text; ctx.textAlign = 'center'; ctx.font = font(700, Math.max(11, fs - 1));
          ctx.fillText(fmt(b.f), (x1 + x2) / 2, y - fs * 0.7);
          ctx.font = font(400);
        }
      });
    }
    function line(P, color, dots) {
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath();
      P.forEach(function (p, i) { var x = X(p[0]), y = Y(p[1]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.stroke();
      if (dots) {
        ctx.fillStyle = color;
        P.forEach(function (p) { ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 4.5, 0, Math.PI * 2); ctx.fill(); });
      }
    }
    if (kind === 'ogive') {
      line(less, C.c1, true);
      line(more, C.c2, true);
      var m = crossing(less, more);
      if (m) {
        info.meetX = m.x; info.meetY = m.y;
        var mx = X(m.x), my = Y(m.y);
        ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = C.c5; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx, Y(0)); ctx.moveTo(mx, my); ctx.lineTo(left, my); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = C.c5; ctx.beginPath(); ctx.arc(mx, my, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.surface; ctx.beginPath(); ctx.arc(mx, my, 2.5, 0, Math.PI * 2); ctx.fill();
        /* label */
        var txt = L.median + ' ≈ ' + (spec.fmtV || fmt)(m.x);
        ctx.font = font(700);
        var tw = ctx.measureText(txt).width + 14, th = fs + 12;
        var bx = mx + 12, by = my - th - 10;
        if (bx + tw > left + pw) bx = mx - 12 - tw;
        if (by < top) by = my + 12;
        ctx.fillStyle = C.surface; ctx.strokeStyle = C.c5; ctx.lineWidth = 1.5;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, tw, th, 6); else ctx.rect(bx, by, tw, th);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.text; ctx.textAlign = 'left';
        var dir = ctx.direction; ctx.direction = 'ltr';
        ctx.fillText(txt, bx + 7, by + th / 2);
        ctx.direction = dir;
        ctx.font = font(400);
      }
    }

    /* ---------- axes ---------- */
    ctx.strokeStyle = C.text; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(left, top - 4); ctx.lineTo(left, Y(0)); ctx.lineTo(left + pw, Y(0)); ctx.stroke();
    /* NCERT-style kink: the x-axis does not start at 0 (only when there is room before the first bar) */
    if (isCls && xmin > 0 && kind !== 'ogive' && X(kind === 'poly' ? poly[0][0] : D.classes[0].l) - left >= 26) {
      var zx = left + 6, zy = Y(0);
      ctx.fillStyle = C.surface; ctx.fillRect(zx, zy - 3, 16, 6);
      ctx.strokeStyle = C.text; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(zx, zy); ctx.lineTo(zx + 4, zy - 5); ctx.lineTo(zx + 8, zy + 5); ctx.lineTo(zx + 12, zy - 5); ctx.lineTo(zx + 16, zy); ctx.stroke();
    }

    /* the polygon goes on top of the axis (its end points sit on the x-axis, next to the kink) */
    if (kind === 'poly') line(poly, C.c2, true);

    /* x ticks with overlap skipping */
    ctx.font = font(400); ctx.fillStyle = C.muted; ctx.textAlign = 'center';
    var lastEnd = -Infinity, ty = Y(0) + fs * 0.95;
    xticks.forEach(function (v, i) {
      var x = X(v), s = fmt(v), w = ctx.measureText(s).width;
      ctx.strokeStyle = C.text; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, Y(0)); ctx.lineTo(x, Y(0) + 5); ctx.stroke();
      var last = i === xticks.length - 1;
      if (x - w / 2 > lastEnd + 6 && (!last || x + w / 2 <= W - 2)) { ctx.fillText(s, x, ty); lastEnd = x + w / 2; }
    });

    /* axis titles */
    ctx.fillStyle = C.text; ctx.font = font(700); ctx.textAlign = 'center';
    if (spec.rtl) ctx.direction = 'rtl';
    var xTitle = isCls ? L.xCls : L.xVal;
    var yTitle = kind === 'ogive' ? L.yCf : (adj ? L.yAdj : L.y);
    ctx.fillText(xTitle, left + pw / 2, H - fs * 0.9 - 4);
    ctx.save(); ctx.translate(10 + fs * 0.8, top + ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText(yTitle, 0, 0); ctx.restore();

    /* legend */
    if (legend.length) {
      ctx.font = font(600); ctx.textAlign = 'left';
      var rows = {};
      legend.forEach(function (it) { (rows[it.line] = rows[it.line] || []).push(it); });
      Object.keys(rows).forEach(function (r) {
        var tot = rows[r].reduce(function (s, it) { return s + it.w; }, 0), x = Math.max(8, (W - tot) / 2), y = 12 + r * (fs + 12) + fs / 2 + 2;
        rows[r].forEach(function (it) {
          ctx.strokeStyle = it.c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 26, y); ctx.stroke();
          ctx.fillStyle = it.c; ctx.beginPath(); ctx.arc(x + 13, y, 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = C.text; ctx.textAlign = spec.rtl ? 'right' : 'left';
          ctx.fillText(it.t, spec.rtl ? x + it.w - 18 : x + 34, y);
          ctx.textAlign = 'left';
          x += it.w;
        });
      });
    }
    ctx.direction = 'ltr';
    info.adjusted = adj;
    return info;
  }

  window.StatChart = { draw: draw, crossing: crossing };
})();
