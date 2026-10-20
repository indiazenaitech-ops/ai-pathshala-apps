/* Canvas renderer for the Menu Card Maker: draws the menu as one or more images.
 * Used for the 1080 × 1920 story images (WhatsApp status / Instagram story) and for PNG / JPG export of every layout.
 *
 *   MENU_RENDER.pages(model) -> [canvas, ...]
 *   model = { layout: 'story'|'a4-1'|'a4-2'|'a5'|'tent'|'poster', design: 'classic'|..., rtl: bool, font: css font stack,
 *             biz: { name, tagline, logo (HTMLImageElement|null), phone, address, fssai, gst, note, upi, link },
 *             cats: [{ name, items: [{ name, desc, price, half, veg, spice, chef, best, out }] }],
 *             labels: { half, full, scanPay, orderWa, fssai, gstIncl, veg, nonveg, chef, best, out, menu, scanMenu, posterSub, call, contd, page(x, y) },
 *             qr: { upi: QRGen result|null, wa: QRGen result|null, menu: QRGen result|null }, fmtPrice: fn(number) -> '₹1,250' }
 * Nothing here touches the DOM except creating canvases. */
(function (root) {
  'use strict';

  var DESIGNS = {
    classic: { bg: '#fbf5e6', ink: '#2b2118', accent: '#7a1f1f', muted: '#6b5a4a', catBg: null, catInk: '#7a1f1f', head: 'Georgia, "Noto Serif", serif', upper: false, rule: 'double' },
    dhaba: { bg: '#fff3c4', ink: '#1d1a12', accent: '#c2410c', muted: '#5a4a2a', catBg: '#c2410c', catInk: '#fff3c4', head: null, upper: true, rule: 'thick' },
    cafe: { bg: '#ffffff', ink: '#1f2937', accent: '#111827', muted: '#6b7280', catBg: null, catInk: '#111827', head: null, upper: true, rule: 'thin', light: true },
    royal: { bg: '#1b1030', ink: '#f5e9c8', accent: '#e3b84a', muted: '#c9b58a', catBg: null, catInk: '#e3b84a', head: 'Georgia, "Noto Serif", serif', upper: false, rule: 'thin', badgeInk: '#1b1030' },
    south: { bg: '#f4fbef', ink: '#10311a', accent: '#1b7a3a', muted: '#456b4f', catBg: '#d9f0d0', catInk: '#1b7a3a', head: null, upper: false, rule: 'thick' },
    dark: { bg: '#111318', ink: '#f1f3f5', accent: '#ffb347', muted: '#a3aab4', catBg: null, catInk: '#ffb347', head: null, upper: true, rule: 'thin', badgeInk: '#111' }
  };
  var VEG = '#0a8f3c', NONVEG = '#8b3a0e', SPICE = '#d9480f';
  var SIZES = { story: { W: 1080, H: 1920, cols: 1, pad: 64, base: 34 }, 'a4-1': { W: 1240, H: 1754, cols: 1, pad: 80, base: 26 }, 'a4-2': { W: 1240, H: 1754, cols: 2, pad: 80, base: 23 },
    a5: { W: 874, H: 1240, cols: 1, pad: 56, base: 21 }, tent: { W: 1240, H: 1754, cols: 1, pad: 60, base: 22 }, poster: { W: 1240, H: 1754, cols: 1, pad: 80, base: 26 } };
  var RTL_RE = /[֐-ࣿיִ-﷿ﹰ-﻿]/;

  function mkCanvas(W, H) { var c = document.createElement('canvas'); c.width = W; c.height = H; return c; }

  /* small text helpers bound to one context */
  function T(ctx, model, D, base) {
    var rtl = !!model.rtl, font = model.font || 'sans-serif', lhMul = rtl ? 1.75 : 1.3;
    function setFont(size, weight, head) { ctx.font = (weight || 400) + ' ' + Math.round(size) + 'px ' + ((head && D.head) ? D.head : font); }
    function wrap(text, maxW, maxLines) {
      var words = String(text || '').trim().split(/\s+/), lines = [], cur = '';
      for (var i = 0; i < words.length; i++) {
        var w = words[i], test = cur ? cur + ' ' + w : w;
        if (!cur || ctx.measureText(test).width <= maxW) cur = test; else { lines.push(cur); cur = w; }
      }
      if (cur) lines.push(cur);
      var out = [];
      lines.forEach(function (ln) {                       // break words wider than the line
        while (ctx.measureText(ln).width > maxW && ln.length > 1) {
          var cut = ln.length;
          while (cut > 1 && ctx.measureText(ln.slice(0, cut)).width > maxW) cut--;
          out.push(ln.slice(0, cut)); ln = ln.slice(cut);
        }
        out.push(ln);
      });
      if (maxLines && out.length > maxLines) { out = out.slice(0, maxLines); out[maxLines - 1] = out[maxLines - 1].replace(/.{0,2}$/, '…'); }
      return out;
    }
    function text(str, x, y, o) {                 // o: {size, weight, color, align ('start'|'end'|'center'), head, maxW, ltr}
      o = o || {};
      setFont(o.size || base, o.weight, o.head);
      ctx.fillStyle = o.color || D.ink;
      ctx.textBaseline = 'alphabetic';
      var dirRtl = o.ltr ? false : rtl;
      try { ctx.direction = dirRtl ? 'rtl' : 'ltr'; } catch (e) { }
      var al = o.align || 'start';
      ctx.textAlign = al === 'center' ? 'center' : (al === 'start') === !dirRtl ? 'left' : 'right';
      if (o.ltr && rtl) ctx.textAlign = al === 'center' ? 'center' : (al === 'start' ? 'right' : 'left');
      str = String(str == null ? '' : str);
      if (o.maxW) { while (str.length > 1 && ctx.measureText(str).width > o.maxW) str = str.slice(0, -2) + '…'; }
      ctx.fillText(str, x, y);
      return ctx.measureText(str).width;
    }
    return { setFont: setFont, wrap: wrap, text: text, lh: function (size) { return Math.round(size * lhMul); }, rtl: rtl };
  }

  /* FSSAI-style marks: green circle in a green square, brown triangle in a brown square */
  function drawMark(ctx, x, y, s, veg) {
    var col = veg ? VEG : NONVEG;
    ctx.save();
    ctx.lineWidth = Math.max(1.5, s * 0.09); ctx.strokeStyle = col; ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, s, s); ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, s - ctx.lineWidth, s - ctx.lineWidth);
    ctx.fillStyle = col;
    if (veg) { ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * 0.28, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(x + s / 2, y + s * 0.2); ctx.lineTo(x + s * 0.8, y + s * 0.78); ctx.lineTo(x + s * 0.2, y + s * 0.78); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }

  function drawQR(ctx, q, x, y, size) {
    if (!q || !q.ok) return;
    var n = q.size, quiet = 2, cell = size / (n + quiet * 2);
    ctx.save();
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#000';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.modules[r][c]) {
      var px = x + (c + quiet) * cell, py = y + (r + quiet) * cell;
      ctx.fillRect(Math.floor(px), Math.floor(py), Math.ceil(cell), Math.ceil(cell));
    }
    ctx.restore();
  }

  function rule(ctx, D, x1, x2, y) {
    ctx.save(); ctx.strokeStyle = D.accent;
    if (D.rule === 'double') { ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x1, y - 3); ctx.lineTo(x2, y - 3); ctx.moveTo(x1, y + 3); ctx.lineTo(x2, y + 3); ctx.stroke(); }
    else { ctx.lineWidth = D.rule === 'thick' ? 5 : 1.5; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); }
    ctx.restore();
  }

  function up(D, s) { return D.upper && !RTL_RE.test(s) ? String(s).toUpperCase() : s; }

  /* ---------- the flowing menu (story, A4, A5) ---------- */
  function menuPages(model, kind, opts) {
    opts = opts || {};
    var S = SIZES[kind], D = DESIGNS[model.design] || DESIGNS.classic, W = S.W, H = S.H, pad = S.pad, base = S.base, cols = S.cols;
    var L = model.labels, biz = model.biz, pages = [], gap = Math.round(base * 1.2);
    var colW = Math.floor((W - 2 * pad - (cols - 1) * gap) / cols);
    var priceW = Math.round(base * 4.2), markS = Math.round(base * 0.78);
    var measure = T(mkCanvas(10, 10).getContext('2d'), model, D, base);

    /* 1) measure blocks */
    var blocks = [];     // {type:'cat', cat} | {type:'item', item, lines:[desc lines], h} | {type:'th', h}
    model.cats.forEach(function (cat) {
      var live = cat.items;
      if (!live.length) return;
      var hasHalf = live.some(function (it) { return it.half > 0; });
      blocks.push({ type: 'cat', name: cat.name, h: Math.round(base * 2.1), hasHalf: hasHalf });
      live.forEach(function (it) {
        measure.setFont(base * 0.72);
        var lines = it.desc ? measure.wrap(it.desc, colW - priceW - markS - base * 1.2, 2) : [];
        var h = measure.lh(base) + lines.length * measure.lh(base * 0.72) + Math.round(base * 0.55);
        if (hasHalf && it.half > 0) h = Math.max(h, measure.lh(base) * 2 + Math.round(base * 0.3));
        blocks.push({ type: 'item', item: it, lines: lines, h: h, hasHalf: hasHalf });
      });
    });

    /* 2) header / footer heights */
    var headH = Math.round(base * (biz.logo ? 9.5 : 5.6)) + (biz.tagline ? measure.lh(base * 0.8) : 0);
    var footLines = [];
    if (biz.address) footLines.push(biz.address);
    if (biz.phone) footLines.push(L.call + ': ' + biz.phone);
    if (biz.fssai) footLines.push(L.fssai + ' ' + biz.fssai);
    if (biz.gst) footLines.push(L.gstIncl);
    if (biz.note) footLines.push(biz.note);
    var qrs = [];
    if (model.qr.upi && model.qr.upi.ok) qrs.push({ q: model.qr.upi, cap: L.scanPay, sub: biz.upi });
    if (model.qr.wa && model.qr.wa.ok) qrs.push({ q: model.qr.wa, cap: L.orderWa, sub: '' });
    var qrS = Math.round(base * 5.2);
    var footH = Math.round(base * 1.2) + Math.max((footLines.length + 1) * measure.lh(base * 0.72), qrs.length ? qrS + measure.lh(base * 0.72) * 2.4 : 0) + Math.round(base * 0.8);
    var pageFootH = measure.lh(base * 0.7) + Math.round(base * 0.6);

    /* 3) paginate */
    var pagesBlocks = [], cur = { cols: [], last: false }, col = [], y = 0;
    var bodyTop = pad + headH, bodyBottom = H - pad - pageFootH;
    function closeCol() { cur.cols.push(col); col = []; y = 0; if (cur.cols.length === cols) { pagesBlocks.push(cur); cur = { cols: [], last: false }; } }
    var avail = bodyBottom - bodyTop;
    var i = 0, pendingCat = null;
    while (i < blocks.length) {
      var b = blocks[i];
      var need = b.h;
      if (b.type === 'cat') { // keep a heading with its first item
        var nxt = blocks[i + 1]; need += nxt ? nxt.h : 0;
        if (y + need > avail && y > 0) { closeCol(); continue; }
        col.push(b); y += b.h; i++; continue;
      }
      if (y + need > avail && y > 0) { closeCol(); if (col.length === 0 && blocks[i - 1] && blocks[i - 1].type !== 'cat') { col.push({ type: 'cat', name: lastCatName(blocks, i) + ' (' + L.contd + ')', h: Math.round(base * 2.1), hasHalf: b.hasHalf, cont: true }); y += Math.round(base * 2.1); } continue; }
      col.push(b); y += b.h; i++;
    }
    if (col.length || !cur.cols.length) cur.cols.push(col);
    pagesBlocks.push(cur);
    pagesBlocks = pagesBlocks.filter(function (p, idx) { return idx === 0 || p.cols.some(function (c) { return c.length; }); });
    /* footer: on the last page if it fits, else an extra page */
    var lastP = pagesBlocks[pagesBlocks.length - 1];
    var lastColH = Math.max.apply(null, lastP.cols.map(function (c) { return c.reduce(function (s, b) { return s + b.h; }, 0); }).concat([0]));
    var footerFits = cols === 1 ? bodyTop + lastColH + footH <= bodyBottom : (lastP.cols.length < cols || bodyTop + lastColH + footH <= bodyBottom);
    if (!footerFits) pagesBlocks.push({ cols: [[]], footOnly: true });
    var total = pagesBlocks.length;

    function lastCatName(bl, idx) { for (var k = idx - 1; k >= 0; k--) if (bl[k].type === 'cat') return bl[k].name.replace(/ \(.*\)$/, ''); return ''; }

    /* 4) draw */
    pagesBlocks.forEach(function (pb, pi) {
      var cv = mkCanvas(W, H), ctx = cv.getContext('2d'), tx = T(ctx, model, D, base), rtl = tx.rtl;
      ctx.fillStyle = D.bg; ctx.fillRect(0, 0, W, H);
      if (D.rule === 'thick') { ctx.fillStyle = D.accent; ctx.fillRect(0, 0, W, Math.round(base * 0.5)); ctx.fillRect(0, H - Math.round(base * 0.5), W, Math.round(base * 0.5)); }
      var xs = rtl ? W - pad : pad, xe = rtl ? pad : W - pad;
      /* header */
      var hy = pad;
      if (biz.logo) { var ls = Math.round(base * 3.8); try { ctx.drawImage(biz.logo, (W - ls) / 2, hy, ls, ls); } catch (e) { } hy += ls + Math.round(base * 0.5); }
      hy += Math.round(base * 1.7);
      tx.text(up(D, biz.name || L.menu), W / 2, hy, { size: base * (pi === 0 ? 1.9 : 1.5), weight: 800, color: D.accent, align: 'center', head: true, maxW: W - 2 * pad });
      hy += Math.round(base * 0.5);
      if (biz.tagline) { hy += tx.lh(base * 0.8); tx.text(biz.tagline, W / 2, hy, { size: base * 0.8, color: D.muted, align: 'center', maxW: W - 2 * pad }); }
      hy += Math.round(base * 0.9);
      tx.text(up(D, L.menu) + (total > 1 ? '  ·  ' + L.page(pi + 1, total) : ''), W / 2, hy, { size: base * 0.62, color: D.muted, align: 'center' });
      hy += Math.round(base * 0.7);
      rule(ctx, D, pad, W - pad, hy);
      /* columns */
      var yEnd = bodyTop;
      pb.cols.forEach(function (colBlocks, ci) {
        var cx0 = pad + ci * (colW + gap);                // physical column start (left) ... mirrored for RTL
        if (rtl) cx0 = W - pad - colW - ci * (colW + gap);
        var cxs = rtl ? cx0 + colW : cx0, cxe = rtl ? cx0 : cx0 + colW;
        var yy = bodyTop;
        colBlocks.forEach(function (b) {
          if (b.type === 'cat') {
            var ch = b.h, ty = yy + Math.round(base * 1.35);
            if (D.catBg) { ctx.fillStyle = D.catBg; roundRect(ctx, cx0, yy + Math.round(base * 0.35), colW, Math.round(base * 1.45), 6); ctx.fill(); }
            tx.text(up(D, b.name), rtl ? cxs - base * 0.4 : cxs + base * 0.4, ty, { size: base * 0.95, weight: 800, color: D.catInk, head: true, maxW: colW - (b.hasHalf ? priceW * 2 : 0) - base });
            if (b.hasHalf) {
              tx.text(L.half, rtl ? cxe + priceW : cxe - priceW, ty, { size: base * 0.55, weight: 700, color: D.muted, align: 'end' });
              tx.text(L.full, cxe, ty, { size: base * 0.55, weight: 700, color: D.muted, align: 'end' });
            }
            if (!D.catBg) { ctx.fillStyle = D.accent; ctx.fillRect(cx0, yy + ch - 4, colW, 2); }
            yy += ch;
          } else {
            var it = b.item, ty2 = yy + Math.round(base * 1.0);
            ctx.globalAlpha = it.out ? 0.5 : 1;
            drawMark(ctx, rtl ? cxs - markS : cxs, yy + Math.round(base * 0.22), markS, it.veg);
            var nameX = rtl ? cxs - markS - base * 0.45 : cxs + markS + base * 0.45;
            var nameMax = colW - markS - base * 0.45 - (b.hasHalf ? priceW * 2 : priceW) - base * 0.3;
            var nw = tx.text(it.name, nameX, ty2, { size: base, weight: 700, maxW: nameMax });
            var badgeX = rtl ? nameX - nw - base * 0.3 : nameX + nw + base * 0.3;
            var badges = [];
            if (it.chef) badges.push(L.chef); if (it.best) badges.push(L.best); if (it.out) badges.push(L.out);
            badges.forEach(function (bd, k) {
              tx.setFont(base * 0.5, 800); var bw = ctx.measureText(up(D, bd)).width + base * 0.5, bh = base * 0.7;
              var bx = rtl ? badgeX - bw : badgeX;
              if (bx < cx0 + colW * 0.15 && rtl || !rtl && bx + bw > cx0 + colW - priceW - base * 0.3) return; // no room: skip badge
              ctx.fillStyle = (k === badges.length - 1 && it.out) ? D.muted : D.accent; roundRect(ctx, bx, ty2 - bh + base * 0.12, bw, bh, 4); ctx.fill();
              tx.text(up(D, bd), bx + bw / 2, ty2 - base * 0.08, { size: base * 0.5, weight: 800, color: D.badgeInk || D.bg, align: 'center' });
              badgeX = rtl ? bx - base * 0.2 : bx + bw + base * 0.2;
            });
            if (it.spice > 0 && !it.out) { var chil = new Array(it.spice + 1).join('🌶'); tx.setFont(base * 0.55); var cw = ctx.measureText(chil).width; var sx = rtl ? badgeX - cw : badgeX; tx.text(chil, sx, ty2 - base * 0.05, { size: base * 0.55, color: SPICE, ltr: true, align: 'start' }); }
            /* prices (always LTR digits) */
            var pf = model.fmtPrice;
            if (b.hasHalf) {
              if (it.half > 0) tx.text(pf(it.half), rtl ? cxe + priceW : cxe - priceW, ty2, { size: base * 0.9, weight: 600, align: 'end', ltr: true });
              tx.text(pf(it.price), cxe, ty2, { size: base, weight: 800, align: 'end', ltr: true });
            } else tx.text(pf(it.price), cxe, ty2, { size: base, weight: 800, align: 'end', ltr: true });
            var dy = ty2;
            b.lines.forEach(function (ln) { dy += tx.lh(base * 0.72); tx.text(ln, nameX, dy, { size: base * 0.72, color: D.muted }); });
            ctx.globalAlpha = 1;
            if (it.out) { ctx.strokeStyle = D.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rtl ? nameX - nw : nameX, ty2 - base * 0.3); ctx.lineTo(rtl ? nameX : nameX + nw, ty2 - base * 0.3); ctx.stroke(); }
            ctx.strokeStyle = D.muted; ctx.globalAlpha = 0.35; ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(cx0, yy + b.h - 2); ctx.lineTo(cx0 + colW, yy + b.h - 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
            yy += b.h;
          }
        });
        yEnd = Math.max(yEnd, yy);
      });
      if (!pb.cols.some(function (c) { return c.length; }) && !pb.footOnly) tx.text(up(D, L.menu), W / 2, bodyTop + base * 2, { size: base, color: D.muted, align: 'center' });
      /* footer (last page) */
      if (pi === total - 1) {
        var fy = Math.max(yEnd + Math.round(base * 0.6), H - pad - pageFootH - footH);
        if (pb.footOnly) fy = bodyTop;
        rule(ctx, D, pad, W - pad, fy);
        fy += Math.round(base * 0.9);
        var textW = W - 2 * pad - (qrs.length ? qrs.length * (qrS + base) : 0);
        var fyy = fy + tx.lh(base * 0.72);
        footLines.forEach(function (ln) { tx.text(ln, xs, fyy, { size: base * 0.72, color: D.muted, maxW: textW }); fyy += tx.lh(base * 0.72); });
        /* legend */
        var lgS = Math.round(base * 0.6), lx = xs;
        drawMark(ctx, rtl ? lx - lgS : lx, fyy - lgS + 2, lgS, true);
        var lw = tx.text(L.veg, rtl ? lx - lgS - base * 0.3 : lx + lgS + base * 0.3, fyy, { size: base * 0.62, color: D.muted });
        lx = rtl ? lx - lgS - base * 0.3 - lw - base * 0.8 : lx + lgS + base * 0.3 + lw + base * 0.8;
        drawMark(ctx, rtl ? lx - lgS : lx, fyy - lgS + 2, lgS, false);
        tx.text(L.nonveg, rtl ? lx - lgS - base * 0.3 : lx + lgS + base * 0.3, fyy, { size: base * 0.62, color: D.muted });
        qrs.forEach(function (qq, k) {
          var qx = rtl ? pad + k * (qrS + base) : W - pad - (k + 1) * qrS - k * base;
          drawQR(ctx, qq.q, qx, fy, qrS);
          tx.text(qq.cap, qx + qrS / 2, fy + qrS + tx.lh(base * 0.62), { size: base * 0.62, weight: 700, align: 'center', maxW: qrS + base });
          if (qq.sub) tx.text(qq.sub, qx + qrS / 2, fy + qrS + tx.lh(base * 0.62) * 1.9, { size: base * 0.5, color: D.muted, align: 'center', ltr: true, maxW: qrS + base });
        });
      }
      /* page foot */
      tx.text((biz.name || '') + (total > 1 ? '  ·  ' + L.page(pi + 1, total) : ''), W / 2, H - pad + base * 0.3, { size: base * 0.6, color: D.muted, align: 'center', maxW: W - 2 * pad });
      pages.push(cv);
    });
    return pages;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  /* ---------- table tent: A4 portrait, two panels, the top one rotated 180° ---------- */
  function tentPage(model) {
    var S = SIZES.tent, D = DESIGNS[model.design] || DESIGNS.classic, W = S.W, H = S.H;
    var panel = renderTentPanel(model, W, H / 2, D, S.base);
    var cv = mkCanvas(W, H), ctx = cv.getContext('2d');
    ctx.fillStyle = D.bg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W, H / 2); ctx.rotate(Math.PI); ctx.drawImage(panel, 0, 0); ctx.restore();
    ctx.drawImage(panel, 0, H / 2);
    ctx.strokeStyle = D.muted; ctx.setLineDash([8, 8]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    return [cv];
  }
  function renderTentPanel(model, W, H, D, base) {
    var cv = mkCanvas(W, H), ctx = cv.getContext('2d'), tx = T(ctx, model, D, base), rtl = tx.rtl, L = model.labels, biz = model.biz, pad = 56;
    ctx.fillStyle = D.bg; ctx.fillRect(0, 0, W, H);
    if (D.rule === 'thick') { ctx.fillStyle = D.accent; ctx.fillRect(0, 0, W, 10); }
    var sideW = 300, mainW = W - 2 * pad - sideW - 40;
    var mx0 = rtl ? W - pad - mainW : pad, mxs = rtl ? mx0 + mainW : mx0, mxe = rtl ? mx0 : mx0 + mainW;
    var y = pad + base * 1.6;
    tx.text(up(D, biz.name || L.menu), mx0 + mainW / 2, y, { size: base * 1.5, weight: 800, color: D.accent, align: 'center', head: true, maxW: mainW });
    if (biz.tagline) { y += tx.lh(base * 0.75); tx.text(biz.tagline, mx0 + mainW / 2, y, { size: base * 0.75, color: D.muted, align: 'center', maxW: mainW }); }
    y += base * 0.7; rule(ctx, D, mx0, mx0 + mainW, y); y += base * 0.6;
    var markS = Math.round(base * 0.75), priceW = base * 3.4, maxY = H - pad - base * 1.4, more = 0, pf = model.fmtPrice;
    outer: for (var c = 0; c < model.cats.length; c++) {
      var cat = model.cats[c]; if (!cat.items.length) continue;
      if (y + base * 2.6 > maxY) { more += cat.items.length; continue; }
      y += base * 1.3;
      tx.text(up(D, cat.name), mxs, y, { size: base * 0.9, weight: 800, color: D.catInk, head: true, maxW: mainW });
      ctx.fillStyle = D.accent; ctx.fillRect(mx0, y + 6, mainW, 2); y += base * 0.5;
      for (var k = 0; k < cat.items.length; k++) {
        var it = cat.items[k];
        if (y + base * 1.3 > maxY) { more += cat.items.length - k; break outer; }
        y += base * 1.2;
        ctx.globalAlpha = it.out ? 0.5 : 1;
        drawMark(ctx, rtl ? mxs - markS : mxs, y - markS + 2, markS, it.veg);
        tx.text(it.name, rtl ? mxs - markS - base * 0.4 : mxs + markS + base * 0.4, y, { size: base * 0.88, weight: 700, maxW: mainW - markS - priceW - base });
        var ptxt = pf(it.price) + (it.half > 0 ? ' / ' + pf(it.half) : '');
        tx.text(ptxt, mxe, y, { size: base * 0.88, weight: 800, align: 'end', ltr: true });
        ctx.globalAlpha = 1;
      }
    }
    if (more > 0) { y += base * 1.2; tx.text('+ ' + more + ' …', mxs, y, { size: base * 0.75, color: D.muted }); }
    /* side: QR codes + contact */
    var sx0 = rtl ? pad : W - pad - sideW, qrS = 210, sy = pad + base * 0.5, qrs = [];
    if (model.qr.upi && model.qr.upi.ok) qrs.push({ q: model.qr.upi, cap: L.scanPay });
    if (model.qr.wa && model.qr.wa.ok) qrs.push({ q: model.qr.wa, cap: L.orderWa });
    if (!qrs.length) qrS = 0;
    qrs.forEach(function (qq) {
      if (sy + qrS + base * 2.5 > H - pad) return;
      drawQR(ctx, qq.q, sx0 + (sideW - qrS) / 2, sy, qrS);
      tx.text(qq.cap, sx0 + sideW / 2, sy + qrS + base * 1.1, { size: base * 0.7, weight: 700, align: 'center', maxW: sideW });
      sy += qrS + base * 2.3;
    });
    var lines = [];
    if (biz.phone) lines.push(L.call + ': ' + biz.phone);
    if (biz.fssai) lines.push(L.fssai + ' ' + biz.fssai);
    if (biz.gst) lines.push(L.gstIncl);
    var ly = H - pad - lines.length * tx.lh(base * 0.6) + tx.lh(base * 0.6) * 0.8;
    lines.forEach(function (ln) { tx.text(ln, sx0 + sideW / 2, ly, { size: base * 0.6, color: D.muted, align: 'center', maxW: sideW }); ly += tx.lh(base * 0.6); });
    return cv;
  }

  /* ---------- "Scan for menu" poster ---------- */
  function posterPage(model) {
    var S = SIZES.poster, D = DESIGNS[model.design] || DESIGNS.classic, W = S.W, H = S.H, base = S.base, pad = S.pad;
    var cv = mkCanvas(W, H), ctx = cv.getContext('2d'), tx = T(ctx, model, D, base), L = model.labels, biz = model.biz;
    ctx.fillStyle = D.bg; ctx.fillRect(0, 0, W, H);
    if (D.rule === 'thick') { ctx.fillStyle = D.accent; ctx.fillRect(0, 0, W, 14); ctx.fillRect(0, H - 14, W, 14); }
    var y = pad + base * 1.5;
    if (biz.logo) { var ls = base * 5; try { ctx.drawImage(biz.logo, (W - ls) / 2, y - base, ls, ls); } catch (e) { } y += ls + base * 0.6; }
    y += base * 1.2;
    tx.text(up(D, biz.name || L.menu), W / 2, y, { size: base * 2, weight: 800, color: D.accent, align: 'center', head: true, maxW: W - 2 * pad });
    if (biz.tagline) { y += tx.lh(base * 0.85); tx.text(biz.tagline, W / 2, y, { size: base * 0.85, color: D.muted, align: 'center', maxW: W - 2 * pad }); }
    y += base * 2.4;
    tx.text(up(D, L.scanMenu), W / 2, y, { size: base * 2.6, weight: 900, color: D.ink, align: 'center', head: true, maxW: W - 2 * pad });
    y += tx.lh(base * 0.9); tx.text(L.posterSub, W / 2, y, { size: base * 0.9, color: D.muted, align: 'center', maxW: W - 2 * pad });
    y += base * 1.4;
    var big = Math.round(W * 0.56), bx = (W - big) / 2;
    ctx.fillStyle = D.accent; roundRect(ctx, bx - 14, y - 14, big + 28, big + 28, 26); ctx.fill();
    ctx.fillStyle = '#fff'; roundRect(ctx, bx, y, big, big, 18); ctx.fill();
    if (model.qr.menu && model.qr.menu.ok) drawQR(ctx, model.qr.menu, bx + 24, y + 24, big - 48);
    y += big + base * 2.2;
    var smalls = [];
    if (model.qr.upi && model.qr.upi.ok) smalls.push({ q: model.qr.upi, cap: L.scanPay, sub: biz.upi });
    if (model.qr.wa && model.qr.wa.ok) smalls.push({ q: model.qr.wa, cap: L.orderWa, sub: biz.phone });
    var sS = Math.round(base * 6.4), gapS = base * 3, totalW = smalls.length * sS + (smalls.length - 1) * gapS, sx = (W - totalW) / 2;
    smalls.forEach(function (qq) {
      drawQR(ctx, qq.q, sx, y, sS);
      tx.text(qq.cap, sx + sS / 2, y + sS + tx.lh(base * 0.7), { size: base * 0.7, weight: 700, align: 'center', maxW: sS + gapS });
      if (qq.sub) tx.text(qq.sub, sx + sS / 2, y + sS + tx.lh(base * 0.7) * 1.9, { size: base * 0.58, color: D.muted, align: 'center', ltr: true, maxW: sS + gapS });
      sx += sS + gapS;
    });
    if (smalls.length) y += sS + tx.lh(base * 0.7) * 2.6;
    var lines = [];
    if (biz.address) lines.push(biz.address);
    if (biz.phone) lines.push(L.call + ': ' + biz.phone);
    if (biz.fssai) lines.push(L.fssai + ' ' + biz.fssai);
    if (biz.note) lines.push(biz.note);
    var ly = Math.max(y + base, H - pad - lines.length * tx.lh(base * 0.8));
    lines.forEach(function (ln) { tx.text(ln, W / 2, ly, { size: base * 0.8, color: D.muted, align: 'center', maxW: W - 2 * pad }); ly += tx.lh(base * 0.8); });
    return [cv];
  }

  root.MENU_RENDER = {
    DESIGNS: DESIGNS, SIZES: SIZES,
    pages: function (model) {
      var k = model.layout;
      if (k === 'tent') return tentPage(model);
      if (k === 'poster') return posterPage(model);
      return menuPages(model, SIZES[k] ? k : 'story');
    }
  };
})(window);
