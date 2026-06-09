"use client";

import type { PlayerCard } from "@/lib/types";
import { Avatar, OverallBadge, PositionBadge, StatGrid, lastFirst, spanLabel } from "./ui";

export default function PlayerPicker({
  candidates,
  hideStats,
  onPick,
}: {
  candidates: PlayerCard[];
  hideStats: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div className="no-bar max-h-[46vh] space-y-2 overflow-y-auto pr-1 md:max-h-[52vh]">
      {candidates.map((c, i) => (
        <button
          key={c.id}
          onClick={() => onPick(c.id)}
          style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
          className="row-in group flex w-full items-center gap-3 rounded-xl border border-line bg-surface/70 p-3 text-left transition-all hover:border-orange-400/60 hover:bg-surface2"
        >
          <div className="relative shrink-0">
            <Avatar card={c} size={64} />
            <div className="absolute -bottom-1.5 -right-1.5">
              <OverallBadge value={c.overall} hidden={hideStats} size="sm" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <PositionBadge pos={c.position} />
                <span className="truncate font-semibold text-zinc-100">
                  {lastFirst(c.name)}
                </span>
              </span>
              <span className="mono shrink-0 text-[11px] text-zinc-500">
                {spanLabel(c)}
                {c.seasons > 1 ? ` · ${c.seasons}s` : ""}
              </span>
            </div>
            <div className="mt-1.5">
              <StatGrid card={c} hidden={hideStats} />
            </div>
          </div>
        </button>
      ))}
      {candidates.length === 0 && (
        <div className="py-8 text-center text-sm text-zinc-500">
          No eligible players — try a re-spin.
        </div>
      )}
    </div>
  );
}
