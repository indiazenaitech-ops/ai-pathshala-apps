/* Notice & Circular Maker. Everything runs on the device: no network calls, no uploads.
   The interface language (EDU.lang) and the notice language (st.nlang) are separate on purpose. */
(function () {
  'use strict';
  var SLUG = 'notice-circular-maker';
  var store = EDU.store(SLUG), $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t, C = window.APP_CONTENT;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  var TPL_KIND = ['notice', 'notice', 'circular', 'notice', 'notice', 'notice', 'circular'];
  var TPL_ORG = [0, 0, 0, 0, 1, 1, 2];                       // 0 school, 1 housing society, 2 office
  var REFS = ['SPS/2026/041', 'GPS/2026/017', 'RT/ADM/2026/09'];
  var SIZE_K = { s: 0.88, m: 1, l: 1.14 };
  var DEFAULTS = { nlang: '', nlangAuto: true, tpl: 0, orgType: 0, textPristine: true, orgPristine: true, org: '', addr: '', logo: '', ref: '', date: '',
    kind: 'notice', custom: '', subject: '', body: '', points: '', sign: '', desig: '', copy: '', size: 'm', border: true };
  var FIELDS = { org: 'org', addr: 'org', ref: 'org', sign: 'org', desig: 'org', copy: 'org', custom: 'text', subject: 'text', body: 'text', points: 'text' };
  var st, logoImg = null;

  function today() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function content() { return C[st.nlang] || C.en; }
  function fillText(i) {
    var T = content().templates[i] || content().templates[0];
    st.tpl = i; st.kind = TPL_KIND[i] || 'notice'; st.custom = ''; st.subject = T.subject; st.body = T.body; st.points = T.points.join('\n'); st.textPristine = true;
  }
  function fillOrg(k) {
    var o = content().orgs[k] || content().orgs[0];
    st.orgType = k; st.org = o.name; st.addr = o.addr; st.sign = o.sign; st.desig = o.desig; st.copy = content().copy.join('\n'); st.ref = REFS[k] || ''; st.orgPristine = true;
  }
  function fresh() {
    st = {}; for (var k in DEFAULTS) st[k] = DEFAULTS[k];
    st.nlang = C[EDU.lang] ? EDU.lang : 'en'; st.date = today();
    fillText(0); fillOrg(0);
  }
  function load() {
    var s = store.get('state', null);
    fresh();
    if (!s || typeof s !== 'object') return;
    for (var k in DEFAULTS) if (typeof s[k] === typeof DEFAULTS[k]) st[k] = s[k];
    if (!C[st.nlang]) st.nlang = 'en';
    if (!(st.tpl >= 0 && st.tpl < TPL_KIND.length)) st.tpl = 0;
    if (!(st.orgType >= 0 && st.orgType < 3)) st.orgType = 0;
    if (!SIZE_K[st.size]) st.size = 'm';
    if (['notice', 'circular', 'custom'].indexOf(st.kind) < 0) st.kind = 'notice';
    if (st.nlangAuto && st.nlang !== EDU.lang && C[EDU.lang]) followInterface();
  }
  function refill() { if (st.textPristine) fillText(st.tpl); if (st.orgPristine) fillOrg(st.orgType); }
  function followInterface() { st.nlang = EDU.lang; refill(); }

  /* ---------- the notice as plain data ---------- */
  function lines(s) { return String(s || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function fmtDate(iso, lang) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    try { return new Intl.DateTimeFormat(lang + '-IN-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(+m[1], +m[2] - 1, +m[3])); }
    catch (e) { return m[3] + '-' + m[2] + '-' + m[1]; }
  }
  function model() {
    var L = content().labels;
    var heading = st.kind === 'custom' ? st.custom.trim() : L[st.kind];
    return {
      rtl: EDU.langInfo(st.nlang).dir === 'rtl', L: L,
      org: st.org.trim(), addr: st.addr.trim(), ref: st.ref.trim(), date: fmtDate(st.date, st.nlang), heading: heading, subject: st.subject.trim(),
      paras: String(st.body || '').replace(/\s+$/, '').split(/\r?\n/).map(function (x) { return x.trim(); }),
      points: lines(st.points), sign: st.sign.trim(), desig: st.desig.trim(), copy: lines(st.copy)
    };
  }
  function buildText() {
    var m = model(), out = [];
    if (m.org) out.push(m.org);
    if (m.addr) out.push(m.addr);
    if (out.length) out.push('');
    var meta = [];
    if (m.ref) meta.push(m.L.ref + ': ' + m.ref);
    if (m.date) meta.push(m.L.date + ': ' + m.date);
    if (meta.length) out.push(meta.join('    '), '');
    if (m.heading) out.push(m.heading, '');
    if (m.subject) out.push(m.L.subject + ': ' + m.subject, '');
    if (m.paras.join('').length) { m.paras.forEach(function (p) { out.push(p); }); out.push(''); }
    if (m.points.length) { m.points.forEach(function (p) { out.push('• ' + p); }); out.push(''); }
    if (m.sign) out.push(m.sign);
    if (m.desig) out.push(m.desig);
    if (m.copy.length) { out.push('', m.L.copy + ':'); m.copy.forEach(function (c, i) { out.push((i + 1) + '. ' + c); }); }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  /* ---------- live A4 preview ---------- */
  function renderNotice() {
    var m = model(), box = $('#notice');
    box.setAttribute('lang', st.nlang);
    box.setAttribute('dir', m.rtl ? 'rtl' : 'ltr');
    box.className = 'a4 no-i18n sz-' + st.size + (st.border ? ' bordered' : '');
    var inn = el('div', { class: 'n-in' });
    if (m.org || m.addr || st.logo) {
      var head = el('div', { class: 'n-head' });
      if (st.logo) head.appendChild(el('img', { class: 'n-logo', src: st.logo, alt: '' }));
      if (m.org) head.appendChild(el('div', { class: 'n-org', text: m.org }));
      if (m.addr) head.appendChild(el('div', { class: 'n-addr', text: m.addr }));
      inn.appendChild(head);
      inn.appendChild(el('hr', { class: 'n-rule' }));
    }
    if (m.ref || m.date) {
      inn.appendChild(el('div', { class: 'n-meta' },
        el('span', { class: 'n-ref', text: m.ref ? m.L.ref + ': ' + m.ref : '' }),
        el('span', { class: 'n-date', text: m.date ? m.L.date + ': ' + m.date : '' })));
    }
    if (m.heading) inn.appendChild(el('div', { class: 'n-heading', text: m.heading }));
    if (m.subject) inn.appendChild(el('div', { class: 'n-subject', text: m.L.subject + ': ' + m.subject }));
    if (m.paras.join('').length) {
      var body = el('div', { class: 'n-body' });
      m.paras.forEach(function (p) { body.appendChild(el('p', { text: p || ' ' })); });
      inn.appendChild(body);
    }
    if (m.points.length) {
      var ul = el('ul', { class: 'n-points' });
      m.points.forEach(function (p) { ul.appendChild(el('li', { text: p })); });
      inn.appendChild(ul);
    }
    if (m.sign || m.desig) {
      inn.appendChild(el('div', { class: 'n-sign' },
        el('div', { class: 'n-sign-name', text: m.sign }), el('div', { class: 'n-sign-desig', text: m.desig })));
    }
    if (m.copy.length) {
      var ol = el('ol');
      m.copy.forEach(function (c) { ol.appendChild(el('li', { text: c })); });
      inn.appendChild(el('div', { class: 'n-copy' }, el('b', { text: m.L.copy + ':' }), ol));
    }
    box.innerHTML = '';
    box.appendChild(inn);
  }

  /* ---------- picture (PNG): the notice is drawn again on a canvas, 1240 px wide = A4 at 150 dpi ---------- */
  var seg = null;
  try { if (typeof Intl !== 'undefined' && Intl.Segmenter) seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' }); } catch (e) { seg = null; }
  function clusters(s) {
    if (!seg) return Array.from ? Array.from(s) : s.split('');
    var out = [], it = seg.segment(s)[Symbol.iterator](), x;
    while (!(x = it.next()).done) out.push(x.value.segment);
    return out;
  }
  function makeCanvas() {
    var m = model(), W = 1240, M = st.border ? 130 : 110, k = SIZE_K[st.size] || 1, rtl = m.rtl;
    var fam = (getComputedStyle($('#notice')).fontFamily || 'sans-serif');
    var lhMul = st.nlang === 'ur' ? 2.1 : 1.6;
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    cv.width = W; cv.height = 10;
    var ops = [], y = M, maxW = W - 2 * M;
    var xs = { start: rtl ? W - M : M, end: rtl ? M : W - M, center: W / 2 };
    function font(px, bold) { return (bold ? '700 ' : '400 ') + Math.round(px * k) + 'px ' + fam; }
    function setup(c, f) { c.font = f; try { c.direction = rtl ? 'rtl' : 'ltr'; } catch (e) { } c.textBaseline = 'middle'; }
    function wrap(text, f, width) {
      setup(ctx, f);
      var out = [], cur = '';
      String(text).split(/\s+/).filter(Boolean).forEach(function (word) {
        var tryLine = cur ? cur + ' ' + word : word;
        if (ctx.measureText(tryLine).width <= width) { cur = tryLine; return; }
        if (cur) { out.push(cur); cur = ''; }
        if (ctx.measureText(word).width <= width) { cur = word; return; }
        clusters(word).forEach(function (g) {                 // one very long word: break it between letters
          if (cur && ctx.measureText(cur + g).width > width) { out.push(cur); cur = ''; }
          cur += g;
        });
      });
      if (cur) out.push(cur);
      return out;
    }
    function text(str, px, bold, align, opts) {
      opts = opts || {};
      var f = font(px, bold), lh = Math.round(px * k * lhMul), indent = opts.indent || 0;
      var x = align === 'start' ? xs.start + (rtl ? -indent : indent) : xs[align];
      wrap(str, f, (maxW - indent) * 0.97).forEach(function (line, i) {
        ops.push({ t: line, f: f, align: align, x: x, y: y + lh / 2, color: opts.color || '#111', underline: opts.underline, px: px * k });
        if (opts.bullet && i === 0) ops.push({ t: opts.bullet, f: f, align: 'start', x: xs.start, y: y + lh / 2, color: '#111' });
        y += lh;
      });
    }
    if (logoImg && st.logo) {
      var lh0 = 150, lw = Math.min(420, logoImg.width * lh0 / (logoImg.height || 1)); lh0 = lw * logoImg.height / (logoImg.width || 1);
      ops.push({ img: logoImg, x: (W - lw) / 2, y: y, w: lw, h: lh0 }); y += lh0 + 14;
    }
    if (m.org) text(m.org, 46, true, 'center');
    if (m.addr) text(m.addr, 25, false, 'center', { color: '#333' });
    if (m.org || m.addr || (logoImg && st.logo)) { y += 14; ops.push({ rule: true, y: y }); y += 26; }
    if (m.ref || m.date) {
      var f0 = font(25, false), lh1 = Math.round(25 * k * lhMul);
      setup(ctx, f0);
      var a = m.ref ? m.L.ref + ': ' + m.ref : '', b = m.date ? m.L.date + ': ' + m.date : '';
      if (a && b && ctx.measureText(a).width + ctx.measureText(b).width + 40 > maxW) { text(a, 25, false, 'start'); text(b, 25, false, 'start'); }
      else {
        if (a) ops.push({ t: a, f: f0, align: 'start', x: xs.start, y: y + lh1 / 2, color: '#111' });
        if (b) ops.push({ t: b, f: f0, align: 'end', x: xs.end, y: y + lh1 / 2, color: '#111' });
        y += lh1;
      }
    }
    if (m.heading) { y += 30; text(m.heading, 42, true, 'center', { underline: st.nlang !== 'ur' }); y += 26; }
    if (m.subject) { text(m.L.subject + ': ' + m.subject, 28, true, 'start'); y += 18; }
    if (m.paras.join('').length) m.paras.forEach(function (p) { if (p) { text(p, 28, false, 'start'); y += 14; } else y += 22; });
    if (m.points.length) { m.points.forEach(function (p) { text(p, 28, false, 'start', { indent: 44, bullet: '•' }); y += 6; }); y += 10; }
    if (m.sign || m.desig) {
      y += 110;
      if (m.sign) text(m.sign, 28, true, 'end');
      if (m.desig) text(m.desig, 26, false, 'end');
    }
    if (m.copy.length) {
      y += 44;
      text(m.L.copy + ':', 25, true, 'start');
      m.copy.forEach(function (c, i) { text((i + 1) + '. ' + c, 25, false, 'start'); });
    }
    var H = Math.max(1754, Math.ceil(y + M));
    cv.width = W; cv.height = H;
    try { cv.setAttribute('dir', rtl ? 'rtl' : 'ltr'); } catch (e) { }
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    if (st.border) { ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.strokeRect(46, 46, W - 92, H - 92); }
    ops.forEach(function (o) {
      if (o.img) { try { ctx.drawImage(o.img, o.x, o.y, o.w, o.h); } catch (e) { } return; }
      if (o.rule) { ctx.fillStyle = '#111'; ctx.fillRect(M, o.y, maxW, 4); return; }
      setup(ctx, o.f); ctx.textAlign = o.align; ctx.fillStyle = o.color;
      ctx.fillText(o.t, o.x, o.y);
      if (o.underline) { var w = ctx.measureText(o.t).width; ctx.fillRect(o.x - w / 2, o.y + o.px * 0.62, w, Math.max(2, o.px * 0.06)); }
    });
    return cv;
  }
  function whenFontsReady() {
    return (document.fonts && document.fonts.ready && document.fonts.ready.then) ? document.fonts.ready.catch(function () { }) : Promise.resolve();
  }

  /* ---------- logo (stays on the device) ---------- */
  function setLogo(dataUrl) {
    st.logo = dataUrl || '';
    logoImg = null;
    if (st.logo) { var im = new Image(); im.onload = function () { logoImg = im; }; im.onerror = function () { st.logo = ''; render(); }; im.src = st.logo; }
  }
  function pickLogo() {
    EDU.pickFile('image/png,image/jpeg,image/webp,image/gif,image/svg+xml').then(function (file) {
      if (!file) return;
      if (!/^image\//.test(file.type || '')) { EDU.toast(t('logo_bad')); return; }
      var fr = new FileReader();
      fr.onerror = function () { EDU.toast(t('logo_bad')); };
      fr.onload = function () {
        var im = new Image();
        im.onerror = function () { EDU.toast(t('logo_bad')); };
        im.onload = function () {
          var max = 420, w = im.naturalWidth || im.width || max, h = im.naturalHeight || im.height || max, r = Math.min(1, max / Math.max(w, h));
          var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * r)); cv.height = Math.max(1, Math.round(h * r));
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
          var url; try { url = cv.toDataURL('image/png'); } catch (e) { url = ''; }
          if (!url) { EDU.toast(t('logo_bad')); return; }
          setLogo(url); st.orgPristine = false; render();
        };
        im.src = String(fr.result);
      };
      fr.readAsDataURL(file);
    });
  }

  /* ---------- form ---------- */
  function pressed(sel, attr, val) { $$(sel + ' button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === String(val))); }); }
  function renderChips() {
    var box = $('#tpl-chips'), names = (C[EDU.lang] || C.en).templates;
    box.innerHTML = '';
    names.forEach(function (T, i) {
      box.appendChild(el('button', { type: 'button', class: 'chip', dataset: { tpl: i }, 'aria-pressed': String(st.textPristine && st.tpl === i), text: T.name }));
    });
  }
  function renderLangSelect() {
    var sel = $('#f-nlang');
    if (!sel.options.length) EDU.LANGS.forEach(function (l) { sel.appendChild(el('option', { value: l.code, text: l.native })); });
    sel.value = st.nlang;
  }
  function syncForm() {
    Object.keys(FIELDS).forEach(function (k) { var i = $('#f-' + k); if (i.value !== st[k]) i.value = st[k]; });
    if ($('#f-date').value !== st.date) $('#f-date').value = st.date;
    pressed('#f-kind', 'data-kind', st.kind);
    pressed('#f-size', 'data-size', st.size);
    $('#wrap-custom').hidden = st.kind !== 'custom';
    $('#opt-border').checked = st.border;
    $('#sample-note').hidden = !st.orgPristine;
    $('#logo-thumb').hidden = !st.logo; if (st.logo) $('#logo-thumb').src = st.logo;
    $('#btn-logo-remove').hidden = !st.logo;
  }
  function render() {
    renderChips(); renderLangSelect(); syncForm(); renderNotice();
    store.set('state', st);
  }

  Object.keys(FIELDS).forEach(function (k) {
    $('#f-' + k).addEventListener('input', function () {
      st[k] = this.value;
      if (FIELDS[k] === 'org') st.orgPristine = false; else st.textPristine = false;
      $('#sample-note').hidden = !st.orgPristine;
      $$('#tpl-chips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(st.textPristine && +c.dataset.tpl === st.tpl)); });
      renderNotice(); store.set('state', st);
    });
  });
  $('#f-date').addEventListener('input', function () { st.date = this.value; renderNotice(); store.set('state', st); });
  $('#f-kind').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    st.kind = b.getAttribute('data-kind'); render();
    if (st.kind === 'custom') $('#f-custom').focus();
  });
  $('#f-size').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; st.size = b.getAttribute('data-size'); render(); });
  $('#opt-border').addEventListener('change', function () { st.border = this.checked; render(); });
  $('#f-nlang').addEventListener('change', function () { st.nlang = C[this.value] ? this.value : 'en'; st.nlangAuto = false; refill(); render(); });
  $('#tpl-chips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    if (!st.textPristine && (st.subject.trim() || st.body.trim() || st.points.trim()) && !confirm(t('confirm_replace'))) return;
    var i = +b.dataset.tpl;
    fillText(i);
    if (st.orgPristine) fillOrg(TPL_ORG[i]);
    render();
  });
  $('#btn-logo').addEventListener('click', pickLogo);
  $('#btn-logo-remove').addEventListener('click', function () { setLogo(''); render(); });
  $('#btn-pdf').addEventListener('click', function () { renderNotice(); setTimeout(function () { try { window.print(); } catch (e) { } }, 60); });
  $('#btn-png').addEventListener('click', function () {
    whenFontsReady().then(function () {
      var cv = makeCanvas();
      cv.toBlob(function (b) { if (!b) return; EDU.download('notice.png', b, 'image/png'); EDU.toast(t('png_done')); }, 'image/png');
    });
  });
  $('#btn-copy').addEventListener('click', function () { EDU.copy(buildText()); });
  $('#btn-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state'); logoImg = null; fresh(); render();
  });

  EDU.onLang(function () { if (st.nlangAuto && C[EDU.lang]) followInterface(); render(); });
  load();
  if (st.logo) setLogo(st.logo);
  window.NCM_APP = { state: function () { return st; }, text: buildText, canvas: makeCanvas, model: model };
  render();
})();
