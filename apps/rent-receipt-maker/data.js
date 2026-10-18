/* Rent Receipt Maker: every rule and number in ONE place. Checked on 2026-10-17 for Tax Year 2026-27.
   General information, not tax advice. When a rule changes, edit this file and the "checked" date.

   Sources checked (October 2026):
   - Income-tax Act, 2025 (in force from 1 April 2026): HRA exemption is in Schedule III (earlier section 10(13A) of the
     1961 Act) and is available only in the regular (old) regime; it is not allowed in the default regime of section 202.
   - Income-tax Rules, 2026 (notified by CBDT on 20 March 2026), rule 279 (earlier rule 2A): exemption = least of
     (a) HRA received, (b) rent paid minus 10% of salary, (c) 50% of salary in Mumbai, Kolkata, Delhi, Chennai,
     Hyderabad, Pune, Ahmedabad and Bengaluru, 40% elsewhere. Salary = basic + DA (if it counts for retirement
     benefits) + commission at a fixed % of turnover. Up to 2025-26 only the first four cities had 50%.
   - Form 124 (replaces Form 12BB from 1 April 2026): landlord name, address, PAN when the rent for the year is more
     than Rs 1,00,000 (unchanged from CBDT Circular 8/2013), and the employee's relationship with the landlord.
   - Indian Stamp Act, 1899, Schedule I, Article 53: a receipt for money above Rs 5,000 needs a Re 1 stamp
     (rates for receipts are set by Parliament, so they are the same in every state). Receipts for UPI, bank
     transfer or cheque payments are usually given without one. */
window.RENT_RULES = {
  checked: '2026-10-17',
  rulesYear: 2026,              // Tax Year 2026-27: the year these notes describe
  notified: '2026-03-20',       // Income-tax Rules, 2026
  panLimit: 100000,             // landlord PAN needed when the rent for the year is MORE than this
  stampLimit: 5000,             // revenue stamp on a cash receipt for MORE than this
  stampValue: 1,                // Re 1 (Article 53)
  hra: { metro: 0.5, other: 0.4, rentShare: 0.1 },
  /* cities where HRA is 50% of salary; the year is the first tax year (April) from which the city counts */
  metro: { delhi: 1962, mumbai: 1962, kolkata: 1962, chennai: 1962, bengaluru: 2026, hyderabad: 2026, pune: 2026, ahmedabad: 2026 },
  cities: ['delhi', 'mumbai', 'kolkata', 'chennai', 'bengaluru', 'hyderabad', 'pune', 'ahmedabad', 'other']
};
