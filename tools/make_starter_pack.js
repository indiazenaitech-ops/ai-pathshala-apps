#!/usr/bin/env node
/* Build the free "AI Classroom Starter Pack" (lead magnet of the "Stay updated" form, also linked publicly):
 *   downloads/ai-classroom-starter-pack-hi.pdf   (Hindi edition)
 *   downloads/ai-classroom-starter-pack-en.pdf   (English edition: the same pages, the 10 prompts in Hindi + English)
 *
 *   node tools/make_starter_pack.js            (needs Chrome; Google Fonts "Mukta" is used when online, else Nirmala UI)
 *
 * 10 A4 pages: cover · start here · 10 ready AI prompts for teachers (2 pages) · a 1-week plan with 5 of our apps
 * (2 pages) · CBSE AI chapter-to-app map · classroom safety rules for AI · printable app QR sheet · more free help.
 * Data comes from the site itself, so the pack never drifts from it: app names, classes and descriptions from catalog.js,
 * the CBSE map from shared/schools.js + shared/schools-strings.js, QR codes from apps/qr-code-maker/qr.js (offline).
 * Strictly non-commercial: no prices, no offers, no ads, no tracking links.
 * Also writes page previews to tools/shots/starter-pack/<lang>-p<N>.png for checking. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'downloads');
const BUILD = path.join(require('os').tmpdir(), 'edu-starter-pack');     /* the HTML pages (not published) */
const SHOTS = path.join(__dirname, 'shots', 'starter-pack');
const SITE = 'https://apnipathshala.ai/';
const YT = 'https://www.youtube.com/@Apni_Pathshala_AI';
const ZIP = 'https://github.com/indiazenaitech-ops/ai-pathshala-apps/archive/refs/heads/main.zip';
const CHROME = require('./chrome-path')();
const PAGES = 10;

/* ------------------------------------------------------------------ site data */
function evalWindow(file) { const sb = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sb); return sb.window; }
const CATALOG = evalWindow('catalog.js').EDU_CATALOG;
const BY = Object.fromEntries(CATALOG.map(a => [a.slug, a]));
const SCH = evalWindow('shared/schools-strings.js').SCHOOLS_STRINGS;
const ALIGN = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'shared', 'schools.js'), 'utf8');
  const m = src.match(/var ALIGN = (\[[\s\S]*?\n  \]);/);
  if (!m) throw new Error('could not find ALIGN in shared/schools.js');
  return vm.runInNewContext('(' + m[1] + ')');
})();
const QR = (() => { const sb = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'apps', 'qr-code-maker', 'qr.js'), 'utf8'), sb); return sb.QRGen; })();
const LOGO = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'shared', 'img', 'icon-192.png')).toString('base64');

function need(slug) { if (!BY[slug]) throw new Error('app not in catalog.js: ' + slug); return BY[slug]; }
function appUrl(slug, L) { return SITE + 'apps/' + slug + '/' + (L !== 'en' ? '?lang=' + L : ''); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
/* a QR code as an inline SVG (black on white, 4-module quiet zone) */
function qrSvg(text, mm) {
  const q = QR.encode(text, 'M', { mask: -1 });
  if (!q.ok) throw new Error('QR too long: ' + text);
  const n = q.size, qz = 4, W = n + 2 * qz;
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.modules[y][x]) d += `M${x + qz} ${y + qz}h1v1h-1z`;
  return `<svg class="qr" viewBox="0 0 ${W} ${W}" style="width:${mm}mm;height:${mm}mm" shape-rendering="crispEdges" role="img" aria-label="QR: ${esc(text)}"><rect width="${W}" height="${W}" fill="#fff"/><path d="${d}" fill="#0b2f37"/></svg>`;
}
/* "[topic]" placeholders highlighted */
function prompt(s) { return esc(s).replace(/\[([^\]]+)\]/g, '<span class="ph">[$1]</span>'); }

/* ------------------------------------------------------------------ content */
const WEEK = ['ai-around-us', 'teachable-machine', 'next-word-predictor', 'prompt-builder', 'ai-ethics-dilemmas'];
const NEXT = ['sentiment-trainer', 'decision-tree-builder', 'chatbot-builder', 'confusion-matrix-lab'];
const QR_APPS = ['quiz-maker', 'live-quiz', 'attendance-register', 'marks-report-card', 'worksheet-generator', 'name-picker',
  'class-timer', 'ai-around-us', 'teachable-machine', 'prompt-builder', 'python-playground', 'phishing-spotter'];
[...WEEK, ...QR_APPS, ...NEXT, 'ai-basics-quiz', 'quiz-maker', 'worksheet-generator', 'name-picker', 'ai-project-cycle'].forEach(need);

