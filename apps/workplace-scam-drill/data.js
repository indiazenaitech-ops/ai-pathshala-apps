/* Workplace Scam & Cyber Drill: language-neutral facts about each scenario.
   The words (title, context, sender name, subject, message, explanation, what to do) live in content.js
   under the same id, in all 12 languages. In message texts, [[code|words]] marks a red flag
   (code = urgent, secret, money, newacct, link, attach, otp, sender, threat, prize, odd, remote, upi, data)
   or a safe sign (code = ok).
   Every company, person, number, address and domain is invented: 98XXX XXXXX numbers, example.com/.net/.org domains.
   ch: email | wa (WhatsApp) | sms | call (phone transcript) | video (video call) | tg (Telegram) | notif (phone notification) | other (at the office)
   senderFlag: the sender itself is a red flag (personal number or look-alike address pretending to be official).
   cat: payment | phishing | impersonation | device | money | data */
window.DRILL_DATA = [
  { id: 'ceo_gift', ch: 'wa', from: '+91 98XXX XXX21', time: '09:12', scam: true, cat: 'impersonation', senderFlag: true },
  { id: 'it_real', ch: 'email', from: 'it-helpdesk@meridiantextiles.example.com', to: 'all-staff@meridiantextiles.example.com', time: '10:00', scam: false, cat: 'phishing' },
  { id: 'bec_vendor', ch: 'email', from: 'accounts@kaveri-logistics-india.example.net', to: 'accounts@meridiantextiles.example.com', time: '11:40', scam: true, cat: 'payment', senderFlag: true },
  { id: 'gst_notice', ch: 'email', from: 'notice@gst-india-portal.example.net', to: 'accounts@meridiantextiles.example.com', time: '08:30', scam: true, cat: 'phishing', senderFlag: true, attach: 'GST_Notice_2026.html' },
  { id: 'otp_real', ch: 'sms', from: 'VM-NOVABK', time: '12:05', scam: false, cat: 'payment' },
  { id: 'digital_arrest', ch: 'video', from: '+91 97XXX XXX08', time: '15:20', scam: true, cat: 'impersonation', senderFlag: true },
  { id: 'courier', ch: 'call', from: '+91 80XXX XXX44', time: '13:02', scam: true, cat: 'phishing', senderFlag: true },
  { id: 'task_job', ch: 'tg', from: '@HR_Priya_Jobs_2026', time: '20:15', scam: true, cat: 'money' },
  { id: 'vendor_real', ch: 'email', from: 'billing@sunrisepackaging.example.com', to: 'accounts@meridiantextiles.example.com', time: '16:10', scam: false, cat: 'payment' },
  { id: 'deepfake', ch: 'call', from: '+91 99XXX XXX77', time: '17:48', scam: true, cat: 'impersonation', senderFlag: true },
  { id: 'qr_receive', ch: 'wa', from: '+91 96XXX XXX35', time: '18:30', scam: true, cat: 'payment' },
  { id: 'fake_care', ch: 'call', from: '+91 70XXX XXX19', time: '11:15', scam: true, cat: 'impersonation', senderFlag: true },
  { id: 'hr_real', ch: 'email', from: 'hr@meridiantextiles.example.com', to: 'all-staff@meridiantextiles.example.com', time: '09:45', scam: false, cat: 'phishing' },
  { id: 'screen_share', ch: 'call', from: '+91 81XXX XXX62', time: '14:25', scam: true, cat: 'device', senderFlag: true },
  { id: 'invoice_exe', ch: 'email', from: 'accounts@globaltrade-supplies.example.org', to: 'accounts@meridiantextiles.example.com', time: '07:55', scam: true, cat: 'device', attach: 'Invoice_Oct2026.pdf.exe' },
  { id: 'echallan', ch: 'sms', from: '+91 73XXX XXX90', time: '19:10', scam: true, cat: 'phishing', senderFlag: true },
  { id: 'parcel_real', ch: 'sms', from: 'VM-SPDPCL', time: '10:30', scam: false, cat: 'phishing' },
  { id: 'kyc', ch: 'sms', from: '+91 94XXX XXX51', time: '21:05', scam: true, cat: 'phishing', senderFlag: true },
  { id: 'sim_swap', ch: 'call', from: '+91 62XXX XXX83', time: '12:40', scam: true, cat: 'device', senderFlag: true },
  { id: 'mfa', ch: 'notif', from: 'SecureLogin', time: '00:42', scam: true, cat: 'device' },
  { id: 'gst_real', ch: 'wa', from: '+91 98XXX XXX12', time: '10:20', scam: false, cat: 'payment' },
  { id: 'lookalike', ch: 'email', from: 'payroll@meridian-textiles.example.com', to: 'you@meridiantextiles.example.com', time: '09:05', scam: true, cat: 'phishing', senderFlag: true },
  { id: 'usb', ch: 'other', from: '', time: '08:10', scam: true, cat: 'device' },
  { id: 'wifi', ch: 'other', from: 'Airport_Free_WiFi_5G', time: '06:30', scam: true, cat: 'device' },
  { id: 'upi_real', ch: 'notif', from: 'UPI', time: '13:15', scam: false, cat: 'payment' },
  { id: 'dpdp', ch: 'wa', from: '+91 98XXX XXX67', time: '18:05', scam: true, cat: 'data' },
  { id: 'otp_call', ch: 'call', from: '+91 76XXX XXX29', time: '16:50', scam: true, cat: 'impersonation', senderFlag: true },
  { id: 'hr_bonus', ch: 'email', from: 'hr-rewards@meridiantextiles-bonus.example.net', to: 'you@meridiantextiles.example.com', time: '17:30', scam: true, cat: 'phishing', senderFlag: true, attach: 'Bonus_Form.html' },
  { id: 'electricity', ch: 'sms', from: '+91 93XXX XXX40', time: '20:35', scam: true, cat: 'phishing', senderFlag: true },
  { id: 'wa_hijack', ch: 'wa', from: '+91 98XXX XXX67', time: '22:10', scam: true, cat: 'device' },
  { id: 'invest_group', ch: 'wa', from: '+91 89XXX XXX56', time: '07:20', scam: true, cat: 'money' },
  { id: 'bank_real', ch: 'sms', from: 'VM-NOVABK', time: '14:00', scam: false, cat: 'payment' }
];
