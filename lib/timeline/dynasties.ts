// Dynastic + era data for the Ancient India atlas.
// Years are signed: negative = BCE, positive = CE.

export interface Era {
  /** display name */
  n: string;
  /** start year (signed) */
  s: number;
  /** end year (signed) */
  e: number;
  /** roster still being filled out for this era */
  wip?: boolean;
}

export interface Dynasty {
  id: string;
  name: string;
  /** shorter label used on the map when the full name is long */
  short?: string;
  /** pigment-derived fill colour */
  fill: string;
  start: number;
  end: number;
  label: { lng: number; lat: number; anchor: "start" | "middle" | "end"; lead: boolean };
  /** approximate territory ring as [lng, lat] pairs */
  coords: number[][];
}

export const T_MIN = -3300;
export const T_MAX = 1350;

/** year anchors shown beneath the timeline rule */
export const AXIS = [-2000, -600, 0, 600, 1200];

/** Contiguous era bands. `wip` flags eras whose roster is still being filled. */
export const ERAS: Era[] = [
  { n: "Indus Valley",       s: -3300, e: -1500 },
  { n: "Vedic",              s: -1500, e: -600 },
  { n: "Mahajanapadas",      s: -600,  e: -345 },
  { n: "Nanda–Maurya",       s: -345,  e: -185 },
  { n: "Post-Maurya",        s: -185,  e: 100 },
  { n: "Kushana–Satavahana", s: 100,   e: 320 },
  { n: "Gupta",              s: 320,   e: 550 },
  { n: "Post-Gupta",         s: 550,   e: 900 },
  { n: "Early Medieval",     s: 900,   e: 1350, wip: true },
];