/* the 10 prompts: Hindi text (both editions) + English version (English edition) */
const PROMPTS = [
  { t: { hi: 'पाठ योजना', en: 'Lesson plan' }, icon: '📝',
    hi: 'आप एक अनुभवी CBSE शिक्षक हैं। कक्षा [8] के लिए विषय [प्रकाश का परावर्तन] पर 40 मिनट की पाठ योजना हिंदी में बनाइए। इसमें लिखें: सीखने के 3 उद्देश्य, 5 मिनट की रोचक शुरुआत, बिना महँगे सामान वाली एक कक्षा गतिविधि, समझ जाँचने के 3 प्रश्न और गृहकार्य। भाषा सरल रखें।',
    en: 'You are an experienced CBSE teacher. Make a 40-minute lesson plan in Hindi for Class [8] on [reflection of light]: 3 learning goals, a 5-minute interesting start, one class activity with no costly material, 3 check questions and homework. Keep the language simple.',
    tip: { hi: '[ ] वाले हिस्से बदलें। जवाब लंबा लगे तो लिखें: "इसे आधा कर दो"।', en: 'Change the [ ] parts. Too long? Write: "Make it half as long."' } },
  { t: { hi: 'MCQ क्विज़', en: 'MCQ quiz' }, icon: '❓',
    hi: 'कक्षा [7] के विषय [भिन्न] पर 10 बहुविकल्पीय प्रश्न (MCQ) हिंदी में बनाइए। हर प्रश्न के 4 विकल्प हों। सही उत्तर अलग से लिखें और हर उत्तर का कारण एक पंक्ति में दें। 3 आसान, 4 मध्यम और 3 कठिन प्रश्न रखें।',
    en: 'Write 10 multiple-choice questions in Hindi for Class [7] on [fractions], 4 options each. List the correct answers separately with a one-line reason. Make 3 easy, 4 medium and 3 hard.',
    tip: { hi: 'प्रश्न जाँचकर हमारे "क्विज़ मेकर" ऐप में डालें: प्रोजेक्टर पर टीम क्विज़ या WhatsApp लिंक से अभ्यास।', en: 'Check the questions, then put them in our Quiz Maker app: a team quiz on the projector or practice by WhatsApp link.' } },
  { t: { hi: 'आसान भाषा में समझाना', en: 'Explain it simply' }, icon: '💡',
    hi: '[प्रकाश संश्लेषण] को कक्षा [6] के बच्चे को गाँव के खेत का उदाहरण देकर समझाइए। 150 शब्दों से कम, छोटे वाक्य। अंत में 2 प्रश्न दें जिनसे पता चले कि बच्चा समझा या नहीं।',
    en: 'Explain [photosynthesis] to a Class [6] child with an example from a village farm. Under 150 words, short sentences. End with 2 questions that show whether the child understood.',
    tip: { hi: 'अपने इलाक़े का उदाहरण माँगें, जैसे: "बिहार के गाँव का उदाहरण दो"।', en: 'Ask for a local example, e.g. "use an example from a village in Bihar".' } },
  { t: { hi: 'वर्कशीट', en: 'Worksheet' }, icon: '📄',
    hi: 'कक्षा [5] के लिए [समय और घड़ी] पर एक वर्कशीट बनाइए: 5 रिक्त स्थान, 5 सही/ग़लत, 3 छोटे प्रश्न और 1 चित्र बनाने वाला प्रश्न। उत्तर कुंजी अंत में अलग से दें।',
    en: 'Make a worksheet for Class [5] on [time and clocks]: 5 fill-in-the-blanks, 5 true/false, 3 short questions and 1 drawing question. Put the answer key at the end.',
    tip: { hi: 'गणित के अभ्यास के लिए हमारा "गणित वर्कशीट जनरेटर" उत्तर कुंजी के साथ नई शीटें बनाता है।', en: 'For maths drills, our Maths Worksheet Generator makes fresh sheets with answer keys.' } },
  { t: { hi: 'तीन स्तर का अभ्यास', en: 'Practice at three levels' }, icon: '🪜',
    hi: 'विषय [वाक्य के भेद] पर एक ही अभ्यास के तीन स्तर बनाइए: (क) जिन बच्चों को मदद चाहिए, (ख) सामान्य स्तर, (ग) तेज़ सीखने वालों के लिए चुनौती। हर स्तर में 4 प्रश्न हों।',
    en: 'On [kinds of sentences], make the same practice at three levels: (a) for children who need help, (b) regular, (c) a challenge for fast learners. 4 questions per level.',
    tip: { hi: 'समूह बनाने के लिए हमारा "नाम चुनें और ग्रुप बनाएँ" ऐप इस्तेमाल करें।', en: 'Use our Name Picker & Groups app to make the groups.' } },
  { t: { hi: 'आम ग़लतियाँ', en: 'Common mistakes' }, icon: '🔍',
    hi: 'कक्षा [9] के बच्चे [ऋणात्मक संख्याओं के गुणा] में अक्सर कौन-सी 5 ग़लतियाँ करते हैं? हर ग़लती का कारण, उसे पकड़ने वाला एक प्रश्न और 2 मिनट में सुधारने का तरीक़ा बताइए।',
    en: 'Which 5 mistakes do Class [9] students often make in [multiplying negative numbers]? For each: why it happens, one question that catches it, and a 2-minute way to fix it.',
    tip: { hi: 'टेस्ट की कॉपियाँ जाँचने के ठीक बाद यह सबसे काम का है।', en: 'Most useful right after you check test papers.' } },
  { t: { hi: 'मूल्यांकन रूब्रिक', en: 'Assessment rubric' }, icon: '📊',
    hi: 'कक्षा [10] के [AI प्रोजेक्ट] के लिए 4 मानदंडों वाला मूल्यांकन रूब्रिक तालिका में बनाइए: उत्कृष्ट, अच्छा, ठीक, सुधार चाहिए। मानदंड: विचार, काम का तरीक़ा, प्रस्तुति, टीमवर्क।',
    en: 'Make a 4-criteria assessment rubric as a table for a Class [10] [AI project]: Excellent, Good, Fair, Needs work. Criteria: idea, method, presentation, teamwork.',
    tip: { hi: 'काम शुरू होने से पहले ही रूब्रिक बच्चों को दिखा दें।', en: 'Show the rubric to students before they start.' } },
  { t: { hi: 'अभिभावकों को संदेश', en: 'Message to parents' }, icon: '💬',
    hi: 'अभिभावकों के लिए [अगले सोमवार से यूनिट टेस्ट] के बारे में एक छोटा, विनम्र WhatsApp संदेश हिंदी में लिखिए। 60 शब्दों से कम, तारीख़ और तैयारी के 2 सुझाव के साथ। किसी बच्चे का नाम न लिखें।',
    en: 'Write a short, polite WhatsApp message in Hindi for parents about [unit tests from next Monday]. Under 60 words, with the date and 2 preparation tips. Do not name any child.',
    tip: { hi: 'भेजने से पहले तारीख़ और बाक़ी बातें ख़ुद जाँच लें।', en: 'Check the date and details yourself before sending.' } },
  { t: { hi: 'कहानी और रोल-प्ले', en: 'Story and role-play' }, icon: '🎭',
    hi: '[जल चक्र] पर कक्षा [4] के लिए भारतीय पात्रों वाली एक छोटी कहानी लिखिए, 200 शब्दों से कम। फिर उसी पर 10 मिनट का रोल-प्ले बनाइए जिसमें 6 बच्चे भाग ले सकें।',
    en: 'Write a short story for Class [4] on [the water cycle] with Indian characters, under 200 words. Then make a 10-minute role-play on it for 6 children.',
    tip: { hi: 'कहानी में अपने स्कूल के आस-पास की जगहों के नाम डलवाएँ।', en: 'Ask it to use places near your school.' } },
  { t: { hi: 'AI प्रोजेक्ट का ख़ाका', en: 'AI project outline' }, icon: '🤖',
    hi: 'कक्षा [10] के AI विद्यार्थियों के लिए आस-पास की किसी समस्या (जैसे [स्कूल में पानी की बर्बादी]) पर AI प्रोजेक्ट का ख़ाका बनाइए, AI प्रोजेक्ट साइकिल के चरणों में: समस्या पहचान, डेटा जुटाना, डेटा समझना, मॉडल, मूल्यांकन। हर चरण में बच्चे क्या करेंगे, 2–3 पंक्तियों में।',
    en: 'For Class [10] AI students, outline an AI project on a local problem (e.g. [water wastage at school]) using the AI project cycle: problem scoping, data acquisition, data exploration, modelling, evaluation. 2–3 lines per stage on what students will do.',
    tip: { hi: 'हमारे "AI प्रोजेक्ट साइकिल कैनवस" ऐप में बच्चे हर चरण भरकर प्रिंट कर सकते हैं।', en: 'In our AI Project Cycle Canvas app, students fill in each stage and print it.' } }
];

