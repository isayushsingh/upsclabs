// Governors-General & Viceroys of British India (1773–1947) — the data behind
// components/governors/GovernorsGeneral.tsx.
//
// Every tenure's events are sorted into the same eight SLOTS, so a student
// learns each man by slot ("Cornwallis → Land: Permanent Settlement") rather
// than as one long undifferentiated list. Events that belong to a numbered
// sequence (the four Anglo-Mysore wars, the four Charter Acts, …) carry a
// `series` + ordinal so the card can badge them and the legend can trace a
// series across the whole track.
//
// Tenures use month precision ("YYYY-MM") — enough for block widths and the
// "4.6 years" readout. Acting Governors-General are left out; the exam-relevant
// events of their stints sit on the card of the full Governor-General who
// came next, tagged with `under` so the chip still names who was in charge.

export type EraId = "bengal" | "india" | "viceroy";

export type SlotId = "wars" | "admin" | "land" | "edu" | "social" | "annex" | "revolt" | "legacy";

export type SeriesId =
  | "mysore"
  | "maratha"
  | "charter"
  | "land"
  | "sikh"
  | "burmese"
  | "afghan"
  | "councils"
  | "durbar"
  | "rtc";

export interface GGEvent {
  label: string;
  slot: SlotId;
  series?: { id: SeriesId; n: number };
  /** set when it happened under an acting G-G just before this tenure */
  under?: string;
}

export interface Governor {
  id: string;
  /** label on the zoomed strip and the preceded/succeeded buttons */
  short: string;
  /** card title */
  name: string;
  era: EraId;
  start: string;
  end: string;
  /** short nickname / one-liner under the dates; facts go in events */
  hook?: string;
  events: GGEvent[];
}

export interface Era {
  id: EraId;
  name: string;
  range: string;
  color: string;
}

export const ERAS: Era[] = [
  { id: "bengal", name: "Governors-General of Bengal", range: "1773–1833", color: "#0F6E56" },
  { id: "india", name: "Governors-General of India", range: "1833–1858", color: "#B5501F" },
  { id: "viceroy", name: "Viceroys", range: "1858–1947", color: "#5048B5" },
];

export const ERA_BY_ID = Object.fromEntries(ERAS.map((e) => [e.id, e])) as Record<EraId, Era>;

export const SLOTS: { id: SlotId; label: string }[] = [
  { id: "wars", label: "Wars & Treaties" },
  { id: "admin", label: "Acts & Admin" },
  { id: "land", label: "Land & Revenue" },
  { id: "edu", label: "Education & Press" },
  { id: "social", label: "Social Reform" },
  { id: "annex", label: "Annexations" },
  { id: "revolt", label: "Revolts & Movements" },
  { id: "legacy", label: "Policy & Legacy" },
];

/** `ordinal`: the series' labels don't say "1st/2nd…" themselves, so the
    chip appends "1 of 4". */
export const SERIES: { id: SeriesId; label: string; ordinal?: boolean }[] = [
  { id: "mysore", label: "Anglo-Mysore Wars" },
  { id: "maratha", label: "Anglo-Maratha Wars" },
  { id: "charter", label: "Charter Acts", ordinal: true },
  { id: "land", label: "Land settlements", ordinal: true },
  { id: "sikh", label: "Anglo-Sikh Wars" },
  { id: "burmese", label: "Anglo-Burmese Wars" },
  { id: "afghan", label: "Anglo-Afghan Wars" },
  { id: "councils", label: "Indian Councils Acts", ordinal: true },
  { id: "durbar", label: "Delhi Durbars" },
  { id: "rtc", label: "Round Table Conferences" },
];

export const SERIES_BY_ID = Object.fromEntries(SERIES.map((s) => [s.id, s])) as Record<
  SeriesId,
  (typeof SERIES)[number]
>;

export interface ChainStep {
  g: Governor;
  e: GGEvent;
  /** first four-digit year in the label, e.g. "Charter Act (1813)" → "1813" */
  year: string;
}

/** Every event in a series, in order, with the Governor-General it fell under. */
export const seriesChain = (id: SeriesId): ChainStep[] =>
  GOVERNORS.flatMap((g) =>
    g.events
      .filter((e) => e.series?.id === id)
      .map((e) => ({ g, e, year: e.label.match(/\b(\d{4})\b/)?.[1] ?? "" }))
  ).sort((a, b) => a.e.series!.n - b.e.series!.n);

const s = (id: SeriesId, n: number) => ({ id, n });

