/* Alphabet Explorer: letter data for 10 Indian scripts + English.
   verify-allow-mixed-scripts  (this file intentionally contains every script)

   Each script:
     name   string key of the script name (strings.js)      glyph  sample letter for the picker
     voice  speech languages to try, in order                 font / stack  web font + offline fallbacks
     uses   languages written in this script (ln_* keys)     lh     line height that suits the script
     groups [{ id, label, native, rows: ['space separated letters', ...] }]   one row = free grid
     L      { letter: 'roman|example word|emoji|word roman|flags|say' }
              flags: m = the letter comes inside / at the end of the example word
                     c = vowel carrier (Gurmukhi ੳ ਅ ੲ), not used as a consonant base
                     r = rarely used, no everyday example word
              say:   text to speak instead of the letter (letter names, e.g. Urdu)
     signs  { tab, head, marks ('-' = inherent vowel), roman, bases (optional) }
     same   'a b|c d e' groups of letters that sound the same in that language (e.g. Bengali জ য):
            the listening game never offers two of them in one round, so there is one right answer
   Example words are everyday words a primary child knows; roman = a simple sound guide. */
window.AE_DATA = { order: ['deva', 'beng', 'guru', 'gujr', 'orya', 'taml', 'telu', 'knda', 'mlym', 'arab', 'latn'], scripts: {} };

window.AE_DATA.scripts.deva = {
  name: 'sc_deva', glyph: 'अ', voice: ['hi', 'mr'], font: 'Noto Sans Devanagari',
  stack: '"Noto Sans Devanagari", "Nirmala UI", "Mangal", "Kohinoor Devanagari", "Lohit Devanagari", sans-serif',
  uses: ['hi', 'mr', 'sa', 'ne'], lh: 1.5,
  groups: [
    { id: 'vowels', label: 'g_vowels', native: 'स्वर', rows: ['अ आ इ ई उ ऊ ऋ ए ऐ ओ औ'] },
    { id: 'consonants', label: 'g_consonants', native: 'व्यंजन', rows: ['क ख ग घ ङ', 'च छ ज झ ञ', 'ट ठ ड ढ ण', 'त थ द ध न', 'प फ ब भ म', 'य र ल व', 'श ष स ह'] },
    { id: 'extra', label: 'g_extra', native: 'अयोगवाह · संयुक्त व्यंजन · ड़ ढ़', rows: ['अं अः क्ष त्र ज्ञ श्र ड़ ढ़ ऑ ळ'] }
  ],
  L: {
    'अ': 'a|अनानास|🍍|anānās', 'आ': 'ā|आम|🥭|ām', 'इ': 'i|इमारत|🏢|imārat', 'ई': 'ī|ईंट|🧱|īnṭ',
    'उ': 'u|उल्लू|🦉|ullū', 'ऊ': 'ū|ऊन|🧶|ūn', 'ऋ': 'ṛi|ऋषि|🧘|ṛiṣhi', 'ए': 'e|एक|1️⃣|ek',
    'ऐ': 'ai|ऐनक|👓|ainak', 'ओ': 'o|ओस|💧|os', 'औ': 'au|औरत|👩|aurat',
    'क': 'ka|कबूतर|🕊️|kabūtar', 'ख': 'kha|खरगोश|🐰|khargosh', 'ग': 'ga|गाय|🐄|gāy', 'घ': 'gha|घर|🏠|ghar',
    'ङ': 'ṅa|अङ्क|🔢|aṅk|m', 'च': 'cha|चम्मच|🥄|chammach', 'छ': 'chha|छतरी|☂️|chhatrī', 'ज': 'ja|जहाज़|🚢|jahāz',
    'झ': 'jha|झंडा|🚩|jhaṇḍā', 'ञ': 'ña|पञ्जा|🖐️|pañjā|m', 'ट': 'ṭa|टमाटर|🍅|ṭamāṭar', 'ठ': 'ṭha|ठंड|❄️|ṭhaṇḍ',
    'ड': 'ḍa|डाकिया|📮|ḍākiyā', 'ढ': 'ḍha|ढोल|🥁|ḍhol', 'ण': 'ṇa|हिरण|🦌|hiraṇ|m', 'त': 'ta|तरबूज़|🍉|tarbūz',
    'थ': 'tha|थाली|🍽️|thālī', 'द': 'da|दरवाज़ा|🚪|darvāzā', 'ध': 'dha|धनुष|🏹|dhanuṣh', 'न': 'na|नाव|⛵|nāv',
    'प': 'pa|पतंग|🪁|patang', 'फ': 'pha|फूल|🌺|phūl', 'ब': 'ba|बत्तख|🦆|battakh', 'भ': 'bha|भालू|🐻|bhālū',
    'म': 'ma|मछली|🐟|machhlī', 'य': 'ya|यान|🚀|yān', 'र': 'ra|रेल|🚆|rel', 'ल': 'la|लहसुन|🧄|lahsun',
    'व': 'va|वर्षा|🌧️|varṣhā', 'श': 'sha|शेर|🦁|sher', 'ष': 'ṣha|षट्कोण|⬡|ṣhaṭkoṇ', 'स': 'sa|सेब|🍎|seb',
    'ह': 'ha|हाथी|🐘|hāthī',
    'अं': 'aṃ|अंगूर|🍇|aṅgūr', 'अः': 'aḥ|प्रातः|🌅|prātaḥ|m', 'क्ष': 'kṣha|कक्षा|🏫|kakṣhā|m', 'त्र': 'tra|त्रिशूल|🔱|trishūl',
    'ज्ञ': 'gya|ज्ञान|📚|gyān', 'श्र': 'shra|श्रमिक|👷|shramik', 'ड़': 'ṛa|पेड़|🌳|peṛ|m', 'ढ़': 'ṛha|पढ़ना|📖|paṛhnā|m',
    'ऑ': 'ŏ|ऑटो|🛺|ŏṭo', 'ळ': 'ḷa|बाळ|👶|bāḷ|m'
  },
  same: 'श ष',
  signs: { tab: 'tab_signs', head: 'अ आ इ ई उ ऊ ऋ ए ऐ ओ औ अं अः', marks: '- ा ि ी ु ू ृ े ै ो ौ ं ः',
    roman: 'a ā i ī u ū ṛi e ai o au aṃ aḥ' }
};