/* the 1-week plan: one app a day, 40-minute periods */
const DAYS = [
  { day: { hi: 'सोमवार', en: 'Monday' }, theme: { hi: 'AI क्या है?', en: 'What is AI?' },
    goal: { hi: 'बच्चे पहचानें कि कौन-सी चीज़ें AI इस्तेमाल करती हैं और क्यों: AI डेटा से सीखता है और अनुमान लगाता है।', en: 'Students tell which everyday things use AI and why: AI learns from data and makes predictions.' },
    flow: { hi: [
      ['5', 'शुरुआत: "आपके घर में सबसे स्मार्ट मशीन कौन-सी है?" बोर्ड पर 6 जवाब लिखें।'],
      ['20', 'ऐप: प्रोजेक्टर पर कार्ड पढ़ें, हाथ उठाकर वोट करें: "AI है" या "AI नहीं"। फिर "Check answers" दबाकर हर कारण पढ़ें।'],
      ['10', 'चर्चा: AI के तीन निशान: डेटा से सीखता है, अनुमान लगाता है, अनुभव से बेहतर होता है। बोर्ड के 6 जवाब फिर से छाँटें।'],
      ['5', 'एग्ज़िट टिकट: AI वाली 2 चीज़ें और बिना AI वाली 1 चीज़ लिखें, कारण के साथ।']],
      en: [
      ['5', 'Start: "What is the smartest machine in your home?" Write 6 answers on the board.'],
      ['20', 'App: read the cards on the projector and vote with raised hands: "Uses AI" or "No AI". Then press "Check answers" and read each reason.'],
      ['10', 'Talk: the three signs of AI: it learns from data, it predicts, it gets better with experience. Sort the 6 board answers again.'],
      ['5', 'Exit ticket: write 2 things that use AI and 1 that does not, with reasons.']] },
    needs: { hi: 'प्रोजेक्टर या एक फ़ोन · इंटरनेट सिर्फ़ पहली बार · वर्कशीट प्रिंट भी कर सकते हैं', en: 'Projector or one phone · internet only the first time · the worksheet can be printed' } },
  { day: { hi: 'मंगलवार', en: 'Tuesday' }, theme: { hi: 'AI कैसे सीखता है? डेटा और पक्षपात', en: 'How does AI learn? Data and bias' },
    goal: { hi: 'उदाहरणों (ट्रेनिंग डेटा) से कंप्यूटर को सिखाना, और समझना कि कम या एकतरफ़ा डेटा से AI ग़लती करता है।', en: 'Teach the computer with examples (training data) and see that too little or one-sided data makes AI go wrong.' },
    flow: { hi: [
      ['5', 'शुरुआत: छोटे बच्चे ने "बिल्ली" पहचानना कैसे सीखा? बहुत सारी बिल्लियाँ देखकर!'],
      ['20', 'ऐप: दो क्लास बनाएँ (जैसे "पेन" और "किताब") और एक "कुछ नहीं" क्लास। हर क्लास के 30–50 उदाहरण रिकॉर्ड करें, फिर लाइव टेस्ट करें।'],
      ['10', 'प्रयोग: सिर्फ़ नीले पेन से सिखाएँ, फिर लाल पेन दिखाएँ। AI क्यों चूका? सबके लिए बराबर और अलग-अलग डेटा क्यों ज़रूरी है?'],
      ['5', 'एग्ज़िट टिकट: "AI की ग़लती का एक कारण" लिखें।']],
      en: [
      ['5', 'Start: how did a small child learn what a cat is? By seeing many cats!'],
      ['20', 'App: make two classes (e.g. "pen" and "book") and a "Nothing" class. Record 30–50 examples per class, then test it live.'],
      ['10', 'Experiment: train with blue pens only, then show a red pen. Why did the AI miss? Why must data be varied and fair to everyone?'],
      ['5', 'Exit ticket: write one reason why an AI makes mistakes.']] },
    needs: { hi: 'कैमरे वाला लैपटॉप या फ़ोन (या फ़ोटो अपलोड) · पहली बार इंटरनेट · तस्वीरें डिवाइस से बाहर नहीं जातीं', en: 'Laptop or phone with a camera (or upload photos) · internet the first time · pictures never leave the device' } },
  { day: { hi: 'बुधवार', en: 'Wednesday' }, theme: { hi: 'चैटबॉट लिखते कैसे हैं?', en: 'How do chatbots write?' },
    goal: { hi: 'समझना कि जनरेटिव AI अगले शब्द का अनुमान लगाकर लिखता है, इसलिए वह ग़लत बात भी पूरे भरोसे से लिख सकता है।', en: 'Understand that generative AI writes by guessing the next word, so it can write wrong things very confidently.' },
    flow: { hi: [
      ['5', 'खेल: "आज बारिश बहुत तेज़ …" कक्षा अगला शब्द बताए। सबसे ज़्यादा कौन-सा शब्द आया?'],
      ['20', 'ऐप: नमूना कहानी से मॉडल सिखाएँ। हर बार पहले कक्षा अगला शब्द बताए, फिर मॉडल। फिर किताब की एक कविता डालकर नई कविता लिखवाएँ।'],
      ['10', 'चर्चा: क्रिएटिविटी स्लाइडर 0 और 2 पर क्या बदला? क्या मॉडल "सच" जानता है, या सिर्फ़ शब्दों का क्रम?'],
      ['5', 'एग्ज़िट टिकट: "चैटबॉट कभी-कभी ग़लत क्यों लिखता है?"']],
      en: [
      ['5', 'Game: "Today the rain is very …" The class says the next word. Which word came most often?'],
      ['20', 'App: train the model on the sample story. Each time, the class guesses the next word first, then the model. Then type in a textbook poem and let it write a new one.'],
      ['10', 'Talk: what changed with the creativity slider at 0 and at 2? Does the model know the "truth", or only the order of words?'],
      ['5', 'Exit ticket: "Why does a chatbot sometimes write wrong things?"']] },
    needs: { hi: 'प्रोजेक्टर या फ़ोन · एक बार खुलने के बाद बिना इंटरनेट भी चलता है', en: 'Projector or phone · works without internet after the first visit' } },
  { day: { hi: 'गुरुवार', en: 'Thursday' }, theme: { hi: 'AI से अच्छा सवाल पूछना (प्रॉम्प्ट)', en: 'Asking AI well (prompts)' },
    goal: { hi: 'अच्छे प्रॉम्प्ट के हिस्से समझना: भूमिका, काम, संदर्भ, किसके लिए, किस रूप में; और AI का सुरक्षित इस्तेमाल।', en: 'Learn the parts of a good prompt: role, task, context, audience, format; and how to use AI safely.' },
    flow: { hi: [
      ['5', 'शुरुआत: बोर्ड पर कमज़ोर प्रॉम्प्ट लिखें: "पौधों के बारे में बताओ"। इसमें क्या कमी है?'],
      ['20', 'ऐप: हर समूह एक टेम्पलेट चुनकर प्रॉम्प्ट बनाए, क्वालिटी मीटर देखे और अपना प्रॉम्प्ट पढ़कर सुनाए।'],
      ['10', 'शिक्षक किसी मुफ़्त AI चैटबॉट में कमज़ोर और मज़बूत, दोनों प्रॉम्प्ट प्रोजेक्टर पर चलाएँ और जवाबों की तुलना करवाएँ। ऐप के सुरक्षा सुझाव पढ़ें।'],
      ['5', 'एग्ज़िट टिकट: कमज़ोर प्रॉम्प्ट को बेहतर बनाकर लिखें।']],
      en: [
      ['5', 'Start: write a weak prompt on the board: "tell me about plants". What is missing?'],
      ['20', 'App: each group picks a template, builds a prompt, checks the quality meter and reads its prompt aloud.'],
      ['10', 'The teacher runs the weak and the strong prompt in a free AI chatbot on the projector; the class compares the answers. Read the safety tips in the app.'],
      ['5', 'Exit ticket: rewrite the weak prompt into a good one.']] },
    needs: { hi: 'प्रोजेक्टर या फ़ोन · चैटबॉट वाला हिस्सा सिर्फ़ शिक्षक चलाएँ (उम्र-सीमा: पेज 8)', en: 'Projector or phone · only the teacher runs the chatbot part (age rules: page 8)' } },
  { day: { hi: 'शुक्रवार', en: 'Friday' }, theme: { hi: 'AI का सही और सुरक्षित इस्तेमाल', en: 'Using AI fairly and safely' },
    goal: { hi: 'असली जैसी स्थितियों पर बात करके ज़िम्मेदार AI के 6 सिद्धांत समझना, और कक्षा के अपने AI नियम बनाना।', en: 'Discuss real-life situations, learn the 6 principles of responsible AI, and make the class\'s own AI rules.' },
    flow: { hi: [
      ['5', 'सवाल: "अगर AI ने आपका होमवर्क लिख दिया, तो क्या वह आपका काम है?"'],
      ['20', 'ऐप: 2 कहानियाँ पढ़ें, लाइव वोट करें और टाइमर के साथ समूहों में चर्चा करें। कक्षा 6–7 में एक आसान कहानी चुनें।'],
      ['10', 'पेज 8 के नियम पढ़ें। कक्षा मिलकर अपने 5 AI नियम चुने और चार्ट पेपर पर लिखे।'],
      ['5', 'एग्ज़िट टिकट: "मैं AI का इस्तेमाल … के लिए करूँगा/करूँगी, … के लिए नहीं।"']],
      en: [
      ['5', 'Question: "If an AI wrote your homework, is it your work?"'],
      ['20', 'App: read 2 stories, vote live and discuss in timed groups. In Classes 6–7 pick one easy story.'],
      ['10', 'Read the rules on page 8. The class chooses its own 5 AI rules and writes them on chart paper.'],
      ['5', 'Exit ticket: "I will use AI for …, but not for …"']] },
    needs: { hi: 'प्रोजेक्टर या फ़ोन · चर्चा कार्ड प्रिंट भी हो सकते हैं', en: 'Projector or phone · the discussion cards can also be printed' } }
];

