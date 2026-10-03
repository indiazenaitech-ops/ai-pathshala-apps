/* AI Ethics Discussion Cards: the 12 scenario cards in every language.
   APP_CONTENT[lang].cards[i] = { title, story, options: [4], questions: [3], consider: [3] }.
   Cards and options are in the same order in every language; the non-language data
   (id, icon, principles) lives in app.js (CARDS). Neutral, age-appropriate, Classes 8-12. */
window.APP_CONTENT = {};
(function (C) {

/* ---------- en ---------- */
C.en = { cards: [
  {
    title: 'A fake video of a classmate',
    story: 'Someone in Class 9 used a free AI app to make a fake video of their classmate Meera. In it, she seems to say rude things about a teacher. It looks completely real. The video is spreading fast on the class WhatsApp group, and Meera is too upset to come to school. You have just received it.',
    options: [
      'Forward it to a few friends. Everyone has seen it anyway.',
      'Don\'t forward it, and stay quiet.',
      'Post in the group that the video is fake and ask everyone to delete it.',
      'Tell a teacher or parent, and support Meera privately.'
    ],
    questions: [
      'Who is harmed by this video, and how?',
      'Is a person who only forwards a fake video also responsible? Why?',
      'What rules should apps that can make fake videos follow?'
    ],
    consider: [
      'A deepfake can hurt a person\'s good name and mental health, even after people learn that it is fake.',
      'Every forward spreads the harm. Not forwarding helps; reporting it helps even more.',
      'Making or sharing fake videos to harm someone can be punished under Indian law. Such videos can be reported at cybercrime.gov.in.'
    ]
  },
  {
    title: 'AI marks your essay',
    story: 'A school wants to use an AI tool to mark Class 10 English essays. It is fast and gives instant feedback. But in a trial, it gave high marks to long essays full of difficult words. Some students who wrote in simple English, with good ideas, got low marks.',
    options: [
      'Use the AI for all marking. It saves teachers a lot of time.',
      'Use AI only for feedback on rough drafts. Teachers give the final marks.',
      'Use AI marks, but let any student ask a teacher to re-check.',
      'Don\'t use it until it is tested and shown to be fair.'
    ],
    questions: [
      'What makes marking fair? Can a machine learn that?',
      'Should students be told when an AI has marked their work?',
      'If the AI gives a wrong mark, who is responsible: the school, the company or the AI?'
    ],
    consider: [
      'An AI learns from old examples. If those examples rewarded long words, the AI copies that habit.',
      'Transparency means students know how they are marked and can ask for a re-check.',
      'For important decisions like exam marks, a human should stay responsible.'
    ]
  },
  {
    title: 'Face-scan attendance',
    story: 'A college wants to take attendance with a camera at the gate that recognises every student\'s face. It will save time in every class and stop proxy attendance. The face photos will be stored by the company that runs the system. Some students say it often fails to recognise them in low light.',
    options: [
      'Go ahead. It is quick and stops proxy attendance.',
      'Use it only for students who agree. Keep a paper register for the others.',
      'Use it only if the face data stays with the college and is deleted after the course.',
      'Don\'t use it. A roll call works well enough.'
    ],
    questions: [
      'Is your face personal data? Who should control it?',
      'What could go wrong if this face data is leaked or misused?',
      'If the system makes more mistakes for some students, is it still fair?'
    ],
    consider: [
      'Face data is biometric data. If it leaks, you cannot change your face like a password.',
      'India\'s Digital Personal Data Protection Act, 2023 says people should be told why their data is collected, and usually they must agree to it.',
      'Face recognition can make more mistakes in poor light or for some faces, so students may be wrongly marked absent.'
    ]
  },
  {
    title: 'AI does the homework',
    story: 'Arjun has a Science project due tomorrow. He types the topic into an AI chatbot, and in one minute it writes a neat, complete report. He could hand it in as his own work. His friend says, "Everyone does it." The teacher has not said anything about using AI.',
    options: [
      'Submit the AI report as it is. Nobody will know.',
      'Use the AI to understand the topic, then write the report himself.',
      'Use parts of the AI report, but clearly say that AI helped.',
      'Ask the teacher what kind of AI help is allowed.'
    ],
    questions: [
      'What is the difference between getting help and cheating?',
      'What does Arjun lose if the AI does all the thinking?',
      'What should a fair AI rule for homework in your class say?'
    ],
    consider: [
      'Homework is practice. If AI does it, the marks may go up, but the learning does not.',
      'AI chatbots can make up facts that sound correct, so their answers must always be checked.',
      'Saying honestly how you used AI builds trust. Many schools are now making clear rules about AI.'
    ]
  },
  {
    title: 'A hiring AI that is biased',
    story: 'A big company uses AI to sort thousands of job applications. The AI learnt from 10 years of the company\'s past hiring, when it mostly hired men from big cities. Now it gives lower scores to women and to people from small towns, even when their skills are the same.',
    options: [
      'Keep using it. It is fast, and the company can hire whoever it wants.',
      'Fix the training data and test the AI for bias before using it again.',
      'Let the AI make a shortlist, but humans make the final choice and check the rejections.',
      'Stop using AI for hiring. People\'s careers are too important.'
    ],
    questions: [
      'How did the AI become unfair when nobody told it to be unfair?',
      'Should people be told that an AI rejected their application?',
      'Who should check that a hiring AI is fair: the company, the government or someone else?'
    ],
    consider: [
      'AI copies patterns from past data, including old unfair habits. This is called bias.',
      'Comparing the results for different groups (women and men, cities and towns) can reveal hidden bias.',
      'People should be able to know why they were rejected and ask a human to look again.'
    ]
  },
  {
    title: 'The self-driving car\'s choice',
    story: 'A self-driving car is moving on a busy road in Bengaluru. Suddenly a child runs onto the road. The car cannot stop in time. It can stay in its lane, or swerve onto the footpath where two people are walking. Both choices put someone at risk. Engineers must decide in advance what the car should do.',
    options: [
      'Always protect the people inside the car first.',
      'Always choose the action that puts the fewest people at risk.',
      'Always brake hard and stay in the lane. Never swerve onto a footpath.',
      'Such cars should not be allowed on roads until they can avoid these situations.'
    ],
    questions: [
      'Who should decide these rules: engineers, the government or the public?',
      'If the car causes an accident, who is responsible: the owner, the company or the programmer?',
      'Should buyers know what rules their car follows?'
    ],
    consider: [
      'Self-driving cars are designed to slow down early and avoid such moments, but no system is perfect.',
      'These rules are moral choices, so many people, not just engineers, should have a say.',
      'Before such cars are allowed, there must be clear rules about who is responsible for an accident.'
    ]
  },
  {
    title: 'A free health app shares data',
    story: 'Priya uses a free fitness app that counts her steps, sleep and heartbeat. It also asks about her weight, diet and mood. Deep inside its long terms and conditions, it says the company may share this data with "partners". Soon, Priya starts seeing ads for weight-loss products and health insurance.',
    options: [
      'It is fine. The app is free, and she agreed to the terms.',
      'Keep the app, but turn off data sharing in the settings.',
      'Delete the app and choose one that does not share data.',
      'Complain about the app. Companies should need clear permission to share health data.'
    ],
    questions: [
      'If an app is free, how does the company earn money?',
      'Is tapping "I agree" on a long document real consent?',
      'What health information should never be shared without asking?'
    ],
    consider: [
      'Many free apps earn money from your data and from ads. If you don\'t pay with money, you may be paying with your data.',
      'Health data is very personal. It can affect insurance, jobs or how people treat you.',
      'A good app asks clearly, in simple words, before sharing data. Check app permissions and privacy settings.'
    ]
  },
  {
    title: 'AI art wins the competition',
    story: 'A district painting competition has the theme "My India in 2047". A beautiful, detailed picture wins first prize. Later, everyone learns that the student made it with an AI image generator by typing a few lines. The rules did not mention AI. Other students had spent weeks painting by hand.',
    options: [
      'The prize should stay. The rules did not ban AI.',
      'Take back the prize and give it to the best hand-made painting.',
      'Let the winner keep it, and add a separate AI art category from next year.',
      'The student should have told the judges that AI was used.'
    ],
    questions: [
      'Is typing a prompt the same as making art? What skills does it need?',
      'Is it fair to compare AI pictures with hand-made paintings?',
      'AI image tools learnt from millions of artists\' pictures. Should those artists get credit?'
    ],
    consider: [
      'Being honest about how something was made matters, even when the rules are unclear.',
      'Fair contests compare similar skills. Clear rules about AI help everyone.',
      'AI art can be creative, but AI learns from other people\'s work, often without asking them.'
    ]
  },
  {
    title: 'AI cameras in school corridors',
    story: 'After a fight in school, the principal plans to put AI cameras in all the corridors. The AI will spot "unusual behaviour", like running or groups gathering, and alert teachers. Many parents feel students will be safer. Some students feel they are always being watched, and worry that the AI will report normal play as trouble.',
    options: [
      'Put cameras everywhere. Safety comes first.',
      'Put cameras only at gates and stairs, never inside classrooms.',
      'Put cameras, but tell everyone what is recorded, who can see it and when it is deleted.',
      'No AI cameras. Have more teachers on duty and talk to students instead.'
    ],
    questions: [
      'How would you feel if a camera was always watching you?',
      'What counts as "unusual behaviour"? Who decides?',
      'Who should see the videos, and how long should they be kept?'
    ],
    consider: [
      'Cameras can help find out what happened, but they can also make people feel they are not trusted.',
      'AI may wrongly flag normal things, like running to class, so a human should check before any action.',
      'Clear rules on what is recorded, who sees it and when it is deleted protect both safety and privacy.'
    ]
  },
  {
    title: 'A machine replaces village jobs',
    story: 'In a village in Punjab, a farmer buys a smart harvesting machine guided by AI. It cuts his wheat field in one day. Earlier, 20 workers did this in a week and earned money every season. The farmer saves time and money, but workers like Ramesh now have no work at harvest time.',
    options: [
      'This is progress. The farmer should use the machine.',
      'Use the machine, but help the workers learn new skills, like running and repairing it.',
      'The government should support workers who lose jobs to machines.',
      'Use the machine for only part of the work, so that some jobs remain.'
    ],
    questions: [
      'Who gains and who loses when a machine replaces workers?',
      'Can new technology also create new jobs? Which ones?',
      'Whose duty is it to help workers who lose their jobs?'
    ],
    consider: [
      'Machines can make hard work faster, safer and cheaper, and help farmers grow more food.',
      'But the gains often go to a few people, while others lose their income.',
      'Training, new kinds of work and support schemes can help people adjust to the change.'
    ]
  },
  {
    title: 'A voice-clone scam call',
    story: 'Late at night, Dadi gets a phone call. It is her grandson Rohan\'s voice, crying: "Dadi, I\'ve had an accident! Send ₹50,000 by UPI right now, and don\'t tell Papa." But Rohan is safe and asleep in his hostel. Scammers copied his voice with AI from videos he had posted online.',
    options: [
      'Dadi should send the money quickly. What if it is true?',
      'Dadi should hang up and call Rohan or a family member on a number she knows.',
      'Families should agree on a secret code word to check such calls.',
      'Rohan should stop posting videos of his voice online.'
    ],
    questions: [
      'Why do these scams work so well?',
      'Who is responsible: the scammers, the companies that make voice AI, or both?',
      'How can you help the elders in your family stay safe?'
    ],
    consider: [
      'AI can copy a voice from just a few seconds of audio, so a familiar voice is no longer proof.',
      'Scammers create panic and secrecy: "right now", "don\'t tell anyone". Stop, and check first.',
      'In India, report cyber fraud quickly on helpline 1930 or at cybercrime.gov.in.'
    ]
  },
  {
    title: 'The endless video feed',
    story: 'Kabir, 15, opens a short-video app "for five minutes" at night and looks up two hours later. The app\'s AI learns exactly which videos keep him watching and shows him more of them. His sleep and marks are falling. The company earns more money the longer he scrolls.',
    options: [
      'It is Kabir\'s choice. He should control himself.',
      'Apps should have a daily time limit for teenagers, turned on by default.',
      'Apps should show why each video was recommended and let users change their feed.',
      'Families and schools should agree on phone-free times, like after 10 pm.'
    ],
    questions: [
      'Is it fair when a smart AI system competes for a teenager\'s attention?',
      'Should companies be responsible for harm caused by addictive design?',
      'What habits help you stay in control of your screen time?'
    ],
    consider: [
      'Recommendation AI is built to keep you watching, because more watching means more ads.',
      'Endless scrolling and autoplay make it hard to stop. That is by design, not a weakness in you.',
      'Simple steps help: screen-time limits, no phone in the bedroom at night, and autoplay turned off.'
    ]
  }
] };


/* ---------- hi ---------- */
C.hi = { cards: [
  {
    title: 'सहपाठी का नकली वीडियो',
    story: 'कक्षा 9 के किसी विद्यार्थी ने एक मुफ़्त AI ऐप से अपनी सहपाठी मीरा का नकली वीडियो बना दिया। उसमें मीरा एक शिक्षक के बारे में बुरी बातें कहती दिखती है। वीडियो बिल्कुल असली लगता है। यह कक्षा के WhatsApp ग्रुप में तेज़ी से फैल रहा है, और मीरा इतनी दुखी है कि स्कूल नहीं आ रही। अभी-अभी यह वीडियो आपके पास भी आया है।',
    options: [
      'कुछ दोस्तों को फ़ॉरवर्ड कर दें। सबने तो देख ही लिया है।',
      'फ़ॉरवर्ड न करें, और चुप रहें।',
      'ग्रुप में लिखें कि वीडियो नकली है और सबसे इसे डिलीट करने को कहें।',
      'किसी शिक्षक या माता-पिता को बताएँ, और अकेले में मीरा का साथ दें।'
    ],
    questions: [
      'इस वीडियो से किसे नुकसान हो रहा है, और कैसे?',
      'जो सिर्फ़ नकली वीडियो फ़ॉरवर्ड करता है, क्या वह भी ज़िम्मेदार है? क्यों?',
      'नकली वीडियो बना सकने वाले ऐप्स को कौन-से नियम मानने चाहिए?'
    ],
    consider: [
      'डीपफ़ेक किसी की इज़्ज़त और मन को चोट पहुँचा सकता है, लोगों को सच पता चलने के बाद भी।',
      'हर फ़ॉरवर्ड नुकसान को और फैलाता है। फ़ॉरवर्ड न करना मदद है; शिकायत करना उससे भी बड़ी मदद है।',
      'किसी को नुकसान पहुँचाने के लिए नकली वीडियो बनाना या फैलाना भारतीय कानून में सज़ा के लायक हो सकता है। ऐसे वीडियो की शिकायत cybercrime.gov.in पर की जा सकती है।'
    ]
  },
  {
    title: 'AI आपके निबंध जाँचे',
    story: 'एक स्कूल कक्षा 10 के अंग्रेज़ी निबंध AI टूल से जँचवाना चाहता है। यह तेज़ है और तुरंत सुझाव देता है। लेकिन ट्रायल में इसने कठिन शब्दों से भरे लंबे निबंधों को ज़्यादा अंक दिए। जिन विद्यार्थियों ने आसान अंग्रेज़ी में अच्छे विचार लिखे थे, उन्हें कम अंक मिले।',
    options: [
      'सारी जाँच AI से कराएँ। इससे शिक्षकों का बहुत समय बचेगा।',
      'AI सिर्फ़ कच्चे ड्राफ़्ट पर सुझाव दे। अंतिम अंक शिक्षक दें।',
      'AI के अंक रखें, पर कोई भी विद्यार्थी शिक्षक से दोबारा जाँच करवा सके।',
      'जब तक यह जाँचकर निष्पक्ष साबित न हो, इसे इस्तेमाल न करें।'
    ],
    questions: [
      'जाँच को निष्पक्ष क्या बनाता है? क्या कोई मशीन यह सीख सकती है?',
      'क्या विद्यार्थियों को बताया जाना चाहिए कि उनका काम AI ने जाँचा है?',
      'अगर AI गलत अंक दे, तो ज़िम्मेदार कौन है: स्कूल, कंपनी या AI?'
    ],
    consider: [
      'AI पुराने उदाहरणों से सीखता है। अगर उन उदाहरणों में लंबे शब्दों को इनाम मिला था, तो AI भी वही आदत सीख लेता है।',
      'पारदर्शिता का मतलब है कि विद्यार्थी जानें कि उन्हें कैसे अंक मिले और वे दोबारा जाँच माँग सकें।',
      'परीक्षा के अंकों जैसे बड़े फ़ैसलों की ज़िम्मेदारी किसी इंसान पर ही रहनी चाहिए।'
    ]
  },
  {
    title: 'चेहरा देखकर हाज़िरी',
    story: 'एक कॉलेज गेट पर ऐसा कैमरा लगाना चाहता है जो हर विद्यार्थी का चेहरा पहचानकर हाज़िरी लगाए। इससे हर क्लास का समय बचेगा और प्रॉक्सी हाज़िरी रुकेगी। चेहरों की फ़ोटो सिस्टम चलाने वाली कंपनी के पास रहेंगी। कुछ विद्यार्थी कहते हैं कि कम रोशनी में यह उन्हें अक्सर पहचान नहीं पाता।',
    options: [
      'लगा दें। यह तेज़ है और प्रॉक्सी हाज़िरी रोकता है।',
      'सिर्फ़ उन्हीं के लिए इस्तेमाल करें जो सहमत हों। बाकी के लिए काग़ज़ का रजिस्टर रखें।',
      'तभी इस्तेमाल करें जब चेहरे का डेटा कॉलेज के पास रहे और कोर्स के बाद मिटा दिया जाए।',
      'इस्तेमाल न करें। नाम पुकारकर हाज़िरी लेना काफ़ी है।'
    ],
    questions: [
      'क्या आपका चेहरा निजी डेटा है? उस पर किसका नियंत्रण होना चाहिए?',
      'अगर यह चेहरे का डेटा लीक हो जाए या गलत इस्तेमाल हो, तो क्या हो सकता है?',
      'अगर सिस्टम कुछ विद्यार्थियों के साथ ज़्यादा गलतियाँ करे, तो क्या यह फिर भी निष्पक्ष है?'
    ],
    consider: [
      'चेहरे का डेटा बायोमेट्रिक डेटा है। लीक हो जाए तो पासवर्ड की तरह आप अपना चेहरा नहीं बदल सकते।',
      'भारत का डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 कहता है कि लोगों को बताया जाए कि उनका डेटा क्यों लिया जा रहा है, और आम तौर पर उनकी सहमति ज़रूरी है।',
      'कम रोशनी में या कुछ चेहरों के लिए फ़ेस रिकग्निशन ज़्यादा गलतियाँ कर सकता है, जिससे विद्यार्थी गलती से गैरहाज़िर लग सकते हैं।'
    ]
  },
  {
    title: 'होमवर्क AI ने किया',
    story: 'अर्जुन का विज्ञान प्रोजेक्ट कल जमा होना है। वह विषय AI चैटबॉट में लिखता है, और एक मिनट में वह साफ़-सुथरी, पूरी रिपोर्ट लिख देता है। वह इसे अपना काम बताकर जमा कर सकता है। उसका दोस्त कहता है, "सब यही करते हैं।" शिक्षक ने AI के इस्तेमाल के बारे में कुछ नहीं कहा है।',
    options: [
      'AI की रिपोर्ट जैसी है वैसी जमा कर दे। किसी को पता नहीं चलेगा।',
      'AI से विषय समझे, फिर रिपोर्ट ख़ुद लिखे।',
      'AI की रिपोर्ट के कुछ हिस्से ले, पर साफ़ बताए कि AI ने मदद की।',
      'शिक्षक से पूछे कि AI की कैसी मदद ठीक है।'
    ],
    questions: [
      'मदद लेने और नकल करने में क्या फ़र्क है?',
      'अगर सारा सोचने का काम AI करे, तो अर्जुन क्या खो देता है?',
      'आपकी कक्षा में होमवर्क के लिए AI का निष्पक्ष नियम क्या होना चाहिए?'
    ],
    consider: [
      'होमवर्क अभ्यास है। अगर AI इसे करे, तो अंक बढ़ सकते हैं, पर सीखना नहीं बढ़ता।',
      'AI चैटबॉट ऐसे तथ्य गढ़ सकते हैं जो सही लगते हैं, इसलिए उनके जवाब हमेशा जाँचने चाहिए।',
      'AI का इस्तेमाल ईमानदारी से बताने से भरोसा बनता है। कई स्कूल अब AI के बारे में साफ़ नियम बना रहे हैं।'
    ]
  },
  {
    title: 'भेदभाव करने वाला भर्ती AI',
    story: 'एक बड़ी कंपनी हज़ारों नौकरी के आवेदन छाँटने के लिए AI इस्तेमाल करती है। AI ने कंपनी की पिछले 10 साल की भर्तियों से सीखा, जब कंपनी ज़्यादातर बड़े शहरों के पुरुषों को रखती थी। अब यह महिलाओं और छोटे कस्बों के लोगों को कम अंक देता है, भले ही उनका हुनर उतना ही हो।',
    options: [
      'इसे चलने दें। यह तेज़ है, और कंपनी जिसे चाहे रख सकती है।',
      'ट्रेनिंग डेटा ठीक करें और दोबारा इस्तेमाल से पहले AI को भेदभाव के लिए जाँचें।',
      'AI एक छोटी सूची बनाए, पर अंतिम चुनाव इंसान करें और अस्वीकार हुए आवेदन भी देखें।',
      'भर्ती में AI का इस्तेमाल बंद करें। लोगों का करियर बहुत ज़रूरी है।'
    ],
    questions: [
      'जब किसी ने AI को भेदभाव करने को नहीं कहा, तो वह भेदभाव करने वाला कैसे बन गया?',
      'क्या लोगों को बताया जाना चाहिए कि उनका आवेदन AI ने अस्वीकार किया?',
      'भर्ती वाला AI निष्पक्ष है, यह कौन जाँचे: कंपनी, सरकार या कोई और?'
    ],
    consider: [
      'AI पुराने डेटा से पैटर्न सीखता है, पुरानी गलत आदतों समेत। इसे पक्षपात (बायस) कहते हैं।',
      'अलग-अलग समूहों (महिलाएँ और पुरुष, शहर और कस्बे) के नतीजों की तुलना करने से छिपा पक्षपात दिख सकता है।',
      'लोगों को पता चल सकना चाहिए कि उन्हें क्यों अस्वीकार किया गया, और वे किसी इंसान से दोबारा देखने को कह सकें।'
    ]
  },
  {
    title: 'सेल्फ़-ड्राइविंग कार का फ़ैसला',
    story: 'बेंगलुरु की एक भीड़ भरी सड़क पर एक सेल्फ़-ड्राइविंग कार चल रही है। अचानक एक बच्चा सड़क पर दौड़ आता है। कार समय पर रुक नहीं सकती। वह अपनी लेन में रह सकती है, या फ़ुटपाथ की ओर मुड़ सकती है जहाँ दो लोग चल रहे हैं। दोनों में किसी न किसी को ख़तरा है। इंजीनियरों को पहले से तय करना है कि कार क्या करे।',
    options: [
      'हमेशा पहले कार के अंदर बैठे लोगों को बचाए।',
      'हमेशा वह रास्ता चुने जिसमें सबसे कम लोगों को ख़तरा हो।',
      'हमेशा ज़ोर से ब्रेक लगाए और अपनी लेन में रहे। फ़ुटपाथ पर कभी न मुड़े।',
      'ऐसी कारें तब तक सड़क पर न आएँ जब तक वे ऐसी स्थितियों से बच न सकें।'
    ],
    questions: [
      'ये नियम कौन तय करे: इंजीनियर, सरकार या जनता?',
      'अगर कार से दुर्घटना हो, तो ज़िम्मेदार कौन है: मालिक, कंपनी या प्रोग्रामर?',
      'क्या ख़रीदारों को पता होना चाहिए कि उनकी कार कौन-से नियम मानती है?'
    ],
    consider: [
      'सेल्फ़-ड्राइविंग कारें इस तरह बनाई जाती हैं कि वे पहले से धीमी होकर ऐसे पल टालें, पर कोई भी सिस्टम पूरी तरह सही नहीं होता।',
      'ये नियम नैतिक फ़ैसले हैं, इसलिए सिर्फ़ इंजीनियर नहीं, बहुत से लोगों की राय होनी चाहिए।',
      'ऐसी कारों को इजाज़त देने से पहले साफ़ नियम चाहिए कि दुर्घटना की ज़िम्मेदारी किसकी होगी।'
    ]
  },
  {
    title: 'मुफ़्त हेल्थ ऐप डेटा बाँटता है',
    story: 'प्रिया एक मुफ़्त फ़िटनेस ऐप इस्तेमाल करती है जो उसके कदम, नींद और धड़कन गिनता है। यह उसका वज़न, खान-पान और मूड भी पूछता है। इसकी लंबी शर्तों में कहीं अंदर लिखा है कि कंपनी यह डेटा "पार्टनर्स" के साथ बाँट सकती है। जल्द ही प्रिया को वज़न घटाने वाले सामान और हेल्थ इंश्योरेंस के विज्ञापन दिखने लगते हैं।',
    options: [
      'ठीक है। ऐप मुफ़्त है, और उसने शर्तें मानी थीं।',
      'ऐप रखे, पर सेटिंग में डेटा शेयरिंग बंद कर दे।',
      'ऐप हटा दे और ऐसा ऐप चुने जो डेटा न बाँटे।',
      'ऐप की शिकायत करे। सेहत का डेटा बाँटने के लिए कंपनियों को साफ़ अनुमति लेनी चाहिए।'
    ],
    questions: [
      'अगर ऐप मुफ़्त है, तो कंपनी पैसे कैसे कमाती है?',
      'लंबे दस्तावेज़ पर "मैं सहमत हूँ" दबाना क्या सच्ची सहमति है?',
      'सेहत की कौन-सी जानकारी बिना पूछे कभी नहीं बाँटनी चाहिए?'
    ],
    consider: [
      'कई मुफ़्त ऐप आपके डेटा और विज्ञापनों से कमाते हैं। अगर आप पैसे से नहीं चुका रहे, तो शायद अपने डेटा से चुका रहे हैं।',
      'सेहत का डेटा बहुत निजी होता है। इसका असर बीमा, नौकरी या लोगों के आपसे व्यवहार पर पड़ सकता है।',
      'अच्छा ऐप डेटा बाँटने से पहले आसान शब्दों में साफ़ पूछता है। ऐप की अनुमतियाँ और प्राइवेसी सेटिंग जाँचें।'
    ]
  },
  {
    title: 'AI चित्र ने प्रतियोगिता जीती',
    story: 'ज़िला चित्रकला प्रतियोगिता का विषय है "2047 में मेरा भारत"। एक सुंदर, बारीक चित्र पहला इनाम जीतता है। बाद में सबको पता चलता है कि विद्यार्थी ने कुछ लाइनें टाइप करके इसे AI इमेज जनरेटर से बनाया था। नियमों में AI का ज़िक्र नहीं था। बाकी विद्यार्थियों ने हफ़्तों हाथ से चित्र बनाए थे।',
    options: [
      'इनाम रहने दें। नियमों में AI पर रोक नहीं थी।',
      'इनाम वापस लें और हाथ से बने सबसे अच्छे चित्र को दें।',
      'विजेता इनाम रखे, और अगले साल से AI चित्रों की अलग श्रेणी बने।',
      'विद्यार्थी को जजों को बताना चाहिए था कि AI इस्तेमाल हुआ।'
    ],
    questions: [
      'क्या प्रॉम्प्ट टाइप करना चित्र बनाने जैसा ही है? इसमें कौन-से हुनर लगते हैं?',
      'क्या AI चित्रों की तुलना हाथ से बने चित्रों से करना निष्पक्ष है?',
      'AI इमेज टूल ने लाखों कलाकारों के चित्रों से सीखा है। क्या उन कलाकारों को श्रेय मिलना चाहिए?'
    ],
    consider: [
      'कोई चीज़ कैसे बनी, यह ईमानदारी से बताना ज़रूरी है, चाहे नियम साफ़ न हों।',
      'निष्पक्ष प्रतियोगिता एक जैसे हुनर की तुलना करती है। AI के बारे में साफ़ नियम सबकी मदद करते हैं।',
      'AI कला रचनात्मक हो सकती है, पर AI दूसरों के काम से सीखता है, अक्सर उनसे पूछे बिना।'
    ]
  },
  {
    title: 'स्कूल के गलियारों में AI कैमरे',
    story: 'स्कूल में एक झगड़े के बाद प्रिंसिपल सभी गलियारों में AI कैमरे लगाने की सोच रहे हैं। AI दौड़ना या भीड़ जमा होना जैसा "असामान्य व्यवहार" पहचानकर शिक्षकों को सूचना देगा। कई माता-पिता को लगता है कि बच्चे ज़्यादा सुरक्षित रहेंगे। कुछ विद्यार्थियों को लगता है कि उन पर हर समय नज़र रखी जा रही है, और डर है कि AI सामान्य खेल को भी गड़बड़ी बता देगा।',
    options: [
      'हर जगह कैमरे लगाएँ। सुरक्षा सबसे पहले।',
      'कैमरे सिर्फ़ गेट और सीढ़ियों पर लगाएँ, कक्षाओं के अंदर कभी नहीं।',
      'कैमरे लगाएँ, पर सबको बताएँ कि क्या रिकॉर्ड होता है, कौन देख सकता है और कब मिटाया जाता है।',
      'AI कैमरे नहीं। ज़्यादा शिक्षकों की ड्यूटी लगाएँ और विद्यार्थियों से बात करें।'
    ],
    questions: [
      'अगर कोई कैमरा हर समय आप पर नज़र रखे, तो आपको कैसा लगेगा?',
      '"असामान्य व्यवहार" किसे कहेंगे? यह कौन तय करेगा?',
      'वीडियो कौन देखे, और उन्हें कितने समय तक रखा जाए?'
    ],
    consider: [
      'कैमरे यह पता करने में मदद कर सकते हैं कि क्या हुआ, पर इनसे लोगों को यह भी लग सकता है कि उन पर भरोसा नहीं है।',
      'AI कक्षा की ओर दौड़ने जैसी सामान्य बातों को भी गलती से गड़बड़ी मान सकता है, इसलिए कोई कदम उठाने से पहले इंसान जाँचे।',
      'क्या रिकॉर्ड होगा, कौन देखेगा और कब मिटेगा, इसके साफ़ नियम सुरक्षा और निजता दोनों की रक्षा करते हैं।'
    ]
  },
  {
    title: 'मशीन ने गाँव का काम छीना',
    story: 'पंजाब के एक गाँव में एक किसान AI से चलने वाली स्मार्ट कटाई मशीन ख़रीदता है। यह एक दिन में उसका गेहूँ का खेत काट देती है। पहले 20 मज़दूर यह काम एक हफ़्ते में करते थे और हर फ़सल पर कमाते थे। किसान का समय और पैसा बचता है, पर रमेश जैसे मज़दूरों के पास अब कटाई के समय कोई काम नहीं है।',
    options: [
      'यही तरक्की है। किसान को मशीन इस्तेमाल करनी चाहिए।',
      'मशीन इस्तेमाल करें, पर मज़दूरों को नए हुनर सीखने में मदद करें, जैसे मशीन चलाना और ठीक करना।',
      'मशीनों के कारण काम खोने वाले मज़दूरों की सरकार मदद करे।',
      'मशीन से सिर्फ़ कुछ काम कराएँ, ताकि कुछ रोज़गार बचा रहे।'
    ],
    questions: [
      'जब मशीन मज़दूरों की जगह लेती है, तो किसे फ़ायदा होता है और किसे नुकसान?',
      'क्या नई तकनीक नए रोज़गार भी बना सकती है? कौन-से?',
      'काम खोने वाले मज़दूरों की मदद करना किसकी ज़िम्मेदारी है?'
    ],
    consider: [
      'मशीनें कठिन काम को तेज़, सुरक्षित और सस्ता बना सकती हैं, और किसानों को ज़्यादा अनाज उगाने में मदद कर सकती हैं।',
      'पर फ़ायदा अक्सर कुछ लोगों को मिलता है, जबकि दूसरों की कमाई चली जाती है।',
      'ट्रेनिंग, नए तरह के काम और सहायता योजनाएँ लोगों को इस बदलाव के साथ चलने में मदद कर सकती हैं।'
    ]
  },
  {
    title: 'आवाज़ की नकल से धोखा',
    story: 'देर रात दादी के पास एक फ़ोन आता है। उनके पोते रोहन की आवाज़ है, रोते हुए: "दादी, मेरा एक्सीडेंट हो गया है! अभी UPI से ₹50,000 भेज दो, और पापा को मत बताना।" पर रोहन अपने हॉस्टल में सुरक्षित सो रहा है। ठगों ने उसके ऑनलाइन डाले वीडियो से AI द्वारा उसकी आवाज़ की नकल बना ली थी।',
    options: [
      'दादी जल्दी पैसे भेज दें। अगर सच हुआ तो?',
      'दादी फ़ोन काटें और रोहन या परिवार के किसी सदस्य को उस नंबर पर फ़ोन करें जो उन्हें पता है।',
      'परिवार ऐसे फ़ोन जाँचने के लिए एक गुप्त कोड शब्द तय करे।',
      'रोहन अपनी आवाज़ वाले वीडियो ऑनलाइन डालना बंद करे।'
    ],
    questions: [
      'ऐसे धोखे इतनी आसानी से क्यों सफल हो जाते हैं?',
      'ज़िम्मेदार कौन है: ठग, आवाज़ वाला AI बनाने वाली कंपनियाँ, या दोनों?',
      'आप अपने परिवार के बड़ों को सुरक्षित रहने में कैसे मदद कर सकते हैं?'
    ],
    consider: [
      'AI कुछ सेकंड की आवाज़ से ही किसी की आवाज़ की नकल कर सकता है, इसलिए जानी-पहचानी आवाज़ अब सबूत नहीं है।',
      'ठग घबराहट और गोपनीयता पैदा करते हैं: "अभी", "किसी को मत बताना"। रुकें, और पहले जाँचें।',
      'भारत में साइबर धोखे की शिकायत तुरंत हेल्पलाइन 1930 पर या cybercrime.gov.in पर करें।'
    ]
  },
  {
    title: 'कभी न ख़त्म होने वाली वीडियो फ़ीड',
    story: '15 साल का कबीर रात को "पाँच मिनट के लिए" शॉर्ट-वीडियो ऐप खोलता है और दो घंटे बाद नज़र उठाता है। ऐप का AI ठीक-ठीक सीख लेता है कि कौन-से वीडियो उसे रोके रखते हैं, और वैसे ही और दिखाता है। उसकी नींद और अंक दोनों गिर रहे हैं। वह जितनी देर स्क्रॉल करता है, कंपनी उतना ज़्यादा कमाती है।',
    options: [
      'यह कबीर का फ़ैसला है। उसे ख़ुद पर काबू रखना चाहिए।',
      'ऐप्स में किशोरों के लिए रोज़ की समय-सीमा पहले से चालू होनी चाहिए।',
      'ऐप्स बताएँ कि हर वीडियो क्यों सुझाया गया और लोग अपनी फ़ीड बदल सकें।',
      'परिवार और स्कूल बिना फ़ोन वाला समय तय करें, जैसे रात 10 बजे के बाद।'
    ],
    questions: [
      'जब एक स्मार्ट AI सिस्टम किसी किशोर का ध्यान खींचने की होड़ करे, तो क्या यह निष्पक्ष है?',
      'लत लगाने वाले डिज़ाइन से होने वाले नुकसान के लिए क्या कंपनियाँ ज़िम्मेदार हों?',
      'कौन-सी आदतें आपको अपने स्क्रीन टाइम पर काबू रखने में मदद करती हैं?'
    ],
    consider: [
      'सुझाव देने वाला AI इसलिए बना है कि आप देखते रहें, क्योंकि ज़्यादा देखने का मतलब ज़्यादा विज्ञापन है।',
      'अंतहीन स्क्रॉल और ऑटोप्ले रुकना मुश्किल बनाते हैं। यह डिज़ाइन की वजह से है, आपकी कमज़ोरी नहीं।',
      'छोटे कदम मदद करते हैं: स्क्रीन टाइम की सीमा, रात में बेडरूम में फ़ोन नहीं, और ऑटोप्ले बंद।'
    ]
  }
] };

/* ---------- mr ---------- */
C.mr = { cards: [
  {
    title: 'वर्गमैत्रिणीचा बनावट व्हिडिओ',
    story: 'इयत्ता 9 मधील कोणीतरी एका मोफत AI ॲपने आपल्या वर्गमैत्रिणीचा, मीराचा, बनावट व्हिडिओ बनवला. त्यात ती एका शिक्षकांबद्दल वाईट बोलताना दिसते. व्हिडिओ अगदी खरा वाटतो. तो वर्गाच्या WhatsApp ग्रुपवर वेगाने पसरत आहे, आणि मीरा इतकी दुखावली आहे की ती शाळेत येत नाही. आत्ताच तो व्हिडिओ तुमच्याकडेही आला आहे.',
    options: [
      'काही मित्रांना फॉरवर्ड करा. सगळ्यांनी तो पाहिलाच आहे.',
      'फॉरवर्ड करू नका, आणि गप्प बसा.',
      'ग्रुपवर लिहा की व्हिडिओ बनावट आहे आणि सगळ्यांना तो डिलीट करायला सांगा.',
      'शिक्षकांना किंवा पालकांना सांगा, आणि मीराला एकट्यात आधार द्या.'
    ],
    questions: [
      'या व्हिडिओमुळे कोणाचे नुकसान होत आहे, आणि कसे?',
      'जो फक्त बनावट व्हिडिओ फॉरवर्ड करतो, तोही जबाबदार आहे का? का?',
      'बनावट व्हिडिओ बनवू शकणाऱ्या ॲप्सनी कोणते नियम पाळायला हवेत?'
    ],
    consider: [
      'डीपफेक एखाद्याच्या प्रतिष्ठेला आणि मनाला धक्का देऊ शकतो, तो बनावट आहे हे कळल्यानंतरही.',
      'प्रत्येक फॉरवर्ड नुकसान आणखी पसरवतो. फॉरवर्ड न करणे ही मदत आहे; तक्रार करणे त्याहून मोठी मदत आहे.',
      'एखाद्याला त्रास देण्यासाठी बनावट व्हिडिओ बनवणे किंवा पसरवणे हा भारतीय कायद्यानुसार शिक्षेस पात्र गुन्हा ठरू शकतो. अशा व्हिडिओची तक्रार cybercrime.gov.in वर करता येते.'
    ]
  },
  {
    title: 'AI तुमचे निबंध तपासते',
    story: 'एका शाळेला इयत्ता 10 चे इंग्रजी निबंध AI टूलने तपासायचे आहेत. ते जलद आहे आणि लगेच सूचना देते. पण चाचणीत त्याने अवघड शब्दांनी भरलेल्या लांब निबंधांना जास्त गुण दिले. सोप्या इंग्रजीत चांगले विचार मांडणाऱ्या काही विद्यार्थ्यांना कमी गुण मिळाले.',
    options: [
      'सगळी तपासणी AI ने करा. त्यामुळे शिक्षकांचा खूप वेळ वाचेल.',
      'AI फक्त कच्च्या मसुद्यावर सूचना देईल. अंतिम गुण शिक्षक देतील.',
      'AI चे गुण ठेवा, पण कोणत्याही विद्यार्थ्याला शिक्षकांकडून फेरतपासणी मागता यावी.',
      'ते तपासून न्याय्य असल्याचे सिद्ध होईपर्यंत वापरू नका.'
    ],
    questions: [
      'तपासणी न्याय्य कशामुळे होते? यंत्र हे शिकू शकते का?',
      'आपले काम AI ने तपासले आहे, हे विद्यार्थ्यांना सांगायला हवे का?',
      'AI ने चुकीचे गुण दिले तर जबाबदार कोण: शाळा, कंपनी की AI?'
    ],
    consider: [
      'AI जुन्या उदाहरणांमधून शिकते. त्या उदाहरणांत लांब शब्दांना बक्षीस मिळाले असेल, तर AI तीच सवय उचलते.',
      'पारदर्शकता म्हणजे विद्यार्थ्यांना गुण कसे दिले हे कळणे आणि फेरतपासणी मागता येणे.',
      'परीक्षेच्या गुणांसारख्या महत्त्वाच्या निर्णयांची जबाबदारी माणसाकडेच राहायला हवी.'
    ]
  },
  {
    title: 'चेहरा पाहून हजेरी',
    story: 'एका कॉलेजला गेटवर असा कॅमेरा लावायचा आहे जो प्रत्येक विद्यार्थ्याचा चेहरा ओळखून हजेरी घेईल. त्यामुळे प्रत्येक तासाचा वेळ वाचेल आणि प्रॉक्सी हजेरी थांबेल. चेहऱ्यांचे फोटो ही यंत्रणा चालवणाऱ्या कंपनीकडे साठवले जातील. काही विद्यार्थी म्हणतात की कमी प्रकाशात ती त्यांना अनेकदा ओळखत नाही.',
    options: [
      'लावून टाका. ते जलद आहे आणि प्रॉक्सी हजेरी थांबवते.',
      'फक्त संमती देणाऱ्यांसाठीच वापरा. इतरांसाठी कागदी रजिस्टर ठेवा.',
      'चेहऱ्याचा डेटा कॉलेजकडेच राहील आणि कोर्स संपल्यावर पुसला जाईल, तरच वापरा.',
      'वापरू नका. नाव पुकारून हजेरी घेणे पुरेसे आहे.'
    ],
    questions: [
      'तुमचा चेहरा हा वैयक्तिक डेटा आहे का? त्यावर कोणाचे नियंत्रण असावे?',
      'हा चेहऱ्याचा डेटा लीक झाला किंवा त्याचा गैरवापर झाला तर काय होऊ शकते?',
      'यंत्रणा काही विद्यार्थ्यांच्या बाबतीत जास्त चुका करत असेल, तर ती तरीही न्याय्य आहे का?'
    ],
    consider: [
      'चेहऱ्याचा डेटा हा बायोमेट्रिक डेटा आहे. तो लीक झाला तर पासवर्डसारखा तुम्ही आपला चेहरा बदलू शकत नाही.',
      'भारताचा डिजिटल वैयक्तिक डेटा संरक्षण कायदा, 2023 सांगतो की लोकांना त्यांचा डेटा का घेतला जात आहे हे सांगायला हवे, आणि सहसा त्यांची संमती आवश्यक असते.',
      'कमी प्रकाशात किंवा काही चेहऱ्यांसाठी फेस रेकग्निशन जास्त चुका करू शकते, त्यामुळे विद्यार्थी चुकून गैरहजर दिसू शकतात.'
    ]
  },
  {
    title: 'गृहपाठ AI ने केला',
    story: 'अर्जुनचा विज्ञान प्रकल्प उद्या द्यायचा आहे. तो विषय AI चॅटबॉटमध्ये टाइप करतो, आणि एका मिनिटात तो एक नीटनेटका, पूर्ण अहवाल लिहून देतो. तो हा अहवाल स्वतःचा म्हणून देऊ शकतो. त्याचा मित्र म्हणतो, "सगळेच असे करतात." शिक्षकांनी AI वापराबद्दल काहीच सांगितलेले नाही.',
    options: [
      'AI चा अहवाल जसाच्या तसा द्यावा. कोणालाच कळणार नाही.',
      'AI च्या मदतीने विषय समजून घ्यावा, आणि अहवाल स्वतः लिहावा.',
      'AI च्या अहवालातील काही भाग वापरावेत, पण AI ने मदत केली हे स्पष्ट सांगावे.',
      'AI ची कोणती मदत चालेल, हे शिक्षकांना विचारावे.'
    ],
    questions: [
      'मदत घेणे आणि कॉपी करणे यात काय फरक आहे?',
      'सगळा विचार AI ने केला तर अर्जुन काय गमावतो?',
      'तुमच्या वर्गात गृहपाठासाठी AI चा न्याय्य नियम काय असावा?'
    ],
    consider: [
      'गृहपाठ म्हणजे सराव. तो AI ने केला तर गुण वाढतील कदाचित, पण शिकणे वाढत नाही.',
      'AI चॅटबॉट खरी वाटणारी पण चुकीची माहिती रचू शकतात, म्हणून त्यांची उत्तरे नेहमी तपासायला हवीत.',
      'AI कसे वापरले हे प्रामाणिकपणे सांगितल्याने विश्वास निर्माण होतो. अनेक शाळा आता AI बद्दल स्पष्ट नियम बनवत आहेत.'
    ]
  },
  {
    title: 'भेदभाव करणारे भरती AI',
    story: 'एक मोठी कंपनी हजारो नोकरी अर्ज छाननीसाठी AI वापरते. त्या AI ने कंपनीच्या मागील 10 वर्षांच्या भरतीतून शिकले, जेव्हा कंपनी बहुतेक मोठ्या शहरांतील पुरुषांनाच नोकरी देत असे. आता ते महिलांना आणि छोट्या गावांतील लोकांना कमी गुण देते, त्यांची कौशल्ये तितकीच असली तरी.',
    options: [
      'ते वापरत राहा. ते जलद आहे, आणि कंपनी हवे त्याला घेऊ शकते.',
      'ट्रेनिंग डेटा दुरुस्त करा आणि पुन्हा वापरण्यापूर्वी AI ची भेदभावासाठी चाचणी करा.',
      'AI छोटी यादी बनवेल, पण अंतिम निवड माणसे करतील आणि नाकारलेले अर्जही तपासतील.',
      'भरतीसाठी AI वापरणे बंद करा. लोकांचे करिअर खूप महत्त्वाचे आहे.'
    ],
    questions: [
      'कोणीही सांगितले नसताना AI भेदभाव करणारे कसे झाले?',
      'आपला अर्ज AI ने नाकारला, हे लोकांना सांगायला हवे का?',
      'भरती AI न्याय्य आहे का, हे कोणी तपासावे: कंपनी, सरकार की आणखी कोणी?'
    ],
    consider: [
      'AI जुन्या डेटामधून पॅटर्न शिकते, जुन्या अन्याय्य सवयींसह. याला पक्षपात (बायस) म्हणतात.',
      'वेगवेगळ्या गटांच्या (महिला आणि पुरुष, शहरे आणि गावे) निकालांची तुलना केल्यास लपलेला पक्षपात दिसू शकतो.',
      'आपल्याला का नाकारले हे लोकांना कळायला हवे, आणि एखाद्या माणसाने पुन्हा पाहावे अशी मागणी करता यायला हवी.'
    ]
  },
  {
    title: 'सेल्फ-ड्रायव्हिंग कारचा निर्णय',
    story: 'बंगळुरूच्या गर्दीच्या रस्त्यावर एक सेल्फ-ड्रायव्हिंग कार जात आहे. अचानक एक मूल रस्त्यावर धावत येते. कार वेळेत थांबू शकत नाही. ती आपल्या लेनमध्ये राहू शकते, किंवा फूटपाथकडे वळू शकते जिथे दोन माणसे चालत आहेत. दोन्ही पर्यायांत कोणालातरी धोका आहे. कारने काय करावे हे इंजिनिअरना आधीच ठरवावे लागेल.',
    options: [
      'नेहमी आधी कारमधील लोकांना वाचवावे.',
      'नेहमी असा पर्याय निवडावा ज्यात सर्वात कमी लोकांना धोका असेल.',
      'नेहमी जोरात ब्रेक लावून आपल्याच लेनमध्ये राहावे. फूटपाथवर कधीच वळू नये.',
      'अशा परिस्थिती टाळता येईपर्यंत अशा कारना रस्त्यावर परवानगी देऊ नये.'
    ],
    questions: [
      'हे नियम कोणी ठरवावेत: इंजिनिअर, सरकार की लोक?',
      'कारमुळे अपघात झाला तर जबाबदार कोण: मालक, कंपनी की प्रोग्रामर?',
      'आपली कार कोणते नियम पाळते हे खरेदीदारांना माहीत असायला हवे का?'
    ],
    consider: [
      'सेल्फ-ड्रायव्हिंग कार लवकर वेग कमी करून असे क्षण टाळतील अशा बनवल्या जातात, पण कोणतीही यंत्रणा परिपूर्ण नसते.',
      'हे नियम नैतिक निर्णय आहेत, म्हणून फक्त इंजिनिअर नव्हे तर अनेक लोकांचे म्हणणे ऐकले जावे.',
      'अशा कारना परवानगी देण्याआधी अपघाताची जबाबदारी कोणाची याचे स्पष्ट नियम हवेत.'
    ]
  },
  {
    title: 'मोफत हेल्थ ॲप डेटा वाटते',
    story: 'प्रिया एक मोफत फिटनेस ॲप वापरते जे तिची पावले, झोप आणि हृदयाचे ठोके मोजते. ते तिचे वजन, आहार आणि मूडही विचारते. त्याच्या लांबलचक अटींमध्ये खोलवर लिहिले आहे की कंपनी हा डेटा "पार्टनर्स"सोबत शेअर करू शकते. लवकरच प्रियाला वजन कमी करण्याच्या उत्पादनांच्या आणि हेल्थ इन्शुरन्सच्या जाहिराती दिसू लागतात.',
    options: [
      'ठीक आहे. ॲप मोफत आहे, आणि तिने अटी मान्य केल्या होत्या.',
      'ॲप ठेवावे, पण सेटिंगमध्ये डेटा शेअरिंग बंद करावे.',
      'ॲप काढून टाकावे आणि डेटा शेअर न करणारे ॲप निवडावे.',
      'ॲपची तक्रार करावी. आरोग्याचा डेटा शेअर करण्यासाठी कंपन्यांनी स्पष्ट परवानगी घ्यायला हवी.'
    ],
    questions: [
      'ॲप मोफत असेल तर कंपनी पैसे कसे कमावते?',
      'लांबलचक दस्तऐवजावर "मी सहमत आहे" दाबणे ही खरी संमती आहे का?',
      'आरोग्याची कोणती माहिती विचारल्याशिवाय कधीच शेअर करू नये?'
    ],
    consider: [
      'अनेक मोफत ॲप्स तुमच्या डेटामधून आणि जाहिरातींमधून कमावतात. तुम्ही पैशाने किंमत देत नसाल, तर कदाचित डेटाने देत आहात.',
      'आरोग्याचा डेटा अगदी खासगी असतो. त्याचा परिणाम विमा, नोकरी किंवा लोक तुमच्याशी कसे वागतात यावर होऊ शकतो.',
      'चांगले ॲप डेटा शेअर करण्यापूर्वी सोप्या शब्दांत स्पष्ट विचारते. ॲप परवानग्या आणि प्रायव्हसी सेटिंग तपासा.'
    ]
  },
  {
    title: 'AI चित्राने स्पर्धा जिंकली',
    story: 'जिल्हा चित्रकला स्पर्धेचा विषय आहे "2047 मधील माझा भारत". एक सुंदर, बारीक तपशील असलेले चित्र पहिले बक्षीस जिंकते. नंतर सगळ्यांना कळते की विद्यार्थ्याने काही ओळी टाइप करून ते AI इमेज जनरेटरने बनवले होते. नियमांत AI चा उल्लेख नव्हता. इतर विद्यार्थ्यांनी आठवडेभर हाताने चित्रे काढली होती.',
    options: [
      'बक्षीस राहू द्या. नियमांत AI वर बंदी नव्हती.',
      'बक्षीस परत घ्या आणि हाताने काढलेल्या सर्वोत्तम चित्राला द्या.',
      'विजेत्याने बक्षीस ठेवावे, आणि पुढच्या वर्षीपासून AI चित्रांचा वेगळा गट करावा.',
      'AI वापरले हे विद्यार्थ्याने परीक्षकांना सांगायला हवे होते.'
    ],
    questions: [
      'प्रॉम्प्ट टाइप करणे म्हणजे चित्र काढण्यासारखेच आहे का? त्यासाठी कोणती कौशल्ये लागतात?',
      'AI चित्रांची हाताने काढलेल्या चित्रांशी तुलना करणे न्याय्य आहे का?',
      'AI इमेज टूल्स लाखो कलाकारांच्या चित्रांमधून शिकली आहेत. त्या कलाकारांना श्रेय मिळायला हवे का?'
    ],
    consider: [
      'एखादी गोष्ट कशी बनवली हे प्रामाणिकपणे सांगणे महत्त्वाचे आहे, नियम स्पष्ट नसले तरी.',
      'न्याय्य स्पर्धा सारख्या कौशल्यांची तुलना करते. AI बद्दलचे स्पष्ट नियम सगळ्यांना मदत करतात.',
      'AI कला सर्जनशील असू शकते, पण AI इतरांच्या कामातून शिकते, अनेकदा त्यांना न विचारता.'
    ]
  },
  {
    title: 'शाळेच्या व्हरांड्यात AI कॅमेरे',
    story: 'शाळेत एका भांडणानंतर मुख्याध्यापक सर्व व्हरांड्यांत AI कॅमेरे लावण्याचा विचार करत आहेत. AI धावणे किंवा गर्दी जमणे असे "असामान्य वर्तन" ओळखून शिक्षकांना कळवेल. अनेक पालकांना वाटते की मुले अधिक सुरक्षित राहतील. काही विद्यार्थ्यांना वाटते की आपल्यावर सतत नजर ठेवली जात आहे, आणि AI साध्या खेळालाही गडबड समजेल अशी भीती वाटते.',
    options: [
      'सगळीकडे कॅमेरे लावा. सुरक्षा सर्वात आधी.',
      'कॅमेरे फक्त गेट आणि जिन्यांवर लावा, वर्गांत कधीच नाही.',
      'कॅमेरे लावा, पण काय रेकॉर्ड होते, कोण पाहू शकते आणि ते कधी पुसले जाते हे सगळ्यांना सांगा.',
      'AI कॅमेरे नकोत. जास्त शिक्षकांची ड्युटी लावा आणि विद्यार्थ्यांशी बोला.'
    ],
    questions: [
      'एखादा कॅमेरा सतत तुमच्यावर नजर ठेवत असेल तर तुम्हाला कसे वाटेल?',
      '"असामान्य वर्तन" कशाला म्हणायचे? ते कोण ठरवणार?',
      'व्हिडिओ कोणी पाहावेत, आणि ते किती काळ ठेवावेत?'
    ],
    consider: [
      'काय घडले हे शोधायला कॅमेरे मदत करू शकतात, पण त्यामुळे आपल्यावर विश्वास नाही असेही लोकांना वाटू शकते.',
      'वर्गाकडे धावणे अशा साध्या गोष्टींनाही AI चुकून गडबड ठरवू शकते, म्हणून कोणतीही कारवाई करण्यापूर्वी माणसाने तपासावे.',
      'काय रेकॉर्ड होते, कोण पाहते आणि कधी पुसले जाते याचे स्पष्ट नियम सुरक्षा आणि खासगीपणा दोन्ही जपतात.'
    ]
  },
  {
    title: 'यंत्राने गावातील काम हिरावले',
    story: 'पंजाबमधील एका गावात एक शेतकरी AI वर चालणारे स्मार्ट कापणी यंत्र विकत घेतो. ते एका दिवसात त्याचे गव्हाचे शेत कापते. आधी 20 मजूर हे काम एका आठवड्यात करायचे आणि प्रत्येक हंगामात कमवायचे. शेतकऱ्याचा वेळ आणि पैसा वाचतो, पण रमेशसारख्या मजुरांना आता कापणीच्या वेळी काम नाही.',
    options: [
      'हीच प्रगती आहे. शेतकऱ्याने यंत्र वापरावे.',
      'यंत्र वापरावे, पण मजुरांना नवी कौशल्ये शिकायला मदत करावी, जसे यंत्र चालवणे आणि दुरुस्त करणे.',
      'यंत्रांमुळे काम गमावणाऱ्या मजुरांना सरकारने मदत करावी.',
      'यंत्राने कामाचा फक्त काही भाग करावा, म्हणजे काही रोजगार टिकून राहील.'
    ],
    questions: [
      'यंत्र मजुरांची जागा घेते तेव्हा कोणाचा फायदा होतो आणि कोणाचे नुकसान?',
      'नवे तंत्रज्ञान नवे रोजगारही निर्माण करू शकते का? कोणते?',
      'काम गमावलेल्या मजुरांना मदत करणे ही कोणाची जबाबदारी आहे?'
    ],
    consider: [
      'यंत्रे कष्टाचे काम जलद, सुरक्षित आणि स्वस्त करू शकतात, आणि शेतकऱ्यांना जास्त अन्न पिकवायला मदत करू शकतात.',
      'पण फायदा अनेकदा थोड्या लोकांनाच मिळतो, तर इतरांचे उत्पन्न जाते.',
      'प्रशिक्षण, नव्या प्रकारचे काम आणि मदत योजना लोकांना या बदलाशी जुळवून घ्यायला मदत करू शकतात.'
    ]
  },
  {
    title: 'आवाजाच्या नकलेने फसवणूक',
    story: 'रात्री उशिरा आजीला एक फोन येतो. तिच्या नातवाचा, रोहनचा, रडणारा आवाज: "आजी, माझा अपघात झाला आहे! आत्ताच UPI ने ₹50,000 पाठव, आणि बाबांना सांगू नकोस." पण रोहन आपल्या हॉस्टेलमध्ये सुखरूप झोपला आहे. फसवणूक करणाऱ्यांनी त्याने ऑनलाइन टाकलेल्या व्हिडिओंमधून AI ने त्याच्या आवाजाची नक्कल केली होती.',
    options: [
      'आजीने लगेच पैसे पाठवावेत. खरे असेल तर?',
      'आजीने फोन ठेवून रोहनला किंवा घरातील कोणाला ओळखीच्या नंबरवर फोन करावा.',
      'असे फोन तपासण्यासाठी कुटुंबाने एक गुप्त कोड शब्द ठरवावा.',
      'रोहनने आपल्या आवाजाचे व्हिडिओ ऑनलाइन टाकणे बंद करावे.'
    ],
    questions: [
      'अशा फसवणुकी इतक्या सहज का यशस्वी होतात?',
      'जबाबदार कोण: फसवणूक करणारे, आवाजाचे AI बनवणाऱ्या कंपन्या, की दोघेही?',
      'तुमच्या घरातील ज्येष्ठांना सुरक्षित राहायला तुम्ही कशी मदत करू शकता?'
    ],
    consider: [
      'AI काही सेकंदांच्या आवाजावरूनच एखाद्याच्या आवाजाची नक्कल करू शकते, त्यामुळे ओळखीचा आवाज आता पुरावा नाही.',
      'फसवणूक करणारे घाई आणि गुप्तता निर्माण करतात: "आत्ताच", "कोणाला सांगू नकोस". थांबा, आणि आधी खात्री करा.',
      'भारतात सायबर फसवणुकीची तक्रार लगेच हेल्पलाइन 1930 वर किंवा cybercrime.gov.in वर करा.'
    ]
  },
  {
    title: 'कधीही न संपणारी व्हिडिओ फीड',
    story: '15 वर्षांचा कबीर रात्री "पाच मिनिटांसाठी" शॉर्ट-व्हिडिओ ॲप उघडतो आणि दोन तासांनी वर पाहतो. ॲपचे AI नेमके शिकते की कोणते व्हिडिओ त्याला खिळवून ठेवतात, आणि तसेच आणखी दाखवते. त्याची झोप आणि गुण दोन्ही घसरत आहेत. तो जितका जास्त वेळ स्क्रोल करतो, तितकी कंपनी जास्त कमावते.',
    options: [
      'हा कबीरचा निर्णय आहे. त्याने स्वतःवर ताबा ठेवावा.',
      'ॲप्समध्ये किशोरांसाठी रोजची वेळमर्यादा आधीपासूनच सुरू असावी.',
      'प्रत्येक व्हिडिओ का सुचवला हे ॲप्सनी दाखवावे आणि लोकांना आपली फीड बदलता यावी.',
      'कुटुंबांनी आणि शाळांनी फोनशिवायची वेळ ठरवावी, जसे रात्री 10 नंतर.'
    ],
    questions: [
      'एखादी हुशार AI यंत्रणा किशोराचे लक्ष वेधण्यासाठी स्पर्धा करते, हे न्याय्य आहे का?',
      'व्यसन लावणाऱ्या डिझाइनमुळे होणाऱ्या नुकसानीसाठी कंपन्या जबाबदार असाव्यात का?',
      'कोणत्या सवयी तुम्हाला स्क्रीन टाइमवर ताबा ठेवायला मदत करतात?'
    ],
    consider: [
      'सुचवणारे AI तुम्ही पाहत राहावे यासाठी बनवलेले असते, कारण जास्त पाहणे म्हणजे जास्त जाहिराती.',
      'न संपणारे स्क्रोल आणि ऑटोप्ले थांबणे कठीण करतात. हे डिझाइनमुळे आहे, तुमच्या कमकुवतपणामुळे नाही.',
      'छोटी पावले मदत करतात: स्क्रीन टाइमची मर्यादा, रात्री बेडरूममध्ये फोन नाही, आणि ऑटोप्ले बंद.'
    ]
  }
] };

/* ---------- bn ---------- */
C.bn = { cards: [
  {
    title: 'সহপাঠীর নকল ভিডিও',
    story: 'ক্লাস 9-এর কেউ একটি বিনামূল্যের AI অ্যাপ দিয়ে তাদের সহপাঠী মীরার একটি নকল ভিডিও বানিয়েছে। তাতে মনে হচ্ছে মীরা একজন শিক্ষককে নিয়ে খারাপ কথা বলছে। ভিডিওটা একদম আসল মনে হয়। ক্লাসের WhatsApp গ্রুপে এটা দ্রুত ছড়িয়ে পড়ছে, আর মীরা এত কষ্ট পেয়েছে যে স্কুলে আসছে না। এইমাত্র ভিডিওটা তোমার কাছেও এসেছে।',
    options: [
      'কয়েকজন বন্ধুকে ফরওয়ার্ড করে দাও। সবাই তো দেখেই ফেলেছে।',
      'ফরওয়ার্ড কোরো না, আর চুপ থাকো।',
      'গ্রুপে লেখো যে ভিডিওটা নকল, আর সবাইকে মুছে ফেলতে বলো।',
      'কোনো শিক্ষক বা বাবা-মাকে জানাও, আর আলাদা করে মীরার পাশে থাকো।'
    ],
    questions: [
      'এই ভিডিওতে কার ক্ষতি হচ্ছে, আর কীভাবে?',
      'যে শুধু নকল ভিডিও ফরওয়ার্ড করে, সে-ও কি দায়ী? কেন?',
      'নকল ভিডিও বানাতে পারে এমন অ্যাপগুলোর কোন নিয়ম মানা উচিত?'
    ],
    consider: [
      'ডিপফেক কারও সুনাম আর মনের ক্ষতি করতে পারে, লোকে সেটা নকল বলে জানার পরেও।',
      'প্রতিটি ফরওয়ার্ড ক্ষতি আরও ছড়ায়। ফরওয়ার্ড না করা সাহায্য করে; অভিযোগ জানানো আরও বেশি সাহায্য করে।',
      'কারও ক্ষতি করতে নকল ভিডিও বানানো বা ছড়ানো ভারতের আইনে শাস্তিযোগ্য হতে পারে। এমন ভিডিওর অভিযোগ cybercrime.gov.in-এ জানানো যায়।'
    ]
  },
  {
    title: 'AI তোমার রচনা দেখবে',
    story: 'একটি স্কুল ক্লাস 10-এর ইংরেজি রচনা AI টুল দিয়ে দেখাতে চায়। এটা দ্রুত, আর সঙ্গে সঙ্গে মতামত দেয়। কিন্তু পরীক্ষামূলক ব্যবহারে এটা কঠিন শব্দে ভরা লম্বা রচনাগুলোকে বেশি নম্বর দিয়েছে। যারা সহজ ইংরেজিতে ভালো ভাবনা লিখেছিল, তাদের কয়েকজন কম নম্বর পেয়েছে।',
    options: [
      'সব খাতা AI দিয়ে দেখাও। এতে শিক্ষকদের অনেক সময় বাঁচবে।',
      'AI শুধু খসড়ার ওপর মতামত দেবে। শেষ নম্বর দেবেন শিক্ষক।',
      'AI-এর নম্বর রাখো, কিন্তু যে কোনো ছাত্রছাত্রী শিক্ষককে আবার দেখতে বলতে পারবে।',
      'পরীক্ষা করে ন্যায্য প্রমাণ না হওয়া পর্যন্ত এটা ব্যবহার কোরো না।'
    ],
    questions: [
      'খাতা দেখা কীসে ন্যায্য হয়? একটা যন্ত্র কি তা শিখতে পারে?',
      'ছাত্রছাত্রীদের কি জানানো উচিত যে তাদের কাজ AI দেখেছে?',
      'AI ভুল নম্বর দিলে দায়ী কে: স্কুল, কোম্পানি না AI?'
    ],
    consider: [
      'AI পুরোনো উদাহরণ থেকে শেখে। সেই উদাহরণে লম্বা শব্দ পুরস্কার পেয়ে থাকলে AI-ও সেই অভ্যাস নকল করে।',
      'স্বচ্ছতা মানে ছাত্রছাত্রীরা জানবে কীভাবে নম্বর দেওয়া হলো, আর আবার দেখার অনুরোধ করতে পারবে।',
      'পরীক্ষার নম্বরের মতো গুরুত্বপূর্ণ সিদ্ধান্তের দায়িত্ব একজন মানুষের হাতেই থাকা উচিত।'
    ]
  },
  {
    title: 'মুখ দেখে হাজিরা',
    story: 'একটি কলেজ গেটে এমন ক্যামেরা বসাতে চায় যা প্রত্যেক ছাত্রছাত্রীর মুখ চিনে হাজিরা নেবে। এতে প্রতিটি ক্লাসের সময় বাঁচবে আর প্রক্সি হাজিরা বন্ধ হবে। মুখের ছবিগুলো রাখবে সেই কোম্পানি যারা ব্যবস্থাটা চালায়। কয়েকজন ছাত্রছাত্রী বলছে, কম আলোয় এটা প্রায়ই তাদের চিনতে পারে না।',
    options: [
      'চালু করে দাও। এটা দ্রুত, আর প্রক্সি হাজিরা আটকায়।',
      'শুধু যারা রাজি তাদের জন্য ব্যবহার করো। বাকিদের জন্য কাগজের খাতা রাখো।',
      'তখনই ব্যবহার করো যদি মুখের ডেটা কলেজের কাছেই থাকে আর কোর্স শেষে মুছে ফেলা হয়।',
      'ব্যবহার কোরো না। নাম ডেকে হাজিরাই যথেষ্ট।'
    ],
    questions: [
      'তোমার মুখ কি ব্যক্তিগত ডেটা? তার নিয়ন্ত্রণ কার হাতে থাকা উচিত?',
      'এই মুখের ডেটা ফাঁস হলে বা অপব্যবহার হলে কী হতে পারে?',
      'ব্যবস্থাটা কিছু ছাত্রছাত্রীর ক্ষেত্রে বেশি ভুল করলে, সেটা কি তবুও ন্যায্য?'
    ],
    consider: [
      'মুখের ডেটা হলো বায়োমেট্রিক ডেটা। ফাঁস হলে পাসওয়ার্ডের মতো মুখ বদলানো যায় না।',
      'ভারতের ডিজিটাল ব্যক্তিগত ডেটা সুরক্ষা আইন, 2023 বলে, মানুষকে জানাতে হবে তাদের ডেটা কেন নেওয়া হচ্ছে, আর সাধারণত তাদের সম্মতি লাগবে।',
      'কম আলোয় বা কিছু মুখের ক্ষেত্রে ফেস রেকগনিশন বেশি ভুল করতে পারে, ফলে ছাত্রছাত্রীদের ভুল করে অনুপস্থিত দেখানো হতে পারে।'
    ]
  },
  {
    title: 'হোমওয়ার্ক করল AI',
    story: 'অর্জুনের বিজ্ঞান প্রজেক্ট কাল জমা দিতে হবে। সে বিষয়টা একটি AI চ্যাটবটে লেখে, আর এক মিনিটে সেটা একটা পরিষ্কার, সম্পূর্ণ রিপোর্ট লিখে দেয়। সে এটা নিজের কাজ বলে জমা দিতে পারে। তার বন্ধু বলে, "সবাই তো এটাই করে।" শিক্ষক AI ব্যবহার নিয়ে কিছু বলেননি।',
    options: [
      'AI-এর রিপোর্ট যেমন আছে তেমনই জমা দিক। কেউ জানবে না।',
      'AI দিয়ে বিষয়টা বুঝুক, তারপর রিপোর্ট নিজে লিখুক।',
      'AI-এর রিপোর্টের কিছু অংশ নিক, কিন্তু স্পষ্ট জানাক যে AI সাহায্য করেছে।',
      'শিক্ষককে জিজ্ঞেস করুক কেমন AI সাহায্য চলবে।'
    ],
    questions: [
      'সাহায্য নেওয়া আর নকল করার মধ্যে পার্থক্য কী?',
      'সব ভাবনার কাজ AI করলে অর্জুন কী হারায়?',
      'তোমার ক্লাসে হোমওয়ার্কের জন্য AI-এর একটা ন্যায্য নিয়ম কী হওয়া উচিত?'
    ],
    consider: [
      'হোমওয়ার্ক হলো অনুশীলন। AI করে দিলে নম্বর বাড়তে পারে, কিন্তু শেখা বাড়ে না।',
      'AI চ্যাটবট এমন তথ্য বানিয়ে ফেলতে পারে যা শুনতে ঠিক লাগে, তাই তার উত্তর সবসময় যাচাই করতে হয়।',
      'AI কীভাবে ব্যবহার করেছ তা সৎভাবে বললে বিশ্বাস তৈরি হয়। অনেক স্কুল এখন AI নিয়ে স্পষ্ট নিয়ম বানাচ্ছে।'
    ]
  },
  {
    title: 'পক্ষপাতদুষ্ট নিয়োগ AI',
    story: 'একটি বড় কোম্পানি হাজার হাজার চাকরির আবেদন বাছাই করতে AI ব্যবহার করে। AI শিখেছে কোম্পানির গত 10 বছরের নিয়োগ থেকে, যখন তারা বেশিরভাগ বড় শহরের পুরুষদেরই নিত। এখন এটা মহিলা আর ছোট শহরের মানুষদের কম নম্বর দেয়, তাদের দক্ষতা সমান হলেও।',
    options: [
      'চালিয়ে যাও। এটা দ্রুত, আর কোম্পানি যাকে খুশি নিতে পারে।',
      'ট্রেনিং ডেটা ঠিক করো, আর আবার ব্যবহারের আগে AI-এর পক্ষপাত পরীক্ষা করো।',
      'AI একটা ছোট তালিকা বানাক, কিন্তু শেষ সিদ্ধান্ত মানুষ নিক আর বাদ পড়া আবেদনগুলোও দেখুক।',
      'নিয়োগে AI ব্যবহার বন্ধ করো। মানুষের কেরিয়ার খুব গুরুত্বপূর্ণ।'
    ],
    questions: [
      'কেউ বলেনি, তবু AI কীভাবে অন্যায্য হয়ে উঠল?',
      'কারও আবেদন AI বাতিল করলে কি তাকে জানানো উচিত?',
      'নিয়োগের AI ন্যায্য কি না, তা কে পরীক্ষা করবে: কোম্পানি, সরকার না অন্য কেউ?'
    ],
    consider: [
      'AI পুরোনো ডেটা থেকে প্যাটার্ন শেখে, পুরোনো অন্যায্য অভ্যাস সমেত। একে পক্ষপাত (বায়াস) বলে।',
      'আলাদা আলাদা গোষ্ঠীর (মহিলা ও পুরুষ, শহর ও মফস্সল) ফল তুলনা করলে লুকোনো পক্ষপাত ধরা পড়তে পারে।',
      'কেন বাদ দেওয়া হলো তা মানুষের জানার সুযোগ থাকা উচিত, আর একজন মানুষকে আবার দেখতে বলার সুযোগও।'
    ]
  },
  {
    title: 'চালকহীন গাড়ির সিদ্ধান্ত',
    story: 'বেঙ্গালুরুর একটা ব্যস্ত রাস্তায় একটি চালকহীন গাড়ি চলছে। হঠাৎ একটা শিশু রাস্তায় ছুটে আসে। গাড়িটা সময়মতো থামতে পারবে না। সেটা নিজের লেনে থাকতে পারে, অথবা ফুটপাথের দিকে বেঁকে যেতে পারে যেখানে দুজন হাঁটছেন। দুটো পথেই কারও না কারও বিপদ। ইঞ্জিনিয়ারদের আগে থেকেই ঠিক করতে হবে গাড়ি কী করবে।',
    options: [
      'সবসময় আগে গাড়ির ভেতরের মানুষদের বাঁচাবে।',
      'সবসময় সেই পথ বাছবে যাতে সবচেয়ে কম মানুষের বিপদ।',
      'সবসময় জোরে ব্রেক কষে নিজের লেনে থাকবে। কখনো ফুটপাথে উঠবে না।',
      'এমন পরিস্থিতি এড়াতে না পারা পর্যন্ত এই গাড়ি রাস্তায় নামতে দেওয়া উচিত নয়।'
    ],
    questions: [
      'এই নিয়ম কে ঠিক করবে: ইঞ্জিনিয়ার, সরকার না সাধারণ মানুষ?',
      'গাড়ি দুর্ঘটনা ঘটালে দায়ী কে: মালিক, কোম্পানি না প্রোগ্রামার?',
      'ক্রেতাদের কি জানা উচিত তাদের গাড়ি কোন নিয়ম মেনে চলে?'
    ],
    consider: [
      'চালকহীন গাড়ি এমনভাবে বানানো হয় যাতে আগেই গতি কমিয়ে এমন মুহূর্ত এড়ানো যায়, কিন্তু কোনো ব্যবস্থাই নিখুঁত নয়।',
      'এই নিয়মগুলো নৈতিক সিদ্ধান্ত, তাই শুধু ইঞ্জিনিয়ার নয়, অনেক মানুষের মত নেওয়া উচিত।',
      'এমন গাড়ির অনুমতির আগে স্পষ্ট নিয়ম চাই, দুর্ঘটনার দায় কার।'
    ]
  },
  {
    title: 'বিনামূল্যের হেলথ অ্যাপ ডেটা দেয়',
    story: 'প্রিয়া একটা বিনামূল্যের ফিটনেস অ্যাপ ব্যবহার করে, যেটা তার হাঁটার ধাপ, ঘুম আর হৃদস্পন্দন গোনে। এটা তার ওজন, খাওয়াদাওয়া আর মেজাজের কথাও জিজ্ঞেস করে। এর লম্বা শর্তাবলির গভীরে লেখা আছে, কোম্পানি এই ডেটা "পার্টনার"-দের সঙ্গে শেয়ার করতে পারে। কিছুদিনের মধ্যেই প্রিয়া ওজন কমানোর জিনিস আর হেলথ ইনশিওরেন্সের বিজ্ঞাপন দেখতে শুরু করে।',
    options: [
      'ঠিকই আছে। অ্যাপ বিনামূল্যের, আর সে শর্তে রাজি হয়েছিল।',
      'অ্যাপ রাখুক, কিন্তু সেটিংসে ডেটা শেয়ারিং বন্ধ করুক।',
      'অ্যাপ মুছে ফেলুক আর এমন অ্যাপ নিক যা ডেটা শেয়ার করে না।',
      'অ্যাপের বিরুদ্ধে অভিযোগ করুক। স্বাস্থ্যের ডেটা শেয়ার করতে কোম্পানিকে স্পষ্ট অনুমতি নিতে হওয়া উচিত।'
    ],
    questions: [
      'অ্যাপ বিনামূল্যের হলে কোম্পানি টাকা রোজগার করে কীভাবে?',
      'লম্বা নথিতে "আমি রাজি" চাপা কি সত্যিকারের সম্মতি?',
      'স্বাস্থ্যের কোন তথ্য না জিজ্ঞেস করে কখনো শেয়ার করা উচিত নয়?'
    ],
    consider: [
      'অনেক বিনামূল্যের অ্যাপ তোমার ডেটা আর বিজ্ঞাপন থেকে রোজগার করে। টাকা দিয়ে দাম না দিলে হয়তো ডেটা দিয়ে দিচ্ছ।',
      'স্বাস্থ্যের ডেটা খুব ব্যক্তিগত। এর প্রভাব পড়তে পারে বিমা, চাকরি বা লোকে তোমার সঙ্গে কেমন ব্যবহার করে তার ওপর।',
      'ভালো অ্যাপ ডেটা শেয়ারের আগে সহজ ভাষায় স্পষ্ট জিজ্ঞেস করে। অ্যাপের অনুমতি আর প্রাইভেসি সেটিংস দেখে নাও।'
    ]
  },
  {
    title: 'AI ছবি প্রতিযোগিতা জিতল',
    story: 'জেলা অঙ্কন প্রতিযোগিতার বিষয় "2047-এ আমার ভারত"। একটা সুন্দর, খুঁটিনাটি ভরা ছবি প্রথম পুরস্কার পায়। পরে সবাই জানতে পারে, ছাত্রটি কয়েক লাইন টাইপ করে AI ইমেজ জেনারেটর দিয়ে ছবিটা বানিয়েছিল। নিয়মে AI-এর কোনো উল্লেখ ছিল না। অন্য ছাত্রছাত্রীরা সপ্তাহের পর সপ্তাহ হাতে ছবি এঁকেছিল।',
    options: [
      'পুরস্কার থাকুক। নিয়মে AI নিষেধ ছিল না।',
      'পুরস্কার ফিরিয়ে নিয়ে হাতে আঁকা সেরা ছবিকে দাও।',
      'বিজয়ী পুরস্কার রাখুক, আর পরের বছর থেকে AI ছবির আলাদা বিভাগ হোক।',
      'ছাত্রটির উচিত ছিল বিচারকদের জানানো যে AI ব্যবহার হয়েছে।'
    ],
    questions: [
      'প্রম্পট টাইপ করা কি ছবি আঁকার মতোই? এতে কোন দক্ষতা লাগে?',
      'AI ছবির সঙ্গে হাতে আঁকা ছবির তুলনা করা কি ন্যায্য?',
      'AI ইমেজ টুল লক্ষ লক্ষ শিল্পীর ছবি থেকে শিখেছে। সেই শিল্পীদের কি কৃতিত্ব পাওয়া উচিত?'
    ],
    consider: [
      'কোনো কিছু কীভাবে বানানো হলো তা সৎভাবে বলা জরুরি, নিয়ম স্পষ্ট না থাকলেও।',
      'ন্যায্য প্রতিযোগিতা একই রকম দক্ষতার তুলনা করে। AI নিয়ে স্পষ্ট নিয়ম সবার উপকার করে।',
      'AI শিল্প সৃজনশীল হতে পারে, কিন্তু AI অন্যদের কাজ থেকে শেখে, প্রায়ই তাদের না জিজ্ঞেস করে।'
    ]
  },
  {
    title: 'স্কুলের বারান্দায় AI ক্যামেরা',
    story: 'স্কুলে একটা মারামারির পর প্রধান শিক্ষক সব বারান্দায় AI ক্যামেরা বসানোর কথা ভাবছেন। AI দৌড়ানো বা দল বেঁধে জড়ো হওয়ার মতো "অস্বাভাবিক আচরণ" ধরে শিক্ষকদের জানাবে। অনেক বাবা-মা মনে করেন ছাত্রছাত্রীরা আরও নিরাপদ থাকবে। কিছু ছাত্রছাত্রীর মনে হয় সবসময় তাদের ওপর নজর রাখা হচ্ছে, আর ভয় পায় AI সাধারণ খেলাকেও গোলমাল বলে জানাবে।',
    options: [
      'সব জায়গায় ক্যামেরা বসাও। নিরাপত্তাই আগে।',
      'ক্যামেরা শুধু গেট আর সিঁড়িতে বসাও, ক্লাসঘরের ভেতরে কখনো নয়।',
      'ক্যামেরা বসাও, কিন্তু সবাইকে জানাও কী রেকর্ড হয়, কে দেখতে পারে আর কবে মোছা হয়।',
      'AI ক্যামেরা নয়। বেশি শিক্ষককে ডিউটিতে রাখো আর ছাত্রছাত্রীদের সঙ্গে কথা বলো।'
    ],
    questions: [
      'একটা ক্যামেরা সবসময় তোমার দিকে নজর রাখলে তোমার কেমন লাগবে?',
      '"অস্বাভাবিক আচরণ" কাকে বলব? কে ঠিক করবে?',
      'ভিডিওগুলো কে দেখবে, আর কতদিন রাখা হবে?'
    ],
    consider: [
      'কী ঘটেছিল তা জানতে ক্যামেরা সাহায্য করতে পারে, কিন্তু এতে মানুষের মনে হতে পারে তাদের বিশ্বাস করা হচ্ছে না।',
      'ক্লাসের দিকে দৌড়ানোর মতো সাধারণ ব্যাপারকেও AI ভুল করে সমস্যা ভাবতে পারে, তাই কোনো ব্যবস্থা নেওয়ার আগে একজন মানুষ যাচাই করুন।',
      'কী রেকর্ড হবে, কে দেখবে আর কবে মোছা হবে, তার স্পষ্ট নিয়ম নিরাপত্তা আর গোপনীয়তা দুটোই রক্ষা করে।'
    ]
  },
  {
    title: 'যন্ত্র কাড়ল গ্রামের কাজ',
    story: 'পাঞ্জাবের একটা গ্রামে একজন কৃষক AI-চালিত একটা স্মার্ট ফসল কাটার যন্ত্র কেনেন। এটা এক দিনে তাঁর গমের খেত কেটে ফেলে। আগে 20 জন মজুর এই কাজ এক সপ্তাহে করতেন আর প্রতি মরসুমে রোজগার করতেন। কৃষকের সময় আর টাকা বাঁচে, কিন্তু রমেশের মতো মজুরদের এখন ফসল কাটার সময় কোনো কাজ নেই।',
    options: [
      'এটাই উন্নতি। কৃষকের যন্ত্র ব্যবহার করা উচিত।',
      'যন্ত্র ব্যবহার করো, কিন্তু মজুরদের নতুন দক্ষতা শিখতে সাহায্য করো, যেমন যন্ত্র চালানো আর সারানো।',
      'যন্ত্রের জন্য কাজ হারানো মজুরদের সরকার সাহায্য করুক।',
      'যন্ত্র দিয়ে কাজের কিছুটা অংশই করাও, যাতে কিছু কাজ থেকে যায়।'
    ],
    questions: [
      'যন্ত্র মজুরদের জায়গা নিলে কার লাভ আর কার ক্ষতি হয়?',
      'নতুন প্রযুক্তি কি নতুন কাজও তৈরি করতে পারে? কোনগুলো?',
      'কাজ হারানো মজুরদের সাহায্য করা কার দায়িত্ব?'
    ],
    consider: [
      'যন্ত্র কঠিন কাজকে দ্রুত, নিরাপদ আর সস্তা করতে পারে, আর কৃষকদের বেশি ফসল ফলাতে সাহায্য করতে পারে।',
      'কিন্তু লাভ প্রায়ই অল্প কয়েকজনের কাছে যায়, আর অন্যরা রোজগার হারায়।',
      'প্রশিক্ষণ, নতুন ধরনের কাজ আর সহায়তা প্রকল্প মানুষকে এই বদলের সঙ্গে মানিয়ে নিতে সাহায্য করতে পারে।'
    ]
  },
  {
    title: 'গলা নকল করে প্রতারণা',
    story: 'গভীর রাতে ঠাকুমার কাছে একটা ফোন আসে। নাতি রোহনের গলা, কাঁদছে: "ঠাকুমা, আমার অ্যাক্সিডেন্ট হয়েছে! এখনই UPI-তে ₹50,000 পাঠাও, আর বাবাকে বোলো না।" কিন্তু রোহন তার হস্টেলে নিরাপদে ঘুমোচ্ছে। প্রতারকরা তার অনলাইনে দেওয়া ভিডিও থেকে AI দিয়ে তার গলা নকল করেছিল।',
    options: [
      'ঠাকুমা তাড়াতাড়ি টাকা পাঠান। যদি সত্যি হয়?',
      'ঠাকুমা ফোন কেটে রোহন বা পরিবারের কাউকে চেনা নম্বরে ফোন করুন।',
      'এমন ফোন যাচাই করতে পরিবার একটা গোপন সংকেত শব্দ ঠিক করুক।',
      'রোহন নিজের গলার ভিডিও অনলাইনে দেওয়া বন্ধ করুক।'
    ],
    questions: [
      'এমন প্রতারণা এত সহজে সফল হয় কেন?',
      'দায়ী কে: প্রতারক, গলার AI বানানো কোম্পানি, না দুজনেই?',
      'তোমার পরিবারের বয়স্কদের নিরাপদ থাকতে তুমি কীভাবে সাহায্য করতে পারো?'
    ],
    consider: [
      'AI মাত্র কয়েক সেকেন্ডের রেকর্ডিং থেকেই কারও গলা নকল করতে পারে, তাই চেনা গলা এখন আর প্রমাণ নয়।',
      'প্রতারকরা আতঙ্ক আর গোপনীয়তা তৈরি করে: "এখনই", "কাউকে বোলো না"। থামো, আর আগে যাচাই করো।',
      'ভারতে সাইবার প্রতারণার অভিযোগ দ্রুত হেল্পলাইন 1930-এ বা cybercrime.gov.in-এ জানাও।'
    ]
  },
  {
    title: 'শেষ না হওয়া ভিডিও ফিড',
    story: '15 বছরের কবীর রাতে "পাঁচ মিনিটের জন্য" একটা শর্ট-ভিডিও অ্যাপ খোলে, আর মুখ তোলে দু ঘণ্টা পরে। অ্যাপের AI ঠিক শিখে নেয় কোন ভিডিও তাকে আটকে রাখে, আর সেরকম আরও দেখায়। তার ঘুম আর নম্বর দুটোই কমছে। সে যত বেশি স্ক্রল করে, কোম্পানি তত বেশি রোজগার করে।',
    options: [
      'এটা কবীরের সিদ্ধান্ত। তার নিজেকে সামলানো উচিত।',
      'অ্যাপে কিশোরদের জন্য রোজকার সময়সীমা আগে থেকেই চালু থাকা উচিত।',
      'অ্যাপ দেখাক প্রতিটি ভিডিও কেন সুপারিশ করা হলো, আর মানুষ যেন নিজের ফিড বদলাতে পারে।',
      'পরিবার আর স্কুল মিলে ফোন ছাড়া সময় ঠিক করুক, যেমন রাত 10টার পরে।'
    ],
    questions: [
      'একটা চতুর AI ব্যবস্থা যখন একজন কিশোরের মনোযোগ কাড়ার প্রতিযোগিতা করে, সেটা কি ন্যায্য?',
      'নেশা ধরানো ডিজাইনের ক্ষতির জন্য কি কোম্পানিগুলো দায়ী হওয়া উচিত?',
      'কোন অভ্যাস তোমাকে স্ক্রিন টাইম নিজের নিয়ন্ত্রণে রাখতে সাহায্য করে?'
    ],
    consider: [
      'সুপারিশ করা AI বানানো হয় যাতে তুমি দেখতেই থাকো, কারণ বেশি দেখা মানে বেশি বিজ্ঞাপন।',
      'অফুরন্ত স্ক্রল আর অটোপ্লে থামা কঠিন করে দেয়। এটা ডিজাইনের কারণে, তোমার দুর্বলতা নয়।',
      'ছোট পদক্ষেপ কাজে দেয়: স্ক্রিন টাইমের সীমা, রাতে শোবার ঘরে ফোন নয়, আর অটোপ্লে বন্ধ।'
    ]
  }
] };

/* ---------- gu ---------- */
C.gu = { cards: [
  {
    title: 'સહપાઠીનો નકલી વીડિયો',
    story: 'ધોરણ 9ના કોઈએ એક મફત AI ઍપથી પોતાની સહપાઠી મીરાનો નકલી વીડિયો બનાવ્યો. તેમાં મીરા એક શિક્ષક વિશે ખરાબ બોલતી દેખાય છે. વીડિયો એકદમ સાચો લાગે છે. તે વર્ગના WhatsApp ગ્રુપમાં ઝડપથી ફેલાઈ રહ્યો છે, અને મીરા એટલી દુઃખી છે કે શાળાએ આવતી નથી. હમણાં જ આ વીડિયો તમારી પાસે પણ આવ્યો છે.',
    options: [
      'થોડા મિત્રોને ફૉરવર્ડ કરી દો. બધાએ જોઈ તો લીધો જ છે.',
      'ફૉરવર્ડ ન કરો, અને ચૂપ રહો.',
      'ગ્રુપમાં લખો કે વીડિયો નકલી છે અને બધાને તે ડિલીટ કરવા કહો.',
      'કોઈ શિક્ષક કે માતા-પિતાને જણાવો, અને એકાંતમાં મીરાને સાથ આપો.'
    ],
    questions: [
      'આ વીડિયોથી કોને નુકસાન થાય છે, અને કેવી રીતે?',
      'જે ફક્ત નકલી વીડિયો ફૉરવર્ડ કરે છે, તે પણ જવાબદાર છે? કેમ?',
      'નકલી વીડિયો બનાવી શકે એવી ઍપ્સે કયા નિયમો પાળવા જોઈએ?'
    ],
    consider: [
      'ડીપફેક કોઈની આબરૂ અને મનને ઠેસ પહોંચાડી શકે છે, લોકોને તે નકલી છે એવી ખબર પડ્યા પછી પણ.',
      'દરેક ફૉરવર્ડ નુકસાનને વધુ ફેલાવે છે. ફૉરવર્ડ ન કરવું મદદરૂપ છે; ફરિયાદ કરવી તેનાથી પણ વધુ મદદરૂપ છે.',
      'કોઈને નુકસાન પહોંચાડવા નકલી વીડિયો બનાવવો કે ફેલાવવો ભારતીય કાયદા હેઠળ સજાપાત્ર બની શકે છે. આવા વીડિયોની ફરિયાદ cybercrime.gov.in પર કરી શકાય છે.'
    ]
  },
  {
    title: 'AI તમારા નિબંધ તપાસે',
    story: 'એક શાળા ધોરણ 10ના અંગ્રેજી નિબંધ AI ટૂલથી તપાસવા માંગે છે. તે ઝડપી છે અને તરત સૂચનો આપે છે. પરંતુ અજમાયશમાં તેણે અઘરા શબ્દોથી ભરેલા લાંબા નિબંધોને વધુ ગુણ આપ્યા. સરળ અંગ્રેજીમાં સારા વિચારો લખનારા કેટલાક વિદ્યાર્થીઓને ઓછા ગુણ મળ્યા.',
    options: [
      'બધી તપાસ AIથી કરાવો. તેનાથી શિક્ષકોનો ઘણો સમય બચશે.',
      'AI ફક્ત કાચા મુસદ્દા પર સૂચનો આપે. અંતિમ ગુણ શિક્ષક આપે.',
      'AIના ગુણ રાખો, પણ કોઈ પણ વિદ્યાર્થી શિક્ષક પાસે ફરી તપાસ માંગી શકે.',
      'ચકાસીને ન્યાયી સાબિત ન થાય ત્યાં સુધી તેનો ઉપયોગ ન કરો.'
    ],
    questions: [
      'તપાસને ન્યાયી શું બનાવે છે? શું કોઈ મશીન તે શીખી શકે?',
      'શું વિદ્યાર્થીઓને જણાવવું જોઈએ કે તેમનું કામ AIએ તપાસ્યું છે?',
      'AI ખોટા ગુણ આપે તો જવાબદાર કોણ: શાળા, કંપની કે AI?'
    ],
    consider: [
      'AI જૂનાં ઉદાહરણોમાંથી શીખે છે. જો તે ઉદાહરણોમાં લાંબા શબ્દોને ઇનામ મળ્યું હોય, તો AI પણ એ જ ટેવ અપનાવે છે.',
      'પારદર્શિતા એટલે વિદ્યાર્થીઓ જાણે કે ગુણ કેવી રીતે મળ્યા અને ફરી તપાસ માંગી શકે.',
      'પરીક્ષાના ગુણ જેવા મહત્ત્વના નિર્ણયોની જવાબદારી કોઈ માણસ પાસે જ રહેવી જોઈએ.'
    ]
  },
  {
    title: 'ચહેરો જોઈને હાજરી',
    story: 'એક કૉલેજ ગેટ પર એવો કૅમેરા મૂકવા માંગે છે જે દરેક વિદ્યાર્થીનો ચહેરો ઓળખીને હાજરી પૂરે. તેનાથી દરેક તાસનો સમય બચશે અને પ્રૉક્સી હાજરી અટકશે. ચહેરાના ફોટા આ સિસ્ટમ ચલાવતી કંપની પાસે સંગ્રહાશે. કેટલાક વિદ્યાર્થીઓ કહે છે કે ઓછા પ્રકાશમાં તે તેમને ઘણી વાર ઓળખી શકતો નથી.',
    options: [
      'લગાવી દો. તે ઝડપી છે અને પ્રૉક્સી હાજરી અટકાવે છે.',
      'ફક્ત સંમતિ આપનારા માટે જ વાપરો. બાકીના માટે કાગળનું રજિસ્ટર રાખો.',
      'ચહેરાનો ડેટા કૉલેજ પાસે જ રહે અને કોર્સ પછી ભૂંસી નખાય, તો જ વાપરો.',
      'ન વાપરો. નામ બોલાવીને હાજરી પૂરવી પૂરતી છે.'
    ],
    questions: [
      'શું તમારો ચહેરો અંગત ડેટા છે? તેના પર કોનું નિયંત્રણ હોવું જોઈએ?',
      'આ ચહેરાનો ડેટા લીક થાય કે તેનો દુરુપયોગ થાય તો શું થઈ શકે?',
      'સિસ્ટમ કેટલાક વિદ્યાર્થીઓ માટે વધુ ભૂલો કરે, તો શું તે છતાં ન્યાયી છે?'
    ],
    consider: [
      'ચહેરાનો ડેટા બાયોમેટ્રિક ડેટા છે. તે લીક થાય તો પાસવર્ડની જેમ તમે તમારો ચહેરો બદલી શકતા નથી.',
      'ભારતનો ડિજિટલ પર્સનલ ડેટા પ્રોટેક્શન કાયદો, 2023 કહે છે કે લોકોને જણાવવું જોઈએ કે તેમનો ડેટા કેમ લેવાય છે, અને સામાન્ય રીતે તેમની સંમતિ જરૂરી છે.',
      'ઓછા પ્રકાશમાં કે કેટલાક ચહેરા માટે ફેસ રેકગ્નિશન વધુ ભૂલો કરી શકે છે, જેથી વિદ્યાર્થીઓ ભૂલથી ગેરહાજર ગણાઈ શકે.'
    ]
  },
  {
    title: 'ગૃહકાર્ય AIએ કર્યું',
    story: 'અર્જુનનો વિજ્ઞાન પ્રોજેક્ટ કાલે જમા કરવાનો છે. તે વિષય AI ચૅટબૉટમાં લખે છે, અને એક મિનિટમાં તે સુઘડ, પૂરો રિપોર્ટ લખી આપે છે. તે આ રિપોર્ટ પોતાના કામ તરીકે જમા કરાવી શકે છે. તેનો મિત્ર કહે છે, "બધા આવું જ કરે છે." શિક્ષકે AIના ઉપયોગ વિશે કંઈ કહ્યું નથી.',
    options: [
      'AIનો રિપોર્ટ જેવો છે તેવો જમા કરાવે. કોઈને ખબર નહીં પડે.',
      'AIથી વિષય સમજે, પછી રિપોર્ટ જાતે લખે.',
      'AIના રિપોર્ટના થોડા ભાગ વાપરે, પણ સ્પષ્ટ કહે કે AIએ મદદ કરી.',
      'શિક્ષકને પૂછે કે AIની કેવી મદદ ચાલે.'
    ],
    questions: [
      'મદદ લેવી અને નકલ કરવી, એ બેમાં શું ફરક છે?',
      'બધું વિચારવાનું કામ AI કરે તો અર્જુન શું ગુમાવે છે?',
      'તમારા વર્ગમાં ગૃહકાર્ય માટે AIનો ન્યાયી નિયમ શું હોવો જોઈએ?'
    ],
    consider: [
      'ગૃહકાર્ય એટલે મહાવરો. AI કરી આપે તો ગુણ વધી શકે, પણ શીખવાનું વધતું નથી.',
      'AI ચૅટબૉટ સાચી લાગે એવી ખોટી માહિતી ઘડી શકે છે, તેથી તેના જવાબ હંમેશાં ચકાસવા જોઈએ.',
      'AIનો ઉપયોગ કેવી રીતે કર્યો તે પ્રામાણિકપણે કહેવાથી વિશ્વાસ બંધાય છે. ઘણી શાળાઓ હવે AI વિશે સ્પષ્ટ નિયમો બનાવી રહી છે.'
    ]
  },
  {
    title: 'ભેદભાવ કરતું ભરતી AI',
    story: 'એક મોટી કંપની હજારો નોકરી અરજીઓ છાંટવા AI વાપરે છે. AIએ કંપનીની છેલ્લાં 10 વર્ષની ભરતીમાંથી શીખ્યું, જ્યારે કંપની મોટે ભાગે મોટાં શહેરોના પુરુષોને જ નોકરી આપતી. હવે તે મહિલાઓ અને નાનાં નગરોના લોકોને ઓછા ગુણ આપે છે, ભલે તેમની આવડત એટલી જ હોય.',
    options: [
      'વાપરતા રહો. તે ઝડપી છે, અને કંપની ઇચ્છે તેને રાખી શકે.',
      'ટ્રેનિંગ ડેટા સુધારો અને ફરી વાપરતાં પહેલાં AIની ભેદભાવ માટે ચકાસણી કરો.',
      'AI ટૂંકી યાદી બનાવે, પણ અંતિમ પસંદગી માણસો કરે અને નકારાયેલી અરજીઓ પણ તપાસે.',
      'ભરતીમાં AIનો ઉપયોગ બંધ કરો. લોકોની કારકિર્દી બહુ મહત્ત્વની છે.'
    ],
    questions: [
      'કોઈએ કહ્યું ન હતું, છતાં AI ભેદભાવ કરતું કેવી રીતે બન્યું?',
      'શું લોકોને જણાવવું જોઈએ કે તેમની અરજી AIએ નકારી?',
      'ભરતી AI ન્યાયી છે કે નહીં તે કોણ તપાસે: કંપની, સરકાર કે બીજું કોઈ?'
    ],
    consider: [
      'AI જૂના ડેટામાંથી પેટર્ન શીખે છે, જૂની અન્યાયી ટેવો સહિત. તેને પક્ષપાત (બાયસ) કહે છે.',
      'જુદાં જુદાં જૂથોનાં (મહિલા અને પુરુષ, શહેર અને નગર) પરિણામોની સરખામણી કરવાથી છુપાયેલો પક્ષપાત દેખાઈ શકે છે.',
      'લોકોને ખબર પડવી જોઈએ કે તેમને કેમ નકાર્યા, અને કોઈ માણસ ફરી જુએ એવી માંગ કરી શકવી જોઈએ.'
    ]
  },
  {
    title: 'સેલ્ફ-ડ્રાઇવિંગ કારનો નિર્ણય',
    story: 'બેંગલુરુના ભીડવાળા રસ્તા પર એક સેલ્ફ-ડ્રાઇવિંગ કાર જઈ રહી છે. અચાનક એક બાળક રસ્તા પર દોડી આવે છે. કાર સમયસર અટકી શકે તેમ નથી. તે પોતાની લેનમાં રહી શકે, અથવા ફૂટપાથ તરફ વળી શકે જ્યાં બે લોકો ચાલી રહ્યા છે. બંને રસ્તે કોઈને ને કોઈને જોખમ છે. કારે શું કરવું તે ઇજનેરોએ પહેલેથી નક્કી કરવું પડશે.',
    options: [
      'હંમેશાં પહેલાં કારની અંદરના લોકોને બચાવે.',
      'હંમેશાં એવો રસ્તો પસંદ કરે જેમાં સૌથી ઓછા લોકોને જોખમ હોય.',
      'હંમેશાં જોરથી બ્રેક મારે અને પોતાની લેનમાં રહે. ફૂટપાથ પર ક્યારેય ન વળે.',
      'આવી સ્થિતિ ટાળી ન શકે ત્યાં સુધી આવી કારને રસ્તા પર મંજૂરી ન આપવી જોઈએ.'
    ],
    questions: [
      'આ નિયમો કોણ નક્કી કરે: ઇજનેરો, સરકાર કે જનતા?',
      'કારથી અકસ્માત થાય તો જવાબદાર કોણ: માલિક, કંપની કે પ્રોગ્રામર?',
      'શું ખરીદનારને ખબર હોવી જોઈએ કે તેમની કાર કયા નિયમો પાળે છે?'
    ],
    consider: [
      'સેલ્ફ-ડ્રાઇવિંગ કાર વહેલી ધીમી પડીને આવી ક્ષણો ટાળે એવી રીતે બનાવાય છે, પણ કોઈ સિસ્ટમ સંપૂર્ણ નથી.',
      'આ નિયમો નૈતિક નિર્ણયો છે, તેથી ફક્ત ઇજનેરો નહીં, ઘણા લોકોનો મત લેવાવો જોઈએ.',
      'આવી કારને મંજૂરી આપતાં પહેલાં અકસ્માતની જવાબદારી કોની, તેના સ્પષ્ટ નિયમો જોઈએ.'
    ]
  },
  {
    title: 'મફત હેલ્થ ઍપ ડેટા વહેંચે છે',
    story: 'પ્રિયા એક મફત ફિટનેસ ઍપ વાપરે છે જે તેનાં પગલાં, ઊંઘ અને ધબકારા ગણે છે. તે તેનું વજન, ખોરાક અને મૂડ પણ પૂછે છે. તેની લાંબી શરતોમાં ઊંડે લખ્યું છે કે કંપની આ ડેટા "પાર્ટનર્સ" સાથે વહેંચી શકે છે. થોડા જ સમયમાં પ્રિયાને વજન ઘટાડવાની વસ્તુઓ અને હેલ્થ ઇન્શ્યોરન્સની જાહેરાતો દેખાવા લાગે છે.',
    options: [
      'બરાબર છે. ઍપ મફત છે, અને તેણે શરતો સ્વીકારી હતી.',
      'ઍપ રાખે, પણ સેટિંગ્સમાં ડેટા શેરિંગ બંધ કરે.',
      'ઍપ કાઢી નાખે અને ડેટા ન વહેંચે એવી ઍપ પસંદ કરે.',
      'ઍપની ફરિયાદ કરે. આરોગ્યનો ડેટા વહેંચવા કંપનીઓએ સ્પષ્ટ મંજૂરી લેવી જ જોઈએ.'
    ],
    questions: [
      'ઍપ મફત હોય તો કંપની પૈસા કેવી રીતે કમાય છે?',
      'લાંબા દસ્તાવેજ પર "હું સંમત છું" દબાવવું એ સાચી સંમતિ છે?',
      'આરોગ્યની કઈ માહિતી પૂછ્યા વગર ક્યારેય ન વહેંચવી જોઈએ?'
    ],
    consider: [
      'ઘણી મફત ઍપ્સ તમારા ડેટા અને જાહેરાતોમાંથી કમાય છે. તમે પૈસાથી કિંમત નથી ચૂકવતા, તો કદાચ ડેટાથી ચૂકવો છો.',
      'આરોગ્યનો ડેટા ખૂબ અંગત હોય છે. તેની અસર વીમા, નોકરી કે લોકો તમારી સાથે કેવું વર્તન કરે તેના પર થઈ શકે.',
      'સારી ઍપ ડેટા વહેંચતાં પહેલાં સરળ શબ્દોમાં સ્પષ્ટ પૂછે છે. ઍપની પરવાનગીઓ અને પ્રાઇવસી સેટિંગ્સ તપાસો.'
    ]
  },
  {
    title: 'AI ચિત્રએ સ્પર્ધા જીતી',
    story: 'જિલ્લા ચિત્ર સ્પર્ધાનો વિષય છે "2047માં મારું ભારત". એક સુંદર, ઝીણવટભર્યું ચિત્ર પહેલું ઇનામ જીતે છે. પછી બધાને ખબર પડે છે કે વિદ્યાર્થીએ થોડી લીટીઓ ટાઇપ કરીને AI ઇમેજ જનરેટરથી તે બનાવ્યું હતું. નિયમોમાં AIનો ઉલ્લેખ ન હતો. બીજા વિદ્યાર્થીઓએ અઠવાડિયાં સુધી હાથથી ચિત્રો દોર્યાં હતાં.',
    options: [
      'ઇનામ રહેવા દો. નિયમોમાં AI પર પ્રતિબંધ ન હતો.',
      'ઇનામ પાછું લો અને હાથથી દોરેલા શ્રેષ્ઠ ચિત્રને આપો.',
      'વિજેતા ઇનામ રાખે, અને આવતા વર્ષથી AI ચિત્રોની અલગ શ્રેણી બને.',
      'વિદ્યાર્થીએ નિર્ણાયકોને કહેવું જોઈતું હતું કે AI વપરાયું છે.'
    ],
    questions: [
      'પ્રૉમ્પ્ટ ટાઇપ કરવો એ ચિત્ર દોરવા જેવું જ છે? તેમાં કઈ આવડત જોઈએ?',
      'AI ચિત્રોની સરખામણી હાથથી દોરેલાં ચિત્રો સાથે કરવી ન્યાયી છે?',
      'AI ઇમેજ ટૂલ્સ લાખો કલાકારોનાં ચિત્રોમાંથી શીખ્યાં છે. શું એ કલાકારોને શ્રેય મળવો જોઈએ?'
    ],
    consider: [
      'કોઈ વસ્તુ કેવી રીતે બની તે પ્રામાણિકપણે કહેવું જરૂરી છે, ભલે નિયમો સ્પષ્ટ ન હોય.',
      'ન્યાયી સ્પર્ધા સરખી આવડતની સરખામણી કરે છે. AI વિશે સ્પષ્ટ નિયમો બધાને મદદ કરે છે.',
      'AI કલા સર્જનાત્મક હોઈ શકે, પણ AI બીજાના કામમાંથી શીખે છે, ઘણી વાર તેમને પૂછ્યા વગર.'
    ]
  },
  {
    title: 'શાળાની લૉબીમાં AI કૅમેરા',
    story: 'શાળામાં એક ઝઘડા પછી આચાર્ય બધી લૉબીમાં AI કૅમેરા મૂકવાનું વિચારે છે. AI દોડવું કે ટોળું ભેગું થવું જેવું "અસામાન્ય વર્તન" ઓળખીને શિક્ષકોને જાણ કરશે. ઘણાં માતા-પિતાને લાગે છે કે બાળકો વધુ સલામત રહેશે. કેટલાક વિદ્યાર્થીઓને લાગે છે કે તેમના પર સતત નજર રખાય છે, અને ડર છે કે AI સામાન્ય રમતને પણ ગરબડ ગણશે.',
    options: [
      'બધે કૅમેરા મૂકો. સલામતી સૌથી પહેલાં.',
      'કૅમેરા ફક્ત ગેટ અને દાદર પર મૂકો, વર્ગખંડોમાં ક્યારેય નહીં.',
      'કૅમેરા મૂકો, પણ બધાને જણાવો કે શું રેકૉર્ડ થાય છે, કોણ જોઈ શકે અને ક્યારે ભૂંસાય છે.',
      'AI કૅમેરા નહીં. વધુ શિક્ષકોને ફરજ પર મૂકો અને વિદ્યાર્થીઓ સાથે વાત કરો.'
    ],
    questions: [
      'કોઈ કૅમેરા સતત તમારા પર નજર રાખે તો તમને કેવું લાગે?',
      '"અસામાન્ય વર્તન" કોને કહેવાય? તે કોણ નક્કી કરે?',
      'વીડિયો કોણ જુએ, અને તે કેટલો સમય રાખવા?'
    ],
    consider: [
      'શું થયું હતું તે શોધવામાં કૅમેરા મદદ કરી શકે, પણ તેનાથી લોકોને એવું પણ લાગી શકે કે તેમના પર વિશ્વાસ નથી.',
      'વર્ગ તરફ દોડવા જેવી સામાન્ય બાબતને પણ AI ભૂલથી ગરબડ ગણી શકે, તેથી કોઈ પગલું ભરતાં પહેલાં માણસ તપાસે.',
      'શું રેકૉર્ડ થશે, કોણ જોશે અને ક્યારે ભૂંસાશે, તેના સ્પષ્ટ નિયમો સલામતી અને ગોપનીયતા બંનેનું રક્ષણ કરે છે.'
    ]
  },
  {
    title: 'મશીને ગામનું કામ છીનવ્યું',
    story: 'પંજાબના એક ગામમાં એક ખેડૂત AIથી ચાલતું સ્માર્ટ લણણી મશીન ખરીદે છે. તે એક દિવસમાં તેનું ઘઉંનું ખેતર લણી નાખે છે. પહેલાં 20 મજૂરો આ કામ એક અઠવાડિયામાં કરતા અને દરેક મોસમે કમાતા. ખેડૂતનો સમય અને પૈસા બચે છે, પણ રમેશ જેવા મજૂરો પાસે હવે લણણી વખતે કોઈ કામ નથી.',
    options: [
      'આ જ પ્રગતિ છે. ખેડૂતે મશીન વાપરવું જોઈએ.',
      'મશીન વાપરો, પણ મજૂરોને નવી આવડત શીખવામાં મદદ કરો, જેમ કે મશીન ચલાવવું અને રિપેર કરવું.',
      'મશીનોને કારણે કામ ગુમાવનારા મજૂરોને સરકાર મદદ કરે.',
      'મશીનથી કામનો થોડો જ ભાગ કરાવો, જેથી થોડી રોજગારી બચી રહે.'
    ],
    questions: [
      'મશીન મજૂરોની જગ્યા લે ત્યારે કોને ફાયદો થાય છે અને કોને નુકસાન?',
      'નવી ટેક્નોલોજી નવી નોકરીઓ પણ બનાવી શકે? કઈ?',
      'કામ ગુમાવનારા મજૂરોને મદદ કરવી એ કોની ફરજ છે?'
    ],
    consider: [
      'મશીનો મહેનતનું કામ ઝડપી, સલામત અને સસ્તું બનાવી શકે છે, અને ખેડૂતોને વધુ અનાજ ઉગાડવામાં મદદ કરી શકે છે.',
      'પણ ફાયદો ઘણી વાર થોડા લોકોને જ મળે છે, જ્યારે બીજાઓની આવક જતી રહે છે.',
      'તાલીમ, નવા પ્રકારનું કામ અને સહાય યોજનાઓ લોકોને આ ફેરફાર સાથે તાલ મેળવવામાં મદદ કરી શકે છે.'
    ]
  },
  {
    title: 'અવાજની નકલથી છેતરપિંડી',
    story: 'મોડી રાતે દાદીને એક ફોન આવે છે. તેમના પૌત્ર રોહનનો રડતો અવાજ: "દાદી, મારો અકસ્માત થયો છે! હમણાં જ UPIથી ₹50,000 મોકલો, અને પપ્પાને ન કહેતાં." પણ રોહન તેની હૉસ્ટેલમાં સલામત ઊંઘે છે. ઠગોએ તેણે ઑનલાઇન મૂકેલા વીડિયોમાંથી AIથી તેના અવાજની નકલ બનાવી હતી.',
    options: [
      'દાદી જલદી પૈસા મોકલે. સાચું હોય તો?',
      'દાદી ફોન મૂકીને રોહનને કે કુટુંબના કોઈને જાણીતા નંબર પર ફોન કરે.',
      'આવા ફોન ચકાસવા કુટુંબ એક ગુપ્ત કોડ શબ્દ નક્કી કરે.',
      'રોહન પોતાના અવાજવાળા વીડિયો ઑનલાઇન મૂકવાનું બંધ કરે.'
    ],
    questions: [
      'આવી છેતરપિંડી આટલી સહેલાઈથી કેમ સફળ થાય છે?',
      'જવાબદાર કોણ: ઠગ, અવાજનું AI બનાવતી કંપનીઓ, કે બંને?',
      'તમે તમારા કુટુંબના વડીલોને સલામત રહેવામાં કેવી રીતે મદદ કરી શકો?'
    ],
    consider: [
      'AI થોડી સેકંડના અવાજ પરથી જ કોઈના અવાજની નકલ કરી શકે છે, એટલે જાણીતો અવાજ હવે પુરાવો નથી.',
      'ઠગ ગભરાટ અને ગુપ્તતા ઊભી કરે છે: "હમણાં જ", "કોઈને ન કહેતાં". થોભો, અને પહેલાં ચકાસો.',
      'ભારતમાં સાયબર છેતરપિંડીની ફરિયાદ તરત હેલ્પલાઇન 1930 પર કે cybercrime.gov.in પર કરો.'
    ]
  },
  {
    title: 'ક્યારેય ન ખૂટતી વીડિયો ફીડ',
    story: '15 વર્ષનો કબીર રાત્રે "પાંચ મિનિટ માટે" શૉર્ટ-વીડિયો ઍપ ખોલે છે અને બે કલાક પછી ઊંચું જુએ છે. ઍપનું AI બરાબર શીખી લે છે કે કયા વીડિયો તેને જકડી રાખે છે, અને એવા જ વધુ બતાવે છે. તેની ઊંઘ અને ગુણ બંને ઘટી રહ્યાં છે. તે જેટલું વધુ સ્ક્રોલ કરે, કંપની એટલું વધુ કમાય છે.',
    options: [
      'આ કબીરનો નિર્ણય છે. તેણે પોતાના પર કાબૂ રાખવો જોઈએ.',
      'ઍપ્સમાં કિશોરો માટે રોજની સમયમર્યાદા પહેલેથી ચાલુ હોવી જોઈએ.',
      'દરેક વીડિયો કેમ સૂચવાયો તે ઍપ્સ બતાવે અને લોકો પોતાની ફીડ બદલી શકે.',
      'કુટુંબો અને શાળાઓ ફોન વગરનો સમય નક્કી કરે, જેમ કે રાત્રે 10 પછી.'
    ],
    questions: [
      'એક હોશિયાર AI સિસ્ટમ કિશોરનું ધ્યાન ખેંચવાની હરીફાઈ કરે, તે ન્યાયી છે?',
      'લત લગાડતી ડિઝાઇનથી થતા નુકસાન માટે કંપનીઓ જવાબદાર હોવી જોઈએ?',
      'કઈ ટેવો તમને સ્ક્રીન ટાઇમ પર કાબૂ રાખવામાં મદદ કરે છે?'
    ],
    consider: [
      'સૂચનો આપતું AI એટલા માટે બનાવાયું છે કે તમે જોતા જ રહો, કારણ કે વધુ જોવું એટલે વધુ જાહેરાતો.',
      'અનંત સ્ક્રોલ અને ઑટોપ્લે અટકવું અઘરું બનાવે છે. એ ડિઝાઇનને કારણે છે, તમારી નબળાઈ નથી.',
      'નાનાં પગલાં મદદ કરે છે: સ્ક્રીન ટાઇમની મર્યાદા, રાત્રે બેડરૂમમાં ફોન નહીં, અને ઑટોપ્લે બંધ.'
    ]
  }
] };

/* ---------- pa ---------- */
C.pa = { cards: [
  {
    title: 'ਸਹਿਪਾਠੀ ਦੀ ਨਕਲੀ ਵੀਡੀਓ',
    story: 'ਨੌਵੀਂ ਜਮਾਤ ਦੇ ਕਿਸੇ ਵਿਦਿਆਰਥੀ ਨੇ ਇੱਕ ਮੁਫ਼ਤ AI ਐਪ ਨਾਲ ਆਪਣੀ ਸਹਿਪਾਠੀ ਮੀਰਾ ਦੀ ਨਕਲੀ ਵੀਡੀਓ ਬਣਾ ਦਿੱਤੀ। ਉਸ ਵਿੱਚ ਮੀਰਾ ਇੱਕ ਅਧਿਆਪਕ ਬਾਰੇ ਮਾੜੀਆਂ ਗੱਲਾਂ ਕਹਿੰਦੀ ਲੱਗਦੀ ਹੈ। ਵੀਡੀਓ ਬਿਲਕੁਲ ਅਸਲੀ ਲੱਗਦੀ ਹੈ। ਇਹ ਜਮਾਤ ਦੇ WhatsApp ਗਰੁੱਪ ਵਿੱਚ ਤੇਜ਼ੀ ਨਾਲ ਫੈਲ ਰਹੀ ਹੈ, ਅਤੇ ਮੀਰਾ ਇੰਨੀ ਦੁਖੀ ਹੈ ਕਿ ਸਕੂਲ ਨਹੀਂ ਆ ਰਹੀ। ਹੁਣੇ-ਹੁਣੇ ਇਹ ਵੀਡੀਓ ਤੁਹਾਡੇ ਕੋਲ ਵੀ ਆਈ ਹੈ।',
    options: [
      'ਕੁਝ ਦੋਸਤਾਂ ਨੂੰ ਫ਼ਾਰਵਰਡ ਕਰ ਦਿਓ। ਸਭ ਨੇ ਤਾਂ ਵੇਖ ਹੀ ਲਈ ਹੈ।',
      'ਫ਼ਾਰਵਰਡ ਨਾ ਕਰੋ, ਅਤੇ ਚੁੱਪ ਰਹੋ।',
      'ਗਰੁੱਪ ਵਿੱਚ ਲਿਖੋ ਕਿ ਵੀਡੀਓ ਨਕਲੀ ਹੈ ਅਤੇ ਸਭ ਨੂੰ ਇਸ ਨੂੰ ਡਿਲੀਟ ਕਰਨ ਲਈ ਕਹੋ।',
      'ਕਿਸੇ ਅਧਿਆਪਕ ਜਾਂ ਮਾਪਿਆਂ ਨੂੰ ਦੱਸੋ, ਅਤੇ ਇਕੱਲਿਆਂ ਵਿੱਚ ਮੀਰਾ ਦਾ ਸਾਥ ਦਿਓ।'
    ],
    questions: [
      'ਇਸ ਵੀਡੀਓ ਨਾਲ ਕਿਸ ਦਾ ਨੁਕਸਾਨ ਹੋ ਰਿਹਾ ਹੈ, ਅਤੇ ਕਿਵੇਂ?',
      'ਜੋ ਸਿਰਫ਼ ਨਕਲੀ ਵੀਡੀਓ ਫ਼ਾਰਵਰਡ ਕਰਦਾ ਹੈ, ਕੀ ਉਹ ਵੀ ਜ਼ਿੰਮੇਵਾਰ ਹੈ? ਕਿਉਂ?',
      'ਨਕਲੀ ਵੀਡੀਓ ਬਣਾ ਸਕਣ ਵਾਲੀਆਂ ਐਪਾਂ ਨੂੰ ਕਿਹੜੇ ਨਿਯਮ ਮੰਨਣੇ ਚਾਹੀਦੇ ਹਨ?'
    ],
    consider: [
      'ਡੀਪਫ਼ੇਕ ਕਿਸੇ ਦੀ ਇੱਜ਼ਤ ਅਤੇ ਮਨ ਨੂੰ ਠੇਸ ਪਹੁੰਚਾ ਸਕਦਾ ਹੈ, ਲੋਕਾਂ ਨੂੰ ਸੱਚ ਪਤਾ ਲੱਗਣ ਤੋਂ ਬਾਅਦ ਵੀ।',
      'ਹਰ ਫ਼ਾਰਵਰਡ ਨੁਕਸਾਨ ਨੂੰ ਹੋਰ ਫੈਲਾਉਂਦਾ ਹੈ। ਫ਼ਾਰਵਰਡ ਨਾ ਕਰਨਾ ਮਦਦ ਹੈ; ਸ਼ਿਕਾਇਤ ਕਰਨਾ ਉਸ ਤੋਂ ਵੀ ਵੱਡੀ ਮਦਦ ਹੈ।',
      'ਕਿਸੇ ਨੂੰ ਨੁਕਸਾਨ ਪਹੁੰਚਾਉਣ ਲਈ ਨਕਲੀ ਵੀਡੀਓ ਬਣਾਉਣਾ ਜਾਂ ਫੈਲਾਉਣਾ ਭਾਰਤੀ ਕਾਨੂੰਨ ਵਿੱਚ ਸਜ਼ਾਯੋਗ ਹੋ ਸਕਦਾ ਹੈ। ਅਜਿਹੀਆਂ ਵੀਡੀਓਜ਼ ਦੀ ਸ਼ਿਕਾਇਤ cybercrime.gov.in \'ਤੇ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ।'
    ]
  },
  {
    title: 'AI ਤੁਹਾਡੇ ਲੇਖ ਜਾਂਚੇ',
    story: 'ਇੱਕ ਸਕੂਲ ਦਸਵੀਂ ਜਮਾਤ ਦੇ ਅੰਗਰੇਜ਼ੀ ਲੇਖ AI ਟੂਲ ਨਾਲ ਜਾਂਚਣਾ ਚਾਹੁੰਦਾ ਹੈ। ਇਹ ਤੇਜ਼ ਹੈ ਅਤੇ ਉਸੇ ਵੇਲੇ ਸੁਝਾਅ ਦਿੰਦਾ ਹੈ। ਪਰ ਅਜ਼ਮਾਇਸ਼ ਵਿੱਚ ਇਸ ਨੇ ਔਖੇ ਸ਼ਬਦਾਂ ਨਾਲ ਭਰੇ ਲੰਮੇ ਲੇਖਾਂ ਨੂੰ ਵੱਧ ਅੰਕ ਦਿੱਤੇ। ਜਿਨ੍ਹਾਂ ਵਿਦਿਆਰਥੀਆਂ ਨੇ ਸੌਖੀ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਚੰਗੇ ਵਿਚਾਰ ਲਿਖੇ ਸਨ, ਉਨ੍ਹਾਂ ਵਿੱਚੋਂ ਕੁਝ ਨੂੰ ਘੱਟ ਅੰਕ ਮਿਲੇ।',
    options: [
      'ਸਾਰੀ ਜਾਂਚ AI ਤੋਂ ਕਰਵਾਓ। ਇਸ ਨਾਲ ਅਧਿਆਪਕਾਂ ਦਾ ਬਹੁਤ ਸਮਾਂ ਬਚੇਗਾ।',
      'AI ਸਿਰਫ਼ ਕੱਚੇ ਖਰੜੇ \'ਤੇ ਸੁਝਾਅ ਦੇਵੇ। ਅੰਤਿਮ ਅੰਕ ਅਧਿਆਪਕ ਦੇਣ।',
      'AI ਦੇ ਅੰਕ ਰੱਖੋ, ਪਰ ਕੋਈ ਵੀ ਵਿਦਿਆਰਥੀ ਅਧਿਆਪਕ ਤੋਂ ਦੁਬਾਰਾ ਜਾਂਚ ਕਰਵਾ ਸਕੇ।',
      'ਜਦੋਂ ਤੱਕ ਇਹ ਪਰਖ ਕੇ ਨਿਰਪੱਖ ਸਾਬਤ ਨਾ ਹੋਵੇ, ਇਸ ਨੂੰ ਨਾ ਵਰਤੋ।'
    ],
    questions: [
      'ਜਾਂਚ ਨੂੰ ਨਿਰਪੱਖ ਕੀ ਬਣਾਉਂਦਾ ਹੈ? ਕੀ ਕੋਈ ਮਸ਼ੀਨ ਇਹ ਸਿੱਖ ਸਕਦੀ ਹੈ?',
      'ਕੀ ਵਿਦਿਆਰਥੀਆਂ ਨੂੰ ਦੱਸਣਾ ਚਾਹੀਦਾ ਹੈ ਕਿ ਉਨ੍ਹਾਂ ਦਾ ਕੰਮ AI ਨੇ ਜਾਂਚਿਆ ਹੈ?',
      'ਜੇ AI ਗ਼ਲਤ ਅੰਕ ਦੇਵੇ, ਤਾਂ ਜ਼ਿੰਮੇਵਾਰ ਕੌਣ ਹੈ: ਸਕੂਲ, ਕੰਪਨੀ ਜਾਂ AI?'
    ],
    consider: [
      'AI ਪੁਰਾਣੀਆਂ ਉਦਾਹਰਨਾਂ ਤੋਂ ਸਿੱਖਦੀ ਹੈ। ਜੇ ਉਨ੍ਹਾਂ ਉਦਾਹਰਨਾਂ ਵਿੱਚ ਲੰਮੇ ਸ਼ਬਦਾਂ ਨੂੰ ਇਨਾਮ ਮਿਲਿਆ ਸੀ, ਤਾਂ AI ਵੀ ਉਹੀ ਆਦਤ ਫੜ ਲੈਂਦੀ ਹੈ।',
      'ਪਾਰਦਰਸ਼ਤਾ ਦਾ ਮਤਲਬ ਹੈ ਕਿ ਵਿਦਿਆਰਥੀ ਜਾਣਨ ਕਿ ਅੰਕ ਕਿਵੇਂ ਮਿਲੇ ਅਤੇ ਦੁਬਾਰਾ ਜਾਂਚ ਮੰਗ ਸਕਣ।',
      'ਇਮਤਿਹਾਨ ਦੇ ਅੰਕਾਂ ਵਰਗੇ ਵੱਡੇ ਫ਼ੈਸਲਿਆਂ ਦੀ ਜ਼ਿੰਮੇਵਾਰੀ ਕਿਸੇ ਇਨਸਾਨ ਕੋਲ ਹੀ ਰਹਿਣੀ ਚਾਹੀਦੀ ਹੈ।'
    ]
  },
  {
    title: 'ਚਿਹਰਾ ਵੇਖ ਕੇ ਹਾਜ਼ਰੀ',
    story: 'ਇੱਕ ਕਾਲਜ ਗੇਟ \'ਤੇ ਅਜਿਹਾ ਕੈਮਰਾ ਲਾਉਣਾ ਚਾਹੁੰਦਾ ਹੈ ਜੋ ਹਰ ਵਿਦਿਆਰਥੀ ਦਾ ਚਿਹਰਾ ਪਛਾਣ ਕੇ ਹਾਜ਼ਰੀ ਲਾਵੇ। ਇਸ ਨਾਲ ਹਰ ਪੀਰੀਅਡ ਦਾ ਸਮਾਂ ਬਚੇਗਾ ਅਤੇ ਪ੍ਰੌਕਸੀ ਹਾਜ਼ਰੀ ਰੁਕੇਗੀ। ਚਿਹਰਿਆਂ ਦੀਆਂ ਫ਼ੋਟੋਆਂ ਸਿਸਟਮ ਚਲਾਉਣ ਵਾਲੀ ਕੰਪਨੀ ਕੋਲ ਰਹਿਣਗੀਆਂ। ਕੁਝ ਵਿਦਿਆਰਥੀ ਕਹਿੰਦੇ ਹਨ ਕਿ ਘੱਟ ਰੌਸ਼ਨੀ ਵਿੱਚ ਇਹ ਅਕਸਰ ਉਨ੍ਹਾਂ ਨੂੰ ਪਛਾਣ ਨਹੀਂ ਪਾਉਂਦਾ।',
    options: [
      'ਲਾ ਦਿਓ। ਇਹ ਤੇਜ਼ ਹੈ ਅਤੇ ਪ੍ਰੌਕਸੀ ਹਾਜ਼ਰੀ ਰੋਕਦਾ ਹੈ।',
      'ਸਿਰਫ਼ ਉਨ੍ਹਾਂ ਲਈ ਵਰਤੋ ਜੋ ਸਹਿਮਤ ਹੋਣ। ਬਾਕੀਆਂ ਲਈ ਕਾਗ਼ਜ਼ ਦਾ ਰਜਿਸਟਰ ਰੱਖੋ।',
      'ਤਾਂ ਹੀ ਵਰਤੋ ਜੇ ਚਿਹਰੇ ਦਾ ਡਾਟਾ ਕਾਲਜ ਕੋਲ ਰਹੇ ਅਤੇ ਕੋਰਸ ਤੋਂ ਬਾਅਦ ਮਿਟਾ ਦਿੱਤਾ ਜਾਵੇ।',
      'ਨਾ ਵਰਤੋ। ਨਾਂ ਬੋਲ ਕੇ ਹਾਜ਼ਰੀ ਲਾਉਣਾ ਕਾਫ਼ੀ ਹੈ।'
    ],
    questions: [
      'ਕੀ ਤੁਹਾਡਾ ਚਿਹਰਾ ਨਿੱਜੀ ਡਾਟਾ ਹੈ? ਉਸ \'ਤੇ ਕਿਸ ਦਾ ਕਾਬੂ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ?',
      'ਜੇ ਇਹ ਚਿਹਰੇ ਦਾ ਡਾਟਾ ਲੀਕ ਹੋ ਜਾਵੇ ਜਾਂ ਗ਼ਲਤ ਵਰਤਿਆ ਜਾਵੇ, ਤਾਂ ਕੀ ਹੋ ਸਕਦਾ ਹੈ?',
      'ਜੇ ਸਿਸਟਮ ਕੁਝ ਵਿਦਿਆਰਥੀਆਂ ਨਾਲ ਵੱਧ ਗ਼ਲਤੀਆਂ ਕਰੇ, ਤਾਂ ਕੀ ਇਹ ਫਿਰ ਵੀ ਨਿਰਪੱਖ ਹੈ?'
    ],
    consider: [
      'ਚਿਹਰੇ ਦਾ ਡਾਟਾ ਬਾਇਓਮੀਟ੍ਰਿਕ ਡਾਟਾ ਹੈ। ਲੀਕ ਹੋ ਜਾਵੇ ਤਾਂ ਪਾਸਵਰਡ ਵਾਂਗ ਤੁਸੀਂ ਆਪਣਾ ਚਿਹਰਾ ਨਹੀਂ ਬਦਲ ਸਕਦੇ।',
      'ਭਾਰਤ ਦਾ ਡਿਜੀਟਲ ਨਿੱਜੀ ਡਾਟਾ ਸੁਰੱਖਿਆ ਐਕਟ, 2023 ਕਹਿੰਦਾ ਹੈ ਕਿ ਲੋਕਾਂ ਨੂੰ ਦੱਸਿਆ ਜਾਵੇ ਕਿ ਉਨ੍ਹਾਂ ਦਾ ਡਾਟਾ ਕਿਉਂ ਲਿਆ ਜਾ ਰਿਹਾ ਹੈ, ਅਤੇ ਆਮ ਤੌਰ \'ਤੇ ਉਨ੍ਹਾਂ ਦੀ ਸਹਿਮਤੀ ਜ਼ਰੂਰੀ ਹੈ।',
      'ਘੱਟ ਰੌਸ਼ਨੀ ਵਿੱਚ ਜਾਂ ਕੁਝ ਚਿਹਰਿਆਂ ਲਈ ਫ਼ੇਸ ਰਿਕੌਗਨੀਸ਼ਨ ਵੱਧ ਗ਼ਲਤੀਆਂ ਕਰ ਸਕਦੀ ਹੈ, ਜਿਸ ਨਾਲ ਵਿਦਿਆਰਥੀ ਗ਼ਲਤੀ ਨਾਲ ਗ਼ੈਰਹਾਜ਼ਰ ਲੱਗ ਸਕਦੇ ਹਨ।'
    ]
  },
  {
    title: 'ਘਰ ਦਾ ਕੰਮ AI ਨੇ ਕੀਤਾ',
    story: 'ਅਰਜੁਨ ਦਾ ਵਿਗਿਆਨ ਪ੍ਰੋਜੈਕਟ ਕੱਲ੍ਹ ਜਮ੍ਹਾਂ ਕਰਨਾ ਹੈ। ਉਹ ਵਿਸ਼ਾ AI ਚੈਟਬੌਟ ਵਿੱਚ ਲਿਖਦਾ ਹੈ, ਅਤੇ ਇੱਕ ਮਿੰਟ ਵਿੱਚ ਉਹ ਇੱਕ ਸਾਫ਼-ਸੁਥਰੀ, ਪੂਰੀ ਰਿਪੋਰਟ ਲਿਖ ਦਿੰਦਾ ਹੈ। ਉਹ ਇਸ ਨੂੰ ਆਪਣਾ ਕੰਮ ਦੱਸ ਕੇ ਜਮ੍ਹਾਂ ਕਰ ਸਕਦਾ ਹੈ। ਉਸ ਦਾ ਦੋਸਤ ਕਹਿੰਦਾ ਹੈ, "ਸਾਰੇ ਇਹੀ ਕਰਦੇ ਹਨ।" ਅਧਿਆਪਕ ਨੇ AI ਵਰਤਣ ਬਾਰੇ ਕੁਝ ਨਹੀਂ ਕਿਹਾ।',
    options: [
      'AI ਦੀ ਰਿਪੋਰਟ ਜਿਵੇਂ ਹੈ ਉਵੇਂ ਜਮ੍ਹਾਂ ਕਰ ਦੇਵੇ। ਕਿਸੇ ਨੂੰ ਪਤਾ ਨਹੀਂ ਲੱਗੇਗਾ।',
      'AI ਤੋਂ ਵਿਸ਼ਾ ਸਮਝੇ, ਫਿਰ ਰਿਪੋਰਟ ਆਪ ਲਿਖੇ।',
      'AI ਦੀ ਰਿਪੋਰਟ ਦੇ ਕੁਝ ਹਿੱਸੇ ਵਰਤੇ, ਪਰ ਸਾਫ਼ ਦੱਸੇ ਕਿ AI ਨੇ ਮਦਦ ਕੀਤੀ।',
      'ਅਧਿਆਪਕ ਤੋਂ ਪੁੱਛੇ ਕਿ AI ਦੀ ਕਿਹੋ ਜਿਹੀ ਮਦਦ ਠੀਕ ਹੈ।'
    ],
    questions: [
      'ਮਦਦ ਲੈਣ ਅਤੇ ਨਕਲ ਕਰਨ ਵਿੱਚ ਕੀ ਫ਼ਰਕ ਹੈ?',
      'ਜੇ ਸਾਰਾ ਸੋਚਣ ਦਾ ਕੰਮ AI ਕਰੇ, ਤਾਂ ਅਰਜੁਨ ਕੀ ਗੁਆਉਂਦਾ ਹੈ?',
      'ਤੁਹਾਡੀ ਜਮਾਤ ਵਿੱਚ ਘਰ ਦੇ ਕੰਮ ਲਈ AI ਦਾ ਨਿਰਪੱਖ ਨਿਯਮ ਕੀ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ?'
    ],
    consider: [
      'ਘਰ ਦਾ ਕੰਮ ਅਭਿਆਸ ਹੈ। ਜੇ AI ਇਹ ਕਰੇ, ਤਾਂ ਅੰਕ ਵਧ ਸਕਦੇ ਹਨ, ਪਰ ਸਿੱਖਣਾ ਨਹੀਂ ਵਧਦਾ।',
      'AI ਚੈਟਬੌਟ ਅਜਿਹੀਆਂ ਗੱਲਾਂ ਘੜ ਸਕਦੇ ਹਨ ਜੋ ਸਹੀ ਲੱਗਦੀਆਂ ਹਨ, ਇਸ ਲਈ ਉਨ੍ਹਾਂ ਦੇ ਜਵਾਬ ਹਮੇਸ਼ਾ ਜਾਂਚਣੇ ਚਾਹੀਦੇ ਹਨ।',
      'AI ਕਿਵੇਂ ਵਰਤੀ, ਇਹ ਈਮਾਨਦਾਰੀ ਨਾਲ ਦੱਸਣ ਨਾਲ ਭਰੋਸਾ ਬਣਦਾ ਹੈ। ਕਈ ਸਕੂਲ ਹੁਣ AI ਬਾਰੇ ਸਾਫ਼ ਨਿਯਮ ਬਣਾ ਰਹੇ ਹਨ।'
    ]
  },
  {
    title: 'ਪੱਖਪਾਤ ਕਰਨ ਵਾਲੀ ਭਰਤੀ AI',
    story: 'ਇੱਕ ਵੱਡੀ ਕੰਪਨੀ ਹਜ਼ਾਰਾਂ ਨੌਕਰੀ ਦੀਆਂ ਅਰਜ਼ੀਆਂ ਛਾਂਟਣ ਲਈ AI ਵਰਤਦੀ ਹੈ। AI ਨੇ ਕੰਪਨੀ ਦੀਆਂ ਪਿਛਲੇ 10 ਸਾਲਾਂ ਦੀਆਂ ਭਰਤੀਆਂ ਤੋਂ ਸਿੱਖਿਆ, ਜਦੋਂ ਕੰਪਨੀ ਜ਼ਿਆਦਾਤਰ ਵੱਡੇ ਸ਼ਹਿਰਾਂ ਦੇ ਮਰਦਾਂ ਨੂੰ ਹੀ ਰੱਖਦੀ ਸੀ। ਹੁਣ ਇਹ ਔਰਤਾਂ ਅਤੇ ਛੋਟੇ ਕਸਬਿਆਂ ਦੇ ਲੋਕਾਂ ਨੂੰ ਘੱਟ ਅੰਕ ਦਿੰਦੀ ਹੈ, ਭਾਵੇਂ ਉਨ੍ਹਾਂ ਦਾ ਹੁਨਰ ਓਨਾ ਹੀ ਹੋਵੇ।',
    options: [
      'ਇਸ ਨੂੰ ਵਰਤਦੇ ਰਹੋ। ਇਹ ਤੇਜ਼ ਹੈ, ਅਤੇ ਕੰਪਨੀ ਜਿਸ ਨੂੰ ਚਾਹੇ ਰੱਖ ਸਕਦੀ ਹੈ।',
      'ਟ੍ਰੇਨਿੰਗ ਡਾਟਾ ਠੀਕ ਕਰੋ ਅਤੇ ਦੁਬਾਰਾ ਵਰਤਣ ਤੋਂ ਪਹਿਲਾਂ AI ਨੂੰ ਪੱਖਪਾਤ ਲਈ ਪਰਖੋ।',
      'AI ਇੱਕ ਛੋਟੀ ਸੂਚੀ ਬਣਾਵੇ, ਪਰ ਅੰਤਿਮ ਚੋਣ ਇਨਸਾਨ ਕਰਨ ਅਤੇ ਰੱਦ ਹੋਈਆਂ ਅਰਜ਼ੀਆਂ ਵੀ ਵੇਖਣ।',
      'ਭਰਤੀ ਵਿੱਚ AI ਵਰਤਣਾ ਬੰਦ ਕਰੋ। ਲੋਕਾਂ ਦਾ ਕਰੀਅਰ ਬਹੁਤ ਅਹਿਮ ਹੈ।'
    ],
    questions: [
      'ਜਦੋਂ ਕਿਸੇ ਨੇ ਨਹੀਂ ਕਿਹਾ, ਤਾਂ AI ਪੱਖਪਾਤੀ ਕਿਵੇਂ ਬਣ ਗਈ?',
      'ਕੀ ਲੋਕਾਂ ਨੂੰ ਦੱਸਣਾ ਚਾਹੀਦਾ ਹੈ ਕਿ ਉਨ੍ਹਾਂ ਦੀ ਅਰਜ਼ੀ AI ਨੇ ਰੱਦ ਕੀਤੀ?',
      'ਭਰਤੀ ਵਾਲੀ AI ਨਿਰਪੱਖ ਹੈ, ਇਹ ਕੌਣ ਜਾਂਚੇ: ਕੰਪਨੀ, ਸਰਕਾਰ ਜਾਂ ਕੋਈ ਹੋਰ?'
    ],
    consider: [
      'AI ਪੁਰਾਣੇ ਡਾਟਾ ਤੋਂ ਪੈਟਰਨ ਸਿੱਖਦੀ ਹੈ, ਪੁਰਾਣੀਆਂ ਗ਼ਲਤ ਆਦਤਾਂ ਸਮੇਤ। ਇਸ ਨੂੰ ਪੱਖਪਾਤ (ਬਾਇਸ) ਕਹਿੰਦੇ ਹਨ।',
      'ਵੱਖ-ਵੱਖ ਸਮੂਹਾਂ (ਔਰਤਾਂ ਅਤੇ ਮਰਦ, ਸ਼ਹਿਰ ਅਤੇ ਕਸਬੇ) ਦੇ ਨਤੀਜਿਆਂ ਦੀ ਤੁਲਨਾ ਕਰਨ ਨਾਲ ਲੁਕਿਆ ਪੱਖਪਾਤ ਦਿਸ ਸਕਦਾ ਹੈ।',
      'ਲੋਕਾਂ ਨੂੰ ਪਤਾ ਲੱਗ ਸਕਣਾ ਚਾਹੀਦਾ ਹੈ ਕਿ ਉਨ੍ਹਾਂ ਨੂੰ ਕਿਉਂ ਰੱਦ ਕੀਤਾ ਗਿਆ, ਅਤੇ ਉਹ ਕਿਸੇ ਇਨਸਾਨ ਨੂੰ ਦੁਬਾਰਾ ਵੇਖਣ ਲਈ ਕਹਿ ਸਕਣ।'
    ]
  },
  {
    title: 'ਸੈਲਫ਼-ਡਰਾਈਵਿੰਗ ਕਾਰ ਦਾ ਫ਼ੈਸਲਾ',
    story: 'ਬੈਂਗਲੁਰੂ ਦੀ ਭੀੜ ਵਾਲੀ ਸੜਕ \'ਤੇ ਇੱਕ ਸੈਲਫ਼-ਡਰਾਈਵਿੰਗ ਕਾਰ ਚੱਲ ਰਹੀ ਹੈ। ਅਚਾਨਕ ਇੱਕ ਬੱਚਾ ਸੜਕ \'ਤੇ ਭੱਜ ਆਉਂਦਾ ਹੈ। ਕਾਰ ਸਮੇਂ ਸਿਰ ਰੁਕ ਨਹੀਂ ਸਕਦੀ। ਉਹ ਆਪਣੀ ਲੇਨ ਵਿੱਚ ਰਹਿ ਸਕਦੀ ਹੈ, ਜਾਂ ਫ਼ੁੱਟਪਾਥ ਵੱਲ ਮੁੜ ਸਕਦੀ ਹੈ ਜਿੱਥੇ ਦੋ ਲੋਕ ਤੁਰ ਰਹੇ ਹਨ। ਦੋਵਾਂ ਵਿੱਚ ਕਿਸੇ ਨਾ ਕਿਸੇ ਨੂੰ ਖ਼ਤਰਾ ਹੈ। ਇੰਜੀਨੀਅਰਾਂ ਨੇ ਪਹਿਲਾਂ ਹੀ ਤੈਅ ਕਰਨਾ ਹੈ ਕਿ ਕਾਰ ਕੀ ਕਰੇ।',
    options: [
      'ਹਮੇਸ਼ਾ ਪਹਿਲਾਂ ਕਾਰ ਦੇ ਅੰਦਰ ਬੈਠੇ ਲੋਕਾਂ ਨੂੰ ਬਚਾਵੇ।',
      'ਹਮੇਸ਼ਾ ਉਹ ਰਾਹ ਚੁਣੇ ਜਿਸ ਵਿੱਚ ਸਭ ਤੋਂ ਘੱਟ ਲੋਕਾਂ ਨੂੰ ਖ਼ਤਰਾ ਹੋਵੇ।',
      'ਹਮੇਸ਼ਾ ਜ਼ੋਰ ਨਾਲ ਬ੍ਰੇਕ ਲਾਵੇ ਅਤੇ ਆਪਣੀ ਲੇਨ ਵਿੱਚ ਰਹੇ। ਕਦੇ ਫ਼ੁੱਟਪਾਥ ਵੱਲ ਨਾ ਮੁੜੇ।',
      'ਜਦੋਂ ਤੱਕ ਅਜਿਹੀਆਂ ਹਾਲਤਾਂ ਤੋਂ ਬਚ ਨਾ ਸਕਣ, ਅਜਿਹੀਆਂ ਕਾਰਾਂ ਨੂੰ ਸੜਕਾਂ \'ਤੇ ਨਾ ਆਉਣ ਦਿੱਤਾ ਜਾਵੇ।'
    ],
    questions: [
      'ਇਹ ਨਿਯਮ ਕੌਣ ਤੈਅ ਕਰੇ: ਇੰਜੀਨੀਅਰ, ਸਰਕਾਰ ਜਾਂ ਲੋਕ?',
      'ਜੇ ਕਾਰ ਨਾਲ ਹਾਦਸਾ ਹੋਵੇ, ਤਾਂ ਜ਼ਿੰਮੇਵਾਰ ਕੌਣ ਹੈ: ਮਾਲਕ, ਕੰਪਨੀ ਜਾਂ ਪ੍ਰੋਗਰਾਮਰ?',
      'ਕੀ ਖ਼ਰੀਦਦਾਰਾਂ ਨੂੰ ਪਤਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ ਕਿ ਉਨ੍ਹਾਂ ਦੀ ਕਾਰ ਕਿਹੜੇ ਨਿਯਮ ਮੰਨਦੀ ਹੈ?'
    ],
    consider: [
      'ਸੈਲਫ਼-ਡਰਾਈਵਿੰਗ ਕਾਰਾਂ ਇਸ ਤਰ੍ਹਾਂ ਬਣਾਈਆਂ ਜਾਂਦੀਆਂ ਹਨ ਕਿ ਉਹ ਪਹਿਲਾਂ ਹੀ ਹੌਲੀ ਹੋ ਕੇ ਅਜਿਹੇ ਪਲ ਟਾਲ ਦੇਣ, ਪਰ ਕੋਈ ਵੀ ਸਿਸਟਮ ਪੂਰਾ ਸਹੀ ਨਹੀਂ ਹੁੰਦਾ।',
      'ਇਹ ਨਿਯਮ ਨੈਤਿਕ ਫ਼ੈਸਲੇ ਹਨ, ਇਸ ਲਈ ਸਿਰਫ਼ ਇੰਜੀਨੀਅਰ ਨਹੀਂ, ਬਹੁਤ ਸਾਰੇ ਲੋਕਾਂ ਦੀ ਰਾਏ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ।',
      'ਅਜਿਹੀਆਂ ਕਾਰਾਂ ਨੂੰ ਇਜਾਜ਼ਤ ਦੇਣ ਤੋਂ ਪਹਿਲਾਂ ਸਾਫ਼ ਨਿਯਮ ਚਾਹੀਦੇ ਹਨ ਕਿ ਹਾਦਸੇ ਦੀ ਜ਼ਿੰਮੇਵਾਰੀ ਕਿਸ ਦੀ ਹੋਵੇਗੀ।'
    ]
  },
  {
    title: 'ਮੁਫ਼ਤ ਹੈਲਥ ਐਪ ਡਾਟਾ ਵੰਡਦੀ ਹੈ',
    story: 'ਪ੍ਰਿਆ ਇੱਕ ਮੁਫ਼ਤ ਫ਼ਿਟਨੈੱਸ ਐਪ ਵਰਤਦੀ ਹੈ ਜੋ ਉਸ ਦੇ ਕਦਮ, ਨੀਂਦ ਅਤੇ ਧੜਕਣ ਗਿਣਦੀ ਹੈ। ਇਹ ਉਸ ਦਾ ਭਾਰ, ਖਾਣ-ਪੀਣ ਅਤੇ ਮੂਡ ਵੀ ਪੁੱਛਦੀ ਹੈ। ਇਸ ਦੀਆਂ ਲੰਮੀਆਂ ਸ਼ਰਤਾਂ ਵਿੱਚ ਕਿਤੇ ਡੂੰਘੇ ਲਿਖਿਆ ਹੈ ਕਿ ਕੰਪਨੀ ਇਹ ਡਾਟਾ "ਪਾਰਟਨਰਾਂ" ਨਾਲ ਸਾਂਝਾ ਕਰ ਸਕਦੀ ਹੈ। ਜਲਦੀ ਹੀ ਪ੍ਰਿਆ ਨੂੰ ਭਾਰ ਘਟਾਉਣ ਵਾਲੀਆਂ ਚੀਜ਼ਾਂ ਅਤੇ ਹੈਲਥ ਬੀਮੇ ਦੇ ਇਸ਼ਤਿਹਾਰ ਦਿਸਣ ਲੱਗਦੇ ਹਨ।',
    options: [
      'ਠੀਕ ਹੈ। ਐਪ ਮੁਫ਼ਤ ਹੈ, ਅਤੇ ਉਸ ਨੇ ਸ਼ਰਤਾਂ ਮੰਨੀਆਂ ਸਨ।',
      'ਐਪ ਰੱਖੇ, ਪਰ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਡਾਟਾ ਸਾਂਝਾ ਕਰਨਾ ਬੰਦ ਕਰ ਦੇਵੇ।',
      'ਐਪ ਹਟਾ ਦੇਵੇ ਅਤੇ ਅਜਿਹੀ ਐਪ ਚੁਣੇ ਜੋ ਡਾਟਾ ਨਾ ਵੰਡੇ।',
      'ਐਪ ਦੀ ਸ਼ਿਕਾਇਤ ਕਰੇ। ਸਿਹਤ ਦਾ ਡਾਟਾ ਵੰਡਣ ਲਈ ਕੰਪਨੀਆਂ ਨੂੰ ਸਾਫ਼ ਇਜਾਜ਼ਤ ਲੈਣੀ ਚਾਹੀਦੀ ਹੈ।'
    ],
    questions: [
      'ਜੇ ਐਪ ਮੁਫ਼ਤ ਹੈ, ਤਾਂ ਕੰਪਨੀ ਪੈਸੇ ਕਿਵੇਂ ਕਮਾਉਂਦੀ ਹੈ?',
      'ਲੰਮੇ ਦਸਤਾਵੇਜ਼ \'ਤੇ "ਮੈਂ ਸਹਿਮਤ ਹਾਂ" ਦਬਾਉਣਾ ਕੀ ਸੱਚੀ ਸਹਿਮਤੀ ਹੈ?',
      'ਸਿਹਤ ਦੀ ਕਿਹੜੀ ਜਾਣਕਾਰੀ ਪੁੱਛੇ ਬਿਨਾਂ ਕਦੇ ਨਹੀਂ ਵੰਡਣੀ ਚਾਹੀਦੀ?'
    ],
    consider: [
      'ਕਈ ਮੁਫ਼ਤ ਐਪਾਂ ਤੁਹਾਡੇ ਡਾਟਾ ਅਤੇ ਇਸ਼ਤਿਹਾਰਾਂ ਤੋਂ ਕਮਾਉਂਦੀਆਂ ਹਨ। ਜੇ ਤੁਸੀਂ ਪੈਸਿਆਂ ਨਾਲ ਕੀਮਤ ਨਹੀਂ ਦੇ ਰਹੇ, ਤਾਂ ਸ਼ਾਇਦ ਆਪਣੇ ਡਾਟਾ ਨਾਲ ਦੇ ਰਹੇ ਹੋ।',
      'ਸਿਹਤ ਦਾ ਡਾਟਾ ਬਹੁਤ ਨਿੱਜੀ ਹੁੰਦਾ ਹੈ। ਇਸ ਦਾ ਅਸਰ ਬੀਮੇ, ਨੌਕਰੀ ਜਾਂ ਲੋਕਾਂ ਦੇ ਤੁਹਾਡੇ ਨਾਲ ਵਿਹਾਰ \'ਤੇ ਪੈ ਸਕਦਾ ਹੈ।',
      'ਚੰਗੀ ਐਪ ਡਾਟਾ ਵੰਡਣ ਤੋਂ ਪਹਿਲਾਂ ਸੌਖੇ ਸ਼ਬਦਾਂ ਵਿੱਚ ਸਾਫ਼ ਪੁੱਛਦੀ ਹੈ। ਐਪ ਦੀਆਂ ਇਜਾਜ਼ਤਾਂ ਅਤੇ ਪ੍ਰਾਈਵੇਸੀ ਸੈਟਿੰਗਾਂ ਜਾਂਚੋ।'
    ]
  },
  {
    title: 'AI ਤਸਵੀਰ ਨੇ ਮੁਕਾਬਲਾ ਜਿੱਤਿਆ',
    story: 'ਜ਼ਿਲ੍ਹਾ ਚਿੱਤਰਕਾਰੀ ਮੁਕਾਬਲੇ ਦਾ ਵਿਸ਼ਾ ਹੈ "2047 ਵਿੱਚ ਮੇਰਾ ਭਾਰਤ"। ਇੱਕ ਸੋਹਣੀ, ਬਾਰੀਕ ਤਸਵੀਰ ਪਹਿਲਾ ਇਨਾਮ ਜਿੱਤਦੀ ਹੈ। ਬਾਅਦ ਵਿੱਚ ਸਭ ਨੂੰ ਪਤਾ ਲੱਗਦਾ ਹੈ ਕਿ ਵਿਦਿਆਰਥੀ ਨੇ ਕੁਝ ਸਤਰਾਂ ਟਾਈਪ ਕਰਕੇ ਇਸ ਨੂੰ AI ਇਮੇਜ ਜਨਰੇਟਰ ਨਾਲ ਬਣਾਇਆ ਸੀ। ਨਿਯਮਾਂ ਵਿੱਚ AI ਦਾ ਜ਼ਿਕਰ ਨਹੀਂ ਸੀ। ਬਾਕੀ ਵਿਦਿਆਰਥੀਆਂ ਨੇ ਹਫ਼ਤਿਆਂ ਤੱਕ ਹੱਥ ਨਾਲ ਤਸਵੀਰਾਂ ਬਣਾਈਆਂ ਸਨ।',
    options: [
      'ਇਨਾਮ ਰਹਿਣ ਦਿਓ। ਨਿਯਮਾਂ ਵਿੱਚ AI \'ਤੇ ਪਾਬੰਦੀ ਨਹੀਂ ਸੀ।',
      'ਇਨਾਮ ਵਾਪਸ ਲਓ ਅਤੇ ਹੱਥ ਨਾਲ ਬਣੀ ਸਭ ਤੋਂ ਵਧੀਆ ਤਸਵੀਰ ਨੂੰ ਦਿਓ।',
      'ਜੇਤੂ ਇਨਾਮ ਰੱਖੇ, ਅਤੇ ਅਗਲੇ ਸਾਲ ਤੋਂ AI ਤਸਵੀਰਾਂ ਦੀ ਵੱਖਰੀ ਸ਼੍ਰੇਣੀ ਬਣੇ।',
      'ਵਿਦਿਆਰਥੀ ਨੂੰ ਜੱਜਾਂ ਨੂੰ ਦੱਸਣਾ ਚਾਹੀਦਾ ਸੀ ਕਿ AI ਵਰਤੀ ਗਈ।'
    ],
    questions: [
      'ਕੀ ਪ੍ਰੌਂਪਟ ਟਾਈਪ ਕਰਨਾ ਤਸਵੀਰ ਬਣਾਉਣ ਵਰਗਾ ਹੀ ਹੈ? ਇਸ ਵਿੱਚ ਕਿਹੜੇ ਹੁਨਰ ਲੱਗਦੇ ਹਨ?',
      'ਕੀ AI ਤਸਵੀਰਾਂ ਦੀ ਤੁਲਨਾ ਹੱਥ ਨਾਲ ਬਣੀਆਂ ਤਸਵੀਰਾਂ ਨਾਲ ਕਰਨਾ ਨਿਰਪੱਖ ਹੈ?',
      'AI ਇਮੇਜ ਟੂਲਾਂ ਨੇ ਲੱਖਾਂ ਕਲਾਕਾਰਾਂ ਦੀਆਂ ਤਸਵੀਰਾਂ ਤੋਂ ਸਿੱਖਿਆ ਹੈ। ਕੀ ਉਨ੍ਹਾਂ ਕਲਾਕਾਰਾਂ ਨੂੰ ਸਿਹਰਾ ਮਿਲਣਾ ਚਾਹੀਦਾ ਹੈ?'
    ],
    consider: [
      'ਕੋਈ ਚੀਜ਼ ਕਿਵੇਂ ਬਣੀ, ਇਹ ਈਮਾਨਦਾਰੀ ਨਾਲ ਦੱਸਣਾ ਜ਼ਰੂਰੀ ਹੈ, ਭਾਵੇਂ ਨਿਯਮ ਸਾਫ਼ ਨਾ ਹੋਣ।',
      'ਨਿਰਪੱਖ ਮੁਕਾਬਲਾ ਇੱਕੋ ਜਿਹੇ ਹੁਨਰਾਂ ਦੀ ਤੁਲਨਾ ਕਰਦਾ ਹੈ। AI ਬਾਰੇ ਸਾਫ਼ ਨਿਯਮ ਸਭ ਦੀ ਮਦਦ ਕਰਦੇ ਹਨ।',
      'AI ਕਲਾ ਰਚਨਾਤਮਕ ਹੋ ਸਕਦੀ ਹੈ, ਪਰ AI ਦੂਜਿਆਂ ਦੇ ਕੰਮ ਤੋਂ ਸਿੱਖਦੀ ਹੈ, ਅਕਸਰ ਉਨ੍ਹਾਂ ਨੂੰ ਪੁੱਛੇ ਬਿਨਾਂ।'
    ]
  },
  {
    title: 'ਸਕੂਲ ਦੇ ਵਰਾਂਡਿਆਂ ਵਿੱਚ AI ਕੈਮਰੇ',
    story: 'ਸਕੂਲ ਵਿੱਚ ਇੱਕ ਲੜਾਈ ਤੋਂ ਬਾਅਦ ਪ੍ਰਿੰਸੀਪਲ ਸਾਰੇ ਵਰਾਂਡਿਆਂ ਵਿੱਚ AI ਕੈਮਰੇ ਲਾਉਣ ਬਾਰੇ ਸੋਚ ਰਹੇ ਹਨ। AI ਭੱਜਣਾ ਜਾਂ ਟੋਲੀਆਂ ਦਾ ਇਕੱਠਾ ਹੋਣਾ ਵਰਗਾ "ਅਸਾਧਾਰਨ ਵਿਹਾਰ" ਪਛਾਣ ਕੇ ਅਧਿਆਪਕਾਂ ਨੂੰ ਸੂਚਨਾ ਦੇਵੇਗੀ। ਕਈ ਮਾਪਿਆਂ ਨੂੰ ਲੱਗਦਾ ਹੈ ਕਿ ਬੱਚੇ ਵੱਧ ਸੁਰੱਖਿਅਤ ਰਹਿਣਗੇ। ਕੁਝ ਵਿਦਿਆਰਥੀਆਂ ਨੂੰ ਲੱਗਦਾ ਹੈ ਕਿ ਉਨ੍ਹਾਂ \'ਤੇ ਹਰ ਵੇਲੇ ਨਜ਼ਰ ਰੱਖੀ ਜਾ ਰਹੀ ਹੈ, ਅਤੇ ਡਰ ਹੈ ਕਿ AI ਆਮ ਖੇਡ ਨੂੰ ਵੀ ਗੜਬੜ ਦੱਸ ਦੇਵੇਗੀ।',
    options: [
      'ਹਰ ਥਾਂ ਕੈਮਰੇ ਲਾਓ। ਸੁਰੱਖਿਆ ਸਭ ਤੋਂ ਪਹਿਲਾਂ।',
      'ਕੈਮਰੇ ਸਿਰਫ਼ ਗੇਟਾਂ ਅਤੇ ਪੌੜੀਆਂ \'ਤੇ ਲਾਓ, ਜਮਾਤਾਂ ਦੇ ਅੰਦਰ ਕਦੇ ਨਹੀਂ।',
      'ਕੈਮਰੇ ਲਾਓ, ਪਰ ਸਭ ਨੂੰ ਦੱਸੋ ਕਿ ਕੀ ਰਿਕਾਰਡ ਹੁੰਦਾ ਹੈ, ਕੌਣ ਵੇਖ ਸਕਦਾ ਹੈ ਅਤੇ ਕਦੋਂ ਮਿਟਾਇਆ ਜਾਂਦਾ ਹੈ।',
      'AI ਕੈਮਰੇ ਨਹੀਂ। ਵੱਧ ਅਧਿਆਪਕਾਂ ਦੀ ਡਿਊਟੀ ਲਾਓ ਅਤੇ ਵਿਦਿਆਰਥੀਆਂ ਨਾਲ ਗੱਲ ਕਰੋ।'
    ],
    questions: [
      'ਜੇ ਕੋਈ ਕੈਮਰਾ ਹਰ ਵੇਲੇ ਤੁਹਾਡੇ \'ਤੇ ਨਜ਼ਰ ਰੱਖੇ, ਤਾਂ ਤੁਹਾਨੂੰ ਕਿਵੇਂ ਲੱਗੇਗਾ?',
      '"ਅਸਾਧਾਰਨ ਵਿਹਾਰ" ਕਿਸ ਨੂੰ ਕਹਾਂਗੇ? ਇਹ ਕੌਣ ਤੈਅ ਕਰੇਗਾ?',
      'ਵੀਡੀਓਜ਼ ਕੌਣ ਵੇਖੇ, ਅਤੇ ਉਨ੍ਹਾਂ ਨੂੰ ਕਿੰਨਾ ਚਿਰ ਰੱਖਿਆ ਜਾਵੇ?'
    ],
    consider: [
      'ਕੈਮਰੇ ਇਹ ਪਤਾ ਲਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੇ ਹਨ ਕਿ ਕੀ ਹੋਇਆ, ਪਰ ਇਨ੍ਹਾਂ ਨਾਲ ਲੋਕਾਂ ਨੂੰ ਇਹ ਵੀ ਲੱਗ ਸਕਦਾ ਹੈ ਕਿ ਉਨ੍ਹਾਂ \'ਤੇ ਭਰੋਸਾ ਨਹੀਂ ਕੀਤਾ ਜਾਂਦਾ।',
      'AI ਜਮਾਤ ਵੱਲ ਭੱਜਣ ਵਰਗੀਆਂ ਆਮ ਗੱਲਾਂ ਨੂੰ ਵੀ ਗ਼ਲਤੀ ਨਾਲ ਗੜਬੜ ਮੰਨ ਸਕਦੀ ਹੈ, ਇਸ ਲਈ ਕੋਈ ਕਦਮ ਚੁੱਕਣ ਤੋਂ ਪਹਿਲਾਂ ਕੋਈ ਇਨਸਾਨ ਜਾਂਚੇ।',
      'ਕੀ ਰਿਕਾਰਡ ਹੋਵੇਗਾ, ਕੌਣ ਵੇਖੇਗਾ ਅਤੇ ਕਦੋਂ ਮਿਟੇਗਾ, ਇਸ ਦੇ ਸਾਫ਼ ਨਿਯਮ ਸੁਰੱਖਿਆ ਅਤੇ ਨਿੱਜਤਾ ਦੋਵਾਂ ਦੀ ਰਾਖੀ ਕਰਦੇ ਹਨ।'
    ]
  },
  {
    title: 'ਮਸ਼ੀਨ ਨੇ ਪਿੰਡ ਦਾ ਕੰਮ ਖੋਹਿਆ',
    story: 'ਪੰਜਾਬ ਦੇ ਇੱਕ ਪਿੰਡ ਵਿੱਚ ਇੱਕ ਕਿਸਾਨ AI ਨਾਲ ਚੱਲਣ ਵਾਲੀ ਸਮਾਰਟ ਵਾਢੀ ਮਸ਼ੀਨ ਖ਼ਰੀਦਦਾ ਹੈ। ਇਹ ਇੱਕ ਦਿਨ ਵਿੱਚ ਉਸ ਦਾ ਕਣਕ ਦਾ ਖੇਤ ਵੱਢ ਦਿੰਦੀ ਹੈ। ਪਹਿਲਾਂ 20 ਮਜ਼ਦੂਰ ਇਹ ਕੰਮ ਇੱਕ ਹਫ਼ਤੇ ਵਿੱਚ ਕਰਦੇ ਸਨ ਅਤੇ ਹਰ ਸੀਜ਼ਨ ਕਮਾਉਂਦੇ ਸਨ। ਕਿਸਾਨ ਦਾ ਸਮਾਂ ਅਤੇ ਪੈਸਾ ਬਚਦਾ ਹੈ, ਪਰ ਰਮੇਸ਼ ਵਰਗੇ ਮਜ਼ਦੂਰਾਂ ਕੋਲ ਹੁਣ ਵਾਢੀ ਵੇਲੇ ਕੋਈ ਕੰਮ ਨਹੀਂ।',
    options: [
      'ਇਹੀ ਤਰੱਕੀ ਹੈ। ਕਿਸਾਨ ਨੂੰ ਮਸ਼ੀਨ ਵਰਤਣੀ ਚਾਹੀਦੀ ਹੈ।',
      'ਮਸ਼ੀਨ ਵਰਤੋ, ਪਰ ਮਜ਼ਦੂਰਾਂ ਨੂੰ ਨਵੇਂ ਹੁਨਰ ਸਿੱਖਣ ਵਿੱਚ ਮਦਦ ਕਰੋ, ਜਿਵੇਂ ਮਸ਼ੀਨ ਚਲਾਉਣਾ ਅਤੇ ਠੀਕ ਕਰਨਾ।',
      'ਮਸ਼ੀਨਾਂ ਕਾਰਨ ਕੰਮ ਗੁਆਉਣ ਵਾਲੇ ਮਜ਼ਦੂਰਾਂ ਦੀ ਸਰਕਾਰ ਮਦਦ ਕਰੇ।',
      'ਮਸ਼ੀਨ ਤੋਂ ਸਿਰਫ਼ ਕੁਝ ਕੰਮ ਕਰਵਾਓ, ਤਾਂ ਜੋ ਕੁਝ ਰੁਜ਼ਗਾਰ ਬਚਿਆ ਰਹੇ।'
    ],
    questions: [
      'ਜਦੋਂ ਮਸ਼ੀਨ ਮਜ਼ਦੂਰਾਂ ਦੀ ਥਾਂ ਲੈਂਦੀ ਹੈ, ਤਾਂ ਕਿਸ ਦਾ ਫ਼ਾਇਦਾ ਹੁੰਦਾ ਹੈ ਅਤੇ ਕਿਸ ਦਾ ਨੁਕਸਾਨ?',
      'ਕੀ ਨਵੀਂ ਤਕਨੀਕ ਨਵੇਂ ਰੁਜ਼ਗਾਰ ਵੀ ਬਣਾ ਸਕਦੀ ਹੈ? ਕਿਹੜੇ?',
      'ਕੰਮ ਗੁਆਉਣ ਵਾਲੇ ਮਜ਼ਦੂਰਾਂ ਦੀ ਮਦਦ ਕਰਨਾ ਕਿਸ ਦਾ ਫ਼ਰਜ਼ ਹੈ?'
    ],
    consider: [
      'ਮਸ਼ੀਨਾਂ ਔਖੇ ਕੰਮ ਨੂੰ ਤੇਜ਼, ਸੁਰੱਖਿਅਤ ਅਤੇ ਸਸਤਾ ਬਣਾ ਸਕਦੀਆਂ ਹਨ, ਅਤੇ ਕਿਸਾਨਾਂ ਨੂੰ ਵੱਧ ਅਨਾਜ ਉਗਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੀਆਂ ਹਨ।',
      'ਪਰ ਫ਼ਾਇਦਾ ਅਕਸਰ ਕੁਝ ਲੋਕਾਂ ਨੂੰ ਮਿਲਦਾ ਹੈ, ਜਦਕਿ ਦੂਜਿਆਂ ਦੀ ਕਮਾਈ ਚਲੀ ਜਾਂਦੀ ਹੈ।',
      'ਸਿਖਲਾਈ, ਨਵੀਂ ਕਿਸਮ ਦਾ ਕੰਮ ਅਤੇ ਸਹਾਇਤਾ ਯੋਜਨਾਵਾਂ ਲੋਕਾਂ ਨੂੰ ਇਸ ਬਦਲਾਅ ਨਾਲ ਤਾਲਮੇਲ ਬਿਠਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੀਆਂ ਹਨ।'
    ]
  },
  {
    title: 'ਆਵਾਜ਼ ਦੀ ਨਕਲ ਨਾਲ ਠੱਗੀ',
    story: 'ਦੇਰ ਰਾਤ ਦਾਦੀ ਨੂੰ ਇੱਕ ਫ਼ੋਨ ਆਉਂਦਾ ਹੈ। ਉਨ੍ਹਾਂ ਦੇ ਪੋਤੇ ਰੋਹਨ ਦੀ ਆਵਾਜ਼ ਹੈ, ਰੋਂਦੇ ਹੋਏ: "ਦਾਦੀ, ਮੇਰਾ ਐਕਸੀਡੈਂਟ ਹੋ ਗਿਆ ਹੈ! ਹੁਣੇ UPI ਨਾਲ ₹50,000 ਭੇਜ ਦਿਓ, ਅਤੇ ਪਾਪਾ ਨੂੰ ਨਾ ਦੱਸਣਾ।" ਪਰ ਰੋਹਨ ਆਪਣੇ ਹੋਸਟਲ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਸੁੱਤਾ ਪਿਆ ਹੈ। ਠੱਗਾਂ ਨੇ ਉਸ ਦੀਆਂ ਔਨਲਾਈਨ ਪਾਈਆਂ ਵੀਡੀਓਜ਼ ਤੋਂ AI ਨਾਲ ਉਸ ਦੀ ਆਵਾਜ਼ ਦੀ ਨਕਲ ਬਣਾ ਲਈ ਸੀ।',
    options: [
      'ਦਾਦੀ ਜਲਦੀ ਪੈਸੇ ਭੇਜ ਦੇਣ। ਜੇ ਸੱਚ ਹੋਇਆ ਤਾਂ?',
      'ਦਾਦੀ ਫ਼ੋਨ ਕੱਟਣ ਅਤੇ ਰੋਹਨ ਜਾਂ ਪਰਿਵਾਰ ਦੇ ਕਿਸੇ ਜੀਅ ਨੂੰ ਜਾਣੇ-ਪਛਾਣੇ ਨੰਬਰ \'ਤੇ ਫ਼ੋਨ ਕਰਨ।',
      'ਪਰਿਵਾਰ ਅਜਿਹੇ ਫ਼ੋਨ ਜਾਂਚਣ ਲਈ ਇੱਕ ਗੁਪਤ ਕੋਡ ਸ਼ਬਦ ਤੈਅ ਕਰੇ।',
      'ਰੋਹਨ ਆਪਣੀ ਆਵਾਜ਼ ਵਾਲੀਆਂ ਵੀਡੀਓਜ਼ ਔਨਲਾਈਨ ਪਾਉਣਾ ਬੰਦ ਕਰੇ।'
    ],
    questions: [
      'ਅਜਿਹੀਆਂ ਠੱਗੀਆਂ ਇੰਨੀ ਸੌਖ ਨਾਲ ਕਿਉਂ ਕਾਮਯਾਬ ਹੋ ਜਾਂਦੀਆਂ ਹਨ?',
      'ਜ਼ਿੰਮੇਵਾਰ ਕੌਣ ਹੈ: ਠੱਗ, ਆਵਾਜ਼ ਵਾਲੀ AI ਬਣਾਉਣ ਵਾਲੀਆਂ ਕੰਪਨੀਆਂ, ਜਾਂ ਦੋਵੇਂ?',
      'ਤੁਸੀਂ ਆਪਣੇ ਪਰਿਵਾਰ ਦੇ ਵੱਡਿਆਂ ਨੂੰ ਸੁਰੱਖਿਅਤ ਰਹਿਣ ਵਿੱਚ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੇ ਹੋ?'
    ],
    consider: [
      'AI ਕੁਝ ਸਕਿੰਟਾਂ ਦੀ ਆਵਾਜ਼ ਤੋਂ ਹੀ ਕਿਸੇ ਦੀ ਆਵਾਜ਼ ਦੀ ਨਕਲ ਕਰ ਸਕਦੀ ਹੈ, ਇਸ ਲਈ ਜਾਣੀ-ਪਛਾਣੀ ਆਵਾਜ਼ ਹੁਣ ਸਬੂਤ ਨਹੀਂ ਹੈ।',
      'ਠੱਗ ਘਬਰਾਹਟ ਅਤੇ ਲੁਕੋ ਪੈਦਾ ਕਰਦੇ ਹਨ: "ਹੁਣੇ", "ਕਿਸੇ ਨੂੰ ਨਾ ਦੱਸਣਾ"। ਰੁਕੋ, ਅਤੇ ਪਹਿਲਾਂ ਜਾਂਚੋ।',
      'ਭਾਰਤ ਵਿੱਚ ਸਾਈਬਰ ਠੱਗੀ ਦੀ ਸ਼ਿਕਾਇਤ ਤੁਰੰਤ ਹੈਲਪਲਾਈਨ 1930 \'ਤੇ ਜਾਂ cybercrime.gov.in \'ਤੇ ਕਰੋ।'
    ]
  },
  {
    title: 'ਕਦੇ ਨਾ ਮੁੱਕਣ ਵਾਲੀ ਵੀਡੀਓ ਫ਼ੀਡ',
    story: '15 ਸਾਲ ਦਾ ਕਬੀਰ ਰਾਤ ਨੂੰ "ਪੰਜ ਮਿੰਟ ਲਈ" ਸ਼ੌਰਟ-ਵੀਡੀਓ ਐਪ ਖੋਲ੍ਹਦਾ ਹੈ ਅਤੇ ਦੋ ਘੰਟੇ ਬਾਅਦ ਨਜ਼ਰ ਚੁੱਕਦਾ ਹੈ। ਐਪ ਦੀ AI ਠੀਕ-ਠੀਕ ਸਿੱਖ ਲੈਂਦੀ ਹੈ ਕਿ ਕਿਹੜੀਆਂ ਵੀਡੀਓਜ਼ ਉਸ ਨੂੰ ਰੋਕੀ ਰੱਖਦੀਆਂ ਹਨ, ਅਤੇ ਉਹੋ ਜਿਹੀਆਂ ਹੋਰ ਦਿਖਾਉਂਦੀ ਹੈ। ਉਸ ਦੀ ਨੀਂਦ ਅਤੇ ਅੰਕ ਦੋਵੇਂ ਡਿੱਗ ਰਹੇ ਹਨ। ਉਹ ਜਿੰਨਾ ਵੱਧ ਸਕ੍ਰੋਲ ਕਰਦਾ ਹੈ, ਕੰਪਨੀ ਓਨਾ ਵੱਧ ਕਮਾਉਂਦੀ ਹੈ।',
    options: [
      'ਇਹ ਕਬੀਰ ਦਾ ਫ਼ੈਸਲਾ ਹੈ। ਉਸ ਨੂੰ ਆਪਣੇ ਆਪ \'ਤੇ ਕਾਬੂ ਰੱਖਣਾ ਚਾਹੀਦਾ ਹੈ।',
      'ਐਪਾਂ ਵਿੱਚ ਨੌਜਵਾਨਾਂ ਲਈ ਰੋਜ਼ਾਨਾ ਸਮਾਂ-ਸੀਮਾ ਪਹਿਲਾਂ ਤੋਂ ਚਾਲੂ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ।',
      'ਐਪਾਂ ਦੱਸਣ ਕਿ ਹਰ ਵੀਡੀਓ ਕਿਉਂ ਸੁਝਾਈ ਗਈ, ਅਤੇ ਲੋਕ ਆਪਣੀ ਫ਼ੀਡ ਬਦਲ ਸਕਣ।',
      'ਪਰਿਵਾਰ ਅਤੇ ਸਕੂਲ ਬਿਨਾਂ ਫ਼ੋਨ ਵਾਲਾ ਸਮਾਂ ਤੈਅ ਕਰਨ, ਜਿਵੇਂ ਰਾਤ 10 ਵਜੇ ਤੋਂ ਬਾਅਦ।'
    ],
    questions: [
      'ਜਦੋਂ ਇੱਕ ਹੁਸ਼ਿਆਰ AI ਸਿਸਟਮ ਕਿਸੇ ਨੌਜਵਾਨ ਦਾ ਧਿਆਨ ਖਿੱਚਣ ਦੀ ਦੌੜ ਲਾਵੇ, ਤਾਂ ਕੀ ਇਹ ਨਿਰਪੱਖ ਹੈ?',
      'ਆਦਤ ਪਾਉਣ ਵਾਲੇ ਡਿਜ਼ਾਈਨ ਨਾਲ ਹੋਏ ਨੁਕਸਾਨ ਲਈ ਕੀ ਕੰਪਨੀਆਂ ਜ਼ਿੰਮੇਵਾਰ ਹੋਣ?',
      'ਕਿਹੜੀਆਂ ਆਦਤਾਂ ਤੁਹਾਨੂੰ ਆਪਣੇ ਸਕ੍ਰੀਨ ਟਾਈਮ \'ਤੇ ਕਾਬੂ ਰੱਖਣ ਵਿੱਚ ਮਦਦ ਕਰਦੀਆਂ ਹਨ?'
    ],
    consider: [
      'ਸੁਝਾਅ ਦੇਣ ਵਾਲੀ AI ਇਸ ਲਈ ਬਣੀ ਹੈ ਕਿ ਤੁਸੀਂ ਵੇਖਦੇ ਰਹੋ, ਕਿਉਂਕਿ ਵੱਧ ਵੇਖਣ ਦਾ ਮਤਲਬ ਵੱਧ ਇਸ਼ਤਿਹਾਰ ਹੈ।',
      'ਕਦੇ ਨਾ ਮੁੱਕਣ ਵਾਲਾ ਸਕ੍ਰੋਲ ਅਤੇ ਆਟੋਪਲੇ ਰੁਕਣਾ ਔਖਾ ਬਣਾਉਂਦੇ ਹਨ। ਇਹ ਡਿਜ਼ਾਈਨ ਕਰਕੇ ਹੈ, ਤੁਹਾਡੀ ਕਮਜ਼ੋਰੀ ਨਹੀਂ।',
      'ਛੋਟੇ ਕਦਮ ਮਦਦ ਕਰਦੇ ਹਨ: ਸਕ੍ਰੀਨ ਟਾਈਮ ਦੀ ਸੀਮਾ, ਰਾਤ ਨੂੰ ਸੌਣ ਵਾਲੇ ਕਮਰੇ ਵਿੱਚ ਫ਼ੋਨ ਨਹੀਂ, ਅਤੇ ਆਟੋਪਲੇ ਬੰਦ।'
    ]
  }
] };

/* ---------- or ---------- */
C.or = { cards: [
  {
    title: 'ସହପାଠୀର ନକଲି ଭିଡିଓ',
    story: 'ନବମ ଶ୍ରେଣୀର କେହି ଜଣେ ଏକ ମାଗଣା AI ଆପ୍ ଦ୍ୱାରା ନିଜ ସହପାଠୀ ମୀରାର ଏକ ନକଲି ଭିଡିଓ ତିଆରି କଲା। ସେଥିରେ ମୀରା ଜଣେ ଶିକ୍ଷକଙ୍କ ବିଷୟରେ ଖରାପ କଥା କହୁଥିବା ପରି ଦେଖାଯାଉଛି। ଭିଡିଓଟି ଏକଦମ୍ ସତ ପରି ଲାଗୁଛି। ଏହା ଶ୍ରେଣୀର WhatsApp ଗ୍ରୁପ୍‌ରେ ଶୀଘ୍ର ବ୍ୟାପିଯାଉଛି, ଏବଂ ମୀରା ଏତେ ଦୁଃଖୀ ଯେ ସ୍କୁଲ ଆସୁନାହିଁ। ଏଇମାତ୍ର ଭିଡିଓଟି ଆପଣଙ୍କ ପାଖକୁ ମଧ୍ୟ ଆସିଛି।',
    options: [
      'କିଛି ସାଙ୍ଗଙ୍କୁ ଫରୱାର୍ଡ କରିଦିଅ। ସମସ୍ତେ ତ ଦେଖିସାରିଛନ୍ତି।',
      'ଫରୱାର୍ଡ କର ନାହିଁ, ଏବଂ ଚୁପ୍ ରୁହ।',
      'ଗ୍ରୁପ୍‌ରେ ଲେଖ ଯେ ଭିଡିଓଟି ନକଲି, ଏବଂ ସମସ୍ତଙ୍କୁ ଏହାକୁ ଡିଲିଟ୍ କରିବାକୁ କୁହ।',
      'କୌଣସି ଶିକ୍ଷକ ବା ବାପାମାଙ୍କୁ ଜଣାଅ, ଏବଂ ଏକୁଟିଆରେ ମୀରାର ପାଖରେ ଠିଆ ହୁଅ।'
    ],
    questions: [
      'ଏହି ଭିଡିଓରେ କାହାର କ୍ଷତି ହେଉଛି, ଏବଂ କିପରି?',
      'ଯିଏ କେବଳ ନକଲି ଭିଡିଓ ଫରୱାର୍ଡ କରେ, ସେ ମଧ୍ୟ ଦାୟୀ କି? କାହିଁକି?',
      'ନକଲି ଭିଡିଓ ତିଆରି କରିପାରୁଥିବା ଆପ୍‌ଗୁଡ଼ିକ କେଉଁ ନିୟମ ମାନିବା ଉଚିତ?'
    ],
    consider: [
      'ଡିପ୍‌ଫେକ୍ କାହାର ସମ୍ମାନ ଓ ମନକୁ ଆଘାତ ଦେଇପାରେ, ଲୋକେ ଏହା ନକଲି ବୋଲି ଜାଣିବା ପରେ ମଧ୍ୟ।',
      'ପ୍ରତ୍ୟେକ ଫରୱାର୍ଡ କ୍ଷତିକୁ ଆହୁରି ବ୍ୟାପେ। ଫରୱାର୍ଡ ନକରିବା ସାହାଯ୍ୟ କରେ; ଅଭିଯୋଗ କରିବା ତା’ଠାରୁ ବି ଅଧିକ ସାହାଯ୍ୟ କରେ।',
      'କାହାର କ୍ଷତି କରିବା ପାଇଁ ନକଲି ଭିଡିଓ ତିଆରି କରିବା ବା ବ୍ୟାପାଇବା ଭାରତୀୟ ଆଇନରେ ଦଣ୍ଡନୀୟ ହୋଇପାରେ। ଏପରି ଭିଡିଓର ଅଭିଯୋଗ cybercrime.gov.in ରେ କରାଯାଇପାରିବ।'
    ]
  },
  {
    title: 'AI ତୁମ ରଚନା ଯାଞ୍ଚ କରିବ',
    story: 'ଗୋଟିଏ ସ୍କୁଲ ଦଶମ ଶ୍ରେଣୀର ଇଂରାଜୀ ରଚନା AI ଟୁଲ୍ ଦ୍ୱାରା ଯାଞ୍ଚ କରିବାକୁ ଚାହେଁ। ଏହା ଶୀଘ୍ର, ଏବଂ ସଙ୍ଗେ ସଙ୍ଗେ ପରାମର୍ଶ ଦିଏ। କିନ୍ତୁ ପରୀକ୍ଷାମୂଳକ ବ୍ୟବହାରରେ ଏହା କଠିନ ଶବ୍ଦରେ ଭରା ଲମ୍ବା ରଚନାକୁ ଅଧିକ ନମ୍ବର ଦେଲା। ସହଜ ଇଂରାଜୀରେ ଭଲ ଚିନ୍ତା ଲେଖିଥିବା କିଛି ଛାତ୍ରଛାତ୍ରୀ କମ୍ ନମ୍ବର ପାଇଲେ।',
    options: [
      'ସବୁ ଯାଞ୍ଚ AI ଦ୍ୱାରା କରାଅ। ଏଥିରେ ଶିକ୍ଷକଙ୍କ ବହୁତ ସମୟ ବଞ୍ଚିବ।',
      'AI କେବଳ କଞ୍ଚା ଡ୍ରାଫ୍ଟ ଉପରେ ପରାମର୍ଶ ଦେବ। ଶେଷ ନମ୍ବର ଶିକ୍ଷକ ଦେବେ।',
      'AI ର ନମ୍ବର ରଖ, କିନ୍ତୁ ଯେକୌଣସି ଛାତ୍ର ଶିକ୍ଷକଙ୍କୁ ପୁଣି ଯାଞ୍ଚ କରିବାକୁ କହିପାରିବେ।',
      'ପରୀକ୍ଷା କରି ନ୍ୟାୟପୂର୍ଣ୍ଣ ପ୍ରମାଣିତ ନହେବା ଯାଏଁ ଏହାକୁ ବ୍ୟବହାର କର ନାହିଁ।'
    ],
    questions: [
      'ଯାଞ୍ଚକୁ ନ୍ୟାୟପୂର୍ଣ୍ଣ କ’ଣ କରେ? ଗୋଟିଏ ମେସିନ୍ କ’ଣ ଏହା ଶିଖିପାରିବ?',
      'ଛାତ୍ରଛାତ୍ରୀଙ୍କୁ ଜଣାଇବା ଉଚିତ କି ଯେ ସେମାନଙ୍କ କାମ AI ଯାଞ୍ଚ କରିଛି?',
      'AI ଭୁଲ୍ ନମ୍ବର ଦେଲେ ଦାୟୀ କିଏ: ସ୍କୁଲ, କମ୍ପାନୀ ନା AI?'
    ],
    consider: [
      'AI ପୁରୁଣା ଉଦାହରଣରୁ ଶିଖେ। ସେହି ଉଦାହରଣରେ ଲମ୍ବା ଶବ୍ଦକୁ ପୁରସ୍କାର ମିଳିଥିଲେ, AI ମଧ୍ୟ ସେହି ଅଭ୍ୟାସ ନକଲ କରେ।',
      'ସ୍ୱଚ୍ଛତାର ଅର୍ଥ ଛାତ୍ରଛାତ୍ରୀ ଜାଣିବେ କିପରି ନମ୍ବର ମିଳିଲା, ଏବଂ ପୁଣି ଯାଞ୍ଚ ମାଗିପାରିବେ।',
      'ପରୀକ୍ଷା ନମ୍ବର ପରି ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ନିଷ୍ପତ୍ତିର ଦାୟିତ୍ୱ ଜଣେ ମଣିଷ ପାଖରେ ହିଁ ରହିବା ଉଚିତ।'
    ]
  },
  {
    title: 'ମୁହଁ ଦେଖି ହାଜିରା',
    story: 'ଗୋଟିଏ କଲେଜ ଗେଟରେ ଏପରି କ୍ୟାମେରା ଲଗାଇବାକୁ ଚାହେଁ ଯାହା ପ୍ରତ୍ୟେକ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ମୁହଁ ଚିହ୍ନି ହାଜିରା ନେବ। ଏଥିରେ ପ୍ରତି କ୍ଲାସର ସମୟ ବଞ୍ଚିବ ଏବଂ ପ୍ରକ୍ସି ହାଜିରା ବନ୍ଦ ହେବ। ମୁହଁର ଫଟୋଗୁଡ଼ିକ ସିଷ୍ଟମ ଚଳାଉଥିବା କମ୍ପାନୀ ପାଖରେ ରହିବ। କିଛି ଛାତ୍ରଛାତ୍ରୀ କହନ୍ତି, କମ୍ ଆଲୁଅରେ ଏହା ପ୍ରାୟତଃ ସେମାନଙ୍କୁ ଚିହ୍ନିପାରେ ନାହିଁ।',
    options: [
      'ଲଗାଇଦିଅ। ଏହା ଶୀଘ୍ର ଏବଂ ପ୍ରକ୍ସି ହାଜିରା ବନ୍ଦ କରେ।',
      'କେବଳ ରାଜି ହେଉଥିବା ଛାତ୍ରଙ୍କ ପାଇଁ ବ୍ୟବହାର କର। ବାକିଙ୍କ ପାଇଁ କାଗଜ ରେଜିଷ୍ଟର ରଖ।',
      'ମୁହଁର ଡାଟା କଲେଜ ପାଖରେ ରହିଲେ ଏବଂ କୋର୍ସ ପରେ ଲିଭାଇଦିଆଗଲେ ହିଁ ବ୍ୟବହାର କର।',
      'ବ୍ୟବହାର କର ନାହିଁ। ନାମ ଡାକି ହାଜିରା ନେବା ଯଥେଷ୍ଟ।'
    ],
    questions: [
      'ତୁମ ମୁହଁ କ’ଣ ବ୍ୟକ୍ତିଗତ ଡାଟା? ତା’ ଉପରେ କାହାର ନିୟନ୍ତ୍ରଣ ରହିବା ଉଚିତ?',
      'ଏହି ମୁହଁର ଡାଟା ଲିକ୍ ହେଲେ ବା ଅପବ୍ୟବହାର ହେଲେ କ’ଣ ହୋଇପାରେ?',
      'ସିଷ୍ଟମ କିଛି ଛାତ୍ରଙ୍କ କ୍ଷେତ୍ରରେ ଅଧିକ ଭୁଲ୍ କଲେ, ତଥାପି ଏହା ନ୍ୟାୟପୂର୍ଣ୍ଣ କି?'
    ],
    consider: [
      'ମୁହଁର ଡାଟା ବାୟୋମେଟ୍ରିକ୍ ଡାଟା। ଲିକ୍ ହେଲେ ପାସୱାର୍ଡ ପରି ତୁମେ ତୁମ ମୁହଁ ବଦଳାଇପାରିବ ନାହିଁ।',
      'ଭାରତର ଡିଜିଟାଲ ବ୍ୟକ୍ତିଗତ ଡାଟା ସୁରକ୍ଷା ଆଇନ, 2023 କହେ ଯେ ଲୋକଙ୍କୁ ଜଣାଇବାକୁ ହେବ ସେମାନଙ୍କ ଡାଟା କାହିଁକି ନିଆଯାଉଛି, ଏବଂ ସାଧାରଣତଃ ସେମାନଙ୍କ ସମ୍ମତି ଦରକାର।',
      'କମ୍ ଆଲୁଅରେ ବା କିଛି ମୁହଁ ପାଇଁ ଫେସ୍ ରେକଗ୍ନିସନ୍ ଅଧିକ ଭୁଲ୍ କରିପାରେ, ଫଳରେ ଛାତ୍ରଛାତ୍ରୀ ଭୁଲରେ ଅନୁପସ୍ଥିତ ଦେଖାଯାଇପାରନ୍ତି।'
    ]
  },
  {
    title: 'ଗୃହକାମ କଲା AI',
    story: 'ଅର୍ଜୁନର ବିଜ୍ଞାନ ପ୍ରୋଜେକ୍ଟ କାଲି ଦାଖଲ କରିବାକୁ ଅଛି। ସେ ବିଷୟଟି ଏକ AI ଚାଟ୍‌ବଟ୍‌ରେ ଲେଖେ, ଏବଂ ଏକ ମିନିଟରେ ତାହା ଏକ ସୁନ୍ଦର, ସମ୍ପୂର୍ଣ୍ଣ ରିପୋର୍ଟ ଲେଖିଦିଏ। ସେ ଏହାକୁ ନିଜ କାମ ବୋଲି ଦାଖଲ କରିପାରେ। ତା’ ସାଙ୍ଗ କହେ, "ସମସ୍ତେ ଏଇଆ କରନ୍ତି।" ଶିକ୍ଷକ AI ବ୍ୟବହାର ବିଷୟରେ କିଛି କହିନାହାନ୍ତି।',
    options: [
      'AI ର ରିପୋର୍ଟ ଯେମିତି ଅଛି ସେମିତି ଦାଖଲ କରୁ। କେହି ଜାଣିବେ ନାହିଁ।',
      'AI ସାହାଯ୍ୟରେ ବିଷୟ ବୁଝୁ, ତା’ପରେ ରିପୋର୍ଟ ନିଜେ ଲେଖୁ।',
      'AI ରିପୋର୍ଟର କିଛି ଅଂଶ ନେଉ, କିନ୍ତୁ ସ୍ପଷ୍ଟ କହୁ ଯେ AI ସାହାଯ୍ୟ କରିଛି।',
      'ଶିକ୍ଷକଙ୍କୁ ପଚାରୁ କେଉଁ ପ୍ରକାର AI ସାହାଯ୍ୟ ଚଳିବ।'
    ],
    questions: [
      'ସାହାଯ୍ୟ ନେବା ଓ ନକଲ କରିବା ମଧ୍ୟରେ କ’ଣ ପାର୍ଥକ୍ୟ?',
      'ସବୁ ଚିନ୍ତା କାମ AI କଲେ ଅର୍ଜୁନ କ’ଣ ହରାଏ?',
      'ତୁମ ଶ୍ରେଣୀରେ ଗୃହକାମ ପାଇଁ AI ର ଏକ ନ୍ୟାୟପୂର୍ଣ୍ଣ ନିୟମ କ’ଣ ହେବା ଉଚିତ?'
    ],
    consider: [
      'ଗୃହକାମ ହେଉଛି ଅଭ୍ୟାସ। AI କରିଦେଲେ ନମ୍ବର ବଢ଼ିପାରେ, କିନ୍ତୁ ଶିଖିବା ବଢ଼େ ନାହିଁ।',
      'AI ଚାଟ୍‌ବଟ୍ ଏପରି ତଥ୍ୟ ଗଢ଼ିପାରେ ଯାହା ଶୁଣିବାକୁ ଠିକ୍ ଲାଗେ, ତେଣୁ ଏହାର ଉତ୍ତର ସବୁବେଳେ ଯାଞ୍ଚ କରିବା ଦରକାର।',
      'AI କିପରି ବ୍ୟବହାର କଲ ତାହା ସଚ୍ଚୋଟ ଭାବେ କହିଲେ ବିଶ୍ୱାସ ଗଢ଼ିଉଠେ। ଅନେକ ସ୍କୁଲ ଏବେ AI ବିଷୟରେ ସ୍ପଷ୍ଟ ନିୟମ ତିଆରି କରୁଛନ୍ତି।'
    ]
  },
  {
    title: 'ପକ୍ଷପାତୀ ନିଯୁକ୍ତି AI',
    story: 'ଏକ ବଡ଼ କମ୍ପାନୀ ହଜାର ହଜାର ଚାକିରି ଆବେଦନ ବାଛିବା ପାଇଁ AI ବ୍ୟବହାର କରେ। AI କମ୍ପାନୀର ଗତ 10 ବର୍ଷର ନିଯୁକ୍ତିରୁ ଶିଖିଲା, ଯେତେବେଳେ କମ୍ପାନୀ ପ୍ରାୟତଃ ବଡ଼ ସହରର ପୁରୁଷଙ୍କୁ ହିଁ ନିଯୁକ୍ତି ଦେଉଥିଲା। ଏବେ ଏହା ମହିଳା ଓ ଛୋଟ ସହରର ଲୋକଙ୍କୁ କମ୍ ନମ୍ବର ଦିଏ, ସେମାନଙ୍କ ଦକ୍ଷତା ସମାନ ହେଲେ ବି।',
    options: [
      'ଚଳାଇ ରଖ। ଏହା ଶୀଘ୍ର, ଏବଂ କମ୍ପାନୀ ଯାହାକୁ ଚାହିଁବ ନେଇପାରେ।',
      'ଟ୍ରେନିଂ ଡାଟା ସୁଧାର ଏବଂ ପୁଣି ବ୍ୟବହାର ପୂର୍ବରୁ AI ର ପକ୍ଷପାତ ପରୀକ୍ଷା କର।',
      'AI ଏକ ଛୋଟ ତାଲିକା କରୁ, କିନ୍ତୁ ଶେଷ ବଛା ମଣିଷ କରନ୍ତୁ ଏବଂ ପ୍ରତ୍ୟାଖ୍ୟାତ ଆବେଦନ ମଧ୍ୟ ଦେଖନ୍ତୁ।',
      'ନିଯୁକ୍ତିରେ AI ବ୍ୟବହାର ବନ୍ଦ କର। ଲୋକଙ୍କ କ୍ୟାରିୟର ବହୁତ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ।'
    ],
    questions: [
      'କେହି କହିନଥିଲେ, ତେବେ AI କିପରି ଅନ୍ୟାୟୀ ହୋଇଗଲା?',
      'କାହାର ଆବେଦନ AI ପ୍ରତ୍ୟାଖ୍ୟାନ କଲେ ତାଙ୍କୁ ଜଣାଇବା ଉଚିତ କି?',
      'ନିଯୁକ୍ତି AI ନ୍ୟାୟପୂର୍ଣ୍ଣ କି ନାହିଁ, କିଏ ଯାଞ୍ଚ କରିବ: କମ୍ପାନୀ, ସରକାର ନା ଅନ୍ୟ କେହି?'
    ],
    consider: [
      'AI ପୁରୁଣା ଡାଟାରୁ ପ୍ୟାଟର୍ନ ଶିଖେ, ପୁରୁଣା ଅନ୍ୟାୟ ଅଭ୍ୟାସ ସହିତ। ଏହାକୁ ପକ୍ଷପାତ (ବାୟାସ୍) କୁହାଯାଏ।',
      'ଭିନ୍ନ ଭିନ୍ନ ଗୋଷ୍ଠୀର (ମହିଳା ଓ ପୁରୁଷ, ସହର ଓ ଛୋଟ ସହର) ଫଳାଫଳ ତୁଳନା କଲେ ଲୁଚିଥିବା ପକ୍ଷପାତ ଦେଖାଯାଇପାରେ।',
      'କାହିଁକି ପ୍ରତ୍ୟାଖ୍ୟାନ କରାଗଲା ତାହା ଲୋକେ ଜାଣିପାରିବା ଉଚିତ, ଏବଂ ଜଣେ ମଣିଷଙ୍କୁ ପୁଣି ଦେଖିବାକୁ କହିପାରିବା ଉଚିତ।'
    ]
  },
  {
    title: 'ସ୍ୱୟଂଚାଳିତ କାରର ନିଷ୍ପତ୍ତି',
    story: 'ବେଙ୍ଗାଲୁରୁର ଏକ ଭିଡ଼ ରାସ୍ତାରେ ଏକ ସ୍ୱୟଂଚାଳିତ କାର ଯାଉଛି। ହଠାତ୍ ଗୋଟିଏ ପିଲା ରାସ୍ତାକୁ ଦୌଡ଼ିଆସେ। କାରଟି ସମୟରେ ଅଟକିପାରିବ ନାହିଁ। ଏହା ନିଜ ଲେନରେ ରହିପାରେ, କିମ୍ବା ଫୁଟପାଥ ଆଡ଼କୁ ମୋଡ଼ିପାରେ ଯେଉଁଠି ଦୁଇଜଣ ଚାଲୁଛନ୍ତି। ଦୁଇଟିଯାକରେ କାହାକୁ ନା କାହାକୁ ବିପଦ। କାର କ’ଣ କରିବ, ଇଞ୍ଜିନିୟରମାନଙ୍କୁ ଆଗରୁ ସ୍ଥିର କରିବାକୁ ପଡ଼ିବ।',
    options: [
      'ସବୁବେଳେ ପ୍ରଥମେ କାର ଭିତରେ ଥିବା ଲୋକଙ୍କୁ ବଞ୍ଚାଉ।',
      'ସବୁବେଳେ ସେହି ବାଟ ବାଛୁ ଯେଉଁଥିରେ ସବୁଠୁ କମ୍ ଲୋକଙ୍କୁ ବିପଦ।',
      'ସବୁବେଳେ ଜୋରରେ ବ୍ରେକ୍ ମାରି ନିଜ ଲେନରେ ରହୁ। କେବେ ଫୁଟପାଥକୁ ନ ମୋଡ଼ୁ।',
      'ଏପରି ପରିସ୍ଥିତିରୁ ବଞ୍ଚିପାରିବା ଯାଏଁ ଏପରି କାରକୁ ରାସ୍ତାରେ ଅନୁମତି ଦିଆଯିବା ଉଚିତ ନୁହେଁ।'
    ],
    questions: [
      'ଏହି ନିୟମ କିଏ ସ୍ଥିର କରିବ: ଇଞ୍ଜିନିୟର, ସରକାର ନା ଜନସାଧାରଣ?',
      'କାରରୁ ଦୁର୍ଘଟଣା ହେଲେ ଦାୟୀ କିଏ: ମାଲିକ, କମ୍ପାନୀ ନା ପ୍ରୋଗ୍ରାମର?',
      'କିଣୁଥିବା ଲୋକେ ଜାଣିବା ଉଚିତ କି ସେମାନଙ୍କ କାର କେଉଁ ନିୟମ ମାନେ?'
    ],
    consider: [
      'ସ୍ୱୟଂଚାଳିତ କାର ଏପରି ତିଆରି ହୁଏ ଯେ ଆଗରୁ ଧୀର ହୋଇ ଏପରି ମୁହୂର୍ତ୍ତ ଏଡ଼ାଇବ, କିନ୍ତୁ କୌଣସି ସିଷ୍ଟମ ସମ୍ପୂର୍ଣ୍ଣ ନିଖୁଣ ନୁହେଁ।',
      'ଏହି ନିୟମଗୁଡ଼ିକ ନୈତିକ ନିଷ୍ପତ୍ତି, ତେଣୁ କେବଳ ଇଞ୍ଜିନିୟର ନୁହେଁ, ଅନେକ ଲୋକଙ୍କ ମତ ନିଆଯିବା ଉଚିତ।',
      'ଏପରି କାରକୁ ଅନୁମତି ଦେବା ପୂର୍ବରୁ ଦୁର୍ଘଟଣାର ଦାୟିତ୍ୱ କାହାର, ସେ ବିଷୟରେ ସ୍ପଷ୍ଟ ନିୟମ ଦରକାର।'
    ]
  },
  {
    title: 'ମାଗଣା ହେଲ୍ଥ ଆପ୍ ଡାଟା ବାଣ୍ଟେ',
    story: 'ପ୍ରିୟା ଏକ ମାଗଣା ଫିଟନେସ୍ ଆପ୍ ବ୍ୟବହାର କରେ ଯାହା ତା’ର ପାଦ, ଶୋଇବା ଓ ହୃଦସ୍ପନ୍ଦନ ଗଣେ। ଏହା ତା’ର ଓଜନ, ଖାଦ୍ୟ ଓ ମନର ଅବସ୍ଥା ମଧ୍ୟ ପଚାରେ। ଏହାର ଲମ୍ବା ସର୍ତ୍ତାବଳୀର ଭିତରେ ଲେଖାଅଛି ଯେ କମ୍ପାନୀ ଏହି ଡାଟା "ପାର୍ଟନର"ଙ୍କ ସହ ବାଣ୍ଟିପାରେ। ଶୀଘ୍ର ପ୍ରିୟା ଓଜନ କମାଇବା ଜିନିଷ ଓ ହେଲ୍ଥ ଇନସ୍ୟୁରାନ୍ସର ବିଜ୍ଞାପନ ଦେଖିବାକୁ ଲାଗେ।',
    options: [
      'ଠିକ୍ ଅଛି। ଆପ୍ ମାଗଣା, ଏବଂ ସେ ସର୍ତ୍ତରେ ରାଜି ହୋଇଥିଲା।',
      'ଆପ୍ ରଖୁ, କିନ୍ତୁ ସେଟିଂସରେ ଡାଟା ସେୟାରିଂ ବନ୍ଦ କରୁ।',
      'ଆପ୍ ହଟାଇ ଏପରି ଆପ୍ ବାଛୁ ଯାହା ଡାଟା ବାଣ୍ଟେ ନାହିଁ।',
      'ଆପ୍ ବିରୁଦ୍ଧରେ ଅଭିଯୋଗ କରୁ। ସ୍ୱାସ୍ଥ୍ୟ ଡାଟା ବାଣ୍ଟିବାକୁ କମ୍ପାନୀମାନେ ସ୍ପଷ୍ଟ ଅନୁମତି ନେବା ଦରକାର।'
    ],
    questions: [
      'ଆପ୍ ମାଗଣା ହେଲେ କମ୍ପାନୀ ଟଙ୍କା କିପରି ରୋଜଗାର କରେ?',
      'ଲମ୍ବା ଦଲିଲରେ "ମୁଁ ରାଜି" ଦବାଇବା କ’ଣ ପ୍ରକୃତ ସମ୍ମତି?',
      'ସ୍ୱାସ୍ଥ୍ୟର କେଉଁ ତଥ୍ୟ ନପଚାରି କେବେ ବାଣ୍ଟିବା ଉଚିତ ନୁହେଁ?'
    ],
    consider: [
      'ଅନେକ ମାଗଣା ଆପ୍ ତୁମ ଡାଟା ଓ ବିଜ୍ଞାପନରୁ ରୋଜଗାର କରନ୍ତି। ଟଙ୍କାରେ ଦାମ ନ ଦେଲେ, ହୁଏତ ଡାଟାରେ ଦେଉଛ।',
      'ସ୍ୱାସ୍ଥ୍ୟ ଡାଟା ବହୁତ ବ୍ୟକ୍ତିଗତ। ଏହାର ପ୍ରଭାବ ବୀମା, ଚାକିରି ବା ଲୋକେ ତୁମ ସହ କିପରି ବ୍ୟବହାର କରନ୍ତି ତା’ ଉପରେ ପଡ଼ିପାରେ।',
      'ଭଲ ଆପ୍ ଡାଟା ବାଣ୍ଟିବା ପୂର୍ବରୁ ସହଜ ଭାଷାରେ ସ୍ପଷ୍ଟ ପଚାରେ। ଆପ୍ ଅନୁମତି ଓ ପ୍ରାଇଭେସି ସେଟିଂସ ଯାଞ୍ଚ କର।'
    ]
  },
  {
    title: 'AI ଚିତ୍ର ପ୍ରତିଯୋଗିତା ଜିତିଲା',
    story: 'ଜିଲ୍ଲା ଚିତ୍ରାଙ୍କନ ପ୍ରତିଯୋଗିତାର ବିଷୟ "2047ରେ ମୋ ଭାରତ"। ଏକ ସୁନ୍ଦର, ସୂକ୍ଷ୍ମ ଚିତ୍ର ପ୍ରଥମ ପୁରସ୍କାର ଜିତେ। ପରେ ସମସ୍ତେ ଜାଣନ୍ତି ଯେ ଛାତ୍ରଟି କିଛି ଧାଡ଼ି ଟାଇପ୍ କରି AI ଇମେଜ୍ ଜେନେରେଟରରେ ଏହା ତିଆରି କରିଥିଲା। ନିୟମରେ AI ର ଉଲ୍ଲେଖ ନଥିଲା। ଅନ୍ୟ ଛାତ୍ରଛାତ୍ରୀ ସପ୍ତାହ ସପ୍ତାହ ହାତରେ ଚିତ୍ର ଆଙ୍କିଥିଲେ।',
    options: [
      'ପୁରସ୍କାର ରହୁ। ନିୟମରେ AI ନିଷେଧ ନଥିଲା।',
      'ପୁରସ୍କାର ଫେରାଇ ନେଇ ହାତରେ ଆଙ୍କିଥିବା ସର୍ବୋତ୍ତମ ଚିତ୍ରକୁ ଦିଅ।',
      'ବିଜେତା ପୁରସ୍କାର ରଖୁ, ଏବଂ ଆସନ୍ତା ବର୍ଷଠାରୁ AI ଚିତ୍ରର ଅଲଗା ବିଭାଗ ହେଉ।',
      'ଛାତ୍ରଟି ବିଚାରକଙ୍କୁ କହିବା ଉଚିତ ଥିଲା ଯେ AI ବ୍ୟବହାର ହୋଇଛି।'
    ],
    questions: [
      'ପ୍ରମ୍ପ୍ଟ ଟାଇପ୍ କରିବା କ’ଣ ଚିତ୍ର ଆଙ୍କିବା ସହ ସମାନ? ଏଥିରେ କେଉଁ ଦକ୍ଷତା ଲାଗେ?',
      'AI ଚିତ୍ରକୁ ହାତରେ ଆଙ୍କିଥିବା ଚିତ୍ର ସହ ତୁଳନା କରିବା ନ୍ୟାୟପୂର୍ଣ୍ଣ କି?',
      'AI ଇମେଜ୍ ଟୁଲ୍ ଲକ୍ଷ ଲକ୍ଷ କଳାକାରଙ୍କ ଚିତ୍ରରୁ ଶିଖିଛି। ସେହି କଳାକାରମାନେ ଶ୍ରେୟ ପାଇବା ଉଚିତ କି?'
    ],
    consider: [
      'କୌଣସି ଜିନିଷ କିପରି ତିଆରି ହେଲା ତାହା ସଚ୍ଚୋଟ ଭାବେ କହିବା ଜରୁରୀ, ନିୟମ ସ୍ପଷ୍ଟ ନଥିଲେ ବି।',
      'ନ୍ୟାୟପୂର୍ଣ୍ଣ ପ୍ରତିଯୋଗିତା ସମାନ ଦକ୍ଷତାର ତୁଳନା କରେ। AI ବିଷୟରେ ସ୍ପଷ୍ଟ ନିୟମ ସମସ୍ତଙ୍କୁ ସାହାଯ୍ୟ କରେ।',
      'AI କଳା ସୃଜନଶୀଳ ହୋଇପାରେ, କିନ୍ତୁ AI ଅନ୍ୟଙ୍କ କାମରୁ ଶିଖେ, ପ୍ରାୟତଃ ସେମାନଙ୍କୁ ନପଚାରି।'
    ]
  },
  {
    title: 'ସ୍କୁଲ ବାରଣ୍ଡାରେ AI କ୍ୟାମେରା',
    story: 'ସ୍କୁଲରେ ଏକ ମାରପିଟ ପରେ ପ୍ରଧାନଶିକ୍ଷକ ସବୁ ବାରଣ୍ଡାରେ AI କ୍ୟାମେରା ଲଗାଇବାକୁ ଭାବୁଛନ୍ତି। AI ଦୌଡ଼ିବା ବା ଦଳ ଜମା ହେବା ପରି "ଅସ୍ୱାଭାବିକ ବ୍ୟବହାର" ଚିହ୍ନି ଶିକ୍ଷକଙ୍କୁ ଜଣାଇବ। ଅନେକ ବାପାମା ଭାବନ୍ତି ପିଲାମାନେ ଅଧିକ ସୁରକ୍ଷିତ ରହିବେ। କିଛି ଛାତ୍ରଛାତ୍ରୀ ଭାବନ୍ତି ସେମାନଙ୍କ ଉପରେ ସବୁବେଳେ ନଜର ରଖାଯାଉଛି, ଏବଂ ଡରନ୍ତି ଯେ AI ସାଧାରଣ ଖେଳକୁ ମଧ୍ୟ ଗଣ୍ଡଗୋଳ ବୋଲି ଜଣାଇବ।',
    options: [
      'ସବୁଠି କ୍ୟାମେରା ଲଗାଅ। ସୁରକ୍ଷା ପ୍ରଥମେ।',
      'କ୍ୟାମେରା କେବଳ ଗେଟ୍ ଓ ସିଡ଼ିରେ ଲଗାଅ, ଶ୍ରେଣୀଗୃହ ଭିତରେ କେବେ ନୁହେଁ।',
      'କ୍ୟାମେରା ଲଗାଅ, କିନ୍ତୁ ସମସ୍ତଙ୍କୁ ଜଣାଅ କ’ଣ ରେକର୍ଡ ହୁଏ, କିଏ ଦେଖିପାରେ ଏବଂ କେବେ ଲିଭାଯାଏ।',
      'AI କ୍ୟାମେରା ନୁହେଁ। ଅଧିକ ଶିକ୍ଷକଙ୍କୁ ଡ୍ୟୁଟିରେ ରଖ ଏବଂ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ସହ କଥା ହୁଅ।'
    ],
    questions: [
      'ଗୋଟିଏ କ୍ୟାମେରା ସବୁବେଳେ ତୁମ ଉପରେ ନଜର ରଖିଲେ ତୁମକୁ କିପରି ଲାଗିବ?',
      '"ଅସ୍ୱାଭାବିକ ବ୍ୟବହାର" କାହାକୁ କହିବା? କିଏ ସ୍ଥିର କରିବ?',
      'ଭିଡିଓ କିଏ ଦେଖିବ, ଏବଂ କେତେ ଦିନ ରଖାଯିବ?'
    ],
    consider: [
      'କ’ଣ ଘଟିଥିଲା ଜାଣିବାରେ କ୍ୟାମେରା ସାହାଯ୍ୟ କରିପାରେ, କିନ୍ତୁ ଏଥିରେ ଲୋକଙ୍କୁ ଲାଗିପାରେ ଯେ ସେମାନଙ୍କୁ ବିଶ୍ୱାସ କରାଯାଉନାହିଁ।',
      'କ୍ଲାସ ଆଡ଼କୁ ଦୌଡ଼ିବା ପରି ସାଧାରଣ କଥାକୁ ମଧ୍ୟ AI ଭୁଲରେ ସମସ୍ୟା ଭାବିପାରେ, ତେଣୁ କୌଣସି ପଦକ୍ଷେପ ପୂର୍ବରୁ ଜଣେ ମଣିଷ ଯାଞ୍ଚ କରନ୍ତୁ।',
      'କ’ଣ ରେକର୍ଡ ହେବ, କିଏ ଦେଖିବ ଏବଂ କେବେ ଲିଭିବ, ତା’ର ସ୍ପଷ୍ଟ ନିୟମ ସୁରକ୍ଷା ଓ ଗୋପନୀୟତା ଦୁଇଟିକୁ ରକ୍ଷା କରେ।'
    ]
  },
  {
    title: 'ମେସିନ୍ ଗାଁର କାମ ଛଡ଼ାଇଲା',
    story: 'ପଞ୍ଜାବର ଏକ ଗାଁରେ ଜଣେ ଚାଷୀ AI ଚାଳିତ ଏକ ସ୍ମାର୍ଟ ଅମଳ ମେସିନ୍ କିଣନ୍ତି। ଏହା ଗୋଟିଏ ଦିନରେ ତାଙ୍କ ଗହମ କ୍ଷେତ କାଟିଦିଏ। ଆଗରୁ 20 ଜଣ ଶ୍ରମିକ ଏହି କାମ ଏକ ସପ୍ତାହରେ କରୁଥିଲେ ଏବଂ ପ୍ରତି ଋତୁରେ ରୋଜଗାର କରୁଥିଲେ। ଚାଷୀଙ୍କ ସମୟ ଓ ଟଙ୍କା ବଞ୍ଚେ, କିନ୍ତୁ ରମେଶ ପରି ଶ୍ରମିକଙ୍କ ପାଖରେ ଏବେ ଅମଳ ସମୟରେ କୌଣସି କାମ ନାହିଁ।',
    options: [
      'ଏହା ହିଁ ପ୍ରଗତି। ଚାଷୀ ମେସିନ୍ ବ୍ୟବହାର କରିବା ଉଚିତ।',
      'ମେସିନ୍ ବ୍ୟବହାର କର, କିନ୍ତୁ ଶ୍ରମିକଙ୍କୁ ନୂଆ ଦକ୍ଷତା ଶିଖିବାରେ ସାହାଯ୍ୟ କର, ଯେପରି ମେସିନ୍ ଚଳାଇବା ଓ ମରାମତି କରିବା।',
      'ମେସିନ୍ ଯୋଗୁଁ କାମ ହରାଇଥିବା ଶ୍ରମିକଙ୍କୁ ସରକାର ସାହାଯ୍ୟ କରନ୍ତୁ।',
      'ମେସିନ୍‌ରେ କେବଳ କିଛି କାମ କରାଅ, ଯାହାଫଳରେ କିଛି ନିଯୁକ୍ତି ରହିଯିବ।'
    ],
    questions: [
      'ମେସିନ୍ ଶ୍ରମିକଙ୍କ ଜାଗା ନେଲେ କାହାର ଲାଭ ଓ କାହାର କ୍ଷତି ହୁଏ?',
      'ନୂଆ ପ୍ରଯୁକ୍ତି କ’ଣ ନୂଆ କାମ ମଧ୍ୟ ସୃଷ୍ଟି କରିପାରେ? କେଉଁଗୁଡ଼ିକ?',
      'କାମ ହରାଇଥିବା ଶ୍ରମିକଙ୍କୁ ସାହାଯ୍ୟ କରିବା କାହାର କର୍ତ୍ତବ୍ୟ?'
    ],
    consider: [
      'ମେସିନ୍ କଷ୍ଟକର କାମକୁ ଶୀଘ୍ର, ସୁରକ୍ଷିତ ଓ ଶସ୍ତା କରିପାରେ, ଏବଂ ଚାଷୀଙ୍କୁ ଅଧିକ ଶସ୍ୟ ଉତ୍ପାଦନରେ ସାହାଯ୍ୟ କରିପାରେ।',
      'କିନ୍ତୁ ଲାଭ ପ୍ରାୟତଃ ଅଳ୍ପ କିଛି ଲୋକଙ୍କୁ ମିଳେ, ଆଉ ଅନ୍ୟମାନେ ରୋଜଗାର ହରାନ୍ତି।',
      'ତାଲିମ, ନୂଆ ପ୍ରକାରର କାମ ଓ ସହାୟତା ଯୋଜନା ଲୋକଙ୍କୁ ଏହି ପରିବର୍ତ୍ତନ ସହ ଖାପ ଖୁଆଇବାରେ ସାହାଯ୍ୟ କରିପାରେ।'
    ]
  },
  {
    title: 'ସ୍ୱର ନକଲ କରି ଠକେଇ',
    story: 'ଗଭୀର ରାତିରେ ଜେଜେମାଙ୍କ ପାଖକୁ ଏକ ଫୋନ୍ ଆସେ। ତାଙ୍କ ନାତି ରୋହନର ସ୍ୱର, କାନ୍ଦୁଛି: "ଜେଜେମା, ମୋର ଦୁର୍ଘଟଣା ହୋଇଛି! ଏବେ UPI ରେ ₹50,000 ପଠାଅ, ଆଉ ବାପାଙ୍କୁ କହିବ ନାହିଁ।" କିନ୍ତୁ ରୋହନ ତା’ ହଷ୍ଟେଲରେ ନିରାପଦରେ ଶୋଇଛି। ଠକମାନେ ତା’ର ଅନଲାଇନ୍ ଦେଇଥିବା ଭିଡିଓରୁ AI ଦ୍ୱାରା ତା’ ସ୍ୱରର ନକଲ କରିଥିଲେ।',
    options: [
      'ଜେଜେମା ଶୀଘ୍ର ଟଙ୍କା ପଠାନ୍ତୁ। ଯଦି ସତ ହୁଏ?',
      'ଜେଜେମା ଫୋନ୍ କାଟି ରୋହନ ବା ପରିବାରର କାହାକୁ ଜଣାଶୁଣା ନମ୍ବରରେ ଫୋନ୍ କରନ୍ତୁ।',
      'ଏପରି ଫୋନ୍ ଯାଞ୍ଚ ପାଇଁ ପରିବାର ଏକ ଗୁପ୍ତ କୋଡ୍ ଶବ୍ଦ ସ୍ଥିର କରୁ।',
      'ରୋହନ ନିଜ ସ୍ୱର ଥିବା ଭିଡିଓ ଅନଲାଇନ୍ ଦେବା ବନ୍ଦ କରୁ।'
    ],
    questions: [
      'ଏପରି ଠକେଇ ଏତେ ସହଜରେ କାହିଁକି ସଫଳ ହୁଏ?',
      'ଦାୟୀ କିଏ: ଠକ, ସ୍ୱର AI ତିଆରି କରୁଥିବା କମ୍ପାନୀ, ନା ଦୁହେଁ?',
      'ତୁମ ପରିବାରର ବଡ଼ମାନଙ୍କୁ ସୁରକ୍ଷିତ ରହିବାରେ ତୁମେ କିପରି ସାହାଯ୍ୟ କରିପାରିବ?'
    ],
    consider: [
      'AI ମାତ୍ର କିଛି ସେକେଣ୍ଡର ସ୍ୱରରୁ କାହାର ସ୍ୱର ନକଲ କରିପାରେ, ତେଣୁ ଜଣାଶୁଣା ସ୍ୱର ଏବେ ପ୍ରମାଣ ନୁହେଁ।',
      'ଠକମାନେ ଆତଙ୍କ ଓ ଗୋପନୀୟତା ସୃଷ୍ଟି କରନ୍ତି: "ଏବେ", "କାହାକୁ କହିବ ନାହିଁ"। ଅଟକ, ଏବଂ ପ୍ରଥମେ ଯାଞ୍ଚ କର।',
      'ଭାରତରେ ସାଇବର ଠକେଇର ଅଭିଯୋଗ ଶୀଘ୍ର ହେଲ୍ପଲାଇନ୍ 1930 ରେ ବା cybercrime.gov.in ରେ କର।'
    ]
  },
  {
    title: 'କେବେ ନସରୁଥିବା ଭିଡିଓ ଫିଡ୍',
    story: '15 ବର୍ଷର କବୀର ରାତିରେ "ପାଞ୍ଚ ମିନିଟ ପାଇଁ" ଏକ ସର୍ଟ-ଭିଡିଓ ଆପ୍ ଖୋଲେ ଏବଂ ଦୁଇ ଘଣ୍ଟା ପରେ ମୁହଁ ଉଠାଏ। ଆପ୍‌ର AI ଠିକ୍ ଶିଖିନିଏ କେଉଁ ଭିଡିଓ ତାକୁ ବାନ୍ଧି ରଖେ, ଏବଂ ସେପରି ଆହୁରି ଦେଖାଏ। ତା’ର ଶୋଇବା ଓ ନମ୍ବର ଦୁଇଟି କମୁଛି। ସେ ଯେତେ ଅଧିକ ସ୍କ୍ରୋଲ୍ କରେ, କମ୍ପାନୀ ସେତେ ଅଧିକ ରୋଜଗାର କରେ।',
    options: [
      'ଏହା କବୀରର ନିଷ୍ପତ୍ତି। ସେ ନିଜକୁ ସମ୍ଭାଳିବା ଉଚିତ।',
      'ଆପ୍‌ରେ କିଶୋରଙ୍କ ପାଇଁ ଦୈନିକ ସମୟ ସୀମା ଆଗରୁ ଚାଲୁ ରହିବା ଉଚିତ।',
      'ଆପ୍ ଦେଖାଉ ପ୍ରତ୍ୟେକ ଭିଡିଓ କାହିଁକି ସୁପାରିସ କରାଗଲା, ଏବଂ ଲୋକେ ନିଜ ଫିଡ୍ ବଦଳାଇପାରନ୍ତୁ।',
      'ପରିବାର ଓ ସ୍କୁଲ ଫୋନ୍ ବିନା ସମୟ ସ୍ଥିର କରନ୍ତୁ, ଯେପରି ରାତି 10ଟା ପରେ।'
    ],
    questions: [
      'ଏକ ଚତୁର AI ସିଷ୍ଟମ ଜଣେ କିଶୋରଙ୍କ ଧ୍ୟାନ ପାଇଁ ପ୍ରତିଯୋଗିତା କଲେ, ଏହା ନ୍ୟାୟପୂର୍ଣ୍ଣ କି?',
      'ନିଶା ଲଗାଉଥିବା ଡିଜାଇନର କ୍ଷତି ପାଇଁ କମ୍ପାନୀମାନେ ଦାୟୀ ହେବା ଉଚିତ କି?',
      'କେଉଁ ଅଭ୍ୟାସ ତୁମକୁ ସ୍କ୍ରିନ୍ ଟାଇମ୍ ନିଜ ନିୟନ୍ତ୍ରଣରେ ରଖିବାରେ ସାହାଯ୍ୟ କରେ?'
    ],
    consider: [
      'ସୁପାରିସ କରୁଥିବା AI ଏଥିପାଇଁ ତିଆରି ଯେ ତୁମେ ଦେଖୁଥିବ, କାରଣ ଅଧିକ ଦେଖିବା ମାନେ ଅଧିକ ବିଜ୍ଞାପନ।',
      'ଅସରନ୍ତି ସ୍କ୍ରୋଲ୍ ଓ ଅଟୋପ୍ଲେ ଅଟକିବାକୁ କଷ୍ଟକର କରେ। ଏହା ଡିଜାଇନ୍ ଯୋଗୁଁ, ତୁମର ଦୁର୍ବଳତା ନୁହେଁ।',
      'ଛୋଟ ପଦକ୍ଷେପ ସାହାଯ୍ୟ କରେ: ସ୍କ୍ରିନ୍ ଟାଇମ୍ ସୀମା, ରାତିରେ ଶୋଇବା ଘରେ ଫୋନ୍ ନାହିଁ, ଏବଂ ଅଟୋପ୍ଲେ ବନ୍ଦ।'
    ]
  }
] };

/* ---------- ta ---------- */
C.ta = { cards: [
  {
    title: 'வகுப்புத் தோழியின் போலி வீடியோ',
    story: '9ஆம் வகுப்பில் யாரோ ஒருவர் இலவச AI செயலி மூலம் தன் வகுப்புத் தோழி மீராவின் போலி வீடியோவை உருவாக்கினார். அதில் மீரா ஓர் ஆசிரியரைப் பற்றி மோசமாகப் பேசுவது போலத் தெரிகிறது. வீடியோ முழுக்க உண்மையானது போலவே இருக்கிறது. வகுப்பு WhatsApp குழுவில் அது வேகமாகப் பரவுகிறது, மீரா மனமுடைந்து பள்ளிக்கு வரவில்லை. இப்போதுதான் அந்த வீடியோ உங்களுக்கும் வந்திருக்கிறது.',
    options: [
      'சில நண்பர்களுக்கு அனுப்பு. எல்லோரும் ஏற்கெனவே பார்த்துவிட்டார்கள்.',
      'அனுப்ப வேண்டாம், அமைதியாக இரு.',
      'வீடியோ போலி என்று குழுவில் எழுதி, எல்லோரையும் அதை நீக்கச் சொல்.',
      'ஓர் ஆசிரியரிடமோ பெற்றோரிடமோ சொல், தனியாக மீராவுக்குத் துணையாக இரு.'
    ],
    questions: [
      'இந்த வீடியோவால் யாருக்குத் தீங்கு, எப்படி?',
      'போலி வீடியோவை வெறுமனே பகிர்பவரும் பொறுப்பாளியா? ஏன்?',
      'போலி வீடியோ உருவாக்கக்கூடிய செயலிகள் என்ன விதிகளைப் பின்பற்ற வேண்டும்?'
    ],
    consider: [
      'டீப்ஃபேக் ஒருவரின் நற்பெயரையும் மனதையும் காயப்படுத்தும், அது போலி என்று எல்லோருக்கும் தெரிந்த பிறகும்.',
      'ஒவ்வொரு பகிர்வும் தீங்கை மேலும் பரப்புகிறது. பகிராமல் இருப்பது உதவும்; புகார் செய்வது இன்னும் அதிகம் உதவும்.',
      'ஒருவருக்குத் தீங்கு செய்ய போலி வீடியோ உருவாக்குவதும் பரப்புவதும் இந்தியச் சட்டப்படி தண்டனைக்குரியதாகலாம். இத்தகைய வீடியோக்களை cybercrime.gov.in-இல் புகார் செய்யலாம்.'
    ]
  },
  {
    title: 'AI உங்கள் கட்டுரையைத் திருத்துகிறது',
    story: 'ஒரு பள்ளி 10ஆம் வகுப்பு ஆங்கிலக் கட்டுரைகளை AI கருவி மூலம் திருத்த விரும்புகிறது. அது வேகமானது, உடனே கருத்துச் சொல்கிறது. ஆனால் சோதனையில், கடினமான சொற்கள் நிறைந்த நீண்ட கட்டுரைகளுக்கு அது அதிக மதிப்பெண் தந்தது. எளிய ஆங்கிலத்தில் நல்ல கருத்துகளை எழுதிய சில மாணவர்களுக்குக் குறைந்த மதிப்பெண் கிடைத்தது.',
    options: [
      'எல்லாத் திருத்தத்தையும் AI செய்யட்டும். ஆசிரியர்களுக்கு நிறைய நேரம் மிச்சம்.',
      'AI முதல் வரைவுகளுக்கு மட்டும் கருத்துச் சொல்லட்டும். இறுதி மதிப்பெண்ணை ஆசிரியர் தரட்டும்.',
      'AI மதிப்பெண்ணை வைத்துக்கொள், ஆனால் எந்த மாணவரும் ஆசிரியரிடம் மறுதிருத்தம் கேட்கலாம்.',
      'சோதித்து நியாயமானது என்று நிரூபிக்கப்படும் வரை பயன்படுத்த வேண்டாம்.'
    ],
    questions: [
      'திருத்துவதை நியாயமாக்குவது எது? ஓர் இயந்திரம் அதைக் கற்க முடியுமா?',
      'தங்கள் வேலையை AI திருத்தியது என்று மாணவர்களுக்குச் சொல்ல வேண்டுமா?',
      'AI தவறான மதிப்பெண் தந்தால் யார் பொறுப்பு: பள்ளி, நிறுவனம், அல்லது AI?'
    ],
    consider: [
      'AI பழைய எடுத்துக்காட்டுகளிலிருந்து கற்கிறது. அவற்றில் நீண்ட சொற்களுக்குப் பரிசு கிடைத்திருந்தால், AI-யும் அதே பழக்கத்தைப் பிடித்துக்கொள்ளும்.',
      'வெளிப்படைத்தன்மை என்றால், மதிப்பெண் எப்படி வழங்கப்பட்டது என்று மாணவர்களுக்குத் தெரிய வேண்டும், மறுதிருத்தம் கேட்கவும் முடிய வேண்டும்.',
      'தேர்வு மதிப்பெண் போன்ற முக்கிய முடிவுகளுக்கு ஒரு மனிதரே பொறுப்பாக இருக்க வேண்டும்.'
    ]
  },
  {
    title: 'முகம் பார்த்து வருகைப் பதிவு',
    story: 'ஒரு கல்லூரி, ஒவ்வொரு மாணவரின் முகத்தையும் அடையாளம் கண்டு வருகை பதியும் கேமராவை வாயிலில் பொருத்த விரும்புகிறது. இதனால் ஒவ்வொரு வகுப்பிலும் நேரம் மிச்சமாகும், பதிலி வருகையும் நிற்கும். முகப் படங்கள் இந்த அமைப்பை நடத்தும் நிறுவனத்திடம் சேமிக்கப்படும். குறைந்த வெளிச்சத்தில் அது தங்களை அடிக்கடி அடையாளம் காணவில்லை என்று சில மாணவர்கள் சொல்கிறார்கள்.',
    options: [
      'பொருத்திவிடு. அது வேகமானது, பதிலி வருகையை நிறுத்துகிறது.',
      'ஒப்புக்கொள்பவர்களுக்கு மட்டும் பயன்படுத்து. மற்றவர்களுக்குத் தாள் பதிவேடு வை.',
      'முகத் தரவு கல்லூரியிடமே இருந்து, படிப்பு முடிந்ததும் அழிக்கப்பட்டால் மட்டும் பயன்படுத்து.',
      'பயன்படுத்த வேண்டாம். பெயர் அழைத்து வருகை எடுப்பதே போதும்.'
    ],
    questions: [
      'உங்கள் முகம் தனிப்பட்ட தரவா? அதன் கட்டுப்பாடு யாரிடம் இருக்க வேண்டும்?',
      'இந்த முகத் தரவு கசிந்தாலோ தவறாகப் பயன்படுத்தப்பட்டாலோ என்ன ஆகலாம்?',
      'சில மாணவர்களிடம் மட்டும் அமைப்பு அதிகம் தவறு செய்தால், அது இன்னும் நியாயமானதா?'
    ],
    consider: [
      'முகத் தரவு என்பது உயிரியளவியல் (பயோமெட்ரிக்) தரவு. கசிந்துவிட்டால், கடவுச்சொல் போல உங்கள் முகத்தை மாற்ற முடியாது.',
      'இந்தியாவின் டிஜிட்டல் தனிநபர் தரவுப் பாதுகாப்புச் சட்டம், 2023 ஒருவரின் தரவு ஏன் சேகரிக்கப்படுகிறது என்று அவருக்குச் சொல்ல வேண்டும் என்றும், பொதுவாக அவரது ஒப்புதல் தேவை என்றும் கூறுகிறது.',
      'குறைந்த வெளிச்சத்தில் அல்லது சில முகங்களுக்கு முக அடையாளம் அதிகம் தவறலாம், அதனால் மாணவர்கள் தவறாக வராதவர்களாகக் குறிக்கப்படலாம்.'
    ]
  },
  {
    title: 'வீட்டுப்பாடம் செய்த AI',
    story: 'அர்ஜுனின் அறிவியல் திட்டப்பணி நாளை சமர்ப்பிக்க வேண்டும். அவன் தலைப்பை ஒரு AI சாட்பாட்டில் தட்டச்சு செய்கிறான், ஒரே நிமிடத்தில் அது ஒரு நேர்த்தியான, முழுமையான அறிக்கையை எழுதித் தருகிறது. அதைத் தன் வேலை என்று அவன் சமர்ப்பிக்கலாம். அவன் நண்பன், "எல்லோரும் இப்படித்தான் செய்கிறார்கள்" என்கிறான். AI பயன்பாடு பற்றி ஆசிரியர் எதுவும் சொல்லவில்லை.',
    options: [
      'AI அறிக்கையை அப்படியே சமர்ப்பிக்கட்டும். யாருக்கும் தெரியாது.',
      'AI உதவியுடன் தலைப்பைப் புரிந்துகொண்டு, அறிக்கையைத் தானே எழுதட்டும்.',
      'AI அறிக்கையின் சில பகுதிகளைப் பயன்படுத்தட்டும், ஆனால் AI உதவியது என்று தெளிவாகச் சொல்லட்டும்.',
      'எந்த வகை AI உதவி அனுமதிக்கப்படும் என்று ஆசிரியரிடம் கேட்கட்டும்.'
    ],
    questions: [
      'உதவி பெறுவதற்கும் ஏமாற்றுவதற்கும் என்ன வேறுபாடு?',
      'எல்லாச் சிந்தனையையும் AI செய்தால் அர்ஜுன் எதை இழக்கிறான்?',
      'உங்கள் வகுப்பில் வீட்டுப்பாடத்துக்கான நியாயமான AI விதி என்னவாக இருக்க வேண்டும்?'
    ],
    consider: [
      'வீட்டுப்பாடம் என்பது பயிற்சி. AI செய்தால் மதிப்பெண் கூடலாம், ஆனால் கற்றல் கூடாது.',
      'AI சாட்பாட்கள் சரியாகத் தோன்றும் தவறான தகவல்களை உருவாக்கலாம், அதனால் அவற்றின் பதில்களை எப்போதும் சரிபார்க்க வேண்டும்.',
      'AI-யை எப்படிப் பயன்படுத்தினீர்கள் என்று நேர்மையாகச் சொல்வது நம்பிக்கையை வளர்க்கிறது. பல பள்ளிகள் இப்போது AI பற்றித் தெளிவான விதிகளை உருவாக்குகின்றன.'
    ]
  },
  {
    title: 'பாகுபாடு காட்டும் வேலைத் தேர்வு AI',
    story: 'ஒரு பெரிய நிறுவனம் ஆயிரக்கணக்கான வேலை விண்ணப்பங்களை வரிசைப்படுத்த AI-யைப் பயன்படுத்துகிறது. அந்த AI நிறுவனத்தின் கடந்த 10 ஆண்டு வேலைத் தேர்வுகளிலிருந்து கற்றது; அப்போது நிறுவனம் பெரும்பாலும் பெருநகர ஆண்களையே வேலைக்கு எடுத்தது. இப்போது திறமை சமமாக இருந்தாலும், பெண்களுக்கும் சிறு நகர மக்களுக்கும் அது குறைந்த மதிப்பெண் தருகிறது.',
    options: [
      'தொடர்ந்து பயன்படுத்து. அது வேகமானது, நிறுவனம் யாரை வேண்டுமானாலும் எடுக்கலாம்.',
      'பயிற்சித் தரவைச் சரிசெய்து, மீண்டும் பயன்படுத்தும் முன் AI-யின் பாகுபாட்டைச் சோதி.',
      'AI ஒரு குறும்பட்டியல் தயாரிக்கட்டும், ஆனால் இறுதித் தேர்வை மனிதர்கள் செய்து, நிராகரிக்கப்பட்டவற்றையும் சரிபார்க்கட்டும்.',
      'வேலைத் தேர்வில் AI-யை நிறுத்து. மக்களின் வாழ்க்கைப் பணி மிக முக்கியம்.'
    ],
    questions: [
      'யாரும் சொல்லாமலேயே AI எப்படி நியாயமற்றதாக மாறியது?',
      'தங்கள் விண்ணப்பத்தை AI நிராகரித்தது என்று மக்களுக்குச் சொல்ல வேண்டுமா?',
      'வேலைத் தேர்வு AI நியாயமானதா என்று யார் சோதிக்க வேண்டும்: நிறுவனமா, அரசா, வேறு யாராவதா?'
    ],
    consider: [
      'AI பழைய தரவிலிருந்து பாங்குகளைக் கற்கிறது, பழைய நியாயமற்ற பழக்கங்கள் உட்பட. இதையே சார்புநிலை (பயஸ்) என்கிறோம்.',
      'வெவ்வேறு குழுக்களின் (பெண்கள், ஆண்கள், நகரங்கள், சிறு ஊர்கள்) முடிவுகளை ஒப்பிட்டால் மறைந்திருக்கும் சார்புநிலை தெரியலாம்.',
      'தாங்கள் ஏன் நிராகரிக்கப்பட்டோம் என்று மக்கள் அறிய முடிய வேண்டும், ஒரு மனிதர் மீண்டும் பார்க்கக் கேட்கவும் முடிய வேண்டும்.'
    ]
  },
  {
    title: 'தானியங்கிக் காரின் முடிவு',
    story: 'பெங்களூருவின் நெரிசலான சாலையில் ஒரு தானியங்கிக் கார் செல்கிறது. திடீரென ஒரு குழந்தை சாலைக்கு ஓடி வருகிறது. கார் நேரத்துக்கு நிற்க முடியாது. அது தன் பாதையிலேயே போகலாம், அல்லது இருவர் நடந்துகொண்டிருக்கும் நடைபாதைப் பக்கம் திரும்பலாம். இரண்டிலும் யாருக்காவது ஆபத்து. கார் என்ன செய்ய வேண்டும் என்று பொறியாளர்கள் முன்கூட்டியே முடிவு செய்ய வேண்டும்.',
    options: [
      'எப்போதும் முதலில் காருக்குள் இருப்பவர்களைக் காப்பாற்ற வேண்டும்.',
      'எப்போதும் மிகக் குறைவான பேருக்கு ஆபத்து உள்ள வழியைத் தேர்ந்தெடுக்க வேண்டும்.',
      'எப்போதும் வேகமாக பிரேக் போட்டுத் தன் பாதையிலேயே இருக்க வேண்டும். நடைபாதைக்குத் திரும்பவே கூடாது.',
      'இத்தகைய நிலைகளைத் தவிர்க்க முடியும் வரை இந்தக் கார்களைச் சாலையில் அனுமதிக்கக் கூடாது.'
    ],
    questions: [
      'இந்த விதிகளை யார் முடிவு செய்ய வேண்டும்: பொறியாளர்களா, அரசா, மக்களா?',
      'கார் விபத்து ஏற்படுத்தினால் யார் பொறுப்பு: உரிமையாளரா, நிறுவனமா, நிரலாளரா?',
      'தங்கள் கார் என்ன விதிகளைப் பின்பற்றுகிறது என்று வாங்குபவர்களுக்குத் தெரிய வேண்டுமா?'
    ],
    consider: [
      'தானியங்கிக் கார்கள் முன்கூட்டியே வேகம் குறைத்து இத்தகைய தருணங்களைத் தவிர்க்கும்படி வடிவமைக்கப்படுகின்றன, ஆனால் எந்த அமைப்பும் முழுமையானது அல்ல.',
      'இந்த விதிகள் அறம் சார்ந்த முடிவுகள், அதனால் பொறியாளர்கள் மட்டுமல்ல, பலரும் கருத்துச் சொல்ல வேண்டும்.',
      'இத்தகைய கார்களை அனுமதிக்கும் முன், விபத்துக்கு யார் பொறுப்பு என்பதற்குத் தெளிவான விதிகள் வேண்டும்.'
    ]
  },
  {
    title: 'இலவச உடல்நலச் செயலி தரவைப் பகிர்கிறது',
    story: 'பிரியா ஓர் இலவச உடற்பயிற்சிச் செயலியைப் பயன்படுத்துகிறாள்; அது அவளுடைய அடிகள், தூக்கம், இதயத் துடிப்பை எண்ணுகிறது. அவளுடைய எடை, உணவு, மனநிலை பற்றியும் கேட்கிறது. அதன் நீண்ட விதிமுறைகளுக்குள் ஆழத்தில், நிறுவனம் இந்தத் தரவை "கூட்டாளிகளுடன்" பகிரலாம் என்று எழுதியிருக்கிறது. விரைவில் பிரியாவுக்கு எடை குறைப்புப் பொருட்கள், உடல்நலக் காப்பீடு விளம்பரங்கள் வரத் தொடங்குகின்றன.',
    options: [
      'பரவாயில்லை. செயலி இலவசம், அவள் விதிமுறைகளை ஒப்புக்கொண்டாள்.',
      'செயலியை வைத்துக்கொண்டு, அமைப்புகளில் தரவுப் பகிர்வை நிறுத்தட்டும்.',
      'செயலியை நீக்கிவிட்டு, தரவைப் பகிராத செயலியைத் தேர்ந்தெடுக்கட்டும்.',
      'செயலி மீது புகார் செய்யட்டும். உடல்நலத் தரவைப் பகிர நிறுவனங்கள் தெளிவான அனுமதி பெற வேண்டும்.'
    ],
    questions: [
      'செயலி இலவசம் என்றால், நிறுவனம் எப்படிப் பணம் சம்பாதிக்கிறது?',
      'நீண்ட ஆவணத்தில் "ஒப்புக்கொள்கிறேன்" அழுத்துவது உண்மையான ஒப்புதலா?',
      'எந்த உடல்நலத் தகவலைக் கேட்காமல் ஒருபோதும் பகிரக் கூடாது?'
    ],
    consider: [
      'பல இலவசச் செயலிகள் உங்கள் தரவிலிருந்தும் விளம்பரங்களிலிருந்தும் சம்பாதிக்கின்றன. நீங்கள் பணம் கொடுக்கவில்லை என்றால், ஒருவேளை தரவால் விலை கொடுக்கிறீர்கள்.',
      'உடல்நலத் தரவு மிகவும் தனிப்பட்டது. அது காப்பீடு, வேலை, அல்லது மற்றவர்கள் உங்களை நடத்தும் விதத்தைப் பாதிக்கலாம்.',
      'நல்ல செயலி தரவைப் பகிரும் முன் எளிய சொற்களில் தெளிவாகக் கேட்கும். செயலி அனுமதிகளையும் தனியுரிமை அமைப்புகளையும் சரிபாருங்கள்.'
    ]
  },
  {
    title: 'AI ஓவியம் போட்டியில் வென்றது',
    story: 'மாவட்ட ஓவியப் போட்டியின் தலைப்பு "2047-இல் என் இந்தியா". அழகான, நுணுக்கமான ஓர் ஓவியம் முதல் பரிசை வெல்கிறது. பின்னர், அந்த மாணவர் சில வரிகளைத் தட்டச்சு செய்து AI படம் உருவாக்கி மூலம் அதை உருவாக்கியது எல்லோருக்கும் தெரிய வருகிறது. விதிகளில் AI பற்றி எதுவும் இல்லை. மற்ற மாணவர்கள் வாரக்கணக்கில் கையால் வரைந்திருந்தார்கள்.',
    options: [
      'பரிசு அப்படியே இருக்கட்டும். விதிகள் AI-யைத் தடை செய்யவில்லை.',
      'பரிசைத் திரும்பப் பெற்று, கையால் வரைந்த சிறந்த ஓவியத்துக்குக் கொடு.',
      'வென்றவர் பரிசை வைத்துக்கொள்ளட்டும், அடுத்த ஆண்டு முதல் AI ஓவியங்களுக்குத் தனிப் பிரிவு வேண்டும்.',
      'AI பயன்படுத்தியதை அந்த மாணவர் நடுவர்களிடம் சொல்லியிருக்க வேண்டும்.'
    ],
    questions: [
      'ப்ராம்ப்ட் தட்டச்சு செய்வதும் ஓவியம் வரைவதும் ஒன்றா? அதற்கு என்ன திறமைகள் தேவை?',
      'AI படங்களைக் கையால் வரைந்த ஓவியங்களுடன் ஒப்பிடுவது நியாயமா?',
      'AI படக் கருவிகள் லட்சக்கணக்கான கலைஞர்களின் படங்களிலிருந்து கற்றன. அந்தக் கலைஞர்களுக்குப் பெருமை சேர வேண்டுமா?'
    ],
    consider: [
      'ஒன்று எப்படி உருவாக்கப்பட்டது என்று நேர்மையாகச் சொல்வது முக்கியம், விதிகள் தெளிவாக இல்லாவிட்டாலும்.',
      'நியாயமான போட்டி ஒத்த திறமைகளை ஒப்பிடுகிறது. AI பற்றிய தெளிவான விதிகள் எல்லோருக்கும் உதவும்.',
      'AI கலை படைப்பாற்றல் மிக்கதாக இருக்கலாம், ஆனால் AI மற்றவர்களின் படைப்புகளிலிருந்து, பெரும்பாலும் அவர்களைக் கேட்காமலே கற்கிறது.'
    ]
  },
  {
    title: 'பள்ளி நடைக்கூடங்களில் AI கேமராக்கள்',
    story: 'பள்ளியில் ஒரு சண்டைக்குப் பிறகு, எல்லா நடைக்கூடங்களிலும் AI கேமராக்கள் பொருத்தத் தலைமையாசிரியர் திட்டமிடுகிறார். ஓடுவது, கூட்டமாகக் கூடுவது போன்ற "வழக்கத்துக்கு மாறான நடத்தையை" AI கண்டறிந்து ஆசிரியர்களுக்குத் தெரிவிக்கும். மாணவர்கள் பாதுகாப்பாக இருப்பார்கள் என்று பல பெற்றோர் நினைக்கிறார்கள். எப்போதும் கண்காணிக்கப்படுவதாகச் சில மாணவர்கள் உணர்கிறார்கள், சாதாரண விளையாட்டையும் AI பிரச்சினை என்று சொல்லிவிடுமோ என்று அஞ்சுகிறார்கள்.',
    options: [
      'எல்லா இடத்திலும் கேமரா பொருத்து. பாதுகாப்புதான் முதலில்.',
      'வாயில்களிலும் படிக்கட்டுகளிலும் மட்டும் கேமரா பொருத்து, வகுப்பறைகளுக்குள் ஒருபோதும் வேண்டாம்.',
      'கேமரா பொருத்து, ஆனால் என்ன பதிவாகிறது, யார் பார்க்கலாம், எப்போது அழிக்கப்படும் என்று எல்லோருக்கும் சொல்.',
      'AI கேமரா வேண்டாம். அதிக ஆசிரியர்களைப் பணியில் வை, மாணவர்களுடன் பேசு.'
    ],
    questions: [
      'ஒரு கேமரா எப்போதும் உங்களைக் கவனித்தால் உங்களுக்கு எப்படி இருக்கும்?',
      '"வழக்கத்துக்கு மாறான நடத்தை" என்பது எது? அதை யார் முடிவு செய்வது?',
      'வீடியோக்களை யார் பார்க்க வேண்டும், எவ்வளவு காலம் வைத்திருக்க வேண்டும்?'
    ],
    consider: [
      'என்ன நடந்தது என்று அறியக் கேமராக்கள் உதவலாம், ஆனால் தங்களை நம்பவில்லை என்ற உணர்வையும் அவை ஏற்படுத்தலாம்.',
      'வகுப்புக்கு ஓடுவது போன்ற சாதாரண விஷயங்களையும் AI தவறாகப் பிரச்சினை என்று குறிக்கலாம், அதனால் எந்த நடவடிக்கைக்கும் முன் ஒரு மனிதர் சரிபார்க்க வேண்டும்.',
      'என்ன பதிவாகும், யார் பார்ப்பார்கள், எப்போது அழிக்கப்படும் என்ற தெளிவான விதிகள் பாதுகாப்பையும் தனியுரிமையையும் சேர்த்துக் காக்கும்.'
    ]
  },
  {
    title: 'கிராம வேலையைப் பறித்த இயந்திரம்',
    story: 'பஞ்சாபில் ஒரு கிராமத்தில், ஒரு விவசாயி AI வழிகாட்டும் அறுவடை இயந்திரத்தை வாங்குகிறார். அது ஒரே நாளில் அவருடைய கோதுமை வயலை அறுக்கிறது. முன்பு 20 தொழிலாளர்கள் இந்த வேலையை ஒரு வாரத்தில் செய்து ஒவ்வொரு பருவத்திலும் சம்பாதித்தார்கள். விவசாயிக்கு நேரமும் பணமும் மிச்சம், ஆனால் ரமேஷ் போன்ற தொழிலாளர்களுக்கு இப்போது அறுவடைக் காலத்தில் வேலை இல்லை.',
    options: [
      'இதுதான் முன்னேற்றம். விவசாயி இயந்திரத்தைப் பயன்படுத்த வேண்டும்.',
      'இயந்திரத்தைப் பயன்படுத்து, ஆனால் அதை இயக்குவது, பழுது பார்ப்பது போன்ற புதிய திறன்களைக் கற்கத் தொழிலாளர்களுக்கு உதவு.',
      'இயந்திரங்களால் வேலை இழக்கும் தொழிலாளர்களுக்கு அரசு உதவ வேண்டும்.',
      'வேலையின் ஒரு பகுதிக்கு மட்டும் இயந்திரத்தைப் பயன்படுத்து, சில வேலைகள் மிஞ்சட்டும்.'
    ],
    questions: [
      'இயந்திரம் தொழிலாளர்களின் இடத்தைப் பிடிக்கும்போது யாருக்கு லாபம், யாருக்கு நஷ்டம்?',
      'புதிய தொழில்நுட்பம் புதிய வேலைகளையும் உருவாக்குமா? எவை?',
      'வேலை இழந்த தொழிலாளர்களுக்கு உதவுவது யாருடைய கடமை?'
    ],
    consider: [
      'இயந்திரங்கள் கடினமான வேலையை வேகமாகவும் பாதுகாப்பாகவும் மலிவாகவும் ஆக்கலாம், விவசாயிகள் அதிக உணவு விளைவிக்கவும் உதவலாம்.',
      'ஆனால் லாபம் பெரும்பாலும் சிலருக்கே போகிறது, மற்றவர்கள் வருமானத்தை இழக்கிறார்கள்.',
      'பயிற்சி, புதிய வகை வேலைகள், உதவித் திட்டங்கள் ஆகியவை இந்த மாற்றத்துக்கு மக்கள் பழகிக்கொள்ள உதவும்.'
    ]
  },
  {
    title: 'குரல் நகல் மோசடி அழைப்பு',
    story: 'நள்ளிரவில் பாட்டிக்கு ஒரு தொலைபேசி அழைப்பு வருகிறது. பேரன் ரோஹனின் குரல், அழுதுகொண்டே: "பாட்டி, எனக்கு விபத்து ஆகிவிட்டது! இப்போதே UPI மூலம் ₹50,000 அனுப்புங்கள், அப்பாவிடம் சொல்லாதீர்கள்." ஆனால் ரோஹன் தன் விடுதியில் பத்திரமாகத் தூங்கிக்கொண்டிருக்கிறான். அவன் இணையத்தில் போட்ட வீடியோக்களிலிருந்து மோசடிக்காரர்கள் AI மூலம் அவன் குரலை நகலெடுத்திருந்தார்கள்.',
    options: [
      'பாட்டி உடனே பணம் அனுப்பட்டும். உண்மையாக இருந்தால்?',
      'பாட்டி அழைப்பைத் துண்டித்து, தெரிந்த எண்ணில் ரோஹனையோ குடும்பத்தில் ஒருவரையோ அழைக்கட்டும்.',
      'இத்தகைய அழைப்புகளைச் சரிபார்க்கக் குடும்பம் ஒரு ரகசியக் குறிச்சொல்லை முடிவு செய்யட்டும்.',
      'ரோஹன் தன் குரல் உள்ள வீடியோக்களை இணையத்தில் போடுவதை நிறுத்தட்டும்.'
    ],
    questions: [
      'இத்தகைய மோசடிகள் ஏன் இவ்வளவு எளிதாக வெற்றி பெறுகின்றன?',
      'யார் பொறுப்பு: மோசடிக்காரர்களா, குரல் AI உருவாக்கும் நிறுவனங்களா, அல்லது இருவருமா?',
      'உங்கள் குடும்பப் பெரியவர்கள் பாதுகாப்பாக இருக்க நீங்கள் எப்படி உதவலாம்?'
    ],
    consider: [
      'சில நொடி ஒலிப்பதிவிலிருந்தே AI ஒருவரின் குரலை நகலெடுக்க முடியும், அதனால் தெரிந்த குரல் இனி சான்று அல்ல.',
      'மோசடிக்காரர்கள் பதற்றத்தையும் ரகசியத்தையும் உருவாக்குகிறார்கள்: "இப்போதே", "யாரிடமும் சொல்லாதே". நிதானியுங்கள், முதலில் சரிபாருங்கள்.',
      'இந்தியாவில் இணைய மோசடியை உடனே 1930 உதவி எண்ணில் அல்லது cybercrime.gov.in-இல் புகார் செய்யுங்கள்.'
    ]
  },
  {
    title: 'முடிவில்லா வீடியோ ஓட்டம்',
    story: '15 வயது கபீர் இரவில் "ஐந்து நிமிடத்துக்கு" ஒரு குறு-வீடியோ செயலியைத் திறக்கிறான், இரண்டு மணி நேரம் கழித்துத்தான் தலை நிமிர்கிறான். எந்த வீடியோக்கள் அவனைப் பிடித்து வைக்கின்றன என்று செயலியின் AI துல்லியமாகக் கற்று, அதே போன்றவற்றை மேலும் காட்டுகிறது. அவனுடைய தூக்கமும் மதிப்பெண்ணும் குறைந்து வருகின்றன. அவன் எவ்வளவு நேரம் உருட்டுகிறானோ, அவ்வளவு அதிகம் நிறுவனம் சம்பாதிக்கிறது.',
    options: [
      'இது கபீரின் விருப்பம். அவன் தன்னைக் கட்டுப்படுத்திக்கொள்ள வேண்டும்.',
      'செயலிகளில் பதின்வயதினருக்கு நாள்தோறும் நேர வரம்பு இயல்பாகவே இயங்க வேண்டும்.',
      'ஒவ்வொரு வீடியோவும் ஏன் பரிந்துரைக்கப்பட்டது என்று செயலிகள் காட்டி, பயனர்கள் தங்கள் ஓட்டத்தை மாற்ற வழி தர வேண்டும்.',
      'இரவு 10 மணிக்குப் பிறகு போன்ற கைபேசி இல்லாத நேரத்தைக் குடும்பங்களும் பள்ளிகளும் முடிவு செய்ய வேண்டும்.'
    ],
    questions: [
      'ஒரு புத்திசாலி AI அமைப்பு ஒரு பதின்வயதினரின் கவனத்துக்காகப் போட்டி போடுவது நியாயமா?',
      'அடிமையாக்கும் வடிவமைப்பால் ஏற்படும் தீங்குக்கு நிறுவனங்கள் பொறுப்பேற்க வேண்டுமா?',
      'உங்கள் திரை நேரத்தை உங்கள் கட்டுப்பாட்டில் வைக்க எந்தப் பழக்கங்கள் உதவுகின்றன?'
    ],
    consider: [
      'பரிந்துரை AI நீங்கள் தொடர்ந்து பார்க்கும்படி உருவாக்கப்பட்டது, ஏனெனில் அதிகம் பார்ப்பது என்றால் அதிக விளம்பரங்கள்.',
      'முடிவில்லாத உருட்டலும் தானியங்கி இயக்கமும் நிறுத்துவதைக் கடினமாக்குகின்றன. இது வடிவமைப்பால் வருவது, உங்கள் பலவீனம் அல்ல.',
      'சிறு படிகள் உதவும்: திரை நேர வரம்பு, இரவில் படுக்கையறையில் கைபேசி இல்லை, தானியங்கி இயக்கம் நிறுத்தம்.'
    ]
  }
] };

/* ---------- te ---------- */
C.te = { cards: [
  {
    title: 'సహపాఠి నకిలీ వీడియో',
    story: '9వ తరగతిలో ఎవరో ఒక ఉచిత AI యాప్‌తో తమ సహపాఠి మీరా నకిలీ వీడియో తయారుచేశారు. అందులో మీరా ఒక టీచర్ గురించి చెడుగా మాట్లాడుతున్నట్లు కనిపిస్తుంది. వీడియో పూర్తిగా నిజమైనదిలా ఉంది. తరగతి WhatsApp గ్రూప్‌లో అది వేగంగా వ్యాపిస్తోంది, మీరా చాలా బాధపడి బడికి రావడం లేదు. ఇప్పుడే ఆ వీడియో మీకు కూడా వచ్చింది.',
    options: [
      'కొందరు స్నేహితులకు ఫార్వర్డ్ చేయి. అందరూ ఎలాగూ చూసేశారు.',
      'ఫార్వర్డ్ చేయకు, మౌనంగా ఉండు.',
      'వీడియో నకిలీదని గ్రూప్‌లో రాసి, అందరినీ దాన్ని డిలీట్ చేయమని అడుగు.',
      'ఒక టీచర్‌కు లేదా తల్లిదండ్రులకు చెప్పు, మీరాకు విడిగా తోడుగా ఉండు.'
    ],
    questions: [
      'ఈ వీడియో వల్ల ఎవరికి హాని జరుగుతోంది, ఎలా?',
      'నకిలీ వీడియోను కేవలం ఫార్వర్డ్ చేసినవారు కూడా బాధ్యులేనా? ఎందుకు?',
      'నకిలీ వీడియోలు తయారుచేయగల యాప్‌లు ఏ నియమాలు పాటించాలి?'
    ],
    consider: [
      'డీప్‌ఫేక్ ఒకరి పరువునూ మనసునూ దెబ్బతీయగలదు, అది నకిలీ అని తెలిసిన తర్వాత కూడా.',
      'ప్రతి ఫార్వర్డ్ హానిని ఇంకా పెంచుతుంది. ఫార్వర్డ్ చేయకపోవడం సహాయపడుతుంది; ఫిర్యాదు చేయడం ఇంకా ఎక్కువ సహాయపడుతుంది.',
      'ఎవరికైనా హాని చేయడానికి నకిలీ వీడియోలు తయారుచేయడం లేదా పంచడం భారతీయ చట్టం ప్రకారం శిక్షార్హం కావచ్చు. ఇలాంటి వీడియోలపై cybercrime.gov.in లో ఫిర్యాదు చేయవచ్చు.'
    ]
  },
  {
    title: 'AI మీ వ్యాసాలకు మార్కులు వేస్తుంది',
    story: 'ఒక పాఠశాల 10వ తరగతి ఇంగ్లీష్ వ్యాసాలకు AI సాధనంతో మార్కులు వేయించాలనుకుంటోంది. అది వేగంగా పనిచేసి వెంటనే సూచనలు ఇస్తుంది. కానీ ప్రయోగంలో, కష్టమైన పదాలతో నిండిన పొడవైన వ్యాసాలకు అది ఎక్కువ మార్కులు ఇచ్చింది. సరళమైన ఇంగ్లీష్‌లో మంచి ఆలోచనలు రాసిన కొందరు విద్యార్థులకు తక్కువ మార్కులు వచ్చాయి.',
    options: [
      'అన్ని మార్కులూ AI తోనే వేయించండి. టీచర్లకు చాలా సమయం మిగులుతుంది.',
      'AI చిత్తు ప్రతులపై సూచనలకు మాత్రమే. తుది మార్కులు టీచర్లే వేయాలి.',
      'AI మార్కులే ఉంచండి, కానీ ఏ విద్యార్థి అయినా టీచర్‌ను మళ్ళీ చూడమని అడగొచ్చు.',
      'పరీక్షించి న్యాయమైనదని తేలే వరకు దీన్ని వాడకండి.'
    ],
    questions: [
      'మార్కులు వేయడాన్ని న్యాయంగా చేసేది ఏది? ఒక యంత్రం అది నేర్చుకోగలదా?',
      'తమ పనికి AI మార్కులు వేసిందని విద్యార్థులకు చెప్పాలా?',
      'AI తప్పు మార్కు వేస్తే ఎవరు బాధ్యులు: పాఠశాలా, కంపెనీయా, AI యా?'
    ],
    consider: [
      'AI పాత ఉదాహరణల నుండి నేర్చుకుంటుంది. ఆ ఉదాహరణల్లో పెద్ద పదాలకు బహుమతి దక్కితే, AI కూడా అదే అలవాటు పట్టుకుంటుంది.',
      'పారదర్శకత అంటే మార్కులు ఎలా వేశారో విద్యార్థులకు తెలియాలి, మళ్ళీ చూడమని అడిగే వీలు ఉండాలి.',
      'పరీక్ష మార్కుల వంటి ముఖ్యమైన నిర్ణయాలకు ఒక మనిషే బాధ్యుడిగా ఉండాలి.'
    ]
  },
  {
    title: 'ముఖం చూసి హాజరు',
    story: 'ఒక కాలేజీ ప్రతి విద్యార్థి ముఖాన్ని గుర్తించి హాజరు వేసే కెమెరాను గేటు దగ్గర పెట్టాలనుకుంటోంది. దీనివల్ల ప్రతి క్లాసులో సమయం మిగులుతుంది, ప్రాక్సీ హాజరు ఆగుతుంది. ముఖ చిత్రాలను ఈ వ్యవస్థను నడిపే కంపెనీ దాచుకుంటుంది. తక్కువ వెలుతురులో అది తమను తరచూ గుర్తించడం లేదని కొందరు విద్యార్థులు అంటున్నారు.',
    options: [
      'పెట్టేయండి. ఇది వేగంగా ఉంటుంది, ప్రాక్సీ హాజరును ఆపుతుంది.',
      'ఒప్పుకున్న విద్యార్థులకు మాత్రమే వాడండి. మిగతావారికి కాగితం రిజిస్టర్ ఉంచండి.',
      'ముఖ డేటా కాలేజీ దగ్గరే ఉండి, కోర్సు తర్వాత తొలగిస్తేనే వాడండి.',
      'వాడకండి. పేర్లు పిలిచి హాజరు తీసుకోవడం చాలు.'
    ],
    questions: [
      'మీ ముఖం వ్యక్తిగత డేటానా? దానిపై నియంత్రణ ఎవరికి ఉండాలి?',
      'ఈ ముఖ డేటా లీక్ అయినా, దుర్వినియోగమైనా ఏం జరగొచ్చు?',
      'కొందరు విద్యార్థుల విషయంలో వ్యవస్థ ఎక్కువ తప్పులు చేస్తే, అది ఇంకా న్యాయమేనా?'
    ],
    consider: [
      'ముఖ డేటా బయోమెట్రిక్ డేటా. అది లీక్ అయితే పాస్‌వర్డ్‌లా మీ ముఖాన్ని మార్చుకోలేరు.',
      'భారతదేశ డిజిటల్ వ్యక్తిగత డేటా రక్షణ చట్టం, 2023 ప్రకారం ప్రజల డేటా ఎందుకు సేకరిస్తున్నారో వారికి చెప్పాలి, సాధారణంగా వారి అంగీకారం తప్పనిసరి.',
      'తక్కువ వెలుతురులో లేదా కొన్ని ముఖాలకు ఫేస్ రికగ్నిషన్ ఎక్కువ తప్పులు చేయవచ్చు, దాంతో విద్యార్థులు పొరపాటున గైర్హాజరుగా నమోదు కావచ్చు.'
    ]
  },
  {
    title: 'హోంవర్క్ చేసిన AI',
    story: 'అర్జున్ సైన్స్ ప్రాజెక్ట్ రేపు ఇవ్వాలి. అతను అంశాన్ని ఒక AI చాట్‌బాట్‌లో టైప్ చేస్తాడు, ఒక్క నిమిషంలో అది చక్కని, పూర్తి రిపోర్ట్ రాసిస్తుంది. అతను దాన్ని తన సొంత పనిగా ఇవ్వొచ్చు. అతని స్నేహితుడు "అందరూ ఇలాగే చేస్తారు" అంటాడు. AI వాడకం గురించి టీచర్ ఏమీ చెప్పలేదు.',
    options: [
      'AI రిపోర్ట్‌ను ఉన్నది ఉన్నట్లే ఇవ్వాలి. ఎవరికీ తెలియదు.',
      'AI సహాయంతో అంశాన్ని అర్థం చేసుకుని, రిపోర్ట్ తానే రాయాలి.',
      'AI రిపోర్ట్‌లోని కొన్ని భాగాలు వాడుకోవాలి, కానీ AI సహాయం చేసిందని స్పష్టంగా చెప్పాలి.',
      'ఎలాంటి AI సహాయం అనుమతిస్తారో టీచర్‌ను అడగాలి.'
    ],
    questions: [
      'సహాయం తీసుకోవడానికీ, కాపీ కొట్టడానికీ తేడా ఏమిటి?',
      'ఆలోచించే పని అంతా AI చేస్తే అర్జున్ ఏం కోల్పోతాడు?',
      'మీ తరగతిలో హోంవర్క్ కోసం న్యాయమైన AI నియమం ఏం చెప్పాలి?'
    ],
    consider: [
      'హోంవర్క్ అంటే సాధన. AI చేస్తే మార్కులు పెరగొచ్చు, కానీ నేర్చుకోవడం పెరగదు.',
      'AI చాట్‌బాట్‌లు నిజమనిపించే కల్పిత విషయాలు చెప్పగలవు, కాబట్టి వాటి జవాబులు ఎప్పుడూ సరిచూసుకోవాలి.',
      'AI ని ఎలా వాడారో నిజాయితీగా చెప్పడం నమ్మకాన్ని పెంచుతుంది. చాలా పాఠశాలలు ఇప్పుడు AI పై స్పష్టమైన నియమాలు చేస్తున్నాయి.'
    ]
  },
  {
    title: 'పక్షపాతం చూపే నియామక AI',
    story: 'ఒక పెద్ద కంపెనీ వేలాది ఉద్యోగ దరఖాస్తులను వడపోయడానికి AI వాడుతుంది. ఆ AI కంపెనీ గత 10 ఏళ్ల నియామకాల నుండి నేర్చుకుంది; అప్పుడు కంపెనీ ఎక్కువగా పెద్ద నగరాల మగవారినే తీసుకుంది. ఇప్పుడు నైపుణ్యాలు సమానంగా ఉన్నా, మహిళలకూ చిన్న పట్టణాల వారికీ అది తక్కువ స్కోరు ఇస్తోంది.',
    options: [
      'వాడుతూనే ఉండండి. ఇది వేగంగా ఉంది, కంపెనీ ఎవరినైనా తీసుకోవచ్చు.',
      'ట్రైనింగ్ డేటాను సరిచేసి, మళ్ళీ వాడే ముందు AI పక్షపాతాన్ని పరీక్షించండి.',
      'AI ఒక చిన్న జాబితా తయారుచేయాలి, కానీ తుది ఎంపిక మనుషులే చేసి, తిరస్కరించినవీ పరిశీలించాలి.',
      'నియామకాల్లో AI వాడకం ఆపండి. ప్రజల ఉద్యోగ జీవితం చాలా ముఖ్యం.'
    ],
    questions: [
      'ఎవరూ చెప్పకపోయినా AI అన్యాయంగా ఎలా మారింది?',
      'తమ దరఖాస్తును AI తిరస్కరించిందని ప్రజలకు చెప్పాలా?',
      'నియామక AI న్యాయంగా ఉందో లేదో ఎవరు పరీక్షించాలి: కంపెనీయా, ప్రభుత్వమా, ఇంకెవరైనా?'
    ],
    consider: [
      'AI పాత డేటా నుండి నమూనాలు నేర్చుకుంటుంది, పాత అన్యాయపు అలవాట్లతో సహా. దీన్నే పక్షపాతం (బయాస్) అంటారు.',
      'వేర్వేరు వర్గాల (మహిళలు, పురుషులు, నగరాలు, పట్టణాలు) ఫలితాలను పోల్చి చూస్తే దాగి ఉన్న పక్షపాతం బయటపడవచ్చు.',
      'తమను ఎందుకు తిరస్కరించారో ప్రజలకు తెలిసే వీలుండాలి, ఒక మనిషిని మళ్ళీ చూడమని అడిగే వీలూ ఉండాలి.'
    ]
  },
  {
    title: 'సెల్ఫ్-డ్రైవింగ్ కారు నిర్ణయం',
    story: 'బెంగళూరులోని రద్దీ రోడ్డుపై ఒక సెల్ఫ్-డ్రైవింగ్ కారు వెళ్తోంది. అకస్మాత్తుగా ఒక పిల్లవాడు రోడ్డుపైకి పరుగెత్తుకొస్తాడు. కారు సమయానికి ఆగలేదు. అది తన లేన్‌లోనే ఉండొచ్చు, లేదా ఇద్దరు నడుస్తున్న ఫుట్‌పాత్ వైపు తిరగొచ్చు. రెండింటిలోనూ ఎవరో ఒకరికి ప్రమాదం. కారు ఏం చేయాలో ఇంజనీర్లు ముందుగానే నిర్ణయించాలి.',
    options: [
      'ఎప్పుడూ ముందుగా కారు లోపలి వారిని కాపాడాలి.',
      'ఎప్పుడూ అతి తక్కువ మందికి ప్రమాదం ఉండే మార్గాన్ని ఎంచుకోవాలి.',
      'ఎప్పుడూ గట్టిగా బ్రేక్ వేసి తన లేన్‌లోనే ఉండాలి. ఫుట్‌పాత్ వైపు ఎప్పుడూ తిరగకూడదు.',
      'ఇలాంటి పరిస్థితులను తప్పించుకోగలిగే వరకు ఇలాంటి కార్లను రోడ్లపై అనుమతించకూడదు.'
    ],
    questions: [
      'ఈ నియమాలు ఎవరు నిర్ణయించాలి: ఇంజనీర్లా, ప్రభుత్వమా, ప్రజలా?',
      'కారు ప్రమాదం చేస్తే ఎవరు బాధ్యులు: యజమానా, కంపెనీయా, ప్రోగ్రామరా?',
      'తమ కారు ఏ నియమాలు పాటిస్తుందో కొనుగోలుదారులకు తెలియాలా?'
    ],
    consider: [
      'సెల్ఫ్-డ్రైవింగ్ కార్లు ముందుగానే వేగం తగ్గించి ఇలాంటి క్షణాలను తప్పించేలా రూపొందుతాయి, కానీ ఏ వ్యవస్థా పరిపూర్ణం కాదు.',
      'ఈ నియమాలు నైతిక నిర్ణయాలు, కాబట్టి ఇంజనీర్లు మాత్రమే కాదు, చాలా మంది అభిప్రాయం చెప్పాలి.',
      'ఇలాంటి కార్లను అనుమతించే ముందు, ప్రమాదానికి ఎవరు బాధ్యులో స్పష్టమైన నియమాలు ఉండాలి.'
    ]
  },
  {
    title: 'ఉచిత హెల్త్ యాప్ డేటా పంచుతుంది',
    story: 'ప్రియ ఒక ఉచిత ఫిట్‌నెస్ యాప్ వాడుతుంది; అది ఆమె అడుగులు, నిద్ర, గుండె చప్పుడు లెక్కిస్తుంది. ఆమె బరువు, ఆహారం, మూడ్ గురించి కూడా అడుగుతుంది. దాని పొడవాటి నిబంధనల లోతుల్లో, కంపెనీ ఈ డేటాను "భాగస్వాములతో" పంచుకోవచ్చని రాసి ఉంది. త్వరలోనే ప్రియకు బరువు తగ్గించే ఉత్పత్తుల, హెల్త్ ఇన్సూరెన్స్ ప్రకటనలు కనిపించడం మొదలవుతుంది.',
    options: [
      'పర్వాలేదు. యాప్ ఉచితం, ఆమె నిబంధనలకు ఒప్పుకుంది.',
      'యాప్ ఉంచుకుని, సెట్టింగ్‌లలో డేటా షేరింగ్ ఆపేయాలి.',
      'యాప్ తొలగించి, డేటా పంచని యాప్ ఎంచుకోవాలి.',
      'యాప్‌పై ఫిర్యాదు చేయాలి. ఆరోగ్య డేటా పంచడానికి కంపెనీలు స్పష్టమైన అనుమతి తీసుకోవాలి.'
    ],
    questions: [
      'యాప్ ఉచితమైతే, కంపెనీ డబ్బు ఎలా సంపాదిస్తుంది?',
      'పొడవాటి పత్రంపై "నేను అంగీకరిస్తున్నాను" నొక్కడం నిజమైన అంగీకారమా?',
      'ఏ ఆరోగ్య సమాచారాన్ని అడగకుండా ఎప్పుడూ పంచకూడదు?'
    ],
    consider: [
      'చాలా ఉచిత యాప్‌లు మీ డేటా, ప్రకటనల ద్వారా సంపాదిస్తాయి. మీరు డబ్బుతో చెల్లించకపోతే, బహుశా డేటాతో చెల్లిస్తున్నారు.',
      'ఆరోగ్య డేటా చాలా వ్యక్తిగతం. అది బీమా, ఉద్యోగం, లేదా ఇతరులు మిమ్మల్ని చూసే తీరుపై ప్రభావం చూపొచ్చు.',
      'మంచి యాప్ డేటా పంచే ముందు సరళమైన మాటల్లో స్పష్టంగా అడుగుతుంది. యాప్ అనుమతులు, ప్రైవసీ సెట్టింగ్‌లు చూసుకోండి.'
    ]
  },
  {
    title: 'AI చిత్రం పోటీలో గెలిచింది',
    story: 'జిల్లా చిత్రలేఖన పోటీ అంశం "2047లో నా భారతదేశం". అందమైన, సూక్ష్మమైన ఒక చిత్రం మొదటి బహుమతి గెలుచుకుంటుంది. తర్వాత, ఆ విద్యార్థి కొన్ని వాక్యాలు టైప్ చేసి AI ఇమేజ్ జనరేటర్‌తో దాన్ని తయారుచేశాడని అందరికీ తెలుస్తుంది. నియమాల్లో AI ప్రస్తావనే లేదు. మిగతా విద్యార్థులు వారాల తరబడి చేత్తో బొమ్మలు గీశారు.',
    options: [
      'బహుమతి అలాగే ఉండనివ్వండి. నియమాలు AI ని నిషేధించలేదు.',
      'బహుమతి వెనక్కి తీసుకుని, చేత్తో గీసిన ఉత్తమ చిత్రానికి ఇవ్వండి.',
      'విజేత బహుమతి ఉంచుకోవాలి, వచ్చే ఏడాది నుండి AI చిత్రాలకు వేరే విభాగం పెట్టాలి.',
      'AI వాడిన విషయం ఆ విద్యార్థి న్యాయనిర్ణేతలకు చెప్పి ఉండాల్సింది.'
    ],
    questions: [
      'ప్రాంప్ట్ టైప్ చేయడం, బొమ్మ గీయడం ఒకటేనా? దానికి ఏ నైపుణ్యాలు కావాలి?',
      'AI చిత్రాలను చేత్తో గీసిన చిత్రాలతో పోల్చడం న్యాయమా?',
      'AI ఇమేజ్ సాధనాలు లక్షలాది కళాకారుల చిత్రాల నుండి నేర్చుకున్నాయి. ఆ కళాకారులకు గుర్తింపు దక్కాలా?'
    ],
    consider: [
      'ఏదైనా ఎలా తయారైందో నిజాయితీగా చెప్పడం ముఖ్యం, నియమాలు స్పష్టంగా లేకపోయినా.',
      'న్యాయమైన పోటీ ఒకే రకమైన నైపుణ్యాలను పోలుస్తుంది. AI గురించి స్పష్టమైన నియమాలు అందరికీ సహాయపడతాయి.',
      'AI కళ సృజనాత్మకంగా ఉండొచ్చు, కానీ AI ఇతరుల పని నుండి, చాలాసార్లు వారిని అడగకుండానే నేర్చుకుంటుంది.'
    ]
  },
  {
    title: 'బడి వరండాల్లో AI కెమెరాలు',
    story: 'బడిలో ఒక గొడవ తర్వాత, ప్రధానోపాధ్యాయుడు అన్ని వరండాల్లో AI కెమెరాలు పెట్టాలనుకుంటున్నారు. పరుగెత్తడం, గుంపులుగా చేరడం వంటి "అసాధారణ ప్రవర్తన"ను AI గుర్తించి టీచర్లకు తెలియజేస్తుంది. పిల్లలు మరింత సురక్షితంగా ఉంటారని చాలా మంది తల్లిదండ్రులు భావిస్తున్నారు. తమను ఎప్పుడూ గమనిస్తున్నారని కొందరు విద్యార్థులు అనుకుంటున్నారు, మామూలు ఆటను కూడా AI గొడవగా చెబుతుందేమోనని భయపడుతున్నారు.',
    options: [
      'అన్ని చోట్లా కెమెరాలు పెట్టండి. భద్రతే ముందు.',
      'కెమెరాలు గేట్లు, మెట్ల దగ్గర మాత్రమే పెట్టండి, తరగతి గదుల్లో ఎప్పుడూ వద్దు.',
      'కెమెరాలు పెట్టండి, కానీ ఏం రికార్డ్ అవుతుందో, ఎవరు చూడగలరో, ఎప్పుడు తొలగిస్తారో అందరికీ చెప్పండి.',
      'AI కెమెరాలు వద్దు. ఎక్కువ మంది టీచర్లను డ్యూటీలో పెట్టి, విద్యార్థులతో మాట్లాడండి.'
    ],
    questions: [
      'ఒక కెమెరా మిమ్మల్ని ఎప్పుడూ గమనిస్తుంటే మీకు ఎలా అనిపిస్తుంది?',
      '"అసాధారణ ప్రవర్తన" అంటే ఏమిటి? దాన్ని ఎవరు నిర్ణయిస్తారు?',
      'వీడియోలు ఎవరు చూడాలి, వాటిని ఎంత కాలం ఉంచాలి?'
    ],
    consider: [
      'ఏం జరిగిందో తెలుసుకోవడానికి కెమెరాలు సహాయపడతాయి, కానీ తమను నమ్మడం లేదనే భావన కూడా కలిగించవచ్చు.',
      'క్లాసుకు పరుగెత్తడం వంటి మామూలు విషయాలను కూడా AI పొరపాటున సమస్యగా గుర్తించవచ్చు, కాబట్టి ఏ చర్య తీసుకునే ముందైనా ఒక మనిషి సరిచూడాలి.',
      'ఏం రికార్డ్ అవుతుంది, ఎవరు చూస్తారు, ఎప్పుడు తొలగిస్తారు అనే స్పష్టమైన నియమాలు భద్రతనూ గోప్యతనూ రెండింటినీ కాపాడతాయి.'
    ]
  },
  {
    title: 'యంత్రం గ్రామ పనిని లాక్కుంది',
    story: 'పంజాబ్‌లోని ఒక గ్రామంలో, ఒక రైతు AI తో నడిచే స్మార్ట్ కోత యంత్రం కొంటాడు. అది ఒక్క రోజులో అతని గోధుమ పొలాన్ని కోసేస్తుంది. ఇంతకుముందు 20 మంది కూలీలు ఈ పనిని వారంలో చేసి ప్రతి సీజన్‌లో సంపాదించేవారు. రైతుకు సమయం, డబ్బు మిగులుతాయి, కానీ రమేష్ లాంటి కూలీలకు ఇప్పుడు కోతల సమయంలో పని లేదు.',
    options: [
      'ఇదే ప్రగతి. రైతు యంత్రం వాడాలి.',
      'యంత్రం వాడండి, కానీ దాన్ని నడపడం, బాగుచేయడం వంటి కొత్త నైపుణ్యాలు నేర్చుకోవడానికి కూలీలకు సహాయం చేయండి.',
      'యంత్రాల వల్ల పని కోల్పోయిన కూలీలకు ప్రభుత్వం సహాయం చేయాలి.',
      'పనిలో కొంత భాగానికే యంత్రం వాడండి, కొన్ని ఉద్యోగాలు మిగిలేలా.'
    ],
    questions: [
      'యంత్రం కూలీల స్థానాన్ని తీసుకున్నప్పుడు ఎవరికి లాభం, ఎవరికి నష్టం?',
      'కొత్త సాంకేతికత కొత్త ఉద్యోగాలను కూడా సృష్టించగలదా? ఏవి?',
      'పని కోల్పోయిన కూలీలకు సహాయం చేయడం ఎవరి బాధ్యత?'
    ],
    consider: [
      'యంత్రాలు కష్టమైన పనిని వేగంగా, సురక్షితంగా, చౌకగా చేయగలవు, రైతులు ఎక్కువ పంట పండించడానికి సహాయపడగలవు.',
      'కానీ లాభం తరచూ కొందరికే దక్కుతుంది, మిగతావారు ఆదాయం కోల్పోతారు.',
      'శిక్షణ, కొత్త రకాల పనులు, సహాయ పథకాలు ఈ మార్పుకు ప్రజలు అలవాటుపడటానికి సహాయపడతాయి.'
    ]
  },
  {
    title: 'గొంతు నకలుతో మోసపు కాల్',
    story: 'అర్ధరాత్రి నానమ్మకు ఒక ఫోన్ వస్తుంది. మనవడు రోహన్ గొంతు, ఏడుస్తూ: "నానమ్మా, నాకు యాక్సిడెంట్ అయింది! ఇప్పుడే UPI లో ₹50,000 పంపించు, నాన్నకు చెప్పకు." కానీ రోహన్ తన హాస్టల్‌లో క్షేమంగా నిద్రపోతున్నాడు. అతను ఆన్‌లైన్‌లో పెట్టిన వీడియోల నుండి మోసగాళ్లు AI తో అతని గొంతును నకలు చేశారు.',
    options: [
      'నానమ్మ వెంటనే డబ్బు పంపాలి. నిజమైతే?',
      'నానమ్మ ఫోన్ పెట్టేసి, తెలిసిన నంబర్‌కు రోహన్‌కు లేదా కుటుంబంలో ఎవరికైనా ఫోన్ చేయాలి.',
      'ఇలాంటి కాల్స్‌ను సరిచూడటానికి కుటుంబం ఒక రహస్య కోడ్ పదం పెట్టుకోవాలి.',
      'రోహన్ తన గొంతు ఉన్న వీడియోలను ఆన్‌లైన్‌లో పెట్టడం ఆపాలి.'
    ],
    questions: [
      'ఇలాంటి మోసాలు ఇంత సులభంగా ఎందుకు ఫలిస్తాయి?',
      'ఎవరు బాధ్యులు: మోసగాళ్లా, వాయిస్ AI తయారుచేసే కంపెనీలా, లేక ఇద్దరూనా?',
      'మీ కుటుంబంలోని పెద్దలు సురక్షితంగా ఉండటానికి మీరు ఎలా సహాయపడగలరు?'
    ],
    consider: [
      'కొన్ని సెకన్ల ఆడియో నుండే AI ఒకరి గొంతును నకలు చేయగలదు, కాబట్టి తెలిసిన గొంతు ఇక రుజువు కాదు.',
      'మోసగాళ్లు కంగారునూ రహస్యాన్నీ సృష్టిస్తారు: "ఇప్పుడే", "ఎవరికీ చెప్పకు". ఆగండి, ముందు సరిచూసుకోండి.',
      'భారతదేశంలో సైబర్ మోసాన్ని వెంటనే హెల్ప్‌లైన్ 1930 కు లేదా cybercrime.gov.in లో ఫిర్యాదు చేయండి.'
    ]
  },
  {
    title: 'అంతులేని వీడియో ఫీడ్',
    story: '15 ఏళ్ల కబీర్ రాత్రి "ఐదు నిమిషాల కోసం" ఒక షార్ట్-వీడియో యాప్ తెరుస్తాడు, రెండు గంటల తర్వాత తల ఎత్తుతాడు. ఏ వీడియోలు అతన్ని కట్టిపడేస్తాయో యాప్ AI కచ్చితంగా నేర్చుకుని, అలాంటివే ఇంకా చూపిస్తుంది. అతని నిద్ర, మార్కులు రెండూ పడిపోతున్నాయి. అతను ఎంత ఎక్కువ స్క్రోల్ చేస్తే, కంపెనీ అంత ఎక్కువ సంపాదిస్తుంది.',
    options: [
      'ఇది కబీర్ ఇష్టం. అతను తనను తాను అదుపులో ఉంచుకోవాలి.',
      'యాప్‌లలో టీనేజర్లకు రోజువారీ సమయ పరిమితి మొదటి నుండే ఆన్‌లో ఉండాలి.',
      'ప్రతి వీడియోను ఎందుకు సూచించారో యాప్‌లు చూపించి, వాడుకరులు తమ ఫీడ్ మార్చుకునే వీలు ఇవ్వాలి.',
      'రాత్రి 10 తర్వాత వంటి ఫోన్ లేని సమయాన్ని కుటుంబాలు, పాఠశాలలు కలిసి నిర్ణయించాలి.'
    ],
    questions: [
      'ఒక తెలివైన AI వ్యవస్థ ఒక టీనేజర్ దృష్టి కోసం పోటీపడటం న్యాయమా?',
      'వ్యసనం కలిగించే డిజైన్ వల్ల జరిగే హానికి కంపెనీలు బాధ్యత వహించాలా?',
      'మీ స్క్రీన్ టైమ్‌ను మీ అదుపులో ఉంచుకోవడానికి ఏ అలవాట్లు సహాయపడతాయి?'
    ],
    consider: [
      'సూచనలిచ్చే AI మీరు చూస్తూనే ఉండేలా తయారైంది, ఎందుకంటే ఎక్కువ చూడటం అంటే ఎక్కువ ప్రకటనలు.',
      'అంతులేని స్క్రోల్, ఆటోప్లే ఆపడాన్ని కష్టం చేస్తాయి. అది డిజైన్ వల్ల, మీ బలహీనత వల్ల కాదు.',
      'చిన్న అడుగులు సహాయపడతాయి: స్క్రీన్ టైమ్ పరిమితి, రాత్రి పడకగదిలో ఫోన్ వద్దు, ఆటోప్లే ఆఫ్.'
    ]
  }
] };

/* ---------- kn ---------- */
C.kn = { cards: [
  {
    title: 'ಸಹಪಾಠಿಯ ನಕಲಿ ವಿಡಿಯೋ',
    story: '9ನೇ ತರಗತಿಯ ಯಾರೋ ಒಬ್ಬರು ಉಚಿತ AI ಆ್ಯಪ್ ಬಳಸಿ ತಮ್ಮ ಸಹಪಾಠಿ ಮೀರಾಳ ನಕಲಿ ವಿಡಿಯೋ ಮಾಡಿದರು. ಅದರಲ್ಲಿ ಮೀರಾ ಒಬ್ಬ ಶಿಕ್ಷಕರ ಬಗ್ಗೆ ಕೆಟ್ಟದಾಗಿ ಮಾತನಾಡುವಂತೆ ಕಾಣುತ್ತದೆ. ವಿಡಿಯೋ ಸಂಪೂರ್ಣ ನಿಜವೆಂಬಂತೆ ಇದೆ. ತರಗತಿಯ WhatsApp ಗುಂಪಿನಲ್ಲಿ ಅದು ವೇಗವಾಗಿ ಹರಡುತ್ತಿದೆ, ಮೀರಾ ತುಂಬಾ ನೊಂದು ಶಾಲೆಗೆ ಬರುತ್ತಿಲ್ಲ. ಈಗಷ್ಟೇ ಆ ವಿಡಿಯೋ ನಿಮಗೂ ಬಂದಿದೆ.',
    options: [
      'ಕೆಲವು ಗೆಳೆಯರಿಗೆ ಫಾರ್ವರ್ಡ್ ಮಾಡು. ಎಲ್ಲರೂ ಹೇಗಿದ್ದರೂ ನೋಡಿಯಾಗಿದೆ.',
      'ಫಾರ್ವರ್ಡ್ ಮಾಡಬೇಡ, ಸುಮ್ಮನಿರು.',
      'ವಿಡಿಯೋ ನಕಲಿ ಎಂದು ಗುಂಪಿನಲ್ಲಿ ಬರೆದು, ಎಲ್ಲರಿಗೂ ಅದನ್ನು ಅಳಿಸಲು ಹೇಳು.',
      'ಶಿಕ್ಷಕರಿಗೆ ಅಥವಾ ಪೋಷಕರಿಗೆ ತಿಳಿಸು, ಮತ್ತು ಖಾಸಗಿಯಾಗಿ ಮೀರಾಳ ಜೊತೆ ನಿಲ್ಲು.'
    ],
    questions: [
      'ಈ ವಿಡಿಯೋದಿಂದ ಯಾರಿಗೆ ಹಾನಿಯಾಗುತ್ತಿದೆ, ಹೇಗೆ?',
      'ನಕಲಿ ವಿಡಿಯೋವನ್ನು ಕೇವಲ ಫಾರ್ವರ್ಡ್ ಮಾಡುವವರೂ ಹೊಣೆಗಾರರೇ? ಏಕೆ?',
      'ನಕಲಿ ವಿಡಿಯೋ ಮಾಡಬಲ್ಲ ಆ್ಯಪ್‌ಗಳು ಯಾವ ನಿಯಮಗಳನ್ನು ಪಾಲಿಸಬೇಕು?'
    ],
    consider: [
      'ಡೀಪ್‌ಫೇಕ್ ಒಬ್ಬರ ಗೌರವಕ್ಕೂ ಮನಸ್ಸಿಗೂ ನೋವು ಕೊಡಬಹುದು, ಅದು ನಕಲಿ ಎಂದು ಜನರಿಗೆ ತಿಳಿದ ಮೇಲೂ.',
      'ಪ್ರತಿ ಫಾರ್ವರ್ಡ್ ಹಾನಿಯನ್ನು ಇನ್ನಷ್ಟು ಹರಡುತ್ತದೆ. ಫಾರ್ವರ್ಡ್ ಮಾಡದಿರುವುದು ಸಹಾಯ; ದೂರು ನೀಡುವುದು ಇನ್ನೂ ದೊಡ್ಡ ಸಹಾಯ.',
      'ಯಾರಿಗಾದರೂ ಹಾನಿ ಮಾಡಲು ನಕಲಿ ವಿಡಿಯೋ ಮಾಡುವುದು ಅಥವಾ ಹಂಚುವುದು ಭಾರತೀಯ ಕಾನೂನಿನಲ್ಲಿ ಶಿಕ್ಷಾರ್ಹವಾಗಬಹುದು. ಇಂತಹ ವಿಡಿಯೋಗಳ ಬಗ್ಗೆ cybercrime.gov.in ನಲ್ಲಿ ದೂರು ನೀಡಬಹುದು.'
    ]
  },
  {
    title: 'AI ನಿಮ್ಮ ಪ್ರಬಂಧ ತಿದ್ದುತ್ತದೆ',
    story: 'ಒಂದು ಶಾಲೆ 10ನೇ ತರಗತಿಯ ಇಂಗ್ಲಿಷ್ ಪ್ರಬಂಧಗಳನ್ನು AI ಸಾಧನದಿಂದ ತಿದ್ದಿಸಲು ಬಯಸುತ್ತದೆ. ಅದು ವೇಗವಾಗಿದ್ದು ತಕ್ಷಣ ಸಲಹೆ ಕೊಡುತ್ತದೆ. ಆದರೆ ಪ್ರಯೋಗದಲ್ಲಿ, ಕಠಿಣ ಪದಗಳಿಂದ ತುಂಬಿದ ಉದ್ದದ ಪ್ರಬಂಧಗಳಿಗೆ ಅದು ಹೆಚ್ಚು ಅಂಕ ಕೊಟ್ಟಿತು. ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಒಳ್ಳೆಯ ವಿಚಾರಗಳನ್ನು ಬರೆದ ಕೆಲವು ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಕಡಿಮೆ ಅಂಕ ಸಿಕ್ಕಿತು.',
    options: [
      'ಎಲ್ಲಾ ತಿದ್ದುವಿಕೆಯನ್ನೂ AI ಮಾಡಲಿ. ಶಿಕ್ಷಕರಿಗೆ ತುಂಬಾ ಸಮಯ ಉಳಿಯುತ್ತದೆ.',
      'AI ಕರಡುಗಳಿಗೆ ಮಾತ್ರ ಸಲಹೆ ಕೊಡಲಿ. ಅಂತಿಮ ಅಂಕಗಳನ್ನು ಶಿಕ್ಷಕರು ಕೊಡಲಿ.',
      'AI ಅಂಕಗಳನ್ನೇ ಇಡಿ, ಆದರೆ ಯಾವ ವಿದ್ಯಾರ್ಥಿಯಾದರೂ ಶಿಕ್ಷಕರಿಂದ ಮರುಪರಿಶೀಲನೆ ಕೇಳಬಹುದು.',
      'ಪರೀಕ್ಷಿಸಿ ನ್ಯಾಯಯುತ ಎಂದು ಸಾಬೀತಾಗುವವರೆಗೆ ಇದನ್ನು ಬಳಸಬೇಡಿ.'
    ],
    questions: [
      'ತಿದ್ದುವಿಕೆಯನ್ನು ನ್ಯಾಯಯುತವಾಗಿಸುವುದು ಯಾವುದು? ಯಂತ್ರ ಅದನ್ನು ಕಲಿಯಬಲ್ಲದೇ?',
      'ತಮ್ಮ ಕೆಲಸವನ್ನು AI ತಿದ್ದಿದೆ ಎಂದು ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಹೇಳಬೇಕೇ?',
      'AI ತಪ್ಪು ಅಂಕ ಕೊಟ್ಟರೆ ಯಾರು ಹೊಣೆ: ಶಾಲೆಯೇ, ಕಂಪನಿಯೇ, AI ಯೇ?'
    ],
    consider: [
      'AI ಹಳೆಯ ಉದಾಹರಣೆಗಳಿಂದ ಕಲಿಯುತ್ತದೆ. ಆ ಉದಾಹರಣೆಗಳಲ್ಲಿ ಉದ್ದದ ಪದಗಳಿಗೆ ಬಹುಮಾನ ಸಿಕ್ಕಿದ್ದರೆ, AI ಕೂಡ ಅದೇ ಅಭ್ಯಾಸ ಕಲಿಯುತ್ತದೆ.',
      'ಪಾರದರ್ಶಕತೆ ಎಂದರೆ ಅಂಕ ಹೇಗೆ ಕೊಡಲಾಯಿತು ಎಂದು ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ತಿಳಿಯಬೇಕು, ಮರುಪರಿಶೀಲನೆ ಕೇಳುವ ಅವಕಾಶ ಇರಬೇಕು.',
      'ಪರೀಕ್ಷೆಯ ಅಂಕಗಳಂತಹ ಮುಖ್ಯ ನಿರ್ಧಾರಗಳಿಗೆ ಒಬ್ಬ ಮನುಷ್ಯರೇ ಹೊಣೆಯಾಗಿರಬೇಕು.'
    ]
  },
  {
    title: 'ಮುಖ ನೋಡಿ ಹಾಜರಿ',
    story: 'ಒಂದು ಕಾಲೇಜು ಪ್ರತಿ ವಿದ್ಯಾರ್ಥಿಯ ಮುಖ ಗುರುತಿಸಿ ಹಾಜರಿ ಹಾಕುವ ಕ್ಯಾಮೆರಾವನ್ನು ಗೇಟಿನಲ್ಲಿ ಹಾಕಲು ಬಯಸುತ್ತದೆ. ಇದರಿಂದ ಪ್ರತಿ ತರಗತಿಯಲ್ಲಿ ಸಮಯ ಉಳಿಯುತ್ತದೆ, ಪ್ರಾಕ್ಸಿ ಹಾಜರಿ ನಿಲ್ಲುತ್ತದೆ. ಮುಖದ ಫೋಟೋಗಳನ್ನು ಈ ವ್ಯವಸ್ಥೆ ನಡೆಸುವ ಕಂಪನಿ ಇಟ್ಟುಕೊಳ್ಳುತ್ತದೆ. ಕಡಿಮೆ ಬೆಳಕಿನಲ್ಲಿ ಅದು ತಮ್ಮನ್ನು ಆಗಾಗ ಗುರುತಿಸುವುದಿಲ್ಲ ಎಂದು ಕೆಲವು ವಿದ್ಯಾರ್ಥಿಗಳು ಹೇಳುತ್ತಾರೆ.',
    options: [
      'ಹಾಕಿಬಿಡಿ. ಇದು ವೇಗವಾಗಿದೆ, ಪ್ರಾಕ್ಸಿ ಹಾಜರಿ ತಡೆಯುತ್ತದೆ.',
      'ಒಪ್ಪಿದವರಿಗೆ ಮಾತ್ರ ಬಳಸಿ. ಉಳಿದವರಿಗೆ ಕಾಗದದ ರಿಜಿಸ್ಟರ್ ಇಡಿ.',
      'ಮುಖದ ಡೇಟಾ ಕಾಲೇಜಿನಲ್ಲೇ ಇದ್ದು, ಕೋರ್ಸ್ ಮುಗಿದ ಮೇಲೆ ಅಳಿಸಿದರೆ ಮಾತ್ರ ಬಳಸಿ.',
      'ಬಳಸಬೇಡಿ. ಹೆಸರು ಕರೆದು ಹಾಜರಿ ಹಾಕುವುದೇ ಸಾಕು.'
    ],
    questions: [
      'ನಿಮ್ಮ ಮುಖ ವೈಯಕ್ತಿಕ ಡೇಟಾವೇ? ಅದರ ಮೇಲೆ ಯಾರ ನಿಯಂತ್ರಣ ಇರಬೇಕು?',
      'ಈ ಮುಖದ ಡೇಟಾ ಸೋರಿಕೆಯಾದರೆ ಅಥವಾ ದುರುಪಯೋಗವಾದರೆ ಏನಾಗಬಹುದು?',
      'ಕೆಲವು ವಿದ್ಯಾರ್ಥಿಗಳ ವಿಷಯದಲ್ಲಿ ವ್ಯವಸ್ಥೆ ಹೆಚ್ಚು ತಪ್ಪು ಮಾಡಿದರೆ, ಅದು ಆಗಲೂ ನ್ಯಾಯಯುತವೇ?'
    ],
    consider: [
      'ಮುಖದ ಡೇಟಾ ಬಯೋಮೆಟ್ರಿಕ್ ಡೇಟಾ. ಅದು ಸೋರಿಕೆಯಾದರೆ ಪಾಸ್‌ವರ್ಡ್‌ನಂತೆ ನಿಮ್ಮ ಮುಖವನ್ನು ಬದಲಿಸಲು ಆಗುವುದಿಲ್ಲ.',
      'ಭಾರತದ ಡಿಜಿಟಲ್ ವೈಯಕ್ತಿಕ ಡೇಟಾ ರಕ್ಷಣಾ ಕಾಯ್ದೆ, 2023 ಪ್ರಕಾರ ಜನರ ಡೇಟಾ ಏಕೆ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತಿದೆ ಎಂದು ಅವರಿಗೆ ತಿಳಿಸಬೇಕು, ಮತ್ತು ಸಾಮಾನ್ಯವಾಗಿ ಅವರ ಒಪ್ಪಿಗೆ ಬೇಕು.',
      'ಕಡಿಮೆ ಬೆಳಕಿನಲ್ಲಿ ಅಥವಾ ಕೆಲವು ಮುಖಗಳಿಗೆ ಮುಖ ಗುರುತಿಸುವಿಕೆ ಹೆಚ್ಚು ತಪ್ಪು ಮಾಡಬಹುದು, ಇದರಿಂದ ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ತಪ್ಪಾಗಿ ಗೈರುಹಾಜರೆಂದು ಗುರುತಿಸಬಹುದು.'
    ]
  },
  {
    title: 'ಮನೆಕೆಲಸ ಮಾಡಿದ AI',
    story: 'ಅರ್ಜುನನ ವಿಜ್ಞಾನ ಪ್ರಾಜೆಕ್ಟ್ ನಾಳೆ ಕೊಡಬೇಕು. ಅವನು ವಿಷಯವನ್ನು AI ಚಾಟ್‌ಬಾಟ್‌ನಲ್ಲಿ ಟೈಪ್ ಮಾಡುತ್ತಾನೆ, ಒಂದೇ ನಿಮಿಷದಲ್ಲಿ ಅದು ಅಚ್ಚುಕಟ್ಟಾದ, ಪೂರ್ಣ ವರದಿ ಬರೆದುಕೊಡುತ್ತದೆ. ಅವನು ಅದನ್ನು ತನ್ನದೇ ಕೆಲಸವೆಂದು ಕೊಡಬಹುದು. ಅವನ ಗೆಳೆಯ "ಎಲ್ಲರೂ ಹೀಗೆ ಮಾಡುತ್ತಾರೆ" ಎನ್ನುತ್ತಾನೆ. AI ಬಳಕೆಯ ಬಗ್ಗೆ ಶಿಕ್ಷಕರು ಏನೂ ಹೇಳಿಲ್ಲ.',
    options: [
      'AI ವರದಿಯನ್ನು ಇದ್ದಂತೆಯೇ ಕೊಡಲಿ. ಯಾರಿಗೂ ಗೊತ್ತಾಗುವುದಿಲ್ಲ.',
      'AI ಸಹಾಯದಿಂದ ವಿಷಯ ಅರ್ಥಮಾಡಿಕೊಂಡು, ವರದಿಯನ್ನು ತಾನೇ ಬರೆಯಲಿ.',
      'AI ವರದಿಯ ಕೆಲವು ಭಾಗಗಳನ್ನು ಬಳಸಲಿ, ಆದರೆ AI ಸಹಾಯ ಮಾಡಿತು ಎಂದು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಲಿ.',
      'ಯಾವ ರೀತಿಯ AI ಸಹಾಯ ಸರಿ ಎಂದು ಶಿಕ್ಷಕರನ್ನು ಕೇಳಲಿ.'
    ],
    questions: [
      'ಸಹಾಯ ಪಡೆಯುವುದಕ್ಕೂ ನಕಲು ಮಾಡುವುದಕ್ಕೂ ಏನು ವ್ಯತ್ಯಾಸ?',
      'ಎಲ್ಲಾ ಯೋಚನೆಯನ್ನೂ AI ಮಾಡಿದರೆ ಅರ್ಜುನ ಏನನ್ನು ಕಳೆದುಕೊಳ್ಳುತ್ತಾನೆ?',
      'ನಿಮ್ಮ ತರಗತಿಯಲ್ಲಿ ಮನೆಕೆಲಸಕ್ಕೆ ನ್ಯಾಯಯುತ AI ನಿಯಮ ಏನಿರಬೇಕು?'
    ],
    consider: [
      'ಮನೆಕೆಲಸ ಅಭ್ಯಾಸ. AI ಮಾಡಿದರೆ ಅಂಕ ಹೆಚ್ಚಾಗಬಹುದು, ಆದರೆ ಕಲಿಕೆ ಹೆಚ್ಚಾಗುವುದಿಲ್ಲ.',
      'AI ಚಾಟ್‌ಬಾಟ್‌ಗಳು ಸರಿಯೆನಿಸುವ ಸುಳ್ಳು ಮಾಹಿತಿಯನ್ನು ಸೃಷ್ಟಿಸಬಹುದು, ಆದ್ದರಿಂದ ಅವುಗಳ ಉತ್ತರಗಳನ್ನು ಯಾವಾಗಲೂ ಪರಿಶೀಲಿಸಬೇಕು.',
      'AI ಹೇಗೆ ಬಳಸಿದಿರಿ ಎಂದು ಪ್ರಾಮಾಣಿಕವಾಗಿ ಹೇಳುವುದು ನಂಬಿಕೆ ಬೆಳೆಸುತ್ತದೆ. ಹಲವು ಶಾಲೆಗಳು ಈಗ AI ಬಗ್ಗೆ ಸ್ಪಷ್ಟ ನಿಯಮ ಮಾಡುತ್ತಿವೆ.'
    ]
  },
  {
    title: 'ಪಕ್ಷಪಾತ ಮಾಡುವ ನೇಮಕಾತಿ AI',
    story: 'ಒಂದು ದೊಡ್ಡ ಕಂಪನಿ ಸಾವಿರಾರು ಉದ್ಯೋಗ ಅರ್ಜಿಗಳನ್ನು ವಿಂಗಡಿಸಲು AI ಬಳಸುತ್ತದೆ. ಆ AI ಕಂಪನಿಯ ಕಳೆದ 10 ವರ್ಷಗಳ ನೇಮಕಾತಿಯಿಂದ ಕಲಿಯಿತು; ಆಗ ಕಂಪನಿ ಹೆಚ್ಚಾಗಿ ದೊಡ್ಡ ನಗರಗಳ ಗಂಡಸರನ್ನೇ ನೇಮಿಸುತ್ತಿತ್ತು. ಈಗ ಕೌಶಲ ಸಮಾನವಾಗಿದ್ದರೂ, ಮಹಿಳೆಯರಿಗೂ ಸಣ್ಣ ಪಟ್ಟಣಗಳ ಜನರಿಗೂ ಅದು ಕಡಿಮೆ ಅಂಕ ಕೊಡುತ್ತದೆ.',
    options: [
      'ಬಳಸುತ್ತಲೇ ಇರಿ. ಇದು ವೇಗವಾಗಿದೆ, ಕಂಪನಿ ಯಾರನ್ನು ಬೇಕಾದರೂ ನೇಮಿಸಬಹುದು.',
      'ತರಬೇತಿ ಡೇಟಾ ಸರಿಪಡಿಸಿ, ಮತ್ತೆ ಬಳಸುವ ಮೊದಲು AI ಯ ಪಕ್ಷಪಾತ ಪರೀಕ್ಷಿಸಿ.',
      'AI ಒಂದು ಕಿರುಪಟ್ಟಿ ಮಾಡಲಿ, ಆದರೆ ಅಂತಿಮ ಆಯ್ಕೆ ಮನುಷ್ಯರು ಮಾಡಿ, ತಿರಸ್ಕೃತ ಅರ್ಜಿಗಳನ್ನೂ ಪರಿಶೀಲಿಸಲಿ.',
      'ನೇಮಕಾತಿಯಲ್ಲಿ AI ಬಳಕೆ ನಿಲ್ಲಿಸಿ. ಜನರ ವೃತ್ತಿಜೀವನ ತುಂಬಾ ಮುಖ್ಯ.'
    ],
    questions: [
      'ಯಾರೂ ಹೇಳದಿದ್ದರೂ AI ಹೇಗೆ ಅನ್ಯಾಯವಾಯಿತು?',
      'ತಮ್ಮ ಅರ್ಜಿಯನ್ನು AI ತಿರಸ್ಕರಿಸಿತು ಎಂದು ಜನರಿಗೆ ತಿಳಿಸಬೇಕೇ?',
      'ನೇಮಕಾತಿ AI ನ್ಯಾಯಯುತವೇ ಎಂದು ಯಾರು ಪರೀಕ್ಷಿಸಬೇಕು: ಕಂಪನಿಯೇ, ಸರ್ಕಾರವೇ, ಬೇರೆ ಯಾರಾದರೂ?'
    ],
    consider: [
      'AI ಹಳೆಯ ಡೇಟಾದಿಂದ ಮಾದರಿಗಳನ್ನು ಕಲಿಯುತ್ತದೆ, ಹಳೆಯ ಅನ್ಯಾಯದ ಅಭ್ಯಾಸಗಳೂ ಸೇರಿ. ಇದನ್ನೇ ಪಕ್ಷಪಾತ (ಬಯಾಸ್) ಎನ್ನುತ್ತೇವೆ.',
      'ಬೇರೆ ಬೇರೆ ಗುಂಪುಗಳ (ಮಹಿಳೆಯರು ಮತ್ತು ಪುರುಷರು, ನಗರ ಮತ್ತು ಪಟ್ಟಣ) ಫಲಿತಾಂಶ ಹೋಲಿಸಿದರೆ ಅಡಗಿದ ಪಕ್ಷಪಾತ ಕಾಣಬಹುದು.',
      'ತಮ್ಮನ್ನು ಏಕೆ ತಿರಸ್ಕರಿಸಲಾಯಿತು ಎಂದು ಜನರಿಗೆ ತಿಳಿಯುವಂತಿರಬೇಕು, ಮತ್ತು ಒಬ್ಬ ಮನುಷ್ಯರು ಮತ್ತೆ ನೋಡಲು ಕೇಳುವಂತಿರಬೇಕು.'
    ]
  },
  {
    title: 'ಸ್ವಯಂಚಾಲಿತ ಕಾರಿನ ನಿರ್ಧಾರ',
    story: 'ಬೆಂಗಳೂರಿನ ಜನನಿಬಿಡ ರಸ್ತೆಯಲ್ಲಿ ಒಂದು ಸ್ವಯಂಚಾಲಿತ ಕಾರು ಹೋಗುತ್ತಿದೆ. ಇದ್ದಕ್ಕಿದ್ದಂತೆ ಒಂದು ಮಗು ರಸ್ತೆಗೆ ಓಡಿಬರುತ್ತದೆ. ಕಾರು ಸಮಯಕ್ಕೆ ನಿಲ್ಲಲಾರದು. ಅದು ತನ್ನ ಲೇನ್‌ನಲ್ಲೇ ಇರಬಹುದು, ಅಥವಾ ಇಬ್ಬರು ನಡೆಯುತ್ತಿರುವ ಫುಟ್‌ಪಾತ್ ಕಡೆ ತಿರುಗಬಹುದು. ಎರಡರಲ್ಲೂ ಯಾರಿಗಾದರೂ ಅಪಾಯ. ಕಾರು ಏನು ಮಾಡಬೇಕು ಎಂದು ಎಂಜಿನಿಯರ್‌ಗಳು ಮೊದಲೇ ನಿರ್ಧರಿಸಬೇಕು.',
    options: [
      'ಯಾವಾಗಲೂ ಮೊದಲು ಕಾರಿನೊಳಗಿನವರನ್ನು ರಕ್ಷಿಸಬೇಕು.',
      'ಯಾವಾಗಲೂ ಅತಿ ಕಡಿಮೆ ಜನರಿಗೆ ಅಪಾಯವಿರುವ ದಾರಿ ಆರಿಸಬೇಕು.',
      'ಯಾವಾಗಲೂ ಜೋರಾಗಿ ಬ್ರೇಕ್ ಹಾಕಿ ತನ್ನ ಲೇನ್‌ನಲ್ಲೇ ಇರಬೇಕು. ಫುಟ್‌ಪಾತ್ ಕಡೆ ಎಂದಿಗೂ ತಿರುಗಬಾರದು.',
      'ಇಂತಹ ಸನ್ನಿವೇಶ ತಪ್ಪಿಸಲು ಸಾಧ್ಯವಾಗುವವರೆಗೆ ಇಂತಹ ಕಾರುಗಳಿಗೆ ರಸ್ತೆಯಲ್ಲಿ ಅನುಮತಿ ಕೊಡಬಾರದು.'
    ],
    questions: [
      'ಈ ನಿಯಮಗಳನ್ನು ಯಾರು ನಿರ್ಧರಿಸಬೇಕು: ಎಂಜಿನಿಯರ್‌ಗಳೇ, ಸರ್ಕಾರವೇ, ಜನರೇ?',
      'ಕಾರು ಅಪಘಾತ ಮಾಡಿದರೆ ಯಾರು ಹೊಣೆ: ಮಾಲೀಕರೇ, ಕಂಪನಿಯೇ, ಪ್ರೋಗ್ರಾಮರ್ ಏ?',
      'ತಮ್ಮ ಕಾರು ಯಾವ ನಿಯಮ ಪಾಲಿಸುತ್ತದೆ ಎಂದು ಖರೀದಿದಾರರಿಗೆ ತಿಳಿದಿರಬೇಕೇ?'
    ],
    consider: [
      'ಸ್ವಯಂಚಾಲಿತ ಕಾರುಗಳನ್ನು ಮೊದಲೇ ವೇಗ ಇಳಿಸಿ ಇಂತಹ ಕ್ಷಣಗಳನ್ನು ತಪ್ಪಿಸುವಂತೆ ರೂಪಿಸಲಾಗುತ್ತದೆ, ಆದರೆ ಯಾವ ವ್ಯವಸ್ಥೆಯೂ ಪರಿಪೂರ್ಣವಲ್ಲ.',
      'ಈ ನಿಯಮಗಳು ನೈತಿಕ ನಿರ್ಧಾರಗಳು, ಆದ್ದರಿಂದ ಎಂಜಿನಿಯರ್‌ಗಳು ಮಾತ್ರವಲ್ಲ, ಅನೇಕ ಜನರ ಅಭಿಪ್ರಾಯ ಇರಬೇಕು.',
      'ಇಂತಹ ಕಾರುಗಳಿಗೆ ಅನುಮತಿ ಕೊಡುವ ಮೊದಲು ಅಪಘಾತಕ್ಕೆ ಯಾರು ಹೊಣೆ ಎಂಬ ಸ್ಪಷ್ಟ ನಿಯಮಗಳು ಬೇಕು.'
    ]
  },
  {
    title: 'ಉಚಿತ ಆರೋಗ್ಯ ಆ್ಯಪ್ ಡೇಟಾ ಹಂಚುತ್ತದೆ',
    story: 'ಪ್ರಿಯಾ ಒಂದು ಉಚಿತ ಫಿಟ್‌ನೆಸ್ ಆ್ಯಪ್ ಬಳಸುತ್ತಾಳೆ; ಅದು ಅವಳ ಹೆಜ್ಜೆ, ನಿದ್ರೆ, ಹೃದಯಬಡಿತ ಎಣಿಸುತ್ತದೆ. ಅವಳ ತೂಕ, ಆಹಾರ, ಮನಸ್ಥಿತಿಯ ಬಗ್ಗೆಯೂ ಕೇಳುತ್ತದೆ. ಅದರ ಉದ್ದದ ಷರತ್ತುಗಳ ಆಳದಲ್ಲಿ, ಕಂಪನಿ ಈ ಡೇಟಾವನ್ನು "ಪಾಲುದಾರರ" ಜೊತೆ ಹಂಚಿಕೊಳ್ಳಬಹುದು ಎಂದು ಬರೆದಿದೆ. ಬೇಗನೆ ಪ್ರಿಯಾಗೆ ತೂಕ ಇಳಿಸುವ ಉತ್ಪನ್ನಗಳ ಮತ್ತು ಆರೋಗ್ಯ ವಿಮೆಯ ಜಾಹೀರಾತುಗಳು ಕಾಣಲು ಶುರುವಾಗುತ್ತವೆ.',
    options: [
      'ಪರವಾಗಿಲ್ಲ. ಆ್ಯಪ್ ಉಚಿತ, ಅವಳು ಷರತ್ತುಗಳಿಗೆ ಒಪ್ಪಿದ್ದಳು.',
      'ಆ್ಯಪ್ ಇಟ್ಟುಕೊಂಡು, ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಡೇಟಾ ಹಂಚಿಕೆ ಆಫ್ ಮಾಡಲಿ.',
      'ಆ್ಯಪ್ ತೆಗೆದುಹಾಕಿ, ಡೇಟಾ ಹಂಚದ ಆ್ಯಪ್ ಆರಿಸಲಿ.',
      'ಆ್ಯಪ್ ಬಗ್ಗೆ ದೂರು ಕೊಡಲಿ. ಆರೋಗ್ಯ ಡೇಟಾ ಹಂಚಲು ಕಂಪನಿಗಳು ಸ್ಪಷ್ಟ ಅನುಮತಿ ಪಡೆಯಬೇಕು.'
    ],
    questions: [
      'ಆ್ಯಪ್ ಉಚಿತವಾದರೆ, ಕಂಪನಿ ಹಣ ಹೇಗೆ ಗಳಿಸುತ್ತದೆ?',
      'ಉದ್ದದ ದಾಖಲೆಯ ಮೇಲೆ "ನಾನು ಒಪ್ಪುತ್ತೇನೆ" ಒತ್ತುವುದು ನಿಜವಾದ ಒಪ್ಪಿಗೆಯೇ?',
      'ಯಾವ ಆರೋಗ್ಯ ಮಾಹಿತಿಯನ್ನು ಕೇಳದೆ ಎಂದಿಗೂ ಹಂಚಬಾರದು?'
    ],
    consider: [
      'ಅನೇಕ ಉಚಿತ ಆ್ಯಪ್‌ಗಳು ನಿಮ್ಮ ಡೇಟಾ ಮತ್ತು ಜಾಹೀರಾತುಗಳಿಂದ ಗಳಿಸುತ್ತವೆ. ನೀವು ಹಣದಿಂದ ಬೆಲೆ ಕೊಡದಿದ್ದರೆ, ಬಹುಶಃ ಡೇಟಾದಿಂದ ಕೊಡುತ್ತಿದ್ದೀರಿ.',
      'ಆರೋಗ್ಯ ಡೇಟಾ ತುಂಬಾ ಖಾಸಗಿ. ಅದು ವಿಮೆ, ಉದ್ಯೋಗ ಅಥವಾ ಜನ ನಿಮ್ಮನ್ನು ನಡೆಸಿಕೊಳ್ಳುವ ರೀತಿಯ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರಬಹುದು.',
      'ಒಳ್ಳೆಯ ಆ್ಯಪ್ ಡೇಟಾ ಹಂಚುವ ಮೊದಲು ಸರಳ ಪದಗಳಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳುತ್ತದೆ. ಆ್ಯಪ್ ಅನುಮತಿಗಳು ಮತ್ತು ಪ್ರೈವಸಿ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.'
    ]
  },
  {
    title: 'AI ಚಿತ್ರ ಸ್ಪರ್ಧೆ ಗೆದ್ದಿತು',
    story: 'ಜಿಲ್ಲಾ ಚಿತ್ರಕಲಾ ಸ್ಪರ್ಧೆಯ ವಿಷಯ "2047ರಲ್ಲಿ ನನ್ನ ಭಾರತ". ಒಂದು ಸುಂದರ, ಸೂಕ್ಷ್ಮ ಚಿತ್ರ ಮೊದಲ ಬಹುಮಾನ ಗೆಲ್ಲುತ್ತದೆ. ನಂತರ, ಆ ವಿದ್ಯಾರ್ಥಿ ಕೆಲವು ಸಾಲುಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ AI ಇಮೇಜ್ ಜನರೇಟರ್‌ನಿಂದ ಅದನ್ನು ಮಾಡಿದ್ದು ಎಲ್ಲರಿಗೂ ತಿಳಿಯುತ್ತದೆ. ನಿಯಮಗಳಲ್ಲಿ AI ಬಗ್ಗೆ ಉಲ್ಲೇಖವೇ ಇರಲಿಲ್ಲ. ಉಳಿದ ವಿದ್ಯಾರ್ಥಿಗಳು ವಾರಗಟ್ಟಲೆ ಕೈಯಿಂದ ಚಿತ್ರ ಬಿಡಿಸಿದ್ದರು.',
    options: [
      'ಬಹುಮಾನ ಹಾಗೇ ಇರಲಿ. ನಿಯಮಗಳು AI ನಿಷೇಧಿಸಿರಲಿಲ್ಲ.',
      'ಬಹುಮಾನ ವಾಪಸ್ ಪಡೆದು, ಕೈಯಿಂದ ಬಿಡಿಸಿದ ಅತ್ಯುತ್ತಮ ಚಿತ್ರಕ್ಕೆ ಕೊಡಿ.',
      'ವಿಜೇತರು ಬಹುಮಾನ ಇಟ್ಟುಕೊಳ್ಳಲಿ, ಮುಂದಿನ ವರ್ಷದಿಂದ AI ಚಿತ್ರಗಳಿಗೆ ಬೇರೆ ವಿಭಾಗ ಇರಲಿ.',
      'AI ಬಳಸಿದ್ದನ್ನು ಆ ವಿದ್ಯಾರ್ಥಿ ತೀರ್ಪುಗಾರರಿಗೆ ಹೇಳಬೇಕಿತ್ತು.'
    ],
    questions: [
      'ಪ್ರಾಂಪ್ಟ್ ಟೈಪ್ ಮಾಡುವುದು ಚಿತ್ರ ಬಿಡಿಸುವುದಕ್ಕೆ ಸಮವೇ? ಅದಕ್ಕೆ ಯಾವ ಕೌಶಲ ಬೇಕು?',
      'AI ಚಿತ್ರಗಳನ್ನು ಕೈಯಿಂದ ಬಿಡಿಸಿದ ಚಿತ್ರಗಳೊಂದಿಗೆ ಹೋಲಿಸುವುದು ನ್ಯಾಯವೇ?',
      'AI ಇಮೇಜ್ ಸಾಧನಗಳು ಲಕ್ಷಾಂತರ ಕಲಾವಿದರ ಚಿತ್ರಗಳಿಂದ ಕಲಿತಿವೆ. ಆ ಕಲಾವಿದರಿಗೆ ಮನ್ನಣೆ ಸಿಗಬೇಕೇ?'
    ],
    consider: [
      'ಏನನ್ನಾದರೂ ಹೇಗೆ ಮಾಡಲಾಯಿತು ಎಂದು ಪ್ರಾಮಾಣಿಕವಾಗಿ ಹೇಳುವುದು ಮುಖ್ಯ, ನಿಯಮಗಳು ಸ್ಪಷ್ಟವಿಲ್ಲದಿದ್ದರೂ.',
      'ನ್ಯಾಯಯುತ ಸ್ಪರ್ಧೆ ಒಂದೇ ರೀತಿಯ ಕೌಶಲಗಳನ್ನು ಹೋಲಿಸುತ್ತದೆ. AI ಬಗ್ಗೆ ಸ್ಪಷ್ಟ ನಿಯಮಗಳು ಎಲ್ಲರಿಗೂ ಸಹಾಯ ಮಾಡುತ್ತವೆ.',
      'AI ಕಲೆ ಸೃಜನಶೀಲವಾಗಿರಬಹುದು, ಆದರೆ AI ಇತರರ ಕೆಲಸದಿಂದ, ಹೆಚ್ಚಾಗಿ ಅವರನ್ನು ಕೇಳದೆಯೇ ಕಲಿಯುತ್ತದೆ.'
    ]
  },
  {
    title: 'ಶಾಲಾ ಕಾರಿಡಾರ್‌ಗಳಲ್ಲಿ AI ಕ್ಯಾಮೆರಾ',
    story: 'ಶಾಲೆಯಲ್ಲಿ ಒಂದು ಜಗಳದ ನಂತರ, ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು ಎಲ್ಲಾ ಕಾರಿಡಾರ್‌ಗಳಲ್ಲಿ AI ಕ್ಯಾಮೆರಾ ಹಾಕಲು ಯೋಚಿಸುತ್ತಿದ್ದಾರೆ. ಓಡುವುದು ಅಥವಾ ಗುಂಪು ಸೇರುವುದು ಮುಂತಾದ "ಅಸಾಮಾನ್ಯ ವರ್ತನೆ"ಯನ್ನು AI ಗುರುತಿಸಿ ಶಿಕ್ಷಕರಿಗೆ ತಿಳಿಸುತ್ತದೆ. ಮಕ್ಕಳು ಹೆಚ್ಚು ಸುರಕ್ಷಿತರಾಗಿರುತ್ತಾರೆ ಎಂದು ಅನೇಕ ಪೋಷಕರು ಭಾವಿಸುತ್ತಾರೆ. ತಮ್ಮನ್ನು ಸದಾ ಗಮನಿಸಲಾಗುತ್ತಿದೆ ಎಂದು ಕೆಲವು ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಅನಿಸುತ್ತದೆ, ಸಾಮಾನ್ಯ ಆಟವನ್ನೂ AI ತೊಂದರೆ ಎಂದು ವರದಿ ಮಾಡಬಹುದು ಎಂಬ ಭಯವಿದೆ.',
    options: [
      'ಎಲ್ಲೆಡೆ ಕ್ಯಾಮೆರಾ ಹಾಕಿ. ಸುರಕ್ಷತೆಯೇ ಮೊದಲು.',
      'ಕ್ಯಾಮೆರಾಗಳನ್ನು ಗೇಟ್ ಮತ್ತು ಮೆಟ್ಟಿಲುಗಳಲ್ಲಿ ಮಾತ್ರ ಹಾಕಿ, ತರಗತಿಗಳ ಒಳಗೆ ಎಂದಿಗೂ ಬೇಡ.',
      'ಕ್ಯಾಮೆರಾ ಹಾಕಿ, ಆದರೆ ಏನು ರೆಕಾರ್ಡ್ ಆಗುತ್ತದೆ, ಯಾರು ನೋಡಬಹುದು, ಯಾವಾಗ ಅಳಿಸಲಾಗುತ್ತದೆ ಎಂದು ಎಲ್ಲರಿಗೂ ತಿಳಿಸಿ.',
      'AI ಕ್ಯಾಮೆರಾ ಬೇಡ. ಹೆಚ್ಚು ಶಿಕ್ಷಕರನ್ನು ಕರ್ತವ್ಯಕ್ಕೆ ಇಟ್ಟು, ವಿದ್ಯಾರ್ಥಿಗಳ ಜೊತೆ ಮಾತನಾಡಿ.'
    ],
    questions: [
      'ಒಂದು ಕ್ಯಾಮೆರಾ ನಿಮ್ಮನ್ನು ಸದಾ ಗಮನಿಸುತ್ತಿದ್ದರೆ ನಿಮಗೆ ಹೇಗನಿಸುತ್ತದೆ?',
      '"ಅಸಾಮಾನ್ಯ ವರ್ತನೆ" ಎಂದರೆ ಯಾವುದು? ಅದನ್ನು ಯಾರು ನಿರ್ಧರಿಸುತ್ತಾರೆ?',
      'ವಿಡಿಯೋಗಳನ್ನು ಯಾರು ನೋಡಬೇಕು, ಎಷ್ಟು ಕಾಲ ಇಡಬೇಕು?'
    ],
    consider: [
      'ಏನಾಯಿತು ಎಂದು ತಿಳಿಯಲು ಕ್ಯಾಮೆರಾಗಳು ಸಹಾಯ ಮಾಡಬಹುದು, ಆದರೆ ತಮ್ಮನ್ನು ನಂಬುತ್ತಿಲ್ಲ ಎಂಬ ಭಾವನೆಯನ್ನೂ ಮೂಡಿಸಬಹುದು.',
      'ತರಗತಿಗೆ ಓಡುವಂತಹ ಸಾಮಾನ್ಯ ವಿಷಯಗಳನ್ನೂ AI ತಪ್ಪಾಗಿ ತೊಂದರೆ ಎಂದು ಗುರುತಿಸಬಹುದು, ಆದ್ದರಿಂದ ಯಾವುದೇ ಕ್ರಮಕ್ಕೆ ಮೊದಲು ಒಬ್ಬ ಮನುಷ್ಯರು ಪರಿಶೀಲಿಸಬೇಕು.',
      'ಏನು ರೆಕಾರ್ಡ್ ಆಗುತ್ತದೆ, ಯಾರು ನೋಡುತ್ತಾರೆ, ಯಾವಾಗ ಅಳಿಸಲಾಗುತ್ತದೆ ಎಂಬ ಸ್ಪಷ್ಟ ನಿಯಮಗಳು ಸುರಕ್ಷತೆ ಮತ್ತು ಖಾಸಗಿತನ ಎರಡನ್ನೂ ಕಾಪಾಡುತ್ತವೆ.'
    ]
  },
  {
    title: 'ಹಳ್ಳಿಯ ಕೆಲಸ ಕಸಿದ ಯಂತ್ರ',
    story: 'ಪಂಜಾಬಿನ ಒಂದು ಹಳ್ಳಿಯಲ್ಲಿ ಒಬ್ಬ ರೈತ AI ಮಾರ್ಗದರ್ಶನದ ಸ್ಮಾರ್ಟ್ ಕೊಯ್ಲು ಯಂತ್ರ ಖರೀದಿಸುತ್ತಾನೆ. ಅದು ಒಂದೇ ದಿನದಲ್ಲಿ ಅವನ ಗೋಧಿ ಹೊಲವನ್ನು ಕೊಯ್ಯುತ್ತದೆ. ಹಿಂದೆ 20 ಕೂಲಿಕಾರರು ಈ ಕೆಲಸವನ್ನು ಒಂದು ವಾರದಲ್ಲಿ ಮಾಡಿ ಪ್ರತಿ ಹಂಗಾಮಿನಲ್ಲಿ ಗಳಿಸುತ್ತಿದ್ದರು. ರೈತನಿಗೆ ಸಮಯ ಮತ್ತು ಹಣ ಉಳಿಯುತ್ತದೆ, ಆದರೆ ರಮೇಶನಂತಹ ಕೂಲಿಕಾರರಿಗೆ ಈಗ ಕೊಯ್ಲಿನ ಕಾಲದಲ್ಲಿ ಕೆಲಸವಿಲ್ಲ.',
    options: [
      'ಇದೇ ಪ್ರಗತಿ. ರೈತ ಯಂತ್ರ ಬಳಸಬೇಕು.',
      'ಯಂತ್ರ ಬಳಸಿ, ಆದರೆ ಅದನ್ನು ಓಡಿಸುವುದು, ರಿಪೇರಿ ಮಾಡುವುದು ಮುಂತಾದ ಹೊಸ ಕೌಶಲ ಕಲಿಯಲು ಕೂಲಿಕಾರರಿಗೆ ಸಹಾಯ ಮಾಡಿ.',
      'ಯಂತ್ರಗಳಿಂದ ಕೆಲಸ ಕಳೆದುಕೊಂಡ ಕೂಲಿಕಾರರಿಗೆ ಸರ್ಕಾರ ಸಹಾಯ ಮಾಡಬೇಕು.',
      'ಕೆಲಸದ ಒಂದು ಭಾಗಕ್ಕೆ ಮಾತ್ರ ಯಂತ್ರ ಬಳಸಿ, ಕೆಲವು ಉದ್ಯೋಗಗಳು ಉಳಿಯಲಿ.'
    ],
    questions: [
      'ಯಂತ್ರ ಕೂಲಿಕಾರರ ಜಾಗ ಪಡೆದಾಗ ಯಾರಿಗೆ ಲಾಭ, ಯಾರಿಗೆ ನಷ್ಟ?',
      'ಹೊಸ ತಂತ್ರಜ್ಞಾನ ಹೊಸ ಉದ್ಯೋಗಗಳನ್ನೂ ಸೃಷ್ಟಿಸಬಲ್ಲದೇ? ಯಾವುವು?',
      'ಕೆಲಸ ಕಳೆದುಕೊಂಡ ಕೂಲಿಕಾರರಿಗೆ ಸಹಾಯ ಮಾಡುವುದು ಯಾರ ಕರ್ತವ್ಯ?'
    ],
    consider: [
      'ಯಂತ್ರಗಳು ಕಷ್ಟದ ಕೆಲಸವನ್ನು ವೇಗವಾಗಿ, ಸುರಕ್ಷಿತವಾಗಿ, ಅಗ್ಗವಾಗಿ ಮಾಡಬಹುದು, ರೈತರು ಹೆಚ್ಚು ಆಹಾರ ಬೆಳೆಯಲು ಸಹಾಯ ಮಾಡಬಹುದು.',
      'ಆದರೆ ಲಾಭ ಹೆಚ್ಚಾಗಿ ಕೆಲವರಿಗೆ ಮಾತ್ರ ಹೋಗುತ್ತದೆ, ಉಳಿದವರು ಆದಾಯ ಕಳೆದುಕೊಳ್ಳುತ್ತಾರೆ.',
      'ತರಬೇತಿ, ಹೊಸ ಬಗೆಯ ಕೆಲಸ ಮತ್ತು ಬೆಂಬಲ ಯೋಜನೆಗಳು ಈ ಬದಲಾವಣೆಗೆ ಜನರು ಹೊಂದಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡಬಹುದು.'
    ]
  },
  {
    title: 'ಧ್ವನಿ ನಕಲಿನ ವಂಚನೆ ಕರೆ',
    story: 'ತಡರಾತ್ರಿ ಅಜ್ಜಿಗೆ ಒಂದು ಫೋನ್ ಬರುತ್ತದೆ. ಮೊಮ್ಮಗ ರೋಹನ್‌ನ ಧ್ವನಿ, ಅಳುತ್ತಾ: "ಅಜ್ಜಿ, ನನಗೆ ಅಪಘಾತವಾಗಿದೆ! ಈಗಲೇ UPI ಮೂಲಕ ₹50,000 ಕಳುಹಿಸು, ಅಪ್ಪನಿಗೆ ಹೇಳಬೇಡ." ಆದರೆ ರೋಹನ್ ತನ್ನ ಹಾಸ್ಟೆಲ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಮಲಗಿದ್ದಾನೆ. ಅವನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಹಾಕಿದ ವಿಡಿಯೋಗಳಿಂದ ವಂಚಕರು AI ಬಳಸಿ ಅವನ ಧ್ವನಿಯನ್ನು ನಕಲು ಮಾಡಿದ್ದರು.',
    options: [
      'ಅಜ್ಜಿ ಬೇಗ ಹಣ ಕಳುಹಿಸಲಿ. ನಿಜವಾಗಿದ್ದರೆ?',
      'ಅಜ್ಜಿ ಫೋನ್ ಇಟ್ಟು, ಗೊತ್ತಿರುವ ನಂಬರ್‌ಗೆ ರೋಹನ್‌ಗೆ ಅಥವಾ ಕುಟುಂಬದ ಯಾರಿಗಾದರೂ ಕರೆ ಮಾಡಲಿ.',
      'ಇಂತಹ ಕರೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಕುಟುಂಬ ಒಂದು ರಹಸ್ಯ ಕೋಡ್ ಪದ ನಿಗದಿ ಮಾಡಲಿ.',
      'ರೋಹನ್ ತನ್ನ ಧ್ವನಿಯಿರುವ ವಿಡಿಯೋಗಳನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಹಾಕುವುದನ್ನು ನಿಲ್ಲಿಸಲಿ.'
    ],
    questions: [
      'ಇಂತಹ ವಂಚನೆಗಳು ಇಷ್ಟು ಸುಲಭವಾಗಿ ಏಕೆ ಯಶಸ್ವಿಯಾಗುತ್ತವೆ?',
      'ಯಾರು ಹೊಣೆ: ವಂಚಕರೇ, ಧ್ವನಿ AI ಮಾಡುವ ಕಂಪನಿಗಳೇ, ಅಥವಾ ಇಬ್ಬರೂ?',
      'ನಿಮ್ಮ ಕುಟುಂಬದ ಹಿರಿಯರು ಸುರಕ್ಷಿತವಾಗಿರಲು ನೀವು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?'
    ],
    consider: [
      'ಕೆಲವೇ ಸೆಕೆಂಡುಗಳ ಧ್ವನಿಯಿಂದ AI ಯಾರದೇ ಧ್ವನಿಯನ್ನು ನಕಲು ಮಾಡಬಲ್ಲದು, ಆದ್ದರಿಂದ ಪರಿಚಿತ ಧ್ವನಿ ಈಗ ಪುರಾವೆಯಲ್ಲ.',
      'ವಂಚಕರು ಗಾಬರಿ ಮತ್ತು ರಹಸ್ಯ ಸೃಷ್ಟಿಸುತ್ತಾರೆ: "ಈಗಲೇ", "ಯಾರಿಗೂ ಹೇಳಬೇಡ". ನಿಲ್ಲಿ, ಮೊದಲು ಪರಿಶೀಲಿಸಿ.',
      'ಭಾರತದಲ್ಲಿ ಸೈಬರ್ ವಂಚನೆಯ ಬಗ್ಗೆ ತಕ್ಷಣ ಸಹಾಯವಾಣಿ 1930 ಗೆ ಅಥವಾ cybercrime.gov.in ನಲ್ಲಿ ದೂರು ನೀಡಿ.'
    ]
  },
  {
    title: 'ಮುಗಿಯದ ವಿಡಿಯೋ ಫೀಡ್',
    story: '15 ವರ್ಷದ ಕಬೀರ್ ರಾತ್ರಿ "ಐದು ನಿಮಿಷಕ್ಕೆ" ಒಂದು ಶಾರ್ಟ್-ವಿಡಿಯೋ ಆ್ಯಪ್ ತೆರೆಯುತ್ತಾನೆ, ಎರಡು ಗಂಟೆಯ ನಂತರ ತಲೆ ಎತ್ತುತ್ತಾನೆ. ಯಾವ ವಿಡಿಯೋಗಳು ಅವನನ್ನು ಹಿಡಿದಿಡುತ್ತವೆ ಎಂದು ಆ್ಯಪ್‌ನ AI ನಿಖರವಾಗಿ ಕಲಿತು, ಅಂತಹವನ್ನೇ ಇನ್ನಷ್ಟು ತೋರಿಸುತ್ತದೆ. ಅವನ ನಿದ್ರೆ ಮತ್ತು ಅಂಕ ಎರಡೂ ಕುಸಿಯುತ್ತಿವೆ. ಅವನು ಎಷ್ಟು ಹೆಚ್ಚು ಸ್ಕ್ರೋಲ್ ಮಾಡುತ್ತಾನೋ, ಕಂಪನಿ ಅಷ್ಟು ಹೆಚ್ಚು ಗಳಿಸುತ್ತದೆ.',
    options: [
      'ಇದು ಕಬೀರನ ಆಯ್ಕೆ. ಅವನು ತನ್ನನ್ನು ತಾನೇ ನಿಯಂತ್ರಿಸಿಕೊಳ್ಳಬೇಕು.',
      'ಆ್ಯಪ್‌ಗಳಲ್ಲಿ ಹದಿಹರೆಯದವರಿಗೆ ದಿನದ ಸಮಯ ಮಿತಿ ಮೊದಲಿನಿಂದಲೇ ಆನ್ ಆಗಿರಬೇಕು.',
      'ಪ್ರತಿ ವಿಡಿಯೋ ಏಕೆ ಸೂಚಿಸಲಾಯಿತು ಎಂದು ಆ್ಯಪ್‌ಗಳು ತೋರಿಸಿ, ಬಳಕೆದಾರರು ತಮ್ಮ ಫೀಡ್ ಬದಲಿಸುವಂತಿರಬೇಕು.',
      'ರಾತ್ರಿ 10 ರ ನಂತರದಂತಹ ಫೋನ್ ಇಲ್ಲದ ಸಮಯವನ್ನು ಕುಟುಂಬಗಳು ಮತ್ತು ಶಾಲೆಗಳು ಒಪ್ಪಿಕೊಳ್ಳಬೇಕು.'
    ],
    questions: [
      'ಒಂದು ಬುದ್ಧಿವಂತ AI ವ್ಯವಸ್ಥೆ ಹದಿಹರೆಯದವರ ಗಮನಕ್ಕಾಗಿ ಸ್ಪರ್ಧಿಸುವುದು ನ್ಯಾಯವೇ?',
      'ಚಟ ಹಿಡಿಸುವ ವಿನ್ಯಾಸದಿಂದಾಗುವ ಹಾನಿಗೆ ಕಂಪನಿಗಳು ಹೊಣೆಯಾಗಬೇಕೇ?',
      'ನಿಮ್ಮ ಸ್ಕ್ರೀನ್ ಸಮಯವನ್ನು ನಿಮ್ಮ ಹಿಡಿತದಲ್ಲಿ ಇಡಲು ಯಾವ ಅಭ್ಯಾಸಗಳು ಸಹಾಯ ಮಾಡುತ್ತವೆ?'
    ],
    consider: [
      'ಸೂಚಿಸುವ AI ನೀವು ನೋಡುತ್ತಲೇ ಇರುವಂತೆ ಮಾಡಲು ರೂಪಿತವಾಗಿದೆ, ಏಕೆಂದರೆ ಹೆಚ್ಚು ನೋಡುವುದು ಎಂದರೆ ಹೆಚ್ಚು ಜಾಹೀರಾತು.',
      'ಮುಗಿಯದ ಸ್ಕ್ರೋಲ್ ಮತ್ತು ಆಟೋಪ್ಲೇ ನಿಲ್ಲಿಸುವುದನ್ನು ಕಷ್ಟವಾಗಿಸುತ್ತವೆ. ಅದು ವಿನ್ಯಾಸದಿಂದ, ನಿಮ್ಮ ದೌರ್ಬಲ್ಯದಿಂದಲ್ಲ.',
      'ಸಣ್ಣ ಹೆಜ್ಜೆಗಳು ಸಹಾಯ ಮಾಡುತ್ತವೆ: ಸ್ಕ್ರೀನ್ ಸಮಯ ಮಿತಿ, ರಾತ್ರಿ ಮಲಗುವ ಕೋಣೆಯಲ್ಲಿ ಫೋನ್ ಬೇಡ, ಆಟೋಪ್ಲೇ ಆಫ್.'
    ]
  }
] };

/* ---------- ml ---------- */
C.ml = { cards: [
  {
    title: 'സഹപാഠിയുടെ വ്യാജ വീഡിയോ',
    story: 'ഒമ്പതാം ക്ലാസിലെ ആരോ ഒരു സൗജന്യ AI ആപ്പ് ഉപയോഗിച്ച് സഹപാഠി മീരയുടെ വ്യാജ വീഡിയോ ഉണ്ടാക്കി. അതിൽ മീര ഒരു അധ്യാപകനെക്കുറിച്ച് മോശമായി സംസാരിക്കുന്നതുപോലെ തോന്നും. വീഡിയോ തികച്ചും യഥാർത്ഥമാണെന്നേ തോന്നൂ. ക്ലാസിന്റെ WhatsApp ഗ്രൂപ്പിൽ അത് വേഗം പടരുകയാണ്, മീര വിഷമിച്ച് സ്കൂളിൽ വരുന്നില്ല. ഇപ്പോൾ ആ വീഡിയോ നിങ്ങൾക്കും കിട്ടിയിരിക്കുന്നു.',
    options: [
      'കുറച്ച് കൂട്ടുകാർക്ക് ഫോർവേഡ് ചെയ്യൂ. എല്ലാവരും എന്തായാലും കണ്ടുകഴിഞ്ഞു.',
      'ഫോർവേഡ് ചെയ്യരുത്, മിണ്ടാതിരിക്കൂ.',
      'വീഡിയോ വ്യാജമാണെന്ന് ഗ്രൂപ്പിൽ എഴുതി, എല്ലാവരോടും അത് ഡിലീറ്റ് ചെയ്യാൻ പറയൂ.',
      'ഒരു അധ്യാപകനോടോ രക്ഷിതാവിനോടോ പറയൂ, സ്വകാര്യമായി മീരയ്ക്ക് കൂട്ടായിരിക്കൂ.'
    ],
    questions: [
      'ഈ വീഡിയോ ആർക്കാണ് ദോഷം ചെയ്യുന്നത്, എങ്ങനെ?',
      'വ്യാജ വീഡിയോ വെറുതെ ഫോർവേഡ് ചെയ്യുന്നയാളും ഉത്തരവാദിയാണോ? എന്തുകൊണ്ട്?',
      'വ്യാജ വീഡിയോ ഉണ്ടാക്കാൻ കഴിയുന്ന ആപ്പുകൾ എന്തെല്ലാം നിയമങ്ങൾ പാലിക്കണം?'
    ],
    consider: [
      'ഡീപ്ഫേക്ക് ഒരാളുടെ സൽപ്പേരിനും മനസ്സിനും മുറിവേൽപ്പിക്കാം, അത് വ്യാജമാണെന്ന് ആളുകൾ അറിഞ്ഞശേഷവും.',
      'ഓരോ ഫോർവേഡും ദോഷം കൂടുതൽ പരത്തുന്നു. ഫോർവേഡ് ചെയ്യാതിരിക്കുന്നത് സഹായമാണ്; പരാതി നൽകുന്നത് അതിലും വലിയ സഹായമാണ്.',
      'ആരെയെങ്കിലും ഉപദ്രവിക്കാൻ വ്യാജ വീഡിയോ ഉണ്ടാക്കുന്നതും പ്രചരിപ്പിക്കുന്നതും ഇന്ത്യൻ നിയമപ്രകാരം ശിക്ഷാർഹമാകാം. ഇത്തരം വീഡിയോകളെക്കുറിച്ച് cybercrime.gov.in-ൽ പരാതി നൽകാം.'
    ]
  },
  {
    title: 'AI നിങ്ങളുടെ ഉപന്യാസം നോക്കുന്നു',
    story: 'ഒരു സ്കൂൾ പത്താം ക്ലാസിലെ ഇംഗ്ലീഷ് ഉപന്യാസങ്ങൾ ഒരു AI ടൂൾ കൊണ്ട് മാർക്കിടാൻ ആഗ്രഹിക്കുന്നു. അത് വേഗമുള്ളതാണ്, ഉടനെ അഭിപ്രായം നൽകും. പക്ഷേ പരീക്ഷണത്തിൽ, കഠിന വാക്കുകൾ നിറഞ്ഞ നീണ്ട ഉപന്യാസങ്ങൾക്ക് അത് കൂടുതൽ മാർക്ക് നൽകി. ലളിതമായ ഇംഗ്ലീഷിൽ നല്ല ആശയങ്ങൾ എഴുതിയ ചില കുട്ടികൾക്ക് കുറഞ്ഞ മാർക്ക് കിട്ടി.',
    options: [
      'എല്ലാ മാർക്കിടലും AI ചെയ്യട്ടെ. അധ്യാപകർക്ക് ഒരുപാട് സമയം ലാഭിക്കാം.',
      'AI കരടുകൾക്ക് അഭിപ്രായം നൽകാൻ മാത്രം. അന്തിമ മാർക്ക് അധ്യാപകർ നൽകട്ടെ.',
      'AI മാർക്ക് നിലനിർത്തൂ, പക്ഷേ ഏത് കുട്ടിക്കും അധ്യാപകനോട് വീണ്ടും നോക്കാൻ ആവശ്യപ്പെടാം.',
      'പരിശോധിച്ച് നീതിയുക്തമെന്ന് തെളിയുന്നതുവരെ ഇത് ഉപയോഗിക്കരുത്.'
    ],
    questions: [
      'മാർക്കിടലിനെ നീതിയുക്തമാക്കുന്നത് എന്താണ്? ഒരു യന്ത്രത്തിന് അത് പഠിക്കാനാകുമോ?',
      'തങ്ങളുടെ ജോലി AI ആണ് നോക്കിയതെന്ന് കുട്ടികളോട് പറയണോ?',
      'AI തെറ്റായ മാർക്ക് നൽകിയാൽ ആരാണ് ഉത്തരവാദി: സ്കൂളോ, കമ്പനിയോ, AI-യോ?'
    ],
    consider: [
      'AI പഴയ ഉദാഹരണങ്ങളിൽ നിന്നാണ് പഠിക്കുന്നത്. അവയിൽ നീണ്ട വാക്കുകൾക്ക് പ്രതിഫലം കിട്ടിയിരുന്നെങ്കിൽ, AI-യും അതേ ശീലം പകർത്തും.',
      'സുതാര്യത എന്നാൽ മാർക്ക് എങ്ങനെ കിട്ടിയെന്ന് കുട്ടികൾ അറിയണം, വീണ്ടും നോക്കാൻ ആവശ്യപ്പെടാനും കഴിയണം.',
      'പരീക്ഷാ മാർക്ക് പോലുള്ള പ്രധാന തീരുമാനങ്ങളുടെ ഉത്തരവാദിത്തം ഒരു മനുഷ്യന് തന്നെ ആയിരിക്കണം.'
    ]
  },
  {
    title: 'മുഖം നോക്കി ഹാജർ',
    story: 'ഓരോ വിദ്യാർത്ഥിയുടെയും മുഖം തിരിച്ചറിഞ്ഞ് ഹാജർ രേഖപ്പെടുത്തുന്ന ഒരു ക്യാമറ ഗേറ്റിൽ വയ്ക്കാൻ ഒരു കോളേജ് ആഗ്രഹിക്കുന്നു. ഇതുകൊണ്ട് ഓരോ ക്ലാസിലും സമയം ലാഭിക്കാം, പ്രോക്സി ഹാജർ നിലയ്ക്കും. മുഖചിത്രങ്ങൾ ഈ സംവിധാനം നടത്തുന്ന കമ്പനി സൂക്ഷിക്കും. വെളിച്ചം കുറയുമ്പോൾ അത് തങ്ങളെ പലപ്പോഴും തിരിച്ചറിയുന്നില്ലെന്ന് ചില വിദ്യാർത്ഥികൾ പറയുന്നു.',
    options: [
      'വച്ചോളൂ. ഇത് വേഗമുള്ളതാണ്, പ്രോക്സി ഹാജർ തടയും.',
      'സമ്മതിക്കുന്നവർക്ക് മാത്രം ഉപയോഗിക്കൂ. മറ്റുള്ളവർക്ക് പേപ്പർ രജിസ്റ്റർ വയ്ക്കൂ.',
      'മുഖ ഡാറ്റ കോളേജിൽ തന്നെ സൂക്ഷിക്കുകയും കോഴ്സ് കഴിഞ്ഞാൽ മായ്ക്കുകയും ചെയ്യുമെങ്കിൽ മാത്രം ഉപയോഗിക്കൂ.',
      'ഉപയോഗിക്കരുത്. പേര് വിളിച്ച് ഹാജർ എടുക്കുന്നത് മതി.'
    ],
    questions: [
      'നിങ്ങളുടെ മുഖം വ്യക്തിഗത ഡാറ്റയാണോ? അതിന്റെ നിയന്ത്രണം ആർക്കായിരിക്കണം?',
      'ഈ മുഖ ഡാറ്റ ചോരുകയോ ദുരുപയോഗം ചെയ്യപ്പെടുകയോ ചെയ്താൽ എന്ത് സംഭവിക്കാം?',
      'ചില വിദ്യാർത്ഥികളുടെ കാര്യത്തിൽ സംവിധാനം കൂടുതൽ തെറ്റുകൾ വരുത്തിയാൽ, അത് അപ്പോഴും നീതിയുക്തമാണോ?'
    ],
    consider: [
      'മുഖ ഡാറ്റ ബയോമെട്രിക് ഡാറ്റയാണ്. അത് ചോർന്നാൽ പാസ്‌വേഡ് പോലെ മുഖം മാറ്റാൻ കഴിയില്ല.',
      'ഇന്ത്യയുടെ ഡിജിറ്റൽ വ്യക്തിഗത ഡാറ്റാ സംരക്ഷണ നിയമം, 2023 പ്രകാരം ആളുകളുടെ ഡാറ്റ എന്തിനാണ് ശേഖരിക്കുന്നതെന്ന് അവരോട് പറയണം, സാധാരണയായി അവരുടെ സമ്മതവും വേണം.',
      'വെളിച്ചം കുറയുമ്പോഴോ ചില മുഖങ്ങൾക്കോ ഫേസ് റെക്കഗ്നിഷൻ കൂടുതൽ തെറ്റുകൾ വരുത്താം, അതുകൊണ്ട് കുട്ടികൾ തെറ്റായി ഹാജരില്ലാത്തവരായി രേഖപ്പെടുത്തപ്പെടാം.'
    ]
  },
  {
    title: 'ഹോംവർക്ക് ചെയ്ത AI',
    story: 'അർജുന്റെ സയൻസ് പ്രോജക്ട് നാളെ കൊടുക്കണം. അവൻ വിഷയം ഒരു AI ചാറ്റ്ബോട്ടിൽ ടൈപ്പ് ചെയ്യുന്നു, ഒരു മിനിറ്റിനുള്ളിൽ അത് വൃത്തിയുള്ള, പൂർണ്ണമായ ഒരു റിപ്പോർട്ട് എഴുതിത്തരുന്നു. അവന് അത് സ്വന്തം ജോലിയായി കൊടുക്കാം. അവന്റെ കൂട്ടുകാരൻ പറയുന്നു, "എല്ലാവരും ഇങ്ങനെയാ ചെയ്യുന്നത്." AI ഉപയോഗത്തെക്കുറിച്ച് അധ്യാപകൻ ഒന്നും പറഞ്ഞിട്ടില്ല.',
    options: [
      'AI റിപ്പോർട്ട് അതേപടി കൊടുക്കട്ടെ. ആരും അറിയില്ല.',
      'AI-യുടെ സഹായത്തോടെ വിഷയം മനസ്സിലാക്കി, റിപ്പോർട്ട് സ്വയം എഴുതട്ടെ.',
      'AI റിപ്പോർട്ടിന്റെ ചില ഭാഗങ്ങൾ ഉപയോഗിക്കട്ടെ, പക്ഷേ AI സഹായിച്ചെന്ന് വ്യക്തമായി പറയട്ടെ.',
      'ഏതുതരം AI സഹായമാണ് അനുവദനീയമെന്ന് അധ്യാപകനോട് ചോദിക്കട്ടെ.'
    ],
    questions: [
      'സഹായം തേടുന്നതും കോപ്പിയടിക്കുന്നതും തമ്മിലുള്ള വ്യത്യാസം എന്താണ്?',
      'ചിന്തിക്കുന്ന ജോലി മുഴുവൻ AI ചെയ്താൽ അർജുന് എന്താണ് നഷ്ടമാകുന്നത്?',
      'നിങ്ങളുടെ ക്ലാസിൽ ഹോംവർക്കിനുള്ള നീതിയുക്തമായ AI നിയമം എന്തായിരിക്കണം?'
    ],
    consider: [
      'ഹോംവർക്ക് പരിശീലനമാണ്. AI ചെയ്താൽ മാർക്ക് കൂടിയേക്കാം, പക്ഷേ പഠനം കൂടില്ല.',
      'AI ചാറ്റ്ബോട്ടുകൾ ശരിയെന്ന് തോന്നുന്ന കെട്ടിച്ചമച്ച വിവരങ്ങൾ പറയാം, അതുകൊണ്ട് അവയുടെ ഉത്തരങ്ങൾ എപ്പോഴും പരിശോധിക്കണം.',
      'AI എങ്ങനെ ഉപയോഗിച്ചെന്ന് സത്യസന്ധമായി പറയുന്നത് വിശ്വാസം വളർത്തും. പല സ്കൂളുകളും ഇപ്പോൾ AI-യെക്കുറിച്ച് വ്യക്തമായ നിയമങ്ങൾ ഉണ്ടാക്കുന്നു.'
    ]
  },
  {
    title: 'പക്ഷപാതമുള്ള നിയമന AI',
    story: 'ഒരു വലിയ കമ്പനി ആയിരക്കണക്കിന് ജോലി അപേക്ഷകൾ തരംതിരിക്കാൻ AI ഉപയോഗിക്കുന്നു. കമ്പനിയുടെ കഴിഞ്ഞ 10 വർഷത്തെ നിയമനങ്ങളിൽ നിന്നാണ് ആ AI പഠിച്ചത്; അന്ന് കമ്പനി കൂടുതലും വൻനഗരങ്ങളിലെ പുരുഷന്മാരെയാണ് എടുത്തിരുന്നത്. ഇപ്പോൾ കഴിവ് തുല്യമാണെങ്കിലും സ്ത്രീകൾക്കും ചെറുപട്ടണങ്ങളിലുള്ളവർക്കും അത് കുറഞ്ഞ സ്കോർ നൽകുന്നു.',
    options: [
      'ഉപയോഗിക്കുന്നത് തുടരൂ. ഇത് വേഗമുള്ളതാണ്, കമ്പനിക്ക് ഇഷ്ടമുള്ളവരെ എടുക്കാം.',
      'ട്രെയിനിംഗ് ഡാറ്റ ശരിയാക്കി, വീണ്ടും ഉപയോഗിക്കുംമുമ്പ് AI-യുടെ പക്ഷപാതം പരിശോധിക്കൂ.',
      'AI ഒരു ചുരുക്കപ്പട്ടിക തയ്യാറാക്കട്ടെ, പക്ഷേ അന്തിമ തിരഞ്ഞെടുപ്പ് മനുഷ്യർ നടത്തുകയും തള്ളിയവയും പരിശോധിക്കുകയും ചെയ്യട്ടെ.',
      'നിയമനത്തിൽ AI ഉപയോഗം നിർത്തൂ. ആളുകളുടെ കരിയർ വളരെ പ്രധാനമാണ്.'
    ],
    questions: [
      'ആരും പറയാതെ തന്നെ AI എങ്ങനെ അന്യായമായി?',
      'തങ്ങളുടെ അപേക്ഷ AI ആണ് തള്ളിയതെന്ന് ആളുകളെ അറിയിക്കണോ?',
      'നിയമന AI നീതിയുക്തമാണോ എന്ന് ആര് പരിശോധിക്കണം: കമ്പനിയോ, സർക്കാരോ, മറ്റാരെങ്കിലുമോ?'
    ],
    consider: [
      'AI പഴയ ഡാറ്റയിൽ നിന്ന് മാതൃകകൾ പഠിക്കുന്നു, പഴയ അന്യായ ശീലങ്ങൾ ഉൾപ്പെടെ. ഇതിനെയാണ് പക്ഷപാതം (ബയസ്) എന്ന് പറയുന്നത്.',
      'വ്യത്യസ്ത വിഭാഗങ്ങളുടെ (സ്ത്രീകളും പുരുഷന്മാരും, നഗരങ്ങളും പട്ടണങ്ങളും) ഫലങ്ങൾ താരതമ്യം ചെയ്താൽ ഒളിഞ്ഞിരിക്കുന്ന പക്ഷപാതം കാണാം.',
      'തങ്ങളെ എന്തുകൊണ്ട് തള്ളിയെന്ന് ആളുകൾക്ക് അറിയാൻ കഴിയണം, ഒരു മനുഷ്യനോട് വീണ്ടും നോക്കാൻ ആവശ്യപ്പെടാനും കഴിയണം.'
    ]
  },
  {
    title: 'സ്വയം ഓടുന്ന കാറിന്റെ തീരുമാനം',
    story: 'ബെംഗളൂരുവിലെ തിരക്കേറിയ റോഡിലൂടെ ഒരു സ്വയം ഓടുന്ന കാർ പോകുന്നു. പെട്ടെന്ന് ഒരു കുട്ടി റോഡിലേക്ക് ഓടിവരുന്നു. കാറിന് കൃത്യസമയത്ത് നിൽക്കാനാവില്ല. അതിന് സ്വന്തം ലെയിനിൽ തുടരാം, അല്ലെങ്കിൽ രണ്ടുപേർ നടക്കുന്ന നടപ്പാതയിലേക്ക് തിരിയാം. രണ്ടിലും ആർക്കെങ്കിലും അപകടമുണ്ട്. കാർ എന്ത് ചെയ്യണമെന്ന് എഞ്ചിനീയർമാർ മുൻകൂട്ടി തീരുമാനിക്കണം.',
    options: [
      'എപ്പോഴും ആദ്യം കാറിനുള്ളിലുള്ളവരെ രക്ഷിക്കണം.',
      'എപ്പോഴും ഏറ്റവും കുറച്ച് പേർക്ക് അപകടമുള്ള വഴി തിരഞ്ഞെടുക്കണം.',
      'എപ്പോഴും ശക്തമായി ബ്രേക്ക് ചെയ്ത് സ്വന്തം ലെയിനിൽ തുടരണം. ഒരിക്കലും നടപ്പാതയിലേക്ക് തിരിയരുത്.',
      'ഇത്തരം സാഹചര്യങ്ങൾ ഒഴിവാക്കാൻ കഴിയുംവരെ ഇത്തരം കാറുകൾ റോഡിൽ അനുവദിക്കരുത്.'
    ],
    questions: [
      'ഈ നിയമങ്ങൾ ആര് തീരുമാനിക്കണം: എഞ്ചിനീയർമാരോ, സർക്കാരോ, ജനങ്ങളോ?',
      'കാർ അപകടമുണ്ടാക്കിയാൽ ആരാണ് ഉത്തരവാദി: ഉടമയോ, കമ്പനിയോ, പ്രോഗ്രാമറോ?',
      'തങ്ങളുടെ കാർ ഏത് നിയമങ്ങൾ പാലിക്കുന്നുവെന്ന് വാങ്ങുന്നവർ അറിയണോ?'
    ],
    consider: [
      'സ്വയം ഓടുന്ന കാറുകൾ നേരത്തെ വേഗം കുറച്ച് ഇത്തരം നിമിഷങ്ങൾ ഒഴിവാക്കുന്ന രീതിയിലാണ് രൂപകൽപ്പന ചെയ്യുന്നത്, പക്ഷേ ഒരു സംവിധാനവും പൂർണ്ണമല്ല.',
      'ഈ നിയമങ്ങൾ ധാർമ്മിക തീരുമാനങ്ങളാണ്, അതുകൊണ്ട് എഞ്ചിനീയർമാർ മാത്രമല്ല, ഒരുപാട് ആളുകൾ അഭിപ്രായം പറയണം.',
      'ഇത്തരം കാറുകൾ അനുവദിക്കുംമുമ്പ്, അപകടത്തിന് ആരാണ് ഉത്തരവാദിയെന്ന് വ്യക്തമായ നിയമങ്ങൾ വേണം.'
    ]
  },
  {
    title: 'സൗജന്യ ഹെൽത്ത് ആപ്പ് ഡാറ്റ പങ്കിടുന്നു',
    story: 'പ്രിയ ഒരു സൗജന്യ ഫിറ്റ്നസ് ആപ്പ് ഉപയോഗിക്കുന്നു; അത് അവളുടെ ചുവടുകൾ, ഉറക്കം, ഹൃദയമിടിപ്പ് എന്നിവ എണ്ണുന്നു. അവളുടെ ഭാരം, ഭക്ഷണം, മാനസികാവസ്ഥ എന്നിവയെക്കുറിച്ചും ചോദിക്കുന്നു. അതിന്റെ നീണ്ട നിബന്ധനകളുടെ ഉള്ളിൽ, കമ്പനി ഈ ഡാറ്റ "പങ്കാളികളുമായി" പങ്കിട്ടേക്കാം എന്ന് എഴുതിയിട്ടുണ്ട്. താമസിയാതെ പ്രിയയ്ക്ക് ഭാരം കുറയ്ക്കുന്ന ഉൽപ്പന്നങ്ങളുടെയും ആരോഗ്യ ഇൻഷുറൻസിന്റെയും പരസ്യങ്ങൾ കണ്ടുതുടങ്ങുന്നു.',
    options: [
      'കുഴപ്പമില്ല. ആപ്പ് സൗജന്യമാണ്, അവൾ നിബന്ധനകൾ സമ്മതിച്ചതാണ്.',
      'ആപ്പ് നിലനിർത്തി, സെറ്റിംഗ്സിൽ ഡാറ്റ പങ്കിടൽ ഓഫ് ചെയ്യട്ടെ.',
      'ആപ്പ് നീക്കി, ഡാറ്റ പങ്കിടാത്ത ആപ്പ് തിരഞ്ഞെടുക്കട്ടെ.',
      'ആപ്പിനെതിരെ പരാതി നൽകട്ടെ. ആരോഗ്യ ഡാറ്റ പങ്കിടാൻ കമ്പനികൾ വ്യക്തമായ അനുമതി വാങ്ങണം.'
    ],
    questions: [
      'ആപ്പ് സൗജന്യമാണെങ്കിൽ കമ്പനി എങ്ങനെയാണ് പണം ഉണ്ടാക്കുന്നത്?',
      'നീണ്ട ഒരു രേഖയിൽ "ഞാൻ സമ്മതിക്കുന്നു" അമർത്തുന്നത് യഥാർത്ഥ സമ്മതമാണോ?',
      'ഏതൊക്കെ ആരോഗ്യ വിവരങ്ങൾ ചോദിക്കാതെ ഒരിക്കലും പങ്കിടരുത്?'
    ],
    consider: [
      'പല സൗജന്യ ആപ്പുകളും നിങ്ങളുടെ ഡാറ്റയിൽ നിന്നും പരസ്യങ്ങളിൽ നിന്നുമാണ് സമ്പാദിക്കുന്നത്. നിങ്ങൾ പണം കൊടുക്കുന്നില്ലെങ്കിൽ, ഒരുപക്ഷേ ഡാറ്റ കൊണ്ടാണ് വില കൊടുക്കുന്നത്.',
      'ആരോഗ്യ ഡാറ്റ വളരെ സ്വകാര്യമാണ്. അത് ഇൻഷുറൻസ്, ജോലി, അല്ലെങ്കിൽ ആളുകൾ നിങ്ങളോട് പെരുമാറുന്ന രീതി എന്നിവയെ ബാധിക്കാം.',
      'നല്ല ആപ്പ് ഡാറ്റ പങ്കിടുംമുമ്പ് ലളിതമായ വാക്കുകളിൽ വ്യക്തമായി ചോദിക്കും. ആപ്പ് അനുമതികളും പ്രൈവസി സെറ്റിംഗ്സും പരിശോധിക്കൂ.'
    ]
  },
  {
    title: 'AI ചിത്രം മത്സരം ജയിച്ചു',
    story: 'ജില്ലാ ചിത്രരചനാ മത്സരത്തിന്റെ വിഷയം "2047-ലെ എന്റെ ഇന്ത്യ". മനോഹരവും സൂക്ഷ്മവുമായ ഒരു ചിത്രം ഒന്നാം സമ്മാനം നേടുന്നു. പിന്നീട്, ആ വിദ്യാർത്ഥി കുറച്ച് വരികൾ ടൈപ്പ് ചെയ്ത് AI ഇമേജ് ജനറേറ്റർ കൊണ്ടാണ് അത് ഉണ്ടാക്കിയതെന്ന് എല്ലാവരും അറിയുന്നു. നിയമങ്ങളിൽ AI-യെക്കുറിച്ച് പരാമർശമില്ലായിരുന്നു. മറ്റു കുട്ടികൾ ആഴ്ചകളോളം കൈകൊണ്ട് വരച്ചവരാണ്.',
    options: [
      'സമ്മാനം അങ്ങനെ തന്നെ നിൽക്കട്ടെ. നിയമങ്ങൾ AI വിലക്കിയിരുന്നില്ല.',
      'സമ്മാനം തിരിച്ചെടുത്ത് കൈകൊണ്ട് വരച്ച ഏറ്റവും നല്ല ചിത്രത്തിന് നൽകൂ.',
      'വിജയി സമ്മാനം നിലനിർത്തട്ടെ, അടുത്ത വർഷം മുതൽ AI ചിത്രങ്ങൾക്ക് പ്രത്യേക വിഭാഗം വേണം.',
      'AI ഉപയോഗിച്ച കാര്യം ആ വിദ്യാർത്ഥി വിധികർത്താക്കളോട് പറയേണ്ടതായിരുന്നു.'
    ],
    questions: [
      'പ്രോംപ്റ്റ് ടൈപ്പ് ചെയ്യുന്നതും ചിത്രം വരയ്ക്കുന്നതും ഒന്നാണോ? അതിന് എന്തെല്ലാം കഴിവുകൾ വേണം?',
      'AI ചിത്രങ്ങളെ കൈകൊണ്ട് വരച്ച ചിത്രങ്ങളുമായി താരതമ്യം ചെയ്യുന്നത് നീതിയാണോ?',
      'AI ഇമേജ് ടൂളുകൾ ലക്ഷക്കണക്കിന് കലാകാരന്മാരുടെ ചിത്രങ്ങളിൽ നിന്ന് പഠിച്ചവയാണ്. ആ കലാകാരന്മാർക്ക് അംഗീകാരം ലഭിക്കണോ?'
    ],
    consider: [
      'ഒരു കാര്യം എങ്ങനെ ഉണ്ടാക്കിയെന്ന് സത്യസന്ധമായി പറയുന്നത് പ്രധാനമാണ്, നിയമങ്ങൾ വ്യക്തമല്ലെങ്കിൽ പോലും.',
      'നീതിയുക്തമായ മത്സരം ഒരേതരം കഴിവുകളെ താരതമ്യം ചെയ്യുന്നു. AI-യെക്കുറിച്ചുള്ള വ്യക്തമായ നിയമങ്ങൾ എല്ലാവരെയും സഹായിക്കും.',
      'AI കല സർഗ്ഗാത്മകമാകാം, പക്ഷേ AI മറ്റുള്ളവരുടെ സൃഷ്ടികളിൽ നിന്ന്, പലപ്പോഴും അവരോട് ചോദിക്കാതെ, പഠിക്കുന്നു.'
    ]
  },
  {
    title: 'സ്കൂൾ ഇടനാഴികളിൽ AI ക്യാമറകൾ',
    story: 'സ്കൂളിൽ ഒരു വഴക്കിനുശേഷം, എല്ലാ ഇടനാഴികളിലും AI ക്യാമറകൾ വയ്ക്കാൻ പ്രധാനാധ്യാപകൻ ആലോചിക്കുന്നു. ഓട്ടം, കൂട്ടം കൂടൽ തുടങ്ങിയ "അസാധാരണ പെരുമാറ്റം" AI കണ്ടെത്തി അധ്യാപകരെ അറിയിക്കും. കുട്ടികൾ കൂടുതൽ സുരക്ഷിതരാകുമെന്ന് പല രക്ഷിതാക്കളും കരുതുന്നു. തങ്ങളെ എപ്പോഴും നിരീക്ഷിക്കുന്നതായി ചില കുട്ടികൾക്ക് തോന്നുന്നു, സാധാരണ കളിയും AI പ്രശ്നമായി റിപ്പോർട്ട് ചെയ്യുമോ എന്ന് അവർ ഭയക്കുന്നു.',
    options: [
      'എല്ലായിടത്തും ക്യാമറ വയ്ക്കൂ. സുരക്ഷയാണ് ആദ്യം.',
      'ക്യാമറകൾ ഗേറ്റുകളിലും പടികളിലും മാത്രം, ക്ലാസ് മുറികൾക്കുള്ളിൽ ഒരിക്കലും വേണ്ട.',
      'ക്യാമറ വയ്ക്കൂ, പക്ഷേ എന്ത് റെക്കോർഡ് ചെയ്യുന്നു, ആർക്ക് കാണാം, എപ്പോൾ മായ്ക്കും എന്ന് എല്ലാവരോടും പറയൂ.',
      'AI ക്യാമറ വേണ്ട. കൂടുതൽ അധ്യാപകരെ ഡ്യൂട്ടിക്ക് വച്ച് കുട്ടികളോട് സംസാരിക്കൂ.'
    ],
    questions: [
      'ഒരു ക്യാമറ നിങ്ങളെ എപ്പോഴും നിരീക്ഷിച്ചാൽ നിങ്ങൾക്ക് എങ്ങനെ തോന്നും?',
      '"അസാധാരണ പെരുമാറ്റം" എന്നാൽ എന്താണ്? അത് ആര് തീരുമാനിക്കും?',
      'വീഡിയോകൾ ആര് കാണണം, എത്ര കാലം സൂക്ഷിക്കണം?'
    ],
    consider: [
      'എന്ത് സംഭവിച്ചെന്ന് കണ്ടെത്താൻ ക്യാമറകൾ സഹായിക്കും, പക്ഷേ തങ്ങളെ വിശ്വസിക്കുന്നില്ലെന്ന തോന്നലും അവ ഉണ്ടാക്കാം.',
      'ക്ലാസിലേക്ക് ഓടുന്നത് പോലുള്ള സാധാരണ കാര്യങ്ങളും AI തെറ്റായി പ്രശ്നമായി കണ്ടേക്കാം, അതുകൊണ്ട് ഏത് നടപടിക്കും മുമ്പ് ഒരു മനുഷ്യൻ പരിശോധിക്കണം.',
      'എന്ത് റെക്കോർഡ് ചെയ്യും, ആര് കാണും, എപ്പോൾ മായ്ക്കും എന്നതിന്റെ വ്യക്തമായ നിയമങ്ങൾ സുരക്ഷയും സ്വകാര്യതയും ഒരുപോലെ കാക്കും.'
    ]
  },
  {
    title: 'ഗ്രാമത്തിലെ ജോലി കവർന്ന യന്ത്രം',
    story: 'പഞ്ചാബിലെ ഒരു ഗ്രാമത്തിൽ ഒരു കർഷകൻ AI നിയന്ത്രിക്കുന്ന ഒരു സ്മാർട്ട് കൊയ്ത്ത് യന്ത്രം വാങ്ങുന്നു. അത് ഒറ്റ ദിവസം കൊണ്ട് അയാളുടെ ഗോതമ്പ് പാടം കൊയ്യുന്നു. മുമ്പ് 20 തൊഴിലാളികൾ ഒരാഴ്ച കൊണ്ടാണ് ഈ ജോലി ചെയ്തിരുന്നത്, ഓരോ സീസണിലും അവർക്ക് വരുമാനം കിട്ടിയിരുന്നു. കർഷകന് സമയവും പണവും ലാഭം, പക്ഷേ രമേശിനെപ്പോലുള്ള തൊഴിലാളികൾക്ക് ഇപ്പോൾ കൊയ്ത്തുകാലത്ത് ജോലിയില്ല.',
    options: [
      'ഇതാണ് പുരോഗതി. കർഷകൻ യന്ത്രം ഉപയോഗിക്കണം.',
      'യന്ത്രം ഉപയോഗിക്കൂ, പക്ഷേ അത് ഓടിക്കാനും നന്നാക്കാനും പോലുള്ള പുതിയ കഴിവുകൾ പഠിക്കാൻ തൊഴിലാളികളെ സഹായിക്കൂ.',
      'യന്ത്രങ്ങൾ കാരണം ജോലി നഷ്ടപ്പെടുന്ന തൊഴിലാളികളെ സർക്കാർ സഹായിക്കണം.',
      'ജോലിയുടെ ഒരു ഭാഗത്തിന് മാത്രം യന്ത്രം ഉപയോഗിക്കൂ, കുറച്ച് ജോലികൾ ബാക്കിയാകട്ടെ.'
    ],
    questions: [
      'യന്ത്രം തൊഴിലാളികളുടെ സ്ഥാനം ഏറ്റെടുക്കുമ്പോൾ ആർക്ക് നേട്ടം, ആർക്ക് നഷ്ടം?',
      'പുതിയ സാങ്കേതികവിദ്യ പുതിയ ജോലികളും സൃഷ്ടിക്കുമോ? ഏതെല്ലാം?',
      'ജോലി നഷ്ടപ്പെട്ട തൊഴിലാളികളെ സഹായിക്കുന്നത് ആരുടെ കടമയാണ്?'
    ],
    consider: [
      'യന്ത്രങ്ങൾക്ക് കഠിനമായ ജോലി വേഗത്തിലും സുരക്ഷിതമായും ചെലവ് കുറച്ചും ചെയ്യാനാകും, കർഷകരെ കൂടുതൽ ഭക്ഷണം വിളയിക്കാൻ സഹായിക്കാനും.',
      'പക്ഷേ നേട്ടം പലപ്പോഴും കുറച്ചുപേർക്ക് മാത്രം പോകുന്നു, മറ്റുള്ളവർക്ക് വരുമാനം നഷ്ടപ്പെടുന്നു.',
      'പരിശീലനം, പുതിയതരം ജോലികൾ, സഹായ പദ്ധതികൾ എന്നിവ ഈ മാറ്റവുമായി പൊരുത്തപ്പെടാൻ ആളുകളെ സഹായിക്കും.'
    ]
  },
  {
    title: 'ശബ്ദം പകർത്തിയുള്ള തട്ടിപ്പ് കോൾ',
    story: 'പാതിരാത്രി മുത്തശ്ശിക്ക് ഒരു ഫോൺ വരുന്നു. പേരക്കുട്ടി രോഹന്റെ ശബ്ദം, കരഞ്ഞുകൊണ്ട്: "മുത്തശ്ശീ, എനിക്ക് ഒരു അപകടം പറ്റി! ഇപ്പോൾ തന്നെ UPI വഴി ₹50,000 അയയ്ക്കൂ, അച്ഛനോട് പറയരുത്." പക്ഷേ രോഹൻ ഹോസ്റ്റലിൽ സുരക്ഷിതമായി ഉറങ്ങുകയാണ്. അവൻ ഓൺലൈനിൽ ഇട്ട വീഡിയോകളിൽ നിന്ന് തട്ടിപ്പുകാർ AI ഉപയോഗിച്ച് അവന്റെ ശബ്ദം പകർത്തിയതാണ്.',
    options: [
      'മുത്തശ്ശി വേഗം പണം അയയ്ക്കട്ടെ. സത്യമാണെങ്കിലോ?',
      'മുത്തശ്ശി ഫോൺ വച്ച്, അറിയാവുന്ന നമ്പറിൽ രോഹനെയോ കുടുംബത്തിലെ ആരെയെങ്കിലുമോ വിളിക്കട്ടെ.',
      'ഇത്തരം കോളുകൾ പരിശോധിക്കാൻ കുടുംബം ഒരു രഹസ്യ കോഡ് വാക്ക് തീരുമാനിക്കട്ടെ.',
      'രോഹൻ തന്റെ ശബ്ദമുള്ള വീഡിയോകൾ ഓൺലൈനിൽ ഇടുന്നത് നിർത്തട്ടെ.'
    ],
    questions: [
      'ഇത്തരം തട്ടിപ്പുകൾ ഇത്ര എളുപ്പം വിജയിക്കുന്നത് എന്തുകൊണ്ട്?',
      'ആരാണ് ഉത്തരവാദി: തട്ടിപ്പുകാരോ, ശബ്ദ AI ഉണ്ടാക്കുന്ന കമ്പനികളോ, അതോ രണ്ടുകൂട്ടരുമോ?',
      'നിങ്ങളുടെ കുടുംബത്തിലെ മുതിർന്നവരെ സുരക്ഷിതരായിരിക്കാൻ നിങ്ങൾക്ക് എങ്ങനെ സഹായിക്കാം?'
    ],
    consider: [
      'ഏതാനും സെക്കൻഡ് ശബ്ദത്തിൽ നിന്നുതന്നെ AI-ക്ക് ഒരാളുടെ ശബ്ദം പകർത്താനാകും, അതുകൊണ്ട് പരിചിതമായ ശബ്ദം ഇനി തെളിവല്ല.',
      'തട്ടിപ്പുകാർ പരിഭ്രാന്തിയും രഹസ്യവും സൃഷ്ടിക്കുന്നു: "ഇപ്പോൾ തന്നെ", "ആരോടും പറയരുത്". നിൽക്കൂ, ആദ്യം പരിശോധിക്കൂ.',
      'ഇന്ത്യയിൽ സൈബർ തട്ടിപ്പ് ഉടനെ ഹെൽപ്പ്‌ലൈൻ 1930-ലോ cybercrime.gov.in-ലോ റിപ്പോർട്ട് ചെയ്യൂ.'
    ]
  },
  {
    title: 'ഒരിക്കലും തീരാത്ത വീഡിയോ ഫീഡ്',
    story: '15 വയസ്സുള്ള കബീർ രാത്രി "അഞ്ച് മിനിറ്റിന്" ഒരു ഷോർട്ട്-വീഡിയോ ആപ്പ് തുറക്കുന്നു, രണ്ട് മണിക്കൂർ കഴിഞ്ഞാണ് തല ഉയർത്തുന്നത്. ഏത് വീഡിയോകളാണ് അവനെ പിടിച്ചിരുത്തുന്നതെന്ന് ആപ്പിന്റെ AI കൃത്യമായി പഠിച്ച്, അത്തരം വീഡിയോകൾ കൂടുതൽ കാണിക്കുന്നു. അവന്റെ ഉറക്കവും മാർക്കും കുറയുന്നു. അവൻ എത്ര കൂടുതൽ സ്ക്രോൾ ചെയ്യുന്നോ, കമ്പനി അത്രയും കൂടുതൽ സമ്പാദിക്കുന്നു.',
    options: [
      'ഇത് കബീറിന്റെ തിരഞ്ഞെടുപ്പാണ്. അവൻ സ്വയം നിയന്ത്രിക്കണം.',
      'ആപ്പുകളിൽ കൗമാരക്കാർക്ക് ദിവസേനയുള്ള സമയപരിധി തുടക്കം മുതലേ ഓണായിരിക്കണം.',
      'ഓരോ വീഡിയോയും എന്തിന് നിർദ്ദേശിച്ചുവെന്ന് ആപ്പുകൾ കാണിക്കുകയും ഉപയോക്താക്കൾക്ക് ഫീഡ് മാറ്റാൻ കഴിയുകയും വേണം.',
      'രാത്രി 10 കഴിഞ്ഞ് പോലുള്ള ഫോണില്ലാ സമയം കുടുംബങ്ങളും സ്കൂളുകളും ചേർന്ന് തീരുമാനിക്കണം.'
    ],
    questions: [
      'ബുദ്ധിയുള്ള ഒരു AI സംവിധാനം ഒരു കൗമാരക്കാരന്റെ ശ്രദ്ധയ്ക്കായി മത്സരിക്കുന്നത് നീതിയാണോ?',
      'അടിമപ്പെടുത്തുന്ന രൂപകൽപ്പന വരുത്തുന്ന ദോഷത്തിന് കമ്പനികൾ ഉത്തരവാദികളാകണോ?',
      'നിങ്ങളുടെ സ്ക്രീൻ സമയം നിങ്ങളുടെ നിയന്ത്രണത്തിൽ നിർത്താൻ ഏതെല്ലാം ശീലങ്ങൾ സഹായിക്കും?'
    ],
    consider: [
      'നിർദ്ദേശിക്കുന്ന AI നിങ്ങൾ കണ്ടുകൊണ്ടേയിരിക്കാനാണ് ഉണ്ടാക്കിയിരിക്കുന്നത്, കാരണം കൂടുതൽ കാണൽ എന്നാൽ കൂടുതൽ പരസ്യങ്ങൾ.',
      'അവസാനമില്ലാത്ത സ്ക്രോളും ഓട്ടോപ്ലേയും നിർത്തുന്നത് ബുദ്ധിമുട്ടാക്കുന്നു. അത് രൂപകൽപ്പന കൊണ്ടാണ്, നിങ്ങളുടെ ദൗർബല്യം കൊണ്ടല്ല.',
      'ചെറിയ ചുവടുകൾ സഹായിക്കും: സ്ക്രീൻ സമയ പരിധി, രാത്രി കിടപ്പുമുറിയിൽ ഫോൺ വേണ്ട, ഓട്ടോപ്ലേ ഓഫ്.'
    ]
  }
] };

/* ---------- ur ---------- */
C.ur = { cards: [
  {
    title: 'ہم جماعت کی نقلی ویڈیو',
    story: 'نویں جماعت کے کسی طالب علم نے ایک مفت AI ایپ سے اپنی ہم جماعت میرا کی نقلی ویڈیو بنا دی۔ اس میں میرا ایک استاد کے بارے میں بری باتیں کہتی دکھائی دیتی ہے۔ ویڈیو بالکل اصلی لگتی ہے۔ یہ کلاس کے WhatsApp گروپ میں تیزی سے پھیل رہی ہے، اور میرا اتنی دکھی ہے کہ اسکول نہیں آ رہی۔ ابھی ابھی یہ ویڈیو آپ کے پاس بھی آئی ہے۔',
    options: [
      'کچھ دوستوں کو فارورڈ کر دیں۔ سب نے تو دیکھ ہی لی ہے۔',
      'فارورڈ نہ کریں، اور خاموش رہیں۔',
      'گروپ میں لکھیں کہ ویڈیو نقلی ہے اور سب سے اسے ڈیلیٹ کرنے کو کہیں۔',
      'کسی استاد یا والدین کو بتائیں، اور اکیلے میں میرا کا ساتھ دیں۔'
    ],
    questions: [
      'اس ویڈیو سے کس کو نقصان ہو رہا ہے، اور کیسے؟',
      'جو صرف نقلی ویڈیو فارورڈ کرتا ہے، کیا وہ بھی ذمہ دار ہے؟ کیوں؟',
      'نقلی ویڈیو بنا سکنے والی ایپس کو کون سے اصول ماننے چاہییں؟'
    ],
    consider: [
      'ڈیپ فیک کسی کی عزت اور دل کو ٹھیس پہنچا سکتا ہے، لوگوں کو سچ پتا چلنے کے بعد بھی۔',
      'ہر فارورڈ نقصان کو اور پھیلاتا ہے۔ فارورڈ نہ کرنا مدد ہے؛ شکایت کرنا اس سے بھی بڑی مدد ہے۔',
      'کسی کو نقصان پہنچانے کے لیے نقلی ویڈیو بنانا یا پھیلانا بھارتی قانون میں قابلِ سزا ہو سکتا ہے۔ ایسی ویڈیوز کی شکایت cybercrime.gov.in پر کی جا سکتی ہے۔'
    ]
  },
  {
    title: 'AI آپ کے مضمون جانچے',
    story: 'ایک اسکول دسویں جماعت کے انگریزی مضامین AI ٹول سے جانچنا چاہتا ہے۔ یہ تیز ہے اور فوراً مشورے دیتا ہے۔ لیکن آزمائش میں اس نے مشکل الفاظ سے بھرے لمبے مضامین کو زیادہ نمبر دیے۔ جن طلبہ نے آسان انگریزی میں اچھے خیالات لکھے تھے، ان میں سے کچھ کو کم نمبر ملے۔',
    options: [
      'ساری جانچ AI سے کرائیں۔ اس سے اساتذہ کا بہت وقت بچے گا۔',
      'AI صرف کچے مسودوں پر مشورہ دے۔ آخری نمبر استاد دیں۔',
      'AI کے نمبر رکھیں، مگر کوئی بھی طالب علم استاد سے دوبارہ جانچ کروا سکے۔',
      'جب تک جانچ کر منصفانہ ثابت نہ ہو، اسے استعمال نہ کریں۔'
    ],
    questions: [
      'جانچ کو منصفانہ کیا بناتا ہے؟ کیا کوئی مشین یہ سیکھ سکتی ہے؟',
      'کیا طلبہ کو بتایا جانا چاہیے کہ ان کا کام AI نے جانچا ہے؟',
      'اگر AI غلط نمبر دے تو ذمہ دار کون ہے: اسکول، کمپنی یا AI؟'
    ],
    consider: [
      'AI پرانی مثالوں سے سیکھتا ہے۔ اگر ان مثالوں میں لمبے الفاظ کو انعام ملا تھا تو AI بھی وہی عادت سیکھ لیتا ہے۔',
      'شفافیت کا مطلب ہے کہ طلبہ جانیں انہیں نمبر کیسے ملے اور دوبارہ جانچ مانگ سکیں۔',
      'امتحان کے نمبروں جیسے اہم فیصلوں کی ذمہ داری کسی انسان پر ہی رہنی چاہیے۔'
    ]
  },
  {
    title: 'چہرہ دیکھ کر حاضری',
    story: 'ایک کالج گیٹ پر ایسا کیمرا لگانا چاہتا ہے جو ہر طالب علم کا چہرہ پہچان کر حاضری لگائے۔ اس سے ہر کلاس کا وقت بچے گا اور پراکسی حاضری رکے گی۔ چہروں کی تصویریں سسٹم چلانے والی کمپنی کے پاس رہیں گی۔ کچھ طلبہ کہتے ہیں کہ کم روشنی میں یہ انہیں اکثر پہچان نہیں پاتا۔',
    options: [
      'لگا دیں۔ یہ تیز ہے اور پراکسی حاضری روکتا ہے۔',
      'صرف ان کے لیے استعمال کریں جو راضی ہوں۔ باقیوں کے لیے کاغذ کا رجسٹر رکھیں۔',
      'تبھی استعمال کریں جب چہرے کا ڈیٹا کالج کے پاس رہے اور کورس کے بعد مٹا دیا جائے۔',
      'استعمال نہ کریں۔ نام پکار کر حاضری لینا کافی ہے۔'
    ],
    questions: [
      'کیا آپ کا چہرہ ذاتی ڈیٹا ہے؟ اس پر کس کا اختیار ہونا چاہیے؟',
      'اگر یہ چہرے کا ڈیٹا لیک ہو جائے یا غلط استعمال ہو تو کیا ہو سکتا ہے؟',
      'اگر سسٹم کچھ طلبہ کے ساتھ زیادہ غلطیاں کرے تو کیا یہ پھر بھی منصفانہ ہے؟'
    ],
    consider: [
      'چہرے کا ڈیٹا بایومیٹرک ڈیٹا ہے۔ لیک ہو جائے تو پاس ورڈ کی طرح آپ اپنا چہرہ نہیں بدل سکتے۔',
      'بھارت کا ڈیجیٹل ذاتی ڈیٹا تحفظ قانون، 2023 کہتا ہے کہ لوگوں کو بتایا جائے کہ ان کا ڈیٹا کیوں لیا جا رہا ہے، اور عام طور پر ان کی رضامندی ضروری ہے۔',
      'کم روشنی میں یا کچھ چہروں کے لیے چہرہ شناسی زیادہ غلطیاں کر سکتی ہے، جس سے طلبہ غلطی سے غیر حاضر لگ سکتے ہیں۔'
    ]
  },
  {
    title: 'ہوم ورک AI نے کیا',
    story: 'ارجن کا سائنس پروجیکٹ کل جمع ہونا ہے۔ وہ موضوع ایک AI چیٹ بوٹ میں لکھتا ہے، اور ایک منٹ میں وہ صاف ستھری، مکمل رپورٹ لکھ دیتا ہے۔ وہ اسے اپنا کام بتا کر جمع کر سکتا ہے۔ اس کا دوست کہتا ہے، "سب یہی کرتے ہیں۔" استاد نے AI کے استعمال کے بارے میں کچھ نہیں کہا۔',
    options: [
      'AI کی رپورٹ جیسی ہے ویسی جمع کر دے۔ کسی کو پتا نہیں چلے گا۔',
      'AI سے موضوع سمجھے، پھر رپورٹ خود لکھے۔',
      'AI کی رپورٹ کے کچھ حصے لے، مگر صاف بتائے کہ AI نے مدد کی۔',
      'استاد سے پوچھے کہ AI کی کیسی مدد ٹھیک ہے۔'
    ],
    questions: [
      'مدد لینے اور نقل کرنے میں کیا فرق ہے؟',
      'اگر ساری سوچ کا کام AI کرے تو ارجن کیا کھو دیتا ہے؟',
      'آپ کی کلاس میں ہوم ورک کے لیے AI کا منصفانہ اصول کیا ہونا چاہیے؟'
    ],
    consider: [
      'ہوم ورک مشق ہے۔ اگر AI اسے کرے تو نمبر بڑھ سکتے ہیں، مگر سیکھنا نہیں بڑھتا۔',
      'AI چیٹ بوٹ ایسی باتیں گھڑ سکتے ہیں جو صحیح لگتی ہیں، اس لیے ان کے جواب ہمیشہ جانچنے چاہییں۔',
      'AI کا استعمال ایمانداری سے بتانے سے بھروسا بنتا ہے۔ کئی اسکول اب AI کے بارے میں صاف اصول بنا رہے ہیں۔'
    ]
  },
  {
    title: 'جانبدار بھرتی AI',
    story: 'ایک بڑی کمپنی ہزاروں ملازمت کی درخواستیں چھانٹنے کے لیے AI استعمال کرتی ہے۔ AI نے کمپنی کی پچھلے 10 سال کی بھرتیوں سے سیکھا، جب کمپنی زیادہ تر بڑے شہروں کے مردوں کو ہی رکھتی تھی۔ اب یہ عورتوں اور چھوٹے قصبوں کے لوگوں کو کم نمبر دیتا ہے، چاہے ان کی مہارت اتنی ہی ہو۔',
    options: [
      'اسے چلنے دیں۔ یہ تیز ہے، اور کمپنی جسے چاہے رکھ سکتی ہے۔',
      'ٹریننگ ڈیٹا ٹھیک کریں اور دوبارہ استعمال سے پہلے AI کو جانبداری کے لیے جانچیں۔',
      'AI ایک مختصر فہرست بنائے، مگر آخری انتخاب انسان کریں اور مسترد درخواستیں بھی دیکھیں۔',
      'بھرتی میں AI کا استعمال بند کریں۔ لوگوں کا کیریئر بہت اہم ہے۔'
    ],
    questions: [
      'جب کسی نے AI کو جانبداری کرنے کو نہیں کہا، تو وہ جانبدار کیسے بن گیا؟',
      'کیا لوگوں کو بتایا جانا چاہیے کہ ان کی درخواست AI نے مسترد کی؟',
      'بھرتی والا AI منصفانہ ہے، یہ کون جانچے: کمپنی، حکومت یا کوئی اور؟'
    ],
    consider: [
      'AI پرانے ڈیٹا سے پیٹرن سیکھتا ہے، پرانی غلط عادتوں سمیت۔ اسے جانبداری (بائس) کہتے ہیں۔',
      'مختلف گروہوں (عورتیں اور مرد، شہر اور قصبے) کے نتائج کا موازنہ کرنے سے چھپی جانبداری دکھ سکتی ہے۔',
      'لوگوں کو پتا چل سکنا چاہیے کہ انہیں کیوں مسترد کیا گیا، اور وہ کسی انسان سے دوبارہ دیکھنے کو کہہ سکیں۔'
    ]
  },
  {
    title: 'خود کار گاڑی کا فیصلہ',
    story: 'بنگلورو کی ایک بھیڑ بھری سڑک پر ایک خود کار گاڑی چل رہی ہے۔ اچانک ایک بچہ سڑک پر دوڑ آتا ہے۔ گاڑی وقت پر رک نہیں سکتی۔ وہ اپنی لین میں رہ سکتی ہے، یا فٹ پاتھ کی طرف مڑ سکتی ہے جہاں دو لوگ چل رہے ہیں۔ دونوں صورتوں میں کسی نہ کسی کو خطرہ ہے۔ انجینئروں کو پہلے سے طے کرنا ہے کہ گاڑی کیا کرے۔',
    options: [
      'ہمیشہ پہلے گاڑی کے اندر بیٹھے لوگوں کو بچائے۔',
      'ہمیشہ وہ راستہ چنے جس میں سب سے کم لوگوں کو خطرہ ہو۔',
      'ہمیشہ زور سے بریک لگائے اور اپنی لین میں رہے۔ فٹ پاتھ پر کبھی نہ مڑے۔',
      'جب تک ایسی صورتوں سے بچ نہ سکیں، ایسی گاڑیاں سڑک پر نہ آئیں۔'
    ],
    questions: [
      'یہ اصول کون طے کرے: انجینئر، حکومت یا عوام؟',
      'اگر گاڑی سے حادثہ ہو تو ذمہ دار کون ہے: مالک، کمپنی یا پروگرامر؟',
      'کیا خریداروں کو پتا ہونا چاہیے کہ ان کی گاڑی کون سے اصول مانتی ہے؟'
    ],
    consider: [
      'خود کار گاڑیاں اس طرح بنائی جاتی ہیں کہ وہ پہلے ہی رفتار کم کر کے ایسے لمحوں سے بچیں، مگر کوئی بھی سسٹم مکمل نہیں ہوتا۔',
      'یہ اصول اخلاقی فیصلے ہیں، اس لیے صرف انجینئر نہیں، بہت سے لوگوں کی رائے ہونی چاہیے۔',
      'ایسی گاڑیوں کو اجازت دینے سے پہلے صاف اصول چاہییں کہ حادثے کی ذمہ داری کس کی ہوگی۔'
    ]
  },
  {
    title: 'مفت ہیلتھ ایپ ڈیٹا بانٹتی ہے',
    story: 'پریا ایک مفت فٹنس ایپ استعمال کرتی ہے جو اس کے قدم، نیند اور دل کی دھڑکن گنتی ہے۔ یہ اس کا وزن، کھانا پینا اور موڈ بھی پوچھتی ہے۔ اس کی لمبی شرائط میں کہیں اندر لکھا ہے کہ کمپنی یہ ڈیٹا "پارٹنرز" کے ساتھ بانٹ سکتی ہے۔ جلد ہی پریا کو وزن گھٹانے والی چیزوں اور ہیلتھ انشورنس کے اشتہار دکھنے لگتے ہیں۔',
    options: [
      'ٹھیک ہے۔ ایپ مفت ہے، اور اس نے شرائط مانی تھیں۔',
      'ایپ رکھے، مگر سیٹنگز میں ڈیٹا شیئرنگ بند کر دے۔',
      'ایپ ہٹا دے اور ایسی ایپ چنے جو ڈیٹا نہ بانٹے۔',
      'ایپ کی شکایت کرے۔ صحت کا ڈیٹا بانٹنے کے لیے کمپنیوں کو صاف اجازت لینی چاہیے۔'
    ],
    questions: [
      'اگر ایپ مفت ہے تو کمپنی پیسے کیسے کماتی ہے؟',
      'لمبی دستاویز پر "میں متفق ہوں" دبانا کیا سچی رضامندی ہے؟',
      'صحت کی کون سی معلومات پوچھے بغیر کبھی نہیں بانٹنی چاہییں؟'
    ],
    consider: [
      'کئی مفت ایپس آپ کے ڈیٹا اور اشتہاروں سے کماتی ہیں۔ اگر آپ پیسوں سے قیمت نہیں دے رہے تو شاید اپنے ڈیٹا سے دے رہے ہیں۔',
      'صحت کا ڈیٹا بہت ذاتی ہوتا ہے۔ اس کا اثر بیمے، نوکری یا لوگوں کے آپ سے سلوک پر پڑ سکتا ہے۔',
      'اچھی ایپ ڈیٹا بانٹنے سے پہلے آسان الفاظ میں صاف پوچھتی ہے۔ ایپ کی اجازتیں اور پرائیویسی سیٹنگز جانچیں۔'
    ]
  },
  {
    title: 'AI تصویر نے مقابلہ جیتا',
    story: 'ضلعی مصوری مقابلے کا موضوع ہے "2047 میں میرا بھارت"۔ ایک خوبصورت، باریک تصویر پہلا انعام جیتتی ہے۔ بعد میں سب کو پتا چلتا ہے کہ طالب علم نے کچھ سطریں ٹائپ کر کے اسے AI امیج جنریٹر سے بنایا تھا۔ قواعد میں AI کا ذکر نہیں تھا۔ باقی طلبہ نے ہفتوں ہاتھ سے تصویریں بنائی تھیں۔',
    options: [
      'انعام رہنے دیں۔ قواعد میں AI پر پابندی نہیں تھی۔',
      'انعام واپس لیں اور ہاتھ سے بنی سب سے اچھی تصویر کو دیں۔',
      'جیتنے والا انعام رکھے، اور اگلے سال سے AI تصویروں کا الگ زمرہ بنے۔',
      'طالب علم کو ججوں کو بتانا چاہیے تھا کہ AI استعمال ہوا۔'
    ],
    questions: [
      'کیا پرامپٹ ٹائپ کرنا تصویر بنانے جیسا ہی ہے؟ اس میں کون سی مہارتیں لگتی ہیں؟',
      'کیا AI تصویروں کا موازنہ ہاتھ سے بنی تصویروں سے کرنا منصفانہ ہے؟',
      'AI امیج ٹولز نے لاکھوں فنکاروں کی تصویروں سے سیکھا ہے۔ کیا ان فنکاروں کو کریڈٹ ملنا چاہیے؟'
    ],
    consider: [
      'کوئی چیز کیسے بنی، یہ ایمانداری سے بتانا ضروری ہے، چاہے قواعد صاف نہ ہوں۔',
      'منصفانہ مقابلہ ایک جیسی مہارتوں کا موازنہ کرتا ہے۔ AI کے بارے میں صاف قواعد سب کی مدد کرتے ہیں۔',
      'AI آرٹ تخلیقی ہو سکتا ہے، مگر AI دوسروں کے کام سے سیکھتا ہے، اکثر ان سے پوچھے بغیر۔'
    ]
  },
  {
    title: 'اسکول کی راہداریوں میں AI کیمرے',
    story: 'اسکول میں ایک جھگڑے کے بعد پرنسپل سبھی راہداریوں میں AI کیمرے لگانے کا سوچ رہے ہیں۔ AI دوڑنا یا بھیڑ جمع ہونا جیسا "غیر معمولی رویہ" پہچان کر اساتذہ کو اطلاع دے گا۔ کئی والدین کو لگتا ہے کہ بچے زیادہ محفوظ رہیں گے۔ کچھ طلبہ کو لگتا ہے کہ ان پر ہر وقت نظر رکھی جا رہی ہے، اور ڈر ہے کہ AI عام کھیل کو بھی گڑبڑ بتا دے گا۔',
    options: [
      'ہر جگہ کیمرے لگائیں۔ حفاظت سب سے پہلے۔',
      'کیمرے صرف گیٹ اور سیڑھیوں پر لگائیں، کلاس روم کے اندر کبھی نہیں۔',
      'کیمرے لگائیں، مگر سب کو بتائیں کہ کیا ریکارڈ ہوتا ہے، کون دیکھ سکتا ہے اور کب مٹایا جاتا ہے۔',
      'AI کیمرے نہیں۔ زیادہ اساتذہ کی ڈیوٹی لگائیں اور طلبہ سے بات کریں۔'
    ],
    questions: [
      'اگر کوئی کیمرا ہر وقت آپ پر نظر رکھے تو آپ کو کیسا لگے گا؟',
      '"غیر معمولی رویہ" کسے کہیں گے؟ یہ کون طے کرے گا؟',
      'ویڈیوز کون دیکھے، اور انہیں کتنی دیر رکھا جائے؟'
    ],
    consider: [
      'کیمرے یہ جاننے میں مدد کر سکتے ہیں کہ کیا ہوا، مگر ان سے لوگوں کو یہ بھی لگ سکتا ہے کہ ان پر بھروسا نہیں۔',
      'AI کلاس کی طرف دوڑنے جیسی عام باتوں کو بھی غلطی سے گڑبڑ سمجھ سکتا ہے، اس لیے کوئی قدم اٹھانے سے پہلے انسان جانچے۔',
      'کیا ریکارڈ ہوگا، کون دیکھے گا اور کب مٹے گا، اس کے صاف اصول حفاظت اور رازداری دونوں کی حفاظت کرتے ہیں۔'
    ]
  },
  {
    title: 'مشین نے گاؤں کا کام چھینا',
    story: 'پنجاب کے ایک گاؤں میں ایک کسان AI سے چلنے والی اسمارٹ کٹائی مشین خریدتا ہے۔ یہ ایک دن میں اس کا گندم کا کھیت کاٹ دیتی ہے۔ پہلے 20 مزدور یہ کام ایک ہفتے میں کرتے تھے اور ہر فصل پر کماتے تھے۔ کسان کا وقت اور پیسہ بچتا ہے، مگر رمیش جیسے مزدوروں کے پاس اب کٹائی کے وقت کوئی کام نہیں۔',
    options: [
      'یہی ترقی ہے۔ کسان کو مشین استعمال کرنی چاہیے۔',
      'مشین استعمال کریں، مگر مزدوروں کو نئی مہارتیں سیکھنے میں مدد دیں، جیسے مشین چلانا اور ٹھیک کرنا۔',
      'مشینوں کی وجہ سے کام کھونے والے مزدوروں کی حکومت مدد کرے۔',
      'مشین سے صرف کچھ کام کرائیں، تاکہ کچھ روزگار بچا رہے۔'
    ],
    questions: [
      'جب مشین مزدوروں کی جگہ لیتی ہے تو کس کو فائدہ ہوتا ہے اور کس کو نقصان؟',
      'کیا نئی ٹیکنالوجی نئے روزگار بھی بنا سکتی ہے؟ کون سے؟',
      'کام کھونے والے مزدوروں کی مدد کرنا کس کی ذمہ داری ہے؟'
    ],
    consider: [
      'مشینیں مشکل کام کو تیز، محفوظ اور سستا بنا سکتی ہیں، اور کسانوں کو زیادہ اناج اگانے میں مدد کر سکتی ہیں۔',
      'مگر فائدہ اکثر کچھ لوگوں کو ملتا ہے، جبکہ دوسروں کی کمائی چلی جاتی ہے۔',
      'تربیت، نئی قسم کے کام اور امدادی اسکیمیں لوگوں کو اس تبدیلی کے ساتھ چلنے میں مدد کر سکتی ہیں۔'
    ]
  },
  {
    title: 'آواز کی نقل سے دھوکا',
    story: 'رات گئے دادی کو ایک فون آتا ہے۔ ان کے پوتے روہن کی آواز ہے، روتے ہوئے: "دادی، میرا ایکسیڈنٹ ہو گیا ہے! ابھی UPI سے ₹50,000 بھیج دیں، اور پاپا کو مت بتانا۔" مگر روہن اپنے ہاسٹل میں محفوظ سو رہا ہے۔ دھوکے بازوں نے اس کی آن لائن ڈالی ویڈیوز سے AI کے ذریعے اس کی آواز کی نقل بنا لی تھی۔',
    options: [
      'دادی جلدی پیسے بھیج دیں۔ اگر سچ ہوا تو؟',
      'دادی فون کاٹیں اور روہن یا گھر کے کسی فرد کو جانے پہچانے نمبر پر فون کریں۔',
      'گھر والے ایسے فون جانچنے کے لیے ایک خفیہ کوڈ لفظ طے کریں۔',
      'روہن اپنی آواز والی ویڈیوز آن لائن ڈالنا بند کرے۔'
    ],
    questions: [
      'ایسے دھوکے اتنی آسانی سے کیوں کامیاب ہو جاتے ہیں؟',
      'ذمہ دار کون ہے: دھوکے باز، آواز والا AI بنانے والی کمپنیاں، یا دونوں؟',
      'آپ اپنے گھر کے بزرگوں کو محفوظ رہنے میں کیسے مدد کر سکتے ہیں؟'
    ],
    consider: [
      'AI چند سیکنڈ کی آواز سے ہی کسی کی آواز کی نقل کر سکتا ہے، اس لیے جانی پہچانی آواز اب ثبوت نہیں۔',
      'دھوکے باز گھبراہٹ اور راز داری پیدا کرتے ہیں: "ابھی"، "کسی کو مت بتانا"۔ رکیں، اور پہلے جانچیں۔',
      'بھارت میں سائبر دھوکے کی شکایت فوراً ہیلپ لائن 1930 پر یا cybercrime.gov.in پر کریں۔'
    ]
  },
  {
    title: 'کبھی نہ ختم ہونے والی ویڈیو فیڈ',
    story: '15 سال کا کبیر رات کو "پانچ منٹ کے لیے" شارٹ ویڈیو ایپ کھولتا ہے اور دو گھنٹے بعد نظر اٹھاتا ہے۔ ایپ کا AI ٹھیک ٹھیک سیکھ لیتا ہے کہ کون سی ویڈیوز اسے روکے رکھتی ہیں، اور ویسی ہی اور دکھاتا ہے۔ اس کی نیند اور نمبر دونوں گر رہے ہیں۔ وہ جتنی دیر اسکرول کرتا ہے، کمپنی اتنا زیادہ کماتی ہے۔',
    options: [
      'یہ کبیر کا فیصلہ ہے۔ اسے خود پر قابو رکھنا چاہیے۔',
      'ایپس میں نوجوانوں کے لیے روزانہ کی وقت کی حد پہلے سے چالو ہونی چاہیے۔',
      'ایپس بتائیں کہ ہر ویڈیو کیوں تجویز کی گئی اور لوگ اپنی فیڈ بدل سکیں۔',
      'گھر والے اور اسکول بغیر فون والا وقت طے کریں، جیسے رات 10 بجے کے بعد۔'
    ],
    questions: [
      'جب ایک ہوشیار AI سسٹم کسی نوجوان کی توجہ کھینچنے کی دوڑ لگائے تو کیا یہ منصفانہ ہے؟',
      'لت لگانے والے ڈیزائن سے ہونے والے نقصان کے لیے کیا کمپنیاں ذمہ دار ہوں؟',
      'کون سی عادتیں آپ کو اپنے اسکرین ٹائم پر قابو رکھنے میں مدد کرتی ہیں؟'
    ],
    consider: [
      'تجویز دینے والا AI اس لیے بنا ہے کہ آپ دیکھتے رہیں، کیونکہ زیادہ دیکھنے کا مطلب زیادہ اشتہار ہے۔',
      'لامتناہی اسکرول اور آٹو پلے رکنا مشکل بناتے ہیں۔ یہ ڈیزائن کی وجہ سے ہے، آپ کی کمزوری نہیں۔',
      'چھوٹے قدم مدد کرتے ہیں: اسکرین ٹائم کی حد، رات کو سونے کے کمرے میں فون نہیں، اور آٹو پلے بند۔'
    ]
  }
] };

})(window.APP_CONTENT);
