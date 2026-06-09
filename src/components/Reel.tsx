"use client";

import { useEffect, useRef, useState } from "react";

// A single slot-machine reel: whenever `spinKey` changes it riffles through
// `items` and settles on `landed`, then calls onDone.
export default function Reel({
  label,
  items,
  landed,
  spinKey,
  startDelay = 0,
  accent = false,
  landedIconSrc,
  onDone,
}: {
  label: string;
  items: string[];
  landed: string | null;
  spinKey: number;
  startDelay?: number;
  accent?: boolean;
  landedIconSrc?: string | null;
  onDone?: () => void;
}) {
  const [display, setDisplay] = useState<string>(landed ?? "—");
  const [spinning, setSpinning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!landed || items.length === 0) {
      if (landed) setDisplay(landed);
      return;
    }
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSpinning(true);

    let tick = 0;
    const totalTicks = 14;
    const run = () => {
      const step = () => {
        tick++;
        setDisplay(items[Math.floor(Math.random() * items.length)]);
        if (tick < totalTicks) {
          const delay = 40 + tick * tick * 1.6;
          timers.current.push(setTimeout(step, delay));
        } else {
          setDisplay(landed);
          setSpinning(false);
          onDone?.();
        }
      };
      step();
    };
    timers.current.push(setTimeout(run, startDelay));
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey, landed]);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-black/20 px-3 py-2.5">
      <span className="w-12 shrink-0 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      <span className={`grid h-7 w-7 shrink-0 place-items-center text-lg ${spinning ? "animate-pulse" : ""}`}>
        {!spinning && landedIconSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={landedIconSrc}
            alt=""
            className="h-7 w-7 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : label === "Club" ? (
          "🎰"
        ) : (
          "📅"
        )}
      </span>
      <span
        className={`mono truncate text-lg font-extrabold tracking-tight ${
          spinning ? "text-zinc-500" : accent ? "accent-text" : "text-zinc-100"
        }`}
      >
        {display}
      </span>
    </div>
  );
}
