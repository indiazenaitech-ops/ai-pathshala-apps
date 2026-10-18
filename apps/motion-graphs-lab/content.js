/* Motion Graphs Lab: quiz texts in 12 languages (same shape everywhere).
   stories[i] goes with MG_DATA.stories[i] (which graph matches the story), reads[i] with MG_DATA.reads[i]
   (read a number off the graph; {d}, {v}, {t}... are filled from MG_DATA.reads[i].vars). */
window.APP_CONTENT = {
  en: {
    stories: [
      { q: 'A car is waiting at a red light.', why: 'The car does not move, so its distance from the start stays the same: the d–t graph is a flat (horizontal) line.' },
      { q: 'A cyclist rides along a straight road at a steady 5 m/s.', why: 'A steady velocity gives a flat v–t line above the axis: not zero, not rising, not falling.' },
      { q: 'A train leaves the station and speeds up steadily.', why: 'Speeding up steadily from rest is uniform acceleration: the v–t graph is a straight line rising from 0.' },
      { q: 'A bus slows down steadily and stops at the bus stop.', why: 'Slowing down steadily is a straight v–t line going down to 0.' },
      { q: 'Ravi walks to the shop, waits there for a while, then walks back home.', why: 'On the d–t graph: a line going up (walking to the shop), a flat part (waiting), then a line coming back down to 0 (walking home).' },
      { q: 'A ball is thrown straight up and caught again at the same height.', why: 'Up is positive. The velocity falls steadily, is 0 at the top, then becomes more and more negative: one straight v–t line from + through 0 to −.' },
      { q: 'A scooter moves at a constant speed along a straight road.', why: 'Constant speed means equal distances in equal times: the d–t graph is a straight sloping line.' },
      { q: 'A stone is dropped from a roof and falls faster and faster.', why: 'The distance covered each second keeps growing, so the d–t graph curves upward and gets steeper.' },
      { q: 'A bus leaves one stop, speeds up, runs at a steady speed, then slows down and stops at the next stop.', why: 'Speed up (line rising), steady (flat), slow down (line falling to 0): a trapezium-shaped v–t graph.' },
      { q: 'A metro train runs at a steady speed and then brakes to a halt at the platform.', why: 'Flat first (steady speed), then a straight line falling to 0 (braking).' },
      { q: 'A car moving at 10 m/s speeds up to 20 m/s and then keeps that speed.', why: 'Flat at a low value, a rising line while speeding up, then flat again at a higher value.' },
      { q: 'A car on a highway speeds up steadily (uniform acceleration). Which a–t graph is right?', why: 'Uniform acceleration means a has one fixed positive value, so the a–t graph is a flat line above the axis.' }
    ],
    reads: [
      { q: 'The d–t graph is a straight line: the distance grows from 0 to {d} m in {t} s. What is the speed?', why: 'Speed = slope of the d–t graph = {d} ÷ {t} = 5 m/s.' },
      { q: 'The v–t graph is flat at {v} m/s for {t} s. What distance is covered?', why: 'Distance = area of the rectangle = {v} × {t} = 120 m.' },
      { q: 'The velocity rises steadily from 0 to {v} m/s in {t} s. What is the acceleration?', why: 'Acceleration = slope of the v–t graph = ({v} − 0) ÷ {t} = 2 m/s².' },
      { q: 'The velocity rises steadily from 0 to {v} m/s in {t} s. What distance is covered in these {t} s?', why: 'Distance = area of the triangle = ½ × {t} × {v} = 36 m.' },
      { q: 'An object covers {d} m in the first {t1} s and then stays still until t = {t} s. What is its average speed over the whole {t} s?', why: 'Average speed = total distance ÷ total time = {d} ÷ {t} = 4 m/s (the stop counts in the time).' },
      { q: 'A bus speeds up from 0 to {v} m/s in {t1} s, keeps {v} m/s until t = {t2} s, then slows down and stops at t = {t3} s. What is the total distance?', why: 'Area under v–t = triangle ½ × 4 × 10 + rectangle 6 × 10 + triangle ½ × 2 × 10 = 20 + 60 + 10 = 90 m.' },
      { q: 'The velocity falls steadily from {u} m/s to 0 in {t} s. What is the acceleration (with its sign)?', why: 'Acceleration = (0 − {u}) ÷ {t} = −4 m/s². The minus sign means slowing down (retardation).' },
      { q: 'On the d–t graph the object goes from 0 to {d} m in {t1} s and comes back to 0 at t = {t} s. What is its displacement after {t} s?', why: 'It ends where it started, so the displacement is 0 (the distance is {d} + {d} = 60 m).' }
    ]
  },
  hi: {
    stories: [
      { q: 'एक कार लाल बत्ती पर खड़ी इंतज़ार कर रही है।', why: 'कार हिलती नहीं, इसलिए शुरुआत से उसकी दूरी वही रहती है: d–t ग्राफ़ एक समतल (क्षैतिज) रेखा है।' },
      { q: 'एक साइकिल सवार सीधी सड़क पर 5 m/s की स्थिर चाल से चल रहा है।', why: 'स्थिर वेग से v–t ग्राफ़ अक्ष के ऊपर एक समतल रेखा बनता है: न शून्य, न चढ़ती, न उतरती।' },
      { q: 'एक ट्रेन स्टेशन से छूटती है और समान रूप से तेज़ होती जाती है।', why: 'विराम से समान रूप से तेज़ होना एक समान त्वरण है: v–t ग्राफ़ 0 से ऊपर उठती सीधी रेखा है।' },
      { q: 'एक बस समान रूप से धीमी होकर बस स्टॉप पर रुक जाती है।', why: 'समान रूप से धीमा होना v–t पर 0 तक नीचे जाती सीधी रेखा है।' },
      { q: 'रवि पैदल दुकान तक जाता है, वहाँ कुछ देर रुकता है, फिर पैदल घर लौट आता है।', why: 'd–t ग्राफ़ पर: ऊपर जाती रेखा (दुकान तक जाना), समतल हिस्सा (रुकना), फिर वापस 0 तक नीचे आती रेखा (घर लौटना)।' },
      { q: 'एक गेंद सीधे ऊपर फेंकी जाती है और उसी ऊँचाई पर फिर से पकड़ ली जाती है।', why: 'ऊपर की दिशा धनात्मक है। वेग समान रूप से घटता है, सबसे ऊपर 0 होता है, फिर और-और ऋणात्मक होता जाता है: + से 0 होते हुए − तक एक ही सीधी v–t रेखा।' },
      { q: 'एक स्कूटर सीधी सड़क पर स्थिर चाल से चल रहा है।', why: 'स्थिर चाल यानी बराबर समय में बराबर दूरी: d–t ग्राफ़ एक सीधी तिरछी रेखा है।' },
      { q: 'एक पत्थर छत से गिराया जाता है और लगातार तेज़ी से गिरता है।', why: 'हर सेकंड तय की गई दूरी बढ़ती जाती है, इसलिए d–t ग्राफ़ ऊपर की ओर मुड़ता है और खड़ा होता जाता है।' },
      { q: 'एक बस स्टॉप से चलती है, तेज़ होती है, स्थिर चाल से चलती है, फिर धीमी होकर अगले स्टॉप पर रुक जाती है।', why: 'तेज़ होना (चढ़ती रेखा), स्थिर (समतल), धीमा होना (0 तक गिरती रेखा): समलंब के आकार का v–t ग्राफ़।' },
      { q: 'एक मेट्रो ट्रेन स्थिर चाल से चलती है और फिर ब्रेक लगाकर प्लेटफ़ॉर्म पर रुक जाती है।', why: 'पहले समतल (स्थिर चाल), फिर 0 तक गिरती सीधी रेखा (ब्रेक)।' },
      { q: '10 m/s से चलती एक कार तेज़ होकर 20 m/s पर पहुँचती है और फिर उसी चाल से चलती रहती है।', why: 'पहले कम मान पर समतल, तेज़ होते समय चढ़ती रेखा, फिर ज़्यादा मान पर फिर समतल।' },
      { q: 'हाईवे पर एक कार समान रूप से तेज़ होती है (एक समान त्वरण)। कौन-सा a–t ग्राफ़ सही है?', why: 'एक समान त्वरण का मतलब है a का एक ही धनात्मक मान, इसलिए a–t ग्राफ़ अक्ष के ऊपर समतल रेखा है।' }
    ],
    reads: [
      { q: 'd–t ग्राफ़ एक सीधी रेखा है: दूरी {t} s में 0 से {d} m हो जाती है। चाल कितनी है?', why: 'चाल = d–t ग्राफ़ की ढाल = {d} ÷ {t} = 5 m/s।' },
      { q: 'v–t ग्राफ़ {t} s तक {v} m/s पर समतल है। कितनी दूरी तय हुई?', why: 'दूरी = आयत का क्षेत्रफल = {v} × {t} = 120 m।' },
      { q: 'वेग {t} s में 0 से {v} m/s तक समान रूप से बढ़ता है। त्वरण कितना है?', why: 'त्वरण = v–t ग्राफ़ की ढाल = ({v} − 0) ÷ {t} = 2 m/s²।' },
      { q: 'वेग {t} s में 0 से {v} m/s तक समान रूप से बढ़ता है। इन {t} s में कितनी दूरी तय हुई?', why: 'दूरी = त्रिभुज का क्षेत्रफल = ½ × {t} × {v} = 36 m।' },
      { q: 'एक वस्तु पहले {t1} s में {d} m चलती है और फिर t = {t} s तक रुकी रहती है। पूरे {t} s में उसकी औसत चाल कितनी है?', why: 'औसत चाल = कुल दूरी ÷ कुल समय = {d} ÷ {t} = 4 m/s (रुकने का समय भी गिना जाता है)।' },
      { q: 'एक बस {t1} s में 0 से {v} m/s तक तेज़ होती है, t = {t2} s तक {v} m/s बनाए रखती है, फिर धीमी होकर t = {t3} s पर रुक जाती है। कुल दूरी कितनी है?', why: 'v–t के नीचे का क्षेत्रफल = त्रिभुज ½ × 4 × 10 + आयत 6 × 10 + त्रिभुज ½ × 2 × 10 = 20 + 60 + 10 = 90 m।' },
      { q: 'वेग {t} s में {u} m/s से समान रूप से घटकर 0 हो जाता है। त्वरण कितना है (चिह्न सहित)?', why: 'त्वरण = (0 − {u}) ÷ {t} = −4 m/s²। ऋण चिह्न का मतलब है धीमा होना (मंदन)।' },
      { q: 'd–t ग्राफ़ पर वस्तु {t1} s में 0 से {d} m तक जाती है और t = {t} s पर वापस 0 पर आ जाती है। {t} s के बाद उसका विस्थापन कितना है?', why: 'वह वहीं पहुँचती है जहाँ से चली थी, इसलिए विस्थापन 0 है (दूरी {d} + {d} = 60 m है)।' }
    ]
  }
};
