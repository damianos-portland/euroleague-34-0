// The simulation engine.
//
// Honors the 82-0 ruleset adapted to EuroLeague:
//  - every one of the 5 box-score categories matters (PTS/REB/AST/STL/BLK)
//  - stats are era-adjusted (each card already carries z-scores vs its window)
//  - the strength→wins relationship is NON-LINEAR, and a deficiency in even one
//    category caps your ceiling (geometric mean across categories)
//
// A perfect 34-0 requires winning every game, so the per-game edge must be huge
// AND balanced across all five categories.
import type { CatKey, PlayerCard } from "./types";
import { rngFrom } from "./rng";
import { buildSchedule, type ScheduledGame } from "./schedule";

const CATS: CatKey[] = ["pts", "reb", "ast", "stl", "blk"];

export interface CategoryBreakdown {
  key: CatKey;
  label: string;
  teamZ: number; // summed era-adjusted z across the 5 picks
  score: number; // 0..1
}

export interface GameResult {
  index: number;
  opponent: string;
  short: string;
  home: boolean;
  win: boolean;
  you: number;
  them: number;
  winProb: number;
}

export interface SeasonResult {
  wins: number;
  losses: number;
  perfect: boolean;
  firstLossIndex: number | null;
  strength: number; // 0..1 balance-aware
  rating: number; // 0..100 display
  weakest: CategoryBreakdown;
  categories: CategoryBreakdown[];
  games: GameResult[];
  perfectOdds: number; // modeled probability this roster goes 34-0
}

const CAT_LABEL: Record<CatKey, string> = {
  pts: "Points",
  reb: "Rebounds",
  ast: "Assists",
  stl: "Steals",
  blk: "Blocks",
};

function logistic(x: number) {
  return 1 / (1 + Math.exp(-x));
}
function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

// Per-player average z in a category → 0..1 via logistic.
// 5 elite contributors average ~+1.5z; this maps that to ~0.85.
function catScore(teamZ: number): number {
  const perPlayer = teamZ / 5;
  return logistic(perPlayer / 0.8);
}

export function evaluateRoster(roster: PlayerCard[]): {
  strength: number;
  rating: number;
  categories: CategoryBreakdown[];
  weakest: CategoryBreakdown;
} {
  const categories: CategoryBreakdown[] = CATS.map((key) => {
    const teamZ = roster.reduce((a, c) => a + (c.adj[key] ?? 0), 0);
    return { key, label: CAT_LABEL[key], teamZ: round2(teamZ), score: catScore(teamZ) };
  });
  // geometric mean → any weak category drags the whole roster down
  const product = categories.reduce((a, c) => a * Math.max(0.001, c.score), 1);
  const strength = Math.pow(product, 1 / categories.length);
  const weakest = categories.reduce((a, b) => (b.score < a.score ? b : a));
  return {
    strength,
    rating: Math.round(strength * 100),
    categories,
    weakest,
  };
}

// Map strength + opponent into a per-game win probability.
const K = 8; // sharpness of the win curve (tuned: optimal roster ~11% to go 34-0)
const HOME = 0.04; // home-court edge on the 0..1 strength scale
const P_CAP = 0.99; // even a juggernaut can be upset

function gameWinProb(strength: number, g: ScheduledGame): number {
  const edge = strength - g.oppStrength + (g.home ? HOME : -HOME * 0.5);
  return clamp(logistic(K * edge), 0.02, P_CAP);
}

function makeScore(
  rand: () => number,
  win: boolean,
  strength: number
): { you: number; them: number } {
  // EuroLeague games typically land in the 70s–80s
  const base = 76 + Math.round((strength - 0.6) * 16);
  const them = base + Math.round((rand() - 0.5) * 12);
  const margin = 1 + Math.floor(rand() * 14);
  const you = win ? them + margin : them - margin;
  return { you, them };
}

export function simulateSeason(
  roster: PlayerCard[],
  seed: number | string
): SeasonResult {
  const { strength, rating, categories, weakest } = evaluateRoster(roster);
  const schedRand = rngFrom(seed, "schedule");
  const schedule = buildSchedule(schedRand);
  const gameRand = rngFrom(seed, "games");

  const games: GameResult[] = [];
  let wins = 0;
  let losses = 0;
  let firstLossIndex: number | null = null;
  let perfectOdds = 1;

  for (const g of schedule) {
    const p = gameWinProb(strength, g);
    perfectOdds *= p;
    const win = gameRand() < p;
    const { you, them } = makeScore(gameRand, win, strength);
    if (win) wins++;
    else {
      losses++;
      if (firstLossIndex === null) firstLossIndex = g.index;
    }
    games.push({
      index: g.index,
      opponent: g.opponent,
      short: g.short,
      home: g.home,
      win,
      you,
      them,
      winProb: p,
    });
  }

  return {
    wins,
    losses,
    perfect: losses === 0,
    firstLossIndex,
    strength,
    rating,
    weakest,
    categories,
    games,
    perfectOdds,
  };
}

function round2(x: number) {
  return Math.round(x * 100) / 100;
}