window.AE_DATA.scripts.beng = {
  name: 'sc_beng', glyph: 'অ', voice: ['bn'], font: 'Noto Sans Bengali',
  stack: '"Noto Sans Bengali", "Nirmala UI", "Vrinda", "Shonar Bangla", "Kohinoor Bangla", sans-serif',
  uses: ['bn', 'as'], lh: 1.5,
  groups: [
    { id: 'vowels', label: 'g_vowels', native: 'স্বরবর্ণ', rows: ['অ আ ই ঈ উ ঊ ঋ এ ঐ ও ঔ'] },
    { id: 'consonants', label: 'g_consonants', native: 'ব্যঞ্জনবর্ণ', rows: ['ক খ গ ঘ ঙ', 'চ ছ জ ঝ ঞ', 'ট ঠ ড ঢ ণ', 'ত থ দ ধ ন', 'প ফ ব ভ ম', 'য র ল', 'শ ষ স হ', 'ড় ঢ় য়'] },
    { id: 'extra', label: 'g_extra', native: 'ৎ ং ঃ ঁ · যুক্তবর্ণ', rows: ['ৎ ং ঃ ঁ ক্ষ'] }
  ],
  L: {
    'অ': 'ô|অজগর|🐍|ôjôgôr', 'আ': 'ā|আম|🥭|ām', 'ই': 'i|ইঁদুর|🐭|ĩdur', 'ঈ': 'ī|ঈগল|🦅|īgôl',
    'উ': 'u|উট|🐫|uṭ', 'ঊ': 'ū|ঊষা|🌅|ūṣā', 'ঋ': 'ri|ঋষি|🧘|riṣi', 'এ': 'e|এক|1️⃣|ek',
    'ঐ': 'oi|ঐরাবত|🐘|oirābôt', 'ও': 'o|ওজন|⚖️|ojôn', 'ঔ': 'ou|ঔষধ|💊|ouṣôdh',
    'ক': 'kô|কলা|🍌|kôlā', 'খ': 'khô|খরগোশ|🐰|khôrgosh', 'গ': 'gô|গরু|🐄|gôru', 'ঘ': 'ghô|ঘড়ি|⏰|ghôṛi',
    'ঙ': 'ṅô|ব্যাঙ|🐸|byāṅ|m', 'চ': 'chô|চশমা|👓|chôshmā', 'ছ': 'chhô|ছাতা|☂️|chhātā', 'জ': 'jô|জাহাজ|🚢|jāhāj',
    'ঝ': 'jhô|ঝুড়ি|🧺|jhuṛi', 'ঞ': 'ñô|ইঞ্জিন|🚂|iñjin|m', 'ট': 'ṭô|টমেটো|🍅|ṭômeṭo', 'ঠ': 'ṭhô|ঠাকুমা|👵|ṭhākumā',
    'ড': 'ḍô|ডাব|🥥|ḍāb', 'ঢ': 'ḍhô|ঢোল|🥁|ḍhol', 'ণ': 'ṇô|হরিণ|🦌|hôriṇ|m', 'ত': 'tô|তরমুজ|🍉|tôrmuj',
    'থ': 'thô|থালা|🍽️|thālā', 'দ': 'dô|দরজা|🚪|dôrjā', 'ধ': 'dhô|ধনুক|🏹|dhônuk', 'ন': 'nô|নৌকা|⛵|noukā',
    'প': 'pô|পাখি|🐦|pākhi', 'ফ': 'phô|ফুল|🌺|phul', 'ব': 'bô|বই|📖|bôi', 'ভ': 'bhô|ভালুক|🐻|bhāluk',
    'ম': 'mô|মাছ|🐟|māchh', 'য': 'jô|যব|🌾|jôb', 'র': 'rô|রাজা|🤴|rājā', 'ল': 'lô|লেবু|🍋|lebu',
    'শ': 'shô|শসা|🥒|shôsā', 'ষ': 'ṣô|ষাঁড়|🐂|ṣãṛ', 'স': 'sô|সূর্য|☀️|surjô', 'হ': 'hô|হাঁস|🦆|hãs',
    'ড়': 'ṛô|পাহাড়|⛰️|pāhāṛ|m', 'ঢ়': 'ṛhô|আষাঢ়|🌧️|āṣāṛh|m', 'য়': 'yô|ময়ূর|🦚|môyur|m',
    'ৎ': 't|বিদ্যুৎ|⚡|bidyut|m|খণ্ড ত', 'ং': 'ṅ|রং|🎨|rôṅ|m|অনুস্বার', 'ঃ': 'ḥ|দুঃখ|😢|duḥkhô|m|বিসর্গ', 'ঁ': '~|চাঁদ|🌙|chãd|m|চন্দ্রবিন্দু',
    'ক্ষ': 'kṣô|ক্ষেত|🌾|kṣet'
  },
  same: 'ই ঈ|উ ঊ|জ য|ন ণ|শ ষ স|ড় ঢ়',
  signs: { tab: 'tab_signs', head: 'অ আ ই ঈ উ ঊ ঋ এ ঐ ও ঔ', marks: '- া ি ী ু ূ ৃ ে ৈ ো ৌ',
    roman: 'ô ā i ī u ū ri e oi o ou' }
};

