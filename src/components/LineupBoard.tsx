"use client";

import type { Pick, Position } from "@/lib/types";
import { clubByCodeFn } from "@/lib/dataset";
import { Avatar, Crest, OverallBadge, lastFirst, POS_FULL } from "./ui";

// The five positional slots: 2 Guards, 2 Forwards, 1 Center.
const SLOTS: Position[] = ["G", "G", "F", "F", "C"];

export default function LineupBoard({ picks }: { picks: Pick[] }) {
  // assign picks to slots in order of position
  const used = [...picks];
  const filled: (Pick | null)[] = SLOTS.map((pos) => {
    const i = used.findIndex((p) => p.card.position === pos);
    if (i === -1) return null;
    return used.splice(i, 1)[0];
  });

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {SLOTS.map((pos, i) => {
        const pick = filled[i];
        const tone =
          pos === "G"
            ? "text-sky-300/80"
            : pos === "F"
              ? "text-violet-300/80"
              : "text-rose-300/80";
        return (
          <div
            key={i}
            className={`rounded-lg border p-2 text-center transition-colors ${
              pick ? "border-line bg-surface2" : "border-dashed border-line bg-surface/40"
            }`}
          >
            <div className={`text-[9px] font-bold uppercase tracking-wide ${tone}`}>
              {POS_FULL[pos]}
            </div>
            {pick ? (
              <div className="mt-1 flex flex-col items-center gap-1">
                <div className="relative">
                  <Avatar card={pick.card} size={56} />
                  <div className="absolute -bottom-1 -right-1">
                    <OverallBadge value={pick.card.overall} size="sm" />
                  </div>
                  <div className="absolute -left-1 -top-1">
                    <Crest src={clubByCodeFn(pick.teamCode)?.crest} name={pick.teamName} size={16} />
                  </div>
                </div>
                <span className="w-full truncate text-[10px] text-zinc-300">
                  {lastFirst(pick.card.name).split(" ").slice(-1)[0]}
                </span>
              </div>
            ) : (
              <div className="mt-2 text-[10px] text-zinc-600">empty</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
