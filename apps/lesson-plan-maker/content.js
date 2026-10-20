/* Localized content for Lesson Plan Maker: Bloom's verbs, quick materials, student activity ideas and six short
   sample plans. Same shape in all 12 languages (verify.js checks it).
   sample: { subjectKey, cls, subject, topic, period, duration, outcomes[], prev, materials[], comp[], intro,
             steps[[teacher, student, minutes]], recap, assess, hw, e5{phase: [activity, minutes, materials]},
             support, extension, week[[topic, homework] x 6 days] } */
window.APP_CONTENT = {
  en: {
    bloom: {
      remember: ['define', 'list', 'name', 'recall', 'label', 'state'],
      understand: ['explain', 'describe', 'summarise', 'classify', 'compare', 'give examples of'],
      apply: ['use', 'solve', 'calculate', 'demonstrate', 'show', 'measure'],
      analyse: ['analyse', 'differentiate', 'find the pattern in', 'examine', 'sort', 'infer'],
      evaluate: ['judge', 'justify', 'decide', 'check', 'argue for', 'rate'],
      create: ['design', 'make', 'plan', 'compose', 'build', 'invent']
    },
    materials: ['Blackboard & chalk', 'Textbook', 'Chart or poster', 'Flashcards', 'Worksheet', 'Projector or smartboard', 'Real objects', 'Notebook & pencil'],
    ideas: {
      maths: ['Make it with paper: fold or cut shapes to show the idea', 'Think-pair-share on one tricky question', 'Maths relay: each group member solves one step on the board', 'Estimate first, then measure and compare', 'Find this maths in the market or kitchen and bring one example'],
      science: ['Predict, observe, explain with a quick demo', 'Draw and label from a real object', 'Group experiment with a shared result table', 'Sort cards into groups and explain the rule', 'One-minute "science reporter" from each group'],
      english: ['Read aloud in pairs and swap roles', 'Act the scene in groups of four', 'Word hunt: find five new words and guess the meaning', 'Write three lines in your own words', 'Hot seat: one student answers as a character'],
      social: ['Timeline on the floor with chalk', 'Map work: mark five places', 'Role play: one day in that time', 'Compare then and now in a T-chart', 'Local link: ask an elder at home and report'],
      language: ['Story circle: each student adds one line', 'Picture talk: describe in three sentences', 'Find rhyming words and make a chant', 'Dictation in pairs; check each other', 'Retell the story with hand puppets'],
      ai: ['Spot the AI: list five apps that use AI', 'Human or machine: sort the tasks', 'Pattern game: guess the rule from examples', 'Write a simple chatbot script on paper', 'Debate: is AI always right?'],
      general: ['Think-pair-share: one minute alone, two minutes in pairs', 'Exit slip: one thing I learnt, one question I have', 'Gallery walk: groups put their work on the wall', 'Team quiz with slates', 'Peer teaching: explain it to your partner']
    },
    samples: {
      fractions: {
        subjectKey: 'maths', cls: '6', subject: 'Mathematics', topic: 'Fractions: equivalent fractions', period: 3, duration: 40,
        outcomes: ['explain what an equivalent fraction is', 'make equivalent fractions by multiplying or dividing', 'check whether two fractions are equivalent'],
        prev: 'Students can read and write fractions like 1/2 and 3/4 and shade them on a shape.',
        materials: ['Paper strips', 'Blackboard & chalk', 'Fraction chart'], comp: ['critical', 'collab'],
        intro: 'Show a roti cut into 2 equal parts and another cut into 4. Ask: is 1/2 the same as 2/4?',
        steps: [
          ['Fold a paper strip into halves, then quarters; show 1/2 = 2/4 on the board.', 'Fold their own strips, shade 1/2 and 2/4 and compare in pairs.', 10],
          ['Explain the rule: multiply or divide the top and bottom by the same number. Work two examples.', 'Make three equivalent fractions of 2/3 in notebooks.', 15],
          ['Give pairs of fractions; ask which are equivalent and how we know.', 'Check by cross-multiplying; answer yes or no with a reason.', 10]
        ],
        recap: 'Three quick questions on the board: equivalent or not? Students answer with thumbs up or down.',
        assess: 'Exit slip: write two equivalent fractions of 3/5.', hw: 'NCERT Exercise 7.3, questions 1 to 4.',
        e5: { engage: ['Roti puzzle: is 1/2 the same as 2/4? Vote and give a reason.', 5, 'Two paper rotis'], explore: ['In pairs, fold strips to find fractions equal to 1/2.', 10, 'Paper strips'], explain: ['The rule: multiply or divide the top and bottom by the same number.', 10, 'Blackboard'], elaborate: ['Find equivalent fractions on a fraction chart and describe the pattern.', 10, 'Fraction chart'], evaluate: ['Exit slip: two equivalent fractions of 3/5.', 5, 'Slips of paper'] },
        support: 'Give ready-made fraction strips; work with halves and quarters only.', extension: 'Find three fractions between 1/2 and 1 and prove they are in order.',
        week: [['Fractions on a number line', 'Ex 7.1 Q1–3'], ['Proper and improper fractions', 'Ex 7.2 Q1–2'], ['Equivalent fractions', 'Ex 7.3 Q1–4'], ['Simplest form', 'Ex 7.3 Q5–7'], ['Comparing fractions', 'Ex 7.4 Q1–3'], ['Practice and quiz', 'Revise the chapter']]
      },
      cell: {
        subjectKey: 'science', cls: '8', subject: 'Science', topic: 'Cell: structure and functions', period: 2, duration: 40,
        outcomes: ['name the main parts of a cell', 'compare a plant cell with an animal cell', 'explain why the cell is called the basic unit of life'],
        prev: 'Students know that living things are made of tiny parts and have used a hand lens.',
        materials: ['Onion peel and slide', 'Microscope or cell chart', 'Coloured pencils'], comp: ['critical', 'comm'],
        intro: 'Show a photo of a brick wall and an onion peel under a microscope. Ask: what are living things made of?',
        steps: [
          ['Show the onion peel slide or chart; point out the cell wall, nucleus and cytoplasm.', 'Observe and draw what they see; label two parts.', 12],
          ['Compare plant and animal cells with a Venn diagram on the board.', 'Fill the Venn diagram in pairs: wall, chloroplast, vacuole, nucleus.', 13],
          ['Explain the cell parts and their jobs with a "city" comparison.', 'Match part cards to their functions.', 10]
        ],
        recap: 'Rapid fire: name the part that controls the cell; the part only plants have.',
        assess: 'Draw and label a plant cell with five parts.', hw: 'NCERT Chapter 8, questions 1 to 5.',
        e5: { engage: ['Brick wall or onion peel: what are living things made of?', 5, 'Photo, onion peel'], explore: ['Observe the onion peel slide in groups and draw it.', 12, 'Microscope or chart'], explain: ['Parts of the cell and their jobs; plant cell and animal cell.', 10, 'Blackboard, cell chart'], elaborate: ['Build a cell model with clay or paper.', 8, 'Clay, paper'], evaluate: ['Label a blank cell diagram.', 5, 'Worksheet'] },
        support: 'Give a labelled diagram to copy; ask for three parts instead of five.', extension: 'Find out what a leaf cell has that a cheek cell does not, and why.',
        week: [['Discovery of the cell; the microscope', 'Read 8.1'], ['Cell shape and size', 'Draw three cells'], ['Parts of the cell', 'Q1–3'], ['Plant cell and animal cell', 'Venn diagram'], ['Onion peel practical', 'Lab record'], ['Revision and quiz', 'Revise the chapter']]
      },
      poem: {
        subjectKey: 'english', cls: '5', subject: 'English', topic: 'Poem: My Shadow', period: 4, duration: 35,
        outcomes: ['read the poem aloud with rhythm', 'find rhyming words and say what the shadow does', 'write four lines about their own shadow'],
        prev: 'Students have seen their shadow in the sun and know rhyming words like sun and fun.',
        materials: ['Textbook', 'Torch', 'Chart with the poem'], comp: ['creativity', 'comm'],
        intro: 'Switch on a torch in a dim corner and make hand shadows. Ask: when does your shadow grow tall?',
        steps: [
          ['Read the poem aloud twice with actions; explain hard words.', 'Listen, then read in chorus and act the lines.', 12],
          ['Ask: what does the shadow do that the child does? Find rhyming pairs.', 'Underline rhyming words in pairs; share one pair each.', 13],
          ['Write four model lines about my own shadow on the board.', 'Write four lines about their shadow and read them to a partner.', 10]
        ],
        recap: 'The class recites the first stanza together; one group mimes it.',
        assess: 'Oral: three questions on the poem; check the four lines written.', hw: 'Learn the first stanza by heart; draw your shadow at noon and at 5 pm.',
        e5: { engage: ['Hand shadows with a torch: what makes a shadow?', 5, 'Torch'], explore: ['Read the poem in pairs and mark the words you do not know.', 8, 'Textbook'], explain: ['Meaning of each stanza; rhyming words; rhythm.', 10, 'Poem chart'], elaborate: ['Write four lines about your own shadow.', 8, 'Notebook'], evaluate: ['Recite one stanza; answer two questions.', 4, 'Poem chart'] },
        support: 'Read with a buddy; give a word bank for the four lines.', extension: 'Find out why a shadow is short at noon and long in the evening.',
        week: [['Poem: read and enjoy', 'Read aloud at home'], ['New words and rhymes', 'Write five rhyming pairs'], ['Comprehension questions', 'Q1–4'], ['Writing: my shadow', 'Finish the four lines'], ['Grammar: nouns in the poem', 'Worksheet'], ['Recitation and fun', 'Learn stanza 1']]
      },
      medieval: {
        subjectKey: 'social', cls: '7', subject: 'Social Science', topic: 'Tracing changes through a thousand years', period: 5, duration: 40,
        outcomes: ['explain how the meaning of the word "Hindustan" changed over time', 'read a historical map and compare it with a modern one', 'list the sources historians use for the medieval period'],
        prev: 'Students know the ancient period from Class 6 and can read a map of India.',
        materials: ['Two maps: al-Idrisi (1154) and a modern map', 'Textbook', 'Atlas'], comp: ['critical', 'comm'],
        intro: 'Show the 1154 map by al-Idrisi upside down. Ask: can you find South India?',
        steps: [
          ['Compare the two maps: names, shapes, what is missing.', 'Spot three differences in pairs and say why maps change.', 12],
          ['Explain how words change: Hindustan for Minhaj-i-Siraj, Babur and Amir Khusrau.', 'Make a timeline of the three meanings in notebooks.', 13],
          ['Sources: manuscripts, coins, inscriptions, buildings; why copying changed texts.', 'Sort source cards into written and material sources.', 10]
        ],
        recap: 'Quick quiz: who used "Hindustan" for Punjab, Haryana and the Ganga–Yamuna area?',
        assess: 'Write two reasons why the meaning of a place name can change.', hw: 'NCERT Chapter 1, "Let\'s recall" questions 1 to 3.',
        e5: { engage: ['An upside-down map from 1154: what do you see?', 5, 'Map print'], explore: ['Compare the old and new maps in groups.', 10, 'Two maps'], explain: ['Changing names and meanings; sources for the period.', 12, 'Textbook, blackboard'], elaborate: ['Draw a timeline of the word "Hindustan".', 8, 'Notebook'], evaluate: ['Two reasons why place names change meaning.', 5, 'Slips of paper'] },
        support: 'Give a map with the names already marked; ask for one difference.', extension: 'Find out what your town or state was called 500 years ago.',
        week: [['Old maps and new maps', 'Read 1.1'], ['New and old words: Hindustan', 'Timeline'], ['Historians and their sources', 'Q1–3'], ['New social and political groups', 'Read 1.3'], ['Region and empire; old and new religions', 'Short notes'], ['Revision and map work', 'Mark five places']]
      },
      story: {
        subjectKey: 'language', cls: '4', subject: 'Hindi', topic: 'Story: The thirsty crow', period: 1, duration: 35,
        outcomes: ['retell the story in the right order', 'tell the meaning of five new words', 'say what the crow did and why it worked'],
        prev: 'Students can read short sentences and have heard folk tales at home.',
        materials: ['Picture cards of the story', 'A jar, water and pebbles', 'Textbook'], comp: ['critical', 'creativity', 'comm'],
        intro: 'Show a jar with a little water and a stone. Ask: how can a bird drink this water?',
        steps: [
          ['Tell the story with picture cards and voice changes.', 'Listen; guess what happens next at two points.', 10],
          ['Read the story aloud; explain new words with actions.', 'Read in pairs; underline new words; make sentences with two of them.', 15],
          ['Do the pebble experiment with the jar.', 'Drop pebbles one by one, watch the water rise and say why it works.', 10]
        ],
        recap: 'Arrange the picture cards in order on the board.',
        assess: 'Retell the story in five sentences to a partner.', hw: 'Draw the crow and the jar; write three sentences.',
        e5: { engage: ['Jar with a little water: how can a bird drink it?', 5, 'Jar, water'], explore: ['Try with pebbles in groups: does the water rise?', 8, 'Jar, pebbles'], explain: ['Read the story; new words and the lesson of the story.', 10, 'Textbook, picture cards'], elaborate: ['Act the story in groups of three.', 8, 'Picture cards'], evaluate: ['Retell the story in five sentences.', 4, 'Picture cards'] },
        support: 'Give the picture cards in order; retell with them.', extension: 'Change the ending: what if there were no pebbles?',
        week: [['Listen to the story', 'Tell it at home'], ['Read it; new words', 'Five words, five sentences'], ['The pebble experiment and why it works', 'Draw it'], ['Act the story', 'Practise your lines'], ['Write your own ending', 'Finish the ending'], ['Revision and reading aloud', 'Read page 1 aloud']]
      },
      ai: {
        subjectKey: 'ai', cls: '9', subject: 'Artificial Intelligence', topic: 'What is AI?', period: 6, duration: 40,
        outcomes: ['tell the difference between a machine that follows fixed rules and one that learns from data', 'list five uses of AI in daily life', 'discuss one benefit and one risk of AI'],
        prev: 'Students use smartphones, maps, voice assistants and video apps.',
        materials: ['Projector or phone', 'Cards with daily tasks', 'Chart paper'], comp: ['critical', 'digital', 'comm'],
        intro: 'Ask: how does your phone unlock with your face? How does a video app know what you like?',
        steps: [
          ['Define AI in simple words: machines that learn patterns from data to make decisions.', 'Give two examples each from their own phones.', 10],
          ['Sort tasks: calculator (fixed rules) and spam filter (learning). Explain data, pattern, prediction.', 'Sort task cards into "fixed rules" and "learns from data" in groups.', 15],
          ['Discuss benefits and risks: help in farming and health; bias, privacy, fake videos.', 'One benefit and one risk per group on chart paper.', 10]
        ],
        recap: 'Three statements: AI or not AI? Thumbs up or down.',
        assess: 'Write five uses of AI you saw this week and one risk.', hw: 'Ask a family member which app they trust most and why; note whether it uses AI.',
        e5: { engage: ['How does your phone unlock with your face?', 5, 'Phone'], explore: ['Sort task cards: fixed rules or learning?', 10, 'Task cards'], explain: ['What AI is: data, patterns, predictions; where it is used.', 12, 'Projector'], elaborate: ['Design a simple AI helper for your school on paper.', 8, 'Chart paper'], evaluate: ['Five uses of AI and one risk.', 5, 'Notebook'] },
        support: 'Give the examples ready; students only sort them.', extension: 'Find one example where an AI made a wrong decision and explain why.',
        week: [['What is intelligence? Human and machine', 'List five smart things you did today'], ['What is AI? Rules or learning', 'Sort ten tasks'], ['AI around us', 'Five uses of AI'], ['Data, patterns and predictions', 'Pattern worksheet'], ['Benefits and risks of AI', 'One-page note'], ['Project: an AI helper for our school', 'Poster']]
      }
    }
  },
  hi: {
    bloom: {
      remember: ['परिभाषित करना', 'सूची बनाना', 'नाम बताना', 'याद करके बताना', 'नामांकित करना', 'कथन करना'],
      understand: ['समझाना', 'वर्णन करना', 'सार बताना', 'वर्गीकृत करना', 'तुलना करना', 'उदाहरण देना'],
      apply: ['प्रयोग करना', 'हल करना', 'गणना करना', 'करके दिखाना', 'प्रदर्शित करना', 'मापना'],
      analyse: ['विश्लेषण करना', 'अंतर बताना', 'पैटर्न खोजना', 'परखना', 'छाँटना', 'निष्कर्ष निकालना'],
      evaluate: ['परखकर राय देना', 'औचित्य बताना', 'निर्णय लेना', 'जाँचना', 'पक्ष में तर्क देना', 'आँकना'],
      create: ['डिज़ाइन करना', 'बनाना', 'योजना बनाना', 'रचना करना', 'निर्माण करना', 'आविष्कार करना']
    },
    materials: ['श्यामपट्ट और चॉक', 'पाठ्यपुस्तक', 'चार्ट या पोस्टर', 'फ़्लैशकार्ड', 'वर्कशीट', 'प्रोजेक्टर या स्मार्टबोर्ड', 'असली वस्तुएँ', 'कॉपी और पेंसिल'],
    ideas: {
      maths: ['काग़ज़ से बनाइए: मोड़कर या काटकर आकृति से अवधारणा दिखाएँ', 'एक कठिन प्रश्न पर सोचो-जोड़ी बनाओ-साझा करो', 'गणित रिले: समूह का हर सदस्य बोर्ड पर एक चरण हल करे', 'पहले अनुमान लगाएँ, फिर मापकर मिलाएँ', 'यह गणित बाज़ार या रसोई में खोजें और एक उदाहरण लाएँ'],
      science: ['छोटे प्रदर्शन के साथ अनुमान-अवलोकन-व्याख्या', 'असली वस्तु देखकर चित्र बनाएँ और नाम लिखें', 'समूह प्रयोग, साझा परिणाम तालिका के साथ', 'कार्ड समूहों में छाँटें और नियम समझाएँ', 'हर समूह से एक मिनट का "विज्ञान रिपोर्टर"'],
      english: ['जोड़ी में ज़ोर से पढ़ें और भूमिका बदलें', 'चार के समूह में दृश्य का अभिनय करें', 'शब्द खोज: पाँच नए शब्द खोजकर अर्थ का अनुमान लगाएँ', 'अपने शब्दों में तीन पंक्तियाँ लिखें', 'हॉट सीट: एक विद्यार्थी पात्र बनकर उत्तर दे'],
      social: ['फ़र्श पर चॉक से समय-रेखा बनाएँ', 'मानचित्र कार्य: पाँच स्थान चिह्नित करें', 'भूमिका-अभिनय: उस समय का एक दिन', 'तब और अब की तुलना T-चार्ट में', 'स्थानीय जुड़ाव: घर के किसी बुज़ुर्ग से पूछकर बताएँ'],
      language: ['कहानी-चक्र: हर विद्यार्थी एक पंक्ति जोड़े', 'चित्र-चर्चा: तीन वाक्यों में वर्णन करें', 'तुकांत शब्द खोजकर एक गान बनाएँ', 'जोड़ी में श्रुतलेख; एक-दूसरे का जाँचें', 'हाथ की कठपुतली से कहानी दोबारा सुनाएँ'],
      ai: ['AI पहचानो: AI वाले पाँच ऐप की सूची बनाएँ', 'इंसान या मशीन: कामों को छाँटें', 'पैटर्न खेल: उदाहरणों से नियम का अनुमान लगाएँ', 'काग़ज़ पर एक सरल चैटबॉट की स्क्रिप्ट लिखें', 'बहस: क्या AI हमेशा सही होता है?'],
      general: ['सोचो-जोड़ी बनाओ-साझा करो: एक मिनट अकेले, दो मिनट जोड़ी में', 'एग्ज़िट स्लिप: एक बात जो सीखी, एक प्रश्न जो बचा', 'गैलरी वॉक: समूह अपना काम दीवार पर लगाएँ', 'स्लेट के साथ टीम प्रश्नोत्तरी', 'सहपाठी शिक्षण: अपने साथी को समझाएँ']
    },
    samples: {
      fractions: {
        subjectKey: 'maths', cls: '6', subject: 'गणित', topic: 'भिन्न: समतुल्य भिन्न', period: 3, duration: 40,
        outcomes: ['समतुल्य भिन्न क्या है, समझा सकेंगे', 'गुणा या भाग करके समतुल्य भिन्न बना सकेंगे', 'जाँच सकेंगे कि दो भिन्न समतुल्य हैं या नहीं'],
        prev: 'विद्यार्थी 1/2 और 3/4 जैसी भिन्न पढ़-लिख लेते हैं और आकृति में छायांकित कर लेते हैं।',
        materials: ['काग़ज़ की पट्टियाँ', 'श्यामपट्ट और चॉक', 'भिन्न चार्ट'], comp: ['critical', 'collab'],
        intro: '2 बराबर टुकड़ों में कटी रोटी और 4 टुकड़ों में कटी रोटी दिखाएँ। पूछें: क्या 1/2 और 2/4 बराबर हैं?',
        steps: [
          ['काग़ज़ की पट्टी को आधे, फिर चौथाई में मोड़ें; बोर्ड पर 1/2 = 2/4 दिखाएँ।', 'अपनी पट्टियाँ मोड़ें, 1/2 और 2/4 छायांकित करें और जोड़ी में मिलाएँ।', 10],
          ['नियम समझाएँ: अंश और हर को एक ही संख्या से गुणा या भाग करें। दो उदाहरण हल करें।', 'कॉपी में 2/3 की तीन समतुल्य भिन्न बनाएँ।', 15],
          ['भिन्नों के जोड़े दें; पूछें कौन-से समतुल्य हैं और कैसे पता चला।', 'तिरछा गुणा करके जाँचें; कारण सहित हाँ या नहीं बताएँ।', 10]
        ],
        recap: 'बोर्ड पर तीन झटपट प्रश्न: समतुल्य हैं या नहीं? विद्यार्थी अँगूठा ऊपर या नीचे करके उत्तर दें।',
        assess: 'एग्ज़िट स्लिप: 3/5 की दो समतुल्य भिन्न लिखो।', hw: 'NCERT प्रश्नावली 7.3, प्रश्न 1 से 4।',
        e5: { engage: ['रोटी पहेली: क्या 1/2 और 2/4 बराबर हैं? वोट करें और कारण बताएँ।', 5, 'काग़ज़ की दो रोटियाँ'], explore: ['जोड़ी में पट्टियाँ मोड़कर 1/2 के बराबर भिन्न खोजें।', 10, 'काग़ज़ की पट्टियाँ'], explain: ['नियम: अंश और हर को एक ही संख्या से गुणा या भाग करें।', 10, 'श्यामपट्ट'], elaborate: ['भिन्न चार्ट पर समतुल्य भिन्न खोजें और पैटर्न बताएँ।', 10, 'भिन्न चार्ट'], evaluate: ['एग्ज़िट स्लिप: 3/5 की दो समतुल्य भिन्न।', 5, 'काग़ज़ की पर्चियाँ'] },
        support: 'बनी-बनाई भिन्न-पट्टियाँ दें; सिर्फ़ आधे और चौथाई पर काम करें।', extension: '1/2 और 1 के बीच की तीन भिन्न खोजो और सिद्ध करो कि वे क्रम में हैं।',
        week: [['संख्या रेखा पर भिन्न', 'प्रश्नावली 7.1 प्र. 1–3'], ['उचित और विषम भिन्न', 'प्रश्नावली 7.2 प्र. 1–2'], ['समतुल्य भिन्न', 'प्रश्नावली 7.3 प्र. 1–4'], ['सरलतम रूप', 'प्रश्नावली 7.3 प्र. 5–7'], ['भिन्नों की तुलना', 'प्रश्नावली 7.4 प्र. 1–3'], ['अभ्यास और प्रश्नोत्तरी', 'अध्याय दोहराएँ']]
      },
      cell: {
        subjectKey: 'science', cls: '8', subject: 'विज्ञान', topic: 'कोशिका: संरचना और कार्य', period: 2, duration: 40,
        outcomes: ['कोशिका के मुख्य भागों के नाम बता सकेंगे', 'पादप कोशिका और जंतु कोशिका की तुलना कर सकेंगे', 'समझा सकेंगे कि कोशिका को जीवन की मूल इकाई क्यों कहते हैं'],
        prev: 'विद्यार्थी जानते हैं कि सजीव छोटे-छोटे भागों से बने हैं और उन्होंने हैंड लेंस का उपयोग किया है।',
        materials: ['प्याज़ की झिल्ली और स्लाइड', 'सूक्ष्मदर्शी या कोशिका चार्ट', 'रंगीन पेंसिलें'], comp: ['critical', 'comm'],
        intro: 'ईंटों की दीवार का चित्र और सूक्ष्मदर्शी में प्याज़ की झिल्ली दिखाएँ। पूछें: सजीव किससे बने हैं?',
        steps: [
          ['प्याज़ की झिल्ली की स्लाइड या चार्ट दिखाएँ; कोशिका भित्ति, केंद्रक और कोशिका द्रव्य बताएँ।', 'देखें और जो दिखे उसका चित्र बनाएँ; दो भागों के नाम लिखें।', 12],
          ['बोर्ड पर वेन आरेख से पादप और जंतु कोशिका की तुलना करें।', 'जोड़ी में वेन आरेख भरें: भित्ति, हरितलवक, रसधानी, केंद्रक।', 13],
          ['"शहर" की तुलना से कोशिका के भाग और उनके काम समझाएँ।', 'भागों के कार्ड को उनके कार्यों से मिलाएँ।', 10]
        ],
        recap: 'रैपिड फ़ायर: कोशिका को नियंत्रित करने वाला भाग; सिर्फ़ पौधों में पाया जाने वाला भाग।',
        assess: 'पादप कोशिका का चित्र बनाकर पाँच भागों के नाम लिखो।', hw: 'NCERT अध्याय 8, प्रश्न 1 से 5।',
        e5: { engage: ['ईंटों की दीवार या प्याज़ की झिल्ली: सजीव किससे बने हैं?', 5, 'चित्र, प्याज़ की झिल्ली'], explore: ['समूह में प्याज़ की झिल्ली की स्लाइड देखें और चित्र बनाएँ।', 12, 'सूक्ष्मदर्शी या चार्ट'], explain: ['कोशिका के भाग और उनके काम; पादप और जंतु कोशिका।', 10, 'श्यामपट्ट, कोशिका चार्ट'], elaborate: ['मिट्टी या काग़ज़ से कोशिका का मॉडल बनाएँ।', 8, 'मिट्टी, काग़ज़'], evaluate: ['खाली कोशिका चित्र में नाम लिखें।', 5, 'वर्कशीट'] },
        support: 'नकल करने के लिए नामांकित चित्र दें; पाँच की जगह तीन भाग पूछें।', extension: 'पता लगाओ कि पत्ती की कोशिका में ऐसा क्या है जो गाल की कोशिका में नहीं, और क्यों।',
        week: [['कोशिका की खोज; सूक्ष्मदर्शी', 'पाठ 8.1 पढ़ें'], ['कोशिका का आकार और माप', 'तीन कोशिकाओं के चित्र'], ['कोशिका के भाग', 'प्र. 1–3'], ['पादप और जंतु कोशिका', 'वेन आरेख'], ['प्याज़ की झिल्ली का प्रयोग', 'प्रयोग रिकॉर्ड'], ['दोहराव और प्रश्नोत्तरी', 'अध्याय दोहराएँ']]
      },
      poem: {
        subjectKey: 'english', cls: '5', subject: 'अंग्रेज़ी', topic: 'कविता: My Shadow', period: 4, duration: 35,
        outcomes: ['कविता को लय के साथ ज़ोर से पढ़ सकेंगे', 'तुकांत शब्द खोजकर बता सकेंगे कि परछाईं क्या करती है', 'अपनी परछाईं पर चार पंक्तियाँ लिख सकेंगे'],
        prev: 'विद्यार्थियों ने धूप में अपनी परछाईं देखी है और sun, fun जैसे तुकांत शब्द जानते हैं।',
        materials: ['पाठ्यपुस्तक', 'टॉर्च', 'कविता का चार्ट'], comp: ['creativity', 'comm'],
        intro: 'अँधेरे कोने में टॉर्च जलाकर हाथों से परछाइयाँ बनाएँ। पूछें: तुम्हारी परछाईं कब लंबी हो जाती है?',
        steps: [
          ['कविता को हाव-भाव के साथ दो बार ज़ोर से पढ़ें; कठिन शब्द समझाएँ।', 'सुनें, फिर सब साथ पढ़ें और पंक्तियों का अभिनय करें।', 12],
          ['पूछें: परछाईं वह क्या करती है जो बच्चा करता है? तुकांत जोड़े खोजें।', 'जोड़ी में तुकांत शब्द रेखांकित करें; हर जोड़ी एक जोड़ा बताए।', 13],
          ['बोर्ड पर अपनी परछाईं पर चार नमूना पंक्तियाँ लिखें।', 'अपनी परछाईं पर चार पंक्तियाँ लिखें और साथी को पढ़कर सुनाएँ।', 10]
        ],
        recap: 'पूरी कक्षा पहला पद साथ में सुनाए; एक समूह उसका मूक अभिनय करे।',
        assess: 'मौखिक: कविता पर तीन प्रश्न; लिखी चार पंक्तियाँ जाँचें।', hw: 'पहला पद याद करो; दोपहर और शाम 5 बजे अपनी परछाईं का चित्र बनाओ।',
        e5: { engage: ['टॉर्च से हाथ की परछाइयाँ: परछाईं कैसे बनती है?', 5, 'टॉर्च'], explore: ['जोड़ी में कविता पढ़ें और अनजान शब्द चिह्नित करें।', 8, 'पाठ्यपुस्तक'], explain: ['हर पद का अर्थ; तुकांत शब्द; लय।', 10, 'कविता का चार्ट'], elaborate: ['अपनी परछाईं पर चार पंक्तियाँ लिखें।', 8, 'कॉपी'], evaluate: ['एक पद सुनाएँ; दो प्रश्नों के उत्तर दें।', 4, 'कविता का चार्ट'] },
        support: 'साथी के साथ पढ़ें; चार पंक्तियों के लिए शब्द-बैंक दें।', extension: 'पता लगाओ कि दोपहर में परछाईं छोटी और शाम को लंबी क्यों होती है।',
        week: [['कविता: पढ़ें और आनंद लें', 'घर पर ज़ोर से पढ़ें'], ['नए शब्द और तुक', 'पाँच तुकांत जोड़े लिखें'], ['बोध प्रश्न', 'प्र. 1–4'], ['लेखन: मेरी परछाईं', 'चार पंक्तियाँ पूरी करें'], ['व्याकरण: कविता में संज्ञा', 'वर्कशीट'], ['सस्वर पाठ और मस्ती', 'पद 1 याद करें']]
      },
      medieval: {
        subjectKey: 'social', cls: '7', subject: 'सामाजिक विज्ञान', topic: 'हज़ार वर्षों के दौरान हुए परिवर्तनों की पड़ताल', period: 5, duration: 40,
        outcomes: ['समझा सकेंगे कि "हिंदुस्तान" शब्द का अर्थ समय के साथ कैसे बदला', 'ऐतिहासिक मानचित्र पढ़कर आधुनिक मानचित्र से तुलना कर सकेंगे', 'मध्यकाल के लिए इतिहासकारों के स्रोतों की सूची बना सकेंगे'],
        prev: 'विद्यार्थी कक्षा 6 से प्राचीन काल जानते हैं और भारत का मानचित्र पढ़ लेते हैं।',
        materials: ['दो मानचित्र: अल-इदरीसी (1154) और आधुनिक मानचित्र', 'पाठ्यपुस्तक', 'एटलस'], comp: ['critical', 'comm'],
        intro: 'अल-इदरीसी का 1154 का मानचित्र उल्टा करके दिखाएँ। पूछें: क्या तुम दक्षिण भारत ढूँढ़ सकते हो?',
        steps: [
          ['दोनों मानचित्रों की तुलना करें: नाम, आकार, क्या छूटा है।', 'जोड़ी में तीन अंतर खोजें और बताएँ कि मानचित्र क्यों बदलते हैं।', 12],
          ['समझाएँ कि शब्द कैसे बदलते हैं: मिनहाज-ए-सिराज, बाबर और अमीर ख़ुसरो के लिए हिंदुस्तान।', 'कॉपी में तीनों अर्थों की समय-रेखा बनाएँ।', 13],
          ['स्रोत: पांडुलिपियाँ, सिक्के, अभिलेख, इमारतें; नकल करने से पाठ कैसे बदले।', 'स्रोत कार्ड को लिखित और भौतिक स्रोतों में छाँटें।', 10]
        ],
        recap: 'झटपट प्रश्नोत्तरी: पंजाब, हरियाणा और गंगा-यमुना क्षेत्र के लिए "हिंदुस्तान" किसने प्रयोग किया?',
        assess: 'दो कारण लिखो कि किसी स्थान के नाम का अर्थ क्यों बदल सकता है।', hw: 'NCERT अध्याय 1, "फिर से याद करें" प्रश्न 1 से 3।',
        e5: { engage: ['1154 का उल्टा मानचित्र: तुम्हें क्या दिखता है?', 5, 'मानचित्र का प्रिंट'], explore: ['समूह में पुराने और नए मानचित्र की तुलना करें।', 10, 'दो मानचित्र'], explain: ['बदलते नाम और अर्थ; इस काल के स्रोत।', 12, 'पाठ्यपुस्तक, श्यामपट्ट'], elaborate: ['"हिंदुस्तान" शब्द की समय-रेखा बनाएँ।', 8, 'कॉपी'], evaluate: ['स्थान-नामों के अर्थ बदलने के दो कारण।', 5, 'काग़ज़ की पर्चियाँ'] },
        support: 'नाम पहले से लिखे मानचित्र दें; एक अंतर पूछें।', extension: 'पता लगाओ कि 500 साल पहले तुम्हारे शहर या राज्य को क्या कहते थे।',
        week: [['पुराने और नए मानचित्र', 'पाठ 1.1 पढ़ें'], ['नए और पुराने शब्द: हिंदुस्तान', 'समय-रेखा'], ['इतिहासकार और उनके स्रोत', 'प्र. 1–3'], ['नए सामाजिक और राजनीतिक समूह', 'पाठ 1.3 पढ़ें'], ['क्षेत्र और साम्राज्य; पुराने और नए धर्म', 'संक्षिप्त नोट्स'], ['दोहराव और मानचित्र कार्य', 'पाँच स्थान चिह्नित करें']]
      },
      story: {
        subjectKey: 'language', cls: '4', subject: 'हिन्दी', topic: 'कहानी: प्यासा कौआ', period: 1, duration: 35,
        outcomes: ['कहानी को सही क्रम में दोबारा सुना सकेंगे', 'पाँच नए शब्दों के अर्थ बता सकेंगे', 'बता सकेंगे कि कौए ने क्या किया और वह क्यों काम कर गया'],
        prev: 'विद्यार्थी छोटे वाक्य पढ़ लेते हैं और घर पर लोककथाएँ सुनी हैं।',
        materials: ['कहानी के चित्र कार्ड', 'एक घड़ा, पानी और कंकड़', 'पाठ्यपुस्तक'], comp: ['critical', 'creativity', 'comm'],
        intro: 'थोड़े पानी वाला घड़ा और एक पत्थर दिखाएँ। पूछें: चिड़िया यह पानी कैसे पी सकती है?',
        steps: [
          ['चित्र कार्ड और आवाज़ बदल-बदलकर कहानी सुनाएँ।', 'सुनें; दो जगह अनुमान लगाएँ कि आगे क्या होगा।', 10],
          ['कहानी ज़ोर से पढ़ें; नए शब्द हाव-भाव से समझाएँ।', 'जोड़ी में पढ़ें; नए शब्द रेखांकित करें; दो शब्दों से वाक्य बनाएँ।', 15],
          ['घड़े में कंकड़ वाला प्रयोग करें।', 'एक-एक कंकड़ डालें, पानी ऊपर आते देखें और बताएँ कि ऐसा क्यों हुआ।', 10]
        ],
        recap: 'बोर्ड पर चित्र कार्ड को सही क्रम में लगाएँ।',
        assess: 'साथी को पाँच वाक्यों में कहानी दोबारा सुनाओ।', hw: 'कौए और घड़े का चित्र बनाओ; तीन वाक्य लिखो।',
        e5: { engage: ['थोड़े पानी वाला घड़ा: चिड़िया इसे कैसे पिए?', 5, 'घड़ा, पानी'], explore: ['समूह में कंकड़ डालकर देखें: क्या पानी ऊपर आता है?', 8, 'घड़ा, कंकड़'], explain: ['कहानी पढ़ें; नए शब्द और कहानी की सीख।', 10, 'पाठ्यपुस्तक, चित्र कार्ड'], elaborate: ['तीन के समूह में कहानी का अभिनय करें।', 8, 'चित्र कार्ड'], evaluate: ['पाँच वाक्यों में कहानी दोबारा सुनाएँ।', 4, 'चित्र कार्ड'] },
        support: 'चित्र कार्ड क्रम में दें; उनकी मदद से सुनाएँ।', extension: 'अंत बदलो: अगर कंकड़ न होते तो?',
        week: [['कहानी सुनें', 'घर पर सुनाएँ'], ['पढ़ें; नए शब्द', 'पाँच शब्द, पाँच वाक्य'], ['कंकड़ वाला प्रयोग और उसका कारण', 'उसका चित्र बनाएँ'], ['कहानी का अभिनय', 'अपने संवाद याद करें'], ['अपना अंत लिखें', 'अंत पूरा करें'], ['दोहराव और सस्वर पाठ', 'पृष्ठ 1 ज़ोर से पढ़ें']]
      },
      ai: {
        subjectKey: 'ai', cls: '9', subject: 'कृत्रिम बुद्धिमत्ता (AI)', topic: 'AI क्या है?', period: 6, duration: 40,
        outcomes: ['तय नियमों पर चलने वाली मशीन और डेटा से सीखने वाली मशीन का अंतर बता सकेंगे', 'रोज़मर्रा में AI के पाँच उपयोग गिना सकेंगे', 'AI के एक लाभ और एक जोखिम पर चर्चा कर सकेंगे'],
        prev: 'विद्यार्थी स्मार्टफ़ोन, मैप, वॉइस असिस्टेंट और वीडियो ऐप इस्तेमाल करते हैं।',
        materials: ['प्रोजेक्टर या फ़ोन', 'रोज़ के कामों वाले कार्ड', 'चार्ट पेपर'], comp: ['critical', 'digital', 'comm'],
        intro: 'पूछें: तुम्हारा फ़ोन चेहरे से कैसे खुलता है? वीडियो ऐप को कैसे पता कि तुम्हें क्या पसंद है?',
        steps: [
          ['AI को सरल शब्दों में परिभाषित करें: मशीनें जो डेटा से पैटर्न सीखकर निर्णय लेती हैं।', 'अपने फ़ोन से हर विद्यार्थी दो उदाहरण दे।', 10],
          ['काम छाँटें: कैलकुलेटर (तय नियम) और स्पैम फ़िल्टर (सीखना)। डेटा, पैटर्न, पूर्वानुमान समझाएँ।', 'समूह में काम के कार्ड "तय नियम" और "डेटा से सीखता है" में छाँटें।', 15],
          ['लाभ और जोखिम पर चर्चा: खेती और स्वास्थ्य में मदद; पक्षपात, निजता, नकली वीडियो।', 'हर समूह चार्ट पेपर पर एक लाभ और एक जोखिम लिखे।', 10]
        ],
        recap: 'तीन कथन: AI है या नहीं? अँगूठा ऊपर या नीचे।',
        assess: 'इस सप्ताह देखे AI के पाँच उपयोग और एक जोखिम लिखो।', hw: 'परिवार के किसी सदस्य से पूछो कि वे किस ऐप पर सबसे ज़्यादा भरोसा करते हैं और क्यों; लिखो कि क्या वह AI इस्तेमाल करता है।',
        e5: { engage: ['तुम्हारा फ़ोन चेहरे से कैसे खुलता है?', 5, 'फ़ोन'], explore: ['काम के कार्ड छाँटें: तय नियम या सीखना?', 10, 'काम के कार्ड'], explain: ['AI क्या है: डेटा, पैटर्न, पूर्वानुमान; कहाँ उपयोग होता है।', 12, 'प्रोजेक्टर'], elaborate: ['काग़ज़ पर अपने स्कूल के लिए एक सरल AI सहायक डिज़ाइन करें।', 8, 'चार्ट पेपर'], evaluate: ['AI के पाँच उपयोग और एक जोखिम।', 5, 'कॉपी'] },
        support: 'उदाहरण बनाकर दें; विद्यार्थी सिर्फ़ छाँटें।', extension: 'ऐसा एक उदाहरण खोजो जहाँ AI ने ग़लत निर्णय लिया और समझाओ क्यों।',
        week: [['बुद्धिमत्ता क्या है? इंसान और मशीन', 'आज किए पाँच समझदारी के काम लिखें'], ['AI क्या है? नियम या सीखना', 'दस काम छाँटें'], ['हमारे आसपास AI', 'AI के पाँच उपयोग'], ['डेटा, पैटर्न और पूर्वानुमान', 'पैटर्न वर्कशीट'], ['AI के लाभ और जोखिम', 'एक पन्ने का नोट'], ['प्रोजेक्ट: हमारे स्कूल के लिए AI सहायक', 'पोस्टर']]
      }
    }
  },
  bn: {
    bloom: {
      remember: ['সংজ্ঞা দেওয়া', 'তালিকা করা', 'নাম বলা', 'মনে করে বলা', 'চিহ্নিত করা', 'বিবৃত করা'],
      understand: ['ব্যাখ্যা করা', 'বর্ণনা করা', 'সারাংশ বলা', 'শ্রেণিবদ্ধ করা', 'তুলনা করা', 'উদাহরণ দেওয়া'],
      apply: ['ব্যবহার করা', 'সমাধান করা', 'হিসাব করা', 'করে দেখানো', 'প্রদর্শন করা', 'মাপা'],
      analyse: ['বিশ্লেষণ করা', 'পার্থক্য করা', 'প্যাটার্ন খোঁজা', 'পরীক্ষা করা', 'বাছাই করা', 'সিদ্ধান্তে পৌঁছানো'],
      evaluate: ['বিচার করা', 'যুক্তি দেখানো', 'সিদ্ধান্ত নেওয়া', 'যাচাই করা', 'পক্ষে যুক্তি দেওয়া', 'মূল্যায়ন করা'],
      create: ['নকশা করা', 'তৈরি করা', 'পরিকল্পনা করা', 'রচনা করা', 'গড়ে তোলা', 'উদ্ভাবন করা']
    },
    materials: ['ব্ল্যাকবোর্ড ও চক', 'পাঠ্যবই', 'চার্ট বা পোস্টার', 'ফ্ল্যাশকার্ড', 'ওয়ার্কশিট', 'প্রজেক্টর বা স্মার্টবোর্ড', 'আসল জিনিস', 'খাতা ও পেনসিল'],
    ideas: {
      maths: ['কাগজ দিয়ে বানাও: ভাঁজ করে বা কেটে আকার দিয়ে ধারণাটি দেখাও', 'একটি কঠিন প্রশ্নে ভাবো-জোড়ায় আলোচনা-সবাইকে বলো', 'গণিত রিলে: দলের প্রত্যেকে বোর্ডে একটি ধাপ সমাধান করে', 'আগে আন্দাজ করো, তারপর মেপে মিলিয়ে দেখো', 'এই গণিত বাজারে বা রান্নাঘরে খুঁজে একটি উদাহরণ আনো'],
      science: ['ছোট প্রদর্শনী দিয়ে অনুমান-পর্যবেক্ষণ-ব্যাখ্যা', 'আসল জিনিস দেখে ছবি এঁকে নাম লেখো', 'দলগত পরীক্ষা, সবার জন্য একটি ফলাফল ছক', 'কার্ডগুলো দলে ভাগ করো আর নিয়মটি বোঝাও', 'প্রতি দল থেকে এক মিনিটের "বিজ্ঞান প্রতিবেদক"'],
      english: ['জোড়ায় জোরে পড়ো আর ভূমিকা বদলাও', 'চারজনের দলে দৃশ্যটি অভিনয় করো', 'শব্দ খোঁজা: পাঁচটি নতুন শব্দ খুঁজে অর্থ আন্দাজ করো', 'নিজের ভাষায় তিন লাইন লেখো', 'হট সিট: একজন ছাত্র চরিত্র হয়ে উত্তর দেয়'],
      social: ['মেঝেতে চক দিয়ে সময়রেখা', 'মানচিত্রের কাজ: পাঁচটি জায়গা চিহ্নিত করো', 'ভূমিকাভিনয়: সেই সময়ের একটি দিন', 'তখন আর এখন: T-চার্টে তুলনা', 'স্থানীয় যোগ: বাড়ির কোনো বয়স্ককে জিজ্ঞেস করে জানাও'],
      language: ['গল্পের বৃত্ত: প্রত্যেক ছাত্র এক লাইন যোগ করে', 'ছবি দেখে কথা: তিন বাক্যে বর্ণনা করো', 'ছন্দমিলের শব্দ খুঁজে একটি ছড়া বানাও', 'জোড়ায় শ্রুতলিপি; একে অন্যেরটা দেখো', 'হাতপুতুল দিয়ে গল্পটি আবার বলো'],
      ai: ['AI চেনো: AI ব্যবহার করে এমন পাঁচটি অ্যাপের তালিকা', 'মানুষ না যন্ত্র: কাজগুলো ভাগ করো', 'প্যাটার্ন খেলা: উদাহরণ থেকে নিয়ম আন্দাজ করো', 'কাগজে একটি সহজ চ্যাটবট স্ক্রিপ্ট লেখো', 'বিতর্ক: AI কি সবসময় ঠিক?'],
      general: ['ভাবো-জোড়ায়-বলো: এক মিনিট একা, দুই মিনিট জোড়ায়', 'এক্সিট স্লিপ: একটি জিনিস শিখলাম, একটি প্রশ্ন আছে', 'গ্যালারি ওয়াক: দলগুলো কাজ দেয়ালে টাঙায়', 'স্লেট দিয়ে দলগত কুইজ', 'সহপাঠীকে শেখানো: সঙ্গীকে বুঝিয়ে বলো']
    },
    samples: {
      fractions: {
        subjectKey: 'maths', cls: '6', subject: 'গণিত', topic: 'ভগ্নাংশ: সমতুল ভগ্নাংশ', period: 3, duration: 40,
        outcomes: ['সমতুল ভগ্নাংশ কী তা ব্যাখ্যা করতে পারবে', 'গুণ বা ভাগ করে সমতুল ভগ্নাংশ বানাতে পারবে', 'দুটি ভগ্নাংশ সমতুল কি না যাচাই করতে পারবে'],
        prev: 'শিক্ষার্থীরা 1/2, 3/4-এর মতো ভগ্নাংশ পড়তে-লিখতে পারে এবং আকারে রং করতে পারে।',
        materials: ['কাগজের ফালি', 'ব্ল্যাকবোর্ড ও চক', 'ভগ্নাংশ চার্ট'], comp: ['critical', 'collab'],
        intro: '2 সমান টুকরো করা একটি রুটি আর 4 টুকরো করা আরেকটি দেখান। জিজ্ঞেস করুন: 1/2 আর 2/4 কি সমান?',
        steps: [
          ['কাগজের ফালি অর্ধেক, তারপর চার ভাগে ভাঁজ করুন; বোর্ডে 1/2 = 2/4 দেখান।', 'নিজের ফালি ভাঁজ করে 1/2 ও 2/4 রং করে জোড়ায় মেলাও।', 10],
          ['নিয়ম বোঝান: লব ও হরকে একই সংখ্যা দিয়ে গুণ বা ভাগ। দুটি উদাহরণ করুন।', 'খাতায় 2/3-এর তিনটি সমতুল ভগ্নাংশ বানাও।', 15],
          ['জোড়া জোড়া ভগ্নাংশ দিন; কোনগুলো সমতুল আর কীভাবে বুঝলাম জিজ্ঞেস করুন।', 'আড়াআড়ি গুণ করে যাচাই করো; কারণসহ হ্যাঁ বা না বলো।', 10]
        ],
        recap: 'বোর্ডে তিনটি দ্রুত প্রশ্ন: সমতুল না কি নয়? শিক্ষার্থীরা বুড়ো আঙুল উপরে বা নিচে দেখায়।',
        assess: 'এক্সিট স্লিপ: 3/5-এর দুটি সমতুল ভগ্নাংশ লেখো।', hw: 'NCERT অনুশীলনী 7.3, প্রশ্ন 1 থেকে 4।',
        e5: { engage: ['রুটির ধাঁধা: 1/2 আর 2/4 কি সমান? ভোট দাও আর কারণ বলো।', 5, 'কাগজের দুটি রুটি'], explore: ['জোড়ায় ফালি ভাঁজ করে 1/2-এর সমান ভগ্নাংশ খোঁজো।', 10, 'কাগজের ফালি'], explain: ['নিয়ম: লব ও হরকে একই সংখ্যা দিয়ে গুণ বা ভাগ।', 10, 'ব্ল্যাকবোর্ড'], elaborate: ['ভগ্নাংশ চার্টে সমতুল ভগ্নাংশ খুঁজে প্যাটার্নটি বলো।', 10, 'ভগ্নাংশ চার্ট'], evaluate: ['এক্সিট স্লিপ: 3/5-এর দুটি সমতুল ভগ্নাংশ।', 5, 'কাগজের স্লিপ'] },
        support: 'তৈরি ভগ্নাংশ-ফালি দিন; শুধু অর্ধেক আর সিকি নিয়ে কাজ করুন।', extension: '1/2 ও 1-এর মাঝের তিনটি ভগ্নাংশ খুঁজে ক্রমে আছে প্রমাণ করো।',
        week: [['সংখ্যারেখায় ভগ্নাংশ', 'অনু. 7.1 প্র. 1–3'], ['প্রকৃত ও অপ্রকৃত ভগ্নাংশ', 'অনু. 7.2 প্র. 1–2'], ['সমতুল ভগ্নাংশ', 'অনু. 7.3 প্র. 1–4'], ['লঘিষ্ঠ আকার', 'অনু. 7.3 প্র. 5–7'], ['ভগ্নাংশের তুলনা', 'অনু. 7.4 প্র. 1–3'], ['অনুশীলন ও কুইজ', 'অধ্যায়টি ঝালিয়ে নাও']]
      },
      cell: {
        subjectKey: 'science', cls: '8', subject: 'বিজ্ঞান', topic: 'কোষ: গঠন ও কাজ', period: 2, duration: 40,
        outcomes: ['কোষের প্রধান অংশগুলোর নাম বলতে পারবে', 'উদ্ভিদকোষ ও প্রাণীকোষের তুলনা করতে পারবে', 'কোষকে কেন জীবনের মৌলিক একক বলা হয় তা ব্যাখ্যা করতে পারবে'],
        prev: 'শিক্ষার্থীরা জানে জীবদেহ ছোট ছোট অংশ দিয়ে তৈরি এবং তারা হ্যান্ড লেন্স ব্যবহার করেছে।',
        materials: ['পেঁয়াজের খোসা ও স্লাইড', 'অণুবীক্ষণ যন্ত্র বা কোষের চার্ট', 'রঙিন পেনসিল'], comp: ['critical', 'comm'],
        intro: 'ইটের দেয়ালের ছবি আর অণুবীক্ষণে পেঁয়াজের খোসার ছবি দেখান। জিজ্ঞেস করুন: জীবদেহ কী দিয়ে তৈরি?',
        steps: [
          ['পেঁয়াজের খোসার স্লাইড বা চার্ট দেখান; কোষপ্রাচীর, নিউক্লিয়াস ও সাইটোপ্লাজম দেখিয়ে দিন।', 'যা দেখছ তা পর্যবেক্ষণ করে আঁকো; দুটি অংশের নাম লেখো।', 12],
          ['বোর্ডে ভেন চিত্র দিয়ে উদ্ভিদকোষ ও প্রাণীকোষের তুলনা করুন।', 'জোড়ায় ভেন চিত্র পূরণ করো: প্রাচীর, ক্লোরোপ্লাস্ট, ভ্যাকুওল, নিউক্লিয়াস।', 13],
          ['"শহর"-এর সঙ্গে তুলনা করে কোষের অংশ ও তাদের কাজ বোঝান।', 'অংশের কার্ড তাদের কাজের সঙ্গে মেলাও।', 10]
        ],
        recap: 'র‍্যাপিড ফায়ার: কোষ নিয়ন্ত্রণ করে কোন অংশ; শুধু উদ্ভিদে থাকে কোন অংশ।',
        assess: 'পাঁচটি অংশসহ উদ্ভিদকোষ এঁকে নাম লেখো।', hw: 'NCERT অধ্যায় 8, প্রশ্ন 1 থেকে 5।',
        e5: { engage: ['ইটের দেয়াল না পেঁয়াজের খোসা: জীবদেহ কী দিয়ে তৈরি?', 5, 'ছবি, পেঁয়াজের খোসা'], explore: ['দলে পেঁয়াজের খোসার স্লাইড দেখে আঁকো।', 12, 'অণুবীক্ষণ বা চার্ট'], explain: ['কোষের অংশ ও তাদের কাজ; উদ্ভিদকোষ ও প্রাণীকোষ।', 10, 'ব্ল্যাকবোর্ড, কোষের চার্ট'], elaborate: ['মাটি বা কাগজ দিয়ে কোষের মডেল বানাও।', 8, 'মাটি, কাগজ'], evaluate: ['খালি কোষচিত্রে নাম লেখো।', 5, 'ওয়ার্কশিট'] },
        support: 'নকল করার জন্য নামসহ চিত্র দিন; পাঁচটির বদলে তিনটি অংশ চান।', extension: 'পাতার কোষে কী আছে যা গালের কোষে নেই, আর কেন, খুঁজে বের করো।',
        week: [['কোষের আবিষ্কার; অণুবীক্ষণ যন্ত্র', '8.1 পড়ো'], ['কোষের আকার ও আয়তন', 'তিনটি কোষ আঁকো'], ['কোষের অংশ', 'প্র. 1–3'], ['উদ্ভিদকোষ ও প্রাণীকোষ', 'ভেন চিত্র'], ['পেঁয়াজের খোসার ব্যবহারিক', 'ল্যাব খাতা'], ['পুনরালোচনা ও কুইজ', 'অধ্যায়টি ঝালিয়ে নাও']]
      },
      poem: {
        subjectKey: 'english', cls: '5', subject: 'ইংরেজি', topic: 'কবিতা: My Shadow', period: 4, duration: 35,
        outcomes: ['ছন্দ ধরে কবিতাটি জোরে পড়তে পারবে', 'ছন্দমিলের শব্দ খুঁজে ছায়া কী করে বলতে পারবে', 'নিজের ছায়া নিয়ে চার লাইন লিখতে পারবে'],
        prev: 'শিক্ষার্থীরা রোদে নিজের ছায়া দেখেছে এবং sun-fun-এর মতো ছন্দমিলের শব্দ জানে।',
        materials: ['পাঠ্যবই', 'টর্চ', 'কবিতার চার্ট'], comp: ['creativity', 'comm'],
        intro: 'আধো-অন্ধকার কোণে টর্চ জ্বেলে হাতের ছায়া বানান। জিজ্ঞেস করুন: তোমার ছায়া কখন লম্বা হয়?',
        steps: [
          ['অভিনয়সহ কবিতাটি দুবার জোরে পড়ুন; কঠিন শব্দ বোঝান।', 'শোনো, তারপর সমস্বরে পড়ো আর লাইনগুলো অভিনয় করো।', 12],
          ['জিজ্ঞেস করুন: ছায়া এমন কী করে যা শিশুটিও করে? ছন্দমিলের জোড়া খোঁজো।', 'জোড়ায় ছন্দমিলের শব্দে দাগ দাও; প্রত্যেকে একটি জোড়া বলো।', 13],
          ['বোর্ডে নিজের ছায়া নিয়ে চার লাইনের নমুনা লিখুন।', 'নিজের ছায়া নিয়ে চার লাইন লিখে সঙ্গীকে পড়ে শোনাও।', 10]
        ],
        recap: 'পুরো ক্লাস একসঙ্গে প্রথম স্তবক আবৃত্তি করে; একটি দল মূকাভিনয় করে।',
        assess: 'মৌখিক: কবিতা নিয়ে তিনটি প্রশ্ন; লেখা চার লাইন দেখুন।', hw: 'প্রথম স্তবক মুখস্থ করো; দুপুরে ও বিকেল 5টায় নিজের ছায়া আঁকো।',
        e5: { engage: ['টর্চ দিয়ে হাতের ছায়া: ছায়া কীভাবে তৈরি হয়?', 5, 'টর্চ'], explore: ['জোড়ায় কবিতা পড়ে অজানা শব্দে দাগ দাও।', 8, 'পাঠ্যবই'], explain: ['প্রতিটি স্তবকের অর্থ; ছন্দমিলের শব্দ; ছন্দ।', 10, 'কবিতার চার্ট'], elaborate: ['নিজের ছায়া নিয়ে চার লাইন লেখো।', 8, 'খাতা'], evaluate: ['একটি স্তবক আবৃত্তি করো; দুটি প্রশ্নের উত্তর দাও।', 4, 'কবিতার চার্ট'] },
        support: 'সঙ্গীর সঙ্গে পড়ো; চার লাইনের জন্য শব্দভান্ডার দিন।', extension: 'দুপুরে ছায়া ছোট আর বিকেলে লম্বা কেন, খুঁজে বের করো।',
        week: [['কবিতা: পড়ো ও উপভোগ করো', 'বাড়িতে জোরে পড়ো'], ['নতুন শব্দ ও ছন্দমিল', 'পাঁচটি ছন্দমিলের জোড়া লেখো'], ['বোধমূলক প্রশ্ন', 'প্র. 1–4'], ['লেখা: আমার ছায়া', 'চার লাইন শেষ করো'], ['ব্যাকরণ: কবিতার বিশেষ্য', 'ওয়ার্কশিট'], ['আবৃত্তি ও মজা', 'স্তবক 1 মুখস্থ করো']]
      },
      medieval: {
        subjectKey: 'social', cls: '7', subject: 'সমাজবিজ্ঞান', topic: 'হাজার বছরের পরিবর্তনের খোঁজে', period: 5, duration: 40,
        outcomes: ['"হিন্দুস্তান" শব্দের অর্থ সময়ের সঙ্গে কীভাবে বদলেছে তা ব্যাখ্যা করতে পারবে', 'একটি ঐতিহাসিক মানচিত্র পড়ে আধুনিক মানচিত্রের সঙ্গে তুলনা করতে পারবে', 'মধ্যযুগের জন্য ইতিহাসবিদদের ব্যবহৃত উৎসের তালিকা করতে পারবে'],
        prev: 'শিক্ষার্থীরা ষষ্ঠ শ্রেণি থেকে প্রাচীন যুগ জানে এবং ভারতের মানচিত্র পড়তে পারে।',
        materials: ['দুটি মানচিত্র: আল-ইদরিসি (1154) ও একটি আধুনিক মানচিত্র', 'পাঠ্যবই', 'অ্যাটলাস'], comp: ['critical', 'comm'],
        intro: 'আল-ইদরিসির 1154 সালের মানচিত্রটি উল্টো করে দেখান। জিজ্ঞেস করুন: দক্ষিণ ভারত খুঁজে পাচ্ছ?',
        steps: [
          ['দুটি মানচিত্রের তুলনা: নাম, আকার, কী নেই।', 'জোড়ায় তিনটি পার্থক্য খুঁজে বলো মানচিত্র কেন বদলায়।', 12],
          ['শব্দ কীভাবে বদলায় বোঝান: মিনহাজ-ই-সিরাজ, বাবর ও আমির খুসরোর "হিন্দুস্তান"।', 'খাতায় তিনটি অর্থের সময়রেখা বানাও।', 13],
          ['উৎস: পাণ্ডুলিপি, মুদ্রা, শিলালিপি, স্থাপত্য; নকল করায় লেখা কেন বদলাত।', 'উৎসের কার্ড লিখিত ও বস্তুগত উৎসে ভাগ করো।', 10]
        ],
        recap: 'দ্রুত কুইজ: পাঞ্জাব, হরিয়ানা ও গঙ্গা-যমুনা অঞ্চলের জন্য "হিন্দুস্তান" কে ব্যবহার করেছিলেন?',
        assess: 'জায়গার নামের অর্থ কেন বদলাতে পারে, দুটি কারণ লেখো।', hw: 'NCERT অধ্যায় 1, "Let\'s recall" প্রশ্ন 1 থেকে 3।',
        e5: { engage: ['1154 সালের একটি উল্টো মানচিত্র: কী দেখছ?', 5, 'মানচিত্রের প্রিন্ট'], explore: ['দলে পুরোনো ও নতুন মানচিত্রের তুলনা করো।', 10, 'দুটি মানচিত্র'], explain: ['বদলে যাওয়া নাম ও অর্থ; এই যুগের উৎস।', 12, 'পাঠ্যবই, ব্ল্যাকবোর্ড'], elaborate: ['"হিন্দুস্তান" শব্দের সময়রেখা আঁকো।', 8, 'খাতা'], evaluate: ['জায়গার নামের অর্থ বদলানোর দুটি কারণ।', 5, 'কাগজের স্লিপ'] },
        support: 'নাম আগে থেকে লেখা মানচিত্র দিন; একটি পার্থক্য চান।', extension: '500 বছর আগে তোমার শহর বা রাজ্যকে কী বলা হতো, খুঁজে বের করো।',
        week: [['পুরোনো ও নতুন মানচিত্র', '1.1 পড়ো'], ['নতুন ও পুরোনো শব্দ: হিন্দুস্তান', 'সময়রেখা'], ['ইতিহাসবিদ ও তাঁদের উৎস', 'প্র. 1–3'], ['নতুন সামাজিক ও রাজনৈতিক গোষ্ঠী', '1.3 পড়ো'], ['অঞ্চল ও সাম্রাজ্য; পুরোনো ও নতুন ধর্ম', 'সংক্ষিপ্ত নোট'], ['পুনরালোচনা ও মানচিত্রের কাজ', 'পাঁচটি জায়গা চিহ্নিত করো']]
      },
      story: {
        subjectKey: 'language', cls: '4', subject: 'বাংলা', topic: 'গল্প: তৃষ্ণার্ত কাক', period: 1, duration: 35,
        outcomes: ['গল্পটি সঠিক ক্রমে আবার বলতে পারবে', 'পাঁচটি নতুন শব্দের অর্থ বলতে পারবে', 'কাক কী করেছিল আর তা কেন কাজ করল বলতে পারবে'],
        prev: 'শিক্ষার্থীরা ছোট বাক্য পড়তে পারে এবং বাড়িতে লোককথা শুনেছে।',
        materials: ['গল্পের ছবির কার্ড', 'একটি কলসি, জল ও নুড়ি', 'পাঠ্যবই'], comp: ['critical', 'creativity', 'comm'],
        intro: 'অল্প জল ভরা একটি কলসি আর একটি পাথর দেখান। জিজ্ঞেস করুন: পাখি এই জল কীভাবে খেতে পারে?',
        steps: [
          ['ছবির কার্ড আর গলার স্বর বদলে গল্পটি বলুন।', 'শোনো; দুটি জায়গায় আন্দাজ করো এরপর কী হবে।', 10],
          ['গল্পটি জোরে পড়ুন; অভিনয় করে নতুন শব্দ বোঝান।', 'জোড়ায় পড়ো; নতুন শব্দে দাগ দাও; দুটি দিয়ে বাক্য বানাও।', 15],
          ['কলসি দিয়ে নুড়ির পরীক্ষাটি করুন।', 'একটা একটা করে নুড়ি ফেলো, জল ওঠা দেখো আর বলো কেন হয়।', 10]
        ],
        recap: 'বোর্ডে ছবির কার্ডগুলো ক্রমে সাজাও।',
        assess: 'সঙ্গীকে পাঁচ বাক্যে গল্পটি আবার বলো।', hw: 'কাক আর কলসি আঁকো; তিনটি বাক্য লেখো।',
        e5: { engage: ['অল্প জলের কলসি: পাখি কীভাবে খাবে?', 5, 'কলসি, জল'], explore: ['দলে নুড়ি দিয়ে চেষ্টা করো: জল কি ওঠে?', 8, 'কলসি, নুড়ি'], explain: ['গল্পটি পড়ো; নতুন শব্দ ও গল্পের শিক্ষা।', 10, 'পাঠ্যবই, ছবির কার্ড'], elaborate: ['তিনজনের দলে গল্পটি অভিনয় করো।', 8, 'ছবির কার্ড'], evaluate: ['পাঁচ বাক্যে গল্পটি আবার বলো।', 4, 'ছবির কার্ড'] },
        support: 'ছবির কার্ড ক্রমে সাজিয়ে দিন; সেগুলো দিয়ে বলুক।', extension: 'শেষটা বদলাও: নুড়ি না থাকলে কী হতো?',
        week: [['গল্পটি শোনো', 'বাড়িতে বলো'], ['পড়ো; নতুন শব্দ', 'পাঁচটি শব্দ, পাঁচটি বাক্য'], ['নুড়ির পরীক্ষা আর তা কেন কাজ করে', 'এঁকে দেখাও'], ['গল্পটি অভিনয় করো', 'নিজের সংলাপ অভ্যাস করো'], ['নিজের শেষটা লেখো', 'শেষটা পূর্ণ করো'], ['পুনরালোচনা ও জোরে পড়া', 'পাতা 1 জোরে পড়ো']]
      },
      ai: {
        subjectKey: 'ai', cls: '9', subject: 'কৃত্রিম বুদ্ধিমত্তা', topic: 'AI কী?', period: 6, duration: 40,
        outcomes: ['নির্দিষ্ট নিয়ম মানা যন্ত্র আর তথ্য থেকে শেখা যন্ত্রের পার্থক্য বলতে পারবে', 'দৈনন্দিন জীবনে AI-এর পাঁচটি ব্যবহারের তালিকা করতে পারবে', 'AI-এর একটি সুবিধা ও একটি ঝুঁকি নিয়ে আলোচনা করতে পারবে'],
        prev: 'শিক্ষার্থীরা স্মার্টফোন, ম্যাপ, ভয়েস অ্যাসিস্ট্যান্ট ও ভিডিও অ্যাপ ব্যবহার করে।',
        materials: ['প্রজেক্টর বা ফোন', 'দৈনন্দিন কাজের কার্ড', 'চার্ট পেপার'], comp: ['critical', 'digital', 'comm'],
        intro: 'জিজ্ঞেস করুন: তোমার ফোন মুখ দেখে কীভাবে খোলে? ভিডিও অ্যাপ কীভাবে জানে তুমি কী পছন্দ করো?',
        steps: [
          ['সহজ কথায় AI-এর সংজ্ঞা দিন: যে যন্ত্র তথ্য থেকে প্যাটার্ন শিখে সিদ্ধান্ত নেয়।', 'নিজের ফোন থেকে প্রত্যেকে দুটি উদাহরণ দাও।', 10],
          ['কাজ ভাগ করুন: ক্যালকুলেটর (নির্দিষ্ট নিয়ম) ও স্প্যাম ফিল্টার (শেখা)। তথ্য, প্যাটার্ন, পূর্বাভাস বোঝান।', 'দলে কাজের কার্ড "নির্দিষ্ট নিয়ম" ও "তথ্য থেকে শেখে" ভাগে সাজাও।', 15],
          ['সুবিধা ও ঝুঁকি আলোচনা: কৃষি ও স্বাস্থ্যে সাহায্য; পক্ষপাত, গোপনীয়তা, নকল ভিডিও।', 'প্রতি দল চার্ট পেপারে একটি সুবিধা ও একটি ঝুঁকি লেখো।', 10]
        ],
        recap: 'তিনটি বক্তব্য: AI না কি AI নয়? বুড়ো আঙুল উপরে বা নিচে।',
        assess: 'এই সপ্তাহে দেখা AI-এর পাঁচটি ব্যবহার ও একটি ঝুঁকি লেখো।', hw: 'পরিবারের কাউকে জিজ্ঞেস করো কোন অ্যাপে সবচেয়ে ভরসা করেন আর কেন; সেটি AI ব্যবহার করে কি না লেখো।',
        e5: { engage: ['তোমার ফোন মুখ দেখে কীভাবে খোলে?', 5, 'ফোন'], explore: ['কাজের কার্ড ভাগ করো: নির্দিষ্ট নিয়ম না শেখা?', 10, 'কাজের কার্ড'], explain: ['AI কী: তথ্য, প্যাটার্ন, পূর্বাভাস; কোথায় ব্যবহার হয়।', 12, 'প্রজেক্টর'], elaborate: ['কাগজে তোমার স্কুলের জন্য একটি সহজ AI সহায়ক নকশা করো।', 8, 'চার্ট পেপার'], evaluate: ['AI-এর পাঁচটি ব্যবহার ও একটি ঝুঁকি।', 5, 'খাতা'] },
        support: 'উদাহরণ তৈরি করে দিন; শিক্ষার্থীরা শুধু ভাগ করবে।', extension: 'AI ভুল সিদ্ধান্ত নিয়েছে এমন একটি উদাহরণ খুঁজে কারণ ব্যাখ্যা করো।',
        week: [['বুদ্ধিমত্তা কী? মানুষ ও যন্ত্র', 'আজ করা পাঁচটি বুদ্ধিমান কাজের তালিকা'], ['AI কী? নিয়ম না শেখা', 'দশটি কাজ ভাগ করো'], ['আমাদের চারপাশে AI', 'AI-এর পাঁচটি ব্যবহার'], ['তথ্য, প্যাটার্ন ও পূর্বাভাস', 'প্যাটার্ন ওয়ার্কশিট'], ['AI-এর সুবিধা ও ঝুঁকি', 'এক পাতার নোট'], ['প্রকল্প: আমাদের স্কুলের জন্য AI সহায়ক', 'পোস্টার']]
      }
    }
  },
  mr: {
    bloom: {
      remember: ['व्याख्या सांगणे', 'यादी करणे', 'नाव सांगणे', 'आठवून सांगणे', 'नावे लिहिणे', 'विधान करणे'],
      understand: ['स्पष्ट करणे', 'वर्णन करणे', 'सारांश सांगणे', 'वर्गीकरण करणे', 'तुलना करणे', 'उदाहरणे देणे'],
      apply: ['वापरणे', 'सोडवणे', 'गणना करणे', 'करून दाखवणे', 'दाखवणे', 'मोजणे'],
      analyse: ['विश्लेषण करणे', 'फरक सांगणे', 'नमुना शोधणे', 'तपासणे', 'वर्गवारी करणे', 'निष्कर्ष काढणे'],
      evaluate: ['परीक्षण करणे', 'समर्थन देणे', 'निर्णय घेणे', 'पडताळणे', 'बाजू मांडणे', 'मूल्यांकन करणे'],
      create: ['रचना करणे', 'बनवणे', 'नियोजन करणे', 'लिहिणे', 'उभारणे', 'शोध लावणे']
    },
    materials: ['फळा आणि खडू', 'पाठ्यपुस्तक', 'तक्ता किंवा पोस्टर', 'फ्लॅशकार्ड', 'वर्कशीट', 'प्रोजेक्टर किंवा स्मार्टबोर्ड', 'खऱ्या वस्तू', 'वही आणि पेन्सिल'],
    ideas: {
      maths: ['कागदाने बनवा: घडी घालून किंवा कापून आकारातून संकल्पना दाखवा', 'एका अवघड प्रश्नावर विचार करा-जोडीत बोला-सर्वांना सांगा', 'गणित रिले: गटातील प्रत्येकजण फळ्यावर एक पायरी सोडवतो', 'आधी अंदाज करा, मग मोजून पडताळा', 'हे गणित बाजारात किंवा स्वयंपाकघरात शोधा आणि एक उदाहरण आणा'],
      science: ['छोट्या प्रात्यक्षिकासह अंदाज-निरीक्षण-स्पष्टीकरण', 'खऱ्या वस्तूवरून चित्र काढा आणि नावे लिहा', 'गट प्रयोग, सर्वांसाठी एक निकाल तक्ता', 'कार्ड गटांत लावा आणि नियम सांगा', 'प्रत्येक गटाकडून एक मिनिटाचा "विज्ञान वार्ताहर"'],
      english: ['जोडीत मोठ्याने वाचा आणि भूमिका बदला', 'चौघांच्या गटात प्रसंग सादर करा', 'शब्दशोध: पाच नवे शब्द शोधून अर्थाचा अंदाज करा', 'स्वतःच्या शब्दांत तीन ओळी लिहा', 'हॉट सीट: एक विद्यार्थी पात्र बनून उत्तरे देतो'],
      social: ['जमिनीवर खडूने कालरेषा', 'नकाशा काम: पाच ठिकाणे दाखवा', 'भूमिका-अभिनय: त्या काळातील एक दिवस', 'तेव्हा आणि आता: T-तक्त्यात तुलना', 'स्थानिक दुवा: घरातील ज्येष्ठांना विचारून सांगा'],
      language: ['गोष्टीचे वर्तुळ: प्रत्येक विद्यार्थी एक ओळ जोडतो', 'चित्रावर बोला: तीन वाक्यांत वर्णन करा', 'यमक जुळणारे शब्द शोधून गाणे बनवा', 'जोडीत श्रुतलेखन; एकमेकांचे तपासा', 'हातबाहुल्यांनी गोष्ट पुन्हा सांगा'],
      ai: ['AI ओळखा: AI वापरणाऱ्या पाच अॅपची यादी', 'माणूस की यंत्र: कामांची वर्गवारी करा', 'नमुना खेळ: उदाहरणांवरून नियम ओळखा', 'कागदावर साधी चॅटबॉट स्क्रिप्ट लिहा', 'वादविवाद: AI नेहमी बरोबर असते का?'],
      general: ['विचार करा-जोडीत बोला-सांगा: एक मिनिट एकटे, दोन मिनिटे जोडीत', 'एक्झिट स्लिप: एक गोष्ट शिकलो, एक प्रश्न आहे', 'गॅलरी वॉक: गट आपले काम भिंतीवर लावतात', 'पाट्यांसह गट प्रश्नमंजुषा', 'सहाध्यायी शिक्षण: जोडीदाराला समजावून सांगा']
    },
    samples: {
      fractions: {
        subjectKey: 'maths', cls: '6', subject: 'गणित', topic: 'अपूर्णांक: समतुल्य अपूर्णांक', period: 3, duration: 40,
        outcomes: ['समतुल्य अपूर्णांक म्हणजे काय ते स्पष्ट करू शकतील', 'गुणाकार किंवा भागाकाराने समतुल्य अपूर्णांक बनवू शकतील', 'दोन अपूर्णांक समतुल्य आहेत का ते तपासू शकतील'],
        prev: 'विद्यार्थी 1/2 आणि 3/4 सारखे अपूर्णांक वाचू-लिहू शकतात आणि आकृतीत रंगवू शकतात.',
        materials: ['कागदी पट्ट्या', 'फळा आणि खडू', 'अपूर्णांक तक्ता'], comp: ['critical', 'collab'],
        intro: '2 समान तुकडे केलेली पोळी आणि 4 तुकडे केलेली दुसरी पोळी दाखवा. विचारा: 1/2 आणि 2/4 सारखे आहेत का?',
        steps: [
          ['कागदी पट्टीची अर्धी, मग चार घडी करा; फळ्यावर 1/2 = 2/4 दाखवा.', 'स्वतःच्या पट्ट्या घडी करून 1/2 आणि 2/4 रंगवा आणि जोडीत तुलना करा.', 10],
          ['नियम सांगा: अंश आणि छेदाला एकाच संख्येने गुणा किंवा भागा. दोन उदाहरणे सोडवा.', 'वहीत 2/3 चे तीन समतुल्य अपूर्णांक बनवा.', 15],
          ['अपूर्णांकांच्या जोड्या द्या; कोणत्या समतुल्य आहेत आणि कसे कळले ते विचारा.', 'तिरका गुणाकार करून तपासा; कारणासह हो किंवा नाही सांगा.', 10]
        ],
        recap: 'फळ्यावर तीन झटपट प्रश्न: समतुल्य की नाही? विद्यार्थी अंगठा वर किंवा खाली दाखवतात.',
        assess: 'एक्झिट स्लिप: 3/5 चे दोन समतुल्य अपूर्णांक लिहा.', hw: 'NCERT सरावसंच 7.3, प्रश्न 1 ते 4.',
        e5: { engage: ['पोळीचे कोडे: 1/2 आणि 2/4 सारखे आहेत का? मत द्या आणि कारण सांगा.', 5, 'कागदाच्या दोन पोळ्या'], explore: ['जोडीत पट्ट्या घडी करून 1/2 एवढे अपूर्णांक शोधा.', 10, 'कागदी पट्ट्या'], explain: ['नियम: अंश आणि छेदाला एकाच संख्येने गुणा किंवा भागा.', 10, 'फळा'], elaborate: ['अपूर्णांक तक्त्यावर समतुल्य अपूर्णांक शोधून नमुना सांगा.', 10, 'अपूर्णांक तक्ता'], evaluate: ['एक्झिट स्लिप: 3/5 चे दोन समतुल्य अपूर्णांक.', 5, 'कागदाच्या चिठ्ठ्या'] },
        support: 'तयार अपूर्णांक पट्ट्या द्या; फक्त अर्धा आणि पाव यांवर काम करा.', extension: '1/2 आणि 1 यांच्यामधील तीन अपूर्णांक शोधा आणि ते क्रमाने आहेत हे सिद्ध करा.',
        week: [['संख्यारेषेवर अपूर्णांक', 'सराव 7.1 प्र. 1–3'], ['व्यवहारी आणि अपव्यवहारी अपूर्णांक', 'सराव 7.2 प्र. 1–2'], ['समतुल्य अपूर्णांक', 'सराव 7.3 प्र. 1–4'], ['सोपे रूप', 'सराव 7.3 प्र. 5–7'], ['अपूर्णांकांची तुलना', 'सराव 7.4 प्र. 1–3'], ['सराव आणि प्रश्नमंजुषा', 'पाठाची उजळणी']]
      },
      cell: {
        subjectKey: 'science', cls: '8', subject: 'विज्ञान', topic: 'पेशी: रचना आणि कार्ये', period: 2, duration: 40,
        outcomes: ['पेशीच्या मुख्य भागांची नावे सांगू शकतील', 'वनस्पती पेशी आणि प्राणी पेशी यांची तुलना करू शकतील', 'पेशीला जीवनाचे मूलभूत एकक का म्हणतात ते स्पष्ट करू शकतील'],
        prev: 'विद्यार्थ्यांना माहीत आहे की सजीव लहान भागांनी बनलेले असतात आणि त्यांनी भिंग वापरले आहे.',
        materials: ['कांद्याचे साल आणि स्लाइड', 'सूक्ष्मदर्शक किंवा पेशीचा तक्ता', 'रंगीत पेन्सिली'], comp: ['critical', 'comm'],
        intro: 'विटांच्या भिंतीचा फोटो आणि सूक्ष्मदर्शकाखालील कांद्याचे साल दाखवा. विचारा: सजीव कशाचे बनलेले असतात?',
        steps: [
          ['कांद्याच्या सालीची स्लाइड किंवा तक्ता दाखवा; पेशीभित्तिका, केंद्रक आणि पेशीद्रव्य दाखवा.', 'निरीक्षण करून जे दिसते ते काढा; दोन भागांची नावे लिहा.', 12],
          ['फळ्यावर व्हेन आकृतीने वनस्पती आणि प्राणी पेशींची तुलना करा.', 'जोडीत व्हेन आकृती भरा: भित्तिका, हरितलवक, रिक्तिका, केंद्रक.', 13],
          ['"शहर" या तुलनेने पेशीचे भाग आणि त्यांची कामे समजावा.', 'भागांची कार्डे त्यांच्या कार्यांशी जुळवा.', 10]
        ],
        recap: 'झटपट प्रश्न: पेशीचे नियंत्रण करणारा भाग; फक्त वनस्पतींमध्ये असणारा भाग.',
        assess: 'पाच भागांसह वनस्पती पेशीचे चित्र काढून नावे लिहा.', hw: 'NCERT पाठ 8, प्रश्न 1 ते 5.',
        e5: { engage: ['विटांची भिंत की कांद्याचे साल: सजीव कशाचे बनलेले असतात?', 5, 'फोटो, कांद्याचे साल'], explore: ['गटात कांद्याच्या सालीची स्लाइड पाहून चित्र काढा.', 12, 'सूक्ष्मदर्शक किंवा तक्ता'], explain: ['पेशीचे भाग आणि त्यांची कामे; वनस्पती पेशी आणि प्राणी पेशी.', 10, 'फळा, पेशीचा तक्ता'], elaborate: ['माती किंवा कागदाने पेशीचे प्रतिरूप बनवा.', 8, 'माती, कागद'], evaluate: ['रिकाम्या पेशी आकृतीत नावे लिहा.', 5, 'वर्कशीट'] },
        support: 'नकलेसाठी नावे असलेली आकृती द्या; पाचऐवजी तीन भाग विचारा.', extension: 'पानाच्या पेशीत असे काय आहे जे गालाच्या पेशीत नाही आणि का, ते शोधा.',
        week: [['पेशीचा शोध; सूक्ष्मदर्शक', '8.1 वाचा'], ['पेशीचा आकार आणि आकारमान', 'तीन पेशी काढा'], ['पेशीचे भाग', 'प्र. 1–3'], ['वनस्पती पेशी आणि प्राणी पेशी', 'व्हेन आकृती'], ['कांद्याच्या सालीचे प्रात्यक्षिक', 'प्रयोगवही'], ['उजळणी आणि प्रश्नमंजुषा', 'पाठाची उजळणी']]
      },
      poem: {
        subjectKey: 'english', cls: '5', subject: 'इंग्रजी', topic: 'कविता: My Shadow', period: 4, duration: 35,
        outcomes: ['कविता लयीत मोठ्याने वाचू शकतील', 'यमक जुळणारे शब्द शोधून सावली काय करते ते सांगू शकतील', 'स्वतःच्या सावलीवर चार ओळी लिहू शकतील'],
        prev: 'विद्यार्थ्यांनी उन्हात आपली सावली पाहिली आहे आणि sun-fun सारखे यमक शब्द माहीत आहेत.',
        materials: ['पाठ्यपुस्तक', 'टॉर्च', 'कवितेचा तक्ता'], comp: ['creativity', 'comm'],
        intro: 'अंधाऱ्या कोपऱ्यात टॉर्च लावून हातांच्या सावल्या बनवा. विचारा: तुमची सावली कधी उंच होते?',
        steps: [
          ['हावभावांसह कविता दोनदा मोठ्याने वाचा; कठीण शब्द समजावा.', 'ऐका, मग समूहात वाचा आणि ओळी अभिनयाने दाखवा.', 12],
          ['विचारा: मूल जे करते ते सावली काय करते? यमक जोड्या शोधा.', 'जोडीत यमक शब्द अधोरेखित करा; प्रत्येकी एक जोडी सांगा.', 13],
          ['फळ्यावर माझ्या सावलीवर चार नमुना ओळी लिहा.', 'आपल्या सावलीवर चार ओळी लिहा आणि जोडीदाराला वाचून दाखवा.', 10]
        ],
        recap: 'वर्ग एकत्र पहिले कडवे म्हणतो; एक गट मूकाभिनय करतो.',
        assess: 'तोंडी: कवितेवर तीन प्रश्न; लिहिलेल्या चार ओळी तपासा.', hw: 'पहिले कडवे पाठ करा; दुपारी आणि संध्याकाळी 5 वाजता आपली सावली काढा.',
        e5: { engage: ['टॉर्चने हातांच्या सावल्या: सावली कशामुळे पडते?', 5, 'टॉर्च'], explore: ['जोडीत कविता वाचा आणि न समजणारे शब्द खुणा करा.', 8, 'पाठ्यपुस्तक'], explain: ['प्रत्येक कडव्याचा अर्थ; यमक शब्द; लय.', 10, 'कवितेचा तक्ता'], elaborate: ['स्वतःच्या सावलीवर चार ओळी लिहा.', 8, 'वही'], evaluate: ['एक कडवे म्हणा; दोन प्रश्नांची उत्तरे द्या.', 4, 'कवितेचा तक्ता'] },
        support: 'जोडीदारासोबत वाचा; चार ओळींसाठी शब्दसंग्रह द्या.', extension: 'दुपारी सावली लहान आणि संध्याकाळी लांब का असते ते शोधा.',
        week: [['कविता: वाचा आणि आनंद घ्या', 'घरी मोठ्याने वाचा'], ['नवे शब्द आणि यमक', 'पाच यमक जोड्या लिहा'], ['आकलन प्रश्न', 'प्र. 1–4'], ['लेखन: माझी सावली', 'चार ओळी पूर्ण करा'], ['व्याकरण: कवितेतील नामे', 'वर्कशीट'], ['पठण आणि गंमत', 'कडवे 1 पाठ करा']]
      },
      medieval: {
        subjectKey: 'social', cls: '7', subject: 'समाजशास्त्र', topic: 'हजार वर्षांतील बदलांचा मागोवा', period: 5, duration: 40,
        outcomes: ['"हिंदुस्तान" या शब्दाचा अर्थ काळानुसार कसा बदलला ते स्पष्ट करू शकतील', 'ऐतिहासिक नकाशा वाचून आधुनिक नकाशाशी तुलना करू शकतील', 'मध्ययुगासाठी इतिहासकार वापरत असलेल्या साधनांची यादी करू शकतील'],
        prev: 'विद्यार्थ्यांना इयत्ता सहावीतील प्राचीन काळ माहीत आहे आणि ते भारताचा नकाशा वाचू शकतात.',
        materials: ['दोन नकाशे: अल-इद्रिसी (1154) आणि आधुनिक नकाशा', 'पाठ्यपुस्तक', 'अॅटलस'], comp: ['critical', 'comm'],
        intro: 'अल-इद्रिसीचा 1154 चा नकाशा उलटा दाखवा. विचारा: दक्षिण भारत सापडतो का?',
        steps: [
          ['दोन नकाशांची तुलना: नावे, आकार, काय नाही.', 'जोडीत तीन फरक शोधा आणि नकाशे का बदलतात ते सांगा.', 12],
          ['शब्द कसे बदलतात ते सांगा: मिनहाज-इ-सिराज, बाबर आणि अमीर खुसरो यांचा "हिंदुस्तान".', 'वहीत तीन अर्थांची कालरेषा बनवा.', 13],
          ['साधने: हस्तलिखिते, नाणी, शिलालेख, वास्तू; नक्कल करताना मजकूर का बदलला.', 'साधनांची कार्डे लिखित आणि भौतिक साधनांत वर्गवारी करा.', 10]
        ],
        recap: 'झटपट प्रश्नमंजुषा: पंजाब, हरियाणा आणि गंगा-यमुना प्रदेशासाठी "हिंदुस्तान" कोणी वापरले?',
        assess: 'ठिकाणाच्या नावाचा अर्थ का बदलू शकतो याची दोन कारणे लिहा.', hw: 'NCERT पाठ 1, "Let\'s recall" प्रश्न 1 ते 3.',
        e5: { engage: ['1154 चा उलटा नकाशा: काय दिसते?', 5, 'नकाशाची प्रत'], explore: ['गटात जुना आणि नवा नकाशा यांची तुलना करा.', 10, 'दोन नकाशे'], explain: ['बदलणारी नावे आणि अर्थ; या काळाची साधने.', 12, 'पाठ्यपुस्तक, फळा'], elaborate: ['"हिंदुस्तान" शब्दाची कालरेषा काढा.', 8, 'वही'], evaluate: ['ठिकाणांच्या नावांचा अर्थ बदलण्याची दोन कारणे.', 5, 'कागदाच्या चिठ्ठ्या'] },
        support: 'नावे आधीच लिहिलेला नकाशा द्या; एक फरक विचारा.', extension: '500 वर्षांपूर्वी तुमच्या गावाला किंवा राज्याला काय म्हणत ते शोधा.',
        week: [['जुने नकाशे आणि नवे नकाशे', '1.1 वाचा'], ['नवे आणि जुने शब्द: हिंदुस्तान', 'कालरेषा'], ['इतिहासकार आणि त्यांची साधने', 'प्र. 1–3'], ['नवे सामाजिक आणि राजकीय गट', '1.3 वाचा'], ['प्रदेश आणि साम्राज्य; जुने आणि नवे धर्म', 'थोडक्यात टिपा'], ['उजळणी आणि नकाशा काम', 'पाच ठिकाणे दाखवा']]
      },
      story: {
        subjectKey: 'language', cls: '4', subject: 'मराठी', topic: 'गोष्ट: तहानलेला कावळा', period: 1, duration: 35,
        outcomes: ['गोष्ट योग्य क्रमाने पुन्हा सांगू शकतील', 'पाच नव्या शब्दांचे अर्थ सांगू शकतील', 'कावळ्याने काय केले आणि ते का जमले ते सांगू शकतील'],
        prev: 'विद्यार्थी छोटी वाक्ये वाचू शकतात आणि घरी लोककथा ऐकल्या आहेत.',
        materials: ['गोष्टीची चित्रकार्डे', 'एक माठ, पाणी आणि खडे', 'पाठ्यपुस्तक'], comp: ['critical', 'creativity', 'comm'],
        intro: 'थोडे पाणी असलेला माठ आणि एक दगड दाखवा. विचारा: पक्षी हे पाणी कसे पिऊ शकेल?',
        steps: [
          ['चित्रकार्डे आणि आवाजातील बदलांसह गोष्ट सांगा.', 'ऐका; दोन ठिकाणी पुढे काय होईल याचा अंदाज करा.', 10],
          ['गोष्ट मोठ्याने वाचा; हावभावांनी नवे शब्द समजावा.', 'जोडीत वाचा; नवे शब्द अधोरेखित करा; दोन शब्दांची वाक्ये बनवा.', 15],
          ['माठाने खड्यांचा प्रयोग करा.', 'एक एक खडा टाका, पाणी वर येताना पाहा आणि ते का होते ते सांगा.', 10]
        ],
        recap: 'फळ्यावर चित्रकार्डे क्रमाने लावा.',
        assess: 'जोडीदाराला पाच वाक्यांत गोष्ट पुन्हा सांगा.', hw: 'कावळा आणि माठ काढा; तीन वाक्ये लिहा.',
        e5: { engage: ['थोडे पाणी असलेला माठ: पक्षी ते कसे पिणार?', 5, 'माठ, पाणी'], explore: ['गटात खडे टाकून पाहा: पाणी वर येते का?', 8, 'माठ, खडे'], explain: ['गोष्ट वाचा; नवे शब्द आणि गोष्टीचा बोध.', 10, 'पाठ्यपुस्तक, चित्रकार्डे'], elaborate: ['तिघांच्या गटात गोष्टीचे नाट्य करा.', 8, 'चित्रकार्डे'], evaluate: ['पाच वाक्यांत गोष्ट पुन्हा सांगा.', 4, 'चित्रकार्डे'] },
        support: 'चित्रकार्डे क्रमाने द्या; त्यांच्या मदतीने सांगू द्या.', extension: 'शेवट बदला: खडे नसते तर काय झाले असते?',
        week: [['गोष्ट ऐका', 'घरी सांगा'], ['वाचा; नवे शब्द', 'पाच शब्द, पाच वाक्ये'], ['खड्यांचा प्रयोग आणि तो का जमतो', 'चित्र काढा'], ['गोष्टीचे नाट्य', 'आपले संवाद पाठ करा'], ['स्वतःचा शेवट लिहा', 'शेवट पूर्ण करा'], ['उजळणी आणि मोठ्याने वाचन', 'पान 1 मोठ्याने वाचा']]
      },
      ai: {
        subjectKey: 'ai', cls: '9', subject: 'कृत्रिम बुद्धिमत्ता', topic: 'AI म्हणजे काय?', period: 6, duration: 40,
        outcomes: ['ठरलेले नियम पाळणारे यंत्र आणि डेटावरून शिकणारे यंत्र यांतील फरक सांगू शकतील', 'रोजच्या जीवनातील AI चे पाच उपयोग सांगू शकतील', 'AI चा एक फायदा आणि एक धोका यांवर चर्चा करू शकतील'],
        prev: 'विद्यार्थी स्मार्टफोन, नकाशे, व्हॉइस असिस्टंट आणि व्हिडिओ अॅप वापरतात.',
        materials: ['प्रोजेक्टर किंवा फोन', 'रोजच्या कामांची कार्डे', 'तक्ता कागद'], comp: ['critical', 'digital', 'comm'],
        intro: 'विचारा: तुमचा फोन चेहरा पाहून कसा उघडतो? व्हिडिओ अॅपला तुम्हाला काय आवडते हे कसे कळते?',
        steps: [
          ['सोप्या शब्दांत AI ची व्याख्या सांगा: डेटामधून नमुने शिकून निर्णय घेणारी यंत्रे.', 'स्वतःच्या फोनमधून प्रत्येकी दोन उदाहरणे द्या.', 10],
          ['कामांची वर्गवारी: कॅल्क्युलेटर (ठरलेले नियम) आणि स्पॅम फिल्टर (शिकणारे). डेटा, नमुना, अंदाज समजावा.', 'गटात कामांची कार्डे "ठरलेले नियम" आणि "डेटावरून शिकते" अशी लावा.', 15],
          ['फायदे आणि धोके यांवर चर्चा: शेती आणि आरोग्यात मदत; पक्षपात, गोपनीयता, खोटे व्हिडिओ.', 'प्रत्येक गट तक्ता कागदावर एक फायदा आणि एक धोका लिहितो.', 10]
        ],
        recap: 'तीन विधाने: AI की AI नाही? अंगठा वर किंवा खाली.',
        assess: 'या आठवड्यात पाहिलेले AI चे पाच उपयोग आणि एक धोका लिहा.', hw: 'कुटुंबातील एकाला विचारा की ते कोणत्या अॅपवर सर्वाधिक विश्वास ठेवतात आणि का; ते AI वापरते का ते नोंदवा.',
        e5: { engage: ['तुमचा फोन चेहरा पाहून कसा उघडतो?', 5, 'फोन'], explore: ['कामांची कार्डे लावा: ठरलेले नियम की शिकणे?', 10, 'कामांची कार्डे'], explain: ['AI म्हणजे काय: डेटा, नमुने, अंदाज; कुठे वापरले जाते.', 12, 'प्रोजेक्टर'], elaborate: ['कागदावर तुमच्या शाळेसाठी साधा AI मदतनीस रचा.', 8, 'तक्ता कागद'], evaluate: ['AI चे पाच उपयोग आणि एक धोका.', 5, 'वही'] },
        support: 'उदाहरणे तयार द्या; विद्यार्थी फक्त वर्गवारी करतात.', extension: 'AI ने चुकीचा निर्णय घेतल्याचे एक उदाहरण शोधा आणि का ते सांगा.',
        week: [['बुद्धिमत्ता म्हणजे काय? माणूस आणि यंत्र', 'आज केलेल्या पाच हुशार गोष्टींची यादी'], ['AI म्हणजे काय? नियम की शिकणे', 'दहा कामांची वर्गवारी'], ['आपल्या भोवतालचे AI', 'AI चे पाच उपयोग'], ['डेटा, नमुने आणि अंदाज', 'नमुना वर्कशीट'], ['AI चे फायदे आणि धोके', 'एक पानाची टीप'], ['प्रकल्प: आमच्या शाळेसाठी AI मदतनीस', 'पोस्टर']]
      }
    }
  },
  gu: {
    bloom: {
      remember: ['વ્યાખ્યા આપવી', 'યાદી બનાવવી', 'નામ આપવું', 'યાદ કરીને કહેવું', 'નામ લખવાં', 'વિધાન કરવું'],
      understand: ['સમજાવવું', 'વર્ણન કરવું', 'સાર કહેવો', 'વર્ગીકરણ કરવું', 'સરખામણી કરવી', 'ઉદાહરણ આપવાં'],
      apply: ['ઉપયોગ કરવો', 'ઉકેલવું', 'ગણતરી કરવી', 'કરી બતાવવું', 'દર્શાવવું', 'માપવું'],
      analyse: ['વિશ્લેષણ કરવું', 'તફાવત પાડવો', 'પેટર્ન શોધવી', 'તપાસવું', 'વર્ગવારી કરવી', 'અનુમાન કરવું'],
      evaluate: ['પરખવું', 'સમર્થન આપવું', 'નિર્ણય લેવો', 'ચકાસવું', 'પક્ષે દલીલ કરવી', 'મૂલ્યાંકન કરવું'],
      create: ['ડિઝાઇન કરવી', 'બનાવવું', 'આયોજન કરવું', 'રચના કરવી', 'ઊભું કરવું', 'શોધ કરવી']
    },
    materials: ['કાળું પાટિયું અને ચોક', 'પાઠ્યપુસ્તક', 'ચાર્ટ કે પોસ્ટર', 'ફ્લૅશકાર્ડ', 'વર્કશીટ', 'પ્રોજેક્ટર કે સ્માર્ટબોર્ડ', 'સાચી વસ્તુઓ', 'નોટબુક અને પેન્સિલ'],
    ideas: {
      maths: ['કાગળથી બનાવો: વાળીને કે કાપીને આકાર દ્વારા ખ્યાલ બતાવો', 'એક અઘરા પ્રશ્ન પર વિચારો-જોડીમાં બોલો-બધાને કહો', 'ગણિત રિલે: જૂથનો દરેક સભ્ય બોર્ડ પર એક પગલું ઉકેલે', 'પહેલાં અંદાજ કરો, પછી માપીને સરખાવો', 'આ ગણિત બજાર કે રસોડામાં શોધો અને એક ઉદાહરણ લાવો'],
      science: ['ટૂંકા નિદર્શન સાથે અનુમાન-અવલોકન-સમજૂતી', 'સાચી વસ્તુ જોઈને ચિત્ર દોરો અને નામ લખો', 'જૂથ પ્રયોગ, સૌ માટે એક પરિણામ કોષ્ટક', 'કાર્ડને જૂથોમાં ગોઠવો અને નિયમ સમજાવો', 'દરેક જૂથમાંથી એક મિનિટનો "વિજ્ઞાન રિપોર્ટર"'],
      english: ['જોડીમાં મોટેથી વાંચો અને ભૂમિકા બદલો', 'ચારના જૂથમાં દૃશ્ય ભજવો', 'શબ્દ શોધ: પાંચ નવા શબ્દો શોધી અર્થનો અંદાજ કરો', 'પોતાના શબ્દોમાં ત્રણ લીટી લખો', 'હોટ સીટ: એક વિદ્યાર્થી પાત્ર બનીને જવાબ આપે'],
      social: ['ભોંય પર ચોકથી સમયરેખા', 'નકશા કાર્ય: પાંચ સ્થળો દર્શાવો', 'ભૂમિકા ભજવણી: એ સમયનો એક દિવસ', 'ત્યારે અને હવે: T-ચાર્ટમાં સરખામણી', 'સ્થાનિક જોડાણ: ઘરના વડીલને પૂછીને જણાવો'],
      language: ['વાર્તા વર્તુળ: દરેક વિદ્યાર્થી એક લીટી ઉમેરે', 'ચિત્ર વાત: ત્રણ વાક્યોમાં વર્ણન કરો', 'પ્રાસવાળા શબ્દો શોધી જોડકણું બનાવો', 'જોડીમાં શ્રુતલેખન; એકબીજાનું તપાસો', 'હાથની કઠપૂતળીથી વાર્તા ફરી કહો'],
      ai: ['AI ઓળખો: AI વાપરતી પાંચ ઍપની યાદી', 'માણસ કે મશીન: કામોને વર્ગવારી કરો', 'પેટર્ન રમત: ઉદાહરણો પરથી નિયમ ધારો', 'કાગળ પર સાદી ચૅટબોટ સ્ક્રિપ્ટ લખો', 'ચર્ચા: શું AI હંમેશાં સાચું હોય?'],
      general: ['વિચારો-જોડીમાં બોલો-કહો: એક મિનિટ એકલા, બે મિનિટ જોડીમાં', 'એક્ઝિટ સ્લિપ: એક વાત શીખ્યો, એક પ્રશ્ન છે', 'ગૅલરી વૉક: જૂથો પોતાનું કામ દીવાલ પર લગાવે', 'સ્લેટ સાથે ટીમ ક્વિઝ', 'સાથી શિક્ષણ: જોડીદારને સમજાવો']
    },
    samples: {
      fractions: {
        subjectKey: 'maths', cls: '6', subject: 'ગણિત', topic: 'અપૂર્ણાંક: સમતુલ્ય અપૂર્ણાંક', period: 3, duration: 40,
        outcomes: ['સમતુલ્ય અપૂર્ણાંક એટલે શું તે સમજાવી શકશે', 'ગુણાકાર કે ભાગાકારથી સમતુલ્ય અપૂર્ણાંક બનાવી શકશે', 'બે અપૂર્ણાંક સમતુલ્ય છે કે નહીં તે ચકાસી શકશે'],
        prev: 'વિદ્યાર્થીઓ 1/2 અને 3/4 જેવા અપૂર્ણાંક વાંચી-લખી શકે છે અને આકારમાં રંગી શકે છે.',
        materials: ['કાગળની પટ્ટીઓ', 'કાળું પાટિયું અને ચોક', 'અપૂર્ણાંક ચાર્ટ'], comp: ['critical', 'collab'],
        intro: '2 સરખા ટુકડા કરેલી રોટલી અને 4 ટુકડા કરેલી બીજી રોટલી બતાવો. પૂછો: શું 1/2 અને 2/4 સરખા છે?',
        steps: [
          ['કાગળની પટ્ટીને અડધી, પછી ચાર ભાગે વાળો; બોર્ડ પર 1/2 = 2/4 બતાવો.', 'પોતાની પટ્ટી વાળી 1/2 અને 2/4 રંગો અને જોડીમાં સરખાવો.', 10],
          ['નિયમ સમજાવો: અંશ અને છેદને એક જ સંખ્યાથી ગુણો કે ભાગો. બે ઉદાહરણ કરો.', 'નોટબુકમાં 2/3 ના ત્રણ સમતુલ્ય અપૂર્ણાંક બનાવો.', 15],
          ['અપૂર્ણાંકની જોડીઓ આપો; કઈ સમતુલ્ય છે અને કેવી રીતે ખબર પડી તે પૂછો.', 'ત્રાંસા ગુણાકારથી ચકાસો; કારણ સાથે હા કે ના કહો.', 10]
        ],
        recap: 'બોર્ડ પર ત્રણ ઝડપી પ્રશ્નો: સમતુલ્ય કે નહીં? વિદ્યાર્થીઓ અંગૂઠો ઉપર કે નીચે બતાવે.',
        assess: 'એક્ઝિટ સ્લિપ: 3/5 ના બે સમતુલ્ય અપૂર્ણાંક લખો.', hw: 'NCERT સ્વાધ્યાય 7.3, પ્રશ્ન 1 થી 4.',
        e5: { engage: ['રોટલીનો કોયડો: શું 1/2 અને 2/4 સરખા છે? મત આપો અને કારણ કહો.', 5, 'કાગળની બે રોટલી'], explore: ['જોડીમાં પટ્ટીઓ વાળી 1/2 જેટલા અપૂર્ણાંક શોધો.', 10, 'કાગળની પટ્ટીઓ'], explain: ['નિયમ: અંશ અને છેદને એક જ સંખ્યાથી ગુણો કે ભાગો.', 10, 'કાળું પાટિયું'], elaborate: ['અપૂર્ણાંક ચાર્ટ પર સમતુલ્ય અપૂર્ણાંક શોધી પેટર્ન કહો.', 10, 'અપૂર્ણાંક ચાર્ટ'], evaluate: ['એક્ઝિટ સ્લિપ: 3/5 ના બે સમતુલ્ય અપૂર્ણાંક.', 5, 'કાગળની ચિઠ્ઠીઓ'] },
        support: 'તૈયાર અપૂર્ણાંક પટ્ટીઓ આપો; ફક્ત અડધા અને પા પર કામ કરો.', extension: '1/2 અને 1 વચ્ચેના ત્રણ અપૂર્ણાંક શોધો અને તે ક્રમમાં છે તે સાબિત કરો.',
        week: [['સંખ્યારેખા પર અપૂર્ણાંક', 'સ્વા. 7.1 પ્ર. 1–3'], ['શુદ્ધ અને અશુદ્ધ અપૂર્ણાંક', 'સ્વા. 7.2 પ્ર. 1–2'], ['સમતુલ્ય અપૂર્ણાંક', 'સ્વા. 7.3 પ્ર. 1–4'], ['સાદું રૂપ', 'સ્વા. 7.3 પ્ર. 5–7'], ['અપૂર્ણાંકની સરખામણી', 'સ્વા. 7.4 પ્ર. 1–3'], ['મહાવરો અને ક્વિઝ', 'પ્રકરણનું પુનરાવર્તન']]
      },
      cell: {
        subjectKey: 'science', cls: '8', subject: 'વિજ્ઞાન', topic: 'કોષ: રચના અને કાર્યો', period: 2, duration: 40,
        outcomes: ['કોષના મુખ્ય ભાગોનાં નામ આપી શકશે', 'વનસ્પતિકોષ અને પ્રાણીકોષની સરખામણી કરી શકશે', 'કોષને જીવનનો મૂળભૂત એકમ કેમ કહે છે તે સમજાવી શકશે'],
        prev: 'વિદ્યાર્થીઓ જાણે છે કે સજીવો નાના ભાગોના બનેલા છે અને તેમણે બિલોરી કાચ વાપર્યો છે.',
        materials: ['ડુંગળીની છાલ અને સ્લાઇડ', 'સૂક્ષ્મદર્શક કે કોષનો ચાર્ટ', 'રંગીન પેન્સિલો'], comp: ['critical', 'comm'],
        intro: 'ઈંટની દીવાલનો ફોટો અને સૂક્ષ્મદર્શક નીચેની ડુંગળીની છાલ બતાવો. પૂછો: સજીવો શાના બનેલા છે?',
        steps: [
          ['ડુંગળીની છાલની સ્લાઇડ કે ચાર્ટ બતાવો; કોષદીવાલ, કોષકેન્દ્ર અને કોષરસ દર્શાવો.', 'જે દેખાય તે અવલોકન કરી દોરો; બે ભાગનાં નામ લખો.', 12],
          ['બોર્ડ પર વેન આકૃતિથી વનસ્પતિ અને પ્રાણીકોષની સરખામણી કરો.', 'જોડીમાં વેન આકૃતિ ભરો: દીવાલ, હરિતકણ, રસધાની, કોષકેન્દ્ર.', 13],
          ['"શહેર"ની સરખામણીથી કોષના ભાગો અને તેમનાં કામ સમજાવો.', 'ભાગોનાં કાર્ડને તેમનાં કાર્યો સાથે જોડો.', 10]
        ],
        recap: 'ઝડપી પ્રશ્નો: કોષનું નિયંત્રણ કરતો ભાગ; ફક્ત વનસ્પતિમાં હોય તે ભાગ.',
        assess: 'પાંચ ભાગ સાથે વનસ્પતિકોષ દોરી નામ લખો.', hw: 'NCERT પ્રકરણ 8, પ્રશ્ન 1 થી 5.',
        e5: { engage: ['ઈંટની દીવાલ કે ડુંગળીની છાલ: સજીવો શાના બનેલા છે?', 5, 'ફોટો, ડુંગળીની છાલ'], explore: ['જૂથમાં ડુંગળીની છાલની સ્લાઇડ જોઈ દોરો.', 12, 'સૂક્ષ્મદર્શક કે ચાર્ટ'], explain: ['કોષના ભાગો અને તેમનાં કામ; વનસ્પતિકોષ અને પ્રાણીકોષ.', 10, 'કાળું પાટિયું, કોષનો ચાર્ટ'], elaborate: ['માટી કે કાગળથી કોષનું મોડેલ બનાવો.', 8, 'માટી, કાગળ'], evaluate: ['ખાલી કોષ આકૃતિમાં નામ લખો.', 5, 'વર્કશીટ'] },
        support: 'નકલ કરવા નામવાળી આકૃતિ આપો; પાંચને બદલે ત્રણ ભાગ પૂછો.', extension: 'પાનના કોષમાં એવું શું છે જે ગાલના કોષમાં નથી અને કેમ, તે શોધો.',
        week: [['કોષની શોધ; સૂક્ષ્મદર્શક', '8.1 વાંચો'], ['કોષનો આકાર અને કદ', 'ત્રણ કોષ દોરો'], ['કોષના ભાગો', 'પ્ર. 1–3'], ['વનસ્પતિકોષ અને પ્રાણીકોષ', 'વેન આકૃતિ'], ['ડુંગળીની છાલનો પ્રયોગ', 'પ્રયોગપોથી'], ['પુનરાવર્તન અને ક્વિઝ', 'પ્રકરણનું પુનરાવર્તન']]
      },
      poem: {
        subjectKey: 'english', cls: '5', subject: 'અંગ્રેજી', topic: 'કવિતા: My Shadow', period: 4, duration: 35,
        outcomes: ['કવિતા લયમાં મોટેથી વાંચી શકશે', 'પ્રાસવાળા શબ્દો શોધી પડછાયો શું કરે છે તે કહી શકશે', 'પોતાના પડછાયા વિશે ચાર લીટી લખી શકશે'],
        prev: 'વિદ્યાર્થીઓએ તડકામાં પોતાનો પડછાયો જોયો છે અને sun-fun જેવા પ્રાસવાળા શબ્દો જાણે છે.',
        materials: ['પાઠ્યપુસ્તક', 'ટોર્ચ', 'કવિતાનો ચાર્ટ'], comp: ['creativity', 'comm'],
        intro: 'અંધારા ખૂણામાં ટોર્ચ કરીને હાથના પડછાયા બનાવો. પૂછો: તમારો પડછાયો ક્યારે ઊંચો થાય છે?',
        steps: [
          ['હાવભાવ સાથે કવિતા બે વાર મોટેથી વાંચો; અઘરા શબ્દો સમજાવો.', 'સાંભળો, પછી સમૂહમાં વાંચો અને લીટીઓ ભજવો.', 12],
          ['પૂછો: બાળક જે કરે તે પડછાયો શું કરે? પ્રાસની જોડીઓ શોધો.', 'જોડીમાં પ્રાસવાળા શબ્દો નીચે લીટી કરો; દરેક એક જોડી કહે.', 13],
          ['બોર્ડ પર મારા પડછાયા વિશે ચાર નમૂનારૂપ લીટી લખો.', 'પોતાના પડછાયા વિશે ચાર લીટી લખી જોડીદારને વાંચી સંભળાવો.', 10]
        ],
        recap: 'આખો વર્ગ સાથે પહેલો શ્લોક બોલે; એક જૂથ મૂક અભિનય કરે.',
        assess: 'મૌખિક: કવિતા પર ત્રણ પ્રશ્નો; લખેલી ચાર લીટી તપાસો.', hw: 'પહેલો શ્લોક મોઢે કરો; બપોરે અને સાંજે 5 વાગ્યે પોતાનો પડછાયો દોરો.',
        e5: { engage: ['ટોર્ચથી હાથના પડછાયા: પડછાયો શાથી બને?', 5, 'ટોર્ચ'], explore: ['જોડીમાં કવિતા વાંચી ન સમજાતા શબ્દો પર નિશાની કરો.', 8, 'પાઠ્યપુસ્તક'], explain: ['દરેક શ્લોકનો અર્થ; પ્રાસવાળા શબ્દો; લય.', 10, 'કવિતાનો ચાર્ટ'], elaborate: ['પોતાના પડછાયા વિશે ચાર લીટી લખો.', 8, 'નોટબુક'], evaluate: ['એક શ્લોક બોલો; બે પ્રશ્નોના જવાબ આપો.', 4, 'કવિતાનો ચાર્ટ'] },
        support: 'સાથી સાથે વાંચો; ચાર લીટી માટે શબ્દભંડોળ આપો.', extension: 'બપોરે પડછાયો ટૂંકો અને સાંજે લાંબો કેમ હોય તે શોધો.',
        week: [['કવિતા: વાંચો અને માણો', 'ઘરે મોટેથી વાંચો'], ['નવા શબ્દો અને પ્રાસ', 'પાંચ પ્રાસ જોડી લખો'], ['સમજના પ્રશ્નો', 'પ્ર. 1–4'], ['લેખન: મારો પડછાયો', 'ચાર લીટી પૂરી કરો'], ['વ્યાકરણ: કવિતામાં નામ', 'વર્કશીટ'], ['પઠન અને મજા', 'શ્લોક 1 મોઢે કરો']]
      },
      medieval: {
        subjectKey: 'social', cls: '7', subject: 'સામાજિક વિજ્ઞાન', topic: 'હજાર વર્ષના પરિવર્તનની શોધ', period: 5, duration: 40,
        outcomes: ['"હિંદુસ્તાન" શબ્દનો અર્થ સમય સાથે કેવી રીતે બદલાયો તે સમજાવી શકશે', 'ઐતિહાસિક નકશો વાંચી આધુનિક નકશા સાથે સરખાવી શકશે', 'મધ્યકાળ માટે ઇતિહાસકારો વાપરે છે તે સ્રોતોની યાદી આપી શકશે'],
        prev: 'વિદ્યાર્થીઓ ધોરણ 6 નો પ્રાચીન કાળ જાણે છે અને ભારતનો નકશો વાંચી શકે છે.',
        materials: ['બે નકશા: અલ-ઇદ્રીસી (1154) અને આધુનિક નકશો', 'પાઠ્યપુસ્તક', 'ઍટલાસ'], comp: ['critical', 'comm'],
        intro: 'અલ-ઇદ્રીસીનો 1154 નો નકશો ઊંધો બતાવો. પૂછો: દક્ષિણ ભારત મળે છે?',
        steps: [
          ['બે નકશાની સરખામણી: નામો, આકાર, શું નથી.', 'જોડીમાં ત્રણ તફાવત શોધો અને નકશા કેમ બદલાય તે કહો.', 12],
          ['શબ્દો કેવી રીતે બદલાય તે સમજાવો: મિનહાજ-એ-સિરાજ, બાબર અને અમીર ખુસરોનું "હિંદુસ્તાન".', 'નોટબુકમાં ત્રણ અર્થોની સમયરેખા બનાવો.', 13],
          ['સ્રોતો: હસ્તપ્રતો, સિક્કા, શિલાલેખ, ઇમારતો; નકલ કરવાથી લખાણ કેમ બદલાયું.', 'સ્રોત કાર્ડને લિખિત અને ભૌતિક સ્રોતોમાં વહેંચો.', 10]
        ],
        recap: 'ઝડપી ક્વિઝ: પંજાબ, હરિયાણા અને ગંગા-યમુના વિસ્તાર માટે "હિંદુસ્તાન" કોણે વાપર્યું?',
        assess: 'સ્થળના નામનો અર્થ કેમ બદલાઈ શકે તેનાં બે કારણો લખો.', hw: 'NCERT પ્રકરણ 1, "Let\'s recall" પ્રશ્ન 1 થી 3.',
        e5: { engage: ['1154 નો ઊંધો નકશો: શું દેખાય છે?', 5, 'નકશાની પ્રિન્ટ'], explore: ['જૂથમાં જૂના અને નવા નકશાની સરખામણી કરો.', 10, 'બે નકશા'], explain: ['બદલાતાં નામ અને અર્થ; આ કાળના સ્રોતો.', 12, 'પાઠ્યપુસ્તક, કાળું પાટિયું'], elaborate: ['"હિંદુસ્તાન" શબ્દની સમયરેખા દોરો.', 8, 'નોટબુક'], evaluate: ['સ્થળનાં નામનો અર્થ બદલાવાનાં બે કારણો.', 5, 'કાગળની ચિઠ્ઠીઓ'] },
        support: 'નામ પહેલેથી લખેલો નકશો આપો; એક તફાવત પૂછો.', extension: '500 વર્ષ પહેલાં તમારા ગામ કે રાજ્યને શું કહેતા તે શોધો.',
        week: [['જૂના નકશા અને નવા નકશા', '1.1 વાંચો'], ['નવા અને જૂના શબ્દો: હિંદુસ્તાન', 'સમયરેખા'], ['ઇતિહાસકારો અને તેમના સ્રોતો', 'પ્ર. 1–3'], ['નવા સામાજિક અને રાજકીય જૂથો', '1.3 વાંચો'], ['પ્રદેશ અને સામ્રાજ્ય; જૂના અને નવા ધર્મો', 'ટૂંકી નોંધ'], ['પુનરાવર્તન અને નકશા કાર્ય', 'પાંચ સ્થળો દર્શાવો']]
      },
      story: {
        subjectKey: 'language', cls: '4', subject: 'ગુજરાતી', topic: 'વાર્તા: તરસ્યો કાગડો', period: 1, duration: 35,
        outcomes: ['વાર્તા સાચા ક્રમમાં ફરી કહી શકશે', 'પાંચ નવા શબ્દોના અર્થ કહી શકશે', 'કાગડાએ શું કર્યું અને તે કેમ કામ આવ્યું તે કહી શકશે'],
        prev: 'વિદ્યાર્થીઓ ટૂંકાં વાક્યો વાંચી શકે છે અને ઘરે લોકવાર્તાઓ સાંભળી છે.',
        materials: ['વાર્તાનાં ચિત્રકાર્ડ', 'એક ઘડો, પાણી અને કાંકરા', 'પાઠ્યપુસ્તક'], comp: ['critical', 'creativity', 'comm'],
        intro: 'થોડા પાણીવાળો ઘડો અને એક પથ્થર બતાવો. પૂછો: પક્ષી આ પાણી કેવી રીતે પી શકે?',
        steps: [
          ['ચિત્રકાર્ડ અને અવાજના ફેરફાર સાથે વાર્તા કહો.', 'સાંભળો; બે જગ્યાએ આગળ શું થશે તેનો અંદાજ કરો.', 10],
          ['વાર્તા મોટેથી વાંચો; હાવભાવથી નવા શબ્દો સમજાવો.', 'જોડીમાં વાંચો; નવા શબ્દો નીચે લીટી કરો; બે શબ્દોનાં વાક્ય બનાવો.', 15],
          ['ઘડા વડે કાંકરાનો પ્રયોગ કરો.', 'એક એક કાંકરો નાખો, પાણી ઉપર આવતું જુઓ અને તે કેમ થાય તે કહો.', 10]
        ],
        recap: 'બોર્ડ પર ચિત્રકાર્ડ ક્રમમાં ગોઠવો.',
        assess: 'જોડીદારને પાંચ વાક્યોમાં વાર્તા ફરી કહો.', hw: 'કાગડો અને ઘડો દોરો; ત્રણ વાક્યો લખો.',
        e5: { engage: ['થોડા પાણીવાળો ઘડો: પક્ષી કેવી રીતે પીશે?', 5, 'ઘડો, પાણી'], explore: ['જૂથમાં કાંકરાથી અજમાવો: પાણી ઉપર આવે છે?', 8, 'ઘડો, કાંકરા'], explain: ['વાર્તા વાંચો; નવા શબ્દો અને વાર્તાનો બોધ.', 10, 'પાઠ્યપુસ્તક, ચિત્રકાર્ડ'], elaborate: ['ત્રણના જૂથમાં વાર્તા ભજવો.', 8, 'ચિત્રકાર્ડ'], evaluate: ['પાંચ વાક્યોમાં વાર્તા ફરી કહો.', 4, 'ચિત્રકાર્ડ'] },
        support: 'ચિત્રકાર્ડ ક્રમમાં આપો; તેની મદદથી કહેવા દો.', extension: 'અંત બદલો: કાંકરા ન હોત તો શું થાત?',
        week: [['વાર્તા સાંભળો', 'ઘરે કહો'], ['વાંચો; નવા શબ્દો', 'પાંચ શબ્દો, પાંચ વાક્યો'], ['કાંકરાનો પ્રયોગ અને તે કેમ કામ આવે', 'ચિત્ર દોરો'], ['વાર્તા ભજવો', 'પોતાના સંવાદ યાદ કરો'], ['પોતાનો અંત લખો', 'અંત પૂરો કરો'], ['પુનરાવર્તન અને મોટેથી વાંચન', 'પાન 1 મોટેથી વાંચો']]
      },
      ai: {
        subjectKey: 'ai', cls: '9', subject: 'કૃત્રિમ બુદ્ધિમત્તા', topic: 'AI એટલે શું?', period: 6, duration: 40,
        outcomes: ['નક્કી નિયમો પાળતા મશીન અને ડેટામાંથી શીખતા મશીન વચ્ચેનો તફાવત કહી શકશે', 'રોજિંદા જીવનમાં AI ના પાંચ ઉપયોગ ગણાવી શકશે', 'AI નો એક ફાયદો અને એક જોખમ પર ચર્ચા કરી શકશે'],
        prev: 'વિદ્યાર્થીઓ સ્માર્ટફોન, નકશા, વૉઇસ આસિસ્ટન્ટ અને વિડિયો ઍપ વાપરે છે.',
        materials: ['પ્રોજેક્ટર કે ફોન', 'રોજિંદાં કામનાં કાર્ડ', 'ચાર્ટ પેપર'], comp: ['critical', 'digital', 'comm'],
        intro: 'પૂછો: તમારો ફોન ચહેરો જોઈને કેવી રીતે ખૂલે છે? વિડિયો ઍપને તમને શું ગમે છે તે કેવી રીતે ખબર પડે?',
        steps: [
          ['સાદા શબ્દોમાં AI ની વ્યાખ્યા આપો: ડેટામાંથી પેટર્ન શીખી નિર્ણય લેતાં મશીન.', 'પોતાના ફોનમાંથી દરેક બે ઉદાહરણ આપે.', 10],
          ['કામો વહેંચો: કૅલ્ક્યુલેટર (નક્કી નિયમો) અને સ્પૅમ ફિલ્ટર (શીખતું). ડેટા, પેટર્ન, અનુમાન સમજાવો.', 'જૂથમાં કામનાં કાર્ડ "નક્કી નિયમો" અને "ડેટામાંથી શીખે" માં ગોઠવો.', 15],
          ['ફાયદા અને જોખમોની ચર્ચા: ખેતી અને આરોગ્યમાં મદદ; પક્ષપાત, ગોપનીયતા, નકલી વિડિયો.', 'દરેક જૂથ ચાર્ટ પેપર પર એક ફાયદો અને એક જોખમ લખે.', 10]
        ],
        recap: 'ત્રણ વિધાનો: AI કે AI નહીં? અંગૂઠો ઉપર કે નીચે.',
        assess: 'આ અઠવાડિયે જોયેલા AI ના પાંચ ઉપયોગ અને એક જોખમ લખો.', hw: 'પરિવારના સભ્યને પૂછો કે તેઓ કઈ ઍપ પર સૌથી વધુ ભરોસો કરે છે અને કેમ; તે AI વાપરે છે કે નહીં તે નોંધો.',
        e5: { engage: ['તમારો ફોન ચહેરો જોઈને કેવી રીતે ખૂલે છે?', 5, 'ફોન'], explore: ['કામનાં કાર્ડ ગોઠવો: નક્કી નિયમો કે શીખવું?', 10, 'કામનાં કાર્ડ'], explain: ['AI એટલે શું: ડેટા, પેટર્ન, અનુમાન; ક્યાં વપરાય છે.', 12, 'પ્રોજેક્ટર'], elaborate: ['કાગળ પર તમારી શાળા માટે સાદો AI મદદગાર ડિઝાઇન કરો.', 8, 'ચાર્ટ પેપર'], evaluate: ['AI ના પાંચ ઉપયોગ અને એક જોખમ.', 5, 'નોટબુક'] },
        support: 'ઉદાહરણો તૈયાર આપો; વિદ્યાર્થીઓ ફક્ત વર્ગવારી કરે.', extension: 'AI એ ખોટો નિર્ણય લીધો હોય તેવું એક ઉદાહરણ શોધી કેમ તે સમજાવો.',
        week: [['બુદ્ધિ એટલે શું? માણસ અને મશીન', 'આજે કરેલાં પાંચ હોશિયાર કામની યાદી'], ['AI એટલે શું? નિયમો કે શીખવું', 'દસ કામોની વર્ગવારી'], ['આપણી આસપાસ AI', 'AI ના પાંચ ઉપયોગ'], ['ડેટા, પેટર્ન અને અનુમાન', 'પેટર્ન વર્કશીટ'], ['AI ના ફાયદા અને જોખમો', 'એક પાનાની નોંધ'], ['પ્રોજેક્ટ: અમારી શાળા માટે AI મદદગાર', 'પોસ્ટર']]
      }
    }
  },
  pa: {
    bloom: {
      remember: ['ਪਰਿਭਾਸ਼ਾ ਦੇਣਾ', 'ਸੂਚੀ ਬਣਾਉਣਾ', 'ਨਾਂ ਦੱਸਣਾ', 'ਯਾਦ ਕਰਕੇ ਦੱਸਣਾ', 'ਨਾਂ ਲਿਖਣਾ', 'ਬਿਆਨ ਕਰਨਾ'],
      understand: ['ਸਮਝਾਉਣਾ', 'ਵਰਣਨ ਕਰਨਾ', 'ਸਾਰ ਦੱਸਣਾ', 'ਵਰਗੀਕਰਨ ਕਰਨਾ', 'ਤੁਲਨਾ ਕਰਨਾ', 'ਉਦਾਹਰਨ ਦੇਣਾ'],
      apply: ['ਵਰਤਣਾ', 'ਹੱਲ ਕਰਨਾ', 'ਗਣਨਾ ਕਰਨਾ', 'ਕਰਕੇ ਦਿਖਾਉਣਾ', 'ਦਿਖਾਉਣਾ', 'ਮਾਪਣਾ'],
      analyse: ['ਵਿਸ਼ਲੇਸ਼ਣ ਕਰਨਾ', 'ਫ਼ਰਕ ਦੱਸਣਾ', 'ਪੈਟਰਨ ਲੱਭਣਾ', 'ਪਰਖਣਾ', 'ਛਾਂਟਣਾ', 'ਨਤੀਜਾ ਕੱਢਣਾ'],
      evaluate: ['ਪਰਖ ਕੇ ਰਾਏ ਦੇਣਾ', 'ਦਲੀਲ ਦੇਣਾ', 'ਫ਼ੈਸਲਾ ਕਰਨਾ', 'ਜਾਂਚਣਾ', 'ਹੱਕ ਵਿੱਚ ਦਲੀਲ ਦੇਣਾ', 'ਮੁਲਾਂਕਣ ਕਰਨਾ'],
      create: ['ਡਿਜ਼ਾਈਨ ਕਰਨਾ', 'ਬਣਾਉਣਾ', 'ਯੋਜਨਾ ਬਣਾਉਣਾ', 'ਰਚਨਾ ਕਰਨਾ', 'ਉਸਾਰਨਾ', 'ਕਾਢ ਕੱਢਣਾ']
    },
    materials: ['ਬਲੈਕਬੋਰਡ ਅਤੇ ਚਾਕ', 'ਪਾਠ-ਪੁਸਤਕ', 'ਚਾਰਟ ਜਾਂ ਪੋਸਟਰ', 'ਫਲੈਸ਼ਕਾਰਡ', 'ਵਰਕਸ਼ੀਟ', 'ਪ੍ਰੋਜੈਕਟਰ ਜਾਂ ਸਮਾਰਟਬੋਰਡ', 'ਅਸਲੀ ਚੀਜ਼ਾਂ', 'ਕਾਪੀ ਅਤੇ ਪੈਨਸਿਲ'],
    ideas: {
      maths: ['ਕਾਗਜ਼ ਨਾਲ ਬਣਾਓ: ਮੋੜ ਕੇ ਜਾਂ ਕੱਟ ਕੇ ਆਕਾਰ ਨਾਲ ਧਾਰਨਾ ਦਿਖਾਓ', 'ਇੱਕ ਔਖੇ ਸਵਾਲ ਤੇ ਸੋਚੋ-ਜੋੜੀ ਵਿੱਚ ਗੱਲ ਕਰੋ-ਸਭ ਨੂੰ ਦੱਸੋ', 'ਗਣਿਤ ਰਿਲੇ: ਸਮੂਹ ਦਾ ਹਰ ਮੈਂਬਰ ਬੋਰਡ ਤੇ ਇੱਕ ਕਦਮ ਹੱਲ ਕਰੇ', 'ਪਹਿਲਾਂ ਅੰਦਾਜ਼ਾ ਲਾਓ, ਫਿਰ ਮਾਪ ਕੇ ਮਿਲਾਓ', 'ਇਹ ਗਣਿਤ ਬਾਜ਼ਾਰ ਜਾਂ ਰਸੋਈ ਵਿੱਚ ਲੱਭੋ ਅਤੇ ਇੱਕ ਉਦਾਹਰਨ ਲਿਆਓ'],
      science: ['ਛੋਟੇ ਪ੍ਰਦਰਸ਼ਨ ਨਾਲ ਅੰਦਾਜ਼ਾ-ਨਿਰੀਖਣ-ਵਿਆਖਿਆ', 'ਅਸਲੀ ਚੀਜ਼ ਵੇਖ ਕੇ ਚਿੱਤਰ ਬਣਾਓ ਅਤੇ ਨਾਂ ਲਿਖੋ', 'ਸਮੂਹ ਪ੍ਰਯੋਗ, ਸਭ ਲਈ ਇੱਕ ਨਤੀਜਾ ਸਾਰਣੀ', 'ਕਾਰਡ ਸਮੂਹਾਂ ਵਿੱਚ ਛਾਂਟੋ ਅਤੇ ਨਿਯਮ ਸਮਝਾਓ', 'ਹਰ ਸਮੂਹ ਤੋਂ ਇੱਕ ਮਿੰਟ ਦਾ "ਵਿਗਿਆਨ ਰਿਪੋਰਟਰ"'],
      english: ['ਜੋੜੀ ਵਿੱਚ ਉੱਚੀ ਪੜ੍ਹੋ ਅਤੇ ਭੂਮਿਕਾ ਬਦਲੋ', 'ਚਾਰ ਦੇ ਸਮੂਹ ਵਿੱਚ ਦ੍ਰਿਸ਼ ਦਾ ਅਭਿਨੈ ਕਰੋ', 'ਸ਼ਬਦ ਖੋਜ: ਪੰਜ ਨਵੇਂ ਸ਼ਬਦ ਲੱਭ ਕੇ ਅਰਥ ਦਾ ਅੰਦਾਜ਼ਾ ਲਾਓ', 'ਆਪਣੇ ਸ਼ਬਦਾਂ ਵਿੱਚ ਤਿੰਨ ਸਤਰਾਂ ਲਿਖੋ', 'ਹੌਟ ਸੀਟ: ਇੱਕ ਵਿਦਿਆਰਥੀ ਪਾਤਰ ਬਣ ਕੇ ਜਵਾਬ ਦੇਵੇ'],
      social: ['ਫ਼ਰਸ਼ ਤੇ ਚਾਕ ਨਾਲ ਸਮਾਂ-ਰੇਖਾ', 'ਨਕਸ਼ਾ ਕੰਮ: ਪੰਜ ਥਾਵਾਂ ਨਿਸ਼ਾਨਬੱਧ ਕਰੋ', 'ਭੂਮਿਕਾ-ਅਭਿਨੈ: ਉਸ ਸਮੇਂ ਦਾ ਇੱਕ ਦਿਨ', 'ਉਦੋਂ ਅਤੇ ਹੁਣ: T-ਚਾਰਟ ਵਿੱਚ ਤੁਲਨਾ', 'ਸਥਾਨਕ ਜੋੜ: ਘਰ ਦੇ ਕਿਸੇ ਬਜ਼ੁਰਗ ਤੋਂ ਪੁੱਛ ਕੇ ਦੱਸੋ'],
      language: ['ਕਹਾਣੀ ਦਾ ਘੇਰਾ: ਹਰ ਵਿਦਿਆਰਥੀ ਇੱਕ ਸਤਰ ਜੋੜੇ', 'ਤਸਵੀਰ ਤੇ ਗੱਲ: ਤਿੰਨ ਵਾਕਾਂ ਵਿੱਚ ਵਰਣਨ ਕਰੋ', 'ਤੁਕਾਂਤ ਵਾਲੇ ਸ਼ਬਦ ਲੱਭ ਕੇ ਇੱਕ ਗੀਤ ਬਣਾਓ', 'ਜੋੜੀ ਵਿੱਚ ਸ਼ਰੁਤਲੇਖ; ਇੱਕ ਦੂਜੇ ਦਾ ਜਾਂਚੋ', 'ਹੱਥ ਕਠਪੁਤਲੀਆਂ ਨਾਲ ਕਹਾਣੀ ਮੁੜ ਸੁਣਾਓ'],
      ai: ['AI ਪਛਾਣੋ: AI ਵਰਤਣ ਵਾਲੀਆਂ ਪੰਜ ਐਪਾਂ ਦੀ ਸੂਚੀ', 'ਇਨਸਾਨ ਜਾਂ ਮਸ਼ੀਨ: ਕੰਮਾਂ ਨੂੰ ਛਾਂਟੋ', 'ਪੈਟਰਨ ਖੇਡ: ਉਦਾਹਰਨਾਂ ਤੋਂ ਨਿਯਮ ਬੁੱਝੋ', 'ਕਾਗਜ਼ ਤੇ ਸਾਦੀ ਚੈਟਬੋਟ ਸਕ੍ਰਿਪਟ ਲਿਖੋ', 'ਬਹਿਸ: ਕੀ AI ਹਮੇਸ਼ਾ ਸਹੀ ਹੁੰਦਾ ਹੈ?'],
      general: ['ਸੋਚੋ-ਜੋੜੀ-ਸਾਂਝਾ ਕਰੋ: ਇੱਕ ਮਿੰਟ ਇਕੱਲੇ, ਦੋ ਮਿੰਟ ਜੋੜੀ ਵਿੱਚ', 'ਐਗਜ਼ਿਟ ਸਲਿੱਪ: ਇੱਕ ਗੱਲ ਸਿੱਖੀ, ਇੱਕ ਸਵਾਲ ਹੈ', 'ਗੈਲਰੀ ਵਾਕ: ਸਮੂਹ ਆਪਣਾ ਕੰਮ ਕੰਧ ਤੇ ਲਾਉਣ', 'ਸਲੇਟਾਂ ਨਾਲ ਟੀਮ ਕੁਇਜ਼', 'ਸਾਥੀ ਸਿੱਖਿਆ: ਆਪਣੇ ਜੋੜੀਦਾਰ ਨੂੰ ਸਮਝਾਓ']
    },
    samples: {
      fractions: {
        subjectKey: 'maths', cls: '6', subject: 'ਗਣਿਤ', topic: 'ਭਿੰਨਾਂ: ਤੁੱਲ ਭਿੰਨਾਂ', period: 3, duration: 40,
        outcomes: ['ਤੁੱਲ ਭਿੰਨ ਕੀ ਹੁੰਦੀ ਹੈ ਸਮਝਾ ਸਕਣਗੇ', 'ਗੁਣਾ ਜਾਂ ਭਾਗ ਕਰਕੇ ਤੁੱਲ ਭਿੰਨਾਂ ਬਣਾ ਸਕਣਗੇ', 'ਦੋ ਭਿੰਨਾਂ ਤੁੱਲ ਹਨ ਜਾਂ ਨਹੀਂ ਜਾਂਚ ਸਕਣਗੇ'],
        prev: 'ਵਿਦਿਆਰਥੀ 1/2 ਅਤੇ 3/4 ਵਰਗੀਆਂ ਭਿੰਨਾਂ ਪੜ੍ਹ-ਲਿਖ ਸਕਦੇ ਹਨ ਅਤੇ ਆਕਾਰ ਵਿੱਚ ਰੰਗ ਭਰ ਸਕਦੇ ਹਨ।',
        materials: ['ਕਾਗਜ਼ ਦੀਆਂ ਪੱਟੀਆਂ', 'ਬਲੈਕਬੋਰਡ ਅਤੇ ਚਾਕ', 'ਭਿੰਨ ਚਾਰਟ'], comp: ['critical', 'collab'],
        intro: '2 ਬਰਾਬਰ ਟੁਕੜਿਆਂ ਵਿੱਚ ਕੱਟੀ ਰੋਟੀ ਅਤੇ 4 ਟੁਕੜਿਆਂ ਵਿੱਚ ਕੱਟੀ ਦੂਜੀ ਰੋਟੀ ਦਿਖਾਓ। ਪੁੱਛੋ: ਕੀ 1/2 ਅਤੇ 2/4 ਬਰਾਬਰ ਹਨ?',
        steps: [
          ['ਕਾਗਜ਼ ਦੀ ਪੱਟੀ ਨੂੰ ਅੱਧ ਵਿੱਚ, ਫਿਰ ਚੌਥਾਈ ਵਿੱਚ ਮੋੜੋ; ਬੋਰਡ ਤੇ 1/2 = 2/4 ਦਿਖਾਓ।', 'ਆਪਣੀਆਂ ਪੱਟੀਆਂ ਮੋੜੋ, 1/2 ਅਤੇ 2/4 ਰੰਗੋ ਅਤੇ ਜੋੜੀ ਵਿੱਚ ਤੁਲਨਾ ਕਰੋ।', 10],
          ['ਨਿਯਮ ਸਮਝਾਓ: ਅੰਸ਼ ਅਤੇ ਹਰ ਨੂੰ ਇੱਕੋ ਸੰਖਿਆ ਨਾਲ ਗੁਣਾ ਜਾਂ ਭਾਗ ਕਰੋ। ਦੋ ਉਦਾਹਰਨਾਂ ਕਰੋ।', 'ਕਾਪੀ ਵਿੱਚ 2/3 ਦੀਆਂ ਤਿੰਨ ਤੁੱਲ ਭਿੰਨਾਂ ਬਣਾਓ।', 15],
          ['ਭਿੰਨਾਂ ਦੇ ਜੋੜੇ ਦਿਓ; ਪੁੱਛੋ ਕਿਹੜੇ ਤੁੱਲ ਹਨ ਅਤੇ ਕਿਵੇਂ ਪਤਾ ਲੱਗਾ।', 'ਤਿਰਛੀ ਗੁਣਾ ਨਾਲ ਜਾਂਚੋ; ਕਾਰਨ ਸਮੇਤ ਹਾਂ ਜਾਂ ਨਾਂਹ ਕਹੋ।', 10]
        ],
        recap: 'ਬੋਰਡ ਤੇ ਤਿੰਨ ਝਟਪਟ ਸਵਾਲ: ਤੁੱਲ ਜਾਂ ਨਹੀਂ? ਵਿਦਿਆਰਥੀ ਅੰਗੂਠਾ ਉੱਪਰ ਜਾਂ ਹੇਠਾਂ ਕਰਕੇ ਦੱਸਣ।',
        assess: 'ਐਗਜ਼ਿਟ ਸਲਿੱਪ: 3/5 ਦੀਆਂ ਦੋ ਤੁੱਲ ਭਿੰਨਾਂ ਲਿਖੋ।', hw: 'NCERT ਅਭਿਆਸ 7.3, ਪ੍ਰਸ਼ਨ 1 ਤੋਂ 4।',
        e5: { engage: ['ਰੋਟੀ ਦੀ ਬੁਝਾਰਤ: ਕੀ 1/2 ਅਤੇ 2/4 ਬਰਾਬਰ ਹਨ? ਵੋਟ ਪਾਓ ਅਤੇ ਕਾਰਨ ਦੱਸੋ।', 5, 'ਕਾਗਜ਼ ਦੀਆਂ ਦੋ ਰੋਟੀਆਂ'], explore: ['ਜੋੜੀ ਵਿੱਚ ਪੱਟੀਆਂ ਮੋੜ ਕੇ 1/2 ਦੇ ਬਰਾਬਰ ਭਿੰਨਾਂ ਲੱਭੋ।', 10, 'ਕਾਗਜ਼ ਦੀਆਂ ਪੱਟੀਆਂ'], explain: ['ਨਿਯਮ: ਅੰਸ਼ ਅਤੇ ਹਰ ਨੂੰ ਇੱਕੋ ਸੰਖਿਆ ਨਾਲ ਗੁਣਾ ਜਾਂ ਭਾਗ ਕਰੋ।', 10, 'ਬਲੈਕਬੋਰਡ'], elaborate: ['ਭਿੰਨ ਚਾਰਟ ਤੇ ਤੁੱਲ ਭਿੰਨਾਂ ਲੱਭੋ ਅਤੇ ਪੈਟਰਨ ਦੱਸੋ।', 10, 'ਭਿੰਨ ਚਾਰਟ'], evaluate: ['ਐਗਜ਼ਿਟ ਸਲਿੱਪ: 3/5 ਦੀਆਂ ਦੋ ਤੁੱਲ ਭਿੰਨਾਂ।', 5, 'ਕਾਗਜ਼ ਦੀਆਂ ਪਰਚੀਆਂ'] },
        support: 'ਤਿਆਰ ਭਿੰਨ ਪੱਟੀਆਂ ਦਿਓ; ਸਿਰਫ਼ ਅੱਧ ਅਤੇ ਚੌਥਾਈ ਨਾਲ ਕੰਮ ਕਰੋ।', extension: '1/2 ਅਤੇ 1 ਦੇ ਵਿਚਕਾਰ ਤਿੰਨ ਭਿੰਨਾਂ ਲੱਭੋ ਅਤੇ ਸਿੱਧ ਕਰੋ ਕਿ ਉਹ ਕ੍ਰਮ ਵਿੱਚ ਹਨ।',
        week: [['ਸੰਖਿਆ ਰੇਖਾ ਤੇ ਭਿੰਨਾਂ', 'ਅਭਿ. 7.1 ਪ੍ਰ. 1–3'], ['ਉਚਿਤ ਅਤੇ ਅਣਉਚਿਤ ਭਿੰਨਾਂ', 'ਅਭਿ. 7.2 ਪ੍ਰ. 1–2'], ['ਤੁੱਲ ਭਿੰਨਾਂ', 'ਅਭਿ. 7.3 ਪ੍ਰ. 1–4'], ['ਸਰਲ ਰੂਪ', 'ਅਭਿ. 7.3 ਪ੍ਰ. 5–7'], ['ਭਿੰਨਾਂ ਦੀ ਤੁਲਨਾ', 'ਅਭਿ. 7.4 ਪ੍ਰ. 1–3'], ['ਅਭਿਆਸ ਅਤੇ ਕੁਇਜ਼', 'ਪਾਠ ਦੀ ਦੁਹਰਾਈ']]
      },
      cell: {
        subjectKey: 'science', cls: '8', subject: 'ਵਿਗਿਆਨ', topic: 'ਸੈੱਲ: ਬਣਤਰ ਅਤੇ ਕਾਰਜ', period: 2, duration: 40,
        outcomes: ['ਸੈੱਲ ਦੇ ਮੁੱਖ ਭਾਗਾਂ ਦੇ ਨਾਂ ਦੱਸ ਸਕਣਗੇ', 'ਪੌਦਾ ਸੈੱਲ ਅਤੇ ਜੰਤੂ ਸੈੱਲ ਦੀ ਤੁਲਨਾ ਕਰ ਸਕਣਗੇ', 'ਸੈੱਲ ਨੂੰ ਜੀਵਨ ਦੀ ਮੂਲ ਇਕਾਈ ਕਿਉਂ ਕਹਿੰਦੇ ਹਨ ਸਮਝਾ ਸਕਣਗੇ'],
        prev: 'ਵਿਦਿਆਰਥੀ ਜਾਣਦੇ ਹਨ ਕਿ ਸਜੀਵ ਨਿੱਕੇ ਭਾਗਾਂ ਤੋਂ ਬਣੇ ਹਨ ਅਤੇ ਉਨ੍ਹਾਂ ਨੇ ਹੈਂਡ ਲੈਂਜ਼ ਵਰਤਿਆ ਹੈ।',
        materials: ['ਪਿਆਜ਼ ਦੀ ਝਿੱਲੀ ਅਤੇ ਸਲਾਈਡ', 'ਸੂਖਮਦਰਸ਼ੀ ਜਾਂ ਸੈੱਲ ਚਾਰਟ', 'ਰੰਗਦਾਰ ਪੈਨਸਿਲਾਂ'], comp: ['critical', 'comm'],
        intro: 'ਇੱਟਾਂ ਦੀ ਕੰਧ ਦੀ ਫੋਟੋ ਅਤੇ ਸੂਖਮਦਰਸ਼ੀ ਹੇਠ ਪਿਆਜ਼ ਦੀ ਝਿੱਲੀ ਦਿਖਾਓ। ਪੁੱਛੋ: ਸਜੀਵ ਕਿਸ ਤੋਂ ਬਣੇ ਹਨ?',
        steps: [
          ['ਪਿਆਜ਼ ਦੀ ਝਿੱਲੀ ਦੀ ਸਲਾਈਡ ਜਾਂ ਚਾਰਟ ਦਿਖਾਓ; ਸੈੱਲ ਕੰਧ, ਨਿਊਕਲੀਅਸ ਅਤੇ ਸਾਈਟੋਪਲਾਜ਼ਮ ਦੱਸੋ।', 'ਜੋ ਦਿਸਦਾ ਹੈ ਨਿਰੀਖਣ ਕਰਕੇ ਬਣਾਓ; ਦੋ ਭਾਗਾਂ ਦੇ ਨਾਂ ਲਿਖੋ।', 12],
          ['ਬੋਰਡ ਤੇ ਵੈੱਨ ਚਿੱਤਰ ਨਾਲ ਪੌਦਾ ਅਤੇ ਜੰਤੂ ਸੈੱਲ ਦੀ ਤੁਲਨਾ ਕਰੋ।', 'ਜੋੜੀ ਵਿੱਚ ਵੈੱਨ ਚਿੱਤਰ ਭਰੋ: ਕੰਧ, ਕਲੋਰੋਪਲਾਸਟ, ਵੈਕਿਊਲ, ਨਿਊਕਲੀਅਸ।', 13],
          ['"ਸ਼ਹਿਰ" ਦੀ ਤੁਲਨਾ ਨਾਲ ਸੈੱਲ ਦੇ ਭਾਗ ਅਤੇ ਉਨ੍ਹਾਂ ਦੇ ਕੰਮ ਸਮਝਾਓ।', 'ਭਾਗਾਂ ਦੇ ਕਾਰਡ ਉਨ੍ਹਾਂ ਦੇ ਕਾਰਜਾਂ ਨਾਲ ਮਿਲਾਓ।', 10]
        ],
        recap: 'ਝਟਪਟ ਸਵਾਲ: ਸੈੱਲ ਨੂੰ ਕੰਟਰੋਲ ਕਰਨ ਵਾਲਾ ਭਾਗ; ਸਿਰਫ਼ ਪੌਦਿਆਂ ਵਿੱਚ ਹੋਣ ਵਾਲਾ ਭਾਗ।',
        assess: 'ਪੰਜ ਭਾਗਾਂ ਸਮੇਤ ਪੌਦਾ ਸੈੱਲ ਬਣਾ ਕੇ ਨਾਂ ਲਿਖੋ।', hw: 'NCERT ਪਾਠ 8, ਪ੍ਰਸ਼ਨ 1 ਤੋਂ 5।',
        e5: { engage: ['ਇੱਟਾਂ ਦੀ ਕੰਧ ਜਾਂ ਪਿਆਜ਼ ਦੀ ਝਿੱਲੀ: ਸਜੀਵ ਕਿਸ ਤੋਂ ਬਣੇ ਹਨ?', 5, 'ਫੋਟੋ, ਪਿਆਜ਼ ਦੀ ਝਿੱਲੀ'], explore: ['ਸਮੂਹ ਵਿੱਚ ਪਿਆਜ਼ ਦੀ ਝਿੱਲੀ ਦੀ ਸਲਾਈਡ ਵੇਖੋ ਅਤੇ ਬਣਾਓ।', 12, 'ਸੂਖਮਦਰਸ਼ੀ ਜਾਂ ਚਾਰਟ'], explain: ['ਸੈੱਲ ਦੇ ਭਾਗ ਅਤੇ ਉਨ੍ਹਾਂ ਦੇ ਕੰਮ; ਪੌਦਾ ਸੈੱਲ ਅਤੇ ਜੰਤੂ ਸੈੱਲ।', 10, 'ਬਲੈਕਬੋਰਡ, ਸੈੱਲ ਚਾਰਟ'], elaborate: ['ਮਿੱਟੀ ਜਾਂ ਕਾਗਜ਼ ਨਾਲ ਸੈੱਲ ਦਾ ਮਾਡਲ ਬਣਾਓ।', 8, 'ਮਿੱਟੀ, ਕਾਗਜ਼'], evaluate: ['ਖਾਲੀ ਸੈੱਲ ਚਿੱਤਰ ਤੇ ਨਾਂ ਲਿਖੋ।', 5, 'ਵਰਕਸ਼ੀਟ'] },
        support: 'ਨਕਲ ਕਰਨ ਲਈ ਨਾਂ ਵਾਲਾ ਚਿੱਤਰ ਦਿਓ; ਪੰਜ ਦੀ ਥਾਂ ਤਿੰਨ ਭਾਗ ਪੁੱਛੋ।', extension: 'ਪੱਤੇ ਦੇ ਸੈੱਲ ਵਿੱਚ ਕੀ ਹੈ ਜੋ ਗੱਲ੍ਹ ਦੇ ਸੈੱਲ ਵਿੱਚ ਨਹੀਂ, ਅਤੇ ਕਿਉਂ, ਪਤਾ ਕਰੋ।',
        week: [['ਸੈੱਲ ਦੀ ਖੋਜ; ਸੂਖਮਦਰਸ਼ੀ', '8.1 ਪੜ੍ਹੋ'], ['ਸੈੱਲ ਦਾ ਆਕਾਰ ਅਤੇ ਮਾਪ', 'ਤਿੰਨ ਸੈੱਲ ਬਣਾਓ'], ['ਸੈੱਲ ਦੇ ਭਾਗ', 'ਪ੍ਰ. 1–3'], ['ਪੌਦਾ ਸੈੱਲ ਅਤੇ ਜੰਤੂ ਸੈੱਲ', 'ਵੈੱਨ ਚਿੱਤਰ'], ['ਪਿਆਜ਼ ਦੀ ਝਿੱਲੀ ਦਾ ਪ੍ਰਯੋਗ', 'ਲੈਬ ਕਾਪੀ'], ['ਦੁਹਰਾਈ ਅਤੇ ਕੁਇਜ਼', 'ਪਾਠ ਦੀ ਦੁਹਰਾਈ']]
      },
      poem: {
        subjectKey: 'english', cls: '5', subject: 'ਅੰਗਰੇਜ਼ੀ', topic: 'ਕਵਿਤਾ: My Shadow', period: 4, duration: 35,
        outcomes: ['ਕਵਿਤਾ ਨੂੰ ਲੈਅ ਨਾਲ ਉੱਚੀ ਪੜ੍ਹ ਸਕਣਗੇ', 'ਤੁਕਾਂਤ ਵਾਲੇ ਸ਼ਬਦ ਲੱਭ ਕੇ ਦੱਸ ਸਕਣਗੇ ਕਿ ਪਰਛਾਵਾਂ ਕੀ ਕਰਦਾ ਹੈ', 'ਆਪਣੇ ਪਰਛਾਵੇਂ ਬਾਰੇ ਚਾਰ ਸਤਰਾਂ ਲਿਖ ਸਕਣਗੇ'],
        prev: 'ਵਿਦਿਆਰਥੀਆਂ ਨੇ ਧੁੱਪ ਵਿੱਚ ਆਪਣਾ ਪਰਛਾਵਾਂ ਵੇਖਿਆ ਹੈ ਅਤੇ sun-fun ਵਰਗੇ ਤੁਕਾਂਤ ਸ਼ਬਦ ਜਾਣਦੇ ਹਨ।',
        materials: ['ਪਾਠ-ਪੁਸਤਕ', 'ਟਾਰਚ', 'ਕਵਿਤਾ ਵਾਲਾ ਚਾਰਟ'], comp: ['creativity', 'comm'],
        intro: 'ਹਨੇਰੇ ਕੋਨੇ ਵਿੱਚ ਟਾਰਚ ਜਗਾ ਕੇ ਹੱਥਾਂ ਦੇ ਪਰਛਾਵੇਂ ਬਣਾਓ। ਪੁੱਛੋ: ਤੁਹਾਡਾ ਪਰਛਾਵਾਂ ਕਦੋਂ ਲੰਮਾ ਹੁੰਦਾ ਹੈ?',
        steps: [
          ['ਹਾਵ-ਭਾਵ ਨਾਲ ਕਵਿਤਾ ਦੋ ਵਾਰ ਉੱਚੀ ਪੜ੍ਹੋ; ਔਖੇ ਸ਼ਬਦ ਸਮਝਾਓ।', 'ਸੁਣੋ, ਫਿਰ ਸਮੂਹ ਵਿੱਚ ਪੜ੍ਹੋ ਅਤੇ ਸਤਰਾਂ ਦਾ ਅਭਿਨੈ ਕਰੋ।', 12],
          ['ਪੁੱਛੋ: ਪਰਛਾਵਾਂ ਉਹ ਕੀ ਕਰਦਾ ਹੈ ਜੋ ਬੱਚਾ ਕਰਦਾ ਹੈ? ਤੁਕਾਂਤ ਜੋੜੇ ਲੱਭੋ।', 'ਜੋੜੀ ਵਿੱਚ ਤੁਕਾਂਤ ਸ਼ਬਦ ਹੇਠ ਲਕੀਰ ਲਾਓ; ਹਰੇਕ ਇੱਕ ਜੋੜਾ ਦੱਸੇ।', 13],
          ['ਬੋਰਡ ਤੇ ਮੇਰੇ ਪਰਛਾਵੇਂ ਬਾਰੇ ਚਾਰ ਨਮੂਨਾ ਸਤਰਾਂ ਲਿਖੋ।', 'ਆਪਣੇ ਪਰਛਾਵੇਂ ਬਾਰੇ ਚਾਰ ਸਤਰਾਂ ਲਿਖੋ ਅਤੇ ਜੋੜੀਦਾਰ ਨੂੰ ਪੜ੍ਹ ਕੇ ਸੁਣਾਓ।', 10]
        ],
        recap: 'ਸਾਰੀ ਜਮਾਤ ਮਿਲ ਕੇ ਪਹਿਲਾ ਬੰਦ ਸੁਣਾਵੇ; ਇੱਕ ਸਮੂਹ ਮੂਕ ਅਭਿਨੈ ਕਰੇ।',
        assess: 'ਮੌਖਿਕ: ਕਵਿਤਾ ਤੇ ਤਿੰਨ ਸਵਾਲ; ਲਿਖੀਆਂ ਚਾਰ ਸਤਰਾਂ ਜਾਂਚੋ।', hw: 'ਪਹਿਲਾ ਬੰਦ ਯਾਦ ਕਰੋ; ਦੁਪਹਿਰ ਅਤੇ ਸ਼ਾਮ 5 ਵਜੇ ਆਪਣਾ ਪਰਛਾਵਾਂ ਬਣਾਓ।',
        e5: { engage: ['ਟਾਰਚ ਨਾਲ ਹੱਥਾਂ ਦੇ ਪਰਛਾਵੇਂ: ਪਰਛਾਵਾਂ ਕਿਵੇਂ ਬਣਦਾ ਹੈ?', 5, 'ਟਾਰਚ'], explore: ['ਜੋੜੀ ਵਿੱਚ ਕਵਿਤਾ ਪੜ੍ਹੋ ਅਤੇ ਅਣਜਾਣ ਸ਼ਬਦਾਂ ਤੇ ਨਿਸ਼ਾਨ ਲਾਓ।', 8, 'ਪਾਠ-ਪੁਸਤਕ'], explain: ['ਹਰ ਬੰਦ ਦਾ ਅਰਥ; ਤੁਕਾਂਤ ਸ਼ਬਦ; ਲੈਅ।', 10, 'ਕਵਿਤਾ ਵਾਲਾ ਚਾਰਟ'], elaborate: ['ਆਪਣੇ ਪਰਛਾਵੇਂ ਬਾਰੇ ਚਾਰ ਸਤਰਾਂ ਲਿਖੋ।', 8, 'ਕਾਪੀ'], evaluate: ['ਇੱਕ ਬੰਦ ਸੁਣਾਓ; ਦੋ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦਿਓ।', 4, 'ਕਵਿਤਾ ਵਾਲਾ ਚਾਰਟ'] },
        support: 'ਸਾਥੀ ਨਾਲ ਪੜ੍ਹੋ; ਚਾਰ ਸਤਰਾਂ ਲਈ ਸ਼ਬਦ ਭੰਡਾਰ ਦਿਓ।', extension: 'ਪਤਾ ਕਰੋ ਕਿ ਦੁਪਹਿਰ ਨੂੰ ਪਰਛਾਵਾਂ ਛੋਟਾ ਅਤੇ ਸ਼ਾਮ ਨੂੰ ਲੰਮਾ ਕਿਉਂ ਹੁੰਦਾ ਹੈ।',
        week: [['ਕਵਿਤਾ: ਪੜ੍ਹੋ ਅਤੇ ਮਾਣੋ', 'ਘਰ ਉੱਚੀ ਪੜ੍ਹੋ'], ['ਨਵੇਂ ਸ਼ਬਦ ਅਤੇ ਤੁਕਾਂਤ', 'ਪੰਜ ਤੁਕਾਂਤ ਜੋੜੇ ਲਿਖੋ'], ['ਸਮਝ ਦੇ ਸਵਾਲ', 'ਪ੍ਰ. 1–4'], ['ਲਿਖਣਾ: ਮੇਰਾ ਪਰਛਾਵਾਂ', 'ਚਾਰ ਸਤਰਾਂ ਪੂਰੀਆਂ ਕਰੋ'], ['ਵਿਆਕਰਨ: ਕਵਿਤਾ ਵਿੱਚ ਨਾਂਵ', 'ਵਰਕਸ਼ੀਟ'], ['ਕਵਿਤਾ ਉਚਾਰਨ ਅਤੇ ਮਸਤੀ', 'ਬੰਦ 1 ਯਾਦ ਕਰੋ']]
      },
      medieval: {
        subjectKey: 'social', cls: '7', subject: 'ਸਮਾਜਿਕ ਵਿਗਿਆਨ', topic: 'ਹਜ਼ਾਰ ਸਾਲਾਂ ਦੀਆਂ ਤਬਦੀਲੀਆਂ ਦੀ ਖੋਜ', period: 5, duration: 40,
        outcomes: ['ਸਮਝਾ ਸਕਣਗੇ ਕਿ "ਹਿੰਦੁਸਤਾਨ" ਸ਼ਬਦ ਦਾ ਅਰਥ ਸਮੇਂ ਨਾਲ ਕਿਵੇਂ ਬਦਲਿਆ', 'ਇਤਿਹਾਸਕ ਨਕਸ਼ਾ ਪੜ੍ਹ ਕੇ ਆਧੁਨਿਕ ਨਕਸ਼ੇ ਨਾਲ ਤੁਲਨਾ ਕਰ ਸਕਣਗੇ', 'ਮੱਧਕਾਲ ਲਈ ਇਤਿਹਾਸਕਾਰਾਂ ਵੱਲੋਂ ਵਰਤੇ ਸਰੋਤਾਂ ਦੀ ਸੂਚੀ ਬਣਾ ਸਕਣਗੇ'],
        prev: 'ਵਿਦਿਆਰਥੀ ਛੇਵੀਂ ਜਮਾਤ ਦਾ ਪ੍ਰਾਚੀਨ ਕਾਲ ਜਾਣਦੇ ਹਨ ਅਤੇ ਭਾਰਤ ਦਾ ਨਕਸ਼ਾ ਪੜ੍ਹ ਸਕਦੇ ਹਨ।',
        materials: ['ਦੋ ਨਕਸ਼ੇ: ਅਲ-ਇਦਰੀਸੀ (1154) ਅਤੇ ਆਧੁਨਿਕ ਨਕਸ਼ਾ', 'ਪਾਠ-ਪੁਸਤਕ', 'ਐਟਲਸ'], comp: ['critical', 'comm'],
        intro: 'ਅਲ-ਇਦਰੀਸੀ ਦਾ 1154 ਦਾ ਨਕਸ਼ਾ ਉਲਟਾ ਦਿਖਾਓ। ਪੁੱਛੋ: ਕੀ ਦੱਖਣੀ ਭਾਰਤ ਲੱਭਦਾ ਹੈ?',
        steps: [
          ['ਦੋਵਾਂ ਨਕਸ਼ਿਆਂ ਦੀ ਤੁਲਨਾ: ਨਾਂ, ਆਕਾਰ, ਕੀ ਗ਼ਾਇਬ ਹੈ।', 'ਜੋੜੀ ਵਿੱਚ ਤਿੰਨ ਫ਼ਰਕ ਲੱਭੋ ਅਤੇ ਦੱਸੋ ਕਿ ਨਕਸ਼ੇ ਕਿਉਂ ਬਦਲਦੇ ਹਨ।', 12],
          ['ਸਮਝਾਓ ਕਿ ਸ਼ਬਦ ਕਿਵੇਂ ਬਦਲਦੇ ਹਨ: ਮਿਨਹਾਜ-ਏ-ਸਿਰਾਜ, ਬਾਬਰ ਅਤੇ ਅਮੀਰ ਖੁਸਰੋ ਦਾ "ਹਿੰਦੁਸਤਾਨ"।', 'ਕਾਪੀ ਵਿੱਚ ਤਿੰਨਾਂ ਅਰਥਾਂ ਦੀ ਸਮਾਂ-ਰੇਖਾ ਬਣਾਓ।', 13],
          ['ਸਰੋਤ: ਹੱਥ-ਲਿਖਤਾਂ, ਸਿੱਕੇ, ਸ਼ਿਲਾਲੇਖ, ਇਮਾਰਤਾਂ; ਨਕਲ ਕਰਨ ਨਾਲ ਲਿਖਤਾਂ ਕਿਉਂ ਬਦਲੀਆਂ।', 'ਸਰੋਤ ਕਾਰਡਾਂ ਨੂੰ ਲਿਖਤੀ ਅਤੇ ਭੌਤਿਕ ਸਰੋਤਾਂ ਵਿੱਚ ਛਾਂਟੋ।', 10]
        ],
        recap: 'ਝਟਪਟ ਕੁਇਜ਼: ਪੰਜਾਬ, ਹਰਿਆਣਾ ਅਤੇ ਗੰਗਾ-ਯਮੁਨਾ ਖੇਤਰ ਲਈ "ਹਿੰਦੁਸਤਾਨ" ਕਿਸ ਨੇ ਵਰਤਿਆ?',
        assess: 'ਦੋ ਕਾਰਨ ਲਿਖੋ ਕਿ ਕਿਸੇ ਥਾਂ ਦੇ ਨਾਂ ਦਾ ਅਰਥ ਕਿਉਂ ਬਦਲ ਸਕਦਾ ਹੈ।', hw: 'NCERT ਪਾਠ 1, "Let\'s recall" ਪ੍ਰਸ਼ਨ 1 ਤੋਂ 3।',
        e5: { engage: ['1154 ਦਾ ਉਲਟਾ ਨਕਸ਼ਾ: ਕੀ ਦਿਸਦਾ ਹੈ?', 5, 'ਨਕਸ਼ੇ ਦਾ ਪ੍ਰਿੰਟ'], explore: ['ਸਮੂਹ ਵਿੱਚ ਪੁਰਾਣੇ ਅਤੇ ਨਵੇਂ ਨਕਸ਼ੇ ਦੀ ਤੁਲਨਾ ਕਰੋ।', 10, 'ਦੋ ਨਕਸ਼ੇ'], explain: ['ਬਦਲਦੇ ਨਾਂ ਅਤੇ ਅਰਥ; ਇਸ ਕਾਲ ਦੇ ਸਰੋਤ।', 12, 'ਪਾਠ-ਪੁਸਤਕ, ਬਲੈਕਬੋਰਡ'], elaborate: ['"ਹਿੰਦੁਸਤਾਨ" ਸ਼ਬਦ ਦੀ ਸਮਾਂ-ਰੇਖਾ ਬਣਾਓ।', 8, 'ਕਾਪੀ'], evaluate: ['ਥਾਵਾਂ ਦੇ ਨਾਵਾਂ ਦੇ ਅਰਥ ਬਦਲਣ ਦੇ ਦੋ ਕਾਰਨ।', 5, 'ਕਾਗਜ਼ ਦੀਆਂ ਪਰਚੀਆਂ'] },
        support: 'ਪਹਿਲਾਂ ਤੋਂ ਨਾਂ ਲਿਖੇ ਨਕਸ਼ੇ ਦਿਓ; ਇੱਕ ਫ਼ਰਕ ਪੁੱਛੋ।', extension: 'ਪਤਾ ਕਰੋ ਕਿ 500 ਸਾਲ ਪਹਿਲਾਂ ਤੁਹਾਡੇ ਸ਼ਹਿਰ ਜਾਂ ਰਾਜ ਨੂੰ ਕੀ ਕਹਿੰਦੇ ਸਨ।',
        week: [['ਪੁਰਾਣੇ ਨਕਸ਼ੇ ਅਤੇ ਨਵੇਂ ਨਕਸ਼ੇ', '1.1 ਪੜ੍ਹੋ'], ['ਨਵੇਂ ਅਤੇ ਪੁਰਾਣੇ ਸ਼ਬਦ: ਹਿੰਦੁਸਤਾਨ', 'ਸਮਾਂ-ਰੇਖਾ'], ['ਇਤਿਹਾਸਕਾਰ ਅਤੇ ਉਨ੍ਹਾਂ ਦੇ ਸਰੋਤ', 'ਪ੍ਰ. 1–3'], ['ਨਵੇਂ ਸਮਾਜਿਕ ਅਤੇ ਰਾਜਨੀਤਕ ਸਮੂਹ', '1.3 ਪੜ੍ਹੋ'], ['ਖੇਤਰ ਅਤੇ ਸਾਮਰਾਜ; ਪੁਰਾਣੇ ਅਤੇ ਨਵੇਂ ਧਰਮ', 'ਸੰਖੇਪ ਨੋਟ'], ['ਦੁਹਰਾਈ ਅਤੇ ਨਕਸ਼ਾ ਕੰਮ', 'ਪੰਜ ਥਾਵਾਂ ਨਿਸ਼ਾਨਬੱਧ ਕਰੋ']]
      },
      story: {
        subjectKey: 'language', cls: '4', subject: 'ਪੰਜਾਬੀ', topic: 'ਕਹਾਣੀ: ਪਿਆਸਾ ਕਾਂ', period: 1, duration: 35,
        outcomes: ['ਕਹਾਣੀ ਸਹੀ ਕ੍ਰਮ ਵਿੱਚ ਮੁੜ ਸੁਣਾ ਸਕਣਗੇ', 'ਪੰਜ ਨਵੇਂ ਸ਼ਬਦਾਂ ਦੇ ਅਰਥ ਦੱਸ ਸਕਣਗੇ', 'ਦੱਸ ਸਕਣਗੇ ਕਿ ਕਾਂ ਨੇ ਕੀ ਕੀਤਾ ਅਤੇ ਇਹ ਕਿਉਂ ਕੰਮ ਆਇਆ'],
        prev: 'ਵਿਦਿਆਰਥੀ ਛੋਟੇ ਵਾਕ ਪੜ੍ਹ ਸਕਦੇ ਹਨ ਅਤੇ ਘਰ ਲੋਕ-ਕਹਾਣੀਆਂ ਸੁਣੀਆਂ ਹਨ।',
        materials: ['ਕਹਾਣੀ ਦੇ ਤਸਵੀਰ ਕਾਰਡ', 'ਇੱਕ ਘੜਾ, ਪਾਣੀ ਅਤੇ ਕੰਕਰ', 'ਪਾਠ-ਪੁਸਤਕ'], comp: ['critical', 'creativity', 'comm'],
        intro: 'ਥੋੜ੍ਹੇ ਪਾਣੀ ਵਾਲਾ ਘੜਾ ਅਤੇ ਇੱਕ ਪੱਥਰ ਦਿਖਾਓ। ਪੁੱਛੋ: ਪੰਛੀ ਇਹ ਪਾਣੀ ਕਿਵੇਂ ਪੀ ਸਕਦਾ ਹੈ?',
        steps: [
          ['ਤਸਵੀਰ ਕਾਰਡਾਂ ਅਤੇ ਆਵਾਜ਼ ਬਦਲ ਕੇ ਕਹਾਣੀ ਸੁਣਾਓ।', 'ਸੁਣੋ; ਦੋ ਥਾਵਾਂ ਤੇ ਅੰਦਾਜ਼ਾ ਲਾਓ ਕਿ ਅੱਗੇ ਕੀ ਹੋਵੇਗਾ।', 10],
          ['ਕਹਾਣੀ ਉੱਚੀ ਪੜ੍ਹੋ; ਹਾਵ-ਭਾਵ ਨਾਲ ਨਵੇਂ ਸ਼ਬਦ ਸਮਝਾਓ।', 'ਜੋੜੀ ਵਿੱਚ ਪੜ੍ਹੋ; ਨਵੇਂ ਸ਼ਬਦ ਹੇਠ ਲਕੀਰ ਲਾਓ; ਦੋ ਸ਼ਬਦਾਂ ਨਾਲ ਵਾਕ ਬਣਾਓ।', 15],
          ['ਘੜੇ ਨਾਲ ਕੰਕਰਾਂ ਦਾ ਪ੍ਰਯੋਗ ਕਰੋ।', 'ਇੱਕ-ਇੱਕ ਕੰਕਰ ਪਾਓ, ਪਾਣੀ ਉੱਪਰ ਆਉਂਦਾ ਵੇਖੋ ਅਤੇ ਦੱਸੋ ਕਿ ਇਹ ਕਿਉਂ ਹੁੰਦਾ ਹੈ।', 10]
        ],
        recap: 'ਬੋਰਡ ਤੇ ਤਸਵੀਰ ਕਾਰਡ ਕ੍ਰਮ ਵਿੱਚ ਲਾਓ।',
        assess: 'ਜੋੜੀਦਾਰ ਨੂੰ ਪੰਜ ਵਾਕਾਂ ਵਿੱਚ ਕਹਾਣੀ ਮੁੜ ਸੁਣਾਓ।', hw: 'ਕਾਂ ਅਤੇ ਘੜਾ ਬਣਾਓ; ਤਿੰਨ ਵਾਕ ਲਿਖੋ।',
        e5: { engage: ['ਥੋੜ੍ਹੇ ਪਾਣੀ ਵਾਲਾ ਘੜਾ: ਪੰਛੀ ਕਿਵੇਂ ਪੀਵੇਗਾ?', 5, 'ਘੜਾ, ਪਾਣੀ'], explore: ['ਸਮੂਹ ਵਿੱਚ ਕੰਕਰਾਂ ਨਾਲ ਅਜ਼ਮਾਓ: ਕੀ ਪਾਣੀ ਉੱਪਰ ਆਉਂਦਾ ਹੈ?', 8, 'ਘੜਾ, ਕੰਕਰ'], explain: ['ਕਹਾਣੀ ਪੜ੍ਹੋ; ਨਵੇਂ ਸ਼ਬਦ ਅਤੇ ਕਹਾਣੀ ਦੀ ਸਿੱਖਿਆ।', 10, 'ਪਾਠ-ਪੁਸਤਕ, ਤਸਵੀਰ ਕਾਰਡ'], elaborate: ['ਤਿੰਨ ਦੇ ਸਮੂਹ ਵਿੱਚ ਕਹਾਣੀ ਦਾ ਅਭਿਨੈ ਕਰੋ।', 8, 'ਤਸਵੀਰ ਕਾਰਡ'], evaluate: ['ਪੰਜ ਵਾਕਾਂ ਵਿੱਚ ਕਹਾਣੀ ਮੁੜ ਸੁਣਾਓ।', 4, 'ਤਸਵੀਰ ਕਾਰਡ'] },
        support: 'ਤਸਵੀਰ ਕਾਰਡ ਕ੍ਰਮ ਵਿੱਚ ਦਿਓ; ਉਨ੍ਹਾਂ ਨਾਲ ਸੁਣਾਉਣ ਦਿਓ।', extension: 'ਅੰਤ ਬਦਲੋ: ਜੇ ਕੰਕਰ ਨਾ ਹੁੰਦੇ ਤਾਂ ਕੀ ਹੁੰਦਾ?',
        week: [['ਕਹਾਣੀ ਸੁਣੋ', 'ਘਰ ਜਾ ਕੇ ਸੁਣਾਓ'], ['ਪੜ੍ਹੋ; ਨਵੇਂ ਸ਼ਬਦ', 'ਪੰਜ ਸ਼ਬਦ, ਪੰਜ ਵਾਕ'], ['ਕੰਕਰਾਂ ਦਾ ਪ੍ਰਯੋਗ ਅਤੇ ਇਹ ਕਿਉਂ ਕੰਮ ਆਉਂਦਾ ਹੈ', 'ਚਿੱਤਰ ਬਣਾਓ'], ['ਕਹਾਣੀ ਦਾ ਅਭਿਨੈ', 'ਆਪਣੇ ਸੰਵਾਦ ਯਾਦ ਕਰੋ'], ['ਆਪਣਾ ਅੰਤ ਲਿਖੋ', 'ਅੰਤ ਪੂਰਾ ਕਰੋ'], ['ਦੁਹਰਾਈ ਅਤੇ ਉੱਚੀ ਪੜ੍ਹਨਾ', 'ਸਫ਼ਾ 1 ਉੱਚੀ ਪੜ੍ਹੋ']]
      },
      ai: {
        subjectKey: 'ai', cls: '9', subject: 'ਬਣਾਉਟੀ ਬੁੱਧੀ', topic: 'AI ਕੀ ਹੈ?', period: 6, duration: 40,
        outcomes: ['ਤੈਅ ਨਿਯਮਾਂ ਵਾਲੀ ਮਸ਼ੀਨ ਅਤੇ ਡਾਟਾ ਤੋਂ ਸਿੱਖਣ ਵਾਲੀ ਮਸ਼ੀਨ ਵਿੱਚ ਫ਼ਰਕ ਦੱਸ ਸਕਣਗੇ', 'ਰੋਜ਼ਾਨਾ ਜੀਵਨ ਵਿੱਚ AI ਦੀਆਂ ਪੰਜ ਵਰਤੋਂ ਗਿਣਾ ਸਕਣਗੇ', 'AI ਦੇ ਇੱਕ ਲਾਭ ਅਤੇ ਇੱਕ ਖ਼ਤਰੇ ਬਾਰੇ ਚਰਚਾ ਕਰ ਸਕਣਗੇ'],
        prev: 'ਵਿਦਿਆਰਥੀ ਸਮਾਰਟਫ਼ੋਨ, ਨਕਸ਼ੇ, ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਅਤੇ ਵੀਡੀਓ ਐਪਾਂ ਵਰਤਦੇ ਹਨ।',
        materials: ['ਪ੍ਰੋਜੈਕਟਰ ਜਾਂ ਫ਼ੋਨ', 'ਰੋਜ਼ਾਨਾ ਕੰਮਾਂ ਦੇ ਕਾਰਡ', 'ਚਾਰਟ ਪੇਪਰ'], comp: ['critical', 'digital', 'comm'],
        intro: 'ਪੁੱਛੋ: ਤੁਹਾਡਾ ਫ਼ੋਨ ਚਿਹਰਾ ਵੇਖ ਕੇ ਕਿਵੇਂ ਖੁੱਲ੍ਹਦਾ ਹੈ? ਵੀਡੀਓ ਐਪ ਨੂੰ ਕਿਵੇਂ ਪਤਾ ਕਿ ਤੁਹਾਨੂੰ ਕੀ ਪਸੰਦ ਹੈ?',
        steps: [
          ['ਸਾਦੇ ਸ਼ਬਦਾਂ ਵਿੱਚ AI ਦੀ ਪਰਿਭਾਸ਼ਾ ਦਿਓ: ਡਾਟਾ ਤੋਂ ਪੈਟਰਨ ਸਿੱਖ ਕੇ ਫ਼ੈਸਲੇ ਲੈਣ ਵਾਲੀਆਂ ਮਸ਼ੀਨਾਂ।', 'ਆਪਣੇ ਫ਼ੋਨ ਤੋਂ ਹਰੇਕ ਦੋ ਉਦਾਹਰਨਾਂ ਦੇਵੇ।', 10],
          ['ਕੰਮ ਛਾਂਟੋ: ਕੈਲਕੁਲੇਟਰ (ਤੈਅ ਨਿਯਮ) ਅਤੇ ਸਪੈਮ ਫਿਲਟਰ (ਸਿੱਖਣ ਵਾਲਾ)। ਡਾਟਾ, ਪੈਟਰਨ, ਭਵਿੱਖਬਾਣੀ ਸਮਝਾਓ।', 'ਸਮੂਹ ਵਿੱਚ ਕੰਮ ਕਾਰਡਾਂ ਨੂੰ "ਤੈਅ ਨਿਯਮ" ਅਤੇ "ਡਾਟਾ ਤੋਂ ਸਿੱਖਦਾ" ਵਿੱਚ ਛਾਂਟੋ।', 15],
          ['ਲਾਭ ਅਤੇ ਖ਼ਤਰਿਆਂ ਤੇ ਚਰਚਾ: ਖੇਤੀ ਅਤੇ ਸਿਹਤ ਵਿੱਚ ਮਦਦ; ਪੱਖਪਾਤ, ਨਿੱਜਤਾ, ਨਕਲੀ ਵੀਡੀਓ।', 'ਹਰ ਸਮੂਹ ਚਾਰਟ ਪੇਪਰ ਤੇ ਇੱਕ ਲਾਭ ਅਤੇ ਇੱਕ ਖ਼ਤਰਾ ਲਿਖੇ।', 10]
        ],
        recap: 'ਤਿੰਨ ਕਥਨ: AI ਜਾਂ AI ਨਹੀਂ? ਅੰਗੂਠਾ ਉੱਪਰ ਜਾਂ ਹੇਠਾਂ।',
        assess: 'ਇਸ ਹਫ਼ਤੇ ਵੇਖੀਆਂ AI ਦੀਆਂ ਪੰਜ ਵਰਤੋਂ ਅਤੇ ਇੱਕ ਖ਼ਤਰਾ ਲਿਖੋ।', hw: 'ਪਰਿਵਾਰ ਦੇ ਕਿਸੇ ਮੈਂਬਰ ਤੋਂ ਪੁੱਛੋ ਕਿ ਉਹ ਕਿਸ ਐਪ ਤੇ ਸਭ ਤੋਂ ਵੱਧ ਭਰੋਸਾ ਕਰਦੇ ਹਨ ਅਤੇ ਕਿਉਂ; ਨੋਟ ਕਰੋ ਕਿ ਕੀ ਉਹ AI ਵਰਤਦੀ ਹੈ।',
        e5: { engage: ['ਤੁਹਾਡਾ ਫ਼ੋਨ ਚਿਹਰਾ ਵੇਖ ਕੇ ਕਿਵੇਂ ਖੁੱਲ੍ਹਦਾ ਹੈ?', 5, 'ਫ਼ੋਨ'], explore: ['ਕੰਮ ਕਾਰਡ ਛਾਂਟੋ: ਤੈਅ ਨਿਯਮ ਜਾਂ ਸਿੱਖਣਾ?', 10, 'ਕੰਮ ਕਾਰਡ'], explain: ['AI ਕੀ ਹੈ: ਡਾਟਾ, ਪੈਟਰਨ, ਭਵਿੱਖਬਾਣੀ; ਕਿੱਥੇ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।', 12, 'ਪ੍ਰੋਜੈਕਟਰ'], elaborate: ['ਕਾਗਜ਼ ਤੇ ਆਪਣੇ ਸਕੂਲ ਲਈ ਸਾਦਾ AI ਸਹਾਇਕ ਡਿਜ਼ਾਈਨ ਕਰੋ।', 8, 'ਚਾਰਟ ਪੇਪਰ'], evaluate: ['AI ਦੀਆਂ ਪੰਜ ਵਰਤੋਂ ਅਤੇ ਇੱਕ ਖ਼ਤਰਾ।', 5, 'ਕਾਪੀ'] },
        support: 'ਉਦਾਹਰਨਾਂ ਤਿਆਰ ਦਿਓ; ਵਿਦਿਆਰਥੀ ਸਿਰਫ਼ ਛਾਂਟਣ।', extension: 'ਇੱਕ ਉਦਾਹਰਨ ਲੱਭੋ ਜਿੱਥੇ AI ਨੇ ਗ਼ਲਤ ਫ਼ੈਸਲਾ ਲਿਆ ਅਤੇ ਸਮਝਾਓ ਕਿਉਂ।',
        week: [['ਬੁੱਧੀ ਕੀ ਹੈ? ਇਨਸਾਨ ਅਤੇ ਮਸ਼ੀਨ', 'ਅੱਜ ਕੀਤੇ ਪੰਜ ਸਿਆਣੇ ਕੰਮਾਂ ਦੀ ਸੂਚੀ'], ['AI ਕੀ ਹੈ? ਨਿਯਮ ਜਾਂ ਸਿੱਖਣਾ', 'ਦਸ ਕੰਮ ਛਾਂਟੋ'], ['ਸਾਡੇ ਆਲੇ-ਦੁਆਲੇ AI', 'AI ਦੀਆਂ ਪੰਜ ਵਰਤੋਂ'], ['ਡਾਟਾ, ਪੈਟਰਨ ਅਤੇ ਭਵਿੱਖਬਾਣੀ', 'ਪੈਟਰਨ ਵਰਕਸ਼ੀਟ'], ['AI ਦੇ ਲਾਭ ਅਤੇ ਖ਼ਤਰੇ', 'ਇੱਕ ਸਫ਼ੇ ਦਾ ਨੋਟ'], ['ਪ੍ਰੋਜੈਕਟ: ਸਾਡੇ ਸਕੂਲ ਲਈ AI ਸਹਾਇਕ', 'ਪੋਸਟਰ']]
      }
    }
  },
  or: {
    bloom: {
      remember: ['ସଂଜ୍ଞା ଦେବା', 'ତାଲିକା କରିବା', 'ନାମ କହିବା', 'ମନେ ପକାଇ କହିବା', 'ନାମ ଲେଖିବା', 'ବିବୃତ କରିବା'],
      understand: ['ବୁଝାଇବା', 'ବର୍ଣ୍ଣନା କରିବା', 'ସାରାଂଶ କହିବା', 'ଶ୍ରେଣୀଭୁକ୍ତ କରିବା', 'ତୁଳନା କରିବା', 'ଉଦାହରଣ ଦେବା'],
      apply: ['ବ୍ୟବହାର କରିବା', 'ସମାଧାନ କରିବା', 'ଗଣନା କରିବା', 'କରି ଦେଖାଇବା', 'ପ୍ରଦର୍ଶନ କରିବା', 'ମାପିବା'],
      analyse: ['ବିଶ୍ଳେଷଣ କରିବା', 'ପାର୍ଥକ୍ୟ କହିବା', 'ପ୍ୟାଟର୍ନ ଖୋଜିବା', 'ପରୀକ୍ଷା କରିବା', 'ବାଛିବା', 'ସିଦ୍ଧାନ୍ତ କରିବା'],
      evaluate: ['ବିଚାର କରିବା', 'ଯୁକ୍ତି ଦେବା', 'ନିଷ୍ପତ୍ତି ନେବା', 'ଯାଞ୍ଚ କରିବା', 'ସପକ୍ଷରେ ଯୁକ୍ତି କରିବା', 'ମୂଲ୍ୟାଙ୍କନ କରିବା'],
      create: ['ଡିଜାଇନ୍ କରିବା', 'ତିଆରି କରିବା', 'ଯୋଜନା କରିବା', 'ରଚନା କରିବା', 'ଗଢ଼ିବା', 'ଉଦ୍ଭାବନ କରିବା']
    },
    materials: ['କଳାପଟା ଓ ଚକ୍', 'ପାଠ୍ୟପୁସ୍ତକ', 'ଚାର୍ଟ କିମ୍ବା ପୋଷ୍ଟର', 'ଫ୍ଲାସକାର୍ଡ', 'ୱାର୍କସିଟ୍', 'ପ୍ରୋଜେକ୍ଟର କିମ୍ବା ସ୍ମାର୍ଟବୋର୍ଡ', 'ପ୍ରକୃତ ଜିନିଷ', 'ଖାତା ଓ ପେନ୍ସିଲ୍'],
    ideas: {
      maths: ['କାଗଜରେ ତିଆରି କର: ଭାଙ୍ଗି କିମ୍ବା କାଟି ଆକାରରେ ଧାରଣା ଦେଖାଅ', 'ଗୋଟିଏ କଠିନ ପ୍ରଶ୍ନରେ ଭାବ-ଯୋଡ଼ିରେ ଆଲୋଚନା-ସମସ୍ତଙ୍କୁ କୁହ', 'ଗଣିତ ରିଲେ: ଦଳର ପ୍ରତ୍ୟେକ ସଦସ୍ୟ ବୋର୍ଡରେ ଗୋଟିଏ ପଦକ୍ଷେପ ସମାଧାନ କରେ', 'ଆଗ ଅନୁମାନ କର, ତାପରେ ମାପି ମିଳାଅ', 'ଏହି ଗଣିତ ବଜାର କିମ୍ବା ରୋଷେଇଘରେ ଖୋଜି ଗୋଟିଏ ଉଦାହରଣ ଆଣ'],
      science: ['ଛୋଟ ପ୍ରଦର୍ଶନ ସହ ଅନୁମାନ-ନିରୀକ୍ଷଣ-ବ୍ୟାଖ୍ୟା', 'ପ୍ରକୃତ ଜିନିଷ ଦେଖି ଚିତ୍ର ଆଙ୍କ ଓ ନାମ ଲେଖ', 'ଦଳଗତ ପରୀକ୍ଷଣ, ସମସ୍ତଙ୍କ ପାଇଁ ଗୋଟିଏ ଫଳାଫଳ ସାରଣୀ', 'କାର୍ଡଗୁଡ଼ିକୁ ଦଳରେ ବାଛ ଓ ନିୟମ ବୁଝାଅ', 'ପ୍ରତି ଦଳରୁ ଏକ ମିନିଟ୍‌ର "ବିଜ୍ଞାନ ରିପୋର୍ଟର"'],
      english: ['ଯୋଡ଼ିରେ ଜୋରରେ ପଢ଼ ଓ ଭୂମିକା ବଦଳାଅ', 'ଚାରି ଜଣିଆ ଦଳରେ ଦୃଶ୍ୟ ଅଭିନୟ କର', 'ଶବ୍ଦ ଖୋଜ: ପାଞ୍ଚଟି ନୂଆ ଶବ୍ଦ ଖୋଜି ଅର୍ଥ ଅନୁମାନ କର', 'ନିଜ ଭାଷାରେ ତିନି ଧାଡ଼ି ଲେଖ', 'ହଟ୍ ସିଟ୍: ଜଣେ ଛାତ୍ର ଚରିତ୍ର ହୋଇ ଉତ୍ତର ଦିଏ'],
      social: ['ଚଟାଣରେ ଚକ୍‌ରେ ସମୟରେଖା', 'ମାନଚିତ୍ର କାମ: ପାଞ୍ଚଟି ସ୍ଥାନ ଚିହ୍ନିତ କର', 'ଭୂମିକା ଅଭିନୟ: ସେହି ସମୟର ଗୋଟିଏ ଦିନ', 'ସେତେବେଳେ ଓ ଏବେ: T-ଚାର୍ଟରେ ତୁଳନା', 'ସ୍ଥାନୀୟ ଯୋଗ: ଘରର ବୟସ୍କଙ୍କୁ ପଚାରି କୁହ'],
      language: ['ଗପ ବୃତ୍ତ: ପ୍ରତ୍ୟେକ ଛାତ୍ର ଗୋଟିଏ ଧାଡ଼ି ଯୋଡ଼େ', 'ଚିତ୍ର କଥା: ତିନୋଟି ବାକ୍ୟରେ ବର୍ଣ୍ଣନା କର', 'ମିଳିତ ଧ୍ୱନି ଶବ୍ଦ ଖୋଜି ଗୋଟିଏ ଛନ୍ଦ ତିଆରି କର', 'ଯୋଡ଼ିରେ ଶ୍ରୁତଲିଖନ; ପରସ୍ପରର ଯାଞ୍ଚ କର', 'ହାତ କଣ୍ଢେଇରେ ଗପ ପୁଣି କୁହ'],
      ai: ['AI ଚିହ୍ନ: AI ବ୍ୟବହାର କରୁଥିବା ପାଞ୍ଚଟି ଆପ୍‌ର ତାଲିକା', 'ମଣିଷ ନା ଯନ୍ତ୍ର: କାମଗୁଡ଼ିକୁ ବାଛ', 'ପ୍ୟାଟର୍ନ ଖେଳ: ଉଦାହରଣରୁ ନିୟମ ଅନୁମାନ କର', 'କାଗଜରେ ଗୋଟିଏ ସରଳ ଚାଟବଟ୍ ସ୍କ୍ରିପ୍ଟ ଲେଖ', 'ବିତର୍କ: AI କଣ ସବୁବେଳେ ଠିକ୍?'],
      general: ['ଭାବ-ଯୋଡ଼ି-ବାଣ୍ଟ: ଏକ ମିନିଟ୍ ଏକାକୀ, ଦୁଇ ମିନିଟ୍ ଯୋଡ଼ିରେ', 'ଏକ୍ଜିଟ୍ ସ୍ଲିପ୍: ଗୋଟିଏ କଥା ଶିଖିଲି, ଗୋଟିଏ ପ୍ରଶ୍ନ ଅଛି', 'ଗ୍ୟାଲେରୀ ୱାକ୍: ଦଳମାନେ କାମ କାନ୍ଥରେ ଲଗାନ୍ତି', 'ସ୍ଲେଟ୍ ସହ ଦଳଗତ କୁଇଜ୍', 'ସହପାଠୀ ଶିକ୍ଷଣ: ସାଥୀକୁ ବୁଝାଅ']
    },
    samples: {
      fractions: {
        subjectKey: 'maths', cls: '6', subject: 'ଗଣିତ', topic: 'ଭଗ୍ନାଂଶ: ସମତୁଲ୍ୟ ଭଗ୍ନାଂଶ', period: 3, duration: 40,
        outcomes: ['ସମତୁଲ୍ୟ ଭଗ୍ନାଂଶ କଣ ବୁଝାଇ ପାରିବେ', 'ଗୁଣନ କିମ୍ବା ଭାଗ କରି ସମତୁଲ୍ୟ ଭଗ୍ନାଂଶ ତିଆରି କରିପାରିବେ', 'ଦୁଇଟି ଭଗ୍ନାଂଶ ସମତୁଲ୍ୟ କି ନୁହେଁ ଯାଞ୍ଚ କରିପାରିବେ'],
        prev: 'ଛାତ୍ରଛାତ୍ରୀ 1/2 ଓ 3/4 ପରି ଭଗ୍ନାଂଶ ପଢ଼ି-ଲେଖି ପାରନ୍ତି ଓ ଆକାରରେ ରଙ୍ଗ ଦେଇପାରନ୍ତି।',
        materials: ['କାଗଜ ପଟି', 'କଳାପଟା ଓ ଚକ୍', 'ଭଗ୍ନାଂଶ ଚାର୍ଟ'], comp: ['critical', 'collab'],
        intro: '2 ସମାନ ଖଣ୍ଡ କଟା ରୁଟି ଓ 4 ଖଣ୍ଡ କଟା ଆଉ ଗୋଟିଏ ଦେଖାନ୍ତୁ। ପଚାରନ୍ତୁ: 1/2 ଓ 2/4 କଣ ସମାନ?',
        steps: [
          ['କାଗଜ ପଟିକୁ ଅଧା, ତାପରେ ଚାରି ଭାଗ କରନ୍ତୁ; ବୋର୍ଡରେ 1/2 = 2/4 ଦେଖାନ୍ତୁ।', 'ନିଜ ପଟି ଭାଙ୍ଗି 1/2 ଓ 2/4 ରଙ୍ଗ ଦେଇ ଯୋଡ଼ିରେ ତୁଳନା କର।', 10],
          ['ନିୟମ ବୁଝାନ୍ତୁ: ଲବ ଓ ହରକୁ ସମାନ ସଂଖ୍ୟାରେ ଗୁଣନ କିମ୍ବା ଭାଗ। ଦୁଇଟି ଉଦାହରଣ କରନ୍ତୁ।', 'ଖାତାରେ 2/3 ର ତିନୋଟି ସମତୁଲ୍ୟ ଭଗ୍ନାଂଶ ତିଆରି କର।', 15],
          ['ଭଗ୍ନାଂଶ ଯୋଡ଼ା ଦିଅନ୍ତୁ; କେଉଁଗୁଡ଼ିକ ସମତୁଲ୍ୟ ଓ କିପରି ଜାଣିଲୁ ପଚାରନ୍ତୁ।', 'କ୍ରସ୍ ଗୁଣନ କରି ଯାଞ୍ଚ କର; କାରଣ ସହ ହଁ କିମ୍ବା ନା କୁହ।', 10]
        ],
        recap: 'ବୋର୍ଡରେ ତିନୋଟି ଶୀଘ୍ର ପ୍ରଶ୍ନ: ସମତୁଲ୍ୟ ନା ନୁହେଁ? ଛାତ୍ରଛାତ୍ରୀ ବୁଢ଼ା ଆଙ୍ଗୁଠି ଉପର କିମ୍ବା ତଳ ଦେଖାନ୍ତି।',
        assess: 'ଏକ୍ଜିଟ୍ ସ୍ଲିପ୍: 3/5 ର ଦୁଇଟି ସମତୁଲ୍ୟ ଭଗ୍ନାଂଶ ଲେଖ।', hw: 'NCERT ଅଭ୍ୟାସ 7.3, ପ୍ରଶ୍ନ 1 ରୁ 4।',
        e5: { engage: ['ରୁଟି ପ୍ରହେଳିକା: 1/2 ଓ 2/4 କଣ ସମାନ? ଭୋଟ ଦିଅ ଓ କାରଣ କୁହ।', 5, 'କାଗଜର ଦୁଇଟି ରୁଟି'], explore: ['ଯୋଡ଼ିରେ ପଟି ଭାଙ୍ଗି 1/2 ସହ ସମାନ ଭଗ୍ନାଂଶ ଖୋଜ।', 10, 'କାଗଜ ପଟି'], explain: ['ନିୟମ: ଲବ ଓ ହରକୁ ସମାନ ସଂଖ୍ୟାରେ ଗୁଣନ କିମ୍ବା ଭାଗ।', 10, 'କଳାପଟା'], elaborate: ['ଭଗ୍ନାଂଶ ଚାର୍ଟରେ ସମତୁଲ୍ୟ ଭଗ୍ନାଂଶ ଖୋଜି ପ୍ୟାଟର୍ନ କୁହ।', 10, 'ଭଗ୍ନାଂଶ ଚାର୍ଟ'], evaluate: ['ଏକ୍ଜିଟ୍ ସ୍ଲିପ୍: 3/5 ର ଦୁଇଟି ସମତୁଲ୍ୟ ଭଗ୍ନାଂଶ।', 5, 'କାଗଜ ସ୍ଲିପ୍'] },
        support: 'ତିଆରି ଭଗ୍ନାଂଶ ପଟି ଦିଅନ୍ତୁ; କେବଳ ଅଧା ଓ ଚଉଠ ସହ କାମ କରନ୍ତୁ।', extension: '1/2 ଓ 1 ମଧ୍ୟରେ ତିନୋଟି ଭଗ୍ନାଂଶ ଖୋଜ ଓ ସେଗୁଡ଼ିକ କ୍ରମରେ ଅଛି ବୋଲି ପ୍ରମାଣ କର।',
        week: [['ସଂଖ୍ୟାରେଖାରେ ଭଗ୍ନାଂଶ', 'ଅଭ୍ୟା. 7.1 ପ୍ର. 1–3'], ['ପ୍ରକୃତ ଓ ଅପ୍ରକୃତ ଭଗ୍ନାଂଶ', 'ଅଭ୍ୟା. 7.2 ପ୍ର. 1–2'], ['ସମତୁଲ୍ୟ ଭଗ୍ନାଂଶ', 'ଅଭ୍ୟା. 7.3 ପ୍ର. 1–4'], ['ସରଳତମ ରୂପ', 'ଅଭ୍ୟା. 7.3 ପ୍ର. 5–7'], ['ଭଗ୍ନାଂଶ ତୁଳନା', 'ଅଭ୍ୟା. 7.4 ପ୍ର. 1–3'], ['ଅଭ୍ୟାସ ଓ କୁଇଜ୍', 'ଅଧ୍ୟାୟ ପୁନରାବୃତ୍ତି']]
      },
      cell: {
        subjectKey: 'science', cls: '8', subject: 'ବିଜ୍ଞାନ', topic: 'କୋଷ: ଗଠନ ଓ କାର୍ଯ୍ୟ', period: 2, duration: 40,
        outcomes: ['କୋଷର ମୁଖ୍ୟ ଅଂଶଗୁଡ଼ିକର ନାମ କହିପାରିବେ', 'ଉଦ୍ଭିଦ କୋଷ ଓ ପ୍ରାଣୀ କୋଷର ତୁଳନା କରିପାରିବେ', 'କୋଷକୁ ଜୀବନର ମୌଳିକ ଏକକ କାହିଁକି କୁହାଯାଏ ବୁଝାଇ ପାରିବେ'],
        prev: 'ଛାତ୍ରଛାତ୍ରୀ ଜାଣନ୍ତି ଜୀବ ଛୋଟ ଛୋଟ ଅଂଶରେ ତିଆରି ଓ ସେମାନେ ହ୍ୟାଣ୍ଡ ଲେନ୍ସ ବ୍ୟବହାର କରିଛନ୍ତି।',
        materials: ['ପିଆଜ ଚୋପା ଓ ସ୍ଲାଇଡ୍', 'ଅଣୁବୀକ୍ଷଣ କିମ୍ବା କୋଷ ଚାର୍ଟ', 'ରଙ୍ଗ ପେନ୍ସିଲ୍'], comp: ['critical', 'comm'],
        intro: 'ଇଟା କାନ୍ଥର ଫଟୋ ଓ ଅଣୁବୀକ୍ଷଣ ତଳେ ପିଆଜ ଚୋପା ଦେଖାନ୍ତୁ। ପଚାରନ୍ତୁ: ଜୀବ କେଉଁଥିରେ ତିଆରି?',
        steps: [
          ['ପିଆଜ ଚୋପା ସ୍ଲାଇଡ୍ କିମ୍ବା ଚାର୍ଟ ଦେଖାନ୍ତୁ; କୋଷ ପ୍ରାଚୀର, ନ୍ୟୁକ୍ଲିୟସ୍ ଓ ସାଇଟୋପ୍ଲାଜମ୍ ଦେଖାନ୍ତୁ।', 'ଯାହା ଦେଖୁଛ ନିରୀକ୍ଷଣ କରି ଆଙ୍କ; ଦୁଇଟି ଅଂଶର ନାମ ଲେଖ।', 12],
          ['ବୋର୍ଡରେ ଭେନ୍ ଚିତ୍ରରେ ଉଦ୍ଭିଦ ଓ ପ୍ରାଣୀ କୋଷର ତୁଳନା କରନ୍ତୁ।', 'ଯୋଡ଼ିରେ ଭେନ୍ ଚିତ୍ର ପୂରଣ କର: ପ୍ରାଚୀର, କ୍ଲୋରୋପ୍ଲାଷ୍ଟ, ଭାକୁଓଲ୍, ନ୍ୟୁକ୍ଲିୟସ୍।', 13],
          ['"ସହର" ତୁଳନାରେ କୋଷର ଅଂଶ ଓ ସେମାନଙ୍କ କାମ ବୁଝାନ୍ତୁ।', 'ଅଂଶ କାର୍ଡକୁ ସେମାନଙ୍କ କାର୍ଯ୍ୟ ସହ ମିଳାଅ।', 10]
        ],
        recap: 'ଶୀଘ୍ର ପ୍ରଶ୍ନ: କୋଷକୁ ନିୟନ୍ତ୍ରଣ କରୁଥିବା ଅଂଶ; କେବଳ ଉଦ୍ଭିଦରେ ଥିବା ଅଂଶ।',
        assess: 'ପାଞ୍ଚଟି ଅଂଶ ସହ ଉଦ୍ଭିଦ କୋଷ ଆଙ୍କି ନାମ ଲେଖ।', hw: 'NCERT ଅଧ୍ୟାୟ 8, ପ୍ରଶ୍ନ 1 ରୁ 5।',
        e5: { engage: ['ଇଟା କାନ୍ଥ ନା ପିଆଜ ଚୋପା: ଜୀବ କେଉଁଥିରେ ତିଆରି?', 5, 'ଫଟୋ, ପିଆଜ ଚୋପା'], explore: ['ଦଳରେ ପିଆଜ ଚୋପା ସ୍ଲାଇଡ୍ ଦେଖି ଆଙ୍କ।', 12, 'ଅଣୁବୀକ୍ଷଣ କିମ୍ବା ଚାର୍ଟ'], explain: ['କୋଷର ଅଂଶ ଓ ସେମାନଙ୍କ କାମ; ଉଦ୍ଭିଦ କୋଷ ଓ ପ୍ରାଣୀ କୋଷ।', 10, 'କଳାପଟା, କୋଷ ଚାର୍ଟ'], elaborate: ['ମାଟି କିମ୍ବା କାଗଜରେ କୋଷ ମଡେଲ୍ ତିଆରି କର।', 8, 'ମାଟି, କାଗଜ'], evaluate: ['ଖାଲି କୋଷ ଚିତ୍ରରେ ନାମ ଲେଖ।', 5, 'ୱାର୍କସିଟ୍'] },
        support: 'ନକଲ ପାଇଁ ନାମ ଲେଖା ଚିତ୍ର ଦିଅନ୍ତୁ; ପାଞ୍ଚ ବଦଳରେ ତିନୋଟି ଅଂଶ ପଚାରନ୍ତୁ।', extension: 'ପତ୍ର କୋଷରେ କଣ ଅଛି ଯାହା ଗାଲ କୋଷରେ ନାହିଁ, ଓ କାହିଁକି, ଖୋଜ।',
        week: [['କୋଷର ଆବିଷ୍କାର; ଅଣୁବୀକ୍ଷଣ', '8.1 ପଢ଼'], ['କୋଷର ଆକାର ଓ ଆକୃତି', 'ତିନୋଟି କୋଷ ଆଙ୍କ'], ['କୋଷର ଅଂଶ', 'ପ୍ର. 1–3'], ['ଉଦ୍ଭିଦ କୋଷ ଓ ପ୍ରାଣୀ କୋଷ', 'ଭେନ୍ ଚିତ୍ର'], ['ପିଆଜ ଚୋପା ପ୍ରାୟୋଗିକ', 'ଲ୍ୟାବ୍ ଖାତା'], ['ପୁନରାବୃତ୍ତି ଓ କୁଇଜ୍', 'ଅଧ୍ୟାୟ ପୁନରାବୃତ୍ତି']]
      },
      poem: {
        subjectKey: 'english', cls: '5', subject: 'ଇଂରାଜୀ', topic: 'କବିତା: My Shadow', period: 4, duration: 35,
        outcomes: ['ଛନ୍ଦ ସହ କବିତା ଜୋରରେ ପଢ଼ିପାରିବେ', 'ମିଳିତ ଧ୍ୱନି ଶବ୍ଦ ଖୋଜି ଛାଇ କଣ କରେ କହିପାରିବେ', 'ନିଜ ଛାଇ ବିଷୟରେ ଚାରି ଧାଡ଼ି ଲେଖିପାରିବେ'],
        prev: 'ଛାତ୍ରଛାତ୍ରୀ ଖରାରେ ନିଜ ଛାଇ ଦେଖିଛନ୍ତି ଓ sun-fun ପରି ମିଳିତ ଧ୍ୱନି ଶବ୍ଦ ଜାଣନ୍ତି।',
        materials: ['ପାଠ୍ୟପୁସ୍ତକ', 'ଟର୍ଚ୍ଚ', 'କବିତା ଚାର୍ଟ'], comp: ['creativity', 'comm'],
        intro: 'ଅନ୍ଧାର କୋଣରେ ଟର୍ଚ୍ଚ ଜାଳି ହାତ ଛାଇ ତିଆରି କରନ୍ତୁ। ପଚାରନ୍ତୁ: ତୁମ ଛାଇ କେବେ ଲମ୍ବା ହୁଏ?',
        steps: [
          ['ଅଭିନୟ ସହ କବିତା ଦୁଇଥର ଜୋରରେ ପଢ଼ନ୍ତୁ; କଠିନ ଶବ୍ଦ ବୁଝାନ୍ତୁ।', 'ଶୁଣ, ତାପରେ ଏକସାଙ୍ଗେ ପଢ଼ ଓ ଧାଡ଼ିଗୁଡ଼ିକ ଅଭିନୟ କର।', 12],
          ['ପଚାରନ୍ତୁ: ପିଲା ଯାହା କରେ ଛାଇ କଣ କରେ? ମିଳିତ ଧ୍ୱନି ଯୋଡ଼ା ଖୋଜ।', 'ଯୋଡ଼ିରେ ମିଳିତ ଧ୍ୱନି ଶବ୍ଦ ତଳେ ଗାର ଦିଅ; ପ୍ରତ୍ୟେକ ଗୋଟିଏ ଯୋଡ଼ା କୁହ।', 13],
          ['ବୋର୍ଡରେ ମୋ ଛାଇ ବିଷୟରେ ଚାରି ନମୁନା ଧାଡ଼ି ଲେଖନ୍ତୁ।', 'ନିଜ ଛାଇ ବିଷୟରେ ଚାରି ଧାଡ଼ି ଲେଖି ସାଥୀକୁ ପଢ଼ି ଶୁଣାଅ।', 10]
        ],
        recap: 'ପୂରା ଶ୍ରେଣୀ ଏକାଠି ପ୍ରଥମ ପଦ ଆବୃତ୍ତି କରେ; ଗୋଟିଏ ଦଳ ମୂକାଭିନୟ କରେ।',
        assess: 'ମୌଖିକ: କବିତା ଉପରେ ତିନୋଟି ପ୍ରଶ୍ନ; ଲେଖା ଚାରି ଧାଡ଼ି ଯାଞ୍ଚ କରନ୍ତୁ।', hw: 'ପ୍ରଥମ ପଦ ମୁଖସ୍ଥ କର; ମଧ୍ୟାହ୍ନ ଓ ସନ୍ଧ୍ୟା 5ଟାରେ ନିଜ ଛାଇ ଆଙ୍କ।',
        e5: { engage: ['ଟର୍ଚ୍ଚରେ ହାତ ଛାଇ: ଛାଇ କିପରି ହୁଏ?', 5, 'ଟର୍ଚ୍ଚ'], explore: ['ଯୋଡ଼ିରେ କବିତା ପଢ଼ି ଅଜଣା ଶବ୍ଦ ଚିହ୍ନିତ କର।', 8, 'ପାଠ୍ୟପୁସ୍ତକ'], explain: ['ପ୍ରତି ପଦର ଅର୍ଥ; ମିଳିତ ଧ୍ୱନି ଶବ୍ଦ; ଛନ୍ଦ।', 10, 'କବିତା ଚାର୍ଟ'], elaborate: ['ନିଜ ଛାଇ ବିଷୟରେ ଚାରି ଧାଡ଼ି ଲେଖ।', 8, 'ଖାତା'], evaluate: ['ଗୋଟିଏ ପଦ ଆବୃତ୍ତି କର; ଦୁଇଟି ପ୍ରଶ୍ନର ଉତ୍ତର ଦିଅ।', 4, 'କବିତା ଚାର୍ଟ'] },
        support: 'ସାଥୀ ସହ ପଢ଼; ଚାରି ଧାଡ଼ି ପାଇଁ ଶବ୍ଦ ଭଣ୍ଡାର ଦିଅନ୍ତୁ।', extension: 'ମଧ୍ୟାହ୍ନରେ ଛାଇ ଛୋଟ ଓ ସନ୍ଧ୍ୟାରେ ଲମ୍ବା କାହିଁକି, ଖୋଜ।',
        week: [['କବିତା: ପଢ଼ ଓ ଉପଭୋଗ କର', 'ଘରେ ଜୋରରେ ପଢ଼'], ['ନୂଆ ଶବ୍ଦ ଓ ମିଳିତ ଧ୍ୱନି', 'ପାଞ୍ଚଟି ମିଳିତ ଧ୍ୱନି ଯୋଡ଼ା ଲେଖ'], ['ବୋଧ ପ୍ରଶ୍ନ', 'ପ୍ର. 1–4'], ['ଲେଖା: ମୋ ଛାଇ', 'ଚାରି ଧାଡ଼ି ସାର'], ['ବ୍ୟାକରଣ: କବିତାର ବିଶେଷ୍ୟ', 'ୱାର୍କସିଟ୍'], ['ଆବୃତ୍ତି ଓ ମଜା', 'ପଦ 1 ମୁଖସ୍ଥ କର']]
      },
      medieval: {
        subjectKey: 'social', cls: '7', subject: 'ସାମାଜିକ ବିଜ୍ଞାନ', topic: 'ହଜାରେ ବର୍ଷର ପରିବର୍ତ୍ତନର ଖୋଜ', period: 5, duration: 40,
        outcomes: ['"ହିନ୍ଦୁସ୍ତାନ" ଶବ୍ଦର ଅର୍ଥ ସମୟ ସହ କିପରି ବଦଳିଲା ବୁଝାଇ ପାରିବେ', 'ଐତିହାସିକ ମାନଚିତ୍ର ପଢ଼ି ଆଧୁନିକ ମାନଚିତ୍ର ସହ ତୁଳନା କରିପାରିବେ', 'ମଧ୍ୟଯୁଗ ପାଇଁ ଇତିହାସକାରମାନେ ବ୍ୟବହାର କରୁଥିବା ଉତ୍ସର ତାଲିକା କରିପାରିବେ'],
        prev: 'ଛାତ୍ରଛାତ୍ରୀ ଷଷ୍ଠ ଶ୍ରେଣୀରୁ ପ୍ରାଚୀନ ଯୁଗ ଜାଣନ୍ତି ଓ ଭାରତର ମାନଚିତ୍ର ପଢ଼ିପାରନ୍ତି।',
        materials: ['ଦୁଇଟି ମାନଚିତ୍ର: ଅଲ-ଇଦ୍ରିସି (1154) ଓ ଗୋଟିଏ ଆଧୁନିକ ମାନଚିତ୍ର', 'ପାଠ୍ୟପୁସ୍ତକ', 'ଆଟଲାସ୍'], comp: ['critical', 'comm'],
        intro: 'ଅଲ-ଇଦ୍ରିସିଙ୍କ 1154 ମାନଚିତ୍ର ଓଲଟା କରି ଦେଖାନ୍ତୁ। ପଚାରନ୍ତୁ: ଦକ୍ଷିଣ ଭାରତ ପାଉଛ?',
        steps: [
          ['ଦୁଇ ମାନଚିତ୍ରର ତୁଳନା: ନାମ, ଆକାର, କଣ ନାହିଁ।', 'ଯୋଡ଼ିରେ ତିନୋଟି ପାର୍ଥକ୍ୟ ଖୋଜ ଓ ମାନଚିତ୍ର କାହିଁକି ବଦଳେ କୁହ।', 12],
          ['ଶବ୍ଦ କିପରି ବଦଳେ ବୁଝାନ୍ତୁ: ମିନହାଜ-ଇ-ସିରାଜ, ବାବର ଓ ଆମୀର ଖୁସରୋଙ୍କ "ହିନ୍ଦୁସ୍ତାନ"।', 'ଖାତାରେ ତିନୋଟି ଅର୍ଥର ସମୟରେଖା ତିଆରି କର।', 13],
          ['ଉତ୍ସ: ପାଣ୍ଡୁଲିପି, ମୁଦ୍ରା, ଶିଳାଲେଖ, କୋଠା; ନକଲ କରିବାରେ ଲେଖା କାହିଁକି ବଦଳିଲା।', 'ଉତ୍ସ କାର୍ଡକୁ ଲିଖିତ ଓ ବସ୍ତୁଗତ ଉତ୍ସରେ ବାଛ।', 10]
        ],
        recap: 'ଶୀଘ୍ର କୁଇଜ୍: ପଞ୍ଜାବ, ହରିଆଣା ଓ ଗଙ୍ଗା-ଯମୁନା ଅଞ୍ଚଳ ପାଇଁ "ହିନ୍ଦୁସ୍ତାନ" କିଏ ବ୍ୟବହାର କଲେ?',
        assess: 'ସ୍ଥାନ ନାମର ଅର୍ଥ କାହିଁକି ବଦଳିପାରେ, ଦୁଇଟି କାରଣ ଲେଖ।', hw: 'NCERT ଅଧ୍ୟାୟ 1, "Let\'s recall" ପ୍ରଶ୍ନ 1 ରୁ 3।',
        e5: { engage: ['1154 ର ଗୋଟିଏ ଓଲଟା ମାନଚିତ୍ର: କଣ ଦେଖୁଛ?', 5, 'ମାନଚିତ୍ର ପ୍ରିଣ୍ଟ'], explore: ['ଦଳରେ ପୁରୁଣା ଓ ନୂଆ ମାନଚିତ୍ରର ତୁଳନା କର।', 10, 'ଦୁଇଟି ମାନଚିତ୍ର'], explain: ['ବଦଳୁଥିବା ନାମ ଓ ଅର୍ଥ; ଏହି ଯୁଗର ଉତ୍ସ।', 12, 'ପାଠ୍ୟପୁସ୍ତକ, କଳାପଟା'], elaborate: ['"ହିନ୍ଦୁସ୍ତାନ" ଶବ୍ଦର ସମୟରେଖା ଆଙ୍କ।', 8, 'ଖାତା'], evaluate: ['ସ୍ଥାନ ନାମର ଅର୍ଥ ବଦଳିବାର ଦୁଇଟି କାରଣ।', 5, 'କାଗଜ ସ୍ଲିପ୍'] },
        support: 'ନାମ ଆଗରୁ ଲେଖା ମାନଚିତ୍ର ଦିଅନ୍ତୁ; ଗୋଟିଏ ପାର୍ଥକ୍ୟ ପଚାରନ୍ତୁ।', extension: '500 ବର୍ଷ ପୂର୍ବେ ତୁମ ସହର କିମ୍ବା ରାଜ୍ୟକୁ କଣ କୁହାଯାଉଥିଲା, ଖୋଜ।',
        week: [['ପୁରୁଣା ମାନଚିତ୍ର ଓ ନୂଆ ମାନଚିତ୍ର', '1.1 ପଢ଼'], ['ନୂଆ ଓ ପୁରୁଣା ଶବ୍ଦ: ହିନ୍ଦୁସ୍ତାନ', 'ସମୟରେଖା'], ['ଇତିହାସକାର ଓ ସେମାନଙ୍କ ଉତ୍ସ', 'ପ୍ର. 1–3'], ['ନୂଆ ସାମାଜିକ ଓ ରାଜନୈତିକ ଗୋଷ୍ଠୀ', '1.3 ପଢ଼'], ['ଅଞ୍ଚଳ ଓ ସାମ୍ରାଜ୍ୟ; ପୁରୁଣା ଓ ନୂଆ ଧର୍ମ', 'ସଂକ୍ଷିପ୍ତ ଟିପ୍ପଣୀ'], ['ପୁନରାବୃତ୍ତି ଓ ମାନଚିତ୍ର କାମ', 'ପାଞ୍ଚଟି ସ୍ଥାନ ଚିହ୍ନିତ କର']]
      },
      story: {
        subjectKey: 'language', cls: '4', subject: 'ଓଡ଼ିଆ', topic: 'ଗପ: ତୃଷାର୍ତ୍ତ କାଉ', period: 1, duration: 35,
        outcomes: ['ଗପକୁ ଠିକ୍ କ୍ରମରେ ପୁଣି କହିପାରିବେ', 'ପାଞ୍ଚଟି ନୂଆ ଶବ୍ଦର ଅର୍ଥ କହିପାରିବେ', 'କାଉ କଣ କଲା ଓ ତାହା କାହିଁକି କାମ କଲା କହିପାରିବେ'],
        prev: 'ଛାତ୍ରଛାତ୍ରୀ ଛୋଟ ବାକ୍ୟ ପଢ଼ିପାରନ୍ତି ଓ ଘରେ ଲୋକକଥା ଶୁଣିଛନ୍ତି।',
        materials: ['ଗପର ଚିତ୍ର କାର୍ଡ', 'ଗୋଟିଏ ମାଠିଆ, ପାଣି ଓ ଗୋଡ଼ି', 'ପାଠ୍ୟପୁସ୍ତକ'], comp: ['critical', 'creativity', 'comm'],
        intro: 'ଅଳ୍ପ ପାଣି ଥିବା ମାଠିଆ ଓ ଗୋଟିଏ ପଥର ଦେଖାନ୍ତୁ। ପଚାରନ୍ତୁ: ପକ୍ଷୀ ଏହି ପାଣି କିପରି ପିଇପାରିବ?',
        steps: [
          ['ଚିତ୍ର କାର୍ଡ ଓ ସ୍ୱର ବଦଳାଇ ଗପ କୁହନ୍ତୁ।', 'ଶୁଣ; ଦୁଇ ଜାଗାରେ ଅନୁମାନ କର ପରେ କଣ ହେବ।', 10],
          ['ଗପ ଜୋରରେ ପଢ଼ନ୍ତୁ; ଅଭିନୟରେ ନୂଆ ଶବ୍ଦ ବୁଝାନ୍ତୁ।', 'ଯୋଡ଼ିରେ ପଢ଼; ନୂଆ ଶବ୍ଦ ତଳେ ଗାର ଦିଅ; ଦୁଇଟିରେ ବାକ୍ୟ ତିଆରି କର।', 15],
          ['ମାଠିଆରେ ଗୋଡ଼ି ପରୀକ୍ଷଣ କରନ୍ତୁ।', 'ଗୋଟିଏ ଗୋଟିଏ ଗୋଡ଼ି ପକାଅ, ପାଣି ଉଠିବା ଦେଖ ଓ କାହିଁକି ହୁଏ କୁହ।', 10]
        ],
        recap: 'ବୋର୍ଡରେ ଚିତ୍ର କାର୍ଡ କ୍ରମରେ ସଜାଅ।',
        assess: 'ସାଥୀକୁ ପାଞ୍ଚଟି ବାକ୍ୟରେ ଗପ ପୁଣି କୁହ।', hw: 'କାଉ ଓ ମାଠିଆ ଆଙ୍କ; ତିନୋଟି ବାକ୍ୟ ଲେଖ।',
        e5: { engage: ['ଅଳ୍ପ ପାଣି ଥିବା ମାଠିଆ: ପକ୍ଷୀ କିପରି ପିଇବ?', 5, 'ମାଠିଆ, ପାଣି'], explore: ['ଦଳରେ ଗୋଡ଼ି ପକାଇ ଦେଖ: ପାଣି ଉଠୁଛି କି?', 8, 'ମାଠିଆ, ଗୋଡ଼ି'], explain: ['ଗପ ପଢ଼; ନୂଆ ଶବ୍ଦ ଓ ଗପର ଶିକ୍ଷା।', 10, 'ପାଠ୍ୟପୁସ୍ତକ, ଚିତ୍ର କାର୍ଡ'], elaborate: ['ତିନି ଜଣିଆ ଦଳରେ ଗପ ଅଭିନୟ କର।', 8, 'ଚିତ୍ର କାର୍ଡ'], evaluate: ['ପାଞ୍ଚଟି ବାକ୍ୟରେ ଗପ ପୁଣି କୁହ।', 4, 'ଚିତ୍ର କାର୍ଡ'] },
        support: 'ଚିତ୍ର କାର୍ଡ କ୍ରମରେ ଦିଅନ୍ତୁ; ସେଗୁଡ଼ିକ ସହ କହିବାକୁ ଦିଅନ୍ତୁ।', extension: 'ଶେଷ ବଦଳାଅ: ଗୋଡ଼ି ନ ଥିଲେ କଣ ହୋଇଥାନ୍ତା?',
        week: [['ଗପ ଶୁଣ', 'ଘରେ କୁହ'], ['ପଢ଼; ନୂଆ ଶବ୍ଦ', 'ପାଞ୍ଚଟି ଶବ୍ଦ, ପାଞ୍ଚଟି ବାକ୍ୟ'], ['ଗୋଡ଼ି ପରୀକ୍ଷଣ ଓ ତାହା କାହିଁକି କାମ କରେ', 'ଚିତ୍ର ଆଙ୍କ'], ['ଗପ ଅଭିନୟ', 'ନିଜ ସଂଳାପ ଅଭ୍ୟାସ କର'], ['ନିଜର ଶେଷ ଲେଖ', 'ଶେଷ ସାର'], ['ପୁନରାବୃତ୍ତି ଓ ଜୋରରେ ପଢ଼ା', 'ପୃଷ୍ଠା 1 ଜୋରରେ ପଢ଼']]
      },
      ai: {
        subjectKey: 'ai', cls: '9', subject: 'କୃତ୍ରିମ ବୁଦ୍ଧିମତ୍ତା', topic: 'AI କଣ?', period: 6, duration: 40,
        outcomes: ['ସ୍ଥିର ନିୟମ ମାନୁଥିବା ଯନ୍ତ୍ର ଓ ତଥ୍ୟରୁ ଶିଖୁଥିବା ଯନ୍ତ୍ର ମଧ୍ୟରେ ପାର୍ଥକ୍ୟ କହିପାରିବେ', 'ଦୈନନ୍ଦିନ ଜୀବନରେ AI ର ପାଞ୍ଚଟି ବ୍ୟବହାର ତାଲିକା କରିପାରିବେ', 'AI ର ଗୋଟିଏ ଲାଭ ଓ ଗୋଟିଏ ବିପଦ ଉପରେ ଆଲୋଚନା କରିପାରିବେ'],
        prev: 'ଛାତ୍ରଛାତ୍ରୀ ସ୍ମାର୍ଟଫୋନ୍, ମ୍ୟାପ୍, ଭଏସ୍ ଆସିଷ୍ଟାଣ୍ଟ ଓ ଭିଡିଓ ଆପ୍ ବ୍ୟବହାର କରନ୍ତି।',
        materials: ['ପ୍ରୋଜେକ୍ଟର କିମ୍ବା ଫୋନ୍', 'ଦୈନନ୍ଦିନ କାମର କାର୍ଡ', 'ଚାର୍ଟ ପେପର'], comp: ['critical', 'digital', 'comm'],
        intro: 'ପଚାରନ୍ତୁ: ତୁମ ଫୋନ୍ ମୁହଁ ଦେଖି କିପରି ଖୋଲେ? ଭିଡିଓ ଆପ୍ କିପରି ଜାଣେ ତୁମେ କଣ ପସନ୍ଦ କର?',
        steps: [
          ['ସରଳ ଭାଷାରେ AI ର ସଂଜ୍ଞା ଦିଅନ୍ତୁ: ତଥ୍ୟରୁ ପ୍ୟାଟର୍ନ ଶିଖି ନିଷ୍ପତ୍ତି ନେଉଥିବା ଯନ୍ତ୍ର।', 'ନିଜ ଫୋନ୍‌ରୁ ପ୍ରତ୍ୟେକ ଦୁଇଟି ଉଦାହରଣ ଦିଅ।', 10],
          ['କାମ ବାଛନ୍ତୁ: କ୍ୟାଲକୁଲେଟର (ସ୍ଥିର ନିୟମ) ଓ ସ୍ପାମ୍ ଫିଲ୍ଟର (ଶିଖୁଥିବା)। ତଥ୍ୟ, ପ୍ୟାଟର୍ନ, ପୂର୍ବାନୁମାନ ବୁଝାନ୍ତୁ।', 'ଦଳରେ କାମ କାର୍ଡକୁ "ସ୍ଥିର ନିୟମ" ଓ "ତଥ୍ୟରୁ ଶିଖେ" ରେ ବାଛ।', 15],
          ['ଲାଭ ଓ ବିପଦ ଆଲୋଚନା: କୃଷି ଓ ସ୍ୱାସ୍ଥ୍ୟରେ ସାହାଯ୍ୟ; ପକ୍ଷପାତ, ଗୋପନୀୟତା, ନକଲି ଭିଡିଓ।', 'ପ୍ରତି ଦଳ ଚାର୍ଟ ପେପରରେ ଗୋଟିଏ ଲାଭ ଓ ଗୋଟିଏ ବିପଦ ଲେଖେ।', 10]
        ],
        recap: 'ତିନୋଟି ବକ୍ତବ୍ୟ: AI ନା AI ନୁହେଁ? ବୁଢ଼ା ଆଙ୍ଗୁଠି ଉପର କିମ୍ବା ତଳ।',
        assess: 'ଏହି ସପ୍ତାହରେ ଦେଖିଥିବା AI ର ପାଞ୍ଚଟି ବ୍ୟବହାର ଓ ଗୋଟିଏ ବିପଦ ଲେଖ।', hw: 'ପରିବାରର ଜଣଙ୍କୁ ପଚାର କେଉଁ ଆପ୍ ଉପରେ ସବୁଠୁ ବେଶି ଭରସା କରନ୍ତି ଓ କାହିଁକି; ତାହା AI ବ୍ୟବହାର କରେ କି ଲେଖ।',
        e5: { engage: ['ତୁମ ଫୋନ୍ ମୁହଁ ଦେଖି କିପରି ଖୋଲେ?', 5, 'ଫୋନ୍'], explore: ['କାମ କାର୍ଡ ବାଛ: ସ୍ଥିର ନିୟମ ନା ଶିଖିବା?', 10, 'କାମ କାର୍ଡ'], explain: ['AI କଣ: ତଥ୍ୟ, ପ୍ୟାଟର୍ନ, ପୂର୍ବାନୁମାନ; କେଉଁଠି ବ୍ୟବହାର ହୁଏ।', 12, 'ପ୍ରୋଜେକ୍ଟର'], elaborate: ['କାଗଜରେ ତୁମ ବିଦ୍ୟାଳୟ ପାଇଁ ଗୋଟିଏ ସରଳ AI ସହାୟକ ଡିଜାଇନ୍ କର।', 8, 'ଚାର୍ଟ ପେପର'], evaluate: ['AI ର ପାଞ୍ଚଟି ବ୍ୟବହାର ଓ ଗୋଟିଏ ବିପଦ।', 5, 'ଖାତା'] },
        support: 'ଉଦାହରଣ ତିଆରି କରି ଦିଅନ୍ତୁ; ଛାତ୍ରଛାତ୍ରୀ କେବଳ ବାଛନ୍ତୁ।', extension: 'AI ଭୁଲ ନିଷ୍ପତ୍ତି ନେଇଥିବା ଗୋଟିଏ ଉଦାହରଣ ଖୋଜ ଓ କାହିଁକି ବୁଝାଅ।',
        week: [['ବୁଦ୍ଧିମତ୍ତା କଣ? ମଣିଷ ଓ ଯନ୍ତ୍ର', 'ଆଜି କରିଥିବା ପାଞ୍ଚଟି ଚତୁର କାମର ତାଲିକା'], ['AI କଣ? ନିୟମ ନା ଶିଖିବା', 'ଦଶଟି କାମ ବାଛ'], ['ଆମ ଚାରିପାଖରେ AI', 'AI ର ପାଞ୍ଚଟି ବ୍ୟବହାର'], ['ତଥ୍ୟ, ପ୍ୟାଟର୍ନ ଓ ପୂର୍ବାନୁମାନ', 'ପ୍ୟାଟର୍ନ ୱାର୍କସିଟ୍'], ['AI ର ଲାଭ ଓ ବିପଦ', 'ଏକ ପୃଷ୍ଠାର ଟିପ୍ପଣୀ'], ['ପ୍ରକଳ୍ପ: ଆମ ବିଦ୍ୟାଳୟ ପାଇଁ AI ସହାୟକ', 'ପୋଷ୍ଟର']]
      }
    }
  },
  ta: {
    bloom: {
      remember: ['வரையறு', 'பட்டியலிடு', 'பெயர் கூறு', 'நினைவுகூர்', 'பெயரிடு', 'கூறு'],
      understand: ['விளக்கு', 'விவரி', 'சுருக்கிக் கூறு', 'வகைப்படுத்து', 'ஒப்பிடு', 'எடுத்துக்காட்டு தரு'],
      apply: ['பயன்படுத்து', 'தீர்வு காண்', 'கணக்கிடு', 'செய்து காட்டு', 'காட்டு', 'அளவிடு'],
      analyse: ['பகுப்பாய்வு செய்', 'வேறுபடுத்து', 'ஒழுங்கைக் கண்டறி', 'ஆராய்', 'வகைப்பிரி', 'முடிவுக்கு வா'],
      evaluate: ['தீர்ப்பளி', 'நியாயப்படுத்து', 'முடிவெடு', 'சரிபார்', 'ஆதரித்து வாதிடு', 'மதிப்பிடு'],
      create: ['வடிவமை', 'உருவாக்கு', 'திட்டமிடு', 'இயற்று', 'கட்டமை', 'புதிதாகக் கண்டுபிடி']
    },
    materials: ['கரும்பலகை & சுண்ணக்கட்டி', 'பாடநூல்', 'விளக்கப்படம் அல்லது சுவரொட்டி', 'ஃபிளாஷ் கார்டுகள்', 'பயிற்சித் தாள்', 'புரொஜெக்டர் அல்லது ஸ்மார்ட் போர்டு', 'உண்மையான பொருட்கள்', 'குறிப்பேடு & பென்சில்'],
    ideas: {
      maths: ['காகிதத்தில் செய்: மடித்து அல்லது வெட்டி வடிவங்களால் கருத்தைக் காட்டு', 'ஒரு கடினமான கேள்வியில் சிந்தி-இணையில் பேசு-பகிர்', 'கணித ரிலே: குழுவில் ஒவ்வொருவரும் பலகையில் ஒரு படியைத் தீர்க்கிறார்', 'முதலில் மதிப்பிடு, பிறகு அளந்து ஒப்பிடு', 'இந்தக் கணிதத்தைச் சந்தையிலோ சமையலறையிலோ கண்டுபிடித்து ஒரு எடுத்துக்காட்டு கொண்டு வா'],
      science: ['சிறு செயல்முறை விளக்கத்துடன் கணி-கவனி-விளக்கு', 'உண்மையான பொருளைப் பார்த்து வரைந்து பெயரிடு', 'குழுச் சோதனை, பொதுவான முடிவு அட்டவணையுடன்', 'அட்டைகளைக் குழுக்களாகப் பிரித்து விதியை விளக்கு', 'ஒவ்வொரு குழுவிலிருந்தும் ஒரு நிமிட "அறிவியல் செய்தியாளர்"'],
      english: ['இணையாக உரக்கப் படித்துப் பாத்திரங்களை மாற்று', 'நான்கு பேர் குழுவில் காட்சியை நடித்துக் காட்டு', 'சொல் வேட்டை: ஐந்து புதிய சொற்களைக் கண்டுபிடித்துப் பொருளை ஊகி', 'உன் சொந்த வார்த்தைகளில் மூன்று வரிகள் எழுது', 'ஹாட் சீட்: ஒரு மாணவர் கதாபாத்திரமாகப் பதிலளிக்கிறார்'],
      social: ['தரையில் சுண்ணக்கட்டியால் காலக்கோடு', 'வரைபடப் பணி: ஐந்து இடங்களைக் குறி', 'நாடகம்: அந்தக் காலத்தின் ஒரு நாள்', 'அன்றும் இன்றும்: T-அட்டவணையில் ஒப்பிடு', 'உள்ளூர் தொடர்பு: வீட்டில் பெரியவரைக் கேட்டுக் கூறு'],
      language: ['கதை வட்டம்: ஒவ்வொரு மாணவரும் ஒரு வரி சேர்க்கிறார்', 'படப் பேச்சு: மூன்று வாக்கியங்களில் விவரி', 'எதுகை மோனைச் சொற்களைக் கண்டுபிடித்துப் பாட்டு உருவாக்கு', 'இணையில் சொல்வதெழுதுதல்; ஒருவர் மற்றவரைச் சரிபார்க்க', 'கைப்பொம்மைகளால் கதையை மீண்டும் சொல்'],
      ai: ['AI-ஐக் கண்டுபிடி: AI பயன்படுத்தும் ஐந்து செயலிகளைப் பட்டியலிடு', 'மனிதனா இயந்திரமா: பணிகளைப் பிரி', 'ஒழுங்கு விளையாட்டு: எடுத்துக்காட்டுகளிலிருந்து விதியை ஊகி', 'காகிதத்தில் எளிய சாட்பாட் உரையாடல் எழுது', 'விவாதம்: AI எப்போதும் சரியா?'],
      general: ['சிந்தி-இணையில் பேசு-பகிர்: ஒரு நிமிடம் தனியாக, இரண்டு நிமிடம் இணையாக', 'வெளியேறும் சீட்டு: நான் கற்ற ஒன்று, என் ஒரு கேள்வி', 'காட்சியக நடை: குழுக்கள் தங்கள் வேலையைச் சுவரில் ஒட்டுகின்றன', 'சிலேட்டுகளுடன் குழு வினாடி வினா', 'சக மாணவருக்குக் கற்பித்தல்: உன் இணையருக்கு விளக்கு']
    },
    samples: {
      fractions: {
        subjectKey: 'maths', cls: '6', subject: 'கணிதம்', topic: 'பின்னங்கள்: சமான பின்னங்கள்', period: 3, duration: 40,
        outcomes: ['சமான பின்னம் என்றால் என்ன என்று விளக்க முடியும்', 'பெருக்கியோ வகுத்தோ சமான பின்னங்களை உருவாக்க முடியும்', 'இரு பின்னங்கள் சமானமா என்று சரிபார்க்க முடியும்'],
        prev: 'மாணவர்கள் 1/2, 3/4 போன்ற பின்னங்களைப் படிக்கவும் எழுதவும் வடிவத்தில் நிழலிடவும் முடியும்.',
        materials: ['காகிதப் பட்டைகள்', 'கரும்பலகை & சுண்ணக்கட்டி', 'பின்ன விளக்கப்படம்'], comp: ['critical', 'collab'],
        intro: '2 சம துண்டுகளாக வெட்டிய ஒரு ரொட்டியையும் 4 துண்டுகளாக வெட்டிய மற்றொன்றையும் காட்டுங்கள். கேளுங்கள்: 1/2 உம் 2/4 உம் ஒன்றா?',
        steps: [
          ['காகிதப் பட்டையை இரண்டாக, பிறகு நான்காக மடியுங்கள்; பலகையில் 1/2 = 2/4 காட்டுங்கள்.', 'தம் பட்டைகளை மடித்து 1/2, 2/4 நிழலிட்டு இணையில் ஒப்பிடுவர்.', 10],
          ['விதியை விளக்குங்கள்: மேலெண்ணையும் கீழெண்ணையும் ஒரே எண்ணால் பெருக்கவோ வகுக்கவோ. இரண்டு எடுத்துக்காட்டுகள் செய்யுங்கள்.', 'குறிப்பேட்டில் 2/3 இன் மூன்று சமான பின்னங்களை உருவாக்குவர்.', 15],
          ['பின்ன இணைகளைக் கொடுங்கள்; எவை சமானம், எப்படித் தெரியும் என்று கேளுங்கள்.', 'குறுக்குப் பெருக்கலால் சரிபார்த்துக் காரணத்துடன் ஆம்/இல்லை கூறுவர்.', 10]
        ],
        recap: 'பலகையில் மூன்று விரைவுக் கேள்விகள்: சமானமா இல்லையா? மாணவர்கள் கட்டைவிரல் மேலே அல்லது கீழே காட்டுவர்.',
        assess: 'வெளியேறும் சீட்டு: 3/5 இன் இரண்டு சமான பின்னங்களை எழுது.', hw: 'NCERT பயிற்சி 7.3, கேள்விகள் 1 முதல் 4.',
        e5: { engage: ['ரொட்டிப் புதிர்: 1/2 உம் 2/4 உம் ஒன்றா? வாக்களித்துக் காரணம் கூறு.', 5, 'இரண்டு காகித ரொட்டிகள்'], explore: ['இணையாகப் பட்டைகளை மடித்து 1/2 க்குச் சமமான பின்னங்களைக் கண்டுபிடி.', 10, 'காகிதப் பட்டைகள்'], explain: ['விதி: மேலெண்ணையும் கீழெண்ணையும் ஒரே எண்ணால் பெருக்கு அல்லது வகு.', 10, 'கரும்பலகை'], elaborate: ['பின்ன விளக்கப்படத்தில் சமான பின்னங்களைக் கண்டுபிடித்து ஒழுங்கை விவரி.', 10, 'பின்ன விளக்கப்படம்'], evaluate: ['வெளியேறும் சீட்டு: 3/5 இன் இரண்டு சமான பின்னங்கள்.', 5, 'காகிதச் சீட்டுகள்'] },
        support: 'தயாராக்கிய பின்னப் பட்டைகளைக் கொடுங்கள்; பாதி, கால் மட்டும் பயன்படுத்துங்கள்.', extension: '1/2 க்கும் 1 க்கும் இடையே மூன்று பின்னங்களைக் கண்டுபிடித்து அவை வரிசையில் உள்ளன என நிரூபி.',
        week: [['எண்கோட்டில் பின்னங்கள்', 'பயி. 7.1 கே. 1–3'], ['தகு, தகா பின்னங்கள்', 'பயி. 7.2 கே. 1–2'], ['சமான பின்னங்கள்', 'பயி. 7.3 கே. 1–4'], ['எளிய வடிவம்', 'பயி. 7.3 கே. 5–7'], ['பின்னங்களை ஒப்பிடுதல்', 'பயி. 7.4 கே. 1–3'], ['பயிற்சியும் வினாடி வினாவும்', 'அத்தியாயத்தைத் திருப்பிப் படி']]
      },
      cell: {
        subjectKey: 'science', cls: '8', subject: 'அறிவியல்', topic: 'செல்: அமைப்பும் செயல்பாடுகளும்', period: 2, duration: 40,
        outcomes: ['செல்லின் முக்கியப் பகுதிகளின் பெயர்களைக் கூற முடியும்', 'தாவரச் செல்லையும் விலங்குச் செல்லையும் ஒப்பிட முடியும்', 'செல் ஏன் உயிரின் அடிப்படை அலகு எனப்படுகிறது என்று விளக்க முடியும்'],
        prev: 'உயிரினங்கள் சிறு பகுதிகளால் ஆனவை என மாணவர்களுக்குத் தெரியும்; கைப் பூதக்கண்ணாடியைப் பயன்படுத்தியுள்ளனர்.',
        materials: ['வெங்காயத் தோல் & ஸ்லைடு', 'நுண்ணோக்கி அல்லது செல் விளக்கப்படம்', 'வண்ணப் பென்சில்கள்'], comp: ['critical', 'comm'],
        intro: 'செங்கல் சுவரின் படத்தையும் நுண்ணோக்கியில் வெங்காயத் தோலையும் காட்டுங்கள். கேளுங்கள்: உயிரினங்கள் எதனால் ஆனவை?',
        steps: [
          ['வெங்காயத் தோல் ஸ்லைடு அல்லது விளக்கப்படத்தைக் காட்டுங்கள்; செல் சுவர், உட்கரு, சைட்டோபிளாசத்தைச் சுட்டிக்காட்டுங்கள்.', 'பார்ப்பதைக் கவனித்து வரைவர்; இரண்டு பகுதிகளுக்குப் பெயரிடுவர்.', 12],
          ['பலகையில் வென் படத்தால் தாவர, விலங்குச் செல்களை ஒப்பிடுங்கள்.', 'இணையாக வென் படத்தை நிரப்புவர்: சுவர், பசுங்கணிகம், நுண்குமிழ், உட்கரு.', 13],
          ['"நகரம்" ஒப்பீட்டுடன் செல் பகுதிகளையும் அவற்றின் வேலைகளையும் விளக்குங்கள்.', 'பகுதி அட்டைகளை அவற்றின் செயல்பாடுகளுடன் பொருத்துவர்.', 10]
        ],
        recap: 'விரைவு வினா: செல்லைக் கட்டுப்படுத்தும் பகுதி; தாவரங்களுக்கு மட்டும் உள்ள பகுதி.',
        assess: 'ஐந்து பகுதிகளுடன் தாவரச் செல்லை வரைந்து பெயரிடு.', hw: 'NCERT அத்தியாயம் 8, கேள்விகள் 1 முதல் 5.',
        e5: { engage: ['செங்கல் சுவரா வெங்காயத் தோலா: உயிரினங்கள் எதனால் ஆனவை?', 5, 'படம், வெங்காயத் தோல்'], explore: ['குழுக்களாக வெங்காயத் தோல் ஸ்லைடைக் கவனித்து வரை.', 12, 'நுண்ணோக்கி அல்லது விளக்கப்படம்'], explain: ['செல்லின் பகுதிகளும் வேலைகளும்; தாவரச் செல், விலங்குச் செல்.', 10, 'கரும்பலகை, செல் விளக்கப்படம்'], elaborate: ['களிமண் அல்லது காகிதத்தால் செல் மாதிரி செய்.', 8, 'களிமண், காகிதம்'], evaluate: ['வெற்றுச் செல் படத்தில் பெயரிடு.', 5, 'பயிற்சித் தாள்'] },
        support: 'பெயரிட்ட படத்தை நகலெடுக்கக் கொடுங்கள்; ஐந்துக்குப் பதில் மூன்று பகுதிகள் கேளுங்கள்.', extension: 'இலைச் செல்லில் இருக்கும், கன்னச் செல்லில் இல்லாதது என்ன, ஏன் என்று கண்டுபிடி.',
        week: [['செல்லின் கண்டுபிடிப்பு; நுண்ணோக்கி', '8.1 படி'], ['செல்லின் வடிவமும் அளவும்', 'மூன்று செல்களை வரை'], ['செல்லின் பகுதிகள்', 'கே. 1–3'], ['தாவரச் செல், விலங்குச் செல்', 'வென் படம்'], ['வெங்காயத் தோல் செய்முறை', 'ஆய்வக ஏடு'], ['மீள்பார்வையும் வினாடி வினாவும்', 'அத்தியாயத்தைத் திருப்பிப் படி']]
      },
      poem: {
        subjectKey: 'english', cls: '5', subject: 'ஆங்கிலம்', topic: 'கவிதை: My Shadow', period: 4, duration: 35,
        outcomes: ['கவிதையைத் தாளத்துடன் உரக்கப் படிக்க முடியும்', 'எதுகைச் சொற்களைக் கண்டுபிடித்து நிழல் என்ன செய்கிறது என்று கூற முடியும்', 'தம் நிழலைப் பற்றி நான்கு வரிகள் எழுத முடியும்'],
        prev: 'மாணவர்கள் வெயிலில் தம் நிழலைப் பார்த்துள்ளனர்; sun, fun போன்ற எதுகைச் சொற்களை அறிவர்.',
        materials: ['பாடநூல்', 'டார்ச்', 'கவிதை விளக்கப்படம்'], comp: ['creativity', 'comm'],
        intro: 'மங்கலான மூலையில் டார்ச் அடித்துக் கை நிழல்களை உருவாக்குங்கள். கேளுங்கள்: உன் நிழல் எப்போது உயரமாகிறது?',
        steps: [
          ['செயல்களுடன் கவிதையை இருமுறை உரக்கப் படியுங்கள்; கடினச் சொற்களை விளக்குங்கள்.', 'கேட்பர், பிறகு கோரஸாகப் படித்து வரிகளை நடித்துக் காட்டுவர்.', 12],
          ['கேளுங்கள்: குழந்தை செய்வதை நிழல் என்ன செய்கிறது? எதுகை இணைகளைக் கண்டுபிடி.', 'இணையாக எதுகைச் சொற்களைக் கோடிடுவர்; ஒவ்வொருவரும் ஒரு இணையைப் பகிர்வர்.', 13],
          ['பலகையில் என் நிழலைப் பற்றி நான்கு மாதிரி வரிகள் எழுதுங்கள்.', 'தம் நிழலைப் பற்றி நான்கு வரிகள் எழுதி இணையருக்குப் படித்துக் காட்டுவர்.', 10]
        ],
        recap: 'வகுப்பு முழுவதும் முதல் பத்தியை ஒன்றாக ஒப்புவிக்கும்; ஒரு குழு அதை மௌன நடிப்பாகச் செய்யும்.',
        assess: 'வாய்மொழி: கவிதையில் மூன்று கேள்விகள்; எழுதிய நான்கு வரிகளைச் சரிபார்.', hw: 'முதல் பத்தியை மனப்பாடம் செய்; நண்பகலிலும் மாலை 5 மணிக்கும் உன் நிழலை வரை.',
        e5: { engage: ['டார்ச்சுடன் கை நிழல்கள்: நிழல் எப்படி உண்டாகிறது?', 5, 'டார்ச்'], explore: ['இணையாகக் கவிதையைப் படித்துத் தெரியாத சொற்களைக் குறி.', 8, 'பாடநூல்'], explain: ['ஒவ்வொரு பத்தியின் பொருள்; எதுகைச் சொற்கள்; தாளம்.', 10, 'கவிதை விளக்கப்படம்'], elaborate: ['உன் நிழலைப் பற்றி நான்கு வரிகள் எழுது.', 8, 'குறிப்பேடு'], evaluate: ['ஒரு பத்தியை ஒப்புவி; இரண்டு கேள்விகளுக்குப் பதிலளி.', 4, 'கவிதை விளக்கப்படம்'] },
        support: 'நண்பருடன் படிக்கச் சொல்லுங்கள்; நான்கு வரிகளுக்குச் சொல் வங்கி கொடுங்கள்.', extension: 'நண்பகலில் நிழல் குட்டையாகவும் மாலையில் நீளமாகவும் ஏன் இருக்கிறது என்று கண்டுபிடி.',
        week: [['கவிதை: படித்து மகிழ்', 'வீட்டில் உரக்கப் படி'], ['புதிய சொற்களும் எதுகையும்', 'ஐந்து எதுகை இணைகள் எழுது'], ['புரிதல் கேள்விகள்', 'கே. 1–4'], ['எழுத்து: என் நிழல்', 'நான்கு வரிகளை முடி'], ['இலக்கணம்: கவிதையில் பெயர்ச்சொற்கள்', 'பயிற்சித் தாள்'], ['ஒப்புவித்தலும் மகிழ்ச்சியும்', 'பத்தி 1 மனப்பாடம்']]
      },
      medieval: {
        subjectKey: 'social', cls: '7', subject: 'சமூக அறிவியல்', topic: 'ஆயிரம் ஆண்டு மாற்றங்களைத் தேடி', period: 5, duration: 40,
        outcomes: ['"ஹிந்துஸ்தான்" என்ற சொல்லின் பொருள் காலப்போக்கில் எப்படி மாறியது என்று விளக்க முடியும்', 'வரலாற்று வரைபடத்தைப் படித்து நவீன வரைபடத்துடன் ஒப்பிட முடியும்', 'இடைக்காலத்திற்கு வரலாற்றாசிரியர்கள் பயன்படுத்தும் ஆதாரங்களைப் பட்டியலிட முடியும்'],
        prev: 'மாணவர்கள் 6ஆம் வகுப்பிலிருந்து பண்டைய காலத்தை அறிவர்; இந்திய வரைபடத்தைப் படிக்க முடியும்.',
        materials: ['இரண்டு வரைபடங்கள்: அல்-இத்ரிசி (1154) மற்றும் நவீன வரைபடம்', 'பாடநூல்', 'நிலப்படத் தொகுப்பு'], comp: ['critical', 'comm'],
        intro: 'அல்-இத்ரிசியின் 1154 வரைபடத்தைத் தலைகீழாகக் காட்டுங்கள். கேளுங்கள்: தென்னிந்தியாவைக் கண்டுபிடிக்க முடிகிறதா?',
        steps: [
          ['இரு வரைபடங்களை ஒப்பிடுங்கள்: பெயர்கள், வடிவங்கள், இல்லாதவை.', 'இணையாக மூன்று வேறுபாடுகளைக் கண்டுபிடித்து வரைபடங்கள் ஏன் மாறுகின்றன என்று கூறுவர்.', 12],
          ['சொற்கள் எப்படி மாறுகின்றன என்று விளக்குங்கள்: மின்ஹாஜ்-இ-சிராஜ், பாபர், அமீர் குஸ்ரோவின் "ஹிந்துஸ்தான்".', 'குறிப்பேட்டில் மூன்று பொருள்களின் காலக்கோடு உருவாக்குவர்.', 13],
          ['ஆதாரங்கள்: கையெழுத்துப் பிரதிகள், நாணயங்கள், கல்வெட்டுகள், கட்டடங்கள்; நகலெடுப்பதால் உரைகள் ஏன் மாறின.', 'ஆதார அட்டைகளை எழுத்து, பொருள் ஆதாரங்களாகப் பிரிப்பர்.', 10]
        ],
        recap: 'விரைவு வினாடி வினா: பஞ்சாப், ஹரியானா, கங்கை-யமுனைப் பகுதிக்கு "ஹிந்துஸ்தான்" என்று யார் பயன்படுத்தினார்?',
        assess: 'ஓர் இடப்பெயரின் பொருள் ஏன் மாறலாம் என்பதற்கு இரண்டு காரணங்கள் எழுது.', hw: 'NCERT அத்தியாயம் 1, "Let\'s recall" கேள்விகள் 1 முதல் 3.',
        e5: { engage: ['1154 இன் தலைகீழ் வரைபடம்: என்ன பார்க்கிறாய்?', 5, 'வரைபட அச்சு'], explore: ['குழுக்களாகப் பழைய, புதிய வரைபடங்களை ஒப்பிடு.', 10, 'இரண்டு வரைபடங்கள்'], explain: ['மாறும் பெயர்களும் பொருள்களும்; இக்காலத்தின் ஆதாரங்கள்.', 12, 'பாடநூல், கரும்பலகை'], elaborate: ['"ஹிந்துஸ்தான்" என்ற சொல்லின் காலக்கோட்டை வரை.', 8, 'குறிப்பேடு'], evaluate: ['இடப்பெயர்களின் பொருள் மாறுவதற்கு இரண்டு காரணங்கள்.', 5, 'காகிதச் சீட்டுகள்'] },
        support: 'பெயர்கள் ஏற்கனவே குறிக்கப்பட்ட வரைபடம் கொடுங்கள்; ஒரு வேறுபாடு கேளுங்கள்.', extension: '500 ஆண்டுகளுக்கு முன் உன் ஊர் அல்லது மாநிலம் என்ன அழைக்கப்பட்டது என்று கண்டுபிடி.',
        week: [['பழைய வரைபடங்களும் புதிய வரைபடங்களும்', '1.1 படி'], ['புதிய, பழைய சொற்கள்: ஹிந்துஸ்தான்', 'காலக்கோடு'], ['வரலாற்றாசிரியர்களும் ஆதாரங்களும்', 'கே. 1–3'], ['புதிய சமூக, அரசியல் குழுக்கள்', '1.3 படி'], ['பகுதியும் பேரரசும்; பழைய, புதிய மதங்கள்', 'சிறு குறிப்புகள்'], ['மீள்பார்வையும் வரைபடப் பணியும்', 'ஐந்து இடங்களைக் குறி']]
      },
      story: {
        subjectKey: 'language', cls: '4', subject: 'தமிழ்', topic: 'கதை: தாகம் எடுத்த காகம்', period: 1, duration: 35,
        outcomes: ['கதையைச் சரியான வரிசையில் மீண்டும் சொல்ல முடியும்', 'ஐந்து புதிய சொற்களின் பொருள் கூற முடியும்', 'காகம் என்ன செய்தது, அது ஏன் வேலை செய்தது என்று கூற முடியும்'],
        prev: 'மாணவர்கள் சிறு வாக்கியங்களைப் படிக்க முடியும்; வீட்டில் நாட்டுப்புறக் கதைகள் கேட்டுள்ளனர்.',
        materials: ['கதையின் பட அட்டைகள்', 'ஒரு குடம், தண்ணீர், கூழாங்கற்கள்', 'பாடநூல்'], comp: ['critical', 'creativity', 'comm'],
        intro: 'சிறிது தண்ணீர் உள்ள குடத்தையும் ஒரு கல்லையும் காட்டுங்கள். கேளுங்கள்: ஒரு பறவை இந்தத் தண்ணீரை எப்படிக் குடிக்கும்?',
        steps: [
          ['பட அட்டைகளுடனும் குரல் மாற்றங்களுடனும் கதையைச் சொல்லுங்கள்.', 'கேட்பர்; இரண்டு இடங்களில் அடுத்து என்ன நடக்கும் என்று ஊகிப்பர்.', 10],
          ['கதையை உரக்கப் படியுங்கள்; செயல்களால் புதிய சொற்களை விளக்குங்கள்.', 'இணையாகப் படிப்பர்; புதிய சொற்களைக் கோடிடுவர்; இரண்டில் வாக்கியம் அமைப்பர்.', 15],
          ['குடத்துடன் கூழாங்கல் சோதனை செய்யுங்கள்.', 'ஒவ்வொரு கல்லாகப் போட்டு, நீர் உயர்வதைப் பார்த்து, ஏன் என்று கூறுவர்.', 10]
        ],
        recap: 'பலகையில் பட அட்டைகளை வரிசையாக அடுக்கு.',
        assess: 'இணையருக்குக் கதையை ஐந்து வாக்கியங்களில் மீண்டும் சொல்.', hw: 'காகத்தையும் குடத்தையும் வரை; மூன்று வாக்கியங்கள் எழுது.',
        e5: { engage: ['சிறிது தண்ணீருள்ள குடம்: பறவை எப்படிக் குடிக்கும்?', 5, 'குடம், தண்ணீர்'], explore: ['குழுக்களாகக் கூழாங்கற்களுடன் முயல்: நீர் உயர்கிறதா?', 8, 'குடம், கூழாங்கற்கள்'], explain: ['கதையைப் படி; புதிய சொற்களும் கதையின் நீதியும்.', 10, 'பாடநூல், பட அட்டைகள்'], elaborate: ['மூவர் குழுவில் கதையை நடித்துக் காட்டு.', 8, 'பட அட்டைகள்'], evaluate: ['ஐந்து வாக்கியங்களில் கதையை மீண்டும் சொல்.', 4, 'பட அட்டைகள்'] },
        support: 'பட அட்டைகளை வரிசையாகக் கொடுங்கள்; அவற்றுடன் சொல்லட்டும்.', extension: 'முடிவை மாற்று: கூழாங்கற்கள் இல்லாவிட்டால் என்ன ஆகும்?',
        week: [['கதையைக் கேள்', 'வீட்டில் சொல்'], ['படி; புதிய சொற்கள்', 'ஐந்து சொற்கள், ஐந்து வாக்கியங்கள்'], ['கூழாங்கல் சோதனையும் அது ஏன் வேலை செய்கிறது என்பதும்', 'வரைந்து காட்டு'], ['கதையை நடித்துக் காட்டு', 'உன் வசனங்களைப் பயிற்சி செய்'], ['உன் சொந்த முடிவை எழுது', 'முடிவை நிறைவு செய்'], ['மீள்பார்வையும் உரக்கப் படித்தலும்', 'பக்கம் 1 உரக்கப் படி']]
      },
      ai: {
        subjectKey: 'ai', cls: '9', subject: 'செயற்கை நுண்ணறிவு', topic: 'AI என்றால் என்ன?', period: 6, duration: 40,
        outcomes: ['நிலையான விதிகளைப் பின்பற்றும் இயந்திரத்திற்கும் தரவிலிருந்து கற்கும் இயந்திரத்திற்கும் உள்ள வேறுபாட்டைக் கூற முடியும்', 'அன்றாட வாழ்வில் AI-இன் ஐந்து பயன்களைப் பட்டியலிட முடியும்', 'AI-இன் ஒரு நன்மையையும் ஒரு ஆபத்தையும் விவாதிக்க முடியும்'],
        prev: 'மாணவர்கள் ஸ்மார்ட்போன், வரைபடம், குரல் உதவியாளர், வீடியோ செயலிகளைப் பயன்படுத்துகின்றனர்.',
        materials: ['புரொஜெக்டர் அல்லது போன்', 'அன்றாடப் பணி அட்டைகள்', 'விளக்கப்படத் தாள்'], comp: ['critical', 'digital', 'comm'],
        intro: 'கேளுங்கள்: உன் போன் உன் முகத்தால் எப்படித் திறக்கிறது? வீடியோ செயலிக்கு உனக்குப் பிடித்தது எப்படித் தெரியும்?',
        steps: [
          ['எளிய சொற்களில் AI-ஐ வரையறுங்கள்: தரவிலிருந்து ஒழுங்குகளைக் கற்று முடிவெடுக்கும் இயந்திரங்கள்.', 'தம் போனிலிருந்து ஒவ்வொருவரும் இரண்டு எடுத்துக்காட்டுகள் தருவர்.', 10],
          ['பணிகளைப் பிரியுங்கள்: கால்குலேட்டர் (நிலையான விதிகள்), ஸ்பேம் வடிகட்டி (கற்றல்). தரவு, ஒழுங்கு, கணிப்பை விளக்குங்கள்.', 'குழுக்களாகப் பணி அட்டைகளை "நிலையான விதிகள்", "தரவிலிருந்து கற்கிறது" எனப் பிரிப்பர்.', 15],
          ['நன்மைகள், ஆபத்துகளை விவாதியுங்கள்: விவசாயம், சுகாதாரத்தில் உதவி; சார்பு, தனியுரிமை, போலி வீடியோக்கள்.', 'ஒவ்வொரு குழுவும் விளக்கப்படத் தாளில் ஒரு நன்மையும் ஒரு ஆபத்தும் எழுதும்.', 10]
        ],
        recap: 'மூன்று கூற்றுகள்: AI ஆ, AI இல்லையா? கட்டைவிரல் மேலே அல்லது கீழே.',
        assess: 'இந்த வாரம் நீ பார்த்த AI-இன் ஐந்து பயன்களையும் ஒரு ஆபத்தையும் எழுது.', hw: 'குடும்பத்தில் ஒருவரிடம் எந்தச் செயலியை அதிகம் நம்புகிறார், ஏன் என்று கேள்; அது AI பயன்படுத்துகிறதா என்று குறி.',
        e5: { engage: ['உன் போன் உன் முகத்தால் எப்படித் திறக்கிறது?', 5, 'போன்'], explore: ['பணி அட்டைகளைப் பிரி: நிலையான விதிகளா, கற்றலா?', 10, 'பணி அட்டைகள்'], explain: ['AI என்றால் என்ன: தரவு, ஒழுங்குகள், கணிப்புகள்; எங்கே பயன்படுகிறது.', 12, 'புரொஜெக்டர்'], elaborate: ['உன் பள்ளிக்கு ஓர் எளிய AI உதவியாளரைக் காகிதத்தில் வடிவமை.', 8, 'விளக்கப்படத் தாள்'], evaluate: ['AI-இன் ஐந்து பயன்களும் ஒரு ஆபத்தும்.', 5, 'குறிப்பேடு'] },
        support: 'எடுத்துக்காட்டுகளைத் தயாராகக் கொடுங்கள்; மாணவர்கள் பிரித்தால் போதும்.', extension: 'AI தவறான முடிவெடுத்த ஓர் எடுத்துக்காட்டைக் கண்டுபிடித்து ஏன் என்று விளக்கு.',
        week: [['நுண்ணறிவு என்றால் என்ன? மனிதனும் இயந்திரமும்', 'இன்று நீ செய்த ஐந்து புத்திசாலித்தனமான செயல்களைப் பட்டியலிடு'], ['AI என்றால் என்ன? விதிகளா கற்றலா', 'பத்துப் பணிகளைப் பிரி'], ['நம்மைச் சுற்றி AI', 'AI-இன் ஐந்து பயன்கள்'], ['தரவு, ஒழுங்குகள், கணிப்புகள்', 'ஒழுங்கு பயிற்சித் தாள்'], ['AI-இன் நன்மைகளும் ஆபத்துகளும்', 'ஒரு பக்கக் குறிப்பு'], ['திட்டப்பணி: நம் பள்ளிக்கு ஓர் AI உதவியாளர்', 'சுவரொட்டி']]
      }
    }
  },
  te: {
    bloom: {
      remember: ['నిర్వచించడం', 'జాబితా చేయడం', 'పేరు చెప్పడం', 'గుర్తుకు తెచ్చుకోవడం', 'పేర్లు రాయడం', 'పేర్కొనడం'],
      understand: ['వివరించడం', 'వర్ణించడం', 'సారాంశం చెప్పడం', 'వర్గీకరించడం', 'పోల్చడం', 'ఉదాహరణలు ఇవ్వడం'],
      apply: ['ఉపయోగించడం', 'సాధించడం', 'లెక్కించడం', 'చేసి చూపడం', 'చూపించడం', 'కొలవడం'],
      analyse: ['విశ్లేషించడం', 'తేడా చెప్పడం', 'నమూనా కనుగొనడం', 'పరిశీలించడం', 'వేరు చేయడం', 'నిర్ధారణకు రావడం'],
      evaluate: ['తీర్పు చెప్పడం', 'సమర్థించడం', 'నిర్ణయించడం', 'సరిచూడడం', 'అనుకూలంగా వాదించడం', 'అంచనా వేయడం'],
      create: ['రూపకల్పన చేయడం', 'తయారు చేయడం', 'ప్రణాళిక వేయడం', 'రచించడం', 'నిర్మించడం', 'కొత్తగా కనిపెట్టడం']
    },
    materials: ['నల్లబల్ల & సుద్ద', 'పాఠ్యపుస్తకం', 'చార్ట్ లేదా పోస్టర్', 'ఫ్లాష్‌కార్డులు', 'వర్క్‌షీట్', 'ప్రొజెక్టర్ లేదా స్మార్ట్‌బోర్డ్', 'నిజమైన వస్తువులు', 'నోట్‌బుక్ & పెన్సిల్'],
    ideas: {
      maths: ['కాగితంతో చేయండి: మడిచి లేదా కత్తిరించి ఆకారాలతో భావన చూపండి', 'ఒక కష్టమైన ప్రశ్నపై ఆలోచించు-జంటగా చర్చించు-పంచుకో', 'గణిత రిలే: గుంపులో ప్రతి ఒక్కరూ బోర్డుపై ఒక దశ సాధిస్తారు', 'ముందు అంచనా వేయండి, తర్వాత కొలిచి పోల్చండి', 'ఈ గణితాన్ని మార్కెట్‌లో లేదా వంటగదిలో కనుగొని ఒక ఉదాహరణ తీసుకురండి'],
      science: ['చిన్న ప్రదర్శనతో ఊహించు-గమనించు-వివరించు', 'నిజమైన వస్తువును చూసి గీసి పేర్లు రాయండి', 'గుంపు ప్రయోగం, అందరికీ ఒకే ఫలితాల పట్టిక', 'కార్డులను గుంపులుగా విభజించి నియమం వివరించండి', 'ప్రతి గుంపు నుంచి ఒక నిమిషం "సైన్స్ రిపోర్టర్"'],
      english: ['జంటగా బిగ్గరగా చదివి పాత్రలు మార్చుకోండి', 'నలుగురి గుంపులో సన్నివేశాన్ని నటించండి', 'పద వేట: ఐదు కొత్త పదాలు కనుగొని అర్థం ఊహించండి', 'మీ సొంత మాటల్లో మూడు వాక్యాలు రాయండి', 'హాట్ సీట్: ఒక విద్యార్థి పాత్రగా మారి జవాబులు చెబుతారు'],
      social: ['నేలపై సుద్దతో కాలరేఖ', 'మ్యాప్ పని: ఐదు ప్రదేశాలు గుర్తించండి', 'పాత్రాభినయం: ఆ కాలంలో ఒక రోజు', 'అప్పుడు-ఇప్పుడు: T-చార్ట్‌లో పోల్చండి', 'స్థానిక సంబంధం: ఇంట్లో పెద్దవారిని అడిగి చెప్పండి'],
      language: ['కథా వృత్తం: ప్రతి విద్యార్థి ఒక వాక్యం కలుపుతారు', 'బొమ్మ మాట: మూడు వాక్యాల్లో వర్ణించండి', 'ప్రాస పదాలు కనుగొని పాట కట్టండి', 'జంటగా డిక్టేషన్; ఒకరిది ఒకరు సరిచూడండి', 'చేతి బొమ్మలతో కథను మళ్లీ చెప్పండి'],
      ai: ['AI ని గుర్తించు: AI వాడే ఐదు యాప్‌ల జాబితా', 'మనిషా యంత్రమా: పనులను వర్గీకరించండి', 'నమూనా ఆట: ఉదాహరణల నుంచి నియమం ఊహించండి', 'కాగితంపై సరళమైన చాట్‌బాట్ స్క్రిప్ట్ రాయండి', 'చర్చ: AI ఎప్పుడూ సరైనదేనా?'],
      general: ['ఆలోచించు-జంట-పంచుకో: ఒక నిమిషం ఒంటరిగా, రెండు నిమిషాలు జంటగా', 'ఎగ్జిట్ స్లిప్: నేను నేర్చుకున్న ఒకటి, నా ఒక ప్రశ్న', 'గ్యాలరీ వాక్: గుంపులు తమ పనిని గోడపై పెడతారు', 'పలకలతో జట్టు క్విజ్', 'తోటి బోధన: మీ భాగస్వామికి వివరించండి']
    },
    samples: {
      fractions: {
        subjectKey: 'maths', cls: '6', subject: 'గణితం', topic: 'భిన్నాలు: సమాన భిన్నాలు', period: 3, duration: 40,
        outcomes: ['సమాన భిన్నం అంటే ఏమిటో వివరించగలరు', 'గుణించి లేదా భాగించి సమాన భిన్నాలు తయారు చేయగలరు', 'రెండు భిన్నాలు సమానమో కాదో సరిచూడగలరు'],
        prev: 'విద్యార్థులు 1/2, 3/4 వంటి భిన్నాలను చదవగలరు, రాయగలరు, ఆకారంలో రంగు వేయగలరు.',
        materials: ['కాగితపు పట్టీలు', 'నల్లబల్ల & సుద్ద', 'భిన్నాల చార్ట్'], comp: ['critical', 'collab'],
        intro: '2 సమాన ముక్కలుగా కోసిన రొట్టె, 4 ముక్కలుగా కోసిన మరొకటి చూపించండి. అడగండి: 1/2, 2/4 ఒకటేనా?',
        steps: [
          ['కాగితపు పట్టీని సగానికి, తర్వాత నాలుగు భాగాలుగా మడవండి; బోర్డుపై 1/2 = 2/4 చూపండి.', 'తమ పట్టీలను మడిచి 1/2, 2/4 రంగు వేసి జంటగా పోల్చుతారు.', 10],
          ['నియమం వివరించండి: లవం, హారాలను ఒకే సంఖ్యతో గుణించడం లేదా భాగించడం. రెండు ఉదాహరణలు చేయండి.', 'నోట్‌బుక్‌లో 2/3 కు మూడు సమాన భిన్నాలు తయారు చేస్తారు.', 15],
          ['భిన్నాల జంటలు ఇవ్వండి; ఏవి సమానం, ఎలా తెలుసు అని అడగండి.', 'అడ్డ గుణకారంతో సరిచూసి కారణంతో అవును/కాదు చెబుతారు.', 10]
        ],
        recap: 'బోర్డుపై మూడు త్వరిత ప్రశ్నలు: సమానమా కాదా? విద్యార్థులు బొటనవేలు పైకి లేదా కిందికి చూపుతారు.',
        assess: 'ఎగ్జిట్ స్లిప్: 3/5 కు రెండు సమాన భిన్నాలు రాయండి.', hw: 'NCERT అభ్యాసం 7.3, ప్రశ్నలు 1 నుంచి 4.',
        e5: { engage: ['రొట్టె పజిల్: 1/2, 2/4 ఒకటేనా? ఓటు వేసి కారణం చెప్పండి.', 5, 'రెండు కాగితపు రొట్టెలు'], explore: ['జంటగా పట్టీలు మడిచి 1/2 కు సమానమైన భిన్నాలు కనుగొనండి.', 10, 'కాగితపు పట్టీలు'], explain: ['నియమం: లవం, హారాలను ఒకే సంఖ్యతో గుణించు లేదా భాగించు.', 10, 'నల్లబల్ల'], elaborate: ['భిన్నాల చార్ట్‌పై సమాన భిన్నాలు కనుగొని నమూనా వివరించండి.', 10, 'భిన్నాల చార్ట్'], evaluate: ['ఎగ్జిట్ స్లిప్: 3/5 కు రెండు సమాన భిన్నాలు.', 5, 'కాగితపు స్లిప్‌లు'] },
        support: 'సిద్ధంగా ఉన్న భిన్న పట్టీలు ఇవ్వండి; సగం, పావు మాత్రమే వాడండి.', extension: '1/2, 1 మధ్య మూడు భిన్నాలు కనుగొని అవి క్రమంలో ఉన్నాయని నిరూపించండి.',
        week: [['సంఖ్యారేఖపై భిన్నాలు', 'అభ్యా. 7.1 ప్ర. 1–3'], ['క్రమ, అపక్రమ భిన్నాలు', 'అభ్యా. 7.2 ప్ర. 1–2'], ['సమాన భిన్నాలు', 'అభ్యా. 7.3 ప్ర. 1–4'], ['కనిష్ఠ రూపం', 'అభ్యా. 7.3 ప్ర. 5–7'], ['భిన్నాల పోలిక', 'అభ్యా. 7.4 ప్ర. 1–3'], ['సాధన, క్విజ్', 'అధ్యాయం పునశ్చరణ']]
      },
      cell: {
        subjectKey: 'science', cls: '8', subject: 'విజ్ఞానం', topic: 'కణం: నిర్మాణం, విధులు', period: 2, duration: 40,
        outcomes: ['కణం ప్రధాన భాగాల పేర్లు చెప్పగలరు', 'మొక్క కణాన్ని జంతు కణంతో పోల్చగలరు', 'కణాన్ని జీవం ప్రాథమిక ప్రమాణం అని ఎందుకంటారో వివరించగలరు'],
        prev: 'జీవులు చిన్న భాగాలతో ఏర్పడ్డాయని విద్యార్థులకు తెలుసు; చేతి భూతద్దం వాడారు.',
        materials: ['ఉల్లిపాయ పొర & స్లైడ్', 'సూక్ష్మదర్శిని లేదా కణ చార్ట్', 'రంగు పెన్సిళ్లు'], comp: ['critical', 'comm'],
        intro: 'ఇటుక గోడ ఫోటో, సూక్ష్మదర్శినిలో ఉల్లిపాయ పొర చూపించండి. అడగండి: జీవులు దేనితో తయారయ్యాయి?',
        steps: [
          ['ఉల్లిపాయ పొర స్లైడ్ లేదా చార్ట్ చూపించండి; కణ కవచం, కేంద్రకం, జీవపదార్థం చూపండి.', 'చూసినది గమనించి గీస్తారు; రెండు భాగాలకు పేర్లు రాస్తారు.', 12],
          ['బోర్డుపై వెన్ చిత్రంతో మొక్క, జంతు కణాలను పోల్చండి.', 'జంటగా వెన్ చిత్రం నింపుతారు: కవచం, హరితరేణువు, రిక్తిక, కేంద్రకం.', 13],
          ['"నగరం" పోలికతో కణ భాగాలు, వాటి పనులు వివరించండి.', 'భాగాల కార్డులను వాటి విధులతో జతచేస్తారు.', 10]
        ],
        recap: 'త్వరిత ప్రశ్నలు: కణాన్ని నియంత్రించే భాగం; మొక్కల్లో మాత్రమే ఉండే భాగం.',
        assess: 'ఐదు భాగాలతో మొక్క కణం గీసి పేర్లు రాయండి.', hw: 'NCERT అధ్యాయం 8, ప్రశ్నలు 1 నుంచి 5.',
        e5: { engage: ['ఇటుక గోడా ఉల్లిపాయ పొరా: జీవులు దేనితో తయారయ్యాయి?', 5, 'ఫోటో, ఉల్లిపాయ పొర'], explore: ['గుంపుల్లో ఉల్లిపాయ పొర స్లైడ్ గమనించి గీయండి.', 12, 'సూక్ష్మదర్శిని లేదా చార్ట్'], explain: ['కణ భాగాలు, వాటి పనులు; మొక్క కణం, జంతు కణం.', 10, 'నల్లబల్ల, కణ చార్ట్'], elaborate: ['మట్టి లేదా కాగితంతో కణ నమూనా తయారు చేయండి.', 8, 'మట్టి, కాగితం'], evaluate: ['ఖాళీ కణ చిత్రంలో పేర్లు రాయండి.', 5, 'వర్క్‌షీట్'] },
        support: 'నకలు చేయడానికి పేర్లున్న చిత్రం ఇవ్వండి; ఐదుకు బదులు మూడు భాగాలు అడగండి.', extension: 'ఆకు కణంలో ఉండి చెంప కణంలో లేనిది ఏమిటి, ఎందుకు అని కనుగొనండి.',
        week: [['కణం ఆవిష్కరణ; సూక్ష్మదర్శిని', '8.1 చదవండి'], ['కణ ఆకారం, పరిమాణం', 'మూడు కణాలు గీయండి'], ['కణ భాగాలు', 'ప్ర. 1–3'], ['మొక్క కణం, జంతు కణం', 'వెన్ చిత్రం'], ['ఉల్లిపాయ పొర ప్రయోగం', 'ప్రయోగశాల పుస్తకం'], ['పునశ్చరణ, క్విజ్', 'అధ్యాయం పునశ్చరణ']]
      },
      poem: {
        subjectKey: 'english', cls: '5', subject: 'ఇంగ్లీష్', topic: 'పద్యం: My Shadow', period: 4, duration: 35,
        outcomes: ['పద్యాన్ని లయతో బిగ్గరగా చదవగలరు', 'ప్రాస పదాలు కనుగొని నీడ ఏమి చేస్తుందో చెప్పగలరు', 'తమ నీడ గురించి నాలుగు వాక్యాలు రాయగలరు'],
        prev: 'విద్యార్థులు ఎండలో తమ నీడను చూశారు; sun, fun వంటి ప్రాస పదాలు తెలుసు.',
        materials: ['పాఠ్యపుస్తకం', 'టార్చ్', 'పద్యం చార్ట్'], comp: ['creativity', 'comm'],
        intro: 'మసక మూలలో టార్చ్ వేసి చేతి నీడలు చేయండి. అడగండి: మీ నీడ ఎప్పుడు పొడవవుతుంది?',
        steps: [
          ['అభినయంతో పద్యాన్ని రెండుసార్లు బిగ్గరగా చదవండి; కష్టమైన పదాలు వివరించండి.', 'వింటారు, తర్వాత కలిసి చదివి వాక్యాలను నటిస్తారు.', 12],
          ['అడగండి: పిల్లవాడు చేసేది నీడ ఏమి చేస్తుంది? ప్రాస జంటలు కనుగొనండి.', 'జంటగా ప్రాస పదాలు గీత గీస్తారు; ఒక్కొక్కరు ఒక జంట పంచుకుంటారు.', 13],
          ['బోర్డుపై నా నీడ గురించి నాలుగు నమూనా వాక్యాలు రాయండి.', 'తమ నీడ గురించి నాలుగు వాక్యాలు రాసి భాగస్వామికి చదివి వినిపిస్తారు.', 10]
        ],
        recap: 'తరగతి అంతా కలిసి మొదటి చరణం చెబుతారు; ఒక గుంపు మూకాభినయం చేస్తుంది.',
        assess: 'మౌఖికం: పద్యంపై మూడు ప్రశ్నలు; రాసిన నాలుగు వాక్యాలు సరిచూడండి.', hw: 'మొదటి చరణం కంఠస్థం చేయండి; మధ్యాహ్నం, సాయంత్రం 5 గంటలకు మీ నీడ గీయండి.',
        e5: { engage: ['టార్చ్‌తో చేతి నీడలు: నీడ ఎలా ఏర్పడుతుంది?', 5, 'టార్చ్'], explore: ['జంటగా పద్యం చదివి తెలియని పదాలు గుర్తించండి.', 8, 'పాఠ్యపుస్తకం'], explain: ['ప్రతి చరణం అర్థం; ప్రాస పదాలు; లయ.', 10, 'పద్యం చార్ట్'], elaborate: ['మీ నీడ గురించి నాలుగు వాక్యాలు రాయండి.', 8, 'నోట్‌బుక్'], evaluate: ['ఒక చరణం చెప్పండి; రెండు ప్రశ్నలకు జవాబివ్వండి.', 4, 'పద్యం చార్ట్'] },
        support: 'స్నేహితుడితో కలిసి చదవనివ్వండి; నాలుగు వాక్యాలకు పద నిధి ఇవ్వండి.', extension: 'మధ్యాహ్నం నీడ పొట్టిగా, సాయంత్రం పొడవుగా ఎందుకు ఉంటుందో కనుగొనండి.',
        week: [['పద్యం: చదివి ఆనందించండి', 'ఇంట్లో బిగ్గరగా చదవండి'], ['కొత్త పదాలు, ప్రాసలు', 'ఐదు ప్రాస జంటలు రాయండి'], ['అవగాహన ప్రశ్నలు', 'ప్ర. 1–4'], ['రచన: నా నీడ', 'నాలుగు వాక్యాలు పూర్తి చేయండి'], ['వ్యాకరణం: పద్యంలో నామవాచకాలు', 'వర్క్‌షీట్'], ['పఠనం, సరదా', 'చరణం 1 కంఠస్థం']]
      },
      medieval: {
        subjectKey: 'social', cls: '7', subject: 'సాంఘిక శాస్త్రం', topic: 'వెయ్యేళ్ల మార్పుల జాడ', period: 5, duration: 40,
        outcomes: ['"హిందుస్తాన్" పదం అర్థం కాలంతో ఎలా మారిందో వివరించగలరు', 'చారిత్రక మ్యాప్ చదివి ఆధునిక మ్యాప్‌తో పోల్చగలరు', 'మధ్యయుగానికి చరిత్రకారులు వాడే ఆధారాలను జాబితా చేయగలరు'],
        prev: 'విద్యార్థులకు 6వ తరగతి ప్రాచీన యుగం తెలుసు; భారత మ్యాప్ చదవగలరు.',
        materials: ['రెండు మ్యాప్‌లు: అల్-ఇద్రీసీ (1154), ఆధునిక మ్యాప్', 'పాఠ్యపుస్తకం', 'అట్లాస్'], comp: ['critical', 'comm'],
        intro: 'అల్-ఇద్రీసీ 1154 మ్యాప్‌ను తలకిందులుగా చూపించండి. అడగండి: దక్షిణ భారతం కనిపిస్తోందా?',
        steps: [
          ['రెండు మ్యాప్‌లను పోల్చండి: పేర్లు, ఆకారాలు, లేనివి.', 'జంటగా మూడు తేడాలు కనుగొని మ్యాప్‌లు ఎందుకు మారతాయో చెబుతారు.', 12],
          ['పదాలు ఎలా మారతాయో వివరించండి: మిన్హాజ్-ఇ-సిరాజ్, బాబర్, అమీర్ ఖుస్రో "హిందుస్తాన్".', 'నోట్‌బుక్‌లో మూడు అర్థాల కాలరేఖ తయారు చేస్తారు.', 13],
          ['ఆధారాలు: రాతప్రతులు, నాణేలు, శాసనాలు, కట్టడాలు; నకలు వల్ల పాఠాలు ఎందుకు మారాయి.', 'ఆధార కార్డులను లిఖిత, భౌతిక ఆధారాలుగా విభజిస్తారు.', 10]
        ],
        recap: 'త్వరిత క్విజ్: పంజాబ్, హర్యానా, గంగా-యమునా ప్రాంతానికి "హిందుస్తాన్" అని ఎవరు వాడారు?',
        assess: 'ఒక ప్రదేశం పేరు అర్థం ఎందుకు మారవచ్చో రెండు కారణాలు రాయండి.', hw: 'NCERT అధ్యాయం 1, "Let\'s recall" ప్రశ్నలు 1 నుంచి 3.',
        e5: { engage: ['1154 నాటి తలకిందుల మ్యాప్: ఏమి కనిపిస్తోంది?', 5, 'మ్యాప్ ప్రింట్'], explore: ['గుంపుల్లో పాత, కొత్త మ్యాప్‌లను పోల్చండి.', 10, 'రెండు మ్యాప్‌లు'], explain: ['మారే పేర్లు, అర్థాలు; ఈ కాలపు ఆధారాలు.', 12, 'పాఠ్యపుస్తకం, నల్లబల్ల'], elaborate: ['"హిందుస్తాన్" పదం కాలరేఖ గీయండి.', 8, 'నోట్‌బుక్'], evaluate: ['ప్రదేశాల పేర్ల అర్థం మారడానికి రెండు కారణాలు.', 5, 'కాగితపు స్లిప్‌లు'] },
        support: 'పేర్లు ముందే గుర్తించిన మ్యాప్ ఇవ్వండి; ఒక తేడా అడగండి.', extension: '500 ఏళ్ల క్రితం మీ ఊరు లేదా రాష్ట్రాన్ని ఏమని పిలిచేవారో కనుగొనండి.',
        week: [['పాత మ్యాప్‌లు, కొత్త మ్యాప్‌లు', '1.1 చదవండి'], ['కొత్త, పాత పదాలు: హిందుస్తాన్', 'కాలరేఖ'], ['చరిత్రకారులు, వారి ఆధారాలు', 'ప్ర. 1–3'], ['కొత్త సామాజిక, రాజకీయ వర్గాలు', '1.3 చదవండి'], ['ప్రాంతం, సామ్రాజ్యం; పాత, కొత్త మతాలు', 'చిన్న నోట్స్'], ['పునశ్చరణ, మ్యాప్ పని', 'ఐదు ప్రదేశాలు గుర్తించండి']]
      },
      story: {
        subjectKey: 'language', cls: '4', subject: 'తెలుగు', topic: 'కథ: దాహం వేసిన కాకి', period: 1, duration: 35,
        outcomes: ['కథను సరైన క్రమంలో మళ్లీ చెప్పగలరు', 'ఐదు కొత్త పదాల అర్థాలు చెప్పగలరు', 'కాకి ఏమి చేసింది, అది ఎందుకు పనిచేసిందో చెప్పగలరు'],
        prev: 'విద్యార్థులు చిన్న వాక్యాలు చదవగలరు; ఇంట్లో జానపద కథలు విన్నారు.',
        materials: ['కథ బొమ్మల కార్డులు', 'ఒక కుండ, నీరు, గులకరాళ్లు', 'పాఠ్యపుస్తకం'], comp: ['critical', 'creativity', 'comm'],
        intro: 'కొద్దిగా నీరున్న కుండ, ఒక రాయి చూపించండి. అడగండి: పక్షి ఈ నీటిని ఎలా తాగగలదు?',
        steps: [
          ['బొమ్మల కార్డులు, గొంతు మార్పులతో కథ చెప్పండి.', 'వింటారు; రెండు చోట్ల తర్వాత ఏమవుతుందో ఊహిస్తారు.', 10],
          ['కథను బిగ్గరగా చదవండి; అభినయంతో కొత్త పదాలు వివరించండి.', 'జంటగా చదువుతారు; కొత్త పదాలు గీత గీస్తారు; రెండింటితో వాక్యాలు చేస్తారు.', 15],
          ['కుండతో గులకరాళ్ల ప్రయోగం చేయండి.', 'ఒక్కొక్క రాయి వేసి నీరు పైకి రావడం చూసి ఎందుకో చెబుతారు.', 10]
        ],
        recap: 'బోర్డుపై బొమ్మల కార్డులను క్రమంలో అమర్చండి.',
        assess: 'భాగస్వామికి ఐదు వాక్యాల్లో కథ మళ్లీ చెప్పండి.', hw: 'కాకి, కుండ గీయండి; మూడు వాక్యాలు రాయండి.',
        e5: { engage: ['కొద్దిగా నీరున్న కుండ: పక్షి ఎలా తాగుతుంది?', 5, 'కుండ, నీరు'], explore: ['గుంపుల్లో గులకరాళ్లతో ప్రయత్నించండి: నీరు పైకి వస్తుందా?', 8, 'కుండ, గులకరాళ్లు'], explain: ['కథ చదవండి; కొత్త పదాలు, కథ నీతి.', 10, 'పాఠ్యపుస్తకం, బొమ్మల కార్డులు'], elaborate: ['ముగ్గురి గుంపుల్లో కథను నటించండి.', 8, 'బొమ్మల కార్డులు'], evaluate: ['ఐదు వాక్యాల్లో కథ మళ్లీ చెప్పండి.', 4, 'బొమ్మల కార్డులు'] },
        support: 'బొమ్మల కార్డులు క్రమంలో ఇవ్వండి; వాటితో చెప్పనివ్వండి.', extension: 'ముగింపు మార్చండి: గులకరాళ్లు లేకపోతే ఏమయ్యేది?',
        week: [['కథ వినండి', 'ఇంట్లో చెప్పండి'], ['చదవండి; కొత్త పదాలు', 'ఐదు పదాలు, ఐదు వాక్యాలు'], ['గులకరాళ్ల ప్రయోగం, అది ఎందుకు పనిచేస్తుంది', 'గీయండి'], ['కథను నటించండి', 'మీ సంభాషణలు సాధన చేయండి'], ['మీ సొంత ముగింపు రాయండి', 'ముగింపు పూర్తి చేయండి'], ['పునశ్చరణ, బిగ్గరగా చదవడం', 'పేజీ 1 బిగ్గరగా చదవండి']]
      },
      ai: {
        subjectKey: 'ai', cls: '9', subject: 'కృత్రిమ మేధ', topic: 'AI అంటే ఏమిటి?', period: 6, duration: 40,
        outcomes: ['నిర్ణీత నియమాలు పాటించే యంత్రానికి, డేటా నుంచి నేర్చుకునే యంత్రానికి తేడా చెప్పగలరు', 'రోజువారీ జీవితంలో AI ఐదు ఉపయోగాలు జాబితా చేయగలరు', 'AI ఒక ప్రయోజనం, ఒక ప్రమాదం గురించి చర్చించగలరు'],
        prev: 'విద్యార్థులు స్మార్ట్‌ఫోన్లు, మ్యాప్‌లు, వాయిస్ అసిస్టెంట్లు, వీడియో యాప్‌లు వాడతారు.',
        materials: ['ప్రొజెక్టర్ లేదా ఫోన్', 'రోజువారీ పనుల కార్డులు', 'చార్ట్ పేపర్'], comp: ['critical', 'digital', 'comm'],
        intro: 'అడగండి: మీ ఫోన్ మీ ముఖంతో ఎలా తెరుచుకుంటుంది? వీడియో యాప్‌కు మీకు ఏది ఇష్టమో ఎలా తెలుసు?',
        steps: [
          ['సరళ పదాల్లో AI నిర్వచించండి: డేటా నుంచి నమూనాలు నేర్చుకుని నిర్ణయాలు తీసుకునే యంత్రాలు.', 'తమ ఫోన్ల నుంచి ఒక్కొక్కరు రెండు ఉదాహరణలు ఇస్తారు.', 10],
          ['పనులు వర్గీకరించండి: కాలిక్యులేటర్ (నిర్ణీత నియమాలు), స్పామ్ ఫిల్టర్ (నేర్చుకునేది). డేటా, నమూనా, అంచనా వివరించండి.', 'గుంపుల్లో పని కార్డులను "నిర్ణీత నియమాలు", "డేటా నుంచి నేర్చుకుంటుంది"గా విభజిస్తారు.', 15],
          ['ప్రయోజనాలు, ప్రమాదాలు చర్చించండి: వ్యవసాయం, ఆరోగ్యంలో సహాయం; పక్షపాతం, గోప్యత, నకిలీ వీడియోలు.', 'ప్రతి గుంపు చార్ట్ పేపర్‌పై ఒక ప్రయోజనం, ఒక ప్రమాదం రాస్తుంది.', 10]
        ],
        recap: 'మూడు వాక్యాలు: AI నా కాదా? బొటనవేలు పైకి లేదా కిందికి.',
        assess: 'ఈ వారం మీరు చూసిన AI ఐదు ఉపయోగాలు, ఒక ప్రమాదం రాయండి.', hw: 'కుటుంబ సభ్యుడిని ఏ యాప్‌ను ఎక్కువగా నమ్ముతారో, ఎందుకో అడగండి; అది AI వాడుతుందో లేదో రాయండి.',
        e5: { engage: ['మీ ఫోన్ మీ ముఖంతో ఎలా తెరుచుకుంటుంది?', 5, 'ఫోన్'], explore: ['పని కార్డులు విభజించండి: నిర్ణీత నియమాలా, నేర్చుకోవడమా?', 10, 'పని కార్డులు'], explain: ['AI అంటే ఏమిటి: డేటా, నమూనాలు, అంచనాలు; ఎక్కడ వాడతారు.', 12, 'ప్రొజెక్టర్'], elaborate: ['మీ పాఠశాలకు సరళమైన AI సహాయకుడిని కాగితంపై రూపొందించండి.', 8, 'చార్ట్ పేపర్'], evaluate: ['AI ఐదు ఉపయోగాలు, ఒక ప్రమాదం.', 5, 'నోట్‌బుక్'] },
        support: 'ఉదాహరణలు సిద్ధంగా ఇవ్వండి; విద్యార్థులు విభజిస్తే చాలు.', extension: 'AI తప్పు నిర్ణయం తీసుకున్న ఒక ఉదాహరణ కనుగొని ఎందుకో వివరించండి.',
        week: [['మేధ అంటే ఏమిటి? మనిషి, యంత్రం', 'ఈరోజు మీరు చేసిన ఐదు తెలివైన పనుల జాబితా'], ['AI అంటే ఏమిటి? నియమాలా నేర్చుకోవడమా', 'పది పనులు విభజించండి'], ['మన చుట్టూ AI', 'AI ఐదు ఉపయోగాలు'], ['డేటా, నమూనాలు, అంచనాలు', 'నమూనా వర్క్‌షీట్'], ['AI ప్రయోజనాలు, ప్రమాదాలు', 'ఒక పేజీ నోట్'], ['ప్రాజెక్ట్: మన పాఠశాలకు AI సహాయకుడు', 'పోస్టర్']]
      }
    }
  },
  kn: {
    bloom: {
      remember: ['ವ್ಯಾಖ್ಯಾನಿಸುವುದು', 'ಪಟ್ಟಿ ಮಾಡುವುದು', 'ಹೆಸರಿಸುವುದು', 'ನೆನಪಿಸಿಕೊಳ್ಳುವುದು', 'ಹೆಸರು ಬರೆಯುವುದು', 'ಹೇಳುವುದು'],
      understand: ['ವಿವರಿಸುವುದು', 'ವರ್ಣಿಸುವುದು', 'ಸಾರಾಂಶ ಹೇಳುವುದು', 'ವರ್ಗೀಕರಿಸುವುದು', 'ಹೋಲಿಸುವುದು', 'ಉದಾಹರಣೆ ಕೊಡುವುದು'],
      apply: ['ಬಳಸುವುದು', 'ಬಿಡಿಸುವುದು', 'ಲೆಕ್ಕ ಹಾಕುವುದು', 'ಮಾಡಿ ತೋರಿಸುವುದು', 'ತೋರಿಸುವುದು', 'ಅಳೆಯುವುದು'],
      analyse: ['ವಿಶ್ಲೇಷಿಸುವುದು', 'ವ್ಯತ್ಯಾಸ ಹೇಳುವುದು', 'ಮಾದರಿ ಹುಡುಕುವುದು', 'ಪರಿಶೀಲಿಸುವುದು', 'ವಿಂಗಡಿಸುವುದು', 'ತೀರ್ಮಾನಕ್ಕೆ ಬರುವುದು'],
      evaluate: ['ತೀರ್ಪು ನೀಡುವುದು', 'ಸಮರ್ಥಿಸುವುದು', 'ನಿರ್ಧರಿಸುವುದು', 'ಪರೀಕ್ಷಿಸುವುದು', 'ಪರವಾಗಿ ವಾದಿಸುವುದು', 'ಮೌಲ್ಯಮಾಪನ ಮಾಡುವುದು'],
      create: ['ವಿನ್ಯಾಸ ಮಾಡುವುದು', 'ತಯಾರಿಸುವುದು', 'ಯೋಜಿಸುವುದು', 'ರಚಿಸುವುದು', 'ಕಟ್ಟುವುದು', 'ಹೊಸದಾಗಿ ಕಂಡುಹಿಡಿಯುವುದು']
    },
    materials: ['ಕಪ್ಪುಹಲಗೆ & ಸೀಮೆಸುಣ್ಣ', 'ಪಠ್ಯಪುಸ್ತಕ', 'ಚಾರ್ಟ್ ಅಥವಾ ಪೋಸ್ಟರ್', 'ಫ್ಲಾಶ್‌ಕಾರ್ಡ್‌ಗಳು', 'ವರ್ಕ್‌ಶೀಟ್', 'ಪ್ರೊಜೆಕ್ಟರ್ ಅಥವಾ ಸ್ಮಾರ್ಟ್‌ಬೋರ್ಡ್', 'ನಿಜವಾದ ವಸ್ತುಗಳು', 'ನೋಟ್‌ಬುಕ್ & ಪೆನ್ಸಿಲ್'],
    ideas: {
      maths: ['ಕಾಗದದಲ್ಲಿ ಮಾಡಿ: ಮಡಿಸಿ ಅಥವಾ ಕತ್ತರಿಸಿ ಆಕಾರಗಳಿಂದ ಕಲ್ಪನೆ ತೋರಿಸಿ', 'ಒಂದು ಕಠಿಣ ಪ್ರಶ್ನೆಯ ಮೇಲೆ ಯೋಚಿಸಿ-ಜೋಡಿಯಲ್ಲಿ ಚರ್ಚಿಸಿ-ಹಂಚಿಕೊಳ್ಳಿ', 'ಗಣಿತ ರಿಲೇ: ಗುಂಪಿನ ಪ್ರತಿಯೊಬ್ಬರೂ ಹಲಗೆಯಲ್ಲಿ ಒಂದು ಹಂತ ಬಿಡಿಸುತ್ತಾರೆ', 'ಮೊದಲು ಅಂದಾಜಿಸಿ, ನಂತರ ಅಳೆದು ಹೋಲಿಸಿ', 'ಈ ಗಣಿತವನ್ನು ಮಾರುಕಟ್ಟೆ ಅಥವಾ ಅಡುಗೆಮನೆಯಲ್ಲಿ ಹುಡುಕಿ ಒಂದು ಉದಾಹರಣೆ ತರಿ'],
      science: ['ಚಿಕ್ಕ ಪ್ರದರ್ಶನದೊಂದಿಗೆ ಊಹಿಸಿ-ಗಮನಿಸಿ-ವಿವರಿಸಿ', 'ನಿಜವಾದ ವಸ್ತು ನೋಡಿ ಚಿತ್ರ ಬಿಡಿಸಿ ಹೆಸರಿಸಿ', 'ಗುಂಪು ಪ್ರಯೋಗ, ಎಲ್ಲರಿಗೂ ಒಂದೇ ಫಲಿತಾಂಶ ಕೋಷ್ಟಕ', 'ಕಾರ್ಡ್‌ಗಳನ್ನು ಗುಂಪುಗಳಾಗಿ ವಿಂಗಡಿಸಿ ನಿಯಮ ವಿವರಿಸಿ', 'ಪ್ರತಿ ಗುಂಪಿನಿಂದ ಒಂದು ನಿಮಿಷದ "ವಿಜ್ಞಾನ ವರದಿಗಾರ"'],
      english: ['ಜೋಡಿಯಾಗಿ ಜೋರಾಗಿ ಓದಿ ಪಾತ್ರ ಬದಲಿಸಿ', 'ನಾಲ್ವರ ಗುಂಪಿನಲ್ಲಿ ದೃಶ್ಯ ಅಭಿನಯಿಸಿ', 'ಪದ ಬೇಟೆ: ಐದು ಹೊಸ ಪದ ಹುಡುಕಿ ಅರ್ಥ ಊಹಿಸಿ', 'ನಿಮ್ಮ ಮಾತಿನಲ್ಲಿ ಮೂರು ಸಾಲು ಬರೆಯಿರಿ', 'ಹಾಟ್ ಸೀಟ್: ಒಬ್ಬ ವಿದ್ಯಾರ್ಥಿ ಪಾತ್ರವಾಗಿ ಉತ್ತರಿಸುತ್ತಾನೆ'],
      social: ['ನೆಲದ ಮೇಲೆ ಸೀಮೆಸುಣ್ಣದಿಂದ ಕಾಲರೇಖೆ', 'ನಕ್ಷೆ ಕೆಲಸ: ಐದು ಸ್ಥಳ ಗುರುತಿಸಿ', 'ಪಾತ್ರಾಭಿನಯ: ಆ ಕಾಲದ ಒಂದು ದಿನ', 'ಆಗ ಮತ್ತು ಈಗ: T-ಚಾರ್ಟ್‌ನಲ್ಲಿ ಹೋಲಿಕೆ', 'ಸ್ಥಳೀಯ ನಂಟು: ಮನೆಯ ಹಿರಿಯರನ್ನು ಕೇಳಿ ಹೇಳಿ'],
      language: ['ಕಥಾ ವೃತ್ತ: ಪ್ರತಿ ವಿದ್ಯಾರ್ಥಿ ಒಂದು ಸಾಲು ಸೇರಿಸುತ್ತಾನೆ', 'ಚಿತ್ರ ಮಾತು: ಮೂರು ವಾಕ್ಯಗಳಲ್ಲಿ ವಿವರಿಸಿ', 'ಪ್ರಾಸ ಪದ ಹುಡುಕಿ ಹಾಡು ಕಟ್ಟಿ', 'ಜೋಡಿಯಲ್ಲಿ ಉಕ್ತಲೇಖನ; ಪರಸ್ಪರ ಪರಿಶೀಲಿಸಿ', 'ಕೈಗೊಂಬೆಗಳಿಂದ ಕಥೆ ಮತ್ತೆ ಹೇಳಿ'],
      ai: ['AI ಗುರುತಿಸಿ: AI ಬಳಸುವ ಐದು ಆಪ್‌ಗಳ ಪಟ್ಟಿ', 'ಮನುಷ್ಯನೋ ಯಂತ್ರವೋ: ಕೆಲಸಗಳನ್ನು ವಿಂಗಡಿಸಿ', 'ಮಾದರಿ ಆಟ: ಉದಾಹರಣೆಗಳಿಂದ ನಿಯಮ ಊಹಿಸಿ', 'ಕಾಗದದಲ್ಲಿ ಸರಳ ಚಾಟ್‌ಬಾಟ್ ಸ್ಕ್ರಿಪ್ಟ್ ಬರೆಯಿರಿ', 'ಚರ್ಚೆ: AI ಯಾವಾಗಲೂ ಸರಿಯೇ?'],
      general: ['ಯೋಚಿಸಿ-ಜೋಡಿ-ಹಂಚಿಕೊಳ್ಳಿ: ಒಂದು ನಿಮಿಷ ಒಬ್ಬರೇ, ಎರಡು ನಿಮಿಷ ಜೋಡಿಯಲ್ಲಿ', 'ಎಕ್ಸಿಟ್ ಸ್ಲಿಪ್: ನಾನು ಕಲಿತ ಒಂದು, ನನ್ನ ಒಂದು ಪ್ರಶ್ನೆ', 'ಗ್ಯಾಲರಿ ವಾಕ್: ಗುಂಪುಗಳು ಕೆಲಸವನ್ನು ಗೋಡೆಗೆ ಹಾಕುತ್ತವೆ', 'ಸ್ಲೇಟ್‌ಗಳೊಂದಿಗೆ ತಂಡ ರಸಪ್ರಶ್ನೆ', 'ಸಹಪಾಠಿ ಬೋಧನೆ: ಜೊತೆಗಾರನಿಗೆ ವಿವರಿಸಿ']
    },
    samples: {
      fractions: {
        subjectKey: 'maths', cls: '6', subject: 'ಗಣಿತ', topic: 'ಭಿನ್ನರಾಶಿಗಳು: ಸಮಾನ ಭಿನ್ನರಾಶಿಗಳು', period: 3, duration: 40,
        outcomes: ['ಸಮಾನ ಭಿನ್ನರಾಶಿ ಎಂದರೇನು ವಿವರಿಸಬಲ್ಲರು', 'ಗುಣಿಸಿ ಅಥವಾ ಭಾಗಿಸಿ ಸಮಾನ ಭಿನ್ನರಾಶಿ ಮಾಡಬಲ್ಲರು', 'ಎರಡು ಭಿನ್ನರಾಶಿ ಸಮಾನವೇ ಎಂದು ಪರೀಕ್ಷಿಸಬಲ್ಲರು'],
        prev: 'ವಿದ್ಯಾರ್ಥಿಗಳು 1/2, 3/4 ನಂತಹ ಭಿನ್ನರಾಶಿಗಳನ್ನು ಓದಿ ಬರೆದು ಆಕಾರದಲ್ಲಿ ಬಣ್ಣ ಹಚ್ಚಬಲ್ಲರು.',
        materials: ['ಕಾಗದದ ಪಟ್ಟಿಗಳು', 'ಕಪ್ಪುಹಲಗೆ & ಸೀಮೆಸುಣ್ಣ', 'ಭಿನ್ನರಾಶಿ ಚಾರ್ಟ್'], comp: ['critical', 'collab'],
        intro: '2 ಸಮ ತುಂಡು ಮಾಡಿದ ರೊಟ್ಟಿ ಮತ್ತು 4 ತುಂಡು ಮಾಡಿದ ಇನ್ನೊಂದನ್ನು ತೋರಿಸಿ. ಕೇಳಿ: 1/2 ಮತ್ತು 2/4 ಒಂದೇ ಆ?',
        steps: [
          ['ಕಾಗದದ ಪಟ್ಟಿಯನ್ನು ಅರ್ಧ, ನಂತರ ನಾಲ್ಕು ಭಾಗ ಮಡಿಸಿ; ಹಲಗೆಯಲ್ಲಿ 1/2 = 2/4 ತೋರಿಸಿ.', 'ತಮ್ಮ ಪಟ್ಟಿ ಮಡಿಸಿ 1/2, 2/4 ಬಣ್ಣ ಹಚ್ಚಿ ಜೋಡಿಯಲ್ಲಿ ಹೋಲಿಸುತ್ತಾರೆ.', 10],
          ['ನಿಯಮ ವಿವರಿಸಿ: ಅಂಶ ಮತ್ತು ಛೇದವನ್ನು ಒಂದೇ ಸಂಖ್ಯೆಯಿಂದ ಗುಣಿಸಿ ಅಥವಾ ಭಾಗಿಸಿ. ಎರಡು ಉದಾಹರಣೆ ಮಾಡಿ.', 'ನೋಟ್‌ಬುಕ್‌ನಲ್ಲಿ 2/3 ರ ಮೂರು ಸಮಾನ ಭಿನ್ನರಾಶಿ ಮಾಡುತ್ತಾರೆ.', 15],
          ['ಭಿನ್ನರಾಶಿ ಜೋಡಿಗಳನ್ನು ಕೊಡಿ; ಯಾವುವು ಸಮಾನ, ಹೇಗೆ ಗೊತ್ತು ಕೇಳಿ.', 'ಅಡ್ಡ ಗುಣಾಕಾರದಿಂದ ಪರೀಕ್ಷಿಸಿ ಕಾರಣದೊಂದಿಗೆ ಹೌದು/ಇಲ್ಲ ಹೇಳುತ್ತಾರೆ.', 10]
        ],
        recap: 'ಹಲಗೆಯಲ್ಲಿ ಮೂರು ವೇಗದ ಪ್ರಶ್ನೆ: ಸಮಾನವೋ ಅಲ್ಲವೋ? ವಿದ್ಯಾರ್ಥಿಗಳು ಹೆಬ್ಬೆರಳು ಮೇಲೆ ಅಥವಾ ಕೆಳಗೆ ತೋರಿಸುತ್ತಾರೆ.',
        assess: 'ಎಕ್ಸಿಟ್ ಸ್ಲಿಪ್: 3/5 ರ ಎರಡು ಸಮಾನ ಭಿನ್ನರಾಶಿ ಬರೆಯಿರಿ.', hw: 'NCERT ಅಭ್ಯಾಸ 7.3, ಪ್ರಶ್ನೆ 1 ರಿಂದ 4.',
        e5: { engage: ['ರೊಟ್ಟಿ ಒಗಟು: 1/2 ಮತ್ತು 2/4 ಒಂದೇ ಆ? ಮತ ಹಾಕಿ ಕಾರಣ ಹೇಳಿ.', 5, 'ಎರಡು ಕಾಗದದ ರೊಟ್ಟಿ'], explore: ['ಜೋಡಿಯಲ್ಲಿ ಪಟ್ಟಿ ಮಡಿಸಿ 1/2 ಗೆ ಸಮಾನ ಭಿನ್ನರಾಶಿ ಹುಡುಕಿ.', 10, 'ಕಾಗದದ ಪಟ್ಟಿಗಳು'], explain: ['ನಿಯಮ: ಅಂಶ ಮತ್ತು ಛೇದವನ್ನು ಒಂದೇ ಸಂಖ್ಯೆಯಿಂದ ಗುಣಿಸಿ ಅಥವಾ ಭಾಗಿಸಿ.', 10, 'ಕಪ್ಪುಹಲಗೆ'], elaborate: ['ಭಿನ್ನರಾಶಿ ಚಾರ್ಟ್‌ನಲ್ಲಿ ಸಮಾನ ಭಿನ್ನರಾಶಿ ಹುಡುಕಿ ಮಾದರಿ ವಿವರಿಸಿ.', 10, 'ಭಿನ್ನರಾಶಿ ಚಾರ್ಟ್'], evaluate: ['ಎಕ್ಸಿಟ್ ಸ್ಲಿಪ್: 3/5 ರ ಎರಡು ಸಮಾನ ಭಿನ್ನರಾಶಿ.', 5, 'ಕಾಗದದ ಚೀಟಿಗಳು'] },
        support: 'ಸಿದ್ಧ ಭಿನ್ನರಾಶಿ ಪಟ್ಟಿಗಳನ್ನು ಕೊಡಿ; ಅರ್ಧ ಮತ್ತು ಕಾಲು ಮಾತ್ರ ಬಳಸಿ.', extension: '1/2 ಮತ್ತು 1 ರ ನಡುವಿನ ಮೂರು ಭಿನ್ನರಾಶಿ ಹುಡುಕಿ ಅವು ಕ್ರಮದಲ್ಲಿವೆ ಎಂದು ಸಾಧಿಸಿ.',
        week: [['ಸಂಖ್ಯಾರೇಖೆಯಲ್ಲಿ ಭಿನ್ನರಾಶಿ', 'ಅಭ್ಯಾ. 7.1 ಪ್ರ. 1–3'], ['ಸರಿ ಮತ್ತು ವಿಷಮ ಭಿನ್ನರಾಶಿ', 'ಅಭ್ಯಾ. 7.2 ಪ್ರ. 1–2'], ['ಸಮಾನ ಭಿನ್ನರಾಶಿ', 'ಅಭ್ಯಾ. 7.3 ಪ್ರ. 1–4'], ['ಸರಳ ರೂಪ', 'ಅಭ್ಯಾ. 7.3 ಪ್ರ. 5–7'], ['ಭಿನ್ನರಾಶಿ ಹೋಲಿಕೆ', 'ಅಭ್ಯಾ. 7.4 ಪ್ರ. 1–3'], ['ಅಭ್ಯಾಸ ಮತ್ತು ರಸಪ್ರಶ್ನೆ', 'ಅಧ್ಯಾಯ ಪುನರಾವರ್ತನೆ']]
      },
      cell: {
        subjectKey: 'science', cls: '8', subject: 'ವಿಜ್ಞಾನ', topic: 'ಜೀವಕೋಶ: ರಚನೆ ಮತ್ತು ಕಾರ್ಯಗಳು', period: 2, duration: 40,
        outcomes: ['ಜೀವಕೋಶದ ಮುಖ್ಯ ಭಾಗಗಳನ್ನು ಹೆಸರಿಸಬಲ್ಲರು', 'ಸಸ್ಯ ಕೋಶ ಮತ್ತು ಪ್ರಾಣಿ ಕೋಶವನ್ನು ಹೋಲಿಸಬಲ್ಲರು', 'ಕೋಶವನ್ನು ಜೀವದ ಮೂಲ ಘಟಕ ಎಂದು ಏಕೆ ಕರೆಯುತ್ತಾರೆ ವಿವರಿಸಬಲ್ಲರು'],
        prev: 'ಜೀವಿಗಳು ಸಣ್ಣ ಭಾಗಗಳಿಂದ ಆಗಿವೆ ಎಂದು ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಗೊತ್ತು; ಕೈ ಭೂತಗನ್ನಡಿ ಬಳಸಿದ್ದಾರೆ.',
        materials: ['ಈರುಳ್ಳಿ ಪೊರೆ & ಸ್ಲೈಡ್', 'ಸೂಕ್ಷ್ಮದರ್ಶಕ ಅಥವಾ ಕೋಶ ಚಾರ್ಟ್', 'ಬಣ್ಣದ ಪೆನ್ಸಿಲ್‌ಗಳು'], comp: ['critical', 'comm'],
        intro: 'ಇಟ್ಟಿಗೆ ಗೋಡೆಯ ಫೋಟೋ ಮತ್ತು ಸೂಕ್ಷ್ಮದರ್ಶಕದಲ್ಲಿ ಈರುಳ್ಳಿ ಪೊರೆ ತೋರಿಸಿ. ಕೇಳಿ: ಜೀವಿಗಳು ಯಾವುದರಿಂದ ಆಗಿವೆ?',
        steps: [
          ['ಈರುಳ್ಳಿ ಪೊರೆ ಸ್ಲೈಡ್ ಅಥವಾ ಚಾರ್ಟ್ ತೋರಿಸಿ; ಕೋಶ ಭಿತ್ತಿ, ನ್ಯೂಕ್ಲಿಯಸ್, ಸೈಟೋಪ್ಲಾಸಂ ತೋರಿಸಿ.', 'ಕಾಣುವುದನ್ನು ಗಮನಿಸಿ ಬಿಡಿಸುತ್ತಾರೆ; ಎರಡು ಭಾಗ ಹೆಸರಿಸುತ್ತಾರೆ.', 12],
          ['ಹಲಗೆಯಲ್ಲಿ ವೆನ್ ಚಿತ್ರದಿಂದ ಸಸ್ಯ ಮತ್ತು ಪ್ರಾಣಿ ಕೋಶ ಹೋಲಿಸಿ.', 'ಜೋಡಿಯಲ್ಲಿ ವೆನ್ ಚಿತ್ರ ತುಂಬುತ್ತಾರೆ: ಭಿತ್ತಿ, ಹರಿತ್ತು, ರಿಕ್ತಿಕೆ, ನ್ಯೂಕ್ಲಿಯಸ್.', 13],
          ['"ನಗರ" ಹೋಲಿಕೆಯಿಂದ ಕೋಶದ ಭಾಗಗಳು ಮತ್ತು ಕೆಲಸಗಳನ್ನು ವಿವರಿಸಿ.', 'ಭಾಗದ ಕಾರ್ಡ್‌ಗಳನ್ನು ಅವುಗಳ ಕಾರ್ಯಗಳೊಂದಿಗೆ ಹೊಂದಿಸುತ್ತಾರೆ.', 10]
        ],
        recap: 'ವೇಗದ ಪ್ರಶ್ನೆ: ಕೋಶವನ್ನು ನಿಯಂತ್ರಿಸುವ ಭಾಗ; ಸಸ್ಯಗಳಲ್ಲಿ ಮಾತ್ರ ಇರುವ ಭಾಗ.',
        assess: 'ಐದು ಭಾಗಗಳೊಂದಿಗೆ ಸಸ್ಯ ಕೋಶ ಬಿಡಿಸಿ ಹೆಸರಿಸಿ.', hw: 'NCERT ಅಧ್ಯಾಯ 8, ಪ್ರಶ್ನೆ 1 ರಿಂದ 5.',
        e5: { engage: ['ಇಟ್ಟಿಗೆ ಗೋಡೆಯೋ ಈರುಳ್ಳಿ ಪೊರೆಯೋ: ಜೀವಿಗಳು ಯಾವುದರಿಂದ ಆಗಿವೆ?', 5, 'ಫೋಟೋ, ಈರುಳ್ಳಿ ಪೊರೆ'], explore: ['ಗುಂಪಿನಲ್ಲಿ ಈರುಳ್ಳಿ ಪೊರೆ ಸ್ಲೈಡ್ ಗಮನಿಸಿ ಬಿಡಿಸಿ.', 12, 'ಸೂಕ್ಷ್ಮದರ್ಶಕ ಅಥವಾ ಚಾರ್ಟ್'], explain: ['ಕೋಶದ ಭಾಗಗಳು ಮತ್ತು ಕೆಲಸಗಳು; ಸಸ್ಯ ಕೋಶ ಮತ್ತು ಪ್ರಾಣಿ ಕೋಶ.', 10, 'ಕಪ್ಪುಹಲಗೆ, ಕೋಶ ಚಾರ್ಟ್'], elaborate: ['ಮಣ್ಣು ಅಥವಾ ಕಾಗದದಿಂದ ಕೋಶ ಮಾದರಿ ಮಾಡಿ.', 8, 'ಮಣ್ಣು, ಕಾಗದ'], evaluate: ['ಖಾಲಿ ಕೋಶ ಚಿತ್ರಕ್ಕೆ ಹೆಸರಿಸಿ.', 5, 'ವರ್ಕ್‌ಶೀಟ್'] },
        support: 'ನಕಲು ಮಾಡಲು ಹೆಸರಿಸಿದ ಚಿತ್ರ ಕೊಡಿ; ಐದರ ಬದಲು ಮೂರು ಭಾಗ ಕೇಳಿ.', extension: 'ಎಲೆ ಕೋಶದಲ್ಲಿದ್ದು ಕೆನ್ನೆ ಕೋಶದಲ್ಲಿ ಇಲ್ಲದದ್ದು ಏನು, ಏಕೆ ಎಂದು ಕಂಡುಹಿಡಿಯಿರಿ.',
        week: [['ಕೋಶದ ಆವಿಷ್ಕಾರ; ಸೂಕ್ಷ್ಮದರ್ಶಕ', '8.1 ಓದಿ'], ['ಕೋಶದ ಆಕಾರ ಮತ್ತು ಗಾತ್ರ', 'ಮೂರು ಕೋಶ ಬಿಡಿಸಿ'], ['ಕೋಶದ ಭಾಗಗಳು', 'ಪ್ರ. 1–3'], ['ಸಸ್ಯ ಕೋಶ ಮತ್ತು ಪ್ರಾಣಿ ಕೋಶ', 'ವೆನ್ ಚಿತ್ರ'], ['ಈರುಳ್ಳಿ ಪೊರೆ ಪ್ರಯೋಗ', 'ಪ್ರಯೋಗ ಪುಸ್ತಕ'], ['ಪುನರಾವರ್ತನೆ ಮತ್ತು ರಸಪ್ರಶ್ನೆ', 'ಅಧ್ಯಾಯ ಪುನರಾವರ್ತನೆ']]
      },
      poem: {
        subjectKey: 'english', cls: '5', subject: 'ಇಂಗ್ಲಿಷ್', topic: 'ಕವನ: My Shadow', period: 4, duration: 35,
        outcomes: ['ಕವನವನ್ನು ಲಯದೊಂದಿಗೆ ಜೋರಾಗಿ ಓದಬಲ್ಲರು', 'ಪ್ರಾಸ ಪದ ಹುಡುಕಿ ನೆರಳು ಏನು ಮಾಡುತ್ತದೆ ಹೇಳಬಲ್ಲರು', 'ತಮ್ಮ ನೆರಳಿನ ಬಗ್ಗೆ ನಾಲ್ಕು ಸಾಲು ಬರೆಯಬಲ್ಲರು'],
        prev: 'ವಿದ್ಯಾರ್ಥಿಗಳು ಬಿಸಿಲಿನಲ್ಲಿ ತಮ್ಮ ನೆರಳು ನೋಡಿದ್ದಾರೆ; sun, fun ನಂತಹ ಪ್ರಾಸ ಪದ ಗೊತ್ತು.',
        materials: ['ಪಠ್ಯಪುಸ್ತಕ', 'ಟಾರ್ಚ್', 'ಕವನದ ಚಾರ್ಟ್'], comp: ['creativity', 'comm'],
        intro: 'ಮಬ್ಬು ಮೂಲೆಯಲ್ಲಿ ಟಾರ್ಚ್ ಹಾಕಿ ಕೈ ನೆರಳು ಮಾಡಿ. ಕೇಳಿ: ನಿಮ್ಮ ನೆರಳು ಯಾವಾಗ ಎತ್ತರವಾಗುತ್ತದೆ?',
        steps: [
          ['ಅಭಿನಯದೊಂದಿಗೆ ಕವನವನ್ನು ಎರಡು ಬಾರಿ ಜೋರಾಗಿ ಓದಿ; ಕಠಿಣ ಪದ ವಿವರಿಸಿ.', 'ಕೇಳುತ್ತಾರೆ, ನಂತರ ಒಟ್ಟಿಗೆ ಓದಿ ಸಾಲುಗಳನ್ನು ಅಭಿನಯಿಸುತ್ತಾರೆ.', 12],
          ['ಕೇಳಿ: ಮಗು ಮಾಡುವುದನ್ನು ನೆರಳು ಏನು ಮಾಡುತ್ತದೆ? ಪ್ರಾಸ ಜೋಡಿ ಹುಡುಕಿ.', 'ಜೋಡಿಯಲ್ಲಿ ಪ್ರಾಸ ಪದಕ್ಕೆ ಗೆರೆ ಹಾಕುತ್ತಾರೆ; ಒಬ್ಬೊಬ್ಬರು ಒಂದು ಜೋಡಿ ಹೇಳುತ್ತಾರೆ.', 13],
          ['ಹಲಗೆಯಲ್ಲಿ ನನ್ನ ನೆರಳಿನ ಬಗ್ಗೆ ನಾಲ್ಕು ಮಾದರಿ ಸಾಲು ಬರೆಯಿರಿ.', 'ತಮ್ಮ ನೆರಳಿನ ಬಗ್ಗೆ ನಾಲ್ಕು ಸಾಲು ಬರೆದು ಜೊತೆಗಾರನಿಗೆ ಓದುತ್ತಾರೆ.', 10]
        ],
        recap: 'ತರಗತಿ ಒಟ್ಟಾಗಿ ಮೊದಲ ಪದ್ಯ ಹೇಳುತ್ತದೆ; ಒಂದು ಗುಂಪು ಮೂಕಾಭಿನಯ ಮಾಡುತ್ತದೆ.',
        assess: 'ಮೌಖಿಕ: ಕವನದ ಮೇಲೆ ಮೂರು ಪ್ರಶ್ನೆ; ಬರೆದ ನಾಲ್ಕು ಸಾಲು ಪರೀಕ್ಷಿಸಿ.', hw: 'ಮೊದಲ ಪದ್ಯ ಕಂಠಪಾಠ ಮಾಡಿ; ಮಧ್ಯಾಹ್ನ ಮತ್ತು ಸಂಜೆ 5 ಗಂಟೆಗೆ ನಿಮ್ಮ ನೆರಳು ಬಿಡಿಸಿ.',
        e5: { engage: ['ಟಾರ್ಚ್‌ನಿಂದ ಕೈ ನೆರಳು: ನೆರಳು ಹೇಗೆ ಆಗುತ್ತದೆ?', 5, 'ಟಾರ್ಚ್'], explore: ['ಜೋಡಿಯಲ್ಲಿ ಕವನ ಓದಿ ಗೊತ್ತಿಲ್ಲದ ಪದ ಗುರುತಿಸಿ.', 8, 'ಪಠ್ಯಪುಸ್ತಕ'], explain: ['ಪ್ರತಿ ಪದ್ಯದ ಅರ್ಥ; ಪ್ರಾಸ ಪದ; ಲಯ.', 10, 'ಕವನದ ಚಾರ್ಟ್'], elaborate: ['ನಿಮ್ಮ ನೆರಳಿನ ಬಗ್ಗೆ ನಾಲ್ಕು ಸಾಲು ಬರೆಯಿರಿ.', 8, 'ನೋಟ್‌ಬುಕ್'], evaluate: ['ಒಂದು ಪದ್ಯ ಹೇಳಿ; ಎರಡು ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಿ.', 4, 'ಕವನದ ಚಾರ್ಟ್'] },
        support: 'ಗೆಳೆಯನ ಜೊತೆ ಓದಲಿ; ನಾಲ್ಕು ಸಾಲಿಗೆ ಪದ ಬ್ಯಾಂಕ್ ಕೊಡಿ.', extension: 'ಮಧ್ಯಾಹ್ನ ನೆರಳು ಚಿಕ್ಕದಾಗಿ, ಸಂಜೆ ಉದ್ದವಾಗಿ ಏಕೆ ಇರುತ್ತದೆ ಕಂಡುಹಿಡಿಯಿರಿ.',
        week: [['ಕವನ: ಓದಿ ಆನಂದಿಸಿ', 'ಮನೆಯಲ್ಲಿ ಜೋರಾಗಿ ಓದಿ'], ['ಹೊಸ ಪದ ಮತ್ತು ಪ್ರಾಸ', 'ಐದು ಪ್ರಾಸ ಜೋಡಿ ಬರೆಯಿರಿ'], ['ಗ್ರಹಿಕೆ ಪ್ರಶ್ನೆಗಳು', 'ಪ್ರ. 1–4'], ['ಬರವಣಿಗೆ: ನನ್ನ ನೆರಳು', 'ನಾಲ್ಕು ಸಾಲು ಮುಗಿಸಿ'], ['ವ್ಯಾಕರಣ: ಕವನದ ನಾಮಪದಗಳು', 'ವರ್ಕ್‌ಶೀಟ್'], ['ವಾಚನ ಮತ್ತು ಮೋಜು', 'ಪದ್ಯ 1 ಕಂಠಪಾಠ']]
      },
      medieval: {
        subjectKey: 'social', cls: '7', subject: 'ಸಮಾಜ ವಿಜ್ಞಾನ', topic: 'ಸಾವಿರ ವರ್ಷಗಳ ಬದಲಾವಣೆಗಳ ಜಾಡು', period: 5, duration: 40,
        outcomes: ['"ಹಿಂದುಸ್ತಾನ್" ಪದದ ಅರ್ಥ ಕಾಲದೊಂದಿಗೆ ಹೇಗೆ ಬದಲಾಯಿತು ವಿವರಿಸಬಲ್ಲರು', 'ಐತಿಹಾಸಿಕ ನಕ್ಷೆ ಓದಿ ಆಧುನಿಕ ನಕ್ಷೆಯೊಂದಿಗೆ ಹೋಲಿಸಬಲ್ಲರು', 'ಮಧ್ಯಕಾಲಕ್ಕೆ ಇತಿಹಾಸಕಾರರು ಬಳಸುವ ಆಕರಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಬಲ್ಲರು'],
        prev: 'ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ 6ನೇ ತರಗತಿಯ ಪ್ರಾಚೀನ ಕಾಲ ಗೊತ್ತು; ಭಾರತದ ನಕ್ಷೆ ಓದಬಲ್ಲರು.',
        materials: ['ಎರಡು ನಕ್ಷೆಗಳು: ಅಲ್-ಇದ್ರೀಸಿ (1154) ಮತ್ತು ಆಧುನಿಕ ನಕ್ಷೆ', 'ಪಠ್ಯಪುಸ್ತಕ', 'ಅಟ್ಲಾಸ್'], comp: ['critical', 'comm'],
        intro: 'ಅಲ್-ಇದ್ರೀಸಿಯ 1154 ನಕ್ಷೆಯನ್ನು ತಲೆಕೆಳಗಾಗಿ ತೋರಿಸಿ. ಕೇಳಿ: ದಕ್ಷಿಣ ಭಾರತ ಕಾಣುತ್ತಿದೆಯೇ?',
        steps: [
          ['ಎರಡು ನಕ್ಷೆ ಹೋಲಿಸಿ: ಹೆಸರು, ಆಕಾರ, ಇಲ್ಲದದ್ದು.', 'ಜೋಡಿಯಲ್ಲಿ ಮೂರು ವ್ಯತ್ಯಾಸ ಹುಡುಕಿ ನಕ್ಷೆ ಏಕೆ ಬದಲಾಗುತ್ತವೆ ಹೇಳುತ್ತಾರೆ.', 12],
          ['ಪದಗಳು ಹೇಗೆ ಬದಲಾಗುತ್ತವೆ ವಿವರಿಸಿ: ಮಿನ್ಹಾಜ್-ಇ-ಸಿರಾಜ್, ಬಾಬರ್, ಅಮೀರ್ ಖುಸ್ರೋ ಅವರ "ಹಿಂದುಸ್ತಾನ್".', 'ನೋಟ್‌ಬುಕ್‌ನಲ್ಲಿ ಮೂರು ಅರ್ಥಗಳ ಕಾಲರೇಖೆ ಮಾಡುತ್ತಾರೆ.', 13],
          ['ಆಕರಗಳು: ಹಸ್ತಪ್ರತಿ, ನಾಣ್ಯ, ಶಾಸನ, ಕಟ್ಟಡ; ನಕಲು ಮಾಡುವುದರಿಂದ ಪಠ್ಯ ಏಕೆ ಬದಲಾಯಿತು.', 'ಆಕರ ಕಾರ್ಡ್‌ಗಳನ್ನು ಲಿಖಿತ ಮತ್ತು ಭೌತಿಕ ಆಕರವಾಗಿ ವಿಂಗಡಿಸುತ್ತಾರೆ.', 10]
        ],
        recap: 'ವೇಗದ ರಸಪ್ರಶ್ನೆ: ಪಂಜಾಬ್, ಹರಿಯಾಣ, ಗಂಗಾ-ಯಮುನಾ ಪ್ರದೇಶಕ್ಕೆ "ಹಿಂದುಸ್ತಾನ್" ಎಂದು ಯಾರು ಬಳಸಿದರು?',
        assess: 'ಸ್ಥಳದ ಹೆಸರಿನ ಅರ್ಥ ಏಕೆ ಬದಲಾಗಬಹುದು ಎಂಬುದಕ್ಕೆ ಎರಡು ಕಾರಣ ಬರೆಯಿರಿ.', hw: 'NCERT ಅಧ್ಯಾಯ 1, "Let\'s recall" ಪ್ರಶ್ನೆ 1 ರಿಂದ 3.',
        e5: { engage: ['1154 ರ ತಲೆಕೆಳಗಾದ ನಕ್ಷೆ: ಏನು ಕಾಣುತ್ತಿದೆ?', 5, 'ನಕ್ಷೆ ಮುದ್ರಣ'], explore: ['ಗುಂಪಿನಲ್ಲಿ ಹಳೆಯ ಮತ್ತು ಹೊಸ ನಕ್ಷೆ ಹೋಲಿಸಿ.', 10, 'ಎರಡು ನಕ್ಷೆಗಳು'], explain: ['ಬದಲಾಗುವ ಹೆಸರು ಮತ್ತು ಅರ್ಥ; ಈ ಕಾಲದ ಆಕರಗಳು.', 12, 'ಪಠ್ಯಪುಸ್ತಕ, ಕಪ್ಪುಹಲಗೆ'], elaborate: ['"ಹಿಂದುಸ್ತಾನ್" ಪದದ ಕಾಲರೇಖೆ ಬಿಡಿಸಿ.', 8, 'ನೋಟ್‌ಬುಕ್'], evaluate: ['ಸ್ಥಳದ ಹೆಸರಿನ ಅರ್ಥ ಬದಲಾಗಲು ಎರಡು ಕಾರಣ.', 5, 'ಕಾಗದದ ಚೀಟಿಗಳು'] },
        support: 'ಹೆಸರು ಮೊದಲೇ ಗುರುತಿಸಿದ ನಕ್ಷೆ ಕೊಡಿ; ಒಂದು ವ್ಯತ್ಯಾಸ ಕೇಳಿ.', extension: '500 ವರ್ಷಗಳ ಹಿಂದೆ ನಿಮ್ಮ ಊರು ಅಥವಾ ರಾಜ್ಯವನ್ನು ಏನೆಂದು ಕರೆಯುತ್ತಿದ್ದರು ಕಂಡುಹಿಡಿಯಿರಿ.',
        week: [['ಹಳೆಯ ನಕ್ಷೆ ಮತ್ತು ಹೊಸ ನಕ್ಷೆ', '1.1 ಓದಿ'], ['ಹೊಸ ಮತ್ತು ಹಳೆಯ ಪದ: ಹಿಂದುಸ್ತಾನ್', 'ಕಾಲರೇಖೆ'], ['ಇತಿಹಾಸಕಾರರು ಮತ್ತು ಆಕರಗಳು', 'ಪ್ರ. 1–3'], ['ಹೊಸ ಸಾಮಾಜಿಕ ಮತ್ತು ರಾಜಕೀಯ ಗುಂಪುಗಳು', '1.3 ಓದಿ'], ['ಪ್ರದೇಶ ಮತ್ತು ಸಾಮ್ರಾಜ್ಯ; ಹಳೆಯ ಮತ್ತು ಹೊಸ ಧರ್ಮಗಳು', 'ಚಿಕ್ಕ ಟಿಪ್ಪಣಿ'], ['ಪುನರಾವರ್ತನೆ ಮತ್ತು ನಕ್ಷೆ ಕೆಲಸ', 'ಐದು ಸ್ಥಳ ಗುರುತಿಸಿ']]
      },
      story: {
        subjectKey: 'language', cls: '4', subject: 'ಕನ್ನಡ', topic: 'ಕಥೆ: ಬಾಯಾರಿದ ಕಾಗೆ', period: 1, duration: 35,
        outcomes: ['ಕಥೆಯನ್ನು ಸರಿಯಾದ ಕ್ರಮದಲ್ಲಿ ಮತ್ತೆ ಹೇಳಬಲ್ಲರು', 'ಐದು ಹೊಸ ಪದಗಳ ಅರ್ಥ ಹೇಳಬಲ್ಲರು', 'ಕಾಗೆ ಏನು ಮಾಡಿತು, ಅದು ಏಕೆ ಫಲಿಸಿತು ಹೇಳಬಲ್ಲರು'],
        prev: 'ವಿದ್ಯಾರ್ಥಿಗಳು ಚಿಕ್ಕ ವಾಕ್ಯ ಓದಬಲ್ಲರು; ಮನೆಯಲ್ಲಿ ಜನಪದ ಕಥೆ ಕೇಳಿದ್ದಾರೆ.',
        materials: ['ಕಥೆಯ ಚಿತ್ರ ಕಾರ್ಡ್‌ಗಳು', 'ಒಂದು ಮಡಕೆ, ನೀರು ಮತ್ತು ಕಲ್ಲುಗಳು', 'ಪಠ್ಯಪುಸ್ತಕ'], comp: ['critical', 'creativity', 'comm'],
        intro: 'ಸ್ವಲ್ಪ ನೀರಿರುವ ಮಡಕೆ ಮತ್ತು ಒಂದು ಕಲ್ಲು ತೋರಿಸಿ. ಕೇಳಿ: ಹಕ್ಕಿ ಈ ನೀರನ್ನು ಹೇಗೆ ಕುಡಿಯಬಹುದು?',
        steps: [
          ['ಚಿತ್ರ ಕಾರ್ಡ್ ಮತ್ತು ಧ್ವನಿ ಬದಲಾವಣೆಯೊಂದಿಗೆ ಕಥೆ ಹೇಳಿ.', 'ಕೇಳುತ್ತಾರೆ; ಎರಡು ಕಡೆ ಮುಂದೇನಾಗುತ್ತದೆ ಊಹಿಸುತ್ತಾರೆ.', 10],
          ['ಕಥೆ ಜೋರಾಗಿ ಓದಿ; ಅಭಿನಯದಿಂದ ಹೊಸ ಪದ ವಿವರಿಸಿ.', 'ಜೋಡಿಯಲ್ಲಿ ಓದುತ್ತಾರೆ; ಹೊಸ ಪದಕ್ಕೆ ಗೆರೆ; ಎರಡರಿಂದ ವಾಕ್ಯ ಮಾಡುತ್ತಾರೆ.', 15],
          ['ಮಡಕೆಯೊಂದಿಗೆ ಕಲ್ಲಿನ ಪ್ರಯೋಗ ಮಾಡಿ.', 'ಒಂದೊಂದು ಕಲ್ಲು ಹಾಕಿ, ನೀರು ಏರುವುದನ್ನು ನೋಡಿ, ಏಕೆ ಎಂದು ಹೇಳುತ್ತಾರೆ.', 10]
        ],
        recap: 'ಹಲಗೆಯಲ್ಲಿ ಚಿತ್ರ ಕಾರ್ಡ್‌ಗಳನ್ನು ಕ್ರಮವಾಗಿ ಜೋಡಿಸಿ.',
        assess: 'ಜೊತೆಗಾರನಿಗೆ ಐದು ವಾಕ್ಯಗಳಲ್ಲಿ ಕಥೆ ಮತ್ತೆ ಹೇಳಿ.', hw: 'ಕಾಗೆ ಮತ್ತು ಮಡಕೆ ಬಿಡಿಸಿ; ಮೂರು ವಾಕ್ಯ ಬರೆಯಿರಿ.',
        e5: { engage: ['ಸ್ವಲ್ಪ ನೀರಿರುವ ಮಡಕೆ: ಹಕ್ಕಿ ಹೇಗೆ ಕುಡಿಯುತ್ತದೆ?', 5, 'ಮಡಕೆ, ನೀರು'], explore: ['ಗುಂಪಿನಲ್ಲಿ ಕಲ್ಲು ಹಾಕಿ ನೋಡಿ: ನೀರು ಏರುತ್ತದೆಯೇ?', 8, 'ಮಡಕೆ, ಕಲ್ಲುಗಳು'], explain: ['ಕಥೆ ಓದಿ; ಹೊಸ ಪದ ಮತ್ತು ಕಥೆಯ ನೀತಿ.', 10, 'ಪಠ್ಯಪುಸ್ತಕ, ಚಿತ್ರ ಕಾರ್ಡ್'], elaborate: ['ಮೂವರ ಗುಂಪಿನಲ್ಲಿ ಕಥೆ ಅಭಿನಯಿಸಿ.', 8, 'ಚಿತ್ರ ಕಾರ್ಡ್'], evaluate: ['ಐದು ವಾಕ್ಯಗಳಲ್ಲಿ ಕಥೆ ಮತ್ತೆ ಹೇಳಿ.', 4, 'ಚಿತ್ರ ಕಾರ್ಡ್'] },
        support: 'ಚಿತ್ರ ಕಾರ್ಡ್ ಕ್ರಮವಾಗಿ ಕೊಡಿ; ಅವುಗಳೊಂದಿಗೆ ಹೇಳಲಿ.', extension: 'ಅಂತ್ಯ ಬದಲಿಸಿ: ಕಲ್ಲುಗಳೇ ಇಲ್ಲದಿದ್ದರೆ ಏನಾಗುತ್ತಿತ್ತು?',
        week: [['ಕಥೆ ಕೇಳಿ', 'ಮನೆಯಲ್ಲಿ ಹೇಳಿ'], ['ಓದಿ; ಹೊಸ ಪದ', 'ಐದು ಪದ, ಐದು ವಾಕ್ಯ'], ['ಕಲ್ಲಿನ ಪ್ರಯೋಗ ಮತ್ತು ಅದು ಏಕೆ ಫಲಿಸುತ್ತದೆ', 'ಚಿತ್ರ ಬಿಡಿಸಿ'], ['ಕಥೆ ಅಭಿನಯಿಸಿ', 'ನಿಮ್ಮ ಸಂಭಾಷಣೆ ಅಭ್ಯಾಸ ಮಾಡಿ'], ['ನಿಮ್ಮ ಅಂತ್ಯ ಬರೆಯಿರಿ', 'ಅಂತ್ಯ ಮುಗಿಸಿ'], ['ಪುನರಾವರ್ತನೆ ಮತ್ತು ಜೋರಾಗಿ ಓದು', 'ಪುಟ 1 ಜೋರಾಗಿ ಓದಿ']]
      },
      ai: {
        subjectKey: 'ai', cls: '9', subject: 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ', topic: 'AI ಎಂದರೇನು?', period: 6, duration: 40,
        outcomes: ['ನಿಗದಿತ ನಿಯಮ ಪಾಲಿಸುವ ಯಂತ್ರ ಮತ್ತು ದತ್ತಾಂಶದಿಂದ ಕಲಿಯುವ ಯಂತ್ರದ ವ್ಯತ್ಯಾಸ ಹೇಳಬಲ್ಲರು', 'ದಿನನಿತ್ಯದ AI ಐದು ಬಳಕೆ ಪಟ್ಟಿ ಮಾಡಬಲ್ಲರು', 'AI ಯ ಒಂದು ಲಾಭ ಮತ್ತು ಒಂದು ಅಪಾಯ ಚರ್ಚಿಸಬಲ್ಲರು'],
        prev: 'ವಿದ್ಯಾರ್ಥಿಗಳು ಸ್ಮಾರ್ಟ್‌ಫೋನ್, ನಕ್ಷೆ, ಧ್ವನಿ ಸಹಾಯಕ, ವೀಡಿಯೊ ಆಪ್ ಬಳಸುತ್ತಾರೆ.',
        materials: ['ಪ್ರೊಜೆಕ್ಟರ್ ಅಥವಾ ಫೋನ್', 'ದಿನನಿತ್ಯದ ಕೆಲಸಗಳ ಕಾರ್ಡ್', 'ಚಾರ್ಟ್ ಪೇಪರ್'], comp: ['critical', 'digital', 'comm'],
        intro: 'ಕೇಳಿ: ನಿಮ್ಮ ಫೋನ್ ಮುಖ ನೋಡಿ ಹೇಗೆ ತೆರೆಯುತ್ತದೆ? ವೀಡಿಯೊ ಆಪ್‌ಗೆ ನಿಮಗೆ ಏನು ಇಷ್ಟ ಎಂದು ಹೇಗೆ ಗೊತ್ತು?',
        steps: [
          ['ಸರಳ ಮಾತಿನಲ್ಲಿ AI ವ್ಯಾಖ್ಯಾನಿಸಿ: ದತ್ತಾಂಶದಿಂದ ಮಾದರಿ ಕಲಿತು ನಿರ್ಧಾರ ಮಾಡುವ ಯಂತ್ರಗಳು.', 'ತಮ್ಮ ಫೋನ್‌ನಿಂದ ಒಬ್ಬೊಬ್ಬರು ಎರಡು ಉದಾಹರಣೆ ಕೊಡುತ್ತಾರೆ.', 10],
          ['ಕೆಲಸ ವಿಂಗಡಿಸಿ: ಕ್ಯಾಲ್ಕುಲೇಟರ್ (ನಿಗದಿತ ನಿಯಮ), ಸ್ಪ್ಯಾಮ್ ಫಿಲ್ಟರ್ (ಕಲಿಯುವುದು). ದತ್ತಾಂಶ, ಮಾದರಿ, ಮುನ್ಸೂಚನೆ ವಿವರಿಸಿ.', 'ಗುಂಪಿನಲ್ಲಿ ಕೆಲಸ ಕಾರ್ಡ್‌ಗಳನ್ನು "ನಿಗದಿತ ನಿಯಮ", "ದತ್ತಾಂಶದಿಂದ ಕಲಿಯುತ್ತದೆ" ಎಂದು ವಿಂಗಡಿಸುತ್ತಾರೆ.', 15],
          ['ಲಾಭ ಮತ್ತು ಅಪಾಯ ಚರ್ಚಿಸಿ: ಕೃಷಿ, ಆರೋಗ್ಯದಲ್ಲಿ ಸಹಾಯ; ಪಕ್ಷಪಾತ, ಗೌಪ್ಯತೆ, ನಕಲಿ ವೀಡಿಯೊ.', 'ಪ್ರತಿ ಗುಂಪು ಚಾರ್ಟ್ ಪೇಪರ್‌ನಲ್ಲಿ ಒಂದು ಲಾಭ, ಒಂದು ಅಪಾಯ ಬರೆಯುತ್ತದೆ.', 10]
        ],
        recap: 'ಮೂರು ಹೇಳಿಕೆಗಳು: AI ಹೌದೋ ಅಲ್ಲವೋ? ಹೆಬ್ಬೆರಳು ಮೇಲೆ ಅಥವಾ ಕೆಳಗೆ.',
        assess: 'ಈ ವಾರ ನೀವು ನೋಡಿದ AI ಐದು ಬಳಕೆ ಮತ್ತು ಒಂದು ಅಪಾಯ ಬರೆಯಿರಿ.', hw: 'ಮನೆಯವರನ್ನು ಯಾವ ಆಪ್ ಹೆಚ್ಚು ನಂಬುತ್ತೀರಿ, ಏಕೆ ಎಂದು ಕೇಳಿ; ಅದು AI ಬಳಸುತ್ತದೆಯೇ ಎಂದು ಬರೆಯಿರಿ.',
        e5: { engage: ['ನಿಮ್ಮ ಫೋನ್ ಮುಖ ನೋಡಿ ಹೇಗೆ ತೆರೆಯುತ್ತದೆ?', 5, 'ಫೋನ್'], explore: ['ಕೆಲಸ ಕಾರ್ಡ್ ವಿಂಗಡಿಸಿ: ನಿಗದಿತ ನಿಯಮವೋ ಕಲಿಕೆಯೋ?', 10, 'ಕೆಲಸ ಕಾರ್ಡ್'], explain: ['AI ಎಂದರೇನು: ದತ್ತಾಂಶ, ಮಾದರಿ, ಮುನ್ಸೂಚನೆ; ಎಲ್ಲಿ ಬಳಕೆ.', 12, 'ಪ್ರೊಜೆಕ್ಟರ್'], elaborate: ['ನಿಮ್ಮ ಶಾಲೆಗೆ ಸರಳ AI ಸಹಾಯಕನನ್ನು ಕಾಗದದಲ್ಲಿ ವಿನ್ಯಾಸ ಮಾಡಿ.', 8, 'ಚಾರ್ಟ್ ಪೇಪರ್'], evaluate: ['AI ಐದು ಬಳಕೆ ಮತ್ತು ಒಂದು ಅಪಾಯ.', 5, 'ನೋಟ್‌ಬುಕ್'] },
        support: 'ಉದಾಹರಣೆ ಸಿದ್ಧವಾಗಿ ಕೊಡಿ; ವಿದ್ಯಾರ್ಥಿಗಳು ವಿಂಗಡಿಸಿದರೆ ಸಾಕು.', extension: 'AI ತಪ್ಪು ನಿರ್ಧಾರ ಮಾಡಿದ ಒಂದು ಉದಾಹರಣೆ ಹುಡುಕಿ ಏಕೆ ಎಂದು ವಿವರಿಸಿ.',
        week: [['ಬುದ್ಧಿಮತ್ತೆ ಎಂದರೇನು? ಮನುಷ್ಯ ಮತ್ತು ಯಂತ್ರ', 'ಇಂದು ಮಾಡಿದ ಐದು ಬುದ್ಧಿವಂತ ಕೆಲಸ ಪಟ್ಟಿ'], ['AI ಎಂದರೇನು? ನಿಯಮವೋ ಕಲಿಕೆಯೋ', 'ಹತ್ತು ಕೆಲಸ ವಿಂಗಡಿಸಿ'], ['ನಮ್ಮ ಸುತ್ತ AI', 'AI ಐದು ಬಳಕೆ'], ['ದತ್ತಾಂಶ, ಮಾದರಿ, ಮುನ್ಸೂಚನೆ', 'ಮಾದರಿ ವರ್ಕ್‌ಶೀಟ್'], ['AI ಲಾಭ ಮತ್ತು ಅಪಾಯ', 'ಒಂದು ಪುಟದ ಟಿಪ್ಪಣಿ'], ['ಯೋಜನೆ: ನಮ್ಮ ಶಾಲೆಗೆ AI ಸಹಾಯಕ', 'ಪೋಸ್ಟರ್']]
      }
    }
  },
  ml: {
    bloom: {
      remember: ['നിർവചിക്കുക', 'പട്ടികപ്പെടുത്തുക', 'പേര് പറയുക', 'ഓർത്തെടുക്കുക', 'പേരിടുക', 'പ്രസ്താവിക്കുക'],
      understand: ['വിശദീകരിക്കുക', 'വിവരിക്കുക', 'സംഗ്രഹിക്കുക', 'വർഗീകരിക്കുക', 'താരതമ്യം ചെയ്യുക', 'ഉദാഹരണം നൽകുക'],
      apply: ['ഉപയോഗിക്കുക', 'പരിഹരിക്കുക', 'കണക്കാക്കുക', 'ചെയ്തു കാണിക്കുക', 'കാണിക്കുക', 'അളക്കുക'],
      analyse: ['വിശകലനം ചെയ്യുക', 'വേർതിരിക്കുക', 'പാറ്റേൺ കണ്ടെത്തുക', 'പരിശോധിക്കുക', 'തരംതിരിക്കുക', 'അനുമാനിക്കുക'],
      evaluate: ['വിധിക്കുക', 'ന്യായീകരിക്കുക', 'തീരുമാനിക്കുക', 'പരിശോധിച്ചുറപ്പിക്കുക', 'അനുകൂലമായി വാദിക്കുക', 'വിലയിരുത്തുക'],
      create: ['രൂപകൽപന ചെയ്യുക', 'ഉണ്ടാക്കുക', 'ആസൂത്രണം ചെയ്യുക', 'രചിക്കുക', 'നിർമിക്കുക', 'കണ്ടുപിടിക്കുക']
    },
    materials: ['ബ്ലാക്ക്ബോർഡും ചോക്കും', 'പാഠപുസ്തകം', 'ചാർട്ട് അല്ലെങ്കിൽ പോസ്റ്റർ', 'ഫ്ലാഷ് കാർഡുകൾ', 'വർക്ക്ഷീറ്റ്', 'പ്രൊജക്ടർ അല്ലെങ്കിൽ സ്മാർട്ട്ബോർഡ്', 'യഥാർഥ വസ്തുക്കൾ', 'നോട്ടുബുക്കും പെൻസിലും'],
    ideas: {
      maths: ['കടലാസിൽ ഉണ്ടാക്കൂ: മടക്കിയോ മുറിച്ചോ ആകൃതികളിലൂടെ ആശയം കാണിക്കുക', 'ഒരു കടുപ്പമുള്ള ചോദ്യത്തിൽ ചിന്തിക്കുക-ജോടിയിൽ പങ്കുവയ്ക്കുക-എല്ലാവരോടും പറയുക', 'ഗണിത റിലേ: ഗ്രൂപ്പിലെ ഓരോരുത്തരും ബോർഡിൽ ഒരു പടി പരിഹരിക്കുന്നു', 'ആദ്യം ഊഹിക്കുക, പിന്നെ അളന്ന് താരതമ്യം ചെയ്യുക', 'ഈ ഗണിതം ചന്തയിലോ അടുക്കളയിലോ കണ്ടെത്തി ഒരു ഉദാഹരണം കൊണ്ടുവരിക'],
      science: ['ചെറിയ പ്രദർശനത്തോടെ പ്രവചിക്കുക-നിരീക്ഷിക്കുക-വിശദീകരിക്കുക', 'യഥാർഥ വസ്തു നോക്കി വരച്ച് പേരിടുക', 'ഗ്രൂപ്പ് പരീക്ഷണം, പൊതുവായ ഫല പട്ടികയോടെ', 'കാർഡുകൾ ഗ്രൂപ്പുകളായി തിരിച്ച് നിയമം വിശദീകരിക്കുക', 'ഓരോ ഗ്രൂപ്പിൽ നിന്നും ഒരു മിനിറ്റ് "സയൻസ് റിപ്പോർട്ടർ"'],
      english: ['ജോടിയായി ഉറക്കെ വായിച്ച് റോളുകൾ മാറുക', 'നാലംഗ ഗ്രൂപ്പിൽ രംഗം അഭിനയിക്കുക', 'വാക്ക് വേട്ട: അഞ്ച് പുതിയ വാക്കുകൾ കണ്ടെത്തി അർഥം ഊഹിക്കുക', 'സ്വന്തം വാക്കുകളിൽ മൂന്ന് വരി എഴുതുക', 'ഹോട്ട് സീറ്റ്: ഒരു കുട്ടി കഥാപാത്രമായി മറുപടി പറയുന്നു'],
      social: ['തറയിൽ ചോക്കുകൊണ്ട് കാലരേഖ', 'ഭൂപട പ്രവർത്തനം: അഞ്ച് സ്ഥലങ്ങൾ അടയാളപ്പെടുത്തുക', 'റോൾ പ്ലേ: അക്കാലത്തെ ഒരു ദിവസം', 'അന്നും ഇന്നും: T-ചാർട്ടിൽ താരതമ്യം', 'പ്രാദേശിക ബന്ധം: വീട്ടിലെ മുതിർന്നവരോട് ചോദിച്ച് പറയുക'],
      language: ['കഥാവൃത്തം: ഓരോ കുട്ടിയും ഒരു വരി കൂട്ടിച്ചേർക്കുന്നു', 'ചിത്രസംസാരം: മൂന്ന് വാക്യങ്ങളിൽ വിവരിക്കുക', 'പ്രാസമുള്ള വാക്കുകൾ കണ്ടെത്തി ഒരു പാട്ടുണ്ടാക്കുക', 'ജോടിയിൽ കേട്ടെഴുത്ത്; പരസ്പരം പരിശോധിക്കുക', 'കൈപ്പാവകൾ കൊണ്ട് കഥ വീണ്ടും പറയുക'],
      ai: ['AI കണ്ടെത്തുക: AI ഉപയോഗിക്കുന്ന അഞ്ച് ആപ്പുകൾ പട്ടികപ്പെടുത്തുക', 'മനുഷ്യനോ യന്ത്രമോ: ജോലികൾ തരംതിരിക്കുക', 'പാറ്റേൺ കളി: ഉദാഹരണങ്ങളിൽ നിന്ന് നിയമം ഊഹിക്കുക', 'കടലാസിൽ ലളിതമായ ചാറ്റ്ബോട്ട് സ്ക്രിപ്റ്റ് എഴുതുക', 'സംവാദം: AI എപ്പോഴും ശരിയാണോ?'],
      general: ['ചിന്തിക്കുക-ജോടി-പങ്കുവയ്ക്കുക: ഒരു മിനിറ്റ് ഒറ്റയ്ക്ക്, രണ്ട് മിനിറ്റ് ജോടിയായി', 'എക്സിറ്റ് സ്ലിപ്പ്: ഞാൻ പഠിച്ച ഒരു കാര്യം, എന്റെ ഒരു ചോദ്യം', 'ഗാലറി വോക്ക്: ഗ്രൂപ്പുകൾ തങ്ങളുടെ ജോലി ചുമരിൽ ഒട്ടിക്കുന്നു', 'സ്ലേറ്റുകളുമായി ടീം ക്വിസ്', 'സഹപഠനം: കൂട്ടുകാരന് വിശദീകരിക്കുക']
    },
    samples: {
      fractions: {
        subjectKey: 'maths', cls: '6', subject: 'ഗണിതം', topic: 'ഭിന്നസംഖ്യകൾ: തുല്യ ഭിന്നസംഖ്യകൾ', period: 3, duration: 40,
        outcomes: ['തുല്യ ഭിന്നസംഖ്യ എന്താണെന്ന് വിശദീകരിക്കാൻ കഴിയും', 'ഗുണിച്ചോ ഹരിച്ചോ തുല്യ ഭിന്നസംഖ്യകൾ ഉണ്ടാക്കാൻ കഴിയും', 'രണ്ട് ഭിന്നസംഖ്യകൾ തുല്യമാണോ എന്ന് പരിശോധിക്കാൻ കഴിയും'],
        prev: 'കുട്ടികൾക്ക് 1/2, 3/4 പോലുള്ള ഭിന്നസംഖ്യകൾ വായിക്കാനും എഴുതാനും ആകൃതിയിൽ നിറം കൊടുക്കാനും അറിയാം.',
        materials: ['കടലാസ് സ്ട്രിപ്പുകൾ', 'ബ്ലാക്ക്ബോർഡും ചോക്കും', 'ഭിന്നസംഖ്യാ ചാർട്ട്'], comp: ['critical', 'collab'],
        intro: '2 തുല്യ കഷണങ്ങളാക്കിയ ഒരു ചപ്പാത്തിയും 4 കഷണങ്ങളാക്കിയ മറ്റൊന്നും കാണിക്കുക. ചോദിക്കുക: 1/2 ഉം 2/4 ഉം ഒന്നാണോ?',
        steps: [
          ['കടലാസ് സ്ട്രിപ്പ് പകുതിയായും പിന്നെ നാലായും മടക്കുക; ബോർഡിൽ 1/2 = 2/4 കാണിക്കുക.', 'സ്വന്തം സ്ട്രിപ്പുകൾ മടക്കി 1/2, 2/4 നിറം കൊടുത്ത് ജോടിയിൽ താരതമ്യം ചെയ്യുന്നു.', 10],
          ['നിയമം വിശദീകരിക്കുക: അംശവും ഛേദവും ഒരേ സംഖ്യ കൊണ്ട് ഗുണിക്കുക അല്ലെങ്കിൽ ഹരിക്കുക. രണ്ട് ഉദാഹരണങ്ങൾ ചെയ്യുക.', 'നോട്ടുബുക്കിൽ 2/3 ന്റെ മൂന്ന് തുല്യ ഭിന്നസംഖ്യകൾ ഉണ്ടാക്കുന്നു.', 15],
          ['ഭിന്നസംഖ്യാ ജോടികൾ നൽകുക; ഏതാണ് തുല്യം, എങ്ങനെ അറിയാം എന്ന് ചോദിക്കുക.', 'കുറുകെ ഗുണിച്ച് പരിശോധിച്ച് കാരണത്തോടെ അതെ/അല്ല പറയുന്നു.', 10]
        ],
        recap: 'ബോർഡിൽ മൂന്ന് പെട്ടെന്നുള്ള ചോദ്യങ്ങൾ: തുല്യമോ അല്ലയോ? കുട്ടികൾ തള്ളവിരൽ മുകളിലേക്കോ താഴേക്കോ കാണിക്കുന്നു.',
        assess: 'എക്സിറ്റ് സ്ലിപ്പ്: 3/5 ന്റെ രണ്ട് തുല്യ ഭിന്നസംഖ്യകൾ എഴുതുക.', hw: 'NCERT അഭ്യാസം 7.3, ചോദ്യങ്ങൾ 1 മുതൽ 4 വരെ.',
        e5: { engage: ['ചപ്പാത്തി പസിൽ: 1/2 ഉം 2/4 ഉം ഒന്നാണോ? വോട്ട് ചെയ്ത് കാരണം പറയുക.', 5, 'രണ്ട് കടലാസ് ചപ്പാത്തികൾ'], explore: ['ജോടിയായി സ്ട്രിപ്പുകൾ മടക്കി 1/2 ന് തുല്യമായ ഭിന്നസംഖ്യകൾ കണ്ടെത്തുക.', 10, 'കടലാസ് സ്ട്രിപ്പുകൾ'], explain: ['നിയമം: അംശവും ഛേദവും ഒരേ സംഖ്യ കൊണ്ട് ഗുണിക്കുക അല്ലെങ്കിൽ ഹരിക്കുക.', 10, 'ബ്ലാക്ക്ബോർഡ്'], elaborate: ['ഭിന്നസംഖ്യാ ചാർട്ടിൽ തുല്യ ഭിന്നസംഖ്യകൾ കണ്ടെത്തി പാറ്റേൺ വിവരിക്കുക.', 10, 'ഭിന്നസംഖ്യാ ചാർട്ട്'], evaluate: ['എക്സിറ്റ് സ്ലിപ്പ്: 3/5 ന്റെ രണ്ട് തുല്യ ഭിന്നസംഖ്യകൾ.', 5, 'കടലാസ് സ്ലിപ്പുകൾ'] },
        support: 'തയ്യാറാക്കിയ ഭിന്നസംഖ്യാ സ്ട്രിപ്പുകൾ നൽകുക; പകുതിയും കാലും മാത്രം ഉപയോഗിക്കുക.', extension: '1/2 നും 1 നും ഇടയിൽ മൂന്ന് ഭിന്നസംഖ്യകൾ കണ്ടെത്തി അവ ക്രമത്തിലാണെന്ന് തെളിയിക്കുക.',
        week: [['സംഖ്യാരേഖയിൽ ഭിന്നസംഖ്യകൾ', 'അഭ്യാ. 7.1 ചോ. 1–3'], ['ശുദ്ധ, അശുദ്ധ ഭിന്നസംഖ്യകൾ', 'അഭ്യാ. 7.2 ചോ. 1–2'], ['തുല്യ ഭിന്നസംഖ്യകൾ', 'അഭ്യാ. 7.3 ചോ. 1–4'], ['ലഘുരൂപം', 'അഭ്യാ. 7.3 ചോ. 5–7'], ['ഭിന്നസംഖ്യകളുടെ താരതമ്യം', 'അഭ്യാ. 7.4 ചോ. 1–3'], ['പരിശീലനവും ക്വിസും', 'അധ്യായം ആവർത്തിക്കുക']]
      },
      cell: {
        subjectKey: 'science', cls: '8', subject: 'ശാസ്ത്രം', topic: 'കോശം: ഘടനയും ധർമങ്ങളും', period: 2, duration: 40,
        outcomes: ['കോശത്തിന്റെ പ്രധാന ഭാഗങ്ങളുടെ പേര് പറയാൻ കഴിയും', 'സസ്യകോശവും ജന്തുകോശവും താരതമ്യം ചെയ്യാൻ കഴിയും', 'കോശത്തെ ജീവന്റെ അടിസ്ഥാന ഘടകം എന്ന് വിളിക്കുന്നത് എന്തുകൊണ്ടെന്ന് വിശദീകരിക്കാൻ കഴിയും'],
        prev: 'ജീവികൾ ചെറിയ ഭാഗങ്ങളാൽ നിർമിതമാണെന്ന് കുട്ടികൾക്കറിയാം; കൈലെൻസ് ഉപയോഗിച്ചിട്ടുണ്ട്.',
        materials: ['ഉള്ളിത്തൊലിയും സ്ലൈഡും', 'മൈക്രോസ്കോപ്പ് അല്ലെങ്കിൽ കോശ ചാർട്ട്', 'നിറപ്പെൻസിലുകൾ'], comp: ['critical', 'comm'],
        intro: 'ഇഷ്ടികച്ചുമരിന്റെ ഫോട്ടോയും മൈക്രോസ്കോപ്പിലെ ഉള്ളിത്തൊലിയും കാണിക്കുക. ചോദിക്കുക: ജീവികൾ എന്തുകൊണ്ട് നിർമിതമാണ്?',
        steps: [
          ['ഉള്ളിത്തൊലി സ്ലൈഡോ ചാർട്ടോ കാണിക്കുക; കോശഭിത്തി, ന്യൂക്ലിയസ്, സൈറ്റോപ്ലാസം ചൂണ്ടിക്കാണിക്കുക.', 'കാണുന്നത് നിരീക്ഷിച്ച് വരയ്ക്കുന്നു; രണ്ട് ഭാഗങ്ങൾക്ക് പേരിടുന്നു.', 12],
          ['ബോർഡിൽ വെൻ ഡയഗ്രം ഉപയോഗിച്ച് സസ്യ, ജന്തു കോശങ്ങൾ താരതമ്യം ചെയ്യുക.', 'ജോടിയായി വെൻ ഡയഗ്രം പൂരിപ്പിക്കുന്നു: ഭിത്തി, ഹരിതകണം, ഫേനം, ന്യൂക്ലിയസ്.', 13],
          ['"നഗരം" താരതമ്യത്തോടെ കോശഭാഗങ്ങളും അവയുടെ ജോലികളും വിശദീകരിക്കുക.', 'ഭാഗ കാർഡുകൾ അവയുടെ ധർമങ്ങളുമായി യോജിപ്പിക്കുന്നു.', 10]
        ],
        recap: 'പെട്ടെന്നുള്ള ചോദ്യങ്ങൾ: കോശത്തെ നിയന്ത്രിക്കുന്ന ഭാഗം; സസ്യങ്ങളിൽ മാത്രമുള്ള ഭാഗം.',
        assess: 'അഞ്ച് ഭാഗങ്ങളോടെ സസ്യകോശം വരച്ച് പേരിടുക.', hw: 'NCERT അധ്യായം 8, ചോദ്യങ്ങൾ 1 മുതൽ 5 വരെ.',
        e5: { engage: ['ഇഷ്ടികച്ചുമരോ ഉള്ളിത്തൊലിയോ: ജീവികൾ എന്തുകൊണ്ട് നിർമിതം?', 5, 'ഫോട്ടോ, ഉള്ളിത്തൊലി'], explore: ['ഗ്രൂപ്പായി ഉള്ളിത്തൊലി സ്ലൈഡ് നിരീക്ഷിച്ച് വരയ്ക്കുക.', 12, 'മൈക്രോസ്കോപ്പ് അല്ലെങ്കിൽ ചാർട്ട്'], explain: ['കോശഭാഗങ്ങളും ജോലികളും; സസ്യകോശവും ജന്തുകോശവും.', 10, 'ബ്ലാക്ക്ബോർഡ്, കോശ ചാർട്ട്'], elaborate: ['കളിമണ്ണോ കടലാസോ കൊണ്ട് കോശ മോഡൽ ഉണ്ടാക്കുക.', 8, 'കളിമണ്ണ്, കടലാസ്'], evaluate: ['ഒഴിഞ്ഞ കോശ ചിത്രത്തിൽ പേരിടുക.', 5, 'വർക്ക്ഷീറ്റ്'] },
        support: 'പകർത്താൻ പേരിട്ട ചിത്രം നൽകുക; അഞ്ചിനു പകരം മൂന്ന് ഭാഗങ്ങൾ ചോദിക്കുക.', extension: 'ഇലക്കോശത്തിലുള്ളതും കവിൾക്കോശത്തിൽ ഇല്ലാത്തതും എന്ത്, എന്തുകൊണ്ട് എന്ന് കണ്ടെത്തുക.',
        week: [['കോശത്തിന്റെ കണ്ടുപിടിത്തം; മൈക്രോസ്കോപ്പ്', '8.1 വായിക്കുക'], ['കോശത്തിന്റെ ആകൃതിയും വലുപ്പവും', 'മൂന്ന് കോശങ്ങൾ വരയ്ക്കുക'], ['കോശഭാഗങ്ങൾ', 'ചോ. 1–3'], ['സസ്യകോശവും ജന്തുകോശവും', 'വെൻ ഡയഗ്രം'], ['ഉള്ളിത്തൊലി പ്രായോഗികം', 'ലാബ് റെക്കോർഡ്'], ['ആവർത്തനവും ക്വിസും', 'അധ്യായം ആവർത്തിക്കുക']]
      },
      poem: {
        subjectKey: 'english', cls: '5', subject: 'ഇംഗ്ലീഷ്', topic: 'കവിത: My Shadow', period: 4, duration: 35,
        outcomes: ['കവിത താളത്തോടെ ഉറക്കെ വായിക്കാൻ കഴിയും', 'പ്രാസമുള്ള വാക്കുകൾ കണ്ടെത്തി നിഴൽ എന്തു ചെയ്യുന്നു എന്ന് പറയാൻ കഴിയും', 'സ്വന്തം നിഴലിനെക്കുറിച്ച് നാല് വരി എഴുതാൻ കഴിയും'],
        prev: 'കുട്ടികൾ വെയിലിൽ സ്വന്തം നിഴൽ കണ്ടിട്ടുണ്ട്; sun, fun പോലുള്ള പ്രാസവാക്കുകൾ അറിയാം.',
        materials: ['പാഠപുസ്തകം', 'ടോർച്ച്', 'കവിതയുടെ ചാർട്ട്'], comp: ['creativity', 'comm'],
        intro: 'മങ്ങിയ മൂലയിൽ ടോർച്ച് തെളിച്ച് കൈനിഴലുകൾ ഉണ്ടാക്കുക. ചോദിക്കുക: നിങ്ങളുടെ നിഴൽ എപ്പോഴാണ് ഉയരം വയ്ക്കുന്നത്?',
        steps: [
          ['ആംഗ്യങ്ങളോടെ കവിത രണ്ടുതവണ ഉറക്കെ വായിക്കുക; കടുപ്പമുള്ള വാക്കുകൾ വിശദീകരിക്കുക.', 'കേൾക്കുന്നു, പിന്നെ ഒരുമിച്ച് വായിച്ച് വരികൾ അഭിനയിക്കുന്നു.', 12],
          ['ചോദിക്കുക: കുട്ടി ചെയ്യുന്നതിൽ നിഴൽ എന്തു ചെയ്യുന്നു? പ്രാസജോടികൾ കണ്ടെത്തുക.', 'ജോടിയായി പ്രാസവാക്കുകൾക്ക് അടിവരയിടുന്നു; ഓരോരുത്തരും ഒരു ജോടി പറയുന്നു.', 13],
          ['ബോർഡിൽ എന്റെ നിഴലിനെക്കുറിച്ച് നാല് മാതൃകാ വരികൾ എഴുതുക.', 'സ്വന്തം നിഴലിനെക്കുറിച്ച് നാല് വരി എഴുതി കൂട്ടുകാരന് വായിച്ചുകൊടുക്കുന്നു.', 10]
        ],
        recap: 'ക്ലാസ് ഒന്നിച്ച് ആദ്യ ഖണ്ഡം ചൊല്ലുന്നു; ഒരു ഗ്രൂപ്പ് മൂകാഭിനയം ചെയ്യുന്നു.',
        assess: 'വാചികം: കവിതയിൽ മൂന്ന് ചോദ്യങ്ങൾ; എഴുതിയ നാല് വരികൾ പരിശോധിക്കുക.', hw: 'ആദ്യ ഖണ്ഡം കാണാതെ പഠിക്കുക; ഉച്ചയ്ക്കും വൈകിട്ട് 5 മണിക്കും നിഴൽ വരയ്ക്കുക.',
        e5: { engage: ['ടോർച്ചുകൊണ്ട് കൈനിഴലുകൾ: നിഴൽ എങ്ങനെ ഉണ്ടാകുന്നു?', 5, 'ടോർച്ച്'], explore: ['ജോടിയായി കവിത വായിച്ച് അറിയാത്ത വാക്കുകൾ അടയാളപ്പെടുത്തുക.', 8, 'പാഠപുസ്തകം'], explain: ['ഓരോ ഖണ്ഡത്തിന്റെയും അർഥം; പ്രാസവാക്കുകൾ; താളം.', 10, 'കവിതയുടെ ചാർട്ട്'], elaborate: ['സ്വന്തം നിഴലിനെക്കുറിച്ച് നാല് വരി എഴുതുക.', 8, 'നോട്ടുബുക്ക്'], evaluate: ['ഒരു ഖണ്ഡം ചൊല്ലുക; രണ്ട് ചോദ്യങ്ങൾക്ക് ഉത്തരം പറയുക.', 4, 'കവിതയുടെ ചാർട്ട്'] },
        support: 'കൂട്ടുകാരനൊപ്പം വായിക്കട്ടെ; നാല് വരിക്ക് വാക്ക് ബാങ്ക് നൽകുക.', extension: 'ഉച്ചയ്ക്ക് നിഴൽ ചെറുതും വൈകിട്ട് നീണ്ടതും ആകുന്നത് എന്തുകൊണ്ടെന്ന് കണ്ടെത്തുക.',
        week: [['കവിത: വായിച്ച് ആസ്വദിക്കുക', 'വീട്ടിൽ ഉറക്കെ വായിക്കുക'], ['പുതിയ വാക്കുകളും പ്രാസവും', 'അഞ്ച് പ്രാസജോടികൾ എഴുതുക'], ['ഗ്രാഹ്യ ചോദ്യങ്ങൾ', 'ചോ. 1–4'], ['എഴുത്ത്: എന്റെ നിഴൽ', 'നാല് വരി പൂർത്തിയാക്കുക'], ['വ്യാകരണം: കവിതയിലെ നാമങ്ങൾ', 'വർക്ക്ഷീറ്റ്'], ['ചൊല്ലലും രസവും', 'ഖണ്ഡം 1 കാണാതെ പഠിക്കുക']]
      },
      medieval: {
        subjectKey: 'social', cls: '7', subject: 'സാമൂഹ്യശാസ്ത്രം', topic: 'ആയിരം വർഷത്തെ മാറ്റങ്ങൾ തേടി', period: 5, duration: 40,
        outcomes: ['"ഹിന്ദുസ്ഥാൻ" എന്ന വാക്കിന്റെ അർഥം കാലക്രമേണ എങ്ങനെ മാറി എന്ന് വിശദീകരിക്കാൻ കഴിയും', 'ചരിത്ര ഭൂപടം വായിച്ച് ആധുനിക ഭൂപടവുമായി താരതമ്യം ചെയ്യാൻ കഴിയും', 'മധ്യകാലത്തിന് ചരിത്രകാരന്മാർ ഉപയോഗിക്കുന്ന സ്രോതസ്സുകൾ പട്ടികപ്പെടുത്താൻ കഴിയും'],
        prev: 'കുട്ടികൾക്ക് ആറാം ക്ലാസിലെ പ്രാചീന കാലം അറിയാം; ഇന്ത്യയുടെ ഭൂപടം വായിക്കാനാകും.',
        materials: ['രണ്ട് ഭൂപടങ്ങൾ: അൽ-ഇദ്‌രീസി (1154), ഒരു ആധുനിക ഭൂപടം', 'പാഠപുസ്തകം', 'അറ്റ്ലസ്'], comp: ['critical', 'comm'],
        intro: 'അൽ-ഇദ്‌രീസിയുടെ 1154 ഭൂപടം തലകീഴായി കാണിക്കുക. ചോദിക്കുക: ദക്ഷിണേന്ത്യ കണ്ടെത്താനാകുമോ?',
        steps: [
          ['രണ്ട് ഭൂപടങ്ങൾ താരതമ്യം ചെയ്യുക: പേരുകൾ, ആകൃതികൾ, ഇല്ലാത്തവ.', 'ജോടിയായി മൂന്ന് വ്യത്യാസങ്ങൾ കണ്ടെത്തി ഭൂപടങ്ങൾ മാറുന്നത് എന്തുകൊണ്ടെന്ന് പറയുന്നു.', 12],
          ['വാക്കുകൾ എങ്ങനെ മാറുന്നു എന്ന് വിശദീകരിക്കുക: മിൻഹാജ്-ഇ-സിറാജ്, ബാബർ, അമീർ ഖുസ്രു എന്നിവരുടെ "ഹിന്ദുസ്ഥാൻ".', 'നോട്ടുബുക്കിൽ മൂന്ന് അർഥങ്ങളുടെ കാലരേഖ ഉണ്ടാക്കുന്നു.', 13],
          ['സ്രോതസ്സുകൾ: കൈയെഴുത്തുപ്രതികൾ, നാണയങ്ങൾ, ശിലാലിഖിതങ്ങൾ, കെട്ടിടങ്ങൾ; പകർത്തൽ പാഠങ്ങളെ മാറ്റിയത് എന്തുകൊണ്ട്.', 'സ്രോതസ് കാർഡുകൾ ലിഖിതം, ഭൗതികം എന്ന് തരംതിരിക്കുന്നു.', 10]
        ],
        recap: 'പെട്ടെന്നുള്ള ക്വിസ്: പഞ്ചാബ്, ഹരിയാന, ഗംഗ-യമുന മേഖലയ്ക്ക് "ഹിന്ദുസ്ഥാൻ" എന്ന് ഉപയോഗിച്ചത് ആര്?',
        assess: 'ഒരു സ്ഥലപ്പേരിന്റെ അർഥം മാറാൻ രണ്ട് കാരണങ്ങൾ എഴുതുക.', hw: 'NCERT അധ്യായം 1, "Let\'s recall" ചോദ്യങ്ങൾ 1 മുതൽ 3 വരെ.',
        e5: { engage: ['1154-ലെ ഒരു തലകീഴായ ഭൂപടം: എന്താണ് കാണുന്നത്?', 5, 'ഭൂപട പ്രിന്റ്'], explore: ['ഗ്രൂപ്പായി പഴയതും പുതിയതുമായ ഭൂപടങ്ങൾ താരതമ്യം ചെയ്യുക.', 10, 'രണ്ട് ഭൂപടങ്ങൾ'], explain: ['മാറുന്ന പേരുകളും അർഥങ്ങളും; ഈ കാലത്തെ സ്രോതസ്സുകൾ.', 12, 'പാഠപുസ്തകം, ബ്ലാക്ക്ബോർഡ്'], elaborate: ['"ഹിന്ദുസ്ഥാൻ" എന്ന വാക്കിന്റെ കാലരേഖ വരയ്ക്കുക.', 8, 'നോട്ടുബുക്ക്'], evaluate: ['സ്ഥലപ്പേരുകളുടെ അർഥം മാറാൻ രണ്ട് കാരണങ്ങൾ.', 5, 'കടലാസ് സ്ലിപ്പുകൾ'] },
        support: 'പേരുകൾ അടയാളപ്പെടുത്തിയ ഭൂപടം നൽകുക; ഒരു വ്യത്യാസം ചോദിക്കുക.', extension: '500 വർഷം മുമ്പ് നിങ്ങളുടെ നാടിനെയോ സംസ്ഥാനത്തെയോ എന്ത് വിളിച്ചിരുന്നു എന്ന് കണ്ടെത്തുക.',
        week: [['പഴയ ഭൂപടങ്ങളും പുതിയ ഭൂപടങ്ങളും', '1.1 വായിക്കുക'], ['പുതിയതും പഴയതുമായ വാക്കുകൾ: ഹിന്ദുസ്ഥാൻ', 'കാലരേഖ'], ['ചരിത്രകാരന്മാരും സ്രോതസ്സുകളും', 'ചോ. 1–3'], ['പുതിയ സാമൂഹിക, രാഷ്ട്രീയ ഗ്രൂപ്പുകൾ', '1.3 വായിക്കുക'], ['പ്രദേശവും സാമ്രാജ്യവും; പഴയതും പുതിയതുമായ മതങ്ങൾ', 'ചെറുകുറിപ്പുകൾ'], ['ആവർത്തനവും ഭൂപട പ്രവർത്തനവും', 'അഞ്ച് സ്ഥലങ്ങൾ അടയാളപ്പെടുത്തുക']]
      },
      story: {
        subjectKey: 'language', cls: '4', subject: 'മലയാളം', topic: 'കഥ: ദാഹിച്ച കാക്ക', period: 1, duration: 35,
        outcomes: ['കഥ ശരിയായ ക്രമത്തിൽ വീണ്ടും പറയാൻ കഴിയും', 'അഞ്ച് പുതിയ വാക്കുകളുടെ അർഥം പറയാൻ കഴിയും', 'കാക്ക എന്തു ചെയ്തു, അത് എന്തുകൊണ്ട് ഫലിച്ചു എന്ന് പറയാൻ കഴിയും'],
        prev: 'കുട്ടികൾക്ക് ചെറിയ വാക്യങ്ങൾ വായിക്കാനാകും; വീട്ടിൽ നാടോടിക്കഥകൾ കേട്ടിട്ടുണ്ട്.',
        materials: ['കഥയുടെ ചിത്ര കാർഡുകൾ', 'ഒരു കുടം, വെള്ളം, കല്ലുകൾ', 'പാഠപുസ്തകം'], comp: ['critical', 'creativity', 'comm'],
        intro: 'കുറച്ച് വെള്ളമുള്ള കുടവും ഒരു കല്ലും കാണിക്കുക. ചോദിക്കുക: ഒരു പക്ഷിക്ക് ഈ വെള്ളം എങ്ങനെ കുടിക്കാനാകും?',
        steps: [
          ['ചിത്ര കാർഡുകളും ശബ്ദമാറ്റങ്ങളും ഉപയോഗിച്ച് കഥ പറയുക.', 'കേൾക്കുന്നു; രണ്ടിടത്ത് അടുത്തത് എന്ത് സംഭവിക്കും എന്ന് ഊഹിക്കുന്നു.', 10],
          ['കഥ ഉറക്കെ വായിക്കുക; ആംഗ്യങ്ങളോടെ പുതിയ വാക്കുകൾ വിശദീകരിക്കുക.', 'ജോടിയായി വായിക്കുന്നു; പുതിയ വാക്കുകൾക്ക് അടിവരയിടുന്നു; രണ്ടെണ്ണം കൊണ്ട് വാക്യം ഉണ്ടാക്കുന്നു.', 15],
          ['കുടം ഉപയോഗിച്ച് കല്ലു പരീക്ഷണം ചെയ്യുക.', 'ഓരോ കല്ലായി ഇട്ട് വെള്ളം ഉയരുന്നത് കണ്ട് എന്തുകൊണ്ടെന്ന് പറയുന്നു.', 10]
        ],
        recap: 'ബോർഡിൽ ചിത്ര കാർഡുകൾ ക്രമത്തിൽ അടുക്കുക.',
        assess: 'കൂട്ടുകാരനോട് അഞ്ച് വാക്യങ്ങളിൽ കഥ വീണ്ടും പറയുക.', hw: 'കാക്കയും കുടവും വരയ്ക്കുക; മൂന്ന് വാക്യങ്ങൾ എഴുതുക.',
        e5: { engage: ['കുറച്ച് വെള്ളമുള്ള കുടം: പക്ഷി എങ്ങനെ കുടിക്കും?', 5, 'കുടം, വെള്ളം'], explore: ['ഗ്രൂപ്പായി കല്ലുകൊണ്ട് പരീക്ഷിക്കുക: വെള്ളം ഉയരുന്നുണ്ടോ?', 8, 'കുടം, കല്ലുകൾ'], explain: ['കഥ വായിക്കുക; പുതിയ വാക്കുകളും കഥയുടെ ഗുണപാഠവും.', 10, 'പാഠപുസ്തകം, ചിത്ര കാർഡുകൾ'], elaborate: ['മൂന്നംഗ ഗ്രൂപ്പിൽ കഥ അഭിനയിക്കുക.', 8, 'ചിത്ര കാർഡുകൾ'], evaluate: ['അഞ്ച് വാക്യങ്ങളിൽ കഥ വീണ്ടും പറയുക.', 4, 'ചിത്ര കാർഡുകൾ'] },
        support: 'ചിത്ര കാർഡുകൾ ക്രമത്തിൽ നൽകുക; അവ ഉപയോഗിച്ച് പറയട്ടെ.', extension: 'അവസാനം മാറ്റുക: കല്ലുകൾ ഇല്ലായിരുന്നെങ്കിൽ എന്ത് സംഭവിക്കുമായിരുന്നു?',
        week: [['കഥ കേൾക്കുക', 'വീട്ടിൽ പറയുക'], ['വായിക്കുക; പുതിയ വാക്കുകൾ', 'അഞ്ച് വാക്കുകൾ, അഞ്ച് വാക്യങ്ങൾ'], ['കല്ലു പരീക്ഷണവും അത് ഫലിക്കുന്നത് എന്തുകൊണ്ടും', 'വരയ്ക്കുക'], ['കഥ അഭിനയിക്കുക', 'സ്വന്തം സംഭാഷണങ്ങൾ പരിശീലിക്കുക'], ['സ്വന്തം അവസാനം എഴുതുക', 'അവസാനം പൂർത്തിയാക്കുക'], ['ആവർത്തനവും ഉറക്കെ വായനയും', 'പേജ് 1 ഉറക്കെ വായിക്കുക']]
      },
      ai: {
        subjectKey: 'ai', cls: '9', subject: 'നിർമിതബുദ്ധി', topic: 'AI എന്താണ്?', period: 6, duration: 40,
        outcomes: ['നിശ്ചിത നിയമങ്ങൾ പാലിക്കുന്ന യന്ത്രവും ഡേറ്റയിൽ നിന്ന് പഠിക്കുന്ന യന്ത്രവും തമ്മിലുള്ള വ്യത്യാസം പറയാൻ കഴിയും', 'നിത്യജീവിതത്തിലെ AI-യുടെ അഞ്ച് ഉപയോഗങ്ങൾ പട്ടികപ്പെടുത്താൻ കഴിയും', 'AI-യുടെ ഒരു ഗുണവും ഒരു അപകടവും ചർച്ച ചെയ്യാൻ കഴിയും'],
        prev: 'കുട്ടികൾ സ്മാർട്ട്ഫോൺ, മാപ്പ്, വോയ്സ് അസിസ്റ്റന്റ്, വീഡിയോ ആപ്പുകൾ ഉപയോഗിക്കുന്നു.',
        materials: ['പ്രൊജക്ടർ അല്ലെങ്കിൽ ഫോൺ', 'നിത്യജോലികളുടെ കാർഡുകൾ', 'ചാർട്ട് പേപ്പർ'], comp: ['critical', 'digital', 'comm'],
        intro: 'ചോദിക്കുക: നിങ്ങളുടെ ഫോൺ മുഖം കണ്ട് എങ്ങനെ തുറക്കുന്നു? വീഡിയോ ആപ്പിന് നിങ്ങൾക്ക് ഇഷ്ടമുള്ളത് എങ്ങനെ അറിയാം?',
        steps: [
          ['ലളിതമായി AI നിർവചിക്കുക: ഡേറ്റയിൽ നിന്ന് പാറ്റേണുകൾ പഠിച്ച് തീരുമാനങ്ങൾ എടുക്കുന്ന യന്ത്രങ്ങൾ.', 'സ്വന്തം ഫോണിൽ നിന്ന് ഓരോരുത്തരും രണ്ട് ഉദാഹരണങ്ങൾ നൽകുന്നു.', 10],
          ['ജോലികൾ തരംതിരിക്കുക: കാൽക്കുലേറ്റർ (നിശ്ചിത നിയമങ്ങൾ), സ്പാം ഫിൽറ്റർ (പഠിക്കുന്നത്). ഡേറ്റ, പാറ്റേൺ, പ്രവചനം വിശദീകരിക്കുക.', 'ഗ്രൂപ്പായി ജോലി കാർഡുകൾ "നിശ്ചിത നിയമങ്ങൾ", "ഡേറ്റയിൽ നിന്ന് പഠിക്കുന്നു" എന്ന് തരംതിരിക്കുന്നു.', 15],
          ['ഗുണങ്ങളും അപകടങ്ങളും ചർച്ച ചെയ്യുക: കൃഷി, ആരോഗ്യ രംഗത്ത് സഹായം; പക്ഷപാതം, സ്വകാര്യത, വ്യാജ വീഡിയോകൾ.', 'ഓരോ ഗ്രൂപ്പും ചാർട്ട് പേപ്പറിൽ ഒരു ഗുണവും ഒരു അപകടവും എഴുതുന്നു.', 10]
        ],
        recap: 'മൂന്ന് പ്രസ്താവനകൾ: AI ആണോ അല്ലയോ? തള്ളവിരൽ മുകളിലേക്കോ താഴേക്കോ.',
        assess: 'ഈ ആഴ്ച കണ്ട AI-യുടെ അഞ്ച് ഉപയോഗങ്ങളും ഒരു അപകടവും എഴുതുക.', hw: 'വീട്ടിലൊരാളോട് ഏത് ആപ്പിനെയാണ് ഏറ്റവും വിശ്വസിക്കുന്നത്, എന്തുകൊണ്ട് എന്ന് ചോദിക്കുക; അത് AI ഉപയോഗിക്കുന്നുണ്ടോ എന്ന് കുറിക്കുക.',
        e5: { engage: ['നിങ്ങളുടെ ഫോൺ മുഖം കണ്ട് എങ്ങനെ തുറക്കുന്നു?', 5, 'ഫോൺ'], explore: ['ജോലി കാർഡുകൾ തരംതിരിക്കുക: നിശ്ചിത നിയമങ്ങളോ പഠനമോ?', 10, 'ജോലി കാർഡുകൾ'], explain: ['AI എന്താണ്: ഡേറ്റ, പാറ്റേണുകൾ, പ്രവചനങ്ങൾ; എവിടെ ഉപയോഗിക്കുന്നു.', 12, 'പ്രൊജക്ടർ'], elaborate: ['നിങ്ങളുടെ സ്കൂളിന് ലളിതമായ AI സഹായി കടലാസിൽ രൂപകൽപന ചെയ്യുക.', 8, 'ചാർട്ട് പേപ്പർ'], evaluate: ['AI-യുടെ അഞ്ച് ഉപയോഗങ്ങളും ഒരു അപകടവും.', 5, 'നോട്ടുബുക്ക്'] },
        support: 'ഉദാഹരണങ്ങൾ തയ്യാറായി നൽകുക; കുട്ടികൾ തരംതിരിച്ചാൽ മതി.', extension: 'AI തെറ്റായ തീരുമാനം എടുത്ത ഒരു ഉദാഹരണം കണ്ടെത്തി എന്തുകൊണ്ടെന്ന് വിശദീകരിക്കുക.',
        week: [['ബുദ്ധി എന്താണ്? മനുഷ്യനും യന്ത്രവും', 'ഇന്ന് ചെയ്ത അഞ്ച് ബുദ്ധിപരമായ കാര്യങ്ങൾ പട്ടികപ്പെടുത്തുക'], ['AI എന്താണ്? നിയമങ്ങളോ പഠനമോ', 'പത്ത് ജോലികൾ തരംതിരിക്കുക'], ['നമുക്കു ചുറ്റും AI', 'AI-യുടെ അഞ്ച് ഉപയോഗങ്ങൾ'], ['ഡേറ്റ, പാറ്റേണുകൾ, പ്രവചനങ്ങൾ', 'പാറ്റേൺ വർക്ക്ഷീറ്റ്'], ['AI-യുടെ ഗുണങ്ങളും അപകടങ്ങളും', 'ഒരു പേജ് കുറിപ്പ്'], ['പ്രോജക്ട്: നമ്മുടെ സ്കൂളിന് ഒരു AI സഹായി', 'പോസ്റ്റർ']]
      }
    }
  },
  ur: {
    bloom: {
      remember: ['تعریف کرنا', 'فہرست بنانا', 'نام بتانا', 'یاد کر کے بتانا', 'نام لکھنا', 'بیان کرنا'],
      understand: ['وضاحت کرنا', 'بیان کرنا', 'خلاصہ کرنا', 'درجہ بندی کرنا', 'موازنہ کرنا', 'مثالیں دینا'],
      apply: ['استعمال کرنا', 'حل کرنا', 'حساب لگانا', 'کر کے دکھانا', 'دکھانا', 'ناپنا'],
      analyse: ['تجزیہ کرنا', 'فرق بتانا', 'نمونہ تلاش کرنا', 'جائزہ لینا', 'چھانٹنا', 'نتیجہ نکالنا'],
      evaluate: ['رائے دینا', 'جواز پیش کرنا', 'فیصلہ کرنا', 'جانچنا', 'حق میں دلیل دینا', 'اندازہ لگانا'],
      create: ['ڈیزائن کرنا', 'بنانا', 'منصوبہ بنانا', 'تخلیق کرنا', 'تعمیر کرنا', 'ایجاد کرنا']
    },
    materials: ['بلیک بورڈ اور چاک', 'نصابی کتاب', 'چارٹ یا پوسٹر', 'فلیش کارڈ', 'ورک شیٹ', 'پروجیکٹر یا اسمارٹ بورڈ', 'اصلی چیزیں', 'کاپی اور پنسل'],
    ideas: {
      maths: ['کاغذ سے بنائیں: موڑ کر یا کاٹ کر شکلوں سے تصور دکھائیں', 'ایک مشکل سوال پر سوچو-جوڑی میں بات کرو-سب کو بتاؤ', 'ریاضی ریلے: گروپ کا ہر رکن بورڈ پر ایک مرحلہ حل کرے', 'پہلے اندازہ لگائیں، پھر ناپ کر ملائیں', 'یہ ریاضی بازار یا باورچی خانے میں تلاش کریں اور ایک مثال لائیں'],
      science: ['چھوٹے مظاہرے کے ساتھ اندازہ-مشاہدہ-وضاحت', 'اصلی چیز دیکھ کر تصویر بنائیں اور نام لکھیں', 'گروپ تجربہ، سب کے لیے ایک نتائج کی جدول', 'کارڈ گروپوں میں چھانٹیں اور اصول سمجھائیں', 'ہر گروپ سے ایک منٹ کا "سائنس رپورٹر"'],
      english: ['جوڑی میں بلند آواز سے پڑھیں اور کردار بدلیں', 'چار کے گروپ میں منظر کی اداکاری کریں', 'لفظ کی تلاش: پانچ نئے لفظ ڈھونڈ کر معنی کا اندازہ لگائیں', 'اپنے لفظوں میں تین سطریں لکھیں', 'ہاٹ سیٹ: ایک طالب علم کردار بن کر جواب دے'],
      social: ['فرش پر چاک سے ٹائم لائن', 'نقشے کا کام: پانچ جگہیں نشان زد کریں', 'کردار ادائی: اس زمانے کا ایک دن', 'تب اور اب: T-چارٹ میں موازنہ', 'مقامی ربط: گھر کے کسی بزرگ سے پوچھ کر بتائیں'],
      language: ['کہانی کا دائرہ: ہر طالب علم ایک سطر جوڑے', 'تصویر پر بات: تین جملوں میں بیان کریں', 'ہم قافیہ لفظ ڈھونڈ کر ایک نظم بنائیں', 'جوڑی میں املا؛ ایک دوسرے کی جانچ کریں', 'ہاتھ کی پتلیوں سے کہانی دوبارہ سنائیں'],
      ai: ['AI پہچانو: AI استعمال کرنے والی پانچ ایپس کی فہرست', 'انسان یا مشین: کاموں کو چھانٹیں', 'نمونے کا کھیل: مثالوں سے اصول کا اندازہ لگائیں', 'کاغذ پر سادہ چیٹ بوٹ اسکرپٹ لکھیں', 'مباحثہ: کیا AI ہمیشہ درست ہوتا ہے؟'],
      general: ['سوچو-جوڑی-بانٹو: ایک منٹ اکیلے، دو منٹ جوڑی میں', 'ایگزٹ سلپ: ایک بات سیکھی، ایک سوال ہے', 'گیلری واک: گروپ اپنا کام دیوار پر لگائیں', 'سلیٹوں کے ساتھ ٹیم کوئز', 'ہم جماعت کو سکھانا: اپنے ساتھی کو سمجھائیں']
    },
    samples: {
      fractions: {
        subjectKey: 'maths', cls: '6', subject: 'ریاضی', topic: 'کسور: مساوی کسور', period: 3, duration: 40,
        outcomes: ['مساوی کسر کیا ہے، سمجھا سکیں گے', 'ضرب یا تقسیم سے مساوی کسور بنا سکیں گے', 'جانچ سکیں گے کہ دو کسور مساوی ہیں یا نہیں'],
        prev: 'طلبہ 1/2 اور 3/4 جیسے کسور پڑھ لکھ سکتے ہیں اور شکل میں رنگ بھر سکتے ہیں۔',
        materials: ['کاغذ کی پٹیاں', 'بلیک بورڈ اور چاک', 'کسور کا چارٹ'], comp: ['critical', 'collab'],
        intro: '2 برابر ٹکڑوں میں کٹی روٹی اور 4 ٹکڑوں میں کٹی دوسری روٹی دکھائیں۔ پوچھیں: کیا 1/2 اور 2/4 برابر ہیں؟',
        steps: [
          ['کاغذ کی پٹی کو آدھا، پھر چوتھائی میں موڑیں؛ بورڈ پر 1/2 = 2/4 دکھائیں۔', 'اپنی پٹیاں موڑیں، 1/2 اور 2/4 میں رنگ بھریں اور جوڑی میں موازنہ کریں۔', 10],
          ['اصول سمجھائیں: شمار کنندہ اور نسب نما کو ایک ہی عدد سے ضرب یا تقسیم دیں۔ دو مثالیں حل کریں۔', 'کاپی میں 2/3 کے تین مساوی کسور بنائیں۔', 15],
          ['کسور کے جوڑے دیں؛ پوچھیں کون سے مساوی ہیں اور کیسے پتا چلا۔', 'ترچھی ضرب سے جانچیں؛ وجہ کے ساتھ ہاں یا نہیں کہیں۔', 10]
        ],
        recap: 'بورڈ پر تین فوری سوال: مساوی ہیں یا نہیں؟ طلبہ انگوٹھا اوپر یا نیچے کر کے بتائیں۔',
        assess: 'ایگزٹ سلپ: 3/5 کے دو مساوی کسور لکھو۔', hw: 'NCERT مشق 7.3، سوال 1 تا 4۔',
        e5: { engage: ['روٹی کی پہیلی: کیا 1/2 اور 2/4 برابر ہیں؟ ووٹ دو اور وجہ بتاؤ۔', 5, 'کاغذ کی دو روٹیاں'], explore: ['جوڑی میں پٹیاں موڑ کر 1/2 کے برابر کسور تلاش کرو۔', 10, 'کاغذ کی پٹیاں'], explain: ['اصول: شمار کنندہ اور نسب نما کو ایک ہی عدد سے ضرب یا تقسیم دو۔', 10, 'بلیک بورڈ'], elaborate: ['کسور کے چارٹ پر مساوی کسور ڈھونڈو اور نمونہ بیان کرو۔', 10, 'کسور کا چارٹ'], evaluate: ['ایگزٹ سلپ: 3/5 کے دو مساوی کسور۔', 5, 'کاغذ کی پرچیاں'] },
        support: 'تیار کسر پٹیاں دیں؛ صرف آدھے اور چوتھائی پر کام کریں۔', extension: '1/2 اور 1 کے درمیان تین کسور تلاش کرو اور ثابت کرو کہ وہ ترتیب میں ہیں۔',
        week: [['عددی لکیر پر کسور', 'مشق 7.1 س 1–3'], ['واجب اور غیر واجب کسور', 'مشق 7.2 س 1–2'], ['مساوی کسور', 'مشق 7.3 س 1–4'], ['سادہ ترین شکل', 'مشق 7.3 س 5–7'], ['کسور کا موازنہ', 'مشق 7.4 س 1–3'], ['مشق اور کوئز', 'باب کی دہرائی']]
      },
      cell: {
        subjectKey: 'science', cls: '8', subject: 'سائنس', topic: 'خلیہ: ساخت اور افعال', period: 2, duration: 40,
        outcomes: ['خلیے کے اہم حصوں کے نام بتا سکیں گے', 'نباتاتی خلیے اور حیوانی خلیے کا موازنہ کر سکیں گے', 'سمجھا سکیں گے کہ خلیے کو زندگی کی بنیادی اکائی کیوں کہتے ہیں'],
        prev: 'طلبہ جانتے ہیں کہ جاندار چھوٹے حصوں سے بنے ہیں اور انہوں نے ہینڈ لینس استعمال کیا ہے۔',
        materials: ['پیاز کی جھلی اور سلائڈ', 'خوردبین یا خلیے کا چارٹ', 'رنگین پنسلیں'], comp: ['critical', 'comm'],
        intro: 'اینٹوں کی دیوار کی تصویر اور خوردبین کے نیچے پیاز کی جھلی دکھائیں۔ پوچھیں: جاندار کس چیز سے بنے ہیں؟',
        steps: [
          ['پیاز کی جھلی کی سلائڈ یا چارٹ دکھائیں؛ خلوی دیوار، مرکزہ اور سائٹوپلازم کی نشاندہی کریں۔', 'جو نظر آئے اس کا مشاہدہ کر کے بنائیں؛ دو حصوں کے نام لکھیں۔', 12],
          ['بورڈ پر وین ڈایاگرام سے نباتاتی اور حیوانی خلیے کا موازنہ کریں۔', 'جوڑی میں وین ڈایاگرام بھریں: دیوار، کلوروپلاسٹ، ویکیول، مرکزہ۔', 13],
          ['"شہر" کی مثال سے خلیے کے حصے اور ان کے کام سمجھائیں۔', 'حصوں کے کارڈ ان کے افعال سے ملائیں۔', 10]
        ],
        recap: 'فوری سوال: خلیے کو کنٹرول کرنے والا حصہ؛ صرف پودوں میں پایا جانے والا حصہ۔',
        assess: 'پانچ حصوں کے ساتھ نباتاتی خلیہ بنا کر نام لکھو۔', hw: 'NCERT باب 8، سوال 1 تا 5۔',
        e5: { engage: ['اینٹوں کی دیوار یا پیاز کی جھلی: جاندار کس سے بنے ہیں؟', 5, 'تصویر، پیاز کی جھلی'], explore: ['گروپ میں پیاز کی جھلی کی سلائڈ دیکھو اور بناؤ۔', 12, 'خوردبین یا چارٹ'], explain: ['خلیے کے حصے اور ان کے کام؛ نباتاتی خلیہ اور حیوانی خلیہ۔', 10, 'بلیک بورڈ، خلیے کا چارٹ'], elaborate: ['مٹی یا کاغذ سے خلیے کا ماڈل بناؤ۔', 8, 'مٹی، کاغذ'], evaluate: ['خالی خلیے کے خاکے پر نام لکھو۔', 5, 'ورک شیٹ'] },
        support: 'نقل کرنے کے لیے ناموں والا خاکہ دیں؛ پانچ کی جگہ تین حصے پوچھیں۔', extension: 'پتے کے خلیے میں کیا ہے جو گال کے خلیے میں نہیں، اور کیوں، معلوم کرو۔',
        week: [['خلیے کی دریافت؛ خوردبین', '8.1 پڑھو'], ['خلیے کی شکل اور جسامت', 'تین خلیے بناؤ'], ['خلیے کے حصے', 'س 1–3'], ['نباتاتی خلیہ اور حیوانی خلیہ', 'وین ڈایاگرام'], ['پیاز کی جھلی کا عملی', 'لیب ریکارڈ'], ['دہرائی اور کوئز', 'باب کی دہرائی']]
      },
      poem: {
        subjectKey: 'english', cls: '5', subject: 'انگریزی', topic: 'نظم: My Shadow', period: 4, duration: 35,
        outcomes: ['نظم کو لَے کے ساتھ بلند آواز سے پڑھ سکیں گے', 'ہم قافیہ لفظ ڈھونڈ کر بتا سکیں گے کہ سایہ کیا کرتا ہے', 'اپنے سائے کے بارے میں چار سطریں لکھ سکیں گے'],
        prev: 'طلبہ نے دھوپ میں اپنا سایہ دیکھا ہے اور sun-fun جیسے ہم قافیہ لفظ جانتے ہیں۔',
        materials: ['نصابی کتاب', 'ٹارچ', 'نظم کا چارٹ'], comp: ['creativity', 'comm'],
        intro: 'اندھیرے کونے میں ٹارچ جلا کر ہاتھوں کے سائے بنائیں۔ پوچھیں: تمہارا سایہ کب لمبا ہوتا ہے؟',
        steps: [
          ['اداکاری کے ساتھ نظم دو بار بلند آواز سے پڑھیں؛ مشکل لفظ سمجھائیں۔', 'سنیں، پھر مل کر پڑھیں اور سطروں کی اداکاری کریں۔', 12],
          ['پوچھیں: سایہ وہ کیا کرتا ہے جو بچہ کرتا ہے؟ ہم قافیہ جوڑے ڈھونڈو۔', 'جوڑی میں ہم قافیہ لفظوں کے نیچے لکیر لگائیں؛ ہر ایک ایک جوڑا بتائے۔', 13],
          ['بورڈ پر میرے سائے کے بارے میں چار نمونہ سطریں لکھیں۔', 'اپنے سائے کے بارے میں چار سطریں لکھیں اور ساتھی کو پڑھ کر سنائیں۔', 10]
        ],
        recap: 'پوری کلاس مل کر پہلا بند سنائے؛ ایک گروپ اس کی خاموش اداکاری کرے۔',
        assess: 'زبانی: نظم پر تین سوال؛ لکھی ہوئی چار سطریں جانچیں۔', hw: 'پہلا بند زبانی یاد کرو؛ دوپہر اور شام 5 بجے اپنا سایہ بناؤ۔',
        e5: { engage: ['ٹارچ سے ہاتھوں کے سائے: سایہ کیسے بنتا ہے؟', 5, 'ٹارچ'], explore: ['جوڑی میں نظم پڑھو اور انجان لفظوں پر نشان لگاؤ۔', 8, 'نصابی کتاب'], explain: ['ہر بند کا مطلب؛ ہم قافیہ لفظ؛ لَے۔', 10, 'نظم کا چارٹ'], elaborate: ['اپنے سائے کے بارے میں چار سطریں لکھو۔', 8, 'کاپی'], evaluate: ['ایک بند سناؤ؛ دو سوالوں کے جواب دو۔', 4, 'نظم کا چارٹ'] },
        support: 'ساتھی کے ساتھ پڑھیں؛ چار سطروں کے لیے لفظوں کی فہرست دیں۔', extension: 'معلوم کرو کہ دوپہر میں سایہ چھوٹا اور شام میں لمبا کیوں ہوتا ہے۔',
        week: [['نظم: پڑھو اور لطف لو', 'گھر پر بلند آواز سے پڑھو'], ['نئے لفظ اور قافیے', 'پانچ ہم قافیہ جوڑے لکھو'], ['فہم کے سوال', 'س 1–4'], ['تحریر: میرا سایہ', 'چار سطریں مکمل کرو'], ['قواعد: نظم میں اسم', 'ورک شیٹ'], ['نظم خوانی اور تفریح', 'بند 1 یاد کرو']]
      },
      medieval: {
        subjectKey: 'social', cls: '7', subject: 'سماجی علوم', topic: 'ہزار برس کی تبدیلیوں کا سراغ', period: 5, duration: 40,
        outcomes: ['سمجھا سکیں گے کہ "ہندوستان" لفظ کا مطلب وقت کے ساتھ کیسے بدلا', 'تاریخی نقشہ پڑھ کر جدید نقشے سے موازنہ کر سکیں گے', 'قرونِ وسطیٰ کے لیے مؤرخین کے استعمال کردہ ماخذوں کی فہرست بنا سکیں گے'],
        prev: 'طلبہ چھٹی جماعت کا قدیم دور جانتے ہیں اور ہندوستان کا نقشہ پڑھ سکتے ہیں۔',
        materials: ['دو نقشے: الادریسی (1154) اور ایک جدید نقشہ', 'نصابی کتاب', 'اٹلس'], comp: ['critical', 'comm'],
        intro: 'الادریسی کا 1154 کا نقشہ الٹا دکھائیں۔ پوچھیں: کیا جنوبی ہندوستان نظر آتا ہے؟',
        steps: [
          ['دونوں نقشوں کا موازنہ: نام، شکلیں، کیا غائب ہے۔', 'جوڑی میں تین فرق ڈھونڈو اور بتاؤ نقشے کیوں بدلتے ہیں۔', 12],
          ['سمجھائیں کہ لفظ کیسے بدلتے ہیں: منہاج سراج، بابر اور امیر خسرو کا "ہندوستان"۔', 'کاپی میں تین مطلبوں کی ٹائم لائن بناؤ۔', 13],
          ['ماخذ: مخطوطات، سکے، کتبے، عمارتیں؛ نقل کرنے سے متن کیوں بدلے۔', 'ماخذ کارڈوں کو تحریری اور مادی ماخذوں میں چھانٹو۔', 10]
        ],
        recap: 'فوری کوئز: پنجاب، ہریانہ اور گنگا-جمنا کے علاقے کے لیے "ہندوستان" کس نے استعمال کیا؟',
        assess: 'دو وجوہات لکھو کہ کسی جگہ کے نام کا مطلب کیوں بدل سکتا ہے۔', hw: 'NCERT باب 1، "Let\'s recall" سوال 1 تا 3۔',
        e5: { engage: ['1154 کا الٹا نقشہ: کیا نظر آتا ہے؟', 5, 'نقشے کا پرنٹ'], explore: ['گروپ میں پرانے اور نئے نقشے کا موازنہ کرو۔', 10, 'دو نقشے'], explain: ['بدلتے نام اور مطلب؛ اس دور کے ماخذ۔', 12, 'نصابی کتاب، بلیک بورڈ'], elaborate: ['"ہندوستان" لفظ کی ٹائم لائن بناؤ۔', 8, 'کاپی'], evaluate: ['جگہوں کے ناموں کے مطلب بدلنے کی دو وجوہات۔', 5, 'کاغذ کی پرچیاں'] },
        support: 'پہلے سے نام لکھا نقشہ دیں؛ ایک فرق پوچھیں۔', extension: 'معلوم کرو کہ 500 سال پہلے تمہارے شہر یا ریاست کو کیا کہتے تھے۔',
        week: [['پرانے نقشے اور نئے نقشے', '1.1 پڑھو'], ['نئے اور پرانے لفظ: ہندوستان', 'ٹائم لائن'], ['مؤرخین اور ان کے ماخذ', 'س 1–3'], ['نئے سماجی اور سیاسی گروہ', '1.3 پڑھو'], ['علاقہ اور سلطنت؛ پرانے اور نئے مذاہب', 'مختصر نوٹ'], ['دہرائی اور نقشے کا کام', 'پانچ جگہیں نشان زد کرو']]
      },
      story: {
        subjectKey: 'language', cls: '4', subject: 'اردو', topic: 'کہانی: پیاسا کوا', period: 1, duration: 35,
        outcomes: ['کہانی صحیح ترتیب سے دوبارہ سنا سکیں گے', 'پانچ نئے لفظوں کے مطلب بتا سکیں گے', 'بتا سکیں گے کہ کوے نے کیا کیا اور وہ کیوں کام آیا'],
        prev: 'طلبہ چھوٹے جملے پڑھ سکتے ہیں اور گھر پر لوک کہانیاں سنی ہیں۔',
        materials: ['کہانی کے تصویری کارڈ', 'ایک گھڑا، پانی اور کنکر', 'نصابی کتاب'], comp: ['critical', 'creativity', 'comm'],
        intro: 'تھوڑے پانی والا گھڑا اور ایک پتھر دکھائیں۔ پوچھیں: پرندہ یہ پانی کیسے پی سکتا ہے؟',
        steps: [
          ['تصویری کارڈوں اور آواز کے اتار چڑھاؤ کے ساتھ کہانی سنائیں۔', 'سنیں؛ دو جگہوں پر اندازہ لگائیں کہ آگے کیا ہوگا۔', 10],
          ['کہانی بلند آواز سے پڑھیں؛ اداکاری سے نئے لفظ سمجھائیں۔', 'جوڑی میں پڑھیں؛ نئے لفظوں کے نیچے لکیر لگائیں؛ دو لفظوں سے جملے بنائیں۔', 15],
          ['گھڑے کے ساتھ کنکروں کا تجربہ کریں۔', 'ایک ایک کنکر ڈالو، پانی اوپر آتے دیکھو اور بتاؤ ایسا کیوں ہوتا ہے۔', 10]
        ],
        recap: 'بورڈ پر تصویری کارڈ ترتیب سے لگاؤ۔',
        assess: 'ساتھی کو پانچ جملوں میں کہانی دوبارہ سناؤ۔', hw: 'کوا اور گھڑا بناؤ؛ تین جملے لکھو۔',
        e5: { engage: ['تھوڑے پانی والا گھڑا: پرندہ کیسے پیے گا؟', 5, 'گھڑا، پانی'], explore: ['گروپ میں کنکروں سے آزماؤ: کیا پانی اوپر آتا ہے؟', 8, 'گھڑا، کنکر'], explain: ['کہانی پڑھو؛ نئے لفظ اور کہانی کا سبق۔', 10, 'نصابی کتاب، تصویری کارڈ'], elaborate: ['تین کے گروپ میں کہانی کی اداکاری کرو۔', 8, 'تصویری کارڈ'], evaluate: ['پانچ جملوں میں کہانی دوبارہ سناؤ۔', 4, 'تصویری کارڈ'] },
        support: 'تصویری کارڈ ترتیب سے دیں؛ ان کی مدد سے سنانے دیں۔', extension: 'انجام بدلو: اگر کنکر نہ ہوتے تو کیا ہوتا؟',
        week: [['کہانی سنو', 'گھر پر سناؤ'], ['پڑھو؛ نئے لفظ', 'پانچ لفظ، پانچ جملے'], ['کنکروں کا تجربہ اور یہ کیوں کام کرتا ہے', 'تصویر بناؤ'], ['کہانی کی اداکاری', 'اپنے مکالمے یاد کرو'], ['اپنا انجام لکھو', 'انجام مکمل کرو'], ['دہرائی اور بلند خوانی', 'صفحہ 1 بلند آواز سے پڑھو']]
      },
      ai: {
        subjectKey: 'ai', cls: '9', subject: 'مصنوعی ذہانت', topic: 'AI کیا ہے؟', period: 6, duration: 40,
        outcomes: ['مقررہ اصولوں پر چلنے والی مشین اور ڈیٹا سے سیکھنے والی مشین کا فرق بتا سکیں گے', 'روزمرہ زندگی میں AI کے پانچ استعمال گنوا سکیں گے', 'AI کے ایک فائدے اور ایک خطرے پر بات کر سکیں گے'],
        prev: 'طلبہ اسمارٹ فون، نقشے، وائس اسسٹنٹ اور ویڈیو ایپس استعمال کرتے ہیں۔',
        materials: ['پروجیکٹر یا فون', 'روزمرہ کاموں کے کارڈ', 'چارٹ پیپر'], comp: ['critical', 'digital', 'comm'],
        intro: 'پوچھیں: تمہارا فون چہرہ دیکھ کر کیسے کھلتا ہے؟ ویڈیو ایپ کو کیسے پتا کہ تمہیں کیا پسند ہے؟',
        steps: [
          ['سادہ لفظوں میں AI کی تعریف کریں: ایسی مشینیں جو ڈیٹا سے نمونے سیکھ کر فیصلے کرتی ہیں۔', 'اپنے فون سے ہر ایک دو مثالیں دے۔', 10],
          ['کام چھانٹیں: کیلکولیٹر (مقررہ اصول) اور اسپام فلٹر (سیکھنے والا)۔ ڈیٹا، نمونہ، پیش گوئی سمجھائیں۔', 'گروپ میں کام کے کارڈ "مقررہ اصول" اور "ڈیٹا سے سیکھتا ہے" میں چھانٹیں۔', 15],
          ['فائدوں اور خطروں پر بات: کھیتی اور صحت میں مدد؛ تعصب، رازداری، جعلی ویڈیو۔', 'ہر گروپ چارٹ پیپر پر ایک فائدہ اور ایک خطرہ لکھے۔', 10]
        ],
        recap: 'تین بیانات: AI ہے یا نہیں؟ انگوٹھا اوپر یا نیچے۔',
        assess: 'اس ہفتے دیکھے گئے AI کے پانچ استعمال اور ایک خطرہ لکھو۔', hw: 'گھر کے کسی فرد سے پوچھو کہ وہ کس ایپ پر سب سے زیادہ بھروسا کرتے ہیں اور کیوں؛ لکھو کہ کیا وہ AI استعمال کرتی ہے۔',
        e5: { engage: ['تمہارا فون چہرہ دیکھ کر کیسے کھلتا ہے؟', 5, 'فون'], explore: ['کام کے کارڈ چھانٹو: مقررہ اصول یا سیکھنا؟', 10, 'کام کے کارڈ'], explain: ['AI کیا ہے: ڈیٹا، نمونے، پیش گوئیاں؛ کہاں استعمال ہوتا ہے۔', 12, 'پروجیکٹر'], elaborate: ['کاغذ پر اپنے اسکول کے لیے سادہ AI مددگار ڈیزائن کرو۔', 8, 'چارٹ پیپر'], evaluate: ['AI کے پانچ استعمال اور ایک خطرہ۔', 5, 'کاپی'] },
        support: 'مثالیں تیار دیں؛ طلبہ صرف چھانٹیں۔', extension: 'ایک مثال تلاش کرو جہاں AI نے غلط فیصلہ کیا اور بتاؤ کیوں۔',
        week: [['ذہانت کیا ہے؟ انسان اور مشین', 'آج کیے پانچ سمجھدار کاموں کی فہرست'], ['AI کیا ہے؟ اصول یا سیکھنا', 'دس کام چھانٹو'], ['ہمارے آس پاس AI', 'AI کے پانچ استعمال'], ['ڈیٹا، نمونے اور پیش گوئیاں', 'نمونے کی ورک شیٹ'], ['AI کے فائدے اور خطرے', 'ایک صفحے کا نوٹ'], ['پروجیکٹ: ہمارے اسکول کے لیے AI مددگار', 'پوسٹر']]
      }
    }
  }
};