window.AE_DATA.scripts.guru = {
  name: 'sc_guru', glyph: 'ੳ', voice: ['pa'], font: 'Noto Sans Gurmukhi',
  stack: '"Noto Sans Gurmukhi", "Nirmala UI", "Raavi", "Gurmukhi MN", "Lohit Gurmukhi", sans-serif',
  uses: ['pa'], lh: 1.5,
  groups: [
    { id: 'vowels', label: 'g_vowels', native: 'ਸਵਰ', rows: ['ਅ ਆ ਇ ਈ ਉ ਊ ਏ ਐ ਓ ਔ'] },
    { id: 'consonants', label: 'g_consonants', native: 'ਪੈਂਤੀ ਅੱਖਰੀ', rows: ['ੳ ਅ ੲ ਸ ਹ', 'ਕ ਖ ਗ ਘ ਙ', 'ਚ ਛ ਜ ਝ ਞ', 'ਟ ਠ ਡ ਢ ਣ', 'ਤ ਥ ਦ ਧ ਨ', 'ਪ ਫ ਬ ਭ ਮ', 'ਯ ਰ ਲ ਵ ੜ'] },
    { id: 'extra', label: 'g_extra', native: 'ਪੈਰ ਬਿੰਦੀ ਵਾਲੇ ਅੱਖਰ · ਬਿੰਦੀ · ਟਿੱਪੀ · ਅੱਧਕ', rows: ['ਸ਼ ਖ਼ ਗ਼ ਜ਼ ਫ਼ ਲ਼ ਂ ੰ ੱ'] }
  ],
  L: {
    'ਅ': 'a|ਅੰਬ|🥭|amb|c', 'ਆ': 'ā|ਆਲੂ|🥔|ālū', 'ਇ': 'i|ਇੱਟ|🧱|iṭṭ', 'ਈ': 'ī|ਈਮੇਲ|📧|īmel',
    'ਉ': 'u|ਉੱਲੂ|🦉|ullū', 'ਊ': 'ū|ਊਠ|🐫|ūṭh', 'ਏ': 'e|ਏਕਤਾ|🤝|ektā', 'ਐ': 'ai|ਐਨਕ|👓|ainak',
    'ਓ': 'o|ਓਸ|💧|os', 'ਔ': 'au|ਔਰਤ|👩|aurat',
    'ੳ': 'ūṛā|ਉੱਲੂ|🦉|ullū|c|ਊੜਾ', 'ੲ': 'īṛī|ਇੱਟ|🧱|iṭṭ|c|ਈੜੀ', 'ਸ': 'sa|ਸੇਬ|🍎|seb', 'ਹ': 'ha|ਹਾਥੀ|🐘|hāthī',
    'ਕ': 'ka|ਕਬੂਤਰ|🕊️|kabūtar', 'ਖ': 'kha|ਖਰਗੋਸ਼|🐰|khargosh', 'ਗ': 'ga|ਗਾਂ|🐄|gā̃', 'ਘ': 'gha|ਘਰ|🏠|ghar',
    'ਙ': 'ṅa||||r', 'ਚ': 'cha|ਚਮਚਾ|🥄|chamchā', 'ਛ': 'chha|ਛਤਰੀ|☂️|chhatrī', 'ਜ': 'ja|ਜਹਾਜ਼|🚢|jahāz',
    'ਝ': 'jha|ਝੰਡਾ|🚩|jhaṇḍā', 'ਞ': 'ña||||r', 'ਟ': 'ṭa|ਟਮਾਟਰ|🍅|ṭamāṭar', 'ਠ': 'ṭha|ਠੰਢ|❄️|ṭhaṇḍh',
    'ਡ': 'ḍa|ਡੱਬਾ|📦|ḍabbā', 'ਢ': 'ḍha|ਢੋਲ|🥁|ḍhol', 'ਣ': 'ṇa|ਪਾਣੀ|💧|pāṇī|m', 'ਤ': 'ta|ਤਰਬੂਜ਼|🍉|tarbūz',
    'ਥ': 'tha|ਥਾਲੀ|🍽️|thālī', 'ਦ': 'da|ਦਰਵਾਜ਼ਾ|🚪|darvāzā', 'ਧ': 'dha|ਧਨੁਸ਼|🏹|dhanush', 'ਨ': 'na|ਨਲਕਾ|🚰|nalkā',
    'ਪ': 'pa|ਪਤੰਗ|🪁|patang', 'ਫ': 'pha|ਫੁੱਲ|🌺|phull', 'ਬ': 'ba|ਬੱਤਖ਼|🦆|battakh', 'ਭ': 'bha|ਭਾਲੂ|🐻|bhālū',
    'ਮ': 'ma|ਮੱਛੀ|🐟|machchhī', 'ਯ': 'ya|ਯੋਗ|🧘|yog', 'ਰ': 'ra|ਰੇਲ|🚆|rel', 'ਲ': 'la|ਲਸਣ|🧄|lasaṇ',
    'ਵ': 'va|ਵਰਖਾ|🌧️|varkhā', 'ੜ': 'ṛa|ਪਹਾੜ|⛰️|pahāṛ|m',
    'ਸ਼': 'sha|ਸ਼ੇਰ|🦁|sher', 'ਖ਼': 'ḵha|ਖ਼ਤ|✉️|ḵhat', 'ਗ਼': 'ġa|ਗ਼ੁਬਾਰਾ|🎈|ġubārā', 'ਜ਼': 'za|ਜ਼ੈਬਰਾ|🦓|zaibrā',
    'ਫ਼': 'fa|ਫ਼ੌਜੀ|🪖|faujī', 'ਲ਼': 'ḷa||||r', 'ਂ': 'ṁ|ਮੈਂ|🙋|maiṁ|m|ਬਿੰਦੀ', 'ੰ': 'ṃ|ਅੰਬ|🥭|amb|m|ਟਿੱਪੀ', 'ੱ': '|ਪੱਤਾ|🍃|pattā|m|ਅੱਧਕ'
  },
  signs: { tab: 'tab_signs', head: 'ਅ ਆ ਇ ਈ ਉ ਊ ਏ ਐ ਓ ਔ ਅੰ', marks: '- ਾ ਿ ੀ ੁ ੂ ੇ ੈ ੋ ੌ ੰ',
    roman: 'a ā i ī u ū e ai o au aṃ' }
};

window.AE_DATA.scripts.gujr = {
  name: 'sc_gujr', glyph: 'અ', voice: ['gu'], font: 'Noto Sans Gujarati',
  stack: '"Noto Sans Gujarati", "Nirmala UI", "Shruti", "Gujarati Sangam MN", "Lohit Gujarati", sans-serif',
  uses: ['gu'], lh: 1.5,
  groups: [
    { id: 'vowels', label: 'g_vowels', native: 'સ્વર', rows: ['અ આ ઇ ઈ ઉ ઊ ઋ એ ઐ ઓ ઔ'] },
    { id: 'consonants', label: 'g_consonants', native: 'વ્યંજન', rows: ['ક ખ ગ ઘ ઙ', 'ચ છ જ ઝ ઞ', 'ટ ઠ ડ ઢ ણ', 'ત થ દ ધ ન', 'પ ફ બ ભ મ', 'ય ર લ વ', 'શ ષ સ હ ળ'] },
    { id: 'extra', label: 'g_extra', native: 'અનુસ્વાર · વિસર્ગ · જોડાક્ષર', rows: ['અં અઃ ક્ષ જ્ઞ'] }
  ],
  L: {
    'અ': 'a|અનાનસ|🍍|anānas', 'આ': 'ā|આગગાડી|🚂|āggāḍī', 'ઇ': 'i|ઇયળ|🐛|iyaḷ', 'ઈ': 'ī|ઈંટ|🧱|īnṭ',
    'ઉ': 'u|ઉંદર|🐭|undar', 'ઊ': 'ū|ઊન|🧶|ūn', 'ઋ': 'ṛu|ઋષિ|🧘|ṛuṣi', 'એ': 'e|એક|1️⃣|ek',
    'ઐ': 'ai|ઐરાવત|🐘|airāvat', 'ઓ': 'o|ઓશીકું|🛏️|oshīkũ', 'ઔ': 'au|ઔષધ|💊|auṣadh',
    'ક': 'ka|કલમ|🖊️|kalam', 'ખ': 'kha|ખુરશી|🪑|khurshī', 'ગ': 'ga|ગાય|🐄|gāy', 'ઘ': 'gha|ઘર|🏠|ghar',
    'ઙ': 'ṅa||||r', 'ચ': 'cha|ચકલી|🐦|chakalī', 'છ': 'chha|છત્રી|☂️|chhatrī', 'જ': 'ja|જહાજ|🚢|jahāj',
    'ઝ': 'jha|ઝાડ|🌳|jhāḍ', 'ઞ': 'ña||||r', 'ટ': 'ṭa|ટમેટું|🍅|ṭameṭũ', 'ઠ': 'ṭha|ઠંડી|❄️|ṭhaṇḍī',
    'ડ': 'ḍa|ડબ્બો|📦|ḍabbo', 'ઢ': 'ḍha|ઢોલ|🥁|ḍhol', 'ણ': 'ṇa|બાણ|🏹|bāṇ|m', 'ત': 'ta|તડબૂચ|🍉|taḍbūch',
    'થ': 'tha|થાળી|🍽️|thāḷī', 'દ': 'da|દડો|⚽|daḍo', 'ધ': 'dha|ધજા|🚩|dhajā', 'ન': 'na|નાક|👃|nāk',
    'પ': 'pa|પતંગ|🪁|patang', 'ફ': 'pha|ફૂલ|🌺|phūl', 'બ': 'ba|બતક|🦆|batak', 'ભ': 'bha|ભમરો|🐝|bhamro',
    'મ': 'ma|મરચું|🌶️|marchũ', 'ય': 'ya|યાન|🚀|yān', 'ર': 'ra|રમકડું|🧸|ramakḍũ', 'લ': 'la|લસણ|🧄|lasaṇ',
    'વ': 'va|વહાણ|⛵|vahāṇ', 'શ': 'sha|શરણાઈ|🎺|sharṇāī', 'ષ': 'ṣa|ષટ્કોણ|⬡|ṣaṭkoṇ', 'સ': 'sa|સસલું|🐰|sasalũ',
    'હ': 'ha|હરણ|🦌|haraṇ', 'ળ': 'ḷa|નળ|🚰|naḷ|m',
    'અં': 'aṃ|અંક|🔢|aṅk', 'અઃ': 'aḥ|દુઃખ|😢|duḥkh|m', 'ક્ષ': 'kṣa|ક્ષિતિજ|🌅|kṣitij', 'જ્ઞ': 'gña|જ્ઞાન|📚|gnān'
  },
  same: 'શ ષ',
  signs: { tab: 'tab_signs', head: 'અ આ ઇ ઈ ઉ ઊ ઋ એ ઐ ઓ ઔ અં અઃ', marks: '- ા િ ી ુ ૂ ૃ ે ૈ ો ૌ ં ઃ',
    roman: 'a ā i ī u ū ṛu e ai o au aṃ aḥ' }
};

