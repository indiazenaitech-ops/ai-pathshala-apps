/* Invitation Card Maker: designs, colour sets, sizes, fonts and sacred symbols.
 * No translatable text here (occasion wording lives in content.js, UI strings in strings.js).
 * Invocation lines are Sanskrit / Arabic / Gurmukhi and are the same whatever the card language. */
window.ICM_DATA = (function () {
  'use strict';

  /* colour sets: bg = top→bottom gradient, ink = body text, head = heading / names, gold = frame + ornaments,
     soft = translucent panel behind the details, deco = motif colours, dark = light text on a dark card */
  var PAL = {
    maroon:   { bg: ['#4a0b1e', '#7d1a38'], ink: '#fbe9d2', head: '#f6d58a', gold: '#e2b35a', soft: 'rgba(0,0,0,.22)', deco: ['#f2b544', '#ff8c42', '#e85d75', '#2ec4b6', '#fff3e0'], dark: true },
    ivory:    { bg: ['#fffaf1', '#f7e8cf'], ink: '#4b2e1a', head: '#8e1c2e', gold: '#b98a3a', soft: 'rgba(255,255,255,.55)', deco: ['#c2410c', '#e9a23b', '#8e1c2e', '#2a9d8f', '#f4a261'], dark: false },
    royal:    { bg: ['#0a1b4a', '#1f3f8f'], ink: '#eef2ff', head: '#f3cd6e', gold: '#e8bd5c', soft: 'rgba(0,0,0,.24)', deco: ['#f3cd6e', '#ff7b72', '#4cc9f0', '#b8f2e6', '#ffffff'], dark: true },
    emerald:  { bg: ['#0a3a2c', '#176a4e'], ink: '#eefbf3', head: '#f0d27a', gold: '#dcb964', soft: 'rgba(0,0,0,.22)', deco: ['#f0d27a', '#ffffff', '#ff9eb5', '#8ee4af', '#ffd6a5'], dark: true },
    blush:    { bg: ['#fff4f5', '#ffd9df'], ink: '#5b2434', head: '#a62a4c', gold: '#c48c55', soft: 'rgba(255,255,255,.55)', deco: ['#e8738f', '#f4a7b9', '#9ac17a', '#f6c453', '#ffffff'], dark: false },
    lavender: { bg: ['#f6f2fc', '#dfd2f3'], ink: '#38285a', head: '#5d3f9e', gold: '#9a7fd0', soft: 'rgba(255,255,255,.55)', deco: ['#8e6ad1', '#c9b6f2', '#f4a7b9', '#ffd166', '#ffffff'], dark: false },
    sunshine: { bg: ['#fff8dc', '#ffe28a'], ink: '#4a3005', head: '#d9480f', gold: '#e8890c', soft: 'rgba(255,255,255,.5)', deco: ['#ff6b6b', '#4dabf7', '#51cf66', '#ffa94d', '#cc5de8'], dark: false },
    sage:     { bg: ['#f3f7ef', '#d3e3c6'], ink: '#2e4a2a', head: '#3e6b3a', gold: '#9a8a4d', soft: 'rgba(255,255,255,.55)', deco: ['#6a994e', '#a7c957', '#f2cc8f', '#e07a5f', '#ffffff'], dark: false },
    midnight: { bg: ['#121033', '#2d2466'], ink: '#f0ecff', head: '#ffd166', gold: '#f2c56b', soft: 'rgba(255,255,255,.09)', deco: ['#ffd166', '#ff5d8f', '#4cc9f0', '#80ffdb', '#ffffff'], dark: true },
    teal:     { bg: ['#e8f6f5', '#bfe3df'], ink: '#15403c', head: '#0b5f58', gold: '#c99a3b', soft: 'rgba(255,255,255,.55)', deco: ['#0b7285', '#f08c00', '#e64980', '#fab005', '#ffffff'], dark: false },
    saffron:  { bg: ['#ffb15c', '#e2650f'], ink: '#fff8ee', head: '#ffffff', gold: '#ffe6a3', soft: 'rgba(90,30,0,.22)', deco: ['#ffe066', '#ffffff', '#b5121b', '#2b9348', '#6a040f'], dark: true },
    charcoal: { bg: ['#f8f7f3', '#e9e6dd'], ink: '#2b2a27', head: '#1e1d1a', gold: '#9c8457', soft: 'rgba(255,255,255,.6)', deco: ['#9c8457', '#c9b07a', '#2b2a27', '#b0a890', '#ffffff'], dark: false },
    wine:     { bg: ['#2f0a1e', '#5a1538'], ink: '#fbe6ee', head: '#f9c8d8', gold: '#dba57a', soft: 'rgba(0,0,0,.22)', deco: ['#f78fb3', '#dba57a', '#c1e1c1', '#ffd6a5', '#ffffff'], dark: true },
    peacock:  { bg: ['#06343f', '#0b5f6a'], ink: '#e9fbff', head: '#ffd166', gold: '#e3b55a', soft: 'rgba(0,0,0,.22)', deco: ['#1fa8b8', '#4361ee', '#ffd166', '#2dc653', '#f72585'], dark: true }
  };

  /* designs: frame = border style, corner = corner ornament, top / bottom = motif bands, bgp = background pattern.
     pals = colour sets offered for this design (first = default). icon = emoji for the picker. */
  var DESIGNS = [
    { id: 'royal',    icon: '👑', frame: 'double',  corner: 'paisley', top: 'none',     bottom: 'paisleyrow', bgp: 'damask', pals: ['maroon', 'royal', 'ivory', 'wine'] },
    { id: 'toran',    icon: '🌼', frame: 'thin',    corner: 'none',    top: 'toran',    bottom: 'marigold',   bgp: 'plain',  pals: ['ivory', 'sage', 'maroon', 'saffron'] },
    { id: 'kalash',   icon: '🪔', frame: 'double',  corner: 'leaf',    top: 'kalash',   bottom: 'diyas',      bgp: 'rays',   pals: ['ivory', 'maroon', 'saffron', 'emerald'] },
    { id: 'lotus',    icon: '🪷', frame: 'thin',    corner: 'none',    top: 'none',     bottom: 'lotus',      bgp: 'plain',  pals: ['blush', 'teal', 'lavender', 'wine'] },
    { id: 'peacock',  icon: '🦚', frame: 'double',  corner: 'feather', top: 'none',     bottom: 'none',       bgp: 'plain',  pals: ['peacock', 'royal', 'emerald', 'ivory'] },
    { id: 'diya',     icon: '✨', frame: 'double',  corner: 'none',    top: 'lights',   bottom: 'diyas',      bgp: 'dots',   pals: ['midnight', 'maroon', 'royal', 'ivory'] },
    { id: 'jaali',    icon: '🕌', frame: 'arch',    corner: 'none',    top: 'none',     bottom: 'none',       bgp: 'jaali',  pals: ['emerald', 'royal', 'ivory', 'midnight'] },
    { id: 'floral',   icon: '🌸', frame: 'thin',    corner: 'rose',    top: 'none',     bottom: 'none',       bgp: 'plain',  pals: ['blush', 'sage', 'ivory', 'lavender'] },
    { id: 'mandala',  icon: '🔆', frame: 'thin',    corner: 'none',    top: 'mandala',  bottom: 'mandala',    bgp: 'plain',  pals: ['ivory', 'maroon', 'teal', 'midnight'] },
    { id: 'balloons', icon: '🎈', frame: 'none',    corner: 'none',    top: 'balloons', bottom: 'confetti',   bgp: 'plain',  pals: ['sunshine', 'blush', 'teal', 'lavender'] },
    { id: 'banana',   icon: '🍃', frame: 'thin',    corner: 'none',    top: 'banana',   bottom: 'kolam',      bgp: 'plain',  pals: ['sage', 'ivory', 'emerald', 'sunshine'] },
    { id: 'minimal',  icon: '◻️', frame: 'thin',    corner: 'none',    top: 'monogram', bottom: 'none',       bgp: 'plain',  pals: ['charcoal', 'ivory', 'blush', 'midnight'] },
    { id: 'ribbon',   icon: '🎀', frame: 'geo',     corner: 'none',    top: 'ribbon',   bottom: 'stars',      bgp: 'rays',   pals: ['royal', 'saffron', 'teal', 'sunshine'] },
    { id: 'hearts',   icon: '💞', frame: 'thin',    corner: 'none',    top: 'rings',    bottom: 'hearts',     bgp: 'dots',   pals: ['wine', 'blush', 'ivory', 'midnight'] }
  ];

  /* which design each occasion opens with (users can change it) */
  var OCC_DESIGN = {
    wedding: 'royal', engagement: 'hearts', reception: 'peacock', birthday: 'balloons', anniversary: 'floral',
    housewarming: 'kalash', naming: 'banana', pooja: 'diya', mundan: 'toran', retirement: 'minimal', annualday: 'ribbon', opening: 'ribbon'
  };
  var OCC_ICON = {
    wedding: '💍', engagement: '💞', reception: '🥂', birthday: '🎂', anniversary: '💐', housewarming: '🏠',
    naming: '👶', pooja: '🪔', mundan: '✂️', retirement: '🎖️', annualday: '🎭', opening: '🎀'
  };
  var OCCASIONS = Object.keys(OCC_DESIGN);

  /* output sizes. print = @page size when printing one card per sheet */
  var SIZES = [
    { id: 'wa',    w: 1080, h: 1350, print: 'A5' },
    { id: 'story', w: 1080, h: 1920, print: 'A5' },
    { id: 'square', w: 1080, h: 1080, print: 'A5' },
    { id: 'a5',    w: 1748, h: 2480, print: 'A5' }
  ];

  /* sacred symbols: glyph drawn in a medallion (font = script family for the glyph) and an optional invocation line.
     lineKey = the Sanskrit line comes from content.js labels in the card's own script (a Tamil card prints ஸ்ரீ கணேசாய நம:);
     line = fixed text in its own script whatever the card language (Gurmukhi, Arabic). */
  var SYMBOLS = [
    { id: 'none' },
    { id: 'ganesh', draw: 'ganesh', lineKey: 'sym_ganesh' },
    { id: 'om', glyph: 'ॐ', glyphScript: 'deva', lineKey: 'sym_om' },
    { id: 'ikonkar', glyph: 'ੴ', glyphScript: 'guru', line: 'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ', lineScript: 'guru' },
    { id: 'bismillah', draw: 'star8', line: 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ', lineScript: 'arab' },
    { id: 'cross', draw: 'cross' },
    { id: 'buddha', draw: 'wheel', lineKey: 'sym_buddha' }
  ];

  /* fonts per script: Google Fonts when online (one <link> per family, so one missing family never blocks the rest),
     system fonts otherwise. gf = family=... part of the css2 URL; w = weights the family really has. */
  var SCRIPT_OF = { en: 'latn', hi: 'deva', mr: 'deva', bn: 'beng', pa: 'guru', gu: 'gujr', or: 'orya', ta: 'taml', te: 'telu', kn: 'knda', ml: 'mlym', ur: 'arab' };
  var SYS = {
    latn: '"Noto Sans", "Segoe UI", Roboto, "Helvetica Neue", Arial',
    deva: '"Noto Sans Devanagari", "Nirmala UI", "Kohinoor Devanagari", "Devanagari Sangam MN", Mangal',
    beng: '"Noto Sans Bengali", "Nirmala UI", "Kohinoor Bangla", "Bangla Sangam MN", Vrinda',
    guru: '"Noto Sans Gurmukhi", "Nirmala UI", "Gurmukhi Sangam MN", "Mukta Mahee", Raavi',
    gujr: '"Noto Sans Gujarati", "Nirmala UI", "Kohinoor Gujarati", "Gujarati Sangam MN", Shruti',
    orya: '"Noto Sans Oriya", "Nirmala UI", "Oriya Sangam MN", Kalinga',
    taml: '"Noto Sans Tamil", "Nirmala UI", "Tamil Sangam MN", Latha',
    telu: '"Noto Sans Telugu", "Nirmala UI", "Kohinoor Telugu", "Telugu Sangam MN", Gautami',
    knda: '"Noto Sans Kannada", "Nirmala UI", "Kannada Sangam MN", Tunga',
    mlym: '"Noto Sans Malayalam", "Nirmala UI", "Malayalam Sangam MN", Kartika',
    arab: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", "Noto Naskh Arabic", "Segoe UI", Tahoma'
  };
  /* display = headings and names, body = everything else. A language may override its script (Marathi serif). */
  var FONTS = {
    elegant: {
      latn: { display: { f: 'Great Vibes', gf: 'Great+Vibes' }, names: { f: 'Playfair Display', gf: 'Playfair+Display:ital,wght@0,400;0,700;1,400' }, body: { f: 'Playfair Display' } },
      deva: { display: { f: 'Rozha One', gf: 'Rozha+One' }, body: { f: 'Tiro Devanagari Hindi', gf: 'Tiro+Devanagari+Hindi' } },
      deva_mr: { display: { f: 'Rozha One', gf: 'Rozha+One' }, body: { f: 'Tiro Devanagari Marathi', gf: 'Tiro+Devanagari+Marathi' } },
      beng: { display: { f: 'Noto Serif Bengali', gf: 'Noto+Serif+Bengali:wght@400;700' }, body: { f: 'Tiro Bangla', gf: 'Tiro+Bangla' } },
      gujr: { display: { f: 'Noto Serif Gujarati', gf: 'Noto+Serif+Gujarati:wght@400;700' }, body: { f: 'Rasa', gf: 'Rasa:wght@400;600' } },
      guru: { display: { f: 'Noto Serif Gurmukhi', gf: 'Noto+Serif+Gurmukhi:wght@400;700' }, body: { f: 'Tiro Gurmukhi', gf: 'Tiro+Gurmukhi' } },
      orya: { display: { f: 'Noto Serif Oriya', gf: 'Noto+Serif+Oriya:wght@400;700' }, body: { f: 'Noto Serif Oriya' } },
      taml: { display: { f: 'Noto Serif Tamil', gf: 'Noto+Serif+Tamil:wght@400;700' }, body: { f: 'Tiro Tamil', gf: 'Tiro+Tamil' } },
      telu: { display: { f: 'Noto Serif Telugu', gf: 'Noto+Serif+Telugu:wght@400;700' }, body: { f: 'Tiro Telugu', gf: 'Tiro+Telugu' } },
      knda: { display: { f: 'Noto Serif Kannada', gf: 'Noto+Serif+Kannada:wght@400;700' }, body: { f: 'Tiro Kannada', gf: 'Tiro+Kannada' } },
      mlym: { display: { f: 'Noto Serif Malayalam', gf: 'Noto+Serif+Malayalam:wght@400;700' }, body: { f: 'Noto Serif Malayalam' } },
      arab: { display: { f: 'Noto Nastaliq Urdu', gf: 'Noto+Nastaliq+Urdu:wght@400;700' }, body: { f: 'Noto Nastaliq Urdu' } }
    },
    festive: {
      latn: { display: { f: 'Baloo 2', gf: 'Baloo+2:wght@500;800' }, body: { f: 'Baloo 2' } },
      deva: { display: { f: 'Baloo 2', gf: 'Baloo+2:wght@500;800' }, body: { f: 'Baloo 2' } },
      beng: { display: { f: 'Baloo Da 2', gf: 'Baloo+Da+2:wght@500;800' }, body: { f: 'Baloo Da 2' } },
      gujr: { display: { f: 'Baloo Bhai 2', gf: 'Baloo+Bhai+2:wght@500;800' }, body: { f: 'Baloo Bhai 2' } },
      guru: { display: { f: 'Baloo Paaji 2', gf: 'Baloo+Paaji+2:wght@500;800' }, body: { f: 'Baloo Paaji 2' } },
      orya: { display: { f: 'Baloo Bhaina 2', gf: 'Baloo+Bhaina+2:wght@500;800' }, body: { f: 'Baloo Bhaina 2' } },
      taml: { display: { f: 'Baloo Thambi 2', gf: 'Baloo+Thambi+2:wght@500;800' }, body: { f: 'Baloo Thambi 2' } },
      telu: { display: { f: 'Baloo Tammudu 2', gf: 'Baloo+Tammudu+2:wght@500;800' }, body: { f: 'Baloo Tammudu 2' } },
      knda: { display: { f: 'Baloo Tamma 2', gf: 'Baloo+Tamma+2:wght@500;800' }, body: { f: 'Baloo Tamma 2' } },
      mlym: { display: { f: 'Baloo Chettan 2', gf: 'Baloo+Chettan+2:wght@500;800' }, body: { f: 'Baloo Chettan 2' } },
      arab: { display: { f: 'Gulzar', gf: 'Gulzar' }, body: { f: 'Noto Nastaliq Urdu', gf: 'Noto+Nastaliq+Urdu:wght@400;700' } }
    },
    simple: {}
  };
  /* the sacred glyphs / invocation lines are Sanskrit, Gurmukhi or Arabic whatever the card language */
  var SACRED = {
    deva: { f: 'Tiro Devanagari Sanskrit', gf: 'Tiro+Devanagari+Sanskrit' },
    guru: { f: 'Noto Serif Gurmukhi', gf: 'Noto+Serif+Gurmukhi:wght@400;700' },
    arab: { f: 'Noto Naskh Arabic', gf: 'Noto+Naskh+Arabic:wght@400;700' }
  };

  return { PAL: PAL, DESIGNS: DESIGNS, OCC_DESIGN: OCC_DESIGN, OCC_ICON: OCC_ICON, OCCASIONS: OCCASIONS, SIZES: SIZES, SYMBOLS: SYMBOLS,
    SCRIPT_OF: SCRIPT_OF, SYS: SYS, FONTS: FONTS, SACRED: SACRED };
})();
