/* Static data that is NOT translated: number values, default target per UI language, font stacks and
   script tables (vowels, consonants, vowel signs on a base consonant) for every target language.
   Romanisation is plain Latin for Indian learners: aa/ee/oo = long vowels, capital T D N = hard (retroflex) sounds. */
window.PB_DATA = {
  /* value shown next to the 32 items of the "numbers" topic, in the same order as content.js */
  numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30, 40, 50, 60, 70, 80, 90, 100, 1000, 100000, 10000000],
  /* sensible first target for each UI language */
  defaults: { en: 'hi', hi: 'ta', bn: 'hi', mr: 'hi', gu: 'hi', pa: 'hi', or: 'hi', ta: 'hi', te: 'hi', kn: 'hi', ml: 'hi', ur: 'hi' },
  fonts: {
    en: '"Noto Sans", system-ui, "Segoe UI", sans-serif',
    hi: '"Noto Sans Devanagari", "Nirmala UI", "Mangal", "Kohinoor Devanagari", sans-serif',
    mr: '"Noto Sans Devanagari", "Nirmala UI", "Mangal", "Kohinoor Devanagari", sans-serif',
    bn: '"Noto Sans Bengali", "Nirmala UI", "Vrinda", "Kohinoor Bangla", sans-serif',
    pa: '"Noto Sans Gurmukhi", "Nirmala UI", "Raavi", "Gurmukhi MN", sans-serif',
    gu: '"Noto Sans Gujarati", "Nirmala UI", "Shruti", "Gujarati Sangam MN", sans-serif',
    or: '"Noto Sans Oriya", "Noto Sans Odia", "Nirmala UI", "Kalinga", "Oriya Sangam MN", sans-serif',
    ta: '"Noto Sans Tamil", "Nirmala UI", "Latha", "Tamil Sangam MN", sans-serif',
    te: '"Noto Sans Telugu", "Nirmala UI", "Gautami", "Telugu Sangam MN", sans-serif',
    kn: '"Noto Sans Kannada", "Nirmala UI", "Tunga", "Kannada Sangam MN", sans-serif',
    ml: '"Noto Sans Malayalam", "Nirmala UI", "Kartika", "Malayalam Sangam MN", sans-serif',
    ur: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", "Noto Naskh Arabic", "Segoe UI", serif'
  },
  scripts: {}
};