window.AE_DATA.scripts.orya = {
  name: 'sc_orya', glyph: 'ଅ', voice: ['or'], font: 'Noto Sans Oriya',
  stack: '"Noto Sans Oriya", "Noto Sans Odia", "Nirmala UI", "Kalinga", "Oriya Sangam MN", "Lohit Odia", sans-serif',
  uses: ['or'], lh: 1.55,
  groups: [
    { id: 'vowels', label: 'g_vowels', native: 'ସ୍ୱରବର୍ଣ୍ଣ', rows: ['ଅ ଆ ଇ ଈ ଉ ଊ ଋ ଏ ଐ ଓ ଔ'] },
    { id: 'consonants', label: 'g_consonants', native: 'ବ୍ୟଞ୍ଜନବର୍ଣ୍ଣ', rows: ['କ ଖ ଗ ଘ ଙ', 'ଚ ଛ ଜ ଝ ଞ', 'ଟ ଠ ଡ ଢ ଣ', 'ତ ଥ ଦ ଧ ନ', 'ପ ଫ ବ ଭ ମ', 'ଯ ୟ ର ଲ ଳ ୱ', 'ଶ ଷ ସ ହ'] },
    { id: 'extra', label: 'g_extra', native: 'ଅନୁସ୍ୱାର · ବିସର୍ଗ · ଚନ୍ଦ୍ରବିନ୍ଦୁ · କ୍ଷ ଡ଼ ଢ଼', rows: ['ଅଂ ଅଃ ଅଁ କ୍ଷ ଡ଼ ଢ଼'] }
  ],
  L: {
    'ଅ': 'ô|ଅଙ୍ଗୁର|🍇|ôṅgur', 'ଆ': 'ā|ଆମ୍ବ|🥭|āmbô', 'ଇ': 'i|ଇଟା|🧱|iṭā', 'ଈ': 'ī|ଈଗଲ|🦅|īgôl',
    'ଉ': 'u|ଉଡ଼ାଜାହାଜ|✈️|uṛājāhāj', 'ଊ': 'ū|ଊର୍ମି|🌊|ūrmi', 'ଋ': 'ru|ଋଷି|🧘|ruṣi', 'ଏ': 'e|ଏକ|1️⃣|ekô',
    'ଐ': 'oi|ଐରାବତ|🐘|oirābôtô', 'ଓ': 'o|ଓଟ|🐫|oṭô', 'ଔ': 'ou|ଔଷଧ|💊|ouṣôdhô',
    'କ': 'kô|କଦଳୀ|🍌|kôdôḷī', 'ଖ': 'khô|ଖଟ|🛏️|khôṭô', 'ଗ': 'gô|ଗାଈ|🐄|gāī', 'ଘ': 'ghô|ଘର|🏠|ghôrô',
    'ଙ': 'ṅô|ବେଙ୍ଗ|🐸|beṅgô|m', 'ଚ': 'chô|ଚାମଚ|🥄|chāmôchô', 'ଛ': 'chhô|ଛତା|☂️|chhôtā', 'ଜ': 'jô|ଜାହାଜ|🚢|jāhājô',
    'ଝ': 'jhô|ଝିଅ|👧|jhiô', 'ଞ': 'ñô||||r', 'ଟ': 'ṭô|ଟମାଟୋ|🍅|ṭômāṭo', 'ଠ': 'ṭhô|ଠେକୁଆ|🐰|ṭhekuā',
    'ଡ': 'ḍô|ଡଙ୍ଗା|⛵|ḍôṅgā', 'ଢ': 'ḍhô|ଢୋଲ|🥁|ḍhol', 'ଣ': 'ṇô|ହରିଣ|🦌|hôriṇô|m', 'ତ': 'tô|ତରଭୁଜ|🍉|tôrôbhujô',
    'ଥ': 'thô|ଥାଳି|🍽️|thāḷi', 'ଦ': 'dô|ଦାନ୍ତ|🦷|dāntô', 'ଧ': 'dhô|ଧନୁ|🏹|dhônu', 'ନ': 'nô|ନଡ଼ିଆ|🥥|nôṛiā',
    'ପ': 'pô|ପାଣି|💧|pāṇi', 'ଫ': 'phô|ଫୁଲ|🌺|phulô', 'ବ': 'bô|ବହି|📖|bôhi', 'ଭ': 'bhô|ଭାଲୁ|🐻|bhālu',
    'ମ': 'mô|ମାଛ|🐟|māchhô', 'ଯ': 'jô|ଯନ୍ତ୍ର|⚙️|jôntrô', 'ୟ': 'yô|ମୟୂର|🦚|môyurô|m', 'ର': 'rô|ରାଜା|🤴|rājā',
    'ଲ': 'lô|ଲେମ୍ବୁ|🍋|lembu', 'ଳ': 'ḷô|ଫଳ|🍎|phôḷô|m', 'ୱ': 'wô||||r',
    'ଶ': 'shô|ଶଙ୍ଖ|🐚|shôṅkhô', 'ଷ': 'ṣô|ଷଣ୍ଢ|🐂|ṣôṇḍhô', 'ସ': 'sô|ସାପ|🐍|sāpô', 'ହ': 'hô|ହଂସ|🦢|hôṃsô',
    'ଅଂ': 'ôṃ|ସିଂହ|🦁|siṃhô|m', 'ଅଃ': 'ôḥ|ଦୁଃଖ|😢|duḥkhô|m', 'ଅଁ': 'õ|ହଁ|👍|hõ|m',
    'କ୍ଷ': 'kṣô|କ୍ଷୀର|🥛|kṣīrô', 'ଡ଼': 'ṛô|ଘଡ଼ି|⏰|ghôṛi|m', 'ଢ଼': 'ṛhô|ଚଢ଼େଇ|🐦|chôṛhei|m'
  },
  same: 'ଇ ଈ|ଉ ଊ|ଜ ଯ|ଶ ଷ ସ',
  signs: { tab: 'tab_signs', head: 'ଅ ଆ ଇ ଈ ଉ ଊ ଋ ଏ ଐ ଓ ଔ ଅଂ ଅଃ', marks: '- ା ି ୀ ୁ ୂ ୃ େ ୈ ୋ ୌ ଂ ଃ',
    roman: 'ô ā i ī u ū ru e oi o ou ôṃ ôḥ' }
};