export const DYNASTIES: Dynasty[] = [
  { id: "indus", name: "Indus Valley", fill: "#A8895F", start: -3300, end: -1500,
    label: { lng: 72, lat: 27, anchor: "middle", lead: false },
    coords: [[66,28],[68,29.5],[71,31],[74,31],[76.5,30],[77,28],[75,25],[73,22.5],[71,21.5],[70,22.5],[68.5,23.5],[67,24.5],[66,26],[66,28]] },

  { id: "vedic", name: "Vedic", fill: "#9A9152", start: -1500, end: -600,
    label: { lng: 76, lat: 29, anchor: "middle", lead: false },
    coords: [[71,31.5],[74,31],[77,30],[80,28.5],[81,27],[79,26],[76,26.5],[73,28],[71,30],[71,31.5]] },

  { id: "mahajanapadas", name: "Mahajanapadas", fill: "#8C8F86", start: -600, end: -544,
    label: { lng: 80, lat: 28.5, anchor: "middle", lead: false },
    coords: [[73,31],[77,30],[81,28],[85,26.5],[87,25.5],[86,24],[83,24.5],[80,25.5],[77,27],[74,29],[72.5,30],[73,31]] },

  { id: "haryanka", name: "Haryanka", fill: "#5D6E8C", start: -544, end: -413,
    label: { lng: 85.5, lat: 25, anchor: "start", lead: true },
    coords: [[83,26.5],[85.5,26.5],[87.5,25.5],[88,24],[86.5,23.5],[84.5,24],[83,25],[83,26.5]] },

  { id: "shaishunaga", name: "Shaishunaga", fill: "#7A759B", start: -413, end: -345,
    label: { lng: 84, lat: 25, anchor: "middle", lead: false },
    coords: [[80,26],[84,26.5],[87.5,25.5],[88,23.5],[85,23],[81,23.5],[79,24.5],[80,26]] },

  { id: "nanda", name: "Nanda", fill: "#6B4F7A", start: -345, end: -322,
    label: { lng: 81, lat: 26, anchor: "middle", lead: false },
    coords: [[74,30],[78,29],[82,27.5],[86,26],[88,24],[86,22],[82,21.5],[78,22.5],[75,24],[73.5,27],[74,30]] },

  { id: "maurya", name: "Maurya", fill: "#3E5C76", start: -322, end: -185,
    label: { lng: 77.5, lat: 24.5, anchor: "middle", lead: false },
    coords: [[66,33.5],[62.5,30],[66,26],[68,25],[70,23.5],[72.5,20.5],[74,17],[76.5,14.5],[78.5,14],[80.5,15.5],[83.5,18],[86.5,21],[88.5,23.5],[89.5,25.5],[88,27],[84,28.5],[80,29.5],[77,31.5],[74.5,33.5],[70,34.5],[66,33.5]] },

  { id: "shunga", name: "Shunga", fill: "#A36A55", start: -185, end: -73,
    label: { lng: 80, lat: 25, anchor: "middle", lead: false },
    coords: [[75,27],[79,27],[83,25.5],[86,24],[85,22],[81,22],[77,23],[75,25],[75,27]] },

  { id: "kanva", name: "Kanva", fill: "#8A5F6A", start: -75, end: -30,
    label: { lng: 83, lat: 24.3, anchor: "middle", lead: false },
    coords: [[79,26],[82,26],[85,25],[86,23.5],[84,22.5],[81,23],[79,24.5],[79,26]] },

  { id: "indogreek", name: "Indo-Greek", fill: "#9B8550", start: -180, end: 10,
    label: { lng: 70, lat: 33, anchor: "middle", lead: false },
    coords: [[66,35],[69,34],[72,32.5],[75,31],[77,29.5],[76,28],[73,28.5],[70,30],[67,32],[65,33.5],[66,35]] },

  { id: "satavahana", name: "Satavahana", fill: "#8C6A4F", start: -185, end: 220,
    label: { lng: 77.5, lat: 18, anchor: "middle", lead: false },
    coords: [[73,20],[76,20.5],[79,19.5],[82,18],[81,16],[78,15],[75,15.5],[73,17],[72.5,18.5],[73,20]] },

  { id: "indoscythian", name: "Indo-Scythian/Sakas", fill: "#7C8A6B", start: -12, end: 395,
    label: { lng: 72.5, lat: 23, anchor: "middle", lead: false },
    coords: [[67,26],[70,26.5],[74,25],[76,23],[75,21],[72,20.5],[69.5,21.5],[68,23.5],[67,25],[67,26]] },

  { id: "indoparthian", name: "Indo-Parthian", fill: "#8F7A4E", start: 19, end: 226,
    label: { lng: 65.5, lat: 29.5, anchor: "middle", lead: false },
    coords: [[63.5,32.5],[66,33.5],[69,32.5],[71.5,30.5],[71,28.5],[68,28],[65,29],[63,30.5],[63.5,32.5]] },

  { id: "kushan", name: "Kushan", fill: "#6E7B8B", start: 30, end: 320,
    label: { lng: 71, lat: 31.5, anchor: "middle", lead: false },
    coords: [[62,34],[65,30.5],[68,28.5],[71,28],[74,28],[77,27],[80,26.5],[82,27.5],[81,29.5],[78,31],[74,32.5],[70,34],[66,35],[62,34]] },

  { id: "chera", name: "Chera", fill: "#6B8F71", start: -300, end: 1102,
    label: { lng: 73.6, lat: 11.0, anchor: "end", lead: true },
    coords: [[75.2,12.8],[76.0,11.5],[76.8,10.2],[77.3,8.9],[76.9,8.4],[76.2,9.3],[75.4,11.0],[74.9,12.6],[75.2,12.8]] },

  { id: "pandya", name: "Pandya", fill: "#7A5C7E", start: -300, end: 1345,
    label: { lng: 78.0, lat: 7.2, anchor: "middle", lead: true },
    coords: [[77.4,9.0],[78.3,9.6],[79.0,9.3],[78.9,8.4],[78.2,8.1],[77.5,8.2],[77.2,8.7],[77.4,9.0]] },

  { id: "chola", name: "Chola (Sangam)", short: "Chola (Sangam)", fill: "#C08A3E", start: -300, end: 300,
    label: { lng: 81.6, lat: 11.7, anchor: "start", lead: true },
    coords: [[78.5,11.6],[79.5,11.8],[80.2,12.4],[80.0,11.2],[79.6,10.4],[78.9,10.3],[78.4,10.8],[78.5,11.6]] },

  { id: "vakataka", name: "Vakataka", fill: "#80614C", start: 250, end: 500,
    label: { lng: 78, lat: 19.3, anchor: "middle", lead: false },
    coords: [[75,21.5],[78,21.5],[81,20.5],[82,18.5],[80,17],[77,17],[74.5,18.5],[74,20],[75,21.5]] },

  { id: "gupta", name: "Gupta", fill: "#9C5A4A", start: 320, end: 550,
    label: { lng: 80, lat: 25.5, anchor: "middle", lead: false },
    coords: [[72,24],[74,22],[77,20.5],[80,20],[83,19],[86,21],[88,23.5],[89,25.5],[87,27],[83,28],[79,29.5],[76,31],[73,30],[72,27],[72,24]] },

  { id: "pallava", name: "Pallava", fill: "#3F7C7A", start: 275, end: 900,
    label: { lng: 82, lat: 13.2, anchor: "start", lead: true },
    coords: [[78,15],[80,14.5],[80.5,13],[80,11.5],[79,11.5],[78,12.5],[77.5,14],[78,15]] },

  { id: "maukhari", name: "Maukhari", fill: "#7B6E8A", start: 550, end: 606,
    label: { lng: 80.5, lat: 26.6, anchor: "middle", lead: false },
    coords: [[77,28],[80,28.2],[83,27.3],[84,25.7],[82,25],[79,25.3],[77,26.3],[77,28]] },

  { id: "harsha", name: "Vardhana (Harsha)", short: "Harsha", fill: "#57708A", start: 606, end: 647,
    label: { lng: 80, lat: 27, anchor: "middle", lead: false },
    coords: [[74,30],[78,29.5],[82,28],[86,26],[88,24],[85,23],[81,23.5],[78,25],[75,27],[73.5,29],[74,30]] },

  { id: "pratihara", name: "Gurjara-Pratihara", short: "Gurjara-Pratihara", fill: "#9C6B4E", start: 730, end: 1036,
    label: { lng: 74, lat: 25.5, anchor: "middle", lead: false },
    coords: [[70,27],[74,28],[78,27.5],[81,26.5],[80,24.5],[76,23],[72,23],[69.5,24.5],[70,27]] },

  { id: "pala", name: "Pala", fill: "#4E6A8A", start: 750, end: 1161,
    label: { lng: 87.5, lat: 24, anchor: "start", lead: true },
    coords: [[84,26],[87,26],[89.5,25],[90,23],[88,21.5],[85.5,22],[84,23.5],[84,26]] },
  
  { id: "chalukyabadami", name: "Chalukya of Badami", short: "Chalukya (Vatapi)", fill: "#B5894A", start: 543, end: 753,
    label: { lng: 76.5, lat: 16.8, anchor: "middle", lead: false },
    coords: [[74,18.5],[77,18.5],[79,17.5],[79,15.5],[77.5,14.5],[75.5,15],[74,16.5],[73.5,17.5],[74,18.5]] },

  { id: "chalukyakalyani", name: "Western Chalukya (Kalyani)", short: "Chalukya (Kalyani)", fill: "#97703A", start: 973, end: 1189,
    label: { lng: 76.8, lat: 17.6, anchor: "middle", lead: false },
    coords: [[74,19.5],[77,19.5],[79.5,18.5],[79.5,16],[78,15],[75.5,15.5],[74,17],[73.5,18.5],[74,19.5]] },

  { id: "chalukyavengi", name: "Eastern Chalukya (Vengi)", short: "Chalukya (Vengi)", fill: "#C7A35C", start: 624, end: 1075,
    label: { lng: 82, lat: 16.8, anchor: "start", lead: false },
    coords: [[79.5,17.5],[81.5,18],[83,17],[83,15],[81.5,14.5],[80,15],[79.5,16],[79.5,17.5]] },

  { id: "rashtrakuta", name: "Rashtrakuta", fill: "#7A5548", start: 753, end: 982,
    label: { lng: 77, lat: 18, anchor: "middle", lead: false },
    coords: [[73,20.5],[77,20.5],[80,19],[81,16.5],[78,15.5],[75,16],[73,18],[72.5,19.5],[73,20.5]] },

  { id: "cholaimp", name: "Chola (Imperial)", short: "Chola (Imperial)", fill: "#B5732E", start: 900, end: 1279,
    label: { lng: 78.6, lat: 11.4, anchor: "middle", lead: false },
    coords: [[77,15],[80,14.5],[81,12],[80.5,10],[79,8.5],[78,8],[77,9],[76,11],[76.5,13],[77,15]] },
];

export const fmtYear = (y: number): string =>
  y < 0 ? `${Math.abs(Math.round(y))} BCE` : `${Math.round(y)} CE`;

export const fmtRange = (s: number, e: number): string => {
  if (s < 0 && e < 0) return `${Math.abs(s)}\u2013${Math.abs(e)} BCE`;
  if (s < 0 && e >= 0) return `${Math.abs(s)} BCE \u2013 ${e} CE`;
  return `${s}\u2013${e} CE`;
};