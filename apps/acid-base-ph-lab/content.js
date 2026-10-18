/* Acids, Bases & pH Lab: localized content (same shape in all 12 languages).
   facts: one line per substance · ind_why: one line per indicator · stories, uses, daily, quiz: see app.js */
window.APP_CONTENT = {
  en: {
    facts: {
      hcl: 'A strong laboratory acid. Even a dilute solution is dangerous: never touch or taste it.',
      gastric: 'Our stomach makes hydrochloric acid to digest food and kill germs.',
      lemon: 'Sour because of citric acid. Rich in vitamin C.',
      softdrink: 'Contains carbonic and phosphoric acid. That is why it harms teeth.',
      vinegar: 'A dilute solution of acetic (ethanoic) acid, used in pickles.',
      tomato: 'Mildly acidic because of citric and malic acid.',
      curd: 'Lactic acid made by bacteria turns milk sour and sets it into curd.',
      coffee: 'Black coffee without milk is mildly acidic.',
      tea: 'Tannic acid gives tea its slightly bitter, puckering taste.',
      rain: 'Clean rain is slightly acidic because CO₂ from the air dissolves in it. Below 5.6 it is called acid rain.',
      milk: 'Fresh milk is very slightly acidic. As it goes sour, its pH falls.',
      saliva: 'Saliva is close to neutral. After a sugary snack, bacteria make acid and the pH in the mouth drops.',
      water: 'Pure water is neutral: equal numbers of H⁺ and OH⁻ ions.',
      blood: 'Our blood stays between pH 7.35 and 7.45. Our body works hard to keep it there.',
      seawater: 'Slightly basic because of dissolved salts and carbonates.',
      bakingsoda: 'Sodium hydrogencarbonate (NaHCO₃), a mild base used in cooking and antacids.',
      toothpaste: 'Basic, so it neutralises the acid made by bacteria in the mouth.',
      antacid: 'Antacid tablets contain mild bases that neutralise extra stomach acid.',
      soap: 'Soap is made from oil and a strong base, so soap water is basic and feels slippery.',
      magnesia: 'A suspension of magnesium hydroxide, Mg(OH)₂, used as an antacid.',
      ammonia: 'Ammonia dissolved in water is basic and has a sharp smell. Used in some cleaners.',
      limewater: 'Calcium hydroxide, Ca(OH)₂, in water. It turns milky when CO₂ is bubbled through it.',
      bleach: 'Household bleach is strongly basic and corrosive. Handle with gloves.',
      naoh: 'Caustic soda: a strong base used to make soap and paper. Very corrosive.'
    },
    ind_why: {
      blue_litmus: 'Litmus is a natural dye from lichens. Acids turn blue litmus red; bases and neutral solutions leave it blue.',
      red_litmus: 'Bases turn red litmus blue. Acids and neutral solutions leave it red.',
      turmeric: 'Turmeric (haldi) is yellow in acids and neutral solutions, and turns red in bases. That is why a turmeric stain turns red when soap touches it.',
      phenolphthalein: 'Phenolphthalein is colourless in acids and neutral solutions, and pink in bases (from about pH 8.2).',
      methyl_orange: 'Methyl orange is red in strong acids (below pH 3.1), orange in between, and yellow above pH 4.4.',
      universal: 'Universal indicator is a mixture of dyes. It shows a different colour for each pH: red for strong acids, green for neutral, violet for strong bases.',
      china_rose: 'China rose (gudhal) petals give a natural indicator: it turns acids dark pink and bases green.'
    },
    stories: [
      { title: 'Antacid vs stomach acid', emoji: '💊',
        text: 'Our stomach makes hydrochloric acid (pH about 1.2) to digest food. Too much acid causes pain and burning (acidity). An antacid such as milk of magnesia, Mg(OH)₂, is a mild base: it neutralises the extra acid and the pain goes away.',
        eq: 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O', before: 1.2, after: 4, beforeLabel: 'too much acid', afterLabel: 'after the antacid' },
      { title: 'Bee sting vs baking soda', emoji: '🐝',
        text: 'A bee sting injects methanoic (formic) acid into the skin, which burns. Rubbing a paste of baking soda, a mild base, neutralises the acid and gives relief. A wasp sting is basic, so for that people use a mild acid like vinegar.',
        eq: 'HCOOH + NaHCO₃ → HCOONa + H₂O + CO₂', before: 3, after: 7, beforeLabel: 'sting (acid)', afterLabel: 'after baking soda' }
    ],
    uses: {
      common_salt: { name: 'Common salt', made: 'From sea water by evaporation, or dug out as rock salt. It is the raw material for sodium hydroxide, baking soda, washing soda and bleaching powder (chlor-alkali process: 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂).',
        uses: ['Cooking and preserving food (pickles, papad)', 'Making NaOH, baking soda, washing soda and bleaching powder', 'Keeping roads ice-free in cold countries'] },
      washing_soda: { name: 'Washing soda', made: 'Baking soda is heated to give sodium carbonate; crystallising it with water gives washing soda: Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O.',
        uses: ['Making glass, soap and paper', 'Removing the permanent hardness of water', 'Cleaning agent for homes'] },
      baking_soda: { name: 'Baking soda', made: 'From common salt: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃. On heating it gives CO₂: 2NaHCO₃ → Na₂CO₃ + H₂O + CO₂.',
        uses: ['Baking powder makes cakes and bread soft (CO₂ bubbles)', 'An antacid for acidity', 'Soda-acid fire extinguishers'] },
      bleaching_powder: { name: 'Bleaching powder', made: 'Chlorine gas acts on dry slaked lime: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O.',
        uses: ['Bleaching cotton, linen and paper', 'Disinfecting drinking water', 'An oxidising agent in chemical industries'] },
      plaster_of_paris: { name: 'Plaster of Paris', made: 'Gypsum is heated to 373 K (100 °C): CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O. Mixed with water, it sets back into hard gypsum.',
        uses: ['Supporting fractured bones in the right position', 'Toys, decoration pieces and statues', 'Smoothing walls and ceilings'] }
    },
    daily: [
      { icon: '🦷', title: 'Tooth decay', tag: 'below pH 5.5', text: 'Bacteria in the mouth turn leftover sugar into acid. When the pH in the mouth falls below 5.5, the enamel (the hardest substance in the body) starts to dissolve. Toothpaste is basic and neutralises this acid, so brush after meals.' },
      { icon: '🌧️', title: 'Acid rain', tag: 'below pH 5.6', text: 'Smoke from vehicles and factories adds oxides of sulphur and nitrogen to the air. They dissolve in rain and make it acidic. Acid rain harms fish in rivers, damages crops, and eats away marble buildings like the Taj Mahal.' },
      { icon: '🌱', title: 'Soil pH and crops', tag: 'best: pH 6.5 to 7.5', text: 'Most plants grow best in soil that is close to neutral. If the soil is too acidic, farmers add quick lime (CaO), slaked lime (Ca(OH)₂) or chalk (CaCO₃). If it is too basic, they add organic matter such as compost.' },
      { icon: '🐝', title: 'Self-defence with acids and bases', tag: 'stings', text: 'A bee or an ant sting injects methanoic acid: rub baking soda. Nettle leaves also inject methanoic acid: the dock plant that often grows nearby gives relief. A wasp sting is basic: use vinegar.' },
      { icon: '🫃', title: 'Digestion and acidity', tag: 'stomach: pH 1.2', text: 'The stomach makes hydrochloric acid to digest food. When too much is made we feel burning and pain. Antacids such as milk of magnesia or baking soda are mild bases that neutralise the extra acid.' },
      { icon: '🩸', title: 'Our body likes a narrow range', tag: 'blood: pH 7.35 to 7.45', text: 'Living cells work only in a narrow pH range. Our blood stays very close to 7.4; even a small change makes us ill. That is why doctors check blood pH in serious illness.' }
    ],
    quiz: [
      { q: 'Which colour does blue litmus paper turn when dipped in lemon juice?', options: ['Blue (no change)', 'Red', 'Green', 'Yellow'], why: 'Lemon juice is acidic (pH about 2). Acids turn blue litmus red.' },
      { q: 'What is the pH of pure water at 25 °C?', options: ['0', '7', '14', '1'], why: 'Pure water is neutral. It has equal numbers of H⁺ and OH⁻ ions, so its pH is 7.' },
      { q: 'Which of these solutions is the most acidic?', options: ['pH 3', 'pH 6', 'pH 8', 'pH 7'], why: 'The lower the pH, the more acidic the solution. pH 3 has 1000 times more H⁺ ions than pH 6.' },
      { q: 'A solution of pH 4 has how many times more H⁺ ions than a solution of pH 5?', options: ['2 times', '10 times', '100 times', 'Half as many'], why: 'Each step of 1 on the pH scale is a factor of 10 in H⁺ concentration. pH 4 → 10⁻⁴ mol/L; pH 5 → 10⁻⁵ mol/L.' },
      { q: 'What colour is phenolphthalein in a sodium hydroxide (NaOH) solution?', options: ['Colourless', 'Pink', 'Yellow', 'Red'], why: 'Phenolphthalein is colourless in acid and turns pink in a base. NaOH is a strong base.' },
      { q: 'A turmeric stain on a shirt turns red when soap is rubbed on it. This shows that soap is', options: ['acidic', 'neutral', 'basic', 'a salt'], why: 'Turmeric is a natural indicator: it stays yellow in acids and neutral solutions but turns red in bases. Soap is basic.' },
      { q: 'Tooth decay starts when the pH in the mouth falls below', options: ['5.5', '7', '8.5', '2'], why: 'Tooth enamel begins to dissolve below pH 5.5. Bacteria make this acid from leftover sugar.' },
      { q: 'Rain is called acid rain when its pH is below', options: ['7', '5.6', '6.5', '3'], why: 'Normal rain is slightly acidic (about 5.6) because of dissolved CO₂. Below 5.6 it is acid rain, caused by oxides of sulphur and nitrogen.' },
      { q: 'An antacid such as milk of magnesia gives relief from acidity because it', options: ['adds more acid to the stomach', 'neutralises the extra acid in the stomach', 'cools the stomach', 'removes water from the stomach'], why: 'Milk of magnesia, Mg(OH)₂, is a mild base. It neutralises the extra hydrochloric acid in the stomach.' },
      { q: 'A bee sting hurts because it injects an acid. Which household item rubbed on the sting gives relief?', options: ['Vinegar', 'Lemon juice', 'Baking soda', 'Salt'], why: 'The sting injects methanoic acid. Baking soda is a mild base that neutralises it. Vinegar and lemon juice are acids and would not help.' },
      { q: 'Common salt (NaCl) is formed from a strong acid (HCl) and a strong base (NaOH). Its solution in water is', options: ['acidic', 'basic', 'neutral', 'sometimes acidic, sometimes basic'], why: 'When both parents are strong, neither wins: the salt solution is neutral, pH 7.' },
      { q: 'Ammonium chloride (NH₄Cl) solution is acidic because it is made from', options: ['a strong acid and a weak base', 'a weak acid and a strong base', 'a strong acid and a strong base', 'a weak acid and a weak base'], why: 'HCl is a strong acid and NH₄OH is a weak base. The strong parent wins, so the salt is acidic.' },
      { q: 'HCl + NaOH → ___ + H₂O. The missing product is', options: ['NaCl', 'Na₂CO₃', 'NaHCO₃', 'Cl₂'], why: 'Neutralisation: acid + base → salt + water. Hydrochloric acid and sodium hydroxide give sodium chloride (common salt) and water.' },
      { q: 'Plaster of Paris is made by heating', options: ['common salt', 'gypsum', 'limestone', 'baking soda'], why: 'Gypsum (CaSO₄·2H₂O) heated to 373 K loses water and becomes plaster of Paris, CaSO₄·½H₂O.' },
      { q: 'Universal indicator added to a solution turns green. The solution is', options: ['strongly acidic', 'neutral (pH about 7)', 'strongly basic', 'pH 2'], why: 'On the universal indicator chart, green means pH 7, neutral. Red means strongly acidic and violet means strongly basic.' }
    ]
  }
};
