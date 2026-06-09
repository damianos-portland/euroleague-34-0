// Draft state machine.
//
// Roster = 2 Guards, 2 Forwards, 1 Center.
// Each of the 5 rounds is a TWO-PART spin:
//   1. spin a club (from the 18) that can still contribute an open position
//   2. spin one of THAT club's available eras that has an open position
// then pick any player from that club+era whose position still has a free slot.
// One team re-spin and one era re-spin per game.
import type { GameMode, Pick, PlayerCard, Position } from "./types";
import {
  CLUBS,
  clubByCodeFn,
  playersForClubEra,
  ERAS,
} from "./dataset";
import { rngFrom, weightedPick } from "./rng";

export const NEED: Record<Position, number> = { G: 2, F: 2, C: 1 };
export const TOTAL_ROUNDS = 5;
export const TEAM_RESPINS = 1;
export const ERA_RESPINS = 1;

export interface DraftState {
  mode: GameMode;
  seed: number;
  round: number; // 0..5 (===5 complete)
  picks: Pick[];
  club: string | null;
  era: string | null;
  teamNonce: number;
  eraNonce: number;
  teamRespinsLeft: number;
  eraRespinsLeft: number;
}

export function filledCounts(picks: Pick[]): Record<Position, number> {
  const f: Record<Position, number> = { G: 0, F: 0, C: 0 };
  for (const p of picks) f[p.card.position]++;
  return f;
}

export function openPositions(picks: Pick[]): Position[] {
  const f = filledCounts(picks);
  return (["G", "F", "C"] as Position[]).filter((p) => f[p] < NEED[p]);
}

function pickedCodes(picks: Pick[]): Set<string> {
  return new Set(picks.map((p) => p.card.code));
}

// unpicked players at a club+era whose position still has a free slot
function availableAt(
  code: string,
  eraId: string,
  open: Position[],
  picked: Set<string>
): PlayerCard[] {
  const openSet = new Set(open);
  return playersForClubEra(code, eraId).filter(
    (c) => openSet.has(c.position) && !picked.has(c.code)
  );
}

function clubErasWithOpen(
  code: string,
  open: Position[],
  picked: Set<string>
): string[] {
  const club = clubByCodeFn(code);
  if (!club) return [];
  return ERAS.filter(
    (e) => club.eras[e.id] && availableAt(code, e.id, open, picked).length > 0
  ).map((e) => e.id);
}

function eligibleClubs(open: Position[], picked: Set<string>) {
  return CLUBS.filter((c) => clubErasWithOpen(c.code, open, picked).length > 0);
}

export function createDraft(mode: GameMode, seed: number): DraftState {
  const s: DraftState = {
    mode,
    seed,
    round: 0,
    picks: [],
    club: null,
    era: null,
    teamNonce: 0,
    eraNonce: 0,
    teamRespinsLeft: TEAM_RESPINS,
    eraRespinsLeft: ERA_RESPINS,
  };
  return spinTeam(s);
}

// clubs that have a given era available with an unpicked, open-position player
function clubsForEra(eraId: string, open: Position[], picked: Set<string>) {
  return CLUBS.filter(
    (c) => c.eras[eraId] && availableAt(c.code, eraId, open, picked).length > 0
  );
}

// spin a club. By default also spins a fresh era; when `keepEra` is passed the
// era is held fixed (used by the club re-spin) and only clubs that have that
// era are eligible.
export function spinTeam(state: DraftState, keepEra?: string): DraftState {
  if (state.round >= TOTAL_ROUNDS) return state;
  const open = openPositions(state.picks);
  const picked = pickedCodes(state.picks);
  const rand = rngFrom(state.seed, "team", state.round, state.teamNonce);

  if (keepEra) {
    const clubs = clubsForEra(keepEra, open, picked);
    if (clubs.length > 0) {
      const club = weightedPick(clubs, (c) => c.weight, rand());
      return { ...state, club: club.code, era: keepEra };
    }
    // no other club has this era + open position — fall back to a fresh spin
  }

  const clubs = eligibleClubs(open, picked);
  const club = weightedPick(clubs, (c) => c.weight, rand());
  return spinEra({ ...state, club: club.code, era: null });
}

// spin one of the current club's available, still-useful eras
export function spinEra(state: DraftState): DraftState {
  if (!state.club || state.round >= TOTAL_ROUNDS) return state;
  const open = openPositions(state.picks);
  const picked = pickedCodes(state.picks);
  const eraIds = clubErasWithOpen(state.club, open, picked);
  const club = clubByCodeFn(state.club)!;
  const rand = rngFrom(state.seed, "era", state.round, state.club, state.eraNonce);
  const eraId = weightedPick(
    eraIds,
    (id) => club.eras[id]?.weight ?? 1,
    rand()
  );
  return { ...state, era: eraId };
}

export function reSpinTeam(state: DraftState): DraftState {
  if (state.teamRespinsLeft <= 0) return state;
  // keep the current era — only the club changes
  return spinTeam(
    {
      ...state,
      teamNonce: state.teamNonce + 1,
      teamRespinsLeft: state.teamRespinsLeft - 1,
    },
    state.era ?? undefined
  );
}

export function reSpinEra(state: DraftState): DraftState {
  if (state.eraRespinsLeft <= 0 || !state.club) return state;
  return spinEra({ ...state, eraNonce: state.eraNonce + 1, eraRespinsLeft: state.eraRespinsLeft - 1 });
}

// players for the current club+era whose position still has a free slot and
// who haven't already been drafted
export function candidates(state: DraftState): PlayerCard[] {
  if (!state.club || !state.era) return [];
  return availableAt(
    state.club,
    state.era,
    openPositions(state.picks),
    pickedCodes(state.picks)
  );
}

export function currentClubName(state: DraftState): string | null {
  return state.club ? (clubByCodeFn(state.club)?.name ?? null) : null;
}

export function pickCard(state: DraftState, cardId: string): DraftState {
  const card = candidates(state).find((c) => c.id === cardId);
  if (!card || !state.club || !state.era) return state;
  const pick: Pick = {
    eraId: state.era,
    teamCode: state.club,
    teamName: clubByCodeFn(state.club)?.name ?? state.club,
    card,
  };
  const next: DraftState = {
    ...state,
    picks: [...state.picks, pick],
    round: state.round + 1,
    club: null,
    era: null,
    teamNonce: 0,
    eraNonce: 0,
  };
  return next.round < TOTAL_ROUNDS ? spinTeam(next) : next;
}

export function isComplete(state: DraftState): boolean {
  return state.round >= TOTAL_ROUNDS && state.picks.length === TOTAL_ROUNDS;
}

export function roster(state: DraftState): PlayerCard[] {
  return state.picks.map((p) => p.card);
}
