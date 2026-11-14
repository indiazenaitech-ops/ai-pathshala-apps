/* QR & Barcode Scanner
   Reads QR codes and common barcodes on the device, from the camera or from a picked picture.
   Uses the browser's BarcodeDetector when it exists; otherwise the bundled jsQR decoder (vendor/jsQR.js,
   Apache-2.0, QR codes only). Nothing is uploaded and no link is ever opened without a press. */
(function () {
  'use strict';
  var SLUG = 'qr-barcode-scanner';
  var store = EDU.store(SLUG);
  var el = EDU.el, $ = EDU.$, t = EDU.t;
  var MAX_HIST = 50, MAX_TEXT = 4000;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var hasJsqr = typeof window.jsQR === 'function';
  var bd = null, bdReady;
  var stream = null, timer = null, busy = false;
  var status = null;                    /* { key, kind } */
  var current = null;                   /* { text, format } */
  var keep = store.get('keep', false) === true;
  var hist = store.get('hist', []);
  if (!Array.isArray(hist)) hist = [];
  hist = hist.filter(function (h) { return h && typeof h.text === 'string'; }).slice(0, MAX_HIST);

  /* ---------------- decoders ---------------- */
  bdReady = (function () {
    if (!('BarcodeDetector' in window)) return Promise.resolve();
    try {
      return window.BarcodeDetector.getSupportedFormats().then(function (f) {
        if (f && f.length) bd = new window.BarcodeDetector({ formats: f });
      }).catch(function () { bd = null; });
    } catch (e) { return Promise.resolve(); }
  })();
  function jsqrOn(cv, both) {
    if (!hasJsqr) return null;
    try {
      var d = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cv.width, cv.height);
      var r = window.jsQR(d.data, d.width, d.height, { inversionAttempts: both ? 'attemptBoth' : 'dontInvert' });
      return r && r.data ? { text: r.data, format: 'qr_code' } : null;
    } catch (e) { return null; }
  }
  function detect(cv, both) {
    var p = bd ? bd.detect(cv).then(function (r) {
      return r && r.length && r[0].rawValue ? { text: String(r[0].rawValue), format: String(r[0].format || '') } : null;
    }).catch(function () { return null; }) : Promise.resolve(null);
    return p.then(function (r) { return r || jsqrOn(cv, both); });
  }
  function canvasOf(src, w, h, maxSide, grow) {
    var s = maxSide / Math.max(w, h); if (!grow) s = Math.min(1, s);
    var cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(w * s)); cv.height = Math.max(1, Math.round(h * s));
    var ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(src, 0, 0, cv.width, cv.height);
    return cv;
  }

  /* ---------------- what kind of content is it ---------------- */
  function unesc(s) { return String(s).replace(/\\([\\;,:"])/g, '$1'); }
  function dec(s) { try { return decodeURIComponent(String(s).replace(/\+/g, ' ')); } catch (e) { return String(s); } }
  function parse(text) {
    var m, o;
    if (/^upi:\/\/pay\?/i.test(text)) {
      o = {};
      text.slice(text.indexOf('?') + 1).split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) o[kv.slice(0, i).toLowerCase()] = dec(kv.slice(i + 1)); });
      return { type: 'upi', payee: o.pn || '', id: o.pa || '', amount: /^\d+(\.\d{1,2})?$/.test(o.am || '') ? o.am : '', note: o.tn || '' };
    }
    if (/^https?:\/\//i.test(text) && !/\s/.test(text.trim())) {
      try { var u = new URL(text.trim()); if (u.hostname) return { type: 'link', url: u.href, host: u.hostname }; } catch (e) { /* not a real address: plain text */ }
    }
    if (/^WIFI:/i.test(text)) {
      o = {};
      var re = /(?:^|;)([A-Za-z]):((?:\\.|[^;\\])*)/g, body = text.slice(5);
      while ((m = re.exec(body))) o[m[1].toUpperCase()] = unesc(m[2]);
      return { type: 'wifi', name: o.S || '', pass: o.P || '', sec: o.T || '' };
    }
    if (/^BEGIN:VCARD/i.test(text)) {
      o = { type: 'contact', name: '', phone: '', email: '' };
      text.split(/\r?\n/).forEach(function (line) {
        var i = line.indexOf(':'); if (i < 0) return;
        var k = line.slice(0, i).toUpperCase().split(';')[0], v = line.slice(i + 1).trim();
        if (k === 'FN' && v) o.name = unesc(v);
        else if (k === 'N' && !o.name) o.name = unesc(v.split(';').filter(Boolean).reverse().join(' '));
        else if (k === 'TEL' && !o.phone) o.phone = v;
        else if (k === 'EMAIL' && !o.email) o.email = v;
      });
      return o;
    }
    if (/^MECARD:/i.test(text)) {
      o = { type: 'contact', name: '', phone: '', email: '' };
      text.slice(7).split(';').forEach(function (part) {
        var i = part.indexOf(':'); if (i < 0) return;
        var k = part.slice(0, i).toUpperCase(), v = unesc(part.slice(i + 1));
        if (k === 'N') o.name = v.split(',').reverse().join(' ').trim(); else if (k === 'TEL' && !o.phone) o.phone = v; else if (k === 'EMAIL' && !o.email) o.email = v;
      });
      return o;
    }
    if (/^\d+$/.test(text.trim())) return { type: 'number' };
    return { type: 'text' };
  }
  function fmtName(f) { return f ? String(f).replace(/_code$/, '').replace(/_/g, '-').toUpperCase() : ''; }

  /* ---------------- render ---------------- */
  function setStatus(key, kind) { status = key ? { key: key, kind: kind || '' } : null; renderStatus(); }
  function renderStatus() {
    var m = $('#msg');
    m.textContent = status ? t(status.key) : '';
    m.className = status && status.kind ? 'callout ' + status.kind : '';
    m.dataset.key = status ? status.key : '';
    var n = $('#engineNote');
    if (!bd) { n.hidden = false; n.textContent = t(hasJsqr ? 'qr_only' : 'no_support'); n.dataset.key = hasJsqr ? 'qr_only' : 'no_support'; } else n.hidden = true;
    $('#btnCam').hidden = !!stream; $('#btnStop').hidden = !stream; $('#camWrap').hidden = !stream;
  }
  function row(dl, label, value, field) {
    dl.appendChild(el('dt', { text: t(label) }));
    dl.appendChild(el('dd', { class: 'no-i18n', dataset: { field: field } }, el('bdi', { text: value })));
  }
  function renderResult() {
    var box = $('#result');
    if (!current) { box.hidden = true; box.textContent = ''; return; }
    var text = current.text, p = parse(text), dl;
    box.hidden = false; box.textContent = ''; box.dataset.type = p.type;
    box.appendChild(el('h3', { text: t('h_result') }));
    box.appendChild(el('div', { class: 'row' },
      el('span', { class: 'badge primary', id: 'resType', text: t('type_' + p.type) }),
      current.format ? el('span', { class: 'badge no-i18n', id: 'resFormat', text: fmtName(current.format) }) : null));
    if (p.type === 'link') {
      box.appendChild(el('p', { class: 'callout warning', id: 'linkWarn', text: t('link_warn') }));
      dl = el('dl', { class: 'qs-rows' }); row(dl, 'link_site', p.host, 'host'); box.appendChild(dl);
      box.appendChild(el('div', { class: 'qs-raw qs-url no-i18n', id: 'resUrl', text: p.url }));
      box.appendChild(el('div', {}, el('button', { class: 'btn', id: 'btnOpen', text: t('open_link'), onclick: function () {
        var w = window.open(p.url, '_blank', 'noopener,noreferrer'); if (w) w.opener = null;
      } })));
    } else if (p.type === 'wifi') {
      dl = el('dl', { class: 'qs-rows' });
      row(dl, 'wifi_name', p.name || '—', 'wifi-name'); row(dl, 'wifi_pass', p.pass || '—', 'wifi-pass'); row(dl, 'wifi_sec', p.sec || '—', 'wifi-sec');
      box.appendChild(dl);
    } else if (p.type === 'contact') {
      dl = el('dl', { class: 'qs-rows' });
      row(dl, 'c_name', p.name || '—', 'c-name'); row(dl, 'c_phone', p.phone || '—', 'c-phone'); row(dl, 'c_email', p.email || '—', 'c-email');
      box.appendChild(dl);
    } else if (p.type === 'upi') {
      dl = el('dl', { class: 'qs-rows' });
      row(dl, 'upi_payee', p.payee || '—', 'payee'); row(dl, 'upi_id', p.id || '—', 'upi-id');
      dl.appendChild(el('dt', { text: t('upi_amount') }));
      dl.appendChild(p.amount ? el('dd', { class: 'no-i18n', dataset: { field: 'amount' } }, el('bdi', { text: '₹' + p.amount })) : el('dd', { dataset: { field: 'amount' }, text: t('upi_no_amount') }));
      if (p.note) row(dl, 'upi_msg', p.note, 'upi-note');
      box.appendChild(dl);
      box.appendChild(el('p', { class: 'callout warning', id: 'upiNote', text: t('upi_text_only') }));
    }
    box.appendChild(el('div', { class: 'small muted', text: t('full_content') }));
    box.appendChild(el('div', { class: 'qs-raw no-i18n', id: 'resRaw', text: text }));
    box.appendChild(el('div', { class: 'row' },
      el('button', { class: 'btn btn-primary', id: 'btnCopy', text: t('copy'), onclick: function () { EDU.copy(text); EDU.toast(t('copied')); } }),
      el('button', { class: 'btn', id: 'btnShare', text: t('share'), onclick: function () {
        if (navigator.share) navigator.share({ text: text }).catch(function () { });
        else { EDU.copy(text); EDU.toast(t('copied')); }
      } })));
  }
  function when(ts) {
    var d = new Date(ts), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function renderHistory() {
    var box = $('#histList'); box.textContent = '';
    $('#keep').checked = keep;
    $('#btnClear').hidden = !hist.length;
    if (!hist.length) { box.appendChild(el('p', { class: 'muted small', id: 'histEmpty', text: t(keep ? 'no_history' : 'hist_off') })); return; }
    hist.forEach(function (h) {
      box.appendChild(el('button', { class: 'qs-hist', type: 'button', onclick: function () { show({ text: h.text, format: h.format || '' }, true); } },
        el('span', { class: 'badge', text: t('type_' + parse(h.text).type) }),
        el('span', { class: 'grow no-i18n', text: h.text.slice(0, 120) }),
        el('bdi', { class: 'tiny muted', text: when(h.ts) })));
    });
  }
  function show(r, fromHistory) {
    current = { text: String(r.text).slice(0, MAX_TEXT), format: r.format || '' };
    if (keep && !fromHistory && !(hist[0] && hist[0].text === current.text)) {
      hist.unshift({ text: current.text, format: current.format, ts: Date.now() });
      hist = hist.slice(0, MAX_HIST); store.set('hist', hist);
    }
    renderResult(); renderHistory();
    var box = $('#result'); if (box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
  }

  /* ---------------- camera ---------------- */
  function stopCam() {
    clearTimeout(timer); timer = null;
    if (stream) { try { stream.getTracks().forEach(function (tr) { tr.stop(); }); } catch (e) { /* already stopped */ } }
    stream = null;
    var v = $('#video'); try { v.pause(); } catch (e) { /* not playing */ } v.srcObject = null;
  }
  function tick() {
    if (!stream) return;
    var v = $('#video');
    if (v.readyState < 2 || !v.videoWidth) { timer = setTimeout(tick, 200); return; }
    var mine = stream;
    detect(canvasOf(v, v.videoWidth, v.videoHeight, 720), false).then(function (r) {
      if (stream !== mine) return;
      if (r) { stopCam(); setStatus(null); show(r); } else timer = setTimeout(tick, 180);
    });
  }
  function startCam() {
    if (stream || busy) return;
    if (!bd && !hasJsqr) { setStatus('no_support', 'danger'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setStatus('cam_none', 'danger'); return; }
    busy = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false }).then(function (s) {
      busy = false; stream = s;
      var v = $('#video'); v.srcObject = s;
      var pl = v.play(); if (pl && pl.catch) pl.catch(function () { });
      setStatus('cam_on'); tick();
    }, function (e) {
      busy = false;
      var name = e && e.name;
      setStatus(name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError' ? 'cam_denied' : 'cam_none', 'danger');
    });
  }

  /* ---------------- picture ---------------- */
  function readFile(file) {
    if (!file) return;
    stopCam();
    if (!/^image\//.test(file.type || '') && !(!file.type && /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name || ''))) { setStatus('not_image', 'danger'); return; }
    if (!bd && !hasJsqr) { setStatus('no_support', 'danger'); return; }
    setStatus('reading');
    var url = URL.createObjectURL(file), img = new Image();
    img.onerror = function () { URL.revokeObjectURL(url); setStatus('not_image', 'danger'); };
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight, big = Math.max(w, h), sizes = [], i = 0;
      if (!w || !h) { URL.revokeObjectURL(url); setStatus('not_image', 'danger'); return; }
      /* try a few sizes: large photos are shrunk, tiny codes are enlarged */
      [Math.min(big, 1600), Math.min(big, 1000), Math.min(big, 600), big < 500 ? big * 2 : 0].forEach(function (x) { if (x && sizes.indexOf(x) < 0) sizes.push(x); });
      (function next() {
        if (i >= sizes.length) { URL.revokeObjectURL(url); setStatus('no_code', 'warning'); return; }
        detect(canvasOf(img, w, h, sizes[i++], true), true).then(function (r) {
          if (r) { URL.revokeObjectURL(url); setStatus(null); show(r); } else setTimeout(next, 0);
        });
      })();
    };
    img.src = url;
  }

  /* ---------------- events ---------------- */
  $('#btnCam').addEventListener('click', function () { bdReady.then(startCam); });
  $('#btnStop').addEventListener('click', function () { stopCam(); setStatus(null); });
  $('#btnPick').addEventListener('click', function () { $('#fileIn').click(); });
  $('#fileIn').addEventListener('change', function () {
    var f = this.files && this.files[0]; this.value = '';
    bdReady.then(function () { readFile(f); });
  });
  $('#keep').addEventListener('change', function () { keep = this.checked; store.set('keep', keep); renderHistory(); });
  $('#btnClear').addEventListener('click', function () {
    if (!confirm(t('clear_confirm'))) return;
    hist = []; store.remove('hist'); renderHistory();
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && stream) { stopCam(); setStatus(null); } });
  window.addEventListener('pagehide', stopCam);

  function renderAll() { renderStatus(); renderResult(); renderHistory(); }
  EDU.onLang(renderAll);
  renderAll();
  bdReady.then(renderStatus);
})();
