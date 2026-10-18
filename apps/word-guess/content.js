/* Word Guess: word lists, written for this app (family-friendly, everyday words).
   APP_CONTENT[lang].answers = space-separated answer words for the daily and practice puzzles.
     en: 5-letter words.  hi bn mr gu pa or te kn ml: 3 aksharas.  ta: 4 aksharas (Tamil counts a
     pulli letter like ம் as its own akshara, so 3 would be too short).  ur: 4 letters.
   WG_EN_EXTRA = more English 5-letter words that are accepted as guesses (answers are accepted too).
   app.js checks every word with the same akshara splitter the game uses and skips any word of the wrong length. */
window.APP_CONTENT = {
  en: {
    answers:
      'about above actor adult after again agree ahead alarm album alert alike alive allow alone along amber angel ' +
      'anger angle apple apron arena argue arise arrow aside award aware awake bacon badge baker basic basil basin ' +
      'batch beach beard began begin being below bench berry birch birth black blade blank blaze blend bless block ' +
      'bloom board bonus boost booth brain brake brand brave bread break brick bride brief bring broad broom brown ' +
      'brush build built bunch bunny cabin cable camel candy canoe carry catch cause cedar chain chair chalk charm ' +
      'chart chase cheap check cheek cheer chess chest chick chief child chili chill choir chord claim class clean ' +
      'clear clerk click cliff climb clock close cloth cloud clown coach coast cobra cocoa coral couch count cover ' +
      'crack craft crane crawl crazy cream crisp crowd crown crumb crust curry curve cycle daily dairy daisy dance ' +
      'delay depth diary dough draft drain drama drawn dream dress dried drill drink drive eagle early earth eaten ' +
      'eight elbow elder empty enjoy enter entry equal error essay event every exact exist extra fable faith fancy ' +
      'feast fence ferry fever fiber field fifth fifty final first flame flash fleet float flock flood floor flour ' +
      'flute focus force forty forum found frame fresh front frost fruit funny giant given glass globe glory glove ' +
      'goose grace grade grain grand grant grape graph grass great green greet grill group grown guard guava guess ' +
      'guest guide habit happy heart heavy hello hippo hobby honey horse hotel house human humid hurry ideal igloo ' +
      'image index inner input issue ivory jelly jewel joint jolly judge juice jumbo kayak knife knock koala kurta ' +
      'label lassi laugh layer learn lemon level light lilac limit linen lotus loyal lucky lunar lunch magic major ' +
      'maker mango maple match medal melon mercy metal metro might minor mixer model money month moral motor mouse ' +
      'mouth movie music nerve never night noble noise north novel nurse ocean offer often olive onion opera orbit ' +
      'order organ other otter outer owner paint panda panel paper party pasta patch peace peach pearl pedal penny ' +
      'petal phone photo piano piece pilot pinch pizza place plain plane plant plate plaza point polar porch pound ' +
      'power press price pride prime print prize proof proud pulse punch pupil puppy quail queen quest quick quiet ' +
      'quilt quite quote radio rainy raise rally ranch range rapid raven reach react ready relax reply rhino rider ' +
      'ridge right river roast robin robot rocky round route royal ruler rural salad saree sauce scale scarf scene ' +
      'scent scoop score scout seven shade shake shape share shark sharp sheep sheet shelf shell shine shirt shore ' +
      'short shout sight sitar skate skill sleep slice slide slope small smart smell smile smoke snack snail snake ' +
      'solar solid solve sound south space spade spare spark speak speed spell spend spice spoon sport spray stack ' +
      'staff stage stair stamp stand start state steam steel stick still stone stool store stork storm story stove ' +
      'straw strip study style sugar sunny super swamp sweep sweet swift swing syrup tabla table taste teach teeth ' +
      'thank thick thing think third three throw thumb tiger tikka timer toast today topic torch total touch tough ' +
      'towel tower track trade trail train treat trend trial tribe trick truck truly trunk trust truth tulip twice ' +
      'twist uncle under unity until upper usual valid value video visit vital vivid voice wagon watch water whale ' +
      'wheat wheel white whole width woman world worry wrist write yacht young youth zebra acorn bison llama sloth ' +
      'heron finch trout squid gecko hyena moose bagel donut lemur'
  },
  hi: {
    answers:
      'कमल बादल किताब गाजर मछली चावल पतंग बकरी मकान दुकान सड़क नमक मटर कलम कागज़ बटन अनार पपीता संतरा खजूर ' +
      'बैंगन धनिया पुदीना मसाला हलवा समोसा पकौड़ा जलेबी खिचड़ी पराठा कचौरी मलाई मक्खन पनीर गुलाब कमीज़ दुपट्टा ' +
      'चप्पल कंगन पायल झुमका बंदर हिरन चिड़िया मगर कछुआ मेंढक तितली मकड़ी मच्छर भँवरा बगुला गौरैया कोयल सारस ' +
      'बतख केकड़ा लोमड़ी भेड़िया बारिश सूरज धरती पहाड़ झरना सागर जंगल पत्थर बिजली सवेरा मौसम किनारा लहर कमरा ' +
      'खिड़की आँगन रसोई कटोरी चम्मच गिलास कड़ाही बिस्तर तकिया चादर कंबल साबुन तौलिया दीपक रंगोली खिलौना गुड़िया ' +
      'गुब्बारा पेंसिल रबर लिफ़ाफ़ा ढोलक बाँसुरी तबला सितार पहिया जहाज़ शहर बाज़ार मंदिर मस्जिद दफ़्तर मैदान ' +
      'बगीचा तालाब हथेली अँगूठा उँगली कलाई घुटना गर्दन दिमाग चेहरा मुस्कान बहन किसान दरज़ी कुम्हार लोहार सिपाही ' +
      'पड़ोसी सहेली लड़का लड़की सपना कहानी खुशबू मिठाई त्योहार दिवाली पढ़ाई सवाल जवाब हिसाब नमस्ते मदद भोजन ' +
      'दवाई रुमाल छतरी गुलदान मुकुट कपड़ा झंडा पोशाक बिछौना अचार चटनी रबड़ी मूँगफली नाशपाती शलगम मशरूम ' +
      'टमाटर सड़क चिमटा कढ़ाई पतीला थरमस'
  },
  bn: {
    answers:
      'আকাশ বাতাস পাহাড় সাগর জঙ্গল পাথর সকাল দুপুর বিকেল ঝরনা কুয়াশা শিশির বানর হরিণ ভালুক ছাগল মুরগি ময়ূর ' +
      'পায়রা চড়ুই কচ্ছপ বিড়াল কুকুর কোকিল কাঁকড়া শেয়াল নেকড়ে মহিষ কুমির শালিক ইঁদুর গাজর পেঁয়াজ টমেটো ' +
      'বেগুন রসুন লবণ মাখন পনির সন্দেশ জিলিপি পায়েস খিচুড়ি পরোটা কমলা পেয়ারা ডালিম খেজুর বাদাম কাঁঠাল আঙুর ' +
      'কুমড়ো জানালা দরজা উঠোন চামচ গেলাস কড়াই বিছানা বালিশ চাদর কম্বল চেয়ার টেবিল বালতি সাবান তোয়ালে ' +
      'চিরুনি আয়না প্রদীপ খেলনা পুতুল বেলুন দোলনা কলম পেন্সিল রবার কাগজ তবলা সেতার জাহাজ শহর বাজার দোকান ' +
      'মন্দির অফিস বাগান পুকুর আঙুল কবজি কপাল চেহারা দিদিমা কৃষক কুমোর কামার সৈনিক শিক্ষক ডাক্তার সুগন্ধ ' +
      'উত্তর সাহায্য খাবার ওষুধ রুমাল চশমা নূপুর পতাকা লাটাই মুকুট কাপড় আগুন জিনিস মোরগ গোলাপ পলাশ ' +
      'শিমুল টগর বকুল কদম ঝিনুক শামুক প্রজাপতি চিংড়ি ইলিশ সরষে মশলা হলুদ বাটালি কোদাল লাঙল ধানখেত ' +
      'নদীতীর পাহারা সাঁতার ভ্রমণ দেয়াল বারান্দা সিঁড়ি উনুন হাঁড়ি কলসি ঝুড়ি মাদুর পাখনা'
  },
  mr: {
    answers:
      'कमळ पाऊस आकाश डोंगर समुद्र जंगल दगड सकाळ दुपार हिवाळा उन्हाळा माकड हरीण अस्वल गाढव बकरी कोंबडा पोपट ' +
      'कावळा चिमणी कासव बेडूक मांजर घुबड बगळा कोकिळा बदक खेकडा लांडगा गाजर भाकरी वरण आमटी बटाटा मिरची लसूण ' +
      'पुदिना मसाला साखर पनीर जिलेबी मोदक करंजी चकली पुरण उपमा डाळिंब नारळ पपई खजूर बदाम खिडकी अंगण चमचा ' +
      'कढई पलंग चादर घोंगडी टेबल कुलूप बादली साबण कंगवा आरसा पणती रांगोळी खेळणी बाहुली पेन्सिल कागद पुस्तक ' +
      'दप्तर ढोलकी बासरी तबला सतार जहाज शहर बाजार दुकान मंदिर मैदान बगीचा विहीर तलाव अंगठा गुडघा कपाळ चेहरा ' +
      'बहीण आजोबा मुलगा मुलगी कुंभार लोहार सैनिक शेजारी मैत्रीण सुगंध मिठाई दिवाळी अभ्यास उत्तर हिशोब मदत ' +
      'जेवण औषध रुमाल सदरा चप्पल घड्याळ बांगडी पैंजण गवत पालक फणस बाजरी तांदूळ कणीस शेवगा पतंग गुलाब ' +
      'मोगरा झेंडू सूर्यफूल कोथिंबीर हळद जिरे वेलची लवंग दालचिनी पापड लोणचे चटणी भरीत थालीपीठ ' +
      'कारले भोपळा काकडी मुळा शेंगा तुळस पिंपळ गोड चिंच कैरी सरबत'
  },
  gu: {
    answers:
      'આકાશ વાદળ સૂરજ પર્વત ડુંગર દરિયો સાગર જંગલ પાંદડું પથ્થર પવન વીજળી સવાર બપોર ઝરણું કમળ ગુલાબ વાંદરો ' +
      'હરણ ગધેડો બકરી મરઘી પોપટ કાગડો ચકલી સસલું કાચબો દેડકો મચ્છર માછલી બિલાડી કૂતરો બળદ ઘુવડ બગલો કોયલ ' +
      'બતક શિયાળ મગર ઉંદર ગાજર રોટલી ડુંગળી બટાકા ટામેટું રીંગણ મરચું લસણ ફુદીનો મસાલો માખણ પનીર જલેબી ' +
      'ઢોકળાં ખમણ થેપલાં ખીચડી ભાખરી સંતરું દાડમ પપૈયું ખજૂર બદામ મકાઈ બાજરી ઓરડો આંગણું રસોડું વાટકી ' +
      'ચમચી પલંગ ઓશીકું ચાદર ધાબળો ખુરશી ટેબલ ટુવાલ કાંસકો અરીસો રંગોળી ઢીંગલી હીંચકો પેન્સિલ રબર કાગળ ' +
      'ચોપડી પુસ્તક ઢોલક વાંસળી તબલાં ઘંટડી જહાજ શહેર બજાર દુકાન મંદિર નિશાળ મેદાન બગીચો તળાવ હથેળી અંગૂઠો ' +
      'આંગળી ઘૂંટણ કપાળ ચહેરો બહેન દીકરો દીકરી ખેડૂત દરજી કુંભાર લુહાર સૈનિક પડોશી શિક્ષક સપનું સુગંધ મીઠાઈ ' +
      'દિવાળી સવાલ જવાબ હિસાબ મદદ ભોજન રૂમાલ કપડાં ચંપલ બંગડી ઝાંઝર પતંગ મુગટ ફાફડા હાંડવો ઊંધિયું ' +
      'શ્રીખંડ કચોરી ગાંઠિયા ચટણી અથાણું પાપડ ભજિયાં કેસર એલચી હળદર જીરું તુલસી લીમડો પીપળો ચંદન ' +
      'ગરબા દાંડિયા નવરાત્રિ ઉત્તરાયણ'
  },
  pa: {
    answers:
      'ਬੱਦਲ ਬਾਰਸ਼ ਸੂਰਜ ਪਹਾੜ ਜੰਗਲ ਪੱਥਰ ਬਿਜਲੀ ਸਵੇਰ ਮੌਸਮ ਕਮਲ ਗੁਲਾਬ ਝਰਨਾ ਲਹਿਰ ਕਿਨਾਰਾ ਬਾਂਦਰ ਹਿਰਨ ਬੱਕਰੀ ' +
      'ਮੁਰਗਾ ਤਿਤਲੀ ਮੱਕੜੀ ਮੱਛਰ ਬਲਦ ਬਗਲਾ ਕੋਇਲ ਬੱਤਖ ਕੇਕੜਾ ਲੂੰਬੜੀ ਗਾਜਰ ਸਬਜ਼ੀ ਪਿਆਜ਼ ਬੈਂਗਣ ਮਿਰਚ ਲਸਣ ਧਨੀਆ ' +
      'ਪੁਦੀਨਾ ਮਸਾਲਾ ਮੱਖਣ ਪਨੀਰ ਜਲੇਬੀ ਸਮੋਸਾ ਪਕੌੜਾ ਪਰਾਂਠਾ ਖਿਚੜੀ ਸੰਤਰਾ ਅਨਾਰ ਪਪੀਤਾ ਖਜੂਰ ਬਦਾਮ ਕਣਕ ਕਮਰਾ ' +
      'ਖਿੜਕੀ ਵਿਹੜਾ ਰਸੋਈ ਚਮਚਾ ਗਲਾਸ ਕੜਾਹੀ ਚਾਦਰ ਕੰਬਲ ਕੁਰਸੀ ਬਾਲਟੀ ਸਾਬਣ ਤੌਲੀਆ ਖਿਡੌਣਾ ਗੁਬਾਰਾ ਕਲਮ ਰਬੜ ਕਾਗਜ਼ ' +
      'ਕਿਤਾਬ ਬਸਤਾ ਢੋਲਕ ਬੰਸਰੀ ਤਬਲਾ ਪਹੀਆ ਜਹਾਜ਼ ਕਿਸ਼ਤੀ ਸੜਕ ਸ਼ਹਿਰ ਬਾਜ਼ਾਰ ਦੁਕਾਨ ਮੰਦਰ ਸਕੂਲ ਮੈਦਾਨ ਬਗੀਚਾ ਤਲਾਅ ' +
      'ਹਥੇਲੀ ਅੰਗੂਠਾ ਉਂਗਲ ਦਿਮਾਗ਼ ਚਿਹਰਾ ਕਿਸਾਨ ਦਰਜ਼ੀ ਲੁਹਾਰ ਸਿਪਾਹੀ ਗੁਆਂਢੀ ਸਹੇਲੀ ਸੁਪਨਾ ਕਹਾਣੀ ਖ਼ੁਸ਼ਬੂ ਮਿਠਾਈ ' +
      'ਦੀਵਾਲੀ ਲੋਹੜੀ ਵਿਸਾਖੀ ਪੜ੍ਹਾਈ ਸਵਾਲ ਜਵਾਬ ਹਿਸਾਬ ਮਦਦ ਭੋਜਨ ਨਾਸ਼ਤਾ ਦਵਾਈ ਰੁਮਾਲ ਛਤਰੀ ਕੱਪੜਾ ਕਮੀਜ਼ ਐਨਕ ' +
      'ਝਾਂਜਰ ਪਤੰਗ ਭੰਗੜਾ ਪਰਾਲੀ ਸਰਦੀ ਗਰਮੀ ਹਲਵਾ ਕੜ੍ਹੀ ਪੰਜੀਰੀ ਗੰਡੇਰੀ ਅਚਾਰ ਚਟਣੀ ਤੰਦੂਰ ਚਰਖਾ ਫੁਲਕਾ ਮਧਾਣੀ ' +
      'ਗਾਗਰ ਪਰਾਤ ਦਰਿਆ ਚਾਨਣ ਤਾਰੀਖ਼ ਮਹੀਨਾ ਬੁਢਾਪਾ ਜਵਾਨੀ'
  },
  or: {
    answers:
      'ଆକାଶ ବାଦଲ ପାହାଡ଼ ସାଗର ଜଙ୍ଗଲ ପଥର ପବନ ବିଜୁଳି ସକାଳ ଗୋଲାପ ଝରଣା କୁହୁଡ଼ି ଶିଶିର ଲହରୀ ମାଙ୍କଡ଼ ହରିଣ କୁକୁଡ଼ା ' +
      'ମୟୂର ଠେକୁଆ କଇଁଛ ବିରାଡ଼ି କୁକୁର ବଳଦ କୋଇଲି କଙ୍କଡ଼ା ବିଲୁଆ ମଇଁଷି କୁମ୍ଭୀର ଚଢ଼େଇ ଗାଜର ପିଆଜ ଟମାଟୋ ରସୁଣ ଧନିଆ ' +
      'ପୋଦିନା ମସଲା ଲହୁଣି ପନିର ଜିଲାପି ପଖାଳ ଖେଚୁଡ଼ି କଦଳୀ କମଳା ପିଜୁଳି ଡାଳିମ୍ବ ସପୁରୀ ନଡ଼ିଆ ଖଜୁରୀ ବାଦାମ ପଣସ ' +
      'ଅଙ୍ଗୁର କାକୁଡ଼ି କଖାରୁ ଗହମ କୋଠରୀ ଝରକା କବାଟ ଅଗଣା ରୋଷେଇ ଚାମଚ ଗିଲାସ କଡ଼େଇ ତକିଆ ଚାଦର କମ୍ବଳ ଟେବୁଲ ସାବୁନ ' +
      'ଗାମୁଛା ପାନିଆ ଦର୍ପଣ ଖେଳନା କଣ୍ଢେଇ ବେଲୁନ କଲମ ରବର କାଗଜ ଢୋଲକ ତବଲା ଜାହାଜ ସହର ବଜାର ଦୋକାନ ମନ୍ଦିର ପଡ଼ିଆ ' +
      'ବଗିଚା ପୋଖରୀ ପାପୁଲି ଆଙ୍ଗୁଠି କପାଳ ଭଉଣୀ ଜେଜେମା କୃଷକ ଦରଜି କୁମ୍ଭାର କମାର ସୈନିକ ପଡ଼ୋଶୀ ଶିକ୍ଷକ ଡାକ୍ତର ସପନ ' +
      'କାହାଣୀ ସୁଗନ୍ଧ ମିଠେଇ ଉତ୍ତର ହିସାବ ସାହାଯ୍ୟ ଔଷଧ ରୁମାଲ ଚଷମା ପାଉଁଜି ପତାକା ମୁକୁଟ ଜିନିଷ ରସଗୋଲା ଛେନାପୋଡ଼ ' +
      'ଆଳୁଦମ ଦହିବରା ଚକୁଳି ଖିରି ମାଣ୍ଡିଆ ମହୁମାଛି ଶାମୁକା ତୁଳସୀ ଚନ୍ଦନ ବାଉଁଶ'
  },
  ta: {
    answers:
      'சூரியன் மின்னல் குரங்கு சிங்கம் சிலந்தி எறும்பு பருப்பு தக்காளி மிளகாய் வெல்லம் வெண்ணெய் பொங்கல் உப்புமா பாயசம் ' +
      'ஆரஞ்சு தேங்காய் பப்பாளி முந்திரி திராட்சை வெள்ளரி சாம்பார் ஜன்னல் முற்றம் கிண்ணம் கரண்டி டம்ளர் கட்டில் தலையணை ' +
      'நாற்காலி கண்ணாடி விளக்கு ஊஞ்சல் பென்சில் காகிதம் கடிதம் பேருந்து கப்பல் நகரம் கிராமம் மைதானம் தோட்டம் கழுத்து ' +
      'இதயம் அண்ணன் உழவர் குயவர் நண்பன் குழந்தை இனிப்பு கணக்கு மருந்து செருப்பு வளையல் பட்டம் கிரீடம் நடனம் ஓவியம் ' +
      'சமையல் திருவிழா கரும்பு முறுக்கு பரோட்டா குழம்பு பொரியல் அவியல் முருங்கை அன்னாசி சுண்டல் வானவில் சூறாவளி ' +
      'தென்றல் மல்லிகை ரோஜாப்பூ மூங்கில் புல்வெளி கங்காரு நீர்யானை பருந்து மண்புழு சுறாமீன் டால்பின் அன்னம் அலமாரி ' +
      'குளியல் தண்ணீர் அடுப்பு பொத்தான் வகுப்பு மாணவன் விடுமுறை நூலகம் மாமியார் விவசாயி மீனவர் காவலர் மன்னன் பண்டிகை ' +
      'தீபாவளி சிரிப்பு வாழ்த்து தங்கம் இரும்பு மஞ்சள் சிவப்பு கருப்பு வட்டம் சதுரம் இரண்டு ஒன்பது ஆயிரம் திங்கள் ' +
      'செவ்வாய் வியாழன் விமானம் உலகம் கோபுரம் புத்தகம் மிட்டாய் பலகாரம் ' +
      'கடுகு பனைமரம் வேப்பிலை தும்பிக்கை கோலமாவு சக்கரம் கொடிமரம் ஆட்டம் கச்சேரி கோடைக்காலம் ' +
      'மழைக்காலம் குளிர்காலம் காளான் பூசணிக்காய் வெண்டைக்காய் உருளைக்கிழங்கு'
  },
  te: {
    answers:
      'ఆకాశం సూర్యుడు చంద్రుడు నక్షత్రం సముద్రం అడవి ఇసుక మెరుపు ఉదయం సాయంత్రం తామర గులాబీ చెరువు వెన్నెల గాడిద ' +
      'నెమలి చిలుక పావురం పిచ్చుక ఏనుగు కుందేలు ఉడుత తాబేలు సాలీడు కోకిల తోడేలు మొసలి ఎలుక గబ్బిలం క్యారెట్ ' +
      'చపాతీ టమాటా వంకాయ వెల్లుల్లి పుదీనా మసాలా చక్కెర పెరుగు జిలేబీ పొంగలి పాయసం మామిడి అరటి నారింజ దానిమ్మ ' +
      'కొబ్బరి బొప్పాయి ఖర్జూరం పనస గుమ్మడి గోధుమ సాంబారు కిటికీ తలుపు వాకిలి వంటిల్లు బాణలి దుప్పటి చీపురు బకెట్ ' +
      'తువ్వాలు దువ్వెన బెలూన్ ఉయ్యాల పెన్సిల్ రబ్బరు కాగితం పుస్తకం ఉత్తరం వేణువు సైకిల్ పడవ నగరం అంగడి దుకాణం ' +
      'మైదానం వంతెన మోకాలు మెదడు నుదురు తమ్ముడు అమ్మమ్మ తాతయ్య మామయ్య అత్తయ్య కొడుకు కూతురు కుమ్మరి కమ్మరి ' +
      'డాక్టరు మిఠాయి పండుగ సంక్రాంతి జాతర జవాబు సహాయం భోజనం గొడుగు చెప్పులు గాజులు గజ్జెలు కిరీటం బట్టలు సంతోషం ' +
      'విత్తనం శరీరం సినిమా పులుసు అప్పడం ఆవకాయ గోంగూర బెల్లము పెసలు కందులు మినుములు జొన్నలు రాగులు వేరుశనగ ' +
      'తులసి వేపచెట్టు మల్లెపూలు బంతిపూలు కాకరకాయ బీరకాయ సొరకాయ పొట్లకాయ దొండకాయ'
  },
  kn: {
    answers:
      'ಆಕಾಶ ನಕ್ಷತ್ರ ಸಮುದ್ರ ಮರಳು ಬೆಳಿಗ್ಗೆ ಮಧ್ಯಾಹ್ನ ತಾವರೆ ಗುಲಾಬಿ ಕಡಲು ಕರಡಿ ಕುದುರೆ ನವಿಲು ಗುಬ್ಬಚ್ಚಿ ಅಳಿಲು ಕೊಕ್ಕರೆ ' +
      'ಕೋಗಿಲೆ ಮೊಸಳೆ ಇರುವೆ ಬಾವಲಿ ಗಿಡುಗ ಗಜ್ಜರಿ ಚಪಾತಿ ಈರುಳ್ಳಿ ಟೊಮೆಟೊ ಬದನೆ ಮೆಣಸು ಬೆಳ್ಳುಳ್ಳಿ ಪುದೀನ ಮಸಾಲೆ ಸಕ್ಕರೆ ' +
      'ಮೊಸರು ಜಿಲೇಬಿ ಉಪ್ಪಿಟ್ಟು ಪಾಯಸ ಕಿತ್ತಳೆ ದಾಳಿಂಬೆ ಪರಂಗಿ ಖರ್ಜೂರ ಗೋಡಂಬಿ ಹಲಸು ಕುಂಬಳ ಸಾಂಬಾರು ಹೋಳಿಗೆ ಕಿಟಕಿ ' +
      'ಬಾಗಿಲು ಅಂಗಳ ಬಟ್ಟಲು ಚಮಚ ಬಾಣಲೆ ಕಾವಲಿ ಹೊದಿಕೆ ಪೊರಕೆ ಬಕೆಟ್ ಸಾಬೂನು ಟವೆಲ್ ಕನ್ನಡಿ ರಂಗೋಲಿ ಆಟಿಕೆ ಬಲೂನು ಜೋಕಾಲಿ ' +
      'ಲೇಖನಿ ಪೆನ್ಸಿಲ್ ರಬ್ಬರ್ ಕಾಗದ ಪುಸ್ತಕ ಕೊಳಲು ಸೈಕಲ್ ಹಡಗು ನಗರ ಅಂಗಡಿ ಆಸ್ಪತ್ರೆ ಮೈದಾನ ಸೇತುವೆ ಬೆರಳು ಕುತ್ತಿಗೆ ' +
      'ಮೆದುಳು ಹೃದಯ ಮಗಳು ಕುಂಬಾರ ಕಮ್ಮಾರ ಸೈನಿಕ ಗೆಳೆಯ ಗೆಳತಿ ಶಿಕ್ಷಕ ಕನಸು ಸಂಕ್ರಾಂತಿ ಉತ್ತರ ಸಹಾಯ ಔಷಧಿ ಚಪ್ಪಲಿ ' +
      'ಬಾವುಟ ಕಿರೀಟ ಸಂತೋಷ ಕೆಲಸ ಉಗುರು ಕೂದಲು ಸಿನಿಮಾ ಗಣಿತ ಅಕ್ಷರ ಮಲ್ಲಿಗೆ ಸಂಪಿಗೆ ತುಳಸಿ ಬಿದಿರು ಹುಣಸೆ ' +
      'ನೆಲ್ಲಿಕಾಯಿ ಕಡಲೆ ಅವರೆ ತೊಗರಿ ಹೆಸರು ಚಟ್ನಿ ಮಸಾಲೆದೋಸೆ ಕೇಸರಿ ಜಿರಳೆ ಚಿರತೆ ' +
      'ಜಿರಾಫೆ ಹದ್ದು ಗರುಡ ಮಿಂಚುಹುಳ ಸೀಮೆಸುಣ್ಣ ಕರಿಹಲಗೆ ತರಕಾರಿ ಬಾಳೆಹಣ್ಣು'
  },
  ml: {
    answers:
      'ആകാശം സൂര്യൻ ചന്ദ്രൻ നക്ഷത്രം കടൽ മണൽ മിന്നൽ രാവിലെ താമര റോസാപ്പൂ കിണർ വയൽ നിലാവ് തടാകം കുരങ്ങ് കരടി ' +
      'ഒട്ടകം കഴുത കുതിര മയിൽ കുരുവി കടുവ മുയൽ അണ്ണാൻ തവള പൂമ്പാറ്റ ചിലന്തി കൊതുക് കുയിൽ താറാവ് ചെന്നായ എരുമ ' +
      'മുതല ഉറുമ്പ് തേനീച്ച വവ്വാൽ പരുന്ത് കാരറ്റ് ചപ്പാത്തി പരിപ്പ് തക്കാളി മുളക് പുതിന മസാല ജിലേബി ഇഡ്ഡലി ' +
      'പായസം ഓറഞ്ച് പേരയ്ക്ക മാതളം പപ്പായ മുന്തിരി വെള്ളരി മത്തങ്ങ ഗോതമ്പ് സാമ്പാർ ജനൽ വാതിൽ കട്ടിൽ പുതപ്പ് കസേര ' +
      'താക്കോൽ ബക്കറ്റ് തോർത്ത് കണ്ണാടി വിളക്ക് പൂക്കളം ബലൂൺ ഊഞ്ഞാൽ റബ്ബർ പുസ്തകം സൈക്കിൾ കപ്പൽ നഗരം അമ്പലം ' +
      'മൈതാനം വിരൽ കൈത്തണ്ട കഴുത്ത് ഹൃദയം അച്ഛൻ ചേട്ടൻ അമ്മൂമ്മ മകൻ മകൾ കൊല്ലൻ സുഹൃത്ത് രാജാവ് ഡോക്ടർ സുഗന്ധം ' +
      'മധുരം ഉത്സവം ഉത്തരം കണക്ക് സഹായം ഭക്ഷണം മരുന്ന് ഷർട്ട് ചെരുപ്പ് കിരീടം സന്തോഷം ശരീരം സിനിമ ഗണിതം അക്ഷരം ' +
      'പവിഴം പുലരി സന്ധ്യ തെങ്ങ് കമുക് വാഴപ്പഴം പപ്പടം അവിയൽ തോരൻ പുളിശ്ശേരി ഉപ്പേരി ചമ്മന്തി ഇടിയപ്പം ' +
      'കൊഴുക്കട്ട ഉണ്ണിയപ്പം അരയന്നം വള്ളംകളി കഥകളി'
  },
  ur: {
    answers:
      'کتاب بادل بارش سورج چاند تارا پہاڑ دریا ساحل جنگل درخت پھول پتھر بجلی موسم کنول گلاب زمین بندر اونٹ ' +
      'گدھا بکری بھیڑ مرغی مرغا طوطا چڑیا چیتا تتلی مکڑی مچھر مکھی گائے بگلا کوئل چوہا سانپ ہدہد عقاب گاجر ' +
      'چاول روٹی سبزی پیاز لہسن ادرک چینی دودھ مکھن پنیر حلوہ کھیر کیلا انار کاجو مکئی گندم انڈا چائے قہوہ ' +
      'شربت کباب قیمہ سالن اچار مولی پالک میوہ مکان کمرہ آنگن برتن چمچہ گلاس پلنگ تکیہ چادر کمبل کرسی تالا ' +
      'چابی صابن شیشہ چراغ گڑیا پنسل کاغذ بستہ کاپی گانا ڈھول طبلہ ستار پہیہ گاڑی جہاز کشتی گاؤں دکان مسجد ' +
      'مندر دفتر گردن دماغ چہرہ آنکھ دانت ہاتھ پاؤں بازو والد دادی نانی دادا نانا چاچا بیٹا بیٹی کسان درزی ' +
      'دوست راجا رانی لڑکا لڑکی سپنا خواب میلہ سوال جواب حساب کپڑا قمیض جوتا ٹوپی چشمہ گھڑی چوڑی پتنگ کھیل ' +
      'محبت خوشی ہنسی ناخن زبان موتی سونا لوہا دنیا ہفتہ آواز امید پانی دھوپ سایہ منزل نقشہ کرتا ساڑی بستر ' +
      'لحاف پلیٹ مٹکا گھڑا'
  }
};

