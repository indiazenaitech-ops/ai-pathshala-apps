/* Flowchart & Algorithm Lab: UI. The engine (parser, runner, code generators, layout) is engine.js (window.FCE),
   example programs are examples.js (window.FC_EXAMPLES) with texts from content.js (window.APP_CONTENT).
   State in EDU.store('flowchart-maker'): program {name, blocks, inputs} and ui {tab, speed, zoom}. */
(function () {
  'use strict';
  var SLUG = 'flowchart-maker';
  var store = EDU.store(SLUG);
  var F = window.FCE, EX = window.FC_EXAMPLES || [];
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var ICON = { input: '⌨️', output: '🖨️', process: '⚙️', decision: '❓', while: '🔁', for: '🔢' };
  var SPEEDS = { slow: 1200, normal: 550, fast: 120, instant: 0 };
  var DRY_ROWS = 300;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  /* ------------------------------------------------------------------ state */
  var P = null;                                   /* the program {name, blocks, inputs} */
  var UI = cleanUI(store.get('ui', null));
  var run = { r: null, timer: null, mode: 'idle' };
  var dirty = false;

  function cleanUI(u) {
    u = u && typeof u === 'object' ? u : {};
    var z = Number(u.zoom);
    return {
      tab: ['flow', 'pseudo', 'python'].indexOf(u.tab) >= 0 ? u.tab : 'flow',
      speed: SPEEDS.hasOwnProperty(u.speed) ? u.speed : 'normal',
      zoom: u.zoom === 'fit' || !isFinite(z) ? 'fit' : Math.min(2.5, Math.max(0.4, z))
    };
  }
  function saveUI() { store.set('ui', UI); }
  function saveProgram() { store.set('program', { name: P.name, blocks: P.blocks, inputs: P.inputs }); }

  function content(id) {
    var C = window.APP_CONTENT || {}, L = C[EDU.lang] || C.en || {};
    return L[id] || (C.en && C.en[id]) || { name: id };
  }
  /* an example in the current language: {{key}} texts filled in */
  function exampleProgram(id) {
    var ex = null;
    EX.forEach(function (e) { if (e.id === id) ex = e; });
    if (!ex) return null;
    var texts = content(id);
    var json = JSON.stringify({ name: texts.name || id, blocks: ex.blocks, inputs: ex.inputs });
    json = json.replace(/\{\{(\w+)\}\}/g, function (m, k) { return typeof texts[k] === 'string' ? texts[k].replace(/["\\]/g, '') : k; });
    return F.clean(JSON.parse(json));
  }
  function setProgram(p, opts) {
    opts = opts || {};
    P = p;
    dirty = false;
    saveProgram();
    stopTimer(); run.r = null; run.mode = 'idle';
    $('#prog-name').value = P.name;
    $('#inputs-pre').value = P.inputs.join('\n');
    renderAll();
  }
  function changed() {                          /* after every edit: save, restart the run, redraw */
    dirty = true;
    saveProgram();
    stopTimer(); run.r = null; run.mode = 'idle';
    renderAll();
  }

  /* ------------------------------------------------------------------ load: share link > storage > default example */
  (function load() {
    var fromLink = null;
    try {
      var q = new URLSearchParams(location.search).get('p');
      if (q) fromLink = F.clean(EDU.unpack(q));
    } catch (e) { fromLink = null; }
    if (fromLink && fromLink.blocks.length) {
      P = fromLink;
      try { var u = new URL(location.href); u.searchParams.delete('p'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) { }
      setTimeout(function () { EDU.toast(t('t_from_link')); }, 300);
    } else {
      P = F.clean(store.get('program', null));
      if (!P) P = exampleProgram('sum2') || { name: '', blocks: [], inputs: [] };
    }
    saveProgram();
    $('#prog-name').value = P.name;
    $('#inputs-pre').value = P.inputs.join('\n');
  })();

  /* ------------------------------------------------------------------ examples */
  function renderExamples() {
    var sel = $('#ex-select'), cur = sel.value;
    sel.innerHTML = '';
    sel.appendChild(el('option', { value: '', text: t('ex_pick') }));
    EX.forEach(function (e) { sel.appendChild(el('option', { value: e.id, text: content(e.id).name || e.id })); });
    sel.value = cur || '';
  }
  $('#ex-select').addEventListener('change', function () {
    var id = this.value; if (!id) return;
    if (dirty && P.blocks.length && !window.confirm(t('confirm_example'))) { this.value = ''; return; }
    var p = exampleProgram(id); if (!p) return;
    setProgram(p);
    EDU.toast(t('t_example', { name: p.name }));
  });
  $('#prog-name').addEventListener('input', function () { P.name = this.value.slice(0, 60); dirty = true; saveProgram(); $('#print-title').textContent = P.name; });
  var inputsTimer = null;
  $('#inputs-pre').addEventListener('input', function () {
    var v = this.value;
    clearTimeout(inputsTimer);
    inputsTimer = setTimeout(function () { P.inputs = v.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 50); saveProgram(); }, 150);
  });
  function prefillInputs() { return $('#inputs-pre').value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean); }

  /* ------------------------------------------------------------------ tabs */
  function showTab(name) {
    UI.tab = name; saveUI();
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.id === 'tab-' + name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#' + b.getAttribute('data-panel')).hidden = !on;
    });
    if (name === 'flow') fitZoom();
  }
  $$('#tabs [role="tab"]').forEach(function (b, i, all) {
    b.addEventListener('click', function () { showTab(b.id.slice(4)); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      if (document.documentElement.dir === 'rtl') d = -d;
      var nx = all[(i + d + all.length) % all.length]; nx.focus(); nx.click();
    });
  });

  /* ------------------------------------------------------------------ block editor */
  function summary(b) {
    switch (b.type) {
      case 'input': return b.var + (b.prompt ? '  ←  "' + b.prompt + '"' : '');
      case 'output': return F.fmtList(b.expr, 'pseudo');
      case 'process': return b.var + ' = ' + F.fmtExpr(b.expr, 'pseudo');
      case 'decision': return F.fmtExpr(b.cond, 'pseudo') + ' ?';
      case 'while': return F.fmtExpr(b.cond, 'pseudo');
      case 'for': return b.var + ' = ' + F.fmtExpr(b.from, 'pseudo') + ' → ' + F.fmtExpr(b.to, 'pseudo') + (F.literalOf(b.step) && F.literalOf(b.step).v === 1 ? '' : ' (' + t('fc_step', { s: F.fmtExpr(b.step, 'pseudo') }) + ')');
    }
    return '';
  }
  function renderBlocks() {
    var root = $('#blocks'); root.innerHTML = '';
    if (!P.blocks.length) root.appendChild(el('p', { class: 'ed-empty', id: 'ed-empty', text: t('ed_empty') }));
    renderList(P.blocks, root, 'root');
  }
  function renderList(list, box, path) {
    list.forEach(function (b, i) { box.appendChild(renderBlock(b, list, i)); });
    box.appendChild(el('button', { type: 'button', class: 'blk-add', dataset: { path: path }, text: list === P.blocks ? t('add_block') : t('add_here'), onclick: function () { openModal(null, list); } }));
  }
  function renderBlock(b, list, i) {
    var row = el('div', { class: 'blk', dataset: { id: b.id, type: b.type } });
    row.appendChild(el('button', { type: 'button', class: 'blk-main no-i18n', 'aria-label': t('bt_' + b.type) + ': ' + summary(b), onclick: function () { openModal(b, list); } },
      el('span', { class: 'blk-ic', 'aria-hidden': 'true', text: ICON[b.type] }),
      el('span', { class: 'blk-kind', text: t('bt_' + b.type) }),
      el('span', { class: 'blk-txt no-i18n', text: summary(b) })));
    var acts = el('div', { class: 'blk-acts' },
      el('button', { type: 'button', 'aria-label': t('mv_up'), title: t('mv_up'), text: '▲', disabled: i === 0, dataset: { act: 'up' }, onclick: function () { move(list, i, -1); } }),
      el('button', { type: 'button', 'aria-label': t('mv_down'), title: t('mv_down'), text: '▼', disabled: i === list.length - 1, dataset: { act: 'down' }, onclick: function () { move(list, i, 1); } }),
      el('button', { type: 'button', 'aria-label': t('edit_block'), title: t('edit_block'), text: '✎', dataset: { act: 'edit' }, onclick: function () { openModal(b, list); } }),
      el('button', { type: 'button', 'aria-label': t('del_block'), title: t('del_block'), text: '🗑', dataset: { act: 'del' }, onclick: function () { removeBlock(b, list, i); } }));
    row.appendChild(acts);
    var kids = F.children(b);
    if (kids.length) {
      var nest = el('div', { class: 'blk-nest' });
      kids.forEach(function (c) {
        nest.appendChild(el('div', { class: 'blk-lbl', text: c[0] === 'yes' ? t('yes_branch') : c[0] === 'no' ? t('no_branch') : t('body_branch') }));
        var sub = el('div', { class: 'blk-list', dataset: { branch: c[0] } });
        renderList(c[1], sub, b.id + ':' + c[0]);
        nest.appendChild(sub);
      });
      row.appendChild(nest);
    }
    return row;
  }
  function move(list, i, d) {
    var j = i + d; if (j < 0 || j >= list.length) return;
    var x = list[i]; list[i] = list[j]; list[j] = x;
    changed();
    var btn = $('.blk[data-id="' + x.id + '"] .blk-acts button[data-act="' + (d < 0 ? 'up' : 'down') + '"]');
    if (btn && !btn.disabled) btn.focus();
  }
  function removeBlock(b, list, i) {
    var inner = F.children(b).some(function (c) { return c[1].length; });
    if (inner && !window.confirm(t('del_confirm'))) return;
    list.splice(i, 1);
    changed();
  }

  /* ---------- add / edit modal ---------- */
  function openModal(block, list) {
    var isNew = !block;
    var type = block ? block.type : 'process';
    var draft = block ? F.clone(block) : { var: '', prompt: '', expr: '', cond: '', from: '1', to: '10', step: '1' };
    var form = el('div', { class: 'stack md-form' });
    var typeBox = el('div', { class: 'typegrid', role: 'group', 'aria-label': t('md_type') });
    var fields = el('div', { class: 'stack' });
    var hint = el('p', { class: 'muted small mb0' });
    var errBox = el('p', { class: 'md-err', role: 'alert' });
    var close;

    function typeButtons() {
      typeBox.innerHTML = '';
      F.TYPES.forEach(function (ty) {
        typeBox.appendChild(el('button', { type: 'button', class: 'typebtn', dataset: { type: ty }, 'aria-pressed': String(ty === type), onclick: function () { if (type === ty) return; rememberFields(); type = ty; typeButtons(); renderFields(); } },
          el('span', { 'aria-hidden': 'true', text: ICON[ty] }), el('span', { text: t('bt_' + ty) })));
      });
    }
    function field(id, labelKey, hintKey, value, ph) {
      var inp = el('input', { type: 'text', id: 'f-' + id, class: 'no-i18n', value: value || '', placeholder: ph || '', autocomplete: 'off', spellcheck: 'false', maxlength: id === 'var' ? 40 : 200 });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      return el('div', { class: 'field' }, el('label', { for: 'f-' + id, text: t(labelKey) }), inp, hintKey ? el('span', { class: 'hint', text: t(hintKey) }) : null);
    }
    function val(id) { var x = $('#f-' + id, fields); return x ? x.value.trim() : ''; }
    function rememberFields() {
      ['var', 'prompt', 'expr', 'cond', 'from', 'to', 'step'].forEach(function (k) { var x = $('#f-' + k, fields); if (x) draft[k] = x.value; });
      if (type === 'output' && $('#f-expr', fields)) draft.expr = $('#f-expr', fields).value;
    }
    function renderFields() {
      fields.innerHTML = '';
      hint.textContent = t('bh_' + type);
      switch (type) {
        case 'input':
          fields.appendChild(field('var', 'f_var', 'f_var_hint', draft.var));
          fields.appendChild(field('prompt', 'f_prompt', null, draft.prompt, t('f_prompt_ph')));
          break;
        case 'output':
          fields.appendChild(field('expr', 'f_out', 'f_out_hint', draft.expr));
          break;
        case 'process':
          fields.appendChild(field('var', 'f_var', 'f_var_hint', draft.var));
          fields.appendChild(field('expr', 'f_expr', 'f_expr_hint', draft.expr));
          break;
        case 'decision': case 'while':
          fields.appendChild(field('cond', 'f_cond', 'f_cond_hint', draft.cond));
          break;
        case 'for':
          fields.appendChild(field('var', 'f_var', 'f_var_hint', draft.var || 'i'));
          fields.appendChild(el('div', { class: 'for-row' }, field('from', 'f_from', null, draft.from || '1'), field('to', 'f_to', null, draft.to || '10'), field('step', 'f_step', null, draft.step || '1')));
          break;
      }
      errBox.textContent = '';
      var first = fields.querySelector('input'); if (first) setTimeout(function () { first.focus(); }, 30);
    }
    function errText(e) { return e && e.key ? t(e.key, e.vars) : String(e); }
    function submit() {
      var out = { type: type }, e;
      var needVar = type === 'input' || type === 'process' || type === 'for';
      if (needVar) {
        if (!F.validIdent(val('var'))) { errBox.textContent = t('err_var'); $('#f-var', fields).focus(); return; }
        out.var = val('var');
      }
      if (type === 'input') out.prompt = val('prompt');
      if (type === 'output') {
        if (!val('expr')) { errBox.textContent = t('err_empty'); return; }
        e = F.checkList(val('expr')); if (e) { errBox.textContent = t('err_expr', { msg: errText(e) }); return; }
        out.expr = val('expr');
      }
      if (type === 'process') {
        if (!val('expr')) { errBox.textContent = t('err_empty'); return; }
        e = F.checkExpr(val('expr')); if (e) { errBox.textContent = t('err_expr', { msg: errText(e) }); return; }
        out.expr = val('expr');
      }
      if (type === 'decision' || type === 'while') {
        if (!val('cond')) { errBox.textContent = t('err_empty'); return; }
        e = F.checkExpr(val('cond')); if (e) { errBox.textContent = t('err_expr', { msg: errText(e) }); return; }
        out.cond = val('cond');
      }
      if (type === 'for') {
        var bad = ['from', 'to', 'step'].filter(function (k) { return !val(k) || F.checkExpr(val(k)); });
        if (bad.length) { var ee = val(bad[0]) ? F.checkExpr(val(bad[0])) : null; errBox.textContent = ee ? t('err_expr', { msg: errText(ee) }) : t('err_empty'); $('#f-' + bad[0], fields).focus(); return; }
        out.from = val('from'); out.to = val('to'); out.step = val('step');
      }
      if (block) {
        /* keep the id and the nested lists where the type still has them */
        out.id = block.id;
        if (out.type === 'decision') { out.yes = block.yes || block.body || []; out.no = block.no || []; }
        if (out.type === 'while' || out.type === 'for') out.body = block.body || block.yes || [];
        var pos = list.indexOf(block);
        list[pos] = out;
      } else {
        out.id = F.newId();
        if (out.type === 'decision') { out.yes = []; out.no = []; }
        if (out.type === 'while' || out.type === 'for') out.body = [];
        list.push(out);
      }
      close();
      changed();
      var row = $('.blk[data-id="' + out.id + '"] .blk-main'); if (row) row.focus();
    }
    form.appendChild(el('div', { class: 'field' }, el('span', { class: 'small', style: { fontWeight: '700' }, text: t('md_type') }), typeBox));
    form.appendChild(hint);
    form.appendChild(fields);
    form.appendChild(errBox);
    form.appendChild(el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn btn-primary', id: 'md-save', text: t('save'), onclick: submit }),
      el('button', { type: 'button', class: 'btn', text: t('cancel'), onclick: function () { close(); } })));
    typeButtons(); renderFields();
    close = EDU.modal(form, { title: t(isNew ? 'md_add' : 'md_edit') });
  }

  /* ------------------------------------------------------------------ flowchart (SVG) */
  var measureCtx = document.createElement('canvas').getContext('2d');
  var measureCache = {};
  function fontFamily() { return getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif'; }
  function measure(text) {
    var key = text;
    if (measureCache[key] !== undefined) return measureCache[key];
    measureCtx.font = '600 14px ' + fontFamily();
    var w = measureCtx.measureText(String(text)).width;
    measureCache[key] = w; return w;
  }
  function labels() {
    return {
      start: t('fc_start'), end: t('fc_end'), yes: t('yes'), no: t('no'),
      input: function (b) { return t('fc_in', { v: b.var }); },
      output: function (b) { return t('fc_out', { e: F.fmtList(b.expr, 'pseudo') }); },
      process: function (b) { return b.var + ' = ' + F.fmtExpr(b.expr, 'pseudo'); },
      decision: function (b) { return F.fmtExpr(b.cond, 'pseudo') + ' ?'; },
      whileLbl: function (b) { return t('fc_while', { c: F.fmtExpr(b.cond, 'pseudo') }); },
      forLbl: function (b) { return t('fc_for', { v: b.var, a: F.fmtExpr(b.from, 'pseudo'), b: F.fmtExpr(b.to, 'pseudo') }) + (F.literalOf(b.step) && F.literalOf(b.step).v === 1 ? '' : ', ' + t('fc_step', { s: F.fmtExpr(b.step, 'pseudo') })); }
    };
  }
  /* hex colour mixing (SVG fills must be plain colours so the PNG export and old browsers work) */
  function hex(c) { c = String(c || '').trim(); var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c); if (!m) return null; var h = m[1]; if (h.length === 3) h = h.replace(/./g, '$&$&'); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, k) {
    var A = hex(a), B = hex(b); if (!A || !B) return b;
    var r = A.map(function (x, i) { return Math.round(x * k + B[i] * (1 - k)); });
    return '#' + r.map(function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join('');
  }
  var LIGHT = { text: '#1b2a30', muted: '#5a6a70', surface: '#ffffff', border: '#9aa6ab', accent: '#d9501c', accentSoft: '#fde6da', danger: '#b42318', dangerSoft: '#fee4e2',
    c2: '#e8590c', c3: '#5f3dc4', c4: '#2b8a3e', c7: '#1971c2', primary: '#0b4f5c' };
  function palette(forExport) {
    if (forExport) return LIGHT;
    var g = function (v, d) { return EDU.css(v) || d; };
    return { text: g('--text', LIGHT.text), muted: g('--muted', LIGHT.muted), surface: g('--surface', LIGHT.surface), border: g('--muted', LIGHT.border),
      accent: g('--accent', LIGHT.accent), accentSoft: g('--accent-soft', LIGHT.accentSoft), danger: g('--danger', LIGHT.danger), dangerSoft: g('--danger-soft', LIGHT.dangerSoft),
      c2: g('--c2', LIGHT.c2), c3: g('--c3', LIGHT.c3), c4: g('--c4', LIGHT.c4), c7: g('--c7', LIGHT.c7), primary: g('--primary', LIGHT.primary) };
  }
  function kindColor(kind, C) { return kind === 'term' ? C.c4 : kind === 'io' ? C.c7 : kind === 'proc' ? C.primary : kind === 'dec' ? C.c2 : C.c3; }
  function svgEl(tag, attrs) { var e = document.createElementNS(SVGNS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  function shapeFor(n) {
    var x = n.x, y = n.y, w = n.w, h = n.h, cx = x, left = x - w / 2, right = x + w / 2, bottom = y + h, my = y + h / 2;
    switch (n.kind) {
      case 'term': return svgEl('rect', { x: left, y: y, width: w, height: h, rx: h / 2, ry: h / 2 });
      case 'proc': return svgEl('rect', { x: left, y: y, width: w, height: h, rx: 4, ry: 4 });
      case 'io': { var s = 14; return svgEl('polygon', { points: [[left + s, y], [right, y], [right - s, bottom], [left, bottom]].join(' ') }); }
      case 'dec': return svgEl('polygon', { points: [[cx, y], [right, my], [cx, bottom], [left, my]].join(' ') });
      case 'loop': { var k = 22; return svgEl('polygon', { points: [[left + k, y], [right - k, y], [right, my], [right - k, bottom], [left + k, bottom], [left, my]].join(' ') }); }
      case 'dot': return svgEl('circle', { cx: x, cy: y, r: 3.5 });
    }
    return svgEl('rect', { x: left, y: y, width: w, height: h });
  }
  var lastLayout = null;
  function buildSvg(forExport, hi) {
    var C = palette(forExport);
    var lay = F.layout(P, { measure: measure, labels: labels() });
    if (!forExport) lastLayout = lay;
    var svg = svgEl('svg', { xmlns: SVGNS, viewBox: '0 0 ' + lay.width + ' ' + lay.height, width: lay.width, height: lay.height, 'font-family': fontFamily(), 'font-size': 14, class: 'fc-svg no-i18n', role: 'img' });
    svg.setAttribute('aria-label', t('tab_flow') + ': ' + (P.name || ''));
    var defs = svgEl('defs');
    var mk = svgEl('marker', { id: forExport ? 'arrow-x' : 'arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto-start-reverse' });
    mk.appendChild(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: C.border }));
    defs.appendChild(mk); svg.appendChild(defs);
    if (forExport) svg.appendChild(svgEl('rect', { x: 0, y: 0, width: lay.width, height: lay.height, fill: '#ffffff' }));
    var gE = svgEl('g', { fill: 'none', stroke: C.border, 'stroke-width': 2, 'stroke-linejoin': 'round' });
    lay.edges.forEach(function (e) {
      var pl = svgEl('polyline', { points: e.pts.map(function (p) { return p.join(','); }).join(' ') });
      if (e.arrow !== false && e.side !== 'merge') pl.setAttribute('marker-end', 'url(#' + (forExport ? 'arrow-x' : 'arrow') + ')');
      gE.appendChild(pl);
      if (e.label) {
        var p0 = e.pts[0], p1 = e.pts[1], horiz = p0[1] === p1[1], dir = p1[0] >= p0[0] ? 1 : -1;
        var tx = horiz ? p0[0] + dir * 10 : p0[0] + 8, ty = horiz ? p0[1] - 7 : p0[1] + 16;
        var lb = svgEl('text', { x: tx, y: ty, fill: e.side === 'yes' ? C.c4 : C.c2, stroke: 'none', 'font-weight': 700, 'font-size': 13, 'text-anchor': horiz ? (dir > 0 ? 'start' : 'end') : 'start' });
        lb.textContent = e.label; gE.appendChild(lb);
      }
    });
    svg.appendChild(gE);
    var gN = svgEl('g');
    lay.nodes.forEach(function (n) {
      var col = kindColor(n.kind, C);
      var g = svgEl('g', { class: 'fc-node ' + n.kind, 'data-id': n.id, 'data-kind': n.kind });
      var sh = shapeFor(n);
      var isCur = hi && hi.id === n.id;
      var fill = n.kind === 'dot' ? C.border : mix(col, C.surface, forExport ? 0.08 : 0.14);
      var stroke = col, sw = 2;
      if (isCur) { fill = hi.error ? C.dangerSoft : C.accentSoft; stroke = hi.error ? C.danger : C.accent; sw = 3.5; }
      sh.setAttribute('fill', fill); sh.setAttribute('stroke', n.kind === 'dot' ? 'none' : stroke); sh.setAttribute('stroke-width', sw);
      sh.setAttribute('class', 'shape');
      g.appendChild(sh);
      if (n.lines.length) {
        var lh = 18, y0 = n.y + n.h / 2 - (n.lines.length - 1) * lh / 2 + 5;
        n.lines.forEach(function (ln, i) {
          var tx = svgEl('text', { x: n.x, y: y0 + i * lh, 'text-anchor': 'middle', fill: C.text, 'font-size': 14 });
          if (n.kind !== 'term') tx.setAttribute('class', 'no-i18n');
          tx.textContent = ln; g.appendChild(tx);
        });
      }
      if (!forExport && n.kind !== 'term' && n.kind !== 'dot') {
        g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
        g.setAttribute('aria-label', t('edit_block') + ': ' + n.lines.join(' '));
        var open = function () { var hit = F.find(P, n.id); if (hit) openModal(hit.block, hit.list); };
        g.addEventListener('click', open);
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      }
      gN.appendChild(g);
    });
    svg.appendChild(gN);
    return { svg: svg, width: lay.width, height: lay.height };
  }
  function currentHi() {
    var r = run.r; if (!r || !r.current) return null;
    return { id: r.current, error: r.status === 'error' };
  }
  function renderFlow() {
    var wrap = $('#fc-wrap');
    var st = wrap.scrollTop, sl = wrap.scrollLeft;
    wrap.innerHTML = '';
    var b = buildSvg(false, currentHi());
    wrap.appendChild(b.svg);
    applyZoom();
    wrap.scrollTop = st; wrap.scrollLeft = sl;
  }
  function highlightFlow() {                      /* cheap: only restyle the shapes, no re-layout */
    var hi = currentHi(), C = palette(false);
    $$('#fc-wrap .fc-node').forEach(function (g) {
      var sh = g.querySelector('.shape'), kind = g.getAttribute('data-kind'); if (!sh || kind === 'dot') return;
      var col = kindColor(kind, C), on = hi && g.getAttribute('data-id') === hi.id;
      sh.setAttribute('fill', on ? (hi.error ? C.dangerSoft : C.accentSoft) : mix(col, C.surface, 0.14));
      sh.setAttribute('stroke', on ? (hi.error ? C.danger : C.accent) : col);
      sh.setAttribute('stroke-width', on ? 3.5 : 2);
      if (on) scrollNodeIntoView(g);
    });
  }
  function scrollNodeIntoView(g) {
    var wrap = $('#fc-wrap'), sh = g.querySelector('.shape'); if (!sh || !sh.getBBox) return;
    try {
      var bb = sh.getBBox(), sc = currentScale();
      var top = bb.y * sc, bottom = (bb.y + bb.height) * sc, left = bb.x * sc, right = (bb.x + bb.width) * sc;
      if (top < wrap.scrollTop + 10) wrap.scrollTop = Math.max(0, top - 40);
      else if (bottom > wrap.scrollTop + wrap.clientHeight - 10) wrap.scrollTop = bottom - wrap.clientHeight + 40;
      if (left < wrap.scrollLeft + 10) wrap.scrollLeft = Math.max(0, left - 40);
      else if (right > wrap.scrollLeft + wrap.clientWidth - 10) wrap.scrollLeft = right - wrap.clientWidth + 40;
    } catch (e) { }
  }
  function currentScale() {
    if (!lastLayout) return 1;
    if (UI.zoom !== 'fit') return UI.zoom;
    var w = $('#fc-wrap').clientWidth - 2 || 600;
    return Math.max(0.55, Math.min(1, w / lastLayout.width));
  }
  function applyZoom() {
    var svg = $('#fc-wrap svg'); if (!svg || !lastLayout) return;
    var sc = currentScale();
    svg.setAttribute('width', Math.round(lastLayout.width * sc));
    svg.setAttribute('height', Math.round(lastLayout.height * sc));
    $('#zoom-pct').textContent = Math.round(sc * 100) + '%';
  }
  function fitZoom() { applyZoom(); }
  $('#zoom-in').addEventListener('click', function () { UI.zoom = Math.min(2.5, currentScale() * 1.25); saveUI(); applyZoom(); });
  $('#zoom-out').addEventListener('click', function () { UI.zoom = Math.max(0.4, currentScale() / 1.25); saveUI(); applyZoom(); });
  $('#zoom-fit').addEventListener('click', function () { UI.zoom = 'fit'; saveUI(); applyZoom(); });
  $('#fs').addEventListener('click', function () { EDU.fullscreen($('#view-card')); });
  window.addEventListener('resize', function () { if (UI.zoom === 'fit') applyZoom(); });
  document.addEventListener('fullscreenchange', function () { setTimeout(applyZoom, 100); });

  function renderLegend() {
    var box = $('#legend'); box.innerHTML = '';
    var C = palette(false);
    var items = [['term', 'lg_term'], ['io', 'lg_io'], ['proc', 'lg_proc'], ['dec', 'lg_dec'], ['loop', 'lg_loop']];
    items.forEach(function (it) {
      var svg = svgEl('svg', { viewBox: '0 0 60 40', 'aria-hidden': 'true' });
      var n = { kind: it[0], x: 30, y: 4, w: 52, h: 32, lines: [] };
      var sh = shapeFor(n); var col = kindColor(it[0], C);
      sh.setAttribute('fill', mix(col, C.surface, 0.14)); sh.setAttribute('stroke', col); sh.setAttribute('stroke-width', 3);
      svg.appendChild(sh);
      box.appendChild(el('span', {}, svg, el('span', { text: t(it[1]) })));
    });
    var arrow = svgEl('svg', { viewBox: '0 0 60 40', 'aria-hidden': 'true' });
    arrow.appendChild(svgEl('path', { d: 'M 6 20 H 44 M 36 11 L 48 20 L 36 29', fill: 'none', stroke: C.border, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    box.appendChild(el('span', {}, arrow, el('span', { text: t('lg_flow') })));
  }

  /* ------------------------------------------------------------------ code views */
  var KW_PSEUDO = /\b(START|END IF|END WHILE|END FOR|END|INPUT|PRINT|SET|COMPUTE|IF|THEN|ELSE|WHILE|DO|FOR|TO|STEP|AND|OR|NOT|MOD|TRUE|FALSE)\b/g;
  var KW_PY = /\b(if|else|elif|while|for|in|range|print|input|int|float|and|or|not|True|False|pass|def|return)\b/g;
  function colorize(text, py) {
    /* strings, numbers, keywords: split on strings first so keywords inside quotes stay plain */
    var out = document.createDocumentFragment();
    var parts = text.split(/("(?:[^"\\]|\\.)*")/);
    parts.forEach(function (p, i) {
      if (i % 2) { out.appendChild(el('span', { class: 'st', text: p })); return; }
      var re = py ? KW_PY : KW_PSEUDO, last = 0, m;
      re.lastIndex = 0;
      while ((m = re.exec(p))) {
        if (m.index > last) out.appendChild(numSpans(p.slice(last, m.index)));
        out.appendChild(el('span', { class: 'kw', text: m[0] }));
        last = m.index + m[0].length;
      }
      if (last < p.length) out.appendChild(numSpans(p.slice(last)));
    });
    return out;
  }
  function numSpans(s) {
    var f = document.createDocumentFragment(), parts = s.split(/(\b\d+(?:\.\d+)?\b)/);
    parts.forEach(function (p, i) { if (!p) return; f.appendChild(i % 2 ? el('span', { class: 'nb', text: p }) : document.createTextNode(p)); });
    return f;
  }
  function renderCode(id, lines, py) {
    var box = $('#' + id); box.innerHTML = '';
    if (!lines.length) { box.appendChild(el('div', { class: 'code-empty', text: t('code_empty') })); return; }
    lines.forEach(function (l) {
      var pieces = l.text.split('\n');
      pieces.forEach(function (txt, k) {
        var d = el('div', { class: 'ln', dataset: { id: l.id || '' } });
        var pad = ''; for (var i = 0; i < l.depth; i++) pad += '    ';
        if (/^#/.test(txt)) { d.appendChild(el('span', { class: 'cm', text: pad + txt })); }
        else { d.appendChild(document.createTextNode(pad)); d.appendChild(colorize(txt, py)); }
        box.appendChild(d);
      });
    });
  }
  function renderCodes() {
    renderCode('pseudo', F.pseudocode(P), false);
    renderCode('python', F.python(P, { note: t('py_note') }), true);
    highlightCode();
  }
  function highlightCode() {
    var hi = currentHi();
    ['pseudo', 'python'].forEach(function (id) {
      var first = null;
      $$('#' + id + ' .ln').forEach(function (d) {
        var on = !!hi && d.dataset.id === hi.id;
        d.classList.toggle('cur', on);
        if (on && !first) first = d;
      });
      if (first && !$('#panel-' + id).hidden) {
        var box = $('#' + id), top = first.offsetTop - box.offsetTop;
        if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 30) box.scrollTop = Math.max(0, top - box.clientHeight / 2);
      }
    });
  }
  $('#copy-pseudo').addEventListener('click', function () { EDU.copy(F.linesToText(F.pseudocode(P))); });
  $('#copy-python').addEventListener('click', function () { EDU.copy(F.linesToText(F.python(P, { note: t('py_note') }))); });

  /* ------------------------------------------------------------------ run */
  function newRunner() { run.r = new F.Runner(P, { inputs: prefillInputs() }); return run.r; }
  function stopTimer() { if (run.timer) { clearTimeout(run.timer); run.timer = null; } }
  function finished(r) { return r && (r.status === 'done' || r.status === 'error'); }
  function doRun() {
    stopTimer();
    if (!run.r || finished(run.r)) newRunner();
    run.mode = 'auto';
    tick();
  }
  function tick() {
    var r = run.r; if (!r) return;
    if (UI.speed === 'instant') { r.runAll(); }
    else r.step();
    refreshRun();
    if (r.status === 'ready' && run.mode === 'auto') run.timer = setTimeout(tick, SPEEDS[UI.speed] || 500);
    else if (r.status !== 'input') run.mode = 'idle';
  }
  function doStep() {
    stopTimer();
    if (!run.r || finished(run.r)) newRunner();
    run.mode = 'paused';
    if (run.r.status === 'input') { $('#in-val').focus(); return; }
    run.r.step();
    refreshRun();
  }
  function doPause() { stopTimer(); if (run.r && !finished(run.r)) run.mode = 'paused'; refreshRun(); }
  function doRestart() { stopTimer(); run.mode = 'idle'; run.r = null; refreshRun(); }
  function provide() {
    var r = run.r; if (!r || r.status !== 'input') return;
    r.provide($('#in-val').value);
    $('#in-val').value = '';
    refreshRun();
    if (run.mode === 'auto') { if (UI.speed === 'instant') tick(); else run.timer = setTimeout(tick, SPEEDS[UI.speed] || 500); }
  }
  $('#btn-run').addEventListener('click', doRun);
  $('#btn-step').addEventListener('click', doStep);
  $('#btn-pause').addEventListener('click', doPause);
  $('#btn-restart').addEventListener('click', doRestart);
  $('#in-ok').addEventListener('click', provide);
  $('#in-val').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); provide(); } });
  $('#speed').addEventListener('change', function () { UI.speed = this.value; saveUI(); });

  function errorText(e) { return e ? t(e.key, e.vars) : ''; }
  function refreshRun() {
    var r = run.r, st = $('#run-status'), ebox = $('#run-error'), inp = $('#in-panel');
    var status = r ? r.status : 'none';
    /* status line */
    st.className = 'status';
    if (!r) { st.textContent = t('st_ready'); st.dataset.status = 'ready'; }
    else if (status === 'done') { st.textContent = t('st_done', { n: EDU.fmt(r.steps) }); st.classList.add('ok'); st.dataset.status = 'done'; }
    else if (status === 'error') { st.textContent = t('st_error', { n: EDU.fmt(r.steps) }); st.classList.add('bad'); st.dataset.status = 'error'; }
    else if (status === 'input') { st.textContent = t('st_input'); st.dataset.status = 'input'; }
    else if (run.mode === 'auto') { st.textContent = t('st_running', { n: EDU.fmt(r.steps) }); st.dataset.status = 'running'; }
    else { st.textContent = t('st_paused', { n: EDU.fmt(r.steps) }); st.dataset.status = 'paused'; }
    st.dataset.steps = r ? String(r.steps) : '0';
    /* error box */
    if (r && status === 'error') {
      ebox.hidden = false; ebox.innerHTML = '';
      ebox.dataset.key = r.error.key;
      var where = F.lineText(P, r.current);
      ebox.appendChild(el('strong', { text: errorText(r.error) }));
      if (where && r.current !== 'start' && r.current !== 'end') ebox.appendChild(el('div', { class: 'small' }, el('code', { class: 'no-i18n', text: where })));
    } else { ebox.hidden = true; ebox.textContent = ''; delete ebox.dataset.key; }
    /* input panel */
    if (r && status === 'input') {
      inp.hidden = false;
      $('#in-label').textContent = (r.prompt ? r.prompt : t('in_prompt_default', { v: r.inputVar })) + '  (' + r.inputVar + ')';
      $('#in-val').setAttribute('aria-label', t('in_for', { v: r.inputVar }));
      if (document.activeElement !== $('#in-val')) $('#in-val').focus();
    } else inp.hidden = true;
    /* buttons */
    $('#btn-pause').disabled = !(r && run.mode === 'auto' && status === 'ready');
    $('#btn-run').disabled = !!(r && status === 'input');
    /* console */
    var con = $('#console'), lines = r ? r.output : [];
    if (con.dataset.n !== String(lines.length) || !r) {
      con.innerHTML = '';
      if (!lines.length) con.appendChild(el('div', { class: 'empty', text: t('console_empty') }));
      var start = Math.max(0, lines.length - 500);
      for (var i = start; i < lines.length; i++) con.appendChild(el('div', { class: 'cl' + (i === lines.length - 1 ? ' new' : ''), text: lines[i] }));
      con.dataset.n = String(lines.length);
      con.scrollTop = con.scrollHeight;
    }
    /* variables */
    var tb = $('#vars tbody'); tb.innerHTML = '';
    if (!r || !r.varOrder.length) tb.appendChild(el('tr', {}, el('td', { colspan: 2, class: 'muted', text: t('vars_empty') })));
    else r.varOrder.forEach(function (k) {
      tb.appendChild(el('tr', { class: r.changed === k ? 'chg' : '', dataset: { var: k } }, el('td', { class: 'n', text: k }), el('td', { class: 'v', dataset: { value: F.fmtValue(r.vars[k]) }, text: F.fmtValue(r.vars[k]) })));
    });
    highlightFlow(); highlightCode();
    $$('#blocks .blk').forEach(function (b) { b.classList.toggle('cur', !!(r && r.current === b.dataset.id)); });
    renderDry();
  }

  /* ------------------------------------------------------------------ dry-run table */
  function dryRows() { return run.r ? run.r.trace : []; }
  function renderDry() {
    var r = run.r, rows = dryRows(), card = $('#dry-card'), th = $('#dry thead'), tb = $('#dry tbody'), note = $('#dry-note');
    th.innerHTML = ''; tb.innerHTML = '';
    card.classList.toggle('empty', !rows.length);
    $('#btn-csv').disabled = !rows.length;
    if (!rows.length) { note.textContent = t('dr_empty'); return; }
    var vars = r.varOrder;
    var hr = el('tr', {}, el('th', { text: t('dr_step') }), el('th', { text: t('dr_line') }));
    vars.forEach(function (v) { hr.appendChild(el('th', { class: 'ltr no-i18n', text: v })); });
    hr.appendChild(el('th', { text: t('dr_out') }));
    th.appendChild(hr);
    var shown = rows.slice(0, DRY_ROWS);
    shown.forEach(function (row) {
      var tr = el('tr', { class: (row.note === 'error' ? 'bad ' : '') + (row.id === 'start' || row.id === 'end' ? 'term' : ''), dataset: { step: String(row.n) } });
      tr.appendChild(el('td', { text: EDU.fmt(row.n) }));
      var ins = row.text + (row.note === 'yes' ? '  ' + t('dr_yes') : row.note === 'no' ? '  ' + t('dr_no') : row.note && row.note.indexOf('in:') === 0 ? '  ← ' + row.note.slice(3) : '');
      tr.appendChild(el('td', { class: 'ins no-i18n', text: ins }));
      vars.forEach(function (v) { tr.appendChild(el('td', { class: 'v', text: Object.prototype.hasOwnProperty.call(row.vars, v) ? F.fmtValue(row.vars[v]) : '' })); });
      tr.appendChild(el('td', { class: 'o', text: row.out }));
      tb.appendChild(tr);
    });
    note.textContent = rows.length > DRY_ROWS ? t('dr_more', { n: EDU.fmt(DRY_ROWS), total: EDU.fmt(rows.length) }) : '';
  }
  /* file names: the program name when it is plain ASCII; otherwise "program" (some browsers drop non-Latin download names) */
  function fileBase() {
    var n = String(P.name || '').replace(/[\\\/:*?"<>|\u0000-\u001f]+/g, ' ').trim().replace(/\s+/g, '-').slice(0, 40);
    return /^[\x20-\x7e]+$/.test(n) ? n : 'program';
  }
  $('#btn-csv').addEventListener('click', function () {
    var r = run.r; if (!r || !r.trace.length) return;
    var vars = r.varOrder, rows = [[t('dr_step'), t('dr_line')].concat(vars, [t('dr_out')])];
    r.trace.forEach(function (row) {
      var ins = row.text + (row.note === 'yes' ? ' ' + t('dr_yes') : row.note === 'no' ? ' ' + t('dr_no') : row.note && row.note.indexOf('in:') === 0 ? ' <- ' + row.note.slice(3) : '');
      rows.push([row.n, ins].concat(vars.map(function (v) { return Object.prototype.hasOwnProperty.call(row.vars, v) ? F.fmtValue(row.vars[v]) : ''; }), [row.out]));
    });
    EDU.download(fileBase() + '-dry-run.csv', EDU.csv.stringify(rows), 'text/csv');
  });

  /* ------------------------------------------------------------------ export: PNG, JSON, share, print, new, reset */
  $('#btn-png').addEventListener('click', function () {
    var b = buildSvg(true, null), scale = 2;
    var xml = new XMLSerializer().serializeToString(b.svg);
    var img = new Image();
    img.onload = function () {
      try {
        var cv = document.createElement('canvas'); cv.width = b.width * scale; cv.height = b.height * scale;
        var ctx = cv.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(function (blob) { if (blob) { EDU.download(fileBase() + '-flowchart.png', blob); EDU.toast(t('t_png')); } else EDU.toast(t('t_png_fail')); }, 'image/png');
      } catch (e) { EDU.toast(t('t_png_fail')); }
    };
    img.onerror = function () { EDU.toast(t('t_png_fail')); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  });
  function stripIds(list) {
    return list.map(function (b) {
      var o = {}; Object.keys(b).forEach(function (k) { if (k !== 'id') o[k] = b[k]; });
      if (b.yes) o.yes = stripIds(b.yes); if (b.no) o.no = stripIds(b.no); if (b.body) o.body = stripIds(b.body);
      return o;
    });
  }
  $('#btn-save').addEventListener('click', function () {
    var data = { app: SLUG, version: 1, name: P.name, inputs: P.inputs, blocks: stripIds(P.blocks) };
    EDU.download(fileBase() + '.json', JSON.stringify(data, null, 2), 'application/json');
    EDU.toast(t('t_json_saved'));
  });
  $('#btn-load').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return;
      return EDU.readText(f).then(function (txt) {
        var p = null;
        try { p = F.clean(JSON.parse(txt)); } catch (e) { p = null; }
        if (!p || !p.blocks.length) { EDU.toast(t('t_json_bad')); return; }
        if (!p.name) p.name = f.name.replace(/\.json$/i, '');
        setProgram(p);
        $('#ex-select').value = '';
      });
    }).catch(function () { EDU.toast(t('t_json_bad')); });
  });
  $('#btn-share').addEventListener('click', function () {
    var url = EDU.shareUrl();
    url += (url.indexOf('?') >= 0 ? '&' : '?') + 'p=' + EDU.pack({ name: P.name, inputs: P.inputs, blocks: stripIds(P.blocks) });
    var r = EDU.share(url, t('app_title') + ': ' + P.name);
    if (r && r.then) r.then(function () { if (!(navigator.share && window.matchMedia && matchMedia('(pointer: coarse)').matches)) EDU.toast(t('t_link')); });
  });
  $('#btn-print').addEventListener('click', function () { window.print(); });
  window.addEventListener('beforeprint', function () { var s = $('#fc-wrap svg'); if (s && lastLayout) { s.setAttribute('width', lastLayout.width); s.setAttribute('height', lastLayout.height); } });
  window.addEventListener('afterprint', applyZoom);
  $('#btn-new').addEventListener('click', function () {
    if (P.blocks.length && !window.confirm(t('confirm_new'))) return;
    setProgram({ name: t('new_name'), blocks: [], inputs: [] });
    $('#ex-select').value = '';
    EDU.toast(t('t_new'));
  });
  $('#btn-reset').addEventListener('click', function () {
    if (!window.confirm(t('confirm_reset'))) return;
    store.remove('program'); store.remove('ui');
    UI = cleanUI(null);
    $('#speed').value = UI.speed;
    setProgram(exampleProgram('sum2') || { name: '', blocks: [], inputs: [] });
    $('#ex-select').value = 'sum2';
    showTab('flow');
  });

  /* ------------------------------------------------------------------ render all */
  function renderAll() {
    $('#print-title').textContent = P.name;
    renderExamples();
    renderBlocks();
    renderFlow();
    renderCodes();
    renderLegend();
    refreshRun();
  }
  EDU.onLang(function () { measureCache = {}; renderAll(); });
  EDU.onTheme(function () { renderFlow(); renderLegend(); });

  $('#speed').value = UI.speed;
  showTab(UI.tab);
  renderAll();
  var sel = $('#ex-select');
  if (!dirty) { EX.forEach(function (e) { if (P.name === content(e.id).name) sel.value = e.id; }); }

  /* hooks for the interaction test */
  window.FCAPP = { get program() { return P; }, setProgram: function (p) { var c = F.clean(p); if (c) setProgram(c); return c; }, get runner() { return run.r; }, exampleProgram: exampleProgram };
})();
