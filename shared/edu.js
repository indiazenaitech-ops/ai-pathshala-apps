/* AI Pathshala Apps — shared runtime (i18n + app shell + helpers).
 * Classic script (no modules) so apps also work when opened from a downloaded
 * folder via file://.  Load order in every app:
 *   <link rel="stylesheet" href="../../shared/edu.css">
 *   ... <main id="app"></main> ...
 *   <script src="../../shared/edu.js"></script>
 *   <script src="strings.js"></script>      (defines window.APP_STRINGS)
 *   <script src="app.js"></script>          (calls EDU.init({...}))
 */
(function () {
  'use strict';

  var LANGS = [
    { code: 'en', name: 'English', native: 'English', tag: 'en-IN', font: null, dir: 'ltr' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', tag: 'hi-IN', font: 'Noto Sans Devanagari', dir: 'ltr' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', tag: 'bn-IN', font: 'Noto Sans Bengali', dir: 'ltr' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', tag: 'mr-IN', font: 'Noto Sans Devanagari', dir: 'ltr' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', tag: 'gu-IN', font: 'Noto Sans Gujarati', dir: 'ltr' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', tag: 'pa-IN', font: 'Noto Sans Gurmukhi', dir: 'ltr' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', tag: 'or-IN', font: 'Noto Sans Oriya', dir: 'ltr' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', tag: 'ta-IN', font: 'Noto Sans Tamil', dir: 'ltr' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', tag: 'te-IN', font: 'Noto Sans Telugu', dir: 'ltr' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', tag: 'kn-IN', font: 'Noto Sans Kannada', dir: 'ltr' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', tag: 'ml-IN', font: 'Noto Sans Malayalam', dir: 'ltr' },
    { code: 'ur', name: 'Urdu', native: 'اردو', tag: 'ur-IN', font: 'Noto Nastaliq Urdu', dir: 'rtl' }
  ];
  var CODES = LANGS.map(function (l) { return l.code; });
  var YOUTUBE = 'https://www.youtube.com/@Apni_Pathshala_AI';
  /* Site-wide settings: ONE place for the domain, links and the contact address.
     CONTACT_EMAIL is joined at run time so the address never sits in plain text in any page or file. */
  var CONTACT_EMAIL = ['support', 'apnipathshala.ai'].join('@');
  var SITE = {
    url: 'https://apnipathshala.ai/',
    youtube: YOUTUBE,
    subscribe: YOUTUBE + '?sub_confirmation=1',
    repo: 'https://github.com/indiazenaitech-ops/ai-pathshala-apps',
    zip: 'https://github.com/indiazenaitech-ops/ai-pathshala-apps/archive/refs/heads/main.zip',
    contact: CONTACT_EMAIL
  };
  var WA_ICON = '<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.2a9.8 9.8 0 0 0-8.5 14.7L2.2 21.8l5-1.3A9.8 9.8 0 1 0 12 2.2zm0 1.8a8 8 0 1 1-4.1 14.9l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4z"/><path fill="currentColor" d="M8.7 7.3c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.2s1 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3l-1.9-.9c-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2z"/></svg>';

  /* Strings used by the shell and shared by every app (apps may override any key). */
  var COMMON = {
    en: { library: 'All apps', brand: 'AI Pathshala', language: 'Language', theme: 'Light / dark theme', print: 'Print', reset: 'Reset', start: 'Start', stop: 'Stop', pause: 'Pause', resume: 'Resume', next: 'Next', previous: 'Previous', save: 'Save', download: 'Download', upload: 'Upload', copy: 'Copy', copied: 'Copied!', clear: 'Clear', add: 'Add', delete: 'Delete', edit: 'Edit', close: 'Close', cancel: 'Cancel', done: 'Done', yes: 'Yes', no: 'No', help: 'How to use', score: 'Score', correct: 'Correct!', wrong: 'Not quite', try_again: 'Try again', share: 'Share', fullscreen: 'Full screen', import: 'Import', export: 'Export', loading: 'Loading…', settings: 'Settings', search: 'Search', example: 'Example', result: 'Result', total: 'Total', footer_free: "Free for everyone · No sign-up for students · No ads · Your data stays on your device (except the optional Live Quiz)", footer_channel: 'Learn AI in Hindi on YouTube', saved_local: 'Saved only on this device', needs_internet: 'Needs internet the first time', needs_camera: 'Uses the camera', needs_mic: 'Uses the microphone', no_voice: 'No voice for this language on this device. Try Chrome on Android, or add a voice in your device settings.', confirm_reset: 'Clear everything and start again?', offline_ready: 'Ready to work offline', shell_wa: "Share on WhatsApp", shell_wa_msg: "{title}: a free learning app for school students. No sign-up, no ads, works in 12 Indian languages. Open it here: {url}", shell_schools: "For schools & principals", shell_privacy: "Privacy", shell_business: "For business & teams", shell_wa_tool: "{title}: a free tool from AI Pathshala. No sign-up, no ads, your files stay on your device, in 12 Indian languages. Open it here: {url}", shell_cta: "New free apps every week: get updates", shell_cta_hide: "Hide this tip", nav_schools: "Schools", nav_business: "Business", nav_guides: "Guides", nav_videos: "Videos", nav_about: "About us", nav_contact: "Contact", shell_terms: "Terms", foot_tagline: "Free AI tools and AI lessons for everyone, in 12 Indian languages.", foot_col_explore: "Explore", foot_col_follow: "Learn & follow", foot_source: "Source code (GitHub)", foot_zip: "Download all apps (ZIP)" },
    hi: { library: 'सभी ऐप्स', brand: 'AI की पाठशाला', language: 'भाषा', theme: 'लाइट / डार्क थीम', print: 'प्रिंट करें', reset: 'रीसेट', start: 'शुरू करें', stop: 'रोकें', pause: 'विराम', resume: 'फिर से शुरू', next: 'आगे', previous: 'पीछे', save: 'सेव करें', download: 'डाउनलोड', upload: 'अपलोड', copy: 'कॉपी करें', copied: 'कॉपी हो गया!', clear: 'साफ़ करें', add: 'जोड़ें', delete: 'हटाएँ', edit: 'बदलें', close: 'बंद करें', cancel: 'रद्द करें', done: 'हो गया', yes: 'हाँ', no: 'नहीं', help: 'कैसे इस्तेमाल करें', score: 'अंक', correct: 'सही!', wrong: 'थोड़ा सा चूक गए', try_again: 'फिर कोशिश करें', share: 'शेयर करें', fullscreen: 'पूरी स्क्रीन', import: 'इम्पोर्ट', export: 'एक्सपोर्ट', loading: 'लोड हो रहा है…', settings: 'सेटिंग्स', search: 'खोजें', example: 'उदाहरण', result: 'परिणाम', total: 'कुल', footer_free: "सबके लिए मुफ़्त · विद्यार्थियों के लिए कोई साइन-अप नहीं · कोई विज्ञापन नहीं · आपका डेटा आपके डिवाइस पर ही रहता है (वैकल्पिक लाइव क्विज़ को छोड़कर)", footer_channel: 'YouTube पर हिंदी में AI सीखें', saved_local: 'सिर्फ़ इसी डिवाइस पर सेव होता है', needs_internet: 'पहली बार खोलने पर इंटरनेट चाहिए', needs_camera: 'कैमरा इस्तेमाल करता है', needs_mic: 'माइक्रोफ़ोन इस्तेमाल करता है', no_voice: 'इस डिवाइस पर इस भाषा की आवाज़ नहीं है। Android पर Chrome आज़माएँ या डिवाइस सेटिंग में आवाज़ जोड़ें।', confirm_reset: 'सब कुछ मिटाकर फिर से शुरू करें?', offline_ready: 'ऑफ़लाइन चलने के लिए तैयार', shell_wa: "WhatsApp पर शेयर करें", shell_wa_msg: "{title}: स्कूल के विद्यार्थियों के लिए मुफ़्त ऐप। न साइन-अप, न विज्ञापन, 12 भारतीय भाषाओं में। यहाँ खोलें: {url}", shell_schools: "स्कूलों और प्रिंसिपलों के लिए", shell_privacy: "गोपनीयता", shell_business: "बिज़नेस और टीमों के लिए", shell_wa_tool: "{title}: AI की पाठशाला का मुफ़्त टूल। न साइन-अप, न विज्ञापन, आपकी फ़ाइलें आपके डिवाइस पर ही रहती हैं, 12 भारतीय भाषाओं में। यहाँ खोलें: {url}", shell_cta: "हर हफ़्ते नए मुफ़्त ऐप्स: अपडेट पाएँ", shell_cta_hide: "यह सुझाव छिपाएँ", nav_schools: "स्कूल", nav_business: "बिज़नेस", nav_guides: "गाइड", nav_videos: "वीडियो", nav_about: "हमारे बारे में", nav_contact: "संपर्क", shell_terms: "शर्तें", foot_tagline: "सबके लिए मुफ़्त AI टूल और AI की पढ़ाई, 12 भारतीय भाषाओं में।", foot_col_explore: "देखें", foot_col_follow: "सीखें और जुड़ें", foot_source: "सोर्स कोड (GitHub)", foot_zip: "सभी ऐप्स डाउनलोड करें (ZIP)" },
    bn: { library: 'সব অ্যাপ', brand: 'AI পাঠশালা', language: 'ভাষা', theme: 'লাইট / ডার্ক থিম', print: 'প্রিন্ট', reset: 'রিসেট', start: 'শুরু করুন', stop: 'থামান', pause: 'বিরতি', resume: 'আবার শুরু', next: 'পরের', previous: 'আগের', save: 'সেভ করুন', download: 'ডাউনলোড', upload: 'আপলোড', copy: 'কপি করুন', copied: 'কপি হয়েছে!', clear: 'মুছুন', add: 'যোগ করুন', delete: 'মুছে ফেলুন', edit: 'সম্পাদনা', close: 'বন্ধ করুন', cancel: 'বাতিল', done: 'সম্পন্ন', yes: 'হ্যাঁ', no: 'না', help: 'কীভাবে ব্যবহার করবেন', score: 'স্কোর', correct: 'সঠিক!', wrong: 'একটু ভুল হয়েছে', try_again: 'আবার চেষ্টা করুন', share: 'শেয়ার করুন', fullscreen: 'পূর্ণ পর্দা', import: 'ইমপোর্ট', export: 'এক্সপোর্ট', loading: 'লোড হচ্ছে…', settings: 'সেটিংস', search: 'খুঁজুন', example: 'উদাহরণ', result: 'ফলাফল', total: 'মোট', footer_free: "সবার জন্য বিনামূল্যে · শিক্ষার্থীদের সাইন-আপ লাগে না · বিজ্ঞাপন নেই · আপনার ডেটা আপনার ডিভাইসেই থাকে (ঐচ্ছিক লাইভ কুইজ ছাড়া)", footer_channel: 'YouTube-এ হিন্দিতে AI শিখুন', saved_local: 'শুধু এই ডিভাইসেই সেভ হয়', needs_internet: 'প্রথমবার খুলতে ইন্টারনেট লাগে', needs_camera: 'ক্যামেরা ব্যবহার করে', needs_mic: 'মাইক্রোফোন ব্যবহার করে', no_voice: 'এই ডিভাইসে এই ভাষার কণ্ঠস্বর নেই। Android-এ Chrome ব্যবহার করে দেখুন বা সেটিংসে ভয়েস যোগ করুন।', confirm_reset: 'সব মুছে আবার শুরু করবেন?', offline_ready: 'অফলাইনে চলার জন্য প্রস্তুত', shell_wa: "WhatsApp-এ শেয়ার করুন", shell_wa_msg: "{title}: স্কুলের শিক্ষার্থীদের জন্য বিনামূল্যের অ্যাপ। সাইন-আপ নেই, বিজ্ঞাপন নেই, 12টি ভারতীয় ভাষায় চলে। এখানে খুলুন: {url}", shell_schools: "স্কুল ও প্রধান শিক্ষকদের জন্য", shell_privacy: "গোপনীয়তা", shell_business: "ব্যবসা ও টিমের জন্য", shell_wa_tool: "{title}: AI পাঠশালার বিনামূল্যের টুল। সাইন-আপ নেই, বিজ্ঞাপন নেই, আপনার ফাইল আপনার ডিভাইসেই থাকে, 12টি ভারতীয় ভাষায়। এখানে খুলুন: {url}", shell_cta: "প্রতি সপ্তাহে নতুন বিনামূল্যের অ্যাপ: আপডেট পান", shell_cta_hide: "এই বার্তাটি লুকান", nav_schools: "স্কুল", nav_business: "ব্যবসা", nav_guides: "গাইড", nav_videos: "ভিডিও", nav_about: "আমাদের কথা", nav_contact: "যোগাযোগ", shell_terms: "শর্তাবলি", foot_tagline: "সবার জন্য বিনামূল্যে AI টুল আর AI শেখা, 12টি ভারতীয় ভাষায়।", foot_col_explore: "ঘুরে দেখুন", foot_col_follow: "শিখুন ও যুক্ত থাকুন", foot_source: "সোর্স কোড (GitHub)", foot_zip: "সব অ্যাপ ডাউনলোড করুন (ZIP)" },
    mr: { library: 'सर्व ॲप्स', brand: 'AI की पाठशाला', language: 'भाषा', theme: 'लाइट / डार्क थीम', print: 'प्रिंट करा', reset: 'रीसेट', start: 'सुरू करा', stop: 'थांबवा', pause: 'विराम', resume: 'पुन्हा सुरू करा', next: 'पुढे', previous: 'मागे', save: 'सेव्ह करा', download: 'डाउनलोड', upload: 'अपलोड', copy: 'कॉपी करा', copied: 'कॉपी झाले!', clear: 'साफ करा', add: 'जोडा', delete: 'काढून टाका', edit: 'बदला', close: 'बंद करा', cancel: 'रद्द करा', done: 'झाले', yes: 'हो', no: 'नाही', help: 'कसे वापरायचे', score: 'गुण', correct: 'बरोबर!', wrong: 'थोडक्यात चुकले', try_again: 'पुन्हा प्रयत्न करा', share: 'शेअर करा', fullscreen: 'पूर्ण स्क्रीन', import: 'इम्पोर्ट', export: 'एक्सपोर्ट', loading: 'लोड होत आहे…', settings: 'सेटिंग्ज', search: 'शोधा', example: 'उदाहरण', result: 'निकाल', total: 'एकूण', footer_free: "सर्वांसाठी मोफत · विद्यार्थ्यांना साइन-अप नाही · जाहिराती नाहीत · तुमचा डेटा तुमच्याच डिव्हाइसवर राहतो (ऐच्छिक लाइव्ह क्विझ सोडून)", footer_channel: 'YouTube वर हिंदीत AI शिका', saved_local: 'फक्त याच डिव्हाइसवर सेव्ह होते', needs_internet: 'पहिल्यांदा उघडताना इंटरनेट लागते', needs_camera: 'कॅमेरा वापरते', needs_mic: 'मायक्रोफोन वापरते', no_voice: 'या डिव्हाइसवर या भाषेचा आवाज नाही. Android वर Chrome वापरून पाहा किंवा सेटिंग्जमध्ये आवाज जोडा.', confirm_reset: 'सर्व काही पुसून पुन्हा सुरू करायचे?', offline_ready: 'ऑफलाइन वापरासाठी तयार', shell_wa: "WhatsApp वर शेअर करा", shell_wa_msg: "{title}: शाळेतील विद्यार्थ्यांसाठी मोफत ॲप. साइन-अप नाही, जाहिराती नाहीत, 12 भारतीय भाषांमध्ये चालते. इथे उघडा: {url}", shell_schools: "शाळा आणि मुख्याध्यापकांसाठी", shell_privacy: "गोपनीयता", shell_business: "व्यवसाय आणि टीमसाठी", shell_wa_tool: "{title}: AI की पाठशाला कडून मोफत साधन. साइन-अप नाही, जाहिराती नाहीत, तुमच्या फाइल्स तुमच्याच डिव्हाइसवर राहतात, 12 भारतीय भाषांमध्ये. इथे उघडा: {url}", shell_cta: "दर आठवड्याला नवीन मोफत ॲप्स: अपडेट मिळवा", shell_cta_hide: "हा संदेश लपवा", nav_schools: "शाळा", nav_business: "व्यवसाय", nav_guides: "मार्गदर्शक", nav_videos: "व्हिडिओ", nav_about: "आमच्याबद्दल", nav_contact: "संपर्क", shell_terms: "अटी", foot_tagline: "सर्वांसाठी मोफत AI टूल्स आणि AI शिक्षण, 12 भारतीय भाषांमध्ये.", foot_col_explore: "पाहा", foot_col_follow: "शिका आणि जोडलेले राहा", foot_source: "सोर्स कोड (GitHub)", foot_zip: "सर्व ॲप्स डाउनलोड करा (ZIP)" },
    gu: { library: 'બધી ઍપ્સ', brand: 'AI પાઠશાળા', language: 'ભાષા', theme: 'લાઇટ / ડાર્ક થીમ', print: 'પ્રિન્ટ કરો', reset: 'રીસેટ', start: 'શરૂ કરો', stop: 'રોકો', pause: 'વિરામ', resume: 'ફરી શરૂ કરો', next: 'આગળ', previous: 'પાછળ', save: 'સેવ કરો', download: 'ડાઉનલોડ', upload: 'અપલોડ', copy: 'કૉપિ કરો', copied: 'કૉપિ થયું!', clear: 'સાફ કરો', add: 'ઉમેરો', delete: 'કાઢી નાખો', edit: 'ફેરફાર કરો', close: 'બંધ કરો', cancel: 'રદ કરો', done: 'થઈ ગયું', yes: 'હા', no: 'ના', help: 'કેવી રીતે વાપરવું', score: 'સ્કોર', correct: 'સાચું!', wrong: 'થોડું ચૂકી ગયા', try_again: 'ફરી પ્રયાસ કરો', share: 'શેર કરો', fullscreen: 'પૂર્ણ સ્ક્રીન', import: 'ઇમ્પોર્ટ', export: 'એક્સપોર્ટ', loading: 'લોડ થઈ રહ્યું છે…', settings: 'સેટિંગ્સ', search: 'શોધો', example: 'ઉદાહરણ', result: 'પરિણામ', total: 'કુલ', footer_free: "સૌના માટે મફત · વિદ્યાર્થીઓ માટે સાઇન-અપ નહીં · જાહેરાત નહીં · તમારો ડેટા તમારા ડિવાઇસ પર જ રહે છે (વૈકલ્પિક લાઇવ ક્વિઝ સિવાય)", footer_channel: 'YouTube પર હિન્દીમાં AI શીખો', saved_local: 'ફક્ત આ ડિવાઇસ પર જ સેવ થાય છે', needs_internet: 'પહેલી વાર ખોલવા ઇન્ટરનેટ જોઈએ', needs_camera: 'કૅમેરા વાપરે છે', needs_mic: 'માઇક્રોફોન વાપરે છે', no_voice: 'આ ડિવાઇસ પર આ ભાષાનો અવાજ નથી. Android પર Chrome અજમાવો અથવા સેટિંગ્સમાં અવાજ ઉમેરો.', confirm_reset: 'બધું ભૂંસીને ફરી શરૂ કરવું છે?', offline_ready: 'ઑફલાઇન ચલાવવા તૈયાર', shell_wa: "WhatsApp પર શેર કરો", shell_wa_msg: "{title}: શાળાના વિદ્યાર્થીઓ માટે મફત ઍપ. સાઇન-અપ નહીં, જાહેરાત નહીં, 12 ભારતીય ભાષાઓમાં ચાલે છે. અહીં ખોલો: {url}", shell_schools: "શાળાઓ અને આચાર્યો માટે", shell_privacy: "ગોપનીયતા", shell_business: "વ્યવસાય અને ટીમો માટે", shell_wa_tool: "{title}: AI પાઠશાળાનું મફત ટૂલ. સાઇન-અપ નહીં, જાહેરાત નહીં, તમારી ફાઇલો તમારા ડિવાઇસ પર જ રહે છે, 12 ભારતીય ભાષાઓમાં. અહીં ખોલો: {url}", shell_cta: "દર અઠવાડિયે નવી મફત ઍપ્સ: અપડેટ મેળવો", shell_cta_hide: "આ સંદેશ છુપાવો", nav_schools: "શાળાઓ", nav_business: "વ્યવસાય", nav_guides: "માર્ગદર્શિકા", nav_videos: "વીડિયો", nav_about: "અમારા વિશે", nav_contact: "સંપર્ક", shell_terms: "શરતો", foot_tagline: "સૌ માટે મફત AI ટૂલ્સ અને AI શિક્ષણ, 12 ભારતીય ભાષાઓમાં.", foot_col_explore: "જુઓ", foot_col_follow: "શીખો અને જોડાઓ", foot_source: "સોર્સ કોડ (GitHub)", foot_zip: "બધી ઍપ્સ ડાઉનલોડ કરો (ZIP)" },
    pa: { library: 'ਸਾਰੀਆਂ ਐਪਾਂ', brand: 'AI ਪਾਠਸ਼ਾਲਾ', language: 'ਭਾਸ਼ਾ', theme: 'ਲਾਈਟ / ਡਾਰਕ ਥੀਮ', print: 'ਪ੍ਰਿੰਟ ਕਰੋ', reset: 'ਰੀਸੈੱਟ', start: 'ਸ਼ੁਰੂ ਕਰੋ', stop: 'ਰੋਕੋ', pause: 'ਵਿਰਾਮ', resume: 'ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ', next: 'ਅੱਗੇ', previous: 'ਪਿੱਛੇ', save: 'ਸੇਵ ਕਰੋ', download: 'ਡਾਊਨਲੋਡ', upload: 'ਅੱਪਲੋਡ', copy: 'ਕਾਪੀ ਕਰੋ', copied: 'ਕਾਪੀ ਹੋ ਗਿਆ!', clear: 'ਸਾਫ਼ ਕਰੋ', add: 'ਜੋੜੋ', delete: 'ਮਿਟਾਓ', edit: 'ਬਦਲੋ', close: 'ਬੰਦ ਕਰੋ', cancel: 'ਰੱਦ ਕਰੋ', done: 'ਹੋ ਗਿਆ', yes: 'ਹਾਂ', no: 'ਨਹੀਂ', help: 'ਕਿਵੇਂ ਵਰਤਣਾ ਹੈ', score: 'ਅੰਕ', correct: 'ਸਹੀ!', wrong: 'ਥੋੜ੍ਹਾ ਜਿਹਾ ਖੁੰਝ ਗਏ', try_again: 'ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ', share: 'ਸਾਂਝਾ ਕਰੋ', fullscreen: 'ਪੂਰੀ ਸਕ੍ਰੀਨ', import: 'ਇੰਪੋਰਟ', export: 'ਐਕਸਪੋਰਟ', loading: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…', settings: 'ਸੈਟਿੰਗਾਂ', search: 'ਖੋਜੋ', example: 'ਉਦਾਹਰਨ', result: 'ਨਤੀਜਾ', total: 'ਕੁੱਲ', footer_free: "ਸਭ ਲਈ ਮੁਫ਼ਤ · ਵਿਦਿਆਰਥੀਆਂ ਲਈ ਕੋਈ ਸਾਈਨ-ਅੱਪ ਨਹੀਂ · ਕੋਈ ਇਸ਼ਤਿਹਾਰ ਨਹੀਂ · ਤੁਹਾਡਾ ਡਾਟਾ ਤੁਹਾਡੇ ਡਿਵਾਈਸ 'ਤੇ ਹੀ ਰਹਿੰਦਾ ਹੈ (ਚੋਣਵੇਂ ਲਾਈਵ ਕੁਇਜ਼ ਤੋਂ ਸਿਵਾ)", footer_channel: 'YouTube \'ਤੇ ਹਿੰਦੀ ਵਿੱਚ AI ਸਿੱਖੋ', saved_local: 'ਸਿਰਫ਼ ਇਸੇ ਡਿਵਾਈਸ \'ਤੇ ਸੇਵ ਹੁੰਦਾ ਹੈ', needs_internet: 'ਪਹਿਲੀ ਵਾਰ ਖੋਲ੍ਹਣ ਲਈ ਇੰਟਰਨੈੱਟ ਚਾਹੀਦਾ ਹੈ', needs_camera: 'ਕੈਮਰਾ ਵਰਤਦੀ ਹੈ', needs_mic: 'ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਵਰਤਦੀ ਹੈ', no_voice: 'ਇਸ ਡਿਵਾਈਸ \'ਤੇ ਇਸ ਭਾਸ਼ਾ ਦੀ ਆਵਾਜ਼ ਨਹੀਂ ਹੈ। Android \'ਤੇ Chrome ਵਰਤ ਕੇ ਦੇਖੋ ਜਾਂ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਆਵਾਜ਼ ਜੋੜੋ।', confirm_reset: 'ਸਭ ਕੁਝ ਮਿਟਾ ਕੇ ਮੁੜ ਸ਼ੁਰੂ ਕਰੀਏ?', offline_ready: 'ਆਫ਼ਲਾਈਨ ਚੱਲਣ ਲਈ ਤਿਆਰ', shell_wa: "WhatsApp 'ਤੇ ਸਾਂਝਾ ਕਰੋ", shell_wa_msg: "{title}: ਸਕੂਲ ਦੇ ਵਿਦਿਆਰਥੀਆਂ ਲਈ ਮੁਫ਼ਤ ਐਪ। ਨਾ ਸਾਈਨ-ਅੱਪ, ਨਾ ਇਸ਼ਤਿਹਾਰ, 12 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਚੱਲਦੀ ਹੈ। ਇੱਥੇ ਖੋਲ੍ਹੋ: {url}", shell_schools: "ਸਕੂਲਾਂ ਅਤੇ ਪ੍ਰਿੰਸੀਪਲਾਂ ਲਈ", shell_privacy: "ਪਰਦੇਦਾਰੀ", shell_business: "ਕਾਰੋਬਾਰ ਅਤੇ ਟੀਮਾਂ ਲਈ", shell_wa_tool: "{title}: AI ਪਾਠਸ਼ਾਲਾ ਦਾ ਮੁਫ਼ਤ ਟੂਲ। ਨਾ ਸਾਈਨ-ਅੱਪ, ਨਾ ਇਸ਼ਤਿਹਾਰ, ਤੁਹਾਡੀਆਂ ਫ਼ਾਈਲਾਂ ਤੁਹਾਡੇ ਡਿਵਾਈਸ 'ਤੇ ਹੀ ਰਹਿੰਦੀਆਂ ਹਨ, 12 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ। ਇੱਥੇ ਖੋਲ੍ਹੋ: {url}", shell_cta: "ਹਰ ਹਫ਼ਤੇ ਨਵੀਆਂ ਮੁਫ਼ਤ ਐਪਾਂ: ਅੱਪਡੇਟ ਲਓ", shell_cta_hide: "ਇਹ ਸੁਨੇਹਾ ਲੁਕਾਓ", nav_schools: "ਸਕੂਲ", nav_business: "ਕਾਰੋਬਾਰ", nav_guides: "ਗਾਈਡ", nav_videos: "ਵੀਡੀਓ", nav_about: "ਸਾਡੇ ਬਾਰੇ", nav_contact: "ਸੰਪਰਕ", shell_terms: "ਸ਼ਰਤਾਂ", foot_tagline: "ਸਭ ਲਈ ਮੁਫ਼ਤ AI ਟੂਲ ਅਤੇ AI ਦੀ ਪੜ੍ਹਾਈ, 12 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ।", foot_col_explore: "ਵੇਖੋ", foot_col_follow: "ਸਿੱਖੋ ਅਤੇ ਜੁੜੋ", foot_source: "ਸੋਰਸ ਕੋਡ (GitHub)", foot_zip: "ਸਾਰੀਆਂ ਐਪਾਂ ਡਾਊਨਲੋਡ ਕਰੋ (ZIP)" },
    or: { library: 'ସମସ୍ତ ଆପ୍', brand: 'AI ପାଠଶାଳା', language: 'ଭାଷା', theme: 'ଲାଇଟ୍ / ଡାର୍କ ଥିମ୍', print: 'ପ୍ରିଣ୍ଟ କରନ୍ତୁ', reset: 'ରିସେଟ୍', start: 'ଆରମ୍ଭ କରନ୍ତୁ', stop: 'ବନ୍ଦ କରନ୍ତୁ', pause: 'ବିରତି', resume: 'ପୁଣି ଆରମ୍ଭ', next: 'ପରବର୍ତ୍ତୀ', previous: 'ପୂର୍ବବର୍ତ୍ତୀ', save: 'ସେଭ୍ କରନ୍ତୁ', download: 'ଡାଉନଲୋଡ୍', upload: 'ଅପଲୋଡ୍', copy: 'କପି କରନ୍ତୁ', copied: 'କପି ହେଲା!', clear: 'ସଫା କରନ୍ତୁ', add: 'ଯୋଡ଼ନ୍ତୁ', delete: 'ବିଲୋପ କରନ୍ତୁ', edit: 'ସମ୍ପାଦନ', close: 'ବନ୍ଦ କରନ୍ତୁ', cancel: 'ବାତିଲ୍', done: 'ହୋଇଗଲା', yes: 'ହଁ', no: 'ନା', help: 'କିପରି ବ୍ୟବହାର କରିବେ', score: 'ସ୍କୋର୍', correct: 'ଠିକ୍!', wrong: 'ଟିକିଏ ଭୁଲ୍ ହେଲା', try_again: 'ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ', share: 'ସେୟାର୍ କରନ୍ତୁ', fullscreen: 'ପୂର୍ଣ୍ଣ ସ୍କ୍ରିନ୍', import: 'ଇମ୍ପୋର୍ଟ', export: 'ଏକ୍ସପୋର୍ଟ', loading: 'ଲୋଡ୍ ହେଉଛି…', settings: 'ସେଟିଂସ୍', search: 'ଖୋଜନ୍ତୁ', example: 'ଉଦାହରଣ', result: 'ଫଳାଫଳ', total: 'ମୋଟ', footer_free: "ସମସ୍ତଙ୍କ ପାଇଁ ମାଗଣା · ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ ସାଇନ୍-ଅପ୍ ନାହିଁ · ବିଜ୍ଞାପନ ନାହିଁ · ଆପଣଙ୍କ ଡାଟା ଆପଣଙ୍କ ଡିଭାଇସରେ ହିଁ ରହେ (ଇଚ୍ଛାଧୀନ ଲାଇଭ୍ କୁଇଜ୍ ଛଡ଼ା)", footer_channel: 'YouTube ରେ ହିନ୍ଦୀରେ AI ଶିଖନ୍ତୁ', saved_local: 'କେବଳ ଏହି ଡିଭାଇସରେ ସେଭ୍ ହୁଏ', needs_internet: 'ପ୍ରଥମ ଥର ଖୋଲିବାକୁ ଇଣ୍ଟରନେଟ୍ ଦରକାର', needs_camera: 'କ୍ୟାମେରା ବ୍ୟବହାର କରେ', needs_mic: 'ମାଇକ୍ରୋଫୋନ୍ ବ୍ୟବହାର କରେ', no_voice: 'ଏହି ଡିଭାଇସରେ ଏହି ଭାଷାର ସ୍ୱର ନାହିଁ। Android ରେ Chrome ଚେଷ୍ଟା କରନ୍ତୁ କିମ୍ବା ସେଟିଂସରେ ସ୍ୱର ଯୋଡ଼ନ୍ତୁ।', confirm_reset: 'ସବୁକିଛି ଲିଭାଇ ପୁଣି ଆରମ୍ଭ କରିବେ?', offline_ready: 'ଅଫଲାଇନ୍ ଚାଲିବାକୁ ପ୍ରସ୍ତୁତ', shell_wa: "WhatsApp ରେ ସେୟାର୍ କରନ୍ତୁ", shell_wa_msg: "{title}: ବିଦ୍ୟାଳୟ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ ମାଗଣା ଆପ୍। ସାଇନ୍-ଅପ୍ ନାହିଁ, ବିଜ୍ଞାପନ ନାହିଁ, 12ଟି ଭାରତୀୟ ଭାଷାରେ ଚାଲେ। ଏଠାରେ ଖୋଲନ୍ତୁ: {url}", shell_schools: "ବିଦ୍ୟାଳୟ ଓ ପ୍ରଧାନ ଶିକ୍ଷକଙ୍କ ପାଇଁ", shell_privacy: "ଗୋପନୀୟତା", shell_business: "ବ୍ୟବସାୟ ଓ ଟିମ୍ ପାଇଁ", shell_wa_tool: "{title}: AI ପାଠଶାଳାର ମାଗଣା ଟୁଲ୍। ସାଇନ୍-ଅପ୍ ନାହିଁ, ବିଜ୍ଞାପନ ନାହିଁ, ଆପଣଙ୍କ ଫାଇଲ୍ ଆପଣଙ୍କ ଡିଭାଇସରେ ହିଁ ରହେ, 12ଟି ଭାରତୀୟ ଭାଷାରେ। ଏଠାରେ ଖୋଲନ୍ତୁ: {url}", shell_cta: "ପ୍ରତି ସପ୍ତାହରେ ନୂଆ ମାଗଣା ଆପ୍: ଅପଡେଟ୍ ପାଆନ୍ତୁ", shell_cta_hide: "ଏହି ବାର୍ତ୍ତା ଲୁଚାନ୍ତୁ", nav_schools: "ବିଦ୍ୟାଳୟ", nav_business: "ବ୍ୟବସାୟ", nav_guides: "ଗାଇଡ୍", nav_videos: "ଭିଡିଓ", nav_about: "ଆମ ବିଷୟରେ", nav_contact: "ଯୋଗାଯୋଗ", shell_terms: "ସର୍ତ୍ତାବଳୀ", foot_tagline: "ସମସ୍ତଙ୍କ ପାଇଁ ମାଗଣା AI ଟୁଲ୍ ଓ AI ଶିକ୍ଷା, 12ଟି ଭାରତୀୟ ଭାଷାରେ।", foot_col_explore: "ଦେଖନ୍ତୁ", foot_col_follow: "ଶିଖନ୍ତୁ ଓ ଯୋଡ଼ି ହୁଅନ୍ତୁ", foot_source: "ସୋର୍ସ କୋଡ୍ (GitHub)", foot_zip: "ସମସ୍ତ ଆପ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ (ZIP)" },
    ta: { library: 'அனைத்து செயலிகள்', brand: 'AI பாடசாலை', language: 'மொழி', theme: 'வெளிர் / இருண்ட தீம்', print: 'அச்சிடு', reset: 'மீட்டமை', start: 'தொடங்கு', stop: 'நிறுத்து', pause: 'இடைநிறுத்து', resume: 'தொடர்', next: 'அடுத்து', previous: 'முந்தைய', save: 'சேமி', download: 'பதிவிறக்கு', upload: 'பதிவேற்று', copy: 'நகலெடு', copied: 'நகலெடுக்கப்பட்டது!', clear: 'அழி', add: 'சேர்', delete: 'நீக்கு', edit: 'திருத்து', close: 'மூடு', cancel: 'ரத்து செய்', done: 'முடிந்தது', yes: 'ஆம்', no: 'இல்லை', help: 'பயன்படுத்துவது எப்படி', score: 'மதிப்பெண்', correct: 'சரி!', wrong: 'சற்று தவறு', try_again: 'மீண்டும் முயற்சி செய்', share: 'பகிர்', fullscreen: 'முழுத் திரை', import: 'இறக்குமதி', export: 'ஏற்றுமதி', loading: 'ஏற்றுகிறது…', settings: 'அமைப்புகள்', search: 'தேடு', example: 'எடுத்துக்காட்டு', result: 'முடிவு', total: 'மொத்தம்', footer_free: "அனைவருக்கும் இலவசம் · மாணவர்களுக்குப் பதிவு தேவையில்லை · விளம்பரங்கள் இல்லை · உங்கள் தரவு உங்கள் சாதனத்திலேயே இருக்கும் (விருப்ப நேரலை வினாடி வினா தவிர)", footer_channel: 'YouTube-இல் இந்தியில் AI கற்றுக்கொள்ளுங்கள்', saved_local: 'இந்த சாதனத்தில் மட்டுமே சேமிக்கப்படும்', needs_internet: 'முதல் முறை திறக்க இணையம் தேவை', needs_camera: 'கேமராவைப் பயன்படுத்துகிறது', needs_mic: 'மைக்ரோஃபோனைப் பயன்படுத்துகிறது', no_voice: 'இந்த சாதனத்தில் இந்த மொழிக்கான குரல் இல்லை. Android-இல் Chrome-ஐ முயற்சிக்கவும் அல்லது அமைப்புகளில் குரலைச் சேர்க்கவும்.', confirm_reset: 'அனைத்தையும் அழித்து மீண்டும் தொடங்கவா?', offline_ready: 'ஆஃப்லைனில் இயங்கத் தயார்', shell_wa: "WhatsApp-இல் பகிர்", shell_wa_msg: "{title}: பள்ளி மாணவர்களுக்கான இலவசச் செயலி. பதிவு இல்லை, விளம்பரம் இல்லை, 12 இந்திய மொழிகளில் இயங்கும். இங்கே திறக்கவும்: {url}", shell_schools: "பள்ளிகள் மற்றும் தலைமை ஆசிரியர்களுக்கு", shell_privacy: "தனியுரிமை", shell_business: "வணிகங்கள், குழுக்களுக்கு", shell_wa_tool: "{title}: AI பாடசாலையின் இலவசக் கருவி. பதிவு இல்லை, விளம்பரம் இல்லை, உங்கள் கோப்புகள் உங்கள் சாதனத்திலேயே இருக்கும், 12 இந்திய மொழிகளில். இங்கே திறக்கவும்: {url}", shell_cta: "ஒவ்வொரு வாரமும் புதிய இலவசச் செயலிகள்: தகவல் பெறுங்கள்", shell_cta_hide: "இந்தச் செய்தியை மறை", nav_schools: "பள்ளிகள்", nav_business: "வணிகம்", nav_guides: "வழிகாட்டிகள்", nav_videos: "வீடியோக்கள்", nav_about: "எங்களைப் பற்றி", nav_contact: "தொடர்பு", shell_terms: "விதிமுறைகள்", foot_tagline: "அனைவருக்கும் இலவச AI கருவிகளும் AI பாடங்களும், 12 இந்திய மொழிகளில்.", foot_col_explore: "ஆராயுங்கள்", foot_col_follow: "கற்றுக்கொள்ளுங்கள், இணைந்திருங்கள்", foot_source: "மூலக் குறியீடு (GitHub)", foot_zip: "அனைத்து செயலிகளையும் பதிவிறக்கு (ZIP)" },
    te: { library: 'అన్ని యాప్‌లు', brand: 'AI పాఠశాల', language: 'భాష', theme: 'లైట్ / డార్క్ థీమ్', print: 'ప్రింట్ చేయండి', reset: 'రీసెట్', start: 'ప్రారంభించండి', stop: 'ఆపండి', pause: 'విరామం', resume: 'కొనసాగించండి', next: 'తదుపరి', previous: 'మునుపటి', save: 'సేవ్ చేయండి', download: 'డౌన్‌లోడ్', upload: 'అప్‌లోడ్', copy: 'కాపీ చేయండి', copied: 'కాపీ అయింది!', clear: 'తుడిచివేయండి', add: 'జోడించండి', delete: 'తొలగించండి', edit: 'మార్చండి', close: 'మూసివేయండి', cancel: 'రద్దు చేయండి', done: 'పూర్తయింది', yes: 'అవును', no: 'కాదు', help: 'ఎలా ఉపయోగించాలి', score: 'స్కోరు', correct: 'సరైనది!', wrong: 'కొంచెం తప్పింది', try_again: 'మళ్ళీ ప్రయత్నించండి', share: 'షేర్ చేయండి', fullscreen: 'పూర్తి స్క్రీన్', import: 'ఇంపోర్ట్', export: 'ఎక్స్‌పోర్ట్', loading: 'లోడ్ అవుతోంది…', settings: 'సెట్టింగ్‌లు', search: 'వెతకండి', example: 'ఉదాహరణ', result: 'ఫలితం', total: 'మొత్తం', footer_free: "అందరికీ ఉచితం · విద్యార్థులకు సైన్-అప్ అవసరం లేదు · ప్రకటనలు లేవు · మీ డేటా మీ పరికరంలోనే ఉంటుంది (ఐచ్ఛిక లైవ్ క్విజ్ తప్ప)", footer_channel: 'YouTubeలో హిందీలో AI నేర్చుకోండి', saved_local: 'ఈ పరికరంలో మాత్రమే సేవ్ అవుతుంది', needs_internet: 'మొదటిసారి తెరవడానికి ఇంటర్నెట్ అవసరం', needs_camera: 'కెమెరాను ఉపయోగిస్తుంది', needs_mic: 'మైక్రోఫోన్‌ను ఉపయోగిస్తుంది', no_voice: 'ఈ పరికరంలో ఈ భాష వాయిస్ లేదు. Androidలో Chrome ప్రయత్నించండి లేదా సెట్టింగ్‌లలో వాయిస్ జోడించండి.', confirm_reset: 'అన్నీ తుడిచివేసి మళ్ళీ ప్రారంభించాలా?', offline_ready: 'ఆఫ్‌లైన్‌లో పని చేయడానికి సిద్ధం', shell_wa: "WhatsAppలో షేర్ చేయండి", shell_wa_msg: "{title}: పాఠశాల విద్యార్థుల కోసం ఉచిత యాప్. సైన్-అప్ లేదు, ప్రకటనలు లేవు, 12 భారతీయ భాషల్లో పనిచేస్తుంది. ఇక్కడ తెరవండి: {url}", shell_schools: "పాఠశాలలు, ప్రధానోపాధ్యాయుల కోసం", shell_privacy: "గోప్యత", shell_business: "వ్యాపారాలు, బృందాల కోసం", shell_wa_tool: "{title}: AI పాఠశాల ఉచిత టూల్. సైన్-అప్ లేదు, ప్రకటనలు లేవు, మీ ఫైళ్లు మీ పరికరంలోనే ఉంటాయి, 12 భారతీయ భాషల్లో. ఇక్కడ తెరవండి: {url}", shell_cta: "ప్రతి వారం కొత్త ఉచిత యాప్‌లు: అప్‌డేట్‌లు పొందండి", shell_cta_hide: "ఈ సందేశాన్ని దాచండి", nav_schools: "పాఠశాలలు", nav_business: "వ్యాపారం", nav_guides: "గైడ్‌లు", nav_videos: "వీడియోలు", nav_about: "మా గురించి", nav_contact: "సంప్రదించండి", shell_terms: "నిబంధనలు", foot_tagline: "అందరికీ ఉచిత AI టూల్స్, AI పాఠాలు, 12 భారతీయ భాషల్లో.", foot_col_explore: "చూడండి", foot_col_follow: "నేర్చుకోండి, కలిసి ఉండండి", foot_source: "సోర్స్ కోడ్ (GitHub)", foot_zip: "అన్ని యాప్‌లు డౌన్‌లోడ్ చేయండి (ZIP)" },
    kn: { library: 'ಎಲ್ಲಾ ಆ್ಯಪ್‌ಗಳು', brand: 'AI ಪಾಠಶಾಲೆ', language: 'ಭಾಷೆ', theme: 'ಲೈಟ್ / ಡಾರ್ಕ್ ಥೀಮ್', print: 'ಮುದ್ರಿಸಿ', reset: 'ಮರುಹೊಂದಿಸಿ', start: 'ಪ್ರಾರಂಭಿಸಿ', stop: 'ನಿಲ್ಲಿಸಿ', pause: 'ವಿರಾಮ', resume: 'ಮುಂದುವರಿಸಿ', next: 'ಮುಂದೆ', previous: 'ಹಿಂದೆ', save: 'ಉಳಿಸಿ', download: 'ಡೌನ್‌ಲೋಡ್', upload: 'ಅಪ್‌ಲೋಡ್', copy: 'ನಕಲಿಸಿ', copied: 'ನಕಲಿಸಲಾಗಿದೆ!', clear: 'ಅಳಿಸಿ', add: 'ಸೇರಿಸಿ', delete: 'ತೆಗೆದುಹಾಕಿ', edit: 'ಬದಲಿಸಿ', close: 'ಮುಚ್ಚಿ', cancel: 'ರದ್ದುಮಾಡಿ', done: 'ಮುಗಿಯಿತು', yes: 'ಹೌದು', no: 'ಇಲ್ಲ', help: 'ಬಳಸುವುದು ಹೇಗೆ', score: 'ಅಂಕ', correct: 'ಸರಿ!', wrong: 'ಸ್ವಲ್ಪ ತಪ್ಪಾಯಿತು', try_again: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ', share: 'ಹಂಚಿಕೊಳ್ಳಿ', fullscreen: 'ಪೂರ್ಣ ಪರದೆ', import: 'ಆಮದು', export: 'ರಫ್ತು', loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…', settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', search: 'ಹುಡುಕಿ', example: 'ಉದಾಹರಣೆ', result: 'ಫಲಿತಾಂಶ', total: 'ಒಟ್ಟು', footer_free: "ಎಲ್ಲರಿಗೂ ಉಚಿತ · ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಸೈನ್-ಅಪ್ ಇಲ್ಲ · ಜಾಹೀರಾತುಗಳಿಲ್ಲ · ನಿಮ್ಮ ಡೇಟಾ ನಿಮ್ಮ ಸಾಧನದಲ್ಲೇ ಇರುತ್ತದೆ (ಐಚ್ಛಿಕ ಲೈವ್ ಕ್ವಿಜ್ ಹೊರತುಪಡಿಸಿ)", footer_channel: 'YouTube ನಲ್ಲಿ ಹಿಂದಿಯಲ್ಲಿ AI ಕಲಿಯಿರಿ', saved_local: 'ಈ ಸಾಧನದಲ್ಲಿ ಮಾತ್ರ ಉಳಿಸಲಾಗುತ್ತದೆ', needs_internet: 'ಮೊದಲ ಬಾರಿ ತೆರೆಯಲು ಇಂಟರ್ನೆಟ್ ಬೇಕು', needs_camera: 'ಕ್ಯಾಮೆರಾ ಬಳಸುತ್ತದೆ', needs_mic: 'ಮೈಕ್ರೊಫೋನ್ ಬಳಸುತ್ತದೆ', no_voice: 'ಈ ಸಾಧನದಲ್ಲಿ ಈ ಭಾಷೆಯ ಧ್ವನಿ ಇಲ್ಲ. Android ನಲ್ಲಿ Chrome ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಧ್ವನಿ ಸೇರಿಸಿ.', confirm_reset: 'ಎಲ್ಲವನ್ನೂ ಅಳಿಸಿ ಮತ್ತೆ ಪ್ರಾರಂಭಿಸುವುದೇ?', offline_ready: 'ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡಲು ಸಿದ್ಧ', shell_wa: "WhatsApp ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ", shell_wa_msg: "{title}: ಶಾಲಾ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಉಚಿತ ಆ್ಯಪ್. ಸೈನ್-ಅಪ್ ಇಲ್ಲ, ಜಾಹೀರಾತು ಇಲ್ಲ, 12 ಭಾರತೀಯ ಭಾಷೆಗಳಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ. ಇಲ್ಲಿ ತೆರೆಯಿರಿ: {url}", shell_schools: "ಶಾಲೆಗಳು ಮತ್ತು ಮುಖ್ಯ ಶಿಕ್ಷಕರಿಗಾಗಿ", shell_privacy: "ಗೌಪ್ಯತೆ", shell_business: "ವ್ಯಾಪಾರ ಮತ್ತು ತಂಡಗಳಿಗಾಗಿ", shell_wa_tool: "{title}: AI ಪಾಠಶಾಲೆಯ ಉಚಿತ ಟೂಲ್. ಸೈನ್-ಅಪ್ ಇಲ್ಲ, ಜಾಹೀರಾತು ಇಲ್ಲ, ನಿಮ್ಮ ಫೈಲ್‌ಗಳು ನಿಮ್ಮ ಸಾಧನದಲ್ಲೇ ಇರುತ್ತವೆ, 12 ಭಾರತೀಯ ಭಾಷೆಗಳಲ್ಲಿ. ಇಲ್ಲಿ ತೆರೆಯಿರಿ: {url}", shell_cta: "ಪ್ರತಿ ವಾರ ಹೊಸ ಉಚಿತ ಆ್ಯಪ್‌ಗಳು: ಅಪ್‌ಡೇಟ್ ಪಡೆಯಿರಿ", shell_cta_hide: "ಈ ಸಂದೇಶವನ್ನು ಮರೆಮಾಡಿ", nav_schools: "ಶಾಲೆಗಳು", nav_business: "ವ್ಯಾಪಾರ", nav_guides: "ಮಾರ್ಗದರ್ಶಿಗಳು", nav_videos: "ವೀಡಿಯೊಗಳು", nav_about: "ನಮ್ಮ ಬಗ್ಗೆ", nav_contact: "ಸಂಪರ್ಕಿಸಿ", shell_terms: "ನಿಯಮಗಳು", foot_tagline: "ಎಲ್ಲರಿಗೂ ಉಚಿತ AI ಉಪಕರಣಗಳು ಮತ್ತು AI ಪಾಠಗಳು, 12 ಭಾರತೀಯ ಭಾಷೆಗಳಲ್ಲಿ.", foot_col_explore: "ಅನ್ವೇಷಿಸಿ", foot_col_follow: "ಕಲಿಯಿರಿ, ಜೊತೆಗಿರಿ", foot_source: "ಸೋರ್ಸ್ ಕೋಡ್ (GitHub)", foot_zip: "ಎಲ್ಲಾ ಆ್ಯಪ್‌ಗಳನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (ZIP)" },
    ml: { library: 'എല്ലാ ആപ്പുകളും', brand: 'AI പാഠശാല', language: 'ഭാഷ', theme: 'ലൈറ്റ് / ഡാർക്ക് തീം', print: 'പ്രിന്റ് ചെയ്യുക', reset: 'റീസെറ്റ്', start: 'ആരംഭിക്കുക', stop: 'നിർത്തുക', pause: 'താൽക്കാലികമായി നിർത്തുക', resume: 'തുടരുക', next: 'അടുത്തത്', previous: 'മുമ്പത്തേത്', save: 'സേവ് ചെയ്യുക', download: 'ഡൗൺലോഡ്', upload: 'അപ്‌ലോഡ്', copy: 'പകർത്തുക', copied: 'പകർത്തി!', clear: 'മായ്ക്കുക', add: 'ചേർക്കുക', delete: 'ഇല്ലാതാക്കുക', edit: 'തിരുത്തുക', close: 'അടയ്ക്കുക', cancel: 'റദ്ദാക്കുക', done: 'പൂർത്തിയായി', yes: 'അതെ', no: 'ഇല്ല', help: 'എങ്ങനെ ഉപയോഗിക്കാം', score: 'സ്കോർ', correct: 'ശരി!', wrong: 'അൽപ്പം പിഴച്ചു', try_again: 'വീണ്ടും ശ്രമിക്കുക', share: 'പങ്കിടുക', fullscreen: 'പൂർണ്ണ സ്ക്രീൻ', import: 'ഇമ്പോർട്ട്', export: 'എക്സ്പോർട്ട്', loading: 'ലോഡ് ചെയ്യുന്നു…', settings: 'ക്രമീകരണങ്ങൾ', search: 'തിരയുക', example: 'ഉദാഹരണം', result: 'ഫലം', total: 'ആകെ', footer_free: "എല്ലാവർക്കും സൗജന്യം · വിദ്യാർത്ഥികൾക്ക് സൈൻ-അപ്പ് വേണ്ട · പരസ്യങ്ങളില്ല · നിങ്ങളുടെ ഡാറ്റ നിങ്ങളുടെ ഉപകരണത്തിൽ മാത്രം (ഐച്ഛിക ലൈവ് ക്വിസ് ഒഴികെ)", footer_channel: 'YouTube-ൽ ഹിന്ദിയിൽ AI പഠിക്കൂ', saved_local: 'ഈ ഉപകരണത്തിൽ മാത്രം സേവ് ചെയ്യപ്പെടുന്നു', needs_internet: 'ആദ്യമായി തുറക്കാൻ ഇന്റർനെറ്റ് വേണം', needs_camera: 'ക്യാമറ ഉപയോഗിക്കുന്നു', needs_mic: 'മൈക്രോഫോൺ ഉപയോഗിക്കുന്നു', no_voice: 'ഈ ഉപകരണത്തിൽ ഈ ഭാഷയുടെ ശബ്ദമില്ല. Android-ൽ Chrome ഉപയോഗിച്ചു നോക്കുക അല്ലെങ്കിൽ ക്രമീകരണങ്ങളിൽ ശബ്ദം ചേർക്കുക.', confirm_reset: 'എല്ലാം മായ്ച്ച് വീണ്ടും തുടങ്ങണോ?', offline_ready: 'ഓഫ്‌ലൈനായി പ്രവർത്തിക്കാൻ തയ്യാർ', shell_wa: "WhatsApp-ൽ പങ്കിടുക", shell_wa_msg: "{title}: സ്കൂൾ വിദ്യാർത്ഥികൾക്കുള്ള സൗജന്യ ആപ്പ്. സൈൻ-അപ്പ് ഇല്ല, പരസ്യമില്ല, 12 ഇന്ത്യൻ ഭാഷകളിൽ പ്രവർത്തിക്കും. ഇവിടെ തുറക്കൂ: {url}", shell_schools: "സ്കൂളുകൾക്കും പ്രധാനാധ്യാപകർക്കും", shell_privacy: "സ്വകാര്യത", shell_business: "ബിസിനസുകൾക്കും ടീമുകൾക്കും", shell_wa_tool: "{title}: AI പാഠശാലയുടെ സൗജന്യ ടൂൾ. സൈൻ-അപ്പ് ഇല്ല, പരസ്യമില്ല, നിങ്ങളുടെ ഫയലുകൾ നിങ്ങളുടെ ഉപകരണത്തിൽത്തന്നെ ഇരിക്കും, 12 ഇന്ത്യൻ ഭാഷകളിൽ. ഇവിടെ തുറക്കൂ: {url}", shell_cta: "എല്ലാ ആഴ്ചയും പുതിയ സൗജന്യ ആപ്പുകൾ: അപ്ഡേറ്റുകൾ നേടൂ", shell_cta_hide: "ഈ സന്ദേശം മറയ്ക്കുക", nav_schools: "സ്കൂളുകൾ", nav_business: "ബിസിനസ്", nav_guides: "ഗൈഡുകൾ", nav_videos: "വീഡിയോകൾ", nav_about: "ഞങ്ങളെക്കുറിച്ച്", nav_contact: "ബന്ധപ്പെടുക", shell_terms: "നിബന്ധനകൾ", foot_tagline: "എല്ലാവർക്കും സൗജന്യ AI ടൂളുകളും AI പാഠങ്ങളും, 12 ഇന്ത്യൻ ഭാഷകളിൽ.", foot_col_explore: "കാണുക", foot_col_follow: "പഠിക്കൂ, ഒപ്പം ചേരൂ", foot_source: "സോഴ്സ് കോഡ് (GitHub)", foot_zip: "എല്ലാ ആപ്പുകളും ഡൗൺലോഡ് ചെയ്യുക (ZIP)" },
    ur: { library: 'تمام ایپس', brand: 'AI پاٹھ شالہ', language: 'زبان', theme: 'لائٹ / ڈارک تھیم', print: 'پرنٹ کریں', reset: 'ری سیٹ', start: 'شروع کریں', stop: 'روکیں', pause: 'وقفہ', resume: 'دوبارہ شروع کریں', next: 'آگے', previous: 'پیچھے', save: 'محفوظ کریں', download: 'ڈاؤن لوڈ', upload: 'اپ لوڈ', copy: 'کاپی کریں', copied: 'کاپی ہو گیا!', clear: 'صاف کریں', add: 'شامل کریں', delete: 'حذف کریں', edit: 'ترمیم کریں', close: 'بند کریں', cancel: 'منسوخ کریں', done: 'ہو گیا', yes: 'ہاں', no: 'نہیں', help: 'استعمال کیسے کریں', score: 'اسکور', correct: 'درست!', wrong: 'تھوڑا سا چوک گئے', try_again: 'دوبارہ کوشش کریں', share: 'شیئر کریں', fullscreen: 'پوری اسکرین', import: 'امپورٹ', export: 'ایکسپورٹ', loading: 'لوڈ ہو رہا ہے…', settings: 'ترتیبات', search: 'تلاش کریں', example: 'مثال', result: 'نتیجہ', total: 'کل', footer_free: "سب کے لیے مفت · طلبہ کے لیے کوئی سائن اپ نہیں · کوئی اشتہار نہیں · آپ کا ڈیٹا آپ کے آلے پر ہی رہتا ہے (اختیاری لائیو کوئز کے سوا)", footer_channel: 'YouTube پر ہندی میں AI سیکھیں', saved_local: 'صرف اسی آلے پر محفوظ ہوتا ہے', needs_internet: 'پہلی بار کھولنے کے لیے انٹرنیٹ درکار ہے', needs_camera: 'کیمرا استعمال کرتی ہے', needs_mic: 'مائیکروفون استعمال کرتی ہے', no_voice: 'اس آلے پر اس زبان کی آواز موجود نہیں۔ Android پر Chrome آزمائیں یا ترتیبات میں آواز شامل کریں۔', confirm_reset: 'سب کچھ مٹا کر دوبارہ شروع کریں؟', offline_ready: 'آف لائن چلنے کے لیے تیار', shell_wa: "WhatsApp پر شیئر کریں", shell_wa_msg: "{title}: اسکول کے طلبہ کے لیے مفت ایپ۔ نہ سائن اپ، نہ اشتہار، 12 ہندوستانی زبانوں میں چلتی ہے۔ یہاں کھولیں: {url}", shell_schools: "اسکولوں اور پرنسپلوں کے لیے", shell_privacy: "رازداری", shell_business: "کاروبار اور ٹیموں کے لیے", shell_wa_tool: "{title}: AI پاٹھ شالہ کا مفت ٹول۔ نہ سائن اپ، نہ اشتہار، آپ کی فائلیں آپ کے آلے پر ہی رہتی ہیں، 12 ہندوستانی زبانوں میں۔ یہاں کھولیں: {url}", shell_cta: "ہر ہفتے نئی مفت ایپس: اپ ڈیٹس پائیں", shell_cta_hide: "یہ پیغام چھپائیں", nav_schools: "اسکول", nav_business: "کاروبار", nav_guides: "رہنما", nav_videos: "ویڈیوز", nav_about: "ہمارے بارے میں", nav_contact: "رابطہ", shell_terms: "شرائط", foot_tagline: "سب کے لیے مفت AI ٹولز اور AI کی تعلیم، 12 ہندوستانی زبانوں میں۔", foot_col_explore: "دیکھیں", foot_col_follow: "سیکھیں اور جڑے رہیں", foot_source: "سورس کوڈ (GitHub)", foot_zip: "تمام ایپس ڈاؤن لوڈ کریں (ZIP)" }
  };

  /* ---------------- paths ---------------- */
  var ROOT = (function () {
    var s = document.currentScript && document.currentScript.src;
    if (!s) return '../../';
    return s.replace(/shared\/edu\.js(\?.*)?$/, '');
  })();

  /* ---------------- safe storage ---------------- */
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; /* private mode or quota full */ } }
  function lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) { } }

  function store(ns) {
    var p = 'edu.' + ns + '.';
    return {
      get: function (k, d) { var v = lsGet(p + k); if (v === null) return d; try { return JSON.parse(v); } catch (e) { return d; } },
      set: function (k, v) { return lsSet(p + k, JSON.stringify(v)); },   /* false = not saved (quota full / private mode) */
      remove: function (k) { lsDel(p + k); }
    };
  }

  /* ---------------- language ---------------- */
  function langInfo(code) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i]; return LANGS[0]; }

  function detectLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q && CODES.indexOf(q) >= 0) return q;
    } catch (e) { }
    var saved = lsGet('edu.lang');
    if (saved && CODES.indexOf(saved) >= 0) return saved;
    var navs = (navigator.languages || [navigator.language || 'en']);
    for (var i = 0; i < navs.length; i++) {
      var c = String(navs[i] || '').toLowerCase().split('-')[0];
      if (CODES.indexOf(c) >= 0) return c;
    }
    return 'en';
  }

  var state = { lang: detectLang(), strings: null, listeners: [], titleKey: 'app_title', slug: '', warned: {} };

  function lookup(table, lang, key) {
    return table && table[lang] && Object.prototype.hasOwnProperty.call(table[lang], key) ? table[lang][key] : undefined;
  }

  function t(key, vars) {
    var L = state.lang, S = state.strings || window.APP_STRINGS || {};
    var v = lookup(S, L, key);
    if (v === undefined) v = lookup(COMMON, L, key);
    if (v === undefined) {
      if (L !== 'en' && !state.warned[L + ':' + key]) {
        state.warned[L + ':' + key] = 1;
        console.warn('[i18n-missing]', L, key);
      }
      v = lookup(S, 'en', key);
      if (v === undefined) v = lookup(COMMON, 'en', key);
      if (v === undefined) {
        if (!state.warned['en:' + key]) { state.warned['en:' + key] = 1; console.warn('[i18n-missing]', 'en', key); }
        v = key;
      }
    }
    if (vars) v = String(v).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return v;
  }

  /* Does a key exist (in app or common strings)? */
  function has(key) { var S = state.strings || window.APP_STRINGS || {}; return lookup(S, 'en', key) !== undefined || lookup(COMMON, 'en', key) !== undefined; }

  function apply(root) {
    root = root || document;
    var q = function (sel) { return root.querySelectorAll ? root.querySelectorAll(sel) : []; };
    Array.prototype.forEach.call(q('[data-i18n]'), function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    Array.prototype.forEach.call(q('[data-i18n-html]'), function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    ['placeholder', 'title', 'aria-label', 'alt', 'value'].forEach(function (attr) {
      Array.prototype.forEach.call(q('[data-i18n-' + attr + ']'), function (el) { el.setAttribute(attr, t(el.getAttribute('data-i18n-' + attr))); });
    });
  }

  var loadedFonts = {};
  function loadFont(info) {
    if (!info.font || loadedFonts[info.font]) return;
    loadedFonts[info.font] = 1;
    if (location.protocol === 'file:' && !navigator.onLine) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + info.font.replace(/ /g, '+') + ':wght@400;600;700&display=swap';
    document.head.appendChild(l);
  }

  function applyLangAttrs() {
    var info = langInfo(state.lang);
    var html = document.documentElement;
    html.lang = info.code;
    html.dir = info.dir;
    loadFont(info);
    html.style.setProperty('--font-script', info.font ? '"' + info.font + '"' : '"Noto Sans"');
  }

  function setLang(code) {
    if (CODES.indexOf(code) < 0) code = 'en';
    state.lang = code;
    lsSet('edu.lang', code);
    applyLangAttrs();
    try {
      var u = new URL(location.href);
      if (u.searchParams.get('lang') !== code) { u.searchParams.set('lang', code); history.replaceState(history.state, '', u.toString()); }
    } catch (e) { }
    apply(document);
    refreshShell();
    state.listeners.slice().forEach(function (fn) { try { fn(code); } catch (e) { console.error(e); } });
  }

  function onLang(fn) { state.listeners.push(fn); }

  /* ---------------- DOM helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  /* el('button', {class:'btn', i18n:'start', onclick: fn}, child, 'text') */
  function el(tag, props) {
    var e = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === undefined || v === null || v === false) return;
      if (k === 'class' || k === 'className') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'i18n') { e.setAttribute('data-i18n', v); e.textContent = t(v); }
      else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (s) { if (s.slice(0, 2) === '--') e.style.setProperty(s, v[s]); else e.style[s] = v[s]; });
      else if (k === 'dataset') Object.keys(v).forEach(function (d) { e.dataset[d] = v[d]; });
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) append(e, arguments[i]);
    return e;
  }
  function append(parent, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(parent, x); }); return; }
    parent.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------------- feedback ---------------- */
  var toastWrap;
  function toast(msg, ms) {
    if (!toastWrap) { toastWrap = el('div', { class: 'edu-toast-wrap', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(toastWrap); }
    var n = el('div', { class: 'edu-toast', text: msg });
    toastWrap.appendChild(n);
    setTimeout(function () { n.remove(); }, ms || 2600);
  }

  function modal(content, opts) {
    opts = opts || {};
    var back = el('div', { class: 'edu-modal-back' });
    var box = el('div', { class: 'edu-modal', role: 'dialog', 'aria-modal': 'true' });
    var head = el('div', { class: 'row spread', style: { marginBottom: '10px' } },
      el('h2', { class: 'mb0', text: opts.title || '' }),
      el('button', { class: 'edu-iconbtn', 'aria-label': t('close'), text: '✕', onclick: close }));
    box.appendChild(head);
    if (typeof content === 'string') box.appendChild(el('div', { html: content })); else append(box, content);
    back.appendChild(box);
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);
    function close() { document.removeEventListener('keydown', onKey); back.remove(); if (opts.onClose) opts.onClose(); }
    return close;
  }

  /* ---------------- files / clipboard / share ---------------- */
  function download(name, content, mime) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var a = el('a', { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function downloadCanvas(canvas, name) {
    canvas.toBlob(function (b) { if (b) download(name || 'image.png', b); }, 'image/png');
  }
  function pickFile(accept) {
    return new Promise(function (resolve) {
      var i = el('input', { type: 'file', accept: accept || '*/*', style: { display: 'none' } });
      i.addEventListener('change', function () { resolve(i.files && i.files[0] ? i.files[0] : null); i.remove(); });
      i.addEventListener('cancel', function () { resolve(null); i.remove(); });
      document.body.appendChild(i); i.click();
    });
  }
  function readText(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result)); }; r.onerror = rej; r.readAsText(file); }); }

  function copy(text) {
    function fallback() {
      var ta = el('textarea', { style: { position: 'fixed', top: '-1000px' } }); ta.value = text;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { }
      ta.remove();
    }
    var p = (navigator.clipboard && window.isSecureContext) ? navigator.clipboard.writeText(text).catch(fallback) : Promise.resolve(fallback());
    return p.then(function () { toast(t('copied')); });
  }
  function share(url, title) {
    url = url || location.href;
    var touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (navigator.share && touch) return navigator.share({ title: title || document.title, url: url }).catch(function () { });
    return copy(url);
  }

  /* Pack an object into a URL-safe string (for share links) and back. */
  function pack(obj) {
    var bytes = new TextEncoder().encode(JSON.stringify(obj)), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unpack(str) {
    try {
      var b = str.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
      var bin = atob(b), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) { return null; }
  }

  /* ---------------- CSV ---------------- */
  var csv = {
    /* parse(text, delimiter?) — delimiter auto-detected from the first line: tab (Excel/Sheets paste), ';' or ',' */
    parse: function (text, delim) {
      var rows = [], row = [], cur = '', q = false, i = 0, c;
      text = String(text).replace(/^\uFEFF/, '');
      if (!delim) {
        var first = text.split(/\r?\n/)[0] || '';
        var cnt = function (ch) { return first.split(ch).length - 1; };
        delim = cnt('\t') > 0 && cnt('\t') >= cnt(',') ? '\t' : (cnt(';') > cnt(',') ? ';' : ',');
      }
      for (; i < text.length; i++) {
        c = text[i];
        if (q) {
          if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
          else cur += c;
        } else if (c === '"') q = true;
        else if (c === delim) { row.push(cur); cur = ''; }
        else if (c === '\n' || c === '\r') {
          if (c === '\r' && text[i + 1] === '\n') i++;
          row.push(cur); rows.push(row); row = []; cur = '';
        } else cur += c;
      }
      if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
      return rows.filter(function (r) { return r.length > 1 || (r[0] || '').trim() !== ''; });
    },
    stringify: function (rows) {
      return '﻿' + rows.map(function (r) {
        return r.map(function (v) { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',');
      }).join('\r\n');
    }
  };

  /* ---------------- numbers / random ---------------- */
  function fmt(n, opts) {
    try { return new Intl.NumberFormat(langInfo(state.lang).tag, Object.assign({ numberingSystem: 'latn' }, opts || {})).format(n); }
    catch (e) { return String(n); }
  }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------------- speech ---------------- */
  function getVoices() {
    return new Promise(function (resolve) {
      if (!('speechSynthesis' in window)) return resolve([]);
      var v = speechSynthesis.getVoices();
      if (v && v.length) return resolve(v);
      var done = false;
      speechSynthesis.addEventListener('voiceschanged', function () { if (!done) { done = true; resolve(speechSynthesis.getVoices()); } });
      setTimeout(function () { if (!done) { done = true; resolve(speechSynthesis.getVoices() || []); } }, 1200);
    });
  }
  function voiceFor(voices, code) {
    var tag = langInfo(code).tag.toLowerCase(), base = code.toLowerCase();
    var norm = function (v) { return String(v.lang || '').toLowerCase().replace('_', '-'); };
    return voices.filter(function (v) { return norm(v) === tag; })[0] ||
      voices.filter(function (v) { return norm(v).split('-')[0] === base; })[0] ||
      (base === 'ur' ? voices.filter(function (v) { return norm(v) === 'ur-pk'; })[0] : null) || null;
  }
  /* speak(text, {lang, rate, pitch, onend, onboundary}) → Promise<boolean> (false = no voice) */
  function speak(text, opts) {
    opts = opts || {};
    var code = opts.lang || state.lang;
    return getVoices().then(function (voices) {
      if (!('speechSynthesis' in window)) return false;
      var voice = voiceFor(voices, code);
      if (!voice && code !== 'en' && !opts.allowNoVoice) return false;
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = voice ? voice.lang : langInfo(code).tag;
      if (voice) u.voice = voice;
      u.rate = opts.rate || 1; u.pitch = opts.pitch || 1;
      if (opts.onend) u.onend = opts.onend;
      if (opts.onboundary) u.onboundary = opts.onboundary;
      speechSynthesis.speak(u);
      return true;
    });
  }
  function stopSpeaking() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  /* Returns a configured SpeechRecognition or null if the browser has none. */
  function recognizer(opts) {
    opts = opts || {};
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    var r = new SR();
    r.lang = langInfo(opts.lang || state.lang).tag;
    r.interimResults = !!opts.interim;
    r.continuous = !!opts.continuous;
    r.maxAlternatives = opts.alternatives || 1;
    return r;
  }

  /* ---------------- fullscreen ---------------- */
  function fullscreen(target) {
    var d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      var ex = (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      if (ex && ex.catch) ex.catch(function () { });
      return;
    }
    target = target || d.documentElement;
    var req = target.requestFullscreen || target.webkitRequestFullscreen;
    if (req) { var pr = req.call(target); if (pr && pr.catch) pr.catch(function () { }); }
  }
  document.addEventListener('fullscreenchange', function () {
    document.documentElement.classList.toggle('edu-fullscreen-on', !!document.fullscreenElement);
  });

  /* ---------------- theme ---------------- */
  function effectiveTheme() {
    var th = document.documentElement.getAttribute('data-theme');
    if (th) return th;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function setTheme(th) {
    if (th) { document.documentElement.setAttribute('data-theme', th); lsSet('edu.theme', th); }
    else { document.documentElement.removeAttribute('data-theme'); lsDel('edu.theme'); }
    if (shell.updateThemeIcon) shell.updateThemeIcon();
    themeListeners.forEach(function (fn) { try { fn(effectiveTheme()); } catch (e) { console.error(e); } });
  }
  var themeListeners = [];
  (function () { var th = lsGet('edu.theme'); if (th === 'dark' || th === 'light') document.documentElement.setAttribute('data-theme', th); })();
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var mqh = function () { if (!document.documentElement.getAttribute('data-theme')) themeListeners.forEach(function (fn) { fn(effectiveTheme()); }); };
    if (mq.addEventListener) mq.addEventListener('change', mqh);
  }
  /* Read a CSS variable (e.g. for canvas drawing): EDU.css('--primary') */
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  /* ---------------- shell ---------------- */
  var shell = {};
  function buildShell(opts) {
    var langSel = el('select', { class: 'edu-lang', id: 'edu-lang', 'aria-label': t('language') });
    /* On phones the picker shows only native names (हिन्दी, தமிழ்) so the header stays on one line. */
    var narrow = window.matchMedia ? matchMedia('(max-width: 560px)') : null;
    function optLabel(l) { return l.native + (l.code === 'en' || (narrow && narrow.matches) ? '' : ' · ' + l.name); }
    LANGS.forEach(function (l) { langSel.appendChild(el('option', { value: l.code, text: optLabel(l) })); });
    if (narrow && narrow.addEventListener) narrow.addEventListener('change', function () { Array.prototype.forEach.call(langSel.options, function (o) { o.textContent = optLabel(langInfo(o.value)); }); });
    langSel.value = state.lang;
    langSel.addEventListener('change', function () { setLang(langSel.value); });

    var themeBtn = el('button', { class: 'edu-iconbtn', id: 'edu-theme', type: 'button', onclick: function () { setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark'); updateThemeIcon(); } });
    function updateThemeIcon() { themeBtn.textContent = effectiveTheme() === 'dark' ? '☀' : '☾'; }
    updateThemeIcon();

    var isHome = !!opts.home;
    var brand = el('a', { class: 'edu-brand', href: ROOT + 'index.html' + (state.lang ? '?lang=' + state.lang : '') },
      el('img', { src: ROOT + 'shared/img/icon-96.png', alt: '' }),
      el('span', { class: 'edu-brand-txt', 'data-i18n': 'brand', text: t('brand') }));
    var back = isHome || opts.nav ? null : el('a', { class: 'edu-back', href: ROOT + 'index.html', id: 'edu-back' }, el('span', { class: 'edu-back-arrow', 'aria-hidden': 'true', text: '← ' }), el('span', { 'data-i18n': 'library', text: t('library') }));
    var title = el('h1', { class: 'edu-title', id: 'edu-title' });

    /* "Share on WhatsApp": a plain wa.me link (works on file:// and without JS share APIs); the
       message always carries the public https://apnipathshala.ai/... address of this page. */
    var waBtn = el('a', { class: 'edu-iconbtn edu-wa no-print', id: 'edu-wa', target: '_blank', rel: 'noopener', html: WA_ICON });

    /* Site pages (home, schools, business, about, contact) get the site menu; apps keep the compact header.
       Links that carry ?lang= are listed in shell.langLinks and refreshed on every language switch. */
    var langLinks = [];
    function pageLink(file, key, props) {
      var a = el('a', Object.assign({ href: ROOT + file }, props || {}), el('span', { 'data-i18n': key, text: t(key) }));
      if (!/^https?:/.test(file)) langLinks.push([a, file]);
      return a;
    }
    var nav = null;
    if (opts.nav) {
      var here = opts.nav === true ? '' : opts.nav;
      var item = function (id, file, key) {
        var a = pageLink(file, key, { class: 'edu-nav-a', id: 'edu-nav-' + id });
        if (id === here) a.setAttribute('aria-current', 'page');
        return a;
      };
      nav = el('nav', { class: 'edu-nav no-print', id: 'edu-nav', 'aria-label': t('brand') },
        item('apps', 'index.html', 'library'),
        item('schools', 'schools.html', 'nav_schools'),
        item('business', 'business.html', 'nav_business'),
        item('guides', 'guides/index.html', 'nav_guides'),
        el('a', { class: 'edu-nav-a', id: 'edu-nav-videos', href: YOUTUBE, target: '_blank', rel: 'noopener' }, el('span', { 'data-i18n': 'nav_videos', text: t('nav_videos') }), el('span', { 'aria-hidden': 'true', class: 'edu-nav-ext', text: ' ↗' })),
        item('about', 'about.html', 'nav_about'),
        item('contact', 'contact.html', 'nav_contact'));
      document.body.classList.add('edu-site');
      title.classList.add('edu-sr');
    }

    /* Apps only: "</> Source code (GitHub)" in the footer opens this app's folder on GitHub. */
    var isApp = !!state.slug && !opts.nav && !opts.home && !state.sharePath;
    var srcBtn = isApp ? el('a', { class: 'edu-src no-print', id: 'edu-src', href: SITE.repo + '/tree/main/apps/' + state.slug, target: '_blank', rel: 'noopener' },
      el('span', { class: 'edu-src-ic', 'aria-hidden': 'true', text: '</> ' }), el('span', { 'data-i18n': 'foot_source', text: t('foot_source') })) : null;
    var top = el('header', { class: 'edu-top' },
      el('div', { class: 'edu-top-in' }, brand, back, title, nav,
        el('div', { class: 'edu-tools' }, langSel, waBtn, themeBtn)));
    document.body.insertBefore(top, document.body.firstChild);

    var schoolsLink = el('a', { href: ROOT + 'schools.html', id: 'edu-foot-schools' }, '🏫 ', el('span', { 'data-i18n': 'shell_schools', text: t('shell_schools') }));
    var businessLink = el('a', { href: ROOT + 'business.html', id: 'edu-foot-business' }, '💼 ', el('span', { 'data-i18n': 'shell_business', text: t('shell_business') }));
    var privacyLink = el('a', { href: ROOT + 'legal/privacy.html', id: 'edu-foot-privacy' }, '🔒 ', el('span', { 'data-i18n': 'shell_privacy', text: t('shell_privacy') }));
    var ytLink = el('a', { href: YOUTUBE, target: '_blank', rel: 'noopener' }, '▶ ', el('span', { 'data-i18n': 'footer_channel', text: t('footer_channel') }));
    var foot;
    if (opts.nav) {
      var col = function (key) { var ul = el('ul'); Array.prototype.slice.call(arguments, 1).forEach(function (a) { ul.appendChild(el('li', null, a)); }); return el('div', { class: 'edu-foot-col' }, el('h2', { 'data-i18n': key, text: t(key) }), ul); };
      foot = el('footer', { class: 'edu-foot edu-foot-site' },
        el('div', { class: 'edu-foot-in' },
          el('div', { class: 'edu-foot-col edu-foot-about' },
            el('a', { class: 'edu-brand', href: ROOT + 'index.html' }, el('img', { src: ROOT + 'shared/img/icon-96.png', alt: '' }), el('span', { 'data-i18n': 'brand', text: t('brand') })),
            el('p', { 'data-i18n': 'foot_tagline', text: t('foot_tagline') }),
            el('p', { class: 'edu-foot-free', 'data-i18n': 'footer_free', text: t('footer_free') })),
          col('foot_col_explore', pageLink('index.html', 'library'), pageLink('schools.html', 'shell_schools', { id: 'edu-foot-schools' }),
            pageLink('business.html', 'shell_business', { id: 'edu-foot-business' }), pageLink('guides/index.html', 'nav_guides')),
          col('brand', pageLink('about.html', 'nav_about', { id: 'edu-foot-about' }), pageLink('contact.html', 'nav_contact', { id: 'edu-foot-contact' }),
            pageLink('legal/privacy.html', 'shell_privacy', { id: 'edu-foot-privacy' }), pageLink('legal/terms.html', 'shell_terms')),
          col('foot_col_follow', el('a', { href: YOUTUBE, target: '_blank', rel: 'noopener' }, el('span', { 'data-i18n': 'footer_channel', text: t('footer_channel') })),
            el('a', { href: SITE.zip, rel: 'noopener' }, el('span', { 'data-i18n': 'foot_zip', text: t('foot_zip') })))));
    } else {
      foot = el('footer', { class: 'edu-foot' },
        el('div', { class: 'edu-foot-in' },
          el('span', { 'data-i18n': 'footer_free', text: t('footer_free') }),
          el('span', { class: 'edu-foot-links' }, schoolsLink, businessLink, privacyLink,
            pageLink('about.html', 'nav_about', { id: 'edu-foot-about' }), pageLink('contact.html', 'nav_contact', { id: 'edu-foot-contact' }), ytLink, srcBtn)));
    }
    document.body.appendChild(foot);

    shell = { top: top, title: title, langSel: langSel, themeBtn: themeBtn, waBtn: waBtn, srcBtn: srcBtn, schoolsLink: schoolsLink, businessLink: businessLink, brand: brand, back: back, nav: nav, langLinks: langLinks, updateThemeIcon: updateThemeIcon };
  }

  /* Public address of the current page (for sharing), also when opened from a downloaded ZIP (file://)
     or a local test server: the path below the library root is appended to SITE.url. */
  function shareUrl(lang) {
    var here = location.href.split('#')[0].split('?')[0], rel = null;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(ROOT) && here.indexOf(ROOT) === 0) rel = here.slice(ROOT.length);
    if (rel === null) rel = state.home ? '' : (state.sharePath || (state.slug ? 'apps/' + state.slug + '/' : ''));
    rel = rel.replace(/(^|\/)index\.html$/, '$1');
    lang = lang === undefined ? state.lang : lang;
    return SITE.url + rel + (lang && lang !== 'en' ? '?lang=' + lang : '');
  }
  function waLink(text) { return 'https://wa.me/?text=' + encodeURIComponent(text); }
  function refreshWa() {
    if (!shell.waBtn) return;
    var title = state.titleKey ? t(state.titleKey) : t('brand');
    var url = shareUrl(), msg = t(state.waKey || 'shell_wa_msg', { title: title, url: url });
    if (msg.indexOf(url) < 0) msg += ' ' + url;   /* an app string with the same key must never drop the link */
    shell.waBtn.href = waLink(msg);
    shell.waBtn.setAttribute('aria-label', t('shell_wa'));
    shell.waBtn.title = t('shell_wa');
  }
  function refreshShell() {
    if (!shell.top) return;
    shell.langSel.value = state.lang;
    shell.langSel.setAttribute('aria-label', t('language'));
    shell.themeBtn.setAttribute('aria-label', t('theme'));
    shell.themeBtn.title = t('theme');
    var titleText = state.titleKey ? t(state.titleKey) : '';
    shell.title.textContent = titleText;
    shell.brand.href = ROOT + 'index.html?lang=' + state.lang;
    if (shell.back) shell.back.href = ROOT + 'index.html?lang=' + state.lang;
    if (shell.schoolsLink) shell.schoolsLink.href = ROOT + 'schools.html?lang=' + state.lang;
    if (shell.businessLink) shell.businessLink.href = ROOT + 'business.html?lang=' + state.lang;
    (shell.langLinks || []).forEach(function (p) { p[0].href = ROOT + p[1] + '?lang=' + state.lang; });
    if (shell.nav) shell.nav.setAttribute('aria-label', t('brand'));
    refreshWa();
    ctaRefresh();
    document.title = (titleText ? titleText + ' · ' : '') + t('brand');
  }

  function registerSW() {
    if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
    try {
      /* First visit (e.g. straight from a WhatsApp link): this page and its files loaded before the
         service worker existed, so they are not in its cache yet. Ask it to cache them now, so the
         app really does work offline after being opened once. Same-origin files only (all small). */
      var firstVisit = !navigator.serviceWorker.controller;
      navigator.serviceWorker.register(ROOT + 'sw.js').then(function () {
        if (!firstVisit) return;
        return navigator.serviceWorker.ready.then(function (reg) {
          var urls = [location.href.split('#')[0]];
          try {
            performance.getEntriesByType('resource').forEach(function (e) {
              if (e.name.indexOf(location.origin + '/') === 0 && urls.indexOf(e.name) < 0) urls.push(e.name);
            });
          } catch (e) { }
          if (reg.active) reg.active.postMessage({ type: 'edu-cache', urls: urls });
        });
      }).catch(function () { });
    } catch (e) { }
  }

  /* ---------------- "get updates" reminder ----------------
     A small, dismissible link to the home page's "Stay updated" form (#updates), on APP pages only (apps/<slug>/),
     online (http/https) only, never on pages that have the form themselves, never in the Live Class Quiz screens.
     When: on the 2nd page view of this browser (a few seconds after the page opened, never on first paint), or after
     45 s of real use on the first one. Never in full screen or projector/present mode (edu.css hides it there too).
     Where: wide screens = a pill in the header (takes room from the title only); phones and tablets = a bar in the
     page flow above the footer (it never covers content). ✕ hides it for 30 days; following the link for 7 days;
     a sign-up on this browser (shared/signup.js) for good. Everything is remembered with EDU.store('cta') on this
     device only: a page-view count and dates. Nothing is sent anywhere. */
  var CTA_SKIP = ['live-quiz', 'quiz-join'];
  var CTA_DAY = 86400000;
  var cta = { el: null, row: null, mq: null, shown: false };
  function ctaPresenting() {
    var d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement || d.documentElement.classList.contains('edu-fullscreen-on')) return true;
    if (d.querySelector('.present, .presenting')) return true;
    try { if (window.matchMedia && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('print').matches)) return true; } catch (e) { }
    return false;
  }
  function ctaBlocked(st) {
    if (st.get('joined', 0)) return true;
    var off = Number(st.get('off', 0)) || 0;
    return off > Date.now();
  }
  function ctaPlace() {
    if (!cta.el) return;
    var wide = !!(cta.mq && cta.mq.matches);
    var tools = shell.top && shell.top.querySelector('.edu-tools');
    if (shell.top) shell.top.classList.toggle('edu-cta-on', !!(wide && tools));
    if (wide && tools) {
      if (cta.el.parentNode !== tools.parentNode) tools.parentNode.insertBefore(cta.el, tools);
      if (cta.row.parentNode) cta.row.parentNode.removeChild(cta.row);
    } else {
      if (cta.el.parentNode !== cta.row) cta.row.appendChild(cta.el);
      var foot = document.querySelector('.edu-foot');
      if (foot && foot.parentNode && cta.row.nextSibling !== foot) foot.parentNode.insertBefore(cta.row, foot);
      else if (!foot && !cta.row.parentNode) document.body.appendChild(cta.row);
    }
  }
  function ctaRefresh() {
    if (!cta.el) return;
    var a = cta.el.querySelector('.edu-cta-link');
    if (a) { a.href = ROOT + 'index.html?lang=' + state.lang + '#updates'; a.title = t('shell_cta'); }
  }
  function ctaHide(days) {
    var st = store('cta');
    if (days) st.set('off', Date.now() + days * CTA_DAY);
    if (cta.el && cta.el.parentNode) cta.el.parentNode.removeChild(cta.el);
    if (cta.row && cta.row.parentNode) cta.row.parentNode.removeChild(cta.row);
    if (shell.top) shell.top.classList.remove('edu-cta-on');
    cta.el = null;
  }
  function ctaShow() {
    if (cta.shown) return;
    cta.shown = true;
    var link = el('a', { class: 'edu-cta-link', id: 'edu-cta-link' },
      el('span', { class: 'edu-cta-ic', 'aria-hidden': 'true', text: '📩' }),
      el('span', { class: 'edu-cta-txt', 'data-i18n': 'shell_cta', text: t('shell_cta') }));
    link.addEventListener('click', function () { store('cta').set('off', Date.now() + 7 * CTA_DAY); });
    var x = el('button', { type: 'button', class: 'edu-cta-x', id: 'edu-cta-x', 'data-i18n-aria-label': 'shell_cta_hide', 'data-i18n-title': 'shell_cta_hide', 'aria-label': t('shell_cta_hide'), title: t('shell_cta_hide'), text: '✕' });
    x.addEventListener('click', function () { ctaHide(30); });
    cta.el = el('div', { class: 'edu-cta no-print', id: 'edu-cta' }, link, x);
    cta.row = el('div', { class: 'edu-cta-row no-print', id: 'edu-cta-row' });
    try { cta.mq = window.matchMedia ? matchMedia('(min-width: 1100px)') : null; } catch (e) { cta.mq = null; }
    if (cta.mq && cta.mq.addEventListener) cta.mq.addEventListener('change', ctaPlace);
    ctaRefresh();
    ctaPlace();
  }
  function ctaInit() {
    if (!/^https?:$/.test(location.protocol)) return;
    var st = store('cta');
    var views = (Number(st.get('views', 0)) || 0) + 1;
    st.set('views', views);
    if (state.home || !state.slug || CTA_SKIP.indexOf(state.slug) >= 0) return;
    if (!/\/apps\/[^\/]+\/(index\.html)?$/.test(location.pathname)) return;
    if (document.querySelector('[data-signup]')) return;
    try { if (window.self !== window.top) return; } catch (e) { return; }
    if (ctaBlocked(st)) return;
    var engaged = 0, waited = 0, lastAct = 0, timer = null, EVS = ['pointerdown', 'keydown', 'wheel', 'scroll', 'input'];
    function act() { lastAct = Date.now(); }
    function stop() { clearInterval(timer); EVS.forEach(function (ev) { window.removeEventListener(ev, act, true); }); }
    EVS.forEach(function (ev) { window.addEventListener(ev, act, { capture: true, passive: true }); });
    timer = setInterval(function () {
      if (document.hidden) return;
      waited += 3;
      if (Date.now() - lastAct < 15000) engaged += 3;
      if (!(views >= 2 ? waited >= 6 : engaged >= 45)) return;
      if (ctaBlocked(store('cta'))) { stop(); return; }   /* hidden or joined in another tab meanwhile */
      if (ctaPresenting()) return;                       /* wait until full screen / projector mode ends */
      stop();
      ctaShow();
    }, 3000);
  }

  /* EDU.init({ slug, title:'app_title', wide:false, home:false, onLang: fn, waKey: 'shell_wa_msg', sharePath: '' })
     waKey: string key of the header "Share on WhatsApp" message ({title} and {url} are filled in).
     Apps for work, marketing and everyday use pass waKey: 'shell_wa_tool' ("a free tool" instead of "a learning app"). */
  function init(opts) {
    opts = opts || {};
    state.slug = opts.slug || '';
    state.home = !!opts.home;
    state.waKey = opts.waKey || 'shell_wa_msg';
    state.sharePath = opts.sharePath || '';
    state.titleKey = opts.title === undefined ? 'app_title' : opts.title;
    state.strings = opts.strings || window.APP_STRINGS || {};
    applyLangAttrs();
    var main = document.getElementById('app') || document.querySelector('main');
    if (!main) { main = el('main', { id: 'app' }); document.body.appendChild(main); }
    main.classList.add('edu-main');
    if (opts.wide) { main.classList.add('edu-wide'); document.body.classList.add('edu-wide-page'); }
    buildShell(opts);
    apply(document);
    refreshShell();
    if (opts.onLang) onLang(opts.onLang);
    registerSW();
    try { ctaInit(); } catch (e) { }
    window.EDU_READY = true;
    return main;
  }

  window.EDU = {
    LANGS: LANGS, COMMON: COMMON, ROOT: ROOT, YOUTUBE: YOUTUBE, SITE: SITE, shareUrl: shareUrl, waLink: waLink,
    init: init, t: t, has: has, apply: apply, setLang: setLang, onLang: onLang,
    get lang() { return state.lang; },
    langInfo: langInfo,
    store: store, el: el, $: $, $$: $$, esc: esc,
    toast: toast, modal: modal,
    download: download, downloadCanvas: downloadCanvas, pickFile: pickFile, readText: readText,
    copy: copy, share: share, pack: pack, unpack: unpack, csv: csv,
    fmt: fmt, randInt: randInt, shuffle: shuffle, pick: pick, clamp: clamp,
    getVoices: getVoices, voiceFor: voiceFor, speak: speak, stopSpeaking: stopSpeaking, recognizer: recognizer,
    fullscreen: fullscreen, setTheme: setTheme, theme: effectiveTheme, onTheme: function (fn) { themeListeners.push(fn); }, css: cssVar
  };
})();
