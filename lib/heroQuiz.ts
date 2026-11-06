// Homepage hero quiz: one question at a time, drawn at random from the live
// tools. It's a conversion device, not a quiz feature: questions are pitched
// so a typical aspirant gets roughly half of them right, and every answer
// (right or wrong) ends on a link into the tool that covers it.
//
// Rules for adding a question:
//   - Only ask what the linked tool actually shows. A visitor who clicks
//     through must find the answer there.
//   - Distractors come from the same family: name-twins (Minto I / II),
//     neighbouring events, sister organisations, rivals in the same region.
//   - If you can't cite a source you'd defend, leave the question out.
//   - Vary answerIndex; don't let the right answer sit in one position.
//   - `npm test` (scripts/validate-hero-quiz.mjs) checks ids, indices,
//     toolIds against lib/tools.ts and toolHrefs against app/ routes.
//
// No imports here on purpose: the validator loads this file directly with
// Node's type stripping, which doesn't resolve the "@/" path alias.

export type HeroPaper = "GS1" | "GS2" | "GS3" | "GS4" | "Essay";

export interface HeroQuestion {
  id: string;
  /** must match a live tool's slug in lib/tools.ts */
  toolId: string;
  toolName: string;
  /** deep link where the tool supports it (#id on the timelines) */
  toolHref: string;
  paper: HeroPaper;
  subject: string;
  difficulty: "moderate" | "tough";
  question: string;
  /** 2–4 options */
  options: string[];
  answerIndex: number;
  /** one or two sentences, shown after answering either way */
  explanation: string;
  /** overrides the default wrong-answer nudge */
  pressureLine?: string;
  /** where to verify the fact */
  source: string;
}

const MIT = { toolId: "modern-india-timeline", toolName: "Modern India Timeline", paper: "GS1", subject: "History" } as const;
const GG = { toolId: "governors-general", toolName: "Governors-General & Viceroys", paper: "GS1", subject: "History" } as const;
const AIT = { toolId: "ancient-india-timeline", toolName: "Ancient India Timeline", paper: "GS1", subject: "History" } as const;
const AIM = { toolId: "ancient-sites-map", toolName: "Ancient India Mapping", paper: "GS1", subject: "History" } as const;
const NP = { toolId: "national-parks", toolName: "Protected Areas Map", paper: "GS3", subject: "Environment" } as const;
const WM = { toolId: "world-map", toolName: "World Map", paper: "GS1", subject: "Geography" } as const;
const IO = { toolId: "international-organizations", toolName: "International Orgs Map", paper: "GS2", subject: "International Relations" } as const;

