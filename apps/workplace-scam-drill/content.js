/* Workplace Scam & Cyber Drill: the words of every scenario in 12 languages (same shape everywhere).
   [[code|words]] marks a red flag (code = sender, urgent, secret, money, newacct, link, attach, otp, threat, prize, odd, remote, upi, data)
   or a safe sign (code = ok). Facts that do not change with language (channel, sender ID, time, answer) live in data.js.
   Every company, person, phone number and web address is invented for practice (98XXX XXXXX numbers, example.com domains). */
window.APP_CONTENT = {
  en: {
    scenarios: {
      ceo_gift: {
        title: "Boss on a new number wants gift cards",
        ctx: "WhatsApp message to an accounts executive at 9 am. The profile photo is the MD's photo from the company website.",
        who: "Rajesh Sir (new number)",
        subject: "",
        text: "Hi, this is Rajesh. [[sender|My old phone is damaged, I am using this number for now.]] I am in a meeting with a big client. [[money|Buy 10 gift cards of ₹5,000 each]] and send me the codes [[urgent|within 30 minutes]]. [[secret|Please don't discuss this with anyone, it is a surprise for the client.]]",
        why: "Scammers copy the MD's photo from the website and write from a new number. A real boss never asks for gift-card codes or for secrecy. New number + urgency + secrecy is the classic \"CEO fraud\".",
        todo: "Don't buy anything. Call your boss on the number saved in your phone, or walk to their cabin. Tell IT or your manager so the whole office is warned."
      },
      it_real: {
        title: "Password policy notice from IT",
        ctx: "An email to all staff from the company's own IT helpdesk.",
        who: "IT Helpdesk",
        subject: "Password policy change from 15 October",
        text: "Dear colleagues, from 15 October passwords must be at least 12 characters long. [[ok|You do not need to do anything today.]] When your password expires, change it [[ok|on the office portal you normally use]]. [[ok|IT will never ask for your password by email, phone or WhatsApp.]] For doubts, visit the helpdesk on the 2nd floor.",
        why: "The sender is the company's own IT address. There is no link to click, no attachment, no deadline and no request for a password. Genuine notices tell you what will happen and let you use the normal portal yourself.",
        todo: "Nothing urgent. If you are unsure whether a notice is real, walk to the helpdesk or call the extension number you already know."
      },
      bec_vendor: {
        title: "Vendor says its bank account has changed",
        ctx: "An email to the accounts team about a pending invoice of ₹4,80,000.",
        who: "Kaveri Logistics Accounts",
        subject: "URGENT: Updated bank details for Invoice KL/2026/0912",
        text: "Dear Sir/Madam, [[newacct|our company bank account has changed after an audit. Please pay the pending invoice of ₹4,80,000 to the new account given below.]] [[urgent|Payment must be released today]] to avoid delay of your shipment. [[sender|Kindly reply only to this email ID]], our office phones are under maintenance.",
        why: "This is Business Email Compromise (BEC). Criminals hack or copy a vendor's email and send \"new bank details\". The address is slightly different from the real vendor, the phones \"are not working\" so you cannot verify, and everything is urgent.",
        todo: "Never change a vendor's bank details because of an email. Call the vendor on the number from your old records or purchase order, never the number in the email. Use two-person approval for every bank-detail change."
      },
      gst_notice: {
        title: "GST penalty notice with an attachment",
        ctx: "An email to the accounts mailbox early in the morning.",
        who: "GST Department",
        subject: "Show Cause Notice - Penalty ₹1,24,500 - Action required",
        text: "[[odd|Dear Taxpayer,]] a mismatch is found in your GST returns. A penalty of ₹1,24,500 is due. [[threat|Your GSTIN will be suspended in 48 hours]] if it is not paid. [[link|Open the attached notice and pay through the secure link]] to avoid legal action. [[attach|Attachment: GST_Notice_2026.html]]",
        why: "Real GST notices appear in your account on the official GST portal and carry a DIN (Document Identification Number). An HTML attachment with a \"secure link\" is a fake login page that steals your GST login or payment details. The sender is not the official gov.in domain.",
        todo: "Don't open the attachment. Log in to the official GST portal yourself by typing the address, or ask your CA to check. Report the email to IT and at cybercrime.gov.in."
      },
      otp_real: {
        title: "OTP for a payment you just started",
        ctx: "You have just started a UPI payment of ₹2,500 to your packaging vendor. This SMS arrives.",
        who: "",
        subject: "",
        text: "[[ok|Your OTP for the UPI payment of ₹2,500 to Sunrise Packaging that you just started is 482913.]] Valid for 10 minutes. [[ok|Do not share this OTP with anyone, not even the bank.]] - NovaBank",
        why: "You started this payment yourself a moment ago, the amount and the payee match, and the message tells you not to share the code. A genuine OTP is only for the action you yourself requested, and the bank never asks you to tell it to anyone.",
        todo: "Type the OTP only in the app you are using. If an OTP arrives when you did not start anything, somebody is trying to use your account: do not share it, and call the bank on the number printed on your card."
      },
      digital_arrest: {
        title: "Video call from a \"CBI officer\"",
        ctx: "A video call from an unknown number. The caller wears a uniform and sits in an office with a flag behind him.",
        who: "\"CBI Officer Verma\"",
        subject: "",
        text: "\"[[threat|A parcel with drugs and 6 passports was booked in your name. A case is registered against you.]] [[urgent|Stay on this video call, do not disconnect]], and [[secret|do not tell anyone, not even your family, they are also under watch]]. [[money|Transfer ₹3,50,000 to this RBI verification account for checking]]; it will be returned after the investigation.\"",
        why: "This is a \"digital arrest\". No police, CBI or court arrests anyone on a video call, and no agency asks you to transfer money to a \"verification account\". The uniform, office background and ID card are all fake. Secrecy and keeping you on the call stop you from thinking.",
        todo: "Hang up at once. Real officers do not call on WhatsApp. Call 1930 or report at cybercrime.gov.in, and tell a colleague or family member immediately."
      },
      courier: {
        title: "Call: your parcel is held at customs",
        ctx: "A recorded voice, then a person. You have not ordered anything from abroad.",
        who: "\"SpeedParcel Customer Service\"",
        subject: "",
        text: "\"Hello, this is the customs department of SpeedParcel. [[threat|A parcel in your name is held at customs because it contains illegal items.]] To avoid a police case, [[urgent|press 1 now]] to speak to an officer, or [[money|pay the ₹2,999 clearance fee]] on the link we will send.\"",
        why: "Courier companies do not call about illegal items, and customs does not collect fees by phone. Pressing 1 connects you to a fake \"officer\" who then tries a digital-arrest scam or asks for payments.",
        todo: "Cut the call. If you really ordered something, check the tracking number on the courier's official website. Report the number on the Sanchar Saathi (Chakshu) portal."
      },
      task_job: {
        title: "Telegram job: earn ₹8,000 a day rating hotels",
        ctx: "A Telegram message after you applied for jobs online last week.",
        who: "HR Priya - Online Jobs",
        subject: "",
        text: "Congratulations, you are selected! [[prize|Earn ₹3,000 to ₹8,000 daily by rating hotels online]], only 20 minutes of work. The first 3 tasks are free. For premium tasks you [[money|deposit ₹5,000 and get back ₹7,500 within one hour]]. [[urgent|Only 4 seats left today!]]",
        why: "This is a task scam. The first small payments are real, to build trust. Then you \"deposit\" for premium tasks and the money never comes back. No real job pays you to click, and no employer asks you to deposit money.",
        todo: "Don't deposit anything. Block and report the account. If you have already paid, call 1930 immediately; the first hour matters most."
      },
      vendor_real: {
        title: "Payment reminder from a known vendor",
        ctx: "An email from the packaging vendor you pay every month, from their usual address.",
        who: "Sunrise Packaging Billing",
        subject: "Payment reminder - Invoice SP/26-27/0431 due 10 Oct",
        text: "Dear Meridian Textiles team, this is a gentle reminder that invoice SP/26-27/0431 for ₹86,000 is due on 10 October. [[ok|Our bank details are unchanged and are printed on the invoice you already have.]] [[ok|If you receive any email asking to change our bank account, please call our office on the number in your records before paying.]] Thank you.",
        why: "A regular reminder from the known vendor address, no new bank details, no threat, and the vendor itself asks you to verify by phone if anything looks different. That is exactly how a genuine partner behaves.",
        todo: "Pay through your normal process to the account already in your records. Any change request should be confirmed on a known phone number."
      },
      deepfake: {
        title: "The MD's voice asks for an urgent transfer",
        ctx: "A phone call from an unknown number. The voice sounds exactly like your MD, with airport noise behind.",
        who: "\"Rajesh Sir\" (the MD's voice)",
        subject: "",
        text: "\"Hello, it's me, I am at the airport, you can hear it is noisy. [[urgent|I need you to transfer ₹2,00,000 right now]] to a new supplier for the Dubai order. [[newacct|I will WhatsApp you the account number.]] [[secret|Don't call me back, my phone is going on flight mode, just do it before I land.]]\"",
        why: "AI can copy anyone's voice from a 30-second clip of a speech or video. A cloned voice plus a new account number plus \"don't call me back\" is a deepfake scam. The background noise is added on purpose.",
        todo: "Say you will call back, then call the MD on the saved number or check with a second senior person. Agree on a code word in your team for urgent phone requests. No transfer without the normal approval."
      },
      qr_receive: {
        title: "Buyer sends a QR code to \"receive\" money",
        ctx: "You advertised 12 used office chairs on a classified-ads site. A buyer writes on WhatsApp.",
        who: "Buyer for office chairs",
        subject: "",
        text: "Hi, I saw your ad for 12 used office chairs at ₹18,000. I will pay the full amount now. [[upi|I have sent a QR code: scan it and enter your UPI PIN to receive the money.]] [[odd|I am an army officer posted outside, so my friend will pick up the chairs.]] [[urgent|Please do it in the next 5 minutes, my network is weak.]]",
        why: "You never scan a QR or enter a PIN to RECEIVE money. Scanning and entering the PIN PAYS the other person. The \"army officer\" story and the hurry are standard tricks on classified-ad sites.",
        todo: "Refuse. Ask the buyer to send money to your UPI ID; you need to do nothing to receive it. Report the number in the app."
      },
      fake_care: {
        title: "Customer-care number found on search",
        ctx: "A refund did not arrive. You searched online for the bank's customer care and called the first number shown.",
        who: "\"NovaBank Customer Care\"",
        subject: "",
        text: "\"Thank you for calling NovaBank customer care. For your refund of ₹3,200 we need to verify you. [[otp|Please tell me your 16-digit card number, expiry date and the OTP you receive now.]] [[remote|Also install the Quick Support app I am sending so I can process it faster.]]\"",
        why: "You called a fake number placed in search results or on a fake website. No bank asks for the full card number, expiry, CVV or OTP, and never asks you to install a remote-control app.",
        todo: "Cut the call. Use only the number printed on the back of your card or inside the official app. Never install an app a caller asks for. If you shared anything, block the card in the app at once and call 1930."
      },
      hr_real: {
        title: "Diwali holiday list from HR",
        ctx: "An email to all staff from the company's HR address.",
        who: "HR Department",
        subject: "Holiday list for Diwali week",
        text: "Dear all, the office will be closed from 7 to 9 November for Diwali. [[ok|The full holiday list is on the HR page of the intranet]], the same page you use for leave. [[ok|No action is needed from you.]] Wishing everyone a happy and safe Diwali. - HR Team",
        why: "Sent from the company's own HR address, information only, no link to an outside site, no attachment to open and nothing to fill in. Genuine notices do not need urgency.",
        todo: "Nothing to do. If an email about holidays or a bonus asks you to log in or fill in bank details, treat that as a red flag and ask HR in person."
      },
      screen_share: {
        title: "\"UPI helpline\" wants to see your screen",
        ctx: "A call minutes after a UPI payment failed and you complained on social media.",
        who: "\"UPI Helpline\"",
        subject: "",
        text: "\"Sir, your UPI payment of ₹1,500 is stuck. I can fix it in 2 minutes. [[remote|Please install the screen-sharing app from the link I sent and read me the 9-digit code on the screen.]] Keep your banking app open, I only need to see it. [[otp|When the OTP comes, don't cut the call, I will guide you.]]\"",
        why: "Remote-access and screen-sharing apps let the caller see and control your phone; the 9-digit code gives them full access. Together with an OTP they can empty the account within minutes. Genuine helplines never ask to see your screen.",
        todo: "Cut the call and uninstall any app you installed. Complain only inside the official UPI or bank app. If money has moved, call 1930 and your bank immediately."
      },
      invoice_exe: {
        title: "Invoice attachment ending in .exe",
        ctx: "An email to the accounts mailbox from a company you do not remember buying from.",
        who: "Global Trade Supplies",
        subject: "Invoice attached - please process",
        text: "[[odd|Dear Sir,]] please find attached the invoice for the goods delivered last week. [[attach|Attachment: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|Kindly process payment today]] and confirm. [[odd|Regards, Accounts Dept.]]",
        why: "A file ending in .exe is a program, not a PDF; the \".pdf\" in the name is a disguise. Opening it installs malware or ransomware that can lock every computer in the office. A vague greeting and no company signature are extra warnings.",
        todo: "Don't open the attachment. Report the email to IT. Check your records: did you actually buy from this company? Turn on \"show file extensions\" on office computers so such tricks are visible."
      },
      echallan: {
        title: "Traffic e-challan SMS with an app link",
        ctx: "An SMS to the office driver's phone in the evening.",
        who: "",
        subject: "",
        text: "Traffic e-Challan: your vehicle KA-05-XX-1234 was recorded jumping a signal on 1 October. [[money|Fine ₹1,000.]] [[urgent|Pay within 24 hours]] to avoid double fine and court summons. [[link|Download the official challan app: echallan-pay.example.net/app.apk]]",
        why: "Real e-challan messages come from a government sender ID, not a personal mobile number, and never ask you to download an .apk file. The APK is a malicious app that reads your SMS and OTPs.",
        todo: "Delete the message. Check challans only on the official government e-challan website or the state police app. Report the number on Sanchar Saathi (Chakshu)."
      },
      parcel_real: {
        title: "Delivery update for a parcel you expect",
        ctx: "You ordered packaging material last week. This SMS arrives.",
        who: "",
        subject: "",
        text: "SpeedParcel: your shipment SP48213 from Sunrise Packaging [[ok|will be delivered today between 2 pm and 5 pm.]] [[ok|No payment is due.]] [[ok|To track, use your shipment number on our website or app.]]",
        why: "Sent from a registered sender ID (not a personal number), matches a parcel you expect, asks for no money and gives no link to tap. A genuine delivery message just informs you.",
        todo: "Nothing to do. If a parcel message asks for a fee, a link or an app, stop and check on the official website using the shipment number."
      },
      kyc: {
        title: "KYC expired, account blocked today",
        ctx: "An SMS to the owner's phone at night.",
        who: "",
        subject: "",
        text: "Dear customer, [[threat|your NovaBank account will be blocked today]] because your KYC has expired. [[urgent|Update immediately]] at [[link|novabank-kyc-update.example.net]] or [[sender|call our officer on 94XXX XXX51]].",
        why: "Banks never send KYC links from a personal mobile number and never block an account within hours. The link opens a fake bank page that steals your login and OTP; the \"officer\" asks you to install an app.",
        todo: "Don't tap the link or call. If KYC is really due, the bank's own app or branch will tell you. Report the SMS on Sanchar Saathi (Chakshu)."
      },
      sim_swap: {
        title: "Call: your SIM will be deactivated",
        ctx: "A call to the office manager, who uses this number for bank OTPs.",
        who: "\"Telecom company executive\"",
        subject: "",
        text: "\"Madam, this is from your mobile network. [[threat|Your SIM will be deactivated in 24 hours]] because the 5G upgrade is pending. [[otp|To upgrade, read out the 20-digit number printed on your SIM card and press 1 after the SMS you receive.]] [[urgent|This offer closes today.]]\"",
        why: "This is a SIM-swap attempt. With the 20-digit SIM number and your \"1\", the fraudster activates your number on their own SIM. Your phone goes dead and every OTP for banking and UPI then goes to them.",
        todo: "Cut the call. Telecom companies never call for 5G upgrades. If your phone suddenly loses network for a long time, call your bank first, then your operator. Check SIMs issued in your name on Sanchar Saathi."
      },
      mfa: {
        title: "Seventh login approval request since midnight",
        ctx: "Your phone keeps buzzing at night with sign-in approval requests from the office login app. Then a call comes.",
        who: "SecureLogin app",
        subject: "",
        text: "[[otp|Approve sign-in? Someone is trying to sign in to your office account from a new device. Tap APPROVE to continue.]] [[odd|(This is the 7th request since midnight.)]] A moment later a caller says: \"[[urgent|This is IT, we are fixing a server. Please just approve the request so the alerts stop.]]\"",
        why: "This is \"MFA fatigue\". The attacker already has your password and is spamming approval requests, hoping you tap Approve to make them stop. The \"IT\" call is part of the attack. Real IT never asks you to approve a login you did not start.",
        todo: "Tap Deny every time. Change your password from a trusted device right away and tell IT. The repeated requests mean your password has already leaked."
      },
      gst_real: {
        title: "Monthly GST reminder from your CA",
        ctx: "A WhatsApp message from your chartered accountant's saved number.",
        who: "Mehta & Co. (our CA)",
        subject: "",
        text: "Good morning. Reminder: GSTR-3B for September is due on 20 October. [[ok|Please upload the sales and purchase sheets to the same shared folder as every month.]] [[ok|No payment is needed from your side right now]]; I will send the challan details after filing, and we can confirm on our usual call.",
        why: "Known CA, saved number, the usual monthly process, no new account number, no link and no urgency beyond the real due date. Verification happens on your regular call.",
        todo: "Follow your normal process. If one day the \"CA\" sends a new bank account or asks you to pay through a link, call the CA office on the known number first."
      },
      lookalike: {
        title: "Salary slip on a look-alike domain",
        ctx: "An email about a revised salary slip. Your company's real domain is meridiantextiles.example.com.",
        who: "Payroll Team",
        subject: "Your revised salary slip is ready",
        text: "Dear employee, your salary structure has been revised from October. [[link|Log in at meridian-textiles-portal.example.com with your office password to view the new slip.]] [[urgent|The link expires in 12 hours.]] [[sender|Sent from payroll@meridian-textiles.example.com]]",
        why: "The real company domain is meridiantextiles.example.com; the email uses meridian-textiles (with a hyphen), a look-alike domain. The link leads to a copied login page that steals your office password. A salary slip would be on the HR portal you always use.",
        todo: "Don't click. Open the HR portal yourself by typing the address or from your bookmark. Report the email to IT; forwarding it helps them block the fake domain for everyone."
      },
      usb: {
        title: "Pen drive found in the parking lot",
        ctx: "Monday morning, near the office entrance.",
        who: "A pen drive found in the office parking",
        subject: "",
        text: "A pen drive lies near the entrance with a label: [[prize|\"Salary Revision 2026 - CONFIDENTIAL - Management only\"]]. A colleague says: \"[[remote|Let's plug it into the reception PC and see whose it is.]]\"",
        why: "This is a \"USB drop\". Attackers leave pen drives with tempting labels; the moment one is plugged in, hidden software can install itself and spread across the office network. Curiosity is the attack.",
        todo: "Don't plug it in anywhere. Hand it to IT or security in an envelope. Companies should disable auto-run and block unknown USB devices."
      },
      wifi: {
        title: "Free airport Wi-Fi asks for your email password",
        ctx: "Waiting for a flight, you connect to a free network to approve two vendor payments.",
        who: "Free Wi-Fi login screen at the airport",
        subject: "",
        text: "Network: Airport_Free_WiFi_5G (no password). [[otp|To continue, sign in with your email address and email password.]] Then you plan to [[data|approve two vendor payments on the company banking portal]] while waiting for your flight.",
        why: "Anyone can create a hotspot with an official-sounding name. On a fake network the attacker can see what you type, and a login page that asks for your email password is harvesting credentials. Banking on public Wi-Fi is a risk.",
        todo: "Use your own mobile data or the company VPN for work and banking. Never type your office or email password on a Wi-Fi login page. Turn off auto-connect to open networks."
      },
      upi_real: {
        title: "Payment received notification",
        ctx: "A notification from your own UPI app while you are at the counter.",
        who: "UPI app",
        subject: "",
        text: "[[ok|₹2,500 received from Anita Traders]] into your current account ending 4471. [[ok|No action needed.]] Transaction ID 628104...",
        why: "Money coming IN never needs your PIN, OTP or a scan. The notification is from your own app, names the payer and asks nothing of you. Compare this with a \"collect request\" or a QR you are asked to scan: those take money OUT.",
        todo: "Nothing to do. Check the amount against your invoice. If a \"payment received\" message ever asks you to approve, enter a PIN or scan, it is taking money, not giving it."
      },
      dpdp: {
        title: "Colleague wants the customer list on WhatsApp",
        ctx: "A WhatsApp message from a sales colleague's number in the evening.",
        who: "Sameer (sales colleague)",
        subject: "",
        text: "Bro, I am working from home today. [[data|Please export the full customer list with phone numbers and Aadhaar copies and send it to me on this WhatsApp]], I will delete it later. [[urgent|Need it in 10 minutes for the campaign.]] [[secret|No need to tell the manager, it's a small thing.]]",
        why: "Customer phone numbers and Aadhaar copies are personal data protected by India's DPDP Act. Sending them on personal WhatsApp takes them outside company control, and this could also be a hacked account or an impersonation. \"Don't tell the manager\" is never acceptable.",
        todo: "Say no politely. Share customer data only through the company's approved system, with the manager's approval and only the fields needed. If a colleague's account seems odd, call them."
      },
      otp_call: {
        title: "\"Fraud department\" needs the OTP to cancel a payment",
        ctx: "A call while an OTP SMS arrives on your phone.",
        who: "\"NovaBank Fraud Department\"",
        subject: "",
        text: "\"Sir, [[threat|a transaction of ₹49,999 is happening on your card right now.]] To cancel it [[urgent|we must act within 60 seconds]]. [[otp|Tell me the OTP that has just arrived on your phone and I will reverse it.]] [[secret|Please do not disconnect or call anyone.]]\"",
        why: "The OTP that \"just arrived\" is for the scammer's own attempt to pay with your card. Reading it out completes the payment. Banks never ask for an OTP to cancel anything, and the 60-second panic is created so you don't think.",
        todo: "Cut the call. Open your bank app and block the card yourself, or call the number on the back of your card. Never read an OTP to anyone. If money has left, call 1930 right away."
      },
      hr_bonus: {
        title: "Diwali bonus form asks for net-banking login",
        ctx: "An email to all staff just before Diwali, from an address that looks like HR.",
        who: "HR Rewards Team",
        subject: "Diwali bonus ₹25,000 - confirm your bank account",
        text: "Dear team member, we are pleased to announce a Diwali bonus of ₹25,000. [[attach|Open the attached form (Bonus_Form.html)]] and [[otp|enter your net-banking user ID and password]] so that the bonus is credited directly. [[urgent|Forms received after 6 pm today will not be processed.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR already has your salary account; no company asks for your net-banking login for a bonus. The sender is a look-alike domain, the HTML attachment is a fake bank login page, and a same-day deadline adds pressure.",
        todo: "Don't open the attachment or enter anything. Ask HR in person or on the intranet. Report the email to IT so colleagues are warned."
      },
      electricity: {
        title: "Office power will be cut tonight",
        ctx: "An SMS to the shop owner's phone at 8:35 pm.",
        who: "",
        subject: "",
        text: "Dear consumer, [[threat|your office electricity connection will be disconnected tonight at 9:30 pm]] because [[odd|last month bill is not update in our system]]. Please contact our officer [[sender|93XXX XXX40]] [[urgent|immediately]].",
        why: "Electricity boards don't disconnect at night after one SMS from a personal mobile. When you call, the \"officer\" asks you to install an app or pay ₹10 through a link, and the real target is your bank account.",
        todo: "Don't call. Check the bill in the electricity board's official app or office. Report the number on Sanchar Saathi (Chakshu)."
      },
      wa_hijack: {
        title: "Colleague asks you to forward a 6-digit code",
        ctx: "A late-night WhatsApp message from a colleague's saved number, right after a code SMS arrived on your phone.",
        who: "Rohan (colleague)",
        subject: "",
        text: "Hey, sorry to disturb you so late. [[odd|I entered your number by mistake while logging into WhatsApp and a 6-digit code went to your phone.]] [[otp|Please forward me that code]], [[urgent|quickly, otherwise my account will be locked.]]",
        why: "The code that arrived is the verification code for YOUR WhatsApp. Whoever gets it takes over your account and then messages all your contacts and office groups asking for money. The message itself may come from a colleague's already-hijacked account.",
        todo: "Never forward a verification code. Phone the colleague to warn them that their account is hacked. Turn on two-step verification in WhatsApp settings."
      },
      invest_group: {
        title: "Stock-tips group with guaranteed returns",
        ctx: "You were added to a WhatsApp group without asking.",
        who: "VIP Stock Tips - Group admin",
        subject: "",
        text: "Welcome to our premium group! [[prize|Our members earned 32% returns last month with guaranteed insider tips.]] Download our trading app from [[link|this link, not from the app store]], and [[money|start with a deposit of ₹50,000]]. [[prize|See the screenshots of profits posted by members!]] [[urgent|Entry closes at midnight.]]",
        why: "Nobody can guarantee returns, and \"insider tips\" are illegal. The app is fake: it shows imaginary profits so you deposit more, and withdrawal is never allowed. The \"members\" posting screenshots are the scammers.",
        todo: "Leave and report the group. Invest only through SEBI-registered brokers and apps from the official app store. If you have deposited, call 1930 and report at cybercrime.gov.in."
      },
      bank_real: {
        title: "Debit alert for a payment you made",
        ctx: "Your accounts team paid the packaging vendor today. This SMS arrives.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|₹86,000 debited from account ending 4471 on 10 Oct for NEFT to Sunrise Packaging]], ref N26101034. Balance ₹3,42,118. [[ok|If not done by you, call the number on the back of your debit card.]]",
        why: "This matches the payment your accounts team made today, comes from the bank's sender ID, has no link or number inside the SMS and points you to the number on your own card.",
        todo: "Match it with your payment records. If any debit alert does not match a payment you made, call the bank immediately using the number on the card, not a number from a message."
      }
    }
  },
  hi: {
    scenarios: {
      ceo_gift: {
        title: "नए नंबर से बॉस गिफ्ट कार्ड माँग रहे हैं",
        ctx: "सुबह 9 बजे अकाउंट्स एग्ज़ीक्यूटिव को WhatsApp मैसेज। प्रोफ़ाइल फ़ोटो कंपनी की वेबसाइट से ली गई MD की फ़ोटो है।",
        who: "राजेश सर (नया नंबर)",
        subject: "",
        text: "हैलो, मैं राजेश बोल रहा हूँ। [[sender|मेरा पुराना फ़ोन खराब हो गया है, अभी यही नंबर इस्तेमाल कर रहा हूँ।]] मैं एक बड़े क्लाइंट के साथ मीटिंग में हूँ। [[money|₹5,000 के 10 गिफ्ट कार्ड खरीदो]] और कोड मुझे [[urgent|30 मिनट के अंदर]] भेजो। [[secret|किसी से इसकी चर्चा मत करना, क्लाइंट के लिए सरप्राइज़ है।]]",
        why: "स्कैमर वेबसाइट से MD की फ़ोटो उठाकर नए नंबर से लिखते हैं। असली बॉस कभी गिफ्ट-कार्ड कोड या गोपनीयता नहीं माँगता। नया नंबर + जल्दी + गोपनीयता यही क्लासिक \"CEO फ्रॉड\" है।",
        todo: "कुछ मत खरीदिए। बॉस को फ़ोन में सहेजे नंबर पर कॉल करें या उनके केबिन तक जाएँ। IT या मैनेजर को बताएँ ताकि पूरा दफ्तर सावधान रहे।"
      },
      it_real: {
        title: "IT से पासवर्ड नीति की सूचना",
        ctx: "कंपनी के अपने IT हेल्पडेस्क से सभी कर्मचारियों को ईमेल।",
        who: "IT हेल्पडेस्क",
        subject: "15 अक्टूबर से पासवर्ड नीति में बदलाव",
        text: "प्रिय सहकर्मियों, 15 अक्टूबर से पासवर्ड कम से कम 12 अक्षरों का होना चाहिए। [[ok|आज आपको कुछ करने की ज़रूरत नहीं है।]] पासवर्ड की अवधि खत्म होने पर इसे [[ok|उसी ऑफिस पोर्टल पर बदलें जो आप हमेशा इस्तेमाल करते हैं]]। [[ok|IT कभी ईमेल, फ़ोन या WhatsApp पर आपका पासवर्ड नहीं माँगेगा।]] सवाल हों तो दूसरी मंज़िल पर हेल्पडेस्क आएँ।",
        why: "भेजने वाला कंपनी का अपना IT पता है। न क्लिक करने को लिंक, न अटैचमेंट, न समय-सीमा, न पासवर्ड की माँग। असली सूचनाएँ बताती हैं कि क्या होगा और आपको सामान्य पोर्टल खुद इस्तेमाल करने देती हैं।",
        todo: "कुछ ज़रूरी नहीं। किसी सूचना के असली होने पर शक हो तो हेल्पडेस्क तक जाएँ या पहले से ज्ञात एक्सटेंशन नंबर पर कॉल करें।"
      },
      bec_vendor: {
        title: "वेंडर कहता है बैंक खाता बदल गया",
        ctx: "₹4,80,000 के बकाया इनवॉइस के बारे में अकाउंट्स टीम को ईमेल।",
        who: "कावेरी लॉजिस्टिक्स अकाउंट्स",
        subject: "ज़रूरी: इनवॉइस KL/2026/0912 के लिए नए बैंक विवरण",
        text: "महोदय/महोदया, [[newacct|ऑडिट के बाद हमारी कंपनी का बैंक खाता बदल गया है। कृपया ₹4,80,000 का बकाया इनवॉइस नीचे दिए नए खाते में भेजें।]] शिपमेंट में देरी से बचने के लिए [[urgent|भुगतान आज ही जारी करें]]। [[sender|कृपया सिर्फ़ इसी ईमेल ID पर जवाब दें]], हमारे ऑफिस के फ़ोन मरम्मत में हैं।",
        why: "यह बिज़नेस ईमेल कॉम्प्रोमाइज़ (BEC) है। अपराधी वेंडर का ईमेल हैक या कॉपी करके \"नए बैंक विवरण\" भेजते हैं। पता असली वेंडर से थोड़ा अलग है, फ़ोन \"काम नहीं कर रहे\" ताकि आप पुष्टि न कर सकें, और सब कुछ ज़रूरी है।",
        todo: "ईमेल के आधार पर वेंडर के बैंक विवरण कभी न बदलें। वेंडर को पुराने रिकॉर्ड या परचेज़ ऑर्डर वाले नंबर पर कॉल करें, ईमेल वाले नंबर पर कभी नहीं। बैंक विवरण के हर बदलाव पर दो लोगों की मंज़ूरी रखें।"
      },
      gst_notice: {
        title: "अटैचमेंट वाला GST जुर्माना नोटिस",
        ctx: "सुबह-सुबह अकाउंट्स मेलबॉक्स में आया ईमेल।",
        who: "GST विभाग",
        subject: "कारण बताओ नोटिस - जुर्माना ₹1,24,500 - कार्रवाई ज़रूरी",
        text: "[[odd|प्रिय करदाता,]] आपके GST रिटर्न में अंतर पाया गया है। ₹1,24,500 का जुर्माना बकाया है। भुगतान न होने पर [[threat|आपका GSTIN 48 घंटे में निलंबित कर दिया जाएगा]]। कानूनी कार्रवाई से बचने के लिए [[link|संलग्न नोटिस खोलें और सुरक्षित लिंक से भुगतान करें]]। [[attach|अटैचमेंट: GST_Notice_2026.html]]",
        why: "असली GST नोटिस आधिकारिक GST पोर्टल पर आपके खाते में दिखते हैं और उन पर DIN (दस्तावेज़ पहचान संख्या) होता है। \"सुरक्षित लिंक\" वाला HTML अटैचमेंट नकली लॉगिन पेज है जो आपका GST लॉगिन या भुगतान विवरण चुराता है। भेजने वाला आधिकारिक gov.in डोमेन नहीं है।",
        todo: "अटैचमेंट न खोलें। पता खुद टाइप करके आधिकारिक GST पोर्टल पर लॉगिन करें, या अपने CA से जाँच करवाएँ। ईमेल की रिपोर्ट IT को और cybercrime.gov.in पर करें।"
      },
      otp_real: {
        title: "अभी शुरू किए भुगतान का OTP",
        ctx: "आपने अभी-अभी पैकेजिंग वेंडर को ₹2,500 का UPI भुगतान शुरू किया है। यह SMS आता है।",
        who: "",
        subject: "",
        text: "[[ok|सनराइज़ पैकेजिंग को आपके द्वारा अभी शुरू किए गए ₹2,500 के UPI भुगतान का OTP 482913 है।]] 10 मिनट तक मान्य। [[ok|यह OTP किसी से साझा न करें, बैंक से भी नहीं।]] - नोवाबैंक",
        why: "यह भुगतान आपने खुद अभी शुरू किया, रकम और पाने वाला मेल खाते हैं, और मैसेज कोड साझा न करने को कहता है। असली OTP सिर्फ़ उसी काम के लिए होता है जो आपने खुद माँगा, और बैंक इसे किसी को बताने को कभी नहीं कहता।",
        todo: "OTP सिर्फ़ उसी ऐप में डालें जो आप इस्तेमाल कर रहे हैं। अगर बिना कुछ शुरू किए OTP आए, तो कोई आपका खाता इस्तेमाल करने की कोशिश कर रहा है: साझा न करें और कार्ड पर छपे नंबर पर बैंक को कॉल करें।"
      },
      digital_arrest: {
        title: "\"CBI अधिकारी\" की वीडियो कॉल",
        ctx: "अनजान नंबर से वीडियो कॉल। कॉल करने वाला वर्दी में है और पीछे झंडे वाले दफ्तर में बैठा है।",
        who: "\"CBI अधिकारी वर्मा\"",
        subject: "",
        text: "\"[[threat|आपके नाम पर ड्रग्स और 6 पासपोर्ट वाला पार्सल बुक हुआ है। आपके खिलाफ केस दर्ज है।]] [[urgent|इस वीडियो कॉल पर बने रहिए, काटिएगा नहीं]], और [[secret|किसी को मत बताइए, परिवार को भी नहीं, वे भी निगरानी में हैं]]। जाँच के लिए [[money|₹3,50,000 इस RBI वेरिफ़िकेशन खाते में ट्रांसफ़र करें]]; जाँच के बाद लौटा दिए जाएँगे।\"",
        why: "यह \"डिजिटल अरेस्ट\" है। कोई पुलिस, CBI या अदालत वीडियो कॉल पर किसी को गिरफ़्तार नहीं करती, और कोई एजेंसी \"वेरिफ़िकेशन खाते\" में पैसे नहीं मँगवाती। वर्दी, दफ्तर का बैकग्राउंड और ID कार्ड सब नकली हैं। गोपनीयता और कॉल पर बनाए रखना आपको सोचने से रोकता है।",
        todo: "तुरंत कॉल काटें। असली अधिकारी WhatsApp पर कॉल नहीं करते। 1930 पर कॉल करें या cybercrime.gov.in पर रिपोर्ट करें, और किसी सहकर्मी या परिवार को तुरंत बताएँ।"
      },
      courier: {
        title: "कॉल: आपका पार्सल कस्टम्स में रुका है",
        ctx: "पहले रिकॉर्डेड आवाज़, फिर एक व्यक्ति। आपने विदेश से कुछ नहीं मँगाया।",
        who: "\"स्पीडपार्सल कस्टमर सर्विस\"",
        subject: "",
        text: "\"नमस्ते, स्पीडपार्सल के कस्टम्स विभाग से बोल रहे हैं। [[threat|आपके नाम का पार्सल कस्टम्स में रोका गया है क्योंकि उसमें गैरकानूनी सामान है।]] पुलिस केस से बचने के लिए [[urgent|अभी 1 दबाएँ]] और अधिकारी से बात करें, या हम जो लिंक भेजेंगे उस पर [[money|₹2,999 क्लियरेंस फ़ीस भरें]]।\"",
        why: "कूरियर कंपनियाँ गैरकानूनी सामान के बारे में कॉल नहीं करतीं, और कस्टम्स फ़ोन पर फ़ीस नहीं लेता। 1 दबाने पर आप नकली \"अधिकारी\" से जुड़ते हैं जो फिर डिजिटल-अरेस्ट स्कैम या भुगतान की कोशिश करता है।",
        todo: "कॉल काटें। अगर सच में कुछ मँगाया है तो कूरियर की आधिकारिक वेबसाइट पर ट्रैकिंग नंबर देखें। नंबर की रिपोर्ट संचार साथी (चक्षु) पोर्टल पर करें।"
      },
      task_job: {
        title: "Telegram नौकरी: होटल रेट करके रोज़ ₹8,000",
        ctx: "पिछले हफ्ते ऑनलाइन नौकरी के आवेदन के बाद Telegram पर मैसेज।",
        who: "HR प्रिया - ऑनलाइन जॉब्स",
        subject: "",
        text: "बधाई हो, आप चुने गए हैं! [[prize|होटलों को ऑनलाइन रेट करके रोज़ ₹3,000 से ₹8,000 कमाएँ]], सिर्फ़ 20 मिनट का काम। पहले 3 टास्क मुफ़्त। प्रीमियम टास्क के लिए [[money|₹5,000 जमा करें और एक घंटे में ₹7,500 वापस पाएँ]]। [[urgent|आज सिर्फ़ 4 सीटें बची हैं!]]",
        why: "यह टास्क स्कैम है। भरोसा बनाने के लिए शुरुआती छोटे भुगतान असली होते हैं। फिर आप प्रीमियम टास्क के लिए \"जमा\" करते हैं और पैसा कभी वापस नहीं आता। कोई असली नौकरी क्लिक करने के पैसे नहीं देती, और कोई नियोक्ता पैसे जमा नहीं करवाता।",
        todo: "कुछ जमा न करें। अकाउंट ब्लॉक और रिपोर्ट करें। अगर पैसे दे चुके हैं तो तुरंत 1930 पर कॉल करें; पहला घंटा सबसे अहम है।"
      },
      vendor_real: {
        title: "जाने-पहचाने वेंडर से भुगतान की याद",
        ctx: "जिस पैकेजिंग वेंडर को आप हर महीने भुगतान करते हैं, उसके सामान्य पते से ईमेल।",
        who: "सनराइज़ पैकेजिंग बिलिंग",
        subject: "भुगतान स्मरण - इनवॉइस SP/26-27/0431, देय 10 अक्टूबर",
        text: "प्रिय मेरिडियन टेक्सटाइल्स टीम, विनम्र याद दिला रहे हैं कि ₹86,000 का इनवॉइस SP/26-27/0431 10 अक्टूबर को देय है। [[ok|हमारे बैंक विवरण नहीं बदले हैं और आपके पास मौजूद इनवॉइस पर छपे हैं।]] [[ok|अगर हमारा बैंक खाता बदलने को कहने वाला कोई ईमेल मिले, तो भुगतान से पहले अपने रिकॉर्ड वाले नंबर पर हमारे ऑफिस को कॉल करें।]] धन्यवाद।",
        why: "जाने-पहचाने वेंडर पते से नियमित याद, कोई नया बैंक विवरण नहीं, कोई धमकी नहीं, और वेंडर खुद कहता है कि कुछ अलग लगे तो फ़ोन पर पुष्टि करें। असली साझेदार ऐसे ही व्यवहार करता है।",
        todo: "अपनी सामान्य प्रक्रिया से रिकॉर्ड में पहले से मौजूद खाते में भुगतान करें। बदलाव की किसी भी माँग की पुष्टि जाने-पहचाने फ़ोन नंबर पर करें।"
      },
      deepfake: {
        title: "MD की आवाज़ तुरंत ट्रांसफ़र माँगती है",
        ctx: "अनजान नंबर से फ़ोन कॉल। आवाज़ बिल्कुल आपके MD जैसी है, पीछे एयरपोर्ट का शोर।",
        who: "\"राजेश सर\" (MD की आवाज़)",
        subject: "",
        text: "\"हैलो, मैं ही बोल रहा हूँ, एयरपोर्ट पर हूँ, शोर सुनाई दे रहा होगा। [[urgent|दुबई ऑर्डर के नए सप्लायर को अभी ₹2,00,000 ट्रांसफ़र करो]]। [[newacct|खाता नंबर WhatsApp पर भेज रहा हूँ।]] [[secret|वापस कॉल मत करना, फ़ोन फ़्लाइट मोड पर जा रहा है, लैंड करने से पहले कर देना।]]\"",
        why: "AI किसी भाषण या वीडियो की 30 सेकंड की क्लिप से किसी की भी आवाज़ की नकल कर सकता है। नकली आवाज़ + नया खाता नंबर + \"वापस कॉल मत करना\" यही डीपफ़ेक स्कैम है। पीछे का शोर जानबूझकर जोड़ा जाता है।",
        todo: "कहें कि वापस कॉल करेंगे, फिर MD को सहेजे नंबर पर कॉल करें या किसी दूसरे वरिष्ठ से जाँचें। ज़रूरी फ़ोन अनुरोधों के लिए टीम में एक कोड शब्द तय करें। सामान्य मंज़ूरी के बिना कोई ट्रांसफ़र नहीं।"
      },
      qr_receive: {
        title: "खरीदार पैसे \"पाने\" के लिए QR भेजता है",
        ctx: "आपने क्लासिफ़ाइड साइट पर 12 पुरानी ऑफिस कुर्सियों का विज्ञापन दिया। खरीदार WhatsApp पर लिखता है।",
        who: "ऑफिस कुर्सियों का खरीदार",
        subject: "",
        text: "हैलो, ₹18,000 में 12 पुरानी ऑफिस कुर्सियों का आपका विज्ञापन देखा। पूरी रकम अभी दे रहा हूँ। [[upi|QR कोड भेजा है: इसे स्कैन करें और पैसे पाने के लिए अपना UPI PIN डालें।]] [[odd|मैं आर्मी अफ़सर हूँ, बाहर पोस्टेड, इसलिए मेरा दोस्त कुर्सियाँ ले जाएगा।]] [[urgent|अगले 5 मिनट में कर दें, मेरा नेटवर्क कमज़ोर है।]]",
        why: "पैसे पाने के लिए कभी QR स्कैन या PIN नहीं डालना पड़ता। स्कैन करके PIN डालना सामने वाले को पैसे देता है। \"आर्मी अफ़सर\" की कहानी और जल्दी क्लासिफ़ाइड साइटों की आम चालें हैं।",
        todo: "मना करें। खरीदार से कहें कि आपकी UPI ID पर पैसे भेजे; पाने के लिए आपको कुछ नहीं करना। ऐप में नंबर की रिपोर्ट करें।"
      },
      fake_care: {
        title: "सर्च में मिला कस्टमर-केयर नंबर",
        ctx: "रिफ़ंड नहीं आया। आपने ऑनलाइन बैंक का कस्टमर केयर खोजा और पहला दिखा नंबर डायल किया।",
        who: "\"नोवाबैंक कस्टमर केयर\"",
        subject: "",
        text: "\"नोवाबैंक कस्टमर केयर को कॉल करने के लिए धन्यवाद। ₹3,200 के रिफ़ंड के लिए आपकी पुष्टि ज़रूरी है। [[otp|कृपया अपना 16 अंकों का कार्ड नंबर, एक्सपायरी तारीख और अभी आने वाला OTP बताएँ।]] [[remote|साथ ही मैं जो क्विक सपोर्ट ऐप भेज रहा हूँ उसे इंस्टॉल करें ताकि काम जल्दी हो।]]\"",
        why: "आपने सर्च नतीजों या नकली वेबसाइट पर रखा नकली नंबर डायल किया। कोई बैंक पूरा कार्ड नंबर, एक्सपायरी, CVV या OTP नहीं माँगता, और रिमोट-कंट्रोल ऐप इंस्टॉल करने को कभी नहीं कहता।",
        todo: "कॉल काटें। सिर्फ़ कार्ड के पीछे छपा या आधिकारिक ऐप के अंदर का नंबर इस्तेमाल करें। कॉल करने वाले के कहने पर कोई ऐप इंस्टॉल न करें। कुछ बता दिया हो तो ऐप में तुरंत कार्ड ब्लॉक करें और 1930 पर कॉल करें।"
      },
      hr_real: {
        title: "HR से दिवाली छुट्टियों की सूची",
        ctx: "कंपनी के HR पते से सभी कर्मचारियों को ईमेल।",
        who: "HR विभाग",
        subject: "दिवाली सप्ताह की छुट्टियों की सूची",
        text: "सभी को नमस्ते, दिवाली के लिए दफ्तर 7 से 9 नवंबर तक बंद रहेगा। [[ok|पूरी छुट्टी सूची इंट्रानेट के HR पेज पर है]], वही पेज जो आप छुट्टी के लिए इस्तेमाल करते हैं। [[ok|आपको कुछ करने की ज़रूरत नहीं।]] सबको सुखद और सुरक्षित दिवाली की शुभकामनाएँ। - HR टीम",
        why: "कंपनी के अपने HR पते से भेजा गया, सिर्फ़ जानकारी, बाहरी साइट का कोई लिंक नहीं, खोलने को कोई अटैचमेंट नहीं और भरने को कुछ नहीं। असली सूचनाओं को जल्दबाज़ी की ज़रूरत नहीं होती।",
        todo: "कुछ नहीं करना। अगर छुट्टी या बोनस वाला ईमेल लॉगिन या बैंक विवरण भरने को कहे, तो उसे लाल झंडा मानें और HR से सीधे पूछें।"
      },
      screen_share: {
        title: "\"UPI हेल्पलाइन\" आपकी स्क्रीन देखना चाहती है",
        ctx: "UPI भुगतान फ़ेल होने और सोशल मीडिया पर शिकायत करने के कुछ मिनट बाद कॉल।",
        who: "\"UPI हेल्पलाइन\"",
        subject: "",
        text: "\"सर, आपका ₹1,500 का UPI भुगतान अटका है। 2 मिनट में ठीक कर देता हूँ। [[remote|मेरे भेजे लिंक से स्क्रीन-शेयरिंग ऐप इंस्टॉल करें और स्क्रीन पर दिख रहा 9 अंकों का कोड बताएँ।]] अपना बैंकिंग ऐप खुला रखें, मुझे बस देखना है। [[otp|OTP आए तो कॉल मत काटिए, मैं बताता हूँ क्या करना है।]]\"",
        why: "रिमोट-एक्सेस और स्क्रीन-शेयरिंग ऐप कॉल करने वाले को आपका फ़ोन देखने और चलाने देते हैं; 9 अंकों का कोड पूरा नियंत्रण दे देता है। OTP के साथ वे मिनटों में खाता खाली कर सकते हैं। असली हेल्पलाइन कभी आपकी स्क्रीन नहीं माँगती।",
        todo: "कॉल काटें और इंस्टॉल किया कोई भी ऐप हटाएँ। शिकायत सिर्फ़ आधिकारिक UPI या बैंक ऐप के अंदर करें। पैसा गया हो तो तुरंत 1930 और अपने बैंक को कॉल करें।"
      },
      invoice_exe: {
        title: ".exe पर खत्म होने वाला इनवॉइस अटैचमेंट",
        ctx: "ऐसी कंपनी से अकाउंट्स मेलबॉक्स में ईमेल जिससे खरीदारी याद नहीं।",
        who: "ग्लोबल ट्रेड सप्लाइज़",
        subject: "इनवॉइस संलग्न - कृपया प्रोसेस करें",
        text: "[[odd|महोदय,]] पिछले हफ्ते दिए सामान का इनवॉइस संलग्न है। [[attach|अटैचमेंट: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|कृपया आज ही भुगतान प्रोसेस करें]] और पुष्टि करें। [[odd|सादर, अकाउंट्स विभाग]]",
        why: ".exe पर खत्म होने वाली फ़ाइल प्रोग्राम है, PDF नहीं; नाम में \".pdf\" छलावा है। खोलने पर मैलवेयर या रैनसमवेयर इंस्टॉल होता है जो दफ्तर का हर कंप्यूटर लॉक कर सकता है। अस्पष्ट अभिवादन और कंपनी हस्ताक्षर का न होना अतिरिक्त चेतावनी है।",
        todo: "अटैचमेंट न खोलें। ईमेल की रिपोर्ट IT को करें। रिकॉर्ड देखें: क्या सच में इस कंपनी से कुछ खरीदा? दफ्तर के कंप्यूटरों पर \"फ़ाइल एक्सटेंशन दिखाएँ\" चालू करें ताकि ऐसी चालें दिखें।"
      },
      echallan: {
        title: "ऐप लिंक वाला ट्रैफ़िक ई-चालान SMS",
        ctx: "शाम को ऑफिस ड्राइवर के फ़ोन पर SMS।",
        who: "",
        subject: "",
        text: "ट्रैफ़िक ई-चालान: आपका वाहन KA-05-XX-1234 1 अक्टूबर को सिग्नल तोड़ते रिकॉर्ड हुआ। [[money|जुर्माना ₹1,000।]] दोगुने जुर्माने और कोर्ट समन से बचने के लिए [[urgent|24 घंटे में भुगतान करें]]। [[link|आधिकारिक चालान ऐप डाउनलोड करें: echallan-pay.example.net/app.apk]]",
        why: "असली ई-चालान मैसेज सरकारी सेंडर ID से आते हैं, निजी मोबाइल नंबर से नहीं, और कभी .apk फ़ाइल डाउनलोड करने को नहीं कहते। वह APK दुर्भावनापूर्ण ऐप है जो आपके SMS और OTP पढ़ता है।",
        todo: "मैसेज हटाएँ। चालान सिर्फ़ सरकार की आधिकारिक ई-चालान वेबसाइट या राज्य पुलिस ऐप पर देखें। नंबर की रिपोर्ट संचार साथी (चक्षु) पर करें।"
      },
      parcel_real: {
        title: "अपेक्षित पार्सल की डिलीवरी सूचना",
        ctx: "आपने पिछले हफ्ते पैकेजिंग सामग्री मँगाई थी। यह SMS आता है।",
        who: "",
        subject: "",
        text: "स्पीडपार्सल: सनराइज़ पैकेजिंग से आपका शिपमेंट SP48213 [[ok|आज दोपहर 2 से 5 बजे के बीच डिलीवर होगा।]] [[ok|कोई भुगतान बकाया नहीं।]] [[ok|ट्रैक करने के लिए हमारी वेबसाइट या ऐप पर अपना शिपमेंट नंबर डालें।]]",
        why: "पंजीकृत सेंडर ID से भेजा गया (निजी नंबर नहीं), अपेक्षित पार्सल से मेल खाता है, पैसे नहीं माँगता और टैप करने को कोई लिंक नहीं। असली डिलीवरी मैसेज बस जानकारी देता है।",
        todo: "कुछ नहीं करना। अगर पार्सल मैसेज फ़ीस, लिंक या ऐप माँगे, तो रुकें और आधिकारिक वेबसाइट पर शिपमेंट नंबर से जाँचें।"
      },
      kyc: {
        title: "KYC खत्म, खाता आज ब्लॉक",
        ctx: "रात में मालिक के फ़ोन पर SMS।",
        who: "",
        subject: "",
        text: "प्रिय ग्राहक, KYC खत्म होने के कारण [[threat|आपका नोवाबैंक खाता आज ब्लॉक कर दिया जाएगा]]। [[link|novabank-kyc-update.example.net]] पर [[urgent|तुरंत अपडेट करें]] या [[sender|हमारे अधिकारी को 94XXX XXX51 पर कॉल करें]]।",
        why: "बैंक निजी मोबाइल नंबर से KYC लिंक कभी नहीं भेजते और घंटों में खाता ब्लॉक नहीं करते। लिंक नकली बैंक पेज खोलता है जो आपका लॉगिन और OTP चुराता है; \"अधिकारी\" ऐप इंस्टॉल करवाता है।",
        todo: "लिंक न टैप करें, कॉल न करें। KYC सच में बाकी हो तो बैंक का अपना ऐप या शाखा बताएगी। SMS की रिपोर्ट संचार साथी (चक्षु) पर करें।"
      },
      sim_swap: {
        title: "कॉल: आपका SIM बंद कर दिया जाएगा",
        ctx: "ऑफिस मैनेजर को कॉल, जो इसी नंबर पर बैंक OTP पाती हैं।",
        who: "\"टेलीकॉम कंपनी का कर्मचारी\"",
        subject: "",
        text: "\"मैडम, आपके मोबाइल नेटवर्क से बोल रहे हैं। 5G अपग्रेड बाकी होने से [[threat|आपका SIM 24 घंटे में बंद कर दिया जाएगा]]। [[otp|अपग्रेड के लिए SIM कार्ड पर छपा 20 अंकों का नंबर पढ़कर बताएँ और SMS आने के बाद 1 दबाएँ।]] [[urgent|यह ऑफ़र आज ही खत्म है।]]\"",
        why: "यह SIM-स्वैप की कोशिश है। 20 अंकों के SIM नंबर और आपके \"1\" से ठग आपका नंबर अपने SIM पर चालू कर लेता है। आपका फ़ोन बंद हो जाता है और बैंकिंग व UPI का हर OTP उसके पास जाता है।",
        todo: "कॉल काटें। टेलीकॉम कंपनियाँ 5G अपग्रेड के लिए कॉल नहीं करतीं। फ़ोन का नेटवर्क अचानक लंबे समय तक चला जाए तो पहले बैंक को, फिर ऑपरेटर को कॉल करें। संचार साथी पर अपने नाम के SIM जाँचें।"
      },
      mfa: {
        title: "आधी रात से सातवाँ लॉगिन अनुरोध",
        ctx: "रात में ऑफिस लॉगिन ऐप से साइन-इन मंज़ूरी के अनुरोध आते रहते हैं। फिर एक कॉल आती है।",
        who: "SecureLogin ऐप",
        subject: "",
        text: "[[otp|साइन-इन मंज़ूर करें? कोई नए डिवाइस से आपके ऑफिस खाते में साइन-इन करने की कोशिश कर रहा है। जारी रखने के लिए APPROVE टैप करें।]] [[odd|(आधी रात से यह सातवाँ अनुरोध है।)]] थोड़ी देर बाद कॉल करने वाला कहता है: \"[[urgent|IT से बोल रहे हैं, सर्वर ठीक कर रहे हैं। बस अनुरोध मंज़ूर कर दीजिए ताकि अलर्ट बंद हों।]]\"",
        why: "यह \"MFA थकान\" है। हमलावर के पास आपका पासवर्ड पहले से है और वह मंज़ूरी अनुरोधों की बौछार कर रहा है ताकि आप तंग आकर Approve दबा दें। \"IT\" की कॉल हमले का हिस्सा है। असली IT कभी उस लॉगिन को मंज़ूर करने को नहीं कहता जो आपने शुरू नहीं किया।",
        todo: "हर बार Deny टैप करें। भरोसेमंद डिवाइस से तुरंत पासवर्ड बदलें और IT को बताएँ। बार-बार अनुरोध का मतलब है आपका पासवर्ड लीक हो चुका है।"
      },
      gst_real: {
        title: "CA से मासिक GST याद",
        ctx: "आपके चार्टर्ड अकाउंटेंट के सहेजे नंबर से WhatsApp मैसेज।",
        who: "मेहता एंड कंपनी (हमारे CA)",
        subject: "",
        text: "सुप्रभात। याद दिला रहा हूँ: सितंबर का GSTR-3B 20 अक्टूबर तक भरना है। [[ok|कृपया बिक्री और खरीद की शीट हर महीने वाले साझा फ़ोल्डर में अपलोड करें।]] [[ok|अभी आपकी ओर से कोई भुगतान नहीं चाहिए]]; फ़ाइलिंग के बाद चालान विवरण भेजूँगा और हमारी नियमित कॉल पर पुष्टि कर लेंगे।",
        why: "जाने-पहचाने CA, सहेजा नंबर, हर महीने की सामान्य प्रक्रिया, कोई नया खाता नंबर नहीं, कोई लिंक नहीं और असली देय तारीख के अलावा कोई जल्दी नहीं। पुष्टि आपकी नियमित कॉल पर होती है।",
        todo: "अपनी सामान्य प्रक्रिया अपनाएँ। अगर किसी दिन \"CA\" नया बैंक खाता भेजे या लिंक से भुगतान करने को कहे, तो पहले CA ऑफिस को जाने-पहचाने नंबर पर कॉल करें।"
      },
      lookalike: {
        title: "मिलते-जुलते डोमेन पर सैलरी स्लिप",
        ctx: "संशोधित सैलरी स्लिप के बारे में ईमेल। आपकी कंपनी का असली डोमेन meridiantextiles.example.com है।",
        who: "पेरोल टीम",
        subject: "आपकी संशोधित सैलरी स्लिप तैयार है",
        text: "प्रिय कर्मचारी, अक्टूबर से आपका सैलरी ढाँचा संशोधित हुआ है। [[link|नई स्लिप देखने के लिए meridian-textiles-portal.example.com पर अपने ऑफिस पासवर्ड से लॉगिन करें।]] [[urgent|लिंक 12 घंटे में खत्म हो जाएगा।]] [[sender|भेजा गया: payroll@meridian-textiles.example.com]]",
        why: "कंपनी का असली डोमेन meridiantextiles.example.com है; ईमेल meridian-textiles (हाइफ़न के साथ) इस्तेमाल करता है, जो मिलता-जुलता डोमेन है। लिंक नकली लॉगिन पेज पर ले जाता है जो ऑफिस पासवर्ड चुराता है। सैलरी स्लिप उसी HR पोर्टल पर होगी जो आप हमेशा इस्तेमाल करते हैं।",
        todo: "क्लिक न करें। HR पोर्टल पता टाइप करके या बुकमार्क से खुद खोलें। ईमेल की रिपोर्ट IT को करें; फ़ॉरवर्ड करने से वे सबके लिए नकली डोमेन ब्लॉक कर सकते हैं।"
      },
      usb: {
        title: "पार्किंग में मिली पेन ड्राइव",
        ctx: "सोमवार सुबह, दफ्तर के गेट के पास।",
        who: "ऑफिस पार्किंग में मिली पेन ड्राइव",
        subject: "",
        text: "गेट के पास एक पेन ड्राइव पड़ी है, लेबल: [[prize|\"सैलरी रिवीज़न 2026 - गोपनीय - सिर्फ़ प्रबंधन के लिए\"]]। एक सहकर्मी कहता है: \"[[remote|रिसेप्शन के PC में लगाकर देखते हैं किसकी है।]]\"",
        why: "यह \"USB ड्रॉप\" है। हमलावर लुभावने लेबल वाली पेन ड्राइव छोड़ जाते हैं; लगाते ही छिपा सॉफ़्टवेयर खुद इंस्टॉल होकर पूरे ऑफिस नेटवर्क में फैल सकता है। जिज्ञासा ही हमला है।",
        todo: "इसे कहीं न लगाएँ। लिफ़ाफ़े में रखकर IT या सुरक्षा को सौंपें। कंपनियों को ऑटो-रन बंद रखना चाहिए और अनजान USB डिवाइस ब्लॉक करने चाहिए।"
      },
      wifi: {
        title: "मुफ़्त एयरपोर्ट Wi-Fi ईमेल पासवर्ड माँगता है",
        ctx: "फ़्लाइट के इंतज़ार में आप दो वेंडर भुगतान मंज़ूर करने के लिए मुफ़्त नेटवर्क से जुड़ते हैं।",
        who: "एयरपोर्ट पर मुफ़्त Wi-Fi लॉगिन स्क्रीन",
        subject: "",
        text: "नेटवर्क: Airport_Free_WiFi_5G (बिना पासवर्ड)। [[otp|जारी रखने के लिए अपने ईमेल पते और ईमेल पासवर्ड से साइन इन करें।]] फिर आप फ़्लाइट के इंतज़ार में [[data|कंपनी के बैंकिंग पोर्टल पर दो वेंडर भुगतान मंज़ूर करने]] की सोचते हैं।",
        why: "कोई भी आधिकारिक-सा नाम वाला हॉटस्पॉट बना सकता है। नकली नेटवर्क पर हमलावर देख सकता है कि आप क्या टाइप करते हैं, और ईमेल पासवर्ड माँगने वाला लॉगिन पेज क्रेडेंशियल चुरा रहा है। सार्वजनिक Wi-Fi पर बैंकिंग जोखिम है।",
        todo: "काम और बैंकिंग के लिए अपना मोबाइल डेटा या कंपनी का VPN इस्तेमाल करें। Wi-Fi लॉगिन पेज पर ऑफिस या ईमेल पासवर्ड कभी न टाइप करें। खुले नेटवर्क से अपने आप जुड़ना बंद करें।"
      },
      upi_real: {
        title: "भुगतान प्राप्त होने की सूचना",
        ctx: "काउंटर पर रहते हुए आपके अपने UPI ऐप से नोटिफ़िकेशन।",
        who: "UPI ऐप",
        subject: "",
        text: "[[ok|अनीता ट्रेडर्स से ₹2,500 प्राप्त हुए]] आपके 4471 पर खत्म होने वाले चालू खाते में। [[ok|कोई कार्रवाई ज़रूरी नहीं।]] लेन-देन ID 628104...",
        why: "अंदर आने वाले पैसे के लिए कभी PIN, OTP या स्कैन नहीं चाहिए। नोटिफ़िकेशन आपके अपने ऐप से है, भेजने वाले का नाम बताता है और आपसे कुछ नहीं माँगता। इसकी तुलना \"कलेक्ट रिक्वेस्ट\" या स्कैन करने को कहे गए QR से करें: वे पैसा बाहर ले जाते हैं।",
        todo: "कुछ नहीं करना। रकम अपने इनवॉइस से मिलाएँ। अगर \"भुगतान प्राप्त\" मैसेज कभी मंज़ूरी, PIN या स्कैन माँगे, तो वह पैसा ले रहा है, दे नहीं रहा।"
      },
      dpdp: {
        title: "सहकर्मी WhatsApp पर ग्राहक सूची माँगता है",
        ctx: "शाम को सेल्स सहकर्मी के नंबर से WhatsApp मैसेज।",
        who: "समीर (सेल्स सहकर्मी)",
        subject: "",
        text: "भाई, आज घर से काम कर रहा हूँ। [[data|फ़ोन नंबर और आधार कॉपी के साथ पूरी ग्राहक सूची एक्सपोर्ट करके इसी WhatsApp पर भेज दो]], बाद में डिलीट कर दूँगा। [[urgent|कैंपेन के लिए 10 मिनट में चाहिए।]] [[secret|मैनेजर को बताने की ज़रूरत नहीं, छोटी सी बात है।]]",
        why: "ग्राहकों के फ़ोन नंबर और आधार कॉपी भारत के DPDP कानून से सुरक्षित निजी डेटा हैं। निजी WhatsApp पर भेजने से वे कंपनी के नियंत्रण से बाहर चले जाते हैं, और यह हैक हुआ अकाउंट या नकली पहचान भी हो सकता है। \"मैनेजर को मत बताना\" कभी स्वीकार्य नहीं।",
        todo: "विनम्रता से मना करें। ग्राहक डेटा सिर्फ़ कंपनी के मंज़ूर सिस्टम से, मैनेजर की मंज़ूरी के साथ और सिर्फ़ ज़रूरी फ़ील्ड ही साझा करें। सहकर्मी का अकाउंट अजीब लगे तो उसे कॉल करें।"
      },
      otp_call: {
        title: "\"फ्रॉड विभाग\" को भुगतान रद्द करने के लिए OTP चाहिए",
        ctx: "कॉल के दौरान ही आपके फ़ोन पर OTP SMS आता है।",
        who: "\"नोवाबैंक फ्रॉड विभाग\"",
        subject: "",
        text: "\"सर, [[threat|अभी आपके कार्ड पर ₹49,999 का लेन-देन हो रहा है।]] इसे रद्द करने के लिए [[urgent|हमें 60 सेकंड में कार्रवाई करनी होगी]]। [[otp|अभी आपके फ़ोन पर आया OTP बताइए, मैं इसे उलट देता हूँ।]] [[secret|कृपया कॉल न काटें और किसी को कॉल न करें।]]\"",
        why: "\"अभी आया\" OTP स्कैमर की अपनी कोशिश का है, जो आपके कार्ड से भुगतान कर रहा है। उसे पढ़कर बताने से भुगतान पूरा हो जाता है। बैंक कुछ भी रद्द करने के लिए OTP कभी नहीं माँगते, और 60 सेकंड की घबराहट इसलिए बनाई जाती है कि आप सोच न सकें।",
        todo: "कॉल काटें। अपने बैंक ऐप में खुद कार्ड ब्लॉक करें या कार्ड के पीछे के नंबर पर कॉल करें। OTP किसी को कभी न पढ़कर बताएँ। पैसा गया हो तो तुरंत 1930 पर कॉल करें।"
      },
      hr_bonus: {
        title: "दिवाली बोनस फ़ॉर्म नेट-बैंकिंग लॉगिन माँगता है",
        ctx: "दिवाली से ठीक पहले HR जैसे दिखने वाले पते से सभी कर्मचारियों को ईमेल।",
        who: "HR रिवॉर्ड्स टीम",
        subject: "दिवाली बोनस ₹25,000 - अपना बैंक खाता पुष्ट करें",
        text: "प्रिय टीम सदस्य, ₹25,000 के दिवाली बोनस की घोषणा करते हुए खुशी हो रही है। [[attach|संलग्न फ़ॉर्म (Bonus_Form.html) खोलें]] और [[otp|अपना नेट-बैंकिंग यूज़र ID और पासवर्ड डालें]] ताकि बोनस सीधे जमा हो। [[urgent|आज शाम 6 बजे के बाद मिले फ़ॉर्म प्रोसेस नहीं होंगे।]] [[sender|HR रिवॉर्ड्स - meridiantextiles-bonus.example.net]]",
        why: "HR के पास आपका सैलरी खाता पहले से है; कोई कंपनी बोनस के लिए नेट-बैंकिंग लॉगिन नहीं माँगती। भेजने वाला मिलता-जुलता डोमेन है, HTML अटैचमेंट नकली बैंक लॉगिन पेज है, और उसी दिन की समय-सीमा दबाव बढ़ाती है।",
        todo: "अटैचमेंट न खोलें, कुछ न भरें। HR से सीधे या इंट्रानेट पर पूछें। ईमेल की रिपोर्ट IT को करें ताकि सहकर्मी सावधान रहें।"
      },
      electricity: {
        title: "आज रात ऑफिस की बिजली कटेगी",
        ctx: "रात 8:35 पर दुकान मालिक के फ़ोन पर SMS।",
        who: "",
        subject: "",
        text: "प्रिय उपभोक्ता, [[threat|आपके ऑफिस का बिजली कनेक्शन आज रात 9:30 बजे काट दिया जाएगा]] क्योंकि [[odd|पिछले महीने का बिल हमारे सिस्टम में अपडेट नहीं है]]। कृपया हमारे अधिकारी से [[sender|93XXX XXX40]] पर [[urgent|तुरंत]] संपर्क करें।",
        why: "बिजली बोर्ड निजी मोबाइल से एक SMS के बाद रात में कनेक्शन नहीं काटते। कॉल करने पर \"अधिकारी\" ऐप इंस्टॉल करने या लिंक से ₹10 भरने को कहता है, और असली निशाना आपका बैंक खाता है।",
        todo: "कॉल न करें। बिल बिजली बोर्ड के आधिकारिक ऐप या दफ्तर में देखें। नंबर की रिपोर्ट संचार साथी (चक्षु) पर करें।"
      },
      wa_hijack: {
        title: "सहकर्मी 6 अंकों का कोड फ़ॉरवर्ड करने को कहता है",
        ctx: "सहकर्मी के सहेजे नंबर से देर रात WhatsApp मैसेज, आपके फ़ोन पर कोड वाला SMS आने के ठीक बाद।",
        who: "रोहन (सहकर्मी)",
        subject: "",
        text: "अरे, इतनी रात को परेशान करने के लिए माफ़ी। [[odd|WhatsApp में लॉगिन करते समय गलती से तुम्हारा नंबर डल गया और 6 अंकों का कोड तुम्हारे फ़ोन पर चला गया।]] [[otp|वह कोड मुझे फ़ॉरवर्ड कर दो]], [[urgent|जल्दी, वरना मेरा अकाउंट लॉक हो जाएगा।]]",
        why: "आया हुआ कोड आपके अपने WhatsApp का वेरिफ़िकेशन कोड है। जिसे मिलेगा वह आपका अकाउंट कब्ज़े में लेकर आपके सभी संपर्कों और ऑफिस ग्रुप से पैसे माँगेगा। मैसेज खुद सहकर्मी के पहले से हैक हुए अकाउंट से आ सकता है।",
        todo: "वेरिफ़िकेशन कोड कभी फ़ॉरवर्ड न करें। सहकर्मी को फ़ोन करके बताएँ कि उसका अकाउंट हैक हुआ है। WhatsApp सेटिंग में टू-स्टेप वेरिफ़िकेशन चालू करें।"
      },
      invest_group: {
        title: "पक्के रिटर्न वाला स्टॉक-टिप्स ग्रुप",
        ctx: "आपको बिना पूछे WhatsApp ग्रुप में जोड़ा गया।",
        who: "VIP स्टॉक टिप्स - ग्रुप एडमिन",
        subject: "",
        text: "हमारे प्रीमियम ग्रुप में स्वागत है! [[prize|पक्की इनसाइडर टिप्स से हमारे सदस्यों ने पिछले महीने 32% रिटर्न कमाया।]] हमारा ट्रेडिंग ऐप [[link|इस लिंक से डाउनलोड करें, ऐप स्टोर से नहीं]], और [[money|₹50,000 की जमा से शुरू करें]]। [[prize|सदस्यों के मुनाफ़े के स्क्रीनशॉट देखें!]] [[urgent|एंट्री आधी रात को बंद।]]",
        why: "रिटर्न की गारंटी कोई नहीं दे सकता, और \"इनसाइडर टिप्स\" गैरकानूनी हैं। ऐप नकली है: यह काल्पनिक मुनाफ़ा दिखाता है ताकि आप और जमा करें, और निकासी कभी नहीं होती। स्क्रीनशॉट डालने वाले \"सदस्य\" खुद स्कैमर हैं।",
        todo: "ग्रुप छोड़ें और रिपोर्ट करें। सिर्फ़ SEBI-पंजीकृत ब्रोकर और आधिकारिक ऐप स्टोर के ऐप से निवेश करें। जमा कर चुके हों तो 1930 पर कॉल करें और cybercrime.gov.in पर रिपोर्ट करें।"
      },
      bank_real: {
        title: "आपके किए भुगतान का डेबिट अलर्ट",
        ctx: "आपकी अकाउंट्स टीम ने आज पैकेजिंग वेंडर को भुगतान किया। यह SMS आता है।",
        who: "",
        subject: "",
        text: "नोवाबैंक: [[ok|4471 पर खत्म होने वाले खाते से 10 अक्टूबर को सनराइज़ पैकेजिंग को NEFT के लिए ₹86,000 डेबिट]], संदर्भ N26101034। शेष ₹3,42,118। [[ok|अगर यह आपने नहीं किया, तो अपने डेबिट कार्ड के पीछे दिए नंबर पर कॉल करें।]]",
        why: "यह आज अकाउंट्स टीम के किए भुगतान से मेल खाता है, बैंक की सेंडर ID से आया है, SMS में कोई लिंक या नंबर नहीं है और आपको आपके अपने कार्ड के नंबर की ओर भेजता है।",
        todo: "इसे अपने भुगतान रिकॉर्ड से मिलाएँ। कोई डेबिट अलर्ट आपके किए भुगतान से मेल न खाए तो कार्ड के नंबर से तुरंत बैंक को कॉल करें, मैसेज के नंबर से नहीं।"
      }
    }
  },
  bn: {
    scenarios: {
      ceo_gift: {
        title: "নতুন নম্বর থেকে বস গিফট কার্ড চাইছেন",
        ctx: "সকাল 9টায় অ্যাকাউন্টস এক্সিকিউটিভকে WhatsApp মেসেজ। প্রোফাইল ছবিটি কোম্পানির ওয়েবসাইট থেকে নেওয়া MD-র ছবি।",
        who: "রাজেশ স্যার (নতুন নম্বর)",
        subject: "",
        text: "হাই, আমি রাজেশ। [[sender|আমার পুরনো ফোন খারাপ হয়ে গেছে, আপাতত এই নম্বর ব্যবহার করছি।]] একটা বড় ক্লায়েন্টের সঙ্গে মিটিংয়ে আছি। [[money|₹5,000-এর 10টা গিফট কার্ড কেনো]] আর কোডগুলো আমাকে [[urgent|30 মিনিটের মধ্যে]] পাঠাও। [[secret|কারও সঙ্গে এটা নিয়ে কথা বোলো না, ক্লায়েন্টের জন্য সারপ্রাইজ।]]",
        why: "স্ক্যামাররা ওয়েবসাইট থেকে MD-র ছবি কপি করে নতুন নম্বর থেকে লেখে। আসল বস কখনও গিফট-কার্ড কোড বা গোপনীয়তা চান না। নতুন নম্বর + তাড়া + গোপনীয়তা, এটাই ক্লাসিক \"CEO জালিয়াতি\"।",
        todo: "কিছু কিনবেন না। বসকে ফোনে সেভ করা নম্বরে কল করুন বা তাঁর কেবিনে যান। IT বা ম্যানেজারকে বলুন যাতে পুরো অফিস সতর্ক হয়।"
      },
      it_real: {
        title: "IT থেকে পাসওয়ার্ড নীতির নোটিশ",
        ctx: "কোম্পানির নিজস্ব IT হেল্পডেস্ক থেকে সব কর্মীকে ইমেল।",
        who: "IT হেল্পডেস্ক",
        subject: "15 অক্টোবর থেকে পাসওয়ার্ড নীতিতে পরিবর্তন",
        text: "প্রিয় সহকর্মীরা, 15 অক্টোবর থেকে পাসওয়ার্ড অন্তত 12 অক্ষরের হতে হবে। [[ok|আজ আপনাকে কিছু করতে হবে না।]] পাসওয়ার্ডের মেয়াদ শেষ হলে [[ok|যে অফিস পোর্টাল সবসময় ব্যবহার করেন সেখানেই]] বদলান। [[ok|IT কখনও ইমেল, ফোন বা WhatsApp-এ আপনার পাসওয়ার্ড চাইবে না।]] প্রশ্ন থাকলে দোতলার হেল্পডেস্কে আসুন।",
        why: "প্রেরক কোম্পানির নিজস্ব IT ঠিকানা। ক্লিক করার লিঙ্ক নেই, অ্যাটাচমেন্ট নেই, সময়সীমা নেই, পাসওয়ার্ডের দাবি নেই। আসল নোটিশ জানায় কী হবে এবং আপনাকে স্বাভাবিক পোর্টাল নিজে ব্যবহার করতে দেয়।",
        todo: "জরুরি কিছু নেই। কোনও নোটিশ আসল কিনা সন্দেহ হলে হেল্পডেস্কে যান বা আগে থেকে জানা এক্সটেনশন নম্বরে কল করুন।"
      },
      bec_vendor: {
        title: "ভেন্ডর বলছে ব্যাঙ্ক অ্যাকাউন্ট বদলেছে",
        ctx: "₹4,80,000-এর বকেয়া ইনভয়েস নিয়ে অ্যাকাউন্টস টিমকে ইমেল।",
        who: "কাবেরী লজিস্টিকস অ্যাকাউন্টস",
        subject: "জরুরি: ইনভয়েস KL/2026/0912-এর নতুন ব্যাঙ্ক বিবরণ",
        text: "মহাশয়/মহাশয়া, [[newacct|অডিটের পর আমাদের কোম্পানির ব্যাঙ্ক অ্যাকাউন্ট বদলেছে। ₹4,80,000-এর বকেয়া ইনভয়েস নিচের নতুন অ্যাকাউন্টে পাঠান।]] শিপমেন্টে দেরি এড়াতে [[urgent|পেমেন্ট আজই ছাড়তে হবে]]। [[sender|শুধু এই ইমেল ID-তেই উত্তর দিন]], আমাদের অফিসের ফোন মেরামতে আছে।",
        why: "এটি বিজনেস ইমেল কম্প্রোমাইজ (BEC)। অপরাধীরা ভেন্ডরের ইমেল হ্যাক বা কপি করে \"নতুন ব্যাঙ্ক বিবরণ\" পাঠায়। ঠিকানা আসল ভেন্ডরের থেকে সামান্য আলাদা, ফোন \"কাজ করছে না\" যাতে যাচাই না করা যায়, আর সবই জরুরি।",
        todo: "ইমেলের ভিত্তিতে ভেন্ডরের ব্যাঙ্ক বিবরণ কখনও বদলাবেন না। পুরনো রেকর্ড বা পারচেজ অর্ডারের নম্বরে ভেন্ডরকে ফোন করুন, ইমেলের নম্বরে কখনও নয়। ব্যাঙ্ক বিবরণের প্রতিটি পরিবর্তনে দু-জনের অনুমোদন রাখুন।"
      },
      gst_notice: {
        title: "অ্যাটাচমেন্টসহ GST জরিমানার নোটিশ",
        ctx: "ভোরবেলা অ্যাকাউন্টস মেলবক্সে আসা ইমেল।",
        who: "GST দপ্তর",
        subject: "কারণ দর্শানোর নোটিশ - জরিমানা ₹1,24,500 - পদক্ষেপ জরুরি",
        text: "[[odd|প্রিয় করদাতা,]] আপনার GST রিটার্নে অমিল পাওয়া গেছে। ₹1,24,500 জরিমানা বকেয়া। না দিলে [[threat|48 ঘণ্টায় আপনার GSTIN সাসপেন্ড হবে]]। আইনি পদক্ষেপ এড়াতে [[link|সংযুক্ত নোটিশ খুলে নিরাপদ লিঙ্কে পেমেন্ট করুন]]। [[attach|অ্যাটাচমেন্ট: GST_Notice_2026.html]]",
        why: "আসল GST নোটিশ অফিসিয়াল GST পোর্টালে আপনার অ্যাকাউন্টে দেখা যায় এবং তাতে DIN (ডকুমেন্ট আইডেন্টিফিকেশন নম্বর) থাকে। \"নিরাপদ লিঙ্ক\"-সহ HTML অ্যাটাচমেন্ট একটি নকল লগইন পেজ যা GST লগইন বা পেমেন্ট বিবরণ চুরি করে। প্রেরক অফিসিয়াল gov.in ডোমেন নয়।",
        todo: "অ্যাটাচমেন্ট খুলবেন না। ঠিকানা নিজে টাইপ করে অফিসিয়াল GST পোর্টালে লগইন করুন, বা CA-কে দেখতে বলুন। ইমেলটি IT-কে এবং cybercrime.gov.in-এ রিপোর্ট করুন।"
      },
      otp_real: {
        title: "এইমাত্র শুরু করা পেমেন্টের OTP",
        ctx: "আপনি এইমাত্র প্যাকেজিং ভেন্ডরকে ₹2,500-এর UPI পেমেন্ট শুরু করেছেন। এই SMS আসে।",
        who: "",
        subject: "",
        text: "[[ok|সানরাইজ প্যাকেজিং-কে আপনার এইমাত্র শুরু করা ₹2,500-এর UPI পেমেন্টের OTP 482913।]] 10 মিনিট বৈধ। [[ok|এই OTP কারও সঙ্গে শেয়ার করবেন না, ব্যাঙ্কের সঙ্গেও নয়।]] - নোভাব্যাঙ্ক",
        why: "এই পেমেন্ট আপনি নিজে একটু আগে শুরু করেছেন, টাকার অঙ্ক ও প্রাপক মিলছে, আর মেসেজ কোড শেয়ার করতে বারণ করছে। আসল OTP শুধু আপনার নিজের চাওয়া কাজের জন্যই, আর ব্যাঙ্ক কখনও তা কাউকে বলতে বলে না।",
        todo: "OTP শুধু যে অ্যাপ ব্যবহার করছেন সেখানেই দিন। কিছু শুরু না করেই OTP এলে কেউ আপনার অ্যাকাউন্ট ব্যবহারের চেষ্টা করছে: শেয়ার করবেন না, কার্ডে ছাপা নম্বরে ব্যাঙ্ককে কল করুন।"
      },
      digital_arrest: {
        title: "\"CBI অফিসার\"-এর ভিডিও কল",
        ctx: "অচেনা নম্বর থেকে ভিডিও কল। কলকারী ইউনিফর্মে, পেছনে পতাকাসহ একটি অফিস।",
        who: "\"CBI অফিসার ভার্মা\"",
        subject: "",
        text: "\"[[threat|আপনার নামে মাদক ও 6টি পাসপোর্টসহ একটি পার্সেল বুক হয়েছে। আপনার বিরুদ্ধে মামলা হয়েছে।]] [[urgent|এই ভিডিও কলে থাকুন, কাটবেন না]], আর [[secret|কাউকে বলবেন না, পরিবারকেও নয়, তারাও নজরদারিতে আছে]]। যাচাইয়ের জন্য [[money|এই RBI ভেরিফিকেশন অ্যাকাউন্টে ₹3,50,000 ট্রান্সফার করুন]]; তদন্তের পর ফেরত পাবেন।\"",
        why: "এটি \"ডিজিটাল অ্যারেস্ট\"। কোনও পুলিশ, CBI বা আদালত ভিডিও কলে কাউকে গ্রেপ্তার করে না, আর কোনও সংস্থা \"ভেরিফিকেশন অ্যাকাউন্টে\" টাকা পাঠাতে বলে না। ইউনিফর্ম, অফিসের ব্যাকগ্রাউন্ড ও ID কার্ড সব নকল। গোপনীয়তা আর কলে আটকে রাখা আপনাকে ভাবতে দেয় না।",
        todo: "সঙ্গে সঙ্গে কল কাটুন। আসল অফিসাররা WhatsApp-এ কল করেন না। 1930-এ কল করুন বা cybercrime.gov.in-এ রিপোর্ট করুন, আর সহকর্মী বা পরিবারকে এখনই জানান।"
      },
      courier: {
        title: "কল: আপনার পার্সেল কাস্টমসে আটকে",
        ctx: "প্রথমে রেকর্ড করা কণ্ঠ, তারপর একজন ব্যক্তি। আপনি বিদেশ থেকে কিছু অর্ডার করেননি।",
        who: "\"স্পিডপার্সেল কাস্টমার সার্ভিস\"",
        subject: "",
        text: "\"নমস্কার, স্পিডপার্সেলের কাস্টমস বিভাগ থেকে বলছি। [[threat|আপনার নামের একটি পার্সেল কাস্টমসে আটকে আছে কারণ তাতে বেআইনি জিনিস আছে।]] পুলিশ কেস এড়াতে [[urgent|এখনই 1 চাপুন]] অফিসারের সঙ্গে কথা বলতে, বা আমরা যে লিঙ্ক পাঠাব তাতে [[money|₹2,999 ক্লিয়ারেন্স ফি দিন]]।\"",
        why: "কুরিয়ার কোম্পানি বেআইনি জিনিস নিয়ে কল করে না, আর কাস্টমস ফোনে ফি নেয় না। 1 চাপলে একজন নকল \"অফিসার\"-এর সঙ্গে যোগ হয়, যে তারপর ডিজিটাল-অ্যারেস্ট স্ক্যাম বা পেমেন্টের চেষ্টা করে।",
        todo: "কল কাটুন। সত্যিই কিছু অর্ডার করে থাকলে কুরিয়ারের অফিসিয়াল ওয়েবসাইটে ট্র্যাকিং নম্বর দেখুন। নম্বরটি সঞ্চার সাথী (চক্ষু) পোর্টালে রিপোর্ট করুন।"
      },
      task_job: {
        title: "Telegram চাকরি: হোটেল রেট করে দিনে ₹8,000",
        ctx: "গত সপ্তাহে অনলাইনে চাকরির আবেদনের পর Telegram-এ মেসেজ।",
        who: "HR প্রিয়া - অনলাইন জবস",
        subject: "",
        text: "অভিনন্দন, আপনি নির্বাচিত! [[prize|অনলাইনে হোটেল রেট করে দিনে ₹3,000 থেকে ₹8,000 আয় করুন]], মাত্র 20 মিনিটের কাজ। প্রথম 3টি টাস্ক বিনামূল্যে। প্রিমিয়াম টাস্কের জন্য [[money|₹5,000 জমা দিন আর এক ঘণ্টায় ₹7,500 ফেরত পান]]। [[urgent|আজ মাত্র 4টি আসন বাকি!]]",
        why: "এটি টাস্ক স্ক্যাম। বিশ্বাস তৈরির জন্য প্রথম ছোট পেমেন্টগুলি আসল হয়। তারপর প্রিমিয়াম টাস্কের জন্য \"জমা\" দেন আর টাকা আর ফেরে না। কোনও আসল চাকরি ক্লিক করার জন্য টাকা দেয় না, আর কোনও নিয়োগকর্তা টাকা জমা দিতে বলে না।",
        todo: "কিছু জমা দেবেন না। অ্যাকাউন্ট ব্লক ও রিপোর্ট করুন। ইতিমধ্যে টাকা দিয়ে থাকলে এখনই 1930-এ কল করুন; প্রথম ঘণ্টাটাই সবচেয়ে গুরুত্বপূর্ণ।"
      },
      vendor_real: {
        title: "পরিচিত ভেন্ডরের পেমেন্ট রিমাইন্ডার",
        ctx: "যে প্যাকেজিং ভেন্ডরকে প্রতি মাসে পেমেন্ট করেন, তার স্বাভাবিক ঠিকানা থেকে ইমেল।",
        who: "সানরাইজ প্যাকেজিং বিলিং",
        subject: "পেমেন্ট রিমাইন্ডার - ইনভয়েস SP/26-27/0431, 10 অক্টোবর দেয়",
        text: "প্রিয় মেরিডিয়ান টেক্সটাইলস টিম, বিনীত মনে করিয়ে দিচ্ছি ₹86,000-এর ইনভয়েস SP/26-27/0431 10 অক্টোবর দেয়। [[ok|আমাদের ব্যাঙ্ক বিবরণ বদলায়নি এবং আপনার কাছে থাকা ইনভয়েসেই ছাপা আছে।]] [[ok|আমাদের ব্যাঙ্ক অ্যাকাউন্ট বদলাতে বলা কোনও ইমেল পেলে পেমেন্টের আগে আপনার রেকর্ডের নম্বরে আমাদের অফিসে ফোন করুন।]] ধন্যবাদ।",
        why: "পরিচিত ভেন্ডর ঠিকানা থেকে নিয়মিত রিমাইন্ডার, নতুন ব্যাঙ্ক বিবরণ নেই, হুমকি নেই, আর ভেন্ডর নিজেই বলছে কিছু আলাদা লাগলে ফোনে যাচাই করতে। আসল অংশীদার ঠিক এমনই আচরণ করে।",
        todo: "স্বাভাবিক প্রক্রিয়ায় রেকর্ডে থাকা অ্যাকাউন্টেই পেমেন্ট করুন। পরিবর্তনের যে কোনও অনুরোধ পরিচিত ফোন নম্বরে নিশ্চিত করুন।"
      },
      deepfake: {
        title: "MD-র কণ্ঠ জরুরি ট্রান্সফার চাইছে",
        ctx: "অচেনা নম্বর থেকে ফোন কল। কণ্ঠ হুবহু আপনার MD-র মতো, পেছনে বিমানবন্দরের শব্দ।",
        who: "\"রাজেশ স্যার\" (MD-র কণ্ঠ)",
        subject: "",
        text: "\"হ্যালো, আমিই বলছি, এয়ারপোর্টে আছি, শব্দ শুনতে পাচ্ছ। [[urgent|দুবাই অর্ডারের নতুন সাপ্লায়ারকে এখনই ₹2,00,000 ট্রান্সফার করো]]। [[newacct|অ্যাকাউন্ট নম্বর WhatsApp-এ পাঠাচ্ছি।]] [[secret|ফিরে কল কোরো না, ফোন ফ্লাইট মোডে যাচ্ছে, আমি নামার আগে করে দিও।]]\"",
        why: "AI কোনও বক্তৃতা বা ভিডিওর 30 সেকেন্ডের ক্লিপ থেকে যে কারও কণ্ঠ নকল করতে পারে। নকল কণ্ঠ + নতুন অ্যাকাউন্ট নম্বর + \"ফিরে কল কোরো না\", এটাই ডিপফেক স্ক্যাম। পেছনের শব্দ ইচ্ছে করে যোগ করা।",
        todo: "বলুন ফিরে কল করবেন, তারপর MD-কে সেভ করা নম্বরে কল করুন বা অন্য একজন সিনিয়রের সঙ্গে যাচাই করুন। জরুরি ফোন অনুরোধের জন্য টিমে একটি কোড শব্দ ঠিক করুন। স্বাভাবিক অনুমোদন ছাড়া কোনও ট্রান্সফার নয়।"
      },
      qr_receive: {
        title: "ক্রেতা টাকা \"পেতে\" QR পাঠাচ্ছে",
        ctx: "ক্লাসিফায়েড সাইটে 12টি পুরনো অফিস চেয়ারের বিজ্ঞাপন দিয়েছেন। ক্রেতা WhatsApp-এ লেখে।",
        who: "অফিস চেয়ারের ক্রেতা",
        subject: "",
        text: "হাই, ₹18,000-এ 12টি পুরনো অফিস চেয়ারের বিজ্ঞাপন দেখলাম। পুরো টাকা এখনই দিচ্ছি। [[upi|একটি QR কোড পাঠিয়েছি: স্ক্যান করে টাকা পেতে আপনার UPI PIN দিন।]] [[odd|আমি আর্মি অফিসার, বাইরে পোস্টেড, তাই আমার বন্ধু চেয়ারগুলি নিয়ে যাবে।]] [[urgent|পরের 5 মিনিটে করে দিন, আমার নেটওয়ার্ক দুর্বল।]]",
        why: "টাকা পেতে কখনও QR স্ক্যান বা PIN দিতে হয় না। স্ক্যান করে PIN দিলে অন্যজনকে টাকা দেওয়া হয়। \"আর্মি অফিসার\"-এর গল্প আর তাড়া ক্লাসিফায়েড সাইটের চেনা চাল।",
        todo: "না বলুন। ক্রেতাকে আপনার UPI ID-তে টাকা পাঠাতে বলুন; পেতে আপনার কিছু করতে হবে না। অ্যাপে নম্বরটি রিপোর্ট করুন।"
      },
      fake_care: {
        title: "সার্চে পাওয়া কাস্টমার-কেয়ার নম্বর",
        ctx: "রিফান্ড আসেনি। আপনি অনলাইনে ব্যাঙ্কের কাস্টমার কেয়ার খুঁজে প্রথম নম্বরে ফোন করেছেন।",
        who: "\"নোভাব্যাঙ্ক কাস্টমার কেয়ার\"",
        subject: "",
        text: "\"নোভাব্যাঙ্ক কাস্টমার কেয়ারে কল করার জন্য ধন্যবাদ। ₹3,200 রিফান্ডের জন্য আপনাকে যাচাই করতে হবে। [[otp|আপনার 16 সংখ্যার কার্ড নম্বর, মেয়াদ শেষের তারিখ আর এখন যে OTP পাবেন তা বলুন।]] [[remote|আর আমি যে কুইক সাপোর্ট অ্যাপ পাঠাচ্ছি সেটি ইনস্টল করুন যাতে দ্রুত করা যায়।]]\"",
        why: "আপনি সার্চ ফলাফলে বা নকল ওয়েবসাইটে রাখা একটি নকল নম্বরে কল করেছেন। কোনও ব্যাঙ্ক পুরো কার্ড নম্বর, মেয়াদ, CVV বা OTP চায় না, আর রিমোট-কন্ট্রোল অ্যাপ ইনস্টল করতে কখনও বলে না।",
        todo: "কল কাটুন। শুধু কার্ডের পেছনে ছাপা বা অফিসিয়াল অ্যাপের ভেতরের নম্বর ব্যবহার করুন। কলকারীর কথায় কোনও অ্যাপ ইনস্টল করবেন না। কিছু বলে ফেললে অ্যাপে এখনই কার্ড ব্লক করে 1930-এ কল করুন।"
      },
      hr_real: {
        title: "HR থেকে দীপাবলির ছুটির তালিকা",
        ctx: "কোম্পানির HR ঠিকানা থেকে সব কর্মীকে ইমেল।",
        who: "HR বিভাগ",
        subject: "দীপাবলি সপ্তাহের ছুটির তালিকা",
        text: "সবাইকে নমস্কার, দীপাবলির জন্য 7 থেকে 9 নভেম্বর অফিস বন্ধ থাকবে। [[ok|পুরো ছুটির তালিকা ইন্ট্রানেটের HR পেজে আছে]], যে পেজ ছুটির জন্য ব্যবহার করেন। [[ok|আপনাকে কিছু করতে হবে না।]] সবাইকে শুভ ও নিরাপদ দীপাবলির শুভেচ্ছা। - HR টিম",
        why: "কোম্পানির নিজস্ব HR ঠিকানা থেকে পাঠানো, শুধু তথ্য, বাইরের সাইটের লিঙ্ক নেই, খোলার অ্যাটাচমেন্ট নেই, পূরণের কিছু নেই। আসল নোটিশে তাড়ার দরকার হয় না।",
        todo: "কিছু করার নেই। ছুটি বা বোনাসের ইমেল লগইন বা ব্যাঙ্ক বিবরণ পূরণ করতে বললে তাকে লাল পতাকা ধরুন আর HR-কে সরাসরি জিজ্ঞেস করুন।"
      },
      screen_share: {
        title: "\"UPI হেল্পলাইন\" আপনার স্ক্রিন দেখতে চায়",
        ctx: "UPI পেমেন্ট ব্যর্থ হয়ে সোশ্যাল মিডিয়ায় অভিযোগের কয়েক মিনিট পর কল।",
        who: "\"UPI হেল্পলাইন\"",
        subject: "",
        text: "\"স্যার, আপনার ₹1,500-এর UPI পেমেন্ট আটকে আছে। 2 মিনিটে ঠিক করে দিচ্ছি। [[remote|আমার পাঠানো লিঙ্ক থেকে স্ক্রিন-শেয়ারিং অ্যাপ ইনস্টল করে স্ক্রিনের 9 সংখ্যার কোডটি বলুন।]] ব্যাঙ্কিং অ্যাপ খোলা রাখুন, আমি শুধু দেখব। [[otp|OTP এলে কল কাটবেন না, আমি বলে দেব কী করতে হবে।]]\"",
        why: "রিমোট-অ্যাক্সেস ও স্ক্রিন-শেয়ারিং অ্যাপ কলকারীকে আপনার ফোন দেখতে ও চালাতে দেয়; 9 সংখ্যার কোড পুরো নিয়ন্ত্রণ দেয়। OTP-সহ তারা মিনিটে অ্যাকাউন্ট খালি করতে পারে। আসল হেল্পলাইন কখনও স্ক্রিন দেখতে চায় না।",
        todo: "কল কেটে ইনস্টল করা যে কোনও অ্যাপ আনইনস্টল করুন। অভিযোগ শুধু অফিসিয়াল UPI বা ব্যাঙ্ক অ্যাপের ভেতরেই করুন। টাকা চলে গেলে এখনই 1930 ও ব্যাঙ্ককে কল করুন।"
      },
      invoice_exe: {
        title: ".exe দিয়ে শেষ হওয়া ইনভয়েস অ্যাটাচমেন্ট",
        ctx: "যে কোম্পানি থেকে কিছু কেনার কথা মনে নেই, তার থেকে অ্যাকাউন্টস মেলবক্সে ইমেল।",
        who: "গ্লোবাল ট্রেড সাপ্লাইজ",
        subject: "ইনভয়েস সংযুক্ত - অনুগ্রহ করে প্রসেস করুন",
        text: "[[odd|মহাশয়,]] গত সপ্তাহে সরবরাহ করা পণ্যের ইনভয়েস সংযুক্ত। [[attach|অ্যাটাচমেন্ট: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|অনুগ্রহ করে আজই পেমেন্ট প্রসেস করে]] নিশ্চিত করুন। [[odd|বিনীত, অ্যাকাউন্টস বিভাগ]]",
        why: ".exe দিয়ে শেষ হওয়া ফাইল একটি প্রোগ্রাম, PDF নয়; নামের \".pdf\" ছদ্মবেশ। খুললে ম্যালওয়্যার বা র‍্যানসমওয়্যার ইনস্টল হয় যা অফিসের প্রতিটি কম্পিউটার লক করতে পারে। অস্পষ্ট সম্বোধন ও কোম্পানির স্বাক্ষর না থাকা বাড়তি সতর্কতা।",
        todo: "অ্যাটাচমেন্ট খুলবেন না। ইমেলটি IT-কে রিপোর্ট করুন। রেকর্ড দেখুন: সত্যিই এই কোম্পানি থেকে কিছু কিনেছেন? অফিসের কম্পিউটারে \"ফাইল এক্সটেনশন দেখান\" চালু করুন যাতে এমন চাল চোখে পড়ে।"
      },
      echallan: {
        title: "অ্যাপ লিঙ্কসহ ট্রাফিক ই-চালান SMS",
        ctx: "সন্ধ্যায় অফিসের ড্রাইভারের ফোনে SMS।",
        who: "",
        subject: "",
        text: "ট্রাফিক ই-চালান: আপনার গাড়ি KA-05-XX-1234 1 অক্টোবর সিগন্যাল ভাঙতে রেকর্ড হয়েছে। [[money|জরিমানা ₹1,000।]] দ্বিগুণ জরিমানা ও আদালতের সমন এড়াতে [[urgent|24 ঘণ্টায় পেমেন্ট করুন]]। [[link|অফিসিয়াল চালান অ্যাপ ডাউনলোড করুন: echallan-pay.example.net/app.apk]]",
        why: "আসল ই-চালান মেসেজ সরকারি প্রেরক ID থেকে আসে, ব্যক্তিগত মোবাইল নম্বর থেকে নয়, আর কখনও .apk ফাইল ডাউনলোড করতে বলে না। ওই APK একটি ক্ষতিকর অ্যাপ যা আপনার SMS ও OTP পড়ে।",
        todo: "মেসেজ মুছুন। চালান শুধু সরকারের অফিসিয়াল ই-চালান ওয়েবসাইট বা রাজ্য পুলিশের অ্যাপে দেখুন। নম্বরটি সঞ্চার সাথী (চক্ষু)-তে রিপোর্ট করুন।"
      },
      parcel_real: {
        title: "প্রত্যাশিত পার্সেলের ডেলিভারি আপডেট",
        ctx: "গত সপ্তাহে প্যাকেজিং সামগ্রী অর্ডার করেছেন। এই SMS আসে।",
        who: "",
        subject: "",
        text: "স্পিডপার্সেল: সানরাইজ প্যাকেজিং থেকে আপনার শিপমেন্ট SP48213 [[ok|আজ দুপুর 2টা থেকে 5টার মধ্যে ডেলিভারি হবে।]] [[ok|কোনও পেমেন্ট বকেয়া নেই।]] [[ok|ট্র্যাক করতে আমাদের ওয়েবসাইট বা অ্যাপে শিপমেন্ট নম্বর দিন।]]",
        why: "নিবন্ধিত প্রেরক ID থেকে পাঠানো (ব্যক্তিগত নম্বর নয়), প্রত্যাশিত পার্সেলের সঙ্গে মিলছে, টাকা চায় না, ট্যাপ করার লিঙ্ক নেই। আসল ডেলিভারি মেসেজ শুধু জানায়।",
        todo: "কিছু করার নেই। পার্সেল মেসেজ ফি, লিঙ্ক বা অ্যাপ চাইলে থামুন আর অফিসিয়াল ওয়েবসাইটে শিপমেন্ট নম্বর দিয়ে দেখুন।"
      },
      kyc: {
        title: "KYC শেষ, অ্যাকাউন্ট আজ ব্লক",
        ctx: "রাতে মালিকের ফোনে SMS।",
        who: "",
        subject: "",
        text: "প্রিয় গ্রাহক, KYC-র মেয়াদ শেষ হওয়ায় [[threat|আপনার নোভাব্যাঙ্ক অ্যাকাউন্ট আজ ব্লক হবে]]। [[link|novabank-kyc-update.example.net]]-এ [[urgent|এখনই আপডেট করুন]] বা [[sender|আমাদের অফিসারকে 94XXX XXX51-এ কল করুন]]।",
        why: "ব্যাঙ্ক কখনও ব্যক্তিগত মোবাইল নম্বর থেকে KYC লিঙ্ক পাঠায় না আর ঘণ্টার মধ্যে অ্যাকাউন্ট ব্লক করে না। লিঙ্কটি একটি নকল ব্যাঙ্ক পেজ খোলে যা লগইন ও OTP চুরি করে; \"অফিসার\" অ্যাপ ইনস্টল করতে বলে।",
        todo: "লিঙ্ক ট্যাপ করবেন না, কল করবেন না। KYC সত্যিই বাকি থাকলে ব্যাঙ্কের নিজস্ব অ্যাপ বা শাখা জানাবে। SMS-টি সঞ্চার সাথী (চক্ষু)-তে রিপোর্ট করুন।"
      },
      sim_swap: {
        title: "কল: আপনার SIM নিষ্ক্রিয় হবে",
        ctx: "অফিস ম্যানেজারকে কল, যিনি এই নম্বরেই ব্যাঙ্ক OTP পান।",
        who: "\"টেলিকম কোম্পানির কর্মী\"",
        subject: "",
        text: "\"ম্যাডাম, আপনার মোবাইল নেটওয়ার্ক থেকে বলছি। 5G আপগ্রেড বাকি থাকায় [[threat|আপনার SIM 24 ঘণ্টায় নিষ্ক্রিয় হবে]]। [[otp|আপগ্রেড করতে SIM কার্ডে ছাপা 20 সংখ্যার নম্বরটি পড়ে বলুন আর SMS আসার পর 1 চাপুন।]] [[urgent|এই অফার আজই শেষ।]]\"",
        why: "এটি SIM-সোয়াপের চেষ্টা। 20 সংখ্যার SIM নম্বর আর আপনার \"1\" দিয়ে জালিয়াত আপনার নম্বর নিজের SIM-এ চালু করে। আপনার ফোন বন্ধ হয়ে যায় আর ব্যাঙ্কিং ও UPI-র প্রতিটি OTP তার কাছে যায়।",
        todo: "কল কাটুন। টেলিকম কোম্পানি 5G আপগ্রেডের জন্য কল করে না। ফোনের নেটওয়ার্ক হঠাৎ অনেকক্ষণ চলে গেলে আগে ব্যাঙ্ককে, তারপর অপারেটরকে কল করুন। সঞ্চার সাথীতে আপনার নামের SIM দেখুন।"
      },
      mfa: {
        title: "মাঝরাত থেকে সপ্তম লগইন অনুমোদনের অনুরোধ",
        ctx: "রাতে অফিসের লগইন অ্যাপ থেকে সাইন-ইন অনুমোদনের অনুরোধে ফোন বাজতেই থাকে। তারপর একটি কল আসে।",
        who: "SecureLogin অ্যাপ",
        subject: "",
        text: "[[otp|সাইন-ইন অনুমোদন করবেন? কেউ নতুন ডিভাইস থেকে আপনার অফিস অ্যাকাউন্টে সাইন-ইনের চেষ্টা করছে। চালিয়ে যেতে APPROVE ট্যাপ করুন।]] [[odd|(মাঝরাত থেকে এটি সপ্তম অনুরোধ।)]] একটু পর কলকারী বলে: \"[[urgent|IT থেকে বলছি, সার্ভার সারাচ্ছি। অ্যালার্ট বন্ধ করতে অনুরোধটি শুধু অনুমোদন করে দিন।]]\"",
        why: "এটি \"MFA ক্লান্তি\"। আক্রমণকারীর কাছে আপনার পাসওয়ার্ড আগেই আছে আর সে অনুমোদনের অনুরোধ পাঠাতেই থাকছে, যাতে বিরক্ত হয়ে আপনি Approve চাপেন। \"IT\"-র কল আক্রমণেরই অংশ। আসল IT কখনও এমন লগইন অনুমোদন করতে বলে না যা আপনি শুরু করেননি।",
        todo: "প্রতিবার Deny ট্যাপ করুন। বিশ্বস্ত ডিভাইস থেকে এখনই পাসওয়ার্ড বদলে IT-কে জানান। বারবার অনুরোধ মানে আপনার পাসওয়ার্ড ইতিমধ্যে ফাঁস হয়েছে।"
      },
      gst_real: {
        title: "CA-র মাসিক GST রিমাইন্ডার",
        ctx: "আপনার চার্টার্ড অ্যাকাউন্ট্যান্টের সেভ করা নম্বর থেকে WhatsApp মেসেজ।",
        who: "মেহতা অ্যান্ড কোং (আমাদের CA)",
        subject: "",
        text: "সুপ্রভাত। মনে করিয়ে দিচ্ছি: সেপ্টেম্বরের GSTR-3B 20 অক্টোবরের মধ্যে। [[ok|প্রতি মাসের মতো একই শেয়ার্ড ফোল্ডারে বিক্রি ও কেনার শিট আপলোড করুন।]] [[ok|এখন আপনার দিক থেকে কোনও পেমেন্ট লাগবে না]]; ফাইলিংয়ের পর চালানের বিবরণ পাঠাব, আর আমাদের নিয়মিত কলে নিশ্চিত করে নেব।",
        why: "পরিচিত CA, সেভ করা নম্বর, প্রতি মাসের স্বাভাবিক প্রক্রিয়া, নতুন অ্যাকাউন্ট নম্বর নেই, লিঙ্ক নেই, আসল শেষ তারিখ ছাড়া কোনও তাড়া নেই। যাচাই হয় আপনার নিয়মিত কলে।",
        todo: "স্বাভাবিক প্রক্রিয়া মেনে চলুন। কোনও দিন \"CA\" নতুন ব্যাঙ্ক অ্যাকাউন্ট পাঠালে বা লিঙ্কে পেমেন্ট করতে বললে আগে CA অফিসে পরিচিত নম্বরে ফোন করুন।"
      },
      lookalike: {
        title: "একইরকম দেখতে ডোমেনে স্যালারি স্লিপ",
        ctx: "সংশোধিত স্যালারি স্লিপ নিয়ে ইমেল। আপনার কোম্পানির আসল ডোমেন meridiantextiles.example.com।",
        who: "পেরোল টিম",
        subject: "আপনার সংশোধিত স্যালারি স্লিপ তৈরি",
        text: "প্রিয় কর্মী, অক্টোবর থেকে আপনার বেতন কাঠামো সংশোধিত হয়েছে। [[link|নতুন স্লিপ দেখতে meridian-textiles-portal.example.com-এ অফিস পাসওয়ার্ড দিয়ে লগইন করুন।]] [[urgent|লিঙ্ক 12 ঘণ্টায় শেষ হবে।]] [[sender|প্রেরক: payroll@meridian-textiles.example.com]]",
        why: "কোম্পানির আসল ডোমেন meridiantextiles.example.com; ইমেলে meridian-textiles (হাইফেনসহ), একটি একইরকম দেখতে ডোমেন। লিঙ্ক একটি কপি করা লগইন পেজে নিয়ে যায় যা অফিস পাসওয়ার্ড চুরি করে। স্যালারি স্লিপ আপনার সবসময়ের HR পোর্টালেই থাকত।",
        todo: "ক্লিক করবেন না। ঠিকানা টাইপ করে বা বুকমার্ক থেকে HR পোর্টাল নিজে খুলুন। ইমেলটি IT-কে রিপোর্ট করুন; ফরোয়ার্ড করলে তারা সবার জন্য নকল ডোমেন ব্লক করতে পারে।"
      },
      usb: {
        title: "পার্কিংয়ে পাওয়া পেন ড্রাইভ",
        ctx: "সোমবার সকাল, অফিসের গেটের কাছে।",
        who: "অফিস পার্কিংয়ে পাওয়া পেন ড্রাইভ",
        subject: "",
        text: "গেটের কাছে একটি পেন ড্রাইভ পড়ে আছে, লেবেল: [[prize|\"স্যালারি রিভিশন 2026 - গোপনীয় - শুধু ম্যানেজমেন্টের জন্য\"]]। এক সহকর্মী বলে: \"[[remote|রিসেপশনের PC-তে লাগিয়ে দেখি কার।]]\"",
        why: "এটি \"USB ড্রপ\"। আক্রমণকারীরা লোভনীয় লেবেলের পেন ড্রাইভ ফেলে রাখে; লাগানো মাত্র লুকোনো সফটওয়্যার নিজে ইনস্টল হয়ে অফিস নেটওয়ার্কে ছড়াতে পারে। কৌতূহলই আক্রমণ।",
        todo: "কোথাও লাগাবেন না। খামে ভরে IT বা নিরাপত্তাকে দিন। কোম্পানির উচিত অটো-রান বন্ধ রাখা আর অচেনা USB ডিভাইস ব্লক করা।"
      },
      wifi: {
        title: "বিনামূল্যের এয়ারপোর্ট Wi-Fi ইমেল পাসওয়ার্ড চাইছে",
        ctx: "ফ্লাইটের অপেক্ষায় দুটি ভেন্ডর পেমেন্ট অনুমোদন করতে বিনামূল্যের নেটওয়ার্কে যুক্ত হচ্ছেন।",
        who: "এয়ারপোর্টে বিনামূল্যের Wi-Fi লগইন স্ক্রিন",
        subject: "",
        text: "নেটওয়ার্ক: Airport_Free_WiFi_5G (পাসওয়ার্ড নেই)। [[otp|চালিয়ে যেতে ইমেল ঠিকানা ও ইমেল পাসওয়ার্ড দিয়ে সাইন ইন করুন।]] তারপর ফ্লাইটের অপেক্ষায় [[data|কোম্পানির ব্যাঙ্কিং পোর্টালে দুটি ভেন্ডর পেমেন্ট অনুমোদন]] করার পরিকল্পনা।",
        why: "যে কেউ অফিসিয়াল শোনায় এমন নামে হটস্পট বানাতে পারে। নকল নেটওয়ার্কে আক্রমণকারী আপনার টাইপ করা দেখতে পায়, আর ইমেল পাসওয়ার্ড চাওয়া লগইন পেজ ক্রেডেনশিয়াল চুরি করছে। পাবলিক Wi-Fi-তে ব্যাঙ্কিং ঝুঁকিপূর্ণ।",
        todo: "কাজ ও ব্যাঙ্কিংয়ে নিজের মোবাইল ডেটা বা কোম্পানির VPN ব্যবহার করুন। Wi-Fi লগইন পেজে অফিস বা ইমেল পাসওয়ার্ড কখনও টাইপ করবেন না। খোলা নেটওয়ার্কে অটো-কানেক্ট বন্ধ করুন।"
      },
      upi_real: {
        title: "পেমেন্ট পাওয়ার নোটিফিকেশন",
        ctx: "কাউন্টারে থাকাকালীন আপনার নিজের UPI অ্যাপ থেকে নোটিফিকেশন।",
        who: "UPI অ্যাপ",
        subject: "",
        text: "[[ok|অনিতা ট্রেডার্স থেকে ₹2,500 পাওয়া গেছে]] আপনার 4471 দিয়ে শেষ চলতি অ্যাকাউন্টে। [[ok|কোনও পদক্ষেপ লাগবে না।]] লেনদেন ID 628104...",
        why: "টাকা ঢোকার জন্য কখনও PIN, OTP বা স্ক্যান লাগে না। নোটিফিকেশন আপনার নিজের অ্যাপ থেকে, প্রেরকের নাম বলে, আর আপনার কাছে কিছু চায় না। \"কালেক্ট রিকোয়েস্ট\" বা স্ক্যান করতে বলা QR-এর সঙ্গে তুলনা করুন: ওগুলি টাকা বের করে।",
        todo: "কিছু করার নেই। অঙ্কটি ইনভয়েসের সঙ্গে মেলান। \"পেমেন্ট পাওয়া গেছে\" মেসেজ কখনও অনুমোদন, PIN বা স্ক্যান চাইলে সেটি টাকা নিচ্ছে, দিচ্ছে না।"
      },
      dpdp: {
        title: "সহকর্মী WhatsApp-এ গ্রাহক তালিকা চাইছে",
        ctx: "সন্ধ্যায় সেলস সহকর্মীর নম্বর থেকে WhatsApp মেসেজ।",
        who: "সমীর (সেলস সহকর্মী)",
        subject: "",
        text: "ভাই, আজ বাড়ি থেকে কাজ করছি। [[data|ফোন নম্বর ও আধার কপিসহ পুরো গ্রাহক তালিকা এক্সপোর্ট করে এই WhatsApp-এ পাঠাও]], পরে ডিলিট করে দেব। [[urgent|ক্যাম্পেনের জন্য 10 মিনিটে দরকার।]] [[secret|ম্যানেজারকে বলার দরকার নেই, ছোট ব্যাপার।]]",
        why: "গ্রাহকের ফোন নম্বর ও আধার কপি ভারতের DPDP আইনে সুরক্ষিত ব্যক্তিগত ডেটা। ব্যক্তিগত WhatsApp-এ পাঠালে তা কোম্পানির নিয়ন্ত্রণের বাইরে যায়, আর এটি হ্যাক হওয়া অ্যাকাউন্ট বা ছদ্মবেশও হতে পারে। \"ম্যানেজারকে বোলো না\" কখনও গ্রহণযোগ্য নয়।",
        todo: "ভদ্রভাবে না বলুন। গ্রাহক ডেটা শুধু কোম্পানির অনুমোদিত সিস্টেমে, ম্যানেজারের অনুমোদনসহ, শুধু প্রয়োজনীয় ফিল্ডই শেয়ার করুন। সহকর্মীর অ্যাকাউন্ট অদ্ভুত লাগলে তাকে ফোন করুন।"
      },
      otp_call: {
        title: "\"জালিয়াতি বিভাগ\"-এর পেমেন্ট বাতিলে OTP চাই",
        ctx: "কলের সময়েই আপনার ফোনে OTP SMS আসে।",
        who: "\"নোভাব্যাঙ্ক জালিয়াতি বিভাগ\"",
        subject: "",
        text: "\"স্যার, [[threat|এই মুহূর্তে আপনার কার্ডে ₹49,999-এর লেনদেন হচ্ছে।]] বাতিল করতে [[urgent|60 সেকেন্ডের মধ্যে পদক্ষেপ নিতে হবে]]। [[otp|এইমাত্র ফোনে আসা OTP-টি বলুন, আমি এটি ফিরিয়ে দেব।]] [[secret|অনুগ্রহ করে কল কাটবেন না বা কাউকে কল করবেন না।]]\"",
        why: "\"এইমাত্র আসা\" OTP স্ক্যামারের নিজের চেষ্টার, যে আপনার কার্ড দিয়ে পেমেন্ট করছে। পড়ে বললে পেমেন্ট সম্পূর্ণ হয়। ব্যাঙ্ক কিছু বাতিল করতে কখনও OTP চায় না, আর 60 সেকেন্ডের আতঙ্ক তৈরি করা হয় যাতে আপনি ভাবতে না পারেন।",
        todo: "কল কাটুন। ব্যাঙ্ক অ্যাপে নিজে কার্ড ব্লক করুন বা কার্ডের পেছনের নম্বরে কল করুন। OTP কাউকে কখনও পড়ে বলবেন না। টাকা চলে গেলে এখনই 1930-এ কল করুন।"
      },
      hr_bonus: {
        title: "দীপাবলি বোনাস ফর্ম নেট-ব্যাঙ্কিং লগইন চাইছে",
        ctx: "দীপাবলির ঠিক আগে HR-এর মতো দেখতে ঠিকানা থেকে সব কর্মীকে ইমেল।",
        who: "HR রিওয়ার্ডস টিম",
        subject: "দীপাবলি বোনাস ₹25,000 - ব্যাঙ্ক অ্যাকাউন্ট নিশ্চিত করুন",
        text: "প্রিয় টিম সদস্য, ₹25,000 দীপাবলি বোনাস ঘোষণা করতে পেরে আমরা আনন্দিত। [[attach|সংযুক্ত ফর্ম (Bonus_Form.html) খুলুন]] আর [[otp|নেট-ব্যাঙ্কিং ইউজার ID ও পাসওয়ার্ড দিন]] যাতে বোনাস সরাসরি জমা হয়। [[urgent|আজ সন্ধ্যা 6টার পর পাওয়া ফর্ম প্রসেস হবে না।]] [[sender|HR রিওয়ার্ডস - meridiantextiles-bonus.example.net]]",
        why: "HR-এর কাছে আপনার বেতনের অ্যাকাউন্ট আগেই আছে; কোনও কোম্পানি বোনাসের জন্য নেট-ব্যাঙ্কিং লগইন চায় না। প্রেরক একইরকম দেখতে ডোমেন, HTML অ্যাটাচমেন্ট একটি নকল ব্যাঙ্ক লগইন পেজ, আর সেদিনের সময়সীমা চাপ বাড়ায়।",
        todo: "অ্যাটাচমেন্ট খুলবেন না, কিছু দেবেন না। HR-কে সরাসরি বা ইন্ট্রানেটে জিজ্ঞেস করুন। ইমেলটি IT-কে রিপোর্ট করুন যাতে সহকর্মীরা সতর্ক হন।"
      },
      electricity: {
        title: "আজ রাতে অফিসের বিদ্যুৎ কাটা হবে",
        ctx: "রাত 8:35-এ দোকান মালিকের ফোনে SMS।",
        who: "",
        subject: "",
        text: "প্রিয় গ্রাহক, [[threat|আজ রাত 9:30-এ আপনার অফিসের বিদ্যুৎ সংযোগ কেটে দেওয়া হবে]] কারণ [[odd|গত মাসের বিল আমাদের সিস্টেমে আপডেট হয়নি]]। অনুগ্রহ করে আমাদের অফিসারকে [[sender|93XXX XXX40]]-এ [[urgent|এখনই]] যোগাযোগ করুন।",
        why: "বিদ্যুৎ বোর্ড ব্যক্তিগত মোবাইল থেকে একটি SMS-এর পর রাতে সংযোগ কাটে না। ফোন করলে \"অফিসার\" অ্যাপ ইনস্টল করতে বা লিঙ্কে ₹10 দিতে বলে, আর আসল লক্ষ্য আপনার ব্যাঙ্ক অ্যাকাউন্ট।",
        todo: "কল করবেন না। বিদ্যুৎ বোর্ডের অফিসিয়াল অ্যাপ বা অফিসে বিল দেখুন। নম্বরটি সঞ্চার সাথী (চক্ষু)-তে রিপোর্ট করুন।"
      },
      wa_hijack: {
        title: "সহকর্মী 6 সংখ্যার কোড ফরোয়ার্ড করতে বলছে",
        ctx: "আপনার ফোনে কোডের SMS আসার ঠিক পরে সহকর্মীর সেভ করা নম্বর থেকে গভীর রাতে WhatsApp মেসেজ।",
        who: "রোহন (সহকর্মী)",
        subject: "",
        text: "এই, এত রাতে বিরক্ত করার জন্য দুঃখিত। [[odd|WhatsApp-এ লগইন করতে গিয়ে ভুল করে তোমার নম্বর দিয়ে ফেলেছি আর 6 সংখ্যার কোড তোমার ফোনে গেছে।]] [[otp|কোডটা আমাকে ফরোয়ার্ড করো]], [[urgent|তাড়াতাড়ি, নইলে আমার অ্যাকাউন্ট লক হয়ে যাবে।]]",
        why: "আসা কোডটি আপনার নিজের WhatsApp-এর ভেরিফিকেশন কোড। যে পাবে সে আপনার অ্যাকাউন্ট দখল করে আপনার সব কন্টাক্ট ও অফিস গ্রুপে টাকা চাইবে। মেসেজটি নিজেই সহকর্মীর ইতিমধ্যে দখল হওয়া অ্যাকাউন্ট থেকে আসতে পারে।",
        todo: "ভেরিফিকেশন কোড কখনও ফরোয়ার্ড করবেন না। সহকর্মীকে ফোন করে জানান তার অ্যাকাউন্ট হ্যাক হয়েছে। WhatsApp সেটিংসে টু-স্টেপ ভেরিফিকেশন চালু করুন।"
      },
      invest_group: {
        title: "নিশ্চিত রিটার্নের স্টক-টিপস গ্রুপ",
        ctx: "না চাইতেই আপনাকে একটি WhatsApp গ্রুপে যোগ করা হয়েছে।",
        who: "VIP স্টক টিপস - গ্রুপ অ্যাডমিন",
        subject: "",
        text: "আমাদের প্রিমিয়াম গ্রুপে স্বাগত! [[prize|নিশ্চিত ইনসাইডার টিপসে আমাদের সদস্যরা গত মাসে 32% রিটার্ন পেয়েছেন।]] আমাদের ট্রেডিং অ্যাপ [[link|এই লিঙ্ক থেকে ডাউনলোড করুন, অ্যাপ স্টোর থেকে নয়]], আর [[money|₹50,000 জমা দিয়ে শুরু করুন]]। [[prize|সদস্যদের পোস্ট করা লাভের স্ক্রিনশট দেখুন!]] [[urgent|মাঝরাতে এন্ট্রি বন্ধ।]]",
        why: "রিটার্নের গ্যারান্টি কেউ দিতে পারে না, আর \"ইনসাইডার টিপস\" বেআইনি। অ্যাপটি নকল: কাল্পনিক লাভ দেখায় যাতে আরও জমা দেন, আর টাকা তোলা কখনও হয় না। স্ক্রিনশট পোস্ট করা \"সদস্যরা\"ই স্ক্যামার।",
        todo: "গ্রুপ ছেড়ে রিপোর্ট করুন। শুধু SEBI-নিবন্ধিত ব্রোকার ও অফিসিয়াল অ্যাপ স্টোরের অ্যাপে বিনিয়োগ করুন। জমা দিয়ে থাকলে 1930-এ কল করুন আর cybercrime.gov.in-এ রিপোর্ট করুন।"
      },
      bank_real: {
        title: "আপনার করা পেমেন্টের ডেবিট অ্যালার্ট",
        ctx: "আপনার অ্যাকাউন্টস টিম আজ প্যাকেজিং ভেন্ডরকে পেমেন্ট করেছে। এই SMS আসে।",
        who: "",
        subject: "",
        text: "নোভাব্যাঙ্ক: [[ok|4471 দিয়ে শেষ অ্যাকাউন্ট থেকে 10 অক্টোবর সানরাইজ প্যাকেজিং-কে NEFT-এ ₹86,000 ডেবিট]], রেফ N26101034। ব্যালান্স ₹3,42,118। [[ok|আপনি না করে থাকলে ডেবিট কার্ডের পেছনের নম্বরে কল করুন।]]",
        why: "এটি আজ অ্যাকাউন্টস টিমের করা পেমেন্টের সঙ্গে মিলছে, ব্যাঙ্কের প্রেরক ID থেকে এসেছে, SMS-এ কোনও লিঙ্ক বা নম্বর নেই, আর আপনাকে নিজের কার্ডের নম্বরের দিকেই পাঠায়।",
        todo: "পেমেন্ট রেকর্ডের সঙ্গে মেলান। কোনও ডেবিট অ্যালার্ট আপনার করা পেমেন্টের সঙ্গে না মিললে কার্ডের নম্বরে এখনই ব্যাঙ্ককে কল করুন, মেসেজের নম্বরে নয়।"
      }
    }
  },
  mr: {
    scenarios: {
      ceo_gift: {
        title: "Boss on a new number wants gift cards",
        ctx: "WhatsApp message to an accounts executive at 9 am. The profile photo is the MD's photo from the company website.",
        who: "Rajesh Sir (new number)",
        subject: "",
        text: "Hi, this is Rajesh. [[sender|My old phone is damaged, I am using this number for now.]] I am in a meeting with a big client. [[money|Buy 10 gift cards of ₹5,000 each]] and send me the codes [[urgent|within 30 minutes]]. [[secret|Please don't discuss this with anyone, it is a surprise for the client.]]",
        why: "Scammers copy the MD's photo from the website and write from a new number. A real boss never asks for gift-card codes or for secrecy. New number + urgency + secrecy is the classic \"CEO fraud\".",
        todo: "Don't buy anything. Call your boss on the number saved in your phone, or walk to their cabin. Tell IT or your manager so the whole office is warned."
      },
      it_real: {
        title: "Password policy notice from IT",
        ctx: "An email to all staff from the company's own IT helpdesk.",
        who: "IT Helpdesk",
        subject: "Password policy change from 15 October",
        text: "Dear colleagues, from 15 October passwords must be at least 12 characters long. [[ok|You do not need to do anything today.]] When your password expires, change it [[ok|on the office portal you normally use]]. [[ok|IT will never ask for your password by email, phone or WhatsApp.]] For doubts, visit the helpdesk on the 2nd floor.",
        why: "The sender is the company's own IT address. There is no link to click, no attachment, no deadline and no request for a password. Genuine notices tell you what will happen and let you use the normal portal yourself.",
        todo: "Nothing urgent. If you are unsure whether a notice is real, walk to the helpdesk or call the extension number you already know."
      },
      bec_vendor: {
        title: "Vendor says its bank account has changed",
        ctx: "An email to the accounts team about a pending invoice of ₹4,80,000.",
        who: "Kaveri Logistics Accounts",
        subject: "URGENT: Updated bank details for Invoice KL/2026/0912",
        text: "Dear Sir/Madam, [[newacct|our company bank account has changed after an audit. Please pay the pending invoice of ₹4,80,000 to the new account given below.]] [[urgent|Payment must be released today]] to avoid delay of your shipment. [[sender|Kindly reply only to this email ID]], our office phones are under maintenance.",
        why: "This is Business Email Compromise (BEC). Criminals hack or copy a vendor's email and send \"new bank details\". The address is slightly different from the real vendor, the phones \"are not working\" so you cannot verify, and everything is urgent.",
        todo: "Never change a vendor's bank details because of an email. Call the vendor on the number from your old records or purchase order, never the number in the email. Use two-person approval for every bank-detail change."
      },
      gst_notice: {
        title: "GST penalty notice with an attachment",
        ctx: "An email to the accounts mailbox early in the morning.",
        who: "GST Department",
        subject: "Show Cause Notice - Penalty ₹1,24,500 - Action required",
        text: "[[odd|Dear Taxpayer,]] a mismatch is found in your GST returns. A penalty of ₹1,24,500 is due. [[threat|Your GSTIN will be suspended in 48 hours]] if it is not paid. [[link|Open the attached notice and pay through the secure link]] to avoid legal action. [[attach|Attachment: GST_Notice_2026.html]]",
        why: "Real GST notices appear in your account on the official GST portal and carry a DIN (Document Identification Number). An HTML attachment with a \"secure link\" is a fake login page that steals your GST login or payment details. The sender is not the official gov.in domain.",
        todo: "Don't open the attachment. Log in to the official GST portal yourself by typing the address, or ask your CA to check. Report the email to IT and at cybercrime.gov.in."
      },
      otp_real: {
        title: "OTP for a payment you just started",
        ctx: "You have just started a UPI payment of ₹2,500 to your packaging vendor. This SMS arrives.",
        who: "",
        subject: "",
        text: "[[ok|Your OTP for the UPI payment of ₹2,500 to Sunrise Packaging that you just started is 482913.]] Valid for 10 minutes. [[ok|Do not share this OTP with anyone, not even the bank.]] - NovaBank",
        why: "You started this payment yourself a moment ago, the amount and the payee match, and the message tells you not to share the code. A genuine OTP is only for the action you yourself requested, and the bank never asks you to tell it to anyone.",
        todo: "Type the OTP only in the app you are using. If an OTP arrives when you did not start anything, somebody is trying to use your account: do not share it, and call the bank on the number printed on your card."
      },
      digital_arrest: {
        title: "Video call from a \"CBI officer\"",
        ctx: "A video call from an unknown number. The caller wears a uniform and sits in an office with a flag behind him.",
        who: "\"CBI Officer Verma\"",
        subject: "",
        text: "\"[[threat|A parcel with drugs and 6 passports was booked in your name. A case is registered against you.]] [[urgent|Stay on this video call, do not disconnect]], and [[secret|do not tell anyone, not even your family, they are also under watch]]. [[money|Transfer ₹3,50,000 to this RBI verification account for checking]]; it will be returned after the investigation.\"",
        why: "This is a \"digital arrest\". No police, CBI or court arrests anyone on a video call, and no agency asks you to transfer money to a \"verification account\". The uniform, office background and ID card are all fake. Secrecy and keeping you on the call stop you from thinking.",
        todo: "Hang up at once. Real officers do not call on WhatsApp. Call 1930 or report at cybercrime.gov.in, and tell a colleague or family member immediately."
      },
      courier: {
        title: "Call: your parcel is held at customs",
        ctx: "A recorded voice, then a person. You have not ordered anything from abroad.",
        who: "\"SpeedParcel Customer Service\"",
        subject: "",
        text: "\"Hello, this is the customs department of SpeedParcel. [[threat|A parcel in your name is held at customs because it contains illegal items.]] To avoid a police case, [[urgent|press 1 now]] to speak to an officer, or [[money|pay the ₹2,999 clearance fee]] on the link we will send.\"",
        why: "Courier companies do not call about illegal items, and customs does not collect fees by phone. Pressing 1 connects you to a fake \"officer\" who then tries a digital-arrest scam or asks for payments.",
        todo: "Cut the call. If you really ordered something, check the tracking number on the courier's official website. Report the number on the Sanchar Saathi (Chakshu) portal."
      },
      task_job: {
        title: "Telegram job: earn ₹8,000 a day rating hotels",
        ctx: "A Telegram message after you applied for jobs online last week.",
        who: "HR Priya - Online Jobs",
        subject: "",
        text: "Congratulations, you are selected! [[prize|Earn ₹3,000 to ₹8,000 daily by rating hotels online]], only 20 minutes of work. The first 3 tasks are free. For premium tasks you [[money|deposit ₹5,000 and get back ₹7,500 within one hour]]. [[urgent|Only 4 seats left today!]]",
        why: "This is a task scam. The first small payments are real, to build trust. Then you \"deposit\" for premium tasks and the money never comes back. No real job pays you to click, and no employer asks you to deposit money.",
        todo: "Don't deposit anything. Block and report the account. If you have already paid, call 1930 immediately; the first hour matters most."
      },
      vendor_real: {
        title: "Payment reminder from a known vendor",
        ctx: "An email from the packaging vendor you pay every month, from their usual address.",
        who: "Sunrise Packaging Billing",
        subject: "Payment reminder - Invoice SP/26-27/0431 due 10 Oct",
        text: "Dear Meridian Textiles team, this is a gentle reminder that invoice SP/26-27/0431 for ₹86,000 is due on 10 October. [[ok|Our bank details are unchanged and are printed on the invoice you already have.]] [[ok|If you receive any email asking to change our bank account, please call our office on the number in your records before paying.]] Thank you.",
        why: "A regular reminder from the known vendor address, no new bank details, no threat, and the vendor itself asks you to verify by phone if anything looks different. That is exactly how a genuine partner behaves.",
        todo: "Pay through your normal process to the account already in your records. Any change request should be confirmed on a known phone number."
      },
      deepfake: {
        title: "The MD's voice asks for an urgent transfer",
        ctx: "A phone call from an unknown number. The voice sounds exactly like your MD, with airport noise behind.",
        who: "\"Rajesh Sir\" (the MD's voice)",
        subject: "",
        text: "\"Hello, it's me, I am at the airport, you can hear it is noisy. [[urgent|I need you to transfer ₹2,00,000 right now]] to a new supplier for the Dubai order. [[newacct|I will WhatsApp you the account number.]] [[secret|Don't call me back, my phone is going on flight mode, just do it before I land.]]\"",
        why: "AI can copy anyone's voice from a 30-second clip of a speech or video. A cloned voice plus a new account number plus \"don't call me back\" is a deepfake scam. The background noise is added on purpose.",
        todo: "Say you will call back, then call the MD on the saved number or check with a second senior person. Agree on a code word in your team for urgent phone requests. No transfer without the normal approval."
      },
      qr_receive: {
        title: "Buyer sends a QR code to \"receive\" money",
        ctx: "You advertised 12 used office chairs on a classified-ads site. A buyer writes on WhatsApp.",
        who: "Buyer for office chairs",
        subject: "",
        text: "Hi, I saw your ad for 12 used office chairs at ₹18,000. I will pay the full amount now. [[upi|I have sent a QR code: scan it and enter your UPI PIN to receive the money.]] [[odd|I am an army officer posted outside, so my friend will pick up the chairs.]] [[urgent|Please do it in the next 5 minutes, my network is weak.]]",
        why: "You never scan a QR or enter a PIN to RECEIVE money. Scanning and entering the PIN PAYS the other person. The \"army officer\" story and the hurry are standard tricks on classified-ad sites.",
        todo: "Refuse. Ask the buyer to send money to your UPI ID; you need to do nothing to receive it. Report the number in the app."
      },
      fake_care: {
        title: "Customer-care number found on search",
        ctx: "A refund did not arrive. You searched online for the bank's customer care and called the first number shown.",
        who: "\"NovaBank Customer Care\"",
        subject: "",
        text: "\"Thank you for calling NovaBank customer care. For your refund of ₹3,200 we need to verify you. [[otp|Please tell me your 16-digit card number, expiry date and the OTP you receive now.]] [[remote|Also install the Quick Support app I am sending so I can process it faster.]]\"",
        why: "You called a fake number placed in search results or on a fake website. No bank asks for the full card number, expiry, CVV or OTP, and never asks you to install a remote-control app.",
        todo: "Cut the call. Use only the number printed on the back of your card or inside the official app. Never install an app a caller asks for. If you shared anything, block the card in the app at once and call 1930."
      },
      hr_real: {
        title: "Diwali holiday list from HR",
        ctx: "An email to all staff from the company's HR address.",
        who: "HR Department",
        subject: "Holiday list for Diwali week",
        text: "Dear all, the office will be closed from 7 to 9 November for Diwali. [[ok|The full holiday list is on the HR page of the intranet]], the same page you use for leave. [[ok|No action is needed from you.]] Wishing everyone a happy and safe Diwali. - HR Team",
        why: "Sent from the company's own HR address, information only, no link to an outside site, no attachment to open and nothing to fill in. Genuine notices do not need urgency.",
        todo: "Nothing to do. If an email about holidays or a bonus asks you to log in or fill in bank details, treat that as a red flag and ask HR in person."
      },
      screen_share: {
        title: "\"UPI helpline\" wants to see your screen",
        ctx: "A call minutes after a UPI payment failed and you complained on social media.",
        who: "\"UPI Helpline\"",
        subject: "",
        text: "\"Sir, your UPI payment of ₹1,500 is stuck. I can fix it in 2 minutes. [[remote|Please install the screen-sharing app from the link I sent and read me the 9-digit code on the screen.]] Keep your banking app open, I only need to see it. [[otp|When the OTP comes, don't cut the call, I will guide you.]]\"",
        why: "Remote-access and screen-sharing apps let the caller see and control your phone; the 9-digit code gives them full access. Together with an OTP they can empty the account within minutes. Genuine helplines never ask to see your screen.",
        todo: "Cut the call and uninstall any app you installed. Complain only inside the official UPI or bank app. If money has moved, call 1930 and your bank immediately."
      },
      invoice_exe: {
        title: "Invoice attachment ending in .exe",
        ctx: "An email to the accounts mailbox from a company you do not remember buying from.",
        who: "Global Trade Supplies",
        subject: "Invoice attached - please process",
        text: "[[odd|Dear Sir,]] please find attached the invoice for the goods delivered last week. [[attach|Attachment: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|Kindly process payment today]] and confirm. [[odd|Regards, Accounts Dept.]]",
        why: "A file ending in .exe is a program, not a PDF; the \".pdf\" in the name is a disguise. Opening it installs malware or ransomware that can lock every computer in the office. A vague greeting and no company signature are extra warnings.",
        todo: "Don't open the attachment. Report the email to IT. Check your records: did you actually buy from this company? Turn on \"show file extensions\" on office computers so such tricks are visible."
      },
      echallan: {
        title: "Traffic e-challan SMS with an app link",
        ctx: "An SMS to the office driver's phone in the evening.",
        who: "",
        subject: "",
        text: "Traffic e-Challan: your vehicle KA-05-XX-1234 was recorded jumping a signal on 1 October. [[money|Fine ₹1,000.]] [[urgent|Pay within 24 hours]] to avoid double fine and court summons. [[link|Download the official challan app: echallan-pay.example.net/app.apk]]",
        why: "Real e-challan messages come from a government sender ID, not a personal mobile number, and never ask you to download an .apk file. The APK is a malicious app that reads your SMS and OTPs.",
        todo: "Delete the message. Check challans only on the official government e-challan website or the state police app. Report the number on Sanchar Saathi (Chakshu)."
      },
      parcel_real: {
        title: "Delivery update for a parcel you expect",
        ctx: "You ordered packaging material last week. This SMS arrives.",
        who: "",
        subject: "",
        text: "SpeedParcel: your shipment SP48213 from Sunrise Packaging [[ok|will be delivered today between 2 pm and 5 pm.]] [[ok|No payment is due.]] [[ok|To track, use your shipment number on our website or app.]]",
        why: "Sent from a registered sender ID (not a personal number), matches a parcel you expect, asks for no money and gives no link to tap. A genuine delivery message just informs you.",
        todo: "Nothing to do. If a parcel message asks for a fee, a link or an app, stop and check on the official website using the shipment number."
      },
      kyc: {
        title: "KYC expired, account blocked today",
        ctx: "An SMS to the owner's phone at night.",
        who: "",
        subject: "",
        text: "Dear customer, [[threat|your NovaBank account will be blocked today]] because your KYC has expired. [[urgent|Update immediately]] at [[link|novabank-kyc-update.example.net]] or [[sender|call our officer on 94XXX XXX51]].",
        why: "Banks never send KYC links from a personal mobile number and never block an account within hours. The link opens a fake bank page that steals your login and OTP; the \"officer\" asks you to install an app.",
        todo: "Don't tap the link or call. If KYC is really due, the bank's own app or branch will tell you. Report the SMS on Sanchar Saathi (Chakshu)."
      },
      sim_swap: {
        title: "Call: your SIM will be deactivated",
        ctx: "A call to the office manager, who uses this number for bank OTPs.",
        who: "\"Telecom company executive\"",
        subject: "",
        text: "\"Madam, this is from your mobile network. [[threat|Your SIM will be deactivated in 24 hours]] because the 5G upgrade is pending. [[otp|To upgrade, read out the 20-digit number printed on your SIM card and press 1 after the SMS you receive.]] [[urgent|This offer closes today.]]\"",
        why: "This is a SIM-swap attempt. With the 20-digit SIM number and your \"1\", the fraudster activates your number on their own SIM. Your phone goes dead and every OTP for banking and UPI then goes to them.",
        todo: "Cut the call. Telecom companies never call for 5G upgrades. If your phone suddenly loses network for a long time, call your bank first, then your operator. Check SIMs issued in your name on Sanchar Saathi."
      },
      mfa: {
        title: "Seventh login approval request since midnight",
        ctx: "Your phone keeps buzzing at night with sign-in approval requests from the office login app. Then a call comes.",
        who: "SecureLogin app",
        subject: "",
        text: "[[otp|Approve sign-in? Someone is trying to sign in to your office account from a new device. Tap APPROVE to continue.]] [[odd|(This is the 7th request since midnight.)]] A moment later a caller says: \"[[urgent|This is IT, we are fixing a server. Please just approve the request so the alerts stop.]]\"",
        why: "This is \"MFA fatigue\". The attacker already has your password and is spamming approval requests, hoping you tap Approve to make them stop. The \"IT\" call is part of the attack. Real IT never asks you to approve a login you did not start.",
        todo: "Tap Deny every time. Change your password from a trusted device right away and tell IT. The repeated requests mean your password has already leaked."
      },
      gst_real: {
        title: "Monthly GST reminder from your CA",
        ctx: "A WhatsApp message from your chartered accountant's saved number.",
        who: "Mehta & Co. (our CA)",
        subject: "",
        text: "Good morning. Reminder: GSTR-3B for September is due on 20 October. [[ok|Please upload the sales and purchase sheets to the same shared folder as every month.]] [[ok|No payment is needed from your side right now]]; I will send the challan details after filing, and we can confirm on our usual call.",
        why: "Known CA, saved number, the usual monthly process, no new account number, no link and no urgency beyond the real due date. Verification happens on your regular call.",
        todo: "Follow your normal process. If one day the \"CA\" sends a new bank account or asks you to pay through a link, call the CA office on the known number first."
      },
      lookalike: {
        title: "Salary slip on a look-alike domain",
        ctx: "An email about a revised salary slip. Your company's real domain is meridiantextiles.example.com.",
        who: "Payroll Team",
        subject: "Your revised salary slip is ready",
        text: "Dear employee, your salary structure has been revised from October. [[link|Log in at meridian-textiles-portal.example.com with your office password to view the new slip.]] [[urgent|The link expires in 12 hours.]] [[sender|Sent from payroll@meridian-textiles.example.com]]",
        why: "The real company domain is meridiantextiles.example.com; the email uses meridian-textiles (with a hyphen), a look-alike domain. The link leads to a copied login page that steals your office password. A salary slip would be on the HR portal you always use.",
        todo: "Don't click. Open the HR portal yourself by typing the address or from your bookmark. Report the email to IT; forwarding it helps them block the fake domain for everyone."
      },
      usb: {
        title: "Pen drive found in the parking lot",
        ctx: "Monday morning, near the office entrance.",
        who: "A pen drive found in the office parking",
        subject: "",
        text: "A pen drive lies near the entrance with a label: [[prize|\"Salary Revision 2026 - CONFIDENTIAL - Management only\"]]. A colleague says: \"[[remote|Let's plug it into the reception PC and see whose it is.]]\"",
        why: "This is a \"USB drop\". Attackers leave pen drives with tempting labels; the moment one is plugged in, hidden software can install itself and spread across the office network. Curiosity is the attack.",
        todo: "Don't plug it in anywhere. Hand it to IT or security in an envelope. Companies should disable auto-run and block unknown USB devices."
      },
      wifi: {
        title: "Free airport Wi-Fi asks for your email password",
        ctx: "Waiting for a flight, you connect to a free network to approve two vendor payments.",
        who: "Free Wi-Fi login screen at the airport",
        subject: "",
        text: "Network: Airport_Free_WiFi_5G (no password). [[otp|To continue, sign in with your email address and email password.]] Then you plan to [[data|approve two vendor payments on the company banking portal]] while waiting for your flight.",
        why: "Anyone can create a hotspot with an official-sounding name. On a fake network the attacker can see what you type, and a login page that asks for your email password is harvesting credentials. Banking on public Wi-Fi is a risk.",
        todo: "Use your own mobile data or the company VPN for work and banking. Never type your office or email password on a Wi-Fi login page. Turn off auto-connect to open networks."
      },
      upi_real: {
        title: "Payment received notification",
        ctx: "A notification from your own UPI app while you are at the counter.",
        who: "UPI app",
        subject: "",
        text: "[[ok|₹2,500 received from Anita Traders]] into your current account ending 4471. [[ok|No action needed.]] Transaction ID 628104...",
        why: "Money coming IN never needs your PIN, OTP or a scan. The notification is from your own app, names the payer and asks nothing of you. Compare this with a \"collect request\" or a QR you are asked to scan: those take money OUT.",
        todo: "Nothing to do. Check the amount against your invoice. If a \"payment received\" message ever asks you to approve, enter a PIN or scan, it is taking money, not giving it."
      },
      dpdp: {
        title: "Colleague wants the customer list on WhatsApp",
        ctx: "A WhatsApp message from a sales colleague's number in the evening.",
        who: "Sameer (sales colleague)",
        subject: "",
        text: "Bro, I am working from home today. [[data|Please export the full customer list with phone numbers and Aadhaar copies and send it to me on this WhatsApp]], I will delete it later. [[urgent|Need it in 10 minutes for the campaign.]] [[secret|No need to tell the manager, it's a small thing.]]",
        why: "Customer phone numbers and Aadhaar copies are personal data protected by India's DPDP Act. Sending them on personal WhatsApp takes them outside company control, and this could also be a hacked account or an impersonation. \"Don't tell the manager\" is never acceptable.",
        todo: "Say no politely. Share customer data only through the company's approved system, with the manager's approval and only the fields needed. If a colleague's account seems odd, call them."
      },
      otp_call: {
        title: "\"Fraud department\" needs the OTP to cancel a payment",
        ctx: "A call while an OTP SMS arrives on your phone.",
        who: "\"NovaBank Fraud Department\"",
        subject: "",
        text: "\"Sir, [[threat|a transaction of ₹49,999 is happening on your card right now.]] To cancel it [[urgent|we must act within 60 seconds]]. [[otp|Tell me the OTP that has just arrived on your phone and I will reverse it.]] [[secret|Please do not disconnect or call anyone.]]\"",
        why: "The OTP that \"just arrived\" is for the scammer's own attempt to pay with your card. Reading it out completes the payment. Banks never ask for an OTP to cancel anything, and the 60-second panic is created so you don't think.",
        todo: "Cut the call. Open your bank app and block the card yourself, or call the number on the back of your card. Never read an OTP to anyone. If money has left, call 1930 right away."
      },
      hr_bonus: {
        title: "Diwali bonus form asks for net-banking login",
        ctx: "An email to all staff just before Diwali, from an address that looks like HR.",
        who: "HR Rewards Team",
        subject: "Diwali bonus ₹25,000 - confirm your bank account",
        text: "Dear team member, we are pleased to announce a Diwali bonus of ₹25,000. [[attach|Open the attached form (Bonus_Form.html)]] and [[otp|enter your net-banking user ID and password]] so that the bonus is credited directly. [[urgent|Forms received after 6 pm today will not be processed.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR already has your salary account; no company asks for your net-banking login for a bonus. The sender is a look-alike domain, the HTML attachment is a fake bank login page, and a same-day deadline adds pressure.",
        todo: "Don't open the attachment or enter anything. Ask HR in person or on the intranet. Report the email to IT so colleagues are warned."
      },
      electricity: {
        title: "Office power will be cut tonight",
        ctx: "An SMS to the shop owner's phone at 8:35 pm.",
        who: "",
        subject: "",
        text: "Dear consumer, [[threat|your office electricity connection will be disconnected tonight at 9:30 pm]] because [[odd|last month bill is not update in our system]]. Please contact our officer [[sender|93XXX XXX40]] [[urgent|immediately]].",
        why: "Electricity boards don't disconnect at night after one SMS from a personal mobile. When you call, the \"officer\" asks you to install an app or pay ₹10 through a link, and the real target is your bank account.",
        todo: "Don't call. Check the bill in the electricity board's official app or office. Report the number on Sanchar Saathi (Chakshu)."
      },
      wa_hijack: {
        title: "Colleague asks you to forward a 6-digit code",
        ctx: "A late-night WhatsApp message from a colleague's saved number, right after a code SMS arrived on your phone.",
        who: "Rohan (colleague)",
        subject: "",
        text: "Hey, sorry to disturb you so late. [[odd|I entered your number by mistake while logging into WhatsApp and a 6-digit code went to your phone.]] [[otp|Please forward me that code]], [[urgent|quickly, otherwise my account will be locked.]]",
        why: "The code that arrived is the verification code for YOUR WhatsApp. Whoever gets it takes over your account and then messages all your contacts and office groups asking for money. The message itself may come from a colleague's already-hijacked account.",
        todo: "Never forward a verification code. Phone the colleague to warn them that their account is hacked. Turn on two-step verification in WhatsApp settings."
      },
      invest_group: {
        title: "Stock-tips group with guaranteed returns",
        ctx: "You were added to a WhatsApp group without asking.",
        who: "VIP Stock Tips - Group admin",
        subject: "",
        text: "Welcome to our premium group! [[prize|Our members earned 32% returns last month with guaranteed insider tips.]] Download our trading app from [[link|this link, not from the app store]], and [[money|start with a deposit of ₹50,000]]. [[prize|See the screenshots of profits posted by members!]] [[urgent|Entry closes at midnight.]]",
        why: "Nobody can guarantee returns, and \"insider tips\" are illegal. The app is fake: it shows imaginary profits so you deposit more, and withdrawal is never allowed. The \"members\" posting screenshots are the scammers.",
        todo: "Leave and report the group. Invest only through SEBI-registered brokers and apps from the official app store. If you have deposited, call 1930 and report at cybercrime.gov.in."
      },
      bank_real: {
        title: "Debit alert for a payment you made",
        ctx: "Your accounts team paid the packaging vendor today. This SMS arrives.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|₹86,000 debited from account ending 4471 on 10 Oct for NEFT to Sunrise Packaging]], ref N26101034. Balance ₹3,42,118. [[ok|If not done by you, call the number on the back of your debit card.]]",
        why: "This matches the payment your accounts team made today, comes from the bank's sender ID, has no link or number inside the SMS and points you to the number on your own card.",
        todo: "Match it with your payment records. If any debit alert does not match a payment you made, call the bank immediately using the number on the card, not a number from a message."
      }
    }
  },
  gu: {
    scenarios: {
      ceo_gift: {
        title: "Boss on a new number wants gift cards",
        ctx: "WhatsApp message to an accounts executive at 9 am. The profile photo is the MD's photo from the company website.",
        who: "Rajesh Sir (new number)",
        subject: "",
        text: "Hi, this is Rajesh. [[sender|My old phone is damaged, I am using this number for now.]] I am in a meeting with a big client. [[money|Buy 10 gift cards of ₹5,000 each]] and send me the codes [[urgent|within 30 minutes]]. [[secret|Please don't discuss this with anyone, it is a surprise for the client.]]",
        why: "Scammers copy the MD's photo from the website and write from a new number. A real boss never asks for gift-card codes or for secrecy. New number + urgency + secrecy is the classic \"CEO fraud\".",
        todo: "Don't buy anything. Call your boss on the number saved in your phone, or walk to their cabin. Tell IT or your manager so the whole office is warned."
      },
      it_real: {
        title: "Password policy notice from IT",
        ctx: "An email to all staff from the company's own IT helpdesk.",
        who: "IT Helpdesk",
        subject: "Password policy change from 15 October",
        text: "Dear colleagues, from 15 October passwords must be at least 12 characters long. [[ok|You do not need to do anything today.]] When your password expires, change it [[ok|on the office portal you normally use]]. [[ok|IT will never ask for your password by email, phone or WhatsApp.]] For doubts, visit the helpdesk on the 2nd floor.",
        why: "The sender is the company's own IT address. There is no link to click, no attachment, no deadline and no request for a password. Genuine notices tell you what will happen and let you use the normal portal yourself.",
        todo: "Nothing urgent. If you are unsure whether a notice is real, walk to the helpdesk or call the extension number you already know."
      },
      bec_vendor: {
        title: "Vendor says its bank account has changed",
        ctx: "An email to the accounts team about a pending invoice of ₹4,80,000.",
        who: "Kaveri Logistics Accounts",
        subject: "URGENT: Updated bank details for Invoice KL/2026/0912",
        text: "Dear Sir/Madam, [[newacct|our company bank account has changed after an audit. Please pay the pending invoice of ₹4,80,000 to the new account given below.]] [[urgent|Payment must be released today]] to avoid delay of your shipment. [[sender|Kindly reply only to this email ID]], our office phones are under maintenance.",
        why: "This is Business Email Compromise (BEC). Criminals hack or copy a vendor's email and send \"new bank details\". The address is slightly different from the real vendor, the phones \"are not working\" so you cannot verify, and everything is urgent.",
        todo: "Never change a vendor's bank details because of an email. Call the vendor on the number from your old records or purchase order, never the number in the email. Use two-person approval for every bank-detail change."
      },
      gst_notice: {
        title: "GST penalty notice with an attachment",
        ctx: "An email to the accounts mailbox early in the morning.",
        who: "GST Department",
        subject: "Show Cause Notice - Penalty ₹1,24,500 - Action required",
        text: "[[odd|Dear Taxpayer,]] a mismatch is found in your GST returns. A penalty of ₹1,24,500 is due. [[threat|Your GSTIN will be suspended in 48 hours]] if it is not paid. [[link|Open the attached notice and pay through the secure link]] to avoid legal action. [[attach|Attachment: GST_Notice_2026.html]]",
        why: "Real GST notices appear in your account on the official GST portal and carry a DIN (Document Identification Number). An HTML attachment with a \"secure link\" is a fake login page that steals your GST login or payment details. The sender is not the official gov.in domain.",
        todo: "Don't open the attachment. Log in to the official GST portal yourself by typing the address, or ask your CA to check. Report the email to IT and at cybercrime.gov.in."
      },
      otp_real: {
        title: "OTP for a payment you just started",
        ctx: "You have just started a UPI payment of ₹2,500 to your packaging vendor. This SMS arrives.",
        who: "",
        subject: "",
        text: "[[ok|Your OTP for the UPI payment of ₹2,500 to Sunrise Packaging that you just started is 482913.]] Valid for 10 minutes. [[ok|Do not share this OTP with anyone, not even the bank.]] - NovaBank",
        why: "You started this payment yourself a moment ago, the amount and the payee match, and the message tells you not to share the code. A genuine OTP is only for the action you yourself requested, and the bank never asks you to tell it to anyone.",
        todo: "Type the OTP only in the app you are using. If an OTP arrives when you did not start anything, somebody is trying to use your account: do not share it, and call the bank on the number printed on your card."
      },
      digital_arrest: {
        title: "Video call from a \"CBI officer\"",
        ctx: "A video call from an unknown number. The caller wears a uniform and sits in an office with a flag behind him.",
        who: "\"CBI Officer Verma\"",
        subject: "",
        text: "\"[[threat|A parcel with drugs and 6 passports was booked in your name. A case is registered against you.]] [[urgent|Stay on this video call, do not disconnect]], and [[secret|do not tell anyone, not even your family, they are also under watch]]. [[money|Transfer ₹3,50,000 to this RBI verification account for checking]]; it will be returned after the investigation.\"",
        why: "This is a \"digital arrest\". No police, CBI or court arrests anyone on a video call, and no agency asks you to transfer money to a \"verification account\". The uniform, office background and ID card are all fake. Secrecy and keeping you on the call stop you from thinking.",
        todo: "Hang up at once. Real officers do not call on WhatsApp. Call 1930 or report at cybercrime.gov.in, and tell a colleague or family member immediately."
      },
      courier: {
        title: "Call: your parcel is held at customs",
        ctx: "A recorded voice, then a person. You have not ordered anything from abroad.",
        who: "\"SpeedParcel Customer Service\"",
        subject: "",
        text: "\"Hello, this is the customs department of SpeedParcel. [[threat|A parcel in your name is held at customs because it contains illegal items.]] To avoid a police case, [[urgent|press 1 now]] to speak to an officer, or [[money|pay the ₹2,999 clearance fee]] on the link we will send.\"",
        why: "Courier companies do not call about illegal items, and customs does not collect fees by phone. Pressing 1 connects you to a fake \"officer\" who then tries a digital-arrest scam or asks for payments.",
        todo: "Cut the call. If you really ordered something, check the tracking number on the courier's official website. Report the number on the Sanchar Saathi (Chakshu) portal."
      },
      task_job: {
        title: "Telegram job: earn ₹8,000 a day rating hotels",
        ctx: "A Telegram message after you applied for jobs online last week.",
        who: "HR Priya - Online Jobs",
        subject: "",
        text: "Congratulations, you are selected! [[prize|Earn ₹3,000 to ₹8,000 daily by rating hotels online]], only 20 minutes of work. The first 3 tasks are free. For premium tasks you [[money|deposit ₹5,000 and get back ₹7,500 within one hour]]. [[urgent|Only 4 seats left today!]]",
        why: "This is a task scam. The first small payments are real, to build trust. Then you \"deposit\" for premium tasks and the money never comes back. No real job pays you to click, and no employer asks you to deposit money.",
        todo: "Don't deposit anything. Block and report the account. If you have already paid, call 1930 immediately; the first hour matters most."
      },
      vendor_real: {
        title: "Payment reminder from a known vendor",
        ctx: "An email from the packaging vendor you pay every month, from their usual address.",
        who: "Sunrise Packaging Billing",
        subject: "Payment reminder - Invoice SP/26-27/0431 due 10 Oct",
        text: "Dear Meridian Textiles team, this is a gentle reminder that invoice SP/26-27/0431 for ₹86,000 is due on 10 October. [[ok|Our bank details are unchanged and are printed on the invoice you already have.]] [[ok|If you receive any email asking to change our bank account, please call our office on the number in your records before paying.]] Thank you.",
        why: "A regular reminder from the known vendor address, no new bank details, no threat, and the vendor itself asks you to verify by phone if anything looks different. That is exactly how a genuine partner behaves.",
        todo: "Pay through your normal process to the account already in your records. Any change request should be confirmed on a known phone number."
      },
      deepfake: {
        title: "The MD's voice asks for an urgent transfer",
        ctx: "A phone call from an unknown number. The voice sounds exactly like your MD, with airport noise behind.",
        who: "\"Rajesh Sir\" (the MD's voice)",
        subject: "",
        text: "\"Hello, it's me, I am at the airport, you can hear it is noisy. [[urgent|I need you to transfer ₹2,00,000 right now]] to a new supplier for the Dubai order. [[newacct|I will WhatsApp you the account number.]] [[secret|Don't call me back, my phone is going on flight mode, just do it before I land.]]\"",
        why: "AI can copy anyone's voice from a 30-second clip of a speech or video. A cloned voice plus a new account number plus \"don't call me back\" is a deepfake scam. The background noise is added on purpose.",
        todo: "Say you will call back, then call the MD on the saved number or check with a second senior person. Agree on a code word in your team for urgent phone requests. No transfer without the normal approval."
      },
      qr_receive: {
        title: "Buyer sends a QR code to \"receive\" money",
        ctx: "You advertised 12 used office chairs on a classified-ads site. A buyer writes on WhatsApp.",
        who: "Buyer for office chairs",
        subject: "",
        text: "Hi, I saw your ad for 12 used office chairs at ₹18,000. I will pay the full amount now. [[upi|I have sent a QR code: scan it and enter your UPI PIN to receive the money.]] [[odd|I am an army officer posted outside, so my friend will pick up the chairs.]] [[urgent|Please do it in the next 5 minutes, my network is weak.]]",
        why: "You never scan a QR or enter a PIN to RECEIVE money. Scanning and entering the PIN PAYS the other person. The \"army officer\" story and the hurry are standard tricks on classified-ad sites.",
        todo: "Refuse. Ask the buyer to send money to your UPI ID; you need to do nothing to receive it. Report the number in the app."
      },
      fake_care: {
        title: "Customer-care number found on search",
        ctx: "A refund did not arrive. You searched online for the bank's customer care and called the first number shown.",
        who: "\"NovaBank Customer Care\"",
        subject: "",
        text: "\"Thank you for calling NovaBank customer care. For your refund of ₹3,200 we need to verify you. [[otp|Please tell me your 16-digit card number, expiry date and the OTP you receive now.]] [[remote|Also install the Quick Support app I am sending so I can process it faster.]]\"",
        why: "You called a fake number placed in search results or on a fake website. No bank asks for the full card number, expiry, CVV or OTP, and never asks you to install a remote-control app.",
        todo: "Cut the call. Use only the number printed on the back of your card or inside the official app. Never install an app a caller asks for. If you shared anything, block the card in the app at once and call 1930."
      },
      hr_real: {
        title: "Diwali holiday list from HR",
        ctx: "An email to all staff from the company's HR address.",
        who: "HR Department",
        subject: "Holiday list for Diwali week",
        text: "Dear all, the office will be closed from 7 to 9 November for Diwali. [[ok|The full holiday list is on the HR page of the intranet]], the same page you use for leave. [[ok|No action is needed from you.]] Wishing everyone a happy and safe Diwali. - HR Team",
        why: "Sent from the company's own HR address, information only, no link to an outside site, no attachment to open and nothing to fill in. Genuine notices do not need urgency.",
        todo: "Nothing to do. If an email about holidays or a bonus asks you to log in or fill in bank details, treat that as a red flag and ask HR in person."
      },
      screen_share: {
        title: "\"UPI helpline\" wants to see your screen",
        ctx: "A call minutes after a UPI payment failed and you complained on social media.",
        who: "\"UPI Helpline\"",
        subject: "",
        text: "\"Sir, your UPI payment of ₹1,500 is stuck. I can fix it in 2 minutes. [[remote|Please install the screen-sharing app from the link I sent and read me the 9-digit code on the screen.]] Keep your banking app open, I only need to see it. [[otp|When the OTP comes, don't cut the call, I will guide you.]]\"",
        why: "Remote-access and screen-sharing apps let the caller see and control your phone; the 9-digit code gives them full access. Together with an OTP they can empty the account within minutes. Genuine helplines never ask to see your screen.",
        todo: "Cut the call and uninstall any app you installed. Complain only inside the official UPI or bank app. If money has moved, call 1930 and your bank immediately."
      },
      invoice_exe: {
        title: "Invoice attachment ending in .exe",
        ctx: "An email to the accounts mailbox from a company you do not remember buying from.",
        who: "Global Trade Supplies",
        subject: "Invoice attached - please process",
        text: "[[odd|Dear Sir,]] please find attached the invoice for the goods delivered last week. [[attach|Attachment: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|Kindly process payment today]] and confirm. [[odd|Regards, Accounts Dept.]]",
        why: "A file ending in .exe is a program, not a PDF; the \".pdf\" in the name is a disguise. Opening it installs malware or ransomware that can lock every computer in the office. A vague greeting and no company signature are extra warnings.",
        todo: "Don't open the attachment. Report the email to IT. Check your records: did you actually buy from this company? Turn on \"show file extensions\" on office computers so such tricks are visible."
      },
      echallan: {
        title: "Traffic e-challan SMS with an app link",
        ctx: "An SMS to the office driver's phone in the evening.",
        who: "",
        subject: "",
        text: "Traffic e-Challan: your vehicle KA-05-XX-1234 was recorded jumping a signal on 1 October. [[money|Fine ₹1,000.]] [[urgent|Pay within 24 hours]] to avoid double fine and court summons. [[link|Download the official challan app: echallan-pay.example.net/app.apk]]",
        why: "Real e-challan messages come from a government sender ID, not a personal mobile number, and never ask you to download an .apk file. The APK is a malicious app that reads your SMS and OTPs.",
        todo: "Delete the message. Check challans only on the official government e-challan website or the state police app. Report the number on Sanchar Saathi (Chakshu)."
      },
      parcel_real: {
        title: "Delivery update for a parcel you expect",
        ctx: "You ordered packaging material last week. This SMS arrives.",
        who: "",
        subject: "",
        text: "SpeedParcel: your shipment SP48213 from Sunrise Packaging [[ok|will be delivered today between 2 pm and 5 pm.]] [[ok|No payment is due.]] [[ok|To track, use your shipment number on our website or app.]]",
        why: "Sent from a registered sender ID (not a personal number), matches a parcel you expect, asks for no money and gives no link to tap. A genuine delivery message just informs you.",
        todo: "Nothing to do. If a parcel message asks for a fee, a link or an app, stop and check on the official website using the shipment number."
      },
      kyc: {
        title: "KYC expired, account blocked today",
        ctx: "An SMS to the owner's phone at night.",
        who: "",
        subject: "",
        text: "Dear customer, [[threat|your NovaBank account will be blocked today]] because your KYC has expired. [[urgent|Update immediately]] at [[link|novabank-kyc-update.example.net]] or [[sender|call our officer on 94XXX XXX51]].",
        why: "Banks never send KYC links from a personal mobile number and never block an account within hours. The link opens a fake bank page that steals your login and OTP; the \"officer\" asks you to install an app.",
        todo: "Don't tap the link or call. If KYC is really due, the bank's own app or branch will tell you. Report the SMS on Sanchar Saathi (Chakshu)."
      },
      sim_swap: {
        title: "Call: your SIM will be deactivated",
        ctx: "A call to the office manager, who uses this number for bank OTPs.",
        who: "\"Telecom company executive\"",
        subject: "",
        text: "\"Madam, this is from your mobile network. [[threat|Your SIM will be deactivated in 24 hours]] because the 5G upgrade is pending. [[otp|To upgrade, read out the 20-digit number printed on your SIM card and press 1 after the SMS you receive.]] [[urgent|This offer closes today.]]\"",
        why: "This is a SIM-swap attempt. With the 20-digit SIM number and your \"1\", the fraudster activates your number on their own SIM. Your phone goes dead and every OTP for banking and UPI then goes to them.",
        todo: "Cut the call. Telecom companies never call for 5G upgrades. If your phone suddenly loses network for a long time, call your bank first, then your operator. Check SIMs issued in your name on Sanchar Saathi."
      },
      mfa: {
        title: "Seventh login approval request since midnight",
        ctx: "Your phone keeps buzzing at night with sign-in approval requests from the office login app. Then a call comes.",
        who: "SecureLogin app",
        subject: "",
        text: "[[otp|Approve sign-in? Someone is trying to sign in to your office account from a new device. Tap APPROVE to continue.]] [[odd|(This is the 7th request since midnight.)]] A moment later a caller says: \"[[urgent|This is IT, we are fixing a server. Please just approve the request so the alerts stop.]]\"",
        why: "This is \"MFA fatigue\". The attacker already has your password and is spamming approval requests, hoping you tap Approve to make them stop. The \"IT\" call is part of the attack. Real IT never asks you to approve a login you did not start.",
        todo: "Tap Deny every time. Change your password from a trusted device right away and tell IT. The repeated requests mean your password has already leaked."
      },
      gst_real: {
        title: "Monthly GST reminder from your CA",
        ctx: "A WhatsApp message from your chartered accountant's saved number.",
        who: "Mehta & Co. (our CA)",
        subject: "",
        text: "Good morning. Reminder: GSTR-3B for September is due on 20 October. [[ok|Please upload the sales and purchase sheets to the same shared folder as every month.]] [[ok|No payment is needed from your side right now]]; I will send the challan details after filing, and we can confirm on our usual call.",
        why: "Known CA, saved number, the usual monthly process, no new account number, no link and no urgency beyond the real due date. Verification happens on your regular call.",
        todo: "Follow your normal process. If one day the \"CA\" sends a new bank account or asks you to pay through a link, call the CA office on the known number first."
      },
      lookalike: {
        title: "Salary slip on a look-alike domain",
        ctx: "An email about a revised salary slip. Your company's real domain is meridiantextiles.example.com.",
        who: "Payroll Team",
        subject: "Your revised salary slip is ready",
        text: "Dear employee, your salary structure has been revised from October. [[link|Log in at meridian-textiles-portal.example.com with your office password to view the new slip.]] [[urgent|The link expires in 12 hours.]] [[sender|Sent from payroll@meridian-textiles.example.com]]",
        why: "The real company domain is meridiantextiles.example.com; the email uses meridian-textiles (with a hyphen), a look-alike domain. The link leads to a copied login page that steals your office password. A salary slip would be on the HR portal you always use.",
        todo: "Don't click. Open the HR portal yourself by typing the address or from your bookmark. Report the email to IT; forwarding it helps them block the fake domain for everyone."
      },
      usb: {
        title: "Pen drive found in the parking lot",
        ctx: "Monday morning, near the office entrance.",
        who: "A pen drive found in the office parking",
        subject: "",
        text: "A pen drive lies near the entrance with a label: [[prize|\"Salary Revision 2026 - CONFIDENTIAL - Management only\"]]. A colleague says: \"[[remote|Let's plug it into the reception PC and see whose it is.]]\"",
        why: "This is a \"USB drop\". Attackers leave pen drives with tempting labels; the moment one is plugged in, hidden software can install itself and spread across the office network. Curiosity is the attack.",
        todo: "Don't plug it in anywhere. Hand it to IT or security in an envelope. Companies should disable auto-run and block unknown USB devices."
      },
      wifi: {
        title: "Free airport Wi-Fi asks for your email password",
        ctx: "Waiting for a flight, you connect to a free network to approve two vendor payments.",
        who: "Free Wi-Fi login screen at the airport",
        subject: "",
        text: "Network: Airport_Free_WiFi_5G (no password). [[otp|To continue, sign in with your email address and email password.]] Then you plan to [[data|approve two vendor payments on the company banking portal]] while waiting for your flight.",
        why: "Anyone can create a hotspot with an official-sounding name. On a fake network the attacker can see what you type, and a login page that asks for your email password is harvesting credentials. Banking on public Wi-Fi is a risk.",
        todo: "Use your own mobile data or the company VPN for work and banking. Never type your office or email password on a Wi-Fi login page. Turn off auto-connect to open networks."
      },
      upi_real: {
        title: "Payment received notification",
        ctx: "A notification from your own UPI app while you are at the counter.",
        who: "UPI app",
        subject: "",
        text: "[[ok|₹2,500 received from Anita Traders]] into your current account ending 4471. [[ok|No action needed.]] Transaction ID 628104...",
        why: "Money coming IN never needs your PIN, OTP or a scan. The notification is from your own app, names the payer and asks nothing of you. Compare this with a \"collect request\" or a QR you are asked to scan: those take money OUT.",
        todo: "Nothing to do. Check the amount against your invoice. If a \"payment received\" message ever asks you to approve, enter a PIN or scan, it is taking money, not giving it."
      },
      dpdp: {
        title: "Colleague wants the customer list on WhatsApp",
        ctx: "A WhatsApp message from a sales colleague's number in the evening.",
        who: "Sameer (sales colleague)",
        subject: "",
        text: "Bro, I am working from home today. [[data|Please export the full customer list with phone numbers and Aadhaar copies and send it to me on this WhatsApp]], I will delete it later. [[urgent|Need it in 10 minutes for the campaign.]] [[secret|No need to tell the manager, it's a small thing.]]",
        why: "Customer phone numbers and Aadhaar copies are personal data protected by India's DPDP Act. Sending them on personal WhatsApp takes them outside company control, and this could also be a hacked account or an impersonation. \"Don't tell the manager\" is never acceptable.",
        todo: "Say no politely. Share customer data only through the company's approved system, with the manager's approval and only the fields needed. If a colleague's account seems odd, call them."
      },
      otp_call: {
        title: "\"Fraud department\" needs the OTP to cancel a payment",
        ctx: "A call while an OTP SMS arrives on your phone.",
        who: "\"NovaBank Fraud Department\"",
        subject: "",
        text: "\"Sir, [[threat|a transaction of ₹49,999 is happening on your card right now.]] To cancel it [[urgent|we must act within 60 seconds]]. [[otp|Tell me the OTP that has just arrived on your phone and I will reverse it.]] [[secret|Please do not disconnect or call anyone.]]\"",
        why: "The OTP that \"just arrived\" is for the scammer's own attempt to pay with your card. Reading it out completes the payment. Banks never ask for an OTP to cancel anything, and the 60-second panic is created so you don't think.",
        todo: "Cut the call. Open your bank app and block the card yourself, or call the number on the back of your card. Never read an OTP to anyone. If money has left, call 1930 right away."
      },
      hr_bonus: {
        title: "Diwali bonus form asks for net-banking login",
        ctx: "An email to all staff just before Diwali, from an address that looks like HR.",
        who: "HR Rewards Team",
        subject: "Diwali bonus ₹25,000 - confirm your bank account",
        text: "Dear team member, we are pleased to announce a Diwali bonus of ₹25,000. [[attach|Open the attached form (Bonus_Form.html)]] and [[otp|enter your net-banking user ID and password]] so that the bonus is credited directly. [[urgent|Forms received after 6 pm today will not be processed.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR already has your salary account; no company asks for your net-banking login for a bonus. The sender is a look-alike domain, the HTML attachment is a fake bank login page, and a same-day deadline adds pressure.",
        todo: "Don't open the attachment or enter anything. Ask HR in person or on the intranet. Report the email to IT so colleagues are warned."
      },
      electricity: {
        title: "Office power will be cut tonight",
        ctx: "An SMS to the shop owner's phone at 8:35 pm.",
        who: "",
        subject: "",
        text: "Dear consumer, [[threat|your office electricity connection will be disconnected tonight at 9:30 pm]] because [[odd|last month bill is not update in our system]]. Please contact our officer [[sender|93XXX XXX40]] [[urgent|immediately]].",
        why: "Electricity boards don't disconnect at night after one SMS from a personal mobile. When you call, the \"officer\" asks you to install an app or pay ₹10 through a link, and the real target is your bank account.",
        todo: "Don't call. Check the bill in the electricity board's official app or office. Report the number on Sanchar Saathi (Chakshu)."
      },
      wa_hijack: {
        title: "Colleague asks you to forward a 6-digit code",
        ctx: "A late-night WhatsApp message from a colleague's saved number, right after a code SMS arrived on your phone.",
        who: "Rohan (colleague)",
        subject: "",
        text: "Hey, sorry to disturb you so late. [[odd|I entered your number by mistake while logging into WhatsApp and a 6-digit code went to your phone.]] [[otp|Please forward me that code]], [[urgent|quickly, otherwise my account will be locked.]]",
        why: "The code that arrived is the verification code for YOUR WhatsApp. Whoever gets it takes over your account and then messages all your contacts and office groups asking for money. The message itself may come from a colleague's already-hijacked account.",
        todo: "Never forward a verification code. Phone the colleague to warn them that their account is hacked. Turn on two-step verification in WhatsApp settings."
      },
      invest_group: {
        title: "Stock-tips group with guaranteed returns",
        ctx: "You were added to a WhatsApp group without asking.",
        who: "VIP Stock Tips - Group admin",
        subject: "",
        text: "Welcome to our premium group! [[prize|Our members earned 32% returns last month with guaranteed insider tips.]] Download our trading app from [[link|this link, not from the app store]], and [[money|start with a deposit of ₹50,000]]. [[prize|See the screenshots of profits posted by members!]] [[urgent|Entry closes at midnight.]]",
        why: "Nobody can guarantee returns, and \"insider tips\" are illegal. The app is fake: it shows imaginary profits so you deposit more, and withdrawal is never allowed. The \"members\" posting screenshots are the scammers.",
        todo: "Leave and report the group. Invest only through SEBI-registered brokers and apps from the official app store. If you have deposited, call 1930 and report at cybercrime.gov.in."
      },
      bank_real: {
        title: "Debit alert for a payment you made",
        ctx: "Your accounts team paid the packaging vendor today. This SMS arrives.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|₹86,000 debited from account ending 4471 on 10 Oct for NEFT to Sunrise Packaging]], ref N26101034. Balance ₹3,42,118. [[ok|If not done by you, call the number on the back of your debit card.]]",
        why: "This matches the payment your accounts team made today, comes from the bank's sender ID, has no link or number inside the SMS and points you to the number on your own card.",
        todo: "Match it with your payment records. If any debit alert does not match a payment you made, call the bank immediately using the number on the card, not a number from a message."
      }
    }
  },
  pa: {
    scenarios: {
      ceo_gift: {
        title: "Boss on a new number wants gift cards",
        ctx: "WhatsApp message to an accounts executive at 9 am. The profile photo is the MD's photo from the company website.",
        who: "Rajesh Sir (new number)",
        subject: "",
        text: "Hi, this is Rajesh. [[sender|My old phone is damaged, I am using this number for now.]] I am in a meeting with a big client. [[money|Buy 10 gift cards of ₹5,000 each]] and send me the codes [[urgent|within 30 minutes]]. [[secret|Please don't discuss this with anyone, it is a surprise for the client.]]",
        why: "Scammers copy the MD's photo from the website and write from a new number. A real boss never asks for gift-card codes or for secrecy. New number + urgency + secrecy is the classic \"CEO fraud\".",
        todo: "Don't buy anything. Call your boss on the number saved in your phone, or walk to their cabin. Tell IT or your manager so the whole office is warned."
      },
      it_real: {
        title: "Password policy notice from IT",
        ctx: "An email to all staff from the company's own IT helpdesk.",
        who: "IT Helpdesk",
        subject: "Password policy change from 15 October",
        text: "Dear colleagues, from 15 October passwords must be at least 12 characters long. [[ok|You do not need to do anything today.]] When your password expires, change it [[ok|on the office portal you normally use]]. [[ok|IT will never ask for your password by email, phone or WhatsApp.]] For doubts, visit the helpdesk on the 2nd floor.",
        why: "The sender is the company's own IT address. There is no link to click, no attachment, no deadline and no request for a password. Genuine notices tell you what will happen and let you use the normal portal yourself.",
        todo: "Nothing urgent. If you are unsure whether a notice is real, walk to the helpdesk or call the extension number you already know."
      },
      bec_vendor: {
        title: "Vendor says its bank account has changed",
        ctx: "An email to the accounts team about a pending invoice of ₹4,80,000.",
        who: "Kaveri Logistics Accounts",
        subject: "URGENT: Updated bank details for Invoice KL/2026/0912",
        text: "Dear Sir/Madam, [[newacct|our company bank account has changed after an audit. Please pay the pending invoice of ₹4,80,000 to the new account given below.]] [[urgent|Payment must be released today]] to avoid delay of your shipment. [[sender|Kindly reply only to this email ID]], our office phones are under maintenance.",
        why: "This is Business Email Compromise (BEC). Criminals hack or copy a vendor's email and send \"new bank details\". The address is slightly different from the real vendor, the phones \"are not working\" so you cannot verify, and everything is urgent.",
        todo: "Never change a vendor's bank details because of an email. Call the vendor on the number from your old records or purchase order, never the number in the email. Use two-person approval for every bank-detail change."
      },
      gst_notice: {
        title: "GST penalty notice with an attachment",
        ctx: "An email to the accounts mailbox early in the morning.",
        who: "GST Department",
        subject: "Show Cause Notice - Penalty ₹1,24,500 - Action required",
        text: "[[odd|Dear Taxpayer,]] a mismatch is found in your GST returns. A penalty of ₹1,24,500 is due. [[threat|Your GSTIN will be suspended in 48 hours]] if it is not paid. [[link|Open the attached notice and pay through the secure link]] to avoid legal action. [[attach|Attachment: GST_Notice_2026.html]]",
        why: "Real GST notices appear in your account on the official GST portal and carry a DIN (Document Identification Number). An HTML attachment with a \"secure link\" is a fake login page that steals your GST login or payment details. The sender is not the official gov.in domain.",
        todo: "Don't open the attachment. Log in to the official GST portal yourself by typing the address, or ask your CA to check. Report the email to IT and at cybercrime.gov.in."
      },
      otp_real: {
        title: "OTP for a payment you just started",
        ctx: "You have just started a UPI payment of ₹2,500 to your packaging vendor. This SMS arrives.",
        who: "",
        subject: "",
        text: "[[ok|Your OTP for the UPI payment of ₹2,500 to Sunrise Packaging that you just started is 482913.]] Valid for 10 minutes. [[ok|Do not share this OTP with anyone, not even the bank.]] - NovaBank",
        why: "You started this payment yourself a moment ago, the amount and the payee match, and the message tells you not to share the code. A genuine OTP is only for the action you yourself requested, and the bank never asks you to tell it to anyone.",
        todo: "Type the OTP only in the app you are using. If an OTP arrives when you did not start anything, somebody is trying to use your account: do not share it, and call the bank on the number printed on your card."
      },
      digital_arrest: {
        title: "Video call from a \"CBI officer\"",
        ctx: "A video call from an unknown number. The caller wears a uniform and sits in an office with a flag behind him.",
        who: "\"CBI Officer Verma\"",
        subject: "",
        text: "\"[[threat|A parcel with drugs and 6 passports was booked in your name. A case is registered against you.]] [[urgent|Stay on this video call, do not disconnect]], and [[secret|do not tell anyone, not even your family, they are also under watch]]. [[money|Transfer ₹3,50,000 to this RBI verification account for checking]]; it will be returned after the investigation.\"",
        why: "This is a \"digital arrest\". No police, CBI or court arrests anyone on a video call, and no agency asks you to transfer money to a \"verification account\". The uniform, office background and ID card are all fake. Secrecy and keeping you on the call stop you from thinking.",
        todo: "Hang up at once. Real officers do not call on WhatsApp. Call 1930 or report at cybercrime.gov.in, and tell a colleague or family member immediately."
      },
      courier: {
        title: "Call: your parcel is held at customs",
        ctx: "A recorded voice, then a person. You have not ordered anything from abroad.",
        who: "\"SpeedParcel Customer Service\"",
        subject: "",
        text: "\"Hello, this is the customs department of SpeedParcel. [[threat|A parcel in your name is held at customs because it contains illegal items.]] To avoid a police case, [[urgent|press 1 now]] to speak to an officer, or [[money|pay the ₹2,999 clearance fee]] on the link we will send.\"",
        why: "Courier companies do not call about illegal items, and customs does not collect fees by phone. Pressing 1 connects you to a fake \"officer\" who then tries a digital-arrest scam or asks for payments.",
        todo: "Cut the call. If you really ordered something, check the tracking number on the courier's official website. Report the number on the Sanchar Saathi (Chakshu) portal."
      },
      task_job: {
        title: "Telegram job: earn ₹8,000 a day rating hotels",
        ctx: "A Telegram message after you applied for jobs online last week.",
        who: "HR Priya - Online Jobs",
        subject: "",
        text: "Congratulations, you are selected! [[prize|Earn ₹3,000 to ₹8,000 daily by rating hotels online]], only 20 minutes of work. The first 3 tasks are free. For premium tasks you [[money|deposit ₹5,000 and get back ₹7,500 within one hour]]. [[urgent|Only 4 seats left today!]]",
        why: "This is a task scam. The first small payments are real, to build trust. Then you \"deposit\" for premium tasks and the money never comes back. No real job pays you to click, and no employer asks you to deposit money.",
        todo: "Don't deposit anything. Block and report the account. If you have already paid, call 1930 immediately; the first hour matters most."
      },
      vendor_real: {
        title: "Payment reminder from a known vendor",
        ctx: "An email from the packaging vendor you pay every month, from their usual address.",
        who: "Sunrise Packaging Billing",
        subject: "Payment reminder - Invoice SP/26-27/0431 due 10 Oct",
        text: "Dear Meridian Textiles team, this is a gentle reminder that invoice SP/26-27/0431 for ₹86,000 is due on 10 October. [[ok|Our bank details are unchanged and are printed on the invoice you already have.]] [[ok|If you receive any email asking to change our bank account, please call our office on the number in your records before paying.]] Thank you.",
        why: "A regular reminder from the known vendor address, no new bank details, no threat, and the vendor itself asks you to verify by phone if anything looks different. That is exactly how a genuine partner behaves.",
        todo: "Pay through your normal process to the account already in your records. Any change request should be confirmed on a known phone number."
      },
      deepfake: {
        title: "The MD's voice asks for an urgent transfer",
        ctx: "A phone call from an unknown number. The voice sounds exactly like your MD, with airport noise behind.",
        who: "\"Rajesh Sir\" (the MD's voice)",
        subject: "",
        text: "\"Hello, it's me, I am at the airport, you can hear it is noisy. [[urgent|I need you to transfer ₹2,00,000 right now]] to a new supplier for the Dubai order. [[newacct|I will WhatsApp you the account number.]] [[secret|Don't call me back, my phone is going on flight mode, just do it before I land.]]\"",
        why: "AI can copy anyone's voice from a 30-second clip of a speech or video. A cloned voice plus a new account number plus \"don't call me back\" is a deepfake scam. The background noise is added on purpose.",
        todo: "Say you will call back, then call the MD on the saved number or check with a second senior person. Agree on a code word in your team for urgent phone requests. No transfer without the normal approval."
      },
      qr_receive: {
        title: "Buyer sends a QR code to \"receive\" money",
        ctx: "You advertised 12 used office chairs on a classified-ads site. A buyer writes on WhatsApp.",
        who: "Buyer for office chairs",
        subject: "",
        text: "Hi, I saw your ad for 12 used office chairs at ₹18,000. I will pay the full amount now. [[upi|I have sent a QR code: scan it and enter your UPI PIN to receive the money.]] [[odd|I am an army officer posted outside, so my friend will pick up the chairs.]] [[urgent|Please do it in the next 5 minutes, my network is weak.]]",
        why: "You never scan a QR or enter a PIN to RECEIVE money. Scanning and entering the PIN PAYS the other person. The \"army officer\" story and the hurry are standard tricks on classified-ad sites.",
        todo: "Refuse. Ask the buyer to send money to your UPI ID; you need to do nothing to receive it. Report the number in the app."
      },
      fake_care: {
        title: "Customer-care number found on search",
        ctx: "A refund did not arrive. You searched online for the bank's customer care and called the first number shown.",
        who: "\"NovaBank Customer Care\"",
        subject: "",
        text: "\"Thank you for calling NovaBank customer care. For your refund of ₹3,200 we need to verify you. [[otp|Please tell me your 16-digit card number, expiry date and the OTP you receive now.]] [[remote|Also install the Quick Support app I am sending so I can process it faster.]]\"",
        why: "You called a fake number placed in search results or on a fake website. No bank asks for the full card number, expiry, CVV or OTP, and never asks you to install a remote-control app.",
        todo: "Cut the call. Use only the number printed on the back of your card or inside the official app. Never install an app a caller asks for. If you shared anything, block the card in the app at once and call 1930."
      },
      hr_real: {
        title: "Diwali holiday list from HR",
        ctx: "An email to all staff from the company's HR address.",
        who: "HR Department",
        subject: "Holiday list for Diwali week",
        text: "Dear all, the office will be closed from 7 to 9 November for Diwali. [[ok|The full holiday list is on the HR page of the intranet]], the same page you use for leave. [[ok|No action is needed from you.]] Wishing everyone a happy and safe Diwali. - HR Team",
        why: "Sent from the company's own HR address, information only, no link to an outside site, no attachment to open and nothing to fill in. Genuine notices do not need urgency.",
        todo: "Nothing to do. If an email about holidays or a bonus asks you to log in or fill in bank details, treat that as a red flag and ask HR in person."
      },
      screen_share: {
        title: "\"UPI helpline\" wants to see your screen",
        ctx: "A call minutes after a UPI payment failed and you complained on social media.",
        who: "\"UPI Helpline\"",
        subject: "",
        text: "\"Sir, your UPI payment of ₹1,500 is stuck. I can fix it in 2 minutes. [[remote|Please install the screen-sharing app from the link I sent and read me the 9-digit code on the screen.]] Keep your banking app open, I only need to see it. [[otp|When the OTP comes, don't cut the call, I will guide you.]]\"",
        why: "Remote-access and screen-sharing apps let the caller see and control your phone; the 9-digit code gives them full access. Together with an OTP they can empty the account within minutes. Genuine helplines never ask to see your screen.",
        todo: "Cut the call and uninstall any app you installed. Complain only inside the official UPI or bank app. If money has moved, call 1930 and your bank immediately."
      },
      invoice_exe: {
        title: "Invoice attachment ending in .exe",
        ctx: "An email to the accounts mailbox from a company you do not remember buying from.",
        who: "Global Trade Supplies",
        subject: "Invoice attached - please process",
        text: "[[odd|Dear Sir,]] please find attached the invoice for the goods delivered last week. [[attach|Attachment: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|Kindly process payment today]] and confirm. [[odd|Regards, Accounts Dept.]]",
        why: "A file ending in .exe is a program, not a PDF; the \".pdf\" in the name is a disguise. Opening it installs malware or ransomware that can lock every computer in the office. A vague greeting and no company signature are extra warnings.",
        todo: "Don't open the attachment. Report the email to IT. Check your records: did you actually buy from this company? Turn on \"show file extensions\" on office computers so such tricks are visible."
      },
      echallan: {
        title: "Traffic e-challan SMS with an app link",
        ctx: "An SMS to the office driver's phone in the evening.",
        who: "",
        subject: "",
        text: "Traffic e-Challan: your vehicle KA-05-XX-1234 was recorded jumping a signal on 1 October. [[money|Fine ₹1,000.]] [[urgent|Pay within 24 hours]] to avoid double fine and court summons. [[link|Download the official challan app: echallan-pay.example.net/app.apk]]",
        why: "Real e-challan messages come from a government sender ID, not a personal mobile number, and never ask you to download an .apk file. The APK is a malicious app that reads your SMS and OTPs.",
        todo: "Delete the message. Check challans only on the official government e-challan website or the state police app. Report the number on Sanchar Saathi (Chakshu)."
      },
      parcel_real: {
        title: "Delivery update for a parcel you expect",
        ctx: "You ordered packaging material last week. This SMS arrives.",
        who: "",
        subject: "",
        text: "SpeedParcel: your shipment SP48213 from Sunrise Packaging [[ok|will be delivered today between 2 pm and 5 pm.]] [[ok|No payment is due.]] [[ok|To track, use your shipment number on our website or app.]]",
        why: "Sent from a registered sender ID (not a personal number), matches a parcel you expect, asks for no money and gives no link to tap. A genuine delivery message just informs you.",
        todo: "Nothing to do. If a parcel message asks for a fee, a link or an app, stop and check on the official website using the shipment number."
      },
      kyc: {
        title: "KYC expired, account blocked today",
        ctx: "An SMS to the owner's phone at night.",
        who: "",
        subject: "",
        text: "Dear customer, [[threat|your NovaBank account will be blocked today]] because your KYC has expired. [[urgent|Update immediately]] at [[link|novabank-kyc-update.example.net]] or [[sender|call our officer on 94XXX XXX51]].",
        why: "Banks never send KYC links from a personal mobile number and never block an account within hours. The link opens a fake bank page that steals your login and OTP; the \"officer\" asks you to install an app.",
        todo: "Don't tap the link or call. If KYC is really due, the bank's own app or branch will tell you. Report the SMS on Sanchar Saathi (Chakshu)."
      },
      sim_swap: {
        title: "Call: your SIM will be deactivated",
        ctx: "A call to the office manager, who uses this number for bank OTPs.",
        who: "\"Telecom company executive\"",
        subject: "",
        text: "\"Madam, this is from your mobile network. [[threat|Your SIM will be deactivated in 24 hours]] because the 5G upgrade is pending. [[otp|To upgrade, read out the 20-digit number printed on your SIM card and press 1 after the SMS you receive.]] [[urgent|This offer closes today.]]\"",
        why: "This is a SIM-swap attempt. With the 20-digit SIM number and your \"1\", the fraudster activates your number on their own SIM. Your phone goes dead and every OTP for banking and UPI then goes to them.",
        todo: "Cut the call. Telecom companies never call for 5G upgrades. If your phone suddenly loses network for a long time, call your bank first, then your operator. Check SIMs issued in your name on Sanchar Saathi."
      },
      mfa: {
        title: "Seventh login approval request since midnight",
        ctx: "Your phone keeps buzzing at night with sign-in approval requests from the office login app. Then a call comes.",
        who: "SecureLogin app",
        subject: "",
        text: "[[otp|Approve sign-in? Someone is trying to sign in to your office account from a new device. Tap APPROVE to continue.]] [[odd|(This is the 7th request since midnight.)]] A moment later a caller says: \"[[urgent|This is IT, we are fixing a server. Please just approve the request so the alerts stop.]]\"",
        why: "This is \"MFA fatigue\". The attacker already has your password and is spamming approval requests, hoping you tap Approve to make them stop. The \"IT\" call is part of the attack. Real IT never asks you to approve a login you did not start.",
        todo: "Tap Deny every time. Change your password from a trusted device right away and tell IT. The repeated requests mean your password has already leaked."
      },
      gst_real: {
        title: "Monthly GST reminder from your CA",
        ctx: "A WhatsApp message from your chartered accountant's saved number.",
        who: "Mehta & Co. (our CA)",
        subject: "",
        text: "Good morning. Reminder: GSTR-3B for September is due on 20 October. [[ok|Please upload the sales and purchase sheets to the same shared folder as every month.]] [[ok|No payment is needed from your side right now]]; I will send the challan details after filing, and we can confirm on our usual call.",
        why: "Known CA, saved number, the usual monthly process, no new account number, no link and no urgency beyond the real due date. Verification happens on your regular call.",
        todo: "Follow your normal process. If one day the \"CA\" sends a new bank account or asks you to pay through a link, call the CA office on the known number first."
      },
      lookalike: {
        title: "Salary slip on a look-alike domain",
        ctx: "An email about a revised salary slip. Your company's real domain is meridiantextiles.example.com.",
        who: "Payroll Team",
        subject: "Your revised salary slip is ready",
        text: "Dear employee, your salary structure has been revised from October. [[link|Log in at meridian-textiles-portal.example.com with your office password to view the new slip.]] [[urgent|The link expires in 12 hours.]] [[sender|Sent from payroll@meridian-textiles.example.com]]",
        why: "The real company domain is meridiantextiles.example.com; the email uses meridian-textiles (with a hyphen), a look-alike domain. The link leads to a copied login page that steals your office password. A salary slip would be on the HR portal you always use.",
        todo: "Don't click. Open the HR portal yourself by typing the address or from your bookmark. Report the email to IT; forwarding it helps them block the fake domain for everyone."
      },
      usb: {
        title: "Pen drive found in the parking lot",
        ctx: "Monday morning, near the office entrance.",
        who: "A pen drive found in the office parking",
        subject: "",
        text: "A pen drive lies near the entrance with a label: [[prize|\"Salary Revision 2026 - CONFIDENTIAL - Management only\"]]. A colleague says: \"[[remote|Let's plug it into the reception PC and see whose it is.]]\"",
        why: "This is a \"USB drop\". Attackers leave pen drives with tempting labels; the moment one is plugged in, hidden software can install itself and spread across the office network. Curiosity is the attack.",
        todo: "Don't plug it in anywhere. Hand it to IT or security in an envelope. Companies should disable auto-run and block unknown USB devices."
      },
      wifi: {
        title: "Free airport Wi-Fi asks for your email password",
        ctx: "Waiting for a flight, you connect to a free network to approve two vendor payments.",
        who: "Free Wi-Fi login screen at the airport",
        subject: "",
        text: "Network: Airport_Free_WiFi_5G (no password). [[otp|To continue, sign in with your email address and email password.]] Then you plan to [[data|approve two vendor payments on the company banking portal]] while waiting for your flight.",
        why: "Anyone can create a hotspot with an official-sounding name. On a fake network the attacker can see what you type, and a login page that asks for your email password is harvesting credentials. Banking on public Wi-Fi is a risk.",
        todo: "Use your own mobile data or the company VPN for work and banking. Never type your office or email password on a Wi-Fi login page. Turn off auto-connect to open networks."
      },
      upi_real: {
        title: "Payment received notification",
        ctx: "A notification from your own UPI app while you are at the counter.",
        who: "UPI app",
        subject: "",
        text: "[[ok|₹2,500 received from Anita Traders]] into your current account ending 4471. [[ok|No action needed.]] Transaction ID 628104...",
        why: "Money coming IN never needs your PIN, OTP or a scan. The notification is from your own app, names the payer and asks nothing of you. Compare this with a \"collect request\" or a QR you are asked to scan: those take money OUT.",
        todo: "Nothing to do. Check the amount against your invoice. If a \"payment received\" message ever asks you to approve, enter a PIN or scan, it is taking money, not giving it."
      },
      dpdp: {
        title: "Colleague wants the customer list on WhatsApp",
        ctx: "A WhatsApp message from a sales colleague's number in the evening.",
        who: "Sameer (sales colleague)",
        subject: "",
        text: "Bro, I am working from home today. [[data|Please export the full customer list with phone numbers and Aadhaar copies and send it to me on this WhatsApp]], I will delete it later. [[urgent|Need it in 10 minutes for the campaign.]] [[secret|No need to tell the manager, it's a small thing.]]",
        why: "Customer phone numbers and Aadhaar copies are personal data protected by India's DPDP Act. Sending them on personal WhatsApp takes them outside company control, and this could also be a hacked account or an impersonation. \"Don't tell the manager\" is never acceptable.",
        todo: "Say no politely. Share customer data only through the company's approved system, with the manager's approval and only the fields needed. If a colleague's account seems odd, call them."
      },
      otp_call: {
        title: "\"Fraud department\" needs the OTP to cancel a payment",
        ctx: "A call while an OTP SMS arrives on your phone.",
        who: "\"NovaBank Fraud Department\"",
        subject: "",
        text: "\"Sir, [[threat|a transaction of ₹49,999 is happening on your card right now.]] To cancel it [[urgent|we must act within 60 seconds]]. [[otp|Tell me the OTP that has just arrived on your phone and I will reverse it.]] [[secret|Please do not disconnect or call anyone.]]\"",
        why: "The OTP that \"just arrived\" is for the scammer's own attempt to pay with your card. Reading it out completes the payment. Banks never ask for an OTP to cancel anything, and the 60-second panic is created so you don't think.",
        todo: "Cut the call. Open your bank app and block the card yourself, or call the number on the back of your card. Never read an OTP to anyone. If money has left, call 1930 right away."
      },
      hr_bonus: {
        title: "Diwali bonus form asks for net-banking login",
        ctx: "An email to all staff just before Diwali, from an address that looks like HR.",
        who: "HR Rewards Team",
        subject: "Diwali bonus ₹25,000 - confirm your bank account",
        text: "Dear team member, we are pleased to announce a Diwali bonus of ₹25,000. [[attach|Open the attached form (Bonus_Form.html)]] and [[otp|enter your net-banking user ID and password]] so that the bonus is credited directly. [[urgent|Forms received after 6 pm today will not be processed.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR already has your salary account; no company asks for your net-banking login for a bonus. The sender is a look-alike domain, the HTML attachment is a fake bank login page, and a same-day deadline adds pressure.",
        todo: "Don't open the attachment or enter anything. Ask HR in person or on the intranet. Report the email to IT so colleagues are warned."
      },
      electricity: {
        title: "Office power will be cut tonight",
        ctx: "An SMS to the shop owner's phone at 8:35 pm.",
        who: "",
        subject: "",
        text: "Dear consumer, [[threat|your office electricity connection will be disconnected tonight at 9:30 pm]] because [[odd|last month bill is not update in our system]]. Please contact our officer [[sender|93XXX XXX40]] [[urgent|immediately]].",
        why: "Electricity boards don't disconnect at night after one SMS from a personal mobile. When you call, the \"officer\" asks you to install an app or pay ₹10 through a link, and the real target is your bank account.",
        todo: "Don't call. Check the bill in the electricity board's official app or office. Report the number on Sanchar Saathi (Chakshu)."
      },
      wa_hijack: {
        title: "Colleague asks you to forward a 6-digit code",
        ctx: "A late-night WhatsApp message from a colleague's saved number, right after a code SMS arrived on your phone.",
        who: "Rohan (colleague)",
        subject: "",
        text: "Hey, sorry to disturb you so late. [[odd|I entered your number by mistake while logging into WhatsApp and a 6-digit code went to your phone.]] [[otp|Please forward me that code]], [[urgent|quickly, otherwise my account will be locked.]]",
        why: "The code that arrived is the verification code for YOUR WhatsApp. Whoever gets it takes over your account and then messages all your contacts and office groups asking for money. The message itself may come from a colleague's already-hijacked account.",
        todo: "Never forward a verification code. Phone the colleague to warn them that their account is hacked. Turn on two-step verification in WhatsApp settings."
      },
      invest_group: {
        title: "Stock-tips group with guaranteed returns",
        ctx: "You were added to a WhatsApp group without asking.",
        who: "VIP Stock Tips - Group admin",
        subject: "",
        text: "Welcome to our premium group! [[prize|Our members earned 32% returns last month with guaranteed insider tips.]] Download our trading app from [[link|this link, not from the app store]], and [[money|start with a deposit of ₹50,000]]. [[prize|See the screenshots of profits posted by members!]] [[urgent|Entry closes at midnight.]]",
        why: "Nobody can guarantee returns, and \"insider tips\" are illegal. The app is fake: it shows imaginary profits so you deposit more, and withdrawal is never allowed. The \"members\" posting screenshots are the scammers.",
        todo: "Leave and report the group. Invest only through SEBI-registered brokers and apps from the official app store. If you have deposited, call 1930 and report at cybercrime.gov.in."
      },
      bank_real: {
        title: "Debit alert for a payment you made",
        ctx: "Your accounts team paid the packaging vendor today. This SMS arrives.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|₹86,000 debited from account ending 4471 on 10 Oct for NEFT to Sunrise Packaging]], ref N26101034. Balance ₹3,42,118. [[ok|If not done by you, call the number on the back of your debit card.]]",
        why: "This matches the payment your accounts team made today, comes from the bank's sender ID, has no link or number inside the SMS and points you to the number on your own card.",
        todo: "Match it with your payment records. If any debit alert does not match a payment you made, call the bank immediately using the number on the card, not a number from a message."
      }
    }
  },
  or: {
    scenarios: {
      ceo_gift: {
        title: "Boss on a new number wants gift cards",
        ctx: "WhatsApp message to an accounts executive at 9 am. The profile photo is the MD's photo from the company website.",
        who: "Rajesh Sir (new number)",
        subject: "",
        text: "Hi, this is Rajesh. [[sender|My old phone is damaged, I am using this number for now.]] I am in a meeting with a big client. [[money|Buy 10 gift cards of ₹5,000 each]] and send me the codes [[urgent|within 30 minutes]]. [[secret|Please don't discuss this with anyone, it is a surprise for the client.]]",
        why: "Scammers copy the MD's photo from the website and write from a new number. A real boss never asks for gift-card codes or for secrecy. New number + urgency + secrecy is the classic \"CEO fraud\".",
        todo: "Don't buy anything. Call your boss on the number saved in your phone, or walk to their cabin. Tell IT or your manager so the whole office is warned."
      },
      it_real: {
        title: "Password policy notice from IT",
        ctx: "An email to all staff from the company's own IT helpdesk.",
        who: "IT Helpdesk",
        subject: "Password policy change from 15 October",
        text: "Dear colleagues, from 15 October passwords must be at least 12 characters long. [[ok|You do not need to do anything today.]] When your password expires, change it [[ok|on the office portal you normally use]]. [[ok|IT will never ask for your password by email, phone or WhatsApp.]] For doubts, visit the helpdesk on the 2nd floor.",
        why: "The sender is the company's own IT address. There is no link to click, no attachment, no deadline and no request for a password. Genuine notices tell you what will happen and let you use the normal portal yourself.",
        todo: "Nothing urgent. If you are unsure whether a notice is real, walk to the helpdesk or call the extension number you already know."
      },
      bec_vendor: {
        title: "Vendor says its bank account has changed",
        ctx: "An email to the accounts team about a pending invoice of ₹4,80,000.",
        who: "Kaveri Logistics Accounts",
        subject: "URGENT: Updated bank details for Invoice KL/2026/0912",
        text: "Dear Sir/Madam, [[newacct|our company bank account has changed after an audit. Please pay the pending invoice of ₹4,80,000 to the new account given below.]] [[urgent|Payment must be released today]] to avoid delay of your shipment. [[sender|Kindly reply only to this email ID]], our office phones are under maintenance.",
        why: "This is Business Email Compromise (BEC). Criminals hack or copy a vendor's email and send \"new bank details\". The address is slightly different from the real vendor, the phones \"are not working\" so you cannot verify, and everything is urgent.",
        todo: "Never change a vendor's bank details because of an email. Call the vendor on the number from your old records or purchase order, never the number in the email. Use two-person approval for every bank-detail change."
      },
      gst_notice: {
        title: "GST penalty notice with an attachment",
        ctx: "An email to the accounts mailbox early in the morning.",
        who: "GST Department",
        subject: "Show Cause Notice - Penalty ₹1,24,500 - Action required",
        text: "[[odd|Dear Taxpayer,]] a mismatch is found in your GST returns. A penalty of ₹1,24,500 is due. [[threat|Your GSTIN will be suspended in 48 hours]] if it is not paid. [[link|Open the attached notice and pay through the secure link]] to avoid legal action. [[attach|Attachment: GST_Notice_2026.html]]",
        why: "Real GST notices appear in your account on the official GST portal and carry a DIN (Document Identification Number). An HTML attachment with a \"secure link\" is a fake login page that steals your GST login or payment details. The sender is not the official gov.in domain.",
        todo: "Don't open the attachment. Log in to the official GST portal yourself by typing the address, or ask your CA to check. Report the email to IT and at cybercrime.gov.in."
      },
      otp_real: {
        title: "OTP for a payment you just started",
        ctx: "You have just started a UPI payment of ₹2,500 to your packaging vendor. This SMS arrives.",
        who: "",
        subject: "",
        text: "[[ok|Your OTP for the UPI payment of ₹2,500 to Sunrise Packaging that you just started is 482913.]] Valid for 10 minutes. [[ok|Do not share this OTP with anyone, not even the bank.]] - NovaBank",
        why: "You started this payment yourself a moment ago, the amount and the payee match, and the message tells you not to share the code. A genuine OTP is only for the action you yourself requested, and the bank never asks you to tell it to anyone.",
        todo: "Type the OTP only in the app you are using. If an OTP arrives when you did not start anything, somebody is trying to use your account: do not share it, and call the bank on the number printed on your card."
      },
      digital_arrest: {
        title: "Video call from a \"CBI officer\"",
        ctx: "A video call from an unknown number. The caller wears a uniform and sits in an office with a flag behind him.",
        who: "\"CBI Officer Verma\"",
        subject: "",
        text: "\"[[threat|A parcel with drugs and 6 passports was booked in your name. A case is registered against you.]] [[urgent|Stay on this video call, do not disconnect]], and [[secret|do not tell anyone, not even your family, they are also under watch]]. [[money|Transfer ₹3,50,000 to this RBI verification account for checking]]; it will be returned after the investigation.\"",
        why: "This is a \"digital arrest\". No police, CBI or court arrests anyone on a video call, and no agency asks you to transfer money to a \"verification account\". The uniform, office background and ID card are all fake. Secrecy and keeping you on the call stop you from thinking.",
        todo: "Hang up at once. Real officers do not call on WhatsApp. Call 1930 or report at cybercrime.gov.in, and tell a colleague or family member immediately."
      },
      courier: {
        title: "Call: your parcel is held at customs",
        ctx: "A recorded voice, then a person. You have not ordered anything from abroad.",
        who: "\"SpeedParcel Customer Service\"",
        subject: "",
        text: "\"Hello, this is the customs department of SpeedParcel. [[threat|A parcel in your name is held at customs because it contains illegal items.]] To avoid a police case, [[urgent|press 1 now]] to speak to an officer, or [[money|pay the ₹2,999 clearance fee]] on the link we will send.\"",
        why: "Courier companies do not call about illegal items, and customs does not collect fees by phone. Pressing 1 connects you to a fake \"officer\" who then tries a digital-arrest scam or asks for payments.",
        todo: "Cut the call. If you really ordered something, check the tracking number on the courier's official website. Report the number on the Sanchar Saathi (Chakshu) portal."
      },
      task_job: {
        title: "Telegram job: earn ₹8,000 a day rating hotels",
        ctx: "A Telegram message after you applied for jobs online last week.",
        who: "HR Priya - Online Jobs",
        subject: "",
        text: "Congratulations, you are selected! [[prize|Earn ₹3,000 to ₹8,000 daily by rating hotels online]], only 20 minutes of work. The first 3 tasks are free. For premium tasks you [[money|deposit ₹5,000 and get back ₹7,500 within one hour]]. [[urgent|Only 4 seats left today!]]",
        why: "This is a task scam. The first small payments are real, to build trust. Then you \"deposit\" for premium tasks and the money never comes back. No real job pays you to click, and no employer asks you to deposit money.",
        todo: "Don't deposit anything. Block and report the account. If you have already paid, call 1930 immediately; the first hour matters most."
      },
      vendor_real: {
        title: "Payment reminder from a known vendor",
        ctx: "An email from the packaging vendor you pay every month, from their usual address.",
        who: "Sunrise Packaging Billing",
        subject: "Payment reminder - Invoice SP/26-27/0431 due 10 Oct",
        text: "Dear Meridian Textiles team, this is a gentle reminder that invoice SP/26-27/0431 for ₹86,000 is due on 10 October. [[ok|Our bank details are unchanged and are printed on the invoice you already have.]] [[ok|If you receive any email asking to change our bank account, please call our office on the number in your records before paying.]] Thank you.",
        why: "A regular reminder from the known vendor address, no new bank details, no threat, and the vendor itself asks you to verify by phone if anything looks different. That is exactly how a genuine partner behaves.",
        todo: "Pay through your normal process to the account already in your records. Any change request should be confirmed on a known phone number."
      },
      deepfake: {
        title: "The MD's voice asks for an urgent transfer",
        ctx: "A phone call from an unknown number. The voice sounds exactly like your MD, with airport noise behind.",
        who: "\"Rajesh Sir\" (the MD's voice)",
        subject: "",
        text: "\"Hello, it's me, I am at the airport, you can hear it is noisy. [[urgent|I need you to transfer ₹2,00,000 right now]] to a new supplier for the Dubai order. [[newacct|I will WhatsApp you the account number.]] [[secret|Don't call me back, my phone is going on flight mode, just do it before I land.]]\"",
        why: "AI can copy anyone's voice from a 30-second clip of a speech or video. A cloned voice plus a new account number plus \"don't call me back\" is a deepfake scam. The background noise is added on purpose.",
        todo: "Say you will call back, then call the MD on the saved number or check with a second senior person. Agree on a code word in your team for urgent phone requests. No transfer without the normal approval."
      },
      qr_receive: {
        title: "Buyer sends a QR code to \"receive\" money",
        ctx: "You advertised 12 used office chairs on a classified-ads site. A buyer writes on WhatsApp.",
        who: "Buyer for office chairs",
        subject: "",
        text: "Hi, I saw your ad for 12 used office chairs at ₹18,000. I will pay the full amount now. [[upi|I have sent a QR code: scan it and enter your UPI PIN to receive the money.]] [[odd|I am an army officer posted outside, so my friend will pick up the chairs.]] [[urgent|Please do it in the next 5 minutes, my network is weak.]]",
        why: "You never scan a QR or enter a PIN to RECEIVE money. Scanning and entering the PIN PAYS the other person. The \"army officer\" story and the hurry are standard tricks on classified-ad sites.",
        todo: "Refuse. Ask the buyer to send money to your UPI ID; you need to do nothing to receive it. Report the number in the app."
      },
      fake_care: {
        title: "Customer-care number found on search",
        ctx: "A refund did not arrive. You searched online for the bank's customer care and called the first number shown.",
        who: "\"NovaBank Customer Care\"",
        subject: "",
        text: "\"Thank you for calling NovaBank customer care. For your refund of ₹3,200 we need to verify you. [[otp|Please tell me your 16-digit card number, expiry date and the OTP you receive now.]] [[remote|Also install the Quick Support app I am sending so I can process it faster.]]\"",
        why: "You called a fake number placed in search results or on a fake website. No bank asks for the full card number, expiry, CVV or OTP, and never asks you to install a remote-control app.",
        todo: "Cut the call. Use only the number printed on the back of your card or inside the official app. Never install an app a caller asks for. If you shared anything, block the card in the app at once and call 1930."
      },
      hr_real: {
        title: "Diwali holiday list from HR",
        ctx: "An email to all staff from the company's HR address.",
        who: "HR Department",
        subject: "Holiday list for Diwali week",
        text: "Dear all, the office will be closed from 7 to 9 November for Diwali. [[ok|The full holiday list is on the HR page of the intranet]], the same page you use for leave. [[ok|No action is needed from you.]] Wishing everyone a happy and safe Diwali. - HR Team",
        why: "Sent from the company's own HR address, information only, no link to an outside site, no attachment to open and nothing to fill in. Genuine notices do not need urgency.",
        todo: "Nothing to do. If an email about holidays or a bonus asks you to log in or fill in bank details, treat that as a red flag and ask HR in person."
      },
      screen_share: {
        title: "\"UPI helpline\" wants to see your screen",
        ctx: "A call minutes after a UPI payment failed and you complained on social media.",
        who: "\"UPI Helpline\"",
        subject: "",
        text: "\"Sir, your UPI payment of ₹1,500 is stuck. I can fix it in 2 minutes. [[remote|Please install the screen-sharing app from the link I sent and read me the 9-digit code on the screen.]] Keep your banking app open, I only need to see it. [[otp|When the OTP comes, don't cut the call, I will guide you.]]\"",
        why: "Remote-access and screen-sharing apps let the caller see and control your phone; the 9-digit code gives them full access. Together with an OTP they can empty the account within minutes. Genuine helplines never ask to see your screen.",
        todo: "Cut the call and uninstall any app you installed. Complain only inside the official UPI or bank app. If money has moved, call 1930 and your bank immediately."
      },
      invoice_exe: {
        title: "Invoice attachment ending in .exe",
        ctx: "An email to the accounts mailbox from a company you do not remember buying from.",
        who: "Global Trade Supplies",
        subject: "Invoice attached - please process",
        text: "[[odd|Dear Sir,]] please find attached the invoice for the goods delivered last week. [[attach|Attachment: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|Kindly process payment today]] and confirm. [[odd|Regards, Accounts Dept.]]",
        why: "A file ending in .exe is a program, not a PDF; the \".pdf\" in the name is a disguise. Opening it installs malware or ransomware that can lock every computer in the office. A vague greeting and no company signature are extra warnings.",
        todo: "Don't open the attachment. Report the email to IT. Check your records: did you actually buy from this company? Turn on \"show file extensions\" on office computers so such tricks are visible."
      },
      echallan: {
        title: "Traffic e-challan SMS with an app link",
        ctx: "An SMS to the office driver's phone in the evening.",
        who: "",
        subject: "",
        text: "Traffic e-Challan: your vehicle KA-05-XX-1234 was recorded jumping a signal on 1 October. [[money|Fine ₹1,000.]] [[urgent|Pay within 24 hours]] to avoid double fine and court summons. [[link|Download the official challan app: echallan-pay.example.net/app.apk]]",
        why: "Real e-challan messages come from a government sender ID, not a personal mobile number, and never ask you to download an .apk file. The APK is a malicious app that reads your SMS and OTPs.",
        todo: "Delete the message. Check challans only on the official government e-challan website or the state police app. Report the number on Sanchar Saathi (Chakshu)."
      },
      parcel_real: {
        title: "Delivery update for a parcel you expect",
        ctx: "You ordered packaging material last week. This SMS arrives.",
        who: "",
        subject: "",
        text: "SpeedParcel: your shipment SP48213 from Sunrise Packaging [[ok|will be delivered today between 2 pm and 5 pm.]] [[ok|No payment is due.]] [[ok|To track, use your shipment number on our website or app.]]",
        why: "Sent from a registered sender ID (not a personal number), matches a parcel you expect, asks for no money and gives no link to tap. A genuine delivery message just informs you.",
        todo: "Nothing to do. If a parcel message asks for a fee, a link or an app, stop and check on the official website using the shipment number."
      },
      kyc: {
        title: "KYC expired, account blocked today",
        ctx: "An SMS to the owner's phone at night.",
        who: "",
        subject: "",
        text: "Dear customer, [[threat|your NovaBank account will be blocked today]] because your KYC has expired. [[urgent|Update immediately]] at [[link|novabank-kyc-update.example.net]] or [[sender|call our officer on 94XXX XXX51]].",
        why: "Banks never send KYC links from a personal mobile number and never block an account within hours. The link opens a fake bank page that steals your login and OTP; the \"officer\" asks you to install an app.",
        todo: "Don't tap the link or call. If KYC is really due, the bank's own app or branch will tell you. Report the SMS on Sanchar Saathi (Chakshu)."
      },
      sim_swap: {
        title: "Call: your SIM will be deactivated",
        ctx: "A call to the office manager, who uses this number for bank OTPs.",
        who: "\"Telecom company executive\"",
        subject: "",
        text: "\"Madam, this is from your mobile network. [[threat|Your SIM will be deactivated in 24 hours]] because the 5G upgrade is pending. [[otp|To upgrade, read out the 20-digit number printed on your SIM card and press 1 after the SMS you receive.]] [[urgent|This offer closes today.]]\"",
        why: "This is a SIM-swap attempt. With the 20-digit SIM number and your \"1\", the fraudster activates your number on their own SIM. Your phone goes dead and every OTP for banking and UPI then goes to them.",
        todo: "Cut the call. Telecom companies never call for 5G upgrades. If your phone suddenly loses network for a long time, call your bank first, then your operator. Check SIMs issued in your name on Sanchar Saathi."
      },
      mfa: {
        title: "Seventh login approval request since midnight",
        ctx: "Your phone keeps buzzing at night with sign-in approval requests from the office login app. Then a call comes.",
        who: "SecureLogin app",
        subject: "",
        text: "[[otp|Approve sign-in? Someone is trying to sign in to your office account from a new device. Tap APPROVE to continue.]] [[odd|(This is the 7th request since midnight.)]] A moment later a caller says: \"[[urgent|This is IT, we are fixing a server. Please just approve the request so the alerts stop.]]\"",
        why: "This is \"MFA fatigue\". The attacker already has your password and is spamming approval requests, hoping you tap Approve to make them stop. The \"IT\" call is part of the attack. Real IT never asks you to approve a login you did not start.",
        todo: "Tap Deny every time. Change your password from a trusted device right away and tell IT. The repeated requests mean your password has already leaked."
      },
      gst_real: {
        title: "Monthly GST reminder from your CA",
        ctx: "A WhatsApp message from your chartered accountant's saved number.",
        who: "Mehta & Co. (our CA)",
        subject: "",
        text: "Good morning. Reminder: GSTR-3B for September is due on 20 October. [[ok|Please upload the sales and purchase sheets to the same shared folder as every month.]] [[ok|No payment is needed from your side right now]]; I will send the challan details after filing, and we can confirm on our usual call.",
        why: "Known CA, saved number, the usual monthly process, no new account number, no link and no urgency beyond the real due date. Verification happens on your regular call.",
        todo: "Follow your normal process. If one day the \"CA\" sends a new bank account or asks you to pay through a link, call the CA office on the known number first."
      },
      lookalike: {
        title: "Salary slip on a look-alike domain",
        ctx: "An email about a revised salary slip. Your company's real domain is meridiantextiles.example.com.",
        who: "Payroll Team",
        subject: "Your revised salary slip is ready",
        text: "Dear employee, your salary structure has been revised from October. [[link|Log in at meridian-textiles-portal.example.com with your office password to view the new slip.]] [[urgent|The link expires in 12 hours.]] [[sender|Sent from payroll@meridian-textiles.example.com]]",
        why: "The real company domain is meridiantextiles.example.com; the email uses meridian-textiles (with a hyphen), a look-alike domain. The link leads to a copied login page that steals your office password. A salary slip would be on the HR portal you always use.",
        todo: "Don't click. Open the HR portal yourself by typing the address or from your bookmark. Report the email to IT; forwarding it helps them block the fake domain for everyone."
      },
      usb: {
        title: "Pen drive found in the parking lot",
        ctx: "Monday morning, near the office entrance.",
        who: "A pen drive found in the office parking",
        subject: "",
        text: "A pen drive lies near the entrance with a label: [[prize|\"Salary Revision 2026 - CONFIDENTIAL - Management only\"]]. A colleague says: \"[[remote|Let's plug it into the reception PC and see whose it is.]]\"",
        why: "This is a \"USB drop\". Attackers leave pen drives with tempting labels; the moment one is plugged in, hidden software can install itself and spread across the office network. Curiosity is the attack.",
        todo: "Don't plug it in anywhere. Hand it to IT or security in an envelope. Companies should disable auto-run and block unknown USB devices."
      },
      wifi: {
        title: "Free airport Wi-Fi asks for your email password",
        ctx: "Waiting for a flight, you connect to a free network to approve two vendor payments.",
        who: "Free Wi-Fi login screen at the airport",
        subject: "",
        text: "Network: Airport_Free_WiFi_5G (no password). [[otp|To continue, sign in with your email address and email password.]] Then you plan to [[data|approve two vendor payments on the company banking portal]] while waiting for your flight.",
        why: "Anyone can create a hotspot with an official-sounding name. On a fake network the attacker can see what you type, and a login page that asks for your email password is harvesting credentials. Banking on public Wi-Fi is a risk.",
        todo: "Use your own mobile data or the company VPN for work and banking. Never type your office or email password on a Wi-Fi login page. Turn off auto-connect to open networks."
      },
      upi_real: {
        title: "Payment received notification",
        ctx: "A notification from your own UPI app while you are at the counter.",
        who: "UPI app",
        subject: "",
        text: "[[ok|₹2,500 received from Anita Traders]] into your current account ending 4471. [[ok|No action needed.]] Transaction ID 628104...",
        why: "Money coming IN never needs your PIN, OTP or a scan. The notification is from your own app, names the payer and asks nothing of you. Compare this with a \"collect request\" or a QR you are asked to scan: those take money OUT.",
        todo: "Nothing to do. Check the amount against your invoice. If a \"payment received\" message ever asks you to approve, enter a PIN or scan, it is taking money, not giving it."
      },
      dpdp: {
        title: "Colleague wants the customer list on WhatsApp",
        ctx: "A WhatsApp message from a sales colleague's number in the evening.",
        who: "Sameer (sales colleague)",
        subject: "",
        text: "Bro, I am working from home today. [[data|Please export the full customer list with phone numbers and Aadhaar copies and send it to me on this WhatsApp]], I will delete it later. [[urgent|Need it in 10 minutes for the campaign.]] [[secret|No need to tell the manager, it's a small thing.]]",
        why: "Customer phone numbers and Aadhaar copies are personal data protected by India's DPDP Act. Sending them on personal WhatsApp takes them outside company control, and this could also be a hacked account or an impersonation. \"Don't tell the manager\" is never acceptable.",
        todo: "Say no politely. Share customer data only through the company's approved system, with the manager's approval and only the fields needed. If a colleague's account seems odd, call them."
      },
      otp_call: {
        title: "\"Fraud department\" needs the OTP to cancel a payment",
        ctx: "A call while an OTP SMS arrives on your phone.",
        who: "\"NovaBank Fraud Department\"",
        subject: "",
        text: "\"Sir, [[threat|a transaction of ₹49,999 is happening on your card right now.]] To cancel it [[urgent|we must act within 60 seconds]]. [[otp|Tell me the OTP that has just arrived on your phone and I will reverse it.]] [[secret|Please do not disconnect or call anyone.]]\"",
        why: "The OTP that \"just arrived\" is for the scammer's own attempt to pay with your card. Reading it out completes the payment. Banks never ask for an OTP to cancel anything, and the 60-second panic is created so you don't think.",
        todo: "Cut the call. Open your bank app and block the card yourself, or call the number on the back of your card. Never read an OTP to anyone. If money has left, call 1930 right away."
      },
      hr_bonus: {
        title: "Diwali bonus form asks for net-banking login",
        ctx: "An email to all staff just before Diwali, from an address that looks like HR.",
        who: "HR Rewards Team",
        subject: "Diwali bonus ₹25,000 - confirm your bank account",
        text: "Dear team member, we are pleased to announce a Diwali bonus of ₹25,000. [[attach|Open the attached form (Bonus_Form.html)]] and [[otp|enter your net-banking user ID and password]] so that the bonus is credited directly. [[urgent|Forms received after 6 pm today will not be processed.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR already has your salary account; no company asks for your net-banking login for a bonus. The sender is a look-alike domain, the HTML attachment is a fake bank login page, and a same-day deadline adds pressure.",
        todo: "Don't open the attachment or enter anything. Ask HR in person or on the intranet. Report the email to IT so colleagues are warned."
      },
      electricity: {
        title: "Office power will be cut tonight",
        ctx: "An SMS to the shop owner's phone at 8:35 pm.",
        who: "",
        subject: "",
        text: "Dear consumer, [[threat|your office electricity connection will be disconnected tonight at 9:30 pm]] because [[odd|last month bill is not update in our system]]. Please contact our officer [[sender|93XXX XXX40]] [[urgent|immediately]].",
        why: "Electricity boards don't disconnect at night after one SMS from a personal mobile. When you call, the \"officer\" asks you to install an app or pay ₹10 through a link, and the real target is your bank account.",
        todo: "Don't call. Check the bill in the electricity board's official app or office. Report the number on Sanchar Saathi (Chakshu)."
      },
      wa_hijack: {
        title: "Colleague asks you to forward a 6-digit code",
        ctx: "A late-night WhatsApp message from a colleague's saved number, right after a code SMS arrived on your phone.",
        who: "Rohan (colleague)",
        subject: "",
        text: "Hey, sorry to disturb you so late. [[odd|I entered your number by mistake while logging into WhatsApp and a 6-digit code went to your phone.]] [[otp|Please forward me that code]], [[urgent|quickly, otherwise my account will be locked.]]",
        why: "The code that arrived is the verification code for YOUR WhatsApp. Whoever gets it takes over your account and then messages all your contacts and office groups asking for money. The message itself may come from a colleague's already-hijacked account.",
        todo: "Never forward a verification code. Phone the colleague to warn them that their account is hacked. Turn on two-step verification in WhatsApp settings."
      },
      invest_group: {
        title: "Stock-tips group with guaranteed returns",
        ctx: "You were added to a WhatsApp group without asking.",
        who: "VIP Stock Tips - Group admin",
        subject: "",
        text: "Welcome to our premium group! [[prize|Our members earned 32% returns last month with guaranteed insider tips.]] Download our trading app from [[link|this link, not from the app store]], and [[money|start with a deposit of ₹50,000]]. [[prize|See the screenshots of profits posted by members!]] [[urgent|Entry closes at midnight.]]",
        why: "Nobody can guarantee returns, and \"insider tips\" are illegal. The app is fake: it shows imaginary profits so you deposit more, and withdrawal is never allowed. The \"members\" posting screenshots are the scammers.",
        todo: "Leave and report the group. Invest only through SEBI-registered brokers and apps from the official app store. If you have deposited, call 1930 and report at cybercrime.gov.in."
      },
      bank_real: {
        title: "Debit alert for a payment you made",
        ctx: "Your accounts team paid the packaging vendor today. This SMS arrives.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|₹86,000 debited from account ending 4471 on 10 Oct for NEFT to Sunrise Packaging]], ref N26101034. Balance ₹3,42,118. [[ok|If not done by you, call the number on the back of your debit card.]]",
        why: "This matches the payment your accounts team made today, comes from the bank's sender ID, has no link or number inside the SMS and points you to the number on your own card.",
        todo: "Match it with your payment records. If any debit alert does not match a payment you made, call the bank immediately using the number on the card, not a number from a message."
      }
    }
  },
  ta: {
    scenarios: {
      ceo_gift: {
        title: "Boss on a new number wants gift cards",
        ctx: "WhatsApp message to an accounts executive at 9 am. The profile photo is the MD's photo from the company website.",
        who: "Rajesh Sir (new number)",
        subject: "",
        text: "Hi, this is Rajesh. [[sender|My old phone is damaged, I am using this number for now.]] I am in a meeting with a big client. [[money|Buy 10 gift cards of ₹5,000 each]] and send me the codes [[urgent|within 30 minutes]]. [[secret|Please don't discuss this with anyone, it is a surprise for the client.]]",
        why: "Scammers copy the MD's photo from the website and write from a new number. A real boss never asks for gift-card codes or for secrecy. New number + urgency + secrecy is the classic \"CEO fraud\".",
        todo: "Don't buy anything. Call your boss on the number saved in your phone, or walk to their cabin. Tell IT or your manager so the whole office is warned."
      },
      it_real: {
        title: "Password policy notice from IT",
        ctx: "An email to all staff from the company's own IT helpdesk.",
        who: "IT Helpdesk",
        subject: "Password policy change from 15 October",
        text: "Dear colleagues, from 15 October passwords must be at least 12 characters long. [[ok|You do not need to do anything today.]] When your password expires, change it [[ok|on the office portal you normally use]]. [[ok|IT will never ask for your password by email, phone or WhatsApp.]] For doubts, visit the helpdesk on the 2nd floor.",
        why: "The sender is the company's own IT address. There is no link to click, no attachment, no deadline and no request for a password. Genuine notices tell you what will happen and let you use the normal portal yourself.",
        todo: "Nothing urgent. If you are unsure whether a notice is real, walk to the helpdesk or call the extension number you already know."
      },
      bec_vendor: {
        title: "Vendor says its bank account has changed",
        ctx: "An email to the accounts team about a pending invoice of ₹4,80,000.",
        who: "Kaveri Logistics Accounts",
        subject: "URGENT: Updated bank details for Invoice KL/2026/0912",
        text: "Dear Sir/Madam, [[newacct|our company bank account has changed after an audit. Please pay the pending invoice of ₹4,80,000 to the new account given below.]] [[urgent|Payment must be released today]] to avoid delay of your shipment. [[sender|Kindly reply only to this email ID]], our office phones are under maintenance.",
        why: "This is Business Email Compromise (BEC). Criminals hack or copy a vendor's email and send \"new bank details\". The address is slightly different from the real vendor, the phones \"are not working\" so you cannot verify, and everything is urgent.",
        todo: "Never change a vendor's bank details because of an email. Call the vendor on the number from your old records or purchase order, never the number in the email. Use two-person approval for every bank-detail change."
      },
      gst_notice: {
        title: "GST penalty notice with an attachment",
        ctx: "An email to the accounts mailbox early in the morning.",
        who: "GST Department",
        subject: "Show Cause Notice - Penalty ₹1,24,500 - Action required",
        text: "[[odd|Dear Taxpayer,]] a mismatch is found in your GST returns. A penalty of ₹1,24,500 is due. [[threat|Your GSTIN will be suspended in 48 hours]] if it is not paid. [[link|Open the attached notice and pay through the secure link]] to avoid legal action. [[attach|Attachment: GST_Notice_2026.html]]",
        why: "Real GST notices appear in your account on the official GST portal and carry a DIN (Document Identification Number). An HTML attachment with a \"secure link\" is a fake login page that steals your GST login or payment details. The sender is not the official gov.in domain.",
        todo: "Don't open the attachment. Log in to the official GST portal yourself by typing the address, or ask your CA to check. Report the email to IT and at cybercrime.gov.in."
      },
      otp_real: {
        title: "OTP for a payment you just started",
        ctx: "You have just started a UPI payment of ₹2,500 to your packaging vendor. This SMS arrives.",
        who: "",
        subject: "",
        text: "[[ok|Your OTP for the UPI payment of ₹2,500 to Sunrise Packaging that you just started is 482913.]] Valid for 10 minutes. [[ok|Do not share this OTP with anyone, not even the bank.]] - NovaBank",
        why: "You started this payment yourself a moment ago, the amount and the payee match, and the message tells you not to share the code. A genuine OTP is only for the action you yourself requested, and the bank never asks you to tell it to anyone.",
        todo: "Type the OTP only in the app you are using. If an OTP arrives when you did not start anything, somebody is trying to use your account: do not share it, and call the bank on the number printed on your card."
      },
      digital_arrest: {
        title: "Video call from a \"CBI officer\"",
        ctx: "A video call from an unknown number. The caller wears a uniform and sits in an office with a flag behind him.",
        who: "\"CBI Officer Verma\"",
        subject: "",
        text: "\"[[threat|A parcel with drugs and 6 passports was booked in your name. A case is registered against you.]] [[urgent|Stay on this video call, do not disconnect]], and [[secret|do not tell anyone, not even your family, they are also under watch]]. [[money|Transfer ₹3,50,000 to this RBI verification account for checking]]; it will be returned after the investigation.\"",
        why: "This is a \"digital arrest\". No police, CBI or court arrests anyone on a video call, and no agency asks you to transfer money to a \"verification account\". The uniform, office background and ID card are all fake. Secrecy and keeping you on the call stop you from thinking.",
        todo: "Hang up at once. Real officers do not call on WhatsApp. Call 1930 or report at cybercrime.gov.in, and tell a colleague or family member immediately."
      },
      courier: {
        title: "Call: your parcel is held at customs",
        ctx: "A recorded voice, then a person. You have not ordered anything from abroad.",
        who: "\"SpeedParcel Customer Service\"",
        subject: "",
        text: "\"Hello, this is the customs department of SpeedParcel. [[threat|A parcel in your name is held at customs because it contains illegal items.]] To avoid a police case, [[urgent|press 1 now]] to speak to an officer, or [[money|pay the ₹2,999 clearance fee]] on the link we will send.\"",
        why: "Courier companies do not call about illegal items, and customs does not collect fees by phone. Pressing 1 connects you to a fake \"officer\" who then tries a digital-arrest scam or asks for payments.",
        todo: "Cut the call. If you really ordered something, check the tracking number on the courier's official website. Report the number on the Sanchar Saathi (Chakshu) portal."
      },
      task_job: {
        title: "Telegram job: earn ₹8,000 a day rating hotels",
        ctx: "A Telegram message after you applied for jobs online last week.",
        who: "HR Priya - Online Jobs",
        subject: "",
        text: "Congratulations, you are selected! [[prize|Earn ₹3,000 to ₹8,000 daily by rating hotels online]], only 20 minutes of work. The first 3 tasks are free. For premium tasks you [[money|deposit ₹5,000 and get back ₹7,500 within one hour]]. [[urgent|Only 4 seats left today!]]",
        why: "This is a task scam. The first small payments are real, to build trust. Then you \"deposit\" for premium tasks and the money never comes back. No real job pays you to click, and no employer asks you to deposit money.",
        todo: "Don't deposit anything. Block and report the account. If you have already paid, call 1930 immediately; the first hour matters most."
      },
      vendor_real: {
        title: "Payment reminder from a known vendor",
        ctx: "An email from the packaging vendor you pay every month, from their usual address.",
        who: "Sunrise Packaging Billing",
        subject: "Payment reminder - Invoice SP/26-27/0431 due 10 Oct",
        text: "Dear Meridian Textiles team, this is a gentle reminder that invoice SP/26-27/0431 for ₹86,000 is due on 10 October. [[ok|Our bank details are unchanged and are printed on the invoice you already have.]] [[ok|If you receive any email asking to change our bank account, please call our office on the number in your records before paying.]] Thank you.",
        why: "A regular reminder from the known vendor address, no new bank details, no threat, and the vendor itself asks you to verify by phone if anything looks different. That is exactly how a genuine partner behaves.",
        todo: "Pay through your normal process to the account already in your records. Any change request should be confirmed on a known phone number."
      },
      deepfake: {
        title: "The MD's voice asks for an urgent transfer",
        ctx: "A phone call from an unknown number. The voice sounds exactly like your MD, with airport noise behind.",
        who: "\"Rajesh Sir\" (the MD's voice)",
        subject: "",
        text: "\"Hello, it's me, I am at the airport, you can hear it is noisy. [[urgent|I need you to transfer ₹2,00,000 right now]] to a new supplier for the Dubai order. [[newacct|I will WhatsApp you the account number.]] [[secret|Don't call me back, my phone is going on flight mode, just do it before I land.]]\"",
        why: "AI can copy anyone's voice from a 30-second clip of a speech or video. A cloned voice plus a new account number plus \"don't call me back\" is a deepfake scam. The background noise is added on purpose.",
        todo: "Say you will call back, then call the MD on the saved number or check with a second senior person. Agree on a code word in your team for urgent phone requests. No transfer without the normal approval."
      },
      qr_receive: {
        title: "Buyer sends a QR code to \"receive\" money",
        ctx: "You advertised 12 used office chairs on a classified-ads site. A buyer writes on WhatsApp.",
        who: "Buyer for office chairs",
        subject: "",
        text: "Hi, I saw your ad for 12 used office chairs at ₹18,000. I will pay the full amount now. [[upi|I have sent a QR code: scan it and enter your UPI PIN to receive the money.]] [[odd|I am an army officer posted outside, so my friend will pick up the chairs.]] [[urgent|Please do it in the next 5 minutes, my network is weak.]]",
        why: "You never scan a QR or enter a PIN to RECEIVE money. Scanning and entering the PIN PAYS the other person. The \"army officer\" story and the hurry are standard tricks on classified-ad sites.",
        todo: "Refuse. Ask the buyer to send money to your UPI ID; you need to do nothing to receive it. Report the number in the app."
      },
      fake_care: {
        title: "Customer-care number found on search",
        ctx: "A refund did not arrive. You searched online for the bank's customer care and called the first number shown.",
        who: "\"NovaBank Customer Care\"",
        subject: "",
        text: "\"Thank you for calling NovaBank customer care. For your refund of ₹3,200 we need to verify you. [[otp|Please tell me your 16-digit card number, expiry date and the OTP you receive now.]] [[remote|Also install the Quick Support app I am sending so I can process it faster.]]\"",
        why: "You called a fake number placed in search results or on a fake website. No bank asks for the full card number, expiry, CVV or OTP, and never asks you to install a remote-control app.",
        todo: "Cut the call. Use only the number printed on the back of your card or inside the official app. Never install an app a caller asks for. If you shared anything, block the card in the app at once and call 1930."
      },
      hr_real: {
        title: "Diwali holiday list from HR",
        ctx: "An email to all staff from the company's HR address.",
        who: "HR Department",
        subject: "Holiday list for Diwali week",
        text: "Dear all, the office will be closed from 7 to 9 November for Diwali. [[ok|The full holiday list is on the HR page of the intranet]], the same page you use for leave. [[ok|No action is needed from you.]] Wishing everyone a happy and safe Diwali. - HR Team",
        why: "Sent from the company's own HR address, information only, no link to an outside site, no attachment to open and nothing to fill in. Genuine notices do not need urgency.",
        todo: "Nothing to do. If an email about holidays or a bonus asks you to log in or fill in bank details, treat that as a red flag and ask HR in person."
      },
      screen_share: {
        title: "\"UPI helpline\" wants to see your screen",
        ctx: "A call minutes after a UPI payment failed and you complained on social media.",
        who: "\"UPI Helpline\"",
        subject: "",
        text: "\"Sir, your UPI payment of ₹1,500 is stuck. I can fix it in 2 minutes. [[remote|Please install the screen-sharing app from the link I sent and read me the 9-digit code on the screen.]] Keep your banking app open, I only need to see it. [[otp|When the OTP comes, don't cut the call, I will guide you.]]\"",
        why: "Remote-access and screen-sharing apps let the caller see and control your phone; the 9-digit code gives them full access. Together with an OTP they can empty the account within minutes. Genuine helplines never ask to see your screen.",
        todo: "Cut the call and uninstall any app you installed. Complain only inside the official UPI or bank app. If money has moved, call 1930 and your bank immediately."
      },
      invoice_exe: {
        title: "Invoice attachment ending in .exe",
        ctx: "An email to the accounts mailbox from a company you do not remember buying from.",
        who: "Global Trade Supplies",
        subject: "Invoice attached - please process",
        text: "[[odd|Dear Sir,]] please find attached the invoice for the goods delivered last week. [[attach|Attachment: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|Kindly process payment today]] and confirm. [[odd|Regards, Accounts Dept.]]",
        why: "A file ending in .exe is a program, not a PDF; the \".pdf\" in the name is a disguise. Opening it installs malware or ransomware that can lock every computer in the office. A vague greeting and no company signature are extra warnings.",
        todo: "Don't open the attachment. Report the email to IT. Check your records: did you actually buy from this company? Turn on \"show file extensions\" on office computers so such tricks are visible."
      },
      echallan: {
        title: "Traffic e-challan SMS with an app link",
        ctx: "An SMS to the office driver's phone in the evening.",
        who: "",
        subject: "",
        text: "Traffic e-Challan: your vehicle KA-05-XX-1234 was recorded jumping a signal on 1 October. [[money|Fine ₹1,000.]] [[urgent|Pay within 24 hours]] to avoid double fine and court summons. [[link|Download the official challan app: echallan-pay.example.net/app.apk]]",
        why: "Real e-challan messages come from a government sender ID, not a personal mobile number, and never ask you to download an .apk file. The APK is a malicious app that reads your SMS and OTPs.",
        todo: "Delete the message. Check challans only on the official government e-challan website or the state police app. Report the number on Sanchar Saathi (Chakshu)."
      },
      parcel_real: {
        title: "Delivery update for a parcel you expect",
        ctx: "You ordered packaging material last week. This SMS arrives.",
        who: "",
        subject: "",
        text: "SpeedParcel: your shipment SP48213 from Sunrise Packaging [[ok|will be delivered today between 2 pm and 5 pm.]] [[ok|No payment is due.]] [[ok|To track, use your shipment number on our website or app.]]",
        why: "Sent from a registered sender ID (not a personal number), matches a parcel you expect, asks for no money and gives no link to tap. A genuine delivery message just informs you.",
        todo: "Nothing to do. If a parcel message asks for a fee, a link or an app, stop and check on the official website using the shipment number."
      },
      kyc: {
        title: "KYC expired, account blocked today",
        ctx: "An SMS to the owner's phone at night.",
        who: "",
        subject: "",
        text: "Dear customer, [[threat|your NovaBank account will be blocked today]] because your KYC has expired. [[urgent|Update immediately]] at [[link|novabank-kyc-update.example.net]] or [[sender|call our officer on 94XXX XXX51]].",
        why: "Banks never send KYC links from a personal mobile number and never block an account within hours. The link opens a fake bank page that steals your login and OTP; the \"officer\" asks you to install an app.",
        todo: "Don't tap the link or call. If KYC is really due, the bank's own app or branch will tell you. Report the SMS on Sanchar Saathi (Chakshu)."
      },
      sim_swap: {
        title: "Call: your SIM will be deactivated",
        ctx: "A call to the office manager, who uses this number for bank OTPs.",
        who: "\"Telecom company executive\"",
        subject: "",
        text: "\"Madam, this is from your mobile network. [[threat|Your SIM will be deactivated in 24 hours]] because the 5G upgrade is pending. [[otp|To upgrade, read out the 20-digit number printed on your SIM card and press 1 after the SMS you receive.]] [[urgent|This offer closes today.]]\"",
        why: "This is a SIM-swap attempt. With the 20-digit SIM number and your \"1\", the fraudster activates your number on their own SIM. Your phone goes dead and every OTP for banking and UPI then goes to them.",
        todo: "Cut the call. Telecom companies never call for 5G upgrades. If your phone suddenly loses network for a long time, call your bank first, then your operator. Check SIMs issued in your name on Sanchar Saathi."
      },
      mfa: {
        title: "Seventh login approval request since midnight",
        ctx: "Your phone keeps buzzing at night with sign-in approval requests from the office login app. Then a call comes.",
        who: "SecureLogin app",
        subject: "",
        text: "[[otp|Approve sign-in? Someone is trying to sign in to your office account from a new device. Tap APPROVE to continue.]] [[odd|(This is the 7th request since midnight.)]] A moment later a caller says: \"[[urgent|This is IT, we are fixing a server. Please just approve the request so the alerts stop.]]\"",
        why: "This is \"MFA fatigue\". The attacker already has your password and is spamming approval requests, hoping you tap Approve to make them stop. The \"IT\" call is part of the attack. Real IT never asks you to approve a login you did not start.",
        todo: "Tap Deny every time. Change your password from a trusted device right away and tell IT. The repeated requests mean your password has already leaked."
      },
      gst_real: {
        title: "Monthly GST reminder from your CA",
        ctx: "A WhatsApp message from your chartered accountant's saved number.",
        who: "Mehta & Co. (our CA)",
        subject: "",
        text: "Good morning. Reminder: GSTR-3B for September is due on 20 October. [[ok|Please upload the sales and purchase sheets to the same shared folder as every month.]] [[ok|No payment is needed from your side right now]]; I will send the challan details after filing, and we can confirm on our usual call.",
        why: "Known CA, saved number, the usual monthly process, no new account number, no link and no urgency beyond the real due date. Verification happens on your regular call.",
        todo: "Follow your normal process. If one day the \"CA\" sends a new bank account or asks you to pay through a link, call the CA office on the known number first."
      },
      lookalike: {
        title: "Salary slip on a look-alike domain",
        ctx: "An email about a revised salary slip. Your company's real domain is meridiantextiles.example.com.",
        who: "Payroll Team",
        subject: "Your revised salary slip is ready",
        text: "Dear employee, your salary structure has been revised from October. [[link|Log in at meridian-textiles-portal.example.com with your office password to view the new slip.]] [[urgent|The link expires in 12 hours.]] [[sender|Sent from payroll@meridian-textiles.example.com]]",
        why: "The real company domain is meridiantextiles.example.com; the email uses meridian-textiles (with a hyphen), a look-alike domain. The link leads to a copied login page that steals your office password. A salary slip would be on the HR portal you always use.",
        todo: "Don't click. Open the HR portal yourself by typing the address or from your bookmark. Report the email to IT; forwarding it helps them block the fake domain for everyone."
      },
      usb: {
        title: "Pen drive found in the parking lot",
        ctx: "Monday morning, near the office entrance.",
        who: "A pen drive found in the office parking",
        subject: "",
        text: "A pen drive lies near the entrance with a label: [[prize|\"Salary Revision 2026 - CONFIDENTIAL - Management only\"]]. A colleague says: \"[[remote|Let's plug it into the reception PC and see whose it is.]]\"",
        why: "This is a \"USB drop\". Attackers leave pen drives with tempting labels; the moment one is plugged in, hidden software can install itself and spread across the office network. Curiosity is the attack.",
        todo: "Don't plug it in anywhere. Hand it to IT or security in an envelope. Companies should disable auto-run and block unknown USB devices."
      },
      wifi: {
        title: "Free airport Wi-Fi asks for your email password",
        ctx: "Waiting for a flight, you connect to a free network to approve two vendor payments.",
        who: "Free Wi-Fi login screen at the airport",
        subject: "",
        text: "Network: Airport_Free_WiFi_5G (no password). [[otp|To continue, sign in with your email address and email password.]] Then you plan to [[data|approve two vendor payments on the company banking portal]] while waiting for your flight.",
        why: "Anyone can create a hotspot with an official-sounding name. On a fake network the attacker can see what you type, and a login page that asks for your email password is harvesting credentials. Banking on public Wi-Fi is a risk.",
        todo: "Use your own mobile data or the company VPN for work and banking. Never type your office or email password on a Wi-Fi login page. Turn off auto-connect to open networks."
      },
      upi_real: {
        title: "Payment received notification",
        ctx: "A notification from your own UPI app while you are at the counter.",
        who: "UPI app",
        subject: "",
        text: "[[ok|₹2,500 received from Anita Traders]] into your current account ending 4471. [[ok|No action needed.]] Transaction ID 628104...",
        why: "Money coming IN never needs your PIN, OTP or a scan. The notification is from your own app, names the payer and asks nothing of you. Compare this with a \"collect request\" or a QR you are asked to scan: those take money OUT.",
        todo: "Nothing to do. Check the amount against your invoice. If a \"payment received\" message ever asks you to approve, enter a PIN or scan, it is taking money, not giving it."
      },
      dpdp: {
        title: "Colleague wants the customer list on WhatsApp",
        ctx: "A WhatsApp message from a sales colleague's number in the evening.",
        who: "Sameer (sales colleague)",
        subject: "",
        text: "Bro, I am working from home today. [[data|Please export the full customer list with phone numbers and Aadhaar copies and send it to me on this WhatsApp]], I will delete it later. [[urgent|Need it in 10 minutes for the campaign.]] [[secret|No need to tell the manager, it's a small thing.]]",
        why: "Customer phone numbers and Aadhaar copies are personal data protected by India's DPDP Act. Sending them on personal WhatsApp takes them outside company control, and this could also be a hacked account or an impersonation. \"Don't tell the manager\" is never acceptable.",
        todo: "Say no politely. Share customer data only through the company's approved system, with the manager's approval and only the fields needed. If a colleague's account seems odd, call them."
      },
      otp_call: {
        title: "\"Fraud department\" needs the OTP to cancel a payment",
        ctx: "A call while an OTP SMS arrives on your phone.",
        who: "\"NovaBank Fraud Department\"",
        subject: "",
        text: "\"Sir, [[threat|a transaction of ₹49,999 is happening on your card right now.]] To cancel it [[urgent|we must act within 60 seconds]]. [[otp|Tell me the OTP that has just arrived on your phone and I will reverse it.]] [[secret|Please do not disconnect or call anyone.]]\"",
        why: "The OTP that \"just arrived\" is for the scammer's own attempt to pay with your card. Reading it out completes the payment. Banks never ask for an OTP to cancel anything, and the 60-second panic is created so you don't think.",
        todo: "Cut the call. Open your bank app and block the card yourself, or call the number on the back of your card. Never read an OTP to anyone. If money has left, call 1930 right away."
      },
      hr_bonus: {
        title: "Diwali bonus form asks for net-banking login",
        ctx: "An email to all staff just before Diwali, from an address that looks like HR.",
        who: "HR Rewards Team",
        subject: "Diwali bonus ₹25,000 - confirm your bank account",
        text: "Dear team member, we are pleased to announce a Diwali bonus of ₹25,000. [[attach|Open the attached form (Bonus_Form.html)]] and [[otp|enter your net-banking user ID and password]] so that the bonus is credited directly. [[urgent|Forms received after 6 pm today will not be processed.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR already has your salary account; no company asks for your net-banking login for a bonus. The sender is a look-alike domain, the HTML attachment is a fake bank login page, and a same-day deadline adds pressure.",
        todo: "Don't open the attachment or enter anything. Ask HR in person or on the intranet. Report the email to IT so colleagues are warned."
      },
      electricity: {
        title: "Office power will be cut tonight",
        ctx: "An SMS to the shop owner's phone at 8:35 pm.",
        who: "",
        subject: "",
        text: "Dear consumer, [[threat|your office electricity connection will be disconnected tonight at 9:30 pm]] because [[odd|last month bill is not update in our system]]. Please contact our officer [[sender|93XXX XXX40]] [[urgent|immediately]].",
        why: "Electricity boards don't disconnect at night after one SMS from a personal mobile. When you call, the \"officer\" asks you to install an app or pay ₹10 through a link, and the real target is your bank account.",
        todo: "Don't call. Check the bill in the electricity board's official app or office. Report the number on Sanchar Saathi (Chakshu)."
      },
      wa_hijack: {
        title: "Colleague asks you to forward a 6-digit code",
        ctx: "A late-night WhatsApp message from a colleague's saved number, right after a code SMS arrived on your phone.",
        who: "Rohan (colleague)",
        subject: "",
        text: "Hey, sorry to disturb you so late. [[odd|I entered your number by mistake while logging into WhatsApp and a 6-digit code went to your phone.]] [[otp|Please forward me that code]], [[urgent|quickly, otherwise my account will be locked.]]",
        why: "The code that arrived is the verification code for YOUR WhatsApp. Whoever gets it takes over your account and then messages all your contacts and office groups asking for money. The message itself may come from a colleague's already-hijacked account.",
        todo: "Never forward a verification code. Phone the colleague to warn them that their account is hacked. Turn on two-step verification in WhatsApp settings."
      },
      invest_group: {
        title: "Stock-tips group with guaranteed returns",
        ctx: "You were added to a WhatsApp group without asking.",
        who: "VIP Stock Tips - Group admin",
        subject: "",
        text: "Welcome to our premium group! [[prize|Our members earned 32% returns last month with guaranteed insider tips.]] Download our trading app from [[link|this link, not from the app store]], and [[money|start with a deposit of ₹50,000]]. [[prize|See the screenshots of profits posted by members!]] [[urgent|Entry closes at midnight.]]",
        why: "Nobody can guarantee returns, and \"insider tips\" are illegal. The app is fake: it shows imaginary profits so you deposit more, and withdrawal is never allowed. The \"members\" posting screenshots are the scammers.",
        todo: "Leave and report the group. Invest only through SEBI-registered brokers and apps from the official app store. If you have deposited, call 1930 and report at cybercrime.gov.in."
      },
      bank_real: {
        title: "Debit alert for a payment you made",
        ctx: "Your accounts team paid the packaging vendor today. This SMS arrives.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|₹86,000 debited from account ending 4471 on 10 Oct for NEFT to Sunrise Packaging]], ref N26101034. Balance ₹3,42,118. [[ok|If not done by you, call the number on the back of your debit card.]]",
        why: "This matches the payment your accounts team made today, comes from the bank's sender ID, has no link or number inside the SMS and points you to the number on your own card.",
        todo: "Match it with your payment records. If any debit alert does not match a payment you made, call the bank immediately using the number on the card, not a number from a message."
      }
    }
  },
  te: {
    scenarios: {
      ceo_gift: {
        title: "Boss on a new number wants gift cards",
        ctx: "WhatsApp message to an accounts executive at 9 am. The profile photo is the MD's photo from the company website.",
        who: "Rajesh Sir (new number)",
        subject: "",
        text: "Hi, this is Rajesh. [[sender|My old phone is damaged, I am using this number for now.]] I am in a meeting with a big client. [[money|Buy 10 gift cards of ₹5,000 each]] and send me the codes [[urgent|within 30 minutes]]. [[secret|Please don't discuss this with anyone, it is a surprise for the client.]]",
        why: "Scammers copy the MD's photo from the website and write from a new number. A real boss never asks for gift-card codes or for secrecy. New number + urgency + secrecy is the classic \"CEO fraud\".",
        todo: "Don't buy anything. Call your boss on the number saved in your phone, or walk to their cabin. Tell IT or your manager so the whole office is warned."
      },
      it_real: {
        title: "Password policy notice from IT",
        ctx: "An email to all staff from the company's own IT helpdesk.",
        who: "IT Helpdesk",
        subject: "Password policy change from 15 October",
        text: "Dear colleagues, from 15 October passwords must be at least 12 characters long. [[ok|You do not need to do anything today.]] When your password expires, change it [[ok|on the office portal you normally use]]. [[ok|IT will never ask for your password by email, phone or WhatsApp.]] For doubts, visit the helpdesk on the 2nd floor.",
        why: "The sender is the company's own IT address. There is no link to click, no attachment, no deadline and no request for a password. Genuine notices tell you what will happen and let you use the normal portal yourself.",
        todo: "Nothing urgent. If you are unsure whether a notice is real, walk to the helpdesk or call the extension number you already know."
      },
      bec_vendor: {
        title: "Vendor says its bank account has changed",
        ctx: "An email to the accounts team about a pending invoice of ₹4,80,000.",
        who: "Kaveri Logistics Accounts",
        subject: "URGENT: Updated bank details for Invoice KL/2026/0912",
        text: "Dear Sir/Madam, [[newacct|our company bank account has changed after an audit. Please pay the pending invoice of ₹4,80,000 to the new account given below.]] [[urgent|Payment must be released today]] to avoid delay of your shipment. [[sender|Kindly reply only to this email ID]], our office phones are under maintenance.",
        why: "This is Business Email Compromise (BEC). Criminals hack or copy a vendor's email and send \"new bank details\". The address is slightly different from the real vendor, the phones \"are not working\" so you cannot verify, and everything is urgent.",
        todo: "Never change a vendor's bank details because of an email. Call the vendor on the number from your old records or purchase order, never the number in the email. Use two-person approval for every bank-detail change."
      },
      gst_notice: {
        title: "GST penalty notice with an attachment",
        ctx: "An email to the accounts mailbox early in the morning.",
        who: "GST Department",
        subject: "Show Cause Notice - Penalty ₹1,24,500 - Action required",
        text: "[[odd|Dear Taxpayer,]] a mismatch is found in your GST returns. A penalty of ₹1,24,500 is due. [[threat|Your GSTIN will be suspended in 48 hours]] if it is not paid. [[link|Open the attached notice and pay through the secure link]] to avoid legal action. [[attach|Attachment: GST_Notice_2026.html]]",
        why: "Real GST notices appear in your account on the official GST portal and carry a DIN (Document Identification Number). An HTML attachment with a \"secure link\" is a fake login page that steals your GST login or payment details. The sender is not the official gov.in domain.",
        todo: "Don't open the attachment. Log in to the official GST portal yourself by typing the address, or ask your CA to check. Report the email to IT and at cybercrime.gov.in."
      },
      otp_real: {
        title: "OTP for a payment you just started",
        ctx: "You have just started a UPI payment of ₹2,500 to your packaging vendor. This SMS arrives.",
        who: "",
        subject: "",
        text: "[[ok|Your OTP for the UPI payment of ₹2,500 to Sunrise Packaging that you just started is 482913.]] Valid for 10 minutes. [[ok|Do not share this OTP with anyone, not even the bank.]] - NovaBank",
        why: "You started this payment yourself a moment ago, the amount and the payee match, and the message tells you not to share the code. A genuine OTP is only for the action you yourself requested, and the bank never asks you to tell it to anyone.",
        todo: "Type the OTP only in the app you are using. If an OTP arrives when you did not start anything, somebody is trying to use your account: do not share it, and call the bank on the number printed on your card."
      },
      digital_arrest: {
        title: "Video call from a \"CBI officer\"",
        ctx: "A video call from an unknown number. The caller wears a uniform and sits in an office with a flag behind him.",
        who: "\"CBI Officer Verma\"",
        subject: "",
        text: "\"[[threat|A parcel with drugs and 6 passports was booked in your name. A case is registered against you.]] [[urgent|Stay on this video call, do not disconnect]], and [[secret|do not tell anyone, not even your family, they are also under watch]]. [[money|Transfer ₹3,50,000 to this RBI verification account for checking]]; it will be returned after the investigation.\"",
        why: "This is a \"digital arrest\". No police, CBI or court arrests anyone on a video call, and no agency asks you to transfer money to a \"verification account\". The uniform, office background and ID card are all fake. Secrecy and keeping you on the call stop you from thinking.",
        todo: "Hang up at once. Real officers do not call on WhatsApp. Call 1930 or report at cybercrime.gov.in, and tell a colleague or family member immediately."
      },
      courier: {
        title: "Call: your parcel is held at customs",
        ctx: "A recorded voice, then a person. You have not ordered anything from abroad.",
        who: "\"SpeedParcel Customer Service\"",
        subject: "",
        text: "\"Hello, this is the customs department of SpeedParcel. [[threat|A parcel in your name is held at customs because it contains illegal items.]] To avoid a police case, [[urgent|press 1 now]] to speak to an officer, or [[money|pay the ₹2,999 clearance fee]] on the link we will send.\"",
        why: "Courier companies do not call about illegal items, and customs does not collect fees by phone. Pressing 1 connects you to a fake \"officer\" who then tries a digital-arrest scam or asks for payments.",
        todo: "Cut the call. If you really ordered something, check the tracking number on the courier's official website. Report the number on the Sanchar Saathi (Chakshu) portal."
      },
      task_job: {
        title: "Telegram job: earn ₹8,000 a day rating hotels",
        ctx: "A Telegram message after you applied for jobs online last week.",
        who: "HR Priya - Online Jobs",
        subject: "",
        text: "Congratulations, you are selected! [[prize|Earn ₹3,000 to ₹8,000 daily by rating hotels online]], only 20 minutes of work. The first 3 tasks are free. For premium tasks you [[money|deposit ₹5,000 and get back ₹7,500 within one hour]]. [[urgent|Only 4 seats left today!]]",
        why: "This is a task scam. The first small payments are real, to build trust. Then you \"deposit\" for premium tasks and the money never comes back. No real job pays you to click, and no employer asks you to deposit money.",
        todo: "Don't deposit anything. Block and report the account. If you have already paid, call 1930 immediately; the first hour matters most."
      },
      vendor_real: {
        title: "Payment reminder from a known vendor",
        ctx: "An email from the packaging vendor you pay every month, from their usual address.",
        who: "Sunrise Packaging Billing",
        subject: "Payment reminder - Invoice SP/26-27/0431 due 10 Oct",
        text: "Dear Meridian Textiles team, this is a gentle reminder that invoice SP/26-27/0431 for ₹86,000 is due on 10 October. [[ok|Our bank details are unchanged and are printed on the invoice you already have.]] [[ok|If you receive any email asking to change our bank account, please call our office on the number in your records before paying.]] Thank you.",
        why: "A regular reminder from the known vendor address, no new bank details, no threat, and the vendor itself asks you to verify by phone if anything looks different. That is exactly how a genuine partner behaves.",
        todo: "Pay through your normal process to the account already in your records. Any change request should be confirmed on a known phone number."
      },
      deepfake: {
        title: "The MD's voice asks for an urgent transfer",
        ctx: "A phone call from an unknown number. The voice sounds exactly like your MD, with airport noise behind.",
        who: "\"Rajesh Sir\" (the MD's voice)",
        subject: "",
        text: "\"Hello, it's me, I am at the airport, you can hear it is noisy. [[urgent|I need you to transfer ₹2,00,000 right now]] to a new supplier for the Dubai order. [[newacct|I will WhatsApp you the account number.]] [[secret|Don't call me back, my phone is going on flight mode, just do it before I land.]]\"",
        why: "AI can copy anyone's voice from a 30-second clip of a speech or video. A cloned voice plus a new account number plus \"don't call me back\" is a deepfake scam. The background noise is added on purpose.",
        todo: "Say you will call back, then call the MD on the saved number or check with a second senior person. Agree on a code word in your team for urgent phone requests. No transfer without the normal approval."
      },
      qr_receive: {
        title: "Buyer sends a QR code to \"receive\" money",
        ctx: "You advertised 12 used office chairs on a classified-ads site. A buyer writes on WhatsApp.",
        who: "Buyer for office chairs",
        subject: "",
        text: "Hi, I saw your ad for 12 used office chairs at ₹18,000. I will pay the full amount now. [[upi|I have sent a QR code: scan it and enter your UPI PIN to receive the money.]] [[odd|I am an army officer posted outside, so my friend will pick up the chairs.]] [[urgent|Please do it in the next 5 minutes, my network is weak.]]",
        why: "You never scan a QR or enter a PIN to RECEIVE money. Scanning and entering the PIN PAYS the other person. The \"army officer\" story and the hurry are standard tricks on classified-ad sites.",
        todo: "Refuse. Ask the buyer to send money to your UPI ID; you need to do nothing to receive it. Report the number in the app."
      },
      fake_care: {
        title: "Customer-care number found on search",
        ctx: "A refund did not arrive. You searched online for the bank's customer care and called the first number shown.",
        who: "\"NovaBank Customer Care\"",
        subject: "",
        text: "\"Thank you for calling NovaBank customer care. For your refund of ₹3,200 we need to verify you. [[otp|Please tell me your 16-digit card number, expiry date and the OTP you receive now.]] [[remote|Also install the Quick Support app I am sending so I can process it faster.]]\"",
        why: "You called a fake number placed in search results or on a fake website. No bank asks for the full card number, expiry, CVV or OTP, and never asks you to install a remote-control app.",
        todo: "Cut the call. Use only the number printed on the back of your card or inside the official app. Never install an app a caller asks for. If you shared anything, block the card in the app at once and call 1930."
      },
      hr_real: {
        title: "Diwali holiday list from HR",
        ctx: "An email to all staff from the company's HR address.",
        who: "HR Department",
        subject: "Holiday list for Diwali week",
        text: "Dear all, the office will be closed from 7 to 9 November for Diwali. [[ok|The full holiday list is on the HR page of the intranet]], the same page you use for leave. [[ok|No action is needed from you.]] Wishing everyone a happy and safe Diwali. - HR Team",
        why: "Sent from the company's own HR address, information only, no link to an outside site, no attachment to open and nothing to fill in. Genuine notices do not need urgency.",
        todo: "Nothing to do. If an email about holidays or a bonus asks you to log in or fill in bank details, treat that as a red flag and ask HR in person."
      },
      screen_share: {
        title: "\"UPI helpline\" wants to see your screen",
        ctx: "A call minutes after a UPI payment failed and you complained on social media.",
        who: "\"UPI Helpline\"",
        subject: "",
        text: "\"Sir, your UPI payment of ₹1,500 is stuck. I can fix it in 2 minutes. [[remote|Please install the screen-sharing app from the link I sent and read me the 9-digit code on the screen.]] Keep your banking app open, I only need to see it. [[otp|When the OTP comes, don't cut the call, I will guide you.]]\"",
        why: "Remote-access and screen-sharing apps let the caller see and control your phone; the 9-digit code gives them full access. Together with an OTP they can empty the account within minutes. Genuine helplines never ask to see your screen.",
        todo: "Cut the call and uninstall any app you installed. Complain only inside the official UPI or bank app. If money has moved, call 1930 and your bank immediately."
      },
      invoice_exe: {
        title: "Invoice attachment ending in .exe",
        ctx: "An email to the accounts mailbox from a company you do not remember buying from.",
        who: "Global Trade Supplies",
        subject: "Invoice attached - please process",
        text: "[[odd|Dear Sir,]] please find attached the invoice for the goods delivered last week. [[attach|Attachment: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|Kindly process payment today]] and confirm. [[odd|Regards, Accounts Dept.]]",
        why: "A file ending in .exe is a program, not a PDF; the \".pdf\" in the name is a disguise. Opening it installs malware or ransomware that can lock every computer in the office. A vague greeting and no company signature are extra warnings.",
        todo: "Don't open the attachment. Report the email to IT. Check your records: did you actually buy from this company? Turn on \"show file extensions\" on office computers so such tricks are visible."
      },
      echallan: {
        title: "Traffic e-challan SMS with an app link",
        ctx: "An SMS to the office driver's phone in the evening.",
        who: "",
        subject: "",
        text: "Traffic e-Challan: your vehicle KA-05-XX-1234 was recorded jumping a signal on 1 October. [[money|Fine ₹1,000.]] [[urgent|Pay within 24 hours]] to avoid double fine and court summons. [[link|Download the official challan app: echallan-pay.example.net/app.apk]]",
        why: "Real e-challan messages come from a government sender ID, not a personal mobile number, and never ask you to download an .apk file. The APK is a malicious app that reads your SMS and OTPs.",
        todo: "Delete the message. Check challans only on the official government e-challan website or the state police app. Report the number on Sanchar Saathi (Chakshu)."
      },
      parcel_real: {
        title: "Delivery update for a parcel you expect",
        ctx: "You ordered packaging material last week. This SMS arrives.",
        who: "",
        subject: "",
        text: "SpeedParcel: your shipment SP48213 from Sunrise Packaging [[ok|will be delivered today between 2 pm and 5 pm.]] [[ok|No payment is due.]] [[ok|To track, use your shipment number on our website or app.]]",
        why: "Sent from a registered sender ID (not a personal number), matches a parcel you expect, asks for no money and gives no link to tap. A genuine delivery message just informs you.",
        todo: "Nothing to do. If a parcel message asks for a fee, a link or an app, stop and check on the official website using the shipment number."
      },
      kyc: {
        title: "KYC expired, account blocked today",
        ctx: "An SMS to the owner's phone at night.",
        who: "",
        subject: "",
        text: "Dear customer, [[threat|your NovaBank account will be blocked today]] because your KYC has expired. [[urgent|Update immediately]] at [[link|novabank-kyc-update.example.net]] or [[sender|call our officer on 94XXX XXX51]].",
        why: "Banks never send KYC links from a personal mobile number and never block an account within hours. The link opens a fake bank page that steals your login and OTP; the \"officer\" asks you to install an app.",
        todo: "Don't tap the link or call. If KYC is really due, the bank's own app or branch will tell you. Report the SMS on Sanchar Saathi (Chakshu)."
      },
      sim_swap: {
        title: "Call: your SIM will be deactivated",
        ctx: "A call to the office manager, who uses this number for bank OTPs.",
        who: "\"Telecom company executive\"",
        subject: "",
        text: "\"Madam, this is from your mobile network. [[threat|Your SIM will be deactivated in 24 hours]] because the 5G upgrade is pending. [[otp|To upgrade, read out the 20-digit number printed on your SIM card and press 1 after the SMS you receive.]] [[urgent|This offer closes today.]]\"",
        why: "This is a SIM-swap attempt. With the 20-digit SIM number and your \"1\", the fraudster activates your number on their own SIM. Your phone goes dead and every OTP for banking and UPI then goes to them.",
        todo: "Cut the call. Telecom companies never call for 5G upgrades. If your phone suddenly loses network for a long time, call your bank first, then your operator. Check SIMs issued in your name on Sanchar Saathi."
      },
      mfa: {
        title: "Seventh login approval request since midnight",
        ctx: "Your phone keeps buzzing at night with sign-in approval requests from the office login app. Then a call comes.",
        who: "SecureLogin app",
        subject: "",
        text: "[[otp|Approve sign-in? Someone is trying to sign in to your office account from a new device. Tap APPROVE to continue.]] [[odd|(This is the 7th request since midnight.)]] A moment later a caller says: \"[[urgent|This is IT, we are fixing a server. Please just approve the request so the alerts stop.]]\"",
        why: "This is \"MFA fatigue\". The attacker already has your password and is spamming approval requests, hoping you tap Approve to make them stop. The \"IT\" call is part of the attack. Real IT never asks you to approve a login you did not start.",
        todo: "Tap Deny every time. Change your password from a trusted device right away and tell IT. The repeated requests mean your password has already leaked."
      },
      gst_real: {
        title: "Monthly GST reminder from your CA",
        ctx: "A WhatsApp message from your chartered accountant's saved number.",
        who: "Mehta & Co. (our CA)",
        subject: "",
        text: "Good morning. Reminder: GSTR-3B for September is due on 20 October. [[ok|Please upload the sales and purchase sheets to the same shared folder as every month.]] [[ok|No payment is needed from your side right now]]; I will send the challan details after filing, and we can confirm on our usual call.",
        why: "Known CA, saved number, the usual monthly process, no new account number, no link and no urgency beyond the real due date. Verification happens on your regular call.",
        todo: "Follow your normal process. If one day the \"CA\" sends a new bank account or asks you to pay through a link, call the CA office on the known number first."
      },
      lookalike: {
        title: "Salary slip on a look-alike domain",
        ctx: "An email about a revised salary slip. Your company's real domain is meridiantextiles.example.com.",
        who: "Payroll Team",
        subject: "Your revised salary slip is ready",
        text: "Dear employee, your salary structure has been revised from October. [[link|Log in at meridian-textiles-portal.example.com with your office password to view the new slip.]] [[urgent|The link expires in 12 hours.]] [[sender|Sent from payroll@meridian-textiles.example.com]]",
        why: "The real company domain is meridiantextiles.example.com; the email uses meridian-textiles (with a hyphen), a look-alike domain. The link leads to a copied login page that steals your office password. A salary slip would be on the HR portal you always use.",
        todo: "Don't click. Open the HR portal yourself by typing the address or from your bookmark. Report the email to IT; forwarding it helps them block the fake domain for everyone."
      },
      usb: {
        title: "Pen drive found in the parking lot",
        ctx: "Monday morning, near the office entrance.",
        who: "A pen drive found in the office parking",
        subject: "",
        text: "A pen drive lies near the entrance with a label: [[prize|\"Salary Revision 2026 - CONFIDENTIAL - Management only\"]]. A colleague says: \"[[remote|Let's plug it into the reception PC and see whose it is.]]\"",
        why: "This is a \"USB drop\". Attackers leave pen drives with tempting labels; the moment one is plugged in, hidden software can install itself and spread across the office network. Curiosity is the attack.",
        todo: "Don't plug it in anywhere. Hand it to IT or security in an envelope. Companies should disable auto-run and block unknown USB devices."
      },
      wifi: {
        title: "Free airport Wi-Fi asks for your email password",
        ctx: "Waiting for a flight, you connect to a free network to approve two vendor payments.",
        who: "Free Wi-Fi login screen at the airport",
        subject: "",
        text: "Network: Airport_Free_WiFi_5G (no password). [[otp|To continue, sign in with your email address and email password.]] Then you plan to [[data|approve two vendor payments on the company banking portal]] while waiting for your flight.",
        why: "Anyone can create a hotspot with an official-sounding name. On a fake network the attacker can see what you type, and a login page that asks for your email password is harvesting credentials. Banking on public Wi-Fi is a risk.",
        todo: "Use your own mobile data or the company VPN for work and banking. Never type your office or email password on a Wi-Fi login page. Turn off auto-connect to open networks."
      },
      upi_real: {
        title: "Payment received notification",
        ctx: "A notification from your own UPI app while you are at the counter.",
        who: "UPI app",
        subject: "",
        text: "[[ok|₹2,500 received from Anita Traders]] into your current account ending 4471. [[ok|No action needed.]] Transaction ID 628104...",
        why: "Money coming IN never needs your PIN, OTP or a scan. The notification is from your own app, names the payer and asks nothing of you. Compare this with a \"collect request\" or a QR you are asked to scan: those take money OUT.",
        todo: "Nothing to do. Check the amount against your invoice. If a \"payment received\" message ever asks you to approve, enter a PIN or scan, it is taking money, not giving it."
      },
      dpdp: {
        title: "Colleague wants the customer list on WhatsApp",
        ctx: "A WhatsApp message from a sales colleague's number in the evening.",
        who: "Sameer (sales colleague)",
        subject: "",
        text: "Bro, I am working from home today. [[data|Please export the full customer list with phone numbers and Aadhaar copies and send it to me on this WhatsApp]], I will delete it later. [[urgent|Need it in 10 minutes for the campaign.]] [[secret|No need to tell the manager, it's a small thing.]]",
        why: "Customer phone numbers and Aadhaar copies are personal data protected by India's DPDP Act. Sending them on personal WhatsApp takes them outside company control, and this could also be a hacked account or an impersonation. \"Don't tell the manager\" is never acceptable.",
        todo: "Say no politely. Share customer data only through the company's approved system, with the manager's approval and only the fields needed. If a colleague's account seems odd, call them."
      },
      otp_call: {
        title: "\"Fraud department\" needs the OTP to cancel a payment",
        ctx: "A call while an OTP SMS arrives on your phone.",
        who: "\"NovaBank Fraud Department\"",
        subject: "",
        text: "\"Sir, [[threat|a transaction of ₹49,999 is happening on your card right now.]] To cancel it [[urgent|we must act within 60 seconds]]. [[otp|Tell me the OTP that has just arrived on your phone and I will reverse it.]] [[secret|Please do not disconnect or call anyone.]]\"",
        why: "The OTP that \"just arrived\" is for the scammer's own attempt to pay with your card. Reading it out completes the payment. Banks never ask for an OTP to cancel anything, and the 60-second panic is created so you don't think.",
        todo: "Cut the call. Open your bank app and block the card yourself, or call the number on the back of your card. Never read an OTP to anyone. If money has left, call 1930 right away."
      },
      hr_bonus: {
        title: "Diwali bonus form asks for net-banking login",
        ctx: "An email to all staff just before Diwali, from an address that looks like HR.",
        who: "HR Rewards Team",
        subject: "Diwali bonus ₹25,000 - confirm your bank account",
        text: "Dear team member, we are pleased to announce a Diwali bonus of ₹25,000. [[attach|Open the attached form (Bonus_Form.html)]] and [[otp|enter your net-banking user ID and password]] so that the bonus is credited directly. [[urgent|Forms received after 6 pm today will not be processed.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR already has your salary account; no company asks for your net-banking login for a bonus. The sender is a look-alike domain, the HTML attachment is a fake bank login page, and a same-day deadline adds pressure.",
        todo: "Don't open the attachment or enter anything. Ask HR in person or on the intranet. Report the email to IT so colleagues are warned."
      },
      electricity: {
        title: "Office power will be cut tonight",
        ctx: "An SMS to the shop owner's phone at 8:35 pm.",
        who: "",
        subject: "",
        text: "Dear consumer, [[threat|your office electricity connection will be disconnected tonight at 9:30 pm]] because [[odd|last month bill is not update in our system]]. Please contact our officer [[sender|93XXX XXX40]] [[urgent|immediately]].",
        why: "Electricity boards don't disconnect at night after one SMS from a personal mobile. When you call, the \"officer\" asks you to install an app or pay ₹10 through a link, and the real target is your bank account.",
        todo: "Don't call. Check the bill in the electricity board's official app or office. Report the number on Sanchar Saathi (Chakshu)."
      },
      wa_hijack: {
        title: "Colleague asks you to forward a 6-digit code",
        ctx: "A late-night WhatsApp message from a colleague's saved number, right after a code SMS arrived on your phone.",
        who: "Rohan (colleague)",
        subject: "",
        text: "Hey, sorry to disturb you so late. [[odd|I entered your number by mistake while logging into WhatsApp and a 6-digit code went to your phone.]] [[otp|Please forward me that code]], [[urgent|quickly, otherwise my account will be locked.]]",
        why: "The code that arrived is the verification code for YOUR WhatsApp. Whoever gets it takes over your account and then messages all your contacts and office groups asking for money. The message itself may come from a colleague's already-hijacked account.",
        todo: "Never forward a verification code. Phone the colleague to warn them that their account is hacked. Turn on two-step verification in WhatsApp settings."
      },
      invest_group: {
        title: "Stock-tips group with guaranteed returns",
        ctx: "You were added to a WhatsApp group without asking.",
        who: "VIP Stock Tips - Group admin",
        subject: "",
        text: "Welcome to our premium group! [[prize|Our members earned 32% returns last month with guaranteed insider tips.]] Download our trading app from [[link|this link, not from the app store]], and [[money|start with a deposit of ₹50,000]]. [[prize|See the screenshots of profits posted by members!]] [[urgent|Entry closes at midnight.]]",
        why: "Nobody can guarantee returns, and \"insider tips\" are illegal. The app is fake: it shows imaginary profits so you deposit more, and withdrawal is never allowed. The \"members\" posting screenshots are the scammers.",
        todo: "Leave and report the group. Invest only through SEBI-registered brokers and apps from the official app store. If you have deposited, call 1930 and report at cybercrime.gov.in."
      },
      bank_real: {
        title: "Debit alert for a payment you made",
        ctx: "Your accounts team paid the packaging vendor today. This SMS arrives.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|₹86,000 debited from account ending 4471 on 10 Oct for NEFT to Sunrise Packaging]], ref N26101034. Balance ₹3,42,118. [[ok|If not done by you, call the number on the back of your debit card.]]",
        why: "This matches the payment your accounts team made today, comes from the bank's sender ID, has no link or number inside the SMS and points you to the number on your own card.",
        todo: "Match it with your payment records. If any debit alert does not match a payment you made, call the bank immediately using the number on the card, not a number from a message."
      }
    }
  },
  kn: {
    scenarios: {
      ceo_gift: {
        title: "Boss on a new number wants gift cards",
        ctx: "WhatsApp message to an accounts executive at 9 am. The profile photo is the MD's photo from the company website.",
        who: "Rajesh Sir (new number)",
        subject: "",
        text: "Hi, this is Rajesh. [[sender|My old phone is damaged, I am using this number for now.]] I am in a meeting with a big client. [[money|Buy 10 gift cards of ₹5,000 each]] and send me the codes [[urgent|within 30 minutes]]. [[secret|Please don't discuss this with anyone, it is a surprise for the client.]]",
        why: "Scammers copy the MD's photo from the website and write from a new number. A real boss never asks for gift-card codes or for secrecy. New number + urgency + secrecy is the classic \"CEO fraud\".",
        todo: "Don't buy anything. Call your boss on the number saved in your phone, or walk to their cabin. Tell IT or your manager so the whole office is warned."
      },
      it_real: {
        title: "Password policy notice from IT",
        ctx: "An email to all staff from the company's own IT helpdesk.",
        who: "IT Helpdesk",
        subject: "Password policy change from 15 October",
        text: "Dear colleagues, from 15 October passwords must be at least 12 characters long. [[ok|You do not need to do anything today.]] When your password expires, change it [[ok|on the office portal you normally use]]. [[ok|IT will never ask for your password by email, phone or WhatsApp.]] For doubts, visit the helpdesk on the 2nd floor.",
        why: "The sender is the company's own IT address. There is no link to click, no attachment, no deadline and no request for a password. Genuine notices tell you what will happen and let you use the normal portal yourself.",
        todo: "Nothing urgent. If you are unsure whether a notice is real, walk to the helpdesk or call the extension number you already know."
      },
      bec_vendor: {
        title: "Vendor says its bank account has changed",
        ctx: "An email to the accounts team about a pending invoice of ₹4,80,000.",
        who: "Kaveri Logistics Accounts",
        subject: "URGENT: Updated bank details for Invoice KL/2026/0912",
        text: "Dear Sir/Madam, [[newacct|our company bank account has changed after an audit. Please pay the pending invoice of ₹4,80,000 to the new account given below.]] [[urgent|Payment must be released today]] to avoid delay of your shipment. [[sender|Kindly reply only to this email ID]], our office phones are under maintenance.",
        why: "This is Business Email Compromise (BEC). Criminals hack or copy a vendor's email and send \"new bank details\". The address is slightly different from the real vendor, the phones \"are not working\" so you cannot verify, and everything is urgent.",
        todo: "Never change a vendor's bank details because of an email. Call the vendor on the number from your old records or purchase order, never the number in the email. Use two-person approval for every bank-detail change."
      },
      gst_notice: {
        title: "GST penalty notice with an attachment",
        ctx: "An email to the accounts mailbox early in the morning.",
        who: "GST Department",
        subject: "Show Cause Notice - Penalty ₹1,24,500 - Action required",
        text: "[[odd|Dear Taxpayer,]] a mismatch is found in your GST returns. A penalty of ₹1,24,500 is due. [[threat|Your GSTIN will be suspended in 48 hours]] if it is not paid. [[link|Open the attached notice and pay through the secure link]] to avoid legal action. [[attach|Attachment: GST_Notice_2026.html]]",
        why: "Real GST notices appear in your account on the official GST portal and carry a DIN (Document Identification Number). An HTML attachment with a \"secure link\" is a fake login page that steals your GST login or payment details. The sender is not the official gov.in domain.",
        todo: "Don't open the attachment. Log in to the official GST portal yourself by typing the address, or ask your CA to check. Report the email to IT and at cybercrime.gov.in."
      },
      otp_real: {
        title: "OTP for a payment you just started",
        ctx: "You have just started a UPI payment of ₹2,500 to your packaging vendor. This SMS arrives.",
        who: "",
        subject: "",
        text: "[[ok|Your OTP for the UPI payment of ₹2,500 to Sunrise Packaging that you just started is 482913.]] Valid for 10 minutes. [[ok|Do not share this OTP with anyone, not even the bank.]] - NovaBank",
        why: "You started this payment yourself a moment ago, the amount and the payee match, and the message tells you not to share the code. A genuine OTP is only for the action you yourself requested, and the bank never asks you to tell it to anyone.",
        todo: "Type the OTP only in the app you are using. If an OTP arrives when you did not start anything, somebody is trying to use your account: do not share it, and call the bank on the number printed on your card."
      },
      digital_arrest: {
        title: "Video call from a \"CBI officer\"",
        ctx: "A video call from an unknown number. The caller wears a uniform and sits in an office with a flag behind him.",
        who: "\"CBI Officer Verma\"",
        subject: "",
        text: "\"[[threat|A parcel with drugs and 6 passports was booked in your name. A case is registered against you.]] [[urgent|Stay on this video call, do not disconnect]], and [[secret|do not tell anyone, not even your family, they are also under watch]]. [[money|Transfer ₹3,50,000 to this RBI verification account for checking]]; it will be returned after the investigation.\"",
        why: "This is a \"digital arrest\". No police, CBI or court arrests anyone on a video call, and no agency asks you to transfer money to a \"verification account\". The uniform, office background and ID card are all fake. Secrecy and keeping you on the call stop you from thinking.",
        todo: "Hang up at once. Real officers do not call on WhatsApp. Call 1930 or report at cybercrime.gov.in, and tell a colleague or family member immediately."
      },
      courier: {
        title: "Call: your parcel is held at customs",
        ctx: "A recorded voice, then a person. You have not ordered anything from abroad.",
        who: "\"SpeedParcel Customer Service\"",
        subject: "",
        text: "\"Hello, this is the customs department of SpeedParcel. [[threat|A parcel in your name is held at customs because it contains illegal items.]] To avoid a police case, [[urgent|press 1 now]] to speak to an officer, or [[money|pay the ₹2,999 clearance fee]] on the link we will send.\"",
        why: "Courier companies do not call about illegal items, and customs does not collect fees by phone. Pressing 1 connects you to a fake \"officer\" who then tries a digital-arrest scam or asks for payments.",
        todo: "Cut the call. If you really ordered something, check the tracking number on the courier's official website. Report the number on the Sanchar Saathi (Chakshu) portal."
      },
      task_job: {
        title: "Telegram job: earn ₹8,000 a day rating hotels",
        ctx: "A Telegram message after you applied for jobs online last week.",
        who: "HR Priya - Online Jobs",
        subject: "",
        text: "Congratulations, you are selected! [[prize|Earn ₹3,000 to ₹8,000 daily by rating hotels online]], only 20 minutes of work. The first 3 tasks are free. For premium tasks you [[money|deposit ₹5,000 and get back ₹7,500 within one hour]]. [[urgent|Only 4 seats left today!]]",
        why: "This is a task scam. The first small payments are real, to build trust. Then you \"deposit\" for premium tasks and the money never comes back. No real job pays you to click, and no employer asks you to deposit money.",
        todo: "Don't deposit anything. Block and report the account. If you have already paid, call 1930 immediately; the first hour matters most."
      },
      vendor_real: {
        title: "Payment reminder from a known vendor",
        ctx: "An email from the packaging vendor you pay every month, from their usual address.",
        who: "Sunrise Packaging Billing",
        subject: "Payment reminder - Invoice SP/26-27/0431 due 10 Oct",
        text: "Dear Meridian Textiles team, this is a gentle reminder that invoice SP/26-27/0431 for ₹86,000 is due on 10 October. [[ok|Our bank details are unchanged and are printed on the invoice you already have.]] [[ok|If you receive any email asking to change our bank account, please call our office on the number in your records before paying.]] Thank you.",
        why: "A regular reminder from the known vendor address, no new bank details, no threat, and the vendor itself asks you to verify by phone if anything looks different. That is exactly how a genuine partner behaves.",
        todo: "Pay through your normal process to the account already in your records. Any change request should be confirmed on a known phone number."
      },
      deepfake: {
        title: "The MD's voice asks for an urgent transfer",
        ctx: "A phone call from an unknown number. The voice sounds exactly like your MD, with airport noise behind.",
        who: "\"Rajesh Sir\" (the MD's voice)",
        subject: "",
        text: "\"Hello, it's me, I am at the airport, you can hear it is noisy. [[urgent|I need you to transfer ₹2,00,000 right now]] to a new supplier for the Dubai order. [[newacct|I will WhatsApp you the account number.]] [[secret|Don't call me back, my phone is going on flight mode, just do it before I land.]]\"",
        why: "AI can copy anyone's voice from a 30-second clip of a speech or video. A cloned voice plus a new account number plus \"don't call me back\" is a deepfake scam. The background noise is added on purpose.",
        todo: "Say you will call back, then call the MD on the saved number or check with a second senior person. Agree on a code word in your team for urgent phone requests. No transfer without the normal approval."
      },
      qr_receive: {
        title: "Buyer sends a QR code to \"receive\" money",
        ctx: "You advertised 12 used office chairs on a classified-ads site. A buyer writes on WhatsApp.",
        who: "Buyer for office chairs",
        subject: "",
        text: "Hi, I saw your ad for 12 used office chairs at ₹18,000. I will pay the full amount now. [[upi|I have sent a QR code: scan it and enter your UPI PIN to receive the money.]] [[odd|I am an army officer posted outside, so my friend will pick up the chairs.]] [[urgent|Please do it in the next 5 minutes, my network is weak.]]",
        why: "You never scan a QR or enter a PIN to RECEIVE money. Scanning and entering the PIN PAYS the other person. The \"army officer\" story and the hurry are standard tricks on classified-ad sites.",
        todo: "Refuse. Ask the buyer to send money to your UPI ID; you need to do nothing to receive it. Report the number in the app."
      },
      fake_care: {
        title: "Customer-care number found on search",
        ctx: "A refund did not arrive. You searched online for the bank's customer care and called the first number shown.",
        who: "\"NovaBank Customer Care\"",
        subject: "",
        text: "\"Thank you for calling NovaBank customer care. For your refund of ₹3,200 we need to verify you. [[otp|Please tell me your 16-digit card number, expiry date and the OTP you receive now.]] [[remote|Also install the Quick Support app I am sending so I can process it faster.]]\"",
        why: "You called a fake number placed in search results or on a fake website. No bank asks for the full card number, expiry, CVV or OTP, and never asks you to install a remote-control app.",
        todo: "Cut the call. Use only the number printed on the back of your card or inside the official app. Never install an app a caller asks for. If you shared anything, block the card in the app at once and call 1930."
      },
      hr_real: {
        title: "Diwali holiday list from HR",
        ctx: "An email to all staff from the company's HR address.",
        who: "HR Department",
        subject: "Holiday list for Diwali week",
        text: "Dear all, the office will be closed from 7 to 9 November for Diwali. [[ok|The full holiday list is on the HR page of the intranet]], the same page you use for leave. [[ok|No action is needed from you.]] Wishing everyone a happy and safe Diwali. - HR Team",
        why: "Sent from the company's own HR address, information only, no link to an outside site, no attachment to open and nothing to fill in. Genuine notices do not need urgency.",
        todo: "Nothing to do. If an email about holidays or a bonus asks you to log in or fill in bank details, treat that as a red flag and ask HR in person."
      },
      screen_share: {
        title: "\"UPI helpline\" wants to see your screen",
        ctx: "A call minutes after a UPI payment failed and you complained on social media.",
        who: "\"UPI Helpline\"",
        subject: "",
        text: "\"Sir, your UPI payment of ₹1,500 is stuck. I can fix it in 2 minutes. [[remote|Please install the screen-sharing app from the link I sent and read me the 9-digit code on the screen.]] Keep your banking app open, I only need to see it. [[otp|When the OTP comes, don't cut the call, I will guide you.]]\"",
        why: "Remote-access and screen-sharing apps let the caller see and control your phone; the 9-digit code gives them full access. Together with an OTP they can empty the account within minutes. Genuine helplines never ask to see your screen.",
        todo: "Cut the call and uninstall any app you installed. Complain only inside the official UPI or bank app. If money has moved, call 1930 and your bank immediately."
      },
      invoice_exe: {
        title: "Invoice attachment ending in .exe",
        ctx: "An email to the accounts mailbox from a company you do not remember buying from.",
        who: "Global Trade Supplies",
        subject: "Invoice attached - please process",
        text: "[[odd|Dear Sir,]] please find attached the invoice for the goods delivered last week. [[attach|Attachment: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|Kindly process payment today]] and confirm. [[odd|Regards, Accounts Dept.]]",
        why: "A file ending in .exe is a program, not a PDF; the \".pdf\" in the name is a disguise. Opening it installs malware or ransomware that can lock every computer in the office. A vague greeting and no company signature are extra warnings.",
        todo: "Don't open the attachment. Report the email to IT. Check your records: did you actually buy from this company? Turn on \"show file extensions\" on office computers so such tricks are visible."
      },
      echallan: {
        title: "Traffic e-challan SMS with an app link",
        ctx: "An SMS to the office driver's phone in the evening.",
        who: "",
        subject: "",
        text: "Traffic e-Challan: your vehicle KA-05-XX-1234 was recorded jumping a signal on 1 October. [[money|Fine ₹1,000.]] [[urgent|Pay within 24 hours]] to avoid double fine and court summons. [[link|Download the official challan app: echallan-pay.example.net/app.apk]]",
        why: "Real e-challan messages come from a government sender ID, not a personal mobile number, and never ask you to download an .apk file. The APK is a malicious app that reads your SMS and OTPs.",
        todo: "Delete the message. Check challans only on the official government e-challan website or the state police app. Report the number on Sanchar Saathi (Chakshu)."
      },
      parcel_real: {
        title: "Delivery update for a parcel you expect",
        ctx: "You ordered packaging material last week. This SMS arrives.",
        who: "",
        subject: "",
        text: "SpeedParcel: your shipment SP48213 from Sunrise Packaging [[ok|will be delivered today between 2 pm and 5 pm.]] [[ok|No payment is due.]] [[ok|To track, use your shipment number on our website or app.]]",
        why: "Sent from a registered sender ID (not a personal number), matches a parcel you expect, asks for no money and gives no link to tap. A genuine delivery message just informs you.",
        todo: "Nothing to do. If a parcel message asks for a fee, a link or an app, stop and check on the official website using the shipment number."
      },
      kyc: {
        title: "KYC expired, account blocked today",
        ctx: "An SMS to the owner's phone at night.",
        who: "",
        subject: "",
        text: "Dear customer, [[threat|your NovaBank account will be blocked today]] because your KYC has expired. [[urgent|Update immediately]] at [[link|novabank-kyc-update.example.net]] or [[sender|call our officer on 94XXX XXX51]].",
        why: "Banks never send KYC links from a personal mobile number and never block an account within hours. The link opens a fake bank page that steals your login and OTP; the \"officer\" asks you to install an app.",
        todo: "Don't tap the link or call. If KYC is really due, the bank's own app or branch will tell you. Report the SMS on Sanchar Saathi (Chakshu)."
      },
      sim_swap: {
        title: "Call: your SIM will be deactivated",
        ctx: "A call to the office manager, who uses this number for bank OTPs.",
        who: "\"Telecom company executive\"",
        subject: "",
        text: "\"Madam, this is from your mobile network. [[threat|Your SIM will be deactivated in 24 hours]] because the 5G upgrade is pending. [[otp|To upgrade, read out the 20-digit number printed on your SIM card and press 1 after the SMS you receive.]] [[urgent|This offer closes today.]]\"",
        why: "This is a SIM-swap attempt. With the 20-digit SIM number and your \"1\", the fraudster activates your number on their own SIM. Your phone goes dead and every OTP for banking and UPI then goes to them.",
        todo: "Cut the call. Telecom companies never call for 5G upgrades. If your phone suddenly loses network for a long time, call your bank first, then your operator. Check SIMs issued in your name on Sanchar Saathi."
      },
      mfa: {
        title: "Seventh login approval request since midnight",
        ctx: "Your phone keeps buzzing at night with sign-in approval requests from the office login app. Then a call comes.",
        who: "SecureLogin app",
        subject: "",
        text: "[[otp|Approve sign-in? Someone is trying to sign in to your office account from a new device. Tap APPROVE to continue.]] [[odd|(This is the 7th request since midnight.)]] A moment later a caller says: \"[[urgent|This is IT, we are fixing a server. Please just approve the request so the alerts stop.]]\"",
        why: "This is \"MFA fatigue\". The attacker already has your password and is spamming approval requests, hoping you tap Approve to make them stop. The \"IT\" call is part of the attack. Real IT never asks you to approve a login you did not start.",
        todo: "Tap Deny every time. Change your password from a trusted device right away and tell IT. The repeated requests mean your password has already leaked."
      },
      gst_real: {
        title: "Monthly GST reminder from your CA",
        ctx: "A WhatsApp message from your chartered accountant's saved number.",
        who: "Mehta & Co. (our CA)",
        subject: "",
        text: "Good morning. Reminder: GSTR-3B for September is due on 20 October. [[ok|Please upload the sales and purchase sheets to the same shared folder as every month.]] [[ok|No payment is needed from your side right now]]; I will send the challan details after filing, and we can confirm on our usual call.",
        why: "Known CA, saved number, the usual monthly process, no new account number, no link and no urgency beyond the real due date. Verification happens on your regular call.",
        todo: "Follow your normal process. If one day the \"CA\" sends a new bank account or asks you to pay through a link, call the CA office on the known number first."
      },
      lookalike: {
        title: "Salary slip on a look-alike domain",
        ctx: "An email about a revised salary slip. Your company's real domain is meridiantextiles.example.com.",
        who: "Payroll Team",
        subject: "Your revised salary slip is ready",
        text: "Dear employee, your salary structure has been revised from October. [[link|Log in at meridian-textiles-portal.example.com with your office password to view the new slip.]] [[urgent|The link expires in 12 hours.]] [[sender|Sent from payroll@meridian-textiles.example.com]]",
        why: "The real company domain is meridiantextiles.example.com; the email uses meridian-textiles (with a hyphen), a look-alike domain. The link leads to a copied login page that steals your office password. A salary slip would be on the HR portal you always use.",
        todo: "Don't click. Open the HR portal yourself by typing the address or from your bookmark. Report the email to IT; forwarding it helps them block the fake domain for everyone."
      },
      usb: {
        title: "Pen drive found in the parking lot",
        ctx: "Monday morning, near the office entrance.",
        who: "A pen drive found in the office parking",
        subject: "",
        text: "A pen drive lies near the entrance with a label: [[prize|\"Salary Revision 2026 - CONFIDENTIAL - Management only\"]]. A colleague says: \"[[remote|Let's plug it into the reception PC and see whose it is.]]\"",
        why: "This is a \"USB drop\". Attackers leave pen drives with tempting labels; the moment one is plugged in, hidden software can install itself and spread across the office network. Curiosity is the attack.",
        todo: "Don't plug it in anywhere. Hand it to IT or security in an envelope. Companies should disable auto-run and block unknown USB devices."
      },
      wifi: {
        title: "Free airport Wi-Fi asks for your email password",
        ctx: "Waiting for a flight, you connect to a free network to approve two vendor payments.",
        who: "Free Wi-Fi login screen at the airport",
        subject: "",
        text: "Network: Airport_Free_WiFi_5G (no password). [[otp|To continue, sign in with your email address and email password.]] Then you plan to [[data|approve two vendor payments on the company banking portal]] while waiting for your flight.",
        why: "Anyone can create a hotspot with an official-sounding name. On a fake network the attacker can see what you type, and a login page that asks for your email password is harvesting credentials. Banking on public Wi-Fi is a risk.",
        todo: "Use your own mobile data or the company VPN for work and banking. Never type your office or email password on a Wi-Fi login page. Turn off auto-connect to open networks."
      },
      upi_real: {
        title: "Payment received notification",
        ctx: "A notification from your own UPI app while you are at the counter.",
        who: "UPI app",
        subject: "",
        text: "[[ok|₹2,500 received from Anita Traders]] into your current account ending 4471. [[ok|No action needed.]] Transaction ID 628104...",
        why: "Money coming IN never needs your PIN, OTP or a scan. The notification is from your own app, names the payer and asks nothing of you. Compare this with a \"collect request\" or a QR you are asked to scan: those take money OUT.",
        todo: "Nothing to do. Check the amount against your invoice. If a \"payment received\" message ever asks you to approve, enter a PIN or scan, it is taking money, not giving it."
      },
      dpdp: {
        title: "Colleague wants the customer list on WhatsApp",
        ctx: "A WhatsApp message from a sales colleague's number in the evening.",
        who: "Sameer (sales colleague)",
        subject: "",
        text: "Bro, I am working from home today. [[data|Please export the full customer list with phone numbers and Aadhaar copies and send it to me on this WhatsApp]], I will delete it later. [[urgent|Need it in 10 minutes for the campaign.]] [[secret|No need to tell the manager, it's a small thing.]]",
        why: "Customer phone numbers and Aadhaar copies are personal data protected by India's DPDP Act. Sending them on personal WhatsApp takes them outside company control, and this could also be a hacked account or an impersonation. \"Don't tell the manager\" is never acceptable.",
        todo: "Say no politely. Share customer data only through the company's approved system, with the manager's approval and only the fields needed. If a colleague's account seems odd, call them."
      },
      otp_call: {
        title: "\"Fraud department\" needs the OTP to cancel a payment",
        ctx: "A call while an OTP SMS arrives on your phone.",
        who: "\"NovaBank Fraud Department\"",
        subject: "",
        text: "\"Sir, [[threat|a transaction of ₹49,999 is happening on your card right now.]] To cancel it [[urgent|we must act within 60 seconds]]. [[otp|Tell me the OTP that has just arrived on your phone and I will reverse it.]] [[secret|Please do not disconnect or call anyone.]]\"",
        why: "The OTP that \"just arrived\" is for the scammer's own attempt to pay with your card. Reading it out completes the payment. Banks never ask for an OTP to cancel anything, and the 60-second panic is created so you don't think.",
        todo: "Cut the call. Open your bank app and block the card yourself, or call the number on the back of your card. Never read an OTP to anyone. If money has left, call 1930 right away."
      },
      hr_bonus: {
        title: "Diwali bonus form asks for net-banking login",
        ctx: "An email to all staff just before Diwali, from an address that looks like HR.",
        who: "HR Rewards Team",
        subject: "Diwali bonus ₹25,000 - confirm your bank account",
        text: "Dear team member, we are pleased to announce a Diwali bonus of ₹25,000. [[attach|Open the attached form (Bonus_Form.html)]] and [[otp|enter your net-banking user ID and password]] so that the bonus is credited directly. [[urgent|Forms received after 6 pm today will not be processed.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR already has your salary account; no company asks for your net-banking login for a bonus. The sender is a look-alike domain, the HTML attachment is a fake bank login page, and a same-day deadline adds pressure.",
        todo: "Don't open the attachment or enter anything. Ask HR in person or on the intranet. Report the email to IT so colleagues are warned."
      },
      electricity: {
        title: "Office power will be cut tonight",
        ctx: "An SMS to the shop owner's phone at 8:35 pm.",
        who: "",
        subject: "",
        text: "Dear consumer, [[threat|your office electricity connection will be disconnected tonight at 9:30 pm]] because [[odd|last month bill is not update in our system]]. Please contact our officer [[sender|93XXX XXX40]] [[urgent|immediately]].",
        why: "Electricity boards don't disconnect at night after one SMS from a personal mobile. When you call, the \"officer\" asks you to install an app or pay ₹10 through a link, and the real target is your bank account.",
        todo: "Don't call. Check the bill in the electricity board's official app or office. Report the number on Sanchar Saathi (Chakshu)."
      },
      wa_hijack: {
        title: "Colleague asks you to forward a 6-digit code",
        ctx: "A late-night WhatsApp message from a colleague's saved number, right after a code SMS arrived on your phone.",
        who: "Rohan (colleague)",
        subject: "",
        text: "Hey, sorry to disturb you so late. [[odd|I entered your number by mistake while logging into WhatsApp and a 6-digit code went to your phone.]] [[otp|Please forward me that code]], [[urgent|quickly, otherwise my account will be locked.]]",
        why: "The code that arrived is the verification code for YOUR WhatsApp. Whoever gets it takes over your account and then messages all your contacts and office groups asking for money. The message itself may come from a colleague's already-hijacked account.",
        todo: "Never forward a verification code. Phone the colleague to warn them that their account is hacked. Turn on two-step verification in WhatsApp settings."
      },
      invest_group: {
        title: "Stock-tips group with guaranteed returns",
        ctx: "You were added to a WhatsApp group without asking.",
        who: "VIP Stock Tips - Group admin",
        subject: "",
        text: "Welcome to our premium group! [[prize|Our members earned 32% returns last month with guaranteed insider tips.]] Download our trading app from [[link|this link, not from the app store]], and [[money|start with a deposit of ₹50,000]]. [[prize|See the screenshots of profits posted by members!]] [[urgent|Entry closes at midnight.]]",
        why: "Nobody can guarantee returns, and \"insider tips\" are illegal. The app is fake: it shows imaginary profits so you deposit more, and withdrawal is never allowed. The \"members\" posting screenshots are the scammers.",
        todo: "Leave and report the group. Invest only through SEBI-registered brokers and apps from the official app store. If you have deposited, call 1930 and report at cybercrime.gov.in."
      },
      bank_real: {
        title: "Debit alert for a payment you made",
        ctx: "Your accounts team paid the packaging vendor today. This SMS arrives.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|₹86,000 debited from account ending 4471 on 10 Oct for NEFT to Sunrise Packaging]], ref N26101034. Balance ₹3,42,118. [[ok|If not done by you, call the number on the back of your debit card.]]",
        why: "This matches the payment your accounts team made today, comes from the bank's sender ID, has no link or number inside the SMS and points you to the number on your own card.",
        todo: "Match it with your payment records. If any debit alert does not match a payment you made, call the bank immediately using the number on the card, not a number from a message."
      }
    }
  },
  ml: {
    scenarios: {
      ceo_gift: {
        title: "Boss on a new number wants gift cards",
        ctx: "WhatsApp message to an accounts executive at 9 am. The profile photo is the MD's photo from the company website.",
        who: "Rajesh Sir (new number)",
        subject: "",
        text: "Hi, this is Rajesh. [[sender|My old phone is damaged, I am using this number for now.]] I am in a meeting with a big client. [[money|Buy 10 gift cards of ₹5,000 each]] and send me the codes [[urgent|within 30 minutes]]. [[secret|Please don't discuss this with anyone, it is a surprise for the client.]]",
        why: "Scammers copy the MD's photo from the website and write from a new number. A real boss never asks for gift-card codes or for secrecy. New number + urgency + secrecy is the classic \"CEO fraud\".",
        todo: "Don't buy anything. Call your boss on the number saved in your phone, or walk to their cabin. Tell IT or your manager so the whole office is warned."
      },
      it_real: {
        title: "Password policy notice from IT",
        ctx: "An email to all staff from the company's own IT helpdesk.",
        who: "IT Helpdesk",
        subject: "Password policy change from 15 October",
        text: "Dear colleagues, from 15 October passwords must be at least 12 characters long. [[ok|You do not need to do anything today.]] When your password expires, change it [[ok|on the office portal you normally use]]. [[ok|IT will never ask for your password by email, phone or WhatsApp.]] For doubts, visit the helpdesk on the 2nd floor.",
        why: "The sender is the company's own IT address. There is no link to click, no attachment, no deadline and no request for a password. Genuine notices tell you what will happen and let you use the normal portal yourself.",
        todo: "Nothing urgent. If you are unsure whether a notice is real, walk to the helpdesk or call the extension number you already know."
      },
      bec_vendor: {
        title: "Vendor says its bank account has changed",
        ctx: "An email to the accounts team about a pending invoice of ₹4,80,000.",
        who: "Kaveri Logistics Accounts",
        subject: "URGENT: Updated bank details for Invoice KL/2026/0912",
        text: "Dear Sir/Madam, [[newacct|our company bank account has changed after an audit. Please pay the pending invoice of ₹4,80,000 to the new account given below.]] [[urgent|Payment must be released today]] to avoid delay of your shipment. [[sender|Kindly reply only to this email ID]], our office phones are under maintenance.",
        why: "This is Business Email Compromise (BEC). Criminals hack or copy a vendor's email and send \"new bank details\". The address is slightly different from the real vendor, the phones \"are not working\" so you cannot verify, and everything is urgent.",
        todo: "Never change a vendor's bank details because of an email. Call the vendor on the number from your old records or purchase order, never the number in the email. Use two-person approval for every bank-detail change."
      },
      gst_notice: {
        title: "GST penalty notice with an attachment",
        ctx: "An email to the accounts mailbox early in the morning.",
        who: "GST Department",
        subject: "Show Cause Notice - Penalty ₹1,24,500 - Action required",
        text: "[[odd|Dear Taxpayer,]] a mismatch is found in your GST returns. A penalty of ₹1,24,500 is due. [[threat|Your GSTIN will be suspended in 48 hours]] if it is not paid. [[link|Open the attached notice and pay through the secure link]] to avoid legal action. [[attach|Attachment: GST_Notice_2026.html]]",
        why: "Real GST notices appear in your account on the official GST portal and carry a DIN (Document Identification Number). An HTML attachment with a \"secure link\" is a fake login page that steals your GST login or payment details. The sender is not the official gov.in domain.",
        todo: "Don't open the attachment. Log in to the official GST portal yourself by typing the address, or ask your CA to check. Report the email to IT and at cybercrime.gov.in."
      },
      otp_real: {
        title: "OTP for a payment you just started",
        ctx: "You have just started a UPI payment of ₹2,500 to your packaging vendor. This SMS arrives.",
        who: "",
        subject: "",
        text: "[[ok|Your OTP for the UPI payment of ₹2,500 to Sunrise Packaging that you just started is 482913.]] Valid for 10 minutes. [[ok|Do not share this OTP with anyone, not even the bank.]] - NovaBank",
        why: "You started this payment yourself a moment ago, the amount and the payee match, and the message tells you not to share the code. A genuine OTP is only for the action you yourself requested, and the bank never asks you to tell it to anyone.",
        todo: "Type the OTP only in the app you are using. If an OTP arrives when you did not start anything, somebody is trying to use your account: do not share it, and call the bank on the number printed on your card."
      },
      digital_arrest: {
        title: "Video call from a \"CBI officer\"",
        ctx: "A video call from an unknown number. The caller wears a uniform and sits in an office with a flag behind him.",
        who: "\"CBI Officer Verma\"",
        subject: "",
        text: "\"[[threat|A parcel with drugs and 6 passports was booked in your name. A case is registered against you.]] [[urgent|Stay on this video call, do not disconnect]], and [[secret|do not tell anyone, not even your family, they are also under watch]]. [[money|Transfer ₹3,50,000 to this RBI verification account for checking]]; it will be returned after the investigation.\"",
        why: "This is a \"digital arrest\". No police, CBI or court arrests anyone on a video call, and no agency asks you to transfer money to a \"verification account\". The uniform, office background and ID card are all fake. Secrecy and keeping you on the call stop you from thinking.",
        todo: "Hang up at once. Real officers do not call on WhatsApp. Call 1930 or report at cybercrime.gov.in, and tell a colleague or family member immediately."
      },
      courier: {
        title: "Call: your parcel is held at customs",
        ctx: "A recorded voice, then a person. You have not ordered anything from abroad.",
        who: "\"SpeedParcel Customer Service\"",
        subject: "",
        text: "\"Hello, this is the customs department of SpeedParcel. [[threat|A parcel in your name is held at customs because it contains illegal items.]] To avoid a police case, [[urgent|press 1 now]] to speak to an officer, or [[money|pay the ₹2,999 clearance fee]] on the link we will send.\"",
        why: "Courier companies do not call about illegal items, and customs does not collect fees by phone. Pressing 1 connects you to a fake \"officer\" who then tries a digital-arrest scam or asks for payments.",
        todo: "Cut the call. If you really ordered something, check the tracking number on the courier's official website. Report the number on the Sanchar Saathi (Chakshu) portal."
      },
      task_job: {
        title: "Telegram job: earn ₹8,000 a day rating hotels",
        ctx: "A Telegram message after you applied for jobs online last week.",
        who: "HR Priya - Online Jobs",
        subject: "",
        text: "Congratulations, you are selected! [[prize|Earn ₹3,000 to ₹8,000 daily by rating hotels online]], only 20 minutes of work. The first 3 tasks are free. For premium tasks you [[money|deposit ₹5,000 and get back ₹7,500 within one hour]]. [[urgent|Only 4 seats left today!]]",
        why: "This is a task scam. The first small payments are real, to build trust. Then you \"deposit\" for premium tasks and the money never comes back. No real job pays you to click, and no employer asks you to deposit money.",
        todo: "Don't deposit anything. Block and report the account. If you have already paid, call 1930 immediately; the first hour matters most."
      },
      vendor_real: {
        title: "Payment reminder from a known vendor",
        ctx: "An email from the packaging vendor you pay every month, from their usual address.",
        who: "Sunrise Packaging Billing",
        subject: "Payment reminder - Invoice SP/26-27/0431 due 10 Oct",
        text: "Dear Meridian Textiles team, this is a gentle reminder that invoice SP/26-27/0431 for ₹86,000 is due on 10 October. [[ok|Our bank details are unchanged and are printed on the invoice you already have.]] [[ok|If you receive any email asking to change our bank account, please call our office on the number in your records before paying.]] Thank you.",
        why: "A regular reminder from the known vendor address, no new bank details, no threat, and the vendor itself asks you to verify by phone if anything looks different. That is exactly how a genuine partner behaves.",
        todo: "Pay through your normal process to the account already in your records. Any change request should be confirmed on a known phone number."
      },
      deepfake: {
        title: "The MD's voice asks for an urgent transfer",
        ctx: "A phone call from an unknown number. The voice sounds exactly like your MD, with airport noise behind.",
        who: "\"Rajesh Sir\" (the MD's voice)",
        subject: "",
        text: "\"Hello, it's me, I am at the airport, you can hear it is noisy. [[urgent|I need you to transfer ₹2,00,000 right now]] to a new supplier for the Dubai order. [[newacct|I will WhatsApp you the account number.]] [[secret|Don't call me back, my phone is going on flight mode, just do it before I land.]]\"",
        why: "AI can copy anyone's voice from a 30-second clip of a speech or video. A cloned voice plus a new account number plus \"don't call me back\" is a deepfake scam. The background noise is added on purpose.",
        todo: "Say you will call back, then call the MD on the saved number or check with a second senior person. Agree on a code word in your team for urgent phone requests. No transfer without the normal approval."
      },
      qr_receive: {
        title: "Buyer sends a QR code to \"receive\" money",
        ctx: "You advertised 12 used office chairs on a classified-ads site. A buyer writes on WhatsApp.",
        who: "Buyer for office chairs",
        subject: "",
        text: "Hi, I saw your ad for 12 used office chairs at ₹18,000. I will pay the full amount now. [[upi|I have sent a QR code: scan it and enter your UPI PIN to receive the money.]] [[odd|I am an army officer posted outside, so my friend will pick up the chairs.]] [[urgent|Please do it in the next 5 minutes, my network is weak.]]",
        why: "You never scan a QR or enter a PIN to RECEIVE money. Scanning and entering the PIN PAYS the other person. The \"army officer\" story and the hurry are standard tricks on classified-ad sites.",
        todo: "Refuse. Ask the buyer to send money to your UPI ID; you need to do nothing to receive it. Report the number in the app."
      },
      fake_care: {
        title: "Customer-care number found on search",
        ctx: "A refund did not arrive. You searched online for the bank's customer care and called the first number shown.",
        who: "\"NovaBank Customer Care\"",
        subject: "",
        text: "\"Thank you for calling NovaBank customer care. For your refund of ₹3,200 we need to verify you. [[otp|Please tell me your 16-digit card number, expiry date and the OTP you receive now.]] [[remote|Also install the Quick Support app I am sending so I can process it faster.]]\"",
        why: "You called a fake number placed in search results or on a fake website. No bank asks for the full card number, expiry, CVV or OTP, and never asks you to install a remote-control app.",
        todo: "Cut the call. Use only the number printed on the back of your card or inside the official app. Never install an app a caller asks for. If you shared anything, block the card in the app at once and call 1930."
      },
      hr_real: {
        title: "Diwali holiday list from HR",
        ctx: "An email to all staff from the company's HR address.",
        who: "HR Department",
        subject: "Holiday list for Diwali week",
        text: "Dear all, the office will be closed from 7 to 9 November for Diwali. [[ok|The full holiday list is on the HR page of the intranet]], the same page you use for leave. [[ok|No action is needed from you.]] Wishing everyone a happy and safe Diwali. - HR Team",
        why: "Sent from the company's own HR address, information only, no link to an outside site, no attachment to open and nothing to fill in. Genuine notices do not need urgency.",
        todo: "Nothing to do. If an email about holidays or a bonus asks you to log in or fill in bank details, treat that as a red flag and ask HR in person."
      },
      screen_share: {
        title: "\"UPI helpline\" wants to see your screen",
        ctx: "A call minutes after a UPI payment failed and you complained on social media.",
        who: "\"UPI Helpline\"",
        subject: "",
        text: "\"Sir, your UPI payment of ₹1,500 is stuck. I can fix it in 2 minutes. [[remote|Please install the screen-sharing app from the link I sent and read me the 9-digit code on the screen.]] Keep your banking app open, I only need to see it. [[otp|When the OTP comes, don't cut the call, I will guide you.]]\"",
        why: "Remote-access and screen-sharing apps let the caller see and control your phone; the 9-digit code gives them full access. Together with an OTP they can empty the account within minutes. Genuine helplines never ask to see your screen.",
        todo: "Cut the call and uninstall any app you installed. Complain only inside the official UPI or bank app. If money has moved, call 1930 and your bank immediately."
      },
      invoice_exe: {
        title: "Invoice attachment ending in .exe",
        ctx: "An email to the accounts mailbox from a company you do not remember buying from.",
        who: "Global Trade Supplies",
        subject: "Invoice attached - please process",
        text: "[[odd|Dear Sir,]] please find attached the invoice for the goods delivered last week. [[attach|Attachment: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|Kindly process payment today]] and confirm. [[odd|Regards, Accounts Dept.]]",
        why: "A file ending in .exe is a program, not a PDF; the \".pdf\" in the name is a disguise. Opening it installs malware or ransomware that can lock every computer in the office. A vague greeting and no company signature are extra warnings.",
        todo: "Don't open the attachment. Report the email to IT. Check your records: did you actually buy from this company? Turn on \"show file extensions\" on office computers so such tricks are visible."
      },
      echallan: {
        title: "Traffic e-challan SMS with an app link",
        ctx: "An SMS to the office driver's phone in the evening.",
        who: "",
        subject: "",
        text: "Traffic e-Challan: your vehicle KA-05-XX-1234 was recorded jumping a signal on 1 October. [[money|Fine ₹1,000.]] [[urgent|Pay within 24 hours]] to avoid double fine and court summons. [[link|Download the official challan app: echallan-pay.example.net/app.apk]]",
        why: "Real e-challan messages come from a government sender ID, not a personal mobile number, and never ask you to download an .apk file. The APK is a malicious app that reads your SMS and OTPs.",
        todo: "Delete the message. Check challans only on the official government e-challan website or the state police app. Report the number on Sanchar Saathi (Chakshu)."
      },
      parcel_real: {
        title: "Delivery update for a parcel you expect",
        ctx: "You ordered packaging material last week. This SMS arrives.",
        who: "",
        subject: "",
        text: "SpeedParcel: your shipment SP48213 from Sunrise Packaging [[ok|will be delivered today between 2 pm and 5 pm.]] [[ok|No payment is due.]] [[ok|To track, use your shipment number on our website or app.]]",
        why: "Sent from a registered sender ID (not a personal number), matches a parcel you expect, asks for no money and gives no link to tap. A genuine delivery message just informs you.",
        todo: "Nothing to do. If a parcel message asks for a fee, a link or an app, stop and check on the official website using the shipment number."
      },
      kyc: {
        title: "KYC expired, account blocked today",
        ctx: "An SMS to the owner's phone at night.",
        who: "",
        subject: "",
        text: "Dear customer, [[threat|your NovaBank account will be blocked today]] because your KYC has expired. [[urgent|Update immediately]] at [[link|novabank-kyc-update.example.net]] or [[sender|call our officer on 94XXX XXX51]].",
        why: "Banks never send KYC links from a personal mobile number and never block an account within hours. The link opens a fake bank page that steals your login and OTP; the \"officer\" asks you to install an app.",
        todo: "Don't tap the link or call. If KYC is really due, the bank's own app or branch will tell you. Report the SMS on Sanchar Saathi (Chakshu)."
      },
      sim_swap: {
        title: "Call: your SIM will be deactivated",
        ctx: "A call to the office manager, who uses this number for bank OTPs.",
        who: "\"Telecom company executive\"",
        subject: "",
        text: "\"Madam, this is from your mobile network. [[threat|Your SIM will be deactivated in 24 hours]] because the 5G upgrade is pending. [[otp|To upgrade, read out the 20-digit number printed on your SIM card and press 1 after the SMS you receive.]] [[urgent|This offer closes today.]]\"",
        why: "This is a SIM-swap attempt. With the 20-digit SIM number and your \"1\", the fraudster activates your number on their own SIM. Your phone goes dead and every OTP for banking and UPI then goes to them.",
        todo: "Cut the call. Telecom companies never call for 5G upgrades. If your phone suddenly loses network for a long time, call your bank first, then your operator. Check SIMs issued in your name on Sanchar Saathi."
      },
      mfa: {
        title: "Seventh login approval request since midnight",
        ctx: "Your phone keeps buzzing at night with sign-in approval requests from the office login app. Then a call comes.",
        who: "SecureLogin app",
        subject: "",
        text: "[[otp|Approve sign-in? Someone is trying to sign in to your office account from a new device. Tap APPROVE to continue.]] [[odd|(This is the 7th request since midnight.)]] A moment later a caller says: \"[[urgent|This is IT, we are fixing a server. Please just approve the request so the alerts stop.]]\"",
        why: "This is \"MFA fatigue\". The attacker already has your password and is spamming approval requests, hoping you tap Approve to make them stop. The \"IT\" call is part of the attack. Real IT never asks you to approve a login you did not start.",
        todo: "Tap Deny every time. Change your password from a trusted device right away and tell IT. The repeated requests mean your password has already leaked."
      },
      gst_real: {
        title: "Monthly GST reminder from your CA",
        ctx: "A WhatsApp message from your chartered accountant's saved number.",
        who: "Mehta & Co. (our CA)",
        subject: "",
        text: "Good morning. Reminder: GSTR-3B for September is due on 20 October. [[ok|Please upload the sales and purchase sheets to the same shared folder as every month.]] [[ok|No payment is needed from your side right now]]; I will send the challan details after filing, and we can confirm on our usual call.",
        why: "Known CA, saved number, the usual monthly process, no new account number, no link and no urgency beyond the real due date. Verification happens on your regular call.",
        todo: "Follow your normal process. If one day the \"CA\" sends a new bank account or asks you to pay through a link, call the CA office on the known number first."
      },
      lookalike: {
        title: "Salary slip on a look-alike domain",
        ctx: "An email about a revised salary slip. Your company's real domain is meridiantextiles.example.com.",
        who: "Payroll Team",
        subject: "Your revised salary slip is ready",
        text: "Dear employee, your salary structure has been revised from October. [[link|Log in at meridian-textiles-portal.example.com with your office password to view the new slip.]] [[urgent|The link expires in 12 hours.]] [[sender|Sent from payroll@meridian-textiles.example.com]]",
        why: "The real company domain is meridiantextiles.example.com; the email uses meridian-textiles (with a hyphen), a look-alike domain. The link leads to a copied login page that steals your office password. A salary slip would be on the HR portal you always use.",
        todo: "Don't click. Open the HR portal yourself by typing the address or from your bookmark. Report the email to IT; forwarding it helps them block the fake domain for everyone."
      },
      usb: {
        title: "Pen drive found in the parking lot",
        ctx: "Monday morning, near the office entrance.",
        who: "A pen drive found in the office parking",
        subject: "",
        text: "A pen drive lies near the entrance with a label: [[prize|\"Salary Revision 2026 - CONFIDENTIAL - Management only\"]]. A colleague says: \"[[remote|Let's plug it into the reception PC and see whose it is.]]\"",
        why: "This is a \"USB drop\". Attackers leave pen drives with tempting labels; the moment one is plugged in, hidden software can install itself and spread across the office network. Curiosity is the attack.",
        todo: "Don't plug it in anywhere. Hand it to IT or security in an envelope. Companies should disable auto-run and block unknown USB devices."
      },
      wifi: {
        title: "Free airport Wi-Fi asks for your email password",
        ctx: "Waiting for a flight, you connect to a free network to approve two vendor payments.",
        who: "Free Wi-Fi login screen at the airport",
        subject: "",
        text: "Network: Airport_Free_WiFi_5G (no password). [[otp|To continue, sign in with your email address and email password.]] Then you plan to [[data|approve two vendor payments on the company banking portal]] while waiting for your flight.",
        why: "Anyone can create a hotspot with an official-sounding name. On a fake network the attacker can see what you type, and a login page that asks for your email password is harvesting credentials. Banking on public Wi-Fi is a risk.",
        todo: "Use your own mobile data or the company VPN for work and banking. Never type your office or email password on a Wi-Fi login page. Turn off auto-connect to open networks."
      },
      upi_real: {
        title: "Payment received notification",
        ctx: "A notification from your own UPI app while you are at the counter.",
        who: "UPI app",
        subject: "",
        text: "[[ok|₹2,500 received from Anita Traders]] into your current account ending 4471. [[ok|No action needed.]] Transaction ID 628104...",
        why: "Money coming IN never needs your PIN, OTP or a scan. The notification is from your own app, names the payer and asks nothing of you. Compare this with a \"collect request\" or a QR you are asked to scan: those take money OUT.",
        todo: "Nothing to do. Check the amount against your invoice. If a \"payment received\" message ever asks you to approve, enter a PIN or scan, it is taking money, not giving it."
      },
      dpdp: {
        title: "Colleague wants the customer list on WhatsApp",
        ctx: "A WhatsApp message from a sales colleague's number in the evening.",
        who: "Sameer (sales colleague)",
        subject: "",
        text: "Bro, I am working from home today. [[data|Please export the full customer list with phone numbers and Aadhaar copies and send it to me on this WhatsApp]], I will delete it later. [[urgent|Need it in 10 minutes for the campaign.]] [[secret|No need to tell the manager, it's a small thing.]]",
        why: "Customer phone numbers and Aadhaar copies are personal data protected by India's DPDP Act. Sending them on personal WhatsApp takes them outside company control, and this could also be a hacked account or an impersonation. \"Don't tell the manager\" is never acceptable.",
        todo: "Say no politely. Share customer data only through the company's approved system, with the manager's approval and only the fields needed. If a colleague's account seems odd, call them."
      },
      otp_call: {
        title: "\"Fraud department\" needs the OTP to cancel a payment",
        ctx: "A call while an OTP SMS arrives on your phone.",
        who: "\"NovaBank Fraud Department\"",
        subject: "",
        text: "\"Sir, [[threat|a transaction of ₹49,999 is happening on your card right now.]] To cancel it [[urgent|we must act within 60 seconds]]. [[otp|Tell me the OTP that has just arrived on your phone and I will reverse it.]] [[secret|Please do not disconnect or call anyone.]]\"",
        why: "The OTP that \"just arrived\" is for the scammer's own attempt to pay with your card. Reading it out completes the payment. Banks never ask for an OTP to cancel anything, and the 60-second panic is created so you don't think.",
        todo: "Cut the call. Open your bank app and block the card yourself, or call the number on the back of your card. Never read an OTP to anyone. If money has left, call 1930 right away."
      },
      hr_bonus: {
        title: "Diwali bonus form asks for net-banking login",
        ctx: "An email to all staff just before Diwali, from an address that looks like HR.",
        who: "HR Rewards Team",
        subject: "Diwali bonus ₹25,000 - confirm your bank account",
        text: "Dear team member, we are pleased to announce a Diwali bonus of ₹25,000. [[attach|Open the attached form (Bonus_Form.html)]] and [[otp|enter your net-banking user ID and password]] so that the bonus is credited directly. [[urgent|Forms received after 6 pm today will not be processed.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR already has your salary account; no company asks for your net-banking login for a bonus. The sender is a look-alike domain, the HTML attachment is a fake bank login page, and a same-day deadline adds pressure.",
        todo: "Don't open the attachment or enter anything. Ask HR in person or on the intranet. Report the email to IT so colleagues are warned."
      },
      electricity: {
        title: "Office power will be cut tonight",
        ctx: "An SMS to the shop owner's phone at 8:35 pm.",
        who: "",
        subject: "",
        text: "Dear consumer, [[threat|your office electricity connection will be disconnected tonight at 9:30 pm]] because [[odd|last month bill is not update in our system]]. Please contact our officer [[sender|93XXX XXX40]] [[urgent|immediately]].",
        why: "Electricity boards don't disconnect at night after one SMS from a personal mobile. When you call, the \"officer\" asks you to install an app or pay ₹10 through a link, and the real target is your bank account.",
        todo: "Don't call. Check the bill in the electricity board's official app or office. Report the number on Sanchar Saathi (Chakshu)."
      },
      wa_hijack: {
        title: "Colleague asks you to forward a 6-digit code",
        ctx: "A late-night WhatsApp message from a colleague's saved number, right after a code SMS arrived on your phone.",
        who: "Rohan (colleague)",
        subject: "",
        text: "Hey, sorry to disturb you so late. [[odd|I entered your number by mistake while logging into WhatsApp and a 6-digit code went to your phone.]] [[otp|Please forward me that code]], [[urgent|quickly, otherwise my account will be locked.]]",
        why: "The code that arrived is the verification code for YOUR WhatsApp. Whoever gets it takes over your account and then messages all your contacts and office groups asking for money. The message itself may come from a colleague's already-hijacked account.",
        todo: "Never forward a verification code. Phone the colleague to warn them that their account is hacked. Turn on two-step verification in WhatsApp settings."
      },
      invest_group: {
        title: "Stock-tips group with guaranteed returns",
        ctx: "You were added to a WhatsApp group without asking.",
        who: "VIP Stock Tips - Group admin",
        subject: "",
        text: "Welcome to our premium group! [[prize|Our members earned 32% returns last month with guaranteed insider tips.]] Download our trading app from [[link|this link, not from the app store]], and [[money|start with a deposit of ₹50,000]]. [[prize|See the screenshots of profits posted by members!]] [[urgent|Entry closes at midnight.]]",
        why: "Nobody can guarantee returns, and \"insider tips\" are illegal. The app is fake: it shows imaginary profits so you deposit more, and withdrawal is never allowed. The \"members\" posting screenshots are the scammers.",
        todo: "Leave and report the group. Invest only through SEBI-registered brokers and apps from the official app store. If you have deposited, call 1930 and report at cybercrime.gov.in."
      },
      bank_real: {
        title: "Debit alert for a payment you made",
        ctx: "Your accounts team paid the packaging vendor today. This SMS arrives.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|₹86,000 debited from account ending 4471 on 10 Oct for NEFT to Sunrise Packaging]], ref N26101034. Balance ₹3,42,118. [[ok|If not done by you, call the number on the back of your debit card.]]",
        why: "This matches the payment your accounts team made today, comes from the bank's sender ID, has no link or number inside the SMS and points you to the number on your own card.",
        todo: "Match it with your payment records. If any debit alert does not match a payment you made, call the bank immediately using the number on the card, not a number from a message."
      }
    }
  },
  ur: {
    scenarios: {
      ceo_gift: {
        title: "Boss on a new number wants gift cards",
        ctx: "WhatsApp message to an accounts executive at 9 am. The profile photo is the MD's photo from the company website.",
        who: "Rajesh Sir (new number)",
        subject: "",
        text: "Hi, this is Rajesh. [[sender|My old phone is damaged, I am using this number for now.]] I am in a meeting with a big client. [[money|Buy 10 gift cards of ₹5,000 each]] and send me the codes [[urgent|within 30 minutes]]. [[secret|Please don't discuss this with anyone, it is a surprise for the client.]]",
        why: "Scammers copy the MD's photo from the website and write from a new number. A real boss never asks for gift-card codes or for secrecy. New number + urgency + secrecy is the classic \"CEO fraud\".",
        todo: "Don't buy anything. Call your boss on the number saved in your phone, or walk to their cabin. Tell IT or your manager so the whole office is warned."
      },
      it_real: {
        title: "Password policy notice from IT",
        ctx: "An email to all staff from the company's own IT helpdesk.",
        who: "IT Helpdesk",
        subject: "Password policy change from 15 October",
        text: "Dear colleagues, from 15 October passwords must be at least 12 characters long. [[ok|You do not need to do anything today.]] When your password expires, change it [[ok|on the office portal you normally use]]. [[ok|IT will never ask for your password by email, phone or WhatsApp.]] For doubts, visit the helpdesk on the 2nd floor.",
        why: "The sender is the company's own IT address. There is no link to click, no attachment, no deadline and no request for a password. Genuine notices tell you what will happen and let you use the normal portal yourself.",
        todo: "Nothing urgent. If you are unsure whether a notice is real, walk to the helpdesk or call the extension number you already know."
      },
      bec_vendor: {
        title: "Vendor says its bank account has changed",
        ctx: "An email to the accounts team about a pending invoice of ₹4,80,000.",
        who: "Kaveri Logistics Accounts",
        subject: "URGENT: Updated bank details for Invoice KL/2026/0912",
        text: "Dear Sir/Madam, [[newacct|our company bank account has changed after an audit. Please pay the pending invoice of ₹4,80,000 to the new account given below.]] [[urgent|Payment must be released today]] to avoid delay of your shipment. [[sender|Kindly reply only to this email ID]], our office phones are under maintenance.",
        why: "This is Business Email Compromise (BEC). Criminals hack or copy a vendor's email and send \"new bank details\". The address is slightly different from the real vendor, the phones \"are not working\" so you cannot verify, and everything is urgent.",
        todo: "Never change a vendor's bank details because of an email. Call the vendor on the number from your old records or purchase order, never the number in the email. Use two-person approval for every bank-detail change."
      },
      gst_notice: {
        title: "GST penalty notice with an attachment",
        ctx: "An email to the accounts mailbox early in the morning.",
        who: "GST Department",
        subject: "Show Cause Notice - Penalty ₹1,24,500 - Action required",
        text: "[[odd|Dear Taxpayer,]] a mismatch is found in your GST returns. A penalty of ₹1,24,500 is due. [[threat|Your GSTIN will be suspended in 48 hours]] if it is not paid. [[link|Open the attached notice and pay through the secure link]] to avoid legal action. [[attach|Attachment: GST_Notice_2026.html]]",
        why: "Real GST notices appear in your account on the official GST portal and carry a DIN (Document Identification Number). An HTML attachment with a \"secure link\" is a fake login page that steals your GST login or payment details. The sender is not the official gov.in domain.",
        todo: "Don't open the attachment. Log in to the official GST portal yourself by typing the address, or ask your CA to check. Report the email to IT and at cybercrime.gov.in."
      },
      otp_real: {
        title: "OTP for a payment you just started",
        ctx: "You have just started a UPI payment of ₹2,500 to your packaging vendor. This SMS arrives.",
        who: "",
        subject: "",
        text: "[[ok|Your OTP for the UPI payment of ₹2,500 to Sunrise Packaging that you just started is 482913.]] Valid for 10 minutes. [[ok|Do not share this OTP with anyone, not even the bank.]] - NovaBank",
        why: "You started this payment yourself a moment ago, the amount and the payee match, and the message tells you not to share the code. A genuine OTP is only for the action you yourself requested, and the bank never asks you to tell it to anyone.",
        todo: "Type the OTP only in the app you are using. If an OTP arrives when you did not start anything, somebody is trying to use your account: do not share it, and call the bank on the number printed on your card."
      },
      digital_arrest: {
        title: "Video call from a \"CBI officer\"",
        ctx: "A video call from an unknown number. The caller wears a uniform and sits in an office with a flag behind him.",
        who: "\"CBI Officer Verma\"",
        subject: "",
        text: "\"[[threat|A parcel with drugs and 6 passports was booked in your name. A case is registered against you.]] [[urgent|Stay on this video call, do not disconnect]], and [[secret|do not tell anyone, not even your family, they are also under watch]]. [[money|Transfer ₹3,50,000 to this RBI verification account for checking]]; it will be returned after the investigation.\"",
        why: "This is a \"digital arrest\". No police, CBI or court arrests anyone on a video call, and no agency asks you to transfer money to a \"verification account\". The uniform, office background and ID card are all fake. Secrecy and keeping you on the call stop you from thinking.",
        todo: "Hang up at once. Real officers do not call on WhatsApp. Call 1930 or report at cybercrime.gov.in, and tell a colleague or family member immediately."
      },
      courier: {
        title: "Call: your parcel is held at customs",
        ctx: "A recorded voice, then a person. You have not ordered anything from abroad.",
        who: "\"SpeedParcel Customer Service\"",
        subject: "",
        text: "\"Hello, this is the customs department of SpeedParcel. [[threat|A parcel in your name is held at customs because it contains illegal items.]] To avoid a police case, [[urgent|press 1 now]] to speak to an officer, or [[money|pay the ₹2,999 clearance fee]] on the link we will send.\"",
        why: "Courier companies do not call about illegal items, and customs does not collect fees by phone. Pressing 1 connects you to a fake \"officer\" who then tries a digital-arrest scam or asks for payments.",
        todo: "Cut the call. If you really ordered something, check the tracking number on the courier's official website. Report the number on the Sanchar Saathi (Chakshu) portal."
      },
      task_job: {
        title: "Telegram job: earn ₹8,000 a day rating hotels",
        ctx: "A Telegram message after you applied for jobs online last week.",
        who: "HR Priya - Online Jobs",
        subject: "",
        text: "Congratulations, you are selected! [[prize|Earn ₹3,000 to ₹8,000 daily by rating hotels online]], only 20 minutes of work. The first 3 tasks are free. For premium tasks you [[money|deposit ₹5,000 and get back ₹7,500 within one hour]]. [[urgent|Only 4 seats left today!]]",
        why: "This is a task scam. The first small payments are real, to build trust. Then you \"deposit\" for premium tasks and the money never comes back. No real job pays you to click, and no employer asks you to deposit money.",
        todo: "Don't deposit anything. Block and report the account. If you have already paid, call 1930 immediately; the first hour matters most."
      },
      vendor_real: {
        title: "Payment reminder from a known vendor",
        ctx: "An email from the packaging vendor you pay every month, from their usual address.",
        who: "Sunrise Packaging Billing",
        subject: "Payment reminder - Invoice SP/26-27/0431 due 10 Oct",
        text: "Dear Meridian Textiles team, this is a gentle reminder that invoice SP/26-27/0431 for ₹86,000 is due on 10 October. [[ok|Our bank details are unchanged and are printed on the invoice you already have.]] [[ok|If you receive any email asking to change our bank account, please call our office on the number in your records before paying.]] Thank you.",
        why: "A regular reminder from the known vendor address, no new bank details, no threat, and the vendor itself asks you to verify by phone if anything looks different. That is exactly how a genuine partner behaves.",
        todo: "Pay through your normal process to the account already in your records. Any change request should be confirmed on a known phone number."
      },
      deepfake: {
        title: "The MD's voice asks for an urgent transfer",
        ctx: "A phone call from an unknown number. The voice sounds exactly like your MD, with airport noise behind.",
        who: "\"Rajesh Sir\" (the MD's voice)",
        subject: "",
        text: "\"Hello, it's me, I am at the airport, you can hear it is noisy. [[urgent|I need you to transfer ₹2,00,000 right now]] to a new supplier for the Dubai order. [[newacct|I will WhatsApp you the account number.]] [[secret|Don't call me back, my phone is going on flight mode, just do it before I land.]]\"",
        why: "AI can copy anyone's voice from a 30-second clip of a speech or video. A cloned voice plus a new account number plus \"don't call me back\" is a deepfake scam. The background noise is added on purpose.",
        todo: "Say you will call back, then call the MD on the saved number or check with a second senior person. Agree on a code word in your team for urgent phone requests. No transfer without the normal approval."
      },
      qr_receive: {
        title: "Buyer sends a QR code to \"receive\" money",
        ctx: "You advertised 12 used office chairs on a classified-ads site. A buyer writes on WhatsApp.",
        who: "Buyer for office chairs",
        subject: "",
        text: "Hi, I saw your ad for 12 used office chairs at ₹18,000. I will pay the full amount now. [[upi|I have sent a QR code: scan it and enter your UPI PIN to receive the money.]] [[odd|I am an army officer posted outside, so my friend will pick up the chairs.]] [[urgent|Please do it in the next 5 minutes, my network is weak.]]",
        why: "You never scan a QR or enter a PIN to RECEIVE money. Scanning and entering the PIN PAYS the other person. The \"army officer\" story and the hurry are standard tricks on classified-ad sites.",
        todo: "Refuse. Ask the buyer to send money to your UPI ID; you need to do nothing to receive it. Report the number in the app."
      },
      fake_care: {
        title: "Customer-care number found on search",
        ctx: "A refund did not arrive. You searched online for the bank's customer care and called the first number shown.",
        who: "\"NovaBank Customer Care\"",
        subject: "",
        text: "\"Thank you for calling NovaBank customer care. For your refund of ₹3,200 we need to verify you. [[otp|Please tell me your 16-digit card number, expiry date and the OTP you receive now.]] [[remote|Also install the Quick Support app I am sending so I can process it faster.]]\"",
        why: "You called a fake number placed in search results or on a fake website. No bank asks for the full card number, expiry, CVV or OTP, and never asks you to install a remote-control app.",
        todo: "Cut the call. Use only the number printed on the back of your card or inside the official app. Never install an app a caller asks for. If you shared anything, block the card in the app at once and call 1930."
      },
      hr_real: {
        title: "Diwali holiday list from HR",
        ctx: "An email to all staff from the company's HR address.",
        who: "HR Department",
        subject: "Holiday list for Diwali week",
        text: "Dear all, the office will be closed from 7 to 9 November for Diwali. [[ok|The full holiday list is on the HR page of the intranet]], the same page you use for leave. [[ok|No action is needed from you.]] Wishing everyone a happy and safe Diwali. - HR Team",
        why: "Sent from the company's own HR address, information only, no link to an outside site, no attachment to open and nothing to fill in. Genuine notices do not need urgency.",
        todo: "Nothing to do. If an email about holidays or a bonus asks you to log in or fill in bank details, treat that as a red flag and ask HR in person."
      },
      screen_share: {
        title: "\"UPI helpline\" wants to see your screen",
        ctx: "A call minutes after a UPI payment failed and you complained on social media.",
        who: "\"UPI Helpline\"",
        subject: "",
        text: "\"Sir, your UPI payment of ₹1,500 is stuck. I can fix it in 2 minutes. [[remote|Please install the screen-sharing app from the link I sent and read me the 9-digit code on the screen.]] Keep your banking app open, I only need to see it. [[otp|When the OTP comes, don't cut the call, I will guide you.]]\"",
        why: "Remote-access and screen-sharing apps let the caller see and control your phone; the 9-digit code gives them full access. Together with an OTP they can empty the account within minutes. Genuine helplines never ask to see your screen.",
        todo: "Cut the call and uninstall any app you installed. Complain only inside the official UPI or bank app. If money has moved, call 1930 and your bank immediately."
      },
      invoice_exe: {
        title: "Invoice attachment ending in .exe",
        ctx: "An email to the accounts mailbox from a company you do not remember buying from.",
        who: "Global Trade Supplies",
        subject: "Invoice attached - please process",
        text: "[[odd|Dear Sir,]] please find attached the invoice for the goods delivered last week. [[attach|Attachment: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|Kindly process payment today]] and confirm. [[odd|Regards, Accounts Dept.]]",
        why: "A file ending in .exe is a program, not a PDF; the \".pdf\" in the name is a disguise. Opening it installs malware or ransomware that can lock every computer in the office. A vague greeting and no company signature are extra warnings.",
        todo: "Don't open the attachment. Report the email to IT. Check your records: did you actually buy from this company? Turn on \"show file extensions\" on office computers so such tricks are visible."
      },
      echallan: {
        title: "Traffic e-challan SMS with an app link",
        ctx: "An SMS to the office driver's phone in the evening.",
        who: "",
        subject: "",
        text: "Traffic e-Challan: your vehicle KA-05-XX-1234 was recorded jumping a signal on 1 October. [[money|Fine ₹1,000.]] [[urgent|Pay within 24 hours]] to avoid double fine and court summons. [[link|Download the official challan app: echallan-pay.example.net/app.apk]]",
        why: "Real e-challan messages come from a government sender ID, not a personal mobile number, and never ask you to download an .apk file. The APK is a malicious app that reads your SMS and OTPs.",
        todo: "Delete the message. Check challans only on the official government e-challan website or the state police app. Report the number on Sanchar Saathi (Chakshu)."
      },
      parcel_real: {
        title: "Delivery update for a parcel you expect",
        ctx: "You ordered packaging material last week. This SMS arrives.",
        who: "",
        subject: "",
        text: "SpeedParcel: your shipment SP48213 from Sunrise Packaging [[ok|will be delivered today between 2 pm and 5 pm.]] [[ok|No payment is due.]] [[ok|To track, use your shipment number on our website or app.]]",
        why: "Sent from a registered sender ID (not a personal number), matches a parcel you expect, asks for no money and gives no link to tap. A genuine delivery message just informs you.",
        todo: "Nothing to do. If a parcel message asks for a fee, a link or an app, stop and check on the official website using the shipment number."
      },
      kyc: {
        title: "KYC expired, account blocked today",
        ctx: "An SMS to the owner's phone at night.",
        who: "",
        subject: "",
        text: "Dear customer, [[threat|your NovaBank account will be blocked today]] because your KYC has expired. [[urgent|Update immediately]] at [[link|novabank-kyc-update.example.net]] or [[sender|call our officer on 94XXX XXX51]].",
        why: "Banks never send KYC links from a personal mobile number and never block an account within hours. The link opens a fake bank page that steals your login and OTP; the \"officer\" asks you to install an app.",
        todo: "Don't tap the link or call. If KYC is really due, the bank's own app or branch will tell you. Report the SMS on Sanchar Saathi (Chakshu)."
      },
      sim_swap: {
        title: "Call: your SIM will be deactivated",
        ctx: "A call to the office manager, who uses this number for bank OTPs.",
        who: "\"Telecom company executive\"",
        subject: "",
        text: "\"Madam, this is from your mobile network. [[threat|Your SIM will be deactivated in 24 hours]] because the 5G upgrade is pending. [[otp|To upgrade, read out the 20-digit number printed on your SIM card and press 1 after the SMS you receive.]] [[urgent|This offer closes today.]]\"",
        why: "This is a SIM-swap attempt. With the 20-digit SIM number and your \"1\", the fraudster activates your number on their own SIM. Your phone goes dead and every OTP for banking and UPI then goes to them.",
        todo: "Cut the call. Telecom companies never call for 5G upgrades. If your phone suddenly loses network for a long time, call your bank first, then your operator. Check SIMs issued in your name on Sanchar Saathi."
      },
      mfa: {
        title: "Seventh login approval request since midnight",
        ctx: "Your phone keeps buzzing at night with sign-in approval requests from the office login app. Then a call comes.",
        who: "SecureLogin app",
        subject: "",
        text: "[[otp|Approve sign-in? Someone is trying to sign in to your office account from a new device. Tap APPROVE to continue.]] [[odd|(This is the 7th request since midnight.)]] A moment later a caller says: \"[[urgent|This is IT, we are fixing a server. Please just approve the request so the alerts stop.]]\"",
        why: "This is \"MFA fatigue\". The attacker already has your password and is spamming approval requests, hoping you tap Approve to make them stop. The \"IT\" call is part of the attack. Real IT never asks you to approve a login you did not start.",
        todo: "Tap Deny every time. Change your password from a trusted device right away and tell IT. The repeated requests mean your password has already leaked."
      },
      gst_real: {
        title: "Monthly GST reminder from your CA",
        ctx: "A WhatsApp message from your chartered accountant's saved number.",
        who: "Mehta & Co. (our CA)",
        subject: "",
        text: "Good morning. Reminder: GSTR-3B for September is due on 20 October. [[ok|Please upload the sales and purchase sheets to the same shared folder as every month.]] [[ok|No payment is needed from your side right now]]; I will send the challan details after filing, and we can confirm on our usual call.",
        why: "Known CA, saved number, the usual monthly process, no new account number, no link and no urgency beyond the real due date. Verification happens on your regular call.",
        todo: "Follow your normal process. If one day the \"CA\" sends a new bank account or asks you to pay through a link, call the CA office on the known number first."
      },
      lookalike: {
        title: "Salary slip on a look-alike domain",
        ctx: "An email about a revised salary slip. Your company's real domain is meridiantextiles.example.com.",
        who: "Payroll Team",
        subject: "Your revised salary slip is ready",
        text: "Dear employee, your salary structure has been revised from October. [[link|Log in at meridian-textiles-portal.example.com with your office password to view the new slip.]] [[urgent|The link expires in 12 hours.]] [[sender|Sent from payroll@meridian-textiles.example.com]]",
        why: "The real company domain is meridiantextiles.example.com; the email uses meridian-textiles (with a hyphen), a look-alike domain. The link leads to a copied login page that steals your office password. A salary slip would be on the HR portal you always use.",
        todo: "Don't click. Open the HR portal yourself by typing the address or from your bookmark. Report the email to IT; forwarding it helps them block the fake domain for everyone."
      },
      usb: {
        title: "Pen drive found in the parking lot",
        ctx: "Monday morning, near the office entrance.",
        who: "A pen drive found in the office parking",
        subject: "",
        text: "A pen drive lies near the entrance with a label: [[prize|\"Salary Revision 2026 - CONFIDENTIAL - Management only\"]]. A colleague says: \"[[remote|Let's plug it into the reception PC and see whose it is.]]\"",
        why: "This is a \"USB drop\". Attackers leave pen drives with tempting labels; the moment one is plugged in, hidden software can install itself and spread across the office network. Curiosity is the attack.",
        todo: "Don't plug it in anywhere. Hand it to IT or security in an envelope. Companies should disable auto-run and block unknown USB devices."
      },
      wifi: {
        title: "Free airport Wi-Fi asks for your email password",
        ctx: "Waiting for a flight, you connect to a free network to approve two vendor payments.",
        who: "Free Wi-Fi login screen at the airport",
        subject: "",
        text: "Network: Airport_Free_WiFi_5G (no password). [[otp|To continue, sign in with your email address and email password.]] Then you plan to [[data|approve two vendor payments on the company banking portal]] while waiting for your flight.",
        why: "Anyone can create a hotspot with an official-sounding name. On a fake network the attacker can see what you type, and a login page that asks for your email password is harvesting credentials. Banking on public Wi-Fi is a risk.",
        todo: "Use your own mobile data or the company VPN for work and banking. Never type your office or email password on a Wi-Fi login page. Turn off auto-connect to open networks."
      },
      upi_real: {
        title: "Payment received notification",
        ctx: "A notification from your own UPI app while you are at the counter.",
        who: "UPI app",
        subject: "",
        text: "[[ok|₹2,500 received from Anita Traders]] into your current account ending 4471. [[ok|No action needed.]] Transaction ID 628104...",
        why: "Money coming IN never needs your PIN, OTP or a scan. The notification is from your own app, names the payer and asks nothing of you. Compare this with a \"collect request\" or a QR you are asked to scan: those take money OUT.",
        todo: "Nothing to do. Check the amount against your invoice. If a \"payment received\" message ever asks you to approve, enter a PIN or scan, it is taking money, not giving it."
      },
      dpdp: {
        title: "Colleague wants the customer list on WhatsApp",
        ctx: "A WhatsApp message from a sales colleague's number in the evening.",
        who: "Sameer (sales colleague)",
        subject: "",
        text: "Bro, I am working from home today. [[data|Please export the full customer list with phone numbers and Aadhaar copies and send it to me on this WhatsApp]], I will delete it later. [[urgent|Need it in 10 minutes for the campaign.]] [[secret|No need to tell the manager, it's a small thing.]]",
        why: "Customer phone numbers and Aadhaar copies are personal data protected by India's DPDP Act. Sending them on personal WhatsApp takes them outside company control, and this could also be a hacked account or an impersonation. \"Don't tell the manager\" is never acceptable.",
        todo: "Say no politely. Share customer data only through the company's approved system, with the manager's approval and only the fields needed. If a colleague's account seems odd, call them."
      },
      otp_call: {
        title: "\"Fraud department\" needs the OTP to cancel a payment",
        ctx: "A call while an OTP SMS arrives on your phone.",
        who: "\"NovaBank Fraud Department\"",
        subject: "",
        text: "\"Sir, [[threat|a transaction of ₹49,999 is happening on your card right now.]] To cancel it [[urgent|we must act within 60 seconds]]. [[otp|Tell me the OTP that has just arrived on your phone and I will reverse it.]] [[secret|Please do not disconnect or call anyone.]]\"",
        why: "The OTP that \"just arrived\" is for the scammer's own attempt to pay with your card. Reading it out completes the payment. Banks never ask for an OTP to cancel anything, and the 60-second panic is created so you don't think.",
        todo: "Cut the call. Open your bank app and block the card yourself, or call the number on the back of your card. Never read an OTP to anyone. If money has left, call 1930 right away."
      },
      hr_bonus: {
        title: "Diwali bonus form asks for net-banking login",
        ctx: "An email to all staff just before Diwali, from an address that looks like HR.",
        who: "HR Rewards Team",
        subject: "Diwali bonus ₹25,000 - confirm your bank account",
        text: "Dear team member, we are pleased to announce a Diwali bonus of ₹25,000. [[attach|Open the attached form (Bonus_Form.html)]] and [[otp|enter your net-banking user ID and password]] so that the bonus is credited directly. [[urgent|Forms received after 6 pm today will not be processed.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR already has your salary account; no company asks for your net-banking login for a bonus. The sender is a look-alike domain, the HTML attachment is a fake bank login page, and a same-day deadline adds pressure.",
        todo: "Don't open the attachment or enter anything. Ask HR in person or on the intranet. Report the email to IT so colleagues are warned."
      },
      electricity: {
        title: "Office power will be cut tonight",
        ctx: "An SMS to the shop owner's phone at 8:35 pm.",
        who: "",
        subject: "",
        text: "Dear consumer, [[threat|your office electricity connection will be disconnected tonight at 9:30 pm]] because [[odd|last month bill is not update in our system]]. Please contact our officer [[sender|93XXX XXX40]] [[urgent|immediately]].",
        why: "Electricity boards don't disconnect at night after one SMS from a personal mobile. When you call, the \"officer\" asks you to install an app or pay ₹10 through a link, and the real target is your bank account.",
        todo: "Don't call. Check the bill in the electricity board's official app or office. Report the number on Sanchar Saathi (Chakshu)."
      },
      wa_hijack: {
        title: "Colleague asks you to forward a 6-digit code",
        ctx: "A late-night WhatsApp message from a colleague's saved number, right after a code SMS arrived on your phone.",
        who: "Rohan (colleague)",
        subject: "",
        text: "Hey, sorry to disturb you so late. [[odd|I entered your number by mistake while logging into WhatsApp and a 6-digit code went to your phone.]] [[otp|Please forward me that code]], [[urgent|quickly, otherwise my account will be locked.]]",
        why: "The code that arrived is the verification code for YOUR WhatsApp. Whoever gets it takes over your account and then messages all your contacts and office groups asking for money. The message itself may come from a colleague's already-hijacked account.",
        todo: "Never forward a verification code. Phone the colleague to warn them that their account is hacked. Turn on two-step verification in WhatsApp settings."
      },
      invest_group: {
        title: "Stock-tips group with guaranteed returns",
        ctx: "You were added to a WhatsApp group without asking.",
        who: "VIP Stock Tips - Group admin",
        subject: "",
        text: "Welcome to our premium group! [[prize|Our members earned 32% returns last month with guaranteed insider tips.]] Download our trading app from [[link|this link, not from the app store]], and [[money|start with a deposit of ₹50,000]]. [[prize|See the screenshots of profits posted by members!]] [[urgent|Entry closes at midnight.]]",
        why: "Nobody can guarantee returns, and \"insider tips\" are illegal. The app is fake: it shows imaginary profits so you deposit more, and withdrawal is never allowed. The \"members\" posting screenshots are the scammers.",
        todo: "Leave and report the group. Invest only through SEBI-registered brokers and apps from the official app store. If you have deposited, call 1930 and report at cybercrime.gov.in."
      },
      bank_real: {
        title: "Debit alert for a payment you made",
        ctx: "Your accounts team paid the packaging vendor today. This SMS arrives.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|₹86,000 debited from account ending 4471 on 10 Oct for NEFT to Sunrise Packaging]], ref N26101034. Balance ₹3,42,118. [[ok|If not done by you, call the number on the back of your debit card.]]",
        why: "This matches the payment your accounts team made today, comes from the bank's sender ID, has no link or number inside the SMS and points you to the number on your own card.",
        todo: "Match it with your payment records. If any debit alert does not match a payment you made, call the bank immediately using the number on the card, not a number from a message."
      }
    }
  }
};
