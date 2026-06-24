export type ChallengeType = "dialogue" | "pyramid" | "finish" | "actor";
export type Difficulty = "easy" | "medium" | "hard";

export type Challenge = {
  question_id: string;
  content_id: string;
  dedupe_keys: string[];
  type: ChallengeType;
  difficulty: Difficulty;
  quality_score: number;
  tags: string[];
  prompt: string;
  question: string;
  options: string[];
  answer: string;
  fact: string;
  emoji: string;
  points: number;
  clues?: string[];
};

const inferDifficulty = (text: string): Difficulty => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return words <= 3 ? "easy" : words <= 7 ? "medium" : "hard";
};

const dialogue = (
  content_id: string, movieKey: string, question: string, answer: string,
  options: string[], fact: string, emoji = "🎬",
): Challenge => ({
  question_id: `${content_id}::dialogue`, content_id,
  dedupe_keys: [`movie:${movieKey}`, `dialogue:${content_id}`], type: "dialogue",
  difficulty: inferDifficulty(question), quality_score: 1, tags: ["curated", `movie:${movieKey}`],
  prompt: "NAME THE MOVIE", question, options, answer, fact, emoji, points: 700,
});

const finish = (
  content_id: string, movieKey: string, question: string, answer: string,
  options: string[], fact: string, emoji = "✨",
): Challenge => ({
  question_id: `${content_id}::finish`, content_id,
  dedupe_keys: [`movie:${movieKey}`, `dialogue:${content_id}`], type: "finish",
  difficulty: inferDifficulty(answer), quality_score: 1, tags: ["curated", `movie:${movieKey}`],
  prompt: "FINISH THE ICONIC LINE", question, options, answer, fact, emoji, points: 650,
});

