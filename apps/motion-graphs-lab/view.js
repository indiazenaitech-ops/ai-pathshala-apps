/* Motion Graphs Lab: drawing.  window.MGVIEW
   graph(svg, o)  draws a d–t, v–t or a–t graph into an inline <svg> (colours come from CSS classes, so dark mode
                  and printing need no redraw). Returns { X, Y, xToT, T } for pointer work (slope markers).
   road(canvas, o) draws the vehicle on a straight road, or a ball going straight up, at time o.t. */
(function () {
  'use strict';
  var M = window.MGL;
  var NS = 'http://www.w3.org/2000/svg';

  function sv(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') e.textContent = v; else e.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) e.appendChild(arguments[i]);
    return e;
  }
  function niceStep(raw) {
    if (!(raw > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), m = raw / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }
  function trim(v) { var r = Math.round(v * 100) / 100; return String(r === 0 ? 0 : r); }

  /* o = { kind:'d'|'v'|'a', model, width, height, compact, fmt, labels:{t, y, unit, dt, dy, slope, area},
           shade, cursorT, slope:{kind, t1, t2}|null, units:{ms, ms2, m} } */
  function graph(svg, o) {
    var W = Math.max(160, Math.round(o.width || 320)), H = Math.max(100, Math.round(o.height || 180));
    var compact = !!o.compact, m = o.model, kind = o.kind, fmt = o.fmt || trim, L = o.labels || {};
    var pad = compact ? { l: 22, r: 12, t: 14, b: 20 } : { l: 54, r: 16, t: 18, b: 32 };
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('data-kind', kind);

    var T = m.T > 0 ? m.T : 10, lo, hi;
    if (kind === 'd') { lo = Math.min(0, m.dmin); hi = Math.max(0, m.dmax); }
    else if (kind === 'v') { lo = Math.min(0, m.vmin); hi = Math.max(0, m.vmax); }
    else { lo = Math.min(0, m.amin); hi = Math.max(0, m.amax); }
    if (hi - lo < 1e-9) { if (hi <= 0 && lo >= 0) { lo = -1; hi = 1; } else { hi = lo + 1; } }
    var span = hi - lo;
    if (lo < 0 && hi > 0) { lo -= span * 0.1; hi += span * 0.1; }
    else if (hi > 0) { hi += span * 0.12; lo = Math.min(lo, -span * 0.04); }
    else { lo -= span * 0.12; hi = Math.max(hi, span * 0.04); }
    var pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    function X(t) { return pad.l + t / T * pw; }
    function Y(y) { return H - pad.b - (y - lo) / (hi - lo) * ph; }
    var y0 = Y(0), x0 = X(0);

    var g = sv('g', { class: 'mg-g' });
    svg.appendChild(g);

    /* grid + tick numbers */
    var k, p;
    if (!compact) {
      var ts = niceStep(T / (pw > 420 ? 8 : 5)), ys = niceStep((hi - lo) / (ph > 170 ? 5 : 4));
      var grid = sv('g', { class: 'mg-grid' });
      for (k = 0; k * ts <= T + 1e-9; k++) { p = X(k * ts); grid.appendChild(sv('line', { x1: p, y1: pad.t, x2: p, y2: H - pad.b })); }
      for (k = Math.ceil(lo / ys); k * ys <= hi + 1e-9; k++) { p = Y(k * ys); grid.appendChild(sv('line', { x1: pad.l, y1: p, x2: W - pad.r, y2: p })); }
      g.appendChild(grid);
      var tl = sv('g', { class: 'mg-ticks' });
      for (k = 0; k * ts <= T + 1e-9; k++) {
        p = X(k * ts); if (k > 0 && p > W - pad.r - 8 && k * ts < T - 1e-9) continue;
        tl.appendChild(sv('text', { x: p, y: y0 + 14, 'text-anchor': 'middle', text: fmt(k * ts) }));
      }
      for (k = Math.ceil(lo / ys); k * ys <= hi + 1e-9; k++) {
        if (k === 0) continue;
        p = Y(k * ys); if (p < pad.t + 4) continue;
        tl.appendChild(sv('text', { x: pad.l - 6, y: p + 4, 'text-anchor': 'end', text: fmt(k * ys) }));
      }
      tl.appendChild(sv('text', { x: pad.l - 6, y: y0 + 4, 'text-anchor': 'end', text: '0' }));
      g.appendChild(tl);
      /* segment ends */
      var se = sv('g', { class: 'mg-segends' });
      m.segs.forEach(function (s, i) { if (i < m.segs.length - 1) se.appendChild(sv('line', { x1: X(s.t1), y1: pad.t, x2: X(s.t1), y2: H - pad.b })); });
      g.appendChild(se);
    }

    /* shaded area under the v–t graph */
    if (kind === 'v' && o.shade) {
      var ar = sv('g', { class: 'mg-areas' });
      var bestPos = null, bestNeg = null;
      function piece(ta, tb, va, vb) {
        if (tb - ta < 1e-9) return;
        var sign = (va + vb) >= 0 ? 'pos' : 'neg', area = (va + vb) / 2 * (tb - ta);
        ar.appendChild(sv('polygon', { class: 'mg-area ' + sign, points: [X(ta), y0, X(ta), Y(va), X(tb), Y(vb), X(tb), y0].join(' ') }));
        var rec = { ta: ta, tb: tb, va: va, vb: vb, area: Math.abs(area) };
        if (sign === 'pos') { if (!bestPos || rec.area > bestPos.area) bestPos = rec; }
        else if (!bestNeg || rec.area > bestNeg.area) bestNeg = rec;
      }
      m.segs.forEach(function (s) {
        if (s.tz === null) piece(s.t0, s.t1, s.u, s.v);
        else { piece(s.t0, s.t0 + s.tz, s.u, 0); piece(s.t0 + s.tz, s.t1, 0, s.v); }
      });
      g.appendChild(ar);
      if (!compact) {
        var pa = M.areaParts(m), lb = sv('g', { class: 'mg-arealbl' });
        if (bestPos && pa.pos > 0 && (X(bestPos.tb) - X(bestPos.ta)) > 44) {
          lb.appendChild(sv('text', { x: (X(bestPos.ta) + X(bestPos.tb)) / 2, y: Math.min(y0 - 8, (y0 + Y(Math.max(bestPos.va, bestPos.vb)) / 2) + 4), 'text-anchor': 'middle', class: 'pos', text: '+' + fmt(pa.pos) + ' m' }));
        }
        if (bestNeg && pa.neg > 0 && (X(bestNeg.tb) - X(bestNeg.ta)) > 44) {
          lb.appendChild(sv('text', { x: (X(bestNeg.ta) + X(bestNeg.tb)) / 2, y: Math.max(y0 + 16, (y0 + Y(Math.min(bestNeg.va, bestNeg.vb))) / 2 + 4), 'text-anchor': 'middle', class: 'neg', text: '−' + fmt(pa.neg) + ' m' }));
        }
        g.appendChild(lb);
      }
    }

    /* axes */
    var ax = sv('g', { class: 'mg-axes' });
    ax.appendChild(sv('line', { x1: pad.l, y1: y0, x2: W - pad.r + 4, y2: y0 }));
    ax.appendChild(sv('polygon', { points: [W - pad.r + 10, y0, W - pad.r + 2, y0 - 4, W - pad.r + 2, y0 + 4].join(' ') }));
    ax.appendChild(sv('line', { x1: x0, y1: H - pad.b, x2: x0, y2: pad.t - 4 }));
    ax.appendChild(sv('polygon', { points: [x0, pad.t - 10, x0 - 4, pad.t - 2, x0 + 4, pad.t - 2].join(' ') }));
    g.appendChild(ax);

    /* the curve */
    var pts = M.samples(m, kind, pw > 500 ? 40 : 24), cur = sv('g', { class: 'mg-curve ' + kind });
    if (pts.length) {
      var d = '', jumps = '', last = null;
      pts.forEach(function (q) {
        if (q.start && last && Math.abs(last.y - q.y) > 1e-9) { jumps += 'M' + X(last.t) + ' ' + Y(last.y) + 'L' + X(q.t) + ' ' + Y(q.y); }
        d += (q.start && !last ? 'M' : q.start ? 'M' : 'L') + X(q.t) + ' ' + Y(q.y);
        last = q;
      });
      if (jumps) cur.appendChild(sv('path', { class: 'mg-jump', d: jumps }));
      cur.appendChild(sv('path', { class: 'mg-line', d: d }));
      if (!compact) {
        cur.appendChild(sv('circle', { class: 'mg-end', cx: X(pts[0].t), cy: Y(pts[0].y), r: 3.5 }));
        cur.appendChild(sv('circle', { class: 'mg-end', cx: X(last.t), cy: Y(last.y), r: 3.5 }));
      }
    }
    g.appendChild(cur);

    /* axis titles */
    var tt = sv('g', { class: 'mg-titles' + (compact ? ' compact' : '') });
    tt.appendChild(sv('text', { x: W - pad.r + 8, y: y0 + (compact ? 14 : 28), 'text-anchor': 'end', text: L.t || 't' }));
    tt.appendChild(sv('text', { x: x0 + 8, y: pad.t - 2, 'text-anchor': 'start', text: L.y || kind }));
    g.appendChild(tt);

    /* slope tool */
    if (!compact && o.slope && o.slope.kind === kind && m.T > 0) {
      var s1 = Math.min(m.T, Math.max(0, o.slope.t1)), s2 = Math.min(m.T, Math.max(0, o.slope.t2));
      var P = M.at(m, s1), Q = M.at(m, s2), key = kind === 'v' ? 'v' : 'd';
      var sg = sv('g', { class: 'mg-slope' });
      var px = X(P.t), py = Y(P[key]), qx = X(Q.t), qy = Y(Q[key]);
      sg.appendChild(sv('path', { class: 'mg-tri', d: 'M' + px + ' ' + py + 'L' + qx + ' ' + py + 'L' + qx + ' ' + qy }));
      sg.appendChild(sv('line', { class: 'mg-secant', x1: px, y1: py, x2: qx, y2: qy }));
      var sl = M.slope(m, kind, P.t, Q.t);
      var unit = kind === 'v' ? (o.units && o.units.ms2 || 'm/s²') : (o.units && o.units.ms || 'm/s');
      var yUnit = kind === 'v' ? (o.units && o.units.ms || 'm/s') : (o.units && o.units.m || 'm');
      if (Math.abs(qx - px) > 30) sg.appendChild(sv('text', { x: (px + qx) / 2, y: py + (qy < py ? 14 : -6), 'text-anchor': 'middle', class: 'mg-slbl', text: (L.dt || 'Δt') + ' = ' + fmt(Q.t - P.t) + ' s' }));
      if (Math.abs(qy - py) > 24) sg.appendChild(sv('text', { x: qx + (qx > W * 0.7 ? -6 : 6), y: (py + qy) / 2 + 4, 'text-anchor': qx > W * 0.7 ? 'end' : 'start', class: 'mg-slbl', text: (L.dy || 'Δ') + ' = ' + fmt(Q[key] - P[key]) + ' ' + yUnit }));
      if (sl) sg.appendChild(sv('text', { x: (px + qx) / 2, y: Math.min(py, qy) - 14, 'text-anchor': 'middle', class: 'mg-sval', text: (L.slope || 'slope') + ' = ' + fmt(sl.value) + ' ' + unit }));
      [[1, px, py, P.t], [2, qx, qy, Q.t]].forEach(function (mk) {
        var grp = sv('g', { class: 'mg-marker', 'data-m': mk[0], tabindex: '0', role: 'slider', 'aria-valuemin': '0', 'aria-valuemax': trim(m.T), 'aria-valuenow': trim(mk[3]), 'aria-label': (L.marker || 'marker') + ' ' + mk[0] });
        grp.appendChild(sv('circle', { class: 'mg-hit', cx: mk[1], cy: mk[2], r: 22 }));
        grp.appendChild(sv('circle', { class: 'mg-dot', cx: mk[1], cy: mk[2], r: 9 }));
        grp.appendChild(sv('text', { x: mk[1], y: mk[2] + 4, 'text-anchor': 'middle', class: 'mg-mnum', text: String(mk[0]) }));
        sg.appendChild(grp);
      });
      g.appendChild(sg);
    }

    /* time cursor (setCursor moves it later without rebuilding the graph, for smooth playback) */
    var setCursor = null;
    if (!compact && o.cursorT !== null && o.cursorT !== undefined && m.T > 0) {
      var ux = kind === 'd' ? (o.units && o.units.m || 'm') : kind === 'v' ? (o.units && o.units.ms || 'm/s') : (o.units && o.units.ms2 || 'm/s²');
      var vk = kind === 'd' ? 'd' : kind === 'v' ? 'v' : 'a';
      var cg = sv('g', { class: 'mg-cursor' });
      var cl = sv('line', { x1: 0, y1: pad.t, x2: 0, y2: H - pad.b }), cc = sv('circle', { cx: 0, cy: 0, r: 5 }), ctx = sv('text', { x: 0, y: 0, text: '' });
      cg.appendChild(cl); cg.appendChild(cc); cg.appendChild(ctx);
      setCursor = function (tc) {
        var ct = Math.min(m.T, Math.max(0, tc)), st = M.at(m, ct), val = st[vk], cx = X(ct), cy = Y(val), right = cx > W - 90;
        cl.setAttribute('x1', cx); cl.setAttribute('x2', cx);
        cc.setAttribute('cx', cx); cc.setAttribute('cy', cy);
        /* label above the point, or below it when the point is near the top (so it never covers the axis title) */
        var below = cy < pad.t + 26;
        ctx.setAttribute('x', cx + (right ? -9 : 9)); ctx.setAttribute('y', below ? cy + 18 : cy - 9); ctx.setAttribute('text-anchor', right ? 'end' : 'start');
        ctx.textContent = fmt(val) + ' ' + ux;
      };
      setCursor(o.cursorT);
      g.appendChild(cg);
    }
    return { X: X, Y: Y, T: T, xToT: function (px) { return Math.min(T, Math.max(0, (px - pad.l) / pw * T)); }, pad: pad, W: W, H: H, setCursor: setCursor };
  }

  /* ---------------- the road (canvas) ---------------- */
  var FACES = { car: 'left', bus: 'left', cycle: 'right', train: 'front', ball: 'none', dot: 'none' };
  function road(cv, o) {
    var ctx = cv.getContext('2d'), DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    var W = Math.max(200, Math.round(o.width)), H = Math.max(80, Math.round(o.height));
    if (cv.width !== Math.round(W * DPR) || cv.height !== Math.round(H * DPR)) { cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
    cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var C = o.colors, m = o.model, st = M.at(m, o.t), fmt = o.fmt || trim, F = o.font || 'system-ui, sans-serif';
    ctx.fillStyle = C.surface; ctx.fillRect(0, 0, W, H);
    function txt(s, x, y, color, align, px, weight) {
      ctx.font = (weight || 600) + ' ' + (px || 13) + 'px ' + F; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = color; ctx.fillText(s, x, y);
    }
    var lo = Math.min(0, m.dmin, m.d0), hi = Math.max(0, m.dmax, m.d0);
    if (hi - lo < 1) hi = lo + 10;
    var span = hi - lo;
    var emoji = o.emoji, face = FACES[o.vehicle] || 'none', dir = st.v < -1e-9 ? 'left' : st.v > 1e-9 ? 'right' : null;
    var arrowLen = Math.min(70, Math.abs(st.v) / Math.max(1, Math.max(Math.abs(m.vmax), Math.abs(m.vmin))) * 70);

    if (o.vertical) {
      /* straight up: ground at the bottom, height scale on the left */
      var gy = H - 26, top = 30, lx = 48;
      function Yv(d) { return gy - (d - lo) / span * (gy - top); }
      ctx.fillStyle = C.ground; ctx.fillRect(0, gy, W, H - gy);
      ctx.strokeStyle = C.grass; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, gy + 1.5); ctx.lineTo(W, gy + 1.5); ctx.stroke();
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx, gy); ctx.lineTo(lx, top - 6); ctx.stroke();
      var step = niceStep(span / 5), kk;
      for (kk = Math.ceil(lo / step); kk * step <= hi + 1e-9; kk++) {
        var yy = Yv(kk * step);
        ctx.beginPath(); ctx.moveTo(lx - 5, yy); ctx.lineTo(lx + 5, yy); ctx.stroke();
        txt(fmt(kk * step), lx - 8, yy, C.muted, 'right', 12);
      }
      txt(o.labels.m, lx - 8, top - 10, C.muted, 'right', 11);
      var cx = W / 2, cy = Yv(st.d);
      /* dotted path of the whole flight */
      ctx.setLineDash([3, 5]); ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(cx, Yv(m.dmin)); ctx.lineTo(cx, Yv(m.dmax)); ctx.stroke(); ctx.setLineDash([]);
      if (emoji) { ctx.font = '30px ' + F; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.text; ctx.fillText(emoji, cx, cy); }
      else { ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fillStyle = C.primary; ctx.fill(); }
      if (dir && arrowLen > 4) arrow(ctx, cx + 30, cy, 0, dir === 'right' ? -arrowLen : arrowLen, C.accent);
      txt('d = ' + fmt(st.d) + ' ' + o.labels.m, cx + 44, cy, C.text, 'left', 13, 700);
      txt('v = ' + fmt(st.v) + ' ' + o.labels.ms, cx + 44, cy + 18, C.muted, 'left', 12);
    } else {
      var ry = Math.round(H * 0.5), bh = 36, padx = 44;
      function Xr(d) { return padx + (d - lo) / span * (W - 2 * padx); }
      ctx.fillStyle = C.road; ctx.fillRect(0, ry - bh / 2, W, bh);
      ctx.strokeStyle = C.dash; ctx.lineWidth = 2; ctx.setLineDash([14, 12]); ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(W, ry); ctx.stroke(); ctx.setLineDash([]);
      /* distance posts */
      var stp = niceStep(span / (W > 700 ? 10 : 5)), k2;
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
      for (k2 = Math.ceil(lo / stp); k2 * stp <= hi + 1e-9; k2++) {
        var xx = Xr(k2 * stp);
        ctx.beginPath(); ctx.moveTo(xx, ry + bh / 2); ctx.lineTo(xx, ry + bh / 2 + 6); ctx.stroke();
        txt(fmt(k2 * stp), xx, ry + bh / 2 + 16, C.muted, 'center', 12);
      }
      txt(o.labels.m, W - 6, ry + bh / 2 + 16, C.muted, 'right', 11);
      /* start flag */
      var sx = Xr(m.d0);
      ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, ry - bh / 2 - 26); ctx.lineTo(sx, ry - bh / 2 + 2); ctx.stroke();
      ctx.fillStyle = C.accent; ctx.beginPath(); ctx.moveTo(sx, ry - bh / 2 - 26); ctx.lineTo(sx + 14, ry - bh / 2 - 21); ctx.lineTo(sx, ry - bh / 2 - 16); ctx.closePath(); ctx.fill();
      /* vehicle */
      var vx = Xr(st.d), vy = ry;
      if (emoji) {
        var want = dir || 'right', flip = face !== 'front' && face !== 'none' && face !== want;
        ctx.save(); ctx.translate(vx, vy); if (flip) ctx.scale(-1, 1);
        ctx.font = '32px ' + F; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.text; ctx.fillText(emoji, 0, 0);
        ctx.restore();
      } else { ctx.beginPath(); ctx.arc(vx, vy, 12, 0, Math.PI * 2); ctx.fillStyle = C.primary; ctx.fill(); }
      if (dir && arrowLen > 4) arrow(ctx, vx, vy - bh / 2 - 12, dir === 'right' ? arrowLen : -arrowLen, 0, C.accent);
      var lblx = Math.min(W - 6, Math.max(6, vx)), al = vx < 70 ? 'left' : vx > W - 70 ? 'right' : 'center';
      txt('d = ' + fmt(st.d) + ' ' + o.labels.m, lblx, ry + bh / 2 + 34, C.text, al, 13, 700);
      txt('v = ' + fmt(st.v) + ' ' + o.labels.ms, lblx, ry - bh / 2 - 34, C.muted, al, 12);
    }
    txt('t = ' + fmt(st.t) + ' s', 8, 14, C.text, 'left', 13, 700);
    if (o.labels.title) txt(o.labels.title, W - 8, 14, C.muted, 'right', 12);
  }
  function arrow(ctx, x, y, dx, dy, color) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
    var ang = Math.atan2(dy, dx), hl = 9;
    ctx.beginPath(); ctx.moveTo(x + dx, y + dy);
    ctx.lineTo(x + dx - hl * Math.cos(ang - 0.5), y + dy - hl * Math.sin(ang - 0.5));
    ctx.lineTo(x + dx - hl * Math.cos(ang + 0.5), y + dy - hl * Math.sin(ang + 0.5));
    ctx.closePath(); ctx.fill(); ctx.lineCap = 'butt';
  }

  window.MGVIEW = { graph: graph, road: road, sv: sv, niceStep: niceStep };
})();
