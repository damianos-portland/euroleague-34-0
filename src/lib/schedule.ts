// The 34-game opponent slate: 17 EuroLeague clubs, played home & away.
// Base strengths (0..1) loosely reflect modern-era pedigree — they set how
// hard each opponent is, and therefore how rare a 34-0 run should be.

export interface Club {
  name: string;
  short: string;
  base: number;
}

export const CLUBS: Club[] = [
  { name: "Real Madrid", short: "RMB", base: 0.65 },
  { name: "Panathinaikos", short: "PAO", base: 0.64 },
  { name: "Olympiacos", short: "OLY", base: 0.63 },
  { name: "FC Barcelona", short: "BAR", base: 0.63 },
  { name: "CSKA Moscow", short: "CSK", base: 0.62 },
  { name: "Fenerbahçe", short: "FEN", base: 0.6 },
  { name: "Anadolu Efes", short: "EFS", base: 0.58 },
  { name: "Maccabi Tel Aviv", short: "MAC", base: 0.56 },
  { name: "Žalgiris Kaunas", short: "ZAL", base: 0.54 },
  { name: "AS Monaco", short: "MON", base: 0.53 },
  { name: "Virtus Bologna", short: "VIR", base: 0.51 },
  { name: "EA7 Milan", short: "MIL", base: 0.51 },
  { name: "Baskonia", short: "BKN", base: 0.5 },
  { name: "Crvena Zvezda", short: "RED", base: 0.49 },
  { name: "Partizan", short: "PAR", base: 0.48 },
  { name: "Valencia", short: "VAL", base: 0.47 },
  { name: "ASVEL", short: "ASV", base: 0.45 },
];

export interface ScheduledGame {
  index: number; // 1..34
  opponent: string;
  short: string;
  home: boolean;
  oppStrength: number;
}

// Build the 34-game home/away schedule, deterministically jittered per seed.
export function buildSchedule(rand: () => number): ScheduledGame[] {
  const games: ScheduledGame[] = [];
  // interleave away/home legs so the slate isn't front/back loaded
  const order = CLUBS.map((_, i) => i);
  // simple seeded shuffle
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  let idx = 1;
  for (const home of [false, true]) {
    for (const ci of order) {
      const c = CLUBS[ci];
      const jitter = (rand() - 0.5) * 0.08; // ±0.04 form swing
      const oppStrength = clamp(c.base + jitter, 0.4, 0.95);
      games.push({
        index: idx++,
        opponent: c.name,
        short: c.short,
        home,
        oppStrength,
      });
    }
  }
  return games;
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}