window.AE_DATA.scripts.taml = {
  name: 'sc_taml', glyph: 'அ', voice: ['ta'], font: 'Noto Sans Tamil',
  stack: '"Noto Sans Tamil", "Nirmala UI", "Latha", "Tamil Sangam MN", "Lohit Tamil", sans-serif',
  uses: ['ta'], lh: 1.45,
  groups: [
    { id: 'vowels', label: 'g_vowels', native: 'உயிர் எழுத்துகள்', rows: ['அ ஆ இ ஈ உ ஊ எ ஏ ஐ ஒ ஓ ஔ'] },
    { id: 'consonants', label: 'g_consonants', native: 'மெய் எழுத்துகள்', rows: ['க் ங் ச் ஞ் ட் ண்', 'த் ந் ப் ம் ய் ர்', 'ல் வ் ழ் ள் ற் ன்'] },
    { id: 'extra', label: 'g_extra', native: 'ஆய்த எழுத்து · கிரந்த எழுத்துகள்', rows: ['ஃ ஜ ஷ ஸ ஹ க்ஷ ஸ்ரீ'] }
  ],
  L: {
    'அ': 'a|அம்மா|👩|ammā', 'ஆ': 'ā|ஆடு|🐐|āṭu', 'இ': 'i|இலை|🍃|ilai', 'ஈ': 'ī|ஈ|🪰|ī',
    'உ': 'u|உப்பு|🧂|uppu', 'ஊ': 'ū|ஊசி|🪡|ūsi', 'எ': 'e|எலி|🐭|eli', 'ஏ': 'ē|ஏணி|🪜|ēṇi',
    'ஐ': 'ai|ஐந்து|5️⃣|aintu', 'ஒ': 'o|ஒட்டகம்|🐫|oṭṭakam', 'ஓ': 'ō|ஓடம்|⛵|ōṭam', 'ஔ': 'au|ஔவையார்|👵|auvaiyār',
    'க்': 'k|தக்காளி|🍅|takkāḷi|m|இக்', 'ங்': 'ṅ|சங்கு|🐚|saṅku|m|இங்', 'ச்': 'ch|பூச்சி|🐛|pūchchi|m|இச்',
    'ஞ்': 'ñ|மஞ்சள்|🟡|mañjaḷ|m|இஞ்', 'ட்': 'ṭ|பட்டம்|🪁|paṭṭam|m|இட்', 'ண்': 'ṇ|கண்|👁️|kaṇ|m|இண்',
    'த்': 't|பத்து|🔟|pattu|m|இத்', 'ந்': 'n|பந்து|⚽|pantu|m|இந்', 'ப்': 'p|கப்பல்|🚢|kappal|m|இப்',
    'ம்': 'm|மரம்|🌳|maram|m|இம்', 'ய்': 'y|நாய்|🐕|nāy|m|இய்', 'ர்': 'r|கார்|🚗|kār|m|இர்',
    'ல்': 'l|பல்|🦷|pal|m|இல்', 'வ்': 'v|செவ்வந்தி|🌼|sevvanti|m|இவ்', 'ழ்': 'ḻ|கூழ்|🥣|kūḻ|m|இழ்',
    'ள்': 'ḷ|தேள்|🦂|tēḷ|m|இள்', 'ற்': 'ṟ|காற்று|🌬️|kāṟṟu|m|இற்', 'ன்': 'ṉ|மீன்|🐟|mīṉ|m|இன்',
    'ஃ': 'akh|எஃகு|🔩|ekhku|m', 'ஜ': 'ja|ஜன்னல்|🪟|jaṉṉal', 'ஷ': 'ṣa|ஷூ|👟|ṣū', 'ஸ': 'sa|ஸ்கூட்டர்|🛵|skūṭṭar',
    'ஹ': 'ha|ஹெலிகாப்டர்|🚁|helikāpṭar', 'க்ஷ': 'kṣa||||r', 'ஸ்ரீ': 'śrī||||r'
  },
  signs: { tab: 'tab_signs', head: 'அ ஆ இ ஈ உ ஊ எ ஏ ஐ ஒ ஓ ஔ', marks: '- ா ி ீ ு ூ ெ ே ை ொ ோ ௌ',
    roman: 'a ā i ī u ū e ē ai o ō au', bases: 'க ங ச ஞ ட ண த ந ப ம ய ர ல வ ழ ள ற ன' }
};

