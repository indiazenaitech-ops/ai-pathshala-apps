/* Password Strength Lab: language-neutral data (word lists, common passwords, quiz pairs).
   Everything here is used on the device only. Lists are lower-case and space-separated to keep the file small. */
window.PW_DATA = {
  /* About 200 of the most common passwords, roughly in order of popularity, including ones that are very
     common in Indian password leaks. Rank in this list = number of guesses an attacker needs. */
  common: (
    '123456 password 12345678 qwerty 123456789 12345 1234 111111 1234567 123123 password@123 india123 password123 ' +
    'abc123 iloveyou 1234567890 000000 qwerty123 india@123 admin 123321 654321 666666 121212 7777777 112233 ' +
    'welcome 123qwe 1qaz2wsx qazwsx 1q2w3e4r 1q2w3e asdfgh zxcvbnm qwertyuiop asdfghjkl zxcvbn qwerty@123 ' +
    'admin123 admin@123 pass@123 pass123 welcome123 welcome@123 hello123 hello@123 test123 test@123 abcd1234 ' +
    'abcd@1234 1234abcd 123456a a123456 iloveu iloveyou123 ilovemyindia jaihind jaihind123 bharat bharat123 ' +
    'hindustan india indian india2024 india1947 jaishreeram jaimatadi omsairam saibaba radhekrishna radheradhe ' +
    'harharmahadev ganpati krishna123 sairam ram123 786786 9876543210 0987654321 147258369 147258 159357 ' +
    '159753 789456123 789456 456789 102030 010203 012345 11111111 00000000 99999999 88888888 1111 0000 2580 ' +
    'dragon monkey letmein football baseball shadow master sunshine princess superman batman trustno1 michael ' +
    'jordan charlie freedom whatever starwars cricket cricket123 sachin sachin10 dhoni dhoni7 msdhoni virat18 ' +
    'kohli18 rohit45 mumbaiindians chennaisuperkings csk123 rcb123 love lovely loveyou mylove sweetheart babu ' +
    'sonu monu pinky chotu golu cutie angel secret computer internet google facebook whatsapp instagram samsung ' +
    'nokia apple iphone android mobile wifi password1 password12 passw0rd p@ssw0rd p@ssword pa55word qwerty1 ' +
    'qwerty12 abc@123 abcdef abcdefg abcdefgh asdf1234 zaq12wsx 1qaz@wsx qwe123 asd123 zxc123 aaaaaa aaaaaaaa ' +
    '123abc abc12345 a1b2c3 a1b2c3d4 12qwaszx 123asd guest user login demo test root default changeme hello ' +
    'namaste namaskar rahul123 priya123 pooja123 amit123 neha123 ganesh123 mahadev bholenath hanuman ' +
    'jaihanuman mother father family friends happy lucky sweety baby killer hunter soccer summer ginger ' +
    'flower tiger mustang pepper cheese orange banana purple silver golden diamond rockstar superstar ' +
    'champion legend king queen boss smile forever 12341234 123654 a1234567 qwerty123456 1q2w3e4r5t ' +
    'qazwsxedc 999999 555555 222222 333333 444444 888888 987654 123654789 asdfasdf'
  ).split(' '),

  /* Simple English words for passphrases (and for spotting words inside passwords). */
  en: (
    'ant bat bear bee bird bison buffalo bull camel cat cheetah chick cobra cow crab crane crow deer dog dolphin ' +
    'donkey dove duck eagle eel elephant falcon fish fox frog gecko goat goose gorilla hawk hen heron horse hippo ' +
    'jackal kitten koala lamb leopard lion lizard llama mole moose moth mouse mule octopus otter owl ox panda ' +
    'parrot peacock pelican penguin pig pigeon pony puppy rabbit rat rhino robin seal shark sheep snail snake ' +
    'sparrow spider squid swan toad tortoise turkey turtle walrus whale wolf worm yak zebra beetle bunny camel ' +
    'apple apricot berry cherry coconut date fig grape guava jackfruit kiwi lemon lime lychee melon papaya peach ' +
    'pear plum pumpkin raisin tomato potato onion carrot cabbage pea bean corn rice wheat bread butter honey jam ' +
    'juice milk tea coffee sugar salt ginger garlic biscuit cake candy cookie noodle pizza soup toast waffle pie ' +
    'muffin popcorn mint peanut almond cashew walnut olive radish spinach yogurt pickle pancake sandwich ' +
    'mango orchid daisy jasmine marigold hibiscus cedar maple pine oak bamboo fern moss ivy willow cocoa vanilla ' +
    'nutmeg cumin saffron lentil pudding custard sherbet porridge omelette dumpling basil thyme parsley celery ' +
    'broccoli turnip beetroot avocado blueberry cucumber gourd okra pistachio caramel toffee ' +
    'red blue green yellow pink brown black white grey violet indigo maroon beige cream teal amber ' +
    'sky sun moon star cloud rain snow wind storm river lake sea ocean pond hill mountain valley forest jungle ' +
    'desert island beach sand stone rock leaf tree rose lotus grass seed root branch garden meadow field cave ' +
    'volcano wave tide shell pearl coral rainbow thunder fog dew frost spring autumn winter dawn dusk sunset ' +
    'breeze blossom pebble glacier canyon comet galaxy planet orbit meteor horizon iceberg oasis puddle ' +
    'bag ball bell book bottle box brick broom brush bucket button cable camera candle cap chair chalk clock ' +
    'coin comb cup curtain desk door drum fan flag fork glass globe glove hammer hat helmet jar kettle key kite ' +
    'ladder lamp lantern lock magnet map marble mat mirror mug nail needle net notebook oven paint pan paper pen ' +
    'pencil pillow pipe plate pot quilt radio ribbon ring rope ruler scale shelf shoe sock sofa spoon stamp ' +
    'stool string table teapot tent thread ticket torch towel toy tray trunk umbrella vase wallet watch wheel ' +
    'whistle window wire anchor arrow badge balloon banner basket blanket bubble cabin cactus canvas carpet ' +
    'castle circle compass cotton crayon crown crystal feather flute harp hammock igloo jelly jigsaw kayak lens ' +
    'mosaic nest paddle palm parade piano picnic pocket puzzle quartz riddle robot saddle sketch spice spiral ' +
    'sponge sprout stripe summit sunflower thimble tulip tunnel velvet violin voyage zipper button cushion ' +
    'bicycle boat bus car cart ferry jeep rocket scooter ship train tractor truck van wagon yacht sled raft canoe ' +
    'school library market park farm village city town bridge tower palace station airport harbour road street ' +
    'lane kitchen room house hut museum circus stadium bakery attic balcony porch fountain lighthouse ' +
    'baker barber driver farmer pilot poet potter sailor singer tailor teacher doctor nurse painter dancer ' +
    'artist chef guard builder plumber gardener ' +
    'jump run walk swim fly sing dance read write draw cook bake laugh dream sleep climb throw catch kick push ' +
    'pull open close build carry clap count dig drink eat fix float grow hide hop hug knit learn listen look ' +
    'march mix nap play race ride roll sail shake shine skip slide spin splash stir swing talk think travel wink ' +
    'whisper giggle juggle paddle wander ' +
    'big small tall short sunny rainy windy cloudy brave calm clever cool cosy crisp curly early easy fancy fast ' +
    'fluffy fresh funny gentle giant glad grand heavy huge jolly kind lazy little merry mighty neat noisy proud ' +
    'quick quiet rapid rich round royal shiny silly simple sleepy slow smart smooth soft sour spicy sticky strong ' +
    'sweet tiny warm wild wise witty young bright busy chilly cheerful dizzy eager fuzzy hungry polite tidy ' +
    'chess carrom hockey tennis kabaddi golf goal wicket match team medal trophy cycle kite swing ' +
    'atom pixel signal laptop rocket satellite magnet engine motor battery bulb switch socket screen keyboard ' +
    'mouse printer cable modem router sensor gadget turbo robot echo shadowy marble sparkle twinkle glitter ' +
    'cloudy misty frosty breezy stormy dusty muddy sandy rocky grassy leafy snowy'
  ).split(' '),

  /* Simple Hindi words in Roman letters (as people type them on phones). */
  hi: (
    'ghar pani aam kitab chai dost sapna suraj chanda tara badal barish phool ped patta nadi pahad samundar hawa ' +
    'mitti aasman kheti gaon shahar sadak rasta bazaar mela diya rang geet kahani khel gend patang haathi sher ' +
    'bandar kutta billi gaay ghoda oont hiran tota maina mor koyal machli titli chidiya kela seb angoor santra ' +
    'nimbu aloo gajar mooli tamatar roti chawal daal sabzi laddoo jalebi kheer halwa lassi doodh dahi makkhan ' +
    'paneer namak cheeni mirchi adrak haldi jeera kalam kagaz basta kursi mez khidki darwaza deewar chhat seedhi ' +
    'chabi taala ghadi chashma joota topi kurta saree pankha batti bistar takiya kambal chadar bagicha kamal ' +
    'gulab champa chameli neem peepal bargad jamun imli subah dopahar shaam raat din hafta mahina saal lal peela ' +
    'neela hara kala safed gulabi naya purana bada chhota lamba mota patla meetha khatta teekha garam thanda ' +
    'sundar saaf tez dheema khush thali katori chammach gilas lota matka balti jhola chappal chhata rassi sui ' +
    'dhaga kainchi hathoda keel thaila tokri dibba botal sheesha kangha sabun tauliya dhoop chhaon toofan bijli ' +
    'kohra jharna talab kuan khet bagh ret patthar sona chandi loha tamba pital kaanch bakri bhains khargosh ' +
    'chuha saanp kachhua magarmach bhalu lomdi bhediya cheel kauwa kabootar bagula batakh murga murgi chooza ' +
    'ullu baaz jugnu makdi cheenti tidda puri kachori samosa pakoda dhokla idli dosa upma poha paratha khichdi ' +
    'biryani raita achar papad chutney barfi peda rasgulla kulfi falooda sharbat nariyal kaju badam kishmish ' +
    'pista akhrot moongphali gud shahad ghee atta besan maida suji chaupal haveli mahal qila pul nagar kasba ' +
    'mohalla aangan rasoi chalna daudna khelna padhna likhna gaana nachna hasna udna tairna koodna bolna sunna ' +
    'dekhna sochna mazedar chamkila rangeen sunehra halka bhari naram gol chauda gehra ooncha neecha nanha ' +
    'dosti hansi tyohaar rangoli paheli sangeet dhol tabla sitar bansuri ghungroo garmi sardi barsaat patjhad ' +
    'haath pair aankh naak kaan baal kapda dupatta pagdi jhoola gubbara khilona lattu kanche gilli danda ' +
    'naav jahaz rail gaadi pahiya tanga rickshaw cycle bailgaadi sitara chaand dharti jungle pahadi ' +
    'pyaas bhookh neend sapne khidkiyan tasveer chitthi dak khat akhbaar pustak kavita gana dhun ' +
    'chandan kesar elaichi laung dalchini saunf ajwain methi palak bhindi baingan lauki karela matar ' +
    'mooli shakarkandi bhutta chana rajma kadhi pulao thandai jaljeera nimbupani golgappa chaat mera tera apna ' +
    'hamara pyaar zindagi duniya'
  ).split(' '),

  /* Common first names, surnames, nicknames and famous people: attackers' favourite guesses. */
  names: (
    'aarav aditya akash amit anil anita anjali ankit anu arjun arun asha ashok ayesha bhavna deepak deepika dev ' +
    'dinesh divya ganesh gaurav geeta gopal hari harish isha jaya karan kavita kiran krishna kumar lakshmi lata ' +
    'madhu mahesh manish manoj meena mohan mohit muskan nandini neha nikhil nisha pooja prakash pradeep pramod ' +
    'prem priya priyanka rahul raj raja rajesh rajni rakesh ram ramesh rani ravi rekha riya rohit sachin sanjay ' +
    'santosh sarita seema shalini shanti sharma shiv shivam shreya shweta simran sneha sonia sonu suman sunil ' +
    'sunita suresh swati tanvi tarun uma usha varun vijay vikas vikram vinod virat vishal yash zara arif farhan ' +
    'imran salman shahrukh aamir sana fatima ali hussain javed nadia rehan zoya gurpreet harpreet manpreet ' +
    'jaspreet balwinder jose mary john thomas joseph anthony francis george paul peter grace venkat srinivas ' +
    'ramya karthik prasad murali balaji siva saravanan vignesh gayathri keerthi lavanya anusha kavya harini deepa ' +
    'meera radha sita gita subhash sourav arijit ananya rupa tanmoy singh sharma verma gupta patel shah mehta ' +
    'joshi iyer nair reddy rao das dutta bose ghosh khan ansari yadav mishra pandey tiwari chauhan dhoni kohli ' +
    'tendulkar bumrah amitabh hrithik ranbir alia katrina tommy moti sheru bholu kalu chintu pinky bunty babli ' +
    'golu chotu monu bittu pappu guddu tinku raju shivani aryan ishaan kabir vivaan reyansh saanvi aadhya diya ' +
    'myra anika kiara aisha ishita kunal rishabh sahil sameer tushar abhishek akshay ajay sunny vicky'
  ).split(' '),

  /* Indian places (cities, states, rivers): also tried early by attackers. */
  places: (
    'india bharat hindustan delhi newdelhi mumbai bombay kolkata calcutta chennai madras bengaluru bangalore ' +
    'hyderabad pune ahmedabad surat jaipur lucknow kanpur nagpur indore bhopal patna ranchi raipur bhubaneswar ' +
    'cuttack guwahati shillong imphal agartala aizawl kohima itanagar gangtok dehradun shimla chandigarh amritsar ' +
    'ludhiana jalandhar srinagar jammu leh ladakh kashmir punjab haryana rajasthan gujarat maharashtra goa ' +
    'karnataka kerala tamilnadu andhra telangana odisha orissa bihar jharkhand bengal assam sikkim manipur ' +
    'mizoram nagaland tripura meghalaya uttarakhand himachal kochi cochin trivandrum madurai coimbatore mysore ' +
    'mysuru mangalore vizag varanasi kashi prayagraj allahabad agra mathura vrindavan ayodhya haridwar rishikesh ' +
    'ujjain nashik aurangabad thane noida gurgaon gurugram ghaziabad faridabad meerut ganga yamuna himalaya'
  ).split(' '),

  /* Famous dates in Indian history (DDMMYYYY). */
  famousDates: ['15081947', '26011950', '02101869', '14111889', '26111949'],

  /* Quiz: which is stronger? win = the stronger side. The app re-checks every pair with its own estimator. */
  pairs: [
    { id: 'p1', a: 'india@123', b: 'mango-tiger-cloud-lamp', win: 'b' },
    { id: 'p2', a: 'kR7#pW2q', b: 'Rahul2008', win: 'a' },
    { id: 'p3', a: 'qwertyuiop', b: 'kettle-violin-meadow-sock', win: 'b' },
    { id: 'p4', a: 'purple camel sings softly', b: 'P@ssw0rd123', win: 'a' },
    { id: 'p5', a: '15081947', b: 'x9m2q7kt', win: 'b' },
    { id: 'p6', a: 'Gj4@kL', b: 'abcdefgh12345678', win: 'a' },
    { id: 'p7', a: 'Krishna@2024', b: 'krishna-kite-ladder-moon', win: 'b' },
    { id: 'p8', a: 'rainy tulip oven bridge', b: '9450718263', win: 'a' },
    { id: 'p9', a: 'drowssap', b: 'q7Lm2xRt', win: 'b' },
    { id: 'p10', a: 'jar-pencil-otter-sky-lamp-91', b: 'SachinTendulkar10', win: 'a' },
    { id: 'p11', a: 'Ab1@Ab1@Ab1@', b: 'glass-hippo-ribbon-tea', win: 'b' },
    { id: 'p12', a: 'Mumbai@1234', b: 'Kh9#mQ2v!xL7', win: 'b' }
  ]
};
