/* Fake News Detective: language-neutral facts about the 24 practice messages.
   The words of every message (12 languages) live in content.js under the same id.
   Everything here is FICTIONAL: invented towns (Nandpur, Rampura, Suryanagar), invented people, brands, apps,
   channels and web addresses. No real person or company is shown.

   lvl   jr = Classes 6-8, sr = Classes 9-12 (two sets of 12)
   kind  wa (WhatsApp forward) | sms | post (social media) | head (newspaper headline) | video | shot (TV-news screenshot) | notice (official notice screenshot)
   ans   rel (reliable) | fake (fake or misleading) | verify (verify first: could be true, nothing here proves it)
   flags red flags present: urgent fwd nosource caps domain oldphoto round miracle gift deepfake satire nowho emo money
   step  the one check that settles it: reverse (reverse image search) | official (official site / PIB Fact Check) | date (check the date) | url (read the URL) | bank (call the bank on the number on the card)
   fwd   show WhatsApp's "Forwarded many times" label; pic = emoji scene used as the picture / video thumbnail; dur = video length */
window.FND_MSGS = [
  /* ---------- Classes 6-8 ---------- */
  { id: 'holiday', lvl: 'jr', kind: 'wa', ans: 'verify', flags: ['caps', 'urgent', 'fwd', 'nosource'], step: 'official', from: '+91 98XXX XXXXX', time: '07:12', fwd: true },
  { id: 'exam_notice', lvl: 'jr', kind: 'notice', ans: 'rel', flags: [], step: 'official', from: '', time: '', ref: 'nandpurboard.gov.in' },
  { id: 'weather_post', lvl: 'jr', kind: 'post', ans: 'rel', flags: [], step: 'official', handle: '@SuryanagarMC', verified: true, time: '' },
  { id: 'library_head', lvl: 'jr', kind: 'head', ans: 'rel', flags: [], step: 'official' },
  { id: 'free_phone', lvl: 'jr', kind: 'wa', ans: 'fake', flags: ['gift', 'urgent', 'fwd', 'domain'], step: 'url', from: '+91 70XXX XXXXX', time: '21:40', fwd: true },
  { id: 'dengue_cure', lvl: 'jr', kind: 'wa', ans: 'fake', flags: ['miracle', 'true100', 'fwd', 'nowho'], step: 'official', from: '+91 94XXX XXXXX', time: '06:55', fwd: true },
  { id: 'shark_photo', lvl: 'jr', kind: 'post', ans: 'fake', flags: ['oldphoto', 'nosource', 'emo'], step: 'reverse', handle: '@rampura_updates', verified: false, pic: '🦈🌊🚗', time: '' },
  { id: 'recharge', lvl: 'jr', kind: 'wa', ans: 'fake', flags: ['gift', 'domain', 'urgent', 'round'], step: 'url', from: '+91 88XXX XXXXX', time: '13:05', fwd: true },
  { id: 'chat_paid', lvl: 'jr', kind: 'wa', ans: 'fake', flags: ['fwd', 'urgent', 'true100', 'nowho'], step: 'official', from: '+91 77XXX XXXXX', time: '22:18', fwd: true },
  { id: 'prize_video', lvl: 'jr', kind: 'video', ans: 'fake', flags: ['gift', 'money', 'round', 'emo'], step: 'official', pic: '🎤👦💰', dur: '1:12' },
  { id: 'exam_cancel', lvl: 'jr', kind: 'shot', ans: 'verify', flags: ['caps', 'nosource', 'nowho'], step: 'official' },
  { id: 'water_cut', lvl: 'jr', kind: 'wa', ans: 'verify', flags: ['nowho', 'nosource'], step: 'official', from: '+91 99XXX XXXXX', time: '18:30', fwd: false },
  /* ---------- Classes 9-12 ---------- */
  { id: 'bank_notice', lvl: 'sr', kind: 'sms', ans: 'rel', flags: [], step: 'bank', from: 'BK-KAVERI', time: '10:02' },
  { id: 'scholar_post', lvl: 'sr', kind: 'post', ans: 'rel', flags: [], step: 'official', handle: '@NandpurEdu', verified: true, ref: 'scholarships.nandpur.gov.in' },
  { id: 'science_head', lvl: 'sr', kind: 'head', ans: 'rel', flags: [], step: 'official' },
  { id: 'deepfake', lvl: 'sr', kind: 'video', ans: 'fake', flags: ['deepfake', 'gift', 'domain', 'nowho'], step: 'reverse', pic: '🎬🧑‍💼💊', dur: '0:38' },
  { id: 'satire', lvl: 'sr', kind: 'head', ans: 'fake', flags: ['satire', 'nosource'], step: 'url' },
  { id: 'bridge_photo', lvl: 'sr', kind: 'post', ans: 'fake', flags: ['oldphoto', 'urgent', 'emo'], step: 'reverse', handle: '@angry_citizen_21', verified: false, pic: '🌉🚧💥' },
  { id: 'job_offer', lvl: 'sr', kind: 'wa', ans: 'fake', flags: ['money', 'urgent', 'domain', 'round'], step: 'url', from: '+91 97XXX XXXXX', time: '11:47', fwd: true },
  { id: 'bank_block', lvl: 'sr', kind: 'sms', ans: 'fake', flags: ['urgent', 'domain', 'money'], step: 'bank', from: '+91 63XXX XXXXX', time: '15:21' },
  { id: 'banana_cure', lvl: 'sr', kind: 'post', ans: 'fake', flags: ['miracle', 'true100', 'nowho', 'round'], step: 'official', handle: '@healthy_desi_life', verified: false, pic: '🍌🍌🩺' },
  { id: 'quote_card', lvl: 'sr', kind: 'post', ans: 'verify', flags: ['nowho', 'nosource'], step: 'official', handle: '@rampura_politics_live', verified: false, pic: '🗣️' },
  { id: 'literacy_post', lvl: 'sr', kind: 'post', ans: 'verify', flags: ['nosource', 'round', 'emo'], step: 'official', handle: '@proud_nandpuri', verified: false },
  { id: 'metro_shot', lvl: 'sr', kind: 'shot', ans: 'verify', flags: ['nosource'], step: 'date' }
];
/* the 8 messages of each level's printable worksheet (2 reliable, 4 fake, 2 verify first) */
window.FND_WS = {
  jr: ['holiday', 'exam_notice', 'free_phone', 'dengue_cure', 'shark_photo', 'chat_paid', 'water_cut', 'weather_post'],
  sr: ['bank_notice', 'scholar_post', 'deepfake', 'satire', 'bridge_photo', 'bank_block', 'quote_card', 'metro_shot']
};
window.FND_FLAGS = ['urgent', 'fwd', 'nosource', 'caps', 'domain', 'oldphoto', 'round', 'miracle', 'gift', 'deepfake', 'satire', 'nowho', 'emo', 'money'];
window.FND_STEPS = ['reverse', 'official', 'date', 'url', 'bank'];
