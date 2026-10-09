/* AI Pathshala video lessons with a built-in player.
   Cards show the YouTube thumbnail; pressing play swaps in the privacy-enhanced YouTube player (youtube-nocookie.com),
   so nothing loads from YouTube until someone chooses to watch. Videos with a `from` time appear only after it
   (scheduled premieres). Used by index.html (#videos, latest few) and videos.html (all, with a language filter).
     EDUVideos.render(box, { limit: 3, filter: true|false })
   To add a video: put it at the TOP of VIDEOS (newest first). Titles are shown as published on YouTube. */
(function () {
  'use strict';
  var VIDEOS = [
    { id: 'j4-PxTIPgyc', lang: 'en', min: 0, from: '2026-10-14T14:30:00Z', title: "Google's FREE AI Study Tool: Gemini Notebook (NotebookLM) Full Tutorial for Beginners" },
    { id: '4-0LiXppkaQ', lang: 'en', min: 0, from: '2026-10-11T14:30:00Z', title: 'Canva for FREE: Full Beginner Tutorial (Templates, Canva AI, Download)' },
    { id: 'WGDKfsH6CIs', lang: 'hi', min: 0, from: '2026-10-10T04:30:00Z', title: 'Teachers के लिए 10 FREE ऐप्स: घंटों का काम मिनटों में | बिना साइन-अप, हिंदी में' },
    { id: 'YqjCjfTzBSw', lang: 'en', min: 35, title: 'Claude AI Full Course for Beginners (35 Minutes, 30+ Real Tasks, No Coding)' },
    { id: 'WPHNwflW838', lang: 'hi', min: 13, title: 'NotebookLM (Gemini Notebook) हिंदी में | नोट्स से पॉडकास्ट, क्विज़, माइंड मैप' },
    { id: 'LZNg84mZc_A', lang: 'hi', min: 12, title: 'Canva फ्री में सीखें हिंदी में | ₹0 में पोस्टर, दिवाली पोस्ट, AI डिज़ाइन और WhatsApp शेयर' },
    { id: 'CWzus88E6l8', lang: 'hi', min: 53, title: 'Claude AI पूरा कोर्स हिंदी में (1 घंटा) | पढ़ाई, दुकान, नौकरी, ऐप, वेबसाइट' },
    { id: 'usEryE8QF0w', lang: 'hi', min: 8, title: 'Claude AI से रिज़्यूमे, Excel, PPT और अर्ज़ी बनाइए | रोज़ के 5 काम हिंदी में (भाग 2)' },
    { id: 'XWb7WyRAvgk', lang: 'hi', min: 12, title: 'Claude AI कैसे चलाएँ? पूरी ट्रेनिंग हिंदी में | Claude Tutorial for Beginners' }
  ];
  var el = function () { return window.EDU.el.apply(null, arguments); };
  var t = function (k, v) { return window.EDU.t(k, v); };

  function live() {
    var now = Date.now();
    return VIDEOS.filter(function (v) { return !v.from || Date.parse(v.from) <= now; });
  }

  function play(card, v) {
    var frame = el('iframe', {
      src: 'https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0&modestbranding=1&hl=' + (window.EDU.lang || 'en'),
      title: v.title, allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin', loading: 'lazy'
    });
    var media = card.querySelector('.vid-media');
    media.innerHTML = '';
    media.appendChild(frame);
  }

  function card(v) {
    var btn = el('button', { class: 'vid-play', type: 'button', 'aria-label': t('vid_play', { title: v.title }) },
      el('img', { src: 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg', alt: '', loading: 'lazy', width: '480', height: '360' }),
      el('span', { class: 'vid-btn', 'aria-hidden': 'true', html: '<svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.3.3 34 .3 34 .3s-21.3 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 12.9.1 24 .1 24s0 11.1 1.4 16.3a8.5 8.5 0 0 0 6 6C12.7 47.7 34 47.7 34 47.7s21.3 0 26.5-1.4a8.5 8.5 0 0 0 6-6c1.4-5.2 1.4-16.3 1.4-16.3s0-11.1-1.4-16.3z" fill="#f00"/><path d="M45 24 27 14v20z" fill="#fff"/></svg>' }),
      v.min ? el('span', { class: 'vid-dur', text: t('vid_min', { n: v.min }) }) : null);
    var c = el('article', { class: 'card vid-card' },
      el('div', { class: 'vid-media' }, btn),
      el('div', { class: 'vid-body' },
        el('span', { class: 'vid-lang', text: v.lang === 'hi' ? t('vid_hi') : t('vid_en') }),
        el('h3', { class: 'no-i18n', lang: v.lang, text: v.title }),
        el('a', { class: 'vid-yt', href: 'https://www.youtube.com/watch?v=' + v.id, target: '_blank', rel: 'noopener', text: t('vid_yt') + ' ↗' })));
    btn.addEventListener('click', function () { play(c, v); });
    return c;
  }

  function render(box, opts) {
    opts = opts || {};
    var state = { lang: 'all' };
    function draw() {
      box.innerHTML = '';
      if (opts.filter) {
        var bar = el('div', { class: 'vid-filter', role: 'group', 'aria-label': t('vid_title') });
        [['all', t('vid_all')], ['hi', t('vid_hi')], ['en', t('vid_en')]].forEach(function (f) {
          var b = el('button', { class: 'chip', type: 'button', 'aria-pressed': String(state.lang === f[0]), text: f[1] });
          b.addEventListener('click', function () { state.lang = f[0]; draw(); });
          bar.appendChild(b);
        });
        box.appendChild(bar);
      }
      var list = live().filter(function (v) { return state.lang === 'all' || v.lang === state.lang; });
      if (opts.limit) list = list.slice(0, opts.limit);
      var grid = el('div', { class: 'vid-grid' });
      list.forEach(function (v) { grid.appendChild(card(v)); });
      box.appendChild(grid);
      box.appendChild(el('p', { class: 'vid-note', text: t('vid_note') }));
    }
    draw();
    window.EDU.onLang(draw);
  }

  window.EDUVideos = { render: render, list: live };
})();
