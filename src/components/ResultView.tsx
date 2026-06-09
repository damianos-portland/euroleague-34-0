"use client";

import { useState } from "react";
import type { SeasonResult } from "@/lib/sim";
import type { Pick } from "@/lib/types";
import { clubByCodeFn } from "@/lib/dataset";
import { Avatar, Btn, Crest, OverallBadge, PositionBadge, lastFirst, spanLabel } from "./ui";

export default function ResultView({
  result,
  picks,
  shareUrl,
  shared,
  onPlayAgain,
}: {
  result: SeasonResult;
  picks: Pick[];
  shareUrl: string;
  shared: boolean;
  onPlayAgain: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const perfect = result.perfect;
  const headline = perfect ? "34–0. PERFECT." : `${result.wins}–${result.losses}`;

  return (
    <div className="mx-auto w-full max-w-2xl pop-in">
      {/* hero record */}
      <div
        className={`rounded-3xl border p-6 text-center ${
          perfect
            ? "border-amber-400/50 bg-gradient-to-b from-amber-500/10 to-transparent"
            : "border-line bg-surface/60"
        }`}
      >
        <div className="text-[11px] font-bold uppercase tracking-widest text-orange-400">
          Final record
        </div>
        <div
          className={`mono mt-1 text-6xl font-black ${perfect ? "accent-text" : "text-zinc-100"}`}
        >
          {headline}
        </div>
        {!perfect && result.firstLossIndex && (
          <div className="mt-2 text-sm text-zinc-400">
            Streak ended in game {result.firstLossIndex} ·{" "}
            <span className="text-red-300">
              {result.games[result.firstLossIndex - 1].home ? "vs" : "@"}{" "}
              {result.games[result.firstLossIndex - 1].opponent}
            </span>
          </div>
        )}
        {perfect && (
          <div className="mt-2 text-sm text-amber-200">
            An undefeated EuroLeague season. Legendary.
          </div>
        )}
        <div className="mono mt-3 inline-flex items-center gap-4 rounded-full border border-line bg-black/30 px-4 py-1.5 text-xs text-zinc-400">
          <span>
            Team rating <b className="text-zinc-100">{result.rating}</b>
          </span>
          <span className="text-zinc-700">|</span>
          <span>
            34-0 odds{" "}
            <b className="text-zinc-100">{(result.perfectOdds * 100).toFixed(1)}%</b>
          </span>
        </div>
      </div>

      {/* category breakdown — every stat counts */}
      <div className="mt-4 rounded-2xl border border-line bg-surface/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-200">Strength by category</span>
          <span className="text-[11px] text-zinc-500">
            weakest link:{" "}
            <span className="text-red-300">{result.weakest.label}</span>
          </span>
        </div>
        <div className="space-y-2">
          {result.categories.map((c) => (
            <div key={c.key} className="flex items-center gap-3">
              <span className="w-16 text-xs text-zinc-400">{c.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/40">
                <div
                  className={`h-full rounded-full ${
                    c.key === result.weakest.key
                      ? "bg-gradient-to-r from-red-500 to-orange-500"
                      : "bg-gradient-to-r from-orange-500 to-amber-400"
                  }`}
                  style={{ width: `${Math.round(c.score * 100)}%` }}
                />
              </div>
              <span className="mono w-10 text-right text-xs text-zinc-400">
                {Math.round(c.score * 100)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
          A perfect season needs every category strong at once — your lowest bar
          caps your ceiling.
        </p>
      </div>

      {/* the roster */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {picks.map((p) => (
          <div
            key={p.card.id}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 p-3"
          >
            <div className="relative shrink-0">
              <Avatar card={p.card} size={44} />
              <div className="absolute -bottom-1.5 -right-1.5">
                <OverallBadge value={p.card.overall} size="sm" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <PositionBadge pos={p.card.position} />
                <span className="truncate text-sm font-semibold text-zinc-100">
                  {lastFirst(p.card.name)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 truncate text-[11px] text-zinc-500">
                <Crest src={clubByCodeFn(p.teamCode)?.crest} name={p.teamName} size={14} />
                {p.teamName} · {spanLabel(p.card)}
              </div>
            </div>
            <div className="mono text-right text-[11px] text-zinc-400">
              <div>{p.card.pts} pts</div>
              <div className="text-amber-300">{p.card.pir} PIR</div>
            </div>
          </div>
        ))}
      </div>

      {/* actions */}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Btn onClick={copy} variant="outline">
          {copied ? "Link copied ✓" : "Share result"}
        </Btn>
        <Btn onClick={onPlayAgain}>{shared ? "Build your own →" : "Play again"}</Btn>
      </div>
    </div>
  );
}
