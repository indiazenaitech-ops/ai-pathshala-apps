/* Question Paper Maker: teachers build an exam paper (heading, instructions, sections with marks per question,
 * six question types, OR choices), with automatic numbering and a marks total checked against the maximum.
 * The paper and its answer key print on A4 through the browser print window (Save as PDF works there too).
 * The paper is kept in this browser and can be saved to / opened from a JSON file. Nothing is uploaded. */
(function () {
  'use strict';
  var SLUG = 'question-paper-maker';
  EDU.init({ slug: SLUG, title: 'app_title', wide: true });
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t, el = EDU.el;
  var store = EDU.store(SLUG);

  var TYPES = ['mcq', 'fill', 'tf', 'short', 'long', 'match'];
  var MAX_SECTIONS = 12, MAX_Q = 300, MAX_PAIRS = 8;
  var ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', abc = 'abcdefghijklmnopqrstuvwxyz';
  var ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];

  /* ------------------------------------------------------------ model */
  var uidN = 0;
  function uid() { return 'k' + Date.now().toString(36) + (uidN++).toString(36); }
  function str(v, n) { return String(v == null ? '' : v).slice(0, n); }
  function newPart(type) {
    var p = { text: '', ans: '' };
    if (type === 'mcq') { p.opts = ['', '', '', '']; p.ans = -1; }
    if (type === 'match') { p.left = ['', '', '']; p.right = ['', '', '']; }
    return p;
  }
  function newQ(type) { return { id: uid(), type: type, seed: EDU.randInt(1, 99999), a: newPart(type), or: null }; }
  function blankPaper() {
    return { v: 1, sample: false, labels: '', nameLine: false, instrOn: true, instr: '',
      head: { school: '', exam: '', cls: '', subject: '', time: '', max: '', date: '' },
      sections: [{ id: uid(), note: '', marks: 1, questions: [] }] };
  }
  function samplePaper() {
    function q(type, part, or) { var x = newQ(type); x.a = part; x.or = or || null; return x; }
    var P = blankPaper();
    P.sample = true;
    P.head = { school: t('s_school'), exam: t('s_exam'), cls: t('s_class'), subject: t('s_subject'), time: t('s_time'), max: '10', date: '' };
    P.instr = t('s_instr');
    P.sections = [
      { id: uid(), note: t('s_sec_a'), marks: 1, questions: [
        q('mcq', { text: t('s_mcq'), opts: [t('s_mcq_a'), t('s_mcq_b'), t('s_mcq_c'), t('s_mcq_d')], ans: 2 }),
        q('fill', { text: t('s_fill'), ans: '100' }),
        q('tf', { text: t('s_tf'), ans: 'T' })
      ] },
      { id: uid(), note: t('s_sec_b'), marks: 2, questions: [
        q('short', { text: t('s_short'), ans: t('s_short_ans') }, { text: t('s_or'), ans: t('s_or_ans') }),
        q('match', { text: t('s_match'), ans: '', left: [t('s_m1'), t('s_m2'), t('s_m3')], right: [t('s_m1r'), t('s_m2r'), t('s_m3r')] })
      ] },
      { id: uid(), note: t('s_sec_c'), marks: 3, questions: [
        q('long', { text: t('s_long'), ans: t('s_long_ans') })
      ] }
    ];
    return P;
  }
  /* make anything (a saved file, old storage) into a safe paper, or null */
  function cleanPart(x, type) {
    x = x && typeof x === 'object' ? x : {};
    var p = { text: str(x.text, 3000), ans: '' };
    if (type === 'mcq') {
      var o = Array.isArray(x.opts) ? x.opts : [];
      p.opts = [0, 1, 2, 3].map(function (i) { return str(o[i], 400); });
      p.ans = [0, 1, 2, 3].indexOf(+x.ans) >= 0 && x.ans !== '' && x.ans !== null ? +x.ans : -1;
    } else if (type === 'tf') p.ans = x.ans === 'T' || x.ans === 'F' ? x.ans : '';
    else if (type === 'match') {
      var l = Array.isArray(x.left) ? x.left : [], r = Array.isArray(x.right) ? x.right : [];
      var n = EDU.clamp(Math.max(l.length, r.length), 2, MAX_PAIRS);
      p.left = []; p.right = [];
      for (var i = 0; i < n; i++) { p.left.push(str(l[i], 300)); p.right.push(str(r[i], 300)); }
    } else p.ans = str(x.ans, 3000);
    return p;
  }
  function cleanPaper(x) {
    if (!x || typeof x !== 'object' || !Array.isArray(x.sections)) return null;
    var P = blankPaper(), h = x.head && typeof x.head === 'object' ? x.head : {}, count = 0;
    P.sample = x.sample === true;
    P.labels = (window.APP_STRINGS || {})[x.labels] ? x.labels : '';
    P.nameLine = !!x.nameLine; P.instrOn = x.instrOn !== false; P.instr = str(x.instr, 3000);
    P.head = { school: str(h.school, 160), exam: str(h.exam, 160), cls: str(h.cls, 60), subject: str(h.subject, 80), time: str(h.time, 60), max: numStr(h.max), date: str(h.date, 60) };
    P.sections = x.sections.slice(0, MAX_SECTIONS).filter(function (s) { return s && typeof s === 'object'; }).map(function (s) {
      var m = parseFloat(s.marks);
      return { id: uid(), note: str(s.note, 200), marks: isFinite(m) && m >= 0 ? Math.min(m, 100) : 1,
        questions: (Array.isArray(s.questions) ? s.questions : []).filter(function (q) { return q && TYPES.indexOf(q.type) >= 0 && count++ < MAX_Q; }).map(function (q) {
          return { id: uid(), type: q.type, seed: (parseInt(q.seed, 10) || 1) % 100000, a: cleanPart(q.a, q.type), or: q.or ? cleanPart(q.or, q.type) : null };
        }) };
    });
    if (!P.sections.length) P.sections = blankPaper().sections;
    return P;
  }
  function numStr(v) { var n = parseFloat(v); return isFinite(n) && n >= 0 ? String(Math.min(n, 1000)) : ''; }

  var P = cleanPaper(store.get('paper', null)) || samplePaper();
  if (P.sample) P = samplePaper();
  var view = 'paper', openId = '';

  /* ------------------------------------------------------------ helpers */
  function pt(key, vars) {                                    // labels printed on the paper: their own language
    var L = P.labels || EDU.lang, S = (window.APP_STRINGS || {})[L] || {}, v = S[key];
    if (v === undefined) return t(key, vars);
    return String(v).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });
  }
  function paperDir() { var i = EDU.langInfo ? EDU.langInfo(P.labels || EDU.lang) : null; return (i && (i.dir === 'rtl' || i.rtl)) || (P.labels || EDU.lang) === 'ur' ? 'rtl' : 'ltr'; }
  function num(n) { return EDU.fmt(n, { maximumFractionDigits: 2 }); }
  function qCount() { return P.sections.reduce(function (n, s) { return n + s.questions.length; }, 0); }
  function total() { return P.sections.reduce(function (n, s) { return n + (+s.marks || 0) * s.questions.length; }, 0); }
  function perm(n, seed) {                                    // fixed shuffle for the right column of "match"
    var a = [], i, s = seed || 1;
    for (i = 0; i < n; i++) a.push(i);
    function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    for (i = n - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; }
    if (n > 1 && a.every(function (v, k) { return v === k; })) a.push(a.shift());
    return a;
  }
  function pairs(part) {                                      // only rows where something is typed
    var out = [];
    (part.left || []).forEach(function (l, i) { var r = (part.right || [])[i] || ''; if (l.trim() || r.trim()) out.push([l.trim(), r.trim()]); });
    return out;
  }
  function partEmpty(q, part) {
    if (part.text.trim()) return false;
    if (q.type === 'match') return !pairs(part).length;
    return true;
  }

  var saveTimer = 0, viewTimer = 0;
  function touch() {
    if (P.sample) { P.sample = false; $('#sampleNote').hidden = true; }
    clearTimeout(saveTimer); saveTimer = setTimeout(save, 400);
    clearTimeout(viewTimer); viewTimer = setTimeout(renderViews, 120);
  }
  function save() { store.set('paper', P); }
  function changed() { touch(); clearTimeout(viewTimer); renderEditor(); renderViews(); }

  /* ------------------------------------------------------------ editor */
  function bind(node, obj, key, opts) {
    opts = opts || {};
    node.value = obj[key] == null ? '' : obj[key];
    node.addEventListener('input', function () { obj[key] = opts.num ? node.value : node.value; touch(); if (opts.after) opts.after(); });
    return node;
  }
  function field(labelKey, control, hintKey) {
    return el('label', { class: 'field' }, el('b', { i18n: labelKey }), control, hintKey ? el('span', { class: 'hint', i18n: hintKey }) : null);
  }
  function ib(sym, labelKey, act, fn, disabled, extra) {
    return el('button', { type: 'button', class: 'ib' + (extra || ''), 'aria-label': t(labelKey), title: t(labelKey), 'data-act': act, disabled: !!disabled, onclick: fn }, el('span', { 'aria-hidden': 'true', text: sym }));
  }
  function move(arr, i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var x = arr[i]; arr[i] = arr[j]; arr[j] = x; changed(); }

  function partEditor(q, part, isOr) {
    var box = el('div', { class: 'part stack' });
    var ta = el('textarea', { class: 'no-i18n', dir: 'auto', rows: q.type === 'long' ? 3 : 2, maxlength: 3000, 'data-f': isOr ? 'or-text' : 'text' });
    box.appendChild(field(isOr ? 'q_or_title' : 'q_text', bind(ta, part, 'text'), q.type === 'fill' ? 'q_fill_hint' : null));
    if (q.type === 'mcq') {
      var grp = el('div', { role: 'radiogroup' }, el('p', { class: 'hint', i18n: 'q_opts', style: { marginBottom: '6px' } }));
      part.opts.forEach(function (o, i) {
        var rd = el('input', { type: 'radio', name: 'c-' + q.id + (isOr ? '-or' : ''), 'aria-label': t('q_correct') + ' ' + abc[i], 'data-f': (isOr ? 'or-' : '') + 'ans-' + i });
        rd.checked = part.ans === i;
        rd.addEventListener('change', function () { if (rd.checked) { part.ans = i; touch(); } });
        var inp = el('input', { type: 'text', class: 'no-i18n', dir: 'auto', maxlength: 400, 'aria-label': t('q_opt_n', { x: abc[i] }), 'data-f': (isOr ? 'or-' : '') + 'opt-' + i });
        inp.value = o;
        inp.addEventListener('input', function () { part.opts[i] = inp.value; touch(); });
        grp.appendChild(el('div', { class: 'optrow' }, rd, el('span', { class: 'ol no-i18n', text: '(' + abc[i] + ')' }), inp));
      });
      box.appendChild(grp);
    } else if (q.type === 'tf') {
      var seg = el('div', { class: 'seg', role: 'group' });
      [['T', 'p_true'], ['F', 'p_false']].forEach(function (o) {
        var b = el('button', { type: 'button', i18n: o[1], 'aria-pressed': String(part.ans === o[0]), 'data-f': (isOr ? 'or-' : '') + 'tf-' + o[0] });
        b.addEventListener('click', function () { part.ans = part.ans === o[0] ? '' : o[0]; $$('button', seg).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b && part.ans === o[0])); }); touch(); });
        seg.appendChild(b);
      });
      box.appendChild(el('div', {}, el('p', { class: 'hint', i18n: 'q_correct', style: { marginBottom: '6px' } }), seg));
    } else if (q.type === 'match') {
      var list = el('div', {});
      var drawPairs = function () {
        list.textContent = '';
        part.left.forEach(function (l, i) {
          var a = el('input', { type: 'text', class: 'no-i18n', dir: 'auto', maxlength: 300, 'aria-label': t('q_left') + ' ' + (i + 1), placeholder: t('q_left'), 'data-f': (isOr ? 'or-' : '') + 'left-' + i });
          var b = el('input', { type: 'text', class: 'no-i18n', dir: 'auto', maxlength: 300, 'aria-label': t('q_right') + ' ' + (i + 1), placeholder: t('q_right'), 'data-f': (isOr ? 'or-' : '') + 'right-' + i });
          a.value = l; b.value = part.right[i] || '';
          a.addEventListener('input', function () { part.left[i] = a.value; touch(); });
          b.addEventListener('input', function () { part.right[i] = b.value; touch(); });
          list.appendChild(el('div', { class: 'pairrow' }, a, b, ib('✕', 'delete', 'pair-del', function () { part.left.splice(i, 1); part.right.splice(i, 1); touch(); drawPairs(); }, part.left.length <= 2, ' danger')));
        });
      };
      drawPairs();
      box.appendChild(el('div', {}, el('p', { class: 'hint', i18n: 'q_pairs', style: { marginBottom: '6px' } }), list,
        el('button', { type: 'button', class: 'btn btn-sm', i18n: 'pair_add', 'data-act': 'pair-add', style: { marginTop: '8px' }, onclick: function () { if (part.left.length < MAX_PAIRS) { part.left.push(''); part.right.push(''); touch(); drawPairs(); } } })));
    } else {
      var an = q.type === 'fill' ? el('input', { type: 'text', class: 'no-i18n', dir: 'auto', maxlength: 400, 'data-f': (isOr ? 'or-' : '') + 'ans' })
        : el('textarea', { class: 'no-i18n', dir: 'auto', rows: 2, maxlength: 3000, 'data-f': (isOr ? 'or-' : '') + 'ans' });
      box.appendChild(field('q_answer', bind(an, part, 'ans')));
    }
    return box;
  }

  function renderEditor() {
    var root = $('#sections'), n = 0, full = qCount() >= MAX_Q;
    root.textContent = '';
    P.sections.forEach(function (sec, si) {
      var card = el('section', { class: 'card stack sec', id: 'sec-' + si });
      card.appendChild(el('div', { class: 'sec-head' },
        el('h2', { text: t('p_section', { x: ABC[si] }) }),
        el('div', { class: 'acts' },
          ib('▲', 'a_up', 'sec-up', function () { move(P.sections, si, -1); }, si === 0),
          ib('▼', 'a_down', 'sec-down', function () { move(P.sections, si, 1); }, si === P.sections.length - 1),
          ib('⧉', 'a_dup', 'sec-dup', function () {
            if (P.sections.length >= MAX_SECTIONS || qCount() + sec.questions.length > MAX_Q) return;
            var c = JSON.parse(JSON.stringify(sec)); c.id = uid(); c.questions.forEach(function (q) { q.id = uid(); });
            P.sections.splice(si + 1, 0, c); changed();
          }, P.sections.length >= MAX_SECTIONS),
          ib('✕', 'delete', 'sec-del', function () {
            if (sec.questions.length && !window.confirm(t('del_sec_confirm'))) return;
            P.sections.splice(si, 1); if (!P.sections.length) P.sections = blankPaper().sections; changed();
          }, false, ' danger'))));
      var note = el('input', { type: 'text', class: 'no-i18n', dir: 'auto', maxlength: 200, 'data-f': 'note' });
      var marks = el('input', { type: 'number', min: 0, max: 100, step: 0.5, inputmode: 'decimal', 'data-f': 'marks' });
      marks.value = sec.marks;
      marks.addEventListener('input', function () { var m = parseFloat(marks.value); sec.marks = isFinite(m) && m >= 0 ? Math.min(m, 100) : 0; touch(); });
      card.appendChild(el('div', { class: 'sec-fields' }, field('sec_heading', bind(note, sec, 'note')), field('sec_marks', marks)));

      if (!sec.questions.length) card.appendChild(el('p', { class: 'empty small', i18n: 'sec_empty' }));
      sec.questions.forEach(function (q, qi) {
        n++;
        var open = q.id === openId;
        var row = el('div', { class: 'qrow' + (open ? ' open' : ''), id: 'q-' + si + '-' + qi, 'data-type': q.type });
        row.appendChild(el('div', { class: 'qsum' },
          el('span', { class: 'qn no-i18n', text: n + '.' }),
          el('span', { class: 'badge primary', i18n: 'ty_' + q.type }),
          q.or ? el('span', { class: 'badge accent', text: t('p_or') }) : null,
          el('span', { class: 'snip no-i18n', dir: 'auto', text: open ? '' : (q.a.text.trim() || '') }),
          el('div', { class: 'acts' },
            ib(open ? '✓' : '✎', open ? 'done' : 'edit', 'edit', function () { openId = open ? '' : q.id; renderEditor(); if (!open) focusOpen(); }),
            ib('▲', 'a_up', 'up', function () {
              if (qi > 0) move(sec.questions, qi, -1);
              else if (si > 0) { sec.questions.splice(qi, 1); P.sections[si - 1].questions.push(q); changed(); }
            }, qi === 0 && si === 0),
            ib('▼', 'a_down', 'down', function () {
              if (qi < sec.questions.length - 1) move(sec.questions, qi, 1);
              else if (si < P.sections.length - 1) { sec.questions.splice(qi, 1); P.sections[si + 1].questions.unshift(q); changed(); }
            }, qi === sec.questions.length - 1 && si === P.sections.length - 1),
            ib('⧉', 'a_dup', 'dup', function () { var c = JSON.parse(JSON.stringify(q)); c.id = uid(); sec.questions.splice(qi + 1, 0, c); changed(); }, full),
            ib('✕', 'delete', 'del', function () { sec.questions.splice(qi, 1); if (openId === q.id) openId = ''; changed(); }, false, ' danger'))));
        if (open) {
          var body = el('div', { class: 'qbody' });
          body.appendChild(partEditor(q, q.a, false));
          var orBox = el('div', { class: 'orbox' });
          var chk = el('input', { type: 'checkbox', 'data-f': 'or-on' });
          chk.checked = !!q.or;
          var drawOr = function () { orBox.textContent = ''; orBox.hidden = !q.or; if (q.or) orBox.appendChild(partEditor(q, q.or, true)); };
          chk.addEventListener('change', function () { q.or = chk.checked ? newPart(q.type) : null; touch(); drawOr(); });
          drawOr();
          body.appendChild(el('label', { class: 'check', style: { marginTop: '12px' } }, chk, el('span', { i18n: 'q_or' })));
          body.appendChild(orBox);
          row.appendChild(body);
        }
        card.appendChild(row);
      });

      var add = el('div', { class: 'addrow' }, el('span', { class: 'small', i18n: 'add_q', style: { fontWeight: 600 } }));
      TYPES.forEach(function (ty) {
        add.appendChild(el('button', { type: 'button', class: 'chip', 'data-add': ty, disabled: full, onclick: function () {
          var q = newQ(ty); sec.questions.push(q); openId = q.id; changed(); focusOpen();
        } }, el('span', { 'aria-hidden': 'true', text: '＋' }), el('span', { i18n: 'ty_' + ty })));
      });
      card.appendChild(add);
      root.appendChild(card);
    });
    $('#secAdd').disabled = P.sections.length >= MAX_SECTIONS;
  }
  function focusOpen() { var ta = $('.qrow.open textarea'); if (ta) { try { ta.focus({ preventScroll: false }); } catch (e) { ta.focus(); } } }

  /* ------------------------------------------------------------ paper + answer key */
  function textNode(cls, text) { return el('span', { class: cls, dir: 'auto', text: text }); }
  function questionText(q, part) {
    var wrap = el('div', { class: 'p-text', dir: 'auto' });
    var txt = part.text.replace(/\s+$/, '');
    if (!txt && !(q.type === 'match' && pairs(part).length)) { wrap.appendChild(el('span', { class: 'p-none', text: pt('empty_q') })); return wrap; }
    if (q.type === 'fill') {
      txt.split(/(_{3,})/).forEach(function (bit) { if (/^_{3,}$/.test(bit)) wrap.appendChild(el('span', { class: 'p-blank' })); else if (bit) wrap.appendChild(document.createTextNode(bit)); });
    } else wrap.appendChild(document.createTextNode(txt));
    if (q.type === 'tf') { wrap.appendChild(document.createTextNode(' ')); wrap.appendChild(el('span', { class: 'p-tf', text: '(' + pt('p_true') + ' / ' + pt('p_false') + ')' })); }
    return wrap;
  }
  function partView(q, part) {
    var box = el('div', {});
    box.appendChild(questionText(q, part));
    if (q.type === 'mcq') {
      var shown = part.opts.map(function (o, i) { return [o.trim(), i]; }).filter(function (o) { return o[0]; });
      if (shown.length) {
        var longest = shown.reduce(function (m, o) { return Math.max(m, o[0].length); }, 0);
        var g = el('div', { class: 'p-opts' + (longest > 34 ? ' one' : '') });
        shown.forEach(function (o, k) { g.appendChild(el('div', {}, el('span', { text: '(' + abc[k] + ')' }), textNode('', o[0]))); });
        box.appendChild(g);
      }
    } else if (q.type === 'match') {
      var pr = pairs(part);
      if (pr.length) {
        var pm = perm(pr.length, q.seed + (part === q.or ? 7 : 0));
        var tb = el('table', { class: 'p-match' }, el('tr', {}, el('th', { text: pt('p_col_a') }), el('th', { text: pt('p_col_b') })));
        pr.forEach(function (p, i) {
          tb.appendChild(el('tr', {}, el('td', {}, '(' + (ROMAN[i] || i + 1) + ') ', textNode('', p[0])), el('td', {}, '(' + abc[i] + ') ', textNode('', pr[pm[i]][1]))));
        });
        box.appendChild(tb);
      }
    }
    return box;
  }
  function answerView(q, part) {
    var s = '';
    if (q.type === 'mcq') {
      var shown = part.opts.map(function (o, i) { return [o.trim(), i]; }).filter(function (o) { return o[0]; });
      var k = shown.findIndex(function (o) { return o[1] === part.ans; });
      if (k >= 0) s = '(' + abc[k] + ') ' + shown[k][0];
    } else if (q.type === 'tf') s = part.ans === 'T' ? pt('p_true') : part.ans === 'F' ? pt('p_false') : '';
    else if (q.type === 'match') {
      var pr = pairs(part), pm = perm(pr.length, q.seed + (part === q.or ? 7 : 0));
      s = pr.map(function (p, i) { return '(' + (ROMAN[i] || i + 1) + ') – (' + abc[pm.indexOf(i)] + ')'; }).join(',  ');
    } else s = String(part.ans || '').trim();
    return s ? el('div', { class: 'p-ans', dir: 'auto', text: s }) : el('div', { class: 'p-none', text: pt('no_answer') });
  }
  function headBlock(root, forKey) {
    var h = P.head;
    if (h.school.trim()) root.appendChild(el('h3', { class: 'p-school', dir: 'auto', text: h.school.trim() }));
    if (forKey) {
      root.appendChild(el('p', { class: 'p-key-h', text: pt('p_key') }));
      var bits = [h.exam, h.cls, h.subject].map(function (x) { return x.trim(); }).filter(Boolean);
      if (bits.length) root.appendChild(el('p', { class: 'p-key-sub', dir: 'auto', text: bits.join('  ·  ') }));
      return;
    }
    if (h.exam.trim()) root.appendChild(el('p', { class: 'p-exam', dir: 'auto', text: h.exam.trim() }));
    var meta = el('div', { class: 'p-meta' });
    function add(lab, val) { if (String(val).trim()) meta.appendChild(el('span', {}, pt(lab) + ': ', textNode('', String(val).trim()))); }
    add('p_class', h.cls); add('p_subject', h.subject); add('p_time', h.time);
    if (h.max !== '' && isFinite(+h.max)) add('p_max', num(+h.max));
    add('p_date', h.date);
    if (P.nameLine) meta.appendChild(el('span', { class: 'wide' }, el('span', {}, pt('p_name') + ': ', el('span', { class: 'p-line' })), el('span', {}, pt('p_roll') + ': ', el('span', { class: 'p-line short' }))));
    if (meta.childNodes.length) root.appendChild(meta);
  }
  function renderViews() {
    var paper = $('#paperView'), key = $('#keyView'), dir = paperDir(), n = 0, empty = 0;
    paper.textContent = ''; key.textContent = '';
    paper.dir = dir; key.dir = dir;
    paper.lang = key.lang = P.labels || EDU.lang;
    headBlock(paper, false); headBlock(key, true);
    paper.appendChild(el('hr', { class: 'p-rule' })); key.appendChild(el('hr', { class: 'p-rule' }));
    var lines = P.instrOn ? P.instr.split(/\n/).map(function (s) { return s.trim(); }).filter(Boolean) : [];
    if (lines.length) {
      var ol = el('ol', {});
      lines.forEach(function (l) { ol.appendChild(el('li', { dir: 'auto', text: l })); });
      paper.appendChild(el('div', { class: 'p-instr' }, el('h4', { text: pt('p_instr') + ':' }), ol));
      paper.appendChild(el('hr', { class: 'p-rule' }));
    }
    var many = P.sections.length > 1;
    P.sections.forEach(function (sec, si) {
      if (!sec.questions.length && !sec.note.trim()) return;
      var m = +sec.marks || 0, cnt = sec.questions.length;
      [paper, key].forEach(function (root) {
        var s = el('div', { class: 'p-sec' });
        if (many) s.appendChild(el('h4', { class: 'p-sec-h', text: pt('p_section', { x: ABC[si] }) }));
        if (root === paper && (sec.note.trim() || cnt)) {
          s.appendChild(el('div', { class: 'p-sec-n' }, textNode('', sec.note.trim()), cnt && m ? el('span', { class: 'm', text: '(' + pt('p_marks_each', { n: num(cnt), m: num(m), t: num(cnt * m) }) + ')' }) : null));
        }
        root.appendChild(s);
      });
      var ps = paper.lastChild, ks = key.lastChild;
      sec.questions.forEach(function (q) {
        n++;
        if (partEmpty(q, q.a) || (q.or && partEmpty(q, q.or))) empty++;
        var body = el('div', {}, partView(q, q.a));
        var kb = el('div', {}, answerView(q, q.a));
        if (q.or) {
          body.appendChild(el('div', { class: 'p-or', text: pt('p_or') })); body.appendChild(partView(q, q.or));
          kb.appendChild(el('div', { class: 'p-or', text: pt('p_or') })); kb.appendChild(answerView(q, q.or));
        }
        var mk = m ? '[' + num(m) + ']' : '';
        ps.appendChild(el('div', { class: 'p-q', 'data-n': n }, el('span', { class: 'n', text: n + '.' }), body, el('span', { class: 'mk', text: mk })));
        ks.appendChild(el('div', { class: 'p-q', 'data-n': n }, el('span', { class: 'n', text: n + '.' }), kb, el('span', { class: 'mk', text: mk })));
      });
    });
    var tot = total();
    if (n) key.appendChild(el('div', { class: 'p-total', text: pt('tot_label') + ': ' + num(tot) }));

    /* marks check */
    var box = $('#total'), max = P.head.max === '' ? NaN : +P.head.max, state, msg;
    if (!isFinite(max)) { state = 'nomax'; msg = t('tot_nomax'); }
    else if (Math.abs(tot - max) < 1e-9) { state = 'ok'; msg = t('tot_ok'); }
    else if (tot < max) { state = 'short'; msg = t('tot_short', { n: num(max - tot) }); }
    else { state = 'over'; msg = t('tot_over', { n: num(tot - max) }); }
    box.className = 'callout ' + (state === 'ok' ? 'success' : state === 'nomax' ? '' : 'danger');
    box.textContent = '';
    box.appendChild(el('span', {}, t('tot_label') + ': ', el('b', { class: 'no-i18n', text: num(tot) + (isFinite(max) ? ' / ' + num(max) : '') })));
    box.appendChild(el('div', { class: 'small', text: msg }));
    box.dataset.total = tot; box.dataset.state = state; box.dataset.questions = n;
    var we = $('#warnEmpty');
    we.hidden = !empty; we.textContent = empty ? t('warn_empty', { n: num(empty) }) : ''; we.dataset.n = empty;

    $('#paperView').hidden = view !== 'paper'; $('#keyView').hidden = view !== 'key';
    $$('#viewSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === view)); });
  }

  /* ------------------------------------------------------------ heading form */
  var HEAD = { fSchool: 'school', fExam: 'exam', fClass: 'cls', fSubject: 'subject', fTime: 'time', fMax: 'max', fDate: 'date' };
  function syncForm() {
    Object.keys(HEAD).forEach(function (id) { $('#' + id).value = P.head[HEAD[id]]; });
    $('#fInstr').value = P.instr; $('#instrOn').checked = P.instrOn; $('#optName').checked = P.nameLine;
    var sel = $('#fLang');
    sel.textContent = '';
    sel.appendChild(el('option', { value: '', i18n: 'lang_same' }));
    (EDU.LANGS || []).forEach(function (L) {
      var code = typeof L === 'string' ? L : L.code, info = typeof L === 'string' ? (EDU.langInfo(L) || {}) : L;
      sel.appendChild(el('option', { value: code, class: 'no-i18n', text: info.native || info.name || code }));
    });
    sel.value = P.labels;
    $('#sampleNote').hidden = !P.sample;
  }
  Object.keys(HEAD).forEach(function (id) {
    var n = $('#' + id);
    n.addEventListener('input', function () { P.head[HEAD[id]] = id === 'fMax' ? (n.value === '' ? '' : numStr(n.value)) : n.value; touch(); });
  });
  $('#fInstr').addEventListener('input', function () { P.instr = $('#fInstr').value; touch(); });
  $('#instrOn').addEventListener('change', function () { P.instrOn = $('#instrOn').checked; touch(); });
  $('#optName').addEventListener('change', function () { P.nameLine = $('#optName').checked; touch(); });
  $('#fLang').addEventListener('change', function () { P.labels = $('#fLang').value; touch(); });
  $('#secAdd').addEventListener('click', function () {
    if (P.sections.length >= MAX_SECTIONS) return;
    P.sections.push({ id: uid(), note: '', marks: 1, questions: [] }); changed();
    var c = $('#sec-' + (P.sections.length - 1)); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest' });
  });
  $$('#viewSeg button').forEach(function (b) { b.addEventListener('click', function () { view = b.dataset.view; renderViews(); }); });

  /* ------------------------------------------------------------ print, save, open */
  function doPrint(v) { view = v; clearTimeout(viewTimer); renderViews(); window.print(); }
  $('#btnPrint').addEventListener('click', function () { doPrint('paper'); });
  $('#btnPrintKey').addEventListener('click', function () { doPrint('key'); });

  function fileBase() {
    var s = [P.head.subject, P.head.cls, P.head.exam].map(function (x) { return x.trim(); }).filter(Boolean).join('-');
    return 'question-paper' + (s ? '-' + s.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 50) : '');
  }
  $('#btnSave').addEventListener('click', function () {
    var copy = JSON.parse(JSON.stringify(P)); copy.sample = false;
    EDU.download(fileBase() + '.json', JSON.stringify({ app: SLUG, v: 1, paper: copy }, null, 1), 'application/json');
    EDU.toast(t('saved_file'));
  });
  $('#btnOpen').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return;
      if (f.size > 3 * 1024 * 1024) { EDU.toast(t('bad_file')); return; }
      EDU.readText(f).then(function (txt) {
        var obj = null, got = null;
        try { obj = JSON.parse(txt); } catch (e) { obj = null; }
        if (obj && obj.app === SLUG && obj.paper) got = cleanPaper(obj.paper);
        if (!got) { EDU.toast(t('bad_file')); return; }
        got.sample = false; P = got; openId = ''; save(); renderAll(); EDU.toast(t('opened'));
      }, function () { EDU.toast(t('bad_file')); });
    });
  });
  $('#btnNew').addEventListener('click', function () {
    if (!window.confirm(t('new_confirm'))) return;
    P = blankPaper(); openId = ''; save(); renderAll();
  });
  $('#btnReset').addEventListener('click', function () {
    if (!window.confirm(t('confirm_reset'))) return;
    store.remove('paper'); P = samplePaper(); openId = ''; view = 'paper'; renderAll();
  });

  /* ------------------------------------------------------------ start */
  function renderAll() { syncForm(); renderEditor(); renderViews(); }
  renderAll();
  EDU.onLang(function () { if (P.sample) { P = samplePaper(); openId = ''; } renderAll(); });
})();
