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
["hi","bn","mr","gu","pa","or","ta","te","kn","ml","ur"].forEach(function(l){window.APP_CONTENT[l]=window.APP_CONTENT.en;});
