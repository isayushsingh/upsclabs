// Assigns each river's top-level `system` (Indus/Ganga/Brahmaputra/...) by
// hand, grounded in the state(s) each river's original geometry came from
// (lib/parks/rivers.json) and cross-checked against the raw WRIS ba_name
// tags. Run once via node.

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const path = join(root, "lib/geo/rivers.json");
const rivers = JSON.parse(readFileSync(path, "utf8"));

const SYSTEM_OF = {
  // Indus
  Indus: "Indus", Jhelum: "Indus", Chenab: "Indus", Ravi: "Indus", Beas: "Indus",
  Sutlej: "Indus", Pin: "Indus", Tirthan: "Indus", Markha: "Indus",
  // Ganga
  Ganga: "Ganga", Yamuna: "Ganga", Bhagirathi: "Ganga", Ghaghara: "Ganga",
  Gandak: "Ganga", "Burhi Gandak": "Ganga", Kosi: "Ganga", Son: "Ganga",
  "North Koel": "Ganga", Rihand: "Ganga", Johilla: "Ganga", Chambal: "Ganga",
  Banas: "Ganga", Sindh: "Ganga", Betwa: "Ganga", Ken: "Ganga",
  "Kali Sindh": "Ganga", Parbati: "Ganga", Kuno: "Ganga", Tons: "Ganga",
  Supin: "Ganga", Song: "Ganga", Ramganga: "Ganga", Gomti: "Ganga",
  Rapti: "Ganga", Sarda: "Ganga", Baghmati: "Ganga", Mahananda: "Ganga",
  Damodar: "Ganga", Barakar: "Ganga", Hooghly: "Ganga", Pandai: "Ganga",
  Gopad: "Ganga", Auranga: "Ganga",
  // Brahmaputra
  Brahmaputra: "Brahmaputra", "Burhi Dihing": "Brahmaputra", Dhansiri: "Brahmaputra",
  Dihang: "Brahmaputra", Diphlu: "Brahmaputra", Kameng: "Brahmaputra",
  Lohit: "Brahmaputra", Manas: "Brahmaputra", Rangit: "Brahmaputra",
  Teesta: "Brahmaputra", Siang: "Brahmaputra", Sankosh: "Brahmaputra",
  Raidak: "Brahmaputra", Torsa: "Brahmaputra", Jaldhaka: "Brahmaputra",
  Jayanti: "Brahmaputra", Murti: "Brahmaputra", Kopili: "Brahmaputra",
  // Barak (flows south to the Surma/Meghna, not the Brahmaputra)
  Barak: "Barak", Mahadeo: "Barak",
  // Narmada
  Narmada: "Narmada", Tawa: "Narmada", Denwa: "Narmada", Banjar: "Narmada", Halon: "Narmada",
  // Tapi
  Tapi: "Tapi",
  // Mahi
  Mahi: "Mahi",
  // Godavari
  Godavari: "Godavari", Indravati: "Godavari", Pench: "Godavari",
  Wainganga: "Godavari", Andhari: "Godavari",
  // Krishna
  Krishna: "Krishna", Bhima: "Krishna", Tungabhadra: "Krishna",
  // Cauvery
  Cauvery: "Cauvery", Kabini: "Cauvery", Kolidam: "Cauvery", Moyar: "Cauvery",
  // Mahanadi
  Mahanadi: "Mahanadi", Tel: "Mahanadi",
  // Brahmani-Baitarani
  Baitarani: "Brahmani-Baitarani", Brahmani: "Brahmani-Baitarani", Sankh: "Brahmani-Baitarani",
  // East-flowing minor peninsular rivers (independent of Godavari/Krishna/Cauvery)
  Adyar: "East Flowing Peninsular Rivers", Palar: "East Flowing Peninsular Rivers",
  Penner: "East Flowing Peninsular Rivers", Swarnamukhi: "East Flowing Peninsular Rivers",
  // West-flowing minor peninsular rivers (independent of Narmada/Tapi/Mahi)
  Ambika: "West Flowing Peninsular Rivers", Pamba: "West Flowing Peninsular Rivers",
  Periyar: "West Flowing Peninsular Rivers", Shetrunji: "West Flowing Peninsular Rivers",
  // Kaladan — flows south through Mizoram into Myanmar, its own outlet
  "Chhimtuipui (Kaladan)": "Kaladan",
};

const missing = rivers.filter((r) => !SYSTEM_OF[r.name]);
if (missing.length) {
  console.error("No system assigned for:", missing.map((r) => r.name));
  process.exit(1);
}
const extra = Object.keys(SYSTEM_OF).filter((n) => !rivers.some((r) => r.name === n));
if (extra.length) {
  console.error("SYSTEM_OF has unknown names:", extra);
  process.exit(1);
}

for (const r of rivers) r.system = SYSTEM_OF[r.name];

writeFileSync(path, JSON.stringify(rivers, null, 2) + "\n");
console.log(`Assigned system to all ${rivers.length} rivers.`);

const bySystem = {};
for (const r of rivers) bySystem[r.system] = (bySystem[r.system] ?? 0) + 1;
console.log(bySystem);
