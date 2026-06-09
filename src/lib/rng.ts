// Deterministic, seedable PRNG so a (seed, roster) pair always reproduces the
// exact same simulated season — the basis for shareable results.

export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// build a 0..1 RNG from any string (seed + namespace)
export function rngFrom(...parts: (string | number)[]): () => number {
  const seedFn = xmur3(parts.join("|"));
  return mulberry32(seedFn());
}

// random integer seed for a fresh game
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

// weighted pick from a list using a 0..1 sample
export function weightedPick<T>(
  items: T[],
  weightOf: (t: T) => number,
  sample: number
): T {
  const total = items.reduce((a, it) => a + Math.max(0, weightOf(it)), 0);
  let r = sample * total;
  for (const it of items) {
    r -= Math.max(0, weightOf(it));
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}
