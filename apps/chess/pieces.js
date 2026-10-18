/* Chess pieces drawn for this app (simple shapes, 100 × 100 box; no third-party piece set).
   CHESS_PIECES.sprite() returns an <svg> with one <symbol id="p-wK"> … <symbol id="p-bP"> per piece. */
window.CHESS_PIECES = (function () {
  'use strict';
  var BASE = 'M20 91 L80 91 L80 85 Q80 79 74 79 L26 79 Q20 79 20 85 Z';
  var SHAPES = {
    P: {
      body: [BASE,
        'M41 50 Q41 65 29 79 L71 79 Q59 65 59 50 Z',
        'M36 46 Q36 40 42 40 L58 40 Q64 40 64 46 Q64 51 58 51 L42 51 Q36 51 36 46 Z',
        'M50 15 A12.5 12.5 0 1 1 49.9 15 Z']
    },
    R: {
      body: [BASE,
        'M27 71 L73 71 L76 79 L24 79 Z',
        'M35 40 L65 40 L68 71 L32 71 Z',
        'M30 34 L70 34 L66 41 L34 41 Z',
        'M27 12 L38 12 L38 21 L45 21 L45 12 L55 12 L55 21 L62 21 L62 12 L73 12 L73 34 L27 34 Z'],
      detail: ['M36 56 L64 56']
    },
    N: {
      body: [BASE,
        'M28 79 C30 67 36 61 43 55 C38 56 34 58 28 58 C21 58 16 53 17 47 C18 40 26 32 34 25 C39 20 44 17 49 15 L53 6 L60 15 C72 20 79 34 78 50 C77 64 72 72 72 79 Z'],
      detail: ['M59 19 C68 29 71 46 66 66'],
      dots: [[44, 30, 3.6], [24, 48, 2.2]]
    },
    B: {
      body: [BASE,
        'M40 60 Q42 71 29 79 L71 79 Q58 71 60 60 Z',
        'M35 54 Q35 51 38 51 L62 51 Q65 51 65 54 L65 57 Q65 60 62 60 L38 60 Q35 60 35 57 Z',
        'M50 19 C36 29 32 42 38 51 L62 51 C68 42 64 29 50 19 Z',
        'M50 6 A6.5 6.5 0 1 1 49.9 6 Z'],
      detail: ['M56 29 L46 42']
    },
    Q: {
      body: [BASE,
        'M28 69 L72 69 L75 79 L25 79 Z',
        'M30 62 L70 62 L72 69 L28 69 Z',
        'M30 62 L18 29 L36 47 L34 19 L46 43 L50 14 L54 43 L66 19 L64 47 L82 29 L70 62 Z',
        'M18 22.5 A5.5 5.5 0 1 1 17.9 22.5 Z', 'M34 12.5 A5.5 5.5 0 1 1 33.9 12.5 Z', 'M50 7.5 A5.5 5.5 0 1 1 49.9 7.5 Z',
        'M66 12.5 A5.5 5.5 0 1 1 65.9 12.5 Z', 'M82 22.5 A5.5 5.5 0 1 1 81.9 22.5 Z']
    },
    K: {
      body: [BASE,
        'M28 70 L72 70 L75 79 L25 79 Z',
        'M30 70 C22 61 17 51 21 44 C26 35 39 36 46 46 L50 52 L54 46 C61 36 74 35 79 44 C83 51 78 61 70 70 Z',
        'M50 52 C44 44 42 37 50 28 C58 37 56 44 50 52 Z',
        'M46.5 5 L53.5 5 L53.5 11 L59 11 L59 17.5 L53.5 17.5 L53.5 28 L46.5 28 L46.5 17.5 L41 17.5 L41 11 L46.5 11 Z'],
      detail: ['M31 63 L69 63']
    }
  };
  var COLORS = {
    w: { fill: '#fbfaf7', line: '#1d1f22', detail: '#1d1f22' },
    b: { fill: '#2f3236', line: '#0e0f11', detail: '#eceae4' }
  };
  function symbol(c, type) {
    var s = SHAPES[type], col = COLORS[c], out = '<symbol id="p-' + c + type + '" viewBox="0 0 100 100">';
    s.body.forEach(function (d) {
      out += '<path d="' + d + '" fill="' + col.fill + '" stroke="' + col.line + '" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>';
    });
    (s.detail || []).forEach(function (d) {
      out += '<path d="' + d + '" fill="none" stroke="' + col.detail + '" stroke-width="3.2" stroke-linecap="round"/>';
    });
    (s.dots || []).forEach(function (p) {
      out += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="' + col.detail + '"/>';
    });
    return out + '</symbol>';
  }
  function sprite() {
    var out = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>';
    ['w', 'b'].forEach(function (c) { 'KQRBNP'.split('').forEach(function (t) { out += symbol(c, t); }); });
    return out + '</defs></svg>';
  }
  return { sprite: sprite, symbol: symbol };
})();