window.AE_DATA.scripts.telu = {
  name: 'sc_telu', glyph: 'అ', voice: ['te'], font: 'Noto Sans Telugu',
  stack: '"Noto Sans Telugu", "Nirmala UI", "Gautami", "Telugu Sangam MN", "Lohit Telugu", sans-serif',
  uses: ['te'], lh: 1.65,
  groups: [
    { id: 'vowels', label: 'g_vowels', native: 'అచ్చులు', rows: ['అ ఆ ఇ ఈ ఉ ఊ ఋ ౠ ఎ ఏ ఐ ఒ ఓ ఔ'] },
    { id: 'consonants', label: 'g_consonants', native: 'హల్లులు', rows: ['క ఖ గ ఘ ఙ', 'చ ఛ జ ఝ ఞ', 'ట ఠ డ ఢ ణ', 'త థ ద ధ న', 'ప ఫ బ భ మ', 'య ర ల వ', 'శ ష స హ', 'ళ క్ష ఱ'] },
    { id: 'extra', label: 'g_extra', native: 'ఉభయాక్షరాలు', rows: ['అం అః'] }
  ],
  L: {
    'అ': 'a|అమ్మ|👩|amma', 'ఆ': 'ā|ఆవు|🐄|āvu', 'ఇ': 'i|ఇల్లు|🏠|illu', 'ఈ': 'ī|ఈగ|🪰|īga',
    'ఉ': 'u|ఉడుత|🐿️|uḍuta', 'ఊ': 'ū|ఊరు|🏘️|ūru', 'ఋ': 'ṛu|ఋషి|🧘|ṛuṣi', 'ౠ': 'ṛū||||r',
    'ఎ': 'e|ఎలుక|🐭|eluka', 'ఏ': 'ē|ఏనుగు|🐘|ēnugu', 'ఐ': 'ai|ఐదు|5️⃣|aidu', 'ఒ': 'o|ఒంటె|🐫|onṭe',
    'ఓ': 'ō|ఓడ|🚢|ōḍa', 'ఔ': 'au|ఔషధం|💊|auṣadham',
    'క': 'ka|కప్ప|🐸|kappa', 'ఖ': 'kha|ఖడ్గం|⚔️|khaḍgam', 'గ': 'ga|గడియారం|⏰|gaḍiyāram', 'ఘ': 'gha|ఘంట|🔔|ghanṭa',
    'ఙ': 'ṅa||||r', 'చ': 'cha|చిలుక|🦜|chiluka', 'ఛ': 'chha|ఛత్రం|☂️|chhatram', 'జ': 'ja|జింక|🦌|jinka',
    'ఝ': 'jha||||r', 'ఞ': 'ña||||r', 'ట': 'ṭa|టమాటా|🍅|ṭamāṭā', 'ఠ': 'ṭha||||r',
    'డ': 'ḍa|డప్పు|🥁|ḍappu', 'ఢ': 'ḍha||||r', 'ణ': 'ṇa|బాణం|🏹|bāṇam|m', 'త': 'ta|తాబేలు|🐢|tābēlu',
    'థ': 'tha|కథ|📖|katha|m', 'ద': 'da|దీపం|🪔|dīpam', 'ధ': 'dha|ధాన్యం|🌾|dhānyam', 'న': 'na|నక్క|🦊|nakka',
    'ప': 'pa|పడవ|⛵|paḍava', 'ఫ': 'pha|ఫలం|🍎|phalam', 'బ': 'ba|బంతి|⚽|banti', 'భ': 'bha|భవనం|🏢|bhavanam',
    'మ': 'ma|మామిడి|🥭|māmiḍi', 'య': 'ya|యంత్రం|⚙️|yantram', 'ర': 'ra|రైలు|🚆|railu', 'ల': 'la|లారీ|🚚|lārī',
    'వ': 'va|వంతెన|🌉|vantena', 'శ': 'śa|శంఖం|🐚|śankham', 'ష': 'ṣa|వర్షం|🌧️|varṣam|m', 'స': 'sa|సింహం|🦁|simham',
    'హ': 'ha|హంస|🦢|hamsa', 'ళ': 'ḷa|తాళం|🔒|tāḷam|m', 'క్ష': 'kṣa|పక్షి|🐦|pakṣi|m', 'ఱ': 'ṟa||||r',
    'అం': 'aṃ|అంగడి|🏪|angaḍi', 'అః': 'aḥ|దుఃఖం|😢|duḥkham|m'
  },
  same: 'ర ఱ',
  signs: { tab: 'tab_signs', head: 'అ ఆ ఇ ఈ ఉ ఊ ఋ ౠ ఎ ఏ ఐ ఒ ఓ ఔ అం అః', marks: '- ా ి ీ ు ూ ృ ౄ ె ే ై ొ ో ౌ ం ః',
    roman: 'a ā i ī u ū ṛu ṛū e ē ai o ō au aṃ aḥ' }
};

window.AE_DATA.scripts.knda = {
  name: 'sc_knda', glyph: 'ಅ', voice: ['kn'], font: 'Noto Sans Kannada',
  stack: '"Noto Sans Kannada", "Nirmala UI", "Tunga", "Kannada Sangam MN", "Lohit Kannada", sans-serif',
  uses: ['kn'], lh: 1.65,
  groups: [
    { id: 'vowels', label: 'g_vowels', native: 'ಸ್ವರಗಳು', rows: ['ಅ ಆ ಇ ಈ ಉ ಊ ಋ ಎ ಏ ಐ ಒ ಓ ಔ'] },
    { id: 'consonants', label: 'g_consonants', native: 'ವ್ಯಂಜನಗಳು', rows: ['ಕ ಖ ಗ ಘ ಙ', 'ಚ ಛ ಜ ಝ ಞ', 'ಟ ಠ ಡ ಢ ಣ', 'ತ ಥ ದ ಧ ನ', 'ಪ ಫ ಬ ಭ ಮ', 'ಯ ರ ಲ ವ', 'ಶ ಷ ಸ ಹ ಳ'] },
    { id: 'extra', label: 'g_extra', native: 'ಯೋಗವಾಹಕಗಳು · ಸಂಯುಕ್ತಾಕ್ಷರ', rows: ['ಅಂ ಅಃ ಕ್ಷ ಜ್ಞ'] }
  ],
  L: {
    'ಅ': 'a|ಅಳಿಲು|🐿️|aḷilu', 'ಆ': 'ā|ಆನೆ|🐘|āne', 'ಇ': 'i|ಇಲಿ|🐭|ili', 'ಈ': 'ī|ಈಜು|🏊|īju',
    'ಉ': 'u|ಉಂಗುರ|💍|uṅgura', 'ಊ': 'ū|ಊಟ|🍛|ūṭa', 'ಋ': 'ṛu|ಋಷಿ|🧘|ṛuṣi', 'ಎ': 'e|ಎಲೆ|🍃|ele',
    'ಏ': 'ē|ಏಣಿ|🪜|ēṇi', 'ಐ': 'ai|ಐದು|5️⃣|aidu', 'ಒ': 'o|ಒಂಟೆ|🐫|oṇṭe', 'ಓ': 'ō|ಓಟ|🏃|ōṭa', 'ಔ': 'au|ಔಷಧ|💊|auṣadha',
    'ಕ': 'ka|ಕಪ್ಪೆ|🐸|kappe', 'ಖ': 'kha|ಖಡ್ಗ|⚔️|khaḍga', 'ಗ': 'ga|ಗಡಿಯಾರ|⏰|gaḍiyāra', 'ಘ': 'gha|ಘಂಟೆ|🔔|ghaṇṭe',
    'ಙ': 'ṅa||||r', 'ಚ': 'cha|ಚಮಚ|🥄|chamacha', 'ಛ': 'chha|ಛತ್ರಿ|☂️|chhatri', 'ಜ': 'ja|ಜಿಂಕೆ|🦌|jiṅke',
    'ಝ': 'jha||||r', 'ಞ': 'ña||||r', 'ಟ': 'ṭa|ಟೊಮೆಟೊ|🍅|ṭomeṭo', 'ಠ': 'ṭha||||r',
    'ಡ': 'ḍa|ಡಬ್ಬಿ|📦|ḍabbi', 'ಢ': 'ḍha|ಢಕ್ಕೆ|🥁|ḍhakke', 'ಣ': 'ṇa|ಬಾಣ|🏹|bāṇa|m', 'ತ': 'ta|ತರಕಾರಿ|🥕|tarakāri',
    'ಥ': 'tha|ಕಥೆ|📖|kathe|m', 'ದ': 'da|ದೀಪ|🪔|dīpa', 'ಧ': 'dha|ಧ್ವಜ|🚩|dhvaja', 'ನ': 'na|ನವಿಲು|🦚|navilu',
    'ಪ': 'pa|ಪುಸ್ತಕ|📚|pustaka', 'ಫ': 'pha|ಫಲ|🍎|phala', 'ಬ': 'ba|ಬಸ್|🚌|bas', 'ಭ': 'bha|ಭೂಮಿ|🌍|bhūmi',
    'ಮ': 'ma|ಮರ|🌳|mara', 'ಯ': 'ya|ಯಂತ್ರ|⚙️|yantra', 'ರ': 'ra|ರೈಲು|🚆|railu', 'ಲ': 'la|ಲಾರಿ|🚚|lāri',
    'ವ': 'va|ವಜ್ರ|💎|vajra', 'ಶ': 'śa|ಶಂಖ|🐚|śaṅkha', 'ಷ': 'ṣa|ಷಟ್ಕೋನ|⬡|ṣaṭkōna', 'ಸ': 'sa|ಸಿಂಹ|🦁|siṃha',
    'ಹ': 'ha|ಹಸು|🐄|hasu', 'ಳ': 'ḷa|ಬಾಳೆಹಣ್ಣು|🍌|bāḷehaṇṇu|m',
    'ಅಂ': 'aṃ|ಅಂಗಡಿ|🏪|aṅgaḍi', 'ಅಃ': 'aḥ|ದುಃಖ|😢|duḥkha|m', 'ಕ್ಷ': 'kṣa|ಪಕ್ಷಿ|🐦|pakṣi|m', 'ಜ್ಞ': 'jña|ಜ್ಞಾನ|📚|jñāna'
  },
  signs: { tab: 'tab_signs', head: 'ಅ ಆ ಇ ಈ ಉ ಊ ಋ ಎ ಏ ಐ ಒ ಓ ಔ ಅಂ ಅಃ', marks: '- ಾ ಿ ೀ ು ೂ ೃ ೆ ೇ ೈ ೊ ೋ ೌ ಂ ಃ',
    roman: 'a ā i ī u ū ṛu e ē ai o ō au aṃ aḥ' }
};

