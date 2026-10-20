/* Acids, Bases & pH Lab: localized content (same shape in all 12 languages).
   facts: one line per substance · ind_why: one line per indicator · stories, uses, daily, quiz: see app.js */
window.APP_CONTENT = {
  en: {
    facts: {
      hcl: 'A strong laboratory acid. Even a dilute solution is dangerous: never touch or taste it.',
      gastric: 'Our stomach makes hydrochloric acid to digest food and kill germs.',
      lemon: 'Sour because of citric acid. Rich in vitamin C.',
      softdrink: 'Contains carbonic and phosphoric acid. That is why it harms teeth.',
      vinegar: 'A dilute solution of acetic (ethanoic) acid, used in pickles.',
      tomato: 'Mildly acidic because of citric and malic acid.',
      curd: 'Lactic acid made by bacteria turns milk sour and sets it into curd.',
      coffee: 'Black coffee without milk is mildly acidic.',
      tea: 'Tannic acid gives tea its slightly bitter, puckering taste.',
      rain: 'Clean rain is slightly acidic because CO₂ from the air dissolves in it. Below 5.6 it is called acid rain.',
      milk: 'Fresh milk is very slightly acidic. As it goes sour, its pH falls.',
      saliva: 'Saliva is close to neutral. After a sugary snack, bacteria make acid and the pH in the mouth drops.',
      water: 'Pure water is neutral: equal numbers of H⁺ and OH⁻ ions.',
      blood: 'Our blood stays between pH 7.35 and 7.45. Our body works hard to keep it there.',
      seawater: 'Slightly basic because of dissolved salts and carbonates.',
      bakingsoda: 'Sodium hydrogencarbonate (NaHCO₃), a mild base used in cooking and antacids.',
      toothpaste: 'Basic, so it neutralises the acid made by bacteria in the mouth.',
      antacid: 'Antacid tablets contain mild bases that neutralise extra stomach acid.',
      soap: 'Soap is made from oil and a strong base, so soap water is basic and feels slippery.',
      magnesia: 'A suspension of magnesium hydroxide, Mg(OH)₂, used as an antacid.',
      ammonia: 'Ammonia dissolved in water is basic and has a sharp smell. Used in some cleaners.',
      limewater: 'Calcium hydroxide, Ca(OH)₂, in water. It turns milky when CO₂ is bubbled through it.',
      bleach: 'Household bleach is strongly basic and corrosive. Handle with gloves.',
      naoh: 'Caustic soda: a strong base used to make soap and paper. Very corrosive.'
    },
    ind_why: {
      blue_litmus: 'Litmus is a natural dye from lichens. Acids turn blue litmus red; bases and neutral solutions leave it blue.',
      red_litmus: 'Bases turn red litmus blue. Acids and neutral solutions leave it red.',
      turmeric: 'Turmeric (haldi) is yellow in acids and neutral solutions, and turns red in bases. That is why a turmeric stain turns red when soap touches it.',
      phenolphthalein: 'Phenolphthalein is colourless in acids and neutral solutions, and pink in bases (from about pH 8.2).',
      methyl_orange: 'Methyl orange is red in strong acids (below pH 3.1), orange in between, and yellow above pH 4.4.',
      universal: 'Universal indicator is a mixture of dyes. It shows a different colour for each pH: red for strong acids, green for neutral, violet for strong bases.',
      china_rose: 'China rose (gudhal) petals give a natural indicator: it turns acids dark pink and bases green.'
    },
    stories: [{
        title: 'Antacid vs stomach acid',
        emoji: '💊',
        text: 'Our stomach makes hydrochloric acid (pH about 1.2) to digest food. Too much acid causes pain and burning (acidity). An antacid such as milk of magnesia, Mg(OH)₂, is a mild base: it neutralises the extra acid and the pain goes away.',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O',
        before: 1.2,
        after: 4,
        beforeLabel: 'too much acid',
        afterLabel: 'after the antacid'
      }, {
        title: 'Bee sting vs baking soda',
        emoji: '🐝',
        text: 'A bee sting injects methanoic (formic) acid into the skin, which burns. Rubbing a paste of baking soda, a mild base, neutralises the acid and gives relief. A wasp sting is basic, so for that people use a mild acid like vinegar.',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂',
        before: 3,
        after: 7,
        beforeLabel: 'sting (acid)',
        afterLabel: 'after baking soda'
      }],
    uses: {
      common_salt: {
        name: 'Common salt',
        made: 'From sea water by evaporation, or dug out as rock salt. It is the raw material for sodium hydroxide, baking soda, washing soda and bleaching powder (chlor-alkali process: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂).',
        uses: ['Cooking and preserving food (pickles, papad)', 'Making NaOH, baking soda, washing soda and bleaching powder', 'Keeping roads ice-free in cold countries']
      },
      washing_soda: {
        name: 'Washing soda',
        made: 'Baking soda is heated to give sodium carbonate; crystallising it with water gives washing soda: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O.',
        uses: ['Making glass, soap and paper', 'Removing the permanent hardness of water', 'Cleaning agent for homes']
      },
      baking_soda: {
        name: 'Baking soda',
        made: 'From common salt: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃. On heating it gives CO₂: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂.',
        uses: ['Baking powder makes cakes and bread soft (CO₂ bubbles)', 'An antacid for acidity', 'Soda-acid fire extinguishers']
      },
      bleaching_powder: {
        name: 'Bleaching powder',
        made: 'Chlorine gas acts on dry slaked lime: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O.',
        uses: ['Bleaching cotton, linen and paper', 'Disinfecting drinking water', 'An oxidising agent in chemical industries']
      },
      plaster_of_paris: {
        name: 'Plaster of Paris',
        made: 'Gypsum is heated to 373 K (100 °C): CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O. Mixed with water, it sets back into hard gypsum.',
        uses: ['Supporting fractured bones in the right position', 'Toys, decoration pieces and statues', 'Smoothing walls and ceilings']
      }
    },
    daily: [{
        icon: '🦷',
        title: 'Tooth decay',
        tag: 'below pH 5.5',
        text: 'Bacteria in the mouth turn leftover sugar into acid. When the pH in the mouth falls below 5.5, the enamel (the hardest substance in the body) starts to dissolve. Toothpaste is basic and neutralises this acid, so brush after meals.'
      }, {
        icon: '🌧️',
        title: 'Acid rain',
        tag: 'below pH 5.6',
        text: 'Smoke from vehicles and factories adds oxides of sulphur and nitrogen to the air. They dissolve in rain and make it acidic. Acid rain harms fish in rivers, damages crops, and eats away marble buildings like the Taj Mahal.'
      }, {
        icon: '🌱',
        title: 'Soil pH and crops',
        tag: 'best: pH 6.5 to 7.5',
        text: 'Most plants grow best in soil that is close to neutral. If the soil is too acidic, farmers add quick lime (CaO), slaked lime (Ca(OH)₂) or chalk (CaCO₃). If it is too basic, they add organic matter such as compost.'
      }, {
        icon: '🐝',
        title: 'Self-defence with acids and bases',
        tag: 'stings',
        text: 'A bee or an ant sting injects methanoic acid: rub baking soda. Nettle leaves also inject methanoic acid: the dock plant that often grows nearby gives relief. A wasp sting is basic: use vinegar.'
      }, {
        icon: '🫃',
        title: 'Digestion and acidity',
        tag: 'stomach: pH 1.2',
        text: 'The stomach makes hydrochloric acid to digest food. When too much is made we feel burning and pain. Antacids such as milk of magnesia or baking soda are mild bases that neutralise the extra acid.'
      }, {
        icon: '🩸',
        title: 'Our body likes a narrow range',
        tag: 'blood: pH 7.35 to 7.45',
        text: 'Living cells work only in a narrow pH range. Our blood stays very close to 7.4; even a small change makes us ill. That is why doctors check blood pH in serious illness.'
      }],
    quiz: [{
        q: 'Which colour does blue litmus paper turn when dipped in lemon juice?',
        options: ['Blue (no change)', 'Red', 'Green', 'Yellow'],
        why: 'Lemon juice is acidic (pH about 2). Acids turn blue litmus red.'
      }, {
        q: 'What is the pH of pure water at 25 °C?',
        options: ['0', '7', '14', '1'],
        why: 'Pure water is neutral. It has equal numbers of H⁺ and OH⁻ ions, so its pH is 7.'
      }, {
        q: 'Which of these solutions is the most acidic?',
        options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'],
        why: 'The lower the pH, the more acidic the solution. pH 3 has 1000 times more H⁺ ions than pH 6.'
      }, {
        q: 'A solution of pH 4 has how many times more H⁺ ions than a solution of pH 5?',
        options: ['2 times', '10 times', '100 times', 'Half as many'],
        why: 'Each step of 1 on the pH scale is a factor of 10 in H⁺ concentration. pH 4 → 10⁻⁴ mol/L; pH 5 → 10⁻⁵ mol/L.'
      }, {
        q: 'What colour is phenolphthalein in a sodium hydroxide (NaOH) solution?',
        options: ['Colourless', 'Pink', 'Yellow', 'Red'],
        why: 'Phenolphthalein is colourless in acid and turns pink in a base. NaOH is a strong base.'
      }, {
        q: 'A turmeric stain on a shirt turns red when soap is rubbed on it. This shows that soap is',
        options: ['acidic', 'neutral', 'basic', 'a salt'],
        why: 'Turmeric is a natural indicator: it stays yellow in acids and neutral solutions but turns red in bases. Soap is basic.'
      }, {
        q: 'Tooth decay starts when the pH in the mouth falls below',
        options: ['5.5', '7', '8.5', '2'],
        why: 'Tooth enamel begins to dissolve below pH 5.5. Bacteria make this acid from leftover sugar.'
      }, {
        q: 'Rain is called acid rain when its pH is below',
        options: ['7', '5.6', '6.5', '3'],
        why: 'Normal rain is slightly acidic (about 5.6) because of dissolved CO₂. Below 5.6 it is acid rain, caused by oxides of sulphur and nitrogen.'
      }, {
        q: 'An antacid such as milk of magnesia gives relief from acidity because it',
        options: ['adds more acid to the stomach', 'neutralises the extra acid in the stomach', 'cools the stomach', 'removes water from the stomach'],
        why: 'Milk of magnesia, Mg(OH)₂, is a mild base. It neutralises the extra hydrochloric acid in the stomach.'
      }, {
        q: 'A bee sting hurts because it injects an acid. Which household item rubbed on the sting gives relief?',
        options: ['Vinegar', 'Lemon juice', 'Baking soda', 'Salt'],
        why: 'The sting injects methanoic acid. Baking soda is a mild base that neutralises it. Vinegar and lemon juice are acids and would not help.'
      }, {
        q: 'Common salt (NaCl) is formed from a strong acid (HCl) and a strong base (NaOH). Its solution in water is',
        options: ['acidic', 'basic', 'neutral', 'sometimes acidic, sometimes basic'],
        why: 'When both parents are strong, neither wins: the salt solution is neutral, pH 7.'
      }, {
        q: 'Ammonium chloride (NH₄Cl) solution is acidic because it is made from',
        options: ['a strong acid and a weak base', 'a weak acid and a strong base', 'a strong acid and a strong base', 'a weak acid and a weak base'],
        why: 'HCl is a strong acid and NH₄OH is a weak base. The strong parent wins, so the salt is acidic.'
      }, {
        q: 'HCl + NaOH → ___ + H₂O. The missing product is',
        options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'],
        why: 'Neutralisation: acid + base → salt + water. Hydrochloric acid and sodium hydroxide give sodium chloride (common salt) and water.'
      }, {
        q: 'Plaster of Paris is made by heating',
        options: ['common salt', 'gypsum', 'limestone', 'baking soda'],
        why: 'Gypsum (CaSO₄·2H₂O) heated to 373 K loses water and becomes plaster of Paris, CaSO₄·½H₂O.'
      }, {
        q: 'Universal indicator added to a solution turns green. The solution is',
        options: ['strongly acidic', 'neutral (pH about 7)', 'strongly basic', 'pH 2'],
        why: 'On the universal indicator chart, green means pH 7, neutral. Red means strongly acidic and violet means strongly basic.'
      }]
  },
  hi: {
    facts: {
      hcl: 'प्रयोगशाला का प्रबल अम्ल। तनु घोल भी खतरनाक है: कभी छुएँ या चखें नहीं।',
      gastric: 'हमारा पेट खाना पचाने और कीटाणु मारने के लिए हाइड्रोक्लोरिक अम्ल बनाता है।',
      lemon: 'साइट्रिक अम्ल की वजह से खट्टा। विटामिन C से भरपूर।',
      softdrink: 'इसमें कार्बोनिक और फ़ॉस्फ़ोरिक अम्ल होते हैं। इसीलिए यह दाँतों को नुकसान पहुँचाता है।',
      vinegar: 'ऐसीटिक (एथेनोइक) अम्ल का तनु घोल, अचार में इस्तेमाल होता है।',
      tomato: 'साइट्रिक और मैलिक अम्ल की वजह से हल्का अम्लीय।',
      curd: 'बैक्टीरिया से बना लैक्टिक अम्ल दूध को खट्टा करके दही जमा देता है।',
      coffee: 'बिना दूध की काली कॉफ़ी हल्की अम्लीय होती है।',
      tea: 'टैनिक अम्ल चाय को हल्का कड़वा, कसैला स्वाद देता है।',
      rain: 'साफ़ बारिश भी थोड़ी अम्लीय होती है क्योंकि हवा का CO₂ उसमें घुल जाता है। 5.6 से नीचे इसे अम्लीय वर्षा कहते हैं।',
      milk: 'ताज़ा दूध बहुत हल्का अम्लीय होता है। खट्टा होने पर इसका pH गिरता है।',
      saliva: 'लार लगभग उदासीन होती है। मीठा खाने के बाद बैक्टीरिया अम्ल बनाते हैं और मुँह का pH गिर जाता है।',
      water: 'शुद्ध पानी उदासीन है: H⁺ और OH⁻ आयन बराबर संख्या में।',
      blood: 'हमारा खून pH 7.35 से 7.45 के बीच रहता है। शरीर इसे वहीं बनाए रखने की बहुत मेहनत करता है।',
      seawater: 'घुले हुए लवणों और कार्बोनेट की वजह से हल्का क्षारीय।',
      bakingsoda: 'सोडियम हाइड्रोजनकार्बोनेट (NaHCO₃), एक हल्का क्षार जो खाना पकाने और एंटासिड में काम आता है।',
      toothpaste: 'क्षारीय, इसलिए मुँह में बैक्टीरिया से बने अम्ल को उदासीन करता है।',
      antacid: 'एंटासिड गोलियों में हल्के क्षार होते हैं जो पेट के अतिरिक्त अम्ल को उदासीन करते हैं।',
      soap: 'साबुन तेल और प्रबल क्षार से बनता है, इसलिए साबुन का पानी क्षारीय होता है और चिकना लगता है।',
      magnesia: 'मैग्नीशियम हाइड्रॉक्साइड, Mg(OH)₂, का निलंबन, एंटासिड के रूप में इस्तेमाल होता है।',
      ammonia: 'पानी में घुला अमोनिया क्षारीय होता है और इसकी गंध तीखी होती है। कुछ सफ़ाई के घोलों में इस्तेमाल होता है।',
      limewater: 'पानी में कैल्शियम हाइड्रॉक्साइड, Ca(OH)₂। इसमें CO₂ गुज़ारने पर यह दूधिया हो जाता है।',
      bleach: 'घरेलू ब्लीच प्रबल क्षारीय और संक्षारक है। दस्ताने पहनकर इस्तेमाल करें।',
      naoh: 'कॉस्टिक सोडा: साबुन और कागज़ बनाने में इस्तेमाल होने वाला प्रबल क्षार। बहुत संक्षारक।'
    },
    ind_why: {
      blue_litmus: 'लिटमस लाइकेन से मिलने वाला प्राकृतिक रंग है। अम्ल नीले लिटमस को लाल कर देते हैं; क्षार और उदासीन घोल इसे नीला ही रहने देते हैं।',
      red_litmus: 'क्षार लाल लिटमस को नीला कर देते हैं। अम्ल और उदासीन घोल इसे लाल ही रहने देते हैं।',
      turmeric: 'हल्दी अम्ल और उदासीन घोल में पीली रहती है और क्षार में लाल हो जाती है। इसीलिए हल्दी का दाग साबुन लगते ही लाल हो जाता है।',
      phenolphthalein: 'फ़िनॉल्फ़्थेलिन अम्ल और उदासीन घोल में रंगहीन रहता है और क्षार में गुलाबी हो जाता है (लगभग pH 8.2 से)।',
      methyl_orange: 'मिथाइल ऑरेंज प्रबल अम्ल में लाल (pH 3.1 से नीचे), बीच में नारंगी और pH 4.4 से ऊपर पीला होता है।',
      universal: 'सार्वत्रिक सूचक कई रंगों का मिश्रण है। यह हर pH पर अलग रंग दिखाता है: प्रबल अम्ल में लाल, उदासीन में हरा, प्रबल क्षार में बैंगनी।',
      china_rose: 'गुड़हल की पंखुड़ियाँ प्राकृतिक सूचक देती हैं: यह अम्ल को गहरा गुलाबी और क्षार को हरा कर देता है।'
    },
    stories: [{
        title: 'एंटासिड बनाम पेट का अम्ल',
        emoji: '💊',
        text: 'हमारा पेट खाना पचाने के लिए हाइड्रोक्लोरिक अम्ल (pH लगभग 1.2) बनाता है। ज़्यादा अम्ल से दर्द और जलन होती है (एसिडिटी)। मिल्क ऑफ़ मैग्नीशिया, Mg(OH)₂, जैसा एंटासिड एक हल्का क्षार है: यह अतिरिक्त अम्ल को उदासीन कर देता है और दर्द चला जाता है।',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O',
        before: 1.2,
        after: 4,
        beforeLabel: 'बहुत ज़्यादा अम्ल',
        afterLabel: 'एंटासिड के बाद'
      }, {
        title: 'मधुमक्खी का डंक बनाम बेकिंग सोडा',
        emoji: '🐝',
        text: 'मधुमक्खी का डंक त्वचा में मेथेनोइक (फ़ॉर्मिक) अम्ल छोड़ता है, जिससे जलन होती है। हल्के क्षार बेकिंग सोडा का लेप लगाने से अम्ल उदासीन हो जाता है और आराम मिलता है। ततैया का डंक क्षारीय होता है, इसलिए उस पर लोग सिरके जैसा हल्का अम्ल लगाते हैं।',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂',
        before: 3,
        after: 7,
        beforeLabel: 'डंक (अम्ल)',
        afterLabel: 'बेकिंग सोडा के बाद'
      }],
    uses: {
      common_salt: {
        name: 'साधारण नमक',
        made: 'समुद्र के पानी को वाष्पित करके, या सेंधा नमक के रूप में खोदकर। यह सोडियम हाइड्रॉक्साइड, बेकिंग सोडा, धोने के सोडा और विरंजक चूर्ण का कच्चा माल है (क्लोर-क्षार प्रक्रिया: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂)।',
        uses: ['खाना बनाने और सुरक्षित रखने में (अचार, पापड़)', 'NaOH, बेकिंग सोडा, धोने का सोडा और विरंजक चूर्ण बनाने में', 'ठंडे देशों में सड़कों से बर्फ हटाने में']
      },
      washing_soda: {
        name: 'धोने का सोडा',
        made: 'बेकिंग सोडा को गर्म करने पर सोडियम कार्बोनेट बनता है; इसे पानी के साथ क्रिस्टलित करने पर धोने का सोडा मिलता है: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O।',
        uses: ['काँच, साबुन और कागज़ बनाने में', 'पानी की स्थायी कठोरता हटाने में', 'घर में सफ़ाई के लिए']
      },
      baking_soda: {
        name: 'बेकिंग सोडा',
        made: 'साधारण नमक से: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃। गर्म करने पर यह CO₂ देता है: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂।',
        uses: ['बेकिंग पाउडर केक और ब्रेड को नरम बनाता है (CO₂ के बुलबुले)', 'एसिडिटी के लिए एंटासिड', 'सोडा-अम्ल अग्निशामक']
      },
      bleaching_powder: {
        name: 'विरंजक चूर्ण',
        made: 'सूखे बुझे चूने पर क्लोरीन गैस की क्रिया: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O।',
        uses: ['कपास, लिनन और कागज़ का विरंजन', 'पीने के पानी को कीटाणुरहित करना', 'रासायनिक उद्योगों में ऑक्सीकारक']
      },
      plaster_of_paris: {
        name: 'प्लास्टर ऑफ़ पेरिस',
        made: 'जिप्सम को 373 K (100 °C) तक गर्म किया जाता है: CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O। पानी मिलाने पर यह फिर कठोर जिप्सम बन जाता है।',
        uses: ['टूटी हड्डियों को सही स्थिति में सहारा देना', 'खिलौने, सजावट की चीज़ें और मूर्तियाँ', 'दीवारों और छतों को चिकना करना']
      }
    },
    daily: [{
        icon: '🦷',
        title: 'दाँतों का सड़ना',
        tag: 'pH 5.5 से नीचे',
        text: 'मुँह के बैक्टीरिया बची हुई चीनी को अम्ल में बदल देते हैं। जब मुँह का pH 5.5 से नीचे गिरता है, तो इनैमल (शरीर का सबसे कठोर पदार्थ) घुलने लगता है। टूथपेस्ट क्षारीय है और इस अम्ल को उदासीन करता है, इसलिए खाने के बाद ब्रश करें।'
      }, {
        icon: '🌧️',
        title: 'अम्लीय वर्षा',
        tag: 'pH 5.6 से नीचे',
        text: 'गाड़ियों और कारखानों का धुआँ हवा में सल्फ़र और नाइट्रोजन के ऑक्साइड मिलाता है। ये बारिश में घुलकर उसे अम्लीय बना देते हैं। अम्लीय वर्षा नदियों की मछलियों को नुकसान पहुँचाती है, फ़सलें खराब करती है और ताजमहल जैसी संगमरमर की इमारतों को खा जाती है।'
      }, {
        icon: '🌱',
        title: 'मिट्टी का pH और फ़सलें',
        tag: 'सबसे अच्छा: pH 6.5 से 7.5',
        text: 'ज़्यादातर पौधे उदासीन के करीब मिट्टी में सबसे अच्छे उगते हैं। मिट्टी बहुत अम्लीय हो तो किसान बिना बुझा चूना (CaO), बुझा चूना (Ca(OH)₂) या खड़िया (CaCO₃) मिलाते हैं। बहुत क्षारीय हो तो खाद जैसे जैविक पदार्थ मिलाते हैं।'
      }, {
        icon: '🐝',
        title: 'अम्ल और क्षार से आत्मरक्षा',
        tag: 'डंक',
        text: 'मधुमक्खी या चींटी का डंक मेथेनोइक अम्ल छोड़ता है: बेकिंग सोडा लगाएँ। बिच्छू बूटी की पत्तियाँ भी मेथेनोइक अम्ल छोड़ती हैं: पास ही उगने वाला डॉक पौधा आराम देता है। ततैया का डंक क्षारीय होता है: सिरका लगाएँ।'
      }, {
        icon: '🫃',
        title: 'पाचन और एसिडिटी',
        tag: 'पेट: pH 1.2',
        text: 'पेट खाना पचाने के लिए हाइड्रोक्लोरिक अम्ल बनाता है। जब यह ज़्यादा बनता है तो जलन और दर्द होता है। मिल्क ऑफ़ मैग्नीशिया या बेकिंग सोडा जैसे एंटासिड हल्के क्षार हैं जो अतिरिक्त अम्ल को उदासीन करते हैं।'
      }, {
        icon: '🩸',
        title: 'हमारे शरीर को सीमित दायरा पसंद है',
        tag: 'खून: pH 7.35 से 7.45',
        text: 'जीवित कोशिकाएँ सिर्फ़ एक छोटी pH सीमा में काम करती हैं। हमारा खून 7.4 के बहुत पास रहता है; थोड़ा-सा बदलाव भी हमें बीमार कर देता है। इसीलिए गंभीर बीमारी में डॉक्टर खून का pH जाँचते हैं।'
      }],
    quiz: [{
        q: 'नींबू के रस में डुबाने पर नीला लिटमस पत्र किस रंग का हो जाता है?',
        options: ['नीला (कोई बदलाव नहीं)', 'लाल', 'हरा', 'पीला'],
        why: 'नींबू का रस अम्लीय है (pH लगभग 2)। अम्ल नीले लिटमस को लाल कर देते हैं।'
      }, {
        q: '25 °C पर शुद्ध पानी का pH कितना होता है?',
        options: ['0', '7', '14', '1'],
        why: 'शुद्ध पानी उदासीन है। इसमें H⁺ और OH⁻ आयन बराबर संख्या में होते हैं, इसलिए pH 7 है।'
      }, {
        q: 'इनमें से कौन-सा घोल सबसे ज़्यादा अम्लीय है?',
        options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'],
        why: 'pH जितना कम, घोल उतना ज़्यादा अम्लीय। pH 3 में pH 6 से 1000 गुना ज़्यादा H⁺ आयन हैं।'
      }, {
        q: 'pH 4 के घोल में pH 5 के घोल से कितने गुना ज़्यादा H⁺ आयन हैं?',
        options: ['2 गुना', '10 गुना', '100 गुना', 'आधे'],
        why: 'pH पैमाने पर 1 का हर कदम H⁺ सांद्रता में 10 का गुणक है। pH 4 → 10⁻⁴ mol/L; pH 5 → 10⁻⁵ mol/L।'
      }, {
        q: 'सोडियम हाइड्रॉक्साइड (NaOH) के घोल में फ़िनॉल्फ़्थेलिन किस रंग का होता है?',
        options: ['रंगहीन', 'गुलाबी', 'पीला', 'लाल'],
        why: 'फ़िनॉल्फ़्थेलिन अम्ल में रंगहीन रहता है और क्षार में गुलाबी हो जाता है। NaOH प्रबल क्षार है।'
      }, {
        q: 'कमीज़ पर लगा हल्दी का दाग साबुन रगड़ने पर लाल हो जाता है। इससे पता चलता है कि साबुन',
        options: ['अम्लीय है', 'उदासीन है', 'क्षारीय है', 'एक लवण है'],
        why: 'हल्दी प्राकृतिक सूचक है: अम्ल और उदासीन घोल में पीली रहती है पर क्षार में लाल हो जाती है। साबुन क्षारीय है।'
      }, {
        q: 'दाँतों का सड़ना तब शुरू होता है जब मुँह का pH इससे नीचे गिर जाए:',
        options: ['5.5', '7', '8.5', '2'],
        why: 'दाँतों का इनैमल pH 5.5 से नीचे घुलने लगता है। बैक्टीरिया बची हुई चीनी से यह अम्ल बनाते हैं।'
      }, {
        q: 'बारिश को अम्लीय वर्षा तब कहते हैं जब उसका pH इससे कम हो:',
        options: ['7', '5.6', '6.5', '3'],
        why: 'सामान्य बारिश घुले CO₂ की वजह से हल्की अम्लीय (लगभग 5.6) होती है। 5.6 से नीचे वह अम्लीय वर्षा है, जो सल्फ़र और नाइट्रोजन के ऑक्साइड से होती है।'
      }, {
        q: 'मिल्क ऑफ़ मैग्नीशिया जैसा एंटासिड एसिडिटी में आराम देता है क्योंकि यह',
        options: ['पेट में और अम्ल मिलाता है', 'पेट के अतिरिक्त अम्ल को उदासीन करता है', 'पेट को ठंडा करता है', 'पेट से पानी निकालता है'],
        why: 'मिल्क ऑफ़ मैग्नीशिया, Mg(OH)₂, एक हल्का क्षार है। यह पेट के अतिरिक्त हाइड्रोक्लोरिक अम्ल को उदासीन करता है।'
      }, {
        q: 'मधुमक्खी का डंक इसलिए दुखता है क्योंकि वह अम्ल छोड़ता है। घर की कौन-सी चीज़ डंक पर लगाने से आराम मिलता है?',
        options: ['सिरका', 'नींबू का रस', 'बेकिंग सोडा', 'नमक'],
        why: 'डंक मेथेनोइक अम्ल छोड़ता है। बेकिंग सोडा हल्का क्षार है जो इसे उदासीन करता है। सिरका और नींबू का रस अम्ल हैं और मदद नहीं करेंगे।'
      }, {
        q: 'साधारण नमक (NaCl) प्रबल अम्ल (HCl) और प्रबल क्षार (NaOH) से बनता है। पानी में इसका घोल होता है',
        options: ['अम्लीय', 'क्षारीय', 'उदासीन', 'कभी अम्लीय, कभी क्षारीय'],
        why: 'जब दोनों जनक प्रबल हों, तो कोई नहीं जीतता: लवण का घोल उदासीन है, pH 7।'
      }, {
        q: 'अमोनियम क्लोराइड (NH₄Cl) का घोल अम्लीय है क्योंकि यह बनता है',
        options: ['प्रबल अम्ल और दुर्बल क्षार से', 'दुर्बल अम्ल और प्रबल क्षार से', 'प्रबल अम्ल और प्रबल क्षार से', 'दुर्बल अम्ल और दुर्बल क्षार से'],
        why: 'HCl प्रबल अम्ल है और NH₄OH दुर्बल क्षार। प्रबल जनक जीतता है, इसलिए लवण अम्लीय है।'
      }, {
        q: 'HCl + NaOH → ___ + H₂O। खाली जगह का उत्पाद है',
        options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'],
        why: 'उदासीनीकरण: अम्ल + क्षार → लवण + पानी। हाइड्रोक्लोरिक अम्ल और सोडियम हाइड्रॉक्साइड से सोडियम क्लोराइड (साधारण नमक) और पानी बनते हैं।'
      }, {
        q: 'प्लास्टर ऑफ़ पेरिस किसे गर्म करके बनाया जाता है?',
        options: ['साधारण नमक', 'जिप्सम', 'चूना पत्थर', 'बेकिंग सोडा'],
        why: 'जिप्सम (CaSO₄·2H₂O) को 373 K पर गर्म करने से पानी निकल जाता है और प्लास्टर ऑफ़ पेरिस, CaSO₄·½H₂O, बनता है।'
      }, {
        q: 'किसी घोल में सार्वत्रिक सूचक डालने पर वह हरा हो गया। घोल है',
        options: ['प्रबल अम्लीय', 'उदासीन (pH लगभग 7)', 'प्रबल क्षारीय', 'pH 2'],
        why: 'सार्वत्रिक सूचक चार्ट में हरा मतलब pH 7, उदासीन। लाल मतलब प्रबल अम्लीय और बैंगनी मतलब प्रबल क्षारीय।'
      }]
  },
  bn: {
    facts: {
      hcl: 'ল্যাবের তীব্র অ্যাসিড। লঘু দ্রবণও বিপজ্জনক: কখনও ছুঁয়ো না বা চেখো না।',
      gastric: 'খাবার হজম করতে আর জীবাণু মারতে আমাদের পাকস্থলী হাইড্রোক্লোরিক অ্যাসিড তৈরি করে।',
      lemon: 'সাইট্রিক অ্যাসিডের জন্য টক। ভিটামিন C তে ভরপুর।',
      softdrink: 'এতে কার্বনিক ও ফসফরিক অ্যাসিড থাকে। তাই এটা দাঁতের ক্ষতি করে।',
      vinegar: 'অ্যাসিটিক (ইথানোয়িক) অ্যাসিডের লঘু দ্রবণ, আচারে ব্যবহার হয়।',
      tomato: 'সাইট্রিক ও ম্যালিক অ্যাসিডের জন্য মৃদু অ্যাসিডীয়।',
      curd: 'ব্যাকটেরিয়ার তৈরি ল্যাকটিক অ্যাসিড দুধকে টক করে দই জমায়।',
      coffee: 'দুধ ছাড়া কালো কফি মৃদু অ্যাসিডীয়।',
      tea: 'ট্যানিক অ্যাসিড চাকে সামান্য তেতো, কষা স্বাদ দেয়।',
      rain: 'পরিষ্কার বৃষ্টিও সামান্য অ্যাসিডীয়, কারণ বাতাসের CO₂ এতে দ্রবীভূত হয়। 5.6 এর নিচে একে অ্যাসিড বৃষ্টি বলে।',
      milk: 'টাটকা দুধ খুব সামান্য অ্যাসিডীয়। টক হতে থাকলে pH কমে।',
      saliva: 'লালা প্রায় নিরপেক্ষ। মিষ্টি খাওয়ার পর ব্যাকটেরিয়া অ্যাসিড তৈরি করে আর মুখের pH নেমে যায়।',
      water: 'বিশুদ্ধ জল নিরপেক্ষ: H⁺ ও OH⁻ আয়ন সমান সংখ্যায়।',
      blood: 'আমাদের রক্ত pH 7.35 থেকে 7.45 এর মধ্যে থাকে। শরীর এটা ধরে রাখতে অনেক পরিশ্রম করে।',
      seawater: 'দ্রবীভূত লবণ ও কার্বনেটের জন্য সামান্য ক্ষারীয়।',
      bakingsoda: 'সোডিয়াম হাইড্রোজেন কার্বনেট (NaHCO₃), একটি মৃদু ক্ষার যা রান্নায় ও অ্যান্টাসিডে ব্যবহার হয়।',
      toothpaste: 'ক্ষারীয়, তাই মুখে ব্যাকটেরিয়ার তৈরি অ্যাসিড প্রশমিত করে।',
      antacid: 'অ্যান্টাসিড ট্যাবলেটে মৃদু ক্ষার থাকে যা পাকস্থলীর বাড়তি অ্যাসিড প্রশমিত করে।',
      soap: 'সাবান তেল আর তীব্র ক্ষার থেকে তৈরি, তাই সাবানজল ক্ষারীয় আর পিছল লাগে।',
      magnesia: 'ম্যাগনেশিয়াম হাইড্রক্সাইড, Mg(OH)₂, এর সাসপেনশন, অ্যান্টাসিড হিসেবে ব্যবহার হয়।',
      ammonia: 'জলে দ্রবীভূত অ্যামোনিয়া ক্ষারীয় আর এর গন্ধ ঝাঁঝালো। কিছু ক্লিনারে ব্যবহার হয়।',
      limewater: 'জলে ক্যালসিয়াম হাইড্রক্সাইড, Ca(OH)₂। এর মধ্যে CO₂ চালালে ঘোলা হয়ে যায়।',
      bleach: 'ঘরের ব্লিচ তীব্র ক্ষারীয় ও ক্ষয়কারী। দস্তানা পরে ব্যবহার করো।',
      naoh: 'কস্টিক সোডা: সাবান ও কাগজ তৈরিতে ব্যবহৃত তীব্র ক্ষার। খুব ক্ষয়কারী।'
    },
    ind_why: {
      blue_litmus: 'লিটমাস লাইকেন থেকে পাওয়া প্রাকৃতিক রং। অ্যাসিড নীল লিটমাসকে লাল করে; ক্ষার ও নিরপেক্ষ দ্রবণে নীলই থাকে।',
      red_litmus: 'ক্ষার লাল লিটমাসকে নীল করে। অ্যাসিড ও নিরপেক্ষ দ্রবণে লালই থাকে।',
      turmeric: 'হলুদ অ্যাসিড ও নিরপেক্ষ দ্রবণে হলুদ থাকে, ক্ষারে লাল হয়ে যায়। তাই হলুদের দাগে সাবান লাগলে লাল হয়ে যায়।',
      phenolphthalein: 'ফেনলফথ্যালিন অ্যাসিড ও নিরপেক্ষ দ্রবণে বর্ণহীন, ক্ষারে গোলাপি (প্রায় pH 8.2 থেকে)।',
      methyl_orange: 'মিথাইল অরেঞ্জ তীব্র অ্যাসিডে লাল (pH 3.1 এর নিচে), মাঝে কমলা, আর pH 4.4 এর উপরে হলুদ।',
      universal: 'সর্বজনীন নির্দেশক কয়েকটি রঞ্জকের মিশ্রণ। প্রতিটি pH এ আলাদা রং দেখায়: তীব্র অ্যাসিডে লাল, নিরপেক্ষে সবুজ, তীব্র ক্ষারে বেগুনি।',
      china_rose: 'জবা ফুলের পাপড়ি থেকে প্রাকৃতিক নির্দেশক পাওয়া যায়: অ্যাসিডকে গাঢ় গোলাপি আর ক্ষারকে সবুজ করে।'
    },
    stories: [{
        title: 'অ্যান্টাসিড বনাম পাকস্থলীর অ্যাসিড',
        emoji: '💊',
        text: 'খাবার হজম করতে আমাদের পাকস্থলী হাইড্রোক্লোরিক অ্যাসিড (pH প্রায় 1.2) তৈরি করে। বেশি অ্যাসিডে ব্যথা ও জ্বালা হয় (অ্যাসিডিটি)। মিল্ক অফ ম্যাগনেশিয়া, Mg(OH)₂, এর মতো অ্যান্টাসিড একটি মৃদু ক্ষার: এটা বাড়তি অ্যাসিড প্রশমিত করে আর ব্যথা চলে যায়।',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O',
        before: 1.2,
        after: 4,
        beforeLabel: 'বেশি অ্যাসিড',
        afterLabel: 'অ্যান্টাসিডের পরে'
      }, {
        title: 'মৌমাছির হুল বনাম বেকিং সোডা',
        emoji: '🐝',
        text: 'মৌমাছির হুল ত্বকে মিথানোয়িক (ফরমিক) অ্যাসিড ঢোকায়, যা জ্বালা করে। মৃদু ক্ষার বেকিং সোডার প্রলেপ ঘষলে অ্যাসিড প্রশমিত হয় আর আরাম মেলে। বোলতার হুল ক্ষারীয়, তাই তাতে লোকে ভিনিগারের মতো মৃদু অ্যাসিড লাগায়।',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂',
        before: 3,
        after: 7,
        beforeLabel: 'হুল (অ্যাসিড)',
        afterLabel: 'বেকিং সোডার পরে'
      }],
    uses: {
      common_salt: {
        name: 'খাবার লবণ',
        made: 'সমুদ্রের জল বাষ্পীভূত করে, বা খনি থেকে সৈন্ধব লবণ হিসেবে তুলে। এটি সোডিয়াম হাইড্রক্সাইড, বেকিং সোডা, ওয়াশিং সোডা ও ব্লিচিং পাউডারের কাঁচামাল (ক্লোর-অ্যালকালি প্রক্রিয়া: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂)।',
        uses: ['রান্না ও খাবার সংরক্ষণে (আচার, পাঁপড়)', 'NaOH, বেকিং সোডা, ওয়াশিং সোডা ও ব্লিচিং পাউডার তৈরিতে', 'ঠান্ডা দেশে রাস্তা থেকে বরফ সরাতে']
      },
      washing_soda: {
        name: 'ওয়াশিং সোডা',
        made: 'বেকিং সোডা গরম করলে সোডিয়াম কার্বনেট হয়; জলের সঙ্গে কেলাসিত করলে ওয়াশিং সোডা মেলে: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O।',
        uses: ['কাচ, সাবান ও কাগজ তৈরিতে', 'জলের স্থায়ী খরতা দূর করতে', 'ঘরের পরিষ্কারক হিসেবে']
      },
      baking_soda: {
        name: 'বেকিং সোডা',
        made: 'খাবার লবণ থেকে: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃। গরম করলে CO₂ দেয়: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂।',
        uses: ['বেকিং পাউডার কেক ও রুটি নরম করে (CO₂ বুদবুদ)', 'অ্যাসিডিটির অ্যান্টাসিড', 'সোডা-অ্যাসিড অগ্নিনির্বাপক']
      },
      bleaching_powder: {
        name: 'ব্লিচিং পাউডার',
        made: 'শুকনো কলিচুনের উপর ক্লোরিন গ্যাসের ক্রিয়া: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O।',
        uses: ['তুলো, লিনেন ও কাগজ সাদা করতে', 'পানীয় জল জীবাণুমুক্ত করতে', 'রাসায়নিক শিল্পে জারক হিসেবে']
      },
      plaster_of_paris: {
        name: 'প্লাস্টার অফ প্যারিস',
        made: 'জিপসামকে 373 K (100 °C) এ গরম করা হয়: CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O। জল মেশালে আবার শক্ত জিপসাম হয়ে যায়।',
        uses: ['ভাঙা হাড় ঠিক অবস্থানে ধরে রাখতে', 'খেলনা, সাজানোর জিনিস ও মূর্তি', 'দেওয়াল ও ছাদ মসৃণ করতে']
      }
    },
    daily: [{
        icon: '🦷',
        title: 'দাঁতের ক্ষয়',
        tag: 'pH 5.5 এর নিচে',
        text: 'মুখের ব্যাকটেরিয়া পড়ে থাকা চিনিকে অ্যাসিডে বদলে দেয়। মুখের pH 5.5 এর নিচে নামলে এনামেল (শরীরের সবচেয়ে শক্ত পদার্থ) গলতে শুরু করে। টুথপেস্ট ক্ষারীয়, এই অ্যাসিড প্রশমিত করে, তাই খাওয়ার পর ব্রাশ করো।'
      }, {
        icon: '🌧️',
        title: 'অ্যাসিড বৃষ্টি',
        tag: 'pH 5.6 এর নিচে',
        text: 'গাড়ি ও কারখানার ধোঁয়া বাতাসে সালফার ও নাইট্রোজেনের অক্সাইড মেশায়। এগুলো বৃষ্টিতে দ্রবীভূত হয়ে তাকে অ্যাসিডীয় করে। অ্যাসিড বৃষ্টি নদীর মাছের ক্ষতি করে, ফসল নষ্ট করে আর তাজমহলের মতো মার্বেলের ইমারত ক্ষয় করে।'
      }, {
        icon: '🌱',
        title: 'মাটির pH ও ফসল',
        tag: 'সেরা: pH 6.5 থেকে 7.5',
        text: 'বেশিরভাগ গাছ নিরপেক্ষের কাছাকাছি মাটিতে ভালো জন্মায়। মাটি বেশি অ্যাসিডীয় হলে চাষিরা পোড়া চুন (CaO), কলিচুন (Ca(OH)₂) বা খড়িমাটি (CaCO₃) মেশান। বেশি ক্ষারীয় হলে কম্পোস্টের মতো জৈব পদার্থ মেশান।'
      }, {
        icon: '🐝',
        title: 'অ্যাসিড ও ক্ষার দিয়ে আত্মরক্ষা',
        tag: 'হুল',
        text: 'মৌমাছি বা পিঁপড়ের হুল মিথানোয়িক অ্যাসিড ঢোকায়: বেকিং সোডা ঘষো। বিছুটি পাতাও মিথানোয়িক অ্যাসিড ঢোকায়: কাছেই জন্মানো ডক গাছ আরাম দেয়। বোলতার হুল ক্ষারীয়: ভিনিগার লাগাও।'
      }, {
        icon: '🫃',
        title: 'হজম ও অ্যাসিডিটি',
        tag: 'পাকস্থলী: pH 1.2',
        text: 'খাবার হজম করতে পাকস্থলী হাইড্রোক্লোরিক অ্যাসিড তৈরি করে। বেশি তৈরি হলে জ্বালা ও ব্যথা হয়। মিল্ক অফ ম্যাগনেশিয়া বা বেকিং সোডার মতো অ্যান্টাসিড মৃদু ক্ষার, যা বাড়তি অ্যাসিড প্রশমিত করে।'
      }, {
        icon: '🩸',
        title: 'আমাদের শরীর ছোট সীমা পছন্দ করে',
        tag: 'রক্ত: pH 7.35 থেকে 7.45',
        text: 'জীবন্ত কোষ শুধু ছোট একটি pH সীমায় কাজ করে। আমাদের রক্ত 7.4 এর খুব কাছে থাকে; সামান্য বদলেও আমরা অসুস্থ হই। তাই গুরুতর অসুখে ডাক্তাররা রক্তের pH দেখেন।'
      }],
    quiz: [{
        q: 'লেবুর রসে ডোবালে নীল লিটমাস কাগজ কোন রং হয়?',
        options: ['নীল (কোনো বদল নেই)', 'লাল', 'সবুজ', 'হলুদ'],
        why: 'লেবুর রস অ্যাসিডীয় (pH প্রায় 2)। অ্যাসিড নীল লিটমাসকে লাল করে।'
      }, {
        q: '25 °C এ বিশুদ্ধ জলের pH কত?',
        options: ['0', '7', '14', '1'],
        why: 'বিশুদ্ধ জল নিরপেক্ষ। এতে H⁺ ও OH⁻ আয়ন সমান সংখ্যায় থাকে, তাই pH 7।'
      }, {
        q: 'এর মধ্যে কোন দ্রবণটি সবচেয়ে অ্যাসিডীয়?',
        options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'],
        why: 'pH যত কম, দ্রবণ তত অ্যাসিডীয়। pH 3 এ pH 6 এর চেয়ে 1000 গুণ বেশি H⁺ আয়ন।'
      }, {
        q: 'pH 4 এর দ্রবণে pH 5 এর দ্রবণের চেয়ে কত গুণ বেশি H⁺ আয়ন?',
        options: ['2 গুণ', '10 গুণ', '100 গুণ', 'অর্ধেক'],
        why: 'pH স্কেলে প্রতি 1 ধাপ মানে H⁺ ঘনত্বে 10 গুণ। pH 4 → 10⁻⁴ mol/L; pH 5 → 10⁻⁵ mol/L।'
      }, {
        q: 'সোডিয়াম হাইড্রক্সাইড (NaOH) দ্রবণে ফেনলফথ্যালিন কোন রং?',
        options: ['বর্ণহীন', 'গোলাপি', 'হলুদ', 'লাল'],
        why: 'ফেনলফথ্যালিন অ্যাসিডে বর্ণহীন, ক্ষারে গোলাপি। NaOH তীব্র ক্ষার।'
      }, {
        q: 'জামায় হলুদের দাগে সাবান ঘষলে লাল হয়ে যায়। এতে বোঝা যায় সাবান',
        options: ['অ্যাসিডীয়', 'নিরপেক্ষ', 'ক্ষারীয়', 'একটি লবণ'],
        why: 'হলুদ প্রাকৃতিক নির্দেশক: অ্যাসিড ও নিরপেক্ষ দ্রবণে হলুদ থাকে, ক্ষারে লাল হয়। সাবান ক্ষারীয়।'
      }, {
        q: 'দাঁতের ক্ষয় শুরু হয় যখন মুখের pH নেমে যায়',
        options: ['5.5 এর নিচে', '7 এর নিচে', '8.5 এর নিচে', '2 এর নিচে'],
        why: 'দাঁতের এনামেল pH 5.5 এর নিচে গলতে শুরু করে। ব্যাকটেরিয়া পড়ে থাকা চিনি থেকে এই অ্যাসিড তৈরি করে।'
      }, {
        q: 'বৃষ্টিকে অ্যাসিড বৃষ্টি বলা হয় যখন তার pH',
        options: ['7 এর কম', '5.6 এর কম', '6.5 এর কম', '3 এর কম'],
        why: 'সাধারণ বৃষ্টি দ্রবীভূত CO₂ এর জন্য সামান্য অ্যাসিডীয় (প্রায় 5.6)। 5.6 এর নিচে অ্যাসিড বৃষ্টি, যা সালফার ও নাইট্রোজেনের অক্সাইড থেকে হয়।'
      }, {
        q: 'মিল্ক অফ ম্যাগনেশিয়ার মতো অ্যান্টাসিড অ্যাসিডিটিতে আরাম দেয় কারণ এটা',
        options: ['পাকস্থলীতে আরও অ্যাসিড যোগ করে', 'পাকস্থলীর বাড়তি অ্যাসিড প্রশমিত করে', 'পাকস্থলী ঠান্ডা করে', 'পাকস্থলী থেকে জল বের করে'],
        why: 'মিল্ক অফ ম্যাগনেশিয়া, Mg(OH)₂, একটি মৃদু ক্ষার। এটা পাকস্থলীর বাড়তি হাইড্রোক্লোরিক অ্যাসিড প্রশমিত করে।'
      }, {
        q: 'মৌমাছির হুল ব্যথা দেয় কারণ এটা অ্যাসিড ঢোকায়। ঘরের কোন জিনিস হুলে ঘষলে আরাম মেলে?',
        options: ['ভিনিগার', 'লেবুর রস', 'বেকিং সোডা', 'নুন'],
        why: 'হুল মিথানোয়িক অ্যাসিড ঢোকায়। বেকিং সোডা মৃদু ক্ষার যা তা প্রশমিত করে। ভিনিগার আর লেবুর রস অ্যাসিড, কাজ হবে না।'
      }, {
        q: 'খাবার লবণ (NaCl) তীব্র অ্যাসিড (HCl) ও তীব্র ক্ষার (NaOH) থেকে তৈরি। জলে এর দ্রবণ',
        options: ['অ্যাসিডীয়', 'ক্ষারীয়', 'নিরপেক্ষ', 'কখনও অ্যাসিডীয়, কখনও ক্ষারীয়'],
        why: 'দুই অভিভাবকই তীব্র হলে কেউ জেতে না: লবণের দ্রবণ নিরপেক্ষ, pH 7।'
      }, {
        q: 'অ্যামোনিয়াম ক্লোরাইড (NH₄Cl) দ্রবণ অ্যাসিডীয় কারণ এটা তৈরি',
        options: ['তীব্র অ্যাসিড ও মৃদু ক্ষার থেকে', 'মৃদু অ্যাসিড ও তীব্র ক্ষার থেকে', 'তীব্র অ্যাসিড ও তীব্র ক্ষার থেকে', 'মৃদু অ্যাসিড ও মৃদু ক্ষার থেকে'],
        why: 'HCl তীব্র অ্যাসিড আর NH₄OH মৃদু ক্ষার। শক্তিশালী অভিভাবক জেতে, তাই লবণ অ্যাসিডীয়।'
      }, {
        q: 'HCl + NaOH → ___ + H₂O। ফাঁকা জায়গার উৎপাদ',
        options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'],
        why: 'প্রশমন: অ্যাসিড + ক্ষার → লবণ + জল। হাইড্রোক্লোরিক অ্যাসিড ও সোডিয়াম হাইড্রক্সাইড থেকে সোডিয়াম ক্লোরাইড (খাবার লবণ) ও জল হয়।'
      }, {
        q: 'প্লাস্টার অফ প্যারিস তৈরি হয় কী গরম করে?',
        options: ['খাবার লবণ', 'জিপসাম', 'চুনাপাথর', 'বেকিং সোডা'],
        why: 'জিপসাম (CaSO₄·2H₂O) 373 K এ গরম করলে জল হারিয়ে প্লাস্টার অফ প্যারিস, CaSO₄·½H₂O, হয়।'
      }, {
        q: 'একটি দ্রবণে সর্বজনীন নির্দেশক দিলে সবুজ হয়ে গেল। দ্রবণটি',
        options: ['তীব্র অ্যাসিডীয়', 'নিরপেক্ষ (pH প্রায় 7)', 'তীব্র ক্ষারীয়', 'pH 2'],
        why: 'সর্বজনীন নির্দেশকের চার্টে সবুজ মানে pH 7, নিরপেক্ষ। লাল মানে তীব্র অ্যাসিডীয় আর বেগুনি মানে তীব্র ক্ষারীয়।'
      }]
  },
  mr: {
    facts: {
      hcl: 'प्रयोगशाळेतील तीव्र आम्ल. विरल द्रावणही धोकादायक: कधीही स्पर्श करू नका किंवा चाखू नका.',
      gastric: 'अन्न पचवण्यासाठी आणि जंतू मारण्यासाठी आपले पोट हायड्रोक्लोरिक आम्ल तयार करते.',
      lemon: 'सायट्रिक आम्लामुळे आंबट. जीवनसत्त्व C ने भरपूर.',
      softdrink: 'यात कार्बोनिक आणि फॉस्फोरिक आम्ल असते. म्हणून ते दातांना हानी करते.',
      vinegar: 'अ‍ॅसेटिक (इथेनॉइक) आम्लाचे विरल द्रावण, लोणच्यात वापरतात.',
      tomato: 'सायट्रिक आणि मॅलिक आम्लामुळे सौम्य आम्लधर्मी.',
      curd: 'जीवाणूंनी बनवलेले लॅक्टिक आम्ल दूध आंबवून दही लावते.',
      coffee: 'दुधाशिवायची काळी कॉफी सौम्य आम्लधर्मी असते.',
      tea: 'टॅनिक आम्लामुळे चहाला किंचित कडू, तुरट चव येते.',
      rain: 'स्वच्छ पाऊसही किंचित आम्लधर्मी असतो कारण हवेतील CO₂ त्यात विरघळतो. 5.6 च्या खाली त्याला आम्लवर्षा म्हणतात.',
      milk: 'ताजे दूध अगदी किंचित आम्लधर्मी असते. आंबत जाताना त्याचा pH घटतो.',
      saliva: 'लाळ जवळजवळ उदासीन असते. गोड खाल्ल्यावर जीवाणू आम्ल बनवतात आणि तोंडातील pH घटतो.',
      water: 'शुद्ध पाणी उदासीन: H⁺ आणि OH⁻ आयन समान संख्येने.',
      blood: 'आपले रक्त pH 7.35 ते 7.45 दरम्यान राहते. ते तिथेच ठेवण्यासाठी शरीर खूप मेहनत घेते.',
      seawater: 'विरघळलेल्या क्षारांमुळे आणि कार्बोनेटमुळे किंचित आम्लारीधर्मी.',
      bakingsoda: 'सोडियम हायड्रोजन कार्बोनेट (NaHCO₃), स्वयंपाकात आणि अँटासिडमध्ये वापरली जाणारी सौम्य आम्लारी.',
      toothpaste: 'आम्लारीधर्मी, म्हणून तोंडातील जीवाणूंनी बनवलेले आम्ल उदासीन करते.',
      antacid: 'अँटासिड गोळ्यांमध्ये सौम्य आम्लारी असतात ज्या पोटातील जादा आम्ल उदासीन करतात.',
      soap: 'साबण तेल आणि तीव्र आम्लारीपासून बनतो, म्हणून साबणाचे पाणी आम्लारीधर्मी आणि निसरडे असते.',
      magnesia: 'मॅग्नेशियम हायड्रॉक्साइड, Mg(OH)₂, चे निलंबन, अँटासिड म्हणून वापरतात.',
      ammonia: 'पाण्यात विरघळलेला अमोनिया आम्लारीधर्मी असतो आणि त्याचा वास उग्र असतो. काही स्वच्छता द्रावणांत वापरतात.',
      limewater: 'पाण्यातील कॅल्शियम हायड्रॉक्साइड, Ca(OH)₂. त्यातून CO₂ सोडल्यावर ते दुधाळ होते.',
      bleach: 'घरगुती ब्लीच तीव्र आम्लारीधर्मी आणि संक्षारक आहे. हातमोजे घालून हाताळा.',
      naoh: 'कॉस्टिक सोडा: साबण आणि कागद बनवण्यासाठी वापरली जाणारी तीव्र आम्लारी. अतिशय संक्षारक.'
    },
    ind_why: {
      blue_litmus: 'लिटमस हा शैवाकापासून (लायकेन) मिळणारा नैसर्गिक रंग आहे. आम्ले निळा लिटमस लाल करतात; आम्लारी आणि उदासीन द्रावणे तो निळाच ठेवतात.',
      red_litmus: 'आम्लारी लाल लिटमस निळा करतात. आम्ले आणि उदासीन द्रावणे तो लालच ठेवतात.',
      turmeric: 'हळद आम्लात आणि उदासीन द्रावणात पिवळी राहते आणि आम्लारीत लाल होते. म्हणूनच हळदीच्या डागाला साबण लागला की तो लाल होतो.',
      phenolphthalein: 'फिनॉल्फ्थॅलीन आम्लात आणि उदासीन द्रावणात रंगहीन असते आणि आम्लारीत गुलाबी होते (सुमारे pH 8.2 पासून).',
      methyl_orange: 'मिथिल ऑरेंज तीव्र आम्लात लाल (pH 3.1 च्या खाली), मध्ये नारिंगी आणि pH 4.4 च्या वर पिवळे असते.',
      universal: 'सार्वत्रिक दर्शक हे अनेक रंगद्रव्यांचे मिश्रण आहे. ते प्रत्येक pH ला वेगळा रंग दाखवते: तीव्र आम्लात लाल, उदासीनात हिरवा, तीव्र आम्लारीत जांभळा.',
      china_rose: 'जास्वंदीच्या पाकळ्यांपासून नैसर्गिक दर्शक मिळतो: तो आम्ले गडद गुलाबी आणि आम्लारी हिरव्या करतो.'
    },
    stories: [{
        title: 'अँटासिड विरुद्ध पोटातील आम्ल',
        emoji: '💊',
        text: 'अन्न पचवण्यासाठी आपले पोट हायड्रोक्लोरिक आम्ल (pH सुमारे 1.2) तयार करते. जास्त आम्लाने वेदना आणि जळजळ होते (अ‍ॅसिडिटी). मिल्क ऑफ मॅग्नेशिया, Mg(OH)₂, सारखे अँटासिड ही सौम्य आम्लारी आहे: ती जादा आम्ल उदासीन करते आणि वेदना थांबते.',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O',
        before: 1.2,
        after: 4,
        beforeLabel: 'खूप जास्त आम्ल',
        afterLabel: 'अँटासिडनंतर'
      }, {
        title: 'मधमाशीचा दंश विरुद्ध बेकिंग सोडा',
        emoji: '🐝',
        text: 'मधमाशीचा दंश त्वचेत मिथेनॉइक (फॉर्मिक) आम्ल सोडतो, जे जळजळते. सौम्य आम्लारी असलेल्या बेकिंग सोड्याचा लेप चोळल्याने आम्ल उदासीन होते आणि आराम मिळतो. गांधीलमाशीचा दंश आम्लारीधर्मी असतो, म्हणून त्यावर लोक व्हिनेगरसारखे सौम्य आम्ल लावतात.',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂',
        before: 3,
        after: 7,
        beforeLabel: 'दंश (आम्ल)',
        afterLabel: 'बेकिंग सोड्यानंतर'
      }],
    uses: {
      common_salt: {
        name: 'मीठ',
        made: 'समुद्राचे पाणी बाष्पीभवन करून, किंवा खडे मीठ म्हणून खाणीतून काढून. ते सोडियम हायड्रॉक्साइड, बेकिंग सोडा, धुण्याचा सोडा आणि विरंजक चूर्णाचा कच्चा माल आहे (क्लोर-अल्कली प्रक्रिया: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂).',
        uses: ['स्वयंपाक आणि अन्न टिकवणे (लोणचे, पापड)', 'NaOH, बेकिंग सोडा, धुण्याचा सोडा आणि विरंजक चूर्ण बनवणे', 'थंड देशांत रस्त्यांवरील बर्फ हटवणे']
      },
      washing_soda: {
        name: 'धुण्याचा सोडा',
        made: 'बेकिंग सोडा तापवल्यावर सोडियम कार्बोनेट मिळते; त्याचे पाण्यासह स्फटिकीकरण केल्यावर धुण्याचा सोडा मिळतो: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O.',
        uses: ['काच, साबण आणि कागद बनवणे', 'पाण्याचा कायम जडपणा दूर करणे', 'घरगुती स्वच्छतेसाठी']
      },
      baking_soda: {
        name: 'बेकिंग सोडा',
        made: 'मिठापासून: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃. तापवल्यावर CO₂ देतो: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂.',
        uses: ['बेकिंग पावडर केक आणि ब्रेड मऊ करते (CO₂ चे बुडबुडे)', 'अ‍ॅसिडिटीसाठी अँटासिड', 'सोडा-आम्ल अग्निशामक']
      },
      bleaching_powder: {
        name: 'विरंजक चूर्ण',
        made: 'कोरड्या विरलेल्या चुन्यावर क्लोरीन वायूची क्रिया: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O.',
        uses: ['कापूस, लिनन आणि कागद विरंजन', 'पिण्याचे पाणी निर्जंतुक करणे', 'रासायनिक उद्योगांत ऑक्सिडीकारक']
      },
      plaster_of_paris: {
        name: 'प्लास्टर ऑफ पॅरिस',
        made: 'जिप्सम 373 K (100 °C) पर्यंत तापवतात: CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O. पाण्यात मिसळल्यावर ते पुन्हा कठीण जिप्सम बनते.',
        uses: ['मोडलेली हाडे योग्य स्थितीत धरून ठेवणे', 'खेळणी, सजावटीच्या वस्तू आणि मूर्ती', 'भिंती आणि छत गुळगुळीत करणे']
      }
    },
    daily: [{
        icon: '🦷',
        title: 'दात किडणे',
        tag: 'pH 5.5 च्या खाली',
        text: 'तोंडातील जीवाणू उरलेल्या साखरेचे आम्लात रूपांतर करतात. तोंडातील pH 5.5 च्या खाली गेला की इनॅमल (शरीरातील सर्वात कठीण पदार्थ) विरघळू लागते. टूथपेस्ट आम्लारीधर्मी असते आणि हे आम्ल उदासीन करते, म्हणून जेवणानंतर ब्रश करा.'
      }, {
        icon: '🌧️',
        title: 'आम्लवर्षा',
        tag: 'pH 5.6 च्या खाली',
        text: 'वाहने आणि कारखान्यांचा धूर हवेत सल्फर आणि नायट्रोजनची ऑक्साइडे मिसळतो. ती पावसात विरघळून त्याला आम्लधर्मी बनवतात. आम्लवर्षा नद्यांतील माशांना हानी करते, पिके खराब करते आणि ताजमहालसारख्या संगमरवरी इमारती झिजवते.'
      }, {
        icon: '🌱',
        title: 'मातीचा pH आणि पिके',
        tag: 'उत्तम: pH 6.5 ते 7.5',
        text: 'बहुतेक झाडे उदासीनच्या जवळच्या मातीत उत्तम वाढतात. माती फार आम्लधर्मी असेल तर शेतकरी कळीचा चुना (CaO), विरलेला चुना (Ca(OH)₂) किंवा खडू (CaCO₃) घालतात. फार आम्लारीधर्मी असेल तर कंपोस्टसारखे सेंद्रिय पदार्थ घालतात.'
      }, {
        icon: '🐝',
        title: 'आम्ल आणि आम्लारीने स्वसंरक्षण',
        tag: 'दंश',
        text: 'मधमाशी किंवा मुंगीचा दंश मिथेनॉइक आम्ल सोडतो: बेकिंग सोडा चोळा. खाजकुइलीची पानेही मिथेनॉइक आम्ल सोडतात: जवळच उगवणारी डॉक वनस्पती आराम देते. गांधीलमाशीचा दंश आम्लारीधर्मी असतो: व्हिनेगर लावा.'
      }, {
        icon: '🫃',
        title: 'पचन आणि अ‍ॅसिडिटी',
        tag: 'पोट: pH 1.2',
        text: 'अन्न पचवण्यासाठी पोट हायड्रोक्लोरिक आम्ल तयार करते. ते जास्त तयार झाले की जळजळ आणि वेदना होतात. मिल्क ऑफ मॅग्नेशिया किंवा बेकिंग सोड्यासारखी अँटासिड ही सौम्य आम्लारी असून जादा आम्ल उदासीन करतात.'
      }, {
        icon: '🩸',
        title: 'आपल्या शरीराला अरुंद पट्टा आवडतो',
        tag: 'रक्त: pH 7.35 ते 7.45',
        text: 'जिवंत पेशी फक्त एका अरुंद pH पट्ट्यात काम करतात. आपले रक्त 7.4 च्या अगदी जवळ राहते; थोडासा बदलही आपल्याला आजारी पाडतो. म्हणूनच गंभीर आजारात डॉक्टर रक्ताचा pH तपासतात.'
      }],
    quiz: [{
        q: 'लिंबाच्या रसात बुडवल्यावर निळा लिटमस कागद कोणता रंग घेतो?',
        options: ['निळा (बदल नाही)', 'लाल', 'हिरवा', 'पिवळा'],
        why: 'लिंबाचा रस आम्लधर्मी आहे (pH सुमारे 2). आम्ले निळा लिटमस लाल करतात.'
      }, {
        q: '25 °C ला शुद्ध पाण्याचा pH किती?',
        options: ['0', '7', '14', '1'],
        why: 'शुद्ध पाणी उदासीन आहे. त्यात H⁺ आणि OH⁻ आयन समान संख्येने असतात, म्हणून pH 7.'
      }, {
        q: 'यांपैकी कोणते द्रावण सर्वाधिक आम्लधर्मी आहे?',
        options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'],
        why: 'pH जितका कमी, द्रावण तितके अधिक आम्लधर्मी. pH 3 मध्ये pH 6 पेक्षा 1000 पट अधिक H⁺ आयन असतात.'
      }, {
        q: 'pH 4 च्या द्रावणात pH 5 च्या द्रावणापेक्षा किती पट अधिक H⁺ आयन असतात?',
        options: ['2 पट', '10 पट', '100 पट', 'निम्मे'],
        why: 'pH मापनश्रेणीवरील 1 ची प्रत्येक पायरी म्हणजे H⁺ संहतीत 10 चा गुणक. pH 4 → 10⁻⁴ mol/L; pH 5 → 10⁻⁵ mol/L.'
      }, {
        q: 'सोडियम हायड्रॉक्साइड (NaOH) द्रावणात फिनॉल्फ्थॅलीनचा रंग कोणता?',
        options: ['रंगहीन', 'गुलाबी', 'पिवळा', 'लाल'],
        why: 'फिनॉल्फ्थॅलीन आम्लात रंगहीन असते आणि आम्लारीत गुलाबी होते. NaOH तीव्र आम्लारी आहे.'
      }, {
        q: 'शर्टावरील हळदीचा डाग साबण चोळल्यावर लाल होतो. यावरून साबण',
        options: ['आम्लधर्मी आहे', 'उदासीन आहे', 'आम्लारीधर्मी आहे', 'एक क्षार आहे'],
        why: 'हळद नैसर्गिक दर्शक आहे: आम्लात आणि उदासीन द्रावणात पिवळी राहते पण आम्लारीत लाल होते. साबण आम्लारीधर्मी आहे.'
      }, {
        q: 'तोंडातील pH कशाच्या खाली गेल्यावर दात किडायला सुरुवात होते?',
        options: ['5.5', '7', '8.5', '2'],
        why: 'दातांचे इनॅमल pH 5.5 च्या खाली विरघळू लागते. जीवाणू उरलेल्या साखरेपासून हे आम्ल बनवतात.'
      }, {
        q: 'पावसाचा pH कशाच्या खाली असल्यास त्याला आम्लवर्षा म्हणतात?',
        options: ['7', '5.6', '6.5', '3'],
        why: 'सामान्य पाऊस विरघळलेल्या CO₂ मुळे किंचित आम्लधर्मी (सुमारे 5.6) असतो. 5.6 च्या खाली ती आम्लवर्षा, जी सल्फर आणि नायट्रोजनच्या ऑक्साइडांमुळे होते.'
      }, {
        q: 'मिल्क ऑफ मॅग्नेशियासारखे अँटासिड अ‍ॅसिडिटीत आराम देते कारण ते',
        options: ['पोटात आणखी आम्ल घालते', 'पोटातील जादा आम्ल उदासीन करते', 'पोट थंड करते', 'पोटातील पाणी काढून टाकते'],
        why: 'मिल्क ऑफ मॅग्नेशिया, Mg(OH)₂, ही सौम्य आम्लारी आहे. ती पोटातील जादा हायड्रोक्लोरिक आम्ल उदासीन करते.'
      }, {
        q: 'मधमाशीचा दंश दुखतो कारण तो आम्ल सोडतो. घरातील कोणती वस्तू दंशावर चोळल्याने आराम मिळतो?',
        options: ['व्हिनेगर', 'लिंबाचा रस', 'बेकिंग सोडा', 'मीठ'],
        why: 'दंश मिथेनॉइक आम्ल सोडतो. बेकिंग सोडा ही सौम्य आम्लारी ते उदासीन करते. व्हिनेगर आणि लिंबाचा रस आम्ले आहेत, ती मदत करणार नाहीत.'
      }, {
        q: 'मीठ (NaCl) तीव्र आम्ल (HCl) आणि तीव्र आम्लारी (NaOH) पासून बनते. पाण्यातील त्याचे द्रावण',
        options: ['आम्लधर्मी', 'आम्लारीधर्मी', 'उदासीन', 'कधी आम्लधर्मी, कधी आम्लारीधर्मी'],
        why: 'दोन्ही पालक तीव्र असताना कोणीच जिंकत नाही: क्षाराचे द्रावण उदासीन, pH 7.'
      }, {
        q: 'अमोनियम क्लोराइड (NH₄Cl) चे द्रावण आम्लधर्मी आहे कारण ते बनते',
        options: ['तीव्र आम्ल आणि सौम्य आम्लारीपासून', 'सौम्य आम्ल आणि तीव्र आम्लारीपासून', 'तीव्र आम्ल आणि तीव्र आम्लारीपासून', 'सौम्य आम्ल आणि सौम्य आम्लारीपासून'],
        why: 'HCl तीव्र आम्ल आणि NH₄OH सौम्य आम्लारी आहे. तीव्र पालक जिंकतो, म्हणून क्षार आम्लधर्मी.'
      }, {
        q: 'HCl + NaOH → ___ + H₂O. रिकाम्या जागी येणारा पदार्थ',
        options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'],
        why: 'उदासिनीकरण: आम्ल + आम्लारी → क्षार + पाणी. हायड्रोक्लोरिक आम्ल आणि सोडियम हायड्रॉक्साइडपासून सोडियम क्लोराइड (मीठ) आणि पाणी मिळते.'
      }, {
        q: 'प्लास्टर ऑफ पॅरिस कशाला तापवून बनवतात?',
        options: ['मीठ', 'जिप्सम', 'चुनखडी', 'बेकिंग सोडा'],
        why: 'जिप्सम (CaSO₄·2H₂O) 373 K ला तापवल्यावर पाणी गमावून प्लास्टर ऑफ पॅरिस, CaSO₄·½H₂O, बनते.'
      }, {
        q: 'एका द्रावणात सार्वत्रिक दर्शक टाकल्यावर ते हिरवे झाले. द्रावण',
        options: ['तीव्र आम्लधर्मी', 'उदासीन (pH सुमारे 7)', 'तीव्र आम्लारीधर्मी', 'pH 2'],
        why: 'सार्वत्रिक दर्शकाच्या तक्त्यात हिरवा म्हणजे pH 7, उदासीन. लाल म्हणजे तीव्र आम्लधर्मी आणि जांभळा म्हणजे तीव्र आम्लारीधर्मी.'
      }]
  },
  gu: {
    facts: {
      hcl: 'પ્રયોગશાળાનો પ્રબળ એસિડ. મંદ દ્રાવણ પણ જોખમી: કદી અડશો કે ચાખશો નહીં.',
      gastric: 'ખોરાક પચાવવા અને જંતુ મારવા આપણું પેટ હાઇડ્રોક્લોરિક એસિડ બનાવે છે.',
      lemon: 'સાઇટ્રિક એસિડને લીધે ખાટો. વિટામિન C થી ભરપૂર.',
      softdrink: 'તેમાં કાર્બોનિક અને ફૉસ્ફોરિક એસિડ હોય છે. તેથી તે દાંતને નુકસાન કરે છે.',
      vinegar: 'એસિટિક (ઇથેનોઇક) એસિડનું મંદ દ્રાવણ, અથાણાંમાં વપરાય છે.',
      tomato: 'સાઇટ્રિક અને મૅલિક એસિડને લીધે હળવું એસિડિક.',
      curd: 'બૅક્ટેરિયાએ બનાવેલો લૅક્ટિક એસિડ દૂધને ખાટું કરીને દહીં જમાવે છે.',
      coffee: 'દૂધ વગરની બ્લેક કૉફી હળવી એસિડિક હોય છે.',
      tea: 'ટૅનિક એસિડ ચાને સહેજ કડવો, તૂરો સ્વાદ આપે છે.',
      rain: 'ચોખ્ખો વરસાદ પણ સહેજ એસિડિક હોય છે કારણ કે હવાનો CO₂ તેમાં ઓગળે છે. 5.6 થી નીચે તેને એસિડ વર્ષા કહે છે.',
      milk: 'તાજું દૂધ બહુ સહેજ એસિડિક હોય છે. ખાટું થતાં તેનો pH ઘટે છે.',
      saliva: 'લાળ લગભગ તટસ્થ હોય છે. ગળ્યું ખાધા પછી બૅક્ટેરિયા એસિડ બનાવે છે અને મોંનો pH ઘટે છે.',
      water: 'શુદ્ધ પાણી તટસ્થ છે: H⁺ અને OH⁻ આયન સરખી સંખ્યામાં.',
      blood: 'આપણું લોહી pH 7.35 થી 7.45 વચ્ચે રહે છે. શરીર તેને ત્યાં રાખવા ખૂબ મહેનત કરે છે.',
      seawater: 'ઓગળેલા ક્ષારો અને કાર્બોનેટને લીધે સહેજ બેઝિક.',
      bakingsoda: 'સોડિયમ હાઇડ્રોજન કાર્બોનેટ (NaHCO₃), રસોઈ અને એન્ટાસિડમાં વપરાતો હળવો બેઝ.',
      toothpaste: 'બેઝિક, તેથી મોંમાં બૅક્ટેરિયાએ બનાવેલા એસિડને તટસ્થ કરે છે.',
      antacid: 'એન્ટાસિડ ગોળીઓમાં હળવા બેઝ હોય છે જે પેટના વધારાના એસિડને તટસ્થ કરે છે.',
      soap: 'સાબુ તેલ અને પ્રબળ બેઝમાંથી બને છે, તેથી સાબુનું પાણી બેઝિક હોય છે અને લપસણું લાગે છે.',
      magnesia: 'મૅગ્નેશિયમ હાઇડ્રૉક્સાઇડ, Mg(OH)₂, નું નિલંબન, એન્ટાસિડ તરીકે વપરાય છે.',
      ammonia: 'પાણીમાં ઓગળેલો એમોનિયા બેઝિક હોય છે અને તેની વાસ તીવ્ર હોય છે. કેટલાક ક્લીનરમાં વપરાય છે.',
      limewater: 'પાણીમાં કૅલ્શિયમ હાઇડ્રૉક્સાઇડ, Ca(OH)₂. તેમાં CO₂ પસાર કરતાં તે દૂધિયું થાય છે.',
      bleach: 'ઘરનું બ્લીચ પ્રબળ બેઝિક અને ક્ષારક છે. હાથમોજાં પહેરીને વાપરો.',
      naoh: 'કૉસ્ટિક સોડા: સાબુ અને કાગળ બનાવવા વપરાતો પ્રબળ બેઝ. ખૂબ ક્ષારક.'
    },
    ind_why: {
      blue_litmus: 'લિટમસ લાઇકેનમાંથી મળતો કુદરતી રંગ છે. એસિડ વાદળી લિટમસને લાલ કરે છે; બેઝ અને તટસ્થ દ્રાવણો તેને વાદળી જ રાખે છે.',
      red_litmus: 'બેઝ લાલ લિટમસને વાદળી કરે છે. એસિડ અને તટસ્થ દ્રાવણો તેને લાલ જ રાખે છે.',
      turmeric: 'હળદર એસિડ અને તટસ્થ દ્રાવણમાં પીળી રહે છે અને બેઝમાં લાલ થાય છે. તેથી જ હળદરના ડાઘ પર સાબુ લાગતાં તે લાલ થઈ જાય છે.',
      phenolphthalein: 'ફિનોલ્ફ્થેલિન એસિડ અને તટસ્થ દ્રાવણમાં રંગહીન હોય છે અને બેઝમાં ગુલાબી થાય છે (આશરે pH 8.2 થી).',
      methyl_orange: 'મિથાઇલ ઑરેન્જ પ્રબળ એસિડમાં લાલ (pH 3.1 થી નીચે), વચ્ચે નારંગી અને pH 4.4 થી ઉપર પીળો હોય છે.',
      universal: 'સાર્વત્રિક સૂચક અનેક રંગોનું મિશ્રણ છે. તે દરેક pH માટે જુદો રંગ બતાવે છે: પ્રબળ એસિડમાં લાલ, તટસ્થમાં લીલો, પ્રબળ બેઝમાં જાંબલી.',
      china_rose: 'જાસૂદની પાંખડીઓ કુદરતી સૂચક આપે છે: તે એસિડને ઘેરો ગુલાબી અને બેઝને લીલો કરે છે.'
    },
    stories: [{
        title: 'એન્ટાસિડ વિરુદ્ધ પેટનો એસિડ',
        emoji: '💊',
        text: 'ખોરાક પચાવવા આપણું પેટ હાઇડ્રોક્લોરિક એસિડ (pH આશરે 1.2) બનાવે છે. વધુ એસિડથી દુખાવો અને બળતરા થાય છે (એસિડિટી). મિલ્ક ઑફ મેગ્નેશિયા, Mg(OH)₂, જેવું એન્ટાસિડ હળવો બેઝ છે: તે વધારાના એસિડને તટસ્થ કરે છે અને દુખાવો જતો રહે છે.',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O',
        before: 1.2,
        after: 4,
        beforeLabel: 'ખૂબ વધુ એસિડ',
        afterLabel: 'એન્ટાસિડ પછી'
      }, {
        title: 'મધમાખીનો ડંખ વિરુદ્ધ બેકિંગ સોડા',
        emoji: '🐝',
        text: 'મધમાખીનો ડંખ ચામડીમાં મિથેનોઇક (ફૉર્મિક) એસિડ દાખલ કરે છે, જે બળે છે. હળવા બેઝ બેકિંગ સોડાનો લેપ ઘસવાથી એસિડ તટસ્થ થાય છે અને રાહત મળે છે. ભમરીનો ડંખ બેઝિક હોય છે, તેથી તેના માટે લોકો વિનેગર જેવો હળવો એસિડ વાપરે છે.',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂',
        before: 3,
        after: 7,
        beforeLabel: 'ડંખ (એસિડ)',
        afterLabel: 'બેકિંગ સોડા પછી'
      }],
    uses: {
      common_salt: {
        name: 'મીઠું',
        made: 'દરિયાના પાણીનું બાષ્પીભવન કરીને, અથવા સિંધવ મીઠા તરીકે ખોદીને. તે સોડિયમ હાઇડ્રૉક્સાઇડ, બેકિંગ સોડા, ધોવાનો સોડા અને બ્લીચિંગ પાઉડરનો કાચો માલ છે (ક્લોર-આલ્કલી પ્રક્રિયા: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂).',
        uses: ['રસોઈ અને ખોરાક સાચવવા (અથાણાં, પાપડ)', 'NaOH, બેકિંગ સોડા, ધોવાનો સોડા અને બ્લીચિંગ પાઉડર બનાવવા', 'ઠંડા દેશોમાં રસ્તા પરથી બરફ હટાવવા']
      },
      washing_soda: {
        name: 'ધોવાનો સોડા',
        made: 'બેકિંગ સોડાને ગરમ કરતાં સોડિયમ કાર્બોનેટ બને છે; તેનું પાણી સાથે સ્ફટિકીકરણ કરતાં ધોવાનો સોડા મળે છે: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O.',
        uses: ['કાચ, સાબુ અને કાગળ બનાવવા', 'પાણીની કાયમી કઠિનતા દૂર કરવા', 'ઘરની સફાઈ માટે']
      },
      baking_soda: {
        name: 'બેકિંગ સોડા',
        made: 'મીઠામાંથી: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃. ગરમ કરતાં CO₂ આપે છે: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂.',
        uses: ['બેકિંગ પાઉડર કેક અને બ્રેડને પોચાં બનાવે છે (CO₂ ના પરપોટા)', 'એસિડિટી માટે એન્ટાસિડ', 'સોડા-એસિડ અગ્નિશામક']
      },
      bleaching_powder: {
        name: 'બ્લીચિંગ પાઉડર',
        made: 'સૂકા ફોડેલા ચૂના પર ક્લોરિન વાયુની ક્રિયા: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O.',
        uses: ['કપાસ, લિનન અને કાગળનું વિરંજન', 'પીવાનું પાણી જંતુમુક્ત કરવા', 'રાસાયણિક ઉદ્યોગોમાં ઑક્સિડેશનકર્તા']
      },
      plaster_of_paris: {
        name: 'પ્લાસ્ટર ઑફ પૅરિસ',
        made: 'જિપ્સમને 373 K (100 °C) સુધી ગરમ કરાય છે: CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O. પાણી સાથે ભેળવતાં તે ફરી કઠણ જિપ્સમ બની જાય છે.',
        uses: ['તૂટેલાં હાડકાંને યોગ્ય સ્થિતિમાં ટેકો આપવા', 'રમકડાં, સુશોભનની વસ્તુઓ અને મૂર્તિઓ', 'દીવાલો અને છત લીસી કરવા']
      }
    },
    daily: [{
        icon: '🦷',
        title: 'દાંતનો સડો',
        tag: 'pH 5.5 થી નીચે',
        text: 'મોંના બૅક્ટેરિયા બચેલી ખાંડને એસિડમાં ફેરવે છે. મોંનો pH 5.5 થી નીચે જાય ત્યારે ઇનેમલ (શરીરનો સૌથી કઠણ પદાર્થ) ઓગળવા લાગે છે. ટૂથપેસ્ટ બેઝિક છે અને આ એસિડને તટસ્થ કરે છે, તેથી જમ્યા પછી બ્રશ કરો.'
      }, {
        icon: '🌧️',
        title: 'એસિડ વર્ષા',
        tag: 'pH 5.6 થી નીચે',
        text: 'વાહનો અને કારખાનાંનો ધુમાડો હવામાં સલ્ફર અને નાઇટ્રોજનના ઑક્સાઇડ ઉમેરે છે. તે વરસાદમાં ઓગળીને તેને એસિડિક બનાવે છે. એસિડ વર્ષા નદીઓની માછલીઓને નુકસાન કરે છે, પાક બગાડે છે અને તાજમહેલ જેવી આરસની ઇમારતોને ખાઈ જાય છે.'
      }, {
        icon: '🌱',
        title: 'જમીનનો pH અને પાક',
        tag: 'શ્રેષ્ઠ: pH 6.5 થી 7.5',
        text: 'મોટા ભાગના છોડ તટસ્થની નજીકની જમીનમાં સૌથી સારા ઊગે છે. જમીન વધુ એસિડિક હોય તો ખેડૂતો કળીચૂનો (CaO), ફોડેલો ચૂનો (Ca(OH)₂) કે ચાક (CaCO₃) ઉમેરે છે. વધુ બેઝિક હોય તો ખાતર જેવો સેન્દ્રિય પદાર્થ ઉમેરે છે.'
      }, {
        icon: '🐝',
        title: 'એસિડ અને બેઝથી સ્વબચાવ',
        tag: 'ડંખ',
        text: 'મધમાખી કે કીડીનો ડંખ મિથેનોઇક એસિડ દાખલ કરે છે: બેકિંગ સોડા ઘસો. બિછુ-વનસ્પતિનાં પાન પણ મિથેનોઇક એસિડ દાખલ કરે છે: પાસે જ ઊગતો ડૉક છોડ રાહત આપે છે. ભમરીનો ડંખ બેઝિક છે: વિનેગર લગાવો.'
      }, {
        icon: '🫃',
        title: 'પાચન અને એસિડિટી',
        tag: 'પેટ: pH 1.2',
        text: 'ખોરાક પચાવવા પેટ હાઇડ્રોક્લોરિક એસિડ બનાવે છે. તે વધુ બને ત્યારે બળતરા અને દુખાવો થાય છે. મિલ્ક ઑફ મેગ્નેશિયા કે બેકિંગ સોડા જેવાં એન્ટાસિડ હળવા બેઝ છે જે વધારાના એસિડને તટસ્થ કરે છે.'
      }, {
        icon: '🩸',
        title: 'આપણા શરીરને સાંકડી મર્યાદા ગમે છે',
        tag: 'લોહી: pH 7.35 થી 7.45',
        text: 'જીવંત કોષો માત્ર સાંકડી pH મર્યાદામાં જ કામ કરે છે. આપણું લોહી 7.4 ની ખૂબ નજીક રહે છે; નાનો ફેરફાર પણ આપણને બીમાર કરે છે. તેથી ગંભીર બીમારીમાં ડૉક્ટર લોહીનો pH તપાસે છે.'
      }],
    quiz: [{
        q: 'લીંબુના રસમાં બોળતાં વાદળી લિટમસ પત્ર કયો રંગ થાય છે?',
        options: ['વાદળી (કોઈ ફેરફાર નહીં)', 'લાલ', 'લીલો', 'પીળો'],
        why: 'લીંબુનો રસ એસિડિક છે (pH આશરે 2). એસિડ વાદળી લિટમસને લાલ કરે છે.'
      }, {
        q: '25 °C પર શુદ્ધ પાણીનો pH કેટલો હોય છે?',
        options: ['0', '7', '14', '1'],
        why: 'શુદ્ધ પાણી તટસ્થ છે. તેમાં H⁺ અને OH⁻ આયન સરખી સંખ્યામાં હોય છે, તેથી pH 7.'
      }, {
        q: 'આમાંથી કયું દ્રાવણ સૌથી વધુ એસિડિક છે?',
        options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'],
        why: 'pH જેટલો ઓછો, દ્રાવણ તેટલું વધુ એસિડિક. pH 3 માં pH 6 કરતાં 1000 ગણા વધુ H⁺ આયન છે.'
      }, {
        q: 'pH 4 ના દ્રાવણમાં pH 5 ના દ્રાવણ કરતાં કેટલા ગણા વધુ H⁺ આયન છે?',
        options: ['2 ગણા', '10 ગણા', '100 ગણા', 'અડધા'],
        why: 'pH માપક્રમ પર 1 નું દરેક પગલું H⁺ સાંદ્રતામાં 10 નો ગુણાંક છે. pH 4 → 10⁻⁴ mol/L; pH 5 → 10⁻⁵ mol/L.'
      }, {
        q: 'સોડિયમ હાઇડ્રૉક્સાઇડ (NaOH) દ્રાવણમાં ફિનોલ્ફ્થેલિન કયો રંગ બતાવે?',
        options: ['રંગહીન', 'ગુલાબી', 'પીળો', 'લાલ'],
        why: 'ફિનોલ્ફ્થેલિન એસિડમાં રંગહીન હોય છે અને બેઝમાં ગુલાબી થાય છે. NaOH પ્રબળ બેઝ છે.'
      }, {
        q: 'શર્ટ પરનો હળદરનો ડાઘ સાબુ ઘસતાં લાલ થાય છે. આ બતાવે છે કે સાબુ',
        options: ['એસિડિક છે', 'તટસ્થ છે', 'બેઝિક છે', 'ક્ષાર છે'],
        why: 'હળદર કુદરતી સૂચક છે: એસિડ અને તટસ્થ દ્રાવણમાં પીળી રહે છે પણ બેઝમાં લાલ થાય છે. સાબુ બેઝિક છે.'
      }, {
        q: 'મોંનો pH કેટલાથી નીચે જાય ત્યારે દાંતનો સડો શરૂ થાય છે?',
        options: ['5.5', '7', '8.5', '2'],
        why: 'દાંતનું ઇનેમલ pH 5.5 થી નીચે ઓગળવા લાગે છે. બૅક્ટેરિયા બચેલી ખાંડમાંથી આ એસિડ બનાવે છે.'
      }, {
        q: 'વરસાદનો pH કેટલાથી ઓછો હોય ત્યારે તેને એસિડ વર્ષા કહે છે?',
        options: ['7', '5.6', '6.5', '3'],
        why: 'સામાન્ય વરસાદ ઓગળેલા CO₂ ને લીધે સહેજ એસિડિક (આશરે 5.6) હોય છે. 5.6 થી નીચે તે એસિડ વર્ષા છે, જે સલ્ફર અને નાઇટ્રોજનના ઑક્સાઇડથી થાય છે.'
      }, {
        q: 'મિલ્ક ઑફ મેગ્નેશિયા જેવું એન્ટાસિડ એસિડિટીમાં રાહત આપે છે કારણ કે તે',
        options: ['પેટમાં વધુ એસિડ ઉમેરે છે', 'પેટના વધારાના એસિડને તટસ્થ કરે છે', 'પેટને ઠંડું કરે છે', 'પેટમાંથી પાણી કાઢે છે'],
        why: 'મિલ્ક ઑફ મેગ્નેશિયા, Mg(OH)₂, હળવો બેઝ છે. તે પેટના વધારાના હાઇડ્રોક્લોરિક એસિડને તટસ્થ કરે છે.'
      }, {
        q: 'મધમાખીનો ડંખ દુખે છે કારણ કે તે એસિડ દાખલ કરે છે. ઘરની કઈ વસ્તુ ડંખ પર ઘસવાથી રાહત મળે?',
        options: ['વિનેગર', 'લીંબુનો રસ', 'બેકિંગ સોડા', 'મીઠું'],
        why: 'ડંખ મિથેનોઇક એસિડ દાખલ કરે છે. બેકિંગ સોડા હળવો બેઝ છે જે તેને તટસ્થ કરે છે. વિનેગર અને લીંબુનો રસ એસિડ છે અને મદદ ન કરે.'
      }, {
        q: 'મીઠું (NaCl) પ્રબળ એસિડ (HCl) અને પ્રબળ બેઝ (NaOH) માંથી બને છે. પાણીમાં તેનું દ્રાવણ',
        options: ['એસિડિક', 'બેઝિક', 'તટસ્થ', 'ક્યારેક એસિડિક, ક્યારેક બેઝિક'],
        why: 'બંને માતા-પિતા પ્રબળ હોય ત્યારે કોઈ જીતતું નથી: ક્ષારનું દ્રાવણ તટસ્થ, pH 7.'
      }, {
        q: 'એમોનિયમ ક્લોરાઇડ (NH₄Cl) નું દ્રાવણ એસિડિક છે કારણ કે તે બને છે',
        options: ['પ્રબળ એસિડ અને નિર્બળ બેઝમાંથી', 'નિર્બળ એસિડ અને પ્રબળ બેઝમાંથી', 'પ્રબળ એસિડ અને પ્રબળ બેઝમાંથી', 'નિર્બળ એસિડ અને નિર્બળ બેઝમાંથી'],
        why: 'HCl પ્રબળ એસિડ અને NH₄OH નિર્બળ બેઝ છે. પ્રબળ માતા-પિતા જીતે, તેથી ક્ષાર એસિડિક.'
      }, {
        q: 'HCl + NaOH → ___ + H₂O. ખાલી જગ્યાની નીપજ',
        options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'],
        why: 'તટસ્થીકરણ: એસિડ + બેઝ → ક્ષાર + પાણી. હાઇડ્રોક્લોરિક એસિડ અને સોડિયમ હાઇડ્રૉક્સાઇડમાંથી સોડિયમ ક્લોરાઇડ (મીઠું) અને પાણી બને છે.'
      }, {
        q: 'પ્લાસ્ટર ઑફ પૅરિસ શેને ગરમ કરીને બનાવાય છે?',
        options: ['મીઠું', 'જિપ્સમ', 'ચૂનાનો પથ્થર', 'બેકિંગ સોડા'],
        why: 'જિપ્સમ (CaSO₄·2H₂O) ને 373 K પર ગરમ કરતાં પાણી ગુમાવીને પ્લાસ્ટર ઑફ પૅરિસ, CaSO₄·½H₂O, બને છે.'
      }, {
        q: 'એક દ્રાવણમાં સાર્વત્રિક સૂચક ઉમેરતાં તે લીલું થયું. દ્રાવણ',
        options: ['પ્રબળ એસિડિક', 'તટસ્થ (pH આશરે 7)', 'પ્રબળ બેઝિક', 'pH 2'],
        why: 'સાર્વત્રિક સૂચકના ચાર્ટમાં લીલો એટલે pH 7, તટસ્થ. લાલ એટલે પ્રબળ એસિડિક અને જાંબલી એટલે પ્રબળ બેઝિક.'
      }]
  },
  pa: {
    facts: {
      hcl: 'ਪ੍ਰਯੋਗਸ਼ਾਲਾ ਦਾ ਤੇਜ਼ ਤੇਜ਼ਾਬ। ਪਤਲਾ ਘੋਲ ਵੀ ਖ਼ਤਰਨਾਕ ਹੈ: ਕਦੇ ਛੂਹੋ ਜਾਂ ਚੱਖੋ ਨਾ।',
      gastric: 'ਸਾਡਾ ਪੇਟ ਖਾਣਾ ਪਚਾਉਣ ਤੇ ਕੀਟਾਣੂ ਮਾਰਨ ਲਈ ਹਾਈਡ੍ਰੋਕਲੋਰਿਕ ਤੇਜ਼ਾਬ ਬਣਾਉਂਦਾ ਹੈ।',
      lemon: 'ਸਿਟਰਿਕ ਤੇਜ਼ਾਬ ਕਰਕੇ ਖੱਟਾ। ਵਿਟਾਮਿਨ C ਨਾਲ ਭਰਪੂਰ।',
      softdrink: 'ਇਸ ਵਿੱਚ ਕਾਰਬੋਨਿਕ ਤੇ ਫ਼ਾਸਫ਼ੋਰਿਕ ਤੇਜ਼ਾਬ ਹੁੰਦੇ ਹਨ। ਇਸੇ ਲਈ ਇਹ ਦੰਦਾਂ ਨੂੰ ਨੁਕਸਾਨ ਕਰਦੀ ਹੈ।',
      vinegar: 'ਐਸੀਟਿਕ (ਇਥੇਨੋਇਕ) ਤੇਜ਼ਾਬ ਦਾ ਪਤਲਾ ਘੋਲ, ਅਚਾਰ ਵਿੱਚ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।',
      tomato: 'ਸਿਟਰਿਕ ਤੇ ਮੈਲਿਕ ਤੇਜ਼ਾਬ ਕਰਕੇ ਹਲਕਾ ਤੇਜ਼ਾਬੀ।',
      curd: 'ਬੈਕਟੀਰੀਆ ਦਾ ਬਣਾਇਆ ਲੈਕਟਿਕ ਤੇਜ਼ਾਬ ਦੁੱਧ ਨੂੰ ਖੱਟਾ ਕਰਕੇ ਦਹੀਂ ਜਮਾ ਦਿੰਦਾ ਹੈ।',
      coffee: 'ਬਿਨਾਂ ਦੁੱਧ ਦੀ ਕਾਲੀ ਕੌਫ਼ੀ ਹਲਕੀ ਤੇਜ਼ਾਬੀ ਹੁੰਦੀ ਹੈ।',
      tea: 'ਟੈਨਿਕ ਤੇਜ਼ਾਬ ਚਾਹ ਨੂੰ ਹਲਕਾ ਕੌੜਾ, ਕਸੈਲਾ ਸੁਆਦ ਦਿੰਦਾ ਹੈ।',
      rain: 'ਸਾਫ਼ ਮੀਂਹ ਵੀ ਥੋੜ੍ਹਾ ਤੇਜ਼ਾਬੀ ਹੁੰਦਾ ਹੈ ਕਿਉਂਕਿ ਹਵਾ ਦਾ CO₂ ਇਸ ਵਿੱਚ ਘੁਲ ਜਾਂਦਾ ਹੈ। 5.6 ਤੋਂ ਹੇਠਾਂ ਇਸਨੂੰ ਤੇਜ਼ਾਬੀ ਮੀਂਹ ਕਹਿੰਦੇ ਹਨ।',
      milk: 'ਤਾਜ਼ਾ ਦੁੱਧ ਬਹੁਤ ਹਲਕਾ ਤੇਜ਼ਾਬੀ ਹੁੰਦਾ ਹੈ। ਖੱਟਾ ਹੋਣ \'ਤੇ ਇਸਦਾ pH ਡਿੱਗਦਾ ਹੈ।',
      saliva: 'ਥੁੱਕ ਲਗਭਗ ਉਦਾਸੀਨ ਹੁੰਦਾ ਹੈ। ਮਿੱਠਾ ਖਾਣ ਤੋਂ ਬਾਅਦ ਬੈਕਟੀਰੀਆ ਤੇਜ਼ਾਬ ਬਣਾਉਂਦੇ ਹਨ ਤੇ ਮੂੰਹ ਦਾ pH ਡਿੱਗ ਜਾਂਦਾ ਹੈ।',
      water: 'ਸ਼ੁੱਧ ਪਾਣੀ ਉਦਾਸੀਨ ਹੈ: H⁺ ਤੇ OH⁻ ਆਇਨ ਬਰਾਬਰ ਗਿਣਤੀ ਵਿੱਚ।',
      blood: 'ਸਾਡਾ ਖ਼ੂਨ pH 7.35 ਤੋਂ 7.45 ਵਿਚਕਾਰ ਰਹਿੰਦਾ ਹੈ। ਸਰੀਰ ਇਸਨੂੰ ਉੱਥੇ ਰੱਖਣ ਲਈ ਬਹੁਤ ਮਿਹਨਤ ਕਰਦਾ ਹੈ।',
      seawater: 'ਘੁਲੇ ਲੂਣਾਂ ਤੇ ਕਾਰਬੋਨੇਟਾਂ ਕਰਕੇ ਥੋੜ੍ਹਾ ਖਾਰੀ।',
      bakingsoda: 'ਸੋਡੀਅਮ ਹਾਈਡ੍ਰੋਜਨਕਾਰਬੋਨੇਟ (NaHCO₃), ਇੱਕ ਹਲਕਾ ਖਾਰ ਜੋ ਰਸੋਈ ਤੇ ਐਂਟਾਸਿਡ ਵਿੱਚ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।',
      toothpaste: 'ਖਾਰੀ, ਇਸ ਲਈ ਮੂੰਹ ਵਿੱਚ ਬੈਕਟੀਰੀਆ ਦੇ ਬਣਾਏ ਤੇਜ਼ਾਬ ਨੂੰ ਉਦਾਸੀਨ ਕਰਦਾ ਹੈ।',
      antacid: 'ਐਂਟਾਸਿਡ ਗੋਲੀਆਂ ਵਿੱਚ ਹਲਕੇ ਖਾਰ ਹੁੰਦੇ ਹਨ ਜੋ ਪੇਟ ਦੇ ਵਾਧੂ ਤੇਜ਼ਾਬ ਨੂੰ ਉਦਾਸੀਨ ਕਰਦੇ ਹਨ।',
      soap: 'ਸਾਬਣ ਤੇਲ ਤੇ ਤੇਜ਼ ਖਾਰ ਤੋਂ ਬਣਦਾ ਹੈ, ਇਸ ਲਈ ਸਾਬਣ ਦਾ ਪਾਣੀ ਖਾਰੀ ਹੁੰਦਾ ਹੈ ਤੇ ਤਿਲਕਵਾਂ ਲੱਗਦਾ ਹੈ।',
      magnesia: 'ਮੈਗਨੀਸ਼ੀਅਮ ਹਾਈਡ੍ਰੋਕਸਾਈਡ, Mg(OH)₂, ਦਾ ਨਿਲੰਬਨ, ਐਂਟਾਸਿਡ ਵਜੋਂ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।',
      ammonia: 'ਪਾਣੀ ਵਿੱਚ ਘੁਲਿਆ ਅਮੋਨੀਆ ਖਾਰੀ ਹੁੰਦਾ ਹੈ ਤੇ ਇਸਦੀ ਗੰਧ ਤਿੱਖੀ ਹੁੰਦੀ ਹੈ। ਕੁਝ ਸਫ਼ਾਈ ਵਾਲੇ ਘੋਲਾਂ ਵਿੱਚ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।',
      limewater: 'ਪਾਣੀ ਵਿੱਚ ਕੈਲਸ਼ੀਅਮ ਹਾਈਡ੍ਰੋਕਸਾਈਡ, Ca(OH)₂। ਇਸ ਵਿੱਚੋਂ CO₂ ਲੰਘਾਉਣ \'ਤੇ ਇਹ ਦੁੱਧੀਆ ਹੋ ਜਾਂਦਾ ਹੈ।',
      bleach: 'ਘਰੇਲੂ ਬਲੀਚ ਤੇਜ਼ ਖਾਰੀ ਤੇ ਖੋਰਨ ਵਾਲਾ ਹੈ। ਦਸਤਾਨੇ ਪਾ ਕੇ ਵਰਤੋ।',
      naoh: 'ਕਾਸਟਿਕ ਸੋਡਾ: ਸਾਬਣ ਤੇ ਕਾਗਜ਼ ਬਣਾਉਣ ਲਈ ਵਰਤਿਆ ਜਾਣ ਵਾਲਾ ਤੇਜ਼ ਖਾਰ। ਬਹੁਤ ਖੋਰਨ ਵਾਲਾ।'
    },
    ind_why: {
      blue_litmus: 'ਲਿਟਮਸ ਲਾਈਕੇਨ ਤੋਂ ਮਿਲਣ ਵਾਲਾ ਕੁਦਰਤੀ ਰੰਗ ਹੈ। ਤੇਜ਼ਾਬ ਨੀਲੇ ਲਿਟਮਸ ਨੂੰ ਲਾਲ ਕਰ ਦਿੰਦੇ ਹਨ; ਖਾਰ ਤੇ ਉਦਾਸੀਨ ਘੋਲ ਇਸਨੂੰ ਨੀਲਾ ਹੀ ਰਹਿਣ ਦਿੰਦੇ ਹਨ।',
      red_litmus: 'ਖਾਰ ਲਾਲ ਲਿਟਮਸ ਨੂੰ ਨੀਲਾ ਕਰ ਦਿੰਦੇ ਹਨ। ਤੇਜ਼ਾਬ ਤੇ ਉਦਾਸੀਨ ਘੋਲ ਇਸਨੂੰ ਲਾਲ ਹੀ ਰਹਿਣ ਦਿੰਦੇ ਹਨ।',
      turmeric: 'ਹਲਦੀ ਤੇਜ਼ਾਬ ਤੇ ਉਦਾਸੀਨ ਘੋਲ ਵਿੱਚ ਪੀਲੀ ਰਹਿੰਦੀ ਹੈ ਤੇ ਖਾਰ ਵਿੱਚ ਲਾਲ ਹੋ ਜਾਂਦੀ ਹੈ। ਇਸੇ ਲਈ ਹਲਦੀ ਦਾ ਦਾਗ਼ ਸਾਬਣ ਲੱਗਦੇ ਹੀ ਲਾਲ ਹੋ ਜਾਂਦਾ ਹੈ।',
      phenolphthalein: 'ਫ਼ਿਨੌਲਫ਼ਥੈਲੀਨ ਤੇਜ਼ਾਬ ਤੇ ਉਦਾਸੀਨ ਘੋਲ ਵਿੱਚ ਰੰਗਹੀਣ ਰਹਿੰਦਾ ਹੈ ਤੇ ਖਾਰ ਵਿੱਚ ਗੁਲਾਬੀ ਹੋ ਜਾਂਦਾ ਹੈ (ਲਗਭਗ pH 8.2 ਤੋਂ)।',
      methyl_orange: 'ਮਿਥਾਈਲ ਔਰੇਂਜ ਤੇਜ਼ ਤੇਜ਼ਾਬ ਵਿੱਚ ਲਾਲ (pH 3.1 ਤੋਂ ਹੇਠਾਂ), ਵਿਚਕਾਰ ਸੰਤਰੀ ਤੇ pH 4.4 ਤੋਂ ਉੱਪਰ ਪੀਲਾ ਹੁੰਦਾ ਹੈ।',
      universal: 'ਸਰਵਵਿਆਪੀ ਸੂਚਕ ਕਈ ਰੰਗਾਂ ਦਾ ਮਿਸ਼ਰਣ ਹੈ। ਇਹ ਹਰ pH \'ਤੇ ਵੱਖਰਾ ਰੰਗ ਦਿਖਾਉਂਦਾ ਹੈ: ਤੇਜ਼ ਤੇਜ਼ਾਬ ਵਿੱਚ ਲਾਲ, ਉਦਾਸੀਨ ਵਿੱਚ ਹਰਾ, ਤੇਜ਼ ਖਾਰ ਵਿੱਚ ਬੈਂਗਣੀ।',
      china_rose: 'ਗੁੜਹਲ ਦੀਆਂ ਪੱਤੀਆਂ ਕੁਦਰਤੀ ਸੂਚਕ ਦਿੰਦੀਆਂ ਹਨ: ਇਹ ਤੇਜ਼ਾਬ ਨੂੰ ਗੂੜ੍ਹਾ ਗੁਲਾਬੀ ਤੇ ਖਾਰ ਨੂੰ ਹਰਾ ਕਰ ਦਿੰਦਾ ਹੈ।'
    },
    stories: [{
        title: 'ਐਂਟਾਸਿਡ ਬਨਾਮ ਪੇਟ ਦਾ ਤੇਜ਼ਾਬ',
        emoji: '💊',
        text: 'ਸਾਡਾ ਪੇਟ ਖਾਣਾ ਪਚਾਉਣ ਲਈ ਹਾਈਡ੍ਰੋਕਲੋਰਿਕ ਤੇਜ਼ਾਬ (pH ਲਗਭਗ 1.2) ਬਣਾਉਂਦਾ ਹੈ। ਵੱਧ ਤੇਜ਼ਾਬ ਨਾਲ ਦਰਦ ਤੇ ਜਲਣ ਹੁੰਦੀ ਹੈ (ਐਸਿਡਿਟੀ)। ਮਿਲਕ ਆਫ਼ ਮੈਗਨੀਸ਼ੀਆ, Mg(OH)₂, ਵਰਗਾ ਐਂਟਾਸਿਡ ਇੱਕ ਹਲਕਾ ਖਾਰ ਹੈ: ਇਹ ਵਾਧੂ ਤੇਜ਼ਾਬ ਨੂੰ ਉਦਾਸੀਨ ਕਰ ਦਿੰਦਾ ਹੈ ਤੇ ਦਰਦ ਚਲਾ ਜਾਂਦਾ ਹੈ।',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O',
        before: 1.2,
        after: 4,
        beforeLabel: 'ਬਹੁਤ ਜ਼ਿਆਦਾ ਤੇਜ਼ਾਬ',
        afterLabel: 'ਐਂਟਾਸਿਡ ਤੋਂ ਬਾਅਦ'
      }, {
        title: 'ਮਧੂਮੱਖੀ ਦਾ ਡੰਗ ਬਨਾਮ ਬੇਕਿੰਗ ਸੋਡਾ',
        emoji: '🐝',
        text: 'ਮਧੂਮੱਖੀ ਦਾ ਡੰਗ ਚਮੜੀ ਵਿੱਚ ਮੀਥੇਨੋਇਕ (ਫ਼ਾਰਮਿਕ) ਤੇਜ਼ਾਬ ਛੱਡਦਾ ਹੈ, ਜਿਸ ਨਾਲ ਜਲਣ ਹੁੰਦੀ ਹੈ। ਹਲਕੇ ਖਾਰ ਬੇਕਿੰਗ ਸੋਡੇ ਦਾ ਲੇਪ ਮਲਣ ਨਾਲ ਤੇਜ਼ਾਬ ਉਦਾਸੀਨ ਹੋ ਜਾਂਦਾ ਹੈ ਤੇ ਆਰਾਮ ਮਿਲਦਾ ਹੈ। ਭਰਿੰਡ ਦਾ ਡੰਗ ਖਾਰੀ ਹੁੰਦਾ ਹੈ, ਇਸ ਲਈ ਉਸ \'ਤੇ ਲੋਕ ਸਿਰਕੇ ਵਰਗਾ ਹਲਕਾ ਤੇਜ਼ਾਬ ਲਾਉਂਦੇ ਹਨ।',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂',
        before: 3,
        after: 7,
        beforeLabel: 'ਡੰਗ (ਤੇਜ਼ਾਬ)',
        afterLabel: 'ਬੇਕਿੰਗ ਸੋਡੇ ਤੋਂ ਬਾਅਦ'
      }],
    uses: {
      common_salt: {
        name: 'ਆਮ ਲੂਣ',
        made: 'ਸਮੁੰਦਰ ਦੇ ਪਾਣੀ ਨੂੰ ਵਾਸ਼ਪਿਤ ਕਰਕੇ, ਜਾਂ ਸੇਂਧਾ ਲੂਣ ਵਜੋਂ ਖੋਦ ਕੇ। ਇਹ ਸੋਡੀਅਮ ਹਾਈਡ੍ਰੋਕਸਾਈਡ, ਬੇਕਿੰਗ ਸੋਡਾ, ਧੋਣ ਵਾਲੇ ਸੋਡੇ ਤੇ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਦਾ ਕੱਚਾ ਮਾਲ ਹੈ (ਕਲੋਰ-ਐਲਕਲੀ ਪ੍ਰਕਿਰਿਆ: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂)।',
        uses: ['ਖਾਣਾ ਬਣਾਉਣ ਤੇ ਸੰਭਾਲਣ ਵਿੱਚ (ਅਚਾਰ, ਪਾਪੜ)', 'NaOH, ਬੇਕਿੰਗ ਸੋਡਾ, ਧੋਣ ਵਾਲਾ ਸੋਡਾ ਤੇ ਬਲੀਚਿੰਗ ਪਾਊਡਰ ਬਣਾਉਣ ਵਿੱਚ', 'ਠੰਢੇ ਦੇਸ਼ਾਂ ਵਿੱਚ ਸੜਕਾਂ ਤੋਂ ਬਰਫ਼ ਹਟਾਉਣ ਵਿੱਚ']
      },
      washing_soda: {
        name: 'ਧੋਣ ਵਾਲਾ ਸੋਡਾ',
        made: 'ਬੇਕਿੰਗ ਸੋਡੇ ਨੂੰ ਗਰਮ ਕਰਨ \'ਤੇ ਸੋਡੀਅਮ ਕਾਰਬੋਨੇਟ ਬਣਦਾ ਹੈ; ਇਸਨੂੰ ਪਾਣੀ ਨਾਲ ਕ੍ਰਿਸਟਲ ਬਣਾਉਣ \'ਤੇ ਧੋਣ ਵਾਲਾ ਸੋਡਾ ਮਿਲਦਾ ਹੈ: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O।',
        uses: ['ਕੱਚ, ਸਾਬਣ ਤੇ ਕਾਗਜ਼ ਬਣਾਉਣ ਵਿੱਚ', 'ਪਾਣੀ ਦੀ ਸਥਾਈ ਕਠੋਰਤਾ ਹਟਾਉਣ ਵਿੱਚ', 'ਘਰ ਦੀ ਸਫ਼ਾਈ ਲਈ']
      },
      baking_soda: {
        name: 'ਬੇਕਿੰਗ ਸੋਡਾ',
        made: 'ਆਮ ਲੂਣ ਤੋਂ: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃। ਗਰਮ ਕਰਨ \'ਤੇ ਇਹ CO₂ ਦਿੰਦਾ ਹੈ: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂।',
        uses: ['ਬੇਕਿੰਗ ਪਾਊਡਰ ਕੇਕ ਤੇ ਬ੍ਰੈੱਡ ਨੂੰ ਨਰਮ ਬਣਾਉਂਦਾ ਹੈ (CO₂ ਦੇ ਬੁਲਬੁਲੇ)', 'ਐਸਿਡਿਟੀ ਲਈ ਐਂਟਾਸਿਡ', 'ਸੋਡਾ-ਤੇਜ਼ਾਬ ਅੱਗ ਬੁਝਾਊ ਯੰਤਰ']
      },
      bleaching_powder: {
        name: 'ਬਲੀਚਿੰਗ ਪਾਊਡਰ',
        made: 'ਸੁੱਕੇ ਬੁਝੇ ਚੂਨੇ \'ਤੇ ਕਲੋਰੀਨ ਗੈਸ ਦੀ ਕਿਰਿਆ: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O।',
        uses: ['ਕਪਾਹ, ਲਿਨਨ ਤੇ ਕਾਗਜ਼ ਨੂੰ ਬਲੀਚ ਕਰਨਾ', 'ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਨੂੰ ਕੀਟਾਣੂ-ਰਹਿਤ ਕਰਨਾ', 'ਰਸਾਇਣਕ ਉਦਯੋਗਾਂ ਵਿੱਚ ਆਕਸੀਕਾਰਕ']
      },
      plaster_of_paris: {
        name: 'ਪਲਾਸਟਰ ਆਫ਼ ਪੈਰਿਸ',
        made: 'ਜਿਪਸਮ ਨੂੰ 373 K (100 °C) ਤੱਕ ਗਰਮ ਕੀਤਾ ਜਾਂਦਾ ਹੈ: CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O। ਪਾਣੀ ਮਿਲਾਉਣ \'ਤੇ ਇਹ ਫਿਰ ਸਖ਼ਤ ਜਿਪਸਮ ਬਣ ਜਾਂਦਾ ਹੈ।',
        uses: ['ਟੁੱਟੀਆਂ ਹੱਡੀਆਂ ਨੂੰ ਸਹੀ ਥਾਂ ਸਹਾਰਾ ਦੇਣਾ', 'ਖਿਡੌਣੇ, ਸਜਾਵਟੀ ਚੀਜ਼ਾਂ ਤੇ ਮੂਰਤੀਆਂ', 'ਕੰਧਾਂ ਤੇ ਛੱਤਾਂ ਨੂੰ ਪੱਧਰਾ ਕਰਨਾ']
      }
    },
    daily: [{
        icon: '🦷',
        title: 'ਦੰਦਾਂ ਦਾ ਸੜਨਾ',
        tag: 'pH 5.5 ਤੋਂ ਹੇਠਾਂ',
        text: 'ਮੂੰਹ ਦੇ ਬੈਕਟੀਰੀਆ ਬਚੀ ਖੰਡ ਨੂੰ ਤੇਜ਼ਾਬ ਵਿੱਚ ਬਦਲ ਦਿੰਦੇ ਹਨ। ਜਦੋਂ ਮੂੰਹ ਦਾ pH 5.5 ਤੋਂ ਹੇਠਾਂ ਡਿੱਗਦਾ ਹੈ, ਤਾਂ ਇਨੈਮਲ (ਸਰੀਰ ਦਾ ਸਭ ਤੋਂ ਸਖ਼ਤ ਪਦਾਰਥ) ਘੁਲਣ ਲੱਗਦਾ ਹੈ। ਟੂਥਪੇਸਟ ਖਾਰੀ ਹੈ ਤੇ ਇਸ ਤੇਜ਼ਾਬ ਨੂੰ ਉਦਾਸੀਨ ਕਰਦਾ ਹੈ, ਇਸ ਲਈ ਖਾਣੇ ਤੋਂ ਬਾਅਦ ਬੁਰਸ਼ ਕਰੋ।'
      }, {
        icon: '🌧️',
        title: 'ਤੇਜ਼ਾਬੀ ਮੀਂਹ',
        tag: 'pH 5.6 ਤੋਂ ਹੇਠਾਂ',
        text: 'ਗੱਡੀਆਂ ਤੇ ਕਾਰਖ਼ਾਨਿਆਂ ਦਾ ਧੂੰਆਂ ਹਵਾ ਵਿੱਚ ਸਲਫ਼ਰ ਤੇ ਨਾਈਟ੍ਰੋਜਨ ਦੇ ਆਕਸਾਈਡ ਮਿਲਾਉਂਦਾ ਹੈ। ਇਹ ਮੀਂਹ ਵਿੱਚ ਘੁਲ ਕੇ ਉਸਨੂੰ ਤੇਜ਼ਾਬੀ ਬਣਾ ਦਿੰਦੇ ਹਨ। ਤੇਜ਼ਾਬੀ ਮੀਂਹ ਦਰਿਆਵਾਂ ਦੀਆਂ ਮੱਛੀਆਂ ਨੂੰ ਨੁਕਸਾਨ ਕਰਦਾ ਹੈ, ਫ਼ਸਲਾਂ ਖ਼ਰਾਬ ਕਰਦਾ ਹੈ ਤੇ ਤਾਜ ਮਹਿਲ ਵਰਗੀਆਂ ਸੰਗਮਰਮਰ ਦੀਆਂ ਇਮਾਰਤਾਂ ਨੂੰ ਖਾ ਜਾਂਦਾ ਹੈ।'
      }, {
        icon: '🌱',
        title: 'ਮਿੱਟੀ ਦਾ pH ਤੇ ਫ਼ਸਲਾਂ',
        tag: 'ਸਭ ਤੋਂ ਵਧੀਆ: pH 6.5 ਤੋਂ 7.5',
        text: 'ਜ਼ਿਆਦਾਤਰ ਪੌਦੇ ਉਦਾਸੀਨ ਦੇ ਨੇੜੇ ਵਾਲੀ ਮਿੱਟੀ ਵਿੱਚ ਸਭ ਤੋਂ ਵਧੀਆ ਉੱਗਦੇ ਹਨ। ਮਿੱਟੀ ਬਹੁਤ ਤੇਜ਼ਾਬੀ ਹੋਵੇ ਤਾਂ ਕਿਸਾਨ ਅਣਬੁਝਿਆ ਚੂਨਾ (CaO), ਬੁਝਿਆ ਚੂਨਾ (Ca(OH)₂) ਜਾਂ ਖੜੀਆ (CaCO₃) ਪਾਉਂਦੇ ਹਨ। ਬਹੁਤ ਖਾਰੀ ਹੋਵੇ ਤਾਂ ਖਾਦ ਵਰਗਾ ਜੈਵਿਕ ਪਦਾਰਥ ਪਾਉਂਦੇ ਹਨ।'
      }, {
        icon: '🐝',
        title: 'ਤੇਜ਼ਾਬ ਤੇ ਖਾਰ ਨਾਲ ਸਵੈ-ਰੱਖਿਆ',
        tag: 'ਡੰਗ',
        text: 'ਮਧੂਮੱਖੀ ਜਾਂ ਕੀੜੀ ਦਾ ਡੰਗ ਮੀਥੇਨੋਇਕ ਤੇਜ਼ਾਬ ਛੱਡਦਾ ਹੈ: ਬੇਕਿੰਗ ਸੋਡਾ ਮਲੋ। ਬਿੱਛੂ ਬੂਟੀ ਦੇ ਪੱਤੇ ਵੀ ਮੀਥੇਨੋਇਕ ਤੇਜ਼ਾਬ ਛੱਡਦੇ ਹਨ: ਨੇੜੇ ਉੱਗਣ ਵਾਲਾ ਡੌਕ ਪੌਦਾ ਆਰਾਮ ਦਿੰਦਾ ਹੈ। ਭਰਿੰਡ ਦਾ ਡੰਗ ਖਾਰੀ ਹੁੰਦਾ ਹੈ: ਸਿਰਕਾ ਲਾਓ।'
      }, {
        icon: '🫃',
        title: 'ਪਾਚਨ ਤੇ ਐਸਿਡਿਟੀ',
        tag: 'ਪੇਟ: pH 1.2',
        text: 'ਪੇਟ ਖਾਣਾ ਪਚਾਉਣ ਲਈ ਹਾਈਡ੍ਰੋਕਲੋਰਿਕ ਤੇਜ਼ਾਬ ਬਣਾਉਂਦਾ ਹੈ। ਜਦੋਂ ਇਹ ਵੱਧ ਬਣਦਾ ਹੈ ਤਾਂ ਜਲਣ ਤੇ ਦਰਦ ਹੁੰਦਾ ਹੈ। ਮਿਲਕ ਆਫ਼ ਮੈਗਨੀਸ਼ੀਆ ਜਾਂ ਬੇਕਿੰਗ ਸੋਡੇ ਵਰਗੇ ਐਂਟਾਸਿਡ ਹਲਕੇ ਖਾਰ ਹਨ ਜੋ ਵਾਧੂ ਤੇਜ਼ਾਬ ਨੂੰ ਉਦਾਸੀਨ ਕਰਦੇ ਹਨ।'
      }, {
        icon: '🩸',
        title: 'ਸਾਡੇ ਸਰੀਰ ਨੂੰ ਤੰਗ ਦਾਇਰਾ ਪਸੰਦ ਹੈ',
        tag: 'ਖ਼ੂਨ: pH 7.35 ਤੋਂ 7.45',
        text: 'ਜਿਉਂਦੇ ਸੈੱਲ ਸਿਰਫ਼ ਇੱਕ ਤੰਗ pH ਹੱਦ ਵਿੱਚ ਕੰਮ ਕਰਦੇ ਹਨ। ਸਾਡਾ ਖ਼ੂਨ 7.4 ਦੇ ਬਹੁਤ ਨੇੜੇ ਰਹਿੰਦਾ ਹੈ; ਥੋੜ੍ਹਾ ਜਿਹਾ ਬਦਲਾਅ ਵੀ ਸਾਨੂੰ ਬਿਮਾਰ ਕਰ ਦਿੰਦਾ ਹੈ। ਇਸੇ ਲਈ ਗੰਭੀਰ ਬਿਮਾਰੀ ਵਿੱਚ ਡਾਕਟਰ ਖ਼ੂਨ ਦਾ pH ਜਾਂਚਦੇ ਹਨ।'
      }],
    quiz: [{
        q: 'ਨਿੰਬੂ ਦੇ ਰਸ ਵਿੱਚ ਡੁਬੋਣ \'ਤੇ ਨੀਲਾ ਲਿਟਮਸ ਪੱਤਰ ਕਿਸ ਰੰਗ ਦਾ ਹੋ ਜਾਂਦਾ ਹੈ?',
        options: ['ਨੀਲਾ (ਕੋਈ ਬਦਲਾਅ ਨਹੀਂ)', 'ਲਾਲ', 'ਹਰਾ', 'ਪੀਲਾ'],
        why: 'ਨਿੰਬੂ ਦਾ ਰਸ ਤੇਜ਼ਾਬੀ ਹੈ (pH ਲਗਭਗ 2)। ਤੇਜ਼ਾਬ ਨੀਲੇ ਲਿਟਮਸ ਨੂੰ ਲਾਲ ਕਰ ਦਿੰਦੇ ਹਨ।'
      }, {
        q: '25 °C \'ਤੇ ਸ਼ੁੱਧ ਪਾਣੀ ਦਾ pH ਕਿੰਨਾ ਹੁੰਦਾ ਹੈ?',
        options: ['0', '7', '14', '1'],
        why: 'ਸ਼ੁੱਧ ਪਾਣੀ ਉਦਾਸੀਨ ਹੈ। ਇਸ ਵਿੱਚ H⁺ ਤੇ OH⁻ ਆਇਨ ਬਰਾਬਰ ਗਿਣਤੀ ਵਿੱਚ ਹਨ, ਇਸ ਲਈ pH 7 ਹੈ।'
      }, {
        q: 'ਇਨ੍ਹਾਂ ਵਿੱਚੋਂ ਕਿਹੜਾ ਘੋਲ ਸਭ ਤੋਂ ਵੱਧ ਤੇਜ਼ਾਬੀ ਹੈ?',
        options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'],
        why: 'pH ਜਿੰਨਾ ਘੱਟ, ਘੋਲ ਓਨਾ ਵੱਧ ਤੇਜ਼ਾਬੀ। pH 3 ਵਿੱਚ pH 6 ਨਾਲੋਂ 1000 ਗੁਣਾ ਵੱਧ H⁺ ਆਇਨ ਹਨ।'
      }, {
        q: 'pH 4 ਦੇ ਘੋਲ ਵਿੱਚ pH 5 ਦੇ ਘੋਲ ਨਾਲੋਂ ਕਿੰਨੇ ਗੁਣਾ ਵੱਧ H⁺ ਆਇਨ ਹਨ?',
        options: ['2 ਗੁਣਾ', '10 ਗੁਣਾ', '100 ਗੁਣਾ', 'ਅੱਧੇ'],
        why: 'pH ਪੈਮਾਨੇ \'ਤੇ 1 ਦਾ ਹਰ ਕਦਮ H⁺ ਸੰਘਣਤਾ ਵਿੱਚ 10 ਦਾ ਗੁਣਕ ਹੈ। pH 4 → 10⁻⁴ mol/L; pH 5 → 10⁻⁵ mol/L।'
      }, {
        q: 'ਸੋਡੀਅਮ ਹਾਈਡ੍ਰੋਕਸਾਈਡ (NaOH) ਦੇ ਘੋਲ ਵਿੱਚ ਫ਼ਿਨੌਲਫ਼ਥੈਲੀਨ ਕਿਸ ਰੰਗ ਦਾ ਹੁੰਦਾ ਹੈ?',
        options: ['ਰੰਗਹੀਣ', 'ਗੁਲਾਬੀ', 'ਪੀਲਾ', 'ਲਾਲ'],
        why: 'ਫ਼ਿਨੌਲਫ਼ਥੈਲੀਨ ਤੇਜ਼ਾਬ ਵਿੱਚ ਰੰਗਹੀਣ ਰਹਿੰਦਾ ਹੈ ਤੇ ਖਾਰ ਵਿੱਚ ਗੁਲਾਬੀ ਹੋ ਜਾਂਦਾ ਹੈ। NaOH ਤੇਜ਼ ਖਾਰ ਹੈ।'
      }, {
        q: 'ਕਮੀਜ਼ \'ਤੇ ਹਲਦੀ ਦਾ ਦਾਗ਼ ਸਾਬਣ ਮਲਣ \'ਤੇ ਲਾਲ ਹੋ ਜਾਂਦਾ ਹੈ। ਇਸ ਤੋਂ ਪਤਾ ਲੱਗਦਾ ਹੈ ਕਿ ਸਾਬਣ',
        options: ['ਤੇਜ਼ਾਬੀ ਹੈ', 'ਉਦਾਸੀਨ ਹੈ', 'ਖਾਰੀ ਹੈ', 'ਇੱਕ ਲੂਣ ਹੈ'],
        why: 'ਹਲਦੀ ਕੁਦਰਤੀ ਸੂਚਕ ਹੈ: ਤੇਜ਼ਾਬ ਤੇ ਉਦਾਸੀਨ ਘੋਲ ਵਿੱਚ ਪੀਲੀ ਰਹਿੰਦੀ ਹੈ ਪਰ ਖਾਰ ਵਿੱਚ ਲਾਲ ਹੋ ਜਾਂਦੀ ਹੈ। ਸਾਬਣ ਖਾਰੀ ਹੈ।'
      }, {
        q: 'ਦੰਦਾਂ ਦਾ ਸੜਨਾ ਉਦੋਂ ਸ਼ੁਰੂ ਹੁੰਦਾ ਹੈ ਜਦੋਂ ਮੂੰਹ ਦਾ pH ਇਸ ਤੋਂ ਹੇਠਾਂ ਡਿੱਗ ਜਾਵੇ:',
        options: ['5.5', '7', '8.5', '2'],
        why: 'ਦੰਦਾਂ ਦਾ ਇਨੈਮਲ pH 5.5 ਤੋਂ ਹੇਠਾਂ ਘੁਲਣ ਲੱਗਦਾ ਹੈ। ਬੈਕਟੀਰੀਆ ਬਚੀ ਖੰਡ ਤੋਂ ਇਹ ਤੇਜ਼ਾਬ ਬਣਾਉਂਦੇ ਹਨ।'
      }, {
        q: 'ਮੀਂਹ ਨੂੰ ਤੇਜ਼ਾਬੀ ਮੀਂਹ ਉਦੋਂ ਕਹਿੰਦੇ ਹਨ ਜਦੋਂ ਉਸਦਾ pH ਇਸ ਤੋਂ ਘੱਟ ਹੋਵੇ:',
        options: ['7', '5.6', '6.5', '3'],
        why: 'ਆਮ ਮੀਂਹ ਘੁਲੇ CO₂ ਕਰਕੇ ਹਲਕਾ ਤੇਜ਼ਾਬੀ (ਲਗਭਗ 5.6) ਹੁੰਦਾ ਹੈ। 5.6 ਤੋਂ ਹੇਠਾਂ ਉਹ ਤੇਜ਼ਾਬੀ ਮੀਂਹ ਹੈ, ਜੋ ਸਲਫ਼ਰ ਤੇ ਨਾਈਟ੍ਰੋਜਨ ਦੇ ਆਕਸਾਈਡਾਂ ਕਰਕੇ ਹੁੰਦਾ ਹੈ।'
      }, {
        q: 'ਮਿਲਕ ਆਫ਼ ਮੈਗਨੀਸ਼ੀਆ ਵਰਗਾ ਐਂਟਾਸਿਡ ਐਸਿਡਿਟੀ ਵਿੱਚ ਆਰਾਮ ਦਿੰਦਾ ਹੈ ਕਿਉਂਕਿ ਇਹ',
        options: ['ਪੇਟ ਵਿੱਚ ਹੋਰ ਤੇਜ਼ਾਬ ਮਿਲਾਉਂਦਾ ਹੈ', 'ਪੇਟ ਦੇ ਵਾਧੂ ਤੇਜ਼ਾਬ ਨੂੰ ਉਦਾਸੀਨ ਕਰਦਾ ਹੈ', 'ਪੇਟ ਨੂੰ ਠੰਢਾ ਕਰਦਾ ਹੈ', 'ਪੇਟ ਵਿੱਚੋਂ ਪਾਣੀ ਕੱਢਦਾ ਹੈ'],
        why: 'ਮਿਲਕ ਆਫ਼ ਮੈਗਨੀਸ਼ੀਆ, Mg(OH)₂, ਇੱਕ ਹਲਕਾ ਖਾਰ ਹੈ। ਇਹ ਪੇਟ ਦੇ ਵਾਧੂ ਹਾਈਡ੍ਰੋਕਲੋਰਿਕ ਤੇਜ਼ਾਬ ਨੂੰ ਉਦਾਸੀਨ ਕਰਦਾ ਹੈ।'
      }, {
        q: 'ਮਧੂਮੱਖੀ ਦਾ ਡੰਗ ਇਸ ਲਈ ਦੁਖਦਾ ਹੈ ਕਿਉਂਕਿ ਉਹ ਤੇਜ਼ਾਬ ਛੱਡਦਾ ਹੈ। ਘਰ ਦੀ ਕਿਹੜੀ ਚੀਜ਼ ਡੰਗ \'ਤੇ ਮਲਣ ਨਾਲ ਆਰਾਮ ਮਿਲਦਾ ਹੈ?',
        options: ['ਸਿਰਕਾ', 'ਨਿੰਬੂ ਦਾ ਰਸ', 'ਬੇਕਿੰਗ ਸੋਡਾ', 'ਲੂਣ'],
        why: 'ਡੰਗ ਮੀਥੇਨੋਇਕ ਤੇਜ਼ਾਬ ਛੱਡਦਾ ਹੈ। ਬੇਕਿੰਗ ਸੋਡਾ ਹਲਕਾ ਖਾਰ ਹੈ ਜੋ ਇਸਨੂੰ ਉਦਾਸੀਨ ਕਰਦਾ ਹੈ। ਸਿਰਕਾ ਤੇ ਨਿੰਬੂ ਦਾ ਰਸ ਤੇਜ਼ਾਬ ਹਨ ਤੇ ਮਦਦ ਨਹੀਂ ਕਰਨਗੇ।'
      }, {
        q: 'ਆਮ ਲੂਣ (NaCl) ਤੇਜ਼ ਤੇਜ਼ਾਬ (HCl) ਤੇ ਤੇਜ਼ ਖਾਰ (NaOH) ਤੋਂ ਬਣਦਾ ਹੈ। ਪਾਣੀ ਵਿੱਚ ਇਸਦਾ ਘੋਲ ਹੁੰਦਾ ਹੈ',
        options: ['ਤੇਜ਼ਾਬੀ', 'ਖਾਰੀ', 'ਉਦਾਸੀਨ', 'ਕਦੇ ਤੇਜ਼ਾਬੀ, ਕਦੇ ਖਾਰੀ'],
        why: 'ਜਦੋਂ ਦੋਵੇਂ ਮਾਪੇ ਤੇਜ਼ ਹੋਣ, ਕੋਈ ਨਹੀਂ ਜਿੱਤਦਾ: ਲੂਣ ਦਾ ਘੋਲ ਉਦਾਸੀਨ ਹੈ, pH 7।'
      }, {
        q: 'ਅਮੋਨੀਅਮ ਕਲੋਰਾਈਡ (NH₄Cl) ਦਾ ਘੋਲ ਤੇਜ਼ਾਬੀ ਹੈ ਕਿਉਂਕਿ ਇਹ ਬਣਦਾ ਹੈ',
        options: ['ਤੇਜ਼ ਤੇਜ਼ਾਬ ਤੇ ਕਮਜ਼ੋਰ ਖਾਰ ਤੋਂ', 'ਕਮਜ਼ੋਰ ਤੇਜ਼ਾਬ ਤੇ ਤੇਜ਼ ਖਾਰ ਤੋਂ', 'ਤੇਜ਼ ਤੇਜ਼ਾਬ ਤੇ ਤੇਜ਼ ਖਾਰ ਤੋਂ', 'ਕਮਜ਼ੋਰ ਤੇਜ਼ਾਬ ਤੇ ਕਮਜ਼ੋਰ ਖਾਰ ਤੋਂ'],
        why: 'HCl ਤੇਜ਼ ਤੇਜ਼ਾਬ ਹੈ ਤੇ NH₄OH ਕਮਜ਼ੋਰ ਖਾਰ। ਤੇਜ਼ ਮਾਪਾ ਜਿੱਤਦਾ ਹੈ, ਇਸ ਲਈ ਲੂਣ ਤੇਜ਼ਾਬੀ ਹੈ।'
      }, {
        q: 'HCl + NaOH → ___ + H₂O। ਖਾਲੀ ਥਾਂ ਦਾ ਉਤਪਾਦ ਹੈ',
        options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'],
        why: 'ਉਦਾਸੀਨੀਕਰਨ: ਤੇਜ਼ਾਬ + ਖਾਰ → ਲੂਣ + ਪਾਣੀ। ਹਾਈਡ੍ਰੋਕਲੋਰਿਕ ਤੇਜ਼ਾਬ ਤੇ ਸੋਡੀਅਮ ਹਾਈਡ੍ਰੋਕਸਾਈਡ ਤੋਂ ਸੋਡੀਅਮ ਕਲੋਰਾਈਡ (ਆਮ ਲੂਣ) ਤੇ ਪਾਣੀ ਬਣਦੇ ਹਨ।'
      }, {
        q: 'ਪਲਾਸਟਰ ਆਫ਼ ਪੈਰਿਸ ਕਿਸਨੂੰ ਗਰਮ ਕਰਕੇ ਬਣਾਇਆ ਜਾਂਦਾ ਹੈ?',
        options: ['ਆਮ ਲੂਣ', 'ਜਿਪਸਮ', 'ਚੂਨਾ ਪੱਥਰ', 'ਬੇਕਿੰਗ ਸੋਡਾ'],
        why: 'ਜਿਪਸਮ (CaSO₄·2H₂O) ਨੂੰ 373 K \'ਤੇ ਗਰਮ ਕਰਨ ਨਾਲ ਪਾਣੀ ਨਿਕਲ ਜਾਂਦਾ ਹੈ ਤੇ ਪਲਾਸਟਰ ਆਫ਼ ਪੈਰਿਸ, CaSO₄·½H₂O, ਬਣਦਾ ਹੈ।'
      }, {
        q: 'ਕਿਸੇ ਘੋਲ ਵਿੱਚ ਸਰਵਵਿਆਪੀ ਸੂਚਕ ਪਾਉਣ \'ਤੇ ਉਹ ਹਰਾ ਹੋ ਗਿਆ। ਘੋਲ ਹੈ',
        options: ['ਤੇਜ਼ ਤੇਜ਼ਾਬੀ', 'ਉਦਾਸੀਨ (pH ਲਗਭਗ 7)', 'ਤੇਜ਼ ਖਾਰੀ', 'pH 2'],
        why: 'ਸਰਵਵਿਆਪੀ ਸੂਚਕ ਚਾਰਟ ਵਿੱਚ ਹਰਾ ਮਤਲਬ pH 7, ਉਦਾਸੀਨ। ਲਾਲ ਮਤਲਬ ਤੇਜ਼ ਤੇਜ਼ਾਬੀ ਤੇ ਬੈਂਗਣੀ ਮਤਲਬ ਤੇਜ਼ ਖਾਰੀ।'
      }]
  },
  or: {
    facts: {
      hcl: 'ଲ୍ୟାବ୍‌ର ତୀବ୍ର ଅମ୍ଳ। ଲଘୁ ଦ୍ରବଣ ବି ବିପଜ୍ଜନକ: କେବେ ଛୁଅନ୍ତୁ ନାହିଁ ବା ଚାଖନ୍ତୁ ନାହିଁ।',
      gastric: 'ଖାଦ୍ୟ ହଜମ କରିବା ଓ ଜୀବାଣୁ ମାରିବା ପାଇଁ ଆମ ପାକସ୍ଥଳୀ ହାଇଡ୍ରୋକ୍ଲୋରିକ୍ ଅମ୍ଳ ତିଆରି କରେ।',
      lemon: 'ସାଇଟ୍ରିକ୍ ଅମ୍ଳ ଯୋଗୁଁ ଖଟା। ଭିଟାମିନ୍ C ରେ ଭରପୂର।',
      softdrink: 'ଏଥିରେ କାର୍ବୋନିକ୍ ଓ ଫସ୍‌ଫୋରିକ୍ ଅମ୍ଳ ଥାଏ। ତେଣୁ ଏହା ଦାନ୍ତକୁ କ୍ଷତି କରେ।',
      vinegar: 'ଆସେଟିକ୍ (ଇଥାନୋଇକ୍) ଅମ୍ଳର ଲଘୁ ଦ୍ରବଣ, ଆଚାରରେ ବ୍ୟବହୃତ।',
      tomato: 'ସାଇଟ୍ରିକ୍ ଓ ମ୍ୟାଲିକ୍ ଅମ୍ଳ ଯୋଗୁଁ ମୃଦୁ ଅମ୍ଳୀୟ।',
      curd: 'ବ୍ୟାକ୍ଟେରିଆ ତିଆରି ଲ୍ୟାକ୍ଟିକ୍ ଅମ୍ଳ କ୍ଷୀରକୁ ଖଟା କରି ଦହି ଜମାଏ।',
      coffee: 'କ୍ଷୀର ବିନା କଳା କଫି ମୃଦୁ ଅମ୍ଳୀୟ।',
      tea: 'ଟ୍ୟାନିକ୍ ଅମ୍ଳ ଚାକୁ ଅଳ୍ପ ପିତା, କଷା ସ୍ୱାଦ ଦିଏ।',
      rain: 'ସ୍ୱଚ୍ଛ ବର୍ଷା ବି ଅଳ୍ପ ଅମ୍ଳୀୟ କାରଣ ପବନର CO₂ ଏଥିରେ ଦ୍ରବୀଭୂତ ହୁଏ। 5.6 ତଳେ ଏହାକୁ ଅମ୍ଳ ବର୍ଷା କୁହାଯାଏ।',
      milk: 'ତାଜା କ୍ଷୀର ବହୁତ ଅଳ୍ପ ଅମ୍ଳୀୟ। ଖଟା ହେବା ସମୟରେ ଏହାର pH କମେ।',
      saliva: 'ଲାଳ ପ୍ରାୟ ପ୍ରଶମ। ମିଠା ଖାଇବା ପରେ ବ୍ୟାକ୍ଟେରିଆ ଅମ୍ଳ ତିଆରି କରନ୍ତି ଓ ପାଟିର pH କମିଯାଏ।',
      water: 'ବିଶୁଦ୍ଧ ପାଣି ପ୍ରଶମ: H⁺ ଓ OH⁻ ଆୟନ ସମାନ ସଂଖ୍ୟାରେ।',
      blood: 'ଆମ ରକ୍ତ pH 7.35 ରୁ 7.45 ମଧ୍ୟରେ ରହେ। ଶରୀର ଏହାକୁ ସେଠାରେ ରଖିବାକୁ ବହୁତ ପରିଶ୍ରମ କରେ।',
      seawater: 'ଦ୍ରବୀଭୂତ ଲବଣ ଓ କାର୍ବୋନେଟ୍ ଯୋଗୁଁ ଅଳ୍ପ କ୍ଷାରୀୟ।',
      bakingsoda: 'ସୋଡିୟମ୍ ହାଇଡ୍ରୋଜେନ୍ କାର୍ବୋନେଟ୍ (NaHCO₃), ରୋଷେଇ ଓ ଆଣ୍ଟାସିଡ୍‌ରେ ବ୍ୟବହୃତ ମୃଦୁ କ୍ଷାର।',
      toothpaste: 'କ୍ଷାରୀୟ, ତେଣୁ ପାଟିରେ ବ୍ୟାକ୍ଟେରିଆ ତିଆରି ଅମ୍ଳକୁ ପ୍ରଶମିତ କରେ।',
      antacid: 'ଆଣ୍ଟାସିଡ୍ ଟାବ୍‌ଲେଟ୍‌ରେ ମୃଦୁ କ୍ଷାର ଥାଏ ଯାହା ପାକସ୍ଥଳୀର ଅତିରିକ୍ତ ଅମ୍ଳକୁ ପ୍ରଶମିତ କରେ।',
      soap: 'ସାବୁନ ତେଲ ଓ ତୀବ୍ର କ୍ଷାରରୁ ତିଆରି, ତେଣୁ ସାବୁନ ପାଣି କ୍ଷାରୀୟ ଓ ଖସଡ଼ା ଲାଗେ।',
      magnesia: 'ମ୍ୟାଗ୍ନେସିୟମ୍ ହାଇଡ୍ରକ୍ସାଇଡ୍, Mg(OH)₂, ର ନିଲମ୍ବନ, ଆଣ୍ଟାସିଡ୍ ଭାବେ ବ୍ୟବହୃତ।',
      ammonia: 'ପାଣିରେ ଦ୍ରବୀଭୂତ ଆମୋନିଆ କ୍ଷାରୀୟ ଓ ଏହାର ଗନ୍ଧ ତୀକ୍ଷ୍ଣ। କିଛି କ୍ଲିନରରେ ବ୍ୟବହୃତ।',
      limewater: 'ପାଣିରେ କ୍ୟାଲସିୟମ୍ ହାଇଡ୍ରକ୍ସାଇଡ୍, Ca(OH)₂। ଏହା ମଧ୍ୟ ଦେଇ CO₂ ପଠାଇଲେ ଦୁଧିଆ ହୁଏ।',
      bleach: 'ଘରର ବ୍ଲିଚ୍ ତୀବ୍ର କ୍ଷାରୀୟ ଓ କ୍ଷୟକାରୀ। ଗ୍ଲୋଭ୍ସ ପିନ୍ଧି ବ୍ୟବହାର କରନ୍ତୁ।',
      naoh: 'କଷ୍ଟିକ୍ ସୋଡା: ସାବୁନ ଓ କାଗଜ ତିଆରିରେ ବ୍ୟବହୃତ ତୀବ୍ର କ୍ଷାର। ବହୁତ କ୍ଷୟକାରୀ।'
    },
    ind_why: {
      blue_litmus: 'ଲିଟମସ୍ ଲାଇକେନ୍‌ରୁ ମିଳୁଥିବା ପ୍ରାକୃତିକ ରଙ୍ଗ। ଅମ୍ଳ ନୀଳ ଲିଟମସ୍‌କୁ ଲାଲ କରେ; କ୍ଷାର ଓ ପ୍ରଶମ ଦ୍ରବଣରେ ନୀଳ ରହେ।',
      red_litmus: 'କ୍ଷାର ଲାଲ ଲିଟମସ୍‌କୁ ନୀଳ କରେ। ଅମ୍ଳ ଓ ପ୍ରଶମ ଦ୍ରବଣରେ ଲାଲ ରହେ।',
      turmeric: 'ହଳଦୀ ଅମ୍ଳ ଓ ପ୍ରଶମ ଦ୍ରବଣରେ ହଳଦିଆ ରହେ, କ୍ଷାରରେ ଲାଲ ହୁଏ। ତେଣୁ ହଳଦୀ ଦାଗରେ ସାବୁନ ଲାଗିଲେ ଲାଲ ହୋଇଯାଏ।',
      phenolphthalein: 'ଫିନଲ୍‌ଫ୍‌ଥାଲିନ୍ ଅମ୍ଳ ଓ ପ୍ରଶମ ଦ୍ରବଣରେ ବର୍ଣ୍ଣହୀନ, କ୍ଷାରରେ ଗୋଲାପୀ (ପ୍ରାୟ pH 8.2 ରୁ)।',
      methyl_orange: 'ମିଥାଇଲ୍ ଅରେଞ୍ଜ ତୀବ୍ର ଅମ୍ଳରେ ଲାଲ (pH 3.1 ତଳେ), ମଝିରେ କମଳା, ଓ pH 4.4 ଉପରେ ହଳଦିଆ।',
      universal: 'ସର୍ବଜନୀନ ସୂଚକ କେତେକ ରଞ୍ଜକର ମିଶ୍ରଣ। ଏହା ପ୍ରତ୍ୟେକ pH ପାଇଁ ଅଲଗା ରଙ୍ଗ ଦେଖାଏ: ତୀବ୍ର ଅମ୍ଳରେ ଲାଲ, ପ୍ରଶମରେ ସବୁଜ, ତୀବ୍ର କ୍ଷାରରେ ବାଇଗଣୀ।',
      china_rose: 'ମନ୍ଦାର ଫୁଲ ପାଖୁଡ଼ାରୁ ପ୍ରାକୃତିକ ସୂଚକ ମିଳେ: ଏହା ଅମ୍ଳକୁ ଗାଢ଼ ଗୋଲାପୀ ଓ କ୍ଷାରକୁ ସବୁଜ କରେ।'
    },
    stories: [{
        title: 'ଆଣ୍ଟାସିଡ୍ ବନାମ ପାକସ୍ଥଳୀ ଅମ୍ଳ',
        emoji: '💊',
        text: 'ଖାଦ୍ୟ ହଜମ କରିବାକୁ ଆମ ପାକସ୍ଥଳୀ ହାଇଡ୍ରୋକ୍ଲୋରିକ୍ ଅମ୍ଳ (pH ପ୍ରାୟ 1.2) ତିଆରି କରେ। ଅଧିକ ଅମ୍ଳରେ ଯନ୍ତ୍ରଣା ଓ ଜଳାପୋଡ଼ା ହୁଏ (ଆସିଡିଟି)। ମିଲ୍କ ଅଫ୍ ମ୍ୟାଗ୍ନେସିଆ, Mg(OH)₂, ପରି ଆଣ୍ଟାସିଡ୍ ଏକ ମୃଦୁ କ୍ଷାର: ଏହା ଅତିରିକ୍ତ ଅମ୍ଳକୁ ପ୍ରଶମିତ କରେ ଓ ଯନ୍ତ୍ରଣା ଚାଲିଯାଏ।',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O',
        before: 1.2,
        after: 4,
        beforeLabel: 'ବହୁତ ଅଧିକ ଅମ୍ଳ',
        afterLabel: 'ଆଣ୍ଟାସିଡ୍ ପରେ'
      }, {
        title: 'ମହୁମାଛି କାମୁଡ଼ା ବନାମ ବେକିଂ ସୋଡା',
        emoji: '🐝',
        text: 'ମହୁମାଛି କାମୁଡ଼ା ଚର୍ମରେ ମିଥାନୋଇକ୍ (ଫର୍ମିକ୍) ଅମ୍ଳ ଛାଡ଼େ, ଯାହା ଜଳେ। ମୃଦୁ କ୍ଷାର ବେକିଂ ସୋଡାର ଲେପ ଘଷିଲେ ଅମ୍ଳ ପ୍ରଶମିତ ହୁଏ ଓ ଆରାମ ମିଳେ। ବିରୁଡ଼ି କାମୁଡ଼ା କ୍ଷାରୀୟ, ତେଣୁ ସେଥିପାଇଁ ଲୋକେ ଭିନେଗାର ପରି ମୃଦୁ ଅମ୍ଳ ବ୍ୟବହାର କରନ୍ତି।',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂',
        before: 3,
        after: 7,
        beforeLabel: 'କାମୁଡ଼ା (ଅମ୍ଳ)',
        afterLabel: 'ବେକିଂ ସୋଡା ପରେ'
      }],
    uses: {
      common_salt: {
        name: 'ସାଧାରଣ ଲୁଣ',
        made: 'ସମୁଦ୍ର ପାଣିକୁ ବାଷ୍ପୀଭୂତ କରି, ବା ପଥର ଲୁଣ ଭାବେ ଖୋଳି। ଏହା ସୋଡିୟମ୍ ହାଇଡ୍ରକ୍ସାଇଡ୍, ବେକିଂ ସୋଡା, ୱାସିଂ ସୋଡା ଓ ବ୍ଲିଚିଂ ପାଉଡରର କଞ୍ଚାମାଲ (କ୍ଲୋର-ଆଲ୍‌କାଲି ପ୍ରକ୍ରିୟା: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂)।',
        uses: ['ରୋଷେଇ ଓ ଖାଦ୍ୟ ସଂରକ୍ଷଣ (ଆଚାର, ପାପଡ଼)', 'NaOH, ବେକିଂ ସୋଡା, ୱାସିଂ ସୋଡା ଓ ବ୍ଲିଚିଂ ପାଉଡର ତିଆରି', 'ଥଣ୍ଡା ଦେଶରେ ରାସ୍ତାରୁ ବରଫ ହଟାଇବା']
      },
      washing_soda: {
        name: 'ୱାସିଂ ସୋଡା',
        made: 'ବେକିଂ ସୋଡାକୁ ଗରମ କଲେ ସୋଡିୟମ୍ କାର୍ବୋନେଟ୍ ହୁଏ; ପାଣି ସହ ସ୍ଫଟିକୀକରଣ କଲେ ୱାସିଂ ସୋଡା ମିଳେ: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O।',
        uses: ['କାଚ, ସାବୁନ ଓ କାଗଜ ତିଆରି', 'ପାଣିର ସ୍ଥାୟୀ କଠିନତା ଦୂର କରିବା', 'ଘର ସଫା କରିବା ପାଇଁ']
      },
      baking_soda: {
        name: 'ବେକିଂ ସୋଡା',
        made: 'ସାଧାରଣ ଲୁଣରୁ: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃। ଗରମ କଲେ CO₂ ଦିଏ: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂।',
        uses: ['ବେକିଂ ପାଉଡର କେକ୍ ଓ ପାଉଁରୁଟିକୁ ନରମ କରେ (CO₂ ବୁଦ୍‌ବୁଦ୍)', 'ଆସିଡିଟି ପାଇଁ ଆଣ୍ଟାସିଡ୍', 'ସୋଡା-ଅମ୍ଳ ଅଗ୍ନିନିର୍ବାପକ']
      },
      bleaching_powder: {
        name: 'ବ୍ଲିଚିଂ ପାଉଡର',
        made: 'ଶୁଖିଲା ଲିଭା ଚୂନ ଉପରେ କ୍ଲୋରିନ୍ ଗ୍ୟାସର କ୍ରିୟା: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O।',
        uses: ['ସୂତା, ଲିନେନ୍ ଓ କାଗଜ ବିରଞ୍ଜନ', 'ପିଇବା ପାଣି ଜୀବାଣୁମୁକ୍ତ କରିବା', 'ରାସାୟନିକ ଶିଳ୍ପରେ ଜାରକ']
      },
      plaster_of_paris: {
        name: 'ପ୍ଲାଷ୍ଟର ଅଫ୍ ପ୍ୟାରିସ୍',
        made: 'ଜିପ୍‌ସମ୍‌କୁ 373 K (100 °C) ପର୍ୟ୍ୟନ୍ତ ଗରମ କରାଯାଏ: CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O। ପାଣି ମିଶାଇଲେ ପୁଣି କଠିନ ଜିପ୍‌ସମ୍ ହୁଏ।',
        uses: ['ଭାଙ୍ଗିଥିବା ହାଡ଼କୁ ଠିକ୍ ସ୍ଥିତିରେ ଧରି ରଖିବା', 'ଖେଳନା, ସାଜସଜ୍ଜା ଜିନିଷ ଓ ମୂର୍ତ୍ତି', 'କାନ୍ଥ ଓ ଛାତ ସମତଳ କରିବା']
      }
    },
    daily: [{
        icon: '🦷',
        title: 'ଦାନ୍ତ କ୍ଷୟ',
        tag: 'pH 5.5 ତଳେ',
        text: 'ପାଟିର ବ୍ୟାକ୍ଟେରିଆ ବାକି ଚିନିକୁ ଅମ୍ଳରେ ବଦଳାନ୍ତି। ପାଟିର pH 5.5 ତଳକୁ ଗଲେ ଏନାମେଲ୍ (ଶରୀରର ସବୁଠୁ କଠିନ ପଦାର୍ଥ) ତରଳିବା ଆରମ୍ଭ କରେ। ଟୁଥପେଷ୍ଟ କ୍ଷାରୀୟ ଓ ଏହି ଅମ୍ଳକୁ ପ୍ରଶମିତ କରେ, ତେଣୁ ଖାଇବା ପରେ ବ୍ରଶ କରନ୍ତୁ।'
      }, {
        icon: '🌧️',
        title: 'ଅମ୍ଳ ବର୍ଷା',
        tag: 'pH 5.6 ତଳେ',
        text: 'ଗାଡ଼ି ଓ କାରଖାନାର ଧୂଆଁ ପବନରେ ସଲ୍‌ଫର୍ ଓ ନାଇଟ୍ରୋଜେନ୍‌ର ଅକ୍ସାଇଡ୍ ମିଶାଏ। ସେଗୁଡ଼ିକ ବର୍ଷାରେ ଦ୍ରବୀଭୂତ ହୋଇ ତାକୁ ଅମ୍ଳୀୟ କରନ୍ତି। ଅମ୍ଳ ବର୍ଷା ନଦୀର ମାଛକୁ କ୍ଷତି କରେ, ଫସଲ ନଷ୍ଟ କରେ ଓ ତାଜମହଲ ପରି ମାର୍ବଲ ଅଟ୍ଟାଳିକାକୁ କ୍ଷୟ କରେ।'
      }, {
        icon: '🌱',
        title: 'ମାଟିର pH ଓ ଫସଲ',
        tag: 'ସର୍ବୋତ୍ତମ: pH 6.5 ରୁ 7.5',
        text: 'ଅଧିକାଂଶ ଗଛ ପ୍ରଶମ ପାଖାପାଖି ମାଟିରେ ଭଲ ବଢ଼େ। ମାଟି ବହୁତ ଅମ୍ଳୀୟ ହେଲେ ଚାଷୀ କଞ୍ଚା ଚୂନ (CaO), ଲିଭା ଚୂନ (Ca(OH)₂) ବା ଖଡ଼ି (CaCO₃) ମିଶାନ୍ତି। ବହୁତ କ୍ଷାରୀୟ ହେଲେ କମ୍ପୋଷ୍ଟ ପରି ଜୈବିକ ପଦାର୍ଥ ମିଶାନ୍ତି।'
      }, {
        icon: '🐝',
        title: 'ଅମ୍ଳ ଓ କ୍ଷାରରେ ଆତ୍ମରକ୍ଷା',
        tag: 'କାମୁଡ଼ା',
        text: 'ମହୁମାଛି ବା ପିମ୍ପୁଡ଼ି କାମୁଡ଼ା ମିଥାନୋଇକ୍ ଅମ୍ଳ ଛାଡ଼େ: ବେକିଂ ସୋଡା ଘଷନ୍ତୁ। ବିଛୁଆତି ପତ୍ର ବି ମିଥାନୋଇକ୍ ଅମ୍ଳ ଛାଡ଼େ: ପାଖରେ ବଢ଼ୁଥିବା ଡକ୍ ଗଛ ଆରାମ ଦିଏ। ବିରୁଡ଼ି କାମୁଡ଼ା କ୍ଷାରୀୟ: ଭିନେଗାର ଲଗାନ୍ତୁ।'
      }, {
        icon: '🫃',
        title: 'ହଜମ ଓ ଆସିଡିଟି',
        tag: 'ପାକସ୍ଥଳୀ: pH 1.2',
        text: 'ଖାଦ୍ୟ ହଜମ କରିବାକୁ ପାକସ୍ଥଳୀ ହାଇଡ୍ରୋକ୍ଲୋରିକ୍ ଅମ୍ଳ ତିଆରି କରେ। ଅଧିକ ତିଆରି ହେଲେ ଜଳାପୋଡ଼ା ଓ ଯନ୍ତ୍ରଣା ହୁଏ। ମିଲ୍କ ଅଫ୍ ମ୍ୟାଗ୍ନେସିଆ ବା ବେକିଂ ସୋଡା ପରି ଆଣ୍ଟାସିଡ୍ ମୃଦୁ କ୍ଷାର, ଯାହା ଅତିରିକ୍ତ ଅମ୍ଳକୁ ପ୍ରଶମିତ କରେ।'
      }, {
        icon: '🩸',
        title: 'ଆମ ଶରୀର ସଂକୀର୍ଣ୍ଣ ସୀମା ପସନ୍ଦ କରେ',
        tag: 'ରକ୍ତ: pH 7.35 ରୁ 7.45',
        text: 'ଜୀବନ୍ତ କୋଷ କେବଳ ଏକ ସଂକୀର୍ଣ୍ଣ pH ସୀମାରେ କାମ କରନ୍ତି। ଆମ ରକ୍ତ 7.4 ର ବହୁତ ପାଖରେ ରହେ; ଅଳ୍ପ ପରିବର୍ତ୍ତନ ବି ଆମକୁ ଅସୁସ୍ଥ କରେ। ତେଣୁ ଗୁରୁତର ରୋଗରେ ଡାକ୍ତର ରକ୍ତର pH ପରୀକ୍ଷା କରନ୍ତି।'
      }],
    quiz: [{
        q: 'ଲେମ୍ବୁ ରସରେ ବୁଡ଼ାଇଲେ ନୀଳ ଲିଟମସ୍ କାଗଜ କେଉଁ ରଙ୍ଗ ହୁଏ?',
        options: ['ନୀଳ (ପରିବର୍ତ୍ତନ ନାହିଁ)', 'ଲାଲ', 'ସବୁଜ', 'ହଳଦିଆ'],
        why: 'ଲେମ୍ବୁ ରସ ଅମ୍ଳୀୟ (pH ପ୍ରାୟ 2)। ଅମ୍ଳ ନୀଳ ଲିଟମସ୍‌କୁ ଲାଲ କରେ।'
      }, {
        q: '25 °C ରେ ବିଶୁଦ୍ଧ ପାଣିର pH କେତେ?',
        options: ['0', '7', '14', '1'],
        why: 'ବିଶୁଦ୍ଧ ପାଣି ପ୍ରଶମ। ଏଥିରେ H⁺ ଓ OH⁻ ଆୟନ ସମାନ ସଂଖ୍ୟାରେ, ତେଣୁ pH 7।'
      }, {
        q: 'ଏଥିମଧ୍ୟରୁ କେଉଁ ଦ୍ରବଣ ସବୁଠୁ ଅମ୍ଳୀୟ?',
        options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'],
        why: 'pH ଯେତେ କମ୍, ଦ୍ରବଣ ସେତେ ଅମ୍ଳୀୟ। pH 3 ରେ pH 6 ଅପେକ୍ଷା 1000 ଗୁଣ ଅଧିକ H⁺ ଆୟନ।'
      }, {
        q: 'pH 4 ଦ୍ରବଣରେ pH 5 ଦ୍ରବଣ ଅପେକ୍ଷା କେତେ ଗୁଣ ଅଧିକ H⁺ ଆୟନ?',
        options: ['2 ଗୁଣ', '10 ଗୁଣ', '100 ଗୁଣ', 'ଅଧା'],
        why: 'pH ମାପରେ 1 ର ପ୍ରତ୍ୟେକ ପାହାଚ H⁺ ଗାଢ଼ତାରେ 10 ଗୁଣ। pH 4 → 10⁻⁴ mol/L; pH 5 → 10⁻⁵ mol/L।'
      }, {
        q: 'ସୋଡିୟମ୍ ହାଇଡ୍ରକ୍ସାଇଡ୍ (NaOH) ଦ୍ରବଣରେ ଫିନଲ୍‌ଫ୍‌ଥାଲିନ୍ କେଉଁ ରଙ୍ଗ?',
        options: ['ବର୍ଣ୍ଣହୀନ', 'ଗୋଲାପୀ', 'ହଳଦିଆ', 'ଲାଲ'],
        why: 'ଫିନଲ୍‌ଫ୍‌ଥାଲିନ୍ ଅମ୍ଳରେ ବର୍ଣ୍ଣହୀନ, କ୍ଷାରରେ ଗୋଲାପୀ। NaOH ତୀବ୍ର କ୍ଷାର।'
      }, {
        q: 'ସାର୍ଟରେ ହଳଦୀ ଦାଗରେ ସାବୁନ ଘଷିଲେ ଲାଲ ହୁଏ। ଏହା ଦେଖାଏ ସାବୁନ',
        options: ['ଅମ୍ଳୀୟ', 'ପ୍ରଶମ', 'କ୍ଷାରୀୟ', 'ଏକ ଲବଣ'],
        why: 'ହଳଦୀ ପ୍ରାକୃତିକ ସୂଚକ: ଅମ୍ଳ ଓ ପ୍ରଶମ ଦ୍ରବଣରେ ହଳଦିଆ ରହେ, କ୍ଷାରରେ ଲାଲ ହୁଏ। ସାବୁନ କ୍ଷାରୀୟ।'
      }, {
        q: 'ପାଟିର pH କେତେ ତଳକୁ ଗଲେ ଦାନ୍ତ କ୍ଷୟ ଆରମ୍ଭ ହୁଏ?',
        options: ['5.5', '7', '8.5', '2'],
        why: 'ଦାନ୍ତ ଏନାମେଲ୍ pH 5.5 ତଳେ ତରଳିବା ଆରମ୍ଭ କରେ। ବ୍ୟାକ୍ଟେରିଆ ବାକି ଚିନିରୁ ଏହି ଅମ୍ଳ ତିଆରି କରନ୍ତି।'
      }, {
        q: 'ବର୍ଷାର pH କେତେ ତଳେ ହେଲେ ଏହାକୁ ଅମ୍ଳ ବର୍ଷା କୁହାଯାଏ?',
        options: ['7', '5.6', '6.5', '3'],
        why: 'ସାଧାରଣ ବର୍ଷା ଦ୍ରବୀଭୂତ CO₂ ଯୋଗୁଁ ଅଳ୍ପ ଅମ୍ଳୀୟ (ପ୍ରାୟ 5.6)। 5.6 ତଳେ ଅମ୍ଳ ବର୍ଷା, ଯାହା ସଲ୍‌ଫର୍ ଓ ନାଇଟ୍ରୋଜେନ୍ ଅକ୍ସାଇଡ୍‌ରୁ ହୁଏ।'
      }, {
        q: 'ମିଲ୍କ ଅଫ୍ ମ୍ୟାଗ୍ନେସିଆ ପରି ଆଣ୍ଟାସିଡ୍ ଆସିଡିଟିରେ ଆରାମ ଦିଏ କାରଣ ଏହା',
        options: ['ପାକସ୍ଥଳୀରେ ଅଧିକ ଅମ୍ଳ ମିଶାଏ', 'ପାକସ୍ଥଳୀର ଅତିରିକ୍ତ ଅମ୍ଳକୁ ପ୍ରଶମିତ କରେ', 'ପାକସ୍ଥଳୀକୁ ଥଣ୍ଡା କରେ', 'ପାକସ୍ଥଳୀରୁ ପାଣି ବାହାର କରେ'],
        why: 'ମିଲ୍କ ଅଫ୍ ମ୍ୟାଗ୍ନେସିଆ, Mg(OH)₂, ଏକ ମୃଦୁ କ୍ଷାର। ଏହା ପାକସ୍ଥଳୀର ଅତିରିକ୍ତ ହାଇଡ୍ରୋକ୍ଲୋରିକ୍ ଅମ୍ଳକୁ ପ୍ରଶମିତ କରେ।'
      }, {
        q: 'ମହୁମାଛି କାମୁଡ଼ା ଯନ୍ତ୍ରଣା ଦିଏ କାରଣ ଏହା ଅମ୍ଳ ଛାଡ଼େ। ଘରର କେଉଁ ଜିନିଷ କାମୁଡ଼ାରେ ଘଷିଲେ ଆରାମ ମିଳେ?',
        options: ['ଭିନେଗାର', 'ଲେମ୍ବୁ ରସ', 'ବେକିଂ ସୋଡା', 'ଲୁଣ'],
        why: 'କାମୁଡ଼ା ମିଥାନୋଇକ୍ ଅମ୍ଳ ଛାଡ଼େ। ବେକିଂ ସୋଡା ମୃଦୁ କ୍ଷାର ଯାହା ଏହାକୁ ପ୍ରଶମିତ କରେ। ଭିନେଗାର ଓ ଲେମ୍ବୁ ରସ ଅମ୍ଳ, ସାହାଯ୍ୟ କରିବେ ନାହିଁ।'
      }, {
        q: 'ସାଧାରଣ ଲୁଣ (NaCl) ତୀବ୍ର ଅମ୍ଳ (HCl) ଓ ତୀବ୍ର କ୍ଷାର (NaOH) ରୁ ତିଆରି। ପାଣିରେ ଏହାର ଦ୍ରବଣ',
        options: ['ଅମ୍ଳୀୟ', 'କ୍ଷାରୀୟ', 'ପ୍ରଶମ', 'କେବେ ଅମ୍ଳୀୟ, କେବେ କ୍ଷାରୀୟ'],
        why: 'ଦୁଇ ପିତାମାତା ତୀବ୍ର ହେଲେ କେହି ଜିତନ୍ତି ନାହିଁ: ଲବଣ ଦ୍ରବଣ ପ୍ରଶମ, pH 7।'
      }, {
        q: 'ଆମୋନିୟମ୍ କ୍ଲୋରାଇଡ୍ (NH₄Cl) ଦ୍ରବଣ ଅମ୍ଳୀୟ କାରଣ ଏହା ତିଆରି',
        options: ['ତୀବ୍ର ଅମ୍ଳ ଓ ମୃଦୁ କ୍ଷାରରୁ', 'ମୃଦୁ ଅମ୍ଳ ଓ ତୀବ୍ର କ୍ଷାରରୁ', 'ତୀବ୍ର ଅମ୍ଳ ଓ ତୀବ୍ର କ୍ଷାରରୁ', 'ମୃଦୁ ଅମ୍ଳ ଓ ମୃଦୁ କ୍ଷାରରୁ'],
        why: 'HCl ତୀବ୍ର ଅମ୍ଳ ଓ NH₄OH ମୃଦୁ କ୍ଷାର। ତୀବ୍ର ପିତାମାତା ଜିତନ୍ତି, ତେଣୁ ଲବଣ ଅମ୍ଳୀୟ।'
      }, {
        q: 'HCl + NaOH → ___ + H₂O। ଖାଲି ସ୍ଥାନର ଉତ୍ପାଦ',
        options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'],
        why: 'ପ୍ରଶମନ: ଅମ୍ଳ + କ୍ଷାର → ଲବଣ + ପାଣି। ହାଇଡ୍ରୋକ୍ଲୋରିକ୍ ଅମ୍ଳ ଓ ସୋଡିୟମ୍ ହାଇଡ୍ରକ୍ସାଇଡ୍‌ରୁ ସୋଡିୟମ୍ କ୍ଲୋରାଇଡ୍ (ସାଧାରଣ ଲୁଣ) ଓ ପାଣି ହୁଏ।'
      }, {
        q: 'ପ୍ଲାଷ୍ଟର ଅଫ୍ ପ୍ୟାରିସ୍ କଣ ଗରମ କରି ତିଆରି ହୁଏ?',
        options: ['ସାଧାରଣ ଲୁଣ', 'ଜିପ୍‌ସମ୍', 'ଚୂନପଥର', 'ବେକିଂ ସୋଡା'],
        why: 'ଜିପ୍‌ସମ୍ (CaSO₄·2H₂O) 373 K ରେ ଗରମ କଲେ ପାଣି ହରାଇ ପ୍ଲାଷ୍ଟର ଅଫ୍ ପ୍ୟାରିସ୍, CaSO₄·½H₂O, ହୁଏ।'
      }, {
        q: 'ଏକ ଦ୍ରବଣରେ ସର୍ବଜନୀନ ସୂଚକ ମିଶାଇଲେ ସବୁଜ ହେଲା। ଦ୍ରବଣ',
        options: ['ତୀବ୍ର ଅମ୍ଳୀୟ', 'ପ୍ରଶମ (pH ପ୍ରାୟ 7)', 'ତୀବ୍ର କ୍ଷାରୀୟ', 'pH 2'],
        why: 'ସର୍ବଜନୀନ ସୂଚକ ଚାର୍ଟରେ ସବୁଜ ମାନେ pH 7, ପ୍ରଶମ। ଲାଲ ମାନେ ତୀବ୍ର ଅମ୍ଳୀୟ ଓ ବାଇଗଣୀ ମାନେ ତୀବ୍ର କ୍ଷାରୀୟ।'
      }]
  },
  ta: {
    facts: {
      hcl: 'ஆய்வக வலிமையான அமிலம். நீர்த்த கரைசலும் ஆபத்தானது: தொடவோ சுவைக்கவோ கூடாது.',
      gastric: 'உணவைச் செரிக்கவும் கிருமிகளைக் கொல்லவும் நம் இரைப்பை ஹைட்ரோகுளோரிக் அமிலத்தை உற்பத்தி செய்கிறது.',
      lemon: 'சிட்ரிக் அமிலத்தால் புளிப்பு. வைட்டமின் C நிறைந்தது.',
      softdrink: 'கார்போனிக், பாஸ்போரிக் அமிலங்கள் உள்ளன. அதனால்தான் பற்களுக்குத் தீங்கு.',
      vinegar: 'அசிட்டிக் (எத்தனோயிக்) அமிலத்தின் நீர்த்த கரைசல், ஊறுகாயில் பயன்படுகிறது.',
      tomato: 'சிட்ரிக், மாலிக் அமிலங்களால் மென்மையான அமிலம்.',
      curd: 'பாக்டீரியா உருவாக்கும் லாக்டிக் அமிலம் பாலைப் புளிக்க வைத்துத் தயிராக்குகிறது.',
      coffee: 'பால் இல்லாத கருப்பு காபி மென்மையான அமிலம்.',
      tea: 'டானிக் அமிலம் தேநீருக்குச் சிறு கசப்பும் துவர்ப்பும் தருகிறது.',
      rain: 'சுத்தமான மழையும் சிறிது அமிலம், ஏனெனில் காற்றின் CO₂ அதில் கரைகிறது. 5.6 க்குக் கீழ் அது அமில மழை.',
      milk: 'புதிய பால் மிகச் சிறிது அமிலம். புளிக்கும்போது pH குறையும்.',
      saliva: 'உமிழ்நீர் நடுநிலைக்கு அருகில். இனிப்பு சாப்பிட்ட பின் பாக்டீரியா அமிலம் உருவாக்கி வாயின் pH குறைகிறது.',
      water: 'தூய நீர் நடுநிலை: H⁺ மற்றும் OH⁻ அயனிகள் சம எண்ணிக்கையில்.',
      blood: 'நம் இரத்தம் pH 7.35 முதல் 7.45 வரை இருக்கும். உடல் அதை அப்படியே வைக்கக் கடுமையாக உழைக்கிறது.',
      seawater: 'கரைந்த உப்புகள், கார்பனேட்டுகளால் சிறிது காரம்.',
      bakingsoda: 'சோடியம் ஹைட்ரஜன் கார்பனேட் (NaHCO₃), சமையலிலும் அமில நீக்கிகளிலும் பயன்படும் மென்மையான காரம்.',
      toothpaste: 'காரத்தன்மை, எனவே வாயில் பாக்டீரியா உருவாக்கும் அமிலத்தை நடுநிலையாக்குகிறது.',
      antacid: 'அமில நீக்கி மாத்திரைகளில் இரைப்பையின் கூடுதல் அமிலத்தை நடுநிலையாக்கும் மென்மையான காரங்கள் உள்ளன.',
      soap: 'சோப்பு எண்ணெயும் வலிமையான காரமும் சேர்ந்து தயாரானது, எனவே சோப்பு நீர் காரம், வழுவழுப்பாக இருக்கும்.',
      magnesia: 'மக்னீசியம் ஹைட்ராக்சைடு, Mg(OH)₂, தொங்கல், அமில நீக்கியாகப் பயன்படுகிறது.',
      ammonia: 'நீரில் கரைந்த அம்மோனியா காரம், கடுமையான வாசனை. சில சுத்தம் செய்யும் திரவங்களில் பயன்படுகிறது.',
      limewater: 'நீரில் கால்சியம் ஹைட்ராக்சைடு, Ca(OH)₂. CO₂ செலுத்தினால் பால் போல வெண்மையாகும்.',
      bleach: 'வீட்டு ப்ளீச் வலிமையான காரம், அரிக்கும் தன்மை. கையுறை அணிந்து பயன்படுத்துங்கள்.',
      naoh: 'காஸ்டிக் சோடா: சோப்பு, காகிதம் தயாரிக்கப் பயன்படும் வலிமையான காரம். மிகவும் அரிக்கும்.'
    },
    ind_why: {
      blue_litmus: 'லிட்மஸ் லைக்கனில் இருந்து கிடைக்கும் இயற்கைச் சாயம். அமிலங்கள் நீல லிட்மஸைச் சிவப்பாக்கும்; காரங்களும் நடுநிலைக் கரைசல்களும் நீலமாகவே விடும்.',
      red_litmus: 'காரங்கள் சிவப்பு லிட்மஸை நீலமாக்கும். அமிலங்களும் நடுநிலைக் கரைசல்களும் சிவப்பாகவே விடும்.',
      turmeric: 'மஞ்சள் அமிலத்திலும் நடுநிலையிலும் மஞ்சளாகவே இருக்கும், காரத்தில் சிவப்பாகும். அதனால்தான் மஞ்சள் கறையில் சோப்பு பட்டால் சிவப்பாகும்.',
      phenolphthalein: 'பீனால்ப்தலீன் அமிலத்திலும் நடுநிலையிலும் நிறமற்றது, காரத்தில் இளஞ்சிவப்பு (சுமார் pH 8.2 முதல்).',
      methyl_orange: 'மெத்தில் ஆரஞ்சு வலிமையான அமிலத்தில் சிவப்பு (pH 3.1 க்குக் கீழ்), இடையில் ஆரஞ்சு, pH 4.4 க்கு மேல் மஞ்சள்.',
      universal: 'உலகளாவிய காட்டி பல சாயங்களின் கலவை. ஒவ்வொரு pH க்கும் வேறு நிறம் காட்டும்: வலிமையான அமிலத்தில் சிவப்பு, நடுநிலையில் பச்சை, வலிமையான காரத்தில் ஊதா.',
      china_rose: 'செம்பருத்தி இதழ்கள் இயற்கைக் காட்டி தரும்: அமிலத்தை அடர் இளஞ்சிவப்பாகவும் காரத்தைப் பச்சையாகவும் மாற்றும்.'
    },
    stories: [{
        title: 'அமில நீக்கி vs இரைப்பை அமிலம்',
        emoji: '💊',
        text: 'உணவைச் செரிக்க நம் இரைப்பை ஹைட்ரோகுளோரிக் அமிலத்தை (pH சுமார் 1.2) உற்பத்தி செய்கிறது. அதிக அமிலம் வலியும் எரிச்சலும் (அமிலத்தன்மை) தரும். மில்க் ஆஃப் மக்னீசியா, Mg(OH)₂, போன்ற அமில நீக்கி மென்மையான காரம்: கூடுதல் அமிலத்தை நடுநிலையாக்கி வலியைப் போக்கும்.',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O',
        before: 1.2,
        after: 4,
        beforeLabel: 'அதிக அமிலம்',
        afterLabel: 'அமில நீக்கிக்குப் பின்'
      }, {
        title: 'தேனீக் கொட்டு vs சமையல் சோடா',
        emoji: '🐝',
        text: 'தேனீக் கொட்டு தோலில் மெத்தனோயிக் (பார்மிக்) அமிலத்தைச் செலுத்துகிறது, அது எரிகிறது. மென்மையான காரமான சமையல் சோடாக் களிம்பைத் தடவினால் அமிலம் நடுநிலையாகி நிவாரணம் கிடைக்கும். குளவிக் கொட்டு காரம், எனவே அதற்கு வினிகர் போன்ற மென்மையான அமிலம் பயன்படுத்துவர்.',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂',
        before: 3,
        after: 7,
        beforeLabel: 'கொட்டு (அமிலம்)',
        afterLabel: 'சமையல் சோடாவுக்குப் பின்'
      }],
    uses: {
      common_salt: {
        name: 'சமையல் உப்பு',
        made: 'கடல்நீரை ஆவியாக்கி, அல்லது கல் உப்பாகத் தோண்டி எடுத்து. இது சோடியம் ஹைட்ராக்சைடு, சமையல் சோடா, சலவை சோடா, ப்ளீச்சிங் பவுடர் தயாரிப்பின் மூலப்பொருள் (குளோர்-ஆல்கலி முறை: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂).',
        uses: ['சமையல், உணவு பாதுகாப்பு (ஊறுகாய், அப்பளம்)', 'NaOH, சமையல் சோடா, சலவை சோடா, ப்ளீச்சிங் பவுடர் தயாரிப்பு', 'குளிர் நாடுகளில் சாலைகளில் பனி நீக்கல்']
      },
      washing_soda: {
        name: 'சலவை சோடா',
        made: 'சமையல் சோடாவைச் சூடாக்கினால் சோடியம் கார்பனேட்; நீருடன் படிகமாக்கினால் சலவை சோடா: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O.',
        uses: ['கண்ணாடி, சோப்பு, காகிதம் தயாரிப்பு', 'நீரின் நிரந்தரக் கடினத்தன்மை நீக்கல்', 'வீட்டுச் சுத்தம் செய்யும் பொருள்']
      },
      baking_soda: {
        name: 'சமையல் சோடா',
        made: 'சமையல் உப்பிலிருந்து: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃. சூடாக்கினால் CO₂ தரும்: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂.',
        uses: ['பேக்கிங் பவுடர் கேக், ரொட்டியை மென்மையாக்கும் (CO₂ குமிழிகள்)', 'அமிலத்தன்மைக்கு அமில நீக்கி', 'சோடா-அமிலத் தீயணைப்பான்']
      },
      bleaching_powder: {
        name: 'ப்ளீச்சிங் பவுடர்',
        made: 'உலர்ந்த நீற்றிய சுண்ணாம்பில் குளோரின் வாயு வினை: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O.',
        uses: ['பருத்தி, லினன், காகிதம் வெளுப்பாக்கல்', 'குடிநீரைக் கிருமி நீக்கம்', 'வேதித் தொழிலில் ஆக்சிஜனேற்றி']
      },
      plaster_of_paris: {
        name: 'பிளாஸ்டர் ஆஃப் பாரிஸ்',
        made: 'ஜிப்சம் 373 K (100 °C) க்கு சூடாக்கப்படுகிறது: CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O. நீருடன் கலந்தால் மீண்டும் கடின ஜிப்சமாக இறுகும்.',
        uses: ['உடைந்த எலும்புகளைச் சரியான நிலையில் தாங்கல்', 'பொம்மைகள், அலங்காரப் பொருட்கள், சிலைகள்', 'சுவர், கூரை மென்மையாக்கல்']
      }
    },
    daily: [{
        icon: '🦷',
        title: 'பல் சொத்தை',
        tag: 'pH 5.5 க்குக் கீழ்',
        text: 'வாயில் உள்ள பாக்டீரியா மீதமுள்ள சர்க்கரையை அமிலமாக மாற்றும். வாயின் pH 5.5 க்குக் கீழ் சென்றால் எனாமல் (உடலின் மிகக் கடினமான பொருள்) கரையத் தொடங்கும். பற்பசை காரம், இந்த அமிலத்தை நடுநிலையாக்கும், எனவே உணவுக்குப் பின் பல் துலக்குங்கள்.'
      }, {
        icon: '🌧️',
        title: 'அமில மழை',
        tag: 'pH 5.6 க்குக் கீழ்',
        text: 'வாகனங்கள், தொழிற்சாலைகளின் புகை காற்றில் சல்பர், நைட்ரஜன் ஆக்சைடுகளைச் சேர்க்கிறது. அவை மழையில் கரைந்து அதை அமிலமாக்கும். அமில மழை ஆற்று மீன்களுக்குத் தீங்கு, பயிர்களைச் சேதப்படுத்தும், தாஜ்மஹால் போன்ற பளிங்குக் கட்டிடங்களை அரிக்கும்.'
      }, {
        icon: '🌱',
        title: 'மண் pH மற்றும் பயிர்கள்',
        tag: 'சிறந்தது: pH 6.5 முதல் 7.5',
        text: 'பெரும்பாலான தாவரங்கள் நடுநிலைக்கு அருகிலுள்ள மண்ணில் நன்றாக வளரும். மண் அதிக அமிலமாக இருந்தால் விவசாயிகள் சுண்ணாம்பு (CaO), நீற்றிய சுண்ணாம்பு (Ca(OH)₂) அல்லது சாக்பீஸ் (CaCO₃) சேர்ப்பர். அதிக காரமாக இருந்தால் உரம் போன்ற கரிமப் பொருட்களைச் சேர்ப்பர்.'
      }, {
        icon: '🐝',
        title: 'அமிலம், காரத்தால் தற்காப்பு',
        tag: 'கொட்டுகள்',
        text: 'தேனீ அல்லது எறும்புக் கொட்டு மெத்தனோயிக் அமிலத்தைச் செலுத்தும்: சமையல் சோடா தடவுங்கள். நெட்டில் இலைகளும் மெத்தனோயிக் அமிலத்தைச் செலுத்தும்: அருகில் வளரும் டாக் செடி நிவாரணம் தரும். குளவிக் கொட்டு காரம்: வினிகர் பயன்படுத்துங்கள்.'
      }, {
        icon: '🫃',
        title: 'செரிமானம் மற்றும் அமிலத்தன்மை',
        tag: 'இரைப்பை: pH 1.2',
        text: 'உணவைச் செரிக்க இரைப்பை ஹைட்ரோகுளோரிக் அமிலத்தை உற்பத்தி செய்கிறது. அதிகமாக உற்பத்தியானால் எரிச்சலும் வலியும். மில்க் ஆஃப் மக்னீசியா அல்லது சமையல் சோடா போன்ற அமில நீக்கிகள் கூடுதல் அமிலத்தை நடுநிலையாக்கும் மென்மையான காரங்கள்.'
      }, {
        icon: '🩸',
        title: 'நம் உடலுக்குக் குறுகிய வரம்பு பிடிக்கும்',
        tag: 'இரத்தம்: pH 7.35 முதல் 7.45',
        text: 'உயிருள்ள செல்கள் குறுகிய pH வரம்பில் மட்டுமே வேலை செய்யும். நம் இரத்தம் 7.4 க்கு மிக அருகில் இருக்கும்; சிறு மாற்றமும் நோயை உண்டாக்கும். அதனால்தான் கடும் நோயில் மருத்துவர்கள் இரத்த pH ஐப் பரிசோதிக்கிறார்கள்.'
      }],
    quiz: [{
        q: 'எலுமிச்சைச் சாற்றில் முக்கினால் நீல லிட்மஸ் தாள் எந்த நிறமாகும்?',
        options: ['நீலம் (மாற்றம் இல்லை)', 'சிவப்பு', 'பச்சை', 'மஞ்சள்'],
        why: 'எலுமிச்சைச் சாறு அமிலம் (pH சுமார் 2). அமிலங்கள் நீல லிட்மஸைச் சிவப்பாக்கும்.'
      }, {
        q: '25 °C இல் தூய நீரின் pH என்ன?',
        options: ['0', '7', '14', '1'],
        why: 'தூய நீர் நடுநிலை. H⁺ மற்றும் OH⁻ அயனிகள் சம எண்ணிக்கையில் உள்ளன, எனவே pH 7.'
      }, {
        q: 'இவற்றில் எந்தக் கரைசல் மிக அதிக அமிலம்?',
        options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'],
        why: 'pH குறைவாக இருந்தால் கரைசல் அதிக அமிலம். pH 3 இல் pH 6 ஐ விட 1000 மடங்கு அதிக H⁺ அயனிகள்.'
      }, {
        q: 'pH 4 கரைசலில் pH 5 கரைசலை விட எத்தனை மடங்கு அதிக H⁺ அயனிகள்?',
        options: ['2 மடங்கு', '10 மடங்கு', '100 மடங்கு', 'பாதி'],
        why: 'pH அளவுகோலில் ஒவ்வொரு 1 படியும் H⁺ செறிவில் 10 மடங்கு. pH 4 → 10⁻⁴ mol/L; pH 5 → 10⁻⁵ mol/L.'
      }, {
        q: 'சோடியம் ஹைட்ராக்சைடு (NaOH) கரைசலில் பீனால்ப்தலீன் எந்த நிறம்?',
        options: ['நிறமற்றது', 'இளஞ்சிவப்பு', 'மஞ்சள்', 'சிவப்பு'],
        why: 'பீனால்ப்தலீன் அமிலத்தில் நிறமற்றது, காரத்தில் இளஞ்சிவப்பு. NaOH வலிமையான காரம்.'
      }, {
        q: 'சட்டையில் மஞ்சள் கறையில் சோப்பு தேய்த்தால் சிவப்பாகிறது. இது சோப்பு ___ என்று காட்டுகிறது',
        options: ['அமிலம்', 'நடுநிலை', 'காரம்', 'ஒரு உப்பு'],
        why: 'மஞ்சள் இயற்கைக் காட்டி: அமிலத்திலும் நடுநிலையிலும் மஞ்சளாகவே இருக்கும், காரத்தில் சிவப்பாகும். சோப்பு காரம்.'
      }, {
        q: 'வாயின் pH எதற்குக் கீழ் சென்றால் பல் சொத்தை தொடங்கும்?',
        options: ['5.5', '7', '8.5', '2'],
        why: 'பல் எனாமல் pH 5.5 க்குக் கீழ் கரையத் தொடங்கும். பாக்டீரியா மீதமுள்ள சர்க்கரையிலிருந்து இந்த அமிலத்தை உருவாக்கும்.'
      }, {
        q: 'மழையின் pH எதற்குக் கீழ் இருந்தால் அமில மழை என்று அழைக்கப்படும்?',
        options: ['7', '5.6', '6.5', '3'],
        why: 'சாதாரண மழை கரைந்த CO₂ ஆல் சிறிது அமிலம் (சுமார் 5.6). 5.6 க்குக் கீழ் அமில மழை, சல்பர், நைட்ரஜன் ஆக்சைடுகளால் ஏற்படுகிறது.'
      }, {
        q: 'மில்க் ஆஃப் மக்னீசியா போன்ற அமில நீக்கி அமிலத்தன்மைக்கு நிவாரணம் தருகிறது, ஏனெனில் அது',
        options: ['இரைப்பையில் மேலும் அமிலம் சேர்க்கிறது', 'இரைப்பையின் கூடுதல் அமிலத்தை நடுநிலையாக்குகிறது', 'இரைப்பையைக் குளிர்விக்கிறது', 'இரைப்பையிலிருந்து நீரை நீக்குகிறது'],
        why: 'மில்க் ஆஃப் மக்னீசியா, Mg(OH)₂, மென்மையான காரம். இரைப்பையின் கூடுதல் ஹைட்ரோகுளோரிக் அமிலத்தை நடுநிலையாக்குகிறது.'
      }, {
        q: 'தேனீக் கொட்டு வலிக்கிறது, ஏனெனில் அது அமிலத்தைச் செலுத்துகிறது. வீட்டில் எது தடவினால் நிவாரணம்?',
        options: ['வினிகர்', 'எலுமிச்சைச் சாறு', 'சமையல் சோடா', 'உப்பு'],
        why: 'கொட்டு மெத்தனோயிக் அமிலத்தைச் செலுத்துகிறது. சமையல் சோடா அதை நடுநிலையாக்கும் மென்மையான காரம். வினிகரும் எலுமிச்சையும் அமிலங்கள், உதவாது.'
      }, {
        q: 'சமையல் உப்பு (NaCl) வலிமையான அமிலம் (HCl), வலிமையான காரம் (NaOH) இலிருந்து உருவாகிறது. நீரில் அதன் கரைசல்',
        options: ['அமிலம்', 'காரம்', 'நடுநிலை', 'சில நேரம் அமிலம், சில நேரம் காரம்'],
        why: 'இரு பெற்றோரும் வலிமையானால் யாரும் வெல்லவில்லை: உப்புக் கரைசல் நடுநிலை, pH 7.'
      }, {
        q: 'அம்மோனியம் குளோரைடு (NH₄Cl) கரைசல் அமிலம், ஏனெனில் அது உருவானது',
        options: ['வலிமையான அமிலம், வலிமை குறைந்த காரத்தால்', 'வலிமை குறைந்த அமிலம், வலிமையான காரத்தால்', 'வலிமையான அமிலம், வலிமையான காரத்தால்', 'வலிமை குறைந்த அமிலம், வலிமை குறைந்த காரத்தால்'],
        why: 'HCl வலிமையான அமிலம், NH₄OH வலிமை குறைந்த காரம். வலிமையான பெற்றோர் வெல்லும், எனவே உப்பு அமிலம்.'
      }, {
        q: 'HCl + NaOH → ___ + H₂O. விடுபட்ட விளைபொருள்',
        options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'],
        why: 'நடுநிலையாக்கல்: அமிலம் + காரம் → உப்பு + நீர். ஹைட்ரோகுளோரிக் அமிலமும் சோடியம் ஹைட்ராக்சைடும் சோடியம் குளோரைடு (சமையல் உப்பு), நீர் தரும்.'
      }, {
        q: 'பிளாஸ்டர் ஆஃப் பாரிஸ் எதைச் சூடாக்கித் தயாரிக்கப்படுகிறது?',
        options: ['சமையல் உப்பு', 'ஜிப்சம்', 'சுண்ணாம்புக் கல்', 'சமையல் சோடா'],
        why: 'ஜிப்சம் (CaSO₄·2H₂O) 373 K இல் சூடாக்கினால் நீரை இழந்து பிளாஸ்டர் ஆஃப் பாரிஸ், CaSO₄·½H₂O, ஆகும்.'
      }, {
        q: 'ஒரு கரைசலில் உலகளாவிய காட்டி சேர்த்தால் பச்சையாகிறது. கரைசல்',
        options: ['வலிமையான அமிலம்', 'நடுநிலை (pH சுமார் 7)', 'வலிமையான காரம்', 'pH 2'],
        why: 'உலகளாவிய காட்டி அட்டவணையில் பச்சை என்றால் pH 7, நடுநிலை. சிவப்பு வலிமையான அமிலம், ஊதா வலிமையான காரம்.'
      }]
  },
  te: {
    facts: {
      hcl: 'ల్యాబ్ బలమైన ఆమ్లం. పలుచని ద్రావణం కూడా ప్రమాదకరం: ఎప్పుడూ తాకకండి, రుచి చూడకండి.',
      gastric: 'ఆహారం జీర్ణం చేయడానికి, క్రిములను చంపడానికి మన కడుపు హైడ్రోక్లోరిక్ ఆమ్లం తయారు చేస్తుంది.',
      lemon: 'సిట్రిక్ ఆమ్లం వల్ల పుల్లన. విటమిన్ C సమృద్ధి.',
      softdrink: 'కార్బోనిక్, ఫాస్ఫారిక్ ఆమ్లాలు ఉంటాయి. అందుకే పళ్ళకు హాని.',
      vinegar: 'ఎసిటిక్ (ఇథనోయిక్) ఆమ్లం పలుచని ద్రావణం, ఊరగాయల్లో వాడతారు.',
      tomato: 'సిట్రిక్, మాలిక్ ఆమ్లాల వల్ల బలహీన ఆమ్లం.',
      curd: 'బ్యాక్టీరియా తయారు చేసే లాక్టిక్ ఆమ్లం పాలను పుల్లగా చేసి పెరుగుగా మారుస్తుంది.',
      coffee: 'పాలు లేని బ్లాక్ కాఫీ బలహీన ఆమ్లం.',
      tea: 'టానిక్ ఆమ్లం టీకి కొద్దిగా చేదు, వగరు రుచి ఇస్తుంది.',
      rain: 'శుభ్రమైన వర్షం కూడా కొద్దిగా ఆమ్లం, గాలిలోని CO₂ దానిలో కరుగుతుంది. 5.6 కింద అది ఆమ్ల వర్షం.',
      milk: 'తాజా పాలు చాలా కొద్దిగా ఆమ్లం. పుల్లబడుతుంటే pH తగ్గుతుంది.',
      saliva: 'లాలాజలం తటస్థానికి దగ్గర. తీపి తిన్నాక బ్యాక్టీరియా ఆమ్లం తయారు చేసి నోటి pH తగ్గుతుంది.',
      water: 'స్వచ్ఛమైన నీరు తటస్థం: H⁺, OH⁻ అయాన్లు సమాన సంఖ్యలో.',
      blood: 'మన రక్తం pH 7.35 నుండి 7.45 మధ్య ఉంటుంది. శరీరం దాన్ని అలా ఉంచడానికి చాలా కష్టపడుతుంది.',
      seawater: 'కరిగిన లవణాలు, కార్బొనేట్ల వల్ల కొద్దిగా క్షారం.',
      bakingsoda: 'సోడియం హైడ్రోజన్ కార్బొనేట్ (NaHCO₃), వంటలో, ఆంటాసిడ్‌లలో వాడే బలహీన క్షారం.',
      toothpaste: 'క్షారం, కనుక నోటిలో బ్యాక్టీరియా చేసిన ఆమ్లాన్ని తటస్థం చేస్తుంది.',
      antacid: 'ఆంటాసిడ్ మాత్రల్లో కడుపులోని అదనపు ఆమ్లాన్ని తటస్థం చేసే బలహీన క్షారాలు ఉంటాయి.',
      soap: 'సబ్బు నూనె, బలమైన క్షారంతో తయారవుతుంది, కనుక సబ్బు నీరు క్షారం, జారుడుగా ఉంటుంది.',
      magnesia: 'మెగ్నీషియం హైడ్రాక్సైడ్, Mg(OH)₂, సస్పెన్షన్, ఆంటాసిడ్‌గా వాడతారు.',
      ammonia: 'నీటిలో కరిగిన అమ్మోనియా క్షారం, ఘాటు వాసన. కొన్ని క్లీనర్లలో వాడతారు.',
      limewater: 'నీటిలో కాల్షియం హైడ్రాక్సైడ్, Ca(OH)₂. CO₂ పంపితే పాలలా తెల్లబడుతుంది.',
      bleach: 'ఇంటి బ్లీచ్ బలమైన క్షారం, తినివేసే స్వభావం. గ్లౌజులు వేసుకుని వాడండి.',
      naoh: 'కాస్టిక్ సోడా: సబ్బు, కాగితం తయారీలో వాడే బలమైన క్షారం. చాలా తినివేసేది.'
    },
    ind_why: {
      blue_litmus: 'లిట్మస్ లైకెన్ల నుండి వచ్చే సహజ రంజకం. ఆమ్లాలు నీలి లిట్మస్‌ను ఎరుపు చేస్తాయి; క్షారాలు, తటస్థ ద్రావణాలు నీలంగానే వదిలేస్తాయి.',
      red_litmus: 'క్షారాలు ఎరుపు లిట్మస్‌ను నీలం చేస్తాయి. ఆమ్లాలు, తటస్థ ద్రావణాలు ఎరుపుగానే వదిలేస్తాయి.',
      turmeric: 'పసుపు ఆమ్లంలో, తటస్థంలో పసుపుగా ఉంటుంది, క్షారంలో ఎరుపు అవుతుంది. అందుకే పసుపు మరకపై సబ్బు పడితే ఎరుపు అవుతుంది.',
      phenolphthalein: 'ఫినాఫ్తలీన్ ఆమ్లంలో, తటస్థంలో రంగులేనిది, క్షారంలో గులాబీ (సుమారు pH 8.2 నుండి).',
      methyl_orange: 'మిథైల్ ఆరెంజ్ బలమైన ఆమ్లంలో ఎరుపు (pH 3.1 కింద), మధ్యలో నారింజ, pH 4.4 పైన పసుపు.',
      universal: 'సార్వత్రిక సూచిక అనేక రంజకాల మిశ్రమం. ప్రతి pH కి వేరే రంగు చూపుతుంది: బలమైన ఆమ్లంలో ఎరుపు, తటస్థంలో ఆకుపచ్చ, బలమైన క్షారంలో ఊదా.',
      china_rose: 'మందార రేకులు సహజ సూచిక ఇస్తాయి: ఆమ్లాన్ని ముదురు గులాబీ, క్షారాన్ని ఆకుపచ్చ చేస్తుంది.'
    },
    stories: [{
        title: 'ఆంటాసిడ్ vs కడుపు ఆమ్లం',
        emoji: '💊',
        text: 'ఆహారం జీర్ణం చేయడానికి మన కడుపు హైడ్రోక్లోరిక్ ఆమ్లం (pH సుమారు 1.2) తయారు చేస్తుంది. ఎక్కువ ఆమ్లం నొప్పి, మంట (ఎసిడిటీ) కలిగిస్తుంది. మిల్క్ ఆఫ్ మెగ్నీషియా, Mg(OH)₂, లాంటి ఆంటాసిడ్ బలహీన క్షారం: అదనపు ఆమ్లాన్ని తటస్థం చేసి నొప్పి పోగొడుతుంది.',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O',
        before: 1.2,
        after: 4,
        beforeLabel: 'చాలా ఎక్కువ ఆమ్లం',
        afterLabel: 'ఆంటాసిడ్ తర్వాత'
      }, {
        title: 'తేనెటీగ కుట్టు vs బేకింగ్ సోడా',
        emoji: '🐝',
        text: 'తేనెటీగ కుట్టు చర్మంలోకి మిథనోయిక్ (ఫార్మిక్) ఆమ్లం పంపుతుంది, అది మండుతుంది. బలహీన క్షారమైన బేకింగ్ సోడా పేస్ట్ రాస్తే ఆమ్లం తటస్థమై ఉపశమనం వస్తుంది. కందిరీగ కుట్టు క్షారం, కనుక దానికి వెనిగర్ లాంటి బలహీన ఆమ్లం వాడతారు.',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂',
        before: 3,
        after: 7,
        beforeLabel: 'కుట్టు (ఆమ్లం)',
        afterLabel: 'బేకింగ్ సోడా తర్వాత'
      }],
    uses: {
      common_salt: {
        name: 'ఉప్పు',
        made: 'సముద్రపు నీటిని ఆవిరి చేసి, లేదా రాతి ఉప్పుగా తవ్వి. ఇది సోడియం హైడ్రాక్సైడ్, బేకింగ్ సోడా, వాషింగ్ సోడా, బ్లీచింగ్ పౌడర్‌లకు ముడి పదార్థం (క్లోర్-ఆల్కలీ ప్రక్రియ: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂).',
        uses: ['వంట, ఆహార నిల్వ (ఊరగాయలు, అప్పడాలు)', 'NaOH, బేకింగ్ సోడా, వాషింగ్ సోడా, బ్లీచింగ్ పౌడర్ తయారీ', 'చలి దేశాల్లో రోడ్లపై మంచు తొలగింపు']
      },
      washing_soda: {
        name: 'వాషింగ్ సోడా',
        made: 'బేకింగ్ సోడాను వేడి చేస్తే సోడియం కార్బొనేట్; నీటితో స్ఫటికీకరిస్తే వాషింగ్ సోడా: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O.',
        uses: ['గాజు, సబ్బు, కాగితం తయారీ', 'నీటి శాశ్వత కాఠిన్యం తొలగింపు', 'ఇంటి శుభ్రతకు']
      },
      baking_soda: {
        name: 'బేకింగ్ సోడా',
        made: 'ఉప్పు నుండి: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃. వేడి చేస్తే CO₂ ఇస్తుంది: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂.',
        uses: ['బేకింగ్ పౌడర్ కేక్, బ్రెడ్‌ను మెత్తగా చేస్తుంది (CO₂ బుడగలు)', 'ఎసిడిటీకి ఆంటాసిడ్', 'సోడా-ఆమ్ల అగ్నిమాపక యంత్రాలు']
      },
      bleaching_powder: {
        name: 'బ్లీచింగ్ పౌడర్',
        made: 'పొడి తడి సున్నంపై క్లోరిన్ వాయువు చర్య: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O.',
        uses: ['పత్తి, లినెన్, కాగితం తెల్లబరచడం', 'తాగునీటిని క్రిమిరహితం చేయడం', 'రసాయన పరిశ్రమల్లో ఆక్సీకరణి']
      },
      plaster_of_paris: {
        name: 'ప్లాస్టర్ ఆఫ్ పారిస్',
        made: 'జిప్సంను 373 K (100 °C) వరకు వేడి చేస్తారు: CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O. నీటితో కలిపితే మళ్ళీ గట్టి జిప్సంగా మారుతుంది.',
        uses: ['విరిగిన ఎముకలను సరైన స్థానంలో నిలపడం', 'బొమ్మలు, అలంకరణ వస్తువులు, విగ్రహాలు', 'గోడలు, పైకప్పులు నునుపు చేయడం']
      }
    },
    daily: [{
        icon: '🦷',
        title: 'పళ్ళు పుచ్చిపోవడం',
        tag: 'pH 5.5 కింద',
        text: 'నోటిలోని బ్యాక్టీరియా మిగిలిన చక్కెరను ఆమ్లంగా మార్చుతుంది. నోటి pH 5.5 కింద పడితే ఎనామెల్ (శరీరంలో అత్యంత గట్టి పదార్థం) కరగడం మొదలవుతుంది. టూత్‌పేస్ట్ క్షారం, ఈ ఆమ్లాన్ని తటస్థం చేస్తుంది, కనుక భోజనం తర్వాత బ్రష్ చేయండి.'
      }, {
        icon: '🌧️',
        title: 'ఆమ్ల వర్షం',
        tag: 'pH 5.6 కింద',
        text: 'వాహనాలు, కర్మాగారాల పొగ గాలిలో సల్ఫర్, నైట్రోజన్ ఆక్సైడ్లు కలుపుతుంది. అవి వర్షంలో కరిగి దాన్ని ఆమ్లంగా చేస్తాయి. ఆమ్ల వర్షం నదుల్లో చేపలకు హాని, పంటలకు నష్టం, తాజ్ మహల్ లాంటి పాలరాతి భవనాలను తినేస్తుంది.'
      }, {
        icon: '🌱',
        title: 'నేల pH, పంటలు',
        tag: 'ఉత్తమం: pH 6.5 నుండి 7.5',
        text: 'చాలా మొక్కలు తటస్థానికి దగ్గరగా ఉన్న నేలలో బాగా పెరుగుతాయి. నేల ఎక్కువ ఆమ్లమైతే రైతులు పొడి సున్నం (CaO), తడి సున్నం (Ca(OH)₂) లేదా సుద్ద (CaCO₃) కలుపుతారు. ఎక్కువ క్షారమైతే కంపోస్ట్ లాంటి సేంద్రియ పదార్థం కలుపుతారు.'
      }, {
        icon: '🐝',
        title: 'ఆమ్లాలు, క్షారాలతో ఆత్మరక్షణ',
        tag: 'కుట్లు',
        text: 'తేనెటీగ లేదా చీమ కుట్టు మిథనోయిక్ ఆమ్లం పంపుతుంది: బేకింగ్ సోడా రాయండి. దురద ఆకులు కూడా మిథనోయిక్ ఆమ్లం పంపుతాయి: దగ్గరే పెరిగే డాక్ మొక్క ఉపశమనం ఇస్తుంది. కందిరీగ కుట్టు క్షారం: వెనిగర్ వాడండి.'
      }, {
        icon: '🫃',
        title: 'జీర్ణం, ఎసిడిటీ',
        tag: 'కడుపు: pH 1.2',
        text: 'ఆహారం జీర్ణం చేయడానికి కడుపు హైడ్రోక్లోరిక్ ఆమ్లం తయారు చేస్తుంది. ఎక్కువ తయారైతే మంట, నొప్పి. మిల్క్ ఆఫ్ మెగ్నీషియా లేదా బేకింగ్ సోడా లాంటి ఆంటాసిడ్లు అదనపు ఆమ్లాన్ని తటస్థం చేసే బలహీన క్షారాలు.'
      }, {
        icon: '🩸',
        title: 'మన శరీరానికి ఇరుకైన పరిధి ఇష్టం',
        tag: 'రక్తం: pH 7.35 నుండి 7.45',
        text: 'జీవ కణాలు ఇరుకైన pH పరిధిలోనే పని చేస్తాయి. మన రక్తం 7.4 కి చాలా దగ్గరగా ఉంటుంది; చిన్న మార్పు కూడా అనారోగ్యం కలిగిస్తుంది. అందుకే తీవ్ర అనారోగ్యంలో డాక్టర్లు రక్త pH పరీక్షిస్తారు.'
      }],
    quiz: [{
        q: 'నిమ్మరసంలో ముంచితే నీలి లిట్మస్ కాగితం ఏ రంగు అవుతుంది?',
        options: ['నీలం (మార్పు లేదు)', 'ఎరుపు', 'ఆకుపచ్చ', 'పసుపు'],
        why: 'నిమ్మరసం ఆమ్లం (pH సుమారు 2). ఆమ్లాలు నీలి లిట్మస్‌ను ఎరుపు చేస్తాయి.'
      }, {
        q: '25 °C వద్ద స్వచ్ఛమైన నీటి pH ఎంత?',
        options: ['0', '7', '14', '1'],
        why: 'స్వచ్ఛమైన నీరు తటస్థం. H⁺, OH⁻ అయాన్లు సమాన సంఖ్యలో ఉంటాయి, కనుక pH 7.'
      }, {
        q: 'వీటిలో ఏ ద్రావణం అత్యంత ఆమ్లం?',
        options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'],
        why: 'pH తక్కువైతే ద్రావణం ఎక్కువ ఆమ్లం. pH 3 లో pH 6 కంటే 1000 రెట్లు ఎక్కువ H⁺ అయాన్లు.'
      }, {
        q: 'pH 4 ద్రావణంలో pH 5 ద్రావణం కంటే ఎన్ని రెట్లు ఎక్కువ H⁺ అయాన్లు?',
        options: ['2 రెట్లు', '10 రెట్లు', '100 రెట్లు', 'సగం'],
        why: 'pH స్కేలుపై ప్రతి 1 మెట్టు H⁺ గాఢతలో 10 రెట్లు. pH 4 → 10⁻⁴ mol/L; pH 5 → 10⁻⁵ mol/L.'
      }, {
        q: 'సోడియం హైడ్రాక్సైడ్ (NaOH) ద్రావణంలో ఫినాఫ్తలీన్ ఏ రంగు?',
        options: ['రంగులేనిది', 'గులాబీ', 'పసుపు', 'ఎరుపు'],
        why: 'ఫినాఫ్తలీన్ ఆమ్లంలో రంగులేనిది, క్షారంలో గులాబీ. NaOH బలమైన క్షారం.'
      }, {
        q: 'చొక్కాపై పసుపు మరకపై సబ్బు రుద్దితే ఎరుపు అవుతుంది. ఇది సబ్బు ___ అని చూపుతుంది',
        options: ['ఆమ్లం', 'తటస్థం', 'క్షారం', 'ఒక లవణం'],
        why: 'పసుపు సహజ సూచిక: ఆమ్లంలో, తటస్థంలో పసుపుగా ఉంటుంది, క్షారంలో ఎరుపు. సబ్బు క్షారం.'
      }, {
        q: 'నోటి pH దేని కింద పడితే పళ్ళు పుచ్చిపోవడం మొదలవుతుంది?',
        options: ['5.5', '7', '8.5', '2'],
        why: 'పళ్ళ ఎనామెల్ pH 5.5 కింద కరగడం మొదలవుతుంది. బ్యాక్టీరియా మిగిలిన చక్కెర నుండి ఈ ఆమ్లం చేస్తుంది.'
      }, {
        q: 'వర్షం pH దేని కింద ఉంటే ఆమ్ల వర్షం అంటారు?',
        options: ['7', '5.6', '6.5', '3'],
        why: 'సాధారణ వర్షం కరిగిన CO₂ వల్ల కొద్దిగా ఆమ్లం (సుమారు 5.6). 5.6 కింద ఆమ్ల వర్షం, సల్ఫర్, నైట్రోజన్ ఆక్సైడ్ల వల్ల.'
      }, {
        q: 'మిల్క్ ఆఫ్ మెగ్నీషియా లాంటి ఆంటాసిడ్ ఎసిడిటీకి ఉపశమనం ఇస్తుంది, ఎందుకంటే అది',
        options: ['కడుపులో ఇంకా ఆమ్లం కలుపుతుంది', 'కడుపులోని అదనపు ఆమ్లాన్ని తటస్థం చేస్తుంది', 'కడుపును చల్లబరుస్తుంది', 'కడుపు నుండి నీటిని తీసేస్తుంది'],
        why: 'మిల్క్ ఆఫ్ మెగ్నీషియా, Mg(OH)₂, బలహీన క్షారం. కడుపులోని అదనపు హైడ్రోక్లోరిక్ ఆమ్లాన్ని తటస్థం చేస్తుంది.'
      }, {
        q: 'తేనెటీగ కుట్టు నొప్పి, ఎందుకంటే అది ఆమ్లం పంపుతుంది. ఇంట్లో ఏది రాస్తే ఉపశమనం?',
        options: ['వెనిగర్', 'నిమ్మరసం', 'బేకింగ్ సోడా', 'ఉప్పు'],
        why: 'కుట్టు మిథనోయిక్ ఆమ్లం పంపుతుంది. బేకింగ్ సోడా దాన్ని తటస్థం చేసే బలహీన క్షారం. వెనిగర్, నిమ్మరసం ఆమ్లాలు, పనిచేయవు.'
      }, {
        q: 'ఉప్పు (NaCl) బలమైన ఆమ్లం (HCl), బలమైన క్షారం (NaOH) నుండి ఏర్పడుతుంది. నీటిలో దాని ద్రావణం',
        options: ['ఆమ్లం', 'క్షారం', 'తటస్థం', 'కొన్నిసార్లు ఆమ్లం, కొన్నిసార్లు క్షారం'],
        why: 'ఇద్దరు తల్లిదండ్రులు బలమైనవారైతే ఎవరూ గెలవరు: లవణ ద్రావణం తటస్థం, pH 7.'
      }, {
        q: 'అమ్మోనియం క్లోరైడ్ (NH₄Cl) ద్రావణం ఆమ్లం, ఎందుకంటే అది తయారైంది',
        options: ['బలమైన ఆమ్లం, బలహీన క్షారం నుండి', 'బలహీన ఆమ్లం, బలమైన క్షారం నుండి', 'బలమైన ఆమ్లం, బలమైన క్షారం నుండి', 'బలహీన ఆమ్లం, బలహీన క్షారం నుండి'],
        why: 'HCl బలమైన ఆమ్లం, NH₄OH బలహీన క్షారం. బలమైన తల్లిదండ్రి గెలుస్తుంది, కనుక లవణం ఆమ్లం.'
      }, {
        q: 'HCl + NaOH → ___ + H₂O. ఖాళీలో ఉండే ఉత్పన్నం',
        options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'],
        why: 'తటస్థీకరణ: ఆమ్లం + క్షారం → లవణం + నీరు. హైడ్రోక్లోరిక్ ఆమ్లం, సోడియం హైడ్రాక్సైడ్ సోడియం క్లోరైడ్ (ఉప్పు), నీరు ఇస్తాయి.'
      }, {
        q: 'ప్లాస్టర్ ఆఫ్ పారిస్ దేన్ని వేడి చేసి తయారు చేస్తారు?',
        options: ['ఉప్పు', 'జిప్సం', 'సున్నపురాయి', 'బేకింగ్ సోడా'],
        why: 'జిప్సం (CaSO₄·2H₂O) 373 K వద్ద వేడి చేస్తే నీటిని కోల్పోయి ప్లాస్టర్ ఆఫ్ పారిస్, CaSO₄·½H₂O, అవుతుంది.'
      }, {
        q: 'ఒక ద్రావణంలో సార్వత్రిక సూచిక కలిపితే ఆకుపచ్చ అయింది. ద్రావణం',
        options: ['బలమైన ఆమ్లం', 'తటస్థం (pH సుమారు 7)', 'బలమైన క్షారం', 'pH 2'],
        why: 'సార్వత్రిక సూచిక చార్ట్‌లో ఆకుపచ్చ అంటే pH 7, తటస్థం. ఎరుపు బలమైన ఆమ్లం, ఊదా బలమైన క్షారం.'
      }]
  },
  kn: {
    facts: {
      hcl: 'ಲ್ಯಾಬ್‌ನ ಪ್ರಬಲ ಆಮ್ಲ. ದುರ್ಬಲ ದ್ರಾವಣವೂ ಅಪಾಯಕಾರಿ: ಎಂದಿಗೂ ಮುಟ್ಟಬೇಡಿ, ರುಚಿ ನೋಡಬೇಡಿ.',
      gastric: 'ಆಹಾರ ಜೀರ್ಣಿಸಲು ಮತ್ತು ರೋಗಾಣು ಕೊಲ್ಲಲು ನಮ್ಮ ಹೊಟ್ಟೆ ಹೈಡ್ರೋಕ್ಲೋರಿಕ್ ಆಮ್ಲ ತಯಾರಿಸುತ್ತದೆ.',
      lemon: 'ಸಿಟ್ರಿಕ್ ಆಮ್ಲದಿಂದ ಹುಳಿ. ವಿಟಮಿನ್ C ಸಮೃದ್ಧ.',
      softdrink: 'ಕಾರ್ಬೊನಿಕ್ ಮತ್ತು ಫಾಸ್ಫಾರಿಕ್ ಆಮ್ಲ ಇರುತ್ತದೆ. ಅದಕ್ಕೇ ಹಲ್ಲಿಗೆ ಹಾನಿ.',
      vinegar: 'ಅಸಿಟಿಕ್ (ಎಥನೋಯಿಕ್) ಆಮ್ಲದ ದುರ್ಬಲ ದ್ರಾವಣ, ಉಪ್ಪಿನಕಾಯಿಯಲ್ಲಿ ಬಳಕೆ.',
      tomato: 'ಸಿಟ್ರಿಕ್ ಮತ್ತು ಮ್ಯಾಲಿಕ್ ಆಮ್ಲದಿಂದ ಸ್ವಲ್ಪ ಆಮ್ಲೀಯ.',
      curd: 'ಬ್ಯಾಕ್ಟೀರಿಯಾ ಮಾಡುವ ಲ್ಯಾಕ್ಟಿಕ್ ಆಮ್ಲ ಹಾಲನ್ನು ಹುಳಿಯಾಗಿಸಿ ಮೊಸರು ಮಾಡುತ್ತದೆ.',
      coffee: 'ಹಾಲಿಲ್ಲದ ಕಪ್ಪು ಕಾಫಿ ಸ್ವಲ್ಪ ಆಮ್ಲೀಯ.',
      tea: 'ಟ್ಯಾನಿಕ್ ಆಮ್ಲ ಚಹಾಕ್ಕೆ ಸ್ವಲ್ಪ ಕಹಿ, ಒಗರು ರುಚಿ ಕೊಡುತ್ತದೆ.',
      rain: 'ಶುದ್ಧ ಮಳೆಯೂ ಸ್ವಲ್ಪ ಆಮ್ಲೀಯ, ಗಾಳಿಯ CO₂ ಅದರಲ್ಲಿ ಕರಗುತ್ತದೆ. 5.6 ಕ್ಕಿಂತ ಕೆಳಗೆ ಅದು ಆಮ್ಲ ಮಳೆ.',
      milk: 'ತಾಜಾ ಹಾಲು ತೀರಾ ಸ್ವಲ್ಪ ಆಮ್ಲೀಯ. ಹುಳಿಯಾಗುತ್ತಾ pH ಇಳಿಯುತ್ತದೆ.',
      saliva: 'ಲಾಲಾರಸ ತಟಸ್ಥಕ್ಕೆ ಹತ್ತಿರ. ಸಿಹಿ ತಿಂದ ಮೇಲೆ ಬ್ಯಾಕ್ಟೀರಿಯಾ ಆಮ್ಲ ಮಾಡಿ ಬಾಯಿಯ pH ಇಳಿಯುತ್ತದೆ.',
      water: 'ಶುದ್ಧ ನೀರು ತಟಸ್ಥ: H⁺ ಮತ್ತು OH⁻ ಅಯಾನುಗಳು ಸಮಾನ ಸಂಖ್ಯೆಯಲ್ಲಿ.',
      blood: 'ನಮ್ಮ ರಕ್ತ pH 7.35 ರಿಂದ 7.45 ನಡುವೆ ಇರುತ್ತದೆ. ದೇಹ ಅದನ್ನು ಅಲ್ಲೇ ಇಡಲು ಬಹಳ ಶ್ರಮಿಸುತ್ತದೆ.',
      seawater: 'ಕರಗಿದ ಲವಣ ಮತ್ತು ಕಾರ್ಬೊನೇಟ್‌ಗಳಿಂದ ಸ್ವಲ್ಪ ಪ್ರತ್ಯಾಮ್ಲೀಯ.',
      bakingsoda: 'ಸೋಡಿಯಂ ಹೈಡ್ರೋಜನ್ ಕಾರ್ಬೊನೇಟ್ (NaHCO₃), ಅಡುಗೆ ಮತ್ತು ಆಂಟಾಸಿಡ್‌ನಲ್ಲಿ ಬಳಸುವ ದುರ್ಬಲ ಪ್ರತ್ಯಾಮ್ಲ.',
      toothpaste: 'ಪ್ರತ್ಯಾಮ್ಲೀಯ, ಆದ್ದರಿಂದ ಬಾಯಿಯಲ್ಲಿ ಬ್ಯಾಕ್ಟೀರಿಯಾ ಮಾಡಿದ ಆಮ್ಲವನ್ನು ತಟಸ್ಥಗೊಳಿಸುತ್ತದೆ.',
      antacid: 'ಆಂಟಾಸಿಡ್ ಮಾತ್ರೆಗಳಲ್ಲಿ ಹೊಟ್ಟೆಯ ಹೆಚ್ಚುವರಿ ಆಮ್ಲವನ್ನು ತಟಸ್ಥಗೊಳಿಸುವ ದುರ್ಬಲ ಪ್ರತ್ಯಾಮ್ಲಗಳಿವೆ.',
      soap: 'ಸಾಬೂನು ಎಣ್ಣೆ ಮತ್ತು ಪ್ರಬಲ ಪ್ರತ್ಯಾಮ್ಲದಿಂದ ತಯಾರಾಗುತ್ತದೆ, ಆದ್ದರಿಂದ ಸಾಬೂನು ನೀರು ಪ್ರತ್ಯಾಮ್ಲೀಯ ಮತ್ತು ಜಾರು.',
      magnesia: 'ಮೆಗ್ನೀಷಿಯಂ ಹೈಡ್ರಾಕ್ಸೈಡ್, Mg(OH)₂, ನ ತೇಲುದ್ರಾವಣ, ಆಂಟಾಸಿಡ್ ಆಗಿ ಬಳಕೆ.',
      ammonia: 'ನೀರಿನಲ್ಲಿ ಕರಗಿದ ಅಮೋನಿಯಾ ಪ್ರತ್ಯಾಮ್ಲೀಯ, ಘಾಟು ವಾಸನೆ. ಕೆಲವು ಕ್ಲೀನರ್‌ಗಳಲ್ಲಿ ಬಳಕೆ.',
      limewater: 'ನೀರಿನಲ್ಲಿ ಕ್ಯಾಲ್ಸಿಯಂ ಹೈಡ್ರಾಕ್ಸೈಡ್, Ca(OH)₂. CO₂ ಹಾಯಿಸಿದರೆ ಹಾಲಿನಂತೆ ಬಿಳಿಯಾಗುತ್ತದೆ.',
      bleach: 'ಮನೆಯ ಬ್ಲೀಚ್ ಪ್ರಬಲ ಪ್ರತ್ಯಾಮ್ಲೀಯ ಮತ್ತು ನಾಶಕಾರಿ. ಕೈಗವಸು ಧರಿಸಿ ಬಳಸಿ.',
      naoh: 'ಕಾಸ್ಟಿಕ್ ಸೋಡಾ: ಸಾಬೂನು ಮತ್ತು ಕಾಗದ ತಯಾರಿಕೆಯಲ್ಲಿ ಬಳಸುವ ಪ್ರಬಲ ಪ್ರತ್ಯಾಮ್ಲ. ಬಹಳ ನಾಶಕಾರಿ.'
    },
    ind_why: {
      blue_litmus: 'ಲಿಟ್ಮಸ್ ಲೈಕೆನ್‌ನಿಂದ ಸಿಗುವ ನೈಸರ್ಗಿಕ ಬಣ್ಣ. ಆಮ್ಲಗಳು ನೀಲಿ ಲಿಟ್ಮಸ್ ಅನ್ನು ಕೆಂಪಾಗಿಸುತ್ತವೆ; ಪ್ರತ್ಯಾಮ್ಲ ಮತ್ತು ತಟಸ್ಥ ದ್ರಾವಣಗಳು ನೀಲಿಯಾಗಿಯೇ ಬಿಡುತ್ತವೆ.',
      red_litmus: 'ಪ್ರತ್ಯಾಮ್ಲಗಳು ಕೆಂಪು ಲಿಟ್ಮಸ್ ಅನ್ನು ನೀಲಿಯಾಗಿಸುತ್ತವೆ. ಆಮ್ಲ ಮತ್ತು ತಟಸ್ಥ ದ್ರಾವಣಗಳು ಕೆಂಪಾಗಿಯೇ ಬಿಡುತ್ತವೆ.',
      turmeric: 'ಅರಿಶಿನ ಆಮ್ಲ ಮತ್ತು ತಟಸ್ಥ ದ್ರಾವಣದಲ್ಲಿ ಹಳದಿ, ಪ್ರತ್ಯಾಮ್ಲದಲ್ಲಿ ಕೆಂಪಾಗುತ್ತದೆ. ಅದಕ್ಕೇ ಅರಿಶಿನದ ಕಲೆಗೆ ಸಾಬೂನು ತಾಗಿದಾಗ ಕೆಂಪಾಗುತ್ತದೆ.',
      phenolphthalein: 'ಫಿನಾಲ್ಫ್ತಲೀನ್ ಆಮ್ಲ ಮತ್ತು ತಟಸ್ಥ ದ್ರಾವಣದಲ್ಲಿ ಬಣ್ಣರಹಿತ, ಪ್ರತ್ಯಾಮ್ಲದಲ್ಲಿ ಗುಲಾಬಿ (ಸುಮಾರು pH 8.2 ರಿಂದ).',
      methyl_orange: 'ಮೀಥೈಲ್ ಆರೆಂಜ್ ಪ್ರಬಲ ಆಮ್ಲದಲ್ಲಿ ಕೆಂಪು (pH 3.1 ಕ್ಕಿಂತ ಕೆಳಗೆ), ನಡುವೆ ಕಿತ್ತಳೆ, pH 4.4 ಕ್ಕಿಂತ ಮೇಲೆ ಹಳದಿ.',
      universal: 'ಸಾರ್ವತ್ರಿಕ ಸೂಚಕ ಹಲವು ವರ್ಣದ್ರವ್ಯಗಳ ಮಿಶ್ರಣ. ಪ್ರತಿ pH ಗೆ ಬೇರೆ ಬಣ್ಣ ತೋರಿಸುತ್ತದೆ: ಪ್ರಬಲ ಆಮ್ಲದಲ್ಲಿ ಕೆಂಪು, ತಟಸ್ಥದಲ್ಲಿ ಹಸಿರು, ಪ್ರಬಲ ಪ್ರತ್ಯಾಮ್ಲದಲ್ಲಿ ನೇರಳೆ.',
      china_rose: 'ದಾಸವಾಳದ ದಳಗಳು ನೈಸರ್ಗಿಕ ಸೂಚಕ ಕೊಡುತ್ತವೆ: ಆಮ್ಲವನ್ನು ಗಾಢ ಗುಲಾಬಿ, ಪ್ರತ್ಯಾಮ್ಲವನ್ನು ಹಸಿರಾಗಿಸುತ್ತದೆ.'
    },
    stories: [{
        title: 'ಆಂಟಾಸಿಡ್ vs ಹೊಟ್ಟೆಯ ಆಮ್ಲ',
        emoji: '💊',
        text: 'ಆಹಾರ ಜೀರ್ಣಿಸಲು ನಮ್ಮ ಹೊಟ್ಟೆ ಹೈಡ್ರೋಕ್ಲೋರಿಕ್ ಆಮ್ಲ (pH ಸುಮಾರು 1.2) ತಯಾರಿಸುತ್ತದೆ. ಹೆಚ್ಚು ಆಮ್ಲ ನೋವು ಮತ್ತು ಉರಿ (ಆಸಿಡಿಟಿ) ತರುತ್ತದೆ. ಮಿಲ್ಕ್ ಆಫ್ ಮೆಗ್ನೀಷಿಯಾ, Mg(OH)₂, ನಂತಹ ಆಂಟಾಸಿಡ್ ದುರ್ಬಲ ಪ್ರತ್ಯಾಮ್ಲ: ಹೆಚ್ಚುವರಿ ಆಮ್ಲವನ್ನು ತಟಸ್ಥಗೊಳಿಸಿ ನೋವು ಹೋಗುತ್ತದೆ.',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O',
        before: 1.2,
        after: 4,
        beforeLabel: 'ತುಂಬಾ ಆಮ್ಲ',
        afterLabel: 'ಆಂಟಾಸಿಡ್ ನಂತರ'
      }, {
        title: 'ಜೇನುನೊಣದ ಕಡಿತ vs ಬೇಕಿಂಗ್ ಸೋಡಾ',
        emoji: '🐝',
        text: 'ಜೇನುನೊಣದ ಕಡಿತ ಚರ್ಮಕ್ಕೆ ಮೀಥನೋಯಿಕ್ (ಫಾರ್ಮಿಕ್) ಆಮ್ಲ ಚುಚ್ಚುತ್ತದೆ, ಅದು ಉರಿಯುತ್ತದೆ. ದುರ್ಬಲ ಪ್ರತ್ಯಾಮ್ಲವಾದ ಬೇಕಿಂಗ್ ಸೋಡಾ ಲೇಪ ಉಜ್ಜಿದರೆ ಆಮ್ಲ ತಟಸ್ಥವಾಗಿ ಉಪಶಮನ ಸಿಗುತ್ತದೆ. ಕಣಜದ ಕಡಿತ ಪ್ರತ್ಯಾಮ್ಲೀಯ, ಅದಕ್ಕೆ ವಿನೆಗರ್‌ನಂತಹ ದುರ್ಬಲ ಆಮ್ಲ ಬಳಸುತ್ತಾರೆ.',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂',
        before: 3,
        after: 7,
        beforeLabel: 'ಕಡಿತ (ಆಮ್ಲ)',
        afterLabel: 'ಬೇಕಿಂಗ್ ಸೋಡಾ ನಂತರ'
      }],
    uses: {
      common_salt: {
        name: 'ಅಡುಗೆ ಉಪ್ಪು',
        made: 'ಸಮುದ್ರದ ನೀರನ್ನು ಆವಿಯಾಗಿಸಿ, ಅಥವಾ ಕಲ್ಲುಪ್ಪಾಗಿ ಅಗೆದು. ಇದು ಸೋಡಿಯಂ ಹೈಡ್ರಾಕ್ಸೈಡ್, ಬೇಕಿಂಗ್ ಸೋಡಾ, ವಾಷಿಂಗ್ ಸೋಡಾ ಮತ್ತು ಬ್ಲೀಚಿಂಗ್ ಪೌಡರ್‌ನ ಕಚ್ಚಾ ವಸ್ತು (ಕ್ಲೋರ್-ಕ್ಷಾರ ಪ್ರಕ್ರಿಯೆ: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂).',
        uses: ['ಅಡುಗೆ ಮತ್ತು ಆಹಾರ ಸಂರಕ್ಷಣೆ (ಉಪ್ಪಿನಕಾಯಿ, ಹಪ್ಪಳ)', 'NaOH, ಬೇಕಿಂಗ್ ಸೋಡಾ, ವಾಷಿಂಗ್ ಸೋಡಾ ಮತ್ತು ಬ್ಲೀಚಿಂಗ್ ಪೌಡರ್ ತಯಾರಿಕೆ', 'ಶೀತ ದೇಶಗಳಲ್ಲಿ ರಸ್ತೆಯ ಮಂಜು ತೆಗೆಯಲು']
      },
      washing_soda: {
        name: 'ವಾಷಿಂಗ್ ಸೋಡಾ',
        made: 'ಬೇಕಿಂಗ್ ಸೋಡಾ ಕಾಯಿಸಿದರೆ ಸೋಡಿಯಂ ಕಾರ್ಬೊನೇಟ್; ನೀರಿನೊಂದಿಗೆ ಹರಳುಗಟ್ಟಿಸಿದರೆ ವಾಷಿಂಗ್ ಸೋಡಾ: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O.',
        uses: ['ಗಾಜು, ಸಾಬೂನು ಮತ್ತು ಕಾಗದ ತಯಾರಿಕೆ', 'ನೀರಿನ ಶಾಶ್ವತ ಗಡಸುತನ ತೆಗೆಯಲು', 'ಮನೆ ಸ್ವಚ್ಛತೆಗೆ']
      },
      baking_soda: {
        name: 'ಬೇಕಿಂಗ್ ಸೋಡಾ',
        made: 'ಅಡುಗೆ ಉಪ್ಪಿನಿಂದ: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃. ಕಾಯಿಸಿದರೆ CO₂ ಕೊಡುತ್ತದೆ: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂.',
        uses: ['ಬೇಕಿಂಗ್ ಪೌಡರ್ ಕೇಕ್ ಮತ್ತು ಬ್ರೆಡ್ ಮೃದುಗೊಳಿಸುತ್ತದೆ (CO₂ ಗುಳ್ಳೆ)', 'ಆಸಿಡಿಟಿಗೆ ಆಂಟಾಸಿಡ್', 'ಸೋಡಾ-ಆಮ್ಲ ಅಗ್ನಿಶಾಮಕ']
      },
      bleaching_powder: {
        name: 'ಬ್ಲೀಚಿಂಗ್ ಪೌಡರ್',
        made: 'ಒಣ ಆರಿದ ಸುಣ್ಣದ ಮೇಲೆ ಕ್ಲೋರಿನ್ ಅನಿಲದ ಕ್ರಿಯೆ: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O.',
        uses: ['ಹತ್ತಿ, ಲಿನೆನ್ ಮತ್ತು ಕಾಗದ ಬಿಳಿಚಲು', 'ಕುಡಿಯುವ ನೀರು ರೋಗಾಣುಮುಕ್ತ ಮಾಡಲು', 'ರಾಸಾಯನಿಕ ಉದ್ಯಮದಲ್ಲಿ ಆಕ್ಸಿಡೀಕಾರಕ']
      },
      plaster_of_paris: {
        name: 'ಪ್ಲಾಸ್ಟರ್ ಆಫ್ ಪ್ಯಾರಿಸ್',
        made: 'ಜಿಪ್ಸಮ್ ಅನ್ನು 373 K (100 °C) ಗೆ ಕಾಯಿಸುತ್ತಾರೆ: CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O. ನೀರು ಬೆರೆಸಿದರೆ ಮತ್ತೆ ಗಟ್ಟಿ ಜಿಪ್ಸಮ್ ಆಗುತ್ತದೆ.',
        uses: ['ಮುರಿದ ಮೂಳೆಗಳನ್ನು ಸರಿಯಾದ ಸ್ಥಿತಿಯಲ್ಲಿ ಹಿಡಿಯಲು', 'ಆಟಿಕೆ, ಅಲಂಕಾರ ವಸ್ತು ಮತ್ತು ಪ್ರತಿಮೆ', 'ಗೋಡೆ ಮತ್ತು ಛಾವಣಿ ನಯಗೊಳಿಸಲು']
      }
    },
    daily: [{
        icon: '🦷',
        title: 'ಹಲ್ಲು ಹುಳುಕು',
        tag: 'pH 5.5 ಕ್ಕಿಂತ ಕೆಳಗೆ',
        text: 'ಬಾಯಿಯ ಬ್ಯಾಕ್ಟೀರಿಯಾ ಉಳಿದ ಸಕ್ಕರೆಯನ್ನು ಆಮ್ಲವಾಗಿಸುತ್ತದೆ. ಬಾಯಿಯ pH 5.5 ಕ್ಕಿಂತ ಕೆಳಗಿಳಿದಾಗ ಎನಾಮೆಲ್ (ದೇಹದ ಅತಿ ಗಟ್ಟಿ ವಸ್ತು) ಕರಗಲು ಆರಂಭಿಸುತ್ತದೆ. ಟೂತ್‌ಪೇಸ್ಟ್ ಪ್ರತ್ಯಾಮ್ಲೀಯ, ಈ ಆಮ್ಲವನ್ನು ತಟಸ್ಥಗೊಳಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ಊಟದ ನಂತರ ಬ್ರಷ್ ಮಾಡಿ.'
      }, {
        icon: '🌧️',
        title: 'ಆಮ್ಲ ಮಳೆ',
        tag: 'pH 5.6 ಕ್ಕಿಂತ ಕೆಳಗೆ',
        text: 'ವಾಹನ ಮತ್ತು ಕಾರ್ಖಾನೆಗಳ ಹೊಗೆ ಗಾಳಿಗೆ ಸಲ್ಫರ್ ಮತ್ತು ನೈಟ್ರೋಜನ್ ಆಕ್ಸೈಡ್ ಸೇರಿಸುತ್ತದೆ. ಅವು ಮಳೆಯಲ್ಲಿ ಕರಗಿ ಅದನ್ನು ಆಮ್ಲೀಯಗೊಳಿಸುತ್ತವೆ. ಆಮ್ಲ ಮಳೆ ನದಿಯ ಮೀನುಗಳಿಗೆ ಹಾನಿ, ಬೆಳೆ ನಾಶ ಮತ್ತು ತಾಜ್ ಮಹಲ್‌ನಂತಹ ಅಮೃತಶಿಲೆ ಕಟ್ಟಡಗಳನ್ನು ಸವೆಸುತ್ತದೆ.'
      }, {
        icon: '🌱',
        title: 'ಮಣ್ಣಿನ pH ಮತ್ತು ಬೆಳೆ',
        tag: 'ಉತ್ತಮ: pH 6.5 ರಿಂದ 7.5',
        text: 'ಹೆಚ್ಚಿನ ಸಸ್ಯಗಳು ತಟಸ್ಥಕ್ಕೆ ಹತ್ತಿರದ ಮಣ್ಣಿನಲ್ಲಿ ಚೆನ್ನಾಗಿ ಬೆಳೆಯುತ್ತವೆ. ಮಣ್ಣು ಹೆಚ್ಚು ಆಮ್ಲೀಯವಾದರೆ ರೈತರು ಸುಟ್ಟ ಸುಣ್ಣ (CaO), ಆರಿದ ಸುಣ್ಣ (Ca(OH)₂) ಅಥವಾ ಸೀಮೆಸುಣ್ಣ (CaCO₃) ಸೇರಿಸುತ್ತಾರೆ. ಹೆಚ್ಚು ಪ್ರತ್ಯಾಮ್ಲೀಯವಾದರೆ ಗೊಬ್ಬರದಂತಹ ಸಾವಯವ ವಸ್ತು ಸೇರಿಸುತ್ತಾರೆ.'
      }, {
        icon: '🐝',
        title: 'ಆಮ್ಲ ಮತ್ತು ಪ್ರತ್ಯಾಮ್ಲದಿಂದ ಸ್ವರಕ್ಷಣೆ',
        tag: 'ಕಡಿತಗಳು',
        text: 'ಜೇನುನೊಣ ಅಥವಾ ಇರುವೆ ಕಡಿತ ಮೀಥನೋಯಿಕ್ ಆಮ್ಲ ಚುಚ್ಚುತ್ತದೆ: ಬೇಕಿಂಗ್ ಸೋಡಾ ಉಜ್ಜಿ. ತುರಿಕೆ ಗಿಡದ ಎಲೆಗಳೂ ಮೀಥನೋಯಿಕ್ ಆಮ್ಲ ಚುಚ್ಚುತ್ತವೆ: ಹತ್ತಿರ ಬೆಳೆಯುವ ಡಾಕ್ ಸಸ್ಯ ಉಪಶಮನ ಕೊಡುತ್ತದೆ. ಕಣಜದ ಕಡಿತ ಪ್ರತ್ಯಾಮ್ಲೀಯ: ವಿನೆಗರ್ ಬಳಸಿ.'
      }, {
        icon: '🫃',
        title: 'ಜೀರ್ಣಕ್ರಿಯೆ ಮತ್ತು ಆಸಿಡಿಟಿ',
        tag: 'ಹೊಟ್ಟೆ: pH 1.2',
        text: 'ಆಹಾರ ಜೀರ್ಣಿಸಲು ಹೊಟ್ಟೆ ಹೈಡ್ರೋಕ್ಲೋರಿಕ್ ಆಮ್ಲ ತಯಾರಿಸುತ್ತದೆ. ಹೆಚ್ಚಾದಾಗ ಉರಿ ಮತ್ತು ನೋವು. ಮಿಲ್ಕ್ ಆಫ್ ಮೆಗ್ನೀಷಿಯಾ ಅಥವಾ ಬೇಕಿಂಗ್ ಸೋಡಾದಂತಹ ಆಂಟಾಸಿಡ್‌ಗಳು ಹೆಚ್ಚುವರಿ ಆಮ್ಲವನ್ನು ತಟಸ್ಥಗೊಳಿಸುವ ದುರ್ಬಲ ಪ್ರತ್ಯಾಮ್ಲಗಳು.'
      }, {
        icon: '🩸',
        title: 'ನಮ್ಮ ದೇಹಕ್ಕೆ ಕಿರಿದಾದ ವ್ಯಾಪ್ತಿ ಇಷ್ಟ',
        tag: 'ರಕ್ತ: pH 7.35 ರಿಂದ 7.45',
        text: 'ಜೀವಕೋಶಗಳು ಕಿರಿದಾದ pH ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಮಾತ್ರ ಕೆಲಸ ಮಾಡುತ್ತವೆ. ನಮ್ಮ ರಕ್ತ 7.4 ಕ್ಕೆ ತುಂಬಾ ಹತ್ತಿರ ಇರುತ್ತದೆ; ಸಣ್ಣ ಬದಲಾವಣೆಯೂ ಅನಾರೋಗ್ಯ ತರುತ್ತದೆ. ಅದಕ್ಕೇ ಗಂಭೀರ ಕಾಯಿಲೆಯಲ್ಲಿ ವೈದ್ಯರು ರಕ್ತದ pH ಪರೀಕ್ಷಿಸುತ್ತಾರೆ.'
      }],
    quiz: [{
        q: 'ನಿಂಬೆ ರಸದಲ್ಲಿ ಅದ್ದಿದರೆ ನೀಲಿ ಲಿಟ್ಮಸ್ ಕಾಗದ ಯಾವ ಬಣ್ಣ ಆಗುತ್ತದೆ?',
        options: ['ನೀಲಿ (ಬದಲಾವಣೆ ಇಲ್ಲ)', 'ಕೆಂಪು', 'ಹಸಿರು', 'ಹಳದಿ'],
        why: 'ನಿಂಬೆ ರಸ ಆಮ್ಲೀಯ (pH ಸುಮಾರು 2). ಆಮ್ಲಗಳು ನೀಲಿ ಲಿಟ್ಮಸ್ ಅನ್ನು ಕೆಂಪಾಗಿಸುತ್ತವೆ.'
      }, {
        q: '25 °C ನಲ್ಲಿ ಶುದ್ಧ ನೀರಿನ pH ಎಷ್ಟು?',
        options: ['0', '7', '14', '1'],
        why: 'ಶುದ್ಧ ನೀರು ತಟಸ್ಥ. H⁺ ಮತ್ತು OH⁻ ಅಯಾನುಗಳು ಸಮಾನ ಸಂಖ್ಯೆಯಲ್ಲಿವೆ, ಆದ್ದರಿಂದ pH 7.'
      }, {
        q: 'ಇವುಗಳಲ್ಲಿ ಯಾವ ದ್ರಾವಣ ಅತಿ ಹೆಚ್ಚು ಆಮ್ಲೀಯ?',
        options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'],
        why: 'pH ಕಡಿಮೆಯಾದಷ್ಟೂ ದ್ರಾವಣ ಹೆಚ್ಚು ಆಮ್ಲೀಯ. pH 3 ರಲ್ಲಿ pH 6 ಗಿಂತ 1000 ಪಟ್ಟು ಹೆಚ್ಚು H⁺ ಅಯಾನುಗಳು.'
      }, {
        q: 'pH 4 ದ್ರಾವಣದಲ್ಲಿ pH 5 ದ್ರಾವಣಕ್ಕಿಂತ ಎಷ್ಟು ಪಟ್ಟು ಹೆಚ್ಚು H⁺ ಅಯಾನುಗಳು?',
        options: ['2 ಪಟ್ಟು', '10 ಪಟ್ಟು', '100 ಪಟ್ಟು', 'ಅರ್ಧ'],
        why: 'pH ಮಾಪಕದಲ್ಲಿ ಪ್ರತಿ 1 ಹೆಜ್ಜೆ H⁺ ಸಾಂದ್ರತೆಯಲ್ಲಿ 10 ಪಟ್ಟು. pH 4 → 10⁻⁴ mol/L; pH 5 → 10⁻⁵ mol/L.'
      }, {
        q: 'ಸೋಡಿಯಂ ಹೈಡ್ರಾಕ್ಸೈಡ್ (NaOH) ದ್ರಾವಣದಲ್ಲಿ ಫಿನಾಲ್ಫ್ತಲೀನ್ ಯಾವ ಬಣ್ಣ?',
        options: ['ಬಣ್ಣರಹಿತ', 'ಗುಲಾಬಿ', 'ಹಳದಿ', 'ಕೆಂಪು'],
        why: 'ಫಿನಾಲ್ಫ್ತಲೀನ್ ಆಮ್ಲದಲ್ಲಿ ಬಣ್ಣರಹಿತ, ಪ್ರತ್ಯಾಮ್ಲದಲ್ಲಿ ಗುಲಾಬಿ. NaOH ಪ್ರಬಲ ಪ್ರತ್ಯಾಮ್ಲ.'
      }, {
        q: 'ಅಂಗಿಯ ಮೇಲಿನ ಅರಿಶಿನದ ಕಲೆಗೆ ಸಾಬೂನು ಉಜ್ಜಿದರೆ ಕೆಂಪಾಗುತ್ತದೆ. ಇದು ಸಾಬೂನು ___ ಎಂದು ತೋರಿಸುತ್ತದೆ',
        options: ['ಆಮ್ಲೀಯ', 'ತಟಸ್ಥ', 'ಪ್ರತ್ಯಾಮ್ಲೀಯ', 'ಒಂದು ಲವಣ'],
        why: 'ಅರಿಶಿನ ನೈಸರ್ಗಿಕ ಸೂಚಕ: ಆಮ್ಲ ಮತ್ತು ತಟಸ್ಥದಲ್ಲಿ ಹಳದಿ, ಪ್ರತ್ಯಾಮ್ಲದಲ್ಲಿ ಕೆಂಪು. ಸಾಬೂನು ಪ್ರತ್ಯಾಮ್ಲೀಯ.'
      }, {
        q: 'ಬಾಯಿಯ pH ಯಾವುದಕ್ಕಿಂತ ಕೆಳಗಿಳಿದಾಗ ಹಲ್ಲು ಹುಳುಕು ಆರಂಭ?',
        options: ['5.5', '7', '8.5', '2'],
        why: 'ಹಲ್ಲಿನ ಎನಾಮೆಲ್ pH 5.5 ಕ್ಕಿಂತ ಕೆಳಗೆ ಕರಗಲು ಆರಂಭಿಸುತ್ತದೆ. ಬ್ಯಾಕ್ಟೀರಿಯಾ ಉಳಿದ ಸಕ್ಕರೆಯಿಂದ ಈ ಆಮ್ಲ ಮಾಡುತ್ತದೆ.'
      }, {
        q: 'ಮಳೆಯ pH ಯಾವುದಕ್ಕಿಂತ ಕಡಿಮೆ ಇದ್ದರೆ ಆಮ್ಲ ಮಳೆ ಎನ್ನುತ್ತಾರೆ?',
        options: ['7', '5.6', '6.5', '3'],
        why: 'ಸಾಮಾನ್ಯ ಮಳೆ ಕರಗಿದ CO₂ ನಿಂದ ಸ್ವಲ್ಪ ಆಮ್ಲೀಯ (ಸುಮಾರು 5.6). 5.6 ಕ್ಕಿಂತ ಕೆಳಗೆ ಆಮ್ಲ ಮಳೆ, ಸಲ್ಫರ್ ಮತ್ತು ನೈಟ್ರೋಜನ್ ಆಕ್ಸೈಡ್‌ಗಳಿಂದ.'
      }, {
        q: 'ಮಿಲ್ಕ್ ಆಫ್ ಮೆಗ್ನೀಷಿಯಾದಂತಹ ಆಂಟಾಸಿಡ್ ಆಸಿಡಿಟಿಗೆ ಉಪಶಮನ ಕೊಡುತ್ತದೆ, ಏಕೆಂದರೆ ಅದು',
        options: ['ಹೊಟ್ಟೆಗೆ ಇನ್ನಷ್ಟು ಆಮ್ಲ ಸೇರಿಸುತ್ತದೆ', 'ಹೊಟ್ಟೆಯ ಹೆಚ್ಚುವರಿ ಆಮ್ಲವನ್ನು ತಟಸ್ಥಗೊಳಿಸುತ್ತದೆ', 'ಹೊಟ್ಟೆಯನ್ನು ತಂಪಾಗಿಸುತ್ತದೆ', 'ಹೊಟ್ಟೆಯಿಂದ ನೀರು ತೆಗೆಯುತ್ತದೆ'],
        why: 'ಮಿಲ್ಕ್ ಆಫ್ ಮೆಗ್ನೀಷಿಯಾ, Mg(OH)₂, ದುರ್ಬಲ ಪ್ರತ್ಯಾಮ್ಲ. ಹೊಟ್ಟೆಯ ಹೆಚ್ಚುವರಿ ಹೈಡ್ರೋಕ್ಲೋರಿಕ್ ಆಮ್ಲವನ್ನು ತಟಸ್ಥಗೊಳಿಸುತ್ತದೆ.'
      }, {
        q: 'ಜೇನುನೊಣದ ಕಡಿತ ನೋಯುತ್ತದೆ ಏಕೆಂದರೆ ಅದು ಆಮ್ಲ ಚುಚ್ಚುತ್ತದೆ. ಮನೆಯ ಯಾವ ವಸ್ತು ಉಜ್ಜಿದರೆ ಉಪಶಮನ?',
        options: ['ವಿನೆಗರ್', 'ನಿಂಬೆ ರಸ', 'ಬೇಕಿಂಗ್ ಸೋಡಾ', 'ಉಪ್ಪು'],
        why: 'ಕಡಿತ ಮೀಥನೋಯಿಕ್ ಆಮ್ಲ ಚುಚ್ಚುತ್ತದೆ. ಬೇಕಿಂಗ್ ಸೋಡಾ ಅದನ್ನು ತಟಸ್ಥಗೊಳಿಸುವ ದುರ್ಬಲ ಪ್ರತ್ಯಾಮ್ಲ. ವಿನೆಗರ್ ಮತ್ತು ನಿಂಬೆ ರಸ ಆಮ್ಲಗಳು, ಸಹಾಯ ಮಾಡುವುದಿಲ್ಲ.'
      }, {
        q: 'ಅಡುಗೆ ಉಪ್ಪು (NaCl) ಪ್ರಬಲ ಆಮ್ಲ (HCl) ಮತ್ತು ಪ್ರಬಲ ಪ್ರತ್ಯಾಮ್ಲ (NaOH) ದಿಂದ ಆಗುತ್ತದೆ. ನೀರಿನಲ್ಲಿ ಅದರ ದ್ರಾವಣ',
        options: ['ಆಮ್ಲೀಯ', 'ಪ್ರತ್ಯಾಮ್ಲೀಯ', 'ತಟಸ್ಥ', 'ಕೆಲವೊಮ್ಮೆ ಆಮ್ಲೀಯ, ಕೆಲವೊಮ್ಮೆ ಪ್ರತ್ಯಾಮ್ಲೀಯ'],
        why: 'ಇಬ್ಬರೂ ಪೋಷಕರು ಪ್ರಬಲವಾದರೆ ಯಾರೂ ಗೆಲ್ಲುವುದಿಲ್ಲ: ಲವಣ ದ್ರಾವಣ ತಟಸ್ಥ, pH 7.'
      }, {
        q: 'ಅಮೋನಿಯಂ ಕ್ಲೋರೈಡ್ (NH₄Cl) ದ್ರಾವಣ ಆಮ್ಲೀಯ ಏಕೆಂದರೆ ಅದು ತಯಾರಾದದ್ದು',
        options: ['ಪ್ರಬಲ ಆಮ್ಲ ಮತ್ತು ದುರ್ಬಲ ಪ್ರತ್ಯಾಮ್ಲದಿಂದ', 'ದುರ್ಬಲ ಆಮ್ಲ ಮತ್ತು ಪ್ರಬಲ ಪ್ರತ್ಯಾಮ್ಲದಿಂದ', 'ಪ್ರಬಲ ಆಮ್ಲ ಮತ್ತು ಪ್ರಬಲ ಪ್ರತ್ಯಾಮ್ಲದಿಂದ', 'ದುರ್ಬಲ ಆಮ್ಲ ಮತ್ತು ದುರ್ಬಲ ಪ್ರತ್ಯಾಮ್ಲದಿಂದ'],
        why: 'HCl ಪ್ರಬಲ ಆಮ್ಲ ಮತ್ತು NH₄OH ದುರ್ಬಲ ಪ್ರತ್ಯಾಮ್ಲ. ಪ್ರಬಲ ಪೋಷಕ ಗೆಲ್ಲುತ್ತದೆ, ಆದ್ದರಿಂದ ಲವಣ ಆಮ್ಲೀಯ.'
      }, {
        q: 'HCl + NaOH → ___ + H₂O. ಖಾಲಿ ಜಾಗದ ಉತ್ಪನ್ನ',
        options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'],
        why: 'ತಟಸ್ಥೀಕರಣ: ಆಮ್ಲ + ಪ್ರತ್ಯಾಮ್ಲ → ಲವಣ + ನೀರು. ಹೈಡ್ರೋಕ್ಲೋರಿಕ್ ಆಮ್ಲ ಮತ್ತು ಸೋಡಿಯಂ ಹೈಡ್ರಾಕ್ಸೈಡ್ ಸೋಡಿಯಂ ಕ್ಲೋರೈಡ್ (ಅಡುಗೆ ಉಪ್ಪು) ಮತ್ತು ನೀರು ಕೊಡುತ್ತವೆ.'
      }, {
        q: 'ಪ್ಲಾಸ್ಟರ್ ಆಫ್ ಪ್ಯಾರಿಸ್ ಯಾವುದನ್ನು ಕಾಯಿಸಿ ತಯಾರಿಸುತ್ತಾರೆ?',
        options: ['ಅಡುಗೆ ಉಪ್ಪು', 'ಜಿಪ್ಸಮ್', 'ಸುಣ್ಣದ ಕಲ್ಲು', 'ಬೇಕಿಂಗ್ ಸೋಡಾ'],
        why: 'ಜಿಪ್ಸಮ್ (CaSO₄·2H₂O) ಅನ್ನು 373 K ಗೆ ಕಾಯಿಸಿದರೆ ನೀರು ಕಳೆದು ಪ್ಲಾಸ್ಟರ್ ಆಫ್ ಪ್ಯಾರಿಸ್, CaSO₄·½H₂O, ಆಗುತ್ತದೆ.'
      }, {
        q: 'ಒಂದು ದ್ರಾವಣಕ್ಕೆ ಸಾರ್ವತ್ರಿಕ ಸೂಚಕ ಸೇರಿಸಿದಾಗ ಹಸಿರಾಯಿತು. ದ್ರಾವಣ',
        options: ['ಪ್ರಬಲ ಆಮ್ಲೀಯ', 'ತಟಸ್ಥ (pH ಸುಮಾರು 7)', 'ಪ್ರಬಲ ಪ್ರತ್ಯಾಮ್ಲೀಯ', 'pH 2'],
        why: 'ಸಾರ್ವತ್ರಿಕ ಸೂಚಕ ಪಟ್ಟಿಯಲ್ಲಿ ಹಸಿರು ಎಂದರೆ pH 7, ತಟಸ್ಥ. ಕೆಂಪು ಪ್ರಬಲ ಆಮ್ಲೀಯ, ನೇರಳೆ ಪ್ರಬಲ ಪ್ರತ್ಯಾಮ್ಲೀಯ.'
      }]
  },
  ml: {
    facts: {
      hcl: 'ലാബിലെ ശക്തമായ ആസിഡ്. നേർത്ത ലായനി പോലും അപകടകരം: ഒരിക്കലും തൊടുകയോ രുചിക്കുകയോ ചെയ്യരുത്.',
      gastric: 'ഭക്ഷണം ദഹിപ്പിക്കാനും അണുക്കളെ കൊല്ലാനും നമ്മുടെ ആമാശയം ഹൈഡ്രോക്ലോറിക് ആസിഡ് ഉണ്ടാക്കുന്നു.',
      lemon: 'സിട്രിക് ആസിഡ് കാരണം പുളി. വിറ്റാമിൻ C സമൃദ്ധം.',
      softdrink: 'കാർബോണിക്, ഫോസ്ഫോറിക് ആസിഡുകൾ അടങ്ങിയിരിക്കുന്നു. അതുകൊണ്ടാണ് പല്ലിന് ദോഷം.',
      vinegar: 'അസറ്റിക് (എഥനോയിക്) ആസിഡിന്റെ നേർത്ത ലായനി, അച്ചാറിൽ ഉപയോഗിക്കുന്നു.',
      tomato: 'സിട്രിക്, മാലിക് ആസിഡുകൾ കാരണം നേരിയ ആസിഡികം.',
      curd: 'ബാക്ടീരിയ ഉണ്ടാക്കുന്ന ലാക്ടിക് ആസിഡ് പാൽ പുളിപ്പിച്ച് തൈരാക്കുന്നു.',
      coffee: 'പാലില്ലാത്ത കട്ടൻ കാപ്പി നേരിയ ആസിഡികം.',
      tea: 'ടാനിക് ആസിഡ് ചായയ്ക്ക് നേരിയ കയ്പും ചവർപ്പും നൽകുന്നു.',
      rain: 'ശുദ്ധമായ മഴയും നേരിയ ആസിഡികമാണ്, വായുവിലെ CO₂ അതിൽ ലയിക്കുന്നു. 5.6 ന് താഴെ അതിനെ ആസിഡ് മഴ എന്ന് വിളിക്കുന്നു.',
      milk: 'പുതിയ പാൽ വളരെ നേരിയ ആസിഡികം. പുളിക്കുമ്പോൾ pH കുറയുന്നു.',
      saliva: 'ഉമിനീര് നിഷ്പക്ഷത്തോട് അടുത്ത്. മധുരം കഴിച്ച ശേഷം ബാക്ടീരിയ ആസിഡ് ഉണ്ടാക്കി വായിലെ pH കുറയുന്നു.',
      water: 'ശുദ്ധജലം നിഷ്പക്ഷം: H⁺, OH⁻ അയോണുകൾ തുല്യ എണ്ണത്തിൽ.',
      blood: 'നമ്മുടെ രക്തം pH 7.35 മുതൽ 7.45 വരെ നിൽക്കുന്നു. അത് അവിടെ നിർത്താൻ ശരീരം കഠിനമായി അധ്വാനിക്കുന്നു.',
      seawater: 'ലയിച്ച ലവണങ്ങളും കാർബണേറ്റുകളും കാരണം നേരിയ ബേസികം.',
      bakingsoda: 'സോഡിയം ഹൈഡ്രജൻ കാർബണേറ്റ് (NaHCO₃), പാചകത്തിലും ആന്റാസിഡിലും ഉപയോഗിക്കുന്ന നേരിയ ബേസ്.',
      toothpaste: 'ബേസികം, അതിനാൽ വായിൽ ബാക്ടീരിയ ഉണ്ടാക്കുന്ന ആസിഡിനെ നിർവീര്യമാക്കുന്നു.',
      antacid: 'ആന്റാസിഡ് ഗുളികകളിൽ ആമാശയത്തിലെ അധിക ആസിഡിനെ നിർവീര്യമാക്കുന്ന നേരിയ ബേസുകൾ ഉണ്ട്.',
      soap: 'സോപ്പ് എണ്ണയും ശക്തമായ ബേസും ചേർന്നുണ്ടാകുന്നു, അതിനാൽ സോപ്പുവെള്ളം ബേസികവും വഴുവഴുപ്പുള്ളതുമാണ്.',
      magnesia: 'മഗ്നീഷ്യം ഹൈഡ്രോക്സൈഡ്, Mg(OH)₂, സസ്പെൻഷൻ, ആന്റാസിഡായി ഉപയോഗിക്കുന്നു.',
      ammonia: 'വെള്ളത്തിൽ ലയിച്ച അമോണിയ ബേസികവും രൂക്ഷഗന്ധമുള്ളതുമാണ്. ചില ക്ലീനറുകളിൽ ഉപയോഗിക്കുന്നു.',
      limewater: 'വെള്ളത്തിൽ കാൽസ്യം ഹൈഡ്രോക്സൈഡ്, Ca(OH)₂. CO₂ കടത്തിവിട്ടാൽ പാൽ പോലെ വെളുക്കുന്നു.',
      bleach: 'വീട്ടിലെ ബ്ലീച്ച് ശക്തമായ ബേസികവും നാശകാരിയുമാണ്. കയ്യുറ ധരിച്ച് ഉപയോഗിക്കൂ.',
      naoh: 'കാസ്റ്റിക് സോഡ: സോപ്പും കടലാസും ഉണ്ടാക്കാൻ ഉപയോഗിക്കുന്ന ശക്തമായ ബേസ്. വളരെ നാശകാരി.'
    },
    ind_why: {
      blue_litmus: 'ലിറ്റ്മസ് ലൈക്കനിൽ നിന്നുള്ള പ്രകൃതിദത്ത ചായം. ആസിഡുകൾ നീല ലിറ്റ്മസിനെ ചുവപ്പാക്കുന്നു; ബേസുകളും നിഷ്പക്ഷ ലായനികളും നീലയായി തന്നെ നിർത്തുന്നു.',
      red_litmus: 'ബേസുകൾ ചുവപ്പ് ലിറ്റ്മസിനെ നീലയാക്കുന്നു. ആസിഡുകളും നിഷ്പക്ഷ ലായനികളും ചുവപ്പായി തന്നെ നിർത്തുന്നു.',
      turmeric: 'മഞ്ഞൾ ആസിഡിലും നിഷ്പക്ഷ ലായനിയിലും മഞ്ഞയായി തുടരുന്നു, ബേസിൽ ചുവപ്പാകുന്നു. അതുകൊണ്ടാണ് മഞ്ഞൾ കറയിൽ സോപ്പ് തട്ടുമ്പോൾ ചുവപ്പാകുന്നത്.',
      phenolphthalein: 'ഫിനോൾഫ്തലീൻ ആസിഡിലും നിഷ്പക്ഷ ലായനിയിലും നിറമില്ലാത്തത്, ബേസിൽ പിങ്ക് (ഏകദേശം pH 8.2 മുതൽ).',
      methyl_orange: 'മീഥൈൽ ഓറഞ്ച് ശക്തമായ ആസിഡിൽ ചുവപ്പ് (pH 3.1 ന് താഴെ), ഇടയ്ക്ക് ഓറഞ്ച്, pH 4.4 ന് മുകളിൽ മഞ്ഞ.',
      universal: 'സാർവത്രിക സൂചകം പല ചായങ്ങളുടെ മിശ്രിതമാണ്. ഓരോ pH നും വേറെ നിറം കാണിക്കുന്നു: ശക്തമായ ആസിഡിൽ ചുവപ്പ്, നിഷ്പക്ഷത്തിൽ പച്ച, ശക്തമായ ബേസിൽ വയലറ്റ്.',
      china_rose: 'ചെമ്പരത്തി ഇതളുകൾ പ്രകൃതിദത്ത സൂചകം നൽകുന്നു: ആസിഡിനെ കടും പിങ്കും ബേസിനെ പച്ചയുമാക്കുന്നു.'
    },
    stories: [{
        title: 'ആന്റാസിഡ് vs ആമാശയ ആസിഡ്',
        emoji: '💊',
        text: 'ഭക്ഷണം ദഹിപ്പിക്കാൻ നമ്മുടെ ആമാശയം ഹൈഡ്രോക്ലോറിക് ആസിഡ് (pH ഏകദേശം 1.2) ഉണ്ടാക്കുന്നു. അമിത ആസിഡ് വേദനയും പുകച്ചിലും (അസിഡിറ്റി) ഉണ്ടാക്കുന്നു. മിൽക്ക് ഓഫ് മഗ്നീഷ്യ, Mg(OH)₂, പോലുള്ള ആന്റാസിഡ് നേരിയ ബേസാണ്: അധിക ആസിഡിനെ നിർവീര്യമാക്കി വേദന മാറ്റുന്നു.',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O',
        before: 1.2,
        after: 4,
        beforeLabel: 'അമിത ആസിഡ്',
        afterLabel: 'ആന്റാസിഡിന് ശേഷം'
      }, {
        title: 'തേനീച്ചക്കുത്ത് vs ബേക്കിംഗ് സോഡ',
        emoji: '🐝',
        text: 'തേനീച്ചക്കുത്ത് ചർമ്മത്തിലേക്ക് മെഥനോയിക് (ഫോർമിക്) ആസിഡ് കുത്തിവയ്ക്കുന്നു, അത് നീറുന്നു. നേരിയ ബേസായ ബേക്കിംഗ് സോഡ കുഴമ്പ് പുരട്ടിയാൽ ആസിഡ് നിർവീര്യമായി ആശ്വാസം കിട്ടും. കടന്നൽക്കുത്ത് ബേസികമാണ്, അതിന് വിനാഗിരി പോലുള്ള നേരിയ ആസിഡ് ഉപയോഗിക്കുന്നു.',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂',
        before: 3,
        after: 7,
        beforeLabel: 'കുത്ത് (ആസിഡ്)',
        afterLabel: 'ബേക്കിംഗ് സോഡയ്ക്ക് ശേഷം'
      }],
    uses: {
      common_salt: {
        name: 'കറിയുപ്പ്',
        made: 'കടൽവെള്ളം ബാഷ്പീകരിച്ച്, അല്ലെങ്കിൽ പാറ ഉപ്പായി കുഴിച്ചെടുത്ത്. ഇത് സോഡിയം ഹൈഡ്രോക്സൈഡ്, ബേക്കിംഗ് സോഡ, അലക്കുസോഡ, ബ്ലീച്ചിംഗ് പൗഡർ എന്നിവയുടെ അസംസ്കൃത വസ്തുവാണ് (ക്ലോർ-ആൽക്കലി പ്രക്രിയ: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂).',
        uses: ['പാചകവും ഭക്ഷണ സംരക്ഷണവും (അച്ചാർ, പപ്പടം)', 'NaOH, ബേക്കിംഗ് സോഡ, അലക്കുസോഡ, ബ്ലീച്ചിംഗ് പൗഡർ നിർമ്മാണം', 'തണുത്ത രാജ്യങ്ങളിൽ റോഡിലെ മഞ്ഞ് നീക്കാൻ']
      },
      washing_soda: {
        name: 'അലക്കുസോഡ',
        made: 'ബേക്കിംഗ് സോഡ ചൂടാക്കിയാൽ സോഡിയം കാർബണേറ്റ്; വെള്ളവുമായി ക്രിസ്റ്റലീകരിച്ചാൽ അലക്കുസോഡ: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O.',
        uses: ['ഗ്ലാസ്, സോപ്പ്, കടലാസ് നിർമ്മാണം', 'വെള്ളത്തിന്റെ സ്ഥിര കാഠിന്യം നീക്കാൻ', 'വീട് വൃത്തിയാക്കാൻ']
      },
      baking_soda: {
        name: 'ബേക്കിംഗ് സോഡ',
        made: 'കറിയുപ്പിൽ നിന്ന്: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃. ചൂടാക്കിയാൽ CO₂ നൽകുന്നു: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂.',
        uses: ['ബേക്കിംഗ് പൗഡർ കേക്കും ബ്രെഡും മൃദുവാക്കുന്നു (CO₂ കുമിളകൾ)', 'അസിഡിറ്റിക്ക് ആന്റാസിഡ്', 'സോഡ-ആസിഡ് അഗ്നിശമനി']
      },
      bleaching_powder: {
        name: 'ബ്ലീച്ചിംഗ് പൗഡർ',
        made: 'ഉണങ്ങിയ നീറ്റുകക്കയിൽ ക്ലോറിൻ വാതകത്തിന്റെ പ്രവർത്തനം: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O.',
        uses: ['പരുത്തി, ലിനൻ, കടലാസ് ബ്ലീച്ചിംഗ്', 'കുടിവെള്ളം അണുവിമുക്തമാക്കാൻ', 'രാസവ്യവസായങ്ങളിൽ ഓക്സീകാരി']
      },
      plaster_of_paris: {
        name: 'പ്ലാസ്റ്റർ ഓഫ് പാരിസ്',
        made: 'ജിപ്സം 373 K (100 °C) വരെ ചൂടാക്കുന്നു: CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O. വെള്ളം ചേർത്താൽ വീണ്ടും കടുപ്പമുള്ള ജിപ്സമാകും.',
        uses: ['ഒടിഞ്ഞ എല്ലുകൾ ശരിയായ സ്ഥാനത്ത് താങ്ങിനിർത്താൻ', 'കളിപ്പാട്ടങ്ങൾ, അലങ്കാര വസ്തുക്കൾ, പ്രതിമകൾ', 'ചുവരും മേൽക്കൂരയും മിനുസപ്പെടുത്താൻ']
      }
    },
    daily: [{
        icon: '🦷',
        title: 'പല്ല് ദ്രവിക്കൽ',
        tag: 'pH 5.5 ന് താഴെ',
        text: 'വായിലെ ബാക്ടീരിയ ബാക്കി പഞ്ചസാരയെ ആസിഡാക്കുന്നു. വായിലെ pH 5.5 ന് താഴെയായാൽ ഇനാമൽ (ശരീരത്തിലെ ഏറ്റവും കടുപ്പമുള്ള പദാർത്ഥം) അലിയാൻ തുടങ്ങുന്നു. ടൂത്ത്പേസ്റ്റ് ബേസികമാണ്, ഈ ആസിഡിനെ നിർവീര്യമാക്കുന്നു, അതിനാൽ ഭക്ഷണശേഷം ബ്രഷ് ചെയ്യൂ.'
      }, {
        icon: '🌧️',
        title: 'ആസിഡ് മഴ',
        tag: 'pH 5.6 ന് താഴെ',
        text: 'വാഹനങ്ങളുടെയും ഫാക്ടറികളുടെയും പുക വായുവിൽ സൾഫർ, നൈട്രജൻ ഓക്സൈഡുകൾ ചേർക്കുന്നു. അവ മഴയിൽ ലയിച്ച് അതിനെ ആസിഡികമാക്കുന്നു. ആസിഡ് മഴ നദിയിലെ മീനുകൾക്ക് ദോഷം ചെയ്യുന്നു, വിളകൾ നശിപ്പിക്കുന്നു, താജ്മഹൽ പോലുള്ള മാർബിൾ കെട്ടിടങ്ങളെ തിന്നുതീർക്കുന്നു.'
      }, {
        icon: '🌱',
        title: 'മണ്ണിന്റെ pH ഉം വിളകളും',
        tag: 'മികച്ചത്: pH 6.5 മുതൽ 7.5',
        text: 'മിക്ക ചെടികളും നിഷ്പക്ഷത്തോട് അടുത്ത മണ്ണിൽ നന്നായി വളരുന്നു. മണ്ണ് അമിതമായി ആസിഡികമെങ്കിൽ കർഷകർ നീറ്റാത്ത കുമ്മായം (CaO), നീറ്റുകക്ക (Ca(OH)₂) അല്ലെങ്കിൽ ചോക്ക് (CaCO₃) ചേർക്കുന്നു. അമിത ബേസികമെങ്കിൽ കമ്പോസ്റ്റ് പോലുള്ള ജൈവവസ്തു ചേർക്കുന്നു.'
      }, {
        icon: '🐝',
        title: 'ആസിഡും ബേസും കൊണ്ട് സ്വയരക്ഷ',
        tag: 'കുത്തുകൾ',
        text: 'തേനീച്ചയുടെയോ ഉറുമ്പിന്റെയോ കുത്ത് മെഥനോയിക് ആസിഡ് കുത്തിവയ്ക്കുന്നു: ബേക്കിംഗ് സോഡ പുരട്ടൂ. ചൊറിയണം ഇലകളും മെഥനോയിക് ആസിഡ് കുത്തിവയ്ക്കുന്നു: അടുത്ത് വളരുന്ന ഡോക്ക് ചെടി ആശ്വാസം നൽകുന്നു. കടന്നൽക്കുത്ത് ബേസികം: വിനാഗിരി ഉപയോഗിക്കൂ.'
      }, {
        icon: '🫃',
        title: 'ദഹനവും അസിഡിറ്റിയും',
        tag: 'ആമാശയം: pH 1.2',
        text: 'ഭക്ഷണം ദഹിപ്പിക്കാൻ ആമാശയം ഹൈഡ്രോക്ലോറിക് ആസിഡ് ഉണ്ടാക്കുന്നു. അമിതമായാൽ പുകച്ചിലും വേദനയും. മിൽക്ക് ഓഫ് മഗ്നീഷ്യ, ബേക്കിംഗ് സോഡ പോലുള്ള ആന്റാസിഡുകൾ അധിക ആസിഡിനെ നിർവീര്യമാക്കുന്ന നേരിയ ബേസുകളാണ്.'
      }, {
        icon: '🩸',
        title: 'നമ്മുടെ ശരീരത്തിന് ഇടുങ്ങിയ പരിധി ഇഷ്ടം',
        tag: 'രക്തം: pH 7.35 മുതൽ 7.45',
        text: 'ജീവകോശങ്ങൾ ഇടുങ്ങിയ pH പരിധിയിൽ മാത്രമേ പ്രവർത്തിക്കൂ. നമ്മുടെ രക്തം 7.4 നോട് വളരെ അടുത്ത് നിൽക്കുന്നു; ചെറിയ മാറ്റം പോലും രോഗമുണ്ടാക്കും. അതുകൊണ്ടാണ് ഗുരുതര രോഗങ്ങളിൽ ഡോക്ടർമാർ രക്തത്തിന്റെ pH പരിശോധിക്കുന്നത്.'
      }],
    quiz: [{
        q: 'നാരങ്ങാനീരിൽ മുക്കിയാൽ നീല ലിറ്റ്മസ് പേപ്പർ ഏത് നിറമാകും?',
        options: ['നീല (മാറ്റമില്ല)', 'ചുവപ്പ്', 'പച്ച', 'മഞ്ഞ'],
        why: 'നാരങ്ങാനീര് ആസിഡികം (pH ഏകദേശം 2). ആസിഡുകൾ നീല ലിറ്റ്മസിനെ ചുവപ്പാക്കുന്നു.'
      }, {
        q: '25 °C ൽ ശുദ്ധജലത്തിന്റെ pH എത്ര?',
        options: ['0', '7', '14', '1'],
        why: 'ശുദ്ധജലം നിഷ്പക്ഷം. H⁺, OH⁻ അയോണുകൾ തുല്യ എണ്ണത്തിൽ, അതിനാൽ pH 7.'
      }, {
        q: 'ഇവയിൽ ഏത് ലായനിയാണ് ഏറ്റവും ആസിഡികം?',
        options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'],
        why: 'pH കുറയുന്തോറും ലായനി കൂടുതൽ ആസിഡികം. pH 3 ൽ pH 6 നേക്കാൾ 1000 മടങ്ങ് H⁺ അയോണുകൾ.'
      }, {
        q: 'pH 4 ലായനിയിൽ pH 5 ലായനിയേക്കാൾ എത്ര മടങ്ങ് H⁺ അയോണുകൾ?',
        options: ['2 മടങ്ങ്', '10 മടങ്ങ്', '100 മടങ്ങ്', 'പകുതി'],
        why: 'pH സ്കെയിലിലെ ഓരോ 1 പടിയും H⁺ ഗാഢതയിൽ 10 മടങ്ങ്. pH 4 → 10⁻⁴ mol/L; pH 5 → 10⁻⁵ mol/L.'
      }, {
        q: 'സോഡിയം ഹൈഡ്രോക്സൈഡ് (NaOH) ലായനിയിൽ ഫിനോൾഫ്തലീൻ ഏത് നിറം?',
        options: ['നിറമില്ലാത്തത്', 'പിങ്ക്', 'മഞ്ഞ', 'ചുവപ്പ്'],
        why: 'ഫിനോൾഫ്തലീൻ ആസിഡിൽ നിറമില്ലാത്തത്, ബേസിൽ പിങ്ക്. NaOH ശക്തമായ ബേസ്.'
      }, {
        q: 'ഷർട്ടിലെ മഞ്ഞൾ കറയിൽ സോപ്പ് ഉരച്ചാൽ ചുവപ്പാകുന്നു. ഇത് സോപ്പ് ___ എന്ന് കാണിക്കുന്നു',
        options: ['ആസിഡികം', 'നിഷ്പക്ഷം', 'ബേസികം', 'ഒരു ലവണം'],
        why: 'മഞ്ഞൾ പ്രകൃതിദത്ത സൂചകം: ആസിഡിലും നിഷ്പക്ഷത്തിലും മഞ്ഞ, ബേസിൽ ചുവപ്പ്. സോപ്പ് ബേസികം.'
      }, {
        q: 'വായിലെ pH എത്രയിൽ താഴെയായാൽ പല്ല് ദ്രവിക്കാൻ തുടങ്ങും?',
        options: ['5.5', '7', '8.5', '2'],
        why: 'പല്ലിന്റെ ഇനാമൽ pH 5.5 ന് താഴെ അലിയാൻ തുടങ്ങുന്നു. ബാക്ടീരിയ ബാക്കി പഞ്ചസാരയിൽ നിന്ന് ഈ ആസിഡ് ഉണ്ടാക്കുന്നു.'
      }, {
        q: 'മഴയുടെ pH എത്രയിൽ താഴെയെങ്കിൽ ആസിഡ് മഴ എന്ന് വിളിക്കും?',
        options: ['7', '5.6', '6.5', '3'],
        why: 'സാധാരണ മഴ ലയിച്ച CO₂ കാരണം നേരിയ ആസിഡികം (ഏകദേശം 5.6). 5.6 ന് താഴെ ആസിഡ് മഴ, സൾഫർ, നൈട്രജൻ ഓക്സൈഡുകൾ കാരണം.'
      }, {
        q: 'മിൽക്ക് ഓഫ് മഗ്നീഷ്യ പോലുള്ള ആന്റാസിഡ് അസിഡിറ്റിക്ക് ആശ്വാസം നൽകുന്നു, കാരണം അത്',
        options: ['ആമാശയത്തിൽ കൂടുതൽ ആസിഡ് ചേർക്കുന്നു', 'ആമാശയത്തിലെ അധിക ആസിഡിനെ നിർവീര്യമാക്കുന്നു', 'ആമാശയം തണുപ്പിക്കുന്നു', 'ആമാശയത്തിൽ നിന്ന് വെള്ളം നീക്കുന്നു'],
        why: 'മിൽക്ക് ഓഫ് മഗ്നീഷ്യ, Mg(OH)₂, നേരിയ ബേസാണ്. ആമാശയത്തിലെ അധിക ഹൈഡ്രോക്ലോറിക് ആസിഡിനെ നിർവീര്യമാക്കുന്നു.'
      }, {
        q: 'തേനീച്ചക്കുത്ത് വേദനിക്കുന്നു, കാരണം അത് ആസിഡ് കുത്തിവയ്ക്കുന്നു. വീട്ടിലെ ഏത് വസ്തു പുരട്ടിയാൽ ആശ്വാസം?',
        options: ['വിനാഗിരി', 'നാരങ്ങാനീര്', 'ബേക്കിംഗ് സോഡ', 'ഉപ്പ്'],
        why: 'കുത്ത് മെഥനോയിക് ആസിഡ് കുത്തിവയ്ക്കുന്നു. ബേക്കിംഗ് സോഡ അതിനെ നിർവീര്യമാക്കുന്ന നേരിയ ബേസ്. വിനാഗിരിയും നാരങ്ങാനീരും ആസിഡുകൾ, സഹായിക്കില്ല.'
      }, {
        q: 'കറിയുപ്പ് (NaCl) ശക്തമായ ആസിഡ് (HCl), ശക്തമായ ബേസ് (NaOH) എന്നിവയിൽ നിന്ന് ഉണ്ടാകുന്നു. വെള്ളത്തിലെ അതിന്റെ ലായനി',
        options: ['ആസിഡികം', 'ബേസികം', 'നിഷ്പക്ഷം', 'ചിലപ്പോൾ ആസിഡികം, ചിലപ്പോൾ ബേസികം'],
        why: 'രണ്ട് രക്ഷിതാക്കളും ശക്തരെങ്കിൽ ആരും ജയിക്കുന്നില്ല: ലവണ ലായനി നിഷ്പക്ഷം, pH 7.'
      }, {
        q: 'അമോണിയം ക്ലോറൈഡ് (NH₄Cl) ലായനി ആസിഡികമാണ്, കാരണം അത് ഉണ്ടായത്',
        options: ['ശക്തമായ ആസിഡും ദുർബല ബേസും ചേർന്ന്', 'ദുർബല ആസിഡും ശക്തമായ ബേസും ചേർന്ന്', 'ശക്തമായ ആസിഡും ശക്തമായ ബേസും ചേർന്ന്', 'ദുർബല ആസിഡും ദുർബല ബേസും ചേർന്ന്'],
        why: 'HCl ശക്തമായ ആസിഡും NH₄OH ദുർബല ബേസും. ശക്തനായ രക്ഷിതാവ് ജയിക്കുന്നു, അതിനാൽ ലവണം ആസിഡികം.'
      }, {
        q: 'HCl + NaOH → ___ + H₂O. വിട്ടുപോയ ഉൽപ്പന്നം',
        options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'],
        why: 'നിർവീര്യമാക്കൽ: ആസിഡ് + ബേസ് → ലവണം + വെള്ളം. ഹൈഡ്രോക്ലോറിക് ആസിഡും സോഡിയം ഹൈഡ്രോക്സൈഡും സോഡിയം ക്ലോറൈഡും (കറിയുപ്പ്) വെള്ളവും നൽകുന്നു.'
      }, {
        q: 'പ്ലാസ്റ്റർ ഓഫ് പാരിസ് എന്ത് ചൂടാക്കിയാണ് ഉണ്ടാക്കുന്നത്?',
        options: ['കറിയുപ്പ്', 'ജിപ്സം', 'ചുണ്ണാമ്പുകല്ല്', 'ബേക്കിംഗ് സോഡ'],
        why: 'ജിപ്സം (CaSO₄·2H₂O) 373 K ൽ ചൂടാക്കിയാൽ വെള്ളം നഷ്ടപ്പെട്ട് പ്ലാസ്റ്റർ ഓഫ് പാരിസ്, CaSO₄·½H₂O, ആകുന്നു.'
      }, {
        q: 'ഒരു ലായനിയിൽ സാർവത്രിക സൂചകം ചേർത്തപ്പോൾ പച്ചയായി. ലായനി',
        options: ['ശക്തമായ ആസിഡികം', 'നിഷ്പക്ഷം (pH ഏകദേശം 7)', 'ശക്തമായ ബേസികം', 'pH 2'],
        why: 'സാർവത്രിക സൂചക ചാർട്ടിൽ പച്ച എന്നാൽ pH 7, നിഷ്പക്ഷം. ചുവപ്പ് ശക്തമായ ആസിഡികം, വയലറ്റ് ശക്തമായ ബേസികം.'
      }]
  },
  ur: {
    facts: {
      hcl: 'لیب کا سخت تیزاب۔ پتلا محلول بھی خطرناک ہے: کبھی نہ چھوئیں نہ چکھیں۔',
      gastric: 'ہمارا معدہ کھانا ہضم کرنے اور جراثیم مارنے کے لیے ہائیڈروکلورک تیزاب بناتا ہے۔',
      lemon: 'سٹرک تیزاب کی وجہ سے کھٹا۔ وٹامن C سے بھرپور۔',
      softdrink: 'اس میں کاربونک اور فاسفورک تیزاب ہوتے ہیں۔ اسی لیے یہ دانتوں کو نقصان پہنچاتی ہے۔',
      vinegar: 'ایسیٹک (ایتھانوئک) تیزاب کا پتلا محلول، اچار میں استعمال ہوتا ہے۔',
      tomato: 'سٹرک اور میلک تیزاب کی وجہ سے ہلکا تیزابی۔',
      curd: 'بیکٹیریا کا بنایا لیکٹک تیزاب دودھ کو کھٹا کر کے دہی جما دیتا ہے۔',
      coffee: 'بغیر دودھ کی بلیک کافی ہلکی تیزابی ہوتی ہے۔',
      tea: 'ٹینک تیزاب چائے کو ہلکا کڑوا، کسیلا ذائقہ دیتا ہے۔',
      rain: 'صاف بارش بھی تھوڑی تیزابی ہوتی ہے کیونکہ ہوا کی CO₂ اس میں حل ہو جاتی ہے۔ 5.6 سے نیچے اسے تیزابی بارش کہتے ہیں۔',
      milk: 'تازہ دودھ بہت ہلکا تیزابی ہوتا ہے۔ کھٹا ہونے پر اس کا pH گرتا ہے۔',
      saliva: 'لعاب تقریباً غیر جانبدار ہوتا ہے۔ میٹھا کھانے کے بعد بیکٹیریا تیزاب بناتے ہیں اور منہ کا pH گر جاتا ہے۔',
      water: 'خالص پانی غیر جانبدار ہے: H⁺ اور OH⁻ آئن برابر تعداد میں۔',
      blood: 'ہمارا خون pH 7.35 سے 7.45 کے درمیان رہتا ہے۔ جسم اسے وہیں رکھنے کے لیے بہت محنت کرتا ہے۔',
      seawater: 'حل شدہ نمکیات اور کاربونیٹ کی وجہ سے ہلکا اساسی۔',
      bakingsoda: 'سوڈیم ہائیڈروجن کاربونیٹ (NaHCO₃)، ایک ہلکی اساس جو کھانا پکانے اور اینٹاسڈ میں کام آتی ہے۔',
      toothpaste: 'اساسی، اس لیے منہ میں بیکٹیریا کے بنائے تیزاب کو بے اثر کرتا ہے۔',
      antacid: 'اینٹاسڈ گولیوں میں ہلکی اساسیں ہوتی ہیں جو معدے کے اضافی تیزاب کو بے اثر کرتی ہیں۔',
      soap: 'صابن تیل اور سخت اساس سے بنتا ہے، اس لیے صابن کا پانی اساسی ہوتا ہے اور چکنا لگتا ہے۔',
      magnesia: 'میگنیشیم ہائیڈروکسائیڈ، Mg(OH)₂، کا معلق، اینٹاسڈ کے طور پر استعمال ہوتا ہے۔',
      ammonia: 'پانی میں حل امونیا اساسی ہوتا ہے اور اس کی بو تیز ہوتی ہے۔ کچھ صفائی کے محلولوں میں استعمال ہوتا ہے۔',
      limewater: 'پانی میں کیلشیم ہائیڈروکسائیڈ، Ca(OH)₂۔ اس میں CO₂ گزارنے پر یہ دودھیا ہو جاتا ہے۔',
      bleach: 'گھریلو بلیچ سخت اساسی اور خورندہ ہے۔ دستانے پہن کر استعمال کریں۔',
      naoh: 'کاسٹک سوڈا: صابن اور کاغذ بنانے میں استعمال ہونے والی سخت اساس۔ بہت خورندہ۔'
    },
    ind_why: {
      blue_litmus: 'لٹمس لائکن سے ملنے والا قدرتی رنگ ہے۔ تیزاب نیلے لٹمس کو سرخ کر دیتے ہیں؛ اساسیں اور غیر جانبدار محلول اسے نیلا ہی رہنے دیتے ہیں۔',
      red_litmus: 'اساسیں سرخ لٹمس کو نیلا کر دیتی ہیں۔ تیزاب اور غیر جانبدار محلول اسے سرخ ہی رہنے دیتے ہیں۔',
      turmeric: 'ہلدی تیزاب اور غیر جانبدار محلول میں پیلی رہتی ہے اور اساس میں سرخ ہو جاتی ہے۔ اسی لیے ہلدی کا داغ صابن لگتے ہی سرخ ہو جاتا ہے۔',
      phenolphthalein: 'فینولفتھیلین تیزاب اور غیر جانبدار محلول میں بے رنگ رہتا ہے اور اساس میں گلابی ہو جاتا ہے (تقریباً pH 8.2 سے)۔',
      methyl_orange: 'میتھائل اورنج سخت تیزاب میں سرخ (pH 3.1 سے نیچے)، درمیان میں نارنجی اور pH 4.4 سے اوپر پیلا ہوتا ہے۔',
      universal: 'عالمگیر اشاریہ کئی رنگوں کا مرکب ہے۔ یہ ہر pH پر الگ رنگ دکھاتا ہے: سخت تیزاب میں سرخ، غیر جانبدار میں سبز، سخت اساس میں بنفشی۔',
      china_rose: 'گڑھل کی پنکھڑیاں قدرتی اشاریہ دیتی ہیں: یہ تیزاب کو گہرا گلابی اور اساس کو سبز کر دیتا ہے۔'
    },
    stories: [{
        title: 'اینٹاسڈ بمقابلہ معدے کا تیزاب',
        emoji: '💊',
        text: 'ہمارا معدہ کھانا ہضم کرنے کے لیے ہائیڈروکلورک تیزاب (pH تقریباً 1.2) بناتا ہے۔ زیادہ تیزاب سے درد اور جلن ہوتی ہے (تیزابیت)۔ ملک آف میگنیشیا، Mg(OH)₂، جیسا اینٹاسڈ ایک ہلکی اساس ہے: یہ اضافی تیزاب کو بے اثر کر دیتا ہے اور درد چلا جاتا ہے۔',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O',
        before: 1.2,
        after: 4,
        beforeLabel: 'بہت زیادہ تیزاب',
        afterLabel: 'اینٹاسڈ کے بعد'
      }, {
        title: 'شہد کی مکھی کا ڈنک بمقابلہ بیکنگ سوڈا',
        emoji: '🐝',
        text: 'شہد کی مکھی کا ڈنک جلد میں میتھانوئک (فارمک) تیزاب چھوڑتا ہے، جس سے جلن ہوتی ہے۔ ہلکی اساس بیکنگ سوڈا کا لیپ ملنے سے تیزاب بے اثر ہو جاتا ہے اور آرام ملتا ہے۔ بھڑ کا ڈنک اساسی ہوتا ہے، اس لیے اس پر لوگ سرکے جیسا ہلکا تیزاب لگاتے ہیں۔',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂',
        before: 3,
        after: 7,
        beforeLabel: 'ڈنک (تیزاب)',
        afterLabel: 'بیکنگ سوڈا کے بعد'
      }],
    uses: {
      common_salt: {
        name: 'عام نمک',
        made: 'سمندر کے پانی کو بخارات بنا کر، یا پتھر کے نمک کے طور پر کھود کر۔ یہ سوڈیم ہائیڈروکسائیڈ، بیکنگ سوڈا، واشنگ سوڈا اور بلیچنگ پاؤڈر کا خام مال ہے (کلور-الکلی عمل: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂)۔',
        uses: ['کھانا پکانے اور محفوظ رکھنے میں (اچار، پاپڑ)', 'NaOH، بیکنگ سوڈا، واشنگ سوڈا اور بلیچنگ پاؤڈر بنانے میں', 'ٹھنڈے ملکوں میں سڑکوں سے برف ہٹانے میں']
      },
      washing_soda: {
        name: 'واشنگ سوڈا',
        made: 'بیکنگ سوڈا کو گرم کرنے پر سوڈیم کاربونیٹ بنتا ہے؛ اسے پانی کے ساتھ قلمیانے پر واشنگ سوڈا ملتا ہے: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O۔',
        uses: ['شیشہ، صابن اور کاغذ بنانے میں', 'پانی کی مستقل سختی دور کرنے میں', 'گھر کی صفائی کے لیے']
      },
      baking_soda: {
        name: 'بیکنگ سوڈا',
        made: 'عام نمک سے: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃۔ گرم کرنے پر یہ CO₂ دیتا ہے: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂۔',
        uses: ['بیکنگ پاؤڈر کیک اور بریڈ کو نرم بناتا ہے (CO₂ کے بلبلے)', 'تیزابیت کے لیے اینٹاسڈ', 'سوڈا-تیزاب آگ بجھانے والے آلات']
      },
      bleaching_powder: {
        name: 'بلیچنگ پاؤڈر',
        made: 'خشک بجھے چونے پر کلورین گیس کا عمل: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O۔',
        uses: ['کپاس، لینن اور کاغذ کی بلیچنگ', 'پینے کے پانی کو جراثیم سے پاک کرنا', 'کیمیائی صنعتوں میں تکسیدی مادہ']
      },
      plaster_of_paris: {
        name: 'پلاسٹر آف پیرس',
        made: 'جپسم کو 373 K (100 °C) تک گرم کیا جاتا ہے: CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O۔ پانی ملانے پر یہ پھر سخت جپسم بن جاتا ہے۔',
        uses: ['ٹوٹی ہڈیوں کو صحیح جگہ سہارا دینا', 'کھلونے، سجاوٹ کی چیزیں اور مجسمے', 'دیواروں اور چھتوں کو ہموار کرنا']
      }
    },
    daily: [{
        icon: '🦷',
        title: 'دانتوں کا سڑنا',
        tag: 'pH 5.5 سے نیچے',
        text: 'منہ کے بیکٹیریا بچی ہوئی چینی کو تیزاب میں بدل دیتے ہیں۔ جب منہ کا pH 5.5 سے نیچے گرتا ہے تو اینامل (جسم کا سخت ترین مادہ) گھلنے لگتا ہے۔ ٹوتھ پیسٹ اساسی ہے اور اس تیزاب کو بے اثر کرتا ہے، اس لیے کھانے کے بعد برش کریں۔'
      }, {
        icon: '🌧️',
        title: 'تیزابی بارش',
        tag: 'pH 5.6 سے نیچے',
        text: 'گاڑیوں اور کارخانوں کا دھواں ہوا میں سلفر اور نائٹروجن کے آکسائیڈ ملاتا ہے۔ یہ بارش میں حل ہو کر اسے تیزابی بنا دیتے ہیں۔ تیزابی بارش دریاؤں کی مچھلیوں کو نقصان پہنچاتی ہے، فصلیں خراب کرتی ہے اور تاج محل جیسی سنگ مرمر کی عمارتوں کو کھا جاتی ہے۔'
      }, {
        icon: '🌱',
        title: 'مٹی کا pH اور فصلیں',
        tag: 'بہترین: pH 6.5 سے 7.5',
        text: 'زیادہ تر پودے غیر جانبدار کے قریب مٹی میں بہترین اگتے ہیں۔ مٹی بہت تیزابی ہو تو کسان ان بجھا چونا (CaO)، بجھا چونا (Ca(OH)₂) یا چاک (CaCO₃) ملاتے ہیں۔ بہت اساسی ہو تو کھاد جیسا نامیاتی مادہ ملاتے ہیں۔'
      }, {
        icon: '🐝',
        title: 'تیزاب اور اساس سے اپنا دفاع',
        tag: 'ڈنک',
        text: 'شہد کی مکھی یا چیونٹی کا ڈنک میتھانوئک تیزاب چھوڑتا ہے: بیکنگ سوڈا ملیں۔ بچھو بوٹی کے پتے بھی میتھانوئک تیزاب چھوڑتے ہیں: پاس ہی اگنے والا ڈاک پودا آرام دیتا ہے۔ بھڑ کا ڈنک اساسی ہوتا ہے: سرکہ لگائیں۔'
      }, {
        icon: '🫃',
        title: 'ہاضمہ اور تیزابیت',
        tag: 'معدہ: pH 1.2',
        text: 'معدہ کھانا ہضم کرنے کے لیے ہائیڈروکلورک تیزاب بناتا ہے۔ جب یہ زیادہ بنے تو جلن اور درد ہوتا ہے۔ ملک آف میگنیشیا یا بیکنگ سوڈا جیسے اینٹاسڈ ہلکی اساسیں ہیں جو اضافی تیزاب کو بے اثر کرتی ہیں۔'
      }, {
        icon: '🩸',
        title: 'ہمارے جسم کو تنگ حد پسند ہے',
        tag: 'خون: pH 7.35 سے 7.45',
        text: 'زندہ خلیے صرف ایک تنگ pH حد میں کام کرتے ہیں۔ ہمارا خون 7.4 کے بہت قریب رہتا ہے؛ ذرا سی تبدیلی بھی ہمیں بیمار کر دیتی ہے۔ اسی لیے سنگین بیماری میں ڈاکٹر خون کا pH جانچتے ہیں۔'
      }],
    quiz: [{
        q: 'لیموں کے رس میں ڈبونے پر نیلا لٹمس کاغذ کس رنگ کا ہو جاتا ہے؟',
        options: ['نیلا (کوئی تبدیلی نہیں)', 'سرخ', 'سبز', 'پیلا'],
        why: 'لیموں کا رس تیزابی ہے (pH تقریباً 2)۔ تیزاب نیلے لٹمس کو سرخ کر دیتے ہیں۔'
      }, {
        q: '25 °C پر خالص پانی کا pH کتنا ہوتا ہے؟',
        options: ['0', '7', '14', '1'],
        why: 'خالص پانی غیر جانبدار ہے۔ اس میں H⁺ اور OH⁻ آئن برابر تعداد میں ہیں، اس لیے pH 7 ہے۔'
      }, {
        q: 'ان میں سے کون سا محلول سب سے زیادہ تیزابی ہے؟',
        options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'],
        why: 'pH جتنا کم، محلول اتنا زیادہ تیزابی۔ pH 3 میں pH 6 سے 1000 گنا زیادہ H⁺ آئن ہیں۔'
      }, {
        q: 'pH 4 کے محلول میں pH 5 کے محلول سے کتنے گنا زیادہ H⁺ آئن ہیں؟',
        options: ['2 گنا', '10 گنا', '100 گنا', 'آدھے'],
        why: 'pH پیمانے پر 1 کا ہر قدم H⁺ ارتکاز میں 10 کا ضرب ہے۔ pH 4 → 10⁻⁴ mol/L؛ pH 5 → 10⁻⁵ mol/L۔'
      }, {
        q: 'سوڈیم ہائیڈروکسائیڈ (NaOH) کے محلول میں فینولفتھیلین کس رنگ کا ہوتا ہے؟',
        options: ['بے رنگ', 'گلابی', 'پیلا', 'سرخ'],
        why: 'فینولفتھیلین تیزاب میں بے رنگ رہتا ہے اور اساس میں گلابی ہو جاتا ہے۔ NaOH سخت اساس ہے۔'
      }, {
        q: 'قمیض پر ہلدی کا داغ صابن رگڑنے پر سرخ ہو جاتا ہے۔ اس سے پتا چلتا ہے کہ صابن',
        options: ['تیزابی ہے', 'غیر جانبدار ہے', 'اساسی ہے', 'ایک نمک ہے'],
        why: 'ہلدی قدرتی اشاریہ ہے: تیزاب اور غیر جانبدار محلول میں پیلی رہتی ہے مگر اساس میں سرخ ہو جاتی ہے۔ صابن اساسی ہے۔'
      }, {
        q: 'دانتوں کا سڑنا تب شروع ہوتا ہے جب منہ کا pH اس سے نیچے گر جائے:',
        options: ['5.5', '7', '8.5', '2'],
        why: 'دانتوں کا اینامل pH 5.5 سے نیچے گھلنے لگتا ہے۔ بیکٹیریا بچی ہوئی چینی سے یہ تیزاب بناتے ہیں۔'
      }, {
        q: 'بارش کو تیزابی بارش تب کہتے ہیں جب اس کا pH اس سے کم ہو:',
        options: ['7', '5.6', '6.5', '3'],
        why: 'عام بارش حل شدہ CO₂ کی وجہ سے ہلکی تیزابی (تقریباً 5.6) ہوتی ہے۔ 5.6 سے نیچے وہ تیزابی بارش ہے، جو سلفر اور نائٹروجن کے آکسائیڈ سے ہوتی ہے۔'
      }, {
        q: 'ملک آف میگنیشیا جیسا اینٹاسڈ تیزابیت میں آرام دیتا ہے کیونکہ یہ',
        options: ['معدے میں اور تیزاب ملاتا ہے', 'معدے کے اضافی تیزاب کو بے اثر کرتا ہے', 'معدے کو ٹھنڈا کرتا ہے', 'معدے سے پانی نکالتا ہے'],
        why: 'ملک آف میگنیشیا، Mg(OH)₂، ایک ہلکی اساس ہے۔ یہ معدے کے اضافی ہائیڈروکلورک تیزاب کو بے اثر کرتا ہے۔'
      }, {
        q: 'شہد کی مکھی کا ڈنک اس لیے دکھتا ہے کہ وہ تیزاب چھوڑتا ہے۔ گھر کی کون سی چیز ڈنک پر ملنے سے آرام ملتا ہے؟',
        options: ['سرکہ', 'لیموں کا رس', 'بیکنگ سوڈا', 'نمک'],
        why: 'ڈنک میتھانوئک تیزاب چھوڑتا ہے۔ بیکنگ سوڈا ہلکی اساس ہے جو اسے بے اثر کرتی ہے۔ سرکہ اور لیموں کا رس تیزاب ہیں اور مدد نہیں کریں گے۔'
      }, {
        q: 'عام نمک (NaCl) سخت تیزاب (HCl) اور سخت اساس (NaOH) سے بنتا ہے۔ پانی میں اس کا محلول ہوتا ہے',
        options: ['تیزابی', 'اساسی', 'غیر جانبدار', 'کبھی تیزابی، کبھی اساسی'],
        why: 'جب دونوں والدین مضبوط ہوں تو کوئی نہیں جیتتا: نمک کا محلول غیر جانبدار ہے، pH 7۔'
      }, {
        q: 'امونیم کلورائیڈ (NH₄Cl) کا محلول تیزابی ہے کیونکہ یہ بنتا ہے',
        options: ['سخت تیزاب اور کمزور اساس سے', 'کمزور تیزاب اور سخت اساس سے', 'سخت تیزاب اور سخت اساس سے', 'کمزور تیزاب اور کمزور اساس سے'],
        why: 'HCl سخت تیزاب ہے اور NH₄OH کمزور اساس۔ مضبوط والدین جیتتے ہیں، اس لیے نمک تیزابی ہے۔'
      }, {
        q: 'HCl + NaOH → ___ + H₂O۔ خالی جگہ کی پیداوار ہے',
        options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'],
        why: 'بے اثر کرنا: تیزاب + اساس → نمک + پانی۔ ہائیڈروکلورک تیزاب اور سوڈیم ہائیڈروکسائیڈ سے سوڈیم کلورائیڈ (عام نمک) اور پانی بنتے ہیں۔'
      }, {
        q: 'پلاسٹر آف پیرس کسے گرم کر کے بنایا جاتا ہے؟',
        options: ['عام نمک', 'جپسم', 'چونے کا پتھر', 'بیکنگ سوڈا'],
        why: 'جپسم (CaSO₄·2H₂O) کو 373 K پر گرم کرنے سے پانی نکل جاتا ہے اور پلاسٹر آف پیرس، CaSO₄·½H₂O، بنتا ہے۔'
      }, {
        q: 'کسی محلول میں عالمگیر اشاریہ ڈالنے پر وہ سبز ہو گیا۔ محلول ہے',
        options: ['سخت تیزابی', 'غیر جانبدار (pH تقریباً 7)', 'سخت اساسی', 'pH 2'],
        why: 'عالمگیر اشاریے کے چارٹ میں سبز کا مطلب pH 7، غیر جانبدار۔ سرخ کا مطلب سخت تیزابی اور بنفشی کا مطلب سخت اساسی۔'
      }]
  }
};
