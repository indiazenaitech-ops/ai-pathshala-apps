/* Prompt Builder: localized content (same shape in all 12 languages).
   asm = phrases used to assemble the prompt IN the chosen answer language.
   chips = quick-add rules (label shown in the UI language, text inserted in the answer language).
   templates = the template gallery ([square brackets] are blanks for the teacher to fill). */
window.APP_CONTENT = window.APP_CONTENT || {};
window.APP_CONTENT.en = {
  asm: {
    role: "You are {x}.",
    task: "Task: {x}",
    context: "Background: {x}",
    aud: "Audience: {x}. Use words and examples they can easily understand.",
    audv: {
      c1_5: "children of Class 1–5 (about 6–10 years old)",
      c6_8: "students of Class 6–8 (about 11–13 years old)",
      c9_10: "students of Class 9–10 (about 14–15 years old)",
      c11_12: "students of Class 11–12 (about 16–17 years old)",
      ug: "college students",
      teachers: "school teachers",
      parents: "parents of school students",
      general: "general readers"
    },
    fmt: {
      list: "Format: Give the answer as a numbered list of short, clear points.",
      table: "Format: Give the answer as a table with clear column headings.",
      paragraph: "Format: Write in short, well-organised paragraphs.",
      quiz: "Format: Make it a quiz. Give each question four options (A–D), and put an answer key with a one-line explanation at the end.",
      steps: "Format: Explain step by step, using numbered steps with short headings.",
      letter: "Format: Write it as a formal letter or notice with date, subject, greeting, main message and sign-off."
    },
    tone: "Tone: {x}.",
    tonev: {
      friendly: "friendly and warm",
      formal: "formal and polite",
      encouraging: "encouraging and positive",
      simple: "simple and clear",
      fun: "fun and lively",
      neutral: "neutral and balanced"
    },
    len: {
      vshort: "Length: very short, about 100 words.",
      short: "Length: short, about 150–250 words.",
      medium: "Length: medium, about 300–500 words.",
      long: "Length: detailed and complete, but without filler."
    },
    lang: "Language: Write the whole answer in simple English.",
    rules: "Follow these rules:",
    example: "Here is an example of the style I want:",
    ask: "If any important detail is missing, first ask me up to 3 short questions, then answer.",
    unsure: "If you are not sure about a fact, say so clearly instead of guessing."
  },
  chips: [
    { label: "Indian examples", text: "Use examples from everyday Indian life (Indian names, places, food, festivals, ₹)." },
    { label: "NCERT syllabus", text: "Stay within the NCERT/CBSE syllabus for this class." },
    { label: "Simple words", text: "Use simple words, and explain any difficult word in brackets." },
    { label: "Answer key", text: "Give an answer key at the end." },
    { label: "Sources", text: "List sources I can check, such as NCERT textbook chapters." },
    { label: "No stereotypes", text: "Be inclusive and respectful: no stereotypes about gender, caste, religion or region." },
    { label: "Low-cost activity", text: "Include one classroom activity that needs only low-cost materials." },
    { label: "Easy + hard", text: "Give an easier version and a more challenging version for different learners." }
  ],
  templates: {
    lesson5e: {
      title: "Lesson plan (5E)",
      desc: "A 40-minute activity-based lesson",
      role: "an experienced CBSE science teacher who plans activity-based lessons",
      task: "Make a 40-minute lesson plan on [topic] using the 5E model: Engage, Explore, Explain, Elaborate, Evaluate.",
      context: "Class [7] Science, NCERT chapter “[chapter name]”. There are about 40 students, one smartboard and only basic materials. Some students find English difficult.",
      cons: "Show the time for each stage; the total must be 40 minutes.\nUse low-cost materials easily found in an Indian school.\nEnd with 3 quick questions to check understanding.\nSuggest one short homework task.",
      ex: "Engage (5 min): Hold up a glass of ice-cold water and ask, “Where do the drops on the outside of the glass come from?”"
    },
    mcq10: {
      title: "10 MCQs on a chapter",
      desc: "A revision quiz with an answer key",
      role: "a careful CBSE question-paper setter",
      task: "Write 10 multiple-choice questions on the chapter “[chapter name]”.",
      context: "Class [9] [subject], NCERT textbook. The quiz is a revision test after finishing the chapter.",
      cons: "Mix the difficulty: 4 easy, 4 medium and 2 hard questions.\nEach question must have exactly one correct answer.\nDo not use “all of the above” or “none of the above”.\nGive the answer key with a one-line reason for each answer.",
      ex: "Q1. Which gas do plants take in to make their food?\n(A) Oxygen  (B) Carbon dioxide  (C) Nitrogen  (D) Hydrogen\nAnswer: (B). Plants use carbon dioxide and water to make food in sunlight."
    },
    explain: {
      title: "Explain a concept simply",
      desc: "With an everyday Indian example",
      role: "a patient teacher who explains difficult ideas in simple words",
      task: "Explain [concept, e.g. friction] in simple words.",
      context: "The students are learning this for the first time. Use one example from daily life in India, such as the kitchen, a cricket match, a train journey or a festival.",
      cons: "Start with a one-line definition.\nGive one everyday Indian example.\nEnd with one question that makes students think.\nIf you use a technical word, explain it.",
      ex: "Friction is the force that slows things down when two surfaces rub against each other. That is why a cricket ball rolling on grass slowly stops."
    },
    rubric: {
      title: "Marking rubric",
      desc: "Fair criteria and levels for a project",
      role: "an experienced teacher who designs fair marking rubrics",
      task: "Make a marking rubric for [assignment, e.g. a science model].",
      context: "Class [8]. The project is marked out of 20. Students worked in groups of 4 for two weeks.",
      cons: "Use 4 criteria and 4 levels: Excellent, Good, Satisfactory, Needs improvement.\nDescribe each level in one clear sentence.\nShow the marks for each level, and make sure the total is 20.\nInclude one criterion for teamwork.",
      ex: ""
    },
    parentletter: {
      title: "Notice to parents",
      desc: "A clear, polite notice for a school event",
      role: "a school principal who writes clear and polite notices for parents",
      task: "Write a notice to parents about [event, e.g. the Parent-Teacher Meeting].",
      context: "Date: [date]. Time: [time]. Place: [school hall]. Many parents are more comfortable in their home language than in English.",
      cons: "Keep it under 150 words.\nMention the date, time, place and what parents should bring.\nAdd a short reply slip at the end.\nDo not include any student names or phone numbers.",
      ex: ""
    },
    story: {
      title: "Story for kids",
      desc: "A short moral story with questions",
      role: "a children’s storyteller from India",
      task: "Write a short story for children that teaches [value, e.g. sharing or saving water].",
      context: "The story is for Class [3] students. Set it in an Indian village or town, with Indian names and animals that children know.",
      cons: "Use short sentences and easy words.\nInclude some dialogue.\nEnd with the moral in one line.\nAdd 3 simple questions about the story.",
      ex: ""
    },
    essayfb: {
      title: "Feedback on an essay",
      desc: "Kind, specific feedback a student can use",
      role: "a kind and honest language teacher",
      task: "Give feedback on the student essay below.",
      context: "Class [9] essay on “[topic]”. The word limit was 250 words. Essay (without the student’s name): [paste the essay here]",
      cons: "Start with 2 things the student did well.\nThen give 3 specific ways to improve, each with an example sentence.\nComment on ideas, organisation and grammar separately.\nDo not rewrite the whole essay.\nGive a score out of 10 with a short reason.",
      ex: ""
    },
    timetable: {
      title: "Study timetable",
      desc: "A realistic weekly plan before exams",
      role: "a study coach who helps students make realistic plans",
      task: "Make a weekly study timetable for my exams, which start on [date].",
      context: "I am in Class [10]. School is from 8 am to 2 pm. My subjects are Maths, Science, Social Science, English and [second language]. My weakest subject is [subject].",
      cons: "Include short breaks, play time and 8 hours of sleep.\nGive more time to my weakest subject.\nKeep one day each week for revision.\nKeep Sunday evening free.",
      ex: ""
    },
    debate: {
      title: "Debate points",
      desc: "Balanced points for and against",
      role: "an experienced debate coach",
      task: "Give points for and against the motion: “[motion, e.g. Mobile phones should be allowed in schools]”.",
      context: "For an inter-school debate for Class [11] students. Each speaker gets 3 minutes.",
      cons: "Give 5 points for and 5 points against.\nSupport each point with a fact or example, and mark the facts I should double-check.\nAdd 2 possible rebuttals for each side.\nKeep it balanced and respectful.",
      ex: ""
    },
    summary: {
      title: "Summarise notes",
      desc: "Turn long notes into revision points",
      role: "a study helper who makes clear revision notes",
      task: "Summarise my notes below into key points for revision.",
      context: "These are my class notes on [topic]: [paste your notes here]",
      cons: "Use at most 10 bullet points.\nKeep all important terms, dates and formulas.\nAdd 3 questions I can use to test myself.\nDo not add anything that is not in my notes.",
      ex: ""
    },
    interview: {
      title: "Interview practice",
      desc: "A mock interview, one question at a time",
      role: "a friendly interviewer for [a job or college admission]",
      task: "Help me practise for an interview. Ask me one question at a time, wait for my answer, then give feedback.",
      context: "I am a [final-year B.Com student] applying for [job or course]. I get nervous and give very short answers.",
      cons: "Ask 8 questions in total, from easy to difficult.\nAfter each answer, tell me one strength and one thing to improve.\nAt the end, give a short summary and 3 tips.\nDo not ask for my real name, phone number or address.",
      ex: ""
    }
  }
};

window.APP_CONTENT.hi = {
  asm: {
    role: "आप {x} हैं।",
    task: "काम: {x}",
    context: "पृष्ठभूमि: {x}",
    aud: "यह किसके लिए है: {x}। ऐसे शब्द और उदाहरण इस्तेमाल करें जो वे आसानी से समझ सकें।",
    audv: {
      c1_5: "कक्षा 1–5 के बच्चे (लगभग 6–10 साल)",
      c6_8: "कक्षा 6–8 के विद्यार्थी (लगभग 11–13 साल)",
      c9_10: "कक्षा 9–10 के विद्यार्थी (लगभग 14–15 साल)",
      c11_12: "कक्षा 11–12 के विद्यार्थी (लगभग 16–17 साल)",
      ug: "कॉलेज के विद्यार्थी",
      teachers: "स्कूल के शिक्षक",
      parents: "स्कूली बच्चों के अभिभावक",
      general: "आम पाठक"
    },
    fmt: {
      list: "फ़ॉर्मेट: उत्तर छोटे और साफ़ बिंदुओं की क्रमांकित सूची में दें।",
      table: "फ़ॉर्मेट: उत्तर एक तालिका में दें, जिसके हर कॉलम का शीर्षक साफ़ हो।",
      paragraph: "फ़ॉर्मेट: छोटे, सुव्यवस्थित अनुच्छेदों में लिखें।",
      quiz: "फ़ॉर्मेट: इसे क्विज़ बनाएँ। हर प्रश्न के चार विकल्प (A–D) दें, और अंत में एक-एक लाइन की व्याख्या के साथ उत्तर-कुंजी दें।",
      steps: "फ़ॉर्मेट: चरण-दर-चरण समझाएँ, हर चरण पर नंबर और छोटा शीर्षक हो।",
      letter: "फ़ॉर्मेट: इसे औपचारिक पत्र या सूचना की तरह लिखें, जिसमें तारीख़, विषय, संबोधन, मुख्य संदेश और अंत में नाम/पद हो।"
    },
    tone: "लहजा: {x}।",
    tonev: {
      friendly: "दोस्ताना और अपनापन भरा",
      formal: "औपचारिक और विनम्र",
      encouraging: "हौसला बढ़ाने वाला और सकारात्मक",
      simple: "सरल और साफ़",
      fun: "मज़ेदार और जीवंत",
      neutral: "निष्पक्ष और संतुलित"
    },
    len: {
      vshort: "लंबाई: बहुत छोटा, लगभग 100 शब्द।",
      short: "लंबाई: छोटा, लगभग 150–250 शब्द।",
      medium: "लंबाई: मध्यम, लगभग 300–500 शब्द।",
      long: "लंबाई: विस्तृत और पूरा, लेकिन बेवजह की बातें नहीं।"
    },
    lang: "भाषा: पूरा उत्तर सरल हिंदी में लिखें।",
    rules: "इन नियमों का पालन करें:",
    example: "मुझे जैसा अंदाज़ चाहिए, उसका एक उदाहरण:",
    ask: "अगर कोई ज़रूरी जानकारी छूटी हो, तो पहले मुझसे ज़्यादा से ज़्यादा 3 छोटे सवाल पूछें, फिर उत्तर दें।",
    unsure: "अगर किसी तथ्य के बारे में पक्का न पता हो, तो अंदाज़ा लगाने की बजाय साफ़ बता दें।"
  },
  chips: [
    { label: "भारतीय उदाहरण", text: "रोज़मर्रा की भारतीय ज़िंदगी से उदाहरण दें (भारतीय नाम, जगहें, खाना, त्योहार, ₹)।" },
    { label: "NCERT सिलेबस", text: "इस कक्षा के NCERT/CBSE सिलेबस के अंदर ही रहें।" },
    { label: "आसान शब्द", text: "आसान शब्दों का इस्तेमाल करें, और हर कठिन शब्द का मतलब कोष्ठक में बताएँ।" },
    { label: "उत्तर-कुंजी", text: "अंत में उत्तर-कुंजी दें।" },
    { label: "स्रोत", text: "ऐसे स्रोत बताएँ जिन्हें मैं जाँच सकूँ, जैसे NCERT किताब के अध्याय।" },
    { label: "कोई रूढ़िवादी सोच नहीं", text: "सबको साथ लेकर और सम्मान से लिखें: लिंग, जाति, धर्म या क्षेत्र को लेकर कोई रूढ़िवादी बात नहीं।" },
    { label: "कम ख़र्च की गतिविधि", text: "कक्षा की एक ऐसी गतिविधि शामिल करें जिसमें सिर्फ़ सस्ती चीज़ें लगें।" },
    { label: "आसान + कठिन", text: "अलग-अलग बच्चों के लिए एक आसान रूप और एक ज़्यादा चुनौती वाला रूप दें।" }
  ],
  templates: {
    lesson5e: {
      title: "पाठ योजना (5E)",
      desc: "40 मिनट का गतिविधि-आधारित पाठ",
      role: "गतिविधि-आधारित पाठ बनाने वाले एक अनुभवी CBSE विज्ञान शिक्षक",
      task: "[विषय] पर 5E मॉडल से 40 मिनट की पाठ योजना बनाइए: Engage (जोड़ना), Explore (खोजना), Explain (समझाना), Elaborate (विस्तार करना), Evaluate (मूल्यांकन)।",
      context: "कक्षा [7] विज्ञान, NCERT अध्याय “[अध्याय का नाम]”। कक्षा में लगभग 40 बच्चे हैं, एक स्मार्टबोर्ड है और बस साधारण सामान है। कुछ बच्चों को अंग्रेज़ी कठिन लगती है।",
      cons: "हर चरण का समय लिखें; कुल समय 40 मिनट ही हो।\nऐसा सस्ता सामान इस्तेमाल करें जो भारतीय स्कूल में आसानी से मिल जाए।\nअंत में समझ जाँचने के लिए 3 छोटे सवाल दें।\nएक छोटा होमवर्क सुझाएँ।",
      ex: "Engage (5 मिनट): बर्फ़ वाले ठंडे पानी का गिलास दिखाकर पूछें, “गिलास के बाहर ये बूँदें कहाँ से आईं?”"
    },
    mcq10: {
      title: "अध्याय पर 10 MCQ",
      desc: "उत्तर-कुंजी के साथ दोहराई क्विज़",
      role: "सावधानी से प्रश्न-पत्र बनाने वाले एक CBSE पेपर-सेटर",
      task: "अध्याय “[अध्याय का नाम]” पर 10 बहुविकल्पीय प्रश्न (MCQ) लिखिए।",
      context: "कक्षा [9] [विषय], NCERT किताब। यह क्विज़ अध्याय पूरा होने के बाद दोहराई की परीक्षा है।",
      cons: "कठिनाई मिलाकर रखें: 4 आसान, 4 मध्यम और 2 कठिन प्रश्न।\nहर प्रश्न का सिर्फ़ एक ही सही उत्तर हो।\n“उपरोक्त सभी” या “इनमें से कोई नहीं” जैसे विकल्प न रखें।\nहर उत्तर के साथ एक लाइन का कारण देकर उत्तर-कुंजी दें।",
      ex: "प्र1. पौधे भोजन बनाने के लिए कौन-सी गैस लेते हैं?\n(A) ऑक्सीजन  (B) कार्बन डाइऑक्साइड  (C) नाइट्रोजन  (D) हाइड्रोजन\nउत्तर: (B)। पौधे धूप में कार्बन डाइऑक्साइड और पानी से भोजन बनाते हैं।"
    },
    explain: {
      title: "कोई अवधारणा आसानी से समझाएँ",
      desc: "रोज़ के भारतीय उदाहरण के साथ",
      role: "कठिन बातों को आसान शब्दों में समझाने वाले एक धैर्यवान शिक्षक",
      task: "[अवधारणा, जैसे घर्षण] को आसान शब्दों में समझाइए।",
      context: "बच्चे यह पहली बार पढ़ रहे हैं। भारत की रोज़ की ज़िंदगी से एक उदाहरण दें, जैसे रसोई, क्रिकेट मैच, रेल यात्रा या कोई त्योहार।",
      cons: "एक लाइन की परिभाषा से शुरू करें।\nरोज़ की भारतीय ज़िंदगी से एक उदाहरण दें।\nअंत में एक ऐसा सवाल दें जो बच्चों को सोचने पर मजबूर करे।\nकोई तकनीकी शब्द आए तो उसका मतलब समझाएँ।",
      ex: "घर्षण वह बल है जो दो सतहों के आपस में रगड़ खाने पर चीज़ों को धीमा करता है। इसी वजह से घास पर लुढ़कती क्रिकेट की गेंद धीरे-धीरे रुक जाती है।"
    },
    rubric: {
      title: "मूल्यांकन रूब्रिक",
      desc: "प्रोजेक्ट के लिए निष्पक्ष मानदंड और स्तर",
      role: "निष्पक्ष मूल्यांकन रूब्रिक बनाने वाले एक अनुभवी शिक्षक",
      task: "[असाइनमेंट, जैसे विज्ञान मॉडल] के लिए एक मूल्यांकन रूब्रिक बनाइए।",
      context: "कक्षा [8]। प्रोजेक्ट 20 अंकों का है। बच्चों ने 4-4 के समूह में दो हफ़्ते काम किया।",
      cons: "4 मानदंड और 4 स्तर रखें: उत्कृष्ट, अच्छा, संतोषजनक, सुधार की ज़रूरत।\nहर स्तर को एक साफ़ वाक्य में समझाएँ।\nहर स्तर के अंक लिखें, और ध्यान रखें कि कुल 20 ही हो।\nटीमवर्क के लिए एक मानदंड ज़रूर रखें।",
      ex: ""
    },
    parentletter: {
      title: "अभिभावकों के लिए सूचना",
      desc: "स्कूल के कार्यक्रम की साफ़, विनम्र सूचना",
      role: "अभिभावकों के लिए साफ़ और विनम्र सूचनाएँ लिखने वाले एक स्कूल प्रधानाचार्य",
      task: "[कार्यक्रम, जैसे अभिभावक-शिक्षक बैठक] के बारे में अभिभावकों के लिए एक सूचना लिखिए।",
      context: "तारीख़: [तारीख़]। समय: [समय]। स्थान: [स्कूल हॉल]। कई अभिभावक अंग्रेज़ी से ज़्यादा अपनी घर की भाषा में सहज हैं।",
      cons: "150 शब्दों से कम रखें।\nतारीख़, समय, स्थान और अभिभावक क्या साथ लाएँ, यह ज़रूर लिखें।\nअंत में एक छोटी जवाबी पर्ची जोड़ें।\nकिसी बच्चे का नाम या फ़ोन नंबर न लिखें।",
      ex: ""
    },
    story: {
      title: "बच्चों के लिए कहानी",
      desc: "सवालों के साथ एक छोटी शिक्षाप्रद कहानी",
      role: "भारत के एक बाल-कहानीकार",
      task: "बच्चों के लिए एक छोटी कहानी लिखिए जो [सीख, जैसे मिल-बाँटकर रहना या पानी बचाना] सिखाए।",
      context: "कहानी कक्षा [3] के बच्चों के लिए है। कहानी किसी भारतीय गाँव या कस्बे में हो, भारतीय नामों और ऐसे जानवरों के साथ जिन्हें बच्चे जानते हैं।",
      cons: "छोटे वाक्य और आसान शब्द इस्तेमाल करें।\nकुछ संवाद भी रखें।\nअंत में एक लाइन में सीख लिखें।\nकहानी पर 3 आसान सवाल जोड़ें।",
      ex: ""
    },
    essayfb: {
      title: "निबंध पर फ़ीडबैक",
      desc: "दयालु और ठोस फ़ीडबैक जो बच्चे के काम आए",
      role: "एक दयालु और ईमानदार भाषा शिक्षक",
      task: "नीचे दिए विद्यार्थी के निबंध पर फ़ीडबैक दीजिए।",
      context: "कक्षा [9] का निबंध, विषय “[विषय]”। शब्द-सीमा 250 शब्द थी। निबंध (विद्यार्थी के नाम के बिना): [निबंध यहाँ पेस्ट करें]",
      cons: "पहले 2 चीज़ें बताएँ जो विद्यार्थी ने अच्छी कीं।\nफिर सुधार के 3 ठोस तरीके बताएँ, हर एक के साथ एक उदाहरण वाक्य।\nविचार, बनावट और व्याकरण पर अलग-अलग टिप्पणी करें।\nपूरा निबंध दोबारा न लिखें।\n10 में से अंक दें और छोटा कारण बताएँ।",
      ex: ""
    },
    timetable: {
      title: "पढ़ाई की समय-सारणी",
      desc: "परीक्षा से पहले हफ़्ते भर की व्यावहारिक योजना",
      role: "बच्चों को व्यावहारिक योजना बनाने में मदद करने वाले एक स्टडी कोच",
      task: "मेरी परीक्षाओं के लिए एक साप्ताहिक पढ़ाई की समय-सारणी बनाइए, परीक्षाएँ [तारीख़] से शुरू हैं।",
      context: "मैं कक्षा [10] में हूँ। स्कूल सुबह 8 से दोपहर 2 बजे तक है। मेरे विषय हैं: गणित, विज्ञान, सामाजिक विज्ञान, अंग्रेज़ी और [दूसरी भाषा]। मेरा सबसे कमज़ोर विषय [विषय] है।",
      cons: "छोटे ब्रेक, खेलने का समय और 8 घंटे की नींद शामिल करें।\nसबसे कमज़ोर विषय को ज़्यादा समय दें।\nहर हफ़्ते एक दिन दोहराई के लिए रखें।\nरविवार की शाम ख़ाली रखें।",
      ex: ""
    },
    debate: {
      title: "वाद-विवाद के बिंदु",
      desc: "पक्ष और विपक्ष के संतुलित बिंदु",
      role: "एक अनुभवी वाद-विवाद कोच",
      task: "इस विषय के पक्ष और विपक्ष में बिंदु दीजिए: “[विषय, जैसे स्कूल में मोबाइल फ़ोन की अनुमति होनी चाहिए]”।",
      context: "कक्षा [11] के विद्यार्थियों की अंतर-विद्यालय वाद-विवाद प्रतियोगिता के लिए। हर वक्ता को 3 मिनट मिलेंगे।",
      cons: "पक्ष में 5 और विपक्ष में 5 बिंदु दें।\nहर बिंदु के साथ एक तथ्य या उदाहरण दें, और जिन तथ्यों को मुझे दोबारा जाँचना चाहिए उन पर निशान लगाएँ।\nहर पक्ष के लिए 2 संभावित जवाबी तर्क जोड़ें।\nबात संतुलित और सम्मानजनक रखें।",
      ex: ""
    },
    summary: {
      title: "नोट्स का सारांश",
      desc: "लंबे नोट्स को दोहराई के बिंदुओं में बदलें",
      role: "साफ़ दोहराई नोट्स बनाने वाले एक पढ़ाई सहायक",
      task: "नीचे दिए मेरे नोट्स का सारांश दोहराई के मुख्य बिंदुओं में बनाइए।",
      context: "[विषय] पर ये मेरे कक्षा के नोट्स हैं: [अपने नोट्स यहाँ पेस्ट करें]",
      cons: "ज़्यादा से ज़्यादा 10 बिंदु रखें।\nसभी ज़रूरी शब्द, तारीख़ें और सूत्र बनाए रखें।\nख़ुद को जाँचने के लिए 3 सवाल जोड़ें।\nऐसी कोई बात न जोड़ें जो मेरे नोट्स में नहीं है।",
      ex: ""
    },
    interview: {
      title: "इंटरव्यू की प्रैक्टिस",
      desc: "एक बार में एक सवाल वाला मॉक इंटरव्यू",
      role: "[नौकरी या कॉलेज दाख़िले] के लिए एक दोस्ताना इंटरव्यूअर",
      task: "इंटरव्यू की प्रैक्टिस में मेरी मदद कीजिए। एक बार में एक ही सवाल पूछें, मेरे जवाब का इंतज़ार करें, फिर फ़ीडबैक दें।",
      context: "मैं [B.Com अंतिम वर्ष का विद्यार्थी] हूँ और [नौकरी या कोर्स] के लिए आवेदन कर रहा/रही हूँ। मैं घबरा जाता/जाती हूँ और बहुत छोटे जवाब देता/देती हूँ।",
      cons: "कुल 8 सवाल पूछें, आसान से कठिन की ओर।\nहर जवाब के बाद एक ख़ूबी और सुधार की एक बात बताएँ।\nअंत में छोटा सारांश और 3 सुझाव दें।\nमेरा असली नाम, फ़ोन नंबर या पता न पूछें।",
      ex: ""
    }
  }
};

