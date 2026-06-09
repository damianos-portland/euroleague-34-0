export type CatKey = "pts" | "reb" | "ast" | "stl" | "blk";

export type Position = "G" | "F" | "C";

export interface Era {
  id: string;
  label: string;
  start: number;
  end: number;
}

export interface PlayerCard {
  id: string;
  code: string; // EuroLeague person code — shared by the same player across eras
  name: string;
  era: string;
  position: Position; // official EuroLeague position: Guard / Forward / Center
  img: string | null; // headshot URL (may be null for older players)
  teams: string[]; // club codes he's available under in this era
  primaryTeam: string; // club with the most games in the window
  primaryTeamName: string;
  seasons: number; // qualifying seasons in the window
  firstSeason: number;
  lastSeason: number;
  gp: number; // total games across the window
  // games-weighted era-overall per-game stats
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  pir: number;
  overall: number; // 1..99
  adj: Record<CatKey, number>; // era-adjusted z-scores
}

export interface ClubEra {
  count: number;
  weight: number;
  pos: { G: number; F: number; C: number };
}

export interface Club {
  code: string;
  name: string;
  crest: string | null;
  weight: number;
  cardCount: number;
  eras: Record<string, ClubEra>; // only eras the club actually has cards in
}

export interface Baseline {
  count: number;
  pts: { mean: number; std: number };
  reb: { mean: number; std: number };
  ast: { mean: number; std: number };
  stl: { mean: number; std: number };
  blk: { mean: number; std: number };
  pir: { mean: number; std: number };
}

export interface Dataset {
  eras: Era[];
  cats: CatKey[];
  baselines: Record<string, Baseline>;
  clubs: Club[];
  players: PlayerCard[];
  meta: { builtFromSeasons: string[]; cardCount: number };
}

export type GameMode = "classic" | "hoopiq";

export interface Pick {
  eraId: string;
  teamCode: string;
  teamName: string;
  card: PlayerCard;
}
