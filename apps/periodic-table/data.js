/* Periodic Table Explorer: element data (language-neutral).
   Sources: IUPAC standard / conventional atomic weights (abridged), ground-state electron
   configurations, Pauling electronegativities (CRC / WebElements values; null = not known
   or only estimated). Layout follows the NCERT long form: La and Ac sit in group 3 of the
   main body, Ce–Lu and Th–Lr form the two f-block rows. */
(function () {
  'use strict';

  /* [Z, symbol, English name, atomic mass as printed ([n] = mass number of the longest-lived isotope),
      electron configuration (noble-gas core), Pauling electronegativity or null] */
  var RAW = [
    [1, 'H', 'Hydrogen', '1.008', '1s1', 2.20],
    [2, 'He', 'Helium', '4.0026', '1s2', null],
    [3, 'Li', 'Lithium', '6.94', '[He] 2s1', 0.98],
    [4, 'Be', 'Beryllium', '9.0122', '[He] 2s2', 1.57],
    [5, 'B', 'Boron', '10.81', '[He] 2s2 2p1', 2.04],
    [6, 'C', 'Carbon', '12.011', '[He] 2s2 2p2', 2.55],
    [7, 'N', 'Nitrogen', '14.007', '[He] 2s2 2p3', 3.04],
    [8, 'O', 'Oxygen', '15.999', '[He] 2s2 2p4', 3.44],
    [9, 'F', 'Fluorine', '18.998', '[He] 2s2 2p5', 3.98],
    [10, 'Ne', 'Neon', '20.180', '[He] 2s2 2p6', null],
    [11, 'Na', 'Sodium', '22.990', '[Ne] 3s1', 0.93],
    [12, 'Mg', 'Magnesium', '24.305', '[Ne] 3s2', 1.31],
    [13, 'Al', 'Aluminium', '26.982', '[Ne] 3s2 3p1', 1.61],
    [14, 'Si', 'Silicon', '28.085', '[Ne] 3s2 3p2', 1.90],
    [15, 'P', 'Phosphorus', '30.974', '[Ne] 3s2 3p3', 2.19],
    [16, 'S', 'Sulphur', '32.06', '[Ne] 3s2 3p4', 2.58],
    [17, 'Cl', 'Chlorine', '35.45', '[Ne] 3s2 3p5', 3.16],
    [18, 'Ar', 'Argon', '39.95', '[Ne] 3s2 3p6', null],
    [19, 'K', 'Potassium', '39.098', '[Ar] 4s1', 0.82],
    [20, 'Ca', 'Calcium', '40.078', '[Ar] 4s2', 1.00],
    [21, 'Sc', 'Scandium', '44.956', '[Ar] 3d1 4s2', 1.36],
    [22, 'Ti', 'Titanium', '47.867', '[Ar] 3d2 4s2', 1.54],
    [23, 'V', 'Vanadium', '50.942', '[Ar] 3d3 4s2', 1.63],
    [24, 'Cr', 'Chromium', '51.996', '[Ar] 3d5 4s1', 1.66],
    [25, 'Mn', 'Manganese', '54.938', '[Ar] 3d5 4s2', 1.55],
    [26, 'Fe', 'Iron', '55.845', '[Ar] 3d6 4s2', 1.83],
    [27, 'Co', 'Cobalt', '58.933', '[Ar] 3d7 4s2', 1.88],
    [28, 'Ni', 'Nickel', '58.693', '[Ar] 3d8 4s2', 1.91],
    [29, 'Cu', 'Copper', '63.546', '[Ar] 3d10 4s1', 1.90],
    [30, 'Zn', 'Zinc', '65.38', '[Ar] 3d10 4s2', 1.65],
    [31, 'Ga', 'Gallium', '69.723', '[Ar] 3d10 4s2 4p1', 1.81],
    [32, 'Ge', 'Germanium', '72.630', '[Ar] 3d10 4s2 4p2', 2.01],
    [33, 'As', 'Arsenic', '74.922', '[Ar] 3d10 4s2 4p3', 2.18],
    [34, 'Se', 'Selenium', '78.971', '[Ar] 3d10 4s2 4p4', 2.55],
    [35, 'Br', 'Bromine', '79.904', '[Ar] 3d10 4s2 4p5', 2.96],
    [36, 'Kr', 'Krypton', '83.798', '[Ar] 3d10 4s2 4p6', 3.00],
    [37, 'Rb', 'Rubidium', '85.468', '[Kr] 5s1', 0.82],
    [38, 'Sr', 'Strontium', '87.62', '[Kr] 5s2', 0.95],
    [39, 'Y', 'Yttrium', '88.906', '[Kr] 4d1 5s2', 1.22],
    [40, 'Zr', 'Zirconium', '91.224', '[Kr] 4d2 5s2', 1.33],
    [41, 'Nb', 'Niobium', '92.906', '[Kr] 4d4 5s1', 1.6],
    [42, 'Mo', 'Molybdenum', '95.95', '[Kr] 4d5 5s1', 2.16],
    [43, 'Tc', 'Technetium', '[98]', '[Kr] 4d5 5s2', 1.9],
    [44, 'Ru', 'Ruthenium', '101.07', '[Kr] 4d7 5s1', 2.2],
    [45, 'Rh', 'Rhodium', '102.91', '[Kr] 4d8 5s1', 2.28],
    [46, 'Pd', 'Palladium', '106.42', '[Kr] 4d10', 2.20],
    [47, 'Ag', 'Silver', '107.87', '[Kr] 4d10 5s1', 1.93],
    [48, 'Cd', 'Cadmium', '112.41', '[Kr] 4d10 5s2', 1.69],
    [49, 'In', 'Indium', '114.82', '[Kr] 4d10 5s2 5p1', 1.78],
    [50, 'Sn', 'Tin', '118.71', '[Kr] 4d10 5s2 5p2', 1.96],
    [51, 'Sb', 'Antimony', '121.76', '[Kr] 4d10 5s2 5p3', 2.05],
    [52, 'Te', 'Tellurium', '127.60', '[Kr] 4d10 5s2 5p4', 2.1],
    [53, 'I', 'Iodine', '126.90', '[Kr] 4d10 5s2 5p5', 2.66],
    [54, 'Xe', 'Xenon', '131.29', '[Kr] 4d10 5s2 5p6', 2.6],
    [55, 'Cs', 'Caesium', '132.91', '[Xe] 6s1', 0.79],
    [56, 'Ba', 'Barium', '137.33', '[Xe] 6s2', 0.89],
    [57, 'La', 'Lanthanum', '138.91', '[Xe] 5d1 6s2', 1.10],
    [58, 'Ce', 'Cerium', '140.12', '[Xe] 4f1 5d1 6s2', 1.12],
    [59, 'Pr', 'Praseodymium', '140.91', '[Xe] 4f3 6s2', 1.13],
    [60, 'Nd', 'Neodymium', '144.24', '[Xe] 4f4 6s2', 1.14],
    [61, 'Pm', 'Promethium', '[145]', '[Xe] 4f5 6s2', null],
    [62, 'Sm', 'Samarium', '150.36', '[Xe] 4f6 6s2', 1.17],
    [63, 'Eu', 'Europium', '151.96', '[Xe] 4f7 6s2', null],
    [64, 'Gd', 'Gadolinium', '157.25', '[Xe] 4f7 5d1 6s2', 1.20],
    [65, 'Tb', 'Terbium', '158.93', '[Xe] 4f9 6s2', null],
    [66, 'Dy', 'Dysprosium', '162.50', '[Xe] 4f10 6s2', 1.22],
    [67, 'Ho', 'Holmium', '164.93', '[Xe] 4f11 6s2', 1.23],
    [68, 'Er', 'Erbium', '167.26', '[Xe] 4f12 6s2', 1.24],
    [69, 'Tm', 'Thulium', '168.93', '[Xe] 4f13 6s2', 1.25],
    [70, 'Yb', 'Ytterbium', '173.05', '[Xe] 4f14 6s2', null],
    [71, 'Lu', 'Lutetium', '174.97', '[Xe] 4f14 5d1 6s2', 1.27],
    [72, 'Hf', 'Hafnium', '178.49', '[Xe] 4f14 5d2 6s2', 1.3],
    [73, 'Ta', 'Tantalum', '180.95', '[Xe] 4f14 5d3 6s2', 1.5],
    [74, 'W', 'Tungsten', '183.84', '[Xe] 4f14 5d4 6s2', 2.36],
    [75, 'Re', 'Rhenium', '186.21', '[Xe] 4f14 5d5 6s2', 1.9],
    [76, 'Os', 'Osmium', '190.23', '[Xe] 4f14 5d6 6s2', 2.2],
    [77, 'Ir', 'Iridium', '192.22', '[Xe] 4f14 5d7 6s2', 2.20],
    [78, 'Pt', 'Platinum', '195.08', '[Xe] 4f14 5d9 6s1', 2.28],
    [79, 'Au', 'Gold', '196.97', '[Xe] 4f14 5d10 6s1', 2.54],
    [80, 'Hg', 'Mercury', '200.59', '[Xe] 4f14 5d10 6s2', 2.00],
    [81, 'Tl', 'Thallium', '204.38', '[Xe] 4f14 5d10 6s2 6p1', 1.62],
    [82, 'Pb', 'Lead', '207.2', '[Xe] 4f14 5d10 6s2 6p2', 2.33],
    [83, 'Bi', 'Bismuth', '208.98', '[Xe] 4f14 5d10 6s2 6p3', 2.02],
    [84, 'Po', 'Polonium', '[209]', '[Xe] 4f14 5d10 6s2 6p4', 2.0],
    [85, 'At', 'Astatine', '[210]', '[Xe] 4f14 5d10 6s2 6p5', 2.2],
    [86, 'Rn', 'Radon', '[222]', '[Xe] 4f14 5d10 6s2 6p6', 2.2],
    [87, 'Fr', 'Francium', '[223]', '[Rn] 7s1', 0.7],
    [88, 'Ra', 'Radium', '[226]', '[Rn] 7s2', 0.9],
    [89, 'Ac', 'Actinium', '[227]', '[Rn] 6d1 7s2', 1.1],
    [90, 'Th', 'Thorium', '232.04', '[Rn] 6d2 7s2', 1.3],
    [91, 'Pa', 'Protactinium', '231.04', '[Rn] 5f2 6d1 7s2', 1.5],
    [92, 'U', 'Uranium', '238.03', '[Rn] 5f3 6d1 7s2', 1.38],
    [93, 'Np', 'Neptunium', '[237]', '[Rn] 5f4 6d1 7s2', 1.36],
    [94, 'Pu', 'Plutonium', '[244]', '[Rn] 5f6 7s2', 1.28],
    [95, 'Am', 'Americium', '[243]', '[Rn] 5f7 7s2', 1.3],
    [96, 'Cm', 'Curium', '[247]', '[Rn] 5f7 6d1 7s2', 1.3],
    [97, 'Bk', 'Berkelium', '[247]', '[Rn] 5f9 7s2', 1.3],
    [98, 'Cf', 'Californium', '[251]', '[Rn] 5f10 7s2', 1.3],
    [99, 'Es', 'Einsteinium', '[252]', '[Rn] 5f11 7s2', 1.3],
    [100, 'Fm', 'Fermium', '[257]', '[Rn] 5f12 7s2', null],
    [101, 'Md', 'Mendelevium', '[258]', '[Rn] 5f13 7s2', null],
    [102, 'No', 'Nobelium', '[259]', '[Rn] 5f14 7s2', null],
    [103, 'Lr', 'Lawrencium', '[266]', '[Rn] 5f14 7s2 7p1', null],
    [104, 'Rf', 'Rutherfordium', '[267]', '[Rn] 5f14 6d2 7s2', null],
    [105, 'Db', 'Dubnium', '[268]', '[Rn] 5f14 6d3 7s2', null],
    [106, 'Sg', 'Seaborgium', '[269]', '[Rn] 5f14 6d4 7s2', null],
    [107, 'Bh', 'Bohrium', '[270]', '[Rn] 5f14 6d5 7s2', null],
    [108, 'Hs', 'Hassium', '[269]', '[Rn] 5f14 6d6 7s2', null],
    [109, 'Mt', 'Meitnerium', '[278]', '[Rn] 5f14 6d7 7s2', null],
    [110, 'Ds', 'Darmstadtium', '[281]', '[Rn] 5f14 6d8 7s2', null],
    [111, 'Rg', 'Roentgenium', '[282]', '[Rn] 5f14 6d9 7s2', null],
    [112, 'Cn', 'Copernicium', '[285]', '[Rn] 5f14 6d10 7s2', null],
    [113, 'Nh', 'Nihonium', '[286]', '[Rn] 5f14 6d10 7s2 7p1', null],
    [114, 'Fl', 'Flerovium', '[289]', '[Rn] 5f14 6d10 7s2 7p2', null],
    [115, 'Mc', 'Moscovium', '[290]', '[Rn] 5f14 6d10 7s2 7p3', null],
    [116, 'Lv', 'Livermorium', '[293]', '[Rn] 5f14 6d10 7s2 7p4', null],
    [117, 'Ts', 'Tennessine', '[294]', '[Rn] 5f14 6d10 7s2 7p5', null],
    [118, 'Og', 'Oganesson', '[294]', '[Rn] 5f14 6d10 7s2 7p6', null]
  ];

  /* Families (categories). Po is a metalloid as in the NCERT list of metalloids. */
  var CAT_LIST = {
    alkali: [3, 11, 19, 37, 55, 87],
    alkaline: [4, 12, 20, 38, 56, 88],
    nonmetal: [1, 6, 7, 8, 15, 16, 34],
    halogen: [9, 17, 35, 53, 85, 117],
    noble: [2, 10, 18, 36, 54, 86, 118],
    metalloid: [5, 14, 32, 33, 51, 52, 84],
    post: [13, 31, 49, 50, 81, 82, 83, 113, 114, 115, 116]
  };
  var CATS = ['alkali', 'alkaline', 'transition', 'post', 'metalloid', 'nonmetal', 'halogen', 'noble', 'lanthanoid', 'actinoid'];
  var CAT_TYPE = { alkali: 'metal', alkaline: 'metal', transition: 'metal', post: 'metal', lanthanoid: 'metal', actinoid: 'metal', metalloid: 'metalloid', nonmetal: 'nonmetal', halogen: 'nonmetal', noble: 'nonmetal' };

  var GASES = [1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86];
  var LIQUIDS = [35, 80];

  /* Valency (combining capacity) for the first 30 elements, most common first (NCERT Class 9 tables). */
  var VALENCY = {
    1: [1], 2: [0], 3: [1], 4: [2], 5: [3], 6: [4], 7: [3], 8: [2], 9: [1], 10: [0],
    11: [1], 12: [2], 13: [3], 14: [4], 15: [3, 5], 16: [2, 4, 6], 17: [1], 18: [0], 19: [1], 20: [2],
    21: [3], 22: [4, 3], 23: [5, 4, 3], 24: [3, 6, 2], 25: [2, 4, 7], 26: [2, 3], 27: [2, 3], 28: [2], 29: [1, 2], 30: [2]
  };
  /* Mass number of the most common isotope (first 20, as in NCERT Table 4.1). */
  var MASS_NUMBER = [1, 4, 7, 9, 11, 12, 14, 16, 19, 20, 23, 24, 27, 28, 31, 32, 35, 40, 39, 40];
  /* Symbols that come from old (mostly Latin) names. */
  var LATIN = { 11: 'natrium', 19: 'kalium', 26: 'ferrum', 29: 'cuprum', 47: 'argentum', 50: 'stannum', 51: 'stibium', 74: 'wolfram', 79: 'aurum', 80: 'hydrargyrum', 82: 'plumbum' };
  /* Other spellings people search for. */
  var ALIAS = { 13: 'aluminum', 16: 'sulfur', 55: 'cesium' };

  var CORE = {
    He: '1s2',
    Ne: '[He] 2s2 2p6',
    Ar: '[Ne] 3s2 3p6',
    Kr: '[Ar] 3d10 4s2 4p6',
    Xe: '[Kr] 4d10 5s2 5p6',
    Rn: '[Xe] 4f14 5d10 6s2 6p6'
  };
  /* Expand "[Ne] 3s2 3p5" into subshells [{n, l, e}] */
  function expand(cfg) {
    var out = [];
    String(cfg).split(/\s+/).forEach(function (tok) {
      var m = /^\[(\w+)\]$/.exec(tok);
      if (m) { out = out.concat(expand(CORE[m[1]])); return; }
      m = /^(\d)([spdf])(\d+)$/.exec(tok);
      if (m) out.push({ n: +m[1], l: m[2], e: +m[3] });
    });
    return out;
  }

  function period(z) { return z <= 2 ? 1 : z <= 10 ? 2 : z <= 18 ? 3 : z <= 36 ? 4 : z <= 54 ? 5 : z <= 86 ? 6 : 7; }
  var PSTART = [0, 1, 3, 11, 19, 37, 55, 87];
  function group(z) {
    var p = period(z), i = z - PSTART[p];
    if (p === 1) return z === 1 ? 1 : 18;
    if (p <= 3) return [1, 2, 13, 14, 15, 16, 17, 18][i];
    if (p <= 5) return i + 1;
    if (i <= 2) return i + 1;                       // Cs Ba La / Fr Ra Ac
    if ((z >= 58 && z <= 71) || (z >= 90 && z <= 103)) return null;   // f-block rows
    return z - (p === 6 ? 68 : 100);              // Hf..Rn = 4..18, Rf..Og = 4..18
  }
  function category(z) {
    for (var k in CAT_LIST) if (CAT_LIST[k].indexOf(z) >= 0) return k;
    if (z >= 57 && z <= 71) return 'lanthanoid';
    if (z >= 89 && z <= 103) return 'actinoid';
    return 'transition';
  }

  var elements = RAW.map(function (r) {
    var z = r[0], g = group(z), p = period(z), sub = expand(r[4]);
    var shells = [];
    sub.forEach(function (s) { shells[s.n - 1] = (shells[s.n - 1] || 0) + s.e; });
    for (var i = 0; i < shells.length; i++) shells[i] = shells[i] || 0;
    var block = g === null ? 'f' : (z === 2 || g <= 2) ? 's' : g <= 12 ? 'd' : 'p';
    var cat = category(z);
    var el = {
      z: z, sym: r[1], name: r[2], mass: r[3], massValue: parseFloat(String(r[3]).replace(/[\[\]]/g, '')),
      config: r[4], en: r[5], group: g, period: p, block: block, cat: cat, type: CAT_TYPE[cat],
      state: z >= 100 ? 'unknown' : GASES.indexOf(z) >= 0 ? 'gas' : LIQUIDS.indexOf(z) >= 0 ? 'liquid' : 'solid',
      shells: shells,
      valency: VALENCY[z] || null,
      massNumber: z <= 20 ? MASS_NUMBER[z - 1] : null,
      radioactive: z === 43 || z === 61 || z >= 84,
      superheavy: z >= 100,
      latin: LATIN[z] || '',
      alias: ALIAS[z] || '',
      /* grid position (row 1 = group numbers, column 1 = period numbers) */
      row: g === null ? (p === 6 ? 10 : 11) : p + 1,
      col: g === null ? (z - (p === 6 ? 58 : 90)) + 5 : g + 1
    };
    return el;
  });
  var byZ = {};
  elements.forEach(function (e) { byZ[e.z] = e; });

  window.PT_DATA = { elements: elements, byZ: byZ, cats: CATS, expand: expand };
})();