window.APP_CONTENT.bn = {
  asm: {
    role: "আপনি {x}।",
    task: "কাজ: {x}",
    context: "পটভূমি: {x}",
    aud: "কাদের জন্য: {x}। এমন শব্দ ও উদাহরণ ব্যবহার করুন যা তারা সহজে বুঝতে পারে।",
    audv: {
      c1_5: "প্রথম থেকে পঞ্চম শ্রেণির শিশুরা (প্রায় 6–10 বছর)",
      c6_8: "ষষ্ঠ থেকে অষ্টম শ্রেণির ছাত্রছাত্রী (প্রায় 11–13 বছর)",
      c9_10: "নবম ও দশম শ্রেণির ছাত্রছাত্রী (প্রায় 14–15 বছর)",
      c11_12: "একাদশ ও দ্বাদশ শ্রেণির ছাত্রছাত্রী (প্রায় 16–17 বছর)",
      ug: "কলেজের ছাত্রছাত্রী",
      teachers: "স্কুলের শিক্ষক-শিক্ষিকা",
      parents: "স্কুলপড়ুয়াদের অভিভাবক",
      general: "সাধারণ পাঠক"
    },
    fmt: {
      list: "ফরম্যাট: উত্তরটি ছোট ও পরিষ্কার পয়েন্টের নম্বরযুক্ত তালিকায় দিন।",
      table: "ফরম্যাট: উত্তরটি একটি সারণিতে দিন, প্রতিটি কলামের শিরোনাম যেন স্পষ্ট হয়।",
      paragraph: "ফরম্যাট: ছোট, গোছানো অনুচ্ছেদে লিখুন।",
      quiz: "ফরম্যাট: এটিকে কুইজ বানান। প্রতিটি প্রশ্নে চারটি বিকল্প (A–D) দিন, আর শেষে এক লাইনের ব্যাখ্যাসহ উত্তরমালা দিন।",
      steps: "ফরম্যাট: ধাপে ধাপে বোঝান, প্রতিটি ধাপে নম্বর ও ছোট শিরোনাম দিন।",
      letter: "ফরম্যাট: এটি আনুষ্ঠানিক চিঠি বা বিজ্ঞপ্তি হিসেবে লিখুন: তারিখ, বিষয়, সম্বোধন, মূল বক্তব্য ও শেষে নাম/পদ।"
    },
    tone: "ভঙ্গি: {x}।",
    tonev: {
      friendly: "বন্ধুসুলভ ও আন্তরিক",
      formal: "আনুষ্ঠানিক ও বিনয়ী",
      encouraging: "উৎসাহব্যঞ্জক ও ইতিবাচক",
      simple: "সহজ ও পরিষ্কার",
      fun: "মজাদার ও প্রাণবন্ত",
      neutral: "নিরপেক্ষ ও ভারসাম্যপূর্ণ"
    },
    len: {
      vshort: "দৈর্ঘ্য: খুব ছোট, প্রায় 100 শব্দ।",
      short: "দৈর্ঘ্য: ছোট, প্রায় 150–250 শব্দ।",
      medium: "দৈর্ঘ্য: মাঝারি, প্রায় 300–500 শব্দ।",
      long: "দৈর্ঘ্য: বিস্তারিত ও সম্পূর্ণ, তবে অপ্রয়োজনীয় কথা ছাড়া।"
    },
    lang: "ভাষা: পুরো উত্তর সহজ বাংলায় লিখুন।",
    rules: "এই নিয়মগুলো মেনে চলুন:",
    example: "আমি যেমন ধরন চাই, তার একটি উদাহরণ:",
    ask: "কোনো জরুরি তথ্য বাদ থাকলে আগে আমাকে সর্বোচ্চ 3টি ছোট প্রশ্ন করুন, তারপর উত্তর দিন।",
    unsure: "কোনো তথ্য সম্পর্কে নিশ্চিত না হলে আন্দাজ না করে সেটা স্পষ্ট করে বলুন।"
  },
  chips: [
    { label: "ভারতীয় উদাহরণ", text: "দৈনন্দিন ভারতীয় জীবন থেকে উদাহরণ দিন (ভারতীয় নাম, জায়গা, খাবার, উৎসব, ₹)।" },
    { label: "NCERT সিলেবাস", text: "এই শ্রেণির NCERT/CBSE সিলেবাসের মধ্যেই থাকুন।" },
    { label: "সহজ শব্দ", text: "সহজ শব্দ ব্যবহার করুন, আর কঠিন শব্দের মানে বন্ধনীতে লিখুন।" },
    { label: "উত্তরমালা", text: "শেষে উত্তরমালা দিন।" },
    { label: "উৎস", text: "এমন উৎস জানান যা আমি যাচাই করতে পারি, যেমন NCERT বইয়ের অধ্যায়।" },
    { label: "কোনো গৎবাঁধা ধারণা নয়", text: "সবাইকে নিয়ে ও সম্মান দিয়ে লিখুন: লিঙ্গ, জাতি, ধর্ম বা অঞ্চল নিয়ে কোনো গৎবাঁধা ধারণা নয়।" },
    { label: "কম খরচের কার্যকলাপ", text: "ক্লাসের এমন একটি কার্যকলাপ রাখুন যাতে শুধু সস্তা জিনিস লাগে।" },
    { label: "সহজ + কঠিন", text: "আলাদা আলাদা শিক্ষার্থীর জন্য একটি সহজ রূপ আর একটি বেশি চ্যালেঞ্জিং রূপ দিন।" }
  ],
  templates: {
    lesson5e: {
      title: "পাঠ পরিকল্পনা (5E)",
      desc: "40 মিনিটের কার্যকলাপ-ভিত্তিক পাঠ",
      role: "একজন অভিজ্ঞ CBSE বিজ্ঞান শিক্ষক, যিনি কার্যকলাপ-ভিত্তিক পাঠ পরিকল্পনা করেন",
      task: "[বিষয়]-এর উপর 5E মডেলে 40 মিনিটের একটি পাঠ পরিকল্পনা তৈরি করুন: Engage (যুক্ত করা), Explore (অনুসন্ধান), Explain (ব্যাখ্যা), Elaborate (বিস্তার), Evaluate (মূল্যায়ন)।",
      context: "[সপ্তম] শ্রেণি বিজ্ঞান, NCERT অধ্যায় “[অধ্যায়ের নাম]”। প্রায় 40 জন ছাত্রছাত্রী, একটি স্মার্টবোর্ড আর শুধু সাধারণ উপকরণ আছে। কিছু ছাত্রছাত্রীর কাছে ইংরেজি কঠিন লাগে।",
      cons: "প্রতিটি ধাপের সময় লিখুন; মোট সময় যেন 40 মিনিটই হয়।\nভারতীয় স্কুলে সহজে পাওয়া যায় এমন সস্তা উপকরণ ব্যবহার করুন।\nশেষে বোঝা যাচাইয়ের জন্য 3টি ছোট প্রশ্ন দিন।\nএকটি ছোট বাড়ির কাজ প্রস্তাব করুন।",
      ex: "Engage (5 মিনিট): বরফ-ঠান্ডা জলের একটি গ্লাস দেখিয়ে জিজ্ঞেস করুন, “গ্লাসের বাইরের এই ফোঁটাগুলো কোথা থেকে এল?”"
    },
    mcq10: {
      title: "অধ্যায়ের উপর 10টি MCQ",
      desc: "উত্তরমালাসহ পুনরাবৃত্তির কুইজ",
      role: "একজন যত্নশীল CBSE প্রশ্নপত্র প্রস্তুতকারী",
      task: "“[অধ্যায়ের নাম]” অধ্যায়ের উপর 10টি বহুনির্বাচনী প্রশ্ন (MCQ) লিখুন।",
      context: "[নবম] শ্রেণি [বিষয়], NCERT বই। অধ্যায় শেষ হওয়ার পর এটি একটি পুনরাবৃত্তি পরীক্ষা।",
      cons: "কাঠিন্য মিশিয়ে রাখুন: 4টি সহজ, 4টি মাঝারি আর 2টি কঠিন প্রশ্ন।\nপ্রতিটি প্রশ্নের ঠিক একটিই সঠিক উত্তর থাকবে।\n“উপরের সবগুলি” বা “কোনোটিই নয়” বিকল্প রাখবেন না।\nপ্রতিটি উত্তরের এক লাইনের কারণসহ উত্তরমালা দিন।",
      ex: "প্র1. খাদ্য তৈরির জন্য উদ্ভিদ কোন গ্যাস গ্রহণ করে?\n(A) অক্সিজেন  (B) কার্বন ডাই-অক্সাইড  (C) নাইট্রোজেন  (D) হাইড্রোজেন\nউত্তর: (B)। সূর্যালোকে উদ্ভিদ কার্বন ডাই-অক্সাইড আর জল দিয়ে খাদ্য তৈরি করে।"
    },
    explain: {
      title: "সহজ করে ধারণা বোঝান",
      desc: "দৈনন্দিন ভারতীয় উদাহরণসহ",
      role: "একজন ধৈর্যশীল শিক্ষক, যিনি কঠিন বিষয় সহজ কথায় বোঝান",
      task: "[ধারণা, যেমন ঘর্ষণ] সহজ কথায় বুঝিয়ে দিন।",
      context: "ছাত্রছাত্রীরা এটা প্রথমবার শিখছে। ভারতের দৈনন্দিন জীবন থেকে একটি উদাহরণ দিন, যেমন রান্নাঘর, ক্রিকেট ম্যাচ, ট্রেনযাত্রা বা কোনো উৎসব।",
      cons: "এক লাইনের সংজ্ঞা দিয়ে শুরু করুন।\nদৈনন্দিন ভারতীয় জীবন থেকে একটি উদাহরণ দিন।\nশেষে এমন একটি প্রশ্ন দিন যা ছাত্রছাত্রীদের ভাবায়।\nকোনো পারিভাষিক শব্দ ব্যবহার করলে তার মানে বুঝিয়ে দিন।",
      ex: "দুটি তল একে অপরের সঙ্গে ঘষা খেলে যে বল জিনিসকে ধীর করে দেয়, তাকে ঘর্ষণ বলে। তাই ঘাসের উপর গড়িয়ে চলা ক্রিকেট বল ধীরে ধীরে থেমে যায়।"
    },
    rubric: {
      title: "মূল্যায়ন রুব্রিক",
      desc: "প্রকল্পের জন্য ন্যায্য মানদণ্ড ও স্তর",
      role: "একজন অভিজ্ঞ শিক্ষক, যিনি ন্যায্য মূল্যায়ন রুব্রিক তৈরি করেন",
      task: "[অ্যাসাইনমেন্ট, যেমন বিজ্ঞানের মডেল]-এর জন্য একটি মূল্যায়ন রুব্রিক তৈরি করুন।",
      context: "[অষ্টম] শ্রেণি। প্রকল্পটি 20 নম্বরের। ছাত্রছাত্রীরা 4 জনের দলে দুই সপ্তাহ কাজ করেছে।",
      cons: "4টি মানদণ্ড আর 4টি স্তর রাখুন: চমৎকার, ভালো, সন্তোষজনক, উন্নতি দরকার।\nপ্রতিটি স্তর একটি পরিষ্কার বাক্যে বর্ণনা করুন।\nপ্রতিটি স্তরের নম্বর দেখান, আর মোট যেন 20 হয়।\nদলগত কাজের জন্য একটি মানদণ্ড রাখুন।",
      ex: ""
    },
    parentletter: {
      title: "অভিভাবকদের জন্য বিজ্ঞপ্তি",
      desc: "স্কুলের অনুষ্ঠানের পরিষ্কার, বিনয়ী বিজ্ঞপ্তি",
      role: "একজন স্কুলের প্রধান শিক্ষক, যিনি অভিভাবকদের জন্য পরিষ্কার ও বিনয়ী বিজ্ঞপ্তি লেখেন",
      task: "[অনুষ্ঠান, যেমন অভিভাবক-শিক্ষক সভা] নিয়ে অভিভাবকদের জন্য একটি বিজ্ঞপ্তি লিখুন।",
      context: "তারিখ: [তারিখ]। সময়: [সময়]। স্থান: [স্কুলের হল]। অনেক অভিভাবক ইংরেজির চেয়ে নিজের মাতৃভাষায় বেশি স্বচ্ছন্দ।",
      cons: "150 শব্দের মধ্যে রাখুন।\nতারিখ, সময়, স্থান আর অভিভাবকদের কী আনতে হবে তা লিখুন।\nশেষে একটি ছোট উত্তর-স্লিপ যোগ করুন।\nকোনো ছাত্রছাত্রীর নাম বা ফোন নম্বর দেবেন না।",
      ex: ""
    },
    story: {
      title: "শিশুদের গল্প",
      desc: "প্রশ্নসহ একটি ছোট নীতিগল্প",
      role: "ভারতের একজন শিশু-গল্পকার",
      task: "শিশুদের জন্য একটি ছোট গল্প লিখুন যা [শিক্ষা, যেমন ভাগ করে নেওয়া বা জল বাঁচানো] শেখায়।",
      context: "গল্পটি [তৃতীয়] শ্রেণির শিশুদের জন্য। গল্পটি কোনো ভারতীয় গ্রাম বা শহরে হবে, ভারতীয় নাম আর শিশুদের চেনা প্রাণীদের নিয়ে।",
      cons: "ছোট বাক্য আর সহজ শব্দ ব্যবহার করুন।\nকিছু সংলাপ রাখুন।\nশেষে এক লাইনে গল্পের শিক্ষা লিখুন।\nগল্পের উপর 3টি সহজ প্রশ্ন যোগ করুন।",
      ex: ""
    },
    essayfb: {
      title: "রচনার উপর মতামত",
      desc: "সদয়, নির্দিষ্ট মতামত যা কাজে লাগে",
      role: "একজন সদয় ও সৎ ভাষার শিক্ষক",
      task: "নিচের ছাত্র/ছাত্রীর রচনার উপর মতামত দিন।",
      context: "[নবম] শ্রেণির রচনা, বিষয় “[বিষয়]”। শব্দসীমা ছিল 250 শব্দ। রচনা (ছাত্র/ছাত্রীর নাম ছাড়া): [রচনাটি এখানে পেস্ট করুন]",
      cons: "প্রথমে 2টি জিনিস বলুন যা ভালো হয়েছে।\nতারপর উন্নতির 3টি নির্দিষ্ট উপায় বলুন, প্রতিটির সঙ্গে একটি উদাহরণ-বাক্য।\nভাবনা, গঠন আর ব্যাকরণ নিয়ে আলাদা আলাদা মন্তব্য করুন।\nপুরো রচনা নতুন করে লিখবেন না।\n10-এর মধ্যে নম্বর দিন এবং ছোট করে কারণ বলুন।",
      ex: ""
    },
    timetable: {
      title: "পড়াশোনার রুটিন",
      desc: "পরীক্ষার আগে বাস্তবসম্মত সাপ্তাহিক পরিকল্পনা",
      role: "একজন স্টাডি কোচ, যিনি ছাত্রছাত্রীদের বাস্তবসম্মত পরিকল্পনা করতে সাহায্য করেন",
      task: "আমার পরীক্ষার জন্য একটি সাপ্তাহিক পড়ার রুটিন তৈরি করুন, পরীক্ষা শুরু [তারিখ] থেকে।",
      context: "আমি [দশম] শ্রেণিতে পড়ি। স্কুল সকাল 8টা থেকে দুপুর 2টো পর্যন্ত। আমার বিষয়: গণিত, বিজ্ঞান, সমাজবিজ্ঞান, ইংরেজি আর [দ্বিতীয় ভাষা]। আমার সবচেয়ে দুর্বল বিষয় [বিষয়]।",
      cons: "ছোট বিরতি, খেলার সময় আর 8 ঘণ্টা ঘুম রাখুন।\nসবচেয়ে দুর্বল বিষয়ে বেশি সময় দিন।\nপ্রতি সপ্তাহে একটি দিন রিভিশনের জন্য রাখুন।\nরবিবার সন্ধ্যা ফাঁকা রাখুন।",
      ex: ""
    },
    debate: {
      title: "বিতর্কের পয়েন্ট",
      desc: "পক্ষে ও বিপক্ষে ভারসাম্যপূর্ণ যুক্তি",
      role: "একজন অভিজ্ঞ বিতর্ক প্রশিক্ষক",
      task: "এই বিষয়ের পক্ষে ও বিপক্ষে পয়েন্ট দিন: “[বিষয়, যেমন স্কুলে মোবাইল ফোন ব্যবহারের অনুমতি থাকা উচিত]”।",
      context: "[একাদশ] শ্রেণির ছাত্রছাত্রীদের আন্তঃবিদ্যালয় বিতর্ক প্রতিযোগিতার জন্য। প্রত্যেক বক্তা 3 মিনিট সময় পাবে।",
      cons: "পক্ষে 5টি আর বিপক্ষে 5টি পয়েন্ট দিন।\nপ্রতিটি পয়েন্টের সঙ্গে একটি তথ্য বা উদাহরণ দিন, আর যে তথ্যগুলো আমার আবার যাচাই করা উচিত সেগুলো চিহ্নিত করুন।\nপ্রতিটি পক্ষের জন্য 2টি সম্ভাব্য পাল্টা যুক্তি যোগ করুন।\nআলোচনা ভারসাম্যপূর্ণ ও সম্মানজনক রাখুন।",
      ex: ""
    },
    summary: {
      title: "নোটের সারাংশ",
      desc: "লম্বা নোটকে রিভিশনের পয়েন্টে বদলান",
      role: "একজন পড়াশোনার সহায়ক, যিনি পরিষ্কার রিভিশন নোট তৈরি করেন",
      task: "নিচে দেওয়া আমার নোটের সারাংশ রিভিশনের মূল পয়েন্টে লিখে দিন।",
      context: "[বিষয়] নিয়ে এগুলো আমার ক্লাসের নোট: [আপনার নোট এখানে পেস্ট করুন]",
      cons: "সর্বোচ্চ 10টি পয়েন্ট রাখুন।\nসব জরুরি শব্দ, তারিখ আর সূত্র রেখে দিন।\nনিজেকে যাচাই করার জন্য 3টি প্রশ্ন যোগ করুন।\nআমার নোটে নেই এমন কিছু যোগ করবেন না।",
      ex: ""
    },
    interview: {
      title: "ইন্টারভিউ অনুশীলন",
      desc: "একবারে একটি প্রশ্নের মক ইন্টারভিউ",
      role: "[চাকরি বা কলেজে ভর্তি]-র জন্য একজন বন্ধুসুলভ ইন্টারভিউয়ার",
      task: "ইন্টারভিউ অনুশীলনে আমাকে সাহায্য করুন। একবারে একটি প্রশ্ন করুন, আমার উত্তরের জন্য অপেক্ষা করুন, তারপর মতামত দিন।",
      context: "আমি [B.Com শেষ বর্ষের ছাত্র/ছাত্রী], [চাকরি বা কোর্স]-এর জন্য আবেদন করছি। আমি নার্ভাস হয়ে যাই আর খুব ছোট উত্তর দিই।",
      cons: "মোট 8টি প্রশ্ন করুন, সহজ থেকে কঠিনের দিকে।\nপ্রতিটি উত্তরের পর একটি ভালো দিক আর উন্নতির একটি বিষয় বলুন।\nশেষে একটি ছোট সারাংশ আর 3টি পরামর্শ দিন।\nআমার আসল নাম, ফোন নম্বর বা ঠিকানা জানতে চাইবেন না।",
      ex: ""
    }
  }
};

window.APP_CONTENT.mr = {
  asm: {
    role: "तुम्ही {x} आहात.",
    task: "काम: {x}",
    context: "पार्श्वभूमी: {x}",
    aud: "हे कोणासाठी आहे: {x}. त्यांना सहज समजतील असे शब्द आणि उदाहरणे वापरा.",
    audv: {
      c1_5: "इयत्ता 1–5 मधील मुले (सुमारे 6–10 वर्षे)",
      c6_8: "इयत्ता 6–8 मधील विद्यार्थी (सुमारे 11–13 वर्षे)",
      c9_10: "इयत्ता 9–10 मधील विद्यार्थी (सुमारे 14–15 वर्षे)",
      c11_12: "इयत्ता 11–12 मधील विद्यार्थी (सुमारे 16–17 वर्षे)",
      ug: "महाविद्यालयीन विद्यार्थी",
      teachers: "शाळेतील शिक्षक",
      parents: "शाळकरी मुलांचे पालक",
      general: "सामान्य वाचक"
    },
    fmt: {
      list: "स्वरूप: उत्तर छोट्या, स्पष्ट मुद्द्यांच्या क्रमांकित यादीत द्या.",
      table: "स्वरूप: उत्तर तक्त्यात द्या, प्रत्येक स्तंभाचे शीर्षक स्पष्ट असावे.",
      paragraph: "स्वरूप: छोट्या, व्यवस्थित परिच्छेदांत लिहा.",
      quiz: "स्वरूप: याची प्रश्नमंजुषा बनवा. प्रत्येक प्रश्नाला चार पर्याय (A–D) द्या, आणि शेवटी एका ओळीच्या स्पष्टीकरणासह उत्तरसूची द्या.",
      steps: "स्वरूप: टप्प्याटप्प्याने समजावून सांगा, प्रत्येक टप्प्याला क्रमांक आणि छोटे शीर्षक द्या.",
      letter: "स्वरूप: हे औपचारिक पत्र किंवा सूचना म्हणून लिहा: तारीख, विषय, मायना, मुख्य मजकूर आणि शेवटी नाव/पद."
    },
    tone: "शैली: {x}.",
    tonev: {
      friendly: "मैत्रीपूर्ण आणि आपुलकीची",
      formal: "औपचारिक आणि नम्र",
      encouraging: "प्रोत्साहन देणारी आणि सकारात्मक",
      simple: "सोपी आणि स्पष्ट",
      fun: "मजेदार आणि उत्साही",
      neutral: "तटस्थ आणि संतुलित"
    },
    len: {
      vshort: "लांबी: खूप छोटे, सुमारे 100 शब्द.",
      short: "लांबी: छोटे, सुमारे 150–250 शब्द.",
      medium: "लांबी: मध्यम, सुमारे 300–500 शब्द.",
      long: "लांबी: सविस्तर आणि पूर्ण, पण अनावश्यक मजकूर नको."
    },
    lang: "भाषा: संपूर्ण उत्तर सोप्या मराठीत लिहा.",
    rules: "हे नियम पाळा:",
    example: "मला हवी असलेली शैली दाखवणारे एक उदाहरण:",
    ask: "एखादी महत्त्वाची माहिती राहिली असल्यास आधी मला जास्तीत जास्त 3 छोटे प्रश्न विचारा, मग उत्तर द्या.",
    unsure: "एखाद्या तथ्याबद्दल खात्री नसल्यास अंदाज न लावता तसे स्पष्ट सांगा."
  },
  chips: [
    { label: "भारतीय उदाहरणे", text: "रोजच्या भारतीय जीवनातील उदाहरणे द्या (भारतीय नावे, ठिकाणे, खाणे, सण, ₹)." },
    { label: "NCERT अभ्यासक्रम", text: "या इयत्तेच्या NCERT/CBSE अभ्यासक्रमाच्या मर्यादेतच राहा." },
    { label: "सोपे शब्द", text: "सोपे शब्द वापरा, आणि कठीण शब्दाचा अर्थ कंसात द्या." },
    { label: "उत्तरसूची", text: "शेवटी उत्तरसूची द्या." },
    { label: "स्रोत", text: "मी तपासू शकेन असे स्रोत सांगा, जसे NCERT पुस्तकातील धडे." },
    { label: "पूर्वग्रह नको", text: "सर्वसमावेशक आणि आदरपूर्वक लिहा: लिंग, जात, धर्म किंवा प्रदेश यांबद्दल कोणतेही पूर्वग्रह नकोत." },
    { label: "कमी खर्चाचा उपक्रम", text: "फक्त स्वस्त साहित्य लागेल असा एक वर्ग-उपक्रम समाविष्ट करा." },
    { label: "सोपे + कठीण", text: "वेगवेगळ्या विद्यार्थ्यांसाठी एक सोपे आणि एक जास्त आव्हानात्मक रूप द्या." }
  ],
  templates: {
    lesson5e: {
      title: "पाठ नियोजन (5E)",
      desc: "40 मिनिटांचा उपक्रमाधारित पाठ",
      role: "उपक्रमाधारित पाठांचे नियोजन करणारे एक अनुभवी CBSE विज्ञान शिक्षक",
      task: "[विषय] वर 5E प्रारूप वापरून 40 मिनिटांचे पाठ नियोजन तयार करा: Engage (गुंतवणे), Explore (शोध), Explain (स्पष्टीकरण), Elaborate (विस्तार), Evaluate (मूल्यमापन).",
      context: "इयत्ता [7] वी विज्ञान, NCERT धडा “[धड्याचे नाव]”. वर्गात सुमारे 40 विद्यार्थी, एक स्मार्टबोर्ड आणि फक्त साधे साहित्य आहे. काही विद्यार्थ्यांना इंग्रजी कठीण जाते.",
      cons: "प्रत्येक टप्प्याची वेळ लिहा; एकूण वेळ 40 मिनिटेच असावी.\nभारतीय शाळेत सहज मिळणारे स्वस्त साहित्य वापरा.\nशेवटी समज तपासण्यासाठी 3 छोटे प्रश्न द्या.\nएक छोटा गृहपाठ सुचवा.",
      ex: "Engage (5 मिनिटे): बर्फाच्या थंड पाण्याचा ग्लास दाखवून विचारा, “ग्लासच्या बाहेरचे हे थेंब कुठून आले?”"
    },
    mcq10: {
      title: "धड्यावर 10 MCQ",
      desc: "उत्तरसूचीसह उजळणी प्रश्नमंजुषा",
      role: "काळजीपूर्वक प्रश्नपत्रिका तयार करणारे एक CBSE पेपर-सेटर",
      task: "“[धड्याचे नाव]” या धड्यावर 10 बहुपर्यायी प्रश्न (MCQ) लिहा.",
      context: "इयत्ता [9] वी [विषय], NCERT पुस्तक. धडा पूर्ण झाल्यानंतरची ही उजळणी चाचणी आहे.",
      cons: "काठिण्य मिसळा: 4 सोपे, 4 मध्यम आणि 2 कठीण प्रश्न.\nप्रत्येक प्रश्नाचे एकच बरोबर उत्तर असावे.\n“वरील सर्व” किंवा “यापैकी नाही” असे पर्याय वापरू नका.\nप्रत्येक उत्तराच्या एका ओळीच्या कारणासह उत्तरसूची द्या.",
      ex: "प्र1. अन्न तयार करण्यासाठी वनस्पती कोणता वायू घेतात?\n(A) ऑक्सिजन  (B) कार्बन डायऑक्साइड  (C) नायट्रोजन  (D) हायड्रोजन\nउत्तर: (B). वनस्पती सूर्यप्रकाशात कार्बन डायऑक्साइड आणि पाणी वापरून अन्न तयार करतात."
    },
    explain: {
      title: "संकल्पना सोप्या भाषेत",
      desc: "रोजच्या भारतीय उदाहरणासह",
      role: "कठीण गोष्टी सोप्या शब्दांत समजावणारे एक संयमी शिक्षक",
      task: "[संकल्पना, उदा. घर्षण] सोप्या शब्दांत समजावून सांगा.",
      context: "विद्यार्थी हे पहिल्यांदाच शिकत आहेत. भारतातील रोजच्या जीवनातील एक उदाहरण द्या, जसे स्वयंपाकघर, क्रिकेट सामना, रेल्वे प्रवास किंवा एखादा सण.",
      cons: "एका ओळीच्या व्याख्येने सुरुवात करा.\nरोजच्या भारतीय जीवनातील एक उदाहरण द्या.\nशेवटी विद्यार्थ्यांना विचार करायला लावणारा एक प्रश्न द्या.\nतांत्रिक शब्द वापरल्यास त्याचा अर्थ सांगा.",
      ex: "दोन पृष्ठभाग एकमेकांवर घासले जातात तेव्हा वस्तूंचा वेग कमी करणाऱ्या बलाला घर्षण म्हणतात. म्हणूनच गवतावरून घरंगळणारा क्रिकेटचा चेंडू हळूहळू थांबतो."
    },
    rubric: {
      title: "मूल्यमापन रुब्रिक",
      desc: "प्रकल्पासाठी न्याय्य निकष आणि स्तर",
      role: "न्याय्य मूल्यमापन रुब्रिक तयार करणारे एक अनुभवी शिक्षक",
      task: "[असाइनमेंट, उदा. विज्ञान प्रतिकृती] साठी एक मूल्यमापन रुब्रिक तयार करा.",
      context: "इयत्ता [8] वी. प्रकल्प 20 गुणांचा आहे. विद्यार्थ्यांनी 4-4 च्या गटांत दोन आठवडे काम केले.",
      cons: "4 निकष आणि 4 स्तर वापरा: उत्कृष्ट, चांगले, समाधानकारक, सुधारणा आवश्यक.\nप्रत्येक स्तराचे वर्णन एका स्पष्ट वाक्यात करा.\nप्रत्येक स्तराचे गुण दाखवा, आणि एकूण 20 च होतील याची खात्री करा.\nगटकार्यासाठी एक निकष नक्की ठेवा.",
      ex: ""
    },
    parentletter: {
      title: "पालकांसाठी सूचना",
      desc: "शाळेच्या कार्यक्रमाची स्पष्ट, नम्र सूचना",
      role: "पालकांसाठी स्पष्ट आणि नम्र सूचना लिहिणारे एक मुख्याध्यापक",
      task: "[कार्यक्रम, उदा. पालक-शिक्षक सभा] याबद्दल पालकांसाठी एक सूचना लिहा.",
      context: "तारीख: [तारीख]. वेळ: [वेळ]. ठिकाण: [शाळेचे सभागृह]. अनेक पालकांना इंग्रजीपेक्षा आपली घरची भाषा जास्त सोयीची वाटते.",
      cons: "150 शब्दांपेक्षा कमी ठेवा.\nतारीख, वेळ, ठिकाण आणि पालकांनी काय आणावे ते लिहा.\nशेवटी एक छोटी उत्तर-चिठ्ठी जोडा.\nकोणत्याही विद्यार्थ्याचे नाव किंवा फोन नंबर लिहू नका.",
      ex: ""
    },
    story: {
      title: "मुलांसाठी गोष्ट",
      desc: "प्रश्नांसह एक छोटी बोधकथा",
      role: "भारतातील एक बालकथाकार",
      task: "[मूल्य, उदा. वाटून घेणे किंवा पाणी वाचवणे] शिकवणारी मुलांसाठी एक छोटी गोष्ट लिहा.",
      context: "ही गोष्ट इयत्ता [3] री च्या मुलांसाठी आहे. गोष्ट एखाद्या भारतीय गावात किंवा शहरात घडावी, भारतीय नावे आणि मुलांना माहीत असलेले प्राणी असावेत.",
      cons: "छोटी वाक्ये आणि सोपे शब्द वापरा.\nथोडे संवाद ठेवा.\nशेवटी एका ओळीत तात्पर्य लिहा.\nगोष्टीवर 3 सोपे प्रश्न जोडा.",
      ex: ""
    },
    essayfb: {
      title: "निबंधावर अभिप्राय",
      desc: "विद्यार्थ्याला उपयोगी, प्रेमळ आणि नेमका अभिप्राय",
      role: "एक प्रेमळ आणि प्रामाणिक भाषा शिक्षक",
      task: "खालील विद्यार्थ्याच्या निबंधावर अभिप्राय द्या.",
      context: "इयत्ता [9] वीचा निबंध, विषय “[विषय]”. शब्दमर्यादा 250 शब्द होती. निबंध (विद्यार्थ्याच्या नावाशिवाय): [निबंध इथे पेस्ट करा]",
      cons: "आधी विद्यार्थ्याने चांगल्या केलेल्या 2 गोष्टी सांगा.\nमग सुधारणेचे 3 नेमके मार्ग सांगा, प्रत्येकासोबत एक उदाहरण-वाक्य.\nविचार, मांडणी आणि व्याकरण यांवर वेगवेगळे भाष्य करा.\nसंपूर्ण निबंध पुन्हा लिहू नका.\n10 पैकी गुण द्या आणि थोडक्यात कारण सांगा.",
      ex: ""
    },
    timetable: {
      title: "अभ्यासाचे वेळापत्रक",
      desc: "परीक्षेपूर्वीचे व्यवहार्य साप्ताहिक नियोजन",
      role: "विद्यार्थ्यांना व्यवहार्य नियोजन करायला मदत करणारे एक स्टडी कोच",
      task: "माझ्या परीक्षेसाठी अभ्यासाचे साप्ताहिक वेळापत्रक तयार करा; परीक्षा [तारीख] पासून सुरू होत आहे.",
      context: "मी इयत्ता [10] वीत आहे. शाळा सकाळी 8 ते दुपारी 2 पर्यंत असते. माझे विषय: गणित, विज्ञान, सामाजिक शास्त्र, इंग्रजी आणि [दुसरी भाषा]. माझा सर्वात कच्चा विषय [विषय] आहे.",
      cons: "छोट्या विश्रांती, खेळाचा वेळ आणि 8 तासांची झोप समाविष्ट करा.\nसर्वात कच्च्या विषयाला जास्त वेळ द्या.\nदर आठवड्यात एक दिवस उजळणीसाठी ठेवा.\nरविवारची संध्याकाळ मोकळी ठेवा.",
      ex: ""
    },
    debate: {
      title: "वादविवादाचे मुद्दे",
      desc: "बाजूचे आणि विरोधातील संतुलित मुद्दे",
      role: "एक अनुभवी वादविवाद प्रशिक्षक",
      task: "या विषयाच्या बाजूने आणि विरोधात मुद्दे द्या: “[विषय, उदा. शाळेत मोबाइल फोनला परवानगी असावी]”.",
      context: "इयत्ता [11] वीच्या विद्यार्थ्यांच्या आंतरशालेय वादविवाद स्पर्धेसाठी. प्रत्येक वक्त्याला 3 मिनिटे मिळतील.",
      cons: "बाजूने 5 आणि विरोधात 5 मुद्दे द्या.\nप्रत्येक मुद्द्यासोबत एक तथ्य किंवा उदाहरण द्या, आणि मी पुन्हा तपासावीत अशी तथ्ये चिन्हांकित करा.\nप्रत्येक बाजूसाठी 2 संभाव्य प्रतिवाद जोडा.\nमांडणी संतुलित आणि आदरपूर्ण ठेवा.",
      ex: ""
    },
    summary: {
      title: "नोट्सचा सारांश",
      desc: "लांब नोट्सचे उजळणीचे मुद्दे बनवा",
      role: "स्पष्ट उजळणी नोट्स तयार करणारा एक अभ्यास-सहायक",
      task: "खाली दिलेल्या माझ्या नोट्सचा सारांश उजळणीसाठी मुख्य मुद्द्यांत करा.",
      context: "[विषय] वरील या माझ्या वर्गातील नोट्स आहेत: [तुमच्या नोट्स इथे पेस्ट करा]",
      cons: "जास्तीत जास्त 10 मुद्दे वापरा.\nसर्व महत्त्वाच्या संज्ञा, तारखा आणि सूत्रे ठेवा.\nस्वतःची चाचणी घेण्यासाठी 3 प्रश्न जोडा.\nमाझ्या नोट्समध्ये नसलेले काहीही जोडू नका.",
      ex: ""
    },
    interview: {
      title: "मुलाखतीचा सराव",
      desc: "एका वेळी एक प्रश्न, मॉक मुलाखत",
      role: "[नोकरी किंवा महाविद्यालय प्रवेश] साठी एक मैत्रीपूर्ण मुलाखतकार",
      task: "मुलाखतीच्या सरावात मला मदत करा. एका वेळी एकच प्रश्न विचारा, माझ्या उत्तराची वाट पाहा, मग अभिप्राय द्या.",
      context: "मी [B.Com अंतिम वर्षाचा/ची विद्यार्थी] आहे आणि [नोकरी किंवा अभ्यासक्रम] साठी अर्ज करत आहे. मला दडपण येते आणि मी खूप छोटी उत्तरे देतो/देते.",
      cons: "एकूण 8 प्रश्न विचारा, सोप्याकडून कठीणकडे.\nप्रत्येक उत्तरानंतर एक चांगली बाजू आणि सुधारण्याची एक गोष्ट सांगा.\nशेवटी छोटा सारांश आणि 3 टिप्स द्या.\nमाझे खरे नाव, फोन नंबर किंवा पत्ता विचारू नका.",
      ex: ""
    }
  }
};

