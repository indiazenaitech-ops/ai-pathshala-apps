/* AI Pathshala: public visitor counter ("👀 12,345 visitors") in the page footer.
 *
 * One Firestore document stats/visits = {count}. Nothing about the visitor is stored: no ID, no cookie, no IP,
 * only the number goes up by 1 (firestore.rules allow exactly +1 and nothing else, no sign-in needed).
 * A browser is counted at most once per day (localStorage 'edu.visit' = YYYY-MM-DD); on other visits that day
 * the page only reads the number. One REST call per page, no Firebase SDK; the result is kept 10 minutes in
 * sessionStorage so moving between pages costs nothing.
 * Off on file:// (downloaded ZIP), localhost/127.0.0.1 (tests), ?mock=1, and when EDU_FIREBASE is null.
 * If the rules are not published yet or the network fails, the badge simply stays hidden.
 * Needs shared/edu.js and shared/firebase-config.js loaded first. */
(function () {
  'use strict';
  var STR = {
    en: 'visitors', hi: 'विज़िटर', bn: 'ভিজিটর', mr: 'भेट देणारे', gu: 'મુલાકાતીઓ', pa: 'ਵਿਜ਼ਿਟਰ',
    or: 'ଭିଜିଟର', ta: 'பார்வையாளர்கள்', te: 'సందర్శకులు', kn: 'ಸಂದರ್ಶಕರು', ml: 'സന്ദർശകർ', ur: 'وزیٹرز'
  };
  var CACHE = 'edu.visits.n', TTL = 10 * 60 * 1000, DAY_KEY = 'edu.visit';
  var cfg = window.EDU_FIREBASE, EDU = window.EDU;
  if (!EDU || !cfg || !cfg.projectId || !cfg.apiKey || typeof fetch !== 'function') return;
  if (!/^https?:$/.test(location.protocol) || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
  if (/[?&]mock=1\b/.test(location.search)) return;

  var base = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(cfg.projectId) + '/databases/(default)/documents';
  var key = '?key=' + encodeURIComponent(cfg.apiKey);

  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { } }
  function num(f) {
    var v = f ? (f.integerValue !== undefined ? f.integerValue : f.doubleValue) : undefined, n = Number(v);
    return v !== undefined && isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }
  function cached() {
    try { var c = JSON.parse(window.sessionStorage.getItem(CACHE) || 'null'); if (c && Date.now() - c.at < TTL) return c.n; } catch (e) { }
    return null;
  }
  function remember(n) { try { window.sessionStorage.setItem(CACHE, JSON.stringify({ n: n, at: Date.now() })); } catch (e) { } }

  function count() {
    var n = cached();
    if (lsGet(DAY_KEY) === today() && n !== null) return Promise.resolve(n);
    if (lsGet(DAY_KEY) !== today()) {
      /* +1 via a field transform; the reply carries the new total, so this is the only request */
      var body = { writes: [{ transform: {
        document: 'projects/' + cfg.projectId + '/databases/(default)/documents/stats/visits',
        fieldTransforms: [{ fieldPath: 'count', increment: { integerValue: '1' } }] } }] };
      return fetch(base + ':commit' + key, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          var v = j && j.writeResults && j.writeResults[0] && j.writeResults[0].transformResults && num(j.writeResults[0].transformResults[0]);
          if (v === null || v === undefined) return read();
          lsSet(DAY_KEY, today());
          return v;
        });
    }
    return read();
  }
  function read() {
    return fetch(base + '/stats/visits' + key, { credentials: 'omit', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.fields ? num(j.fields.count) : null; });
  }

  var badge = null, total = null;
  function render() {
    if (total === null) return;
    var foot = document.querySelector('.edu-foot-about') || document.querySelector('.edu-foot-in');
    if (!foot) return;
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'edu-visits';
      badge.style.cssText = 'white-space:nowrap;opacity:.85;display:block';
      foot.appendChild(badge);
    }
    var L = EDU.lang || 'en', fmt;
    try { fmt = total.toLocaleString(L === 'ur' ? 'ur-IN' : L + '-IN'); } catch (e) { fmt = String(total); }
    badge.textContent = '👀 ' + fmt + ' ' + (STR[L] || STR.en);
  }

  function start() {
    count().then(function (n) {
      if (typeof n !== 'number') return;
      total = n; remember(n); render();
      if (EDU.onLang) EDU.onLang(render);
    }, function () { });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
