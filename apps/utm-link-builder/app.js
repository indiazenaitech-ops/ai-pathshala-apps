/* UTM Campaign Link Builder
   - adds utm_* tags to a web link with the URL API: keeps existing query params exactly, replaces old utm_* values,
     keeps the #fragment at the end, adds https:// when missing, refuses mailto/tel/sms/whatsapp links
   - presets for Indian channels (WhatsApp, Instagram, YouTube, posters, Google Ads, Meta Ads ...)
   - naming clean-up (lowercase, no spaces) with warnings, campaign-name pattern helper
   - many links: one link x many channels, or a pasted / imported CSV list -> table -> CSV
   - history with notes, exported as the team's naming sheet; QR code via local qr.js
   Nothing leaves the device: everything is computed here and saved with EDU.store. */
(function () {
  'use strict';
  var SLUG = 'utm-link-builder';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  var FIELDS = ['source', 'medium', 'campaign', 'id', 'term', 'content', 'source_platform', 'creative_format', 'marketing_tactic'];
  var INPUT_ID = { source: 'f-source', medium: 'f-medium', campaign: 'f-campaign', id: 'f-id', term: 'f-term', content: 'f-content',
    source_platform: 'f-source-platform', creative_format: 'f-creative-format', marketing_tactic: 'f-marketing-tactic' };
  var LONG_URL = 2000, MAX_ROWS = 500, MAX_HIST = 300;

  /* channel presets: s source, m medium, c content, p source platform, x extra fields */
  var CHANNELS = [
    { id: 'wa_status', ic: '🟢', s: 'whatsapp', m: 'social', c: 'status' },
    { id: 'wa_group', ic: '👥', s: 'whatsapp', m: 'social', c: 'group' },
    { id: 'wa_bc', ic: '📣', s: 'whatsapp', m: 'social', c: 'broadcast' },
    { id: 'ig_bio', ic: '📸', s: 'instagram', m: 'social', c: 'bio' },
    { id: 'ig_story', ic: '⭕', s: 'instagram', m: 'social', c: 'story' },
    { id: 'ig_reel', ic: '🎞️', s: 'instagram', m: 'social', c: 'reel' },
    { id: 'yt_desc', ic: '▶️', s: 'youtube', m: 'video', c: 'description' },
    { id: 'yt_pin', ic: '📌', s: 'youtube', m: 'video', c: 'pinned-comment' },
    { id: 'yt_shorts', ic: '📱', s: 'youtube', m: 'video', c: 'shorts' },
    { id: 'fb', ic: '👍', s: 'facebook', m: 'social', c: 'post' },
    { id: 'li', ic: '💼', s: 'linkedin', m: 'social', c: 'post' },
    { id: 'x', ic: '✖️', s: 'twitter', m: 'social', c: 'post' },
    { id: 'email', ic: '✉️', s: 'newsletter', m: 'email', c: '' },
    { id: 'sms', ic: '💬', s: 'sms', m: 'sms', c: '' },
    { id: 'qr', ic: '🔳', s: 'poster', m: 'qr', c: 'counter' },
    { id: 'gads', ic: '🔎', s: 'google', m: 'cpc', c: '', p: 'google-ads', note: 'note_gads' },
    { id: 'meta', ic: '📢', s: '{{site_source_name}}', m: 'paid-social', c: '{{ad.name}}', p: 'meta', note: 'note_meta',
      x: { campaign: '{{campaign.name}}', term: '{{adset.name}}', id: '{{campaign.id}}' } }
  ];
  CHANNELS.forEach(function (c) { if (c.id === 'qr') c.note = 'note_qr'; if (c.id === 'email') c.note = 'note_email'; });
  function chById(id) { for (var i = 0; i < CHANNELS.length; i++) if (CHANNELS[i].id === id) return CHANNELS[i]; return null; }

  /* ------------------------------------------------------------ state */
  function str(v, d) { return typeof v === 'string' ? v : d; }
  var saved = store.get('state', null);
  if (!saved || typeof saved !== 'object') saved = {};
  var now = new Date();
  var S = {
    tab: ['single', 'bulk', 'history'].indexOf(saved.tab) >= 0 ? saved.tab : 'single',
    url: str(saved.url, 'https://yourshop.in/diwali-offer'),
    ch: str(saved.ch, 'wa_status'),
    f: {},
    clean: typeof saved.clean === 'boolean' ? saved.clean : true,
    sep: saved.sep === '_' ? '_' : '-',
    tpl: str(saved.tpl, '{yyyy}-{mm}_{product}_{offer}'),
    nm: saved.nm && typeof saved.nm === 'object' ? saved.nm : {},
    mode: saved.mode === 'csv' ? 'csv' : 'matrix',
    picks: Array.isArray(saved.picks) ? saved.picks.filter(chById) : ['wa_status', 'wa_group', 'ig_story', 'qr'],
    csv: str(saved.csv, ''),
    prevCampaign: str(saved.prevCampaign, ''),
    loadedFrom: str(saved.loadedFrom, '')
  };
  var sf = saved.f && typeof saved.f === 'object' ? saved.f : null;
  FIELDS.forEach(function (k) { S.f[k] = sf ? str(sf[k], '') : ''; });
  if (!sf) { S.f.source = 'whatsapp'; S.f.medium = 'social'; S.f.content = 'status'; S.f.campaign = 'diwali-sale-' + now.getFullYear(); }
  var hist = store.get('hist', []);
  if (!Array.isArray(hist)) hist = [];
  var urlNote = null;          // {key, vars} shown once after loading tags from a pasted link

  function save() {
    store.set('state', { tab: S.tab, url: S.url, ch: S.ch, f: S.f, clean: S.clean, sep: S.sep, tpl: S.tpl, nm: S.nm,
      mode: S.mode, picks: S.picks, csv: S.csv, prevCampaign: S.prevCampaign, loadedFrom: S.loadedFrom });
  }
  function saveHist() { store.set('hist', hist.slice(0, MAX_HIST)); }

  /* ------------------------------------------------------------ core: clean + URL */
  /* ad-platform placeholders the platform fills in later: Meta {{campaign.name}}, Google Ads ValueTrack {keyword} */
  function isDyn(v) { return /\{\{[^}]*\}\}|\{[a-z_][\w:.\-]*\}/i.test(v); }
  function cleanVal(v, sep) {
    v = String(v == null ? '' : v).trim();
    if (!v) return '';
    if (isDyn(v)) return v.replace(/\s+/g, '');
    v = v.toLowerCase().replace(/[\s]+/g, sep);
    v = v.replace(/[^\p{L}\p{M}\p{N}\-_.]+/gu, sep);
    var re = sep === '-' ? /[-_]*-[-_]*/g : /[-_]*_[-_]*/g;        // "A - B" with _ gives a_b, not a_-_b
    return v.replace(re, sep).replace(/^[-_.]+|[-_.]+$/g, '');
  }
  function enc(v) {
    var e = encodeURIComponent(v);
    return isDyn(v) ? e.replace(/%7B/gi, '{').replace(/%7D/gi, '}') : e;
  }
  function finalTags(tags, clean, sep) {
    var out = [];
    FIELDS.forEach(function (k) {
      var v = tags[k] == null ? '' : String(tags[k]);
      v = clean ? cleanVal(v, sep) : v.trim();
      if (v) out.push({ k: 'utm_' + k, v: v });
    });
    return out;
  }

  /* parseUrl(raw) -> {ok, err, url(URL), fixed, http, puny, utm:{k:v}, kept:[raw pairs]} */
  function parseUrl(raw) {
    var r = { ok: false, err: null, fixed: false };
    var s = String(raw == null ? '' : raw).trim();
    if (!s) { r.err = 'st_empty'; return r; }
    if (/^(mailto|tel|sms|smsto|whatsapp|javascript|data|ftp|file|intent|upi|geo):/i.test(s)) { r.err = 'st_notweb'; return r; }
    if (/^\/\//.test(s)) { s = 'https:' + s; r.fixed = true; }
    else if (!/^[a-z][a-z0-9+.\-]*:\/\//i.test(s)) { s = 'https://' + s.replace(/^\/+/, ''); r.fixed = true; }
    var u;
    try { u = new URL(s); } catch (e) { r.err = 'st_bad'; return r; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') { r.err = 'st_notweb'; return r; }
    var h = u.hostname;
    if (!h || (h.indexOf('.') < 0 && h !== 'localhost') || /\s/.test(s) || /\.$/.test(h.replace(/\.$/, '')) || /^\.|\.\./.test(h)) { r.err = 'st_bad'; return r; }
    r.ok = true; r.url = u; r.http = u.protocol === 'http:';
    r.puny = /(^|\.)xn--/.test(h) && !/(^|\.)xn--/i.test(s);
    r.utm = {}; r.kept = [];
    var q = u.search.replace(/^\?/, '');
    if (q) q.split('&').forEach(function (pair) {
      if (!pair) return;
      var i = pair.indexOf('='), k = i < 0 ? pair : pair.slice(0, i), v = i < 0 ? '' : pair.slice(i + 1);
      var dk; try { dk = decodeURIComponent(k.replace(/\+/g, ' ')); } catch (e) { dk = k; }
      if (/^utm_/i.test(dk)) {
        var dv; try { dv = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { dv = v; }
        r.utm[dk.toLowerCase().slice(4)] = dv;
      } else r.kept.push(pair);
    });
    return r;
  }

  /* build(rawUrl, tags, opts) -> {ok, err, link, params, parts, p(parse result)} */
  function build(rawUrl, tags, clean, sep) {
    var p = parseUrl(rawUrl);
    if (!p.ok) return { ok: false, err: p.err, p: p };
    var u = p.url, tg = finalTags(tags, clean, sep);
    var utmPairs = tg.map(function (x) { return x.k + '=' + enc(x.v); });
    var all = p.kept.concat(utmPairs);
    var base = u.protocol + '//' + u.host + u.pathname;
    var link = base + (all.length ? '?' + all.join('&') : '') + u.hash;
    return { ok: true, link: link, params: utmPairs.join('&'), base: base, kept: p.kept, utm: utmPairs, hash: u.hash, p: p, tags: tg };
  }

  /* ------------------------------------------------------------ helpers */
  function statusP(cls, key, vars) { return el('p', { class: 'status ' + cls, text: t(key, vars) }); }
  function fill(node, kids) { node.textContent = ''; (kids || []).forEach(function (k) { if (k) node.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); }); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function dmy(iso) { var d = new Date(iso); if (isNaN(d)) return ''; return pad2(d.getDate()) + '-' + pad2(d.getMonth() + 1) + '-' + d.getFullYear(); }
  function iconBtn(sym, labelKey, onclick) {
    var b = el('button', { type: 'button', class: 'edu-iconbtn', 'aria-label': t(labelKey), title: t(labelKey), onclick: onclick }, sym);
    b.setAttribute('data-i18n-aria-label', labelKey); b.setAttribute('data-i18n-title', labelKey);
    return b;
  }

  /* ------------------------------------------------------------ tabs */
  var TABS = ['single', 'bulk', 'history'];
  function showTab(name, focus) {
    S.tab = name; save();
    TABS.forEach(function (n) {
      var b = $('#tab-' + n), on = n === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
      $('#p-' + n).hidden = !on;
      if (on && focus) b.focus();
    });
    if (name === 'bulk') renderBulk();
    if (name === 'history') renderHist();
  }
  $$('#tabs [role=tab]').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var i = TABS.indexOf(b.dataset.tab), rtl = document.documentElement.dir === 'rtl', d = 0;
      if (e.key === 'ArrowRight') d = rtl ? -1 : 1; else if (e.key === 'ArrowLeft') d = rtl ? 1 : -1;
      else if (e.key === 'Home') { e.preventDefault(); showTab(TABS[0], true); return; }
      else if (e.key === 'End') { e.preventDefault(); showTab(TABS[2], true); return; }
      if (d) { e.preventDefault(); showTab(TABS[(i + d + 3) % 3], true); }
    });
  });

  /* ------------------------------------------------------------ single link */
  var urlIn = $('#url');
  function renderChips() {
    fill($('#chips'), CHANNELS.map(function (c) {
      return el('button', { type: 'button', class: 'chip', 'aria-pressed': S.ch === c.id ? 'true' : 'false', dataset: { ch: c.id },
        onclick: function () { pickChannel(c.id); } }, el('span', { class: 'ic', 'aria-hidden': 'true' }, c.ic), el('span', { text: t('ch_' + c.id) }));
    }));
    var c = chById(S.ch), note = $('#chNote');
    if (c && c.note) { note.hidden = false; note.textContent = t(c.note); } else note.hidden = true;
  }
  function pickChannel(id) {
    var c = chById(id); if (!c) return;
    var was = chById(S.ch);
    if (was && was.x && isDyn(S.f.campaign)) { S.f.campaign = S.prevCampaign || ''; S.f.term = ''; S.f.id = ''; }
    if (c.x && !isDyn(S.f.campaign)) S.prevCampaign = S.f.campaign;
    S.ch = id;
    S.f.source = c.s; S.f.medium = c.m; S.f.content = c.c || '';
    S.f.source_platform = c.p || '';
    if (c.x) Object.keys(c.x).forEach(function (k) { S.f[k] = c.x[k]; });
    FIELDS.forEach(function (k) { $('#' + INPUT_ID[k]).value = S.f[k]; });
    save(); renderChips(); update();
  }
  function matchChannel() {
    var hit = null;
    CHANNELS.forEach(function (c) { if (!hit && c.s === S.f.source && c.m === S.f.medium && (c.c || '') === S.f.content) hit = c.id; });
    if (hit !== S.ch) { S.ch = hit || ''; renderChips(); }
  }

  function renderNotes() {
    FIELDS.forEach(function (k) {
      var raw = S.f[k], n = $('#n-' + k), kids = [];
      if (raw && !isDyn(raw)) {
        if (S.clean) {
          var c = cleanVal(raw, S.sep);
          if (c !== raw.trim()) kids.push(el('span', { class: 'ok', text: t('used_as') }), ' ', el('bdi', { class: 'no-i18n', dir: 'ltr', text: c }));
        } else {
          if (/[A-Z]/.test(raw)) kids.push(el('span', { class: 'warn', text: '⚠ ' + t('warn_case') }));
          if (/\s/.test(raw.trim())) { if (kids.length) kids.push(el('br')); kids.push(el('span', { class: 'warn', text: '⚠ ' + t('warn_space') })); }
        }
      }
      fill(n, kids);
    });
  }

  var current = null;
  function update() {
    renderNotes();
    var r = build(S.url, S.f, S.clean, S.sep);
    current = r;
    var us = [];
    if (!r.ok) us.push(statusP(r.err === 'st_empty' ? 'info' : 'bad', r.err));
    else {
      us.push(statusP('ok', r.p.fixed ? 'st_fixed' : 'st_ok'));
      if (urlNote) us.push(statusP('info', urlNote.key, urlNote.vars));
      else if (Object.keys(r.p.utm).length) us.push(statusP('info', 'st_replaced'));
      if (r.p.http) us.push(statusP('warn', 'st_http'));
      if (r.p.puny) us.push(statusP('info', 'st_puny'));
      if (r.hash) us.push(statusP('info', 'st_hash'));
    }
    fill($('#urlStatus'), us);

    var out = $('#linkOut'), open = $('#openLink'), badge = $('#lenBadge'), rs = [];
    if (r.ok) {
      out.value = r.link;
      open.href = r.link; open.removeAttribute('aria-disabled'); open.tabIndex = 0;
      badge.hidden = false; badge.textContent = t('res_len', { n: EDU.fmt(r.link.length) });
      if (!String(S.f.source).trim()) rs.push(statusP('bad', 'err_source'));
      else {
        var miss = [];
        if (!String(S.f.medium).trim()) miss.push(t('f_medium'));
        if (!String(S.f.campaign).trim()) miss.push(t('f_campaign'));
        if (miss.length) rs.push(statusP('warn', 'warn_fill', { list: miss.join(', ') }));
      }
      if (r.link.length > LONG_URL) rs.push(statusP('warn', 'st_long', { n: EDU.fmt(r.link.length) }));
    } else {
      out.value = '';
      open.removeAttribute('href'); open.setAttribute('aria-disabled', 'true'); open.tabIndex = -1;
      badge.hidden = true;
      rs.push(statusP('info', 'no_link'));
    }
    fill($('#resStatus'), rs);
    ['copyLink', 'copyParams', 'saveHist'].forEach(function (id) { $('#' + id).disabled = !r.ok; });
    renderAnat(r);
    renderQr();
    if (S.tab === 'bulk') renderBulk();
  }

  function renderAnat(r) {
    var a = $('#anat');
    if (!r.ok) { fill(a, [el('span', { class: 'sep', text: '—' })]); return; }
    var kids = [el('span', { class: 'base', text: r.base })], first = true;
    function add(pair, cls) {
      kids.push(el('span', { class: 'sep', text: first ? '?' : '&' })); first = false;
      kids.push(el('span', { class: cls, text: pair }));
    }
    r.kept.forEach(function (p) { add(p, 'keep'); });
    r.utm.forEach(function (p) { add(p, 'utm'); });
    if (r.hash) kids.push(el('span', { class: 'frag', text: r.hash }));
    fill(a, kids);
  }

  function renderQr() {
    var box = $('#qrBox'), cv = $('#qr'), msg = $('#qrMsg');
    if (!box.open) return;
    var ok = current && current.ok && window.QRGen;
    var q = ok ? QRGen.encode(current.link, 'M') : null;
    if (!q || !q.ok) {
      cv.width = 1; cv.height = 1; cv.dataset.ok = '0';
      msg.textContent = t(ok ? 'qr_long' : 'no_link'); msg.removeAttribute('data-i18n');
      $('#qrDl').disabled = true; return;
    }
    var quiet = 4, scale = Math.max(4, Math.floor(800 / (q.size + quiet * 2))), dim = (q.size + quiet * 2) * scale;
    cv.width = dim; cv.height = dim;
    var g = cv.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, dim, dim); g.fillStyle = '#000000';
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.modules[y][x]) g.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
    cv.dataset.ok = '1'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', current.link);
    msg.setAttribute('data-i18n', 'qr_hint'); msg.textContent = t('qr_hint');
    $('#qrDl').disabled = false;
  }
  $('#qrBox').addEventListener('toggle', renderQr);
  $('#qrDl').addEventListener('click', function () { if ($('#qr').dataset.ok === '1') EDU.downloadCanvas($('#qr'), 'utm-qr-' + (cleanVal(S.f.campaign, '-') || 'link') + '.png'); });

  function onUrlInput() {
    S.url = urlIn.value; urlNote = null;
    var p = parseUrl(S.url);
    if (p.ok) {
      var keys = Object.keys(p.utm).filter(function (k) { return FIELDS.indexOf(k) >= 0 && p.utm[k] !== ''; });
      if (keys.length && S.loadedFrom !== S.url) {
        S.loadedFrom = S.url;
        FIELDS.forEach(function (k) { S.f[k] = p.utm[k] !== undefined ? p.utm[k] : ''; $('#' + INPUT_ID[k]).value = S.f[k]; });
        urlNote = { key: 'st_loaded', vars: { n: keys.length } };
        matchChannel();
      }
    }
    save(); update();
  }
  urlIn.addEventListener('input', onUrlInput);
  FIELDS.forEach(function (k) {
    var inp = $('#' + INPUT_ID[k]);
    inp.addEventListener('input', function () { S.f[k] = inp.value; save(); if (k === 'source' || k === 'medium' || k === 'content') matchChannel(); update(); });
    inp.addEventListener('blur', function () {
      if (S.clean && inp.value && !isDyn(inp.value)) { var c = cleanVal(inp.value, S.sep); if (c !== inp.value) { inp.value = c; S.f[k] = c; save(); update(); } }
    });
  });
  $('#cleanOn').addEventListener('change', function () { S.clean = this.checked; save(); update(); });
  function renderSep() { $$('#sep button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === S.sep ? 'true' : 'false'); }); }
  $$('#sep button').forEach(function (b) { b.addEventListener('click', function () { S.sep = b.dataset.v; save(); renderSep(); renderName(); update(); }); });

  /* copy / open / save */
  $('#copyLink').addEventListener('click', function () { if (current && current.ok) EDU.copy(current.link); });
  $('#copyParams').addEventListener('click', function () {
    if (!current || !current.ok) return;
    EDU.copy(current.params).then(function () { EDU.toast(t('copied_params')); });
  });
  function histEntry(r, tags, note) {
    var tg = {}; r.tags.forEach(function (x) { tg[x.k.slice(4)] = x.v; });
    return { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: new Date().toISOString(),
      url: r.p.url.href.split('?')[0].split('#')[0], link: r.link, f: tg, note: note || '' };
  }
  function addHist(entry) {
    for (var i = 0; i < hist.length; i++) if (hist[i].link === entry.link) return false;
    hist.unshift(entry); if (hist.length > MAX_HIST) hist.length = MAX_HIST; return true;
  }
  $('#saveHist').addEventListener('click', function () {
    if (!current || !current.ok) return;
    var ok = addHist(histEntry(current, S.f, ''));
    saveHist(); EDU.toast(t(ok ? 'saved_hist' : 'already_saved'));
  });

  /* ------------------------------------------------------------ campaign-name helper */
  var TOKS = ['yyyy', 'mm', 'dd', 'product', 'offer', 'place'];
  var tplIn = $('#nameTpl');
  function nameValue() {
    var d = new Date(), sep = S.sep;
    var map = { yyyy: String(d.getFullYear()), mm: pad2(d.getMonth() + 1), dd: pad2(d.getDate()),
      product: cleanVal(S.nm.product || '', sep), offer: cleanVal(S.nm.offer || '', sep), place: cleanVal(S.nm.place || '', sep) };
    var v = String(S.tpl || '').replace(/\{(\w+)\}/g, function (m, k) { return map[k] !== undefined ? map[k] : ''; });
    v = cleanVal(v, sep).replace(/([-_])[-_]+/g, '$1');
    return v;
  }
  function renderName() {
    var v = nameValue();
    $('#nameOut').textContent = v || '—';
    $('#nameUse').disabled = !v;
  }
  function renderTokBar() {
    var bar = $('#tokBar');
    $$('button', bar).forEach(function (b) { b.remove(); });
    TOKS.forEach(function (k) {
      bar.appendChild(el('button', { type: 'button', class: 'btn btn-sm', onclick: function () {
        var s = tplIn.selectionStart == null ? tplIn.value.length : tplIn.selectionStart, e2 = tplIn.selectionEnd == null ? s : tplIn.selectionEnd;
        var ins = '{' + k + '}';
        tplIn.value = tplIn.value.slice(0, s) + ins + tplIn.value.slice(e2);
        tplIn.focus(); tplIn.setSelectionRange(s + ins.length, s + ins.length);
        S.tpl = tplIn.value; save(); renderName();
      } }, t('tok_' + k)));
    });
  }
  tplIn.addEventListener('input', function () { S.tpl = tplIn.value; save(); renderName(); });
  [['nameProduct', 'product'], ['nameOffer', 'offer'], ['namePlace', 'place']].forEach(function (p) {
    var inp = $('#' + p[0]);
    inp.addEventListener('input', function () { S.nm[p[1]] = inp.value; save(); renderName(); });
  });
  $('#nameUse').addEventListener('click', function () {
    var v = nameValue(); if (!v) return;
    S.f.campaign = v; $('#f-campaign').value = v; save(); update();
    $('#f-campaign').focus();
  });

  /* ------------------------------------------------------------ bulk */
  var bulkRows = [];
  function renderBulkMode() {
    $$('#bulkMode button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === S.mode ? 'true' : 'false'); });
    $('#matrixCard').hidden = S.mode !== 'matrix';
    $('#csvCard').hidden = S.mode !== 'csv';
  }
  $$('#bulkMode button').forEach(function (b) { b.addEventListener('click', function () { S.mode = b.dataset.v; save(); renderBulkMode(); renderBulk(); }); });
  function renderPicks() {
    fill($('#pickChips'), CHANNELS.map(function (c) {
      var on = S.picks.indexOf(c.id) >= 0;
      return el('button', { type: 'button', class: 'chip', 'aria-pressed': on ? 'true' : 'false', dataset: { ch: c.id }, onclick: function () {
        var i = S.picks.indexOf(c.id);
        if (i >= 0) S.picks.splice(i, 1); else S.picks.push(c.id);
        save(); renderPicks(); renderBulk();
      } }, el('span', { class: 'ic', 'aria-hidden': 'true' }, c.ic), el('span', { text: t('ch_' + c.id) }));
    }));
  }
  $('#pickAll').addEventListener('click', function () { S.picks = CHANNELS.map(function (c) { return c.id; }); save(); renderPicks(); renderBulk(); });
  $('#pickNone').addEventListener('click', function () { S.picks = []; save(); renderPicks(); renderBulk(); });

  var COLMAP = { link: 'url', url: 'url', page: 'url', website: 'url', source: 'source', medium: 'medium', campaign: 'campaign', name: 'campaign',
    term: 'term', keyword: 'term', content: 'content', id: 'id', note: 'note', notes: 'note', comment: 'note',
    source_platform: 'source_platform', creative_format: 'creative_format', marketing_tactic: 'marketing_tactic' };
  var POS = ['url', 'source', 'medium', 'campaign', 'term', 'content', 'note'];
  function headerKey(cell) {
    var h = String(cell || '').trim().toLowerCase().replace(/^utm[_ -]?/, '').replace(/[\s-]+/g, '_');
    return COLMAP[h] || null;
  }
  function csvItems() {
    var rows = EDU.csv.parse(S.csv || '');
    if (!rows.length) return { items: [], cut: false };
    var cols = POS, start = 0;
    var hk = rows[0].map(headerKey);
    if (hk.filter(Boolean).length >= 2 || hk[0] === 'url') { cols = hk; start = 1; }
    var cut = rows.length - start > MAX_ROWS;
    var items = rows.slice(start, start + MAX_ROWS).map(function (r) {
      var o = { f: {} };
      cols.forEach(function (c, i) { if (!c) return; var v = (r[i] || '').trim(); if (c === 'url') o.url = v; else if (c === 'note') o.note = v; else o.f[c] = v; });
      return o;
    }).filter(function (o) { return o.url || Object.keys(o.f).some(function (k) { return o.f[k]; }); });
    return { items: items, cut: cut };
  }
  function renderBulk() {
    var msg = $('#bulkMsg'), empty = $('#bulkEmpty'), tbl = $('#bulkTable');
    bulkRows = []; msg.hidden = true; empty.hidden = true;
    var isM = S.mode === 'matrix';
    if (isM) {
      var mb = $('#matrixBase'), r0 = parseUrl(S.url);
      mb.hidden = !r0.ok; if (r0.ok) mb.textContent = r0.url.href.split('#')[0].split('?')[0];
      if (!r0.ok) { empty.hidden = false; empty.textContent = t('need_url'); }
      else if (!S.picks.length) { empty.hidden = false; empty.textContent = t('pick_none_msg'); }
      else CHANNELS.forEach(function (c) {
        if (S.picks.indexOf(c.id) < 0) return;
        var f = {}; FIELDS.forEach(function (k) { f[k] = S.f[k]; });
        if (isDyn(f.campaign) && !c.x) { f.campaign = S.prevCampaign || ''; f.term = ''; f.id = ''; }
        f.source = c.s; f.medium = c.m; f.content = c.c || ''; f.source_platform = c.p || '';
        if (c.x) Object.keys(c.x).forEach(function (k) { f[k] = c.x[k]; });
        var b = build(S.url, f, S.clean, S.sep);
        bulkRows.push({ ch: c.id, r: b, url: S.url, note: '', st: b.ok ? 'ok' : 'bad' });
      });
    } else {
      var res = csvItems();
      if (res.cut) { msg.hidden = false; msg.textContent = t('too_many', { n: MAX_ROWS }); }
      if (!res.items.length) { empty.hidden = false; empty.textContent = t('csv_empty'); }
      res.items.forEach(function (it) {
        var f = {}; FIELDS.forEach(function (k) { f[k] = it.f[k] || ''; });
        var b = build(it.url, f, S.clean, S.sep);
        var st = !b.ok ? 'bad' : (!f.source.trim() ? 'nosrc' : 'ok');
        bulkRows.push({ ch: '', r: b, url: it.url || '', note: it.note || '', st: st });
      });
    }
    $('#bulkCount').textContent = t('rows_n', { n: EDU.fmt(bulkRows.length) });
    ['copyAll', 'dlCsv', 'saveAll'].forEach(function (id) { $('#' + id).disabled = !bulkRows.some(function (x) { return x.r.ok; }); });
    if (!bulkRows.length) { fill(tbl, []); return; }
    var head = isM ? ['th_channel', 'th_source', 'th_medium', 'th_content', 'th_link']
      : ['th_url', 'th_source', 'th_medium', 'th_campaign', 'th_content', 'th_link', 'th_status', 'th_note'];
    var thead = el('thead', null, el('tr', null, head.map(function (k) { return el('th', { scope: 'col', text: t(k) }); })));
    var tbody = el('tbody');
    bulkRows.forEach(function (row, i) {
      var tg = {}; if (row.r.ok) row.r.tags.forEach(function (x) { tg[x.k.slice(4)] = x.v; });
      var lk = row.r.ok ? el('div', { class: 'lk' }, iconBtn('⧉', 'copy', function () { EDU.copy(row.r.link); }), el('span', { class: 'no-i18n', dir: 'ltr', title: row.r.link, text: row.r.link })) : el('span', { text: '—' });
      var cells = [];
      if (isM) cells.push(el('td', { text: t('ch_' + row.ch) }));
      else cells.push(el('td', { class: 'mono no-i18n', dir: 'ltr', text: row.url.length > 40 ? row.url.slice(0, 38) + '…' : row.url }));
      cells.push(el('td', { class: 'mono no-i18n', dir: 'ltr', text: tg.source || '' }), el('td', { class: 'mono no-i18n', dir: 'ltr', text: tg.medium || '' }));
      if (!isM) cells.push(el('td', { class: 'mono no-i18n', dir: 'ltr', text: tg.campaign || '' }));
      cells.push(el('td', { class: 'mono no-i18n', dir: 'ltr', text: tg.content || '' }), el('td', null, lk));
      if (!isM) {
        cells.push(el('td', { class: 'st ' + (row.st === 'ok' ? 'ok' : row.st === 'bad' ? 'bad' : 'warn'), text: t(row.st === 'ok' ? 'row_ok' : row.st === 'bad' ? 'row_bad' : 'row_nosrc') }));
        cells.push(el('td', { class: 'wrap no-i18n', dir: 'auto', text: row.note }));
      }
      tbody.appendChild(el('tr', { class: row.st === 'bad' ? 'bad' : '', dataset: { i: String(i) } }, cells));
    });
    fill(tbl, [thead, tbody]);
  }
  var csvIn = $('#csvIn');
  csvIn.value = S.csv;
  csvIn.addEventListener('input', function () { S.csv = csvIn.value; save(); renderBulk(); });
  $('#loadExample').addEventListener('click', function () {
    var y = new Date().getFullYear();
    var rows = [['link', 'source', 'medium', 'campaign', 'content', 'note'],
      ['yourshop.in/diwali-offer', 'whatsapp', 'social', 'diwali-sale-' + y, 'status', t('ex_note1')],
      ['https://yourshop.in/diwali-offer?ref=app', 'WhatsApp', 'social', 'Diwali Sale ' + y, 'group', t('ex_note2')],
      ['https://yourshop.in/diwali-offer#offers', 'poster', 'qr', 'diwali-sale-' + y, 'counter', t('ex_note3')]];
    S.csv = EDU.csv.stringify(rows).replace(/^﻿/, ''); csvIn.value = S.csv; save(); renderBulk();
  });
  $('#clearCsv').addEventListener('click', function () { S.csv = ''; csvIn.value = ''; save(); renderBulk(); });
  $('#importCsv').addEventListener('click', function () {
    EDU.pickFile('.csv,.tsv,.txt,text/csv,text/plain').then(function (f) {
      if (!f) return;
      if (f.size > 2 * 1024 * 1024) { EDU.toast(t('file_bad')); return; }
      return EDU.readText(f).then(function (txt) {
        if (/\u0000/.test(txt)) { EDU.toast(t('file_bad')); return; }
        S.csv = txt; csvIn.value = txt; save(); renderBulk();
      });
    }).catch(function () { EDU.toast(t('file_bad')); });
  });
  function okRows() { return bulkRows.filter(function (x) { return x.r.ok; }); }
  $('#copyAll').addEventListener('click', function () { var r = okRows(); if (r.length) EDU.copy(r.map(function (x) { return x.r.link; }).join('\n')); });
  function rowsCsv(list, withDate) {
    var head = (withDate ? ['th_date'] : []).concat(['th_channel', 'th_url', 'th_source', 'th_medium', 'th_campaign', 'th_term', 'th_content', 'th_id', 'th_link', 'th_note']).map(function (k) { return t(k); });
    return EDU.csv.stringify([head].concat(list));
  }
  $('#dlCsv').addEventListener('click', function () {
    var data = okRows().map(function (x) {
      var tg = {}; x.r.tags.forEach(function (q) { tg[q.k.slice(4)] = q.v; });
      return [x.ch ? t('ch_' + x.ch) : '', x.r.base, tg.source || '', tg.medium || '', tg.campaign || '', tg.term || '', tg.content || '', tg.id || '', x.r.link, x.note];
    });
    EDU.download('utm-links.csv', rowsCsv(data, false), 'text/csv;charset=utf-8');
  });
  $('#saveAll').addEventListener('click', function () {
    var n = 0;
    okRows().slice().reverse().forEach(function (x) { if (addHist(histEntry(x.r, null, x.note || (x.ch ? t('ch_' + x.ch) : '')))) n++; });
    saveHist(); EDU.toast(t('saved_n', { n: EDU.fmt(n) }));
  });

  /* ------------------------------------------------------------ history */
  function renderHist() {
    var box = $('#hrows');
    $('#histCount').textContent = t('hist_n', { n: EDU.fmt(hist.length) });
    $('#histEmpty').hidden = hist.length > 0;
    ['dlSheet', 'copyHist', 'clearHist'].forEach(function (id) { $('#' + id).disabled = !hist.length; });
    fill(box, hist.map(function (h) {
      var f = h.f || {};
      var note = el('input', { type: 'text', class: 'hnote', dir: 'auto', maxlength: '200', value: h.note || '', placeholder: t('note_ph'), 'aria-label': t('th_note'), 'data-i18n-placeholder': 'note_ph', 'data-i18n-aria-label': 'th_note' });
      note.addEventListener('input', function () { h.note = note.value; saveHist(); });
      return el('div', { class: 'hrow', role: 'listitem', dataset: { id: h.id } },
        el('div', null,
          el('div', { class: 'hmeta no-i18n' },
            el('span', { text: dmy(h.date) }),
            el('b', { dir: 'ltr', text: [f.source, f.medium].filter(Boolean).join(' / ') }),
            el('span', { dir: 'ltr', text: f.campaign || '' }),
            f.content ? el('span', { dir: 'ltr', text: f.content }) : null),
          note,
          el('div', { class: 'hlink no-i18n', dir: 'ltr', text: h.link })),
        el('div', { class: 'hact' },
          iconBtn('⧉', 'copy', function () { EDU.copy(h.link); }),
          iconBtn('✎', 'edit_link', function () { loadHist(h); }),
          iconBtn('🗑', 'delete', function () { hist = hist.filter(function (x) { return x !== h; }); saveHist(); renderHist(); })));
    }));
  }
  function loadHist(h) {
    S.url = h.url; urlIn.value = h.url; S.loadedFrom = h.url;
    FIELDS.forEach(function (k) { S.f[k] = (h.f && h.f[k]) || ''; $('#' + INPUT_ID[k]).value = S.f[k]; });
    urlNote = null; matchChannel(); save(); showTab('single'); update(); urlIn.focus();
  }
  function histRows() {
    return hist.map(function (h) {
      var f = h.f || {}, ch = '';
      CHANNELS.forEach(function (c) { if (!ch && c.s === f.source && c.m === f.medium && (c.c || '') === (f.content || '')) ch = t('ch_' + c.id); });
      return [dmy(h.date), ch, h.url, f.source || '', f.medium || '', f.campaign || '', f.term || '', f.content || '', f.id || '', h.link, h.note || ''];
    });
  }
  $('#dlSheet').addEventListener('click', function () { if (hist.length) EDU.download('utm-naming-sheet.csv', rowsCsv(histRows(), true), 'text/csv;charset=utf-8'); });
  $('#copyHist').addEventListener('click', function () { if (hist.length) EDU.copy(hist.map(function (h) { return h.link; }).join('\n')); });
  $('#clearHist').addEventListener('click', function () {
    if (!hist.length || !window.confirm(t('clear_hist_confirm'))) return;
    hist = []; saveHist(); renderHist();
  });
  $('#resetAll').addEventListener('click', function () {
    if (!window.confirm(t('confirm_reset'))) return;
    store.remove('state'); store.remove('hist'); location.reload();
  });

  /* ------------------------------------------------------------ init */
  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });
  urlIn.value = S.url;
  FIELDS.forEach(function (k) { $('#' + INPUT_ID[k]).value = S.f[k]; });
  $('#cleanOn').checked = S.clean;
  tplIn.value = S.tpl;
  $('#nameProduct').value = S.nm.product || ''; $('#nameOffer').value = S.nm.offer || ''; $('#namePlace').value = S.nm.place || '';
  $('#chips').setAttribute('aria-label', t('h_channel'));

  function renderAll() {
    renderChips(); renderSep(); renderTokBar(); renderName(); renderBulkMode(); renderPicks(); update();
    renderHist(); renderBulk();
    $('#chips').setAttribute('aria-label', t('h_channel'));
    $('#pickChips').setAttribute('aria-label', t('h_channel'));
    $('#bulkMode').setAttribute('aria-label', t('tab_bulk'));
  }
  renderAll();
  showTab(S.tab);
  EDU.onLang(renderAll);

  /* for tests and power users: pure functions, no side effects */
  window.UTM = { build: function (u, f, clean, sep) { return build(u, f || {}, clean !== false, sep || '-'); }, clean: cleanVal, parse: parseUrl };
})();