window.APP_CONTENT.gu = {
  asm: {
    role: "તમે {x} છો.",
    task: "કામ: {x}",
    context: "પૃષ્ઠભૂમિ: {x}",
    aud: "આ કોના માટે છે: {x}. તેઓ સહેલાઈથી સમજી શકે તેવા શબ્દો અને ઉદાહરણો વાપરો.",
    audv: {
      c1_5: "ધોરણ 1–5નાં બાળકો (આશરે 6–10 વર્ષ)",
      c6_8: "ધોરણ 6–8ના વિદ્યાર્થીઓ (આશરે 11–13 વર્ષ)",
      c9_10: "ધોરણ 9–10ના વિદ્યાર્થીઓ (આશરે 14–15 વર્ષ)",
      c11_12: "ધોરણ 11–12ના વિદ્યાર્થીઓ (આશરે 16–17 વર્ષ)",
      ug: "કૉલેજના વિદ્યાર્થીઓ",
      teachers: "શાળાના શિક્ષકો",
      parents: "શાળાએ જતાં બાળકોનાં વાલીઓ",
      general: "સામાન્ય વાચકો"
    },
    fmt: {
      list: "ફૉર્મેટ: જવાબ ટૂંકા, સ્પષ્ટ મુદ્દાઓની ક્રમાંકિત યાદીમાં આપો.",
      table: "ફૉર્મેટ: જવાબ કોષ્ટકમાં આપો, દરેક કૉલમનું શીર્ષક સ્પષ્ટ હોય.",
      paragraph: "ફૉર્મેટ: ટૂંકા, વ્યવસ્થિત ફકરાઓમાં લખો.",
      quiz: "ફૉર્મેટ: આને ક્વિઝ બનાવો. દરેક પ્રશ્નના ચાર વિકલ્પ (A–D) આપો, અને અંતે એક લીટીની સમજૂતી સાથે ઉત્તરસૂચિ આપો.",
      steps: "ફૉર્મેટ: પગલે પગલે સમજાવો, દરેક પગલાને ક્રમાંક અને ટૂંકું શીર્ષક આપો.",
      letter: "ફૉર્મેટ: આને ઔપચારિક પત્ર કે સૂચના તરીકે લખો: તારીખ, વિષય, સંબોધન, મુખ્ય સંદેશ અને અંતે નામ/હોદ્દો."
    },
    tone: "શૈલી: {x}.",
    tonev: {
      friendly: "મૈત્રીપૂર્ણ અને લાગણીભરી",
      formal: "ઔપચારિક અને વિનમ્ર",
      encouraging: "પ્રોત્સાહક અને હકારાત્મક",
      simple: "સરળ અને સ્પષ્ટ",
      fun: "મજેદાર અને જીવંત",
      neutral: "તટસ્થ અને સંતુલિત"
    },
    len: {
      vshort: "લંબાઈ: ખૂબ ટૂંકું, આશરે 100 શબ્દ.",
      short: "લંબાઈ: ટૂંકું, આશરે 150–250 શબ્દ.",
      medium: "લંબાઈ: મધ્યમ, આશરે 300–500 શબ્દ.",
      long: "લંબાઈ: વિગતવાર અને પૂરું, પણ બિનજરૂરી વાતો વગર."
    },
    lang: "ભાષા: આખો જવાબ સરળ ગુજરાતીમાં લખો.",
    rules: "આ નિયમોનું પાલન કરો:",
    example: "મને જોઈતી શૈલીનું એક ઉદાહરણ:",
    ask: "જો કોઈ મહત્ત્વની માહિતી ખૂટતી હોય, તો પહેલાં મને વધુમાં વધુ 3 ટૂંકા પ્રશ્નો પૂછો, પછી જવાબ આપો.",
    unsure: "કોઈ તથ્ય વિશે ખાતરી ન હોય તો અંદાજ લગાવવાને બદલે સ્પષ્ટ કહો."
  },
  chips: [
    { label: "ભારતીય ઉદાહરણો", text: "રોજિંદા ભારતીય જીવનમાંથી ઉદાહરણો આપો (ભારતીય નામ, સ્થળો, ખોરાક, તહેવારો, ₹)." },
    { label: "NCERT અભ્યાસક્રમ", text: "આ ધોરણના NCERT/CBSE અભ્યાસક્રમની અંદર જ રહો." },
    { label: "સરળ શબ્દો", text: "સરળ શબ્દો વાપરો, અને અઘરા શબ્દનો અર્થ કૌંસમાં આપો." },
    { label: "ઉત્તરસૂચિ", text: "અંતે ઉત્તરસૂચિ આપો." },
    { label: "સ્રોત", text: "હું ચકાસી શકું તેવા સ્રોત જણાવો, જેમ કે NCERT પુસ્તકનાં પ્રકરણો." },
    { label: "પૂર્વગ્રહ નહીં", text: "સૌને સમાવતું અને આદરપૂર્ણ લખો: જાતિ, લિંગ, ધર્મ કે પ્રદેશ વિશે કોઈ પૂર્વગ્રહ નહીં." },
    { label: "ઓછા ખર્ચની પ્રવૃત્તિ", text: "ફક્ત સસ્તી સામગ્રીથી થાય તેવી એક વર્ગ પ્રવૃત્તિ ઉમેરો." },
    { label: "સરળ + અઘરું", text: "જુદા જુદા વિદ્યાર્થીઓ માટે એક સરળ અને એક વધુ પડકારજનક રૂપ આપો." }
  ],
  templates: {
    lesson5e: {
      title: "પાઠ યોજના (5E)",
      desc: "40 મિનિટનો પ્રવૃત્તિ-આધારિત પાઠ",
      role: "પ્રવૃત્તિ-આધારિત પાઠનું આયોજન કરતા એક અનુભવી CBSE વિજ્ઞાન શિક્ષક",
      task: "[વિષય] પર 5E મૉડેલથી 40 મિનિટની પાઠ યોજના બનાવો: Engage (જોડવું), Explore (શોધવું), Explain (સમજાવવું), Elaborate (વિસ્તારવું), Evaluate (મૂલ્યાંકન).",
      context: "ધોરણ [7] વિજ્ઞાન, NCERT પ્રકરણ “[પ્રકરણનું નામ]”. વર્ગમાં આશરે 40 વિદ્યાર્થીઓ, એક સ્માર્ટબોર્ડ અને ફક્ત સાદી સામગ્રી છે. કેટલાક વિદ્યાર્થીઓને અંગ્રેજી અઘરું લાગે છે.",
      cons: "દરેક તબક્કાનો સમય લખો; કુલ સમય 40 મિનિટ જ હોય.\nભારતીય શાળામાં સહેલાઈથી મળે તેવી સસ્તી સામગ્રી વાપરો.\nઅંતે સમજ ચકાસવા 3 ટૂંકા પ્રશ્નો આપો.\nએક નાનું ગૃહકાર્ય સૂચવો.",
      ex: "Engage (5 મિનિટ): બરફવાળા ઠંડા પાણીનો ગ્લાસ બતાવીને પૂછો, “ગ્લાસની બહાર આ ટીપાં ક્યાંથી આવ્યાં?”"
    },
    mcq10: {
      title: "પ્રકરણ પર 10 MCQ",
      desc: "ઉત્તરસૂચિ સાથે પુનરાવર્તન ક્વિઝ",
      role: "કાળજીપૂર્વક પ્રશ્નપત્ર બનાવતા એક CBSE પેપર-સેટર",
      task: "“[પ્રકરણનું નામ]” પ્રકરણ પર 10 બહુવિકલ્પી પ્રશ્નો (MCQ) લખો.",
      context: "ધોરણ [9] [વિષય], NCERT પુસ્તક. પ્રકરણ પૂરું થયા પછીની આ પુનરાવર્તન કસોટી છે.",
      cons: "મુશ્કેલી મિશ્ર રાખો: 4 સરળ, 4 મધ્યમ અને 2 અઘરા પ્રશ્નો.\nદરેક પ્રશ્નનો ફક્ત એક જ સાચો જવાબ હોય.\n“ઉપરના બધા” કે “એક પણ નહીં” જેવા વિકલ્પ ન રાખો.\nદરેક જવાબના એક લીટીના કારણ સાથે ઉત્તરસૂચિ આપો.",
      ex: "પ્ર1. વનસ્પતિ ખોરાક બનાવવા કયો વાયુ લે છે?\n(A) ઑક્સિજન  (B) કાર્બન ડાયૉક્સાઇડ  (C) નાઇટ્રોજન  (D) હાઇડ્રોજન\nજવાબ: (B). વનસ્પતિ સૂર્યપ્રકાશમાં કાર્બન ડાયૉક્સાઇડ અને પાણીથી ખોરાક બનાવે છે."
    },
    explain: {
      title: "ખ્યાલ સરળ રીતે સમજાવો",
      desc: "રોજિંદા ભારતીય ઉદાહરણ સાથે",
      role: "અઘરી વાતો સરળ શબ્દોમાં સમજાવતા એક ધીરજવાન શિક્ષક",
      task: "[ખ્યાલ, દા.ત. ઘર્ષણ] સરળ શબ્દોમાં સમજાવો.",
      context: "વિદ્યાર્થીઓ આ પહેલી વાર શીખી રહ્યા છે. ભારતના રોજિંદા જીવનમાંથી એક ઉદાહરણ આપો, જેમ કે રસોડું, ક્રિકેટ મૅચ, ટ્રેનની મુસાફરી કે કોઈ તહેવાર.",
      cons: "એક લીટીની વ્યાખ્યાથી શરૂ કરો.\nરોજિંદા ભારતીય જીવનમાંથી એક ઉદાહરણ આપો.\nઅંતે વિદ્યાર્થીઓને વિચારતા કરે એવો એક પ્રશ્ન આપો.\nકોઈ તકનીકી શબ્દ વાપરો તો તેનો અર્થ સમજાવો.",
      ex: "બે સપાટીઓ એકબીજા સાથે ઘસાય ત્યારે વસ્તુઓને ધીમી પાડતા બળને ઘર્ષણ કહેવાય. એટલે જ ઘાસ પર ગબડતો ક્રિકેટનો દડો ધીમે ધીમે અટકી જાય છે."
    },
    rubric: {
      title: "મૂલ્યાંકન રૂબ્રિક",
      desc: "પ્રોજેક્ટ માટે ન્યાયી માપદંડો અને સ્તરો",
      role: "ન્યાયી મૂલ્યાંકન રૂબ્રિક બનાવતા એક અનુભવી શિક્ષક",
      task: "[સોંપણી, દા.ત. વિજ્ઞાન મૉડેલ] માટે મૂલ્યાંકન રૂબ્રિક બનાવો.",
      context: "ધોરણ [8]. પ્રોજેક્ટ 20 ગુણનો છે. વિદ્યાર્થીઓએ 4-4ના જૂથમાં બે અઠવાડિયાં કામ કર્યું.",
      cons: "4 માપદંડ અને 4 સ્તર રાખો: ઉત્તમ, સારું, સંતોષકારક, સુધારાની જરૂર.\nદરેક સ્તરને એક સ્પષ્ટ વાક્યમાં વર્ણવો.\nદરેક સ્તરના ગુણ બતાવો, અને કુલ 20 જ થાય તેની ખાતરી કરો.\nજૂથકાર્ય માટે એક માપદંડ જરૂર રાખો.",
      ex: ""
    },
    parentletter: {
      title: "વાલીઓ માટે સૂચના",
      desc: "શાળાના કાર્યક્રમની સ્પષ્ટ, વિનમ્ર સૂચના",
      role: "વાલીઓ માટે સ્પષ્ટ અને વિનમ્ર સૂચનાઓ લખતા એક આચાર્ય",
      task: "[કાર્યક્રમ, દા.ત. વાલી-શિક્ષક બેઠક] વિશે વાલીઓ માટે એક સૂચના લખો.",
      context: "તારીખ: [તારીખ]. સમય: [સમય]. સ્થળ: [શાળાનો હૉલ]. ઘણા વાલીઓ અંગ્રેજી કરતાં પોતાની ઘરની ભાષામાં વધુ સહજ છે.",
      cons: "150 શબ્દોથી ઓછું રાખો.\nતારીખ, સમય, સ્થળ અને વાલીઓએ શું લાવવાનું છે તે લખો.\nઅંતે એક નાની જવાબ-ચિઠ્ઠી ઉમેરો.\nકોઈ વિદ્યાર્થીનું નામ કે ફોન નંબર ન લખો.",
      ex: ""
    },
    story: {
      title: "બાળકો માટે વાર્તા",
      desc: "પ્રશ્નો સાથે એક નાની બોધકથા",
      role: "ભારતના એક બાળવાર્તાકાર",
      task: "બાળકો માટે એક નાની વાર્તા લખો જે [મૂલ્ય, દા.ત. વહેંચીને રહેવું કે પાણી બચાવવું] શીખવે.",
      context: "વાર્તા ધોરણ [3]નાં બાળકો માટે છે. વાર્તા કોઈ ભારતીય ગામ કે નગરમાં બને, ભારતીય નામો અને બાળકો ઓળખતાં હોય તેવાં પ્રાણીઓ સાથે.",
      cons: "ટૂંકાં વાક્યો અને સરળ શબ્દો વાપરો.\nથોડા સંવાદ રાખો.\nઅંતે એક લીટીમાં બોધ લખો.\nવાર્તા પર 3 સરળ પ્રશ્નો ઉમેરો.",
      ex: ""
    },
    essayfb: {
      title: "નિબંધ પર પ્રતિભાવ",
      desc: "વિદ્યાર્થીને કામ આવે તેવો માયાળુ, ચોક્કસ પ્રતિભાવ",
      role: "એક માયાળુ અને પ્રામાણિક ભાષા શિક્ષક",
      task: "નીચે આપેલા વિદ્યાર્થીના નિબંધ પર પ્રતિભાવ આપો.",
      context: "ધોરણ [9]નો નિબંધ, વિષય “[વિષય]”. શબ્દમર્યાદા 250 શબ્દ હતી. નિબંધ (વિદ્યાર્થીના નામ વગર): [નિબંધ અહીં પેસ્ટ કરો]",
      cons: "પહેલાં વિદ્યાર્થીએ સારી કરેલી 2 બાબતો કહો.\nપછી સુધારાના 3 ચોક્કસ રસ્તા કહો, દરેક સાથે એક ઉદાહરણ-વાક્ય.\nવિચારો, રચના અને વ્યાકરણ પર અલગ અલગ ટિપ્પણી કરો.\nઆખો નિબંધ ફરીથી ન લખો.\n10માંથી ગુણ આપો અને ટૂંકું કારણ જણાવો.",
      ex: ""
    },
    timetable: {
      title: "અભ્યાસનું સમયપત્રક",
      desc: "પરીક્ષા પહેલાંની વ્યવહારુ સાપ્તાહિક યોજના",
      role: "વિદ્યાર્થીઓને વ્યવહારુ યોજના બનાવવામાં મદદ કરતા એક સ્ટડી કોચ",
      task: "મારી પરીક્ષા માટે અભ્યાસનું સાપ્તાહિક સમયપત્રક બનાવો; પરીક્ષા [તારીખ]થી શરૂ થાય છે.",
      context: "હું ધોરણ [10]માં છું. શાળા સવારે 8 થી બપોરે 2 સુધી છે. મારા વિષયો: ગણિત, વિજ્ઞાન, સામાજિક વિજ્ઞાન, અંગ્રેજી અને [બીજી ભાષા]. મારો સૌથી નબળો વિષય [વિષય] છે.",
      cons: "નાના વિરામ, રમવાનો સમય અને 8 કલાકની ઊંઘ સામેલ કરો.\nસૌથી નબળા વિષયને વધુ સમય આપો.\nદર અઠવાડિયે એક દિવસ પુનરાવર્તન માટે રાખો.\nરવિવારની સાંજ ખાલી રાખો.",
      ex: ""
    },
    debate: {
      title: "ચર્ચાના મુદ્દા",
      desc: "તરફેણ અને વિરોધના સંતુલિત મુદ્દા",
      role: "એક અનુભવી ચર્ચા-સભા કોચ",
      task: "આ વિષયની તરફેણમાં અને વિરોધમાં મુદ્દા આપો: “[વિષય, દા.ત. શાળામાં મોબાઇલ ફોનની છૂટ હોવી જોઈએ]”.",
      context: "ધોરણ [11]ના વિદ્યાર્થીઓની આંતરશાળા ચર્ચા સ્પર્ધા માટે. દરેક વક્તાને 3 મિનિટ મળશે.",
      cons: "તરફેણમાં 5 અને વિરોધમાં 5 મુદ્દા આપો.\nદરેક મુદ્દા સાથે એક તથ્ય કે ઉદાહરણ આપો, અને મારે ફરી ચકાસવાં જોઈએ તેવાં તથ્યો પર નિશાની કરો.\nદરેક પક્ષ માટે 2 સંભવિત વળતા જવાબ ઉમેરો.\nરજૂઆત સંતુલિત અને આદરપૂર્ણ રાખો.",
      ex: ""
    },
    summary: {
      title: "નોંધનો સારાંશ",
      desc: "લાંબી નોંધને પુનરાવર્તનના મુદ્દામાં ફેરવો",
      role: "સ્પષ્ટ પુનરાવર્તન નોંધ બનાવતા એક અભ્યાસ-સહાયક",
      task: "નીચે આપેલી મારી નોંધનો સારાંશ પુનરાવર્તન માટેના મુખ્ય મુદ્દાઓમાં બનાવો.",
      context: "[વિષય] પરની આ મારી વર્ગની નોંધ છે: [તમારી નોંધ અહીં પેસ્ટ કરો]",
      cons: "વધુમાં વધુ 10 મુદ્દા રાખો.\nબધા મહત્ત્વના શબ્દો, તારીખો અને સૂત્રો જાળવી રાખો.\nજાતે ચકાસવા માટે 3 પ્રશ્નો ઉમેરો.\nમારી નોંધમાં ન હોય એવું કંઈ ઉમેરશો નહીં.",
      ex: ""
    },
    interview: {
      title: "ઇન્ટરવ્યૂની પ્રૅક્ટિસ",
      desc: "એક સમયે એક પ્રશ્નવાળો મૉક ઇન્ટરવ્યૂ",
      role: "[નોકરી કે કૉલેજ પ્રવેશ] માટે એક મૈત્રીપૂર્ણ ઇન્ટરવ્યૂ લેનાર",
      task: "ઇન્ટરવ્યૂની પ્રૅક્ટિસમાં મને મદદ કરો. એક સમયે એક જ પ્રશ્ન પૂછો, મારા જવાબની રાહ જુઓ, પછી પ્રતિભાવ આપો.",
      context: "હું [B.Comના છેલ્લા વર્ષનો/ની વિદ્યાર્થી] છું અને [નોકરી કે અભ્યાસક્રમ] માટે અરજી કરું છું. હું ગભરાઈ જાઉં છું અને બહુ ટૂંકા જવાબ આપું છું.",
      cons: "કુલ 8 પ્રશ્નો પૂછો, સરળથી અઘરા તરફ.\nદરેક જવાબ પછી એક ખૂબી અને સુધારાની એક વાત કહો.\nઅંતે ટૂંકો સારાંશ અને 3 ટિપ્સ આપો.\nમારું સાચું નામ, ફોન નંબર કે સરનામું ન પૂછો.",
      ex: ""
    }
  }
};

window.APP_CONTENT.pa = {
  asm: {
    role: "ਤੁਸੀਂ {x} ਹੋ।",
    task: "ਕੰਮ: {x}",
    context: "ਪਿਛੋਕੜ: {x}",
    aud: "ਇਹ ਕਿਸ ਲਈ ਹੈ: {x}। ਅਜਿਹੇ ਸ਼ਬਦ ਅਤੇ ਉਦਾਹਰਨਾਂ ਵਰਤੋ ਜੋ ਉਹ ਸੌਖਿਆਂ ਸਮਝ ਸਕਣ।",
    audv: {
      c1_5: "ਜਮਾਤ 1–5 ਦੇ ਬੱਚੇ (ਲਗਭਗ 6–10 ਸਾਲ)",
      c6_8: "ਜਮਾਤ 6–8 ਦੇ ਵਿਦਿਆਰਥੀ (ਲਗਭਗ 11–13 ਸਾਲ)",
      c9_10: "ਜਮਾਤ 9–10 ਦੇ ਵਿਦਿਆਰਥੀ (ਲਗਭਗ 14–15 ਸਾਲ)",
      c11_12: "ਜਮਾਤ 11–12 ਦੇ ਵਿਦਿਆਰਥੀ (ਲਗਭਗ 16–17 ਸਾਲ)",
      ug: "ਕਾਲਜ ਦੇ ਵਿਦਿਆਰਥੀ",
      teachers: "ਸਕੂਲ ਦੇ ਅਧਿਆਪਕ",
      parents: "ਸਕੂਲੀ ਬੱਚਿਆਂ ਦੇ ਮਾਪੇ",
      general: "ਆਮ ਪਾਠਕ"
    },
    fmt: {
      list: "ਫ਼ਾਰਮੈਟ: ਜਵਾਬ ਛੋਟੇ ਅਤੇ ਸਾਫ਼ ਨੁਕਤਿਆਂ ਦੀ ਨੰਬਰ ਵਾਲੀ ਸੂਚੀ ਵਿੱਚ ਦਿਓ।",
      table: "ਫ਼ਾਰਮੈਟ: ਜਵਾਬ ਇੱਕ ਸਾਰਣੀ ਵਿੱਚ ਦਿਓ, ਜਿਸ ਦੇ ਹਰ ਕਾਲਮ ਦਾ ਸਿਰਲੇਖ ਸਾਫ਼ ਹੋਵੇ।",
      paragraph: "ਫ਼ਾਰਮੈਟ: ਛੋਟੇ, ਤਰਤੀਬਵਾਰ ਪੈਰਿਆਂ ਵਿੱਚ ਲਿਖੋ।",
      quiz: "ਫ਼ਾਰਮੈਟ: ਇਸ ਨੂੰ ਕੁਇਜ਼ ਬਣਾਓ। ਹਰ ਸਵਾਲ ਦੇ ਚਾਰ ਵਿਕਲਪ (A–D) ਦਿਓ, ਅਤੇ ਅਖ਼ੀਰ ਵਿੱਚ ਇੱਕ-ਇੱਕ ਲਾਈਨ ਦੀ ਵਿਆਖਿਆ ਨਾਲ ਉੱਤਰ-ਕੁੰਜੀ ਦਿਓ।",
      steps: "ਫ਼ਾਰਮੈਟ: ਕਦਮ-ਦਰ-ਕਦਮ ਸਮਝਾਓ, ਹਰ ਕਦਮ ਨੂੰ ਨੰਬਰ ਅਤੇ ਛੋਟਾ ਸਿਰਲੇਖ ਦਿਓ।",
      letter: "ਫ਼ਾਰਮੈਟ: ਇਸ ਨੂੰ ਰਸਮੀ ਚਿੱਠੀ ਜਾਂ ਸੂਚਨਾ ਵਾਂਗ ਲਿਖੋ: ਤਾਰੀਖ਼, ਵਿਸ਼ਾ, ਸੰਬੋਧਨ, ਮੁੱਖ ਸੁਨੇਹਾ ਅਤੇ ਅਖ਼ੀਰ ਵਿੱਚ ਨਾਂ/ਅਹੁਦਾ।"
    },
    tone: "ਲਹਿਜਾ: {x}।",
    tonev: {
      friendly: "ਦੋਸਤਾਨਾ ਅਤੇ ਅਪਣੱਤ ਭਰਿਆ",
      formal: "ਰਸਮੀ ਅਤੇ ਨਿਮਰ",
      encouraging: "ਹੌਸਲਾ ਵਧਾਉਣ ਵਾਲਾ ਅਤੇ ਸਕਾਰਾਤਮਕ",
      simple: "ਸੌਖਾ ਅਤੇ ਸਾਫ਼",
      fun: "ਮਜ਼ੇਦਾਰ ਅਤੇ ਜੋਸ਼ੀਲਾ",
      neutral: "ਨਿਰਪੱਖ ਅਤੇ ਸੰਤੁਲਿਤ"
    },
    len: {
      vshort: "ਲੰਬਾਈ: ਬਹੁਤ ਛੋਟਾ, ਲਗਭਗ 100 ਸ਼ਬਦ।",
      short: "ਲੰਬਾਈ: ਛੋਟਾ, ਲਗਭਗ 150–250 ਸ਼ਬਦ।",
      medium: "ਲੰਬਾਈ: ਦਰਮਿਆਨਾ, ਲਗਭਗ 300–500 ਸ਼ਬਦ।",
      long: "ਲੰਬਾਈ: ਵਿਸਥਾਰ ਨਾਲ ਅਤੇ ਪੂਰਾ, ਪਰ ਫ਼ਾਲਤੂ ਗੱਲਾਂ ਤੋਂ ਬਿਨਾਂ।"
    },
    lang: "ਭਾਸ਼ਾ: ਸਾਰਾ ਜਵਾਬ ਸੌਖੀ ਪੰਜਾਬੀ ਵਿੱਚ ਲਿਖੋ।",
    rules: "ਇਹਨਾਂ ਨਿਯਮਾਂ ਦੀ ਪਾਲਣਾ ਕਰੋ:",
    example: "ਮੈਨੂੰ ਜਿਹੋ ਜਿਹਾ ਅੰਦਾਜ਼ ਚਾਹੀਦਾ ਹੈ, ਉਸ ਦੀ ਇੱਕ ਉਦਾਹਰਨ:",
    ask: "ਜੇ ਕੋਈ ਜ਼ਰੂਰੀ ਜਾਣਕਾਰੀ ਰਹਿ ਗਈ ਹੈ, ਤਾਂ ਪਹਿਲਾਂ ਮੈਨੂੰ ਵੱਧ ਤੋਂ ਵੱਧ 3 ਛੋਟੇ ਸਵਾਲ ਪੁੱਛੋ, ਫਿਰ ਜਵਾਬ ਦਿਓ।",
    unsure: "ਜੇ ਕਿਸੇ ਤੱਥ ਬਾਰੇ ਪੱਕਾ ਪਤਾ ਨਾ ਹੋਵੇ, ਤਾਂ ਅੰਦਾਜ਼ਾ ਲਾਉਣ ਦੀ ਥਾਂ ਸਾਫ਼ ਦੱਸ ਦਿਓ।"
  },
  chips: [
    { label: "ਭਾਰਤੀ ਉਦਾਹਰਨਾਂ", text: "ਰੋਜ਼ਾਨਾ ਭਾਰਤੀ ਜ਼ਿੰਦਗੀ ਵਿੱਚੋਂ ਉਦਾਹਰਨਾਂ ਦਿਓ (ਭਾਰਤੀ ਨਾਂ, ਥਾਵਾਂ, ਖਾਣਾ, ਤਿਉਹਾਰ, ₹)।" },
    { label: "NCERT ਸਿਲੇਬਸ", text: "ਇਸ ਜਮਾਤ ਦੇ NCERT/CBSE ਸਿਲੇਬਸ ਦੇ ਅੰਦਰ ਹੀ ਰਹੋ।" },
    { label: "ਸੌਖੇ ਸ਼ਬਦ", text: "ਸੌਖੇ ਸ਼ਬਦ ਵਰਤੋ, ਅਤੇ ਹਰ ਔਖੇ ਸ਼ਬਦ ਦਾ ਅਰਥ ਬਰੈਕਟ ਵਿੱਚ ਦੱਸੋ।" },
    { label: "ਉੱਤਰ-ਕੁੰਜੀ", text: "ਅਖ਼ੀਰ ਵਿੱਚ ਉੱਤਰ-ਕੁੰਜੀ ਦਿਓ।" },
    { label: "ਸਰੋਤ", text: "ਅਜਿਹੇ ਸਰੋਤ ਦੱਸੋ ਜਿਨ੍ਹਾਂ ਦੀ ਮੈਂ ਜਾਂਚ ਕਰ ਸਕਾਂ, ਜਿਵੇਂ NCERT ਕਿਤਾਬ ਦੇ ਪਾਠ।" },
    { label: "ਕੋਈ ਪੱਖਪਾਤ ਨਹੀਂ", text: "ਸਭ ਨੂੰ ਨਾਲ ਲੈ ਕੇ ਅਤੇ ਸਤਿਕਾਰ ਨਾਲ ਲਿਖੋ: ਲਿੰਗ, ਜਾਤ, ਧਰਮ ਜਾਂ ਇਲਾਕੇ ਬਾਰੇ ਕੋਈ ਘੜੀ-ਘੜਾਈ ਸੋਚ ਨਹੀਂ।" },
    { label: "ਘੱਟ ਖ਼ਰਚ ਦੀ ਗਤੀਵਿਧੀ", text: "ਜਮਾਤ ਦੀ ਇੱਕ ਅਜਿਹੀ ਗਤੀਵਿਧੀ ਜੋੜੋ ਜਿਸ ਵਿੱਚ ਸਿਰਫ਼ ਸਸਤਾ ਸਮਾਨ ਲੱਗੇ।" },
    { label: "ਸੌਖਾ + ਔਖਾ", text: "ਵੱਖ-ਵੱਖ ਵਿਦਿਆਰਥੀਆਂ ਲਈ ਇੱਕ ਸੌਖਾ ਰੂਪ ਅਤੇ ਇੱਕ ਵੱਧ ਚੁਣੌਤੀ ਵਾਲਾ ਰੂਪ ਦਿਓ।" }
  ],
  templates: {
    lesson5e: {
      title: "ਪਾਠ ਯੋਜਨਾ (5E)",
      desc: "40 ਮਿੰਟ ਦਾ ਗਤੀਵਿਧੀ-ਅਧਾਰਿਤ ਪਾਠ",
      role: "ਗਤੀਵਿਧੀ-ਅਧਾਰਿਤ ਪਾਠ ਤਿਆਰ ਕਰਨ ਵਾਲੇ ਇੱਕ ਤਜਰਬੇਕਾਰ CBSE ਵਿਗਿਆਨ ਅਧਿਆਪਕ",
      task: "[ਵਿਸ਼ਾ] 'ਤੇ 5E ਮਾਡਲ ਨਾਲ 40 ਮਿੰਟ ਦੀ ਪਾਠ ਯੋਜਨਾ ਬਣਾਓ: Engage (ਜੋੜਨਾ), Explore (ਖੋਜਣਾ), Explain (ਸਮਝਾਉਣਾ), Elaborate (ਵਿਸਥਾਰ), Evaluate (ਮੁਲਾਂਕਣ)।",
      context: "ਜਮਾਤ [7] ਵਿਗਿਆਨ, NCERT ਪਾਠ “[ਪਾਠ ਦਾ ਨਾਂ]”। ਜਮਾਤ ਵਿੱਚ ਲਗਭਗ 40 ਵਿਦਿਆਰਥੀ, ਇੱਕ ਸਮਾਰਟਬੋਰਡ ਅਤੇ ਬੱਸ ਆਮ ਸਮਾਨ ਹੈ। ਕੁਝ ਵਿਦਿਆਰਥੀਆਂ ਨੂੰ ਅੰਗਰੇਜ਼ੀ ਔਖੀ ਲੱਗਦੀ ਹੈ।",
      cons: "ਹਰ ਪੜਾਅ ਦਾ ਸਮਾਂ ਲਿਖੋ; ਕੁੱਲ ਸਮਾਂ 40 ਮਿੰਟ ਹੀ ਹੋਵੇ।\nਭਾਰਤੀ ਸਕੂਲ ਵਿੱਚ ਸੌਖਿਆਂ ਮਿਲਣ ਵਾਲਾ ਸਸਤਾ ਸਮਾਨ ਵਰਤੋ।\nਅਖ਼ੀਰ ਵਿੱਚ ਸਮਝ ਜਾਂਚਣ ਲਈ 3 ਛੋਟੇ ਸਵਾਲ ਦਿਓ।\nਇੱਕ ਛੋਟਾ ਘਰ ਦਾ ਕੰਮ ਸੁਝਾਓ।",
      ex: "Engage (5 ਮਿੰਟ): ਬਰਫ਼ ਵਾਲੇ ਠੰਢੇ ਪਾਣੀ ਦਾ ਗਲਾਸ ਦਿਖਾ ਕੇ ਪੁੱਛੋ, “ਗਲਾਸ ਦੇ ਬਾਹਰ ਇਹ ਬੂੰਦਾਂ ਕਿੱਥੋਂ ਆਈਆਂ?”"
    },
    mcq10: {
      title: "ਪਾਠ 'ਤੇ 10 MCQ",
      desc: "ਉੱਤਰ-ਕੁੰਜੀ ਨਾਲ ਦੁਹਰਾਈ ਕੁਇਜ਼",
      role: "ਧਿਆਨ ਨਾਲ ਪ੍ਰਸ਼ਨ-ਪੱਤਰ ਬਣਾਉਣ ਵਾਲੇ ਇੱਕ CBSE ਪੇਪਰ-ਸੈਟਰ",
      task: "ਪਾਠ “[ਪਾਠ ਦਾ ਨਾਂ]” 'ਤੇ 10 ਬਹੁ-ਵਿਕਲਪੀ ਸਵਾਲ (MCQ) ਲਿਖੋ।",
      context: "ਜਮਾਤ [9] [ਵਿਸ਼ਾ], NCERT ਕਿਤਾਬ। ਇਹ ਕੁਇਜ਼ ਪਾਠ ਪੂਰਾ ਹੋਣ ਤੋਂ ਬਾਅਦ ਦੁਹਰਾਈ ਦਾ ਟੈਸਟ ਹੈ।",
      cons: "ਔਖਿਆਈ ਰਲਾ ਕੇ ਰੱਖੋ: 4 ਸੌਖੇ, 4 ਦਰਮਿਆਨੇ ਅਤੇ 2 ਔਖੇ ਸਵਾਲ।\nਹਰ ਸਵਾਲ ਦਾ ਸਿਰਫ਼ ਇੱਕ ਹੀ ਸਹੀ ਜਵਾਬ ਹੋਵੇ।\n“ਉਪਰੋਕਤ ਸਾਰੇ” ਜਾਂ “ਇਹਨਾਂ ਵਿੱਚੋਂ ਕੋਈ ਨਹੀਂ” ਵਰਗੇ ਵਿਕਲਪ ਨਾ ਰੱਖੋ।\nਹਰ ਜਵਾਬ ਦੇ ਇੱਕ ਲਾਈਨ ਦੇ ਕਾਰਨ ਨਾਲ ਉੱਤਰ-ਕੁੰਜੀ ਦਿਓ।",
      ex: "ਸ1. ਪੌਦੇ ਭੋਜਨ ਬਣਾਉਣ ਲਈ ਕਿਹੜੀ ਗੈਸ ਲੈਂਦੇ ਹਨ?\n(A) ਆਕਸੀਜਨ  (B) ਕਾਰਬਨ ਡਾਈਆਕਸਾਈਡ  (C) ਨਾਈਟ੍ਰੋਜਨ  (D) ਹਾਈਡ੍ਰੋਜਨ\nਜਵਾਬ: (B)। ਪੌਦੇ ਧੁੱਪ ਵਿੱਚ ਕਾਰਬਨ ਡਾਈਆਕਸਾਈਡ ਅਤੇ ਪਾਣੀ ਨਾਲ ਭੋਜਨ ਬਣਾਉਂਦੇ ਹਨ।"
    },
    explain: {
      title: "ਕੋਈ ਸੰਕਲਪ ਸੌਖੇ ਢੰਗ ਨਾਲ",
      desc: "ਰੋਜ਼ਾਨਾ ਭਾਰਤੀ ਉਦਾਹਰਨ ਨਾਲ",
      role: "ਔਖੀਆਂ ਗੱਲਾਂ ਨੂੰ ਸੌਖੇ ਸ਼ਬਦਾਂ ਵਿੱਚ ਸਮਝਾਉਣ ਵਾਲੇ ਇੱਕ ਧੀਰਜਵਾਨ ਅਧਿਆਪਕ",
      task: "[ਸੰਕਲਪ, ਜਿਵੇਂ ਰਗੜ] ਨੂੰ ਸੌਖੇ ਸ਼ਬਦਾਂ ਵਿੱਚ ਸਮਝਾਓ।",
      context: "ਵਿਦਿਆਰਥੀ ਇਹ ਪਹਿਲੀ ਵਾਰ ਪੜ੍ਹ ਰਹੇ ਹਨ। ਭਾਰਤ ਦੀ ਰੋਜ਼ਾਨਾ ਜ਼ਿੰਦਗੀ ਵਿੱਚੋਂ ਇੱਕ ਉਦਾਹਰਨ ਦਿਓ, ਜਿਵੇਂ ਰਸੋਈ, ਕ੍ਰਿਕਟ ਮੈਚ, ਰੇਲ ਸਫ਼ਰ ਜਾਂ ਕੋਈ ਤਿਉਹਾਰ।",
      cons: "ਇੱਕ ਲਾਈਨ ਦੀ ਪਰਿਭਾਸ਼ਾ ਨਾਲ ਸ਼ੁਰੂ ਕਰੋ।\nਰੋਜ਼ਾਨਾ ਭਾਰਤੀ ਜ਼ਿੰਦਗੀ ਵਿੱਚੋਂ ਇੱਕ ਉਦਾਹਰਨ ਦਿਓ।\nਅਖ਼ੀਰ ਵਿੱਚ ਇੱਕ ਅਜਿਹਾ ਸਵਾਲ ਦਿਓ ਜੋ ਵਿਦਿਆਰਥੀਆਂ ਨੂੰ ਸੋਚਣ ਲਾਵੇ।\nਕੋਈ ਤਕਨੀਕੀ ਸ਼ਬਦ ਆਵੇ ਤਾਂ ਉਸ ਦਾ ਅਰਥ ਸਮਝਾਓ।",
      ex: "ਜਦੋਂ ਦੋ ਸਤ੍ਹਾਵਾਂ ਆਪਸ ਵਿੱਚ ਰਗੜ ਖਾਂਦੀਆਂ ਹਨ, ਤਾਂ ਚੀਜ਼ਾਂ ਨੂੰ ਹੌਲੀ ਕਰਨ ਵਾਲੇ ਬਲ ਨੂੰ ਰਗੜ ਕਹਿੰਦੇ ਹਨ। ਇਸੇ ਕਰਕੇ ਘਾਹ 'ਤੇ ਰਿੜ੍ਹਦੀ ਕ੍ਰਿਕਟ ਦੀ ਗੇਂਦ ਹੌਲੀ-ਹੌਲੀ ਰੁਕ ਜਾਂਦੀ ਹੈ।"
    },
    rubric: {
      title: "ਮੁਲਾਂਕਣ ਰੂਬ੍ਰਿਕ",
      desc: "ਪ੍ਰੋਜੈਕਟ ਲਈ ਨਿਰਪੱਖ ਮਾਪਦੰਡ ਅਤੇ ਪੱਧਰ",
      role: "ਨਿਰਪੱਖ ਮੁਲਾਂਕਣ ਰੂਬ੍ਰਿਕ ਬਣਾਉਣ ਵਾਲੇ ਇੱਕ ਤਜਰਬੇਕਾਰ ਅਧਿਆਪਕ",
      task: "[ਅਸਾਈਨਮੈਂਟ, ਜਿਵੇਂ ਵਿਗਿਆਨ ਮਾਡਲ] ਲਈ ਇੱਕ ਮੁਲਾਂਕਣ ਰੂਬ੍ਰਿਕ ਬਣਾਓ।",
      context: "ਜਮਾਤ [8]। ਪ੍ਰੋਜੈਕਟ 20 ਅੰਕਾਂ ਦਾ ਹੈ। ਵਿਦਿਆਰਥੀਆਂ ਨੇ 4-4 ਦੀਆਂ ਟੋਲੀਆਂ ਵਿੱਚ ਦੋ ਹਫ਼ਤੇ ਕੰਮ ਕੀਤਾ।",
      cons: "4 ਮਾਪਦੰਡ ਅਤੇ 4 ਪੱਧਰ ਰੱਖੋ: ਸ਼ਾਨਦਾਰ, ਚੰਗਾ, ਤਸੱਲੀਬਖ਼ਸ਼, ਸੁਧਾਰ ਦੀ ਲੋੜ।\nਹਰ ਪੱਧਰ ਨੂੰ ਇੱਕ ਸਾਫ਼ ਵਾਕ ਵਿੱਚ ਸਮਝਾਓ।\nਹਰ ਪੱਧਰ ਦੇ ਅੰਕ ਦਿਖਾਓ, ਅਤੇ ਧਿਆਨ ਰੱਖੋ ਕਿ ਕੁੱਲ 20 ਹੀ ਹੋਵੇ।\nਟੀਮ ਵਰਕ ਲਈ ਇੱਕ ਮਾਪਦੰਡ ਜ਼ਰੂਰ ਰੱਖੋ।",
      ex: ""
    },
    parentletter: {
      title: "ਮਾਪਿਆਂ ਲਈ ਸੂਚਨਾ",
      desc: "ਸਕੂਲ ਦੇ ਸਮਾਗਮ ਦੀ ਸਾਫ਼, ਨਿਮਰ ਸੂਚਨਾ",
      role: "ਮਾਪਿਆਂ ਲਈ ਸਾਫ਼ ਅਤੇ ਨਿਮਰ ਸੂਚਨਾਵਾਂ ਲਿਖਣ ਵਾਲੇ ਇੱਕ ਸਕੂਲ ਪ੍ਰਿੰਸੀਪਲ",
      task: "[ਸਮਾਗਮ, ਜਿਵੇਂ ਮਾਪੇ-ਅਧਿਆਪਕ ਮਿਲਣੀ] ਬਾਰੇ ਮਾਪਿਆਂ ਲਈ ਇੱਕ ਸੂਚਨਾ ਲਿਖੋ।",
      context: "ਤਾਰੀਖ਼: [ਤਾਰੀਖ਼]। ਸਮਾਂ: [ਸਮਾਂ]। ਥਾਂ: [ਸਕੂਲ ਹਾਲ]। ਕਈ ਮਾਪੇ ਅੰਗਰੇਜ਼ੀ ਨਾਲੋਂ ਆਪਣੀ ਘਰ ਦੀ ਬੋਲੀ ਵਿੱਚ ਵੱਧ ਸਹਿਜ ਹਨ।",
      cons: "150 ਸ਼ਬਦਾਂ ਤੋਂ ਘੱਟ ਰੱਖੋ।\nਤਾਰੀਖ਼, ਸਮਾਂ, ਥਾਂ ਅਤੇ ਮਾਪਿਆਂ ਨੇ ਕੀ ਨਾਲ ਲਿਆਉਣਾ ਹੈ, ਇਹ ਲਿਖੋ।\nਅਖ਼ੀਰ ਵਿੱਚ ਇੱਕ ਛੋਟੀ ਜਵਾਬੀ ਪਰਚੀ ਜੋੜੋ।\nਕਿਸੇ ਵਿਦਿਆਰਥੀ ਦਾ ਨਾਂ ਜਾਂ ਫ਼ੋਨ ਨੰਬਰ ਨਾ ਲਿਖੋ।",
      ex: ""
    },
    story: {
      title: "ਬੱਚਿਆਂ ਲਈ ਕਹਾਣੀ",
      desc: "ਸਵਾਲਾਂ ਨਾਲ ਇੱਕ ਛੋਟੀ ਸਿੱਖਿਆਦਾਇਕ ਕਹਾਣੀ",
      role: "ਭਾਰਤ ਦੇ ਇੱਕ ਬਾਲ-ਕਹਾਣੀਕਾਰ",
      task: "ਬੱਚਿਆਂ ਲਈ ਇੱਕ ਛੋਟੀ ਕਹਾਣੀ ਲਿਖੋ ਜੋ [ਸਿੱਖਿਆ, ਜਿਵੇਂ ਵੰਡ ਕੇ ਛਕਣਾ ਜਾਂ ਪਾਣੀ ਬਚਾਉਣਾ] ਸਿਖਾਵੇ।",
      context: "ਕਹਾਣੀ ਜਮਾਤ [3] ਦੇ ਬੱਚਿਆਂ ਲਈ ਹੈ। ਕਹਾਣੀ ਕਿਸੇ ਭਾਰਤੀ ਪਿੰਡ ਜਾਂ ਕਸਬੇ ਵਿੱਚ ਹੋਵੇ, ਭਾਰਤੀ ਨਾਂਵਾਂ ਅਤੇ ਬੱਚਿਆਂ ਦੇ ਜਾਣੇ-ਪਛਾਣੇ ਜਾਨਵਰਾਂ ਨਾਲ।",
      cons: "ਛੋਟੇ ਵਾਕ ਅਤੇ ਸੌਖੇ ਸ਼ਬਦ ਵਰਤੋ।\nਕੁਝ ਗੱਲਬਾਤ ਵੀ ਰੱਖੋ।\nਅਖ਼ੀਰ ਵਿੱਚ ਇੱਕ ਲਾਈਨ ਵਿੱਚ ਸਿੱਖਿਆ ਲਿਖੋ।\nਕਹਾਣੀ 'ਤੇ 3 ਸੌਖੇ ਸਵਾਲ ਜੋੜੋ।",
      ex: ""
    },
    essayfb: {
      title: "ਲੇਖ 'ਤੇ ਫ਼ੀਡਬੈਕ",
      desc: "ਨਰਮ ਅਤੇ ਠੋਸ ਫ਼ੀਡਬੈਕ ਜੋ ਵਿਦਿਆਰਥੀ ਦੇ ਕੰਮ ਆਵੇ",
      role: "ਇੱਕ ਦਿਆਲੂ ਅਤੇ ਇਮਾਨਦਾਰ ਭਾਸ਼ਾ ਅਧਿਆਪਕ",
      task: "ਹੇਠਾਂ ਦਿੱਤੇ ਵਿਦਿਆਰਥੀ ਦੇ ਲੇਖ 'ਤੇ ਫ਼ੀਡਬੈਕ ਦਿਓ।",
      context: "ਜਮਾਤ [9] ਦਾ ਲੇਖ, ਵਿਸ਼ਾ “[ਵਿਸ਼ਾ]”। ਸ਼ਬਦ-ਹੱਦ 250 ਸ਼ਬਦ ਸੀ। ਲੇਖ (ਵਿਦਿਆਰਥੀ ਦੇ ਨਾਂ ਤੋਂ ਬਿਨਾਂ): [ਲੇਖ ਇੱਥੇ ਪੇਸਟ ਕਰੋ]",
      cons: "ਪਹਿਲਾਂ 2 ਗੱਲਾਂ ਦੱਸੋ ਜੋ ਵਿਦਿਆਰਥੀ ਨੇ ਵਧੀਆ ਕੀਤੀਆਂ।\nਫਿਰ ਸੁਧਾਰ ਦੇ 3 ਠੋਸ ਤਰੀਕੇ ਦੱਸੋ, ਹਰ ਇੱਕ ਨਾਲ ਇੱਕ ਉਦਾਹਰਨ ਵਾਕ।\nਵਿਚਾਰ, ਬਣਤਰ ਅਤੇ ਵਿਆਕਰਨ ਬਾਰੇ ਵੱਖ-ਵੱਖ ਟਿੱਪਣੀ ਕਰੋ।\nਸਾਰਾ ਲੇਖ ਦੁਬਾਰਾ ਨਾ ਲਿਖੋ।\n10 ਵਿੱਚੋਂ ਅੰਕ ਦਿਓ ਅਤੇ ਛੋਟਾ ਕਾਰਨ ਦੱਸੋ।",
      ex: ""
    },
    timetable: {
      title: "ਪੜ੍ਹਾਈ ਦੀ ਸਮਾਂ-ਸਾਰਣੀ",
      desc: "ਇਮਤਿਹਾਨ ਤੋਂ ਪਹਿਲਾਂ ਹਫ਼ਤੇ ਦੀ ਅਮਲੀ ਯੋਜਨਾ",
      role: "ਵਿਦਿਆਰਥੀਆਂ ਨੂੰ ਅਮਲੀ ਯੋਜਨਾ ਬਣਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਨ ਵਾਲੇ ਇੱਕ ਸਟੱਡੀ ਕੋਚ",
      task: "ਮੇਰੇ ਇਮਤਿਹਾਨਾਂ ਲਈ ਹਫ਼ਤਾਵਾਰੀ ਪੜ੍ਹਾਈ ਦੀ ਸਮਾਂ-ਸਾਰਣੀ ਬਣਾਓ; ਇਮਤਿਹਾਨ [ਤਾਰੀਖ਼] ਤੋਂ ਸ਼ੁਰੂ ਹਨ।",
      context: "ਮੈਂ ਜਮਾਤ [10] ਵਿੱਚ ਹਾਂ। ਸਕੂਲ ਸਵੇਰੇ 8 ਤੋਂ ਦੁਪਹਿਰ 2 ਵਜੇ ਤੱਕ ਹੈ। ਮੇਰੇ ਵਿਸ਼ੇ: ਗਣਿਤ, ਵਿਗਿਆਨ, ਸਮਾਜਿਕ ਵਿਗਿਆਨ, ਅੰਗਰੇਜ਼ੀ ਅਤੇ [ਦੂਜੀ ਭਾਸ਼ਾ]। ਮੇਰਾ ਸਭ ਤੋਂ ਕਮਜ਼ੋਰ ਵਿਸ਼ਾ [ਵਿਸ਼ਾ] ਹੈ।",
      cons: "ਛੋਟੀਆਂ ਛੁੱਟੀਆਂ, ਖੇਡਣ ਦਾ ਸਮਾਂ ਅਤੇ 8 ਘੰਟੇ ਦੀ ਨੀਂਦ ਸ਼ਾਮਲ ਕਰੋ।\nਸਭ ਤੋਂ ਕਮਜ਼ੋਰ ਵਿਸ਼ੇ ਨੂੰ ਵੱਧ ਸਮਾਂ ਦਿਓ।\nਹਰ ਹਫ਼ਤੇ ਇੱਕ ਦਿਨ ਦੁਹਰਾਈ ਲਈ ਰੱਖੋ।\nਐਤਵਾਰ ਦੀ ਸ਼ਾਮ ਵਿਹਲੀ ਰੱਖੋ।",
      ex: ""
    },
    debate: {
      title: "ਬਹਿਸ ਦੇ ਨੁਕਤੇ",
      desc: "ਹੱਕ ਅਤੇ ਵਿਰੋਧ ਦੇ ਸੰਤੁਲਿਤ ਨੁਕਤੇ",
      role: "ਇੱਕ ਤਜਰਬੇਕਾਰ ਬਹਿਸ ਕੋਚ",
      task: "ਇਸ ਵਿਸ਼ੇ ਦੇ ਹੱਕ ਅਤੇ ਵਿਰੋਧ ਵਿੱਚ ਨੁਕਤੇ ਦਿਓ: “[ਵਿਸ਼ਾ, ਜਿਵੇਂ ਸਕੂਲਾਂ ਵਿੱਚ ਮੋਬਾਈਲ ਫ਼ੋਨ ਦੀ ਇਜਾਜ਼ਤ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ]”।",
      context: "ਜਮਾਤ [11] ਦੇ ਵਿਦਿਆਰਥੀਆਂ ਦੇ ਅੰਤਰ-ਸਕੂਲ ਬਹਿਸ ਮੁਕਾਬਲੇ ਲਈ। ਹਰ ਬੁਲਾਰੇ ਨੂੰ 3 ਮਿੰਟ ਮਿਲਣਗੇ।",
      cons: "ਹੱਕ ਵਿੱਚ 5 ਅਤੇ ਵਿਰੋਧ ਵਿੱਚ 5 ਨੁਕਤੇ ਦਿਓ।\nਹਰ ਨੁਕਤੇ ਨਾਲ ਇੱਕ ਤੱਥ ਜਾਂ ਉਦਾਹਰਨ ਦਿਓ, ਅਤੇ ਜਿਹੜੇ ਤੱਥ ਮੈਨੂੰ ਦੁਬਾਰਾ ਜਾਂਚਣੇ ਚਾਹੀਦੇ ਹਨ ਉਹਨਾਂ 'ਤੇ ਨਿਸ਼ਾਨ ਲਾਓ।\nਹਰ ਪੱਖ ਲਈ 2 ਸੰਭਾਵੀ ਜਵਾਬੀ ਦਲੀਲਾਂ ਜੋੜੋ।\nਗੱਲ ਸੰਤੁਲਿਤ ਅਤੇ ਸਤਿਕਾਰ ਵਾਲੀ ਰੱਖੋ।",
      ex: ""
    },
    summary: {
      title: "ਨੋਟਸ ਦਾ ਸਾਰ",
      desc: "ਲੰਬੇ ਨੋਟਸ ਨੂੰ ਦੁਹਰਾਈ ਦੇ ਨੁਕਤਿਆਂ ਵਿੱਚ ਬਦਲੋ",
      role: "ਸਾਫ਼ ਦੁਹਰਾਈ ਨੋਟਸ ਬਣਾਉਣ ਵਾਲਾ ਇੱਕ ਪੜ੍ਹਾਈ ਸਹਾਇਕ",
      task: "ਹੇਠਾਂ ਦਿੱਤੇ ਮੇਰੇ ਨੋਟਸ ਦਾ ਸਾਰ ਦੁਹਰਾਈ ਦੇ ਮੁੱਖ ਨੁਕਤਿਆਂ ਵਿੱਚ ਬਣਾਓ।",
      context: "[ਵਿਸ਼ਾ] ਬਾਰੇ ਇਹ ਮੇਰੇ ਜਮਾਤ ਦੇ ਨੋਟਸ ਹਨ: [ਆਪਣੇ ਨੋਟਸ ਇੱਥੇ ਪੇਸਟ ਕਰੋ]",
      cons: "ਵੱਧ ਤੋਂ ਵੱਧ 10 ਨੁਕਤੇ ਰੱਖੋ।\nਸਾਰੇ ਜ਼ਰੂਰੀ ਸ਼ਬਦ, ਤਾਰੀਖ਼ਾਂ ਅਤੇ ਫ਼ਾਰਮੂਲੇ ਬਣਾਈ ਰੱਖੋ।\nਆਪਣੇ ਆਪ ਨੂੰ ਜਾਂਚਣ ਲਈ 3 ਸਵਾਲ ਜੋੜੋ।\nਅਜਿਹੀ ਕੋਈ ਗੱਲ ਨਾ ਜੋੜੋ ਜੋ ਮੇਰੇ ਨੋਟਸ ਵਿੱਚ ਨਹੀਂ ਹੈ।",
      ex: ""
    },
    interview: {
      title: "ਇੰਟਰਵਿਊ ਦੀ ਪ੍ਰੈਕਟਿਸ",
      desc: "ਇੱਕ ਵਾਰ ਵਿੱਚ ਇੱਕ ਸਵਾਲ ਵਾਲੀ ਮੌਕ ਇੰਟਰਵਿਊ",
      role: "[ਨੌਕਰੀ ਜਾਂ ਕਾਲਜ ਦਾਖ਼ਲੇ] ਲਈ ਇੱਕ ਦੋਸਤਾਨਾ ਇੰਟਰਵਿਊ ਲੈਣ ਵਾਲੇ",
      task: "ਇੰਟਰਵਿਊ ਦੀ ਪ੍ਰੈਕਟਿਸ ਵਿੱਚ ਮੇਰੀ ਮਦਦ ਕਰੋ। ਇੱਕ ਵਾਰ ਵਿੱਚ ਇੱਕੋ ਸਵਾਲ ਪੁੱਛੋ, ਮੇਰੇ ਜਵਾਬ ਦੀ ਉਡੀਕ ਕਰੋ, ਫਿਰ ਫ਼ੀਡਬੈਕ ਦਿਓ।",
      context: "ਮੈਂ [B.Com ਦੇ ਆਖ਼ਰੀ ਸਾਲ ਦਾ/ਦੀ ਵਿਦਿਆਰਥੀ] ਹਾਂ ਅਤੇ [ਨੌਕਰੀ ਜਾਂ ਕੋਰਸ] ਲਈ ਅਰਜ਼ੀ ਦੇ ਰਿਹਾ/ਰਹੀ ਹਾਂ। ਮੈਂ ਘਬਰਾ ਜਾਂਦਾ/ਜਾਂਦੀ ਹਾਂ ਅਤੇ ਬਹੁਤ ਛੋਟੇ ਜਵਾਬ ਦਿੰਦਾ/ਦਿੰਦੀ ਹਾਂ।",
      cons: "ਕੁੱਲ 8 ਸਵਾਲ ਪੁੱਛੋ, ਸੌਖੇ ਤੋਂ ਔਖੇ ਵੱਲ।\nਹਰ ਜਵਾਬ ਤੋਂ ਬਾਅਦ ਇੱਕ ਖ਼ੂਬੀ ਅਤੇ ਸੁਧਾਰ ਦੀ ਇੱਕ ਗੱਲ ਦੱਸੋ।\nਅਖ਼ੀਰ ਵਿੱਚ ਛੋਟਾ ਸਾਰ ਅਤੇ 3 ਸੁਝਾਅ ਦਿਓ।\nਮੇਰਾ ਅਸਲੀ ਨਾਂ, ਫ਼ੋਨ ਨੰਬਰ ਜਾਂ ਪਤਾ ਨਾ ਪੁੱਛੋ।",
      ex: ""
    }
  }
};

