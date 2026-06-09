import raw from "@/data/dataset.json";
import type { Club, Dataset, Era, PlayerCard, Position } from "./types";

export const dataset = raw as unknown as Dataset;

export const ERAS = dataset.eras;
export const CLUBS = dataset.clubs;

const byId = new Map<string, PlayerCard>(dataset.players.map((p) => [p.id, p]));
const clubByCode = new Map<string, Club>(dataset.clubs.map((c) => [c.code, c]));

export function cardById(id: string): PlayerCard | undefined {
  return byId.get(id);
}

export function clubByCodeFn(code: string): Club | undefined {
  return clubByCode.get(code);
}

export function eraById(id: string): Era | undefined {
  return ERAS.find((e) => e.id === id);
}

// the eras a club actually has cards in, in chronological order
export function erasForClub(code: string): Era[] {
  const club = clubByCode.get(code);
  if (!club) return [];
  return ERAS.filter((e) => club.eras[e.id]);
}

// best-available roster for a club within an era, sorted by overall (memoized)
const clubEraCache = new Map<string, PlayerCard[]>();
export function playersForClubEra(code: string, eraId: string): PlayerCard[] {
  const key = `${code}|${eraId}`;
  let list = clubEraCache.get(key);
  if (!list) {
    list = dataset.players
      .filter((p) => p.era === eraId && p.teams.includes(code))
      .sort((a, b) => b.overall - a.overall || b.pir - a.pir);
    clubEraCache.set(key, list);
  }
  return list;
}

export const POSITION_LABEL: Record<Position, string> = {
  G: "Guard",
  F: "Forward",
  C: "Center",
};
