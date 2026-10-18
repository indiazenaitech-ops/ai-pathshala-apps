/* Land Area Converter: unit sizes, state presets and the source of every value.
   All sizes are in square feet. Checked 2026-10-18.
   A unit is one of:
     { id, sqft }                         fixed size
     { id, variants: [{ v, sqft, src }] } size changes inside the state (first = default)
     { id, of: 'parent', div: 20 }        1/20 of the parent unit (follows the parent's chosen size)
     { id, of: 'parent', mul: 4 }         4 × the parent unit
   Every unit can also be given a custom size by the user ("my village's bigha = ___ sq ft").
   Sources (short names used below):
     GoRT   = Glossary of Revenue Terms, Dept. of Land Resources, Ministry of Rural Development, GoI (Jan 2026),
              as reproduced state-wise at 1acre.in/land-unit-converter/<state>
     WP-B   = Wikipedia "Bigha" (en.wikipedia.org/wiki/Bigha)
     WP-P   = Wikipedia "Measurement of land in Punjab" (standard 66-inch karam system)
     HSG-K  = housing.com "Katha: land measurement unit and area conversions"
     HSG-L  = housing.com "Local land measurement units in India"
     GDJ    = godrejproperties.com "Land measurement units in South India"
     ILC    = indialandconverter.in (Gujarat bigha)
     PS     = ponniyinselvan.in "Tamil Measurements" (kuzhi, ma, veli)
*/
(function () {
  'use strict';
  var SQM = 1 / 0.09290304;            /* 1 sq m in sq ft (1 ft = 0.3048 m exactly) */
  var C = 'Acre = 43,560 sq ft exactly; cent / decimal = 1/100 acre, guntha = 1/40 acre (GoRT)';

  var STD = [
    { id: 'sqft', sqft: 1, src: 'Definition' },
    { id: 'sqm', sqft: SQM, src: '1 ft = 0.3048 m (international foot)' },
    { id: 'sqyd', sqft: 9, src: '1 yard (gaj) = 3 ft' },
    { id: 'acre', sqft: 43560, src: '1 acre = 4,840 sq yd = 4,046.8564224 sq m' },
    { id: 'hectare', sqft: 10000 * SQM, src: '1 hectare = 10,000 sq m = 100 are' },
    { id: 'are', sqft: 100 * SQM, src: '1 are = 100 sq m' },
    { id: 'sqkm', sqft: 1e6 * SQM, src: '1 sq km = 100 hectare' }
  ];

  var cent = { id: 'cent', sqft: 435.6, src: C };
  var decimal = { id: 'decimal', sqft: 435.6, src: C };
  var guntha = { id: 'guntha', sqft: 1089, src: C };
  var sarsai = { id: 'sarsai', sqft: 30.25, src: 'WP-P: sarsai = 1 sq karam = 5.5 ft × 5.5 ft' };
  var marla = { id: 'marla', sqft: 272.25, src: 'WP-P, GoRT (Haryana, J&K): 1 marla = 9 sarsai = 30.25 sq yd' };
  var kanal = { id: 'kanal', sqft: 5445, src: 'WP-P, GoRT: 1 kanal = 20 marla = 605 sq yd' };
  var killa = { id: 'killa', sqft: 43560, src: 'WP-P: 1 killa = 1 acre = 8 kanal' };
  var murabba = { id: 'murabba', sqft: 25 * 43560, src: 'WP-P: 1 murabba = 25 killa (25 acre)' };
  var biswaOf = { id: 'biswa', of: 'bigha', div: 20, src: '1 bigha = 20 biswa' };
  var biswansiOf = { id: 'biswansi', of: 'biswa', div: 20, src: '1 biswa = 20 biswansi' };

  var STATES = [
    { id: 'all', units: [cent, decimal, guntha] },
    { id: 'up', units: [
      { id: 'bigha', note: 'n_up', variants: [
        { v: 'v_east_up', sqft: 27225, src: 'WP-B: eastern UP & Lucknow, 20 biswa = 3,025 sq yd (pucca)' },
        { v: 'v_west_up', sqft: 6806.25, src: 'WP-B: western UP, 756.25 sq yd (kachcha)' },
        { v: 'v_some_up', sqft: 9075, src: 'WP-B: some districts, 1,008.33 sq yd' }] },
      biswaOf, biswansiOf] },
    { id: 'bihar', units: [
      { id: 'bigha', note: 'n_district', variants: [
        { v: 'v_patna', sqft: 27225, src: 'WP-B: near Patna, 20 katha × 1,361.25 sq ft' },
        { v: 'v_gort', sqft: 29040, src: 'GoRT Bihar: 2,697.9 sq m (1 acre ≈ 1.5 bigha)' }] },
      { id: 'katha', of: 'bigha', div: 20, note: 'n_bihar_katha', src: '1 bigha = 20 katha (WP-B, GoRT)', variants: [
        { v: 'v_muzaffarpur', sqft: 1901, src: 'WP-B: Muzaffarpur katha 1,901 sq ft' },
        { v: 'v_champaran', sqft: 3267, src: 'WP-B: West Champaran katha 3,267 sq ft' },
        { v: 'v_siwan', sqft: 1520, src: 'HSG-K: Siwan katha 1,520 sq ft' }] },
      { id: 'dhur', of: 'katha', div: 20, src: '1 katha = 20 dhur (WP-B, GoRT)' },
      { id: 'dhurki', of: 'dhur', div: 20, src: '1 dhur = 20 dhurki (WP-B)' },
      decimal] },
    { id: 'jharkhand', units: [
      decimal,
      { id: 'katha', note: 'n_district', variants: [
        { v: 'v_common', sqft: 1361.25, src: 'WP-B: UP/Bihar/Jharkhand katha 1,361.25 sq ft' },
        { v: 'v_palamu', sqft: 1742, src: 'HSG-K: Palamu katha 1,742 sq ft' }] },
      { id: 'dhur', of: 'katha', div: 20, src: '1 katha = 20 dhur' }] },
    { id: 'wb', units: [
      { id: 'bigha', sqft: 14400, src: 'WP-B: 14,400 sq ft = 1,600 sq yd; 1 acre ≈ 3.025 bigha' },
      { id: 'katha', of: 'bigha', div: 20, src: 'HSG-K: West Bengal katha 720 sq ft (20 katha = 1 bigha)' },
      { id: 'chatak', of: 'katha', div: 16, src: 'HSG-L: chatak 45 sq ft (16 chatak = 1 katha)' },
      decimal] },
    { id: 'assam', units: [
      { id: 'bigha', sqft: 14400, src: 'GoRT Assam, WP-B (NEDFI, Assam Revenue dept.)' },
      { id: 'katha', of: 'bigha', div: 5, src: 'GoRT Assam: 1 bigha = 5 katha = 2,880 sq ft each' },
      { id: 'lessa', of: 'katha', div: 20, src: 'GoRT Assam: lessa 144 sq ft, 20 lessa = 1 katha' },
      { id: 'pura', of: 'bigha', mul: 4, src: 'WP-B: 1 pura = 4 bigha' }] },
    { id: 'odisha', units: [decimal] },
    { id: 'punjab', units: [sarsai, marla, kanal,
      { id: 'bigha', sqft: 21780, src: 'WP-P, WP-B: 1 bigha = 4 kanal = 2,420 sq yd' },
      killa, murabba] },
    { id: 'haryana', units: [sarsai, marla, kanal,
      { id: 'bigha', note: 'n_old', variants: [
        { v: 'v_4kanal', sqft: 21780, src: 'WP-B: Punjab & Haryana bigha = 4 kanal = 2,420 sq yd' },
        { v: 'v_old', sqft: 9075, src: 'WP-P: older Haryana/Delhi system, 4.8 bigha = 1 acre' }] },
      biswaOf, biswansiOf, killa, murabba] },
    { id: 'delhi', units: [
      { id: 'bigha', sqft: 9075, src: 'WP-P / WP-B: 1,008.33 sq yd (4.8 bigha = 1 acre)' },
      biswaOf, biswansiOf] },
    { id: 'hp', units: [
      { id: 'bigha', sqft: 8712, src: 'WP-B: Himachal bigha 8,712 sq ft = 968 sq yd (5 bigha = 1 acre)' },
      biswaOf, biswansiOf, kanal, marla, sarsai] },
    { id: 'uk', units: [
      { id: 'bigha', note: 'n_hills', variants: [
        { v: 'v_hills', sqft: 6806.25, src: 'WP-B: hilly areas 756.25 sq yd' },
        { v: 'v_plains', sqft: 17424, src: 'WP-B: plains 1,936 sq yd' }] },
      biswaOf,
      { id: 'nali', sqft: 2160, src: 'WP-B: nali (hills) 2,160 sq ft = 240 sq yd' }] },
    { id: 'jk', units: [kanal, marla, sarsai] },
    { id: 'rajasthan', units: [
      { id: 'bigha', note: 'n_pucca', variants: [
        { v: 'v_pucca', sqft: 27225, src: 'WP-B (sizes.com): pucca bigha 3,025 sq yd, a 165 ft × 165 ft plot' },
        { v: 'v_kachcha', sqft: 17424, src: 'WP-B (sizes.com): kachcha bigha 1,936 sq yd' }] },
      biswaOf, biswansiOf] },
    { id: 'mp', units: [
      { id: 'bigha', note: 'n_src_differ', variants: [
        { v: 'v_gort', sqft: 27000, src: 'GoRT Madhya Pradesh: 2,508.38 sq m' },
        { v: 'v_other', sqft: 12000, src: 'WP-B, HSG-L: 12,000 sq ft' }] },
      biswaOf] },
    { id: 'gujarat', units: [
      { id: 'bigha', note: 'n_district', variants: [
        { v: 'v_north_guj', sqft: 17424, src: 'ILC: North/Central Gujarat 17,424 sq ft (= 16 guntha); HSG-L' },
        { v: 'v_south_guj', sqft: 23958, src: 'ILC: South Gujarat / Vadodara 23,958 sq ft' }] },
      guntha] },
    { id: 'maharashtra', units: [guntha] },
    { id: 'karnataka', units: [guntha,
      { id: 'anna', of: 'guntha', div: 16, note: 'n_records', src: 'Traditional: 16 anna = 1 gunta (acre–gunta–anna in old RTC records)' },
      cent,
      { id: 'ankanam', sqft: 72, note: 'n_traditional', src: 'GDJ, HSG-L: 72 sq ft (8 ft × 9 ft)' }] },
    { id: 'ap', units: [
      { id: 'ankanam', sqft: 72, src: 'GoRT Andhra Pradesh: 6.69 sq m = 72 sq ft' },
      cent, guntha,
      { id: 'kuncham', note: 'n_src_differ', variants: [
        { v: 'v_common', sqft: 4356, src: 'HSG-L: 4,356 sq ft (10 cents)' },
        { v: 'v_other', sqft: 484, src: 'GDJ: 484 sq ft' }] }] },
    { id: 'tg', units: [
      { id: 'ankanam', sqft: 72, src: 'GoRT (Andhra Pradesh / Telangana), GDJ: 72 sq ft' },
      guntha, cent,
      { id: 'kuncham', note: 'n_src_differ', variants: [
        { v: 'v_common', sqft: 4356, src: 'HSG-L: 4,356 sq ft (10 cents)' },
        { v: 'v_other', sqft: 484, src: 'GDJ: 484 sq ft' }] }] },
    { id: 'tn', units: [
      { id: 'ground', sqft: 2400, src: 'GDJ, HSG-L: 1 ground = 2,400 sq ft (Chennai plots)' },
      cent,
      { id: 'kuzhi', sqft: 144, note: 'n_traditional', src: 'PS: 1 kuzhi = 144 sq ft (12 ft × 12 ft); varies by area' },
      { id: 'ma', of: 'kuzhi', mul: 100, src: 'PS: 1 ma = 100 kuzhi' },
      { id: 'veli', of: 'ma', mul: 20, src: 'PS: 1 veli = 20 ma (about 6.6 acre)' }] },
    { id: 'kerala', units: [cent] }
  ];

  window.LAC_DATA = { checked: '2026-10-18', SQM: SQM, std: STD, states: STATES,
    sources: [
      'GoRT: Glossary of Revenue Terms, Department of Land Resources, Ministry of Rural Development, Government of India (Jan 2026), state tables at 1acre.in',
      'Wikipedia: "Bigha" and "Measurement of land in Punjab"',
      'housing.com: "Katha: land measurement unit and area conversions"; "Local land measurement units in India"',
      'godrejproperties.com: "Land measurement units in South India"',
      'indialandconverter.in: Gujarat bigha (North/Central and South)',
      'ponniyinselvan.in: "Tamil Measurements" (kuzhi, ma, veli)'
    ] };
})();