window.APP_CONTENT.or = {
  asm: {
    role: "ଆପଣ {x}।",
    task: "କାମ: {x}",
    context: "ପୃଷ୍ଠଭୂମି: {x}",
    aud: "ଏହା କାହା ପାଇଁ: {x}। ସେମାନେ ସହଜରେ ବୁଝିପାରିବେ ଏପରି ଶବ୍ଦ ଓ ଉଦାହରଣ ବ୍ୟବହାର କରନ୍ତୁ।",
    audv: {
      c1_5: "ଶ୍ରେଣୀ 1–5ର ପିଲା (ପ୍ରାୟ 6–10 ବର୍ଷ)",
      c6_8: "ଶ୍ରେଣୀ 6–8ର ଛାତ୍ରଛାତ୍ରୀ (ପ୍ରାୟ 11–13 ବର୍ଷ)",
      c9_10: "ଶ୍ରେଣୀ 9–10ର ଛାତ୍ରଛାତ୍ରୀ (ପ୍ରାୟ 14–15 ବର୍ଷ)",
      c11_12: "ଶ୍ରେଣୀ 11–12ର ଛାତ୍ରଛାତ୍ରୀ (ପ୍ରାୟ 16–17 ବର୍ଷ)",
      ug: "କଲେଜ ଛାତ୍ରଛାତ୍ରୀ",
      teachers: "ସ୍କୁଲ ଶିକ୍ଷକ",
      parents: "ସ୍କୁଲ ପିଲାଙ୍କ ଅଭିଭାବକ",
      general: "ସାଧାରଣ ପାଠକ"
    },
    fmt: {
      list: "ଫର୍ମାଟ୍: ଉତ୍ତରକୁ ଛୋଟ ଓ ସ୍ପଷ୍ଟ ବିନ୍ଦୁର କ୍ରମିକ ତାଲିକାରେ ଦିଅନ୍ତୁ।",
      table: "ଫର୍ମାଟ୍: ଉତ୍ତରକୁ ଏକ ସାରଣୀରେ ଦିଅନ୍ତୁ, ପ୍ରତ୍ୟେକ ସ୍ତମ୍ଭର ଶୀର୍ଷକ ସ୍ପଷ୍ଟ ହେଉ।",
      paragraph: "ଫର୍ମାଟ୍: ଛୋଟ, ସୁସଜ୍ଜିତ ଅନୁଚ୍ଛେଦରେ ଲେଖନ୍ତୁ।",
      quiz: "ଫର୍ମାଟ୍: ଏହାକୁ କୁଇଜ୍ କରନ୍ତୁ। ପ୍ରତ୍ୟେକ ପ୍ରଶ୍ନରେ ଚାରୋଟି ବିକଳ୍ପ (A–D) ଦିଅନ୍ତୁ, ଏବଂ ଶେଷରେ ଏକ ଧାଡ଼ିର ବ୍ୟାଖ୍ୟା ସହ ଉତ୍ତର ତାଲିକା ଦିଅନ୍ତୁ।",
      steps: "ଫର୍ମାଟ୍: ପାହାଚ ପରେ ପାହାଚ ବୁଝାନ୍ତୁ, ପ୍ରତ୍ୟେକ ପାହାଚକୁ ନମ୍ବର ଓ ଛୋଟ ଶୀର୍ଷକ ଦିଅନ୍ତୁ।",
      letter: "ଫର୍ମାଟ୍: ଏହାକୁ ଔପଚାରିକ ଚିଠି ବା ବିଜ୍ଞପ୍ତି ଭାବେ ଲେଖନ୍ତୁ: ତାରିଖ, ବିଷୟ, ସମ୍ବୋଧନ, ମୁଖ୍ୟ ବାର୍ତ୍ତା ଓ ଶେଷରେ ନାମ/ପଦବୀ।"
    },
    tone: "ଶୈଳୀ: {x}।",
    tonev: {
      friendly: "ବନ୍ଧୁତ୍ୱପୂର୍ଣ୍ଣ ଓ ଆନ୍ତରିକ",
      formal: "ଔପଚାରିକ ଓ ବିନମ୍ର",
      encouraging: "ଉତ୍ସାହଜନକ ଓ ସକାରାତ୍ମକ",
      simple: "ସରଳ ଓ ସ୍ପଷ୍ଟ",
      fun: "ମଜାଦାର ଓ ପ୍ରାଣବନ୍ତ",
      neutral: "ନିରପେକ୍ଷ ଓ ସନ୍ତୁଳିତ"
    },
    len: {
      vshort: "ଦୈର୍ଘ୍ୟ: ବହୁତ ଛୋଟ, ପ୍ରାୟ 100 ଶବ୍ଦ।",
      short: "ଦୈର୍ଘ୍ୟ: ଛୋଟ, ପ୍ରାୟ 150–250 ଶବ୍ଦ।",
      medium: "ଦୈର୍ଘ୍ୟ: ମଧ୍ୟମ, ପ୍ରାୟ 300–500 ଶବ୍ଦ।",
      long: "ଦୈର୍ଘ୍ୟ: ବିସ୍ତୃତ ଓ ସମ୍ପୂର୍ଣ୍ଣ, କିନ୍ତୁ ଅଦରକାରୀ କଥା ବିନା।"
    },
    lang: "ଭାଷା: ସମ୍ପୂର୍ଣ୍ଣ ଉତ୍ତର ସରଳ ଓଡ଼ିଆରେ ଲେଖନ୍ତୁ।",
    rules: "ଏହି ନିୟମଗୁଡ଼ିକ ମାନନ୍ତୁ:",
    example: "ମୁଁ ଚାହୁଁଥିବା ଶୈଳୀର ଏକ ଉଦାହରଣ:",
    ask: "କୌଣସି ଜରୁରୀ ତଥ୍ୟ ବାଦ୍ ପଡ଼ିଥିଲେ, ପ୍ରଥମେ ମୋତେ ଅଧିକରୁ ଅଧିକ 3ଟି ଛୋଟ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ, ତା’ପରେ ଉତ୍ତର ଦିଅନ୍ତୁ।",
    unsure: "କୌଣସି ତଥ୍ୟ ବିଷୟରେ ନିଶ୍ଚିତ ନ ଥିଲେ, ଅନୁମାନ ନକରି ତାହା ସ୍ପଷ୍ଟ କୁହନ୍ତୁ।"
  },
  chips: [
    { label: "ଭାରତୀୟ ଉଦାହରଣ", text: "ଦୈନନ୍ଦିନ ଭାରତୀୟ ଜୀବନରୁ ଉଦାହରଣ ଦିଅନ୍ତୁ (ଭାରତୀୟ ନାମ, ସ୍ଥାନ, ଖାଦ୍ୟ, ପର୍ବ, ₹)।" },
    { label: "NCERT ପାଠ୍ୟକ୍ରମ", text: "ଏହି ଶ୍ରେଣୀର NCERT/CBSE ପାଠ୍ୟକ୍ରମ ଭିତରେ ହିଁ ରୁହନ୍ତୁ।" },
    { label: "ସରଳ ଶବ୍ଦ", text: "ସରଳ ଶବ୍ଦ ବ୍ୟବହାର କରନ୍ତୁ, ଏବଂ କଠିନ ଶବ୍ଦର ଅର୍ଥ ବନ୍ଧନୀରେ ଦିଅନ୍ତୁ।" },
    { label: "ଉତ୍ତର ତାଲିକା", text: "ଶେଷରେ ଉତ୍ତର ତାଲିକା ଦିଅନ୍ତୁ।" },
    { label: "ଉତ୍ସ", text: "ମୁଁ ଯାଞ୍ଚ କରିପାରିବି ଏପରି ଉତ୍ସ କୁହନ୍ତୁ, ଯେପରି NCERT ବହିର ଅଧ୍ୟାୟ।" },
    { label: "କୌଣସି ପୂର୍ବାଗ୍ରହ ନାହିଁ", text: "ସମସ୍ତଙ୍କୁ ସାମିଲ କରି ସମ୍ମାନର ସହ ଲେଖନ୍ତୁ: ଲିଙ୍ଗ, ଜାତି, ଧର୍ମ ବା ଅଞ୍ଚଳ ବିଷୟରେ କୌଣସି ପୂର୍ବାଗ୍ରହ ନାହିଁ।" },
    { label: "କମ୍ ଖର୍ଚ୍ଚର କାର୍ଯ୍ୟକଳାପ", text: "କେବଳ ଶସ୍ତା ଜିନିଷ ଲାଗୁଥିବା ଏକ ଶ୍ରେଣୀ କାର୍ଯ୍ୟକଳାପ ଯୋଡ଼ନ୍ତୁ।" },
    { label: "ସହଜ + କଠିନ", text: "ଭିନ୍ନ ଭିନ୍ନ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ ଏକ ସହଜ ରୂପ ଓ ଏକ ଅଧିକ ଚ୍ୟାଲେଞ୍ଜିଂ ରୂପ ଦିଅନ୍ତୁ।" }
  ],
  templates: {
    lesson5e: {
      title: "ପାଠ ଯୋଜନା (5E)",
      desc: "40 ମିନିଟର କାର୍ଯ୍ୟକଳାପ-ଆଧାରିତ ପାଠ",
      role: "ଜଣେ ଅଭିଜ୍ଞ CBSE ବିଜ୍ଞାନ ଶିକ୍ଷକ, ଯିଏ କାର୍ଯ୍ୟକଳାପ-ଆଧାରିତ ପାଠ ଯୋଜନା କରନ୍ତି",
      task: "[ବିଷୟ] ଉପରେ 5E ମଡେଲରେ 40 ମିନିଟର ଏକ ପାଠ ଯୋଜନା ତିଆରି କରନ୍ତୁ: Engage (ଯୋଡ଼ିବା), Explore (ଖୋଜିବା), Explain (ବୁଝାଇବା), Elaborate (ବିସ୍ତାର), Evaluate (ମୂଲ୍ୟାଙ୍କନ)।",
      context: "ଶ୍ରେଣୀ [7] ବିଜ୍ଞାନ, NCERT ଅଧ୍ୟାୟ “[ଅଧ୍ୟାୟର ନାମ]”। ପ୍ରାୟ 40 ଜଣ ଛାତ୍ରଛାତ୍ରୀ, ଗୋଟିଏ ସ୍ମାର୍ଟବୋର୍ଡ ଓ କେବଳ ସାଧାରଣ ସାମଗ୍ରୀ ଅଛି। କିଛି ଛାତ୍ରଛାତ୍ରୀଙ୍କୁ ଇଂରାଜୀ କଷ୍ଟ ଲାଗେ।",
      cons: "ପ୍ରତ୍ୟେକ ପର୍ଯ୍ୟାୟର ସମୟ ଲେଖନ୍ତୁ; ମୋଟ ସମୟ 40 ମିନିଟ ହିଁ ହେଉ।\nଭାରତୀୟ ସ୍କୁଲରେ ସହଜରେ ମିଳୁଥିବା ଶସ୍ତା ସାମଗ୍ରୀ ବ୍ୟବହାର କରନ୍ତୁ।\nଶେଷରେ ବୁଝାମଣା ଯାଞ୍ଚ ପାଇଁ 3ଟି ଛୋଟ ପ୍ରଶ୍ନ ଦିଅନ୍ତୁ।\nଗୋଟିଏ ଛୋଟ ଗୃହକାର୍ଯ୍ୟ ପରାମର୍ଶ ଦିଅନ୍ତୁ।",
      ex: "Engage (5 ମିନିଟ): ବରଫ ଥଣ୍ଡା ପାଣିର ଗିଲାସ ଦେଖାଇ ପଚାରନ୍ତୁ, “ଗିଲାସ ବାହାରେ ଏହି ବୁନ୍ଦାଗୁଡ଼ିକ କେଉଁଠୁ ଆସିଲା?”"
    },
    mcq10: {
      title: "ଅଧ୍ୟାୟ ଉପରେ 10ଟି MCQ",
      desc: "ଉତ୍ତର ତାଲିକା ସହ ପୁନରାବୃତ୍ତି କୁଇଜ୍",
      role: "ଜଣେ ଯତ୍ନଶୀଳ CBSE ପ୍ରଶ୍ନପତ୍ର ପ୍ରସ୍ତୁତକାରୀ",
      task: "“[ଅଧ୍ୟାୟର ନାମ]” ଅଧ୍ୟାୟ ଉପରେ 10ଟି ବହୁବିକଳ୍ପ ପ୍ରଶ୍ନ (MCQ) ଲେଖନ୍ତୁ।",
      context: "ଶ୍ରେଣୀ [9] [ବିଷୟ], NCERT ବହି। ଅଧ୍ୟାୟ ଶେଷ ହେବା ପରେ ଏହା ଏକ ପୁନରାବୃତ୍ତି ପରୀକ୍ଷା।",
      cons: "କାଠିନ୍ୟ ମିଶାଇ ରଖନ୍ତୁ: 4ଟି ସହଜ, 4ଟି ମଧ୍ୟମ ଓ 2ଟି କଠିନ ପ୍ରଶ୍ନ।\nପ୍ରତ୍ୟେକ ପ୍ରଶ୍ନର କେବଳ ଗୋଟିଏ ହିଁ ଠିକ୍ ଉତ୍ତର ରହିବ।\n“ଉପରୋକ୍ତ ସବୁ” କିମ୍ବା “କୌଣସିଟି ନୁହେଁ” ବିକଳ୍ପ ରଖନ୍ତୁ ନାହିଁ।\nପ୍ରତ୍ୟେକ ଉତ୍ତରର ଏକ ଧାଡ଼ିର କାରଣ ସହ ଉତ୍ତର ତାଲିକା ଦିଅନ୍ତୁ।",
      ex: "ପ୍ର1. ଖାଦ୍ୟ ତିଆରି ପାଇଁ ଉଦ୍ଭିଦ କେଉଁ ଗ୍ୟାସ୍ ନିଏ?\n(A) ଅମ୍ଳଜାନ  (B) କାର୍ବନ ଡାଇଅକ୍ସାଇଡ୍  (C) ଯବକ୍ଷାରଜାନ  (D) ଉଦଜାନ\nଉତ୍ତର: (B)। ଉଦ୍ଭିଦ ସୂର୍ଯ୍ୟାଲୋକରେ କାର୍ବନ ଡାଇଅକ୍ସାଇଡ୍ ଓ ପାଣିରୁ ଖାଦ୍ୟ ତିଆରି କରେ।"
    },
    explain: {
      title: "ଧାରଣାକୁ ସହଜରେ ବୁଝାନ୍ତୁ",
      desc: "ଦୈନନ୍ଦିନ ଭାରତୀୟ ଉଦାହରଣ ସହ",
      role: "ଜଣେ ଧୈର୍ଯ୍ୟଶୀଳ ଶିକ୍ଷକ, ଯିଏ କଠିନ କଥାକୁ ସରଳ ଶବ୍ଦରେ ବୁଝାନ୍ତି",
      task: "[ଧାରଣା, ଯେପରି ଘର୍ଷଣ]କୁ ସରଳ ଶବ୍ଦରେ ବୁଝାନ୍ତୁ।",
      context: "ଛାତ୍ରଛାତ୍ରୀ ଏହା ପ୍ରଥମ ଥର ଶିଖୁଛନ୍ତି। ଭାରତର ଦୈନନ୍ଦିନ ଜୀବନରୁ ଗୋଟିଏ ଉଦାହରଣ ଦିଅନ୍ତୁ, ଯେପରି ରୋଷେଇ ଘର, କ୍ରିକେଟ୍ ମ୍ୟାଚ୍, ଟ୍ରେନ୍ ଯାତ୍ରା କିମ୍ବା କୌଣସି ପର୍ବ।",
      cons: "ଏକ ଧାଡ଼ିର ସଂଜ୍ଞାରୁ ଆରମ୍ଭ କରନ୍ତୁ।\nଦୈନନ୍ଦିନ ଭାରତୀୟ ଜୀବନରୁ ଗୋଟିଏ ଉଦାହରଣ ଦିଅନ୍ତୁ।\nଶେଷରେ ଛାତ୍ରଛାତ୍ରୀଙ୍କୁ ଭାବିବାକୁ ବାଧ୍ୟ କରୁଥିବା ଏକ ପ୍ରଶ୍ନ ଦିଅନ୍ତୁ।\nକୌଣସି ବୈଷୟିକ ଶବ୍ଦ ବ୍ୟବହାର କଲେ ତାହାର ଅର୍ଥ ବୁଝାନ୍ତୁ।",
      ex: "ଦୁଇଟି ପୃଷ୍ଠ ପରସ୍ପର ସହ ଘଷି ହେଲେ ଜିନିଷକୁ ଧୀମା କରୁଥିବା ବଳକୁ ଘର୍ଷଣ କୁହାଯାଏ। ସେଥିପାଇଁ ଘାସ ଉପରେ ଗଡ଼ୁଥିବା କ୍ରିକେଟ୍ ବଲ୍ ଧୀରେ ଧୀରେ ଅଟକିଯାଏ।"
    },
    rubric: {
      title: "ମୂଲ୍ୟାଙ୍କନ ରୁବ୍ରିକ୍",
      desc: "ପ୍ରକଳ୍ପ ପାଇଁ ନ୍ୟାୟସଙ୍ଗତ ମାନଦଣ୍ଡ ଓ ସ୍ତର",
      role: "ଜଣେ ଅଭିଜ୍ଞ ଶିକ୍ଷକ, ଯିଏ ନ୍ୟାୟସଙ୍ଗତ ମୂଲ୍ୟାଙ୍କନ ରୁବ୍ରିକ୍ ତିଆରି କରନ୍ତି",
      task: "[ଆସାଇନମେଣ୍ଟ, ଯେପରି ବିଜ୍ଞାନ ମଡେଲ୍] ପାଇଁ ଏକ ମୂଲ୍ୟାଙ୍କନ ରୁବ୍ରିକ୍ ତିଆରି କରନ୍ତୁ।",
      context: "ଶ୍ରେଣୀ [8]। ପ୍ରକଳ୍ପଟି 20 ନମ୍ବରର। ଛାତ୍ରଛାତ୍ରୀ 4 ଜଣିଆ ଦଳରେ ଦୁଇ ସପ୍ତାହ କାମ କରିଛନ୍ତି।",
      cons: "4ଟି ମାନଦଣ୍ଡ ଓ 4ଟି ସ୍ତର ରଖନ୍ତୁ: ଉତ୍କୃଷ୍ଟ, ଭଲ, ସନ୍ତୋଷଜନକ, ଉନ୍ନତି ଦରକାର।\nପ୍ରତ୍ୟେକ ସ୍ତରକୁ ଗୋଟିଏ ସ୍ପଷ୍ଟ ବାକ୍ୟରେ ବର୍ଣ୍ଣନା କରନ୍ତୁ।\nପ୍ରତ୍ୟେକ ସ୍ତରର ନମ୍ବର ଦେଖାନ୍ତୁ, ଏବଂ ମୋଟ 20 ହିଁ ହେଉ।\nଦଳଗତ କାମ ପାଇଁ ଗୋଟିଏ ମାନଦଣ୍ଡ ନିଶ୍ଚୟ ରଖନ୍ତୁ।",
      ex: ""
    },
    parentletter: {
      title: "ଅଭିଭାବକଙ୍କ ପାଇଁ ବିଜ୍ଞପ୍ତି",
      desc: "ସ୍କୁଲ କାର୍ଯ୍ୟକ୍ରମର ସ୍ପଷ୍ଟ, ବିନମ୍ର ବିଜ୍ଞପ୍ତି",
      role: "ଜଣେ ପ୍ରଧାନ ଶିକ୍ଷକ, ଯିଏ ଅଭିଭାବକଙ୍କ ପାଇଁ ସ୍ପଷ୍ଟ ଓ ବିନମ୍ର ବିଜ୍ଞପ୍ତି ଲେଖନ୍ତି",
      task: "[କାର୍ଯ୍ୟକ୍ରମ, ଯେପରି ଅଭିଭାବକ-ଶିକ୍ଷକ ବୈଠକ] ବିଷୟରେ ଅଭିଭାବକଙ୍କ ପାଇଁ ଏକ ବିଜ୍ଞପ୍ତି ଲେଖନ୍ତୁ।",
      context: "ତାରିଖ: [ତାରିଖ]। ସମୟ: [ସମୟ]। ସ୍ଥାନ: [ସ୍କୁଲ ହଲ୍]। ଅନେକ ଅଭିଭାବକ ଇଂରାଜୀ ଅପେକ୍ଷା ନିଜ ଘର ଭାଷାରେ ଅଧିକ ସହଜ ଅନୁଭବ କରନ୍ତି।",
      cons: "150 ଶବ୍ଦ ଭିତରେ ରଖନ୍ତୁ।\nତାରିଖ, ସମୟ, ସ୍ଥାନ ଓ ଅଭିଭାବକ କ’ଣ ଆଣିବେ ତାହା ଲେଖନ୍ତୁ।\nଶେଷରେ ଏକ ଛୋଟ ଉତ୍ତର-ସ୍ଲିପ୍ ଯୋଡ଼ନ୍ତୁ।\nକୌଣସି ଛାତ୍ରଛାତ୍ରୀଙ୍କ ନାମ ବା ଫୋନ୍ ନମ୍ବର ଦିଅନ୍ତୁ ନାହିଁ।",
      ex: ""
    },
    story: {
      title: "ପିଲାଙ୍କ ପାଇଁ ଗପ",
      desc: "ପ୍ରଶ୍ନ ସହ ଏକ ଛୋଟ ନୀତିଗପ",
      role: "ଭାରତର ଜଣେ ଶିଶୁ ଗାଳ୍ପିକ",
      task: "ପିଲାଙ୍କ ପାଇଁ ଏକ ଛୋଟ ଗପ ଲେଖନ୍ତୁ ଯାହା [ଶିକ୍ଷା, ଯେପରି ବାଣ୍ଟି ଖାଇବା କିମ୍ବା ପାଣି ବଞ୍ଚାଇବା] ଶିଖାଏ।",
      context: "ଗପଟି ଶ୍ରେଣୀ [3]ର ପିଲାଙ୍କ ପାଇଁ। ଗପଟି କୌଣସି ଭାରତୀୟ ଗାଁ ବା ସହରରେ ଘଟୁ, ଭାରତୀୟ ନାମ ଓ ପିଲାମାନେ ଚିହ୍ନୁଥିବା ଜୀବଜନ୍ତୁଙ୍କ ସହ।",
      cons: "ଛୋଟ ବାକ୍ୟ ଓ ସହଜ ଶବ୍ଦ ବ୍ୟବହାର କରନ୍ତୁ।\nକିଛି ସଂଳାପ ରଖନ୍ତୁ।\nଶେଷରେ ଗୋଟିଏ ଧାଡ଼ିରେ ଶିକ୍ଷା ଲେଖନ୍ତୁ।\nଗପ ଉପରେ 3ଟି ସହଜ ପ୍ରଶ୍ନ ଯୋଡ଼ନ୍ତୁ।",
      ex: ""
    },
    essayfb: {
      title: "ରଚନା ଉପରେ ମତାମତ",
      desc: "ଛାତ୍ରଛାତ୍ରୀଙ୍କ କାମରେ ଆସୁଥିବା ଦୟାଳୁ, ନିର୍ଦ୍ଦିଷ୍ଟ ମତାମତ",
      role: "ଜଣେ ଦୟାଳୁ ଓ ସଚ୍ଚୋଟ ଭାଷା ଶିକ୍ଷକ",
      task: "ତଳେ ଦିଆଯାଇଥିବା ଛାତ୍ର/ଛାତ୍ରୀଙ୍କ ରଚନା ଉପରେ ମତାମତ ଦିଅନ୍ତୁ।",
      context: "ଶ୍ରେଣୀ [9]ର ରଚନା, ବିଷୟ “[ବିଷୟ]”। ଶବ୍ଦ ସୀମା 250 ଶବ୍ଦ ଥିଲା। ରଚନା (ଛାତ୍ର/ଛାତ୍ରୀଙ୍କ ନାମ ବିନା): [ରଚନାଟି ଏଠାରେ ପେଷ୍ଟ କରନ୍ତୁ]",
      cons: "ପ୍ରଥମେ ଭଲ ହୋଇଥିବା 2ଟି କଥା କୁହନ୍ତୁ।\nତା’ପରେ ଉନ୍ନତିର 3ଟି ନିର୍ଦ୍ଦିଷ୍ଟ ଉପାୟ କୁହନ୍ତୁ, ପ୍ରତ୍ୟେକ ସହ ଗୋଟିଏ ଉଦାହରଣ ବାକ୍ୟ।\nଚିନ୍ତାଧାରା, ଗଠନ ଓ ବ୍ୟାକରଣ ଉପରେ ଅଲଗା ଅଲଗା ମନ୍ତବ୍ୟ ଦିଅନ୍ତୁ।\nପୂରା ରଚନା ପୁଣି ଲେଖନ୍ତୁ ନାହିଁ।\n10 ମଧ୍ୟରୁ ନମ୍ବର ଦିଅନ୍ତୁ ଓ ଛୋଟରେ କାରଣ କୁହନ୍ତୁ।",
      ex: ""
    },
    timetable: {
      title: "ପଢ଼ା ସମୟସାରଣୀ",
      desc: "ପରୀକ୍ଷା ଆଗରୁ ବାସ୍ତବସମ୍ମତ ସାପ୍ତାହିକ ଯୋଜନା",
      role: "ଜଣେ ଷ୍ଟଡି କୋଚ୍, ଯିଏ ଛାତ୍ରଛାତ୍ରୀଙ୍କୁ ବାସ୍ତବସମ୍ମତ ଯୋଜନା କରିବାରେ ସାହାଯ୍ୟ କରନ୍ତି",
      task: "ମୋ ପରୀକ୍ଷା ପାଇଁ ଏକ ସାପ୍ତାହିକ ପଢ଼ା ସମୟସାରଣୀ ତିଆରି କରନ୍ତୁ; ପରୀକ୍ଷା [ତାରିଖ]ରୁ ଆରମ୍ଭ।",
      context: "ମୁଁ ଶ୍ରେଣୀ [10]ରେ ପଢ଼ୁଛି। ସ୍କୁଲ ସକାଳ 8ଟାରୁ ଦିନ 2ଟା ପର୍ଯ୍ୟନ୍ତ। ମୋ ବିଷୟ: ଗଣିତ, ବିଜ୍ଞାନ, ସାମାଜିକ ବିଜ୍ଞାନ, ଇଂରାଜୀ ଓ [ଦ୍ୱିତୀୟ ଭାଷା]। ମୋର ସବୁଠୁ ଦୁର୍ବଳ ବିଷୟ [ବିଷୟ]।",
      cons: "ଛୋଟ ବିରତି, ଖେଳ ସମୟ ଓ 8 ଘଣ୍ଟା ନିଦ ସାମିଲ କରନ୍ତୁ।\nସବୁଠୁ ଦୁର୍ବଳ ବିଷୟକୁ ଅଧିକ ସମୟ ଦିଅନ୍ତୁ।\nପ୍ରତି ସପ୍ତାହରେ ଗୋଟିଏ ଦିନ ପୁନରାବୃତ୍ତି ପାଇଁ ରଖନ୍ତୁ।\nରବିବାର ସନ୍ଧ୍ୟା ଖାଲି ରଖନ୍ତୁ।",
      ex: ""
    },
    debate: {
      title: "ବିତର୍କର ବିନ୍ଦୁ",
      desc: "ପକ୍ଷ ଓ ବିପକ୍ଷରେ ସନ୍ତୁଳିତ ଯୁକ୍ତି",
      role: "ଜଣେ ଅଭିଜ୍ଞ ବିତର୍କ ପ୍ରଶିକ୍ଷକ",
      task: "ଏହି ବିଷୟର ପକ୍ଷ ଓ ବିପକ୍ଷରେ ବିନ୍ଦୁ ଦିଅନ୍ତୁ: “[ବିଷୟ, ଯେପରି ସ୍କୁଲରେ ମୋବାଇଲ୍ ଫୋନ୍‌ର ଅନୁମତି ରହିବା ଉଚିତ]”।",
      context: "ଶ୍ରେଣୀ [11]ର ଛାତ୍ରଛାତ୍ରୀଙ୍କ ଆନ୍ତଃବିଦ୍ୟାଳୟ ବିତର୍କ ପ୍ରତିଯୋଗିତା ପାଇଁ। ପ୍ରତ୍ୟେକ ବକ୍ତା 3 ମିନିଟ ପାଇବେ।",
      cons: "ପକ୍ଷରେ 5ଟି ଓ ବିପକ୍ଷରେ 5ଟି ବିନ୍ଦୁ ଦିଅନ୍ତୁ।\nପ୍ରତ୍ୟେକ ବିନ୍ଦୁ ସହ ଗୋଟିଏ ତଥ୍ୟ ବା ଉଦାହରଣ ଦିଅନ୍ତୁ, ଏବଂ ମୁଁ ପୁଣି ଯାଞ୍ଚ କରିବା ଉଚିତ ଥିବା ତଥ୍ୟଗୁଡ଼ିକୁ ଚିହ୍ନିତ କରନ୍ତୁ।\nପ୍ରତ୍ୟେକ ପକ୍ଷ ପାଇଁ 2ଟି ସମ୍ଭାବ୍ୟ ପ୍ରତିଯୁକ୍ତି ଯୋଡ଼ନ୍ତୁ।\nକଥା ସନ୍ତୁଳିତ ଓ ସମ୍ମାନଜନକ ରଖନ୍ତୁ।",
      ex: ""
    },
    summary: {
      title: "ନୋଟ୍‌ର ସାରାଂଶ",
      desc: "ଲମ୍ବା ନୋଟ୍‌କୁ ପୁନରାବୃତ୍ତି ବିନ୍ଦୁରେ ବଦଳାନ୍ତୁ",
      role: "ଜଣେ ପଢ଼ା ସହାୟକ, ଯିଏ ସ୍ପଷ୍ଟ ପୁନରାବୃତ୍ତି ନୋଟ୍ ତିଆରି କରନ୍ତି",
      task: "ତଳେ ଦିଆଯାଇଥିବା ମୋ ନୋଟ୍‌ର ସାରାଂଶ ପୁନରାବୃତ୍ତି ପାଇଁ ମୁଖ୍ୟ ବିନ୍ଦୁରେ ଲେଖନ୍ତୁ।",
      context: "[ବିଷୟ] ଉପରେ ଏଗୁଡ଼ିକ ମୋ ଶ୍ରେଣୀ ନୋଟ୍: [ଆପଣଙ୍କ ନୋଟ୍ ଏଠାରେ ପେଷ୍ଟ କରନ୍ତୁ]",
      cons: "ଅଧିକରୁ ଅଧିକ 10ଟି ବିନ୍ଦୁ ରଖନ୍ତୁ।\nସବୁ ଜରୁରୀ ଶବ୍ଦ, ତାରିଖ ଓ ସୂତ୍ର ରଖନ୍ତୁ।\nନିଜକୁ ଯାଞ୍ଚ କରିବା ପାଇଁ 3ଟି ପ୍ରଶ୍ନ ଯୋଡ଼ନ୍ତୁ।\nମୋ ନୋଟ୍‌ରେ ନଥିବା କିଛି ଯୋଡ଼ନ୍ତୁ ନାହିଁ।",
      ex: ""
    },
    interview: {
      title: "ସାକ୍ଷାତକାର ଅଭ୍ୟାସ",
      desc: "ଥରକେ ଗୋଟିଏ ପ୍ରଶ୍ନର ମକ୍ ସାକ୍ଷାତକାର",
      role: "[ଚାକିରି ବା କଲେଜ ନାମଲେଖା] ପାଇଁ ଜଣେ ବନ୍ଧୁତ୍ୱପୂର୍ଣ୍ଣ ସାକ୍ଷାତକାରୀ",
      task: "ସାକ୍ଷାତକାର ଅଭ୍ୟାସରେ ମୋତେ ସାହାଯ୍ୟ କରନ୍ତୁ। ଥରକେ ଗୋଟିଏ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ, ମୋ ଉତ୍ତରକୁ ଅପେକ୍ଷା କରନ୍ତୁ, ତା’ପରେ ମତାମତ ଦିଅନ୍ତୁ।",
      context: "ମୁଁ [B.Com ଶେଷ ବର୍ଷର ଛାତ୍ର/ଛାତ୍ରୀ] ଏବଂ [ଚାକିରି ବା ପାଠ୍ୟକ୍ରମ] ପାଇଁ ଆବେଦନ କରୁଛି। ମୁଁ ନର୍ଭସ୍ ହୋଇଯାଏ ଓ ବହୁତ ଛୋଟ ଉତ୍ତର ଦିଏ।",
      cons: "ମୋଟ 8ଟି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ, ସହଜରୁ କଠିନ ଆଡ଼କୁ।\nପ୍ରତ୍ୟେକ ଉତ୍ତର ପରେ ଗୋଟିଏ ଭଲ ଦିଗ ଓ ଉନ୍ନତିର ଗୋଟିଏ କଥା କୁହନ୍ତୁ।\nଶେଷରେ ଛୋଟ ସାରାଂଶ ଓ 3ଟି ପରାମର୍ଶ ଦିଅନ୍ତୁ।\nମୋର ପ୍ରକୃତ ନାମ, ଫୋନ୍ ନମ୍ବର ବା ଠିକଣା ପଚାରନ୍ତୁ ନାହିଁ।",
      ex: ""
    }
  }
};