const T = {
  hi: {
    edition: 'हिंदी संस्करण', title: 'AI क्लासरूम स्टार्टर पैक', brand: 'AI की पाठशाला', tagline: 'स्कूलों के लिए मुफ़्त AI ऐप्स · हिंदी में AI वीडियो',
    sub: 'कक्षा 6–12 के शिक्षकों के लिए: पहले AI हफ़्ते की पूरी तैयारी',
    free: 'मुफ़्त · प्रिंट करें · शेयर करें',
    inside: 'इस पैक में',
    toc: [['3', '10 तैयार AI प्रॉम्प्ट (हिंदी में)', 'पाठ योजना, MCQ, वर्कशीट, रूब्रिक, अभिभावक संदेश…'], ['5', '5 ऐप्स के साथ 1 हफ़्ते की योजना', 'रोज़ 40 मिनट: शुरुआत, ऐप, चर्चा, एग्ज़िट टिकट'], ['7', 'CBSE AI: कौन-सा ऐप किस अध्याय के लिए', 'कक्षा 9–12, विषय कोड 417 और 843'], ['8', 'कक्षा में AI के सुरक्षा नियम', 'विद्यार्थियों और शिक्षकों के लिए, कक्षा में लगाने लायक'], ['9', 'प्रिंट करने लायक QR शीट', '12 काम के ऐप्स, स्कैन करके सीधे खोलें']],
    coverQr: 'स्कैन करें: स्कूलों के लिए पूरी जानकारी', facts: (n) => `${n} मुफ़्त ऐप्स · 12 भारतीय भाषाएँ · बच्चों के लिए न साइन-अप, न विज्ञापन`,
    month: 'अक्टूबर 2026',
    chips: ['✅ बच्चों के लिए बिना साइन-अप', '🔒 बच्चों का डेटा उनके डिवाइस पर', '🌐 12 भारतीय भाषाएँ', '📴 एक बार खुलने के बाद ऑफ़लाइन भी'],
    checkH: 'पहले हफ़्ते की तैयारी: चेकलिस्ट',
    check: ['सोमवार से शुक्रवार के 5 ऐप्स एक बार खोलकर देख लिए (पेज 5–6)', 'प्रोजेक्टर, स्मार्टबोर्ड या फ़ोन + स्पीकर तैयार', 'पेज 8 (सुरक्षा नियम) और पेज 9 (QR शीट) प्रिंट कर लिए', 'मंगलवार के लिए कैमरा या कुछ फ़ोटो तैयार', 'अभिभावकों को छोटा संदेश भेजा (प्रॉम्प्ट 8 की मदद से)', 'शुक्रवार के लिए चार्ट पेपर और स्केच पेन'],
    nextH: 'अगले हफ़्ते के लिए 4 और ऐप्स', nextLead: 'इसी तरह 40 मिनट: शुरुआत, ऐप, चर्चा, एग्ज़िट टिकट। QR पेज 9 पर और apnipathshala.ai पर।',
    rulesBoxH: 'हमारी कक्षा के 5 AI नियम', rulesBoxFoot: 'कक्षा ________   तारीख़ ________   सबके हस्ताक्षर ↓',
    reflH: 'हफ़्ते के बाद: ख़ुद से 3 सवाल', refl: ['बच्चों को सबसे ज़्यादा क्या पसंद आया?', 'किस दिन मुश्किल हुई, और क्यों?', 'अगली बार मैं क्या बदलूँगा/बदलूँगी?'],
    footer: 'apnipathshala.ai · मुफ़्त · प्रिंट करें और शेयर करें', pageOf: (p, n) => `पेज ${p} / ${n}`,
    p2h: 'शुरुआत यहाँ से', p2lead: '15 मिनट की तैयारी, और सोमवार से कक्षा में AI।',
    steps: [['फ़ोन या कंप्यूटर पर apnipathshala.ai खोलें', 'ऊपर भाषा में "हिन्दी" चुनें। कोई खाता या पासवर्ड नहीं चाहिए।'], ['पेज 5–6 से सोमवार का पाठ पढ़ें', 'उस दिन का ऐप एक बार खोलकर देख लें। पहली बार इंटरनेट चाहिए, फिर ऐप बिना इंटरनेट भी खुलता है।'], ['कक्षा में स्मार्टबोर्ड या प्रोजेक्टर पर ऐप खोलें', 'सिर्फ़ एक फ़ोन है? उसे पूरी कक्षा को दिखाएँ या समूहों में बारी-बारी से दें।']],
    aboutH: 'हमारे ऐप्स के बारे में',
    about: ['पूरी तरह मुफ़्त, कोई फ़ीस या छिपा शुल्क नहीं', 'बच्चों के लिए न साइन-अप, न विज्ञापन, न ट्रैकिंग', 'बच्चे जो लिखते हैं, वह उन्हीं के डिवाइस पर रहता है (वैकल्पिक लाइव क्विज़ को छोड़कर)', '12 भारतीय भाषाएँ: स्मार्टबोर्ड, लैपटॉप और सस्ते Android फ़ोन पर', 'इंटरनेट नहीं? पूरी लाइब्रेरी ZIP में डाउनलोड करें (पेज 10)'],
    chatH: 'AI चैटबॉट (ChatGPT, Gemini आदि) के बारे में दो बातें',
    chat: ['पेज 3–4 के प्रॉम्प्ट शिक्षकों के लिए हैं: किसी भी मुफ़्त AI चैटबॉट में टाइप करें या कॉपी करें, और जवाब ख़ुद जाँचें।', 'कई AI चैटबॉट 13 साल से ऊपर के लोगों के लिए हैं, और 18 से कम उम्र में माता-पिता की अनुमति चाहिए। छोटे बच्चों के साथ शिक्षक ख़ुद टूल चलाकर प्रोजेक्टर पर दिखाएँ।', 'किसी भी AI टूल में बच्चों का नाम, अंक, फ़ोटो या फ़ोन नंबर कभी न डालें।'],
    lowH: 'संसाधन कम हैं? कोई बात नहीं',
    low: ['एक फ़ोन + एक स्पीकर भी काफ़ी है: ऐप खोलें, कक्षा को दिखाएँ, समूहों में घुमाएँ।', 'बिजली या प्रोजेक्टर नहीं: पेज 9 की QR शीट प्रिंट करें; कई ऐप्स वर्कशीट और कार्ड भी प्रिंट करते हैं।'],
    p3h: '10 तैयार AI प्रॉम्प्ट: शिक्षकों के लिए', p3lead: 'किसी भी मुफ़्त AI चैटबॉट में टाइप करें या कॉपी करें। रंगीन [ ] वाले हिस्से अपनी कक्षा के हिसाब से बदलें।',
    rules3: ['AI का जवाब कक्षा में देने से पहले हमेशा ख़ुद जाँचें।', 'बच्चों की कोई निजी जानकारी कभी न डालें।', 'जवाब पसंद न आए तो कहें: "और सरल करो", "तालिका में दो", "उत्तर भी दो"।'],
    tipLbl: 'सुझाव', enLbl: 'In English',
    p5h: 'पहला AI हफ़्ता: 5 दिन, 5 ऐप्स', p5lead: 'कक्षा 6–10 · रोज़ एक 40 मिनट का पीरियड · हर ऐप मुफ़्त, बिना साइन-अप। QR स्कैन करें या पता टाइप करें।',
    min: 'मिनट', goalLbl: 'लक्ष्य', needLbl: 'ज़रूरत', scan: 'स्कैन करके खोलें',
    bonusH: 'शनिवार बोनस: 10 मिनट का क्विज़', bonus: '"AI बेसिक्स क्विज़" के 30 MCQ (CBSE AI 417): प्रोजेक्टर पर टीमों में खेलें। ख़ुद का क्विज़ बनाना हो तो "क्विज़ मेकर"।',
    outcomesH: 'हफ़्ते के अंत तक बच्चे बता पाएँगे', outcomes: ['AI क्या है और कहाँ-कहाँ है', 'AI डेटा से कैसे सीखता है, और ग़लती क्यों करता है', 'चैटबॉट अगले शब्द का अनुमान लगाकर कैसे लिखते हैं', 'अच्छा प्रॉम्प्ट कैसे लिखें', 'AI के सही और सुरक्षित इस्तेमाल के नियम'],
    p7h: 'CBSE AI: कौन-सा ऐप किस अध्याय के लिए', p7lead: 'सत्र 2026-27 के CBSE पाठ्यक्रम से हमारा सुझाया मिलान। यह CBSE का आधिकारिक संसाधन नहीं है; नवीनतम पाठ्यक्रम cbseacademic.nic.in पर ज़रूर देखें।',
    cls: (c) => `कक्षा ${c}`, unitLbl: 'यूनिट', appsLbl: 'ऐप्स', alsoH: 'कंप्यूटर साइंस (083) और इन्फ़ॉर्मेटिक्स प्रैक्टिसेज़ (065) के लिए भी', more: 'पूरी सूची, सभी कक्षाओं के लिए: apnipathshala.ai/schools.html',
    p8h: 'कक्षा में AI: सुरक्षा के नियम', p8lead: 'यह पेज प्रिंट करके कक्षा में लगाएँ। शुक्रवार को कक्षा इनमें से अपने 5 नियम चुन सकती है।',
    stuH: 'विद्यार्थियों के लिए 8 नियम',
    stu: ['अपना नाम, पता, फ़ोन नंबर, फ़ोटो या पासवर्ड किसी AI चैटबॉट में कभी न लिखें।', 'AI ग़लत भी हो सकता है। हर जवाब किताब, शिक्षक या भरोसेमंद स्रोत से जाँचें।', 'AI से मदद ली हो तो बताएँ। AI का काम अपना बताकर जमा न करें।', 'पहले ख़ुद सोचें, फिर AI से पूछें। AI सोचने का साथी है, सोचने की जगह नहीं।', 'किसी की फ़ोटो या आवाज़ से नक़ली (डीपफ़ेक) चीज़ें न बनाएँ, न आगे भेजें।', 'AI से भी विनम्रता से बात करें; किसी को परेशान करने के लिए AI का इस्तेमाल न करें।', 'कुछ अजीब, डरावना या ग़लत दिखे तो तुरंत शिक्षक या माता-पिता को बताएँ।', 'टूल की उम्र-सीमा मानें: कई AI चैटबॉट 13 साल से ऊपर के लिए हैं।'],
    teaH: 'शिक्षकों के लिए 6 बातें',
    tea: ['बच्चों के नाम, अंक, फ़ोटो, फ़ोन नंबर या कोई निजी जानकारी ऑनलाइन AI टूल में न डालें (DPDP अधिनियम 2023)।', 'जो AI टूल बच्चों से चलवाएँ, उसकी उम्र-सीमा और नियम पहले पढ़ें। 13 से कम उम्र वालों के लिए टूल ख़ुद चलाकर दिखाएँ।', 'AI से बने प्रश्न, उत्तर और तथ्य कक्षा में देने से पहले ख़ुद जाँचें।', 'ऐसा गृहकार्य दें जिसमें बच्चे की अपनी सोच दिखे: अपना अनुभव, कक्षा की बातचीत, हाथ से बना चित्र।', 'AI के अच्छे और बुरे, दोनों उपयोगों पर खुलकर बात करें।', 'हमारे ऐप्स बच्चों का डेटा उनके डिवाइस पर ही रखते हैं। दूसरे ऑनलाइन टूल के लिए स्कूल की नीति मानें।'],
    p9h: 'QR शीट: स्कैन करें और ऐप खोलें', p9lead: 'प्रिंट करें, कार्ड काटें और कक्षा या स्टाफ़ रूम में लगाएँ। हर QR सीधे हिंदी में ऐप खोलता है।',
    allCls: 'सभी कक्षाएँ', clsRange: (g) => `कक्षा ${g.replace('-', '–')}`,
    p10h: 'और मुफ़्त मदद',
    help: [['yt', 'YouTube: AI की पाठशाला', 'हिंदी में AI के मुफ़्त वीडियो पाठ और ऐप्स के ट्यूटोरियल।', YT], ['schools', 'स्कूलों के लिए पेज', 'एक दिन की रोल-आउट योजना, CBSE मिलान की पूरी सूची, अभिभावकों के लिए संदेश, सवाल-जवाब।', SITE + 'schools.html?lang=hi'], ['home', 'सभी ऐप्स', 'AI, गणित, विज्ञान, कोडिंग, भाषा और शिक्षक टूल: 12 भाषाओं में।', SITE + '?lang=hi']],
    updH: 'नए ऐप्स की ख़बर पाएँ (वैकल्पिक)', upd: 'जब हम नए मुफ़्त ऐप या हिंदी वीडियो जोड़ें, ईमेल पाएँ: apnipathshala.ai/#updates — सिर्फ़ वयस्कों (18+) के लिए; जब चाहें बंद करें।',
    zipH: 'बिना इंटरनेट वाले स्कूल', zip: 'पूरी लाइब्रेरी एक ZIP फ़ाइल में: github.com/indiazenaitech-ops/ai-pathshala-apps → Code → Download ZIP। अनज़िप करके index.html खोलें।',
    shareH: 'यह पैक दूसरे शिक्षकों तक पहुँचाएँ', share: 'यह PDF मुफ़्त है: प्रिंट करें, कॉपी करें, स्कूल के WhatsApp ग्रुप में भेजें। डाउनलोड: apnipathshala.ai/schools.html',
    legal: 'AI की पाठशाला एक स्वतंत्र, मुफ़्त पहल है; यह CBSE या किसी सरकारी संस्था से संबद्ध नहीं है। AI चैटबॉट दूसरी कंपनियों के हैं; उनके नियम और उम्र-सीमा वहीं देखें। सुझाव और सुधार YouTube पर कमेंट में भेजें।'
  },
  en: {
    edition: 'English edition', title: 'AI Classroom Starter Pack', brand: 'AI की पाठशाला · AI Pathshala', tagline: 'Free AI apps for schools · AI video lessons in Hindi',
    sub: 'For teachers of Classes 6–12: everything for your first AI week',
    free: 'Free · print it · share it',
    inside: 'Inside this pack',
    toc: [['3', '10 ready AI prompts (in Hindi, with English)', 'Lesson plans, MCQs, worksheets, rubrics, parent messages…'], ['5', 'A 1-week plan with 5 of our apps', '40 minutes a day: start, app, talk, exit ticket'], ['7', 'CBSE AI: which app for which chapter', 'Classes 9–12, subject codes 417 and 843'], ['8', 'Classroom safety rules for AI', 'For students and teachers, ready to put on the wall'], ['9', 'Printable QR sheet', '12 useful apps: scan and open']],
    coverQr: 'Scan: everything for schools', facts: (n) => `${n} free apps · 12 Indian languages · no sign-up and no ads for students`,
    month: 'October 2026',
    chips: ['✅ No sign-up for students', '🔒 Students\' data stays on their device', '🌐 12 Indian languages', '📴 Works offline after the first visit'],
    checkH: 'Getting ready for week 1: checklist',
    check: ['Opened the 5 apps for Monday to Friday once (pages 5–6)', 'Projector, smartboard or phone + speaker ready', 'Printed page 8 (safety rules) and page 9 (QR sheet)', 'A camera or a few photos ready for Tuesday', 'Sent parents a short message (prompt 8 can help)', 'Chart paper and sketch pens for Friday'],
    nextH: '4 more apps for next week', nextLead: 'The same 40 minutes: start, app, talk, exit ticket. QR codes on page 9 and at apnipathshala.ai.',
    rulesBoxH: 'Our class\'s 5 AI rules', rulesBoxFoot: 'Class ________   Date ________   Everyone signs ↓',
    reflH: 'After the week: 3 questions for yourself', refl: ['What did the students enjoy most?', 'Which day was hard, and why?', 'What will I change next time?'],
    footer: 'apnipathshala.ai · free · print and share', pageOf: (p, n) => `Page ${p} / ${n}`,
    p2h: 'Start here', p2lead: '15 minutes to get ready, and AI in your classroom from Monday.',
    steps: [['Open apnipathshala.ai on a phone or computer', 'Pick your language at the top. No account, no password.'], ['Read Monday\'s lesson on pages 5–6', 'Open that day\'s app once to try it. The first visit needs internet; after that the app also opens offline.'], ['In class, open the app on the smartboard or projector', 'Only one phone? Show it to the class, or pass it from group to group.']],
    aboutH: 'About our apps',
    about: ['Completely free: no fees, nothing hidden', 'No sign-up, no ads and no tracking for students', 'What students type stays on their device (except the optional Live Quiz)', '12 Indian languages, on smartboards, laptops and low-cost Android phones', 'No internet? Download the whole library as a ZIP (page 10)'],
    chatH: 'Two things about AI chatbots (ChatGPT, Gemini…)',
    chat: ['The prompts on pages 3–4 are for teachers: type or copy them into any free AI chatbot, and check the answers yourself.', 'Many AI chatbots are only for ages 13 and up, and under-18s need a parent\'s permission. With younger students, run the tool yourself and show it on the projector.', 'Never type students\' names, marks, photos or phone numbers into any AI tool.'],
    lowH: 'Few devices? That is fine',
    low: ['One phone and a speaker are enough: open the app, show the class, pass it round the groups.', 'No power or projector: print the QR sheet on page 9; many apps also print worksheets and cards.'],
    p3h: '10 ready AI prompts for teachers', p3lead: 'Type or copy the Hindi prompt into any free AI chatbot (the English version is below it). Change the coloured [ ] parts for your class.',
    rules3: ['Always check an AI answer before you use it in class.', 'Never type any personal details of students.', 'Not happy? Say: "make it simpler", "give it as a table", "add the answers".'],
    tipLbl: 'Tip', enLbl: 'In English',
    p5h: 'Your first AI week: 5 days, 5 apps', p5lead: 'Classes 6–10 · one 40-minute period a day · every app is free, no sign-up. Scan the QR or type the address.',
    min: 'min', goalLbl: 'Goal', needLbl: 'You need', scan: 'Scan to open',
    bonusH: 'Saturday bonus: a 10-minute quiz', bonus: 'The 30 MCQs of "AI Basics Quiz" (CBSE AI 417): play in teams on the projector. To make your own quiz, use "Quiz Maker".',
    outcomesH: 'By the end of the week, students can explain', outcomes: ['what AI is and where it is around us', 'how AI learns from data, and why it makes mistakes', 'how chatbots write by guessing the next word', 'how to write a good prompt', 'the rules for using AI fairly and safely'],
    p7h: 'CBSE AI: which app for which chapter', p7lead: 'Our suggested match with the CBSE curriculum for session 2026-27. This is not an official CBSE resource; please check the latest syllabus on cbseacademic.nic.in.',
    cls: (c) => `Class ${c}`, unitLbl: 'Unit', appsLbl: 'Apps', alsoH: 'Also for Computer Science (083) and Informatics Practices (065)', more: 'The full list for all classes: apnipathshala.ai/schools.html',
    p8h: 'AI in the classroom: safety rules', p8lead: 'Print this page and put it up in class. On Friday the class can choose its own 5 rules from it.',
    stuH: '8 rules for students',
    stu: ['Never type your name, address, phone number, photos or passwords into an AI chatbot.', 'AI can be wrong. Check every answer with your book, your teacher or a trusted source.', 'Say when AI helped you. Never hand in AI\'s work as your own.', 'Think first, then ask AI. AI is a thinking partner, not a replacement for thinking.', 'Never make or forward fake (deepfake) pictures or voices of anyone.', 'Be polite with AI too, and never use AI to hurt or bully anyone.', 'If something looks strange, scary or wrong, tell a teacher or parent at once.', 'Respect age limits: many AI chatbots are only for ages 13 and up.'],
    teaH: '6 points for teachers',
    tea: ['Never put students\' names, marks, photos, phone numbers or other personal data into online AI tools (DPDP Act 2023).', 'Before students use an AI tool, read its age limit and rules. For children under 13, run the tool yourself and show it.', 'Check AI-made questions, answers and facts yourself before using them in class.', 'Set homework that shows the student\'s own thinking: their experience, class discussion, hand-drawn work.', 'Talk openly about both the good and the harmful uses of AI.', 'Our apps keep students\' data on their own device. For other online tools, follow your school\'s policy.'],
    p9h: 'QR sheet: scan and open the app', p9lead: 'Print, cut out the cards and put them up in class or in the staff room. Each QR opens the app directly.',
    allCls: 'All classes', clsRange: (g) => `Class ${g.replace('-', '–')}`,
    p10h: 'More free help',
    help: [['yt', 'YouTube: AI की पाठशाला', 'Free AI video lessons in Hindi and tutorials for our apps.', YT], ['schools', 'The page for schools', 'A one-day roll-out plan, the full CBSE list, a message for parents, questions and answers.', SITE + 'schools.html'], ['home', 'All apps', 'AI, maths, science, coding, languages and teacher tools, in 12 languages.', SITE]],
    updH: 'Get news of new apps (optional)', upd: 'Get an email when we add new free apps or Hindi videos: apnipathshala.ai/#updates. Adults (18+) only; stop any time.',
    zipH: 'Schools without internet', zip: 'The whole library in one ZIP file: github.com/indiazenaitech-ops/ai-pathshala-apps → Code → Download ZIP. Unzip it and open index.html.',
    shareH: 'Pass this pack on to other teachers', share: 'This PDF is free: print it, copy it, send it to your school\'s WhatsApp group. Download: apnipathshala.ai/schools.html',
    legal: 'AI की पाठशाला (AI Pathshala) is an independent, free initiative, not affiliated with CBSE or any government body. AI chatbots belong to other companies; check their own rules and age limits. Send ideas and corrections as a comment on YouTube.'
  }
};

