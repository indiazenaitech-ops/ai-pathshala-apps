/* Logo Maker: the built-in icons. Drawn for this app (no outside icon set), each on a 24 x 24 grid.
   window.LOGO_ICONS[id](colour) returns SVG markup in that grid; the app scales it into place.
   Shapes with holes use fill-rule="evenodd", a few use strokes. Keep each icon simple: it must still read
   when the logo is a 40 px profile picture. */
(function () {
  'use strict';
  function r(n) { return Math.round(n * 100) / 100; }
  function poly(pts) { return 'M' + pts.map(function (p) { return r(p[0]) + ' ' + r(p[1]); }).join('L') + 'Z'; }
  function circ(cx, cy, rad) { return 'M' + r(cx - rad) + ' ' + r(cy) + 'a' + rad + ' ' + rad + ' 0 1 0 ' + r(2 * rad) + ' 0a' + rad + ' ' + rad + ' 0 1 0 ' + r(-2 * rad) + ' 0Z'; }
  function path(d, c, extra) { return '<path d="' + d + '" fill="' + c + '"' + (extra || '') + '/>'; }
  function eo(d, c) { return path(d, c, ' fill-rule="evenodd"'); }
  function line(d, c, w) { return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
  /* moon: a big circle with a smaller circle taken away, worked out from where the two circles cross */
  function crescent() {
    var ax = 11, ay = 12.5, ra = 9, bx = 15.6, by = 8.6, rb = 7.6;
    var dx = bx - ax, dy = by - ay, d = Math.sqrt(dx * dx + dy * dy), a = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(ra * ra - a * a);
    var px = ax + a * dx / d, py = ay + a * dy / d, ox = -dy * h / d, oy = dx * h / d;
    var p1 = [px + ox, py + oy], p2 = [px - ox, py - oy];
    return 'M' + r(p1[0]) + ' ' + r(p1[1]) + 'A' + ra + ' ' + ra + ' 0 1 1 ' + r(p2[0]) + ' ' + r(p2[1]) + 'A' + rb + ' ' + rb + ' 0 0 0 ' + r(p1[0]) + ' ' + r(p1[1]) + 'Z';
  }
  function star(cx, cy, ro, ri, n) {
    var pts = [];
    for (var k = 0; k < n * 2; k++) { var rad = k % 2 ? ri : ro, ang = (-90 + k * 180 / n) * Math.PI / 180; pts.push([cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)]); }
    return poly(pts);
  }
  function gear() {
    var pts = [], n = 8;
    for (var k = 0; k < n; k++) {
      var base = k * 360 / n;
      [[-24, 8.2], [-12, 10.8], [12, 10.8], [24, 8.2]].forEach(function (q) { var ang = (base + q[0] * 0.75) * Math.PI / 180; pts.push([12 + q[1] * Math.cos(ang), 12 + q[1] * Math.sin(ang)]); });
    }
    return poly(pts) + circ(12, 12, 3.4);
  }
  var I = {
    none: function () { return ''; },
    star: function (c) { return path(star(12, 12.8, 11, 4.6, 5), c, ' stroke="' + c + '" stroke-width="1" stroke-linejoin="round"'); },
    heart: function (c) { return path('M12 21.2s-7.8-4.7-9.9-9.5C.6 8.2 2.6 4.2 6.5 4.2c2.4 0 4.2 1.3 5.5 3.3 1.3-2 3.1-3.3 5.5-3.3 3.9 0 5.9 4 4.4 7.5-2.1 4.8-9.9 9.5-9.9 9.5z', c); },
    leaf: function (c) { return eo('M21 2.8C10.8 2.8 4 8.2 4 15.6c0 1.4.3 2.6.9 3.7L2.5 21.7l1.2 1.2 2.5-2.5c1.1.6 2.3.9 3.6.9 7.4 0 11.2-7.4 11.2-18.5zM7.9 18.2l9.6-10.1.7.6-9.6 10.2z', c); },
    flower: function (c) {
      var s = '';
      for (var k = 0; k < 6; k++) s += '<ellipse cx="12" cy="6.4" rx="3.1" ry="4.9" fill="' + c + '" transform="rotate(' + k * 60 + ' 12 12)"/>';
      return s + '<circle cx="12" cy="12" r="3" fill="' + c + '"/>';
    },
    sun: function (c) {
      var s = '<circle cx="12" cy="12" r="5" fill="' + c + '"/>';
      for (var k = 0; k < 8; k++) s += '<rect x="11" y="0.8" width="2" height="4.4" rx="1" fill="' + c + '" transform="rotate(' + k * 45 + ' 12 12)"/>';
      return s;
    },
    moon: function (c) { return path(crescent(), c) + path(star(18.6, 15.6, 2.6, 1.1, 4), c); },
    drop: function (c) { return eo('M12 2.2S4.6 10.3 4.6 15.3a7.4 7.4 0 0 0 14.8 0c0-5-7.4-13.1-7.4-13.1zM8.1 15.6c.2 1.9 1.6 3.4 3.4 3.7l-.2 1.3c-2.4-.4-4.3-2.4-4.6-4.9z', c); },
    diya: function (c) { return path('M12 1.6c2 2.9 3.3 4.7 3.3 6.8a3.3 3.3 0 0 1-6.6 0c0-2.1 1.3-3.9 3.3-6.8z', c) + path('M1.8 13h20.4c0 3.9-4.6 7-10.2 7S1.8 16.9 1.8 13z', c) + path('M8.6 20.6h6.8l.6 1.8H8z', c); },
    cup: function (c) { return eo('M3.6 9h14v4.8a6.3 6.3 0 0 1-6.3 6.3H9.9a6.3 6.3 0 0 1-6.3-6.3zM17.4 10.3h1.3a3.2 3.2 0 0 1 0 6.4h-2l.5-1.8h1.5a1.4 1.4 0 0 0 0-2.8h-1.3z', c) + path('M2 21.2h17.4v1.6H2z', c) + line('M8.2 6.6c-1.1-1.3 1.1-2.2 0-3.8M12.6 6.6c-1.1-1.3 1.1-2.2 0-3.8', c, 1.4); },
    book: function (c) { return path('M1.6 5.2c3.2-1.1 6.4-1 9.6 1.1v13.9c-3.2-2.1-6.4-2.2-9.6-1.1z', c) + path('M12.8 6.3c3.2-2.1 6.4-2.2 9.6-1.1v13.9c-3.2-1.1-6.4-1-9.6 1.1z', c); },
    pencil: function (c) { return eo('M16.3 2.6a1.6 1.6 0 0 1 2.2 0l2.9 2.9a1.6 1.6 0 0 1 0 2.2L9.6 19.5 2.6 21.4l1.9-7zM14.3 4.6l5.1 5.1-.9.9-5.1-5.1zM5.4 15.7l2.9 2.9-3.5 1z', c); },
    cap: function (c) { return path('M12 2.6L.8 8.3 12 14l11.2-5.7z', c) + path('M5.4 11.3v4.4c0 2 3 3.6 6.6 3.6s6.6-1.6 6.6-3.6v-4.4L12 14.7z', c) + path('M20.6 9.2h1.2v6.6h-1.2z', c) + '<circle cx="21.2" cy="16.4" r="1.3" fill="' + c + '"/>'; },
    music: function (c) { return '<circle cx="6.3" cy="18" r="3.1" fill="' + c + '"/><circle cx="17.5" cy="15.6" r="3.1" fill="' + c + '"/>' + path('M8 18V5.4L21.2 2.6v13h-1.7V7.1L9.7 9.2V18z', c); },
    camera: function (c) { return eo('M3 7.3h3.9l1.7-2.6h6.8l1.7 2.6H21a1.2 1.2 0 0 1 1.2 1.2v10.3a1.2 1.2 0 0 1-1.2 1.2H3a1.2 1.2 0 0 1-1.2-1.2V8.5A1.2 1.2 0 0 1 3 7.3z' + circ(12, 13.4, 4.6), c) + '<circle cx="12" cy="13.4" r="2.7" fill="' + c + '"/>'; },
    play: function (c) { return eo(circ(12, 12, 10.6) + 'M9.6 7.4v9.2l7.6-4.6z', c); },
    shop: function (c) { return path('M3.2 3.4h17.6l1.9 5.4a2.6 2.6 0 0 1-4.7 1.5 2.6 2.6 0 0 1-4.4 0 2.6 2.6 0 0 1-4.4 0 2.6 2.6 0 0 1-4.6-1.5z', c) + eo('M4.2 12.6h15.6v8.8H4.2zM10.1 15h3.8v6.4h-3.8z', c); },
    mountain: function (c) { return path('M1.2 20.6L8.8 7.2l4.1 6.7 2.6-3.6 7.3 10.3z', c) + '<circle cx="17.6" cy="5.4" r="2.3" fill="' + c + '"/>'; },
    tree: function (c) { return '<circle cx="12" cy="7.6" r="5.6" fill="' + c + '"/><circle cx="7.4" cy="11.6" r="4.2" fill="' + c + '"/><circle cx="16.6" cy="11.6" r="4.2" fill="' + c + '"/>' + path('M10.9 12.6h2.2v9.2h-2.2z', c) + path('M6.5 21.2h11v1.4h-11z', c); },
    bolt: function (c) { return path('M13.8 1.6L3.8 13.6h6.8L9.4 22.4 20.2 9.8h-6.9z', c); },
    gear: function (c) { return eo(gear(), c); },
    paw: function (c) { return '<ellipse cx="5.8" cy="10.2" rx="2" ry="2.6" fill="' + c + '" transform="rotate(-20 5.8 10.2)"/><ellipse cx="9.6" cy="5.6" rx="2.1" ry="2.8" fill="' + c + '"/><ellipse cx="14.4" cy="5.6" rx="2.1" ry="2.8" fill="' + c + '"/><ellipse cx="18.2" cy="10.2" rx="2" ry="2.6" fill="' + c + '" transform="rotate(20 18.2 10.2)"/>' + path('M12 11.4c-3.1 0-6.8 4.6-6.8 7.3a2.6 2.6 0 0 0 3.1 2.5c1.4-.3 2.4-.8 3.7-.8s2.3.5 3.7.8a2.6 2.6 0 0 0 3.1-2.5c0-2.7-3.7-7.3-6.8-7.3z', c); },
    ball: function (c) { return '<circle cx="12" cy="12" r="9.6" fill="none" stroke="' + c + '" stroke-width="2.4"/>' + line('M5.2 5.4c3.6 3.4 3.6 9.8 0 13.2M18.8 5.4c-3.6 3.4-3.6 9.8 0 13.2', c, 2); },
    chat: function (c) { return eo('M4 3.6h16a2.2 2.2 0 0 1 2.2 2.2v9.4a2.2 2.2 0 0 1-2.2 2.2h-8.6l-5.6 4.8v-4.8H4a2.2 2.2 0 0 1-2.2-2.2V5.8A2.2 2.2 0 0 1 4 3.6z' + circ(7.6, 10.5, 1.4) + circ(12, 10.5, 1.4) + circ(16.4, 10.5, 1.4), c); },
    scissors: function (c) { return line('M8.4 15.6L19.6 2.6M15.6 15.6L4.4 2.6', c, 2.2) + '<circle cx="6.4" cy="18.4" r="3" fill="none" stroke="' + c + '" stroke-width="2.2"/><circle cx="17.6" cy="18.4" r="3" fill="none" stroke="' + c + '" stroke-width="2.2"/>'; }
  };
  window.LOGO_ICONS = I;
  window.LOGO_ICON_IDS = ['none', 'star', 'heart', 'leaf', 'flower', 'sun', 'moon', 'drop', 'diya', 'cup', 'book', 'pencil', 'cap', 'music', 'camera', 'play', 'shop', 'mountain', 'tree', 'bolt', 'gear', 'paw', 'ball', 'chat', 'scissors'];
})();