window.APP_CONTENT.ta = {
  asm: {
    role: "நீங்கள் {x}.",
    task: "பணி: {x}",
    context: "பின்னணி: {x}",
    aud: "இது யாருக்காக: {x}. அவர்கள் எளிதில் புரிந்துகொள்ளும் சொற்களையும் எடுத்துக்காட்டுகளையும் பயன்படுத்துங்கள்.",
    audv: {
      c1_5: "1–5 வகுப்புக் குழந்தைகள் (சுமார் 6–10 வயது)",
      c6_8: "6–8 வகுப்பு மாணவர்கள் (சுமார் 11–13 வயது)",
      c9_10: "9–10 வகுப்பு மாணவர்கள் (சுமார் 14–15 வயது)",
      c11_12: "11–12 வகுப்பு மாணவர்கள் (சுமார் 16–17 வயது)",
      ug: "கல்லூரி மாணவர்கள்",
      teachers: "பள்ளி ஆசிரியர்கள்",
      parents: "பள்ளி மாணவர்களின் பெற்றோர்",
      general: "பொது வாசகர்கள்"
    },
    fmt: {
      list: "வடிவம்: பதிலைச் சிறிய, தெளிவான குறிப்புகளின் எண்ணிட்ட பட்டியலாகத் தாருங்கள்.",
      table: "வடிவம்: பதிலை ஒரு அட்டவணையாகத் தாருங்கள்; ஒவ்வொரு நெடுவரிசைக்கும் தெளிவான தலைப்பு இருக்கட்டும்.",
      paragraph: "வடிவம்: சிறிய, ஒழுங்கான பத்திகளாக எழுதுங்கள்.",
      quiz: "வடிவம்: இதை ஒரு வினாடி வினாவாக்குங்கள். ஒவ்வொரு கேள்விக்கும் நான்கு விருப்பங்கள் (A–D) தாருங்கள்; இறுதியில் ஒரு வரி விளக்கத்துடன் விடைக் குறிப்பைத் தாருங்கள்.",
      steps: "வடிவம்: படிப்படியாக விளக்குங்கள்; ஒவ்வொரு படிக்கும் எண்ணும் சிறிய தலைப்பும் இருக்கட்டும்.",
      letter: "வடிவம்: இதை முறையான கடிதம் அல்லது அறிவிப்பாக எழுதுங்கள்: தேதி, பொருள், விளிப்பு, முக்கியச் செய்தி, இறுதியில் பெயர்/பதவி."
    },
    tone: "தொனி: {x}.",
    tonev: {
      friendly: "நட்பான, அன்பான",
      formal: "முறையான, பணிவான",
      encouraging: "ஊக்கமளிக்கும், நேர்மறையான",
      simple: "எளிய, தெளிவான",
      fun: "வேடிக்கையான, உற்சாகமான",
      neutral: "நடுநிலையான, சமநிலையான"
    },
    len: {
      vshort: "நீளம்: மிகச் சிறியது, சுமார் 100 சொற்கள்.",
      short: "நீளம்: சிறியது, சுமார் 150–250 சொற்கள்.",
      medium: "நீளம்: நடுத்தரம், சுமார் 300–500 சொற்கள்.",
      long: "நீளம்: விரிவாகவும் முழுமையாகவும், ஆனால் தேவையற்ற சொற்கள் இல்லாமல்."
    },
    lang: "மொழி: முழுப் பதிலையும் எளிய தமிழில் எழுதுங்கள்.",
    rules: "இந்த விதிகளைப் பின்பற்றுங்கள்:",
    example: "நான் விரும்பும் பாணிக்கு ஓர் எடுத்துக்காட்டு:",
    ask: "முக்கியமான தகவல் ஏதாவது விடுபட்டிருந்தால், முதலில் என்னிடம் அதிகபட்சம் 3 சிறிய கேள்விகள் கேட்டு, பிறகு பதில் தாருங்கள்.",
    unsure: "ஏதாவது ஒரு உண்மை பற்றி உறுதியாகத் தெரியாவிட்டால், ஊகிக்காமல் அதைத் தெளிவாகச் சொல்லுங்கள்."
  },
  chips: [
    { label: "இந்திய எடுத்துக்காட்டுகள்", text: "அன்றாட இந்திய வாழ்க்கையிலிருந்து எடுத்துக்காட்டுகள் தாருங்கள் (இந்தியப் பெயர்கள், இடங்கள், உணவு, பண்டிகைகள், ₹)." },
    { label: "NCERT பாடத்திட்டம்", text: "இந்த வகுப்பின் NCERT/CBSE பாடத்திட்டத்துக்குள்ளேயே இருங்கள்." },
    { label: "எளிய சொற்கள்", text: "எளிய சொற்களைப் பயன்படுத்துங்கள்; கடினமான சொல்லின் பொருளை அடைப்புக்குறிக்குள் தாருங்கள்." },
    { label: "விடைக் குறிப்பு", text: "இறுதியில் விடைக் குறிப்பு தாருங்கள்." },
    { label: "ஆதாரங்கள்", text: "நான் சரிபார்க்கக்கூடிய ஆதாரங்களைக் குறிப்பிடுங்கள், எ.கா. NCERT பாடநூல் அத்தியாயங்கள்." },
    { label: "பாரபட்சம் வேண்டாம்", text: "அனைவரையும் உள்ளடக்கி மரியாதையுடன் எழுதுங்கள்: பாலினம், சாதி, மதம், பகுதி குறித்து எந்த ஒரே மாதிரியான முன்முடிவுகளும் வேண்டாம்." },
    { label: "குறைந்த செலவுச் செயல்பாடு", text: "மலிவான பொருட்கள் மட்டுமே தேவைப்படும் ஒரு வகுப்புச் செயல்பாட்டைச் சேருங்கள்." },
    { label: "எளிது + கடினம்", text: "வெவ்வேறு மாணவர்களுக்காக ஓர் எளிய வடிவமும் ஒரு சவாலான வடிவமும் தாருங்கள்." }
  ],
  templates: {
    lesson5e: {
      title: "பாடத்திட்டம் (5E)",
      desc: "40 நிமிடச் செயல்பாட்டுப் பாடம்",
      role: "செயல்பாடுகள் மூலம் பாடம் திட்டமிடும் அனுபவமிக்க CBSE அறிவியல் ஆசிரியர்",
      task: "[தலைப்பு] பற்றி 5E மாதிரியில் 40 நிமிடப் பாடத்திட்டம் தயாரியுங்கள்: Engage (ஈர்த்தல்), Explore (ஆராய்தல்), Explain (விளக்குதல்), Elaborate (விரிவாக்குதல்), Evaluate (மதிப்பிடுதல்).",
      context: "[7]ஆம் வகுப்பு அறிவியல், NCERT அத்தியாயம் “[அத்தியாயத்தின் பெயர்]”. சுமார் 40 மாணவர்கள், ஒரு ஸ்மார்ட்போர்டு, சாதாரணப் பொருட்கள் மட்டுமே உள்ளன. சில மாணவர்களுக்கு ஆங்கிலம் கடினமாக இருக்கிறது.",
      cons: "ஒவ்வொரு நிலைக்கும் நேரத்தைக் குறிப்பிடுங்கள்; மொத்தம் 40 நிமிடமே இருக்க வேண்டும்.\nஇந்தியப் பள்ளியில் எளிதில் கிடைக்கும் மலிவான பொருட்களைப் பயன்படுத்துங்கள்.\nஇறுதியில் புரிதலைச் சோதிக்க 3 சிறிய கேள்விகள் தாருங்கள்.\nஒரு சிறிய வீட்டுப்பாடத்தைப் பரிந்துரையுங்கள்.",
      ex: "Engage (5 நிமிடம்): பனிக்கட்டி போட்ட குளிர்ந்த நீர் கொண்ட ஒரு குவளையைக் காட்டி, “குவளையின் வெளியே இந்தத் துளிகள் எங்கிருந்து வந்தன?” என்று கேளுங்கள்."
    },
    mcq10: {
      title: "அத்தியாயத்தில் 10 MCQ",
      desc: "விடைக் குறிப்புடன் மீள்பார்வை வினாடி வினா",
      role: "கவனமாக வினாத்தாள் தயாரிக்கும் CBSE வினாத்தாள் அமைப்பாளர்",
      task: "“[அத்தியாயத்தின் பெயர்]” அத்தியாயத்தில் 10 பல்தேர்வு வினாக்கள் (MCQ) எழுதுங்கள்.",
      context: "[9]ஆம் வகுப்பு [பாடம்], NCERT பாடநூல். அத்தியாயம் முடிந்த பிறகு நடத்தும் மீள்பார்வைத் தேர்வு இது.",
      cons: "கடினத்தைக் கலந்து வையுங்கள்: 4 எளிய, 4 நடுத்தர, 2 கடினமான கேள்விகள்.\nஒவ்வொரு கேள்விக்கும் சரியாக ஒரே ஒரு சரியான விடைதான் இருக்க வேண்டும்.\n“மேற்கண்ட அனைத்தும்” அல்லது “எதுவுமில்லை” போன்ற விருப்பங்களைத் தவிருங்கள்.\nஒவ்வொரு விடைக்கும் ஒரு வரிக் காரணத்துடன் விடைக் குறிப்பு தாருங்கள்.",
      ex: "வினா 1. உணவு தயாரிக்கத் தாவரங்கள் எந்த வாயுவை எடுத்துக்கொள்கின்றன?\n(A) ஆக்சிஜன்  (B) கார்பன் டை ஆக்சைடு  (C) நைட்ரஜன்  (D) ஹைட்ரஜன்\nவிடை: (B). தாவரங்கள் சூரிய ஒளியில் கார்பன் டை ஆக்சைடு, நீர் ஆகியவற்றைக் கொண்டு உணவு தயாரிக்கின்றன."
    },
    explain: {
      title: "கருத்தை எளிதாக விளக்கு",
      desc: "அன்றாட இந்திய எடுத்துக்காட்டுடன்",
      role: "கடினமான கருத்துகளை எளிய சொற்களில் விளக்கும் பொறுமையான ஆசிரியர்",
      task: "[கருத்து, எ.கா. உராய்வு] என்பதை எளிய சொற்களில் விளக்குங்கள்.",
      context: "மாணவர்கள் இதை முதல் முறையாகக் கற்கிறார்கள். இந்தியாவின் அன்றாட வாழ்க்கையிலிருந்து ஓர் எடுத்துக்காட்டு தாருங்கள், எ.கா. சமையலறை, கிரிக்கெட் போட்டி, ரயில் பயணம் அல்லது ஒரு பண்டிகை.",
      cons: "ஒரு வரி வரையறையுடன் தொடங்குங்கள்.\nஅன்றாட இந்திய வாழ்க்கையிலிருந்து ஓர் எடுத்துக்காட்டு தாருங்கள்.\nஇறுதியில் மாணவர்களைச் சிந்திக்க வைக்கும் ஒரு கேள்வி தாருங்கள்.\nதொழில்நுட்பச் சொல் வந்தால் அதன் பொருளை விளக்குங்கள்.",
      ex: "இரண்டு பரப்புகள் ஒன்றோடொன்று உரசும்போது பொருட்களின் வேகத்தைக் குறைக்கும் விசையே உராய்வு. அதனால்தான் புல்வெளியில் உருளும் கிரிக்கெட் பந்து மெல்ல மெல்ல நின்றுவிடுகிறது."
    },
    rubric: {
      title: "மதிப்பீட்டு அளவுகோல்",
      desc: "திட்டப்பணிக்கு நியாயமான அளவுகோல்களும் நிலைகளும்",
      role: "நியாயமான மதிப்பீட்டு அளவுகோல்களை உருவாக்கும் அனுபவமிக்க ஆசிரியர்",
      task: "[ஒப்படைப்பு, எ.கா. அறிவியல் மாதிரி] க்கான மதிப்பீட்டு அளவுகோலை (rubric) உருவாக்குங்கள்.",
      context: "[8]ஆம் வகுப்பு. திட்டப்பணி 20 மதிப்பெண்களுக்கு. மாணவர்கள் 4 பேர் கொண்ட குழுக்களாக இரண்டு வாரம் வேலை செய்தனர்.",
      cons: "4 அளவுகோல்களும் 4 நிலைகளும் வையுங்கள்: மிகச் சிறப்பு, நன்று, திருப்திகரம், முன்னேற்றம் தேவை.\nஒவ்வொரு நிலையையும் ஒரு தெளிவான வாக்கியத்தில் விவரியுங்கள்.\nஒவ்வொரு நிலைக்கும் மதிப்பெண்களைக் காட்டுங்கள்; மொத்தம் 20 ஆக இருப்பதை உறுதிசெய்யுங்கள்.\nகுழுப்பணிக்கு ஓர் அளவுகோல் கட்டாயம் வையுங்கள்.",
      ex: ""
    },
    parentletter: {
      title: "பெற்றோருக்கான அறிவிப்பு",
      desc: "பள்ளி நிகழ்வுக்குத் தெளிவான, பணிவான அறிவிப்பு",
      role: "பெற்றோருக்குத் தெளிவான, பணிவான அறிவிப்புகள் எழுதும் பள்ளித் தலைமையாசிரியர்",
      task: "[நிகழ்வு, எ.கா. பெற்றோர்-ஆசிரியர் கூட்டம்] பற்றிப் பெற்றோருக்கு ஓர் அறிவிப்பு எழுதுங்கள்.",
      context: "தேதி: [தேதி]. நேரம்: [நேரம்]. இடம்: [பள்ளி அரங்கம்]. பல பெற்றோருக்கு ஆங்கிலத்தைவிடத் தங்கள் வீட்டு மொழியே எளிது.",
      cons: "150 சொற்களுக்குள் வையுங்கள்.\nதேதி, நேரம், இடம், பெற்றோர் கொண்டுவர வேண்டியவை ஆகியவற்றைக் குறிப்பிடுங்கள்.\nஇறுதியில் ஒரு சிறிய பதில் சீட்டைச் சேருங்கள்.\nஎந்த மாணவரின் பெயரையோ தொலைபேசி எண்ணையோ சேர்க்காதீர்கள்.",
      ex: ""
    },
    story: {
      title: "குழந்தைகளுக்கான கதை",
      desc: "கேள்விகளுடன் ஒரு சிறிய நீதிக்கதை",
      role: "இந்தியாவைச் சேர்ந்த ஒரு குழந்தைக் கதைசொல்லி",
      task: "[நற்பண்பு, எ.கா. பகிர்ந்துகொள்ளுதல் அல்லது தண்ணீர் சேமிப்பு] கற்றுத்தரும் ஒரு சிறிய குழந்தைக் கதையை எழுதுங்கள்.",
      context: "இந்தக் கதை [3]ஆம் வகுப்புக் குழந்தைகளுக்கானது. கதை ஓர் இந்தியக் கிராமத்திலோ நகரத்திலோ நடக்கட்டும்; இந்தியப் பெயர்களும் குழந்தைகளுக்குத் தெரிந்த விலங்குகளும் இருக்கட்டும்.",
      cons: "சிறிய வாக்கியங்களையும் எளிய சொற்களையும் பயன்படுத்துங்கள்.\nசில உரையாடல்களைச் சேருங்கள்.\nஇறுதியில் நீதியை ஒரு வரியில் எழுதுங்கள்.\nகதை பற்றி 3 எளிய கேள்விகளைச் சேருங்கள்.",
      ex: ""
    },
    essayfb: {
      title: "கட்டுரைக்குக் கருத்து",
      desc: "மாணவருக்குப் பயன்படும் அன்பான, துல்லியமான கருத்து",
      role: "அன்பும் நேர்மையும் கொண்ட மொழி ஆசிரியர்",
      task: "கீழே உள்ள மாணவரின் கட்டுரைக்குக் கருத்து தாருங்கள்.",
      context: "[9]ஆம் வகுப்புக் கட்டுரை, தலைப்பு “[தலைப்பு]”. சொல் வரம்பு 250 சொற்கள். கட்டுரை (மாணவர் பெயர் இல்லாமல்): [கட்டுரையை இங்கே ஒட்டுங்கள்]",
      cons: "முதலில் மாணவர் நன்றாகச் செய்த 2 விஷயங்களைச் சொல்லுங்கள்.\nபிறகு மேம்படுத்த 3 துல்லியமான வழிகளைச் சொல்லுங்கள், ஒவ்வொன்றுக்கும் ஓர் எடுத்துக்காட்டு வாக்கியத்துடன்.\nகருத்துகள், அமைப்பு, இலக்கணம் ஆகியவற்றைத் தனித்தனியாக மதிப்பிடுங்கள்.\nமுழுக் கட்டுரையையும் மாற்றி எழுதாதீர்கள்.\n10-க்கு மதிப்பெண் தந்து சிறிய காரணம் சொல்லுங்கள்.",
      ex: ""
    },
    timetable: {
      title: "படிப்பு அட்டவணை",
      desc: "தேர்வுக்கு முன் நடைமுறைக்கு ஏற்ற வாரத் திட்டம்",
      role: "மாணவர்களுக்கு நடைமுறைக்கு ஏற்ற திட்டம் வகுக்க உதவும் படிப்புப் பயிற்சியாளர்",
      task: "என் தேர்வுகளுக்கு ஒரு வாராந்திரப் படிப்பு அட்டவணை தயாரியுங்கள்; தேர்வுகள் [தேதி] அன்று தொடங்குகின்றன.",
      context: "நான் [10]ஆம் வகுப்பில் படிக்கிறேன். பள்ளி காலை 8 முதல் மதியம் 2 மணி வரை. என் பாடங்கள்: கணிதம், அறிவியல், சமூக அறிவியல், ஆங்கிலம், [இரண்டாம் மொழி]. எனக்கு மிகவும் கடினமான பாடம் [பாடம்].",
      cons: "சிறிய இடைவேளைகள், விளையாட்டு நேரம், 8 மணி நேரத் தூக்கம் ஆகியவற்றைச் சேருங்கள்.\nகடினமான பாடத்துக்கு அதிக நேரம் கொடுங்கள்.\nஒவ்வொரு வாரமும் ஒரு நாளை மீள்பார்வைக்காக வையுங்கள்.\nஞாயிறு மாலையை ஓய்வாக வையுங்கள்.",
      ex: ""
    },
    debate: {
      title: "விவாதக் கருத்துகள்",
      desc: "ஆதரவும் எதிர்ப்புமான சமநிலைக் கருத்துகள்",
      role: "அனுபவமிக்க விவாதப் பயிற்சியாளர்",
      task: "இந்தத் தலைப்புக்கு ஆதரவாகவும் எதிராகவும் கருத்துகள் தாருங்கள்: “[தலைப்பு, எ.கா. பள்ளிகளில் கைபேசிக்கு அனுமதி வேண்டும்]”.",
      context: "[11]ஆம் வகுப்பு மாணவர்களின் பள்ளிகளுக்கு இடையிலான விவாதப் போட்டிக்கு. ஒவ்வொரு பேச்சாளருக்கும் 3 நிமிடம்.",
      cons: "ஆதரவாக 5, எதிராக 5 கருத்துகள் தாருங்கள்.\nஒவ்வொரு கருத்துக்கும் ஓர் உண்மை அல்லது எடுத்துக்காட்டு தாருங்கள்; நான் மீண்டும் சரிபார்க்க வேண்டிய உண்மைகளைக் குறியிடுங்கள்.\nஒவ்வொரு பக்கத்துக்கும் 2 மறுப்பு வாதங்களைச் சேருங்கள்.\nசமநிலையுடனும் மரியாதையுடனும் இருக்கட்டும்.",
      ex: ""
    },
    summary: {
      title: "குறிப்புகளின் சுருக்கம்",
      desc: "நீண்ட குறிப்புகளை மீள்பார்வைப் புள்ளிகளாக்கு",
      role: "தெளிவான மீள்பார்வைக் குறிப்புகள் தயாரிக்கும் படிப்பு உதவியாளர்",
      task: "கீழே உள்ள என் குறிப்புகளை மீள்பார்வைக்கான முக்கியப் புள்ளிகளாகச் சுருக்குங்கள்.",
      context: "[தலைப்பு] பற்றிய என் வகுப்புக் குறிப்புகள் இவை: [உங்கள் குறிப்புகளை இங்கே ஒட்டுங்கள்]",
      cons: "அதிகபட்சம் 10 புள்ளிகள் வையுங்கள்.\nமுக்கியச் சொற்கள், தேதிகள், சூத்திரங்கள் அனைத்தையும் வைத்திருங்கள்.\nஎன்னை நானே சோதிக்க 3 கேள்விகளைச் சேருங்கள்.\nஎன் குறிப்புகளில் இல்லாத எதையும் சேர்க்காதீர்கள்.",
      ex: ""
    },
    interview: {
      title: "நேர்காணல் பயிற்சி",
      desc: "ஒரு நேரத்தில் ஒரு கேள்வி கொண்ட மாதிரி நேர்காணல்",
      role: "[வேலை அல்லது கல்லூரிச் சேர்க்கை]க்கான நட்பான நேர்காணல் செய்பவர்",
      task: "நேர்காணல் பயிற்சியில் எனக்கு உதவுங்கள். ஒரு நேரத்தில் ஒரு கேள்வி மட்டும் கேட்டு, என் பதிலுக்குக் காத்திருந்து, பிறகு கருத்து தாருங்கள்.",
      context: "நான் [B.Com இறுதியாண்டு மாணவர்], [வேலை அல்லது படிப்பு]க்கு விண்ணப்பிக்கிறேன். நான் பதற்றமடைந்து மிகச் சிறிய பதில்களைச் சொல்கிறேன்.",
      cons: "மொத்தம் 8 கேள்விகள் கேளுங்கள், எளிதிலிருந்து கடினம் வரை.\nஒவ்வொரு பதிலுக்குப் பிறகும் ஒரு பலத்தையும் மேம்படுத்த ஒரு விஷயத்தையும் சொல்லுங்கள்.\nஇறுதியில் ஒரு சிறிய சுருக்கமும் 3 குறிப்புகளும் தாருங்கள்.\nஎன் உண்மையான பெயர், தொலைபேசி எண், முகவரியைக் கேட்காதீர்கள்.",
      ex: ""
    }
  }
};

