/* Salary & Income Tax Calculator: every rule and number for Tax Year 2026-27.
   Next year, only this file changes (copy it to RULES_2027_28 and update the numbers).
   Sources checked on 2026-10-04: Income-tax Act, 2025 (in force from 1 April 2026), Union Budget 2026
   (no change to slabs, rebate or standard deduction), Income-tax Rules, 2026 (notified 20 March 2026:
   HRA 50% cities now include Bengaluru, Hyderabad, Pune and Ahmedabad), state professional-tax schedules
   (Karnataka Rs 200 x 11 + Rs 300 in February from 1 April 2025; Odisha repealed professional tax from 1 April 2026).
   Slabs are [upper limit of the slab in Rs, rate]; null = no upper limit. */
window.RULES_2026_27 = {
  taxYear: '2026-27',
  from: '2026-04-01',
  to: '2027-03-31',
  checked: '2026-10-04',
  cess: 0.04,                 // health & education cess on tax + surcharge
  roundTo: 10,                // total income and tax are rounded to the nearest Rs 10

  newRegime: {                // section 202 of the Income-tax Act, 2025 (was section 115BAC)
    section: '202', was: '115BAC',
    slabs: [[400000, 0], [800000, 0.05], [1200000, 0.10], [1600000, 0.15], [2000000, 0.20], [2400000, 0.25], [null, 0.30]],
    standardDeduction: 75000,
    rebate: { section: '156', was: '87A', incomeLimit: 1200000, max: 60000, marginalRelief: true },
    surcharge: [[5000000, 0.10], [10000000, 0.15], [20000000, 0.25]],   // capped at 25%
    employerNpsLimit: 0.14,   // employer NPS deductible up to 14% of basic + DA
    professionalTaxDeduction: false
  },

  oldRegime: {
    slabs: {
      below60: [[250000, 0], [500000, 0.05], [1000000, 0.20], [null, 0.30]],
      age60:   [[300000, 0], [500000, 0.05], [1000000, 0.20], [null, 0.30]],
      age80:   [[500000, 0], [1000000, 0.20], [null, 0.30]]
    },
    standardDeduction: 50000,
    rebate: { section: '156', was: '87A', incomeLimit: 500000, max: 12500, marginalRelief: false },
    surcharge: [[5000000, 0.10], [10000000, 0.15], [20000000, 0.25], [50000000, 0.37]],
    employerNpsLimit: 0.10,
    professionalTaxDeduction: true,
    professionalTaxMax: 2500,
    limits: {
      sec80C: 150000,               // includes your own PF
      sec80DSelf: 25000, sec80DSelfSenior: 50000,
      sec80DParents: 25000, sec80DParentsSenior: 50000,
      sec80CCD1B: 50000,            // own NPS, over and above 80C
      homeLoanInterest: 200000      // self-occupied house
    },
    hraExemption: { metro: 0.50, other: 0.40, rentMinusBasic: 0.10 }   // least of: HRA, rent - 10% basic, 50/40% basic
  },

  salary: {
    pfRate: 0.12,                   // employee and employer EPF, each
    pfWageCeilingMonthly: 15000,    // optional cap: 12% of Rs 15,000 = Rs 1,800 a month
    gratuityRate: 0.0481,           // 15/26 of a month's basic per year
    employerRetirementCap: 750000,  // employer PF + NPS above this is taxable
    basicPresets: [40, 50],
    hraOfBasic: { metro: 50, other: 40 }
  },

  /* Cities where HRA exemption is 50% of basic (Income-tax Rules, 2026). */
  metroCities: ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bengaluru', 'Hyderabad', 'Pune', 'Ahmedabad'],

  /* Professional tax: [monthly gross pay from (Rs), tax for the year (Rs)], highest matching row wins.
     Empty list = no professional tax. Values are the usual payroll amounts; the field stays editable. */
  professionalTax: {
    AP: [[15001, 1800], [20001, 2400]],
    AS: [[10001, 1800], [15001, 2160], [25001, 2500]],
    BR: [[25001, 1000], [41667, 2000], [83334, 2500]],
    CG: [],
    DL: [],
    GA: [],
    GJ: [[12000, 2400]],
    HR: [],
    HP: [],
    JK: [],
    JH: [[25001, 1200], [41667, 1800], [66667, 2100], [83334, 2500]],
    KA: [[25000, 2500]],
    KL: [[2000, 240], [3000, 360], [5000, 600], [7500, 900], [10000, 1200], [12500, 1500], [16667, 2000], [20834, 2500]],
    MP: [[18751, 1500], [25001, 2000], [33334, 2500]],
    MH: [[7501, 2100], [10001, 2500]],
    MN: [[4167, 1200], [6251, 2000], [8334, 2400], [10417, 2500]],
    ML: [[25001, 2500]],
    MZ: [[5001, 900], [8001, 1440], [10001, 1800], [12001, 2160], [15001, 2340], [20001, 2500]],
    NL: [[4001, 420], [5001, 900], [7001, 1320], [9001, 2160], [12001, 2500]],
    OD: [],
    PY: [[16667, 500], [33334, 1000], [50001, 1500], [66667, 2000], [83334, 2500]],
    PB: [[25001, 2400]],
    RJ: [],
    SK: [[20001, 1500], [30001, 1800], [40001, 2400]],
    TN: [[3501, 270], [5001, 630], [7501, 1380], [10001, 2050], [12501, 2500]],
    TS: [[15001, 1800], [20001, 2400]],
    TR: [[7501, 1800], [15001, 2500]],
    UP: [],
    UK: [],
    WB: [[10001, 1320], [15001, 1560], [25001, 1800], [40001, 2400]],
    other: []
  }
};