export const HERO_QUESTIONS: HeroQuestion[] = [
  // ── Modern India Timeline ──
  {
    ...MIT,
    id: "mit-wartime-order",
    toolHref: "/gs1/modern-india-timeline#e200",
    difficulty: "tough",
    question: "Correct chronological order?",
    options: [
      "Cripps Mission → August Offer → Individual Satyagraha → Quit India",
      "August Offer → Individual Satyagraha → Cripps Mission → Quit India",
      "Individual Satyagraha → August Offer → Quit India → Cripps Mission",
      "August Offer → Cripps Mission → Individual Satyagraha → Quit India",
    ],
    answerIndex: 1,
    explanation:
      "August Offer (Aug 1940) → Individual Satyagraha (Oct 1940) → Cripps Mission (Mar 1942) → Quit India (Aug 1942).",
    source: "Bipan Chandra, India's Struggle for Independence, ch. 33–35; Spectrum, A Brief History of Modern India",
  },
  {
    ...MIT,
    id: "mit-award-vs-pact",
    toolHref: "/gs1/modern-india-timeline#e180",
    difficulty: "moderate",
    question: "Which came first?",
    options: ["Poona Pact", "Communal Award"],
    answerIndex: 1,
    explanation:
      "MacDonald's Communal Award (Aug 1932) gave separate electorates to the Depressed Classes; Gandhi's fast against it led to the Poona Pact (Sep 1932).",
    source: "Spectrum, A Brief History of Modern India, 'Civil Disobedience Movement and Round Table Conferences'",
  },
  {
    ...MIT,
    id: "mit-lahore-vs-august",
    toolHref: "/gs1/modern-india-timeline#e199",
    difficulty: "tough",
    question: "Which came first, both in 1940?",
    options: ["The August Offer", "The Muslim League's Lahore Resolution"],
    answerIndex: 1,
    explanation:
      "The Lahore Resolution was adopted in March 1940; Linlithgow's August Offer followed on 8 August 1940.",
    source: "Spectrum, A Brief History of Modern India, 'Debates on the Future Strategy after Civil Disobedience'",
  },
  {
    ...MIT,
    id: "mit-surat-split",
    toolHref: "/gs1/modern-india-timeline#e91",
    difficulty: "moderate",
    question: "In which year did the Congress split at Surat?",
    options: ["1905", "1906", "1907", "1908"],
    answerIndex: 2,
    explanation:
      "The Moderate–Extremist split came at the Surat session in December 1907, two years after the Partition of Bengal.",
    source: "NCERT Class 8 'Our Pasts III', ch. 'The Making of the National Movement'; Spectrum",
  },
  {
    ...MIT,
    id: "mit-not-1928",
    toolHref: "/gs1/modern-india-timeline#e152",
    difficulty: "tough",
    question: "Which of these did NOT happen in 1928?",
    options: ["Bardoli Satyagraha", "Nehru Report", "Kakori Train Robbery", "'Simon Go Back' protests"],
    answerIndex: 2,
    explanation: "The Kakori Train Robbery was in August 1925. The other three were all 1928.",
    source: "Spectrum, A Brief History of Modern India, 'Revolutionary Activities' and 'Simon Commission and the Nehru Report'",
  },
  {
    ...MIT,
    id: "mit-poona-pact",
    toolHref: "/gs1/modern-india-timeline#e181",
    difficulty: "moderate",
    question: "The Poona Pact (1932) was an agreement between:",
    options: ["Gandhi and Jinnah", "Gandhi and Ambedkar", "Nehru and Ambedkar", "Gandhi and Ramsay MacDonald"],
    answerIndex: 1,
    explanation:
      "Gandhi and B. R. Ambedkar agreed to reserved seats for the Depressed Classes within joint electorates, replacing the Communal Award's separate electorates.",
    source: "NCERT Class 12 'Themes in Indian History III', ch. 15; Spectrum",
  },

  // ── Governors-General & Viceroys ──
  {
    ...GG,
    id: "gg-vernacular-press",
    toolHref: "/gs1/governors-general#lytton",
    difficulty: "moderate",
    question: "The Vernacular Press Act, 1878 was passed under which Viceroy?",
    options: ["Lord Ripon", "Lord Lawrence", "Lord Lytton", "Lord Mayo"],
    answerIndex: 2,
    explanation: "Lytton passed the 'Gagging Act' in 1878; Ripon repealed it in 1882.",
    source: "Spectrum, A Brief History of Modern India, 'Development of the Press'",
  },
  {
    ...GG,
    id: "gg-amritsar-minto",
    toolHref: "/gs1/governors-general#minto-1",
    difficulty: "tough",
    question: "The Treaty of Amritsar (1809) with Ranjit Singh was signed under:",
    options: ["Lord Minto I", "Lord Minto II", "Lord Hastings", "Lord Wellesley"],
    answerIndex: 0,
    explanation:
      "Minto I (1807–13) signed it. Minto II (1905–10) is the Morley–Minto Reforms man, a century later.",
    pressureLine: "Name-twins like Minto I and II are a classic prelims trap. Learn them side by side.",
    source: "Spectrum, A Brief History of Modern India, 'Expansion and Consolidation of British Power'",
  },
  {
    ...GG,
    id: "gg-subsidiary-alliance",
    toolHref: "/gs1/governors-general#wellesley",
    difficulty: "moderate",
    question: "Who introduced the Subsidiary Alliance system?",
    options: ["Lord Dalhousie", "Lord Cornwallis", "Warren Hastings", "Lord Wellesley"],
    answerIndex: 3,
    explanation:
      "Wellesley introduced it in 1798; the Nizam of Hyderabad was the first to accept. Dalhousie's tool was the Doctrine of Lapse.",
    source: "NCERT Class 8 'Our Pasts III', ch. 2 'From Trade to Territory'",
  },
  {
    ...GG,
    id: "gg-permanent-settlement",
    toolHref: "/gs1/governors-general#cornwallis",
    difficulty: "moderate",
    question: "The Permanent Settlement of Bengal (1793) was introduced under:",
    options: ["Lord Cornwallis", "Warren Hastings", "Sir John Shore", "Lord Wellesley"],
    answerIndex: 0,
    explanation: "Cornwallis introduced it in 1793, the same year as the Cornwallis Code.",
    source: "NCERT Class 8 'Our Pasts III', ch. 3 'Ruling the Countryside'",
  },
  {
    ...GG,
    id: "gg-inc-viceroy",
    toolHref: "/gs1/governors-general#dufferin",
    difficulty: "moderate",
    question: "Who was Viceroy when the Indian National Congress was founded (1885)?",
    options: ["Lord Ripon", "Lord Lansdowne", "Lord Lytton", "Lord Dufferin"],
    answerIndex: 3,
    explanation: "Dufferin (1884–88). Ripon had left in December 1884, a year before the first session in Bombay.",
    source: "Spectrum, A Brief History of Modern India, 'Indian National Movement 1858–1905'",
  },
  {
    ...GG,
    id: "gg-viceroy-order",
    toolHref: "/gs1/governors-general#ripon",
    difficulty: "tough",
    question: "Correct order of these Viceroys?",
    options: [
      "Ripon → Lytton → Dufferin → Curzon",
      "Lytton → Dufferin → Ripon → Curzon",
      "Lytton → Ripon → Dufferin → Curzon",
      "Lytton → Ripon → Curzon → Dufferin",
    ],
    answerIndex: 2,
    explanation: "Lytton (1876–80) → Ripon (1880–84) → Dufferin (1884–88) → Curzon (1899–1905).",
    source: "Spectrum, A Brief History of Modern India, appendix 'Governors-General and Viceroys'",
  },
  {
    ...GG,
    id: "gg-capital-delhi",
    toolHref: "/gs1/governors-general#hardinge-2",
    difficulty: "tough",
    question: "The capital was shifted from Calcutta to Delhi (announced 1911) under:",
    options: ["Lord Hardinge I", "Lord Minto II", "Lord Hardinge II", "Lord Chelmsford"],
    answerIndex: 2,
    explanation:
      "Hardinge II (1910–16), at the Delhi Durbar of 1911. Hardinge I (1844–48) fought the First Anglo-Sikh War.",
    pressureLine: "Hardinge I vs II trips up toppers too. The tool puts them side by side.",
    source: "Spectrum, A Brief History of Modern India, appendix 'Governors-General and Viceroys'",
  },

  // ── Ancient India Timeline ──
  {
    ...AIT,
    id: "ait-magadha-order",
    toolHref: "/gs1/ancient-india-timeline",
    difficulty: "moderate",
    question: "Correct order of the dynasties that ruled Magadha?",
    options: [
      "Haryanka → Shishunaga → Nanda → Maurya",
      "Haryanka → Nanda → Shishunaga → Maurya",
      "Shishunaga → Haryanka → Nanda → Maurya",
      "Nanda → Haryanka → Shishunaga → Maurya",
    ],
    answerIndex: 0,
    explanation: "Haryanka (Bimbisara, Ajatashatru) → Shishunaga → Nanda → Maurya (from 322 BCE).",
    source: "NCERT (old) R. S. Sharma, 'Ancient India', ch. 'Territorial States and the Rise of Magadha'",
  },
  {
    ...AIT,
    id: "ait-brihadratha",
    toolHref: "/gs1/ancient-india-timeline",
    difficulty: "moderate",
    question: "The last Mauryan king, Brihadratha, was overthrown by the founder of which dynasty?",
    options: ["Kanva", "Satavahana", "Shunga", "Indo-Greek"],
    answerIndex: 2,
    explanation: "His general Pushyamitra Shunga killed him around 185 BCE and founded the Shunga dynasty. The Kanvas displaced the Shungas later.",
    source: "NCERT (old) R. S. Sharma, 'Ancient India', ch. 'Central Asian Contact and Its Results'",
  },
  {
    ...AIT,
    id: "ait-kanishka",
    toolHref: "/gs1/ancient-india-timeline",
    difficulty: "moderate",
    question: "Kanishka belonged to which dynasty?",
    options: ["Indo-Parthian", "Kushan", "Indo-Greek", "Saka"],
    answerIndex: 1,
    explanation: "Kanishka I (c. 78–101 CE in the conventional dating) was the greatest Kushan ruler, after Kujula and Vima Kadphises.",
    source: "NCERT (old) R. S. Sharma, 'Ancient India', ch. 'Central Asian Contact and Its Results'",
  },
  {
    ...AIT,
    id: "ait-menander",
    toolHref: "/gs1/ancient-india-timeline",
    difficulty: "moderate",
    question: "Menander (Milinda of the Milindapanho) was a ruler of the:",
    options: ["Kushans", "Sakas", "Indo-Parthians", "Indo-Greeks"],
    answerIndex: 3,
    explanation: "Menander I was the best-known Indo-Greek king; his dialogue with the monk Nagasena is the Milindapanho.",
    source: "NCERT (old) R. S. Sharma, 'Ancient India', ch. 'Central Asian Contact and Its Results'",
  },
  {
    ...AIT,
    id: "ait-gupta-latest",
    toolHref: "/gs1/ancient-india-timeline",
    difficulty: "moderate",
    question: "Which of these Gupta rulers reigned latest?",
    options: ["Kumaragupta I", "Samudragupta", "Skandagupta", "Chandragupta II"],
    answerIndex: 2,
    explanation: "Chandragupta I → Samudragupta → Chandragupta II → Kumaragupta I → Skandagupta, who fought off the Hunas.",
    source: "NCERT (old) R. S. Sharma, 'Ancient India', ch. 'The Age of the Guptas'",
  },
  {
    ...AIT,
    id: "ait-pulakeshin",
    toolHref: "/gs1/ancient-india-timeline",
    difficulty: "tough",
    question: "Pulakeshin II, who defeated Harsha, belonged to the:",
    options: ["Chalukyas of Badami", "Chalukyas of Kalyani", "Rashtrakutas", "Pallavas"],
    answerIndex: 0,
    explanation: "He was a Chalukya of Badami (Vatapi). The Kalyani (Western) Chalukyas came three centuries later.",
    source: "NCERT Class 6 'Our Pasts I', ch. 'New Empires and Kingdoms'; R. S. Sharma, 'Ancient India'",
  },

  // ── Ancient India Mapping ──
  {
    ...AIM,
    id: "aim-dholavira",
    toolHref: "/gs1/ancient-sites-map",
    difficulty: "moderate",
    question: "Dholavira lies in which district of Gujarat?",
    options: ["Kutch", "Ahmedabad", "Banaskantha", "Bhavnagar"],
    answerIndex: 0,
    explanation: "Dholavira is on Khadir Bet in the Rann of Kutch. Lothal, the dockyard site, is in Ahmedabad district.",
    source: "UNESCO World Heritage listing 'Dholavira: a Harappan City' (2021); ASI",
  },
  {
    ...AIM,
    id: "aim-no-citadel",
    toolHref: "/gs1/ancient-sites-map",
    difficulty: "tough",
    question: "Which major Harappan site had no citadel?",
    options: ["Kalibangan", "Lothal", "Chanhudaro", "Banawali"],
    answerIndex: 2,
    explanation: "Chanhudaro, a craft town known for bead-making workshops, is the only major Harappan city without a citadel.",
    source: "NCERT Class 12 'Themes in Indian History I', ch. 1 'Bricks, Beads and Bones'",
  },
  {
    ...AIM,
    id: "aim-fire-altars",
    toolHref: "/gs1/ancient-sites-map",
    difficulty: "moderate",
    question: "Rows of 'fire altars' were found at:",
    options: ["Lothal", "Dholavira", "Banawali", "Kalibangan"],
    answerIndex: 3,
    explanation: "Kalibangan in Rajasthan, which also has a preserved ploughed field. Banawali is known instead for its radial street plan.",
    source: "NCERT Class 12 'Themes in Indian History I', ch. 1 'Bricks, Beads and Bones'",
  },
  {
    ...AIM,
    id: "aim-kharosthi",
    toolHref: "/gs1/ancient-sites-map",
    difficulty: "tough",
    question: "Which of these Ashokan Major Rock Edicts is written in Kharosthi script?",
    options: ["Girnar", "Shahbazgarhi", "Kalsi", "Dhauli"],
    answerIndex: 1,
    explanation: "Shahbazgarhi (and Mansehra) in the northwest use Kharosthi; most other Major Rock Edicts are in Brahmi.",
    source: "NCERT Class 12 'Themes in Indian History I', ch. 2 'Kings, Farmers and Towns'",
  },
  {
    ...AIM,
    id: "aim-kandahar",
    toolHref: "/gs1/ancient-sites-map",
    difficulty: "tough",
    question: "Which Ashokan edict is bilingual, in Greek and Aramaic?",
    options: ["Kandahar", "Mansehra", "Shahbazgarhi", "Sopara"],
    answerIndex: 0,
    explanation: "The Kandahar edict (Afghanistan) uses Greek and Aramaic for the empire's northwest frontier.",
    source: "Romila Thapar, 'Asoka and the Decline of the Mauryas', appendix on inscriptions",
  },
  {
    ...AIM,
    id: "aim-prayaga-prashasti",
    toolHref: "/gs1/ancient-sites-map",
    difficulty: "moderate",
    question: "Who composed the Prayaga Prashasti on the Allahabad pillar?",
    options: ["Ravikirti", "Banabhatta", "Kalidasa", "Harishena"],
    answerIndex: 3,
    explanation:
      "Harishena, Samudragupta's court poet. Ravikirti composed the Aihole inscription of Pulakeshin II.",
    source: "NCERT Class 6 'Our Pasts I', ch. 'New Empires and Kingdoms'",
  },
  {
    ...AIM,
    id: "aim-topra",
    toolHref: "/gs1/ancient-sites-map",
    difficulty: "tough",
    question: "Which Ashokan pillar did Firuz Shah Tughlaq move to Delhi (Feroz Shah Kotla)?",
    options: ["Rampurwa", "Topra", "Lauriya Nandangarh", "Sarnath"],
    answerIndex: 1,
    explanation: "The Topra pillar (Haryana) went to Feroz Shah Kotla; the Meerut pillar went to the Delhi Ridge.",
    source: "ASI; Romila Thapar, 'Asoka and the Decline of the Mauryas'",
  },

  // ── Protected Areas Map ──
  {
    ...NP,
    id: "np-sangai",
    toolHref: "/gs3/national-parks",
    difficulty: "moderate",
    question: "Keibul Lamjao, the world's only floating national park, is the last refuge of:",
    options: ["Hangul", "Sangai (brow-antlered deer)", "Barasingha (swamp deer)", "Takin"],
    answerIndex: 1,
    explanation: "The Sangai lives on the floating phumdis of Loktak Lake, Manipur. The Hangul is Kashmir's stag (Dachigam).",
    source: "Manipur Forest Department; MoEFCC, ENVIS Centre on Wildlife & Protected Areas",
  },
  {
    ...NP,
    id: "np-four-cats",
    toolHref: "/gs3/national-parks",
    difficulty: "tough",
    question: "Which is the only Indian national park with all four big cats (tiger, leopard, clouded leopard, snow leopard)?",
    options: ["Manas", "Kaziranga", "Neora Valley", "Namdapha"],
    answerIndex: 3,
    explanation: "Namdapha in Arunachal Pradesh, spanning from lowland rainforest to snow-line altitudes.",
    source: "Arunachal Pradesh Forest Department; WII, Namdapha Tiger Reserve profile",
  },
  {
    ...NP,
    id: "np-first-marine",
    toolHref: "/gs3/national-parks",
    difficulty: "tough",
    question: "India's first Marine National Park (1982) is:",
    options: ["Gulf of Mannar Marine NP", "Mahatma Gandhi Marine NP (Wandoor)", "Marine NP, Gulf of Kutch", "Rani Jhansi Marine NP"],
    answerIndex: 2,
    explanation: "The Gulf of Kutch park in Gujarat (1982). Gulf of Mannar is India's first Marine Biosphere Reserve, a different first.",
    source: "Gujarat Forest Department; MoEFCC, ENVIS Centre on Wildlife & Protected Areas",
  },
  {
    ...NP,
    id: "np-largest-tr",
    toolHref: "/gs3/national-parks",
    difficulty: "moderate",
    question: "India's largest tiger reserve by area is:",
    options: ["Nagarjunsagar-Srisailam", "Similipal", "Sundarbans", "Manas"],
    answerIndex: 0,
    explanation: "Nagarjunsagar-Srisailam in the Nallamala hills of Andhra Pradesh, along the Krishna.",
    source: "National Tiger Conservation Authority (NTCA), list of tiger reserves",
  },
  {
    ...NP,
    id: "np-not-assam",
    toolHref: "/gs3/national-parks",
    difficulty: "moderate",
    question: "Which of these national parks is NOT in Assam?",
    options: ["Orang", "Jaldapara", "Nameri", "Dibru-Saikhowa"],
    answerIndex: 1,
    explanation: "Jaldapara is in the Dooars of West Bengal, the biggest one-horned rhino stronghold after Kaziranga.",
    source: "MoEFCC, ENVIS Centre on Wildlife & Protected Areas, state-wise national parks",
  },
  {
    ...NP,
    id: "np-black-tigers",
    toolHref: "/gs3/national-parks",
    difficulty: "tough",
    question: "Melanistic ('black') tigers are found in:",
    options: ["Sundarbans", "Satkosia", "Bhitarkanika", "Similipal"],
    answerIndex: 3,
    explanation: "Similipal in Odisha, home to the world's only known population of pseudo-melanistic tigers.",
    source: "NTCA; Sagar et al. (2021), PNAS, on pseudo-melanism in Similipal tigers",
  },

  // ── World Map ──
  {
    ...WM,
    id: "wm-elbrus",
    toolHref: "/gs1/world-map",
    difficulty: "moderate",
    question: "The highest peak in Europe is:",
    options: ["Mont Blanc", "Mount Elbrus", "Mount Etna", "Jbel Toubkal"],
    answerIndex: 1,
    explanation: "Elbrus (5,642 m) in the Caucasus. Mont Blanc (4,808 m) is the highest in the Alps.",
    source: "Encyclopaedia Britannica, 'Mount Elbrus'; NCERT Class 11 'Fundamentals of Physical Geography'",
  },
  {
    ...WM,
    id: "wm-ojos",
    toolHref: "/gs1/world-map",
    difficulty: "tough",
    question: "The world's highest active volcano is:",
    options: ["Cotopaxi", "Chimborazo", "Aconcagua", "Ojos del Salado"],
    answerIndex: 3,
    explanation: "Ojos del Salado (~6,893 m) on the Argentina–Chile border. Cotopaxi is among the highest; Aconcagua is the highest peak in the Americas.",
    source: "Smithsonian Global Volcanism Program; Encyclopaedia Britannica",
  },
  {
    ...WM,
    id: "wm-victoria",
    toolHref: "/gs1/world-map",
    difficulty: "moderate",
    question: "Lake Victoria is the source of the:",
    options: ["White Nile", "Blue Nile", "Congo", "Niger"],
    answerIndex: 0,
    explanation: "The White Nile leaves Lake Victoria at Jinja, Uganda. The Blue Nile rises at Lake Tana in the Ethiopian Highlands.",
    source: "Encyclopaedia Britannica, 'Nile River'",
  },
  {
    ...WM,
    id: "wm-atacama-current",
    toolHref: "/gs1/world-map",
    difficulty: "tough",
    question: "The Atacama's extreme aridity is linked mainly to which cold current offshore?",
    options: ["Humboldt (Peruvian)", "California", "Benguela", "Canary"],
    answerIndex: 0,
    explanation: "The Humboldt Current cools the air off Chile and Peru. The Benguela Current does the same for the Namib.",
    source: "NCERT Class 11 'Fundamentals of Physical Geography', ch. 'Movements of Ocean Water'",
  },
  {
    ...WM,
    id: "wm-chimborazo",
    toolHref: "/gs1/world-map",
    difficulty: "tough",
    question: "Which summit is farthest from Earth's centre?",
    options: ["Mount Everest", "Chimborazo", "Aconcagua", "Mount Kenya"],
    answerIndex: 1,
    explanation: "Chimborazo in Ecuador. It sits on the equatorial bulge, so its summit beats Everest's on distance from the centre.",
    source: "NOAA National Ocean Service, 'What is the highest point on Earth as measured from Earth's center?'",
  },
  {
    ...WM,
    id: "wm-ladoga",
    toolHref: "/gs1/world-map",
    difficulty: "moderate",
    question: "The largest lake entirely in Europe is:",
    options: ["Lake Geneva", "Lake Ladoga", "Lake Balaton", "Lake Constance"],
    answerIndex: 1,
    explanation: "Lake Ladoga near St Petersburg, the WWII 'Road of Life' into besieged Leningrad.",
    source: "Encyclopaedia Britannica, 'Lake Ladoga'",
  },

  // ── International Orgs Map ──
  {
    ...IO,
    id: "io-bimstec",
    toolHref: "/gs2/international-organizations",
    difficulty: "moderate",
    question: "Which of these is NOT a member of BIMSTEC?",
    options: ["Bhutan", "Myanmar", "Maldives", "Nepal"],
    answerIndex: 2,
    explanation: "BIMSTEC's seven: Bangladesh, Bhutan, India, Myanmar, Nepal, Sri Lanka and Thailand. The Maldives is in SAARC, not BIMSTEC.",
    source: "BIMSTEC Secretariat, bimstec.org, 'About BIMSTEC'",
  },
  {
    ...IO,
    id: "io-sco-year",
    toolHref: "/gs2/international-organizations",
    difficulty: "moderate",
    question: "India and Pakistan became full members of the SCO in:",
    options: ["2001", "2015", "2017", "2019"],
    answerIndex: 2,
    explanation: "Both joined together at the Astana summit in June 2017. The SCO itself was founded in 2001.",
    source: "Ministry of External Affairs, 'India and the SCO' brief",
  },
  {
    ...IO,
    id: "io-mtcr",
    toolHref: "/gs2/international-organizations",
    difficulty: "tough",
    question: "India joined the Missile Technology Control Regime (MTCR) in:",
    options: ["2014", "2016", "2017", "2018"],
    answerIndex: 1,
    explanation: "India became the 35th MTCR member in June 2016, then joined the Wassenaar Arrangement in December 2017.",
    source: "Ministry of External Affairs press releases, 27 June 2016 (MTCR) and 8 December 2017 (Wassenaar)",
  },
  {
    ...IO,
    id: "io-asean-founding",
    toolHref: "/gs2/international-organizations",
    difficulty: "moderate",
    question: "Which of these was NOT a founding member of ASEAN (1967)?",
    options: ["Brunei", "Philippines", "Singapore", "Thailand"],
    answerIndex: 0,
    explanation: "Brunei joined in 1984. The five founders: Indonesia, Malaysia, the Philippines, Singapore and Thailand.",
    source: "ASEAN Secretariat, asean.org, 'The Founding of ASEAN'",
  },
  {
    ...IO,
    id: "io-mekong-ganga",
    toolHref: "/gs2/international-organizations",
    difficulty: "tough",
    question: "Which country is NOT part of the Mekong-Ganga Cooperation?",
    options: ["Cambodia", "Laos", "Vietnam", "China"],
    answerIndex: 3,
    explanation: "The Mekong rises in China, but MGC is India plus five ASEAN states: Cambodia, Laos, Myanmar, Thailand and Vietnam.",
    source: "Ministry of External Affairs, 'Mekong-Ganga Cooperation' brief",
  },
  {
    ...IO,
    id: "io-csc-founders",
    toolHref: "/gs2/international-organizations",
    difficulty: "tough",
    question: "The Colombo Security Conclave began in 2011 as a trilateral of:",
    options: [
      "India, Sri Lanka, Bangladesh",
      "India, Maldives, Mauritius",
      "India, Sri Lanka, Maldives",
      "India, Sri Lanka, Mauritius",
    ],
    answerIndex: 2,
    explanation: "India, Sri Lanka and the Maldives. Mauritius joined in 2022, Bangladesh in 2024.",
    source: "Ministry of External Affairs; Colombo Security Conclave Secretariat statements",
  },
];
