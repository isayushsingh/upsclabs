// Registry for /pyq/[slug] pages — worked breakdowns of real UPSC Prelims
// "pair matching" questions, each paired with a deep link into an existing
// tool (see lib/tools.ts) so the aspirant can see *why* a pair is right or
// wrong on the actual map/timeline, not just read a claim.
//
// Deliberately empty until real, verified PYQs are added. Entries here are
// published as fact — "this pair is correct/incorrect" — so every question,
// year, and pair must come from the actual printed paper (or an equally
// reliable source), not from memory or paraphrase. Getting one wrong
// undermines the trust this whole content format is built on.

export interface PyqPair {
  /** e.g. "Hokera Wetland" */
  item: string;
  /** The state/fact the PYQ paired it with. */
  claimedMatch: string;
  correct: boolean;
  /** One or two sentences: what's actually true, and why the pair is right/wrong. */
  explanation: string;
  /** Slug to deep-link into the related tool's ?highlight= param (see
      NationalParksMap's slugify()) — omit if this item isn't in that tool's data. */
  mapSlug?: string;
}

export interface PyqEntry {
  slug: string;
  title: string;
  /** Meta description / page dek. */
  description: string;
  examBody: string; // e.g. "UPSC Prelims"
  examYear: number;
  /** The question exactly as printed on the paper. */
  questionText: string;
  pairs: PyqPair[];
  /** e.g. "Only two pairs are correctly matched." — the printed answer choice being explained. */
  answerNote: string;
  /** The tool this question's pairs can be explored on. */
  tool: { name: string; href: string };
}