window.APP_CONTENT.te = {
  asm: {
    role: "మీరు {x}.",
    task: "పని: {x}",
    context: "నేపథ్యం: {x}",
    aud: "ఇది ఎవరి కోసం: {x}. వారు సులభంగా అర్థం చేసుకునే పదాలు, ఉదాహరణలు వాడండి.",
    audv: {
      c1_5: "1–5 తరగతుల పిల్లలు (సుమారు 6–10 ఏళ్లు)",
      c6_8: "6–8 తరగతుల విద్యార్థులు (సుమారు 11–13 ఏళ్లు)",
      c9_10: "9–10 తరగతుల విద్యార్థులు (సుమారు 14–15 ఏళ్లు)",
      c11_12: "11–12 తరగతుల విద్యార్థులు (సుమారు 16–17 ఏళ్లు)",
      ug: "కళాశాల విద్యార్థులు",
      teachers: "పాఠశాల ఉపాధ్యాయులు",
      parents: "పాఠశాల పిల్లల తల్లిదండ్రులు",
      general: "సాధారణ పాఠకులు"
    },
    fmt: {
      list: "ఫార్మాట్: జవాబును చిన్న, స్పష్టమైన అంశాల సంఖ్యల జాబితాగా ఇవ్వండి.",
      table: "ఫార్మాట్: జవాబును పట్టికగా ఇవ్వండి; ప్రతి నిలువు వరుసకు స్పష్టమైన శీర్షిక ఉండాలి.",
      paragraph: "ఫార్మాట్: చిన్న, చక్కగా అమర్చిన పేరాగ్రాఫ్‌లలో రాయండి.",
      quiz: "ఫార్మాట్: దీన్ని క్విజ్‌గా చేయండి. ప్రతి ప్రశ్నకు నాలుగు ఎంపికలు (A–D) ఇవ్వండి; చివర్లో ఒక్క లైన్ వివరణతో జవాబుల కీ ఇవ్వండి.",
      steps: "ఫార్మాట్: దశలవారీగా వివరించండి; ప్రతి దశకు సంఖ్య, చిన్న శీర్షిక ఉండాలి.",
      letter: "ఫార్మాట్: దీన్ని అధికారిక లేఖ లేదా ప్రకటనగా రాయండి: తేదీ, విషయం, సంబోధన, ముఖ్య సందేశం, చివర్లో పేరు/హోదా."
    },
    tone: "శైలి: {x}.",
    tonev: {
      friendly: "స్నేహపూర్వకంగా, ఆప్యాయంగా",
      formal: "అధికారికంగా, మర్యాదగా",
      encouraging: "ప్రోత్సాహకరంగా, సానుకూలంగా",
      simple: "సరళంగా, స్పష్టంగా",
      fun: "సరదాగా, ఉత్సాహంగా",
      neutral: "తటస్థంగా, సమతుల్యంగా"
    },
    len: {
      vshort: "పొడవు: చాలా చిన్నది, సుమారు 100 పదాలు.",
      short: "పొడవు: చిన్నది, సుమారు 150–250 పదాలు.",
      medium: "పొడవు: మధ్యస్థం, సుమారు 300–500 పదాలు.",
      long: "పొడవు: వివరంగా, పూర్తిగా, కానీ అనవసరమైన మాటలు లేకుండా."
    },
    lang: "భాష: మొత్తం జవాబును సరళమైన తెలుగులో రాయండి.",
    rules: "ఈ నియమాలు పాటించండి:",
    example: "నాకు కావాల్సిన శైలికి ఒక ఉదాహరణ:",
    ask: "ముఖ్యమైన సమాచారం ఏదైనా లేకపోతే, ముందు నన్ను గరిష్ఠంగా 3 చిన్న ప్రశ్నలు అడిగి, తర్వాత జవాబు ఇవ్వండి.",
    unsure: "ఏదైనా వాస్తవం గురించి ఖచ్చితంగా తెలియకపోతే, ఊహించకుండా ఆ విషయం స్పష్టంగా చెప్పండి."
  },
  chips: [
    { label: "భారతీయ ఉదాహరణలు", text: "రోజువారీ భారతీయ జీవితం నుంచి ఉదాహరణలు ఇవ్వండి (భారతీయ పేర్లు, ప్రదేశాలు, ఆహారం, పండుగలు, ₹)." },
    { label: "NCERT సిలబస్", text: "ఈ తరగతి NCERT/CBSE సిలబస్ పరిధిలోనే ఉండండి." },
    { label: "సులభమైన పదాలు", text: "సులభమైన పదాలు వాడండి; కష్టమైన పదానికి అర్థాన్ని బ్రాకెట్లలో ఇవ్వండి." },
    { label: "జవాబుల కీ", text: "చివర్లో జవాబుల కీ ఇవ్వండి." },
    { label: "మూలాలు", text: "నేను సరిచూసుకోగల మూలాలు చెప్పండి, ఉదా. NCERT పాఠ్యపుస్తక అధ్యాయాలు." },
    { label: "మూస భావనలు వద్దు", text: "అందరినీ కలుపుకొని, గౌరవంగా రాయండి: లింగం, కులం, మతం, ప్రాంతం గురించి మూస భావనలు వద్దు." },
    { label: "తక్కువ ఖర్చు కార్యకలాపం", text: "చౌకైన వస్తువులు మాత్రమే అవసరమయ్యే ఒక తరగతి కార్యకలాపాన్ని చేర్చండి." },
    { label: "సులభం + కష్టం", text: "వేర్వేరు విద్యార్థుల కోసం ఒక సులభమైన రూపం, ఒక సవాలుతో కూడిన రూపం ఇవ్వండి." }
  ],
  templates: {
    lesson5e: {
      title: "పాఠ ప్రణాళిక (5E)",
      desc: "40 నిమిషాల కార్యకలాప ఆధారిత పాఠం",
      role: "కార్యకలాపాల ఆధారంగా పాఠాలు ప్లాన్ చేసే అనుభవజ్ఞులైన CBSE సైన్స్ ఉపాధ్యాయులు",
      task: "[అంశం] పై 5E నమూనాలో 40 నిమిషాల పాఠ ప్రణాళిక తయారు చేయండి: Engage (ఆసక్తి కలిగించడం), Explore (అన్వేషణ), Explain (వివరణ), Elaborate (విస్తరణ), Evaluate (మూల్యాంకనం).",
      context: "[7]వ తరగతి సైన్స్, NCERT పాఠం “[పాఠం పేరు]”. సుమారు 40 మంది విద్యార్థులు, ఒక స్మార్ట్‌బోర్డ్, సాధారణ సామగ్రి మాత్రమే ఉన్నాయి. కొందరు విద్యార్థులకు ఇంగ్లీష్ కష్టంగా ఉంటుంది.",
      cons: "ప్రతి దశకు సమయం రాయండి; మొత్తం 40 నిమిషాలే ఉండాలి.\nభారతీయ పాఠశాలలో సులభంగా దొరికే చౌకైన సామగ్రి వాడండి.\nచివర్లో అవగాహన పరీక్షించడానికి 3 చిన్న ప్రశ్నలు ఇవ్వండి.\nఒక చిన్న హోంవర్క్ సూచించండి.",
      ex: "Engage (5 నిమిషాలు): ఐస్ వేసిన చల్లని నీళ్ల గ్లాసు చూపించి, “గ్లాసు బయట ఈ నీటి చుక్కలు ఎక్కడి నుంచి వచ్చాయి?” అని అడగండి."
    },
    mcq10: {
      title: "పాఠంపై 10 MCQలు",
      desc: "జవాబుల కీతో పునశ్చరణ క్విజ్",
      role: "జాగ్రత్తగా ప్రశ్నపత్రం తయారు చేసే CBSE పేపర్ సెట్టర్",
      task: "“[పాఠం పేరు]” పాఠంపై 10 బహుళైచ్ఛిక ప్రశ్నలు (MCQ) రాయండి.",
      context: "[9]వ తరగతి [సబ్జెక్టు], NCERT పాఠ్యపుస్తకం. పాఠం పూర్తయిన తర్వాత ఇది ఒక పునశ్చరణ పరీక్ష.",
      cons: "కష్టతను కలిపి ఉంచండి: 4 సులభమైన, 4 మధ్యస్థ, 2 కష్టమైన ప్రశ్నలు.\nప్రతి ప్రశ్నకు ఒక్కటే సరైన జవాబు ఉండాలి.\n“పైవన్నీ” లేదా “ఏదీ కాదు” వంటి ఎంపికలు వాడవద్దు.\nప్రతి జవాబుకు ఒక్క లైన్ కారణంతో జవాబుల కీ ఇవ్వండి.",
      ex: "ప్ర1. ఆహారం తయారు చేసుకోవడానికి మొక్కలు ఏ వాయువును తీసుకుంటాయి?\n(A) ఆక్సిజన్  (B) కార్బన్ డై ఆక్సైడ్  (C) నైట్రోజన్  (D) హైడ్రోజన్\nజవాబు: (B). మొక్కలు సూర్యకాంతిలో కార్బన్ డై ఆక్సైడ్, నీటితో ఆహారం తయారు చేసుకుంటాయి."
    },
    explain: {
      title: "భావనను సులభంగా వివరించండి",
      desc: "రోజువారీ భారతీయ ఉదాహరణతో",
      role: "కష్టమైన విషయాలను సులభమైన మాటల్లో వివరించే ఓపికగల ఉపాధ్యాయులు",
      task: "[భావన, ఉదా. ఘర్షణ] ను సులభమైన మాటల్లో వివరించండి.",
      context: "విద్యార్థులు దీన్ని మొదటిసారి నేర్చుకుంటున్నారు. భారతదేశ రోజువారీ జీవితం నుంచి ఒక ఉదాహరణ ఇవ్వండి, ఉదా. వంటగది, క్రికెట్ మ్యాచ్, రైలు ప్రయాణం లేదా ఒక పండుగ.",
      cons: "ఒక్క లైన్ నిర్వచనంతో మొదలుపెట్టండి.\nరోజువారీ భారతీయ జీవితం నుంచి ఒక ఉదాహరణ ఇవ్వండి.\nచివర్లో విద్యార్థులను ఆలోచింపజేసే ఒక ప్రశ్న ఇవ్వండి.\nసాంకేతిక పదం వాడితే దాని అర్థం వివరించండి.",
      ex: "రెండు ఉపరితలాలు ఒకదానితో ఒకటి రాసుకున్నప్పుడు వస్తువుల వేగాన్ని తగ్గించే బలమే ఘర్షణ. అందుకే గడ్డిపై దొర్లే క్రికెట్ బంతి నెమ్మదిగా ఆగిపోతుంది."
    },
    rubric: {
      title: "మూల్యాంకన రూబ్రిక్",
      desc: "ప్రాజెక్టుకు న్యాయమైన ప్రమాణాలు, స్థాయిలు",
      role: "న్యాయమైన మూల్యాంకన రూబ్రిక్‌లు తయారు చేసే అనుభవజ్ఞులైన ఉపాధ్యాయులు",
      task: "[అసైన్‌మెంట్, ఉదా. సైన్స్ మోడల్] కోసం ఒక మూల్యాంకన రూబ్రిక్ తయారు చేయండి.",
      context: "[8]వ తరగతి. ప్రాజెక్టు 20 మార్కులకు. విద్యార్థులు 4 మంది బృందాలుగా రెండు వారాలు పనిచేశారు.",
      cons: "4 ప్రమాణాలు, 4 స్థాయిలు ఉంచండి: అత్యుత్తమం, మంచిది, సంతృప్తికరం, మెరుగుపడాలి.\nప్రతి స్థాయిని ఒక స్పష్టమైన వాక్యంలో వివరించండి.\nప్రతి స్థాయికి మార్కులు చూపించండి; మొత్తం 20 అయ్యేలా చూడండి.\nబృందకృషికి ఒక ప్రమాణం తప్పక ఉంచండి.",
      ex: ""
    },
    parentletter: {
      title: "తల్లిదండ్రులకు ప్రకటన",
      desc: "పాఠశాల కార్యక్రమానికి స్పష్టమైన, మర్యాదపూర్వక ప్రకటన",
      role: "తల్లిదండ్రుల కోసం స్పష్టమైన, మర్యాదపూర్వక ప్రకటనలు రాసే పాఠశాల ప్రధానోపాధ్యాయులు",
      task: "[కార్యక్రమం, ఉదా. తల్లిదండ్రులు-ఉపాధ్యాయుల సమావేశం] గురించి తల్లిదండ్రులకు ఒక ప్రకటన రాయండి.",
      context: "తేదీ: [తేదీ]. సమయం: [సమయం]. స్థలం: [పాఠశాల హాలు]. చాలా మంది తల్లిదండ్రులకు ఇంగ్లీష్ కంటే తమ ఇంటి భాషే సులభం.",
      cons: "150 పదాల లోపు ఉంచండి.\nతేదీ, సమయం, స్థలం, తల్లిదండ్రులు ఏం తీసుకురావాలో రాయండి.\nచివర్లో ఒక చిన్న జవాబు స్లిప్ జోడించండి.\nఏ విద్యార్థి పేరు గానీ ఫోన్ నంబర్ గానీ రాయవద్దు.",
      ex: ""
    },
    story: {
      title: "పిల్లల కోసం కథ",
      desc: "ప్రశ్నలతో ఒక చిన్న నీతి కథ",
      role: "భారతదేశానికి చెందిన ఒక పిల్లల కథకులు",
      task: "[విలువ, ఉదా. పంచుకోవడం లేదా నీటిని పొదుపు చేయడం] నేర్పే ఒక చిన్న పిల్లల కథ రాయండి.",
      context: "ఈ కథ [3]వ తరగతి పిల్లల కోసం. కథ ఒక భారతీయ గ్రామంలో గానీ పట్టణంలో గానీ జరగాలి; భారతీయ పేర్లు, పిల్లలకు తెలిసిన జంతువులు ఉండాలి.",
      cons: "చిన్న వాక్యాలు, సులభమైన పదాలు వాడండి.\nకొన్ని సంభాషణలు చేర్చండి.\nచివర్లో నీతిని ఒక్క లైన్‌లో రాయండి.\nకథపై 3 సులభమైన ప్రశ్నలు జోడించండి.",
      ex: ""
    },
    essayfb: {
      title: "వ్యాసంపై అభిప్రాయం",
      desc: "విద్యార్థికి ఉపయోగపడే దయగల, నిర్దిష్ట అభిప్రాయం",
      role: "దయగల, నిజాయితీగల భాషా ఉపాధ్యాయులు",
      task: "కింద ఇచ్చిన విద్యార్థి వ్యాసంపై అభిప్రాయం ఇవ్వండి.",
      context: "[9]వ తరగతి వ్యాసం, అంశం “[అంశం]”. పదాల పరిమితి 250. వ్యాసం (విద్యార్థి పేరు లేకుండా): [వ్యాసాన్ని ఇక్కడ పేస్ట్ చేయండి]",
      cons: "ముందుగా విద్యార్థి బాగా చేసిన 2 విషయాలు చెప్పండి.\nతర్వాత మెరుగుపడటానికి 3 నిర్దిష్ట మార్గాలు చెప్పండి, ఒక్కోదానికి ఒక ఉదాహరణ వాక్యంతో.\nఆలోచనలు, నిర్మాణం, వ్యాకరణంపై విడివిడిగా వ్యాఖ్యానించండి.\nమొత్తం వ్యాసాన్ని తిరిగి రాయవద్దు.\n10కి మార్కులు ఇచ్చి చిన్న కారణం చెప్పండి.",
      ex: ""
    },
    timetable: {
      title: "చదువు టైమ్‌టేబుల్",
      desc: "పరీక్షల ముందు ఆచరణీయమైన వారపు ప్రణాళిక",
      role: "విద్యార్థులకు ఆచరణీయమైన ప్రణాళికలు వేయడంలో సహాయపడే స్టడీ కోచ్",
      task: "నా పరీక్షల కోసం వారపు చదువు టైమ్‌టేబుల్ తయారు చేయండి; పరీక్షలు [తేదీ] నుంచి మొదలవుతాయి.",
      context: "నేను [10]వ తరగతి చదువుతున్నాను. బడి ఉదయం 8 నుంచి మధ్యాహ్నం 2 వరకు. నా సబ్జెక్టులు: గణితం, సైన్స్, సాంఘిక శాస్త్రం, ఇంగ్లీష్, [రెండో భాష]. నాకు అత్యంత బలహీనమైన సబ్జెక్టు [సబ్జెక్టు].",
      cons: "చిన్న విరామాలు, ఆట సమయం, 8 గంటల నిద్ర చేర్చండి.\nబలహీనమైన సబ్జెక్టుకు ఎక్కువ సమయం ఇవ్వండి.\nప్రతి వారం ఒక రోజు పునశ్చరణకు ఉంచండి.\nఆదివారం సాయంత్రం ఖాళీగా ఉంచండి.",
      ex: ""
    },
    debate: {
      title: "చర్చా అంశాలు",
      desc: "అనుకూల, ప్రతికూల సమతుల్య అంశాలు",
      role: "అనుభవజ్ఞులైన డిబేట్ కోచ్",
      task: "ఈ అంశానికి అనుకూలంగా, ప్రతికూలంగా పాయింట్లు ఇవ్వండి: “[అంశం, ఉదా. పాఠశాలల్లో మొబైల్ ఫోన్‌లకు అనుమతి ఉండాలి]”.",
      context: "[11]వ తరగతి విద్యార్థుల అంతర్ పాఠశాల చర్చా పోటీ కోసం. ప్రతి వక్తకు 3 నిమిషాలు.",
      cons: "అనుకూలంగా 5, ప్రతికూలంగా 5 పాయింట్లు ఇవ్వండి.\nప్రతి పాయింట్‌కు ఒక వాస్తవం లేదా ఉదాహరణ ఇవ్వండి; నేను మళ్లీ సరిచూసుకోవాల్సిన వాస్తవాలను గుర్తించండి.\nప్రతి పక్షానికి 2 ప్రతివాదాలు జోడించండి.\nసమతుల్యంగా, గౌరవప్రదంగా ఉంచండి.",
      ex: ""
    },
    summary: {
      title: "నోట్స్ సారాంశం",
      desc: "పొడవైన నోట్స్‌ను పునశ్చరణ అంశాలుగా మార్చండి",
      role: "స్పష్టమైన పునశ్చరణ నోట్స్ తయారు చేసే చదువు సహాయకులు",
      task: "కింద ఇచ్చిన నా నోట్స్‌ను పునశ్చరణ కోసం ముఖ్య అంశాలుగా సంక్షిప్తం చేయండి.",
      context: "[అంశం] పై ఇవి నా తరగతి నోట్స్: [మీ నోట్స్‌ను ఇక్కడ పేస్ట్ చేయండి]",
      cons: "గరిష్ఠంగా 10 అంశాలు ఉంచండి.\nముఖ్యమైన పదాలు, తేదీలు, సూత్రాలు అన్నీ ఉంచండి.\nనన్ను నేను పరీక్షించుకోవడానికి 3 ప్రశ్నలు జోడించండి.\nనా నోట్స్‌లో లేనిది ఏదీ జోడించవద్దు.",
      ex: ""
    },
    interview: {
      title: "ఇంటర్వ్యూ ప్రాక్టీస్",
      desc: "ఒకసారి ఒక ప్రశ్నతో మాక్ ఇంటర్వ్యూ",
      role: "[ఉద్యోగం లేదా కళాశాల ప్రవేశం] కోసం స్నేహపూర్వక ఇంటర్వ్యూయర్",
      task: "ఇంటర్వ్యూ ప్రాక్టీస్‌లో నాకు సహాయం చేయండి. ఒకసారి ఒక ప్రశ్న మాత్రమే అడిగి, నా జవాబు కోసం ఆగి, తర్వాత అభిప్రాయం ఇవ్వండి.",
      context: "నేను [B.Com చివరి సంవత్సరం విద్యార్థి], [ఉద్యోగం లేదా కోర్సు] కోసం దరఖాస్తు చేస్తున్నాను. నేను కంగారుపడి చాలా చిన్న జవాబులు ఇస్తాను.",
      cons: "మొత్తం 8 ప్రశ్నలు అడగండి, సులభం నుంచి కష్టం వరకు.\nప్రతి జవాబు తర్వాత ఒక బలం, మెరుగుపరచుకోవాల్సిన ఒక విషయం చెప్పండి.\nచివర్లో చిన్న సారాంశం, 3 సూచనలు ఇవ్వండి.\nనా అసలు పేరు, ఫోన్ నంబర్, చిరునామా అడగవద్దు.",
      ex: ""
    }
  }
};