const actor = (
  content_id: string, movieKey: string, question: string, answer: string,
  options: string[], fact: string, emoji = "⭐",
): Challenge => ({
  question_id: `${content_id}::actor`,
  content_id,
  dedupe_keys: [
    `movie:${movieKey}`,
    `actor:${answer.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
    `actor-clue:${content_id}`,
  ],
  type: "actor",
  difficulty: inferDifficulty(question), quality_score: 1,
  tags: ["curated", `movie:${movieKey}`, `actor:${answer.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`],
  prompt: "WHO SAID IT?", question, options, answer, fact, emoji, points: 650,
});

const pyramid = (
  content_id: string, movieKey: string, clues: string[], answer: string,
  options: string[], fact: string, emoji = "🔺",
): Challenge => ({
  question_id: `${content_id}::pyramid`, content_id,
  dedupe_keys: [`movie:${movieKey}`, `movie-clue:${content_id}`], type: "pyramid",
  difficulty: clues.length >= 4 ? "easy" : "medium", quality_score: 1,
  tags: ["curated", `movie:${movieKey}`],
  prompt: "GUESS THE MOVIE", question: "Which Bollywood film connects these clues?", clues,
  options, answer, fact, emoji, points: 1000,
});

export const CHALLENGES: Challenge[] = [
  dialogue("OSO_001", "om-shanti-om", "“Picture abhi baaki hai, mere dost.”", "Om Shanti Om", ["Om Shanti Om", "Main Hoon Na", "Happy New Year", "Fan"], "This 2007 reincarnation saga celebrated Bollywood itself."),
  dialogue("3IDIOTS_001", "3-idiots", "“All is well.”", "3 Idiots", ["3 Idiots", "PK", "Taare Zameen Par", "Chhichhore"], "The phrase became one of Hindi cinema's most memorable refrains.", "🎓"),
  dialogue("URI_001", "uri", "“How's the josh?”", "Uri", ["Uri", "Shershaah", "Lakshya", "Raazi"], "The expected answer? High, sir!", "⚡"),
  dialogue("DANGAL_001", "dangal", "“Mhari chhoriyan chhoron se kam hain ke?”", "Dangal", ["Dangal", "Sultan", "Chak De! India", "Mary Kom"], "A father's challenge became the heart of this wrestling drama.", "🥇"),
  dialogue("K3G_001", "kabhi-khushi-kabhie-gham", "“Keh diya na, bas keh diya.”", "Kabhi Khushi Kabhie Gham", ["Kabhi Khushi Kabhie Gham", "Kal Ho Naa Ho", "Mohabbatein", "Veer-Zaara"], "A family drama remembered for its enormous emotions."),
  dialogue("CHAKDE_001", "chak-de-india", "“Sattar minute.”", "Chak De! India", ["Chak De! India", "Lagaan", "Dangal", "Sultan"], "Coach Kabir Khan's team talk became a sporting-cinema classic.", "🏑"),
  dialogue("DABANGG_001", "dabangg", "“Hum tum mein itne chhed karenge...”", "Dabangg", ["Dabangg", "Wanted", "Kick", "Bodyguard"], "Chulbul Pandey arrived with swagger in 2010.", "🔥"),
  dialogue("SINGHAM_001", "singham", "“Aata majhi satakli.”", "Singham", ["Singham", "Simmba", "Sooryavanshi", "Drishyam"], "The line became synonymous with Bajirao Singham.", "🦁"),
  dialogue("RAEES_001", "raees", "“Koi dhanda chhota nahi hota.”", "Raees", ["Raees", "Don", "Pathaan", "Fan"], "The 2017 crime drama paired ambition with consequence."),
  dialogue("BAJIRAO_001", "bajirao-mastani", "“Bajirao ne Mastani se mohabbat ki hai.”", "Bajirao Mastani", ["Bajirao Mastani", "Padmaavat", "Ram-Leela", "Jodhaa Akbar"], "A sweeping historical romance released in 2015.", "⚔️"),
  dialogue("GOW_001", "gangs-of-wasseypur", "“Beta, tumse na ho payega.”", "Gangs of Wasseypur", ["Gangs of Wasseypur", "Sacred Games", "Omkara", "Company"], "The two-part crime epic became a cult phenomenon."),
  dialogue("OUTIM_001", "once-upon-a-time-in-mumbai", "“Dua mein yaad rakhna.”", "Once Upon a Time in Mumbaai", ["Once Upon a Time in Mumbaai", "Shootout at Lokhandwala", "Company", "Raees"], "This stylized gangster drama arrived in 2010."),
  dialogue("ROCKSTAR_001", "rockstar", "“Bahar andhera hai.”", "Rockstar", ["Rockstar", "Tamasha", "Ae Dil Hai Mushkil", "Aashiqui 2"], "Music and heartbreak drive Imtiaz Ali's 2011 drama.", "🎸"),
  dialogue("TIGER_001", "tiger-zinda-hai", "“Shikaar toh sab karte hain.”", "Tiger Zinda Hai", ["Tiger Zinda Hai", "Ek Tha Tiger", "War", "Pathaan"], "Tiger returned for a rescue mission in 2017.", "🐯"),
  dialogue("PATHAAN_001", "pathaan", "“Party Pathaan ke ghar pe rakhoge...”", "Pathaan", ["Pathaan", "Jawan", "War", "Tiger 3"], "The 2023 action film launched a spectacular new chapter."),

  finish("DON_001", "don", "“Don ko pakadna mushkil hi nahi…”", "namumkin hai", ["namumkin hai", "zaroori hai", "impossible hai", "aasaan nahi"], "A classic line, reintroduced to a new generation in 2006.", "🕶️"),
  finish("WANTED_001", "wanted", "“Ek baar jo maine commitment kar di…”", "toh main khud ki bhi nahi sunta", ["toh main khud ki bhi nahi sunta", "toh game over", "phir peeche nahi dekhta", "toh baat khatam"], "The line powered one of Wanted's most crowd-pleasing moments.", "🔥"),
  finish("DDLJ_001", "ddlj", "“Bade bade deshon mein…”", "aisi chhoti chhoti baatein hoti rehti hain", ["aisi chhoti chhoti baatein hoti rehti hain", "dilwale milte rehte hain", "trains chhoot jaati hain", "pyaar hota rehta hai"], "Raj's famous reassurance remains instantly recognizable.", "🚆"),
  finish("GULLYBOY_001", "gully-boy", "“Apna time…”", "aayega", ["aayega", "ab hai", "shuru", "badlega"], "The rallying cry at the heart of Gully Boy.", "🎤"),
  finish("DEVDAS_001", "devdas", "“Kaun kambakht bardaasht karne ko…”", "peeta hai", ["peeta hai", "jeeta hai", "kehta hai", "aata hai"], "Sanjay Leela Bhansali's Devdas released in 2002."),
  finish("KOIMILGAYA_001", "koi-mil-gaya", "“Dhoop…”", "dhoop", ["dhoop", "jaadu", "taare", "roshni"], "A simple musical call helps Rohit connect with Jadoo.", "👽"),
  finish("GOLMAAL_001", "golmaal", "“Jaldi bol…”", "kal subah Panvel nikalna hai", ["kal subah Panvel nikalna hai", "picture baaki hai", "train chhoot jayegi", "boss bula raha hai"], "Golmaal launched a long-running comedy series in 2006.", "😂"),
  finish("HERAPHERI_001", "hera-pheri", "“Yeh Baburao ka…”", "style hai", ["style hai", "ghar hai", "phone hai", "plan hai"], "Baburao's comic timing made Hera Pheri evergreen.", "☎️"),
  finish("WELCOME_001", "welcome", "“Control…”", "Uday, control", ["Uday, control", "Majnu, control", "your anger", "the situation"], "The ensemble comedy is packed with repeatable lines.", "🎨"),
  finish("CHENNAIEXPRESS_001", "chennai-express", "“Don't underestimate the power of…”", "a common man", ["a common man", "true love", "the train", "Meenamma"], "Chennai Express blended action, romance, and comedy.", "🚂"),
  finish("AGNEEPATH_001", "agneepath", "“Poora naam…”", "Vijay Dinanath Chauhan", ["Vijay Dinanath Chauhan", "Kancha Cheena", "Rauf Lala", "Vijay Chauhan"], "The 2012 remake gave the introduction new intensity."),
  finish("LAGERAHO_001", "lage-raho-munna-bhai", "“Get well…”", "soon", ["soon", "today", "Munna", "Circuit"], "Gandhigiri entered pop culture through this 2006 sequel.", "🌼"),
  finish("BARFI_001", "barfi", "“Life mein sabse bada risk…”", "koi risk na lena", ["koi risk na lena", "pyaar karna", "ghar chhodna", "sapna dekhna"], "Barfi! told a warm story with very few spoken words."),
  finish("QUEEN_001", "queen", "“Mera toh itna life…”", "kharab ho gaya", ["kharab ho gaya", "change ho gaya", "set ho gaya", "awesome ho gaya"], "Rani's solo trip became a story of self-discovery.", "👑"),
  finish("HOUSEFULL_001", "housefull", "“He's such a...”", "panauti", ["panauti", "genius", "superstar", "player"], "Housefull built its comedy around spectacular bad luck.", "🍀"),

  actor("3IDIOTS_002", "3-idiots", "“Aal izz well.”", "Aamir Khan", ["Aamir Khan", "Shah Rukh Khan", "Ranbir Kapoor", "Hrithik Roshan"], "Aamir played the inventive and mysterious Rancho.", "🎓"),
  actor("JABWEMET_001", "jab-we-met", "“Main apni favourite hoon.”", "Kareena Kapoor", ["Kareena Kapoor", "Deepika Padukone", "Alia Bhatt", "Priyanka Chopra"], "Geet's self-love made Jab We Met unforgettable.", "💛"),
  actor("YJHD_001", "yeh-jawaani-hai-deewani", "“Bunny, tum nahi samjhoge.”", "Deepika Padukone", ["Deepika Padukone", "Katrina Kaif", "Anushka Sharma", "Kiara Advani"], "Naina and Bunny defined a generation's travel romance.", "🏔️"),
  actor("PUSHPA_001", "pushpa", "“Jhukega nahi.”", "Allu Arjun", ["Allu Arjun", "Ranveer Singh", "Shahid Kapoor", "Ajay Devgn"], "A pan-Indian phenomenon that crossed language barriers.", "🌲"),
  actor("KHNH_001", "kal-ho-naa-ho", "“Pyaar ka pehla kadam dosti hai.”", "Shah Rukh Khan", ["Shah Rukh Khan", "Saif Ali Khan", "Aamir Khan", "Salman Khan"], "Aman brings warmth and heartbreak to Kal Ho Naa Ho."),
  actor("BAJRANGI_001", "bajrangi-bhaijaan", "“Hum Bajrangbali ke bhakt hain.”", "Salman Khan", ["Salman Khan", "Aamir Khan", "Akshay Kumar", "Ajay Devgn"], "Pavan's journey across a border anchors the 2015 drama."),
  actor("QUEEN_002", "queen", "“Mera sense of humour bahut achha hai.”", "Kangana Ranaut", ["Kangana Ranaut", "Kareena Kapoor", "Vidya Balan", "Alia Bhatt"], "Rani finds confidence during her unexpected honeymoon."),
  actor("PADMAAVAT_001", "padmaavat", "“Khuda ke bande ho ya shaitan ke?”", "Ranveer Singh", ["Ranveer Singh", "Shahid Kapoor", "Saif Ali Khan", "Hrithik Roshan"], "Ranveer played the menacing Alauddin Khilji."),
  actor("RAAZI_001", "raazi", "“Watan ke aage kuch nahi.”", "Alia Bhatt", ["Alia Bhatt", "Deepika Padukone", "Katrina Kaif", "Taapsee Pannu"], "Sehmat carries an impossible responsibility in Raazi."),
  actor("PIKU_001", "piku", "“Motion se hi emotion.”", "Deepika Padukone", ["Deepika Padukone", "Kangana Ranaut", "Anushka Sharma", "Priyanka Chopra"], "Piku balances family responsibility with her own life."),
  actor("MUNNABHAI_001", "munna-bhai-mbbs", "“Tension nahi lene ka.”", "Sanjay Dutt", ["Sanjay Dutt", "Arshad Warsi", "Boman Irani", "Paresh Rawal"], "Munna's unconventional care transformed a medical college."),
  actor("KRRISH_001", "krrish", "“Krrish ek soch hai.”", "Hrithik Roshan", ["Hrithik Roshan", "Shahid Kapoor", "John Abraham", "Vivek Oberoi"], "Krrish helped establish India's modern superhero franchise.", "🦸"),
  actor("BHOOLBHULAIYAA_001", "bhool-bhulaiyaa", "“Ami je tomar.”", "Vidya Balan", ["Vidya Balan", "Kareena Kapoor", "Rani Mukerji", "Tabu"], "Vidya's performance powered the psychological mystery."),
  actor("DRISHYAM_001", "drishyam", "“Do October ko kya hua tha?”", "Ajay Devgn", ["Ajay Devgn", "Akshay Kumar", "Irrfan Khan", "Manoj Bajpayee"], "A date becomes the key to Vijay Salgaonkar's alibi."),
  actor("NEERJA_001", "neerja", "“Zindagi badi honi chahiye.”", "Sonam Kapoor", ["Sonam Kapoor", "Anushka Sharma", "Taapsee Pannu", "Kriti Sanon"], "Sonam portrayed flight attendant Neerja Bhanot in the 2016 drama.", "✈️"),

  pyramid("ZNMD_001", "zindagi-na-milegi-dobara", ["Spain", "Road trip", "Three friends", "Tomatina"], "Zindagi Na Milegi Dobara", ["Zindagi Na Milegi Dobara", "Dil Chahta Hai", "Tamasha", "Dil Dhadakne Do"], "The 2011 road film turned travel into a lesson about living.", "🌍"),
  pyramid("DANGAL_002", "dangal", ["Wrestling", "Haryana", "Two sisters", "Gold medal"], "Dangal", ["Dangal", "Sultan", "Panga", "Chak De! India"], "It became one of Indian cinema's biggest global successes.", "🤼"),
  pyramid("PK_001", "pk", ["Alien", "Radio", "Rajasthan", "Wrong number"], "PK", ["PK", "Koi... Mil Gaya", "OMG", "Robot"], "A curious outsider asks some very human questions.", "📻"),
  pyramid("JAWAN_001", "jawan", ["Magician", "Twins", "Metro train", "Farmer"], "Jawan", ["Jawan", "Pathaan", "Ra.One", "Fan"], "A 2023 action spectacle built around justice and second chances.", "🚇"),
  pyramid("ANDHADHUN_001", "andhadhun", ["Piano", "Blindness", "Murder", "Pune"], "Andhadhun", ["Andhadhun", "Badla", "Drishyam", "Talaash"], "A pianist witnesses more than he should in this black comedy.", "🎹"),
  pyramid("TAMASHA_001", "tamasha", ["Corsica", "Storyteller", "Product manager", "Don"], "Tamasha", ["Tamasha", "Rockstar", "Jab Harry Met Sejal", "Love Aaj Kal"], "Ved's struggle between performance and identity drives Tamasha.", "🎭"),
  pyramid("KAHAANI_001", "kahaani", ["Kolkata", "Pregnancy", "Missing husband", "Durga Puja"], "Kahaani", ["Kahaani", "Badla", "Raazi", "No One Killed Jessica"], "Vidya searches Kolkata in this tightly plotted thriller."),
  pyramid("SWADES_001", "swades", ["NASA", "Village", "Electricity", "Kaveri Amma"], "Swades", ["Swades", "Lagaan", "Pardes", "Lakshya"], "Mohan's homecoming becomes a search for purpose.", "💡"),
  pyramid("LAGAAN_001", "lagaan", ["Cricket", "Tax", "Champaner", "British Raj"], "Lagaan", ["Lagaan", "Iqbal", "83", "M.S. Dhoni"], "The villagers stake their future on one cricket match.", "🏏"),
  pyramid("WAKEUPSID_001", "wake-up-sid", ["Mumbai", "Photography", "Aisha", "Monsoon"], "Wake Up Sid", ["Wake Up Sid", "Jaane Tu... Ya Jaane Na", "Tamasha", "Yeh Jawaani Hai Deewani"], "Sid grows up while discovering the city and himself.", "📷"),
  pyramid("STREE_001", "stree", ["Chanderi", "Tailor", "Festival", "O Stree Kal Aana"], "Stree", ["Stree", "Roohi", "Bhediya", "Bhool Bhulaiyaa"], "Folk horror and comedy meet in the town of Chanderi.", "👻"),
  pyramid("BADHAAIHO_001", "badhaai-ho", ["Middle-aged parents", "New baby", "Railway job", "Embarrassment"], "Badhaai Ho", ["Badhaai Ho", "Shubh Mangal Saavdhan", "Vicky Donor", "Piku"], "An unexpected pregnancy shakes up a Delhi family.", "👶"),
  pyramid("ARTICLE15_001", "article-15", ["Police officer", "Village", "Constitution", "Investigation"], "Article 15", ["Article 15", "Anek", "Mulk", "Talvar"], "A police investigation exposes entrenched inequality."),
  pyramid("BRAHMASTRA_001", "brahmastra", ["Fire", "Astras", "DJ", "Junoon"], "Brahmastra", ["Brahmastra", "Ra.One", "Krrish 3", "Shivaay"], "The fantasy adventure introduced a modern Astraverse.", "🔥"),
  pyramid("ANIMAL_001", "animal", ["Father", "Delhi", "Hotel", "Revenge"], "Animal", ["Animal", "Kabir Singh", "Badlapur", "Agneepath"], "A troubled father-son relationship drives the 2023 drama.", "🩸"),
  pyramid("UDAAN_001", "udaan", ["Poetry", "Jamshedpur", "Strict father", "Freedom"], "Udaan", ["Udaan", "Wake Up Sid", "Taare Zameen Par", "Iqbal"], "A teenager fights to choose his own future.", "🕊️"),
];