export const PYQS: PyqEntry[] = [
  {
    slug: "2022-prelims-wetlands-map",
    title: "UPSC PYQ: Wetlands and Lakes Mapping (2022)",
    description:
      "Worked breakdown of the 2022 Prelims wetland pairs question — Hokera, Renuka, Rudrasagar and Sasthamkotta — with each one located on the live map.",
    examBody: "UPSC Prelims",
    examYear: 2022,
    questionText:
      "Consider the following pairs:\nWetland/Lake — Location\n1. Hokera Wetland — Punjab\n2. Renuka Wetland — Himachal Pradesh\n3. Rudrasagar Lake — Tripura\n4. Sasthamkotta Lake — Tamil Nadu\nHow many pairs given above are correctly matched?",
    pairs: [
      {
        item: "Hokera Wetland",
        claimedMatch: "Punjab",
        correct: false,
        explanation:
          "Hokera (Hokersar) Wetland is in Jammu & Kashmir, not Punjab — a Ramsar site on the outskirts of Srinagar, and a key wintering ground for migratory waterfowl in the Kashmir valley.",
        mapSlug: "hokersar-wetland",
      },
      {
        item: "Renuka Wetland",
        claimedMatch: "Himachal Pradesh",
        correct: true,
        explanation:
          "Renuka Lake is correctly in Himachal Pradesh — a natural freshwater lake and Ramsar site in Sirmaur district, associated with the Renuka Ji Temple.",
        mapSlug: "renuka-lake",
      },
      {
        item: "Rudrasagar Lake",
        claimedMatch: "Tripura",
        correct: true,
        explanation:
          "Rudrasagar Lake is correctly in Tripura — a Ramsar site near Melaghar, known for the Neermahal palace built on it.",
        mapSlug: "rudrasagar-lake",
      },
      {
        item: "Sasthamkotta Lake",
        claimedMatch: "Tamil Nadu",
        correct: false,
        explanation:
          "Sasthamkotta Lake is in Kerala, not Tamil Nadu — it's Kerala's largest freshwater lake and the main drinking-water source for Kollam town.",
        mapSlug: "sasthamkotta",
      },
    ],
    answerNote:
      "Only two pairs are correctly matched (2 and 3) — the correct answer to the original question.",
    tool: { name: "Protected Areas & Wetlands Map", href: "/gs3/national-parks" },
  },
  {
    slug: "2014-prelims-wetlands-confluence-map",
    title: "UPSC PYQ: Wetlands and River Confluences (2014)",
    description:
      "Worked breakdown of the 2014 Prelims question on wetlands and the rivers they sit at the confluence of — Harike, Keoladeo and Kolleru — each located on the live map.",
    examBody: "UPSC Prelims",
    examYear: 2014,
    questionText:
      "Consider the following pairs:\nWetlands — Confluence of rivers\n1. Harike Wetlands — Confluence of Beas and Satluj/Sutlej\n2. Keoladeo Ghana National Park — Confluence of Banas and Chambal\n3. Kolleru Lake — Confluence of Musi and Krishna\nWhich of the above pairs is/are correctly matched?",
    pairs: [
      {
        item: "Harike Wetlands",
        claimedMatch: "Confluence of Beas and Satluj/Sutlej",
        correct: true,
        explanation:
          "Correctly matched — Harike Wetland in Punjab sits right at the confluence of the Beas and Sutlej rivers, which is what makes it one of the largest wetlands in northern India.",
        mapSlug: "harike-wetland",
      },
      {
        item: "Keoladeo Ghana National Park",
        claimedMatch: "Confluence of Banas and Chambal",
        correct: false,
        explanation:
          "Keoladeo (Bharatpur), in Rajasthan, is fed by the Gambhir and Banganga rivers, not a Banas–Chambal confluence.",
        mapSlug: "keoladeo-national-park",
      },
      {
        item: "Kolleru Lake",
        claimedMatch: "Confluence of Musi and Krishna",
        correct: false,
        explanation:
          "Kolleru Lake in Andhra Pradesh lies between the Krishna and Godavari river deltas, not at a Musi–Krishna confluence.",
        mapSlug: "kolleru-lake",
      },
    ],
    answerNote: "Only pair 1 is correctly matched.",
    tool: { name: "Protected Areas & Wetlands Map", href: "/gs3/national-parks" },
  },
  {
    slug: "2013-prelims-national-parks-rivers-map",
    title: "UPSC PYQ: National Parks and Rivers Mapping (2013)",
    description:
      "Worked breakdown of the 2013 Prelims question pairing national parks with the rivers said to flow through them — Corbett, Kaziranga and Silent Valley — each located on the live map.",
    examBody: "UPSC Prelims",
    examYear: 2013,
    questionText:
      "Consider the following pairs:\nNational Park — River flowing through the Park\n1. Corbett National Park — Ganga\n2. Kaziranga National Park — Manas\n3. Silent Valley National Park — Kaveri\nWhich of the above pairs is/are correctly matched?",
    pairs: [
      {
        item: "Corbett National Park",
        claimedMatch: "Ganga",
        correct: false,
        explanation:
          "It's the Ramganga — a tributary of the Ganga — that flows through Corbett, in Uttarakhand, not the Ganga itself.",
        mapSlug: "jim-corbett",
      },
      {
        item: "Kaziranga National Park",
        claimedMatch: "Manas",
        correct: false,
        explanation:
          "Kaziranga, in Assam, sits on the Brahmaputra floodplain. Manas is a separate river and national park elsewhere in Assam.",
        mapSlug: "kaziranga",
      },
      {
        item: "Silent Valley National Park",
        claimedMatch: "Kaveri",
        correct: false,
        explanation:
          "Silent Valley, in Kerala, is watered by the Kunthipuzha (Kunthi) river, not the Kaveri.",
        mapSlug: "silent-valley",
      },
    ],
    answerNote: "None of the pairs are correctly matched.",
    tool: { name: "Protected Areas & Wetlands Map", href: "/gs3/national-parks" },
  },
  {
    slug: "2013-prelims-protected-areas-hills-map",
    title: "UPSC PYQ: Protected Areas and Hill Ranges (2013)",
    description:
      "Worked breakdown of the 2013 Prelims question pairing protected areas with the hill ranges they belong to — Nokrek, Loktak and Namdapha — each located on the live map.",
    examBody: "UPSC Prelims",
    examYear: 2013,
    questionText:
      "Consider the following pairs:\n1. Nokrek Biosphere Reserve — Garo Hills\n2. Logtak (Loktak) Lake — Barail Range\n3. Namdapha National Park — Dafla Hills\nWhich of the above pairs is/are correctly matched?",
    pairs: [
      {
        item: "Nokrek Biosphere Reserve",
        claimedMatch: "Garo Hills",
        correct: true,
        explanation:
          "Correctly matched — Nokrek, in Meghalaya, sits within the Garo Hills and is the highest point of that range.",
        mapSlug: "nokrek",
      },
      {
        item: "Loktak Lake",
        claimedMatch: "Barail Range",
        correct: false,
        explanation:
          "Loktak Lake sits in the Manipur valley, not the Barail Range, which lies further west along the Assam–Nagaland–Manipur border.",
        mapSlug: "loktak-lake",
      },
      {
        item: "Namdapha National Park",
        claimedMatch: "Dafla Hills",
        correct: false,
        explanation:
          "Namdapha, in Arunachal Pradesh, is associated with the Patkai range, not the Dafla Hills further west near the Kameng/Subansiri region.",
        mapSlug: "namdapha",
      },
    ],
    answerNote: "Only pair 1 is correctly matched.",
    tool: { name: "Protected Areas & Wetlands Map", href: "/gs3/national-parks" },
  },
];

export function getPyq(slug: string): PyqEntry | undefined {
  return PYQS.find((p) => p.slug === slug);
}
