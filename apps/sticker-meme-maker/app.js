/* Sticker & Meme Maker: a 512 x 512 transparent sticker (PNG / WebP) or a meme (PNG / JPG) from your own photo.
   Canvas only; photos never leave the device. */
(function () {
  'use strict';
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t, SLUG = 'sticker-meme-maker', store = EDU.store(SLUG);
  var D = 512, KB100 = 100 * 1024, MAX_MB = 40, MAX_SIDE = 2048;
  var EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji"';
  var FONT = '"Noto Sans","Nirmala UI","Segoe UI",system-ui,-apple-system,sans-serif,' + EMOJI_FONT;
  var MEME_FONT = 'Impact,"Arial Black","Noto Sans","Nirmala UI","Segoe UI",system-ui,sans-serif,' + EMOJI_FONT;
  var EMOJIS = ['😀', '😂', '😍', '😎', '🥳', '👍', '🙏', '🎉', '❤️', '🔥', '⭐', '🌸'];
  var app = $('#app'), cv = $('#cv');

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var WEBP_OK = (function () { try { var c = document.createElement('canvas'); c.width = c.height = 2; return c.toDataURL('image/webp').indexOf('data:image/webp') === 0; } catch (e) { return false; } })();
  var sample = null;
  var S;
  window.SMM_TEST = { lastBlob: null, lastName: '' };

  function fresh() {
    return {
      mode: store.get('mode', 'sticker') === 'meme' ? 'meme' : 'sticker',
      img: null, user: false, plain: false, color: '#1d4ed8',
      zoom: 1, px: 0, py: 0, shape: 'circle', outline: true,
      top: null, bot: null,                          // null = the translated sample line
      items: { sticker: [{ key: 'sample_word', x: 0.5, y: 0.83, size: 0.13, color: '#ffffff', stroke: '#111827' }], meme: [] },
      sel: -1, msg: null, dl: null, rev: 0
    };
  }

  /* ------------------------------------------------------------ sample picture (drawn, no photo) */
  function makeSample() {
    var c = document.createElement('canvas'); c.width = c.height = 800;
    var g = c.getContext('2d'), i;
    var sky = g.createLinearGradient(0, 0, 0, 800); sky.addColorStop(0, '#38bdf8'); sky.addColorStop(1, '#fef3c7');
    g.fillStyle = sky; g.fillRect(0, 0, 800, 800);
    g.fillStyle = '#4ade80'; g.beginPath(); g.ellipse(200, 860, 460, 240, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#22c55e'; g.beginPath(); g.ellipse(640, 880, 420, 230, 0, 0, Math.PI * 2); g.fill();
    g.save(); g.translate(400, 350);
    g.strokeStyle = '#f59e0b'; g.lineWidth = 26; g.lineCap = 'round';
    for (i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, -235); g.lineTo(0, -295); g.stroke(); }
    g.restore();
    g.fillStyle = '#fbbf24'; g.beginPath(); g.arc(400, 350, 200, 0, Math.PI * 2); g.fill();
    g.lineWidth = 10; g.strokeStyle = '#f59e0b'; g.stroke();
    g.fillStyle = '#1f2937';
    g.beginPath(); g.ellipse(330, 310, 24, 34, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(470, 310, 24, 34, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(338, 298, 9, 0, Math.PI * 2); g.arc(478, 298, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(244,114,182,.75)';
    g.beginPath(); g.ellipse(285, 385, 34, 22, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(515, 385, 34, 22, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7c2d12'; g.beginPath(); g.arc(400, 380, 92, 0.12 * Math.PI, 0.88 * Math.PI); g.closePath(); g.fill();
    return c;
  }
  function img() { return S.img || sample || (sample = makeSample()); }

  /* ------------------------------------------------------------ drawing */
  function itemText(it) { return it.key ? t(it.key) : it.text; }
  function shapePath(g, inset) {
    var a = inset, b = D - inset * 2;
    g.beginPath();
    if (S.shape === 'circle') g.arc(D / 2, D / 2, b / 2, 0, Math.PI * 2);
    else if (S.shape === 'round') {
      var r = Math.max(8, 84 - inset);
      g.moveTo(a + r, a); g.arcTo(a + b, a, a + b, a + b, r); g.arcTo(a + b, a + b, a, a + b, r); g.arcTo(a, a + b, a, a, r); g.arcTo(a, a, a + b, a, r); g.closePath();
    } else g.rect(a, a, b, b);
  }
  function clampPan() {
    var im = img(), sc = Math.max(D / im.width, D / im.height) * S.zoom, mx = Math.max(0, (im.width * sc - D) / 2), my = Math.max(0, (im.height * sc - D) / 2);
    S.px = EDU.clamp(S.px, -mx, mx); S.py = EDU.clamp(S.py, -my, my);
  }
  function drawItems(g, W, H, list, ui) {
    var u = Math.min(W, H);
    list.forEach(function (it, i) {
      var txt = itemText(it); if (!txt) { it.bb = null; return; }
      var px = Math.max(8, it.size * u), x = it.x * W, y = it.y * H;
      g.font = '800 ' + px + 'px ' + (it.emoji ? EMOJI_FONT + ',sans-serif' : FONT);
      /* long words never run off the picture: shrink to fit the width */
      var tw = g.measureText(txt).width, room = W * 0.92;
      if (tw > room) { px = Math.max(8, px * room / tw); g.font = '800 ' + px + 'px ' + FONT; x = W / 2; }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      if (!it.emoji) { g.strokeStyle = it.stroke; g.lineWidth = Math.max(2, px * 0.18); g.strokeText(txt, x, y); }
      g.fillStyle = it.color; g.fillText(txt, x, y);
      var w = Math.max(px * 0.8, g.measureText(txt).width) + px * 0.3, h = px * 1.45;
      it.bb = { x0: (x - w / 2) / W, y0: (y - h / 2) / H, x1: (x + w / 2) / W, y1: (y + h / 2) / H };
      if (ui && i === S.sel) {
        g.save(); g.setLineDash([u * 0.016, u * 0.012]); g.lineWidth = Math.max(2, u * 0.006);
        g.strokeStyle = '#ffffff'; g.strokeRect(x - w / 2, y - h / 2, w, h);
        g.lineDashOffset = u * 0.014; g.strokeStyle = '#2563eb'; g.strokeRect(x - w / 2, y - h / 2, w, h); g.restore();
      }
    });
  }
  function drawSticker(g, px, ui) {
    var k = px / D, im = img(), inset = S.outline ? 16 : 0;
    g.setTransform(k, 0, 0, k, 0, 0);
    g.clearRect(0, 0, D, D);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    if (S.outline) { shapePath(g, 0); g.fillStyle = '#ffffff'; g.fill(); }
    g.save(); shapePath(g, inset); g.clip();
    clampPan();
    var sc = Math.max(D / im.width, D / im.height) * S.zoom, w = im.width * sc, h = im.height * sc;
    g.drawImage(im, (D - w) / 2 + S.px, (D - h) / 2 + S.py, w, h);
    g.restore();
    drawItems(g, D, D, S.items.sticker, ui);
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  function memeSize() {
    if (S.plain) return { w: 1080, h: 1080 };
    var im = img(), m = Math.max(im.width, im.height), k = EDU.clamp(m, 720, 1080) / m;
    return { w: Math.max(64, Math.round(im.width * k)), h: Math.max(64, Math.round(im.height * k)) };
  }
  function wrap(g, text, maxW) {
    var words = text.split(/\s+/).filter(Boolean), lines = [], cur = '';
    words.forEach(function (w) {
      var tryL = cur ? cur + ' ' + w : w;
      if (cur && g.measureText(tryL).width > maxW) { lines.push(cur); cur = w; } else cur = tryL;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function drawMemeLine(g, text, W, H, atTop) {
    text = (text || '').trim(); if (!text) return;
    try { text = text.toLocaleUpperCase(); } catch (e) { /* keep as typed */ }
    var maxW = W * 0.94, px = Math.round(H * 0.13), lines, ok, lh;
    for (;;) {
      g.font = '900 ' + px + 'px ' + MEME_FONT;
      lines = wrap(g, text, maxW); lh = px * 1.18;
      ok = lines.length <= 3 && lines.length * lh <= H * 0.34 && lines.every(function (l) { return g.measureText(l).width <= maxW; });
      if (ok || px <= 12) break;
      px = Math.max(12, Math.floor(px * 0.92));
    }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
    g.strokeStyle = '#000000'; g.lineWidth = Math.max(3, px * 0.16); g.fillStyle = '#ffffff';
    var y0 = atTop ? H * 0.035 + lh / 2 : H - H * 0.035 - lh * lines.length + lh / 2;
    lines.forEach(function (l, i) { g.strokeText(l, W / 2, y0 + i * lh); g.fillText(l, W / 2, y0 + i * lh); });
  }
  function drawMeme(g, W, H, ui) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    if (S.plain) { g.fillStyle = S.color; g.fillRect(0, 0, W, H); }
    else { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.drawImage(img(), 0, 0, W, H); }
    drawMemeLine(g, S.top === null ? t('sample_top') : S.top, W, H, true);
    drawMemeLine(g, S.bot === null ? t('sample_bottom') : S.bot, W, H, false);
    drawItems(g, W, H, S.items.meme, ui);
  }
  function render() {
    var g = cv.getContext('2d');
    if (S.mode === 'sticker') {
      if (cv.width !== D || cv.height !== D) { cv.width = D; cv.height = D; }
      drawSticker(g, D, true);
    } else {
      var m = memeSize();
      if (cv.width !== m.w || cv.height !== m.h) { cv.width = m.w; cv.height = m.h; }
      drawMeme(g, m.w, m.h, true);
    }
    S.rev++; cv.setAttribute('data-rev', S.rev);
    app.setAttribute('data-items', S.items[S.mode].length);
  }

  /* ------------------------------------------------------------ UI state */
  function showMsg() {
    var el = $('#msg');
    el.hidden = !S.msg; el.textContent = S.msg ? t(S.msg.key, S.msg.vars) : '';
    var d = $('#dlMsg');
    d.hidden = !S.dl;
    d.textContent = S.dl ? S.dl.map(function (p) { return t(p.key, p.vars); }).join(' ') : '';
    if (S.dl) d.className = 'callout ' + (S.dl.warn ? 'warning' : 'success');
  }
  function syncUI() {
    var st = S.mode === 'sticker', list = S.items[S.mode], it = list[S.sel];
    app.setAttribute('data-mode', S.mode);
    app.setAttribute('data-photo', S.plain && !st ? 'plain' : S.user ? 'user' : 'sample');
    $$('#modeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode)); });
    $$('#shapeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.shape === S.shape)); });
    $('#shapeCard').hidden = !st; $('#memeCard').hidden = st;
    $('#zoomRow').hidden = !st; $('#plainBtn').hidden = st; $('#colorRow').hidden = st || !S.plain;
    $('#dlWebp').hidden = !st || !WEBP_OK; $('#dlJpg').hidden = st; $('#waNote').hidden = !st; $('#noWebp').hidden = !st || WEBP_OK;
    $('#outline').checked = S.outline; $('#zoom').value = S.zoom; $('#bgColor').value = S.color;
    var top = $('#topText'), bot = $('#botText');
    if (document.activeElement !== top) top.value = S.top === null ? t('sample_top') : S.top;
    if (document.activeElement !== bot) bot.value = S.bot === null ? t('sample_bottom') : S.bot;
    $('#itemEd').hidden = !it; $('#selNone').hidden = !!it || !list.length;
    if (it) {
      $('#itTextField').hidden = !!it.emoji; $('#itColors').hidden = !!it.emoji;
      if (document.activeElement !== $('#itText')) $('#itText').value = itemText(it) || '';
      $('#itSize').value = Math.round(it.size * 100); $('#itColor').value = it.color; $('#itStroke').value = it.stroke;
    }
    showMsg();
  }
  function refresh() { syncUI(); render(); }

  /* ------------------------------------------------------------ photo */
  function loadFile(file) {
    if (!file) return;
    var bad = function (key, vars) { S.msg = { key: key, vars: vars }; showMsg(); };
    if (file.size > MAX_MB * 1048576) { bad('err_big', { mb: Math.round(file.size / 1048576), max: MAX_MB }); return; }
    if (!file.size || (file.type && file.type.indexOf('image/') !== 0)) { bad('err_notimage'); return; }
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      URL.revokeObjectURL(url);
      var w = im.naturalWidth, h = im.naturalHeight;
      if (!w || !h) { bad('err_notimage'); return; }
      var k = Math.min(1, MAX_SIDE / Math.max(w, h)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      try { c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); } catch (e) { bad('err_notimage'); return; }
      S.img = c; S.user = true; S.plain = false; S.zoom = 1; S.px = S.py = 0; S.msg = null; S.dl = null;
      /* the sample words belong to the sample picture: clear them when a real photo arrives */
      if (S.top === null) S.top = '';
      if (S.bot === null) S.bot = '';
      S.items.sticker = S.items.sticker.filter(function (it) { return !it.key; }); S.sel = -1;
      refresh();
    };
    im.onerror = function () { URL.revokeObjectURL(url); bad('err_notimage'); };
    im.src = url;
  }

  /* ------------------------------------------------------------ pointer: move the photo / drag text */
  var drag = null;
  function rel(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, k: r.width }; }
  function hit(p) {
    var list = S.items[S.mode];
    for (var i = list.length - 1; i >= 0; i--) { var b = list[i].bb; if (b && p.x >= b.x0 && p.x <= b.x1 && p.y >= b.y0 && p.y <= b.y1) return i; }
    return -1;
  }
  cv.addEventListener('pointerdown', function (e) {
    var p = rel(e), i = hit(p);
    if (i >= 0) { var it = S.items[S.mode][i]; S.sel = i; drag = { item: it, dx: it.x - p.x, dy: it.y - p.y }; }
    else { if (S.sel !== -1) S.sel = -1; drag = S.mode === 'sticker' ? { pan: true, x: p.x, y: p.y, px: S.px, py: S.py } : null; }
    try { cv.setPointerCapture(e.pointerId); } catch (x) { /* fine */ }
    refresh(); e.preventDefault();
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var p = rel(e);
    if (drag.item) { drag.item.x = EDU.clamp(p.x + drag.dx, 0.02, 0.98); drag.item.y = EDU.clamp(p.y + drag.dy, 0.03, 0.97); }
    else { S.px = drag.px + (p.x - drag.x) * D; S.py = drag.py + (p.y - drag.y) * D; }
    render();
  });
  function endDrag() { drag = null; }
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);

  /* ------------------------------------------------------------ text + emoji */
  function addItem(o) {
    var list = S.items[S.mode], n = list.length;
    var it = { text: o.text, emoji: !!o.emoji, x: 0.5, y: EDU.clamp(0.5 + ((n % 5) - 2) * 0.09, 0.1, 0.9), size: o.emoji ? 0.2 : 0.12, color: '#ffffff', stroke: '#111827' };
    list.push(it); S.sel = list.length - 1; refresh();
  }
  function selItem() { return S.items[S.mode][S.sel]; }

  /* ------------------------------------------------------------ export */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function stamp() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()); }
  function fmtSize(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : (b >= 10240 ? Math.round(b / 1024) : Math.max(0.1, b / 1024).toFixed(1)) + ' KB'; }
  function toBlob(c, type, q) {
    return new Promise(function (res) {
      try { c.toBlob(function (b) { res(b); }, type, q); } catch (e) { res(null); }
    });
  }
  function stickerCanvas(inner) {
    var c = document.createElement('canvas'); c.width = c.height = inner;
    drawSticker(c.getContext('2d'), inner, false);
    if (inner === D) return c;
    var o = document.createElement('canvas'); o.width = o.height = D;
    var g = o.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, D, D);
    return o;
  }
  function deliver(blob, name, w, h, extra) {
    window.SMM_TEST.lastBlob = blob; window.SMM_TEST.lastName = name;
    EDU.download(name, blob, blob.type);
    S.dl = [{ key: 'dl_done', vars: { name: name, size: fmtSize(blob.size), w: w, h: h } }].concat(extra || []);
    S.dl.warn = (extra || []).some(function (x) { return x.key === 'dl_over'; });
    showMsg(); render();
  }
  var busy = false;
  function exportSticker(kind) {
    if (busy) return; busy = true;
    var type = kind === 'webp' ? 'image/webp' : 'image/png', name = 'sticker-' + stamp() + '.' + kind;
    var inners = [D, 384, 320, 256, 192], qs = kind === 'webp' ? [0.92, 0.8, 0.65, 0.5, 0.35] : [undefined];
    var best = null, i = 0, j = 0;
    (function step() {
      if (i >= inners.length) return finish();
      toBlob(stickerCanvas(inners[i]), type, qs[j]).then(function (b) {
        /* keep the full-detail file unless a lower-detail one really gets under 100 KB */
        if (b && b.type === type && (!best || b.size <= KB100)) best = { blob: b, reduced: i > 0 };
        if (best && best.blob.size <= KB100) return finish();
        j++; if (j >= qs.length) { j = 0; i++; }
        step();
      });
    })();
    function finish() {
      busy = false;
      if (!best) { S.dl = [{ key: 'no_webp' }]; S.dl.warn = true; showMsg(); return; }
      var extra = [];
      if (best.blob.size > KB100) extra.push({ key: 'dl_over' }); else if (best.reduced) extra.push({ key: 'dl_reduced' });
      deliver(best.blob, name, D, D, extra);
    }
  }
  function exportMeme(kind) {
    if (busy) return; busy = true;
    var m = memeSize(), c = document.createElement('canvas'); c.width = m.w; c.height = m.h;
    drawMeme(c.getContext('2d'), m.w, m.h, false);
    toBlob(c, kind === 'jpg' ? 'image/jpeg' : 'image/png', 0.9).then(function (b) {
      busy = false;
      if (b) deliver(b, 'meme-' + stamp() + '.' + kind, m.w, m.h);
    });
  }

  /* ------------------------------------------------------------ events */
  $$('#modeSeg button').forEach(function (b) {
    b.addEventListener('click', function () { S.mode = b.dataset.mode; S.sel = -1; S.dl = null; store.set('mode', S.mode); refresh(); });
  });
  $$('#shapeSeg button').forEach(function (b) { b.addEventListener('click', function () { S.shape = b.dataset.shape; refresh(); }); });
  $('#outline').addEventListener('change', function () { S.outline = this.checked; render(); });
  $('#zoom').addEventListener('input', function () { S.zoom = EDU.clamp(+this.value || 1, 1, 4); render(); });
  $('#pickBtn').addEventListener('click', function () { $('#file').click(); });
  $('#file').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; loadFile(f); });
  $('#sampleBtn').addEventListener('click', function () {
    var mode = S.mode; S = fresh(); S.mode = mode; refresh();
  });
  $('#plainBtn').addEventListener('click', function () { S.plain = true; S.msg = null; refresh(); });
  $('#bgColor').addEventListener('input', function () { S.color = this.value; render(); });
  $('#topText').addEventListener('input', function () { S.top = this.value; render(); });
  $('#botText').addEventListener('input', function () { S.bot = this.value; render(); });
  function addTyped() {
    var inp = $('#newText'), v = inp.value.replace(/\s+/g, ' ').trim();
    if (!v) { inp.focus(); EDU.toast(t('need_text')); return; }
    addItem({ text: v }); inp.value = '';
  }
  $('#addText').addEventListener('click', addTyped);
  $('#newText').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addTyped(); } });
  EMOJIS.forEach(function (em) {
    $('#emojiRow').appendChild(EDU.el('button', { type: 'button', text: em, 'aria-label': em, onclick: function () { addItem({ text: em, emoji: true }); } }));
  });
  $('#itText').addEventListener('input', function () { var it = selItem(); if (it) { it.key = null; it.text = this.value; render(); } });
  $('#itSize').addEventListener('input', function () { var it = selItem(); if (it) { it.size = (+this.value || 12) / 100; render(); } });
  $('#itColor').addEventListener('input', function () { var it = selItem(); if (it) { it.color = this.value; render(); } });
  $('#itStroke').addEventListener('input', function () { var it = selItem(); if (it) { it.stroke = this.value; render(); } });
  $('#itDel').addEventListener('click', function () { if (selItem()) { S.items[S.mode].splice(S.sel, 1); S.sel = -1; refresh(); } });
  $('#dlPng').addEventListener('click', function () { if (S.mode === 'sticker') exportSticker('png'); else exportMeme('png'); });
  $('#dlWebp').addEventListener('click', function () { exportSticker('webp'); });
  $('#dlJpg').addEventListener('click', function () { exportMeme('jpg'); });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('mode'); S = fresh(); $('#newText').value = ''; refresh();
  });
  EDU.onLang(refresh);

  S = fresh();
  refresh();
})();