window.AE_DATA.scripts.mlym = {
  name: 'sc_mlym', glyph: 'അ', voice: ['ml'], font: 'Noto Sans Malayalam',
  stack: '"Noto Sans Malayalam", "Nirmala UI", "Kartika", "Malayalam Sangam MN", "Lohit Malayalam", sans-serif',
  uses: ['ml'], lh: 1.55,
  groups: [
    { id: 'vowels', label: 'g_vowels', native: 'സ്വരാക്ഷരങ്ങൾ', rows: ['അ ആ ഇ ഈ ഉ ഊ ഋ എ ഏ ഐ ഒ ഓ ഔ'] },
    { id: 'consonants', label: 'g_consonants', native: 'വ്യഞ്ജനാക്ഷരങ്ങൾ', rows: ['ക ഖ ഗ ഘ ങ', 'ച ഛ ജ ഝ ഞ', 'ട ഠ ഡ ഢ ണ', 'ത ഥ ദ ധ ന', 'പ ഫ ബ ഭ മ', 'യ ര ല വ', 'ശ ഷ സ ഹ', 'ള ഴ റ'] },
    { id: 'extra', label: 'g_extra', native: 'അനുസ്വാരം · വിസർഗം · ചില്ലക്ഷരങ്ങൾ', rows: ['അം അഃ ൺ ൻ ർ ൽ ൾ'] }
  ],
  L: {
    'അ': 'a|അമ്മ|👩|amma', 'ആ': 'ā|ആന|🐘|āna', 'ഇ': 'i|ഇല|🍃|ila', 'ഈ': 'ī|ഈച്ച|🪰|īchcha',
    'ഉ': 'u|ഉറുമ്പ്|🐜|uṟumpŭ', 'ഊ': 'ū|ഊൺ|🍛|ūṇ', 'ഋ': 'ṛ|ഋഷി|🧘|ṛṣi', 'എ': 'e|എലി|🐭|eli',
    'ഏ': 'ē|ഏണി|🪜|ēṇi', 'ഐ': 'ai|ഐസ്ക്രീം|🍦|aiskrīṃ', 'ഒ': 'o|ഒട്ടകം|🐫|oṭṭakaṃ', 'ഓ': 'ō|ഓറഞ്ച്|🍊|ōṟañch',
    'ഔ': 'au|ഔഷധം|💊|auṣadhaṃ',
    'ക': 'ka|കപ്പൽ|🚢|kappal', 'ഖ': 'kha|ഖനി|⛏️|khani', 'ഗ': 'ga|ഗരുഡൻ|🦅|garuḍan', 'ഘ': 'gha|ഘടികാരം|⏰|ghaṭikāraṃ',
    'ങ': 'ṅa|മാങ്ങ|🥭|māṅṅa|m', 'ച': 'cha|ചന്ദ്രൻ|🌙|chandran', 'ഛ': 'chha|ഛത്രം|☂️|chhatraṃ', 'ജ': 'ja|ജനൽ|🪟|janal',
    'ഝ': 'jha||||r', 'ഞ': 'ña|ഞണ്ട്|🦀|ñaṇṭŭ', 'ട': 'ṭa|ടെലിഫോൺ|☎️|ṭeliphōṇ', 'ഠ': 'ṭha||||r',
    'ഡ': 'ḍa|ഡോക്ടർ|🩺|ḍōkṭar', 'ഢ': 'ḍha||||r', 'ണ': 'ṇa|മണി|🔔|maṇi|m', 'ത': 'ta|തത്ത|🦜|tatta',
    'ഥ': 'tha|കഥ|📖|katha|m', 'ദ': 'da|ദീപം|🪔|dīpaṃ', 'ധ': 'dha|ധ്വജം|🚩|dhvajaṃ', 'ന': 'na|നക്ഷത്രം|⭐|nakṣatraṃ',
    'പ': 'pa|പശു|🐄|paśu', 'ഫ': 'pha|ഫലം|🍎|phalaṃ', 'ബ': 'ba|ബസ്|🚌|bas', 'ഭ': 'bha|ഭൂമി|🌍|bhūmi',
    'മ': 'ma|മയിൽ|🦚|mayil', 'യ': 'ya|യന്ത്രം|⚙️|yantraṃ', 'ര': 'ra|രാജാവ്|🤴|rājāvŭ', 'ല': 'la|ലോറി|🚚|lōṟi',
    'വ': 'va|വാഴപ്പഴം|🍌|vāḻappaḻaṃ', 'ശ': 'śa|ശംഖ്|🐚|śaṃkhŭ', 'ഷ': 'ṣa|ഷർട്ട്|👕|ṣarṭṭŭ', 'സ': 'sa|സിംഹം|🦁|siṃhaṃ',
    'ഹ': 'ha|ഹംസം|🦢|haṃsaṃ', 'ള': 'ḷa|വള്ളം|⛵|vaḷḷaṃ|m', 'ഴ': 'ḻa|മഴ|🌧️|maḻa|m', 'റ': 'ṟa|റേഡിയോ|📻|ṟēḍiyō',
    'അം': 'aṃ|മരം|🌳|maraṃ|m', 'അഃ': 'aḥ|ദുഃഖം|😢|duḥkhaṃ|m', 'ൺ': 'ṇ|പെൺകുട്ടി|👧|peṇkuṭṭi|m', 'ൻ': 'n|മീൻ|🐟|mīn|m',
    'ർ': 'r|കാർ|🚗|kār|m', 'ൽ': 'l|പാൽ|🥛|pāl|m', 'ൾ': 'ḷ|വാൾ|⚔️|vāḷ|m'
  },
  signs: { tab: 'tab_signs', head: 'അ ആ ഇ ഈ ഉ ഊ ഋ എ ഏ ഐ ഒ ഓ ഔ അം അഃ', marks: '- ാ ി ീ ു ൂ ൃ െ േ ൈ ൊ ോ ൗ ം ഃ',
    roman: 'a ā i ī u ū ṛ e ē ai o ō au aṃ aḥ' }
};

