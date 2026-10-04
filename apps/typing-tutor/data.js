/* Typing Tutor: English lesson texts and the keyboard layout.
   These are the things the student types on a standard Indian / US QWERTY keyboard, so they stay in
   English in every UI language (lesson names and all UI text come from strings.js).
   Each lesson only uses keys taught so far. goal = target speed in words per minute for 3 stars. */
window.TT_DATA = {
  stages: ['home', 'top', 'bottom', 'numbers', 'caps', 'punct', 'words', 'sentences'],
  /* how the stages are grouped on the lesson list (small stages share one heading) */
  groups: [['home'], ['top'], ['bottom'], ['numbers', 'caps', 'punct'], ['words', 'sentences']],
  lessons: [
    { id: 'l1', stage: 'home', keys: 'f j', goal: 8, texts: [
      'f j f j ff jj fj jf fff jjj fjf jfj ff jj fj jf',
      'jj ff jf fj jjf ffj fjj jff f j fj jf jjj fff',
      'fj fj jf jf fff jjj ffj jjf fjf jfj f j f j'] },
    { id: 'l2', stage: 'home', keys: 'd k', goal: 8, texts: [
      'd k d k dd kk dk kd fd jk df jk dfd kjk dk kd',
      'kd dk fdk jkd dfj kjf ddd kkk dkd kdk fk jd',
      'fdk jkd dk kd dd kk fd jk dj kf ddk kkd'] },
    { id: 'l3', stage: 'home', keys: 's l', goal: 8, texts: [
      's l s l ss ll sl ls sd lk sdf lkj fs jl sl ls',
      'ls sl sss lll sdf jkl fsd jlk dls ksl sf lj',
      'sdf jkl sdf jkl fds lkj ss ll dsl kls ds kl'] },
    { id: 'l4', stage: 'home', keys: 'a ;', goal: 10, texts: [
      'a ; a ; aa ;; a; ;a asdf jkl; asdf jkl; ask; dad;',
      'a lad; a sad lad; ask dad; all fall; add salad;',
      'a flask; dad falls; lads ask; salads; all lads;'] },
    { id: 'l5', stage: 'home', keys: 'g h', goal: 10, texts: [
      'g h g h gg hh gh hg fg jh fgf jhj gag hah',
      'has had; a glad lad; half a flask; dad has a hall;',
      'gas dash hash flag glad; flash flags; dad shall ask;'] },
    { id: 'l6', stage: 'home', keys: 'a s d f g h j k l ;', goal: 12, texts: [
      'a lad has a flask; dad shall add salad; ask a lass;',
      'all lads had half a glass; a sad lad asks dad; alas;',
      'dad has a flag; a glad lass falls; add a dash;'] },
    { id: 'l7', stage: 'top', keys: 'e i r u', goal: 10, texts: [
      'e i r u ee ii rr uu ei ie ru ur ded kik frf juj',
      'fire side ride hide desk; she said hi; a red rug;',
      'kids like fresh dahi; a huge fire; sure rules;'] },
    { id: 'l8', stage: 'top', keys: 't y w o', goal: 10, texts: [
      't y w o tt yy ww oo ty wo ot yw ftf jyj sws lol',
      'two toys; the way out; we go to the store at two;',
      'your sister wrote a story; why do dogs dig holes;'] },
    { id: 'l9', stage: 'top', keys: 'q p', goal: 12, texts: [
      'q p qq pp qp pq aqa ;p; quiet pupil paper',
      'type a quote; we play outside after the test;',
      'pour hot tea; the pupils sit quietly; a proper report;'] },
    { id: 'l10', stage: 'bottom', keys: 'v b n m', goal: 12, texts: [
      'v b n m vv bb nn mm vb nm fvf jmj fbf jnj',
      'my mother bought a new book; seven brave men;',
      'we went by bus to the museum; the van is brown;'] },
    { id: 'l11', stage: 'bottom', keys: 'c x z , . /', goal: 12, texts: [
      'c x z , . / dcd sxs aza k,k l.l ;/;',
      'six cows, a fox and a zebra live in the zoo.',
      'the box is on the bench. pick a red/blue pen.'] },
    { id: 'l12', stage: 'numbers', keys: '1 2 3 4 5 6 7 8 9 0', goal: 8, texts: [
      '1 2 3 4 5 6 7 8 9 0 10 20 30 40 50 60 70 80 90 100',
      'a year has 365 days, 12 months and 52 weeks.',
      'my roll number is 27 and my pin code is 110001.'] },
    { id: 'l13', stage: 'caps', keys: 'Shift', goal: 12, texts: [
      'India Delhi Mumbai Kolkata Chennai Jaipur Pune Patna',
      'Asha and Ravi live in Bhopal. Meena lives in Kochi.',
      'Arjun visited Agra with Sara. They saw the Taj Mahal.'] },
    { id: 'l14', stage: 'punct', keys: '! ? \' " : - ( )', goal: 12, texts: [
      'Hello, Riya! How are you? I\'m fine, thank you.',
      '"Let\'s play kho-kho," said Sameer. "Yes!" said Neha.',
      'Bring these: a pen, a ruler (30 cm) and a notebook.'] },
    { id: 'l15', stage: 'words', keys: '', goal: 15, texts: [
      'the and is in it you that was for on are with as his they at be',
      'this have from or one had by word but not what all were we when',
      'your can said there use each which she do how their if will up'] },
    { id: 'l16', stage: 'sentences', keys: '', goal: 18, texts: [
      'Rahul plays cricket with his friends every evening.',
      'Priya helps her grandmother make hot rotis for dinner.',
      'Our school bus leaves at 7:30 every morning.'] },
    { id: 'l17', stage: 'sentences', keys: '', goal: 18, texts: [
      'India has 28 states and 8 union territories. New Delhi is our capital.',
      'The Ganga is the longest river in India. It begins at the Gangotri Glacier.',
      'The tiger is our national animal and the peacock is our national bird.'] },
    { id: 'l18', stage: 'sentences', keys: '', goal: 20, texts: [
      'On 15 August every year, India celebrates Independence Day. The Prime Minister raises the flag at the Red Fort in Delhi, and children sing Jana Gana Mana.',
      'Dr. A. P. J. Abdul Kalam was a scientist and the 11th President of India. He loved to teach young students and asked them to dream big.',
      'Water is precious. Close the tap while you brush your teeth, collect rainwater, and help save every drop for tomorrow.'] }
  ],
  freeSample: 'A computer helps us write, draw, learn and talk to friends far away. When you type without looking at the keys, your thoughts flow straight to the screen. Practise a little every day and your fingers will remember the way.',
  /* keyboard rows: [normal, shifted, width, finger] ; finger codes L5 L4 L3 L2 T R2 R3 R4 R5 (5 = little finger) */
  rows: [
    [['`', '~', 1, 'L5'], ['1', '!', 1, 'L5'], ['2', '@', 1, 'L4'], ['3', '#', 1, 'L3'], ['4', '$', 1, 'L2'], ['5', '%', 1, 'L2'], ['6', '^', 1, 'R2'], ['7', '&', 1, 'R2'], ['8', '*', 1, 'R3'], ['9', '(', 1, 'R4'], ['0', ')', 1, 'R5'], ['-', '_', 1, 'R5'], ['=', '+', 1, 'R5'], ['bksp', 'Backspace', 2, 'R5']],
    [['tab', 'Tab', 1.5, 'L5'], ['q', 'Q', 1, 'L5'], ['w', 'W', 1, 'L4'], ['e', 'E', 1, 'L3'], ['r', 'R', 1, 'L2'], ['t', 'T', 1, 'L2'], ['y', 'Y', 1, 'R2'], ['u', 'U', 1, 'R2'], ['i', 'I', 1, 'R3'], ['o', 'O', 1, 'R4'], ['p', 'P', 1, 'R5'], ['[', '{', 1, 'R5'], [']', '}', 1, 'R5'], ['\\', '|', 1.5, 'R5']],
    [['caps', 'Caps', 1.75, 'L5'], ['a', 'A', 1, 'L5'], ['s', 'S', 1, 'L4'], ['d', 'D', 1, 'L3'], ['f', 'F', 1, 'L2'], ['g', 'G', 1, 'L2'], ['h', 'H', 1, 'R2'], ['j', 'J', 1, 'R2'], ['k', 'K', 1, 'R3'], ['l', 'L', 1, 'R4'], [';', ':', 1, 'R5'], ['\'', '"', 1, 'R5'], ['enter', 'Enter', 2.25, 'R5']],
    [['shiftL', 'Shift', 2.25, 'L5'], ['z', 'Z', 1, 'L5'], ['x', 'X', 1, 'L4'], ['c', 'C', 1, 'L3'], ['v', 'V', 1, 'L2'], ['b', 'B', 1, 'L2'], ['n', 'N', 1, 'R2'], ['m', 'M', 1, 'R2'], [',', '<', 1, 'R3'], ['.', '>', 1, 'R4'], ['/', '?', 1, 'R5'], ['shiftR', 'Shift', 2.75, 'R5']],
    [['gap', '', 4.5, ''], ['space', '', 6, 'T'], ['gap', '', 4.5, '']]
  ],
  homeKeys: { a: 'L5', s: 'L4', d: 'L3', f: 'L2', j: 'R2', k: 'R3', l: 'R4', ';': 'R5' }
};
