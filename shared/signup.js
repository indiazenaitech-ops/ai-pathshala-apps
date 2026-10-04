/* AI Pathshala Apps: the "Stay updated" sign-up form (updates list for adults: new free apps, Hindi AI lessons,
 * interest in AI training for a school or organisation).
 *
 * Use on a page: an empty container   <section class="card su" id="updates" data-signup="home|schools|business"></section>
 * and, after the page's own script (which calls EDU.init), these classic scripts:
 *   shared/firebase-config.js → shared/cloud-mock.js → shared/cloud.js → shared/signup-strings.js → shared/signup.js
 *
 * Privacy: nothing leaves the page until the visitor presses the button with the consent box ticked. Then ONE call:
 * EDUCloud.registerInterest(data) (Firebase mode: one create-only write to interest/{id}; Demo mode: this browser only).
 * No tracking, no cookies. A hidden "website" field catches simple bots (they get a fake "thank you").
 * Social proof: when the form comes near the screen, EDUCloud.signupCount() reads ONE public number (stats/signups,
 * one plain GET without cookies, once per page; Demo mode: the sign-ups in this browser). From 25 sign-ups on, the form
 * says "Join 120+ teachers & learners…" (rounded DOWN to tens); below that, or when the number is unknown, a neutral line.
 * A sign-up also tells the shell's "get updates" reminder (shared/edu.js) to stop: EDU.store('cta') 'joined'.
 * Free "AI Classroom Starter Pack" (downloads/*.pdf, built by tools/make_starter_pack.js): never behind the form. The
 * schools page shows it to everyone above the form; after a sign-up, every page shows the two download links.
 * Opened from a downloaded ZIP (file://): a short note and an email link instead of the form.
 * Strings: shared/signup-strings.js (window.SIGNUP_STRINGS, 12 languages). Test: node tools/tests/_signup.check.js */
