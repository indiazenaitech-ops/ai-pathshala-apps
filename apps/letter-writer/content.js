/* Letter text for all 12 languages: same shape in each. [[male|female]] = writer's grammatical gender; {key} = form value. */
window.APP_CONTENT = {};
window.APP_CONTENT.en = {
  fmt: {
    from: 'From:', to: 'To,', date: 'Date:', subject: 'Subject:',
    sal_resp: 'Respected Sir/Madam,', sal_dear: 'Dear Sir/Madam,', thanks: 'Thanking you,',
    close_student: 'Yours obediently,', close_faithful: 'Yours faithfully,', close_sincere: 'Yours sincerely,',
    place: 'Place:', encl: 'Enclosures:', exam_hall: 'Examination Hall',
    day_one: '1 day', day_n: '{n} days',
    sig_mobile: 'Mobile: {phone}', sig_class: 'Class: {class_sec}', sig_work: '{emp_desig}, {dept}',
    sig_emp: 'Employee ID: {emp_id}', sig_consumer: 'Consumer No.: {consumer_no}', sig_flat: 'Flat No.: {flat_no}'
  },
  sample: {
    name: 'Riya Sharma', address: '12, Shanti Nagar\nIndore – 452010', phone: '98765 43210', place: 'Indore',
    class_sec: '8-B', adm_no: '2019/1452', acct4: '4821', emp_desig: 'Accounts Assistant', dept: 'Accounts Department', emp_id: 'ST-1047'
  },
  tpl: {
    sick_leave: {
      subject: 'Application for sick leave',
      body: [
        'Most respectfully, I wish to inform you that I am a student of Class {class_sec} in your school. I have been suffering from {illness} since {from_date}, and the doctor has advised me to rest at home.',
        'Therefore, I request you kindly to grant me leave for {days}, from {from_date} to {to_date}. I will complete the work I miss as soon as I return.'
      ],
      ex: { to_desig: 'The Principal', to_org: 'Government Higher Secondary School', to_addr: 'Vijay Nagar, Indore', illness: 'high fever and a bad cold' },
      encl: 'Medical certificate',
      tips: ['Attach a doctor\'s note or medical certificate if the leave is for more than 2 or 3 days.', 'Many schools also want a parent\'s signature: leave some space for it below yours.']
    },
    family_leave: {
      subject: 'Application for leave to attend a family function',
      body: [
        'Most respectfully, I wish to inform you that I am a student of Class {class_sec} in your school. My family has to attend {occasion}, and I have to be there with them.',
        'Kindly grant me leave for {days}, from {from_date} to {to_date}. I promise to cover the missed lessons with the help of my classmates.'
      ],
      ex: { to_desig: 'The Principal', to_org: 'Government Higher Secondary School', to_addr: 'Vijay Nagar, Indore', occasion: 'my elder sister\'s wedding in Ujjain' },
      encl: '',
      tips: ['Apply a few days in advance so that your class teacher can plan.', 'If the function falls during exams, also ask about the rules for a make-up test.']
    },
    fee_concession: {
      subject: 'Request for fee concession',
      body: [
        'Most respectfully, I wish to state that I am a student of Class {class_sec} in your school. My father, {guardian}, is {guardian_job}. {situation}',
        'It has become very difficult for my family to pay my school fee. I have always worked hard in my studies and want to continue them. Kindly grant me a full or partial fee concession. I shall be very grateful to you.'
      ],
      ex: { to_desig: 'The Principal', to_org: 'Government Higher Secondary School', to_addr: 'Vijay Nagar, Indore', guardian: 'Shri Ramesh Sharma', guardian_job: 'a daily-wage worker', situation: 'His income is very low and there are five members in our family.' },
      encl: 'Income certificate of my parent',
      tips: ['Attach an income certificate (from the tehsil or revenue office) or a copy of the ration card, if you have one.', 'Also ask the school office about government scholarships: many states have them for school students.']
    },
    tc_request: {
      subject: 'Application for Transfer Certificate (TC)',
      body: [
        'Most respectfully, I wish to state that I am a student of Class {class_sec} (Admission No. {adm_no}) in your school. {reason}, so I have to leave this school.',
        'Kindly issue my Transfer Certificate and other school documents at the earliest so that I can take admission in a new school. I will clear any pending dues before collecting them.'
      ],
      ex: { to_desig: 'The Principal', to_org: 'Government Higher Secondary School', to_addr: 'Vijay Nagar, Indore', reason: 'My father has been transferred to Bhopal and our family is moving there' },
      encl: '',
      tips: ['Return library books and clear any pending fee first: schools usually check this before issuing a TC.', 'Ask for your mark sheet and character certificate at the same time.']
    },
    bonafide: {
      subject: 'Request for a bonafide certificate',
      body: [
        'Most respectfully, I wish to state that I am a bonafide student of Class {class_sec} (Admission No. {adm_no}) in your school. I need a bonafide certificate for {purpose}.',
        'Kindly issue the certificate at the earliest. I shall be thankful to you.'
      ],
      ex: { to_desig: 'The Principal', to_org: 'Government Higher Secondary School', to_addr: 'Vijay Nagar, Indore', purpose: 'a scholarship application' },
      encl: '',
      tips: ['Write the exact purpose (scholarship, bank account, passport, bus pass): some offices need it printed on the certificate.', 'Keep a photocopy of your school ID card ready in case the office asks for it.']
    },
    apology: {
      subject: 'Letter of apology',
      body: [
        'Most respectfully, I am a student of Class {class_sec} in your school. On {incident_date}, {mistake}. I realise that it was wrong, and I am truly sorry for it.',
        'I assure you that this will not happen again and that I will follow the school rules carefully. Kindly forgive me this time.'
      ],
      ex: { to_desig: 'The Principal', to_org: 'Government Higher Secondary School', to_addr: 'Vijay Nagar, Indore', mistake: 'I talked loudly and disturbed the class during the Science period' },
      encl: '',
      tips: ['Be honest and short: say what happened, say sorry, and say what you will do differently.', 'Give it to your teacher or principal in person.']
    },
    mobile_change: {
      subject: 'Request to change the registered mobile number in my account',
      body: [
        'I hold a savings account in your branch, with account number ending in {acct4}. The mobile number registered with this account is {old_mobile}, which I no longer use.',
        'Kindly update my registered mobile number to {new_mobile}, so that I receive SMS alerts and OTPs on it. A copy of my ID proof is attached for verification.'
      ],
      ex: { to_desig: 'The Branch Manager', to_org: 'State Bank of India', to_addr: 'Vijay Nagar Branch, Indore', old_mobile: '98260 12345', new_mobile: '98765 43210' },
      encl: 'Self-attested copy of ID proof',
      tips: ['Most banks ask you to come to the branch with your original ID proof; some also let you change the number at an ATM or through net banking.', 'Write only the last 4 digits of your account number. Never share an OTP, PIN or full card number with anyone.']
    },
    kyc_update: {
      subject: 'Request to update my address and KYC',
      body: [
        'I hold a savings account in your branch, with account number ending in {acct4}. I have moved to a new address and request you to update it in my account records.',
        'My new address is: {new_address}. I am enclosing self-attested copies of my KYC documents. Kindly update my KYC details at the earliest.'
      ],
      ex: { to_desig: 'The Branch Manager', to_org: 'State Bank of India', to_addr: 'Vijay Nagar Branch, Indore', new_address: '45, Saket Nagar, Indore – 452018' },
      encl: 'Self-attested copy of address proof\nSelf-attested copy of PAN card\nOne recent passport-size photograph',
      tips: ['Common address proofs are Aadhaar, passport, voter ID or driving licence. On an Aadhaar copy you can hide (mask) the first 8 digits.', 'Carry the original documents to the branch for verification.']
    },
    cheque_book: {
      subject: 'Request for a new cheque book',
      body: [
        'I hold a savings account in your branch, with account number ending in {acct4}. My present cheque book is almost used up.',
        'Kindly issue me a new cheque book with {leaves} leaves and send it to my registered address. I shall be grateful to you.'
      ],
      ex: { to_desig: 'The Branch Manager', to_org: 'State Bank of India', to_addr: 'Vijay Nagar Branch, Indore', leaves: '25' },
      encl: '',
      tips: ['You can usually also ask for a cheque book through net banking, the bank\'s app or an ATM.', 'Check that your registered address is correct, because the cheque book is sent there.']
    },
    card_block: {
      subject: 'Request to block my lost ATM/debit card',
      body: [
        'I hold a savings account in your branch, with account number ending in {acct4}. On {lost_date}, I lost my ATM/debit card (card number ending in {card4}) {lost_place}.',
        'Kindly block this card immediately so that nobody can misuse it, and issue me a new card. Please also tell me if any transaction was made with it after {lost_date}.'
      ],
      ex: { to_desig: 'The Branch Manager', to_org: 'State Bank of India', to_addr: 'Vijay Nagar Branch, Indore', card4: '7302', lost_place: 'near Rajwada market' },
      encl: '',
      tips: ['First block the card at once through the bank\'s 24x7 helpline or app; then give this letter for the record.', 'If money was taken from your account, also call the cyber crime helpline 1930 or report it at cybercrime.gov.in.']
    },
    account_close: {
      subject: 'Request to close my savings account',
      body: [
        'I hold a savings account in your branch, with account number ending in {acct4}. {reason}, so I wish to close this account.',
        'Kindly close the account and pay me the remaining balance. I am returning the unused cheque leaves and my debit card with this letter.'
      ],
      ex: { to_desig: 'The Branch Manager', to_org: 'State Bank of India', to_addr: 'Vijay Nagar Branch, Indore', reason: 'I have shifted to another city' },
      encl: 'Unused cheque leaves\nDebit card (cut into two)\nPassbook',
      tips: ['Banks usually have an account closure form: ask for it and attach this letter.', 'Before closing, move any auto-debits (EMI, SIP, insurance) and your UPI link to another account.']
    },
    statement: {
      subject: 'Request for account statement',
      body: [
        'I hold a savings account in your branch, with account number ending in {acct4}. I need my account statement from {from_date} to {to_date} for {purpose}.',
        'Kindly issue the statement, signed and stamped by the bank. I shall be thankful to you.'
      ],
      ex: { to_desig: 'The Branch Manager', to_org: 'State Bank of India', to_addr: 'Vijay Nagar Branch, Indore', purpose: 'a loan application' },
      encl: '',
      tips: ['You can usually download a statement from net banking or the app; ask for a signed and stamped copy if an office needs one.', 'Some banks charge a small fee for a printed statement.']
    },
    work_leave: {
      subject: 'Leave application for {days}',
      body: [
        'I am working as {emp_desig} in the {dept}. {reason}, so I request leave for {days}, from {from_date} to {to_date}.',
        'I will finish my pending work before I go and hand over urgent tasks to a colleague. If needed, I can be reached on my mobile number {phone}.'
      ],
      ex: { to_desig: 'The HR Manager', to_org: 'Sunrise Textiles Pvt. Ltd.', to_addr: 'Sector 3, Pithampur', reason: 'I have to attend to an urgent family matter in my hometown' },
      encl: '',
      tips: ['Check your leave balance and your company\'s leave policy first.', 'If your office uses email or an HR app, send the same request there too.']
    },
    wfh: {
      subject: 'Request to work from home',
      body: [
        'I am working as {emp_desig} in the {dept}. {reason}, so I request permission to work from home from {from_date} to {to_date}.',
        'I will be available online during office hours, attend all meetings and finish my work on time. I can come to the office whenever there is an urgent need.'
      ],
      ex: { to_desig: 'The HR Manager', to_org: 'Sunrise Textiles Pvt. Ltd.', to_addr: 'Sector 3, Pithampur', reason: 'I need to look after my mother after her surgery' },
      encl: '',
      tips: ['Say how you will stay reachable (phone, email, office chat) and that your work will not suffer.', 'Ask for the approval in writing or by email, and keep it.']
    },
    resignation: {
      subject: 'Resignation from the post of {emp_desig}',
      body: [
        'Please accept this letter as formal notice of my resignation from the post of {emp_desig} in the {dept}. {reason}. As per my notice period, my last working day will be {last_day}.',
        'I am thankful for the support and learning I received here. I will hand over my work smoothly before I leave.'
      ],
      ex: { to_desig: 'The HR Manager', to_org: 'Sunrise Textiles Pvt. Ltd.', to_addr: 'Sector 3, Pithampur', reason: 'I have received an opportunity for further growth' },
      encl: '',
      tips: ['Check the notice period in your appointment letter: serving it helps you get a clean relieving letter.', 'Ask about your full and final settlement, PF transfer and Form 16 before your last day.']
    },
    experience_letter: {
      subject: 'Request for experience certificate and relieving letter',
      body: [
        'I worked in your organisation as {emp_desig} in the {dept} (Employee ID: {emp_id}) from {join_date} to {last_day}.',
        'Kindly issue my experience certificate and relieving letter at the earliest, as I need them for my new job. I shall be grateful to you.'
      ],
      ex: { to_desig: 'The HR Manager', to_org: 'Sunrise Textiles Pvt. Ltd.', to_addr: 'Sector 3, Pithampur' },
      encl: '',
      tips: ['Check that your designation and dates are correct in the letter you receive.', 'If the company does not reply, send this letter by email too and keep a copy.']
    },
    electricity: {
      subject: 'Complaint about the electricity supply in our area',
      body: [
        'I live at {address}, and my electricity consumer number is {consumer_no}. I wish to bring to your notice that since {since_date}, {problem}.',
        'This is causing great difficulty to the residents, especially students and elderly people. Kindly look into the matter and get it repaired at the earliest.'
      ],
      ex: { to_desig: 'The Assistant Engineer', to_org: 'Electricity Distribution Office', to_addr: 'Zone 4, Indore', consumer_no: 'N-4523781', problem: 'there have been frequent power cuts and very low voltage, and home appliances are getting damaged' },
      encl: '',
      tips: ['Also register the complaint on your electricity company\'s helpline or app, and write the complaint number in the letter.', 'Keep a copy of the letter with the office\'s "received" stamp and date.']
    },
    water: {
      subject: 'Complaint about the water supply',
      body: [
        'I live at {address}. I wish to bring to your notice that since {since_date}, {problem}.',
        'The residents are facing great difficulty, and dirty water can spread illness. Kindly get the supply checked and repaired at the earliest.'
      ],
      ex: { to_desig: 'The Executive Engineer', to_org: 'Water Works Department, Municipal Corporation', to_addr: 'Indore', problem: 'water comes for only a few minutes a day, and it is muddy' },
      encl: '',
      tips: ['Ask your neighbours to sign too: a joint complaint is usually acted on faster.', 'Many municipal bodies also take complaints on a helpline, app or WhatsApp number: note the complaint number.']
    },
    garbage: {
      subject: 'Complaint about garbage and cleanliness in our area',
      body: [
        'I wish to draw your attention to the poor cleanliness in {area}. For the past several days, {problem}.',
        'The bad smell and mosquitoes are a serious health risk for everyone. Kindly arrange regular garbage collection and cleaning of the area at the earliest.'
      ],
      ex: { to_desig: 'The Health Officer', to_org: 'Municipal Corporation', to_addr: 'Indore', area: 'Shanti Nagar, near the community hall', problem: 'garbage has not been collected and the drains are blocked' },
      encl: 'Photos of the garbage',
      tips: ['Attach dated photos of the problem if you can.', 'You can also complain on your city\'s municipal app or helpline, if there is one.']
    },
    society: {
      subject: 'Request to solve a problem in our society',
      body: [
        'I live in Flat No. {flat_no} in our society. I wish to bring to your notice that {problem}.',
        'This is causing difficulty to all residents, especially elderly people and children. Kindly take up the matter in the managing committee and get it solved at the earliest.'
      ],
      ex: { to_desig: 'The Secretary', to_org: 'Shanti Co-operative Housing Society', to_addr: 'Vijay Nagar, Indore', flat_no: 'B-204', problem: 'the lift in B-wing has not been working for a week' },
      encl: '',
      tips: ['Give the letter at the society office and ask for a signed copy, or write it in the complaint register.', 'Suggest a solution or a date: it helps the committee act faster.']
    },
    refund: {
      subject: 'Request for replacement or refund of a defective product',
      body: [
        'I bought a {product} from you on {buy_date} for ₹{price} (Bill/Order No. {order_no}). Unfortunately, {defect}.',
        'The product is under warranty. Kindly {remedy} within 15 days. If the matter is not solved, I will have to approach the consumer commission.'
      ],
      ex: { to_desig: 'The Customer Care Manager', to_org: 'Sunrise Electronics', to_addr: 'MG Road, Indore', product: 'mixer grinder (model MG-500)', order_no: 'INV-20871', price: '3,499', defect: 'its motor stopped working within ten days', remedy: 'replace it with a new piece or refund the full amount' },
      encl: 'Copy of the bill\nCopy of the warranty card\nPhotos of the defect',
      tips: ['Keep the bill, warranty card and box. Complain in writing and keep copies.', 'If the seller does not help, call the National Consumer Helpline 1915 or complain at consumerhelpline.gov.in.']
    },
    rti: {
      subject: 'Application for information under the Right to Information Act, 2005',
      body: [
        'Under Section 6(1) of the Right to Information Act, 2005, I request you to provide the following information:',
        '{info}',
        'Period of the information: {period}.',
        'I have paid the application fee by {fee_mode}. I am a citizen of India. If this information is held by another public authority, kindly transfer my application to it under Section 6(3) of the Act.'
      ],
      ex: { to_desig: 'The Public Information Officer', to_org: 'Office of the Municipal Corporation', to_addr: 'Indore', info: '1. Status of the repair of the road in Shanti Nagar, Ward No. 12.\n2. Amount sanctioned and amount spent on this work.\n3. Copies of the work order and the completion certificate.', period: '1 April 2025 to 31 March 2026', fee_mode: 'Indian Postal Order of ₹10 (No. ________)' },
      encl: 'Indian Postal Order for the application fee',
      tips: ['For Central Government offices the fee is ₹10 (RTI Rules, 2012): cash with a receipt, demand draft, banker\'s cheque or Indian Postal Order, or online at rtionline.gov.in. Each state has its own rules and fee, so check your state\'s rules.', 'People below the poverty line (BPL) pay no fee: attach a copy of the BPL certificate.', 'The reply is due within 30 days. If you get no reply or are not satisfied, you can file a first appeal within 30 days.']
    }
  }
};
