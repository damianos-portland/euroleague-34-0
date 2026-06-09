// Scrapes player positions (Guard/Forward/Center) + height from the EuroLeague
// people endpoint for every season, and writes a player-code -> position map.
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "positions.json");
const BASE = "https://api-live.euroleague.net/v2/competitions/E/seasons";

const FIRST = 2000;
const LAST = 2024;

async function fetchPeople(year) {
  const url = new URL(`${BASE}/E${year}/people`);
  url.searchParams.set("personType", "J");
  url.searchParams.set("limit", "800");
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`E${year} HTTP ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

async function main() {
  // code -> { posCounts: {Guard,Forward,Center}, height }
  const map = new Map();
  for (let year = FIRST; year <= LAST; year++) {
    try {
      const people = await fetchPeople(year);
      let withPos = 0;
      for (const r of people) {
        const code = r.person?.code;
        const pos = r.positionName; // "Guard" | "Forward" | "Center"
        const height = r.person?.height ?? 0;
        if (!code) continue;
        if (!map.has(code)) map.set(code, { posCounts: {}, height: 0 });
        const e = map.get(code);
        if (pos) {
          e.posCounts[pos] = (e.posCounts[pos] ?? 0) + 1;
          withPos++;
        }
        if (height > e.height) e.height = height;
      }
      console.log(`E${year}: ${people.length} people, ${withPos} with position`);
    } catch (err) {
      console.error(`E${year} FAILED: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  // resolve each code to its most frequent position
  const out = {};
  let resolved = 0;
  for (const [code, e] of map) {
    const entries = Object.entries(e.posCounts);
    if (entries.length === 0) continue;
    entries.sort((a, b) => b[1] - a[1]);
    const pos = entries[0][0]; // Guard|Forward|Center
    out[code] = { pos: pos[0], height: e.height }; // G|F|C
    resolved++;
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out));
  const counts = { G: 0, F: 0, C: 0 };
  for (const v of Object.values(out)) counts[v.pos]++;
  console.log(`\nresolved positions for ${resolved} players:`, counts);
}

main();
