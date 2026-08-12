// lib/orgs/continents.ts
// ISO3 → continent, for the "members by continent" breakdown in an
// org's header. Six-continent scheme (Americas split North/South, no
// Antarctica since no org here has an Antarctic member... except literally
// the Antarctic Treaty, which has no *country* located there either).
// Two deliberate calls on transcontinental countries, matching how these
// organizations themselves are usually discussed rather than strict
// landmass geography: Turkey and Russia are grouped under Europe (both
// are quoted using their Europe-adjacent memberships — Turkey in NATO/
// OECD, Russia in G20/BRICS — with a "Eurasian" identity nobody actually
// enumerates as its own bucket for a UPSC audience); Cyprus, an EU member
// state, is Europe rather than the UN geoscheme's "Western Asia".
export type Continent =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania";

export const CONTINENT_BY_ISO3: Record<string, Continent> = {
  // Africa
  AGO: "Africa", BDI: "Africa", BEN: "Africa", BFA: "Africa", BWA: "Africa",
  CAF: "Africa", CIV: "Africa", CMR: "Africa", COD: "Africa", COG: "Africa",
  COM: "Africa", CPV: "Africa", DJI: "Africa", DZA: "Africa", EGY: "Africa",
  ERI: "Africa", ESH: "Africa", ETH: "Africa", GAB: "Africa", GHA: "Africa",
  GIN: "Africa", GMB: "Africa", GNB: "Africa", GNQ: "Africa", KEN: "Africa",
  LBR: "Africa", LBY: "Africa", LSO: "Africa", MAR: "Africa", MDG: "Africa",
  MLI: "Africa", MOZ: "Africa", MRT: "Africa", MUS: "Africa", MWI: "Africa",
  NAM: "Africa", NER: "Africa", NGA: "Africa", RWA: "Africa", SDN: "Africa",
  SEN: "Africa", SLE: "Africa", SOM: "Africa", SSD: "Africa", STP: "Africa",
  SWZ: "Africa", SYC: "Africa", TCD: "Africa", TGO: "Africa", TUN: "Africa",
  TZA: "Africa", UGA: "Africa", ZAF: "Africa", ZMB: "Africa", ZWE: "Africa",

  // Asia
  AFG: "Asia", ARE: "Asia", ARM: "Asia", AZE: "Asia", BGD: "Asia",
  BHR: "Asia", BRN: "Asia", BTN: "Asia", CHN: "Asia", IDN: "Asia",
  IND: "Asia", IRN: "Asia", IRQ: "Asia", ISR: "Asia", JOR: "Asia",
  JPN: "Asia", KAZ: "Asia", KGZ: "Asia", KHM: "Asia", KOR: "Asia",
  KWT: "Asia", LAO: "Asia", LBN: "Asia", LKA: "Asia", MDV: "Asia",
  MMR: "Asia", MNG: "Asia", MYS: "Asia", NPL: "Asia", OMN: "Asia",
  PAK: "Asia", PHL: "Asia", PRK: "Asia", PSE: "Asia", QAT: "Asia",
  SAU: "Asia", SGP: "Asia", SYR: "Asia", THA: "Asia", TJK: "Asia",
  TKM: "Asia", TLS: "Asia", UZB: "Asia", VNM: "Asia", YEM: "Asia",

  // Europe
  ALB: "Europe", AUT: "Europe", BEL: "Europe", BGR: "Europe", BLR: "Europe",
  CHE: "Europe", CYP: "Europe", CZE: "Europe", DEU: "Europe", DNK: "Europe",
  ESP: "Europe", EST: "Europe", FIN: "Europe", FRA: "Europe", GBR: "Europe",
  GRC: "Europe", HRV: "Europe", HUN: "Europe", IRL: "Europe", ISL: "Europe",
  ITA: "Europe", LTU: "Europe", LUX: "Europe", LVA: "Europe", MCO: "Europe",
  MKD: "Europe", MLT: "Europe", MNE: "Europe", NLD: "Europe", NOR: "Europe",
  POL: "Europe", PRT: "Europe", ROU: "Europe", RUS: "Europe", SVK: "Europe",
  SVN: "Europe", SWE: "Europe", TUR: "Europe", UKR: "Europe",

  // North America (incl. Central America & Caribbean)
  CAN: "North America", CRI: "North America", CUB: "North America",
  GTM: "North America", MEX: "North America", USA: "North America",

  // South America
  ARG: "South America", BRA: "South America", CHL: "South America",
  COL: "South America", ECU: "South America", PER: "South America",
  URY: "South America", VEN: "South America",

  // Oceania
  AUS: "Oceania", NZL: "Oceania", PNG: "Oceania",
};
