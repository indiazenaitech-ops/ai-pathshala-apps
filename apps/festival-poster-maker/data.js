/* Festival Poster Maker: templates, colour sets, sizes and festival dates.
 * No text here (names and greetings are in content.js, in all 12 languages).
 *
 * DATES: many Indian festivals follow the moon, so their dates change every year.
 *   fixed: 'MM-DD'           same date every year (Christmas, New Year, Republic Day, Independence Day)
 *   dates: ['YYYY-MM-DD',..] one date per year. Add next year's date to the end of the list each year.
 *   span: N                  the festival stays "on now" (top of the list) for N more days, e.g. Navratri's 9 nights,
 *                            or New Year wishes in the first week of January (so the poster still says the new year).
 * Sources checked in Oct 2026: Drik Panchang (2026, 2027) and the Government of India holiday list.
 * Eid dates depend on the moon sighting and can move by a day. Users can also fix any date in the app.
 */
window.FPM_DATA = (function () {
  'use strict';

  /* colour sets: bg = top→bottom gradient, head = greeting gradient, gold = frame/ornaments,
     offer = badge gradient, panel = contact box, deco = ornament colours, dark = light text on dark bg */
  var PAL = {
    maroon: { bg: ['#3a0617', '#7a1430'], glow: '#ffb74d', head: ['#fff4c2', '#f7c948', '#e09a2b'], text: '#fde8cc', gold: '#f2c14e', offer: ['#f7c948', '#e0962a'], offerText: '#3a0712', panel: 'rgba(0,0,0,.28)', deco: ['#ff9f1c', '#ffd166', '#ef476f', '#2ec4b6', '#f8f9fa'], dark: true },
    navy: { bg: ['#061235', '#173a7a'], glow: '#ffd166', head: ['#fff6cf', '#ffd166', '#f4a72c'], text: '#e8eeff', gold: '#ffd166', offer: ['#ffd166', '#f4a72c'], offerText: '#0b1a3f', panel: 'rgba(0,0,0,.28)', deco: ['#ffd166', '#ff7b54', '#4cc9f0', '#f72585', '#ffffff'], dark: true },
    midnight: { bg: ['#07061a', '#2a1258'], glow: '#a078ff', head: ['#ffffff', '#ffe08a', '#ffc94a'], text: '#ece6ff', gold: '#ffd166', offer: ['#ff5d8f', '#c9184a'], offerText: '#ffffff', panel: 'rgba(255,255,255,.09)', deco: ['#ffd166', '#ff5d8f', '#4cc9f0', '#80ffdb', '#ffffff'], dark: true },
    cream: { bg: ['#fff8ea', '#ffe1b3'], glow: '#ffaa3c', head: ['#a3161a', '#c2410c', '#9a3412'], text: '#4a1d0f', gold: '#c48a1c', offer: ['#b91c1c', '#8f1414'], offerText: '#ffffff', panel: 'rgba(255,255,255,.62)', deco: ['#e85d04', '#ffba08', '#d00000', '#2a9d8f', '#6a040f'], dark: false },
    saffron: { bg: ['#ff9b3d', '#d94f04'], glow: '#fff3b0', head: ['#ffffff', '#fff3d6', '#ffe1a8'], text: '#fffaf0', gold: '#ffe08a', offer: ['#ffffff', '#fff1dc'], offerText: '#a33a00', panel: 'rgba(90,30,0,.24)', deco: ['#ffe066', '#ffffff', '#d00000', '#2b9348', '#6a040f'], dark: true },
    emerald: { bg: ['#03261f', '#0c6650'], glow: '#f4d27a', head: ['#fff8d6', '#f4d27a', '#d9a63c'], text: '#e8fff5', gold: '#f4d27a', offer: ['#f4d27a', '#d9a63c'], offerText: '#06302a', panel: 'rgba(0,0,0,.25)', deco: ['#f4d27a', '#ffffff', '#ff8fab', '#80ed99', '#ffd6a5'], dark: true },
    mint: { bg: ['#eefaf3', '#c9ecd8'], glow: '#ffd666', head: ['#0a5c3a', '#13824f', '#0a5c3a'], text: '#123d2c', gold: '#b8892a', offer: ['#0b6b45', '#085236'], offerText: '#ffffff', panel: 'rgba(255,255,255,.62)', deco: ['#13824f', '#d4a017', '#ffffff', '#0b6b45', '#f4a261'], dark: false },
    purple: { bg: ['#25073a', '#5c1a7d'], glow: '#ffcf5c', head: ['#fff6d8', '#ffcf5c', '#f59f00'], text: '#f6e8ff', gold: '#ffcf5c', offer: ['#ffcf5c', '#f59f00'], offerText: '#2b0a3d', panel: 'rgba(0,0,0,.25)', deco: ['#ffcf5c', '#ff6b9a', '#4cc9f0', '#b5e48c', '#ffffff'], dark: true },
    pink: { bg: ['#fff1f7', '#ffd3e6'], glow: '#ffffff', head: ['#c2185b', '#8e24aa', '#6a1b9a'], text: '#4a1036', gold: '#d81b60', offer: ['#7b1fa2', '#c2185b'], offerText: '#ffffff', panel: 'rgba(255,255,255,.66)', deco: ['#ff006e', '#ffbe0b', '#3a86ff', '#8338ec', '#06d6a0', '#fb5607'], dark: false },
    sky: { bg: ['#eaf6ff', '#bfe3ff'], glow: '#ffffff', head: ['#0b4f8a', '#1565c0', '#0b3c6e'], text: '#0d2b45', gold: '#e67e22', offer: ['#e8590c', '#c2410c'], offerText: '#ffffff', panel: 'rgba(255,255,255,.66)', deco: ['#e8590c', '#1565c0', '#d00000', '#2b9348', '#ffb703'], dark: false },
    white: { bg: ['#ffffff', '#eef3f8'], glow: '#ff9933', head: ['#0b2e6b', '#13408f', '#0b2e6b'], text: '#1f2937', gold: '#e8892b', offer: ['#138808', '#0f6b06'], offerText: '#ffffff', panel: 'rgba(11,46,107,.07)', deco: ['#ff9933', '#138808', '#0b2e6b', '#ffffff'], dark: false },
    ruby: { bg: ['#6e0b14', '#b3121f'], glow: '#ffd666', head: ['#ffffff', '#fff1c1', '#ffd166'], text: '#fff3f3', gold: '#ffd166', offer: ['#ffffff', '#ffe9e9'], offerText: '#8a0f1b', panel: 'rgba(0,0,0,.22)', deco: ['#ffd166', '#ffffff', '#2d6a4f', '#95d5b2', '#ffb4a2'], dark: true },
    forest: { bg: ['#062a20', '#14532d'], glow: '#facc15', head: ['#fffbe0', '#facc15', '#eab308'], text: '#ecfdf5', gold: '#facc15', offer: ['#dc2626', '#b91c1c'], offerText: '#ffffff', panel: 'rgba(0,0,0,.25)', deco: ['#facc15', '#ef4444', '#ffffff', '#86efac', '#f97316'], dark: true },
    sunrise: { bg: ['#ffd27a', '#ff8a3d'], glow: '#fffbe0', head: ['#5a1300', '#8a2b06', '#5a1300'], text: '#3d1200', gold: '#8a2b06', offer: ['#7c2d12', '#5a1300'], offerText: '#fff7e6', panel: 'rgba(255,255,255,.38)', deco: ['#d00000', '#ffba08', '#2b9348', '#7c2d12', '#ffffff'], dark: false },
    teal: { bg: ['#052f3a', '#0e6f84'], glow: '#ffd166', head: ['#fffbe6', '#ffd166', '#f4a72c'], text: '#e6fbff', gold: '#ffd166', offer: ['#ffd166', '#f4a72c'], offerText: '#06303a', panel: 'rgba(0,0,0,.25)', deco: ['#ffd166', '#ef476f', '#ffffff', '#06d6a0', '#f78c6b'], dark: true },
    gold: { bg: ['#fffaf0', '#ffe6a6'], glow: '#ffc83c', head: ['#7a4a00', '#b8860b', '#6b3e00'], text: '#3e2a00', gold: '#b8860b', offer: ['#7a1f1f', '#5c1414'], offerText: '#fff4d6', panel: 'rgba(255,255,255,.58)', deco: ['#d4a017', '#b91c1c', '#e85d04', '#2a9d8f', '#7a4a00'], dark: false },
    charcoal: { bg: ['#111111', '#2a2a2a'], glow: '#ffd43b', head: ['#fff3a3', '#ffd43b', '#fab005'], text: '#f1f3f5', gold: '#ffd43b', offer: ['#e03131', '#c92a2a'], offerText: '#ffffff', panel: 'rgba(255,255,255,.08)', deco: ['#ffd43b', '#e03131', '#ffffff', '#40c057', '#339af0'], dark: true },
    red: { bg: ['#c92a2a', '#e8590c'], glow: '#fff096', head: ['#ffffff', '#fff7d6', '#ffe066'], text: '#fffaf0', gold: '#ffe066', offer: ['#ffe066', '#fcc419'], offerText: '#7a0b0b', panel: 'rgba(0,0,0,.18)', deco: ['#ffe066', '#ffffff', '#1c7ed6', '#212529', '#ffa8a8'], dark: true },
    blush: { bg: ['#fff5f0', '#ffd9cc'], glow: '#ffffff', head: ['#b4235a', '#d6336c', '#a61e4d'], text: '#4a1426', gold: '#d6336c', offer: ['#a61e4d', '#862e5c'], offerText: '#ffffff', panel: 'rgba(255,255,255,.62)', deco: ['#f06595', '#fcc419', '#ff8787', '#63e6be', '#ffffff'], dark: false }
  };

  /* top: decoration hanging from the top edge, hero: main festival art, mini: small motif beside a photo,
     bottom: decoration along the bottom edge, bgp: faint background pattern, border: frame style */
  function T(id, icon, when, pals, look) {
    var t = { id: id, icon: icon, kind: when ? 'fest' : 'biz', pals: pals };
    if (when && when.fixed) t.fixed = when.fixed;
    if (when && when.dates) t.dates = when.dates;
    if (when && when.span) t.span = when.span;
    for (var k in look) t[k] = look[k];
    return t;
  }
  var TEMPLATES = [
    T('dhanteras', '🪙', { dates: ['2026-11-06', '2027-10-27'] }, ['gold', 'maroon', 'navy'], { top: 'toran', hero: 'coins', mini: 'coin', bottom: 'diyas', bgp: 'rays', border: 'geo' }),
    T('diwali', '🪔', { dates: ['2026-11-08', '2027-10-29'] }, ['maroon', 'navy', 'cream'], { top: 'lights', hero: 'diyas', mini: 'diya', bottom: 'rangoli', bgp: 'mandala', border: 'geo' }),
    T('govardhan', '⛰️', { dates: ['2026-11-10', '2027-10-30'] }, ['emerald', 'cream', 'maroon'], { top: 'toran', hero: 'hills', mini: 'diya', bottom: 'flowers', bgp: 'mandala', border: 'geo' }),
    T('bhaidooj', '👫', { dates: ['2026-11-11', '2027-10-31'] }, ['purple', 'cream', 'maroon'], { top: 'toran', hero: 'thali', mini: 'diya', bottom: 'rangoli', bgp: 'dots', border: 'scallop' }),
    T('chhath', '🌅', { dates: ['2026-11-15', '2027-11-04'], span: 1 }, ['sunrise', 'maroon', 'teal'], { top: 'flowers', hero: 'chhath', mini: 'diya', bottom: 'water', bgp: 'rays', border: 'geo' }),
    T('gurpurab', '✨', { dates: ['2026-11-24', '2027-11-14'] }, ['saffron', 'navy', 'cream'], { top: 'lights', hero: 'lamps', mini: 'diya', bottom: 'flowers', bgp: 'rays', border: 'geo' }),
    T('christmas', '🎄', { fixed: '12-25', span: 1 }, ['ruby', 'forest', 'sky'], { top: 'stars', hero: 'tree', mini: 'gift', bottom: 'snow', bgp: 'dots', border: 'simple' }),
    T('newyear', '🎆', { fixed: '01-01', span: 6 }, ['midnight', 'navy', 'charcoal'], { top: 'stars', hero: 'year', mini: 'firework', bottom: 'confetti', bgp: 'none', border: 'simple' }),
    T('lohri', '🔥', { dates: ['2026-01-13', '2027-01-14'] }, ['midnight', 'maroon', 'saffron'], { top: 'stars', hero: 'bonfire', mini: 'flame', bottom: 'flowers', bgp: 'rays', border: 'geo' }),
    T('sankranti', '🪁', { dates: ['2026-01-14', '2027-01-15'] }, ['sky', 'sunrise', 'navy'], { top: 'kites', hero: 'kites', mini: 'kite', bottom: 'confetti', bgp: 'rays', border: 'simple' }),
    T('pongal', '☀️', { dates: ['2026-01-14', '2027-01-15'], span: 2 }, ['sunrise', 'cream', 'emerald'], { top: 'toran', hero: 'pongal', mini: 'flower', bottom: 'rangoli', bgp: 'rays', border: 'geo' }),
    T('republic', '🏛️', { fixed: '01-26' }, ['white', 'navy', 'sky'], { top: 'tricolor', hero: 'balloons', mini: 'balloon', bottom: 'tricolor', bgp: 'rays', border: 'none' }),
    T('holi', '🎨', { dates: ['2026-03-04', '2027-03-22'] }, ['pink', 'white', 'midnight'], { top: 'colors', hero: 'gulal', mini: 'splash', bottom: 'colors', bgp: 'none', border: 'none' }),
    T('ugadi', '🌿', { dates: ['2026-03-19', '2027-04-07'] }, ['cream', 'emerald', 'saffron'], { top: 'toran', hero: 'gudi', mini: 'flower', bottom: 'rangoli', bgp: 'mandala', border: 'geo' }),
    T('eid', '🌙', { dates: ['2026-03-21', '2027-03-10'], span: 2 }, ['emerald', 'navy', 'mint'], { top: 'lanterns', hero: 'crescent', mini: 'lantern', bottom: 'domes', bgp: 'jaali', border: 'geo' }),
    T('mahavir', '🌸', { dates: ['2026-03-31', '2027-04-19'] }, ['cream', 'teal', 'gold'], { top: 'flowers', hero: 'lotus', mini: 'lotus', bottom: 'water', bgp: 'mandala', border: 'simple' }),
    T('easter', '🥚', { dates: ['2026-04-05', '2027-03-28'] }, ['sky', 'blush', 'mint'], { top: 'bunting', hero: 'eggs', mini: 'egg', bottom: 'grass', bgp: 'dots', border: 'simple' }),
    T('baisakhi', '🌾', { dates: ['2026-04-14', '2027-04-14'] }, ['saffron', 'sunrise', 'emerald'], { top: 'bunting', hero: 'wheat', mini: 'wheat', bottom: 'grass', bgp: 'rays', border: 'geo' }),
    T('bihu', '🥁', { dates: ['2026-04-14', '2027-04-14'], span: 6 }, ['cream', 'ruby', 'emerald'], { top: 'flowers', hero: 'dhol', mini: 'flower', bottom: 'gamosa', bgp: 'dots', border: 'simple' }),
    T('buddha', '🌕', { dates: ['2026-05-01', '2027-05-20'] }, ['navy', 'teal', 'cream'], { top: 'stars', hero: 'moonlotus', mini: 'lotus', bottom: 'water', bgp: 'none', border: 'simple' }),
    T('bakrid', '🕌', { dates: ['2026-05-27', '2027-05-17'], span: 2 }, ['navy', 'emerald', 'mint'], { top: 'lanterns', hero: 'crescent', mini: 'lantern', bottom: 'domes', bgp: 'jaali', border: 'geo' }),
    T('independence', '🕊️', { fixed: '08-15' }, ['white', 'sky', 'navy'], { top: 'tricolor', hero: 'tricolorkites', mini: 'kite', bottom: 'tricolor', bgp: 'rays', border: 'none' }),
    T('onam', '🌼', { dates: ['2026-08-26', '2027-09-12'], span: 1 }, ['cream', 'emerald', 'gold'], { top: 'flowers', hero: 'pookalam', mini: 'flower', bottom: 'leaves', bgp: 'dots', border: 'scallop' }),
    T('rakhi', '🎀', { dates: ['2026-08-28', '2027-08-17'] }, ['blush', 'purple', 'maroon'], { top: 'flowers', hero: 'rakhi', mini: 'flower', bottom: 'confetti', bgp: 'dots', border: 'scallop' }),
    T('janmashtami', '🦚', { dates: ['2026-09-04', '2027-08-25'], span: 1 }, ['navy', 'teal', 'cream'], { top: 'flowers', hero: 'flute', mini: 'feather', bottom: 'flowers', bgp: 'mandala', border: 'geo' }),
    T('ganesh', '🌺', { dates: ['2026-09-14', '2027-09-04'], span: 9 }, ['saffron', 'maroon', 'cream'], { top: 'toran', hero: 'modak', mini: 'flower', bottom: 'flowers', bgp: 'mandala', border: 'geo' }),
    T('navratri', '💃', { dates: ['2026-10-11', '2027-09-30'], span: 8 }, ['maroon', 'purple', 'saffron'], { top: 'bunting', hero: 'garba', mini: 'dandiya', bottom: 'rangoli', bgp: 'mandala', border: 'geo' }),
    T('dussehra', '🏹', { dates: ['2026-10-20', '2027-10-09'] }, ['saffron', 'maroon', 'navy'], { top: 'toran', hero: 'bow', mini: 'firework', bottom: 'flowers', bgp: 'rays', border: 'geo' }),
    T('opening', '🎊', null, ['ruby', 'cream', 'navy'], { top: 'bunting', hero: 'ribbon', mini: 'balloon', bottom: 'confetti', bgp: 'rays', border: 'simple' }),
    T('sale', '🏷️', null, ['red', 'charcoal', 'gold'], { top: 'bunting', hero: 'sale', mini: 'sparkle', bottom: 'confetti', bgp: 'rays', border: 'none' }),
    T('arrival', '🛍️', null, ['teal', 'blush', 'charcoal'], { top: 'stars', hero: 'bags', mini: 'sparkle', bottom: 'confetti', bgp: 'dots', border: 'simple' }),
    T('thanks', '🙏', null, ['blush', 'emerald', 'navy'], { top: 'flowers', hero: 'hearts', mini: 'heart', bottom: 'flowers', bgp: 'dots', border: 'scallop' })
  ];

  /* export sizes in pixels. A4/A5 are 300 dpi. */
  var SIZES = [
    { id: 'story', w: 1080, h: 1920, icon: [9, 16] },
    { id: 'insta', w: 1080, h: 1350, icon: [4, 5] },
    { id: 'square', w: 1080, h: 1080, icon: [1, 1] },
    { id: 'fb', w: 1200, h: 630, icon: [1.9, 1] },
    { id: 'a4', w: 2480, h: 3508, icon: [1, 1.414], print: 'A4' },
    { id: 'a5', w: 1748, h: 2480, icon: [1, 1.414], print: 'A5' }
  ];

  return { PAL: PAL, TEMPLATES: TEMPLATES, SIZES: SIZES };
})();