window.APP_CONTENT.kn = {
  asm: {
    role: "ನೀವು {x}.",
    task: "ಕೆಲಸ: {x}",
    context: "ಹಿನ್ನೆಲೆ: {x}",
    aud: "ಇದು ಯಾರಿಗಾಗಿ: {x}. ಅವರಿಗೆ ಸುಲಭವಾಗಿ ಅರ್ಥವಾಗುವ ಪದಗಳು ಮತ್ತು ಉದಾಹರಣೆಗಳನ್ನು ಬಳಸಿ.",
    audv: {
      c1_5: "1–5ನೇ ತರಗತಿಯ ಮಕ್ಕಳು (ಸುಮಾರು 6–10 ವರ್ಷ)",
      c6_8: "6–8ನೇ ತರಗತಿಯ ವಿದ್ಯಾರ್ಥಿಗಳು (ಸುಮಾರು 11–13 ವರ್ಷ)",
      c9_10: "9–10ನೇ ತರಗತಿಯ ವಿದ್ಯಾರ್ಥಿಗಳು (ಸುಮಾರು 14–15 ವರ್ಷ)",
      c11_12: "11–12ನೇ ತರಗತಿಯ ವಿದ್ಯಾರ್ಥಿಗಳು (ಸುಮಾರು 16–17 ವರ್ಷ)",
      ug: "ಕಾಲೇಜು ವಿದ್ಯಾರ್ಥಿಗಳು",
      teachers: "ಶಾಲಾ ಶಿಕ್ಷಕರು",
      parents: "ಶಾಲಾ ಮಕ್ಕಳ ಪೋಷಕರು",
      general: "ಸಾಮಾನ್ಯ ಓದುಗರು"
    },
    fmt: {
      list: "ಸ್ವರೂಪ: ಉತ್ತರವನ್ನು ಚಿಕ್ಕ, ಸ್ಪಷ್ಟ ಅಂಶಗಳ ಸಂಖ್ಯೆಯ ಪಟ್ಟಿಯಾಗಿ ಕೊಡಿ.",
      table: "ಸ್ವರೂಪ: ಉತ್ತರವನ್ನು ಕೋಷ್ಟಕವಾಗಿ ಕೊಡಿ; ಪ್ರತಿ ಕಾಲಂಗೆ ಸ್ಪಷ್ಟ ಶೀರ್ಷಿಕೆ ಇರಲಿ.",
      paragraph: "ಸ್ವರೂಪ: ಚಿಕ್ಕ, ಅಚ್ಚುಕಟ್ಟಾದ ಪ್ಯಾರಾಗಳಲ್ಲಿ ಬರೆಯಿರಿ.",
      quiz: "ಸ್ವರೂಪ: ಇದನ್ನು ರಸಪ್ರಶ್ನೆಯಾಗಿ ಮಾಡಿ. ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ ನಾಲ್ಕು ಆಯ್ಕೆಗಳು (A–D) ಕೊಡಿ; ಕೊನೆಯಲ್ಲಿ ಒಂದು ಸಾಲಿನ ವಿವರಣೆಯೊಂದಿಗೆ ಉತ್ತರ ಸೂಚಿ ಕೊಡಿ.",
      steps: "ಸ್ವರೂಪ: ಹಂತ ಹಂತವಾಗಿ ವಿವರಿಸಿ; ಪ್ರತಿ ಹಂತಕ್ಕೆ ಸಂಖ್ಯೆ ಮತ್ತು ಚಿಕ್ಕ ಶೀರ್ಷಿಕೆ ಇರಲಿ.",
      letter: "ಸ್ವರೂಪ: ಇದನ್ನು ಔಪಚಾರಿಕ ಪತ್ರ ಅಥವಾ ಸೂಚನೆಯಾಗಿ ಬರೆಯಿರಿ: ದಿನಾಂಕ, ವಿಷಯ, ಸಂಬೋಧನೆ, ಮುಖ್ಯ ಸಂದೇಶ ಮತ್ತು ಕೊನೆಯಲ್ಲಿ ಹೆಸರು/ಹುದ್ದೆ."
    },
    tone: "ಧಾಟಿ: {x}.",
    tonev: {
      friendly: "ಸ್ನೇಹಪರ ಮತ್ತು ಆತ್ಮೀಯ",
      formal: "ಔಪಚಾರಿಕ ಮತ್ತು ವಿನಯಪೂರ್ಣ",
      encouraging: "ಪ್ರೋತ್ಸಾಹದಾಯಕ ಮತ್ತು ಸಕಾರಾತ್ಮಕ",
      simple: "ಸರಳ ಮತ್ತು ಸ್ಪಷ್ಟ",
      fun: "ಮೋಜಿನ ಮತ್ತು ಉತ್ಸಾಹಭರಿತ",
      neutral: "ತಟಸ್ಥ ಮತ್ತು ಸಮತೋಲಿತ"
    },
    len: {
      vshort: "ಉದ್ದ: ತುಂಬಾ ಚಿಕ್ಕದು, ಸುಮಾರು 100 ಪದಗಳು.",
      short: "ಉದ್ದ: ಚಿಕ್ಕದು, ಸುಮಾರು 150–250 ಪದಗಳು.",
      medium: "ಉದ್ದ: ಮಧ್ಯಮ, ಸುಮಾರು 300–500 ಪದಗಳು.",
      long: "ಉದ್ದ: ವಿವರವಾದ ಮತ್ತು ಪೂರ್ಣ, ಆದರೆ ಅನಗತ್ಯ ಮಾತುಗಳಿಲ್ಲದೆ."
    },
    lang: "ಭಾಷೆ: ಸಂಪೂರ್ಣ ಉತ್ತರವನ್ನು ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಬರೆಯಿರಿ.",
    rules: "ಈ ನಿಯಮಗಳನ್ನು ಪಾಲಿಸಿ:",
    example: "ನನಗೆ ಬೇಕಾದ ಶೈಲಿಗೆ ಒಂದು ಉದಾಹರಣೆ:",
    ask: "ಮುಖ್ಯ ಮಾಹಿತಿ ಏನಾದರೂ ಇಲ್ಲದಿದ್ದರೆ, ಮೊದಲು ನನಗೆ ಹೆಚ್ಚೆಂದರೆ 3 ಚಿಕ್ಕ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ, ನಂತರ ಉತ್ತರ ಕೊಡಿ.",
    unsure: "ಯಾವುದಾದರೂ ಸತ್ಯಾಂಶದ ಬಗ್ಗೆ ಖಚಿತವಿಲ್ಲದಿದ್ದರೆ, ಊಹಿಸದೆ ಅದನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ."
  },
  chips: [
    { label: "ಭಾರತೀಯ ಉದಾಹರಣೆಗಳು", text: "ದಿನನಿತ್ಯದ ಭಾರತೀಯ ಜೀವನದಿಂದ ಉದಾಹರಣೆಗಳನ್ನು ಕೊಡಿ (ಭಾರತೀಯ ಹೆಸರುಗಳು, ಸ್ಥಳಗಳು, ಆಹಾರ, ಹಬ್ಬಗಳು, ₹)." },
    { label: "NCERT ಪಠ್ಯಕ್ರಮ", text: "ಈ ತರಗತಿಯ NCERT/CBSE ಪಠ್ಯಕ್ರಮದೊಳಗೇ ಇರಿ." },
    { label: "ಸರಳ ಪದಗಳು", text: "ಸರಳ ಪದಗಳನ್ನು ಬಳಸಿ; ಕಠಿಣ ಪದದ ಅರ್ಥವನ್ನು ಆವರಣದಲ್ಲಿ ಕೊಡಿ." },
    { label: "ಉತ್ತರ ಸೂಚಿ", text: "ಕೊನೆಯಲ್ಲಿ ಉತ್ತರ ಸೂಚಿ ಕೊಡಿ." },
    { label: "ಮೂಲಗಳು", text: "ನಾನು ಪರಿಶೀಲಿಸಬಹುದಾದ ಮೂಲಗಳನ್ನು ತಿಳಿಸಿ, ಉದಾ. NCERT ಪಠ್ಯಪುಸ್ತಕದ ಅಧ್ಯಾಯಗಳು." },
    { label: "ಪೂರ್ವಗ್ರಹ ಬೇಡ", text: "ಎಲ್ಲರನ್ನೂ ಒಳಗೊಂಡು ಗೌರವದಿಂದ ಬರೆಯಿರಿ: ಲಿಂಗ, ಜಾತಿ, ಧರ್ಮ ಅಥವಾ ಪ್ರದೇಶದ ಬಗ್ಗೆ ಯಾವುದೇ ಪೂರ್ವಗ್ರಹ ಬೇಡ." },
    { label: "ಕಡಿಮೆ ಖರ್ಚಿನ ಚಟುವಟಿಕೆ", text: "ಅಗ್ಗದ ವಸ್ತುಗಳು ಮಾತ್ರ ಬೇಕಾಗುವ ಒಂದು ತರಗತಿ ಚಟುವಟಿಕೆಯನ್ನು ಸೇರಿಸಿ." },
    { label: "ಸುಲಭ + ಕಠಿಣ", text: "ಬೇರೆ ಬೇರೆ ವಿದ್ಯಾರ್ಥಿಗಳಿಗಾಗಿ ಒಂದು ಸುಲಭ ರೂಪ ಮತ್ತು ಒಂದು ಹೆಚ್ಚು ಸವಾಲಿನ ರೂಪ ಕೊಡಿ." }
  ],
  templates: {
    lesson5e: {
      title: "ಪಾಠ ಯೋಜನೆ (5E)",
      desc: "40 ನಿಮಿಷದ ಚಟುವಟಿಕೆ ಆಧಾರಿತ ಪಾಠ",
      role: "ಚಟುವಟಿಕೆ ಆಧಾರಿತ ಪಾಠಗಳನ್ನು ಯೋಜಿಸುವ ಅನುಭವಿ CBSE ವಿಜ್ಞಾನ ಶಿಕ್ಷಕರು",
      task: "[ವಿಷಯ] ಕುರಿತು 5E ಮಾದರಿಯಲ್ಲಿ 40 ನಿಮಿಷದ ಪಾಠ ಯೋಜನೆ ತಯಾರಿಸಿ: Engage (ಆಸಕ್ತಿ ಮೂಡಿಸುವುದು), Explore (ಅನ್ವೇಷಣೆ), Explain (ವಿವರಣೆ), Elaborate (ವಿಸ್ತರಣೆ), Evaluate (ಮೌಲ್ಯಮಾಪನ).",
      context: "[7]ನೇ ತರಗತಿ ವಿಜ್ಞಾನ, NCERT ಅಧ್ಯಾಯ “[ಅಧ್ಯಾಯದ ಹೆಸರು]”. ಸುಮಾರು 40 ವಿದ್ಯಾರ್ಥಿಗಳು, ಒಂದು ಸ್ಮಾರ್ಟ್‌ಬೋರ್ಡ್ ಮತ್ತು ಸಾಮಾನ್ಯ ಸಾಮಗ್ರಿಗಳು ಮಾತ್ರ ಇವೆ. ಕೆಲವು ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಇಂಗ್ಲಿಷ್ ಕಷ್ಟ.",
      cons: "ಪ್ರತಿ ಹಂತದ ಸಮಯ ಬರೆಯಿರಿ; ಒಟ್ಟು 40 ನಿಮಿಷವೇ ಆಗಿರಬೇಕು.\nಭಾರತೀಯ ಶಾಲೆಯಲ್ಲಿ ಸುಲಭವಾಗಿ ಸಿಗುವ ಅಗ್ಗದ ಸಾಮಗ್ರಿಗಳನ್ನು ಬಳಸಿ.\nಕೊನೆಯಲ್ಲಿ ಅರ್ಥವಾಗಿದೆಯೇ ಎಂದು ಪರೀಕ್ಷಿಸಲು 3 ಚಿಕ್ಕ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೊಡಿ.\nಒಂದು ಚಿಕ್ಕ ಮನೆಗೆಲಸ ಸೂಚಿಸಿ.",
      ex: "Engage (5 ನಿಮಿಷ): ಮಂಜುಗಡ್ಡೆ ಹಾಕಿದ ತಣ್ಣೀರಿನ ಲೋಟ ತೋರಿಸಿ, “ಲೋಟದ ಹೊರಗೆ ಈ ಹನಿಗಳು ಎಲ್ಲಿಂದ ಬಂದವು?” ಎಂದು ಕೇಳಿ."
    },
    mcq10: {
      title: "ಅಧ್ಯಾಯದ ಮೇಲೆ 10 MCQ",
      desc: "ಉತ್ತರ ಸೂಚಿಯೊಂದಿಗೆ ಪುನರಾವರ್ತನೆ ರಸಪ್ರಶ್ನೆ",
      role: "ಎಚ್ಚರಿಕೆಯಿಂದ ಪ್ರಶ್ನೆಪತ್ರಿಕೆ ತಯಾರಿಸುವ CBSE ಪ್ರಶ್ನೆಪತ್ರಿಕೆ ರಚನಕಾರರು",
      task: "“[ಅಧ್ಯಾಯದ ಹೆಸರು]” ಅಧ್ಯಾಯದ ಮೇಲೆ 10 ಬಹು ಆಯ್ಕೆ ಪ್ರಶ್ನೆಗಳನ್ನು (MCQ) ಬರೆಯಿರಿ.",
      context: "[9]ನೇ ತರಗತಿ [ವಿಷಯ], NCERT ಪಠ್ಯಪುಸ್ತಕ. ಅಧ್ಯಾಯ ಮುಗಿದ ನಂತರದ ಪುನರಾವರ್ತನೆ ಪರೀಕ್ಷೆ ಇದು.",
      cons: "ಕಠಿಣತೆಯನ್ನು ಬೆರೆಸಿ: 4 ಸುಲಭ, 4 ಮಧ್ಯಮ ಮತ್ತು 2 ಕಠಿಣ ಪ್ರಶ್ನೆಗಳು.\nಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ ಒಂದೇ ಒಂದು ಸರಿಯಾದ ಉತ್ತರ ಇರಬೇಕು.\n“ಮೇಲಿನ ಎಲ್ಲವೂ” ಅಥವಾ “ಯಾವುದೂ ಅಲ್ಲ” ಆಯ್ಕೆಗಳನ್ನು ಬಳಸಬೇಡಿ.\nಪ್ರತಿ ಉತ್ತರಕ್ಕೆ ಒಂದು ಸಾಲಿನ ಕಾರಣದೊಂದಿಗೆ ಉತ್ತರ ಸೂಚಿ ಕೊಡಿ.",
      ex: "ಪ್ರ1. ಆಹಾರ ತಯಾರಿಸಲು ಸಸ್ಯಗಳು ಯಾವ ಅನಿಲವನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತವೆ?\n(A) ಆಮ್ಲಜನಕ  (B) ಇಂಗಾಲದ ಡೈಆಕ್ಸೈಡ್  (C) ಸಾರಜನಕ  (D) ಜಲಜನಕ\nಉತ್ತರ: (B). ಸಸ್ಯಗಳು ಸೂರ್ಯನ ಬೆಳಕಿನಲ್ಲಿ ಇಂಗಾಲದ ಡೈಆಕ್ಸೈಡ್ ಮತ್ತು ನೀರಿನಿಂದ ಆಹಾರ ತಯಾರಿಸುತ್ತವೆ."
    },
    explain: {
      title: "ಪರಿಕಲ್ಪನೆಯನ್ನು ಸರಳವಾಗಿ ವಿವರಿಸಿ",
      desc: "ದಿನನಿತ್ಯದ ಭಾರತೀಯ ಉದಾಹರಣೆಯೊಂದಿಗೆ",
      role: "ಕಠಿಣ ವಿಷಯಗಳನ್ನು ಸರಳ ಮಾತುಗಳಲ್ಲಿ ವಿವರಿಸುವ ತಾಳ್ಮೆಯ ಶಿಕ್ಷಕರು",
      task: "[ಪರಿಕಲ್ಪನೆ, ಉದಾ. ಘರ್ಷಣೆ] ಅನ್ನು ಸರಳ ಮಾತುಗಳಲ್ಲಿ ವಿವರಿಸಿ.",
      context: "ವಿದ್ಯಾರ್ಥಿಗಳು ಇದನ್ನು ಮೊದಲ ಬಾರಿ ಕಲಿಯುತ್ತಿದ್ದಾರೆ. ಭಾರತದ ದಿನನಿತ್ಯದ ಜೀವನದಿಂದ ಒಂದು ಉದಾಹರಣೆ ಕೊಡಿ, ಉದಾ. ಅಡುಗೆಮನೆ, ಕ್ರಿಕೆಟ್ ಪಂದ್ಯ, ರೈಲು ಪ್ರಯಾಣ ಅಥವಾ ಒಂದು ಹಬ್ಬ.",
      cons: "ಒಂದು ಸಾಲಿನ ವ್ಯಾಖ್ಯಾನದಿಂದ ಪ್ರಾರಂಭಿಸಿ.\nದಿನನಿತ್ಯದ ಭಾರತೀಯ ಜೀವನದಿಂದ ಒಂದು ಉದಾಹರಣೆ ಕೊಡಿ.\nಕೊನೆಯಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಯೋಚಿಸುವಂತೆ ಮಾಡುವ ಒಂದು ಪ್ರಶ್ನೆ ಕೊಡಿ.\nತಾಂತ್ರಿಕ ಪದ ಬಳಸಿದರೆ ಅದರ ಅರ್ಥ ವಿವರಿಸಿ.",
      ex: "ಎರಡು ಮೇಲ್ಮೈಗಳು ಒಂದಕ್ಕೊಂದು ಉಜ್ಜಿದಾಗ ವಸ್ತುಗಳ ವೇಗವನ್ನು ಕಡಿಮೆ ಮಾಡುವ ಬಲವೇ ಘರ್ಷಣೆ. ಅದಕ್ಕೇ ಹುಲ್ಲಿನ ಮೇಲೆ ಉರುಳುವ ಕ್ರಿಕೆಟ್ ಚೆಂಡು ನಿಧಾನವಾಗಿ ನಿಲ್ಲುತ್ತದೆ."
    },
    rubric: {
      title: "ಮೌಲ್ಯಮಾಪನ ರೂಬ್ರಿಕ್",
      desc: "ಯೋಜನೆಗೆ ನ್ಯಾಯಯುತ ಮಾನದಂಡಗಳು ಮತ್ತು ಹಂತಗಳು",
      role: "ನ್ಯಾಯಯುತ ಮೌಲ್ಯಮಾಪನ ರೂಬ್ರಿಕ್ ರಚಿಸುವ ಅನುಭವಿ ಶಿಕ್ಷಕರು",
      task: "[ನಿಯೋಜನೆ, ಉದಾ. ವಿಜ್ಞಾನ ಮಾದರಿ] ಗಾಗಿ ಮೌಲ್ಯಮಾಪನ ರೂಬ್ರಿಕ್ ತಯಾರಿಸಿ.",
      context: "[8]ನೇ ತರಗತಿ. ಯೋಜನೆ 20 ಅಂಕಗಳಿಗೆ. ವಿದ್ಯಾರ್ಥಿಗಳು 4 ಜನರ ಗುಂಪುಗಳಲ್ಲಿ ಎರಡು ವಾರ ಕೆಲಸ ಮಾಡಿದರು.",
      cons: "4 ಮಾನದಂಡಗಳು ಮತ್ತು 4 ಹಂತಗಳು ಇರಲಿ: ಅತ್ಯುತ್ತಮ, ಉತ್ತಮ, ತೃಪ್ತಿಕರ, ಸುಧಾರಣೆ ಬೇಕು.\nಪ್ರತಿ ಹಂತವನ್ನು ಒಂದು ಸ್ಪಷ್ಟ ವಾಕ್ಯದಲ್ಲಿ ವಿವರಿಸಿ.\nಪ್ರತಿ ಹಂತದ ಅಂಕಗಳನ್ನು ತೋರಿಸಿ; ಒಟ್ಟು 20 ಆಗುವಂತೆ ನೋಡಿಕೊಳ್ಳಿ.\nತಂಡದ ಕೆಲಸಕ್ಕೆ ಒಂದು ಮಾನದಂಡ ಕಡ್ಡಾಯವಾಗಿ ಇರಲಿ.",
      ex: ""
    },
    parentletter: {
      title: "ಪೋಷಕರಿಗೆ ಸೂಚನೆ",
      desc: "ಶಾಲಾ ಕಾರ್ಯಕ್ರಮಕ್ಕೆ ಸ್ಪಷ್ಟ, ವಿನಯಪೂರ್ಣ ಸೂಚನೆ",
      role: "ಪೋಷಕರಿಗಾಗಿ ಸ್ಪಷ್ಟ ಮತ್ತು ವಿನಯಪೂರ್ಣ ಸೂಚನೆಗಳನ್ನು ಬರೆಯುವ ಶಾಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು",
      task: "[ಕಾರ್ಯಕ್ರಮ, ಉದಾ. ಪೋಷಕ-ಶಿಕ್ಷಕರ ಸಭೆ] ಕುರಿತು ಪೋಷಕರಿಗೆ ಒಂದು ಸೂಚನೆ ಬರೆಯಿರಿ.",
      context: "ದಿನಾಂಕ: [ದಿನಾಂಕ]. ಸಮಯ: [ಸಮಯ]. ಸ್ಥಳ: [ಶಾಲಾ ಸಭಾಂಗಣ]. ಅನೇಕ ಪೋಷಕರಿಗೆ ಇಂಗ್ಲಿಷ್‌ಗಿಂತ ತಮ್ಮ ಮನೆ ಭಾಷೆಯೇ ಸುಲಭ.",
      cons: "150 ಪದಗಳೊಳಗೆ ಇರಲಿ.\nದಿನಾಂಕ, ಸಮಯ, ಸ್ಥಳ ಮತ್ತು ಪೋಷಕರು ಏನು ತರಬೇಕು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ.\nಕೊನೆಯಲ್ಲಿ ಒಂದು ಚಿಕ್ಕ ಉತ್ತರ ಚೀಟಿ ಸೇರಿಸಿ.\nಯಾವುದೇ ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು ಅಥವಾ ಫೋನ್ ಸಂಖ್ಯೆ ಬರೆಯಬೇಡಿ.",
      ex: ""
    },
    story: {
      title: "ಮಕ್ಕಳಿಗಾಗಿ ಕಥೆ",
      desc: "ಪ್ರಶ್ನೆಗಳೊಂದಿಗೆ ಒಂದು ಚಿಕ್ಕ ನೀತಿಕಥೆ",
      role: "ಭಾರತದ ಒಬ್ಬ ಮಕ್ಕಳ ಕಥೆಗಾರರು",
      task: "[ಮೌಲ್ಯ, ಉದಾ. ಹಂಚಿಕೊಳ್ಳುವುದು ಅಥವಾ ನೀರು ಉಳಿಸುವುದು] ಕಲಿಸುವ ಮಕ್ಕಳಿಗಾಗಿ ಒಂದು ಚಿಕ್ಕ ಕಥೆ ಬರೆಯಿರಿ.",
      context: "ಈ ಕಥೆ [3]ನೇ ತರಗತಿಯ ಮಕ್ಕಳಿಗಾಗಿ. ಕಥೆ ಒಂದು ಭಾರತೀಯ ಹಳ್ಳಿ ಅಥವಾ ಪಟ್ಟಣದಲ್ಲಿ ನಡೆಯಲಿ; ಭಾರತೀಯ ಹೆಸರುಗಳು ಮತ್ತು ಮಕ್ಕಳಿಗೆ ಪರಿಚಿತ ಪ್ರಾಣಿಗಳು ಇರಲಿ.",
      cons: "ಚಿಕ್ಕ ವಾಕ್ಯಗಳು ಮತ್ತು ಸುಲಭ ಪದಗಳನ್ನು ಬಳಸಿ.\nಸ್ವಲ್ಪ ಸಂಭಾಷಣೆ ಸೇರಿಸಿ.\nಕೊನೆಯಲ್ಲಿ ನೀತಿಯನ್ನು ಒಂದು ಸಾಲಿನಲ್ಲಿ ಬರೆಯಿರಿ.\nಕಥೆಯ ಮೇಲೆ 3 ಸುಲಭ ಪ್ರಶ್ನೆಗಳನ್ನು ಸೇರಿಸಿ.",
      ex: ""
    },
    essayfb: {
      title: "ಪ್ರಬಂಧಕ್ಕೆ ಪ್ರತಿಕ್ರಿಯೆ",
      desc: "ವಿದ್ಯಾರ್ಥಿಗೆ ಉಪಯೋಗವಾಗುವ ಸೌಮ್ಯ, ನಿರ್ದಿಷ್ಟ ಪ್ರತಿಕ್ರಿಯೆ",
      role: "ದಯಾಳು ಮತ್ತು ಪ್ರಾಮಾಣಿಕ ಭಾಷಾ ಶಿಕ್ಷಕರು",
      task: "ಕೆಳಗಿನ ವಿದ್ಯಾರ್ಥಿಯ ಪ್ರಬಂಧಕ್ಕೆ ಪ್ರತಿಕ್ರಿಯೆ ಕೊಡಿ.",
      context: "[9]ನೇ ತರಗತಿಯ ಪ್ರಬಂಧ, ವಿಷಯ “[ವಿಷಯ]”. ಪದಮಿತಿ 250 ಪದಗಳು. ಪ್ರಬಂಧ (ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರಿಲ್ಲದೆ): [ಪ್ರಬಂಧವನ್ನು ಇಲ್ಲಿ ಅಂಟಿಸಿ]",
      cons: "ಮೊದಲು ವಿದ್ಯಾರ್ಥಿ ಚೆನ್ನಾಗಿ ಮಾಡಿದ 2 ವಿಷಯಗಳನ್ನು ಹೇಳಿ.\nನಂತರ ಸುಧಾರಿಸಲು 3 ನಿರ್ದಿಷ್ಟ ದಾರಿಗಳನ್ನು ಹೇಳಿ, ಪ್ರತಿಯೊಂದಕ್ಕೂ ಒಂದು ಉದಾಹರಣೆ ವಾಕ್ಯದೊಂದಿಗೆ.\nವಿಚಾರ, ರಚನೆ ಮತ್ತು ವ್ಯಾಕರಣದ ಬಗ್ಗೆ ಪ್ರತ್ಯೇಕವಾಗಿ ಟಿಪ್ಪಣಿ ಮಾಡಿ.\nಇಡೀ ಪ್ರಬಂಧವನ್ನು ಮತ್ತೆ ಬರೆಯಬೇಡಿ.\n10ಕ್ಕೆ ಅಂಕ ಕೊಟ್ಟು ಚಿಕ್ಕ ಕಾರಣ ಹೇಳಿ.",
      ex: ""
    },
    timetable: {
      title: "ಓದಿನ ವೇಳಾಪಟ್ಟಿ",
      desc: "ಪರೀಕ್ಷೆಗೆ ಮುನ್ನ ಕಾರ್ಯಸಾಧ್ಯ ವಾರದ ಯೋಜನೆ",
      role: "ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಕಾರ್ಯಸಾಧ್ಯ ಯೋಜನೆ ರೂಪಿಸಲು ನೆರವಾಗುವ ಸ್ಟಡಿ ಕೋಚ್",
      task: "ನನ್ನ ಪರೀಕ್ಷೆಗಳಿಗಾಗಿ ವಾರದ ಓದಿನ ವೇಳಾಪಟ್ಟಿ ತಯಾರಿಸಿ; ಪರೀಕ್ಷೆಗಳು [ದಿನಾಂಕ] ದಿಂದ ಆರಂಭ.",
      context: "ನಾನು [10]ನೇ ತರಗತಿಯಲ್ಲಿದ್ದೇನೆ. ಶಾಲೆ ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಮಧ್ಯಾಹ್ನ 2 ರವರೆಗೆ. ನನ್ನ ವಿಷಯಗಳು: ಗಣಿತ, ವಿಜ್ಞಾನ, ಸಮಾಜ ವಿಜ್ಞಾನ, ಇಂಗ್ಲಿಷ್ ಮತ್ತು [ಎರಡನೇ ಭಾಷೆ]. ನನ್ನ ಅತ್ಯಂತ ದುರ್ಬಲ ವಿಷಯ [ವಿಷಯ].",
      cons: "ಚಿಕ್ಕ ವಿರಾಮಗಳು, ಆಟದ ಸಮಯ ಮತ್ತು 8 ಗಂಟೆ ನಿದ್ರೆ ಸೇರಿಸಿ.\nದುರ್ಬಲ ವಿಷಯಕ್ಕೆ ಹೆಚ್ಚು ಸಮಯ ಕೊಡಿ.\nಪ್ರತಿ ವಾರ ಒಂದು ದಿನ ಪುನರಾವರ್ತನೆಗಾಗಿ ಇಡಿ.\nಭಾನುವಾರ ಸಂಜೆ ಬಿಡುವಾಗಿಡಿ.",
      ex: ""
    },
    debate: {
      title: "ಚರ್ಚಾ ಅಂಶಗಳು",
      desc: "ಪರ ಮತ್ತು ವಿರೋಧದ ಸಮತೋಲಿತ ಅಂಶಗಳು",
      role: "ಅನುಭವಿ ಚರ್ಚಾ ತರಬೇತುದಾರರು",
      task: "ಈ ವಿಷಯದ ಪರವಾಗಿ ಮತ್ತು ವಿರೋಧವಾಗಿ ಅಂಶಗಳನ್ನು ಕೊಡಿ: “[ವಿಷಯ, ಉದಾ. ಶಾಲೆಗಳಲ್ಲಿ ಮೊಬೈಲ್ ಫೋನ್‌ಗೆ ಅನುಮತಿ ಇರಬೇಕು]”.",
      context: "[11]ನೇ ತರಗತಿ ವಿದ್ಯಾರ್ಥಿಗಳ ಅಂತರ್‌ಶಾಲಾ ಚರ್ಚಾ ಸ್ಪರ್ಧೆಗಾಗಿ. ಪ್ರತಿ ಭಾಷಣಕಾರರಿಗೆ 3 ನಿಮಿಷ.",
      cons: "ಪರವಾಗಿ 5 ಮತ್ತು ವಿರೋಧವಾಗಿ 5 ಅಂಶಗಳನ್ನು ಕೊಡಿ.\nಪ್ರತಿ ಅಂಶಕ್ಕೆ ಒಂದು ಸತ್ಯಾಂಶ ಅಥವಾ ಉದಾಹರಣೆ ಕೊಡಿ; ನಾನು ಮತ್ತೆ ಪರಿಶೀಲಿಸಬೇಕಾದ ಸತ್ಯಾಂಶಗಳನ್ನು ಗುರುತಿಸಿ.\nಪ್ರತಿ ಪಕ್ಷಕ್ಕೆ 2 ಪ್ರತಿವಾದಗಳನ್ನು ಸೇರಿಸಿ.\nಸಮತೋಲಿತವಾಗಿ ಮತ್ತು ಗೌರವದಿಂದ ಇರಲಿ.",
      ex: ""
    },
    summary: {
      title: "ಟಿಪ್ಪಣಿಗಳ ಸಾರಾಂಶ",
      desc: "ಉದ್ದ ಟಿಪ್ಪಣಿಗಳನ್ನು ಪುನರಾವರ್ತನೆ ಅಂಶಗಳಾಗಿಸಿ",
      role: "ಸ್ಪಷ್ಟ ಪುನರಾವರ್ತನೆ ಟಿಪ್ಪಣಿಗಳನ್ನು ತಯಾರಿಸುವ ಓದಿನ ಸಹಾಯಕರು",
      task: "ಕೆಳಗಿನ ನನ್ನ ಟಿಪ್ಪಣಿಗಳನ್ನು ಪುನರಾವರ್ತನೆಗಾಗಿ ಮುಖ್ಯ ಅಂಶಗಳಾಗಿ ಸಂಕ್ಷೇಪಿಸಿ.",
      context: "[ವಿಷಯ] ಕುರಿತು ಇವು ನನ್ನ ತರಗತಿ ಟಿಪ್ಪಣಿಗಳು: [ನಿಮ್ಮ ಟಿಪ್ಪಣಿಗಳನ್ನು ಇಲ್ಲಿ ಅಂಟಿಸಿ]",
      cons: "ಹೆಚ್ಚೆಂದರೆ 10 ಅಂಶಗಳಿರಲಿ.\nಎಲ್ಲಾ ಮುಖ್ಯ ಪದಗಳು, ದಿನಾಂಕಗಳು ಮತ್ತು ಸೂತ್ರಗಳನ್ನು ಉಳಿಸಿಕೊಳ್ಳಿ.\nನನ್ನನ್ನು ನಾನೇ ಪರೀಕ್ಷಿಸಿಕೊಳ್ಳಲು 3 ಪ್ರಶ್ನೆಗಳನ್ನು ಸೇರಿಸಿ.\nನನ್ನ ಟಿಪ್ಪಣಿಗಳಲ್ಲಿ ಇಲ್ಲದ ಯಾವುದನ್ನೂ ಸೇರಿಸಬೇಡಿ.",
      ex: ""
    },
    interview: {
      title: "ಸಂದರ್ಶನ ಅಭ್ಯಾಸ",
      desc: "ಒಮ್ಮೆಗೆ ಒಂದು ಪ್ರಶ್ನೆಯ ಅಣಕು ಸಂದರ್ಶನ",
      role: "[ಉದ್ಯೋಗ ಅಥವಾ ಕಾಲೇಜು ಪ್ರವೇಶ] ಕ್ಕಾಗಿ ಸ್ನೇಹಪರ ಸಂದರ್ಶಕರು",
      task: "ಸಂದರ್ಶನದ ಅಭ್ಯಾಸಕ್ಕೆ ನನಗೆ ಸಹಾಯ ಮಾಡಿ. ಒಮ್ಮೆಗೆ ಒಂದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ, ನನ್ನ ಉತ್ತರಕ್ಕಾಗಿ ಕಾಯಿರಿ, ನಂತರ ಪ್ರತಿಕ್ರಿಯೆ ಕೊಡಿ.",
      context: "ನಾನು [B.Com ಅಂತಿಮ ವರ್ಷದ ವಿದ್ಯಾರ್ಥಿ], [ಉದ್ಯೋಗ ಅಥವಾ ಕೋರ್ಸ್] ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುತ್ತಿದ್ದೇನೆ. ನಾನು ಗಾಬರಿಯಾಗಿ ತುಂಬಾ ಚಿಕ್ಕ ಉತ್ತರಗಳನ್ನು ಕೊಡುತ್ತೇನೆ.",
      cons: "ಒಟ್ಟು 8 ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ, ಸುಲಭದಿಂದ ಕಠಿಣದವರೆಗೆ.\nಪ್ರತಿ ಉತ್ತರದ ನಂತರ ಒಂದು ಸಾಮರ್ಥ್ಯ ಮತ್ತು ಸುಧಾರಿಸಬೇಕಾದ ಒಂದು ವಿಷಯ ಹೇಳಿ.\nಕೊನೆಯಲ್ಲಿ ಚಿಕ್ಕ ಸಾರಾಂಶ ಮತ್ತು 3 ಸಲಹೆಗಳನ್ನು ಕೊಡಿ.\nನನ್ನ ನಿಜವಾದ ಹೆಸರು, ಫೋನ್ ಸಂಖ್ಯೆ ಅಥವಾ ವಿಳಾಸ ಕೇಳಬೇಡಿ.",
      ex: ""
    }
  }
};

