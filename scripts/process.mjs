// Builds the game dataset from raw season files + scraped positions.
// Output: src/data/dataset.json  { eras, clubs, players, baselines }
//
// Model:
//  - 18 canonical clubs (top-18 by EuroLeague participation since 2000)
//  - 5 era windows (2000-04, 2005-09, 2010-14, 2015-19, 2020-24)
//  - ONE card per (player, era) = games-weighted average of his per-game stats
//    across ALL his qualifying seasons in that window ("era overall")
//  - each card carries an official position (G/F/C) and the subset of the 18
//    clubs he had a real stint with that era (he's pickable from each)
//  - roster is positional: 2 Guards, 2 Forwards, 1 Center
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, "..", "data", "raw");
const OUT_DIR = join(__dirname, "..", "src", "data");

// the 18 canonical clubs, ordered by participations (raw code -> display name)
const CLUBS = [
  ["OLY", "Olympiacos"],
  ["BAR", "FC Barcelona"],
  ["BAS", "Baskonia"],
  ["ZAL", "Žalgiris Kaunas"],
  ["PAN", "Panathinaikos"],
  ["MAD", "Real Madrid"],
  ["ULK", "Fenerbahçe"],
  ["IST", "Anadolu Efes"],
  ["TEL", "Maccabi Tel Aviv"],
  ["CSK", "CSKA Moscow"],
  ["MAL", "Unicaja Málaga"],
  ["MIL", "Olimpia Milano"],
  ["PAR", "Partizan"],
  ["BER", "ALBA Berlin"],
  ["CIB", "Cibona"],
  ["ASV", "ASVEL"],
  ["SIE", "Montepaschi Siena"],
  ["RED", "Crvena Zvezda"],
];
const CLUB_NAME = new Map(CLUBS);
const CLUB_SET = new Set(CLUB_NAME.keys());

const ERAS = [
  { id: "2000-04", label: "2000–2004", start: 2000, end: 2004 },
  { id: "2005-09", label: "2005–2009", start: 2005, end: 2009 },
  { id: "2010-14", label: "2010–2014", start: 2010, end: 2014 },
  { id: "2015-19", label: "2015–2019", start: 2015, end: 2019 },
  { id: "2020-24", label: "2020–2025", start: 2020, end: 2024 },
];

const CATS = ["pts", "reb", "ast", "stl", "blk"];
const MIN_GAMES = 6;
const MIN_MINUTES = 8;
const MIN_ERA_GAMES = 10;

function eraForYear(year) {
  return ERAS.find((e) => year >= e.start && year <= e.end)?.id ?? null;
}
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const std = (xs, m) => Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) || 1;
const round1 = (x) => Math.round(x * 10) / 10;
const round2 = (x) => Math.round(x * 100) / 100;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

