/* Social Post Resizer: one photo or poster → every social-media size (Instagram, YouTube, WhatsApp,
   Facebook, LinkedIn, X, Google Business). Per size: drag to reposition, wheel / pinch / keys to zoom,
   "fit" (blurred or solid background) or "fill" (crop), safe-area overlays, optional caption band and
   logo corner. Exports PNG or JPG at the exact preset pixels, one file at a time.
   Everything runs in this browser tab: the picture is never uploaded and never stored. */
(function () {
  'use strict';
  var SLUG = 'social-post-resizer';
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, el = EDU.el;
  var MAX_SIDE = 3200, MAX_AREA = 12e6, MAX_FILE_MB = 80, BG_MAX = 1600;
  var app = document.getElementById('app');

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ------------------------------------------------------------ presets
     safe: bands [top, bottom] px covered by app buttons · rect [x, y, w, h] the only area seen on every device
           circle: shown as a round picture · avoid [[fx, fy, fw, fh], …] covered by a badge or profile photo */
  var PLATFORMS = [
    { id: 'instagram', presets: [
      { id: 'ig_square', file: 'instagram_post', w: 1080, h: 1080 },
      { id: 'ig_portrait', file: 'instagram_portrait', w: 1080, h: 1350 },
      { id: 'ig_landscape', file: 'instagram_landscape', w: 1080, h: 566 },
      { id: 'ig_story', file: 'instagram_story', w: 1080, h: 1920, safe: { bands: [250, 340] } },
      { id: 'ig_dp', file: 'instagram_profile', w: 320, h: 320, safe: { circle: true } }
    ] },
    { id: 'youtube', presets: [
      { id: 'yt_thumb', file: 'youtube_thumbnail', w: 1280, h: 720, safe: { avoid: [[0.8, 0.84, 0.2, 0.16]] } },
      { id: 'yt_shorts', file: 'youtube_shorts', w: 1080, h: 1920, safe: { bands: [200, 480] } },
      { id: 'yt_banner', file: 'youtube_banner', w: 2560, h: 1440, safe: { rect: [507, 508, 1546, 423] } },
      { id: 'yt_dp', file: 'youtube_profile', w: 800, h: 800, safe: { circle: true } }
    ] },
    { id: 'whatsapp', presets: [
      { id: 'wa_dp', file: 'whatsapp_dp', w: 640, h: 640, safe: { circle: true } },
      { id: 'wa_status', file: 'whatsapp_status', w: 1080, h: 1920, safe: { bands: [200, 300] } }
    ] },
    { id: 'facebook', presets: [
      { id: 'fb_post', file: 'facebook_post', w: 1200, h: 630 },
      { id: 'fb_square', file: 'facebook_square', w: 1080, h: 1080 },
      { id: 'fb_cover', file: 'facebook_cover', w: 820, h: 312, safe: { rect: [90, 0, 640, 312] } },
      { id: 'fb_story', file: 'facebook_story', w: 1080, h: 1920, safe: { bands: [250, 340] } }
    ] },
    { id: 'linkedin', presets: [
      { id: 'li_post', file: 'linkedin_post', w: 1200, h: 627 },
      { id: 'li_banner', file: 'linkedin_banner', w: 1584, h: 396, safe: { avoid: [[0.02, 0.4, 0.26, 0.6]] } }
    ] },
    { id: 'x', presets: [
      { id: 'x_post', file: 'x_post', w: 1600, h: 900 },
      { id: 'x_header', file: 'x_header', w: 1500, h: 500, safe: { avoid: [[0.04, 0.52, 0.19, 0.48]] } }
    ] },
    { id: 'google', presets: [
      { id: 'gb_photo', file: 'google_business_photo', w: 1200, h: 900 },
      { id: 'gb_cover', file: 'google_business_cover', w: 1024, h: 576 }
    ] },
    { id: 'custom', presets: [{ id: 'custom', file: 'custom', w: 1200, h: 1200 }] }
  ];
  var PRESETS = {};
  PLATFORMS.forEach(function (pf) { pf.presets.forEach(function (p) { p.pf = pf.id; PRESETS[p.id] = p; }); });

  /* ------------------------------------------------------------ saved settings (never the picture) */
  function defaults() {
    return {
      pf: 'instagram', active: 'ig_square',
      on: { ig_square: 1, ig_portrait: 1, ig_story: 1, yt_thumb: 1, wa_dp: 1 },
      fmt: 'jpg', quality: 90, bg: 'blur', bgColor: '#0b4f5c', safe: true,
      cap: { on: false, text: '', pos: 'bottom', style: 'dark' },
      logo: { corner: 'br', size: 14, data: '' },
      custom: { w: 1200, h: 1200 }
    };
  }
  var S = (function () {
    var d = defaults(), s = store.get('s', null);
    if (!s || typeof s !== 'object') return d;
    Object.keys(d).forEach(function (k) {
      if (s[k] === undefined) return;
      if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) Object.keys(s[k] || {}).forEach(function (j) { if (k === 'on' || j in d[k]) d[k][j] = s[k][j]; });
      else d[k] = s[k];
    });
    if (!PRESETS[d.active]) d.active = 'ig_square';
    if (!PLATFORMS.some(function (p) { return p.id === d.pf; })) d.pf = PRESETS[d.active].pf;
    d.custom.w = EDU.clamp(Math.round(+d.custom.w) || 1200, 16, 4096); d.custom.h = EDU.clamp(Math.round(+d.custom.h) || 1200, 16, 4096);
    d.quality = EDU.clamp(Math.round(+d.quality) || 90, 50, 100);
    return d;
  })();
  function save() { store.set('s', S); }

  /* ------------------------------------------------------------ canvas helpers */
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function free(c) { if (c) { c.width = 1; c.height = 1; } }
  function hq(x) { x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; }
  function FONT() { return (getComputedStyle(document.body).fontFamily || '') + ', "Noto Sans", "Nirmala UI", Arial, sans-serif'; }
  function toBlob(c, type, q) {
    return new Promise(function (res) {
      try { c.toBlob(function (b) { res(b); }, type, q); } catch (e) { res(null); }
    });
  }
  function hexLum(hex) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
    if (!m) return 0;
    return (0.2126 * parseInt(m[1], 16) + 0.7152 * parseInt(m[2], 16) + 0.0722 * parseInt(m[3], 16)) / 255;
  }

  /* ------------------------------------------------------------ picture state */
  var img = null;          /* { c: canvas, w, h, name, alpha, avg, sample, id } */
  var logo = null;         /* { c: canvas, w, h } */
  var views = {};          /* per preset: { mode, zoom, cx, cy } */
  var bgCache = null;      /* { key, c } blurred background for the active size */
  var imgSeq = 0;

  function dims(p) { return p.id === 'custom' ? { w: S.custom.w, h: S.custom.h } : { w: p.w, h: p.h }; }
  function active() { return PRESETS[S.active] || PRESETS.ig_square; }
  function defaultMode(d) {
    if (!img) return 'fill';
    var r = (d.w / d.h) / (img.w / img.h); if (r < 1) r = 1 / r;
    return r > 1.35 ? 'fit' : 'fill';      /* very different shapes: show the whole poster on a blurred background */
  }
  function viewFor(p) {
    if (!views[p.id]) views[p.id] = { mode: defaultMode(dims(p)), zoom: 1, cx: 0.5, cy: 0.5 };
    return views[p.id];
  }
  function baseScale(W, H, v) { return v.mode === 'fill' ? Math.max(W / img.w, H / img.h) : Math.min(W / img.w, H / img.h); }
  /* Where the picture sits inside a W × H frame; clamps so a bigger picture always covers the frame
     and a smaller one is centred, then writes the normalised centre back into the view. */
  function layout(W, H, v) {
    var s = baseScale(W, H, v) * v.zoom, dw = img.w * s, dh = img.h * s;
    var dx = W / 2 - v.cx * dw, dy = H / 2 - v.cy * dh;
    dx = dw >= W - 0.5 ? EDU.clamp(dx, W - dw, 0) : (W - dw) / 2;
    dy = dh >= H - 0.5 ? EDU.clamp(dy, H - dh, 0) : (H - dh) / 2;
    v.cx = (W / 2 - dx) / dw; v.cy = (H / 2 - dy) / dh;
    return { s: s, dx: dx, dy: dy, dw: dw, dh: dh, covered: dx <= 0.01 && dy <= 0.01 && dx + dw >= W - 0.01 && dy + dh >= H - 0.01 };
  }

  /* ------------------------------------------------------------ drawing (output coordinates; k = px per output px) */
  function bgColour() {
    if (S.bg === 'white') return '#ffffff';
    if (S.bg === 'black') return '#000000';
    if (S.bg === 'custom') return S.bgColor || '#0b4f5c';
    return (img && img.avg) || '#777777';
  }
  function blurredBg(W, H) {
    var key = W + 'x' + H + '|' + (img ? img.id : 0);
    if (bgCache && bgCache.key === key) return bgCache.c;
    if (bgCache) free(bgCache.c);
    var f = Math.min(1, BG_MAX / Math.max(W, H)), bw = Math.max(2, Math.round(W * f)), bh = Math.max(2, Math.round(H * f));
    var sm = canvas(Math.max(2, bw / 8), Math.max(2, bh / 8)), sx = sm.getContext('2d');
    var cover = Math.max(sm.width / img.w, sm.height / img.h), cw = img.w * cover, ch = img.h * cover;
    hq(sx); sx.drawImage(img.c, (sm.width - cw) / 2, (sm.height - ch) / 2, cw, ch);
    var c = canvas(bw, bh), x = c.getContext('2d'), pad = Math.round(bw / 10);
    hq(x);
    try { x.filter = 'blur(' + Math.max(4, Math.round(bw / 45)) + 'px)'; } catch (e) { }
    x.drawImage(sm, -pad, -pad, bw + 2 * pad, bh + 2 * pad);
    try { x.filter = 'none'; } catch (e) { }
    x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, 0, bw, bh);
    free(sm);
    bgCache = { key: key, c: c };
    return c;
  }
  function drawBackground(x, W, H, L) {
    if (L.covered && !img.alpha) return;
    if (S.bg === 'blur') { hq(x); x.drawImage(blurredBg(W, H), 0, 0, W, H); }
    else { x.fillStyle = bgColour(); x.fillRect(0, 0, W, H); }
  }
  function captionBand(W, H) { return S.cap.on && (S.cap.text || '').trim() ? EDU.clamp(Math.round(Math.min(W, H) * 0.12), 36, 300) : 0; }
  function drawCaption(x, W, H) {
    var text = (S.cap.text || '').trim(), bh = captionBand(W, H); if (!bh) return;
    var y = S.cap.pos === 'top' ? 0 : H - bh;
    var fill = S.cap.style === 'dark' ? 'rgba(0,0,0,0.62)' : S.cap.style === 'light' ? 'rgba(255,255,255,0.9)' : (S.bgColor || '#0b4f5c');
    var ink = S.cap.style === 'dark' ? '#ffffff' : S.cap.style === 'light' ? '#111111' : (hexLum(S.bgColor) > 0.6 ? '#111111' : '#ffffff');
    x.save();
    x.fillStyle = fill; x.fillRect(0, y, W, bh);
    var fs = bh * 0.46, maxW = W - bh * 0.7;
    do { x.font = '700 ' + fs.toFixed(1) + 'px ' + FONT(); fs *= 0.94; } while (x.measureText(text).width > maxW && fs > bh * 0.16);
    x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, W / 2, y + bh / 2 + bh * 0.02, maxW);
    x.restore();
  }
  function drawLogo(x, W, H) {
    if (!logo) return;
    var m = Math.min(W, H), size = m * S.logo.size / 100, pad = m * 0.03, ar = logo.w / logo.h;
    var lw = ar >= 1 ? size : size * ar, lh = ar >= 1 ? size / ar : size;
    var band = captionBand(W, H), top = S.logo.corner.charAt(0) === 't';   /* the logo moves off the caption band */
    var lx = S.logo.corner.charAt(1) === 'r' ? W - pad - lw : pad;
    var ly = top ? pad + (S.cap.pos === 'top' ? band : 0) : H - pad - lh - (S.cap.pos === 'bottom' ? band : 0);
    hq(x); x.drawImage(logo.c, lx, ly, lw, lh);
  }
  function render(x, W, H, k, v) {
    x.save();
    x.setTransform(k, 0, 0, k, 0, 0);
    var L = layout(W, H, v);
    drawBackground(x, W, H, L);
    hq(x); x.drawImage(img.c, L.dx, L.dy, L.dw, L.dh);
    if (S.cap.on) drawCaption(x, W, H);
    drawLogo(x, W, H);
    x.restore();
    return L;
  }
  /* preview only: the parts of the frame that apps cover or cut off */
  function drawSafe(x, W, H, p, k) {
    var sf = p.safe; if (!sf) return;
    x.save(); x.setTransform(k, 0, 0, k, 0, 0);
    x.fillStyle = 'rgba(10,14,18,0.5)'; x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 2 / k; x.setLineDash([10 / k, 7 / k]);
    if (sf.bands) {
      x.fillRect(0, 0, W, sf.bands[0]); x.fillRect(0, H - sf.bands[1], W, sf.bands[1]);
      x.beginPath(); x.moveTo(0, sf.bands[0]); x.lineTo(W, sf.bands[0]); x.moveTo(0, H - sf.bands[1]); x.lineTo(W, H - sf.bands[1]); x.stroke();
    }
    if (sf.rect) {
      var r = sf.rect;
      x.beginPath(); x.rect(0, 0, W, H); x.rect(r[0], r[1], r[2], r[3]); x.fill('evenodd');
      x.strokeRect(r[0], r[1], r[2], r[3]);
    }
    if (sf.circle) {
      x.beginPath(); x.rect(0, 0, W, H); x.arc(W / 2, H / 2, Math.min(W, H) / 2, 0, Math.PI * 2); x.fill('evenodd');
      x.beginPath(); x.arc(W / 2, H / 2, Math.min(W, H) / 2 - 1 / k, 0, Math.PI * 2); x.stroke();
    }
    if (sf.avoid) sf.avoid.forEach(function (a) {
      var ax = a[0] * W, ay = a[1] * H, aw = a[2] * W, ah = a[3] * H;
      x.fillRect(ax, ay, aw, ah); x.strokeRect(ax, ay, aw, ah);
    });
    x.restore();
  }

  /* ------------------------------------------------------------ decoding (EXIF orientation applied, huge photos scaled down) */
  function probe(blob) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { res({ img: im, w: im.naturalWidth, h: im.naturalHeight, url: url }); };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('decode')); };
      im.src = url;
    });
  }
  function decode(blob) {
    return probe(blob).then(function (p) {
      if (!p.w || !p.h) { URL.revokeObjectURL(p.url); throw new Error('empty'); }
      var s = Math.min(1, MAX_SIDE / Math.max(p.w, p.h), Math.sqrt(MAX_AREA / (p.w * p.h)));
      var W = Math.max(1, Math.round(p.w * s)), H = Math.max(1, Math.round(p.h * s));
      var viaElement = function () { return p.img; };
      var src = (typeof createImageBitmap === 'function')
        ? createImageBitmap(blob, s < 1 ? { imageOrientation: 'from-image', resizeWidth: W, resizeHeight: H, resizeQuality: 'high' } : { imageOrientation: 'from-image' })
          .then(function (bm) {
            if ((bm.width > bm.height) !== (W > H) && Math.abs(bm.width - bm.height) > 2) { if (bm.close) bm.close(); return viaElement(); }
            return bm;
          }).catch(viaElement)
        : Promise.resolve(viaElement());
      return src.then(function (source) {
        var c = canvas(W, H), x = c.getContext('2d');
        hq(x); x.drawImage(source, 0, 0, W, H);
        if (source.close) source.close();
        URL.revokeObjectURL(p.url);
        return { c: c, srcW: p.w, srcH: p.h, scaled: s < 1 };
      });
    });
  }
  function sniff(file) {
    var part = file.slice(0, 64);
    var read = part.arrayBuffer ? part.arrayBuffer() : new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsArrayBuffer(part); });
    return read.then(function (ab) {
      var b = new Uint8Array(ab), ascii = function (o, n) { var s = ''; for (var i = o; i < o + n && i < b.length; i++) s += String.fromCharCode(b[i]); return s; };
      if (ascii(4, 4) === 'ftyp') {
        var brands = [ascii(8, 4)]; for (var i = 16; i + 4 <= Math.min(b.length, 64); i += 4) brands.push(ascii(i, 4));
        if (brands.some(function (x) { return /^(heic|heix|hevc|hevx|heim|heis|hevm|hevs|mif1|msf1)$/.test(x); })) return 'heic';
      }
      return 'other';
    }).catch(function () { return 'other'; });
  }
  /* alpha present? average edge colour? (sampled, so a 10 MP picture stays quick) */
  function inspect(c) {
    var out = { alpha: false, avg: '#777777' };
    try {
      var f = Math.min(1, 160 / Math.max(c.width, c.height)), w = Math.max(2, Math.round(c.width * f)), h = Math.max(2, Math.round(c.height * f));
      var sm = canvas(w, h), x = sm.getContext('2d');
      x.drawImage(c, 0, 0, w, h);
      var d = x.getImageData(0, 0, w, h).data, r = 0, g = 0, bl = 0, n = 0;
      for (var y = 0; y < h; y++) for (var i = 0; i < w; i++) {
        var o = (y * w + i) * 4;
        if (d[o + 3] < 250) out.alpha = true;
        if (y < h * 0.08 || y > h * 0.92 || i < w * 0.08 || i > w * 0.92) { r += d[o]; g += d[o + 1]; bl += d[o + 2]; n++; }
      }
      if (n) out.avg = '#' + [r / n, g / n, bl / n].map(function (v) { return ('0' + Math.round(v * 0.85).toString(16)).slice(-2); }).join('');
      free(sm);
    } catch (e) { }
    return out;
  }

  /* ------------------------------------------------------------ the picture */
  function setImage(c, meta) {
    meta = meta || {};
    if (img && img.c !== c) free(img.c);
    var info = inspect(c);
    img = { c: c, w: c.width, h: c.height, name: meta.name || '', alpha: info.alpha, avg: info.avg, sample: !!meta.sample, id: ++imgSeq, srcW: meta.srcW || c.width, srcH: meta.srcH || c.height, scaled: !!meta.scaled };
    views = {}; bgCache = null;
    app.dataset.w = img.w; app.dataset.h = img.h; app.dataset.sample = img.sample ? '1' : '0';
    $('#autoSw').style.background = img.avg;
    showLoadInfo();
    showError(null);
    syncControls();
    sizePreview();
    draw();
    scheduleEstimate();
  }
  /* pixel sizes as plain digits inside a left-to-right isolate, so "3000 × 4000 px" reads correctly in Urdu */
  function ltr(s) { return '⁦' + s + '⁩'; }
  function showLoadInfo() {
    if (!img) return;
    $('#loadInfo').textContent = img.sample ? t('loaded_sample') :
      t('loaded_info', { name: ltr(img.name || t('picture')), w: ltr(String(img.srcW)), h: ltr(String(img.srcH)) }) + (img.scaled ? ' ' + t('loaded_scaled', { w: ltr(String(img.w)), h: ltr(String(img.h)) }) : '');
  }
  function showError(key) {
    var box = $('#loadErr');
    box.hidden = !key;
    if (!key) return;
    $('#errMsg').textContent = t(key);
    var link = $('#heicLink');
    link.hidden = key !== 'err_heic';
    link.href = '../image-compressor/?lang=' + EDU.lang;
  }
  function busy(on) { app.dataset.busy = on ? '1' : '0'; }

  var loadSeq = 0;   /* a second file picked while the first still decodes: only the last pick is shown */
  function loadFile(file) {
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) { showError('too_big'); return; }
    var seq = ++loadSeq;
    busy(true);
    $('#loadInfo').textContent = t('loading');
    sniff(file).then(function (kind) {
      if (kind === 'heic') throw new Error('heic');
      return decode(file);
    }).then(function (d) {
      if (seq !== loadSeq) { free(d.c); return; }
      setImage(d.c, { name: (file.name || '').replace(/\.[^.]+$/, ''), srcW: d.srcW, srcH: d.srcH, scaled: d.scaled });
    }).catch(function (e) {
      if (seq !== loadSeq) return;
      showLoadInfo();
      showError(e && e.message === 'heic' || /\.hei[cf]$/i.test(file.name || '') ? 'err_heic' : 'err_open');
    }).then(function () { if (seq === loadSeq) busy(false); });
  }

  /* built-in sample (drawn here, no files): a sweet-shop festival poster, 1600 × 1000 */
  function sampleCanvas() {
    var W = 1600, H = 1000, c = canvas(W, H), x = c.getContext('2d');
    var sky = x.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2b1b5e'); sky.addColorStop(0.45, '#c8416b'); sky.addColorStop(0.75, '#ff8b4a'); sky.addColorStop(1, '#ffd36b');
    x.fillStyle = sky; x.fillRect(0, 0, W, H);
    x.fillStyle = '#fff2b8'; x.beginPath(); x.arc(1180, 560, 150, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,220,150,0.35)'; x.beginPath(); x.arc(1180, 560, 210, 0, Math.PI * 2); x.fill();
    /* hills */
    x.fillStyle = '#3a1f52'; x.beginPath(); x.moveTo(0, 760);
    x.bezierCurveTo(250, 640, 500, 700, 760, 690); x.bezierCurveTo(1050, 680, 1300, 600, W, 700); x.lineTo(W, H); x.lineTo(0, H); x.fill();
    x.fillStyle = '#24123a'; x.beginPath(); x.moveTo(0, 840);
    x.bezierCurveTo(300, 790, 600, 830, 900, 800); x.bezierCurveTo(1200, 770, 1400, 820, W, 790); x.lineTo(W, H); x.lineTo(0, H); x.fill();
    /* string of lights */
    x.strokeStyle = 'rgba(255,255,255,0.45)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 120); x.quadraticCurveTo(W / 2, 260, W, 110); x.stroke();
    for (var i = 0; i <= 20; i++) {
      var tt = i / 20, lx = tt * W, ly = (1 - tt) * (1 - tt) * 120 + 2 * (1 - tt) * tt * 260 + tt * tt * 110;
      x.fillStyle = ['#ffd166', '#ff6b6b', '#5cc0cf', '#9be36a'][i % 4]; x.beginPath(); x.arc(lx, ly + 18, 11, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.8)'; x.beginPath(); x.arc(lx - 3, ly + 14, 3, 0, Math.PI * 2); x.fill();
    }
    /* plate of sweets, bottom right */
    x.fillStyle = '#b8862b'; x.beginPath(); x.ellipse(1180, 870, 300, 80, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e0ad44'; x.beginPath(); x.ellipse(1180, 860, 270, 64, 0, 0, Math.PI * 2); x.fill();
    var sweets = [[1010, 820, '#f28c28'], [1090, 800, '#f28c28'], [1170, 790, '#f28c28'], [1250, 800, '#f28c28'], [1330, 820, '#f28c28'], [1050, 860, '#f6a04d'], [1130, 850, '#f6a04d'], [1210, 850, '#f6a04d'], [1290, 860, '#f6a04d']];
    sweets.forEach(function (s) {
      x.fillStyle = s[2]; x.beginPath(); x.arc(s[0], s[1], 34, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.arc(s[0] - 10, s[1] - 12, 10, 0, Math.PI * 2); x.fill();
    });
    [[1120, 880], [1200, 890], [1280, 880]].forEach(function (p) {
      x.fillStyle = '#e8e2c8'; x.beginPath(); x.moveTo(p[0], p[1] - 24); x.lineTo(p[0] + 34, p[1]); x.lineTo(p[0], p[1] + 24); x.lineTo(p[0] - 34, p[1]); x.closePath(); x.fill();
      x.fillStyle = 'rgba(200,200,200,0.9)'; x.fillRect(p[0] - 10, p[1] - 4, 20, 8);
    });
    /* text */
    x.textBaseline = 'alphabetic'; x.textAlign = 'left';
    x.fillStyle = '#ffffff'; x.shadowColor = 'rgba(0,0,0,0.35)'; x.shadowBlur = 12; x.shadowOffsetY = 4;
    fitText(x, t('sample_shop'), 90, 450, 820, 118, '800');
    x.fillStyle = '#ffe9a8';
    fitText(x, t('sample_offer'), 90, 560, 760, 70, '700');
    x.shadowColor = 'transparent';
    /* round badge */
    x.fillStyle = '#d9501c'; x.beginPath(); x.arc(1380, 230, 125, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#ffe9a8'; x.lineWidth = 8; x.setLineDash([18, 12]); x.beginPath(); x.arc(1380, 230, 105, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#fff'; x.textAlign = 'center';
    fitText(x, t('sample_off'), 1380, 255, 170, 64, '800');
    return c;
  }
  function fitText(x, text, px, py, maxW, size, weight) {
    var fs = size;
    do { x.font = weight + ' ' + fs + 'px ' + FONT(); fs -= 2; } while (x.measureText(text).width > maxW && fs > 14);
    x.fillText(text, px, py);
  }

  /* ------------------------------------------------------------ preview */
  var pv = $('#preview'), pctx = pv.getContext('2d'), stage = $('#stage');
  var k = 1, cssK = 1, raf = 0;
  function sizePreview() {
    var d = dims(active());
    var availW = Math.max(120, stage.clientWidth - 22);
    var maxH = Math.max(220, Math.min(window.innerHeight * 0.6, 620));
    var cssW = Math.min(availW, maxH * d.w / d.h), cssH = cssW * d.h / d.w;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    pv.style.width = cssW + 'px'; pv.style.height = cssH + 'px';
    pv.width = Math.max(1, Math.round(cssW * dpr)); pv.height = Math.max(1, Math.round(cssH * dpr));
    k = pv.width / d.w; cssK = cssW / d.w;
    pv.dataset.preset = S.active;
  }
  function drawNow() {
    raf = 0;
    if (!img) return;
    var p = active(), d = dims(p), v = viewFor(p);
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.clearRect(0, 0, pv.width, pv.height);
    render(pctx, d.w, d.h, k, v);
    if (S.safe) drawSafe(pctx, d.w, d.h, p, k);
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    $('#zoom').value = Math.round(v.zoom * 100);
    $('#zoomOut').textContent = Math.round(v.zoom * 100) + '%';
  }
  function draw() { if (!raf) raf = requestAnimationFrame(drawNow); }
  function changed() { draw(); scheduleEstimate(); }

  /* pointer: drag = move, two fingers = pinch zoom, wheel = zoom (about the pointer) */
  var pts = {};
  function ptsList() { return Object.keys(pts).map(function (q) { return pts[q]; }); }
  function moveBy(ddx, ddy) {
    var p = active(), d = dims(p), v = viewFor(p), L = layout(d.w, d.h, v);
    v.cx -= ddx / cssK / L.dw; v.cy -= ddy / cssK / L.dh;
    changed();
  }
  function zoomAt(factor, px, py) {
    var p = active(), d = dims(p), v = viewFor(p), L = layout(d.w, d.h, v);
    if (px === undefined) { px = d.w * cssK / 2; py = d.h * cssK / 2; }
    var ox = px / cssK, oy = py / cssK, u = (ox - L.dx) / L.s, w2 = (oy - L.dy) / L.s;
    v.zoom = EDU.clamp(v.zoom * factor, 0.5, 4);
    var s2 = baseScale(d.w, d.h, v) * v.zoom;
    v.cx = (d.w / 2 - (ox - u * s2)) / (img.w * s2); v.cy = (d.h / 2 - (oy - w2 * s2)) / (img.h * s2);
    syncZoom(v);
    changed();
  }
  function syncZoom(v) { $('#zoom').value = Math.round(v.zoom * 100); $('#zoomOut').textContent = Math.round(v.zoom * 100) + '%'; }
  pv.addEventListener('pointerdown', function (e) {
    if (!img) return;
    try { pv.setPointerCapture(e.pointerId); } catch (er) { }
    pts[e.pointerId] = { x: e.offsetX, y: e.offsetY };
    e.preventDefault();
    try { pv.focus({ preventScroll: true }); } catch (er) { }   /* so the arrow keys work right after a click */
  });
  pv.addEventListener('pointermove', function (e) {
    var p = pts[e.pointerId]; if (!p || !img) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { delete pts[e.pointerId]; return; }   /* button released outside the window */
    var list = ptsList();
    if (list.length === 1) { moveBy(e.offsetX - p.x, e.offsetY - p.y); p.x = e.offsetX; p.y = e.offsetY; }
    else if (list.length === 2) {
      var other = list[0] === p ? list[1] : list[0];
      var d0 = Math.hypot(p.x - other.x, p.y - other.y), d1 = Math.hypot(e.offsetX - other.x, e.offsetY - other.y);
      var mx = (e.offsetX + other.x) / 2, my = (e.offsetY + other.y) / 2;
      p.x = e.offsetX; p.y = e.offsetY;
      if (d0 > 4 && d1 > 4) zoomAt(d1 / d0, mx, my);
    }
  });
  function endPtr(e) { delete pts[e.pointerId]; }
  pv.addEventListener('pointerup', endPtr); pv.addEventListener('pointercancel', endPtr); pv.addEventListener('lostpointercapture', endPtr);
  pv.addEventListener('wheel', function (e) {
    if (!img) return;
    e.preventDefault();
    zoomAt(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016)), e.offsetX, e.offsetY);
  }, { passive: false });
  pv.addEventListener('keydown', function (e) {
    if (!img) return;
    var d = dims(active()), step = (e.shiftKey ? 0.1 : 0.02), kx = d.w * cssK * step, ky = d.h * cssK * step, key = e.key;
    if (key === 'ArrowLeft') moveBy(-kx, 0); else if (key === 'ArrowRight') moveBy(kx, 0);
    else if (key === 'ArrowUp') moveBy(0, -ky); else if (key === 'ArrowDown') moveBy(0, ky);
    else if (key === '+' || key === '=') zoomAt(1.1); else if (key === '-' || key === '_') zoomAt(1 / 1.1);
    else if (key === '0') resetView();
    else if (key === 'f' || key === 'F') setMode(viewFor(active()).mode === 'fit' ? 'fill' : 'fit');
    else return;
    e.preventDefault();
  });
  function resetView() { var v = viewFor(active()); v.zoom = 1; v.cx = 0.5; v.cy = 0.5; syncZoom(v); changed(); }
  function setMode(m) { var v = viewFor(active()); v.mode = m; v.zoom = 1; v.cx = 0.5; v.cy = 0.5; syncControls(); changed(); }
  window.addEventListener('resize', function () { if (!img) return; sizePreview(); draw(); });

  /* ------------------------------------------------------------ sizes UI */
  function shapeIcon(d, circle) {
    var ar = d.w / d.h, w = ar >= 1 ? 24 : Math.max(8, Math.round(24 * ar)), h = ar >= 1 ? Math.max(6, Math.round(24 / ar)) : 24;
    return el('span', { class: 'spr-shape', 'aria-hidden': 'true' }, el('i', { class: circle ? 'circle' : '', style: { width: w + 'px', height: h + 'px' } }));
  }
  function buildPlatforms() {
    var seg = $('#pfSeg'); seg.innerHTML = '';
    PLATFORMS.forEach(function (pf) {
      seg.appendChild(el('button', { type: 'button', role: 'tab', id: 'pf-' + pf.id, 'aria-selected': String(pf.id === S.pf), 'aria-pressed': String(pf.id === S.pf), text: t('pf_' + pf.id), onclick: function () { S.pf = pf.id; save(); buildPlatforms(); buildPresets(); } }));
    });
  }
  function buildPresets() {
    var grid = $('#presetGrid'); grid.innerHTML = '';
    var pf = PLATFORMS.filter(function (p) { return p.id === S.pf; })[0] || PLATFORMS[0];
    pf.presets.forEach(function (p) {
      var d = dims(p), name = t('p_' + p.id);
      var cb = el('input', { type: 'checkbox', id: 'on-' + p.id, 'aria-label': t('tick_aria', { name: name }) });
      cb.checked = !!S.on[p.id];
      cb.addEventListener('change', function () { S.on[p.id] = cb.checked ? 1 : 0; save(); syncExport(); });
      var btn = el('button', { type: 'button', id: 'preset-' + p.id, 'aria-pressed': String(p.id === S.active), onclick: function () { selectPreset(p.id); } },
        shapeIcon(d, p.safe && p.safe.circle),
        el('span', { class: 'spr-ptxt' }, el('span', { class: 'spr-plab', text: name }), el('span', { class: 'spr-pdim spr-dim', text: d.w + ' × ' + d.h })));
      grid.appendChild(el('div', { class: 'spr-preset' + (p.id === S.active ? ' active' : ''), dataset: { id: p.id } }, el('label', { for: 'on-' + p.id }, cb), btn));
    });
    $('#customBox').hidden = pf.id !== 'custom';
    $('#customW').value = S.custom.w; $('#customH').value = S.custom.h;
    syncExport();
  }
  function selectPreset(id) {
    if (!PRESETS[id]) return;
    S.active = id; save();
    $$('#presetGrid .spr-preset').forEach(function (n) { var on = n.dataset.id === id; n.classList.toggle('active', on); n.querySelector('button').setAttribute('aria-pressed', String(on)); });
    syncControls();
    if (img) { sizePreview(); changed(); }
  }
  function syncControls() {
    var p = active(), d = dims(p);
    $('#activeName').textContent = t('p_' + p.id);
    $('#activeDim').textContent = d.w + ' × ' + d.h;
    var sf = p.safe, hint = '';
    if (sf) hint = sf.bands ? t('safe_hint_bands') : sf.rect ? t('safe_hint_rect') : sf.circle ? t('safe_hint_circle') : t('safe_hint_avoid');
    $('#safeHint').textContent = hint; $('#safeHint').hidden = !hint || !S.safe;
    if (img) {
      var v = viewFor(p);
      $$('#editorCard [data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === v.mode)); });
      $('#zoom').value = Math.round(v.zoom * 100); $('#zoomOut').textContent = Math.round(v.zoom * 100) + '%';
    }
    $$('#bgChips [data-bg]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.bg === S.bg)); });
    $('#bgColor').value = S.bgColor;
    $('#safeOn').checked = S.safe;
    $('#capOn').checked = S.cap.on; $('#capText').value = S.cap.text;
    $$('[data-cpos]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cpos === S.cap.pos)); });
    $$('[data-cstyle]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cstyle === S.cap.style)); });
    $('#capBadge').hidden = !(S.cap.on && S.cap.text.trim()); $('#capBadge').textContent = t('on_badge');
    $$('#cornerGrid [data-corner]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.corner === S.logo.corner)); });
    $('#logoSize').value = S.logo.size; $('#logoSizeOut').textContent = S.logo.size + '%';
    $('#logoBadge').hidden = !logo; $('#logoBadge').textContent = t('on_badge');
    $('#logoDel').hidden = !logo; $('#logoPrev').hidden = !logo;
    $$('#fmtSeg [data-fmt]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.fmt === S.fmt)); });
    $('#fmtHint').textContent = t(S.fmt === 'jpg' ? 'fmt_hint_jpg' : 'fmt_hint_png');
    $('#qualityField').hidden = S.fmt !== 'jpg';
    $('#quality').value = S.quality; $('#qualityOut').textContent = String(S.quality);
    syncExport();
  }
  function selected() { return Object.keys(PRESETS).filter(function (id) { return S.on[id]; }).map(function (id) { return PRESETS[id]; }); }
  function syncExport() {
    var n = selected().length, d = dims(active());
    $('#selCount').textContent = t('sel_count', { n: EDU.fmt(n) });
    $('#dlThisTxt').textContent = t('dl_this', { w: d.w, h: d.h });
    $('#dlAllTxt').textContent = t('dl_all', { n: EDU.fmt(n) });
    $('#dlAll').disabled = !n || !img; $('#dlThis').disabled = !img;
    $('#selCount').dataset.n = n;
  }

  /* ------------------------------------------------------------ export */
  function ext() { return S.fmt === 'png' ? 'png' : 'jpg'; }
  function mime() { return S.fmt === 'png' ? 'image/png' : 'image/jpeg'; }
  function renderOut(p) {
    var d = dims(p), c = canvas(d.w, d.h), x = c.getContext('2d');
    if (S.fmt !== 'png') { x.fillStyle = '#ffffff'; x.fillRect(0, 0, d.w, d.h); }
    render(x, d.w, d.h, 1, viewFor(p));
    return c;
  }
  function outBlob(p) { var c = renderOut(p); return toBlob(c, mime(), S.quality / 100).then(function (b) { free(c); return b; }); }
  /* keeps letters of any script (दिवाली ऑफर.jpg → दिवाली_ऑफर_…); older engines without \p{..} fall back to ASCII */
  var NAME_JUNK = (function () { try { return new RegExp('[^\\p{L}\\p{M}\\p{N}.-]+', 'gu'); } catch (e) { return /[^\w.-]+/g; } })();
  function baseName() {
    var n = (img && !img.sample && img.name ? img.name : 'picture').normalize('NFC').replace(NAME_JUNK, '_').replace(/^[_.]+|[_.]+$/g, '').slice(0, 40);
    return n || 'picture';
  }
  function fileName(p) { var d = dims(p); return baseName() + '_' + p.file + '_' + d.w + 'x' + d.h + '.' + ext(); }
  function kb(bytes) { return EDU.fmt(Math.max(1, Math.round(bytes / 1024))); }
  var estTimer = 0, estSeq = 0;
  function scheduleEstimate() {
    clearTimeout(estTimer);
    estTimer = setTimeout(function () {
      if (!img) return;
      var seq = ++estSeq, p = active();
      outBlob(p).then(function (b) {
        if (seq !== estSeq || !b) return;
        showEstimate(p, b);
      });
    }, 350);
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  var exporting = false;
  function showEstimate(p, b) {
    var d = dims(p);
    $('#estSize').textContent = t('est_size', { kb: kb(b.size), w: d.w, h: d.h });
    $('#estSize').dataset.kb = Math.round(b.size / 1024); $('#estSize').dataset.bytes = b.size;
  }
  function downloadOne(p) {
    return outBlob(p).then(function (b) {
      if (!b) throw new Error('blob');
      EDU.download(fileName(p), b);
      if (p === active()) { clearTimeout(estTimer); estSeq++; showEstimate(p, b); }   /* the real size, not an older estimate */
      return b;
    });
  }
  $('#dlThis').addEventListener('click', function () {
    if (!img || exporting) return;
    var p = active();
    exporting = true; busy(true);
    downloadOne(p).then(function (b) { $('#status').textContent = t('dl_done', { name: fileName(p), kb: kb(b.size) }); })
      .catch(function () { $('#status').textContent = t('err_export'); })
      .then(function () { exporting = false; busy(false); });
  });
  $('#dlAll').addEventListener('click', function () {
    if (!img || exporting) return;
    var list = selected();
    if (!list.length) { $('#status').textContent = t('dl_none'); return; }
    exporting = true; busy(true);
    var i = 0;
    (function next() {
      if (i >= list.length) { $('#status').textContent = t('dl_all_done', { n: EDU.fmt(list.length) }); exporting = false; busy(false); return; }
      var p = list[i++];
      $('#status').textContent = t('dl_progress', { i: EDU.fmt(i), n: EDU.fmt(list.length), name: fileName(p) });
      downloadOne(p).catch(function () { }).then(function () { return wait(450); }).then(next);
    })();
  });
  var canShareFiles = !!(navigator.share && navigator.canShare && window.File);
  if (canShareFiles) $('#shareBtn').hidden = false;
  $('#shareBtn').addEventListener('click', function () {
    if (!img || exporting) return;
    var p = active();
    outBlob(p).then(function (b) {
      var f = new File([b], fileName(p), { type: mime() });
      if (navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: t('app_title') });
      EDU.download(fileName(p), b);
    }).catch(function () { });
  });

  /* ------------------------------------------------------------ controls */
  $$('#editorCard [data-mode]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
  $('#zoom').addEventListener('input', function () {
    if (!img) return;
    var v = viewFor(active()); v.zoom = EDU.clamp((+this.value || 100) / 100, 0.5, 4);
    $('#zoomOut').textContent = Math.round(v.zoom * 100) + '%';
    changed();
  });
  $('#centerBtn').addEventListener('click', resetView);
  $$('#bgChips [data-bg]').forEach(function (b) {
    if (b.tagName === 'LABEL') return;
    b.addEventListener('click', function () { S.bg = b.dataset.bg; save(); syncControls(); changed(); });
  });
  $('#bgColor').addEventListener('input', function () { S.bg = 'custom'; S.bgColor = this.value; save(); syncControls(); changed(); });
  $('#safeOn').addEventListener('change', function () { S.safe = this.checked; save(); syncControls(); draw(); });
  $('#applyAll').addEventListener('click', function () {
    if (!img) return;
    var cur = viewFor(active());
    Object.keys(PRESETS).forEach(function (id) { var v = viewFor(PRESETS[id]); if (v.mode !== cur.mode) { v.mode = cur.mode; v.zoom = 1; v.cx = 0.5; v.cy = 0.5; } });
    EDU.toast(t('applied_all'));
  });
  $('#capOn').addEventListener('change', function () { S.cap.on = this.checked; save(); syncControls(); changed(); });
  $('#capText').addEventListener('input', function () { S.cap.text = this.value; if (this.value.trim() && !S.cap.on) { S.cap.on = true; } save(); syncControls(); changed(); });
  $$('[data-cpos]').forEach(function (b) { b.addEventListener('click', function () { S.cap.pos = b.dataset.cpos; save(); syncControls(); changed(); }); });
  $$('[data-cstyle]').forEach(function (b) { b.addEventListener('click', function () { S.cap.style = b.dataset.cstyle; save(); syncControls(); changed(); }); });
  $$('#cornerGrid [data-corner]').forEach(function (b) { b.addEventListener('click', function () { S.logo.corner = b.dataset.corner; save(); syncControls(); changed(); }); });
  $('#logoSize').addEventListener('input', function () { S.logo.size = EDU.clamp(+this.value || 14, 6, 35); $('#logoSizeOut').textContent = S.logo.size + '%'; save(); changed(); });
  $('#logoPick').addEventListener('click', function () { $('#logoIn').click(); });
  $('#logoIn').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; if (f) loadLogo(f); });
  $('#logoDel').addEventListener('click', function () { if (logo) free(logo.c); logo = null; S.logo.data = ''; save(); syncControls(); changed(); });
  function setLogo(c, dataUrl) {
    if (logo) free(logo.c);
    logo = { c: c, w: c.width, h: c.height };
    $('#logoPrev').src = dataUrl;
    S.logo.data = dataUrl.length < 200000 ? dataUrl : '';
    save(); syncControls(); changed();
  }
  var logoSeq = 0;
  function loadLogo(file) {
    if (file.size > 20 * 1024 * 1024) { EDU.toast(t('too_big')); return; }
    var seq = ++logoSeq;
    decode(file).then(function (d) {
      if (seq !== logoSeq) { free(d.c); return; }
      var f = Math.min(1, 800 / Math.max(d.c.width, d.c.height)), c = d.c;
      if (f < 1) { c = canvas(d.c.width * f, d.c.height * f); var x = c.getContext('2d'); hq(x); x.drawImage(d.c, 0, 0, c.width, c.height); free(d.c); }
      setLogo(c, c.toDataURL('image/png'));
    }).catch(function () { EDU.toast(t('err_open')); });
  }
  function restoreLogo() {
    if (!S.logo.data) return;
    var im = new Image();
    im.onload = function () { var c = canvas(im.naturalWidth, im.naturalHeight); c.getContext('2d').drawImage(im, 0, 0); setLogo(c, S.logo.data); };
    im.src = S.logo.data;
  }
  $$('#fmtSeg [data-fmt]').forEach(function (b) { b.addEventListener('click', function () { S.fmt = b.dataset.fmt; save(); syncControls(); scheduleEstimate(); }); });
  $('#quality').addEventListener('input', function () { S.quality = EDU.clamp(+this.value || 90, 50, 100); $('#qualityOut').textContent = String(S.quality); save(); scheduleEstimate(); });
  function customChange() {
    var w = EDU.clamp(Math.round(+$('#customW').value) || S.custom.w, 16, 4096), h = EDU.clamp(Math.round(+$('#customH').value) || S.custom.h, 16, 4096);
    S.custom.w = w; S.custom.h = h; save();
    delete views.custom;
    buildPresets();
    if (S.active === 'custom') { syncControls(); if (img) { sizePreview(); changed(); } }
  }
  $('#customW').addEventListener('change', customChange); $('#customH').addEventListener('change', customChange);
  $('#selAll').addEventListener('click', function () { Object.keys(PRESETS).forEach(function (id) { if (id !== 'custom' || S.pf === 'custom') S.on[id] = 1; }); save(); buildPresets(); });
  $('#selNone').addEventListener('click', function () { S.on = {}; save(); buildPresets(); });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('s'); S = defaults(); views = {}; bgCache = null;
    if (logo) free(logo.c); logo = null;
    buildPlatforms(); buildPresets(); syncControls();
    if (img) { sizePreview(); changed(); }
    $('#status').textContent = '';
  });

  /* ------------------------------------------------------------ picking, dropping, pasting */
  $('#pickBtn').addEventListener('click', function () { $('#fileIn').click(); });
  $('#fileIn').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; if (f) loadFile(f); });
  $('#sampleBtn').addEventListener('click', function () { setImage(sampleCanvas(), { sample: true }); });
  [$('#drop'), stage].forEach(function (zone) {
    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('over'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault(); zone.classList.remove('over');
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) loadFile(f);
    });
  });
  $('#drop').addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === this) { e.preventDefault(); $('#fileIn').click(); } });
  document.addEventListener('paste', function (e) {
    var items = e.clipboardData && e.clipboardData.items; if (!items) return;
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && /^image\//.test(items[i].type)) { var f = items[i].getAsFile(); if (f) { loadFile(f); e.preventDefault(); return; } }
    }
  });

  /* ------------------------------------------------------------ language + start */
  EDU.onLang(function () {
    buildPlatforms(); buildPresets(); syncControls(); showLoadInfo();
    if (!$('#loadErr').hidden) { var key = $('#heicLink').hidden ? 'err_open' : 'err_heic'; showError(key); }
    if (img && img.sample) setImage(sampleCanvas(), { sample: true });   /* the poster text follows the language */
    else { draw(); scheduleEstimate(); }
  });
  buildPlatforms(); buildPresets(); syncControls();
  restoreLogo();
  setImage(sampleCanvas(), { sample: true });
})();
