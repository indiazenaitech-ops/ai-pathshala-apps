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
  }
};
