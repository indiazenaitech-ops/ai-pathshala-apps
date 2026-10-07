/* Offline support: every page you open once keeps working without internet.
   Same-origin files: network first (so updates arrive), cache as fallback.
   Libraries/fonts from CDNs: cache first. */
var CACHE = 'edu-apps-v1';
/* Cache name stays the same on purpose: bumping it would wipe every app a school already opened offline.
   Network-first means updates arrive anyway; sw.js changing is enough to re-run install for new CORE files. */
var CORE = ['./', './index.html', './catalog.js', './shared/edu.css', './shared/edu.js', './shared/home.js', './shared/home-strings.js',
  './schools.html', './shared/schools.js', './shared/schools-strings.js', './shared/img/icon-96.png', './shared/img/icon-192.png'];
var CDN = /(^|\.)(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () { }); })); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* A page opened before this worker existed (first visit) sends the list of its own same-origin files
   (see registerSW in shared/edu.js); cache the ones not cached yet so the page also works offline. */
self.addEventListener('message', function (e) {
  var d = e.data || {};
  if (d.type !== 'edu-cache' || !Array.isArray(d.urls)) return;
  var urls = d.urls.filter(function (u) {
    try { return new URL(u).origin === location.origin; } catch (x) { return false; }
  }).slice(0, 150);
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(urls.map(function (u) {
      return c.match(u).then(function (hit) { return hit || c.add(u).catch(function () { }); });
    }));
  }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  var url = new URL(req.url);
  if (url.origin === location.origin) {
    /* cache: 'no-cache' asks the server whether the file changed (a quick 304 if not), so site updates reach phones at
       once instead of after the browser's 10-minute HTTP cache; offline still falls back to the saved copy below. */
    var fresh = req.mode === 'navigate' ? req : new Request(req, { cache: 'no-cache' });
    e.respondWith(fetch(fresh).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match(req, { ignoreSearch: true }); });
    }));
  } else if (CDN.test(url.hostname)) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      });
    }));
  }
});
