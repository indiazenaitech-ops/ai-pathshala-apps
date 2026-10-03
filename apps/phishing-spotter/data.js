/* Spot the Scam: language-neutral facts about each practice message.
   The words of every message (in all 12 languages) live in content.js under the same id.
   All names, numbers, sender IDs and links are invented or masked for practice.
   ch: sms | wa (WhatsApp) | email | dm (social media) | call
   senderFlag: the sender itself is a red flag (personal / foreign number pretending to be official). */
window.SPOT_MSGS = [
  { id: 'kyc', ch: 'sms', from: '+91 70019 XXXXX', time: '10:42', scam: true, senderFlag: true },
  { id: 'power', ch: 'sms', from: '+91 93321 XXXXX', time: '20:05', scam: true, senderFlag: true },
  { id: 'kbc', ch: 'wa', from: '+44 7451 XXXXXX', time: '13:17', scam: true, senderFlag: true },
  { id: 'job', ch: 'wa', from: '+91 88260 XXXXX', time: '11:58', scam: true, senderFlag: false },
  { id: 'otp_ask', ch: 'sms', from: '+91 79823 XXXXX', time: '16:31', scam: true, senderFlag: false },
  { id: 'parcel', ch: 'email', from: 'alerts@indiapost-track.top', time: '09:12', scam: true, senderFlag: true },
  { id: 'collect', ch: 'wa', from: '+91 90314 XXXXX', time: '18:46', scam: true, senderFlag: false },
  { id: 'scholar', ch: 'sms', from: '+91 81460 XXXXX', time: '12:20', scam: true, senderFlag: true },
  { id: 'photos', ch: 'dm', from: '@unknown_user_4821', time: '22:47', scam: true, senderFlag: false },
  { id: 'arrest', ch: 'call', from: '+91 87991 XXXXX', time: '15:03', scam: true, senderFlag: true },
  { id: 'qr', ch: 'wa', from: '+91 73048 XXXXX', time: '19:25', scam: true, senderFlag: false, attach: 'qr' },
  { id: 'school', ch: 'sms', from: 'VM-SUNRSE', time: '08:15', scam: false, senderFlag: false },
  { id: 'otp_real', ch: 'sms', from: 'VM-SUNRSE', time: '17:02', scam: false, senderFlag: false },
  { id: 'bank', ch: 'sms', from: 'BP-BHRTBK', time: '09:30', scam: false, senderFlag: false },
  { id: 'bill', ch: 'sms', from: 'VK-ELCBRD', time: '10:05', scam: false, senderFlag: false },
  { id: 'result', ch: 'wa', from: '+91 98110 XXXXX', time: '12:00', scam: false, senderFlag: false }
];
