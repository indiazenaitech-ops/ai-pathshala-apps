/* Lens & Mirror Ray Lab: draws the ray diagram on a canvas.
   RayDraw.draw(ctx, W, H, R, opt) → view   (R = RayOptics.solve(...), opt = { C: colours, t: EDU.t, rays: [bool], font }) */
window.RayDraw = (function () {
  'use strict';
  var RAY_VARS = ['c1', 'c5', 'c4', 'c7'];

  function view(W, H, R) {
    var F = R.fAbs, pad = 14, rulerH = 24;
    var xmin = -3.7 * F, xmax = R.mirror ? 2.6 * F : 3.7 * F;
    var y0 = Math.round((H - rulerH) / 2) + 4;
    var sx = (W - 2 * pad) / (xmax - xmin), sy = (y0 - 30) / 9;
    return {
      W: W, H: H, pad: pad, xmin: xmin, xmax: xmax, sx: sx, sy: sy, y0: y0, half: y0 - 24, rulerH: rulerH,
      X: function (x) { return pad + (x - xmin) * sx; },
      Y: function (y) { return y0 - y * sy; },
      wx: function (px) { return xmin + (px - pad) / sx; }
    };
  }

  /* mirrors are drawn slightly curved: x-offset (px) of the surface at screen height py */
  function curve(R, v, py) {
    if (!R.mirror) return 0;
    var k = (py - v.y0) / v.half;
    return (R.dev === 'concave_mirror' ? -7 : 7) * k * k;
  }

  function toEdge(px, py, dx, dy, W, H) {
    var t = Infinity;
    if (dx > 1e-12) t = Math.min(t, (W + 2 - px) / dx); else if (dx < -1e-12) t = Math.min(t, (-2 - px) / dx);
    if (dy > 1e-12) t = Math.min(t, (H + 2 - py) / dy); else if (dy < -1e-12) t = Math.min(t, (-2 - py) / dy);
    if (!isFinite(t) || t < 0) t = 0;
    return [px + dx * t, py + dy * t];
  }

  function head(ctx, x, y, ang, size) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * Math.cos(ang - 0.42), y - size * Math.sin(ang - 0.42));
    ctx.lineTo(x - size * Math.cos(ang + 0.42), y - size * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();
  }

  /* the principal rays (or 3 parallel rays for an object at infinity), in screen px */
  function rays(R, v) {
    var list = [], f = R.f, mirror = R.mirror, X0 = v.X(0);
    var hit = function (yw) { var py = v.Y(yw); return [X0 + curve(R, v, py), py]; };
    var img = R.objInf ? [v.X(f), v.y0] : (R.imgInf ? null : [v.X(R.v), v.Y(R.h2)]);
    var virt = !R.real && img;
    var fix = function (d) { return (mirror ? d[0] > 0 : d[0] < 0) ? [-d[0], -d[1]] : d; };
    if (R.objInf) {
      [0.62, 0.3, -0.42].forEach(function (k, i) {
        var yw = k * v.half / v.sy, hp = hit(yw), d = fix([f, -yw]);
        list.push({ i: i, inc: [0, hp[1], hp[0], hp[1]], hp: hp, d: [d[0] * v.sx, -d[1] * v.sy], virt: virt ? img : null });
      });
      return list;
    }
    var u = R.u, h = R.h, specs = [], a;
    if (mirror) {
      specs.push({ hy: h, d: [f, -h] });                                         /* parallel → through F */
      a = 2 * f; specs.push(Math.abs(a - u) > 1e-9 ? { hy: h * a / (a - u), d: [u, h - h * a / (a - u)] } : null); /* through C, comes back */
      a = f; specs.push(Math.abs(a - u) > 1e-9 ? { hy: h * a / (a - u), d: [-1, 0] } : null);   /* through F → parallel */
      specs.push({ hy: 0, d: [u, -h] });                                         /* at the pole: equal angles */
    } else {
      specs.push({ hy: h, d: [f, -h] });                                         /* parallel → through F₂ (or from F₁) */
      specs.push({ hy: 0, d: [-u, -h] });                                        /* through O, undeviated */
      a = -f; specs.push(Math.abs(a - u) > 1e-9 ? { hy: h * a / (a - u), d: [1, 0] } : null); /* via focus → parallel */
    }
    specs.forEach(function (s, i) {
      if (!s) return;
      var hp = hit(s.hy);
      if (Math.abs(hp[1] - v.y0) > v.half * 0.98) return;                        /* misses the drawn mirror / lens */
      var d = fix(s.d);
      list.push({ i: i, inc: [v.X(u), v.Y(h), hp[0], hp[1]], hp: hp, d: [d[0] * v.sx, -d[1] * v.sy], virt: virt ? img : null });
    });
    return list;
  }

  function setFont(ctx, opt, size, weight) { ctx.font = (weight || 600) + ' ' + Math.round(size * (opt.k || 1) * 10) / 10 + 'px ' + opt.font; }

  /* fit a label into maxW: shrink, then wrap into two lines; returns lines */
  function fit(ctx, opt, txt, maxW, size) {
    for (var s = size; s >= 10; s--) { setFont(ctx, opt, s); if (ctx.measureText(txt).width <= maxW) return [txt]; }
    var words = txt.split(' '), best = [txt];
    for (var i = 1; i < words.length; i++) {
      var a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
      if (ctx.measureText(a).width <= maxW && ctx.measureText(b).width <= maxW) return [a, b];
      best = [a, b];
    }
    return best;
  }

  /* text with a halo in the background colour so it stays readable on top of rays */
  function label(ctx, txt, x, y, v, align, halo) {
    var w = ctx.measureText(txt).width;
    if (align === 'center') x = Math.max(v.pad + w / 2, Math.min(v.W - v.pad - w / 2, x));
    ctx.textAlign = align || 'left';
    if (halo) { ctx.save(); ctx.strokeStyle = halo; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeText(txt, x, y); ctx.restore(); }
    ctx.fillText(txt, x, y);
  }

  function draw(ctx, W, H, R, opt) {
    var C = opt.C, v = view(W, H, R), X0 = v.X(0), y0 = v.y0, F = R.fAbs, i;
    /* bigger text and lines on big screens (smartboard, full screen) */
    var k = opt.k = Math.max(1, Math.min(1.6, W / 760, H / 380));
    /* translated labels use the page direction (Urdu = rtl); numbers and optics symbols stay ltr */
    var t = function (k) { ctx.direction = opt.rtl ? 'rtl' : 'ltr'; return opt.t(k); };
    var ltr = function () { ctx.direction = 'ltr'; };
    ctx.save();
    ctx.direction = 'ltr';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.surface; ctx.fillRect(0, 0, W, H);
    ltr();

    /* ruler: signed distances from P / O in cm */
    var steps = [1, 2, 5, 10, 20, 25, 50], step = 50;
    for (i = 0; i < steps.length; i++) if (steps[i] * v.sx >= 38 * k) { step = steps[i]; break; }
    var ry = H - 17;
    ctx.strokeStyle = C.border; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(v.pad, ry); ctx.lineTo(W - v.pad, ry); ctx.stroke();
    setFont(ctx, opt, 10, 500); ctx.fillStyle = C.muted; ctx.textAlign = 'center';
    for (var x = Math.ceil(v.xmin / step) * step; x <= v.xmax; x += step) {
      var px = v.X(x);
      ctx.beginPath(); ctx.moveTo(px, ry - 4); ctx.lineTo(px, ry + 3); ctx.stroke();
      if (px > W - v.pad - 26 * k) continue;
      ctx.fillText((x < 0 ? '−' : (x > 0 ? '+' : '')) + Math.abs(x), px, H - 3);
    }
    ctx.textAlign = 'right'; ctx.fillText('cm', W - v.pad, H - 3);

    /* side labels: which side has real / virtual images */
    var lt = t(R.mirror ? 'side_front' : 'side_obj'), rt = t(R.mirror ? 'side_behind' : 'side_other');
    ctx.fillStyle = C.muted;
    var wl = X0 - v.pad - 16, wr = W - v.pad - X0 - 16, ll = null, rl = null;
    for (var fs = 12; fs >= 10 && !ll; fs--) {                       /* same size on both sides */
      setFont(ctx, opt, fs);
      if (ctx.measureText(lt).width <= wl && ctx.measureText(rt).width <= wr) { ll = [lt]; rl = [rt]; }
    }
    if (!ll) { ll = fit(ctx, opt, lt, wl, 10); rl = fit(ctx, opt, rt, wr, 10); setFont(ctx, opt, 10); }
    ll.forEach(function (s, j) { ctx.textAlign = 'left'; ctx.fillText(s, v.pad, (15 + j * 13) * k); });
    rl.forEach(function (s, j) { ctx.textAlign = 'right'; ctx.fillText(s, W - v.pad, (15 + j * 13) * k); });
    /* light direction */
    var ly = (15 + ll.length * 13 + 4) * k;
    ctx.strokeStyle = C.accent; ctx.fillStyle = C.accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(v.pad, ly); ctx.lineTo(v.pad + 24 * k, ly); ctx.stroke();
    head(ctx, v.pad + 28 * k, ly, 0, 8 * k);
    setFont(ctx, opt, 11, 600); ctx.textAlign = 'left'; ctx.fillText(t('light_dir'), v.pad + 34 * k, ly + 4 * k);

    ltr();
    /* principal axis */
    ctx.strokeStyle = C.text; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke(); ctx.globalAlpha = 1;

    /* F, C / 2F points */
    var pts = R.mirror ? [[R.f, 'F'], [2 * R.f, 'C']] : [[-F, 'F₁'], [F, 'F₂'], [-2 * F, '2F₁'], [2 * F, '2F₂']];
    setFont(ctx, opt, 13, 700);
    pts.forEach(function (p) {
      var px = v.X(p[0]);
      ctx.fillStyle = C.text; ctx.beginPath(); ctx.arc(px, y0, 3.5 * k, 0, Math.PI * 2); ctx.fill();
    });

    /* rays */
    var list = rays(R, v), on = opt.rays || [true, true, true, true];
    list.forEach(function (r) {                                       /* dashed virtual extensions first */
      if (!on[r.i] || !r.virt) return;
      ctx.strokeStyle = C[RAY_VARS[r.i]]; ctx.lineWidth = 1.8 * k; ctx.setLineDash([6 * k, 5 * k]); ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(r.hp[0], r.hp[1]); ctx.lineTo(r.virt[0], r.virt[1]); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    });
    list.forEach(function (r) {
      if (!on[r.i]) return;
      var col = C[RAY_VARS[r.i]];
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.4 * k;
      var a = r.inc;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[2], a[3]); ctx.stroke();
      var ang = Math.atan2(a[3] - a[1], a[2] - a[0]);
      if (Math.hypot(a[2] - a[0], a[3] - a[1]) > 30) head(ctx, (a[0] + a[2]) / 2 + 5 * Math.cos(ang), (a[1] + a[3]) / 2 + 5 * Math.sin(ang), ang, 10 * k);
      var e = toEdge(r.hp[0], r.hp[1], r.d[0], r.d[1], W, H);
      ctx.beginPath(); ctx.moveTo(r.hp[0], r.hp[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
      var len = Math.hypot(e[0] - r.hp[0], e[1] - r.hp[1]);
      if (len > 40) { var b = Math.atan2(r.d[1], r.d[0]), kk = Math.min(70 * k, len * 0.45); head(ctx, r.hp[0] + kk * Math.cos(b), r.hp[1] + kk * Math.sin(b), b, 10 * k); }
    });

    /* mirror or lens */
    var top = y0 - v.half, bot = y0 + v.half;
    ctx.strokeStyle = C.primary; ctx.fillStyle = C.primary; ctx.lineWidth = 3.5;
    if (R.mirror) {
      ctx.beginPath();
      for (var py = top; py <= bot + 0.1; py += 4) { var cx = X0 + curve(R, v, py); if (py === top) ctx.moveTo(cx, py); else ctx.lineTo(cx, py); }
      ctx.stroke();
      ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7;                       /* hatching on the back (non-shiny) side */
      for (py = top + 4; py <= bot; py += 10) { var hx = X0 + curve(R, v, py) + 2; ctx.beginPath(); ctx.moveTo(hx, py); ctx.lineTo(hx + 8, py - 8); ctx.stroke(); }
      ctx.globalAlpha = 1;
    } else {
      var th = 11;
      ctx.beginPath();
      if (R.dev === 'convex_lens') {
        ctx.moveTo(X0, top); ctx.quadraticCurveTo(X0 + 2 * th, y0, X0, bot); ctx.quadraticCurveTo(X0 - 2 * th, y0, X0, top);
      } else {
        ctx.moveTo(X0 - th, top); ctx.lineTo(X0 + th, top); ctx.quadraticCurveTo(X0 - th + 6, y0, X0 + th, bot);
        ctx.lineTo(X0 - th, bot); ctx.quadraticCurveTo(X0 + th - 6, y0, X0 - th, top);
      }
      ctx.closePath();
      ctx.globalAlpha = 0.18; ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = 2.5; ctx.stroke();
    }

    /* labels of the points (after rays, with a halo so they stay readable) */
    setFont(ctx, opt, 13, 700); ctx.fillStyle = C.text;
    pts.forEach(function (p) { label(ctx, p[1], v.X(p[0]), y0 + 18 * k, v, 'center', C.surface); });
    label(ctx, R.mirror ? 'P' : 'O', X0 + (R.mirror ? 8 : 12) * k, y0 + 18 * k, v, 'left', C.surface);

    /* object */
    setFont(ctx, opt, 13, 700);
    ltr();
    var objX = null;
    if (R.objInf) {
      ctx.fillStyle = C.c2; label(ctx, t('lbl_object') + ' (∞)', v.pad, Math.max(ly + 22, v.Y(0.62 * v.half / v.sy) - 8), v, 'left', C.surface);
    } else {
      objX = v.X(R.u);
      var oy = v.Y(R.h);
      ctx.fillStyle = C.c2; ctx.strokeStyle = C.c2; ctx.globalAlpha = 0.16;
      ctx.beginPath(); ctx.arc(objX, y0, 13 * k, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      head(ctx, objX - 16 * k, y0, Math.PI, 7 * k); head(ctx, objX + 16 * k, y0, 0, 7 * k);  /* drag handle */
      ctx.lineWidth = 4.5 * k; ctx.beginPath(); ctx.moveTo(objX, y0); ctx.lineTo(objX, oy + 8 * k); ctx.stroke();
      head(ctx, objX, oy, -Math.PI / 2, 14 * k);
      label(ctx, t('lbl_object'), objX, oy - 8, v, 'center', C.surface);
    }

    /* image */
    var imgOff = false;
    ctx.fillStyle = C.c3; ctx.strokeStyle = C.c3;
    if (R.objInf) {
      var fx = v.X(R.f);
      ctx.beginPath(); ctx.arc(fx, y0, 6 * k, 0, Math.PI * 2); ctx.fill();
      label(ctx, t('lbl_image'), fx, y0 - 12, v, 'center', C.surface);
    } else if (!R.imgInf) {
      var ix = v.X(R.v), iy = v.Y(R.h2);
      imgOff = ix < 0 || ix > W;
      if (!imgOff) {
        ctx.lineWidth = 4.5 * k; ctx.setLineDash(R.real ? [] : [7 * k, 5 * k]);
        var up = iy < y0, len2 = Math.abs(iy - y0);
        ctx.beginPath(); ctx.moveTo(ix, y0); ctx.lineTo(ix, up ? Math.min(y0, iy + 8) : Math.max(y0, iy - 8)); ctx.stroke(); ctx.setLineDash([]);
        head(ctx, ix, iy, up ? -Math.PI / 2 : Math.PI / 2, Math.min(14 * k, Math.max(7, len2)));
        var lyI = up ? iy - 8 : iy + 18;
        lyI = Math.max(14, Math.min(H - v.rulerH - 4, lyI));
        label(ctx, t('lbl_image'), ix, lyI, v, 'center', C.surface);
      }
    }
    ctx.restore();
    v.imgOff = imgOff; v.objX = objX; v.drawn = list.map(function (r) { return r.i; });
    return v;
  }

  return { draw: draw, view: view, rays: rays, RAY_VARS: RAY_VARS };
})();
