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
        title: "नव्या नंबरवरून बॉसला गिफ्ट कार्ड हवी आहेत",
        ctx: "सकाळी 9 वाजता अकाउंट्स एक्झिक्युटिव्हला WhatsApp मेसेज. प्रोफाइल फोटो कंपनीच्या वेबसाइटवरचा MD चा फोटो आहे.",
        who: "राजेश सर (नवा नंबर)",
        subject: "",
        text: "हाय, मी राजेश बोलतोय. [[sender|माझा जुना फोन बिघडला आहे, सध्या हाच नंबर वापरतोय.]] मी एका मोठ्या क्लायंटसोबत मीटिंगमध्ये आहे. [[money|₹5,000 ची 10 गिफ्ट कार्ड घ्या]] आणि कोड मला [[urgent|30 मिनिटांत]] पाठवा. [[secret|याबद्दल कोणाशीही बोलू नका, क्लायंटसाठी सरप्राइज आहे.]]",
        why: "स्कॅमर वेबसाइटवरून MD चा फोटो घेतात आणि नव्या नंबरवरून लिहितात. खरा बॉस कधीही गिफ्ट-कार्ड कोड किंवा गुप्तता मागत नाही. नवा नंबर + घाई + गुप्तता हाच क्लासिक \"CEO फ्रॉड\" आहे.",
        todo: "काहीही विकत घेऊ नका. बॉसला फोनमध्ये सेव्ह केलेल्या नंबरवर फोन करा किंवा त्यांच्या केबिनमध्ये जा. संपूर्ण ऑफिस सावध व्हावे म्हणून IT किंवा मॅनेजरला सांगा."
      },
      it_real: {
        title: "IT कडून पासवर्ड धोरणाची सूचना",
        ctx: "कंपनीच्या स्वतःच्या IT हेल्पडेस्ककडून सर्व कर्मचाऱ्यांना ईमेल.",
        who: "IT हेल्पडेस्क",
        subject: "15 ऑक्टोबरपासून पासवर्ड धोरणात बदल",
        text: "प्रिय सहकाऱ्यांनो, 15 ऑक्टोबरपासून पासवर्ड किमान 12 अक्षरांचा असावा. [[ok|आज तुम्हाला काहीही करायची गरज नाही.]] पासवर्डची मुदत संपल्यावर तो [[ok|तुम्ही नेहमी वापरता त्याच ऑफिस पोर्टलवर बदला]]. [[ok|IT कधीही ईमेल, फोन किंवा WhatsApp वर तुमचा पासवर्ड मागणार नाही.]] शंका असल्यास दुसऱ्या मजल्यावरील हेल्पडेस्कला भेटा.",
        why: "पाठवणारा कंपनीचा स्वतःचा IT पत्ता आहे. क्लिक करायला लिंक नाही, अटॅचमेंट नाही, मुदत नाही आणि पासवर्डची मागणी नाही. खऱ्या सूचना काय होणार ते सांगतात आणि नेहमीचे पोर्टल तुम्हाला स्वतः वापरू देतात.",
        todo: "काही तातडीचे नाही. सूचना खरी आहे का अशी शंका असेल तर हेल्पडेस्कला जा किंवा आधीपासून माहीत असलेल्या एक्स्टेंशन नंबरवर फोन करा."
      },
      bec_vendor: {
        title: "व्हेंडर म्हणतो बँक खाते बदलले",
        ctx: "₹4,80,000 च्या थकीत इनव्हॉइसबद्दल अकाउंट्स टीमला ईमेल.",
        who: "कावेरी लॉजिस्टिक्स अकाउंट्स",
        subject: "तातडीचे: इनव्हॉइस KL/2026/0912 साठी नवे बँक तपशील",
        text: "महोदय/महोदया, [[newacct|ऑडिटनंतर आमच्या कंपनीचे बँक खाते बदलले आहे. कृपया ₹4,80,000 चे थकीत इनव्हॉइस खाली दिलेल्या नव्या खात्यात भरा.]] शिपमेंटला उशीर टाळण्यासाठी [[urgent|पेमेंट आजच करा]]. [[sender|कृपया फक्त याच ईमेल ID वर उत्तर द्या]], आमचे ऑफिसचे फोन दुरुस्तीत आहेत.",
        why: "हे बिझनेस ईमेल कॉम्प्रोमाइज (BEC) आहे. गुन्हेगार व्हेंडरचा ईमेल हॅक किंवा कॉपी करून \"नवे बँक तपशील\" पाठवतात. पत्ता खऱ्या व्हेंडरपेक्षा थोडा वेगळा आहे, फोन \"बंद\" आहेत म्हणजे तुम्ही खात्री करू शकत नाही, आणि सगळेच तातडीचे आहे.",
        todo: "ईमेलवरून व्हेंडरचे बँक तपशील कधीही बदलू नका. जुन्या रेकॉर्डमधील किंवा परचेस ऑर्डरवरील नंबरवर व्हेंडरला फोन करा, ईमेलमधील नंबरवर कधीच नाही. प्रत्येक बँक तपशील बदलासाठी दोन लोकांची मंजुरी ठेवा."
      },
      gst_notice: {
        title: "अटॅचमेंटसह GST दंडाची नोटीस",
        ctx: "सकाळी लवकर अकाउंट्स मेलबॉक्समध्ये आलेला ईमेल.",
        who: "GST विभाग",
        subject: "कारणे दाखवा नोटीस - दंड ₹1,24,500 - कृती आवश्यक",
        text: "[[odd|प्रिय करदाते,]] तुमच्या GST रिटर्नमध्ये तफावत आढळली आहे. ₹1,24,500 दंड भरायचा आहे. न भरल्यास [[threat|तुमचा GSTIN 48 तासांत निलंबित केला जाईल]]. कायदेशीर कारवाई टाळण्यासाठी [[link|जोडलेली नोटीस उघडा आणि सुरक्षित लिंकवरून भरा]]. [[attach|अटॅचमेंट: GST_Notice_2026.html]]",
        why: "खऱ्या GST नोटिसा अधिकृत GST पोर्टलवरील तुमच्या खात्यात दिसतात आणि त्यांच्यावर DIN (डॉक्युमेंट आयडेंटिफिकेशन नंबर) असतो. \"सुरक्षित लिंक\" असलेली HTML अटॅचमेंट हे बनावट लॉगिन पान आहे जे तुमचा GST लॉगिन किंवा पेमेंट तपशील चोरते. पाठवणारा अधिकृत gov.in डोमेन नाही.",
        todo: "अटॅचमेंट उघडू नका. पत्ता स्वतः टाइप करून अधिकृत GST पोर्टलवर लॉगिन करा, किंवा तुमच्या CA ला तपासायला सांगा. ईमेलची तक्रार IT कडे आणि cybercrime.gov.in वर करा."
      },
      otp_real: {
        title: "तुम्ही आत्ताच सुरू केलेल्या पेमेंटचा OTP",
        ctx: "तुम्ही आत्ताच पॅकेजिंग व्हेंडरला ₹2,500 चे UPI पेमेंट सुरू केले आहे. हा SMS येतो.",
        who: "",
        subject: "",
        text: "[[ok|तुम्ही आत्ताच सुरू केलेल्या Sunrise Packaging ला ₹2,500 च्या UPI पेमेंटसाठी तुमचा OTP 482913 आहे.]] 10 मिनिटे वैध. [[ok|हा OTP कोणालाही, अगदी बँकेलाही सांगू नका.]] - NovaBank",
        why: "हे पेमेंट तुम्ही स्वतः क्षणापूर्वी सुरू केले, रक्कम आणि घेणारा जुळतात, आणि मेसेज कोड कोणाला सांगू नका असे सांगतो. खरा OTP फक्त तुम्ही स्वतः मागितलेल्या कृतीसाठी असतो, आणि बँक तो कोणाला सांगायला कधीच सांगत नाही.",
        todo: "OTP फक्त तुम्ही वापरत असलेल्या ॲपमध्ये टाइप करा. तुम्ही काहीही सुरू केलेले नसताना OTP आला, तर कोणी तुमचे खाते वापरण्याचा प्रयत्न करत आहे: तो सांगू नका, आणि कार्डवर छापलेल्या नंबरवर बँकेला फोन करा."
      },
      digital_arrest: {
        title: "\"CBI अधिकाऱ्याचा\" व्हिडिओ कॉल",
        ctx: "अनोळखी नंबरवरून व्हिडिओ कॉल. कॉलरने गणवेश घातला आहे आणि मागे झेंडा असलेल्या ऑफिसमध्ये बसला आहे.",
        who: "\"CBI अधिकारी वर्मा\"",
        subject: "",
        text: "\"[[threat|तुमच्या नावावर ड्रग्ज आणि 6 पासपोर्ट असलेले पार्सल बुक झाले आहे. तुमच्यावर केस दाखल झाली आहे.]] [[urgent|या व्हिडिओ कॉलवरच राहा, कॉल कट करू नका]], आणि [[secret|कोणालाही सांगू नका, कुटुंबालाही नाही, त्यांच्यावरही नजर आहे]]. [[money|तपासणीसाठी ₹3,50,000 या RBI व्हेरिफिकेशन खात्यात ट्रान्सफर करा]]; तपासानंतर परत मिळतील.\"",
        why: "हे \"डिजिटल अरेस्ट\" आहे. कोणतेही पोलीस, CBI किंवा कोर्ट व्हिडिओ कॉलवर कोणालाही अटक करत नाही, आणि कोणतीही यंत्रणा \"व्हेरिफिकेशन खात्यात\" पैसे पाठवायला सांगत नाही. गणवेश, ऑफिसची पार्श्वभूमी आणि ओळखपत्र सगळे बनावट आहे. गुप्तता आणि कॉलवर धरून ठेवणे तुम्हाला विचार करू देत नाही.",
        todo: "लगेच फोन ठेवा. खरे अधिकारी WhatsApp वर फोन करत नाहीत. 1930 वर फोन करा किंवा cybercrime.gov.in वर तक्रार करा, आणि लगेच सहकारी किंवा कुटुंबातील कोणाला सांगा."
      },
      courier: {
        title: "कॉल: तुमचे पार्सल कस्टम्समध्ये अडकले आहे",
        ctx: "आधी रेकॉर्ड केलेला आवाज, मग एक माणूस. तुम्ही परदेशातून काहीही मागवलेले नाही.",
        who: "\"SpeedParcel ग्राहक सेवा\"",
        subject: "",
        text: "\"नमस्कार, मी SpeedParcel च्या कस्टम्स विभागातून बोलतोय. [[threat|तुमच्या नावाचे पार्सल बेकायदेशीर वस्तूंमुळे कस्टम्समध्ये अडवले आहे.]] पोलीस केस टाळायची असेल तर अधिकाऱ्याशी बोलण्यासाठी [[urgent|आत्ता 1 दाबा]], किंवा आम्ही पाठवू त्या लिंकवर [[money|₹2,999 क्लिअरन्स फी भरा]].\"",
        why: "कुरिअर कंपन्या बेकायदेशीर वस्तूंबद्दल फोन करत नाहीत, आणि कस्टम्स फोनवर फी घेत नाही. 1 दाबल्यावर तुम्ही बनावट \"अधिकाऱ्याशी\" जोडले जाता, जो मग डिजिटल अरेस्ट किंवा पेमेंटची मागणी करतो.",
        todo: "कॉल कट करा. खरंच काही मागवले असेल तर कुरिअरच्या अधिकृत वेबसाइटवर ट्रॅकिंग नंबर तपासा. तो नंबर संचार साथी (चक्षु) पोर्टलवर नोंदवा."
      },
      task_job: {
        title: "Telegram नोकरी: हॉटेलना रेटिंग देऊन रोज ₹8,000",
        ctx: "मागच्या आठवड्यात तुम्ही ऑनलाइन नोकरीसाठी अर्ज केल्यानंतर आलेला Telegram मेसेज.",
        who: "HR प्रिया - ऑनलाइन जॉब्स",
        subject: "",
        text: "अभिनंदन, तुमची निवड झाली आहे! [[prize|ऑनलाइन हॉटेलना रेटिंग देऊन रोज ₹3,000 ते ₹8,000 कमवा]], फक्त 20 मिनिटांचे काम. पहिली 3 कामे मोफत. प्रीमियम कामांसाठी [[money|₹5,000 जमा करा आणि एका तासात ₹7,500 परत मिळवा]]. [[urgent|आज फक्त 4 जागा उरल्या!]]",
        why: "हा टास्क स्कॅम आहे. विश्वास बसावा म्हणून सुरुवातीची छोटी पेमेंट खरी असतात. मग प्रीमियम कामांसाठी तुम्ही \"जमा\" करता आणि पैसे कधीच परत येत नाहीत. कोणतीही खरी नोकरी क्लिक करण्याचे पैसे देत नाही, आणि कोणताही मालक पैसे जमा करायला सांगत नाही.",
        todo: "काहीही जमा करू नका. खाते ब्लॉक करून रिपोर्ट करा. पैसे आधीच भरले असतील तर लगेच 1930 वर फोन करा; पहिला तास सर्वात महत्त्वाचा."
      },
      vendor_real: {
        title: "ओळखीच्या व्हेंडरकडून पेमेंटची आठवण",
        ctx: "तुम्ही दर महिन्याला पैसे देता त्या पॅकेजिंग व्हेंडरकडून, त्यांच्या नेहमीच्या पत्त्यावरून ईमेल.",
        who: "Sunrise Packaging बिलिंग",
        subject: "पेमेंट आठवण - इनव्हॉइस SP/26-27/0431, देय 10 ऑक्टोबर",
        text: "प्रिय मेरिडियन टेक्सटाइल्स टीम, ₹86,000 चे इनव्हॉइस SP/26-27/0431 10 ऑक्टोबरला देय आहे, याची ही नम्र आठवण. [[ok|आमचे बँक तपशील बदललेले नाहीत आणि तुमच्याकडे असलेल्या इनव्हॉइसवर छापलेले आहेत.]] [[ok|आमचे बँक खाते बदलण्यास सांगणारा कोणताही ईमेल आला तर पैसे देण्यापूर्वी तुमच्या रेकॉर्डमधील नंबरवर आमच्या ऑफिसला फोन करा.]] धन्यवाद.",
        why: "ओळखीच्या व्हेंडरच्या पत्त्यावरून नेहमीची आठवण, नवे बँक तपशील नाहीत, धमकी नाही, आणि काही वेगळे वाटले तर व्हेंडर स्वतः फोनवर खात्री करायला सांगतो. खरा भागीदार असाच वागतो.",
        todo: "तुमच्या रेकॉर्डमधील खात्यात नेहमीच्या पद्धतीने पैसे द्या. बदलाची कोणतीही विनंती ओळखीच्या फोन नंबरवर पक्की करा."
      },
      deepfake: {
        title: "MD चा आवाज तातडीचे ट्रान्सफर मागतो",
        ctx: "अनोळखी नंबरवरून फोन. आवाज अगदी तुमच्या MD सारखा, मागे विमानतळाचा गोंगाट.",
        who: "\"राजेश सर\" (MD चा आवाज)",
        subject: "",
        text: "\"हॅलो, मीच बोलतोय, विमानतळावर आहे, गोंगाट ऐकू येतोय ना. [[urgent|आत्ताच्या आत्ता ₹2,00,000 ट्रान्सफर कर]] दुबई ऑर्डरसाठी एका नव्या सप्लायरला. [[newacct|खाते नंबर मी WhatsApp करतो.]] [[secret|मला परत फोन करू नकोस, फोन फ्लाइट मोडवर जातोय, मी उतरण्याआधी करून टाक.]]\"",
        why: "AI एखाद्या भाषणाच्या किंवा व्हिडिओच्या 30 सेकंदांच्या क्लिपवरून कोणाचाही आवाज नक्कल करू शकते. नक्कल केलेला आवाज + नवा खाते नंबर + \"परत फोन करू नको\" म्हणजे डीपफेक स्कॅम. मागचा गोंगाट मुद्दाम टाकलेला असतो.",
        todo: "परत फोन करतो असे सांगा, मग सेव्ह केलेल्या नंबरवर MD ला फोन करा किंवा दुसऱ्या वरिष्ठ व्यक्तीकडे खात्री करा. फोनवरील तातडीच्या विनंतीसाठी टीममध्ये सांकेतिक शब्द ठरवा. नेहमीच्या मंजुरीशिवाय ट्रान्सफर नाही."
      },
      qr_receive: {
        title: "पैसे \"मिळवण्यासाठी\" खरेदीदार QR कोड पाठवतो",
        ctx: "तुम्ही एका क्लासिफाइड साइटवर 12 जुन्या ऑफिस खुर्च्यांची जाहिरात दिली. एक खरेदीदार WhatsApp वर लिहितो.",
        who: "ऑफिस खुर्च्यांचा खरेदीदार",
        subject: "",
        text: "हाय, ₹18,000 ला 12 जुन्या ऑफिस खुर्च्यांची तुमची जाहिरात पाहिली. मी पूर्ण रक्कम आत्ताच देतो. [[upi|मी QR कोड पाठवला आहे: पैसे मिळवण्यासाठी तो स्कॅन करून तुमचा UPI PIN टाका.]] [[odd|मी बाहेर पोस्टिंग असलेला आर्मी ऑफिसर आहे, म्हणून माझा मित्र खुर्च्या घेऊन जाईल.]] [[urgent|कृपया पुढच्या 5 मिनिटांत करा, माझे नेटवर्क कमकुवत आहे.]]",
        why: "पैसे मिळवण्यासाठी तुम्ही कधीही QR स्कॅन करत नाही किंवा PIN टाकत नाही. स्कॅन करून PIN टाकला की तुम्ही समोरच्याला पैसे देता. \"आर्मी ऑफिसर\" ची कहाणी आणि घाई या क्लासिफाइड साइटवरील नेहमीच्या युक्त्या आहेत.",
        todo: "नकार द्या. खरेदीदाराला तुमच्या UPI ID वर पैसे पाठवायला सांगा; पैसे मिळवण्यासाठी तुम्हाला काहीच करावे लागत नाही. ॲपमध्ये नंबर रिपोर्ट करा."
      },
      fake_care: {
        title: "सर्चमध्ये सापडलेला कस्टमर केअर नंबर",
        ctx: "रिफंड आला नाही. तुम्ही ऑनलाइन बँकेचा कस्टमर केअर शोधला आणि दिसलेल्या पहिल्या नंबरवर फोन केला.",
        who: "\"NovaBank कस्टमर केअर\"",
        subject: "",
        text: "\"NovaBank कस्टमर केअरला फोन केल्याबद्दल धन्यवाद. ₹3,200 च्या रिफंडसाठी तुमची पडताळणी करावी लागेल. [[otp|कृपया तुमचा 16 अंकी कार्ड नंबर, एक्सपायरी तारीख आणि आत्ता येणारा OTP सांगा.]] [[remote|मी पाठवतो ते Quick Support ॲपही इन्स्टॉल करा म्हणजे मी लवकर काम करू शकेन.]]\"",
        why: "तुम्ही सर्च रिझल्टमध्ये किंवा बनावट वेबसाइटवर ठेवलेल्या बनावट नंबरवर फोन केला. कोणतीही बँक पूर्ण कार्ड नंबर, एक्सपायरी, CVV किंवा OTP मागत नाही, आणि रिमोट-कंट्रोल ॲप इन्स्टॉल करायला कधीच सांगत नाही.",
        todo: "कॉल कट करा. फक्त कार्डच्या मागे छापलेला किंवा अधिकृत ॲपमधील नंबर वापरा. कॉलरने सांगितलेले ॲप कधीही इन्स्टॉल करू नका. काही सांगितले असेल तर लगेच ॲपमध्ये कार्ड ब्लॉक करा आणि 1930 वर फोन करा."
      },
      hr_real: {
        title: "HR कडून दिवाळी सुट्ट्यांची यादी",
        ctx: "कंपनीच्या HR पत्त्यावरून सर्व कर्मचाऱ्यांना ईमेल.",
        who: "HR विभाग",
        subject: "दिवाळी आठवड्यातील सुट्ट्यांची यादी",
        text: "सर्वांना नमस्कार, दिवाळीसाठी 7 ते 9 नोव्हेंबर ऑफिस बंद राहील. [[ok|सुट्ट्यांची पूर्ण यादी इंट्रानेटच्या HR पानावर आहे]], रजेसाठी तुम्ही वापरता तेच पान. [[ok|तुम्हाला काहीही करायची गरज नाही.]] सर्वांना आनंदी आणि सुरक्षित दिवाळीच्या शुभेच्छा. - HR टीम",
        why: "कंपनीच्या स्वतःच्या HR पत्त्यावरून पाठवलेला, फक्त माहिती, बाहेरच्या साइटची लिंक नाही, उघडायला अटॅचमेंट नाही आणि भरायला काही नाही. खऱ्या सूचनांना घाईची गरज नसते.",
        todo: "काही करायचे नाही. सुट्टी किंवा बोनसबद्दलचा ईमेल लॉगिन करायला किंवा बँक तपशील भरायला सांगत असेल, तर ती धोक्याची खूण समजा आणि HR ला प्रत्यक्ष विचारा."
      },
      screen_share: {
        title: "\"UPI हेल्पलाइनला\" तुमची स्क्रीन पाहायची आहे",
        ctx: "UPI पेमेंट फेल झाल्यावर तुम्ही सोशल मीडियावर तक्रार केली, आणि काही मिनिटांत फोन आला.",
        who: "\"UPI हेल्पलाइन\"",
        subject: "",
        text: "\"सर, तुमचे ₹1,500 चे UPI पेमेंट अडकले आहे. मी 2 मिनिटांत ठीक करतो. [[remote|मी पाठवलेल्या लिंकवरून स्क्रीन-शेअरिंग ॲप इन्स्टॉल करा आणि स्क्रीनवरचा 9 अंकी कोड मला वाचून दाखवा.]] बँकिंग ॲप उघडे ठेवा, मला फक्त पाहायचे आहे. [[otp|OTP आला की कॉल कट करू नका, मी मार्गदर्शन करेन.]]\"",
        why: "रिमोट-ॲक्सेस आणि स्क्रीन-शेअरिंग ॲपमुळे कॉलर तुमचा फोन पाहू आणि चालवू शकतो; 9 अंकी कोड त्याला पूर्ण ॲक्सेस देतो. OTP सोबत तो काही मिनिटांत खाते रिकामे करू शकतो. खऱ्या हेल्पलाइन कधीही तुमची स्क्रीन पाहायला मागत नाहीत.",
        todo: "कॉल कट करा आणि इन्स्टॉल केलेले ॲप काढून टाका. तक्रार फक्त अधिकृत UPI किंवा बँक ॲपमध्येच करा. पैसे गेले असतील तर लगेच 1930 वर आणि बँकेला फोन करा."
      },
      invoice_exe: {
        title: ".exe ने संपणारी इनव्हॉइस अटॅचमेंट",
        ctx: "ज्या कंपनीकडून खरेदी केल्याचे आठवत नाही, तिच्याकडून अकाउंट्स मेलबॉक्समध्ये ईमेल.",
        who: "Global Trade Supplies",
        subject: "इनव्हॉइस जोडले आहे - कृपया प्रक्रिया करा",
        text: "[[odd|प्रिय महोदय,]] मागच्या आठवड्यात दिलेल्या मालाचे इनव्हॉइस सोबत जोडले आहे. [[attach|अटॅचमेंट: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|कृपया आजच पेमेंट करा]] आणि कळवा. [[odd|आपला, अकाउंट्स विभाग.]]",
        why: ".exe ने संपणारी फाइल PDF नसून प्रोग्राम असते; नावातील \".pdf\" फक्त वेष आहे. ती उघडल्यावर मालवेअर किंवा रॅन्समवेअर इन्स्टॉल होते जे ऑफिसमधील प्रत्येक कॉम्प्युटर लॉक करू शकते. अस्पष्ट संबोधन आणि कंपनीची सही नसणे या आणखी धोक्याच्या खुणा आहेत.",
        todo: "अटॅचमेंट उघडू नका. ईमेलची IT कडे तक्रार करा. रेकॉर्ड तपासा: तुम्ही खरंच या कंपनीकडून खरेदी केली होती का? अशा युक्त्या दिसाव्यात म्हणून ऑफिसच्या कॉम्प्युटरवर \"फाइल एक्सटेंशन दाखवा\" चालू करा."
      },
      echallan: {
        title: "ॲप लिंकसह ट्रॅफिक ई-चलान SMS",
        ctx: "संध्याकाळी ऑफिसच्या ड्रायव्हरच्या फोनवर SMS.",
        who: "",
        subject: "",
        text: "ट्रॅफिक ई-चलान: तुमच्या वाहन KA-05-XX-1234 ने 1 ऑक्टोबरला सिग्नल तोडल्याची नोंद आहे. [[money|दंड ₹1,000.]] दुप्पट दंड आणि कोर्ट समन्स टाळण्यासाठी [[urgent|24 तासांत भरा]]. [[link|अधिकृत चलान ॲप डाउनलोड करा: echallan-pay.example.net/app.apk]]",
        why: "खरे ई-चलान मेसेज खासगी मोबाइल नंबरवरून नव्हे तर सरकारी सेंडर ID वरून येतात, आणि कधीही .apk फाइल डाउनलोड करायला सांगत नाहीत. ती APK तुमचे SMS आणि OTP वाचणारे धोकादायक ॲप आहे.",
        todo: "मेसेज डिलीट करा. चलान फक्त अधिकृत सरकारी ई-चलान वेबसाइटवर किंवा राज्य पोलीस ॲपमध्येच तपासा. तो नंबर संचार साथी (चक्षु) वर नोंदवा."
      },
      parcel_real: {
        title: "अपेक्षित पार्सलची डिलिव्हरी माहिती",
        ctx: "मागच्या आठवड्यात तुम्ही पॅकेजिंग साहित्य मागवले होते. हा SMS येतो.",
        who: "",
        subject: "",
        text: "SpeedParcel: Sunrise Packaging कडून तुमचे शिपमेंट SP48213 [[ok|आज दुपारी 2 ते 5 दरम्यान पोहोचेल.]] [[ok|कोणतेही पेमेंट बाकी नाही.]] [[ok|ट्रॅक करण्यासाठी आमच्या वेबसाइट किंवा ॲपवर शिपमेंट नंबर वापरा.]]",
        why: "नोंदणीकृत सेंडर ID वरून (खासगी नंबर नाही) आलेला, अपेक्षित पार्सलशी जुळणारा, पैसे न मागणारा आणि टॅप करायला लिंक न देणारा. खरा डिलिव्हरी मेसेज फक्त माहिती देतो.",
        todo: "काही करायचे नाही. पार्सलचा मेसेज फी, लिंक किंवा ॲप मागत असेल तर थांबा आणि शिपमेंट नंबर वापरून अधिकृत वेबसाइटवर तपासा."
      },
      kyc: {
        title: "KYC संपली, खाते आज बंद होणार",
        ctx: "रात्री मालकाच्या फोनवर SMS.",
        who: "",
        subject: "",
        text: "प्रिय ग्राहक, तुमची KYC संपल्यामुळे [[threat|तुमचे NovaBank खाते आज बंद केले जाईल]]. [[link|novabank-kyc-update.example.net]] वर [[urgent|लगेच अपडेट करा]] किंवा [[sender|आमच्या अधिकाऱ्याला 94XXX XXX51 वर फोन करा]].",
        why: "बँका कधीही खासगी मोबाइल नंबरवरून KYC लिंक पाठवत नाहीत आणि काही तासांत खाते बंद करत नाहीत. लिंक बनावट बँक पान उघडते जे तुमचा लॉगिन आणि OTP चोरते; \"अधिकारी\" ॲप इन्स्टॉल करायला सांगतो.",
        todo: "लिंक टॅप करू नका, फोनही करू नका. KYC खरंच बाकी असेल तर बँकेचे स्वतःचे ॲप किंवा शाखा सांगेल. SMS ची संचार साथी (चक्षु) वर तक्रार करा."
      },
      sim_swap: {
        title: "कॉल: तुमचे SIM बंद होणार",
        ctx: "ऑफिस मॅनेजरला फोन, जी हा नंबर बँकेच्या OTP साठी वापरते.",
        who: "\"टेलिकॉम कंपनीचा अधिकारी\"",
        subject: "",
        text: "\"मॅडम, मी तुमच्या मोबाइल नेटवर्ककडून बोलतोय. 5G अपग्रेड बाकी असल्याने [[threat|तुमचे SIM 24 तासांत बंद होईल]]. [[otp|अपग्रेडसाठी तुमच्या SIM कार्डवरचा 20 अंकी नंबर वाचून दाखवा आणि येणाऱ्या SMS नंतर 1 दाबा.]] [[urgent|ही ऑफर आजच संपते.]]\"",
        why: "हा SIM-स्वॅपचा प्रयत्न आहे. 20 अंकी SIM नंबर आणि तुमच्या \"1\" वरून फसवणूक करणारा तुमचा नंबर स्वतःच्या SIM वर चालू करतो. तुमचा फोन बंद पडतो आणि बँकिंग व UPI चे प्रत्येक OTP त्याला जातात.",
        todo: "कॉल कट करा. टेलिकॉम कंपन्या 5G अपग्रेडसाठी कधीच फोन करत नाहीत. फोनचे नेटवर्क अचानक बराच वेळ गेले तर आधी बँकेला, मग ऑपरेटरला फोन करा. तुमच्या नावावरची SIM संचार साथीवर तपासा."
      },
      mfa: {
        title: "मध्यरात्रीपासून सातवी लॉगिन मंजुरी विनंती",
        ctx: "रात्री ऑफिस लॉगिन ॲपवरून साइन-इन मंजुरीच्या विनंत्यांनी फोन सतत वाजतोय. मग एक कॉल येतो.",
        who: "SecureLogin ॲप",
        subject: "",
        text: "[[otp|साइन-इन मंजूर करायचे? कोणीतरी नव्या डिव्हाइसवरून तुमच्या ऑफिस खात्यात साइन-इन करत आहे. पुढे जाण्यासाठी APPROVE टॅप करा.]] [[odd|(मध्यरात्रीपासूनची ही 7 वी विनंती आहे.)]] थोड्याच वेळात एक कॉलर म्हणतो: \"[[urgent|मी IT मधून बोलतोय, आम्ही सर्व्हर दुरुस्त करतोय. अलर्ट थांबावेत म्हणून फक्त विनंती मंजूर करा.]]\"",
        why: "याला \"MFA थकवा\" म्हणतात. हल्लेखोराकडे तुमचा पासवर्ड आधीच आहे आणि तो विनंत्यांचा भडिमार करतोय, या आशेने की त्रासून तुम्ही Approve दाबाल. \"IT\" चा कॉल हल्ल्याचाच भाग आहे. खरी IT तुम्ही सुरू न केलेले लॉगिन मंजूर करायला कधीच सांगत नाही.",
        todo: "प्रत्येक वेळी Deny दाबा. विश्वासू डिव्हाइसवरून लगेच पासवर्ड बदला आणि IT ला सांगा. वारंवार विनंत्या म्हणजे तुमचा पासवर्ड आधीच लीक झाला आहे."
      },
      gst_real: {
        title: "तुमच्या CA कडून मासिक GST आठवण",
        ctx: "तुमच्या चार्टर्ड अकाउंटंटच्या सेव्ह केलेल्या नंबरवरून WhatsApp मेसेज.",
        who: "मेहता अँड कं. (आमचे CA)",
        subject: "",
        text: "सुप्रभात. आठवण: सप्टेंबरचे GSTR-3B 20 ऑक्टोबरला देय आहे. [[ok|कृपया विक्री आणि खरेदीच्या शीट दर महिन्याप्रमाणे त्याच शेअर्ड फोल्डरमध्ये अपलोड करा.]] [[ok|सध्या तुमच्याकडून कोणतेही पेमेंट नको]]; फायलिंगनंतर मी चलानचे तपशील पाठवेन, आणि आपल्या नेहमीच्या कॉलवर पक्के करू.",
        why: "ओळखीचे CA, सेव्ह केलेला नंबर, नेहमीची मासिक प्रक्रिया, नवा खाते नंबर नाही, लिंक नाही आणि खऱ्या देय तारखेपलीकडे घाई नाही. खात्री तुमच्या नेहमीच्या कॉलवर होते.",
        todo: "नेहमीची प्रक्रिया पाळा. एखाद्या दिवशी \"CA\" ने नवे बँक खाते पाठवले किंवा लिंकवरून पैसे भरायला सांगितले, तर आधी ओळखीच्या नंबरवर CA ऑफिसला फोन करा."
      },
      lookalike: {
        title: "हुबेहूब दिसणाऱ्या डोमेनवर पगार स्लिप",
        ctx: "सुधारित पगार स्लिपबद्दल ईमेल. तुमच्या कंपनीचे खरे डोमेन meridiantextiles.example.com आहे.",
        who: "पेरोल टीम",
        subject: "तुमची सुधारित पगार स्लिप तयार आहे",
        text: "प्रिय कर्मचारी, ऑक्टोबरपासून तुमची पगार रचना बदलली आहे. [[link|नवी स्लिप पाहण्यासाठी meridian-textiles-portal.example.com वर ऑफिस पासवर्डने लॉगिन करा.]] [[urgent|लिंक 12 तासांत संपेल.]] [[sender|payroll@meridian-textiles.example.com वरून पाठवले]]",
        why: "कंपनीचे खरे डोमेन meridiantextiles.example.com आहे; ईमेल meridian-textiles (हायफनसह) वापरतो, हे हुबेहूब दिसणारे डोमेन आहे. लिंक कॉपी केलेल्या लॉगिन पानावर नेते जे तुमचा ऑफिस पासवर्ड चोरते. पगार स्लिप तुम्ही नेहमी वापरता त्या HR पोर्टलवरच असते.",
        todo: "क्लिक करू नका. पत्ता टाइप करून किंवा बुकमार्कवरून HR पोर्टल स्वतः उघडा. ईमेलची IT कडे तक्रार करा; फॉरवर्ड केल्याने ते सर्वांसाठी बनावट डोमेन ब्लॉक करू शकतात."
      },
      usb: {
        title: "पार्किंगमध्ये सापडलेला पेन ड्राइव्ह",
        ctx: "सोमवारी सकाळी, ऑफिसच्या प्रवेशद्वाराजवळ.",
        who: "ऑफिस पार्किंगमध्ये सापडलेला पेन ड्राइव्ह",
        subject: "",
        text: "प्रवेशद्वाराजवळ एक पेन ड्राइव्ह पडला आहे, त्यावर लेबल: [[prize|\"पगारवाढ 2026 - गोपनीय - फक्त व्यवस्थापनासाठी\"]]. एक सहकारी म्हणतो: \"[[remote|रिसेप्शनच्या PC ला लावून पाहू कोणाचा आहे.]]\"",
        why: "याला \"USB ड्रॉप\" म्हणतात. हल्लेखोर मोहक लेबल लावलेले पेन ड्राइव्ह टाकून जातात; एक लावताच लपलेले सॉफ्टवेअर स्वतः इन्स्टॉल होऊन ऑफिस नेटवर्कभर पसरू शकते. कुतूहल हेच हल्ल्याचे शस्त्र आहे.",
        todo: "कुठेही लावू नका. पाकिटात घालून IT किंवा सुरक्षा विभागाकडे द्या. कंपन्यांनी ऑटो-रन बंद करून अनोळखी USB डिव्हाइस ब्लॉक करावेत."
      },
      wifi: {
        title: "विमानतळाचे मोफत Wi-Fi ईमेल पासवर्ड मागते",
        ctx: "फ्लाइटची वाट पाहताना, दोन व्हेंडर पेमेंट मंजूर करण्यासाठी तुम्ही मोफत नेटवर्कला जोडता.",
        who: "विमानतळावरील मोफत Wi-Fi लॉगिन स्क्रीन",
        subject: "",
        text: "नेटवर्क: Airport_Free_WiFi_5G (पासवर्ड नाही). [[otp|पुढे जाण्यासाठी तुमचा ईमेल पत्ता आणि ईमेल पासवर्ड टाकून साइन-इन करा.]] मग फ्लाइटची वाट पाहताना तुम्ही [[data|कंपनीच्या बँकिंग पोर्टलवर दोन व्हेंडर पेमेंट मंजूर करायचे]] ठरवता.",
        why: "अधिकृत वाटणाऱ्या नावाचा हॉटस्पॉट कोणीही बनवू शकतो. बनावट नेटवर्कवर हल्लेखोर तुम्ही काय टाइप करता ते पाहू शकतो, आणि ईमेल पासवर्ड मागणारे लॉगिन पान माहिती चोरत असते. सार्वजनिक Wi-Fi वर बँकिंग धोकादायक आहे.",
        todo: "कामासाठी आणि बँकिंगसाठी स्वतःचा मोबाइल डेटा किंवा कंपनीचा VPN वापरा. Wi-Fi लॉगिन पानावर ऑफिस किंवा ईमेल पासवर्ड कधीही टाइप करू नका. उघड्या नेटवर्कशी आपोआप जोडणी बंद करा."
      },
      upi_real: {
        title: "पेमेंट मिळाल्याचे नोटिफिकेशन",
        ctx: "तुम्ही काउंटरवर असताना तुमच्या स्वतःच्या UPI ॲपचे नोटिफिकेशन.",
        who: "UPI ॲप",
        subject: "",
        text: "[[ok|Anita Traders कडून ₹2,500 मिळाले]] तुमच्या 4471 ने संपणाऱ्या चालू खात्यात. [[ok|कोणतीही कृती आवश्यक नाही.]] व्यवहार ID 628104...",
        why: "आत येणाऱ्या पैशांसाठी कधीही PIN, OTP किंवा स्कॅन लागत नाही. नोटिफिकेशन तुमच्या स्वतःच्या ॲपचे आहे, पैसे देणाऱ्याचे नाव सांगते आणि तुमच्याकडून काहीच मागत नाही. याची तुलना \"कलेक्ट रिक्वेस्ट\" किंवा स्कॅन करायला सांगितलेल्या QR शी करा: ते पैसे बाहेर नेतात.",
        todo: "काही करायचे नाही. रक्कम इनव्हॉइसशी जुळवा. \"पेमेंट मिळाले\" असा मेसेज कधी मंजुरी, PIN किंवा स्कॅन मागत असेल, तर तो पैसे देत नसून घेत आहे."
      },
      dpdp: {
        title: "सहकाऱ्याला ग्राहक यादी WhatsApp वर हवी आहे",
        ctx: "संध्याकाळी सेल्समधील सहकाऱ्याच्या नंबरवरून WhatsApp मेसेज.",
        who: "समीर (सेल्स सहकारी)",
        subject: "",
        text: "भाऊ, आज मी घरून काम करतोय. [[data|फोन नंबर आणि आधार प्रतींसह पूर्ण ग्राहक यादी एक्सपोर्ट करून मला याच WhatsApp वर पाठव]], नंतर डिलीट करतो. [[urgent|कॅम्पेनसाठी 10 मिनिटांत हवी आहे.]] [[secret|मॅनेजरला सांगायची गरज नाही, छोटी गोष्ट आहे.]]",
        why: "ग्राहकांचे फोन नंबर आणि आधार प्रती भारताच्या DPDP कायद्याने संरक्षित वैयक्तिक डेटा आहेत. खासगी WhatsApp वर पाठवल्याने तो कंपनीच्या नियंत्रणाबाहेर जातो, आणि हे हॅक झालेले खाते किंवा तोतयेगिरीही असू शकते. \"मॅनेजरला सांगू नको\" कधीही चालत नाही.",
        todo: "नम्रपणे नाही म्हणा. ग्राहक डेटा फक्त कंपनीच्या मंजूर प्रणालीतून, मॅनेजरच्या मंजुरीने आणि आवश्यक तेवढीच माहिती शेअर करा. सहकाऱ्याचे खाते विचित्र वाटले तर त्यांना फोन करा."
      },
      otp_call: {
        title: "पेमेंट रद्द करायला \"फ्रॉड विभागाला\" OTP हवा",
        ctx: "फोनवर OTP SMS येत असतानाच आलेला कॉल.",
        who: "\"NovaBank फ्रॉड विभाग\"",
        subject: "",
        text: "\"सर, [[threat|तुमच्या कार्डवर आत्ता ₹49,999 चा व्यवहार होतोय.]] तो रद्द करण्यासाठी [[urgent|आम्हाला 60 सेकंदांत कृती करावी लागेल]]. [[otp|आत्ता तुमच्या फोनवर आलेला OTP सांगा, मी तो उलटवतो.]] [[secret|कृपया कॉल कट करू नका किंवा कोणाला फोन करू नका.]]\"",
        why: "\"आत्ता आलेला\" OTP हा स्कॅमरने तुमच्या कार्डने पैसे भरण्याच्या प्रयत्नासाठी आहे. तो वाचून दाखवला की पेमेंट पूर्ण होते. बँका काहीही रद्द करण्यासाठी OTP कधीच मागत नाहीत, आणि 60 सेकंदांची घबराट तुम्ही विचार करू नये म्हणून निर्माण केली जाते.",
        todo: "कॉल कट करा. बँक ॲप उघडून स्वतः कार्ड ब्लॉक करा, किंवा कार्डच्या मागच्या नंबरवर फोन करा. OTP कधीही कोणाला वाचून दाखवू नका. पैसे गेले असतील तर लगेच 1930 वर फोन करा."
      },
      hr_bonus: {
        title: "दिवाळी बोनस फॉर्म नेट-बँकिंग लॉगिन मागतो",
        ctx: "दिवाळीच्या आधी, HR सारख्या दिसणाऱ्या पत्त्यावरून सर्व कर्मचाऱ्यांना ईमेल.",
        who: "HR रिवॉर्ड्स टीम",
        subject: "दिवाळी बोनस ₹25,000 - तुमचे बँक खाते पक्के करा",
        text: "प्रिय सहकारी, ₹25,000 दिवाळी बोनस जाहीर करताना आनंद होतो. [[attach|जोडलेला फॉर्म (Bonus_Form.html) उघडा]] आणि बोनस थेट जमा व्हावा म्हणून [[otp|तुमचा नेट-बँकिंग यूजर ID आणि पासवर्ड टाका]]. [[urgent|आज संध्याकाळी 6 नंतर आलेले फॉर्म स्वीकारले जाणार नाहीत.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR कडे तुमचे पगार खाते आधीच आहे; कोणतीही कंपनी बोनससाठी नेट-बँकिंग लॉगिन मागत नाही. पाठवणारा हुबेहूब दिसणारा डोमेन आहे, HTML अटॅचमेंट बनावट बँक लॉगिन पान आहे, आणि त्याच दिवसाची मुदत दबाव वाढवते.",
        todo: "अटॅचमेंट उघडू नका, काहीही टाकू नका. HR ला प्रत्यक्ष किंवा इंट्रानेटवर विचारा. सहकारी सावध व्हावेत म्हणून ईमेलची IT कडे तक्रार करा."
      },
      electricity: {
        title: "आज रात्री ऑफिसची वीज कापली जाणार",
        ctx: "रात्री 8:35 वाजता दुकान मालकाच्या फोनवर SMS.",
        who: "",
        subject: "",
        text: "प्रिय ग्राहक, [[odd|मागील महिन्याचे बिल आमच्या सिस्टममध्ये अपडेट नाही]] म्हणून [[threat|तुमच्या ऑफिसचे वीज कनेक्शन आज रात्री 9:30 वाजता तोडले जाईल]]. कृपया आमच्या अधिकाऱ्याशी [[sender|93XXX XXX40]] [[urgent|लगेच]] संपर्क करा.",
        why: "वीज मंडळ खासगी मोबाइलवरून एका SMS नंतर रात्री वीज तोडत नाही. फोन केल्यावर \"अधिकारी\" ॲप इन्स्टॉल करायला किंवा लिंकवरून ₹10 भरायला सांगतो, आणि खरे लक्ष्य तुमचे बँक खाते असते.",
        todo: "फोन करू नका. बिल वीज मंडळाच्या अधिकृत ॲपमध्ये किंवा कार्यालयात तपासा. तो नंबर संचार साथी (चक्षु) वर नोंदवा."
      },
      wa_hijack: {
        title: "सहकारी 6 अंकी कोड फॉरवर्ड करायला सांगतो",
        ctx: "तुमच्या फोनवर कोडचा SMS आल्यानंतर लगेच, रात्री उशिरा सहकाऱ्याच्या सेव्ह केलेल्या नंबरवरून WhatsApp मेसेज.",
        who: "रोहन (सहकारी)",
        subject: "",
        text: "अरे, इतक्या रात्री त्रास देतोय, माफ कर. [[odd|WhatsApp मध्ये लॉगिन करताना चुकून तुझा नंबर टाकला आणि 6 अंकी कोड तुझ्या फोनवर गेला.]] [[otp|तो कोड मला फॉरवर्ड कर]], [[urgent|पटकन, नाहीतर माझे खाते लॉक होईल.]]",
        why: "आलेला कोड तुमच्या स्वतःच्या WhatsApp चा व्हेरिफिकेशन कोड आहे. ज्याला तो मिळेल तो तुमचे खाते ताब्यात घेतो आणि मग तुमच्या सगळ्या कॉन्टॅक्ट आणि ऑफिस ग्रुपना पैसे मागणारे मेसेज पाठवतो. हा मेसेजही सहकाऱ्याच्या आधीच हॅक झालेल्या खात्यातून आलेला असू शकतो.",
        todo: "व्हेरिफिकेशन कोड कधीही फॉरवर्ड करू नका. सहकाऱ्याला फोन करून त्याचे खाते हॅक झाल्याचे सांगा. WhatsApp सेटिंग्जमध्ये टू-स्टेप व्हेरिफिकेशन चालू करा."
      },
      invest_group: {
        title: "खात्रीच्या परताव्याचा स्टॉक-टिप्स ग्रुप",
        ctx: "न विचारता तुम्हाला एका WhatsApp ग्रुपमध्ये जोडले गेले.",
        who: "VIP Stock Tips - ग्रुप ॲडमिन",
        subject: "",
        text: "आमच्या प्रीमियम ग्रुपमध्ये स्वागत! [[prize|खात्रीच्या इनसाइडर टिप्समुळे आमच्या सदस्यांनी मागच्या महिन्यात 32% परतावा कमावला.]] आमचे ट्रेडिंग ॲप [[link|ॲप स्टोअरवरून नव्हे, या लिंकवरून]] डाउनलोड करा, आणि [[money|₹50,000 जमा करून सुरुवात करा]]. [[prize|सदस्यांनी टाकलेले नफ्याचे स्क्रीनशॉट पाहा!]] [[urgent|प्रवेश मध्यरात्री बंद होईल.]]",
        why: "कोणीही परताव्याची खात्री देऊ शकत नाही, आणि \"इनसाइडर टिप्स\" बेकायदेशीर आहेत. ॲप बनावट आहे: तुम्ही आणखी पैसे भरावेत म्हणून ते काल्पनिक नफा दाखवते, आणि पैसे काढू दिले जात नाहीत. स्क्रीनशॉट टाकणारे \"सदस्य\" स्कॅमरच असतात.",
        todo: "ग्रुप सोडा आणि रिपोर्ट करा. फक्त SEBI नोंदणीकृत ब्रोकर आणि अधिकृत ॲप स्टोअरमधील ॲपमधूनच गुंतवणूक करा. पैसे भरले असतील तर 1930 वर फोन करा आणि cybercrime.gov.in वर तक्रार करा."
      },
      bank_real: {
        title: "तुम्ही केलेल्या पेमेंटचा डेबिट अलर्ट",
        ctx: "तुमच्या अकाउंट्स टीमने आज पॅकेजिंग व्हेंडरला पैसे दिले. हा SMS येतो.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|Sunrise Packaging ला NEFT साठी 10 ऑक्टोबरला 4471 ने संपणाऱ्या खात्यातून ₹86,000 डेबिट]], संदर्भ N26101034. शिल्लक ₹3,42,118. [[ok|तुम्ही केले नसेल तर तुमच्या डेबिट कार्डच्या मागच्या नंबरवर फोन करा.]]",
        why: "हे तुमच्या अकाउंट्स टीमने आज केलेल्या पेमेंटशी जुळते, बँकेच्या सेंडर ID वरून आले आहे, SMS मध्ये लिंक किंवा नंबर नाही, आणि तुमच्या स्वतःच्या कार्डवरील नंबरकडे बोट दाखवते.",
        todo: "तुमच्या पेमेंट रेकॉर्डशी जुळवा. एखादा डेबिट अलर्ट तुम्ही केलेल्या पेमेंटशी जुळत नसेल, तर मेसेजमधील नव्हे तर कार्डवरील नंबरवर लगेच बँकेला फोन करा."
      }
    }
  },
  gu: {
    scenarios: {
      ceo_gift: {
        title: "નવા નંબર પરથી બોસને ગિફ્ટ કાર્ડ જોઈએ છે",
        ctx: "સવારે 9 વાગ્યે અકાઉન્ટ્સ એક્ઝિક્યુટિવને WhatsApp મેસેજ. પ્રોફાઇલ ફોટો કંપનીની વેબસાઇટ પરનો MD નો ફોટો છે.",
        who: "રાજેશ સર (નવો નંબર)",
        subject: "",
        text: "હાય, હું રાજેશ. [[sender|મારો જૂનો ફોન બગડી ગયો છે, હમણાં આ નંબર વાપરું છું.]] હું એક મોટા ક્લાયન્ટ સાથે મીટિંગમાં છું. [[money|₹5,000 નાં 10 ગિફ્ટ કાર્ડ ખરીદો]] અને કોડ મને [[urgent|30 મિનિટમાં]] મોકલો. [[secret|આ વિશે કોઈ સાથે વાત ન કરતા, ક્લાયન્ટ માટે સરપ્રાઇઝ છે.]]",
        why: "સ્કૅમર વેબસાઇટ પરથી MD નો ફોટો લઈને નવા નંબરથી લખે છે. સાચા બોસ ક્યારેય ગિફ્ટ-કાર્ડ કોડ કે ગુપ્તતા માંગતા નથી. નવો નંબર + ઉતાવળ + ગુપ્તતા એ જ ક્લાસિક \"CEO ફ્રોડ\" છે.",
        todo: "કંઈ ખરીદશો નહીં. બોસને ફોનમાં સેવ કરેલા નંબર પર ફોન કરો કે તેમની કેબિનમાં જાઓ. આખી ઑફિસ સાવધ રહે તે માટે IT કે મેનેજરને કહો."
      },
      it_real: {
        title: "IT તરફથી પાસવર્ડ નીતિની સૂચના",
        ctx: "કંપનીના પોતાના IT હેલ્પડેસ્ક તરફથી બધા કર્મચારીઓને ઈમેલ.",
        who: "IT હેલ્પડેસ્ક",
        subject: "15 ઑક્ટોબરથી પાસવર્ડ નીતિમાં ફેરફાર",
        text: "પ્રિય સહકર્મીઓ, 15 ઑક્ટોબરથી પાસવર્ડ ઓછામાં ઓછો 12 અક્ષરનો હોવો જોઈએ. [[ok|આજે તમારે કંઈ કરવાની જરૂર નથી.]] પાસવર્ડની મુદત પૂરી થાય ત્યારે તેને [[ok|તમે હંમેશાં વાપરો છો તે જ ઑફિસ પોર્ટલ પર બદલો]]. [[ok|IT ક્યારેય ઈમેલ, ફોન કે WhatsApp પર તમારો પાસવર્ડ નહીં માંગે.]] શંકા હોય તો બીજા માળે હેલ્પડેસ્ક પર આવો.",
        why: "મોકલનાર કંપનીનું પોતાનું IT સરનામું છે. ક્લિક કરવાની લિંક નથી, અટેચમેન્ટ નથી, સમયમર્યાદા નથી અને પાસવર્ડની માંગ નથી. સાચી સૂચનાઓ શું થશે તે કહે છે અને સામાન્ય પોર્ટલ તમને જાતે વાપરવા દે છે.",
        todo: "કંઈ તાકીદનું નથી. સૂચના સાચી છે કે નહીં તેની શંકા હોય તો હેલ્પડેસ્ક પર જાઓ કે પહેલેથી જાણીતા એક્સ્ટેન્શન નંબર પર ફોન કરો."
      },
      bec_vendor: {
        title: "વેન્ડર કહે છે બેંક ખાતું બદલાયું",
        ctx: "₹4,80,000 ના બાકી ઇન્વૉઇસ વિશે અકાઉન્ટ્સ ટીમને ઈમેલ.",
        who: "કાવેરી લૉજિસ્ટિક્સ અકાઉન્ટ્સ",
        subject: "તાકીદનું: ઇન્વૉઇસ KL/2026/0912 માટે નવી બેંક વિગતો",
        text: "આદરણીય સાહેબ/બહેન, [[newacct|ઑડિટ પછી અમારી કંપનીનું બેંક ખાતું બદલાયું છે. કૃપા કરી ₹4,80,000 નું બાકી ઇન્વૉઇસ નીચે આપેલા નવા ખાતામાં ચૂકવો.]] શિપમેન્ટમાં મોડું ન થાય તે માટે [[urgent|પેમેન્ટ આજે જ કરો]]. [[sender|કૃપા કરી ફક્ત આ જ ઈમેલ ID પર જવાબ આપો]], અમારા ઑફિસના ફોન રિપેરમાં છે.",
        why: "આ બિઝનેસ ઈમેલ કૉમ્પ્રોમાઇઝ (BEC) છે. ગુનેગારો વેન્ડરનો ઈમેલ હેક કે નકલ કરીને \"નવી બેંક વિગતો\" મોકલે છે. સરનામું સાચા વેન્ડરથી થોડું અલગ છે, ફોન \"બંધ\" છે જેથી તમે ખાતરી ન કરી શકો, અને બધું જ તાકીદનું છે.",
        todo: "ઈમેલના આધારે વેન્ડરની બેંક વિગતો ક્યારેય ન બદલો. જૂના રેકોર્ડ કે પરચેઝ ઑર્ડરના નંબર પર વેન્ડરને ફોન કરો, ઈમેલના નંબર પર ક્યારેય નહીં. દરેક બેંક વિગત ફેરફાર માટે બે લોકોની મંજૂરી રાખો."
      },
      gst_notice: {
        title: "અટેચમેન્ટ સાથે GST દંડની નોટિસ",
        ctx: "વહેલી સવારે અકાઉન્ટ્સ મેલબોક્સમાં આવેલો ઈમેલ.",
        who: "GST વિભાગ",
        subject: "કારણ દર્શાવો નોટિસ - દંડ ₹1,24,500 - કાર્યવાહી જરૂરી",
        text: "[[odd|પ્રિય કરદાતા,]] તમારા GST રિટર્નમાં તફાવત મળ્યો છે. ₹1,24,500 નો દંડ ભરવાનો બાકી છે. ન ભરો તો [[threat|તમારો GSTIN 48 કલાકમાં સસ્પેન્ડ થશે]]. કાનૂની કાર્યવાહીથી બચવા [[link|જોડેલી નોટિસ ખોલો અને સુરક્ષિત લિંકથી ભરો]]. [[attach|અટેચમેન્ટ: GST_Notice_2026.html]]",
        why: "સાચી GST નોટિસ સત્તાવાર GST પોર્ટલ પર તમારા ખાતામાં દેખાય છે અને તેના પર DIN (ડૉક્યુમેન્ટ આઇડેન્ટિફિકેશન નંબર) હોય છે. \"સુરક્ષિત લિંક\" વાળું HTML અટેચમેન્ટ નકલી લૉગિન પેજ છે જે તમારું GST લૉગિન કે પેમેન્ટ વિગતો ચોરે છે. મોકલનાર સત્તાવાર gov.in ડોમેન નથી.",
        todo: "અટેચમેન્ટ ખોલશો નહીં. સરનામું જાતે ટાઇપ કરીને સત્તાવાર GST પોર્ટલ પર લૉગિન કરો, કે તમારા CA ને તપાસવા કહો. ઈમેલની ફરિયાદ IT ને અને cybercrime.gov.in પર કરો."
      },
      otp_real: {
        title: "તમે હમણાં શરૂ કરેલા પેમેન્ટનો OTP",
        ctx: "તમે હમણાં જ પેકેજિંગ વેન્ડરને ₹2,500 નું UPI પેમેન્ટ શરૂ કર્યું છે. આ SMS આવે છે.",
        who: "",
        subject: "",
        text: "[[ok|તમે હમણાં શરૂ કરેલા Sunrise Packaging ને ₹2,500 ના UPI પેમેન્ટ માટે તમારો OTP 482913 છે.]] 10 મિનિટ માન્ય. [[ok|આ OTP કોઈને પણ, બેંકને પણ ન કહેશો.]] - NovaBank",
        why: "આ પેમેન્ટ તમે પોતે ક્ષણ પહેલાં શરૂ કર્યું, રકમ અને મેળવનાર મેળ ખાય છે, અને મેસેજ કોડ કોઈને ન કહેવાનું કહે છે. સાચો OTP ફક્ત તમે પોતે માંગેલી ક્રિયા માટે હોય છે, અને બેંક તેને કોઈને કહેવાનું ક્યારેય કહેતી નથી.",
        todo: "OTP ફક્ત તમે વાપરતા હો તે એપમાં જ ટાઇપ કરો. તમે કંઈ શરૂ ન કર્યું હોય અને OTP આવે, તો કોઈ તમારું ખાતું વાપરવાનો પ્રયત્ન કરે છે: તે ન કહેશો, અને કાર્ડ પર છાપેલા નંબર પર બેંકને ફોન કરો."
      },
      digital_arrest: {
        title: "\"CBI અધિકારી\" નો વીડિયો કૉલ",
        ctx: "અજાણ્યા નંબર પરથી વીડિયો કૉલ. કૉલરે યુનિફોર્મ પહેર્યો છે અને પાછળ ઝંડાવાળી ઑફિસમાં બેઠો છે.",
        who: "\"CBI અધિકારી વર્મા\"",
        subject: "",
        text: "\"[[threat|તમારા નામે ડ્રગ્સ અને 6 પાસપોર્ટ વાળું પાર્સલ બુક થયું છે. તમારી સામે કેસ નોંધાયો છે.]] [[urgent|આ વીડિયો કૉલ પર જ રહો, કૉલ કાપશો નહીં]], અને [[secret|કોઈને કહેશો નહીં, પરિવારને પણ નહીં, તેમના પર પણ નજર છે]]. [[money|તપાસ માટે ₹3,50,000 આ RBI વેરિફિકેશન ખાતામાં ટ્રાન્સફર કરો]]; તપાસ પછી પાછા મળશે.\"",
        why: "આ \"ડિજિટલ અરેસ્ટ\" છે. કોઈ પોલીસ, CBI કે કોર્ટ વીડિયો કૉલ પર કોઈની ધરપકડ કરતી નથી, અને કોઈ એજન્સી \"વેરિફિકેશન ખાતા\" માં પૈસા મોકલવાનું કહેતી નથી. યુનિફોર્મ, ઑફિસની પૃષ્ઠભૂમિ અને ઓળખપત્ર બધું નકલી છે. ગુપ્તતા અને કૉલ પર પકડી રાખવું તમને વિચારવા દેતું નથી.",
        todo: "તરત ફોન મૂકી દો. સાચા અધિકારીઓ WhatsApp પર ફોન કરતા નથી. 1930 પર ફોન કરો કે cybercrime.gov.in પર ફરિયાદ કરો, અને તરત કોઈ સહકર્મી કે પરિવારજનને કહો."
      },
      courier: {
        title: "કૉલ: તમારું પાર્સલ કસ્ટમ્સમાં અટક્યું છે",
        ctx: "પહેલાં રેકોર્ડ કરેલો અવાજ, પછી એક માણસ. તમે વિદેશથી કંઈ મંગાવ્યું નથી.",
        who: "\"SpeedParcel ગ્રાહક સેવા\"",
        subject: "",
        text: "\"નમસ્તે, હું SpeedParcel ના કસ્ટમ્સ વિભાગમાંથી બોલું છું. [[threat|તમારા નામનું પાર્સલ ગેરકાયદે વસ્તુઓને કારણે કસ્ટમ્સમાં રોકાયું છે.]] પોલીસ કેસથી બચવા અધિકારી સાથે વાત કરવા [[urgent|હમણાં 1 દબાવો]], કે અમે મોકલીએ તે લિંક પર [[money|₹2,999 ક્લિયરન્સ ફી ભરો]].\"",
        why: "કુરિયર કંપનીઓ ગેરકાયદે વસ્તુઓ વિશે ફોન કરતી નથી, અને કસ્ટમ્સ ફોન પર ફી લેતું નથી. 1 દબાવતાં તમે નકલી \"અધિકારી\" સાથે જોડાઓ છો, જે પછી ડિજિટલ અરેસ્ટ કે પેમેન્ટની માંગ કરે છે.",
        todo: "કૉલ કાપો. ખરેખર કંઈ મંગાવ્યું હોય તો કુરિયરની સત્તાવાર વેબસાઇટ પર ટ્રેકિંગ નંબર તપાસો. એ નંબરની સંચાર સાથી (ચક્ષુ) પોર્ટલ પર ફરિયાદ કરો."
      },
      task_job: {
        title: "Telegram નોકરી: હોટેલને રેટિંગ આપી રોજ ₹8,000",
        ctx: "ગયા અઠવાડિયે તમે ઑનલાઇન નોકરી માટે અરજી કરી પછી આવેલો Telegram મેસેજ.",
        who: "HR પ્રિયા - ઑનલાઇન જૉબ્સ",
        subject: "",
        text: "અભિનંદન, તમારી પસંદગી થઈ છે! [[prize|ઑનલાઇન હોટેલને રેટિંગ આપી રોજ ₹3,000 થી ₹8,000 કમાઓ]], ફક્ત 20 મિનિટનું કામ. પહેલાં 3 કામ મફત. પ્રીમિયમ કામ માટે [[money|₹5,000 જમા કરો અને એક કલાકમાં ₹7,500 પાછા મેળવો]]. [[urgent|આજે ફક્ત 4 જગ્યા બાકી!]]",
        why: "આ ટાસ્ક સ્કૅમ છે. વિશ્વાસ જીતવા શરૂઆતનાં નાનાં પેમેન્ટ સાચાં હોય છે. પછી પ્રીમિયમ કામ માટે તમે \"જમા\" કરો અને પૈસા ક્યારેય પાછા આવતા નથી. કોઈ સાચી નોકરી ક્લિક કરવાના પૈસા આપતી નથી, અને કોઈ નોકરીદાતા પૈસા જમા કરવાનું કહેતો નથી.",
        todo: "કંઈ જમા કરશો નહીં. ખાતું બ્લૉક કરી રિપોર્ટ કરો. પૈસા ભરી દીધા હોય તો તરત 1930 પર ફોન કરો; પહેલો કલાક સૌથી મહત્ત્વનો છે."
      },
      vendor_real: {
        title: "જાણીતા વેન્ડર તરફથી પેમેન્ટ યાદ",
        ctx: "તમે દર મહિને પૈસા ચૂકવો છો તે પેકેજિંગ વેન્ડરના રોજના સરનામેથી ઈમેલ.",
        who: "Sunrise Packaging બિલિંગ",
        subject: "પેમેન્ટ યાદ - ઇન્વૉઇસ SP/26-27/0431, 10 ઑક્ટોબરે બાકી",
        text: "પ્રિય મેરિડિયન ટેક્સટાઇલ્સ ટીમ, ₹86,000 નું ઇન્વૉઇસ SP/26-27/0431 10 ઑક્ટોબરે ચૂકવવાનું છે, તેની આ નમ્ર યાદ છે. [[ok|અમારી બેંક વિગતો બદલાઈ નથી અને તમારી પાસેના ઇન્વૉઇસ પર છાપેલી છે.]] [[ok|અમારું બેંક ખાતું બદલવાનું કહેતો કોઈ ઈમેલ આવે તો ચૂકવતાં પહેલાં તમારા રેકોર્ડના નંબર પર અમારી ઑફિસને ફોન કરજો.]] આભાર.",
        why: "જાણીતા વેન્ડરના સરનામેથી નિયમિત યાદ, નવી બેંક વિગતો નહીં, ધમકી નહીં, અને કંઈ અલગ લાગે તો વેન્ડર પોતે ફોન પર ખાતરી કરવા કહે છે. સાચો ભાગીદાર આવું જ વર્તે છે.",
        todo: "તમારા રેકોર્ડમાંના ખાતામાં સામાન્ય રીતે ચૂકવો. ફેરફારની કોઈ પણ વિનંતી જાણીતા ફોન નંબર પર પાકી કરો."
      },
      deepfake: {
        title: "MD નો અવાજ તાકીદનું ટ્રાન્સફર માંગે છે",
        ctx: "અજાણ્યા નંબર પરથી ફોન. અવાજ બરાબર તમારા MD જેવો, પાછળ એરપોર્ટનો ઘોંઘાટ.",
        who: "\"રાજેશ સર\" (MD નો અવાજ)",
        subject: "",
        text: "\"હેલો, હું જ બોલું છું, એરપોર્ટ પર છું, ઘોંઘાટ સંભળાય છે ને. [[urgent|મારે હમણાં ને હમણાં ₹2,00,000 ટ્રાન્સફર કરાવવા છે]] દુબઈ ઑર્ડર માટે એક નવા સપ્લાયરને. [[newacct|ખાતા નંબર હું WhatsApp કરું છું.]] [[secret|મને પાછો ફોન ન કરતો, ફોન ફ્લાઇટ મોડ પર જાય છે, હું ઊતરું તે પહેલાં કરી નાખ.]]\"",
        why: "AI કોઈ ભાષણ કે વીડિયોની 30 સેકન્ડની ક્લિપ પરથી કોઈનો પણ અવાજ નકલ કરી શકે છે. નકલી અવાજ + નવો ખાતા નંબર + \"પાછો ફોન ન કરતો\" એટલે ડીપફેક સ્કૅમ. પાછળનો ઘોંઘાટ જાણી જોઈને ઉમેરાય છે.",
        todo: "પાછો ફોન કરું છું એમ કહો, પછી સેવ કરેલા નંબર પર MD ને ફોન કરો કે બીજા વરિષ્ઠ વ્યક્તિ પાસે ખાતરી કરો. ફોન પરની તાકીદની વિનંતી માટે ટીમમાં ગુપ્ત શબ્દ નક્કી કરો. સામાન્ય મંજૂરી વગર ટ્રાન્સફર નહીં."
      },
      qr_receive: {
        title: "પૈસા \"મેળવવા\" ખરીદનાર QR કોડ મોકલે છે",
        ctx: "તમે એક ક્લાસિફાઇડ સાઇટ પર 12 જૂની ઑફિસ ખુરશીઓની જાહેરાત આપી. એક ખરીદનાર WhatsApp પર લખે છે.",
        who: "ઑફિસ ખુરશીઓનો ખરીદનાર",
        subject: "",
        text: "હાય, ₹18,000 માં 12 જૂની ઑફિસ ખુરશીઓની તમારી જાહેરાત જોઈ. હું આખી રકમ હમણાં જ ચૂકવું છું. [[upi|મેં QR કોડ મોકલ્યો છે: પૈસા મેળવવા તેને સ્કૅન કરી તમારો UPI PIN નાખો.]] [[odd|હું બહાર પોસ્ટિંગવાળો આર્મી ઓફિસર છું, એટલે મારો મિત્ર ખુરશીઓ લઈ જશે.]] [[urgent|કૃપા કરી આવતી 5 મિનિટમાં કરો, મારું નેટવર્ક નબળું છે.]]",
        why: "પૈસા મેળવવા તમે ક્યારેય QR સ્કૅન કરતા નથી કે PIN નાખતા નથી. સ્કૅન કરી PIN નાખો એટલે તમે સામેવાળાને પૈસા ચૂકવો છો. \"આર્મી ઓફિસર\" ની વાર્તા અને ઉતાવળ ક્લાસિફાઇડ સાઇટની જાણીતી ચાલ છે.",
        todo: "ના પાડો. ખરીદનારને તમારા UPI ID પર પૈસા મોકલવા કહો; પૈસા મેળવવા તમારે કંઈ કરવાનું નથી. એપમાં નંબર રિપોર્ટ કરો."
      },
      fake_care: {
        title: "સર્ચમાં મળેલો કસ્ટમર કેર નંબર",
        ctx: "રિફંડ ન આવ્યું. તમે ઑનલાઇન બેંકનો કસ્ટમર કેર શોધ્યો અને પહેલા દેખાયેલા નંબર પર ફોન કર્યો.",
        who: "\"NovaBank કસ્ટમર કેર\"",
        subject: "",
        text: "\"NovaBank કસ્ટમર કેરને ફોન કરવા બદલ આભાર. ₹3,200 ના રિફંડ માટે તમારી ખાતરી કરવી પડશે. [[otp|કૃપા કરી તમારો 16 અંકનો કાર્ડ નંબર, એક્સપાયરી તારીખ અને હમણાં આવતો OTP કહો.]] [[remote|હું મોકલું તે Quick Support એપ પણ ઇન્સ્ટોલ કરો જેથી હું ઝડપથી કામ કરી શકું.]]\"",
        why: "તમે સર્ચ પરિણામમાં કે નકલી વેબસાઇટ પર મૂકેલા નકલી નંબર પર ફોન કર્યો. કોઈ બેંક પૂરો કાર્ડ નંબર, એક્સપાયરી, CVV કે OTP માંગતી નથી, અને રિમોટ-કંટ્રોલ એપ ઇન્સ્ટોલ કરવાનું ક્યારેય કહેતી નથી.",
        todo: "કૉલ કાપો. ફક્ત કાર્ડની પાછળ છાપેલો કે સત્તાવાર એપમાંનો નંબર વાપરો. કૉલર કહે તે એપ ક્યારેય ઇન્સ્ટોલ ન કરો. કંઈ કહી દીધું હોય તો તરત એપમાં કાર્ડ બ્લૉક કરો અને 1930 પર ફોન કરો."
      },
      hr_real: {
        title: "HR તરફથી દિવાળી રજાઓની યાદી",
        ctx: "કંપનીના HR સરનામેથી બધા કર્મચારીઓને ઈમેલ.",
        who: "HR વિભાગ",
        subject: "દિવાળી અઠવાડિયાની રજાઓની યાદી",
        text: "સૌને નમસ્કાર, દિવાળી માટે 7 થી 9 નવેમ્બર ઑફિસ બંધ રહેશે. [[ok|રજાઓની આખી યાદી ઇન્ટ્રાનેટના HR પેજ પર છે]], રજા માટે તમે વાપરો છો તે જ પેજ. [[ok|તમારે કંઈ કરવાની જરૂર નથી.]] સૌને આનંદમય અને સલામત દિવાળીની શુભેચ્છા. - HR ટીમ",
        why: "કંપનીના પોતાના HR સરનામેથી મોકલાયેલો, ફક્ત માહિતી, બહારની સાઇટની લિંક નહીં, ખોલવા અટેચમેન્ટ નહીં અને ભરવાનું કંઈ નહીં. સાચી સૂચનાઓને ઉતાવળની જરૂર નથી.",
        todo: "કંઈ કરવાનું નથી. રજા કે બોનસ વિશેનો ઈમેલ લૉગિન કરવા કે બેંક વિગતો ભરવા કહે, તો તેને ખતરાનો સંકેત ગણો અને HR ને રૂબરૂ પૂછો."
      },
      screen_share: {
        title: "\"UPI હેલ્પલાઇન\" ને તમારી સ્ક્રીન જોવી છે",
        ctx: "UPI પેમેન્ટ નિષ્ફળ ગયું અને તમે સોશિયલ મીડિયા પર ફરિયાદ કરી, તેની થોડી મિનિટોમાં ફોન આવ્યો.",
        who: "\"UPI હેલ્પલાઇન\"",
        subject: "",
        text: "\"સાહેબ, તમારું ₹1,500 નું UPI પેમેન્ટ અટક્યું છે. હું 2 મિનિટમાં ઠીક કરી દઉં. [[remote|મેં મોકલેલી લિંક પરથી સ્ક્રીન-શેરિંગ એપ ઇન્સ્ટોલ કરો અને સ્ક્રીન પરનો 9 અંકનો કોડ મને વાંચી સંભળાવો.]] બેંકિંગ એપ ખુલ્લી રાખો, મારે ફક્ત જોવું છે. [[otp|OTP આવે ત્યારે કૉલ ન કાપતા, હું માર્ગદર્શન આપીશ.]]\"",
        why: "રિમોટ-એક્સેસ અને સ્ક્રીન-શેરિંગ એપથી કૉલર તમારો ફોન જોઈ અને ચલાવી શકે છે; 9 અંકનો કોડ તેને પૂરો એક્સેસ આપે છે. OTP સાથે તે થોડી મિનિટોમાં ખાતું ખાલી કરી શકે. સાચી હેલ્પલાઇન ક્યારેય તમારી સ્ક્રીન જોવા માંગતી નથી.",
        todo: "કૉલ કાપો અને ઇન્સ્ટોલ કરેલી એપ કાઢી નાખો. ફરિયાદ ફક્ત સત્તાવાર UPI કે બેંક એપમાં જ કરો. પૈસા ગયા હોય તો તરત 1930 અને બેંકને ફોન કરો."
      },
      invoice_exe: {
        title: ".exe થી પૂરું થતું ઇન્વૉઇસ અટેચમેન્ટ",
        ctx: "જે કંપની પાસેથી ખરીદી કર્યાનું યાદ નથી, તેના તરફથી અકાઉન્ટ્સ મેલબોક્સમાં ઈમેલ.",
        who: "Global Trade Supplies",
        subject: "ઇન્વૉઇસ જોડેલું છે - કૃપા કરી પ્રક્રિયા કરો",
        text: "[[odd|પ્રિય સાહેબ,]] ગયા અઠવાડિયે આપેલા માલનું ઇન્વૉઇસ સાથે જોડેલું છે. [[attach|અટેચમેન્ટ: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|કૃપા કરી આજે જ પેમેન્ટ કરો]] અને જણાવો. [[odd|આપનો, અકાઉન્ટ્સ વિભાગ.]]",
        why: ".exe થી પૂરી થતી ફાઇલ PDF નહીં પણ પ્રોગ્રામ છે; નામમાંનું \".pdf\" ફક્ત વેશ છે. તેને ખોલવાથી મૉલવેર કે રેન્સમવેર ઇન્સ્ટોલ થાય છે જે ઑફિસના દરેક કમ્પ્યુટરને લૉક કરી શકે. અસ્પષ્ટ સંબોધન અને કંપનીની સહી ન હોવી વધારાની ચેતવણી છે.",
        todo: "અટેચમેન્ટ ખોલશો નહીં. ઈમેલની IT ને ફરિયાદ કરો. રેકોર્ડ તપાસો: શું તમે ખરેખર આ કંપની પાસેથી ખરીદ્યું હતું? આવી ચાલ દેખાય તે માટે ઑફિસના કમ્પ્યુટર પર \"ફાઇલ એક્સ્ટેન્શન બતાવો\" ચાલુ કરો."
      },
      echallan: {
        title: "એપ લિંકવાળો ટ્રાફિક ઈ-ચલણ SMS",
        ctx: "સાંજે ઑફિસના ડ્રાઇવરના ફોન પર SMS.",
        who: "",
        subject: "",
        text: "ટ્રાફિક ઈ-ચલણ: તમારા વાહન KA-05-XX-1234 એ 1 ઑક્ટોબરે સિગ્નલ તોડ્યાની નોંધ છે. [[money|દંડ ₹1,000.]] બમણા દંડ અને કોર્ટ સમન્સથી બચવા [[urgent|24 કલાકમાં ભરો]]. [[link|સત્તાવાર ચલણ એપ ડાઉનલોડ કરો: echallan-pay.example.net/app.apk]]",
        why: "સાચા ઈ-ચલણ મેસેજ ખાનગી મોબાઇલ નંબરથી નહીં પણ સરકારી સેન્ડર ID થી આવે છે, અને ક્યારેય .apk ફાઇલ ડાઉનલોડ કરવાનું કહેતા નથી. એ APK તમારા SMS અને OTP વાંચતી જોખમી એપ છે.",
        todo: "મેસેજ ડિલીટ કરો. ચલણ ફક્ત સત્તાવાર સરકારી ઈ-ચલણ વેબસાઇટ કે રાજ્ય પોલીસની એપમાં તપાસો. એ નંબરની સંચાર સાથી (ચક્ષુ) પર ફરિયાદ કરો."
      },
      parcel_real: {
        title: "અપેક્ષિત પાર્સલની ડિલિવરી માહિતી",
        ctx: "ગયા અઠવાડિયે તમે પેકેજિંગ સામગ્રી મંગાવી હતી. આ SMS આવે છે.",
        who: "",
        subject: "",
        text: "SpeedParcel: Sunrise Packaging તરફથી તમારું શિપમેન્ટ SP48213 [[ok|આજે બપોરે 2 થી 5 વચ્ચે પહોંચશે.]] [[ok|કોઈ પેમેન્ટ બાકી નથી.]] [[ok|ટ્રેક કરવા અમારી વેબસાઇટ કે એપ પર શિપમેન્ટ નંબર વાપરો.]]",
        why: "નોંધાયેલા સેન્ડર ID થી (ખાનગી નંબર નહીં), અપેક્ષિત પાર્સલ સાથે મેળ ખાતો, પૈસા ન માંગતો અને ટૅપ કરવા લિંક ન આપતો. સાચો ડિલિવરી મેસેજ ફક્ત જાણ કરે છે.",
        todo: "કંઈ કરવાનું નથી. પાર્સલનો મેસેજ ફી, લિંક કે એપ માંગે તો અટકો અને શિપમેન્ટ નંબરથી સત્તાવાર વેબસાઇટ પર તપાસો."
      },
      kyc: {
        title: "KYC પૂરું, ખાતું આજે બંધ",
        ctx: "રાત્રે માલિકના ફોન પર SMS.",
        who: "",
        subject: "",
        text: "પ્રિય ગ્રાહક, તમારું KYC પૂરું થઈ ગયું હોવાથી [[threat|તમારું NovaBank ખાતું આજે બંધ થશે]]. [[link|novabank-kyc-update.example.net]] પર [[urgent|તરત અપડેટ કરો]] કે [[sender|અમારા અધિકારીને 94XXX XXX51 પર ફોન કરો]].",
        why: "બેંકો ક્યારેય ખાનગી મોબાઇલ નંબરથી KYC લિંક મોકલતી નથી અને થોડા કલાકમાં ખાતું બંધ કરતી નથી. લિંક નકલી બેંક પેજ ખોલે છે જે તમારું લૉગિન અને OTP ચોરે છે; \"અધિકારી\" એપ ઇન્સ્ટોલ કરવા કહે છે.",
        todo: "લિંક ટૅપ ન કરો કે ફોન ન કરો. KYC ખરેખર બાકી હોય તો બેંકની પોતાની એપ કે શાખા જણાવશે. SMS ની સંચાર સાથી (ચક્ષુ) પર ફરિયાદ કરો."
      },
      sim_swap: {
        title: "કૉલ: તમારું SIM બંધ થશે",
        ctx: "ઑફિસ મેનેજરને ફોન, જે આ નંબર બેંકના OTP માટે વાપરે છે.",
        who: "\"ટેલિકોમ કંપનીના અધિકારી\"",
        subject: "",
        text: "\"મેડમ, હું તમારા મોબાઇલ નેટવર્કમાંથી બોલું છું. 5G અપગ્રેડ બાકી હોવાથી [[threat|તમારું SIM 24 કલાકમાં બંધ થશે]]. [[otp|અપગ્રેડ માટે તમારા SIM કાર્ડ પરનો 20 અંકનો નંબર વાંચી સંભળાવો અને આવનાર SMS પછી 1 દબાવો.]] [[urgent|આ ઑફર આજે જ પૂરી થાય છે.]]\"",
        why: "આ SIM-સ્વૅપનો પ્રયત્ન છે. 20 અંકના SIM નંબર અને તમારા \"1\" થી છેતરનાર તમારો નંબર પોતાના SIM પર ચાલુ કરે છે. તમારો ફોન બંધ પડે છે અને બેંકિંગ તથા UPI નો દરેક OTP તેને જાય છે.",
        todo: "કૉલ કાપો. ટેલિકોમ કંપનીઓ 5G અપગ્રેડ માટે ક્યારેય ફોન કરતી નથી. ફોનનું નેટવર્ક અચાનક લાંબા સમય માટે જાય તો પહેલાં બેંકને, પછી ઓપરેટરને ફોન કરો. તમારા નામનાં SIM સંચાર સાથી પર તપાસો."
      },
      mfa: {
        title: "મધરાતથી સાતમી લૉગિન મંજૂરી વિનંતી",
        ctx: "રાત્રે ઑફિસ લૉગિન એપની સાઇન-ઇન મંજૂરી વિનંતીઓથી ફોન સતત વાગે છે. પછી એક કૉલ આવે છે.",
        who: "SecureLogin એપ",
        subject: "",
        text: "[[otp|સાઇન-ઇન મંજૂર કરવું છે? કોઈ નવા ડિવાઇસથી તમારા ઑફિસ ખાતામાં સાઇન-ઇન કરે છે. આગળ વધવા APPROVE ટૅપ કરો.]] [[odd|(મધરાતથી આ 7 મી વિનંતી છે.)]] થોડી વારમાં એક કૉલર કહે છે: \"[[urgent|હું IT માંથી બોલું છું, અમે સર્વર સુધારીએ છીએ. અલર્ટ બંધ થાય તે માટે બસ વિનંતી મંજૂર કરી દો.]]\"",
        why: "આને \"MFA થાક\" કહે છે. હુમલાખોર પાસે તમારો પાસવર્ડ પહેલેથી છે અને તે વિનંતીઓનો મારો ચલાવે છે, એ આશાએ કે કંટાળીને તમે Approve દબાવશો. \"IT\" નો કૉલ હુમલાનો જ ભાગ છે. સાચું IT તમે શરૂ ન કરેલું લૉગિન મંજૂર કરવાનું ક્યારેય કહેતું નથી.",
        todo: "દર વખતે Deny દબાવો. વિશ્વાસપાત્ર ડિવાઇસથી તરત પાસવર્ડ બદલો અને IT ને કહો. વારંવારની વિનંતીઓનો અર્થ કે તમારો પાસવર્ડ લીક થઈ ચૂક્યો છે."
      },
      gst_real: {
        title: "તમારા CA તરફથી માસિક GST યાદ",
        ctx: "તમારા ચાર્ટર્ડ અકાઉન્ટન્ટના સેવ કરેલા નંબરથી WhatsApp મેસેજ.",
        who: "મહેતા એન્ડ કં. (અમારા CA)",
        subject: "",
        text: "સુપ્રભાત. યાદ: સપ્ટેમ્બરનું GSTR-3B 20 ઑક્ટોબરે ભરવાનું છે. [[ok|કૃપા કરી વેચાણ અને ખરીદીની શીટ દર મહિનાની જેમ એ જ શેર્ડ ફોલ્ડરમાં અપલોડ કરો.]] [[ok|હમણાં તમારી બાજુથી કોઈ પેમેન્ટની જરૂર નથી]]; ફાઇલિંગ પછી હું ચલણની વિગતો મોકલીશ, અને આપણા રોજના કૉલ પર પાકું કરીશું.",
        why: "જાણીતા CA, સેવ કરેલો નંબર, નિયમિત માસિક પ્રક્રિયા, નવો ખાતા નંબર નહીં, લિંક નહીં અને સાચી છેલ્લી તારીખથી વધુ ઉતાવળ નહીં. ખાતરી તમારા નિયમિત કૉલ પર થાય છે.",
        todo: "તમારી સામાન્ય પ્રક્રિયા અનુસરો. કોઈ દિવસ \"CA\" નવું બેંક ખાતું મોકલે કે લિંકથી ચૂકવવા કહે, તો પહેલાં જાણીતા નંબર પર CA ઑફિસને ફોન કરો."
      },
      lookalike: {
        title: "આબેહૂબ ડોમેન પર પગાર સ્લિપ",
        ctx: "સુધારેલી પગાર સ્લિપ વિશે ઈમેલ. તમારી કંપનીનું સાચું ડોમેન meridiantextiles.example.com છે.",
        who: "પેરોલ ટીમ",
        subject: "તમારી સુધારેલી પગાર સ્લિપ તૈયાર છે",
        text: "પ્રિય કર્મચારી, ઑક્ટોબરથી તમારું પગાર માળખું બદલાયું છે. [[link|નવી સ્લિપ જોવા meridian-textiles-portal.example.com પર ઑફિસ પાસવર્ડથી લૉગિન કરો.]] [[urgent|લિંક 12 કલાકમાં પૂરી થશે.]] [[sender|payroll@meridian-textiles.example.com થી મોકલેલ]]",
        why: "કંપનીનું સાચું ડોમેન meridiantextiles.example.com છે; ઈમેલ meridian-textiles (હાઇફન સાથે) વાપરે છે, જે આબેહૂબ દેખાતું ડોમેન છે. લિંક નકલ કરેલા લૉગિન પેજ પર લઈ જાય છે જે તમારો ઑફિસ પાસવર્ડ ચોરે છે. પગાર સ્લિપ તમે હંમેશાં વાપરો છો તે HR પોર્ટલ પર જ હોય.",
        todo: "ક્લિક ન કરો. સરનામું ટાઇપ કરીને કે બુકમાર્કથી HR પોર્ટલ જાતે ખોલો. ઈમેલની IT ને ફરિયાદ કરો; ફોરવર્ડ કરવાથી તેઓ બધા માટે નકલી ડોમેન બ્લૉક કરી શકે છે."
      },
      usb: {
        title: "પાર્કિંગમાં મળેલી પેન ડ્રાઇવ",
        ctx: "સોમવારે સવારે, ઑફિસના પ્રવેશદ્વાર પાસે.",
        who: "ઑફિસ પાર્કિંગમાં મળેલી પેન ડ્રાઇવ",
        subject: "",
        text: "પ્રવેશદ્વાર પાસે એક પેન ડ્રાઇવ પડી છે, તેના પર લેબલ: [[prize|\"પગાર વધારો 2026 - ગુપ્ત - ફક્ત મેનેજમેન્ટ માટે\"]]. એક સહકર્મી કહે છે: \"[[remote|ચાલો રિસેપ્શનના PC માં લગાવીને જોઈએ કોની છે.]]\"",
        why: "આને \"USB ડ્રૉપ\" કહે છે. હુમલાખોરો લલચાવનારાં લેબલવાળી પેન ડ્રાઇવ મૂકી જાય છે; એક લગાવતાં જ છુપાયેલું સૉફ્ટવેર જાતે ઇન્સ્ટોલ થઈ ઑફિસ નેટવર્કમાં ફેલાઈ શકે. કુતૂહલ જ હુમલો છે.",
        todo: "ક્યાંય લગાવશો નહીં. કવરમાં મૂકીને IT કે સુરક્ષા વિભાગને આપો. કંપનીઓએ ઑટો-રન બંધ કરી અજાણ્યાં USB ડિવાઇસ બ્લૉક કરવાં જોઈએ."
      },
      wifi: {
        title: "એરપોર્ટનું મફત Wi-Fi ઈમેલ પાસવર્ડ માંગે છે",
        ctx: "ફ્લાઇટની રાહ જોતાં, બે વેન્ડર પેમેન્ટ મંજૂર કરવા તમે મફત નેટવર્ક સાથે જોડાઓ છો.",
        who: "એરપોર્ટ પર મફત Wi-Fi લૉગિન સ્ક્રીન",
        subject: "",
        text: "નેટવર્ક: Airport_Free_WiFi_5G (પાસવર્ડ નહીં). [[otp|આગળ વધવા તમારું ઈમેલ સરનામું અને ઈમેલ પાસવર્ડ નાખી સાઇન-ઇન કરો.]] પછી ફ્લાઇટની રાહ જોતાં તમે [[data|કંપનીના બેંકિંગ પોર્ટલ પર બે વેન્ડર પેમેન્ટ મંજૂર કરવાનું]] વિચારો છો.",
        why: "સત્તાવાર લાગતા નામનો હૉટસ્પૉટ કોઈ પણ બનાવી શકે. નકલી નેટવર્ક પર હુમલાખોર તમે જે ટાઇપ કરો તે જોઈ શકે છે, અને ઈમેલ પાસવર્ડ માંગતું લૉગિન પેજ માહિતી ચોરે છે. જાહેર Wi-Fi પર બેંકિંગ જોખમી છે.",
        todo: "કામ અને બેંકિંગ માટે પોતાનો મોબાઇલ ડેટા કે કંપનીનું VPN વાપરો. Wi-Fi લૉગિન પેજ પર ક્યારેય ઑફિસ કે ઈમેલ પાસવર્ડ ટાઇપ ન કરો. ખુલ્લાં નેટવર્ક સાથે આપોઆપ જોડાણ બંધ કરો."
      },
      upi_real: {
        title: "પેમેન્ટ મળ્યાનું નોટિફિકેશન",
        ctx: "તમે કાઉન્ટર પર હો ત્યારે તમારી પોતાની UPI એપનું નોટિફિકેશન.",
        who: "UPI એપ",
        subject: "",
        text: "[[ok|Anita Traders તરફથી ₹2,500 મળ્યા]] તમારા 4471 થી પૂરા થતા કરંટ ખાતામાં. [[ok|કોઈ કાર્યવાહીની જરૂર નથી.]] ટ્રાન્ઝેક્શન ID 628104...",
        why: "અંદર આવતા પૈસા માટે ક્યારેય PIN, OTP કે સ્કૅનની જરૂર નથી. નોટિફિકેશન તમારી પોતાની એપનું છે, ચૂકવનારનું નામ આપે છે અને તમારી પાસે કંઈ માંગતું નથી. આની સરખામણી \"કલેક્ટ રિક્વેસ્ટ\" કે સ્કૅન કરવા કહેલા QR સાથે કરો: તે પૈસા બહાર લઈ જાય છે.",
        todo: "કંઈ કરવાનું નથી. રકમ ઇન્વૉઇસ સાથે મેળવો. \"પેમેન્ટ મળ્યું\" મેસેજ ક્યારેય મંજૂરી, PIN કે સ્કૅન માંગે, તો તે પૈસા આપતો નથી, લઈ જાય છે."
      },
      dpdp: {
        title: "સહકર્મીને ગ્રાહક યાદી WhatsApp પર જોઈએ છે",
        ctx: "સાંજે સેલ્સના સહકર્મીના નંબરથી WhatsApp મેસેજ.",
        who: "સમીર (સેલ્સ સહકર્મી)",
        subject: "",
        text: "ભાઈ, આજે હું ઘરેથી કામ કરું છું. [[data|ફોન નંબર અને આધારની નકલો સાથે આખી ગ્રાહક યાદી એક્સપોર્ટ કરીને મને આ જ WhatsApp પર મોકલ]], પછી ડિલીટ કરી દઈશ. [[urgent|કેમ્પેન માટે 10 મિનિટમાં જોઈએ છે.]] [[secret|મેનેજરને કહેવાની જરૂર નથી, નાની વાત છે.]]",
        why: "ગ્રાહકોના ફોન નંબર અને આધારની નકલો ભારતના DPDP કાયદાથી સુરક્ષિત વ્યક્તિગત ડેટા છે. ખાનગી WhatsApp પર મોકલવાથી તે કંપનીના નિયંત્રણ બહાર જાય છે, અને આ હેક થયેલું ખાતું કે ખોટી ઓળખ પણ હોઈ શકે. \"મેનેજરને ન કહેતો\" ક્યારેય ચાલે નહીં.",
        todo: "નમ્રતાથી ના પાડો. ગ્રાહક ડેટા ફક્ત કંપનીની મંજૂર સિસ્ટમથી, મેનેજરની મંજૂરીથી અને જરૂરી હોય એટલી જ વિગતો શેર કરો. સહકર્મીનું ખાતું વિચિત્ર લાગે તો તેમને ફોન કરો."
      },
      otp_call: {
        title: "પેમેન્ટ રદ કરવા \"ફ્રોડ વિભાગ\" ને OTP જોઈએ",
        ctx: "ફોન પર OTP SMS આવતો હોય ત્યારે જ આવેલો કૉલ.",
        who: "\"NovaBank ફ્રોડ વિભાગ\"",
        subject: "",
        text: "\"સાહેબ, [[threat|તમારા કાર્ડ પર હમણાં ₹49,999 નો વ્યવહાર થઈ રહ્યો છે.]] તેને રદ કરવા [[urgent|અમારે 60 સેકન્ડમાં કાર્યવાહી કરવી પડશે]]. [[otp|હમણાં તમારા ફોન પર આવેલો OTP કહો, હું તેને પાછો ફેરવી દઉં.]] [[secret|કૃપા કરી કૉલ ન કાપો કે કોઈને ફોન ન કરો.]]\"",
        why: "\"હમણાં આવેલો\" OTP સ્કૅમરના તમારા કાર્ડથી ચૂકવવાના પ્રયત્ન માટે છે. તેને વાંચી સંભળાવવાથી પેમેન્ટ પૂરું થાય છે. બેંકો કંઈ રદ કરવા OTP ક્યારેય માંગતી નથી, અને 60 સેકન્ડનો ગભરાટ તમે વિચારો નહીં એ માટે ઊભો કરાય છે.",
        todo: "કૉલ કાપો. બેંક એપ ખોલીને જાતે કાર્ડ બ્લૉક કરો, કે કાર્ડની પાછળના નંબર પર ફોન કરો. OTP ક્યારેય કોઈને વાંચી ન સંભળાવો. પૈસા ગયા હોય તો તરત 1930 પર ફોન કરો."
      },
      hr_bonus: {
        title: "દિવાળી બોનસ ફૉર્મ નેટ-બેંકિંગ લૉગિન માંગે છે",
        ctx: "દિવાળી પહેલાં, HR જેવા દેખાતા સરનામેથી બધા કર્મચારીઓને ઈમેલ.",
        who: "HR રિવૉર્ડ્સ ટીમ",
        subject: "દિવાળી બોનસ ₹25,000 - તમારું બેંક ખાતું પાકું કરો",
        text: "પ્રિય સાથી, ₹25,000 દિવાળી બોનસની જાહેરાત કરતાં આનંદ થાય છે. [[attach|જોડેલું ફૉર્મ (Bonus_Form.html) ખોલો]] અને બોનસ સીધું જમા થાય તે માટે [[otp|તમારો નેટ-બેંકિંગ યુઝર ID અને પાસવર્ડ નાખો]]. [[urgent|આજે સાંજે 6 પછી આવેલાં ફૉર્મ સ્વીકારાશે નહીં.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR પાસે તમારું પગાર ખાતું પહેલેથી છે; કોઈ કંપની બોનસ માટે નેટ-બેંકિંગ લૉગિન માંગતી નથી. મોકલનાર આબેહૂબ ડોમેન છે, HTML અટેચમેન્ટ નકલી બેંક લૉગિન પેજ છે, અને એ જ દિવસની સમયમર્યાદા દબાણ વધારે છે.",
        todo: "અટેચમેન્ટ ન ખોલો કે કંઈ ન નાખો. HR ને રૂબરૂ કે ઇન્ટ્રાનેટ પર પૂછો. સહકર્મીઓ સાવધ થાય તે માટે ઈમેલની IT ને ફરિયાદ કરો."
      },
      electricity: {
        title: "આજે રાત્રે ઑફિસની વીજળી કપાશે",
        ctx: "રાત્રે 8:35 વાગ્યે દુકાન માલિકના ફોન પર SMS.",
        who: "",
        subject: "",
        text: "પ્રિય ગ્રાહક, [[odd|ગયા મહિનાનું બિલ અમારી સિસ્ટમમાં અપડેટ નથી થયું]] તેથી [[threat|તમારી ઑફિસનું વીજ કનેક્શન આજે રાત્રે 9:30 વાગ્યે કપાશે]]. કૃપા કરી અમારા અધિકારીનો [[sender|93XXX XXX40]] પર [[urgent|તરત]] સંપર્ક કરો.",
        why: "વીજ બોર્ડ ખાનગી મોબાઇલથી એક SMS પછી રાત્રે વીજળી કાપતું નથી. ફોન કરો ત્યારે \"અધિકારી\" એપ ઇન્સ્ટોલ કરવા કે લિંકથી ₹10 ભરવા કહે છે, અને સાચું નિશાન તમારું બેંક ખાતું હોય છે.",
        todo: "ફોન ન કરો. બિલ વીજ બોર્ડની સત્તાવાર એપ કે કચેરીમાં તપાસો. એ નંબરની સંચાર સાથી (ચક્ષુ) પર ફરિયાદ કરો."
      },
      wa_hijack: {
        title: "સહકર્મી 6 અંકનો કોડ ફોરવર્ડ કરવા કહે છે",
        ctx: "તમારા ફોન પર કોડનો SMS આવ્યા પછી તરત, મોડી રાત્રે સહકર્મીના સેવ કરેલા નંબરથી WhatsApp મેસેજ.",
        who: "રોહન (સહકર્મી)",
        subject: "",
        text: "અરે, આટલી રાત્રે હેરાન કરવા બદલ માફ કરજે. [[odd|WhatsApp માં લૉગિન કરતી વખતે ભૂલથી તારો નંબર નાખ્યો અને 6 અંકનો કોડ તારા ફોન પર ગયો.]] [[otp|એ કોડ મને ફોરવર્ડ કર]], [[urgent|જલ્દી, નહીં તો મારું ખાતું લૉક થઈ જશે.]]",
        why: "આવેલો કોડ તમારા જ WhatsApp નો વેરિફિકેશન કોડ છે. જેને તે મળે તે તમારું ખાતું કબજે કરે છે અને પછી તમારા બધા કૉન્ટેક્ટ અને ઑફિસ ગ્રુપને પૈસા માંગતા મેસેજ મોકલે છે. આ મેસેજ પણ સહકર્મીના પહેલેથી હેક થયેલા ખાતામાંથી આવ્યો હોઈ શકે.",
        todo: "વેરિફિકેશન કોડ ક્યારેય ફોરવર્ડ ન કરો. સહકર્મીને ફોન કરીને જણાવો કે તેમનું ખાતું હેક થયું છે. WhatsApp સેટિંગ્સમાં ટૂ-સ્ટેપ વેરિફિકેશન ચાલુ કરો."
      },
      invest_group: {
        title: "ગેરંટીવાળા વળતરનું સ્ટૉક-ટિપ્સ ગ્રુપ",
        ctx: "પૂછ્યા વગર તમને એક WhatsApp ગ્રુપમાં ઉમેરી દેવાયા.",
        who: "VIP Stock Tips - ગ્રુપ એડમિન",
        subject: "",
        text: "અમારા પ્રીમિયમ ગ્રુપમાં સ્વાગત છે! [[prize|ગેરંટીવાળી ઇનસાઇડર ટિપ્સથી અમારા સભ્યોએ ગયા મહિને 32% વળતર કમાયું.]] અમારી ટ્રેડિંગ એપ [[link|ઍપ સ્ટોરથી નહીં, આ લિંકથી]] ડાઉનલોડ કરો, અને [[money|₹50,000 જમા કરીને શરૂઆત કરો]]. [[prize|સભ્યોએ મૂકેલા નફાના સ્ક્રીનશૉટ જુઓ!]] [[urgent|પ્રવેશ મધરાતે બંધ થશે.]]",
        why: "કોઈ વળતરની ગેરંટી આપી શકે નહીં, અને \"ઇનસાઇડર ટિપ્સ\" ગેરકાયદે છે. એપ નકલી છે: તમે વધુ જમા કરો તે માટે કાલ્પનિક નફો બતાવે છે, અને પૈસા ઉપાડવા દેતી નથી. સ્ક્રીનશૉટ મૂકતા \"સભ્યો\" સ્કૅમર જ છે.",
        todo: "ગ્રુપ છોડો અને રિપોર્ટ કરો. ફક્ત SEBI નોંધાયેલા બ્રોકર અને સત્તાવાર ઍપ સ્ટોરની એપથી જ રોકાણ કરો. પૈસા જમા કર્યા હોય તો 1930 પર ફોન કરો અને cybercrime.gov.in પર ફરિયાદ કરો."
      },
      bank_real: {
        title: "તમે કરેલા પેમેન્ટનો ડેબિટ અલર્ટ",
        ctx: "તમારી અકાઉન્ટ્સ ટીમે આજે પેકેજિંગ વેન્ડરને ચૂકવણી કરી. આ SMS આવે છે.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|Sunrise Packaging ને NEFT માટે 10 ઑક્ટોબરે 4471 થી પૂરા થતા ખાતામાંથી ₹86,000 ડેબિટ]], સંદર્ભ N26101034. બેલેન્સ ₹3,42,118. [[ok|તમે ન કર્યું હોય તો તમારા ડેબિટ કાર્ડની પાછળના નંબર પર ફોન કરો.]]",
        why: "આ તમારી અકાઉન્ટ્સ ટીમે આજે કરેલા પેમેન્ટ સાથે મેળ ખાય છે, બેંકના સેન્ડર ID થી આવ્યું છે, SMS માં કોઈ લિંક કે નંબર નથી, અને તમારા પોતાના કાર્ડ પરના નંબર તરફ દોરે છે.",
        todo: "તમારા પેમેન્ટ રેકોર્ડ સાથે મેળવો. કોઈ ડેબિટ અલર્ટ તમે કરેલા પેમેન્ટ સાથે ન મળે, તો મેસેજના નહીં પણ કાર્ડ પરના નંબર પર તરત બેંકને ફોન કરો."
      }
    }
  },
  pa: {
    scenarios: {
      ceo_gift: {
        title: "ਨਵੇਂ ਨੰਬਰ ਤੋਂ ਬੌਸ ਨੂੰ ਗਿਫ਼ਟ ਕਾਰਡ ਚਾਹੀਦੇ ਹਨ",
        ctx: "ਸਵੇਰੇ 9 ਵਜੇ ਅਕਾਊਂਟਸ ਐਗਜ਼ੀਕਿਊਟਿਵ ਨੂੰ WhatsApp ਮੈਸੇਜ। ਪ੍ਰੋਫ਼ਾਈਲ ਫ਼ੋਟੋ ਕੰਪਨੀ ਦੀ ਵੈੱਬਸਾਈਟ ਵਾਲੀ MD ਦੀ ਫ਼ੋਟੋ ਹੈ।",
        who: "ਰਾਜੇਸ਼ ਸਰ (ਨਵਾਂ ਨੰਬਰ)",
        subject: "",
        text: "ਹਾਇ, ਮੈਂ ਰਾਜੇਸ਼ ਹਾਂ। [[sender|ਮੇਰਾ ਪੁਰਾਣਾ ਫ਼ੋਨ ਖ਼ਰਾਬ ਹੋ ਗਿਆ ਹੈ, ਹਾਲੇ ਇਹੀ ਨੰਬਰ ਵਰਤ ਰਿਹਾ ਹਾਂ।]] ਮੈਂ ਇੱਕ ਵੱਡੇ ਕਲਾਇੰਟ ਨਾਲ ਮੀਟਿੰਗ ਵਿੱਚ ਹਾਂ। [[money|₹5,000 ਵਾਲੇ 10 ਗਿਫ਼ਟ ਕਾਰਡ ਖ਼ਰੀਦੋ]] ਅਤੇ ਕੋਡ ਮੈਨੂੰ [[urgent|30 ਮਿੰਟਾਂ ਵਿੱਚ]] ਭੇਜੋ। [[secret|ਇਸ ਬਾਰੇ ਕਿਸੇ ਨਾਲ ਗੱਲ ਨਾ ਕਰਨਾ, ਕਲਾਇੰਟ ਲਈ ਸਰਪ੍ਰਾਈਜ਼ ਹੈ।]]",
        why: "ਸਕੈਮਰ ਵੈੱਬਸਾਈਟ ਤੋਂ MD ਦੀ ਫ਼ੋਟੋ ਲੈ ਕੇ ਨਵੇਂ ਨੰਬਰ ਤੋਂ ਲਿਖਦੇ ਹਨ। ਅਸਲੀ ਬੌਸ ਕਦੇ ਗਿਫ਼ਟ-ਕਾਰਡ ਕੋਡ ਜਾਂ ਗੁਪਤਤਾ ਨਹੀਂ ਮੰਗਦਾ। ਨਵਾਂ ਨੰਬਰ + ਕਾਹਲੀ + ਗੁਪਤਤਾ ਹੀ ਕਲਾਸਿਕ \"CEO ਫ਼ਰਾਡ\" ਹੈ।",
        todo: "ਕੁਝ ਨਾ ਖ਼ਰੀਦੋ। ਬੌਸ ਨੂੰ ਫ਼ੋਨ ਵਿੱਚ ਸੇਵ ਨੰਬਰ ਉੱਤੇ ਫ਼ੋਨ ਕਰੋ ਜਾਂ ਉਨ੍ਹਾਂ ਦੇ ਕੈਬਿਨ ਵਿੱਚ ਜਾਓ। IT ਜਾਂ ਮੈਨੇਜਰ ਨੂੰ ਦੱਸੋ ਤਾਂ ਜੋ ਪੂਰਾ ਦਫ਼ਤਰ ਚੌਕਸ ਰਹੇ।"
      },
      it_real: {
        title: "IT ਵੱਲੋਂ ਪਾਸਵਰਡ ਨੀਤੀ ਦੀ ਸੂਚਨਾ",
        ctx: "ਕੰਪਨੀ ਦੇ ਆਪਣੇ IT ਹੈਲਪਡੈਸਕ ਤੋਂ ਸਾਰੇ ਕਰਮਚਾਰੀਆਂ ਨੂੰ ਈਮੇਲ।",
        who: "IT ਹੈਲਪਡੈਸਕ",
        subject: "15 ਅਕਤੂਬਰ ਤੋਂ ਪਾਸਵਰਡ ਨੀਤੀ ਵਿੱਚ ਬਦਲਾਅ",
        text: "ਪਿਆਰੇ ਸਾਥੀਓ, 15 ਅਕਤੂਬਰ ਤੋਂ ਪਾਸਵਰਡ ਘੱਟੋ-ਘੱਟ 12 ਅੱਖਰਾਂ ਦਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ। [[ok|ਅੱਜ ਤੁਹਾਨੂੰ ਕੁਝ ਕਰਨ ਦੀ ਲੋੜ ਨਹੀਂ।]] ਪਾਸਵਰਡ ਦੀ ਮਿਆਦ ਮੁੱਕਣ ਉੱਤੇ ਇਸਨੂੰ [[ok|ਉਸੇ ਦਫ਼ਤਰੀ ਪੋਰਟਲ ਉੱਤੇ ਬਦਲੋ ਜੋ ਤੁਸੀਂ ਹਮੇਸ਼ਾ ਵਰਤਦੇ ਹੋ]]। [[ok|IT ਕਦੇ ਈਮੇਲ, ਫ਼ੋਨ ਜਾਂ WhatsApp ਉੱਤੇ ਤੁਹਾਡਾ ਪਾਸਵਰਡ ਨਹੀਂ ਮੰਗੇਗਾ।]] ਸ਼ੱਕ ਹੋਵੇ ਤਾਂ ਦੂਜੀ ਮੰਜ਼ਿਲ ਉੱਤੇ ਹੈਲਪਡੈਸਕ ਆਓ।",
        why: "ਭੇਜਣ ਵਾਲਾ ਕੰਪਨੀ ਦਾ ਆਪਣਾ IT ਪਤਾ ਹੈ। ਨਾ ਕਲਿੱਕ ਕਰਨ ਲਈ ਲਿੰਕ, ਨਾ ਅਟੈਚਮੈਂਟ, ਨਾ ਸਮਾਂ-ਸੀਮਾ, ਨਾ ਪਾਸਵਰਡ ਦੀ ਮੰਗ। ਅਸਲੀ ਸੂਚਨਾਵਾਂ ਦੱਸਦੀਆਂ ਹਨ ਕਿ ਕੀ ਹੋਵੇਗਾ ਅਤੇ ਆਮ ਪੋਰਟਲ ਤੁਹਾਨੂੰ ਆਪ ਵਰਤਣ ਦਿੰਦੀਆਂ ਹਨ।",
        todo: "ਕੁਝ ਜ਼ਰੂਰੀ ਨਹੀਂ। ਜੇ ਸ਼ੱਕ ਹੋਵੇ ਕਿ ਸੂਚਨਾ ਅਸਲੀ ਹੈ ਜਾਂ ਨਹੀਂ, ਤਾਂ ਹੈਲਪਡੈਸਕ ਜਾਓ ਜਾਂ ਪਹਿਲਾਂ ਤੋਂ ਜਾਣੇ ਐਕਸਟੈਂਸ਼ਨ ਨੰਬਰ ਉੱਤੇ ਫ਼ੋਨ ਕਰੋ।"
      },
      bec_vendor: {
        title: "ਵੈਂਡਰ ਕਹਿੰਦਾ ਹੈ ਬੈਂਕ ਖਾਤਾ ਬਦਲ ਗਿਆ",
        ctx: "₹4,80,000 ਦੇ ਬਕਾਇਆ ਇਨਵੌਇਸ ਬਾਰੇ ਅਕਾਊਂਟਸ ਟੀਮ ਨੂੰ ਈਮੇਲ।",
        who: "ਕਾਵੇਰੀ ਲੌਜਿਸਟਿਕਸ ਅਕਾਊਂਟਸ",
        subject: "ਜ਼ਰੂਰੀ: ਇਨਵੌਇਸ KL/2026/0912 ਲਈ ਨਵੇਂ ਬੈਂਕ ਵੇਰਵੇ",
        text: "ਸ਼੍ਰੀਮਾਨ ਜੀ/ਸ਼੍ਰੀਮਤੀ ਜੀ, [[newacct|ਆਡਿਟ ਤੋਂ ਬਾਅਦ ਸਾਡੀ ਕੰਪਨੀ ਦਾ ਬੈਂਕ ਖਾਤਾ ਬਦਲ ਗਿਆ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ₹4,80,000 ਦਾ ਬਕਾਇਆ ਇਨਵੌਇਸ ਹੇਠਾਂ ਦਿੱਤੇ ਨਵੇਂ ਖਾਤੇ ਵਿੱਚ ਭਰੋ।]] ਸ਼ਿਪਮੈਂਟ ਵਿੱਚ ਦੇਰੀ ਤੋਂ ਬਚਣ ਲਈ [[urgent|ਭੁਗਤਾਨ ਅੱਜ ਹੀ ਜਾਰੀ ਕਰੋ]]। [[sender|ਕਿਰਪਾ ਕਰਕੇ ਸਿਰਫ਼ ਇਸੇ ਈਮੇਲ ID ਉੱਤੇ ਜਵਾਬ ਦਿਓ]], ਸਾਡੇ ਦਫ਼ਤਰ ਦੇ ਫ਼ੋਨ ਮੁਰੰਮਤ ਵਿੱਚ ਹਨ।",
        why: "ਇਹ ਬਿਜ਼ਨਸ ਈਮੇਲ ਕੰਪ੍ਰੋਮਾਈਜ਼ (BEC) ਹੈ। ਅਪਰਾਧੀ ਵੈਂਡਰ ਦੀ ਈਮੇਲ ਹੈਕ ਜਾਂ ਨਕਲ ਕਰਕੇ \"ਨਵੇਂ ਬੈਂਕ ਵੇਰਵੇ\" ਭੇਜਦੇ ਹਨ। ਪਤਾ ਅਸਲੀ ਵੈਂਡਰ ਤੋਂ ਥੋੜ੍ਹਾ ਵੱਖਰਾ ਹੈ, ਫ਼ੋਨ \"ਬੰਦ\" ਹਨ ਤਾਂ ਜੋ ਤੁਸੀਂ ਪੱਕਾ ਨਾ ਕਰ ਸਕੋ, ਅਤੇ ਸਭ ਕੁਝ ਜ਼ਰੂਰੀ ਹੈ।",
        todo: "ਈਮੇਲ ਦੇ ਆਧਾਰ ਉੱਤੇ ਵੈਂਡਰ ਦੇ ਬੈਂਕ ਵੇਰਵੇ ਕਦੇ ਨਾ ਬਦਲੋ। ਵੈਂਡਰ ਨੂੰ ਪੁਰਾਣੇ ਰਿਕਾਰਡ ਜਾਂ ਪਰਚੇਜ਼ ਆਰਡਰ ਵਾਲੇ ਨੰਬਰ ਉੱਤੇ ਫ਼ੋਨ ਕਰੋ, ਈਮੇਲ ਵਾਲੇ ਨੰਬਰ ਉੱਤੇ ਕਦੇ ਨਹੀਂ। ਹਰ ਬੈਂਕ ਵੇਰਵੇ ਦੇ ਬਦਲਾਅ ਲਈ ਦੋ ਲੋਕਾਂ ਦੀ ਮਨਜ਼ੂਰੀ ਰੱਖੋ।"
      },
      gst_notice: {
        title: "ਅਟੈਚਮੈਂਟ ਵਾਲਾ GST ਜੁਰਮਾਨਾ ਨੋਟਿਸ",
        ctx: "ਸਵੇਰੇ-ਸਵੇਰੇ ਅਕਾਊਂਟਸ ਮੇਲਬਾਕਸ ਵਿੱਚ ਆਈ ਈਮੇਲ।",
        who: "GST ਵਿਭਾਗ",
        subject: "ਕਾਰਨ ਦੱਸੋ ਨੋਟਿਸ - ਜੁਰਮਾਨਾ ₹1,24,500 - ਕਾਰਵਾਈ ਲੋੜੀਂਦੀ",
        text: "[[odd|ਪਿਆਰੇ ਕਰਦਾਤਾ,]] ਤੁਹਾਡੀਆਂ GST ਰਿਟਰਨਾਂ ਵਿੱਚ ਫ਼ਰਕ ਮਿਲਿਆ ਹੈ। ₹1,24,500 ਜੁਰਮਾਨਾ ਬਕਾਇਆ ਹੈ। ਨਾ ਭਰਨ ਉੱਤੇ [[threat|ਤੁਹਾਡਾ GSTIN 48 ਘੰਟਿਆਂ ਵਿੱਚ ਮੁਅੱਤਲ ਹੋ ਜਾਵੇਗਾ]]। ਕਾਨੂੰਨੀ ਕਾਰਵਾਈ ਤੋਂ ਬਚਣ ਲਈ [[link|ਜੁੜਿਆ ਨੋਟਿਸ ਖੋਲ੍ਹੋ ਅਤੇ ਸੁਰੱਖਿਅਤ ਲਿੰਕ ਰਾਹੀਂ ਭਰੋ]]। [[attach|ਅਟੈਚਮੈਂਟ: GST_Notice_2026.html]]",
        why: "ਅਸਲੀ GST ਨੋਟਿਸ ਅਧਿਕਾਰਤ GST ਪੋਰਟਲ ਉੱਤੇ ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਦਿਸਦੇ ਹਨ ਅਤੇ ਉਨ੍ਹਾਂ ਉੱਤੇ DIN (ਡੌਕੂਮੈਂਟ ਆਈਡੈਂਟੀਫ਼ਿਕੇਸ਼ਨ ਨੰਬਰ) ਹੁੰਦਾ ਹੈ। \"ਸੁਰੱਖਿਅਤ ਲਿੰਕ\" ਵਾਲਾ HTML ਅਟੈਚਮੈਂਟ ਨਕਲੀ ਲੌਗਇਨ ਪੰਨਾ ਹੈ ਜੋ ਤੁਹਾਡਾ GST ਲੌਗਇਨ ਜਾਂ ਭੁਗਤਾਨ ਵੇਰਵੇ ਚੋਰੀ ਕਰਦਾ ਹੈ। ਭੇਜਣ ਵਾਲਾ ਅਧਿਕਾਰਤ gov.in ਡੋਮੇਨ ਨਹੀਂ ਹੈ।",
        todo: "ਅਟੈਚਮੈਂਟ ਨਾ ਖੋਲ੍ਹੋ। ਪਤਾ ਆਪ ਟਾਈਪ ਕਰਕੇ ਅਧਿਕਾਰਤ GST ਪੋਰਟਲ ਉੱਤੇ ਲੌਗਇਨ ਕਰੋ, ਜਾਂ ਆਪਣੇ CA ਨੂੰ ਜਾਂਚਣ ਲਈ ਕਹੋ। ਈਮੇਲ ਦੀ ਸ਼ਿਕਾਇਤ IT ਨੂੰ ਅਤੇ cybercrime.gov.in ਉੱਤੇ ਕਰੋ।"
      },
      otp_real: {
        title: "ਤੁਹਾਡੇ ਹੁਣੇ ਸ਼ੁਰੂ ਕੀਤੇ ਭੁਗਤਾਨ ਦਾ OTP",
        ctx: "ਤੁਸੀਂ ਹੁਣੇ ਪੈਕੇਜਿੰਗ ਵੈਂਡਰ ਨੂੰ ₹2,500 ਦਾ UPI ਭੁਗਤਾਨ ਸ਼ੁਰੂ ਕੀਤਾ ਹੈ। ਇਹ SMS ਆਉਂਦਾ ਹੈ।",
        who: "",
        subject: "",
        text: "[[ok|ਤੁਹਾਡੇ ਹੁਣੇ ਸ਼ੁਰੂ ਕੀਤੇ Sunrise Packaging ਨੂੰ ₹2,500 ਦੇ UPI ਭੁਗਤਾਨ ਲਈ ਤੁਹਾਡਾ OTP 482913 ਹੈ।]] 10 ਮਿੰਟ ਲਈ ਵੈਧ। [[ok|ਇਹ OTP ਕਿਸੇ ਨੂੰ ਨਾ ਦੱਸੋ, ਬੈਂਕ ਨੂੰ ਵੀ ਨਹੀਂ।]] - NovaBank",
        why: "ਇਹ ਭੁਗਤਾਨ ਤੁਸੀਂ ਆਪ ਪਲ ਭਰ ਪਹਿਲਾਂ ਸ਼ੁਰੂ ਕੀਤਾ, ਰਕਮ ਅਤੇ ਲੈਣ ਵਾਲਾ ਮੇਲ ਖਾਂਦੇ ਹਨ, ਅਤੇ ਮੈਸੇਜ ਕੋਡ ਕਿਸੇ ਨੂੰ ਨਾ ਦੱਸਣ ਲਈ ਕਹਿੰਦਾ ਹੈ। ਅਸਲੀ OTP ਸਿਰਫ਼ ਤੁਹਾਡੇ ਆਪਣੇ ਮੰਗੇ ਕੰਮ ਲਈ ਹੁੰਦਾ ਹੈ, ਅਤੇ ਬੈਂਕ ਕਦੇ ਇਸਨੂੰ ਕਿਸੇ ਨੂੰ ਦੱਸਣ ਲਈ ਨਹੀਂ ਕਹਿੰਦਾ।",
        todo: "OTP ਸਿਰਫ਼ ਉਸ ਐਪ ਵਿੱਚ ਟਾਈਪ ਕਰੋ ਜੋ ਤੁਸੀਂ ਵਰਤ ਰਹੇ ਹੋ। ਜੇ ਤੁਸੀਂ ਕੁਝ ਸ਼ੁਰੂ ਨਹੀਂ ਕੀਤਾ ਅਤੇ OTP ਆ ਜਾਵੇ, ਤਾਂ ਕੋਈ ਤੁਹਾਡਾ ਖਾਤਾ ਵਰਤਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰ ਰਿਹਾ ਹੈ: ਇਹ ਨਾ ਦੱਸੋ, ਅਤੇ ਕਾਰਡ ਉੱਤੇ ਛਪੇ ਨੰਬਰ ਉੱਤੇ ਬੈਂਕ ਨੂੰ ਫ਼ੋਨ ਕਰੋ।"
      },
      digital_arrest: {
        title: "\"CBI ਅਫ਼ਸਰ\" ਦੀ ਵੀਡੀਓ ਕਾਲ",
        ctx: "ਅਣਜਾਣ ਨੰਬਰ ਤੋਂ ਵੀਡੀਓ ਕਾਲ। ਕਾਲਰ ਨੇ ਵਰਦੀ ਪਾਈ ਹੈ ਅਤੇ ਪਿੱਛੇ ਝੰਡੇ ਵਾਲੇ ਦਫ਼ਤਰ ਵਿੱਚ ਬੈਠਾ ਹੈ।",
        who: "\"CBI ਅਫ਼ਸਰ ਵਰਮਾ\"",
        subject: "",
        text: "\"[[threat|ਤੁਹਾਡੇ ਨਾਮ ਉੱਤੇ ਨਸ਼ਿਆਂ ਅਤੇ 6 ਪਾਸਪੋਰਟਾਂ ਵਾਲਾ ਪਾਰਸਲ ਬੁੱਕ ਹੋਇਆ ਹੈ। ਤੁਹਾਡੇ ਖ਼ਿਲਾਫ਼ ਕੇਸ ਦਰਜ ਹੈ।]] [[urgent|ਇਸੇ ਵੀਡੀਓ ਕਾਲ ਉੱਤੇ ਰਹੋ, ਕਾਲ ਨਾ ਕੱਟੋ]], ਅਤੇ [[secret|ਕਿਸੇ ਨੂੰ ਨਾ ਦੱਸੋ, ਪਰਿਵਾਰ ਨੂੰ ਵੀ ਨਹੀਂ, ਉਨ੍ਹਾਂ ਉੱਤੇ ਵੀ ਨਜ਼ਰ ਹੈ]]। [[money|ਜਾਂਚ ਲਈ ₹3,50,000 ਇਸ RBI ਵੈਰੀਫ਼ਿਕੇਸ਼ਨ ਖਾਤੇ ਵਿੱਚ ਟ੍ਰਾਂਸਫ਼ਰ ਕਰੋ]]; ਜਾਂਚ ਤੋਂ ਬਾਅਦ ਵਾਪਸ ਮਿਲ ਜਾਣਗੇ।\"",
        why: "ਇਹ \"ਡਿਜੀਟਲ ਅਰੈਸਟ\" ਹੈ। ਕੋਈ ਪੁਲਿਸ, CBI ਜਾਂ ਅਦਾਲਤ ਵੀਡੀਓ ਕਾਲ ਉੱਤੇ ਕਿਸੇ ਨੂੰ ਗ੍ਰਿਫ਼ਤਾਰ ਨਹੀਂ ਕਰਦੀ, ਅਤੇ ਕੋਈ ਏਜੰਸੀ \"ਵੈਰੀਫ਼ਿਕੇਸ਼ਨ ਖਾਤੇ\" ਵਿੱਚ ਪੈਸੇ ਭੇਜਣ ਲਈ ਨਹੀਂ ਕਹਿੰਦੀ। ਵਰਦੀ, ਦਫ਼ਤਰ ਦਾ ਪਿਛੋਕੜ ਅਤੇ ਪਛਾਣ-ਪੱਤਰ ਸਭ ਨਕਲੀ ਹਨ। ਗੁਪਤਤਾ ਅਤੇ ਕਾਲ ਉੱਤੇ ਰੋਕੀ ਰੱਖਣਾ ਤੁਹਾਨੂੰ ਸੋਚਣ ਨਹੀਂ ਦਿੰਦਾ।",
        todo: "ਤੁਰੰਤ ਫ਼ੋਨ ਕੱਟੋ। ਅਸਲੀ ਅਫ਼ਸਰ WhatsApp ਉੱਤੇ ਫ਼ੋਨ ਨਹੀਂ ਕਰਦੇ। 1930 ਉੱਤੇ ਫ਼ੋਨ ਕਰੋ ਜਾਂ cybercrime.gov.in ਉੱਤੇ ਸ਼ਿਕਾਇਤ ਕਰੋ, ਅਤੇ ਤੁਰੰਤ ਕਿਸੇ ਸਾਥੀ ਜਾਂ ਪਰਿਵਾਰ ਦੇ ਜੀਅ ਨੂੰ ਦੱਸੋ।"
      },
      courier: {
        title: "ਕਾਲ: ਤੁਹਾਡਾ ਪਾਰਸਲ ਕਸਟਮਜ਼ ਵਿੱਚ ਰੁਕਿਆ ਹੈ",
        ctx: "ਪਹਿਲਾਂ ਰਿਕਾਰਡ ਕੀਤੀ ਆਵਾਜ਼, ਫਿਰ ਇੱਕ ਬੰਦਾ। ਤੁਸੀਂ ਵਿਦੇਸ਼ ਤੋਂ ਕੁਝ ਨਹੀਂ ਮੰਗਵਾਇਆ।",
        who: "\"SpeedParcel ਗਾਹਕ ਸੇਵਾ\"",
        subject: "",
        text: "\"ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ SpeedParcel ਦੇ ਕਸਟਮਜ਼ ਵਿਭਾਗ ਤੋਂ ਬੋਲ ਰਿਹਾ ਹਾਂ। [[threat|ਤੁਹਾਡੇ ਨਾਮ ਦਾ ਪਾਰਸਲ ਗ਼ੈਰ-ਕਾਨੂੰਨੀ ਚੀਜ਼ਾਂ ਕਾਰਨ ਕਸਟਮਜ਼ ਵਿੱਚ ਰੋਕਿਆ ਗਿਆ ਹੈ।]] ਪੁਲਿਸ ਕੇਸ ਤੋਂ ਬਚਣ ਲਈ ਅਫ਼ਸਰ ਨਾਲ ਗੱਲ ਕਰਨ ਵਾਸਤੇ [[urgent|ਹੁਣੇ 1 ਦਬਾਓ]], ਜਾਂ ਸਾਡੇ ਭੇਜੇ ਲਿੰਕ ਉੱਤੇ [[money|₹2,999 ਕਲੀਅਰੈਂਸ ਫ਼ੀਸ ਭਰੋ]]।\"",
        why: "ਕੋਰੀਅਰ ਕੰਪਨੀਆਂ ਗ਼ੈਰ-ਕਾਨੂੰਨੀ ਚੀਜ਼ਾਂ ਬਾਰੇ ਫ਼ੋਨ ਨਹੀਂ ਕਰਦੀਆਂ, ਅਤੇ ਕਸਟਮਜ਼ ਫ਼ੋਨ ਉੱਤੇ ਫ਼ੀਸ ਨਹੀਂ ਲੈਂਦਾ। 1 ਦਬਾਉਣ ਨਾਲ ਤੁਸੀਂ ਨਕਲੀ \"ਅਫ਼ਸਰ\" ਨਾਲ ਜੁੜਦੇ ਹੋ, ਜੋ ਫਿਰ ਡਿਜੀਟਲ ਅਰੈਸਟ ਜਾਂ ਭੁਗਤਾਨ ਦੀ ਮੰਗ ਕਰਦਾ ਹੈ।",
        todo: "ਕਾਲ ਕੱਟੋ। ਜੇ ਸੱਚਮੁੱਚ ਕੁਝ ਮੰਗਵਾਇਆ ਹੈ ਤਾਂ ਕੋਰੀਅਰ ਦੀ ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ ਉੱਤੇ ਟ੍ਰੈਕਿੰਗ ਨੰਬਰ ਵੇਖੋ। ਉਸ ਨੰਬਰ ਦੀ ਸੰਚਾਰ ਸਾਥੀ (ਚਕਸ਼ੂ) ਪੋਰਟਲ ਉੱਤੇ ਸ਼ਿਕਾਇਤ ਕਰੋ।"
      },
      task_job: {
        title: "Telegram ਨੌਕਰੀ: ਹੋਟਲਾਂ ਨੂੰ ਰੇਟਿੰਗ ਦੇ ਕੇ ਰੋਜ਼ ₹8,000",
        ctx: "ਪਿਛਲੇ ਹਫ਼ਤੇ ਤੁਸੀਂ ਆਨਲਾਈਨ ਨੌਕਰੀਆਂ ਲਈ ਅਰਜ਼ੀ ਦਿੱਤੀ, ਉਸ ਤੋਂ ਬਾਅਦ ਆਇਆ Telegram ਮੈਸੇਜ।",
        who: "HR ਪ੍ਰਿਆ - ਆਨਲਾਈਨ ਜੌਬਜ਼",
        subject: "",
        text: "ਵਧਾਈਆਂ, ਤੁਹਾਡੀ ਚੋਣ ਹੋ ਗਈ ਹੈ! [[prize|ਆਨਲਾਈਨ ਹੋਟਲਾਂ ਨੂੰ ਰੇਟਿੰਗ ਦੇ ਕੇ ਰੋਜ਼ ₹3,000 ਤੋਂ ₹8,000 ਕਮਾਓ]], ਸਿਰਫ਼ 20 ਮਿੰਟ ਦਾ ਕੰਮ। ਪਹਿਲੇ 3 ਕੰਮ ਮੁਫ਼ਤ। ਪ੍ਰੀਮੀਅਮ ਕੰਮਾਂ ਲਈ [[money|₹5,000 ਜਮ੍ਹਾਂ ਕਰੋ ਅਤੇ ਇੱਕ ਘੰਟੇ ਵਿੱਚ ₹7,500 ਵਾਪਸ ਲਓ]]। [[urgent|ਅੱਜ ਸਿਰਫ਼ 4 ਸੀਟਾਂ ਬਾਕੀ!]]",
        why: "ਇਹ ਟਾਸਕ ਸਕੈਮ ਹੈ। ਭਰੋਸਾ ਬਣਾਉਣ ਲਈ ਸ਼ੁਰੂਆਤੀ ਛੋਟੇ ਭੁਗਤਾਨ ਅਸਲੀ ਹੁੰਦੇ ਹਨ। ਫਿਰ ਪ੍ਰੀਮੀਅਮ ਕੰਮਾਂ ਲਈ ਤੁਸੀਂ \"ਜਮ੍ਹਾਂ\" ਕਰਦੇ ਹੋ ਅਤੇ ਪੈਸੇ ਕਦੇ ਵਾਪਸ ਨਹੀਂ ਆਉਂਦੇ। ਕੋਈ ਅਸਲੀ ਨੌਕਰੀ ਕਲਿੱਕ ਕਰਨ ਦੇ ਪੈਸੇ ਨਹੀਂ ਦਿੰਦੀ, ਅਤੇ ਕੋਈ ਮਾਲਕ ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰਨ ਲਈ ਨਹੀਂ ਕਹਿੰਦਾ।",
        todo: "ਕੁਝ ਜਮ੍ਹਾਂ ਨਾ ਕਰੋ। ਖਾਤਾ ਬਲੌਕ ਕਰਕੇ ਰਿਪੋਰਟ ਕਰੋ। ਜੇ ਪਹਿਲਾਂ ਹੀ ਪੈਸੇ ਦੇ ਦਿੱਤੇ ਹਨ ਤਾਂ ਤੁਰੰਤ 1930 ਉੱਤੇ ਫ਼ੋਨ ਕਰੋ; ਪਹਿਲਾ ਘੰਟਾ ਸਭ ਤੋਂ ਅਹਿਮ ਹੈ।"
      },
      vendor_real: {
        title: "ਜਾਣੇ-ਪਛਾਣੇ ਵੈਂਡਰ ਵੱਲੋਂ ਭੁਗਤਾਨ ਦੀ ਯਾਦ",
        ctx: "ਜਿਸ ਪੈਕੇਜਿੰਗ ਵੈਂਡਰ ਨੂੰ ਤੁਸੀਂ ਹਰ ਮਹੀਨੇ ਪੈਸੇ ਦਿੰਦੇ ਹੋ, ਉਸਦੇ ਆਮ ਪਤੇ ਤੋਂ ਈਮੇਲ।",
        who: "Sunrise Packaging ਬਿਲਿੰਗ",
        subject: "ਭੁਗਤਾਨ ਯਾਦ - ਇਨਵੌਇਸ SP/26-27/0431, 10 ਅਕਤੂਬਰ ਤੱਕ",
        text: "ਪਿਆਰੀ ਮੈਰੀਡੀਅਨ ਟੈਕਸਟਾਈਲਜ਼ ਟੀਮ, ਇਹ ਨਿਮਰ ਯਾਦ ਹੈ ਕਿ ₹86,000 ਦਾ ਇਨਵੌਇਸ SP/26-27/0431 10 ਅਕਤੂਬਰ ਤੱਕ ਭਰਨਾ ਹੈ। [[ok|ਸਾਡੇ ਬੈਂਕ ਵੇਰਵੇ ਨਹੀਂ ਬਦਲੇ ਅਤੇ ਤੁਹਾਡੇ ਕੋਲ ਮੌਜੂਦ ਇਨਵੌਇਸ ਉੱਤੇ ਛਪੇ ਹਨ।]] [[ok|ਜੇ ਸਾਡਾ ਬੈਂਕ ਖਾਤਾ ਬਦਲਣ ਲਈ ਕਹਿੰਦੀ ਕੋਈ ਈਮੇਲ ਆਵੇ, ਤਾਂ ਭੁਗਤਾਨ ਤੋਂ ਪਹਿਲਾਂ ਆਪਣੇ ਰਿਕਾਰਡ ਵਾਲੇ ਨੰਬਰ ਉੱਤੇ ਸਾਡੇ ਦਫ਼ਤਰ ਨੂੰ ਫ਼ੋਨ ਕਰੋ।]] ਧੰਨਵਾਦ।",
        why: "ਜਾਣੇ ਵੈਂਡਰ ਦੇ ਪਤੇ ਤੋਂ ਆਮ ਯਾਦ, ਕੋਈ ਨਵੇਂ ਬੈਂਕ ਵੇਰਵੇ ਨਹੀਂ, ਧਮਕੀ ਨਹੀਂ, ਅਤੇ ਕੁਝ ਵੱਖਰਾ ਲੱਗੇ ਤਾਂ ਵੈਂਡਰ ਆਪ ਫ਼ੋਨ ਉੱਤੇ ਪੱਕਾ ਕਰਨ ਲਈ ਕਹਿੰਦਾ ਹੈ। ਅਸਲੀ ਭਾਈਵਾਲ ਇਸੇ ਤਰ੍ਹਾਂ ਵਰਤਦਾ ਹੈ।",
        todo: "ਆਪਣੇ ਰਿਕਾਰਡ ਵਿਚਲੇ ਖਾਤੇ ਵਿੱਚ ਆਮ ਤਰੀਕੇ ਨਾਲ ਭੁਗਤਾਨ ਕਰੋ। ਬਦਲਾਅ ਦੀ ਕੋਈ ਵੀ ਬੇਨਤੀ ਜਾਣੇ ਫ਼ੋਨ ਨੰਬਰ ਉੱਤੇ ਪੱਕੀ ਕਰੋ।"
      },
      deepfake: {
        title: "MD ਦੀ ਆਵਾਜ਼ ਜ਼ਰੂਰੀ ਟ੍ਰਾਂਸਫ਼ਰ ਮੰਗਦੀ ਹੈ",
        ctx: "ਅਣਜਾਣ ਨੰਬਰ ਤੋਂ ਫ਼ੋਨ। ਆਵਾਜ਼ ਬਿਲਕੁਲ ਤੁਹਾਡੇ MD ਵਰਗੀ, ਪਿੱਛੇ ਹਵਾਈ ਅੱਡੇ ਦਾ ਰੌਲਾ।",
        who: "\"ਰਾਜੇਸ਼ ਸਰ\" (MD ਦੀ ਆਵਾਜ਼)",
        subject: "",
        text: "\"ਹੈਲੋ, ਮੈਂ ਹੀ ਹਾਂ, ਹਵਾਈ ਅੱਡੇ ਉੱਤੇ ਹਾਂ, ਰੌਲਾ ਸੁਣ ਰਿਹਾ ਹੈ ਨਾ। [[urgent|ਮੈਨੂੰ ਹੁਣੇ ਦੇ ਹੁਣੇ ₹2,00,000 ਟ੍ਰਾਂਸਫ਼ਰ ਕਰਵਾਉਣੇ ਹਨ]] ਦੁਬਈ ਆਰਡਰ ਲਈ ਇੱਕ ਨਵੇਂ ਸਪਲਾਇਰ ਨੂੰ। [[newacct|ਖਾਤਾ ਨੰਬਰ ਮੈਂ WhatsApp ਕਰਦਾ ਹਾਂ।]] [[secret|ਮੈਨੂੰ ਮੁੜ ਫ਼ੋਨ ਨਾ ਕਰੀਂ, ਫ਼ੋਨ ਫ਼ਲਾਈਟ ਮੋਡ ਉੱਤੇ ਜਾ ਰਿਹਾ ਹੈ, ਮੇਰੇ ਉੱਤਰਨ ਤੋਂ ਪਹਿਲਾਂ ਕਰ ਦੇਈਂ।]]\"",
        why: "AI ਕਿਸੇ ਭਾਸ਼ਣ ਜਾਂ ਵੀਡੀਓ ਦੀ 30 ਸਕਿੰਟ ਦੀ ਕਲਿੱਪ ਤੋਂ ਕਿਸੇ ਦੀ ਵੀ ਆਵਾਜ਼ ਨਕਲ ਕਰ ਸਕਦੀ ਹੈ। ਨਕਲੀ ਆਵਾਜ਼ + ਨਵਾਂ ਖਾਤਾ ਨੰਬਰ + \"ਮੁੜ ਫ਼ੋਨ ਨਾ ਕਰੀਂ\" ਡੀਪਫ਼ੇਕ ਸਕੈਮ ਹੈ। ਪਿਛਲਾ ਰੌਲਾ ਜਾਣ-ਬੁੱਝ ਕੇ ਪਾਇਆ ਜਾਂਦਾ ਹੈ।",
        todo: "ਕਹੋ ਕਿ ਤੁਸੀਂ ਮੁੜ ਫ਼ੋਨ ਕਰੋਗੇ, ਫਿਰ ਸੇਵ ਨੰਬਰ ਉੱਤੇ MD ਨੂੰ ਫ਼ੋਨ ਕਰੋ ਜਾਂ ਕਿਸੇ ਦੂਜੇ ਸੀਨੀਅਰ ਤੋਂ ਪੱਕਾ ਕਰੋ। ਫ਼ੋਨ ਉੱਤੇ ਜ਼ਰੂਰੀ ਬੇਨਤੀਆਂ ਲਈ ਟੀਮ ਵਿੱਚ ਇੱਕ ਗੁਪਤ ਸ਼ਬਦ ਤੈਅ ਕਰੋ। ਆਮ ਮਨਜ਼ੂਰੀ ਤੋਂ ਬਿਨਾਂ ਕੋਈ ਟ੍ਰਾਂਸਫ਼ਰ ਨਹੀਂ।"
      },
      qr_receive: {
        title: "ਪੈਸੇ \"ਲੈਣ\" ਲਈ ਖ਼ਰੀਦਦਾਰ QR ਕੋਡ ਭੇਜਦਾ ਹੈ",
        ctx: "ਤੁਸੀਂ ਇੱਕ ਕਲਾਸੀਫ਼ਾਈਡ ਸਾਈਟ ਉੱਤੇ 12 ਪੁਰਾਣੀਆਂ ਦਫ਼ਤਰੀ ਕੁਰਸੀਆਂ ਦਾ ਇਸ਼ਤਿਹਾਰ ਦਿੱਤਾ। ਇੱਕ ਖ਼ਰੀਦਦਾਰ WhatsApp ਉੱਤੇ ਲਿਖਦਾ ਹੈ।",
        who: "ਦਫ਼ਤਰੀ ਕੁਰਸੀਆਂ ਦਾ ਖ਼ਰੀਦਦਾਰ",
        subject: "",
        text: "ਹਾਇ, ₹18,000 ਵਿੱਚ 12 ਪੁਰਾਣੀਆਂ ਦਫ਼ਤਰੀ ਕੁਰਸੀਆਂ ਦਾ ਤੁਹਾਡਾ ਇਸ਼ਤਿਹਾਰ ਵੇਖਿਆ। ਮੈਂ ਪੂਰੀ ਰਕਮ ਹੁਣੇ ਦਿੰਦਾ ਹਾਂ। [[upi|ਮੈਂ QR ਕੋਡ ਭੇਜਿਆ ਹੈ: ਪੈਸੇ ਲੈਣ ਲਈ ਇਸਨੂੰ ਸਕੈਨ ਕਰਕੇ ਆਪਣਾ UPI PIN ਪਾਓ।]] [[odd|ਮੈਂ ਬਾਹਰ ਤਾਇਨਾਤ ਫ਼ੌਜੀ ਅਫ਼ਸਰ ਹਾਂ, ਇਸ ਲਈ ਮੇਰਾ ਦੋਸਤ ਕੁਰਸੀਆਂ ਲੈ ਜਾਵੇਗਾ।]] [[urgent|ਕਿਰਪਾ ਕਰਕੇ ਅਗਲੇ 5 ਮਿੰਟਾਂ ਵਿੱਚ ਕਰੋ, ਮੇਰਾ ਨੈੱਟਵਰਕ ਕਮਜ਼ੋਰ ਹੈ।]]",
        why: "ਪੈਸੇ ਲੈਣ ਲਈ ਤੁਸੀਂ ਕਦੇ QR ਸਕੈਨ ਨਹੀਂ ਕਰਦੇ ਜਾਂ PIN ਨਹੀਂ ਪਾਉਂਦੇ। ਸਕੈਨ ਕਰਕੇ PIN ਪਾਉਣ ਨਾਲ ਤੁਸੀਂ ਸਾਹਮਣੇ ਵਾਲੇ ਨੂੰ ਪੈਸੇ ਦਿੰਦੇ ਹੋ। \"ਫ਼ੌਜੀ ਅਫ਼ਸਰ\" ਦੀ ਕਹਾਣੀ ਅਤੇ ਕਾਹਲੀ ਕਲਾਸੀਫ਼ਾਈਡ ਸਾਈਟਾਂ ਦੀਆਂ ਆਮ ਚਾਲਾਂ ਹਨ।",
        todo: "ਨਾਂਹ ਕਰੋ। ਖ਼ਰੀਦਦਾਰ ਨੂੰ ਆਪਣੀ UPI ID ਉੱਤੇ ਪੈਸੇ ਭੇਜਣ ਲਈ ਕਹੋ; ਪੈਸੇ ਲੈਣ ਲਈ ਤੁਹਾਨੂੰ ਕੁਝ ਨਹੀਂ ਕਰਨਾ ਪੈਂਦਾ। ਐਪ ਵਿੱਚ ਨੰਬਰ ਰਿਪੋਰਟ ਕਰੋ।"
      },
      fake_care: {
        title: "ਸਰਚ ਵਿੱਚ ਮਿਲਿਆ ਕਸਟਮਰ ਕੇਅਰ ਨੰਬਰ",
        ctx: "ਰਿਫ਼ੰਡ ਨਹੀਂ ਆਇਆ। ਤੁਸੀਂ ਆਨਲਾਈਨ ਬੈਂਕ ਦਾ ਕਸਟਮਰ ਕੇਅਰ ਲੱਭਿਆ ਅਤੇ ਪਹਿਲੇ ਦਿਸੇ ਨੰਬਰ ਉੱਤੇ ਫ਼ੋਨ ਕੀਤਾ।",
        who: "\"NovaBank ਕਸਟਮਰ ਕੇਅਰ\"",
        subject: "",
        text: "\"NovaBank ਕਸਟਮਰ ਕੇਅਰ ਨੂੰ ਫ਼ੋਨ ਕਰਨ ਲਈ ਧੰਨਵਾਦ। ₹3,200 ਦੇ ਰਿਫ਼ੰਡ ਲਈ ਤੁਹਾਡੀ ਪੁਸ਼ਟੀ ਕਰਨੀ ਪਵੇਗੀ। [[otp|ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ 16 ਅੰਕਾਂ ਦਾ ਕਾਰਡ ਨੰਬਰ, ਮਿਆਦ ਦੀ ਤਾਰੀਖ਼ ਅਤੇ ਹੁਣੇ ਆਉਣ ਵਾਲਾ OTP ਦੱਸੋ।]] [[remote|ਮੇਰਾ ਭੇਜਿਆ Quick Support ਐਪ ਵੀ ਇੰਸਟਾਲ ਕਰੋ ਤਾਂ ਜੋ ਮੈਂ ਜਲਦੀ ਕੰਮ ਕਰ ਸਕਾਂ।]]\"",
        why: "ਤੁਸੀਂ ਸਰਚ ਨਤੀਜਿਆਂ ਜਾਂ ਨਕਲੀ ਵੈੱਬਸਾਈਟ ਉੱਤੇ ਪਾਏ ਨਕਲੀ ਨੰਬਰ ਉੱਤੇ ਫ਼ੋਨ ਕੀਤਾ। ਕੋਈ ਬੈਂਕ ਪੂਰਾ ਕਾਰਡ ਨੰਬਰ, ਮਿਆਦ, CVV ਜਾਂ OTP ਨਹੀਂ ਮੰਗਦਾ, ਅਤੇ ਕਦੇ ਰਿਮੋਟ-ਕੰਟਰੋਲ ਐਪ ਇੰਸਟਾਲ ਕਰਨ ਲਈ ਨਹੀਂ ਕਹਿੰਦਾ।",
        todo: "ਕਾਲ ਕੱਟੋ। ਸਿਰਫ਼ ਕਾਰਡ ਦੇ ਪਿੱਛੇ ਛਪਿਆ ਜਾਂ ਅਧਿਕਾਰਤ ਐਪ ਵਿਚਲਾ ਨੰਬਰ ਵਰਤੋ। ਕਾਲਰ ਦੇ ਕਹਿਣ ਉੱਤੇ ਕਦੇ ਐਪ ਇੰਸਟਾਲ ਨਾ ਕਰੋ। ਜੇ ਕੁਝ ਦੱਸ ਦਿੱਤਾ ਹੈ ਤਾਂ ਤੁਰੰਤ ਐਪ ਵਿੱਚ ਕਾਰਡ ਬਲੌਕ ਕਰੋ ਅਤੇ 1930 ਉੱਤੇ ਫ਼ੋਨ ਕਰੋ।"
      },
      hr_real: {
        title: "HR ਵੱਲੋਂ ਦੀਵਾਲੀ ਛੁੱਟੀਆਂ ਦੀ ਸੂਚੀ",
        ctx: "ਕੰਪਨੀ ਦੇ HR ਪਤੇ ਤੋਂ ਸਾਰੇ ਕਰਮਚਾਰੀਆਂ ਨੂੰ ਈਮੇਲ।",
        who: "HR ਵਿਭਾਗ",
        subject: "ਦੀਵਾਲੀ ਹਫ਼ਤੇ ਦੀਆਂ ਛੁੱਟੀਆਂ ਦੀ ਸੂਚੀ",
        text: "ਸਭ ਨੂੰ ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਦੀਵਾਲੀ ਲਈ 7 ਤੋਂ 9 ਨਵੰਬਰ ਦਫ਼ਤਰ ਬੰਦ ਰਹੇਗਾ। [[ok|ਛੁੱਟੀਆਂ ਦੀ ਪੂਰੀ ਸੂਚੀ ਇੰਟਰਾਨੈੱਟ ਦੇ HR ਪੰਨੇ ਉੱਤੇ ਹੈ]], ਉਹੀ ਪੰਨਾ ਜੋ ਤੁਸੀਂ ਛੁੱਟੀ ਲਈ ਵਰਤਦੇ ਹੋ। [[ok|ਤੁਹਾਨੂੰ ਕੁਝ ਕਰਨ ਦੀ ਲੋੜ ਨਹੀਂ।]] ਸਭ ਨੂੰ ਖ਼ੁਸ਼ੀਆਂ ਭਰੀ ਅਤੇ ਸੁਰੱਖਿਅਤ ਦੀਵਾਲੀ ਮੁਬਾਰਕ। - HR ਟੀਮ",
        why: "ਕੰਪਨੀ ਦੇ ਆਪਣੇ HR ਪਤੇ ਤੋਂ ਭੇਜੀ, ਸਿਰਫ਼ ਜਾਣਕਾਰੀ, ਬਾਹਰੀ ਸਾਈਟ ਦਾ ਕੋਈ ਲਿੰਕ ਨਹੀਂ, ਖੋਲ੍ਹਣ ਲਈ ਅਟੈਚਮੈਂਟ ਨਹੀਂ ਅਤੇ ਭਰਨ ਲਈ ਕੁਝ ਨਹੀਂ। ਅਸਲੀ ਸੂਚਨਾਵਾਂ ਨੂੰ ਕਾਹਲੀ ਦੀ ਲੋੜ ਨਹੀਂ।",
        todo: "ਕੁਝ ਨਹੀਂ ਕਰਨਾ। ਜੇ ਛੁੱਟੀਆਂ ਜਾਂ ਬੋਨਸ ਬਾਰੇ ਕੋਈ ਈਮੇਲ ਲੌਗਇਨ ਕਰਨ ਜਾਂ ਬੈਂਕ ਵੇਰਵੇ ਭਰਨ ਲਈ ਕਹੇ, ਤਾਂ ਇਸਨੂੰ ਖ਼ਤਰੇ ਦਾ ਨਿਸ਼ਾਨ ਮੰਨੋ ਅਤੇ HR ਤੋਂ ਆਹਮੋ-ਸਾਹਮਣੇ ਪੁੱਛੋ।"
      },
      screen_share: {
        title: "\"UPI ਹੈਲਪਲਾਈਨ\" ਤੁਹਾਡੀ ਸਕ੍ਰੀਨ ਵੇਖਣਾ ਚਾਹੁੰਦੀ ਹੈ",
        ctx: "UPI ਭੁਗਤਾਨ ਫ਼ੇਲ੍ਹ ਹੋਇਆ ਅਤੇ ਤੁਸੀਂ ਸੋਸ਼ਲ ਮੀਡੀਆ ਉੱਤੇ ਸ਼ਿਕਾਇਤ ਕੀਤੀ, ਉਸਦੇ ਕੁਝ ਮਿੰਟਾਂ ਬਾਅਦ ਫ਼ੋਨ ਆਇਆ।",
        who: "\"UPI ਹੈਲਪਲਾਈਨ\"",
        subject: "",
        text: "\"ਸਰ, ਤੁਹਾਡਾ ₹1,500 ਦਾ UPI ਭੁਗਤਾਨ ਫਸਿਆ ਹੋਇਆ ਹੈ। ਮੈਂ 2 ਮਿੰਟਾਂ ਵਿੱਚ ਠੀਕ ਕਰ ਦਿੰਦਾ ਹਾਂ। [[remote|ਮੇਰੇ ਭੇਜੇ ਲਿੰਕ ਤੋਂ ਸਕ੍ਰੀਨ-ਸ਼ੇਅਰਿੰਗ ਐਪ ਇੰਸਟਾਲ ਕਰੋ ਅਤੇ ਸਕ੍ਰੀਨ ਉੱਤੇ ਦਿਸਦਾ 9 ਅੰਕਾਂ ਦਾ ਕੋਡ ਮੈਨੂੰ ਪੜ੍ਹ ਕੇ ਸੁਣਾਓ।]] ਬੈਂਕਿੰਗ ਐਪ ਖੁੱਲ੍ਹੀ ਰੱਖੋ, ਮੈਂ ਸਿਰਫ਼ ਵੇਖਣਾ ਹੈ। [[otp|OTP ਆਵੇ ਤਾਂ ਕਾਲ ਨਾ ਕੱਟਣਾ, ਮੈਂ ਤੁਹਾਨੂੰ ਦੱਸਾਂਗਾ।]]\"",
        why: "ਰਿਮੋਟ-ਐਕਸੈੱਸ ਅਤੇ ਸਕ੍ਰੀਨ-ਸ਼ੇਅਰਿੰਗ ਐਪ ਨਾਲ ਕਾਲਰ ਤੁਹਾਡਾ ਫ਼ੋਨ ਵੇਖ ਅਤੇ ਚਲਾ ਸਕਦਾ ਹੈ; 9 ਅੰਕਾਂ ਦਾ ਕੋਡ ਉਸਨੂੰ ਪੂਰੀ ਪਹੁੰਚ ਦਿੰਦਾ ਹੈ। OTP ਨਾਲ ਮਿਲ ਕੇ ਉਹ ਕੁਝ ਮਿੰਟਾਂ ਵਿੱਚ ਖਾਤਾ ਖ਼ਾਲੀ ਕਰ ਸਕਦਾ ਹੈ। ਅਸਲੀ ਹੈਲਪਲਾਈਨਾਂ ਕਦੇ ਤੁਹਾਡੀ ਸਕ੍ਰੀਨ ਵੇਖਣ ਲਈ ਨਹੀਂ ਕਹਿੰਦੀਆਂ।",
        todo: "ਕਾਲ ਕੱਟੋ ਅਤੇ ਇੰਸਟਾਲ ਕੀਤੀ ਐਪ ਹਟਾਓ। ਸ਼ਿਕਾਇਤ ਸਿਰਫ਼ ਅਧਿਕਾਰਤ UPI ਜਾਂ ਬੈਂਕ ਐਪ ਵਿੱਚ ਕਰੋ। ਜੇ ਪੈਸੇ ਚਲੇ ਗਏ ਹਨ ਤਾਂ ਤੁਰੰਤ 1930 ਅਤੇ ਆਪਣੇ ਬੈਂਕ ਨੂੰ ਫ਼ੋਨ ਕਰੋ।"
      },
      invoice_exe: {
        title: ".exe ਨਾਲ ਖ਼ਤਮ ਹੋਣ ਵਾਲਾ ਇਨਵੌਇਸ ਅਟੈਚਮੈਂਟ",
        ctx: "ਜਿਸ ਕੰਪਨੀ ਤੋਂ ਖ਼ਰੀਦਦਾਰੀ ਯਾਦ ਨਹੀਂ, ਉਸ ਵੱਲੋਂ ਅਕਾਊਂਟਸ ਮੇਲਬਾਕਸ ਵਿੱਚ ਈਮੇਲ।",
        who: "Global Trade Supplies",
        subject: "ਇਨਵੌਇਸ ਨੱਥੀ ਹੈ - ਕਿਰਪਾ ਕਰਕੇ ਕਾਰਵਾਈ ਕਰੋ",
        text: "[[odd|ਪਿਆਰੇ ਸ਼੍ਰੀਮਾਨ,]] ਪਿਛਲੇ ਹਫ਼ਤੇ ਭੇਜੇ ਮਾਲ ਦਾ ਇਨਵੌਇਸ ਨੱਥੀ ਹੈ। [[attach|ਅਟੈਚਮੈਂਟ: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|ਕਿਰਪਾ ਕਰਕੇ ਅੱਜ ਹੀ ਭੁਗਤਾਨ ਕਰੋ]] ਅਤੇ ਦੱਸੋ। [[odd|ਸਤਿਕਾਰ ਸਹਿਤ, ਅਕਾਊਂਟਸ ਵਿਭਾਗ।]]",
        why: ".exe ਨਾਲ ਖ਼ਤਮ ਹੋਣ ਵਾਲੀ ਫ਼ਾਈਲ PDF ਨਹੀਂ, ਪ੍ਰੋਗਰਾਮ ਹੈ; ਨਾਮ ਵਿਚਲਾ \".pdf\" ਸਿਰਫ਼ ਭੇਸ ਹੈ। ਇਸਨੂੰ ਖੋਲ੍ਹਣ ਨਾਲ ਮਾਲਵੇਅਰ ਜਾਂ ਰੈਨਸਮਵੇਅਰ ਇੰਸਟਾਲ ਹੁੰਦਾ ਹੈ ਜੋ ਦਫ਼ਤਰ ਦਾ ਹਰ ਕੰਪਿਊਟਰ ਲੌਕ ਕਰ ਸਕਦਾ ਹੈ। ਧੁੰਦਲਾ ਸੰਬੋਧਨ ਅਤੇ ਕੰਪਨੀ ਦੇ ਦਸਤਖ਼ਤ ਨਾ ਹੋਣਾ ਵਾਧੂ ਚਿਤਾਵਨੀਆਂ ਹਨ।",
        todo: "ਅਟੈਚਮੈਂਟ ਨਾ ਖੋਲ੍ਹੋ। ਈਮੇਲ ਦੀ IT ਨੂੰ ਸ਼ਿਕਾਇਤ ਕਰੋ। ਰਿਕਾਰਡ ਵੇਖੋ: ਕੀ ਤੁਸੀਂ ਸੱਚਮੁੱਚ ਇਸ ਕੰਪਨੀ ਤੋਂ ਖ਼ਰੀਦਿਆ ਸੀ? ਅਜਿਹੀਆਂ ਚਾਲਾਂ ਦਿਸਣ ਲਈ ਦਫ਼ਤਰੀ ਕੰਪਿਊਟਰਾਂ ਉੱਤੇ \"ਫ਼ਾਈਲ ਐਕਸਟੈਂਸ਼ਨ ਦਿਖਾਓ\" ਚਾਲੂ ਕਰੋ।"
      },
      echallan: {
        title: "ਐਪ ਲਿੰਕ ਵਾਲਾ ਟ੍ਰੈਫ਼ਿਕ ਈ-ਚਲਾਨ SMS",
        ctx: "ਸ਼ਾਮ ਨੂੰ ਦਫ਼ਤਰ ਦੇ ਡਰਾਈਵਰ ਦੇ ਫ਼ੋਨ ਉੱਤੇ SMS।",
        who: "",
        subject: "",
        text: "ਟ੍ਰੈਫ਼ਿਕ ਈ-ਚਲਾਨ: ਤੁਹਾਡੇ ਵਾਹਨ KA-05-XX-1234 ਵੱਲੋਂ 1 ਅਕਤੂਬਰ ਨੂੰ ਸਿਗਨਲ ਤੋੜਨਾ ਦਰਜ ਹੋਇਆ ਹੈ। [[money|ਜੁਰਮਾਨਾ ₹1,000।]] ਦੁੱਗਣੇ ਜੁਰਮਾਨੇ ਅਤੇ ਅਦਾਲਤੀ ਸੰਮਨ ਤੋਂ ਬਚਣ ਲਈ [[urgent|24 ਘੰਟਿਆਂ ਵਿੱਚ ਭਰੋ]]। [[link|ਅਧਿਕਾਰਤ ਚਲਾਨ ਐਪ ਡਾਊਨਲੋਡ ਕਰੋ: echallan-pay.example.net/app.apk]]",
        why: "ਅਸਲੀ ਈ-ਚਲਾਨ ਮੈਸੇਜ ਨਿੱਜੀ ਮੋਬਾਈਲ ਨੰਬਰ ਤੋਂ ਨਹੀਂ, ਸਰਕਾਰੀ ਸੈਂਡਰ ID ਤੋਂ ਆਉਂਦੇ ਹਨ, ਅਤੇ ਕਦੇ .apk ਫ਼ਾਈਲ ਡਾਊਨਲੋਡ ਕਰਨ ਲਈ ਨਹੀਂ ਕਹਿੰਦੇ। ਇਹ APK ਤੁਹਾਡੇ SMS ਅਤੇ OTP ਪੜ੍ਹਨ ਵਾਲੀ ਖ਼ਤਰਨਾਕ ਐਪ ਹੈ।",
        todo: "ਮੈਸੇਜ ਮਿਟਾਓ। ਚਲਾਨ ਸਿਰਫ਼ ਅਧਿਕਾਰਤ ਸਰਕਾਰੀ ਈ-ਚਲਾਨ ਵੈੱਬਸਾਈਟ ਜਾਂ ਰਾਜ ਪੁਲਿਸ ਦੀ ਐਪ ਵਿੱਚ ਵੇਖੋ। ਉਸ ਨੰਬਰ ਦੀ ਸੰਚਾਰ ਸਾਥੀ (ਚਕਸ਼ੂ) ਉੱਤੇ ਸ਼ਿਕਾਇਤ ਕਰੋ।"
      },
      parcel_real: {
        title: "ਉਮੀਦ ਵਾਲੇ ਪਾਰਸਲ ਦੀ ਡਿਲੀਵਰੀ ਜਾਣਕਾਰੀ",
        ctx: "ਪਿਛਲੇ ਹਫ਼ਤੇ ਤੁਸੀਂ ਪੈਕੇਜਿੰਗ ਸਮਾਨ ਮੰਗਵਾਇਆ ਸੀ। ਇਹ SMS ਆਉਂਦਾ ਹੈ।",
        who: "",
        subject: "",
        text: "SpeedParcel: Sunrise Packaging ਵੱਲੋਂ ਤੁਹਾਡੀ ਸ਼ਿਪਮੈਂਟ SP48213 [[ok|ਅੱਜ ਦੁਪਹਿਰ 2 ਤੋਂ 5 ਵਜੇ ਵਿਚਕਾਰ ਪਹੁੰਚ ਜਾਵੇਗੀ।]] [[ok|ਕੋਈ ਭੁਗਤਾਨ ਬਕਾਇਆ ਨਹੀਂ।]] [[ok|ਟ੍ਰੈਕ ਕਰਨ ਲਈ ਸਾਡੀ ਵੈੱਬਸਾਈਟ ਜਾਂ ਐਪ ਉੱਤੇ ਸ਼ਿਪਮੈਂਟ ਨੰਬਰ ਵਰਤੋ।]]",
        why: "ਰਜਿਸਟਰਡ ਸੈਂਡਰ ID ਤੋਂ ਭੇਜਿਆ (ਨਿੱਜੀ ਨੰਬਰ ਨਹੀਂ), ਉਮੀਦ ਵਾਲੇ ਪਾਰਸਲ ਨਾਲ ਮੇਲ ਖਾਂਦਾ, ਪੈਸੇ ਨਹੀਂ ਮੰਗਦਾ ਅਤੇ ਟੈਪ ਕਰਨ ਲਈ ਲਿੰਕ ਨਹੀਂ ਦਿੰਦਾ। ਅਸਲੀ ਡਿਲੀਵਰੀ ਮੈਸੇਜ ਸਿਰਫ਼ ਜਾਣਕਾਰੀ ਦਿੰਦਾ ਹੈ।",
        todo: "ਕੁਝ ਨਹੀਂ ਕਰਨਾ। ਜੇ ਪਾਰਸਲ ਦਾ ਮੈਸੇਜ ਫ਼ੀਸ, ਲਿੰਕ ਜਾਂ ਐਪ ਮੰਗੇ, ਤਾਂ ਰੁਕੋ ਅਤੇ ਸ਼ਿਪਮੈਂਟ ਨੰਬਰ ਨਾਲ ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ ਉੱਤੇ ਵੇਖੋ।"
      },
      kyc: {
        title: "KYC ਮੁੱਕ ਗਿਆ, ਖਾਤਾ ਅੱਜ ਬੰਦ",
        ctx: "ਰਾਤ ਨੂੰ ਮਾਲਕ ਦੇ ਫ਼ੋਨ ਉੱਤੇ SMS।",
        who: "",
        subject: "",
        text: "ਪਿਆਰੇ ਗਾਹਕ, ਤੁਹਾਡਾ KYC ਮੁੱਕ ਜਾਣ ਕਾਰਨ [[threat|ਤੁਹਾਡਾ NovaBank ਖਾਤਾ ਅੱਜ ਬੰਦ ਹੋ ਜਾਵੇਗਾ]]। [[link|novabank-kyc-update.example.net]] ਉੱਤੇ [[urgent|ਤੁਰੰਤ ਅੱਪਡੇਟ ਕਰੋ]] ਜਾਂ [[sender|ਸਾਡੇ ਅਫ਼ਸਰ ਨੂੰ 94XXX XXX51 ਉੱਤੇ ਫ਼ੋਨ ਕਰੋ]]।",
        why: "ਬੈਂਕ ਕਦੇ ਨਿੱਜੀ ਮੋਬਾਈਲ ਨੰਬਰ ਤੋਂ KYC ਲਿੰਕ ਨਹੀਂ ਭੇਜਦੇ ਅਤੇ ਕੁਝ ਘੰਟਿਆਂ ਵਿੱਚ ਖਾਤਾ ਬੰਦ ਨਹੀਂ ਕਰਦੇ। ਲਿੰਕ ਨਕਲੀ ਬੈਂਕ ਪੰਨਾ ਖੋਲ੍ਹਦਾ ਹੈ ਜੋ ਤੁਹਾਡਾ ਲੌਗਇਨ ਅਤੇ OTP ਚੋਰੀ ਕਰਦਾ ਹੈ; \"ਅਫ਼ਸਰ\" ਐਪ ਇੰਸਟਾਲ ਕਰਨ ਲਈ ਕਹਿੰਦਾ ਹੈ।",
        todo: "ਲਿੰਕ ਟੈਪ ਨਾ ਕਰੋ, ਫ਼ੋਨ ਵੀ ਨਾ ਕਰੋ। ਜੇ ਸੱਚਮੁੱਚ KYC ਬਕਾਇਆ ਹੈ ਤਾਂ ਬੈਂਕ ਦੀ ਆਪਣੀ ਐਪ ਜਾਂ ਬ੍ਰਾਂਚ ਦੱਸੇਗੀ। SMS ਦੀ ਸੰਚਾਰ ਸਾਥੀ (ਚਕਸ਼ੂ) ਉੱਤੇ ਸ਼ਿਕਾਇਤ ਕਰੋ।"
      },
      sim_swap: {
        title: "ਕਾਲ: ਤੁਹਾਡਾ SIM ਬੰਦ ਹੋ ਜਾਵੇਗਾ",
        ctx: "ਦਫ਼ਤਰ ਦੀ ਮੈਨੇਜਰ ਨੂੰ ਫ਼ੋਨ, ਜੋ ਇਹ ਨੰਬਰ ਬੈਂਕ ਦੇ OTP ਲਈ ਵਰਤਦੀ ਹੈ।",
        who: "\"ਟੈਲੀਕਾਮ ਕੰਪਨੀ ਦਾ ਅਧਿਕਾਰੀ\"",
        subject: "",
        text: "\"ਮੈਡਮ, ਮੈਂ ਤੁਹਾਡੇ ਮੋਬਾਈਲ ਨੈੱਟਵਰਕ ਤੋਂ ਬੋਲ ਰਿਹਾ ਹਾਂ। 5G ਅੱਪਗ੍ਰੇਡ ਬਕਾਇਆ ਹੋਣ ਕਾਰਨ [[threat|ਤੁਹਾਡਾ SIM 24 ਘੰਟਿਆਂ ਵਿੱਚ ਬੰਦ ਹੋ ਜਾਵੇਗਾ]]। [[otp|ਅੱਪਗ੍ਰੇਡ ਲਈ ਆਪਣੇ SIM ਕਾਰਡ ਉੱਤੇ ਛਪਿਆ 20 ਅੰਕਾਂ ਦਾ ਨੰਬਰ ਪੜ੍ਹ ਕੇ ਸੁਣਾਓ ਅਤੇ ਆਉਣ ਵਾਲੇ SMS ਤੋਂ ਬਾਅਦ 1 ਦਬਾਓ।]] [[urgent|ਇਹ ਪੇਸ਼ਕਸ਼ ਅੱਜ ਹੀ ਖ਼ਤਮ ਹੁੰਦੀ ਹੈ।]]\"",
        why: "ਇਹ SIM-ਸਵੈਪ ਦੀ ਕੋਸ਼ਿਸ਼ ਹੈ। 20 ਅੰਕਾਂ ਦੇ SIM ਨੰਬਰ ਅਤੇ ਤੁਹਾਡੇ \"1\" ਨਾਲ ਠੱਗ ਤੁਹਾਡਾ ਨੰਬਰ ਆਪਣੇ SIM ਉੱਤੇ ਚਾਲੂ ਕਰ ਲੈਂਦਾ ਹੈ। ਤੁਹਾਡਾ ਫ਼ੋਨ ਬੰਦ ਹੋ ਜਾਂਦਾ ਹੈ ਅਤੇ ਬੈਂਕਿੰਗ ਤੇ UPI ਦਾ ਹਰ OTP ਉਸਨੂੰ ਜਾਂਦਾ ਹੈ।",
        todo: "ਕਾਲ ਕੱਟੋ। ਟੈਲੀਕਾਮ ਕੰਪਨੀਆਂ 5G ਅੱਪਗ੍ਰੇਡ ਲਈ ਕਦੇ ਫ਼ੋਨ ਨਹੀਂ ਕਰਦੀਆਂ। ਜੇ ਫ਼ੋਨ ਦਾ ਨੈੱਟਵਰਕ ਅਚਾਨਕ ਲੰਮੇ ਸਮੇਂ ਲਈ ਚਲਾ ਜਾਵੇ ਤਾਂ ਪਹਿਲਾਂ ਬੈਂਕ ਨੂੰ, ਫਿਰ ਓਪਰੇਟਰ ਨੂੰ ਫ਼ੋਨ ਕਰੋ। ਆਪਣੇ ਨਾਮ ਦੇ SIM ਸੰਚਾਰ ਸਾਥੀ ਉੱਤੇ ਵੇਖੋ।"
      },
      mfa: {
        title: "ਅੱਧੀ ਰਾਤ ਤੋਂ ਸੱਤਵੀਂ ਲੌਗਇਨ ਮਨਜ਼ੂਰੀ ਬੇਨਤੀ",
        ctx: "ਰਾਤ ਨੂੰ ਦਫ਼ਤਰੀ ਲੌਗਇਨ ਐਪ ਦੀਆਂ ਸਾਈਨ-ਇਨ ਮਨਜ਼ੂਰੀ ਬੇਨਤੀਆਂ ਨਾਲ ਫ਼ੋਨ ਲਗਾਤਾਰ ਵੱਜ ਰਿਹਾ ਹੈ। ਫਿਰ ਇੱਕ ਕਾਲ ਆਉਂਦੀ ਹੈ।",
        who: "SecureLogin ਐਪ",
        subject: "",
        text: "[[otp|ਸਾਈਨ-ਇਨ ਮਨਜ਼ੂਰ ਕਰਨਾ ਹੈ? ਕੋਈ ਨਵੇਂ ਡਿਵਾਈਸ ਤੋਂ ਤੁਹਾਡੇ ਦਫ਼ਤਰੀ ਖਾਤੇ ਵਿੱਚ ਸਾਈਨ-ਇਨ ਕਰ ਰਿਹਾ ਹੈ। ਅੱਗੇ ਵਧਣ ਲਈ APPROVE ਟੈਪ ਕਰੋ।]] [[odd|(ਅੱਧੀ ਰਾਤ ਤੋਂ ਇਹ 7ਵੀਂ ਬੇਨਤੀ ਹੈ।)]] ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਇੱਕ ਕਾਲਰ ਕਹਿੰਦਾ ਹੈ: \"[[urgent|ਮੈਂ IT ਤੋਂ ਬੋਲ ਰਿਹਾ ਹਾਂ, ਅਸੀਂ ਸਰਵਰ ਠੀਕ ਕਰ ਰਹੇ ਹਾਂ। ਅਲਰਟ ਬੰਦ ਹੋਣ ਲਈ ਬਸ ਬੇਨਤੀ ਮਨਜ਼ੂਰ ਕਰ ਦਿਓ।]]\"",
        why: "ਇਸਨੂੰ \"MFA ਥਕਾਵਟ\" ਕਹਿੰਦੇ ਹਨ। ਹਮਲਾਵਰ ਕੋਲ ਤੁਹਾਡਾ ਪਾਸਵਰਡ ਪਹਿਲਾਂ ਹੀ ਹੈ ਅਤੇ ਉਹ ਬੇਨਤੀਆਂ ਦੀ ਝੜੀ ਲਾ ਰਿਹਾ ਹੈ, ਇਸ ਆਸ ਵਿੱਚ ਕਿ ਅੱਕ ਕੇ ਤੁਸੀਂ Approve ਦਬਾ ਦਿਓ। \"IT\" ਦੀ ਕਾਲ ਹਮਲੇ ਦਾ ਹੀ ਹਿੱਸਾ ਹੈ। ਅਸਲੀ IT ਕਦੇ ਤੁਹਾਡਾ ਨਾ ਸ਼ੁਰੂ ਕੀਤਾ ਲੌਗਇਨ ਮਨਜ਼ੂਰ ਕਰਨ ਲਈ ਨਹੀਂ ਕਹਿੰਦਾ।",
        todo: "ਹਰ ਵਾਰ Deny ਦਬਾਓ। ਭਰੋਸੇਯੋਗ ਡਿਵਾਈਸ ਤੋਂ ਤੁਰੰਤ ਪਾਸਵਰਡ ਬਦਲੋ ਅਤੇ IT ਨੂੰ ਦੱਸੋ। ਵਾਰ-ਵਾਰ ਬੇਨਤੀਆਂ ਦਾ ਮਤਲਬ ਹੈ ਕਿ ਤੁਹਾਡਾ ਪਾਸਵਰਡ ਪਹਿਲਾਂ ਹੀ ਲੀਕ ਹੋ ਚੁੱਕਾ ਹੈ।"
      },
      gst_real: {
        title: "ਤੁਹਾਡੇ CA ਵੱਲੋਂ ਮਹੀਨਾਵਾਰ GST ਯਾਦ",
        ctx: "ਤੁਹਾਡੇ ਚਾਰਟਰਡ ਅਕਾਊਂਟੈਂਟ ਦੇ ਸੇਵ ਨੰਬਰ ਤੋਂ WhatsApp ਮੈਸੇਜ।",
        who: "ਮਹਿਤਾ ਐਂਡ ਕੰ. (ਸਾਡੇ CA)",
        subject: "",
        text: "ਸ਼ੁਭ ਸਵੇਰ। ਯਾਦ: ਸਤੰਬਰ ਦਾ GSTR-3B 20 ਅਕਤੂਬਰ ਤੱਕ ਭਰਨਾ ਹੈ। [[ok|ਕਿਰਪਾ ਕਰਕੇ ਵਿਕਰੀ ਅਤੇ ਖ਼ਰੀਦ ਦੀਆਂ ਸ਼ੀਟਾਂ ਹਰ ਮਹੀਨੇ ਵਾਂਗ ਉਸੇ ਸਾਂਝੇ ਫ਼ੋਲਡਰ ਵਿੱਚ ਅੱਪਲੋਡ ਕਰੋ।]] [[ok|ਹਾਲੇ ਤੁਹਾਡੇ ਵੱਲੋਂ ਕੋਈ ਭੁਗਤਾਨ ਨਹੀਂ ਚਾਹੀਦਾ]]; ਫ਼ਾਈਲਿੰਗ ਤੋਂ ਬਾਅਦ ਮੈਂ ਚਲਾਨ ਦੇ ਵੇਰਵੇ ਭੇਜਾਂਗਾ, ਅਤੇ ਆਪਣੀ ਆਮ ਕਾਲ ਉੱਤੇ ਪੱਕਾ ਕਰ ਲਵਾਂਗੇ।",
        why: "ਜਾਣੇ CA, ਸੇਵ ਨੰਬਰ, ਆਮ ਮਹੀਨਾਵਾਰ ਪ੍ਰਕਿਰਿਆ, ਕੋਈ ਨਵਾਂ ਖਾਤਾ ਨੰਬਰ ਨਹੀਂ, ਲਿੰਕ ਨਹੀਂ ਅਤੇ ਅਸਲ ਆਖ਼ਰੀ ਤਾਰੀਖ਼ ਤੋਂ ਵੱਧ ਕਾਹਲੀ ਨਹੀਂ। ਪੁਸ਼ਟੀ ਤੁਹਾਡੀ ਨਿਯਮਤ ਕਾਲ ਉੱਤੇ ਹੁੰਦੀ ਹੈ।",
        todo: "ਆਪਣੀ ਆਮ ਪ੍ਰਕਿਰਿਆ ਅਪਣਾਓ। ਜੇ ਕਿਸੇ ਦਿਨ \"CA\" ਨਵਾਂ ਬੈਂਕ ਖਾਤਾ ਭੇਜੇ ਜਾਂ ਲਿੰਕ ਰਾਹੀਂ ਭੁਗਤਾਨ ਕਰਨ ਲਈ ਕਹੇ, ਤਾਂ ਪਹਿਲਾਂ ਜਾਣੇ ਨੰਬਰ ਉੱਤੇ CA ਦਫ਼ਤਰ ਨੂੰ ਫ਼ੋਨ ਕਰੋ।"
      },
      lookalike: {
        title: "ਹੂਬਹੂ ਡੋਮੇਨ ਉੱਤੇ ਤਨਖ਼ਾਹ ਸਲਿੱਪ",
        ctx: "ਸੋਧੀ ਤਨਖ਼ਾਹ ਸਲਿੱਪ ਬਾਰੇ ਈਮੇਲ। ਤੁਹਾਡੀ ਕੰਪਨੀ ਦਾ ਅਸਲੀ ਡੋਮੇਨ meridiantextiles.example.com ਹੈ।",
        who: "ਪੇਰੋਲ ਟੀਮ",
        subject: "ਤੁਹਾਡੀ ਸੋਧੀ ਤਨਖ਼ਾਹ ਸਲਿੱਪ ਤਿਆਰ ਹੈ",
        text: "ਪਿਆਰੇ ਕਰਮਚਾਰੀ, ਅਕਤੂਬਰ ਤੋਂ ਤੁਹਾਡਾ ਤਨਖ਼ਾਹ ਢਾਂਚਾ ਬਦਲ ਗਿਆ ਹੈ। [[link|ਨਵੀਂ ਸਲਿੱਪ ਵੇਖਣ ਲਈ meridian-textiles-portal.example.com ਉੱਤੇ ਦਫ਼ਤਰੀ ਪਾਸਵਰਡ ਨਾਲ ਲੌਗਇਨ ਕਰੋ।]] [[urgent|ਲਿੰਕ 12 ਘੰਟਿਆਂ ਵਿੱਚ ਖ਼ਤਮ ਹੋ ਜਾਵੇਗਾ।]] [[sender|payroll@meridian-textiles.example.com ਤੋਂ ਭੇਜਿਆ]]",
        why: "ਕੰਪਨੀ ਦਾ ਅਸਲੀ ਡੋਮੇਨ meridiantextiles.example.com ਹੈ; ਈਮੇਲ meridian-textiles (ਹਾਈਫ਼ਨ ਨਾਲ) ਵਰਤਦੀ ਹੈ, ਜੋ ਹੂਬਹੂ ਦਿਸਦਾ ਡੋਮੇਨ ਹੈ। ਲਿੰਕ ਨਕਲ ਕੀਤੇ ਲੌਗਇਨ ਪੰਨੇ ਉੱਤੇ ਲੈ ਜਾਂਦਾ ਹੈ ਜੋ ਤੁਹਾਡਾ ਦਫ਼ਤਰੀ ਪਾਸਵਰਡ ਚੋਰੀ ਕਰਦਾ ਹੈ। ਤਨਖ਼ਾਹ ਸਲਿੱਪ ਉਸੇ HR ਪੋਰਟਲ ਉੱਤੇ ਹੁੰਦੀ ਹੈ ਜੋ ਤੁਸੀਂ ਹਮੇਸ਼ਾ ਵਰਤਦੇ ਹੋ।",
        todo: "ਕਲਿੱਕ ਨਾ ਕਰੋ। ਪਤਾ ਟਾਈਪ ਕਰਕੇ ਜਾਂ ਬੁੱਕਮਾਰਕ ਤੋਂ HR ਪੋਰਟਲ ਆਪ ਖੋਲ੍ਹੋ। ਈਮੇਲ ਦੀ IT ਨੂੰ ਸ਼ਿਕਾਇਤ ਕਰੋ; ਫ਼ਾਰਵਰਡ ਕਰਨ ਨਾਲ ਉਹ ਸਭ ਲਈ ਨਕਲੀ ਡੋਮੇਨ ਬਲੌਕ ਕਰ ਸਕਦੇ ਹਨ।"
      },
      usb: {
        title: "ਪਾਰਕਿੰਗ ਵਿੱਚ ਮਿਲੀ ਪੈੱਨ ਡ੍ਰਾਈਵ",
        ctx: "ਸੋਮਵਾਰ ਸਵੇਰੇ, ਦਫ਼ਤਰ ਦੇ ਦਰਵਾਜ਼ੇ ਕੋਲ।",
        who: "ਦਫ਼ਤਰ ਦੀ ਪਾਰਕਿੰਗ ਵਿੱਚ ਮਿਲੀ ਪੈੱਨ ਡ੍ਰਾਈਵ",
        subject: "",
        text: "ਦਰਵਾਜ਼ੇ ਕੋਲ ਇੱਕ ਪੈੱਨ ਡ੍ਰਾਈਵ ਪਈ ਹੈ, ਉਸ ਉੱਤੇ ਲੇਬਲ: [[prize|\"ਤਨਖ਼ਾਹ ਵਾਧਾ 2026 - ਗੁਪਤ - ਸਿਰਫ਼ ਪ੍ਰਬੰਧਨ ਲਈ\"]]। ਇੱਕ ਸਾਥੀ ਕਹਿੰਦਾ ਹੈ: \"[[remote|ਚਲੋ ਰਿਸੈਪਸ਼ਨ ਵਾਲੇ PC ਵਿੱਚ ਲਾ ਕੇ ਵੇਖੀਏ ਕਿਸਦੀ ਹੈ।]]\"",
        why: "ਇਸਨੂੰ \"USB ਡ੍ਰੌਪ\" ਕਹਿੰਦੇ ਹਨ। ਹਮਲਾਵਰ ਲੁਭਾਉਣੇ ਲੇਬਲ ਵਾਲੀਆਂ ਪੈੱਨ ਡ੍ਰਾਈਵਾਂ ਛੱਡ ਜਾਂਦੇ ਹਨ; ਇੱਕ ਲਾਉਂਦੇ ਹੀ ਲੁਕਿਆ ਸਾਫ਼ਟਵੇਅਰ ਆਪ ਇੰਸਟਾਲ ਹੋ ਕੇ ਦਫ਼ਤਰੀ ਨੈੱਟਵਰਕ ਵਿੱਚ ਫੈਲ ਸਕਦਾ ਹੈ। ਉਤਸੁਕਤਾ ਹੀ ਹਮਲਾ ਹੈ।",
        todo: "ਕਿਤੇ ਨਾ ਲਾਓ। ਲਿਫ਼ਾਫ਼ੇ ਵਿੱਚ ਪਾ ਕੇ IT ਜਾਂ ਸੁਰੱਖਿਆ ਵਿਭਾਗ ਨੂੰ ਦਿਓ। ਕੰਪਨੀਆਂ ਨੂੰ ਆਟੋ-ਰਨ ਬੰਦ ਕਰਕੇ ਅਣਜਾਣ USB ਡਿਵਾਈਸ ਬਲੌਕ ਕਰਨੇ ਚਾਹੀਦੇ ਹਨ।"
      },
      wifi: {
        title: "ਹਵਾਈ ਅੱਡੇ ਦਾ ਮੁਫ਼ਤ Wi-Fi ਈਮੇਲ ਪਾਸਵਰਡ ਮੰਗਦਾ ਹੈ",
        ctx: "ਫ਼ਲਾਈਟ ਦੀ ਉਡੀਕ ਵਿੱਚ, ਦੋ ਵੈਂਡਰ ਭੁਗਤਾਨ ਮਨਜ਼ੂਰ ਕਰਨ ਲਈ ਤੁਸੀਂ ਮੁਫ਼ਤ ਨੈੱਟਵਰਕ ਨਾਲ ਜੁੜਦੇ ਹੋ।",
        who: "ਹਵਾਈ ਅੱਡੇ ਉੱਤੇ ਮੁਫ਼ਤ Wi-Fi ਲੌਗਇਨ ਸਕ੍ਰੀਨ",
        subject: "",
        text: "ਨੈੱਟਵਰਕ: Airport_Free_WiFi_5G (ਪਾਸਵਰਡ ਨਹੀਂ)। [[otp|ਅੱਗੇ ਵਧਣ ਲਈ ਆਪਣਾ ਈਮੇਲ ਪਤਾ ਅਤੇ ਈਮੇਲ ਪਾਸਵਰਡ ਪਾ ਕੇ ਸਾਈਨ-ਇਨ ਕਰੋ।]] ਫਿਰ ਫ਼ਲਾਈਟ ਦੀ ਉਡੀਕ ਦੌਰਾਨ ਤੁਸੀਂ [[data|ਕੰਪਨੀ ਦੇ ਬੈਂਕਿੰਗ ਪੋਰਟਲ ਉੱਤੇ ਦੋ ਵੈਂਡਰ ਭੁਗਤਾਨ ਮਨਜ਼ੂਰ ਕਰਨ]] ਦੀ ਸੋਚਦੇ ਹੋ।",
        why: "ਅਧਿਕਾਰਤ ਲੱਗਦੇ ਨਾਮ ਵਾਲਾ ਹੌਟਸਪੌਟ ਕੋਈ ਵੀ ਬਣਾ ਸਕਦਾ ਹੈ। ਨਕਲੀ ਨੈੱਟਵਰਕ ਉੱਤੇ ਹਮਲਾਵਰ ਤੁਹਾਡਾ ਟਾਈਪ ਕੀਤਾ ਵੇਖ ਸਕਦਾ ਹੈ, ਅਤੇ ਈਮੇਲ ਪਾਸਵਰਡ ਮੰਗਦਾ ਲੌਗਇਨ ਪੰਨਾ ਜਾਣਕਾਰੀ ਚੋਰੀ ਕਰਦਾ ਹੈ। ਜਨਤਕ Wi-Fi ਉੱਤੇ ਬੈਂਕਿੰਗ ਜੋਖਮ ਭਰੀ ਹੈ।",
        todo: "ਕੰਮ ਅਤੇ ਬੈਂਕਿੰਗ ਲਈ ਆਪਣਾ ਮੋਬਾਈਲ ਡਾਟਾ ਜਾਂ ਕੰਪਨੀ ਦਾ VPN ਵਰਤੋ। Wi-Fi ਲੌਗਇਨ ਪੰਨੇ ਉੱਤੇ ਕਦੇ ਦਫ਼ਤਰੀ ਜਾਂ ਈਮੇਲ ਪਾਸਵਰਡ ਟਾਈਪ ਨਾ ਕਰੋ। ਖੁੱਲ੍ਹੇ ਨੈੱਟਵਰਕਾਂ ਨਾਲ ਆਪਣੇ-ਆਪ ਜੁੜਨਾ ਬੰਦ ਕਰੋ।"
      },
      upi_real: {
        title: "ਭੁਗਤਾਨ ਮਿਲਣ ਦਾ ਨੋਟੀਫ਼ਿਕੇਸ਼ਨ",
        ctx: "ਕਾਊਂਟਰ ਉੱਤੇ ਹੁੰਦਿਆਂ ਤੁਹਾਡੀ ਆਪਣੀ UPI ਐਪ ਦਾ ਨੋਟੀਫ਼ਿਕੇਸ਼ਨ।",
        who: "UPI ਐਪ",
        subject: "",
        text: "[[ok|Anita Traders ਤੋਂ ₹2,500 ਮਿਲੇ]] ਤੁਹਾਡੇ 4471 ਨਾਲ ਖ਼ਤਮ ਹੋਣ ਵਾਲੇ ਚਾਲੂ ਖਾਤੇ ਵਿੱਚ। [[ok|ਕੋਈ ਕਾਰਵਾਈ ਲੋੜੀਂਦੀ ਨਹੀਂ।]] ਲੈਣ-ਦੇਣ ID 628104...",
        why: "ਅੰਦਰ ਆਉਂਦੇ ਪੈਸਿਆਂ ਲਈ ਕਦੇ PIN, OTP ਜਾਂ ਸਕੈਨ ਦੀ ਲੋੜ ਨਹੀਂ। ਨੋਟੀਫ਼ਿਕੇਸ਼ਨ ਤੁਹਾਡੀ ਆਪਣੀ ਐਪ ਦਾ ਹੈ, ਭੁਗਤਾਨ ਕਰਨ ਵਾਲੇ ਦਾ ਨਾਮ ਦੱਸਦਾ ਹੈ ਅਤੇ ਤੁਹਾਡੇ ਤੋਂ ਕੁਝ ਨਹੀਂ ਮੰਗਦਾ। ਇਸਦੀ ਤੁਲਨਾ \"ਕਲੈਕਟ ਰਿਕਵੈਸਟ\" ਜਾਂ ਸਕੈਨ ਕਰਨ ਲਈ ਕਹੇ QR ਨਾਲ ਕਰੋ: ਉਹ ਪੈਸੇ ਬਾਹਰ ਲੈ ਜਾਂਦੇ ਹਨ।",
        todo: "ਕੁਝ ਨਹੀਂ ਕਰਨਾ। ਰਕਮ ਇਨਵੌਇਸ ਨਾਲ ਮਿਲਾਓ। ਜੇ ਕਦੇ \"ਭੁਗਤਾਨ ਮਿਲਿਆ\" ਮੈਸੇਜ ਮਨਜ਼ੂਰੀ, PIN ਜਾਂ ਸਕੈਨ ਮੰਗੇ, ਤਾਂ ਉਹ ਪੈਸੇ ਦੇ ਨਹੀਂ ਰਿਹਾ, ਲੈ ਰਿਹਾ ਹੈ।"
      },
      dpdp: {
        title: "ਸਾਥੀ ਨੂੰ ਗਾਹਕ ਸੂਚੀ WhatsApp ਉੱਤੇ ਚਾਹੀਦੀ ਹੈ",
        ctx: "ਸ਼ਾਮ ਨੂੰ ਸੇਲਜ਼ ਵਾਲੇ ਸਾਥੀ ਦੇ ਨੰਬਰ ਤੋਂ WhatsApp ਮੈਸੇਜ।",
        who: "ਸਮੀਰ (ਸੇਲਜ਼ ਸਾਥੀ)",
        subject: "",
        text: "ਭਰਾ, ਅੱਜ ਮੈਂ ਘਰੋਂ ਕੰਮ ਕਰ ਰਿਹਾ ਹਾਂ। [[data|ਫ਼ੋਨ ਨੰਬਰਾਂ ਅਤੇ ਆਧਾਰ ਦੀਆਂ ਕਾਪੀਆਂ ਸਮੇਤ ਪੂਰੀ ਗਾਹਕ ਸੂਚੀ ਐਕਸਪੋਰਟ ਕਰਕੇ ਮੈਨੂੰ ਇਸੇ WhatsApp ਉੱਤੇ ਭੇਜ]], ਬਾਅਦ ਵਿੱਚ ਮਿਟਾ ਦਿਆਂਗਾ। [[urgent|ਕੈਂਪੇਨ ਲਈ 10 ਮਿੰਟਾਂ ਵਿੱਚ ਚਾਹੀਦੀ ਹੈ।]] [[secret|ਮੈਨੇਜਰ ਨੂੰ ਦੱਸਣ ਦੀ ਲੋੜ ਨਹੀਂ, ਛੋਟੀ ਗੱਲ ਹੈ।]]",
        why: "ਗਾਹਕਾਂ ਦੇ ਫ਼ੋਨ ਨੰਬਰ ਅਤੇ ਆਧਾਰ ਦੀਆਂ ਕਾਪੀਆਂ ਭਾਰਤ ਦੇ DPDP ਕਾਨੂੰਨ ਹੇਠ ਸੁਰੱਖਿਅਤ ਨਿੱਜੀ ਡਾਟਾ ਹਨ। ਨਿੱਜੀ WhatsApp ਉੱਤੇ ਭੇਜਣ ਨਾਲ ਇਹ ਕੰਪਨੀ ਦੇ ਕੰਟਰੋਲ ਤੋਂ ਬਾਹਰ ਜਾਂਦਾ ਹੈ, ਅਤੇ ਇਹ ਹੈਕ ਹੋਇਆ ਖਾਤਾ ਜਾਂ ਨਕਲੀ ਪਛਾਣ ਵੀ ਹੋ ਸਕਦੀ ਹੈ। \"ਮੈਨੇਜਰ ਨੂੰ ਨਾ ਦੱਸੀਂ\" ਕਦੇ ਵੀ ਮਨਜ਼ੂਰ ਨਹੀਂ।",
        todo: "ਨਿਮਰਤਾ ਨਾਲ ਨਾਂਹ ਕਰੋ। ਗਾਹਕ ਡਾਟਾ ਸਿਰਫ਼ ਕੰਪਨੀ ਦੇ ਮਨਜ਼ੂਰ ਸਿਸਟਮ ਰਾਹੀਂ, ਮੈਨੇਜਰ ਦੀ ਮਨਜ਼ੂਰੀ ਨਾਲ ਅਤੇ ਸਿਰਫ਼ ਲੋੜੀਂਦੇ ਵੇਰਵੇ ਹੀ ਸਾਂਝੇ ਕਰੋ। ਜੇ ਸਾਥੀ ਦਾ ਖਾਤਾ ਅਜੀਬ ਲੱਗੇ ਤਾਂ ਉਨ੍ਹਾਂ ਨੂੰ ਫ਼ੋਨ ਕਰੋ।"
      },
      otp_call: {
        title: "ਭੁਗਤਾਨ ਰੱਦ ਕਰਨ ਲਈ \"ਫ਼ਰਾਡ ਵਿਭਾਗ\" ਨੂੰ OTP ਚਾਹੀਦਾ ਹੈ",
        ctx: "ਫ਼ੋਨ ਉੱਤੇ OTP SMS ਆਉਂਦੇ ਸਮੇਂ ਹੀ ਆਈ ਕਾਲ।",
        who: "\"NovaBank ਫ਼ਰਾਡ ਵਿਭਾਗ\"",
        subject: "",
        text: "\"ਸਰ, [[threat|ਤੁਹਾਡੇ ਕਾਰਡ ਉੱਤੇ ਹੁਣੇ ₹49,999 ਦਾ ਲੈਣ-ਦੇਣ ਹੋ ਰਿਹਾ ਹੈ।]] ਇਸਨੂੰ ਰੱਦ ਕਰਨ ਲਈ [[urgent|ਸਾਨੂੰ 60 ਸਕਿੰਟਾਂ ਵਿੱਚ ਕਾਰਵਾਈ ਕਰਨੀ ਪਵੇਗੀ]]। [[otp|ਹੁਣੇ ਤੁਹਾਡੇ ਫ਼ੋਨ ਉੱਤੇ ਆਇਆ OTP ਦੱਸੋ, ਮੈਂ ਇਸਨੂੰ ਵਾਪਸ ਕਰ ਦਿਆਂਗਾ।]] [[secret|ਕਿਰਪਾ ਕਰਕੇ ਕਾਲ ਨਾ ਕੱਟੋ ਜਾਂ ਕਿਸੇ ਨੂੰ ਫ਼ੋਨ ਨਾ ਕਰੋ।]]\"",
        why: "\"ਹੁਣੇ ਆਇਆ\" OTP ਠੱਗ ਦੀ ਤੁਹਾਡੇ ਕਾਰਡ ਨਾਲ ਭੁਗਤਾਨ ਦੀ ਕੋਸ਼ਿਸ਼ ਲਈ ਹੈ। ਇਸਨੂੰ ਪੜ੍ਹ ਕੇ ਸੁਣਾਉਣ ਨਾਲ ਭੁਗਤਾਨ ਪੂਰਾ ਹੋ ਜਾਂਦਾ ਹੈ। ਬੈਂਕ ਕੁਝ ਵੀ ਰੱਦ ਕਰਨ ਲਈ ਕਦੇ OTP ਨਹੀਂ ਮੰਗਦੇ, ਅਤੇ 60 ਸਕਿੰਟ ਦੀ ਘਬਰਾਹਟ ਇਸ ਲਈ ਬਣਾਈ ਜਾਂਦੀ ਹੈ ਕਿ ਤੁਸੀਂ ਸੋਚੋ ਨਾ।",
        todo: "ਕਾਲ ਕੱਟੋ। ਬੈਂਕ ਐਪ ਖੋਲ੍ਹ ਕੇ ਆਪ ਕਾਰਡ ਬਲੌਕ ਕਰੋ, ਜਾਂ ਕਾਰਡ ਦੇ ਪਿੱਛੇ ਵਾਲੇ ਨੰਬਰ ਉੱਤੇ ਫ਼ੋਨ ਕਰੋ। OTP ਕਦੇ ਕਿਸੇ ਨੂੰ ਪੜ੍ਹ ਕੇ ਨਾ ਸੁਣਾਓ। ਜੇ ਪੈਸੇ ਚਲੇ ਗਏ ਹਨ ਤਾਂ ਤੁਰੰਤ 1930 ਉੱਤੇ ਫ਼ੋਨ ਕਰੋ।"
      },
      hr_bonus: {
        title: "ਦੀਵਾਲੀ ਬੋਨਸ ਫ਼ਾਰਮ ਨੈੱਟ-ਬੈਂਕਿੰਗ ਲੌਗਇਨ ਮੰਗਦਾ ਹੈ",
        ctx: "ਦੀਵਾਲੀ ਤੋਂ ਠੀਕ ਪਹਿਲਾਂ, HR ਵਰਗੇ ਦਿਸਦੇ ਪਤੇ ਤੋਂ ਸਾਰੇ ਕਰਮਚਾਰੀਆਂ ਨੂੰ ਈਮੇਲ।",
        who: "HR ਰਿਵਾਰਡਜ਼ ਟੀਮ",
        subject: "ਦੀਵਾਲੀ ਬੋਨਸ ₹25,000 - ਆਪਣਾ ਬੈਂਕ ਖਾਤਾ ਪੱਕਾ ਕਰੋ",
        text: "ਪਿਆਰੇ ਸਾਥੀ, ਸਾਨੂੰ ₹25,000 ਦੇ ਦੀਵਾਲੀ ਬੋਨਸ ਦਾ ਐਲਾਨ ਕਰਦਿਆਂ ਖ਼ੁਸ਼ੀ ਹੈ। [[attach|ਨੱਥੀ ਫ਼ਾਰਮ (Bonus_Form.html) ਖੋਲ੍ਹੋ]] ਅਤੇ ਬੋਨਸ ਸਿੱਧਾ ਜਮ੍ਹਾਂ ਹੋਣ ਲਈ [[otp|ਆਪਣਾ ਨੈੱਟ-ਬੈਂਕਿੰਗ ਯੂਜ਼ਰ ID ਅਤੇ ਪਾਸਵਰਡ ਪਾਓ]]। [[urgent|ਅੱਜ ਸ਼ਾਮ 6 ਵਜੇ ਤੋਂ ਬਾਅਦ ਆਏ ਫ਼ਾਰਮ ਨਹੀਂ ਲਏ ਜਾਣਗੇ।]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR ਕੋਲ ਤੁਹਾਡਾ ਤਨਖ਼ਾਹ ਖਾਤਾ ਪਹਿਲਾਂ ਹੀ ਹੈ; ਕੋਈ ਕੰਪਨੀ ਬੋਨਸ ਲਈ ਨੈੱਟ-ਬੈਂਕਿੰਗ ਲੌਗਇਨ ਨਹੀਂ ਮੰਗਦੀ। ਭੇਜਣ ਵਾਲਾ ਹੂਬਹੂ ਦਿਸਦਾ ਡੋਮੇਨ ਹੈ, HTML ਅਟੈਚਮੈਂਟ ਨਕਲੀ ਬੈਂਕ ਲੌਗਇਨ ਪੰਨਾ ਹੈ, ਅਤੇ ਉਸੇ ਦਿਨ ਦੀ ਸਮਾਂ-ਸੀਮਾ ਦਬਾਅ ਵਧਾਉਂਦੀ ਹੈ।",
        todo: "ਅਟੈਚਮੈਂਟ ਨਾ ਖੋਲ੍ਹੋ ਅਤੇ ਕੁਝ ਨਾ ਪਾਓ। HR ਤੋਂ ਆਹਮੋ-ਸਾਹਮਣੇ ਜਾਂ ਇੰਟਰਾਨੈੱਟ ਉੱਤੇ ਪੁੱਛੋ। ਸਾਥੀਆਂ ਨੂੰ ਚੌਕਸ ਕਰਨ ਲਈ ਈਮੇਲ ਦੀ IT ਨੂੰ ਸ਼ਿਕਾਇਤ ਕਰੋ।"
      },
      electricity: {
        title: "ਅੱਜ ਰਾਤ ਦਫ਼ਤਰ ਦੀ ਬਿਜਲੀ ਕੱਟੀ ਜਾਵੇਗੀ",
        ctx: "ਰਾਤ 8:35 ਵਜੇ ਦੁਕਾਨ ਮਾਲਕ ਦੇ ਫ਼ੋਨ ਉੱਤੇ SMS।",
        who: "",
        subject: "",
        text: "ਪਿਆਰੇ ਖਪਤਕਾਰ, [[odd|ਪਿਛਲੇ ਮਹੀਨੇ ਦਾ ਬਿੱਲ ਸਾਡੇ ਸਿਸਟਮ ਵਿੱਚ ਅੱਪਡੇਟ ਨਹੀਂ ਹੈ]] ਇਸ ਲਈ [[threat|ਤੁਹਾਡੇ ਦਫ਼ਤਰ ਦਾ ਬਿਜਲੀ ਕੁਨੈਕਸ਼ਨ ਅੱਜ ਰਾਤ 9:30 ਵਜੇ ਕੱਟਿਆ ਜਾਵੇਗਾ]]। ਕਿਰਪਾ ਕਰਕੇ ਸਾਡੇ ਅਫ਼ਸਰ ਨਾਲ [[sender|93XXX XXX40]] ਉੱਤੇ [[urgent|ਤੁਰੰਤ]] ਸੰਪਰਕ ਕਰੋ।",
        why: "ਬਿਜਲੀ ਬੋਰਡ ਨਿੱਜੀ ਮੋਬਾਈਲ ਤੋਂ ਇੱਕ SMS ਤੋਂ ਬਾਅਦ ਰਾਤ ਨੂੰ ਬਿਜਲੀ ਨਹੀਂ ਕੱਟਦੇ। ਫ਼ੋਨ ਕਰਨ ਉੱਤੇ \"ਅਫ਼ਸਰ\" ਐਪ ਇੰਸਟਾਲ ਕਰਨ ਜਾਂ ਲਿੰਕ ਰਾਹੀਂ ₹10 ਭਰਨ ਲਈ ਕਹਿੰਦਾ ਹੈ, ਅਤੇ ਅਸਲ ਨਿਸ਼ਾਨਾ ਤੁਹਾਡਾ ਬੈਂਕ ਖਾਤਾ ਹੁੰਦਾ ਹੈ।",
        todo: "ਫ਼ੋਨ ਨਾ ਕਰੋ। ਬਿੱਲ ਬਿਜਲੀ ਬੋਰਡ ਦੀ ਅਧਿਕਾਰਤ ਐਪ ਜਾਂ ਦਫ਼ਤਰ ਵਿੱਚ ਵੇਖੋ। ਉਸ ਨੰਬਰ ਦੀ ਸੰਚਾਰ ਸਾਥੀ (ਚਕਸ਼ੂ) ਉੱਤੇ ਸ਼ਿਕਾਇਤ ਕਰੋ।"
      },
      wa_hijack: {
        title: "ਸਾਥੀ 6 ਅੰਕਾਂ ਦਾ ਕੋਡ ਫ਼ਾਰਵਰਡ ਕਰਨ ਲਈ ਕਹਿੰਦਾ ਹੈ",
        ctx: "ਤੁਹਾਡੇ ਫ਼ੋਨ ਉੱਤੇ ਕੋਡ ਵਾਲਾ SMS ਆਉਣ ਤੋਂ ਤੁਰੰਤ ਬਾਅਦ, ਦੇਰ ਰਾਤ ਸਾਥੀ ਦੇ ਸੇਵ ਨੰਬਰ ਤੋਂ WhatsApp ਮੈਸੇਜ।",
        who: "ਰੋਹਨ (ਸਾਥੀ)",
        subject: "",
        text: "ਓਏ, ਇੰਨੀ ਰਾਤ ਨੂੰ ਤੰਗ ਕਰਨ ਲਈ ਮਾਫ਼ ਕਰੀਂ। [[odd|WhatsApp ਵਿੱਚ ਲੌਗਇਨ ਕਰਦਿਆਂ ਗ਼ਲਤੀ ਨਾਲ ਤੇਰਾ ਨੰਬਰ ਪਾ ਦਿੱਤਾ ਅਤੇ 6 ਅੰਕਾਂ ਦਾ ਕੋਡ ਤੇਰੇ ਫ਼ੋਨ ਉੱਤੇ ਚਲਾ ਗਿਆ।]] [[otp|ਉਹ ਕੋਡ ਮੈਨੂੰ ਫ਼ਾਰਵਰਡ ਕਰ ਦੇ]], [[urgent|ਛੇਤੀ, ਨਹੀਂ ਤਾਂ ਮੇਰਾ ਖਾਤਾ ਲੌਕ ਹੋ ਜਾਵੇਗਾ।]]",
        why: "ਆਇਆ ਕੋਡ ਤੁਹਾਡੇ ਆਪਣੇ WhatsApp ਦਾ ਵੈਰੀਫ਼ਿਕੇਸ਼ਨ ਕੋਡ ਹੈ। ਜਿਸਨੂੰ ਇਹ ਮਿਲੇ ਉਹ ਤੁਹਾਡਾ ਖਾਤਾ ਕਬਜ਼ੇ ਵਿੱਚ ਲੈ ਲੈਂਦਾ ਹੈ ਅਤੇ ਫਿਰ ਤੁਹਾਡੇ ਸਾਰੇ ਸੰਪਰਕਾਂ ਅਤੇ ਦਫ਼ਤਰੀ ਗਰੁੱਪਾਂ ਨੂੰ ਪੈਸੇ ਮੰਗਦੇ ਮੈਸੇਜ ਭੇਜਦਾ ਹੈ। ਇਹ ਮੈਸੇਜ ਵੀ ਸਾਥੀ ਦੇ ਪਹਿਲਾਂ ਹੀ ਹੈਕ ਹੋਏ ਖਾਤੇ ਤੋਂ ਆਇਆ ਹੋ ਸਕਦਾ ਹੈ।",
        todo: "ਵੈਰੀਫ਼ਿਕੇਸ਼ਨ ਕੋਡ ਕਦੇ ਫ਼ਾਰਵਰਡ ਨਾ ਕਰੋ। ਸਾਥੀ ਨੂੰ ਫ਼ੋਨ ਕਰਕੇ ਦੱਸੋ ਕਿ ਉਸਦਾ ਖਾਤਾ ਹੈਕ ਹੋ ਗਿਆ ਹੈ। WhatsApp ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਟੂ-ਸਟੈੱਪ ਵੈਰੀਫ਼ਿਕੇਸ਼ਨ ਚਾਲੂ ਕਰੋ।"
      },
      invest_group: {
        title: "ਗਾਰੰਟੀ ਵਾਲੇ ਮੁਨਾਫ਼ੇ ਦਾ ਸਟਾਕ-ਟਿੱਪਸ ਗਰੁੱਪ",
        ctx: "ਬਿਨਾਂ ਪੁੱਛੇ ਤੁਹਾਨੂੰ ਇੱਕ WhatsApp ਗਰੁੱਪ ਵਿੱਚ ਜੋੜ ਦਿੱਤਾ ਗਿਆ।",
        who: "VIP Stock Tips - ਗਰੁੱਪ ਐਡਮਿਨ",
        subject: "",
        text: "ਸਾਡੇ ਪ੍ਰੀਮੀਅਮ ਗਰੁੱਪ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ! [[prize|ਗਾਰੰਟੀ ਵਾਲੇ ਇਨਸਾਈਡਰ ਟਿੱਪਸ ਨਾਲ ਸਾਡੇ ਮੈਂਬਰਾਂ ਨੇ ਪਿਛਲੇ ਮਹੀਨੇ 32% ਮੁਨਾਫ਼ਾ ਕਮਾਇਆ।]] ਸਾਡੀ ਟ੍ਰੇਡਿੰਗ ਐਪ [[link|ਐਪ ਸਟੋਰ ਤੋਂ ਨਹੀਂ, ਇਸ ਲਿੰਕ ਤੋਂ]] ਡਾਊਨਲੋਡ ਕਰੋ, ਅਤੇ [[money|₹50,000 ਜਮ੍ਹਾਂ ਕਰਕੇ ਸ਼ੁਰੂ ਕਰੋ]]। [[prize|ਮੈਂਬਰਾਂ ਦੇ ਪਾਏ ਮੁਨਾਫ਼ੇ ਦੇ ਸਕ੍ਰੀਨਸ਼ਾਟ ਵੇਖੋ!]] [[urgent|ਦਾਖ਼ਲਾ ਅੱਧੀ ਰਾਤ ਨੂੰ ਬੰਦ ਹੋ ਜਾਵੇਗਾ।]]",
        why: "ਕੋਈ ਵੀ ਮੁਨਾਫ਼ੇ ਦੀ ਗਾਰੰਟੀ ਨਹੀਂ ਦੇ ਸਕਦਾ, ਅਤੇ \"ਇਨਸਾਈਡਰ ਟਿੱਪਸ\" ਗ਼ੈਰ-ਕਾਨੂੰਨੀ ਹਨ। ਐਪ ਨਕਲੀ ਹੈ: ਤੁਸੀਂ ਹੋਰ ਜਮ੍ਹਾਂ ਕਰੋ ਇਸ ਲਈ ਕਾਲਪਨਿਕ ਮੁਨਾਫ਼ਾ ਦਿਖਾਉਂਦੀ ਹੈ, ਅਤੇ ਪੈਸੇ ਕਢਵਾਉਣ ਨਹੀਂ ਦਿੰਦੀ। ਸਕ੍ਰੀਨਸ਼ਾਟ ਪਾਉਣ ਵਾਲੇ \"ਮੈਂਬਰ\" ਠੱਗ ਹੀ ਹਨ।",
        todo: "ਗਰੁੱਪ ਛੱਡੋ ਅਤੇ ਰਿਪੋਰਟ ਕਰੋ। ਨਿਵੇਸ਼ ਸਿਰਫ਼ SEBI ਰਜਿਸਟਰਡ ਬ੍ਰੋਕਰਾਂ ਅਤੇ ਅਧਿਕਾਰਤ ਐਪ ਸਟੋਰ ਦੀਆਂ ਐਪਾਂ ਰਾਹੀਂ ਕਰੋ। ਜੇ ਜਮ੍ਹਾਂ ਕਰ ਦਿੱਤੇ ਹਨ ਤਾਂ 1930 ਉੱਤੇ ਫ਼ੋਨ ਕਰੋ ਅਤੇ cybercrime.gov.in ਉੱਤੇ ਸ਼ਿਕਾਇਤ ਕਰੋ।"
      },
      bank_real: {
        title: "ਤੁਹਾਡੇ ਕੀਤੇ ਭੁਗਤਾਨ ਦਾ ਡੈਬਿਟ ਅਲਰਟ",
        ctx: "ਤੁਹਾਡੀ ਅਕਾਊਂਟਸ ਟੀਮ ਨੇ ਅੱਜ ਪੈਕੇਜਿੰਗ ਵੈਂਡਰ ਨੂੰ ਭੁਗਤਾਨ ਕੀਤਾ। ਇਹ SMS ਆਉਂਦਾ ਹੈ।",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|Sunrise Packaging ਨੂੰ NEFT ਲਈ 10 ਅਕਤੂਬਰ ਨੂੰ 4471 ਨਾਲ ਖ਼ਤਮ ਹੋਣ ਵਾਲੇ ਖਾਤੇ ਵਿੱਚੋਂ ₹86,000 ਡੈਬਿਟ]], ਹਵਾਲਾ N26101034। ਬਕਾਇਆ ₹3,42,118। [[ok|ਜੇ ਤੁਸੀਂ ਨਹੀਂ ਕੀਤਾ ਤਾਂ ਆਪਣੇ ਡੈਬਿਟ ਕਾਰਡ ਦੇ ਪਿੱਛੇ ਵਾਲੇ ਨੰਬਰ ਉੱਤੇ ਫ਼ੋਨ ਕਰੋ।]]",
        why: "ਇਹ ਤੁਹਾਡੀ ਅਕਾਊਂਟਸ ਟੀਮ ਦੇ ਅੱਜ ਕੀਤੇ ਭੁਗਤਾਨ ਨਾਲ ਮੇਲ ਖਾਂਦਾ ਹੈ, ਬੈਂਕ ਦੇ ਸੈਂਡਰ ID ਤੋਂ ਆਇਆ ਹੈ, SMS ਵਿੱਚ ਕੋਈ ਲਿੰਕ ਜਾਂ ਨੰਬਰ ਨਹੀਂ, ਅਤੇ ਤੁਹਾਡੇ ਆਪਣੇ ਕਾਰਡ ਵਾਲੇ ਨੰਬਰ ਵੱਲ ਇਸ਼ਾਰਾ ਕਰਦਾ ਹੈ।",
        todo: "ਆਪਣੇ ਭੁਗਤਾਨ ਰਿਕਾਰਡ ਨਾਲ ਮਿਲਾਓ। ਜੇ ਕੋਈ ਡੈਬਿਟ ਅਲਰਟ ਤੁਹਾਡੇ ਕੀਤੇ ਭੁਗਤਾਨ ਨਾਲ ਨਾ ਮਿਲੇ, ਤਾਂ ਮੈਸੇਜ ਵਾਲੇ ਨਹੀਂ, ਕਾਰਡ ਵਾਲੇ ਨੰਬਰ ਉੱਤੇ ਤੁਰੰਤ ਬੈਂਕ ਨੂੰ ਫ਼ੋਨ ਕਰੋ।"
      }
    }
  },
  or: {
    scenarios: {
      ceo_gift: {
        title: "ନୂଆ ନମ୍ବରରୁ ବସ୍‌ଙ୍କୁ ଗିଫ୍ଟ କାର୍ଡ ଦରକାର",
        ctx: "ସକାଳ 9 ଟାରେ ଆକାଉଣ୍ଟସ୍ ଏକ୍ଜିକ୍ୟୁଟିଭଙ୍କୁ WhatsApp ମେସେଜ୍। ପ୍ରୋଫାଇଲ୍ ଫଟୋ କମ୍ପାନୀ ୱେବସାଇଟରୁ ନିଆଯାଇଥିବା MD ଙ୍କ ଫଟୋ।",
        who: "ରାଜେଶ ସାର୍ (ନୂଆ ନମ୍ବର)",
        subject: "",
        text: "ହାଏ, ମୁଁ ରାଜେଶ। [[sender|ମୋ ପୁରୁଣା ଫୋନ୍ ଖରାପ ହୋଇଗଲା, ଏବେ ଏହି ନମ୍ବର ବ୍ୟବହାର କରୁଛି।]] ମୁଁ ଜଣେ ବଡ଼ କ୍ଲାଏଣ୍ଟଙ୍କ ସହ ମିଟିଂରେ ଅଛି। [[money|₹5,000 ର 10ଟି ଗିଫ୍ଟ କାର୍ଡ କିଣନ୍ତୁ]] ଓ କୋଡ୍ ମୋତେ [[urgent|30 ମିନିଟ୍ ଭିତରେ]] ପଠାନ୍ତୁ। [[secret|ଏ ବିଷୟରେ କାହା ସହ କଥା ହୁଅନ୍ତୁ ନାହିଁ, ଏହା କ୍ଲାଏଣ୍ଟଙ୍କ ପାଇଁ ସରପ୍ରାଇଜ୍।]]",
        why: "ସ୍କାମର୍ ୱେବସାଇଟରୁ MD ଙ୍କ ଫଟୋ ନେଇ ନୂଆ ନମ୍ବରରୁ ଲେଖନ୍ତି। ପ୍ରକୃତ ବସ୍ କେବେ ଗିଫ୍ଟ-କାର୍ଡ କୋଡ୍ ବା ଗୋପନୀୟତା ମାଗନ୍ତି ନାହିଁ। ନୂଆ ନମ୍ବର + ତରବର + ଗୋପନୀୟତା ହିଁ କ୍ଲାସିକ୍ \"CEO ଠକେଇ\"।",
        todo: "କିଛି କିଣନ୍ତୁ ନାହିଁ। ବସ୍‌ଙ୍କୁ ଫୋନରେ ସେଭ୍ ଥିବା ନମ୍ବରରେ ଫୋନ୍ କରନ୍ତୁ ବା ତାଙ୍କ କ୍ୟାବିନ୍‌କୁ ଯାଆନ୍ତୁ। ପୂରା ଅଫିସ୍ ସତର୍କ ରହିବା ପାଇଁ IT ବା ମ୍ୟାନେଜରଙ୍କୁ କୁହନ୍ତୁ।"
      },
      it_real: {
        title: "IT ରୁ ପାସୱାର୍ଡ ନୀତି ସୂଚନା",
        ctx: "କମ୍ପାନୀର ନିଜ IT ହେଲ୍ପଡେସ୍କରୁ ସମସ୍ତ କର୍ମଚାରୀଙ୍କୁ ଇମେଲ୍।",
        who: "IT ହେଲ୍ପଡେସ୍କ",
        subject: "15 ଅକ୍ଟୋବରରୁ ପାସୱାର୍ଡ ନୀତିରେ ବଦଳ",
        text: "ପ୍ରିୟ ସହକର୍ମୀଗଣ, 15 ଅକ୍ଟୋବରରୁ ପାସୱାର୍ଡ ଅତି କମରେ 12 ଅକ୍ଷରର ହେବା ଦରକାର। [[ok|ଆଜି ଆପଣଙ୍କୁ କିଛି କରିବାକୁ ପଡ଼ିବ ନାହିଁ।]] ପାସୱାର୍ଡର ମିଆଦ ସରିଲେ ଏହାକୁ [[ok|ଆପଣ ସବୁବେଳେ ବ୍ୟବହାର କରୁଥିବା ସେହି ଅଫିସ୍ ପୋର୍ଟାଲରେ ବଦଳାନ୍ତୁ]]। [[ok|IT କେବେ ଇମେଲ୍, ଫୋନ୍ ବା WhatsApp ରେ ଆପଣଙ୍କ ପାସୱାର୍ଡ ମାଗିବ ନାହିଁ।]] ସନ୍ଦେହ ଥିଲେ ଦ୍ୱିତୀୟ ମହଲାରେ ହେଲ୍ପଡେସ୍କକୁ ଆସନ୍ତୁ।",
        why: "ପ୍ରେରକ କମ୍ପାନୀର ନିଜ IT ଠିକଣା। କ୍ଲିକ୍ କରିବାକୁ ଲିଙ୍କ ନାହିଁ, ଆଟାଚମେଣ୍ଟ ନାହିଁ, ସମୟସୀମା ନାହିଁ ଓ ପାସୱାର୍ଡ ମାଗିବା ନାହିଁ। ପ୍ରକୃତ ସୂଚନା କହେ କ'ଣ ହେବ ଓ ସାଧାରଣ ପୋର୍ଟାଲ୍ ଆପଣଙ୍କୁ ନିଜେ ବ୍ୟବହାର କରିବାକୁ ଦିଏ।",
        todo: "କିଛି ଜରୁରୀ ନୁହେଁ। ସୂଚନା ପ୍ରକୃତ କି ନାହିଁ ସନ୍ଦେହ ହେଲେ ହେଲ୍ପଡେସ୍କକୁ ଯାଆନ୍ତୁ ବା ଆଗରୁ ଜାଣିଥିବା ଏକ୍ସଟେନସନ୍ ନମ୍ବରରେ ଫୋନ୍ କରନ୍ତୁ।"
      },
      bec_vendor: {
        title: "ଭେଣ୍ଡର କୁହନ୍ତି ବ୍ୟାଙ୍କ ଖାତା ବଦଳିଛି",
        ctx: "₹4,80,000 ର ବକେୟା ଇନଭଏସ୍ ବିଷୟରେ ଆକାଉଣ୍ଟସ୍ ଟିମ୍‌କୁ ଇମେଲ୍।",
        who: "କାବେରୀ ଲଜିଷ୍ଟିକ୍ସ ଆକାଉଣ୍ଟସ୍",
        subject: "ଜରୁରୀ: ଇନଭଏସ୍ KL/2026/0912 ପାଇଁ ନୂଆ ବ୍ୟାଙ୍କ ବିବରଣୀ",
        text: "ମହାଶୟ/ମହାଶୟା, [[newacct|ଅଡିଟ୍ ପରେ ଆମ କମ୍ପାନୀର ବ୍ୟାଙ୍କ ଖାତା ବଦଳିଛି। ଦୟାକରି ₹4,80,000 ର ବକେୟା ଇନଭଏସ୍ ତଳେ ଦିଆଯାଇଥିବା ନୂଆ ଖାତାକୁ ପଇଠ କରନ୍ତୁ।]] ସିପମେଣ୍ଟ ବିଳମ୍ବରୁ ବଞ୍ଚିବାକୁ [[urgent|ପେମେଣ୍ଟ ଆଜି ହିଁ କରନ୍ତୁ]]। [[sender|ଦୟାକରି କେବଳ ଏହି ଇମେଲ୍ ID ରେ ଉତ୍ତର ଦିଅନ୍ତୁ]], ଆମ ଅଫିସ୍ ଫୋନ୍ ମରାମତିରେ ଅଛି।",
        why: "ଏହା ବିଜନେସ୍ ଇମେଲ୍ କମ୍ପ୍ରୋମାଇଜ୍ (BEC)। ଅପରାଧୀ ଭେଣ୍ଡରଙ୍କ ଇମେଲ୍ ହ୍ୟାକ୍ ବା ନକଲ କରି \"ନୂଆ ବ୍ୟାଙ୍କ ବିବରଣୀ\" ପଠାନ୍ତି। ଠିକଣା ପ୍ରକୃତ ଭେଣ୍ଡରଙ୍କଠୁ ଟିକେ ଅଲଗା, ଫୋନ୍ \"ବନ୍ଦ\" ଯେପରି ଆପଣ ଯାଞ୍ଚ କରିନପାରିବେ, ଓ ସବୁକିଛି ଜରୁରୀ।",
        todo: "ଇମେଲ୍ ଆଧାରରେ ଭେଣ୍ଡରଙ୍କ ବ୍ୟାଙ୍କ ବିବରଣୀ କେବେ ବଦଳାନ୍ତୁ ନାହିଁ। ପୁରୁଣା ରେକର୍ଡ ବା ପର୍ଚେଜ୍ ଅର୍ଡରର ନମ୍ବରରେ ଭେଣ୍ଡରଙ୍କୁ ଫୋନ୍ କରନ୍ତୁ, ଇମେଲର ନମ୍ବରରେ କେବେ ନୁହେଁ। ପ୍ରତି ବ୍ୟାଙ୍କ ବିବରଣୀ ବଦଳ ପାଇଁ ଦୁଇଜଣଙ୍କ ଅନୁମୋଦନ ରଖନ୍ତୁ।"
      },
      gst_notice: {
        title: "ଆଟାଚମେଣ୍ଟ ସହ GST ଜରିମାନା ନୋଟିସ୍",
        ctx: "ସକାଳୁ ସକାଳୁ ଆକାଉଣ୍ଟସ୍ ମେଲବକ୍ସରେ ଆସିଥିବା ଇମେଲ୍।",
        who: "GST ବିଭାଗ",
        subject: "କାରଣ ଦର୍ଶାଅ ନୋଟିସ୍ - ଜରିମାନା ₹1,24,500 - ପଦକ୍ଷେପ ଆବଶ୍ୟକ",
        text: "[[odd|ପ୍ରିୟ କରଦାତା,]] ଆପଣଙ୍କ GST ରିଟର୍ନରେ ଅମେଳ ମିଳିଛି। ₹1,24,500 ଜରିମାନା ବାକି। ନ ଦେଲେ [[threat|ଆପଣଙ୍କ GSTIN 48 ଘଣ୍ଟାରେ ନିଲମ୍ବିତ ହେବ]]। ଆଇନଗତ କାର୍ଯ୍ୟାନୁଷ୍ଠାନରୁ ବଞ୍ଚିବାକୁ [[link|ସଂଲଗ୍ନ ନୋଟିସ୍ ଖୋଲି ସୁରକ୍ଷିତ ଲିଙ୍କରେ ପଇଠ କରନ୍ତୁ]]। [[attach|ଆଟାଚମେଣ୍ଟ: GST_Notice_2026.html]]",
        why: "ପ୍ରକୃତ GST ନୋଟିସ୍ ସରକାରୀ GST ପୋର୍ଟାଲରେ ଆପଣଙ୍କ ଖାତାରେ ଦେଖାଯାଏ ଓ ସେଥିରେ DIN (ଡକ୍ୟୁମେଣ୍ଟ ଆଇଡେଣ୍ଟିଫିକେସନ୍ ନମ୍ବର) ଥାଏ। \"ସୁରକ୍ଷିତ ଲିଙ୍କ\" ଥିବା HTML ଆଟାଚମେଣ୍ଟ ନକଲି ଲଗଇନ୍ ପୃଷ୍ଠା ଯାହା ଆପଣଙ୍କ GST ଲଗଇନ୍ ବା ପେମେଣ୍ଟ ବିବରଣୀ ଚୋରି କରେ। ପ୍ରେରକ ସରକାରୀ gov.in ଡୋମେନ୍ ନୁହେଁ।",
        todo: "ଆଟାଚମେଣ୍ଟ ଖୋଲନ୍ତୁ ନାହିଁ। ଠିକଣା ନିଜେ ଟାଇପ୍ କରି ସରକାରୀ GST ପୋର୍ଟାଲରେ ଲଗଇନ୍ କରନ୍ତୁ, ବା ଆପଣଙ୍କ CA ଙ୍କୁ ଯାଞ୍ଚ କରିବାକୁ କୁହନ୍ତୁ। ଇମେଲର ଅଭିଯୋଗ IT କୁ ଓ cybercrime.gov.in ରେ କରନ୍ତୁ।"
      },
      otp_real: {
        title: "ଆପଣ ଏବେ ଆରମ୍ଭ କରିଥିବା ପେମେଣ୍ଟର OTP",
        ctx: "ଆପଣ ଏବେ ପ୍ୟାକେଜିଂ ଭେଣ୍ଡରଙ୍କୁ ₹2,500 ର UPI ପେମେଣ୍ଟ ଆରମ୍ଭ କରିଛନ୍ତି। ଏହି SMS ଆସେ।",
        who: "",
        subject: "",
        text: "[[ok|ଆପଣ ଏବେ ଆରମ୍ଭ କରିଥିବା Sunrise Packaging କୁ ₹2,500 UPI ପେମେଣ୍ଟ ପାଇଁ ଆପଣଙ୍କ OTP 482913।]] 10 ମିନିଟ୍ ପାଇଁ ବୈଧ। [[ok|ଏହି OTP କାହାକୁ କୁହନ୍ତୁ ନାହିଁ, ବ୍ୟାଙ୍କକୁ ମଧ୍ୟ ନୁହେଁ।]] - NovaBank",
        why: "ଏହି ପେମେଣ୍ଟ ଆପଣ ନିଜେ କିଛି କ୍ଷଣ ଆଗରୁ ଆରମ୍ଭ କଲେ, ରାଶି ଓ ପ୍ରାପକ ମେଳ ଖାଉଛି, ଓ ମେସେଜ୍ କୋଡ୍ କାହାକୁ ନ କହିବାକୁ କହୁଛି। ପ୍ରକୃତ OTP କେବଳ ଆପଣ ନିଜେ ମାଗିଥିବା କାମ ପାଇଁ, ଓ ବ୍ୟାଙ୍କ ଏହାକୁ କାହାକୁ କହିବାକୁ କେବେ କୁହେ ନାହିଁ।",
        todo: "OTP କେବଳ ଆପଣ ବ୍ୟବହାର କରୁଥିବା ଆପରେ ଟାଇପ୍ କରନ୍ତୁ। ଆପଣ କିଛି ଆରମ୍ଭ ନ କରିଥିବାବେଳେ OTP ଆସିଲେ, କେହି ଆପଣଙ୍କ ଖାତା ବ୍ୟବହାର କରିବାକୁ ଚେଷ୍ଟା କରୁଛି: ଏହା କୁହନ୍ତୁ ନାହିଁ, ଓ କାର୍ଡରେ ଛପା ନମ୍ବରରେ ବ୍ୟାଙ୍କକୁ ଫୋନ୍ କରନ୍ତୁ।"
      },
      digital_arrest: {
        title: "\"CBI ଅଫିସର\"ଙ୍କ ଭିଡିଓ କଲ୍",
        ctx: "ଅଜଣା ନମ୍ବରରୁ ଭିଡିଓ କଲ୍। କଲର୍ ୟୁନିଫର୍ମ ପିନ୍ଧିଛନ୍ତି ଓ ପଛରେ ପତାକା ଥିବା ଅଫିସରେ ବସିଛନ୍ତି।",
        who: "\"CBI ଅଫିସର ବର୍ମା\"",
        subject: "",
        text: "\"[[threat|ଆପଣଙ୍କ ନାମରେ ଡ୍ରଗ୍ସ ଓ 6ଟି ପାସପୋର୍ଟ ଥିବା ପାର୍ସଲ୍ ବୁକ୍ ହୋଇଛି। ଆପଣଙ୍କ ବିରୋଧରେ ମାମଲା ରୁଜୁ ହୋଇଛି।]] [[urgent|ଏହି ଭିଡିଓ କଲରେ ହିଁ ରୁହନ୍ତୁ, କଲ୍ କାଟନ୍ତୁ ନାହିଁ]], ଓ [[secret|କାହାକୁ କୁହନ୍ତୁ ନାହିଁ, ପରିବାରକୁ ମଧ୍ୟ ନୁହେଁ, ସେମାନଙ୍କ ଉପରେ ବି ନଜର ଅଛି]]। [[money|ଯାଞ୍ଚ ପାଇଁ ₹3,50,000 ଏହି RBI ଭେରିଫିକେସନ୍ ଖାତାକୁ ଟ୍ରାନ୍ସଫର କରନ୍ତୁ]]; ତଦନ୍ତ ପରେ ଫେରସ୍ତ ମିଳିବ।\"",
        why: "ଏହା \"ଡିଜିଟାଲ୍ ଆରେଷ୍ଟ\"। କୌଣସି ପୋଲିସ୍, CBI ବା କୋର୍ଟ ଭିଡିଓ କଲରେ କାହାକୁ ଗିରଫ କରେ ନାହିଁ, ଓ କୌଣସି ଏଜେନ୍ସି \"ଭେରିଫିକେସନ୍ ଖାତା\"କୁ ଟଙ୍କା ପଠାଇବାକୁ କୁହେ ନାହିଁ। ୟୁନିଫର୍ମ, ଅଫିସ୍ ପୃଷ୍ଠଭୂମି ଓ ପରିଚୟପତ୍ର ସବୁ ନକଲି। ଗୋପନୀୟତା ଓ କଲରେ ଧରି ରଖିବା ଆପଣଙ୍କୁ ଭାବିବାକୁ ଦିଏ ନାହିଁ।",
        todo: "ତୁରନ୍ତ ଫୋନ୍ କାଟନ୍ତୁ। ପ୍ରକୃତ ଅଫିସର WhatsApp ରେ ଫୋନ୍ କରନ୍ତି ନାହିଁ। 1930 କୁ ଫୋନ୍ କରନ୍ତୁ ବା cybercrime.gov.in ରେ ଅଭିଯୋଗ କରନ୍ତୁ, ଓ ତୁରନ୍ତ ଜଣେ ସହକର୍ମୀ ବା ପରିବାର ସଦସ୍ୟଙ୍କୁ କୁହନ୍ତୁ।"
      },
      courier: {
        title: "କଲ୍: ଆପଣଙ୍କ ପାର୍ସଲ୍ କଷ୍ଟମ୍ସରେ ଅଟକିଛି",
        ctx: "ପ୍ରଥମେ ରେକର୍ଡ କରାଯାଇଥିବା ସ୍ୱର, ତା'ପରେ ଜଣେ ଲୋକ। ଆପଣ ବିଦେଶରୁ କିଛି ମଗାଇନାହାନ୍ତି।",
        who: "\"SpeedParcel ଗ୍ରାହକ ସେବା\"",
        subject: "",
        text: "\"ନମସ୍କାର, ମୁଁ SpeedParcel ର କଷ୍ଟମ୍ସ ବିଭାଗରୁ କହୁଛି। [[threat|ଆପଣଙ୍କ ନାମର ପାର୍ସଲ୍ ବେଆଇନ ଜିନିଷ ଯୋଗୁଁ କଷ୍ଟମ୍ସରେ ଅଟକାଯାଇଛି।]] ପୋଲିସ୍ ମାମଲାରୁ ବଞ୍ଚିବାକୁ ଅଫିସରଙ୍କ ସହ କଥା ହେବା ପାଇଁ [[urgent|ଏବେ 1 ଦବାନ୍ତୁ]], ବା ଆମେ ପଠାଉଥିବା ଲିଙ୍କରେ [[money|₹2,999 କ୍ଲିୟରାନ୍ସ ଫି ଦିଅନ୍ତୁ]]।\"",
        why: "କୁରିଅର କମ୍ପାନୀ ବେଆଇନ ଜିନିଷ ବିଷୟରେ ଫୋନ୍ କରନ୍ତି ନାହିଁ, ଓ କଷ୍ଟମ୍ସ ଫୋନରେ ଫି ନିଏ ନାହିଁ। 1 ଦବାଇଲେ ଆପଣ ନକଲି \"ଅଫିସର\"ଙ୍କ ସହ ଯୋଡ଼ି ହୁଅନ୍ତି, ଯିଏ ତା'ପରେ ଡିଜିଟାଲ୍ ଆରେଷ୍ଟ ବା ପେମେଣ୍ଟ ମାଗନ୍ତି।",
        todo: "କଲ୍ କାଟନ୍ତୁ। ପ୍ରକୃତରେ କିଛି ମଗାଇଥିଲେ କୁରିଅରର ସରକାରୀ ୱେବସାଇଟରେ ଟ୍ରାକିଂ ନମ୍ବର ଯାଞ୍ଚ କରନ୍ତୁ। ସେହି ନମ୍ବରକୁ ସଞ୍ଚାର ସାଥୀ (ଚକ୍ଷୁ) ପୋର୍ଟାଲରେ ରିପୋର୍ଟ କରନ୍ତୁ।"
      },
      task_job: {
        title: "Telegram ଚାକିରି: ହୋଟେଲକୁ ରେଟିଂ ଦେଇ ଦିନକୁ ₹8,000",
        ctx: "ଗତ ସପ୍ତାହରେ ଆପଣ ଅନଲାଇନ୍ ଚାକିରି ପାଇଁ ଆବେଦନ କରିବା ପରେ ଆସିଥିବା Telegram ମେସେଜ୍।",
        who: "HR ପ୍ରିୟା - ଅନଲାଇନ୍ ଜବ୍ସ",
        subject: "",
        text: "ଅଭିନନ୍ଦନ, ଆପଣ ଚୟନିତ! [[prize|ଅନଲାଇନ୍ ହୋଟେଲକୁ ରେଟିଂ ଦେଇ ଦିନକୁ ₹3,000 ରୁ ₹8,000 ରୋଜଗାର କରନ୍ତୁ]], କେବଳ 20 ମିନିଟର କାମ। ପ୍ରଥମ 3ଟି କାମ ମାଗଣା। ପ୍ରିମିୟମ୍ କାମ ପାଇଁ [[money|₹5,000 ଜମା କରି ଗୋଟିଏ ଘଣ୍ଟାରେ ₹7,500 ଫେରି ପାଆନ୍ତୁ]]। [[urgent|ଆଜି କେବଳ 4ଟି ସିଟ୍ ବାକି!]]",
        why: "ଏହା ଟାସ୍କ ସ୍କାମ୍। ବିଶ୍ୱାସ ଜିତିବାକୁ ପ୍ରଥମ ଛୋଟ ପେମେଣ୍ଟ ପ୍ରକୃତ ହୁଏ। ତା'ପରେ ପ୍ରିମିୟମ୍ କାମ ପାଇଁ ଆପଣ \"ଜମା\" କରନ୍ତି ଓ ଟଙ୍କା କେବେ ଫେରେ ନାହିଁ। କୌଣସି ପ୍ରକୃତ ଚାକିରି କ୍ଲିକ୍ କରିବା ପାଇଁ ଟଙ୍କା ଦିଏ ନାହିଁ, ଓ କୌଣସି ନିଯୁକ୍ତିଦାତା ଟଙ୍କା ଜମା କରିବାକୁ କୁହନ୍ତି ନାହିଁ।",
        todo: "କିଛି ଜମା କରନ୍ତୁ ନାହିଁ। ଖାତା ବ୍ଲକ୍ କରି ରିପୋର୍ଟ କରନ୍ତୁ। ଆଗରୁ ଟଙ୍କା ଦେଇସାରିଥିଲେ ତୁରନ୍ତ 1930 କୁ ଫୋନ୍ କରନ୍ତୁ; ପ୍ରଥମ ଘଣ୍ଟା ସବୁଠୁ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ।"
      },
      vendor_real: {
        title: "ଜଣାଶୁଣା ଭେଣ୍ଡରଙ୍କଠୁ ପେମେଣ୍ଟ ସ୍ମାରକ",
        ctx: "ଆପଣ ପ୍ରତି ମାସ ଟଙ୍କା ଦେଉଥିବା ପ୍ୟାକେଜିଂ ଭେଣ୍ଡରଙ୍କ ସାଧାରଣ ଠିକଣାରୁ ଇମେଲ୍।",
        who: "Sunrise Packaging ବିଲିଂ",
        subject: "ପେମେଣ୍ଟ ସ୍ମାରକ - ଇନଭଏସ୍ SP/26-27/0431, 10 ଅକ୍ଟୋବରରେ ଦେୟ",
        text: "ପ୍ରିୟ ମେରିଡିଆନ୍ ଟେକ୍ସଟାଇଲ୍ସ ଟିମ୍, ଏହା ଏକ ବିନମ୍ର ସ୍ମାରକ ଯେ ₹86,000 ର ଇନଭଏସ୍ SP/26-27/0431 10 ଅକ୍ଟୋବରରେ ଦେୟ। [[ok|ଆମ ବ୍ୟାଙ୍କ ବିବରଣୀ ବଦଳିନାହିଁ ଓ ଆପଣଙ୍କ ପାଖରେ ଥିବା ଇନଭଏସରେ ଛପା ହୋଇଛି।]] [[ok|ଆମ ବ୍ୟାଙ୍କ ଖାତା ବଦଳାଇବାକୁ କହୁଥିବା କୌଣସି ଇମେଲ୍ ଆସିଲେ, ପେମେଣ୍ଟ ଆଗରୁ ଆପଣଙ୍କ ରେକର୍ଡର ନମ୍ବରରେ ଆମ ଅଫିସକୁ ଫୋନ୍ କରନ୍ତୁ।]] ଧନ୍ୟବାଦ।",
        why: "ଜଣାଶୁଣା ଭେଣ୍ଡରଙ୍କ ଠିକଣାରୁ ନିୟମିତ ସ୍ମାରକ, ନୂଆ ବ୍ୟାଙ୍କ ବିବରଣୀ ନାହିଁ, ଧମକ ନାହିଁ, ଓ କିଛି ଅଲଗା ଲାଗିଲେ ଭେଣ୍ଡର ନିଜେ ଫୋନରେ ଯାଞ୍ଚ କରିବାକୁ କୁହନ୍ତି। ପ୍ରକୃତ ଭାଗୀଦାର ଏହିପରି ବ୍ୟବହାର କରନ୍ତି।",
        todo: "ଆପଣଙ୍କ ରେକର୍ଡରେ ଥିବା ଖାତାକୁ ସାଧାରଣ ଭାବେ ପଇଠ କରନ୍ତୁ। ବଦଳର କୌଣସି ଅନୁରୋଧ ଜଣାଶୁଣା ଫୋନ୍ ନମ୍ବରରେ ନିଶ୍ଚିତ କରନ୍ତୁ।"
      },
      deepfake: {
        title: "MD ଙ୍କ ସ୍ୱର ଜରୁରୀ ଟ୍ରାନ୍ସଫର ମାଗେ",
        ctx: "ଅଜଣା ନମ୍ବରରୁ ଫୋନ୍। ସ୍ୱର ଠିକ୍ ଆପଣଙ୍କ MD ଙ୍କ ଭଳି, ପଛରେ ଏୟାରପୋର୍ଟର ଶବ୍ଦ।",
        who: "\"ରାଜେଶ ସାର୍\" (MD ଙ୍କ ସ୍ୱର)",
        subject: "",
        text: "\"ହେଲୋ, ମୁଁ ହିଁ, ଏୟାରପୋର୍ଟରେ ଅଛି, ଶବ୍ଦ ଶୁଣାଯାଉଛି ନା। [[urgent|ମୋତେ ଏବେ ହିଁ ₹2,00,000 ଟ୍ରାନ୍ସଫର କରାଇବାକୁ ହେବ]] ଦୁବାଇ ଅର୍ଡର ପାଇଁ ଜଣେ ନୂଆ ସପ୍ଲାୟରଙ୍କୁ। [[newacct|ଖାତା ନମ୍ବର ମୁଁ WhatsApp କରୁଛି।]] [[secret|ମୋତେ ଫେରି ଫୋନ୍ କରନି, ଫୋନ୍ ଫ୍ଲାଇଟ୍ ମୋଡ୍‌କୁ ଯାଉଛି, ମୁଁ ଓହ୍ଲାଇବା ଆଗରୁ କରିଦିଅ।]]\"",
        why: "AI କୌଣସି ଭାଷଣ ବା ଭିଡିଓର 30 ସେକେଣ୍ଡର କ୍ଲିପରୁ ଯେକୌଣସି ଲୋକଙ୍କ ସ୍ୱର ନକଲ କରିପାରେ। ନକଲି ସ୍ୱର + ନୂଆ ଖାତା ନମ୍ବର + \"ଫେରି ଫୋନ୍ କରନି\" ହେଉଛି ଡିପଫେକ୍ ସ୍କାମ୍। ପଛର ଶବ୍ଦ ଜାଣିଶୁଣି ଯୋଡ଼ାଯାଏ।",
        todo: "ଫେରି ଫୋନ୍ କରିବେ ବୋଲି କୁହନ୍ତୁ, ତା'ପରେ ସେଭ୍ ନମ୍ବରରେ MD ଙ୍କୁ ଫୋନ୍ କରନ୍ତୁ ବା ଦ୍ୱିତୀୟ ଜଣେ ବରିଷ୍ଠଙ୍କ ସହ ଯାଞ୍ଚ କରନ୍ତୁ। ଫୋନରେ ଜରୁରୀ ଅନୁରୋଧ ପାଇଁ ଟିମରେ ଗୋଟିଏ ଗୁପ୍ତ ଶବ୍ଦ ସ୍ଥିର କରନ୍ତୁ। ସାଧାରଣ ଅନୁମୋଦନ ବିନା ଟ୍ରାନ୍ସଫର ନୁହେଁ।"
      },
      qr_receive: {
        title: "ଟଙ୍କା \"ପାଇବା\" ପାଇଁ କ୍ରେତା QR କୋଡ୍ ପଠାନ୍ତି",
        ctx: "ଆପଣ ଗୋଟିଏ କ୍ଲାସିଫାଏଡ୍ ସାଇଟରେ 12ଟି ପୁରୁଣା ଅଫିସ୍ ଚେୟାରର ବିଜ୍ଞାପନ ଦେଲେ। ଜଣେ କ୍ରେତା WhatsApp ରେ ଲେଖନ୍ତି।",
        who: "ଅଫିସ୍ ଚେୟାରର କ୍ରେତା",
        subject: "",
        text: "ହାଏ, ₹18,000 ରେ 12ଟି ପୁରୁଣା ଅଫିସ୍ ଚେୟାରର ଆପଣଙ୍କ ବିଜ୍ଞାପନ ଦେଖିଲି। ମୁଁ ପୂରା ଟଙ୍କା ଏବେ ଦେଉଛି। [[upi|ମୁଁ QR କୋଡ୍ ପଠାଇଛି: ଟଙ୍କା ପାଇବାକୁ ଏହାକୁ ସ୍କାନ୍ କରି ଆପଣଙ୍କ UPI PIN ଦିଅନ୍ତୁ।]] [[odd|ମୁଁ ବାହାରେ ପୋଷ୍ଟିଂ ଥିବା ସେନା ଅଫିସର, ତେଣୁ ମୋ ସାଙ୍ଗ ଚେୟାର ନେଇଯିବ।]] [[urgent|ଦୟାକରି ପରବର୍ତ୍ତୀ 5 ମିନିଟରେ କରନ୍ତୁ, ମୋ ନେଟୱର୍କ ଦୁର୍ବଳ।]]",
        why: "ଟଙ୍କା ପାଇବାକୁ ଆପଣ କେବେ QR ସ୍କାନ୍ କରନ୍ତି ନାହିଁ ବା PIN ଦିଅନ୍ତି ନାହିଁ। ସ୍କାନ୍ କରି PIN ଦେଲେ ଆପଣ ଅନ୍ୟ ଜଣଙ୍କୁ ଟଙ୍କା ଦିଅନ୍ତି। \"ସେନା ଅଫିସର\" କାହାଣୀ ଓ ତରବର କ୍ଲାସିଫାଏଡ୍ ସାଇଟର ସାଧାରଣ ଚାଲ୍।",
        todo: "ମନା କରନ୍ତୁ। କ୍ରେତାଙ୍କୁ ଆପଣଙ୍କ UPI ID କୁ ଟଙ୍କା ପଠାଇବାକୁ କୁହନ୍ତୁ; ଟଙ୍କା ପାଇବାକୁ ଆପଣଙ୍କୁ କିଛି କରିବାକୁ ପଡ଼େ ନାହିଁ। ଆପରେ ନମ୍ବର ରିପୋର୍ଟ କରନ୍ତୁ।"
      },
      fake_care: {
        title: "ସର୍ଚ୍ଚରେ ମିଳିଥିବା କଷ୍ଟମର କେୟାର ନମ୍ବର",
        ctx: "ରିଫଣ୍ଡ ଆସିଲା ନାହିଁ। ଆପଣ ଅନଲାଇନରେ ବ୍ୟାଙ୍କର କଷ୍ଟମର କେୟାର ଖୋଜି ପ୍ରଥମ ଦେଖାଯାଇଥିବା ନମ୍ବରରେ ଫୋନ୍ କଲେ।",
        who: "\"NovaBank କଷ୍ଟମର କେୟାର\"",
        subject: "",
        text: "\"NovaBank କଷ୍ଟମର କେୟାରକୁ ଫୋନ୍ କରିଥିବାରୁ ଧନ୍ୟବାଦ। ₹3,200 ରିଫଣ୍ଡ ପାଇଁ ଆପଣଙ୍କୁ ଯାଞ୍ଚ କରିବାକୁ ହେବ। [[otp|ଦୟାକରି ଆପଣଙ୍କ 16 ଅଙ୍କର କାର୍ଡ ନମ୍ବର, ମିଆଦ ତାରିଖ ଓ ଏବେ ଆସୁଥିବା OTP କୁହନ୍ତୁ।]] [[remote|ମୁଁ ପଠାଉଥିବା Quick Support ଆପ୍ ମଧ୍ୟ ଇନଷ୍ଟଲ୍ କରନ୍ତୁ ଯେପରି ମୁଁ ଶୀଘ୍ର କାମ କରିପାରିବି।]]\"",
        why: "ଆପଣ ସର୍ଚ୍ଚ ଫଳାଫଳରେ ବା ନକଲି ୱେବସାଇଟରେ ରଖାଯାଇଥିବା ନକଲି ନମ୍ବରରେ ଫୋନ୍ କଲେ। କୌଣସି ବ୍ୟାଙ୍କ ପୂରା କାର୍ଡ ନମ୍ବର, ମିଆଦ, CVV ବା OTP ମାଗେ ନାହିଁ, ଓ ରିମୋଟ୍-କଣ୍ଟ୍ରୋଲ୍ ଆପ୍ ଇନଷ୍ଟଲ୍ କରିବାକୁ କେବେ କୁହେ ନାହିଁ।",
        todo: "କଲ୍ କାଟନ୍ତୁ। କେବଳ କାର୍ଡ ପଛରେ ଛପା ବା ସରକାରୀ ଆପରେ ଥିବା ନମ୍ବର ବ୍ୟବହାର କରନ୍ତୁ। କଲର୍ କହିଥିବା ଆପ୍ କେବେ ଇନଷ୍ଟଲ୍ କରନ୍ତୁ ନାହିଁ। କିଛି କହିଦେଇଥିଲେ ତୁରନ୍ତ ଆପରେ କାର୍ଡ ବ୍ଲକ୍ କରନ୍ତୁ ଓ 1930 କୁ ଫୋନ୍ କରନ୍ତୁ।"
      },
      hr_real: {
        title: "HR ରୁ ଦୀପାବଳି ଛୁଟି ତାଲିକା",
        ctx: "କମ୍ପାନୀର HR ଠିକଣାରୁ ସମସ୍ତ କର୍ମଚାରୀଙ୍କୁ ଇମେଲ୍।",
        who: "HR ବିଭାଗ",
        subject: "ଦୀପାବଳି ସପ୍ତାହର ଛୁଟି ତାଲିକା",
        text: "ସମସ୍ତଙ୍କୁ ନମସ୍କାର, ଦୀପାବଳି ପାଇଁ 7 ରୁ 9 ନଭେମ୍ବର ଅଫିସ୍ ବନ୍ଦ ରହିବ। [[ok|ପୂରା ଛୁଟି ତାଲିକା ଇଣ୍ଟ୍ରାନେଟର HR ପୃଷ୍ଠାରେ ଅଛି]], ଛୁଟି ପାଇଁ ଆପଣ ବ୍ୟବହାର କରୁଥିବା ସେହି ପୃଷ୍ଠା। [[ok|ଆପଣଙ୍କୁ କିଛି କରିବାକୁ ପଡ଼ିବ ନାହିଁ।]] ସମସ୍ତଙ୍କୁ ଆନନ୍ଦମୟ ଓ ସୁରକ୍ଷିତ ଦୀପାବଳିର ଶୁଭେଚ୍ଛା। - HR ଟିମ୍",
        why: "କମ୍ପାନୀର ନିଜ HR ଠିକଣାରୁ ପଠାଯାଇଛି, କେବଳ ସୂଚନା, ବାହାର ସାଇଟର ଲିଙ୍କ ନାହିଁ, ଖୋଲିବାକୁ ଆଟାଚମେଣ୍ଟ ନାହିଁ ଓ ଭରିବାକୁ କିଛି ନାହିଁ। ପ୍ରକୃତ ସୂଚନାକୁ ତରବର ଦରକାର ନାହିଁ।",
        todo: "କିଛି କରିବାକୁ ନାହିଁ। ଛୁଟି ବା ବୋନସ୍ ବିଷୟରେ କୌଣସି ଇମେଲ୍ ଲଗଇନ୍ କରିବାକୁ ବା ବ୍ୟାଙ୍କ ବିବରଣୀ ଭରିବାକୁ କହିଲେ, ତାହାକୁ ବିପଦ ସଙ୍କେତ ଭାବନ୍ତୁ ଓ HR ଙ୍କୁ ସିଧାସଳଖ ପଚାରନ୍ତୁ।"
      },
      screen_share: {
        title: "\"UPI ହେଲ୍ପଲାଇନ୍\" ଆପଣଙ୍କ ସ୍କ୍ରିନ୍ ଦେଖିବାକୁ ଚାହେଁ",
        ctx: "UPI ପେମେଣ୍ଟ ବିଫଳ ହେବା ପରେ ଆପଣ ସୋସିଆଲ୍ ମିଡିଆରେ ଅଭିଯୋଗ କଲେ, କିଛି ମିନିଟ୍ ପରେ ଫୋନ୍ ଆସିଲା।",
        who: "\"UPI ହେଲ୍ପଲାଇନ୍\"",
        subject: "",
        text: "\"ସାର୍, ଆପଣଙ୍କ ₹1,500 UPI ପେମେଣ୍ଟ ଅଟକିଛି। ମୁଁ 2 ମିନିଟରେ ଠିକ୍ କରିଦେବି। [[remote|ମୁଁ ପଠାଇଥିବା ଲିଙ୍କରୁ ସ୍କ୍ରିନ୍-ସେୟାରିଂ ଆପ୍ ଇନଷ୍ଟଲ୍ କରି ସ୍କ୍ରିନରେ ଥିବା 9 ଅଙ୍କର କୋଡ୍ ମୋତେ ପଢ଼ି ଶୁଣାନ୍ତୁ।]] ବ୍ୟାଙ୍କିଂ ଆପ୍ ଖୋଲା ରଖନ୍ତୁ, ମୁଁ କେବଳ ଦେଖିବି। [[otp|OTP ଆସିଲେ କଲ୍ କାଟନ୍ତୁ ନାହିଁ, ମୁଁ ବାଟ ଦେଖାଇବି।]]\"",
        why: "ରିମୋଟ୍-ଆକ୍ସେସ୍ ଓ ସ୍କ୍ରିନ୍-ସେୟାରିଂ ଆପ୍ କଲରଙ୍କୁ ଆପଣଙ୍କ ଫୋନ୍ ଦେଖିବା ଓ ଚଳାଇବାକୁ ଦିଏ; 9 ଅଙ୍କର କୋଡ୍ ପୂରା ଆକ୍ସେସ୍ ଦିଏ। OTP ସହ ମିଶି ସେ କିଛି ମିନିଟରେ ଖାତା ଖାଲି କରିପାରନ୍ତି। ପ୍ରକୃତ ହେଲ୍ପଲାଇନ୍ କେବେ ଆପଣଙ୍କ ସ୍କ୍ରିନ୍ ଦେଖିବାକୁ ମାଗନ୍ତି ନାହିଁ।",
        todo: "କଲ୍ କାଟନ୍ତୁ ଓ ଇନଷ୍ଟଲ୍ କରିଥିବା ଆପ୍ ହଟାନ୍ତୁ। ଅଭିଯୋଗ କେବଳ ସରକାରୀ UPI ବା ବ୍ୟାଙ୍କ ଆପରେ କରନ୍ତୁ। ଟଙ୍କା ଚାଲିଯାଇଥିଲେ ତୁରନ୍ତ 1930 ଓ ବ୍ୟାଙ୍କକୁ ଫୋନ୍ କରନ୍ତୁ।"
      },
      invoice_exe: {
        title: ".exe ରେ ଶେଷ ହେଉଥିବା ଇନଭଏସ୍ ଆଟାଚମେଣ୍ଟ",
        ctx: "ଯେଉଁ କମ୍ପାନୀରୁ କିଣିଥିବା ମନେ ନାହିଁ, ତାଙ୍କଠୁ ଆକାଉଣ୍ଟସ୍ ମେଲବକ୍ସରେ ଇମେଲ୍।",
        who: "Global Trade Supplies",
        subject: "ଇନଭଏସ୍ ସଂଲଗ୍ନ - ଦୟାକରି ପ୍ରକ୍ରିୟା କରନ୍ତୁ",
        text: "[[odd|ପ୍ରିୟ ମହାଶୟ,]] ଗତ ସପ୍ତାହରେ ଦିଆଯାଇଥିବା ଜିନିଷର ଇନଭଏସ୍ ସଂଲଗ୍ନ। [[attach|ଆଟାଚମେଣ୍ଟ: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|ଦୟାକରି ଆଜି ହିଁ ପେମେଣ୍ଟ କରନ୍ତୁ]] ଓ ଜଣାନ୍ତୁ। [[odd|ଆପଣଙ୍କ ବିଶ୍ୱସ୍ତ, ଆକାଉଣ୍ଟସ୍ ବିଭାଗ।]]",
        why: ".exe ରେ ଶେଷ ହେଉଥିବା ଫାଇଲ୍ PDF ନୁହେଁ, ପ୍ରୋଗ୍ରାମ୍; ନାମରେ ଥିବା \".pdf\" କେବଳ ଛଦ୍ମବେଶ। ଏହାକୁ ଖୋଲିଲେ ମାଲୱେର୍ ବା ର‍୍ୟାନସମୱେର୍ ଇନଷ୍ଟଲ୍ ହୁଏ ଯାହା ଅଫିସର ପ୍ରତି କମ୍ପ୍ୟୁଟର ଲକ୍ କରିପାରେ। ଅସ୍ପଷ୍ଟ ସମ୍ବୋଧନ ଓ କମ୍ପାନୀ ଦସ୍ତଖତ ନଥିବା ଅତିରିକ୍ତ ଚେତାବନୀ।",
        todo: "ଆଟାଚମେଣ୍ଟ ଖୋଲନ୍ତୁ ନାହିଁ। ଇମେଲର IT କୁ ଅଭିଯୋଗ କରନ୍ତୁ। ରେକର୍ଡ ଯାଞ୍ଚ କରନ୍ତୁ: ଆପଣ ପ୍ରକୃତରେ ଏହି କମ୍ପାନୀରୁ କିଣିଥିଲେ କି? ଏପରି ଚାଲ୍ ଦେଖାଯିବା ପାଇଁ ଅଫିସ୍ କମ୍ପ୍ୟୁଟରରେ \"ଫାଇଲ୍ ଏକ୍ସଟେନସନ୍ ଦେଖାନ୍ତୁ\" ଚାଲୁ କରନ୍ତୁ।"
      },
      echallan: {
        title: "ଆପ୍ ଲିଙ୍କ ଥିବା ଟ୍ରାଫିକ୍ ଇ-ଚାଲାନ୍ SMS",
        ctx: "ସନ୍ଧ୍ୟାରେ ଅଫିସ୍ ଡ୍ରାଇଭରଙ୍କ ଫୋନରେ SMS।",
        who: "",
        subject: "",
        text: "ଟ୍ରାଫିକ୍ ଇ-ଚାଲାନ୍: ଆପଣଙ୍କ ଗାଡ଼ି KA-05-XX-1234 1 ଅକ୍ଟୋବରରେ ସିଗନାଲ୍ ଭାଙ୍ଗିଥିବା ରେକର୍ଡ ହୋଇଛି। [[money|ଜରିମାନା ₹1,000।]] ଦୁଇଗୁଣ ଜରିମାନା ଓ କୋର୍ଟ ସମନ୍‌ରୁ ବଞ୍ଚିବାକୁ [[urgent|24 ଘଣ୍ଟାରେ ଦିଅନ୍ତୁ]]। [[link|ସରକାରୀ ଚାଲାନ୍ ଆପ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ: echallan-pay.example.net/app.apk]]",
        why: "ପ୍ରକୃତ ଇ-ଚାଲାନ୍ ମେସେଜ୍ ବ୍ୟକ୍ତିଗତ ମୋବାଇଲ୍ ନମ୍ବରରୁ ନୁହେଁ, ସରକାରୀ ସେଣ୍ଡର୍ ID ରୁ ଆସେ, ଓ କେବେ .apk ଫାଇଲ୍ ଡାଉନଲୋଡ୍ କରିବାକୁ କୁହେ ନାହିଁ। ସେହି APK ଆପଣଙ୍କ SMS ଓ OTP ପଢ଼ୁଥିବା ବିପଜ୍ଜନକ ଆପ୍।",
        todo: "ମେସେଜ୍ ଡିଲିଟ୍ କରନ୍ତୁ। ଚାଲାନ୍ କେବଳ ସରକାରୀ ଇ-ଚାଲାନ୍ ୱେବସାଇଟ୍ ବା ରାଜ୍ୟ ପୋଲିସ୍ ଆପରେ ଯାଞ୍ଚ କରନ୍ତୁ। ସେହି ନମ୍ବରକୁ ସଞ୍ଚାର ସାଥୀ (ଚକ୍ଷୁ) ରେ ରିପୋର୍ଟ କରନ୍ତୁ।"
      },
      parcel_real: {
        title: "ଆଶା କରୁଥିବା ପାର୍ସଲର ଡେଲିଭରି ସୂଚନା",
        ctx: "ଗତ ସପ୍ତାହରେ ଆପଣ ପ୍ୟାକେଜିଂ ସାମଗ୍ରୀ ମଗାଇଥିଲେ। ଏହି SMS ଆସେ।",
        who: "",
        subject: "",
        text: "SpeedParcel: Sunrise Packaging ରୁ ଆପଣଙ୍କ ସିପମେଣ୍ଟ SP48213 [[ok|ଆଜି ଅପରାହ୍ନ 2 ରୁ 5 ମଧ୍ୟରେ ପହଞ୍ଚିବ।]] [[ok|କୌଣସି ପେମେଣ୍ଟ ବାକି ନାହିଁ।]] [[ok|ଟ୍ରାକ୍ କରିବାକୁ ଆମ ୱେବସାଇଟ୍ ବା ଆପରେ ସିପମେଣ୍ଟ ନମ୍ବର ବ୍ୟବହାର କରନ୍ତୁ।]]",
        why: "ପଞ୍ଜୀକୃତ ସେଣ୍ଡର୍ ID ରୁ ଆସିଛି (ବ୍ୟକ୍ତିଗତ ନମ୍ବର ନୁହେଁ), ଆଶା କରୁଥିବା ପାର୍ସଲ୍ ସହ ମେଳ ଖାଉଛି, ଟଙ୍କା ମାଗୁନାହିଁ ଓ ଟାପ୍ କରିବାକୁ ଲିଙ୍କ ଦେଉନାହିଁ। ପ୍ରକୃତ ଡେଲିଭରି ମେସେଜ୍ କେବଳ ଜଣାଏ।",
        todo: "କିଛି କରିବାକୁ ନାହିଁ। ପାର୍ସଲ୍ ମେସେଜ୍ ଫି, ଲିଙ୍କ ବା ଆପ୍ ମାଗିଲେ ଅଟକନ୍ତୁ ଓ ସିପମେଣ୍ଟ ନମ୍ବର ସହ ସରକାରୀ ୱେବସାଇଟରେ ଯାଞ୍ଚ କରନ୍ତୁ।"
      },
      kyc: {
        title: "KYC ଶେଷ, ଖାତା ଆଜି ବନ୍ଦ",
        ctx: "ରାତିରେ ମାଲିକଙ୍କ ଫୋନରେ SMS।",
        who: "",
        subject: "",
        text: "ପ୍ରିୟ ଗ୍ରାହକ, ଆପଣଙ୍କ KYC ର ମିଆଦ ସରିଥିବାରୁ [[threat|ଆପଣଙ୍କ NovaBank ଖାତା ଆଜି ବନ୍ଦ ହେବ]]। [[link|novabank-kyc-update.example.net]] ରେ [[urgent|ତୁରନ୍ତ ଅପଡେଟ୍ କରନ୍ତୁ]] ବା [[sender|ଆମ ଅଫିସରଙ୍କୁ 94XXX XXX51 ରେ ଫୋନ୍ କରନ୍ତୁ]]।",
        why: "ବ୍ୟାଙ୍କ କେବେ ବ୍ୟକ୍ତିଗତ ମୋବାଇଲ୍ ନମ୍ବରରୁ KYC ଲିଙ୍କ ପଠାନ୍ତି ନାହିଁ ଓ କିଛି ଘଣ୍ଟାରେ ଖାତା ବନ୍ଦ କରନ୍ତି ନାହିଁ। ଲିଙ୍କ ନକଲି ବ୍ୟାଙ୍କ ପୃଷ୍ଠା ଖୋଲେ ଯାହା ଆପଣଙ୍କ ଲଗଇନ୍ ଓ OTP ଚୋରି କରେ; \"ଅଫିସର\" ଆପ୍ ଇନଷ୍ଟଲ୍ କରିବାକୁ କୁହନ୍ତି।",
        todo: "ଲିଙ୍କ ଟାପ୍ କରନ୍ତୁ ନାହିଁ କି ଫୋନ୍ କରନ୍ତୁ ନାହିଁ। KYC ପ୍ରକୃତରେ ବାକି ଥିଲେ ବ୍ୟାଙ୍କର ନିଜ ଆପ୍ ବା ଶାଖା ଜଣାଇବ। SMS କୁ ସଞ୍ଚାର ସାଥୀ (ଚକ୍ଷୁ) ରେ ରିପୋର୍ଟ କରନ୍ତୁ।"
      },
      sim_swap: {
        title: "କଲ୍: ଆପଣଙ୍କ SIM ବନ୍ଦ ହେବ",
        ctx: "ବ୍ୟାଙ୍କ OTP ପାଇଁ ଏହି ନମ୍ବର ବ୍ୟବହାର କରୁଥିବା ଅଫିସ୍ ମ୍ୟାନେଜରଙ୍କୁ ଫୋନ୍।",
        who: "\"ଟେଲିକମ୍ କମ୍ପାନୀ ଅଧିକାରୀ\"",
        subject: "",
        text: "\"ମାଡାମ୍, ମୁଁ ଆପଣଙ୍କ ମୋବାଇଲ୍ ନେଟୱର୍କରୁ କହୁଛି। 5G ଅପଗ୍ରେଡ୍ ବାକି ଥିବାରୁ [[threat|ଆପଣଙ୍କ SIM 24 ଘଣ୍ଟାରେ ବନ୍ଦ ହେବ]]। [[otp|ଅପଗ୍ରେଡ୍ ପାଇଁ ଆପଣଙ୍କ SIM କାର୍ଡରେ ଛପା 20 ଅଙ୍କର ନମ୍ବର ପଢ଼ି ଶୁଣାନ୍ତୁ ଓ ଆସୁଥିବା SMS ପରେ 1 ଦବାନ୍ତୁ।]] [[urgent|ଏହି ଅଫର ଆଜି ହିଁ ଶେଷ।]]\"",
        why: "ଏହା SIM-ସ୍ୱାପ୍ ଚେଷ୍ଟା। 20 ଅଙ୍କର SIM ନମ୍ବର ଓ ଆପଣଙ୍କ \"1\" ସହ ଠକ ଆପଣଙ୍କ ନମ୍ବର ନିଜ SIM ରେ ଚାଲୁ କରେ। ଆପଣଙ୍କ ଫୋନ୍ ବନ୍ଦ ହୋଇଯାଏ ଓ ବ୍ୟାଙ୍କିଂ ଓ UPI ର ପ୍ରତି OTP ତା ପାଖକୁ ଯାଏ।",
        todo: "କଲ୍ କାଟନ୍ତୁ। ଟେଲିକମ୍ କମ୍ପାନୀ 5G ଅପଗ୍ରେଡ୍ ପାଇଁ କେବେ ଫୋନ୍ କରନ୍ତି ନାହିଁ। ଫୋନର ନେଟୱର୍କ ହଠାତ୍ ଅନେକ ସମୟ ପାଇଁ ଚାଲିଗଲେ ପ୍ରଥମେ ବ୍ୟାଙ୍କ, ତା'ପରେ ଅପରେଟରଙ୍କୁ ଫୋନ୍ କରନ୍ତୁ। ଆପଣଙ୍କ ନାମରେ ଥିବା SIM ସଞ୍ଚାର ସାଥୀରେ ଯାଞ୍ଚ କରନ୍ତୁ।"
      },
      mfa: {
        title: "ମଧ୍ୟରାତ୍ରିରୁ ସପ୍ତମ ଲଗଇନ୍ ଅନୁମୋଦନ ଅନୁରୋଧ",
        ctx: "ରାତିରେ ଅଫିସ୍ ଲଗଇନ୍ ଆପର ସାଇନ୍-ଇନ୍ ଅନୁମୋଦନ ଅନୁରୋଧରେ ଫୋନ୍ ଲଗାତାର ବାଜୁଛି। ତା'ପରେ ଗୋଟିଏ କଲ୍ ଆସେ।",
        who: "SecureLogin ଆପ୍",
        subject: "",
        text: "[[otp|ସାଇନ୍-ଇନ୍ ଅନୁମୋଦନ କରିବେ? କେହି ନୂଆ ଡିଭାଇସରୁ ଆପଣଙ୍କ ଅଫିସ୍ ଖାତାରେ ସାଇନ୍-ଇନ୍ କରୁଛନ୍ତି। ଆଗକୁ ଯିବାକୁ APPROVE ଟାପ୍ କରନ୍ତୁ।]] [[odd|(ମଧ୍ୟରାତ୍ରିରୁ ଏହା 7ମ ଅନୁରୋଧ।)]] କିଛି କ୍ଷଣ ପରେ ଜଣେ କଲର୍ କୁହନ୍ତି: \"[[urgent|ମୁଁ IT ରୁ କହୁଛି, ଆମେ ସର୍ଭର ଠିକ୍ କରୁଛୁ। ଆଲର୍ଟ ବନ୍ଦ ହେବା ପାଇଁ କେବଳ ଅନୁରୋଧ ଅନୁମୋଦନ କରିଦିଅନ୍ତୁ।]]\"",
        why: "ଏହାକୁ \"MFA କ୍ଳାନ୍ତି\" କୁହାଯାଏ। ଆକ୍ରମଣକାରୀଙ୍କ ପାଖରେ ଆପଣଙ୍କ ପାସୱାର୍ଡ ଆଗରୁ ଅଛି ଓ ସେ ଅନୁରୋଧର ବର୍ଷା କରୁଛନ୍ତି, ଏହି ଆଶାରେ ଯେ ବିରକ୍ତ ହୋଇ ଆପଣ Approve ଦବାଇବେ। \"IT\" କଲ୍ ଆକ୍ରମଣର ଅଂଶ। ପ୍ରକୃତ IT କେବେ ଆପଣ ଆରମ୍ଭ ନ କରିଥିବା ଲଗଇନ୍ ଅନୁମୋଦନ କରିବାକୁ କୁହେ ନାହିଁ।",
        todo: "ପ୍ରତିଥର Deny ଦବାନ୍ତୁ। ବିଶ୍ୱସ୍ତ ଡିଭାଇସରୁ ତୁରନ୍ତ ପାସୱାର୍ଡ ବଦଳାନ୍ତୁ ଓ IT କୁ କୁହନ୍ତୁ। ବାରମ୍ବାର ଅନୁରୋଧର ଅର୍ଥ ଆପଣଙ୍କ ପାସୱାର୍ଡ ଆଗରୁ ଲିକ୍ ହୋଇସାରିଛି।"
      },
      gst_real: {
        title: "ଆପଣଙ୍କ CA ଙ୍କଠୁ ମାସିକ GST ସ୍ମାରକ",
        ctx: "ଆପଣଙ୍କ ଚାର୍ଟାର୍ଡ ଆକାଉଣ୍ଟାଣ୍ଟଙ୍କ ସେଭ୍ ନମ୍ବରରୁ WhatsApp ମେସେଜ୍।",
        who: "ମେହେଟା ଆଣ୍ଡ କୋ. (ଆମ CA)",
        subject: "",
        text: "ସୁପ୍ରଭାତ। ସ୍ମାରକ: ସେପ୍ଟେମ୍ବରର GSTR-3B 20 ଅକ୍ଟୋବରରେ ଦେୟ। [[ok|ଦୟାକରି ବିକ୍ରି ଓ କିଣା ସିଟ୍ ପ୍ରତି ମାସ ଭଳି ସେହି ସେୟାର୍ଡ ଫୋଲ୍ଡରରେ ଅପଲୋଡ୍ କରନ୍ତୁ।]] [[ok|ଏବେ ଆପଣଙ୍କ ପକ୍ଷରୁ କୌଣସି ପେମେଣ୍ଟ ଦରକାର ନାହିଁ]]; ଫାଇଲିଂ ପରେ ମୁଁ ଚାଲାନ୍ ବିବରଣୀ ପଠାଇବି, ଓ ଆମ ସାଧାରଣ କଲରେ ନିଶ୍ଚିତ କରିବା।",
        why: "ଜଣାଶୁଣା CA, ସେଭ୍ ନମ୍ବର, ସାଧାରଣ ମାସିକ ପ୍ରକ୍ରିୟା, ନୂଆ ଖାତା ନମ୍ବର ନାହିଁ, ଲିଙ୍କ ନାହିଁ ଓ ପ୍ରକୃତ ଶେଷ ତାରିଖଠୁ ଅଧିକ ତରବର ନାହିଁ। ଯାଞ୍ଚ ଆପଣଙ୍କ ନିୟମିତ କଲରେ ହୁଏ।",
        todo: "ଆପଣଙ୍କ ସାଧାରଣ ପ୍ରକ୍ରିୟା ଅନୁସରଣ କରନ୍ତୁ। କେବେ \"CA\" ନୂଆ ବ୍ୟାଙ୍କ ଖାତା ପଠାଇଲେ ବା ଲିଙ୍କରେ ପଇଠ କରିବାକୁ କହିଲେ, ପ୍ରଥମେ ଜଣାଶୁଣା ନମ୍ବରରେ CA ଅଫିସକୁ ଫୋନ୍ କରନ୍ତୁ।"
      },
      lookalike: {
        title: "ଅବିକଳ ଡୋମେନରେ ଦରମା ସ୍ଲିପ୍",
        ctx: "ସଂଶୋଧିତ ଦରମା ସ୍ଲିପ୍ ବିଷୟରେ ଇମେଲ୍। ଆପଣଙ୍କ କମ୍ପାନୀର ପ୍ରକୃତ ଡୋମେନ୍ meridiantextiles.example.com।",
        who: "ପେରୋଲ୍ ଟିମ୍",
        subject: "ଆପଣଙ୍କ ସଂଶୋଧିତ ଦରମା ସ୍ଲିପ୍ ପ୍ରସ୍ତୁତ",
        text: "ପ୍ରିୟ କର୍ମଚାରୀ, ଅକ୍ଟୋବରରୁ ଆପଣଙ୍କ ଦରମା ଢାଞ୍ଚା ବଦଳିଛି। [[link|ନୂଆ ସ୍ଲିପ୍ ଦେଖିବାକୁ meridian-textiles-portal.example.com ରେ ଅଫିସ୍ ପାସୱାର୍ଡ ସହ ଲଗଇନ୍ କରନ୍ତୁ।]] [[urgent|ଲିଙ୍କ 12 ଘଣ୍ଟାରେ ଶେଷ ହେବ।]] [[sender|payroll@meridian-textiles.example.com ରୁ ପଠାଯାଇଛି]]",
        why: "କମ୍ପାନୀର ପ୍ରକୃତ ଡୋମେନ୍ meridiantextiles.example.com; ଇମେଲ୍ meridian-textiles (ହାଇଫେନ୍ ସହ) ବ୍ୟବହାର କରେ, ଯାହା ଅବିକଳ ଦେଖାଯାଉଥିବା ଡୋମେନ୍। ଲିଙ୍କ ନକଲ କରାଯାଇଥିବା ଲଗଇନ୍ ପୃଷ୍ଠାକୁ ନିଏ ଯାହା ଆପଣଙ୍କ ଅଫିସ୍ ପାସୱାର୍ଡ ଚୋରି କରେ। ଦରମା ସ୍ଲିପ୍ ଆପଣ ସବୁବେଳେ ବ୍ୟବହାର କରୁଥିବା HR ପୋର୍ଟାଲରେ ହିଁ ଥାଏ।",
        todo: "କ୍ଲିକ୍ କରନ୍ତୁ ନାହିଁ। ଠିକଣା ଟାଇପ୍ କରି ବା ବୁକମାର୍କରୁ HR ପୋର୍ଟାଲ୍ ନିଜେ ଖୋଲନ୍ତୁ। ଇମେଲର IT କୁ ଅଭିଯୋଗ କରନ୍ତୁ; ଫରୱାର୍ଡ କଲେ ସେମାନେ ସମସ୍ତଙ୍କ ପାଇଁ ନକଲି ଡୋମେନ୍ ବ୍ଲକ୍ କରିପାରିବେ।"
      },
      usb: {
        title: "ପାର୍କିଂରେ ମିଳିଥିବା ପେନ୍ ଡ୍ରାଇଭ୍",
        ctx: "ସୋମବାର ସକାଳ, ଅଫିସ୍ ପ୍ରବେଶ ଦ୍ୱାର ପାଖରେ।",
        who: "ଅଫିସ୍ ପାର୍କିଂରେ ମିଳିଥିବା ପେନ୍ ଡ୍ରାଇଭ୍",
        subject: "",
        text: "ପ୍ରବେଶ ଦ୍ୱାର ପାଖରେ ଗୋଟିଏ ପେନ୍ ଡ୍ରାଇଭ୍ ପଡ଼ିଛି, ତା ଉପରେ ଲେବଲ୍: [[prize|\"ଦରମା ବୃଦ୍ଧି 2026 - ଗୋପନୀୟ - କେବଳ ପରିଚାଳନା ପାଇଁ\"]]। ଜଣେ ସହକର୍ମୀ କୁହନ୍ତି: \"[[remote|ଚାଲ ରିସେପସନ୍ PC ରେ ଲଗାଇ ଦେଖିବା କାହାର।]]\"",
        why: "ଏହାକୁ \"USB ଡ୍ରପ୍\" କୁହାଯାଏ। ଆକ୍ରମଣକାରୀ ଲୋଭନୀୟ ଲେବଲ୍ ଥିବା ପେନ୍ ଡ୍ରାଇଭ୍ ଛାଡ଼ିଯାଆନ୍ତି; ଗୋଟିଏ ଲଗାଇବା ମାତ୍ରେ ଲୁଚିଥିବା ସଫ୍ଟୱେର୍ ନିଜେ ଇନଷ୍ଟଲ୍ ହୋଇ ଅଫିସ୍ ନେଟୱର୍କରେ ବ୍ୟାପିପାରେ। କୌତୂହଳ ହିଁ ଆକ୍ରମଣ।",
        todo: "କେଉଁଠି ଲଗାନ୍ତୁ ନାହିଁ। ଲଫାପାରେ ରଖି IT ବା ସୁରକ୍ଷା ବିଭାଗକୁ ଦିଅନ୍ତୁ। କମ୍ପାନୀ ଅଟୋ-ରନ୍ ବନ୍ଦ କରି ଅଜଣା USB ଡିଭାଇସ୍ ବ୍ଲକ୍ କରିବା ଉଚିତ।"
      },
      wifi: {
        title: "ଏୟାରପୋର୍ଟର ମାଗଣା Wi-Fi ଇମେଲ୍ ପାସୱାର୍ଡ ମାଗେ",
        ctx: "ଫ୍ଲାଇଟ୍ ଅପେକ୍ଷାରେ, ଦୁଇଟି ଭେଣ୍ଡର ପେମେଣ୍ଟ ଅନୁମୋଦନ ପାଇଁ ଆପଣ ମାଗଣା ନେଟୱର୍କରେ ଯୋଡ଼ି ହୁଅନ୍ତି।",
        who: "ଏୟାରପୋର୍ଟରେ ମାଗଣା Wi-Fi ଲଗଇନ୍ ସ୍କ୍ରିନ୍",
        subject: "",
        text: "ନେଟୱର୍କ: Airport_Free_WiFi_5G (ପାସୱାର୍ଡ ନାହିଁ)। [[otp|ଆଗକୁ ଯିବାକୁ ଆପଣଙ୍କ ଇମେଲ୍ ଠିକଣା ଓ ଇମେଲ୍ ପାସୱାର୍ଡ ଦେଇ ସାଇନ୍-ଇନ୍ କରନ୍ତୁ।]] ତା'ପରେ ଫ୍ଲାଇଟ୍ ଅପେକ୍ଷା ବେଳେ ଆପଣ [[data|କମ୍ପାନୀ ବ୍ୟାଙ୍କିଂ ପୋର୍ଟାଲରେ ଦୁଇଟି ଭେଣ୍ଡର ପେମେଣ୍ଟ ଅନୁମୋଦନ କରିବାକୁ]] ଭାବନ୍ତି।",
        why: "ସରକାରୀ ଲାଗୁଥିବା ନାମର ହଟସ୍ପଟ୍ ଯେକେହି ତିଆରି କରିପାରେ। ନକଲି ନେଟୱର୍କରେ ଆକ୍ରମଣକାରୀ ଆପଣ ଯାହା ଟାଇପ୍ କରନ୍ତି ଦେଖିପାରେ, ଓ ଇମେଲ୍ ପାସୱାର୍ଡ ମାଗୁଥିବା ଲଗଇନ୍ ପୃଷ୍ଠା ତଥ୍ୟ ଚୋରି କରେ। ସାର୍ବଜନୀନ Wi-Fi ରେ ବ୍ୟାଙ୍କିଂ ବିପଜ୍ଜନକ।",
        todo: "କାମ ଓ ବ୍ୟାଙ୍କିଂ ପାଇଁ ନିଜ ମୋବାଇଲ୍ ଡାଟା ବା କମ୍ପାନୀ VPN ବ୍ୟବହାର କରନ୍ତୁ। Wi-Fi ଲଗଇନ୍ ପୃଷ୍ଠାରେ କେବେ ଅଫିସ୍ ବା ଇମେଲ୍ ପାସୱାର୍ଡ ଟାଇପ୍ କରନ୍ତୁ ନାହିଁ। ଖୋଲା ନେଟୱର୍କରେ ସ୍ୱତଃ ଯୋଡ଼ିବା ବନ୍ଦ କରନ୍ତୁ।"
      },
      upi_real: {
        title: "ପେମେଣ୍ଟ ମିଳିବାର ନୋଟିଫିକେସନ୍",
        ctx: "କାଉଣ୍ଟରରେ ଥିବାବେଳେ ଆପଣଙ୍କ ନିଜ UPI ଆପର ନୋଟିଫିକେସନ୍।",
        who: "UPI ଆପ୍",
        subject: "",
        text: "[[ok|Anita Traders ଠୁ ₹2,500 ମିଳିଲା]] ଆପଣଙ୍କ 4471 ରେ ଶେଷ ହେଉଥିବା କରେଣ୍ଟ ଖାତାରେ। [[ok|କୌଣସି ପଦକ୍ଷେପ ଦରକାର ନାହିଁ।]] କାରବାର ID 628104...",
        why: "ଭିତରକୁ ଆସୁଥିବା ଟଙ୍କା ପାଇଁ କେବେ PIN, OTP ବା ସ୍କାନ୍ ଦରକାର ନାହିଁ। ନୋଟିଫିକେସନ୍ ଆପଣଙ୍କ ନିଜ ଆପର, ଦେଉଥିବା ବ୍ୟକ୍ତିଙ୍କ ନାମ କହେ ଓ ଆପଣଙ୍କଠୁ କିଛି ମାଗେ ନାହିଁ। ଏହାକୁ \"କଲେକ୍ଟ ରିକ୍ୱେଷ୍ଟ\" ବା ସ୍କାନ୍ କରିବାକୁ କୁହାଯାଇଥିବା QR ସହ ତୁଳନା କରନ୍ତୁ: ସେଗୁଡ଼ିକ ଟଙ୍କା ବାହାରକୁ ନିଏ।",
        todo: "କିଛି କରିବାକୁ ନାହିଁ। ରାଶି ଇନଭଏସ୍ ସହ ମିଳାନ୍ତୁ। \"ପେମେଣ୍ଟ ମିଳିଲା\" ମେସେଜ୍ କେବେ ଅନୁମୋଦନ, PIN ବା ସ୍କାନ୍ ମାଗିଲେ, ତାହା ଟଙ୍କା ଦେଉନାହିଁ, ନେଉଛି।"
      },
      dpdp: {
        title: "ସହକର୍ମୀ ଗ୍ରାହକ ତାଲିକା WhatsApp ରେ ଚାହାଁନ୍ତି",
        ctx: "ସନ୍ଧ୍ୟାରେ ସେଲ୍ସ ସହକର୍ମୀଙ୍କ ନମ୍ବରରୁ WhatsApp ମେସେଜ୍।",
        who: "ସମୀର (ସେଲ୍ସ ସହକର୍ମୀ)",
        subject: "",
        text: "ଭାଇ, ଆଜି ମୁଁ ଘରୁ କାମ କରୁଛି। [[data|ଫୋନ୍ ନମ୍ବର ଓ ଆଧାର କପି ସହ ପୂରା ଗ୍ରାହକ ତାଲିକା ଏକ୍ସପୋର୍ଟ କରି ମୋତେ ଏହି WhatsApp ରେ ପଠା]], ପରେ ଡିଲିଟ୍ କରିଦେବି। [[urgent|କ୍ୟାମ୍ପେନ୍ ପାଇଁ 10 ମିନିଟରେ ଦରକାର।]] [[secret|ମ୍ୟାନେଜରଙ୍କୁ କହିବା ଦରକାର ନାହିଁ, ଛୋଟ କଥା।]]",
        why: "ଗ୍ରାହକଙ୍କ ଫୋନ୍ ନମ୍ବର ଓ ଆଧାର କପି ଭାରତର DPDP ଆଇନ ଦ୍ୱାରା ସୁରକ୍ଷିତ ବ୍ୟକ୍ତିଗତ ଡାଟା। ବ୍ୟକ୍ତିଗତ WhatsApp ରେ ପଠାଇଲେ ତାହା କମ୍ପାନୀ ନିୟନ୍ତ୍ରଣ ବାହାରକୁ ଯାଏ, ଓ ଏହା ହ୍ୟାକ୍ ହୋଇଥିବା ଖାତା ବା ନକଲି ପରିଚୟ ମଧ୍ୟ ହୋଇପାରେ। \"ମ୍ୟାନେଜରଙ୍କୁ କୁହନି\" କେବେ ଗ୍ରହଣୀୟ ନୁହେଁ।",
        todo: "ବିନମ୍ରତାର ସହ ମନା କରନ୍ତୁ। ଗ୍ରାହକ ଡାଟା କେବଳ କମ୍ପାନୀର ଅନୁମୋଦିତ ସିଷ୍ଟମରେ, ମ୍ୟାନେଜରଙ୍କ ଅନୁମତି ସହ ଓ ଦରକାରୀ ବିବରଣୀ ହିଁ ସେୟାର କରନ୍ତୁ। ସହକର୍ମୀଙ୍କ ଖାତା ଅଦ୍ଭୁତ ଲାଗିଲେ ତାଙ୍କୁ ଫୋନ୍ କରନ୍ତୁ।"
      },
      otp_call: {
        title: "ପେମେଣ୍ଟ ବାତିଲ୍ ପାଇଁ \"ଠକେଇ ବିଭାଗ\"କୁ OTP ଦରକାର",
        ctx: "ଫୋନରେ OTP SMS ଆସୁଥିବା ବେଳେ ହିଁ ଆସିଥିବା କଲ୍।",
        who: "\"NovaBank ଠକେଇ ବିଭାଗ\"",
        subject: "",
        text: "\"ସାର୍, [[threat|ଆପଣଙ୍କ କାର୍ଡରେ ଏବେ ₹49,999 ର କାରବାର ହେଉଛି।]] ଏହାକୁ ବାତିଲ୍ କରିବାକୁ [[urgent|ଆମକୁ 60 ସେକେଣ୍ଡରେ ପଦକ୍ଷେପ ନେବାକୁ ହେବ]]। [[otp|ଏବେ ଆପଣଙ୍କ ଫୋନକୁ ଆସିଥିବା OTP କୁହନ୍ତୁ, ମୁଁ ଏହାକୁ ଫେରାଇଦେବି।]] [[secret|ଦୟାକରି କଲ୍ କାଟନ୍ତୁ ନାହିଁ ବା କାହାକୁ ଫୋନ୍ କରନ୍ତୁ ନାହିଁ।]]\"",
        why: "\"ଏବେ ଆସିଥିବା\" OTP ଠକର ଆପଣଙ୍କ କାର୍ଡରେ ପେମେଣ୍ଟ କରିବା ଚେଷ୍ଟା ପାଇଁ। ଏହାକୁ ପଢ଼ି ଶୁଣାଇଲେ ପେମେଣ୍ଟ ସମ୍ପୂର୍ଣ୍ଣ ହୁଏ। ବ୍ୟାଙ୍କ କିଛି ବାତିଲ୍ ପାଇଁ କେବେ OTP ମାଗେ ନାହିଁ, ଓ 60 ସେକେଣ୍ଡର ଆତଙ୍କ ଏଥିପାଇଁ ସୃଷ୍ଟି କରାଯାଏ ଯେ ଆପଣ ଭାବିବେ ନାହିଁ।",
        todo: "କଲ୍ କାଟନ୍ତୁ। ବ୍ୟାଙ୍କ ଆପ୍ ଖୋଲି ନିଜେ କାର୍ଡ ବ୍ଲକ୍ କରନ୍ତୁ, ବା କାର୍ଡ ପଛର ନମ୍ବରରେ ଫୋନ୍ କରନ୍ତୁ। OTP କେବେ କାହାକୁ ପଢ଼ି ଶୁଣାନ୍ତୁ ନାହିଁ। ଟଙ୍କା ଚାଲିଯାଇଥିଲେ ତୁରନ୍ତ 1930 କୁ ଫୋନ୍ କରନ୍ତୁ।"
      },
      hr_bonus: {
        title: "ଦୀପାବଳି ବୋନସ୍ ଫର୍ମ ନେଟ୍-ବ୍ୟାଙ୍କିଂ ଲଗଇନ୍ ମାଗେ",
        ctx: "ଦୀପାବଳି ଠିକ୍ ଆଗରୁ, HR ଭଳି ଦେଖାଯାଉଥିବା ଠିକଣାରୁ ସମସ୍ତ କର୍ମଚାରୀଙ୍କୁ ଇମେଲ୍।",
        who: "HR ରିୱାର୍ଡସ୍ ଟିମ୍",
        subject: "ଦୀପାବଳି ବୋନସ୍ ₹25,000 - ଆପଣଙ୍କ ବ୍ୟାଙ୍କ ଖାତା ନିଶ୍ଚିତ କରନ୍ତୁ",
        text: "ପ୍ରିୟ ସହକର୍ମୀ, ₹25,000 ଦୀପାବଳି ବୋନସ୍ ଘୋଷଣା କରି ଆମେ ଖୁସି। [[attach|ସଂଲଗ୍ନ ଫର୍ମ (Bonus_Form.html) ଖୋଲନ୍ତୁ]] ଓ ବୋନସ୍ ସିଧା ଜମା ହେବା ପାଇଁ [[otp|ଆପଣଙ୍କ ନେଟ୍-ବ୍ୟାଙ୍କିଂ ୟୁଜର୍ ID ଓ ପାସୱାର୍ଡ ଦିଅନ୍ତୁ]]। [[urgent|ଆଜି ସନ୍ଧ୍ୟା 6 ପରେ ଆସିଥିବା ଫର୍ମ ଗ୍ରହଣ କରାଯିବ ନାହିଁ।]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "HR ପାଖରେ ଆପଣଙ୍କ ଦରମା ଖାତା ଆଗରୁ ଅଛି; କୌଣସି କମ୍ପାନୀ ବୋନସ୍ ପାଇଁ ନେଟ୍-ବ୍ୟାଙ୍କିଂ ଲଗଇନ୍ ମାଗେ ନାହିଁ। ପ୍ରେରକ ଅବିକଳ ଡୋମେନ୍, HTML ଆଟାଚମେଣ୍ଟ ନକଲି ବ୍ୟାଙ୍କ ଲଗଇନ୍ ପୃଷ୍ଠା, ଓ ସେହି ଦିନର ସମୟସୀମା ଚାପ ବଢ଼ାଏ।",
        todo: "ଆଟାଚମେଣ୍ଟ ଖୋଲନ୍ତୁ ନାହିଁ କି କିଛି ଦିଅନ୍ତୁ ନାହିଁ। HR ଙ୍କୁ ସିଧାସଳଖ ବା ଇଣ୍ଟ୍ରାନେଟରେ ପଚାରନ୍ତୁ। ସହକର୍ମୀମାନେ ସତର୍କ ହେବା ପାଇଁ ଇମେଲର IT କୁ ଅଭିଯୋଗ କରନ୍ତୁ।"
      },
      electricity: {
        title: "ଆଜି ରାତିରେ ଅଫିସର ବିଜୁଳି କଟିବ",
        ctx: "ରାତି 8:35 ରେ ଦୋକାନ ମାଲିକଙ୍କ ଫୋନରେ SMS।",
        who: "",
        subject: "",
        text: "ପ୍ରିୟ ଗ୍ରାହକ, [[odd|ଗତ ମାସର ବିଲ୍ ଆମ ସିଷ୍ଟମରେ ଅପଡେଟ୍ ନାହିଁ]] ତେଣୁ [[threat|ଆପଣଙ୍କ ଅଫିସର ବିଜୁଳି ସଂଯୋଗ ଆଜି ରାତି 9:30 ରେ କଟାଯିବ]]। ଦୟାକରି ଆମ ଅଫିସରଙ୍କୁ [[sender|93XXX XXX40]] ରେ [[urgent|ତୁରନ୍ତ]] ଯୋଗାଯୋଗ କରନ୍ତୁ।",
        why: "ବିଜୁଳି ବୋର୍ଡ ବ୍ୟକ୍ତିଗତ ମୋବାଇଲରୁ ଗୋଟିଏ SMS ପରେ ରାତିରେ ବିଜୁଳି କାଟେ ନାହିଁ। ଫୋନ୍ କଲେ \"ଅଫିସର\" ଆପ୍ ଇନଷ୍ଟଲ୍ କରିବାକୁ ବା ଲିଙ୍କରେ ₹10 ଦେବାକୁ କୁହନ୍ତି, ଓ ପ୍ରକୃତ ଲକ୍ଷ୍ୟ ଆପଣଙ୍କ ବ୍ୟାଙ୍କ ଖାତା।",
        todo: "ଫୋନ୍ କରନ୍ତୁ ନାହିଁ। ବିଲ୍ ବିଜୁଳି ବୋର୍ଡର ସରକାରୀ ଆପ୍ ବା ଅଫିସରେ ଯାଞ୍ଚ କରନ୍ତୁ। ସେହି ନମ୍ବରକୁ ସଞ୍ଚାର ସାଥୀ (ଚକ୍ଷୁ) ରେ ରିପୋର୍ଟ କରନ୍ତୁ।"
      },
      wa_hijack: {
        title: "ସହକର୍ମୀ 6 ଅଙ୍କର କୋଡ୍ ଫରୱାର୍ଡ କରିବାକୁ କୁହନ୍ତି",
        ctx: "ଆପଣଙ୍କ ଫୋନରେ କୋଡ୍ SMS ଆସିବା ପରେ ତୁରନ୍ତ, ବିଳମ୍ବ ରାତିରେ ସହକର୍ମୀଙ୍କ ସେଭ୍ ନମ୍ବରରୁ WhatsApp ମେସେଜ୍।",
        who: "ରୋହନ (ସହକର୍ମୀ)",
        subject: "",
        text: "ଆରେ, ଏତେ ରାତିରେ ହଇରାଣ କରୁଥିବାରୁ କ୍ଷମା କର। [[odd|WhatsApp ରେ ଲଗଇନ୍ କଲାବେଳେ ଭୁଲରେ ତୋ ନମ୍ବର ଦେଇଦେଲି ଓ 6 ଅଙ୍କର କୋଡ୍ ତୋ ଫୋନକୁ ଚାଲିଗଲା।]] [[otp|ସେହି କୋଡ୍ ମୋତେ ଫରୱାର୍ଡ କର]], [[urgent|ଶୀଘ୍ର, ନହେଲେ ମୋ ଖାତା ଲକ୍ ହୋଇଯିବ।]]",
        why: "ଆସିଥିବା କୋଡ୍ ଆପଣଙ୍କ ନିଜ WhatsApp ର ଭେରିଫିକେସନ୍ କୋଡ୍। ଯିଏ ଏହା ପାଏ ସେ ଆପଣଙ୍କ ଖାତା ଦଖଲ କରେ ଓ ତା'ପରେ ଆପଣଙ୍କ ସମସ୍ତ କଣ୍ଟାକ୍ଟ ଓ ଅଫିସ୍ ଗ୍ରୁପକୁ ଟଙ୍କା ମାଗି ମେସେଜ୍ ପଠାଏ। ଏହି ମେସେଜ୍ ମଧ୍ୟ ସହକର୍ମୀଙ୍କ ଆଗରୁ ହ୍ୟାକ୍ ହୋଇଥିବା ଖାତାରୁ ଆସିଥାଇପାରେ।",
        todo: "ଭେରିଫିକେସନ୍ କୋଡ୍ କେବେ ଫରୱାର୍ଡ କରନ୍ତୁ ନାହିଁ। ସହକର୍ମୀଙ୍କୁ ଫୋନ୍ କରି ଜଣାନ୍ତୁ ଯେ ତାଙ୍କ ଖାତା ହ୍ୟାକ୍ ହୋଇଛି। WhatsApp ସେଟିଂସରେ ଟୁ-ଷ୍ଟେପ୍ ଭେରିଫିକେସନ୍ ଚାଲୁ କରନ୍ତୁ।"
      },
      invest_group: {
        title: "ଗ୍ୟାରେଣ୍ଟି ଲାଭର ଷ୍ଟକ୍-ଟିପ୍ସ ଗ୍ରୁପ୍",
        ctx: "ନ ପଚାରି ଆପଣଙ୍କୁ ଗୋଟିଏ WhatsApp ଗ୍ରୁପରେ ଯୋଡ଼ାଗଲା।",
        who: "VIP Stock Tips - ଗ୍ରୁପ୍ ଆଡମିନ୍",
        subject: "",
        text: "ଆମ ପ୍ରିମିୟମ୍ ଗ୍ରୁପରେ ସ୍ୱାଗତ! [[prize|ଗ୍ୟାରେଣ୍ଟି ଇନସାଇଡର୍ ଟିପ୍ସ ସହ ଆମ ସଦସ୍ୟମାନେ ଗତ ମାସରେ 32% ଲାଭ କଲେ।]] ଆମ ଟ୍ରେଡିଂ ଆପ୍ [[link|ଆପ୍ ଷ୍ଟୋରରୁ ନୁହେଁ, ଏହି ଲିଙ୍କରୁ]] ଡାଉନଲୋଡ୍ କରନ୍ତୁ, ଓ [[money|₹50,000 ଜମା କରି ଆରମ୍ଭ କରନ୍ତୁ]]। [[prize|ସଦସ୍ୟମାନେ ଦେଇଥିବା ଲାଭର ସ୍କ୍ରିନସଟ୍ ଦେଖନ୍ତୁ!]] [[urgent|ପ୍ରବେଶ ମଧ୍ୟରାତ୍ରିରେ ବନ୍ଦ ହେବ।]]",
        why: "କେହି ଲାଭର ଗ୍ୟାରେଣ୍ଟି ଦେଇପାରନ୍ତି ନାହିଁ, ଓ \"ଇନସାଇଡର୍ ଟିପ୍ସ\" ବେଆଇନ। ଆପ୍ ନକଲି: ଆପଣ ଅଧିକ ଜମା କରିବା ପାଇଁ କାଳ୍ପନିକ ଲାଭ ଦେଖାଏ, ଓ ଟଙ୍କା ଉଠାଇବାକୁ ଦିଏ ନାହିଁ। ସ୍କ୍ରିନସଟ୍ ଦେଉଥିବା \"ସଦସ୍ୟ\" ଠକ ହିଁ।",
        todo: "ଗ୍ରୁପ୍ ଛାଡ଼ି ରିପୋର୍ଟ କରନ୍ତୁ। କେବଳ SEBI ପଞ୍ଜୀକୃତ ବ୍ରୋକର ଓ ସରକାରୀ ଆପ୍ ଷ୍ଟୋରର ଆପ୍ ମାଧ୍ୟମରେ ନିବେଶ କରନ୍ତୁ। ଜମା କରିସାରିଥିଲେ 1930 କୁ ଫୋନ୍ କରନ୍ତୁ ଓ cybercrime.gov.in ରେ ଅଭିଯୋଗ କରନ୍ତୁ।"
      },
      bank_real: {
        title: "ଆପଣ କରିଥିବା ପେମେଣ୍ଟର ଡେବିଟ୍ ଆଲର୍ଟ",
        ctx: "ଆପଣଙ୍କ ଆକାଉଣ୍ଟସ୍ ଟିମ୍ ଆଜି ପ୍ୟାକେଜିଂ ଭେଣ୍ଡରଙ୍କୁ ପଇଠ କଲେ। ଏହି SMS ଆସେ।",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|Sunrise Packaging କୁ NEFT ପାଇଁ 10 ଅକ୍ଟୋବରରେ 4471 ରେ ଶେଷ ହେଉଥିବା ଖାତାରୁ ₹86,000 ଡେବିଟ୍]], ସନ୍ଦର୍ଭ N26101034। ବାଲାନ୍ସ ₹3,42,118। [[ok|ଆପଣ କରିନଥିଲେ ଆପଣଙ୍କ ଡେବିଟ୍ କାର୍ଡ ପଛର ନମ୍ବରରେ ଫୋନ୍ କରନ୍ତୁ।]]",
        why: "ଏହା ଆପଣଙ୍କ ଆକାଉଣ୍ଟସ୍ ଟିମ୍ ଆଜି କରିଥିବା ପେମେଣ୍ଟ ସହ ମେଳ ଖାଏ, ବ୍ୟାଙ୍କର ସେଣ୍ଡର୍ ID ରୁ ଆସିଛି, SMS ରେ ଲିଙ୍କ ବା ନମ୍ବର ନାହିଁ, ଓ ଆପଣଙ୍କ ନିଜ କାର୍ଡର ନମ୍ବରକୁ ଦେଖାଏ।",
        todo: "ଆପଣଙ୍କ ପେମେଣ୍ଟ ରେକର୍ଡ ସହ ମିଳାନ୍ତୁ। କୌଣସି ଡେବିଟ୍ ଆଲର୍ଟ ଆପଣଙ୍କ ପେମେଣ୍ଟ ସହ ମେଳ ନ ଖାଇଲେ, ମେସେଜର ନୁହେଁ, କାର୍ଡର ନମ୍ବରରେ ତୁରନ୍ତ ବ୍ୟାଙ୍କକୁ ଫୋନ୍ କରନ୍ତୁ।"
      }
    }
  },
  ta: {
    scenarios: {
      ceo_gift: {
        title: "புதிய எண்ணிலிருந்து முதலாளி கிஃப்ட் கார்டுகள் கேட்கிறார்",
        ctx: "காலை 9 மணிக்குக் கணக்குப் பிரிவு ஊழியருக்கு WhatsApp மெசேஜ். சுயவிவரப் படம் நிறுவன இணையதளத்தில் உள்ள MD-யின் படம்.",
        who: "ராஜேஷ் சார் (புதிய எண்)",
        subject: "",
        text: "ஹாய், நான் ராஜேஷ். [[sender|என் பழைய போன் பழுதாகிவிட்டது, இப்போதைக்கு இந்த எண்ணைப் பயன்படுத்துகிறேன்.]] ஒரு பெரிய கிளையன்டுடன் மீட்டிங்கில் இருக்கிறேன். [[money|₹5,000 மதிப்புள்ள 10 கிஃப்ட் கார்டுகள் வாங்குங்கள்]], குறியீடுகளை எனக்கு [[urgent|30 நிமிடங்களுக்குள்]] அனுப்புங்கள். [[secret|இதைப் பற்றி யாரிடமும் பேசாதீர்கள், கிளையன்டுக்கு சர்ப்ரைஸ்.]]",
        why: "மோசடிக்காரர்கள் இணையதளத்திலிருந்து MD-யின் படத்தை எடுத்துப் புதிய எண்ணிலிருந்து எழுதுகிறார்கள். உண்மையான முதலாளி கிஃப்ட்-கார்டு குறியீடுகளையோ ரகசியத்தையோ ஒருபோதும் கேட்க மாட்டார். புதிய எண் + அவசரம் + ரகசியம் = பழைய \"CEO மோசடி\".",
        todo: "எதையும் வாங்காதீர்கள். போனில் சேமித்த எண்ணில் முதலாளியை அழையுங்கள் அல்லது அவர் அறைக்கு நேரில் செல்லுங்கள். முழு அலுவலகமும் எச்சரிக்கையாக இருக்க IT அல்லது மேலாளரிடம் சொல்லுங்கள்."
      },
      it_real: {
        title: "IT-யிடமிருந்து கடவுச்சொல் கொள்கை அறிவிப்பு",
        ctx: "நிறுவனத்தின் சொந்த IT உதவி மையத்திலிருந்து அனைத்து ஊழியர்களுக்கும் மின்னஞ்சல்.",
        who: "IT உதவி மையம்",
        subject: "அக்டோபர் 15 முதல் கடவுச்சொல் கொள்கையில் மாற்றம்",
        text: "அன்புள்ள சக ஊழியர்களே, அக்டோபர் 15 முதல் கடவுச்சொல் குறைந்தது 12 எழுத்துகள் இருக்க வேண்டும். [[ok|இன்று நீங்கள் எதுவும் செய்ய வேண்டியதில்லை.]] கடவுச்சொல் காலாவதியானதும் அதை [[ok|நீங்கள் வழக்கமாகப் பயன்படுத்தும் அதே அலுவலகப் போர்ட்டலில் மாற்றுங்கள்]]. [[ok|IT ஒருபோதும் மின்னஞ்சல், தொலைபேசி அல்லது WhatsApp மூலம் உங்கள் கடவுச்சொல்லைக் கேட்காது.]] சந்தேகம் இருந்தால் இரண்டாம் தளத்தில் உள்ள உதவி மையத்துக்கு வாருங்கள்.",
        why: "அனுப்புநர் நிறுவனத்தின் சொந்த IT முகவரி. கிளிக் செய்ய இணைப்பு இல்லை, கோப்பு இல்லை, காலக்கெடு இல்லை, கடவுச்சொல் கேட்கவில்லை. உண்மையான அறிவிப்புகள் என்ன நடக்கும் என்று சொல்லி, வழக்கமான போர்ட்டலை நீங்களே பயன்படுத்த விடுகின்றன.",
        todo: "அவசரம் எதுவும் இல்லை. ஒரு அறிவிப்பு உண்மையா என்று சந்தேகம் இருந்தால் உதவி மையத்துக்கு நேரில் செல்லுங்கள் அல்லது ஏற்கனவே தெரிந்த உள் எண்ணில் அழையுங்கள்."
      },
      bec_vendor: {
        title: "விற்பனையாளர் வங்கிக் கணக்கு மாறியதாகச் சொல்கிறார்",
        ctx: "₹4,80,000 நிலுவை இன்வாய்ஸ் பற்றிக் கணக்குக் குழுவுக்கு மின்னஞ்சல்.",
        who: "காவேரி லாஜிஸ்டிக்ஸ் கணக்குப் பிரிவு",
        subject: "அவசரம்: இன்வாய்ஸ் KL/2026/0912-க்குப் புதிய வங்கி விவரங்கள்",
        text: "அன்புள்ள ஐயா/அம்மா, [[newacct|தணிக்கைக்குப் பிறகு எங்கள் நிறுவன வங்கிக் கணக்கு மாறிவிட்டது. ₹4,80,000 நிலுவை இன்வாய்ஸைக் கீழே உள்ள புதிய கணக்குக்குச் செலுத்துங்கள்.]] சரக்கு தாமதத்தைத் தவிர்க்க [[urgent|பணத்தை இன்றே விடுவியுங்கள்]]. [[sender|இந்த மின்னஞ்சல் ID-க்கு மட்டுமே பதில் அனுப்புங்கள்]], எங்கள் அலுவலகத் தொலைபேசிகள் பழுதுபார்ப்பில் உள்ளன.",
        why: "இது பிசினஸ் இமெயில் காம்ப்ரமைஸ் (BEC). குற்றவாளிகள் விற்பனையாளரின் மின்னஞ்சலை ஹேக் செய்து அல்லது நகலெடுத்து \"புதிய வங்கி விவரங்களை\" அனுப்புகிறார்கள். முகவரி உண்மையான விற்பனையாளரிடமிருந்து சற்று வேறுபட்டது, சரிபார்க்க முடியாதபடி தொலைபேசிகள் \"வேலை செய்யவில்லை\", எல்லாமே அவசரம்.",
        todo: "மின்னஞ்சலுக்காக விற்பனையாளரின் வங்கி விவரங்களை ஒருபோதும் மாற்றாதீர்கள். பழைய பதிவுகள் அல்லது கொள்முதல் ஆணையில் உள்ள எண்ணில் விற்பனையாளரை அழையுங்கள், மின்னஞ்சலில் உள்ள எண்ணில் ஒருபோதும் இல்லை. ஒவ்வொரு வங்கி விவர மாற்றத்துக்கும் இருவர் ஒப்புதல் வேண்டும்."
      },
      gst_notice: {
        title: "இணைப்புக் கோப்புடன் GST அபராத அறிவிப்பு",
        ctx: "அதிகாலையில் கணக்குப் பிரிவு அஞ்சல் பெட்டிக்கு வந்த மின்னஞ்சல்.",
        who: "GST துறை",
        subject: "காரணம் கேட்கும் அறிவிப்பு - அபராதம் ₹1,24,500 - நடவடிக்கை தேவை",
        text: "[[odd|அன்புள்ள வரி செலுத்துவோரே,]] உங்கள் GST ரிட்டர்ன்களில் முரண்பாடு கண்டறியப்பட்டது. ₹1,24,500 அபராதம் செலுத்த வேண்டும். செலுத்தாவிட்டால் [[threat|உங்கள் GSTIN 48 மணி நேரத்தில் இடைநிறுத்தப்படும்]]. சட்ட நடவடிக்கையைத் தவிர்க்க [[link|இணைக்கப்பட்ட அறிவிப்பைத் திறந்து பாதுகாப்பான இணைப்பு வழியாகச் செலுத்துங்கள்]]. [[attach|இணைப்பு: GST_Notice_2026.html]]",
        why: "உண்மையான GST அறிவிப்புகள் அதிகாரப்பூர்வ GST போர்ட்டலில் உங்கள் கணக்கில் தோன்றும், அவற்றில் DIN (ஆவண அடையாள எண்) இருக்கும். \"பாதுகாப்பான இணைப்பு\" கொண்ட HTML கோப்பு உங்கள் GST உள்நுழைவு அல்லது பண விவரங்களைத் திருடும் போலி உள்நுழைவுப் பக்கம். அனுப்புநர் அதிகாரப்பூர்வ gov.in டொமைன் அல்ல.",
        todo: "கோப்பைத் திறக்காதீர்கள். முகவரியை நீங்களே தட்டச்சு செய்து அதிகாரப்பூர்வ GST போர்ட்டலில் உள்நுழையுங்கள், அல்லது உங்கள் CA-விடம் சரிபார்க்கச் சொல்லுங்கள். மின்னஞ்சலை IT-யிடமும் cybercrime.gov.in-இலும் புகாரளியுங்கள்."
      },
      otp_real: {
        title: "நீங்கள் இப்போது தொடங்கிய பணப்பரிமாற்றத்துக்கான OTP",
        ctx: "பேக்கேஜிங் விற்பனையாளருக்கு ₹2,500 UPI பணப்பரிமாற்றத்தை இப்போதுதான் தொடங்கினீர்கள். இந்த SMS வருகிறது.",
        who: "",
        subject: "",
        text: "[[ok|நீங்கள் இப்போது தொடங்கிய Sunrise Packaging-க்கான ₹2,500 UPI பணப்பரிமாற்றத்துக்கு உங்கள் OTP 482913.]] 10 நிமிடங்கள் செல்லும். [[ok|இந்த OTP-ஐ யாரிடமும் பகிராதீர்கள், வங்கியிடம் கூட.]] - NovaBank",
        why: "இந்தப் பணப்பரிமாற்றத்தை நீங்களே சற்று முன் தொடங்கினீர்கள், தொகையும் பெறுநரும் பொருந்துகின்றன, குறியீட்டைப் பகிர வேண்டாம் என்று மெசேஜ் சொல்கிறது. உண்மையான OTP நீங்களே கேட்ட செயலுக்கு மட்டுமே, அதை யாரிடமாவது சொல்லும்படி வங்கி ஒருபோதும் கேட்காது.",
        todo: "நீங்கள் பயன்படுத்தும் ஆப்பில் மட்டும் OTP-ஐத் தட்டச்சு செய்யுங்கள். நீங்கள் எதையும் தொடங்காதபோது OTP வந்தால், யாரோ உங்கள் கணக்கைப் பயன்படுத்த முயல்கிறார்கள்: அதைப் பகிராதீர்கள், கார்டில் அச்சிட்ட எண்ணில் வங்கியை அழையுங்கள்."
      },
      digital_arrest: {
        title: "\"CBI அதிகாரி\"யிடமிருந்து வீடியோ அழைப்பு",
        ctx: "தெரியாத எண்ணிலிருந்து வீடியோ அழைப்பு. அழைப்பவர் சீருடை அணிந்து, பின்னால் கொடியுடன் ஒரு அலுவலகத்தில் அமர்ந்திருக்கிறார்.",
        who: "\"CBI அதிகாரி வர்மா\"",
        subject: "",
        text: "\"[[threat|போதைப்பொருளும் 6 பாஸ்போர்ட்டுகளும் கொண்ட பார்சல் உங்கள் பெயரில் பதிவாகியுள்ளது. உங்கள் மீது வழக்குப் பதிவாகியுள்ளது.]] [[urgent|இந்த வீடியோ அழைப்பிலேயே இருங்கள், துண்டிக்காதீர்கள்]], [[secret|யாரிடமும் சொல்லாதீர்கள், குடும்பத்தினரிடம் கூட, அவர்களும் கண்காணிப்பில் உள்ளனர்]]. [[money|சரிபார்ப்புக்காக ₹3,50,000-ஐ இந்த RBI சரிபார்ப்புக் கணக்குக்கு மாற்றுங்கள்]]; விசாரணைக்குப் பின் திருப்பித் தரப்படும்.\"",
        why: "இது \"டிஜிட்டல் அரெஸ்ட்\". எந்தக் காவல்துறையும், CBI-யும், நீதிமன்றமும் வீடியோ அழைப்பில் யாரையும் கைது செய்வதில்லை, எந்த அமைப்பும் \"சரிபார்ப்புக் கணக்குக்கு\" பணம் அனுப்பச் சொல்வதில்லை. சீருடை, அலுவலகப் பின்னணி, அடையாள அட்டை எல்லாம் போலி. ரகசியமும் அழைப்பில் பிடித்து வைப்பதும் உங்களை யோசிக்க விடாது.",
        todo: "உடனே அழைப்பைத் துண்டியுங்கள். உண்மையான அதிகாரிகள் WhatsApp-இல் அழைப்பதில்லை. 1930-ஐ அழையுங்கள் அல்லது cybercrime.gov.in-இல் புகாரளியுங்கள், உடனே சக ஊழியர் அல்லது குடும்ப உறுப்பினரிடம் சொல்லுங்கள்."
      },
      courier: {
        title: "அழைப்பு: உங்கள் பார்சல் சுங்கத்தில் நிறுத்தப்பட்டுள்ளது",
        ctx: "முதலில் பதிவு செய்த குரல், பிறகு ஒரு நபர். நீங்கள் வெளிநாட்டிலிருந்து எதையும் ஆர்டர் செய்யவில்லை.",
        who: "\"SpeedParcel வாடிக்கையாளர் சேவை\"",
        subject: "",
        text: "\"வணக்கம், நான் SpeedParcel சுங்கப் பிரிவிலிருந்து பேசுகிறேன். [[threat|உங்கள் பெயரிலான பார்சல் சட்டவிரோதப் பொருட்கள் இருப்பதால் சுங்கத்தில் நிறுத்தப்பட்டுள்ளது.]] காவல்துறை வழக்கைத் தவிர்க்க அதிகாரியிடம் பேச [[urgent|இப்போதே 1-ஐ அழுத்துங்கள்]], அல்லது நாங்கள் அனுப்பும் இணைப்பில் [[money|₹2,999 அனுமதிக் கட்டணம் செலுத்துங்கள்]].\"",
        why: "கூரியர் நிறுவனங்கள் சட்டவிரோதப் பொருட்கள் பற்றி அழைப்பதில்லை, சுங்கத்துறை தொலைபேசியில் கட்டணம் வசூலிப்பதில்லை. 1-ஐ அழுத்தினால் போலி \"அதிகாரி\"யுடன் இணைக்கப்படுவீர்கள், அவர் பிறகு டிஜிட்டல் அரெஸ்ட் மோசடி அல்லது பணம் கேட்பார்.",
        todo: "அழைப்பைத் துண்டியுங்கள். உண்மையில் ஏதாவது ஆர்டர் செய்திருந்தால் கூரியரின் அதிகாரப்பூர்வ இணையதளத்தில் கண்காணிப்பு எண்ணைச் சரிபாருங்கள். அந்த எண்ணை சஞ்சார் சாத்தி (சக்ஷு) தளத்தில் புகாரளியுங்கள்."
      },
      task_job: {
        title: "Telegram வேலை: ஹோட்டல்களுக்கு மதிப்பீடு கொடுத்து தினமும் ₹8,000",
        ctx: "கடந்த வாரம் ஆன்லைனில் வேலைக்கு விண்ணப்பித்த பின் வந்த Telegram மெசேஜ்.",
        who: "HR பிரியா - ஆன்லைன் ஜாப்ஸ்",
        subject: "",
        text: "வாழ்த்துகள், நீங்கள் தேர்வாகிவிட்டீர்கள்! [[prize|ஆன்லைனில் ஹோட்டல்களுக்கு மதிப்பீடு கொடுத்து தினமும் ₹3,000 முதல் ₹8,000 சம்பாதியுங்கள்]], வெறும் 20 நிமிட வேலை. முதல் 3 பணிகள் இலவசம். பிரீமியம் பணிகளுக்கு [[money|₹5,000 டெபாசிட் செய்து ஒரு மணி நேரத்தில் ₹7,500 திரும்பப் பெறுங்கள்]]. [[urgent|இன்று 4 இடங்கள் மட்டுமே உள்ளன!]]",
        why: "இது டாஸ்க் மோசடி. நம்பிக்கை வளர்க்க முதல் சிறிய பணங்கள் உண்மையாகவே வரும். பிறகு பிரீமியம் பணிகளுக்கு \"டெபாசிட்\" செய்வீர்கள், பணம் திரும்ப வராது. எந்த உண்மையான வேலையும் கிளிக் செய்வதற்குப் பணம் தருவதில்லை, எந்த முதலாளியும் டெபாசிட் கேட்பதில்லை.",
        todo: "எதையும் டெபாசிட் செய்யாதீர்கள். கணக்கைத் தடுத்துப் புகாரளியுங்கள். ஏற்கனவே பணம் செலுத்தியிருந்தால் உடனே 1930-ஐ அழையுங்கள்; முதல் ஒரு மணி நேரம்தான் மிக முக்கியம்."
      },
      vendor_real: {
        title: "தெரிந்த விற்பனையாளரிடமிருந்து பண நினைவூட்டல்",
        ctx: "ஒவ்வொரு மாதமும் நீங்கள் பணம் செலுத்தும் பேக்கேஜிங் விற்பனையாளரின் வழக்கமான முகவரியிலிருந்து மின்னஞ்சல்.",
        who: "Sunrise Packaging பில்லிங்",
        subject: "பண நினைவூட்டல் - இன்வாய்ஸ் SP/26-27/0431, அக்டோபர் 10 கெடு",
        text: "அன்புள்ள மெரிடியன் டெக்ஸ்டைல்ஸ் குழுவினரே, ₹86,000-க்கான இன்வாய்ஸ் SP/26-27/0431 அக்டோபர் 10-க்குள் செலுத்தப்பட வேண்டும் என்பதற்கான மென்மையான நினைவூட்டல். [[ok|எங்கள் வங்கி விவரங்கள் மாறவில்லை, உங்களிடம் உள்ள இன்வாய்ஸில் அச்சிடப்பட்டுள்ளன.]] [[ok|எங்கள் வங்கிக் கணக்கை மாற்றச் சொல்லும் மின்னஞ்சல் ஏதாவது வந்தால், பணம் செலுத்தும் முன் உங்கள் பதிவுகளில் உள்ள எண்ணில் எங்கள் அலுவலகத்தை அழையுங்கள்.]] நன்றி.",
        why: "தெரிந்த விற்பனையாளர் முகவரியிலிருந்து வழக்கமான நினைவூட்டல், புதிய வங்கி விவரம் இல்லை, மிரட்டல் இல்லை, ஏதாவது வேறுபட்டால் தொலைபேசியில் சரிபார்க்கும்படி விற்பனையாளரே சொல்கிறார். உண்மையான கூட்டாளி இப்படித்தான் நடந்துகொள்வார்.",
        todo: "உங்கள் பதிவுகளில் உள்ள கணக்குக்கு வழக்கமான முறையில் செலுத்துங்கள். எந்த மாற்றக் கோரிக்கையையும் தெரிந்த தொலைபேசி எண்ணில் உறுதிசெய்யுங்கள்."
      },
      deepfake: {
        title: "MD-யின் குரல் அவசரப் பணமாற்றம் கேட்கிறது",
        ctx: "தெரியாத எண்ணிலிருந்து அழைப்பு. குரல் அப்படியே உங்கள் MD போல, பின்னால் விமான நிலையச் சத்தம்.",
        who: "\"ராஜேஷ் சார்\" (MD-யின் குரல்)",
        subject: "",
        text: "\"ஹலோ, நான்தான், விமான நிலையத்தில் இருக்கிறேன், சத்தம் கேட்கிறதா. [[urgent|இப்போதே ₹2,00,000 மாற்ற வேண்டும்]] துபாய் ஆர்டருக்காக ஒரு புதிய சப்ளையருக்கு. [[newacct|கணக்கு எண்ணை WhatsApp-இல் அனுப்புகிறேன்.]] [[secret|என்னைத் திரும்ப அழைக்காதே, போன் ஃப்ளைட் மோடுக்குப் போகிறது, நான் இறங்கும் முன் செய்துவிடு.]]\"",
        why: "ஒரு பேச்சு அல்லது வீடியோவின் 30 வினாடிக் கிளிப்பிலிருந்து AI யாருடைய குரலையும் நகலெடுக்க முடியும். நகல் குரல் + புதிய கணக்கு எண் + \"திரும்ப அழைக்காதே\" = டீப்ஃபேக் மோசடி. பின்னணிச் சத்தம் வேண்டுமென்றே சேர்க்கப்படுகிறது.",
        todo: "திரும்ப அழைப்பதாகச் சொல்லுங்கள், பிறகு சேமித்த எண்ணில் MD-யை அழையுங்கள் அல்லது இன்னொரு மூத்தவரிடம் சரிபாருங்கள். தொலைபேசி அவசரக் கோரிக்கைகளுக்குக் குழுவில் ஒரு ரகசியச் சொல் வையுங்கள். வழக்கமான ஒப்புதல் இல்லாமல் பணமாற்றம் இல்லை."
      },
      qr_receive: {
        title: "பணம் \"பெற\" வாங்குபவர் QR குறியீடு அனுப்புகிறார்",
        ctx: "ஒரு விளம்பரத் தளத்தில் 12 பழைய அலுவலக நாற்காலிகளுக்கு விளம்பரம் செய்தீர்கள். ஒரு வாங்குபவர் WhatsApp-இல் எழுதுகிறார்.",
        who: "அலுவலக நாற்காலிகள் வாங்குபவர்",
        subject: "",
        text: "ஹாய், ₹18,000-க்கு 12 பழைய அலுவலக நாற்காலிகள் என்ற உங்கள் விளம்பரம் பார்த்தேன். முழுத் தொகையையும் இப்போதே செலுத்துகிறேன். [[upi|ஒரு QR குறியீடு அனுப்பியுள்ளேன்: பணம் பெற அதை ஸ்கேன் செய்து உங்கள் UPI PIN-ஐ உள்ளிடுங்கள்.]] [[odd|நான் வெளியூரில் பணியமர்த்தப்பட்ட ராணுவ அதிகாரி, அதனால் என் நண்பர் நாற்காலிகளை எடுத்துச் செல்வார்.]] [[urgent|அடுத்த 5 நிமிடங்களில் செய்யுங்கள், என் நெட்வொர்க் பலவீனமாக உள்ளது.]]",
        why: "பணம் பெற நீங்கள் ஒருபோதும் QR ஸ்கேன் செய்வதோ PIN உள்ளிடுவதோ இல்லை. ஸ்கேன் செய்து PIN உள்ளிட்டால் மற்றவருக்கு நீங்கள் பணம் செலுத்துகிறீர்கள். \"ராணுவ அதிகாரி\" கதையும் அவசரமும் விளம்பரத் தளங்களில் வழக்கமான தந்திரங்கள்.",
        todo: "மறுத்துவிடுங்கள். உங்கள் UPI ID-க்குப் பணம் அனுப்பும்படி வாங்குபவரிடம் சொல்லுங்கள்; பணம் பெற நீங்கள் எதுவும் செய்ய வேண்டியதில்லை. ஆப்பில் அந்த எண்ணைப் புகாரளியுங்கள்."
      },
      fake_care: {
        title: "தேடலில் கிடைத்த வாடிக்கையாளர் சேவை எண்",
        ctx: "ரீஃபண்ட் வரவில்லை. ஆன்லைனில் வங்கியின் வாடிக்கையாளர் சேவையைத் தேடி முதலில் தெரிந்த எண்ணை அழைத்தீர்கள்.",
        who: "\"NovaBank வாடிக்கையாளர் சேவை\"",
        subject: "",
        text: "\"NovaBank வாடிக்கையாளர் சேவையை அழைத்ததற்கு நன்றி. ₹3,200 ரீஃபண்டுக்கு உங்களைச் சரிபார்க்க வேண்டும். [[otp|உங்கள் 16 இலக்கக் கார்டு எண், காலாவதித் தேதி, இப்போது வரும் OTP ஆகியவற்றைச் சொல்லுங்கள்.]] [[remote|நான் அனுப்பும் Quick Support ஆப்பையும் நிறுவுங்கள், அப்போதுதான் வேகமாகச் செய்ய முடியும்.]]\"",
        why: "தேடல் முடிவுகளில் அல்லது போலி இணையதளத்தில் வைக்கப்பட்ட போலி எண்ணை அழைத்துவிட்டீர்கள். எந்த வங்கியும் முழுக் கார்டு எண், காலாவதி, CVV அல்லது OTP-ஐக் கேட்பதில்லை, ரிமோட்-கண்ட்ரோல் ஆப்பை நிறுவச் சொல்வதில்லை.",
        todo: "அழைப்பைத் துண்டியுங்கள். கார்டின் பின்னால் அச்சிட்ட அல்லது அதிகாரப்பூர்வ ஆப்பில் உள்ள எண்ணை மட்டும் பயன்படுத்துங்கள். அழைப்பவர் கேட்கும் ஆப்பை ஒருபோதும் நிறுவாதீர்கள். ஏதாவது பகிர்ந்திருந்தால் உடனே ஆப்பில் கார்டைத் தடுத்து 1930-ஐ அழையுங்கள்."
      },
      hr_real: {
        title: "HR-இடமிருந்து தீபாவளி விடுமுறைப் பட்டியல்",
        ctx: "நிறுவனத்தின் HR முகவரியிலிருந்து அனைத்து ஊழியர்களுக்கும் மின்னஞ்சல்.",
        who: "HR துறை",
        subject: "தீபாவளி வாரத்துக்கான விடுமுறைப் பட்டியல்",
        text: "அனைவருக்கும் வணக்கம், தீபாவளிக்காக நவம்பர் 7 முதல் 9 வரை அலுவலகம் மூடப்பட்டிருக்கும். [[ok|முழு விடுமுறைப் பட்டியல் இன்ட்ராநெட்டின் HR பக்கத்தில் உள்ளது]], விடுப்புக்கு நீங்கள் பயன்படுத்தும் அதே பக்கம். [[ok|நீங்கள் எதுவும் செய்ய வேண்டியதில்லை.]] அனைவருக்கும் மகிழ்ச்சியான, பாதுகாப்பான தீபாவளி வாழ்த்துகள். - HR குழு",
        why: "நிறுவனத்தின் சொந்த HR முகவரியிலிருந்து, தகவல் மட்டும், வெளித் தளத்துக்கு இணைப்பு இல்லை, திறக்கக் கோப்பு இல்லை, நிரப்ப எதுவும் இல்லை. உண்மையான அறிவிப்புகளுக்கு அவசரம் தேவையில்லை.",
        todo: "எதுவும் செய்ய வேண்டாம். விடுமுறை அல்லது போனஸ் பற்றிய மின்னஞ்சல் உள்நுழையவோ வங்கி விவரங்களை நிரப்பவோ சொன்னால், அதை அபாய அறிகுறியாகக் கருதி HR-இடம் நேரில் கேளுங்கள்."
      },
      screen_share: {
        title: "\"UPI உதவி எண்\" உங்கள் திரையைப் பார்க்க விரும்புகிறது",
        ctx: "UPI பணப்பரிமாற்றம் தோல்வியடைந்து சமூக ஊடகத்தில் புகார் சொன்ன சில நிமிடங்களில் வந்த அழைப்பு.",
        who: "\"UPI உதவி எண்\"",
        subject: "",
        text: "\"சார், உங்கள் ₹1,500 UPI பணப்பரிமாற்றம் சிக்கியுள்ளது. 2 நிமிடத்தில் சரிசெய்கிறேன். [[remote|நான் அனுப்பிய இணைப்பிலிருந்து திரைப் பகிர்வு ஆப்பை நிறுவி, திரையில் உள்ள 9 இலக்கக் குறியீட்டை எனக்குப் படித்துச் சொல்லுங்கள்.]] வங்கி ஆப்பைத் திறந்து வையுங்கள், நான் பார்க்க மட்டும்தான். [[otp|OTP வந்தால் அழைப்பைத் துண்டிக்காதீர்கள், நான் வழிகாட்டுகிறேன்.]]\"",
        why: "தொலைநிலை அணுகல் மற்றும் திரைப் பகிர்வு ஆப்கள் அழைப்பவருக்கு உங்கள் போனைப் பார்க்கவும் இயக்கவும் உதவுகின்றன; 9 இலக்கக் குறியீடு முழு அணுகலைத் தருகிறது. OTP-யுடன் சேர்ந்து சில நிமிடங்களில் கணக்கைக் காலி செய்ய முடியும். உண்மையான உதவி எண்கள் உங்கள் திரையைப் பார்க்கக் கேட்பதில்லை.",
        todo: "அழைப்பைத் துண்டித்து, நிறுவிய ஆப்பை நீக்குங்கள். அதிகாரப்பூர்வ UPI அல்லது வங்கி ஆப்புக்குள் மட்டுமே புகார் செய்யுங்கள். பணம் போயிருந்தால் உடனே 1930-ஐயும் வங்கியையும் அழையுங்கள்."
      },
      invoice_exe: {
        title: ".exe-இல் முடியும் இன்வாய்ஸ் கோப்பு",
        ctx: "வாங்கியதாக நினைவில் இல்லாத ஒரு நிறுவனத்திடமிருந்து கணக்குப் பிரிவு அஞ்சல் பெட்டிக்கு மின்னஞ்சல்.",
        who: "Global Trade Supplies",
        subject: "இன்வாய்ஸ் இணைக்கப்பட்டுள்ளது - செயல்படுத்தவும்",
        text: "[[odd|அன்புள்ள ஐயா,]] கடந்த வாரம் வழங்கிய பொருட்களுக்கான இன்வாய்ஸ் இணைக்கப்பட்டுள்ளது. [[attach|இணைப்பு: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|இன்றே பணம் செலுத்துங்கள்]], உறுதிப்படுத்துங்கள். [[odd|அன்புடன், கணக்குப் பிரிவு.]]",
        why: ".exe-இல் முடியும் கோப்பு PDF அல்ல, ஒரு நிரல்; பெயரில் உள்ள \".pdf\" ஒரு மாறுவேடம் மட்டுமே. அதைத் திறந்தால் அலுவலகத்தின் ஒவ்வொரு கணினியையும் பூட்டக்கூடிய மால்வேர் அல்லது ரான்சம்வேர் நிறுவப்படும். பொதுவான விளிப்பும் நிறுவனக் கையொப்பம் இல்லாததும் கூடுதல் எச்சரிக்கைகள்.",
        todo: "கோப்பைத் திறக்காதீர்கள். மின்னஞ்சலை IT-யிடம் புகாரளியுங்கள். பதிவுகளைச் சரிபாருங்கள்: உண்மையில் இந்த நிறுவனத்திடம் வாங்கினீர்களா? இப்படிப்பட்ட தந்திரங்கள் தெரிய அலுவலகக் கணினிகளில் \"கோப்பு நீட்டிப்புகளைக் காட்டு\" என்பதை இயக்குங்கள்."
      },
      echallan: {
        title: "ஆப் இணைப்புடன் போக்குவரத்து இ-சலான் SMS",
        ctx: "மாலையில் அலுவலக ஓட்டுநரின் போனுக்கு வந்த SMS.",
        who: "",
        subject: "",
        text: "போக்குவரத்து இ-சலான்: உங்கள் வாகனம் KA-05-XX-1234 அக்டோபர் 1 அன்று சிக்னலை மீறியதாகப் பதிவாகியுள்ளது. [[money|அபராதம் ₹1,000.]] இரட்டை அபராதம் மற்றும் நீதிமன்ற அழைப்பாணையைத் தவிர்க்க [[urgent|24 மணி நேரத்துக்குள் செலுத்துங்கள்]]. [[link|அதிகாரப்பூர்வ சலான் ஆப்பைப் பதிவிறக்குங்கள்: echallan-pay.example.net/app.apk]]",
        why: "உண்மையான இ-சலான் மெசேஜ்கள் அரசு அனுப்புநர் ID-யிலிருந்து வரும், தனிப்பட்ட மொபைல் எண்ணிலிருந்து அல்ல, .apk கோப்பைப் பதிவிறக்கச் சொல்வதில்லை. அந்த APK உங்கள் SMS-களையும் OTP-களையும் படிக்கும் தீங்கிழைக்கும் ஆப்.",
        todo: "மெசேஜை நீக்குங்கள். சலான்களை அதிகாரப்பூர்வ அரசு இ-சலான் இணையதளத்தில் அல்லது மாநிலக் காவல்துறை ஆப்பில் மட்டும் சரிபாருங்கள். அந்த எண்ணை சஞ்சார் சாத்தி (சக்ஷு)-இல் புகாரளியுங்கள்."
      },
      parcel_real: {
        title: "நீங்கள் எதிர்பார்க்கும் பார்சலின் டெலிவரி தகவல்",
        ctx: "கடந்த வாரம் பேக்கேஜிங் பொருட்களை ஆர்டர் செய்தீர்கள். இந்த SMS வருகிறது.",
        who: "",
        subject: "",
        text: "SpeedParcel: Sunrise Packaging-இடமிருந்து உங்கள் சரக்கு SP48213 [[ok|இன்று மதியம் 2 முதல் 5 மணிக்குள் டெலிவரி ஆகும்.]] [[ok|பணம் எதுவும் செலுத்த வேண்டியதில்லை.]] [[ok|கண்காணிக்க எங்கள் இணையதளம் அல்லது ஆப்பில் சரக்கு எண்ணைப் பயன்படுத்துங்கள்.]]",
        why: "பதிவு செய்த அனுப்புநர் ID-யிலிருந்து (தனிப்பட்ட எண் அல்ல), எதிர்பார்க்கும் பார்சலுடன் பொருந்துகிறது, பணம் கேட்கவில்லை, தட்ட இணைப்பு தரவில்லை. உண்மையான டெலிவரி மெசேஜ் தகவல் மட்டுமே தரும்.",
        todo: "எதுவும் செய்ய வேண்டாம். பார்சல் மெசேஜ் கட்டணம், இணைப்பு அல்லது ஆப் கேட்டால், நிறுத்தி, சரக்கு எண்ணைக் கொண்டு அதிகாரப்பூர்வ இணையதளத்தில் சரிபாருங்கள்."
      },
      kyc: {
        title: "KYC காலாவதி, கணக்கு இன்று முடக்கம்",
        ctx: "இரவில் உரிமையாளரின் போனுக்கு வந்த SMS.",
        who: "",
        subject: "",
        text: "அன்புள்ள வாடிக்கையாளரே, உங்கள் KYC காலாவதியானதால் [[threat|உங்கள் NovaBank கணக்கு இன்று முடக்கப்படும்]]. [[link|novabank-kyc-update.example.net]]-இல் [[urgent|உடனே புதுப்பியுங்கள்]] அல்லது [[sender|எங்கள் அதிகாரியை 94XXX XXX51-இல் அழையுங்கள்]].",
        why: "வங்கிகள் தனிப்பட்ட மொபைல் எண்ணிலிருந்து KYC இணைப்புகளை அனுப்புவதில்லை, சில மணி நேரத்தில் கணக்கை முடக்குவதுமில்லை. இணைப்பு உங்கள் உள்நுழைவையும் OTP-யையும் திருடும் போலி வங்கிப் பக்கத்தைத் திறக்கும்; \"அதிகாரி\" ஆப் நிறுவச் சொல்வார்.",
        todo: "இணைப்பைத் தட்டாதீர்கள், அழைக்காதீர்கள். KYC உண்மையில் நிலுவையில் இருந்தால் வங்கியின் சொந்த ஆப் அல்லது கிளை சொல்லும். SMS-ஐ சஞ்சார் சாத்தி (சக்ஷு)-இல் புகாரளியுங்கள்."
      },
      sim_swap: {
        title: "அழைப்பு: உங்கள் SIM செயலிழக்கப்படும்",
        ctx: "வங்கி OTP-க்கு இந்த எண்ணைப் பயன்படுத்தும் அலுவலக மேலாளருக்கு அழைப்பு.",
        who: "\"தொலைத்தொடர்பு நிறுவன அதிகாரி\"",
        subject: "",
        text: "\"மேடம், நான் உங்கள் மொபைல் நெட்வொர்க்கிலிருந்து பேசுகிறேன். 5G மேம்படுத்தல் நிலுவையில் உள்ளதால் [[threat|உங்கள் SIM 24 மணி நேரத்தில் செயலிழக்கப்படும்]]. [[otp|மேம்படுத்த, உங்கள் SIM கார்டில் அச்சிட்ட 20 இலக்க எண்ணைப் படித்துச் சொல்லி, வரும் SMS-க்குப் பிறகு 1-ஐ அழுத்துங்கள்.]] [[urgent|இந்தச் சலுகை இன்றுடன் முடிகிறது.]]\"",
        why: "இது SIM-ஸ்வாப் முயற்சி. 20 இலக்க SIM எண்ணும் உங்கள் \"1\"-உம் கிடைத்தால் மோசடிக்காரர் உங்கள் எண்ணைத் தன் SIM-இல் இயக்குவார். உங்கள் போன் செயலிழக்கும், வங்கி மற்றும் UPI-க்கான ஒவ்வொரு OTP-யும் அவருக்குப் போகும்.",
        todo: "அழைப்பைத் துண்டியுங்கள். தொலைத்தொடர்பு நிறுவனங்கள் 5G மேம்படுத்தலுக்கு அழைப்பதில்லை. உங்கள் போனில் திடீரென நீண்ட நேரம் நெட்வொர்க் போனால் முதலில் வங்கியை, பிறகு ஆபரேட்டரை அழையுங்கள். உங்கள் பெயரில் உள்ள SIM-களை சஞ்சார் சாத்தியில் சரிபாருங்கள்."
      },
      mfa: {
        title: "நள்ளிரவு முதல் ஏழாவது உள்நுழைவு ஒப்புதல் கோரிக்கை",
        ctx: "இரவில் அலுவலக உள்நுழைவு ஆப்பின் உள்நுழைவு ஒப்புதல் கோரிக்கைகளால் போன் தொடர்ந்து அதிர்கிறது. பிறகு ஒரு அழைப்பு வருகிறது.",
        who: "SecureLogin ஆப்",
        subject: "",
        text: "[[otp|உள்நுழைவை ஏற்கவா? யாரோ புதிய சாதனத்திலிருந்து உங்கள் அலுவலகக் கணக்கில் உள்நுழைய முயல்கிறார்கள். தொடர APPROVE தட்டுங்கள்.]] [[odd|(நள்ளிரவு முதல் இது 7-வது கோரிக்கை.)]] சற்று நேரத்தில் ஒருவர் அழைத்துச் சொல்கிறார்: \"[[urgent|நான் IT-யிலிருந்து, சர்வரைச் சரிசெய்கிறோம். எச்சரிக்கைகள் நிற்க கோரிக்கையை ஏற்றுவிடுங்கள்.]]\"",
        why: "இது \"MFA சோர்வு\". தாக்குபவரிடம் ஏற்கனவே உங்கள் கடவுச்சொல் உள்ளது, அவர் கோரிக்கைகளைக் கொட்டுகிறார், சலித்துப்போய் நீங்கள் Approve தட்டுவீர்கள் என்ற நம்பிக்கையில். \"IT\" அழைப்பு தாக்குதலின் ஒரு பகுதி. நீங்கள் தொடங்காத உள்நுழைவை ஏற்கச் சொல்லி உண்மையான IT ஒருபோதும் கேட்காது.",
        todo: "ஒவ்வொரு முறையும் Deny தட்டுங்கள். நம்பகமான சாதனத்திலிருந்து உடனே கடவுச்சொல்லை மாற்றி IT-யிடம் சொல்லுங்கள். மீண்டும் மீண்டும் வரும் கோரிக்கைகள் உங்கள் கடவுச்சொல் ஏற்கனவே கசிந்துவிட்டதைக் காட்டுகின்றன."
      },
      gst_real: {
        title: "உங்கள் CA-விடமிருந்து மாதாந்திர GST நினைவூட்டல்",
        ctx: "உங்கள் பட்டயக் கணக்காளரின் சேமித்த எண்ணிலிருந்து WhatsApp மெசேஜ்.",
        who: "மேத்தா & கோ. (எங்கள் CA)",
        subject: "",
        text: "காலை வணக்கம். நினைவூட்டல்: செப்டம்பர் மாத GSTR-3B அக்டோபர் 20-க்குள் தாக்கல் செய்ய வேண்டும். [[ok|விற்பனை மற்றும் கொள்முதல் தாள்களை ஒவ்வொரு மாதமும் போல அதே பகிர்ந்த கோப்புறையில் பதிவேற்றுங்கள்.]] [[ok|இப்போது உங்கள் பக்கம் இருந்து பணம் எதுவும் தேவையில்லை]]; தாக்கல் செய்த பின் சலான் விவரங்களை அனுப்புகிறேன், நம் வழக்கமான அழைப்பில் உறுதிசெய்வோம்.",
        why: "தெரிந்த CA, சேமித்த எண், வழக்கமான மாதாந்திர முறை, புதிய கணக்கு எண் இல்லை, இணைப்பு இல்லை, உண்மையான கடைசித் தேதிக்கு மேல் அவசரம் இல்லை. சரிபார்ப்பு உங்கள் வழக்கமான அழைப்பில் நடக்கிறது.",
        todo: "வழக்கமான முறையைப் பின்பற்றுங்கள். ஒருநாள் \"CA\" புதிய வங்கிக் கணக்கை அனுப்பினாலோ இணைப்பு வழியாகப் பணம் செலுத்தச் சொன்னாலோ, முதலில் தெரிந்த எண்ணில் CA அலுவலகத்தை அழையுங்கள்."
      },
      lookalike: {
        title: "அச்சு அசலான டொமைனில் சம்பளச் சீட்டு",
        ctx: "திருத்திய சம்பளச் சீட்டு பற்றிய மின்னஞ்சல். உங்கள் நிறுவனத்தின் உண்மையான டொமைன் meridiantextiles.example.com.",
        who: "சம்பளக் குழு",
        subject: "உங்கள் திருத்திய சம்பளச் சீட்டு தயார்",
        text: "அன்புள்ள ஊழியரே, அக்டோபர் முதல் உங்கள் சம்பளக் கட்டமைப்பு திருத்தப்பட்டுள்ளது. [[link|புதிய சீட்டைப் பார்க்க meridian-textiles-portal.example.com-இல் அலுவலகக் கடவுச்சொல்லுடன் உள்நுழையுங்கள்.]] [[urgent|இணைப்பு 12 மணி நேரத்தில் காலாவதியாகும்.]] [[sender|payroll@meridian-textiles.example.com-இலிருந்து அனுப்பப்பட்டது]]",
        why: "நிறுவனத்தின் உண்மையான டொமைன் meridiantextiles.example.com; மின்னஞ்சல் meridian-textiles (ஹைஃபனுடன்) என்ற அச்சு அசலான டொமைனைப் பயன்படுத்துகிறது. இணைப்பு உங்கள் அலுவலகக் கடவுச்சொல்லைத் திருடும் நகல் உள்நுழைவுப் பக்கத்துக்குக் கொண்டு செல்லும். சம்பளச் சீட்டு நீங்கள் எப்போதும் பயன்படுத்தும் HR போர்ட்டலில்தான் இருக்கும்.",
        todo: "கிளிக் செய்யாதீர்கள். முகவரியைத் தட்டச்சு செய்தோ புக்மார்க்கிலிருந்தோ HR போர்ட்டலை நீங்களே திறங்கள். மின்னஞ்சலை IT-யிடம் புகாரளியுங்கள்; அனுப்பினால் போலி டொமைனை அனைவருக்கும் தடுக்க முடியும்."
      },
      usb: {
        title: "வாகன நிறுத்தத்தில் கிடைத்த பென் டிரைவ்",
        ctx: "திங்கள் காலை, அலுவலக நுழைவாயில் அருகே.",
        who: "அலுவலக வாகன நிறுத்தத்தில் கிடைத்த பென் டிரைவ்",
        subject: "",
        text: "நுழைவாயில் அருகே ஒரு பென் டிரைவ் கிடக்கிறது, அதில் லேபிள்: [[prize|\"சம்பள உயர்வு 2026 - ரகசியம் - நிர்வாகத்துக்கு மட்டும்\"]]. ஒரு சக ஊழியர் சொல்கிறார்: \"[[remote|வரவேற்பறை PC-யில் போட்டு யாருடையது என்று பார்ப்போம்.]]\"",
        why: "இது \"USB டிராப்\". தாக்குபவர்கள் கவர்ச்சியான லேபிள் கொண்ட பென் டிரைவ்களை விட்டுச் செல்கிறார்கள்; ஒன்றைச் செருகியவுடன் மறைந்த மென்பொருள் தானாக நிறுவப்பட்டு அலுவலக நெட்வொர்க் முழுவதும் பரவலாம். ஆர்வமே தாக்குதல்.",
        todo: "எங்கும் செருகாதீர்கள். ஒரு உறையில் வைத்து IT அல்லது பாதுகாப்புப் பிரிவிடம் கொடுங்கள். நிறுவனங்கள் ஆட்டோ-ரன்னை முடக்கி தெரியாத USB சாதனங்களைத் தடுக்க வேண்டும்."
      },
      wifi: {
        title: "விமான நிலைய இலவச Wi-Fi மின்னஞ்சல் கடவுச்சொல் கேட்கிறது",
        ctx: "விமானத்துக்காகக் காத்திருக்கும்போது, இரண்டு விற்பனையாளர் பணங்களை ஏற்க இலவச நெட்வொர்க்கில் இணைகிறீர்கள்.",
        who: "விமான நிலைய இலவச Wi-Fi உள்நுழைவுத் திரை",
        subject: "",
        text: "நெட்வொர்க்: Airport_Free_WiFi_5G (கடவுச்சொல் இல்லை). [[otp|தொடர உங்கள் மின்னஞ்சல் முகவரி மற்றும் மின்னஞ்சல் கடவுச்சொல்லுடன் உள்நுழையுங்கள்.]] பிறகு விமானத்துக்குக் காத்திருக்கும்போது [[data|நிறுவன வங்கிப் போர்ட்டலில் இரண்டு விற்பனையாளர் பணங்களை ஏற்க]] திட்டமிடுகிறீர்கள்.",
        why: "அதிகாரப்பூர்வமாகத் தோன்றும் பெயரில் யார் வேண்டுமானாலும் ஹாட்ஸ்பாட் உருவாக்கலாம். போலி நெட்வொர்க்கில் நீங்கள் தட்டச்சு செய்வதைத் தாக்குபவர் பார்க்கலாம், மின்னஞ்சல் கடவுச்சொல் கேட்கும் உள்நுழைவுப் பக்கம் தகவல் திருடுகிறது. பொது Wi-Fi-இல் வங்கிச் சேவை ஆபத்தானது.",
        todo: "வேலைக்கும் வங்கிக்கும் உங்கள் சொந்த மொபைல் டேட்டா அல்லது நிறுவன VPN பயன்படுத்துங்கள். Wi-Fi உள்நுழைவுப் பக்கத்தில் அலுவலக அல்லது மின்னஞ்சல் கடவுச்சொல்லை ஒருபோதும் தட்டச்சு செய்யாதீர்கள். திறந்த நெட்வொர்க்குகளுடன் தானாக இணைவதை அணையுங்கள்."
      },
      upi_real: {
        title: "பணம் பெறப்பட்ட அறிவிப்பு",
        ctx: "நீங்கள் கவுண்டரில் இருக்கும்போது உங்கள் சொந்த UPI ஆப்பின் அறிவிப்பு.",
        who: "UPI ஆப்",
        subject: "",
        text: "[[ok|Anita Traders-இடமிருந்து ₹2,500 பெறப்பட்டது]] 4471-இல் முடியும் உங்கள் நடப்புக் கணக்கில். [[ok|எந்த நடவடிக்கையும் தேவையில்லை.]] பரிவர்த்தனை ID 628104...",
        why: "உள்ளே வரும் பணத்துக்கு PIN, OTP அல்லது ஸ்கேன் ஒருபோதும் தேவையில்லை. அறிவிப்பு உங்கள் சொந்த ஆப்பிலிருந்து, செலுத்தியவர் பெயரைச் சொல்கிறது, உங்களிடம் எதுவும் கேட்கவில்லை. இதை \"கலெக்ட் கோரிக்கை\" அல்லது ஸ்கேன் செய்யச் சொல்லப்படும் QR-உடன் ஒப்பிடுங்கள்: அவை பணத்தை வெளியே எடுக்கின்றன.",
        todo: "எதுவும் செய்ய வேண்டாம். தொகையை இன்வாய்ஸுடன் பொருத்திப் பாருங்கள். \"பணம் பெறப்பட்டது\" மெசேஜ் எப்போதாவது ஒப்புதல், PIN அல்லது ஸ்கேன் கேட்டால், அது பணத்தைக் கொடுக்கவில்லை, எடுக்கிறது."
      },
      dpdp: {
        title: "சக ஊழியர் வாடிக்கையாளர் பட்டியலை WhatsApp-இல் கேட்கிறார்",
        ctx: "மாலையில் விற்பனைப் பிரிவு சக ஊழியரின் எண்ணிலிருந்து WhatsApp மெசேஜ்.",
        who: "சமீர் (விற்பனை சக ஊழியர்)",
        subject: "",
        text: "நண்பா, இன்று வீட்டிலிருந்து வேலை செய்கிறேன். [[data|தொலைபேசி எண்களும் ஆதார் நகல்களும் கொண்ட முழு வாடிக்கையாளர் பட்டியலை ஏற்றுமதி செய்து இதே WhatsApp-இல் அனுப்பு]], பிறகு நீக்கிவிடுகிறேன். [[urgent|பிரச்சாரத்துக்கு 10 நிமிடத்தில் வேண்டும்.]] [[secret|மேலாளரிடம் சொல்லத் தேவையில்லை, சின்ன விஷயம்.]]",
        why: "வாடிக்கையாளர் தொலைபேசி எண்களும் ஆதார் நகல்களும் இந்தியாவின் DPDP சட்டத்தால் பாதுகாக்கப்பட்ட தனிப்பட்ட தரவு. தனிப்பட்ட WhatsApp-இல் அனுப்பினால் அவை நிறுவனக் கட்டுப்பாட்டை விட்டு வெளியேறும், இது ஹேக் செய்யப்பட்ட கணக்கு அல்லது ஆள்மாறாட்டமாகவும் இருக்கலாம். \"மேலாளரிடம் சொல்லாதே\" ஒருபோதும் ஏற்கத்தக்கதல்ல.",
        todo: "பணிவாக மறுத்துவிடுங்கள். வாடிக்கையாளர் தரவை நிறுவனத்தின் அங்கீகரிக்கப்பட்ட அமைப்பு வழியாக, மேலாளர் ஒப்புதலுடன், தேவையான விவரங்களை மட்டுமே பகிருங்கள். சக ஊழியரின் கணக்கு விசித்திரமாகத் தெரிந்தால் அவரை அழையுங்கள்."
      },
      otp_call: {
        title: "பணத்தை ரத்து செய்ய \"மோசடித் தடுப்புப் பிரிவு\"க்கு OTP வேண்டுமாம்",
        ctx: "உங்கள் போனுக்கு OTP SMS வரும் அதே நேரத்தில் வந்த அழைப்பு.",
        who: "\"NovaBank மோசடித் தடுப்புப் பிரிவு\"",
        subject: "",
        text: "\"சார், [[threat|உங்கள் கார்டில் இப்போது ₹49,999 பரிவர்த்தனை நடக்கிறது.]] அதை ரத்து செய்ய [[urgent|60 வினாடிகளுக்குள் செயல்பட வேண்டும்]]. [[otp|உங்கள் போனுக்கு இப்போது வந்த OTP-ஐச் சொல்லுங்கள், நான் திருப்புகிறேன்.]] [[secret|அழைப்பைத் துண்டிக்கவோ யாரையும் அழைக்கவோ வேண்டாம்.]]\"",
        why: "\"இப்போது வந்த\" OTP மோசடிக்காரர் உங்கள் கார்டில் பணம் செலுத்தும் முயற்சிக்கானது. அதைப் படித்துச் சொன்னால் பணப்பரிமாற்றம் முடிந்துவிடும். எதையும் ரத்து செய்ய வங்கிகள் OTP கேட்பதில்லை, நீங்கள் யோசிக்காமல் இருக்கவே 60 வினாடிப் பதற்றம் உருவாக்கப்படுகிறது.",
        todo: "அழைப்பைத் துண்டியுங்கள். வங்கி ஆப்பைத் திறந்து நீங்களே கார்டைத் தடுங்கள், அல்லது கார்டின் பின்னால் உள்ள எண்ணை அழையுங்கள். OTP-ஐ யாருக்கும் படித்துச் சொல்லாதீர்கள். பணம் போயிருந்தால் உடனே 1930-ஐ அழையுங்கள்."
      },
      hr_bonus: {
        title: "தீபாவளி போனஸ் படிவம் நெட்-பேங்கிங் உள்நுழைவு கேட்கிறது",
        ctx: "தீபாவளிக்குச் சற்று முன், HR போலத் தோன்றும் முகவரியிலிருந்து அனைத்து ஊழியர்களுக்கும் மின்னஞ்சல்.",
        who: "HR ரிவார்ட்ஸ் குழு",
        subject: "தீபாவளி போனஸ் ₹25,000 - உங்கள் வங்கிக் கணக்கை உறுதிசெய்யுங்கள்",
        text: "அன்புள்ள குழு உறுப்பினரே, ₹25,000 தீபாவளி போனஸை அறிவிப்பதில் மகிழ்ச்சி. [[attach|இணைக்கப்பட்ட படிவத்தைத் (Bonus_Form.html) திறந்து]], போனஸ் நேரடியாக வரவு வைக்கப்பட [[otp|உங்கள் நெட்-பேங்கிங் பயனர் ID மற்றும் கடவுச்சொல்லை உள்ளிடுங்கள்]]. [[urgent|இன்று மாலை 6 மணிக்குப் பின் வரும் படிவங்கள் ஏற்கப்படாது.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "உங்கள் சம்பளக் கணக்கு ஏற்கனவே HR-இடம் உள்ளது; எந்த நிறுவனமும் போனஸுக்கு நெட்-பேங்கிங் உள்நுழைவைக் கேட்பதில்லை. அனுப்புநர் அச்சு அசலான டொமைன், HTML கோப்பு போலி வங்கி உள்நுழைவுப் பக்கம், அதே நாள் காலக்கெடு அழுத்தம் கூட்டுகிறது.",
        todo: "கோப்பைத் திறக்கவோ எதையும் உள்ளிடவோ வேண்டாம். HR-இடம் நேரிலோ இன்ட்ராநெட்டிலோ கேளுங்கள். சக ஊழியர்கள் எச்சரிக்கப்பட மின்னஞ்சலை IT-யிடம் புகாரளியுங்கள்."
      },
      electricity: {
        title: "இன்றிரவு அலுவலக மின்சாரம் துண்டிக்கப்படும்",
        ctx: "இரவு 8:35 மணிக்குக் கடை உரிமையாளரின் போனுக்கு வந்த SMS.",
        who: "",
        subject: "",
        text: "அன்புள்ள நுகர்வோரே, [[odd|கடந்த மாத பில் எங்கள் அமைப்பில் அப்டேட் ஆகவில்லை]] என்பதால் [[threat|உங்கள் அலுவலக மின் இணைப்பு இன்றிரவு 9:30 மணிக்குத் துண்டிக்கப்படும்]]. எங்கள் அதிகாரியை [[sender|93XXX XXX40]]-இல் [[urgent|உடனே]] தொடர்பு கொள்ளுங்கள்.",
        why: "மின்வாரியங்கள் தனிப்பட்ட மொபைலிலிருந்து ஒரு SMS-க்குப் பின் இரவில் மின்சாரத்தைத் துண்டிப்பதில்லை. அழைத்தால் \"அதிகாரி\" ஒரு ஆப் நிறுவவோ இணைப்பு வழியாக ₹10 செலுத்தவோ சொல்வார், உண்மையான இலக்கு உங்கள் வங்கிக் கணக்கு.",
        todo: "அழைக்காதீர்கள். மின்வாரியத்தின் அதிகாரப்பூர்வ ஆப் அல்லது அலுவலகத்தில் பில்லைச் சரிபாருங்கள். அந்த எண்ணை சஞ்சார் சாத்தி (சக்ஷு)-இல் புகாரளியுங்கள்."
      },
      wa_hijack: {
        title: "6 இலக்கக் குறியீட்டை அனுப்பும்படி சக ஊழியர் கேட்கிறார்",
        ctx: "உங்கள் போனுக்குக் குறியீடு SMS வந்த உடனே, இரவு தாமதமாக சக ஊழியரின் சேமித்த எண்ணிலிருந்து WhatsApp மெசேஜ்.",
        who: "ரோஹன் (சக ஊழியர்)",
        subject: "",
        text: "ஹேய், இவ்வளவு இரவில் தொந்தரவு செய்வதற்கு மன்னிக்கவும். [[odd|WhatsApp-இல் உள்நுழையும்போது தவறுதலாக உன் எண்ணை உள்ளிட்டேன், 6 இலக்கக் குறியீடு உன் போனுக்குப் போய்விட்டது.]] [[otp|அந்தக் குறியீட்டை எனக்கு அனுப்பு]], [[urgent|சீக்கிரம், இல்லையென்றால் என் கணக்கு பூட்டப்படும்.]]",
        why: "வந்த குறியீடு உங்கள் சொந்த WhatsApp-இன் சரிபார்ப்புக் குறியீடு. அதைப் பெறுபவர் உங்கள் கணக்கைக் கைப்பற்றி, உங்கள் தொடர்புகள் மற்றும் அலுவலகக் குழுக்கள் அனைத்துக்கும் பணம் கேட்டு மெசேஜ் அனுப்புவார். இந்த மெசேஜே சக ஊழியரின் ஏற்கனவே ஹேக் செய்யப்பட்ட கணக்கிலிருந்து வந்திருக்கலாம்.",
        todo: "சரிபார்ப்புக் குறியீட்டை ஒருபோதும் அனுப்பாதீர்கள். சக ஊழியரை அழைத்து அவர் கணக்கு ஹேக் செய்யப்பட்டதை எச்சரியுங்கள். WhatsApp அமைப்புகளில் இரண்டு-படி சரிபார்ப்பை இயக்குங்கள்."
      },
      invest_group: {
        title: "உத்தரவாத லாபத்துடன் பங்கு-டிப்ஸ் குழு",
        ctx: "உங்களைக் கேட்காமலே ஒரு WhatsApp குழுவில் சேர்த்துவிட்டார்கள்.",
        who: "VIP Stock Tips - குழு நிர்வாகி",
        subject: "",
        text: "எங்கள் பிரீமியம் குழுவுக்கு வரவேற்கிறோம்! [[prize|உத்தரவாதமான இன்சைடர் டிப்ஸ் மூலம் எங்கள் உறுப்பினர்கள் கடந்த மாதம் 32% லாபம் சம்பாதித்தனர்.]] எங்கள் டிரேடிங் ஆப்பை [[link|ஆப் ஸ்டோரிலிருந்து அல்ல, இந்த இணைப்பிலிருந்து]] பதிவிறக்குங்கள், [[money|₹50,000 டெபாசிட்டுடன் தொடங்குங்கள்]]. [[prize|உறுப்பினர்கள் பதிவிட்ட லாபத் திரைப்பிடிப்புகளைப் பாருங்கள்!]] [[urgent|நள்ளிரவில் சேர்க்கை முடிகிறது.]]",
        why: "யாராலும் லாபத்துக்கு உத்தரவாதம் தர முடியாது, \"இன்சைடர் டிப்ஸ்\" சட்டவிரோதம். ஆப் போலியானது: நீங்கள் மேலும் டெபாசிட் செய்யக் கற்பனை லாபத்தைக் காட்டும், பணம் எடுக்க ஒருபோதும் அனுமதிக்காது. திரைப்பிடிப்புகளைப் பதிவிடும் \"உறுப்பினர்கள்\" மோசடிக்காரர்களே.",
        todo: "குழுவை விட்டு வெளியேறிப் புகாரளியுங்கள். SEBI-யில் பதிவு செய்த தரகர்கள் மற்றும் அதிகாரப்பூர்வ ஆப் ஸ்டோர் ஆப்கள் மூலம் மட்டும் முதலீடு செய்யுங்கள். டெபாசிட் செய்திருந்தால் 1930-ஐ அழைத்து cybercrime.gov.in-இல் புகாரளியுங்கள்."
      },
      bank_real: {
        title: "நீங்கள் செய்த பணப்பரிமாற்றத்துக்கான பற்று எச்சரிக்கை",
        ctx: "உங்கள் கணக்குக் குழு இன்று பேக்கேஜிங் விற்பனையாளருக்குப் பணம் செலுத்தியது. இந்த SMS வருகிறது.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|Sunrise Packaging-க்கு NEFT-க்காக அக்டோபர் 10 அன்று 4471-இல் முடியும் கணக்கிலிருந்து ₹86,000 பற்று வைக்கப்பட்டது]], குறிப்பு N26101034. இருப்பு ₹3,42,118. [[ok|நீங்கள் செய்யவில்லை என்றால் உங்கள் டெபிட் கார்டின் பின்னால் உள்ள எண்ணை அழையுங்கள்.]]",
        why: "இது இன்று உங்கள் கணக்குக் குழு செய்த பணப்பரிமாற்றத்துடன் பொருந்துகிறது, வங்கியின் அனுப்புநர் ID-யிலிருந்து வந்துள்ளது, SMS-இல் இணைப்போ எண்ணோ இல்லை, உங்கள் சொந்தக் கார்டில் உள்ள எண்ணைச் சுட்டுகிறது.",
        todo: "உங்கள் பணப்பரிமாற்றப் பதிவுகளுடன் பொருத்திப் பாருங்கள். ஏதாவது பற்று எச்சரிக்கை நீங்கள் செய்த பணப்பரிமாற்றத்துடன் பொருந்தவில்லை என்றால், மெசேஜில் உள்ள எண்ணில் அல்ல, கார்டில் உள்ள எண்ணில் உடனே வங்கியை அழையுங்கள்."
      }
    }
  },
  te: {
    scenarios: {
      ceo_gift: {
        title: "కొత్త నంబర్ నుంచి బాస్ గిఫ్ట్ కార్డులు అడుగుతున్నారు",
        ctx: "ఉదయం 9 గంటలకు అకౌంట్స్ ఎగ్జిక్యూటివ్‌కు WhatsApp మెసేజ్. ప్రొఫైల్ ఫోటో కంపెనీ వెబ్‌సైట్‌లోని MD ఫోటో.",
        who: "రాజేష్ సర్ (కొత్త నంబర్)",
        subject: "",
        text: "హాయ్, నేను రాజేష్. [[sender|నా పాత ఫోన్ పాడైంది, ప్రస్తుతానికి ఈ నంబర్ వాడుతున్నాను.]] ఒక పెద్ద క్లయింట్‌తో మీటింగ్‌లో ఉన్నాను. [[money|₹5,000 విలువైన 10 గిఫ్ట్ కార్డులు కొనండి]], కోడ్‌లు నాకు [[urgent|30 నిమిషాల్లో]] పంపండి. [[secret|దీని గురించి ఎవరితోనూ మాట్లాడకండి, క్లయింట్‌కు సర్‌ప్రైజ్.]]",
        why: "మోసగాళ్లు వెబ్‌సైట్ నుంచి MD ఫోటో తీసుకుని కొత్త నంబర్ నుంచి రాస్తారు. నిజమైన బాస్ ఎప్పుడూ గిఫ్ట్-కార్డ్ కోడ్‌లు గానీ రహస్యం గానీ అడగరు. కొత్త నంబర్ + తొందర + రహస్యం = క్లాసిక్ \"CEO మోసం\".",
        todo: "ఏమీ కొనవద్దు. ఫోన్‌లో సేవ్ చేసిన నంబర్‌కు బాస్‌కు కాల్ చేయండి లేదా వారి క్యాబిన్‌కు వెళ్లండి. ఆఫీసంతా అప్రమత్తంగా ఉండేలా IT కి లేదా మేనేజర్‌కు చెప్పండి."
      },
      it_real: {
        title: "IT నుంచి పాస్‌వర్డ్ విధానం నోటీసు",
        ctx: "కంపెనీ సొంత IT హెల్ప్‌డెస్క్ నుంచి ఉద్యోగులందరికీ ఈమెయిల్.",
        who: "IT హెల్ప్‌డెస్క్",
        subject: "అక్టోబర్ 15 నుంచి పాస్‌వర్డ్ విధానంలో మార్పు",
        text: "ప్రియమైన సహోద్యోగులారా, అక్టోబర్ 15 నుంచి పాస్‌వర్డ్‌లు కనీసం 12 అక్షరాలు ఉండాలి. [[ok|ఈరోజు మీరు ఏమీ చేయనవసరం లేదు.]] పాస్‌వర్డ్ గడువు ముగిసినప్పుడు దాన్ని [[ok|మీరు సాధారణంగా వాడే ఆఫీస్ పోర్టల్‌లోనే మార్చండి]]. [[ok|IT ఎప్పుడూ ఈమెయిల్, ఫోన్ లేదా WhatsApp లో మీ పాస్‌వర్డ్ అడగదు.]] సందేహాలుంటే రెండో అంతస్తులోని హెల్ప్‌డెస్క్‌కు రండి.",
        why: "పంపినవారు కంపెనీ సొంత IT చిరునామా. క్లిక్ చేయడానికి లింక్ లేదు, అటాచ్‌మెంట్ లేదు, గడువు లేదు, పాస్‌వర్డ్ అడగలేదు. నిజమైన నోటీసులు ఏం జరుగుతుందో చెప్పి, సాధారణ పోర్టల్‌ను మీరే వాడనిస్తాయి.",
        todo: "తొందర ఏమీ లేదు. నోటీసు నిజమైనదో కాదో అనుమానం ఉంటే హెల్ప్‌డెస్క్‌కు వెళ్లండి లేదా మీకు ఇప్పటికే తెలిసిన ఎక్స్‌టెన్షన్ నంబర్‌కు కాల్ చేయండి."
      },
      bec_vendor: {
        title: "వెండర్ తమ బ్యాంక్ ఖాతా మారిందని చెబుతున్నారు",
        ctx: "₹4,80,000 బకాయి ఇన్వాయిస్ గురించి అకౌంట్స్ టీమ్‌కు ఈమెయిల్.",
        who: "కావేరి లాజిస్టిక్స్ అకౌంట్స్",
        subject: "అత్యవసరం: ఇన్వాయిస్ KL/2026/0912 కోసం కొత్త బ్యాంక్ వివరాలు",
        text: "ప్రియమైన సర్/మేడమ్, [[newacct|ఆడిట్ తర్వాత మా కంపెనీ బ్యాంక్ ఖాతా మారింది. ₹4,80,000 బకాయి ఇన్వాయిస్‌ను కింద ఇచ్చిన కొత్త ఖాతాకు చెల్లించండి.]] షిప్‌మెంట్ ఆలస్యం కాకుండా [[urgent|చెల్లింపు ఈరోజే విడుదల చేయండి]]. [[sender|దయచేసి ఈ ఈమెయిల్ ID కి మాత్రమే జవాబివ్వండి]], మా ఆఫీస్ ఫోన్లు మరమ్మతులో ఉన్నాయి.",
        why: "ఇది బిజినెస్ ఈమెయిల్ కాంప్రమైజ్ (BEC). నేరగాళ్లు వెండర్ ఈమెయిల్‌ను హ్యాక్ లేదా కాపీ చేసి \"కొత్త బ్యాంక్ వివరాలు\" పంపుతారు. చిరునామా నిజమైన వెండర్‌కు కొంచెం భిన్నంగా ఉంది, మీరు సరిచూడలేనట్టు ఫోన్లు \"పని చేయడం లేదు\", అంతా అత్యవసరం.",
        todo: "ఈమెయిల్ ఆధారంగా వెండర్ బ్యాంక్ వివరాలు ఎప్పుడూ మార్చవద్దు. పాత రికార్డులు లేదా పర్చేస్ ఆర్డర్‌లోని నంబర్‌కు వెండర్‌కు కాల్ చేయండి, ఈమెయిల్‌లోని నంబర్‌కు ఎప్పుడూ కాదు. ప్రతి బ్యాంక్ వివరాల మార్పుకు ఇద్దరి ఆమోదం పెట్టండి."
      },
      gst_notice: {
        title: "అటాచ్‌మెంట్‌తో GST జరిమానా నోటీసు",
        ctx: "తెల్లవారుజామున అకౌంట్స్ మెయిల్‌బాక్స్‌కు వచ్చిన ఈమెయిల్.",
        who: "GST శాఖ",
        subject: "షోకాజ్ నోటీసు - జరిమానా ₹1,24,500 - చర్య అవసరం",
        text: "[[odd|ప్రియమైన పన్ను చెల్లింపుదారు,]] మీ GST రిటర్న్‌లలో తేడా కనిపించింది. ₹1,24,500 జరిమానా చెల్లించాలి. చెల్లించకపోతే [[threat|మీ GSTIN 48 గంటల్లో సస్పెండ్ అవుతుంది]]. చట్టపరమైన చర్యను తప్పించుకోవడానికి [[link|జత చేసిన నోటీసు తెరిచి సురక్షిత లింక్ ద్వారా చెల్లించండి]]. [[attach|అటాచ్‌మెంట్: GST_Notice_2026.html]]",
        why: "నిజమైన GST నోటీసులు అధికారిక GST పోర్టల్‌లో మీ ఖాతాలో కనిపిస్తాయి, వాటిపై DIN (డాక్యుమెంట్ ఐడెంటిఫికేషన్ నంబర్) ఉంటుంది. \"సురక్షిత లింక్\" ఉన్న HTML అటాచ్‌మెంట్ మీ GST లాగిన్ లేదా చెల్లింపు వివరాలు దొంగిలించే నకిలీ లాగిన్ పేజీ. పంపినవారు అధికారిక gov.in డొమైన్ కాదు.",
        todo: "అటాచ్‌మెంట్ తెరవవద్దు. చిరునామాను మీరే టైప్ చేసి అధికారిక GST పోర్టల్‌లో లాగిన్ అవ్వండి, లేదా మీ CA ను తనిఖీ చేయమనండి. ఈమెయిల్‌పై IT కి, cybercrime.gov.in లో ఫిర్యాదు చేయండి."
      },
      otp_real: {
        title: "మీరు ఇప్పుడే ప్రారంభించిన చెల్లింపుకు OTP",
        ctx: "మీరు ఇప్పుడే ప్యాకేజింగ్ వెండర్‌కు ₹2,500 UPI చెల్లింపు ప్రారంభించారు. ఈ SMS వస్తుంది.",
        who: "",
        subject: "",
        text: "[[ok|మీరు ఇప్పుడే ప్రారంభించిన Sunrise Packaging కు ₹2,500 UPI చెల్లింపు కోసం మీ OTP 482913.]] 10 నిమిషాలు చెల్లుతుంది. [[ok|ఈ OTP ని ఎవరితోనూ పంచుకోవద్దు, బ్యాంక్‌తో కూడా.]] - NovaBank",
        why: "ఈ చెల్లింపును మీరే క్షణం క్రితం ప్రారంభించారు, మొత్తం, అందుకునేవారు సరిపోతున్నారు, కోడ్ పంచుకోవద్దని మెసేజ్ చెబుతోంది. నిజమైన OTP మీరే అడిగిన పనికి మాత్రమే, దాన్ని ఎవరికైనా చెప్పమని బ్యాంక్ ఎప్పుడూ అడగదు.",
        todo: "మీరు వాడుతున్న యాప్‌లో మాత్రమే OTP టైప్ చేయండి. మీరు ఏమీ ప్రారంభించకుండానే OTP వస్తే, ఎవరో మీ ఖాతాను వాడటానికి ప్రయత్నిస్తున్నారు: దాన్ని పంచుకోవద్దు, కార్డుపై ముద్రించిన నంబర్‌కు బ్యాంక్‌కు కాల్ చేయండి."
      },
      digital_arrest: {
        title: "\"CBI అధికారి\" నుంచి వీడియో కాల్",
        ctx: "తెలియని నంబర్ నుంచి వీడియో కాల్. కాలర్ యూనిఫాం వేసుకుని, వెనుక జెండా ఉన్న ఆఫీసులో కూర్చున్నాడు.",
        who: "\"CBI అధికారి వర్మ\"",
        subject: "",
        text: "\"[[threat|మాదకద్రవ్యాలు, 6 పాస్‌పోర్టులు ఉన్న పార్సిల్ మీ పేరున బుక్ అయింది. మీపై కేసు నమోదైంది.]] [[urgent|ఈ వీడియో కాల్‌లోనే ఉండండి, కట్ చేయవద్దు]], [[secret|ఎవరికీ చెప్పవద్దు, మీ కుటుంబానికి కూడా, వారిపైనా నిఘా ఉంది]]. [[money|తనిఖీ కోసం ₹3,50,000 ఈ RBI వెరిఫికేషన్ ఖాతాకు బదిలీ చేయండి]]; దర్యాప్తు తర్వాత తిరిగి ఇస్తాం.\"",
        why: "ఇది \"డిజిటల్ అరెస్ట్\". ఏ పోలీసులూ, CBI, కోర్టూ వీడియో కాల్‌లో ఎవరినీ అరెస్ట్ చేయరు, ఏ సంస్థా \"వెరిఫికేషన్ ఖాతా\"కు డబ్బు పంపమని అడగదు. యూనిఫాం, ఆఫీసు నేపథ్యం, ID కార్డు అన్నీ నకిలీ. రహస్యం, కాల్‌లో పట్టి ఉంచడం మిమ్మల్ని ఆలోచించనివ్వవు.",
        todo: "వెంటనే ఫోన్ పెట్టేయండి. నిజమైన అధికారులు WhatsApp లో కాల్ చేయరు. 1930 కి కాల్ చేయండి లేదా cybercrime.gov.in లో ఫిర్యాదు చేయండి, వెంటనే సహోద్యోగికి లేదా కుటుంబ సభ్యుడికి చెప్పండి."
      },
      courier: {
        title: "కాల్: మీ పార్సిల్ కస్టమ్స్‌లో ఆగిపోయింది",
        ctx: "మొదట రికార్డ్ చేసిన గొంతు, తర్వాత ఒక వ్యక్తి. మీరు విదేశాల నుంచి ఏమీ ఆర్డర్ చేయలేదు.",
        who: "\"SpeedParcel కస్టమర్ సర్వీస్\"",
        subject: "",
        text: "\"నమస్కారం, నేను SpeedParcel కస్టమ్స్ విభాగం నుంచి మాట్లాడుతున్నాను. [[threat|మీ పేరున ఉన్న పార్సిల్‌లో అక్రమ వస్తువులు ఉన్నందున కస్టమ్స్‌లో ఆపారు.]] పోలీస్ కేసు తప్పించుకోవడానికి అధికారితో మాట్లాడేందుకు [[urgent|ఇప్పుడే 1 నొక్కండి]], లేదా మేము పంపే లింక్‌లో [[money|₹2,999 క్లియరెన్స్ ఫీజు చెల్లించండి]].\"",
        why: "కొరియర్ కంపెనీలు అక్రమ వస్తువుల గురించి కాల్ చేయవు, కస్టమ్స్ ఫోన్‌లో ఫీజు వసూలు చేయదు. 1 నొక్కితే నకిలీ \"అధికారి\"తో కలుపుతారు, అతను తర్వాత డిజిటల్ అరెస్ట్ మోసం లేదా చెల్లింపులు అడుగుతాడు.",
        todo: "కాల్ కట్ చేయండి. నిజంగా ఏదైనా ఆర్డర్ చేసి ఉంటే కొరియర్ అధికారిక వెబ్‌సైట్‌లో ట్రాకింగ్ నంబర్ చూడండి. ఆ నంబర్‌పై సంచార్ సాథీ (చక్షు) పోర్టల్‌లో ఫిర్యాదు చేయండి."
      },
      task_job: {
        title: "Telegram ఉద్యోగం: హోటళ్లకు రేటింగ్ ఇస్తూ రోజుకు ₹8,000",
        ctx: "గత వారం ఆన్‌లైన్‌లో ఉద్యోగాలకు దరఖాస్తు చేశాక వచ్చిన Telegram మెసేజ్.",
        who: "HR ప్రియ - ఆన్‌లైన్ జాబ్స్",
        subject: "",
        text: "అభినందనలు, మీరు ఎంపికయ్యారు! [[prize|ఆన్‌లైన్‌లో హోటళ్లకు రేటింగ్ ఇస్తూ రోజుకు ₹3,000 నుంచి ₹8,000 సంపాదించండి]], కేవలం 20 నిమిషాల పని. మొదటి 3 పనులు ఉచితం. ప్రీమియం పనుల కోసం [[money|₹5,000 డిపాజిట్ చేసి ఒక గంటలో ₹7,500 తిరిగి పొందండి]]. [[urgent|ఈరోజు 4 సీట్లు మాత్రమే మిగిలాయి!]]",
        why: "ఇది టాస్క్ మోసం. నమ్మకం కలిగించడానికి మొదటి చిన్న చెల్లింపులు నిజంగానే వస్తాయి. తర్వాత ప్రీమియం పనుల కోసం మీరు \"డిపాజిట్\" చేస్తారు, డబ్బు ఎప్పటికీ తిరిగి రాదు. ఏ నిజమైన ఉద్యోగమూ క్లిక్ చేసినందుకు డబ్బు ఇవ్వదు, ఏ యజమానీ డిపాజిట్ అడగరు.",
        todo: "ఏమీ డిపాజిట్ చేయవద్దు. ఖాతాను బ్లాక్ చేసి రిపోర్ట్ చేయండి. ఇప్పటికే చెల్లించి ఉంటే వెంటనే 1930 కి కాల్ చేయండి; మొదటి గంట చాలా ముఖ్యం."
      },
      vendor_real: {
        title: "తెలిసిన వెండర్ నుంచి చెల్లింపు గుర్తుచేత",
        ctx: "మీరు ప్రతి నెలా చెల్లించే ప్యాకేజింగ్ వెండర్ సాధారణ చిరునామా నుంచి ఈమెయిల్.",
        who: "Sunrise Packaging బిల్లింగ్",
        subject: "చెల్లింపు గుర్తుచేత - ఇన్వాయిస్ SP/26-27/0431, అక్టోబర్ 10 గడువు",
        text: "ప్రియమైన మెరిడియన్ టెక్స్‌టైల్స్ టీమ్, ₹86,000 ఇన్వాయిస్ SP/26-27/0431 అక్టోబర్ 10 న చెల్లించాలని ఇది ఒక మర్యాదపూర్వక గుర్తుచేత. [[ok|మా బ్యాంక్ వివరాలు మారలేదు, మీ దగ్గర ఉన్న ఇన్వాయిస్‌పై ముద్రించి ఉన్నాయి.]] [[ok|మా బ్యాంక్ ఖాతా మార్చమని ఏదైనా ఈమెయిల్ వస్తే, చెల్లించే ముందు మీ రికార్డుల్లోని నంబర్‌కు మా ఆఫీసుకు కాల్ చేయండి.]] ధన్యవాదాలు.",
        why: "తెలిసిన వెండర్ చిరునామా నుంచి సాధారణ గుర్తుచేత, కొత్త బ్యాంక్ వివరాలు లేవు, బెదిరింపు లేదు, ఏదైనా తేడాగా అనిపిస్తే ఫోన్‌లో సరిచూడమని వెండరే చెబుతున్నారు. నిజమైన భాగస్వామి సరిగ్గా ఇలాగే ప్రవర్తిస్తారు.",
        todo: "మీ రికార్డుల్లోని ఖాతాకు సాధారణ పద్ధతిలో చెల్లించండి. ఏ మార్పు అభ్యర్థననైనా తెలిసిన ఫోన్ నంబర్‌లో నిర్ధారించుకోండి."
      },
      deepfake: {
        title: "MD గొంతు అత్యవసర బదిలీ అడుగుతోంది",
        ctx: "తెలియని నంబర్ నుంచి కాల్. గొంతు అచ్చం మీ MD లాగే ఉంది, వెనుక విమానాశ్రయం శబ్దం.",
        who: "\"రాజేష్ సర్\" (MD గొంతు)",
        subject: "",
        text: "\"హలో, నేనే, విమానాశ్రయంలో ఉన్నాను, శబ్దం వినిపిస్తోంది కదా. [[urgent|ఇప్పుడే ₹2,00,000 బదిలీ చేయాలి]] దుబాయ్ ఆర్డర్ కోసం ఒక కొత్త సప్లయర్‌కు. [[newacct|ఖాతా నంబర్ WhatsApp చేస్తాను.]] [[secret|నాకు తిరిగి కాల్ చేయకు, ఫోన్ ఫ్లైట్ మోడ్‌లోకి వెళ్తోంది, నేను దిగేలోపు చేసేయ్.]]\"",
        why: "ఒక ప్రసంగం లేదా వీడియోలోని 30 సెకన్ల క్లిప్ నుంచి AI ఎవరి గొంతునైనా కాపీ చేయగలదు. కాపీ గొంతు + కొత్త ఖాతా నంబర్ + \"తిరిగి కాల్ చేయకు\" = డీప్‌ఫేక్ మోసం. వెనుక శబ్దం కావాలనే కలుపుతారు.",
        todo: "తిరిగి కాల్ చేస్తానని చెప్పండి, తర్వాత సేవ్ చేసిన నంబర్‌కు MD కి కాల్ చేయండి లేదా మరో సీనియర్‌తో సరిచూడండి. ఫోన్‌లో అత్యవసర అభ్యర్థనల కోసం టీమ్‌లో ఒక రహస్య పదం పెట్టుకోండి. సాధారణ ఆమోదం లేకుండా బదిలీ లేదు."
      },
      qr_receive: {
        title: "డబ్బు \"అందుకోవడానికి\" కొనుగోలుదారు QR కోడ్ పంపుతాడు",
        ctx: "ఒక క్లాసిఫైడ్ సైట్‌లో 12 పాత ఆఫీస్ కుర్చీలకు ప్రకటన ఇచ్చారు. ఒక కొనుగోలుదారు WhatsApp లో రాస్తాడు.",
        who: "ఆఫీస్ కుర్చీల కొనుగోలుదారు",
        subject: "",
        text: "హాయ్, ₹18,000 కి 12 పాత ఆఫీస్ కుర్చీల మీ ప్రకటన చూశాను. పూర్తి మొత్తం ఇప్పుడే చెల్లిస్తాను. [[upi|QR కోడ్ పంపాను: డబ్బు అందుకోవడానికి దాన్ని స్కాన్ చేసి మీ UPI PIN ఎంటర్ చేయండి.]] [[odd|నేను బయట పోస్టింగ్‌లో ఉన్న ఆర్మీ ఆఫీసర్‌ని, కాబట్టి నా స్నేహితుడు కుర్చీలు తీసుకెళ్తాడు.]] [[urgent|దయచేసి తరువాతి 5 నిమిషాల్లో చేయండి, నా నెట్‌వర్క్ బలహీనంగా ఉంది.]]",
        why: "డబ్బు అందుకోవడానికి మీరు ఎప్పుడూ QR స్కాన్ చేయరు లేదా PIN ఎంటర్ చేయరు. స్కాన్ చేసి PIN ఎంటర్ చేస్తే అవతలి వ్యక్తికి మీరు చెల్లిస్తారు. \"ఆర్మీ ఆఫీసర్\" కథ, తొందర క్లాసిఫైడ్ సైట్లలో సాధారణ మాయలు.",
        todo: "తిరస్కరించండి. మీ UPI ID కి డబ్బు పంపమని కొనుగోలుదారుకు చెప్పండి; డబ్బు అందుకోవడానికి మీరు ఏమీ చేయనక్కర్లేదు. యాప్‌లో ఆ నంబర్‌ను రిపోర్ట్ చేయండి."
      },
      fake_care: {
        title: "సెర్చ్‌లో దొరికిన కస్టమర్ కేర్ నంబర్",
        ctx: "రీఫండ్ రాలేదు. ఆన్‌లైన్‌లో బ్యాంక్ కస్టమర్ కేర్ వెతికి మొదట కనిపించిన నంబర్‌కు కాల్ చేశారు.",
        who: "\"NovaBank కస్టమర్ కేర్\"",
        subject: "",
        text: "\"NovaBank కస్టమర్ కేర్‌కు కాల్ చేసినందుకు ధన్యవాదాలు. ₹3,200 రీఫండ్ కోసం మిమ్మల్ని ధృవీకరించాలి. [[otp|దయచేసి మీ 16 అంకెల కార్డ్ నంబర్, ఎక్స్‌పైరీ తేదీ, ఇప్పుడు వచ్చే OTP చెప్పండి.]] [[remote|నేను పంపే Quick Support యాప్ కూడా ఇన్‌స్టాల్ చేయండి, అప్పుడు వేగంగా ప్రాసెస్ చేయగలను.]]\"",
        why: "మీరు సెర్చ్ ఫలితాల్లో లేదా నకిలీ వెబ్‌సైట్‌లో పెట్టిన నకిలీ నంబర్‌కు కాల్ చేశారు. ఏ బ్యాంకూ పూర్తి కార్డ్ నంబర్, ఎక్స్‌పైరీ, CVV లేదా OTP అడగదు, రిమోట్-కంట్రోల్ యాప్ ఇన్‌స్టాల్ చేయమని ఎప్పుడూ చెప్పదు.",
        todo: "కాల్ కట్ చేయండి. కార్డు వెనుక ముద్రించిన లేదా అధికారిక యాప్‌లోని నంబర్ మాత్రమే వాడండి. కాలర్ అడిగిన యాప్ ఎప్పుడూ ఇన్‌స్టాల్ చేయవద్దు. ఏదైనా పంచుకుంటే వెంటనే యాప్‌లో కార్డ్ బ్లాక్ చేసి 1930 కి కాల్ చేయండి."
      },
      hr_real: {
        title: "HR నుంచి దీపావళి సెలవుల జాబితా",
        ctx: "కంపెనీ HR చిరునామా నుంచి ఉద్యోగులందరికీ ఈమెయిల్.",
        who: "HR విభాగం",
        subject: "దీపావళి వారం సెలవుల జాబితా",
        text: "అందరికీ నమస్కారం, దీపావళి కోసం నవంబర్ 7 నుంచి 9 వరకు ఆఫీసు మూసి ఉంటుంది. [[ok|పూర్తి సెలవుల జాబితా ఇంట్రానెట్ HR పేజీలో ఉంది]], సెలవు కోసం మీరు వాడే అదే పేజీ. [[ok|మీరు ఏమీ చేయనవసరం లేదు.]] అందరికీ సంతోషకరమైన, సురక్షితమైన దీపావళి శుభాకాంక్షలు. - HR టీమ్",
        why: "కంపెనీ సొంత HR చిరునామా నుంచి, కేవలం సమాచారం, బయటి సైట్‌కు లింక్ లేదు, తెరవడానికి అటాచ్‌మెంట్ లేదు, నింపడానికి ఏమీ లేదు. నిజమైన నోటీసులకు తొందర అవసరం లేదు.",
        todo: "చేయాల్సింది ఏమీ లేదు. సెలవులు లేదా బోనస్ గురించి ఈమెయిల్ లాగిన్ అవ్వమని లేదా బ్యాంక్ వివరాలు నింపమని అడిగితే, దాన్ని ప్రమాద సంకేతంగా భావించి HR ను నేరుగా అడగండి."
      },
      screen_share: {
        title: "\"UPI హెల్ప్‌లైన్\" మీ స్క్రీన్ చూడాలనుకుంటోంది",
        ctx: "UPI చెల్లింపు విఫలమై మీరు సోషల్ మీడియాలో ఫిర్యాదు చేసిన కొన్ని నిమిషాల్లో వచ్చిన కాల్.",
        who: "\"UPI హెల్ప్‌లైన్\"",
        subject: "",
        text: "\"సర్, మీ ₹1,500 UPI చెల్లింపు ఆగిపోయింది. 2 నిమిషాల్లో సరిచేస్తాను. [[remote|నేను పంపిన లింక్ నుంచి స్క్రీన్-షేరింగ్ యాప్ ఇన్‌స్టాల్ చేసి, స్క్రీన్‌పై ఉన్న 9 అంకెల కోడ్ నాకు చదివి చెప్పండి.]] బ్యాంకింగ్ యాప్ తెరిచి ఉంచండి, నేను చూడటానికి మాత్రమే. [[otp|OTP వచ్చినప్పుడు కాల్ కట్ చేయవద్దు, నేను గైడ్ చేస్తాను.]]\"",
        why: "రిమోట్-యాక్సెస్, స్క్రీన్-షేరింగ్ యాప్‌లు కాలర్‌కు మీ ఫోన్‌ను చూసే, నడిపే వీలు ఇస్తాయి; 9 అంకెల కోడ్ పూర్తి యాక్సెస్ ఇస్తుంది. OTP తో కలిసి కొన్ని నిమిషాల్లో ఖాతా ఖాళీ చేయగలరు. నిజమైన హెల్ప్‌లైన్లు మీ స్క్రీన్ చూడాలని ఎప్పుడూ అడగవు.",
        todo: "కాల్ కట్ చేసి, ఇన్‌స్టాల్ చేసిన యాప్ తీసేయండి. అధికారిక UPI లేదా బ్యాంక్ యాప్‌లో మాత్రమే ఫిర్యాదు చేయండి. డబ్బు పోయి ఉంటే వెంటనే 1930 కి, మీ బ్యాంక్‌కు కాల్ చేయండి."
      },
      invoice_exe: {
        title: ".exe తో ముగిసే ఇన్వాయిస్ అటాచ్‌మెంట్",
        ctx: "కొన్నట్టు గుర్తులేని కంపెనీ నుంచి అకౌంట్స్ మెయిల్‌బాక్స్‌కు ఈమెయిల్.",
        who: "Global Trade Supplies",
        subject: "ఇన్వాయిస్ జత చేశాం - దయచేసి ప్రాసెస్ చేయండి",
        text: "[[odd|ప్రియమైన సర్,]] గత వారం సరఫరా చేసిన సరుకుల ఇన్వాయిస్ జత చేశాం. [[attach|అటాచ్‌మెంట్: Invoice_Oct2026.pdf.exe (412 KB)]] [[urgent|దయచేసి ఈరోజే చెల్లింపు చేయండి]], నిర్ధారించండి. [[odd|భవదీయులు, అకౌంట్స్ విభాగం.]]",
        why: ".exe తో ముగిసే ఫైల్ PDF కాదు, ఒక ప్రోగ్రామ్; పేరులోని \".pdf\" కేవలం మారువేషం. దాన్ని తెరిస్తే ఆఫీసులోని ప్రతి కంప్యూటర్‌ను లాక్ చేయగల మాల్వేర్ లేదా రాన్సమ్‌వేర్ ఇన్‌స్టాల్ అవుతుంది. సాధారణ సంబోధన, కంపెనీ సంతకం లేకపోవడం అదనపు హెచ్చరికలు.",
        todo: "అటాచ్‌మెంట్ తెరవవద్దు. ఈమెయిల్‌పై IT కి ఫిర్యాదు చేయండి. రికార్డులు చూడండి: మీరు నిజంగా ఈ కంపెనీ నుంచి కొన్నారా? ఇలాంటి మాయలు కనిపించేలా ఆఫీస్ కంప్యూటర్లలో \"ఫైల్ ఎక్స్‌టెన్షన్లు చూపించు\" ఆన్ చేయండి."
      },
      echallan: {
        title: "యాప్ లింక్‌తో ట్రాఫిక్ ఈ-చలాన్ SMS",
        ctx: "సాయంత్రం ఆఫీస్ డ్రైవర్ ఫోన్‌కు SMS.",
        who: "",
        subject: "",
        text: "ట్రాఫిక్ ఈ-చలాన్: మీ వాహనం KA-05-XX-1234 అక్టోబర్ 1 న సిగ్నల్ దాటినట్టు నమోదైంది. [[money|జరిమానా ₹1,000.]] రెట్టింపు జరిమానా, కోర్టు సమన్లు తప్పించుకోవడానికి [[urgent|24 గంటల్లో చెల్లించండి]]. [[link|అధికారిక చలాన్ యాప్ డౌన్‌లోడ్ చేయండి: echallan-pay.example.net/app.apk]]",
        why: "నిజమైన ఈ-చలాన్ మెసేజ్‌లు వ్యక్తిగత మొబైల్ నంబర్ నుంచి కాదు, ప్రభుత్వ సెండర్ ID నుంచి వస్తాయి, .apk ఫైల్ డౌన్‌లోడ్ చేయమని ఎప్పుడూ అడగవు. ఆ APK మీ SMS, OTP లను చదివే హానికర యాప్.",
        todo: "మెసేజ్ డిలీట్ చేయండి. చలాన్లను అధికారిక ప్రభుత్వ ఈ-చలాన్ వెబ్‌సైట్ లేదా రాష్ట్ర పోలీస్ యాప్‌లో మాత్రమే చూడండి. ఆ నంబర్‌పై సంచార్ సాథీ (చక్షు) లో ఫిర్యాదు చేయండి."
      },
      parcel_real: {
        title: "మీరు ఎదురుచూసే పార్సిల్ డెలివరీ సమాచారం",
        ctx: "గత వారం ప్యాకేజింగ్ సామగ్రి ఆర్డర్ చేశారు. ఈ SMS వస్తుంది.",
        who: "",
        subject: "",
        text: "SpeedParcel: Sunrise Packaging నుంచి మీ షిప్‌మెంట్ SP48213 [[ok|ఈరోజు మధ్యాహ్నం 2 నుంచి 5 మధ్య డెలివరీ అవుతుంది.]] [[ok|చెల్లించాల్సింది ఏమీ లేదు.]] [[ok|ట్రాక్ చేయడానికి మా వెబ్‌సైట్ లేదా యాప్‌లో షిప్‌మెంట్ నంబర్ వాడండి.]]",
        why: "నమోదిత సెండర్ ID నుంచి (వ్యక్తిగత నంబర్ కాదు), మీరు ఎదురుచూసే పార్సిల్‌కు సరిపోతుంది, డబ్బు అడగదు, ట్యాప్ చేయడానికి లింక్ ఇవ్వదు. నిజమైన డెలివరీ మెసేజ్ కేవలం సమాచారం ఇస్తుంది.",
        todo: "చేయాల్సింది ఏమీ లేదు. పార్సిల్ మెసేజ్ ఫీజు, లింక్ లేదా యాప్ అడిగితే, ఆగి, షిప్‌మెంట్ నంబర్‌తో అధికారిక వెబ్‌సైట్‌లో చూడండి."
      },
      kyc: {
        title: "KYC గడువు ముగిసింది, ఖాతా ఈరోజు బ్లాక్",
        ctx: "రాత్రి యజమాని ఫోన్‌కు SMS.",
        who: "",
        subject: "",
        text: "ప్రియమైన కస్టమర్, మీ KYC గడువు ముగిసినందున [[threat|మీ NovaBank ఖాతా ఈరోజు బ్లాక్ అవుతుంది]]. [[link|novabank-kyc-update.example.net]] లో [[urgent|వెంటనే అప్‌డేట్ చేయండి]] లేదా [[sender|మా అధికారికి 94XXX XXX51 కి కాల్ చేయండి]].",
        why: "బ్యాంకులు వ్యక్తిగత మొబైల్ నంబర్ నుంచి KYC లింక్‌లు పంపవు, కొన్ని గంటల్లో ఖాతా బ్లాక్ చేయవు. లింక్ మీ లాగిన్, OTP దొంగిలించే నకిలీ బ్యాంక్ పేజీ తెరుస్తుంది; \"అధికారి\" యాప్ ఇన్‌స్టాల్ చేయమంటాడు.",
        todo: "లింక్ ట్యాప్ చేయవద్దు, కాల్ చేయవద్దు. KYC నిజంగా బాకీ ఉంటే బ్యాంక్ సొంత యాప్ లేదా బ్రాంచ్ చెబుతుంది. SMS పై సంచార్ సాథీ (చక్షు) లో ఫిర్యాదు చేయండి."
      },
      sim_swap: {
        title: "కాల్: మీ SIM డీయాక్టివేట్ అవుతుంది",
        ctx: "బ్యాంక్ OTP ల కోసం ఈ నంబర్ వాడే ఆఫీస్ మేనేజర్‌కు కాల్.",
        who: "\"టెలికాం కంపెనీ ఎగ్జిక్యూటివ్\"",
        subject: "",
        text: "\"మేడమ్, నేను మీ మొబైల్ నెట్‌వర్క్ నుంచి మాట్లాడుతున్నాను. 5G అప్‌గ్రేడ్ పెండింగ్‌లో ఉన్నందున [[threat|మీ SIM 24 గంటల్లో డీయాక్టివేట్ అవుతుంది]]. [[otp|అప్‌గ్రేడ్ కోసం మీ SIM కార్డుపై ముద్రించిన 20 అంకెల నంబర్ చదివి చెప్పండి, వచ్చే SMS తర్వాత 1 నొక్కండి.]] [[urgent|ఈ ఆఫర్ ఈరోజే ముగుస్తుంది.]]\"",
        why: "ఇది SIM-స్వాప్ ప్రయత్నం. 20 అంకెల SIM నంబర్, మీ \"1\" తో మోసగాడు మీ నంబర్‌ను తన SIM లో యాక్టివేట్ చేసుకుంటాడు. మీ ఫోన్ పనిచేయడం ఆగిపోతుంది, బ్యాంకింగ్, UPI కి వచ్చే ప్రతి OTP అతనికే వెళ్తుంది.",
        todo: "కాల్ కట్ చేయండి. టెలికాం కంపెనీలు 5G అప్‌గ్రేడ్ కోసం కాల్ చేయవు. మీ ఫోన్‌లో అకస్మాత్తుగా చాలాసేపు నెట్‌వర్క్ పోతే ముందు బ్యాంక్‌కు, తర్వాత ఆపరేటర్‌కు కాల్ చేయండి. మీ పేరున ఉన్న SIM లను సంచార్ సాథీలో చూడండి."
      },
      mfa: {
        title: "అర్ధరాత్రి నుంచి ఏడో లాగిన్ ఆమోద అభ్యర్థన",
        ctx: "రాత్రి ఆఫీస్ లాగిన్ యాప్ నుంచి సైన్-ఇన్ ఆమోద అభ్యర్థనలతో ఫోన్ ఆగకుండా మోగుతోంది. తర్వాత ఒక కాల్ వస్తుంది.",
        who: "SecureLogin యాప్",
        subject: "",
        text: "[[otp|సైన్-ఇన్ ఆమోదించాలా? ఎవరో కొత్త పరికరం నుంచి మీ ఆఫీస్ ఖాతాలోకి సైన్-ఇన్ అవుతున్నారు. కొనసాగడానికి APPROVE ట్యాప్ చేయండి.]] [[odd|(అర్ధరాత్రి నుంచి ఇది 7వ అభ్యర్థన.)]] కొద్దిసేపటికి ఒక కాలర్ అంటాడు: \"[[urgent|నేను IT నుంచి, సర్వర్ సరిచేస్తున్నాం. అలర్ట్‌లు ఆగడానికి అభ్యర్థనను ఆమోదించేయండి.]]\"",
        why: "దీన్ని \"MFA అలసట\" అంటారు. దాడిచేసేవారి దగ్గర మీ పాస్‌వర్డ్ ఇప్పటికే ఉంది, విసుగొచ్చి మీరు Approve నొక్కుతారనే ఆశతో అభ్యర్థనలు కుమ్మరిస్తున్నారు. \"IT\" కాల్ దాడిలో భాగమే. మీరు ప్రారంభించని లాగిన్‌ను ఆమోదించమని నిజమైన IT ఎప్పుడూ అడగదు.",
        todo: "ప్రతిసారీ Deny నొక్కండి. నమ్మకమైన పరికరం నుంచి వెంటనే పాస్‌వర్డ్ మార్చి IT కి చెప్పండి. పదే పదే అభ్యర్థనలు అంటే మీ పాస్‌వర్డ్ ఇప్పటికే లీక్ అయిందని అర్థం."
      },
      gst_real: {
        title: "మీ CA నుంచి నెలవారీ GST గుర్తుచేత",
        ctx: "మీ చార్టర్డ్ అకౌంటెంట్ సేవ్ చేసిన నంబర్ నుంచి WhatsApp మెసేజ్.",
        who: "మెహతా & కో. (మా CA)",
        subject: "",
        text: "శుభోదయం. గుర్తుచేత: సెప్టెంబర్ GSTR-3B అక్టోబర్ 20 న దాఖలు చేయాలి. [[ok|అమ్మకాలు, కొనుగోళ్ల షీట్లను ప్రతి నెలలాగే అదే షేర్డ్ ఫోల్డర్‌లో అప్‌లోడ్ చేయండి.]] [[ok|ప్రస్తుతం మీ వైపు నుంచి ఏ చెల్లింపూ అవసరం లేదు]]; ఫైలింగ్ తర్వాత చలాన్ వివరాలు పంపుతాను, మన సాధారణ కాల్‌లో నిర్ధారించుకుందాం.",
        why: "తెలిసిన CA, సేవ్ చేసిన నంబర్, సాధారణ నెలవారీ ప్రక్రియ, కొత్త ఖాతా నంబర్ లేదు, లింక్ లేదు, నిజమైన గడువు తేదీకి మించి తొందర లేదు. ధృవీకరణ మీ సాధారణ కాల్‌లో జరుగుతుంది.",
        todo: "మీ సాధారణ ప్రక్రియనే పాటించండి. ఏదో ఒకరోజు \"CA\" కొత్త బ్యాంక్ ఖాతా పంపినా లేదా లింక్ ద్వారా చెల్లించమన్నా, ముందు తెలిసిన నంబర్‌కు CA ఆఫీసుకు కాల్ చేయండి."
      },
      lookalike: {
        title: "అచ్చం అలాంటి డొమైన్‌పై జీతం స్లిప్",
        ctx: "సవరించిన జీతం స్లిప్ గురించి ఈమెయిల్. మీ కంపెనీ నిజమైన డొమైన్ meridiantextiles.example.com.",
        who: "పేరోల్ టీమ్",
        subject: "మీ సవరించిన జీతం స్లిప్ సిద్ధంగా ఉంది",
        text: "ప్రియమైన ఉద్యోగి, అక్టోబర్ నుంచి మీ జీతం నిర్మాణం సవరించబడింది. [[link|కొత్త స్లిప్ చూడటానికి meridian-textiles-portal.example.com లో మీ ఆఫీస్ పాస్‌వర్డ్‌తో లాగిన్ అవ్వండి.]] [[urgent|లింక్ 12 గంటల్లో గడువు ముగుస్తుంది.]] [[sender|payroll@meridian-textiles.example.com నుంచి పంపబడింది]]",
        why: "కంపెనీ నిజమైన డొమైన్ meridiantextiles.example.com; ఈమెయిల్ meridian-textiles (హైఫన్‌తో) అనే అచ్చం అలాంటి డొమైన్ వాడుతోంది. లింక్ మీ ఆఫీస్ పాస్‌వర్డ్ దొంగిలించే కాపీ లాగిన్ పేజీకి తీసుకెళ్తుంది. జీతం స్లిప్ మీరు ఎప్పుడూ వాడే HR పోర్టల్‌లోనే ఉంటుంది.",
        todo: "క్లిక్ చేయవద్దు. చిరునామా టైప్ చేసి లేదా బుక్‌మార్క్ నుంచి HR పోర్టల్‌ను మీరే తెరవండి. ఈమెయిల్‌పై IT కి ఫిర్యాదు చేయండి; ఫార్వర్డ్ చేస్తే నకిలీ డొమైన్‌ను అందరికీ బ్లాక్ చేయగలరు."
      },
      usb: {
        title: "పార్కింగ్‌లో దొరికిన పెన్ డ్రైవ్",
        ctx: "సోమవారం ఉదయం, ఆఫీస్ ప్రవేశ ద్వారం దగ్గర.",
        who: "ఆఫీస్ పార్కింగ్‌లో దొరికిన పెన్ డ్రైవ్",
        subject: "",
        text: "ప్రవేశ ద్వారం దగ్గర ఒక పెన్ డ్రైవ్ పడి ఉంది, దానిపై లేబుల్: [[prize|\"జీతాల పెంపు 2026 - రహస్యం - యాజమాన్యానికి మాత్రమే\"]]. ఒక సహోద్యోగి అంటాడు: \"[[remote|రిసెప్షన్ PC లో పెట్టి ఎవరిదో చూద్దాం.]]\"",
        why: "దీన్ని \"USB డ్రాప్\" అంటారు. దాడిచేసేవారు ఆకర్షణీయమైన లేబుళ్లతో పెన్ డ్రైవ్‌లు వదిలేస్తారు; ఒకటి పెట్టగానే దాగిన సాఫ్ట్‌వేర్ దానంతట అదే ఇన్‌స్టాల్ అయి ఆఫీస్ నెట్‌వర్క్ అంతా వ్యాపించవచ్చు. కుతూహలమే దాడి.",
        todo: "ఎక్కడా పెట్టవద్దు. ఒక కవర్‌లో పెట్టి IT లేదా సెక్యూరిటీకి ఇవ్వండి. కంపెనీలు ఆటో-రన్ ఆపి తెలియని USB పరికరాలను బ్లాక్ చేయాలి."
      },
      wifi: {
        title: "విమానాశ్రయ ఉచిత Wi-Fi ఈమెయిల్ పాస్‌వర్డ్ అడుగుతోంది",
        ctx: "ఫ్లైట్ కోసం ఎదురుచూస్తూ, రెండు వెండర్ చెల్లింపులు ఆమోదించడానికి ఉచిత నెట్‌వర్క్‌కు కనెక్ట్ అవుతారు.",
        who: "విమానాశ్రయంలో ఉచిత Wi-Fi లాగిన్ స్క్రీన్",
        subject: "",
        text: "నెట్‌వర్క్: Airport_Free_WiFi_5G (పాస్‌వర్డ్ లేదు). [[otp|కొనసాగడానికి మీ ఈమెయిల్ చిరునామా, ఈమెయిల్ పాస్‌వర్డ్‌తో సైన్-ఇన్ చేయండి.]] తర్వాత ఫ్లైట్ కోసం ఎదురుచూస్తూ [[data|కంపెనీ బ్యాంకింగ్ పోర్టల్‌లో రెండు వెండర్ చెల్లింపులు ఆమోదించాలని]] అనుకుంటారు.",
        why: "అధికారికంగా అనిపించే పేరుతో ఎవరైనా హాట్‌స్పాట్ సృష్టించవచ్చు. నకిలీ నెట్‌వర్క్‌లో మీరు టైప్ చేసేది దాడిచేసేవారు చూడగలరు, ఈమెయిల్ పాస్‌వర్డ్ అడిగే లాగిన్ పేజీ వివరాలు దొంగిలిస్తోంది. పబ్లిక్ Wi-Fi లో బ్యాంకింగ్ ప్రమాదకరం.",
        todo: "పనికి, బ్యాంకింగ్‌కు మీ సొంత మొబైల్ డేటా లేదా కంపెనీ VPN వాడండి. Wi-Fi లాగిన్ పేజీలో ఆఫీస్ లేదా ఈమెయిల్ పాస్‌వర్డ్ ఎప్పుడూ టైప్ చేయవద్దు. ఓపెన్ నెట్‌వర్క్‌లకు ఆటో-కనెక్ట్ ఆపేయండి."
      },
      upi_real: {
        title: "చెల్లింపు అందిన నోటిఫికేషన్",
        ctx: "మీరు కౌంటర్ దగ్గర ఉండగా మీ సొంత UPI యాప్ నుంచి నోటిఫికేషన్.",
        who: "UPI యాప్",
        subject: "",
        text: "[[ok|Anita Traders నుంచి ₹2,500 అందింది]] 4471 తో ముగిసే మీ కరెంట్ ఖాతాలోకి. [[ok|ఏ చర్యా అవసరం లేదు.]] లావాదేవీ ID 628104...",
        why: "లోపలికి వచ్చే డబ్బుకు PIN, OTP లేదా స్కాన్ ఎప్పుడూ అవసరం లేదు. నోటిఫికేషన్ మీ సొంత యాప్ నుంచి, చెల్లించినవారి పేరు చెబుతుంది, మిమ్మల్ని ఏమీ అడగదు. దీన్ని \"కలెక్ట్ రిక్వెస్ట్\" లేదా స్కాన్ చేయమన్న QR తో పోల్చండి: అవి డబ్బు బయటకు తీస్తాయి.",
        todo: "చేయాల్సింది ఏమీ లేదు. మొత్తాన్ని ఇన్వాయిస్‌తో సరిపోల్చండి. \"చెల్లింపు అందింది\" మెసేజ్ ఎప్పుడైనా ఆమోదం, PIN లేదా స్కాన్ అడిగితే, అది డబ్బు ఇవ్వడం లేదు, తీసుకుంటోంది."
      },
      dpdp: {
        title: "సహోద్యోగికి కస్టమర్ జాబితా WhatsApp లో కావాలట",
        ctx: "సాయంత్రం సేల్స్ సహోద్యోగి నంబర్ నుంచి WhatsApp మెసేజ్.",
        who: "సమీర్ (సేల్స్ సహోద్యోగి)",
        subject: "",
        text: "బ్రో, ఈరోజు ఇంటి నుంచి పని చేస్తున్నాను. [[data|ఫోన్ నంబర్లు, ఆధార్ కాపీలతో పూర్తి కస్టమర్ జాబితా ఎక్స్‌పోర్ట్ చేసి ఇదే WhatsApp లో పంపు]], తర్వాత డిలీట్ చేస్తాను. [[urgent|క్యాంపెయిన్ కోసం 10 నిమిషాల్లో కావాలి.]] [[secret|మేనేజర్‌కు చెప్పనక్కర్లేదు, చిన్న విషయం.]]",
        why: "కస్టమర్ ఫోన్ నంబర్లు, ఆధార్ కాపీలు భారత DPDP చట్టం రక్షించే వ్యక్తిగత డేటా. వ్యక్తిగత WhatsApp లో పంపితే అవి కంపెనీ నియంత్రణ దాటిపోతాయి, ఇది హ్యాక్ అయిన ఖాతా లేదా వేషధారణ కూడా కావచ్చు. \"మేనేజర్‌కు చెప్పకు\" ఎప్పుడూ ఆమోదయోగ్యం కాదు.",
        todo: "మర్యాదగా వద్దని చెప్పండి. కస్టమర్ డేటాను కంపెనీ ఆమోదించిన వ్యవస్థ ద్వారా, మేనేజర్ ఆమోదంతో, అవసరమైన వివరాలు మాత్రమే పంచుకోండి. సహోద్యోగి ఖాతా వింతగా అనిపిస్తే వారికి కాల్ చేయండి."
      },
      otp_call: {
        title: "చెల్లింపు రద్దుకు \"ఫ్రాడ్ విభాగానికి\" OTP కావాలట",
        ctx: "మీ ఫోన్‌కు OTP SMS వస్తుండగానే వచ్చిన కాల్.",
        who: "\"NovaBank ఫ్రాడ్ విభాగం\"",
        subject: "",
        text: "\"సర్, [[threat|మీ కార్డుపై ఇప్పుడే ₹49,999 లావాదేవీ జరుగుతోంది.]] దాన్ని రద్దు చేయడానికి [[urgent|60 సెకన్లలో చర్య తీసుకోవాలి]]. [[otp|మీ ఫోన్‌కు ఇప్పుడే వచ్చిన OTP చెప్పండి, నేను దాన్ని వెనక్కి తిప్పుతాను.]] [[secret|దయచేసి కాల్ కట్ చేయవద్దు, ఎవరికీ కాల్ చేయవద్దు.]]\"",
        why: "\"ఇప్పుడే వచ్చిన\" OTP మీ కార్డుతో చెల్లించడానికి మోసగాడు చేస్తున్న ప్రయత్నానికి. దాన్ని చదివి చెబితే చెల్లింపు పూర్తవుతుంది. ఏదైనా రద్దు చేయడానికి బ్యాంకులు OTP అడగవు, మీరు ఆలోచించకుండా ఉండేందుకే 60 సెకన్ల భయం సృష్టిస్తారు.",
        todo: "కాల్ కట్ చేయండి. బ్యాంక్ యాప్ తెరిచి కార్డును మీరే బ్లాక్ చేయండి, లేదా కార్డు వెనుక నంబర్‌కు కాల్ చేయండి. OTP ను ఎవరికీ చదివి చెప్పవద్దు. డబ్బు పోయి ఉంటే వెంటనే 1930 కి కాల్ చేయండి."
      },
      hr_bonus: {
        title: "దీపావళి బోనస్ ఫారం నెట్-బ్యాంకింగ్ లాగిన్ అడుగుతోంది",
        ctx: "దీపావళికి ముందు, HR లా కనిపించే చిరునామా నుంచి ఉద్యోగులందరికీ ఈమెయిల్.",
        who: "HR రివార్డ్స్ టీమ్",
        subject: "దీపావళి బోనస్ ₹25,000 - మీ బ్యాంక్ ఖాతా నిర్ధారించండి",
        text: "ప్రియమైన టీమ్ సభ్యుడా, ₹25,000 దీపావళి బోనస్ ప్రకటించడం సంతోషంగా ఉంది. [[attach|జత చేసిన ఫారం (Bonus_Form.html) తెరవండి]], బోనస్ నేరుగా జమ కావడానికి [[otp|మీ నెట్-బ్యాంకింగ్ యూజర్ ID, పాస్‌వర్డ్ ఎంటర్ చేయండి]]. [[urgent|ఈరోజు సాయంత్రం 6 తర్వాత వచ్చిన ఫారాలు ప్రాసెస్ చేయబడవు.]] [[sender|HR Rewards - meridiantextiles-bonus.example.net]]",
        why: "మీ జీతం ఖాతా HR దగ్గర ఇప్పటికే ఉంది; ఏ కంపెనీ బోనస్ కోసం నెట్-బ్యాంకింగ్ లాగిన్ అడగదు. పంపినవారు అచ్చం అలాంటి డొమైన్, HTML అటాచ్‌మెంట్ నకిలీ బ్యాంక్ లాగిన్ పేజీ, అదే రోజు గడువు ఒత్తిడి పెంచుతుంది.",
        todo: "అటాచ్‌మెంట్ తెరవవద్దు, ఏమీ ఎంటర్ చేయవద్దు. HR ను నేరుగా లేదా ఇంట్రానెట్‌లో అడగండి. సహోద్యోగులు అప్రమత్తమయ్యేలా ఈమెయిల్‌పై IT కి ఫిర్యాదు చేయండి."
      },
      electricity: {
        title: "ఈరాత్రి ఆఫీస్ కరెంట్ కట్ అవుతుంది",
        ctx: "రాత్రి 8:35 కి దుకాణ యజమాని ఫోన్‌కు SMS.",
        who: "",
        subject: "",
        text: "ప్రియమైన వినియోగదారు, [[odd|గత నెల బిల్లు మా సిస్టమ్‌లో అప్‌డేట్ కాలేదు]] కాబట్టి [[threat|మీ ఆఫీస్ కరెంట్ కనెక్షన్ ఈరాత్రి 9:30 కి కట్ చేయబడుతుంది]]. మా అధికారిని [[sender|93XXX XXX40]] లో [[urgent|వెంటనే]] సంప్రదించండి.",
        why: "విద్యుత్ బోర్డులు వ్యక్తిగత మొబైల్ నుంచి ఒక SMS తర్వాత రాత్రి కరెంట్ కట్ చేయవు. కాల్ చేస్తే \"అధికారి\" యాప్ ఇన్‌స్టాల్ చేయమని లేదా లింక్ ద్వారా ₹10 చెల్లించమని అడుగుతాడు, అసలు లక్ష్యం మీ బ్యాంక్ ఖాతా.",
        todo: "కాల్ చేయవద్దు. బిల్లును విద్యుత్ బోర్డు అధికారిక యాప్ లేదా ఆఫీసులో చూడండి. ఆ నంబర్‌పై సంచార్ సాథీ (చక్షు) లో ఫిర్యాదు చేయండి."
      },
      wa_hijack: {
        title: "6 అంకెల కోడ్ ఫార్వర్డ్ చేయమని సహోద్యోగి అడుగుతాడు",
        ctx: "మీ ఫోన్‌కు కోడ్ SMS వచ్చిన వెంటనే, అర్ధరాత్రి సహోద్యోగి సేవ్ చేసిన నంబర్ నుంచి WhatsApp మెసేజ్.",
        who: "రోహన్ (సహోద్యోగి)",
        subject: "",
        text: "హేయ్, ఇంత రాత్రి ఇబ్బంది పెడుతున్నందుకు సారీ. [[odd|WhatsApp లో లాగిన్ అవుతుంటే పొరపాటున నీ నంబర్ ఎంటర్ చేశాను, 6 అంకెల కోడ్ నీ ఫోన్‌కు వెళ్లింది.]] [[otp|ఆ కోడ్ నాకు ఫార్వర్డ్ చెయ్]], [[urgent|త్వరగా, లేదంటే నా ఖాతా లాక్ అవుతుంది.]]",
        why: "వచ్చిన కోడ్ మీ సొంత WhatsApp వెరిఫికేషన్ కోడ్. అది ఎవరికి దొరికితే వారు మీ ఖాతాను స్వాధీనం చేసుకుని, మీ కాంటాక్ట్‌లు, ఆఫీస్ గ్రూపులన్నిటికీ డబ్బు అడుగుతూ మెసేజ్‌లు పంపుతారు. ఈ మెసేజ్ కూడా సహోద్యోగి ఇప్పటికే హ్యాక్ అయిన ఖాతా నుంచి వచ్చి ఉండవచ్చు.",
        todo: "వెరిఫికేషన్ కోడ్ ఎప్పుడూ ఫార్వర్డ్ చేయవద్దు. సహోద్యోగికి ఫోన్ చేసి వారి ఖాతా హ్యాక్ అయిందని హెచ్చరించండి. WhatsApp సెట్టింగ్స్‌లో టూ-స్టెప్ వెరిఫికేషన్ ఆన్ చేయండి."
      },
      invest_group: {
        title: "గ్యారంటీ లాభాల స్టాక్-టిప్స్ గ్రూప్",
        ctx: "మిమ్మల్ని అడగకుండానే ఒక WhatsApp గ్రూప్‌లో చేర్చారు.",
        who: "VIP Stock Tips - గ్రూప్ అడ్మిన్",
        subject: "",
        text: "మా ప్రీమియం గ్రూప్‌కు స్వాగతం! [[prize|గ్యారంటీ ఇన్‌సైడర్ టిప్స్‌తో మా సభ్యులు గత నెల 32% లాభం సంపాదించారు.]] మా ట్రేడింగ్ యాప్‌ను [[link|యాప్ స్టోర్ నుంచి కాదు, ఈ లింక్ నుంచి]] డౌన్‌లోడ్ చేయండి, [[money|₹50,000 డిపాజిట్‌తో మొదలుపెట్టండి]]. [[prize|సభ్యులు పోస్ట్ చేసిన లాభాల స్క్రీన్‌షాట్లు చూడండి!]] [[urgent|ప్రవేశం అర్ధరాత్రి ముగుస్తుంది.]]",
        why: "ఎవరూ లాభాలకు గ్యారంటీ ఇవ్వలేరు, \"ఇన్‌సైడర్ టిప్స్\" చట్టవిరుద్ధం. యాప్ నకిలీ: మీరు ఇంకా డిపాజిట్ చేయడానికి కల్పిత లాభాలు చూపిస్తుంది, డబ్బు తీసుకోనివ్వదు. స్క్రీన్‌షాట్లు పోస్ట్ చేసే \"సభ్యులు\" మోసగాళ్లే.",
        todo: "గ్రూప్ నుంచి బయటకు వచ్చి రిపోర్ట్ చేయండి. SEBI నమోదిత బ్రోకర్లు, అధికారిక యాప్ స్టోర్ యాప్‌ల ద్వారా మాత్రమే పెట్టుబడి పెట్టండి. డిపాజిట్ చేసి ఉంటే 1930 కి కాల్ చేసి cybercrime.gov.in లో ఫిర్యాదు చేయండి."
      },
      bank_real: {
        title: "మీరు చేసిన చెల్లింపుకు డెబిట్ అలర్ట్",
        ctx: "మీ అకౌంట్స్ టీమ్ ఈరోజు ప్యాకేజింగ్ వెండర్‌కు చెల్లించింది. ఈ SMS వస్తుంది.",
        who: "",
        subject: "",
        text: "NovaBank: [[ok|Sunrise Packaging కు NEFT కోసం అక్టోబర్ 10 న 4471 తో ముగిసే ఖాతా నుంచి ₹86,000 డెబిట్]], రిఫరెన్స్ N26101034. బ్యాలెన్స్ ₹3,42,118. [[ok|మీరు చేయకపోతే మీ డెబిట్ కార్డు వెనుక ఉన్న నంబర్‌కు కాల్ చేయండి.]]",
        why: "ఇది ఈరోజు మీ అకౌంట్స్ టీమ్ చేసిన చెల్లింపుతో సరిపోతుంది, బ్యాంక్ సెండర్ ID నుంచి వచ్చింది, SMS లో లింక్ లేదా నంబర్ లేదు, మీ సొంత కార్డుపై ఉన్న నంబర్‌ను సూచిస్తుంది.",
        todo: "మీ చెల్లింపు రికార్డులతో సరిపోల్చండి. ఏదైనా డెబిట్ అలర్ట్ మీరు చేసిన చెల్లింపుతో సరిపోకపోతే, మెసేజ్‌లోని నంబర్ కాదు, కార్డుపై ఉన్న నంబర్‌కు వెంటనే బ్యాంక్‌కు కాల్ చేయండి."
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