export const GOVERNORS: Governor[] = [
  // ── Governors-General of the Presidency of Fort William (Bengal) ──
  {
    id: "warren-hastings",
    short: "W. Hastings",
    name: "Warren Hastings",
    era: "bengal",
    start: "1773-10",
    end: "1785-02",
    hook: "First Governor-General of Bengal",
    events: [
      { label: "Impeached in Britain on return (trial 1788–95)", slot: "legacy" },
      { label: "1st Rohilla War (1773–74)", slot: "wars" },
      { label: "1st Anglo-Maratha War (1775–82)", slot: "wars", series: s("maratha", 1) },
      { label: "Treaty of Salbai (1782)", slot: "wars" },
      { label: "2nd Anglo-Mysore War (1780–84)", slot: "wars", series: s("mysore", 2) },
      { label: "Treaty of Mangalore (1784)", slot: "wars" },
      { label: "Regulating Act (1773)", slot: "admin" },
      { label: "Supreme Court, Fort William (1774)", slot: "admin" },
      { label: "Pitt's India Act (1784)", slot: "admin" },
      { label: "Abolished Dual System & Dastaks", slot: "admin" },
      { label: "Ended Shah Alam II's pension", slot: "admin" },
      { label: "Treasury: Murshidabad → Calcutta", slot: "land" },
      { label: "Hicky's Bengal Gazette (1780)", slot: "edu" },
      { label: "Calcutta Madrasa (1781)", slot: "edu" },
      { label: "Asiatic Society of Bengal, William Jones (1784)", slot: "edu" },
    ],
  },
  {
    id: "cornwallis",
    short: "Cornwallis",
    name: "Lord Cornwallis",
    era: "bengal",
    start: "1786-09",
    end: "1793-10",
    hook: "Father of the civil services in India",
    events: [
      { label: "3rd Anglo-Mysore War (1790–92)", slot: "wars", series: s("mysore", 3) },
      { label: "Treaty of Seringapatam (1792)", slot: "wars" },
      { label: "Lower & appellate courts", slot: "admin" },
      { label: "Cornwallis Code (1793)", slot: "admin" },
      { label: "Civil services introduced", slot: "admin" },
      { label: "Permanent Settlement of Bengal (1793)", slot: "land", series: s("land", 1) },
      { label: "Sanskrit College, Benares, Jonathan Duncan (1791)", slot: "edu" },
    ],
  },
  {
    id: "shore",
    short: "Shore",
    name: "Sir John Shore",
    era: "bengal",
    start: "1793-10",
    end: "1798-03",
    events: [
      { label: "Policy of non-intervention", slot: "legacy" },
      { label: "2nd Rohilla War (1794)", slot: "wars" },
      { label: "Battle of Kharda, Nizam vs Marathas (1795)", slot: "wars" },
      { label: "Charter Act (1793)", slot: "admin", series: s("charter", 1) },
    ],
  },
  {
    id: "wellesley",
    short: "Wellesley",
    name: "Lord Wellesley",
    era: "bengal",
    start: "1798-05",
    end: "1805-07",
    hook: "Called himself the 'Bengal Tiger'",
    events: [
      { label: "Subsidiary Alliance (1798); Nizam of Hyderabad first to accept", slot: "legacy" },
      { label: "4th Anglo-Mysore War (1799); Tipu killed", slot: "wars", series: s("mysore", 4) },
      { label: "Treaty of Bassein (1802)", slot: "wars" },
      { label: "2nd Anglo-Maratha War (1803–05)", slot: "wars", series: s("maratha", 2) },
      { label: "Government House (Raj Bhavan), Calcutta (1803)", slot: "admin" },
      { label: "Censorship of the Press Act (1799)", slot: "edu" },
      { label: "Fort William College (1800)", slot: "edu" },
      { label: "Tanjore (1799)", slot: "annex" },
      { label: "Surat (1800)", slot: "annex" },
      { label: "Carnatic (1801)", slot: "annex" },
    ],
  },
  {
    id: "cornwallis-2",
    short: "Cornwallis II",
    name: "Lord Cornwallis (second term)",
    era: "bengal",
    start: "1805-07",
    end: "1805-10",
    hook: "Returned for a second term and died at Ghazipur within months (1805)",
    events: [],
  },
  {
    id: "minto-1",
    short: "Minto I",
    name: "Lord Minto I",
    era: "bengal",
    start: "1807-07",
    end: "1813-10",
    events: [
      { label: "Treaty of Amritsar with Ranjit Singh (1809)", slot: "wars" },
      { label: "Treaty with the Talpur Amirs of Sindh (1809)", slot: "wars" },
      { label: "Charter Act (1813)", slot: "admin", series: s("charter", 2) },
      { label: "Bank of Calcutta (1806)", slot: "land", under: "Barlow" },
      { label: "Vellore Mutiny (1806)", slot: "revolt", under: "Barlow" },
    ],
  },
  {
    id: "lord-hastings",
    short: "Lord Hastings",
    name: "Lord Hastings",
    era: "bengal",
    start: "1813-10",
    end: "1823-01",
    events: [
      { label: "Ended the policy of non-intervention", slot: "legacy" },
      { label: "Anglo-Nepalese War (1814–16)", slot: "wars" },
      { label: "Treaty of Sugauli (1816)", slot: "wars" },
      { label: "Pindari War (1817–18)", slot: "wars" },
      { label: "3rd Anglo-Maratha War (1817–18)", slot: "wars", series: s("maratha", 3) },
      { label: "Ryotwari in Madras, Thomas Munro (1820)", slot: "land", series: s("land", 2) },
      { label: "Mahalwari in North-West Provinces (1822)", slot: "land", series: s("land", 3) },
      { label: "Hindu College, Calcutta (1817)", slot: "edu" },
      { label: "General Committee of Public Instruction (1823)", slot: "edu" },
      { label: "Peshwa's lands → Bombay Presidency (1818)", slot: "annex" },
    ],
  },
  {
    id: "amherst",
    short: "Amherst",
    name: "Lord Amherst",
    era: "bengal",
    start: "1823-08",
    end: "1828-03",
    events: [
      { label: "1st Anglo-Burmese War (1824–26)", slot: "wars", series: s("burmese", 1) },
      { label: "Treaty of Yandabo (1826)", slot: "wars" },
      { label: "Licensing Regulations, press curbs (1823)", slot: "edu", under: "John Adam" },
      { label: "Sanskrit College, Calcutta (1824)", slot: "edu" },
      { label: "Assam, Arakan, Tenasserim (1826)", slot: "annex" },
      { label: "Barrackpore Mutiny (1824)", slot: "revolt" },
    ],
  },

  // ── Governors-General of India ──
  {
    id: "bentinck",
    short: "Bentinck",
    name: "Lord William Bentinck",
    era: "india",
    start: "1828-07",
    end: "1835-03",
    hook: "First Governor-General of India",
    events: [
      { label: "Became G-G of India under the Charter Act, 1833", slot: "legacy" },
      { label: "Charter Act (1833)", slot: "admin", series: s("charter", 3) },
      { label: "English Education Act, Macaulay's Minute (1835)", slot: "edu" },
      { label: "Medical College, Calcutta (1835)", slot: "edu" },
      { label: "Abolition of Sati (1829)", slot: "social" },
      { label: "Suppression of Thuggee, William Sleeman (1830s)", slot: "social" },
      { label: "Brahmo Samaj, Raja Ram Mohan Roy (1828)", slot: "social" },
      { label: "Mysore (1831)", slot: "annex" },
      { label: "Cachar (1832)", slot: "annex" },
      { label: "Coorg (1834)", slot: "annex" },
      { label: "Kol Rebellion (1831–32)", slot: "revolt" },
    ],
  },
  {
    id: "auckland",
    short: "Auckland",
    name: "Lord Auckland",
    era: "india",
    start: "1836-03",
    end: "1842-02",
    events: [
      { label: "Tripartite Treaty: British, Ranjit Singh, Shah Shuja (1838)", slot: "wars" },
      { label: "1st Anglo-Afghan War (1839–42)", slot: "wars", series: s("afghan", 1) },
      { label: "Bank of Bombay (1840)", slot: "land" },
      {
        label: "Press Act (1835) repeals 1823 Licensing Regulations; 'Liberator of the Indian Press'",
        slot: "edu",
        under: "Metcalfe",
      },
      { label: "Calcutta Public Library (1836)", slot: "edu", under: "Metcalfe" },
      { label: "Tattwabodhini Sabha, Debendranath Tagore (1839)", slot: "social" },
    ],
  },
  {
    id: "ellenborough",
    short: "Ellenborough",
    name: "Lord Ellenborough",
    era: "india",
    start: "1842-02",
    end: "1844-06",
    events: [
      { label: "Gwalior War (1843)", slot: "wars" },
      { label: "Bank of Madras (1843)", slot: "land" },
      { label: "Indian Slavery Act, slavery abolished (1843)", slot: "social" },
      { label: "Sindh (1843)", slot: "annex" },
    ],
  },
  {
    id: "hardinge-1",
    short: "Hardinge I",
    name: "Lord Hardinge I",
    era: "india",
    start: "1844-07",
    end: "1848-01",
    events: [
      { label: "1st Anglo-Sikh War (1845–46)", slot: "wars", series: s("sikh", 1) },
      { label: "Treaty of Lahore (1846)", slot: "wars" },
      { label: "Kashmir sold to Gulab Singh (1846)", slot: "wars" },
      { label: "Treaty of Bhairowal (1846)", slot: "wars" },
      { label: "Roorkee Engineering College (1847)", slot: "edu" },
    ],
  },
  {
    id: "dalhousie",
    short: "Dalhousie",
    name: "Lord Dalhousie",
    era: "india",
    start: "1848-01",
    end: "1856-02",
    hook: "Father of Indian railways",
    events: [
      { label: "2nd Anglo-Sikh War (1848–49)", slot: "wars", series: s("sikh", 2) },
      { label: "2nd Anglo-Burmese War (1852)", slot: "wars", series: s("burmese", 2) },
      { label: "Charter Act (1853)", slot: "admin", series: s("charter", 4) },
      { label: "Railway, Bombay–Thane (1853)", slot: "admin" },
      { label: "Telegraph, Calcutta–Agra (1853)", slot: "admin" },
      { label: "Post Office Act (1854)", slot: "admin" },
      { label: "Public Works Department", slot: "admin" },
      { label: "Shimla made summer capital", slot: "admin" },
      { label: "Bethune School, Calcutta (1849)", slot: "edu" },
      { label: "Wood's Despatch (1854)", slot: "edu" },
      { label: "Caste Disabilities Removal Act (1850)", slot: "social" },
      { label: "Doctrine of Lapse", slot: "legacy" },
      { label: "By lapse: Satara (1848), Jaitpur, Sambalpur (1849), Udaipur, Jhansi (1853), Nagpur (1854)", slot: "annex" },
      { label: "Punjab (1849)", slot: "annex" },
      { label: "Lower Burma (1852)", slot: "annex" },
      { label: "Awadh, misgovernance (1856)", slot: "annex" },
      { label: "Santhal Rebellion (1855–56)", slot: "revolt" },
    ],
  },
  {
    id: "canning-gg",
    short: "Canning",
    name: "Lord Canning",
    era: "india",
    start: "1856-02",
    end: "1858-11",
    hook: "Last Governor-General under the Company; became the first Viceroy in 1858",
    events: [
      { label: "General Service Enlistment Act (1856)", slot: "admin" },
      { label: "Universities of Calcutta, Bombay, Madras (1857)", slot: "edu" },
      { label: "Hindu Widows' Remarriage Act (1856)", slot: "social" },
      { label: "Revolt of 1857", slot: "revolt" },
    ],
  },

  // ── Viceroys and Governors-General of India ──
  {
    id: "canning-viceroy",
    short: "Canning",
    name: "Lord Canning",
    era: "viceroy",
    start: "1858-11",
    end: "1862-03",
    hook: "First Viceroy of India",
    events: [
      { label: "Queen's Proclamation & GoI Act (1858)", slot: "admin" },
      { label: "Indian Penal Code (1860)", slot: "admin" },
      { label: "Indian High Courts Act (1861)", slot: "admin" },
      { label: "Indian Councils Act (1861), portfolio system", slot: "admin", series: s("councils", 1) },
      { label: "Indian Civil Services Act (1861)", slot: "admin" },
      { label: "Police Act (1861)", slot: "admin" },
      { label: "Archaeological Survey of India (1861)", slot: "admin" },
      { label: "Income tax introduced (1860)", slot: "land" },
      { label: "White Mutiny (1859)", slot: "revolt" },
      { label: "Indigo Revolt (1859–60)", slot: "revolt" },
    ],
  },
  {
    id: "elgin-1",
    short: "Elgin I",
    name: "Lord Elgin I",
    era: "viceroy",
    start: "1862-03",
    end: "1863-11",
    hook: "Died in office at Dharamsala (1863)",
    events: [
      { label: "High Courts at Calcutta, Bombay, Madras (1862)", slot: "admin" },
      { label: "Wahabi Movement suppressed", slot: "revolt" },
    ],
  },
  {
    id: "lawrence",
    short: "Lawrence",
    name: "Sir John Lawrence",
    era: "viceroy",
    start: "1864-01",
    end: "1869-01",
    events: [
      { label: "'Masterly inactivity' towards Afghanistan", slot: "legacy" },
      { label: "Bhutan War (1864–65)", slot: "wars" },
      { label: "Shimla made summer capital (1864)", slot: "admin" },
      { label: "Allahabad High Court (1866)", slot: "admin" },
      { label: "Famine Commission, Henry Campbell (1867), after Orissa famine (1866)", slot: "admin" },
      { label: "Tenancy Acts, Punjab & Oudh (1868)", slot: "land" },
      { label: "Bengal & Assam Duars (1865)", slot: "annex" },
    ],
  },
  {
    id: "mayo",
    short: "Mayo",
    name: "Lord Mayo",
    era: "viceroy",
    start: "1869-01",
    end: "1872-02",
    events: [
      { label: "Assassinated in the Andamans by Sher Ali Afridi (1872)", slot: "legacy" },
      { label: "Sedition, IPC Sec. 124A (1870), against the Wahabis", slot: "admin" },
      { label: "First census, non-synchronous (1872)", slot: "admin" },
      { label: "Dept. of Agriculture & Commerce (1872)", slot: "admin" },
      { label: "Statistical Survey of India (1872)", slot: "admin" },
      { label: "Financial decentralisation (1870)", slot: "land" },
      { label: "Rajkumar College, Rajkot & Mayo College, Ajmer", slot: "edu" },
      { label: "Indian Reform Association, Keshub Chandra Sen (1870)", slot: "social" },
    ],
  },
  {
    id: "northbrook",
    short: "Northbrook",
    name: "Lord Northbrook",
    era: "viceroy",
    start: "1872-05",
    end: "1876-04",
    events: [
      { label: "Resigned over Disraeli's push for a treaty with Sher Ali (1876)", slot: "legacy" },
      { label: "Trial of the Gaekwad of Baroda (1874)", slot: "admin" },
      { label: "Prince of Wales' visit (1875–76)", slot: "admin" },
      { label: "MAO College, Sir Syed Ahmad Khan (1875)", slot: "edu" },
      { label: "Dramatic Performances Act (1876)", slot: "edu" },
      { label: "Satyashodhak Samaj, Jyotiba Phule (1873)", slot: "social" },
      { label: "Kuka rebellion of Ram Singh suppressed (1872)", slot: "revolt" },
    ],
  },
  {
    id: "lytton",
    short: "Lytton",
    name: "Lord Lytton",
    era: "viceroy",
    start: "1876-04",
    end: "1880-06",
    events: [
      { label: "2nd Anglo-Afghan War (1878–80)", slot: "wars", series: s("afghan", 2) },
      { label: "Treaty of Gandamak (1879)", slot: "wars" },
      { label: "Royal Titles Act: 'Empress of India' (1876)", slot: "admin" },
      { label: "1st Delhi Durbar (1877)", slot: "admin", series: s("durbar", 1) },
      { label: "Arms Act (1878)", slot: "admin" },
      { label: "Civil services max age 21 → 19 (1878)", slot: "admin" },
      { label: "Great Famine (1876–78)", slot: "land" },
      { label: "Famine Commission, Richard Strachey (1878)", slot: "land" },
      { label: "Vernacular Press Act (1878)", slot: "edu" },
    ],
  },
  {
    id: "ripon",
    short: "Ripon",
    name: "Lord Ripon",
    era: "viceroy",
    start: "1880-06",
    end: "1884-12",
    hook: "Father of local self-government",
    events: [
      { label: "First Factory Act (1881)", slot: "admin" },
      { label: "Negotiable Instruments Act (1881)", slot: "admin" },
      { label: "First synchronous census (1881)", slot: "admin" },
      { label: "Resolution on local self-government (1882)", slot: "admin" },
      { label: "Ilbert Bill controversy (1883)", slot: "admin" },
      { label: "Civil services max age 19 → 21", slot: "admin" },
      { label: "Famine Code (1883)", slot: "land" },
      { label: "Vernacular Press Act repealed (1882)", slot: "edu" },
      { label: "Panjab University (1882)", slot: "edu" },
      { label: "Hunter Education Commission (1882)", slot: "edu" },
    ],
  },
  {
    id: "dufferin",
    short: "Dufferin",
    name: "Lord Dufferin",
    era: "viceroy",
    start: "1884-12",
    end: "1888-12",
    events: [
      { label: "3rd Anglo-Burmese War (1885)", slot: "wars", series: s("burmese", 3) },
      { label: "Bengal Tenancy Act (1885)", slot: "land" },
      { label: "Burma made a province, capital Rangoon (1886)", slot: "annex" },
      { label: "Indian National Congress founded (1885)", slot: "revolt" },
    ],
  },
  {
    id: "lansdowne",
    short: "Lansdowne",
    name: "Lord Lansdowne",
    era: "viceroy",
    start: "1888-12",
    end: "1894-10",
    events: [
      { label: "Durand Commission; Durand Line with Afghanistan (1893)", slot: "wars" },
      { label: "Second Factory Act (1891)", slot: "admin" },
      { label: "Indian Councils Act (1892)", slot: "admin", series: s("councils", 2) },
      { label: "Age of Consent Act, age raised to 12 (1891)", slot: "social" },
    ],
  },
  {
    id: "elgin-2",
    short: "Elgin II",
    name: "Lord Elgin II",
    era: "viceroy",
    start: "1894-10",
    end: "1899-01",
    events: [
      { label: "Bubonic plague in Bombay (1896)", slot: "admin" },
      { label: "Famine of 1896–97; Lyall Commission", slot: "land" },
      { label: "Ramakrishna Mission, Swami Vivekananda (1897)", slot: "social" },
      { label: "Chapekar brothers kill Rand & Ayerst (1897)", slot: "revolt" },
    ],
  },
  {
    id: "curzon",
    short: "Curzon",
    name: "Lord Curzon",
    era: "viceroy",
    start: "1899-01",
    end: "1905-11",
    hook: "Partitioned Bengal",
    events: [
      { label: "Younghusband expedition to Tibet (1903–04)", slot: "wars" },
      { label: "North-West Frontier Province created (1901)", slot: "admin" },
      { label: "Police Commission, Andrew Fraser (1902)", slot: "admin" },
      { label: "2nd Delhi Durbar (1903)", slot: "admin", series: s("durbar", 2) },
      { label: "Ancient Monuments Preservation Act (1904); Archaeological Dept reorganised", slot: "admin" },
      { label: "Official Secrets Act (1904)", slot: "admin" },
      { label: "Partition of Bengal (16 Oct 1905)", slot: "admin" },
      { label: "Famine of 1899–1900; MacDonnell Commission", slot: "land" },
      { label: "Department of Agriculture (1901)", slot: "land" },
      { label: "Agricultural Research Institute, Pusa (1905)", slot: "land" },
      { label: "Raleigh Commission (1902) → Universities Act (1904)", slot: "edu" },
      { label: "Central Hindu Girls School, Annie Besant (1904)", slot: "edu" },
      { label: "Munda Ulgulan, Birsa Munda (1899–1900)", slot: "revolt" },
      { label: "Swadeshi Movement begins (1905)", slot: "revolt" },
    ],
  },
  {
    id: "minto-2",
    short: "Minto II",
    name: "Lord Minto II",
    era: "viceroy",
    start: "1905-11",
    end: "1910-11",
    events: [
      { label: "Victoria Memorial foundation stone (1906)", slot: "admin" },
      { label: "Seditious Meetings Act (1907)", slot: "admin" },
      {
        label: "Morley–Minto Reforms / Indian Councils Act (1909), separate electorates",
        slot: "admin",
        series: s("councils", 3),
      },
      { label: "S. P. Sinha joins Viceroy's Executive Council (1909)", slot: "admin" },
      { label: "TISCO established (1907)", slot: "land" },
      { label: "Newspapers (Incitement to Offences) Act (1908)", slot: "edu" },
      { label: "Indian Press Act (1910)", slot: "edu" },
      { label: "Muslim League founded at Dacca (1906)", slot: "revolt" },
      { label: "Jugantar group, Bengal (1906)", slot: "revolt" },
      { label: "Surat Split (1907)", slot: "revolt" },
    ],
  },
  {
    id: "hardinge-2",
    short: "Hardinge II",
    name: "Lord Hardinge II",
    era: "viceroy",
    start: "1910-11",
    end: "1916-04",
    events: [
      { label: "World War I begins (1914)", slot: "wars" },
      { label: "McMahon Line, Simla Convention (1914)", slot: "wars" },
      { label: "3rd Delhi Durbar (1911)", slot: "admin", series: s("durbar", 3) },
      { label: "Partition of Bengal annulled (1911)", slot: "admin" },
      { label: "Capital: Calcutta → Delhi (1911)", slot: "admin" },
      { label: "Bihar & Orissa separated from Bengal (1912)", slot: "admin" },
      { label: "Banaras Hindu University (1916)", slot: "edu" },
      { label: "Delhi Conspiracy: bomb at Hardinge (1912)", slot: "revolt" },
      { label: "Ghadar Party (1913)", slot: "revolt" },
      { label: "Komagata Maru (1914)", slot: "revolt" },
      { label: "Ghadar Mutiny (1915)", slot: "revolt" },
      { label: "Gandhi returns from South Africa (1915)", slot: "revolt" },
      { label: "Hindu Mahasabha (1915)", slot: "revolt" },
    ],
  },
  {
    id: "chelmsford",
    short: "Chelmsford",
    name: "Lord Chelmsford",
    era: "viceroy",
    start: "1916-04",
    end: "1921-04",
    events: [
      { label: "August Declaration (20 Aug 1917)", slot: "admin" },
      { label: "Rowlatt Act (1919)", slot: "admin" },
      { label: "Montagu–Chelmsford Reforms / GoI Act (1919), dyarchy", slot: "admin" },
      { label: "SNDT Women's University, D. K. Karve (1916)", slot: "edu" },
      { label: "Sadler Commission (1917)", slot: "edu" },
      { label: "Aligarh Muslim University (1920)", slot: "edu" },
      { label: "Home Rule Leagues (1916)", slot: "revolt" },
      { label: "Lucknow Pact (1916)", slot: "revolt" },
      { label: "Champaran Satyagraha (1917)", slot: "revolt" },
      { label: "Kheda & Ahmedabad mill strike (1918)", slot: "revolt" },
      { label: "Jallianwala Bagh (13 Apr 1919)", slot: "revolt" },
      { label: "Khilafat Movement (1919–20)", slot: "revolt" },
      { label: "Non-Cooperation Movement (1920)", slot: "revolt" },
    ],
  },
  {
    id: "reading",
    short: "Reading",
    name: "Lord Reading",
    era: "viceroy",
    start: "1921-04",
    end: "1926-04",
    events: [
      { label: "Rowlatt Act repealed", slot: "admin" },
      { label: "Lee Commission on public services (1923)", slot: "admin" },
      { label: "Imperial Bank of India (1921)", slot: "land" },
      { label: "Railway budget separated (1924)", slot: "land" },
      { label: "Press Act, 1910 repealed", slot: "edu" },
      { label: "Visva-Bharati, Rabindranath Tagore (1921)", slot: "edu" },
      { label: "Moplah Rebellion (1921)", slot: "revolt" },
      { label: "Chauri Chaura; NCM withdrawn (1922)", slot: "revolt" },
      { label: "Swaraj Party (1923)", slot: "revolt" },
      { label: "Kakori train robbery (1925)", slot: "revolt" },
      { label: "RSS, K. B. Hedgewar (1925)", slot: "revolt" },
      { label: "CPI formalised at Kanpur (1925)", slot: "revolt" },
    ],
  },
  {
    id: "irwin",
    short: "Irwin",
    name: "Lord Irwin",
    era: "viceroy",
    start: "1926-04",
    end: "1931-04",
    events: [
      { label: "Simon Commission (1927–28)", slot: "admin" },
      { label: "Deepavali Declaration on dominion status (1929)", slot: "admin" },
      { label: "1st Round Table Conference (1930)", slot: "admin", series: s("rtc", 1) },
      { label: "Gandhi–Irwin Pact (1931)", slot: "admin" },
      { label: "Hartog Committee (1929)", slot: "edu" },
      { label: "Child Marriage Restraint (Sarda) Act (1929)", slot: "social" },
      { label: "Nehru Report (1928)", slot: "revolt" },
      { label: "Death of Lala Lajpat Rai (1928)", slot: "revolt" },
      { label: "Bardoli Satyagraha (1928)", slot: "revolt" },
      { label: "Jinnah's Fourteen Points (1929)", slot: "revolt" },
      { label: "Meerut Conspiracy Case (1929)", slot: "revolt" },
      { label: "Assembly bomb, Bhagat Singh & B. K. Dutt (1929)", slot: "revolt" },
      { label: "Purna Swaraj, Lahore session (1929)", slot: "revolt" },
      { label: "Civil Disobedience & Dandi March (1930)", slot: "revolt" },
      { label: "Dharasana Satyagraha (1930)", slot: "revolt" },
      { label: "Chittagong Armoury Raid (1930)", slot: "revolt" },
      { label: "Iqbal's Allahabad address (1930)", slot: "revolt" },
      { label: "Bhagat Singh, Rajguru, Sukhdev executed (1931)", slot: "revolt" },
    ],
  },
  {
    id: "willingdon",
    short: "Willingdon",
    name: "Lord Willingdon",
    era: "viceroy",
    start: "1931-04",
    end: "1936-04",
    events: [
      { label: "2nd Round Table Conference (1931)", slot: "admin", series: s("rtc", 2) },
      { label: "Communal Award (1932)", slot: "admin" },
      { label: "3rd Round Table Conference (1932)", slot: "admin", series: s("rtc", 3) },
      { label: "Government of India Act (1935), provincial autonomy", slot: "admin" },
      { label: "Reserve Bank of India Act (1934)", slot: "land" },
      { label: "Poona Pact, Gandhi & Ambedkar (1932)", slot: "revolt" },
      { label: "'Now or Never' coins 'Pakistan' (1933)", slot: "revolt" },
      { label: "Congress Socialist Party (1934)", slot: "revolt" },
      { label: "All India Kisan Sabha (1936)", slot: "revolt" },
    ],
  },
  {
    id: "linlithgow",
    short: "Linlithgow",
    name: "Lord Linlithgow",
    era: "viceroy",
    start: "1936-04",
    end: "1943-10",
    hook: "Longest-serving Viceroy",
    events: [
      { label: "India declared belligerent in WWII (1939)", slot: "wars" },
      { label: "Provincial elections; Congress ministries (1937)", slot: "admin" },
      { label: "August Offer (1940)", slot: "admin" },
      { label: "Cripps Mission (1942)", slot: "admin" },
      { label: "Bengal Famine (1943)", slot: "land" },
      { label: "Congress ministries resign (1939)", slot: "revolt" },
      { label: "Day of Deliverance (1939)", slot: "revolt" },
      { label: "Forward Bloc, Subhas Bose (1939)", slot: "revolt" },
      { label: "Lahore Resolution (1940)", slot: "revolt" },
      { label: "Individual Satyagraha (1940)", slot: "revolt" },
      { label: "Bose escapes India (1941)", slot: "revolt" },
      { label: "Quit India (8 Aug 1942)", slot: "revolt" },
      { label: "First INA, Mohan Singh (1942)", slot: "revolt" },
    ],
  },
  {
    id: "wavell",
    short: "Wavell",
    name: "Lord Wavell",
    era: "viceroy",
    start: "1943-10",
    end: "1947-03",
    events: [
      { label: "End of World War II (1945)", slot: "wars" },
      { label: "Wavell Plan & Simla Conference (1945)", slot: "admin" },
      { label: "Cabinet Mission (1946)", slot: "admin" },
      { label: "Interim Government (2 Sep 1946)", slot: "admin" },
      { label: "Constituent Assembly first meets (9 Dec 1946)", slot: "admin" },
      { label: "Attlee's June 1948 deadline (Feb 1947)", slot: "admin" },
      { label: "Bose leads INA; Azad Hind Govt (1943)", slot: "revolt" },
      { label: "C. R. Formula (1944)", slot: "revolt" },
      { label: "Gandhi–Jinnah talks (1944)", slot: "revolt" },
      { label: "INA trials at Red Fort (1945)", slot: "revolt" },
      { label: "RIN Mutiny (1946)", slot: "revolt" },
      { label: "Direct Action Day (16 Aug 1946)", slot: "revolt" },
    ],
  },
  {
    id: "mountbatten",
    short: "Mountbatten",
    name: "Lord Mountbatten",
    era: "viceroy",
    start: "1947-03",
    end: "1947-08",
    hook: "Last Viceroy",
    events: [
      { label: "Stayed on as first G-G of independent India (1947–48)", slot: "legacy" },
      { label: "Mountbatten Plan / 3 June Plan (1947)", slot: "admin" },
      { label: "Indian Independence Act (18 Jul 1947)", slot: "admin" },
      { label: "Radcliffe Boundary Commission", slot: "admin" },
      { label: "Independence & Partition (15 Aug 1947)", slot: "admin" },
    ],
  },
];

