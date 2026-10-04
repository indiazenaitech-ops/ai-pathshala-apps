/* Salary Slip Maker: every statutory rate in ONE place. Checked on 2026-10-04.
   Estimate only, not legal or tax advice. When a rate changes, edit this file and the "checked" date.

   Sources checked: EPF Scheme (employee share 12% of PF wages = basic + DA; statutory wage ceiling Rs 15,000),
   ESI Act (employee 0.75%, employer 3.25%, wage limit Rs 21,000 a month, contribution periods Apr-Sep and Oct-Mar),
   state professional-tax schedules as used by payroll teams in Oct 2026 (Karnataka Rs 200 x 11 + Rs 300 in February
   from 1 April 2025; Odisha repealed professional tax from 1 April 2026; Tamil Nadu half-yearly slabs revised in 2024: 180, 425, 930, 1025, 1250; Karnataka and Gujarat charge from exactly Rs 25,000 and Rs 12,000).

   professionalTax[state]:
     { period: 'monthly' | 'half' | 'year', slabs: [ { upto: <monthly gross upper limit, null = no limit>, amt: <amount for the period>,
       feb: <amount in February instead>, mar: <amount in March instead> } ] }
     []   = the state has no professional tax
     null = not tabulated here: the user types the amount from the state schedule */
window.SLIP_RULES = {
  checked: '2026-10-04',
  pf: { rate: 0.12, employerRate: 0.12, wageCeiling: 15000 },
  esi: { employeeRate: 0.0075, employerRate: 0.0325, grossLimit: 21000 },

  /* state codes shown in the picker, in this order */
  states: ['MH', 'KA', 'WB', 'TN', 'GJ', 'AP', 'TS', 'MP', 'OD', 'KL', 'BR', 'DL', 'UP', 'RJ', 'HR', 'PB', 'UK', 'HP', 'JK', 'GA', 'CG', 'JH', 'AS', 'TR', 'ML', 'MN', 'MZ', 'NL', 'SK', 'PY', 'other'],

  professionalTax: {
    MH: { period: 'monthly', slabs: [{ upto: 7500, amt: 0 }, { upto: 10000, amt: 175 }, { upto: null, amt: 200, feb: 300 }] },
    KA: { period: 'monthly', slabs: [{ upto: 24999, amt: 0 }, { upto: null, amt: 200, feb: 300 }] },
    WB: { period: 'monthly', slabs: [{ upto: 10000, amt: 0 }, { upto: 15000, amt: 110 }, { upto: 25000, amt: 130 }, { upto: 40000, amt: 150 }, { upto: null, amt: 200 }] },
    TN: { period: 'half', slabs: [{ upto: 3500, amt: 0 }, { upto: 5000, amt: 180 }, { upto: 7500, amt: 425 }, { upto: 10000, amt: 930 }, { upto: 12500, amt: 1025 }, { upto: null, amt: 1250 }] },
    GJ: { period: 'monthly', slabs: [{ upto: 11999, amt: 0 }, { upto: null, amt: 200 }] },
    AP: { period: 'monthly', slabs: [{ upto: 15000, amt: 0 }, { upto: 20000, amt: 150 }, { upto: null, amt: 200 }] },
    TS: { period: 'monthly', slabs: [{ upto: 15000, amt: 0 }, { upto: 20000, amt: 150 }, { upto: null, amt: 200 }] },
    MP: { period: 'monthly', slabs: [{ upto: 18750, amt: 0 }, { upto: 25000, amt: 125 }, { upto: 33333, amt: 166, mar: 174 }, { upto: null, amt: 208, mar: 212 }] },
    OD: [],
    KL: { period: 'half', slabs: [{ upto: 1999, amt: 0 }, { upto: 2999, amt: 120 }, { upto: 4999, amt: 180 }, { upto: 7499, amt: 300 }, { upto: 9999, amt: 450 }, { upto: 12499, amt: 600 }, { upto: 16666, amt: 750 }, { upto: 20833, amt: 1000 }, { upto: null, amt: 1250 }] },
    BR: { period: 'year', slabs: [{ upto: 25000, amt: 0 }, { upto: 41666, amt: 1000 }, { upto: 83333, amt: 2000 }, { upto: null, amt: 2500 }] },
    /* no professional tax */
    DL: [], UP: [], RJ: [], HR: [], UK: [], HP: [], JK: [], GA: [],
    /* not tabulated here: type the amount from the state schedule */
    PB: null, CG: null, JH: null, AS: null, TR: null, ML: null, MN: null, MZ: null, NL: null, SK: null, PY: null, other: null
  }
};
