/* Template app: shows the patterns every app follows. */
(function () {
  'use strict';
  var store = EDU.store('_template');          // namespaced storage that never throws
  var count = store.get('count', 0);

  EDU.init({ slug: '_template', title: 'app_title' });

  function render() {                           // re-run on every language change
    EDU.$('#count').textContent = EDU.fmt(count);
    EDU.$('#status').textContent = EDU.t('clicked_n', { n: EDU.fmt(count) });
  }

  EDU.$('#plus').addEventListener('click', function () { count++; store.set('count', count); render(); });
  EDU.$('#reset').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    count = 0; store.set('count', count); render();
  });
  EDU.$('#say').addEventListener('click', function () {
    EDU.speak(EDU.t('clicked_n', { n: count })).then(function (ok) { if (!ok) EDU.toast(EDU.t('no_voice')); });
  });

  EDU.onLang(render);
  render();
})();
