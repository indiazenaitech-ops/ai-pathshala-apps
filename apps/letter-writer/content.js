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
window.APP_CONTENT.hi = {
  fmt: {
    from: 'प्रेषक:', to: 'सेवा में,', date: 'दिनांक:', subject: 'विषय:',
    sal_resp: 'आदरणीय महोदय/महोदया,', sal_dear: 'महोदय/महोदया,', thanks: 'सधन्यवाद,',
    close_student: '[[आपका आज्ञाकारी शिष्य|आपकी आज्ञाकारी शिष्या]],', close_faithful: '[[भवदीय|भवदीया]],', close_sincere: '[[भवदीय|भवदीया]],',
    place: 'स्थान:', encl: 'संलग्न:', exam_hall: 'परीक्षा भवन',
    day_one: '1 दिन', day_n: '{n} दिन',
    sig_mobile: 'मोबाइल: {phone}', sig_class: 'कक्षा: {class_sec}', sig_work: '{emp_desig}, {dept}',
    sig_emp: 'कर्मचारी ID: {emp_id}', sig_consumer: 'उपभोक्ता क्रमांक: {consumer_no}', sig_flat: 'फ़्लैट नंबर: {flat_no}'
  },
  sample: {
    name: 'रिया शर्मा', address: '12, शांति नगर\nइंदौर – 452010', phone: '98765 43210', place: 'इंदौर',
    class_sec: '8-ब', adm_no: '2019/1452', acct4: '4821', emp_desig: 'लेखा सहायक', dept: 'लेखा विभाग', emp_id: 'ST-1047'
  },
  tpl: {
    sick_leave: {
      subject: 'बीमारी के कारण अवकाश हेतु प्रार्थना-पत्र',
      body: [
        'सविनय निवेदन है कि मैं आपके विद्यालय की कक्षा {class_sec} [[का छात्र|की छात्रा]] हूँ। मैं {from_date} से {illness} से पीड़ित हूँ और डॉक्टर ने मुझे घर पर आराम करने की सलाह दी है।',
        'अतः आपसे प्रार्थना है कि मुझे {from_date} से {to_date} तक {days} का अवकाश देने की कृपा करें। लौटने पर मैं छूटा हुआ सारा काम पूरा कर [[लूँगा|लूँगी]]।'
      ],
      ex: { to_desig: 'प्रधानाचार्य महोदय/महोदया', to_org: 'शासकीय उच्चतर माध्यमिक विद्यालय', to_addr: 'विजय नगर, इंदौर', illness: 'तेज़ बुखार और सर्दी-ज़ुकाम' },
      encl: 'डॉक्टर का प्रमाण-पत्र',
      tips: ['2-3 दिन से ज़्यादा की छुट्टी हो तो डॉक्टर की पर्ची या मेडिकल सर्टिफ़िकेट साथ लगाएँ।', 'कई स्कूल माता-पिता के हस्ताक्षर भी माँगते हैं: अपने नाम के नीचे उनके लिए जगह छोड़ें।']
    },
    family_leave: {
      subject: 'पारिवारिक समारोह में जाने हेतु अवकाश के लिए प्रार्थना-पत्र',
      body: [
        'सविनय निवेदन है कि मैं आपके विद्यालय की कक्षा {class_sec} [[का छात्र|की छात्रा]] हूँ। मेरे परिवार को {occasion} में जाना है और मेरा वहाँ होना ज़रूरी है।',
        'अतः मुझे {from_date} से {to_date} तक {days} का अवकाश देने की कृपा करें। छूटी हुई पढ़ाई मैं अपने सहपाठियों की मदद से पूरी कर [[लूँगा|लूँगी]]।'
      ],
      ex: { to_desig: 'प्रधानाचार्य महोदय/महोदया', to_org: 'शासकीय उच्चतर माध्यमिक विद्यालय', to_addr: 'विजय नगर, इंदौर', occasion: 'उज्जैन में मेरी बड़ी बहन के विवाह' },
      encl: '',
      tips: ['कुछ दिन पहले ही आवेदन दें, ताकि कक्षा अध्यापक योजना बना सकें।', 'अगर समारोह परीक्षा के दिनों में है, तो बाद में परीक्षा देने के नियम भी पूछ लें।']
    },
    fee_concession: {
      subject: 'शुल्क में छूट हेतु प्रार्थना-पत्र',
      body: [
        'सविनय निवेदन है कि मैं आपके विद्यालय की कक्षा {class_sec} [[का छात्र|की छात्रा]] हूँ। मेरे पिताजी, {guardian}, {guardian_job} हैं। {situation}',
        'मेरे परिवार के लिए मेरी स्कूल फ़ीस भरना बहुत कठिन हो गया है। मैं हमेशा मन लगाकर [[पढ़ता आया|पढ़ती आई]] हूँ और आगे भी पढ़ाई जारी रखना [[चाहता|चाहती]] हूँ। अतः मुझे पूरी या आंशिक फ़ीस माफ़ी देने की कृपा करें। मैं सदा आपका [[आभारी रहूँगा|आभारी रहूँगी]]।'
      ],
      ex: { to_desig: 'प्रधानाचार्य महोदय/महोदया', to_org: 'शासकीय उच्चतर माध्यमिक विद्यालय', to_addr: 'विजय नगर, इंदौर', guardian: 'श्री रमेश शर्मा', guardian_job: 'दिहाड़ी मज़दूर', situation: 'उनकी आय बहुत कम है और हमारे परिवार में पाँच सदस्य हैं।' },
      encl: 'माता-पिता का आय प्रमाण-पत्र',
      tips: ['आय प्रमाण-पत्र (तहसील से) या राशन कार्ड की कॉपी हो तो साथ लगाएँ।', 'स्कूल कार्यालय से सरकारी छात्रवृत्ति के बारे में भी पूछें: कई राज्यों में स्कूली बच्चों के लिए छात्रवृत्तियाँ हैं।']
    },
    tc_request: {
      subject: 'स्थानांतरण प्रमाण-पत्र (TC) हेतु प्रार्थना-पत्र',
      body: [
        'सविनय निवेदन है कि मैं आपके विद्यालय की कक्षा {class_sec} [[का छात्र|की छात्रा]] हूँ (प्रवेश संख्या {adm_no})। {reason}, इसलिए मुझे यह विद्यालय छोड़ना पड़ रहा है।',
        'अतः मुझे स्थानांतरण प्रमाण-पत्र और विद्यालय के अन्य कागज़ात जल्द से जल्द देने की कृपा करें, ताकि मैं नए विद्यालय में प्रवेश ले सकूँ। प्रमाण-पत्र लेने से पहले मैं सभी बकाया शुल्क जमा कर [[दूँगा|दूँगी]]।'
      ],
      ex: { to_desig: 'प्रधानाचार्य महोदय/महोदया', to_org: 'शासकीय उच्चतर माध्यमिक विद्यालय', to_addr: 'विजय नगर, इंदौर', reason: 'मेरे पिताजी का तबादला भोपाल हो गया है और हमारा परिवार वहाँ जा रहा है' },
      encl: '',
      tips: ['पहले लाइब्रेरी की किताबें लौटाएँ और बकाया फ़ीस जमा करें: TC देने से पहले स्कूल यह जाँचता है।', 'साथ ही अंकसूची और चरित्र प्रमाण-पत्र भी माँग लें।']
    },
    bonafide: {
      subject: 'बोनाफ़ाइड (वास्तविक छात्र) प्रमाण-पत्र हेतु प्रार्थना-पत्र',
      body: [
        'सविनय निवेदन है कि मैं आपके विद्यालय की कक्षा {class_sec} [[का नियमित छात्र|की नियमित छात्रा]] हूँ (प्रवेश संख्या {adm_no})। मुझे {purpose} के लिए बोनाफ़ाइड प्रमाण-पत्र की आवश्यकता है।',
        'अतः मुझे यह प्रमाण-पत्र जल्द से जल्द देने की कृपा करें। मैं आपका [[आभारी रहूँगा|आभारी रहूँगी]]।'
      ],
      ex: { to_desig: 'प्रधानाचार्य महोदय/महोदया', to_org: 'शासकीय उच्चतर माध्यमिक विद्यालय', to_addr: 'विजय नगर, इंदौर', purpose: 'छात्रवृत्ति के आवेदन' },
      encl: '',
      tips: ['सही काम लिखें (छात्रवृत्ति, बैंक खाता, पासपोर्ट, बस पास): कुछ दफ़्तरों को यह प्रमाण-पत्र पर लिखा चाहिए।', 'स्कूल पहचान-पत्र की फ़ोटोकॉपी तैयार रखें, कार्यालय माँग सकता है।']
    },
    apology: {
      subject: 'क्षमा-याचना पत्र',
      body: [
        'सविनय निवेदन है कि मैं आपके विद्यालय की कक्षा {class_sec} [[का छात्र|की छात्रा]] हूँ। {incident_date} को {mistake}। मुझे एहसास है कि यह गलत था और इसके लिए मैं सच्चे मन से क्षमा [[माँगता|माँगती]] हूँ।',
        'मैं आपको विश्वास [[दिलाता|दिलाती]] हूँ कि आगे से ऐसा नहीं होगा और मैं विद्यालय के नियमों का ध्यान से पालन [[करूँगा|करूँगी]]। कृपया इस बार मुझे क्षमा कर दें।'
      ],
      ex: { to_desig: 'प्रधानाचार्य महोदय/महोदया', to_org: 'शासकीय उच्चतर माध्यमिक विद्यालय', to_addr: 'विजय नगर, इंदौर', mistake: 'विज्ञान के पीरियड में मैंने ज़ोर से बात करके कक्षा में बाधा डाली' },
      encl: '',
      tips: ['ईमानदारी से और छोटा लिखें: क्या हुआ, माफ़ी, और आगे आप क्या अलग करेंगे।', 'पत्र अपने अध्यापक या प्रधानाचार्य को खुद जाकर दें।']
    },
    mobile_change: {
      subject: 'खाते में पंजीकृत मोबाइल नंबर बदलने हेतु आवेदन',
      body: [
        'मेरा आपकी शाखा में बचत खाता है, जिसकी खाता संख्या के अंतिम चार अंक {acct4} हैं। इस खाते से जुड़ा मोबाइल नंबर {old_mobile} है, जिसे अब मैं इस्तेमाल नहीं [[करता|करती]]।',
        'कृपया मेरा पंजीकृत मोबाइल नंबर बदलकर {new_mobile} कर दें, ताकि मुझे SMS अलर्ट और OTP इसी नंबर पर मिलें। सत्यापन के लिए मेरे पहचान-पत्र की प्रति संलग्न है।'
      ],
      ex: { to_desig: 'शाखा प्रबंधक महोदय/महोदया', to_org: 'भारतीय स्टेट बैंक', to_addr: 'विजय नगर शाखा, इंदौर', old_mobile: '98260 12345', new_mobile: '98765 43210' },
      encl: 'पहचान-पत्र की स्व-प्रमाणित प्रति',
      tips: ['ज़्यादातर बैंक मूल पहचान-पत्र के साथ शाखा में आने को कहते हैं; कुछ बैंक ATM या नेट बैंकिंग से भी नंबर बदलने देते हैं।', 'खाता संख्या के सिर्फ़ आख़िरी 4 अंक लिखें। OTP, PIN या पूरा कार्ड नंबर कभी किसी को न बताएँ।']
    },
    kyc_update: {
      subject: 'खाते में पता / KYC अपडेट करने हेतु आवेदन',
      body: [
        'मेरा आपकी शाखा में बचत खाता है, जिसकी खाता संख्या के अंतिम चार अंक {acct4} हैं। मैं नए पते पर रहने [[आ गया|आ गई]] हूँ, कृपया इसे मेरे खाते के रिकॉर्ड में अपडेट करें।',
        'मेरा नया पता है: {new_address}। मैं अपने KYC दस्तावेज़ों की स्व-प्रमाणित प्रतियाँ संलग्न कर [[रहा|रही]] हूँ। कृपया मेरा KYC विवरण जल्द से जल्द अपडेट करें।'
      ],
      ex: { to_desig: 'शाखा प्रबंधक महोदय/महोदया', to_org: 'भारतीय स्टेट बैंक', to_addr: 'विजय नगर शाखा, इंदौर', new_address: '45, साकेत नगर, इंदौर – 452018' },
      encl: 'पते के प्रमाण की स्व-प्रमाणित प्रति\nPAN कार्ड की स्व-प्रमाणित प्रति\nएक हाल की पासपोर्ट साइज़ फ़ोटो',
      tips: ['पते के प्रमाण के लिए आम तौर पर आधार, पासपोर्ट, वोटर ID या ड्राइविंग लाइसेंस चलते हैं। आधार की कॉपी पर पहले 8 अंक छिपा (मास्क कर) सकते हैं।', 'जाँच के लिए मूल दस्तावेज़ शाखा में साथ ले जाएँ।']
    },
    cheque_book: {
      subject: 'नई चेक बुक जारी करने हेतु आवेदन',
      body: [
        'मेरा आपकी शाखा में बचत खाता है, जिसकी खाता संख्या के अंतिम चार अंक {acct4} हैं। मेरी मौजूदा चेक बुक लगभग खत्म हो गई है।',
        'कृपया मुझे {leaves} पन्नों की नई चेक बुक जारी करें और मेरे पंजीकृत पते पर भेज दें। मैं आपका [[आभारी रहूँगा|आभारी रहूँगी]]।'
      ],
      ex: { to_desig: 'शाखा प्रबंधक महोदय/महोदया', to_org: 'भारतीय स्टेट बैंक', to_addr: 'विजय नगर शाखा, इंदौर', leaves: '25' },
      encl: '',
      tips: ['चेक बुक आम तौर पर नेट बैंकिंग, बैंक ऐप या ATM से भी मँगाई जा सकती है।', 'देख लें कि बैंक में आपका पता सही है, क्योंकि चेक बुक वहीं भेजी जाती है।']
    },
    card_block: {
      subject: 'खोया हुआ ATM/डेबिट कार्ड बंद करने हेतु आवेदन',
      body: [
        'मेरा आपकी शाखा में बचत खाता है, जिसकी खाता संख्या के अंतिम चार अंक {acct4} हैं। {lost_date} को {lost_place} मेरा ATM/डेबिट कार्ड (कार्ड नंबर के अंतिम चार अंक {card4}) खो गया।',
        'कृपया इस कार्ड को तुरंत बंद (ब्लॉक) कर दें, ताकि कोई इसका गलत इस्तेमाल न कर सके, और मुझे नया कार्ड जारी करें। यह भी बताएँ कि {lost_date} के बाद इस कार्ड से कोई लेन-देन हुआ है या नहीं।'
      ],
      ex: { to_desig: 'शाखा प्रबंधक महोदय/महोदया', to_org: 'भारतीय स्टेट बैंक', to_addr: 'विजय नगर शाखा, इंदौर', card4: '7302', lost_place: 'राजवाड़ा बाज़ार के पास' },
      encl: '',
      tips: ['सबसे पहले बैंक की 24x7 हेल्पलाइन या ऐप से कार्ड तुरंत बंद कराएँ; फिर रिकॉर्ड के लिए यह पत्र दें।', 'अगर खाते से पैसे निकल गए हैं, तो साइबर क्राइम हेल्पलाइन 1930 पर कॉल करें या cybercrime.gov.in पर शिकायत करें।']
    },
    account_close: {
      subject: 'बचत खाता बंद करने हेतु आवेदन',
      body: [
        'मेरा आपकी शाखा में बचत खाता है, जिसकी खाता संख्या के अंतिम चार अंक {acct4} हैं। {reason}, इसलिए मैं यह खाता बंद करना [[चाहता|चाहती]] हूँ।',
        'कृपया मेरा खाता बंद करके बची हुई राशि मुझे दे दें। बचे हुए चेक और डेबिट कार्ड मैं इस पत्र के साथ लौटा [[रहा|रही]] हूँ।'
      ],
      ex: { to_desig: 'शाखा प्रबंधक महोदय/महोदया', to_org: 'भारतीय स्टेट बैंक', to_addr: 'विजय नगर शाखा, इंदौर', reason: 'मेरा तबादला दूसरे शहर में हो गया है' },
      encl: 'बचे हुए चेक\nडेबिट कार्ड (दो टुकड़ों में कटा हुआ)\nपासबुक',
      tips: ['बैंक में आम तौर पर खाता बंद करने का फ़ॉर्म होता है: उसे माँगें और यह पत्र साथ लगाएँ।', 'खाता बंद करने से पहले सभी ऑटो-डेबिट (EMI, SIP, बीमा) और UPI को दूसरे खाते से जोड़ लें।']
    },
    statement: {
      subject: 'खाते का विवरण (स्टेटमेंट) हेतु आवेदन',
      body: [
        'मेरा आपकी शाखा में बचत खाता है, जिसकी खाता संख्या के अंतिम चार अंक {acct4} हैं। मुझे {purpose} के लिए {from_date} से {to_date} तक का खाता विवरण चाहिए।',
        'कृपया बैंक की मुहर और हस्ताक्षर के साथ खाता विवरण जारी करें। मैं आपका [[आभारी रहूँगा|आभारी रहूँगी]]।'
      ],
      ex: { to_desig: 'शाखा प्रबंधक महोदय/महोदया', to_org: 'भारतीय स्टेट बैंक', to_addr: 'विजय नगर शाखा, इंदौर', purpose: 'लोन के आवेदन' },
      encl: '',
      tips: ['स्टेटमेंट आम तौर पर नेट बैंकिंग या ऐप से डाउनलोड हो जाता है; किसी दफ़्तर को चाहिए तो मुहर और हस्ताक्षर वाली कॉपी माँगें।', 'कुछ बैंक छपे हुए स्टेटमेंट के लिए थोड़ा शुल्क लेते हैं।']
    },
    work_leave: {
      subject: '{days} के अवकाश हेतु आवेदन',
      body: [
        'मैं {dept} में {emp_desig} के पद पर कार्यरत हूँ। {reason}, इसलिए मुझे {from_date} से {to_date} तक {days} का अवकाश चाहिए।',
        'जाने से पहले मैं अपना बाकी काम पूरा कर [[लूँगा|लूँगी]] और ज़रूरी काम किसी सहकर्मी को सौंप [[दूँगा|दूँगी]]। ज़रूरत हो तो मुझसे मेरे मोबाइल नंबर {phone} पर संपर्क किया जा सकता है।'
      ],
      ex: { to_desig: 'मानव संसाधन (HR) प्रबंधक', to_org: 'सनराइज़ टेक्सटाइल्स प्रा. लि.', to_addr: 'सेक्टर 3, पीथमपुर', reason: 'मुझे अपने गाँव में एक ज़रूरी पारिवारिक काम से जाना है' },
      encl: '',
      tips: ['पहले अपनी बची हुई छुट्टियाँ और कंपनी की छुट्टी नीति देख लें।', 'अगर दफ़्तर में ईमेल या HR ऐप चलता है, तो वहाँ भी यही आवेदन भेजें।']
    },
    wfh: {
      subject: 'घर से काम (वर्क फ़्रॉम होम) करने की अनुमति हेतु आवेदन',
      body: [
        'मैं {dept} में {emp_desig} के पद पर कार्यरत हूँ। {reason}, इसलिए मुझे {from_date} से {to_date} तक घर से काम करने की अनुमति दी जाए।',
        'दफ़्तर के समय में मैं ऑनलाइन उपलब्ध [[रहूँगा|रहूँगी]], सभी मीटिंग में शामिल [[होऊँगा|होऊँगी]] और अपना काम समय पर पूरा [[करूँगा|करूँगी]]। ज़रूरत पड़ने पर मैं दफ़्तर भी [[आ सकता|आ सकती]] हूँ।'
      ],
      ex: { to_desig: 'मानव संसाधन (HR) प्रबंधक', to_org: 'सनराइज़ टेक्सटाइल्स प्रा. लि.', to_addr: 'सेक्टर 3, पीथमपुर', reason: 'ऑपरेशन के बाद मुझे अपनी माँ की देखभाल करनी है' },
      encl: '',
      tips: ['बताएँ कि आप फ़ोन, ईमेल या ऑफ़िस चैट से कैसे जुड़े रहेंगे और काम पर असर नहीं पड़ेगा।', 'अनुमति लिखित में या ईमेल से लें और संभालकर रखें।']
    },
    resignation: {
      subject: '{emp_desig} के पद से त्यागपत्र',
      body: [
        'कृपया इस पत्र को {dept} में {emp_desig} के पद से मेरा औपचारिक त्यागपत्र मानें। {reason}। नोटिस अवधि के अनुसार मेरा अंतिम कार्य दिवस {last_day} होगा।',
        'यहाँ मिले सहयोग और सीख के लिए मैं आभारी हूँ। जाने से पहले मैं अपना काम ठीक से सौंप [[दूँगा|दूँगी]]।'
      ],
      ex: { to_desig: 'मानव संसाधन (HR) प्रबंधक', to_org: 'सनराइज़ टेक्सटाइल्स प्रा. लि.', to_addr: 'सेक्टर 3, पीथमपुर', reason: 'मुझे आगे बढ़ने का एक नया अवसर मिला है' },
      encl: '',
      tips: ['नियुक्ति-पत्र में नोटिस अवधि देखें: इसे पूरा करने से रिलीविंग लेटर आसानी से मिलता है।', 'आख़िरी दिन से पहले फ़ुल एंड फ़ाइनल सेटलमेंट, PF ट्रांसफ़र और फ़ॉर्म 16 के बारे में पूछ लें।']
    },
    experience_letter: {
      subject: 'अनुभव प्रमाण-पत्र और रिलीविंग लेटर हेतु आवेदन',
      body: [
        'मैंने आपकी संस्था में {join_date} से {last_day} तक {dept} में {emp_desig} के पद पर काम किया है (कर्मचारी ID: {emp_id})।',
        'मुझे नई नौकरी के लिए इनकी ज़रूरत है, इसलिए कृपया मेरा अनुभव प्रमाण-पत्र और रिलीविंग लेटर जल्द से जल्द जारी करें। मैं आपका [[आभारी रहूँगा|आभारी रहूँगी]]।'
      ],
      ex: { to_desig: 'मानव संसाधन (HR) प्रबंधक', to_org: 'सनराइज़ टेक्सटाइल्स प्रा. लि.', to_addr: 'सेक्टर 3, पीथमपुर' },
      encl: '',
      tips: ['मिले हुए पत्र में अपना पद और तारीखें ज़रूर जाँच लें।', 'कंपनी जवाब न दे, तो यही पत्र ईमेल से भी भेजें और कॉपी रखें।']
    },
    electricity: {
      subject: 'हमारे क्षेत्र में बिजली आपूर्ति की समस्या के बारे में शिकायत',
      body: [
        'मैं {address} में [[रहता|रहती]] हूँ और मेरा बिजली उपभोक्ता क्रमांक {consumer_no} है। मैं आपका ध्यान इस ओर दिलाना [[चाहता|चाहती]] हूँ कि {since_date} से {problem}।',
        'इससे निवासियों को, ख़ासकर विद्यार्थियों और बुज़ुर्गों को, बहुत परेशानी हो रही है। कृपया इस मामले को देखें और जल्द से जल्द ठीक करवाएँ।'
      ],
      ex: { to_desig: 'सहायक अभियंता', to_org: 'विद्युत वितरण कार्यालय', to_addr: 'ज़ोन 4, इंदौर', consumer_no: 'N-4523781', problem: 'बार-बार बिजली कट रही है और वोल्टेज बहुत कम है, जिससे घर के उपकरण खराब हो रहे हैं' },
      encl: '',
      tips: ['बिजली कंपनी की हेल्पलाइन या ऐप पर भी शिकायत दर्ज करें और शिकायत संख्या पत्र में लिखें।', 'पत्र की एक कॉपी पर कार्यालय की "प्राप्त" मुहर और तारीख लगवाकर रखें।']
    },
    water: {
      subject: 'पानी की आपूर्ति के बारे में शिकायत',
      body: [
        'मैं {address} में [[रहता|रहती]] हूँ। मैं आपका ध्यान इस ओर दिलाना [[चाहता|चाहती]] हूँ कि {since_date} से {problem}।',
        'निवासियों को बहुत परेशानी हो रही है और गंदे पानी से बीमारियाँ फैल सकती हैं। कृपया पानी की आपूर्ति की जाँच करवाकर जल्द से जल्द ठीक करवाएँ।'
      ],
      ex: { to_desig: 'कार्यपालन यंत्री', to_org: 'जल कार्य विभाग, नगर निगम', to_addr: 'इंदौर', problem: 'दिन में कुछ ही मिनट पानी आता है और वह भी मटमैला है' },
      encl: '',
      tips: ['पड़ोसियों के हस्ताक्षर भी करवाएँ: मिलकर दी गई शिकायत पर आम तौर पर जल्दी काम होता है।', 'कई नगर निगम हेल्पलाइन, ऐप या WhatsApp नंबर पर भी शिकायत लेते हैं: शिकायत संख्या लिख लें।']
    },
    garbage: {
      subject: 'हमारे क्षेत्र में कचरे और सफ़ाई के बारे में शिकायत',
      body: [
        'मैं आपका ध्यान {area} की खराब सफ़ाई व्यवस्था की ओर दिलाना [[चाहता|चाहती]] हूँ। पिछले कई दिनों से {problem}।',
        'बदबू और मच्छरों से सबके स्वास्थ्य को गंभीर खतरा है। कृपया नियमित रूप से कचरा उठवाने और क्षेत्र की सफ़ाई की व्यवस्था जल्द से जल्द करवाएँ।'
      ],
      ex: { to_desig: 'स्वास्थ्य अधिकारी', to_org: 'नगर निगम', to_addr: 'इंदौर', area: 'शांति नगर, सामुदायिक भवन के पास', problem: 'कचरा नहीं उठाया गया है और नालियाँ जाम हैं' },
      encl: 'कचरे की फ़ोटो',
      tips: ['हो सके तो समस्या की तारीख वाली फ़ोटो साथ लगाएँ।', 'अगर आपके शहर का नगर निगम ऐप या हेल्पलाइन है, तो वहाँ भी शिकायत करें।']
    },
    society: {
      subject: 'सोसाइटी की एक समस्या हल करने हेतु निवेदन',
      body: [
        'मैं हमारी सोसाइटी के फ़्लैट नंबर {flat_no} में [[रहता|रहती]] हूँ। मैं आपका ध्यान इस ओर दिलाना [[चाहता|चाहती]] हूँ कि {problem}।',
        'इससे सभी निवासियों को, ख़ासकर बुज़ुर्गों और बच्चों को, परेशानी हो रही है। कृपया इस मामले को प्रबंध समिति में उठाकर जल्द से जल्द हल करवाएँ।'
      ],
      ex: { to_desig: 'सचिव', to_org: 'शांति सहकारी गृह निर्माण सोसाइटी', to_addr: 'विजय नगर, इंदौर', flat_no: 'B-204', problem: 'B-विंग की लिफ़्ट एक हफ़्ते से बंद है' },
      encl: '',
      tips: ['पत्र सोसाइटी कार्यालय में दें और हस्ताक्षर वाली कॉपी लें, या शिकायत रजिस्टर में लिखें।', 'कोई हल या समय-सीमा भी सुझाएँ: इससे समिति जल्दी काम करती है।']
    },
    refund: {
      subject: 'खराब सामान को बदलने या पैसे लौटाने हेतु आवेदन',
      body: [
        'मैंने {buy_date} को आपसे ₹{price} में {product} की खरीदारी की थी (बिल/ऑर्डर नंबर {order_no})। दुर्भाग्य से {defect}।',
        'यह सामान वारंटी में है। कृपया 15 दिन के अंदर {remedy}। अगर मामला हल नहीं हुआ, तो मुझे उपभोक्ता आयोग में जाना पड़ेगा।'
      ],
      ex: { to_desig: 'ग्राहक सेवा प्रबंधक', to_org: 'सनराइज़ इलेक्ट्रॉनिक्स', to_addr: 'एम.जी. रोड, इंदौर', product: 'मिक्सर ग्राइंडर (मॉडल MG-500)', order_no: 'INV-20871', price: '3,499', defect: 'दस दिन के अंदर ही इसकी मोटर बंद हो गई', remedy: 'इसे नए पीस से बदल दें या पूरे पैसे लौटा दें' },
      encl: 'बिल की कॉपी\nवारंटी कार्ड की कॉपी\nखराबी की फ़ोटो',
      tips: ['बिल, वारंटी कार्ड और डिब्बा संभालकर रखें। शिकायत लिखकर करें और कॉपी रखें।', 'विक्रेता मदद न करे तो राष्ट्रीय उपभोक्ता हेल्पलाइन 1915 पर कॉल करें या consumerhelpline.gov.in पर शिकायत करें।']
    },
    rti: {
      subject: 'सूचना का अधिकार अधिनियम, 2005 के तहत सूचना हेतु आवेदन',
      body: [
        'सूचना का अधिकार अधिनियम, 2005 की धारा 6(1) के तहत कृपया मुझे निम्नलिखित सूचना उपलब्ध कराएँ:',
        '{info}',
        'सूचना की अवधि: {period}।',
        'मैंने आवेदन शुल्क {fee_mode} द्वारा जमा किया है। मैं भारत [[का नागरिक|की नागरिक]] हूँ। यदि यह सूचना किसी अन्य लोक प्राधिकरण के पास है, तो कृपया अधिनियम की धारा 6(3) के तहत मेरा आवेदन उसे भेज दें।'
      ],
      ex: { to_desig: 'लोक सूचना अधिकारी', to_org: 'नगर निगम कार्यालय', to_addr: 'इंदौर', info: '1. शांति नगर, वार्ड नंबर 12 की सड़क की मरम्मत की वर्तमान स्थिति।\n2. इस काम के लिए स्वीकृत और खर्च की गई राशि।\n3. कार्य आदेश और कार्य पूर्णता प्रमाण-पत्र की प्रतियाँ।', period: '1 अप्रैल 2025 से 31 मार्च 2026 तक', fee_mode: '₹10 के भारतीय पोस्टल ऑर्डर (नंबर ________)' },
      encl: 'आवेदन शुल्क का भारतीय पोस्टल ऑर्डर',
      tips: ['केंद्र सरकार के दफ़्तरों के लिए शुल्क ₹10 है (RTI नियम, 2012): रसीद के साथ नकद, डिमांड ड्राफ़्ट, बैंकर्स चेक या भारतीय पोस्टल ऑर्डर से, या rtionline.gov.in पर ऑनलाइन। हर राज्य के अपने नियम और शुल्क हैं, इसलिए अपने राज्य के नियम ज़रूर देखें।', 'गरीबी रेखा से नीचे (BPL) वालों को शुल्क नहीं देना होता: BPL प्रमाण-पत्र की कॉपी लगाएँ।', 'जवाब 30 दिन में मिलना चाहिए। जवाब न मिले या संतोष न हो, तो 30 दिन के अंदर प्रथम अपील कर सकते हैं।']
    }
  }
};