(function (S) {
  var pairs = function (letters, romans) {
    var L = letters.split(' '), R = romans.split(' '), out = [];
    for (var i = 0; i < L.length; i++) out.push([L[i], R[i] || '']);
    return out;
  };
  /* Brahmic scripts: vowels, consonants, matras (vowel signs; first = inherent 'a'), base consonant for the sign table */
  var deva = {
    vowels: pairs('अ आ इ ई उ ऊ ऋ ए ऐ ओ औ अं अः', 'a aa i ee u oo ri e ai o au an ah'),
    consonants: pairs('क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह क्ष त्र ज्ञ',
      'ka kha ga gha nga cha chha ja jha nya Ta Tha Da Dha Na ta tha da dha na pa pha ba bha ma ya ra la va sha sha sa ha ksha tra gya'),
    base: 'क', matras: pairs('_ ा ि ी ु ू ृ े ै ो ौ ं ः', 'ka kaa ki kee ku koo kri ke kai ko kau kan kah')
  };
  S.hi = deva;
  S.mr = { vowels: deva.vowels, base: 'क', matras: deva.matras,
    consonants: deva.consonants.concat([['ळ', 'La']]) };
  S.bn = {
    vowels: pairs('অ আ ই ঈ উ ঊ ঋ এ ঐ ও ঔ', 'o aa i ee u oo ri e oi o ou'),
    consonants: pairs('ক খ গ ঘ ঙ চ ছ জ ঝ ঞ ট ঠ ড ঢ ণ ত থ দ ধ ন প ফ ব ভ ম য র ল শ ষ স হ ড় ঢ় য় ৎ ং ঃ ঁ',
      'ko kho go gho ngo cho chho jo jho nyo To Tho Do Dho No to tho do dho no po pho bo bho mo jo ro lo sho sho so ho Ro Rho yo t ng h chandrabindu'),
    base: 'ক', matras: pairs('_ া ি ী ু ূ ৃ ে ৈ ো ৌ', 'ko kaa ki kee ku koo kri ke koi ko kou')
  };
  S.pa = {
    vowels: pairs('ਅ ਆ ਇ ਈ ਉ ਊ ਏ ਐ ਓ ਔ ਅੰ', 'a aa i ee u oo e ai o au an'),
    consonants: pairs('ਸ ਹ ਕ ਖ ਗ ਘ ਙ ਚ ਛ ਜ ਝ ਞ ਟ ਠ ਡ ਢ ਣ ਤ ਥ ਦ ਧ ਨ ਪ ਫ ਬ ਭ ਮ ਯ ਰ ਲ ਵ ੜ ਸ਼ ਖ਼ ਗ਼ ਜ਼ ਫ਼ ਲ਼',
      'sa ha ka kha ga gha nga cha chha ja jha nya Ta Tha Da Dha Na ta tha da dha na pa pha ba bha ma ya ra la va Ra sha kha gha za fa La'),
    base: 'ਕ', matras: pairs('_ ਾ ਿ ੀ ੁ ੂ ੇ ੈ ੋ ੌ ੰ', 'ka kaa ki kee ku koo ke kai ko kau kan')
  };
  S.gu = {
    vowels: pairs('અ આ ઇ ઈ ઉ ઊ ઋ એ ઐ ઓ ઔ અં અઃ', 'a aa i ee u oo ru e ai o au an ah'),
    consonants: pairs('ક ખ ગ ઘ ઙ ચ છ જ ઝ ઞ ટ ઠ ડ ઢ ણ ત થ દ ધ ન પ ફ બ ભ મ ય ર લ વ શ ષ સ હ ળ ક્ષ જ્ઞ',
      'ka kha ga gha nga cha chha ja jha nya Ta Tha Da Dha Na ta tha da dha na pa pha ba bha ma ya ra la va sha sha sa ha La ksha gna'),
    base: 'ક', matras: pairs('_ ા િ ી ુ ૂ ૃ ે ૈ ો ૌ ં ઃ', 'ka kaa ki kee ku koo kru ke kai ko kau kan kah')
  };
  S.or = {
    vowels: pairs('ଅ ଆ ଇ ଈ ଉ ଊ ଋ ଏ ଐ ଓ ଔ ଅଂ ଅଃ', 'o aa i ee u oo ru e oi o ou on oh'),
    consonants: pairs('କ ଖ ଗ ଘ ଙ ଚ ଛ ଜ ଝ ଞ ଟ ଠ ଡ ଢ ଣ ତ ଥ ଦ ଧ ନ ପ ଫ ବ ଭ ମ ଯ ୟ ର ଲ ଳ ୱ ଶ ଷ ସ ହ କ୍ଷ ଡ଼ ଢ଼',
      'ko kho go gho ngo cho chho jo jho nyo To Tho Do Dho No to tho do dho no po pho bo bho mo jo yo ro lo Lo wo sho sho so ho ksho Ro Rho'),
    base: 'କ', matras: pairs('_ ା ି ୀ ୁ ୂ ୃ େ ୈ ୋ ୌ ଂ ଃ', 'ko kaa ki kee ku koo kru ke koi ko kou kon koh')
  };
  S.ta = {
    vowels: pairs('அ ஆ இ ஈ உ ஊ எ ஏ ஐ ஒ ஓ ஔ ஃ', 'a aa i ee u oo e ae ai o oh au akh'),
    consonants: pairs('க ங ச ஞ ட ண த ந ப ம ய ர ல வ ழ ள ற ன ஜ ஷ ஸ ஹ க்ஷ',
      'ka nga cha nya Ta Na tha na pa ma ya ra la va zha La Ra na ja sha sa ha ksha'),
    base: 'க', matras: pairs('_ ா ி ீ ு ூ ெ ே ை ொ ோ ௌ', 'ka kaa ki kee ku koo ke kae kai ko koh kau')
  };
  S.te = {
    vowels: pairs('అ ఆ ఇ ఈ ఉ ఊ ఋ ఎ ఏ ఐ ఒ ఓ ఔ అం అః', 'a aa i ee u oo ru e ae ai o oh au am ah'),
    consonants: pairs('క ఖ గ ఘ ఙ చ ఛ జ ఝ ఞ ట ఠ డ ఢ ణ త థ ద ధ న ప ఫ బ భ మ య ర ల వ శ ష స హ ళ క్ష ఱ',
      'ka kha ga gha nga cha chha ja jha nya Ta Tha Da Dha Na ta tha da dha na pa pha ba bha ma ya ra la va sha sha sa ha La ksha Ra'),
    base: 'క', matras: pairs('_ ా ి ీ ు ూ ృ ె ే ై ొ ో ౌ ం ః', 'ka kaa ki kee ku koo kru ke kae kai ko koh kau kam kah')
  };
  S.kn = {
    vowels: pairs('ಅ ಆ ಇ ಈ ಉ ಊ ಋ ಎ ಏ ಐ ಒ ಓ ಔ ಅಂ ಅಃ', 'a aa i ee u oo ru e ae ai o oh au am ah'),
    consonants: pairs('ಕ ಖ ಗ ಘ ಙ ಚ ಛ ಜ ಝ ಞ ಟ ಠ ಡ ಢ ಣ ತ ಥ ದ ಧ ನ ಪ ಫ ಬ ಭ ಮ ಯ ರ ಲ ವ ಶ ಷ ಸ ಹ ಳ ಕ್ಷ ಜ್ಞ',
      'ka kha ga gha nga cha chha ja jha nya Ta Tha Da Dha Na ta tha da dha na pa pha ba bha ma ya ra la va sha sha sa ha La ksha gna'),
    base: 'ಕ', matras: pairs('_ ಾ ಿ ೀ ು ೂ ೃ ೆ ೇ ೈ ೊ ೋ ೌ ಂ ಃ', 'ka kaa ki kee ku koo kru ke kae kai ko koh kau kam kah')
  };
  S.ml = {
    vowels: pairs('അ ആ ഇ ഈ ഉ ഊ ഋ എ ഏ ഐ ഒ ഓ ഔ അം അഃ', 'a aa i ee u oo ri e ae ai o oh au am ah'),
    consonants: pairs('ക ഖ ഗ ഘ ങ ച ഛ ജ ഝ ഞ ട ഠ ഡ ഢ ണ ത ഥ ദ ധ ന പ ഫ ബ ഭ മ യ ര ല വ ശ ഷ സ ഹ ള ഴ റ ൺ ൻ ർ ൽ ൾ',
      'ka kha ga gha nga cha chha ja jha nya Ta Tha Da Dha Na ta tha da dha na pa pha ba bha ma ya ra la va sha sha sa ha La zha Ra N n r l L'),
    base: 'ക', matras: pairs('_ ാ ി ീ ു ൂ ൃ െ േ ൈ ൊ ോ ൗ ം ഃ', 'ka kaa ki kee ku koo kri ke kae kai ko koh kau kam kah')
  };
  /* Urdu: letters (read right to left) + the three short-vowel marks on ب */
  S.ur = {
    rtl: true,
    letters: pairs('ا ب پ ت ٹ ث ج چ ح خ د ڈ ذ ر ڑ ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن ں و ہ ھ ء ی ے',
      'alif be pe te Te se jeem che baRi-he khe daal Daal zaal re Re ze zhe seen sheen suaad zuaad toe zoe ain ghain fe qaaf kaaf gaaf laam meem noon noon-ghunna waao choTi-he do-chashmi-he hamza choTi-ye baRi-ye'),
    vowelMarks: [['بَ', 'ba (zabar)'], ['بِ', 'bi (zer)'], ['بُ', 'bu (pesh)'], ['با', 'baa'], ['بی', 'bee'], ['بو', 'boo'], ['بے', 'be'], ['بَو', 'bau'], ['بَے', 'bai']]
  };
  /* English: letter names */
  S.en = {
    latin: true,
    vowels: pairs('A E I O U', 'ay ee eye oh you'),
    consonants: pairs('B C D F G H J K L M N P Q R S T V W X Y Z', 'bee see dee ef jee aitch jay kay el em en pee cue aar es tee vee double-you ex why zed')
  };
})(window.PB_DATA.scripts);
