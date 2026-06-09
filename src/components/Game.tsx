"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createDraft,
  reSpinTeam,
  reSpinEra,
  pickCard,
  candidates,
  currentClubName,
  roster,
  isComplete,
  filledCounts,
  NEED,
  type DraftState,
} from "@/lib/game";
import {
  ERAS,
  cardById,
  CLUBS,
  erasForClub,
  eraById,
  clubByCodeFn,
  POSITION_LABEL,
} from "@/lib/dataset";
import { simulateSeason, type SeasonResult } from "@/lib/sim";
import { randomSeed } from "@/lib/rng";
import { encodeShare, decodeShare } from "@/lib/share";
import type { GameMode, Pick, Position } from "@/lib/types";
import TwoPartSpinner from "./TwoPartSpinner";
import LineupBoard from "./LineupBoard";
import PlayerPicker from "./PlayerPicker";
import SeasonTicker from "./SeasonTicker";
import ResultView from "./ResultView";
import { Btn, Crest } from "./ui";

type Phase = "home" | "draft" | "season" | "result";

const CLUB_NAMES = CLUBS.map((c) => c.name);

export default function Game() {
  const [phase, setPhase] = useState<Phase>("home");
  const [mode, setMode] = useState<GameMode>("classic");
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [result, setResult] = useState<SeasonResult | null>(null);
  const [sharedPicks, setSharedPicks] = useState<Pick[] | null>(null);
  const [shared, setShared] = useState(false);
  const [reelReady, setReelReady] = useState(false);

  // load a shared run from the URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const s = decodeShare(hash);
    if (!s) return;
    const cards = s.picks.map((p) => cardById(p.id));
    if (cards.some((c) => !c)) return;
    const picks: Pick[] = s.picks.map((p, i) => {
      const c = cards[i]!;
      const teamName = CLUBS.find((t) => t.code === p.teamCode)?.name ?? c.primaryTeamName;
      return { eraId: c.era, teamCode: p.teamCode || c.primaryTeam, teamName, card: c };
    });
    setMode(s.mode);
    setSharedPicks(picks);
    setResult(simulateSeason(picks.map((p) => p.card), s.seed));
    setDraft({ ...createDraft(s.mode, s.seed), picks });
    setShared(true);
    setPhase("result");
  }, []);

  const start = (m: GameMode) => {
    const seed = randomSeed();
    setMode(m);
    setShared(false);
    setSharedPicks(null);
    setResult(null);
    setDraft(createDraft(m, seed));
    setReelReady(false);
    setPhase("draft");
    if (typeof window !== "undefined") history.replaceState(null, "", window.location.pathname);
  };

  const onPick = (id: string) => {
    if (!draft) return;
    const next = pickCard(draft, id);
    setReelReady(false);
    if (isComplete(next)) {
      setDraft(next);
      setResult(simulateSeason(roster(next), next.seed));
      setPhase("season");
    } else {
      setDraft(next);
    }
  };

  const onReSpinTeam = () => {
    if (!draft) return;
    setReelReady(false);
    setDraft(reSpinTeam(draft));
  };
  const onReSpinEra = () => {
    if (!draft) return;
    setReelReady(false);
    setDraft(reSpinEra(draft));
  };

  const picks = sharedPicks ?? draft?.picks ?? [];
  const shareUrl = useMemo(() => {
    if (!result || !draft) return "";
    const base =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : "";
    return `${base}#${encodeShare({
      seed: draft.seed,
      mode,
      picks: picks.map((p) => ({ id: p.card.id, teamCode: p.teamCode })),
    })}`;
  }, [result, draft, mode, picks]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-10">
      <Header />
      {phase === "home" && <Home onStart={start} />}
      {phase === "draft" && draft && (
        <DraftScreen
          draft={draft}
          mode={mode}
          reelReady={reelReady}
          onReady={() => setReelReady(true)}
          onReSpinTeam={onReSpinTeam}
          onReSpinEra={onReSpinEra}
          onPick={onPick}
        />
      )}
      {phase === "season" && result && (
        <div className="flex flex-1 items-center py-6">
          <SeasonTicker result={result} onDone={() => setPhase("result")} />
        </div>
      )}
      {phase === "result" && result && (
        <div className="py-4">
          <ResultView
            result={result}
            picks={picks}
            shareUrl={shareUrl}
            shared={shared}
            onPlayAgain={() => (shared ? start(mode) : setPhase("home"))}
          />
        </div>
      )}
    </main>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between py-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-lg">
          🏀
        </span>
        <span className="mono text-lg font-black tracking-tight">
          34<span className="text-zinc-600">–</span>0
        </span>
      </div>
      <a
        href="/how-to-play"
        className="text-[11px] uppercase tracking-widest text-zinc-500 hover:text-orange-400"
      >
        How to play
      </a>
    </header>
  );
}