(function () {
  'use strict';
  if (!window.EDU) return;
  var EDU = window.EDU, el = EDU.el;
  var STR = window.SIGNUP_STRINGS || {};
  var ROLES = ['teacher', 'principal', 'student', 'parent', 'org', 'other'];
  var TOPICS = ['apps', 'videos', 'training'];
  var DEFAULT_TOPICS = ['apps', 'videos'];
  var PAGES = ['home', 'schools', 'business'];
  var MAX = { name: 60, org: 80, place: 60, email: 254 };
  var PACK = { hi: 'downloads/ai-classroom-starter-pack-hi.pdf', en: 'downloads/ai-classroom-starter-pack-en.pdf' };

  function st(key, vars) {
    var L = EDU.lang, v = (STR[L] && STR[L][key]);
    if (v === undefined) v = STR.en && STR.en[key];
    if (v === undefined) v = key;
    if (vars) v = String(v).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return v;
  }
  function cloud() { return window.EDUCloud || null; }
  function contact() {
    var e = String((EDU.SITE && EDU.SITE.contact) || window.EDU_CONTACT_EMAIL || '').trim();
    return /^[^\s@<>"'?&]+@[^\s@<>"'?&]+\.[a-z]{2,}$/i.test(e) ? e : '';
  }
  function emailOk(v) {
    var c = cloud();
    if (c && typeof c.validEmail === 'function') return c.validEmail(v);
    var e = String(v || '').trim().toLowerCase();
    return e.length >= 6 && e.length <= MAX.email && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]{2,}$/.test(e) ? e : null;
  }

  var CSS = [
    '.su { border-inline-start: 5px solid var(--accent); }',
    '.su-head { display: flex; gap: 12px; align-items: flex-start; }',
    '.su-head .su-ic { font-size: 2rem; line-height: 1.1; flex: none; }',
    '.su-head h2 { margin: 0 0 6px; }',
    '.su-head p { margin: 0; color: var(--muted); max-width: 70ch; }',
    '.su-head p.su-proof { display: inline-flex; align-items: center; gap: 6px; margin: 10px 0 0; padding: 4px 12px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); font-weight: 700; font-size: .9rem; max-width: 100%; }',
    '.su-form { margin-top: 14px; display: grid; gap: 14px; }',
    '.su-grid { display: grid; gap: 12px 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr)); }',
    '.su-grid input, .su-grid select { width: 100%; min-height: 44px; }',
    '.su-req { color: var(--danger); font-weight: 700; }',
    '.su-topics { border: 1px solid var(--border); border-radius: var(--radius-sm, 10px); padding: 10px 14px 12px; margin: 0; min-width: 0; }',
    '.su-topics legend { font-weight: 600; font-size: .92rem; padding: 0 6px; }',
    '.su-checks { display: flex; flex-wrap: wrap; gap: 8px 22px; }',
    '.su .check { min-height: 40px; align-items: center; }',
    '.su .check input, .su-consent input { flex: none; }',
    '.su-consent { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; font-weight: 500; cursor: pointer; }',
    '.su-consent input { margin-top: 3px; width: 20px; height: 20px; }',
    '.su-err { color: var(--danger); font-size: .88rem; font-weight: 600; margin: 2px 0 0; }',
    '.su [aria-invalid="true"] { border-color: var(--danger); outline-color: var(--danger); }',
    '.su-actions { display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; }',
    '.su-status:empty { display: none; }',
    '.su-status .row { margin-top: 8px; }',
    '.su-done, .su-file { margin-top: 14px; }',
    '.su-done h3 { margin: 0 0 6px; }',
    '.su-pack { display: flex; gap: 14px; align-items: flex-start; margin-top: 14px; padding: 12px 14px; border-radius: var(--radius-sm, 10px); background: var(--primary-soft); border: 1px solid color-mix(in srgb, var(--primary) 30%, var(--border)); }',
    '.su-pack-ic { font-size: 2rem; line-height: 1.1; flex: none; }',
    '.su-pack h3 { margin: 0 0 4px; font-size: 1.05rem; }',
    '.su-pack p { margin: 0 0 10px; color: var(--muted); max-width: 75ch; }',
    '.su-pack-links, .su-done-pack { display: flex; flex-wrap: wrap; gap: 8px 10px; align-items: center; }',
    '.su-done-pack { margin: 4px 0 10px; }',
    '.su-done-pack .su-dp-lbl { flex: 1 1 100%; font-weight: 600; }',
    '.su-done p { margin: 0 0 8px; }',
    '.su-mail { margin: 14px 0 0; display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: center; }',
    '.su-mail a.su-addr { font-weight: 700; word-break: break-all; }',
    /* honeypot: off screen for people, still in the form for simple bots (no left/right, so RTL pages never scroll) */
    '.su-hp { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; }',
    '.su-wrap { position: relative; }',
    ':root[lang="ur"] .su h2, :root[lang="ur"] .su h3 { line-height: 2.1; }',
    ':root[lang="ur"] .su label, :root[lang="ur"] .su legend, :root[lang="ur"] .su p { line-height: 1.9; }',
    '@media (max-width: 560px) { .su-actions .btn { flex: 1 1 100%; } .su-head .su-ic, .su-pack-ic { display: none; } .su-pack-links .btn { flex: 1 1 auto; } }'
  ].join('\n');

  function addStyle() {
    if (document.getElementById('su-style')) return;
    var s = document.createElement('style');
    s.id = 'su-style';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function mount(box) {
    if (!box || box.getAttribute('data-su-ready')) return;
    box.setAttribute('data-su-ready', '1');
    addStyle();
    var page = box.getAttribute('data-signup');
    if (PAGES.indexOf(page) < 0) page = 'home';
    var isFile = location.protocol === 'file:';
    var busy = false, langTouched = false;
    var T = [];   /* [element, key] pairs re-translated on language change */
    function tx(node, key) { T.push([node, key]); node.textContent = st(key); return node; }
    function req() { return el('span', { class: 'su-req', 'aria-hidden': 'true', text: ' *' }); }

    /* ---- head */
    var proof = el('p', { class: 'su-proof', id: 'su-proof' });
    var proofN = null;      /* the sign-up count, once known */
    var head = el('div', { class: 'su-head' },
      el('div', { class: 'su-ic', 'aria-hidden': 'true', text: '✉️' }),
      el('div', null, tx(el('h2', { id: 'su-h' }), 'su_title'), tx(el('p', { id: 'su-intro' }), 'su_intro_' + page), proof));
    box.setAttribute('aria-labelledby', 'su-h');
    /* "Join 120+ teachers & learners…" from 25 sign-ups on (rounded down to tens), otherwise a neutral line.
       The number (with its "+") is kept left-to-right inside Urdu text with Unicode isolates. */
    function renderProof() {
      if (typeof proofN === 'number' && isFinite(proofN) && proofN >= 25) {
        var r = Math.floor(proofN / 10) * 10, num = EDU.fmt(r), mark = '\u0001';
        var txt = st('su_proof', { n: mark });
        txt = txt.replace(mark + '+', '\u2066' + num + '+\u2069').replace(mark, '\u2066' + num + '\u2069');
        proof.textContent = '👥 ' + txt;
        proof.setAttribute('data-n', String(r));
      } else {
        proof.textContent = '✓ ' + st('su_proof_none');
        proof.removeAttribute('data-n');
      }
    }
    function loadCount() {
      var c = cloud();
      if (isFile || !c || typeof c.signupCount !== 'function') return;
      Promise.resolve().then(function () { return c.signupCount(); }).then(function (n) {
        proofN = typeof n === 'number' ? n : null;
        renderProof();
      }, function () { });
    }
    /* ask only when the form comes near the screen (no request for visitors who never scroll this far) */
    (function () {
      if (!('IntersectionObserver' in window)) { setTimeout(loadCount, 1500); return; }
      var io = new IntersectionObserver(function (entries) {
        if (!entries.some(function (e) { return e.isIntersecting; })) return;
        io.disconnect();
        loadCount();
      }, { rootMargin: '600px 0px' });
      io.observe(box);
    })();

    /* ---- fields */
    function errEl(id) { return el('p', { class: 'su-err', id: id, hidden: true, role: 'alert' }); }
    var email = el('input', { type: 'email', id: 'su-email', name: 'email', autocomplete: 'email', inputmode: 'email', maxlength: String(MAX.email), required: true, 'aria-describedby': 'su-email-err', spellcheck: 'false', class: 'no-i18n' });
    var name = el('input', { type: 'text', id: 'su-name', name: 'name', autocomplete: 'name', maxlength: String(MAX.name) });
    var role = el('select', { id: 'su-role', name: 'role', required: true, 'aria-describedby': 'su-role-err' });
    role.appendChild(tx(el('option', { value: '' }), 'su_role_choose'));
    ROLES.forEach(function (r) { role.appendChild(tx(el('option', { value: r }), 'su_role_' + r)); });
    var org = el('input', { type: 'text', id: 'su-org', name: 'organisation', autocomplete: 'organization', maxlength: String(MAX.org) });
    var place = el('input', { type: 'text', id: 'su-place', name: 'place', autocomplete: 'address-level2', maxlength: String(MAX.place) });
    var lang = el('select', { id: 'su-lang', name: 'language', 'data-no-i18n': '' });
    EDU.LANGS.forEach(function (l) { lang.appendChild(el('option', { value: l.code, lang: l.code, text: l.native })); });
    lang.value = EDU.lang;
    lang.addEventListener('change', function () { langTouched = true; });

    var emailErr = errEl('su-email-err'), roleErr = errEl('su-role-err'), topicsErr = errEl('su-topics-err'), consentErr = errEl('su-consent-err');
    function field(input, key) {
      return el('div', { class: 'field' }, tx(el('label', { for: input.id }), key), input);
    }
    var lblEmail = el('label', { for: 'su-email' }); tx(lblEmail, 'su_email');
    var grid = el('div', { class: 'su-grid' },
      el('div', { class: 'field' }, el('span', { class: 'su-lbl-wrap' }, lblEmail, req()), email, emailErr),
      field(name, 'su_name'),
      el('div', { class: 'field' }, el('span', null, tx(el('label', { for: 'su-role' }), 'su_role'), req()), role, roleErr),
      field(org, 'su_org'),
      field(place, 'su_place'),
      field(lang, 'su_lang'));

    var topicBoxes = {};
    var checks = el('div', { class: 'su-checks' });
    TOPICS.forEach(function (tp) {
      var cb = el('input', { type: 'checkbox', id: 'su-t-' + tp, name: 'topics', value: tp });
      cb.checked = DEFAULT_TOPICS.indexOf(tp) >= 0;
      topicBoxes[tp] = cb;
      checks.appendChild(el('label', { class: 'check', for: cb.id }, cb, tx(el('span'), 'su_t_' + tp)));
    });
    var topics = el('fieldset', { class: 'su-topics', id: 'su-topics', 'aria-describedby': 'su-topics-err' },
      tx(el('legend'), 'su_topics'), checks, topicsErr);

    var hp = el('input', { type: 'text', id: 'su-website', name: 'website', tabindex: '-1', autocomplete: 'off' });
    var honey = el('div', { class: 'su-hp', 'aria-hidden': 'true' }, tx(el('label', { for: 'su-website' }), 'su_hp'), hp);

    var consent = el('input', { type: 'checkbox', id: 'su-consent', name: 'consent', required: true, 'aria-describedby': 'su-consent-err' });
    var privacyLink = el('a', { id: 'su-privacy', target: '_blank', rel: 'noopener' });
    tx(privacyLink, 'su_privacy');
    var consentRow = el('div', null,
      el('label', { class: 'su-consent', for: 'su-consent' }, consent, tx(el('span', { id: 'su-consent-text' }), 'su_consent')),
      el('p', { class: 'small', style: { margin: '6px 0 0', paddingInlineStart: '30px' } }, '🔒 ', privacyLink),
      consentErr);

    var demoNote = tx(el('p', { class: 'callout warning small', id: 'su-demo-note', hidden: true, style: { margin: 0 } }), 'su_demo_note');
    var submit = el('button', { type: 'submit', class: 'btn btn-primary btn-lg', id: 'su-submit' });
    var submitTxt = tx(el('span'), 'su_submit');
    submit.appendChild(el('span', { 'aria-hidden': 'true', text: '✉️ ' }));
    submit.appendChild(submitTxt);
    var safe = tx(el('p', { class: 'small muted', style: { margin: 0 } }), 'su_safe');
    var status = el('div', { class: 'su-status', id: 'su-status', 'aria-live': 'polite' });

    var form = el('form', { class: 'su-form', id: 'su-form', novalidate: true },
      grid, topics, honey, consentRow, demoNote,
      el('div', { class: 'su-actions' }, submit, safe),
      status);

    /* ---- success state */
    var doneTitle = tx(el('h3', { id: 'su-done-title', tabindex: '-1' }), 'su_ok_title');
    var doneDemo = tx(el('p', { class: 'small', id: 'su-done-demo', hidden: true }), 'su_ok_demo');
    var again = el('button', { type: 'button', class: 'btn btn-sm', id: 'su-again' });
    tx(again, 'su_again');
    /* ---- the free Starter Pack: two PDF links (the edition for this language first) */
    function packLink(ed, id, cls) {
      var a = el('a', { class: cls, id: id, target: '_blank', rel: 'noopener', type: 'application/pdf', 'data-ed': ed });
      a.appendChild(el('span', { 'aria-hidden': 'true', text: '⬇ ' }));
      a.appendChild(tx(el('span'), 'su_pack_' + ed));
      return a;
    }
    var packBoxes = [];
    function packRow(row, idp, primary, other) {
      var links = { hi: packLink('hi', idp + '-hi', ''), en: packLink('en', idp + '-en', '') };
      packBoxes.push({ row: row, links: links, primary: primary, other: other });
      return row;
    }
    function renderPack() {
      var first = (EDU.lang === 'hi' || EDU.lang === 'mr') ? 'hi' : 'en';
      packBoxes.forEach(function (b) {
        ['hi', 'en'].forEach(function (ed) {
          var a = b.links[ed];
          a.href = (EDU.ROOT || '') + PACK[ed];
          a.className = ed === first ? b.primary : b.other;
          b.row.appendChild(a);
        });
        b.row.appendChild(b.links[first === 'hi' ? 'en' : 'hi']);
      });
    }
    var donePack = packRow(el('p', { class: 'su-done-pack', id: 'su-done-pack' }, tx(el('span', { class: 'su-dp-lbl' }), 'su_ok_pack')), 'su-done-pack', 'btn btn-sm btn-primary', 'btn btn-sm');
    var done = el('div', { class: 'callout success su-done', id: 'su-done', hidden: true, 'aria-live': 'polite' },
      doneTitle, tx(el('p'), 'su_ok_text'), donePack, doneDemo, again);
    /* public on the schools page: no sign-up needed */
    var packCard = page !== 'schools' ? null : el('div', { class: 'su-pack', id: 'su-pack' },
      el('div', { class: 'su-pack-ic', 'aria-hidden': 'true', text: '📘' }),
      el('div', null, tx(el('h3', { id: 'su-pack-h' }), 'su_pack_title'), tx(el('p', { id: 'su-pack-text' }), 'su_pack_text'),
        packRow(el('div', { class: 'su-pack-links' }), 'su-pack', 'btn btn-accent', 'btn')));

    /* ---- file:// note */
    var fileMail = el('a', { class: 'btn btn-primary', id: 'su-file-mail' });
    var fileNote = el('div', { class: 'callout su-file', id: 'su-file', hidden: true },
      tx(el('p', { style: { margin: '0 0 8px' } }), 'su_file'), fileMail);
    fileMail.appendChild(el('span', { 'aria-hidden': 'true', text: '✉ ' }));
    fileMail.appendChild(tx(el('span'), 'su_mail_btn'));

    /* ---- "Prefer email?" line */
    var addr = el('a', { class: 'su-addr no-i18n', id: 'su-addr' });
    var mailLine = el('p', { class: 'small muted su-mail', id: 'su-mail' }, tx(el('span'), 'su_mail_line'), addr);

    box.innerHTML = '';
    box.appendChild(el('div', { class: 'su-wrap' }, head, packCard, form, done, fileNote, mailLine));

    /* ---- behaviour */
    function values() {
      return {
        email: email.value, name: name.value, role: role.value, org: org.value, place: place.value,
        prefLang: lang.value, topics: TOPICS.filter(function (tp) { return topicBoxes[tp].checked; }),
        consent: consent.checked === true, lang: EDU.lang, page: page
      };
    }
    function mailto() {
      var c = contact();
      if (!c) return '';
      var v = values(), lines = [];
      function add(key, val) { val = String(val || '').trim(); if (val) lines.push(st(key) + ': ' + val); }
      add('su_email', v.email);
      add('su_d_name', v.name);
      if (v.role) add('su_role', st('su_role_' + v.role));
      add('su_d_org', v.org);
      add('su_d_place', v.place);
      var info = EDU.langInfo ? EDU.langInfo(v.prefLang) : null;
      add('su_d_lang', info ? info.native : v.prefLang);
      add('su_d_topics', v.topics.map(function (tp) { return st('su_t_' + tp); }).join(', '));
      return 'mailto:' + c + '?subject=' + encodeURIComponent(st('su_mail_subject')) +
        '&body=' + encodeURIComponent(st('su_mail_body', { details: lines.join('\n') }));
    }
    function refreshLinks() {
      var c = contact(), href = mailto();
      privacyLink.href = (EDU.ROOT || '') + 'legal/privacy.html?lang=' + EDU.lang + '#updates';
      addr.textContent = c;
      addr.href = href;
      mailLine.hidden = !c;
      fileMail.href = href;
      fileMail.hidden = !c;
      Array.prototype.forEach.call(status.querySelectorAll('a.su-status-mail'), function (a) { a.href = href; });
    }
    function setErr(p, input, key) {
      if (key) { p.textContent = st(key); p.setAttribute('data-key', key); p.hidden = false; }
      else { p.textContent = ''; p.removeAttribute('data-key'); p.hidden = true; }
      if (input) { if (key) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
    }
    function clearErrs() { setErr(emailErr, email); setErr(roleErr, role); setErr(topicsErr, topics); setErr(consentErr, consent); }
    function showStatus(key, withMail) {
      status.innerHTML = '';
      if (!key) return;
      var box2 = el('div', { class: 'callout danger', role: 'alert' }, el('p', { style: { margin: 0 }, 'data-key': key, text: st(key) }));
      if (withMail && contact()) {
        box2.appendChild(el('div', { class: 'row' },
          el('a', { class: 'btn btn-sm su-status-mail', href: mailto() }, el('span', { 'aria-hidden': 'true', text: '✉ ' }), el('span', { 'data-key': 'su_mail_btn', text: st('su_mail_btn') }))));
      }
      status.appendChild(box2);
    }
    function setBusy(b) {
      busy = b;
      submit.disabled = b;
      submitTxt.textContent = st(b ? 'su_sending' : 'su_submit');
      form.setAttribute('aria-busy', b ? 'true' : 'false');
    }
    function showDone(demo) {
      form.hidden = true;
      done.hidden = false;
      doneDemo.hidden = !demo;
      try { doneTitle.focus(); } catch (e) { }
    }
    function reset() {
      form.reset();
      TOPICS.forEach(function (tp) { topicBoxes[tp].checked = DEFAULT_TOPICS.indexOf(tp) >= 0; });
      if (!langTouched) lang.value = EDU.lang;
      clearErrs(); showStatus(null);
      done.hidden = true; form.hidden = false;
      try { email.focus(); } catch (e) { }
    }
    var ERR = { offline: ['su_err_offline', false], 'quota-exceeded': ['su_err_quota', true], 'invalid-input': ['su_err_invalid', false] };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      clearErrs(); showStatus(null);
      /* bots fill every field; people never see this one */
      if (hp.value) { showDone(false); return; }
      var v = values(), first = null;
      if (!emailOk(v.email)) { setErr(emailErr, email, 'su_err_email'); first = first || email; }
      if (ROLES.indexOf(v.role) < 0) { setErr(roleErr, role, 'su_err_role'); first = first || role; }
      if (!v.topics.length) { setErr(topicsErr, topics, 'su_err_topics'); first = first || topicBoxes.apps; }
      if (!v.consent) { setErr(consentErr, consent, 'su_err_consent'); first = first || consent; }
      if (first) { try { first.focus(); } catch (x) { } return; }
      var c = cloud();
      if (!c || typeof c.registerInterest !== 'function') { showStatus('su_err_other', true); return; }
      setBusy(true);
      Promise.resolve().then(function () { return c.registerInterest(v); }).then(function (res) {
        setBusy(false);
        try { EDU.store('cta').set('joined', Date.now()); } catch (x) { }    /* the shell's "get updates" reminder stops */
        showDone(!!((res && res.demo) || c.isDemo));
      }, function (err) {
        setBusy(false);
        var code = String((err && err.code) || 'unknown');
        var m = ERR[code] || ['su_err_other', true];
        showStatus(m[0], m[1]);
        if (window.console && console.info) console.info('[signup] not saved:', code);
      });
    });
    again.addEventListener('click', reset);
    [email, name, role, org, place, consent].forEach(function (inp) { inp.addEventListener('change', refreshLinks); });
    email.addEventListener('input', function () { if (!emailErr.hidden && emailOk(email.value)) setErr(emailErr, email); });
    role.addEventListener('change', function () { if (!roleErr.hidden && role.value) setErr(roleErr, role); });
    consent.addEventListener('change', function () { if (consent.checked) setErr(consentErr, consent); });
    TOPICS.forEach(function (tp) { topicBoxes[tp].addEventListener('change', function () { refreshLinks(); if (topicBoxes[tp].checked) setErr(topicsErr, topics); }); });

    function render() {
      T.forEach(function (p) { if (p[0] !== submitTxt) p[0].textContent = st(p[1]); });
      renderProof();
      renderPack();
      submitTxt.textContent = st(busy ? 'su_sending' : 'su_submit');
      [emailErr, roleErr, topicsErr, consentErr].forEach(function (p) { var k = p.getAttribute('data-key'); if (k) p.textContent = st(k); });
      Array.prototype.forEach.call(status.querySelectorAll('[data-key]'), function (n) { n.textContent = st(n.getAttribute('data-key')); });
      if (!langTouched) lang.value = EDU.lang;
      var c = cloud();
      demoNote.hidden = isFile || !(c && c.isDemo);
      form.hidden = isFile || !done.hidden;
      fileNote.hidden = !isFile;
      refreshLinks();
    }
    EDU.onLang(render);
    render();
  }

  function mountAll() { Array.prototype.forEach.call(document.querySelectorAll('[data-signup]'), mount); }
  window.EDUSignup = { mount: mount, strings: function () { return STR; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();
})();