/* Urdu: an alphabet (not an abugida). roman = the letter's name; say = the name in Urdu.
   forms: nj = does not join the NEXT letter, eo = only at the end of a word, ao = stands alone. */
window.AE_DATA.scripts.arab = {
  name: 'sc_arab', glyph: 'ب', voice: ['ur'], font: 'Noto Nastaliq Urdu', dir: 'rtl',
  stack: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", "Noto Naskh Arabic", "Segoe UI", serif',
  uses: ['ur'], lh: 2.1,
  groups: [
    { id: 'letters', label: 'g_letters', native: 'حروفِ تہجی', rows: ['ا ب پ ت ٹ ث ج چ ح خ د ڈ ذ ر ڑ ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن ں و ہ ھ ء ی ے'] }
  ],
  L: {
    'ا': 'alif|انگور|🍇|angūr||الف', 'ب': 'be|بطخ|🦆|batakh||بے', 'پ': 'pe|پتنگ|🪁|patang||پے', 'ت': 'te|تربوز|🍉|tarbūz||تے',
    'ٹ': 'ṭe|ٹماٹر|🍅|ṭamāṭar||ٹے', 'ث': 'se|مثلث|🔺|musallas|m|ثے', 'ج': 'jīm|جہاز|🚢|jahāz||جیم', 'چ': 'che|چڑیا|🐦|chiṛiyā||چے',
    'ح': 'baṛī he|حلوہ|🍮|halwā||حے', 'خ': 'khe|خرگوش|🐰|khargosh||خے', 'د': 'dāl|دروازہ|🚪|darwāza||دال', 'ڈ': 'ḍāl|ڈھول|🥁|ḍhol||ڈال',
    'ذ': 'zāl|ذائقہ|😋|zā’iqa||ذال', 'ر': 're|ریل|🚆|rel||رے', 'ڑ': 'ṛe|پہاڑ|⛰️|pahāṛ|m|ڑے', 'ز': 'ze|زرافہ|🦒|zarāfa||زے',
    'ژ': 'zhe|ژالہ|🌨️|zhāla||ژے', 'س': 'sīn|سیب|🍎|seb||سین', 'ش': 'shīn|شیر|🦁|sher||شین', 'ص': 'swād|صابن|🧼|sābun||صاد',
    'ض': 'zwād|ضرب|✖️|zarb||ضاد', 'ط': 'to’e|طوطا|🦜|totā||طوئے', 'ظ': 'zo’e|ظرف|🍽️|zarf||ظوئے', 'ع': 'ain|عینک|👓|ainak||عین',
    'غ': 'ghain|غبارہ|🎈|ghubāra||غین', 'ف': 'fe|فوارہ|⛲|fawwāra||فے', 'ق': 'qāf|قلم|🖊️|qalam||قاف', 'ک': 'kāf|کبوتر|🕊️|kabūtar||کاف',
    'گ': 'gāf|گائے|🐄|gāe||گاف', 'ل': 'lām|لیموں|🍋|lemūn||لام', 'م': 'mīm|مچھلی|🐟|machhlī||میم', 'ن': 'nūn|ناشپاتی|🍐|nāshpātī||نون',
    'ں': 'nūn ghunna|گاؤں|🏘️|gāõ|m|نون غنہ', 'و': 'wāo|وقت|⏰|waqt||واؤ', 'ہ': 'choṭī he|ہاتھی|🐘|hāthī||چھوٹی ہے',
    'ھ': 'do-chashmī he|بھالو|🐻|bhālū|m|دو چشمی ہے', 'ء': 'hamza|چائے|☕|chāe|m|ہمزہ', 'ی': 'choṭī ye|یوگا|🧘|yogā||چھوٹی یے',
    'ے': 'baṛī ye|کیلے|🍌|kele|m|بڑی یے'
  },
  forms: { nj: 'ا د ڈ ذ ر ڑ ز ژ و ے', eo: 'ں ے', ao: 'ء' },
  signs: { tab: 'tab_aerab', head: 'زبر زیر پیش ا ی و ے', marks: 'َ ِ ُ ا ی و ے', roman: 'a i u ā ī ū e',
    bases: 'ب پ ت ٹ ج چ ح خ س ش ص ط ف ق ک گ ل م ن ہ', roots: 'b p t ṭ j ch h kh s sh s t f q k g l m n h' }
};

/* English: capital + small letter, roman = the letter's name as said in Indian classrooms (Z = zed). */
window.AE_DATA.scripts.latn = {
  name: 'sc_latn', glyph: 'A', voice: ['en'], font: 'Andika', latin: true,
  stack: '"Andika", "Noto Sans", "Segoe UI", system-ui, sans-serif',
  uses: ['en'], lh: 1.3,
  groups: [
    { id: 'vowels', label: 'g_vowels', native: '', rows: ['A E I O U'] },
    { id: 'consonants', label: 'g_consonants', native: '', rows: ['B C D F G H J K L M N P Q R S T V W X Y Z'] }
  ],
  L: {
    'A': 'ay|Apple|🍎|', 'B': 'bee|Ball|⚽|', 'C': 'see|Cat|🐱|', 'D': 'dee|Dog|🐶|', 'E': 'ee|Elephant|🐘|',
    'F': 'ef|Fish|🐟|', 'G': 'jee|Grapes|🍇|', 'H': 'aitch|House|🏠|', 'I': 'eye|Ice|🧊|', 'J': 'jay|Juice|🧃|',
    'K': 'kay|Kite|🪁|', 'L': 'el|Lion|🦁|', 'M': 'em|Mango|🥭|', 'N': 'en|Nose|👃|', 'O': 'oh|Orange|🍊|',
    'P': 'pee|Parrot|🦜|', 'Q': 'cue|Queen|👸|', 'R': 'ar|Rabbit|🐰|', 'S': 'es|Sun|☀️|', 'T': 'tee|Tiger|🐯|',
    'U': 'you|Umbrella|☂️|', 'V': 'vee|Van|🚐|', 'W': 'double-u|Watch|⌚|', 'X': 'ex|Box|📦||m', 'Y': 'why|Yo-yo|🪀|',
    'Z': 'zed|Zebra|🦓|'
  },
  signs: null
};