/* ------------------------------------------------------------------ page builder */
function build(L) {
  const S = T[L], N = PAGES;
  const title = a => (a.title[L] || a.title.en);
  const grades = a => (!a.grades || a.grades === 'all') ? S.allCls : (a.grades === 'UG' ? 'UG' : S.clsRange(a.grades));
  let pageNo = 0;
  function page(cls, body, opts = {}) {
    pageNo++;
    const head = opts.cover ? '' : `<header class="ph-head"><img src="${LOGO}" alt=""><b>${esc(S.title)}</b><span>${esc(opts.section || '')}</span></header>`;
    const foot = opts.cover ? '' : `<footer class="ph-foot"><span>${esc(S.footer)}</span><span>${esc(S.pageOf(pageNo, N))}</span></footer>`;
    return `<section class="page ${cls}" data-page="${pageNo}">${head}<div class="fit">${body}</div>${foot}</section>`;
  }
  const out = [];

  /* 1. cover */
  out.push(page('cover', `
    <div class="band"><img src="${LOGO}" alt=""><div><div class="b1">${esc(S.brand)}</div><div class="b2">${esc(S.tagline)}</div></div><span class="pill">${esc(S.edition)}</span></div>
    <div class="cv-main">
      <div class="kicker">${esc(S.free)}</div>
      <h1>${esc(S.title)}</h1>
      <p class="sub">${esc(S.sub)}</p>
      <h2 class="inside">${esc(S.inside)}</h2>
      <ol class="toc">${S.toc.map(([p, h, d]) => `<li><span class="pg">${p}</span><div><b>${esc(h)}</b><small>${esc(d)}</small></div></li>`).join('')}</ol>
      <ul class="chips">${S.chips.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    </div>
    <div class="cv-foot">${qrSvg(SITE + 'schools.html' + (L !== 'en' ? '?lang=' + L : ''), 30)}<div><b>${esc(S.coverQr)}</b><div class="url">apnipathshala.ai/schools.html</div><p>${esc(S.facts(CATALOG.length))}</p><p class="muted">${esc(S.month)}</p></div></div>`, { cover: true }));

  /* 2. start here */
  out.push(page('start', `
    <h2>${esc(S.p2h)}</h2><p class="lead">${esc(S.p2lead)}</p>
    <ol class="steps">${S.steps.map(([h, d], i) => `<li><span class="num">${i + 1}</span><div><b>${esc(h)}</b><p>${esc(d)}</p></div></li>`).join('')}</ol>
    <div class="grid2">
      <div class="box teal"><h3>✅ ${esc(S.aboutH)}</h3><ul>${S.about.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="box orange"><h3>⚠️ ${esc(S.chatH)}</h3><ul>${S.chat.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>
    <div class="box plain"><h3>📱 ${esc(S.lowH)}</h3><ul>${S.low.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="box check"><h3>📋 ${esc(S.checkH)}</h3><ul class="cbx">${S.check.map(x => `<li><span class="sq"></span>${esc(x)}</li>`).join('')}</ul></div>`, { section: S.p2h }));

  /* 3-4. prompts */
  for (const part of [PROMPTS.slice(0, 5), PROMPTS.slice(5)]) {
    const first = part === undefined || part[0] === PROMPTS[0];
    out.push(page('prompts', `
      ${first ? `<h2>${esc(S.p3h)}</h2><p class="lead">${esc(S.p3lead)}</p><ul class="mini">${S.rules3.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : `<h2>${esc(S.p3h)} <span class="cont">(${L === 'hi' ? 'जारी' : 'continued'})</span></h2>`}
      ${part.map(p => {
        const n = PROMPTS.indexOf(p) + 1;
        return `<article class="prompt"><div class="pr-h"><span class="num">${n}</span><span class="ic">${p.icon}</span><b>${esc(p.t[L])}</b></div>
          <div class="pr-text" lang="hi">${prompt(p.hi)}</div>
          ${L === 'en' ? `<div class="pr-en"><i>${esc(S.enLbl)}:</i> ${prompt(p.en)}</div>` : ''}
          <div class="pr-tip"><b>${esc(S.tipLbl)}:</b> ${esc(p.tip[L])}</div></article>`;
      }).join('')}`, { section: S.p3h }));
  }

  /* 5-6. week plan */
  const dayCard = (d, i) => {
    const a = need(WEEK[i]);
    return `<article class="day"><div class="day-h"><span class="dname">${esc(d.day[L])}</span><b>${esc(d.theme[L])}</b></div>
      <div class="day-b"><div class="day-l">
        <div class="app"><span class="ic">${a.icon}</span><b>${esc(title(a))}</b><small>${esc(grades(a))}</small></div>
        <p><b>${esc(S.goalLbl)}:</b> ${esc(d.goal[L])}</p>
        <ol class="flow">${d.flow[L].map(([m, t]) => `<li><span class="min">${m} ${esc(S.min)}</span><span>${esc(t)}</span></li>`).join('')}</ol>
        <p class="need"><b>${esc(S.needLbl)}:</b> ${esc(d.needs[L])}</p></div>
        <div class="day-r">${qrSvg(appUrl(a.slug, L), 25)}<small>${esc(S.scan)}</small><code>apnipathshala.ai/apps/${esc(a.slug)}</code></div></div></article>`;
  };
  out.push(page('week', `<h2>${esc(S.p5h)}</h2><p class="lead">${esc(S.p5lead)}</p>${DAYS.slice(0, 3).map((d, i) => dayCard(d, i)).join('')}`, { section: S.p5h }));
  const quiz = need('ai-basics-quiz');
  out.push(page('week', `${DAYS.slice(3).map((d, i) => dayCard(d, i + 3)).join('')}
    <div class="grid2 tight">
      <div class="box teal bonus"><div><h3>🏆 ${esc(S.bonusH)}</h3><p>${esc(S.bonus)}</p><code>apnipathshala.ai/apps/${quiz.slug}</code></div>${qrSvg(appUrl(quiz.slug, L), 25)}</div>
      <div class="box plain"><h3>🎯 ${esc(S.outcomesH)}</h3><ul>${S.outcomes.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>
    <div class="box next"><h3>➡️ ${esc(S.nextH)}</h3><p class="muted">${esc(S.nextLead)}</p>
      <div class="ngrid">${NEXT.map(s2 => { const a = BY[s2]; return `<div class="ncard"><div class="app"><span class="ic">${a.icon}</span><b>${esc(title(a))}</b><small>${esc(grades(a))}</small></div><p>${esc(a.desc[L] || a.desc.en)}</p></div>`; }).join('')}</div></div>`, { section: S.p5h }));

  /* 7. CBSE map */
  const SL = SCH[L] || SCH.en;
  const block = (subj, cls) => {
    const c = ALIGN.find(x => x.subj === subj && x.cls === cls);
    const rows = c.rows.map(([u, key, slugs]) => [u, key, slugs.filter(s => BY[s])]).filter(r => r[2].length);
    return `<div class="cb"><h3>${esc(S.cls(cls))} · ${esc(SL[subj])}</h3><table><tbody>${rows.map(([u, key, slugs]) =>
      `<tr><th>${esc(S.unitLbl)} ${u}</th><td class="unit">${esc(SL[key])}</td><td class="apps">${slugs.map(s => `<span>${BY[s].icon} ${esc(title(BY[s]))}</span>`).join('')}</td></tr>`).join('')}</tbody></table></div>`;
  };
  const also = ALIGN.filter(c => c.subj === 'subj_cs' || c.subj === 'subj_ip').map(c => {
    const apps = [...new Set(c.rows.flatMap(r => r[2]).filter(s => BY[s]))];
    return `<li><b>${esc(S.cls(c.cls))} · ${esc(SL[c.subj])}:</b> ${apps.map(s => esc(title(BY[s]))).join(', ')}</li>`;
  }).join('');
  out.push(page('cbse', `<h2>${esc(S.p7h)}</h2><p class="lead small">${esc(S.p7lead)}</p>
    ${block('subj_ai417', 9)}${block('subj_ai417', 10)}${block('subj_ai843', 11)}${block('subj_ai843', 12)}
    <div class="box plain also"><h3>💻 ${esc(S.alsoH)}</h3><ul>${also}</ul><p class="muted">${esc(S.more)}</p></div>`, { section: S.p7h }));

  /* 8. safety rules */
  out.push(page('rules', `<h2>${esc(S.p8h)}</h2><p class="lead">${esc(S.p8lead)}</p>
    <div class="box rules-stu"><h3>🧒 ${esc(S.stuH)}</h3><ol>${S.stu.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
    <div class="box teal rules-tea"><h3>🧑‍🏫 ${esc(S.teaH)}</h3><ol>${S.tea.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
    <div class="box ourrules"><h3>✍️ ${esc(S.rulesBoxH)}</h3><ol>${[1, 2, 3, 4, 5].map(() => '<li><span class="line"></span></li>').join('')}</ol><p class="muted">${esc(S.rulesBoxFoot)}</p></div>`, { section: S.p8h }));

  /* 9. QR sheet */
  out.push(page('qrsheet', `<h2>${esc(S.p9h)}</h2><p class="lead">${esc(S.p9lead)}</p>
    <div class="qgrid">${QR_APPS.map(s => { const a = BY[s]; return `<div class="qcard">${qrSvg(appUrl(s, L), 27)}<div class="qt"><span class="ic">${a.icon}</span><b>${esc(title(a))}</b></div><small>${esc(grades(a))}</small><p>${esc(a.desc[L] || a.desc.en)}</p></div>`; }).join('')}</div>`, { section: S.p9h }));

  /* 10. more help */
  out.push(page('help', `<h2>${esc(S.p10h)}</h2>
    <div class="helps">${S.help.map(([k, h, d, url]) => `<div class="hcard">${qrSvg(url, 30)}<div><h3>${k === 'yt' ? '▶️' : k === 'schools' ? '🏫' : '📚'} ${esc(h)}</h3><p>${esc(d)}</p><code>${esc(url.replace(/^https:\/\/(www\.)?/, ''))}</code></div></div>`).join('')}</div>
    <div class="grid2">
      <div class="box teal"><h3>📩 ${esc(S.updH)}</h3><p>${esc(S.upd)}</p></div>
      <div class="box plain"><h3>💾 ${esc(S.zipH)}</h3><p>${esc(S.zip)}</p></div>
    </div>
    <div class="box orange"><h3>🤝 ${esc(S.shareH)}</h3><p>${esc(S.share)}</p></div>
    <div class="box plain refl"><h3>🪞 ${esc(S.reflH)}</h3><ol>${S.refl.map(x => `<li>${esc(x)}<span class="line"></span></li>`).join('')}</ol></div>
    <p class="legal">${esc(S.legal)}</p>`, { section: S.p10h }));

  if (pageNo !== N) throw new Error(`built ${pageNo} pages, expected ${N}`);
  return `<!doctype html><html lang="${L}"><head><meta charset="utf-8"><title>${esc(S.title)} · ${esc(S.edition)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&family=Noto+Emoji:wght@500&display=block" rel="stylesheet">
<style>${CSS}</style></head><body>${out.join('\n')}
<script>
/* shrink a page's text a little if it does not fit (never below 80 %) */
window.__fit = async function () {
  const report = [];
  for (const p of document.querySelectorAll('.page')) {
    const box = p.querySelector('.fit');
    let s = 1;
    while (box.scrollHeight > box.clientHeight + 1 && s > 0.8) { s -= 0.02; box.style.setProperty('--s', s.toFixed(2)); }
    report.push({ page: +p.dataset.page, scale: +s.toFixed(2), overflow: box.scrollHeight - box.clientHeight });
  }
  window.__fitReport = report;
};
</script></body></html>`;
}

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; }
/* emoji: the one-colour Noto Emoji (small vector glyphs, prints well in black and white) instead of colour emoji */
body { font-family: 'Mukta', 'Noto Emoji', 'Nirmala UI', 'Segoe UI', sans-serif; color: #1b2a30; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.ic { font-family: 'Noto Emoji', 'Segoe UI Emoji', sans-serif; color: #0b4f5c; }
h2 .cont { font-weight: 500; font-size: .7em; color: #5a6a70; }
.page { width: 210mm; height: 297mm; overflow: hidden; position: relative; page-break-after: always; break-after: page; display: flex; flex-direction: column; padding: 0 13mm; }
.page:last-child { page-break-after: auto; break-after: auto; }
.fit { --s: 1; flex: 1; min-height: 0; overflow: hidden; font-size: calc(10.6pt * var(--s)); line-height: 1.38; padding-top: 3mm; }
.ph-head { display: flex; align-items: center; gap: 2.5mm; height: 13mm; border-bottom: .5mm solid #0b4f5c; color: #0b4f5c; font-size: 9pt; flex: none; }
.ph-head img { width: 7mm; height: 7mm; border-radius: 1.6mm; }
.ph-head span { margin-inline-start: auto; color: #5a6a70; }
.ph-foot { display: flex; justify-content: space-between; height: 9mm; align-items: center; border-top: .3mm solid #e3d8c9; color: #5a6a70; font-size: 8pt; flex: none; }
h1, h2, h3 { margin: 0; line-height: 1.2; }
h2 { font-size: 1.75em; color: #0b4f5c; margin-bottom: 1mm; }
h3 { font-size: 1.12em; margin-bottom: 1.2mm; }
p { margin: 0 0 1.5mm; }
ul, ol { margin: 0; padding-inline-start: 5mm; }
li { margin-bottom: .8mm; }
.lead { font-size: 1.08em; color: #33454b; margin-bottom: 3mm; }
.lead.small { font-size: .95em; }
.muted { color: #5a6a70; }
code { font-family: 'Cascadia Code', Consolas, monospace; font-size: .78em; color: #0b4f5c; word-break: break-all; }
.box { border: .35mm solid #e3d8c9; border-radius: 3mm; padding: 3mm 4mm; margin-bottom: 3.5mm; background: #fff; }
.box.teal { border-color: #9fcfd5; background: #eef7f8; }
.box.orange { border-color: #f3b89c; background: #fdf1ea; }
.box.plain { background: #fbf8f3; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5mm; }
.grid2.tight .box { margin-bottom: 0; }
.num { display: inline-grid; place-items: center; width: 7mm; height: 7mm; border-radius: 50%; background: #0b4f5c; color: #fff; font-weight: 800; font-size: .95em; flex: none; }

/* cover */
.cover { padding: 0; background: #faf6f0; }
.cover .fit { padding: 0; display: flex; flex-direction: column; }
.band { background: #0b4f5c; color: #fff; display: flex; align-items: center; gap: 4mm; padding: 7mm 13mm; }
.band img { width: 19mm; height: 19mm; border-radius: 4.5mm; background: #fff; }
.band .b1 { font-size: 20pt; font-weight: 800; line-height: 1.1; }
.band .b2 { font-size: 11pt; opacity: .92; }
.band .pill { margin-inline-start: auto; background: #d9501c; color: #fff; font-weight: 700; border-radius: 99mm; padding: 1.5mm 4.5mm; font-size: 10pt; white-space: nowrap; }
.cv-main { padding: 11mm 13mm 0; flex: 1; }
.kicker { display: inline-block; color: #d9501c; font-weight: 800; font-size: 12pt; letter-spacing: .02em; margin-bottom: 2mm; }
.cover h1 { font-size: 36pt; color: #0b4f5c; font-weight: 800; line-height: 1.08; margin-bottom: 3mm; }
.cover .sub { font-size: 15pt; color: #33454b; margin-bottom: 9mm; }
.inside { font-size: 14pt; color: #d9501c; margin-bottom: 3mm; }
.toc { list-style: none; padding: 0; display: grid; gap: 3mm; }
.toc li { display: flex; gap: 4mm; align-items: center; background: #fff; border: .35mm solid #e3d8c9; border-radius: 3mm; padding: 3mm 4mm; margin: 0; }
.toc .pg { width: 10mm; height: 10mm; border-radius: 2.5mm; background: #eef7f8; color: #0b4f5c; display: grid; place-items: center; font-weight: 800; font-size: 13pt; flex: none; }
.toc b { display: block; font-size: 12.5pt; }
.toc small { color: #5a6a70; font-size: 10pt; }
.chips { list-style: none; padding: 0; margin: 7mm 0 0; display: flex; flex-wrap: wrap; gap: 2.5mm; }
.chips li { margin: 0; background: #eef7f8; color: #0b4f5c; border: .35mm solid #9fcfd5; border-radius: 99mm; padding: 1.2mm 4mm; font-weight: 700; font-size: 10.5pt; }
.cv-foot { display: flex; gap: 6mm; align-items: center; background: #fff; border-top: .5mm solid #e3d8c9; padding: 7mm 13mm 9mm; }
.cv-foot b { font-size: 12pt; color: #0b4f5c; }
.cv-foot .url { font-size: 17pt; font-weight: 800; color: #d9501c; margin: .5mm 0 1.5mm; }
.cv-foot p { margin: 0; font-size: 10pt; }

/* start */
.steps { list-style: none; padding: 0; display: grid; gap: 2.5mm; margin-bottom: 4mm; }
.steps li { display: flex; gap: 3.5mm; align-items: flex-start; margin: 0; }
.steps b { font-size: 1.08em; }
.steps p { margin: .5mm 0 0; color: #33454b; }

.cbx { list-style: none; padding: 0; columns: 2; column-gap: 6mm; }
.cbx li { display: flex; gap: 2.5mm; align-items: flex-start; break-inside: avoid; margin-bottom: 1.6mm; }
.sq { flex: none; width: 4mm; height: 4mm; border: .45mm solid #0b4f5c; border-radius: .8mm; margin-top: .9mm; }
.line { display: block; border-bottom: .3mm solid #9aa9ad; height: 7mm; }
.ourrules { border: .6mm dashed #0b4f5c; }
.ourrules ol { font-size: 1.1em; }
.ourrules li { margin-bottom: 0; }
.refl li { margin-bottom: 1mm; }
.ngrid { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 5mm; }
.ncard p { font-size: .88em; color: #33454b; margin: 0; }

/* prompts */
.mini { display: flex; flex-wrap: wrap; gap: 1mm 6mm; list-style: none; padding: 0; margin-bottom: 3mm; font-size: .9em; color: #33454b; }
.mini li::before { content: '✓ '; color: #15803d; font-weight: 800; }
.prompt { border: .35mm solid #e3d8c9; border-radius: 3mm; padding: 2.6mm 3.5mm; margin-bottom: 3mm; break-inside: avoid; }
.pr-h { display: flex; gap: 2.2mm; align-items: center; margin-bottom: 1.4mm; font-size: 1.1em; }
.pr-h .ic { font-size: 1.05em; }
.pr-text { background: #f5f8f8; border-inline-start: 1.2mm solid #0b4f5c; border-radius: 1.5mm; padding: 1.8mm 3mm; font-size: 1.04em; line-height: 1.45; }
.pr-en { font-size: .9em; color: #33454b; margin-top: 1.4mm; line-height: 1.35; }
.pr-tip { font-size: .88em; color: #5a6a70; margin-top: 1.4mm; }
.ph { color: #b9400f; font-weight: 700; }

/* week */
.day { border: .35mm solid #9fcfd5; border-radius: 3mm; margin-bottom: 3.5mm; overflow: hidden; break-inside: avoid; }
.day-h { background: #0b4f5c; color: #fff; padding: 1.6mm 4mm; display: flex; gap: 3mm; align-items: baseline; font-size: 1.12em; }
.day-h .dname { background: #d9501c; border-radius: 99mm; padding: 0 3mm; font-weight: 800; font-size: .88em; }
.day-b { display: flex; gap: 4mm; padding: 2.4mm 4mm 2.6mm; }
.day-l { flex: 1; min-width: 0; }
.day-r { flex: none; width: 29mm; display: flex; flex-direction: column; align-items: center; gap: .6mm; text-align: center; }
.day-r small { font-size: .78em; color: #5a6a70; }
.day-r code { font-size: .62em; }
.app { display: flex; gap: 2mm; align-items: baseline; margin-bottom: 1mm; font-size: 1.04em; color: #0b4f5c; }
.app small { color: #5a6a70; font-size: .82em; }
.flow { list-style: none; padding: 0; margin: 1mm 0; }
.flow li { display: flex; gap: 2.5mm; margin-bottom: .6mm; font-size: .95em; }
.flow .min { flex: none; width: 13mm; font-weight: 800; color: #d9501c; }
.need { font-size: .86em; color: #5a6a70; margin: 0; }
.bonus { display: flex; gap: 3mm; align-items: center; justify-content: space-between; }

/* cbse */
.cb { margin-bottom: 3mm; }
.cb h3 { color: #fff; background: #0b4f5c; border-radius: 2mm 2mm 0 0; padding: 1.2mm 3mm; margin: 0; font-size: 1.02em; }
.cb table { width: 100%; border-collapse: collapse; font-size: .9em; }
.cb th, .cb td { border: .3mm solid #d9e4e6; padding: 1.1mm 2mm; vertical-align: top; text-align: start; }
.cb th { width: 15mm; background: #eef7f8; white-space: nowrap; }
.cb td.unit { width: 42%; }
.cb td.apps span { display: inline-block; margin: 0 2.5mm .3mm 0; }
.also ul { font-size: .9em; }

/* rules */
.rules-stu { border: .8mm solid #d9501c; background: #fff; }
.rules-stu h3 { font-size: 1.45em; color: #b9400f; }
.rules-stu ol { font-size: 1.25em; line-height: 1.38; }
.rules-stu li { margin-bottom: 1.4mm; }
.rules-tea ol { font-size: 1em; }
.write { font-size: 1.1em; color: #33454b; margin: 3mm 0 0; }

/* qr sheet */
.qgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border: .3mm dashed #b8c5c8; }
.qcard { border: .3mm dashed #b8c5c8; padding: 2.5mm 2.5mm 2mm; text-align: center; display: flex; flex-direction: column; align-items: center; gap: .6mm; }
.qt { display: flex; gap: 1.5mm; align-items: baseline; justify-content: center; font-size: 1.02em; line-height: 1.2; }
.qcard small { color: #0b4f5c; font-weight: 700; font-size: .8em; }
.qcard p { font-size: .76em; color: #5a6a70; margin: 0; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }

/* help */
.helps { display: grid; gap: 3.5mm; margin: 2mm 0 4mm; }
.hcard { display: flex; gap: 5mm; align-items: center; border: .35mm solid #e3d8c9; border-radius: 3mm; padding: 3mm 4mm; }
.hcard p { margin: .5mm 0 1mm; }
.legal { font-size: .82em; color: #5a6a70; margin-top: 2mm; }
`;

(async () => {
  if (!CHROME) throw new Error('Chrome / Edge not found');
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(BUILD, { recursive: true }); fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  let failed = false;
  for (const L of ['hi', 'en']) {
    const htmlFile = path.join(BUILD, `starter-pack-${L}.html`);
    fs.writeFileSync(htmlFile, build(L));
    const ctx = await browser.newContext({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file:///' + htmlFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 60000 }).catch(e => errs.push('load: ' + e.message.split('\n')[0]));
    const fonts = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight).slice(0, 6); });
    await page.evaluate(() => window.__fit());
    const report = await page.evaluate(() => window.__fitReport);
    const bad = report.filter(r => r.overflow > 1);
    console.log(`${L}: fonts ${fonts.length ? [...new Set(fonts)].join(', ') : 'system (offline?)'}; page scales ${report.map(r => r.scale).join(' ')}`);
    if (bad.length) { failed = true; console.log(`  OVERFLOW on page(s) ${bad.map(b => b.page + ' (+' + b.overflow + 'px)').join(', ')}`); }
    if (errs.length) { failed = true; console.log('  errors: ' + errs.join(' | ')); }
    /* page previews for checking */
    const pages = await page.$$('.page');
    for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: path.join(SHOTS, `${L}-p${i + 1}.png`) });
    await page.emulateMedia({ media: 'print' });
    const out = path.join(OUT, `ai-classroom-starter-pack-${L}.pdf`);
    await page.pdf({ path: out + '.tmp', format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
    fs.renameSync(out + '.tmp', out);
    console.log(`  → ${path.relative(ROOT, out)} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
    await ctx.close();
  }
  await browser.close();
  if (failed) { console.log('FAIL: fix the overflow / errors above'); process.exit(1); }
  console.log('done; previews in tools/shots/starter-pack/');
})().catch(e => { console.error(e); process.exit(1); });