window.APP_CONTENT.ml = {
  asm: {
    role: "നിങ്ങൾ {x} ആണ്.",
    task: "ജോലി: {x}",
    context: "പശ്ചാത്തലം: {x}",
    aud: "ഇത് ആർക്കുവേണ്ടി: {x}. അവർക്ക് എളുപ്പത്തിൽ മനസ്സിലാകുന്ന വാക്കുകളും ഉദാഹരണങ്ങളും ഉപയോഗിക്കുക.",
    audv: {
      c1_5: "1–5 ക്ലാസുകളിലെ കുട്ടികൾ (ഏകദേശം 6–10 വയസ്സ്)",
      c6_8: "6–8 ക്ലാസുകളിലെ വിദ്യാർത്ഥികൾ (ഏകദേശം 11–13 വയസ്സ്)",
      c9_10: "9–10 ക്ലാസുകളിലെ വിദ്യാർത്ഥികൾ (ഏകദേശം 14–15 വയസ്സ്)",
      c11_12: "11–12 ക്ലാസുകളിലെ വിദ്യാർത്ഥികൾ (ഏകദേശം 16–17 വയസ്സ്)",
      ug: "കോളേജ് വിദ്യാർത്ഥികൾ",
      teachers: "സ്കൂൾ അധ്യാപകർ",
      parents: "സ്കൂൾ കുട്ടികളുടെ രക്ഷിതാക്കൾ",
      general: "പൊതു വായനക്കാർ"
    },
    fmt: {
      list: "ഫോർമാറ്റ്: ഉത്തരം ചെറുതും വ്യക്തവുമായ പോയിന്റുകളുടെ നമ്പറിട്ട പട്ടികയായി നൽകുക.",
      table: "ഫോർമാറ്റ്: ഉത്തരം ഒരു ടേബിളായി നൽകുക; ഓരോ കോളത്തിനും വ്യക്തമായ തലക്കെട്ട് വേണം.",
      paragraph: "ഫോർമാറ്റ്: ചെറുതും ചിട്ടയുള്ളതുമായ ഖണ്ഡികകളിൽ എഴുതുക.",
      quiz: "ഫോർമാറ്റ്: ഇതൊരു ക്വിസ് ആക്കുക. ഓരോ ചോദ്യത്തിനും നാല് ഓപ്ഷനുകൾ (A–D) നൽകുക; അവസാനം ഒറ്റവരി വിശദീകരണത്തോടെ ഉത്തരസൂചിക നൽകുക.",
      steps: "ഫോർമാറ്റ്: ഘട്ടം ഘട്ടമായി വിശദീകരിക്കുക; ഓരോ ഘട്ടത്തിനും നമ്പറും ചെറിയ തലക്കെട്ടും വേണം.",
      letter: "ഫോർമാറ്റ്: ഇത് ഒരു ഔപചാരിക കത്തോ അറിയിപ്പോ ആയി എഴുതുക: തീയതി, വിഷയം, അഭിസംബോധന, പ്രധാന സന്ദേശം, അവസാനം പേര്/പദവി."
    },
    tone: "ശൈലി: {x}.",
    tonev: {
      friendly: "സൗഹൃദപരവും സ്നേഹമുള്ളതും",
      formal: "ഔപചാരികവും വിനയമുള്ളതും",
      encouraging: "പ്രോത്സാഹിപ്പിക്കുന്നതും പോസിറ്റീവും",
      simple: "ലളിതവും വ്യക്തവും",
      fun: "രസകരവും ഉന്മേഷമുള്ളതും",
      neutral: "നിഷ്പക്ഷവും സന്തുലിതവും"
    },
    len: {
      vshort: "നീളം: വളരെ ചെറുത്, ഏകദേശം 100 വാക്ക്.",
      short: "നീളം: ചെറുത്, ഏകദേശം 150–250 വാക്ക്.",
      medium: "നീളം: ഇടത്തരം, ഏകദേശം 300–500 വാക്ക്.",
      long: "നീളം: വിശദവും പൂർണവും, പക്ഷേ അനാവശ്യ വാക്കുകൾ ഇല്ലാതെ."
    },
    lang: "ഭാഷ: ഉത്തരം മുഴുവൻ ലളിതമായ മലയാളത്തിൽ എഴുതുക.",
    rules: "ഈ നിയമങ്ങൾ പാലിക്കുക:",
    example: "എനിക്ക് വേണ്ട ശൈലിക്ക് ഒരു ഉദാഹരണം:",
    ask: "പ്രധാനപ്പെട്ട എന്തെങ്കിലും വിവരം വിട്ടുപോയിട്ടുണ്ടെങ്കിൽ, ആദ്യം എന്നോട് പരമാവധി 3 ചെറിയ ചോദ്യങ്ങൾ ചോദിക്കുക, പിന്നെ ഉത്തരം നൽകുക.",
    unsure: "ഏതെങ്കിലും വസ്തുതയെക്കുറിച്ച് ഉറപ്പില്ലെങ്കിൽ, ഊഹിക്കാതെ അക്കാര്യം വ്യക്തമായി പറയുക."
  },
  chips: [
    { label: "ഇന്ത്യൻ ഉദാഹരണങ്ങൾ", text: "ദൈനംദിന ഇന്ത്യൻ ജീവിതത്തിൽ നിന്ന് ഉദാഹരണങ്ങൾ നൽകുക (ഇന്ത്യൻ പേരുകൾ, സ്ഥലങ്ങൾ, ഭക്ഷണം, ഉത്സവങ്ങൾ, ₹)." },
    { label: "NCERT സിലബസ്", text: "ഈ ക്ലാസിന്റെ NCERT/CBSE സിലബസിനുള്ളിൽ തന്നെ നിൽക്കുക." },
    { label: "ലളിതമായ വാക്കുകൾ", text: "ലളിതമായ വാക്കുകൾ ഉപയോഗിക്കുക; പ്രയാസമുള്ള വാക്കിന്റെ അർത്ഥം ബ്രാക്കറ്റിൽ നൽകുക." },
    { label: "ഉത്തരസൂചിക", text: "അവസാനം ഉത്തരസൂചിക നൽകുക." },
    { label: "സ്രോതസ്സുകൾ", text: "എനിക്ക് പരിശോധിക്കാവുന്ന സ്രോതസ്സുകൾ പറയുക, ഉദാ. NCERT പാഠപുസ്തകത്തിലെ അധ്യായങ്ങൾ." },
    { label: "മുൻവിധി വേണ്ട", text: "എല്ലാവരെയും ഉൾക്കൊണ്ട് ബഹുമാനത്തോടെ എഴുതുക: ലിംഗം, ജാതി, മതം, പ്രദേശം എന്നിവയെക്കുറിച്ച് യാതൊരു മുൻവിധിയും വേണ്ട." },
    { label: "ചെലവു കുറഞ്ഞ പ്രവർത്തനം", text: "വില കുറഞ്ഞ സാധനങ്ങൾ മാത്രം വേണ്ട ഒരു ക്ലാസ് പ്രവർത്തനം ഉൾപ്പെടുത്തുക." },
    { label: "എളുപ്പം + പ്രയാസം", text: "വ്യത്യസ്ത വിദ്യാർത്ഥികൾക്കായി ഒരു എളുപ്പ രൂപവും കൂടുതൽ വെല്ലുവിളിയുള്ള ഒരു രൂപവും നൽകുക." }
  ],
  templates: {
    lesson5e: {
      title: "പാഠാസൂത്രണം (5E)",
      desc: "40 മിനിറ്റ് പ്രവർത്തനാധിഷ്ഠിത പാഠം",
      role: "പ്രവർത്തനാധിഷ്ഠിത പാഠങ്ങൾ ആസൂത്രണം ചെയ്യുന്ന പരിചയസമ്പന്നനായ ഒരു CBSE സയൻസ് അധ്യാപകൻ",
      task: "[വിഷയം] എന്നതിനെക്കുറിച്ച് 5E മാതൃകയിൽ 40 മിനിറ്റ് പാഠാസൂത്രണം തയ്യാറാക്കുക: Engage (താൽപ്പര്യം ഉണർത്തൽ), Explore (അന്വേഷണം), Explain (വിശദീകരണം), Elaborate (വിപുലീകരണം), Evaluate (മൂല്യനിർണയം).",
      context: "[7]-ാം ക്ലാസ് സയൻസ്, NCERT അധ്യായം “[അധ്യായത്തിന്റെ പേര്]”. ഏകദേശം 40 വിദ്യാർത്ഥികൾ, ഒരു സ്മാർട്ട്ബോർഡ്, സാധാരണ സാമഗ്രികൾ മാത്രം. ചില വിദ്യാർത്ഥികൾക്ക് ഇംഗ്ലീഷ് പ്രയാസമാണ്.",
      cons: "ഓരോ ഘട്ടത്തിന്റെയും സമയം എഴുതുക; ആകെ 40 മിനിറ്റ് തന്നെ ആകണം.\nഇന്ത്യൻ സ്കൂളിൽ എളുപ്പം ലഭിക്കുന്ന വില കുറഞ്ഞ സാമഗ്രികൾ ഉപയോഗിക്കുക.\nഅവസാനം മനസ്സിലായോ എന്ന് പരിശോധിക്കാൻ 3 ചെറിയ ചോദ്യങ്ങൾ നൽകുക.\nഒരു ചെറിയ ഹോംവർക്ക് നിർദേശിക്കുക.",
      ex: "Engage (5 മിനിറ്റ്): ഐസിട്ട തണുത്ത വെള്ളമുള്ള ഒരു ഗ്ലാസ് കാണിച്ച്, “ഗ്ലാസിന്റെ പുറത്തെ ഈ തുള്ളികൾ എവിടെ നിന്നാണ് വന്നത്?” എന്ന് ചോദിക്കുക."
    },
    mcq10: {
      title: "അധ്യായത്തിൽ 10 MCQ",
      desc: "ഉത്തരസൂചികയോടെ റിവിഷൻ ക്വിസ്",
      role: "ശ്രദ്ധയോടെ ചോദ്യപേപ്പർ തയ്യാറാക്കുന്ന ഒരു CBSE ചോദ്യകർത്താവ്",
      task: "“[അധ്യായത്തിന്റെ പേര്]” എന്ന അധ്യായത്തിൽ 10 മൾട്ടിപ്പിൾ ചോയ്സ് ചോദ്യങ്ങൾ (MCQ) എഴുതുക.",
      context: "[9]-ാം ക്ലാസ് [വിഷയം], NCERT പാഠപുസ്തകം. അധ്യായം കഴിഞ്ഞശേഷമുള്ള ഒരു റിവിഷൻ ടെസ്റ്റാണിത്.",
      cons: "പ്രയാസം കലർത്തുക: 4 എളുപ്പം, 4 ഇടത്തരം, 2 പ്രയാസമുള്ള ചോദ്യങ്ങൾ.\nഓരോ ചോദ്യത്തിനും കൃത്യം ഒരു ശരിയുത്തരം മാത്രം.\n“മുകളിൽ പറഞ്ഞവയെല്ലാം” അല്ലെങ്കിൽ “ഇവയൊന്നുമല്ല” പോലുള്ള ഓപ്ഷനുകൾ ഒഴിവാക്കുക.\nഓരോ ഉത്തരത്തിനും ഒറ്റവരി കാരണത്തോടെ ഉത്തരസൂചിക നൽകുക.",
      ex: "ചോ1. ആഹാരം നിർമിക്കാൻ സസ്യങ്ങൾ ഏത് വാതകമാണ് സ്വീകരിക്കുന്നത്?\n(A) ഓക്സിജൻ  (B) കാർബൺ ഡൈ ഓക്സൈഡ്  (C) നൈട്രജൻ  (D) ഹൈഡ്രജൻ\nഉത്തരം: (B). സൂര്യപ്രകാശത്തിൽ കാർബൺ ഡൈ ഓക്സൈഡും വെള്ളവും ഉപയോഗിച്ചാണ് സസ്യങ്ങൾ ആഹാരം നിർമിക്കുന്നത്."
    },
    explain: {
      title: "ആശയം ലളിതമായി വിശദീകരിക്കാം",
      desc: "ദൈനംദിന ഇന്ത്യൻ ഉദാഹരണത്തോടെ",
      role: "പ്രയാസമുള്ള കാര്യങ്ങൾ ലളിതമായ വാക്കുകളിൽ വിശദീകരിക്കുന്ന ക്ഷമയുള്ള ഒരു അധ്യാപകൻ",
      task: "[ആശയം, ഉദാ. ഘർഷണം] ലളിതമായ വാക്കുകളിൽ വിശദീകരിക്കുക.",
      context: "വിദ്യാർത്ഥികൾ ഇത് ആദ്യമായാണ് പഠിക്കുന്നത്. ഇന്ത്യയിലെ ദൈനംദിന ജീവിതത്തിൽ നിന്ന് ഒരു ഉദാഹരണം നൽകുക, ഉദാ. അടുക്കള, ക്രിക്കറ്റ് മത്സരം, ട്രെയിൻ യാത്ര അല്ലെങ്കിൽ ഒരു ഉത്സവം.",
      cons: "ഒറ്റവരി നിർവചനത്തോടെ തുടങ്ങുക.\nദൈനംദിന ഇന്ത്യൻ ജീവിതത്തിൽ നിന്ന് ഒരു ഉദാഹരണം നൽകുക.\nഅവസാനം വിദ്യാർത്ഥികളെ ചിന്തിപ്പിക്കുന്ന ഒരു ചോദ്യം നൽകുക.\nസാങ്കേതിക പദം ഉപയോഗിച്ചാൽ അതിന്റെ അർത്ഥം വിശദീകരിക്കുക.",
      ex: "രണ്ട് പ്രതലങ്ങൾ പരസ്പരം ഉരസുമ്പോൾ വസ്തുക്കളുടെ വേഗം കുറയ്ക്കുന്ന ബലമാണ് ഘർഷണം. അതുകൊണ്ടാണ് പുല്ലിലൂടെ ഉരുളുന്ന ക്രിക്കറ്റ് പന്ത് പതുക്കെ നിൽക്കുന്നത്."
    },
    rubric: {
      title: "മൂല്യനിർണയ റൂബ്രിക്",
      desc: "പ്രോജക്റ്റിന് നീതിയുക്തമായ മാനദണ്ഡങ്ങളും നിലകളും",
      role: "നീതിയുക്തമായ മൂല്യനിർണയ റൂബ്രിക്കുകൾ തയ്യാറാക്കുന്ന പരിചയസമ്പന്നനായ ഒരു അധ്യാപകൻ",
      task: "[അസൈൻമെന്റ്, ഉദാ. സയൻസ് മോഡൽ] എന്നതിന് ഒരു മൂല്യനിർണയ റൂബ്രിക് തയ്യാറാക്കുക.",
      context: "[8]-ാം ക്ലാസ്. പ്രോജക്റ്റ് 20 മാർക്കിനാണ്. വിദ്യാർത്ഥികൾ 4 പേരുള്ള ഗ്രൂപ്പുകളായി രണ്ടാഴ്ച പ്രവർത്തിച്ചു.",
      cons: "4 മാനദണ്ഡങ്ങളും 4 നിലകളും വേണം: മികച്ചത്, നല്ലത്, തൃപ്തികരം, മെച്ചപ്പെടണം.\nഓരോ നിലയും ഒരു വ്യക്തമായ വാക്യത്തിൽ വിവരിക്കുക.\nഓരോ നിലയുടെയും മാർക്ക് കാണിക്കുക; ആകെ 20 ആണെന്ന് ഉറപ്പാക്കുക.\nടീം വർക്കിന് ഒരു മാനദണ്ഡം നിർബന്ധമായും വേണം.",
      ex: ""
    },
    parentletter: {
      title: "രക്ഷിതാക്കൾക്കുള്ള അറിയിപ്പ്",
      desc: "സ്കൂൾ പരിപാടിക്ക് വ്യക്തവും വിനയവുമുള്ള അറിയിപ്പ്",
      role: "രക്ഷിതാക്കൾക്കായി വ്യക്തവും വിനയപൂർവവുമായ അറിയിപ്പുകൾ എഴുതുന്ന ഒരു സ്കൂൾ പ്രിൻസിപ്പൽ",
      task: "[പരിപാടി, ഉദാ. രക്ഷാകർതൃ-അധ്യാപക യോഗം] എന്നതിനെക്കുറിച്ച് രക്ഷിതാക്കൾക്ക് ഒരു അറിയിപ്പ് എഴുതുക.",
      context: "തീയതി: [തീയതി]. സമയം: [സമയം]. സ്ഥലം: [സ്കൂൾ ഹാൾ]. പല രക്ഷിതാക്കൾക്കും ഇംഗ്ലീഷിനേക്കാൾ സ്വന്തം വീട്ടുഭാഷയാണ് എളുപ്പം.",
      cons: "150 വാക്കിൽ താഴെ നിർത്തുക.\nതീയതി, സമയം, സ്ഥലം, രക്ഷിതാക്കൾ കൊണ്ടുവരേണ്ടവ എന്നിവ എഴുതുക.\nഅവസാനം ഒരു ചെറിയ മറുപടി സ്ലിപ്പ് ചേർക്കുക.\nഒരു വിദ്യാർത്ഥിയുടെയും പേരോ ഫോൺ നമ്പറോ എഴുതരുത്.",
      ex: ""
    },
    story: {
      title: "കുട്ടികൾക്കുള്ള കഥ",
      desc: "ചോദ്യങ്ങളോടെ ഒരു ചെറിയ ഗുണപാഠ കഥ",
      role: "ഇന്ത്യയിൽ നിന്നുള്ള ഒരു ബാലകഥാകാരൻ",
      task: "[മൂല്യം, ഉദാ. പങ്കുവയ്ക്കൽ അല്ലെങ്കിൽ വെള്ളം സംരക്ഷിക്കൽ] പഠിപ്പിക്കുന്ന ഒരു ചെറിയ കുട്ടിക്കഥ എഴുതുക.",
      context: "ഈ കഥ [3]-ാം ക്ലാസിലെ കുട്ടികൾക്കുള്ളതാണ്. കഥ ഒരു ഇന്ത്യൻ ഗ്രാമത്തിലോ പട്ടണത്തിലോ നടക്കട്ടെ; ഇന്ത്യൻ പേരുകളും കുട്ടികൾക്ക് പരിചയമുള്ള മൃഗങ്ങളും വേണം.",
      cons: "ചെറിയ വാക്യങ്ങളും ലളിതമായ വാക്കുകളും ഉപയോഗിക്കുക.\nകുറച്ച് സംഭാഷണം ഉൾപ്പെടുത്തുക.\nഅവസാനം ഗുണപാഠം ഒറ്റവരിയിൽ എഴുതുക.\nകഥയെക്കുറിച്ച് 3 ലളിതമായ ചോദ്യങ്ങൾ ചേർക്കുക.",
      ex: ""
    },
    essayfb: {
      title: "ഉപന്യാസത്തിന് ഫീഡ്ബാക്ക്",
      desc: "വിദ്യാർത്ഥിക്ക് ഉപകരിക്കുന്ന സൗമ്യവും കൃത്യവുമായ ഫീഡ്ബാക്ക്",
      role: "ദയയും സത്യസന്ധതയുമുള്ള ഒരു ഭാഷാധ്യാപകൻ",
      task: "താഴെ കൊടുത്ത വിദ്യാർത്ഥിയുടെ ഉപന്യാസത്തിന് ഫീഡ്ബാക്ക് നൽകുക.",
      context: "[9]-ാം ക്ലാസിലെ ഉപന്യാസം, വിഷയം “[വിഷയം]”. വാക്ക് പരിധി 250 ആയിരുന്നു. ഉപന്യാസം (വിദ്യാർത്ഥിയുടെ പേരില്ലാതെ): [ഉപന്യാസം ഇവിടെ ഒട്ടിക്കുക]",
      cons: "ആദ്യം വിദ്യാർത്ഥി നന്നായി ചെയ്ത 2 കാര്യങ്ങൾ പറയുക.\nപിന്നെ മെച്ചപ്പെടുത്താനുള്ള 3 കൃത്യമായ വഴികൾ പറയുക, ഓരോന്നിനും ഒരു ഉദാഹരണ വാക്യത്തോടെ.\nആശയങ്ങൾ, ഘടന, വ്യാകരണം എന്നിവയെക്കുറിച്ച് വെവ്വേറെ അഭിപ്രായം പറയുക.\nഉപന്യാസം മുഴുവൻ മാറ്റിയെഴുതരുത്.\n10-ൽ മാർക്ക് നൽകി ചെറിയ കാരണം പറയുക.",
      ex: ""
    },
    timetable: {
      title: "പഠന ടൈംടേബിൾ",
      desc: "പരീക്ഷയ്ക്ക് മുമ്പുള്ള പ്രായോഗിക പ്രതിവാര പദ്ധതി",
      role: "വിദ്യാർത്ഥികളെ പ്രായോഗിക പദ്ധതികൾ തയ്യാറാക്കാൻ സഹായിക്കുന്ന ഒരു സ്റ്റഡി കോച്ച്",
      task: "എന്റെ പരീക്ഷകൾക്കായി ഒരു പ്രതിവാര പഠന ടൈംടേബിൾ തയ്യാറാക്കുക; പരീക്ഷകൾ [തീയതി] മുതൽ തുടങ്ങും.",
      context: "ഞാൻ [10]-ാം ക്ലാസിലാണ്. സ്കൂൾ രാവിലെ 8 മുതൽ ഉച്ചയ്ക്ക് 2 വരെ. എന്റെ വിഷയങ്ങൾ: കണക്ക്, സയൻസ്, സാമൂഹ്യശാസ്ത്രം, ഇംഗ്ലീഷ്, [രണ്ടാം ഭാഷ]. എനിക്ക് ഏറ്റവും ദുർബലമായ വിഷയം [വിഷയം].",
      cons: "ചെറിയ ഇടവേളകൾ, കളിസമയം, 8 മണിക്കൂർ ഉറക്കം എന്നിവ ഉൾപ്പെടുത്തുക.\nദുർബലമായ വിഷയത്തിന് കൂടുതൽ സമയം നൽകുക.\nഎല്ലാ ആഴ്ചയും ഒരു ദിവസം റിവിഷനായി മാറ്റിവയ്ക്കുക.\nഞായറാഴ്ച വൈകുന്നേരം ഒഴിവാക്കിയിടുക.",
      ex: ""
    },
    debate: {
      title: "സംവാദ പോയിന്റുകൾ",
      desc: "അനുകൂലവും പ്രതികൂലവുമായ സന്തുലിത പോയിന്റുകൾ",
      role: "പരിചയസമ്പന്നനായ ഒരു സംവാദ പരിശീലകൻ",
      task: "ഈ വിഷയത്തിന് അനുകൂലമായും പ്രതികൂലമായും പോയിന്റുകൾ നൽകുക: “[വിഷയം, ഉദാ. സ്കൂളുകളിൽ മൊബൈൽ ഫോൺ അനുവദിക്കണം]”.",
      context: "[11]-ാം ക്ലാസ് വിദ്യാർത്ഥികളുടെ അന്തർ-സ്കൂൾ സംവാദ മത്സരത്തിന്. ഓരോ പ്രസംഗകനും 3 മിനിറ്റ്.",
      cons: "അനുകൂലമായി 5 ഉം പ്രതികൂലമായി 5 ഉം പോയിന്റുകൾ നൽകുക.\nഓരോ പോയിന്റിനും ഒരു വസ്തുതയോ ഉദാഹരണമോ നൽകുക; ഞാൻ വീണ്ടും പരിശോധിക്കേണ്ട വസ്തുതകൾ അടയാളപ്പെടുത്തുക.\nഓരോ പക്ഷത്തിനും 2 മറുവാദങ്ങൾ ചേർക്കുക.\nസന്തുലിതവും ബഹുമാനപൂർവവുമായി നിലനിർത്തുക.",
      ex: ""
    },
    summary: {
      title: "നോട്ടുകളുടെ സംഗ്രഹം",
      desc: "നീണ്ട നോട്ടുകൾ റിവിഷൻ പോയിന്റുകളാക്കാം",
      role: "വ്യക്തമായ റിവിഷൻ നോട്ടുകൾ തയ്യാറാക്കുന്ന ഒരു പഠനസഹായി",
      task: "താഴെയുള്ള എന്റെ നോട്ടുകൾ റിവിഷനുള്ള പ്രധാന പോയിന്റുകളായി സംഗ്രഹിക്കുക.",
      context: "[വിഷയം] സംബന്ധിച്ച എന്റെ ക്ലാസ് നോട്ടുകൾ ഇവയാണ്: [നിങ്ങളുടെ നോട്ടുകൾ ഇവിടെ ഒട്ടിക്കുക]",
      cons: "പരമാവധി 10 പോയിന്റുകൾ.\nപ്രധാന പദങ്ങൾ, തീയതികൾ, സൂത്രവാക്യങ്ങൾ എല്ലാം നിലനിർത്തുക.\nസ്വയം പരിശോധിക്കാൻ 3 ചോദ്യങ്ങൾ ചേർക്കുക.\nഎന്റെ നോട്ടുകളിൽ ഇല്ലാത്തതൊന്നും ചേർക്കരുത്.",
      ex: ""
    },
    interview: {
      title: "ഇന്റർവ്യൂ പരിശീലനം",
      desc: "ഒരു സമയം ഒരു ചോദ്യമുള്ള മോക്ക് ഇന്റർവ്യൂ",
      role: "[ജോലി അല്ലെങ്കിൽ കോളേജ് പ്രവേശനം] എന്നതിനുള്ള സൗഹൃദമുള്ള ഒരു ഇന്റർവ്യൂവർ",
      task: "ഇന്റർവ്യൂ പരിശീലനത്തിൽ എന്നെ സഹായിക്കുക. ഒരു സമയം ഒരു ചോദ്യം മാത്രം ചോദിച്ച്, എന്റെ ഉത്തരത്തിനായി കാത്തിരുന്ന്, പിന്നെ ഫീഡ്ബാക്ക് നൽകുക.",
      context: "ഞാൻ [B.Com അവസാന വർഷ വിദ്യാർത്ഥി] ആണ്, [ജോലി അല്ലെങ്കിൽ കോഴ്സ്] എന്നതിന് അപേക്ഷിക്കുന്നു. ഞാൻ പരിഭ്രമിച്ച് വളരെ ചെറിയ ഉത്തരങ്ങൾ നൽകും.",
      cons: "ആകെ 8 ചോദ്യങ്ങൾ ചോദിക്കുക, എളുപ്പത്തിൽ നിന്ന് പ്രയാസത്തിലേക്ക്.\nഓരോ ഉത്തരത്തിനു ശേഷവും ഒരു മേന്മയും മെച്ചപ്പെടുത്തേണ്ട ഒരു കാര്യവും പറയുക.\nഅവസാനം ഒരു ചെറിയ സംഗ്രഹവും 3 നിർദേശങ്ങളും നൽകുക.\nഎന്റെ യഥാർത്ഥ പേരോ ഫോൺ നമ്പറോ വിലാസമോ ചോദിക്കരുത്.",
      ex: ""
    }
  }
};

window.APP_CONTENT.ur = {
  asm: {
    role: "آپ {x} ہیں۔",
    task: "کام: {x}",
    context: "پس منظر: {x}",
    aud: "یہ کس کے لیے ہے: {x}۔ ایسے الفاظ اور مثالیں استعمال کریں جو وہ آسانی سے سمجھ سکیں۔",
    audv: {
      c1_5: "جماعت 1–5 کے بچے (تقریباً 6–10 سال)",
      c6_8: "جماعت 6–8 کے طلبہ (تقریباً 11–13 سال)",
      c9_10: "جماعت 9–10 کے طلبہ (تقریباً 14–15 سال)",
      c11_12: "جماعت 11–12 کے طلبہ (تقریباً 16–17 سال)",
      ug: "کالج کے طلبہ",
      teachers: "اسکول کے اساتذہ",
      parents: "اسکولی بچوں کے والدین",
      general: "عام قارئین"
    },
    fmt: {
      list: "فارمیٹ: جواب مختصر اور صاف نکات کی نمبر وار فہرست میں دیں۔",
      table: "فارمیٹ: جواب ایک جدول میں دیں، جس کے ہر کالم کا عنوان صاف ہو۔",
      paragraph: "فارمیٹ: مختصر، منظم پیراگراف میں لکھیں۔",
      quiz: "فارمیٹ: اسے کوئز بنائیں۔ ہر سوال کے چار اختیارات (A–D) دیں، اور آخر میں ایک ایک لائن کی وضاحت کے ساتھ جوابات کی کنجی دیں۔",
      steps: "فارمیٹ: مرحلہ وار سمجھائیں، ہر مرحلے کا نمبر اور مختصر عنوان ہو۔",
      letter: "فارمیٹ: اسے رسمی خط یا نوٹس کی طرح لکھیں: تاریخ، موضوع، القاب، اصل پیغام اور آخر میں نام/عہدہ۔"
    },
    tone: "لہجہ: {x}۔",
    tonev: {
      friendly: "دوستانہ اور اپنائیت بھرا",
      formal: "رسمی اور شائستہ",
      encouraging: "حوصلہ افزا اور مثبت",
      simple: "آسان اور صاف",
      fun: "مزے دار اور جاندار",
      neutral: "غیر جانبدار اور متوازن"
    },
    len: {
      vshort: "لمبائی: بہت مختصر، تقریباً 100 الفاظ۔",
      short: "لمبائی: مختصر، تقریباً 150–250 الفاظ۔",
      medium: "لمبائی: درمیانہ، تقریباً 300–500 الفاظ۔",
      long: "لمبائی: تفصیلی اور مکمل، مگر غیر ضروری باتوں کے بغیر۔"
    },
    lang: "زبان: پورا جواب آسان اردو میں لکھیں۔",
    rules: "ان اصولوں پر عمل کریں:",
    example: "مجھے جیسا انداز چاہیے، اس کی ایک مثال:",
    ask: "اگر کوئی ضروری معلومات رہ گئی ہو تو پہلے مجھ سے زیادہ سے زیادہ 3 مختصر سوال پوچھیں، پھر جواب دیں۔",
    unsure: "اگر کسی حقیقت کے بارے میں یقین نہ ہو تو اندازہ لگانے کے بجائے صاف بتا دیں۔"
  },
  chips: [
    { label: "ہندوستانی مثالیں", text: "روزمرہ ہندوستانی زندگی سے مثالیں دیں (ہندوستانی نام، جگہیں، کھانے، تہوار، ₹)۔" },
    { label: "NCERT نصاب", text: "اس جماعت کے NCERT/CBSE نصاب کے اندر ہی رہیں۔" },
    { label: "آسان الفاظ", text: "آسان الفاظ استعمال کریں، اور ہر مشکل لفظ کا مطلب بریکٹ میں بتائیں۔" },
    { label: "جوابات کی کنجی", text: "آخر میں جوابات کی کنجی دیں۔" },
    { label: "ذرائع", text: "ایسے ذرائع بتائیں جنہیں میں جانچ سکوں، جیسے NCERT کی کتاب کے ابواب۔" },
    { label: "کوئی تعصب نہیں", text: "سب کو ساتھ لے کر اور احترام سے لکھیں: جنس، ذات، مذہب یا علاقے کے بارے میں کوئی دقیانوسی بات نہیں۔" },
    { label: "کم خرچ سرگرمی", text: "کلاس کی ایک ایسی سرگرمی شامل کریں جس میں صرف سستی چیزیں لگیں۔" },
    { label: "آسان + مشکل", text: "مختلف طلبہ کے لیے ایک آسان صورت اور ایک زیادہ چیلنج والی صورت دیں۔" }
  ],
  templates: {
    lesson5e: {
      title: "سبق کا منصوبہ (5E)",
      desc: "40 منٹ کا سرگرمی پر مبنی سبق",
      role: "سرگرمی پر مبنی اسباق تیار کرنے والے ایک تجربہ کار CBSE سائنس استاد",
      task: "[موضوع] پر 5E ماڈل سے 40 منٹ کا سبق کا منصوبہ بنائیں: Engage (جوڑنا)، Explore (کھوجنا)، Explain (سمجھانا)، Elaborate (وسعت دینا)، Evaluate (جانچنا)۔",
      context: "جماعت [7] سائنس، NCERT باب “[باب کا نام]”۔ کلاس میں تقریباً 40 طلبہ، ایک اسمارٹ بورڈ اور بس عام سامان ہے۔ کچھ طلبہ کو انگریزی مشکل لگتی ہے۔",
      cons: "ہر مرحلے کا وقت لکھیں؛ کل وقت 40 منٹ ہی ہو۔\nایسا سستا سامان استعمال کریں جو ہندوستانی اسکول میں آسانی سے مل جائے۔\nآخر میں سمجھ جانچنے کے لیے 3 مختصر سوال دیں۔\nایک چھوٹا ہوم ورک تجویز کریں۔",
      ex: "Engage (5 منٹ): برف والے ٹھنڈے پانی کا گلاس دکھا کر پوچھیں، “گلاس کے باہر یہ قطرے کہاں سے آئے؟”"
    },
    mcq10: {
      title: "باب پر 10 MCQ",
      desc: "جوابات کی کنجی کے ساتھ دہرائی کوئز",
      role: "احتیاط سے سوالیہ پرچہ بنانے والے ایک CBSE پیپر سیٹر",
      task: "باب “[باب کا نام]” پر 10 کثیر انتخابی سوالات (MCQ) لکھیں۔",
      context: "جماعت [9] [مضمون]، NCERT کی کتاب۔ یہ کوئز باب مکمل ہونے کے بعد دہرائی کا ٹیسٹ ہے۔",
      cons: "مشکل کا ملا جلا معیار رکھیں: 4 آسان، 4 درمیانے اور 2 مشکل سوال۔\nہر سوال کا صرف ایک ہی صحیح جواب ہو۔\n“اوپر دیے گئے سبھی” یا “ان میں سے کوئی نہیں” جیسے اختیارات نہ رکھیں۔\nہر جواب کی ایک لائن کی وجہ کے ساتھ جوابات کی کنجی دیں۔",
      ex: "سوال 1۔ پودے غذا بنانے کے لیے کون سی گیس لیتے ہیں؟\n(A) آکسیجن  (B) کاربن ڈائی آکسائیڈ  (C) نائٹروجن  (D) ہائیڈروجن\nجواب: (B)۔ پودے دھوپ میں کاربن ڈائی آکسائیڈ اور پانی سے غذا بناتے ہیں۔"
    },
    explain: {
      title: "کوئی تصور آسانی سے سمجھائیں",
      desc: "روزمرہ ہندوستانی مثال کے ساتھ",
      role: "مشکل باتوں کو آسان الفاظ میں سمجھانے والے ایک صابر استاد",
      task: "[تصور، جیسے رگڑ] کو آسان الفاظ میں سمجھائیں۔",
      context: "طلبہ یہ پہلی بار پڑھ رہے ہیں۔ ہندوستان کی روزمرہ زندگی سے ایک مثال دیں، جیسے باورچی خانہ، کرکٹ میچ، ریل کا سفر یا کوئی تہوار۔",
      cons: "ایک لائن کی تعریف سے شروع کریں۔\nروزمرہ ہندوستانی زندگی سے ایک مثال دیں۔\nآخر میں ایک ایسا سوال دیں جو طلبہ کو سوچنے پر مجبور کرے۔\nکوئی تکنیکی لفظ آئے تو اس کا مطلب سمجھائیں۔",
      ex: "رگڑ وہ قوت ہے جو دو سطحوں کے آپس میں رگڑ کھانے پر چیزوں کو دھیما کر دیتی ہے۔ اسی لیے گھاس پر لڑھکتی کرکٹ کی گیند آہستہ آہستہ رک جاتی ہے۔"
    },
    rubric: {
      title: "جانچ کا روبرک",
      desc: "پروجیکٹ کے لیے منصفانہ معیار اور درجے",
      role: "منصفانہ جانچ کے روبرک بنانے والے ایک تجربہ کار استاد",
      task: "[اسائنمنٹ، جیسے سائنس ماڈل] کے لیے جانچ کا ایک روبرک بنائیں۔",
      context: "جماعت [8]۔ پروجیکٹ 20 نمبروں کا ہے۔ طلبہ نے 4، 4 کے گروپوں میں دو ہفتے کام کیا۔",
      cons: "4 معیار اور 4 درجے رکھیں: بہترین، اچھا، تسلی بخش، بہتری کی ضرورت۔\nہر درجے کو ایک صاف جملے میں بیان کریں۔\nہر درجے کے نمبر دکھائیں، اور یقینی بنائیں کہ کل 20 ہی ہو۔\nٹیم ورک کے لیے ایک معیار ضرور رکھیں۔",
      ex: ""
    },
    parentletter: {
      title: "والدین کے لیے نوٹس",
      desc: "اسکول کے پروگرام کا صاف، شائستہ نوٹس",
      role: "والدین کے لیے صاف اور شائستہ نوٹس لکھنے والے ایک اسکول پرنسپل",
      task: "[پروگرام، جیسے والدین-اساتذہ میٹنگ] کے بارے میں والدین کے لیے ایک نوٹس لکھیں۔",
      context: "تاریخ: [تاریخ]۔ وقت: [وقت]۔ جگہ: [اسکول ہال]۔ بہت سے والدین انگریزی کے بجائے اپنی گھریلو زبان میں زیادہ سہولت محسوس کرتے ہیں۔",
      cons: "150 الفاظ سے کم رکھیں۔\nتاریخ، وقت، جگہ اور والدین کیا ساتھ لائیں، یہ ضرور لکھیں۔\nآخر میں ایک چھوٹی جوابی پرچی شامل کریں۔\nکسی طالب علم کا نام یا فون نمبر نہ لکھیں۔",
      ex: ""
    },
    story: {
      title: "بچوں کے لیے کہانی",
      desc: "سوالات کے ساتھ ایک چھوٹی سبق آموز کہانی",
      role: "ہندوستان کے ایک بچوں کے کہانی کار",
      task: "بچوں کے لیے ایک چھوٹی کہانی لکھیں جو [سبق، جیسے مل بانٹ کر رہنا یا پانی بچانا] سکھائے۔",
      context: "کہانی جماعت [3] کے بچوں کے لیے ہے۔ کہانی کسی ہندوستانی گاؤں یا قصبے میں ہو، ہندوستانی ناموں اور ایسے جانوروں کے ساتھ جنہیں بچے جانتے ہیں۔",
      cons: "چھوٹے جملے اور آسان الفاظ استعمال کریں۔\nکچھ مکالمے بھی رکھیں۔\nآخر میں ایک لائن میں سبق لکھیں۔\nکہانی پر 3 آسان سوال شامل کریں۔",
      ex: ""
    },
    essayfb: {
      title: "مضمون پر رائے",
      desc: "نرم اور ٹھوس رائے جو طالب علم کے کام آئے",
      role: "ایک مہربان اور دیانت دار زبان کے استاد",
      task: "نیچے دیے گئے طالب علم کے مضمون پر رائے دیں۔",
      context: "جماعت [9] کا مضمون، موضوع “[موضوع]”۔ الفاظ کی حد 250 تھی۔ مضمون (طالب علم کے نام کے بغیر): [مضمون یہاں پیسٹ کریں]",
      cons: "پہلے 2 باتیں بتائیں جو طالب علم نے اچھی کیں۔\nپھر بہتری کے 3 ٹھوس طریقے بتائیں، ہر ایک کے ساتھ ایک مثالی جملہ۔\nخیالات، ترتیب اور گرامر پر الگ الگ تبصرہ کریں۔\nپورا مضمون دوبارہ نہ لکھیں۔\n10 میں سے نمبر دیں اور مختصر وجہ بتائیں۔",
      ex: ""
    },
    timetable: {
      title: "پڑھائی کا ٹائم ٹیبل",
      desc: "امتحان سے پہلے ہفتے بھر کا عملی منصوبہ",
      role: "طلبہ کو عملی منصوبہ بنانے میں مدد دینے والے ایک اسٹڈی کوچ",
      task: "میرے امتحانات کے لیے ہفتہ وار پڑھائی کا ٹائم ٹیبل بنائیں؛ امتحانات [تاریخ] سے شروع ہیں۔",
      context: "میں جماعت [10] میں ہوں۔ اسکول صبح 8 سے دوپہر 2 بجے تک ہے۔ میرے مضامین: ریاضی، سائنس، سماجی علوم، انگریزی اور [دوسری زبان]۔ میرا سب سے کمزور مضمون [مضمون] ہے۔",
      cons: "چھوٹے وقفے، کھیل کا وقت اور 8 گھنٹے کی نیند شامل کریں۔\nسب سے کمزور مضمون کو زیادہ وقت دیں۔\nہر ہفتے ایک دن دہرائی کے لیے رکھیں۔\nاتوار کی شام خالی رکھیں۔",
      ex: ""
    },
    debate: {
      title: "مباحثے کے نکات",
      desc: "حق اور مخالفت میں متوازن نکات",
      role: "ایک تجربہ کار مباحثہ کوچ",
      task: "اس موضوع کے حق اور مخالفت میں نکات دیں: “[موضوع، جیسے اسکولوں میں موبائل فون کی اجازت ہونی چاہیے]”۔",
      context: "جماعت [11] کے طلبہ کے بین اسکول مباحثہ مقابلے کے لیے۔ ہر مقرر کو 3 منٹ ملیں گے۔",
      cons: "حق میں 5 اور مخالفت میں 5 نکات دیں۔\nہر نکتے کے ساتھ ایک حقیقت یا مثال دیں، اور جن حقائق کو مجھے دوبارہ جانچنا چاہیے ان پر نشان لگائیں۔\nہر فریق کے لیے 2 ممکنہ جوابی دلائل شامل کریں۔\nبات متوازن اور باادب رکھیں۔",
      ex: ""
    },
    summary: {
      title: "نوٹس کا خلاصہ",
      desc: "لمبے نوٹس کو دہرائی کے نکات میں بدلیں",
      role: "صاف دہرائی نوٹس بنانے والے ایک پڑھائی کے مددگار",
      task: "نیچے دیے گئے میرے نوٹس کا خلاصہ دہرائی کے اہم نکات میں بنائیں۔",
      context: "[موضوع] پر یہ میرے کلاس کے نوٹس ہیں: [اپنے نوٹس یہاں پیسٹ کریں]",
      cons: "زیادہ سے زیادہ 10 نکات رکھیں۔\nسبھی اہم اصطلاحات، تاریخیں اور فارمولے باقی رکھیں۔\nخود کو جانچنے کے لیے 3 سوال شامل کریں۔\nکوئی ایسی بات نہ جوڑیں جو میرے نوٹس میں نہیں ہے۔",
      ex: ""
    },
    interview: {
      title: "انٹرویو کی مشق",
      desc: "ایک وقت میں ایک سوال والا فرضی انٹرویو",
      role: "[نوکری یا کالج داخلے] کے لیے ایک دوستانہ انٹرویو لینے والے",
      task: "انٹرویو کی مشق میں میری مدد کریں۔ ایک وقت میں ایک ہی سوال پوچھیں، میرے جواب کا انتظار کریں، پھر رائے دیں۔",
      context: "میں [B.Com آخری سال کا طالب علم / کی طالبہ] ہوں اور [نوکری یا کورس] کے لیے درخواست دے رہا/رہی ہوں۔ میں گھبرا جاتا/جاتی ہوں اور بہت مختصر جواب دیتا/دیتی ہوں۔",
      cons: "کل 8 سوال پوچھیں، آسان سے مشکل کی طرف۔\nہر جواب کے بعد ایک خوبی اور بہتری کی ایک بات بتائیں۔\nآخر میں مختصر خلاصہ اور 3 مشورے دیں۔\nمیرا اصل نام، فون نمبر یا پتا نہ پوچھیں۔",
      ex: ""
    }
  }
};

