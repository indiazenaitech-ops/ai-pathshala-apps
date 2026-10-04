/* Phrasebook content: 40 topics, 456 phrases per language, the SAME shape in all 12 languages.
   APP_CONTENT[lang].topics[topicId] = { name, items: [[text in that language's own script, romanised transliteration], ...] }.
   English items carry an empty transliteration (the app hides it). Items are matched across languages by topic id + index,
   so never reorder or remove an item: add new ones at the end of a topic in all 12 languages.
   Generated from per-language source files; edit the text in place if you spot a better everyday phrase. */
window.PB_TOPICS = [
  { id: 'greetings', icon: '🙏' },
  { id: 'basics', icon: '✅' },
  { id: 'intro', icon: '👋' },
  { id: 'smalltalk', icon: '💬' },
  { id: 'feelings', icon: '😊' },
  { id: 'questions', icon: '❓' },
  { id: 'verbs', icon: '🏃' },
  { id: 'opposites', icon: '↔️' },
  { id: 'numbers', icon: '🔢' },
  { id: 'quantities', icon: '⚖️' },
  { id: 'days', icon: '📅' },
  { id: 'time', icon: '⏰' },
  { id: 'calendar', icon: '🗓️' },
  { id: 'family', icon: '👨‍👩‍👧' },
  { id: 'people', icon: '👥' },
  { id: 'colours', icon: '🎨' },
  { id: 'food', icon: '🍛' },
  { id: 'restaurant', icon: '🍽️' },
  { id: 'taste', icon: '🌶️' },
  { id: 'market', icon: '🛒' },
  { id: 'shopping', icon: '👕' },
  { id: 'money', icon: '💸' },
  { id: 'auto', icon: '🛺' },
  { id: 'transport', icon: '🚌' },
  { id: 'directions', icon: '🧭' },
  { id: 'places', icon: '🏙️' },
  { id: 'doctor', icon: '🩺' },
  { id: 'pharmacy', icon: '💊' },
  { id: 'bank', icon: '🏦' },
  { id: 'office', icon: '💼' },
  { id: 'phone', icon: '📱' },
  { id: 'school', icon: '🏫' },
  { id: 'learning', icon: '🗣️' },
  { id: 'home', icon: '🏠' },
  { id: 'routine', icon: '🌅' },
  { id: 'kitchen', icon: '🍳' },
  { id: 'household', icon: '🧹' },
  { id: 'festivals', icon: '🪔' },
  { id: 'weather', icon: '🌦️' },
  { id: 'emergency', icon: '🚨' }
];

window.APP_CONTENT = {
  en: { topics: {
    greetings: { name: 'Greetings', items: [
      ['Hello / Namaste', ''], ['Good morning', ''], ['Good night', ''], ['How are you?', ''], ['I am fine, thank you.', ''], ['And you?', ''],
      ['Nice to meet you.', ''], ['Welcome!', ''], ['Goodbye, see you.', ''], ['See you tomorrow.', ''], ['Take care.', ''], ['Long time no see!', '']
    ] },
    basics: { name: 'Yes, no, please, thank you', items: [
      ['Yes', ''], ['No', ''], ['Please', ''], ['Thank you', ''], ['Thank you very much', ''], ['You\'re welcome.', ''], ['Sorry / Excuse me', ''],
      ['No problem.', ''], ['Okay, all right', ''], ['Of course', ''], ['Maybe', ''], ['I don\'t know.', '']
    ] },
    intro: { name: 'About me', items: [
      ['What is your name?', ''], ['My name is Riya.', ''], ['Where are you from?', ''], ['I am from Delhi.', ''], ['I live in Mumbai.', ''],
      ['I am a student.', ''], ['I am a teacher.', ''], ['How old are you?', ''], ['I am 25 years old.', ''], ['This is my friend.', '']
    ] },
    smalltalk: { name: 'Small talk', items: [
      ['How is everything?', ''], ['All good.', ''], ['What are you doing?', ''], ['Nothing much.', ''], ['How is the family?', ''],
      ['Everyone is fine.', ''], ['What\'s new?', ''], ['Have you eaten?', ''], ['The weather is nice today.', ''], ['Let\'s go!', '']
    ] },
    feelings: { name: 'Feelings', items: [
      ['I am happy.', ''], ['I am sad.', ''], ['I am tired.', ''], ['I am hungry.', ''], ['I am thirsty.', ''], ['I am angry.', ''],
      ['I am scared.', ''], ['I am bored.', ''], ['I like it.', ''], ['I don\'t like it.', '']
    ] },
    questions: { name: 'Question words', items: [
      ['What?', ''], ['Who?', ''], ['Where?', ''], ['When?', ''], ['Why?', ''], ['How?', ''], ['How much? / How many?', ''], ['Which one?', ''],
      ['What is this?', ''], ['Where is the toilet?', '']
    ] },
    verbs: { name: 'Everyday actions', items: [
      ['Please come.', ''], ['Please go.', ''], ['Please sit.', ''], ['Please stand up.', ''], ['Please eat.', ''], ['Please drink.', ''],
      ['Please give.', ''], ['Please take.', ''], ['Please look.', ''], ['Please listen.', ''], ['Please tell me.', ''], ['Please wait a minute.', '']
    ] },
    opposites: { name: 'Opposites', items: [
      ['Big / Small', ''], ['Hot / Cold', ''], ['Good / Bad', ''], ['New / Old', ''], ['Near / Far', ''], ['Fast / Slow', ''], ['Open / Closed', ''],
      ['Cheap / Expensive', ''], ['Clean / Dirty', ''], ['Easy / Difficult', ''], ['More / Less', ''], ['Right / Left', '']
    ] },
    numbers: { name: 'Numbers', items: [
      ['Zero', ''], ['One', ''], ['Two', ''], ['Three', ''], ['Four', ''], ['Five', ''], ['Six', ''], ['Seven', ''], ['Eight', ''], ['Nine', ''],
      ['Ten', ''], ['Eleven', ''], ['Twelve', ''], ['Thirteen', ''], ['Fourteen', ''], ['Fifteen', ''], ['Sixteen', ''], ['Seventeen', ''],
      ['Eighteen', ''], ['Nineteen', ''], ['Twenty', ''], ['Thirty', ''], ['Forty', ''], ['Fifty', ''], ['Sixty', ''], ['Seventy', ''],
      ['Eighty', ''], ['Ninety', ''], ['Hundred', ''], ['Thousand', ''], ['One lakh', ''], ['One crore', '']
    ] },
    quantities: { name: 'Quantities & measures', items: [
      ['A little', ''], ['A lot', ''], ['Half', ''], ['One and a half', ''], ['Quarter', ''], ['One kilo', ''], ['Half a kilo', ''],
      ['One litre', ''], ['One dozen', ''], ['Enough', '']
    ] },
    days: { name: 'Days', items: [
      ['Monday', ''], ['Tuesday', ''], ['Wednesday', ''], ['Thursday', ''], ['Friday', ''], ['Saturday', ''], ['Sunday', ''], ['Today', ''],
      ['Tomorrow', ''], ['Yesterday', '']
    ] },
    time: { name: 'Time', items: [
      ['What time is it?', ''], ['It is 5 o\'clock.', ''], ['Half past five', ''], ['Morning', ''], ['Afternoon', ''], ['Evening', ''],
      ['Night', ''], ['Now', ''], ['Later', ''], ['Early', ''], ['Late', ''], ['One hour', '']
    ] },
    calendar: { name: 'Week, month, year', items: [
      ['Week', ''], ['Month', ''], ['Year', ''], ['This week', ''], ['Next month', ''], ['Last year', ''], ['What is the date today?', ''],
      ['Holiday', ''], ['Birthday', ''], ['Weekend', '']
    ] },
    family: { name: 'Family', items: [
      ['Mother', ''], ['Father', ''], ['Elder brother', ''], ['Elder sister', ''], ['Younger brother', ''], ['Younger sister', ''], ['Son', ''],
      ['Daughter', ''], ['Husband', ''], ['Wife', ''], ['Grandfather', ''], ['Grandmother', '']
    ] },
    people: { name: 'People', items: [
      ['Friend', ''], ['Neighbour', ''], ['Guest', ''], ['Child', ''], ['Children', ''], ['Boy', ''], ['Girl', ''], ['Man', ''], ['Woman', ''],
      ['Everyone', '']
    ] },
    colours: { name: 'Colours', items: [
      ['Red', ''], ['Blue', ''], ['Green', ''], ['Yellow', ''], ['White', ''], ['Black', ''], ['Orange', ''], ['Pink', ''], ['Brown', ''],
      ['Purple', '']
    ] },
    food: { name: 'Food & drink', items: [
      ['Water', ''], ['Tea', ''], ['Milk', ''], ['Rice', ''], ['Roti / bread', ''], ['Dal (lentils)', ''], ['Vegetables', ''], ['Fruit', ''],
      ['Sugar', ''], ['Salt', ''], ['Curd', ''], ['Egg', '']
    ] },
    restaurant: { name: 'At a restaurant', items: [
      ['Please show me the menu.', ''], ['What is good here?', ''], ['I am vegetarian.', ''], ['One plate of rice, please.', ''],
      ['One cup of tea, please.', ''], ['Less spicy, please.', ''], ['Please give me some water.', ''], ['Please bring the bill.', ''],
      ['It was delicious!', ''], ['Is this spicy?', '']
    ] },
    taste: { name: 'Taste & cooking requests', items: [
      ['Spicy', ''], ['Sweet', ''], ['Salty', ''], ['Sour', ''], ['Bitter', ''], ['Tasty', ''], ['Freshly made, hot', ''], ['Cold', ''],
      ['Less oil, please.', ''], ['No onion and garlic, please.', '']
    ] },
    market: { name: 'Market & bargaining', items: [
      ['How much is this?', ''], ['It is too expensive.', ''], ['Please reduce the price a little.', ''], ['What is the final price?', ''],
      ['I will take this.', ''], ['I don\'t want it.', ''], ['Do you have a bigger one?', ''], ['Please give me one kilo.', ''],
      ['Is it fresh?', ''], ['Please give me a bag.', ''], ['Do you have change?', ''], ['Please weigh it.', '']
    ] },
    shopping: { name: 'Clothes & shopping', items: [
      ['Shirt', ''], ['Trousers', ''], ['Saree', ''], ['Kurta', ''], ['Shoes', ''], ['Can I try it on?', ''], ['Do you have another colour?', ''],
      ['It is too big.', ''], ['It is too small.', ''], ['I want to return this.', '']
    ] },
    money: { name: 'Money & payment', items: [
      ['Money', ''], ['Rupees', ''], ['Change (coins)', ''], ['Cash', ''], ['Can I pay by UPI?', ''], ['Please give me the receipt.', ''],
      ['How much in total?', ''], ['That is expensive.', ''], ['That is cheap.', ''], ['I don\'t have change.', '']
    ] },
    auto: { name: 'Auto & taxi', items: [
      ['Auto! / Taxi!', ''], ['Will you go to the station?', ''], ['How much to the station?', ''], ['Please go by the meter.', ''],
      ['Please stop here.', ''], ['Please go straight.', ''], ['Please turn left.', ''], ['Please turn right.', ''], ['Please drive slowly.', ''],
      ['Please wait here.', '']
    ] },
    transport: { name: 'Bus & train', items: [
      ['Where is the bus stop?', ''], ['Which bus goes to the market?', ''], ['Does this train go to Chennai?', ''], ['One ticket, please.', ''],
      ['Two tickets to Pune, please.', ''], ['What time does the train leave?', ''], ['Which platform?', ''], ['Is this seat free?', ''],
      ['Where should I get down?', ''], ['The bus is late.', '']
    ] },
    directions: { name: 'Directions', items: [
      ['Where is it?', ''], ['Straight ahead', ''], ['Left', ''], ['Right', ''], ['Near', ''], ['Far', ''], ['Next to the bank', ''],
      ['Opposite the temple', ''], ['How far is it?', ''], ['Can I walk there?', '']
    ] },
    places: { name: 'Places in town', items: [
      ['Hospital', ''], ['Bank', ''], ['ATM', ''], ['Post office', ''], ['Police station', ''], ['Railway station', ''], ['Bus stand', ''],
      ['Market', ''], ['School', ''], ['Temple', ''], ['Mosque', ''], ['Church', '']
    ] },
    doctor: { name: 'Doctor & health', items: [
      ['I am not feeling well.', ''], ['I have a fever.', ''], ['I have a headache.', ''], ['My stomach hurts.', ''],
      ['I have a cough and cold.', ''], ['I feel dizzy.', ''], ['Since yesterday.', ''], ['I need a doctor.', ''], ['Where does it hurt?', ''],
      ['It hurts here.', ''], ['I have high blood pressure.', ''], ['Get well soon!', '']
    ] },
    pharmacy: { name: 'Pharmacy & medicine', items: [
      ['Medicine', ''], ['I need this medicine.', ''], ['Do you have medicine for fever?', ''], ['How many times a day?', ''],
      ['Before food or after food?', ''], ['Twice a day, after food.', ''], ['Tablet / Syrup', ''], ['Bandage', ''],
      ['Are there any side effects?', ''], ['Please give me a painkiller.', '']
    ] },
    bank: { name: 'Bank & post office', items: [
      ['I want to open an account.', ''], ['Please fill this form.', ''], ['I want to withdraw money.', ''], ['I want to deposit money.', ''],
      ['Account number', ''], ['Please sign here.', ''], ['Passbook', ''], ['I want to send a parcel.', ''], ['Stamp', ''],
      ['Where is the queue?', '']
    ] },
    office: { name: 'Office & work', items: [
      ['Good morning, sir / madam.', ''], ['Meeting', ''], ['I will be a little late.', ''], ['Please send me the file.', ''],
      ['I have finished the work.', ''], ['Please check it.', ''], ['Leave (day off)', ''], ['I need leave tomorrow.', ''], ['Well done!', ''],
      ['Let\'s talk tomorrow.', '']
    ] },
    phone: { name: 'Phone & internet', items: [
      ['Phone', ''], ['What is your phone number?', ''], ['Please call me.', ''], ['I will call you later.', ''], ['I can\'t hear you.', ''],
      ['Please speak loudly.', ''], ['Please send me a message on WhatsApp.', ''], ['Is there Wi-Fi here?', ''], ['Please charge the phone.', ''],
      ['Please take a photo.', '']
    ] },
    school: { name: 'School & classroom', items: [
      ['Teacher', ''], ['Student', ''], ['Book', ''], ['Notebook', ''], ['Pen', ''], ['Class', ''], ['Homework', ''], ['Exam', ''],
      ['Please open your books.', ''], ['Any questions?', ''], ['I understood.', ''], ['Please explain again.', '']
    ] },
    learning: { name: 'Learning the language', items: [
      ['Do you speak English?', ''], ['I speak a little.', ''], ['I am learning your language.', ''], ['How do you say this?', ''],
      ['What does this mean?', ''], ['Please speak slowly.', ''], ['Please say it again.', ''], ['I understand.', ''], ['I don\'t understand.', ''],
      ['Please write it down.', ''], ['Is this correct?', ''], ['Please teach me.', '']
    ] },
    home: { name: 'Home & rooms', items: [
      ['House', ''], ['Room', ''], ['Kitchen', ''], ['Bathroom', ''], ['Door', ''], ['Window', ''], ['Key', ''], ['Bed', ''], ['Chair', ''],
      ['Table', ''], ['Light', ''], ['Fan', '']
    ] },
    routine: { name: 'Daily routine', items: [
      ['I wake up at 6.', ''], ['I brush my teeth.', ''], ['I take a bath.', ''], ['I eat breakfast.', ''], ['I go to work.', ''],
      ['I come home in the evening.', ''], ['I cook dinner.', ''], ['I watch TV.', ''], ['I sleep at 10.', ''], ['What time do you wake up?', '']
    ] },
    kitchen: { name: 'Kitchen & cooking', items: [
      ['Plate', ''], ['Glass', ''], ['Spoon', ''], ['Knife', ''], ['Pot / vessel', ''], ['Stove', ''], ['Please cut the vegetables.', ''],
      ['Please boil the water.', ''], ['Please wash the dishes.', ''], ['Please add salt.', ''], ['Please taste it.', ''], ['Dinner is ready!', '']
    ] },
    household: { name: 'Around the house', items: [
      ['Please bring water.', ''], ['Please close the door.', ''], ['Please open the window.', ''], ['Please switch on the light.', ''],
      ['Please switch off the fan.', ''], ['Please clean the room.', ''], ['Please wash the clothes.', ''], ['Please come here.', ''],
      ['Please sit down.', ''], ['Have some tea.', ''], ['Please help me.', ''], ['Anything else?', '']
    ] },
    festivals: { name: 'Festivals & wishes', items: [
      ['Happy Diwali!', ''], ['Eid Mubarak!', ''], ['Happy Holi!', ''], ['Merry Christmas!', ''], ['Happy New Year!', ''],
      ['Happy Pongal / Sankranti!', ''], ['Happy Independence Day!', ''], ['Happy birthday!', ''], ['Congratulations!', ''], ['Best wishes!', ''],
      ['Please come to our home for the festival.', ''], ['Please have some sweets.', '']
    ] },
    weather: { name: 'Weather & nature', items: [
      ['How is the weather?', ''], ['It is raining.', ''], ['It is very hot.', ''], ['It is cold.', ''], ['Take an umbrella.', ''], ['Sun', ''],
      ['Moon', ''], ['Wind', ''], ['Tree', ''], ['River', '']
    ] },
    emergency: { name: 'Emergencies', items: [
      ['Help!', ''], ['Call the police!', ''], ['Call an ambulance!', ''], ['Call a doctor, quickly!', ''], ['Fire!', ''],
      ['There has been an accident.', ''], ['I have lost my bag.', ''], ['I am lost.', ''], ['Be careful!', ''], ['Is everything okay?', ''],
      ['Stop!', ''], ['Call 112 (emergency number).', '']
    ] }
  } },
  hi: { topics: {
    greetings: { name: 'अभिवादन', items: [
      ['नमस्ते', 'namaste'], ['सुप्रभात', 'suprabhaat'], ['शुभ रात्रि', 'shubh raatri'], ['आप कैसे हैं?', 'aap kaise hain?'],
      ['मैं ठीक हूँ, धन्यवाद।', 'main theek hoon, dhanyavaad.'], ['और आप?', 'aur aap?'], ['आपसे मिलकर ख़ुशी हुई।', 'aapse milkar khushi hui.'],
      ['स्वागत है!', 'swaagat hai!'], ['अच्छा, फिर मिलते हैं।', 'achha, phir milte hain.'], ['कल मिलते हैं।', 'kal milte hain.'],
      ['अपना ध्यान रखिए।', 'apna dhyaan rakhiye.'], ['बहुत दिनों बाद मिले!', 'bahut dinon baad mile!']
    ] },
    basics: { name: 'हाँ, नहीं, कृपया, धन्यवाद', items: [
      ['हाँ', 'haan'], ['नहीं', 'nahin'], ['कृपया', 'kripaya'], ['धन्यवाद', 'dhanyavaad'], ['बहुत-बहुत धन्यवाद', 'bahut bahut dhanyavaad'],
      ['कोई बात नहीं।', 'koi baat nahin.'], ['माफ़ कीजिए', 'maaf keejiye'], ['कोई समस्या नहीं।', 'koi samasya nahin.'], ['ठीक है', 'theek hai'],
      ['ज़रूर', 'zaroor'], ['शायद', 'shaayad'], ['मुझे नहीं पता।', 'mujhe nahin pata.']
    ] },
    intro: { name: 'मेरे बारे में', items: [
      ['आपका नाम क्या है?', 'aapka naam kya hai?'], ['मेरा नाम रिया है।', 'mera naam Riya hai.'], ['आप कहाँ से हैं?', 'aap kahaan se hain?'],
      ['मैं दिल्ली से हूँ।', 'main Dilli se hoon.'], ['मैं मुंबई में रहता हूँ।', 'main Mumbai mein rahta hoon.'],
      ['मैं विद्यार्थी हूँ।', 'main vidyaarthi hoon.'], ['मैं शिक्षक हूँ।', 'main shikshak hoon.'], ['आपकी उम्र क्या है?', 'aapki umra kya hai?'],
      ['मैं पच्चीस साल का हूँ।', 'main pachchees saal ka hoon.'], ['यह मेरा दोस्त है।', 'yah mera dost hai.']
    ] },
    smalltalk: { name: 'हल्की-फुल्की बातें', items: [
      ['सब कैसा चल रहा है?', 'sab kaisa chal raha hai?'], ['सब ठीक है।', 'sab theek hai.'], ['आप क्या कर रहे हैं?', 'aap kya kar rahe hain?'],
      ['कुछ ख़ास नहीं।', 'kuchh khaas nahin.'], ['घर में सब कैसे हैं?', 'ghar mein sab kaise hain?'], ['सब ठीक हैं।', 'sab theek hain.'],
      ['क्या नया है?', 'kya naya hai?'], ['आपने खाना खाया?', 'aapne khaana khaaya?'], ['आज मौसम अच्छा है।', 'aaj mausam achha hai.'],
      ['चलिए!', 'chaliye!']
    ] },
    feelings: { name: 'भावनाएँ', items: [
      ['मैं ख़ुश हूँ।', 'main khush hoon.'], ['मैं दुखी हूँ।', 'main dukhi hoon.'], ['मैं थक गया हूँ।', 'main thak gaya hoon.'],
      ['मुझे भूख लगी है।', 'mujhe bhookh lagi hai.'], ['मुझे प्यास लगी है।', 'mujhe pyaas lagi hai.'],
      ['मुझे गुस्सा आ रहा है।', 'mujhe gussa aa raha hai.'], ['मुझे डर लग रहा है।', 'mujhe dar lag raha hai.'],
      ['मैं ऊब गया हूँ।', 'main oob gaya hoon.'], ['मुझे यह पसंद है।', 'mujhe yah pasand hai.'],
      ['मुझे यह पसंद नहीं है।', 'mujhe yah pasand nahin hai.']
    ] },
    questions: { name: 'प्रश्न शब्द', items: [
      ['क्या?', 'kya?'], ['कौन?', 'kaun?'], ['कहाँ?', 'kahaan?'], ['कब?', 'kab?'], ['क्यों?', 'kyon?'], ['कैसे?', 'kaise?'],
      ['कितना? / कितने?', 'kitna? / kitne?'], ['कौन सा?', 'kaun sa?'], ['यह क्या है?', 'yah kya hai?'], ['शौचालय कहाँ है?', 'shauchaalay kahaan hai?']
    ] },
    verbs: { name: 'रोज़ के काम', items: [
      ['आइए।', 'aaiye.'], ['जाइए।', 'jaaiye.'], ['बैठिए।', 'baithiye.'], ['खड़े हो जाइए।', 'khade ho jaaiye.'], ['खाइए।', 'khaaiye.'],
      ['पीजिए।', 'peejiye.'], ['दीजिए।', 'deejiye.'], ['लीजिए।', 'leejiye.'], ['देखिए।', 'dekhiye.'], ['सुनिए।', 'suniye.'],
      ['मुझे बताइए।', 'mujhe bataaiye.'], ['एक मिनट रुकिए।', 'ek minute rukiye.']
    ] },
    opposites: { name: 'विपरीत शब्द', items: [
      ['बड़ा / छोटा', 'bada / chhota'], ['गरम / ठंडा', 'garam / thanda'], ['अच्छा / बुरा', 'achha / bura'], ['नया / पुराना', 'naya / puraana'],
      ['पास / दूर', 'paas / door'], ['तेज़ / धीमा', 'tez / dheema'], ['खुला / बंद', 'khula / band'], ['सस्ता / महँगा', 'sasta / mahanga'],
      ['साफ़ / गंदा', 'saaf / ganda'], ['आसान / मुश्किल', 'aasaan / mushkil'], ['ज़्यादा / कम', 'zyaada / kam'],
      ['दायाँ / बायाँ', 'daayaan / baayaan']
    ] },
    numbers: { name: 'गिनती', items: [
      ['शून्य', 'shoonya'], ['एक', 'ek'], ['दो', 'do'], ['तीन', 'teen'], ['चार', 'chaar'], ['पाँच', 'paanch'], ['छह', 'chhah'], ['सात', 'saat'],
      ['आठ', 'aath'], ['नौ', 'nau'], ['दस', 'das'], ['ग्यारह', 'gyaarah'], ['बारह', 'baarah'], ['तेरह', 'terah'], ['चौदह', 'chaudah'],
      ['पंद्रह', 'pandrah'], ['सोलह', 'solah'], ['सत्रह', 'satrah'], ['अठारह', 'athaarah'], ['उन्नीस', 'unnees'], ['बीस', 'bees'], ['तीस', 'tees'],
      ['चालीस', 'chaalees'], ['पचास', 'pachaas'], ['साठ', 'saath'], ['सत्तर', 'sattar'], ['अस्सी', 'assi'], ['नब्बे', 'nabbe'], ['सौ', 'sau'],
      ['हज़ार', 'hazaar'], ['एक लाख', 'ek laakh'], ['एक करोड़', 'ek karod']
    ] },
    quantities: { name: 'मात्रा और माप', items: [
      ['थोड़ा', 'thoda'], ['बहुत', 'bahut'], ['आधा', 'aadha'], ['डेढ़', 'dedh'], ['चौथाई', 'chauthaai'], ['एक किलो', 'ek kilo'],
      ['आधा किलो', 'aadha kilo'], ['एक लीटर', 'ek litre'], ['एक दर्जन', 'ek darjan'], ['बस, काफ़ी है', 'bas, kaafi hai']
    ] },
    days: { name: 'दिन', items: [
      ['सोमवार', 'somvaar'], ['मंगलवार', 'mangalvaar'], ['बुधवार', 'budhvaar'], ['गुरुवार', 'guruvaar'], ['शुक्रवार', 'shukravaar'],
      ['शनिवार', 'shanivaar'], ['रविवार', 'ravivaar'], ['आज', 'aaj'], ['कल (आने वाला)', 'kal (aane vaala)'], ['कल (बीता हुआ)', 'kal (beeta hua)']
    ] },
    time: { name: 'समय', items: [
      ['क्या समय हुआ है?', 'kya samay hua hai?'], ['पाँच बजे हैं।', 'paanch baje hain.'], ['साढ़े पाँच', 'saadhe paanch'], ['सुबह', 'subah'],
      ['दोपहर', 'dopahar'], ['शाम', 'shaam'], ['रात', 'raat'], ['अभी', 'abhi'], ['बाद में', 'baad mein'], ['जल्दी', 'jaldi'], ['देर से', 'der se'],
      ['एक घंटा', 'ek ghanta']
    ] },
    calendar: { name: 'हफ़्ता, महीना, साल', items: [
      ['हफ़्ता', 'hafta'], ['महीना', 'maheena'], ['साल', 'saal'], ['इस हफ़्ते', 'is hafte'], ['अगले महीने', 'agle maheene'],
      ['पिछले साल', 'pichhle saal'], ['आज क्या तारीख़ है?', 'aaj kya taareekh hai?'], ['छुट्टी', 'chhutti'], ['जन्मदिन', 'janmadin'],
      ['सप्ताहांत (वीकेंड)', 'saptaahaant (weekend)']
    ] },
    family: { name: 'परिवार', items: [
      ['माँ', 'maan'], ['पिता जी', 'pita ji'], ['बड़ा भाई', 'bada bhai'], ['बड़ी बहन', 'badi bahan'], ['छोटा भाई', 'chhota bhai'],
      ['छोटी बहन', 'chhoti bahan'], ['बेटा', 'beta'], ['बेटी', 'beti'], ['पति', 'pati'], ['पत्नी', 'patni'], ['दादा जी', 'daada ji'],
      ['दादी जी', 'daadi ji']
    ] },
    people: { name: 'लोग', items: [
      ['दोस्त', 'dost'], ['पड़ोसी', 'padosi'], ['मेहमान', 'mehmaan'], ['बच्चा', 'bachcha'], ['बच्चे', 'bachche'], ['लड़का', 'ladka'],
      ['लड़की', 'ladki'], ['आदमी', 'aadmi'], ['औरत', 'aurat'], ['सब लोग', 'sab log']
    ] },
    colours: { name: 'रंग', items: [
      ['लाल', 'laal'], ['नीला', 'neela'], ['हरा', 'hara'], ['पीला', 'peela'], ['सफ़ेद', 'safed'], ['काला', 'kaala'], ['नारंगी', 'naarangi'],
      ['गुलाबी', 'gulaabi'], ['भूरा', 'bhoora'], ['बैंगनी', 'baingani']
    ] },
    food: { name: 'खाना-पीना', items: [
      ['पानी', 'paani'], ['चाय', 'chai'], ['दूध', 'doodh'], ['चावल', 'chaawal'], ['रोटी', 'roti'], ['दाल', 'daal'], ['सब्ज़ी', 'sabzi'],
      ['फल', 'phal'], ['चीनी', 'cheeni'], ['नमक', 'namak'], ['दही', 'dahi'], ['अंडा', 'anda']
    ] },
    restaurant: { name: 'रेस्तराँ में', items: [
      ['कृपया मेन्यू दिखाइए।', 'kripaya menu dikhaaiye.'], ['यहाँ क्या अच्छा मिलता है?', 'yahaan kya achha milta hai?'],
      ['मैं शाकाहारी हूँ।', 'main shaakaahaari hoon.'], ['एक प्लेट चावल दीजिए।', 'ek plate chaawal deejiye.'],
      ['एक कप चाय दीजिए।', 'ek cup chai deejiye.'], ['कम मिर्च वाला बनाइए।', 'kam mirch vaala banaaiye.'],
      ['थोड़ा पानी दीजिए।', 'thoda paani deejiye.'], ['बिल ले आइए।', 'bill le aaiye.'], ['बहुत स्वादिष्ट था!', 'bahut swaadisht tha!'],
      ['क्या यह तीखा है?', 'kya yah teekha hai?']
    ] },
    taste: { name: 'स्वाद और खाना बनाना', items: [
      ['तीखा', 'teekha'], ['मीठा', 'meetha'], ['नमकीन', 'namkeen'], ['खट्टा', 'khatta'], ['कड़वा', 'kadva'], ['स्वादिष्ट', 'swaadisht'],
      ['गरमागरम, ताज़ा', 'garmaagaram, taaza'], ['ठंडा', 'thanda'], ['कम तेल डालिए।', 'kam tel daaliye.'],
      ['प्याज़-लहसुन मत डालिए।', 'pyaaz lahsun mat daaliye.']
    ] },
    market: { name: 'बाज़ार और मोल-भाव', items: [
      ['यह कितने का है?', 'yah kitne ka hai?'], ['बहुत महँगा है।', 'bahut mahanga hai.'], ['थोड़ा कम कर दीजिए।', 'thoda kam kar deejiye.'],
      ['आख़िरी दाम क्या है?', 'aakhiri daam kya hai?'], ['मैं यह ले लूँगा।', 'main yah le loonga.'], ['मुझे नहीं चाहिए।', 'mujhe nahin chaahiye.'],
      ['इससे बड़ा है?', 'isse bada hai?'], ['एक किलो दे दीजिए।', 'ek kilo de deejiye.'], ['क्या यह ताज़ा है?', 'kya yah taaza hai?'],
      ['एक थैली दे दीजिए।', 'ek thaili de deejiye.'], ['खुले पैसे हैं?', 'khule paise hain?'], ['तौल दीजिए।', 'taul deejiye.']
    ] },
    shopping: { name: 'कपड़े और ख़रीदारी', items: [
      ['कमीज़', 'kameez'], ['पैंट', 'pant'], ['साड़ी', 'saadi'], ['कुर्ता', 'kurta'], ['जूते', 'joote'],
      ['क्या मैं इसे पहनकर देख सकता हूँ?', 'kya main ise pahankar dekh sakta hoon?'], ['दूसरा रंग है?', 'doosra rang hai?'],
      ['यह बहुत बड़ा है।', 'yah bahut bada hai.'], ['यह बहुत छोटा है।', 'yah bahut chhota hai.'],
      ['मैं इसे वापस करना चाहता हूँ।', 'main ise vaapas karna chaahta hoon.']
    ] },
    money: { name: 'पैसे और भुगतान', items: [
      ['पैसे', 'paise'], ['रुपये', 'rupaye'], ['खुले पैसे', 'khule paise'], ['नकद', 'nakad'],
      ['क्या मैं UPI से पेमेंट कर सकता हूँ?', 'kya main UPI se payment kar sakta hoon?'], ['रसीद दे दीजिए।', 'raseed de deejiye.'],
      ['कुल कितना हुआ?', 'kul kitna hua?'], ['यह महँगा है।', 'yah mahanga hai.'], ['यह सस्ता है।', 'yah sasta hai.'],
      ['मेरे पास खुले पैसे नहीं हैं।', 'mere paas khule paise nahin hain.']
    ] },
    auto: { name: 'ऑटो और टैक्सी', items: [
      ['ऑटो! / टैक्सी!', 'auto! / taxi!'], ['स्टेशन चलेंगे?', 'station chalenge?'], ['स्टेशन तक कितना लगेगा?', 'station tak kitna lagega?'],
      ['मीटर से चलिए।', 'meter se chaliye.'], ['यहाँ रोकिए।', 'yahaan rokiye.'], ['सीधे चलिए।', 'seedhe chaliye.'],
      ['बाएँ मुड़िए।', 'baayen mudiye.'], ['दाएँ मुड़िए।', 'daayen mudiye.'], ['धीरे चलाइए।', 'dheere chalaaiye.'], ['यहाँ रुकिए।', 'yahaan rukiye.']
    ] },
    transport: { name: 'बस और ट्रेन', items: [
      ['बस स्टॉप कहाँ है?', 'bus stop kahaan hai?'], ['बाज़ार कौन सी बस जाती है?', 'baazaar kaun si bus jaati hai?'],
      ['क्या यह ट्रेन चेन्नई जाती है?', 'kya yah train Chennai jaati hai?'], ['एक टिकट दीजिए।', 'ek ticket deejiye.'],
      ['पुणे की दो टिकट दीजिए।', 'Pune ki do ticket deejiye.'], ['ट्रेन कितने बजे चलती है?', 'train kitne baje chalti hai?'],
      ['कौन सा प्लेटफ़ॉर्म?', 'kaun sa platform?'], ['क्या यह सीट खाली है?', 'kya yah seat khaali hai?'],
      ['मुझे कहाँ उतरना चाहिए?', 'mujhe kahaan utarna chaahiye?'], ['बस देर से आ रही है।', 'bus der se aa rahi hai.']
    ] },
    directions: { name: 'रास्ता', items: [
      ['यह कहाँ है?', 'yah kahaan hai?'], ['सीधे आगे', 'seedhe aage'], ['बाएँ', 'baayen'], ['दाएँ', 'daayen'], ['पास', 'paas'], ['दूर', 'door'],
      ['बैंक के बगल में', 'bank ke bagal mein'], ['मंदिर के सामने', 'mandir ke saamne'], ['कितनी दूर है?', 'kitni door hai?'],
      ['क्या मैं पैदल जा सकता हूँ?', 'kya main paidal ja sakta hoon?']
    ] },
    places: { name: 'शहर की जगहें', items: [
      ['अस्पताल', 'aspataal'], ['बैंक', 'bank'], ['ATM', 'ATM'], ['डाकघर', 'daakghar'], ['पुलिस थाना', 'police thaana'],
      ['रेलवे स्टेशन', 'railway station'], ['बस स्टैंड', 'bus stand'], ['बाज़ार', 'baazaar'], ['स्कूल', 'school'], ['मंदिर', 'mandir'],
      ['मस्जिद', 'masjid'], ['गिरजाघर', 'girjaaghar']
    ] },
    doctor: { name: 'डॉक्टर और स्वास्थ्य', items: [
      ['मेरी तबीयत ठीक नहीं है।', 'meri tabiyat theek nahin hai.'], ['मुझे बुख़ार है।', 'mujhe bukhaar hai.'],
      ['मेरे सिर में दर्द है।', 'mere sir mein dard hai.'], ['मेरे पेट में दर्द है।', 'mere pet mein dard hai.'],
      ['मुझे खाँसी और ज़ुकाम है।', 'mujhe khaansi aur zukaam hai.'], ['मुझे चक्कर आ रहे हैं।', 'mujhe chakkar aa rahe hain.'], ['कल से।', 'kal se.'],
      ['मुझे डॉक्टर चाहिए।', 'mujhe doctor chaahiye.'], ['कहाँ दर्द है?', 'kahaan dard hai?'], ['यहाँ दर्द है।', 'yahaan dard hai.'],
      ['मुझे हाई ब्लड प्रेशर है।', 'mujhe high blood pressure hai.'], ['जल्दी ठीक हो जाइए!', 'jaldi theek ho jaaiye!']
    ] },
    pharmacy: { name: 'दवाई की दुकान', items: [
      ['दवाई', 'davaai'], ['मुझे यह दवाई चाहिए।', 'mujhe yah davaai chaahiye.'], ['बुख़ार की दवाई है?', 'bukhaar ki davaai hai?'],
      ['दिन में कितनी बार?', 'din mein kitni baar?'], ['खाने से पहले या बाद में?', 'khaane se pahle ya baad mein?'],
      ['दिन में दो बार, खाने के बाद।', 'din mein do baar, khaane ke baad.'], ['गोली / सिरप', 'goli / syrup'], ['पट्टी', 'patti'],
      ['कोई साइड इफ़ेक्ट है?', 'koi side effect hai?'], ['दर्द की दवाई दीजिए।', 'dard ki davaai deejiye.']
    ] },
    bank: { name: 'बैंक और डाकघर', items: [
      ['मैं खाता खोलना चाहता हूँ।', 'main khaata kholna chaahta hoon.'], ['यह फ़ॉर्म भरिए।', 'yah form bhariye.'],
      ['मुझे पैसे निकालने हैं।', 'mujhe paise nikaalne hain.'], ['मुझे पैसे जमा करने हैं।', 'mujhe paise jama karne hain.'],
      ['खाता नंबर', 'khaata number'], ['यहाँ हस्ताक्षर कीजिए।', 'yahaan hastaakshar keejiye.'], ['पासबुक', 'passbook'],
      ['मुझे पार्सल भेजना है।', 'mujhe parcel bhejna hai.'], ['डाक टिकट', 'daak ticket'], ['लाइन कहाँ है?', 'line kahaan hai?']
    ] },
    office: { name: 'दफ़्तर और काम', items: [
      ['नमस्ते सर / मैडम।', 'namaste sir / madam.'], ['मीटिंग', 'meeting'], ['मुझे थोड़ी देर हो जाएगी।', 'mujhe thodi der ho jaayegi.'],
      ['मुझे फ़ाइल भेज दीजिए।', 'mujhe file bhej deejiye.'], ['मैंने काम पूरा कर लिया।', 'maine kaam poora kar liya.'],
      ['इसे जाँच लीजिए।', 'ise jaanch leejiye.'], ['अवकाश (छुट्टी)', 'avkaash (chhutti)'], ['मुझे कल छुट्टी चाहिए।', 'mujhe kal chhutti chaahiye.'],
      ['बहुत अच्छा काम किया!', 'bahut achha kaam kiya!'], ['कल बात करते हैं।', 'kal baat karte hain.']
    ] },
    phone: { name: 'फ़ोन और इंटरनेट', items: [
      ['फ़ोन', 'phone'], ['आपका फ़ोन नंबर क्या है?', 'aapka phone number kya hai?'], ['मुझे फ़ोन कीजिए।', 'mujhe phone keejiye.'],
      ['मैं आपको बाद में फ़ोन करूँगा।', 'main aapko baad mein phone karoonga.'], ['आपकी आवाज़ नहीं आ रही।', 'aapki aawaaz nahin aa rahi.'],
      ['ज़ोर से बोलिए।', 'zor se boliye.'], ['WhatsApp पर मैसेज कर दीजिए।', 'WhatsApp par message kar deejiye.'],
      ['यहाँ Wi-Fi है?', 'yahaan Wi-Fi hai?'], ['फ़ोन चार्ज कर दीजिए।', 'phone charge kar deejiye.'], ['एक फ़ोटो खींचिए।', 'ek photo kheenchiye.']
    ] },
    school: { name: 'स्कूल और कक्षा', items: [
      ['शिक्षक', 'shikshak'], ['विद्यार्थी', 'vidyaarthi'], ['किताब', 'kitaab'], ['कॉपी', 'copy'], ['कलम', 'kalam'], ['कक्षा', 'kaksha'],
      ['गृहकार्य', 'grihkaarya'], ['परीक्षा', 'pareeksha'], ['अपनी किताबें खोलिए।', 'apni kitaaben kholiye.'], ['कोई सवाल?', 'koi sawaal?'],
      ['मैं समझ गया।', 'main samajh gaya.'], ['फिर से समझाइए।', 'phir se samjhaaiye.']
    ] },
    learning: { name: 'भाषा सीखना', items: [
      ['क्या आप अंग्रेज़ी बोलते हैं?', 'kya aap angrezi bolte hain?'], ['मैं थोड़ा-थोड़ा बोलता हूँ।', 'main thoda thoda bolta hoon.'],
      ['मैं आपकी भाषा सीख रहा हूँ।', 'main aapki bhaasha seekh raha hoon.'], ['इसे कैसे कहते हैं?', 'ise kaise kahte hain?'],
      ['इसका क्या मतलब है?', 'iska kya matlab hai?'], ['धीरे बोलिए।', 'dheere boliye.'], ['फिर से कहिए।', 'phir se kahiye.'],
      ['मैं समझता हूँ।', 'main samajhta hoon.'], ['मैं नहीं समझा।', 'main nahin samjha.'], ['लिखकर दीजिए।', 'likhkar deejiye.'],
      ['क्या यह सही है?', 'kya yah sahi hai?'], ['मुझे सिखाइए।', 'mujhe sikhaaiye.']
    ] },
    home: { name: 'घर और कमरे', items: [
      ['घर', 'ghar'], ['कमरा', 'kamra'], ['रसोई', 'rasoi'], ['बाथरूम', 'bathroom'], ['दरवाज़ा', 'darvaaza'], ['खिड़की', 'khidki'],
      ['चाबी', 'chaabi'], ['बिस्तर', 'bistar'], ['कुर्सी', 'kursi'], ['मेज़', 'mez'], ['बत्ती', 'batti'], ['पंखा', 'pankha']
    ] },
    routine: { name: 'रोज़ की दिनचर्या', items: [
      ['मैं छह बजे उठता हूँ।', 'main chhah baje uthta hoon.'], ['मैं दाँत साफ़ करता हूँ।', 'main daant saaf karta hoon.'],
      ['मैं नहाता हूँ।', 'main nahaata hoon.'], ['मैं नाश्ता करता हूँ।', 'main naashta karta hoon.'],
      ['मैं काम पर जाता हूँ।', 'main kaam par jaata hoon.'], ['मैं शाम को घर आता हूँ।', 'main shaam ko ghar aata hoon.'],
      ['मैं रात का खाना बनाता हूँ।', 'main raat ka khaana banaata hoon.'], ['मैं TV देखता हूँ।', 'main TV dekhta hoon.'],
      ['मैं दस बजे सोता हूँ।', 'main das baje sota hoon.'], ['आप कितने बजे उठते हैं?', 'aap kitne baje uthte hain?']
    ] },
    kitchen: { name: 'रसोई और खाना बनाना', items: [
      ['थाली', 'thaali'], ['गिलास', 'gilaas'], ['चम्मच', 'chammach'], ['चाकू', 'chaaku'], ['बर्तन', 'bartan'], ['चूल्हा', 'choolha'],
      ['सब्ज़ी काट दीजिए।', 'sabzi kaat deejiye.'], ['पानी उबाल दीजिए।', 'paani ubaal deejiye.'], ['बर्तन धो दीजिए।', 'bartan dho deejiye.'],
      ['नमक डालिए।', 'namak daaliye.'], ['चखकर देखिए।', 'chakhkar dekhiye.'], ['खाना तैयार है!', 'khaana taiyaar hai!']
    ] },
    household: { name: 'घर के काम', items: [
      ['पानी ले आइए।', 'paani le aaiye.'], ['दरवाज़ा बंद कर दीजिए।', 'darvaaza band kar deejiye.'], ['खिड़की खोल दीजिए।', 'khidki khol deejiye.'],
      ['बत्ती जला दीजिए।', 'batti jala deejiye.'], ['पंखा बंद कर दीजिए।', 'pankha band kar deejiye.'],
      ['कमरा साफ़ कर दीजिए।', 'kamra saaf kar deejiye.'], ['कपड़े धो दीजिए।', 'kapde dho deejiye.'], ['यहाँ आइए।', 'yahaan aaiye.'],
      ['बैठ जाइए।', 'baith jaaiye.'], ['चाय लीजिए।', 'chai leejiye.'], ['मेरी मदद कीजिए।', 'meri madad keejiye.'], ['और कुछ?', 'aur kuchh?']
    ] },
    festivals: { name: 'त्योहार और शुभकामनाएँ', items: [
      ['दीपावली की शुभकामनाएँ!', 'Deepawali ki shubhkaamnaayen!'], ['ईद मुबारक!', 'Eid mubaarak!'],
      ['होली की शुभकामनाएँ!', 'Holi ki shubhkaamnaayen!'], ['क्रिसमस की शुभकामनाएँ!', 'Christmas ki shubhkaamnaayen!'],
      ['नया साल मुबारक!', 'naya saal mubaarak!'], ['मकर संक्रांति की शुभकामनाएँ!', 'Makar Sankraanti ki shubhkaamnaayen!'],
      ['स्वतंत्रता दिवस की शुभकामनाएँ!', 'swatantrata diwas ki shubhkaamnaayen!'], ['जन्मदिन मुबारक!', 'janmadin mubaarak!'],
      ['बधाई हो!', 'badhaai ho!'], ['शुभकामनाएँ!', 'shubhkaamnaayen!'], ['त्योहार पर हमारे घर आइए।', 'tyohaar par hamaare ghar aaiye.'],
      ['मिठाई लीजिए।', 'mithaai leejiye.']
    ] },
    weather: { name: 'मौसम और प्रकृति', items: [
      ['मौसम कैसा है?', 'mausam kaisa hai?'], ['बारिश हो रही है।', 'baarish ho rahi hai.'], ['बहुत गर्मी है।', 'bahut garmi hai.'],
      ['ठंड है।', 'thand hai.'], ['छाता ले जाइए।', 'chhaata le jaaiye.'], ['सूरज', 'sooraj'], ['चाँद', 'chaand'], ['हवा', 'hawa'], ['पेड़', 'ped'],
      ['नदी', 'nadi']
    ] },
    emergency: { name: 'आपात स्थिति', items: [
      ['बचाओ!', 'bachao!'], ['पुलिस को बुलाइए!', 'police ko bulaaiye!'], ['एम्बुलेंस बुलाइए!', 'ambulance bulaaiye!'],
      ['जल्दी डॉक्टर को बुलाइए!', 'jaldi doctor ko bulaaiye!'], ['आग लगी है!', 'aag lagi hai!'], ['एक दुर्घटना हुई है।', 'ek durghatna hui hai.'],
      ['मेरा बैग खो गया है।', 'mera bag kho gaya hai.'], ['मैं रास्ता भूल गया हूँ।', 'main raasta bhool gaya hoon.'], ['सावधान!', 'saavdhaan!'],
      ['सब ठीक है?', 'sab theek hai?'], ['रुकिए!', 'rukiye!'], ['112 पर फ़ोन कीजिए।', '112 par phone keejiye.']
    ] }
  } },
  bn: { topics: {
    greetings: { name: 'সম্ভাষণ', items: [
      ['নমস্কার', 'nomoshkar'], ['শুভ সকাল', 'shubho shokal'], ['শুভ রাত্রি', 'shubho ratri'], ['আপনি কেমন আছেন?', 'apni kemon achhen?'],
      ['আমি ভালো আছি, ধন্যবাদ।', 'ami bhalo achhi, dhonnobad.'], ['আর আপনি?', 'ar apni?'],
      ['আপনার সাথে দেখা হয়ে ভালো লাগল।', 'apnar shathe dekha hoye bhalo laglo.'], ['স্বাগতম!', 'shagotom!'],
      ['আচ্ছা, আবার দেখা হবে।', 'achchha, abar dekha hobe.'], ['কাল দেখা হবে।', 'kal dekha hobe.'], ['ভালো থাকবেন।', 'bhalo thakben.'],
      ['অনেক দিন পর দেখা!', 'onek din por dekha!']
    ] },
    basics: { name: 'হ্যাঁ, না, দয়া করে, ধন্যবাদ', items: [
      ['হ্যাঁ', 'hyan'], ['না', 'na'], ['দয়া করে', 'doya kore'], ['ধন্যবাদ', 'dhonnobad'], ['অনেক ধন্যবাদ', 'onek dhonnobad'],
      ['কোনো ব্যাপার না।', 'kono byapar na.'], ['মাফ করবেন', 'maf korben'], ['কোনো সমস্যা নেই।', 'kono shomossha nei.'],
      ['ঠিক আছে', 'thik achhe'], ['অবশ্যই', 'oboshshoi'], ['হয়তো', 'hoyto'], ['আমি জানি না।', 'ami jani na.']
    ] },
    intro: { name: 'আমার কথা', items: [
      ['আপনার নাম কী?', 'apnar nam ki?'], ['আমার নাম রিয়া।', 'amar nam Riya.'], ['আপনি কোথা থেকে এসেছেন?', 'apni kotha theke eshechhen?'],
      ['আমি দিল্লি থেকে এসেছি।', 'ami Dilli theke eshechhi.'], ['আমি মুম্বইয়ে থাকি।', 'ami Mumbai-e thaki.'], ['আমি ছাত্র।', 'ami chhatro.'],
      ['আমি শিক্ষক।', 'ami shikkhok.'], ['আপনার বয়স কত?', 'apnar boyosh koto?'], ['আমার বয়স পঁচিশ বছর।', 'amar boyosh ponchish bochhor.'],
      ['এ আমার বন্ধু।', 'e amar bondhu.']
    ] },
    smalltalk: { name: 'গল্পগুজব', items: [
      ['সব কেমন চলছে?', 'shob kemon cholchhe?'], ['সব ভালো।', 'shob bhalo.'], ['আপনি কী করছেন?', 'apni ki korchhen?'],
      ['বিশেষ কিছু না।', 'bishesh kichhu na.'], ['বাড়ির সবাই কেমন আছেন?', 'barir shobai kemon achhen?'],
      ['সবাই ভালো আছেন।', 'shobai bhalo achhen.'], ['নতুন খবর কী?', 'notun khobor ki?'], ['খাওয়া হয়েছে?', 'khaoa hoyechhe?'],
      ['আজ আবহাওয়া ভালো।', 'aj abhaoa bhalo.'], ['চলুন!', 'cholun!']
    ] },
    feelings: { name: 'অনুভূতি', items: [
      ['আমি খুশি।', 'ami khushi.'], ['আমার মন খারাপ।', 'amar mon kharap.'], ['আমি ক্লান্ত।', 'ami klanto.'],
      ['আমার খিদে পেয়েছে।', 'amar khide peyechhe.'], ['আমার তেষ্টা পেয়েছে।', 'amar teshta peyechhe.'], ['আমার রাগ হচ্ছে।', 'amar rag hochchhe.'],
      ['আমার ভয় করছে।', 'amar bhoy korchhe.'], ['আমার একঘেয়ে লাগছে।', 'amar ekgheye lagchhe.'], ['আমার এটা পছন্দ।', 'amar eta pochhondo.'],
      ['আমার এটা পছন্দ নয়।', 'amar eta pochhondo noy.']
    ] },
    questions: { name: 'প্রশ্নবোধক শব্দ', items: [
      ['কী?', 'ki?'], ['কে?', 'ke?'], ['কোথায়?', 'kothay?'], ['কখন?', 'kokhon?'], ['কেন?', 'keno?'], ['কীভাবে?', 'kibhabe?'],
      ['কত? / কয়টা?', 'koto? / koyta?'], ['কোনটা?', 'konta?'], ['এটা কী?', 'eta ki?'], ['শৌচাগার কোথায়?', 'shouchagar kothay?']
    ] },
    verbs: { name: 'রোজের কাজ', items: [
      ['আসুন।', 'ashun.'], ['যান।', 'jan.'], ['বসুন।', 'boshun.'], ['উঠে দাঁড়ান।', 'uthe daran.'], ['খান।', 'khan.'], ['পান করুন।', 'pan korun.'],
      ['দিন।', 'din.'], ['নিন।', 'nin.'], ['দেখুন।', 'dekhun.'], ['শুনুন।', 'shunun.'], ['আমাকে বলুন।', 'amake bolun.'],
      ['এক মিনিট দাঁড়ান।', 'ek minute daran.']
    ] },
    opposites: { name: 'বিপরীত শব্দ', items: [
      ['বড় / ছোট', 'boro / chhoto'], ['গরম / ঠান্ডা', 'gorom / thanda'], ['ভালো / খারাপ', 'bhalo / kharap'], ['নতুন / পুরনো', 'notun / purono'],
      ['কাছে / দূরে', 'kachhe / dure'], ['তাড়াতাড়ি / আস্তে', 'taratari / aste'], ['খোলা / বন্ধ', 'khola / bondho'],
      ['সস্তা / দামি', 'shosta / dami'], ['পরিষ্কার / নোংরা', 'porishkar / nongra'], ['সহজ / কঠিন', 'shohoj / kothin'], ['বেশি / কম', 'beshi / kom'],
      ['ডান / বাম', 'dan / bam']
    ] },
    numbers: { name: 'সংখ্যা', items: [
      ['শূন্য', 'shunno'], ['এক', 'ek'], ['দুই', 'dui'], ['তিন', 'tin'], ['চার', 'char'], ['পাঁচ', 'panch'], ['ছয়', 'chhoy'], ['সাত', 'shat'],
      ['আট', 'at'], ['নয়', 'noy'], ['দশ', 'dosh'], ['এগারো', 'egaro'], ['বারো', 'baro'], ['তেরো', 'tero'], ['চোদ্দো', 'choddo'],
      ['পনেরো', 'ponero'], ['ষোলো', 'sholo'], ['সতেরো', 'shotero'], ['আঠারো', 'atharo'], ['উনিশ', 'unish'], ['কুড়ি', 'kuri'], ['তিরিশ', 'tirish'],
      ['চল্লিশ', 'chollish'], ['পঞ্চাশ', 'ponchash'], ['ষাট', 'shat'], ['সত্তর', 'shottor'], ['আশি', 'ashi'], ['নব্বই', 'nobboi'], ['একশো', 'eksho'],
      ['হাজার', 'hajar'], ['এক লাখ', 'ek lakh'], ['এক কোটি', 'ek koti']
    ] },
    quantities: { name: 'পরিমাণ ও মাপ', items: [
      ['একটু', 'ektu'], ['অনেক', 'onek'], ['অর্ধেক', 'ordhek'], ['দেড়', 'der'], ['সিকি', 'shiki'], ['এক কিলো', 'ek kilo'], ['আধ কিলো', 'adh kilo'],
      ['এক লিটার', 'ek litre'], ['এক ডজন', 'ek dojon'], ['যথেষ্ট', 'jotheshto']
    ] },
    days: { name: 'দিন', items: [
      ['সোমবার', 'shombar'], ['মঙ্গলবার', 'mongolbar'], ['বুধবার', 'budhbar'], ['বৃহস্পতিবার', 'brihoshpotibar'], ['শুক্রবার', 'shukrobar'],
      ['শনিবার', 'shonibar'], ['রবিবার', 'robibar'], ['আজ', 'aj'], ['আগামীকাল', 'agamikal'], ['গতকাল', 'gotokal']
    ] },
    time: { name: 'সময়', items: [
      ['কয়টা বাজে?', 'koyta baje?'], ['পাঁচটা বাজে।', 'panchta baje.'], ['সাড়ে পাঁচটা', 'share panchta'], ['সকাল', 'shokal'], ['দুপুর', 'dupur'],
      ['সন্ধ্যা', 'shondhya'], ['রাত', 'rat'], ['এখন', 'ekhon'], ['পরে', 'pore'], ['তাড়াতাড়ি', 'taratari'], ['দেরি', 'deri'],
      ['এক ঘণ্টা', 'ek ghonta']
    ] },
    calendar: { name: 'সপ্তাহ, মাস, বছর', items: [
      ['সপ্তাহ', 'shoptaho'], ['মাস', 'mash'], ['বছর', 'bochhor'], ['এই সপ্তাহে', 'ei shoptahe'], ['আগামী মাসে', 'agami mashe'],
      ['গত বছর', 'goto bochhor'], ['আজ কত তারিখ?', 'aj koto tarikh?'], ['ছুটি', 'chhuti'], ['জন্মদিন', 'jonmodin'], ['সপ্তাহান্ত', 'shoptahanto']
    ] },
    family: { name: 'পরিবার', items: [
      ['মা', 'ma'], ['বাবা', 'baba'], ['দাদা (বড় ভাই)', 'dada (boro bhai)'], ['দিদি (বড় বোন)', 'didi (boro bon)'], ['ছোট ভাই', 'chhoto bhai'],
      ['ছোট বোন', 'chhoto bon'], ['ছেলে', 'chhele'], ['মেয়ে', 'meye'], ['স্বামী', 'shami'], ['স্ত্রী', 'stri'], ['দাদু', 'dadu'],
      ['ঠাকুমা', 'thakuma']
    ] },
    people: { name: 'মানুষ', items: [
      ['বন্ধু', 'bondhu'], ['প্রতিবেশী', 'protibeshi'], ['অতিথি', 'otithi'], ['শিশু', 'shishu'], ['বাচ্চারা', 'bachchara'], ['ছেলে', 'chhele'],
      ['মেয়ে', 'meye'], ['পুরুষ', 'purush'], ['মহিলা', 'mohila'], ['সবাই', 'shobai']
    ] },
    colours: { name: 'রং', items: [
      ['লাল', 'lal'], ['নীল', 'nil'], ['সবুজ', 'shobuj'], ['হলুদ', 'holud'], ['সাদা', 'shada'], ['কালো', 'kalo'], ['কমলা', 'komla'],
      ['গোলাপি', 'golapi'], ['বাদামি', 'badami'], ['বেগুনি', 'beguni']
    ] },
    food: { name: 'খাওয়া-দাওয়া', items: [
      ['জল', 'jol'], ['চা', 'cha'], ['দুধ', 'dudh'], ['ভাত', 'bhat'], ['রুটি', 'ruti'], ['ডাল', 'dal'], ['তরকারি', 'torkari'], ['ফল', 'phol'],
      ['চিনি', 'chini'], ['নুন', 'nun'], ['দই', 'doi'], ['ডিম', 'dim']
    ] },
    restaurant: { name: 'রেস্তোরাঁয়', items: [
      ['দয়া করে মেনু দেখান।', 'doya kore menu dekhan.'], ['এখানে কী ভালো?', 'ekhane ki bhalo?'], ['আমি নিরামিষাশী।', 'ami niramishashi.'],
      ['এক প্লেট ভাত দিন।', 'ek plate bhat din.'], ['এক কাপ চা দিন।', 'ek cup cha din.'], ['ঝাল কম দিন।', 'jhal kom din.'],
      ['একটু জল দিন।', 'ektu jol din.'], ['বিল নিয়ে আসুন।', 'bill niye ashun.'], ['খুব সুস্বাদু ছিল!', 'khub shushadu chhilo!'],
      ['এটা ঝাল?', 'eta jhal?']
    ] },
    taste: { name: 'স্বাদ ও রান্না', items: [
      ['ঝাল', 'jhal'], ['মিষ্টি', 'mishti'], ['নোনতা', 'nonta'], ['টক', 'tok'], ['তেতো', 'teto'], ['সুস্বাদু', 'shushadu'],
      ['গরম গরম, টাটকা', 'gorom gorom, tatka'], ['ঠান্ডা', 'thanda'], ['তেল কম দিন।', 'tel kom din.'],
      ['পেঁয়াজ-রসুন দেবেন না।', 'penyaj-roshun deben na.']
    ] },
    market: { name: 'বাজার ও দরদাম', items: [
      ['এটার দাম কত?', 'etar dam koto?'], ['খুব দামি।', 'khub dami.'], ['একটু কম করুন।', 'ektu kom korun.'], ['শেষ দাম কত?', 'shesh dam koto?'],
      ['আমি এটা নেব।', 'ami eta nebo.'], ['আমার এটা লাগবে না।', 'amar eta lagbe na.'], ['এর থেকে বড় আছে?', 'er theke boro achhe?'],
      ['এক কিলো দিন।', 'ek kilo din.'], ['এটা টাটকা?', 'eta tatka?'], ['একটা ব্যাগ দিন।', 'ekta bag din.'], ['খুচরো আছে?', 'khuchro achhe?'],
      ['ওজন করে দিন।', 'ojon kore din.']
    ] },
    shopping: { name: 'পোশাক ও কেনাকাটা', items: [
      ['শার্ট', 'shirt'], ['প্যান্ট', 'pant'], ['শাড়ি', 'shari'], ['কুর্তা', 'kurta'], ['জুতো', 'juto'],
      ['আমি এটা পরে দেখতে পারি?', 'ami eta pore dekhte pari?'], ['অন্য রং আছে?', 'onno rong achhe?'], ['এটা খুব বড়।', 'eta khub boro.'],
      ['এটা খুব ছোট।', 'eta khub chhoto.'], ['আমি এটা ফেরত দিতে চাই।', 'ami eta pherot dite chai.']
    ] },
    money: { name: 'টাকা ও পেমেন্ট', items: [
      ['টাকা', 'taka'], ['টাকা (রুপি)', 'taka (rupee)'], ['খুচরো', 'khuchro'], ['নগদ', 'nogod'], ['আমি UPI-তে দিতে পারি?', 'ami UPI-te dite pari?'],
      ['রসিদ দিন।', 'roshid din.'], ['মোট কত হল?', 'mot koto holo?'], ['এটা দামি।', 'eta dami.'], ['এটা সস্তা।', 'eta shosta.'],
      ['আমার কাছে খুচরো নেই।', 'amar kachhe khuchro nei.']
    ] },
    auto: { name: 'অটো ও ট্যাক্সি', items: [
      ['অটো! / ট্যাক্সি!', 'auto! / taxi!'], ['স্টেশন যাবেন?', 'station jaben?'], ['স্টেশন পর্যন্ত কত?', 'station porjonto koto?'],
      ['মিটারে চলুন।', 'meter-e cholun.'], ['এখানে থামুন।', 'ekhane thamun.'], ['সোজা যান।', 'shoja jan.'], ['বাঁ দিকে ঘুরুন।', 'ban dike ghurun.'],
      ['ডান দিকে ঘুরুন।', 'dan dike ghurun.'], ['আস্তে চালান।', 'aste chalan.'], ['এখানে অপেক্ষা করুন।', 'ekhane opekkha korun.']
    ] },
    transport: { name: 'বাস ও ট্রেন', items: [
      ['বাস স্টপ কোথায়?', 'bus stop kothay?'], ['বাজারে কোন বাস যায়?', 'bajare kon bus jay?'], ['এই ট্রেন চেন্নাই যায়?', 'ei train Chennai jay?'],
      ['একটা টিকিট দিন।', 'ekta ticket din.'], ['পুনের দুটো টিকিট দিন।', 'Pune-r duto ticket din.'], ['ট্রেন কখন ছাড়ে?', 'train kokhon chhare?'],
      ['কোন প্ল্যাটফর্ম?', 'kon platform?'], ['এই সিট খালি?', 'ei seat khali?'], ['আমি কোথায় নামব?', 'ami kothay nambo?'],
      ['বাস দেরি করছে।', 'bus deri korchhe.']
    ] },
    directions: { name: 'রাস্তা', items: [
      ['এটা কোথায়?', 'eta kothay?'], ['সোজা সামনে', 'shoja shamne'], ['বাঁ দিকে', 'ban dike'], ['ডান দিকে', 'dan dike'], ['কাছে', 'kachhe'],
      ['দূরে', 'dure'], ['ব্যাংকের পাশে', 'banker pashe'], ['মন্দিরের উল্টো দিকে', 'mondirer ulto dike'], ['কত দূর?', 'koto dur?'],
      ['হেঁটে যাওয়া যায়?', 'hente jaoa jay?']
    ] },
    places: { name: 'শহরের জায়গা', items: [
      ['হাসপাতাল', 'hashpatal'], ['ব্যাংক', 'bank'], ['ATM', 'ATM'], ['পোস্ট অফিস', 'post office'], ['থানা', 'thana'],
      ['রেল স্টেশন', 'rail station'], ['বাস স্ট্যান্ড', 'bus stand'], ['বাজার', 'bajar'], ['স্কুল', 'school'], ['মন্দির', 'mondir'],
      ['মসজিদ', 'moshjid'], ['গির্জা', 'girja']
    ] },
    doctor: { name: 'ডাক্তার ও স্বাস্থ্য', items: [
      ['আমার শরীর ভালো নেই।', 'amar shorir bhalo nei.'], ['আমার জ্বর হয়েছে।', 'amar jor hoyechhe.'],
      ['আমার মাথা ব্যথা করছে।', 'amar matha betha korchhe.'], ['আমার পেট ব্যথা করছে।', 'amar pet betha korchhe.'],
      ['আমার সর্দি-কাশি হয়েছে।', 'amar shordi-kashi hoyechhe.'], ['আমার মাথা ঘুরছে।', 'amar matha ghurchhe.'], ['গতকাল থেকে।', 'gotokal theke.'],
      ['আমার ডাক্তার দরকার।', 'amar daktar dorkar.'], ['কোথায় ব্যথা?', 'kothay betha?'], ['এখানে ব্যথা।', 'ekhane betha.'],
      ['আমার হাই ব্লাড প্রেশার আছে।', 'amar high blood pressure achhe.'], ['তাড়াতাড়ি সুস্থ হয়ে উঠুন!', 'taratari shustho hoye uthun!']
    ] },
    pharmacy: { name: 'ওষুধের দোকান', items: [
      ['ওষুধ', 'oshudh'], ['আমার এই ওষুধ দরকার।', 'amar ei oshudh dorkar.'], ['জ্বরের ওষুধ আছে?', 'jorer oshudh achhe?'],
      ['দিনে কতবার?', 'dine kotobar?'], ['খাওয়ার আগে না পরে?', 'khaoar age na pore?'], ['দিনে দুবার, খাওয়ার পরে।', 'dine dubar, khaoar pore.'],
      ['ট্যাবলেট / সিরাপ', 'tablet / syrup'], ['ব্যান্ডেজ', 'bandage'], ['কোনো পার্শ্বপ্রতিক্রিয়া আছে?', 'kono parshoprotikriya achhe?'],
      ['ব্যথার ওষুধ দিন।', 'bethar oshudh din.']
    ] },
    bank: { name: 'ব্যাংক ও পোস্ট অফিস', items: [
      ['আমি একটা অ্যাকাউন্ট খুলতে চাই।', 'ami ekta account khulte chai.'], ['এই ফর্মটা ভরুন।', 'ei formta bhorun.'],
      ['আমি টাকা তুলতে চাই।', 'ami taka tulte chai.'], ['আমি টাকা জমা দিতে চাই।', 'ami taka joma dite chai.'],
      ['অ্যাকাউন্ট নম্বর', 'account number'], ['এখানে সই করুন।', 'ekhane shoi korun.'], ['পাসবই', 'passboi'],
      ['আমি একটা পার্সেল পাঠাতে চাই।', 'ami ekta parcel pathate chai.'], ['ডাকটিকিট', 'dakticket'], ['লাইন কোথায়?', 'line kothay?']
    ] },
    office: { name: 'অফিস ও কাজ', items: [
      ['সুপ্রভাত স্যার / ম্যাডাম।', 'suprobhat sir / madam.'], ['মিটিং', 'meeting'], ['আমার একটু দেরি হবে।', 'amar ektu deri hobe.'],
      ['আমাকে ফাইলটা পাঠান।', 'amake file-ta pathan.'], ['আমি কাজটা শেষ করেছি।', 'ami kajta shesh korechhi.'], ['এটা দেখে নিন।', 'eta dekhe nin.'],
      ['ছুটি (কাজ থেকে)', 'chhuti (kaj theke)'], ['আমার কাল ছুটি লাগবে।', 'amar kal chhuti lagbe.'], ['খুব ভালো কাজ!', 'khub bhalo kaj!'],
      ['কাল কথা হবে।', 'kal kotha hobe.']
    ] },
    phone: { name: 'ফোন ও ইন্টারনেট', items: [
      ['ফোন', 'phone'], ['আপনার ফোন নম্বর কী?', 'apnar phone number ki?'], ['আমাকে ফোন করুন।', 'amake phone korun.'],
      ['আমি পরে ফোন করব।', 'ami pore phone korbo.'], ['আপনার কথা শোনা যাচ্ছে না।', 'apnar kotha shona jachchhe na.'], ['জোরে বলুন।', 'jore bolun.'],
      ['WhatsApp-এ মেসেজ করুন।', 'WhatsApp-e message korun.'], ['এখানে Wi-Fi আছে?', 'ekhane Wi-Fi achhe?'],
      ['ফোনটা চার্জ করুন।', 'phone-ta charge korun.'], ['একটা ছবি তুলুন।', 'ekta chhobi tulun.']
    ] },
    school: { name: 'স্কুল ও ক্লাস', items: [
      ['শিক্ষক', 'shikkhok'], ['ছাত্র', 'chhatro'], ['বই', 'boi'], ['খাতা', 'khata'], ['কলম', 'kolom'], ['ক্লাস', 'class'],
      ['বাড়ির কাজ', 'barir kaj'], ['পরীক্ষা', 'porikkha'], ['বই খুলুন।', 'boi khulun.'], ['কোনো প্রশ্ন?', 'kono proshno?'],
      ['আমি বুঝেছি।', 'ami bujhechhi.'], ['আবার বুঝিয়ে দিন।', 'abar bujhiye din.']
    ] },
    learning: { name: 'ভাষা শেখা', items: [
      ['আপনি ইংরেজি বলতে পারেন?', 'apni ingreji bolte paren?'], ['আমি একটু একটু বলতে পারি।', 'ami ektu ektu bolte pari.'],
      ['আমি আপনার ভাষা শিখছি।', 'ami apnar bhasha shikhchhi.'], ['এটাকে কী বলে?', 'etake ki bole?'], ['এর মানে কী?', 'er mane ki?'],
      ['আস্তে বলুন।', 'aste bolun.'], ['আবার বলুন।', 'abar bolun.'], ['আমি বুঝতে পারছি।', 'ami bujhte parchhi.'],
      ['আমি বুঝতে পারছি না।', 'ami bujhte parchhi na.'], ['লিখে দিন।', 'likhe din.'], ['এটা ঠিক?', 'eta thik?'], ['আমাকে শেখান।', 'amake shekhan.']
    ] },
    home: { name: 'বাড়ি ও ঘর', items: [
      ['বাড়ি', 'bari'], ['ঘর', 'ghor'], ['রান্নাঘর', 'rannaghor'], ['বাথরুম', 'bathroom'], ['দরজা', 'dorja'], ['জানালা', 'janala'],
      ['চাবি', 'chabi'], ['বিছানা', 'bichhana'], ['চেয়ার', 'chair'], ['টেবিল', 'table'], ['আলো', 'alo'], ['পাখা', 'pakha']
    ] },
    routine: { name: 'রোজের রুটিন', items: [
      ['আমি ছ-টায় উঠি।', 'ami chhotay uthi.'], ['আমি দাঁত মাজি।', 'ami dant maji.'], ['আমি স্নান করি।', 'ami snan kori.'],
      ['আমি জলখাবার খাই।', 'ami jolkhabar khai.'], ['আমি কাজে যাই।', 'ami kaje jai.'], ['আমি সন্ধ্যায় বাড়ি ফিরি।', 'ami shondhyay bari phiri.'],
      ['আমি রাতের খাবার রান্না করি।', 'ami rater khabar ranna kori.'], ['আমি TV দেখি।', 'ami TV dekhi.'],
      ['আমি দশটায় ঘুমাই।', 'ami doshtay ghumai.'], ['আপনি কখন ওঠেন?', 'apni kokhon othen?']
    ] },
    kitchen: { name: 'রান্নাঘর ও রান্না', items: [
      ['থালা', 'thala'], ['গ্লাস', 'glass'], ['চামচ', 'chamoch'], ['ছুরি', 'chhuri'], ['বাসন', 'bashon'], ['উনুন', 'unun'],
      ['সবজি কেটে দিন।', 'shobji kete din.'], ['জল ফুটিয়ে দিন।', 'jol phutiye din.'], ['বাসন মেজে দিন।', 'bashon meje din.'],
      ['নুন দিন।', 'nun din.'], ['চেখে দেখুন।', 'chekhe dekhun.'], ['খাবার তৈরি!', 'khabar toiri!']
    ] },
    household: { name: 'বাড়ির কাজ', items: [
      ['জল নিয়ে আসুন।', 'jol niye ashun.'], ['দরজা বন্ধ করুন।', 'dorja bondho korun.'], ['জানালা খুলুন।', 'janala khulun.'],
      ['আলো জ্বালান।', 'alo jalan.'], ['পাখা বন্ধ করুন।', 'pakha bondho korun.'], ['ঘর পরিষ্কার করুন।', 'ghor porishkar korun.'],
      ['কাপড় কেচে দিন।', 'kapor keche din.'], ['এখানে আসুন।', 'ekhane ashun.'], ['বসুন না।', 'boshun na.'], ['চা খান।', 'cha khan.'],
      ['আমাকে সাহায্য করুন।', 'amake shahajjo korun.'], ['আর কিছু?', 'ar kichhu?']
    ] },
    festivals: { name: 'উৎসব ও শুভেচ্ছা', items: [
      ['শুভ দীপাবলি!', 'shubho Dipaboli!'], ['ঈদ মুবারক!', 'Eid mubarak!'], ['শুভ হোলি!', 'shubho Holi!'], ['শুভ বড়দিন!', 'shubho Borodin!'],
      ['শুভ নববর্ষ!', 'shubho noboborsho!'], ['শুভ পৌষ সংক্রান্তি!', 'shubho Poush Shonkranti!'],
      ['শুভ স্বাধীনতা দিবস!', 'shubho shadhinota dibosh!'], ['শুভ জন্মদিন!', 'shubho jonmodin!'], ['অভিনন্দন!', 'obhinondon!'],
      ['শুভেচ্ছা!', 'shubhechchha!'], ['উৎসবে আমাদের বাড়ি আসুন।', 'utshobe amader bari ashun.'], ['মিষ্টি খান।', 'mishti khan.']
    ] },
    weather: { name: 'আবহাওয়া ও প্রকৃতি', items: [
      ['আবহাওয়া কেমন?', 'abhaoa kemon?'], ['বৃষ্টি পড়ছে।', 'brishti porchhe.'], ['খুব গরম।', 'khub gorom.'],
      ['ঠান্ডা পড়েছে।', 'thanda porechhe.'], ['ছাতা নিন।', 'chhata nin.'], ['সূর্য', 'shurjo'], ['চাঁদ', 'chand'], ['বাতাস', 'batash'],
      ['গাছ', 'gachh'], ['নদী', 'nodi']
    ] },
    emergency: { name: 'জরুরি অবস্থা', items: [
      ['বাঁচাও!', 'banchao!'], ['পুলিশ ডাকুন!', 'police dakun!'], ['অ্যাম্বুলেন্স ডাকুন!', 'ambulance dakun!'],
      ['তাড়াতাড়ি ডাক্তার ডাকুন!', 'taratari daktar dakun!'], ['আগুন!', 'agun!'], ['একটা দুর্ঘটনা ঘটেছে।', 'ekta durghotona ghotechhe.'],
      ['আমার ব্যাগ হারিয়ে গেছে।', 'amar bag hariye gechhe.'], ['আমি পথ হারিয়েছি।', 'ami poth hariyechhi.'], ['সাবধান!', 'shabdhan!'],
      ['সব ঠিক আছে?', 'shob thik achhe?'], ['থামুন!', 'thamun!'], ['112-এ ফোন করুন।', '112-e phone korun.']
    ] }
  } },
  mr: { topics: {
    greetings: { name: 'अभिवादन', items: [
      ['नमस्कार', 'namaskaar'], ['शुभ सकाळ', 'shubh sakaal'], ['शुभ रात्री', 'shubh raatri'], ['तुम्ही कसे आहात?', 'tumhi kase aahaat?'],
      ['मी ठीक आहे, धन्यवाद.', 'mi theek aahe, dhanyavaad.'], ['आणि तुम्ही?', 'aani tumhi?'],
      ['तुम्हाला भेटून आनंद झाला.', 'tumhaala bhetun aanand jhaala.'], ['स्वागत आहे!', 'swaagat aahe!'], ['बरं, पुन्हा भेटू.', 'bara, punha bhetu.'],
      ['उद्या भेटू.', 'udya bhetu.'], ['काळजी घ्या.', 'kaalji ghya.'], ['खूप दिवसांनी भेटलो!', 'khoop divasaanni bhetlo!']
    ] },
    basics: { name: 'हो, नाही, कृपया, धन्यवाद', items: [
      ['हो', 'ho'], ['नाही', 'naahi'], ['कृपया', 'krupaya'], ['धन्यवाद', 'dhanyavaad'], ['खूप खूप धन्यवाद', 'khoop khoop dhanyavaad'],
      ['काही हरकत नाही.', 'kaahi harkat naahi.'], ['माफ करा', 'maaf kara'], ['काही अडचण नाही.', 'kaahi adchan naahi.'], ['ठीक आहे', 'theek aahe'],
      ['नक्कीच', 'nakkeech'], ['कदाचित', 'kadaachit'], ['मला माहीत नाही.', 'mala maaheet naahi.']
    ] },
    intro: { name: 'माझ्याबद्दल', items: [
      ['तुमचं नाव काय?', 'tumcha naav kaay?'], ['माझं नाव रिया आहे.', 'maajha naav Riya aahe.'], ['तुम्ही कुठून आलात?', 'tumhi kuthun aalaat?'],
      ['मी दिल्लीचा आहे.', 'mi Dillicha aahe.'], ['मी मुंबईत राहतो.', 'mi Mumbait raahto.'], ['मी विद्यार्थी आहे.', 'mi vidyaarthi aahe.'],
      ['मी शिक्षक आहे.', 'mi shikshak aahe.'], ['तुमचं वय किती?', 'tumcha vay kiti?'],
      ['मी पंचवीस वर्षांचा आहे.', 'mi panchvees varshaancha aahe.'], ['हा माझा मित्र आहे.', 'ha maajha mitra aahe.']
    ] },
    smalltalk: { name: 'गप्पा', items: [
      ['सगळं कसं चाललंय?', 'sagla kasa chaalalay?'], ['सगळं ठीक आहे.', 'sagla theek aahe.'], ['तुम्ही काय करत आहात?', 'tumhi kaay karat aahaat?'],
      ['विशेष काही नाही.', 'vishesh kaahi naahi.'], ['घरी सगळे कसे आहेत?', 'ghari sagle kase aahet?'], ['सगळे ठीक आहेत.', 'sagle theek aahet.'],
      ['काय नवीन?', 'kaay naveen?'], ['जेवण झालं का?', 'jevan jhaala ka?'], ['आज हवा छान आहे.', 'aaj hawa chhaan aahe.'], ['चला!', 'chala!']
    ] },
    feelings: { name: 'भावना', items: [
      ['मी आनंदी आहे.', 'mi aanandi aahe.'], ['मी दुःखी आहे.', 'mi dukhi aahe.'], ['मी थकलो आहे.', 'mi thaklo aahe.'],
      ['मला भूक लागली आहे.', 'mala bhook laagli aahe.'], ['मला तहान लागली आहे.', 'mala tahaan laagli aahe.'],
      ['मला राग आला आहे.', 'mala raag aala aahe.'], ['मला भीती वाटते.', 'mala bheeti vaatate.'], ['मला कंटाळा आला आहे.', 'mala kantaala aala aahe.'],
      ['मला हे आवडतं.', 'mala he aavadta.'], ['मला हे आवडत नाही.', 'mala he aavadat naahi.']
    ] },
    questions: { name: 'प्रश्नार्थक शब्द', items: [
      ['काय?', 'kaay?'], ['कोण?', 'kon?'], ['कुठे?', 'kuthe?'], ['कधी?', 'kadhi?'], ['का?', 'ka?'], ['कसं?', 'kasa?'], ['किती?', 'kiti?'],
      ['कोणतं?', 'konata?'], ['हे काय आहे?', 'he kaay aahe?'], ['शौचालय कुठे आहे?', 'shauchaalay kuthe aahe?']
    ] },
    verbs: { name: 'रोजच्या क्रिया', items: [
      ['या.', 'ya.'], ['जा.', 'ja.'], ['बसा.', 'basa.'], ['उभे राहा.', 'ubhe raaha.'], ['खा.', 'kha.'], ['प्या.', 'pya.'], ['द्या.', 'dya.'],
      ['घ्या.', 'ghya.'], ['बघा.', 'bagha.'], ['ऐका.', 'aika.'], ['मला सांगा.', 'mala saanga.'], ['एक मिनिट थांबा.', 'ek minute thaamba.']
    ] },
    opposites: { name: 'विरुद्ध शब्द', items: [
      ['मोठा / लहान', 'motha / lahaan'], ['गरम / थंड', 'garam / thand'], ['चांगला / वाईट', 'chaangla / vaaeet'], ['नवीन / जुना', 'naveen / juna'],
      ['जवळ / दूर', 'javal / door'], ['जलद / हळू', 'jalad / halu'], ['उघडा / बंद', 'ughada / band'], ['स्वस्त / महाग', 'swast / mahaag'],
      ['स्वच्छ / घाण', 'swachchh / ghaan'], ['सोपं / अवघड', 'sopa / avghad'], ['जास्त / कमी', 'jaast / kami'], ['उजवा / डावा', 'ujva / daava']
    ] },
    numbers: { name: 'अंक', items: [
      ['शून्य', 'shoonya'], ['एक', 'ek'], ['दोन', 'don'], ['तीन', 'teen'], ['चार', 'chaar'], ['पाच', 'paach'], ['सहा', 'saha'], ['सात', 'saat'],
      ['आठ', 'aath'], ['नऊ', 'nau'], ['दहा', 'daha'], ['अकरा', 'akra'], ['बारा', 'baara'], ['तेरा', 'tera'], ['चौदा', 'chauda'],
      ['पंधरा', 'pandhra'], ['सोळा', 'sola'], ['सतरा', 'satra'], ['अठरा', 'athra'], ['एकोणीस', 'ekonees'], ['वीस', 'vees'], ['तीस', 'tees'],
      ['चाळीस', 'chaalees'], ['पन्नास', 'pannaas'], ['साठ', 'saath'], ['सत्तर', 'sattar'], ['ऐंशी', 'ainshi'], ['नव्वद', 'navvad'],
      ['शंभर', 'shambhar'], ['हजार', 'hajaar'], ['एक लाख', 'ek laakh'], ['एक कोटी', 'ek koti']
    ] },
    quantities: { name: 'प्रमाण आणि मापं', items: [
      ['थोडं', 'thoda'], ['खूप', 'khoop'], ['अर्धा', 'ardha'], ['दीड', 'deed'], ['पाव', 'paav'], ['एक किलो', 'ek kilo'],
      ['अर्धा किलो', 'ardha kilo'], ['एक लिटर', 'ek litre'], ['एक डझन', 'ek dazan'], ['पुरे, बास', 'pure, baas']
    ] },
    days: { name: 'दिवस', items: [
      ['सोमवार', 'somvaar'], ['मंगळवार', 'mangalvaar'], ['बुधवार', 'budhvaar'], ['गुरुवार', 'guruvaar'], ['शुक्रवार', 'shukravaar'],
      ['शनिवार', 'shanivaar'], ['रविवार', 'ravivaar'], ['आज', 'aaj'], ['उद्या', 'udya'], ['काल', 'kaal']
    ] },
    time: { name: 'वेळ', items: [
      ['किती वाजले?', 'kiti vaajle?'], ['पाच वाजले आहेत.', 'paach vaajle aahet.'], ['साडेपाच', 'saadepaach'], ['सकाळ', 'sakaal'],
      ['दुपार', 'dupaar'], ['संध्याकाळ', 'sandhyaakaal'], ['रात्र', 'raatra'], ['आता', 'aata'], ['नंतर', 'nantar'], ['लवकर', 'lavkar'],
      ['उशिरा', 'ushira'], ['एक तास', 'ek taas']
    ] },
    calendar: { name: 'आठवडा, महिना, वर्ष', items: [
      ['आठवडा', 'aathavda'], ['महिना', 'mahina'], ['वर्ष', 'varsha'], ['या आठवड्यात', 'ya aathavdyaat'], ['पुढच्या महिन्यात', 'pudhachya mahinyaat'],
      ['गेल्या वर्षी', 'gelya varshi'], ['आज तारीख काय?', 'aaj taareekh kaay?'], ['सुट्टी', 'sutti'], ['जन्मदिवस', 'janmadivas'],
      ['शनिवार-रविवार', 'shanivaar-ravivaar']
    ] },
    family: { name: 'कुटुंब', items: [
      ['आई', 'aai'], ['बाबा', 'baaba'], ['मोठा भाऊ (दादा)', 'motha bhaau (daada)'], ['मोठी बहीण (ताई)', 'mothi baheen (taai)'],
      ['लहान भाऊ', 'lahaan bhaau'], ['लहान बहीण', 'lahaan baheen'], ['मुलगा', 'mulga'], ['मुलगी', 'mulgi'], ['नवरा', 'navra'], ['बायको', 'baayko'],
      ['आजोबा', 'aajoba'], ['आजी', 'aaji']
    ] },
    people: { name: 'लोक', items: [
      ['मित्र', 'mitra'], ['शेजारी', 'shejaari'], ['पाहुणे', 'paahune'], ['मूल', 'mool'], ['मुलं', 'mula'], ['मुलगा', 'mulga'], ['मुलगी', 'mulgi'],
      ['माणूस', 'maanoos'], ['बाई', 'baai'], ['सगळे', 'sagle']
    ] },
    colours: { name: 'रंग', items: [
      ['लाल', 'laal'], ['निळा', 'nila'], ['हिरवा', 'hirva'], ['पिवळा', 'pivla'], ['पांढरा', 'paandhra'], ['काळा', 'kaala'], ['केशरी', 'keshri'],
      ['गुलाबी', 'gulaabi'], ['तपकिरी', 'tapkiri'], ['जांभळा', 'jaambhla']
    ] },
    food: { name: 'खाणं-पिणं', items: [
      ['पाणी', 'paani'], ['चहा', 'chaha'], ['दूध', 'doodh'], ['भात', 'bhaat'], ['पोळी / भाकरी', 'poli / bhaakri'], ['डाळ', 'daal'],
      ['भाजी', 'bhaaji'], ['फळ', 'phal'], ['साखर', 'saakhar'], ['मीठ', 'meeth'], ['दही', 'dahi'], ['अंडं', 'anda']
    ] },
    restaurant: { name: 'हॉटेलमध्ये', items: [
      ['कृपया मेन्यू दाखवा.', 'krupaya menu daakhva.'], ['इथे काय चांगलं मिळतं?', 'ithe kaay chaangla milta?'],
      ['मी शाकाहारी आहे.', 'mi shaakaahaari aahe.'], ['एक प्लेट भात द्या.', 'ek plate bhaat dya.'], ['एक कप चहा द्या.', 'ek cup chaha dya.'],
      ['कमी तिखट करा.', 'kami tikhat kara.'], ['थोडं पाणी द्या.', 'thoda paani dya.'], ['बिल आणा.', 'bill aana.'],
      ['खूप चविष्ट होतं!', 'khoop chavisht hota!'], ['हे तिखट आहे का?', 'he tikhat aahe ka?']
    ] },
    taste: { name: 'चव आणि स्वयंपाक', items: [
      ['तिखट', 'tikhat'], ['गोड', 'god'], ['खारट', 'khaarat'], ['आंबट', 'aambat'], ['कडू', 'kadu'], ['चविष्ट', 'chavisht'],
      ['गरमागरम, ताजं', 'garmaagaram, taaja'], ['थंड', 'thand'], ['कमी तेल घाला.', 'kami tel ghaala.'],
      ['कांदा-लसूण घालू नका.', 'kaanda-lasoon ghaalu naka.']
    ] },
    market: { name: 'बाजार आणि घासाघीस', items: [
      ['हे कितीला?', 'he kitila?'], ['खूप महाग आहे.', 'khoop mahaag aahe.'], ['थोडं कमी करा.', 'thoda kami kara.'],
      ['शेवटची किंमत काय?', 'shevatchi kimmat kaay?'], ['मी हे घेतो.', 'mi he gheto.'], ['मला नको.', 'mala nako.'],
      ['याच्यापेक्षा मोठं आहे का?', 'yaachyapeksha motha aahe ka?'], ['एक किलो द्या.', 'ek kilo dya.'], ['हे ताजं आहे का?', 'he taaja aahe ka?'],
      ['एक पिशवी द्या.', 'ek pishvi dya.'], ['सुटे पैसे आहेत का?', 'sute paise aahet ka?'], ['वजन करून द्या.', 'vajan karun dya.']
    ] },
    shopping: { name: 'कपडे आणि खरेदी', items: [
      ['शर्ट', 'shirt'], ['पॅन्ट', 'pant'], ['साडी', 'saadi'], ['कुर्ता', 'kurta'], ['बूट', 'boot'],
      ['मी हे घालून बघू का?', 'mi he ghaalun baghu ka?'], ['दुसरा रंग आहे का?', 'dusra rang aahe ka?'], ['हे खूप मोठं आहे.', 'he khoop motha aahe.'],
      ['हे खूप लहान आहे.', 'he khoop lahaan aahe.'], ['मला हे परत करायचं आहे.', 'mala he parat karaaycha aahe.']
    ] },
    money: { name: 'पैसे आणि पेमेंट', items: [
      ['पैसे', 'paise'], ['रुपये', 'rupaye'], ['सुटे पैसे', 'sute paise'], ['रोख', 'rokh'], ['मी UPI ने देऊ का?', 'mi UPI ne deu ka?'],
      ['पावती द्या.', 'paavti dya.'], ['एकूण किती झाले?', 'ekoon kiti jhaale?'], ['हे महाग आहे.', 'he mahaag aahe.'],
      ['हे स्वस्त आहे.', 'he swast aahe.'], ['माझ्याकडे सुटे पैसे नाहीत.', 'maajhyakade sute paise naaheet.']
    ] },
    auto: { name: 'रिक्षा आणि टॅक्सी', items: [
      ['रिक्षा! / टॅक्सी!', 'riksha! / taxi!'], ['स्टेशनला येणार का?', 'stationla yenaar ka?'], ['स्टेशनपर्यंत किती?', 'stationparyant kiti?'],
      ['मीटरने चला.', 'meterne chala.'], ['इथे थांबवा.', 'ithe thaambva.'], ['सरळ चला.', 'saral chala.'], ['डावीकडे वळा.', 'daavikade vala.'],
      ['उजवीकडे वळा.', 'ujvikade vala.'], ['हळू चालवा.', 'halu chaalva.'], ['इथे थांबा.', 'ithe thaamba.']
    ] },
    transport: { name: 'बस आणि रेल्वे', items: [
      ['बस स्टॉप कुठे आहे?', 'bus stop kuthe aahe?'], ['बाजारात कोणती बस जाते?', 'baajaaraat konti bus jaate?'],
      ['ही गाडी चेन्नईला जाते का?', 'hi gaadi Chennaila jaate ka?'], ['एक तिकीट द्या.', 'ek tikit dya.'],
      ['पुण्याची दोन तिकिटं द्या.', 'Punyaachi don tikita dya.'], ['गाडी किती वाजता सुटते?', 'gaadi kiti vaajta sutate?'],
      ['कोणता प्लॅटफॉर्म?', 'konta platform?'], ['ही जागा रिकामी आहे का?', 'hi jaaga rikaami aahe ka?'], ['मी कुठे उतरू?', 'mi kuthe utaru?'],
      ['बस उशिरा आहे.', 'bus ushira aahe.']
    ] },
    directions: { name: 'रस्ता', items: [
      ['हे कुठे आहे?', 'he kuthe aahe?'], ['सरळ पुढे', 'saral pudhe'], ['डावीकडे', 'daavikade'], ['उजवीकडे', 'ujvikade'], ['जवळ', 'javal'],
      ['दूर', 'door'], ['बँकेच्या बाजूला', 'bankechya baajula'], ['मंदिराच्या समोर', 'mandiraachya samor'], ['किती दूर आहे?', 'kiti door aahe?'],
      ['मी चालत जाऊ शकतो का?', 'mi chaalat jaau shakto ka?']
    ] },
    places: { name: 'शहरातील ठिकाणं', items: [
      ['रुग्णालय', 'rugnaalay'], ['बँक', 'bank'], ['ATM', 'ATM'], ['पोस्ट ऑफिस', 'post office'], ['पोलीस स्टेशन', 'police station'],
      ['रेल्वे स्टेशन', 'railway station'], ['बस स्टँड', 'bus stand'], ['बाजार', 'baajaar'], ['शाळा', 'shaala'], ['मंदिर', 'mandir'],
      ['मशीद', 'masheed'], ['चर्च', 'church']
    ] },
    doctor: { name: 'डॉक्टर आणि आरोग्य', items: [
      ['मला बरं वाटत नाही.', 'mala bara vaatat naahi.'], ['मला ताप आहे.', 'mala taap aahe.'], ['माझं डोकं दुखतंय.', 'maajha doka dukhtay.'],
      ['माझं पोट दुखतंय.', 'maajha pot dukhtay.'], ['मला खोकला आणि सर्दी आहे.', 'mala khokla aani sardi aahe.'],
      ['मला चक्कर येते.', 'mala chakkar yete.'], ['कालपासून.', 'kaalpaasun.'], ['मला डॉक्टरची गरज आहे.', 'mala doctorchi garaj aahe.'],
      ['कुठे दुखतंय?', 'kuthe dukhtay?'], ['इथे दुखतंय.', 'ithe dukhtay.'], ['मला हाय ब्लड प्रेशर आहे.', 'mala high blood pressure aahe.'],
      ['लवकर बरे व्हा!', 'lavkar bare vha!']
    ] },
    pharmacy: { name: 'औषधांचं दुकान', items: [
      ['औषध', 'aushadh'], ['मला हे औषध हवं आहे.', 'mala he aushadh hava aahe.'], ['तापाचं औषध आहे का?', 'taapaacha aushadh aahe ka?'],
      ['दिवसातून किती वेळा?', 'divasaatun kiti vela?'], ['जेवणाआधी की नंतर?', 'jevanaadhi ki nantar?'],
      ['दिवसातून दोनदा, जेवणानंतर.', 'divasaatun donda, jevanaanantar.'], ['गोळी / सिरप', 'goli / syrup'], ['पट्टी', 'patti'],
      ['काही साइड इफेक्ट आहे का?', 'kaahi side effect aahe ka?'], ['दुखण्याची गोळी द्या.', 'dukhanyaachi goli dya.']
    ] },
    bank: { name: 'बँक आणि पोस्ट ऑफिस', items: [
      ['मला खातं उघडायचं आहे.', 'mala khaata ughdaaycha aahe.'], ['हा फॉर्म भरा.', 'ha form bhara.'],
      ['मला पैसे काढायचे आहेत.', 'mala paise kaadhaayche aahet.'], ['मला पैसे भरायचे आहेत.', 'mala paise bharaayche aahet.'],
      ['खाते क्रमांक', 'khaate kramaank'], ['इथे सही करा.', 'ithe sahi kara.'], ['पासबुक', 'passbook'],
      ['मला पार्सल पाठवायचं आहे.', 'mala parcel paathvaaycha aahe.'], ['पोस्टाचं तिकीट', 'postaacha tikit'], ['रांग कुठे आहे?', 'raang kuthe aahe?']
    ] },
    office: { name: 'ऑफिस आणि काम', items: [
      ['नमस्कार सर / मॅडम.', 'namaskaar sir / madam.'], ['मीटिंग', 'meeting'], ['मला थोडा उशीर होईल.', 'mala thoda usheer hoeel.'],
      ['मला फाइल पाठवा.', 'mala file paathva.'], ['मी काम पूर्ण केलं.', 'mi kaam poorna kela.'], ['हे तपासा.', 'he tapaasa.'], ['रजा', 'raja'],
      ['मला उद्या रजा हवी आहे.', 'mala udya raja havi aahe.'], ['छान काम केलं!', 'chhaan kaam kela!'], ['उद्या बोलू.', 'udya bolu.']
    ] },
    phone: { name: 'फोन आणि इंटरनेट', items: [
      ['फोन', 'phone'], ['तुमचा फोन नंबर काय?', 'tumcha phone number kaay?'], ['मला फोन करा.', 'mala phone kara.'],
      ['मी तुम्हाला नंतर फोन करतो.', 'mi tumhaala nantar phone karto.'], ['तुमचा आवाज येत नाही.', 'tumcha aawaaj yet naahi.'],
      ['मोठ्याने बोला.', 'mothyaane bola.'], ['WhatsApp वर मेसेज करा.', 'WhatsApp var message kara.'], ['इथे Wi-Fi आहे का?', 'ithe Wi-Fi aahe ka?'],
      ['फोन चार्ज करा.', 'phone charge kara.'], ['एक फोटो काढा.', 'ek photo kaadha.']
    ] },
    school: { name: 'शाळा आणि वर्ग', items: [
      ['शिक्षक', 'shikshak'], ['विद्यार्थी', 'vidyaarthi'], ['पुस्तक', 'pustak'], ['वही', 'vahi'], ['पेन', 'pen'], ['वर्ग', 'varga'],
      ['गृहपाठ', 'gruhpaath'], ['परीक्षा', 'pareeksha'], ['पुस्तकं उघडा.', 'pustaka ughda.'], ['काही प्रश्न?', 'kaahi prashna?'],
      ['मला समजलं.', 'mala samajla.'], ['पुन्हा समजावून सांगा.', 'punha samjaavun saanga.']
    ] },
    learning: { name: 'भाषा शिकणं', items: [
      ['तुम्ही इंग्रजी बोलता का?', 'tumhi ingraji bolta ka?'], ['मी थोडं थोडं बोलतो.', 'mi thoda thoda bolto.'],
      ['मी तुमची भाषा शिकत आहे.', 'mi tumchi bhaasha shikat aahe.'], ['याला काय म्हणतात?', 'yaala kaay mhantaat?'],
      ['याचा अर्थ काय?', 'yaacha artha kaay?'], ['हळू बोला.', 'halu bola.'], ['पुन्हा सांगा.', 'punha saanga.'], ['मला समजतं.', 'mala samajta.'],
      ['मला समजलं नाही.', 'mala samajla naahi.'], ['लिहून द्या.', 'lihun dya.'], ['हे बरोबर आहे का?', 'he barobar aahe ka?'],
      ['मला शिकवा.', 'mala shikva.']
    ] },
    home: { name: 'घर आणि खोल्या', items: [
      ['घर', 'ghar'], ['खोली', 'kholi'], ['स्वयंपाकघर', 'swayampaakghar'], ['बाथरूम', 'bathroom'], ['दार', 'daar'], ['खिडकी', 'khidki'],
      ['किल्ली', 'killi'], ['पलंग', 'palang'], ['खुर्ची', 'khurchi'], ['टेबल', 'table'], ['दिवा', 'diva'], ['पंखा', 'pankha']
    ] },
    routine: { name: 'रोजचा दिनक्रम', items: [
      ['मी सहा वाजता उठतो.', 'mi saha vaajta uthto.'], ['मी दात घासतो.', 'mi daat ghaasto.'], ['मी आंघोळ करतो.', 'mi aanghol karto.'],
      ['मी नाश्ता करतो.', 'mi naashta karto.'], ['मी कामाला जातो.', 'mi kaamaala jaato.'],
      ['मी संध्याकाळी घरी येतो.', 'mi sandhyaakaali ghari yeto.'], ['मी रात्रीचं जेवण बनवतो.', 'mi raatricha jevan banavto.'],
      ['मी TV बघतो.', 'mi TV baghto.'], ['मी दहा वाजता झोपतो.', 'mi daha vaajta jhopto.'], ['तुम्ही किती वाजता उठता?', 'tumhi kiti vaajta uthta?']
    ] },
    kitchen: { name: 'स्वयंपाकघर', items: [
      ['ताट', 'taat'], ['ग्लास', 'glass'], ['चमचा', 'chamcha'], ['सुरी', 'suri'], ['भांडं', 'bhaanda'], ['शेगडी', 'shegdi'],
      ['भाजी चिरा.', 'bhaaji chira.'], ['पाणी उकळा.', 'paani ukala.'], ['भांडी घासा.', 'bhaandi ghaasa.'], ['मीठ घाला.', 'meeth ghaala.'],
      ['चव बघा.', 'chav bagha.'], ['जेवण तयार आहे!', 'jevan tayaar aahe!']
    ] },
    household: { name: 'घरातली कामं', items: [
      ['पाणी आणा.', 'paani aana.'], ['दार लावा.', 'daar laava.'], ['खिडकी उघडा.', 'khidki ughda.'], ['दिवा लावा.', 'diva laava.'],
      ['पंखा बंद करा.', 'pankha band kara.'], ['खोली स्वच्छ करा.', 'kholi swachchh kara.'], ['कपडे धुवा.', 'kapde dhuva.'], ['इथे या.', 'ithe ya.'],
      ['बसा ना.', 'basa na.'], ['चहा घ्या.', 'chaha ghya.'], ['मला मदत करा.', 'mala madat kara.'], ['आणखी काही?', 'aankhi kaahi?']
    ] },
    festivals: { name: 'सण आणि शुभेच्छा', items: [
      ['दिवाळीच्या शुभेच्छा!', 'Divaalichya shubhechha!'], ['ईद मुबारक!', 'Eid mubaarak!'], ['होळीच्या शुभेच्छा!', 'Holichya shubhechha!'],
      ['ख्रिसमसच्या शुभेच्छा!', 'Christmaschya shubhechha!'], ['नवीन वर्षाच्या शुभेच्छा!', 'naveen varshaachya shubhechha!'],
      ['मकर संक्रांतीच्या शुभेच्छा!', 'Makar Sankraantichya shubhechha!'], ['स्वातंत्र्य दिनाच्या शुभेच्छा!', 'swaatantrya dinaachya shubhechha!'],
      ['जन्मदिवसाच्या शुभेच्छा!', 'janmadivasaachya shubhechha!'], ['अभिनंदन!', 'abhinandan!'], ['शुभेच्छा!', 'shubhechha!'],
      ['सणाला आमच्या घरी या.', 'sanaala aamchya ghari ya.'], ['गोड घ्या.', 'god ghya.']
    ] },
    weather: { name: 'हवामान आणि निसर्ग', items: [
      ['हवा कशी आहे?', 'hawa kashi aahe?'], ['पाऊस पडतोय.', 'paaus padtoy.'], ['खूप उकडतंय.', 'khoop ukadtay.'], ['थंडी आहे.', 'thandi aahe.'],
      ['छत्री घ्या.', 'chhatri ghya.'], ['सूर्य', 'soorya'], ['चंद्र', 'chandra'], ['वारा', 'vaara'], ['झाड', 'jhaad'], ['नदी', 'nadi']
    ] },
    emergency: { name: 'आपत्कालीन स्थिती', items: [
      ['वाचवा!', 'vaachva!'], ['पोलिसांना बोलवा!', 'polisaanna bolva!'], ['रुग्णवाहिका बोलवा!', 'rugnavaahika bolva!'],
      ['लवकर डॉक्टरांना बोलवा!', 'lavkar doctoraanna bolva!'], ['आग!', 'aag!'], ['अपघात झाला आहे.', 'apghaat jhaala aahe.'],
      ['माझी बॅग हरवली आहे.', 'maajhi bag harvali aahe.'], ['मी रस्ता चुकलो आहे.', 'mi rasta chuklo aahe.'], ['जपून!', 'japun!'],
      ['सगळं ठीक आहे का?', 'sagla theek aahe ka?'], ['थांबा!', 'thaamba!'], ['112 वर फोन करा.', '112 var phone kara.']
    ] }
  } },
  gu: { topics: {
    greetings: { name: 'અભિવાદન', items: [
      ['નમસ્તે', 'namaste'], ['શુભ સવાર', 'shubh savaar'], ['શુભ રાત્રિ', 'shubh raatri'], ['તમે કેમ છો?', 'tame kem chho?'],
      ['હું મજામાં છું, આભાર.', 'hun majaama chhun, aabhaar.'], ['અને તમે?', 'ane tame?'], ['તમને મળીને આનંદ થયો.', 'tamne maline aanand thayo.'],
      ['સ્વાગત છે!', 'swaagat chhe!'], ['સારું, ફરી મળીશું.', 'saaru, phari malishu.'], ['કાલે મળીશું.', 'kaale malishu.'],
      ['સાચવજો.', 'saachavjo.'], ['બહુ દિવસે મળ્યા!', 'bahu divase malya!']
    ] },
    basics: { name: 'હા, ના, કૃપા કરીને, આભાર', items: [
      ['હા', 'haa'], ['ના', 'naa'], ['કૃપા કરીને', 'krupa karine'], ['આભાર', 'aabhaar'], ['ખૂબ ખૂબ આભાર', 'khoob khoob aabhaar'],
      ['કંઈ વાંધો નહીં.', 'kai vaandho nahi.'], ['માફ કરજો', 'maaf karjo'], ['કોઈ સમસ્યા નથી.', 'koi samasya nathi.'], ['ઠીક છે', 'theek chhe'],
      ['ચોક્કસ', 'chokkas'], ['કદાચ', 'kadaach'], ['મને ખબર નથી.', 'mane khabar nathi.']
    ] },
    intro: { name: 'મારા વિશે', items: [
      ['તમારું નામ શું છે?', 'tamaaru naam shu chhe?'], ['મારું નામ રિયા છે.', 'maaru naam Riya chhe.'],
      ['તમે ક્યાંથી આવો છો?', 'tame kyaanthi aavo chho?'], ['હું દિલ્હીથી છું.', 'hun Dilhithi chhun.'],
      ['હું મુંબઈમાં રહું છું.', 'hun Mumbaima rahun chhun.'], ['હું વિદ્યાર્થી છું.', 'hun vidyaarthi chhun.'],
      ['હું શિક્ષક છું.', 'hun shikshak chhun.'], ['તમારી ઉંમર કેટલી છે?', 'tamaari ummar ketli chhe?'],
      ['હું પચીસ વર્ષનો છું.', 'hun pachees varshno chhun.'], ['આ મારો મિત્ર છે.', 'aa maaro mitra chhe.']
    ] },
    smalltalk: { name: 'હળવી વાતો', items: [
      ['બધું કેમ ચાલે છે?', 'badhu kem chaale chhe?'], ['બધું બરાબર છે.', 'badhu baraabar chhe.'], ['તમે શું કરો છો?', 'tame shu karo chho?'],
      ['ખાસ કંઈ નહીં.', 'khaas kai nahi.'], ['ઘરે બધા કેમ છે?', 'ghare badha kem chhe?'], ['બધા મજામાં છે.', 'badha majaama chhe.'],
      ['શું નવું છે?', 'shu navu chhe?'], ['જમ્યા?', 'jamya?'], ['આજે હવામાન સારું છે.', 'aaje havaamaan saaru chhe.'], ['ચાલો!', 'chaalo!']
    ] },
    feelings: { name: 'લાગણીઓ', items: [
      ['હું ખુશ છું.', 'hun khush chhun.'], ['હું દુઃખી છું.', 'hun dukhi chhun.'], ['હું થાકી ગયો છું.', 'hun thaaki gayo chhun.'],
      ['મને ભૂખ લાગી છે.', 'mane bhookh laagi chhe.'], ['મને તરસ લાગી છે.', 'mane taras laagi chhe.'],
      ['મને ગુસ્સો આવે છે.', 'mane gusso aave chhe.'], ['મને ડર લાગે છે.', 'mane dar laage chhe.'],
      ['મને કંટાળો આવે છે.', 'mane kantaalo aave chhe.'], ['મને આ ગમે છે.', 'mane aa game chhe.'], ['મને આ નથી ગમતું.', 'mane aa nathi gamtu.']
    ] },
    questions: { name: 'પ્રશ્નાર્થ શબ્દો', items: [
      ['શું?', 'shu?'], ['કોણ?', 'kon?'], ['ક્યાં?', 'kyaan?'], ['ક્યારે?', 'kyaare?'], ['કેમ?', 'kem?'], ['કેવી રીતે?', 'kevi rite?'],
      ['કેટલું? / કેટલા?', 'ketlu? / ketla?'], ['કયું?', 'kayu?'], ['આ શું છે?', 'aa shu chhe?'], ['શૌચાલય ક્યાં છે?', 'shauchaalay kyaan chhe?']
    ] },
    verbs: { name: 'રોજની ક્રિયાઓ', items: [
      ['આવો.', 'aavo.'], ['જાઓ.', 'jao.'], ['બેસો.', 'beso.'], ['ઊભા થાઓ.', 'ubha thao.'], ['ખાઓ.', 'khao.'], ['પીઓ.', 'pio.'], ['આપો.', 'aapo.'],
      ['લો.', 'lo.'], ['જુઓ.', 'juo.'], ['સાંભળો.', 'saambhlo.'], ['મને કહો.', 'mane kaho.'], ['એક મિનિટ રાહ જુઓ.', 'ek minute raah juo.']
    ] },
    opposites: { name: 'વિરોધી શબ્દો', items: [
      ['મોટું / નાનું', 'motu / naanu'], ['ગરમ / ઠંડું', 'garam / thandu'], ['સારું / ખરાબ', 'saaru / kharaab'], ['નવું / જૂનું', 'navu / junu'],
      ['નજીક / દૂર', 'najeek / door'], ['ઝડપી / ધીમું', 'jhadpi / dheemu'], ['ખુલ્લું / બંધ', 'khullu / bandh'],
      ['સસ્તું / મોંઘું', 'sastu / monghu'], ['ચોખ્ખું / ગંદું', 'chokhkhu / gandu'], ['સહેલું / અઘરું', 'sahelu / agharu'],
      ['વધારે / ઓછું', 'vadhaare / ochhu'], ['જમણું / ડાબું', 'jamnu / daabu']
    ] },
    numbers: { name: 'અંક', items: [
      ['શૂન્ય', 'shoonya'], ['એક', 'ek'], ['બે', 'be'], ['ત્રણ', 'tran'], ['ચાર', 'chaar'], ['પાંચ', 'paanch'], ['છ', 'chha'], ['સાત', 'saat'],
      ['આઠ', 'aath'], ['નવ', 'nav'], ['દસ', 'das'], ['અગિયાર', 'agiyaar'], ['બાર', 'baar'], ['તેર', 'ter'], ['ચૌદ', 'chaud'], ['પંદર', 'pandar'],
      ['સોળ', 'sol'], ['સત્તર', 'sattar'], ['અઢાર', 'adhaar'], ['ઓગણીસ', 'ognees'], ['વીસ', 'vees'], ['ત્રીસ', 'trees'], ['ચાલીસ', 'chaalees'],
      ['પચાસ', 'pachaas'], ['સાઠ', 'saath'], ['સિત્તેર', 'sitter'], ['એંસી', 'ensi'], ['નેવું', 'nevu'], ['સો', 'so'], ['હજાર', 'hajaar'],
      ['એક લાખ', 'ek laakh'], ['એક કરોડ', 'ek karod']
    ] },
    quantities: { name: 'માત્રા અને માપ', items: [
      ['થોડું', 'thodu'], ['ઘણું', 'ghanu'], ['અડધું', 'adadhu'], ['દોઢ', 'dodh'], ['પા', 'paa'], ['એક કિલો', 'ek kilo'],
      ['અડધો કિલો', 'adadho kilo'], ['એક લિટર', 'ek litre'], ['એક ડઝન', 'ek dazan'], ['બસ, પૂરતું છે', 'bas, pooratu chhe']
    ] },
    days: { name: 'દિવસો', items: [
      ['સોમવાર', 'somvaar'], ['મંગળવાર', 'mangalvaar'], ['બુધવાર', 'budhvaar'], ['ગુરુવાર', 'guruvaar'], ['શુક્રવાર', 'shukravaar'],
      ['શનિવાર', 'shanivaar'], ['રવિવાર', 'ravivaar'], ['આજે', 'aaje'], ['કાલે (આવતી કાલ)', 'kaale (aavti kaal)'], ['ગઈકાલે', 'gaikaale']
    ] },
    time: { name: 'સમય', items: [
      ['કેટલા વાગ્યા?', 'ketla vaagya?'], ['પાંચ વાગ્યા છે.', 'paanch vaagya chhe.'], ['સાડા પાંચ', 'saada paanch'], ['સવાર', 'savaar'],
      ['બપોર', 'bapor'], ['સાંજ', 'saanj'], ['રાત', 'raat'], ['હમણાં', 'hamnaa'], ['પછી', 'pachhi'], ['વહેલું', 'vahelu'], ['મોડું', 'modu'],
      ['એક કલાક', 'ek kalaak']
    ] },
    calendar: { name: 'અઠવાડિયું, મહિનો, વર્ષ', items: [
      ['અઠવાડિયું', 'athvaadiyu'], ['મહિનો', 'mahino'], ['વર્ષ', 'varsh'], ['આ અઠવાડિયે', 'aa athvaadiye'], ['આવતા મહિને', 'aavta mahine'],
      ['ગયા વર્ષે', 'gaya varshe'], ['આજે કઈ તારીખ છે?', 'aaje kai taareekh chhe?'], ['રજા', 'raja'], ['જન્મદિવસ', 'janmadivas'],
      ['શનિ-રવિ', 'shani-ravi']
    ] },
    family: { name: 'કુટુંબ', items: [
      ['મા (બા)', 'maa (baa)'], ['પિતા (બાપુજી)', 'pita (baapuji)'], ['મોટો ભાઈ', 'moto bhai'], ['મોટી બહેન', 'moti bahen'],
      ['નાનો ભાઈ', 'naano bhai'], ['નાની બહેન', 'naani bahen'], ['દીકરો', 'deekro'], ['દીકરી', 'deekri'], ['પતિ', 'pati'], ['પત્ની', 'patni'],
      ['દાદા', 'daada'], ['દાદી', 'daadi']
    ] },
    people: { name: 'લોકો', items: [
      ['મિત્ર', 'mitra'], ['પડોશી', 'padoshi'], ['મહેમાન', 'mahemaan'], ['બાળક', 'baalak'], ['બાળકો', 'baalko'], ['છોકરો', 'chhokro'],
      ['છોકરી', 'chhokri'], ['માણસ', 'maanas'], ['સ્ત્રી', 'stri'], ['બધા', 'badha']
    ] },
    colours: { name: 'રંગ', items: [
      ['લાલ', 'laal'], ['ભૂરો', 'bhooro'], ['લીલો', 'leelo'], ['પીળો', 'peelo'], ['સફેદ', 'safed'], ['કાળો', 'kaalo'], ['કેસરી', 'kesri'],
      ['ગુલાબી', 'gulaabi'], ['કથ્થાઈ', 'kaththai'], ['જાંબલી', 'jaambli']
    ] },
    food: { name: 'ખાવા-પીવાનું', items: [
      ['પાણી', 'paani'], ['ચા', 'chaa'], ['દૂધ', 'doodh'], ['ભાત', 'bhaat'], ['રોટલી', 'rotli'], ['દાળ', 'daal'], ['શાક', 'shaak'], ['ફળ', 'phal'],
      ['ખાંડ', 'khaand'], ['મીઠું', 'meethu'], ['દહીં', 'dahin'], ['ઈંડું', 'indu']
    ] },
    restaurant: { name: 'રેસ્ટોરન્ટમાં', items: [
      ['કૃપા કરીને મેનુ બતાવો.', 'krupa karine menu bataavo.'], ['અહીં શું સારું મળે છે?', 'ahin shu saaru male chhe?'],
      ['હું શાકાહારી છું.', 'hun shaakaahaari chhun.'], ['એક પ્લેટ ભાત આપો.', 'ek plate bhaat aapo.'], ['એક કપ ચા આપો.', 'ek cup chaa aapo.'],
      ['ઓછું તીખું બનાવો.', 'ochhu teekhu banaavo.'], ['થોડું પાણી આપો.', 'thodu paani aapo.'], ['બિલ લાવો.', 'bill laavo.'],
      ['બહુ સ્વાદિષ્ટ હતું!', 'bahu swaadisht hatu!'], ['આ તીખું છે?', 'aa teekhu chhe?']
    ] },
    taste: { name: 'સ્વાદ અને રસોઈ', items: [
      ['તીખું', 'teekhu'], ['મીઠું (ગળ્યું)', 'meethu (galyu)'], ['ખારું', 'khaaru'], ['ખાટું', 'khaatu'], ['કડવું', 'kadvu'],
      ['સ્વાદિષ્ટ', 'swaadisht'], ['ગરમાગરમ, તાજું', 'garmaagaram, taaju'], ['ઠંડું', 'thandu'], ['તેલ ઓછું નાખો.', 'tel ochhu naakho.'],
      ['કાંદા-લસણ ન નાખો.', 'kaanda-lasan na naakho.']
    ] },
    market: { name: 'બજાર અને ભાવતાલ', items: [
      ['આ કેટલાનું છે?', 'aa ketlaanu chhe?'], ['બહુ મોંઘું છે.', 'bahu monghu chhe.'], ['થોડું ઓછું કરો.', 'thodu ochhu karo.'],
      ['છેલ્લો ભાવ શું?', 'chhello bhaav shu?'], ['હું આ લઈશ.', 'hun aa laish.'], ['મને નથી જોઈતું.', 'mane nathi joitu.'],
      ['આનાથી મોટું છે?', 'aanaathi motu chhe?'], ['એક કિલો આપો.', 'ek kilo aapo.'], ['આ તાજું છે?', 'aa taaju chhe?'],
      ['એક થેલી આપો.', 'ek theli aapo.'], ['છુટ્ટા છે?', 'chhutta chhe?'], ['વજન કરી આપો.', 'vajan kari aapo.']
    ] },
    shopping: { name: 'કપડાં અને ખરીદી', items: [
      ['શર્ટ', 'shirt'], ['પેન્ટ', 'pant'], ['સાડી', 'saadi'], ['કુર્તો', 'kurto'], ['બૂટ', 'boot'],
      ['હું આ પહેરીને જોઈ શકું?', 'hun aa paherine joi shaku?'], ['બીજો રંગ છે?', 'beejo rang chhe?'], ['આ બહુ મોટું છે.', 'aa bahu motu chhe.'],
      ['આ બહુ નાનું છે.', 'aa bahu naanu chhe.'], ['મારે આ પાછું આપવું છે.', 'maare aa paachhu aapvu chhe.']
    ] },
    money: { name: 'પૈસા અને ચુકવણી', items: [
      ['પૈસા', 'paisa'], ['રૂપિયા', 'rupiya'], ['છુટ્ટા', 'chhutta'], ['રોકડ', 'rokad'], ['હું UPI થી આપી શકું?', 'hun UPI thi aapi shaku?'],
      ['રસીદ આપો.', 'raseed aapo.'], ['કુલ કેટલા થયા?', 'kul ketla thaya?'], ['આ મોંઘું છે.', 'aa monghu chhe.'], ['આ સસ્તું છે.', 'aa sastu chhe.'],
      ['મારી પાસે છુટ્ટા નથી.', 'maari paase chhutta nathi.']
    ] },
    auto: { name: 'રિક્ષા અને ટેક્સી', items: [
      ['રિક્ષા! / ટેક્સી!', 'riksha! / taxi!'], ['સ્ટેશન જશો?', 'station jasho?'], ['સ્ટેશન સુધી કેટલા?', 'station sudhi ketla?'],
      ['મીટરથી ચાલો.', 'meterthi chaalo.'], ['અહીં રોકો.', 'ahin roko.'], ['સીધા જાઓ.', 'seedha jao.'], ['ડાબે વળો.', 'daabe valo.'],
      ['જમણે વળો.', 'jamne valo.'], ['ધીમે ચલાવો.', 'dheeme chalaavo.'], ['અહીં રાહ જુઓ.', 'ahin raah juo.']
    ] },
    transport: { name: 'બસ અને ટ્રેન', items: [
      ['બસ સ્ટોપ ક્યાં છે?', 'bus stop kyaan chhe?'], ['બજાર તરફ કઈ બસ જાય છે?', 'bajaar taraf kai bus jaay chhe?'],
      ['આ ટ્રેન ચેન્નાઈ જાય છે?', 'aa train Chennai jaay chhe?'], ['એક ટિકિટ આપો.', 'ek ticket aapo.'],
      ['પુણેની બે ટિકિટ આપો.', 'Puneni be ticket aapo.'], ['ટ્રેન કેટલા વાગે ઉપડે છે?', 'train ketla vaage upde chhe?'],
      ['કયું પ્લેટફોર્મ?', 'kayu platform?'], ['આ સીટ ખાલી છે?', 'aa seat khaali chhe?'], ['મારે ક્યાં ઊતરવું?', 'maare kyaan utarvu?'],
      ['બસ મોડી છે.', 'bus modi chhe.']
    ] },
    directions: { name: 'રસ્તો', items: [
      ['આ ક્યાં છે?', 'aa kyaan chhe?'], ['સીધા આગળ', 'seedha aagal'], ['ડાબે', 'daabe'], ['જમણે', 'jamne'], ['નજીક', 'najeek'], ['દૂર', 'door'],
      ['બેંકની બાજુમાં', 'bankni baajuma'], ['મંદિરની સામે', 'mandirni saame'], ['કેટલું દૂર છે?', 'ketlu door chhe?'],
      ['ચાલીને જઈ શકાય?', 'chaaline jai shakaay?']
    ] },
    places: { name: 'શહેરના સ્થળો', items: [
      ['હોસ્પિટલ', 'hospital'], ['બેંક', 'bank'], ['ATM', 'ATM'], ['પોસ્ટ ઓફિસ', 'post office'], ['પોલીસ સ્ટેશન', 'police station'],
      ['રેલવે સ્ટેશન', 'railway station'], ['બસ સ્ટેન્ડ', 'bus stand'], ['બજાર', 'bajaar'], ['શાળા', 'shaala'], ['મંદિર', 'mandir'],
      ['મસ્જિદ', 'masjid'], ['ચર્ચ', 'church']
    ] },
    doctor: { name: 'ડૉક્ટર અને આરોગ્ય', items: [
      ['મારી તબિયત સારી નથી.', 'maari tabiyat saari nathi.'], ['મને તાવ છે.', 'mane taav chhe.'],
      ['મારું માથું દુખે છે.', 'maaru maathu dukhe chhe.'], ['મારું પેટ દુખે છે.', 'maaru pet dukhe chhe.'],
      ['મને ખાંસી અને શરદી છે.', 'mane khaansi ane shardi chhe.'], ['મને ચક્કર આવે છે.', 'mane chakkar aave chhe.'], ['ગઈકાલથી.', 'gaikaalthi.'],
      ['મને ડૉક્ટર જોઈએ છે.', 'mane doctor joie chhe.'], ['ક્યાં દુખે છે?', 'kyaan dukhe chhe?'], ['અહીં દુખે છે.', 'ahin dukhe chhe.'],
      ['મને હાઈ બ્લડ પ્રેશર છે.', 'mane high blood pressure chhe.'], ['જલદી સાજા થઈ જાઓ!', 'jaldi saaja thai jao!']
    ] },
    pharmacy: { name: 'દવાની દુકાન', items: [
      ['દવા', 'dava'], ['મને આ દવા જોઈએ છે.', 'mane aa dava joie chhe.'], ['તાવની દવા છે?', 'taavni dava chhe?'],
      ['દિવસમાં કેટલી વાર?', 'divasma ketli vaar?'], ['જમતા પહેલાં કે પછી?', 'jamta pahelaan ke pachhi?'],
      ['દિવસમાં બે વાર, જમ્યા પછી.', 'divasma be vaar, jamya pachhi.'], ['ગોળી / સિરપ', 'goli / syrup'], ['પાટો', 'paato'],
      ['કોઈ આડઅસર છે?', 'koi aadasar chhe?'], ['દુખાવાની દવા આપો.', 'dukhaavaani dava aapo.']
    ] },
    bank: { name: 'બેંક અને પોસ્ટ ઓફિસ', items: [
      ['મારે ખાતું ખોલાવવું છે.', 'maare khaatu kholaavvu chhe.'], ['આ ફોર્મ ભરો.', 'aa form bharo.'],
      ['મારે પૈસા ઉપાડવા છે.', 'maare paisa upaadva chhe.'], ['મારે પૈસા જમા કરવા છે.', 'maare paisa jama karva chhe.'],
      ['ખાતા નંબર', 'khaata number'], ['અહીં સહી કરો.', 'ahin sahi karo.'], ['પાસબુક', 'passbook'],
      ['મારે પાર્સલ મોકલવું છે.', 'maare parcel mokalvu chhe.'], ['ટપાલ ટિકિટ', 'tapaal ticket'], ['લાઇન ક્યાં છે?', 'line kyaan chhe?']
    ] },
    office: { name: 'ઓફિસ અને કામ', items: [
      ['નમસ્તે સર / મેડમ.', 'namaste sir / madam.'], ['મીટિંગ', 'meeting'], ['મને થોડું મોડું થશે.', 'mane thodu modu thashe.'],
      ['મને ફાઇલ મોકલો.', 'mane file mokalo.'], ['મેં કામ પૂરું કર્યું.', 'me kaam pooru karyu.'], ['આ ચેક કરી લો.', 'aa check kari lo.'],
      ['રજા (છુટ્ટી)', 'raja (chhutti)'], ['મને કાલે રજા જોઈએ છે.', 'mane kaale raja joie chhe.'], ['સરસ કામ કર્યું!', 'saras kaam karyu!'],
      ['કાલે વાત કરીએ.', 'kaale vaat karie.']
    ] },
    phone: { name: 'ફોન અને ઇન્ટરનેટ', items: [
      ['ફોન', 'phone'], ['તમારો ફોન નંબર શું છે?', 'tamaaro phone number shu chhe?'], ['મને ફોન કરો.', 'mane phone karo.'],
      ['હું તમને પછી ફોન કરીશ.', 'hun tamne pachhi phone karish.'], ['તમારો અવાજ નથી આવતો.', 'tamaaro avaaj nathi aavto.'],
      ['મોટેથી બોલો.', 'motethi bolo.'], ['WhatsApp પર મેસેજ કરો.', 'WhatsApp par message karo.'], ['અહીં Wi-Fi છે?', 'ahin Wi-Fi chhe?'],
      ['ફોન ચાર્જ કરો.', 'phone charge karo.'], ['એક ફોટો પાડો.', 'ek photo paado.']
    ] },
    school: { name: 'શાળા અને વર્ગ', items: [
      ['શિક્ષક', 'shikshak'], ['વિદ્યાર્થી', 'vidyaarthi'], ['પુસ્તક', 'pustak'], ['નોટબુક', 'notebook'], ['પેન', 'pen'], ['વર્ગ', 'varg'],
      ['ગૃહકાર્ય', 'gruhkaarya'], ['પરીક્ષા', 'pariksha'], ['તમારી ચોપડીઓ ખોલો.', 'tamaari chopdio kholo.'], ['કોઈ પ્રશ્ન?', 'koi prashna?'],
      ['મને સમજાઈ ગયું.', 'mane samjaai gayu.'], ['ફરીથી સમજાવો.', 'pharithi samjaavo.']
    ] },
    learning: { name: 'ભાષા શીખવી', items: [
      ['તમે અંગ્રેજી બોલો છો?', 'tame angreji bolo chho?'], ['હું થોડું થોડું બોલું છું.', 'hun thodu thodu bolun chhun.'],
      ['હું તમારી ભાષા શીખું છું.', 'hun tamaari bhaasha shikhun chhun.'], ['આને શું કહેવાય?', 'aane shu kahevaay?'],
      ['આનો અર્થ શું?', 'aano arth shu?'], ['ધીમે બોલો.', 'dheeme bolo.'], ['ફરીથી કહો.', 'pharithi kaho.'], ['મને સમજાય છે.', 'mane samjaay chhe.'],
      ['મને સમજાતું નથી.', 'mane samjaatu nathi.'], ['લખી આપો.', 'lakhi aapo.'], ['આ બરાબર છે?', 'aa baraabar chhe?'], ['મને શીખવો.', 'mane shikhvo.']
    ] },
    home: { name: 'ઘર અને ઓરડા', items: [
      ['ઘર', 'ghar'], ['ઓરડો', 'ordo'], ['રસોડું', 'rasodu'], ['બાથરૂમ', 'bathroom'], ['બારણું', 'baarnu'], ['બારી', 'baari'], ['ચાવી', 'chaavi'],
      ['પલંગ', 'palang'], ['ખુરશી', 'khurshi'], ['ટેબલ', 'table'], ['લાઇટ', 'light'], ['પંખો', 'pankho']
    ] },
    routine: { name: 'રોજની દિનચર્યા', items: [
      ['હું છ વાગે ઊઠું છું.', 'hun chha vaage uthun chhun.'], ['હું દાંત સાફ કરું છું.', 'hun daant saaf karun chhun.'],
      ['હું નાહું છું.', 'hun naahun chhun.'], ['હું નાસ્તો કરું છું.', 'hun naasto karun chhun.'], ['હું કામે જાઉં છું.', 'hun kaame jaaun chhun.'],
      ['હું સાંજે ઘરે આવું છું.', 'hun saanje ghare aavun chhun.'], ['હું રાતનું જમવાનું બનાવું છું.', 'hun raatnu jamvaanu banaavun chhun.'],
      ['હું TV જોઉં છું.', 'hun TV joun chhun.'], ['હું દસ વાગે સૂઈ જાઉં છું.', 'hun das vaage sui jaaun chhun.'],
      ['તમે કેટલા વાગે ઊઠો છો?', 'tame ketla vaage utho chho?']
    ] },
    kitchen: { name: 'રસોડું અને રસોઈ', items: [
      ['થાળી', 'thaali'], ['ગ્લાસ', 'glass'], ['ચમચી', 'chamchi'], ['ચપ્પુ', 'chappu'], ['વાસણ', 'vaasan'], ['ચૂલો', 'chulo'],
      ['શાક સમારો.', 'shaak samaaro.'], ['પાણી ઉકાળો.', 'paani ukaalo.'], ['વાસણ ધોઈ નાખો.', 'vaasan dhoi naakho.'],
      ['મીઠું નાખો.', 'meethu naakho.'], ['ચાખી જુઓ.', 'chaakhi juo.'], ['જમવાનું તૈયાર છે!', 'jamvaanu taiyaar chhe!']
    ] },
    household: { name: 'ઘરનાં કામ', items: [
      ['પાણી લાવો.', 'paani laavo.'], ['બારણું બંધ કરો.', 'baarnu bandh karo.'], ['બારી ખોલો.', 'baari kholo.'],
      ['લાઇટ ચાલુ કરો.', 'light chaalu karo.'], ['પંખો બંધ કરો.', 'pankho bandh karo.'], ['ઓરડો સાફ કરો.', 'ordo saaf karo.'],
      ['કપડાં ધોઈ નાખો.', 'kapdaa dhoi naakho.'], ['અહીં આવો.', 'ahin aavo.'], ['બેસો ને.', 'beso ne.'], ['ચા લો.', 'chaa lo.'],
      ['મને મદદ કરો.', 'mane madad karo.'], ['બીજું કંઈ?', 'beeju kai?']
    ] },
    festivals: { name: 'તહેવાર અને શુભેચ્છા', items: [
      ['દિવાળીની શુભેચ્છા!', 'Divaalini shubhechchha!'], ['ઈદ મુબારક!', 'Eid mubaarak!'], ['હોળીની શુભેચ્છા!', 'Holini shubhechchha!'],
      ['નાતાલની શુભેચ્છા!', 'Naataalni shubhechchha!'], ['નવા વર્ષની શુભેચ્છા!', 'nava varshni shubhechchha!'],
      ['મકર સંક્રાંતિની શુભેચ્છા!', 'Makar Sankraantini shubhechchha!'], ['સ્વાતંત્ર્ય દિનની શુભેચ્છા!', 'swaatantrya dinni shubhechchha!'],
      ['જન્મદિવસની શુભેચ્છા!', 'janmadivasni shubhechchha!'], ['અભિનંદન!', 'abhinandan!'], ['શુભેચ્છાઓ!', 'shubhechchhao!'],
      ['તહેવારે અમારા ઘરે આવો.', 'tahevaare amaara ghare aavo.'], ['મીઠાઈ લો.', 'mithaai lo.']
    ] },
    weather: { name: 'હવામાન અને પ્રકૃતિ', items: [
      ['હવામાન કેવું છે?', 'havaamaan kevu chhe?'], ['વરસાદ પડે છે.', 'varsaad pade chhe.'], ['બહુ ગરમી છે.', 'bahu garmi chhe.'],
      ['ઠંડી છે.', 'thandi chhe.'], ['છત્રી લઈ જાઓ.', 'chhatri lai jao.'], ['સૂર્ય', 'soorya'], ['ચંદ્ર', 'chandra'], ['પવન', 'pavan'],
      ['ઝાડ', 'jhaad'], ['નદી', 'nadi']
    ] },
    emergency: { name: 'કટોકટી', items: [
      ['બચાવો!', 'bachaavo!'], ['પોલીસને બોલાવો!', 'policene bolaavo!'], ['એમ્બ્યુલન્સ બોલાવો!', 'ambulance bolaavo!'],
      ['જલદી ડૉક્ટરને બોલાવો!', 'jaldi doctorne bolaavo!'], ['આગ!', 'aag!'], ['અકસ્માત થયો છે.', 'akasmaat thayo chhe.'],
      ['મારી બેગ ખોવાઈ ગઈ છે.', 'maari bag khovaai gai chhe.'], ['હું રસ્તો ભૂલી ગયો છું.', 'hun rasto bhuli gayo chhun.'],
      ['ધ્યાન રાખજો!', 'dhyaan raakhjo!'], ['બધું બરાબર છે?', 'badhu baraabar chhe?'], ['ઊભા રહો!', 'ubha raho!'], ['112 પર ફોન કરો.', '112 par phone karo.']
    ] }
  } },
  pa: { topics: {
    greetings: { name: 'ਨਮਸਕਾਰ', items: [
      ['ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ', 'sat sri akaal'], ['ਸ਼ੁਭ ਸਵੇਰ', 'shubh saver'], ['ਸ਼ੁਭ ਰਾਤ', 'shubh raat'], ['ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?', 'tusi kiven ho?'],
      ['ਮੈਂ ਠੀਕ ਹਾਂ, ਧੰਨਵਾਦ।', 'main theek haan, dhannvaad.'], ['ਤੇ ਤੁਸੀਂ?', 'te tusi?'],
      ['ਤੁਹਾਨੂੰ ਮਿਲ ਕੇ ਖੁਸ਼ੀ ਹੋਈ।', 'tuhaanu mil ke khushi hoi.'], ['ਜੀ ਆਇਆਂ ਨੂੰ!', 'ji aaiyaan nu!'],
      ['ਚੰਗਾ, ਫਿਰ ਮਿਲਾਂਗੇ।', 'changa, phir milaange.'], ['ਕੱਲ੍ਹ ਮਿਲਾਂਗੇ।', 'kallh milaange.'], ['ਆਪਣਾ ਧਿਆਨ ਰੱਖੋ।', 'aapna dhiyaan rakkho.'],
      ['ਬੜੇ ਦਿਨਾਂ ਬਾਅਦ ਮਿਲੇ!', 'bade dinaan baad mile!']
    ] },
    basics: { name: 'ਹਾਂ, ਨਹੀਂ, ਕਿਰਪਾ ਕਰਕੇ, ਧੰਨਵਾਦ', items: [
      ['ਹਾਂ ਜੀ', 'haan ji'], ['ਨਹੀਂ ਜੀ', 'nahin ji'], ['ਕਿਰਪਾ ਕਰਕੇ', 'kirpa karke'], ['ਧੰਨਵਾਦ', 'dhannvaad'],
      ['ਬਹੁਤ-ਬਹੁਤ ਧੰਨਵਾਦ', 'bahut bahut dhannvaad'], ['ਕੋਈ ਗੱਲ ਨਹੀਂ।', 'koi gall nahin.'], ['ਮਾਫ਼ ਕਰਨਾ', 'maaf karna'],
      ['ਕੋਈ ਸਮੱਸਿਆ ਨਹੀਂ।', 'koi samassiya nahin.'], ['ਠੀਕ ਹੈ', 'theek hai'], ['ਜ਼ਰੂਰ', 'zaroor'], ['ਸ਼ਾਇਦ', 'shaayad'],
      ['ਮੈਨੂੰ ਨਹੀਂ ਪਤਾ।', 'mainu nahin pata.']
    ] },
    intro: { name: 'ਮੇਰੇ ਬਾਰੇ', items: [
      ['ਤੁਹਾਡਾ ਨਾਂ ਕੀ ਹੈ?', 'tuhaada naan ki hai?'], ['ਮੇਰਾ ਨਾਂ ਰਿਆ ਹੈ।', 'mera naan Riya hai.'], ['ਤੁਸੀਂ ਕਿੱਥੋਂ ਹੋ?', 'tusi kitthon ho?'],
      ['ਮੈਂ ਦਿੱਲੀ ਤੋਂ ਹਾਂ।', 'main Dilli ton haan.'], ['ਮੈਂ ਮੁੰਬਈ ਵਿੱਚ ਰਹਿੰਦਾ ਹਾਂ।', 'main Mumbai vich rehnda haan.'],
      ['ਮੈਂ ਵਿਦਿਆਰਥੀ ਹਾਂ।', 'main vidiaarthi haan.'], ['ਮੈਂ ਅਧਿਆਪਕ ਹਾਂ।', 'main adhiaapak haan.'], ['ਤੁਹਾਡੀ ਉਮਰ ਕੀ ਹੈ?', 'tuhaadi umar ki hai?'],
      ['ਮੈਂ ਪੱਚੀ ਸਾਲ ਦਾ ਹਾਂ।', 'main pachchi saal da haan.'], ['ਇਹ ਮੇਰਾ ਦੋਸਤ ਹੈ।', 'eh mera dost hai.']
    ] },
    smalltalk: { name: 'ਗੱਲਾਂ-ਬਾਤਾਂ', items: [
      ['ਸਭ ਕਿਵੇਂ ਚੱਲ ਰਿਹਾ ਹੈ?', 'sab kiven chal riha hai?'], ['ਸਭ ਠੀਕ ਹੈ।', 'sab theek hai.'], ['ਤੁਸੀਂ ਕੀ ਕਰ ਰਹੇ ਹੋ?', 'tusi ki kar rahe ho?'],
      ['ਕੁਝ ਖ਼ਾਸ ਨਹੀਂ।', 'kujh khaas nahin.'], ['ਘਰ ਵਿੱਚ ਸਭ ਕਿਵੇਂ ਹਨ?', 'ghar vich sab kiven han?'], ['ਸਭ ਠੀਕ ਹਨ।', 'sab theek han.'],
      ['ਕੀ ਨਵਾਂ ਹੈ?', 'ki navaan hai?'], ['ਰੋਟੀ ਖਾ ਲਈ?', 'roti kha lai?'], ['ਅੱਜ ਮੌਸਮ ਵਧੀਆ ਹੈ।', 'ajj mausam vadhiya hai.'], ['ਚੱਲੋ!', 'challo!']
    ] },
    feelings: { name: 'ਭਾਵਨਾਵਾਂ', items: [
      ['ਮੈਂ ਖੁਸ਼ ਹਾਂ।', 'main khush haan.'], ['ਮੈਂ ਦੁਖੀ ਹਾਂ।', 'main dukhi haan.'], ['ਮੈਂ ਥੱਕ ਗਿਆ ਹਾਂ।', 'main thakk giya haan.'],
      ['ਮੈਨੂੰ ਭੁੱਖ ਲੱਗੀ ਹੈ।', 'mainu bhukkh laggi hai.'], ['ਮੈਨੂੰ ਪਿਆਸ ਲੱਗੀ ਹੈ।', 'mainu piyaas laggi hai.'],
      ['ਮੈਨੂੰ ਗੁੱਸਾ ਆ ਰਿਹਾ ਹੈ।', 'mainu gussa aa riha hai.'], ['ਮੈਨੂੰ ਡਰ ਲੱਗ ਰਿਹਾ ਹੈ।', 'mainu dar lagg riha hai.'],
      ['ਮੈਂ ਬੋਰ ਹੋ ਰਿਹਾ ਹਾਂ।', 'main bore ho riha haan.'], ['ਮੈਨੂੰ ਇਹ ਪਸੰਦ ਹੈ।', 'mainu eh pasand hai.'], ['ਮੈਨੂੰ ਇਹ ਪਸੰਦ ਨਹੀਂ।', 'mainu eh pasand nahin.']
    ] },
    questions: { name: 'ਪ੍ਰਸ਼ਨ ਸ਼ਬਦ', items: [
      ['ਕੀ?', 'ki?'], ['ਕੌਣ?', 'kaun?'], ['ਕਿੱਥੇ?', 'kitthe?'], ['ਕਦੋਂ?', 'kadon?'], ['ਕਿਉਂ?', 'kiyon?'], ['ਕਿਵੇਂ?', 'kiven?'],
      ['ਕਿੰਨਾ? / ਕਿੰਨੇ?', 'kinna? / kinne?'], ['ਕਿਹੜਾ?', 'kehda?'], ['ਇਹ ਕੀ ਹੈ?', 'eh ki hai?'], ['ਟਾਇਲਟ ਕਿੱਥੇ ਹੈ?', 'toilet kitthe hai?']
    ] },
    verbs: { name: 'ਰੋਜ਼ ਦੇ ਕੰਮ', items: [
      ['ਆਓ ਜੀ।', 'aao ji.'], ['ਜਾਓ ਜੀ।', 'jao ji.'], ['ਬੈਠੋ ਜੀ।', 'baitho ji.'], ['ਖੜ੍ਹੇ ਹੋ ਜਾਓ।', 'khadhe ho jao.'], ['ਖਾਓ ਜੀ।', 'khao ji.'],
      ['ਪੀਓ ਜੀ।', 'pio ji.'], ['ਦਿਓ ਜੀ।', 'dio ji.'], ['ਲਓ ਜੀ।', 'lao ji.'], ['ਦੇਖੋ ਜੀ।', 'dekho ji.'], ['ਸੁਣੋ ਜੀ।', 'suno ji.'],
      ['ਮੈਨੂੰ ਦੱਸੋ।', 'mainu dasso.'], ['ਇੱਕ ਮਿੰਟ ਰੁਕੋ।', 'ikk mint ruko.']
    ] },
    opposites: { name: 'ਵਿਰੋਧੀ ਸ਼ਬਦ', items: [
      ['ਵੱਡਾ / ਛੋਟਾ', 'vadda / chhota'], ['ਗਰਮ / ਠੰਢਾ', 'garam / thandha'], ['ਚੰਗਾ / ਬੁਰਾ', 'changa / bura'], ['ਨਵਾਂ / ਪੁਰਾਣਾ', 'navaan / puraana'],
      ['ਨੇੜੇ / ਦੂਰ', 'nede / door'], ['ਤੇਜ਼ / ਹੌਲੀ', 'tez / hauli'], ['ਖੁੱਲ੍ਹਾ / ਬੰਦ', 'khullha / band'], ['ਸਸਤਾ / ਮਹਿੰਗਾ', 'sasta / mehnga'],
      ['ਸਾਫ਼ / ਗੰਦਾ', 'saaf / ganda'], ['ਸੌਖਾ / ਮੁਸ਼ਕਲ', 'saukha / mushkal'], ['ਵੱਧ / ਘੱਟ', 'vadhh / ghatt'], ['ਸੱਜਾ / ਖੱਬਾ', 'sajja / khabba']
    ] },
    numbers: { name: 'ਗਿਣਤੀ', items: [
      ['ਸਿਫ਼ਰ', 'sifar'], ['ਇੱਕ', 'ikk'], ['ਦੋ', 'do'], ['ਤਿੰਨ', 'tinn'], ['ਚਾਰ', 'chaar'], ['ਪੰਜ', 'panj'], ['ਛੇ', 'chhe'], ['ਸੱਤ', 'satt'],
      ['ਅੱਠ', 'atth'], ['ਨੌਂ', 'naun'], ['ਦਸ', 'das'], ['ਗਿਆਰਾਂ', 'giaaraan'], ['ਬਾਰਾਂ', 'baaraan'], ['ਤੇਰਾਂ', 'teraan'], ['ਚੌਦਾਂ', 'chaudaan'],
      ['ਪੰਦਰਾਂ', 'pandraan'], ['ਸੋਲਾਂ', 'solaan'], ['ਸਤਾਰਾਂ', 'sataaraan'], ['ਅਠਾਰਾਂ', 'athaaraan'], ['ਉੱਨੀ', 'unni'], ['ਵੀਹ', 'veeh'],
      ['ਤੀਹ', 'teeh'], ['ਚਾਲੀ', 'chaali'], ['ਪੰਜਾਹ', 'panjaah'], ['ਸੱਠ', 'satth'], ['ਸੱਤਰ', 'sattar'], ['ਅੱਸੀ', 'assi'], ['ਨੱਬੇ', 'nabbe'],
      ['ਸੌ', 'sau'], ['ਹਜ਼ਾਰ', 'hazaar'], ['ਇੱਕ ਲੱਖ', 'ikk lakkh'], ['ਇੱਕ ਕਰੋੜ', 'ikk karod']
    ] },
    quantities: { name: 'ਮਾਤਰਾ ਅਤੇ ਮਾਪ', items: [
      ['ਥੋੜ੍ਹਾ', 'thodha'], ['ਬਹੁਤ', 'bahut'], ['ਅੱਧਾ', 'addha'], ['ਡੇਢ', 'dedh'], ['ਚੌਥਾਈ', 'chauthaai'], ['ਇੱਕ ਕਿੱਲੋ', 'ikk killo'],
      ['ਅੱਧਾ ਕਿੱਲੋ', 'addha killo'], ['ਇੱਕ ਲਿਟਰ', 'ikk litre'], ['ਇੱਕ ਦਰਜਨ', 'ikk darjan'], ['ਬੱਸ, ਕਾਫ਼ੀ ਹੈ', 'bass, kaafi hai']
    ] },
    days: { name: 'ਦਿਨ', items: [
      ['ਸੋਮਵਾਰ', 'somvaar'], ['ਮੰਗਲਵਾਰ', 'mangalvaar'], ['ਬੁੱਧਵਾਰ', 'buddhvaar'], ['ਵੀਰਵਾਰ', 'veervaar'], ['ਸ਼ੁੱਕਰਵਾਰ', 'shukkarvaar'],
      ['ਸ਼ਨੀਵਾਰ', 'shaneevaar'], ['ਐਤਵਾਰ', 'aitvaar'], ['ਅੱਜ', 'ajj'], ['ਕੱਲ੍ਹ (ਆਉਣ ਵਾਲਾ)', 'kallh (aaun vaala)'],
      ['ਕੱਲ੍ਹ (ਬੀਤਿਆ)', 'kallh (beetiya)']
    ] },
    time: { name: 'ਸਮਾਂ', items: [
      ['ਕੀ ਟਾਈਮ ਹੋਇਆ ਹੈ?', 'ki time hoya hai?'], ['ਪੰਜ ਵੱਜੇ ਹਨ।', 'panj vajje han.'], ['ਸਾਢੇ ਪੰਜ', 'saadhe panj'], ['ਸਵੇਰ', 'saver'],
      ['ਦੁਪਹਿਰ', 'dupehar'], ['ਸ਼ਾਮ', 'shaam'], ['ਰਾਤ', 'raat'], ['ਹੁਣ', 'hun'], ['ਬਾਅਦ ਵਿੱਚ', 'baad vich'], ['ਜਲਦੀ', 'jaldi'],
      ['ਦੇਰ ਨਾਲ', 'der naal'], ['ਇੱਕ ਘੰਟਾ', 'ikk ghanta']
    ] },
    calendar: { name: 'ਹਫ਼ਤਾ, ਮਹੀਨਾ, ਸਾਲ', items: [
      ['ਹਫ਼ਤਾ', 'hafta'], ['ਮਹੀਨਾ', 'maheena'], ['ਸਾਲ', 'saal'], ['ਇਸ ਹਫ਼ਤੇ', 'is hafte'], ['ਅਗਲੇ ਮਹੀਨੇ', 'agle maheene'],
      ['ਪਿਛਲੇ ਸਾਲ', 'pichhle saal'], ['ਅੱਜ ਕੀ ਤਾਰੀਖ਼ ਹੈ?', 'ajj ki taareekh hai?'], ['ਛੁੱਟੀ', 'chhutti'], ['ਜਨਮਦਿਨ', 'janamdin'],
      ['ਸ਼ਨੀ-ਐਤਵਾਰ', 'shani-aitvaar']
    ] },
    family: { name: 'ਪਰਿਵਾਰ', items: [
      ['ਮਾਂ', 'maan'], ['ਪਿਤਾ ਜੀ', 'pita ji'], ['ਵੱਡਾ ਭਰਾ', 'vadda bhara'], ['ਵੱਡੀ ਬਹਿਣ', 'vaddi behan'], ['ਛੋਟਾ ਭਰਾ', 'chhota bhara'],
      ['ਛੋਟੀ ਬਹਿਣ', 'chhoti behan'], ['ਪੁੱਤਰ', 'puttar'], ['ਧੀ', 'dhee'], ['ਪਤੀ', 'pati'], ['ਪਤਨੀ', 'patni'], ['ਦਾਦਾ ਜੀ', 'daada ji'],
      ['ਦਾਦੀ ਜੀ', 'daadi ji']
    ] },
    people: { name: 'ਲੋਕ', items: [
      ['ਦੋਸਤ', 'dost'], ['ਗੁਆਂਢੀ', 'guaandhi'], ['ਮਹਿਮਾਨ', 'mehmaan'], ['ਬੱਚਾ', 'bachcha'], ['ਬੱਚੇ', 'bachche'], ['ਮੁੰਡਾ', 'munda'], ['ਕੁੜੀ', 'kudi'],
      ['ਆਦਮੀ', 'aadmi'], ['ਔਰਤ', 'aurat'], ['ਸਾਰੇ', 'saare']
    ] },
    colours: { name: 'ਰੰਗ', items: [
      ['ਲਾਲ', 'laal'], ['ਨੀਲਾ', 'neela'], ['ਹਰਾ', 'hara'], ['ਪੀਲਾ', 'peela'], ['ਚਿੱਟਾ', 'chitta'], ['ਕਾਲਾ', 'kaala'], ['ਸੰਤਰੀ', 'santri'],
      ['ਗੁਲਾਬੀ', 'gulaabi'], ['ਭੂਰਾ', 'bhoora'], ['ਜਾਮਨੀ', 'jaamni']
    ] },
    food: { name: 'ਖਾਣਾ-ਪੀਣਾ', items: [
      ['ਪਾਣੀ', 'paani'], ['ਚਾਹ', 'chaah'], ['ਦੁੱਧ', 'duddh'], ['ਚੌਲ', 'chaul'], ['ਰੋਟੀ', 'roti'], ['ਦਾਲ', 'daal'], ['ਸਬਜ਼ੀ', 'sabzi'],
      ['ਫਲ', 'phal'], ['ਖੰਡ', 'khand'], ['ਲੂਣ', 'loon'], ['ਦਹੀਂ', 'dahin'], ['ਅੰਡਾ', 'anda']
    ] },
    restaurant: { name: 'ਰੈਸਟੋਰੈਂਟ ਵਿੱਚ', items: [
      ['ਮੀਨੂ ਦਿਖਾਓ ਜੀ।', 'menu dikhao ji.'], ['ਇੱਥੇ ਕੀ ਵਧੀਆ ਮਿਲਦਾ ਹੈ?', 'itthe ki vadhiya milda hai?'],
      ['ਮੈਂ ਸ਼ਾਕਾਹਾਰੀ ਹਾਂ।', 'main shaakaahaari haan.'], ['ਇੱਕ ਪਲੇਟ ਚੌਲ ਦਿਓ।', 'ikk plate chaul dio.'], ['ਇੱਕ ਕੱਪ ਚਾਹ ਦਿਓ।', 'ikk cup chaah dio.'],
      ['ਮਿਰਚ ਘੱਟ ਰੱਖੋ।', 'mirch ghatt rakkho.'], ['ਥੋੜ੍ਹਾ ਪਾਣੀ ਦਿਓ।', 'thodha paani dio.'], ['ਬਿੱਲ ਲੈ ਆਓ।', 'bill lai aao.'],
      ['ਬਹੁਤ ਸੁਆਦ ਸੀ!', 'bahut suaad si!'], ['ਕੀ ਇਹ ਤਿੱਖਾ ਹੈ?', 'ki eh tikkha hai?']
    ] },
    taste: { name: 'ਸੁਆਦ ਅਤੇ ਰਸੋਈ', items: [
      ['ਤਿੱਖਾ', 'tikkha'], ['ਮਿੱਠਾ', 'mittha'], ['ਨਮਕੀਨ', 'namkeen'], ['ਖੱਟਾ', 'khatta'], ['ਕੌੜਾ', 'kauda'], ['ਸੁਆਦੀ', 'suaadi'],
      ['ਗਰਮਾ-ਗਰਮ, ਤਾਜ਼ਾ', 'garma garam, taaza'], ['ਠੰਢਾ', 'thandha'], ['ਤੇਲ ਘੱਟ ਪਾਓ।', 'tel ghatt pao.'],
      ['ਪਿਆਜ਼-ਲਸਣ ਨਾ ਪਾਓ।', 'piyaaz-lasan na pao.']
    ] },
    market: { name: 'ਬਾਜ਼ਾਰ ਅਤੇ ਸੌਦੇਬਾਜ਼ੀ', items: [
      ['ਇਹ ਕਿੰਨੇ ਦਾ ਹੈ?', 'eh kinne da hai?'], ['ਬਹੁਤ ਮਹਿੰਗਾ ਹੈ।', 'bahut mehnga hai.'], ['ਥੋੜ੍ਹਾ ਘੱਟ ਕਰ ਦਿਓ।', 'thodha ghatt kar dio.'],
      ['ਆਖ਼ਰੀ ਰੇਟ ਕੀ ਹੈ?', 'aakhri rate ki hai?'], ['ਮੈਂ ਇਹ ਲੈ ਲਵਾਂਗਾ।', 'main eh lai lavaanga.'], ['ਮੈਨੂੰ ਨਹੀਂ ਚਾਹੀਦਾ।', 'mainu nahin chaheeda.'],
      ['ਇਸ ਤੋਂ ਵੱਡਾ ਹੈ?', 'is ton vadda hai?'], ['ਇੱਕ ਕਿੱਲੋ ਦੇ ਦਿਓ।', 'ikk killo de dio.'], ['ਕੀ ਇਹ ਤਾਜ਼ਾ ਹੈ?', 'ki eh taaza hai?'],
      ['ਇੱਕ ਲਿਫ਼ਾਫ਼ਾ ਦੇ ਦਿਓ।', 'ikk lifaafa de dio.'], ['ਖੁੱਲ੍ਹੇ ਪੈਸੇ ਹਨ?', 'khullhe paise han?'], ['ਤੋਲ ਦਿਓ।', 'tol dio.']
    ] },
    shopping: { name: 'ਕੱਪੜੇ ਅਤੇ ਖ਼ਰੀਦਦਾਰੀ', items: [
      ['ਕਮੀਜ਼', 'kameez'], ['ਪੈਂਟ', 'pant'], ['ਸਾੜ੍ਹੀ', 'saadhi'], ['ਕੁੜਤਾ', 'kudta'], ['ਜੁੱਤੀ', 'jutti'],
      ['ਕੀ ਮੈਂ ਇਹ ਪਾ ਕੇ ਦੇਖ ਸਕਦਾ ਹਾਂ?', 'ki main eh pa ke dekh sakda haan?'], ['ਹੋਰ ਰੰਗ ਹੈ?', 'hor rang hai?'],
      ['ਇਹ ਬਹੁਤ ਵੱਡਾ ਹੈ।', 'eh bahut vadda hai.'], ['ਇਹ ਬਹੁਤ ਛੋਟਾ ਹੈ।', 'eh bahut chhota hai.'],
      ['ਮੈਂ ਇਹ ਵਾਪਸ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ।', 'main eh vaapas karna chaahunda haan.']
    ] },
    money: { name: 'ਪੈਸੇ ਅਤੇ ਭੁਗਤਾਨ', items: [
      ['ਪੈਸੇ', 'paise'], ['ਰੁਪਏ', 'rupaye'], ['ਖੁੱਲ੍ਹੇ ਪੈਸੇ', 'khullhe paise'], ['ਨਕਦ', 'nakad'],
      ['ਕੀ ਮੈਂ UPI ਨਾਲ ਦੇ ਸਕਦਾ ਹਾਂ?', 'ki main UPI naal de sakda haan?'], ['ਰਸੀਦ ਦੇ ਦਿਓ।', 'raseed de dio.'],
      ['ਕੁੱਲ ਕਿੰਨੇ ਹੋਏ?', 'kull kinne hoye?'], ['ਇਹ ਮਹਿੰਗਾ ਹੈ।', 'eh mehnga hai.'], ['ਇਹ ਸਸਤਾ ਹੈ।', 'eh sasta hai.'],
      ['ਮੇਰੇ ਕੋਲ ਖੁੱਲ੍ਹੇ ਪੈਸੇ ਨਹੀਂ ਹਨ।', 'mere kol khullhe paise nahin han.']
    ] },
    auto: { name: 'ਆਟੋ ਅਤੇ ਟੈਕਸੀ', items: [
      ['ਆਟੋ! / ਟੈਕਸੀ!', 'auto! / taxi!'], ['ਸਟੇਸ਼ਨ ਚੱਲੋਗੇ?', 'station challoge?'], ['ਸਟੇਸ਼ਨ ਤੱਕ ਕਿੰਨੇ ਲੱਗਣਗੇ?', 'station takk kinne laggange?'],
      ['ਮੀਟਰ ਨਾਲ ਚੱਲੋ।', 'meter naal challo.'], ['ਇੱਥੇ ਰੋਕੋ।', 'itthe roko.'], ['ਸਿੱਧੇ ਚੱਲੋ।', 'siddhe challo.'], ['ਖੱਬੇ ਮੁੜੋ।', 'khabbe mudo.'],
      ['ਸੱਜੇ ਮੁੜੋ।', 'sajje mudo.'], ['ਹੌਲੀ ਚਲਾਓ।', 'hauli chalao.'], ['ਇੱਥੇ ਰੁਕੋ।', 'itthe ruko.']
    ] },
    transport: { name: 'ਬੱਸ ਅਤੇ ਰੇਲ', items: [
      ['ਬੱਸ ਸਟਾਪ ਕਿੱਥੇ ਹੈ?', 'bus stop kitthe hai?'], ['ਬਾਜ਼ਾਰ ਕਿਹੜੀ ਬੱਸ ਜਾਂਦੀ ਹੈ?', 'baazaar kehdi bus jaandi hai?'],
      ['ਕੀ ਇਹ ਰੇਲ ਚੇਨਈ ਜਾਂਦੀ ਹੈ?', 'ki eh rail Chennai jaandi hai?'], ['ਇੱਕ ਟਿਕਟ ਦਿਓ।', 'ikk ticket dio.'],
      ['ਪੁਣੇ ਦੀਆਂ ਦੋ ਟਿਕਟਾਂ ਦਿਓ।', 'Pune diyaan do ticketaan dio.'], ['ਰੇਲ ਕਿੰਨੇ ਵਜੇ ਚੱਲਦੀ ਹੈ?', 'rail kinne vaje chaldi hai?'],
      ['ਕਿਹੜਾ ਪਲੇਟਫਾਰਮ?', 'kehda platform?'], ['ਕੀ ਇਹ ਸੀਟ ਖ਼ਾਲੀ ਹੈ?', 'ki eh seat khaali hai?'], ['ਮੈਂ ਕਿੱਥੇ ਉਤਰਾਂ?', 'main kitthe utraan?'],
      ['ਬੱਸ ਲੇਟ ਹੈ।', 'bus late hai.']
    ] },
    directions: { name: 'ਰਾਹ', items: [
      ['ਇਹ ਕਿੱਥੇ ਹੈ?', 'eh kitthe hai?'], ['ਸਿੱਧੇ ਅੱਗੇ', 'siddhe agge'], ['ਖੱਬੇ', 'khabbe'], ['ਸੱਜੇ', 'sajje'], ['ਨੇੜੇ', 'nede'], ['ਦੂਰ', 'door'],
      ['ਬੈਂਕ ਦੇ ਨਾਲ', 'bank de naal'], ['ਮੰਦਰ ਦੇ ਸਾਹਮਣੇ', 'mandar de saahmne'], ['ਕਿੰਨੀ ਦੂਰ ਹੈ?', 'kinni door hai?'],
      ['ਕੀ ਮੈਂ ਪੈਦਲ ਜਾ ਸਕਦਾ ਹਾਂ?', 'ki main paidal ja sakda haan?']
    ] },
    places: { name: 'ਸ਼ਹਿਰ ਦੀਆਂ ਥਾਵਾਂ', items: [
      ['ਹਸਪਤਾਲ', 'haspataal'], ['ਬੈਂਕ', 'bank'], ['ATM', 'ATM'], ['ਡਾਕਖ਼ਾਨਾ', 'daakkhaana'], ['ਪੁਲਿਸ ਥਾਣਾ', 'police thaana'],
      ['ਰੇਲਵੇ ਸਟੇਸ਼ਨ', 'railway station'], ['ਬੱਸ ਅੱਡਾ', 'bus adda'], ['ਬਾਜ਼ਾਰ', 'baazaar'], ['ਸਕੂਲ', 'school'], ['ਮੰਦਰ', 'mandar'],
      ['ਮਸਜਿਦ', 'masjid'], ['ਗਿਰਜਾਘਰ', 'girjaaghar']
    ] },
    doctor: { name: 'ਡਾਕਟਰ ਅਤੇ ਸਿਹਤ', items: [
      ['ਮੇਰੀ ਤਬੀਅਤ ਠੀਕ ਨਹੀਂ।', 'meri tabeeat theek nahin.'], ['ਮੈਨੂੰ ਬੁਖ਼ਾਰ ਹੈ।', 'mainu bukhaar hai.'],
      ['ਮੇਰਾ ਸਿਰ ਦੁਖਦਾ ਹੈ।', 'mera sir dukhda hai.'], ['ਮੇਰਾ ਪੇਟ ਦੁਖਦਾ ਹੈ।', 'mera pet dukhda hai.'],
      ['ਮੈਨੂੰ ਖੰਘ ਤੇ ਜ਼ੁਕਾਮ ਹੈ।', 'mainu khangh te zukaam hai.'], ['ਮੈਨੂੰ ਚੱਕਰ ਆ ਰਹੇ ਹਨ।', 'mainu chakkar aa rahe han.'],
      ['ਕੱਲ੍ਹ ਤੋਂ।', 'kallh ton.'], ['ਮੈਨੂੰ ਡਾਕਟਰ ਚਾਹੀਦਾ ਹੈ।', 'mainu doctor chaheeda hai.'], ['ਕਿੱਥੇ ਦੁਖਦਾ ਹੈ?', 'kitthe dukhda hai?'],
      ['ਇੱਥੇ ਦੁਖਦਾ ਹੈ।', 'itthe dukhda hai.'], ['ਮੈਨੂੰ ਹਾਈ ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਹੈ।', 'mainu high blood pressure hai.'],
      ['ਜਲਦੀ ਠੀਕ ਹੋ ਜਾਓ!', 'jaldi theek ho jao!']
    ] },
    pharmacy: { name: 'ਦਵਾਈ ਦੀ ਦੁਕਾਨ', items: [
      ['ਦਵਾਈ', 'davaai'], ['ਮੈਨੂੰ ਇਹ ਦਵਾਈ ਚਾਹੀਦੀ ਹੈ।', 'mainu eh davaai chaheedi hai.'], ['ਬੁਖ਼ਾਰ ਦੀ ਦਵਾਈ ਹੈ?', 'bukhaar di davaai hai?'],
      ['ਦਿਨ ਵਿੱਚ ਕਿੰਨੀ ਵਾਰ?', 'din vich kinni vaar?'], ['ਖਾਣੇ ਤੋਂ ਪਹਿਲਾਂ ਜਾਂ ਬਾਅਦ?', 'khaane ton pehlaan jaan baad?'],
      ['ਦਿਨ ਵਿੱਚ ਦੋ ਵਾਰ, ਖਾਣੇ ਤੋਂ ਬਾਅਦ।', 'din vich do vaar, khaane ton baad.'], ['ਗੋਲੀ / ਸ਼ਰਬਤ', 'goli / sharbat'], ['ਪੱਟੀ', 'patti'],
      ['ਕੋਈ ਸਾਈਡ ਇਫ਼ੈਕਟ ਹੈ?', 'koi side effect hai?'], ['ਦਰਦ ਦੀ ਦਵਾਈ ਦਿਓ।', 'dard di davaai dio.']
    ] },
    bank: { name: 'ਬੈਂਕ ਅਤੇ ਡਾਕਖ਼ਾਨਾ', items: [
      ['ਮੈਂ ਖਾਤਾ ਖੋਲ੍ਹਣਾ ਚਾਹੁੰਦਾ ਹਾਂ।', 'main khaata kholhna chaahunda haan.'], ['ਇਹ ਫ਼ਾਰਮ ਭਰੋ।', 'eh form bharo.'],
      ['ਮੈਂ ਪੈਸੇ ਕਢਵਾਉਣੇ ਹਨ।', 'main paise kadhvaaune han.'], ['ਮੈਂ ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣੇ ਹਨ।', 'main paise jamhaan karvaaune han.'],
      ['ਖਾਤਾ ਨੰਬਰ', 'khaata number'], ['ਇੱਥੇ ਦਸਤਖ਼ਤ ਕਰੋ।', 'itthe dastkhat karo.'], ['ਪਾਸਬੁੱਕ', 'passbook'],
      ['ਮੈਂ ਪਾਰਸਲ ਭੇਜਣਾ ਹੈ।', 'main parcel bhejna hai.'], ['ਡਾਕ ਟਿਕਟ', 'daak ticket'], ['ਲਾਈਨ ਕਿੱਥੇ ਹੈ?', 'line kitthe hai?']
    ] },
    office: { name: 'ਦਫ਼ਤਰ ਅਤੇ ਕੰਮ', items: [
      ['ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਸਰ / ਮੈਡਮ।', 'sat sri akaal sir / madam.'], ['ਮੀਟਿੰਗ', 'meeting'],
      ['ਮੈਨੂੰ ਥੋੜ੍ਹੀ ਦੇਰ ਹੋ ਜਾਵੇਗੀ।', 'mainu thodhi der ho jaavegi.'], ['ਮੈਨੂੰ ਫ਼ਾਈਲ ਭੇਜ ਦਿਓ।', 'mainu file bhej dio.'],
      ['ਮੈਂ ਕੰਮ ਪੂਰਾ ਕਰ ਲਿਆ।', 'main kamm poora kar liya.'], ['ਇਹ ਚੈੱਕ ਕਰ ਲਓ।', 'eh check kar lao.'], ['ਛੁੱਟੀ (ਕੰਮ ਤੋਂ)', 'chhutti (kamm ton)'],
      ['ਮੈਨੂੰ ਕੱਲ੍ਹ ਛੁੱਟੀ ਚਾਹੀਦੀ ਹੈ।', 'mainu kallh chhutti chaheedi hai.'], ['ਬਹੁਤ ਵਧੀਆ ਕੰਮ!', 'bahut vadhiya kamm!'],
      ['ਕੱਲ੍ਹ ਗੱਲ ਕਰਦੇ ਹਾਂ।', 'kallh gall karde haan.']
    ] },
    phone: { name: 'ਫ਼ੋਨ ਅਤੇ ਇੰਟਰਨੈੱਟ', items: [
      ['ਫ਼ੋਨ', 'phone'], ['ਤੁਹਾਡਾ ਫ਼ੋਨ ਨੰਬਰ ਕੀ ਹੈ?', 'tuhaada phone number ki hai?'], ['ਮੈਨੂੰ ਫ਼ੋਨ ਕਰੋ।', 'mainu phone karo.'],
      ['ਮੈਂ ਤੁਹਾਨੂੰ ਬਾਅਦ ਵਿੱਚ ਫ਼ੋਨ ਕਰਾਂਗਾ।', 'main tuhaanu baad vich phone karaanga.'],
      ['ਤੁਹਾਡੀ ਆਵਾਜ਼ ਨਹੀਂ ਆ ਰਹੀ।', 'tuhaadi aavaaz nahin aa rahi.'], ['ਜ਼ੋਰ ਨਾਲ ਬੋਲੋ।', 'zor naal bolo.'],
      ['WhatsApp ਤੇ ਮੈਸੇਜ ਕਰ ਦਿਓ।', 'WhatsApp te message kar dio.'], ['ਇੱਥੇ Wi-Fi ਹੈ?', 'itthe Wi-Fi hai?'],
      ['ਫ਼ੋਨ ਚਾਰਜ ਕਰ ਦਿਓ।', 'phone charge kar dio.'], ['ਇੱਕ ਫ਼ੋਟੋ ਖਿੱਚੋ।', 'ikk photo khichcho.']
    ] },
    school: { name: 'ਸਕੂਲ ਅਤੇ ਜਮਾਤ', items: [
      ['ਅਧਿਆਪਕ', 'adhiaapak'], ['ਵਿਦਿਆਰਥੀ', 'vidiaarthi'], ['ਕਿਤਾਬ', 'kitaab'], ['ਕਾਪੀ', 'copy'], ['ਪੈੱਨ', 'pen'], ['ਜਮਾਤ', 'jamaat'],
      ['ਘਰ ਦਾ ਕੰਮ', 'ghar da kamm'], ['ਪਰੀਖਿਆ', 'pareekhiya'], ['ਆਪਣੀਆਂ ਕਿਤਾਬਾਂ ਖੋਲ੍ਹੋ।', 'aapniyaan kitaabaan kholho.'],
      ['ਕੋਈ ਸਵਾਲ?', 'koi savaal?'], ['ਮੈਂ ਸਮਝ ਗਿਆ।', 'main samajh giya.'], ['ਫਿਰ ਸਮਝਾਓ।', 'phir samjhao.']
    ] },
    learning: { name: 'ਭਾਸ਼ਾ ਸਿੱਖਣਾ', items: [
      ['ਕੀ ਤੁਸੀਂ ਅੰਗਰੇਜ਼ੀ ਬੋਲਦੇ ਹੋ?', 'ki tusi angrezi bolde ho?'], ['ਮੈਂ ਥੋੜ੍ਹੀ-ਥੋੜ੍ਹੀ ਬੋਲਦਾ ਹਾਂ।', 'main thodhi thodhi bolda haan.'],
      ['ਮੈਂ ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਸਿੱਖ ਰਿਹਾ ਹਾਂ।', 'main tuhaadi bhaasha sikkh riha haan.'], ['ਇਸ ਨੂੰ ਕੀ ਕਹਿੰਦੇ ਹਨ?', 'is nu ki kehnde han?'],
      ['ਇਸ ਦਾ ਕੀ ਮਤਲਬ ਹੈ?', 'is da ki matlab hai?'], ['ਹੌਲੀ-ਹੌਲੀ ਬੋਲੋ।', 'hauli hauli bolo.'], ['ਫਿਰ ਕਹੋ।', 'phir kaho.'],
      ['ਮੈਂ ਸਮਝਦਾ ਹਾਂ।', 'main samajhda haan.'], ['ਮੈਂ ਨਹੀਂ ਸਮਝਿਆ।', 'main nahin samjhiya.'], ['ਲਿਖ ਕੇ ਦਿਓ।', 'likh ke dio.'],
      ['ਕੀ ਇਹ ਸਹੀ ਹੈ?', 'ki eh sahi hai?'], ['ਮੈਨੂੰ ਸਿਖਾਓ।', 'mainu sikhao.']
    ] },
    home: { name: 'ਘਰ ਅਤੇ ਕਮਰੇ', items: [
      ['ਘਰ', 'ghar'], ['ਕਮਰਾ', 'kamra'], ['ਰਸੋਈ', 'rasoi'], ['ਗੁਸਲਖ਼ਾਨਾ', 'gusalkhaana'], ['ਦਰਵਾਜ਼ਾ', 'darvaaza'], ['ਖਿੜਕੀ', 'khidki'],
      ['ਚਾਬੀ', 'chaabi'], ['ਮੰਜਾ', 'manja'], ['ਕੁਰਸੀ', 'kursi'], ['ਮੇਜ਼', 'mez'], ['ਬੱਤੀ', 'batti'], ['ਪੱਖਾ', 'pakkha']
    ] },
    routine: { name: 'ਰੋਜ਼ ਦੀ ਦਿਨਚਰਿਆ', items: [
      ['ਮੈਂ ਛੇ ਵਜੇ ਉੱਠਦਾ ਹਾਂ।', 'main chhe vaje utthda haan.'], ['ਮੈਂ ਦੰਦ ਸਾਫ਼ ਕਰਦਾ ਹਾਂ।', 'main dand saaf karda haan.'],
      ['ਮੈਂ ਨਹਾਉਂਦਾ ਹਾਂ।', 'main nahaunda haan.'], ['ਮੈਂ ਨਾਸ਼ਤਾ ਕਰਦਾ ਹਾਂ।', 'main naashta karda haan.'],
      ['ਮੈਂ ਕੰਮ ਤੇ ਜਾਂਦਾ ਹਾਂ।', 'main kamm te jaanda haan.'], ['ਮੈਂ ਸ਼ਾਮ ਨੂੰ ਘਰ ਆਉਂਦਾ ਹਾਂ।', 'main shaam nu ghar aaunda haan.'],
      ['ਮੈਂ ਰਾਤ ਦੀ ਰੋਟੀ ਬਣਾਉਂਦਾ ਹਾਂ।', 'main raat di roti banaunda haan.'], ['ਮੈਂ TV ਦੇਖਦਾ ਹਾਂ।', 'main TV dekhda haan.'],
      ['ਮੈਂ ਦਸ ਵਜੇ ਸੌਂਦਾ ਹਾਂ।', 'main das vaje saunda haan.'], ['ਤੁਸੀਂ ਕਿੰਨੇ ਵਜੇ ਉੱਠਦੇ ਹੋ?', 'tusi kinne vaje utthde ho?']
    ] },
    kitchen: { name: 'ਰਸੋਈ ਅਤੇ ਖਾਣਾ ਬਣਾਉਣਾ', items: [
      ['ਥਾਲੀ', 'thaali'], ['ਗਲਾਸ', 'glaas'], ['ਚਮਚਾ', 'chamcha'], ['ਚਾਕੂ', 'chaaku'], ['ਭਾਂਡਾ', 'bhaanda'], ['ਚੁੱਲ੍ਹਾ', 'chullha'],
      ['ਸਬਜ਼ੀ ਕੱਟ ਦਿਓ।', 'sabzi katt dio.'], ['ਪਾਣੀ ਉਬਾਲ ਦਿਓ।', 'paani ubaal dio.'], ['ਭਾਂਡੇ ਧੋ ਦਿਓ।', 'bhaande dho dio.'],
      ['ਲੂਣ ਪਾਓ।', 'loon pao.'], ['ਚੱਖ ਕੇ ਦੇਖੋ।', 'chakkh ke dekho.'], ['ਰੋਟੀ ਤਿਆਰ ਹੈ!', 'roti tiyaar hai!']
    ] },
    household: { name: 'ਘਰ ਦੇ ਕੰਮ', items: [
      ['ਪਾਣੀ ਲੈ ਆਓ।', 'paani lai aao.'], ['ਦਰਵਾਜ਼ਾ ਬੰਦ ਕਰ ਦਿਓ।', 'darvaaza band kar dio.'], ['ਖਿੜਕੀ ਖੋਲ੍ਹ ਦਿਓ।', 'khidki kholh dio.'],
      ['ਬੱਤੀ ਜਗਾ ਦਿਓ।', 'batti jaga dio.'], ['ਪੱਖਾ ਬੰਦ ਕਰ ਦਿਓ।', 'pakkha band kar dio.'], ['ਕਮਰਾ ਸਾਫ਼ ਕਰ ਦਿਓ।', 'kamra saaf kar dio.'],
      ['ਕੱਪੜੇ ਧੋ ਦਿਓ।', 'kappde dho dio.'], ['ਇੱਥੇ ਆਓ।', 'itthe aao.'], ['ਬੈਠ ਜਾਓ।', 'baith jao.'], ['ਚਾਹ ਲਓ।', 'chaah lao.'],
      ['ਮੇਰੀ ਮਦਦ ਕਰੋ।', 'meri madad karo.'], ['ਹੋਰ ਕੁਝ?', 'hor kujh?']
    ] },
    festivals: { name: 'ਤਿਉਹਾਰ ਅਤੇ ਸ਼ੁਭਕਾਮਨਾਵਾਂ', items: [
      ['ਦੀਵਾਲੀ ਮੁਬਾਰਕ!', 'Deewali mubaarak!'], ['ਈਦ ਮੁਬਾਰਕ!', 'Eid mubaarak!'], ['ਹੋਲੀ ਮੁਬਾਰਕ!', 'Holi mubaarak!'],
      ['ਕ੍ਰਿਸਮਸ ਮੁਬਾਰਕ!', 'Christmas mubaarak!'], ['ਨਵਾਂ ਸਾਲ ਮੁਬਾਰਕ!', 'navaan saal mubaarak!'],
      ['ਲੋਹੜੀ ਤੇ ਮਾਘੀ ਮੁਬਾਰਕ!', 'Lohri te Maaghi mubaarak!'], ['ਆਜ਼ਾਦੀ ਦਿਵਸ ਮੁਬਾਰਕ!', 'aazaadi divas mubaarak!'],
      ['ਜਨਮਦਿਨ ਮੁਬਾਰਕ!', 'janamdin mubaarak!'], ['ਵਧਾਈਆਂ!', 'vadhaaiyaan!'], ['ਸ਼ੁਭਕਾਮਨਾਵਾਂ!', 'shubhkaamnaavaan!'],
      ['ਤਿਉਹਾਰ ਤੇ ਸਾਡੇ ਘਰ ਆਓ।', 'tiuhaar te saade ghar aao.'], ['ਮਠਿਆਈ ਲਓ।', 'mathiaai lao.']
    ] },
    weather: { name: 'ਮੌਸਮ ਅਤੇ ਕੁਦਰਤ', items: [
      ['ਮੌਸਮ ਕਿਵੇਂ ਹੈ?', 'mausam kiven hai?'], ['ਬਾਰਿਸ਼ ਹੋ ਰਹੀ ਹੈ।', 'baarish ho rahi hai.'], ['ਬਹੁਤ ਗਰਮੀ ਹੈ।', 'bahut garmi hai.'],
      ['ਠੰਢ ਹੈ।', 'thandh hai.'], ['ਛਤਰੀ ਲੈ ਜਾਓ।', 'chhatri lai jao.'], ['ਸੂਰਜ', 'sooraj'], ['ਚੰਨ', 'chann'], ['ਹਵਾ', 'hava'], ['ਰੁੱਖ', 'rukkh'],
      ['ਦਰਿਆ', 'dariya']
    ] },
    emergency: { name: 'ਐਮਰਜੈਂਸੀ', items: [
      ['ਬਚਾਓ!', 'bachao!'], ['ਪੁਲਿਸ ਨੂੰ ਬੁਲਾਓ!', 'police nu bulao!'], ['ਐਂਬੂਲੈਂਸ ਬੁਲਾਓ!', 'ambulance bulao!'],
      ['ਜਲਦੀ ਡਾਕਟਰ ਨੂੰ ਬੁਲਾਓ!', 'jaldi doctor nu bulao!'], ['ਅੱਗ ਲੱਗ ਗਈ!', 'agg lagg gayi!'], ['ਇੱਕ ਹਾਦਸਾ ਹੋ ਗਿਆ ਹੈ।', 'ikk haadsa ho giya hai.'],
      ['ਮੇਰਾ ਬੈਗ ਗੁਆਚ ਗਿਆ ਹੈ।', 'mera bag guaach giya hai.'], ['ਮੈਂ ਰਾਹ ਭੁੱਲ ਗਿਆ ਹਾਂ।', 'main raah bhull giya haan.'],
      ['ਧਿਆਨ ਨਾਲ!', 'dhiyaan naal!'], ['ਸਭ ਠੀਕ ਹੈ?', 'sab theek hai?'], ['ਰੁਕੋ!', 'ruko!'], ['112 ਤੇ ਫ਼ੋਨ ਕਰੋ।', '112 te phone karo.']
    ] }
  } },
  or: { topics: {
    greetings: { name: 'ଅଭିବାଦନ', items: [
      ['ନମସ୍କାର', 'namaskaara'], ['ଶୁଭ ସକାଳ', 'shubha sakaala'], ['ଶୁଭ ରାତ୍ରି', 'shubha raatri'], ['ଆପଣ କେମିତି ଅଛନ୍ତି?', 'aapana kemiti achhanti?'],
      ['ମୁଁ ଭଲ ଅଛି, ଧନ୍ୟବାଦ।', 'mun bhala achhi, dhanyabaada.'], ['ଆଉ ଆପଣ?', 'aau aapana?'],
      ['ଆପଣଙ୍କୁ ଭେଟି ଖୁସି ଲାଗିଲା।', 'aapananku bheti khusi laagilaa.'], ['ସ୍ୱାଗତ!', 'swaagata!'], ['ଆଚ୍ଛା, ପୁଣି ଭେଟିବା।', 'aachha, puni bhetibaa.'],
      ['କାଲି ଭେଟିବା।', 'kaali bhetibaa.'], ['ନିଜର ଯତ୍ନ ନିଅନ୍ତୁ।', 'nijara jatna niantu.'], ['ବହୁତ ଦିନ ପରେ ଭେଟ ହେଲା!', 'bahuta dina pare bheta helaa!']
    ] },
    basics: { name: 'ହଁ, ନା, ଦୟାକରି, ଧନ୍ୟବାଦ', items: [
      ['ହଁ', 'han'], ['ନା', 'naa'], ['ଦୟାକରି', 'dayaakari'], ['ଧନ୍ୟବାଦ', 'dhanyabaada'], ['ବହୁତ ବହୁତ ଧନ୍ୟବାଦ', 'bahuta bahuta dhanyabaada'],
      ['କିଛି ଅସୁବିଧା ନାହିଁ।', 'kichhi asubidhaa naahin.'], ['କ୍ଷମା କରିବେ', 'kshamaa karibe'], ['କୌଣସି ସମସ୍ୟା ନାହିଁ।', 'kaunasi samasyaa naahin.'],
      ['ଠିକ୍ ଅଛି', 'thik achhi'], ['ନିଶ୍ଚୟ', 'nischaya'], ['ବୋଧହୁଏ', 'bodhahue'], ['ମୁଁ ଜାଣି ନାହିଁ।', 'mun jaani naahin.']
    ] },
    intro: { name: 'ମୋ ବିଷୟରେ', items: [
      ['ଆପଣଙ୍କ ନାମ କ\'ଣ?', 'aapananka naama kana?'], ['ମୋ ନାମ ରିୟା।', 'mo naama Riya.'],
      ['ଆପଣ କେଉଁଠାରୁ ଆସିଛନ୍ତି?', 'aapana keunthaaru aasichhanti?'], ['ମୁଁ ଦିଲ୍ଲୀରୁ ଆସିଛି।', 'mun Dilliru aasichhi.'],
      ['ମୁଁ ମୁମ୍ବାଇରେ ରହେ।', 'mun Mumbaire rahe.'], ['ମୁଁ ଜଣେ ଛାତ୍ର।', 'mun jane chhaatra.'], ['ମୁଁ ଜଣେ ଶିକ୍ଷକ।', 'mun jane shikshaka.'],
      ['ଆପଣଙ୍କ ବୟସ କେତେ?', 'aapananka bayasa kete?'], ['ମୋ ବୟସ ପଚିଶ ବର୍ଷ।', 'mo bayasa pachisha barsha.'], ['ଏ ମୋ ବନ୍ଧୁ।', 'e mo bandhu.']
    ] },
    smalltalk: { name: 'ହାଲୁକା କଥାବାର୍ତ୍ତା', items: [
      ['ସବୁ କେମିତି ଚାଲିଛି?', 'sabu kemiti chaalichhi?'], ['ସବୁ ଭଲ।', 'sabu bhala.'], ['ଆପଣ କ\'ଣ କରୁଛନ୍ତି?', 'aapana kana karuchhanti?'],
      ['ବିଶେଷ କିଛି ନାହିଁ।', 'bishesha kichhi naahin.'], ['ଘରେ ସମସ୍ତେ କେମିତି ଅଛନ୍ତି?', 'ghare samaste kemiti achhanti?'],
      ['ସମସ୍ତେ ଭଲ ଅଛନ୍ତି।', 'samaste bhala achhanti.'], ['କ\'ଣ ନୂଆ ଖବର?', 'kana nuaa khabara?'], ['ଖାଇଲେ କି?', 'khaaile ki?'],
      ['ଆଜି ପାଗ ଭଲ ଅଛି।', 'aaji paaga bhala achhi.'], ['ଚାଲନ୍ତୁ!', 'chaalantu!']
    ] },
    feelings: { name: 'ଭାବନା', items: [
      ['ମୁଁ ଖୁସି ଅଛି।', 'mun khusi achhi.'], ['ମୁଁ ଦୁଃଖିତ।', 'mun dukhita.'], ['ମୁଁ ଥକି ଯାଇଛି।', 'mun thaki jaaichhi.'],
      ['ମୋତେ ଭୋକ ଲାଗୁଛି।', 'mote bhoka laaguchhi.'], ['ମୋତେ ଶୋଷ ଲାଗୁଛି।', 'mote shosha laaguchhi.'], ['ମୋତେ ରାଗ ଲାଗୁଛି।', 'mote raaga laaguchhi.'],
      ['ମୋତେ ଡର ଲାଗୁଛି।', 'mote dara laaguchhi.'], ['ମୋତେ ବୋର୍ ଲାଗୁଛି।', 'mote bor laaguchhi.'], ['ମୋତେ ଏହା ଭଲ ଲାଗେ।', 'mote ehaa bhala laage.'],
      ['ମୋତେ ଏହା ଭଲ ଲାଗେ ନାହିଁ।', 'mote ehaa bhala laage naahin.']
    ] },
    questions: { name: 'ପ୍ରଶ୍ନ ଶବ୍ଦ', items: [
      ['କ\'ଣ?', 'kana?'], ['କିଏ?', 'kie?'], ['କେଉଁଠି?', 'keunthi?'], ['କେବେ?', 'kebe?'], ['କାହିଁକି?', 'kaahinki?'], ['କେମିତି?', 'kemiti?'],
      ['କେତେ?', 'kete?'], ['କେଉଁଟା?', 'keuntaa?'], ['ଏହା କ\'ଣ?', 'ehaa kana?'], ['ପାଇଖାନା କେଉଁଠି?', 'paaikhaanaa keunthi?']
    ] },
    verbs: { name: 'ଦିନର କାମ', items: [
      ['ଆସନ୍ତୁ।', 'aasantu.'], ['ଯାଆନ୍ତୁ।', 'jaaantu.'], ['ବସନ୍ତୁ।', 'basantu.'], ['ଠିଆ ହୁଅନ୍ତୁ।', 'thiaa huantu.'], ['ଖାଆନ୍ତୁ।', 'khaaantu.'],
      ['ପିଅନ୍ତୁ।', 'piantu.'], ['ଦିଅନ୍ତୁ।', 'diantu.'], ['ନିଅନ୍ତୁ।', 'niantu.'], ['ଦେଖନ୍ତୁ।', 'dekhantu.'], ['ଶୁଣନ୍ତୁ।', 'shunantu.'],
      ['ମୋତେ କୁହନ୍ତୁ।', 'mote kuhantu.'], ['ଏକ ମିନିଟ୍ ଅପେକ୍ଷା କରନ୍ତୁ।', 'eka minute apekshaa karantu.']
    ] },
    opposites: { name: 'ବିପରୀତ ଶବ୍ଦ', items: [
      ['ବଡ଼ / ଛୋଟ', 'bada / chhota'], ['ଗରମ / ଥଣ୍ଡା', 'garama / thandaa'], ['ଭଲ / ଖରାପ', 'bhala / kharaapa'], ['ନୂଆ / ପୁରୁଣା', 'nuaa / purunaa'],
      ['ପାଖ / ଦୂର', 'paakha / doora'], ['ଜୋର୍ / ଧୀର', 'jor / dheera'], ['ଖୋଲା / ବନ୍ଦ', 'kholaa / banda'], ['ଶସ୍ତା / ମହଙ୍ଗା', 'shastaa / mahangaa'],
      ['ସଫା / ମଇଳା', 'saphaa / mailaa'], ['ସହଜ / କଷ୍ଟ', 'sahaja / kashta'], ['ଅଧିକ / କମ୍', 'adhika / kam'], ['ଡାହାଣ / ବାମ', 'daahaana / baama']
    ] },
    numbers: { name: 'ସଂଖ୍ୟା', items: [
      ['ଶୂନ', 'shoona'], ['ଏକ', 'eka'], ['ଦୁଇ', 'dui'], ['ତିନି', 'tini'], ['ଚାରି', 'chaari'], ['ପାଞ୍ଚ', 'paancha'], ['ଛଅ', 'chhaa'],
      ['ସାତ', 'saata'], ['ଆଠ', 'aatha'], ['ନଅ', 'naa'], ['ଦଶ', 'dasha'], ['ଏଗାର', 'egaara'], ['ବାର', 'baara'], ['ତେର', 'tera'], ['ଚଉଦ', 'chauda'],
      ['ପନ୍ଦର', 'pandara'], ['ଷୋହଳ', 'shohala'], ['ସତର', 'satara'], ['ଅଠର', 'athara'], ['ଉଣେଇଶ', 'uneisha'], ['କୋଡ଼ିଏ', 'kodie'],
      ['ତିରିଶ', 'tirisha'], ['ଚାଳିଶ', 'chaalisha'], ['ପଚାଶ', 'pachaasha'], ['ଷାଠିଏ', 'shaathie'], ['ସତୁରି', 'saturi'], ['ଅଶୀ', 'ashee'],
      ['ନବେ', 'nabe'], ['ଶହେ', 'shahe'], ['ହଜାର', 'hajaara'], ['ଏକ ଲକ୍ଷ', 'eka lakhya'], ['ଏକ କୋଟି', 'eka koti']
    ] },
    quantities: { name: 'ପରିମାଣ ଓ ମାପ', items: [
      ['ଟିକିଏ', 'tikie'], ['ବହୁତ', 'bahuta'], ['ଅଧା', 'adhaa'], ['ଦେଢ଼', 'dedha'], ['ପାଉ', 'paau'], ['ଏକ କିଲୋ', 'eka kilo'],
      ['ଅଧା କିଲୋ', 'adhaa kilo'], ['ଏକ ଲିଟର', 'eka litre'], ['ଏକ ଡଜନ', 'eka dozen'], ['ଯଥେଷ୍ଟ', 'jatheshta']
    ] },
    days: { name: 'ଦିନ', items: [
      ['ସୋମବାର', 'somabaara'], ['ମଙ୍ଗଳବାର', 'mangalabaara'], ['ବୁଧବାର', 'budhabaara'], ['ଗୁରୁବାର', 'gurubaara'], ['ଶୁକ୍ରବାର', 'shukrabaara'],
      ['ଶନିବାର', 'shanibaara'], ['ରବିବାର', 'rabibaara'], ['ଆଜି', 'aaji'], ['ଆସନ୍ତାକାଲି', 'aasantaakaali'], ['ଗତକାଲି', 'gatakaali']
    ] },
    time: { name: 'ସମୟ', items: [
      ['କେତେ ବାଜିଲା?', 'kete baajilaa?'], ['ପାଞ୍ଚଟା ବାଜିଲା।', 'paanchataa baajilaa.'], ['ସାଢ଼େ ପାଞ୍ଚ', 'saadhe paancha'], ['ସକାଳ', 'sakaala'],
      ['ଦ୍ୱିପହର', 'dwipahara'], ['ସନ୍ଧ୍ୟା', 'sandhyaa'], ['ରାତି', 'raati'], ['ଏବେ', 'ebe'], ['ପରେ', 'pare'], ['ଶୀଘ୍ର', 'sheeghra'], ['ଡେରି', 'deri'],
      ['ଏକ ଘଣ୍ଟା', 'eka ghantaa']
    ] },
    calendar: { name: 'ସପ୍ତାହ, ମାସ, ବର୍ଷ', items: [
      ['ସପ୍ତାହ', 'saptaaha'], ['ମାସ', 'maasa'], ['ବର୍ଷ', 'barsha'], ['ଏହି ସପ୍ତାହ', 'ehi saptaaha'], ['ଆସନ୍ତା ମାସ', 'aasantaa maasa'],
      ['ଗତ ବର୍ଷ', 'gata barsha'], ['ଆଜି କେତେ ତାରିଖ?', 'aaji kete taarikha?'], ['ଛୁଟି', 'chhuti'], ['ଜନ୍ମଦିନ', 'janmadina'],
      ['ସପ୍ତାହାନ୍ତ', 'saptaahaanta']
    ] },
    family: { name: 'ପରିବାର', items: [
      ['ମା', 'maa'], ['ବାପା', 'baapaa'], ['ବଡ଼ ଭାଇ', 'bada bhaai'], ['ବଡ଼ ଭଉଣୀ', 'bada bhaunee'], ['ସାନ ଭାଇ', 'saana bhaai'],
      ['ସାନ ଭଉଣୀ', 'saana bhaunee'], ['ପୁଅ', 'pua'], ['ଝିଅ', 'jhia'], ['ସ୍ୱାମୀ', 'swaamee'], ['ସ୍ତ୍ରୀ', 'stree'], ['ଜେଜେବାପା', 'jejebaapaa'],
      ['ଜେଜେମା', 'jejemaa']
    ] },
    people: { name: 'ଲୋକ', items: [
      ['ବନ୍ଧୁ', 'bandhu'], ['ପଡ଼ୋଶୀ', 'padoshee'], ['ଅତିଥି', 'atithi'], ['ପିଲା', 'pilaa'], ['ପିଲାମାନେ', 'pilaamaane'], ['ପୁଅ ପିଲା', 'pua pilaa'],
      ['ଝିଅ ପିଲା', 'jhia pilaa'], ['ପୁରୁଷ', 'purusha'], ['ମହିଳା', 'mahilaa'], ['ସମସ୍ତେ', 'samaste']
    ] },
    colours: { name: 'ରଙ୍ଗ', items: [
      ['ଲାଲ', 'laala'], ['ନୀଳ', 'neela'], ['ସବୁଜ', 'sabuja'], ['ହଳଦିଆ', 'haladiaa'], ['ଧଳା', 'dhalaa'], ['କଳା', 'kalaa'], ['କମଳା', 'kamalaa'],
      ['ଗୋଲାପୀ', 'golaapee'], ['ବାଦାମୀ', 'baadaamee'], ['ବାଇଗଣୀ', 'baaiganee']
    ] },
    food: { name: 'ଖାଦ୍ୟ ଓ ପାନୀୟ', items: [
      ['ପାଣି', 'paani'], ['ଚା', 'chaa'], ['କ୍ଷୀର', 'kheera'], ['ଭାତ', 'bhaata'], ['ରୁଟି', 'ruti'], ['ଡାଲି', 'daali'], ['ତରକାରୀ', 'tarakaaree'],
      ['ଫଳ', 'phala'], ['ଚିନି', 'chini'], ['ଲୁଣ', 'luna'], ['ଦହି', 'dahi'], ['ଅଣ୍ଡା', 'andaa']
    ] },
    restaurant: { name: 'ହୋଟେଲରେ', items: [
      ['ଦୟାକରି ମେନୁ ଦେଖାନ୍ତୁ।', 'dayaakari menu dekhaantu.'], ['ଏଠି କ\'ଣ ଭଲ ମିଳେ?', 'ethi kana bhala mile?'],
      ['ମୁଁ ନିରାମିଷ ଖାଏ।', 'mun niraamisha khaae.'], ['ଏକ ପ୍ଲେଟ୍ ଭାତ ଦିଅନ୍ତୁ।', 'eka plate bhaata diantu.'],
      ['ଏକ କପ୍ ଚା ଦିଅନ୍ତୁ।', 'eka cup chaa diantu.'], ['ଲଙ୍କା କମ୍ ଦିଅନ୍ତୁ।', 'lankaa kam diantu.'], ['ଟିକିଏ ପାଣି ଦିଅନ୍ତୁ।', 'tikie paani diantu.'],
      ['ବିଲ୍ ଆଣନ୍ତୁ।', 'bill aanantu.'], ['ବହୁତ ସୁଆଦିଆ ଥିଲା!', 'bahuta suaadiaa thilaa!'], ['ଏହା ରାଗ କି?', 'ehaa raaga ki?']
    ] },
    taste: { name: 'ସ୍ୱାଦ ଓ ରୋଷେଇ', items: [
      ['ରାଗ', 'raaga'], ['ମିଠା', 'mithaa'], ['ଲୁଣିଆ', 'luniaa'], ['ଖଟା', 'khataa'], ['ପିତା', 'pitaa'], ['ସୁଆଦିଆ', 'suaadiaa'],
      ['ଗରମ ଗରମ, ତାଜା', 'garama garama, taajaa'], ['ଥଣ୍ଡା', 'thandaa'], ['ତେଲ କମ୍ ଦିଅନ୍ତୁ।', 'tela kam diantu.'],
      ['ପିଆଜ ରସୁଣ ଦିଅନ୍ତୁ ନାହିଁ।', 'piaaja rasuna diantu naahin.']
    ] },
    market: { name: 'ବଜାର ଓ ଦରଦାମ', items: [
      ['ଏହା କେତେ?', 'ehaa kete?'], ['ବହୁତ ମହଙ୍ଗା।', 'bahuta mahangaa.'], ['ଟିକିଏ କମ୍ କରନ୍ତୁ।', 'tikie kam karantu.'],
      ['ଶେଷ ଦାମ କେତେ?', 'shesha daama kete?'], ['ମୁଁ ଏହା ନେବି।', 'mun ehaa nebi.'], ['ମୋତେ ଦରକାର ନାହିଁ।', 'mote darakaara naahin.'],
      ['ଏହାଠାରୁ ବଡ଼ ଅଛି କି?', 'ehaathaaru bada achhi ki?'], ['ଏକ କିଲୋ ଦିଅନ୍ତୁ।', 'eka kilo diantu.'], ['ଏହା ତାଜା କି?', 'ehaa taajaa ki?'],
      ['ଏକ ବ୍ୟାଗ୍ ଦିଅନ୍ତୁ।', 'eka bag diantu.'], ['ଖୁଚୁରା ଅଛି କି?', 'khuchuraa achhi ki?'], ['ଓଜନ କରି ଦିଅନ୍ତୁ।', 'ojana kari diantu.']
    ] },
    shopping: { name: 'ପୋଷାକ ଓ କିଣାକିଣି', items: [
      ['ସାର୍ଟ', 'shirt'], ['ପ୍ୟାଣ୍ଟ', 'pant'], ['ଶାଢ଼ୀ', 'shaadhee'], ['କୁର୍ତ୍ତା', 'kurtaa'], ['ଜୋତା', 'jotaa'],
      ['ମୁଁ ଏହା ପିନ୍ଧି ଦେଖିପାରିବି କି?', 'mun ehaa pindhi dekhipaaribi ki?'], ['ଅନ୍ୟ ରଙ୍ଗ ଅଛି କି?', 'anya ranga achhi ki?'],
      ['ଏହା ବହୁତ ବଡ଼।', 'ehaa bahuta bada.'], ['ଏହା ବହୁତ ଛୋଟ।', 'ehaa bahuta chhota.'], ['ମୁଁ ଏହା ଫେରାଇବାକୁ ଚାହେଁ।', 'mun ehaa pheraaibaaku chaahen.']
    ] },
    money: { name: 'ଟଙ୍କା ଓ ଦେୟ', items: [
      ['ଟଙ୍କା', 'tankaa'], ['ଟଙ୍କା (ରୁପି)', 'tankaa (rupee)'], ['ଖୁଚୁରା', 'khuchuraa'], ['ନଗଦ', 'nagada'],
      ['ମୁଁ UPI ରେ ଦେଇପାରିବି କି?', 'mun UPI re deipaaribi ki?'], ['ରସିଦ ଦିଅନ୍ତୁ।', 'rasida diantu.'], ['ମୋଟ କେତେ ହେଲା?', 'mota kete helaa?'],
      ['ଏହା ମହଙ୍ଗା।', 'ehaa mahangaa.'], ['ଏହା ଶସ୍ତା।', 'ehaa shastaa.'], ['ମୋ ପାଖରେ ଖୁଚୁରା ନାହିଁ।', 'mo paakhare khuchuraa naahin.']
    ] },
    auto: { name: 'ଅଟୋ ଓ ଟ୍ୟାକ୍ସି', items: [
      ['ଅଟୋ! / ଟ୍ୟାକ୍ସି!', 'auto! / taxi!'], ['ଷ୍ଟେସନ୍ ଯିବେ କି?', 'station jibe ki?'], ['ଷ୍ଟେସନ୍ ପର୍ଯ୍ୟନ୍ତ କେତେ?', 'station paryanta kete?'],
      ['ମିଟର ରେ ଚାଲନ୍ତୁ।', 'meter re chaalantu.'], ['ଏଠି ରଖନ୍ତୁ।', 'ethi rakhantu.'], ['ସିଧା ଯାଆନ୍ତୁ।', 'sidhaa jaaantu.'],
      ['ବାମକୁ ବୁଲନ୍ତୁ।', 'baamaku bulantu.'], ['ଡାହାଣକୁ ବୁଲନ୍ତୁ।', 'daahaanaku bulantu.'], ['ଧୀରେ ଚଲାନ୍ତୁ।', 'dheere chalaantu.'],
      ['ଏଠି ଅପେକ୍ଷା କରନ୍ତୁ।', 'ethi apekshaa karantu.']
    ] },
    transport: { name: 'ବସ୍ ଓ ଟ୍ରେନ୍', items: [
      ['ବସ୍ ଷ୍ଟପ୍ କେଉଁଠି?', 'bus stop keunthi?'], ['ବଜାରକୁ କେଉଁ ବସ୍ ଯାଏ?', 'bajaaraku keun bus jaae?'],
      ['ଏହି ଟ୍ରେନ୍ ଚେନ୍ନାଇ ଯାଏ କି?', 'ehi train Chennai jaae ki?'], ['ଗୋଟିଏ ଟିକେଟ୍ ଦିଅନ୍ତୁ।', 'gotie ticket diantu.'],
      ['ପୁନେ ପାଇଁ ଦୁଇଟି ଟିକେଟ୍ ଦିଅନ୍ତୁ।', 'Pune paain duiti ticket diantu.'], ['ଟ୍ରେନ୍ କେତେବେଳେ ଛାଡ଼େ?', 'train ketebele chhaade?'],
      ['କେଉଁ ପ୍ଲାଟଫର୍ମ?', 'keun platform?'], ['ଏହି ସିଟ୍ ଖାଲି ଅଛି କି?', 'ehi seat khaali achhi ki?'],
      ['ମୁଁ କେଉଁଠି ଓହ୍ଲାଇବି?', 'mun keunthi ohlaaibi?'], ['ବସ୍ ଡେରି ହୋଇଛି।', 'bus deri hoichhi.']
    ] },
    directions: { name: 'ରାସ୍ତା', items: [
      ['ଏହା କେଉଁଠି?', 'ehaa keunthi?'], ['ସିଧା ଆଗକୁ', 'sidhaa aagaku'], ['ବାମ', 'baama'], ['ଡାହାଣ', 'daahaana'], ['ପାଖ', 'paakha'], ['ଦୂର', 'doora'],
      ['ବ୍ୟାଙ୍କ ପାଖରେ', 'bank paakhare'], ['ମନ୍ଦିର ସାମ୍ନାରେ', 'mandira saamnaare'], ['କେତେ ଦୂର?', 'kete doora?'],
      ['ଚାଲି ଚାଲି ଯାଇହେବ କି?', 'chaali chaali jaaiheba ki?']
    ] },
    places: { name: 'ସହରର ସ୍ଥାନ', items: [
      ['ଡାକ୍ତରଖାନା', 'daaktarakhaanaa'], ['ବ୍ୟାଙ୍କ', 'bank'], ['ATM', 'ATM'], ['ପୋଷ୍ଟ ଅଫିସ୍', 'post office'], ['ପୋଲିସ୍ ଥାନା', 'police thaanaa'],
      ['ରେଳ ଷ୍ଟେସନ୍', 'rela station'], ['ବସ୍ ଷ୍ଟାଣ୍ଡ', 'bus stand'], ['ବଜାର', 'bajaara'], ['ସ୍କୁଲ୍', 'school'], ['ମନ୍ଦିର', 'mandira'],
      ['ମସଜିଦ', 'masajida'], ['ଗିର୍ଜା', 'girjaa']
    ] },
    doctor: { name: 'ଡାକ୍ତର ଓ ସ୍ୱାସ୍ଥ୍ୟ', items: [
      ['ମୋ ଦେହ ଭଲ ନାହିଁ।', 'mo deha bhala naahin.'], ['ମୋତେ ଜର ହୋଇଛି।', 'mote jara hoichhi.'], ['ମୋ ମୁଣ୍ଡ ବିନ୍ଧୁଛି।', 'mo munda bindhuchhi.'],
      ['ମୋ ପେଟ ବିନ୍ଧୁଛି।', 'mo peta bindhuchhi.'], ['ମୋତେ କାଶ ଓ ଥଣ୍ଡା ହୋଇଛି।', 'mote kaasha o thandaa hoichhi.'],
      ['ମୋ ମୁଣ୍ଡ ବୁଲାଉଛି।', 'mo munda bulaauchhi.'], ['ଗତକାଲିରୁ।', 'gatakaaliru.'], ['ମୋତେ ଡାକ୍ତର ଦରକାର।', 'mote daaktara darakaara.'],
      ['କେଉଁଠି ବିନ୍ଧୁଛି?', 'keunthi bindhuchhi?'], ['ଏଠି ବିନ୍ଧୁଛି।', 'ethi bindhuchhi.'],
      ['ମୋର ହାଇ ବ୍ଲଡ଼ ପ୍ରେସର ଅଛି।', 'mora high blood pressure achhi.'], ['ଶୀଘ୍ର ଭଲ ହୁଅନ୍ତୁ!', 'sheeghra bhala huantu!']
    ] },
    pharmacy: { name: 'ଔଷଧ ଦୋକାନ', items: [
      ['ଔଷଧ', 'aushadha'], ['ମୋତେ ଏହି ଔଷଧ ଦରକାର।', 'mote ehi aushadha darakaara.'], ['ଜରର ଔଷଧ ଅଛି କି?', 'jarara aushadha achhi ki?'],
      ['ଦିନକୁ କେତେ ଥର?', 'dinaku kete thara?'], ['ଖାଇବା ଆଗରୁ କି ପରେ?', 'khaaibaa aagaru ki pare?'],
      ['ଦିନକୁ ଦୁଇ ଥର, ଖାଇବା ପରେ।', 'dinaku dui thara, khaaibaa pare.'], ['ବଟିକା / ସିରପ୍', 'batikaa / syrup'], ['ବ୍ୟାଣ୍ଡେଜ୍', 'bandage'],
      ['କିଛି ପାର୍ଶ୍ୱ ପ୍ରତିକ୍ରିୟା ଅଛି କି?', 'kichhi paarshwa pratikriyaa achhi ki?'], ['ବିନ୍ଧା କମିବା ଔଷଧ ଦିଅନ୍ତୁ।', 'bindhaa kamibaa aushadha diantu.']
    ] },
    bank: { name: 'ବ୍ୟାଙ୍କ ଓ ପୋଷ୍ଟ ଅଫିସ୍', items: [
      ['ମୁଁ ଖାତା ଖୋଲିବାକୁ ଚାହେଁ।', 'mun khaataa kholibaaku chaahen.'], ['ଏହି ଫର୍ମ ଭରନ୍ତୁ।', 'ehi form bharantu.'],
      ['ମୁଁ ଟଙ୍କା ଉଠାଇବାକୁ ଚାହେଁ।', 'mun tankaa uthaaibaaku chaahen.'], ['ମୁଁ ଟଙ୍କା ଜମା କରିବାକୁ ଚାହେଁ।', 'mun tankaa jamaa karibaaku chaahen.'],
      ['ଖାତା ନମ୍ବର', 'khaataa number'], ['ଏଠି ଦସ୍ତଖତ କରନ୍ତୁ।', 'ethi dastakhata karantu.'], ['ପାସ୍‌ବୁକ୍', 'passbook'],
      ['ମୁଁ ପାର୍ସଲ୍ ପଠାଇବାକୁ ଚାହେଁ।', 'mun parcel pathaaibaaku chaahen.'], ['ଡାକ ଟିକେଟ୍', 'daaka ticket'], ['ଲାଇନ୍ କେଉଁଠି?', 'line keunthi?']
    ] },
    office: { name: 'ଅଫିସ୍ ଓ କାମ', items: [
      ['ନମସ୍କାର ସାର୍ / ମ୍ୟାଡାମ୍।', 'namaskaara sir / madam.'], ['ମିଟିଂ', 'meeting'], ['ମୋତେ ଟିକିଏ ଡେରି ହେବ।', 'mote tikie deri heba.'],
      ['ମୋତେ ଫାଇଲ୍ ପଠାନ୍ତୁ।', 'mote file pathaantu.'], ['ମୁଁ କାମ ସାରିଦେଲି।', 'mun kaama saarideli.'], ['ଏହା ଯାଞ୍ଚ କରନ୍ତୁ।', 'ehaa jaancha karantu.'],
      ['ଛୁଟି (କାମରୁ)', 'chhuti (kaamaru)'], ['ମୋତେ କାଲି ଛୁଟି ଦରକାର।', 'mote kaali chhuti darakaara.'], ['ବହୁତ ଭଲ କାମ!', 'bahuta bhala kaama!'],
      ['କାଲି କଥା ହେବା।', 'kaali kathaa hebaa.']
    ] },
    phone: { name: 'ଫୋନ୍ ଓ ଇଣ୍ଟରନେଟ୍', items: [
      ['ଫୋନ୍', 'phone'], ['ଆପଣଙ୍କ ଫୋନ୍ ନମ୍ବର କ\'ଣ?', 'aapananka phone number kana?'], ['ମୋତେ ଫୋନ୍ କରନ୍ତୁ।', 'mote phone karantu.'],
      ['ମୁଁ ପରେ ଫୋନ୍ କରିବି।', 'mun pare phone karibi.'], ['ଆପଣଙ୍କ ସ୍ୱର ଶୁଭୁ ନାହିଁ।', 'aapananka swara shubhu naahin.'],
      ['ଜୋର୍‌ରେ କୁହନ୍ତୁ।', 'jor re kuhantu.'], ['WhatsApp ରେ ମେସେଜ୍ କରନ୍ତୁ।', 'WhatsApp re message karantu.'],
      ['ଏଠି Wi-Fi ଅଛି କି?', 'ethi Wi-Fi achhi ki?'], ['ଫୋନ୍ ଚାର୍ଜ କରନ୍ତୁ।', 'phone charge karantu.'], ['ଗୋଟିଏ ଫଟୋ ନିଅନ୍ତୁ।', 'gotie photo niantu.']
    ] },
    school: { name: 'ସ୍କୁଲ୍ ଓ ଶ୍ରେଣୀ', items: [
      ['ଶିକ୍ଷକ', 'shikshaka'], ['ଛାତ୍ର', 'chhaatra'], ['ବହି', 'bahi'], ['ଖାତା', 'khaataa'], ['କଲମ', 'kalama'], ['ଶ୍ରେଣୀ', 'shrenee'],
      ['ଘର କାମ', 'ghara kaama'], ['ପରୀକ୍ଷା', 'pareekshaa'], ['ବହି ଖୋଲନ୍ତୁ।', 'bahi kholantu.'], ['କିଛି ପ୍ରଶ୍ନ ଅଛି କି?', 'kichhi prashna achhi ki?'],
      ['ମୁଁ ବୁଝିଗଲି।', 'mun bujhigali.'], ['ପୁଣି ବୁଝାନ୍ତୁ।', 'puni bujhaantu.']
    ] },
    learning: { name: 'ଭାଷା ଶିଖିବା', items: [
      ['ଆପଣ ଇଂରାଜୀ କହନ୍ତି କି?', 'aapana ingraajee kahanti ki?'], ['ମୁଁ ଟିକିଏ ଟିକିଏ କହେ।', 'mun tikie tikie kahe.'],
      ['ମୁଁ ଆପଣଙ୍କ ଭାଷା ଶିଖୁଛି।', 'mun aapananka bhaashaa shikhuchhi.'], ['ଏହାକୁ କ\'ଣ କୁହାଯାଏ?', 'ehaaku kana kuhaajaae?'],
      ['ଏହାର ଅର୍ଥ କ\'ଣ?', 'ehaara artha kana?'], ['ଧୀରେ କୁହନ୍ତୁ।', 'dheere kuhantu.'], ['ପୁଣି ଥରେ କୁହନ୍ତୁ।', 'puni thare kuhantu.'],
      ['ମୁଁ ବୁଝୁଛି।', 'mun bujhuchhi.'], ['ମୁଁ ବୁଝିପାରୁ ନାହିଁ।', 'mun bujhipaaru naahin.'], ['ଲେଖି ଦିଅନ୍ତୁ।', 'lekhi diantu.'],
      ['ଏହା ଠିକ୍ କି?', 'ehaa thik ki?'], ['ମୋତେ ଶିଖାନ୍ତୁ।', 'mote shikhaantu.']
    ] },
    home: { name: 'ଘର ଓ କୋଠରୀ', items: [
      ['ଘର', 'ghara'], ['କୋଠରୀ', 'kotharee'], ['ରୋଷେଇ ଘର', 'roshei ghara'], ['ବାଥରୁମ୍', 'bathroom'], ['କବାଟ', 'kabaata'], ['ଝରକା', 'jharakaa'],
      ['ଚାବି', 'chaabi'], ['ଖଟ', 'khata'], ['ଚେୟାର', 'chair'], ['ଟେବୁଲ', 'table'], ['ଲାଇଟ୍', 'light'], ['ପଙ୍ଖା', 'pankhaa']
    ] },
    routine: { name: 'ଦିନଚର୍ଯ୍ୟା', items: [
      ['ମୁଁ ଛଅଟାରେ ଉଠେ।', 'mun chhaataare uthe.'], ['ମୁଁ ଦାନ୍ତ ଘଷେ।', 'mun daanta ghashe.'], ['ମୁଁ ଗାଧୋଏ।', 'mun gaadhoe.'],
      ['ମୁଁ ଜଳଖିଆ ଖାଏ।', 'mun jalakhiaa khaae.'], ['ମୁଁ କାମକୁ ଯାଏ।', 'mun kaamaku jaae.'],
      ['ମୁଁ ସନ୍ଧ୍ୟାରେ ଘରକୁ ଫେରେ।', 'mun sandhyaare gharaku phere.'], ['ମୁଁ ରାତିର ଖାଇବା ରାନ୍ଧେ।', 'mun raatira khaaibaa raandhe.'],
      ['ମୁଁ TV ଦେଖେ।', 'mun TV dekhe.'], ['ମୁଁ ଦଶଟାରେ ଶୋଏ।', 'mun dashataare shoe.'], ['ଆପଣ କେତେବେଳେ ଉଠନ୍ତି?', 'aapana ketebele uthanti?']
    ] },
    kitchen: { name: 'ରୋଷେଇ ଘର ଓ ରୋଷେଇ', items: [
      ['ଥାଳି', 'thaali'], ['ଗ୍ଲାସ୍', 'glass'], ['ଚାମଚ', 'chaamacha'], ['ଛୁରୀ', 'chhuree'], ['ବାସନ', 'baasana'], ['ଚୁଲି', 'chuli'],
      ['ପରିବା କାଟନ୍ତୁ।', 'paribaa kaatantu.'], ['ପାଣି ଫୁଟାନ୍ତୁ।', 'paani phutaantu.'], ['ବାସନ ମାଜନ୍ତୁ।', 'baasana maajantu.'],
      ['ଲୁଣ ଦିଅନ୍ତୁ।', 'luna diantu.'], ['ଚାଖି ଦେଖନ୍ତୁ।', 'chaakhi dekhantu.'], ['ଖାଇବା ତିଆରି!', 'khaaibaa tiaari!']
    ] },
    household: { name: 'ଘର କାମ', items: [
      ['ପାଣି ଆଣନ୍ତୁ।', 'paani aanantu.'], ['କବାଟ ବନ୍ଦ କରନ୍ତୁ।', 'kabaata banda karantu.'], ['ଝରକା ଖୋଲନ୍ତୁ।', 'jharakaa kholantu.'],
      ['ଲାଇଟ୍ ଜାଳନ୍ତୁ।', 'light jaalantu.'], ['ପଙ୍ଖା ବନ୍ଦ କରନ୍ତୁ।', 'pankhaa banda karantu.'], ['କୋଠରୀ ସଫା କରନ୍ତୁ।', 'kotharee saphaa karantu.'],
      ['ଲୁଗା ଧୁଅନ୍ତୁ।', 'lugaa dhuantu.'], ['ଏଠିକି ଆସନ୍ତୁ।', 'ethiki aasantu.'], ['ବସନ୍ତୁ ନା।', 'basantu naa.'], ['ଚା ପିଅନ୍ତୁ।', 'chaa piantu.'],
      ['ମୋତେ ସାହାଯ୍ୟ କରନ୍ତୁ।', 'mote saahaajya karantu.'], ['ଆଉ କିଛି?', 'aau kichhi?']
    ] },
    festivals: { name: 'ପର୍ବ ଓ ଶୁଭେଚ୍ଛା', items: [
      ['ଶୁଭ ଦୀପାବଳି!', 'shubha Deepaabali!'], ['ଈଦ୍ ମୁବାରକ!', 'Eid mubaaraka!'], ['ଶୁଭ ହୋଲି!', 'shubha Holi!'], ['ଶୁଭ ବଡ଼ଦିନ!', 'shubha Badadina!'],
      ['ଶୁଭ ନବବର୍ଷ!', 'shubha nababarsha!'], ['ଶୁଭ ମକର ସଂକ୍ରାନ୍ତି!', 'shubha Makara Sankraanti!'],
      ['ଶୁଭ ସ୍ୱାଧୀନତା ଦିବସ!', 'shubha swaadheenataa dibasa!'], ['ଶୁଭ ଜନ୍ମଦିନ!', 'shubha janmadina!'], ['ଅଭିନନ୍ଦନ!', 'abhinandana!'],
      ['ଶୁଭେଚ୍ଛା!', 'shubhechhaa!'], ['ପର୍ବରେ ଆମ ଘରକୁ ଆସନ୍ତୁ।', 'parbare aama gharaku aasantu.'], ['ମିଠା ଖାଆନ୍ତୁ।', 'mithaa khaaantu.']
    ] },
    weather: { name: 'ପାଗ ଓ ପ୍ରକୃତି', items: [
      ['ପାଗ କେମିତି ଅଛି?', 'paaga kemiti achhi?'], ['ବର୍ଷା ହେଉଛି।', 'barshaa heuchhi.'], ['ବହୁତ ଗରମ।', 'bahuta garama.'],
      ['ଥଣ୍ଡା ଅଛି।', 'thandaa achhi.'], ['ଛତା ନେଇ ଯାଆନ୍ତୁ।', 'chhataa nei jaaantu.'], ['ସୂର୍ଯ୍ୟ', 'soorjya'], ['ଚନ୍ଦ୍ର', 'chandra'],
      ['ପବନ', 'pabana'], ['ଗଛ', 'gachha'], ['ନଦୀ', 'nadee']
    ] },
    emergency: { name: 'ଜରୁରୀ ଅବସ୍ଥା', items: [
      ['ବଞ୍ଚାଅ!', 'banchaao!'], ['ପୋଲିସ୍ ଡାକନ୍ତୁ!', 'police daakantu!'], ['ଆମ୍ବୁଲାନ୍ସ ଡାକନ୍ତୁ!', 'ambulance daakantu!'],
      ['ଶୀଘ୍ର ଡାକ୍ତର ଡାକନ୍ତୁ!', 'sheeghra daaktara daakantu!'], ['ନିଆଁ!', 'niaan!'], ['ଏକ ଦୁର୍ଘଟଣା ଘଟିଛି।', 'eka durghatanaa ghatichhi.'],
      ['ମୋ ବ୍ୟାଗ୍ ହଜିଗଲା।', 'mo bag hajigalaa.'], ['ମୁଁ ବାଟ ହଜିଗଲି।', 'mun baata hajigali.'], ['ସାବଧାନ!', 'saabadhaana!'],
      ['ସବୁ ଠିକ୍ ଅଛି କି?', 'sabu thik achhi ki?'], ['ରହନ୍ତୁ!', 'rahantu!'], ['112 ରେ ଫୋନ୍ କରନ୍ତୁ।', '112 re phone karantu.']
    ] }
  } },
  ta: { topics: {
    greetings: { name: 'வாழ்த்துகள்', items: [
      ['வணக்கம்', 'vanakkam'], ['காலை வணக்கம்', 'kaalai vanakkam'], ['இனிய இரவு', 'iniya iravu'],
      ['நீங்கள் எப்படி இருக்கிறீர்கள்?', 'neengal eppadi irukkireergal?'], ['நான் நலமாக இருக்கிறேன், நன்றி.', 'naan nalamaaga irukkiren, nandri.'],
      ['நீங்கள்?', 'neengal?'], ['உங்களைச் சந்தித்ததில் மகிழ்ச்சி.', 'ungalai sandhithadhil magizhchi.'], ['வருக, வருக!', 'varuga, varuga!'],
      ['சரி, மீண்டும் சந்திப்போம்.', 'sari, meendum sandhippom.'], ['நாளை சந்திப்போம்.', 'naalai sandhippom.'],
      ['பார்த்துக்கொள்ளுங்கள்.', 'paarthukkollungal.'], ['ரொம்ப நாளாச்சு பார்த்து!', 'romba naalaachu paarthu!']
    ] },
    basics: { name: 'ஆம், இல்லை, தயவுசெய்து, நன்றி', items: [
      ['ஆம்', 'aam'], ['இல்லை', 'illai'], ['தயவுசெய்து', 'thayavuseidhu'], ['நன்றி', 'nandri'], ['மிக்க நன்றி', 'mikka nandri'],
      ['பரவாயில்லை.', 'paravaayillai.'], ['மன்னிக்கவும்', 'mannikkavum'], ['ஒரு பிரச்சினையும் இல்லை.', 'oru prachchinaiyum illai.'], ['சரி', 'sari'],
      ['கண்டிப்பாக', 'kandippaaga'], ['இருக்கலாம்', 'irukkalaam'], ['எனக்குத் தெரியாது.', 'enakku theriyaadhu.']
    ] },
    intro: { name: 'என்னைப் பற்றி', items: [
      ['உங்கள் பெயர் என்ன?', 'ungal peyar enna?'], ['என் பெயர் ரியா.', 'en peyar Riya.'], ['நீங்கள் எந்த ஊர்?', 'neengal endha oor?'],
      ['என் ஊர் டெல்லி.', 'en oor Delhi.'], ['நான் மும்பையில் வசிக்கிறேன்.', 'naan Mumbaiyil vasikkiren.'],
      ['நான் ஒரு மாணவன்.', 'naan oru maanavan.'], ['நான் ஒரு ஆசிரியர்.', 'naan oru aasiriyar.'], ['உங்கள் வயது என்ன?', 'ungal vayadhu enna?'],
      ['எனக்கு இருபத்தைந்து வயது.', 'enakku irubathaindhu vayadhu.'], ['இவர் என் நண்பர்.', 'ivar en nanbar.']
    ] },
    smalltalk: { name: 'சாதாரண பேச்சு', items: [
      ['எல்லாம் எப்படிப் போகிறது?', 'ellaam eppadi pogiradhu?'], ['எல்லாம் நன்றாக இருக்கிறது.', 'ellaam nandraaga irukkiradhu.'],
      ['என்ன செய்கிறீர்கள்?', 'enna seigireergal?'], ['ஒன்றும் விசேஷமில்லை.', 'ondrum viseshamillai.'],
      ['வீட்டில் எல்லோரும் எப்படி இருக்கிறார்கள்?', 'veettil ellorum eppadi irukkiraargal?'], ['எல்லோரும் நலம்.', 'ellorum nalam.'],
      ['என்ன புதுசு?', 'enna pudhusu?'], ['சாப்பிட்டீர்களா?', 'saappitteergala?'],
      ['இன்று வானிலை நன்றாக இருக்கிறது.', 'indru vaanilai nandraaga irukkiradhu.'], ['போகலாம்!', 'pogalaam!']
    ] },
    feelings: { name: 'உணர்வுகள்', items: [
      ['நான் மகிழ்ச்சியாக இருக்கிறேன்.', 'naan magizhchiyaaga irukkiren.'], ['நான் வருத்தமாக இருக்கிறேன்.', 'naan varuthamaaga irukkiren.'],
      ['நான் களைப்பாக இருக்கிறேன்.', 'naan kalaippaaga irukkiren.'], ['எனக்குப் பசிக்கிறது.', 'enakku pasikkiradhu.'],
      ['எனக்குத் தாகமாக இருக்கிறது.', 'enakku thaagamaaga irukkiradhu.'], ['எனக்குக் கோபம் வருகிறது.', 'enakku kobam varugiradhu.'],
      ['எனக்குப் பயமாக இருக்கிறது.', 'enakku bayamaaga irukkiradhu.'], ['எனக்கு அலுப்பாக இருக்கிறது.', 'enakku aluppaaga irukkiradhu.'],
      ['எனக்கு இது பிடிக்கும்.', 'enakku idhu pidikkum.'], ['எனக்கு இது பிடிக்காது.', 'enakku idhu pidikkaadhu.']
    ] },
    questions: { name: 'கேள்விச் சொற்கள்', items: [
      ['என்ன?', 'enna?'], ['யார்?', 'yaar?'], ['எங்கே?', 'enge?'], ['எப்போது?', 'eppodhu?'], ['ஏன்?', 'yen?'], ['எப்படி?', 'eppadi?'],
      ['எவ்வளவு? / எத்தனை?', 'evvalavu? / ethanai?'], ['எது?', 'edhu?'], ['இது என்ன?', 'idhu enna?'],
      ['கழிப்பறை எங்கே இருக்கிறது?', 'kazhipparai enge irukkiradhu?']
    ] },
    verbs: { name: 'அன்றாடச் செயல்கள்', items: [
      ['வாருங்கள்.', 'vaarungal.'], ['போங்கள்.', 'pongal.'], ['உட்காருங்கள்.', 'utkaarungal.'], ['எழுந்து நில்லுங்கள்.', 'ezhundhu nillungal.'],
      ['சாப்பிடுங்கள்.', 'saappidungal.'], ['குடியுங்கள்.', 'kudiyungal.'], ['கொடுங்கள்.', 'kodungal.'],
      ['எடுத்துக்கொள்ளுங்கள்.', 'eduthukkollungal.'], ['பாருங்கள்.', 'paarungal.'], ['கேளுங்கள்.', 'kelungal.'],
      ['எனக்குச் சொல்லுங்கள்.', 'enakku sollungal.'], ['ஒரு நிமிடம் காத்திருங்கள்.', 'oru nimidam kaathirungal.']
    ] },
    opposites: { name: 'எதிர்ச்சொற்கள்', items: [
      ['பெரிய / சிறிய', 'periya / siriya'], ['சூடு / குளிர்', 'soodu / kulir'], ['நல்ல / கெட்ட', 'nalla / ketta'],
      ['புதிய / பழைய', 'pudhiya / pazhaiya'], ['அருகில் / தூரம்', 'arugil / thooram'], ['வேகம் / மெதுவாக', 'vegam / medhuvaaga'],
      ['திறந்த / மூடிய', 'thirandha / moodiya'], ['மலிவு / விலை அதிகம்', 'malivu / vilai adhigam'], ['சுத்தம் / அழுக்கு', 'sutham / azhukku'],
      ['எளிது / கடினம்', 'elidhu / kadinam'], ['அதிகம் / குறைவு', 'adhigam / kuraivu'], ['வலது / இடது', 'valadhu / idadhu']
    ] },
    numbers: { name: 'எண்கள்', items: [
      ['பூஜ்ஜியம்', 'poojjiyam'], ['ஒன்று', 'ondru'], ['இரண்டு', 'irandu'], ['மூன்று', 'moondru'], ['நான்கு', 'naangu'], ['ஐந்து', 'aindhu'],
      ['ஆறு', 'aaru'], ['ஏழு', 'ezhu'], ['எட்டு', 'ettu'], ['ஒன்பது', 'onbadhu'], ['பத்து', 'pathu'], ['பதினொன்று', 'padhinondru'],
      ['பன்னிரண்டு', 'pannirandu'], ['பதின்மூன்று', 'padhinmoondru'], ['பதினான்கு', 'padhinaangu'], ['பதினைந்து', 'padhinaindhu'],
      ['பதினாறு', 'padhinaaru'], ['பதினேழு', 'padhinezhu'], ['பதினெட்டு', 'padhinettu'], ['பத்தொன்பது', 'pathonbadhu'], ['இருபது', 'irubadhu'],
      ['முப்பது', 'muppadhu'], ['நாற்பது', 'naarpadhu'], ['ஐம்பது', 'aimbadhu'], ['அறுபது', 'arubadhu'], ['எழுபது', 'ezhubadhu'],
      ['எண்பது', 'enbadhu'], ['தொண்ணூறு', 'thonnooru'], ['நூறு', 'nooru'], ['ஆயிரம்', 'aayiram'], ['ஒரு லட்சம்', 'oru latcham'],
      ['ஒரு கோடி', 'oru kodi']
    ] },
    quantities: { name: 'அளவுகள்', items: [
      ['கொஞ்சம்', 'konjam'], ['நிறைய', 'niraiya'], ['அரை', 'arai'], ['ஒன்றரை', 'ondrarai'], ['கால்', 'kaal'], ['ஒரு கிலோ', 'oru kilo'],
      ['அரை கிலோ', 'arai kilo'], ['ஒரு லிட்டர்', 'oru litre'], ['ஒரு டஜன்', 'oru dozen'], ['போதும்', 'podhum']
    ] },
    days: { name: 'நாட்கள்', items: [
      ['திங்கள்', 'thingal'], ['செவ்வாய்', 'sevvaai'], ['புதன்', 'budhan'], ['வியாழன்', 'viyaazhan'], ['வெள்ளி', 'velli'], ['சனி', 'sani'],
      ['ஞாயிறு', 'nyaayiru'], ['இன்று', 'indru'], ['நாளை', 'naalai'], ['நேற்று', 'netru']
    ] },
    time: { name: 'நேரம்', items: [
      ['மணி என்ன?', 'mani enna?'], ['ஐந்து மணி.', 'aindhu mani.'], ['ஐந்தரை மணி', 'aindharai mani'], ['காலை', 'kaalai'], ['மதியம்', 'madhiyam'],
      ['மாலை', 'maalai'], ['இரவு', 'iravu'], ['இப்போது', 'ippodhu'], ['பிறகு', 'piragu'], ['சீக்கிரம்', 'seekkiram'], ['தாமதம்', 'thaamadham'],
      ['ஒரு மணி நேரம்', 'oru mani neram']
    ] },
    calendar: { name: 'வாரம், மாதம், ஆண்டு', items: [
      ['வாரம்', 'vaaram'], ['மாதம்', 'maadham'], ['ஆண்டு', 'aandu'], ['இந்த வாரம்', 'indha vaaram'], ['அடுத்த மாதம்', 'adutha maadham'],
      ['போன ஆண்டு', 'pona aandu'], ['இன்று என்ன தேதி?', 'indru enna thedhi?'], ['விடுமுறை', 'vidumurai'], ['பிறந்தநாள்', 'pirandhanaal'],
      ['வார இறுதி', 'vaara irudhi']
    ] },
    family: { name: 'குடும்பம்', items: [
      ['அம்மா', 'amma'], ['அப்பா', 'appa'], ['அண்ணன்', 'annan'], ['அக்கா', 'akka'], ['தம்பி', 'thambi'], ['தங்கை', 'thangai'], ['மகன்', 'magan'],
      ['மகள்', 'magal'], ['கணவர்', 'kanavar'], ['மனைவி', 'manaivi'], ['தாத்தா', 'thaatha'], ['பாட்டி', 'paatti']
    ] },
    people: { name: 'மக்கள்', items: [
      ['நண்பர்', 'nanbar'], ['பக்கத்து வீட்டுக்காரர்', 'pakkathu veettukkaarar'], ['விருந்தினர்', 'virundhinar'], ['குழந்தை', 'kuzhandhai'],
      ['குழந்தைகள்', 'kuzhandhaigal'], ['பையன்', 'paiyan'], ['பெண்', 'pen'], ['ஆண்', 'aan'], ['பெண்மணி', 'penmani'], ['எல்லோரும்', 'ellorum']
    ] },
    colours: { name: 'நிறங்கள்', items: [
      ['சிவப்பு', 'sivappu'], ['நீலம்', 'neelam'], ['பச்சை', 'pachchai'], ['மஞ்சள்', 'manjal'], ['வெள்ளை', 'vellai'], ['கருப்பு', 'karuppu'],
      ['ஆரஞ்சு', 'aaranju'], ['இளஞ்சிவப்பு', 'ilanjivappu'], ['பழுப்பு', 'pazhuppu'], ['ஊதா', 'oodhaa']
    ] },
    food: { name: 'உணவு', items: [
      ['தண்ணீர்', 'thanneer'], ['தேநீர்', 'theneer'], ['பால்', 'paal'], ['சாதம்', 'saadham'], ['ரொட்டி / சப்பாத்தி', 'rotti / chappaathi'],
      ['பருப்பு', 'paruppu'], ['காய்கறி', 'kaaikari'], ['பழம்', 'pazham'], ['சர்க்கரை', 'sarkkarai'], ['உப்பு', 'uppu'], ['தயிர்', 'thayir'],
      ['முட்டை', 'muttai']
    ] },
    restaurant: { name: 'உணவகத்தில்', items: [
      ['மெனு காட்டுங்கள்.', 'menu kaattungal.'], ['இங்கே என்ன நன்றாக இருக்கும்?', 'inge enna nandraaga irukkum?'], ['நான் சைவம்.', 'naan saivam.'],
      ['ஒரு பிளேட் சாதம் கொடுங்கள்.', 'oru plate saadham kodungal.'], ['ஒரு கப் தேநீர் கொடுங்கள்.', 'oru cup theneer kodungal.'],
      ['காரம் குறைவாக வையுங்கள்.', 'kaaram kuraivaaga vaiyungal.'], ['கொஞ்சம் தண்ணீர் கொடுங்கள்.', 'konjam thanneer kodungal.'],
      ['பில் கொண்டு வாருங்கள்.', 'bill kondu vaarungal.'], ['மிகவும் சுவையாக இருந்தது!', 'migavum suvaiyaaga irundhadhu!'],
      ['இது காரமா?', 'idhu kaaramaa?']
    ] },
    taste: { name: 'சுவை மற்றும் சமையல்', items: [
      ['காரம்', 'kaaram'], ['இனிப்பு', 'inippu'], ['உப்பு சுவை', 'uppu suvai'], ['புளிப்பு', 'pulippu'], ['கசப்பு', 'kasappu'],
      ['சுவையானது', 'suvaiyaanadhu'], ['சூடாக, புதிதாக', 'soodaaga, pudhidhaaga'], ['குளிர்ச்சி', 'kulirchchi'],
      ['எண்ணெய் குறைவாகப் போடுங்கள்.', 'ennai kuraivaaga podungal.'], ['வெங்காயம் பூண்டு போடாதீர்கள்.', 'vengaayam poondu podaadheergal.']
    ] },
    market: { name: 'கடை மற்றும் பேரம்', items: [
      ['இது எவ்வளவு?', 'idhu evvalavu?'], ['விலை மிக அதிகம்.', 'vilai miga adhigam.'],
      ['கொஞ்சம் குறைத்துக் கொடுங்கள்.', 'konjam kuraithu kodungal.'], ['கடைசி விலை என்ன?', 'kadaisi vilai enna?'],
      ['நான் இதை எடுக்கிறேன்.', 'naan idhai edukkiren.'], ['எனக்கு வேண்டாம்.', 'enakku vendaam.'],
      ['இதைவிடப் பெரியது இருக்கிறதா?', 'idhaivida periyadhu irukkiradhaa?'], ['ஒரு கிலோ கொடுங்கள்.', 'oru kilo kodungal.'],
      ['இது புதிதா?', 'idhu pudhidhaa?'], ['ஒரு பை கொடுங்கள்.', 'oru pai kodungal.'], ['சில்லறை இருக்கிறதா?', 'sillarai irukkiradhaa?'],
      ['எடை போட்டுக் கொடுங்கள்.', 'edai pottu kodungal.']
    ] },
    shopping: { name: 'ஆடை மற்றும் கடை', items: [
      ['சட்டை', 'sattai'], ['பேன்ட்', 'pant'], ['புடவை', 'pudavai'], ['குர்தா', 'kurta'], ['காலணி', 'kaalani'],
      ['இதைப் போட்டுப் பார்க்கலாமா?', 'idhai pottu paarkkalaamaa?'], ['வேறு நிறம் இருக்கிறதா?', 'veru niram irukkiradhaa?'],
      ['இது மிகப் பெரியது.', 'idhu miga periyadhu.'], ['இது மிகச் சிறியது.', 'idhu miga siriyadhu.'],
      ['இதைத் திருப்பிக் கொடுக்க வேண்டும்.', 'idhai thiruppi kodukka vendum.']
    ] },
    money: { name: 'பணம் மற்றும் பணம் செலுத்துதல்', items: [
      ['பணம்', 'panam'], ['ரூபாய்', 'roobaai'], ['சில்லறை', 'sillarai'], ['ரொக்கம்', 'rokkam'],
      ['UPI மூலம் கொடுக்கலாமா?', 'UPI moolam kodukkalaamaa?'], ['ரசீது கொடுங்கள்.', 'raseedhu kodungal.'], ['மொத்தம் எவ்வளவு?', 'motham evvalavu?'],
      ['இது விலை அதிகம்.', 'idhu vilai adhigam.'], ['இது மலிவு.', 'idhu malivu.'], ['என்னிடம் சில்லறை இல்லை.', 'ennidam sillarai illai.']
    ] },
    auto: { name: 'ஆட்டோ மற்றும் டாக்ஸி', items: [
      ['ஆட்டோ! / டாக்ஸி!', 'auto! / taxi!'], ['ஸ்டேஷன் வருவீர்களா?', 'station varuveergalaa?'], ['ஸ்டேஷனுக்கு எவ்வளவு?', 'stationukku evvalavu?'],
      ['மீட்டர் போடுங்கள்.', 'meter podungal.'], ['இங்கே நிறுத்துங்கள்.', 'inge niruthungal.'], ['நேராகப் போங்கள்.', 'neraaga pongal.'],
      ['இடது பக்கம் திரும்புங்கள்.', 'idadhu pakkam thirumbungal.'], ['வலது பக்கம் திரும்புங்கள்.', 'valadhu pakkam thirumbungal.'],
      ['மெதுவாக ஓட்டுங்கள்.', 'medhuvaaga ottungal.'], ['இங்கே காத்திருங்கள்.', 'inge kaathirungal.']
    ] },
    transport: { name: 'பேருந்து மற்றும் ரயில்', items: [
      ['பஸ் ஸ்டாப் எங்கே?', 'bus stop enge?'], ['மார்க்கெட்டுக்கு எந்த பஸ் போகும்?', 'marketukku endha bus pogum?'],
      ['இந்த ரயில் சென்னைக்குப் போகுமா?', 'indha rayil Chennaikku pogumaa?'], ['ஒரு டிக்கெட் கொடுங்கள்.', 'oru ticket kodungal.'],
      ['புனேவுக்கு இரண்டு டிக்கெட் கொடுங்கள்.', 'Punevukku irandu ticket kodungal.'],
      ['ரயில் எத்தனை மணிக்குக் கிளம்பும்?', 'rayil ethanai manikku kilambum?'], ['எந்த பிளாட்பாரம்?', 'endha platform?'],
      ['இந்த இடம் காலியா?', 'indha idam kaaliyaa?'], ['நான் எங்கே இறங்க வேண்டும்?', 'naan enge iranga vendum?'],
      ['பஸ் தாமதமாக வருகிறது.', 'bus thaamadhamaaga varugiradhu.']
    ] },
    directions: { name: 'வழி', items: [
      ['இது எங்கே இருக்கிறது?', 'idhu enge irukkiradhu?'], ['நேராக', 'neraaga'], ['இடது', 'idadhu'], ['வலது', 'valadhu'], ['அருகில்', 'arugil'],
      ['தூரம்', 'thooram'], ['வங்கிக்குப் பக்கத்தில்', 'vangikku pakkathil'], ['கோயிலுக்கு எதிரே', 'koyilukku edhire'],
      ['எவ்வளவு தூரம்?', 'evvalavu thooram?'], ['நடந்து போகலாமா?', 'nadandhu pogalaamaa?']
    ] },
    places: { name: 'ஊரில் உள்ள இடங்கள்', items: [
      ['மருத்துவமனை', 'maruthuvamanai'], ['வங்கி', 'vangi'], ['ATM', 'ATM'], ['தபால் நிலையம்', 'thabaal nilaiyam'],
      ['காவல் நிலையம்', 'kaaval nilaiyam'], ['ரயில் நிலையம்', 'rayil nilaiyam'], ['பஸ் நிலையம்', 'bus nilaiyam'], ['மார்க்கெட்', 'market'],
      ['பள்ளி', 'palli'], ['கோயில்', 'koyil'], ['மசூதி', 'masoodhi'], ['தேவாலயம்', 'devaalayam']
    ] },
    doctor: { name: 'மருத்துவர் மற்றும் உடல்நலம்', items: [
      ['எனக்கு உடம்பு சரியில்லை.', 'enakku udambu sariyillai.'], ['எனக்குக் காய்ச்சல்.', 'enakku kaaichchal.'],
      ['எனக்குத் தலைவலி.', 'enakku thalaivali.'], ['எனக்கு வயிறு வலிக்கிறது.', 'enakku vayiru valikkiradhu.'],
      ['எனக்கு இருமல் மற்றும் சளி.', 'enakku irumal matrum sali.'], ['எனக்குத் தலை சுற்றுகிறது.', 'enakku thalai sutrugiradhu.'],
      ['நேற்றிலிருந்து.', 'netrilirundhu.'], ['எனக்கு டாக்டர் வேண்டும்.', 'enakku doctor vendum.'], ['எங்கே வலிக்கிறது?', 'enge valikkiradhu?'],
      ['இங்கே வலிக்கிறது.', 'inge valikkiradhu.'], ['எனக்கு ரத்த அழுத்தம் அதிகம்.', 'enakku ratha azhutham adhigam.'],
      ['விரைவில் குணமடையுங்கள்!', 'viraivil gunamadaiyungal!']
    ] },
    pharmacy: { name: 'மருந்துக் கடை', items: [
      ['மருந்து', 'marundhu'], ['எனக்கு இந்த மருந்து வேண்டும்.', 'enakku indha marundhu vendum.'],
      ['காய்ச்சலுக்கு மருந்து இருக்கிறதா?', 'kaaichchalukku marundhu irukkiradhaa?'], ['ஒரு நாளைக்கு எத்தனை முறை?', 'oru naalaikku ethanai murai?'],
      ['சாப்பாட்டுக்கு முன்னா பின்னா?', 'saappaattukku munnaa pinnaa?'],
      ['நாளைக்கு இரண்டு முறை, சாப்பாட்டுக்குப் பின்.', 'naalaikku irandu murai, saappaattukku pin.'], ['மாத்திரை / சிரப்', 'maathirai / syrup'],
      ['கட்டு', 'kattu'], ['பக்க விளைவு இருக்கிறதா?', 'pakka vilaivu irukkiradhaa?'], ['வலி மாத்திரை கொடுங்கள்.', 'vali maathirai kodungal.']
    ] },
    bank: { name: 'வங்கி மற்றும் தபால் நிலையம்', items: [
      ['நான் கணக்கு தொடங்க வேண்டும்.', 'naan kanakku thodanga vendum.'], ['இந்தப் படிவத்தை நிரப்புங்கள்.', 'indha padivathai nirappungal.'],
      ['நான் பணம் எடுக்க வேண்டும்.', 'naan panam edukka vendum.'], ['நான் பணம் செலுத்த வேண்டும்.', 'naan panam selutha vendum.'],
      ['கணக்கு எண்', 'kanakku en'], ['இங்கே கையெழுத்துப் போடுங்கள்.', 'inge kaiyezhuthu podungal.'], ['பாஸ்புக்', 'passbook'],
      ['நான் பார்சல் அனுப்ப வேண்டும்.', 'naan parcel anuppa vendum.'], ['தபால் தலை', 'thabaal thalai'], ['வரிசை எங்கே?', 'varisai enge?']
    ] },
    office: { name: 'அலுவலகம் மற்றும் வேலை', items: [
      ['வணக்கம் சார் / மேடம்.', 'vanakkam sir / madam.'], ['மீட்டிங்', 'meeting'],
      ['நான் கொஞ்சம் தாமதமாக வருவேன்.', 'naan konjam thaamadhamaaga varuven.'], ['எனக்கு ஃபைலை அனுப்புங்கள்.', 'enakku file-ai anuppungal.'],
      ['நான் வேலையை முடித்துவிட்டேன்.', 'naan velaiyai mudithuvitten.'], ['இதைச் சரிபாருங்கள்.', 'idhai saripaarungal.'], ['விடுப்பு', 'viduppu'],
      ['எனக்கு நாளை விடுப்பு வேண்டும்.', 'enakku naalai viduppu vendum.'], ['நன்றாகச் செய்தீர்கள்!', 'nandraaga seidheergal!'],
      ['நாளை பேசுவோம்.', 'naalai pesuvom.']
    ] },
    phone: { name: 'போன் மற்றும் இணையம்', items: [
      ['போன்', 'phone'], ['உங்கள் போன் நம்பர் என்ன?', 'ungal phone number enna?'], ['எனக்குப் போன் செய்யுங்கள்.', 'enakku phone seiyungal.'],
      ['நான் பிறகு போன் செய்கிறேன்.', 'naan piragu phone seigiren.'], ['உங்கள் குரல் கேட்கவில்லை.', 'ungal kural ketkavillai.'],
      ['சத்தமாகப் பேசுங்கள்.', 'sathamaaga pesungal.'], ['WhatsApp-இல் மெசேஜ் அனுப்புங்கள்.', 'WhatsApp-il message anuppungal.'],
      ['இங்கே Wi-Fi இருக்கிறதா?', 'inge Wi-Fi irukkiradhaa?'], ['போனைச் சார்ஜ் போடுங்கள்.', 'phone-ai charge podungal.'],
      ['ஒரு போட்டோ எடுங்கள்.', 'oru photo edungal.']
    ] },
    school: { name: 'பள்ளி மற்றும் வகுப்பு', items: [
      ['ஆசிரியர்', 'aasiriyar'], ['மாணவர்', 'maanavar'], ['புத்தகம்', 'puthagam'], ['நோட்டு', 'nottu'], ['பேனா', 'pena'], ['வகுப்பு', 'vaguppu'],
      ['வீட்டுப்பாடம்', 'veettuppaadam'], ['தேர்வு', 'thervu'], ['புத்தகங்களைத் திறங்கள்.', 'puthagangalai thirangal.'],
      ['ஏதாவது கேள்வி?', 'edhaavadhu kelvi?'], ['எனக்குப் புரிந்தது.', 'enakku purindhadhu.'], ['மீண்டும் விளக்குங்கள்.', 'meendum vilakkungal.']
    ] },
    learning: { name: 'மொழி கற்றல்', items: [
      ['நீங்கள் ஆங்கிலம் பேசுவீர்களா?', 'neengal aangilam pesuveergalaa?'], ['நான் கொஞ்சம் பேசுவேன்.', 'naan konjam pesuven.'],
      ['நான் உங்கள் மொழியைக் கற்றுக்கொள்கிறேன்.', 'naan ungal mozhiyai katrukkolgiren.'], ['இதை எப்படிச் சொல்வது?', 'idhai eppadi solvadhu?'],
      ['இதன் அர்த்தம் என்ன?', 'idhan artham enna?'], ['மெதுவாகப் பேசுங்கள்.', 'medhuvaaga pesungal.'],
      ['மீண்டும் சொல்லுங்கள்.', 'meendum sollungal.'], ['எனக்குப் புரிகிறது.', 'enakku purigiradhu.'],
      ['எனக்குப் புரியவில்லை.', 'enakku puriyavillai.'], ['எழுதிக் கொடுங்கள்.', 'ezhudhi kodungal.'], ['இது சரியா?', 'idhu sariyaa?'],
      ['எனக்குக் கற்றுக்கொடுங்கள்.', 'enakku katrukkodungal.']
    ] },
    home: { name: 'வீடு மற்றும் அறைகள்', items: [
      ['வீடு', 'veedu'], ['அறை', 'arai'], ['சமையலறை', 'samaiyalarai'], ['குளியலறை', 'kuliyalarai'], ['கதவு', 'kadhavu'], ['ஜன்னல்', 'jannal'],
      ['சாவி', 'saavi'], ['படுக்கை', 'padukkai'], ['நாற்காலி', 'naarkaali'], ['மேசை', 'mesai'], ['விளக்கு', 'vilakku'], ['மின்விசிறி', 'minvisiri']
    ] },
    routine: { name: 'தினசரி வழக்கம்', items: [
      ['நான் ஆறு மணிக்கு எழுகிறேன்.', 'naan aaru manikku ezhugiren.'], ['நான் பல் துலக்குகிறேன்.', 'naan pal thulakkugiren.'],
      ['நான் குளிக்கிறேன்.', 'naan kulikkiren.'], ['நான் காலை உணவு சாப்பிடுகிறேன்.', 'naan kaalai unavu saappidugiren.'],
      ['நான் வேலைக்குப் போகிறேன்.', 'naan velaikku pogiren.'], ['நான் மாலையில் வீட்டுக்கு வருகிறேன்.', 'naan maalaiyil veettukku varugiren.'],
      ['நான் இரவு உணவு சமைக்கிறேன்.', 'naan iravu unavu samaikkiren.'], ['நான் TV பார்க்கிறேன்.', 'naan TV paarkkiren.'],
      ['நான் பத்து மணிக்குத் தூங்குகிறேன்.', 'naan pathu manikku thoongugiren.'],
      ['நீங்கள் எத்தனை மணிக்கு எழுவீர்கள்?', 'neengal ethanai manikku ezhuveergal?']
    ] },
    kitchen: { name: 'சமையலறை மற்றும் சமையல்', items: [
      ['தட்டு', 'thattu'], ['கிளாஸ்', 'glass'], ['கரண்டி', 'karandi'], ['கத்தி', 'kathi'], ['பாத்திரம்', 'paathiram'], ['அடுப்பு', 'aduppu'],
      ['காய்கறி நறுக்குங்கள்.', 'kaaikari narukkungal.'], ['தண்ணீர் கொதிக்க வையுங்கள்.', 'thanneer kodhikka vaiyungal.'],
      ['பாத்திரம் கழுவுங்கள்.', 'paathiram kazhuvungal.'], ['உப்பு போடுங்கள்.', 'uppu podungal.'], ['ருசி பாருங்கள்.', 'rusi paarungal.'],
      ['சாப்பாடு தயார்!', 'saappaadu thayaar!']
    ] },
    household: { name: 'வீட்டு வேலைகள்', items: [
      ['தண்ணீர் கொண்டு வாருங்கள்.', 'thanneer kondu vaarungal.'], ['கதவை மூடுங்கள்.', 'kadhavai moodungal.'],
      ['ஜன்னலைத் திறங்கள்.', 'jannalai thirangal.'], ['விளக்கைப் போடுங்கள்.', 'vilakkai podungal.'],
      ['மின்விசிறியை அணையுங்கள்.', 'minvisiriyai anaiyungal.'], ['அறையைச் சுத்தம் செய்யுங்கள்.', 'araiyai sutham seiyungal.'],
      ['துணிகளைத் துவையுங்கள்.', 'thunigalai thuvaiyungal.'], ['இங்கே வாருங்கள்.', 'inge vaarungal.'], ['உட்காருங்களேன்.', 'utkaarungalen.'],
      ['தேநீர் சாப்பிடுங்கள்.', 'theneer saappidungal.'], ['எனக்கு உதவுங்கள்.', 'enakku udhavungal.'], ['வேறு ஏதாவது?', 'veru edhaavadhu?']
    ] },
    festivals: { name: 'பண்டிகைகள் மற்றும் வாழ்த்துகள்', items: [
      ['இனிய தீபாவளி நல்வாழ்த்துகள்!', 'iniya Deepaavali nalvaazhthugal!'], ['ஈத் முபாரக்!', 'Eid mubaarak!'],
      ['இனிய ஹோலி வாழ்த்துகள்!', 'iniya Holi vaazhthugal!'], ['கிறிஸ்துமஸ் வாழ்த்துகள்!', 'Christmas vaazhthugal!'],
      ['புத்தாண்டு வாழ்த்துகள்!', 'puthaandu vaazhthugal!'], ['இனிய பொங்கல் நல்வாழ்த்துகள்!', 'iniya Pongal nalvaazhthugal!'],
      ['சுதந்திர தின வாழ்த்துகள்!', 'sudhandhira dhina vaazhthugal!'], ['பிறந்தநாள் வாழ்த்துகள்!', 'pirandhanaal vaazhthugal!'],
      ['வாழ்த்துகள்!', 'vaazhthugal!'], ['நல்வாழ்த்துகள்!', 'nalvaazhthugal!'],
      ['பண்டிகைக்கு எங்கள் வீட்டுக்கு வாருங்கள்.', 'pandigaikku engal veettukku vaarungal.'], ['இனிப்பு சாப்பிடுங்கள்.', 'inippu saappidungal.']
    ] },
    weather: { name: 'வானிலை மற்றும் இயற்கை', items: [
      ['வானிலை எப்படி இருக்கிறது?', 'vaanilai eppadi irukkiradhu?'], ['மழை பெய்கிறது.', 'mazhai peigiradhu.'], ['மிகவும் வெயிலாக இருக்கிறது.', 'migavum veyilaaga irukkiradhu.'],
      ['குளிராக இருக்கிறது.', 'kuliraaga irukkiradhu.'], ['குடை எடுத்துச் செல்லுங்கள்.', 'kudai eduthu sellungal.'], ['சூரியன்', 'sooriyan'],
      ['நிலா', 'nilaa'], ['காற்று', 'kaatru'], ['மரம்', 'maram'], ['ஆறு', 'aaru']
    ] },
    emergency: { name: 'அவசர நிலை', items: [
      ['உதவி!', 'udhavi!'], ['போலீசைக் கூப்பிடுங்கள்!', 'policeai kooppidungal!'], ['ஆம்புலன்ஸ் கூப்பிடுங்கள்!', 'ambulance kooppidungal!'],
      ['சீக்கிரம் டாக்டரைக் கூப்பிடுங்கள்!', 'seekkiram doctorai kooppidungal!'], ['தீ!', 'thee!'],
      ['ஒரு விபத்து நடந்துவிட்டது.', 'oru vibathu nadandhuvittadhu.'], ['என் பை தொலைந்துவிட்டது.', 'en pai tholaindhuvittadhu.'],
      ['நான் வழி தவறிவிட்டேன்.', 'naan vazhi thavarivitten.'], ['கவனம்!', 'kavanam!'], ['எல்லாம் சரியா?', 'ellaam sariyaa?'],
      ['நில்லுங்கள்!', 'nillungal!'], ['112-க்கு போன் செய்யுங்கள்.', '112-kku phone seiyungal.']
    ] }
  } },
  te: { topics: {
    greetings: { name: 'పలకరింపులు', items: [
      ['నమస్కారం', 'namaskaaram'], ['శుభోదయం', 'shubhodayam'], ['శుభ రాత్రి', 'shubha raatri'], ['మీరు ఎలా ఉన్నారు?', 'meeru elaa unnaaru?'],
      ['నేను బాగున్నాను, ధన్యవాదాలు.', 'nenu baagunnaanu, dhanyavaadaalu.'], ['మీరు?', 'meeru?'],
      ['మిమ్మల్ని కలవడం సంతోషం.', 'mimmalni kalavadam santosham.'], ['స్వాగతం!', 'swaagatam!'], ['సరే, మళ్ళీ కలుద్దాం.', 'sare, malli kaluddaam.'],
      ['రేపు కలుద్దాం.', 'repu kaluddaam.'], ['జాగ్రత్తగా ఉండండి.', 'jaagrathagaa undandi.'],
      ['చాలా రోజుల తర్వాత కలిశాం!', 'chaalaa rojula tarvaata kalishaam!']
    ] },
    basics: { name: 'అవును, కాదు, దయచేసి, ధన్యవాదాలు', items: [
      ['అవును', 'avunu'], ['కాదు', 'kaadu'], ['దయచేసి', 'dayachesi'], ['ధన్యవాదాలు', 'dhanyavaadaalu'],
      ['చాలా ధన్యవాదాలు', 'chaalaa dhanyavaadaalu'], ['పర్వాలేదు.', 'parvaaledu.'], ['క్షమించండి', 'kshaminchandi'],
      ['ఏ సమస్యా లేదు.', 'e samasyaa ledu.'], ['సరే', 'sare'], ['తప్పకుండా', 'thappakundaa'], ['బహుశా', 'bahushaa'],
      ['నాకు తెలియదు.', 'naaku teliyadu.']
    ] },
    intro: { name: 'నా గురించి', items: [
      ['మీ పేరు ఏమిటి?', 'mee peru emiti?'], ['నా పేరు రియా.', 'naa peru Riya.'], ['మీరు ఎక్కడి నుంచి వచ్చారు?', 'meeru ekkadi nunchi vachchaaru?'],
      ['నేను ఢిల్లీ నుంచి వచ్చాను.', 'nenu Delhi nunchi vachchaanu.'], ['నేను ముంబైలో ఉంటాను.', 'nenu Mumbailo untaanu.'],
      ['నేను విద్యార్థి.', 'nenu vidyaarthi.'], ['నేను ఉపాధ్యాయుడు.', 'nenu upaadhyaayudu.'], ['మీ వయసు ఎంత?', 'mee vayasu enta?'],
      ['నా వయసు ఇరవై ఐదు.', 'naa vayasu iravai aidu.'], ['ఇతను నా స్నేహితుడు.', 'itanu naa snehitudu.']
    ] },
    smalltalk: { name: 'చిన్న మాటలు', items: [
      ['అంతా ఎలా ఉంది?', 'antaa elaa undi?'], ['అంతా బాగుంది.', 'antaa baagundi.'], ['మీరు ఏం చేస్తున్నారు?', 'meeru em chestunnaaru?'],
      ['పెద్దగా ఏమీ లేదు.', 'peddagaa emee ledu.'], ['ఇంట్లో అందరూ ఎలా ఉన్నారు?', 'intlo andaroo elaa unnaaru?'],
      ['అందరూ బాగున్నారు.', 'andaroo baagunnaaru.'], ['ఏం కొత్త విషయాలు?', 'em kotta vishayaalu?'], ['భోజనం చేశారా?', 'bhojanam cheshaaraa?'],
      ['ఈరోజు వాతావరణం బాగుంది.', 'eeroju vaataavaranam baagundi.'], ['పదండి!', 'padandi!']
    ] },
    feelings: { name: 'భావాలు', items: [
      ['నేను సంతోషంగా ఉన్నాను.', 'nenu santoshangaa unnaanu.'], ['నేను బాధగా ఉన్నాను.', 'nenu baadhagaa unnaanu.'],
      ['నేను అలసిపోయాను.', 'nenu alasipoyaanu.'], ['నాకు ఆకలిగా ఉంది.', 'naaku aakaligaa undi.'], ['నాకు దాహంగా ఉంది.', 'naaku daahangaa undi.'],
      ['నాకు కోపం వస్తోంది.', 'naaku kopam vastondi.'], ['నాకు భయంగా ఉంది.', 'naaku bhayangaa undi.'],
      ['నాకు విసుగ్గా ఉంది.', 'naaku visuggaa undi.'], ['నాకు ఇది ఇష్టం.', 'naaku idi ishtam.'], ['నాకు ఇది ఇష్టం లేదు.', 'naaku idi ishtam ledu.']
    ] },
    questions: { name: 'ప్రశ్న పదాలు', items: [
      ['ఏమిటి?', 'emiti?'], ['ఎవరు?', 'evaru?'], ['ఎక్కడ?', 'ekkada?'], ['ఎప్పుడు?', 'eppudu?'], ['ఎందుకు?', 'enduku?'], ['ఎలా?', 'elaa?'],
      ['ఎంత? / ఎన్ని?', 'enta? / enni?'], ['ఏది?', 'edi?'], ['ఇది ఏమిటి?', 'idi emiti?'], ['బాత్రూమ్ ఎక్కడ ఉంది?', 'bathroom ekkada undi?']
    ] },
    verbs: { name: 'రోజువారీ పనులు', items: [
      ['రండి.', 'randi.'], ['వెళ్ళండి.', 'vellandi.'], ['కూర్చోండి.', 'koorchondi.'], ['లేచి నిలబడండి.', 'lechi nilabadandi.'],
      ['తినండి.', 'tinandi.'], ['తాగండి.', 'taagandi.'], ['ఇవ్వండి.', 'ivvandi.'], ['తీసుకోండి.', 'teesukondi.'], ['చూడండి.', 'choodandi.'],
      ['వినండి.', 'vinandi.'], ['నాకు చెప్పండి.', 'naaku cheppandi.'], ['ఒక్క నిమిషం ఆగండి.', 'okka nimisham aagandi.']
    ] },
    opposites: { name: 'వ్యతిరేక పదాలు', items: [
      ['పెద్ద / చిన్న', 'pedda / chinna'], ['వేడి / చల్లని', 'vedi / challani'], ['మంచి / చెడ్డ', 'manchi / chedda'],
      ['కొత్త / పాత', 'kotta / paata'], ['దగ్గర / దూరం', 'daggara / dooram'], ['వేగం / నెమ్మది', 'vegam / nemmadi'],
      ['తెరిచి / మూసి', 'terichi / moosi'], ['చౌక / ఖరీదు', 'chauka / khareedu'], ['శుభ్రం / మురికి', 'shubhram / muriki'],
      ['సులభం / కష్టం', 'sulabham / kashtam'], ['ఎక్కువ / తక్కువ', 'ekkuva / takkuva'], ['కుడి / ఎడమ', 'kudi / edama']
    ] },
    numbers: { name: 'అంకెలు', items: [
      ['సున్నా', 'sunnaa'], ['ఒకటి', 'okati'], ['రెండు', 'rendu'], ['మూడు', 'moodu'], ['నాలుగు', 'naalugu'], ['ఐదు', 'aidu'], ['ఆరు', 'aaru'],
      ['ఏడు', 'edu'], ['ఎనిమిది', 'enimidi'], ['తొమ్మిది', 'tommidi'], ['పది', 'padi'], ['పదకొండు', 'padakondu'], ['పన్నెండు', 'pannendu'],
      ['పదమూడు', 'padamoodu'], ['పద్నాలుగు', 'padnaalugu'], ['పదిహేను', 'padihenu'], ['పదహారు', 'padahaaru'], ['పదిహేడు', 'padihedu'],
      ['పద్దెనిమిది', 'paddenimidi'], ['పందొమ్మిది', 'pandommidi'], ['ఇరవై', 'iravai'], ['ముప్పై', 'muppai'], ['నలభై', 'nalabhai'],
      ['యాభై', 'yaabhai'], ['అరవై', 'aravai'], ['డెబ్బై', 'debbai'], ['ఎనభై', 'enabhai'], ['తొంభై', 'tombhai'], ['వంద', 'vanda'],
      ['వెయ్యి', 'veyyi'], ['ఒక లక్ష', 'oka laksha'], ['ఒక కోటి', 'oka koti']
    ] },
    quantities: { name: 'పరిమాణాలు', items: [
      ['కొంచెం', 'konchem'], ['చాలా', 'chaalaa'], ['సగం', 'sagam'], ['ఒకటిన్నర', 'okatinnara'], ['పావు', 'paavu'], ['ఒక కిలో', 'oka kilo'],
      ['అర కిలో', 'ara kilo'], ['ఒక లీటర్', 'oka litre'], ['ఒక డజను', 'oka dajanu'], ['చాలు', 'chaalu']
    ] },
    days: { name: 'రోజులు', items: [
      ['సోమవారం', 'somavaaram'], ['మంగళవారం', 'mangalavaaram'], ['బుధవారం', 'budhavaaram'], ['గురువారం', 'guruvaaram'],
      ['శుక్రవారం', 'shukravaaram'], ['శనివారం', 'shanivaaram'], ['ఆదివారం', 'aadivaaram'], ['ఈరోజు', 'eeroju'], ['రేపు', 'repu'], ['నిన్న', 'ninna']
    ] },
    time: { name: 'సమయం', items: [
      ['టైమ్ ఎంత?', 'time enta?'], ['ఐదు గంటలు.', 'aidu gantalu.'], ['ఐదున్నర', 'aidunnara'], ['ఉదయం', 'udayam'], ['మధ్యాహ్నం', 'madhyaahnam'],
      ['సాయంత్రం', 'saayantram'], ['రాత్రి', 'raatri'], ['ఇప్పుడు', 'ippudu'], ['తర్వాత', 'tarvaata'], ['త్వరగా', 'tvaragaa'],
      ['ఆలస్యం', 'aalasyam'], ['ఒక గంట', 'oka ganta']
    ] },
    calendar: { name: 'వారం, నెల, సంవత్సరం', items: [
      ['వారం', 'vaaram'], ['నెల', 'nela'], ['సంవత్సరం', 'samvatsaram'], ['ఈ వారం', 'ee vaaram'], ['వచ్చే నెల', 'vachche nela'],
      ['పోయిన సంవత్సరం', 'poyina samvatsaram'], ['ఈరోజు తేదీ ఏమిటి?', 'eeroju tedee emiti?'], ['సెలవు', 'selavu'], ['పుట్టినరోజు', 'puttinaroju'],
      ['వారాంతం', 'vaaraantam']
    ] },
    family: { name: 'కుటుంబం', items: [
      ['అమ్మ', 'amma'], ['నాన్న', 'naanna'], ['అన్నయ్య', 'annayya'], ['అక్క', 'akka'], ['తమ్ముడు', 'tammudu'], ['చెల్లి', 'chelli'],
      ['కొడుకు', 'koduku'], ['కూతురు', 'kooturu'], ['భర్త', 'bharta'], ['భార్య', 'bhaarya'], ['తాతయ్య', 'taatayya'],
      ['అమ్మమ్మ / నానమ్మ', 'ammamma / naanamma']
    ] },
    people: { name: 'మనుషులు', items: [
      ['స్నేహితుడు', 'snehitudu'], ['పొరుగువారు', 'poruguvaaru'], ['అతిథి', 'atithi'], ['పిల్లవాడు', 'pillavaadu'], ['పిల్లలు', 'pillalu'],
      ['అబ్బాయి', 'abbaayi'], ['అమ్మాయి', 'ammaayi'], ['మగవాడు', 'magavaadu'], ['స్త్రీ', 'stree'], ['అందరూ', 'andaroo']
    ] },
    colours: { name: 'రంగులు', items: [
      ['ఎరుపు', 'erupu'], ['నీలం', 'neelam'], ['ఆకుపచ్చ', 'aakupachcha'], ['పసుపు', 'pasupu'], ['తెలుపు', 'telupu'], ['నలుపు', 'nalupu'],
      ['నారింజ', 'naarinja'], ['గులాబీ', 'gulaabee'], ['గోధుమ రంగు', 'godhuma rangu'], ['ఊదా', 'oodaa']
    ] },
    food: { name: 'ఆహారం', items: [
      ['నీళ్ళు', 'neellu'], ['టీ', 'tea'], ['పాలు', 'paalu'], ['అన్నం', 'annam'], ['రొట్టె / చపాతీ', 'rotte / chapaatee'], ['పప్పు', 'pappu'],
      ['కూరగాయలు', 'kooragaayalu'], ['పండు', 'pandu'], ['పంచదార', 'panchadaara'], ['ఉప్పు', 'uppu'], ['పెరుగు', 'perugu'], ['గుడ్డు', 'guddu']
    ] },
    restaurant: { name: 'రెస్టారెంట్‌లో', items: [
      ['దయచేసి మెనూ చూపించండి.', 'dayachesi menu choopinchandi.'], ['ఇక్కడ ఏది బాగుంటుంది?', 'ikkada edi baaguntundi?'],
      ['నేను శాకాహారి.', 'nenu shaakaahaari.'], ['ఒక ప్లేట్ అన్నం ఇవ్వండి.', 'oka plate annam ivvandi.'],
      ['ఒక కప్పు టీ ఇవ్వండి.', 'oka kappu tea ivvandi.'], ['కారం తక్కువ వేయండి.', 'kaaram takkuva veyandi.'],
      ['కొంచెం నీళ్ళు ఇవ్వండి.', 'konchem neellu ivvandi.'], ['బిల్ తీసుకురండి.', 'bill teesukurandi.'],
      ['చాలా రుచిగా ఉంది!', 'chaalaa ruchigaa undi!'], ['ఇది కారంగా ఉంటుందా?', 'idi kaarangaa untundaa?']
    ] },
    taste: { name: 'రుచి మరియు వంట', items: [
      ['కారం', 'kaaram'], ['తీపి', 'teepi'], ['ఉప్పగా', 'uppagaa'], ['పులుపు', 'pulupu'], ['చేదు', 'chedu'], ['రుచికరం', 'ruchikaram'],
      ['వేడివేడిగా, తాజాగా', 'vedivedigaa, taajaagaa'], ['చల్లగా', 'challagaa'], ['నూనె తక్కువ వేయండి.', 'noone takkuva veyandi.'],
      ['ఉల్లి వెల్లుల్లి వేయకండి.', 'ulli vellulli veyakandi.']
    ] },
    market: { name: 'మార్కెట్ మరియు బేరం', items: [
      ['ఇది ఎంత?', 'idi enta?'], ['చాలా ఖరీదు.', 'chaalaa khareedu.'], ['కొంచెం తగ్గించండి.', 'konchem thagginchandi.'],
      ['చివరి ధర ఎంత?', 'chivari dhara enta?'], ['నేను ఇది తీసుకుంటాను.', 'nenu idi teesukuntaanu.'], ['నాకు వద్దు.', 'naaku vaddu.'],
      ['దీని కన్నా పెద్దది ఉందా?', 'deeni kannaa peddadi undaa?'], ['ఒక కిలో ఇవ్వండి.', 'oka kilo ivvandi.'],
      ['ఇది తాజాగా ఉందా?', 'idi taajaagaa undaa?'], ['ఒక సంచి ఇవ్వండి.', 'oka sanchi ivvandi.'], ['చిల్లర ఉందా?', 'chillara undaa?'],
      ['తూకం వేసి ఇవ్వండి.', 'thookam vesi ivvandi.']
    ] },
    shopping: { name: 'బట్టలు మరియు షాపింగ్', items: [
      ['చొక్కా', 'chokkaa'], ['ప్యాంటు', 'pyaantu'], ['చీర', 'cheera'], ['కుర్తా', 'kurta'], ['బూట్లు', 'bootlu'],
      ['నేను ఇది వేసుకుని చూడవచ్చా?', 'nenu idi vesukuni choodavachchaa?'], ['వేరే రంగు ఉందా?', 'vere rangu undaa?'],
      ['ఇది చాలా పెద్దది.', 'idi chaalaa peddadi.'], ['ఇది చాలా చిన్నది.', 'idi chaalaa chinnadi.'],
      ['నేను దీన్ని తిరిగి ఇవ్వాలి.', 'nenu deenni tirigi ivvaali.']
    ] },
    money: { name: 'డబ్బు మరియు చెల్లింపు', items: [
      ['డబ్బు', 'dabbu'], ['రూపాయలు', 'roopaayalu'], ['చిల్లర', 'chillara'], ['నగదు', 'nagadu'],
      ['UPI ద్వారా చెల్లించవచ్చా?', 'UPI dvaaraa chellinchavachchaa?'], ['రసీదు ఇవ్వండి.', 'raseedu ivvandi.'], ['మొత్తం ఎంత?', 'mottam enta?'],
      ['ఇది ఖరీదు.', 'idi khareedu.'], ['ఇది చౌక.', 'idi chauka.'], ['నా దగ్గర చిల్లర లేదు.', 'naa daggara chillara ledu.']
    ] },
    auto: { name: 'ఆటో మరియు టాక్సీ', items: [
      ['ఆటో! / టాక్సీ!', 'auto! / taxi!'], ['స్టేషన్‌కు వస్తారా?', 'stationku vastaaraa?'], ['స్టేషన్‌కు ఎంత?', 'stationku enta?'],
      ['మీటర్ వేయండి.', 'meter veyandi.'], ['ఇక్కడ ఆపండి.', 'ikkada aapandi.'], ['నేరుగా వెళ్ళండి.', 'nerugaa vellandi.'],
      ['ఎడమకు తిరగండి.', 'edamaku tiragandi.'], ['కుడికి తిరగండి.', 'kudiki tiragandi.'], ['నెమ్మదిగా నడపండి.', 'nemmadigaa nadapandi.'],
      ['ఇక్కడ వేచి ఉండండి.', 'ikkada vechi undandi.']
    ] },
    transport: { name: 'బస్సు మరియు రైలు', items: [
      ['బస్ స్టాప్ ఎక్కడ?', 'bus stop ekkada?'], ['మార్కెట్‌కు ఏ బస్సు వెళ్తుంది?', 'marketku e bussu veltundi?'],
      ['ఈ రైలు చెన్నైకి వెళ్తుందా?', 'ee railu Chennaiki veltundaa?'], ['ఒక టికెట్ ఇవ్వండి.', 'oka ticket ivvandi.'],
      ['పుణెకు రెండు టికెట్లు ఇవ్వండి.', 'Puneku rendu ticketlu ivvandi.'],
      ['రైలు ఎన్ని గంటలకు బయలుదేరుతుంది?', 'railu enni gantalaku bayaluderutundi?'], ['ఏ ప్లాట్‌ఫారం?', 'e platform?'],
      ['ఈ సీటు ఖాళీగా ఉందా?', 'ee seatu khaaleegaa undaa?'], ['నేను ఎక్కడ దిగాలి?', 'nenu ekkada digaali?'],
      ['బస్సు ఆలస్యంగా వస్తోంది.', 'bussu aalasyangaa vastondi.']
    ] },
    directions: { name: 'దారి', items: [
      ['ఇది ఎక్కడ ఉంది?', 'idi ekkada undi?'], ['నేరుగా ముందుకు', 'nerugaa munduku'], ['ఎడమ', 'edama'], ['కుడి', 'kudi'], ['దగ్గర', 'daggara'],
      ['దూరం', 'dooram'], ['బ్యాంకు పక్కన', 'banku pakkana'], ['గుడికి ఎదురుగా', 'gudiki edurugaa'], ['ఎంత దూరం?', 'enta dooram?'],
      ['నడిచి వెళ్ళవచ్చా?', 'nadichi vellavachchaa?']
    ] },
    places: { name: 'ఊరిలో స్థలాలు', items: [
      ['ఆసుపత్రి', 'aasupatri'], ['బ్యాంకు', 'banku'], ['ATM', 'ATM'], ['పోస్ట్ ఆఫీస్', 'post office'], ['పోలీస్ స్టేషన్', 'police station'],
      ['రైల్వే స్టేషన్', 'railway station'], ['బస్ స్టాండ్', 'bus stand'], ['మార్కెట్', 'market'], ['పాఠశాల', 'paathashaala'], ['గుడి', 'gudi'],
      ['మసీదు', 'maseedu'], ['చర్చి', 'church']
    ] },
    doctor: { name: 'డాక్టర్ మరియు ఆరోగ్యం', items: [
      ['నాకు ఒంట్లో బాగోలేదు.', 'naaku ontlo baagoledu.'], ['నాకు జ్వరం ఉంది.', 'naaku jvaram undi.'],
      ['నాకు తలనొప్పి ఉంది.', 'naaku talanoppi undi.'], ['నాకు కడుపు నొప్పి.', 'naaku kadupu noppi.'],
      ['నాకు దగ్గు, జలుబు ఉన్నాయి.', 'naaku daggu, jalubu unnaayi.'], ['నాకు తల తిరుగుతోంది.', 'naaku tala tirugutondi.'],
      ['నిన్నటి నుంచి.', 'ninnati nunchi.'], ['నాకు డాక్టర్ కావాలి.', 'naaku doctor kaavaali.'], ['ఎక్కడ నొప్పిగా ఉంది?', 'ekkada noppigaa undi?'],
      ['ఇక్కడ నొప్పిగా ఉంది.', 'ikkada noppigaa undi.'], ['నాకు హై బీపీ ఉంది.', 'naaku high BP undi.'], ['త్వరగా కోలుకోండి!', 'tvaragaa kolukondi!']
    ] },
    pharmacy: { name: 'మందుల దుకాణం', items: [
      ['మందు', 'mandu'], ['నాకు ఈ మందు కావాలి.', 'naaku ee mandu kaavaali.'], ['జ్వరానికి మందు ఉందా?', 'jvaraaniki mandu undaa?'],
      ['రోజుకు ఎన్ని సార్లు?', 'rojuku enni saarlu?'], ['భోజనానికి ముందా తర్వాతా?', 'bhojanaaniki mundaa tarvaataa?'],
      ['రోజుకు రెండు సార్లు, భోజనం తర్వాత.', 'rojuku rendu saarlu, bhojanam tarvaata.'], ['టాబ్లెట్ / సిరప్', 'tablet / syrup'], ['కట్టు', 'kattu'],
      ['సైడ్ ఎఫెక్ట్స్ ఉన్నాయా?', 'side effects unnaayaa?'], ['నొప్పి మందు ఇవ్వండి.', 'noppi mandu ivvandi.']
    ] },
    bank: { name: 'బ్యాంకు మరియు పోస్ట్ ఆఫీస్', items: [
      ['నేను ఖాతా తెరవాలి.', 'nenu khaataa teravaali.'], ['ఈ ఫారం నింపండి.', 'ee form nimpandi.'], ['నేను డబ్బు తీయాలి.', 'nenu dabbu teeyaali.'],
      ['నేను డబ్బు జమ చేయాలి.', 'nenu dabbu jama cheyaali.'], ['ఖాతా నంబర్', 'khaataa number'], ['ఇక్కడ సంతకం చేయండి.', 'ikkada santakam cheyandi.'],
      ['పాస్‌బుక్', 'passbook'], ['నేను పార్సెల్ పంపాలి.', 'nenu parcel pampaali.'], ['స్టాంపు', 'stampu'], ['లైను ఎక్కడ?', 'lainu ekkada?']
    ] },
    office: { name: 'ఆఫీసు మరియు పని', items: [
      ['నమస్కారం సర్ / మేడమ్.', 'namaskaaram sir / madam.'], ['మీటింగ్', 'meeting'],
      ['నేను కొంచెం ఆలస్యంగా వస్తాను.', 'nenu konchem aalasyangaa vastaanu.'], ['నాకు ఫైల్ పంపండి.', 'naaku file pampandi.'],
      ['నేను పని పూర్తి చేశాను.', 'nenu pani poorti cheshaanu.'], ['దీన్ని చెక్ చేయండి.', 'deenni check cheyandi.'],
      ['సెలవు (పనికి)', 'selavu (paniki)'], ['నాకు రేపు సెలవు కావాలి.', 'naaku repu selavu kaavaali.'],
      ['చాలా బాగా చేశారు!', 'chaalaa baagaa cheshaaru!'], ['రేపు మాట్లాడుకుందాం.', 'repu maatlaadukundaam.']
    ] },
    phone: { name: 'ఫోన్ మరియు ఇంటర్నెట్', items: [
      ['ఫోన్', 'phone'], ['మీ ఫోన్ నంబర్ ఏమిటి?', 'mee phone number emiti?'], ['నాకు ఫోన్ చేయండి.', 'naaku phone cheyandi.'],
      ['నేను తర్వాత ఫోన్ చేస్తాను.', 'nenu tarvaata phone chestaanu.'], ['మీ మాట వినిపించట్లేదు.', 'mee maata vinipinchatledu.'],
      ['గట్టిగా మాట్లాడండి.', 'gattigaa maatlaadandi.'], ['WhatsAppలో మెసేజ్ పంపండి.', 'WhatsApplo message pampandi.'],
      ['ఇక్కడ Wi-Fi ఉందా?', 'ikkada Wi-Fi undaa?'], ['ఫోన్ ఛార్జ్ పెట్టండి.', 'phone charge pettandi.'], ['ఒక ఫోటో తీయండి.', 'oka photo teeyandi.']
    ] },
    school: { name: 'పాఠశాల మరియు తరగతి', items: [
      ['ఉపాధ్యాయుడు', 'upaadhyaayudu'], ['విద్యార్థి', 'vidyaarthi'], ['పుస్తకం', 'pustakam'], ['నోట్‌బుక్', 'notebook'], ['పెన్ను', 'pennu'],
      ['తరగతి', 'taragati'], ['హోమ్‌వర్క్', 'homework'], ['పరీక్ష', 'pareeksha'], ['పుస్తకాలు తెరవండి.', 'pustakaalu teravandi.'],
      ['ఏమైనా ప్రశ్నలు?', 'emainaa prashnalu?'], ['నాకు అర్థమైంది.', 'naaku arthamaindi.'], ['మళ్ళీ వివరించండి.', 'malli vivarinchandi.']
    ] },
    learning: { name: 'భాష నేర్చుకోవడం', items: [
      ['మీరు ఇంగ్లీష్ మాట్లాడతారా?', 'meeru English maatlaadataaraa?'], ['నేను కొంచెం మాట్లాడతాను.', 'nenu konchem maatlaadataanu.'],
      ['నేను మీ భాష నేర్చుకుంటున్నాను.', 'nenu mee bhaasha nerchukuntunnaanu.'], ['దీన్ని ఎలా అంటారు?', 'deenni elaa antaaru?'],
      ['దీని అర్థం ఏమిటి?', 'deeni artham emiti?'], ['నెమ్మదిగా మాట్లాడండి.', 'nemmadigaa maatlaadandi.'], ['మళ్ళీ చెప్పండి.', 'malli cheppandi.'],
      ['నాకు అర్థమవుతోంది.', 'naaku arthamavutondi.'], ['నాకు అర్థం కాలేదు.', 'naaku artham kaaledu.'], ['రాసి ఇవ్వండి.', 'raasi ivvandi.'],
      ['ఇది సరైనదా?', 'idi sarainadaa?'], ['నాకు నేర్పించండి.', 'naaku nerpinchandi.']
    ] },
    home: { name: 'ఇల్లు మరియు గదులు', items: [
      ['ఇల్లు', 'illu'], ['గది', 'gadi'], ['వంటగది', 'vantagadi'], ['బాత్రూమ్', 'bathroom'], ['తలుపు', 'talupu'], ['కిటికీ', 'kitikee'],
      ['తాళం చెవి', 'taalam chevi'], ['మంచం', 'mancham'], ['కుర్చీ', 'kurchee'], ['బల్ల', 'balla'], ['లైటు', 'laitu'], ['ఫ్యాను', 'fyaanu']
    ] },
    routine: { name: 'రోజువారీ దినచర్య', items: [
      ['నేను ఆరు గంటలకు లేస్తాను.', 'nenu aaru gantalaku lestaanu.'], ['నేను పళ్ళు తోముకుంటాను.', 'nenu pallu tomukuntaanu.'],
      ['నేను స్నానం చేస్తాను.', 'nenu snaanam chestaanu.'], ['నేను టిఫిన్ తింటాను.', 'nenu tiffin tintaanu.'],
      ['నేను పనికి వెళ్తాను.', 'nenu paniki veltaanu.'], ['నేను సాయంత్రం ఇంటికి వస్తాను.', 'nenu saayantram intiki vastaanu.'],
      ['నేను రాత్రి భోజనం వండుతాను.', 'nenu raatri bhojanam vandutaanu.'], ['నేను TV చూస్తాను.', 'nenu TV choostaanu.'],
      ['నేను పది గంటలకు పడుకుంటాను.', 'nenu padi gantalaku padukuntaanu.'], ['మీరు ఎన్ని గంటలకు లేస్తారు?', 'meeru enni gantalaku lestaaru?']
    ] },
    kitchen: { name: 'వంటగది మరియు వంట', items: [
      ['పళ్ళెం', 'pallem'], ['గ్లాసు', 'glaasu'], ['చెంచా', 'chenchaa'], ['కత్తి', 'katti'], ['గిన్నె', 'ginne'], ['పొయ్యి', 'poyyi'],
      ['కూరగాయలు కోయండి.', 'kooragaayalu koyandi.'], ['నీళ్ళు మరిగించండి.', 'neellu mariginchandi.'], ['గిన్నెలు కడగండి.', 'ginnelu kadagandi.'],
      ['ఉప్పు వేయండి.', 'uppu veyandi.'], ['రుచి చూడండి.', 'ruchi choodandi.'], ['భోజనం సిద్ధం!', 'bhojanam siddham!']
    ] },
    household: { name: 'ఇంటి పనులు', items: [
      ['నీళ్ళు తీసుకురండి.', 'neellu teesukurandi.'], ['తలుపు వేయండి.', 'talupu veyandi.'], ['కిటికీ తెరవండి.', 'kitikee teravandi.'],
      ['లైటు వేయండి.', 'laitu veyandi.'], ['ఫ్యాను ఆపండి.', 'fan aapandi.'], ['గది శుభ్రం చేయండి.', 'gadi shubhram cheyandi.'],
      ['బట్టలు ఉతకండి.', 'battalu utakandi.'], ['ఇక్కడికి రండి.', 'ikkadiki randi.'], ['కూర్చోండి.', 'koorchondi.'],
      ['టీ తీసుకోండి.', 'tea teesukondi.'], ['నాకు సహాయం చేయండి.', 'naaku sahaayam cheyandi.'], ['ఇంకేమైనా?', 'inkemainaa?']
    ] },
    festivals: { name: 'పండుగలు మరియు శుభాకాంక్షలు', items: [
      ['దీపావళి శుభాకాంక్షలు!', 'Deepaavali shubhaakaankshalu!'], ['ఈద్ ముబారక్!', 'Eid mubaarak!'],
      ['హోలీ శుభాకాంక్షలు!', 'Holi shubhaakaankshalu!'], ['క్రిస్మస్ శుభాకాంక్షలు!', 'Christmas shubhaakaankshalu!'],
      ['నూతన సంవత్సర శుభాకాంక్షలు!', 'nootana samvatsara shubhaakaankshalu!'], ['సంక్రాంతి శుభాకాంక్షలు!', 'Sankraanti shubhaakaankshalu!'],
      ['స్వాతంత్ర్య దినోత్సవ శుభాకాంక్షలు!', 'swaatantrya dinotsava shubhaakaankshalu!'],
      ['పుట్టినరోజు శుభాకాంక్షలు!', 'puttinaroju shubhaakaankshalu!'], ['అభినందనలు!', 'abhinandanalu!'], ['శుభాకాంక్షలు!', 'shubhaakaankshalu!'],
      ['పండుగకు మా ఇంటికి రండి.', 'pandugaku maa intiki randi.'], ['స్వీట్ తీసుకోండి.', 'sweet teesukondi.']
    ] },
    weather: { name: 'వాతావరణం మరియు ప్రకృతి', items: [
      ['వాతావరణం ఎలా ఉంది?', 'vaataavaranam elaa undi?'], ['వర్షం పడుతోంది.', 'varsham padutondi.'], ['చాలా వేడిగా ఉంది.', 'chaalaa vedigaa undi.'],
      ['చలిగా ఉంది.', 'chaligaa undi.'], ['గొడుగు తీసుకెళ్ళండి.', 'godugu teesukellandi.'], ['సూర్యుడు', 'sooryudu'], ['చంద్రుడు', 'chandrudu'],
      ['గాలి', 'gaali'], ['చెట్టు', 'chettu'], ['నది', 'nadi']
    ] },
    emergency: { name: 'అత్యవసర పరిస్థితి', items: [
      ['సహాయం!', 'sahaayam!'], ['పోలీసులను పిలవండి!', 'poleesulanu pilavandi!'], ['అంబులెన్స్ పిలవండి!', 'ambulance pilavandi!'],
      ['త్వరగా డాక్టర్‌ను పిలవండి!', 'tvaragaa doctornu pilavandi!'], ['మంటలు!', 'mantalu!'], ['ఒక ప్రమాదం జరిగింది.', 'oka pramaadam jarigindi.'],
      ['నా బ్యాగ్ పోయింది.', 'naa bag poyindi.'], ['నేను దారి తప్పిపోయాను.', 'nenu daari tappipoyaanu.'], ['జాగ్రత్త!', 'jaagratta!'],
      ['అంతా బాగుందా?', 'antaa baagundaa?'], ['ఆగండి!', 'aagandi!'], ['112కు ఫోన్ చేయండి.', '112ku phone cheyandi.']
    ] }
  } },
  kn: { topics: {
    greetings: { name: 'ಶುಭಾಶಯಗಳು', items: [
      ['ನಮಸ್ಕಾರ', 'namaskaara'], ['ಶುಭೋದಯ', 'shubhodaya'], ['ಶುಭ ರಾತ್ರಿ', 'shubha raatri'], ['ನೀವು ಹೇಗಿದ್ದೀರಿ?', 'neevu hegiddeeri?'],
      ['ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ, ಧನ್ಯವಾದ.', 'naanu chennaagiddene, dhanyavaada.'], ['ನೀವು?', 'neevu?'],
      ['ನಿಮ್ಮನ್ನು ಭೇಟಿಯಾಗಿ ಸಂತೋಷವಾಯಿತು.', 'nimmannu bhetiyaagi santoshavaayitu.'], ['ಸ್ವಾಗತ!', 'swaagata!'],
      ['ಸರಿ, ಮತ್ತೆ ಸಿಗೋಣ.', 'sari, matte sigona.'], ['ನಾಳೆ ಸಿಗೋಣ.', 'naale sigona.'], ['ಹುಷಾರಾಗಿರಿ.', 'hushaaraagiri.'],
      ['ತುಂಬಾ ದಿನಗಳ ನಂತರ ಸಿಕ್ಕಿದ್ದೀರಿ!', 'tumbaa dinagala nantara sikkiddeeri!']
    ] },
    basics: { name: 'ಹೌದು, ಇಲ್ಲ, ದಯವಿಟ್ಟು, ಧನ್ಯವಾದ', items: [
      ['ಹೌದು', 'haudu'], ['ಇಲ್ಲ', 'illa'], ['ದಯವಿಟ್ಟು', 'dayavittu'], ['ಧನ್ಯವಾದ', 'dhanyavaada'], ['ತುಂಬಾ ಧನ್ಯವಾದಗಳು', 'tumbaa dhanyavaadagalu'],
      ['ಪರವಾಗಿಲ್ಲ.', 'paravaagilla.'], ['ಕ್ಷಮಿಸಿ', 'kshamisi'], ['ಯಾವುದೇ ಸಮಸ್ಯೆ ಇಲ್ಲ.', 'yaavude samasye illa.'], ['ಸರಿ', 'sari'],
      ['ಖಂಡಿತ', 'khandita'], ['ಬಹುಶಃ', 'bahushaha'], ['ನನಗೆ ಗೊತ್ತಿಲ್ಲ.', 'nanage gottilla.']
    ] },
    intro: { name: 'ನನ್ನ ಬಗ್ಗೆ', items: [
      ['ನಿಮ್ಮ ಹೆಸರೇನು?', 'nimma hesarenu?'], ['ನನ್ನ ಹೆಸರು ರಿಯಾ.', 'nanna hesaru Riya.'], ['ನೀವು ಎಲ್ಲಿಂದ ಬಂದಿದ್ದೀರಿ?', 'neevu ellinda bandiddeeri?'],
      ['ನಾನು ದೆಹಲಿಯಿಂದ ಬಂದಿದ್ದೇನೆ.', 'naanu Dehaliyinda bandiddene.'], ['ನಾನು ಮುಂಬೈನಲ್ಲಿ ಇರುತ್ತೇನೆ.', 'naanu Mumbainalli iruttene.'],
      ['ನಾನು ವಿದ್ಯಾರ್ಥಿ.', 'naanu vidyaarthi.'], ['ನಾನು ಶಿಕ್ಷಕ.', 'naanu shikshaka.'], ['ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?', 'nimma vayassu eshtu?'],
      ['ನನಗೆ ಇಪ್ಪತ್ತೈದು ವರ್ಷ.', 'nanage ippattaidu varsha.'], ['ಇವರು ನನ್ನ ಸ್ನೇಹಿತ.', 'ivaru nanna snehita.']
    ] },
    smalltalk: { name: 'ಸಣ್ಣ ಮಾತುಕತೆ', items: [
      ['ಎಲ್ಲಾ ಹೇಗೆ ನಡೆಯುತ್ತಿದೆ?', 'ellaa hege nadeyuttide?'], ['ಎಲ್ಲಾ ಚೆನ್ನಾಗಿದೆ.', 'ellaa chennaagide.'],
      ['ನೀವು ಏನು ಮಾಡುತ್ತಿದ್ದೀರಿ?', 'neevu enu maaduttiddeeri?'], ['ವಿಶೇಷ ಏನೂ ಇಲ್ಲ.', 'vishesha enoo illa.'],
      ['ಮನೆಯಲ್ಲಿ ಎಲ್ಲರೂ ಹೇಗಿದ್ದಾರೆ?', 'maneyalli ellaroo hegiddaare?'], ['ಎಲ್ಲರೂ ಚೆನ್ನಾಗಿದ್ದಾರೆ.', 'ellaroo chennaagiddaare.'],
      ['ಏನು ಹೊಸ ವಿಷಯ?', 'enu hosa vishaya?'], ['ಊಟ ಆಯಿತಾ?', 'oota aayitaa?'], ['ಇಂದು ಹವಾಮಾನ ಚೆನ್ನಾಗಿದೆ.', 'indu havaamaana chennaagide.'],
      ['ಹೋಗೋಣ!', 'hogona!']
    ] },
    feelings: { name: 'ಭಾವನೆಗಳು', items: [
      ['ನಾನು ಸಂತೋಷವಾಗಿದ್ದೇನೆ.', 'naanu santoshavaagiddene.'], ['ನನಗೆ ಬೇಜಾರಾಗಿದೆ.', 'nanage bejaaraagide.'],
      ['ನನಗೆ ಸುಸ್ತಾಗಿದೆ.', 'nanage sustaagide.'], ['ನನಗೆ ಹಸಿವಾಗಿದೆ.', 'nanage hasivaagide.'], ['ನನಗೆ ಬಾಯಾರಿಕೆಯಾಗಿದೆ.', 'nanage baayaarikeyaagide.'],
      ['ನನಗೆ ಕೋಪ ಬರುತ್ತಿದೆ.', 'nanage kopa baruttide.'], ['ನನಗೆ ಭಯವಾಗುತ್ತಿದೆ.', 'nanage bhayavaaguttide.'],
      ['ನನಗೆ ಬೇಸರವಾಗಿದೆ.', 'nanage besaravaagide.'], ['ನನಗೆ ಇದು ಇಷ್ಟ.', 'nanage idu ishta.'], ['ನನಗೆ ಇದು ಇಷ್ಟವಿಲ್ಲ.', 'nanage idu ishtavilla.']
    ] },
    questions: { name: 'ಪ್ರಶ್ನೆ ಪದಗಳು', items: [
      ['ಏನು?', 'enu?'], ['ಯಾರು?', 'yaaru?'], ['ಎಲ್ಲಿ?', 'elli?'], ['ಯಾವಾಗ?', 'yaavaaga?'], ['ಯಾಕೆ?', 'yaake?'], ['ಹೇಗೆ?', 'hege?'],
      ['ಎಷ್ಟು?', 'eshtu?'], ['ಯಾವುದು?', 'yaavudu?'], ['ಇದು ಏನು?', 'idu enu?'], ['ಶೌಚಾಲಯ ಎಲ್ಲಿದೆ?', 'shauchaalaya ellide?']
    ] },
    verbs: { name: 'ದಿನನಿತ್ಯದ ಕ್ರಿಯೆಗಳು', items: [
      ['ಬನ್ನಿ.', 'banni.'], ['ಹೋಗಿ.', 'hogi.'], ['ಕುಳಿತುಕೊಳ್ಳಿ.', 'kulitukolli.'], ['ಎದ್ದು ನಿಲ್ಲಿ.', 'eddu nilli.'], ['ತಿನ್ನಿ.', 'tinni.'],
      ['ಕುಡಿಯಿರಿ.', 'kudiyiri.'], ['ಕೊಡಿ.', 'kodi.'], ['ತೆಗೆದುಕೊಳ್ಳಿ.', 'tegedukolli.'], ['ನೋಡಿ.', 'nodi.'], ['ಕೇಳಿ.', 'keli.'],
      ['ನನಗೆ ಹೇಳಿ.', 'nanage heli.'], ['ಒಂದು ನಿಮಿಷ ಕಾಯಿರಿ.', 'ondu nimisha kaayiri.']
    ] },
    opposites: { name: 'ವಿರುದ್ಧ ಪದಗಳು', items: [
      ['ದೊಡ್ಡ / ಚಿಕ್ಕ', 'dodda / chikka'], ['ಬಿಸಿ / ತಣ್ಣನೆ', 'bisi / tannane'], ['ಒಳ್ಳೆಯ / ಕೆಟ್ಟ', 'olleya / ketta'],
      ['ಹೊಸ / ಹಳೆಯ', 'hosa / haleya'], ['ಹತ್ತಿರ / ದೂರ', 'hattira / doora'], ['ವೇಗ / ನಿಧಾನ', 'vega / nidhaana'],
      ['ತೆರೆದ / ಮುಚ್ಚಿದ', 'tereda / muchchida'], ['ಅಗ್ಗ / ದುಬಾರಿ', 'agga / dubaari'], ['ಸ್ವಚ್ಛ / ಕೊಳಕು', 'swachchha / kolaku'],
      ['ಸುಲಭ / ಕಷ್ಟ', 'sulabha / kashta'], ['ಹೆಚ್ಚು / ಕಡಿಮೆ', 'hechchu / kadime'], ['ಬಲ / ಎಡ', 'bala / eda']
    ] },
    numbers: { name: 'ಸಂಖ್ಯೆಗಳು', items: [
      ['ಸೊನ್ನೆ', 'sonne'], ['ಒಂದು', 'ondu'], ['ಎರಡು', 'eradu'], ['ಮೂರು', 'mooru'], ['ನಾಲ್ಕು', 'naalku'], ['ಐದು', 'aidu'], ['ಆರು', 'aaru'],
      ['ಏಳು', 'elu'], ['ಎಂಟು', 'entu'], ['ಒಂಬತ್ತು', 'ombattu'], ['ಹತ್ತು', 'hattu'], ['ಹನ್ನೊಂದು', 'hannondu'], ['ಹನ್ನೆರಡು', 'hanneradu'],
      ['ಹದಿಮೂರು', 'hadimooru'], ['ಹದಿನಾಲ್ಕು', 'hadinaalku'], ['ಹದಿನೈದು', 'hadinaidu'], ['ಹದಿನಾರು', 'hadinaaru'], ['ಹದಿನೇಳು', 'hadinelu'],
      ['ಹದಿನೆಂಟು', 'hadinentu'], ['ಹತ್ತೊಂಬತ್ತು', 'hattombattu'], ['ಇಪ್ಪತ್ತು', 'ippattu'], ['ಮೂವತ್ತು', 'moovattu'], ['ನಲವತ್ತು', 'nalavattu'],
      ['ಐವತ್ತು', 'aivattu'], ['ಅರವತ್ತು', 'aravattu'], ['ಎಪ್ಪತ್ತು', 'eppattu'], ['ಎಂಬತ್ತು', 'embattu'], ['ತೊಂಬತ್ತು', 'tombattu'], ['ನೂರು', 'nooru'],
      ['ಸಾವಿರ', 'saavira'], ['ಒಂದು ಲಕ್ಷ', 'ondu laksha'], ['ಒಂದು ಕೋಟಿ', 'ondu koti']
    ] },
    quantities: { name: 'ಪ್ರಮಾಣ ಮತ್ತು ಅಳತೆ', items: [
      ['ಸ್ವಲ್ಪ', 'swalpa'], ['ತುಂಬಾ', 'tumbaa'], ['ಅರ್ಧ', 'ardha'], ['ಒಂದೂವರೆ', 'ondoovare'], ['ಕಾಲು', 'kaalu'], ['ಒಂದು ಕಿಲೋ', 'ondu kilo'],
      ['ಅರ್ಧ ಕಿಲೋ', 'ardha kilo'], ['ಒಂದು ಲೀಟರ್', 'ondu litre'], ['ಒಂದು ಡಜನ್', 'ondu dozen'], ['ಸಾಕು', 'saaku']
    ] },
    days: { name: 'ದಿನಗಳು', items: [
      ['ಸೋಮವಾರ', 'somavaara'], ['ಮಂಗಳವಾರ', 'mangalavaara'], ['ಬುಧವಾರ', 'budhavaara'], ['ಗುರುವಾರ', 'guruvaara'], ['ಶುಕ್ರವಾರ', 'shukravaara'],
      ['ಶನಿವಾರ', 'shanivaara'], ['ಭಾನುವಾರ', 'bhaanuvaara'], ['ಇಂದು', 'indu'], ['ನಾಳೆ', 'naale'], ['ನಿನ್ನೆ', 'ninne']
    ] },
    time: { name: 'ಸಮಯ', items: [
      ['ಈಗ ಎಷ್ಟು ಗಂಟೆ?', 'eega eshtu gante?'], ['ಐದು ಗಂಟೆ.', 'aidu gante.'], ['ಐದೂವರೆ', 'aidoovare'], ['ಬೆಳಿಗ್ಗೆ', 'beligge'],
      ['ಮಧ್ಯಾಹ್ನ', 'madhyaahna'], ['ಸಂಜೆ', 'sanje'], ['ರಾತ್ರಿ', 'raatri'], ['ಈಗ', 'eega'], ['ನಂತರ', 'nantara'], ['ಬೇಗ', 'bega'], ['ತಡ', 'tada'],
      ['ಒಂದು ಗಂಟೆ', 'ondu gante']
    ] },
    calendar: { name: 'ವಾರ, ತಿಂಗಳು, ವರ್ಷ', items: [
      ['ವಾರ', 'vaara'], ['ತಿಂಗಳು', 'tingalu'], ['ವರ್ಷ', 'varsha'], ['ಈ ವಾರ', 'ee vaara'], ['ಮುಂದಿನ ತಿಂಗಳು', 'mundina tingalu'],
      ['ಕಳೆದ ವರ್ಷ', 'kaleda varsha'], ['ಇಂದು ಯಾವ ದಿನಾಂಕ?', 'indu yaava dinaanka?'], ['ರಜೆ', 'raje'], ['ಹುಟ್ಟುಹಬ್ಬ', 'huttuhabba'],
      ['ವಾರಾಂತ್ಯ', 'vaaraantya']
    ] },
    family: { name: 'ಕುಟುಂಬ', items: [
      ['ಅಮ್ಮ', 'amma'], ['ಅಪ್ಪ', 'appa'], ['ಅಣ್ಣ', 'anna'], ['ಅಕ್ಕ', 'akka'], ['ತಮ್ಮ', 'tamma'], ['ತಂಗಿ', 'tangi'], ['ಮಗ', 'maga'],
      ['ಮಗಳು', 'magalu'], ['ಗಂಡ', 'ganda'], ['ಹೆಂಡತಿ', 'hendati'], ['ತಾತ', 'taata'], ['ಅಜ್ಜಿ', 'ajji']
    ] },
    people: { name: 'ಜನರು', items: [
      ['ಸ್ನೇಹಿತ', 'snehita'], ['ನೆರೆಹೊರೆಯವರು', 'nerehoreyavaru'], ['ಅತಿಥಿ', 'atithi'], ['ಮಗು', 'magu'], ['ಮಕ್ಕಳು', 'makkalu'], ['ಹುಡುಗ', 'huduga'],
      ['ಹುಡುಗಿ', 'hudugi'], ['ಗಂಡಸು', 'gandasu'], ['ಹೆಂಗಸು', 'hengasu'], ['ಎಲ್ಲರೂ', 'ellaroo']
    ] },
    colours: { name: 'ಬಣ್ಣಗಳು', items: [
      ['ಕೆಂಪು', 'kempu'], ['ನೀಲಿ', 'neeli'], ['ಹಸಿರು', 'hasiru'], ['ಹಳದಿ', 'haladi'], ['ಬಿಳಿ', 'bili'], ['ಕಪ್ಪು', 'kappu'], ['ಕಿತ್ತಳೆ', 'kittale'],
      ['ಗುಲಾಬಿ', 'gulaabi'], ['ಕಂದು', 'kandu'], ['ನೇರಳೆ', 'nerale']
    ] },
    food: { name: 'ಆಹಾರ', items: [
      ['ನೀರು', 'neeru'], ['ಚಹಾ', 'chaha'], ['ಹಾಲು', 'haalu'], ['ಅನ್ನ', 'anna'], ['ರೊಟ್ಟಿ / ಚಪಾತಿ', 'rotti / chapaati'], ['ಬೇಳೆ', 'bele'],
      ['ತರಕಾರಿ', 'tarakaari'], ['ಹಣ್ಣು', 'hannu'], ['ಸಕ್ಕರೆ', 'sakkare'], ['ಉಪ್ಪು', 'uppu'], ['ಮೊಸರು', 'mosaru'], ['ಮೊಟ್ಟೆ', 'motte']
    ] },
    restaurant: { name: 'ಹೋಟೆಲ್‌ನಲ್ಲಿ', items: [
      ['ದಯವಿಟ್ಟು ಮೆನು ತೋರಿಸಿ.', 'dayavittu menu torisi.'], ['ಇಲ್ಲಿ ಯಾವುದು ಚೆನ್ನಾಗಿದೆ?', 'illi yaavudu chennaagide?'],
      ['ನಾನು ಸಸ್ಯಾಹಾರಿ.', 'naanu sasyaahaari.'], ['ಒಂದು ಪ್ಲೇಟ್ ಅನ್ನ ಕೊಡಿ.', 'ondu plate anna kodi.'], ['ಒಂದು ಕಪ್ ಚಹಾ ಕೊಡಿ.', 'ondu cup chaha kodi.'],
      ['ಖಾರ ಕಡಿಮೆ ಮಾಡಿ.', 'khaara kadime maadi.'], ['ಸ್ವಲ್ಪ ನೀರು ಕೊಡಿ.', 'swalpa neeru kodi.'], ['ಬಿಲ್ ತನ್ನಿ.', 'bill tanni.'],
      ['ತುಂಬಾ ರುಚಿಯಾಗಿತ್ತು!', 'tumbaa ruchiyaagittu!'], ['ಇದು ಖಾರವೇ?', 'idu khaarave?']
    ] },
    taste: { name: 'ರುಚಿ ಮತ್ತು ಅಡುಗೆ', items: [
      ['ಖಾರ', 'khaara'], ['ಸಿಹಿ', 'sihi'], ['ಉಪ್ಪಾಗಿದೆ', 'uppaagide'], ['ಹುಳಿ', 'huli'], ['ಕಹಿ', 'kahi'], ['ರುಚಿಯಾದ', 'ruchiyaada'],
      ['ಬಿಸಿ ಬಿಸಿ, ತಾಜಾ', 'bisi bisi, taaja'], ['ತಣ್ಣನೆ', 'tannane'], ['ಎಣ್ಣೆ ಕಡಿಮೆ ಹಾಕಿ.', 'enne kadime haaki.'],
      ['ಈರುಳ್ಳಿ ಬೆಳ್ಳುಳ್ಳಿ ಹಾಕಬೇಡಿ.', 'eerulli bellulli haakabedi.']
    ] },
    market: { name: 'ಮಾರುಕಟ್ಟೆ ಮತ್ತು ಚೌಕಾಸಿ', items: [
      ['ಇದು ಎಷ್ಟು?', 'idu eshtu?'], ['ತುಂಬಾ ದುಬಾರಿ.', 'tumbaa dubaari.'], ['ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡಿ.', 'swalpa kadime maadi.'],
      ['ಕೊನೆಯ ಬೆಲೆ ಎಷ್ಟು?', 'koneya bele eshtu?'], ['ನಾನು ಇದನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತೇನೆ.', 'naanu idannu tegedukolluttene.'],
      ['ನನಗೆ ಬೇಡ.', 'nanage beda.'], ['ಇದಕ್ಕಿಂತ ದೊಡ್ಡದು ಇದೆಯಾ?', 'idakkinta doddadu ideyaa?'], ['ಒಂದು ಕಿಲೋ ಕೊಡಿ.', 'ondu kilo kodi.'],
      ['ಇದು ತಾಜಾ ಇದೆಯಾ?', 'idu taaja ideyaa?'], ['ಒಂದು ಚೀಲ ಕೊಡಿ.', 'ondu cheela kodi.'], ['ಚಿಲ್ಲರೆ ಇದೆಯಾ?', 'chillare ideyaa?'],
      ['ತೂಕ ಮಾಡಿ ಕೊಡಿ.', 'tooka maadi kodi.']
    ] },
    shopping: { name: 'ಬಟ್ಟೆ ಮತ್ತು ಶಾಪಿಂಗ್', items: [
      ['ಅಂಗಿ', 'angi'], ['ಪ್ಯಾಂಟ್', 'pant'], ['ಸೀರೆ', 'seere'], ['ಕುರ್ತಾ', 'kurta'], ['ಬೂಟು', 'bootu'],
      ['ನಾನು ಇದನ್ನು ಹಾಕಿ ನೋಡಬಹುದಾ?', 'naanu idannu haaki nodabahudaa?'], ['ಬೇರೆ ಬಣ್ಣ ಇದೆಯಾ?', 'bere banna ideyaa?'],
      ['ಇದು ತುಂಬಾ ದೊಡ್ಡದು.', 'idu tumbaa doddadu.'], ['ಇದು ತುಂಬಾ ಚಿಕ್ಕದು.', 'idu tumbaa chikkadu.'],
      ['ನಾನು ಇದನ್ನು ಹಿಂತಿರುಗಿಸಬೇಕು.', 'naanu idannu hintirugisabeku.']
    ] },
    money: { name: 'ಹಣ ಮತ್ತು ಪಾವತಿ', items: [
      ['ಹಣ', 'hana'], ['ರೂಪಾಯಿ', 'roopaayi'], ['ಚಿಲ್ಲರೆ', 'chillare'], ['ನಗದು', 'nagadu'], ['UPI ಮೂಲಕ ಕೊಡಬಹುದಾ?', 'UPI moolaka kodabahudaa?'],
      ['ರಸೀದಿ ಕೊಡಿ.', 'raseedi kodi.'], ['ಒಟ್ಟು ಎಷ್ಟು?', 'ottu eshtu?'], ['ಇದು ದುಬಾರಿ.', 'idu dubaari.'], ['ಇದು ಅಗ್ಗ.', 'idu agga.'],
      ['ನನ್ನ ಬಳಿ ಚಿಲ್ಲರೆ ಇಲ್ಲ.', 'nanna bali chillare illa.']
    ] },
    auto: { name: 'ಆಟೋ ಮತ್ತು ಟ್ಯಾಕ್ಸಿ', items: [
      ['ಆಟೋ! / ಟ್ಯಾಕ್ಸಿ!', 'auto! / taxi!'], ['ಸ್ಟೇಷನ್‌ಗೆ ಬರುತ್ತೀರಾ?', 'stationge barutteeraa?'], ['ಸ್ಟೇಷನ್‌ಗೆ ಎಷ್ಟು?', 'stationge eshtu?'],
      ['ಮೀಟರ್ ಹಾಕಿ.', 'meter haaki.'], ['ಇಲ್ಲಿ ನಿಲ್ಲಿಸಿ.', 'illi nillisi.'], ['ನೇರವಾಗಿ ಹೋಗಿ.', 'neravaagi hogi.'],
      ['ಎಡಕ್ಕೆ ತಿರುಗಿ.', 'edakke tirugi.'], ['ಬಲಕ್ಕೆ ತಿರುಗಿ.', 'balakke tirugi.'], ['ನಿಧಾನವಾಗಿ ಓಡಿಸಿ.', 'nidhaanavaagi odisi.'],
      ['ಇಲ್ಲಿ ಕಾಯಿರಿ.', 'illi kaayiri.']
    ] },
    transport: { name: 'ಬಸ್ ಮತ್ತು ರೈಲು', items: [
      ['ಬಸ್ ಸ್ಟಾಪ್ ಎಲ್ಲಿದೆ?', 'bus stop ellide?'], ['ಮಾರ್ಕೆಟ್‌ಗೆ ಯಾವ ಬಸ್ ಹೋಗುತ್ತದೆ?', 'marketge yaava bus hoguttade?'],
      ['ಈ ರೈಲು ಚೆನ್ನೈಗೆ ಹೋಗುತ್ತದೆಯೇ?', 'ee railu Chennaige hoguttadeye?'], ['ಒಂದು ಟಿಕೆಟ್ ಕೊಡಿ.', 'ondu ticket kodi.'],
      ['ಪುಣೆಗೆ ಎರಡು ಟಿಕೆಟ್ ಕೊಡಿ.', 'Punege eradu ticket kodi.'], ['ರೈಲು ಎಷ್ಟು ಗಂಟೆಗೆ ಹೊರಡುತ್ತದೆ?', 'railu eshtu gantege horaduttade?'],
      ['ಯಾವ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್?', 'yaava platform?'], ['ಈ ಸೀಟು ಖಾಲಿ ಇದೆಯಾ?', 'ee seetu khaali ideyaa?'],
      ['ನಾನು ಎಲ್ಲಿ ಇಳಿಯಬೇಕು?', 'naanu elli iliyabeku?'], ['ಬಸ್ ತಡವಾಗಿದೆ.', 'bus tadavaagide.']
    ] },
    directions: { name: 'ದಾರಿ', items: [
      ['ಇದು ಎಲ್ಲಿದೆ?', 'idu ellide?'], ['ನೇರವಾಗಿ ಮುಂದೆ', 'neravaagi munde'], ['ಎಡ', 'eda'], ['ಬಲ', 'bala'], ['ಹತ್ತಿರ', 'hattira'], ['ದೂರ', 'doora'],
      ['ಬ್ಯಾಂಕ್ ಪಕ್ಕದಲ್ಲಿ', 'bank pakkadalli'], ['ದೇವಸ್ಥಾನದ ಎದುರು', 'devasthaanada eduru'], ['ಎಷ್ಟು ದೂರ?', 'eshtu doora?'],
      ['ನಡೆದು ಹೋಗಬಹುದಾ?', 'nadedu hogabahudaa?']
    ] },
    places: { name: 'ಊರಿನ ಸ್ಥಳಗಳು', items: [
      ['ಆಸ್ಪತ್ರೆ', 'aaspatre'], ['ಬ್ಯಾಂಕ್', 'bank'], ['ATM', 'ATM'], ['ಪೋಸ್ಟ್ ಆಫೀಸ್', 'post office'], ['ಪೊಲೀಸ್ ಠಾಣೆ', 'police thaane'],
      ['ರೈಲು ನಿಲ್ದಾಣ', 'railu nildaana'], ['ಬಸ್ ನಿಲ್ದಾಣ', 'bus nildaana'], ['ಮಾರುಕಟ್ಟೆ', 'maarukatte'], ['ಶಾಲೆ', 'shaale'],
      ['ದೇವಸ್ಥಾನ', 'devasthaana'], ['ಮಸೀದಿ', 'maseedi'], ['ಚರ್ಚ್', 'church']
    ] },
    doctor: { name: 'ವೈದ್ಯರು ಮತ್ತು ಆರೋಗ್ಯ', items: [
      ['ನನಗೆ ಹುಷಾರಿಲ್ಲ.', 'nanage hushaarilla.'], ['ನನಗೆ ಜ್ವರ ಬಂದಿದೆ.', 'nanage jvara bandide.'], ['ನನಗೆ ತಲೆನೋವು.', 'nanage talenovu.'],
      ['ನನಗೆ ಹೊಟ್ಟೆ ನೋವು.', 'nanage hotte novu.'], ['ನನಗೆ ಕೆಮ್ಮು ಮತ್ತು ನೆಗಡಿ.', 'nanage kemmu mattu negadi.'],
      ['ನನಗೆ ತಲೆ ಸುತ್ತುತ್ತಿದೆ.', 'nanage tale suttuttide.'], ['ನಿನ್ನೆಯಿಂದ.', 'ninneyinda.'], ['ನನಗೆ ಡಾಕ್ಟರ್ ಬೇಕು.', 'nanage doctor beku.'],
      ['ಎಲ್ಲಿ ನೋವಾಗುತ್ತಿದೆ?', 'elli novaaguttide?'], ['ಇಲ್ಲಿ ನೋವಾಗುತ್ತಿದೆ.', 'illi novaaguttide.'], ['ನನಗೆ ಹೈ ಬಿಪಿ ಇದೆ.', 'nanage high BP ide.'],
      ['ಬೇಗ ಗುಣಮುಖರಾಗಿ!', 'bega gunamukharaagi!']
    ] },
    pharmacy: { name: 'ಔಷಧಿ ಅಂಗಡಿ', items: [
      ['ಔಷಧಿ', 'aushadhi'], ['ನನಗೆ ಈ ಔಷಧಿ ಬೇಕು.', 'nanage ee aushadhi beku.'], ['ಜ್ವರಕ್ಕೆ ಔಷಧಿ ಇದೆಯಾ?', 'jvarakke aushadhi ideyaa?'],
      ['ದಿನಕ್ಕೆ ಎಷ್ಟು ಬಾರಿ?', 'dinakke eshtu baari?'], ['ಊಟದ ಮೊದಲು ಅಥವಾ ನಂತರ?', 'ootada modalu athavaa nantara?'],
      ['ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ, ಊಟದ ನಂತರ.', 'dinakke eradu baari, ootada nantara.'], ['ಮಾತ್ರೆ / ಸಿರಪ್', 'maatre / syrup'], ['ಬ್ಯಾಂಡೇಜ್', 'bandage'],
      ['ಅಡ್ಡ ಪರಿಣಾಮ ಇದೆಯಾ?', 'adda parinaama ideyaa?'], ['ನೋವಿನ ಮಾತ್ರೆ ಕೊಡಿ.', 'novina maatre kodi.']
    ] },
    bank: { name: 'ಬ್ಯಾಂಕ್ ಮತ್ತು ಪೋಸ್ಟ್ ಆಫೀಸ್', items: [
      ['ನಾನು ಖಾತೆ ತೆರೆಯಬೇಕು.', 'naanu khaate tereyabeku.'], ['ಈ ಫಾರ್ಮ್ ತುಂಬಿಸಿ.', 'ee form tumbisi.'],
      ['ನಾನು ಹಣ ತೆಗೆಯಬೇಕು.', 'naanu hana tegeyabeku.'], ['ನಾನು ಹಣ ಜಮಾ ಮಾಡಬೇಕು.', 'naanu hana jamaa maadabeku.'], ['ಖಾತೆ ಸಂಖ್ಯೆ', 'khaate sankhye'],
      ['ಇಲ್ಲಿ ಸಹಿ ಮಾಡಿ.', 'illi sahi maadi.'], ['ಪಾಸ್‌ಬುಕ್', 'passbook'], ['ನಾನು ಪಾರ್ಸೆಲ್ ಕಳುಹಿಸಬೇಕು.', 'naanu parcel kaluhisabeku.'],
      ['ಅಂಚೆ ಚೀಟಿ', 'anche cheeti'], ['ಸಾಲು ಎಲ್ಲಿದೆ?', 'saalu ellide?']
    ] },
    office: { name: 'ಕಚೇರಿ ಮತ್ತು ಕೆಲಸ', items: [
      ['ನಮಸ್ಕಾರ ಸರ್ / ಮೇಡಂ.', 'namaskaara sir / madam.'], ['ಮೀಟಿಂಗ್', 'meeting'],
      ['ನಾನು ಸ್ವಲ್ಪ ತಡವಾಗಿ ಬರುತ್ತೇನೆ.', 'naanu swalpa tadavaagi baruttene.'], ['ನನಗೆ ಫೈಲ್ ಕಳುಹಿಸಿ.', 'nanage file kaluhisi.'],
      ['ನಾನು ಕೆಲಸ ಮುಗಿಸಿದ್ದೇನೆ.', 'naanu kelasa mugisiddene.'], ['ಇದನ್ನು ಪರಿಶೀಲಿಸಿ.', 'idannu parisheelisi.'],
      ['ರಜೆ (ಕೆಲಸಕ್ಕೆ)', 'raje (kelasakke)'], ['ನನಗೆ ನಾಳೆ ರಜೆ ಬೇಕು.', 'nanage naale raje beku.'], ['ಚೆನ್ನಾಗಿ ಮಾಡಿದ್ದೀರಿ!', 'chennaagi maadiddeeri!'],
      ['ನಾಳೆ ಮಾತಾಡೋಣ.', 'naale maataadona.']
    ] },
    phone: { name: 'ಫೋನ್ ಮತ್ತು ಇಂಟರ್ನೆಟ್', items: [
      ['ಫೋನ್', 'phone'], ['ನಿಮ್ಮ ಫೋನ್ ನಂಬರ್ ಏನು?', 'nimma phone number enu?'], ['ನನಗೆ ಫೋನ್ ಮಾಡಿ.', 'nanage phone maadi.'],
      ['ನಾನು ನಂತರ ಫೋನ್ ಮಾಡುತ್ತೇನೆ.', 'naanu nantara phone maaduttene.'], ['ನಿಮ್ಮ ಮಾತು ಕೇಳಿಸುತ್ತಿಲ್ಲ.', 'nimma maatu kelisuttilla.'],
      ['ಜೋರಾಗಿ ಮಾತಾಡಿ.', 'joraagi maataadi.'], ['WhatsApp ನಲ್ಲಿ ಮೆಸೇಜ್ ಮಾಡಿ.', 'WhatsApp nalli message maadi.'],
      ['ಇಲ್ಲಿ Wi-Fi ಇದೆಯಾ?', 'illi Wi-Fi ideyaa?'], ['ಫೋನ್ ಚಾರ್ಜ್ ಮಾಡಿ.', 'phone charge maadi.'], ['ಒಂದು ಫೋಟೋ ತೆಗೆಯಿರಿ.', 'ondu photo tegeyiri.']
    ] },
    school: { name: 'ಶಾಲೆ ಮತ್ತು ತರಗತಿ', items: [
      ['ಶಿಕ್ಷಕ', 'shikshaka'], ['ವಿದ್ಯಾರ್ಥಿ', 'vidyaarthi'], ['ಪುಸ್ತಕ', 'pustaka'], ['ನೋಟ್‌ಬುಕ್', 'notebook'], ['ಪೆನ್', 'pen'],
      ['ತರಗತಿ', 'taragati'], ['ಮನೆಗೆಲಸ', 'manegelasa'], ['ಪರೀಕ್ಷೆ', 'pareekshe'], ['ಪುಸ್ತಕ ತೆರೆಯಿರಿ.', 'pustaka tereyiri.'],
      ['ಏನಾದರೂ ಪ್ರಶ್ನೆ?', 'enaadaroo prashne?'], ['ನನಗೆ ಅರ್ಥವಾಯಿತು.', 'nanage arthavaayitu.'], ['ಮತ್ತೆ ವಿವರಿಸಿ.', 'matte vivarisi.']
    ] },
    learning: { name: 'ಭಾಷೆ ಕಲಿಯುವುದು', items: [
      ['ನೀವು ಇಂಗ್ಲಿಷ್ ಮಾತಾಡುತ್ತೀರಾ?', 'neevu English maataadutteeraa?'], ['ನಾನು ಸ್ವಲ್ಪ ಮಾತಾಡುತ್ತೇನೆ.', 'naanu swalpa maataaduttene.'],
      ['ನಾನು ನಿಮ್ಮ ಭಾಷೆ ಕಲಿಯುತ್ತಿದ್ದೇನೆ.', 'naanu nimma bhaashe kaliyuttiddene.'], ['ಇದನ್ನು ಹೇಗೆ ಹೇಳುತ್ತಾರೆ?', 'idannu hege heluttaare?'],
      ['ಇದರ ಅರ್ಥ ಏನು?', 'idara artha enu?'], ['ನಿಧಾನವಾಗಿ ಮಾತಾಡಿ.', 'nidhaanavaagi maataadi.'], ['ಮತ್ತೆ ಹೇಳಿ.', 'matte heli.'],
      ['ನನಗೆ ಅರ್ಥವಾಗುತ್ತದೆ.', 'nanage arthavaaguttade.'], ['ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ.', 'nanage arthavaagalilla.'], ['ಬರೆದು ಕೊಡಿ.', 'baredu kodi.'],
      ['ಇದು ಸರಿಯಾ?', 'idu sariyaa?'], ['ನನಗೆ ಕಲಿಸಿ.', 'nanage kalisi.']
    ] },
    home: { name: 'ಮನೆ ಮತ್ತು ಕೋಣೆಗಳು', items: [
      ['ಮನೆ', 'mane'], ['ಕೋಣೆ', 'kone'], ['ಅಡುಗೆಮನೆ', 'adugemane'], ['ಬಚ್ಚಲುಮನೆ', 'bachchalumane'], ['ಬಾಗಿಲು', 'baagilu'], ['ಕಿಟಕಿ', 'kitaki'],
      ['ಬೀಗದ ಕೈ', 'beegada kai'], ['ಮಂಚ', 'mancha'], ['ಕುರ್ಚಿ', 'kurchi'], ['ಮೇಜು', 'meju'], ['ದೀಪ', 'deepa'], ['ಫ್ಯಾನ್', 'fan']
    ] },
    routine: { name: 'ದಿನಚರಿ', items: [
      ['ನಾನು ಆರು ಗಂಟೆಗೆ ಏಳುತ್ತೇನೆ.', 'naanu aaru gantege eluttene.'], ['ನಾನು ಹಲ್ಲು ಉಜ್ಜುತ್ತೇನೆ.', 'naanu hallu ujjuttene.'],
      ['ನಾನು ಸ್ನಾನ ಮಾಡುತ್ತೇನೆ.', 'naanu snaana maaduttene.'], ['ನಾನು ತಿಂಡಿ ತಿನ್ನುತ್ತೇನೆ.', 'naanu tindi tinnuttene.'],
      ['ನಾನು ಕೆಲಸಕ್ಕೆ ಹೋಗುತ್ತೇನೆ.', 'naanu kelasakke hoguttene.'], ['ನಾನು ಸಂಜೆ ಮನೆಗೆ ಬರುತ್ತೇನೆ.', 'naanu sanje manege baruttene.'],
      ['ನಾನು ರಾತ್ರಿಯ ಅಡುಗೆ ಮಾಡುತ್ತೇನೆ.', 'naanu raatriya aduge maaduttene.'], ['ನಾನು TV ನೋಡುತ್ತೇನೆ.', 'naanu TV noduttene.'],
      ['ನಾನು ಹತ್ತು ಗಂಟೆಗೆ ಮಲಗುತ್ತೇನೆ.', 'naanu hattu gantege malaguttene.'], ['ನೀವು ಎಷ್ಟು ಗಂಟೆಗೆ ಏಳುತ್ತೀರಿ?', 'neevu eshtu gantege elutteeri?']
    ] },
    kitchen: { name: 'ಅಡುಗೆಮನೆ ಮತ್ತು ಅಡುಗೆ', items: [
      ['ತಟ್ಟೆ', 'tatte'], ['ಲೋಟ', 'lota'], ['ಚಮಚ', 'chamacha'], ['ಚಾಕು', 'chaaku'], ['ಪಾತ್ರೆ', 'paatre'], ['ಒಲೆ', 'ole'],
      ['ತರಕಾರಿ ಹೆಚ್ಚಿ.', 'tarakaari hechchi.'], ['ನೀರು ಕುದಿಸಿ.', 'neeru kudisi.'], ['ಪಾತ್ರೆ ತೊಳೆಯಿರಿ.', 'paatre toleyiri.'],
      ['ಉಪ್ಪು ಹಾಕಿ.', 'uppu haaki.'], ['ರುಚಿ ನೋಡಿ.', 'ruchi nodi.'], ['ಊಟ ಸಿದ್ಧ!', 'oota siddha!']
    ] },
    household: { name: 'ಮನೆ ಕೆಲಸಗಳು', items: [
      ['ನೀರು ತನ್ನಿ.', 'neeru tanni.'], ['ಬಾಗಿಲು ಮುಚ್ಚಿ.', 'baagilu muchchi.'], ['ಕಿಟಕಿ ತೆರೆಯಿರಿ.', 'kitaki tereyiri.'], ['ದೀಪ ಹಾಕಿ.', 'deepa haaki.'],
      ['ಫ್ಯಾನ್ ಆಫ್ ಮಾಡಿ.', 'fan off maadi.'], ['ಕೋಣೆ ಸ್ವಚ್ಛ ಮಾಡಿ.', 'kone swachchha maadi.'], ['ಬಟ್ಟೆ ಒಗೆಯಿರಿ.', 'batte ogeyiri.'],
      ['ಇಲ್ಲಿ ಬನ್ನಿ.', 'illi banni.'], ['ದಯವಿಟ್ಟು ಕುಳಿತುಕೊಳ್ಳಿ.', 'dayavittu kulitukolli.'], ['ಚಹಾ ತೆಗೆದುಕೊಳ್ಳಿ.', 'chaha tegedukolli.'],
      ['ನನಗೆ ಸಹಾಯ ಮಾಡಿ.', 'nanage sahaaya maadi.'], ['ಇನ್ನೇನಾದರೂ?', 'innenaadaroo?']
    ] },
    festivals: { name: 'ಹಬ್ಬಗಳು ಮತ್ತು ಶುಭಾಶಯಗಳು', items: [
      ['ದೀಪಾವಳಿ ಹಬ್ಬದ ಶುಭಾಶಯಗಳು!', 'Deepaavali habbada shubhaashayagalu!'], ['ಈದ್ ಮುಬಾರಕ್!', 'Eid mubaarak!'],
      ['ಹೋಳಿ ಹಬ್ಬದ ಶುಭಾಶಯಗಳು!', 'Holi habbada shubhaashayagalu!'], ['ಕ್ರಿಸ್‌ಮಸ್ ಶುಭಾಶಯಗಳು!', 'Christmas shubhaashayagalu!'],
      ['ಹೊಸ ವರ್ಷದ ಶುಭಾಶಯಗಳು!', 'hosa varshada shubhaashayagalu!'], ['ಸಂಕ್ರಾಂತಿ ಹಬ್ಬದ ಶುಭಾಶಯಗಳು!', 'Sankraanti habbada shubhaashayagalu!'],
      ['ಸ್ವಾತಂತ್ರ್ಯ ದಿನದ ಶುಭಾಶಯಗಳು!', 'swaatantrya dinada shubhaashayagalu!'], ['ಹುಟ್ಟುಹಬ್ಬದ ಶುಭಾಶಯಗಳು!', 'huttuhabbada shubhaashayagalu!'],
      ['ಅಭಿನಂದನೆಗಳು!', 'abhinandanegalu!'], ['ಶುಭಾಶಯಗಳು!', 'shubhaashayagalu!'], ['ಹಬ್ಬಕ್ಕೆ ನಮ್ಮ ಮನೆಗೆ ಬನ್ನಿ.', 'habbakke namma manege banni.'],
      ['ಸಿಹಿ ತೆಗೆದುಕೊಳ್ಳಿ.', 'sihi tegedukolli.']
    ] },
    weather: { name: 'ಹವಾಮಾನ ಮತ್ತು ಪ್ರಕೃತಿ', items: [
      ['ಹವಾಮಾನ ಹೇಗಿದೆ?', 'havaamaana hegide?'], ['ಮಳೆ ಬರುತ್ತಿದೆ.', 'male baruttide.'], ['ತುಂಬಾ ಬಿಸಿಲು.', 'tumbaa bisilu.'],
      ['ಚಳಿ ಇದೆ.', 'chali ide.'], ['ಕೊಡೆ ತೆಗೆದುಕೊಂಡು ಹೋಗಿ.', 'kode tegedukondu hogi.'], ['ಸೂರ್ಯ', 'soorya'], ['ಚಂದ್ರ', 'chandra'], ['ಗಾಳಿ', 'gaali'],
      ['ಮರ', 'mara'], ['ನದಿ', 'nadi']
    ] },
    emergency: { name: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿ', items: [
      ['ಸಹಾಯ!', 'sahaaya!'], ['ಪೊಲೀಸರನ್ನು ಕರೆಯಿರಿ!', 'poleesarannu kareyiri!'], ['ಆಂಬ್ಯುಲೆನ್ಸ್ ಕರೆಯಿರಿ!', 'ambulance kareyiri!'],
      ['ಬೇಗ ಡಾಕ್ಟರನ್ನು ಕರೆಯಿರಿ!', 'bega doctarannu kareyiri!'], ['ಬೆಂಕಿ!', 'benki!'], ['ಅಪಘಾತ ಆಗಿದೆ.', 'apaghaata aagide.'],
      ['ನನ್ನ ಬ್ಯಾಗ್ ಕಳೆದುಹೋಗಿದೆ.', 'nanna bag kaleduhogide.'], ['ನಾನು ದಾರಿ ತಪ್ಪಿದ್ದೇನೆ.', 'naanu daari tappiddene.'], ['ಹುಷಾರ್!', 'hushaar!'],
      ['ಎಲ್ಲಾ ಸರಿಯಾಗಿದೆಯಾ?', 'ellaa sariyaagideyaa?'], ['ನಿಲ್ಲಿ!', 'nilli!'], ['112 ಗೆ ಫೋನ್ ಮಾಡಿ.', '112 ge phone maadi.']
    ] }
  } },
  ml: { topics: {
    greetings: { name: 'അഭിവാദ്യങ്ങൾ', items: [
      ['നമസ്കാരം', 'namaskaaram'], ['സുപ്രഭാതം', 'suprabhaatham'], ['ശുഭരാത്രി', 'shubharaathri'], ['സുഖമാണോ?', 'sukhamaano?'],
      ['എനിക്ക് സുഖമാണ്, നന്ദി.', 'enikku sukhamaanu, nandi.'], ['നിങ്ങൾക്ക്?', 'ningalkku?'],
      ['നിങ്ങളെ കണ്ടതിൽ സന്തോഷം.', 'ningale kandathil santhosham.'], ['സ്വാഗതം!', 'swaagatham!'], ['ശരി, പിന്നെ കാണാം.', 'shari, pinne kaanaam.'],
      ['നാളെ കാണാം.', 'naale kaanaam.'], ['ശ്രദ്ധിക്കണേ.', 'shraddhikkane.'], ['കുറേ നാളായി കണ്ടിട്ട്!', 'kure naalaayi kandittu!']
    ] },
    basics: { name: 'അതെ, ഇല്ല, ദയവായി, നന്ദി', items: [
      ['അതെ', 'athe'], ['ഇല്ല', 'illa'], ['ദയവായി', 'dayavaayi'], ['നന്ദി', 'nandi'], ['വളരെ നന്ദി', 'valare nandi'], ['സാരമില്ല.', 'saaramilla.'],
      ['ക്ഷമിക്കണം', 'kshamikkanam'], ['ഒരു പ്രശ്നവുമില്ല.', 'oru prashnavumilla.'], ['ശരി', 'shari'], ['തീർച്ചയായും', 'theerchayaayum'],
      ['ആയിരിക്കാം', 'aayirikkaam'], ['എനിക്കറിയില്ല.', 'enikkariyilla.']
    ] },
    intro: { name: 'എന്നെക്കുറിച്ച്', items: [
      ['നിങ്ങളുടെ പേരെന്താണ്?', 'ningalude perenthaanu?'], ['എന്റെ പേര് റിയ.', 'ente peru Riya.'],
      ['നിങ്ങൾ എവിടെ നിന്നാണ്?', 'ningal evide ninnaanu?'], ['ഞാൻ ഡൽഹിയിൽ നിന്നാണ്.', 'njaan Delhiyil ninnaanu.'],
      ['ഞാൻ മുംബൈയിൽ താമസിക്കുന്നു.', 'njaan Mumbaiyil thaamasikkunnu.'], ['ഞാൻ ഒരു വിദ്യാർത്ഥിയാണ്.', 'njaan oru vidyaarthiyaanu.'],
      ['ഞാൻ ഒരു അധ്യാപകനാണ്.', 'njaan oru adhyaapakanaanu.'], ['നിങ്ങൾക്ക് എത്ര വയസ്സായി?', 'ningalkku ethra vayassaayi?'],
      ['എനിക്ക് ഇരുപത്തഞ്ച് വയസ്സ്.', 'enikku irupathanchu vayassu.'], ['ഇത് എന്റെ സുഹൃത്താണ്.', 'ithu ente suhruthaanu.']
    ] },
    smalltalk: { name: 'വിശേഷങ്ങൾ', items: [
      ['എല്ലാം എങ്ങനെ പോകുന്നു?', 'ellaam engane pokunnu?'], ['എല്ലാം നന്നായി പോകുന്നു.', 'ellaam nannaayi pokunnu.'],
      ['എന്താണ് ചെയ്യുന്നത്?', 'enthaanu cheyyunnathu?'], ['പ്രത്യേകിച്ച് ഒന്നുമില്ല.', 'prathyekichu onnumilla.'],
      ['വീട്ടിൽ എല്ലാവർക്കും സുഖമാണോ?', 'veettil ellaavarkkum sukhamaano?'], ['എല്ലാവർക്കും സുഖമാണ്.', 'ellaavarkkum sukhamaanu.'],
      ['എന്താ വിശേഷം?', 'enthaa vishesham?'], ['ഭക്ഷണം കഴിച്ചോ?', 'bhakshanam kazhicho?'],
      ['ഇന്ന് കാലാവസ്ഥ നല്ലതാണ്.', 'innu kaalaavastha nallathaanu.'], ['പോകാം!', 'pokaam!']
    ] },
    feelings: { name: 'വികാരങ്ങൾ', items: [
      ['എനിക്ക് സന്തോഷമാണ്.', 'enikku santhoshamaanu.'], ['എനിക്ക് സങ്കടമാണ്.', 'enikku sankadamaanu.'],
      ['ഞാൻ ക്ഷീണിതനാണ്.', 'njaan ksheenithanaanu.'], ['എനിക്ക് വിശക്കുന്നു.', 'enikku vishakkunnu.'],
      ['എനിക്ക് ദാഹിക്കുന്നു.', 'enikku daahikkunnu.'], ['എനിക്ക് ദേഷ്യം വരുന്നു.', 'enikku deshyam varunnu.'],
      ['എനിക്ക് പേടിയാകുന്നു.', 'enikku pediyaakunnu.'], ['എനിക്ക് മടുത്തു.', 'enikku maduthu.'],
      ['എനിക്ക് ഇത് ഇഷ്ടമാണ്.', 'enikku ithu ishtamaanu.'], ['എനിക്ക് ഇത് ഇഷ്ടമല്ല.', 'enikku ithu ishtamalla.']
    ] },
    questions: { name: 'ചോദ്യവാക്കുകൾ', items: [
      ['എന്ത്?', 'enthu?'], ['ആര്?', 'aaru?'], ['എവിടെ?', 'evide?'], ['എപ്പോൾ?', 'eppol?'], ['എന്തുകൊണ്ട്?', 'enthukondu?'], ['എങ്ങനെ?', 'engane?'],
      ['എത്ര?', 'ethra?'], ['ഏത്?', 'ethu?'], ['ഇത് എന്താണ്?', 'ithu enthaanu?'], ['ടോയ്‌ലറ്റ് എവിടെയാണ്?', 'toilet evideyaanu?']
    ] },
    verbs: { name: 'ദിവസേനയുള്ള പ്രവർത്തികൾ', items: [
      ['വരൂ.', 'varoo.'], ['പോകൂ.', 'pokoo.'], ['ഇരിക്കൂ.', 'irikkoo.'], ['എഴുന്നേറ്റു നിൽക്കൂ.', 'ezhunnettu nilkkoo.'], ['കഴിക്കൂ.', 'kazhikkoo.'],
      ['കുടിക്കൂ.', 'kudikkoo.'], ['തരൂ.', 'tharoo.'], ['എടുക്കൂ.', 'edukkoo.'], ['നോക്കൂ.', 'nokkoo.'], ['കേൾക്കൂ.', 'kelkkoo.'],
      ['എന്നോട് പറയൂ.', 'ennodu parayoo.'], ['ഒരു മിനിറ്റ് കാത്തിരിക്കൂ.', 'oru minute kaathirikkoo.']
    ] },
    opposites: { name: 'വിപരീത പദങ്ങൾ', items: [
      ['വലുത് / ചെറുത്', 'valuthu / cheruthu'], ['ചൂട് / തണുപ്പ്', 'choodu / thanuppu'], ['നല്ലത് / മോശം', 'nallathu / mosham'],
      ['പുതിയത് / പഴയത്', 'puthiyathu / pazhayathu'], ['അടുത്ത് / ദൂരെ', 'aduthu / doore'], ['വേഗം / പതുക്കെ', 'vegam / pathukke'],
      ['തുറന്ന / അടഞ്ഞ', 'thuranna / adanja'], ['വില കുറവ് / വില കൂടുതൽ', 'vila kuravu / vila kooduthal'], ['വൃത്തി / അഴുക്ക്', 'vruthi / azhukku'],
      ['എളുപ്പം / ബുദ്ധിമുട്ട്', 'eluppam / buddhimuttu'], ['കൂടുതൽ / കുറവ്', 'kooduthal / kuravu'], ['വലത് / ഇടത്', 'valathu / idathu']
    ] },
    numbers: { name: 'സംഖ്യകൾ', items: [
      ['പൂജ്യം', 'poojyam'], ['ഒന്ന്', 'onnu'], ['രണ്ട്', 'randu'], ['മൂന്ന്', 'moonnu'], ['നാല്', 'naalu'], ['അഞ്ച്', 'anchu'], ['ആറ്', 'aaru'],
      ['ഏഴ്', 'ezhu'], ['എട്ട്', 'ettu'], ['ഒമ്പത്', 'ombathu'], ['പത്ത്', 'pathu'], ['പതിനൊന്ന്', 'pathinonnu'], ['പന്ത്രണ്ട്', 'panthrandu'],
      ['പതിമൂന്ന്', 'pathimoonnu'], ['പതിനാല്', 'pathinaalu'], ['പതിനഞ്ച്', 'pathinanchu'], ['പതിനാറ്', 'pathinaaru'], ['പതിനേഴ്', 'pathinezhu'],
      ['പതിനെട്ട്', 'pathinettu'], ['പത്തൊമ്പത്', 'pathombathu'], ['ഇരുപത്', 'irupathu'], ['മുപ്പത്', 'muppathu'], ['നാൽപത്', 'naalpathu'],
      ['അമ്പത്', 'ambathu'], ['അറുപത്', 'arupathu'], ['എഴുപത്', 'ezhupathu'], ['എൺപത്', 'enpathu'], ['തൊണ്ണൂറ്', 'thonnooru'], ['നൂറ്', 'nooru'],
      ['ആയിരം', 'aayiram'], ['ഒരു ലക്ഷം', 'oru laksham'], ['ഒരു കോടി', 'oru kodi']
    ] },
    quantities: { name: 'അളവുകൾ', items: [
      ['കുറച്ച്', 'kurachu'], ['ഒരുപാട്', 'orupaadu'], ['പകുതി', 'pakuthi'], ['ഒന്നര', 'onnara'], ['കാൽ', 'kaal'], ['ഒരു കിലോ', 'oru kilo'],
      ['അര കിലോ', 'ara kilo'], ['ഒരു ലിറ്റർ', 'oru litre'], ['ഒരു ഡസൻ', 'oru dozen'], ['മതി', 'mathi']
    ] },
    days: { name: 'ദിവസങ്ങൾ', items: [
      ['തിങ്കൾ', 'thinkal'], ['ചൊവ്വ', 'chovva'], ['ബുധൻ', 'budhan'], ['വ്യാഴം', 'vyaazham'], ['വെള്ളി', 'velli'], ['ശനി', 'shani'],
      ['ഞായർ', 'njaayar'], ['ഇന്ന്', 'innu'], ['നാളെ', 'naale'], ['ഇന്നലെ', 'innale']
    ] },
    time: { name: 'സമയം', items: [
      ['സമയം എന്തായി?', 'samayam enthaayi?'], ['അഞ്ചു മണി.', 'anchu mani.'], ['അഞ്ചര', 'anchara'], ['രാവിലെ', 'raavile'], ['ഉച്ച', 'ucha'],
      ['വൈകുന്നേരം', 'vaikunneram'], ['രാത്രി', 'raathri'], ['ഇപ്പോൾ', 'ippol'], ['പിന്നീട്', 'pinneedu'], ['നേരത്തെ', 'nerathe'], ['വൈകി', 'vaiki'],
      ['ഒരു മണിക്കൂർ', 'oru manikkoor']
    ] },
    calendar: { name: 'ആഴ്ച, മാസം, വർഷം', items: [
      ['ആഴ്ച', 'aazhcha'], ['മാസം', 'maasam'], ['വർഷം', 'varsham'], ['ഈ ആഴ്ച', 'ee aazhcha'], ['അടുത്ത മാസം', 'adutha maasam'],
      ['കഴിഞ്ഞ വർഷം', 'kazhinja varsham'], ['ഇന്ന് എന്താണ് തീയതി?', 'innu enthaanu theeyathi?'], ['അവധി', 'avadhi'], ['പിറന്നാൾ', 'pirannaal'],
      ['വാരാന്ത്യം', 'vaaraanthyam']
    ] },
    family: { name: 'കുടുംബം', items: [
      ['അമ്മ', 'amma'], ['അച്ഛൻ', 'achchan'], ['ചേട്ടൻ', 'chettan'], ['ചേച്ചി', 'chechi'], ['അനിയൻ', 'aniyan'], ['അനിയത്തി', 'aniyathi'],
      ['മകൻ', 'makan'], ['മകൾ', 'makal'], ['ഭർത്താവ്', 'bharthaavu'], ['ഭാര്യ', 'bhaarya'], ['മുത്തച്ഛൻ', 'muthachchan'], ['മുത്തശ്ശി', 'muthashi']
    ] },
    people: { name: 'ആളുകൾ', items: [
      ['സുഹൃത്ത്', 'suhruthu'], ['അയൽക്കാരൻ', 'ayalkkaaran'], ['അതിഥി', 'athithi'], ['കുട്ടി', 'kutti'], ['കുട്ടികൾ', 'kuttikal'],
      ['ആൺകുട്ടി', 'aankutti'], ['പെൺകുട്ടി', 'penkutti'], ['പുരുഷൻ', 'purushan'], ['സ്ത്രീ', 'sthree'], ['എല്ലാവരും', 'ellaavarum']
    ] },
    colours: { name: 'നിറങ്ങൾ', items: [
      ['ചുവപ്പ്', 'chuvappu'], ['നീല', 'neela'], ['പച്ച', 'pacha'], ['മഞ്ഞ', 'manja'], ['വെള്ള', 'vella'], ['കറുപ്പ്', 'karuppu'],
      ['ഓറഞ്ച്', 'orange'], ['പിങ്ക്', 'pink'], ['തവിട്ട്', 'thavittu'], ['വയലറ്റ്', 'violet']
    ] },
    food: { name: 'ഭക്ഷണം', items: [
      ['വെള്ളം', 'vellam'], ['ചായ', 'chaaya'], ['പാൽ', 'paal'], ['ചോറ്', 'choru'], ['റൊട്ടി / ചപ്പാത്തി', 'rotti / chappaathi'],
      ['പരിപ്പ്', 'parippu'], ['പച്ചക്കറി', 'pachakkari'], ['പഴം', 'pazham'], ['പഞ്ചസാര', 'panchasaara'], ['ഉപ്പ്', 'uppu'], ['തൈര്', 'thairu'],
      ['മുട്ട', 'mutta']
    ] },
    restaurant: { name: 'ഹോട്ടലിൽ', items: [
      ['മെനു കാണിക്കാമോ?', 'menu kaanikkaamo?'], ['ഇവിടെ എന്താണ് നല്ലത്?', 'ivide enthaanu nallathu?'],
      ['ഞാൻ വെജിറ്റേറിയനാണ്.', 'njaan vegetarianaanu.'], ['ഒരു പ്ലേറ്റ് ചോറ് തരൂ.', 'oru plate choru tharoo.'],
      ['ഒരു ചായ തരൂ.', 'oru chaaya tharoo.'], ['എരിവ് കുറച്ച് മതി.', 'erivu kurachu mathi.'], ['കുറച്ച് വെള്ളം തരൂ.', 'kurachu vellam tharoo.'],
      ['ബിൽ കൊണ്ടുവരൂ.', 'bill konduvaroo.'], ['വളരെ രുചിയായിരുന്നു!', 'valare ruchiyaayirunnu!'], ['ഇതിന് എരിവുണ്ടോ?', 'ithinu erivundo?']
    ] },
    taste: { name: 'രുചിയും പാചകവും', items: [
      ['എരിവ്', 'erivu'], ['മധുരം', 'madhuram'], ['ഉപ്പുരസം', 'uppurasam'], ['പുളി', 'puli'], ['കയ്പ്', 'kaypu'], ['രുചികരം', 'ruchikaram'],
      ['ചൂടോടെ, പുതിയത്', 'choodode, puthiyathu'], ['തണുത്തത്', 'thanuthathu'], ['എണ്ണ കുറച്ച് മതി.', 'enna kurachu mathi.'],
      ['ഉള്ളിയും വെളുത്തുള്ളിയും വേണ്ട.', 'ulliyum veluthulliyum venda.']
    ] },
    market: { name: 'മാർക്കറ്റും വിലപേശലും', items: [
      ['ഇതിന് എന്താ വില?', 'ithinu enthaa vila?'], ['വില വളരെ കൂടുതലാണ്.', 'vila valare kooduthalaanu.'],
      ['കുറച്ച് കുറയ്ക്കാമോ?', 'kurachu kuraykkaamo?'], ['അവസാന വില എത്രയാണ്?', 'avasaana vila ethrayaanu?'],
      ['ഞാൻ ഇത് എടുക്കാം.', 'njaan ithu edukkaam.'], ['എനിക്ക് വേണ്ട.', 'enikku venda.'], ['ഇതിലും വലുത് ഉണ്ടോ?', 'ithilum valuthu undo?'],
      ['ഒരു കിലോ തരൂ.', 'oru kilo tharoo.'], ['ഇത് പുതിയതാണോ?', 'ithu puthiyathaano?'], ['ഒരു സഞ്ചി തരൂ.', 'oru sanchi tharoo.'],
      ['ചില്ലറ ഉണ്ടോ?', 'chillara undo?'], ['തൂക്കി തരൂ.', 'thookki tharoo.']
    ] },
    shopping: { name: 'വസ്ത്രവും ഷോപ്പിംഗും', items: [
      ['ഷർട്ട്', 'shirt'], ['പാന്റ്', 'pant'], ['സാരി', 'saari'], ['കുർത്ത', 'kurtha'], ['ഷൂസ്', 'shoes'],
      ['ഇത് ഇട്ടു നോക്കാമോ?', 'ithu ittu nokkaamo?'], ['വേറെ നിറം ഉണ്ടോ?', 'vere niram undo?'], ['ഇത് വളരെ വലുതാണ്.', 'ithu valare valuthaanu.'],
      ['ഇത് വളരെ ചെറുതാണ്.', 'ithu valare cheruthaanu.'], ['ഇത് തിരിച്ചു തരണം.', 'ithu thirichu tharanam.']
    ] },
    money: { name: 'പണവും പേയ്‌മെന്റും', items: [
      ['പണം', 'panam'], ['രൂപ', 'roopa'], ['ചില്ലറ', 'chillara'], ['ക്യാഷ്', 'cash'], ['UPI വഴി കൊടുക്കാമോ?', 'UPI vazhi kodukkaamo?'],
      ['രസീത് തരൂ.', 'raseethu tharoo.'], ['മൊത്തം എത്രയായി?', 'motham ethrayaayi?'], ['ഇത് വില കൂടുതലാണ്.', 'ithu vila kooduthalaanu.'],
      ['ഇത് വില കുറവാണ്.', 'ithu vila kuravaanu.'], ['എന്റെ കൈയിൽ ചില്ലറയില്ല.', 'ente kaiyil chillarayilla.']
    ] },
    auto: { name: 'ഓട്ടോയും ടാക്സിയും', items: [
      ['ഓട്ടോ! / ടാക്സി!', 'auto! / taxi!'], ['സ്റ്റേഷനിലേക്ക് വരുമോ?', 'stationilekku varumo?'],
      ['സ്റ്റേഷനിലേക്ക് എത്രയാകും?', 'stationilekku ethrayaakum?'], ['മീറ്റർ ഇടൂ.', 'meter idoo.'], ['ഇവിടെ നിർത്തൂ.', 'ivide nirthoo.'],
      ['നേരെ പോകൂ.', 'nere pokoo.'], ['ഇടത്തോട്ട് തിരിയൂ.', 'idathottu thiriyoo.'], ['വലത്തോട്ട് തിരിയൂ.', 'valathottu thiriyoo.'],
      ['പതുക്കെ ഓടിക്കൂ.', 'pathukke odikkoo.'], ['ഇവിടെ കാത്തുനിൽക്കൂ.', 'ivide kaathunilkkoo.']
    ] },
    transport: { name: 'ബസ്സും ട്രെയിനും', items: [
      ['ബസ് സ്റ്റോപ്പ് എവിടെയാണ്?', 'bus stop evideyaanu?'], ['മാർക്കറ്റിലേക്ക് ഏത് ബസ് പോകും?', 'marketilekku ethu bus pokum?'],
      ['ഈ ട്രെയിൻ ചെന്നൈയിലേക്ക് പോകുമോ?', 'ee train Chennaiyilekku pokumo?'], ['ഒരു ടിക്കറ്റ് തരൂ.', 'oru ticket tharoo.'],
      ['പൂനെയിലേക്ക് രണ്ട് ടിക്കറ്റ് തരൂ.', 'Puneyilekku randu ticket tharoo.'], ['ട്രെയിൻ എപ്പോൾ പുറപ്പെടും?', 'train eppol purappedum?'],
      ['ഏത് പ്ലാറ്റ്‌ഫോം?', 'ethu platform?'], ['ഈ സീറ്റ് ഒഴിവാണോ?', 'ee seat ozhivaano?'], ['ഞാൻ എവിടെ ഇറങ്ങണം?', 'njaan evide iranganam?'],
      ['ബസ് വൈകിയാണ് വരുന്നത്.', 'bus vaikiyaanu varunnathu.']
    ] },
    directions: { name: 'വഴി', items: [
      ['ഇത് എവിടെയാണ്?', 'ithu evideyaanu?'], ['നേരെ മുന്നോട്ട്', 'nere munnottu'], ['ഇടത്', 'idathu'], ['വലത്', 'valathu'], ['അടുത്ത്', 'aduthu'],
      ['ദൂരെ', 'doore'], ['ബാങ്കിന്റെ അടുത്ത്', 'bankinte aduthu'], ['അമ്പലത്തിന് എതിർവശം', 'ambalathinu ethirvasham'],
      ['എത്ര ദൂരമുണ്ട്?', 'ethra dooramundu?'], ['നടന്നു പോകാമോ?', 'nadannu pokaamo?']
    ] },
    places: { name: 'നഗരത്തിലെ സ്ഥലങ്ങൾ', items: [
      ['ആശുപത്രി', 'aashupathri'], ['ബാങ്ക്', 'bank'], ['ATM', 'ATM'], ['പോസ്റ്റ് ഓഫീസ്', 'post office'], ['പോലീസ് സ്റ്റേഷൻ', 'police station'],
      ['റെയിൽവേ സ്റ്റേഷൻ', 'railway station'], ['ബസ് സ്റ്റാൻഡ്', 'bus stand'], ['മാർക്കറ്റ്', 'market'], ['സ്കൂൾ', 'school'], ['അമ്പലം', 'ambalam'],
      ['പള്ളി (മുസ്ലിം)', 'palli (muslim)'], ['പള്ളി (ക്രിസ്ത്യൻ)', 'palli (christian)']
    ] },
    doctor: { name: 'ഡോക്ടറും ആരോഗ്യവും', items: [
      ['എനിക്ക് സുഖമില്ല.', 'enikku sukhamilla.'], ['എനിക്ക് പനിയുണ്ട്.', 'enikku paniyundu.'],
      ['എനിക്ക് തലവേദനയുണ്ട്.', 'enikku thalavedanayundu.'], ['എനിക്ക് വയറുവേദനയുണ്ട്.', 'enikku vayaruvedanayundu.'],
      ['എനിക്ക് ചുമയും ജലദോഷവുമുണ്ട്.', 'enikku chumayum jaladoshavumundu.'], ['എനിക്ക് തലകറക്കമുണ്ട്.', 'enikku thalakarakkamundu.'],
      ['ഇന്നലെ മുതൽ.', 'innale muthal.'], ['എനിക്ക് ഒരു ഡോക്ടറെ വേണം.', 'enikku oru doctore venam.'], ['എവിടെയാണ് വേദന?', 'evideyaanu vedana?'],
      ['ഇവിടെ വേദനയുണ്ട്.', 'ivide vedanayundu.'], ['എനിക്ക് ഹൈ ബിപി ഉണ്ട്.', 'enikku high BP undu.'], ['വേഗം സുഖമാകട്ടെ!', 'vegam sukhamaakatte!']
    ] },
    pharmacy: { name: 'മെഡിക്കൽ ഷോപ്പ്', items: [
      ['മരുന്ന്', 'marunnu'], ['എനിക്ക് ഈ മരുന്ന് വേണം.', 'enikku ee marunnu venam.'], ['പനിക്ക് മരുന്ന് ഉണ്ടോ?', 'panikku marunnu undo?'],
      ['ദിവസം എത്ര തവണ?', 'divasam ethra thavana?'], ['ഭക്ഷണത്തിന് മുമ്പോ ശേഷമോ?', 'bhakshanathinu mumbo sheshamo?'],
      ['ദിവസം രണ്ടു തവണ, ഭക്ഷണശേഷം.', 'divasam randu thavana, bhakshanashesham.'], ['ഗുളിക / സിറപ്പ്', 'gulika / syrup'], ['ബാൻഡേജ്', 'bandage'],
      ['പാർശ്വഫലങ്ങൾ ഉണ്ടോ?', 'paarshwaphalangal undo?'], ['വേദനയ്ക്ക് ഒരു ഗുളിക തരൂ.', 'vedanaykku oru gulika tharoo.']
    ] },
    bank: { name: 'ബാങ്കും പോസ്റ്റ് ഓഫീസും', items: [
      ['എനിക്ക് അക്കൗണ്ട് തുറക്കണം.', 'enikku account thurakkanam.'], ['ഈ ഫോം പൂരിപ്പിക്കൂ.', 'ee form poorippikkoo.'],
      ['എനിക്ക് പണം എടുക്കണം.', 'enikku panam edukkanam.'], ['എനിക്ക് പണം നിക്ഷേപിക്കണം.', 'enikku panam nikshepikkanam.'],
      ['അക്കൗണ്ട് നമ്പർ', 'account number'], ['ഇവിടെ ഒപ്പിടൂ.', 'ivide oppidoo.'], ['പാസ്ബുക്ക്', 'passbook'],
      ['എനിക്ക് ഒരു പാർസൽ അയയ്ക്കണം.', 'enikku oru parcel ayaykkanam.'], ['സ്റ്റാമ്പ്', 'stamp'], ['ക്യൂ എവിടെയാണ്?', 'queue evideyaanu?']
    ] },
    office: { name: 'ഓഫീസും ജോലിയും', items: [
      ['സുപ്രഭാതം സർ / മാഡം.', 'suprabhaatham sir / madam.'], ['മീറ്റിംഗ്', 'meeting'], ['ഞാൻ കുറച്ച് വൈകും.', 'njaan kurachu vaikum.'],
      ['എനിക്ക് ഫയൽ അയച്ചു തരൂ.', 'enikku file ayachu tharoo.'], ['ഞാൻ ജോലി തീർത്തു.', 'njaan joli theerthu.'],
      ['ഇത് ഒന്ന് പരിശോധിക്കൂ.', 'ithu onnu parishodhikkoo.'], ['ലീവ്', 'leave'], ['എനിക്ക് നാളെ ലീവ് വേണം.', 'enikku naale leave venam.'],
      ['നന്നായി ചെയ്തു!', 'nannaayi cheythu!'], ['നാളെ സംസാരിക്കാം.', 'naale samsaarikkaam.']
    ] },
    phone: { name: 'ഫോണും ഇന്റർനെറ്റും', items: [
      ['ഫോൺ', 'phone'], ['നിങ്ങളുടെ ഫോൺ നമ്പർ എന്താണ്?', 'ningalude phone number enthaanu?'], ['എന്നെ വിളിക്കൂ.', 'enne vilikkoo.'],
      ['ഞാൻ പിന്നീട് വിളിക്കാം.', 'njaan pinneedu vilikkaam.'], ['നിങ്ങളുടെ ശബ്ദം കേൾക്കുന്നില്ല.', 'ningalude shabdam kelkkunnilla.'],
      ['ഉറക്കെ പറയൂ.', 'urakke parayoo.'], ['WhatsApp-ൽ മെസേജ് അയയ്ക്കൂ.', 'WhatsApp-il message ayaykkoo.'],
      ['ഇവിടെ Wi-Fi ഉണ്ടോ?', 'ivide Wi-Fi undo?'], ['ഫോൺ ചാർജ് ചെയ്യൂ.', 'phone charge cheyyoo.'], ['ഒരു ഫോട്ടോ എടുക്കൂ.', 'oru photo edukkoo.']
    ] },
    school: { name: 'സ്കൂളും ക്ലാസും', items: [
      ['അധ്യാപകൻ', 'adhyaapakan'], ['വിദ്യാർത്ഥി', 'vidyaarthi'], ['പുസ്തകം', 'pusthakam'], ['നോട്ട്ബുക്ക്', 'notebook'], ['പേന', 'pena'],
      ['ക്ലാസ്', 'class'], ['ഹോംവർക്ക്', 'homework'], ['പരീക്ഷ', 'pareeksha'], ['പുസ്തകം തുറക്കൂ.', 'pusthakam thurakkoo.'],
      ['സംശയം ഉണ്ടോ?', 'samshayam undo?'], ['എനിക്ക് മനസ്സിലായി.', 'enikku manassilaayi.'], ['ഒന്നുകൂടി വിശദീകരിക്കൂ.', 'onnukoodi vishadeekarikkoo.']
    ] },
    learning: { name: 'ഭാഷ പഠിക്കൽ', items: [
      ['നിങ്ങൾ ഇംഗ്ലീഷ് സംസാരിക്കുമോ?', 'ningal English samsaarikkumo?'], ['ഞാൻ കുറച്ച് സംസാരിക്കും.', 'njaan kurachu samsaarikkum.'],
      ['ഞാൻ നിങ്ങളുടെ ഭാഷ പഠിക്കുന്നു.', 'njaan ningalude bhaasha padhikkunnu.'], ['ഇത് എങ്ങനെ പറയും?', 'ithu engane parayum?'],
      ['ഇതിന്റെ അർത്ഥം എന്താണ്?', 'ithinte artham enthaanu?'], ['പതുക്കെ പറയൂ.', 'pathukke parayoo.'], ['ഒന്നുകൂടി പറയൂ.', 'onnukoodi parayoo.'],
      ['എനിക്ക് മനസ്സിലാകുന്നു.', 'enikku manassilaakunnu.'], ['എനിക്ക് മനസ്സിലാകുന്നില്ല.', 'enikku manassilaakunnilla.'],
      ['എഴുതി തരൂ.', 'ezhuthi tharoo.'], ['ഇത് ശരിയാണോ?', 'ithu shariyaano?'], ['എന്നെ പഠിപ്പിക്കൂ.', 'enne padhippikkoo.']
    ] },
    home: { name: 'വീടും മുറികളും', items: [
      ['വീട്', 'veedu'], ['മുറി', 'muri'], ['അടുക്കള', 'adukkala'], ['കുളിമുറി', 'kulimuri'], ['വാതിൽ', 'vaathil'], ['ജനൽ', 'janal'],
      ['താക്കോൽ', 'thaakkol'], ['കട്ടിൽ', 'kattil'], ['കസേര', 'kasera'], ['മേശ', 'mesha'], ['ലൈറ്റ്', 'light'], ['ഫാൻ', 'fan']
    ] },
    routine: { name: 'ദിനചര്യ', items: [
      ['ഞാൻ ആറു മണിക്ക് എഴുന്നേൽക്കും.', 'njaan aaru manikku ezhunnelkkum.'], ['ഞാൻ പല്ല് തേക്കും.', 'njaan pallu thekkum.'],
      ['ഞാൻ കുളിക്കും.', 'njaan kulikkum.'], ['ഞാൻ പ്രഭാതഭക്ഷണം കഴിക്കും.', 'njaan prabhaathabhakshanam kazhikkum.'],
      ['ഞാൻ ജോലിക്ക് പോകും.', 'njaan jolikku pokum.'], ['ഞാൻ വൈകുന്നേരം വീട്ടിൽ വരും.', 'njaan vaikunneram veettil varum.'],
      ['ഞാൻ അത്താഴം ഉണ്ടാക്കും.', 'njaan athaazham undaakkum.'], ['ഞാൻ TV കാണും.', 'njaan TV kaanum.'],
      ['ഞാൻ പത്തു മണിക്ക് ഉറങ്ങും.', 'njaan pathu manikku urangum.'], ['നിങ്ങൾ എപ്പോഴാണ് എഴുന്നേൽക്കുന്നത്?', 'ningal eppozhaanu ezhunnelkkunnathu?']
    ] },
    kitchen: { name: 'അടുക്കളയും പാചകവും', items: [
      ['പ്ലേറ്റ്', 'plate'], ['ഗ്ലാസ്', 'glass'], ['സ്പൂൺ', 'spoon'], ['കത്തി', 'kathi'], ['പാത്രം', 'paathram'], ['അടുപ്പ്', 'aduppu'],
      ['പച്ചക്കറി അരിയൂ.', 'pachakkari ariyoo.'], ['വെള്ളം തിളപ്പിക്കൂ.', 'vellam thilappikkoo.'], ['പാത്രം കഴുകൂ.', 'paathram kazhukoo.'],
      ['ഉപ്പ് ചേർക്കൂ.', 'uppu cherkkoo.'], ['രുചി നോക്കൂ.', 'ruchi nokkoo.'], ['ഭക്ഷണം തയ്യാറായി!', 'bhakshanam thayyaaraayi!']
    ] },
    household: { name: 'വീട്ടുജോലികൾ', items: [
      ['വെള്ളം കൊണ്ടുവരൂ.', 'vellam konduvaroo.'], ['വാതിൽ അടയ്ക്കൂ.', 'vaathil adaykkoo.'], ['ജനൽ തുറക്കൂ.', 'janal thurakkoo.'],
      ['ലൈറ്റ് ഇടൂ.', 'light idoo.'], ['ഫാൻ ഓഫ് ചെയ്യൂ.', 'fan off cheyyoo.'], ['മുറി വൃത്തിയാക്കൂ.', 'muri vruthiyaakkoo.'],
      ['തുണി കഴുകൂ.', 'thuni kazhukoo.'], ['ഇവിടെ വരൂ.', 'ivide varoo.'], ['ദയവായി ഇരിക്കൂ.', 'dayavaayi irikkoo.'],
      ['ചായ കുടിക്കൂ.', 'chaaya kudikkoo.'], ['എന്നെ സഹായിക്കൂ.', 'enne sahaayikkoo.'], ['വേറെ എന്തെങ്കിലും?', 'vere enthenkilum?']
    ] },
    festivals: { name: 'ഉത്സവങ്ങളും ആശംസകളും', items: [
      ['ദീപാവലി ആശംസകൾ!', 'Deepaavali aashamsakal!'], ['ഈദ് മുബാറക്!', 'Eid mubaarak!'], ['ഹോളി ആശംസകൾ!', 'Holi aashamsakal!'],
      ['ക്രിസ്മസ് ആശംസകൾ!', 'Christmas aashamsakal!'], ['പുതുവത്സരാശംസകൾ!', 'puthuvatsaraashamsakal!'],
      ['മകരസംക്രാന്തി ആശംസകൾ!', 'Makarasankraanthi aashamsakal!'], ['സ്വാതന്ത്ര്യദിനാശംസകൾ!', 'swaathanthryadinaashamsakal!'],
      ['പിറന്നാൾ ആശംസകൾ!', 'pirannaal aashamsakal!'], ['അഭിനന്ദനങ്ങൾ!', 'abhinandanangal!'], ['ആശംസകൾ!', 'aashamsakal!'],
      ['ഉത്സവത്തിന് ഞങ്ങളുടെ വീട്ടിൽ വരൂ.', 'utsavathinu njangalude veettil varoo.'], ['മധുരം കഴിക്കൂ.', 'madhuram kazhikkoo.']
    ] },
    weather: { name: 'കാലാവസ്ഥയും പ്രകൃതിയും', items: [
      ['കാലാവസ്ഥ എങ്ങനെയുണ്ട്?', 'kaalaavastha enganeyundu?'], ['മഴ പെയ്യുന്നു.', 'mazha peyyunnu.'], ['വളരെ ചൂടാണ്.', 'valare choodaanu.'],
      ['തണുപ്പാണ്.', 'thanuppaanu.'], ['കുട എടുക്കൂ.', 'kuda edukkoo.'], ['സൂര്യൻ', 'sooryan'], ['ചന്ദ്രൻ', 'chandran'], ['കാറ്റ്', 'kaattu'],
      ['മരം', 'maram'], ['നദി', 'nadi']
    ] },
    emergency: { name: 'അടിയന്തര സാഹചര്യം', items: [
      ['രക്ഷിക്കൂ!', 'rakshikkoo!'], ['പോലീസിനെ വിളിക്കൂ!', 'policine vilikkoo!'], ['ആംബുലൻസ് വിളിക്കൂ!', 'ambulance vilikkoo!'],
      ['വേഗം ഡോക്ടറെ വിളിക്കൂ!', 'vegam doctore vilikkoo!'], ['തീ!', 'thee!'], ['ഒരു അപകടം ഉണ്ടായി.', 'oru apakadam undaayi.'],
      ['എന്റെ ബാഗ് നഷ്ടപ്പെട്ടു.', 'ente bag nashtappettu.'], ['എനിക്ക് വഴി തെറ്റി.', 'enikku vazhi thetti.'], ['സൂക്ഷിക്കൂ!', 'sookshikkoo!'],
      ['എല്ലാം ശരിയാണോ?', 'ellaam shariyaano?'], ['നിൽക്കൂ!', 'nilkkoo!'], ['112-ൽ വിളിക്കൂ.', '112-il vilikkoo.']
    ] }
  } },
  ur: { topics: {
    greetings: { name: 'سلام دعا', items: [
      ['السلام علیکم / آداب', 'assalaam alaikum / aadaab'], ['صبح بخیر', 'subah bakhair'], ['شب بخیر', 'shab bakhair'],
      ['آپ کیسے ہیں؟', 'aap kaise hain?'], ['میں ٹھیک ہوں، شکریہ۔', 'main theek hoon, shukriya.'], ['اور آپ؟', 'aur aap?'],
      ['آپ سے مل کر خوشی ہوئی۔', 'aap se mil kar khushi hui.'], ['خوش آمدید!', 'khush aamdeed!'], ['اچھا، پھر ملتے ہیں۔', 'achha, phir milte hain.'],
      ['کل ملتے ہیں۔', 'kal milte hain.'], ['اپنا خیال رکھیے۔', 'apna khayaal rakhiye.'], ['بہت دنوں بعد ملے!', 'bahut dinon baad mile!']
    ] },
    basics: { name: 'ہاں، نہیں، مہربانی، شکریہ', items: [
      ['ہاں', 'haan'], ['نہیں', 'nahin'], ['مہربانی فرما کر', 'meherbaani farma kar'], ['شکریہ', 'shukriya'],
      ['بہت بہت شکریہ', 'bahut bahut shukriya'], ['کوئی بات نہیں۔', 'koi baat nahin.'], ['معاف کیجیے', 'maaf keejiye'],
      ['کوئی مسئلہ نہیں۔', 'koi masla nahin.'], ['ٹھیک ہے', 'theek hai'], ['ضرور', 'zaroor'], ['شاید', 'shaayad'],
      ['مجھے نہیں معلوم۔', 'mujhe nahin maaloom.']
    ] },
    intro: { name: 'میرے بارے میں', items: [
      ['آپ کا نام کیا ہے؟', 'aap ka naam kya hai?'], ['میرا نام ریا ہے۔', 'mera naam Riya hai.'], ['آپ کہاں سے ہیں؟', 'aap kahaan se hain?'],
      ['میں دہلی سے ہوں۔', 'main Dehli se hoon.'], ['میں ممبئی میں رہتا ہوں۔', 'main Mumbai mein rahta hoon.'],
      ['میں طالب علم ہوں۔', 'main taalib-e-ilm hoon.'], ['میں استاد ہوں۔', 'main ustaad hoon.'], ['آپ کی عمر کیا ہے؟', 'aap ki umr kya hai?'],
      ['میں پچیس سال کا ہوں۔', 'main pachchees saal ka hoon.'], ['یہ میرا دوست ہے۔', 'yeh mera dost hai.']
    ] },
    smalltalk: { name: 'ہلکی پھلکی باتیں', items: [
      ['سب کیسا چل رہا ہے؟', 'sab kaisa chal raha hai?'], ['سب ٹھیک ہے۔', 'sab theek hai.'], ['آپ کیا کر رہے ہیں؟', 'aap kya kar rahe hain?'],
      ['کچھ خاص نہیں۔', 'kuchh khaas nahin.'], ['گھر میں سب کیسے ہیں؟', 'ghar mein sab kaise hain?'], ['سب ٹھیک ہیں۔', 'sab theek hain.'],
      ['کیا نیا ہے؟', 'kya naya hai?'], ['آپ نے کھانا کھایا؟', 'aap ne khaana khaaya?'], ['آج موسم اچھا ہے۔', 'aaj mausam achha hai.'],
      ['چلیے!', 'chaliye!']
    ] },
    feelings: { name: 'احساسات', items: [
      ['میں خوش ہوں۔', 'main khush hoon.'], ['میں اداس ہوں۔', 'main udaas hoon.'], ['میں تھک گیا ہوں۔', 'main thak gaya hoon.'],
      ['مجھے بھوک لگی ہے۔', 'mujhe bhook lagi hai.'], ['مجھے پیاس لگی ہے۔', 'mujhe pyaas lagi hai.'],
      ['مجھے غصہ آ رہا ہے۔', 'mujhe ghussa aa raha hai.'], ['مجھے ڈر لگ رہا ہے۔', 'mujhe dar lag raha hai.'],
      ['میں اکتا گیا ہوں۔', 'main ukta gaya hoon.'], ['مجھے یہ پسند ہے۔', 'mujhe yeh pasand hai.'], ['مجھے یہ پسند نہیں۔', 'mujhe yeh pasand nahin.']
    ] },
    questions: { name: 'سوالیہ الفاظ', items: [
      ['کیا؟', 'kya?'], ['کون؟', 'kaun?'], ['کہاں؟', 'kahaan?'], ['کب؟', 'kab?'], ['کیوں؟', 'kyun?'], ['کیسے؟', 'kaise?'],
      ['کتنا؟ / کتنے؟', 'kitna? / kitne?'], ['کون سا؟', 'kaun sa?'], ['یہ کیا ہے؟', 'yeh kya hai?'],
      ['بیت الخلا کہاں ہے؟', 'bait-ul-khala kahaan hai?']
    ] },
    verbs: { name: 'روز کے کام', items: [
      ['آئیے۔', 'aaiye.'], ['جائیے۔', 'jaaiye.'], ['بیٹھیے۔', 'baithiye.'], ['کھڑے ہو جائیے۔', 'khade ho jaaiye.'], ['کھائیے۔', 'khaaiye.'],
      ['پیجیے۔', 'peejiye.'], ['دیجیے۔', 'deejiye.'], ['لیجیے۔', 'leejiye.'], ['دیکھیے۔', 'dekhiye.'], ['سنیے۔', 'suniye.'],
      ['مجھے بتائیے۔', 'mujhe bataaiye.'], ['ایک منٹ رکیے۔', 'ek minute rukiye.']
    ] },
    opposites: { name: 'متضاد الفاظ', items: [
      ['بڑا / چھوٹا', 'bada / chhota'], ['گرم / ٹھنڈا', 'garam / thanda'], ['اچھا / برا', 'achha / bura'], ['نیا / پرانا', 'naya / puraana'],
      ['قریب / دور', 'qareeb / door'], ['تیز / آہستہ', 'tez / aahista'], ['کھلا / بند', 'khula / band'], ['سستا / مہنگا', 'sasta / mehnga'],
      ['صاف / گندا', 'saaf / ganda'], ['آسان / مشکل', 'aasaan / mushkil'], ['زیادہ / کم', 'zyaada / kam'], ['دایاں / بایاں', 'daayaan / baayaan']
    ] },
    numbers: { name: 'گنتی', items: [
      ['صفر', 'sifar'], ['ایک', 'ek'], ['دو', 'do'], ['تین', 'teen'], ['چار', 'chaar'], ['پانچ', 'paanch'], ['چھ', 'chhe'], ['سات', 'saat'],
      ['آٹھ', 'aath'], ['نو', 'nau'], ['دس', 'das'], ['گیارہ', 'gyaarah'], ['بارہ', 'baarah'], ['تیرہ', 'terah'], ['چودہ', 'chaudah'],
      ['پندرہ', 'pandrah'], ['سولہ', 'solah'], ['سترہ', 'satrah'], ['اٹھارہ', 'athaarah'], ['انیس', 'unnees'], ['بیس', 'bees'], ['تیس', 'tees'],
      ['چالیس', 'chaalees'], ['پچاس', 'pachaas'], ['ساٹھ', 'saath'], ['ستر', 'sattar'], ['اسی', 'assi'], ['نوے', 'navve'], ['سو', 'sau'],
      ['ہزار', 'hazaar'], ['ایک لاکھ', 'ek laakh'], ['ایک کروڑ', 'ek karod']
    ] },
    quantities: { name: 'مقدار اور ناپ', items: [
      ['تھوڑا', 'thoda'], ['بہت', 'bahut'], ['آدھا', 'aadha'], ['ڈیڑھ', 'dedh'], ['چوتھائی', 'chauthaai'], ['ایک کلو', 'ek kilo'],
      ['آدھا کلو', 'aadha kilo'], ['ایک لیٹر', 'ek litre'], ['ایک درجن', 'ek darjan'], ['بس، کافی ہے', 'bas, kaafi hai']
    ] },
    days: { name: 'دن', items: [
      ['پیر', 'peer'], ['منگل', 'mangal'], ['بدھ', 'budh'], ['جمعرات', 'jumeraat'], ['جمعہ', 'jumma'], ['ہفتہ', 'hafta'], ['اتوار', 'itvaar'],
      ['آج', 'aaj'], ['کل (آنے والا)', 'kal (aane vaala)'], ['کل (گزرا ہوا)', 'kal (guzra hua)']
    ] },
    time: { name: 'وقت', items: [
      ['کیا وقت ہوا ہے؟', 'kya waqt hua hai?'], ['پانچ بجے ہیں۔', 'paanch baje hain.'], ['ساڑھے پانچ', 'saadhe paanch'], ['صبح', 'subah'],
      ['دوپہر', 'dopahar'], ['شام', 'shaam'], ['رات', 'raat'], ['ابھی', 'abhi'], ['بعد میں', 'baad mein'], ['جلدی', 'jaldi'], ['دیر سے', 'der se'],
      ['ایک گھنٹہ', 'ek ghanta']
    ] },
    calendar: { name: 'ہفتہ، مہینہ، سال', items: [
      ['ہفتہ', 'hafta'], ['مہینہ', 'maheena'], ['سال', 'saal'], ['اس ہفتے', 'is hafte'], ['اگلے مہینے', 'agle maheene'],
      ['پچھلے سال', 'pichhle saal'], ['آج کیا تاریخ ہے؟', 'aaj kya taareekh hai?'], ['چھٹی', 'chhutti'], ['سالگرہ', 'saalgirah'],
      ['ویک اینڈ (ہفتے کے آخری دن)', 'weekend (hafte ke aakhri din)']
    ] },
    family: { name: 'خاندان', items: [
      ['امی', 'ammi'], ['ابو', 'abbu'], ['بڑا بھائی', 'bada bhai'], ['بڑی بہن', 'badi bahan'], ['چھوٹا بھائی', 'chhota bhai'],
      ['چھوٹی بہن', 'chhoti bahan'], ['بیٹا', 'beta'], ['بیٹی', 'beti'], ['شوہر', 'shauhar'], ['بیوی', 'beevi'], ['دادا', 'daada'], ['دادی', 'daadi']
    ] },
    people: { name: 'لوگ', items: [
      ['دوست', 'dost'], ['پڑوسی', 'padosi'], ['مہمان', 'mehmaan'], ['بچہ', 'bachcha'], ['بچے', 'bachche'], ['لڑکا', 'ladka'], ['لڑکی', 'ladki'],
      ['آدمی', 'aadmi'], ['عورت', 'aurat'], ['سب لوگ', 'sab log']
    ] },
    colours: { name: 'رنگ', items: [
      ['لال', 'laal'], ['نیلا', 'neela'], ['ہرا', 'hara'], ['پیلا', 'peela'], ['سفید', 'safed'], ['کالا', 'kaala'], ['نارنگی', 'naarangi'],
      ['گلابی', 'gulaabi'], ['بھورا', 'bhoora'], ['جامنی', 'jaamni']
    ] },
    food: { name: 'کھانا پینا', items: [
      ['پانی', 'paani'], ['چائے', 'chai'], ['دودھ', 'doodh'], ['چاول', 'chaawal'], ['روٹی', 'roti'], ['دال', 'daal'], ['سبزی', 'sabzi'],
      ['پھل', 'phal'], ['چینی', 'cheeni'], ['نمک', 'namak'], ['دہی', 'dahi'], ['انڈا', 'anda']
    ] },
    restaurant: { name: 'ریستوران میں', items: [
      ['مہربانی کر کے مینو دکھائیے۔', 'meherbaani kar ke menu dikhaaiye.'], ['یہاں کیا اچھا ملتا ہے؟', 'yahaan kya achha milta hai?'],
      ['میں سبزی خور ہوں۔', 'main sabzi-khor hoon.'], ['ایک پلیٹ چاول دیجیے۔', 'ek plate chaawal deejiye.'],
      ['ایک کپ چائے دیجیے۔', 'ek cup chai deejiye.'], ['کم مرچ والا بنائیے۔', 'kam mirch vaala banaaiye.'],
      ['تھوڑا پانی دیجیے۔', 'thoda paani deejiye.'], ['بل لے آئیے۔', 'bill le aaiye.'], ['بہت لذیذ تھا!', 'bahut lazeez tha!'],
      ['کیا یہ تیز مرچ والا ہے؟', 'kya yeh tez mirch vaala hai?']
    ] },
    taste: { name: 'ذائقہ اور کھانا پکانا', items: [
      ['تیز مرچ والا', 'tez mirch vaala'], ['میٹھا', 'meetha'], ['نمکین', 'namkeen'], ['کھٹا', 'khatta'], ['کڑوا', 'kadva'], ['لذیذ', 'lazeez'],
      ['گرما گرم، تازہ', 'garma garam, taaza'], ['ٹھنڈا', 'thanda'], ['کم تیل ڈالیے۔', 'kam tel daaliye.'],
      ['پیاز لہسن مت ڈالیے۔', 'pyaaz lehsan mat daaliye.']
    ] },
    market: { name: 'بازار اور بھاؤ تاؤ', items: [
      ['یہ کتنے کا ہے؟', 'yeh kitne ka hai?'], ['بہت مہنگا ہے۔', 'bahut mehnga hai.'], ['تھوڑا کم کر دیجیے۔', 'thoda kam kar deejiye.'],
      ['آخری دام کیا ہے؟', 'aakhiri daam kya hai?'], ['میں یہ لے لوں گا۔', 'main yeh le loonga.'], ['مجھے نہیں چاہیے۔', 'mujhe nahin chaahiye.'],
      ['اس سے بڑا ہے؟', 'is se bada hai?'], ['ایک کلو دے دیجیے۔', 'ek kilo de deejiye.'], ['کیا یہ تازہ ہے؟', 'kya yeh taaza hai?'],
      ['ایک تھیلی دے دیجیے۔', 'ek thaili de deejiye.'], ['کھلے پیسے ہیں؟', 'khule paise hain?'], ['تول دیجیے۔', 'taul deejiye.']
    ] },
    shopping: { name: 'کپڑے اور خریداری', items: [
      ['قمیض', 'qameez'], ['پینٹ', 'pant'], ['ساڑی', 'saadi'], ['کرتا', 'kurta'], ['جوتے', 'joote'],
      ['کیا میں اسے پہن کر دیکھ سکتا ہوں؟', 'kya main ise pehen kar dekh sakta hoon?'], ['دوسرا رنگ ہے؟', 'doosra rang hai?'],
      ['یہ بہت بڑا ہے۔', 'yeh bahut bada hai.'], ['یہ بہت چھوٹا ہے۔', 'yeh bahut chhota hai.'],
      ['میں اسے واپس کرنا چاہتا ہوں۔', 'main ise waapas karna chaahta hoon.']
    ] },
    money: { name: 'پیسے اور ادائیگی', items: [
      ['پیسے', 'paise'], ['روپے', 'rupaye'], ['کھلے پیسے', 'khule paise'], ['نقد', 'naqad'],
      ['کیا میں UPI سے پیمنٹ کر سکتا ہوں؟', 'kya main UPI se payment kar sakta hoon?'], ['رسید دے دیجیے۔', 'raseed de deejiye.'],
      ['کل کتنا ہوا؟', 'kul kitna hua?'], ['یہ مہنگا ہے۔', 'yeh mehnga hai.'], ['یہ سستا ہے۔', 'yeh sasta hai.'],
      ['میرے پاس کھلے پیسے نہیں ہیں۔', 'mere paas khule paise nahin hain.']
    ] },
    auto: { name: 'آٹو اور ٹیکسی', items: [
      ['آٹو! / ٹیکسی!', 'auto! / taxi!'], ['اسٹیشن چلیں گے؟', 'station chalenge?'], ['اسٹیشن تک کتنا لگے گا؟', 'station tak kitna lagega?'],
      ['میٹر سے چلیے۔', 'meter se chaliye.'], ['یہاں روکیے۔', 'yahaan rokiye.'], ['سیدھے چلیے۔', 'seedhe chaliye.'],
      ['بائیں مڑیے۔', 'baayen mudiye.'], ['دائیں مڑیے۔', 'daayen mudiye.'], ['آہستہ چلائیے۔', 'aahista chalaaiye.'], ['یہاں رکیے۔', 'yahaan rukiye.']
    ] },
    transport: { name: 'بس اور ٹرین', items: [
      ['بس اسٹاپ کہاں ہے؟', 'bus stop kahaan hai?'], ['بازار کون سی بس جاتی ہے؟', 'baazaar kaun si bus jaati hai?'],
      ['کیا یہ ٹرین چنئی جاتی ہے؟', 'kya yeh train Chennai jaati hai?'], ['ایک ٹکٹ دیجیے۔', 'ek ticket deejiye.'],
      ['پونے کے دو ٹکٹ دیجیے۔', 'Pune ke do ticket deejiye.'], ['ٹرین کتنے بجے چلتی ہے؟', 'train kitne baje chalti hai?'],
      ['کون سا پلیٹ فارم؟', 'kaun sa platform?'], ['کیا یہ سیٹ خالی ہے؟', 'kya yeh seat khaali hai?'],
      ['مجھے کہاں اترنا چاہیے؟', 'mujhe kahaan utarna chaahiye?'], ['بس دیر سے آ رہی ہے۔', 'bus der se aa rahi hai.']
    ] },
    directions: { name: 'راستہ', items: [
      ['یہ کہاں ہے؟', 'yeh kahaan hai?'], ['سیدھے آگے', 'seedhe aage'], ['بائیں', 'baayen'], ['دائیں', 'daayen'], ['قریب', 'qareeb'],
      ['دور', 'door'], ['بینک کے برابر', 'bank ke baraabar'], ['مندر کے سامنے', 'mandir ke saamne'], ['کتنی دور ہے؟', 'kitni door hai?'],
      ['کیا میں پیدل جا سکتا ہوں؟', 'kya main paidal ja sakta hoon?']
    ] },
    places: { name: 'شہر کی جگہیں', items: [
      ['ہسپتال', 'haspataal'], ['بینک', 'bank'], ['ATM', 'ATM'], ['ڈاک خانہ', 'daak khaana'], ['پولیس تھانہ', 'police thaana'],
      ['ریلوے اسٹیشن', 'railway station'], ['بس اسٹینڈ', 'bus stand'], ['بازار', 'baazaar'], ['اسکول', 'school'], ['مندر', 'mandir'],
      ['مسجد', 'masjid'], ['گرجا گھر', 'girja ghar']
    ] },
    doctor: { name: 'ڈاکٹر اور صحت', items: [
      ['میری طبیعت ٹھیک نہیں ہے۔', 'meri tabiyat theek nahin hai.'], ['مجھے بخار ہے۔', 'mujhe bukhaar hai.'],
      ['میرے سر میں درد ہے۔', 'mere sar mein dard hai.'], ['میرے پیٹ میں درد ہے۔', 'mere pet mein dard hai.'],
      ['مجھے کھانسی اور زکام ہے۔', 'mujhe khaansi aur zukaam hai.'], ['مجھے چکر آ رہے ہیں۔', 'mujhe chakkar aa rahe hain.'], ['کل سے۔', 'kal se.'],
      ['مجھے ڈاکٹر چاہیے۔', 'mujhe doctor chaahiye.'], ['کہاں درد ہے؟', 'kahaan dard hai?'], ['یہاں درد ہے۔', 'yahaan dard hai.'],
      ['مجھے ہائی بلڈ پریشر ہے۔', 'mujhe high blood pressure hai.'], ['جلدی ٹھیک ہو جائیے!', 'jaldi theek ho jaaiye!']
    ] },
    pharmacy: { name: 'دوا کی دکان', items: [
      ['دوا', 'dawa'], ['مجھے یہ دوا چاہیے۔', 'mujhe yeh dawa chaahiye.'], ['بخار کی دوا ہے؟', 'bukhaar ki dawa hai?'],
      ['دن میں کتنی بار؟', 'din mein kitni baar?'], ['کھانے سے پہلے یا بعد میں؟', 'khaane se pehle ya baad mein?'],
      ['دن میں دو بار، کھانے کے بعد۔', 'din mein do baar, khaane ke baad.'], ['گولی / سیرپ', 'goli / syrup'], ['پٹی', 'patti'],
      ['کوئی سائیڈ افیکٹ ہے؟', 'koi side effect hai?'], ['درد کی دوا دیجیے۔', 'dard ki dawa deejiye.']
    ] },
    bank: { name: 'بینک اور ڈاک خانہ', items: [
      ['میں کھاتہ کھولنا چاہتا ہوں۔', 'main khaata kholna chaahta hoon.'], ['یہ فارم بھریے۔', 'yeh form bhariye.'],
      ['مجھے پیسے نکالنے ہیں۔', 'mujhe paise nikaalne hain.'], ['مجھے پیسے جمع کرنے ہیں۔', 'mujhe paise jama karne hain.'],
      ['کھاتہ نمبر', 'khaata number'], ['یہاں دستخط کیجیے۔', 'yahaan dastkhat keejiye.'], ['پاس بک', 'passbook'],
      ['مجھے پارسل بھیجنا ہے۔', 'mujhe parcel bhejna hai.'], ['ڈاک ٹکٹ', 'daak ticket'], ['لائن کہاں ہے؟', 'line kahaan hai?']
    ] },
    office: { name: 'دفتر اور کام', items: [
      ['آداب سر / میڈم۔', 'aadaab sir / madam.'], ['میٹنگ', 'meeting'], ['مجھے تھوڑی دیر ہو جائے گی۔', 'mujhe thodi der ho jaayegi.'],
      ['مجھے فائل بھیج دیجیے۔', 'mujhe file bhej deejiye.'], ['میں نے کام پورا کر لیا۔', 'main ne kaam poora kar liya.'],
      ['اسے چیک کر لیجیے۔', 'ise check kar leejiye.'], ['چھٹی (رخصت)', 'chhutti (rukhsat)'], ['مجھے کل چھٹی چاہیے۔', 'mujhe kal chhutti chaahiye.'],
      ['بہت اچھا کام کیا!', 'bahut achha kaam kiya!'], ['کل بات کرتے ہیں۔', 'kal baat karte hain.']
    ] },
    phone: { name: 'فون اور انٹرنیٹ', items: [
      ['فون', 'phone'], ['آپ کا فون نمبر کیا ہے؟', 'aap ka phone number kya hai?'], ['مجھے فون کیجیے۔', 'mujhe phone keejiye.'],
      ['میں آپ کو بعد میں فون کروں گا۔', 'main aap ko baad mein phone karoonga.'], ['آپ کی آواز نہیں آ رہی۔', 'aap ki aawaaz nahin aa rahi.'],
      ['زور سے بولیے۔', 'zor se boliye.'], ['WhatsApp پر میسج کر دیجیے۔', 'WhatsApp par message kar deejiye.'],
      ['یہاں Wi-Fi ہے؟', 'yahaan Wi-Fi hai?'], ['فون چارج کر دیجیے۔', 'phone charge kar deejiye.'], ['ایک فوٹو لیجیے۔', 'ek photo leejiye.']
    ] },
    school: { name: 'اسکول اور کلاس', items: [
      ['استاد', 'ustaad'], ['طالب علم', 'taalib-e-ilm'], ['کتاب', 'kitaab'], ['کاپی', 'copy'], ['قلم', 'qalam'], ['کلاس', 'class'],
      ['ہوم ورک', 'homework'], ['امتحان', 'imtihaan'], ['اپنی کتابیں کھولیے۔', 'apni kitaaben kholiye.'], ['کوئی سوال؟', 'koi sawaal?'],
      ['میں سمجھ گیا۔', 'main samajh gaya.'], ['پھر سے سمجھائیے۔', 'phir se samjhaaiye.']
    ] },
    learning: { name: 'زبان سیکھنا', items: [
      ['کیا آپ انگریزی بولتے ہیں؟', 'kya aap angrezi bolte hain?'], ['میں تھوڑا تھوڑا بولتا ہوں۔', 'main thoda thoda bolta hoon.'],
      ['میں آپ کی زبان سیکھ رہا ہوں۔', 'main aap ki zabaan seekh raha hoon.'], ['اسے کیسے کہتے ہیں؟', 'ise kaise kehte hain?'],
      ['اس کا کیا مطلب ہے؟', 'is ka kya matlab hai?'], ['آہستہ بولیے۔', 'aahista boliye.'], ['پھر سے کہیے۔', 'phir se kahiye.'],
      ['میں سمجھتا ہوں۔', 'main samajhta hoon.'], ['میں نہیں سمجھا۔', 'main nahin samjha.'], ['لکھ کر دیجیے۔', 'likh kar deejiye.'],
      ['کیا یہ صحیح ہے؟', 'kya yeh sahi hai?'], ['مجھے سکھائیے۔', 'mujhe sikhaaiye.']
    ] },
    home: { name: 'گھر اور کمرے', items: [
      ['گھر', 'ghar'], ['کمرہ', 'kamra'], ['باورچی خانہ', 'baawarchi khaana'], ['غسل خانہ', 'ghusal khaana'], ['دروازہ', 'darwaaza'],
      ['کھڑکی', 'khidki'], ['چابی', 'chaabi'], ['بستر', 'bistar'], ['کرسی', 'kursi'], ['میز', 'mez'], ['بتی', 'batti'], ['پنکھا', 'pankha']
    ] },
    routine: { name: 'روز کا معمول', items: [
      ['میں چھ بجے اٹھتا ہوں۔', 'main chhe baje uthta hoon.'], ['میں دانت صاف کرتا ہوں۔', 'main daant saaf karta hoon.'],
      ['میں نہاتا ہوں۔', 'main nahaata hoon.'], ['میں ناشتہ کرتا ہوں۔', 'main naashta karta hoon.'],
      ['میں کام پر جاتا ہوں۔', 'main kaam par jaata hoon.'], ['میں شام کو گھر آتا ہوں۔', 'main shaam ko ghar aata hoon.'],
      ['میں رات کا کھانا بناتا ہوں۔', 'main raat ka khaana banaata hoon.'], ['میں TV دیکھتا ہوں۔', 'main TV dekhta hoon.'],
      ['میں دس بجے سوتا ہوں۔', 'main das baje sota hoon.'], ['آپ کتنے بجے اٹھتے ہیں؟', 'aap kitne baje uthte hain?']
    ] },
    kitchen: { name: 'باورچی خانہ اور کھانا پکانا', items: [
      ['پلیٹ', 'plate'], ['گلاس', 'gilaas'], ['چمچ', 'chamach'], ['چھری', 'chhuri'], ['برتن', 'bartan'], ['چولہا', 'choolha'],
      ['سبزی کاٹ دیجیے۔', 'sabzi kaat deejiye.'], ['پانی ابال دیجیے۔', 'paani ubaal deejiye.'], ['برتن دھو دیجیے۔', 'bartan dho deejiye.'],
      ['نمک ڈالیے۔', 'namak daaliye.'], ['چکھ کر دیکھیے۔', 'chakh kar dekhiye.'], ['کھانا تیار ہے!', 'khaana tayyaar hai!']
    ] },
    household: { name: 'گھر کے کام', items: [
      ['پانی لے آئیے۔', 'paani le aaiye.'], ['دروازہ بند کر دیجیے۔', 'darwaaza band kar deejiye.'], ['کھڑکی کھول دیجیے۔', 'khidki khol deejiye.'],
      ['بتی جلا دیجیے۔', 'batti jala deejiye.'], ['پنکھا بند کر دیجیے۔', 'pankha band kar deejiye.'],
      ['کمرہ صاف کر دیجیے۔', 'kamra saaf kar deejiye.'], ['کپڑے دھو دیجیے۔', 'kapde dho deejiye.'], ['یہاں آئیے۔', 'yahaan aaiye.'],
      ['بیٹھ جائیے۔', 'baith jaaiye.'], ['چائے لیجیے۔', 'chai leejiye.'], ['میری مدد کیجیے۔', 'meri madad keejiye.'], ['اور کچھ؟', 'aur kuchh?']
    ] },
    festivals: { name: 'تہوار اور مبارکباد', items: [
      ['دیوالی مبارک!', 'Diwali mubaarak!'], ['عید مبارک!', 'Eid mubaarak!'], ['ہولی مبارک!', 'Holi mubaarak!'],
      ['کرسمس مبارک!', 'Christmas mubaarak!'], ['نیا سال مبارک!', 'naya saal mubaarak!'], ['مکر سنکرانتی مبارک!', 'Makar Sankraanti mubaarak!'],
      ['یوم آزادی مبارک!', 'yaum-e-aazaadi mubaarak!'], ['سالگرہ مبارک!', 'saalgirah mubaarak!'], ['مبارک ہو!', 'mubaarak ho!'],
      ['نیک خواہشات!', 'nek khwaahishaat!'], ['تہوار پر ہمارے گھر آئیے۔', 'tehwaar par hamaare ghar aaiye.'], ['مٹھائی لیجیے۔', 'mithaai leejiye.']
    ] },
    weather: { name: 'موسم اور قدرت', items: [
      ['موسم کیسا ہے؟', 'mausam kaisa hai?'], ['بارش ہو رہی ہے۔', 'baarish ho rahi hai.'], ['بہت گرمی ہے۔', 'bahut garmi hai.'],
      ['سردی ہے۔', 'sardi hai.'], ['چھتری لے جائیے۔', 'chhatri le jaaiye.'], ['سورج', 'sooraj'], ['چاند', 'chaand'], ['ہوا', 'hawa'], ['پیڑ', 'ped'],
      ['دریا', 'darya']
    ] },
    emergency: { name: 'ہنگامی حالت', items: [
      ['بچاؤ!', 'bachao!'], ['پولیس کو بلائیے!', 'police ko bulaaiye!'], ['ایمبولینس بلائیے!', 'ambulance bulaaiye!'],
      ['جلدی ڈاکٹر کو بلائیے!', 'jaldi doctor ko bulaaiye!'], ['آگ لگی ہے!', 'aag lagi hai!'], ['ایک حادثہ ہوا ہے۔', 'ek haadsa hua hai.'],
      ['میرا بیگ کھو گیا ہے۔', 'mera bag kho gaya hai.'], ['میں راستہ بھول گیا ہوں۔', 'main raasta bhool gaya hoon.'], ['خیال سے!', 'khayaal se!'],
      ['سب ٹھیک ہے؟', 'sab theek hai?'], ['رکیے!', 'rukiye!'], ['112 پر فون کیجیے۔', '112 par phone keejiye.']
    ] }
  } }
};
