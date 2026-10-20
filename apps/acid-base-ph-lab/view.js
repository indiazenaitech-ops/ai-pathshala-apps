/* Acids, Bases & pH Lab: drawing helpers (SVG test tube + flask, canvas pH curve). window.PHVIEW
   No text is drawn inside the SVGs: all labels are HTML so they translate with the page. */
(function () {
  'use strict';
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* Test tube. o = { liquid: hex, form: 'paper'|'solution', stripBase: hex, stripResult: hex, dropHex: hex, label: aria text } */
  function tube(o) {
    var liquid = esc(o.liquid || '#dbe9f5');
    var s = '<svg viewBox="0 0 160 250" role="img" aria-label="' + esc(o.label || '') + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><clipPath id="tubeclip"><path d="M56 22 V192 A24 24 0 0 0 104 192 V22 Z"/></clipPath></defs>' +
      /* liquid */
      '<g clip-path="url(#tubeclip)"><rect x="50" y="118" width="60" height="135" fill="' + liquid + '" opacity="0.95"/>' +
      '<ellipse cx="80" cy="118" rx="24" ry="5" fill="#fff" opacity="0.35"/></g>';
    if (o.form === 'paper') {
      /* a strip of indicator paper dipped into the liquid: the wet part shows the result */
      s += '<rect x="72" y="6" width="16" height="114" rx="2" fill="' + esc(o.stripBase) + '" stroke="rgba(0,0,0,.25)"/>' +
        '<rect x="72" y="118" width="16" height="48" rx="2" fill="' + esc(o.stripResult) + '" stroke="rgba(0,0,0,.25)"/>';
    } else {
      /* a dropper adding a few drops of indicator solution */
      s += '<g transform="translate(118 6)"><path d="M6 0 h16 v12 l-5 6 v26 h-6 v-26 l-5 -6 z" fill="var(--surface-2)" stroke="var(--muted)" stroke-width="1.5"/>' +
        '<circle cx="14" cy="54" r="4" fill="' + esc(o.dropHex) + '" stroke="rgba(0,0,0,.25)"><animate attributeName="cy" values="50;110;110" keyTimes="0;0.6;1" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;1;0" keyTimes="0;0.6;1" dur="2.2s" repeatCount="indefinite"/></circle></g>';
    }
    /* glass */
    s += '<path d="M56 22 V192 A24 24 0 0 0 104 192 V22" fill="none" stroke="var(--text)" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse cx="80" cy="22" rx="26" ry="6" fill="none" stroke="var(--text)" stroke-width="3"/>' +
      '<path d="M63 60 V180" stroke="#fff" stroke-opacity="0.5" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>';
    return s;
  }

  /* Conical flask under a burette. o = { liquid: hex, level: 0..1 (flask fullness), burette: 0..1 (how much base is left), dropping: bool, dropHex, label } */
  function flask(o) {
    var level = Math.max(0.25, Math.min(1, o.level == null ? 0.5 : o.level));
    var bur = Math.max(0, Math.min(1, o.burette == null ? 1 : o.burette));
    var topLiquid = 296 - level * 125;
    var burTop = 6 + (1 - bur) * 110;
    var s = '<svg viewBox="0 0 200 300" role="img" aria-label="' + esc(o.label || '') + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><clipPath id="flaskclip"><path d="M86 150 V186 L28 282 Q22 294 36 294 H164 Q178 294 172 282 L114 186 V150 Z"/></clipPath>' +
      '<clipPath id="burclip"><rect x="92" y="6" width="16" height="116" rx="3"/></clipPath></defs>' +
      /* burette */
      '<rect x="92" y="6" width="16" height="116" rx="3" fill="var(--surface-2)" stroke="var(--text)" stroke-width="2"/>' +
      '<g clip-path="url(#burclip)"><rect x="92" y="' + burTop.toFixed(1) + '" width="16" height="120" fill="' + esc(o.dropHex || '#bcd5ee') + '"/></g>' +
      '<g stroke="var(--muted)" stroke-width="1">' + [20, 40, 60, 80, 100].map(function (y) { return '<path d="M92 ' + y + ' h6"/>'; }).join('') + '</g>' +
      '<path d="M100 122 v8 M94 130 h12" stroke="var(--text)" stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="96" y="126" width="8" height="6" rx="1" fill="var(--accent)"/>';
    if (o.dropping) {
      s += '<circle cx="100" cy="140" r="4" fill="' + esc(o.dropHex || '#bcd5ee') + '" stroke="rgba(0,0,0,.2)"><animate attributeName="cy" values="136;' + (topLiquid - 4).toFixed(0) + '" dur="0.9s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="0.9s" repeatCount="indefinite"/></circle>';
    }
    /* liquid in the flask */
    s += '<g clip-path="url(#flaskclip)"><rect x="20" y="' + topLiquid.toFixed(1) + '" width="160" height="150" fill="' + esc(o.liquid || '#dbe9f5') + '" opacity="0.95"/>' +
      '<ellipse cx="100" cy="' + topLiquid.toFixed(1) + '" rx="' + (30 + level * 40).toFixed(0) + '" ry="5" fill="#fff" opacity="0.35"/></g>' +
      /* glass */
      '<path d="M86 150 V186 L28 282 Q22 294 36 294 H164 Q178 294 172 282 L114 186 V150" fill="none" stroke="var(--text)" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M82 150 H118" stroke="var(--text)" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M44 262 L60 236" stroke="#fff" stroke-opacity="0.5" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>';
    return s;
  }

  /* pH curve on a canvas. d = { pts:[{vb,ph}], vMax, now:{vb,ph}, vEq, band:[lo,hi]|null, bandHex, colors:{text,muted,grid,surface,primary,accent,success}, labels:{x,y,now,end}, font } */
  function curve(canvas, d) {
    var ctx = canvas.getContext('2d');
    var cssW = canvas.parentNode.clientWidth || 600, cssH = cssW < 480 ? 250 : 300;
    var DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(cssW * DPR); canvas.height = Math.round(cssH * DPR);
    canvas.style.height = cssH + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var W = cssW, H = cssH, M = { l: 40, r: 14, t: 16, b: 38 };
    var C = d.colors, F = d.font || 'system-ui, sans-serif';
    var vMax = Math.max(1, d.vMax);
    function X(v) { return M.l + v / vMax * (W - M.l - M.r); }
    function Y(p) { return H - M.b - p / 14 * (H - M.t - M.b); }
    function text(s, x, y, col, align, base, px, weight, halo) {
      ctx.font = (weight || 600) + ' ' + (px || 12) + 'px ' + F; ctx.textAlign = align || 'left'; ctx.textBaseline = base || 'middle';
      if (halo) { ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = C.surface; ctx.strokeText(s, x, y); }
      ctx.fillStyle = col; ctx.fillText(s, x, y);
    }
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.surface; ctx.fillRect(0, 0, W, H);
    /* indicator colour-change band */
    if (d.band) {
      ctx.fillStyle = d.bandHex; ctx.globalAlpha = 0.22;
      ctx.fillRect(M.l, Y(d.band[1]), W - M.l - M.r, Y(d.band[0]) - Y(d.band[1]));
      ctx.globalAlpha = 1;
    }
    /* grid */
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    var p;
    for (p = 0; p <= 14; p += 2) { ctx.beginPath(); ctx.moveTo(M.l, Math.round(Y(p)) + 0.5); ctx.lineTo(W - M.r, Math.round(Y(p)) + 0.5); ctx.stroke(); text(String(p), M.l - 6, Y(p), C.muted, 'right', 'middle', 11); }
    var step = vMax <= 12 ? 1 : vMax <= 30 ? 5 : vMax <= 80 ? 10 : vMax <= 160 ? 20 : 50;
    for (var v = 0; v <= vMax + 1e-9; v += step) { var x = Math.round(X(v)) + 0.5; ctx.beginPath(); ctx.moveTo(x, M.t); ctx.lineTo(x, H - M.b); ctx.stroke(); text(String(Math.round(v * 100) / 100), X(v), H - M.b + 12, C.muted, 'center', 'middle', 11); }
    /* pH 7 line */
    ctx.setLineDash([5, 4]); ctx.strokeStyle = C.success; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(M.l, Y(7)); ctx.lineTo(W - M.r, Y(7)); ctx.stroke();
    /* equivalence volume */
    if (isFinite(d.vEq) && d.vEq <= vMax) {
      ctx.strokeStyle = C.accent; ctx.beginPath(); ctx.moveTo(X(d.vEq), M.t); ctx.lineTo(X(d.vEq), H - M.b); ctx.stroke();
      text(d.labels.end, X(d.vEq) + (d.vEq > vMax * 0.75 ? -6 : 6), M.t + 8, C.accent, d.vEq > vMax * 0.75 ? 'right' : 'left', 'middle', 11, 700, true);
    }
    ctx.setLineDash([]);
    /* the curve */
    ctx.strokeStyle = C.primary; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
    d.pts.forEach(function (q, i) { if (i) ctx.lineTo(X(q.vb), Y(q.ph)); else ctx.moveTo(X(q.vb), Y(q.ph)); });
    ctx.stroke();
    /* current point */
    if (d.now) {
      var cx = X(Math.min(d.now.vb, vMax)), cy = Y(d.now.ph);
      ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.surface; ctx.lineWidth = 2; ctx.stroke();
      text(d.labels.now + ' ' + d.now.ph.toFixed(2), cx + (cx > W * 0.7 ? -12 : 12), cy + (d.now.ph > 10 ? 14 : -14), C.text, cx > W * 0.7 ? 'right' : 'left', 'middle', 12, 700, true);
    }
    /* axis titles */
    text(d.labels.x, W - M.r, H - 8, C.text, 'right', 'middle', 12, 700, true);
    text(d.labels.y, M.l + 4, M.t - 4, C.text, 'left', 'middle', 12, 700, true);
  }

  window.PHVIEW = { tube: tube, flask: flask, curve: curve };
})();
