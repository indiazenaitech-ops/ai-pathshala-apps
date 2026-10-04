/* Image Compressor & Resizer: batch resize, compress, watermark and rename photos, all inside the browser.
   Nothing is uploaded. Photos are decoded one at a time (phone memory), redrawn on a canvas (which drops
   EXIF / GPS) and encoded again. HEIC support is lazy-loaded from a CDN only when a HEIC file is added. */
(function () {
  'use strict';
  var SLUG = 'image-compressor';
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, el = EDU.el;

  var PRESETS = window.IC_PRESETS || [];
  var GROUPS = window.IC_GROUPS || ['social', 'shop', 'web', 'general'];
  var HEIC_URL = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
  var MAX_FILES = 100;
  var MAX_FILE_MB = 80;
  /* Canvas limits: iOS Safari will not draw more than 16.7 million pixels (4096 x 4096); phones have little memory. */
  var IS_IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var COARSE = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  var MAX_AREA = IS_IOS ? 16777216 : COARSE ? 33554432 : 67108864;
  var MAX_SIDE = IS_IOS ? 8192 : 16384;
  var MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };
  var FMT_NAME = { jpg: 'JPG', png: 'PNG', webp: 'WebP', avif: 'AVIF' };
  var POS = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'];
  var POS_ARROW = { tl: '↖', tc: '↑', tr: '↗', ml: '←', mc: '•', mr: '→', bl: '↙', bc: '↓', br: '↘' };

  var DEFAULTS = {
    preset: 'wa_share', customW: 1080, customH: 1080,
    mode: 'fill', bg: 'blur', color: '#ffffff', margin: 0, noEnlarge: true,
    format: 'jpg', cmode: 'quality', quality: 82, targetKB: 200,
    wm: { type: 'none', text: '', color: '#ffffff', size: 5, opacity: 70, pos: 'br', tile: false, lsize: 22 },
    pattern: '{name}_{w}x{h}'
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function loadSettings() {
    var s = clone(DEFAULTS), saved = store.get('settings', null);
    if (saved && typeof saved === 'object') {
      Object.keys(DEFAULTS).forEach(function (k) { if (k !== 'wm' && saved[k] !== undefined && typeof saved[k] === typeof DEFAULTS[k]) s[k] = saved[k]; });
      if (saved.wm && typeof saved.wm === 'object') Object.keys(DEFAULTS.wm).forEach(function (k) { if (saved.wm[k] !== undefined && typeof saved.wm[k] === typeof DEFAULTS.wm[k]) s.wm[k] = saved.wm[k]; });
    }
    if (!presetById(s.preset)) s.preset = DEFAULTS.preset;
    if (['fit', 'fill', 'exact'].indexOf(s.mode) < 0) s.mode = 'fill';
    if (['color', 'blur', 'transparent'].indexOf(s.bg) < 0) s.bg = 'blur';
    if (!MIME[s.format]) s.format = 'jpg';
    if (['quality', 'size'].indexOf(s.cmode) < 0) s.cmode = 'quality';
    if (['none', 'text', 'logo'].indexOf(s.wm.type) < 0) s.wm.type = 'none';
    if (POS.indexOf(s.wm.pos) < 0) s.wm.pos = 'br';
    return s;
  }
  function presetById(id) { for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i]; return null; }

  var S = loadSettings();
  var logo = null;                                 /* { canvas, url } */
  var items = [];                                  /* the photos added in this session (never saved) */
  var selId = null, view = 'compare';
  var version = 0, running = false, kickTimer = null, nextId = 1;
  var support = { webp: true, avif: false };
  var heicState = 'idle', heicPromise = null;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ================================================================ bytes / header sniffing */
  function u16(b, o, le) { return le ? (b[o] | (b[o + 1] << 8)) : ((b[o] << 8) | b[o + 1]); }
  function u32(b, o, le) {
    return le ? ((b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0) : (((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0);
  }
  function ascii(b, o, n) { var s = ''; for (var i = 0; i < n && o + i < b.length; i++) s += String.fromCharCode(b[o + i]); return s; }
  function findBytes(b, str, from, to) {
    to = Math.min(to || b.length, b.length) - str.length;
    var c0 = str.charCodeAt(0);
    outer: for (var i = from || 0; i <= to; i++) {
      if (b[i] !== c0) continue;
      for (var j = 1; j < str.length; j++) if (b[i + j] !== str.charCodeAt(j)) continue outer;
      return i;
    }
    return -1;
  }

  /* TIFF block inside EXIF: orientation, camera, GPS position */
  function parseTiff(b, base, info) {
    if (base < 0 || base + 8 > b.length) return;
    var bo = ascii(b, base, 2), le = bo === 'II';
    if (!le && bo !== 'MM') return;
    if (u16(b, base + 2, le) !== 42) return;
    info.exif = true;
    var ifd = base + u32(b, base + 4, le);
    if (ifd + 2 > b.length) return;
    var n = u16(b, ifd, le);
    for (var i = 0; i < n && i < 400; i++) {
      var e = ifd + 2 + i * 12;
      if (e + 12 > b.length) break;
      var tag = u16(b, e, le);
      if (tag === 0x0112) info.orientation = u16(b, e + 8, le);
      else if (tag === 0x010F || tag === 0x0110 || tag === 0x9003 || tag === 0x8769) info.camera = true;
      else if (tag === 0x8825) {
        var g = base + u32(b, e + 8, le);
        if (g + 2 > b.length) { info.gps = true; continue; }
        var gn = u16(b, g, le);
        for (var k = 0; k < gn && k < 100; k++) {
          var ge = g + 2 + k * 12;
          if (ge + 12 > b.length) break;
          var gt = u16(b, ge, le);
          if (gt === 2 || gt === 4) { info.gps = true; break; }   /* latitude / longitude present */
        }
      }
    }
  }

  function sniff(b) {
    var info = { type: 'unknown', w: 0, h: 0, orientation: 1 };
    if (b.length < 12) return info;
    if (b[0] === 0xFF && b[1] === 0xD8) {
      info.type = 'jpeg';
      var o = 2;
      while (o + 4 <= b.length) {
        if (b[o] !== 0xFF) { o++; continue; }
        var m = b[o + 1];
        if (m === 0xFF) { o++; continue; }
        if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { o += 2; continue; }
        if (m === 0xD9 || m === 0xDA) break;
        var len = u16(b, o + 2);
        if (m === 0xE1) {
          if (ascii(b, o + 4, 6) === 'Exif\u0000\u0000') parseTiff(b, o + 10, info);
          else if (findBytes(b, 'GPSLatitude', o + 4, o + 2 + len) >= 0) { info.gps = true; info.exif = true; }
          else info.exif = true;
        }
        if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC && o + 10 <= b.length) {
          info.bits = b[o + 4]; info.h = u16(b, o + 5); info.w = u16(b, o + 7);
          if (b[o + 9] === 4) info.cmyk = true;
        }
        o += 2 + len;
      }
    } else if (b[0] === 0x89 && ascii(b, 1, 3) === 'PNG') {
      info.type = 'png';
      info.w = u32(b, 16); info.h = u32(b, 20);
      var ct = b[25];
      if (b[24] === 16) info.bits16 = true;
      if (ct === 4 || ct === 6) info.alpha = true;
      var p = 8;
      while (p + 8 <= b.length) {
        var clen = u32(b, p), ty = ascii(b, p + 4, 4);
        if (ty === 'tRNS') info.alpha = true;
        else if (ty === 'acTL') info.animated = true;
        else if (ty === 'eXIf') parseTiff(b, p + 8, info);
        else if (ty === 'tEXt' || ty === 'iTXt' || ty === 'zTXt') info.exif = true;
        else if (ty === 'IEND') break;
        p += 12 + clen;
      }
    } else if (ascii(b, 0, 4) === 'GIF8') {
      info.type = 'gif';
      info.w = u16(b, 6, true); info.h = u16(b, 8, true);
      var gce = 0, q = 13;
      while ((q = findBytes(b, '!ù\u0004', q)) >= 0) { gce++; if (b[q + 3] & 1) info.alpha = true; q += 3; if (gce > 1) break; }
      if (gce > 1 || findBytes(b, 'NETSCAPE2.0', 0, 4096) >= 0) info.animated = true;
    } else if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') {
      info.type = 'webp';
      var r = 12;
      while (r + 8 <= b.length) {
        var wt = ascii(b, r, 4), wl = u32(b, r + 4, true), d = r + 8;
        if (wt === 'VP8X' && d + 10 <= b.length) {
          if (b[d] & 0x10) info.alpha = true;
          if (b[d] & 0x02) info.animated = true;
          info.w = 1 + (b[d + 4] | (b[d + 5] << 8) | (b[d + 6] << 16));
          info.h = 1 + (b[d + 7] | (b[d + 8] << 8) | (b[d + 9] << 16));
        } else if (wt === 'VP8 ' && !info.w && d + 10 <= b.length) {
          info.w = u16(b, d + 6, true) & 0x3FFF; info.h = u16(b, d + 8, true) & 0x3FFF;
        } else if (wt === 'VP8L' && !info.w && d + 5 <= b.length) {
          var bits = u32(b, d + 1, true);
          info.w = (bits & 0x3FFF) + 1; info.h = ((bits >>> 14) & 0x3FFF) + 1;
          if ((bits >>> 28) & 1) info.alpha = true;
        } else if (wt === 'EXIF') {
          parseTiff(b, ascii(b, d, 6) === 'Exif\u0000\u0000' ? d + 6 : d, info);
        } else if (wt === 'ANIM') info.animated = true;
        r = d + wl + (wl & 1);
      }
    } else if (ascii(b, 4, 4) === 'ftyp') {
      var boxLen = Math.min(u32(b, 0), 256), brands = [ascii(b, 8, 4)];
      for (var bi = 16; bi + 4 <= boxLen; bi += 4) brands.push(ascii(b, bi, 4));
      if (brands.indexOf('avif') >= 0 || brands.indexOf('avis') >= 0) info.type = 'avif';
      else if (brands.some(function (x) { return /^(heic|heix|hevc|hevx|heim|heis|hevm|hevs|mif1|msf1)$/.test(x); })) info.type = 'heic';
      var ex = findBytes(b, 'Exif\u0000\u0000', 0);
      if (ex >= 0) parseTiff(b, ex + 6, info);
      info.w = 0; info.h = 0;              /* rotation boxes (irot) make header sizes unreliable: use the decoded size */
      info.orientation = 1;               /* HEIC/AVIF rotation is applied by the decoder itself */
    } else if (b[0] === 0x42 && b[1] === 0x4D) {
      info.type = 'bmp';
      info.w = Math.abs(u32(b, 18, true) | 0); info.h = Math.abs(u32(b, 22, true) | 0);
    }
    if (!(info.orientation >= 1 && info.orientation <= 8)) info.orientation = 1;
    return info;
  }

  function readHead(file) {
    var part = file.slice(0, 1024 * 1024);
    if (part.arrayBuffer) return part.arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(new Uint8Array(fr.result)); }; fr.onerror = rej; fr.readAsArrayBuffer(part); });
  }

  /* ================================================================ canvas helpers */
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function free(c) { if (c && c.getContext) { c.width = 1; c.height = 1; } }
  function hq(ctx) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; }

  /* Downscale in steps of 2 so big reductions stay sharp in every browser (Safari ignores smoothing quality). */
  function drawHQ(ctx, src, sx, sy, sw, sh, dx, dy, dw, dh) {
    var cur = src, cx = sx, cy = sy, cw = sw, ch = sh, temps = [];
    while (cw > dw * 2.2 || ch > dh * 2.2) {
      var nw = cw > dw * 2.2 ? Math.max(Math.ceil(dw), Math.round(cw / 2)) : Math.round(cw);
      var nh = ch > dh * 2.2 ? Math.max(Math.ceil(dh), Math.round(ch / 2)) : Math.round(ch);
      var tmp = canvas(nw, nh), tc = tmp.getContext('2d');
      hq(tc);
      tc.drawImage(cur, cx, cy, cw, ch, 0, 0, nw, nh);
      temps.push(tmp);
      cur = tmp; cx = 0; cy = 0; cw = nw; ch = nh;
    }
    hq(ctx);
    ctx.drawImage(cur, cx, cy, cw, ch, dx, dy, dw, dh);
    temps.forEach(free);
  }

  /* ================================================================ decoding */
  function decodeImg(blob) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(blob), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) { URL.revokeObjectURL(url); return rej(new Error('empty')); }
        res({ src: img, w: w, h: h, close: function () { URL.revokeObjectURL(url); img.removeAttribute('src'); } });
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('decode')); };
      img.src = url;
    });
  }

  /* Rotate manually only if the browser ignored the EXIF orientation (very old browsers). */
  function orientManually(d, o) {
    var swap = o >= 5, c = canvas(swap ? d.h : d.w, swap ? d.w : d.h), x = c.getContext('2d'), w = d.w, h = d.h;
    switch (o) {
      case 2: x.transform(-1, 0, 0, 1, w, 0); break;
      case 3: x.transform(-1, 0, 0, -1, w, h); break;
      case 4: x.transform(1, 0, 0, -1, 0, h); break;
      case 5: x.transform(0, 1, 1, 0, 0, 0); break;
      case 6: x.transform(0, 1, -1, 0, h, 0); break;
      case 7: x.transform(0, -1, -1, 0, h, w); break;
      case 8: x.transform(0, -1, 1, 0, 0, w); break;
    }
    x.drawImage(d.src, 0, 0);
    d.close();
    return { src: c, w: c.width, h: c.height, close: function () { free(c); } };
  }

  /* Decode a photo. scale < 0.5: ask the browser to decode it smaller straight away (saves phone memory). */
  function decode(item, scale) {
    var blob = item.converted || item.file, info = item.info;
    var o = info.orientation || 1;
    var opts = { imageOrientation: 'from-image' };
    var small = scale < 0.45 && o === 1 && info.w > 0 && info.h > 0 && !item.converted;
    if (small) {
      var s = Math.min(1, scale * 2);
      opts.resizeWidth = Math.max(1, Math.round(info.w * s));
      opts.resizeHeight = Math.max(1, Math.round(info.h * s));
      opts.resizeQuality = 'high';
    }
    var viaImg = function () {
      return decodeImg(blob).then(function (d) { return d; });
    };
    var p = window.createImageBitmap ? createImageBitmap(blob, opts).then(function (bm) {
      return { src: bm, w: bm.width, h: bm.height, close: function () { if (bm.close) bm.close(); } };
    }).catch(viaImg) : viaImg();
    return p.then(function (d) {
      if (o >= 5 && !small && info.w && info.h && info.w !== info.h && d.w === info.w && d.h === info.h) return orientManually(d, o);
      return d;
    });
  }

  /* ================================================================ HEIC (iPhone photos) */
  function setHeicBox(state) {
    heicState = state;
    var box = $('#heicBox');
    box.hidden = state === 'idle' || state === 'ready';
    box.className = 'callout' + (state === 'failed' ? ' danger' : '');
    $('#heicMsg').textContent = state === 'failed' ? t('heic_failed') : t('heic_loading');
    $('#heicRetry').hidden = state !== 'failed';
  }
  function loadHeicLib() {
    if (window.heic2any) return Promise.resolve();
    if (heicPromise) return heicPromise;
    setHeicBox('loading');
    heicPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = HEIC_URL; s.async = true; s.crossOrigin = 'anonymous';
      var timer = setTimeout(function () { s.remove(); reject(new Error('timeout')); }, 60000);
      s.onload = function () { clearTimeout(timer); window.heic2any ? resolve() : reject(new Error('missing')); };
      s.onerror = function () { clearTimeout(timer); s.remove(); reject(new Error('load')); };
      document.head.appendChild(s);
    }).then(function () { setHeicBox('ready'); }, function (e) { heicPromise = null; setHeicBox('failed'); throw e; });
    return heicPromise;
  }
  function convertHeic(item) {
    return loadHeicLib().then(function () {
      return window.heic2any({ blob: item.file, toType: 'image/jpeg', quality: 0.95 });
    }).then(function (out) {
      item.converted = Array.isArray(out) ? out[0] : out;
      item.info.orientation = 1; item.info.w = 0; item.info.h = 0;
      item.flags.heic = true;
    });
  }

  /* ================================================================ size + geometry */
  function preset() { return presetById(S.preset) || PRESETS[0]; }
  function isBoxPreset() {
    var P = preset();
    if (P.custom) return (+S.customW > 0) && (+S.customH > 0);
    return !!(P.w && P.h);
  }
  function targetFor(ow, oh) {
    var P = preset(), kind = 'scale', W = ow, H = oh, k = 1;
    var cw = Math.round(+S.customW) || 0, ch = Math.round(+S.customH) || 0;
    if (P.custom) {
      if (cw > 0 && ch > 0) { kind = 'box'; W = cw; H = ch; }
      else if (cw > 0) k = cw / ow;
      else if (ch > 0) k = ch / oh;
    } else if (P.w && P.h) { kind = 'box'; W = P.w; H = P.h; }
    else if (P.w) k = P.w / ow;
    else if (P.long) k = P.long / Math.max(ow, oh);
    if (kind === 'scale') {
      if (S.noEnlarge && k > 1) k = 1;
      W = Math.max(1, Math.round(ow * k)); H = Math.max(1, Math.round(oh * k));
    }
    var c = 1;
    if (W > MAX_SIDE) c = Math.min(c, MAX_SIDE / W);
    if (H > MAX_SIDE) c = Math.min(c, MAX_SIDE / H);
    if (W * H * c * c > MAX_AREA) c = Math.min(c, Math.sqrt(MAX_AREA / (W * H)));
    if (c < 1) { W = Math.max(1, Math.floor(W * c)); H = Math.max(1, Math.floor(H * c)); }
    return { kind: kind, W: W, H: H, clamped: c < 1 };
  }
  function geometry(item, T) {
    var ow = item.ow, oh = item.oh, W = T.W, H = T.H;
    var g = { sx: 0, sy: 0, sw: ow, sh: oh, dx: 0, dy: 0, dw: W, dh: H, k: W / ow, pad: false, crop: null };
    if (T.kind !== 'box') return g;
    if (S.mode === 'fit') {
      var m = EDU.clamp(+S.margin || 0, 0, 40) / 100;
      var k = Math.min(W / ow, H / oh) * (1 - 2 * m);
      g.dw = Math.max(1, Math.round(ow * k)); g.dh = Math.max(1, Math.round(oh * k));
      g.dx = Math.round((W - g.dw) / 2); g.dy = Math.round((H - g.dh) / 2);
      g.k = k; g.pad = g.dw < W || g.dh < H;
    } else if (S.mode === 'fill') {
      var k2 = Math.max(W / ow, H / oh), cw = Math.min(ow, W / k2), ch = Math.min(oh, H / k2);
      var f = item.focus || { x: 0.5, y: 0.5 };
      g.sw = cw; g.sh = ch;
      g.sx = EDU.clamp(f.x * ow - cw / 2, 0, ow - cw);
      g.sy = EDU.clamp(f.y * oh - ch / 2, 0, oh - ch);
      g.k = k2;
      g.crop = { x: g.sx / ow, y: g.sy / oh, w: cw / ow, h: ch / oh, cut: cw < ow - 1 || ch < oh - 1 };
    } else {
      g.k = Math.max(W / ow, H / oh);
    }
    return g;
  }

  /* ================================================================ drawing */
  function blurCover(ctx, d, W, H) {
    var tw = Math.max(4, Math.round(W / 28)), th = Math.max(4, Math.round(H / 28));
    var k = Math.max(tw / d.w, th / d.h), cw = tw / k, ch = th / k;
    var tiny = canvas(tw, th);
    drawHQ(tiny.getContext('2d'), d.src, (d.w - cw) / 2, (d.h - ch) / 2, cw, ch, 0, 0, tw, th);
    var mid = canvas(tw * 4, th * 4), mc = mid.getContext('2d');
    hq(mc); mc.drawImage(tiny, 0, 0, mid.width, mid.height);
    hq(ctx); ctx.drawImage(mid, 0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, W, H);
    free(tiny); free(mid);
  }

  function isLight(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return true;
    var n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150;
  }
  function anchor(pos, W, H, w, h, m) {
    var col = pos.charAt(1), row = pos.charAt(0);
    return {
      x: col === 'l' ? m : col === 'c' ? (W - w) / 2 : W - w - m,
      y: row === 't' ? m : row === 'm' ? (H - h) / 2 : H - h - m
    };
  }
  var RTL_TEXT = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
  function wmFont(px) {
    var fam = 'system-ui, sans-serif';
    try { fam = getComputedStyle(document.body).fontFamily || fam; } catch (e) { }
    return '700 ' + px + 'px ' + fam;
  }
  function drawWatermark(ctx, W, H) {
    var wm = S.wm, base = Math.min(W, H), margin = Math.round(base * 0.035);
    if (wm.type === 'text' && wm.text.trim()) {
      var text = wm.text.trim(), size = Math.max(8, Math.round(base * wm.size / 100));
      ctx.save();
      ctx.font = wmFont(size);
      ctx.direction = RTL_TEXT.test(text) ? 'rtl' : 'ltr';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var tw = ctx.measureText(text).width;
      if (!wm.tile && tw > W - 2 * margin) { size = Math.max(6, Math.floor(size * (W - 2 * margin) / tw)); ctx.font = wmFont(size); tw = ctx.measureText(text).width; }
      var th = size * 1.3;
      ctx.globalAlpha = EDU.clamp(wm.opacity, 5, 100) / 100;
      ctx.fillStyle = wm.color;
      ctx.shadowColor = isLight(wm.color) ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)';
      ctx.shadowBlur = Math.max(2, size * 0.16);
      if (wm.tile) {
        ctx.translate(W / 2, H / 2); ctx.rotate(-Math.PI / 6);
        var diag = Math.sqrt(W * W + H * H) / 2 + size * 2, stepX = tw + size * 2.5, stepY = size * 3.4, count = 0, row = 0;
        for (var y = -diag; y <= diag && count < 3000; y += stepY, row++) {
          for (var x = -diag - (row % 2 ? stepX / 2 : 0); x <= diag && count < 3000; x += stepX, count++) ctx.fillText(text, x, y);
        }
      } else {
        var a = anchor(wm.pos, W, H, tw, th, margin);
        ctx.fillText(text, a.x + tw / 2, a.y + th / 2);
      }
      ctx.restore();
    } else if (wm.type === 'logo' && logo) {
      var lc = logo.canvas, long = Math.max(4, base * wm.lsize / 100);
      var lw = lc.width >= lc.height ? long : long * lc.width / lc.height;
      var lh = lc.width >= lc.height ? long * lc.height / lc.width : long;
      ctx.save();
      ctx.globalAlpha = EDU.clamp(wm.opacity, 5, 100) / 100;
      if (wm.tile) {
        var gx = lw * 1.9, gy = lh * 2.2, n = 0, r2 = 0;
        for (var yy = -lh / 2; yy < H && n < 3000; yy += gy, r2++) {
          for (var xx = (r2 % 2 ? gx / 2 : 0) - lw / 2; xx < W && n < 3000; xx += gx, n++) drawHQ(ctx, lc, 0, 0, lc.width, lc.height, xx, yy, lw, lh);
        }
      } else {
        var p = anchor(wm.pos, W, H, lw, lh, margin);
        drawHQ(ctx, lc, 0, 0, lc.width, lc.height, Math.round(p.x), Math.round(p.y), Math.round(lw), Math.round(lh));
      }
      ctx.restore();
    }
  }

  function outFormat() {
    var f = S.format;
    if (f === 'avif' && !support.avif) f = 'jpg';
    if (f === 'webp' && !support.webp) f = 'jpg';
    return f;
  }

  /* Draw one photo at the output size. Returns { canvas, T, g, flags }. */
  function renderCanvas(item, opts) {
    opts = opts || {};
    var ready = item.ow ? Promise.resolve() : decode(item, 1).then(function (d) { item.ow = d.w; item.oh = d.h; d.close(); });
    return ready.then(function () {
      var T = targetFor(item.ow, item.oh), g = geometry(item, T);
      return decode(item, g.k).then(function (d) {
        var fx = d.w / item.ow, fy = d.h / item.oh;
        var c = canvas(T.W, T.H), ctx = c.getContext('2d');
        var fmt = opts.format || outFormat(), opaque = fmt === 'jpg';
        var bg = T.kind === 'box' && S.mode === 'fit' ? S.bg : 'none';
        if (bg === 'color' || bg === 'blur' || opaque) { ctx.fillStyle = S.color; ctx.fillRect(0, 0, T.W, T.H); }
        if (bg === 'blur' && g.pad) blurCover(ctx, d, T.W, T.H);
        drawHQ(ctx, d.src, g.sx * fx, g.sy * fy, g.sw * fx, g.sh * fy, g.dx, g.dy, g.dw, g.dh);
        d.close();
        if (!opts.noWatermark) drawWatermark(ctx, T.W, T.H);
        var flags = {
          alphaFilled: !!item.info.alpha && opaque && !(bg === 'color' || bg === 'blur'),
          upscaled: T.kind === 'box' && g.k > 1.25 ? g.k : 0,
          clamped: T.clamped
        };
        return { canvas: c, T: T, g: g, flags: flags };
      });
    });
  }

  /* ================================================================ encoding */
  function toBlob(c, type, q) {
    return new Promise(function (res) {
      try { c.toBlob(function (b) { res(b); }, type, q); } catch (e) { res(null); }
    });
  }
  function shrinkCanvas(c, f) {
    var n = canvas(Math.max(1, Math.round(c.width * f)), Math.max(1, Math.round(c.height * f)));
    drawHQ(n.getContext('2d'), c, 0, 0, c.width, c.height, 0, 0, n.width, n.height);
    return n;
  }
  /* Highest quality between lo and hi whose file fits in limit bytes (7 halvings, like guessing a number). */
  function searchQuality(c, type, lo, hi, limit, isStale) {
    var best = null, i = 0;
    function step() {
      if (i++ >= 7 || isStale()) return Promise.resolve(best);
      var mid = (lo + hi) / 2;
      return toBlob(c, type, mid).then(function (b) {
        if (b && b.size <= limit) { best = { blob: b, q: mid }; lo = mid; } else hi = mid;
        return step();
      });
    }
    return step();
  }

  function encode(c, fmt, flexible, isStale) {
    var type = MIME[fmt], P = preset();
    var limitKB = S.cmode === 'size' ? Math.max(5, +S.targetKB || 0) : (P.maxKB || 0);
    var limit = limitKB * 1024, notes = {};
    if (fmt === 'png') {
      return toBlob(c, type).then(function (b) {
        if (b && limit && b.size > limit) notes.over = limitKB;
        return { blob: b, q: null, canvas: c, notes: notes };
      });
    }
    var q0 = S.cmode === 'size' ? 0.92 : EDU.clamp(+S.quality || 82, 10, 100) / 100;
    var cur = c, tries = 0;
    function attempt() {
      return toBlob(cur, type, q0).then(function (b) {
        if (!b) return { blob: null };
        if (!limit || b.size <= limit) return { blob: b, q: q0, canvas: cur, notes: notes };
        return searchQuality(cur, type, 0.1, q0, limit, isStale).then(function (best) {
          if (best) {
            if (S.cmode !== 'size') { notes.lowered = Math.round(best.q * 100); notes.limit = limitKB; }
            return { blob: best.blob, q: best.q, canvas: cur, notes: notes };
          }
          return toBlob(cur, type, 0.1).then(function (smallest) {
            if (flexible && S.cmode === 'size' && tries < 5 && smallest && !isStale()) {
              tries++;
              var f = Math.max(0.3, Math.min(0.9, Math.sqrt(limit / smallest.size) * 0.95));
              var next = shrinkCanvas(cur, f);
              if (cur !== c) free(cur);
              cur = next; notes.shrunk = limitKB;
              return attempt();
            }
            notes.over = limitKB;
            return { blob: smallest, q: 0.1, canvas: cur, notes: notes };
          });
        });
      });
    }
    return attempt();
  }

  /* ================================================================ processing queue (one photo at a time) */
  function invalidateAll(delay) {
    version++;
    items.forEach(function (it) { if (it.status !== 'error' || it.retry) { it.dirty = true; } });
    kick(delay);
  }
  function kick(delay) {
    clearTimeout(kickTimer);
    if (items.some(function (x) { return x.dirty; })) setBusy(true);   /* pending work counts as busy */
    kickTimer = setTimeout(work, delay || 0);
  }
  function nextDirty() {
    var sel = items.filter(function (x) { return x.id === selId && x.dirty; })[0];
    return sel || items.filter(function (x) { return x.dirty; })[0] || null;
  }
  function setBusy(b) { $('#app').setAttribute('data-busy', b ? '1' : '0'); }
  function yieldUI() { return new Promise(function (r) { setTimeout(r, 0); }); }

  function work() {
    if (running) return;
    running = true; setBusy(true); renderSummary();
    function loop() {
      var it = nextDirty();
      if (!it) return Promise.resolve();
      var v = version, iv = it.v;
      it.dirty = false; it.status = 'working'; it.retry = false;
      updateItem(it);
      var stale = function () { return v !== version || iv !== it.v || items.indexOf(it) < 0; };
      return processItem(it, stale).then(function (r) {
        if (stale()) { if (r) dropResult(r); if (items.indexOf(it) >= 0) it.dirty = true; return; }
        applyResult(it, r);
      }, function (e) {
        if (stale()) { if (items.indexOf(it) >= 0) it.dirty = true; return; }
        it.status = 'error';
        it.error = e && e.message === 'heic' ? 'err_heic' : 'err_open';
        console.warn('[image-compressor]', it.file.name, e && e.message);
      }).then(function () {
        if (items.indexOf(it) >= 0) updateItem(it);
        renderSummary();
        return yieldUI().then(loop);
      });
    }
    loop().then(finish, function (e) { console.warn('[image-compressor] queue', e); finish(); });
    function finish() {
      running = false;
      if (nextDirty()) { kick(0); return; }
      setBusy(false); renderSummary(); refreshViewer();
    }
  }

  function processItem(it, stale) {
    var prep = Promise.resolve();
    if (it.info.type === 'heic' && !it.converted && !it.nativeHeic) {
      prep = decode(it, 1).then(function (d) { it.nativeHeic = true; it.ow = d.w; it.oh = d.h; d.close(); },
        function () { return convertHeic(it).catch(function () { throw new Error('heic'); }); });
    }
    return prep.then(function () {
      if (!it.ow) {
        if (it.info.w && it.info.h) {
          var swap = (it.info.orientation || 1) >= 5;
          it.ow = swap ? it.info.h : it.info.w; it.oh = swap ? it.info.w : it.info.h;
        }
      }
      return renderCanvas(it);
    }).then(function (r) {
      if (stale()) { free(r.canvas); return null; }
      var fmt = outFormat();
      return encode(r.canvas, fmt, r.T.kind !== 'box', stale).then(function (e) {
        if (e.blob && MIME[fmt] !== e.blob.type && fmt !== 'jpg') {
          support[fmt] = false; renderFormat();
          return encode(e.canvas || r.canvas, 'jpg', r.T.kind !== 'box', stale).then(function (e2) { e2.notes.fmtFallback = fmt; return finishEnc(e2, 'jpg'); });
        }
        return finishEnc(e, fmt);
      });
      function finishEnc(e, f) {
        if (!e.blob) throw new Error('encode');
        var outC = e.canvas || r.canvas;
        var res = { blob: e.blob, fmt: f, w: outC.width, h: outC.height, q: e.q, notes: e.notes, flags: r.flags, crop: r.g.crop, thumb: null };
        return makeThumb(outC).then(function (tb) {
          res.thumb = tb;
          if (outC !== r.canvas) free(outC);
          free(r.canvas);
          return res;
        });
      }
    });
  }
  function makeThumb(c) {
    var k = Math.min(1, 144 / Math.max(c.width, c.height));
    var tc = canvas(c.width * k, c.height * k);
    drawHQ(tc.getContext('2d'), c, 0, 0, c.width, c.height, 0, 0, tc.width, tc.height);
    return toBlob(tc, 'image/png').then(function (b) { free(tc); return b; });
  }
  function dropResult(r) { /* nothing held but blobs: garbage collected */ }
  function applyResult(it, r) {
    if (it.out) { URL.revokeObjectURL(it.out.url); if (it.out.thumbUrl) URL.revokeObjectURL(it.out.thumbUrl); }
    r.url = URL.createObjectURL(r.blob);
    r.thumbUrl = r.thumb ? URL.createObjectURL(r.thumb) : r.url;
    r.size = r.blob.size;
    it.out = r; it.status = 'done'; it.error = null;
  }

  /* ================================================================ adding files */
  function isImageLike(f) {
    return /^image\//.test(f.type) || /\.(jpe?g|jfif|png|gif|webp|avif|heic|heif|bmp|ico|svg)$/i.test(f.name || '');
  }
  function addFiles(list) {
    var files = Array.prototype.slice.call(list || []);
    if (!files.length) return;
    var room = MAX_FILES - items.length, skipped = 0, added = [];
    files.forEach(function (f) {
      if (!isImageLike(f)) { EDU.toast(t('not_image', { name: f.name || '?' })); return; }
      if (f.size > MAX_FILE_MB * 1024 * 1024) { EDU.toast(t('too_big', { name: f.name, mb: MAX_FILE_MB })); return; }
      if (room <= 0) { skipped++; return; }
      room--;
      var it = { id: nextId++, file: f, info: { type: 'unknown', orientation: 1 }, status: 'queued', dirty: false, v: 0, flags: {}, focus: null, out: null, ow: 0, oh: 0 };
      items.push(it); added.push(it);
    });
    if (skipped) EDU.toast(t('too_many', { n: MAX_FILES }));
    if (!added.length) return;
    if (!selId) selId = added[0].id;
    renderList();
    Promise.all(added.map(function (it) {
      return readHead(it.file).then(function (b) { it.info = sniff(b); }, function () { }).then(function () {
        if (it.info.type === 'unknown' && (/\.(heic|heif)$/i.test(it.file.name) || /hei[cf]/i.test(it.file.type))) it.info.type = 'heic';
      });
    })).then(function () {
      if (added.some(function (it) { return it.info.type === 'heic'; }) && !window.heic2any) {
        /* show the loading note early; the converter itself loads only if this browser cannot open HEIC */
      }
      added.forEach(function (it) { if (items.indexOf(it) >= 0) { it.dirty = true; updateItem(it); } });
      kick(0);
    });
  }

  function removeItem(it) {
    var i = items.indexOf(it);
    if (i < 0) return;
    items.splice(i, 1);
    if (it.out) { URL.revokeObjectURL(it.out.url); if (it.out.thumbUrl) URL.revokeObjectURL(it.out.thumbUrl); }
    if (it.srcThumbUrl) URL.revokeObjectURL(it.srcThumbUrl);
    it.converted = null;
    if (selId === it.id) selId = items[i] ? items[i].id : (items[i - 1] ? items[i - 1].id : null);
    renderList(); renderSummary(); refreshViewer();
  }
  function clearAll() {
    items.slice().forEach(function (it) {
      if (it.out) { URL.revokeObjectURL(it.out.url); if (it.out.thumbUrl) URL.revokeObjectURL(it.out.thumbUrl); }
      if (it.srcThumbUrl) URL.revokeObjectURL(it.srcThumbUrl);
    });
    items = []; selId = null; version++;
    renderList(); renderSummary(); refreshViewer();
  }

  /* Sample photos drawn on the spot (no files shipped). One carries a fake GPS tag to show the privacy badge. */
  function makeSamples() {
    function noise(ctx, w, h, amt) {
      var img = ctx.getImageData(0, 0, w, h), d = img.data, seed = 7;
      for (var i = 0; i < d.length; i += 4) {
        seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
        var n = ((seed >> 16) % (amt * 2)) - amt;
        d[i] += n; d[i + 1] += n; d[i + 2] += n;
      }
      ctx.putImageData(img, 0, 0);
    }
    function landscape() {
      var w = 3200, h = 2400, c = canvas(w, h), x = c.getContext('2d');
      var sky = x.createLinearGradient(0, 0, 0, h * 0.6); sky.addColorStop(0, '#f6a35c'); sky.addColorStop(1, '#fde3b0');
      x.fillStyle = sky; x.fillRect(0, 0, w, h);
      x.fillStyle = '#fff4d6'; x.beginPath(); x.arc(w * 0.7, h * 0.36, h * 0.09, 0, 7); x.fill();
      x.fillStyle = '#8a5a44'; x.beginPath(); x.moveTo(0, h * 0.62); x.lineTo(w * 0.22, h * 0.38); x.lineTo(w * 0.45, h * 0.6); x.lineTo(w * 0.62, h * 0.44); x.lineTo(w, h * 0.66); x.lineTo(w, h); x.lineTo(0, h); x.fill();
      x.fillStyle = '#2f6f4f'; x.fillRect(0, h * 0.7, w, h * 0.3);
      x.fillStyle = '#d8b26e';
      for (var i = 0; i < 9; i++) { x.fillRect(w * (0.08 + i * 0.1), h * (0.62 - (i % 3) * 0.02), w * 0.05, h * 0.1); }
      noise(x, w, h, 14);
      return c;
    }
    function product() {
      var w = 1800, h = 1800, c = canvas(w, h), x = c.getContext('2d');
      x.fillStyle = 'rgba(0,0,0,0.12)'; x.beginPath(); x.ellipse(w / 2, h * 0.86, w * 0.3, h * 0.04, 0, 0, 7); x.fill();
      var body = x.createLinearGradient(w * 0.25, 0, w * 0.75, 0); body.addColorStop(0, '#0b7285'); body.addColorStop(0.5, '#3bc9db'); body.addColorStop(1, '#0b4f5c');
      x.fillStyle = body; x.beginPath(); x.moveTo(w * 0.28, h * 0.22); x.lineTo(w * 0.72, h * 0.22); x.lineTo(w * 0.68, h * 0.84); x.lineTo(w * 0.32, h * 0.84); x.closePath(); x.fill();
      x.lineWidth = w * 0.05; x.strokeStyle = '#0b4f5c'; x.beginPath(); x.arc(w * 0.74, h * 0.48, h * 0.13, -1.2, 1.2); x.stroke();
      x.fillStyle = '#e8590c'; x.beginPath(); x.arc(w / 2, h * 0.5, w * 0.1, 0, 7); x.fill();
      noise(x, w, h, 12);
      return c;
    }
    function portrait() {
      var w = 2160, h = 2880, c = canvas(w, h), x = c.getContext('2d');
      var g = x.createRadialGradient(w / 2, h * 0.35, 10, w / 2, h * 0.4, h * 0.8); g.addColorStop(0, '#ffd8a8'); g.addColorStop(1, '#5f3dc4');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 40; i++) { x.fillStyle = 'hsla(' + (i * 37 % 360) + ',80%,65%,0.5)'; x.beginPath(); x.arc((i * 997) % w, (i * 613) % h, 40 + (i * 31) % 120, 0, 7); x.fill(); }
      x.fillStyle = '#c2255c'; x.beginPath(); x.ellipse(w / 2, h * 0.92, w * 0.32, h * 0.3, 0, Math.PI, 0); x.fill();
      x.fillStyle = '#8d5524'; x.beginPath(); x.arc(w / 2, h * 0.47, w * 0.17, 0, 7); x.fill();
      x.fillStyle = '#1b1b1b'; x.beginPath(); x.arc(w / 2, h * 0.43, w * 0.18, Math.PI, 0); x.fill();
      noise(x, w, h, 10);
      return c;
    }
    var jobs = [
      { c: landscape, name: 'sample_phone_photo.jpg', type: 'image/jpeg', gps: true },
      { c: product, name: 'sample_product.png', type: 'image/png' },
      { c: portrait, name: 'sample_portrait.jpg', type: 'image/jpeg' }
    ];
    $('#sampleBtn').disabled = true;
    var files = [];
    return jobs.reduce(function (p, j) {
      return p.then(yieldUI).then(function () {
        var c = j.c();
        return toBlob(c, j.type, 0.95).then(function (b) {
          free(c);
          if (!b) return;
          if (j.gps) b = addFakeExif(b);
          return Promise.resolve(b).then(function (bb) { files.push(new File([bb], j.name, { type: j.type })); });
        });
      });
    }, Promise.resolve()).then(function () {
      $('#sampleBtn').disabled = false;
      addFiles(files);
    }, function () { $('#sampleBtn').disabled = false; });
  }
  /* Insert a small EXIF block (camera + GPS: Jaipur) right after the JPEG start marker. */
  function addFakeExif(blob) {
    return blob.arrayBuffer().then(function (ab) {
      var src = new Uint8Array(ab);
      var tiff = [];
      function w16(v) { tiff.push((v >> 8) & 255, v & 255); }
      function w32(v) { tiff.push((v >>> 24) & 255, (v >> 16) & 255, (v >> 8) & 255, v & 255); }
      tiff.push(0x4D, 0x4D); w16(42); w32(8);
      /* IFD0 at 8: 2 entries (Make, GPS pointer) */
      w16(2);
      w16(0x010F); w16(2); w32(6); w32(38);               /* Make -> "Phone\0" at 38 */
      w16(0x8825); w16(4); w32(1); w32(44);               /* GPS IFD at 44 */
      w32(0);
      /* offset 38 */
      'Phone'.split('').forEach(function (ch) { tiff.push(ch.charCodeAt(0)); }); tiff.push(0);
      /* GPS IFD at 44: 4 entries */
      w16(4);
      w16(1); w16(2); w32(2); tiff.push(78, 0, 0, 0);     /* N */
      w16(2); w16(5); w32(3); w32(98);                    /* latitude rationals at 98 */
      w16(3); w16(2); w32(2); tiff.push(69, 0, 0, 0);     /* E */
      w16(4); w16(5); w32(3); w32(122);                   /* longitude rationals at 122 */
      w32(0);
      [26, 1, 54, 1, 0, 1].forEach(w32);                  /* 26 54 0 */
      [75, 1, 47, 1, 0, 1].forEach(w32);                  /* 75 47 0 */
      var payload = [0x45, 0x78, 0x69, 0x66, 0, 0].concat(tiff);
      var len = payload.length + 2;
      var seg = [0xFF, 0xE1, (len >> 8) & 255, len & 255].concat(payload);
      var out = new Uint8Array(src.length + seg.length);
      out.set(src.subarray(0, 2), 0); out.set(seg, 2); out.set(src.subarray(2), 2 + seg.length);
      return new Blob([out], { type: 'image/jpeg' });
    });
  }

  /* ================================================================ file names */
  function pad(n, len) { n = String(n); while (n.length < len) n = '0' + n; return n; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }
  function baseName(name) { return String(name || 'photo').replace(/\.[^.]+$/, '') || 'photo'; }
  function cleanName(s) {
    s = String(s).replace(/[\\/:*?"<>|\u0000-\u001F]+/g, '_').replace(/\s+/g, ' ').trim().replace(/^\.+/, '');
    if (s.length > 120) s = s.slice(0, 120);
    return s || 'photo';
  }
  function fileNames() {
    var used = {}, out = {}, pat = S.pattern && S.pattern.trim() ? S.pattern : DEFAULTS.pattern, date = today();
    var width = String(items.length).length < 2 ? 2 : String(items.length).length;
    items.forEach(function (it, i) {
      var w = it.out ? it.out.w : 0, h = it.out ? it.out.h : 0, ext = it.out ? it.out.fmt : outFormat();
      var name = cleanName(pat.replace(/\{name\}/g, baseName(it.file.name)).replace(/\{w\}/g, w).replace(/\{h\}/g, h)
        .replace(/\{n\}/g, pad(i + 1, width)).replace(/\{date\}/g, date));
      var full = name + '.' + ext, k = 2;
      while (used[full.toLowerCase()]) full = name + '-' + (k++) + '.' + ext;
      used[full.toLowerCase()] = 1;
      out[it.id] = full;
    });
    return out;
  }

  /* ================================================================ formatting */
  function fmtBytes(n) {
    if (!(n >= 0)) return '–';
    if (n < 1024) return EDU.fmt(n) + ' B';
    if (n < 1024 * 1024) return EDU.fmt(Math.round(n / 1024)) + ' KB';
    return EDU.fmt(n / 1048576, { maximumFractionDigits: n < 10 * 1048576 ? 2 : 1 }) + ' MB';
  }
  /* % saved, never "100%" while something is left, never "-0%" */
  function savedPct(after, before) {
    var p = (1 - after / before) * 100;
    return p >= 0 ? Math.min(99, Math.floor(p)) : -Math.ceil(-p);
  }
  function dims(w, h) { return w + ' × ' + h; }
  function dimsPlain(w, h) { return w + ' × ' + h; }

  /* ================================================================ settings UI */
  function save() { store.set('settings', S); }
  function changed(delay) { save(); renderSettings(); invalidateAll(delay === undefined ? 250 : delay); }

  function presetDims(P) {
    if (P.custom) {
      var cw = +S.customW || 0, ch = +S.customH || 0;
      return cw && ch ? dimsPlain(cw, ch) : cw ? '↔ ' + cw + ' px' : ch ? '↕ ' + ch + ' px' : '';
    }
    if (P.w && P.h) return dimsPlain(P.w, P.h);
    if (P.w) return '↔ ' + P.w + ' px';
    if (P.long) return '⤢ ' + P.long + ' px';
    return '100%';
  }
  function presetShape(P) {
    var box = el('span', { class: 'ic-shape', 'aria-hidden': 'true' });
    var w = P.custom ? +S.customW : P.w, h = P.custom ? +S.customH : P.h;
    if (w > 0 && h > 0) {
      var k = 26 / Math.max(w, h);
      box.appendChild(el('i', { style: { width: Math.max(6, Math.round(w * k)) + 'px', height: Math.max(6, Math.round(h * k)) + 'px' } }));
    } else box.appendChild(el('b', { text: P.custom ? '✎' : P.w ? '↔' : P.long ? '⤢' : '◻' }));
    return box;
  }
  function renderPresets() {
    var grid = $('#presetGrid');
    grid.textContent = '';
    GROUPS.forEach(function (g) {
      var list = PRESETS.filter(function (p) { return p.group === g; });
      if (!list.length) return;
      grid.appendChild(el('div', { class: 'ic-group', text: t('g_' + g) }));
      var wrap = el('div', { class: 'ic-presets', role: 'group', 'aria-label': t('g_' + g) });
      list.forEach(function (P) {
        var b = el('button', { type: 'button', class: 'ic-preset', 'data-preset': P.id, 'aria-pressed': String(S.preset === P.id), id: 'preset-' + P.id },
          presetShape(P),
          el('span', { class: 'ic-ptxt' }, el('span', { class: 'ic-plab', text: t('p_' + P.id) }), el('span', { class: 'ic-pdim', text: presetDims(P) })));
        b.addEventListener('click', function () { choosePreset(P); });
        wrap.appendChild(b);
      });
      grid.appendChild(wrap);
    });
  }
  function choosePreset(P) {
    S.preset = P.id;
    if (P.mode) S.mode = P.mode;
    if (P.bg) S.bg = P.bg;
    if (P.color) S.color = P.color;
    if (P.mode === 'fit') S.margin = P.margin || 0;
    if (P.format) S.format = P.format;
    if (P.custom) setTimeout(function () { $('#customW').focus(); }, 0);
    changed(0);
    renderPresets();
  }

  function setPressed(sel, attr, val) {
    EDU.$$(sel).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === val)); });
  }
  function renderFormat() {
    $('#fmt-avif').hidden = !support.avif;
    $('#fmt-webp').disabled = !support.webp;
    setPressed('#fmtSeg button', 'data-fmt', outFormat());
    var f = outFormat();
    var hint = t('fmt_' + f);
    if (S.format !== f) hint = t('fmt_unsupported', { fmt: FMT_NAME[S.format] }) + ' ' + hint;
    $('#fmtHint').textContent = hint;
  }
  function renderSettings() {
    var P = preset(), box = isBoxPreset();
    EDU.$$('.ic-preset').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-preset') === S.preset)); });
    $('#customBox').hidden = !P.custom;
    if (document.activeElement !== $('#customW')) $('#customW').value = S.customW || '';
    if (document.activeElement !== $('#customH')) $('#customH').value = S.customH || '';
    var custDim = $('#preset-custom .ic-pdim');
    if (custDim) custDim.textContent = presetDims(presetById('custom') || P);
    var note = t('pn_' + P.id);
    if (P.maxKB && S.cmode !== 'size') note += ' ' + t('limit_note', { kb: EDU.fmt(P.maxKB) });
    $('#presetNote').textContent = note;

    $('#modeSec').hidden = !box;
    $('#enlargeSec').hidden = box || P.id === 'original';
    $('#noEnlarge').checked = !!S.noEnlarge;
    setPressed('#modeSec [data-mode]', 'data-mode', S.mode);
    $('#modeHint').textContent = t('mode_' + S.mode + '_hint');
    $('#fitOpts').hidden = S.mode !== 'fit';
    setPressed('#fitOpts [data-bg]', 'data-bg', S.bg);
    $('#colorRow').hidden = S.bg === 'blur' || (S.bg === 'transparent' && outFormat() !== 'jpg');
    $('#bgColor').value = S.color;
    $('#margin').value = S.margin;
    $('#marginOut').textContent = EDU.fmt(S.margin) + '%';

    renderFormat();
    setPressed('[data-cm]', 'data-cm', S.cmode);
    $('#qualityBox').hidden = S.cmode !== 'quality' || outFormat() === 'png';
    $('#sizeBox').hidden = S.cmode !== 'size';
    $('#quality').value = S.quality;
    $('#qualityOut').textContent = EDU.fmt(S.quality);
    if (document.activeElement !== $('#targetKB')) $('#targetKB').value = S.targetKB;
    EDU.$$('#kbChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(+c.getAttribute('data-kb') === +S.targetKB)); });
    $('#sizeHint').textContent = outFormat() === 'png' ? t('png_no_size') : t(box ? 'size_hint_box' : 'size_hint_scale');
    $('#sizeHint').className = 'small mb0 ' + (outFormat() === 'png' ? 'bad' : 'muted');
    if (S.cmode === 'quality' && outFormat() === 'png') { $('#qualityBox').hidden = true; }

    var wm = S.wm;
    setPressed('[data-wm]', 'data-wm', wm.type);
    $('#wmTextBox').hidden = wm.type !== 'text';
    $('#wmLogoBox').hidden = wm.type !== 'logo';
    $('#wmCommon').hidden = wm.type === 'none';
    if (document.activeElement !== $('#wmText')) $('#wmText').value = wm.text;
    $('#wmColor').value = wm.color;
    $('#wmSize').value = wm.size; $('#wmSizeOut').textContent = EDU.fmt(wm.size) + '%';
    $('#wmLsize').value = wm.lsize; $('#wmLsizeOut').textContent = EDU.fmt(wm.lsize) + '%';
    $('#wmOpacity').value = wm.opacity; $('#wmOpacityOut').textContent = EDU.fmt(wm.opacity) + '%';
    $('#wmTile').checked = !!wm.tile;
    setPressed('#posGrid button', 'data-pos', wm.pos);
    $('#logoPrev').hidden = !logo; $('#logoDel').hidden = !logo;
    if (logo) $('#logoPrev').src = logo.url;
    var on = wm.type === 'text' ? !!wm.text.trim() : wm.type === 'logo' ? !!logo : false;
    $('#wmBadge').textContent = on ? t('wm_on') : t('wm_off');
    $('#wmBadge').className = 'badge' + (on ? ' success' : '');

    if (document.activeElement !== $('#pattern')) $('#pattern').value = S.pattern;
    renderNameExample();
  }
  function renderNameExample() {
    var pat = S.pattern && S.pattern.trim() ? S.pattern : DEFAULTS.pattern;
    var first = items[0], P = preset();
    var w = first && first.out ? first.out.w : (P.w || 1080), h = first && first.out ? first.out.h : (P.h || 1080);
    var nm = first ? baseName(first.file.name) : 'IMG_2041';
    $('#nameEx').textContent = cleanName(pat.replace(/\{name\}/g, nm).replace(/\{w\}/g, w).replace(/\{h\}/g, h).replace(/\{n\}/g, '01').replace(/\{date\}/g, today())) + '.' + outFormat();
  }

  function buildPosGrid() {
    var g = $('#posGrid'); g.textContent = '';
    POS.forEach(function (p) {
      var b = el('button', { type: 'button', 'data-pos': p, id: 'pos-' + p, 'aria-label': t('pos_' + p), title: t('pos_' + p), text: POS_ARROW[p] });
      b.addEventListener('click', function () { S.wm.pos = p; S.wm.tile = false; changed(0); });
      g.appendChild(b);
    });
  }

  function bindSettings() {
    $('#customW').addEventListener('input', function () { S.customW = Math.max(0, Math.min(20000, Math.round(+this.value || 0))); renderPresets(); changed(500); });
    $('#customH').addEventListener('input', function () { S.customH = Math.max(0, Math.min(20000, Math.round(+this.value || 0))); renderPresets(); changed(500); });
    EDU.$$('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { S.mode = b.getAttribute('data-mode'); changed(0); }); });
    EDU.$$('[data-bg]').forEach(function (b) { b.addEventListener('click', function () { S.bg = b.getAttribute('data-bg'); changed(0); }); });
    $('#bgColor').addEventListener('input', function () { S.color = this.value; changed(300); });
    EDU.$$('#colorRow [data-color]').forEach(function (b) { b.addEventListener('click', function () { S.color = b.getAttribute('data-color'); if (S.bg === 'blur') S.bg = 'color'; changed(0); }); });
    $('#margin').addEventListener('input', function () { S.margin = +this.value; changed(300); });
    $('#noEnlarge').addEventListener('change', function () { S.noEnlarge = this.checked; changed(0); });
    EDU.$$('[data-fmt]').forEach(function (b) { b.addEventListener('click', function () { S.format = b.getAttribute('data-fmt'); changed(0); }); });
    EDU.$$('[data-cm]').forEach(function (b) { b.addEventListener('click', function () { S.cmode = b.getAttribute('data-cm'); changed(0); }); });
    $('#quality').addEventListener('input', function () { S.quality = +this.value; $('#qualityOut').textContent = EDU.fmt(S.quality); save(); invalidateAll(300); });
    $('#targetKB').addEventListener('input', function () { var v = Math.round(+this.value || 0); if (v >= 5) { S.targetKB = Math.min(50000, v); changed(600); } });
    EDU.$$('#kbChips [data-kb]').forEach(function (b) { b.addEventListener('click', function () { S.targetKB = +b.getAttribute('data-kb'); $('#targetKB').value = S.targetKB; changed(0); }); });

    EDU.$$('[data-wm]').forEach(function (b) {
      b.addEventListener('click', function () {
        S.wm.type = b.getAttribute('data-wm');
        if (S.wm.type === 'text' && !S.wm.text.trim()) S.wm.text = t('wm_sample');
        changed(0);
        if (S.wm.type === 'logo' && !logo) pickLogo();
      });
    });
    $('#wmText').addEventListener('input', function () { S.wm.text = this.value; changed(400); });
    $('#wmColor').addEventListener('input', function () { S.wm.color = this.value; changed(300); });
    $('#wmSize').addEventListener('input', function () { S.wm.size = +this.value; changed(300); });
    $('#wmLsize').addEventListener('input', function () { S.wm.lsize = +this.value; changed(300); });
    $('#wmOpacity').addEventListener('input', function () { S.wm.opacity = +this.value; changed(300); });
    $('#wmTile').addEventListener('change', function () { S.wm.tile = this.checked; if (this.checked && S.wm.opacity > 40) S.wm.opacity = 30; changed(0); });
    $('#logoPick').addEventListener('click', pickLogo);
    $('#logoDel').addEventListener('click', function () { logo = null; store.remove('logo'); changed(0); });

    $('#pattern').addEventListener('input', function () { S.pattern = this.value; save(); renderNameExample(); renderNames(); });
    EDU.$$('#tokChips [data-tok]').forEach(function (b) {
      b.addEventListener('click', function () {
        var inp = $('#pattern'), tok = b.getAttribute('data-tok');
        var s = inp.selectionStart != null ? inp.selectionStart : inp.value.length, e = inp.selectionEnd != null ? inp.selectionEnd : s;
        inp.value = inp.value.slice(0, s) + tok + inp.value.slice(e);
        inp.focus(); inp.setSelectionRange(s + tok.length, s + tok.length);
        S.pattern = inp.value; save(); renderNameExample(); renderNames();
      });
    });
    $('#resetSettings').addEventListener('click', function () {
      if (!confirm(t('confirm_reset_settings'))) return;
      S = clone(DEFAULTS); logo = null; store.remove('logo');
      items.forEach(function (it) { it.focus = null; });
      renderPresets(); changed(0);
    });
  }

  /* ---------------- logo ---------------- */
  function setLogoFromImage(img) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    if (!w || !h) return false;
    var k = Math.min(1, 800 / Math.max(w, h)), c = canvas(w * k, h * k);
    drawHQ(c.getContext('2d'), img, 0, 0, w, h, 0, 0, c.width, c.height);
    var url = c.toDataURL('image/png');
    logo = { canvas: c, url: url };
    if (url.length < 900000) store.set('logo', url); else store.remove('logo');
    return true;
  }
  function pickLogo() {
    EDU.pickFile('image/png,image/jpeg,image/webp,image/svg+xml,image/gif').then(function (f) {
      if (!f) { if (!logo && S.wm.type === 'logo') { renderSettings(); } return; }
      var url = URL.createObjectURL(f), img = new Image();
      img.onload = function () {
        var ok = setLogoFromImage(img);
        URL.revokeObjectURL(url);
        if (!ok) { EDU.toast(t('logo_bad')); return; }
        S.wm.type = 'logo'; changed(0);
      };
      img.onerror = function () { URL.revokeObjectURL(url); EDU.toast(t('logo_bad')); };
      img.src = url;
    });
  }
  function restoreLogo() {
    var url = store.get('logo', null);
    if (!url || typeof url !== 'string' || url.indexOf('data:image/') !== 0) return Promise.resolve();
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () {
        var c = canvas(img.naturalWidth, img.naturalHeight);
        c.getContext('2d').drawImage(img, 0, 0);
        logo = { canvas: c, url: url }; res();
      };
      img.onerror = function () { res(); };
      img.src = url;
    });
  }

  /* ================================================================ results UI */
  function badge(cls, text) { return el('span', { class: 'badge ' + cls, text: text }); }
  function itemBadges(it) {
    var out = [], o = it.out, info = it.info;
    if (it.status === 'error') { out.push(badge('danger', t(it.error || 'err_open'))); return out; }
    if (info.gps) out.push(badge('success', '📍 ' + t('b_gps')));
    else if (info.exif || info.camera) out.push(badge('success', t('b_exif')));
    if (it.flags.heic) out.push(badge('info', t('b_heic')));
    if (info.animated) out.push(badge('warn', t('b_anim')));
    if (info.cmyk) out.push(badge('warn', t('b_cmyk')));
    if (info.bits16) out.push(badge('info', t('b_16')));
    if (!o) return out;
    if (o.flags.alphaFilled) out.push(badge('info', t('b_alpha')));
    if (o.flags.upscaled) out.push(badge('warn', t('b_upscaled', { x: EDU.fmt(o.flags.upscaled, { maximumFractionDigits: 1 }) })));
    if (o.flags.clamped) out.push(badge('warn', t('b_clamped')));
    if (o.notes.fmtFallback) out.push(badge('warn', t('b_fmt', { fmt: FMT_NAME[o.notes.fmtFallback] })));
    if (o.notes.lowered) out.push(badge('info', t('b_lowered', { q: o.notes.lowered, kb: EDU.fmt(o.notes.limit) })));
    if (o.notes.shrunk && !o.notes.over) out.push(badge('info', t('b_shrunk', { kb: EDU.fmt(o.notes.shrunk) })));
    if (o.notes.over) out.push(badge('danger', t('b_over', { kb: EDU.fmt(o.notes.over) })));
    if (o.size > it.file.size && !o.notes.over && !it.flags.heic) out.push(badge('warn', t('b_bigger')));
    return out;
  }

  var names = {};
  function renderNames() {
    names = fileNames();
    items.forEach(function (it) {
      var li = document.querySelector('.ic-item[data-id="' + it.id + '"]');
      if (!li) return;
      var nm = li.querySelector('.ic-name'), a = li.querySelector('.ic-dl');
      nm.textContent = it.out ? names[it.id] : it.file.name;
      nm.title = nm.textContent;
      if (a && it.out) a.setAttribute('download', names[it.id]);
    });
    if (selId) { var s = items.filter(function (x) { return x.id === selId; })[0]; if (s) $('#vName').textContent = s.out ? names[s.id] : s.file.name; }
  }

  function renderList() {
    var ul = $('#list');
    ul.textContent = '';
    items.forEach(function (it) {
      var li = el('li', { class: 'ic-item', 'data-id': String(it.id) });
      var tb = el('button', { type: 'button', class: 'ic-tbtn' });
      tb.addEventListener('click', function () { select(it.id, true); });
      var meta = el('div', { class: 'ic-meta' },
        el('div', { class: 'ic-name no-i18n' }),
        el('div', { class: 'ic-sizes' }),
        el('div', { class: 'ic-badges' }));
      var dl = el('a', { class: 'btn btn-sm btn-primary ic-dl', href: '#', 'aria-disabled': 'true' }, el('span', { 'aria-hidden': 'true', text: '⬇ ' }), el('span', { class: 'ic-dltxt' }));
      dl.addEventListener('click', function (e) { if (!it.out) e.preventDefault(); });
      var rm = el('button', { type: 'button', class: 'btn btn-sm btn-ghost ic-rm', text: '✕' });
      rm.addEventListener('click', function () { removeItem(it); });
      li.appendChild(tb); li.appendChild(meta); li.appendChild(el('div', { class: 'ic-acts' }, dl, rm));
      li.addEventListener('keydown', function (e) { if (e.key === 'Delete' && e.target.tagName !== 'INPUT') { e.preventDefault(); removeItem(it); } });
      ul.appendChild(li);
      updateItem(it, li);
    });
    $('#empty').hidden = items.length > 0;
    renderNames();
    renderSummary();
    refreshViewer();
  }

  function updateItem(it, li) {
    li = li || document.querySelector('.ic-item[data-id="' + it.id + '"]');
    if (!li) return;
    var o = it.out, done = it.status === 'done' && o;
    li.setAttribute('data-status', it.status);
    li.classList.toggle('sel', it.id === selId);
    if (done) {
      li.setAttribute('data-w', o.w); li.setAttribute('data-h', o.h); li.setAttribute('data-size', o.size);
      li.setAttribute('data-orig', it.file.size); li.setAttribute('data-gps', it.info.gps ? '1' : '0'); li.setAttribute('data-fmt', o.fmt);
    }
    var tb = li.querySelector('.ic-tbtn');
    tb.textContent = '';
    tb.setAttribute('aria-label', t('show_photo', { name: it.file.name }));
    if (o) tb.appendChild(el('img', { src: o.thumbUrl, alt: '' }));
    else tb.appendChild(el('span', { class: 'ic-spin', 'aria-hidden': 'true', text: it.status === 'error' ? '⚠' : '⏳' }));
    var sz = li.querySelector('.ic-sizes');
    sz.textContent = '';
    var origDim = it.ow ? dims(it.ow, it.oh) : (it.info.w ? dims(it.info.w, it.info.h) : '');
    sz.appendChild(el('span', { class: 'muted ic-dim', text: (origDim ? origDim + ' · ' : '') + fmtBytes(it.file.size) }));
    if (o) {
      sz.appendChild(el('span', { class: 'ic-arrow', 'aria-hidden': 'true', text: '→' }));
      sz.appendChild(el('strong', { class: 'ic-dim', text: dims(o.w, o.h) + ' · ' + fmtBytes(o.size) }));
      var pct = it.file.size ? savedPct(o.size, it.file.size) : 0;
      sz.appendChild(badge((pct >= 0 ? 'success' : 'warn') + ' ic-pct', pct >= 0 ? '−' + EDU.fmt(pct) + '%' : '+' + EDU.fmt(-pct) + '%'));
    }
    if (it.status === 'working' || it.status === 'queued' || (it.dirty && !o)) sz.appendChild(el('span', { class: 'muted', text: t(it.status === 'working' ? 'st_working' : 'st_queued') }));
    var bd = li.querySelector('.ic-badges');
    bd.textContent = '';
    itemBadges(it).forEach(function (b) { bd.appendChild(b); });
    var dl = li.querySelector('.ic-dl');
    dl.hidden = it.status === 'error';
    li.querySelector('.ic-dltxt').textContent = t('download');
    if (o) {
      dl.href = o.url; dl.setAttribute('download', names[it.id] || it.file.name); dl.removeAttribute('aria-disabled');
      dl.setAttribute('aria-label', t('download') + ': ' + (names[it.id] || ''));
    } else { dl.href = '#'; dl.setAttribute('aria-disabled', 'true'); dl.removeAttribute('download'); }
    li.querySelector('.ic-rm').setAttribute('aria-label', t('remove_photo', { name: it.file.name }));
    li.querySelector('.ic-rm').title = t('remove_photo', { name: it.file.name });
    if (o) renderNames();
    else { var nm = li.querySelector('.ic-name'); nm.textContent = it.file.name; nm.title = nm.textContent; }
    if (it.id === selId && it.status === 'done') refreshViewerSoon();
  }

  function doneItems() { return items.filter(function (it) { return it.status === 'done' && it.out; }); }
  function renderSummary() {
    var done = doneItems(), before = 0, after = 0;
    done.forEach(function (it) { before += it.file.size; after += it.out.size; });
    $('#stCount').textContent = EDU.fmt(items.length);
    $('#stBefore').textContent = done.length ? fmtBytes(before) : '–';
    $('#stAfter').textContent = done.length ? fmtBytes(after) : '–';
    var pct = before ? savedPct(after, before) : 0;
    var sv = $('#stSaved');
    sv.textContent = done.length ? (pct >= 0 ? EDU.fmt(pct) + '%' : '+' + EDU.fmt(-pct) + '%') : '–';
    sv.className = 'ic-stat ' + (done.length ? (pct >= 0 ? 'ok' : 'bad') : '');
    var pending = items.filter(function (it) { return it.dirty || it.status === 'working' || it.status === 'queued'; }).length;
    var total = items.length, prog = $('#prog');
    var working = $('#app').getAttribute('data-busy') === '1' && pending > 0;
    prog.hidden = !working;
    if (working) prog.firstElementChild.style.width = Math.round(100 * (total - pending) / Math.max(1, total)) + '%';
    var errors = items.filter(function (it) { return it.status === 'error'; }).length;
    var st = '';
    if (!total) st = t('status_empty');
    else if (working) st = t('status_working', { done: EDU.fmt(total - pending), total: EDU.fmt(total) });
    else if (done.length) st = (pct >= 0 ? t('status_done', { n: EDU.fmt(done.length), saved: fmtBytes(before - after) }) : t('status_bigger', { n: EDU.fmt(done.length) })) + (errors ? ' ' + t('status_errors', { n: EDU.fmt(errors) }) : '');
    else if (errors) st = t('status_errors', { n: EDU.fmt(errors) });
    $('#status').textContent = st;
    var ready = done.length > 0 && !working;
    $('#zipBtn').disabled = !ready; $('#eachBtn').disabled = !ready; $('#shareBtn').disabled = !ready;
    $('#clearBtn').disabled = !total;
    $('#mbar').hidden = !total;
    $('#mbarZip').disabled = !ready;
    $('#mbarTxt').textContent = !total ? '' : working ? t('status_working', { done: EDU.fmt(total - pending), total: EDU.fmt(total) })
      : done.length ? t('mbar_saved', { n: EDU.fmt(done.length), pct: EDU.fmt(Math.max(0, pct)) }) : '';
  }

  /* ================================================================ viewer: before / after + crop */
  var viewerTimer = null, viewerToken = 0, cmpPos = 50;
  function refreshViewerSoon() { clearTimeout(viewerTimer); viewerTimer = setTimeout(refreshViewer, 60); }
  function select(id, scroll) {
    selId = id;
    EDU.$$('.ic-item').forEach(function (li) { li.classList.toggle('sel', +li.getAttribute('data-id') === id); });
    refreshViewer();
    if (scroll) { var v = $('#viewer'); if (v && v.scrollIntoView) v.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }
  function selected() { return items.filter(function (x) { return x.id === selId; })[0] || null; }
  function cropAvailable() { return isBoxPreset() && S.mode === 'fill'; }

  function refreshViewer() {
    var it = selected(), v = $('#viewer');
    if (!it) { v.hidden = true; return; }
    v.hidden = false;
    $('#vName').textContent = it.out ? (names[it.id] || it.file.name) : it.file.name;
    var canCrop = cropAvailable();
    $('#vCrop').hidden = !canCrop;
    $('#viewSeg').hidden = !canCrop;
    if (!canCrop && view === 'crop') view = 'compare';
    setPressed('#viewSeg button', 'data-view', view);
    $('#cmpPane').hidden = view !== 'compare';
    $('#cropPane').hidden = view !== 'crop';
    if (view === 'compare') renderCompare(it); else renderCrop(it);
  }

  function renderCompare(it) {
    var my = ++viewerToken, o = it.out;
    if (!o || it.status !== 'done') {
      $('#cmpInfo').textContent = it.status === 'error' ? t(it.error || 'err_open') : t('st_working');
      return;
    }
    var cmp = $('#cmp'), img = $('#cmpAfter');
    var zoom = $('#zoom1').checked;
    cmp.style.aspectRatio = o.w + ' / ' + o.h;
    cmp.style.width = zoom ? o.w + 'px' : 'min(100%, calc(68vh * ' + (o.w / o.h).toFixed(4) + '))';
    if (img.getAttribute('src') !== o.url) img.src = o.url;
    img.alt = t('after');
    applyCmpPos();
    var info = t('cmp_info', { before: fmtBytes(it.file.size), after: fmtBytes(o.size) });
    if (o.q != null) info += ' · ' + t('quality_label') + ' ' + EDU.fmt(Math.round(o.q * 100));
    $('#cmpInfo').textContent = info;
    /* "before" = the same framing, drawn without compression or watermark */
    renderCanvas(it, { noWatermark: true, format: o.fmt === 'jpg' ? 'jpg' : 'png' }).then(function (r) {
      if (my !== viewerToken) { free(r.canvas); return; }
      var bc = $('#cmpBefore');
      bc.width = r.canvas.width; bc.height = r.canvas.height;
      bc.getContext('2d').drawImage(r.canvas, 0, 0);
      free(r.canvas);
    }, function () { });
  }
  function applyCmpPos() {
    $('#cmpAfter').style.clipPath = 'inset(0 0 0 ' + cmpPos + '%)';
    $('#cmpLine').style.insetInlineStart = cmpPos + '%';
    $('#cmpLine').style.left = cmpPos + '%';
    $('#cmpRange').value = cmpPos;
  }

  function renderCrop(it) {
    var my = ++viewerToken;
    var draw = function () {
      if (my !== viewerToken) return;
      var img = $('#cropImg');
      if (img.getAttribute('src') !== it.srcThumbUrl) img.src = it.srcThumbUrl;
      img.alt = it.file.name;
      positionFrame(it);
    };
    if (it.srcThumbUrl) return draw();
    if (!it.ow) return;
    var k = Math.min(1, 720 / Math.max(it.ow, it.oh));
    decode(it, k).then(function (d) {
      var c = canvas(it.ow * k, it.oh * k);
      drawHQ(c.getContext('2d'), d.src, 0, 0, d.w, d.h, 0, 0, c.width, c.height);
      d.close();
      return toBlob(c, 'image/jpeg', 0.85).then(function (b) { free(c); if (b) it.srcThumbUrl = URL.createObjectURL(b); draw(); });
    }, function () { });
  }
  function currentCrop(it) {
    var T = targetFor(it.ow, it.oh), g = geometry(it, T);
    return g.crop || { x: 0, y: 0, w: 1, h: 1 };
  }
  function positionFrame(it, crop) {
    crop = crop || currentCrop(it);
    var f = $('#cropFrame');
    f.style.insetInlineStart = (crop.x * 100) + '%'; f.style.left = (crop.x * 100) + '%';
    f.style.top = (crop.y * 100) + '%';
    f.style.width = (crop.w * 100) + '%'; f.style.height = (crop.h * 100) + '%';
  }
  function setFocusFromCrop(it, crop, all) {
    var focus = { x: crop.x + crop.w / 2, y: crop.y + crop.h / 2 };
    (all ? items : [it]).forEach(function (x) { x.focus = { x: focus.x, y: focus.y }; x.v++; x.dirty = true; });
    kick(150);
  }
  function bindViewer() {
    EDU.$$('#viewSeg button').forEach(function (b) { b.addEventListener('click', function () { view = b.getAttribute('data-view'); refreshViewer(); }); });
    $('#cmpRange').addEventListener('input', function () { cmpPos = +this.value; applyCmpPos(); });
    $('#zoom1').addEventListener('change', function () { var it = selected(); if (it) renderCompare(it); });
    var cmp = $('#cmp'), dragging = false;
    function fromPointer(e) {
      var r = cmp.getBoundingClientRect();
      cmpPos = EDU.clamp((e.clientX - r.left) / r.width * 100, 0, 100);
      applyCmpPos();
    }
    cmp.addEventListener('pointerdown', function (e) { dragging = true; try { cmp.setPointerCapture(e.pointerId); } catch (er) { } fromPointer(e); });
    cmp.addEventListener('pointermove', function (e) { if (dragging) fromPointer(e); });
    cmp.addEventListener('pointerup', function () { dragging = false; });
    cmp.addEventListener('pointercancel', function () { dragging = false; });

    var frame = $('#cropFrame'), box = $('#crop'), drag = null;
    function commit(crop, all) { var it = selected(); if (it) setFocusFromCrop(it, crop, all); }
    frame.addEventListener('pointerdown', function (e) {
      var it = selected(); if (!it) return;
      e.preventDefault(); e.stopPropagation();
      drag = { x: e.clientX, y: e.clientY, crop: currentCrop(it), rect: box.getBoundingClientRect() };
      try { frame.setPointerCapture(e.pointerId); } catch (er) { }
    });
    frame.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var c = drag.crop;
      var nx = EDU.clamp(c.x + (e.clientX - drag.x) / drag.rect.width, 0, 1 - c.w);
      var ny = EDU.clamp(c.y + (e.clientY - drag.y) / drag.rect.height, 0, 1 - c.h);
      drag.now = { x: nx, y: ny, w: c.w, h: c.h };
      positionFrame(null, drag.now);
    });
    function endDrag() { if (drag && drag.now) commit(drag.now); drag = null; }
    frame.addEventListener('pointerup', endDrag);
    frame.addEventListener('pointercancel', endDrag);
    box.addEventListener('pointerdown', function (e) {
      if (e.target === frame) return;
      var it = selected(); if (!it) return;
      var r = box.getBoundingClientRect(), c = currentCrop(it);
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      var now = { x: EDU.clamp(px - c.w / 2, 0, 1 - c.w), y: EDU.clamp(py - c.h / 2, 0, 1 - c.h), w: c.w, h: c.h };
      positionFrame(null, now); commit(now);
    });
    frame.addEventListener('keydown', function (e) {
      var it = selected(); if (!it) return;
      var d = e.shiftKey ? 0.1 : 0.02, c = currentCrop(it), dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -d; else if (e.key === 'ArrowRight') dx = d; else if (e.key === 'ArrowUp') dy = -d; else if (e.key === 'ArrowDown') dy = d; else return;
      e.preventDefault();
      var now = { x: EDU.clamp(c.x + dx, 0, 1 - c.w), y: EDU.clamp(c.y + dy, 0, 1 - c.h), w: c.w, h: c.h };
      positionFrame(null, now);
      it.focus = { x: now.x + now.w / 2, y: now.y + now.h / 2 }; it.v++; it.dirty = true; kick(400);
    });
    $('#cropCenter').addEventListener('click', function () { var it = selected(); if (!it) return; it.focus = null; it.v++; it.dirty = true; positionFrame(it); kick(0); });
    $('#cropAll').addEventListener('click', function () { var it = selected(); if (!it) return; commit(currentCrop(it), true); EDU.toast(t('crop_all_done', { n: EDU.fmt(items.length) })); });
  }

  /* ================================================================ downloads */
  var CRC_TABLE = (function () {
    var tb = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; tb[n] = c >>> 0; }
    return tb;
  })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  /* A plain "stored" ZIP (photos are already compressed, so no deflate needed). UTF-8 names. Works offline. */
  function makeZip(files) {
    var enc = new TextEncoder(), d = new Date();
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    var parts = [], central = [], offset = 0, cdSize = 0;
    return files.reduce(function (p, f) {
      return p.then(function () { return f.blob.arrayBuffer(); }).then(function (ab) {
        var data = new Uint8Array(ab), crc = crc32(data), nm = enc.encode(f.name);
        var lh = new DataView(new ArrayBuffer(30));
        lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
        lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true);
        lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
        parts.push(lh.buffer, nm, f.blob);
        var ch = new DataView(new ArrayBuffer(46));
        ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
        ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true);
        ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nm.length, true);
        ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
        central.push(ch.buffer, nm);
        offset += 30 + nm.length + data.length; cdSize += 46 + nm.length;
      });
    }, Promise.resolve()).then(function () {
      var end = new DataView(new ArrayBuffer(22));
      end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
      end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
      return new Blob(parts.concat(central, [end.buffer]), { type: 'application/zip' });
    });
  }
  function outFiles() {
    var nm = fileNames();
    return doneItems().map(function (it) { return { name: nm[it.id], blob: it.out.blob, type: it.out.blob.type }; });
  }
  function downloadZip() {
    var files = outFiles();
    if (!files.length) return;
    $('#zipBtn').disabled = true;
    makeZip(files).then(function (zip) {
      EDU.download('photos_' + preset().id + '_' + today() + '.zip', zip);
      EDU.toast(t('zip_ready', { n: EDU.fmt(files.length) }));
    }, function () { EDU.toast(t('zip_failed')); }).then(function () { renderSummary(); });
  }
  function downloadEach() {
    var files = outFiles(), i = 0;
    if (files.length > 1) EDU.toast(t('each_hint'));
    (function next() {
      if (i >= files.length) return;
      var f = files[i++];
      EDU.download(f.name, f.blob);
      setTimeout(next, 450);
    })();
  }
  function canShareFiles() {
    try { return !!(navigator.canShare && window.File && navigator.canShare({ files: [new File(['x'], 'x.jpg', { type: 'image/jpeg' })] })); } catch (e) { return false; }
  }
  function shareFiles() {
    var files = outFiles().map(function (f) { return new File([f.blob], f.name, { type: f.type }); });
    if (!files.length) return;
    var data = { files: files };
    if (!navigator.canShare(data)) { EDU.toast(t('share_failed')); return; }
    navigator.share(data).catch(function (e) { if (e && e.name !== 'AbortError') EDU.toast(t('share_failed')); });
  }

  /* ================================================================ drop / paste / keys */
  function bindInput() {
    var input = $('#fileInput'), drop = $('#drop');
    $('#pickBtn').addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });
    drop.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === drop) { e.preventDefault(); input.click(); } });
    $('#sampleBtn').addEventListener('click', makeSamples);
    var depth = 0;
    document.addEventListener('dragenter', function (e) { if (hasFiles(e)) { depth++; drop.classList.add('over'); } });
    document.addEventListener('dragleave', function () { depth = Math.max(0, depth - 1); if (!depth) drop.classList.remove('over'); });
    document.addEventListener('dragover', function (e) { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
    document.addEventListener('drop', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault(); depth = 0; drop.classList.remove('over');
      addFiles(e.dataTransfer.files);
    });
    function hasFiles(e) { var dt = e.dataTransfer; return dt && Array.prototype.indexOf.call(dt.types || [], 'Files') >= 0; }
    document.addEventListener('paste', function (e) {
      var tgt = e.target;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA')) return;
      var cd = e.clipboardData; if (!cd) return;
      var files = [];
      Array.prototype.forEach.call(cd.items || [], function (x) {
        if (x.kind === 'file') { var f = x.getAsFile(); if (f && /^image\//.test(f.type)) files.push(f); }
      });
      if (!files.length) return;
      e.preventDefault();
      var n = 0;
      addFiles(files.map(function (f) {
        var ext = (f.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
        return f.name && f.name !== 'image.png' ? f : new File([f], 'pasted_' + (++n) + '.' + ext, { type: f.type });
      }));
    });
    $('#heicRetry').addEventListener('click', function () {
      items.forEach(function (it) { if (it.status === 'error' && it.info.type === 'heic') { it.retry = true; it.dirty = true; it.status = 'queued'; updateItem(it); } });
      kick(0);
    });
    $('#zipBtn').addEventListener('click', downloadZip);
    $('#mbarZip').addEventListener('click', downloadZip);
    $('#eachBtn').addEventListener('click', downloadEach);
    $('#shareBtn').addEventListener('click', shareFiles);
    $('#clearBtn').addEventListener('click', function () { if (confirm(t('confirm_clear'))) clearAll(); });
  }

  /* ================================================================ encoder support */
  function detectSupport() {
    var c = canvas(2, 2);
    return Promise.all([toBlob(c, 'image/webp', 0.8), toBlob(c, 'image/avif', 0.8)]).then(function (r) {
      support.webp = !!(r[0] && r[0].type === 'image/webp');
      support.avif = !!(r[1] && r[1].type === 'image/avif');
    });
  }

  /* ================================================================ language / start */
  function renderAll() {
    renderPresets();
    buildPosGrid();
    renderSettings();
    setHeicBox(heicState);
    items.forEach(function (it) { updateItem(it); });
    renderNames();
    renderSummary();
    refreshViewer();
  }

  bindSettings();
  bindViewer();
  bindInput();
  $('#shareBtn').hidden = !canShareFiles();
  renderAll();
  EDU.onLang(renderAll);
  Promise.all([detectSupport(), restoreLogo()]).then(function () { renderSettings(); if (items.length) invalidateAll(0); });
})();
