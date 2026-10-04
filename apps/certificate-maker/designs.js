/* Certificate Maker: the 5 certificate designs (pure SVG frames + seal) and the certificate CSS.
   The same CSS is put into the page AND into the SVG used for "Save as PNG", so the image matches the print. */
(function () {
  'use strict';
  var W = 1122, H = 793;   /* A4 landscape at 96 px per inch (297 x 210 mm) */

  function n(v) { return Math.round(v * 100) / 100; }
  function rosette(cx, cy, rad, count, fill, op, rot) {
    var s = '<g fill="' + fill + '" opacity="' + op + '"' + (rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '') + '>';
    for (var i = 0; i < count; i++) {
      s += '<ellipse cx="' + n(cx) + '" cy="' + n(cy - rad / 2) + '" rx="' + n(rad * 0.17) + '" ry="' + n(rad / 2) + '" transform="rotate(' + n(360 * i / count) + ' ' + n(cx) + ' ' + n(cy) + ')"/>';
    }
    return s + '</g>';
  }
  /* draw one ornament (made for the top-left corner, origin 0,0) in all four corners */
  function corners(g, inset) {
    return '<g transform="translate(' + inset + ' ' + inset + ')">' + g + '</g>' +
      '<g transform="translate(' + (W - inset) + ' ' + inset + ') scale(-1 1)">' + g + '</g>' +
      '<g transform="translate(' + inset + ' ' + (H - inset) + ') scale(1 -1)">' + g + '</g>' +
      '<g transform="translate(' + (W - inset) + ' ' + (H - inset) + ') scale(-1 -1)">' + g + '</g>';
  }
  /* a frame-shaped band between two insets */
  function band(o, i) {
    return 'M' + o + ' ' + o + 'H' + (W - o) + 'V' + (H - o) + 'H' + o + 'Z' +
      'M' + i + ' ' + i + 'V' + (H - i) + 'H' + (W - i) + 'V' + i + 'Z';
  }
  function rect(inset, stroke, width, extra) {
    return '<rect x="' + inset + '" y="' + inset + '" width="' + (W - 2 * inset) + '" height="' + (H - 2 * inset) + '" fill="none" stroke="' + stroke + '" stroke-width="' + width + '"' + (extra || '') + '/>';
  }
  function rot180(g) { return '<g transform="rotate(180 ' + W / 2 + ' ' + H / 2 + ')">' + g + '</g>'; }

  var FRAMES = {
    classic: function (u) {
      var gold = 'url(#cg' + u + ')';
      var corner = '<path d="M0 0H118Q44 12 0 118Z" fill="' + gold + '"/>' +
        '<circle cx="24" cy="24" r="10" fill="#fffaf0" stroke="#8a6114" stroke-width="2"/>' +
        '<circle cx="24" cy="24" r="4" fill="#b8862b"/>' +
        '<path d="M62 50l10 10-10 10-10-10z" fill="#b8862b"/>' +
        '<circle cx="134" cy="7" r="3.5" fill="#b8862b"/><circle cx="7" cy="134" r="3.5" fill="#b8862b"/>' +
        '<path d="M148 7H230M7 148V230" stroke="#b8862b" stroke-width="1.5"/>';
      var mid = function (y, flip) {
        return '<g transform="translate(' + W / 2 + ' ' + y + ')' + (flip ? ' scale(1 -1)' : '') + '">' +
          '<path d="M-70 0Q-35 -14 0 0Q35 -14 70 0" fill="none" stroke="#b8862b" stroke-width="2"/>' +
          '<path d="M0 -12l10 10-10 10-10-10z" fill="' + gold + '" stroke="#8a6114" stroke-width="1"/></g>';
      };
      return '<defs><linearGradient id="cg' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d98b"/><stop offset=".5" stop-color="#c79a3a"/><stop offset="1" stop-color="#8a6114"/></linearGradient>' +
        '<radialGradient id="cp' + u + '" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#f4e6c8"/></radialGradient></defs>' +
        '<rect width="' + W + '" height="' + H + '" fill="url(#cp' + u + ')"/>' +
        rosette(W / 2, H / 2 + 30, 330, 24, '#b8862b', 0.05) + rosette(W / 2, H / 2 + 30, 200, 16, '#b8862b', 0.05, 11) +
        '<path d="' + band(14, 27) + '" fill="' + gold + '" fill-rule="evenodd"/>' +
        rect(34, '#b8862b', 2) + rect(40, '#b8862b', 0.8) +
        corners(corner, 34) + mid(34, false) + mid(H - 34, true);
    },

    royal: function (u) {
      var corner = '<rect x="-10" y="-10" width="46" height="46" fill="#13294b" stroke="#c9a646" stroke-width="2"/>' +
        '<path d="M13 -3l16 16-16 16-16-16z" fill="#c9a646"/><circle cx="13" cy="13" r="4" fill="#13294b"/>';
      var guil = '<g fill="none" stroke="#13294b" stroke-width="1.2" opacity=".06">';
      for (var i = 0; i < 18; i++) guil += '<ellipse cx="' + W / 2 + '" cy="' + (H / 2 + 30) + '" rx="270" ry="92" transform="rotate(' + i * 10 + ' ' + W / 2 + ' ' + (H / 2 + 30) + ')"/>';
      guil += '</g>';
      return '<defs><pattern id="rw' + u + '" width="20" height="26" patternUnits="userSpaceOnUse">' +
        '<path d="M0 8Q5 2 10 8T20 8M0 18Q5 12 10 18T20 18" fill="none" stroke="#c9a646" stroke-width="1.1" opacity=".6"/></pattern>' +
        '<linearGradient id="rp' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef3fb"/></linearGradient></defs>' +
        '<rect width="' + W + '" height="' + H + '" fill="#13294b"/>' +
        '<path d="' + band(0, 26) + '" fill="url(#rw' + u + ')" fill-rule="evenodd"/>' +
        '<rect x="26" y="26" width="' + (W - 52) + '" height="' + (H - 52) + '" fill="url(#rp' + u + ')"/>' +
        guil + rect(6, '#c9a646', 1.5) + rect(36, '#c9a646', 3) + rect(44, '#13294b', 1) +
        corners(corner, 36);
    },

    tiranga: function (u) {
      var sw = function (c1) {
        return '<path d="M0 0H270C186 18 94 56 0 140Z" fill="' + c1 + '"/>' +
          '<path d="M0 140C94 56 186 18 270 0H316C214 26 108 76 0 166Z" fill="' + c1 + '" opacity=".35"/>' +
          '<path d="M0 166C108 76 214 26 316 0H332C226 30 114 82 0 176Z" fill="#000080" opacity=".7"/>';
      };
      return '<rect width="' + W + '" height="' + H + '" fill="#fffefa"/>' +
        rosette(W / 2, H / 2 + 30, 300, 24, '#000080', 0.04) +
        sw('#FF9933') + rot180(sw('#138808')) +
        rect(24, '#000080', 2) + rect(31, '#000080', 0.8) +
        '<g fill="#000080" opacity=".55"><circle cx="' + (W - 60) + '" cy="60" r="4"/><circle cx="' + (W - 80) + '" cy="60" r="3"/><circle cx="' + (W - 60) + '" cy="80" r="3"/>' +
        '<circle cx="60" cy="' + (H - 60) + '" r="4"/><circle cx="80" cy="' + (H - 60) + '" r="3"/><circle cx="60" cy="' + (H - 80) + '" r="3"/></g>';
    },

    rangoli: function (u) {
      var corner = rosette(0, 0, 66, 12, '#e8a317', 1) + rosette(0, 0, 42, 12, '#7a1f2b', 1, 15) +
        '<circle r="11" fill="#fff8ec"/><circle r="5" fill="#e8a317"/>';
      return '<defs><pattern id="rg' + u + '" x="26" y="26" width="24" height="24" patternUnits="userSpaceOnUse">' +
        '<rect width="24" height="24" fill="#7a1f2b"/><path d="M12 3L21 12 12 21 3 12Z" fill="#e8a317"/><circle cx="12" cy="12" r="3" fill="#fff8ec"/></pattern></defs>' +
        '<rect width="' + W + '" height="' + H + '" fill="#fff8ec"/>' +
        rosette(W / 2, H / 2 + 30, 330, 16, '#e8a317', 0.08) + rosette(W / 2, H / 2 + 30, 200, 16, '#7a1f2b', 0.04, 11) +
        rect(16, '#7a1f2b', 8) +
        '<path d="' + band(26, 50) + '" fill="url(#rg' + u + ')" fill-rule="evenodd"/>' +
        rect(56, '#e8a317', 2) + rect(61, '#7a1f2b', 0.8) +
        corners(corner, 38);
    },

    modern: function (u) {
      var tri = '<path d="M0 0H250L0 190Z" fill="#0f766e"/><path d="M0 0H150L0 300Z" fill="#14b8a6" opacity=".55"/><path d="M0 0H96L0 96Z" fill="#84cc16"/>';
      return '<defs><pattern id="md' + u + '" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.7" fill="#0f766e" opacity=".4"/></pattern></defs>' +
        '<rect width="' + W + '" height="' + H + '" fill="#ffffff"/>' +
        tri + rot180(tri) +
        rect(22, '#0f766e', 1.5) +
        '<rect x="' + (W - 154) + '" y="38" width="112" height="56" fill="url(#md' + u + ')"/>' +
        '<rect x="42" y="' + (H - 94) + '" width="112" height="56" fill="url(#md' + u + ')"/>';
    }
  };

  /* colours for the mini preview + seal */
  var DESIGNS = [
    { id: 'classic', key: 'd_classic', accent: '#b8862b', title: '#7d5711', name: '#1f2a44', ink: '#2b2112', seal: { a: '#d9a93a', hi: '#f6dc8f', b: '#7d5711' } },
    { id: 'royal', key: 'd_royal', accent: '#c9a646', title: '#13294b', name: '#0f1f3d', ink: '#13294b', seal: { a: '#c9a646', hi: '#f1dc93', b: '#13294b' } },
    { id: 'tiranga', key: 'd_tiranga', accent: '#FF9933', title: '#000080', name: '#000080', ink: '#1d2433', seal: { a: '#FF9933', hi: '#ffd19e', b: '#000080' } },
    { id: 'rangoli', key: 'd_rangoli', accent: '#e8a317', title: '#7a1f2b', name: '#7a1f2b', ink: '#3b1219', seal: { a: '#e8a317', hi: '#ffd978', b: '#7a1f2b' } },
    { id: 'modern', key: 'd_modern', accent: '#0f766e', title: '#0f766e', name: '#111827', ink: '#1f2933', seal: { a: '#84cc16', hi: '#d9f99d', b: '#0f766e' } }
  ];
  var MEDALS = {
    1: { a: '#e2b13c', hi: '#fbe7a6', b: '#8f6300' },
    2: { a: '#c3cad2', hi: '#f1f4f7', b: '#4f5b66' },
    3: { a: '#cf8a4c', hi: '#f3c9a1', b: '#6e4119' }
  };

  function frame(d, u) {
    return '<svg class="c-frame" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">' + FRAMES[d.id](u) + '</svg>';
  }

  function thumb(d, u) {
    var g = '<g>' +
      '<rect x="' + (W / 2 - 240) + '" y="170" width="480" height="40" rx="10" fill="' + d.title + '"/>' +
      '<rect x="' + (W / 2 - 180) + '" y="285" width="360" height="46" rx="10" fill="' + d.name + '" opacity=".85"/>' +
      '<rect x="' + (W / 2 - 270) + '" y="380" width="540" height="18" rx="9" fill="#8b96a3" opacity=".55"/>' +
      '<rect x="' + (W / 2 - 220) + '" y="420" width="440" height="18" rx="9" fill="#8b96a3" opacity=".55"/>' +
      '<rect x="' + (W / 2 - 400) + '" y="' + (H - 150) + '" width="230" height="8" fill="' + d.ink + '"/>' +
      '<rect x="' + (W / 2 + 170) + '" y="' + (H - 150) + '" width="230" height="8" fill="' + d.ink + '"/>' +
      '<circle cx="' + W / 2 + '" cy="' + (H - 160) + '" r="58" fill="' + d.seal.b + '" stroke="' + d.seal.a + '" stroke-width="14"/></g>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false">' + FRAMES[d.id](u) + g + '</svg>';
  }

  /* round seal with a starburst edge and ribbons; shows 1/2/3 for winners, else a star */
  function seal(c, u, numeral) {
    var pts = [], cx = 70, cy = 68, i, a, rr;
    for (i = 0; i < 64; i++) { a = i / 64 * Math.PI * 2 - Math.PI / 2; rr = i % 2 ? 55 : 62; pts.push(n(cx + rr * Math.cos(a)) + ',' + n(cy + rr * Math.sin(a))); }
    var star = [];
    for (i = 0; i < 10; i++) { a = i / 10 * Math.PI * 2 - Math.PI / 2; rr = i % 2 ? 11 : 27; star.push(n(cx + rr * Math.cos(a)) + ',' + n(cy + rr * Math.sin(a))); }
    var center = numeral
      ? '<text x="70" y="87" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-size="52" font-weight="700" fill="' + c.hi + '">' + numeral + '</text>'
      : '<polygon points="' + star.join(' ') + '" fill="' + c.hi + '"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 160" width="124" height="142" aria-hidden="true">' +
      '<defs><radialGradient id="sg' + u + '" cx=".38" cy=".32" r=".85"><stop offset="0" stop-color="' + c.hi + '"/><stop offset="1" stop-color="' + c.a + '"/></radialGradient></defs>' +
      '<polygon points="50,98 34,156 50,146 60,158 74,106" fill="' + c.b + '"/>' +
      '<polygon points="90,98 106,156 90,146 80,158 66,106" fill="' + c.b + '"/>' +
      '<polygon points="' + pts.join(' ') + '" fill="url(#sg' + u + ')" stroke="' + c.b + '" stroke-width="1"/>' +
      '<circle cx="70" cy="68" r="46" fill="' + c.b + '"/>' +
      '<circle cx="70" cy="68" r="40" fill="none" stroke="' + c.hi + '" stroke-width="1.6" stroke-dasharray="3 3"/>' +
      center + '</svg>';
  }

  function flourish(color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 24" width="420" height="22" aria-hidden="true">' +
      '<path d="M8 12Q110 -1 198 12M432 12Q330 -1 242 12" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M40 15Q122 25 200 14M400 15Q318 25 240 14" fill="none" stroke="' + color + '" stroke-width="1" opacity=".6"/>' +
      '<path d="M220 3l9 9-9 9-9-9z" fill="' + color + '"/><circle cx="203" cy="12" r="2.6" fill="' + color + '"/><circle cx="237" cy="12" r="2.6" fill="' + color + '"/></svg>';
  }

  var CSS = [
    '.cert{--k-serif:Georgia,Cambria,"Times New Roman",var(--font-script,"Nirmala UI"),"Nirmala UI","Noto Sans",serif;',
    '--k-serif2:"Palatino Linotype","Book Antiqua",Palatino,Georgia,var(--font-script,"Nirmala UI"),"Nirmala UI","Noto Sans",serif;',
    '--k-sans:"Segoe UI","Helvetica Neue",Arial,var(--font-script,"Nirmala UI"),"Nirmala UI","Noto Sans",sans-serif;',
    '--k-title:var(--k-serif2);--k-body:var(--k-serif);--k-namef:var(--k-serif2);',
    'position:relative;width:1122px;height:793px;overflow:hidden;background:#fff;color:var(--k-ink);font-family:var(--k-body);',
    'font-size:20px;line-height:1.35;text-align:center;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    '.cert *{box-sizing:border-box}',
    '.cert .c-frame{position:absolute;top:0;inset-inline-start:0;width:1122px;height:793px;max-width:none;display:block}',
    '.cert .c-body{position:absolute;top:60px;bottom:50px;inset-inline:104px;display:flex;flex-direction:column;align-items:center}',
    '.cert .c-head{display:flex;align-items:center;justify-content:center;gap:16px;align-self:stretch;min-height:56px;flex:none}',
    '.cert .c-logo{max-height:80px;max-width:150px;object-fit:contain;flex:none;display:block}',
    '.cert .c-school{font-family:var(--k-title);font-weight:700;font-size:26px;color:var(--k-title-c);white-space:nowrap;overflow:hidden;min-width:0;line-height:1.4}',
    '.cert .c-mid{display:flex;flex-direction:column;align-items:center;align-self:stretch;margin-block:auto;padding-block:10px;min-height:0;flex:0 1 auto}',
    '.cert .c-title{font-family:var(--k-title);font-weight:700;font-size:56px;color:var(--k-title-c);white-space:nowrap;overflow:hidden;align-self:stretch;line-height:1.3;flex:none}',
    '.cert .c-pres{font-size:22px;color:var(--k-muted);margin-top:14px;flex:none}',
    '.cert .c-name{font-family:var(--k-namef);font-size:66px;font-weight:700;color:var(--k-name);white-space:nowrap;overflow:hidden;align-self:stretch;margin-top:4px;line-height:1.3;padding-inline:10px;flex:none}',
    '.cert .c-flourish{flex:none;height:22px;margin-top:-2px}',
    '.cert .c-flourish svg{display:block;width:420px;height:22px;max-width:none}',
    '.cert .c-pos{flex:none;margin-top:12px;font-weight:700;font-size:22px;line-height:1.45;color:#fff;background:var(--k-ribbon);padding:4px 36px;',
    'clip-path:polygon(0 0,100% 0,calc(100% - 14px) 50%,100% 100%,0 100%,14px 50%);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}',
    '.cert .c-msg{margin-top:16px;font-size:23px;line-height:1.5;max-width:840px;max-height:108px;overflow:hidden;min-height:0;flex:0 1 auto;color:var(--k-ink);overflow-wrap:break-word}',
    '.cert .c-date{margin-top:10px;font-size:18px;color:var(--k-muted);flex:none}',
    '.cert .c-foot{margin-top:0;align-self:stretch;padding-inline:22px;display:grid;grid-template-columns:minmax(0,1fr) 132px minmax(0,1fr);align-items:end;gap:20px;flex:none}',
    '.cert .c-sig{min-width:0;padding-inline:16px}',
    '.cert .c-sig-line{border-top:1.5px solid var(--k-ink);margin-top:40px;opacity:.8}',
    '.cert .c-sig-name{font-weight:700;font-size:18px;margin-top:6px;white-space:nowrap;overflow:hidden}',
    '.cert .c-sig-role{font-size:16px;color:var(--k-muted);white-space:nowrap;overflow:hidden}',
    '.cert .c-sig.empty{visibility:hidden}',
    /* a very long school name or signature goes on 2 lines (see fitCerts in app.js) instead of becoming tiny */
    '.cert .c-wrap{white-space:normal;text-wrap:balance;overflow-wrap:break-word}',
    '.cert .c-school.c-wrap{line-height:1.3}',
    '.cert .c-seal{margin-bottom:-8px}',
    '.cert .c-seal svg{display:block;width:124px;height:142px;margin:0 auto;max-width:none}',
    '.cert .c-seal.off{visibility:hidden}',
    '.cert:lang(en) .c-title{text-transform:uppercase;letter-spacing:.06em}',
    '.cert:lang(en) .c-school{text-transform:uppercase;letter-spacing:.05em}',
    '.cert:lang(en) .c-name,.cert:lang(en) .c-pres{font-style:italic}',
    '.cert:lang(en) .c-pos{letter-spacing:.04em}',
    '.cert[lang="ur"]{line-height:1.75}',
    '.cert[lang="ur"] .c-school{font-size:23px;line-height:1.8}',
    '.cert[lang="ur"] .c-title{font-size:46px;line-height:1.75}',
    '.cert[lang="ur"] .c-pres{font-size:19px;line-height:1.7}',
    '.cert[lang="ur"] .c-name{font-size:52px;line-height:1.75}',
    '.cert[lang="ur"] .c-pos{font-size:19px;line-height:1.8;padding-block:0}',
    '.cert[lang="ur"] .c-msg{font-size:21px;line-height:1.85;max-height:118px}',
    '.cert[lang="ur"] .c-date{font-size:16px;line-height:1.7}',
    '.cert[lang="ur"] .c-sig-name,.cert[lang="ur"] .c-sig-role{line-height:1.8}',
    '.cert[lang="ur"] .c-school.c-wrap{line-height:1.65}',
    '.cert.d-classic{--k-ink:#2b2112;--k-title-c:#7d5711;--k-name:#1f2a44;--k-muted:#6b5a3a;--k-ribbon:#8a6114}',
    '.cert.d-royal{--k-ink:#13294b;--k-title-c:#13294b;--k-name:#0f1f3d;--k-muted:#4a5878;--k-ribbon:#13294b}',
    '.cert.d-royal .c-title{color:#13294b;text-shadow:0 1px 0 #c9a646}',
    '.cert.d-tiranga{--k-ink:#1d2433;--k-title-c:#000080;--k-name:#000080;--k-muted:#4b5563;--k-ribbon:#138808}',
    '.cert.d-rangoli{--k-ink:#3b1219;--k-title-c:#7a1f2b;--k-name:#7a1f2b;--k-muted:#6b3a1f;--k-ribbon:#7a1f2b}',
    '.cert.d-modern{--k-ink:#1f2933;--k-title-c:#0f766e;--k-name:#111827;--k-muted:#52606d;--k-ribbon:#0f766e;--k-title:var(--k-sans);--k-body:var(--k-sans);--k-namef:var(--k-sans)}',
    /* keep the logo, school name and signatures clear of the corner art of each design */
    '.cert.d-classic .c-head{padding-inline:30px}',
    '.cert.d-rangoli .c-head{margin-top:6px}',
    '.cert.d-rangoli .c-logo{max-height:72px}',
    '.cert.d-rangoli .c-sig{padding-bottom:16px}',
    '.cert.d-tiranga .c-head,.cert.d-modern .c-head{padding-inline:90px}',
    '.cert.d-tiranga .c-foot,.cert.d-modern .c-foot{padding-inline:72px}',
    '.cert.d-modern:lang(en) .c-title{letter-spacing:.14em;font-weight:800}',
    '.cert.d-modern:lang(en) .c-name{font-style:normal}'
  ].join('\n');

  window.CERT_KIT = { W: W, H: H, DESIGNS: DESIGNS, MEDALS: MEDALS, frame: frame, thumb: thumb, seal: seal, flourish: flourish, CSS: CSS };
})();