/* More English words accepted as guesses (not used as answers). */
window.WG_EN_EXTRA =
  'aback abbey abbot abide abode abort acids acres acted adapt added adopt adore adorn advice aegis afoot afraid ' +
  'agent aging aided aimed aired aisle alien align alley allot alloy aloft aloud alpha altar alter amaze amble ' +
  'amend amino ample amuse anime ankle annex antic anvil apart aphid apron aptly arbor ardor areas arena argon ' +
  'aroma array arson ascot ashen ashes asked aspen assay atlas atoll attic audio audit aunty avail avert avian ' +
  'avoid await awash axial axiom axles azure  backs badly baggy bails baits baked bakes balls balmy bamboo ' +
  'banal bands bangs banks barge barks barns baron bases basis baste bathe baths baton beads beaks beams beans ' +
  'bears beast beats beech beefy beeps beers beets beige belly belts bends beret bests bible bikes bills binds ' +
  'bingo birds bites bitty blame bland blare bleak bleat bleed blimp blink bliss blitz bloat blobs blond blood ' +
  'blots blown blows bluer blues bluff blunt blurb blurt blush boats bobby bogus boils bolts bombs bonds boned ' +
  'bones bongo books booms boots  bored bores borne  bossy botch bough bound bouts bowed bowel bowls ' +
  'boxed boxer boxes brace braid brash brass bravo brawl brawn bread bream breed breeze briar bribe brine brink ' +
  'briny brisk broil broke brook broth brows bruise brunt brute buddy budge buggy bugle bulbs bulge bulky bulls ' +
  'bully bumps bumpy buns burly burns burnt burst buses bushy busts butte buyer buzzy bylaw cabby cache cacti ' +
  'caddy cadet cafes caged cages cakes calls calms camps canal canes canny canon caper capes carat cards cared ' +
  'cares cargo carol carts carve cased cases casks caste cater catty caves cease cells cents chafe chaff champ ' +
  'chant chaos chaps cheat cheese chefs chewy chick chide chime chimp china chins chips chirp chive choke chomp ' +
  'chops chore chose chuck chunk churn cider cigar cinch circa cited cites civic civil clack clamp clams clang ' +
  'clank claps clash clasp claws clays cleat cleft clerk clips cloak clone clout clove clubs cluck clued clues ' +
  'clump clung coals coats cobble codes coils coins colds colon color colts combs comet comic comma condo cones ' +
  'cooks cools copes copra copse cords cores corgi corny corps costs cotta cough could coupe court coven covet ' +
  'cowed cower crabs cramp crank crate crave craze creak creek creep crepe crept cress crest crews cribs cried ' +
  'crier cries crimp croak crook croon crops cross croup crows crude cruel crush cubby cubes cuffs cumin curbs ' +
  'curds cured cures curls curly curse cusps cuter cyber cynic  daddy dated dates datum daunt dazed deals ' +
  'dealt dearer death debit debts debug debut decal decay decks decor decoy decry deeds deems deeps deity delta ' +
  'delve  denim dense dents deter detox deuce  dials diced dicey digit dimly diner dingy dirty disco ' +
  'discs ditch ditto ditty divan diver dizzy docks dodge doers doing dolls domes donor doors dopey dosed doses ' +
  'dotty doubt dowdy dowel downy dozen drags drake drank drape drawl draws dread dregs dries drift drips drone ' +
  'drool droop drops drove drown drums  dryer dryly ducks ducts dudes duels duets dully dummy dumps dunes ' +
  'dusky dusty  duvet dwarf dwell dwelt dying eager eagle eared earls earns eased easel eases eaten eater ' +
  'eaves ebony edged edges edict edify eerie egret eight eject eking elate elect elegy elfin elite elope elude ' +
  'elves email embed ember emcee emery emits emote enact ended endow enemy ensue envoy epoch epoxy equip erase ' +
  'erect erode erupt essay ether ethic ethos evade evens event evict evoke exalt exams excel exert exile exits ' +
  'expat expel facet faced faces facts faded fades fails faint fairs fairy fakes falls false famed fangs farce ' +
  'fared fares farms fatal fated fatty fault fauna favor fawns fears feats feeds feels feign feint fella felon ' +
  'femur fends feral ferns fetch fewer fiery fifes fight filed files fills filly films filth finds fined finer ' +
  'fines fired fires firms fishy fists fixed fixer fixes fizzy fjord flair flake flaky flank flaps flare flask ' +
  'flats flaws fleas fleck flick flier flies fling flint flips flirt flits flora floss flown flows fluff fluid ' +
  'fluke flung flunk flush foamy focal foggy foils folds folks folly fonts foods fools foray forge forgo forks ' +
  'forms forte forth forts fouls foxes foyer frail franc frank fraud freak freed frees fried fries frill frisk ' +
  'fritz frogs frond froth frown froze fudge fuels fully fumes funds fungi funky furor furry fused fuses fussy ' +
  'fuzzy gains gaits gales gamer games gamma gaped gapes garbs gases gasps gates gaudy gauge gaunt gauze gavel ' +
  'gawky gazed gazes gears geese genes genie genre gents germs ghost  gifts gills girls girth gives giver ' +
  'glade glare gleam glean glide glint gloat gloom gloss glows glued glues gnash gnome goals goats godly going ' +
  'golds golfs goods goody gooey goofy gorge gorse gouge gourd gowns grabs grams grasp grate grave gravy graze ' +
  'greed grief grime grimy grind grins gripe grips grits groan groin groom grope grout grove growl grows grubs ' +
  'gruel gruff grunt guilt guise gulch gulls gully gumbo gummy gusto gusty gutsy habit hails hairs hairy halls ' +
  'halts halve hands handy hangs happen hardy  harms harps harsh haste hasty hatch hated hates hauls haunt ' +
  'haven havoc hawks hazel heads heady heals heaps heard hears heats heave hedge heeds heels hefty heirs heist ' +
  'helix helps hence herbs herds  hides highs hiked hiker hikes hills hilly hinge hints hired hires hitch ' +
  'hived hoard hoist holds holes holly homes honed hones honks hoods hoofs hooks hoops hoped hopes horde horns ' +
  'hosts hound hours hover howls hubby huffy hulks humor humps humus hunch hunks hunts hurls hurts husky hutch ' +
  'hymns icing icons idiom idled idler idles idols igloo  imply inbox incur inept inert infer ingot inlay ' +
  'inlet ionic irate irked irons irony islet itchy items ivies jacks jaded jails jambs  jaunt jazzy jeans ' +
  'jeeps jerks jests jetty jewel jiffy jingle joins joker jokes jolts joust joyed judo jugs juicy jumps jumpy ' +
  'junky juror jutes karma kebab keeps kelps khaki kicks kills kinds kings kinks kiosk kites kitty knack knave ' +
  'knead kneel knees knelt knobs knots known knows labor laced laces lacks laden ladle lakes lambs lamps lance ' +
  'lands lanes lapel lapse large larva laser lasso latch later latex lathe latte lawns leads leafy leaks leaky ' +
  'leans leant leaps leapt learnt lease leash least leave ledge leech leeks lefts legal leggy lemma lends lever ' +
  'liars libel licks liege lifts liked liken likes limbs limes limps lined liner lines lingo links lions lisps ' +
  'lists liter lived liven liver lives loads loafs loamy loans loath lobby lobes local locks lodge lofty logic ' +
  'login loins looks looms loops loose loots lords lorry loser loses lotto louse lousy loved lover loves lower ' +
  'lowly lucid lumps lumpy lunge lurch lured lures lurks  lying lyric macaw macho madam mafia magma maids ' +
  'mails maize males mamma mammal manes mange mania manic manly manor mares marks marry marsh masks mason masts ' +
  'matey mates maths mauve maxim maybe mayor mazes meals mealy means meant meats meaty  medic meets melee ' +
  'melts memes memos mends menus meows merge merit merry messy meter meths mewed midst miles milky mills mimic ' +
  'minds mined miner mines minty minus mired mirth miser missy misty miter mitts moans moats mocha mocks modem ' +
  'moist molar molds moldy moles molts momma mommy monks moods moody moons moors moped mopes mossy motel moths ' +
  'motif motto mould mound mount mourn mousy moved mover moves mower mucky muddy mulch mules mumps munch mural ' +
  'murky mused muses mushy musky mussel musty muted mutes myths nachos nails naive named names nanny nappy nasal ' +
  'nasty natal naval navel needs needy neigh nests newer newly nexus nicer niche nicks niece nifty ninja ninny ' +
  'ninth nippy nitro nobly nodal nodes nooks noose norms nosed noses notch noted notes nouns nudge nuked nukes ' +
  'nutty nylon  oaken oasis oaths obese obeys occur octet odder oddly odors offal oiled oinks okays olden ' +
  'older omega omens omits onset oozed opens opted optic  orals orcas organ otter ought ounce ousts outdo ' +
  'outgo ovals ovary ovens overt owing owned oxide ozone paced paces packs pacts paddy padre pages pails pains ' +
  'pairs paled paler pales palms palsy pandas panes pangs panic pansy pants papal papas parch pared parka parks ' +
  'parse parts pasty pause paved paves pawns peaks pearl pears pecan pecks pedal peeks peels peeps peers penal ' +
  'pence pends perch peril perks perky pesky pesto pests petty phase phony picks picky piers  piety piggy ' +
  'piled piles pills pinky pinto pints pious piped piper pipes pique pitch pithy pivot pixel pixie pizza placard ' +
  'plaid plank plans plays plead pleas pleat plied plies plods plots plows ploys pluck plugs plumb plume plump ' +
  'plunk plush poach poems poets pokes polka polls polyp ponds pools poppy  ports posed poser poses posse ' +
  'posts potty pouch pours pouts prank prawn prays preen prick pried pries prism privy probe prods prone prong ' +
  'props prose prove prowl prude prune  pudgy puffs puffy pulls pulpy pumps punts puree purer purge purse ' +
  'pushy putty pygmy quack quake qualm quart  query queue quill quips quirk quota racer races racks radar ' +
  'radii raged rages raids rails rains raked rakes ramps rangy ranks rants rarer rated rates ratio razor reads ' +
  'realm reaps rears rebel recap recur reeds reefs reeks reels refer regal reign reins relay relic remit renew ' +
  'rents repay repel rerun reset resin rests retch retro retry reuse revel revue rhyme ribbon riced rides rifle ' +
  'rifts rigid rigor rinds rings rinse riots ripen riper risen rises risks rites rival rivet roads roams roars ' +
  'robes rocks rodeo rogue roles rolls  romps roofs rooks rooms roomy roost roots roped ropes roses rotor ' +
  'rouge rough rowdy rowed rower royal rubbed ruddy rude rugby ruins ruled rules rumba rumor runny rungs rupee ' +
  'rusty sabre sacks sadly safer sails saint sakes salon salsa salty salve samba sands sandy saner sappy sassy ' +
  'satin  sauna saved saver saves savor savvy sawed scald scalp scaly scamp scams scant scare scars scary ' +
  'scoff scold scone scope scorn scour scowl scram scrap scree screw scrub scuba seals seams seats sects sedan ' +
  'seeds seedy seeks seems seeps seize sells sends sense sepia serum serve setup sever sewed sewer shack shady ' +
  'shaft shaky shall shame shank shave shawl shear sheds sheen sheer sheik shied shies shift shins shiny ships ' +
  'shire shirk shock shone shook shoot shops shorn shots shove shown shows showy shred shrew shrub shrug shuck ' +
  'shunt shush shyly sided sides siege sieve sighs sigma signs silks silly silts since sinew singe sings sinks ' +
  'sinus sired siren sites sixes sixth sixty sized sizes skein skews skids skied skier skies skiff skimp skims ' +
  'skins skips skirt skits skulk skull skunk slabs slack slain slang slant slaps slash slate slats slave sleek ' +
  'sleet slept slick slime slimy sling slink slips slits slobs slogs slosh sloth slots slows slump slung slurp ' +
  'slush slyly smack smash smear smelt smirk smith smock smoky snags snaps snare snarl snide sniff snipe snoop ' +
  'snore snort snout snowy snuck snuff soapy sober socks sofas softy soggy soils sonar songs sonic sooth sooty ' +
  'sorry sorts souls soups spank spans spasm spate spawn spear speck specs spent spied spies spike spiky spill ' +
  'spine spins spire spite splat split spoil spoke spoof spook spool spore spots spout sprig spurn spurt squat ' +
  'squib stabs stain stake stale stalk stall stank stars stash stays steak steal steed steep steer stems steps ' +
  'stern stews sticky stiff stilt sting stink stint stoic stoke stole stomp stony stood stoop stops stout strap ' +
  'stray strew struck strum strut stuck studs stuff stump stung stunk stunt suave sucks sugary suite sulky sumac ' +
  'sunup surge surly sushi swabs swags swami swans swaps swarm swath swear sweat swell swept swims swine swipe ' +
  'swirl swish swoon swoop sworn swung synod tabby tacit tacky taffy tails taint taken taker takes tales talks ' +
  'tally talon tamed tamer tango tangy tanks taper tapes tapir tardy tarot tarts tasks tasty tatty taunt tawny ' +
  'taxed taxes taxis teams tears teary tease teddy teens teeny tells tempo temps tends tenet tenor tense tenth ' +
  'tents tepid terms terra tests testy texts theft their theme there these theta thief thigh thine thins third ' +
  'thong thorn those threw thrum thugs thump thyme tiara tibia tidal tided tides tiers tight tilde tiled tiles ' +
  'tills tilts timed times timid tinge tints  tired tires titan title toads toddy toffee token tolls tombs ' +
  'tonal toned tones tongs tonic tools tooth topaz toque torso tossed totem tours tousle towed towns toxic toyed ' +
  'trace tract trams traps trash trawl trays tread trees treks tress triad tried tries trims trios tripe trips ' +
  'trite troll troop trope trots trove truce trump tubas tubby tubes tucks tufts tummy tunas tuned tunes tunic ' +
  'turbo turns tusks tutor twang tweak tweed tweet twigs twine twins twirl tying typed types udder ulcer ultra ' +
  'umbra unarm unbox uncut undid undue unfed unfit unify union unite units unlit unmet untie unwed unzip upend ' +
  'upset urban urged urges  usage users usher using utter vague vales valet valor valve vamps vanes vapor ' +
  'vases vault vegan veils veins venom vents venue verbs verge verse vests vexed vials vibes vicar vices vigil ' +
  'vigor villa vines vinyl viola viper viral virus visas visor vista vocal  vogue voids volts  voted ' +
  'voter votes vouch vowed vowel wacky waded wades wafer waged wager wages wails waist waits waive waked waken ' +
  'wakes walks walls waltz wands wanes wants wards wares warms warns warps warts washy wasps waste watts waved ' +
  'waver waves waxed waxen waxes weary weave wedge weeds weedy weeks weeps weigh weird wells   wends ' +
  'whack wharf wheal whelp where which whiff while whims whine whiny whips whirl whisk whist whits wicks widen ' +
  'wider widow wield wigs wilds wills wimpy wince winch winds windy wines wings winks wiped wiper wipes wired ' +
  'wires wiser wishy wispy witch witty wives woken wolves women woods woody wooed wool woozy words wordy works ' +
  'worms wormy worse worst worth would wound woven wowed wrack wraps wrath wreak wreck wrens wring writs wrong ' +
  'wrote wrung yards yarns yawns yearn years yeast yells yelps yield yodel yogas yogis yoked yokes yolks yours ' +
  'yummy zappy zeals zesty zilch zincs zings zippy zonal zoned zones zooms ' +
  'apple tiger plant brown fruit bread hello there their which about would these other words could write first ' +
  'water after where right think three years place sound great again still every small found those never under ' +
  'might while house world below asked going large until along shall being often earth began since study night ' +
  'light above paper parts young story point times heard whole white given means music miles thing today later ' +
  'using money lines order group among learn known space table early trees short hands state black shown stood ' +
  'front voice kinds makes comes close power lived vowel taken built heart ready quite class bring round horse ' +
  'shows piece green stand birds start river tried least field whose girls leave added color third hours moved ' +
  'plane clear watch fight goods notes cried happy years loved spoke stars train dried angry chair sleep teach ' +
  'cards cells steps shoes boats rocks rooms games balls bells bikes boxes cakes caves coins cooks dogs farms ' +
  'fires fish flags foods gifts hills homes jokes kites lakes lamps leaves maps meals nests pens pigs pots rains ' +
  'roads roofs seeds ships shops songs sticks tents toys trucks wings walls weeks wheels tools teams schools ' +
  'guava mango lassi kurta saree sitar tabla tikka curry chili sabzi dosas idlis naans rotis bhaji pulao ' +
  'paani ghats   yamuna kerala  goa';
