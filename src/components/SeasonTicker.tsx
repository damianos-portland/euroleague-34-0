"use client";

import { useEffect, useRef, useState } from "react";
import type { SeasonResult } from "@/lib/sim";
import { Btn } from "./ui";

export default function SeasonTicker({
  result,
  onDone,
}: {
  result: SeasonResult;
  onDone: () => void;
}) {
  const [shown, setShown] = useState(0); // games revealed
  const [skipped, setSkipped] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (skipped) {
      setShown(result.games.length);
      return;
    }
    if (shown >= result.games.length) return;
    // accelerate as the season rolls on; stop hard on the first loss for drama
    const justLost = shown > 0 && !result.games[shown - 1].win;
    const delay = justLost ? 900 : shown < 5 ? 320 : shown < 15 ? 180 : 110;
    const t = setTimeout(() => setShown((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [shown, skipped, result.games]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [shown]);

  const done = shown >= result.games.length;
  const wins = result.games.slice(0, shown).filter((g) => g.win).length;
  const losses = shown - wins;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="text-center">
        <div className="text-[11px] font-bold uppercase tracking-widest text-orange-400">
          Simulating the 34-game season
        </div>
        <div className="mono mt-2 text-5xl font-black">
          <span className="text-emerald-400">{wins}</span>
          <span className="text-zinc-600">–</span>
          <span className="text-red-400">{losses}</span>
        </div>
      </div>

      <div
        ref={scroller}
        className="no-bar mt-5 max-h-[44vh] space-y-1.5 overflow-y-auto rounded-2xl border border-line bg-surface/60 p-3"
      >
        {result.games.slice(0, shown).map((g) => (
          <div
            key={g.index}
            className={`row-in flex items-center gap-3 rounded-lg px-3 py-2 ${
              g.win ? "bg-emerald-500/5" : "bg-red-500/10"
            }`}
          >
            <span className="mono w-6 text-xs text-zinc-600">{g.index}</span>
            <span
              className={`grid h-6 w-6 place-items-center rounded text-xs font-bold ${
                g.win ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/25 text-red-300"
              }`}
            >
              {g.win ? "W" : "L"}
            </span>
            <span className="text-xs text-zinc-500">{g.home ? "vs" : "@"}</span>
            <span className="flex-1 truncate text-sm text-zinc-200">{g.opponent}</span>
            <span className="mono text-sm tabular-nums text-zinc-400">
              {g.you}–{g.them}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-center gap-3">
        {!done ? (
          <Btn variant="outline" onClick={() => setSkipped(true)}>
            Skip to result
          </Btn>
        ) : (
          <Btn onClick={onDone}>See your record →</Btn>
        )}
      </div>
    </div>
  );
}
