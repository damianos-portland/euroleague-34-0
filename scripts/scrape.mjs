// Scrapes per-game traditional player stats for EuroLeague seasons E2000–E2024
// from the official v3 stats API and writes one raw JSON file per season.
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, "..", "data", "raw");
const BASE =
  "https://api-live.euroleague.net/v3/competitions/E/statistics/players/traditional";

const FIRST = 2000;
const LAST = 2024; // 2024-25 season

async function fetchSeason(year) {
  const url = new URL(BASE);
  url.searchParams.set("SeasonMode", "Single");
  url.searchParams.set("SeasonCode", `E${year}`);
  url.searchParams.set("statisticMode", "PerGame");
  url.searchParams.set("limit", "400");
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`E${year} -> HTTP ${res.status}`);
  const json = await res.json();
  return json;
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  const summary = [];
  for (let year = FIRST; year <= LAST; year++) {
    try {
      const data = await fetchSeason(year);
      const players = data.players ?? [];
      await writeFile(
        join(RAW_DIR, `E${year}.json`),
        JSON.stringify(players, null, 0)
      );
      summary.push({ year, count: players.length });
      console.log(`E${year}: ${players.length} players`);
    } catch (err) {
      console.error(`E${year} FAILED: ${err.message}`);
      summary.push({ year, count: 0, error: err.message });
    }
    // be polite to the API
    await new Promise((r) => setTimeout(r, 300));
  }
  const total = summary.reduce((a, s) => a + s.count, 0);
  console.log(`\nDone. ${summary.length} seasons, ${total} player-seasons.`);
}

main();