function Home({ onStart }: { onStart: (m: GameMode) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center pop-in">
      <h1 className="text-4xl font-black leading-tight sm:text-5xl">
        Can you go <span className="accent-text">34–0?</span>
      </h1>
      <p className="mt-4 max-w-md text-zinc-400">
        Spin a club, then spin its era. Draft a EuroLeague all-time five — two
        guards, two forwards, a center — then simulate a perfect 34-game season.
        Every box-score stat counts.
      </p>

      <div className="mt-8 grid w-full max-w-md gap-3">
        {(
          [
            ["classic", "Classic", "Full stats visible. Draft on the numbers."],
            ["hoopiq", "HoopIQ", "Stats hidden. Draft from memory and basketball knowledge."],
          ] as const
        ).map(([m, title, desc]) => (
          <button
            key={m}
            onClick={() => onStart(m)}
            className="group rounded-2xl border border-line bg-surface/70 p-5 text-left transition-all hover:border-orange-400/60 hover:bg-surface2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-100">{title}</span>
              <span className="text-orange-400 transition-transform group-hover:translate-x-1">→</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function DraftScreen({
  draft,
  mode,
  reelReady,
  onReady,
  onReSpinTeam,
  onReSpinEra,
  onPick,
}: {
  draft: DraftState;
  mode: GameMode;
  reelReady: boolean;
  onReady: () => void;
  onReSpinTeam: () => void;
  onReSpinEra: () => void;
  onPick: (id: string) => void;
}) {
  const clubName = currentClubName(draft);
  const clubCrest = draft.club ? clubByCodeFn(draft.club)?.crest ?? null : null;
  const eraLabel = draft.era ? eraById(draft.era)?.label ?? null : null;
  const eraItems = useMemo(
    () => (draft.club ? erasForClub(draft.club).map((e) => e.label) : []),
    [draft.club]
  );
  const cands = candidates(draft);

  const filled = filledCounts(draft.picks);
  const remaining = (["G", "F", "C"] as Position[])
    .map((p) => ({ p, n: NEED[p] - filled[p] }))
    .filter((x) => x.n > 0);

  return (
    <div className="flex flex-1 flex-col gap-4 py-2">
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-orange-400">
            Round {Math.min(draft.round + 1, 5)} / 5
          </span>
          <span className="text-[11px] text-zinc-500">
            Need:{" "}
            {remaining
              .map((r) => `${r.n} ${POSITION_LABEL[r.p]}${r.n > 1 ? "s" : ""}`)
              .join(" · ")}
          </span>
        </div>
        <LineupBoard picks={draft.picks} />
      </div>

      <TwoPartSpinner
        clubName={clubName}
        clubCrest={clubCrest}
        eraLabel={eraLabel}
        clubItems={CLUB_NAMES}
        eraItems={eraItems}
        teamReelKey={draft.round * 100 + draft.teamNonce}
        eraReelKey={draft.round * 100 + draft.eraNonce}
        teamRespinsLeft={draft.teamRespinsLeft}
        eraRespinsLeft={draft.eraRespinsLeft}
        onReSpinTeam={onReSpinTeam}
        onReSpinEra={onReSpinEra}
        onReady={onReady}
      />

      {reelReady ? (
        <div>
          <div className="mb-2 flex items-center gap-1.5 px-1 text-sm text-zinc-400">
            {clubName && eraLabel ? (
              <>
                <Crest src={clubCrest} name={clubName} size={18} />
                <span>
                  Pick from{" "}
                  <span className="font-semibold text-zinc-200">{clubName}</span>
                  <span className="text-zinc-500"> · {eraLabel}</span>
                </span>
              </>
            ) : (
              "Spinning…"
            )}
          </div>
          <PlayerPicker candidates={cands} hideStats={mode === "hoopiq"} onPick={onPick} />
        </div>
      ) : (
        <div className="grid place-items-center py-12 text-sm text-zinc-600">
          spinning the reels…
        </div>
      )}
    </div>
  );
}