/** "1823-08" → 1823.58 */
export const toYear = (ym: string): number => {
  const [y, m] = ym.split("-").map(Number);
  return y + (m - 1) / 12;
};

export const tenureYears = (g: Governor): number => toYear(g.end) - toYear(g.start);

/** "1823–1828" / "1823" */
export const tenureLabel = (g: Governor): string => {
  const a = g.start.slice(0, 4);
  const b = g.end.slice(0, 4);
  return a === b ? a : `${a}–${b}`;
};

/** "4.6 years" / "5 months" */
export const durationLabel = (g: Governor): string => {
  const y = tenureYears(g);
  if (y < 1) {
    const m = Math.max(1, Math.round(y * 12));
    return `${m} month${m === 1 ? "" : "s"}`;
  }
  return `${y.toFixed(1)} years`;
};

/** Gets a thin unlabelled sliver on the zoomed strip (Cornwallis's brief second term). */
export const isSliver = (g: Governor): boolean => g.events.length === 0;

/** Same title, different men; the card links each to its namesake. */
export const NAMESAKES: Record<string, string> = {
  "warren-hastings": "lord-hastings",
  "lord-hastings": "warren-hastings",
  "minto-1": "minto-2",
  "minto-2": "minto-1",
  "elgin-1": "elgin-2",
  "elgin-2": "elgin-1",
  "hardinge-1": "hardinge-2",
  "hardinge-2": "hardinge-1",
};
