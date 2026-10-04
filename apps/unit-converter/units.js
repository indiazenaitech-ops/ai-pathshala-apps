/* Unit data for the Unit Converter. Each linear unit has a factor = how many BASE units one of it is.
   Names come from strings.js ("u_" + id); symbols are SI / textbook symbols (same in every language).
   ex = example chips; pr = [bigger, smaller] unit pairs with a whole-number factor, used by the Practice tab
   (temperature and speed have their own question makers in app.js). */
window.UC_UNITS = [
  { id: 'length', icon: '📏', base: 'm', def: ['km', 'm', '1.5'], units: [
    { id: 'ang', sym: 'Å', f: 1e-10 }, { id: 'nm', sym: 'nm', f: 1e-9 }, { id: 'um', sym: 'µm', f: 1e-6 }, { id: 'mm', sym: 'mm', f: 1e-3 },
    { id: 'cm', sym: 'cm', f: 1e-2 }, { id: 'm', sym: 'm', f: 1 }, { id: 'km', sym: 'km', f: 1e3 },
    { id: 'in', sym: 'in', f: 0.0254 }, { id: 'ft', sym: 'ft', f: 0.3048 }, { id: 'yd', sym: 'yd', f: 0.9144 },
    { id: 'mi', sym: 'mi', f: 1609.344 }, { id: 'nmi', sym: 'nmi', f: 1852 },
    { id: 'au', sym: 'AU', f: 149597870700 }, { id: 'ly', sym: 'ly', f: 9460730472580800 } ],
    ex: [ { k: 'ex_pitch', v: '22', a: 'yd', b: 'm' }, { k: 'ex_marathon', v: '42.195', a: 'km', b: 'mi' }, { k: 'ex_sun', v: '1', a: 'au', b: 'km' } ],
    pr: [['km', 'm'], ['m', 'cm'], ['cm', 'mm'], ['m', 'mm']] },
  { id: 'mass', icon: '⚖️', base: 'kg', def: ['kg', 'g', '2.5'], units: [
    { id: 'mg', sym: 'mg', f: 1e-6 }, { id: 'g', sym: 'g', f: 1e-3 }, { id: 'kg', sym: 'kg', f: 1 },
    { id: 'q', sym: 'q', f: 100 }, { id: 't', sym: 't', f: 1000 }, { id: 'ct', sym: 'ct', f: 0.0002 },
    { id: 'tola', sym: 'tola', f: 0.0116638038 }, { id: 'oz', sym: 'oz', f: 0.028349523125 }, { id: 'lb', sym: 'lb', f: 0.45359237 } ],
    ex: [ { k: 'ex_wheat', v: '5', a: 'q', b: 'kg' }, { k: 'ex_gold', v: '1', a: 'tola', b: 'g' } ],
    pr: [['kg', 'g'], ['g', 'mg'], ['q', 'kg'], ['t', 'kg']] },
  { id: 'time', icon: '⏱️', base: 's', def: ['h', 'min', '2'], units: [
    { id: 'ms', sym: 'ms', f: 1e-3 }, { id: 's', sym: 's', f: 1 }, { id: 'min', sym: 'min', f: 60 },
    { id: 'h', sym: 'h', f: 3600 }, { id: 'd', sym: 'd', f: 86400 }, { id: 'wk', sym: 'wk', f: 604800 },
    { id: 'yr', sym: 'yr', f: 31536000 } ],
    ex: [ { k: 'ex_day', v: '1', a: 'd', b: 's' }, { k: 'ex_exam', v: '3', a: 'h', b: 'min' } ],
    pr: [['h', 'min'], ['min', 's'], ['h', 's'], ['d', 'h'], ['wk', 'd']] },
  { id: 'temp', icon: '🌡️', base: 'c', def: ['c', 'f', '37'], temp: true, units: [
    { id: 'c', sym: '°C' }, { id: 'f', sym: '°F' }, { id: 'k', sym: 'K' } ],
    ex: [ { k: 'ex_body', v: '98.6', a: 'f', b: 'c' }, { k: 'ex_boil', v: '100', a: 'c', b: 'f' } ] },
  { id: 'area', icon: '📐', base: 'm2', def: ['ha', 'acre', '1'], units: [
    { id: 'mm2', sym: 'mm²', f: 1e-6 }, { id: 'cm2', sym: 'cm²', f: 1e-4 }, { id: 'm2', sym: 'm²', f: 1 },
    { id: 'km2', sym: 'km²', f: 1e6 }, { id: 'ha', sym: 'ha', f: 1e4 }, { id: 'are', sym: 'a', f: 100 },
    { id: 'acre', sym: 'acre', f: 4046.8564224 }, { id: 'cent', sym: 'cent', f: 40.468564224 },
    { id: 'guntha', sym: 'guntha', f: 101.17141056 }, { id: 'ft2', sym: 'ft²', f: 0.09290304 },
    { id: 'yd2', sym: 'yd²', f: 0.83612736 }, { id: 'in2', sym: 'in²', f: 0.00064516 } ],
    ex: [ { k: 'ex_farm', v: '2', a: 'ha', b: 'acre' }, { k: 'ex_plot', v: '200', a: 'yd2', b: 'm2' } ],
    pr: [['m2', 'cm2'], ['cm2', 'mm2'], ['ha', 'm2'], ['km2', 'ha'], ['acre', 'cent'], ['acre', 'guntha']] },
  { id: 'volume', icon: '🧪', base: 'l', def: ['l', 'ml', '2'], units: [
    { id: 'ml', sym: 'mL', f: 1e-3 }, { id: 'l', sym: 'L', f: 1 }, { id: 'kl', sym: 'kL', f: 1e3 },
    { id: 'cm3', sym: 'cm³', f: 1e-3 }, { id: 'm3', sym: 'm³', f: 1e3 }, { id: 'ft3', sym: 'ft³', f: 28.316846592 },
    { id: 'galus', sym: 'US gal', f: 3.785411784 }, { id: 'galuk', sym: 'UK gal', f: 4.54609 } ],
    ex: [ { k: 'ex_tank', v: '1000', a: 'l', b: 'm3' }, { k: 'ex_cube', v: '1000', a: 'cm3', b: 'l' } ],
    pr: [['l', 'ml'], ['kl', 'l'], ['m3', 'l'], ['l', 'cm3']] },
  { id: 'speed', icon: '🚗', base: 'mps', def: ['kmh', 'mps', '72'], units: [
    { id: 'mps', sym: 'm/s', f: 1 }, { id: 'kmh', sym: 'km/h', f: 1000 / 3600 }, { id: 'kms', sym: 'km/s', f: 1000 },
    { id: 'mph', sym: 'mph', f: 0.44704 }, { id: 'kn', sym: 'kn', f: 1852 / 3600 } ],
    ex: [ { k: 'ex_kmh', v: '72', a: 'kmh', b: 'mps' }, { k: 'ex_sprint', v: '10', a: 'mps', b: 'kmh' } ] },
  { id: 'data', icon: '💾', base: 'bit', def: ['gb', 'mb', '1'], units: [
    { id: 'bit', sym: 'bit', f: 1 }, { id: 'nib', sym: 'nibble', f: 4 }, { id: 'byte', sym: 'B', f: 8 },
    { id: 'kb', sym: 'KB', f: 8e3 }, { id: 'mb', sym: 'MB', f: 8e6 }, { id: 'gb', sym: 'GB', f: 8e9 }, { id: 'tb', sym: 'TB', f: 8e12 },
    { id: 'kib', sym: 'KiB', f: 8 * 1024 }, { id: 'mib', sym: 'MiB', f: 8 * 1048576 },
    { id: 'gib', sym: 'GiB', f: 8 * 1073741824 }, { id: 'tib', sym: 'TiB', f: 8 * 1099511627776 } ],
    ex: [ { k: 'ex_phone', v: '128', a: 'gb', b: 'gib' }, { k: 'ex_plan', v: '1.5', a: 'gb', b: 'mb' } ],
    pr: [['byte', 'bit'], ['kb', 'byte'], ['mb', 'kb'], ['gb', 'mb'], ['kib', 'byte'], ['mib', 'kib'], ['gib', 'mib']] },
  { id: 'pressure', icon: '🎈', base: 'pa', def: ['atm', 'kpa', '1'], units: [
    { id: 'pa', sym: 'Pa', f: 1 }, { id: 'hpa', sym: 'hPa', f: 100 }, { id: 'kpa', sym: 'kPa', f: 1000 },
    { id: 'bar', sym: 'bar', f: 1e5 }, { id: 'atm', sym: 'atm', f: 101325 }, { id: 'mmhg', sym: 'mmHg', f: 133.322387415 },
    { id: 'psi', sym: 'psi', f: 6894.757293168 } ],
    ex: [ { k: 'ex_tyre', v: '32', a: 'psi', b: 'kpa' }, { k: 'ex_bp', v: '120', a: 'mmhg', b: 'kpa' } ],
    pr: [['kpa', 'pa'], ['hpa', 'pa'], ['bar', 'kpa'], ['bar', 'pa']] },
  { id: 'energy', icon: '⚡', base: 'j', def: ['kwh', 'j', '1'], units: [
    { id: 'j', sym: 'J', f: 1 }, { id: 'kj', sym: 'kJ', f: 1000 }, { id: 'cal', sym: 'cal', f: 4.184 },
    { id: 'kcal', sym: 'kcal', f: 4184 }, { id: 'wh', sym: 'Wh', f: 3600 }, { id: 'kwh', sym: 'kWh', f: 3.6e6 },
    { id: 'ev', sym: 'eV', f: 1.602176634e-19 } ],
    ex: [ { k: 'ex_unit', v: '1', a: 'kwh', b: 'j' }, { k: 'ex_food', v: '250', a: 'kcal', b: 'kj' } ],
    pr: [['kj', 'j'], ['kcal', 'cal'], ['kwh', 'wh'], ['wh', 'j'], ['kwh', 'kj']] }
];
