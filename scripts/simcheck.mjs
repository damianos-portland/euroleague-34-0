// Calibration check: ports the sim math to verify 34-0 odds across roster tiers.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ds = JSON.parse(
  await readFile(join(__dirname, "..", "src", "data", "dataset.json"), "utf8")
);

const CATS = ["pts", "reb", "ast", "stl", "blk"];
const logistic = (x) => 1 / (1 + Math.exp(-x));
const catScore = (z) => logistic(z / 5 / 0.8);

function evaluate(roster) {
  const cats = CATS.map((k) => {
    const z = roster.reduce((a, c) => a + (c.adj[k] ?? 0), 0);
    return { k, z, score: catScore(z) };
  });
  const product = cats.reduce((a, c) => a * Math.max(0.001, c.score), 1);
  const strength = Math.pow(product, 1 / cats.length);
  return { strength, rating: Math.round(strength * 100), cats };
}

const CLUB_BASES = [
  0.65, 0.64, 0.63, 0.63, 0.62, 0.6, 0.58, 0.56, 0.54, 0.53, 0.51, 0.51, 0.5,
  0.49, 0.48, 0.47, 0.45,
];

function perfectOddsWith(strength, K, HOME, P_CAP) {
  let odds = 1;
  for (const home of [false, true]) {
    for (const base of CLUB_BASES) {
      const edge = strength - base + (home ? HOME : -HOME * 0.5);
      const p = Math.min(P_CAP, Math.max(0.02, logistic(K * edge)));
      odds *= p;
    }
  }
  return odds;
}
const K = 8,
  HOME = 0.04,
  P_CAP = 0.99;
const perfectOdds = (s) => perfectOddsWith(s, K, HOME, P_CAP);

// Build rosters: one card per era, picking the Nth-best overall in each era.
function rosterByRank(rank) {
  return ds.eras.map((e) => {
    const pool = ds.players
      .filter((p) => p.era === e.id)
      .sort((a, b) => b.overall - a.overall);
    return pool[Math.min(rank, pool.length - 1)];
  });
}

// "best balanced": in each era, pick the card maximizing min category z
function rosterBalanced() {
  return ds.eras.map((e) => {
    const pool = ds.players.filter((p) => p.era === e.id);
    return pool
      .slice()
      .sort(
        (a, b) =>
          Math.min(...CATS.map((k) => b.adj[k])) -
          Math.min(...CATS.map((k) => a.adj[k]))
      )[0];
  });
}

function report(label, roster) {
  const ev = evaluate(roster);
  const odds = perfectOdds(ev.strength);
  console.log(
    `\n${label}: rating ${ev.rating}  strength ${ev.strength.toFixed(3)}  ` +
      `P(34-0) ${(odds * 100).toFixed(2)}%`
  );
  console.log(
    "  cats: " + ev.cats.map((c) => `${c.k} z${c.z.toFixed(1)}/s${c.score.toFixed(2)}`).join("  ")
  );
  console.log("  roster: " + roster.map((c) => `${c.name.split(",")[0]}(${c.overall})`).join(", "));
}

report("Top overall (rank 0)", rosterByRank(0));
report("Best balanced", rosterBalanced());
report("Rank 2", rosterByRank(2));
report("Rank 5", rosterByRank(5));
report("Rank 12", rosterByRank(12));
report("Rank 30 (mediocre)", rosterByRank(30));