async function main() {
  const positions = JSON.parse(
    await readFile(join(__dirname, "..", "data", "positions.json"), "utf8")
  );
  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json"));

  // group qualifying player-seasons by player|era
  const groups = new Map();
  // latest non-empty images: player headshots + the 18 club crests
  const playerImg = new Map(); // code -> { year, url }
  const clubCrest = new Map(); // code -> { year, url }
  for (const file of files) {
    const year = Number(file.replace("E", "").replace(".json", ""));
    const era = eraForYear(year);
    if (!era) continue;
    const rows = JSON.parse(await readFile(join(RAW_DIR, file), "utf8"));
    for (const r of rows) {
      const p0 = r.player ?? {};
      const t0 = p0.team ?? {};
      // collect images from every row, regardless of stat qualification
      if (p0.code && p0.imageUrl) {
        const prev = playerImg.get(p0.code);
        if (!prev || year >= prev.year) playerImg.set(p0.code, { year, url: p0.imageUrl });
      }
      if (t0.code && CLUB_SET.has(t0.code) && t0.imageUrl) {
        const prev = clubCrest.get(t0.code);
        if (!prev || year >= prev.year) clubCrest.set(t0.code, { year, url: t0.imageUrl });
      }

      const gp = r.gamesPlayed ?? 0;
      const min = r.minutesPlayed ?? 0;
      if (gp < MIN_GAMES || min < MIN_MINUTES) continue;
      const p = r.player ?? {};
      const team = p.team ?? {};
      if (!p.code || !team.code) continue;
      const key = `${p.code}|${era}`;
      if (!groups.has(key))
        groups.set(key, { code: p.code, name: p.name, era, seasons: [] });
      groups.get(key).seasons.push({
        year,
        teamCode: team.code,
        teamName: team.name,
        gp,
        pts: r.pointsScored ?? 0,
        reb: r.totalRebounds ?? 0,
        ast: r.assists ?? 0,
        stl: r.steals ?? 0,
        blk: r.blocks ?? 0,
        pir: r.pir ?? 0,
      });
    }
  }

  let all = [];
  let droppedNoPos = 0;
  let droppedNoClub = 0;
  for (const [, g] of groups) {
    const totalGp = g.seasons.reduce((a, s) => a + s.gp, 0);
    if (totalGp < MIN_ERA_GAMES) continue;

    const pos = positions[g.code]?.pos; // G|F|C
    if (!pos) {
      droppedNoPos++;
      continue;
    }

    // clubs among the 18 he had a real stint with this era
    const clubGames = new Map(); // canonicalCode -> {gp, last, name}
    for (const s of g.seasons) {
      if (!CLUB_SET.has(s.teamCode)) continue;
      if (!clubGames.has(s.teamCode))
        clubGames.set(s.teamCode, { gp: 0, last: 0 });
      const t = clubGames.get(s.teamCode);
      t.gp += s.gp;
      if (s.year >= t.last) t.last = s.year;
    }
    if (clubGames.size === 0) {
      droppedNoClub++;
      continue;
    }
    const teamList = [...clubGames.entries()].sort((a, b) => b[1].gp - a[1].gp);

    const wavg = (cat) =>
      g.seasons.reduce((a, s) => a + s[cat] * s.gp, 0) / totalGp;
    const years = g.seasons.map((s) => s.year);

    all.push({
      code: g.code,
      name: g.name,
      era: g.era,
      position: pos,
      img: playerImg.get(g.code)?.url ?? null,
      teams: teamList.map(([c]) => c),
      primaryTeam: teamList[0][0],
      primaryTeamName: CLUB_NAME.get(teamList[0][0]),
      seasons: g.seasons.length,
      firstSeason: Math.min(...years),
      lastSeason: Math.max(...years),
      gp: totalGp,
      pts: round1(wavg("pts")),
      reb: round1(wavg("reb")),
      ast: round1(wavg("ast")),
      stl: round1(wavg("stl")),
      blk: round1(wavg("blk")),
      pir: round1(wavg("pir")),
    });
  }

  // per-era baselines for era adjustment
  const baselines = {};
  for (const era of ERAS) {
    const pool = all.filter((c) => c.era === era.id);
    const b = { count: pool.length };
    for (const cat of [...CATS, "pir"]) {
      const xs = pool.map((c) => c[cat]);
      const m = mean(xs);
      b[cat] = { mean: round2(m), std: round2(std(xs, m)) };
    }
    baselines[era.id] = b;
  }
  for (const c of all) {
    const b = baselines[c.era];
    c.adj = {};
    for (const cat of CATS) c.adj[cat] = round2((c[cat] - b[cat].mean) / b[cat].std);
    const zpir = (c.pir - b.pir.mean) / b.pir.std;
    c.overall = clamp(Math.round(50 + 13 * zpir), 1, 99);
  }
  all.forEach((c, i) => (c.id = `p${i}`));

  // clubs with per-era availability + spin weights
  const clubs = CLUBS.map(([code, name]) => {
    const cards = all.filter((c) => c.teams.includes(code));
    const eraMap = {};
    for (const e of ERAS) {
      const ec = cards.filter((c) => c.era === e.id);
      if (ec.length === 0) continue;
      const top = ec.slice().sort((a, b) => b.overall - a.overall).slice(0, 3);
      eraMap[e.id] = {
        count: ec.length,
        weight: top.reduce((a, c) => a + c.overall, 0),
        // position availability helps avoid dead-end spins
        pos: {
          G: ec.filter((c) => c.position === "G").length,
          F: ec.filter((c) => c.position === "F").length,
          C: ec.filter((c) => c.position === "C").length,
        },
      };
    }
    const weight = Object.values(eraMap).reduce((a, e) => a + e.weight, 0);
    return {
      code,
      name,
      crest: clubCrest.get(code)?.url ?? null,
      weight,
      eras: eraMap,
      cardCount: cards.length,
    };
  });

  const players = all.map((c) => ({
    id: c.id,
    name: c.name,
    era: c.era,
    position: c.position,
    img: c.img,
    teams: c.teams,
    primaryTeam: c.primaryTeam,
    primaryTeamName: c.primaryTeamName,
    seasons: c.seasons,
    firstSeason: c.firstSeason,
    lastSeason: c.lastSeason,
    gp: c.gp,
    pts: c.pts,
    reb: c.reb,
    ast: c.ast,
    stl: c.stl,
    blk: c.blk,
    pir: c.pir,
    overall: c.overall,
    adj: c.adj,
  }));

  const dataset = {
    eras: ERAS,
    cats: CATS,
    clubs,
    baselines,
    players,
    meta: {
      builtFromSeasons: files.map((f) => f.replace(".json", "")).sort(),
      cardCount: players.length,
      droppedNoPos,
      droppedNoClub,
    },
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, "dataset.json"), JSON.stringify(dataset));

  // report
  console.log(`cards: ${players.length} (dropped ${droppedNoPos} no-position, ${droppedNoClub} not-on-18-clubs)`);
  const pc = { G: 0, F: 0, C: 0 };
  players.forEach((c) => pc[c.position]++);
  console.log(`positions: G${pc.G} F${pc.F} C${pc.C}`);
  console.log("\nclub coverage (cards per era):");
  for (const cl of clubs) {
    const eras = ERAS.map((e) => `${e.id.slice(2, 4)}:${cl.eras[e.id]?.count ?? "—"}`).join(" ");
    console.log(`  ${cl.code} ${cl.name.padEnd(18)} ${eras}`);
  }
  console.log("\nsample: best by overall per position");
  for (const pos of ["G", "F", "C"]) {
    const top = players.filter((c) => c.position === pos).sort((a, b) => b.overall - a.overall).slice(0, 3);
    console.log(`  ${pos}: ` + top.map((c) => `${c.name.split(",")[0]}(${c.primaryTeamName},${c.overall})`).join(", "));
  }
}

main();
