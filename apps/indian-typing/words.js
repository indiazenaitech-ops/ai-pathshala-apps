/* Common words in everyday (WhatsApp-style) Roman spelling -> correct spelling. Used only when
   "Smart spelling" is on. Exact keys (bhaarat, kRShNa ...) always follow the typing scheme.
   verify-allow-mixed-scripts */
window.ITYPE_WORDS = {
  hi: (function () {
    var s = 'bharat:भारत bharath:भारत hindi:हिंदी hindustan:हिंदुस्तान main:मैं mai:मैं mein:में me:में hai:है hain:हैं ho:हो hu:हूँ hoon:हूँ hun:हूँ ' +
      'kya:क्या kyun:क्यों kyon:क्यों kaise:कैसे kaisa:कैसा kaisi:कैसी kahan:कहाँ kahaan:कहाँ yahan:यहाँ yahaan:यहाँ wahan:वहाँ jahan:जहाँ ' +
      'nahi:नहीं nahin:नहीं nhi:नहीं haan:हाँ ap:आप aap:आप tum:तुम tu:तू hum:हम ham:हम mera:मेरा meri:मेरी mere:मेरे tera:तेरा teri:तेरी tere:तेरे ' +
      'apna:अपना apni:अपनी apne:अपने uska:उसका uski:उसकी uske:उसके unka:उनका unki:उनकी hamara:हमारा hamari:हमारी tumhara:तुम्हारा aur:और ya:या ' +
      'ki:की ka:का ke:के ko:को se:से par:पर pe:पे to:तो bhi:भी hi:ही ek:एक do:दो teen:तीन char:चार chaar:चार panch:पाँच paanch:पाँच chhah:छह saat:सात ' +
      'aath:आठ nau:नौ das:दस gyarah:ग्यारह gyaarah:ग्यारह barah:बारह bees:बीस pachas:पचास sau:सौ hazar:हज़ार hazaar:हज़ार lakh:लाख crore:करोड़ karod:करोड़ ' +
      'rupaye:रुपये rupay:रुपये rupaya:रुपया paisa:पैसा paise:पैसे namaskar:नमस्कार namaskaar:नमस्कार dhanyavad:धन्यवाद dhanyawad:धन्यवाद ' +
      'shukriya:शुक्रिया kripya:कृपया kripaya:कृपया ji:जी accha:अच्छा achha:अच्छा acha:अच्छा achhe:अच्छे ache:अच्छे achhi:अच्छी achi:अच्छी ' +
      'theek:ठीक thik:ठीक bahut:बहुत bohot:बहुत bahot:बहुत pyar:प्यार dost:दोस्त kaam:काम raat:रात aaj:आज abhi:अभी phir:फिर fir:फिर ' +
      'log:लोग logon:लोगों desh:देश duniya:दुनिया zindagi:ज़िंदगी jindagi:ज़िंदगी dil:दिल khush:ख़ुश khushi:ख़ुशी pani:पानी paani:पानी ' +
      'khana:खाना khaana:खाना chai:चाय chay:चाय school:स्कूल college:कॉलेज mobile:मोबाइल phone:फ़ोन whatsapp:व्हाट्सऐप beta:बेटा beti:बेटी ' +
      'maa:माँ papa:पापा mummy:मम्मी bhai:भाई behen:बहन bahan:बहन didi:दीदी sir:सर madam:मैडम shubh:शुभ diwali:दिवाली holi:होली ' +
      'ram:राम krishna:कृष्ण shiv:शिव ganesh:गणेश guru:गुरु delhi:दिल्ली dilli:दिल्ली mumbai:मुंबई kolkata:कोलकाता chennai:चेन्नई ' +
      'lucknow:लखनऊ indore:इंदौर bhopal:भोपाल patna:पटना jaipur:जयपुर sarkar:सरकार kisan:किसान shiksha:शिक्षा pariksha:परीक्षा ' +
      'sawal:सवाल jawab:जवाब samay:समय waqt:वक़्त kitna:कितना kitne:कितने kitni:कितनी kab:कब kaun:कौन kuch:कुछ kuchh:कुछ sirf:सिर्फ़ ' +
      'sath:साथ saath:साथ liye:लिए lie:लिए wala:वाला wale:वाले wali:वाली raha:रहा rahi:रही tha:था thi:थी the:थे gaya:गया gayi:गई gaye:गए ' +
      'kiya:किया karo:करो karna:करना karein:करें kare:करे jao:जाओ aao:आओ aaiye:आइए batao:बताओ bolo:बोलो suno:सुनो dekho:देखो padho:पढ़ो ' +
      'likho:लिखो bada:बड़ा badi:बड़ी bade:बड़े chhota:छोटा chota:छोटा naya:नया nayi:नई purana:पुराना janamdin:जन्मदिन badhai:बधाई ' +
      'mubarak:मुबारक bhagwan:भगवान bhagvan:भगवान jai:जय hind:हिंद mata:माता pita:पिता ganga:गंगा raja:राजा rani:रानी sita:सीता ' +
      'radha:राधा shri:श्री shree:श्री sab:सब sabhi:सभी koi:कोई kisi:किसी yeh:यह ye:ये woh:वह wo:वो vo:वो unhe:उन्हें unhone:उन्होंने ' +
      'kyunki:क्योंकि lekin:लेकिन magar:मगर agar:अगर jab:जब tab:तब ab:अब kal:कल parso:परसों subah:सुबह shaam:शाम dopahar:दोपहर ' +
      'aadmi:आदमी aurat:औरत bachcha:बच्चा bachche:बच्चे bacche:बच्चे ladka:लड़का ladki:लड़की padhai:पढ़ाई kitab:किताब kitaab:किताब';
    var o = {}; s.split(' ').forEach(function (p) { var i = p.indexOf(':'); o[p.slice(0, i)] = p.slice(i + 1); }); return o;
  })(),
  bn: (function () {
    var s = 'bangla:বাংলা bangali:বাঙালি ami:আমি tumi:তুমি apni:আপনি amar:আমার tomar:তোমার apnar:আপনার ki:কি kemon:কেমন acho:আছো achho:আছো ' +
      'achen:আছেন bhalo:ভালো valo:ভালো hya:হ্যাঁ na:না dhonnobad:ধন্যবাদ dhanyabad:ধন্যবাদ nomoskar:নমস্কার namaskar:নমস্কার kolkata:কলকাতা ' +
      'bharot:ভারত bharat:ভারত ek:এক dui:দুই tin:তিন char:চার paanch:পাঁচ pach:পাঁচ ma:মা baba:বাবা dada:দাদা didi:দিদি bondhu:বন্ধু ' +
      'bhalobasha:ভালোবাসা bhalobasa:ভালোবাসা ei:এই oi:ওই ar:আর o:ও kintu:কিন্তু keno:কেন kothay:কোথায় ekhon:এখন aaj:আজ kal:কাল ' +
      'jol:জল khabar:খাবার bari:বাড়ি boi:বই school:স্কুল durga:দুর্গা puja:পূজা shubho:শুভ';
    var o = {}; s.split(' ').forEach(function (p) { var i = p.indexOf(':'); o[p.slice(0, i)] = p.slice(i + 1); }); return o;
  })(),
  ur: (function () {
    var s = 'main:میں mein:میں me:میں hain:ہیں nahin:نہیں nahi:نہیں na:نہ yeh:یہ ye:یہ woh:وہ wo:وہ vo:وہ voh:وہ kyun:کیوں kyon:کیوں ' +
      'allah:اللہ khuda:خدا khush:خوش khushi:خوشی shukriya:شکریہ shukriyaa:شکریہ mohabbat:محبت muhabbat:محبت ' +
      'ishq:عشق dil:دل zindagi:زندگی dunya:دنیا duniya:دنیا sahib:صاحب sahab:صاحب salaam:سلام salam:سلام assalam:السلام ' +
      'aleikum:علیکم alaikum:علیکم walaikum:وعلیکم inshallah:ان شاء اللہ mashallah:ماشاءاللہ urdu:اردو pakistan:پاکستان hindustan:ہندوستان ' +
      'hindi:ہندی ek:ایک do:دو teen:تین char:چار paanch:پانچ khat:خط kitab:کتاب waqt:وقت subah:صبح shaam:شام aur:اور';
    var o = {}; s.split(' ').forEach(function (p) { var i = p.indexOf(':'); o[p.slice(0, i)] = p.slice(i + 1); }); return o;
  })()
};
