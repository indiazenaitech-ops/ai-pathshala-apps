/* Web Page Maker: localized words used inside the templates, template tips and cheat-sheet descriptions.
   Every language has exactly the same shape. Code itself lives in data.js. */
window.APP_CONTENT = {
  en: {
    tpl: {
      first: {
        name: 'My first page',
        tips: ['Change the name, hobbies and goals to your own.', 'In CSS, change the colour of h1, for example color: green;'],
        t: {
          title: 'About me', h1: 'Hello, I am Riya Sharma 👋', photo_alt: 'Picture of Riya',
          intro: 'I study in Class 7 in Jaipur, Rajasthan. I love stories, drawing and computers.',
          h_hobbies: 'My hobbies', hobby1: 'Playing cricket 🏏', hobby2: 'Drawing and painting 🎨', hobby3: 'Reading comics 📚',
          h_goals: 'My goals this year', goal1: 'Read 12 new books', goal2: 'Make my own website',
          fav: 'My favourite subject is <strong>Science</strong>. Now I am learning <em>HTML</em>!',
          footer: 'Made by Riya with HTML and CSS 💻',
          c_html: 'Change the words between the tags and watch the preview change.',
          c_css: 'CSS decides the colours, sizes and spacing.',
          c_js: 'This line prints a message in the Console.',
          log: 'Namaste! My page is ready.'
        }
      },
      timetable: {
        name: 'My timetable',
        tips: ['Add a new row for period 6.', 'In CSS, change the background colour of the th cells.'],
        t: {
          title: 'My timetable', h1: 'My class timetable', caption: 'Class 7 B', period: 'Period',
          mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
          maths: 'Maths', science: 'Science', english: 'English', lang_sub: 'Hindi', sst: 'Social Science',
          computer: 'Computer', art: 'Art', games: 'Games', lunch: 'Lunch break',
          c_scroll: 'On small screens the table scrolls sideways',
          c_html: 'tr = row, th = heading cell, td = cell. colspan joins cells.',
          c_js: 'Highlight today’s column (on Sunday nothing is highlighted).'
        }
      },
      form: {
        name: 'Feedback form',
        tips: ['Add a new question with a select box, for example your favourite subject.', 'Press Send feedback and look at the Console.'],
        t: {
          title: 'Feedback form', h1: 'Class feedback', intro: 'Tell us how you liked today’s computer class.',
          name: 'Your name', name_ph: 'e.g. Aarav', cls: 'Class', rating: 'How was the class?',
          r5: 'Very good', r3: 'Okay', r1: 'Difficult', liked: 'What did you like?',
          l1: 'Games', l2: 'Videos', l3: 'Group project', msg: 'Any suggestion?', msg_ph: 'Write here…',
          send: 'Send feedback', thanks: 'Thank you', got: 'We got your feedback.', log: 'Feedback from',
          c_js: 'When the form is sent, show a thank-you message.', c_prevent: 'stay on this page'
        }
      },
      card: {
        name: 'CSS profile card',
        tips: ['Change border-radius of .card to 0 and see what happens.', 'Make the avatar bigger with font-size.'],
        t: {
          title: 'Profile card', name: 'Ananya Iyer', role: 'Class 9 · Science Club captain',
          bio: 'I love building robots and watching the stars. My dream is to work at ISRO.',
          s1: 'Projects', s2: 'Medals', s3: 'Robots', follow: 'Follow', following: 'Following ✓',
          c_css: 'Try changing the numbers and colours below.',
          c_js: 'Switch the button between Follow and Following.'
        }
      },
      colorbtn: {
        name: 'Colour-changing button',
        tips: ['Add one more colour and its name to both lists.', 'Use an if to change the button text after 10 clicks.'],
        t: {
          title: 'Magic button', h1: 'The magic button', intro: 'Click the button. JavaScript changes its colour every time.',
          btn: 'Click me!', clicks: 'Clicks:', colour: 'Colour:',
          c1: 'Saffron', c2: 'Green', c3: 'Navy blue', c4: 'Pink', c5: 'Purple', c6: 'Teal',
          c_list: 'A list (array) of colours and a list of their names',
          c_mod: '% gives the remainder, so the colours repeat'
        }
      },
      calc: {
        name: 'Simple calculator',
        tips: ['Add a button for % (remainder).', 'Try dividing by 0. Which lines of code handle it?'],
        t: {
          title: 'Calculator', h1: 'Simple calculator', first: 'First number', second: 'Second number', answer: 'Answer:',
          empty: 'Please type both numbers', zero: 'Cannot divide by 0',
          c_js: 'Read the two numbers, do the sum and show the answer.',
          c_number: 'Number() turns text into a number'
        }
      },
      quiz: {
        name: 'Quiz page',
        tips: ['Add your own question to the list.', 'In CSS, change the colours of .right and .wrong.'],
        t: {
          title: 'Quiz', h1: 'Quick quiz',
          q1: 'What is the capital of India?', q1a: 'Mumbai', q1b: 'New Delhi', q1c: 'Kolkata',
          q2: 'Which is the largest planet in our solar system?', q2a: 'Earth', q2b: 'Mars', q2c: 'Jupiter',
          q3: 'How many sides does a hexagon have?',
          q4: 'Which gas do plants take from the air to make food?', q4a: 'Oxygen', q4b: 'Carbon dioxide', q4c: 'Nitrogen',
          right: 'Correct! 🎉', wrong: 'Oops! The right answer is:', score: 'Score:', next: 'Next question', again: 'Play again',
          c_js: 'Each question has its text, the options and the number of the right option (counting from 0).'
        }
      },
      blank: {
        name: 'Blank page',
        tips: ['Start with a heading and a paragraph, then add more tags.', 'Use the cheat sheet below to add tags, styles and code.'],
        t: { title: 'My web page', h1: 'My web page', p: 'Start writing here.', c_js: 'Write your JavaScript here.' }
      }
    },
    cheat: {
      html: [
        'Headings. h1 is the biggest and most important, h6 is the smallest.',
        'A paragraph of text.',
        'br starts a new line; hr draws a line across the page. They need no closing tag.',
        'strong makes words bold and important; em makes them italic.',
        'A link to another page. href is the address.',
        'Shows a picture. alt describes it for people who cannot see it.',
        'A list with bullets. Each item goes inside li.',
        'A numbered list: 1, 2, 3…',
        'A table. tr is a row, th is a heading cell and td is a normal cell.',
        'A box that holds other tags, so you can style them together.',
        'Marks a few words inside a line, for example to colour them.',
        'A button. JavaScript can do something when it is clicked.',
        'A box to type in, with its label. type can be text, number, date, color…',
        'A drop-down list of choices.',
        'A big box for typing many lines.',
        'Names the parts of a page: top, main content and bottom.',
        'A comment: a note for people. The browser does not show it.'
      ],
      css: [
        'Colour of the text. Use a name (red), a hex code (#ff9933) or rgb().',
        'Colour behind the element.',
        'Size of the letters.',
        'The font (style of letters). Add a second one in case the first is missing.',
        'Lines up text to the left, right or centre.',
        'Space outside the element, between it and its neighbours.',
        'Space inside the element, between its border and its content.',
        'A line around the element: thickness, style and colour.',
        'Rounds the corners. 50% turns a square into a circle.',
        'Size of the element. % means a part of the space around it.',
        'Places the elements inside side by side. gap adds space between them.',
        'Adds a soft shadow, so the element looks raised.',
        'A style used only while the mouse is over the element.',
        '.note picks every element with class="note"; #title picks the one with id="title".',
        'Different styles for small screens such as phones.'
      ],
      js: [
        'Prints a value in the Console. Very useful to check your code.',
        'Makes a variable that stores a value. A const cannot be changed later.',
        'Runs code only when the condition is true; else runs when it is false.',
        'Repeats code. This loop counts from 1 to 5.',
        'A named block of code that you can use again and again.',
        'Finds the HTML element that has this id.',
        'Finds the first element that matches a CSS selector, like ".note" or "h1".',
        'Reads or changes the text inside an element.',
        'Changes the CSS of an element from JavaScript.',
        'Runs a function when something happens, such as a click.',
        'The text typed in an input box. Number(box.value) turns it into a number.',
        'alert() shows a pop-up message; prompt() asks the user to type an answer.',
        'Gives a random number. This example rolls a dice: 1 to 6.',
        'A list of values. colours[0] is the first item and colours.length is how many there are.'
      ]
    }
  },

  hi: {
    tpl: {
      first: {
        name: 'मेरा पहला पेज',
        tips: ['नाम, शौक और लक्ष्य बदलकर अपने लिखें।', 'CSS में h1 का रंग बदलें, जैसे color: green;'],
        t: {
          title: 'मेरे बारे में', h1: 'नमस्ते, मैं रिया शर्मा हूँ 👋', photo_alt: 'रिया की तस्वीर',
          intro: 'मैं जयपुर, राजस्थान में कक्षा 7 में पढ़ती हूँ। मुझे कहानियाँ, ड्रॉइंग और कंप्यूटर बहुत पसंद हैं।',
          h_hobbies: 'मेरे शौक', hobby1: 'क्रिकेट खेलना 🏏', hobby2: 'ड्रॉइंग और पेंटिंग 🎨', hobby3: 'कॉमिक्स पढ़ना 📚',
          h_goals: 'इस साल के मेरे लक्ष्य', goal1: '12 नई किताबें पढ़ना', goal2: 'अपनी ख़ुद की वेबसाइट बनाना',
          fav: 'मेरा पसंदीदा विषय <strong>विज्ञान</strong> है। अब मैं <em>HTML</em> सीख रही हूँ!',
          footer: 'रिया ने HTML और CSS से बनाया 💻',
          c_html: 'टैग के बीच के शब्द बदलें और प्रीव्यू बदलता देखें।',
          c_css: 'CSS रंग, साइज़ और जगह तय करता है।',
          c_js: 'यह लाइन कंसोल में एक संदेश लिखती है।',
          log: 'नमस्ते! मेरा पेज तैयार है।'
        }
      },
      timetable: {
        name: 'मेरी समय-सारणी',
        tips: ['पीरियड 6 के लिए एक नई पंक्ति जोड़ें।', 'CSS में th खानों का बैकग्राउंड रंग बदलें।'],
        t: {
          title: 'मेरी समय-सारणी', h1: 'मेरी कक्षा की समय-सारणी', caption: 'कक्षा 7 ब', period: 'पीरियड',
          mon: 'सोम', tue: 'मंगल', wed: 'बुध', thu: 'गुरु', fri: 'शुक्र', sat: 'शनि',
          maths: 'गणित', science: 'विज्ञान', english: 'अंग्रेज़ी', lang_sub: 'हिंदी', sst: 'सामाजिक विज्ञान',
          computer: 'कंप्यूटर', art: 'कला', games: 'खेल', lunch: 'लंच ब्रेक',
          c_scroll: 'छोटी स्क्रीन पर टेबल अगल-बगल खिसकती है',
          c_html: 'tr = पंक्ति, th = हेडिंग वाला खाना, td = खाना। colspan खानों को जोड़ता है।',
          c_js: 'आज के दिन वाला कॉलम हाइलाइट करें (रविवार को कुछ हाइलाइट नहीं होता)।'
        }
      },
      form: {
        name: 'फ़ीडबैक फ़ॉर्म',
        tips: ['select बॉक्स वाला एक नया सवाल जोड़ें, जैसे आपका पसंदीदा विषय।', '"फ़ीडबैक भेजें" दबाएँ और कंसोल देखें।'],
        t: {
          title: 'फ़ीडबैक फ़ॉर्म', h1: 'कक्षा फ़ीडबैक', intro: 'बताइए, आज की कंप्यूटर क्लास आपको कैसी लगी।',
          name: 'आपका नाम', name_ph: 'जैसे आरव', cls: 'कक्षा', rating: 'क्लास कैसी रही?',
          r5: 'बहुत अच्छी', r3: 'ठीक-ठाक', r1: 'मुश्किल', liked: 'आपको क्या पसंद आया?',
          l1: 'खेल', l2: 'वीडियो', l3: 'ग्रुप प्रोजेक्ट', msg: 'कोई सुझाव?', msg_ph: 'यहाँ लिखें…',
          send: 'फ़ीडबैक भेजें', thanks: 'धन्यवाद', got: 'आपका फ़ीडबैक मिल गया।', log: 'फ़ीडबैक भेजा',
          c_js: 'फ़ॉर्म भेजने पर धन्यवाद का संदेश दिखाएँ।', c_prevent: 'इसी पेज पर रहें'
        }
      },
      card: {
        name: 'CSS प्रोफ़ाइल कार्ड',
        tips: ['.card का border-radius 0 करके देखें कि क्या होता है।', 'font-size से अवतार को बड़ा करें।'],
        t: {
          title: 'प्रोफ़ाइल कार्ड', name: 'अनन्या वर्मा', role: 'कक्षा 9 · साइंस क्लब कैप्टन',
          bio: 'मुझे रोबोट बनाना और तारे देखना पसंद है। मेरा सपना इसरो में काम करना है।',
          s1: 'प्रोजेक्ट', s2: 'मेडल', s3: 'रोबोट', follow: 'फ़ॉलो करें', following: 'फ़ॉलो कर रहे हैं ✓',
          c_css: 'नीचे की संख्याएँ और रंग बदलकर देखें।',
          c_js: 'बटन को "फ़ॉलो करें" और "फ़ॉलो कर रहे हैं" के बीच बदलें।'
        }
      },
      colorbtn: {
        name: 'रंग बदलने वाला बटन',
        tips: ['दोनों लिस्ट में एक और रंग और उसका नाम जोड़ें।', 'if का इस्तेमाल करके 10 क्लिक के बाद बटन का टेक्स्ट बदलें।'],
        t: {
          title: 'जादुई बटन', h1: 'जादुई बटन', intro: 'बटन पर क्लिक करें। JavaScript हर बार उसका रंग बदल देता है।',
          btn: 'मुझे क्लिक करो!', clicks: 'क्लिक:', colour: 'रंग:',
          c1: 'केसरिया', c2: 'हरा', c3: 'गहरा नीला', c4: 'गुलाबी', c5: 'बैंगनी', c6: 'फ़िरोज़ी',
          c_list: 'रंगों की एक लिस्ट (array) और उनके नामों की एक लिस्ट',
          c_mod: '% शेषफल देता है, इसलिए रंग दोहराते रहते हैं'
        }
      },
      calc: {
        name: 'सरल कैलकुलेटर',
        tips: ['% (शेषफल) के लिए एक बटन जोड़ें।', '0 से भाग देकर देखें। कोड की कौन-सी लाइनें इसे संभालती हैं?'],
        t: {
          title: 'कैलकुलेटर', h1: 'सरल कैलकुलेटर', first: 'पहली संख्या', second: 'दूसरी संख्या', answer: 'उत्तर:',
          empty: 'कृपया दोनों संख्याएँ लिखें', zero: '0 से भाग नहीं दे सकते',
          c_js: 'दोनों संख्याएँ पढ़ें, हिसाब करें और उत्तर दिखाएँ।',
          c_number: 'Number() टेक्स्ट को संख्या में बदलता है'
        }
      },
      quiz: {
        name: 'क्विज़ पेज',
        tips: ['लिस्ट में अपना ख़ुद का एक सवाल जोड़ें।', 'CSS में .right और .wrong के रंग बदलें।'],
        t: {
          title: 'क्विज़', h1: 'झटपट क्विज़',
          q1: 'भारत की राजधानी क्या है?', q1a: 'मुंबई', q1b: 'नई दिल्ली', q1c: 'कोलकाता',
          q2: 'हमारे सौरमंडल का सबसे बड़ा ग्रह कौन-सा है?', q2a: 'पृथ्वी', q2b: 'मंगल', q2c: 'बृहस्पति',
          q3: 'षट्भुज की कितनी भुजाएँ होती हैं?',
          q4: 'पौधे भोजन बनाने के लिए हवा से कौन-सी गैस लेते हैं?', q4a: 'ऑक्सीजन', q4b: 'कार्बन डाइऑक्साइड', q4c: 'नाइट्रोजन',
          right: 'सही जवाब! 🎉', wrong: 'ओह! सही जवाब है:', score: 'स्कोर:', next: 'अगला सवाल', again: 'फिर से खेलें',
          c_js: 'हर सवाल में उसका टेक्स्ट, विकल्प और सही विकल्प का नंबर है (गिनती 0 से शुरू)।'
        }
      },
      blank: {
        name: 'खाली पेज',
        tips: ['पहले एक हेडिंग और एक पैराग्राफ़ लिखें, फिर और टैग जोड़ें।', 'टैग, स्टाइल और कोड जोड़ने के लिए नीचे की चीट-शीट इस्तेमाल करें।'],
        t: { title: 'मेरा वेब पेज', h1: 'मेरा वेब पेज', p: 'यहाँ लिखना शुरू करें।', c_js: 'अपना JavaScript यहाँ लिखें।' }
      }
    },
    cheat: {
      html: [
        'हेडिंग। h1 सबसे बड़ी और सबसे ज़रूरी होती है, h6 सबसे छोटी।',
        'टेक्स्ट का एक पैराग्राफ़।',
        'br नई लाइन शुरू करता है; hr पेज पर एक आड़ी लाइन खींचता है। इन्हें बंद करने की ज़रूरत नहीं।',
        'strong शब्दों को मोटा और ज़रूरी बनाता है; em उन्हें तिरछा बनाता है।',
        'दूसरे पेज का लिंक। href उसका पता है।',
        'तस्वीर दिखाता है। alt उन लोगों के लिए तस्वीर का वर्णन है जो देख नहीं सकते।',
        'बुलेट वाली लिस्ट। हर आइटम li के अंदर जाता है।',
        'नंबर वाली लिस्ट: 1, 2, 3…',
        'टेबल। tr एक पंक्ति है, th हेडिंग वाला खाना और td सामान्य खाना।',
        'एक डिब्बा जो दूसरे टैग को साथ रखता है, ताकि उन्हें एक साथ स्टाइल कर सकें।',
        'लाइन के अंदर कुछ शब्दों को चिह्नित करता है, जैसे उन्हें रंगने के लिए।',
        'एक बटन। क्लिक होने पर JavaScript कुछ कर सकता है।',
        'लिखने का बॉक्स, उसके लेबल के साथ। type हो सकता है text, number, date, color…',
        'विकल्पों की ड्रॉप-डाउन लिस्ट।',
        'कई लाइनें लिखने के लिए बड़ा बॉक्स।',
        'पेज के हिस्सों को नाम देता है: ऊपर, मुख्य सामग्री और नीचे।',
        'कमेंट: लोगों के लिए एक नोट। ब्राउज़र इसे नहीं दिखाता।'
      ],
      css: [
        'टेक्स्ट का रंग। नाम (red), hex कोड (#ff9933) या rgb() लिखें।',
        'एलिमेंट के पीछे का रंग।',
        'अक्षरों का साइज़।',
        'फ़ॉन्ट (अक्षरों की शैली)। पहला न मिले तो काम आए, इसलिए दूसरा भी लिखें।',
        'टेक्स्ट को बाएँ, दाएँ या बीच में रखता है।',
        'एलिमेंट के बाहर की जगह, उसके और पड़ोसियों के बीच।',
        'एलिमेंट के अंदर की जगह, उसकी बॉर्डर और सामग्री के बीच।',
        'एलिमेंट के चारों ओर एक लाइन: मोटाई, शैली और रंग।',
        'कोनों को गोल करता है। 50% से चौकोर गोला बन जाता है।',
        'एलिमेंट का साइज़। % का मतलब आसपास की जगह का एक हिस्सा।',
        'अंदर के एलिमेंट को अगल-बगल रखता है। gap उनके बीच जगह छोड़ता है।',
        'हल्की परछाईं जोड़ता है, जिससे एलिमेंट उभरा हुआ लगता है।',
        'ऐसा स्टाइल जो सिर्फ़ तब लगता है जब माउस एलिमेंट के ऊपर हो।',
        '.note हर उस एलिमेंट को चुनता है जिसमें class="note" है; #title उसे चुनता है जिसकी id="title" है।',
        'छोटी स्क्रीन, जैसे फ़ोन, के लिए अलग स्टाइल।'
      ],
      js: [
        'कंसोल में कोई वैल्यू लिखता है। अपना कोड जाँचने के लिए बहुत काम का।',
        'वैल्यू रखने के लिए वेरिएबल बनाता है। const को बाद में बदला नहीं जा सकता।',
        'कोड तभी चलता है जब शर्त सही हो; ग़लत होने पर else वाला चलता है।',
        'कोड को दोहराता है। यह लूप 1 से 5 तक गिनता है।',
        'कोड का नाम वाला हिस्सा, जिसे बार-बार इस्तेमाल कर सकते हैं।',
        'उस HTML एलिमेंट को ढूँढता है जिसकी यह id है।',
        '".note" या "h1" जैसे CSS सिलेक्टर से मेल खाने वाला पहला एलिमेंट ढूँढता है।',
        'एलिमेंट के अंदर का टेक्स्ट पढ़ता या बदलता है।',
        'JavaScript से एलिमेंट की CSS बदलता है।',
        'कुछ होने पर, जैसे क्लिक, एक फ़ंक्शन चलाता है।',
        'इनपुट बॉक्स में लिखा टेक्स्ट। Number(box.value) उसे संख्या बनाता है।',
        'alert() एक पॉप-अप संदेश दिखाता है; prompt() यूज़र से जवाब लिखवाता है।',
        'एक रैंडम संख्या देता है। यह उदाहरण पासा फेंकता है: 1 से 6।',
        'वैल्यू की एक लिस्ट। colours[0] पहला आइटम है और colours.length बताता है कि कुल कितने हैं।'
      ]
    }
  },

  bn: {
    tpl: {
      first: {
        name: 'আমার প্রথম পেজ',
        tips: ['নাম, শখ আর লক্ষ্য বদলে নিজের কথা লিখুন।', 'CSS-এ h1-এর রং বদলান, যেমন color: green;'],
        t: {
          title: 'আমার কথা', h1: 'নমস্কার, আমি রিয়া বসু 👋', photo_alt: 'রিয়ার ছবি',
          intro: 'আমি পশ্চিমবঙ্গের কলকাতায় সপ্তম শ্রেণিতে পড়ি। গল্প, আঁকা আর কম্পিউটার আমার খুব ভালো লাগে।',
          h_hobbies: 'আমার শখ', hobby1: 'ক্রিকেট খেলা 🏏', hobby2: 'আঁকা আর রং করা 🎨', hobby3: 'কমিকস পড়া 📚',
          h_goals: 'এই বছরে আমার লক্ষ্য', goal1: '12টি নতুন বই পড়া', goal2: 'নিজের একটা ওয়েবসাইট বানানো',
          fav: 'আমার প্রিয় বিষয় <strong>বিজ্ঞান</strong>। এখন আমি <em>HTML</em> শিখছি!',
          footer: 'রিয়া HTML আর CSS দিয়ে বানিয়েছে 💻',
          c_html: 'ট্যাগের মাঝের লেখা বদলান আর প্রিভিউ বদলাতে দেখুন।',
          c_css: 'CSS রং, মাপ আর ফাঁকা জায়গা ঠিক করে।',
          c_js: 'এই লাইনটি কনসোলে একটি বার্তা লেখে।',
          log: 'নমস্কার! আমার পেজ তৈরি।'
        }
      },
      timetable: {
        name: 'আমার রুটিন',
        tips: ['পিরিয়ড 6-এর জন্য একটি নতুন সারি যোগ করুন।', 'CSS-এ th ঘরগুলোর পেছনের রং বদলান।'],
        t: {
          title: 'আমার রুটিন', h1: 'আমার ক্লাসের রুটিন', caption: 'সপ্তম শ্রেণি, খ বিভাগ', period: 'পিরিয়ড',
          mon: 'সোম', tue: 'মঙ্গল', wed: 'বুধ', thu: 'বৃহঃ', fri: 'শুক্র', sat: 'শনি',
          maths: 'গণিত', science: 'বিজ্ঞান', english: 'ইংরেজি', lang_sub: 'বাংলা', sst: 'সমাজবিজ্ঞান',
          computer: 'কম্পিউটার', art: 'আঁকা', games: 'খেলা', lunch: 'টিফিনের ছুটি',
          c_scroll: 'ছোট স্ক্রিনে টেবিলটি পাশে সরানো যায়',
          c_html: 'tr = সারি, th = শিরোনামের ঘর, td = ঘর। colspan কয়েকটি ঘর জুড়ে দেয়।',
          c_js: 'আজকের দিনের কলামটি হাইলাইট করুন (রবিবার কিছুই হাইলাইট হয় না)।'
        }
      },
      form: {
        name: 'মতামতের ফর্ম',
        tips: ['select বক্স দিয়ে একটি নতুন প্রশ্ন যোগ করুন, যেমন আপনার প্রিয় বিষয়।', '"মতামত পাঠান" চাপুন আর কনসোল দেখুন।'],
        t: {
          title: 'মতামতের ফর্ম', h1: 'ক্লাসের মতামত', intro: 'আজকের কম্পিউটার ক্লাস কেমন লাগল, জানান।',
          name: 'আপনার নাম', name_ph: 'যেমন আরব', cls: 'শ্রেণি', rating: 'ক্লাস কেমন হলো?',
          r5: 'খুব ভালো', r3: 'মোটামুটি', r1: 'কঠিন', liked: 'কী ভালো লাগল?',
          l1: 'খেলা', l2: 'ভিডিও', l3: 'দলের প্রজেক্ট', msg: 'কোনো পরামর্শ?', msg_ph: 'এখানে লিখুন…',
          send: 'মতামত পাঠান', thanks: 'ধন্যবাদ', got: 'আপনার মতামত পেয়েছি।', log: 'মতামত দিয়েছে',
          c_js: 'ফর্ম পাঠালে ধন্যবাদের বার্তা দেখান।', c_prevent: 'এই পেজেই থাকুন'
        }
      },
      card: {
        name: 'CSS প্রোফাইল কার্ড',
        tips: ['.card-এর border-radius 0 করে দেখুন কী হয়।', 'font-size দিয়ে অবতারটি বড় করুন।'],
        t: {
          title: 'প্রোফাইল কার্ড', name: 'অনন্যা সেন', role: 'নবম শ্রেণি · বিজ্ঞান ক্লাবের ক্যাপ্টেন',
          bio: 'রোবট বানাতে আর তারা দেখতে আমার ভালো লাগে। আমার স্বপ্ন ইসরোতে কাজ করা।',
          s1: 'প্রজেক্ট', s2: 'পদক', s3: 'রোবট', follow: 'ফলো করুন', following: 'ফলো করছেন ✓',
          c_css: 'নিচের সংখ্যা আর রংগুলো বদলে দেখুন।',
          c_js: 'বোতামটিকে "ফলো করুন" আর "ফলো করছেন"-এর মধ্যে বদলান।'
        }
      },
      colorbtn: {
        name: 'রং-বদলানো বোতাম',
        tips: ['দুটি তালিকাতেই আরও একটি রং আর তার নাম যোগ করুন।', 'if ব্যবহার করে 10 বার ক্লিকের পর বোতামের লেখা বদলান।'],
        t: {
          title: 'জাদুর বোতাম', h1: 'জাদুর বোতাম', intro: 'বোতামে ক্লিক করুন। JavaScript প্রতিবার তার রং বদলে দেয়।',
          btn: 'আমায় ক্লিক করো!', clicks: 'ক্লিক:', colour: 'রং:',
          c1: 'গেরুয়া', c2: 'সবুজ', c3: 'গাঢ় নীল', c4: 'গোলাপি', c5: 'বেগুনি', c6: 'নীলচে সবুজ',
          c_list: 'রঙের একটি তালিকা (array) আর তাদের নামের একটি তালিকা',
          c_mod: '% ভাগশেষ দেয়, তাই রংগুলো ঘুরে ঘুরে আসে'
        }
      },
      calc: {
        name: 'সহজ ক্যালকুলেটর',
        tips: ['% (ভাগশেষ)-এর জন্য একটি বোতাম যোগ করুন।', '0 দিয়ে ভাগ করে দেখুন। কোডের কোন লাইনগুলো এটা সামলায়?'],
        t: {
          title: 'ক্যালকুলেটর', h1: 'সহজ ক্যালকুলেটর', first: 'প্রথম সংখ্যা', second: 'দ্বিতীয় সংখ্যা', answer: 'উত্তর:',
          empty: 'দুটো সংখ্যাই লিখুন', zero: '0 দিয়ে ভাগ করা যায় না',
          c_js: 'দুটি সংখ্যা পড়ুন, হিসাব করুন আর উত্তর দেখান।',
          c_number: 'Number() লেখাকে সংখ্যায় বদলায়'
        }
      },
      quiz: {
        name: 'কুইজ পেজ',
        tips: ['তালিকায় নিজের একটি প্রশ্ন যোগ করুন।', 'CSS-এ .right আর .wrong-এর রং বদলান।'],
        t: {
          title: 'কুইজ', h1: 'ঝটপট কুইজ',
          q1: 'ভারতের রাজধানী কোনটি?', q1a: 'মুম্বই', q1b: 'নতুন দিল্লি', q1c: 'কলকাতা',
          q2: 'আমাদের সৌরজগতের সবচেয়ে বড় গ্রহ কোনটি?', q2a: 'পৃথিবী', q2b: 'মঙ্গল', q2c: 'বৃহস্পতি',
          q3: 'ষড়ভুজের কটি বাহু থাকে?',
          q4: 'খাবার তৈরি করতে গাছ বাতাস থেকে কোন গ্যাস নেয়?', q4a: 'অক্সিজেন', q4b: 'কার্বন ডাই-অক্সাইড', q4c: 'নাইট্রোজেন',
          right: 'ঠিক উত্তর! 🎉', wrong: 'উফ! সঠিক উত্তর হলো:', score: 'স্কোর:', next: 'পরের প্রশ্ন', again: 'আবার খেলুন',
          c_js: 'প্রতিটি প্রশ্নে আছে তার লেখা, বিকল্পগুলো আর সঠিক বিকল্পের নম্বর (গোনা শুরু 0 থেকে)।'
        }
      },
      blank: {
        name: 'ফাঁকা পেজ',
        tips: ['প্রথমে একটি হেডিং আর একটি অনুচ্ছেদ লিখুন, তারপর আরও ট্যাগ যোগ করুন।', 'ট্যাগ, স্টাইল আর কোড যোগ করতে নিচের চিট-শিট ব্যবহার করুন।'],
        t: { title: 'আমার ওয়েব পেজ', h1: 'আমার ওয়েব পেজ', p: 'এখানে লেখা শুরু করুন।', c_js: 'আপনার JavaScript এখানে লিখুন।' }
      }
    },
    cheat: {
      html: [
        'হেডিং। h1 সবচেয়ে বড় আর সবচেয়ে গুরুত্বপূর্ণ, h6 সবচেয়ে ছোট।',
        'লেখার একটি অনুচ্ছেদ।',
        'br নতুন লাইন শুরু করে; hr পেজ জুড়ে একটি দাগ টানে। এদের বন্ধ করার ট্যাগ লাগে না।',
        'strong শব্দকে মোটা আর গুরুত্বপূর্ণ করে; em তাকে বাঁকা করে।',
        'অন্য পেজের লিংক। href হলো তার ঠিকানা।',
        'ছবি দেখায়। যাঁরা দেখতে পান না, তাঁদের জন্য alt ছবিটির বর্ণনা দেয়।',
        'বুলেট দেওয়া তালিকা। প্রতিটি আইটেম li-এর ভেতরে থাকে।',
        'নম্বর দেওয়া তালিকা: 1, 2, 3…',
        'একটি টেবিল। tr হলো সারি, th শিরোনামের ঘর আর td সাধারণ ঘর।',
        'একটি বাক্স যা অন্য ট্যাগগুলোকে একসঙ্গে রাখে, যাতে একসঙ্গে স্টাইল করা যায়।',
        'লাইনের ভেতরে কয়েকটি শব্দকে চিহ্নিত করে, যেমন রং দেওয়ার জন্য।',
        'একটি বোতাম। ক্লিক করলে JavaScript কিছু করতে পারে।',
        'লেখার বাক্স, তার লেবেল সহ। type হতে পারে text, number, date, color…',
        'বিকল্পের একটি ড্রপ-ডাউন তালিকা।',
        'অনেক লাইন লেখার জন্য বড় বাক্স।',
        'পেজের অংশগুলোর নাম দেয়: ওপর, মূল অংশ আর নিচ।',
        'কমেন্ট: মানুষের জন্য একটি নোট। ব্রাউজার এটি দেখায় না।'
      ],
      css: [
        'লেখার রং। নাম (red), hex কোড (#ff9933) বা rgb() লিখুন।',
        'এলিমেন্টের পেছনের রং।',
        'অক্ষরের মাপ।',
        'ফন্ট (অক্ষরের ধরন)। প্রথমটি না পেলে কাজে লাগবে, তাই দ্বিতীয় একটিও লিখুন।',
        'লেখাকে বাঁয়ে, ডাইনে বা মাঝখানে সাজায়।',
        'এলিমেন্টের বাইরের ফাঁকা জায়গা, তার আর পাশের জিনিসের মাঝে।',
        'এলিমেন্টের ভেতরের ফাঁকা জায়গা, বর্ডার আর ভেতরের লেখার মাঝে।',
        'এলিমেন্টের চারপাশে একটি দাগ: কতটা মোটা, কী ধরন আর কী রং।',
        'কোণগুলো গোল করে। 50% দিলে চৌকো জিনিস গোল হয়ে যায়।',
        'এলিমেন্টের মাপ। % মানে চারপাশের জায়গার একটি অংশ।',
        'ভেতরের এলিমেন্টগুলোকে পাশাপাশি রাখে। gap তাদের মাঝে ফাঁক দেয়।',
        'হালকা ছায়া দেয়, তাই এলিমেন্টটি একটু উঁচু মনে হয়।',
        'এমন স্টাইল যা শুধু মাউস এলিমেন্টের ওপর থাকলেই লাগে।',
        '.note বেছে নেয় class="note" থাকা সব এলিমেন্ট; #title বেছে নেয় id="title" থাকা এলিমেন্টটি।',
        'ফোনের মতো ছোট স্ক্রিনের জন্য আলাদা স্টাইল।'
      ],
      js: [
        'কনসোলে একটি মান লেখে। নিজের কোড যাচাই করতে খুব কাজের।',
        'মান রাখার জন্য একটি ভেরিয়েবল বানায়। const পরে বদলানো যায় না।',
        'শর্ত সত্যি হলে তবেই কোড চলে; মিথ্যে হলে else চলে।',
        'কোড বারবার চালায়। এই লুপ 1 থেকে 5 পর্যন্ত গোনে।',
        'নাম দেওয়া একটি কোডের অংশ, যা বারবার ব্যবহার করা যায়।',
        'যে HTML এলিমেন্টের এই id আছে, সেটিকে খুঁজে দেয়।',
        '".note" বা "h1"-এর মতো CSS সিলেক্টরের সঙ্গে মেলে এমন প্রথম এলিমেন্ট খুঁজে দেয়।',
        'এলিমেন্টের ভেতরের লেখা পড়ে বা বদলায়।',
        'JavaScript থেকে এলিমেন্টের CSS বদলায়।',
        'কিছু ঘটলে, যেমন ক্লিক করলে, একটি ফাংশন চালায়।',
        'ইনপুট বাক্সে লেখা জিনিস। Number(box.value) সেটিকে সংখ্যা বানায়।',
        'alert() একটি পপ-আপ বার্তা দেখায়; prompt() ব্যবহারকারীকে উত্তর লিখতে বলে।',
        'একটি এলোমেলো সংখ্যা দেয়। এই উদাহরণে ছক্কা চালা হয়: 1 থেকে 6।',
        'মানের একটি তালিকা। colours[0] হলো প্রথম আইটেম আর colours.length বলে মোট কটি আছে।'
      ]
    }
  },

  mr: {
    tpl: {
      first: {
        name: 'माझे पहिले पेज',
        tips: ['नाव, छंद आणि ध्येये बदलून स्वतःची लिहा.', 'CSS मध्ये h1 चा रंग बदला, उदा. color: green;'],
        t: {
          title: 'माझ्याबद्दल', h1: 'नमस्कार, मी रिया देशपांडे 👋', photo_alt: 'रियाचे चित्र',
          intro: 'मी पुणे, महाराष्ट्र येथे सातवीत शिकते. मला गोष्टी, चित्रकला आणि कॉम्प्युटर खूप आवडतात.',
          h_hobbies: 'माझे छंद', hobby1: 'क्रिकेट खेळणे 🏏', hobby2: 'चित्र काढणे आणि रंगवणे 🎨', hobby3: 'कॉमिक्स वाचणे 📚',
          h_goals: 'या वर्षीची माझी ध्येये', goal1: '12 नवीन पुस्तके वाचणे', goal2: 'माझी स्वतःची वेबसाइट बनवणे',
          fav: 'माझा आवडता विषय <strong>विज्ञान</strong> आहे. आता मी <em>HTML</em> शिकत आहे!',
          footer: 'रियाने HTML आणि CSS वापरून बनवले 💻',
          c_html: 'टॅगमधले शब्द बदला आणि प्रिव्ह्यू बदलताना पाहा.',
          c_css: 'CSS रंग, आकार आणि जागा ठरवते.',
          c_js: 'ही ओळ कन्सोलमध्ये एक संदेश लिहिते.',
          log: 'नमस्कार! माझे पेज तयार आहे.'
        }
      },
      timetable: {
        name: 'माझे वेळापत्रक',
        tips: ['तासिका 6 साठी एक नवी ओळ जोडा.', 'CSS मध्ये th कप्प्यांचा पार्श्वरंग बदला.'],
        t: {
          title: 'माझे वेळापत्रक', h1: 'माझ्या वर्गाचे वेळापत्रक', caption: 'इयत्ता 7 ब', period: 'तासिका',
          mon: 'सोम', tue: 'मंगळ', wed: 'बुध', thu: 'गुरु', fri: 'शुक्र', sat: 'शनि',
          maths: 'गणित', science: 'विज्ञान', english: 'इंग्रजी', lang_sub: 'मराठी', sst: 'सामाजिक शास्त्र',
          computer: 'कॉम्प्युटर', art: 'कला', games: 'खेळ', lunch: 'मधली सुट्टी',
          c_scroll: 'लहान स्क्रीनवर टेबल आडवे सरकवता येते',
          c_html: 'tr = ओळ, th = शीर्षक कप्पा, td = कप्पा. colspan कप्पे जोडते.',
          c_js: 'आजच्या दिवसाचा स्तंभ हायलाइट करा (रविवारी काहीच हायलाइट होत नाही).'
        }
      },
      form: {
        name: 'अभिप्राय फॉर्म',
        tips: ['select बॉक्ससह एक नवा प्रश्न जोडा, उदा. तुमचा आवडता विषय.', '"अभिप्राय पाठवा" दाबा आणि कन्सोल पाहा.'],
        t: {
          title: 'अभिप्राय फॉर्म', h1: 'वर्ग अभिप्राय', intro: 'आजचा कॉम्प्युटरचा तास तुम्हाला कसा वाटला ते सांगा.',
          name: 'तुमचे नाव', name_ph: 'उदा. आरव', cls: 'इयत्ता', rating: 'तास कसा झाला?',
          r5: 'खूप छान', r3: 'ठीक', r1: 'अवघड', liked: 'तुम्हाला काय आवडले?',
          l1: 'खेळ', l2: 'व्हिडिओ', l3: 'गट प्रोजेक्ट', msg: 'काही सूचना?', msg_ph: 'इथे लिहा…',
          send: 'अभिप्राय पाठवा', thanks: 'धन्यवाद', got: 'तुमचा अभिप्राय मिळाला.', log: 'अभिप्राय पाठवला',
          c_js: 'फॉर्म पाठवल्यावर धन्यवादाचा संदेश दाखवा.', c_prevent: 'याच पेजवर राहा'
        }
      },
      card: {
        name: 'CSS प्रोफाइल कार्ड',
        tips: ['.card चा border-radius 0 करून काय होते ते पाहा.', 'font-size वापरून अवतार मोठा करा.'],
        t: {
          title: 'प्रोफाइल कार्ड', name: 'अनन्या जोशी', role: 'इयत्ता 9 · विज्ञान मंडळ प्रमुख',
          bio: 'मला रोबोट बनवायला आणि तारे पाहायला आवडते. इस्रोमध्ये काम करणे हे माझे स्वप्न आहे.',
          s1: 'प्रोजेक्ट', s2: 'पदके', s3: 'रोबोट', follow: 'फॉलो करा', following: 'फॉलो करत आहात ✓',
          c_css: 'खालील संख्या आणि रंग बदलून पाहा.',
          c_js: 'बटण "फॉलो करा" आणि "फॉलो करत आहात" यांच्यात बदला.'
        }
      },
      colorbtn: {
        name: 'रंग बदलणारे बटण',
        tips: ['दोन्ही यादीत आणखी एक रंग आणि त्याचे नाव जोडा.', 'if वापरून 10 क्लिकनंतर बटणावरचा मजकूर बदला.'],
        t: {
          title: 'जादूचे बटण', h1: 'जादूचे बटण', intro: 'बटणावर क्लिक करा. JavaScript प्रत्येक वेळी त्याचा रंग बदलते.',
          btn: 'मला क्लिक करा!', clicks: 'क्लिक:', colour: 'रंग:',
          c1: 'केशरी', c2: 'हिरवा', c3: 'गडद निळा', c4: 'गुलाबी', c5: 'जांभळा', c6: 'मोरपंखी',
          c_list: 'रंगांची एक यादी (array) आणि त्यांच्या नावांची एक यादी',
          c_mod: '% बाकी देते, म्हणून रंग पुन्हा पुन्हा येतात'
        }
      },
      calc: {
        name: 'सोपे कॅल्क्युलेटर',
        tips: ['% (बाकी) साठी एक बटण जोडा.', '0 ने भागून पाहा. कोडमधल्या कोणत्या ओळी हे सांभाळतात?'],
        t: {
          title: 'कॅल्क्युलेटर', h1: 'सोपे कॅल्क्युलेटर', first: 'पहिली संख्या', second: 'दुसरी संख्या', answer: 'उत्तर:',
          empty: 'कृपया दोन्ही संख्या लिहा', zero: '0 ने भागता येत नाही',
          c_js: 'दोन संख्या वाचा, गणित करा आणि उत्तर दाखवा.',
          c_number: 'Number() मजकुराला संख्येत बदलते'
        }
      },
      quiz: {
        name: 'प्रश्नमंजूषा पेज',
        tips: ['यादीत तुमचा स्वतःचा एक प्रश्न जोडा.', 'CSS मध्ये .right आणि .wrong चे रंग बदला.'],
        t: {
          title: 'प्रश्नमंजूषा', h1: 'झटपट प्रश्नमंजूषा',
          q1: 'भारताची राजधानी कोणती?', q1a: 'मुंबई', q1b: 'नवी दिल्ली', q1c: 'कोलकाता',
          q2: 'आपल्या सूर्यमालेतील सर्वात मोठा ग्रह कोणता?', q2a: 'पृथ्वी', q2b: 'मंगळ', q2c: 'गुरू',
          q3: 'षटकोनाला किती बाजू असतात?',
          q4: 'अन्न तयार करण्यासाठी वनस्पती हवेतून कोणता वायू घेतात?', q4a: 'ऑक्सिजन', q4b: 'कार्बन डायऑक्साइड', q4c: 'नायट्रोजन',
          right: 'बरोबर! 🎉', wrong: 'अरेरे! बरोबर उत्तर आहे:', score: 'गुण:', next: 'पुढचा प्रश्न', again: 'पुन्हा खेळा',
          c_js: 'प्रत्येक प्रश्नात त्याचा मजकूर, पर्याय आणि बरोबर पर्यायाचा क्रमांक आहे (मोजणी 0 पासून).'
        }
      },
      blank: {
        name: 'कोरे पेज',
        tips: ['आधी एक हेडिंग आणि एक परिच्छेद लिहा, मग आणखी टॅग जोडा.', 'टॅग, स्टाइल आणि कोड जोडण्यासाठी खालची चीट-शीट वापरा.'],
        t: { title: 'माझे वेब पेज', h1: 'माझे वेब पेज', p: 'इथे लिहायला सुरुवात करा.', c_js: 'तुमचे JavaScript इथे लिहा.' }
      }
    },
    cheat: {
      html: [
        'हेडिंग. h1 सर्वात मोठे आणि सर्वात महत्त्वाचे, h6 सर्वात लहान.',
        'मजकुराचा एक परिच्छेद.',
        'br नवी ओळ सुरू करते; hr पेजवर आडवी रेषा काढते. यांना बंद करावे लागत नाही.',
        'strong शब्द ठळक आणि महत्त्वाचे करते; em ते तिरके करते.',
        'दुसऱ्या पेजची लिंक. href म्हणजे त्याचा पत्ता.',
        'चित्र दाखवते. ज्यांना दिसत नाही त्यांच्यासाठी alt चित्राचे वर्णन करते.',
        'बुलेट असलेली यादी. प्रत्येक मुद्दा li मध्ये जातो.',
        'क्रमांक असलेली यादी: 1, 2, 3…',
        'टेबल. tr म्हणजे ओळ, th म्हणजे शीर्षक कप्पा आणि td म्हणजे साधा कप्पा.',
        'इतर टॅग एकत्र ठेवणारा डबा, म्हणजे त्यांना एकत्र स्टाइल करता येते.',
        'ओळीतले काही शब्द वेगळे खुणावते, उदा. त्यांना रंग देण्यासाठी.',
        'एक बटण. ते क्लिक केल्यावर JavaScript काहीतरी करू शकते.',
        'टाइप करण्याचा बॉक्स, त्याच्या लेबलसह. type असू शकतो text, number, date, color…',
        'पर्यायांची ड्रॉप-डाउन यादी.',
        'अनेक ओळी लिहिण्यासाठी मोठा बॉक्स.',
        'पेजच्या भागांना नावे देते: वरचा भाग, मुख्य मजकूर आणि खालचा भाग.',
        'कमेंट: माणसांसाठी एक टीप. ब्राउझर ती दाखवत नाही.'
      ],
      css: [
        'मजकुराचा रंग. नाव (red), hex कोड (#ff9933) किंवा rgb() वापरा.',
        'एलिमेंटच्या मागचा रंग.',
        'अक्षरांचा आकार.',
        'फॉन्ट (अक्षरांची शैली). पहिला नसल्यास दुसरा कामी येईल, म्हणून दुसराही लिहा.',
        'मजकूर डावीकडे, उजवीकडे किंवा मध्यभागी ठेवते.',
        'एलिमेंटच्या बाहेरची जागा, त्याच्या आणि शेजारच्यांच्या मध्ये.',
        'एलिमेंटच्या आतली जागा, त्याची बॉर्डर आणि मजकूर यांच्या मध्ये.',
        'एलिमेंटभोवती रेषा: जाडी, शैली आणि रंग.',
        'कोपरे गोल करते. 50% दिल्यास चौकोनाचे वर्तुळ होते.',
        'एलिमेंटचा आकार. % म्हणजे आजूबाजूच्या जागेचा एक भाग.',
        'आतले एलिमेंट शेजारी शेजारी ठेवते. gap त्यांच्यात जागा सोडते.',
        'हलकी सावली देते, त्यामुळे एलिमेंट उठून दिसतो.',
        'माउस एलिमेंटवर असतानाच लागणारी स्टाइल.',
        '.note हे class="note" असलेले सर्व एलिमेंट निवडते; #title हे id="title" असलेला एलिमेंट निवडते.',
        'फोनसारख्या लहान स्क्रीनसाठी वेगळ्या स्टाइल.'
      ],
      js: [
        'कन्सोलमध्ये किंमत लिहिते. आपला कोड तपासण्यासाठी खूप उपयोगी.',
        'किंमत साठवण्यासाठी व्हेरिएबल बनवते. const नंतर बदलता येत नाही.',
        'अट खरी असेल तेव्हाच कोड चालतो; खोटी असेल तर else चालते.',
        'कोड पुन्हा पुन्हा चालवतो. हा लूप 1 ते 5 मोजतो.',
        'नाव दिलेला कोडचा भाग, जो पुन्हा पुन्हा वापरता येतो.',
        'ज्या HTML एलिमेंटचा हा id आहे तो शोधते.',
        '".note" किंवा "h1" सारख्या CSS सिलेक्टरशी जुळणारा पहिला एलिमेंट शोधते.',
        'एलिमेंटमधला मजकूर वाचते किंवा बदलते.',
        'JavaScript मधून एलिमेंटची CSS बदलते.',
        'काही घडल्यावर, उदा. क्लिक, एक फंक्शन चालवते.',
        'इनपुट बॉक्समध्ये टाइप केलेला मजकूर. Number(box.value) त्याची संख्या करते.',
        'alert() पॉप-अप संदेश दाखवते; prompt() वापरकर्त्याला उत्तर टाइप करायला सांगते.',
        'एक यादृच्छिक संख्या देते. हे उदाहरण फासा टाकते: 1 ते 6.',
        'किंमतींची यादी. colours[0] हा पहिला मुद्दा आणि colours.length म्हणजे एकूण किती.'
      ]
    }
  },

  gu: {
    tpl: {
      first: {
        name: 'મારું પહેલું પેજ',
        tips: ['નામ, શોખ અને લક્ષ્ય બદલીને તમારાં પોતાનાં લખો.', 'CSS માં h1 નો રંગ બદલો, જેમ કે color: green;'],
        t: {
          title: 'મારા વિશે', h1: 'નમસ્તે, હું રિયા પટેલ છું 👋', photo_alt: 'રિયાનું ચિત્ર',
          intro: 'હું અમદાવાદ, ગુજરાતમાં ધોરણ 7 માં ભણું છું. મને વાર્તાઓ, ચિત્રકામ અને કમ્પ્યૂટર બહુ ગમે છે.',
          h_hobbies: 'મારા શોખ', hobby1: 'ક્રિકેટ રમવું 🏏', hobby2: 'ચિત્ર દોરવું અને રંગવું 🎨', hobby3: 'કૉમિક્સ વાંચવી 📚',
          h_goals: 'આ વર્ષનાં મારાં લક્ષ્ય', goal1: '12 નવાં પુસ્તક વાંચવાં', goal2: 'મારી પોતાની વેબસાઇટ બનાવવી',
          fav: 'મારો મનપસંદ વિષય <strong>વિજ્ઞાન</strong> છે. હવે હું <em>HTML</em> શીખું છું!',
          footer: 'રિયાએ HTML અને CSS થી બનાવ્યું 💻',
          c_html: 'ટૅગની વચ્ચેના શબ્દો બદલો અને પ્રિવ્યૂ બદલાતો જુઓ.',
          c_css: 'CSS રંગ, માપ અને જગ્યા નક્કી કરે છે.',
          c_js: 'આ લીટી કન્સોલમાં એક સંદેશ લખે છે.',
          log: 'નમસ્તે! મારું પેજ તૈયાર છે.'
        }
      },
      timetable: {
        name: 'મારું સમયપત્રક',
        tips: ['પિરિયડ 6 માટે નવી હરોળ ઉમેરો.', 'CSS માં th ખાનાંનો પાછળનો રંગ બદલો.'],
        t: {
          title: 'મારું સમયપત્રક', h1: 'મારા વર્ગનું સમયપત્રક', caption: 'ધોરણ 7 બ', period: 'પિરિયડ',
          mon: 'સોમ', tue: 'મંગળ', wed: 'બુધ', thu: 'ગુરુ', fri: 'શુક્ર', sat: 'શનિ',
          maths: 'ગણિત', science: 'વિજ્ઞાન', english: 'અંગ્રેજી', lang_sub: 'ગુજરાતી', sst: 'સામાજિક વિજ્ઞાન',
          computer: 'કમ્પ્યૂટર', art: 'ચિત્રકામ', games: 'રમતગમત', lunch: 'રિસેસ',
          c_scroll: 'નાની સ્ક્રીન પર ટેબલ આડું ખસે છે',
          c_html: 'tr = હરોળ, th = મથાળાનું ખાનું, td = ખાનું. colspan ખાનાં જોડે છે.',
          c_js: 'આજના દિવસનો કૉલમ હાઇલાઇટ કરો (રવિવારે કંઈ હાઇલાઇટ થતું નથી).'
        }
      },
      form: {
        name: 'પ્રતિભાવ ફોર્મ',
        tips: ['select બૉક્સ સાથે એક નવો પ્રશ્ન ઉમેરો, જેમ કે તમારો મનપસંદ વિષય.', '"પ્રતિભાવ મોકલો" દબાવો અને કન્સોલ જુઓ.'],
        t: {
          title: 'પ્રતિભાવ ફોર્મ', h1: 'વર્ગ પ્રતિભાવ', intro: 'આજનો કમ્પ્યૂટરનો પિરિયડ તમને કેવો લાગ્યો તે જણાવો.',
          name: 'તમારું નામ', name_ph: 'જેમ કે આરવ', cls: 'ધોરણ', rating: 'પિરિયડ કેવો રહ્યો?',
          r5: 'બહુ સરસ', r3: 'ઠીક', r1: 'અઘરો', liked: 'તમને શું ગમ્યું?',
          l1: 'રમતો', l2: 'વીડિયો', l3: 'જૂથ પ્રોજેક્ટ', msg: 'કોઈ સૂચન?', msg_ph: 'અહીં લખો…',
          send: 'પ્રતિભાવ મોકલો', thanks: 'આભાર', got: 'તમારો પ્રતિભાવ મળી ગયો.', log: 'પ્રતિભાવ મોકલનાર',
          c_js: 'ફોર્મ મોકલાય ત્યારે આભારનો સંદેશ બતાવો.', c_prevent: 'આ જ પેજ પર રહો'
        }
      },
      card: {
        name: 'CSS પ્રોફાઇલ કાર્ડ',
        tips: ['.card નો border-radius 0 કરીને જુઓ શું થાય છે.', 'font-size થી અવતાર મોટો કરો.'],
        t: {
          title: 'પ્રોફાઇલ કાર્ડ', name: 'અનન્યા શાહ', role: 'ધોરણ 9 · વિજ્ઞાન ક્લબ કૅપ્ટન',
          bio: 'મને રોબોટ બનાવવા અને તારા જોવા ગમે છે. ઇસરોમાં કામ કરવું એ મારું સપનું છે.',
          s1: 'પ્રોજેક્ટ', s2: 'મેડલ', s3: 'રોબોટ', follow: 'ફૉલો કરો', following: 'ફૉલો કરો છો ✓',
          c_css: 'નીચેની સંખ્યાઓ અને રંગ બદલીને જુઓ.',
          c_js: 'બટનને "ફૉલો કરો" અને "ફૉલો કરો છો" વચ્ચે બદલો.'
        }
      },
      colorbtn: {
        name: 'રંગ બદલતું બટન',
        tips: ['બંને યાદીમાં એક વધુ રંગ અને તેનું નામ ઉમેરો.', 'if વાપરીને 10 ક્લિક પછી બટનનું લખાણ બદલો.'],
        t: {
          title: 'જાદુઈ બટન', h1: 'જાદુઈ બટન', intro: 'બટન પર ક્લિક કરો. JavaScript દર વખતે તેનો રંગ બદલે છે.',
          btn: 'મને ક્લિક કરો!', clicks: 'ક્લિક:', colour: 'રંગ:',
          c1: 'કેસરી', c2: 'લીલો', c3: 'ઘેરો વાદળી', c4: 'ગુલાબી', c5: 'જાંબલી', c6: 'મોરપીંછ',
          c_list: 'રંગોની એક યાદી (array) અને તેમનાં નામની એક યાદી',
          c_mod: '% શેષ આપે છે, તેથી રંગો ફરી ફરી આવે છે'
        }
      },
      calc: {
        name: 'સરળ કૅલ્ક્યુલેટર',
        tips: ['% (શેષ) માટે એક બટન ઉમેરો.', '0 વડે ભાગાકાર કરી જુઓ. કોડની કઈ લીટીઓ તેને સંભાળે છે?'],
        t: {
          title: 'કૅલ્ક્યુલેટર', h1: 'સરળ કૅલ્ક્યુલેટર', first: 'પહેલી સંખ્યા', second: 'બીજી સંખ્યા', answer: 'જવાબ:',
          empty: 'મહેરબાની કરીને બંને સંખ્યા લખો', zero: '0 વડે ભાગી શકાય નહીં',
          c_js: 'બે સંખ્યા વાંચો, ગણતરી કરો અને જવાબ બતાવો.',
          c_number: 'Number() લખાણને સંખ્યામાં ફેરવે છે'
        }
      },
      quiz: {
        name: 'ક્વિઝ પેજ',
        tips: ['યાદીમાં તમારો પોતાનો એક પ્રશ્ન ઉમેરો.', 'CSS માં .right અને .wrong ના રંગ બદલો.'],
        t: {
          title: 'ક્વિઝ', h1: 'ઝટપટ ક્વિઝ',
          q1: 'ભારતની રાજધાની કઈ છે?', q1a: 'મુંબઈ', q1b: 'નવી દિલ્હી', q1c: 'કોલકાતા',
          q2: 'આપણા સૂર્યમંડળનો સૌથી મોટો ગ્રહ કયો છે?', q2a: 'પૃથ્વી', q2b: 'મંગળ', q2c: 'ગુરુ',
          q3: 'ષટ્કોણને કેટલી બાજુઓ હોય છે?',
          q4: 'ખોરાક બનાવવા છોડ હવામાંથી કયો વાયુ લે છે?', q4a: 'ઑક્સિજન', q4b: 'કાર્બન ડાયૉક્સાઇડ', q4c: 'નાઇટ્રોજન',
          right: 'સાચો જવાબ! 🎉', wrong: 'અરે! સાચો જવાબ છે:', score: 'સ્કોર:', next: 'આગલો પ્રશ્ન', again: 'ફરી રમો',
          c_js: 'દરેક પ્રશ્નમાં તેનું લખાણ, વિકલ્પો અને સાચા વિકલ્પનો નંબર છે (ગણતરી 0 થી).'
        }
      },
      blank: {
        name: 'કોરું પેજ',
        tips: ['પહેલાં એક હેડિંગ અને એક ફકરો લખો, પછી વધુ ટૅગ ઉમેરો.', 'ટૅગ, સ્ટાઇલ અને કોડ ઉમેરવા નીચેની ચીટ-શીટ વાપરો.'],
        t: { title: 'મારું વેબ પેજ', h1: 'મારું વેબ પેજ', p: 'અહીં લખવાનું શરૂ કરો.', c_js: 'તમારું JavaScript અહીં લખો.' }
      }
    },
    cheat: {
      html: [
        'હેડિંગ. h1 સૌથી મોટું અને સૌથી મહત્ત્વનું, h6 સૌથી નાનું.',
        'લખાણનો એક ફકરો.',
        'br નવી લીટી શરૂ કરે છે; hr પેજ પર આડી રેખા દોરે છે. તેમને બંધ કરવાની જરૂર નથી.',
        'strong શબ્દોને ઘાટા અને મહત્ત્વના બનાવે છે; em તેમને ત્રાંસા બનાવે છે.',
        'બીજા પેજની લિંક. href તેનું સરનામું છે.',
        'ચિત્ર બતાવે છે. જેઓ જોઈ શકતા નથી તેમના માટે alt ચિત્રનું વર્ણન કરે છે.',
        'બુલેટવાળી યાદી. દરેક મુદ્દો li ની અંદર જાય છે.',
        'નંબરવાળી યાદી: 1, 2, 3…',
        'ટેબલ. tr હરોળ છે, th મથાળાનું ખાનું અને td સામાન્ય ખાનું.',
        'બીજા ટૅગને સાથે રાખતું ખોખું, જેથી તેમને એકસાથે સ્ટાઇલ કરી શકાય.',
        'લીટીની અંદરના થોડા શબ્દોને અલગ પાડે છે, જેમ કે તેમને રંગવા માટે.',
        'એક બટન. તેના પર ક્લિક થાય ત્યારે JavaScript કંઈક કરી શકે છે.',
        'લખવા માટેનું બૉક્સ, તેના લેબલ સાથે. type હોઈ શકે text, number, date, color…',
        'વિકલ્પોની ડ્રૉપ-ડાઉન યાદી.',
        'ઘણી લીટીઓ લખવા માટેનું મોટું બૉક્સ.',
        'પેજના ભાગોને નામ આપે છે: ઉપરનો ભાગ, મુખ્ય લખાણ અને નીચેનો ભાગ.',
        'કમેન્ટ: લોકો માટેની નોંધ. બ્રાઉઝર તેને બતાવતું નથી.'
      ],
      css: [
        'લખાણનો રંગ. નામ (red), hex કોડ (#ff9933) કે rgb() વાપરો.',
        'એલિમેન્ટની પાછળનો રંગ.',
        'અક્ષરોનું માપ.',
        'ફૉન્ટ (અક્ષરોની શૈલી). પહેલો ન મળે તો કામ આવે તે માટે બીજો પણ લખો.',
        'લખાણને ડાબે, જમણે કે વચ્ચે ગોઠવે છે.',
        'એલિમેન્ટની બહારની જગ્યા, તેની અને પડોશીઓની વચ્ચે.',
        'એલિમેન્ટની અંદરની જગ્યા, તેની બૉર્ડર અને લખાણ વચ્ચે.',
        'એલિમેન્ટની આસપાસ રેખા: જાડાઈ, શૈલી અને રંગ.',
        'ખૂણા ગોળ કરે છે. 50% થી ચોરસ વર્તુળ બની જાય છે.',
        'એલિમેન્ટનું માપ. % એટલે આસપાસની જગ્યાનો એક ભાગ.',
        'અંદરના એલિમેન્ટને બાજુ-બાજુમાં ગોઠવે છે. gap તેમની વચ્ચે જગ્યા ઉમેરે છે.',
        'હળવો પડછાયો આપે છે, તેથી એલિમેન્ટ ઉપસેલો લાગે છે.',
        'માઉસ એલિમેન્ટ પર હોય ત્યારે જ લાગતી સ્ટાઇલ.',
        '.note એ class="note" વાળા બધા એલિમેન્ટ પસંદ કરે છે; #title એ id="title" વાળો એલિમેન્ટ પસંદ કરે છે.',
        'ફોન જેવી નાની સ્ક્રીન માટે અલગ સ્ટાઇલ.'
      ],
      js: [
        'કન્સોલમાં કિંમત લખે છે. તમારો કોડ તપાસવા માટે બહુ ઉપયોગી.',
        'કિંમત રાખવા વેરિએબલ બનાવે છે. const ને પછી બદલી શકાતો નથી.',
        'શરત સાચી હોય ત્યારે જ કોડ ચાલે છે; ખોટી હોય ત્યારે else ચાલે છે.',
        'કોડ વારંવાર ચલાવે છે. આ લૂપ 1 થી 5 સુધી ગણે છે.',
        'નામવાળો કોડનો ભાગ, જેને વારંવાર વાપરી શકાય.',
        'જે HTML એલિમેન્ટની આ id હોય તેને શોધે છે.',
        '".note" કે "h1" જેવા CSS સિલેક્ટર સાથે મેળ ખાતો પહેલો એલિમેન્ટ શોધે છે.',
        'એલિમેન્ટની અંદરનું લખાણ વાંચે છે કે બદલે છે.',
        'JavaScript થી એલિમેન્ટની CSS બદલે છે.',
        'કંઈક થાય ત્યારે, જેમ કે ક્લિક, એક ફંક્શન ચલાવે છે.',
        'ઇનપુટ બૉક્સમાં લખેલું લખાણ. Number(box.value) તેને સંખ્યા બનાવે છે.',
        'alert() પૉપ-અપ સંદેશ બતાવે છે; prompt() વાપરનારને જવાબ લખવા કહે છે.',
        'રેન્ડમ સંખ્યા આપે છે. આ ઉદાહરણ પાસો ફેંકે છે: 1 થી 6.',
        'કિંમતોની યાદી. colours[0] પહેલો મુદ્દો છે અને colours.length કુલ કેટલા છે તે કહે છે.'
      ]
    }
  },

  pa: {
    tpl: {
      first: {
        name: 'ਮੇਰਾ ਪਹਿਲਾ ਪੇਜ',
        tips: ['ਨਾਂ, ਸ਼ੌਕ ਅਤੇ ਟੀਚੇ ਬਦਲ ਕੇ ਆਪਣੇ ਲਿਖੋ।', 'CSS ਵਿੱਚ h1 ਦਾ ਰੰਗ ਬਦਲੋ, ਜਿਵੇਂ color: green;'],
        t: {
          title: 'ਮੇਰੇ ਬਾਰੇ', h1: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਰੀਆ ਕੌਰ ਹਾਂ 👋', photo_alt: 'ਰੀਆ ਦੀ ਤਸਵੀਰ',
          intro: 'ਮੈਂ ਲੁਧਿਆਣਾ, ਪੰਜਾਬ ਵਿੱਚ ਸੱਤਵੀਂ ਜਮਾਤ ਵਿੱਚ ਪੜ੍ਹਦੀ ਹਾਂ। ਮੈਨੂੰ ਕਹਾਣੀਆਂ, ਡਰਾਇੰਗ ਅਤੇ ਕੰਪਿਊਟਰ ਬਹੁਤ ਪਸੰਦ ਹਨ।',
          h_hobbies: 'ਮੇਰੇ ਸ਼ੌਕ', hobby1: 'ਕ੍ਰਿਕਟ ਖੇਡਣਾ 🏏', hobby2: 'ਡਰਾਇੰਗ ਅਤੇ ਪੇਂਟਿੰਗ 🎨', hobby3: 'ਕੌਮਿਕਸ ਪੜ੍ਹਨਾ 📚',
          h_goals: 'ਇਸ ਸਾਲ ਦੇ ਮੇਰੇ ਟੀਚੇ', goal1: '12 ਨਵੀਆਂ ਕਿਤਾਬਾਂ ਪੜ੍ਹਨੀਆਂ', goal2: 'ਆਪਣੀ ਖ਼ੁਦ ਦੀ ਵੈੱਬਸਾਈਟ ਬਣਾਉਣੀ',
          fav: 'ਮੇਰਾ ਮਨਪਸੰਦ ਵਿਸ਼ਾ <strong>ਵਿਗਿਆਨ</strong> ਹੈ। ਹੁਣ ਮੈਂ <em>HTML</em> ਸਿੱਖ ਰਹੀ ਹਾਂ!',
          footer: 'ਰੀਆ ਨੇ HTML ਅਤੇ CSS ਨਾਲ ਬਣਾਇਆ 💻',
          c_html: 'ਟੈਗਾਂ ਵਿਚਕਾਰਲੇ ਸ਼ਬਦ ਬਦਲੋ ਅਤੇ ਪ੍ਰੀਵਿਊ ਬਦਲਦਾ ਦੇਖੋ।',
          c_css: 'CSS ਰੰਗ, ਆਕਾਰ ਅਤੇ ਥਾਂ ਤੈਅ ਕਰਦਾ ਹੈ।',
          c_js: 'ਇਹ ਲਾਈਨ ਕੰਸੋਲ ਵਿੱਚ ਇੱਕ ਸੁਨੇਹਾ ਲਿਖਦੀ ਹੈ।',
          log: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੇਰਾ ਪੇਜ ਤਿਆਰ ਹੈ।'
        }
      },
      timetable: {
        name: 'ਮੇਰੀ ਸਮਾਂ-ਸਾਰਣੀ',
        tips: ['ਪੀਰੀਅਡ 6 ਲਈ ਇੱਕ ਨਵੀਂ ਕਤਾਰ ਜੋੜੋ।', 'CSS ਵਿੱਚ th ਖ਼ਾਨਿਆਂ ਦਾ ਪਿਛੋਕੜ ਰੰਗ ਬਦਲੋ।'],
        t: {
          title: 'ਮੇਰੀ ਸਮਾਂ-ਸਾਰਣੀ', h1: 'ਮੇਰੀ ਜਮਾਤ ਦੀ ਸਮਾਂ-ਸਾਰਣੀ', caption: 'ਜਮਾਤ 7 ਬੀ', period: 'ਪੀਰੀਅਡ',
          mon: 'ਸੋਮ', tue: 'ਮੰਗਲ', wed: 'ਬੁੱਧ', thu: 'ਵੀਰ', fri: 'ਸ਼ੁੱਕਰ', sat: 'ਸ਼ਨੀ',
          maths: 'ਗਣਿਤ', science: 'ਵਿਗਿਆਨ', english: 'ਅੰਗਰੇਜ਼ੀ', lang_sub: 'ਪੰਜਾਬੀ', sst: 'ਸਮਾਜਿਕ ਵਿਗਿਆਨ',
          computer: 'ਕੰਪਿਊਟਰ', art: 'ਕਲਾ', games: 'ਖੇਡਾਂ', lunch: 'ਅੱਧੀ ਛੁੱਟੀ',
          c_scroll: 'ਛੋਟੀ ਸਕਰੀਨ ’ਤੇ ਟੇਬਲ ਪਾਸੇ ਵੱਲ ਖਿਸਕਦਾ ਹੈ',
          c_html: 'tr = ਕਤਾਰ, th = ਸਿਰਲੇਖ ਖ਼ਾਨਾ, td = ਖ਼ਾਨਾ। colspan ਖ਼ਾਨਿਆਂ ਨੂੰ ਜੋੜਦਾ ਹੈ।',
          c_js: 'ਅੱਜ ਦੇ ਦਿਨ ਵਾਲਾ ਕਾਲਮ ਹਾਈਲਾਈਟ ਕਰੋ (ਐਤਵਾਰ ਨੂੰ ਕੁਝ ਹਾਈਲਾਈਟ ਨਹੀਂ ਹੁੰਦਾ)।'
        }
      },
      form: {
        name: 'ਫ਼ੀਡਬੈਕ ਫ਼ਾਰਮ',
        tips: ['select ਬਾਕਸ ਵਾਲਾ ਇੱਕ ਨਵਾਂ ਸਵਾਲ ਜੋੜੋ, ਜਿਵੇਂ ਤੁਹਾਡਾ ਮਨਪਸੰਦ ਵਿਸ਼ਾ।', '"ਫ਼ੀਡਬੈਕ ਭੇਜੋ" ਦਬਾਓ ਅਤੇ ਕੰਸੋਲ ਦੇਖੋ।'],
        t: {
          title: 'ਫ਼ੀਡਬੈਕ ਫ਼ਾਰਮ', h1: 'ਜਮਾਤ ਫ਼ੀਡਬੈਕ', intro: 'ਦੱਸੋ, ਅੱਜ ਦੀ ਕੰਪਿਊਟਰ ਕਲਾਸ ਤੁਹਾਨੂੰ ਕਿਹੋ ਜਿਹੀ ਲੱਗੀ।',
          name: 'ਤੁਹਾਡਾ ਨਾਂ', name_ph: 'ਜਿਵੇਂ ਆਰਵ', cls: 'ਜਮਾਤ', rating: 'ਕਲਾਸ ਕਿਹੋ ਜਿਹੀ ਰਹੀ?',
          r5: 'ਬਹੁਤ ਵਧੀਆ', r3: 'ਠੀਕ-ਠਾਕ', r1: 'ਔਖੀ', liked: 'ਤੁਹਾਨੂੰ ਕੀ ਪਸੰਦ ਆਇਆ?',
          l1: 'ਖੇਡਾਂ', l2: 'ਵੀਡੀਓ', l3: 'ਗਰੁੱਪ ਪ੍ਰੋਜੈਕਟ', msg: 'ਕੋਈ ਸੁਝਾਅ?', msg_ph: 'ਇੱਥੇ ਲਿਖੋ…',
          send: 'ਫ਼ੀਡਬੈਕ ਭੇਜੋ', thanks: 'ਧੰਨਵਾਦ', got: 'ਤੁਹਾਡਾ ਫ਼ੀਡਬੈਕ ਮਿਲ ਗਿਆ।', log: 'ਫ਼ੀਡਬੈਕ ਭੇਜਿਆ',
          c_js: 'ਫ਼ਾਰਮ ਭੇਜਣ ’ਤੇ ਧੰਨਵਾਦ ਦਾ ਸੁਨੇਹਾ ਦਿਖਾਓ।', c_prevent: 'ਇਸੇ ਪੇਜ ’ਤੇ ਰਹੋ'
        }
      },
      card: {
        name: 'CSS ਪ੍ਰੋਫ਼ਾਈਲ ਕਾਰਡ',
        tips: ['.card ਦਾ border-radius 0 ਕਰਕੇ ਦੇਖੋ ਕੀ ਹੁੰਦਾ ਹੈ।', 'font-size ਨਾਲ ਅਵਤਾਰ ਵੱਡਾ ਕਰੋ।'],
        t: {
          title: 'ਪ੍ਰੋਫ਼ਾਈਲ ਕਾਰਡ', name: 'ਅਨੰਨਿਆ ਗਿੱਲ', role: 'ਜਮਾਤ 9 · ਸਾਇੰਸ ਕਲੱਬ ਕਪਤਾਨ',
          bio: 'ਮੈਨੂੰ ਰੋਬੋਟ ਬਣਾਉਣਾ ਅਤੇ ਤਾਰੇ ਦੇਖਣਾ ਪਸੰਦ ਹੈ। ਮੇਰਾ ਸੁਪਨਾ ਇਸਰੋ ਵਿੱਚ ਕੰਮ ਕਰਨਾ ਹੈ।',
          s1: 'ਪ੍ਰੋਜੈਕਟ', s2: 'ਮੈਡਲ', s3: 'ਰੋਬੋਟ', follow: 'ਫ਼ੌਲੋ ਕਰੋ', following: 'ਫ਼ੌਲੋ ਕਰ ਰਹੇ ਹੋ ✓',
          c_css: 'ਹੇਠਲੀਆਂ ਸੰਖਿਆਵਾਂ ਅਤੇ ਰੰਗ ਬਦਲ ਕੇ ਦੇਖੋ।',
          c_js: 'ਬਟਨ ਨੂੰ "ਫ਼ੌਲੋ ਕਰੋ" ਅਤੇ "ਫ਼ੌਲੋ ਕਰ ਰਹੇ ਹੋ" ਵਿਚਕਾਰ ਬਦਲੋ।'
        }
      },
      colorbtn: {
        name: 'ਰੰਗ ਬਦਲਣ ਵਾਲਾ ਬਟਨ',
        tips: ['ਦੋਵਾਂ ਸੂਚੀਆਂ ਵਿੱਚ ਇੱਕ ਹੋਰ ਰੰਗ ਅਤੇ ਉਸ ਦਾ ਨਾਂ ਜੋੜੋ।', 'if ਵਰਤ ਕੇ 10 ਕਲਿੱਕਾਂ ਤੋਂ ਬਾਅਦ ਬਟਨ ਦਾ ਟੈਕਸਟ ਬਦਲੋ।'],
        t: {
          title: 'ਜਾਦੂਈ ਬਟਨ', h1: 'ਜਾਦੂਈ ਬਟਨ', intro: 'ਬਟਨ ’ਤੇ ਕਲਿੱਕ ਕਰੋ। JavaScript ਹਰ ਵਾਰ ਉਸ ਦਾ ਰੰਗ ਬਦਲ ਦਿੰਦੀ ਹੈ।',
          btn: 'ਮੈਨੂੰ ਕਲਿੱਕ ਕਰੋ!', clicks: 'ਕਲਿੱਕ:', colour: 'ਰੰਗ:',
          c1: 'ਕੇਸਰੀ', c2: 'ਹਰਾ', c3: 'ਗੂੜ੍ਹਾ ਨੀਲਾ', c4: 'ਗੁਲਾਬੀ', c5: 'ਜਾਮਣੀ', c6: 'ਫ਼ਿਰੋਜ਼ੀ',
          c_list: 'ਰੰਗਾਂ ਦੀ ਇੱਕ ਸੂਚੀ (array) ਅਤੇ ਉਨ੍ਹਾਂ ਦੇ ਨਾਵਾਂ ਦੀ ਇੱਕ ਸੂਚੀ',
          c_mod: '% ਬਾਕੀ ਦਿੰਦਾ ਹੈ, ਇਸ ਲਈ ਰੰਗ ਮੁੜ-ਮੁੜ ਆਉਂਦੇ ਹਨ'
        }
      },
      calc: {
        name: 'ਸੌਖਾ ਕੈਲਕੁਲੇਟਰ',
        tips: ['% (ਬਾਕੀ) ਲਈ ਇੱਕ ਬਟਨ ਜੋੜੋ।', '0 ਨਾਲ ਭਾਗ ਕਰਕੇ ਦੇਖੋ। ਕੋਡ ਦੀਆਂ ਕਿਹੜੀਆਂ ਲਾਈਨਾਂ ਇਸ ਨੂੰ ਸੰਭਾਲਦੀਆਂ ਹਨ?'],
        t: {
          title: 'ਕੈਲਕੁਲੇਟਰ', h1: 'ਸੌਖਾ ਕੈਲਕੁਲੇਟਰ', first: 'ਪਹਿਲੀ ਸੰਖਿਆ', second: 'ਦੂਜੀ ਸੰਖਿਆ', answer: 'ਜਵਾਬ:',
          empty: 'ਕਿਰਪਾ ਕਰਕੇ ਦੋਵੇਂ ਸੰਖਿਆਵਾਂ ਲਿਖੋ', zero: '0 ਨਾਲ ਭਾਗ ਨਹੀਂ ਹੋ ਸਕਦਾ',
          c_js: 'ਦੋਵੇਂ ਸੰਖਿਆਵਾਂ ਪੜ੍ਹੋ, ਹਿਸਾਬ ਕਰੋ ਅਤੇ ਜਵਾਬ ਦਿਖਾਓ।',
          c_number: 'Number() ਟੈਕਸਟ ਨੂੰ ਸੰਖਿਆ ਵਿੱਚ ਬਦਲਦਾ ਹੈ'
        }
      },
      quiz: {
        name: 'ਕੁਇਜ਼ ਪੇਜ',
        tips: ['ਸੂਚੀ ਵਿੱਚ ਆਪਣਾ ਇੱਕ ਸਵਾਲ ਜੋੜੋ।', 'CSS ਵਿੱਚ .right ਅਤੇ .wrong ਦੇ ਰੰਗ ਬਦਲੋ।'],
        t: {
          title: 'ਕੁਇਜ਼', h1: 'ਫਟਾਫਟ ਕੁਇਜ਼',
          q1: 'ਭਾਰਤ ਦੀ ਰਾਜਧਾਨੀ ਕਿਹੜੀ ਹੈ?', q1a: 'ਮੁੰਬਈ', q1b: 'ਨਵੀਂ ਦਿੱਲੀ', q1c: 'ਕੋਲਕਾਤਾ',
          q2: 'ਸਾਡੇ ਸੂਰਜੀ ਮੰਡਲ ਦਾ ਸਭ ਤੋਂ ਵੱਡਾ ਗ੍ਰਹਿ ਕਿਹੜਾ ਹੈ?', q2a: 'ਧਰਤੀ', q2b: 'ਮੰਗਲ', q2c: 'ਬ੍ਰਹਿਸਪਤੀ',
          q3: 'ਛੇਭੁਜ ਦੀਆਂ ਕਿੰਨੀਆਂ ਭੁਜਾਵਾਂ ਹੁੰਦੀਆਂ ਹਨ?',
          q4: 'ਭੋਜਨ ਬਣਾਉਣ ਲਈ ਪੌਦੇ ਹਵਾ ਵਿੱਚੋਂ ਕਿਹੜੀ ਗੈਸ ਲੈਂਦੇ ਹਨ?', q4a: 'ਆਕਸੀਜਨ', q4b: 'ਕਾਰਬਨ ਡਾਈਆਕਸਾਈਡ', q4c: 'ਨਾਈਟ੍ਰੋਜਨ',
          right: 'ਸਹੀ ਜਵਾਬ! 🎉', wrong: 'ਓਹੋ! ਸਹੀ ਜਵਾਬ ਹੈ:', score: 'ਸਕੋਰ:', next: 'ਅਗਲਾ ਸਵਾਲ', again: 'ਫਿਰ ਖੇਡੋ',
          c_js: 'ਹਰ ਸਵਾਲ ਵਿੱਚ ਉਸ ਦਾ ਟੈਕਸਟ, ਵਿਕਲਪ ਅਤੇ ਸਹੀ ਵਿਕਲਪ ਦਾ ਨੰਬਰ ਹੈ (ਗਿਣਤੀ 0 ਤੋਂ)।'
        }
      },
      blank: {
        name: 'ਖ਼ਾਲੀ ਪੇਜ',
        tips: ['ਪਹਿਲਾਂ ਇੱਕ ਹੈਡਿੰਗ ਅਤੇ ਇੱਕ ਪੈਰਾ ਲਿਖੋ, ਫਿਰ ਹੋਰ ਟੈਗ ਜੋੜੋ।', 'ਟੈਗ, ਸਟਾਈਲ ਅਤੇ ਕੋਡ ਜੋੜਨ ਲਈ ਹੇਠਾਂ ਵਾਲੀ ਚੀਟ-ਸ਼ੀਟ ਵਰਤੋ।'],
        t: { title: 'ਮੇਰਾ ਵੈੱਬ ਪੇਜ', h1: 'ਮੇਰਾ ਵੈੱਬ ਪੇਜ', p: 'ਇੱਥੇ ਲਿਖਣਾ ਸ਼ੁਰੂ ਕਰੋ।', c_js: 'ਆਪਣੀ JavaScript ਇੱਥੇ ਲਿਖੋ।' }
      }
    },
    cheat: {
      html: [
        'ਹੈਡਿੰਗ। h1 ਸਭ ਤੋਂ ਵੱਡੀ ਅਤੇ ਸਭ ਤੋਂ ਜ਼ਰੂਰੀ ਹੈ, h6 ਸਭ ਤੋਂ ਛੋਟੀ।',
        'ਟੈਕਸਟ ਦਾ ਇੱਕ ਪੈਰਾ।',
        'br ਨਵੀਂ ਲਾਈਨ ਸ਼ੁਰੂ ਕਰਦਾ ਹੈ; hr ਪੇਜ ’ਤੇ ਇੱਕ ਲੇਟਵੀਂ ਲਕੀਰ ਖਿੱਚਦਾ ਹੈ। ਇਨ੍ਹਾਂ ਨੂੰ ਬੰਦ ਕਰਨ ਦੀ ਲੋੜ ਨਹੀਂ।',
        'strong ਸ਼ਬਦਾਂ ਨੂੰ ਗੂੜ੍ਹਾ ਅਤੇ ਜ਼ਰੂਰੀ ਬਣਾਉਂਦਾ ਹੈ; em ਉਨ੍ਹਾਂ ਨੂੰ ਟੇਢਾ ਬਣਾਉਂਦਾ ਹੈ।',
        'ਦੂਜੇ ਪੇਜ ਦਾ ਲਿੰਕ। href ਉਸ ਦਾ ਪਤਾ ਹੈ।',
        'ਤਸਵੀਰ ਦਿਖਾਉਂਦਾ ਹੈ। ਜੋ ਦੇਖ ਨਹੀਂ ਸਕਦੇ, ਉਨ੍ਹਾਂ ਲਈ alt ਤਸਵੀਰ ਦਾ ਵਰਣਨ ਕਰਦਾ ਹੈ।',
        'ਬੁਲੇਟਾਂ ਵਾਲੀ ਸੂਚੀ। ਹਰ ਆਈਟਮ li ਦੇ ਅੰਦਰ ਜਾਂਦੀ ਹੈ।',
        'ਨੰਬਰਾਂ ਵਾਲੀ ਸੂਚੀ: 1, 2, 3…',
        'ਟੇਬਲ। tr ਕਤਾਰ ਹੈ, th ਸਿਰਲੇਖ ਖ਼ਾਨਾ ਅਤੇ td ਆਮ ਖ਼ਾਨਾ।',
        'ਇੱਕ ਡੱਬਾ ਜੋ ਹੋਰ ਟੈਗਾਂ ਨੂੰ ਇਕੱਠਾ ਰੱਖਦਾ ਹੈ, ਤਾਂ ਜੋ ਉਨ੍ਹਾਂ ਨੂੰ ਇਕੱਠੇ ਸਟਾਈਲ ਕਰ ਸਕੋ।',
        'ਲਾਈਨ ਦੇ ਅੰਦਰ ਕੁਝ ਸ਼ਬਦਾਂ ਨੂੰ ਨਿਸ਼ਾਨ ਲਗਾਉਂਦਾ ਹੈ, ਜਿਵੇਂ ਉਨ੍ਹਾਂ ਨੂੰ ਰੰਗਣ ਲਈ।',
        'ਇੱਕ ਬਟਨ। ਕਲਿੱਕ ਹੋਣ ’ਤੇ JavaScript ਕੁਝ ਕਰ ਸਕਦੀ ਹੈ।',
        'ਲਿਖਣ ਵਾਲਾ ਬਾਕਸ, ਉਸ ਦੇ ਲੇਬਲ ਨਾਲ। type ਹੋ ਸਕਦਾ ਹੈ text, number, date, color…',
        'ਵਿਕਲਪਾਂ ਦੀ ਡ੍ਰੌਪ-ਡਾਊਨ ਸੂਚੀ।',
        'ਕਈ ਲਾਈਨਾਂ ਲਿਖਣ ਲਈ ਵੱਡਾ ਬਾਕਸ।',
        'ਪੇਜ ਦੇ ਹਿੱਸਿਆਂ ਨੂੰ ਨਾਂ ਦਿੰਦਾ ਹੈ: ਉੱਪਰਲਾ, ਮੁੱਖ ਸਮੱਗਰੀ ਅਤੇ ਹੇਠਲਾ।',
        'ਕਮੈਂਟ: ਲੋਕਾਂ ਲਈ ਇੱਕ ਨੋਟ। ਬ੍ਰਾਊਜ਼ਰ ਇਸ ਨੂੰ ਨਹੀਂ ਦਿਖਾਉਂਦਾ।'
      ],
      css: [
        'ਟੈਕਸਟ ਦਾ ਰੰਗ। ਨਾਂ (red), hex ਕੋਡ (#ff9933) ਜਾਂ rgb() ਵਰਤੋ।',
        'ਐਲੀਮੈਂਟ ਦੇ ਪਿੱਛੇ ਦਾ ਰੰਗ।',
        'ਅੱਖਰਾਂ ਦਾ ਆਕਾਰ।',
        'ਫ਼ੌਂਟ (ਅੱਖਰਾਂ ਦੀ ਸ਼ੈਲੀ)। ਪਹਿਲਾ ਨਾ ਮਿਲੇ ਤਾਂ ਕੰਮ ਆਵੇ, ਇਸ ਲਈ ਦੂਜਾ ਵੀ ਲਿਖੋ।',
        'ਟੈਕਸਟ ਨੂੰ ਖੱਬੇ, ਸੱਜੇ ਜਾਂ ਵਿਚਕਾਰ ਰੱਖਦਾ ਹੈ।',
        'ਐਲੀਮੈਂਟ ਦੇ ਬਾਹਰ ਦੀ ਥਾਂ, ਉਸ ਅਤੇ ਗੁਆਂਢੀਆਂ ਵਿਚਕਾਰ।',
        'ਐਲੀਮੈਂਟ ਦੇ ਅੰਦਰ ਦੀ ਥਾਂ, ਉਸ ਦੇ ਬਾਰਡਰ ਅਤੇ ਸਮੱਗਰੀ ਵਿਚਕਾਰ।',
        'ਐਲੀਮੈਂਟ ਦੇ ਦੁਆਲੇ ਇੱਕ ਲਕੀਰ: ਮੋਟਾਈ, ਸ਼ੈਲੀ ਅਤੇ ਰੰਗ।',
        'ਕੋਨਿਆਂ ਨੂੰ ਗੋਲ ਕਰਦਾ ਹੈ। 50% ਨਾਲ ਵਰਗ ਗੋਲਾ ਬਣ ਜਾਂਦਾ ਹੈ।',
        'ਐਲੀਮੈਂਟ ਦਾ ਆਕਾਰ। % ਦਾ ਮਤਲਬ ਆਲੇ-ਦੁਆਲੇ ਦੀ ਥਾਂ ਦਾ ਇੱਕ ਹਿੱਸਾ।',
        'ਅੰਦਰਲੇ ਐਲੀਮੈਂਟਾਂ ਨੂੰ ਨਾਲ-ਨਾਲ ਰੱਖਦਾ ਹੈ। gap ਉਨ੍ਹਾਂ ਵਿਚਕਾਰ ਥਾਂ ਛੱਡਦਾ ਹੈ।',
        'ਹਲਕਾ ਪਰਛਾਵਾਂ ਜੋੜਦਾ ਹੈ, ਜਿਸ ਨਾਲ ਐਲੀਮੈਂਟ ਉੱਭਰਿਆ ਲੱਗਦਾ ਹੈ।',
        'ਅਜਿਹਾ ਸਟਾਈਲ ਜੋ ਸਿਰਫ਼ ਉਦੋਂ ਲੱਗਦਾ ਹੈ ਜਦੋਂ ਮਾਊਸ ਐਲੀਮੈਂਟ ਉੱਤੇ ਹੋਵੇ।',
        '.note ਉਹ ਸਾਰੇ ਐਲੀਮੈਂਟ ਚੁਣਦਾ ਹੈ ਜਿਨ੍ਹਾਂ ਵਿੱਚ class="note" ਹੈ; #title ਉਹ ਐਲੀਮੈਂਟ ਚੁਣਦਾ ਹੈ ਜਿਸ ਦੀ id="title" ਹੈ।',
        'ਫ਼ੋਨ ਵਰਗੀਆਂ ਛੋਟੀਆਂ ਸਕਰੀਨਾਂ ਲਈ ਵੱਖਰੇ ਸਟਾਈਲ।'
      ],
      js: [
        'ਕੰਸੋਲ ਵਿੱਚ ਕੋਈ ਮੁੱਲ ਲਿਖਦਾ ਹੈ। ਆਪਣਾ ਕੋਡ ਜਾਂਚਣ ਲਈ ਬਹੁਤ ਕੰਮ ਦਾ।',
        'ਮੁੱਲ ਰੱਖਣ ਲਈ ਵੇਰੀਏਬਲ ਬਣਾਉਂਦਾ ਹੈ। const ਨੂੰ ਬਾਅਦ ਵਿੱਚ ਬਦਲਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ।',
        'ਸ਼ਰਤ ਸਹੀ ਹੋਵੇ ਤਾਂ ਹੀ ਕੋਡ ਚੱਲਦਾ ਹੈ; ਗ਼ਲਤ ਹੋਵੇ ਤਾਂ else ਚੱਲਦਾ ਹੈ।',
        'ਕੋਡ ਨੂੰ ਦੁਹਰਾਉਂਦਾ ਹੈ। ਇਹ ਲੂਪ 1 ਤੋਂ 5 ਤੱਕ ਗਿਣਦਾ ਹੈ।',
        'ਕੋਡ ਦਾ ਨਾਂ ਵਾਲਾ ਹਿੱਸਾ, ਜਿਸ ਨੂੰ ਵਾਰ-ਵਾਰ ਵਰਤ ਸਕਦੇ ਹੋ।',
        'ਉਹ HTML ਐਲੀਮੈਂਟ ਲੱਭਦਾ ਹੈ ਜਿਸ ਦੀ ਇਹ id ਹੈ।',
        '".note" ਜਾਂ "h1" ਵਰਗੇ CSS ਸਿਲੈਕਟਰ ਨਾਲ ਮਿਲਦਾ ਪਹਿਲਾ ਐਲੀਮੈਂਟ ਲੱਭਦਾ ਹੈ।',
        'ਐਲੀਮੈਂਟ ਦੇ ਅੰਦਰਲਾ ਟੈਕਸਟ ਪੜ੍ਹਦਾ ਜਾਂ ਬਦਲਦਾ ਹੈ।',
        'JavaScript ਨਾਲ ਐਲੀਮੈਂਟ ਦੀ CSS ਬਦਲਦਾ ਹੈ।',
        'ਕੁਝ ਵਾਪਰਨ ’ਤੇ, ਜਿਵੇਂ ਕਲਿੱਕ, ਇੱਕ ਫ਼ੰਕਸ਼ਨ ਚਲਾਉਂਦਾ ਹੈ।',
        'ਇਨਪੁੱਟ ਬਾਕਸ ਵਿੱਚ ਲਿਖਿਆ ਟੈਕਸਟ। Number(box.value) ਉਸ ਨੂੰ ਸੰਖਿਆ ਬਣਾਉਂਦਾ ਹੈ।',
        'alert() ਇੱਕ ਪੌਪ-ਅੱਪ ਸੁਨੇਹਾ ਦਿਖਾਉਂਦਾ ਹੈ; prompt() ਵਰਤੋਂਕਾਰ ਨੂੰ ਜਵਾਬ ਲਿਖਣ ਲਈ ਕਹਿੰਦਾ ਹੈ।',
        'ਇੱਕ ਰੈਂਡਮ ਸੰਖਿਆ ਦਿੰਦਾ ਹੈ। ਇਹ ਉਦਾਹਰਨ ਪਾਸਾ ਸੁੱਟਦੀ ਹੈ: 1 ਤੋਂ 6।',
        'ਮੁੱਲਾਂ ਦੀ ਸੂਚੀ। colours[0] ਪਹਿਲੀ ਆਈਟਮ ਹੈ ਅਤੇ colours.length ਦੱਸਦਾ ਹੈ ਕਿ ਕੁੱਲ ਕਿੰਨੀਆਂ ਹਨ।'
      ]
    }
  },

  or: {
    tpl: {
      first: {
        name: 'ମୋ ପ୍ରଥମ ପେଜ୍',
        tips: ['ନାମ, ସଉକ ଓ ଲକ୍ଷ୍ୟ ବଦଳାଇ ନିଜର ଲେଖନ୍ତୁ।', 'CSSରେ h1ର ରଙ୍ଗ ବଦଳାନ୍ତୁ, ଯେପରି color: green;'],
        t: {
          title: 'ମୋ ବିଷୟରେ', h1: 'ନମସ୍କାର, ମୁଁ ରିଆ ମହାନ୍ତି 👋', photo_alt: 'ରିଆର ଫଟୋ',
          intro: 'ମୁଁ ଭୁବନେଶ୍ୱର, ଓଡ଼ିଶାରେ ସପ୍ତମ ଶ୍ରେଣୀରେ ପଢ଼େ। ମୋତେ ଗପ, ଚିତ୍ରାଙ୍କନ ଓ କମ୍ପ୍ୟୁଟର ବହୁତ ଭଲ ଲାଗେ।',
          h_hobbies: 'ମୋ ସଉକ', hobby1: 'କ୍ରିକେଟ୍ ଖେଳିବା 🏏', hobby2: 'ଚିତ୍ର ଆଙ୍କିବା ଓ ରଙ୍ଗ ଦେବା 🎨', hobby3: 'କମିକ୍ସ ପଢ଼ିବା 📚',
          h_goals: 'ଏ ବର୍ଷର ମୋ ଲକ୍ଷ୍ୟ', goal1: '12ଟି ନୂଆ ବହି ପଢ଼ିବା', goal2: 'ମୋ ନିଜର ୱେବସାଇଟ୍ ତିଆରି କରିବା',
          fav: 'ମୋ ପ୍ରିୟ ବିଷୟ <strong>ବିଜ୍ଞାନ</strong>। ଏବେ ମୁଁ <em>HTML</em> ଶିଖୁଛି!',
          footer: 'ରିଆ HTML ଓ CSS ଦେଇ ତିଆରି କରିଛି 💻',
          c_html: 'ଟ୍ୟାଗ୍ ମଝିରେ ଥିବା ଶବ୍ଦ ବଦଳାନ୍ତୁ ଓ ପ୍ରିଭ୍ୟୁ ବଦଳୁଥିବା ଦେଖନ୍ତୁ।',
          c_css: 'CSS ରଙ୍ଗ, ଆକାର ଓ ଜାଗା ଠିକ୍ କରେ।',
          c_js: 'ଏହି ଧାଡ଼ି କନସୋଲରେ ଗୋଟିଏ ବାର୍ତ୍ତା ଲେଖେ।',
          log: 'ନମସ୍କାର! ମୋ ପେଜ୍ ପ୍ରସ୍ତୁତ।'
        }
      },
      timetable: {
        name: 'ମୋ ସମୟସାରଣୀ',
        tips: ['ପିରିୟଡ୍ 6 ପାଇଁ ଗୋଟିଏ ନୂଆ ଧାଡ଼ି ଯୋଡ଼ନ୍ତୁ।', 'CSSରେ th ଘରଗୁଡ଼ିକର ପଛ ରଙ୍ଗ ବଦଳାନ୍ତୁ।'],
        t: {
          title: 'ମୋ ସମୟସାରଣୀ', h1: 'ମୋ ଶ୍ରେଣୀର ସମୟସାରଣୀ', caption: 'ସପ୍ତମ ଶ୍ରେଣୀ, ଖ ବିଭାଗ', period: 'ପିରିୟଡ୍',
          mon: 'ସୋମ', tue: 'ମଙ୍ଗଳ', wed: 'ବୁଧ', thu: 'ଗୁରୁ', fri: 'ଶୁକ୍ର', sat: 'ଶନି',
          maths: 'ଗଣିତ', science: 'ବିଜ୍ଞାନ', english: 'ଇଂରାଜୀ', lang_sub: 'ଓଡ଼ିଆ', sst: 'ସାମାଜିକ ବିଜ୍ଞାନ',
          computer: 'କମ୍ପ୍ୟୁଟର', art: 'ଚିତ୍ରକଳା', games: 'ଖେଳ', lunch: 'ଟିଫିନ୍ ଛୁଟି',
          c_scroll: 'ଛୋଟ ସ୍କ୍ରିନରେ ଟେବୁଲ୍ ପାଖକୁ ଘୁଞ୍ଚେ',
          c_html: 'tr = ଧାଡ଼ି, th = ଶୀର୍ଷକ ଘର, td = ଘର। colspan ଘରଗୁଡ଼ିକୁ ଯୋଡ଼େ।',
          c_js: 'ଆଜିର ଦିନର ସ୍ତମ୍ଭକୁ ହାଇଲାଇଟ୍ କରନ୍ତୁ (ରବିବାର କିଛି ହାଇଲାଇଟ୍ ହୁଏ ନାହିଁ)।'
        }
      },
      form: {
        name: 'ମତାମତ ଫର୍ମ',
        tips: ['select ବାକ୍ସ ସହ ଗୋଟିଏ ନୂଆ ପ୍ରଶ୍ନ ଯୋଡ଼ନ୍ତୁ, ଯେପରି ଆପଣଙ୍କ ପ୍ରିୟ ବିଷୟ।', '"ମତାମତ ପଠାନ୍ତୁ" ଦବାନ୍ତୁ ଓ କନସୋଲ୍ ଦେଖନ୍ତୁ।'],
        t: {
          title: 'ମତାମତ ଫର୍ମ', h1: 'ଶ୍ରେଣୀ ମତାମତ', intro: 'ଆଜିର କମ୍ପ୍ୟୁଟର କ୍ଲାସ କେମିତି ଲାଗିଲା, କୁହନ୍ତୁ।',
          name: 'ଆପଣଙ୍କ ନାମ', name_ph: 'ଯେପରି ଆରବ', cls: 'ଶ୍ରେଣୀ', rating: 'କ୍ଲାସ କେମିତି ଥିଲା?',
          r5: 'ବହୁତ ଭଲ', r3: 'ଠିକ୍ ଅଛି', r1: 'କଷ୍ଟକର', liked: 'ଆପଣଙ୍କୁ କ’ଣ ଭଲ ଲାଗିଲା?',
          l1: 'ଖେଳ', l2: 'ଭିଡିଓ', l3: 'ଦଳଗତ ପ୍ରୋଜେକ୍ଟ', msg: 'କିଛି ପରାମର୍ଶ?', msg_ph: 'ଏଠାରେ ଲେଖନ୍ତୁ…',
          send: 'ମତାମତ ପଠାନ୍ତୁ', thanks: 'ଧନ୍ୟବାଦ', got: 'ଆପଣଙ୍କ ମତାମତ ମିଳିଗଲା।', log: 'ମତାମତ ପଠାଇଲେ',
          c_js: 'ଫର୍ମ ପଠାଗଲେ ଧନ୍ୟବାଦ ବାର୍ତ୍ତା ଦେଖାନ୍ତୁ।', c_prevent: 'ଏହି ପେଜରେ ରୁହନ୍ତୁ'
        }
      },
      card: {
        name: 'CSS ପ୍ରୋଫାଇଲ୍ କାର୍ଡ',
        tips: ['.cardର border-radius 0 କରି ଦେଖନ୍ତୁ କ’ଣ ହୁଏ।', 'font-size ଦେଇ ଅବତାରକୁ ବଡ଼ କରନ୍ତୁ।'],
        t: {
          title: 'ପ୍ରୋଫାଇଲ୍ କାର୍ଡ', name: 'ଅନନ୍ୟା ପଣ୍ଡା', role: 'ନବମ ଶ୍ରେଣୀ · ବିଜ୍ଞାନ କ୍ଲବ୍ କ୍ୟାପଟେନ୍',
          bio: 'ମୋତେ ରୋବଟ୍ ତିଆରି କରିବା ଓ ତାରା ଦେଖିବା ଭଲ ଲାଗେ। ଇସ୍ରୋରେ କାମ କରିବା ମୋର ସ୍ୱପ୍ନ।',
          s1: 'ପ୍ରୋଜେକ୍ଟ', s2: 'ପଦକ', s3: 'ରୋବଟ୍', follow: 'ଫଲୋ କରନ୍ତୁ', following: 'ଫଲୋ କରୁଛନ୍ତି ✓',
          c_css: 'ତଳେ ଥିବା ସଂଖ୍ୟା ଓ ରଙ୍ଗ ବଦଳାଇ ଦେଖନ୍ତୁ।',
          c_js: 'ବଟନ୍‌କୁ "ଫଲୋ କରନ୍ତୁ" ଓ "ଫଲୋ କରୁଛନ୍ତି" ମଧ୍ୟରେ ବଦଳାନ୍ତୁ।'
        }
      },
      colorbtn: {
        name: 'ରଙ୍ଗ ବଦଳାଉଥିବା ବଟନ୍',
        tips: ['ଦୁଇଟି ତାଲିକାରେ ଆଉ ଗୋଟିଏ ରଙ୍ଗ ଓ ତାର ନାମ ଯୋଡ଼ନ୍ତୁ।', 'if ବ୍ୟବହାର କରି 10ଟି କ୍ଲିକ୍ ପରେ ବଟନ୍‌ର ଲେଖା ବଦଳାନ୍ତୁ।'],
        t: {
          title: 'ଯାଦୁ ବଟନ୍', h1: 'ଯାଦୁ ବଟନ୍', intro: 'ବଟନ୍‌ରେ କ୍ଲିକ୍ କରନ୍ତୁ। JavaScript ପ୍ରତିଥର ତାର ରଙ୍ଗ ବଦଳାଏ।',
          btn: 'ମୋତେ କ୍ଲିକ୍ କର!', clicks: 'କ୍ଲିକ୍:', colour: 'ରଙ୍ଗ:',
          c1: 'କେଶରୀ', c2: 'ସବୁଜ', c3: 'ଗାଢ଼ ନୀଳ', c4: 'ଗୋଲାପୀ', c5: 'ବାଇଗଣୀ', c6: 'ଫିରୋଜା',
          c_list: 'ରଙ୍ଗର ଗୋଟିଏ ତାଲିକା (array) ଓ ସେମାନଙ୍କ ନାମର ଗୋଟିଏ ତାଲିକା',
          c_mod: '% ଭାଗଶେଷ ଦିଏ, ତେଣୁ ରଙ୍ଗଗୁଡ଼ିକ ବାରମ୍ବାର ଆସେ'
        }
      },
      calc: {
        name: 'ସରଳ କାଲକୁଲେଟର୍',
        tips: ['% (ଭାଗଶେଷ) ପାଇଁ ଗୋଟିଏ ବଟନ୍ ଯୋଡ଼ନ୍ତୁ।', '0 ଦେଇ ଭାଗ କରି ଦେଖନ୍ତୁ। କୋଡ୍‌ର କେଉଁ ଧାଡ଼ିଗୁଡ଼ିକ ଏହାକୁ ସମ୍ଭାଳେ?'],
        t: {
          title: 'କାଲକୁଲେଟର୍', h1: 'ସରଳ କାଲକୁଲେଟର୍', first: 'ପ୍ରଥମ ସଂଖ୍ୟା', second: 'ଦ୍ୱିତୀୟ ସଂଖ୍ୟା', answer: 'ଉତ୍ତର:',
          empty: 'ଦୟାକରି ଦୁଇଟି ସଂଖ୍ୟା ଲେଖନ୍ତୁ', zero: '0 ଦେଇ ଭାଗ କରିହେବ ନାହିଁ',
          c_js: 'ଦୁଇଟି ସଂଖ୍ୟା ପଢ଼ନ୍ତୁ, ହିସାବ କରନ୍ତୁ ଓ ଉତ୍ତର ଦେଖାନ୍ତୁ।',
          c_number: 'Number() ଲେଖାକୁ ସଂଖ୍ୟାରେ ବଦଳାଏ'
        }
      },
      quiz: {
        name: 'କୁଇଜ୍ ପେଜ୍',
        tips: ['ତାଲିକାରେ ନିଜର ଗୋଟିଏ ପ୍ରଶ୍ନ ଯୋଡ଼ନ୍ତୁ।', 'CSSରେ .right ଓ .wrongର ରଙ୍ଗ ବଦଳାନ୍ତୁ।'],
        t: {
          title: 'କୁଇଜ୍', h1: 'ଚଟପଟ କୁଇଜ୍',
          q1: 'ଭାରତର ରାଜଧାନୀ କ’ଣ?', q1a: 'ମୁମ୍ବାଇ', q1b: 'ନୂଆଦିଲ୍ଲୀ', q1c: 'କୋଲକାତା',
          q2: 'ଆମ ସୌରଜଗତର ସବୁଠାରୁ ବଡ଼ ଗ୍ରହ କେଉଁଟି?', q2a: 'ପୃଥିବୀ', q2b: 'ମଙ୍ଗଳ', q2c: 'ବୃହସ୍ପତି',
          q3: 'ଷଡ଼ଭୁଜର କେତୋଟି ବାହୁ ଥାଏ?',
          q4: 'ଖାଦ୍ୟ ତିଆରି ପାଇଁ ଗଛ ପବନରୁ କେଉଁ ଗ୍ୟାସ୍ ନିଏ?', q4a: 'ଅମ୍ଳଜାନ', q4b: 'ଅଙ୍ଗାରକାମ୍ଳ', q4c: 'ଯବକ୍ଷାରଜାନ',
          right: 'ଠିକ୍ ଉତ୍ତର! 🎉', wrong: 'ଓହୋ! ଠିକ୍ ଉତ୍ତର ହେଲା:', score: 'ସ୍କୋର୍:', next: 'ପରବର୍ତ୍ତୀ ପ୍ରଶ୍ନ', again: 'ପୁଣି ଖେଳନ୍ତୁ',
          c_js: 'ପ୍ରତ୍ୟେକ ପ୍ରଶ୍ନରେ ତାର ଲେଖା, ବିକଳ୍ପ ଓ ଠିକ୍ ବିକଳ୍ପର ନମ୍ବର ଅଛି (ଗଣନା 0ରୁ ଆରମ୍ଭ)।'
        }
      },
      blank: {
        name: 'ଖାଲି ପେଜ୍',
        tips: ['ପ୍ରଥମେ ଗୋଟିଏ ହେଡିଂ ଓ ଗୋଟିଏ ଅନୁଚ୍ଛେଦ ଲେଖନ୍ତୁ, ତା’ପରେ ଆହୁରି ଟ୍ୟାଗ୍ ଯୋଡ଼ନ୍ତୁ।', 'ଟ୍ୟାଗ୍, ଷ୍ଟାଇଲ୍ ଓ କୋଡ୍ ଯୋଡ଼ିବାକୁ ତଳର ଚିଟ୍-ସିଟ୍ ବ୍ୟବହାର କରନ୍ତୁ।'],
        t: { title: 'ମୋ ୱେବ୍ ପେଜ୍', h1: 'ମୋ ୱେବ୍ ପେଜ୍', p: 'ଏଠାରେ ଲେଖିବା ଆରମ୍ଭ କରନ୍ତୁ।', c_js: 'ଆପଣଙ୍କ JavaScript ଏଠାରେ ଲେଖନ୍ତୁ।' }
      }
    },
    cheat: {
      html: [
        'ହେଡିଂ। h1 ସବୁଠାରୁ ବଡ଼ ଓ ସବୁଠାରୁ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ, h6 ସବୁଠାରୁ ଛୋଟ।',
        'ଲେଖାର ଗୋଟିଏ ଅନୁଚ୍ଛେଦ।',
        'br ନୂଆ ଧାଡ଼ି ଆରମ୍ଭ କରେ; hr ପେଜରେ ଗୋଟିଏ ଆଡ଼ ଗାର ଟାଣେ। ଏଗୁଡ଼ିକୁ ବନ୍ଦ କରିବାକୁ ପଡ଼େ ନାହିଁ।',
        'strong ଶବ୍ଦକୁ ମୋଟା ଓ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ କରେ; em ତାକୁ ତେରଛା କରେ।',
        'ଅନ୍ୟ ପେଜ୍‌ର ଲିଙ୍କ। href ହେଉଛି ତାର ଠିକଣା।',
        'ଛବି ଦେଖାଏ। ଯେଉଁମାନେ ଦେଖିପାରନ୍ତି ନାହିଁ, ସେମାନଙ୍କ ପାଇଁ alt ଛବିର ବର୍ଣ୍ଣନା ଦିଏ।',
        'ବୁଲେଟ୍ ଥିବା ତାଲିକା। ପ୍ରତ୍ୟେକ ଆଇଟମ୍ li ଭିତରେ ରହେ।',
        'ନମ୍ବର ଥିବା ତାଲିକା: 1, 2, 3…',
        'ଗୋଟିଏ ଟେବୁଲ୍। tr ହେଉଛି ଧାଡ଼ି, th ଶୀର୍ଷକ ଘର ଓ td ସାଧାରଣ ଘର।',
        'ଅନ୍ୟ ଟ୍ୟାଗ୍‌କୁ ଏକାଠି ରଖୁଥିବା ଏକ ବାକ୍ସ, ଯାହାଦ୍ୱାରା ସେଗୁଡ଼ିକୁ ଏକାଠି ଷ୍ଟାଇଲ୍ କରିହେବ।',
        'ଧାଡ଼ି ଭିତରେ କିଛି ଶବ୍ଦକୁ ଚିହ୍ନିତ କରେ, ଯେପରି ସେଗୁଡ଼ିକୁ ରଙ୍ଗ ଦେବା ପାଇଁ।',
        'ଗୋଟିଏ ବଟନ୍। କ୍ଲିକ୍ ହେଲେ JavaScript କିଛି କରିପାରେ।',
        'ଲେଖିବା ପାଇଁ ବାକ୍ସ, ତାର ଲେବଲ୍ ସହ। type ହୋଇପାରେ text, number, date, color…',
        'ବିକଳ୍ପଗୁଡ଼ିକର ଡ୍ରପ୍-ଡାଉନ୍ ତାଲିକା।',
        'ଅନେକ ଧାଡ଼ି ଲେଖିବା ପାଇଁ ବଡ଼ ବାକ୍ସ।',
        'ପେଜ୍‌ର ଅଂଶଗୁଡ଼ିକୁ ନାମ ଦିଏ: ଉପର, ମୁଖ୍ୟ ବିଷୟ ଓ ତଳ।',
        'କମେଣ୍ଟ: ଲୋକଙ୍କ ପାଇଁ ଏକ ନୋଟ୍। ବ୍ରାଉଜର୍ ଏହାକୁ ଦେଖାଏ ନାହିଁ।'
      ],
      css: [
        'ଲେଖାର ରଙ୍ଗ। ନାମ (red), hex କୋଡ୍ (#ff9933) ବା rgb() ବ୍ୟବହାର କରନ୍ତୁ।',
        'ଏଲିମେଣ୍ଟ ପଛର ରଙ୍ଗ।',
        'ଅକ୍ଷରର ଆକାର।',
        'ଫଣ୍ଟ (ଅକ୍ଷରର ଶୈଳୀ)। ପ୍ରଥମଟି ନ ମିଳିଲେ କାମରେ ଆସିବ, ତେଣୁ ଦ୍ୱିତୀୟଟିଏ ବି ଲେଖନ୍ତୁ।',
        'ଲେଖାକୁ ବାମ, ଡାହାଣ ବା ମଝିରେ ରଖେ।',
        'ଏଲିମେଣ୍ଟର ବାହାର ଜାଗା, ତା’ ଓ ପଡ଼ୋଶୀଙ୍କ ମଝିରେ।',
        'ଏଲିମେଣ୍ଟର ଭିତର ଜାଗା, ତାର ବର୍ଡର୍ ଓ ବିଷୟବସ୍ତୁ ମଝିରେ।',
        'ଏଲିମେଣ୍ଟ ଚାରିପଟେ ଗୋଟିଏ ଗାର: ମୋଟେଇ, ଶୈଳୀ ଓ ରଙ୍ଗ।',
        'କୋଣଗୁଡ଼ିକୁ ଗୋଲ କରେ। 50% ଦେଲେ ବର୍ଗ ଏକ ବୃତ୍ତ ହୋଇଯାଏ।',
        'ଏଲିମେଣ୍ଟର ଆକାର। % ମାନେ ଆଖପାଖ ଜାଗାର ଏକ ଅଂଶ।',
        'ଭିତରର ଏଲିମେଣ୍ଟଗୁଡ଼ିକୁ ପାଖାପାଖି ରଖେ। gap ସେମାନଙ୍କ ମଝିରେ ଜାଗା ଛାଡ଼େ।',
        'ହାଲୁକା ଛାଇ ଯୋଡ଼େ, ଯାହାଦ୍ୱାରା ଏଲିମେଣ୍ଟ ଉଠିଲା ପରି ଦେଖାଯାଏ।',
        'ମାଉସ୍ ଏଲିମେଣ୍ଟ ଉପରେ ଥିବା ବେଳେ ହିଁ ଲାଗୁଥିବା ଷ୍ଟାଇଲ୍।',
        '.note ସେହି ସବୁ ଏଲିମେଣ୍ଟ ବାଛେ ଯେଉଁଥିରେ class="note" ଅଛି; #title ସେହି ଏଲିମେଣ୍ଟ ବାଛେ ଯାହାର id="title"।',
        'ଫୋନ୍ ଭଳି ଛୋଟ ସ୍କ୍ରିନ୍ ପାଇଁ ଅଲଗା ଷ୍ଟାଇଲ୍।'
      ],
      js: [
        'କନସୋଲରେ ଏକ ମୂଲ୍ୟ ଲେଖେ। ନିଜ କୋଡ୍ ଯାଞ୍ଚ କରିବାକୁ ବହୁତ ଉପଯୋଗୀ।',
        'ମୂଲ୍ୟ ରଖିବା ପାଇଁ ଭେରିଏବଲ୍ ତିଆରି କରେ। const କୁ ପରେ ବଦଳାଯାଇପାରିବ ନାହିଁ।',
        'ସର୍ତ୍ତ ଠିକ୍ ହେଲେ ହିଁ କୋଡ୍ ଚାଲେ; ଭୁଲ ହେଲେ else ଚାଲେ।',
        'କୋଡ୍‌କୁ ବାରମ୍ବାର ଚଲାଏ। ଏହି ଲୁପ୍ 1ରୁ 5 ପର୍ଯ୍ୟନ୍ତ ଗଣେ।',
        'ନାମ ଥିବା କୋଡ୍‌ର ଏକ ଅଂଶ, ଯାହାକୁ ବାରମ୍ବାର ବ୍ୟବହାର କରିହେବ।',
        'ଯେଉଁ HTML ଏଲିମେଣ୍ଟର ଏହି id ଅଛି, ତାକୁ ଖୋଜେ।',
        '".note" ବା "h1" ଭଳି CSS ସିଲେକ୍ଟର ସହ ମେଳ ଖାଉଥିବା ପ୍ରଥମ ଏଲିମେଣ୍ଟ ଖୋଜେ।',
        'ଏଲିମେଣ୍ଟ ଭିତରର ଲେଖା ପଢ଼େ ବା ବଦଳାଏ।',
        'JavaScriptରୁ ଏଲିମେଣ୍ଟର CSS ବଦଳାଏ।',
        'କିଛି ଘଟିଲେ, ଯେପରି କ୍ଲିକ୍, ଗୋଟିଏ ଫଙ୍କସନ୍ ଚଲାଏ।',
        'ଇନପୁଟ୍ ବାକ୍ସରେ ଲେଖାଯାଇଥିବା ଲେଖା। Number(box.value) ତାକୁ ସଂଖ୍ୟା କରେ।',
        'alert() ଏକ ପପ୍-ଅପ୍ ବାର୍ତ୍ତା ଦେଖାଏ; prompt() ବ୍ୟବହାରକାରୀଙ୍କୁ ଉତ୍ତର ଲେଖିବାକୁ କହେ।',
        'ଏକ ଅନିୟମିତ ସଂଖ୍ୟା ଦିଏ। ଏହି ଉଦାହରଣ ପଶା ପକାଏ: 1ରୁ 6।',
        'ମୂଲ୍ୟର ଏକ ତାଲିକା। colours[0] ପ୍ରଥମ ଆଇଟମ୍ ଓ colours.length କୁହେ ମୋଟ କେତୋଟି ଅଛି।'
      ]
    }
  },

  ta: {
    tpl: {
      first: {
        name: 'என் முதல் பக்கம்',
        tips: ['பெயர், பொழுதுபோக்குகள், இலக்குகளை உங்களுடையதாக மாற்றுங்கள்.', 'CSS-இல் h1-இன் நிறத்தை மாற்றுங்கள், எ.கா. color: green;'],
        t: {
          title: 'என்னைப் பற்றி', h1: 'வணக்கம், நான் ரியா சுப்ரமணியன் 👋', photo_alt: 'ரியாவின் படம்',
          intro: 'நான் தமிழ்நாட்டின் மதுரையில் 7ஆம் வகுப்பு படிக்கிறேன். கதைகள், ஓவியம், கணினி எனக்கு மிகவும் பிடிக்கும்.',
          h_hobbies: 'என் பொழுதுபோக்குகள்', hobby1: 'கிரிக்கெட் விளையாடுவது 🏏', hobby2: 'ஓவியம் வரைவதும் வண்ணம் தீட்டுவதும் 🎨', hobby3: 'காமிக்ஸ் படிப்பது 📚',
          h_goals: 'இந்த ஆண்டின் என் இலக்குகள்', goal1: '12 புதிய புத்தகங்கள் படிப்பது', goal2: 'எனக்கென ஒரு இணையதளம் உருவாக்குவது',
          fav: 'என் விருப்பப் பாடம் <strong>அறிவியல்</strong>. இப்போது நான் <em>HTML</em> கற்கிறேன்!',
          footer: 'HTML, CSS கொண்டு ரியா உருவாக்கியது 💻',
          c_html: 'டேகுகளுக்கு இடையிலான சொற்களை மாற்றி, முன்னோட்டம் மாறுவதைப் பாருங்கள்.',
          c_css: 'நிறங்கள், அளவுகள், இடைவெளிகளை CSS தீர்மானிக்கிறது.',
          c_js: 'இந்த வரி கன்சோலில் ஒரு செய்தியை எழுதும்.',
          log: 'வணக்கம்! என் பக்கம் தயார்.'
        }
      },
      timetable: {
        name: 'என் கால அட்டவணை',
        tips: ['6ஆம் பாடவேளைக்கு ஒரு புதிய வரிசையைச் சேருங்கள்.', 'CSS-இல் th கட்டங்களின் பின்னணி நிறத்தை மாற்றுங்கள்.'],
        t: {
          title: 'என் கால அட்டவணை', h1: 'என் வகுப்புக் கால அட்டவணை', caption: '7ஆம் வகுப்பு, பி பிரிவு', period: 'பாடவேளை',
          mon: 'திங்கள்', tue: 'செவ்வாய்', wed: 'புதன்', thu: 'வியாழன்', fri: 'வெள்ளி', sat: 'சனி',
          maths: 'கணிதம்', science: 'அறிவியல்', english: 'ஆங்கிலம்', lang_sub: 'தமிழ்', sst: 'சமூக அறிவியல்',
          computer: 'கணினி', art: 'ஓவியம்', games: 'விளையாட்டு', lunch: 'மதிய உணவு இடைவேளை',
          c_scroll: 'சிறிய திரையில் அட்டவணை பக்கவாட்டில் நகரும்',
          c_html: 'tr = வரிசை, th = தலைப்புக் கட்டம், td = கட்டம். colspan கட்டங்களை இணைக்கும்.',
          c_js: 'இன்றைய நாளின் நெடுவரிசையை முன்னிலைப்படுத்து (ஞாயிறன்று எதுவும் முன்னிலைப்படுத்தப்படாது).'
        }
      },
      form: {
        name: 'கருத்துப் படிவம்',
        tips: ['select பெட்டியுடன் ஒரு புதிய கேள்வியைச் சேருங்கள், எ.கா. உங்கள் விருப்பப் பாடம்.', '"கருத்தை அனுப்பு" அழுத்தி கன்சோலைப் பாருங்கள்.'],
        t: {
          title: 'கருத்துப் படிவம்', h1: 'வகுப்புக் கருத்து', intro: 'இன்றைய கணினி வகுப்பு உங்களுக்கு எப்படி இருந்தது என்று சொல்லுங்கள்.',
          name: 'உங்கள் பெயர்', name_ph: 'எ.கா. ஆரவ்', cls: 'வகுப்பு', rating: 'வகுப்பு எப்படி இருந்தது?',
          r5: 'மிக நன்று', r3: 'பரவாயில்லை', r1: 'கடினம்', liked: 'உங்களுக்கு எது பிடித்தது?',
          l1: 'விளையாட்டுகள்', l2: 'காணொளிகள்', l3: 'குழுத் திட்டம்', msg: 'ஏதேனும் பரிந்துரை?', msg_ph: 'இங்கே எழுதுங்கள்…',
          send: 'கருத்தை அனுப்பு', thanks: 'நன்றி', got: 'உங்கள் கருத்து கிடைத்தது.', log: 'கருத்து அனுப்பியவர்',
          c_js: 'படிவம் அனுப்பப்பட்டதும் நன்றிச் செய்தியைக் காட்டு.', c_prevent: 'இதே பக்கத்தில் இரு'
        }
      },
      card: {
        name: 'CSS சுயவிவர அட்டை',
        tips: ['.card-இன் border-radius-ஐ 0 ஆக்கி என்ன நடக்கிறது என்று பாருங்கள்.', 'font-size மூலம் அவதாரத்தைப் பெரிதாக்குங்கள்.'],
        t: {
          title: 'சுயவிவர அட்டை', name: 'அனன்யா ஐயர்', role: '9ஆம் வகுப்பு · அறிவியல் மன்றத் தலைவர்',
          bio: 'ரோபோக்களை உருவாக்குவதும் நட்சத்திரங்களைப் பார்ப்பதும் எனக்குப் பிடிக்கும். இஸ்ரோவில் பணியாற்றுவதே என் கனவு.',
          s1: 'திட்டங்கள்', s2: 'பதக்கங்கள்', s3: 'ரோபோக்கள்', follow: 'பின்தொடர்', following: 'பின்தொடர்கிறீர்கள் ✓',
          c_css: 'கீழே உள்ள எண்களையும் நிறங்களையும் மாற்றிப் பாருங்கள்.',
          c_js: 'பொத்தானை "பின்தொடர்", "பின்தொடர்கிறீர்கள்" இடையே மாற்று.'
        }
      },
      colorbtn: {
        name: 'நிறம் மாறும் பொத்தான்',
        tips: ['இரண்டு பட்டியல்களிலும் இன்னொரு நிறத்தையும் அதன் பெயரையும் சேருங்கள்.', '10 கிளிக்குகளுக்குப் பிறகு பொத்தானின் எழுத்தை மாற்ற if பயன்படுத்துங்கள்.'],
        t: {
          title: 'மந்திரப் பொத்தான்', h1: 'மந்திரப் பொத்தான்', intro: 'பொத்தானைக் கிளிக் செய்யுங்கள். ஒவ்வொரு முறையும் JavaScript அதன் நிறத்தை மாற்றும்.',
          btn: 'என்னைக் கிளிக் செய்!', clicks: 'கிளிக்குகள்:', colour: 'நிறம்:',
          c1: 'காவி', c2: 'பச்சை', c3: 'கருநீலம்', c4: 'இளஞ்சிவப்பு', c5: 'ஊதா', c6: 'நீலப்பச்சை',
          c_list: 'நிறங்களின் ஒரு பட்டியல் (array), அவற்றின் பெயர்களின் ஒரு பட்டியல்',
          c_mod: '% மீதியைத் தரும், அதனால் நிறங்கள் மீண்டும் மீண்டும் வரும்'
        }
      },
      calc: {
        name: 'எளிய கணிப்பான்',
        tips: ['% (மீதி)-க்கு ஒரு பொத்தானைச் சேருங்கள்.', '0-ஆல் வகுத்துப் பாருங்கள். குறியீட்டின் எந்த வரிகள் அதைக் கையாளுகின்றன?'],
        t: {
          title: 'கணிப்பான்', h1: 'எளிய கணிப்பான்', first: 'முதல் எண்', second: 'இரண்டாம் எண்', answer: 'விடை:',
          empty: 'இரண்டு எண்களையும் எழுதுங்கள்', zero: '0-ஆல் வகுக்க முடியாது',
          c_js: 'இரண்டு எண்களைப் படித்து, கணக்கிட்டு, விடையைக் காட்டு.',
          c_number: 'Number() எழுத்தை எண்ணாக மாற்றும்'
        }
      },
      quiz: {
        name: 'வினாடி வினா பக்கம்',
        tips: ['பட்டியலில் உங்கள் சொந்தக் கேள்வி ஒன்றைச் சேருங்கள்.', 'CSS-இல் .right, .wrong நிறங்களை மாற்றுங்கள்.'],
        t: {
          title: 'வினாடி வினா', h1: 'விரைவு வினாடி வினா',
          q1: 'இந்தியாவின் தலைநகரம் எது?', q1a: 'மும்பை', q1b: 'புது தில்லி', q1c: 'கொல்கத்தா',
          q2: 'நம் சூரியக் குடும்பத்தின் மிகப் பெரிய கோள் எது?', q2a: 'பூமி', q2b: 'செவ்வாய்', q2c: 'வியாழன்',
          q3: 'அறுகோணத்துக்கு எத்தனை பக்கங்கள்?',
          q4: 'உணவு தயாரிக்கத் தாவரங்கள் காற்றிலிருந்து எந்த வாயுவை எடுக்கின்றன?', q4a: 'ஆக்சிஜன்', q4b: 'கார்பன் டைஆக்சைடு', q4c: 'நைட்ரஜன்',
          right: 'சரி! 🎉', wrong: 'அச்சச்சோ! சரியான விடை:', score: 'மதிப்பெண்:', next: 'அடுத்த கேள்வி', again: 'மீண்டும் விளையாடு',
          c_js: 'ஒவ்வொரு கேள்வியிலும் அதன் வாசகம், விருப்பங்கள், சரியான விருப்பத்தின் எண் (0-இலிருந்து எண்ணப்படும்) உள்ளன.'
        }
      },
      blank: {
        name: 'வெற்றுப் பக்கம்',
        tips: ['முதலில் ஒரு தலைப்பும் ஒரு பத்தியும் எழுதி, பிறகு மேலும் டேகுகளைச் சேருங்கள்.', 'டேகுகள், ஸ்டைல்கள், குறியீட்டைச் சேர்க்கக் கீழே உள்ள குறிப்புத்தாளைப் பயன்படுத்துங்கள்.'],
        t: { title: 'என் வலைப்பக்கம்', h1: 'என் வலைப்பக்கம்', p: 'இங்கே எழுதத் தொடங்குங்கள்.', c_js: 'உங்கள் JavaScript-ஐ இங்கே எழுதுங்கள்.' }
      }
    },
    cheat: {
      html: [
        'தலைப்புகள். h1 மிகப் பெரியது, மிக முக்கியமானது; h6 மிகச் சிறியது.',
        'ஒரு பத்தி உரை.',
        'br புதிய வரியைத் தொடங்கும்; hr பக்கத்தின் குறுக்கே ஒரு கோடு வரையும். இவற்றுக்கு மூடும் டேக் தேவையில்லை.',
        'strong சொற்களைத் தடித்ததாகவும் முக்கியமானதாகவும் ஆக்கும்; em அவற்றைச் சாய்வாக்கும்.',
        'வேறொரு பக்கத்துக்கான இணைப்பு. href என்பது அதன் முகவரி.',
        'படத்தைக் காட்டும். பார்க்க முடியாதவர்களுக்காக alt படத்தை விவரிக்கும்.',
        'புள்ளிகள் உள்ள பட்டியல். ஒவ்வொரு உருப்படியும் li-க்குள் வரும்.',
        'எண்ணிட்ட பட்டியல்: 1, 2, 3…',
        'ஓர் அட்டவணை. tr ஒரு வரிசை, th தலைப்புக் கட்டம், td சாதாரணக் கட்டம்.',
        'மற்ற டேகுகளை ஒன்றாக வைக்கும் பெட்டி; அவற்றை ஒன்றாக ஸ்டைல் செய்யலாம்.',
        'ஒரு வரிக்குள் சில சொற்களைக் குறிக்கும், எ.கா. அவற்றுக்கு நிறம் கொடுக்க.',
        'ஒரு பொத்தான். அதைக் கிளிக் செய்யும்போது JavaScript ஏதாவது செய்யலாம்.',
        'தட்டச்சு செய்யும் பெட்டி, அதன் லேபிளுடன். type என்பது text, number, date, color… ஆக இருக்கலாம்.',
        'விருப்பங்களின் கீழிறங்கு பட்டியல்.',
        'பல வரிகள் எழுத ஒரு பெரிய பெட்டி.',
        'பக்கத்தின் பகுதிகளுக்குப் பெயரிடும்: மேல், முதன்மை உள்ளடக்கம், கீழ்.',
        'குறிப்புரை: மனிதர்களுக்கான ஒரு குறிப்பு. உலாவி இதைக் காட்டாது.'
      ],
      css: [
        'எழுத்தின் நிறம். பெயர் (red), hex குறியீடு (#ff9933) அல்லது rgb() பயன்படுத்துங்கள்.',
        'உறுப்புக்குப் பின்னால் உள்ள நிறம்.',
        'எழுத்துகளின் அளவு.',
        'எழுத்துரு (எழுத்தின் வடிவம்). முதலாவது இல்லாவிட்டால் உதவ இரண்டாவதையும் சேருங்கள்.',
        'உரையை இடது, வலது அல்லது நடுவில் அமைக்கும்.',
        'உறுப்புக்கு வெளியே உள்ள இடம், அதற்கும் அருகிலுள்ளவற்றுக்கும் இடையே.',
        'உறுப்புக்குள் உள்ள இடம், அதன் விளிம்புக்கும் உள்ளடக்கத்துக்கும் இடையே.',
        'உறுப்பைச் சுற்றி ஒரு கோடு: தடிமன், வகை, நிறம்.',
        'மூலைகளை வளைக்கும். 50% சதுரத்தை வட்டமாக்கும்.',
        'உறுப்பின் அளவு. % என்பது சுற்றியுள்ள இடத்தின் ஒரு பகுதி.',
        'உள்ளே உள்ள உறுப்புகளை அருகருகே வைக்கும். gap அவற்றுக்கிடையே இடம் தரும்.',
        'மென்மையான நிழல் சேர்க்கும்; உறுப்பு உயர்ந்து நிற்பது போலத் தெரியும்.',
        'சுட்டி (mouse) உறுப்பின் மேல் இருக்கும்போது மட்டும் வரும் ஸ்டைல்.',
        '.note என்பது class="note" உள்ள எல்லா உறுப்புகளையும் தேர்ந்தெடுக்கும்; #title என்பது id="title" உள்ள உறுப்பைத் தேர்ந்தெடுக்கும்.',
        'கைப்பேசி போன்ற சிறிய திரைகளுக்கான தனி ஸ்டைல்கள்.'
      ],
      js: [
        'கன்சோலில் ஒரு மதிப்பை எழுதும். உங்கள் குறியீட்டைச் சரிபார்க்க மிகவும் பயன்படும்.',
        'ஒரு மதிப்பைச் சேமிக்கும் மாறியை (variable) உருவாக்கும். const-ஐப் பிறகு மாற்ற முடியாது.',
        'நிபந்தனை சரியாக இருந்தால் மட்டும் குறியீடு இயங்கும்; தவறானால் else இயங்கும்.',
        'குறியீட்டை மீண்டும் மீண்டும் இயக்கும். இந்த மடக்கு (loop) 1 முதல் 5 வரை எண்ணும்.',
        'பெயர் கொண்ட குறியீட்டுத் தொகுதி; அதை மீண்டும் மீண்டும் பயன்படுத்தலாம்.',
        'இந்த id உள்ள HTML உறுப்பைக் கண்டுபிடிக்கும்.',
        '".note" அல்லது "h1" போன்ற CSS தேர்வியுடன் பொருந்தும் முதல் உறுப்பைக் கண்டுபிடிக்கும்.',
        'உறுப்புக்குள் உள்ள உரையைப் படிக்கும் அல்லது மாற்றும்.',
        'JavaScript மூலம் உறுப்பின் CSS-ஐ மாற்றும்.',
        'கிளிக் போன்று ஏதாவது நடக்கும்போது ஒரு செயல்கூறை (function) இயக்கும்.',
        'உள்ளீட்டுப் பெட்டியில் தட்டச்சு செய்த உரை. Number(box.value) அதை எண்ணாக மாற்றும்.',
        'alert() ஒரு பாப்-அப் செய்தியைக் காட்டும்; prompt() பயனரிடம் பதில் தட்டச்சு செய்யச் சொல்லும்.',
        'ஒரு சீரற்ற (random) எண்ணைத் தரும். இந்த எடுத்துக்காட்டு பகடை உருட்டும்: 1 முதல் 6.',
        'மதிப்புகளின் பட்டியல். colours[0] முதல் உருப்படி; colours.length மொத்தம் எத்தனை என்று சொல்லும்.'
      ]
    }
  },

  te: {
    tpl: {
      first: {
        name: 'నా మొదటి పేజీ',
        tips: ['పేరు, అభిరుచులు, లక్ష్యాలను మీవిగా మార్చండి.', 'CSS లో h1 రంగు మార్చండి, ఉదా. color: green;'],
        t: {
          title: 'నా గురించి', h1: 'నమస్కారం, నేను రియా రెడ్డి 👋', photo_alt: 'రియా చిత్రం',
          intro: 'నేను ఆంధ్రప్రదేశ్‌లోని విజయవాడలో 7వ తరగతి చదువుతున్నాను. నాకు కథలు, బొమ్మలు గీయడం, కంప్యూటర్ అంటే చాలా ఇష్టం.',
          h_hobbies: 'నా అభిరుచులు', hobby1: 'క్రికెట్ ఆడటం 🏏', hobby2: 'బొమ్మలు గీయడం, రంగులు వేయడం 🎨', hobby3: 'కామిక్స్ చదవడం 📚',
          h_goals: 'ఈ సంవత్సరం నా లక్ష్యాలు', goal1: '12 కొత్త పుస్తకాలు చదవడం', goal2: 'నా సొంత వెబ్‌సైట్ తయారు చేయడం',
          fav: 'నాకు ఇష్టమైన సబ్జెక్టు <strong>సైన్స్</strong>. ఇప్పుడు నేను <em>HTML</em> నేర్చుకుంటున్నాను!',
          footer: 'HTML, CSS తో రియా తయారు చేసింది 💻',
          c_html: 'ట్యాగ్‌ల మధ్య ఉన్న పదాలను మార్చి, ప్రివ్యూ మారడం చూడండి.',
          c_css: 'రంగులు, సైజులు, ఖాళీ స్థలాన్ని CSS నిర్ణయిస్తుంది.',
          c_js: 'ఈ లైన్ కన్సోల్‌లో ఒక సందేశం రాస్తుంది.',
          log: 'నమస్కారం! నా పేజీ సిద్ధం.'
        }
      },
      timetable: {
        name: 'నా టైమ్‌టేబుల్',
        tips: ['6వ పీరియడ్ కోసం ఒక కొత్త వరుస చేర్చండి.', 'CSS లో th గడుల నేపథ్య రంగు మార్చండి.'],
        t: {
          title: 'నా టైమ్‌టేబుల్', h1: 'మా తరగతి టైమ్‌టేబుల్', caption: '7వ తరగతి, బి సెక్షన్', period: 'పీరియడ్',
          mon: 'సోమ', tue: 'మంగళ', wed: 'బుధ', thu: 'గురు', fri: 'శుక్ర', sat: 'శని',
          maths: 'గణితం', science: 'సైన్స్', english: 'ఇంగ్లీష్', lang_sub: 'తెలుగు', sst: 'సాంఘిక శాస్త్రం',
          computer: 'కంప్యూటర్', art: 'డ్రాయింగ్', games: 'ఆటలు', lunch: 'భోజన విరామం',
          c_scroll: 'చిన్న స్క్రీన్‌పై టేబుల్ పక్కకు జరుగుతుంది',
          c_html: 'tr = వరుస, th = శీర్షిక గడి, td = గడి. colspan గడులను కలుపుతుంది.',
          c_js: 'ఈ రోజు నిలువు వరుసను హైలైట్ చేయి (ఆదివారం ఏదీ హైలైట్ కాదు).'
        }
      },
      form: {
        name: 'అభిప్రాయ ఫారం',
        tips: ['select బాక్స్‌తో ఒక కొత్త ప్రశ్న చేర్చండి, ఉదా. మీకు ఇష్టమైన సబ్జెక్టు.', '"అభిప్రాయం పంపు" నొక్కి కన్సోల్ చూడండి.'],
        t: {
          title: 'అభిప్రాయ ఫారం', h1: 'తరగతి అభిప్రాయం', intro: 'ఈ రోజు కంప్యూటర్ క్లాస్ మీకు ఎలా అనిపించిందో చెప్పండి.',
          name: 'మీ పేరు', name_ph: 'ఉదా. ఆరవ్', cls: 'తరగతి', rating: 'క్లాస్ ఎలా ఉంది?',
          r5: 'చాలా బాగుంది', r3: 'పరవాలేదు', r1: 'కష్టంగా ఉంది', liked: 'మీకు ఏమి నచ్చింది?',
          l1: 'ఆటలు', l2: 'వీడియోలు', l3: 'గ్రూప్ ప్రాజెక్ట్', msg: 'ఏదైనా సూచన?', msg_ph: 'ఇక్కడ రాయండి…',
          send: 'అభిప్రాయం పంపు', thanks: 'ధన్యవాదాలు', got: 'మీ అభిప్రాయం అందింది.', log: 'అభిప్రాయం పంపినవారు',
          c_js: 'ఫారం పంపగానే ధన్యవాదాల సందేశం చూపించు.', c_prevent: 'ఇదే పేజీలో ఉండు'
        }
      },
      card: {
        name: 'CSS ప్రొఫైల్ కార్డ్',
        tips: ['.card యొక్క border-radius ను 0 చేసి ఏమవుతుందో చూడండి.', 'font-size తో అవతార్‌ను పెద్దది చేయండి.'],
        t: {
          title: 'ప్రొఫైల్ కార్డ్', name: 'అనన్య రావు', role: '9వ తరగతి · సైన్స్ క్లబ్ కెప్టెన్',
          bio: 'నాకు రోబోలు తయారు చేయడం, నక్షత్రాలను చూడటం ఇష్టం. ఇస్రోలో పనిచేయడం నా కల.',
          s1: 'ప్రాజెక్ట్‌లు', s2: 'పతకాలు', s3: 'రోబోలు', follow: 'ఫాలో చేయి', following: 'ఫాలో చేస్తున్నారు ✓',
          c_css: 'కింద ఉన్న సంఖ్యలు, రంగులు మార్చి చూడండి.',
          c_js: 'బటన్‌ను "ఫాలో చేయి", "ఫాలో చేస్తున్నారు" మధ్య మార్చు.'
        }
      },
      colorbtn: {
        name: 'రంగు మారే బటన్',
        tips: ['రెండు జాబితాల్లోనూ మరో రంగు, దాని పేరు చేర్చండి.', '10 క్లిక్‌ల తర్వాత బటన్ మీది రాత మార్చడానికి if వాడండి.'],
        t: {
          title: 'మాయా బటన్', h1: 'మాయా బటన్', intro: 'బటన్‌ను క్లిక్ చేయండి. ప్రతిసారీ JavaScript దాని రంగు మారుస్తుంది.',
          btn: 'నన్ను క్లిక్ చేయి!', clicks: 'క్లిక్‌లు:', colour: 'రంగు:',
          c1: 'కాషాయం', c2: 'ఆకుపచ్చ', c3: 'ముదురు నీలం', c4: 'గులాబీ', c5: 'ఊదా', c6: 'నీలి ఆకుపచ్చ',
          c_list: 'రంగుల ఒక జాబితా (array), వాటి పేర్ల ఒక జాబితా',
          c_mod: '% శేషాన్ని ఇస్తుంది, అందుకే రంగులు మళ్లీ మళ్లీ వస్తాయి'
        }
      },
      calc: {
        name: 'సులభమైన కాలిక్యులేటర్',
        tips: ['% (శేషం) కోసం ఒక బటన్ చేర్చండి.', '0 తో భాగించి చూడండి. కోడ్‌లోని ఏ లైన్లు దాన్ని చూసుకుంటాయి?'],
        t: {
          title: 'కాలిక్యులేటర్', h1: 'సులభమైన కాలిక్యులేటర్', first: 'మొదటి సంఖ్య', second: 'రెండో సంఖ్య', answer: 'జవాబు:',
          empty: 'దయచేసి రెండు సంఖ్యలూ రాయండి', zero: '0 తో భాగించలేం',
          c_js: 'రెండు సంఖ్యలను చదివి, లెక్క చేసి, జవాబు చూపించు.',
          c_number: 'Number() రాతను సంఖ్యగా మారుస్తుంది'
        }
      },
      quiz: {
        name: 'క్విజ్ పేజీ',
        tips: ['జాబితాలో మీ సొంత ప్రశ్న ఒకటి చేర్చండి.', 'CSS లో .right, .wrong రంగులు మార్చండి.'],
        t: {
          title: 'క్విజ్', h1: 'చిన్న క్విజ్',
          q1: 'భారతదేశ రాజధాని ఏది?', q1a: 'ముంబై', q1b: 'న్యూఢిల్లీ', q1c: 'కోల్‌కతా',
          q2: 'మన సౌరకుటుంబంలో అతి పెద్ద గ్రహం ఏది?', q2a: 'భూమి', q2b: 'అంగారకుడు', q2c: 'బృహస్పతి',
          q3: 'షడ్భుజికి ఎన్ని భుజాలు ఉంటాయి?',
          q4: 'ఆహారం తయారు చేసుకోవడానికి మొక్కలు గాలి నుంచి ఏ వాయువు తీసుకుంటాయి?', q4a: 'ఆక్సిజన్', q4b: 'కార్బన్ డయాక్సైడ్', q4c: 'నైట్రోజన్',
          right: 'సరైన జవాబు! 🎉', wrong: 'అయ్యో! సరైన జవాబు:', score: 'స్కోరు:', next: 'తర్వాతి ప్రశ్న', again: 'మళ్లీ ఆడు',
          c_js: 'ప్రతి ప్రశ్నలో దాని పాఠం, ఎంపికలు, సరైన ఎంపిక సంఖ్య (లెక్క 0 నుంచి) ఉంటాయి.'
        }
      },
      blank: {
        name: 'ఖాళీ పేజీ',
        tips: ['ముందు ఒక హెడింగ్, ఒక పేరా రాసి, తర్వాత మరిన్ని ట్యాగ్‌లు చేర్చండి.', 'ట్యాగ్‌లు, స్టైల్స్, కోడ్ చేర్చడానికి కింద ఉన్న చీట్-షీట్ వాడండి.'],
        t: { title: 'నా వెబ్ పేజీ', h1: 'నా వెబ్ పేజీ', p: 'ఇక్కడ రాయడం మొదలుపెట్టండి.', c_js: 'మీ JavaScript ఇక్కడ రాయండి.' }
      }
    },
    cheat: {
      html: [
        'హెడింగ్‌లు. h1 అన్నిటికంటే పెద్దది, ముఖ్యమైనది; h6 అన్నిటికంటే చిన్నది.',
        'ఒక పేరా రాత.',
        'br కొత్త లైన్ మొదలుపెడుతుంది; hr పేజీ అడ్డంగా ఒక గీత గీస్తుంది. వీటికి మూసే ట్యాగ్ అవసరం లేదు.',
        'strong పదాలను బోల్డ్‌గా, ముఖ్యమైనవిగా చేస్తుంది; em వాటిని వాలుగా చేస్తుంది.',
        'మరో పేజీకి లింక్. href అంటే దాని చిరునామా.',
        'బొమ్మను చూపిస్తుంది. చూడలేని వారి కోసం alt బొమ్మను వివరిస్తుంది.',
        'బుల్లెట్లు ఉన్న జాబితా. ప్రతి అంశం li లోపల ఉంటుంది.',
        'సంఖ్యలు ఉన్న జాబితా: 1, 2, 3…',
        'ఒక టేబుల్. tr ఒక వరుస, th శీర్షిక గడి, td మామూలు గడి.',
        'ఇతర ట్యాగ్‌లను కలిపి ఉంచే పెట్టె, అప్పుడు వాటికి కలిపి స్టైల్ ఇవ్వొచ్చు.',
        'లైన్ లోపల కొన్ని పదాలను గుర్తిస్తుంది, ఉదా. వాటికి రంగు ఇవ్వడానికి.',
        'ఒక బటన్. దాన్ని క్లిక్ చేసినప్పుడు JavaScript ఏదైనా చేయగలదు.',
        'టైప్ చేయడానికి ఒక బాక్స్, దాని లేబుల్‌తో. type అంటే text, number, date, color… కావచ్చు.',
        'ఎంపికల డ్రాప్-డౌన్ జాబితా.',
        'చాలా లైన్లు రాయడానికి పెద్ద బాక్స్.',
        'పేజీ భాగాలకు పేర్లు పెడుతుంది: పై భాగం, ముఖ్య విషయం, కింది భాగం.',
        'కామెంట్: మనుషుల కోసం ఒక నోట్. బ్రౌజర్ దీన్ని చూపించదు.'
      ],
      css: [
        'రాత రంగు. పేరు (red), hex కోడ్ (#ff9933) లేదా rgb() వాడండి.',
        'ఎలిమెంట్ వెనుక ఉండే రంగు.',
        'అక్షరాల సైజు.',
        'ఫాంట్ (అక్షరాల శైలి). మొదటిది లేకపోతే పనికొచ్చేలా రెండోది కూడా రాయండి.',
        'రాతను ఎడమ, కుడి లేదా మధ్యలో అమర్చుతుంది.',
        'ఎలిమెంట్ బయటి ఖాళీ, దానికీ పక్కవాటికీ మధ్య.',
        'ఎలిమెంట్ లోపలి ఖాళీ, దాని అంచుకూ లోపలి విషయానికీ మధ్య.',
        'ఎలిమెంట్ చుట్టూ ఒక గీత: మందం, శైలి, రంగు.',
        'మూలలను గుండ్రంగా చేస్తుంది. 50% ఇస్తే చతురస్రం వృత్తమవుతుంది.',
        'ఎలిమెంట్ సైజు. % అంటే చుట్టూ ఉన్న స్థలంలో ఒక భాగం.',
        'లోపలి ఎలిమెంట్లను పక్కపక్కనే ఉంచుతుంది. gap వాటి మధ్య ఖాళీ ఇస్తుంది.',
        'మెత్తని నీడను చేరుస్తుంది, అప్పుడు ఎలిమెంట్ పైకి లేచినట్టు కనిపిస్తుంది.',
        'మౌస్ ఎలిమెంట్ మీద ఉన్నప్పుడు మాత్రమే వచ్చే స్టైల్.',
        '.note అంటే class="note" ఉన్న అన్ని ఎలిమెంట్లు; #title అంటే id="title" ఉన్న ఎలిమెంట్.',
        'ఫోన్ల లాంటి చిన్న స్క్రీన్ల కోసం వేరే స్టైల్స్.'
      ],
      js: [
        'కన్సోల్‌లో ఒక విలువను రాస్తుంది. మీ కోడ్‌ను పరీక్షించడానికి చాలా ఉపయోగం.',
        'విలువను దాచే వేరియబుల్‌ను తయారు చేస్తుంది. const ను తర్వాత మార్చలేం.',
        'షరతు నిజమైతేనే కోడ్ నడుస్తుంది; అబద్ధమైతే else నడుస్తుంది.',
        'కోడ్‌ను మళ్లీ మళ్లీ నడుపుతుంది. ఈ లూప్ 1 నుంచి 5 వరకు లెక్కిస్తుంది.',
        'పేరున్న కోడ్ భాగం, దాన్ని మళ్లీ మళ్లీ వాడుకోవచ్చు.',
        'ఈ id ఉన్న HTML ఎలిమెంట్‌ను వెతికి ఇస్తుంది.',
        '".note" లేదా "h1" లాంటి CSS సెలెక్టర్‌కు సరిపోయే మొదటి ఎలిమెంట్‌ను వెతుకుతుంది.',
        'ఎలిమెంట్ లోపలి రాతను చదువుతుంది లేదా మారుస్తుంది.',
        'JavaScript నుంచి ఎలిమెంట్ CSS ను మారుస్తుంది.',
        'క్లిక్ లాంటిది జరిగినప్పుడు ఒక ఫంక్షన్‌ను నడుపుతుంది.',
        'ఇన్‌పుట్ బాక్స్‌లో టైప్ చేసిన రాత. Number(box.value) దాన్ని సంఖ్యగా మారుస్తుంది.',
        'alert() ఒక పాప్-అప్ సందేశం చూపిస్తుంది; prompt() వాడుకరిని జవాబు టైప్ చేయమంటుంది.',
        'యాదృచ్ఛిక (random) సంఖ్యను ఇస్తుంది. ఈ ఉదాహరణ పాచిక వేస్తుంది: 1 నుంచి 6.',
        'విలువల జాబితా. colours[0] మొదటి అంశం, colours.length మొత్తం ఎన్ని ఉన్నాయో చెబుతుంది.'
      ]
    }
  },

  kn: {
    tpl: {
      first: {
        name: 'ನನ್ನ ಮೊದಲ ಪುಟ',
        tips: ['ಹೆಸರು, ಹವ್ಯಾಸಗಳು ಮತ್ತು ಗುರಿಗಳನ್ನು ನಿಮ್ಮದಾಗಿ ಬದಲಿಸಿ.', 'CSS ನಲ್ಲಿ h1 ಬಣ್ಣ ಬದಲಿಸಿ, ಉದಾ. color: green;'],
        t: {
          title: 'ನನ್ನ ಬಗ್ಗೆ', h1: 'ನಮಸ್ಕಾರ, ನಾನು ರಿಯಾ ಹೆಗ್ಡೆ 👋', photo_alt: 'ರಿಯಾಳ ಚಿತ್ರ',
          intro: 'ನಾನು ಕರ್ನಾಟಕದ ಮೈಸೂರಿನಲ್ಲಿ 7ನೇ ತರಗತಿ ಓದುತ್ತಿದ್ದೇನೆ. ನನಗೆ ಕಥೆಗಳು, ಚಿತ್ರಕಲೆ ಮತ್ತು ಕಂಪ್ಯೂಟರ್ ತುಂಬಾ ಇಷ್ಟ.',
          h_hobbies: 'ನನ್ನ ಹವ್ಯಾಸಗಳು', hobby1: 'ಕ್ರಿಕೆಟ್ ಆಡುವುದು 🏏', hobby2: 'ಚಿತ್ರ ಬಿಡಿಸುವುದು ಮತ್ತು ಬಣ್ಣ ಹಚ್ಚುವುದು 🎨', hobby3: 'ಕಾಮಿಕ್ಸ್ ಓದುವುದು 📚',
          h_goals: 'ಈ ವರ್ಷದ ನನ್ನ ಗುರಿಗಳು', goal1: '12 ಹೊಸ ಪುಸ್ತಕಗಳನ್ನು ಓದುವುದು', goal2: 'ನನ್ನದೇ ಒಂದು ವೆಬ್‌ಸೈಟ್ ಮಾಡುವುದು',
          fav: 'ನನ್ನ ಇಷ್ಟದ ವಿಷಯ <strong>ವಿಜ್ಞಾನ</strong>. ಈಗ ನಾನು <em>HTML</em> ಕಲಿಯುತ್ತಿದ್ದೇನೆ!',
          footer: 'HTML ಮತ್ತು CSS ಬಳಸಿ ರಿಯಾ ಮಾಡಿದ್ದು 💻',
          c_html: 'ಟ್ಯಾಗ್‌ಗಳ ನಡುವಿನ ಪದಗಳನ್ನು ಬದಲಿಸಿ, ಪ್ರಿವ್ಯೂ ಬದಲಾಗುವುದನ್ನು ನೋಡಿ.',
          c_css: 'ಬಣ್ಣ, ಗಾತ್ರ ಮತ್ತು ಜಾಗವನ್ನು CSS ನಿರ್ಧರಿಸುತ್ತದೆ.',
          c_js: 'ಈ ಸಾಲು ಕನ್ಸೋಲ್‌ನಲ್ಲಿ ಒಂದು ಸಂದೇಶ ಬರೆಯುತ್ತದೆ.',
          log: 'ನಮಸ್ಕಾರ! ನನ್ನ ಪುಟ ಸಿದ್ಧವಾಗಿದೆ.'
        }
      },
      timetable: {
        name: 'ನನ್ನ ವೇಳಾಪಟ್ಟಿ',
        tips: ['6ನೇ ಅವಧಿಗಾಗಿ ಹೊಸ ಸಾಲು ಸೇರಿಸಿ.', 'CSS ನಲ್ಲಿ th ಕೋಶಗಳ ಹಿನ್ನೆಲೆ ಬಣ್ಣ ಬದಲಿಸಿ.'],
        t: {
          title: 'ನನ್ನ ವೇಳಾಪಟ್ಟಿ', h1: 'ನಮ್ಮ ತರಗತಿಯ ವೇಳಾಪಟ್ಟಿ', caption: '7ನೇ ತರಗತಿ, ಬಿ ವಿಭಾಗ', period: 'ಅವಧಿ',
          mon: 'ಸೋಮ', tue: 'ಮಂಗಳ', wed: 'ಬುಧ', thu: 'ಗುರು', fri: 'ಶುಕ್ರ', sat: 'ಶನಿ',
          maths: 'ಗಣಿತ', science: 'ವಿಜ್ಞಾನ', english: 'ಇಂಗ್ಲಿಷ್', lang_sub: 'ಕನ್ನಡ', sst: 'ಸಮಾಜ ವಿಜ್ಞಾನ',
          computer: 'ಕಂಪ್ಯೂಟರ್', art: 'ಚಿತ್ರಕಲೆ', games: 'ಆಟಗಳು', lunch: 'ಊಟದ ವಿರಾಮ',
          c_scroll: 'ಸಣ್ಣ ಪರದೆಯಲ್ಲಿ ಟೇಬಲ್ ಪಕ್ಕಕ್ಕೆ ಸರಿಯುತ್ತದೆ',
          c_html: 'tr = ಸಾಲು, th = ಶೀರ್ಷಿಕೆ ಕೋಶ, td = ಕೋಶ. colspan ಕೋಶಗಳನ್ನು ಜೋಡಿಸುತ್ತದೆ.',
          c_js: 'ಇಂದಿನ ದಿನದ ಕಾಲಮ್ ಅನ್ನು ಹೈಲೈಟ್ ಮಾಡು (ಭಾನುವಾರ ಏನೂ ಹೈಲೈಟ್ ಆಗುವುದಿಲ್ಲ).'
        }
      },
      form: {
        name: 'ಅಭಿಪ್ರಾಯ ಫಾರ್ಮ್',
        tips: ['select ಬಾಕ್ಸ್ ಇರುವ ಹೊಸ ಪ್ರಶ್ನೆ ಸೇರಿಸಿ, ಉದಾ. ನಿಮ್ಮ ಇಷ್ಟದ ವಿಷಯ.', '"ಅಭಿಪ್ರಾಯ ಕಳುಹಿಸಿ" ಒತ್ತಿ ಕನ್ಸೋಲ್ ನೋಡಿ.'],
        t: {
          title: 'ಅಭಿಪ್ರಾಯ ಫಾರ್ಮ್', h1: 'ತರಗತಿಯ ಅಭಿಪ್ರಾಯ', intro: 'ಇಂದಿನ ಕಂಪ್ಯೂಟರ್ ತರಗತಿ ನಿಮಗೆ ಹೇಗಿತ್ತು ಎಂದು ತಿಳಿಸಿ.',
          name: 'ನಿಮ್ಮ ಹೆಸರು', name_ph: 'ಉದಾ. ಆರವ್', cls: 'ತರಗತಿ', rating: 'ತರಗತಿ ಹೇಗಿತ್ತು?',
          r5: 'ತುಂಬಾ ಚೆನ್ನಾಗಿತ್ತು', r3: 'ಪರವಾಗಿಲ್ಲ', r1: 'ಕಷ್ಟವಾಗಿತ್ತು', liked: 'ನಿಮಗೆ ಏನು ಇಷ್ಟವಾಯಿತು?',
          l1: 'ಆಟಗಳು', l2: 'ವಿಡಿಯೋಗಳು', l3: 'ಗುಂಪು ಪ್ರಾಜೆಕ್ಟ್', msg: 'ಏನಾದರೂ ಸಲಹೆ?', msg_ph: 'ಇಲ್ಲಿ ಬರೆಯಿರಿ…',
          send: 'ಅಭಿಪ್ರಾಯ ಕಳುಹಿಸಿ', thanks: 'ಧನ್ಯವಾದಗಳು', got: 'ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ತಲುಪಿದೆ.', log: 'ಅಭಿಪ್ರಾಯ ಕಳುಹಿಸಿದವರು',
          c_js: 'ಫಾರ್ಮ್ ಕಳುಹಿಸಿದಾಗ ಧನ್ಯವಾದ ಸಂದೇಶ ತೋರಿಸು.', c_prevent: 'ಇದೇ ಪುಟದಲ್ಲಿ ಇರು'
        }
      },
      card: {
        name: 'CSS ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್',
        tips: ['.card ನ border-radius ಅನ್ನು 0 ಮಾಡಿ ಏನಾಗುತ್ತದೆ ನೋಡಿ.', 'font-size ಬಳಸಿ ಅವತಾರವನ್ನು ದೊಡ್ಡದಾಗಿಸಿ.'],
        t: {
          title: 'ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್', name: 'ಅನನ್ಯಾ ಭಟ್', role: '9ನೇ ತರಗತಿ · ವಿಜ್ಞಾನ ಕ್ಲಬ್ ನಾಯಕಿ',
          bio: 'ನನಗೆ ರೋಬೋಟ್ ಮಾಡುವುದು ಮತ್ತು ನಕ್ಷತ್ರ ನೋಡುವುದು ಇಷ್ಟ. ಇಸ್ರೋದಲ್ಲಿ ಕೆಲಸ ಮಾಡುವುದು ನನ್ನ ಕನಸು.',
          s1: 'ಪ್ರಾಜೆಕ್ಟ್‌ಗಳು', s2: 'ಪದಕಗಳು', s3: 'ರೋಬೋಟ್‌ಗಳು', follow: 'ಫಾಲೋ ಮಾಡಿ', following: 'ಫಾಲೋ ಮಾಡುತ್ತಿದ್ದೀರಿ ✓',
          c_css: 'ಕೆಳಗಿನ ಸಂಖ್ಯೆಗಳು ಮತ್ತು ಬಣ್ಣಗಳನ್ನು ಬದಲಿಸಿ ನೋಡಿ.',
          c_js: 'ಬಟನ್ ಅನ್ನು "ಫಾಲೋ ಮಾಡಿ" ಮತ್ತು "ಫಾಲೋ ಮಾಡುತ್ತಿದ್ದೀರಿ" ನಡುವೆ ಬದಲಿಸು.'
        }
      },
      colorbtn: {
        name: 'ಬಣ್ಣ ಬದಲಿಸುವ ಬಟನ್',
        tips: ['ಎರಡೂ ಪಟ್ಟಿಗಳಿಗೆ ಇನ್ನೊಂದು ಬಣ್ಣ ಮತ್ತು ಅದರ ಹೆಸರು ಸೇರಿಸಿ.', '10 ಕ್ಲಿಕ್‌ಗಳ ನಂತರ ಬಟನ್ ಬರಹ ಬದಲಿಸಲು if ಬಳಸಿ.'],
        t: {
          title: 'ಮಾಯಾ ಬಟನ್', h1: 'ಮಾಯಾ ಬಟನ್', intro: 'ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ. ಪ್ರತಿ ಬಾರಿ JavaScript ಅದರ ಬಣ್ಣ ಬದಲಿಸುತ್ತದೆ.',
          btn: 'ನನ್ನನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ!', clicks: 'ಕ್ಲಿಕ್‌ಗಳು:', colour: 'ಬಣ್ಣ:',
          c1: 'ಕೇಸರಿ', c2: 'ಹಸಿರು', c3: 'ಕಡು ನೀಲಿ', c4: 'ಗುಲಾಬಿ', c5: 'ನೇರಳೆ', c6: 'ನೀಲಿ ಹಸಿರು',
          c_list: 'ಬಣ್ಣಗಳ ಒಂದು ಪಟ್ಟಿ (array) ಮತ್ತು ಅವುಗಳ ಹೆಸರುಗಳ ಒಂದು ಪಟ್ಟಿ',
          c_mod: '% ಶೇಷವನ್ನು ಕೊಡುತ್ತದೆ, ಹಾಗಾಗಿ ಬಣ್ಣಗಳು ಮತ್ತೆ ಮತ್ತೆ ಬರುತ್ತವೆ'
        }
      },
      calc: {
        name: 'ಸರಳ ಕ್ಯಾಲ್ಕುಲೇಟರ್',
        tips: ['% (ಶೇಷ) ಗಾಗಿ ಒಂದು ಬಟನ್ ಸೇರಿಸಿ.', '0 ಯಿಂದ ಭಾಗಿಸಿ ನೋಡಿ. ಕೋಡ್‌ನ ಯಾವ ಸಾಲುಗಳು ಅದನ್ನು ನಿಭಾಯಿಸುತ್ತವೆ?'],
        t: {
          title: 'ಕ್ಯಾಲ್ಕುಲೇಟರ್', h1: 'ಸರಳ ಕ್ಯಾಲ್ಕುಲೇಟರ್', first: 'ಮೊದಲ ಸಂಖ್ಯೆ', second: 'ಎರಡನೇ ಸಂಖ್ಯೆ', answer: 'ಉತ್ತರ:',
          empty: 'ದಯವಿಟ್ಟು ಎರಡೂ ಸಂಖ್ಯೆಗಳನ್ನು ಬರೆಯಿರಿ', zero: '0 ಯಿಂದ ಭಾಗಿಸಲು ಆಗುವುದಿಲ್ಲ',
          c_js: 'ಎರಡು ಸಂಖ್ಯೆಗಳನ್ನು ಓದಿ, ಲೆಕ್ಕ ಮಾಡಿ, ಉತ್ತರ ತೋರಿಸು.',
          c_number: 'Number() ಬರಹವನ್ನು ಸಂಖ್ಯೆಯಾಗಿ ಬದಲಿಸುತ್ತದೆ'
        }
      },
      quiz: {
        name: 'ಕ್ವಿಜ್ ಪುಟ',
        tips: ['ಪಟ್ಟಿಗೆ ನಿಮ್ಮದೇ ಒಂದು ಪ್ರಶ್ನೆ ಸೇರಿಸಿ.', 'CSS ನಲ್ಲಿ .right ಮತ್ತು .wrong ಬಣ್ಣಗಳನ್ನು ಬದಲಿಸಿ.'],
        t: {
          title: 'ಕ್ವಿಜ್', h1: 'ಚುಟುಕು ಕ್ವಿಜ್',
          q1: 'ಭಾರತದ ರಾಜಧಾನಿ ಯಾವುದು?', q1a: 'ಮುಂಬೈ', q1b: 'ನವದೆಹಲಿ', q1c: 'ಕೋಲ್ಕತ್ತಾ',
          q2: 'ನಮ್ಮ ಸೌರವ್ಯೂಹದ ಅತಿ ದೊಡ್ಡ ಗ್ರಹ ಯಾವುದು?', q2a: 'ಭೂಮಿ', q2b: 'ಮಂಗಳ', q2c: 'ಗುರು',
          q3: 'ಷಡ್ಭುಜಕ್ಕೆ ಎಷ್ಟು ಬಾಹುಗಳಿವೆ?',
          q4: 'ಆಹಾರ ತಯಾರಿಸಲು ಸಸ್ಯಗಳು ಗಾಳಿಯಿಂದ ಯಾವ ಅನಿಲ ತೆಗೆದುಕೊಳ್ಳುತ್ತವೆ?', q4a: 'ಆಮ್ಲಜನಕ', q4b: 'ಇಂಗಾಲದ ಡೈಆಕ್ಸೈಡ್', q4c: 'ಸಾರಜನಕ',
          right: 'ಸರಿ ಉತ್ತರ! 🎉', wrong: 'ಅಯ್ಯೋ! ಸರಿಯಾದ ಉತ್ತರ:', score: 'ಅಂಕ:', next: 'ಮುಂದಿನ ಪ್ರಶ್ನೆ', again: 'ಮತ್ತೆ ಆಡಿ',
          c_js: 'ಪ್ರತಿ ಪ್ರಶ್ನೆಯಲ್ಲಿ ಅದರ ಪಠ್ಯ, ಆಯ್ಕೆಗಳು ಮತ್ತು ಸರಿಯಾದ ಆಯ್ಕೆಯ ಸಂಖ್ಯೆ (ಎಣಿಕೆ 0 ಯಿಂದ) ಇವೆ.'
        }
      },
      blank: {
        name: 'ಖಾಲಿ ಪುಟ',
        tips: ['ಮೊದಲು ಒಂದು ಶೀರ್ಷಿಕೆ ಮತ್ತು ಒಂದು ಪ್ಯಾರಾ ಬರೆಯಿರಿ, ನಂತರ ಇನ್ನಷ್ಟು ಟ್ಯಾಗ್ ಸೇರಿಸಿ.', 'ಟ್ಯಾಗ್, ಸ್ಟೈಲ್ ಮತ್ತು ಕೋಡ್ ಸೇರಿಸಲು ಕೆಳಗಿನ ಚೀಟ್-ಶೀಟ್ ಬಳಸಿ.'],
        t: { title: 'ನನ್ನ ವೆಬ್ ಪುಟ', h1: 'ನನ್ನ ವೆಬ್ ಪುಟ', p: 'ಇಲ್ಲಿ ಬರೆಯಲು ಶುರು ಮಾಡಿ.', c_js: 'ನಿಮ್ಮ JavaScript ಅನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ.' }
      }
    },
    cheat: {
      html: [
        'ಶೀರ್ಷಿಕೆಗಳು. h1 ಅತಿ ದೊಡ್ಡದು ಮತ್ತು ಅತಿ ಮುಖ್ಯವಾದದ್ದು, h6 ಅತಿ ಚಿಕ್ಕದು.',
        'ಬರಹದ ಒಂದು ಪ್ಯಾರಾ.',
        'br ಹೊಸ ಸಾಲು ಶುರು ಮಾಡುತ್ತದೆ; hr ಪುಟದ ಅಡ್ಡಲಾಗಿ ಗೆರೆ ಎಳೆಯುತ್ತದೆ. ಇವುಗಳಿಗೆ ಮುಚ್ಚುವ ಟ್ಯಾಗ್ ಬೇಡ.',
        'strong ಪದಗಳನ್ನು ದಪ್ಪ ಮತ್ತು ಮುಖ್ಯವಾಗಿಸುತ್ತದೆ; em ಅವುಗಳನ್ನು ಓರೆಯಾಗಿಸುತ್ತದೆ.',
        'ಇನ್ನೊಂದು ಪುಟಕ್ಕೆ ಲಿಂಕ್. href ಅದರ ವಿಳಾಸ.',
        'ಚಿತ್ರ ತೋರಿಸುತ್ತದೆ. ನೋಡಲಾಗದವರಿಗಾಗಿ alt ಚಿತ್ರವನ್ನು ವಿವರಿಸುತ್ತದೆ.',
        'ಬುಲೆಟ್ ಇರುವ ಪಟ್ಟಿ. ಪ್ರತಿ ಅಂಶ li ಒಳಗೆ ಬರುತ್ತದೆ.',
        'ಸಂಖ್ಯೆ ಇರುವ ಪಟ್ಟಿ: 1, 2, 3…',
        'ಒಂದು ಟೇಬಲ್. tr ಒಂದು ಸಾಲು, th ಶೀರ್ಷಿಕೆ ಕೋಶ, td ಸಾಮಾನ್ಯ ಕೋಶ.',
        'ಇತರ ಟ್ಯಾಗ್‌ಗಳನ್ನು ಒಟ್ಟಿಗೆ ಇಡುವ ಪೆಟ್ಟಿಗೆ, ಆಗ ಅವುಗಳಿಗೆ ಒಟ್ಟಿಗೆ ಸ್ಟೈಲ್ ಕೊಡಬಹುದು.',
        'ಸಾಲಿನೊಳಗಿನ ಕೆಲವು ಪದಗಳನ್ನು ಗುರುತಿಸುತ್ತದೆ, ಉದಾ. ಅವುಗಳಿಗೆ ಬಣ್ಣ ಕೊಡಲು.',
        'ಒಂದು ಬಟನ್. ಅದನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿದಾಗ JavaScript ಏನಾದರೂ ಮಾಡಬಹುದು.',
        'ಟೈಪ್ ಮಾಡುವ ಬಾಕ್ಸ್, ಅದರ ಲೇಬಲ್ ಜೊತೆ. type ಎಂಬುದು text, number, date, color… ಆಗಿರಬಹುದು.',
        'ಆಯ್ಕೆಗಳ ಡ್ರಾಪ್-ಡೌನ್ ಪಟ್ಟಿ.',
        'ಹಲವು ಸಾಲು ಬರೆಯಲು ದೊಡ್ಡ ಬಾಕ್ಸ್.',
        'ಪುಟದ ಭಾಗಗಳಿಗೆ ಹೆಸರು ಕೊಡುತ್ತದೆ: ಮೇಲ್ಭಾಗ, ಮುಖ್ಯ ವಿಷಯ ಮತ್ತು ಕೆಳಭಾಗ.',
        'ಕಾಮೆಂಟ್: ಜನರಿಗಾಗಿ ಒಂದು ಟಿಪ್ಪಣಿ. ಬ್ರೌಸರ್ ಇದನ್ನು ತೋರಿಸುವುದಿಲ್ಲ.'
      ],
      css: [
        'ಬರಹದ ಬಣ್ಣ. ಹೆಸರು (red), hex ಕೋಡ್ (#ff9933) ಅಥವಾ rgb() ಬಳಸಿ.',
        'ಎಲಿಮೆಂಟ್‌ನ ಹಿಂದಿನ ಬಣ್ಣ.',
        'ಅಕ್ಷರಗಳ ಗಾತ್ರ.',
        'ಫಾಂಟ್ (ಅಕ್ಷರಗಳ ಶೈಲಿ). ಮೊದಲನೆಯದು ಇಲ್ಲದಿದ್ದರೆ ನೆರವಾಗಲು ಎರಡನೆಯದನ್ನೂ ಬರೆಯಿರಿ.',
        'ಬರಹವನ್ನು ಎಡ, ಬಲ ಅಥವಾ ಮಧ್ಯದಲ್ಲಿ ಜೋಡಿಸುತ್ತದೆ.',
        'ಎಲಿಮೆಂಟ್‌ನ ಹೊರಗಿನ ಜಾಗ, ಅದು ಮತ್ತು ಪಕ್ಕದವುಗಳ ನಡುವೆ.',
        'ಎಲಿಮೆಂಟ್‌ನ ಒಳಗಿನ ಜಾಗ, ಅದರ ಅಂಚು ಮತ್ತು ಒಳಗಿನ ವಿಷಯದ ನಡುವೆ.',
        'ಎಲಿಮೆಂಟ್ ಸುತ್ತ ಒಂದು ಗೆರೆ: ದಪ್ಪ, ಶೈಲಿ ಮತ್ತು ಬಣ್ಣ.',
        'ಮೂಲೆಗಳನ್ನು ದುಂಡಾಗಿಸುತ್ತದೆ. 50% ಕೊಟ್ಟರೆ ಚೌಕ ವೃತ್ತವಾಗುತ್ತದೆ.',
        'ಎಲಿಮೆಂಟ್‌ನ ಗಾತ್ರ. % ಎಂದರೆ ಸುತ್ತಲಿನ ಜಾಗದ ಒಂದು ಭಾಗ.',
        'ಒಳಗಿನ ಎಲಿಮೆಂಟ್‌ಗಳನ್ನು ಅಕ್ಕಪಕ್ಕ ಇಡುತ್ತದೆ. gap ಅವುಗಳ ನಡುವೆ ಜಾಗ ಕೊಡುತ್ತದೆ.',
        'ಮೃದುವಾದ ನೆರಳು ಸೇರಿಸುತ್ತದೆ, ಆಗ ಎಲಿಮೆಂಟ್ ಮೇಲೆದ್ದಂತೆ ಕಾಣುತ್ತದೆ.',
        'ಮೌಸ್ ಎಲಿಮೆಂಟ್ ಮೇಲಿದ್ದಾಗ ಮಾತ್ರ ಬರುವ ಸ್ಟೈಲ್.',
        '.note ಎಂಬುದು class="note" ಇರುವ ಎಲ್ಲಾ ಎಲಿಮೆಂಟ್‌ಗಳನ್ನು ಆರಿಸುತ್ತದೆ; #title ಎಂಬುದು id="title" ಇರುವ ಎಲಿಮೆಂಟ್ ಅನ್ನು ಆರಿಸುತ್ತದೆ.',
        'ಫೋನ್‌ನಂತಹ ಸಣ್ಣ ಪರದೆಗಳಿಗಾಗಿ ಬೇರೆ ಸ್ಟೈಲ್‌ಗಳು.'
      ],
      js: [
        'ಕನ್ಸೋಲ್‌ನಲ್ಲಿ ಒಂದು ಮೌಲ್ಯ ಬರೆಯುತ್ತದೆ. ನಿಮ್ಮ ಕೋಡ್ ಪರಿಶೀಲಿಸಲು ತುಂಬಾ ಉಪಯುಕ್ತ.',
        'ಮೌಲ್ಯ ಇಡಲು ವೇರಿಯಬಲ್ ಮಾಡುತ್ತದೆ. const ಅನ್ನು ನಂತರ ಬದಲಿಸಲು ಆಗುವುದಿಲ್ಲ.',
        'ಷರತ್ತು ಸರಿಯಾಗಿದ್ದಾಗ ಮಾತ್ರ ಕೋಡ್ ನಡೆಯುತ್ತದೆ; ತಪ್ಪಾಗಿದ್ದರೆ else ನಡೆಯುತ್ತದೆ.',
        'ಕೋಡ್ ಅನ್ನು ಮತ್ತೆ ಮತ್ತೆ ನಡೆಸುತ್ತದೆ. ಈ ಲೂಪ್ 1 ರಿಂದ 5 ರವರೆಗೆ ಎಣಿಸುತ್ತದೆ.',
        'ಹೆಸರಿರುವ ಕೋಡ್ ಭಾಗ, ಅದನ್ನು ಮತ್ತೆ ಮತ್ತೆ ಬಳಸಬಹುದು.',
        'ಈ id ಇರುವ HTML ಎಲಿಮೆಂಟ್ ಅನ್ನು ಹುಡುಕುತ್ತದೆ.',
        '".note" ಅಥವಾ "h1" ನಂತಹ CSS ಸೆಲೆಕ್ಟರ್‌ಗೆ ಹೊಂದುವ ಮೊದಲ ಎಲಿಮೆಂಟ್ ಹುಡುಕುತ್ತದೆ.',
        'ಎಲಿಮೆಂಟ್ ಒಳಗಿನ ಬರಹವನ್ನು ಓದುತ್ತದೆ ಅಥವಾ ಬದಲಿಸುತ್ತದೆ.',
        'JavaScript ನಿಂದ ಎಲಿಮೆಂಟ್‌ನ CSS ಬದಲಿಸುತ್ತದೆ.',
        'ಕ್ಲಿಕ್‌ನಂತಹ ಏನಾದರೂ ನಡೆದಾಗ ಒಂದು ಫಂಕ್ಷನ್ ನಡೆಸುತ್ತದೆ.',
        'ಇನ್‌ಪುಟ್ ಬಾಕ್ಸ್‌ನಲ್ಲಿ ಟೈಪ್ ಮಾಡಿದ ಬರಹ. Number(box.value) ಅದನ್ನು ಸಂಖ್ಯೆಯಾಗಿಸುತ್ತದೆ.',
        'alert() ಪಾಪ್-ಅಪ್ ಸಂದೇಶ ತೋರಿಸುತ್ತದೆ; prompt() ಬಳಕೆದಾರರಿಗೆ ಉತ್ತರ ಟೈಪ್ ಮಾಡಲು ಕೇಳುತ್ತದೆ.',
        'ಯಾದೃಚ್ಛಿಕ (random) ಸಂಖ್ಯೆ ಕೊಡುತ್ತದೆ. ಈ ಉದಾಹರಣೆ ದಾಳ ಎಸೆಯುತ್ತದೆ: 1 ರಿಂದ 6.',
        'ಮೌಲ್ಯಗಳ ಪಟ್ಟಿ. colours[0] ಮೊದಲ ಅಂಶ; colours.length ಒಟ್ಟು ಎಷ್ಟು ಇವೆ ಎಂದು ಹೇಳುತ್ತದೆ.'
      ]
    }
  },

  ml: {
    tpl: {
      first: {
        name: 'എന്റെ ആദ്യ പേജ്',
        tips: ['പേരും ഹോബികളും ലക്ഷ്യങ്ങളും നിങ്ങളുടേതാക്കി മാറ്റൂ.', 'CSS-ൽ h1-ന്റെ നിറം മാറ്റൂ, ഉദാ. color: green;'],
        t: {
          title: 'എന്നെക്കുറിച്ച്', h1: 'നമസ്കാരം, ഞാൻ റിയ നായർ 👋', photo_alt: 'റിയയുടെ ചിത്രം',
          intro: 'ഞാൻ കേരളത്തിലെ കോഴിക്കോട്ട് ഏഴാം ക്ലാസിൽ പഠിക്കുന്നു. കഥകളും ചിത്രരചനയും കമ്പ്യൂട്ടറും എനിക്ക് വളരെ ഇഷ്ടമാണ്.',
          h_hobbies: 'എന്റെ ഹോബികൾ', hobby1: 'ക്രിക്കറ്റ് കളിക്കൽ 🏏', hobby2: 'ചിത്രം വരയ്ക്കലും നിറം കൊടുക്കലും 🎨', hobby3: 'കോമിക്സ് വായന 📚',
          h_goals: 'ഈ വർഷത്തെ എന്റെ ലക്ഷ്യങ്ങൾ', goal1: '12 പുതിയ പുസ്തകങ്ങൾ വായിക്കുക', goal2: 'സ്വന്തമായി ഒരു വെബ്സൈറ്റ് ഉണ്ടാക്കുക',
          fav: 'എന്റെ ഇഷ്ട വിഷയം <strong>ശാസ്ത്രം</strong> ആണ്. ഇപ്പോൾ ഞാൻ <em>HTML</em> പഠിക്കുന്നു!',
          footer: 'HTML-ഉം CSS-ഉം ഉപയോഗിച്ച് റിയ ഉണ്ടാക്കിയത് 💻',
          c_html: 'ടാഗുകൾക്കിടയിലെ വാക്കുകൾ മാറ്റി പ്രിവ്യൂ മാറുന്നത് കാണൂ.',
          c_css: 'നിറം, വലുപ്പം, ഇടം എന്നിവ CSS തീരുമാനിക്കുന്നു.',
          c_js: 'ഈ വരി കൺസോളിൽ ഒരു സന്ദേശം എഴുതുന്നു.',
          log: 'നമസ്കാരം! എന്റെ പേജ് തയ്യാർ.'
        }
      },
      timetable: {
        name: 'എന്റെ ടൈംടേബിൾ',
        tips: ['6-ാം പീരിയഡിനായി ഒരു പുതിയ വരി ചേർക്കൂ.', 'CSS-ൽ th കളങ്ങളുടെ പശ്ചാത്തല നിറം മാറ്റൂ.'],
        t: {
          title: 'എന്റെ ടൈംടേബിൾ', h1: 'എന്റെ ക്ലാസ് ടൈംടേബിൾ', caption: '7-ാം ക്ലാസ്, ബി ഡിവിഷൻ', period: 'പീരിയഡ്',
          mon: 'തിങ്കൾ', tue: 'ചൊവ്വ', wed: 'ബുധൻ', thu: 'വ്യാഴം', fri: 'വെള്ളി', sat: 'ശനി',
          maths: 'ഗണിതം', science: 'ശാസ്ത്രം', english: 'ഇംഗ്ലീഷ്', lang_sub: 'മലയാളം', sst: 'സാമൂഹ്യശാസ്ത്രം',
          computer: 'കമ്പ്യൂട്ടർ', art: 'ചിത്രകല', games: 'കായികം', lunch: 'ഉച്ചഭക്ഷണ ഇടവേള',
          c_scroll: 'ചെറിയ സ്ക്രീനിൽ ടേബിൾ വശത്തേക്ക് നീക്കാം',
          c_html: 'tr = വരി, th = തലക്കെട്ട് കളം, td = കളം. colspan കളങ്ങൾ ചേർക്കുന്നു.',
          c_js: 'ഇന്നത്തെ ദിവസത്തിന്റെ കോളം ഹൈലൈറ്റ് ചെയ്യുക (ഞായറാഴ്ച ഒന്നും ഹൈലൈറ്റ് ആകില്ല).'
        }
      },
      form: {
        name: 'അഭിപ്രായ ഫോം',
        tips: ['select ബോക്സ് ഉള്ള ഒരു പുതിയ ചോദ്യം ചേർക്കൂ, ഉദാ. നിങ്ങളുടെ ഇഷ്ട വിഷയം.', '"അഭിപ്രായം അയയ്ക്കൂ" അമർത്തി കൺസോൾ നോക്കൂ.'],
        t: {
          title: 'അഭിപ്രായ ഫോം', h1: 'ക്ലാസ് അഭിപ്രായം', intro: 'ഇന്നത്തെ കമ്പ്യൂട്ടർ ക്ലാസ് എങ്ങനെയുണ്ടായിരുന്നു എന്ന് പറയൂ.',
          name: 'നിങ്ങളുടെ പേര്', name_ph: 'ഉദാ. ആരവ്', cls: 'ക്ലാസ്', rating: 'ക്ലാസ് എങ്ങനെയുണ്ടായിരുന്നു?',
          r5: 'വളരെ നല്ലത്', r3: 'കുഴപ്പമില്ല', r1: 'ബുദ്ധിമുട്ടായിരുന്നു', liked: 'നിങ്ങൾക്ക് എന്താണ് ഇഷ്ടമായത്?',
          l1: 'കളികൾ', l2: 'വീഡിയോകൾ', l3: 'ഗ്രൂപ്പ് പ്രോജക്ട്', msg: 'എന്തെങ്കിലും നിർദ്ദേശം?', msg_ph: 'ഇവിടെ എഴുതൂ…',
          send: 'അഭിപ്രായം അയയ്ക്കൂ', thanks: 'നന്ദി', got: 'നിങ്ങളുടെ അഭിപ്രായം കിട്ടി.', log: 'അഭിപ്രായം അയച്ചത്',
          c_js: 'ഫോം അയയ്ക്കുമ്പോൾ നന്ദി സന്ദേശം കാണിക്കുക.', c_prevent: 'ഇതേ പേജിൽ തുടരുക'
        }
      },
      card: {
        name: 'CSS പ്രൊഫൈൽ കാർഡ്',
        tips: ['.card-ന്റെ border-radius 0 ആക്കി എന്ത് സംഭവിക്കുന്നു എന്ന് നോക്കൂ.', 'font-size ഉപയോഗിച്ച് അവതാർ വലുതാക്കൂ.'],
        t: {
          title: 'പ്രൊഫൈൽ കാർഡ്', name: 'അനന്യ മേനോൻ', role: '9-ാം ക്ലാസ് · സയൻസ് ക്ലബ് ക്യാപ്റ്റൻ',
          bio: 'റോബോട്ടുകൾ ഉണ്ടാക്കാനും നക്ഷത്രങ്ങളെ നോക്കാനും എനിക്ക് ഇഷ്ടമാണ്. ഐഎസ്ആർഒയിൽ ജോലി ചെയ്യുകയാണ് എന്റെ സ്വപ്നം.',
          s1: 'പ്രോജക്ടുകൾ', s2: 'മെഡലുകൾ', s3: 'റോബോട്ടുകൾ', follow: 'ഫോളോ ചെയ്യൂ', following: 'ഫോളോ ചെയ്യുന്നു ✓',
          c_css: 'താഴെയുള്ള സംഖ്യകളും നിറങ്ങളും മാറ്റിനോക്കൂ.',
          c_js: 'ബട്ടൺ "ഫോളോ ചെയ്യൂ", "ഫോളോ ചെയ്യുന്നു" എന്നിവയ്ക്കിടയിൽ മാറ്റുക.'
        }
      },
      colorbtn: {
        name: 'നിറം മാറുന്ന ബട്ടൺ',
        tips: ['രണ്ട് ലിസ്റ്റിലും ഒരു നിറവും അതിന്റെ പേരും കൂടി ചേർക്കൂ.', '10 ക്ലിക്കിന് ശേഷം ബട്ടണിലെ എഴുത്ത് മാറ്റാൻ if ഉപയോഗിക്കൂ.'],
        t: {
          title: 'മാജിക് ബട്ടൺ', h1: 'മാജിക് ബട്ടൺ', intro: 'ബട്ടണിൽ ക്ലിക്ക് ചെയ്യൂ. ഓരോ തവണയും JavaScript അതിന്റെ നിറം മാറ്റും.',
          btn: 'എന്നെ ക്ലിക്ക് ചെയ്യൂ!', clicks: 'ക്ലിക്കുകൾ:', colour: 'നിറം:',
          c1: 'കാവി', c2: 'പച്ച', c3: 'കടുംനീല', c4: 'പിങ്ക്', c5: 'പർപ്പിൾ', c6: 'നീലപ്പച്ച',
          c_list: 'നിറങ്ങളുടെ ഒരു ലിസ്റ്റ് (array), അവയുടെ പേരുകളുടെ ഒരു ലിസ്റ്റ്',
          c_mod: '% ശിഷ്ടം തരുന്നു, അതിനാൽ നിറങ്ങൾ വീണ്ടും വീണ്ടും വരുന്നു'
        }
      },
      calc: {
        name: 'ലളിതമായ കാൽക്കുലേറ്റർ',
        tips: ['% (ശിഷ്ടം) ന് ഒരു ബട്ടൺ ചേർക്കൂ.', '0 കൊണ്ട് ഹരിച്ചുനോക്കൂ. കോഡിലെ ഏത് വരികളാണ് അത് കൈകാര്യം ചെയ്യുന്നത്?'],
        t: {
          title: 'കാൽക്കുലേറ്റർ', h1: 'ലളിതമായ കാൽക്കുലേറ്റർ', first: 'ഒന്നാമത്തെ സംഖ്യ', second: 'രണ്ടാമത്തെ സംഖ്യ', answer: 'ഉത്തരം:',
          empty: 'ദയവായി രണ്ട് സംഖ്യകളും എഴുതൂ', zero: '0 കൊണ്ട് ഹരിക്കാനാവില്ല',
          c_js: 'രണ്ട് സംഖ്യകൾ വായിച്ച്, കണക്കുകൂട്ടി, ഉത്തരം കാണിക്കുക.',
          c_number: 'Number() എഴുത്തിനെ സംഖ്യയാക്കുന്നു'
        }
      },
      quiz: {
        name: 'ക്വിസ് പേജ്',
        tips: ['ലിസ്റ്റിൽ നിങ്ങളുടെ സ്വന്തം ചോദ്യം ഒന്ന് ചേർക്കൂ.', 'CSS-ൽ .right, .wrong എന്നിവയുടെ നിറങ്ങൾ മാറ്റൂ.'],
        t: {
          title: 'ക്വിസ്', h1: 'ചെറിയ ക്വിസ്',
          q1: 'ഇന്ത്യയുടെ തലസ്ഥാനം ഏതാണ്?', q1a: 'മുംബൈ', q1b: 'ന്യൂഡൽഹി', q1c: 'കൊൽക്കത്ത',
          q2: 'നമ്മുടെ സൗരയൂഥത്തിലെ ഏറ്റവും വലിയ ഗ്രഹം ഏതാണ്?', q2a: 'ഭൂമി', q2b: 'ചൊവ്വ', q2c: 'വ്യാഴം',
          q3: 'ഷഡ്ഭുജത്തിന് എത്ര വശങ്ങളുണ്ട്?',
          q4: 'ആഹാരം ഉണ്ടാക്കാൻ സസ്യങ്ങൾ വായുവിൽ നിന്ന് ഏത് വാതകമാണ് എടുക്കുന്നത്?', q4a: 'ഓക്സിജൻ', q4b: 'കാർബൺ ഡൈ ഓക്സൈഡ്', q4c: 'നൈട്രജൻ',
          right: 'ശരി! 🎉', wrong: 'അയ്യോ! ശരിയായ ഉത്തരം:', score: 'സ്കോർ:', next: 'അടുത്ത ചോദ്യം', again: 'വീണ്ടും കളിക്കൂ',
          c_js: 'ഓരോ ചോദ്യത്തിലും അതിന്റെ വാചകം, ഓപ്ഷനുകൾ, ശരിയായ ഓപ്ഷന്റെ നമ്പർ (എണ്ണൽ 0 മുതൽ) എന്നിവയുണ്ട്.'
        }
      },
      blank: {
        name: 'ശൂന്യമായ പേജ്',
        tips: ['ആദ്യം ഒരു തലക്കെട്ടും ഒരു ഖണ്ഡികയും എഴുതൂ, പിന്നെ കൂടുതൽ ടാഗുകൾ ചേർക്കൂ.', 'ടാഗുകളും സ്റ്റൈലുകളും കോഡും ചേർക്കാൻ താഴെയുള്ള ചീറ്റ്-ഷീറ്റ് ഉപയോഗിക്കൂ.'],
        t: { title: 'എന്റെ വെബ് പേജ്', h1: 'എന്റെ വെബ് പേജ്', p: 'ഇവിടെ എഴുതിത്തുടങ്ങൂ.', c_js: 'നിങ്ങളുടെ JavaScript ഇവിടെ എഴുതൂ.' }
      }
    },
    cheat: {
      html: [
        'തലക്കെട്ടുകൾ. h1 ഏറ്റവും വലുതും പ്രധാനപ്പെട്ടതും, h6 ഏറ്റവും ചെറുതും.',
        'എഴുത്തിന്റെ ഒരു ഖണ്ഡിക.',
        'br പുതിയ വരി തുടങ്ങുന്നു; hr പേജിന് കുറുകെ ഒരു വര വരയ്ക്കുന്നു. ഇവയ്ക്ക് അടയ്ക്കുന്ന ടാഗ് വേണ്ട.',
        'strong വാക്കുകളെ കട്ടിയുള്ളതും പ്രധാനപ്പെട്ടതുമാക്കുന്നു; em അവയെ ചരിഞ്ഞതാക്കുന്നു.',
        'മറ്റൊരു പേജിലേക്കുള്ള ലിങ്ക്. href ആണ് അതിന്റെ വിലാസം.',
        'ചിത്രം കാണിക്കുന്നു. കാണാൻ കഴിയാത്തവർക്കായി alt ചിത്രത്തെ വിവരിക്കുന്നു.',
        'ബുള്ളറ്റുകളുള്ള ലിസ്റ്റ്. ഓരോ ഇനവും li-ക്കുള്ളിൽ വരുന്നു.',
        'നമ്പറുകളുള്ള ലിസ്റ്റ്: 1, 2, 3…',
        'ഒരു ടേബിൾ. tr ഒരു വരി, th തലക്കെട്ട് കളം, td സാധാരണ കളം.',
        'മറ്റ് ടാഗുകളെ ഒന്നിച്ച് വയ്ക്കുന്ന പെട്ടി, അപ്പോൾ അവയ്ക്ക് ഒന്നിച്ച് സ്റ്റൈൽ നൽകാം.',
        'ഒരു വരിക്കുള്ളിലെ ചില വാക്കുകളെ അടയാളപ്പെടുത്തുന്നു, ഉദാ. അവയ്ക്ക് നിറം നൽകാൻ.',
        'ഒരു ബട്ടൺ. അതിൽ ക്ലിക്ക് ചെയ്യുമ്പോൾ JavaScript-ന് എന്തെങ്കിലും ചെയ്യാനാകും.',
        'ടൈപ്പ് ചെയ്യാനുള്ള ബോക്സ്, അതിന്റെ ലേബലിനൊപ്പം. type ആകാം text, number, date, color…',
        'ഓപ്ഷനുകളുടെ ഡ്രോപ്പ്-ഡൗൺ ലിസ്റ്റ്.',
        'ഒരുപാട് വരികൾ എഴുതാനുള്ള വലിയ ബോക്സ്.',
        'പേജിന്റെ ഭാഗങ്ങൾക്ക് പേരിടുന്നു: മുകൾഭാഗം, പ്രധാന ഉള്ളടക്കം, താഴ്ഭാഗം.',
        'കമന്റ്: ആളുകൾക്കുള്ള ഒരു കുറിപ്പ്. ബ്രൗസർ ഇത് കാണിക്കില്ല.'
      ],
      css: [
        'എഴുത്തിന്റെ നിറം. പേര് (red), hex കോഡ് (#ff9933) അല്ലെങ്കിൽ rgb() ഉപയോഗിക്കൂ.',
        'എലമെന്റിന് പിന്നിലെ നിറം.',
        'അക്ഷരങ്ങളുടെ വലുപ്പം.',
        'ഫോണ്ട് (അക്ഷരങ്ങളുടെ ശൈലി). ആദ്യത്തേത് ഇല്ലെങ്കിൽ ഉപകരിക്കാൻ രണ്ടാമതൊന്നും എഴുതൂ.',
        'എഴുത്തിനെ ഇടത്, വലത് അല്ലെങ്കിൽ നടുവിൽ ക്രമീകരിക്കുന്നു.',
        'എലമെന്റിന് പുറത്തുള്ള ഇടം, അതിനും അടുത്തുള്ളവയ്ക്കും ഇടയിൽ.',
        'എലമെന്റിനുള്ളിലെ ഇടം, അതിന്റെ ബോർഡറിനും ഉള്ളടക്കത്തിനും ഇടയിൽ.',
        'എലമെന്റിന് ചുറ്റും ഒരു വര: കനം, ശൈലി, നിറം.',
        'മൂലകൾ ഉരുണ്ടതാക്കുന്നു. 50% നൽകിയാൽ ചതുരം വൃത്തമാകും.',
        'എലമെന്റിന്റെ വലുപ്പം. % എന്നാൽ ചുറ്റുമുള്ള സ്ഥലത്തിന്റെ ഒരു ഭാഗം.',
        'ഉള്ളിലെ എലമെന്റുകളെ അടുത്തടുത്ത് വയ്ക്കുന്നു. gap അവയ്ക്കിടയിൽ ഇടം നൽകുന്നു.',
        'മൃദുവായ നിഴൽ ചേർക്കുന്നു, അപ്പോൾ എലമെന്റ് ഉയർന്നുനിൽക്കുന്നതായി തോന്നും.',
        'മൗസ് എലമെന്റിന് മുകളിലായിരിക്കുമ്പോൾ മാത്രം വരുന്ന സ്റ്റൈൽ.',
        '.note എന്നത് class="note" ഉള്ള എല്ലാ എലമെന്റുകളെയും തിരഞ്ഞെടുക്കുന്നു; #title എന്നത് id="title" ഉള്ള എലമെന്റിനെ തിരഞ്ഞെടുക്കുന്നു.',
        'ഫോൺ പോലുള്ള ചെറിയ സ്ക്രീനുകൾക്കുള്ള വേറെ സ്റ്റൈലുകൾ.'
      ],
      js: [
        'കൺസോളിൽ ഒരു മൂല്യം എഴുതുന്നു. നിങ്ങളുടെ കോഡ് പരിശോധിക്കാൻ വളരെ ഉപകാരപ്രദം.',
        'ഒരു മൂല്യം സൂക്ഷിക്കാൻ വേരിയബിൾ ഉണ്ടാക്കുന്നു. const പിന്നീട് മാറ്റാനാവില്ല.',
        'നിബന്ധന ശരിയാകുമ്പോൾ മാത്രം കോഡ് പ്രവർത്തിക്കുന്നു; തെറ്റായാൽ else പ്രവർത്തിക്കുന്നു.',
        'കോഡ് ആവർത്തിക്കുന്നു. ഈ ലൂപ്പ് 1 മുതൽ 5 വരെ എണ്ണുന്നു.',
        'പേരുള്ള ഒരു കോഡ് ഭാഗം, അത് വീണ്ടും വീണ്ടും ഉപയോഗിക്കാം.',
        'ഈ id ഉള്ള HTML എലമെന്റിനെ കണ്ടെത്തുന്നു.',
        '".note" അല്ലെങ്കിൽ "h1" പോലുള്ള CSS സെലക്ടറുമായി ചേരുന്ന ആദ്യ എലമെന്റിനെ കണ്ടെത്തുന്നു.',
        'എലമെന്റിനുള്ളിലെ എഴുത്ത് വായിക്കുകയോ മാറ്റുകയോ ചെയ്യുന്നു.',
        'JavaScript-ൽ നിന്ന് എലമെന്റിന്റെ CSS മാറ്റുന്നു.',
        'ക്ലിക്ക് പോലെ എന്തെങ്കിലും സംഭവിക്കുമ്പോൾ ഒരു ഫംഗ്ഷൻ പ്രവർത്തിപ്പിക്കുന്നു.',
        'ഇൻപുട്ട് ബോക്സിൽ ടൈപ്പ് ചെയ്ത എഴുത്ത്. Number(box.value) അതിനെ സംഖ്യയാക്കുന്നു.',
        'alert() ഒരു പോപ്പ്-അപ്പ് സന്ദേശം കാണിക്കുന്നു; prompt() ഉപയോക്താവിനോട് ഉത്തരം ടൈപ്പ് ചെയ്യാൻ പറയുന്നു.',
        'ഒരു ക്രമരഹിത (random) സംഖ്യ നൽകുന്നു. ഈ ഉദാഹരണം പകിട എറിയുന്നു: 1 മുതൽ 6 വരെ.',
        'മൂല്യങ്ങളുടെ ലിസ്റ്റ്. colours[0] ആദ്യത്തെ ഇനം; colours.length ആകെ എത്രയെണ്ണം എന്ന് പറയുന്നു.'
      ]
    }
  },

  ur: {
    tpl: {
      first: {
        name: 'میرا پہلا پیج',
        tips: ['نام، شوق اور مقاصد بدل کر اپنے لکھیں۔', 'CSS میں h1 کا رنگ بدلیں، جیسے color: green;'],
        t: {
          title: 'میرے بارے میں', h1: 'آداب، میں ریا خان ہوں 👋', photo_alt: 'ریا کی تصویر',
          intro: 'میں لکھنؤ، اتر پردیش میں ساتویں جماعت میں پڑھتی ہوں۔ مجھے کہانیاں، ڈرائنگ اور کمپیوٹر بہت پسند ہیں۔',
          h_hobbies: 'میرے شوق', hobby1: 'کرکٹ کھیلنا 🏏', hobby2: 'ڈرائنگ اور پینٹنگ 🎨', hobby3: 'کامکس پڑھنا 📚',
          h_goals: 'اس سال کے میرے مقاصد', goal1: '12 نئی کتابیں پڑھنا', goal2: 'اپنی خود کی ویب سائٹ بنانا',
          fav: 'میرا پسندیدہ مضمون <strong>سائنس</strong> ہے۔ اب میں <em>HTML</em> سیکھ رہی ہوں!',
          footer: 'ریا نے HTML اور CSS سے بنایا 💻',
          c_html: 'ٹیگ کے بیچ کے الفاظ بدلیں اور پری ویو بدلتا دیکھیں۔',
          c_css: 'CSS رنگ، سائز اور جگہ طے کرتا ہے۔',
          c_js: 'یہ لائن کنسول میں ایک پیغام لکھتی ہے۔',
          log: 'آداب! میرا پیج تیار ہے۔'
        }
      },
      timetable: {
        name: 'میرا ٹائم ٹیبل',
        tips: ['پیریڈ 6 کے لیے ایک نئی قطار جوڑیں۔', 'CSS میں th خانوں کا پس منظر کا رنگ بدلیں۔'],
        t: {
          title: 'میرا ٹائم ٹیبل', h1: 'میری جماعت کا ٹائم ٹیبل', caption: 'جماعت 7 ب', period: 'پیریڈ',
          mon: 'پیر', tue: 'منگل', wed: 'بدھ', thu: 'جمعرات', fri: 'جمعہ', sat: 'ہفتہ',
          maths: 'ریاضی', science: 'سائنس', english: 'انگریزی', lang_sub: 'اردو', sst: 'سماجی علوم',
          computer: 'کمپیوٹر', art: 'آرٹ', games: 'کھیل', lunch: 'کھانے کا وقفہ',
          c_scroll: 'چھوٹی اسکرین پر ٹیبل دائیں بائیں کھسکتا ہے',
          c_html: 'tr = قطار، th = سرخی والا خانہ، td = خانہ۔ colspan خانوں کو جوڑتا ہے۔',
          c_js: 'آج کے دن والا کالم نمایاں کریں (اتوار کو کچھ نمایاں نہیں ہوتا)۔'
        }
      },
      form: {
        name: 'رائے فارم',
        tips: ['select باکس والا ایک نیا سوال جوڑیں، جیسے آپ کا پسندیدہ مضمون۔', '"رائے بھیجیں" دبائیں اور کنسول دیکھیں۔'],
        t: {
          title: 'رائے فارم', h1: 'جماعت کی رائے', intro: 'بتائیے، آج کی کمپیوٹر کلاس آپ کو کیسی لگی۔',
          name: 'آپ کا نام', name_ph: 'جیسے آرو', cls: 'جماعت', rating: 'کلاس کیسی رہی؟',
          r5: 'بہت اچھی', r3: 'ٹھیک ٹھاک', r1: 'مشکل', liked: 'آپ کو کیا پسند آیا؟',
          l1: 'کھیل', l2: 'ویڈیو', l3: 'گروپ پروجیکٹ', msg: 'کوئی مشورہ؟', msg_ph: 'یہاں لکھیں…',
          send: 'رائے بھیجیں', thanks: 'شکریہ', got: 'آپ کی رائے مل گئی۔', log: 'رائے بھیجنے والا',
          c_js: 'فارم بھیجنے پر شکریے کا پیغام دکھائیں۔', c_prevent: 'اسی پیج پر رہیں'
        }
      },
      card: {
        name: 'CSS پروفائل کارڈ',
        tips: ['.card کا border-radius 0 کر کے دیکھیں کیا ہوتا ہے۔', 'font-size سے اوتار بڑا کریں۔'],
        t: {
          title: 'پروفائل کارڈ', name: 'اننیا مرزا', role: 'جماعت 9 · سائنس کلب کی کپتان',
          bio: 'مجھے روبوٹ بنانا اور تارے دیکھنا پسند ہے۔ اسرو میں کام کرنا میرا خواب ہے۔',
          s1: 'پروجیکٹ', s2: 'تمغے', s3: 'روبوٹ', follow: 'فالو کریں', following: 'فالو کر رہے ہیں ✓',
          c_css: 'نیچے کے نمبر اور رنگ بدل کر دیکھیں۔',
          c_js: 'بٹن کو "فالو کریں" اور "فالو کر رہے ہیں" کے بیچ بدلیں۔'
        }
      },
      colorbtn: {
        name: 'رنگ بدلنے والا بٹن',
        tips: ['دونوں فہرستوں میں ایک اور رنگ اور اس کا نام جوڑیں۔', 'if استعمال کر کے 10 کلک کے بعد بٹن کا متن بدلیں۔'],
        t: {
          title: 'جادوئی بٹن', h1: 'جادوئی بٹن', intro: 'بٹن پر کلک کریں۔ JavaScript ہر بار اس کا رنگ بدل دیتی ہے۔',
          btn: 'مجھے کلک کرو!', clicks: 'کلک:', colour: 'رنگ:',
          c1: 'زعفرانی', c2: 'ہرا', c3: 'گہرا نیلا', c4: 'گلابی', c5: 'بینگنی', c6: 'فیروزی',
          c_list: 'رنگوں کی ایک فہرست (array) اور ان کے ناموں کی ایک فہرست',
          c_mod: '% باقی بتاتا ہے، اس لیے رنگ دہراتے رہتے ہیں'
        }
      },
      calc: {
        name: 'آسان کیلکولیٹر',
        tips: ['% (باقی) کے لیے ایک بٹن جوڑیں۔', '0 سے تقسیم کر کے دیکھیں۔ کوڈ کی کون سی لائنیں اسے سنبھالتی ہیں؟'],
        t: {
          title: 'کیلکولیٹر', h1: 'آسان کیلکولیٹر', first: 'پہلا عدد', second: 'دوسرا عدد', answer: 'جواب:',
          empty: 'براہِ کرم دونوں عدد لکھیں', zero: '0 سے تقسیم نہیں ہو سکتا',
          c_js: 'دونوں عدد پڑھیں، حساب کریں اور جواب دکھائیں۔',
          c_number: 'Number() متن کو عدد میں بدلتا ہے'
        }
      },
      quiz: {
        name: 'کوئز پیج',
        tips: ['فہرست میں اپنا ایک سوال جوڑیں۔', 'CSS میں .right اور .wrong کے رنگ بدلیں۔'],
        t: {
          title: 'کوئز', h1: 'جھٹ پٹ کوئز',
          q1: 'بھارت کا دارالحکومت کیا ہے؟', q1a: 'ممبئی', q1b: 'نئی دہلی', q1c: 'کولکاتا',
          q2: 'ہمارے نظامِ شمسی کا سب سے بڑا سیارہ کون سا ہے؟', q2a: 'زمین', q2b: 'مریخ', q2c: 'مشتری',
          q3: 'مسدس کے کتنے ضلع ہوتے ہیں؟',
          q4: 'پودے کھانا بنانے کے لیے ہوا سے کون سی گیس لیتے ہیں؟', q4a: 'آکسیجن', q4b: 'کاربن ڈائی آکسائیڈ', q4c: 'نائٹروجن',
          right: 'صحیح جواب! 🎉', wrong: 'اوہ! صحیح جواب ہے:', score: 'اسکور:', next: 'اگلا سوال', again: 'پھر سے کھیلیں',
          c_js: 'ہر سوال میں اس کا متن، اختیارات اور صحیح اختیار کا نمبر ہے (گنتی 0 سے)۔'
        }
      },
      blank: {
        name: 'خالی پیج',
        tips: ['پہلے ایک ہیڈنگ اور ایک پیراگراف لکھیں، پھر اور ٹیگ جوڑیں۔', 'ٹیگ، اسٹائل اور کوڈ جوڑنے کے لیے نیچے کی چیٹ شیٹ استعمال کریں۔'],
        t: { title: 'میرا ویب پیج', h1: 'میرا ویب پیج', p: 'یہاں لکھنا شروع کریں۔', c_js: 'اپنی JavaScript یہاں لکھیں۔' }
      }
    },
    cheat: {
      html: [
        'ہیڈنگ۔ h1 سب سے بڑی اور سب سے اہم ہوتی ہے، h6 سب سے چھوٹی۔',
        'متن کا ایک پیراگراف۔',
        'br نئی لائن شروع کرتا ہے؛ hr پیج پر ایک افقی لکیر کھینچتا ہے۔ انہیں بند کرنے کی ضرورت نہیں۔',
        'strong الفاظ کو موٹا اور اہم بناتا ہے؛ em انہیں ترچھا بناتا ہے۔',
        'دوسرے پیج کا لنک۔ href اس کا پتہ ہے۔',
        'تصویر دکھاتا ہے۔ جو دیکھ نہیں سکتے، ان کے لیے alt تصویر کو بیان کرتا ہے۔',
        'بلٹ والی فہرست۔ ہر آئٹم li کے اندر جاتا ہے۔',
        'نمبر والی فہرست: 1، 2، 3…',
        'ایک ٹیبل۔ tr ایک قطار ہے، th سرخی والا خانہ اور td عام خانہ۔',
        'ایک ڈبہ جو دوسرے ٹیگ کو ساتھ رکھتا ہے، تاکہ انہیں ایک ساتھ اسٹائل کر سکیں۔',
        'لائن کے اندر کچھ الفاظ کو نشان زد کرتا ہے، جیسے انہیں رنگنے کے لیے۔',
        'ایک بٹن۔ کلک ہونے پر JavaScript کچھ کر سکتی ہے۔',
        'لکھنے کا باکس، اس کے لیبل کے ساتھ۔ type ہو سکتا ہے text، number، date، color…',
        'اختیارات کی ڈراپ ڈاؤن فہرست۔',
        'کئی لائنیں لکھنے کے لیے بڑا باکس۔',
        'پیج کے حصوں کو نام دیتا ہے: اوپر، اصل مواد اور نیچے۔',
        'کمنٹ: لوگوں کے لیے ایک نوٹ۔ براؤزر اسے نہیں دکھاتا۔'
      ],
      css: [
        'متن کا رنگ۔ نام (red)، hex کوڈ (#ff9933) یا rgb() استعمال کریں۔',
        'ایلیمنٹ کے پیچھے کا رنگ۔',
        'حروف کا سائز۔',
        'فونٹ (حروف کا انداز)۔ پہلا نہ ملے تو کام آئے، اس لیے دوسرا بھی لکھیں۔',
        'متن کو بائیں، دائیں یا بیچ میں رکھتا ہے۔',
        'ایلیمنٹ کے باہر کی جگہ، اس کے اور پڑوسیوں کے بیچ۔',
        'ایلیمنٹ کے اندر کی جگہ، اس کی بارڈر اور مواد کے بیچ۔',
        'ایلیمنٹ کے چاروں طرف ایک لکیر: موٹائی، انداز اور رنگ۔',
        'کونوں کو گول کرتا ہے۔ 50% سے مربع دائرہ بن جاتا ہے۔',
        'ایلیمنٹ کا سائز۔ % کا مطلب آس پاس کی جگہ کا ایک حصہ۔',
        'اندر کے ایلیمنٹ کو ساتھ ساتھ رکھتا ہے۔ gap ان کے بیچ جگہ چھوڑتا ہے۔',
        'ہلکا سایہ جوڑتا ہے، جس سے ایلیمنٹ ابھرا ہوا لگتا ہے۔',
        'ایسا اسٹائل جو صرف تب لگتا ہے جب ماؤس ایلیمنٹ کے اوپر ہو۔',
        '.note ہر اس ایلیمنٹ کو چنتا ہے جس میں class="note" ہے؛ #title اس ایلیمنٹ کو چنتا ہے جس کی id="title" ہے۔',
        'فون جیسی چھوٹی اسکرین کے لیے الگ اسٹائل۔'
      ],
      js: [
        'کنسول میں کوئی قدر لکھتا ہے۔ اپنا کوڈ جانچنے کے لیے بہت کام کا۔',
        'قدر رکھنے کے لیے ویری ایبل بناتا ہے۔ const کو بعد میں بدلا نہیں جا سکتا۔',
        'شرط صحیح ہو تبھی کوڈ چلتا ہے؛ غلط ہو تو else چلتا ہے۔',
        'کوڈ کو دہراتا ہے۔ یہ لوپ 1 سے 5 تک گنتا ہے۔',
        'کوڈ کا نام والا حصہ، جسے بار بار استعمال کر سکتے ہیں۔',
        'وہ HTML ایلیمنٹ ڈھونڈتا ہے جس کی یہ id ہے۔',
        '".note" یا "h1" جیسے CSS سلیکٹر سے ملنے والا پہلا ایلیمنٹ ڈھونڈتا ہے۔',
        'ایلیمنٹ کے اندر کا متن پڑھتا یا بدلتا ہے۔',
        'JavaScript سے ایلیمنٹ کی CSS بدلتا ہے۔',
        'کچھ ہونے پر، جیسے کلک، ایک فنکشن چلاتا ہے۔',
        'ان پٹ باکس میں لکھا متن۔ Number(box.value) اسے عدد بناتا ہے۔',
        'alert() ایک پاپ اپ پیغام دکھاتا ہے؛ prompt() صارف سے جواب لکھواتا ہے۔',
        'ایک بے ترتیب (random) عدد دیتا ہے۔ یہ مثال پانسہ پھینکتی ہے: 1 سے 6۔',
        'قدروں کی فہرست۔ colours[0] پہلا آئٹم ہے اور colours.length بتاتا ہے کہ کل کتنے ہیں۔'
      ]
    }
  }
};
