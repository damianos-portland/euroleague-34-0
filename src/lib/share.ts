// Encode/decode a finished run into a compact URL hash so results are shareable
// and fully reproducible: same seed + same 5 picks => identical season.
// Each pick records both the card id and the club it was drafted from (a card
// can belong to several clubs in an era, so we keep the chosen one for display).
import type { GameMode } from "./types";

export interface SharePick {
  id: string;
  teamCode: string;
}

export interface ShareState {
  seed: number;
  mode: GameMode;
  picks: SharePick[];
}

export function encodeShare(s: ShareState): string {
  const picks = s.picks.map((p) => `${p.id}@${p.teamCode}`).join("-");
  return `${s.seed}.${s.mode === "hoopiq" ? "h" : "c"}.${picks}`;
}

export function decodeShare(hash: string): ShareState | null {
  try {
    const clean = hash.replace(/^#/, "");
    const [seedStr, modeStr, picksStr] = clean.split(".");
    const seed = Number(seedStr);
    if (!Number.isFinite(seed) || !picksStr) return null;
    const picks = picksStr
      .split("-")
      .filter(Boolean)
      .map((tok) => {
        const [id, teamCode] = tok.split("@");
        return { id, teamCode: teamCode ?? "" };
      });
    if (picks.length !== 5 || picks.some((p) => !p.id)) return null;
    return { seed, mode: modeStr === "h" ? "hoopiq" : "classic", picks };
  } catch {
    return null;
  }
}
