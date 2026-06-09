import type { PlayerCard, Position } from "@/lib/types";

const POS_STYLE: Record<Position, string> = {
  G: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  F: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  C: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};
export const POS_FULL: Record<Position, string> = {
  G: "Guard",
  F: "Forward",
  C: "Center",
};

export function PositionBadge({ pos, full = false }: { pos: Position; full?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${POS_STYLE[pos]}`}
    >
      {full ? POS_FULL[pos] : pos}
    </span>
  );
}

export function seasonLabel(startYear: number): string {
  const next = (startYear + 1) % 100;
  return `${startYear}–${next.toString().padStart(2, "0")}`;
}

// label for an era-overall card: the span of seasons it averages
export function spanLabel(card: PlayerCard): string {
  if (card.firstSeason === card.lastSeason) return seasonLabel(card.firstSeason);
  const end = (card.lastSeason + 1) % 100;
  return `${card.firstSeason}–${end.toString().padStart(2, "0")}`;
}

export function lastFirst(name: string): string {
  // dataset names are "LAST, FIRST" — render as "First Last"
  const [last, first] = name.split(",").map((s) => s.trim());
  if (!first) return titleCase(last);
  return `${titleCase(first)} ${titleCase(last)}`;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bIi\b/i, "II")
    .replace(/\bIv\b/i, "IV");
}

function initials(name: string): string {
  const [last, first] = name.split(",").map((s) => s.trim());
  const a = (first?.[0] ?? "").toUpperCase();
  const b = (last?.[0] ?? "").toUpperCase();
  return (a + b) || "?";
}

// player headshot with a graceful initials fallback (older players have no photo)
export function Avatar({ card, size = 44 }: { card: PlayerCard; size?: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-line bg-gradient-to-br from-zinc-700 to-zinc-800"
      style={{ width: size, height: size }}
    >
      <span
        className="mono absolute inset-0 grid place-items-center font-bold text-zinc-400"
        style={{ fontSize: size * 0.34 }}
      >
        {initials(card.name)}
      </span>
      {card.img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.img}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-top"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}

export function Crest({
  src,
  name,
  size = 20,
}: {
  src?: string | null;
  name?: string;
  size?: number;
}) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name ?? ""}
      title={name}
      loading="lazy"
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
      onError={(e) => {
        e.currentTarget.style.visibility = "hidden";
      }}
    />
  );
}

export function OverallBadge({
  value,
  size = "md",
  hidden = false,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  hidden?: boolean;
}) {
  const tier = hidden
    ? "from-zinc-600 to-zinc-700 text-zinc-300"
    : value >= 90
      ? "from-amber-400 to-orange-500 text-black"
      : value >= 80
        ? "from-emerald-400 to-teal-500 text-black"
        : value >= 70
          ? "from-sky-400 to-blue-500 text-black"
          : "from-zinc-500 to-zinc-600 text-white";
  const dim =
    size === "lg" ? "h-12 w-12 text-xl" : size === "sm" ? "h-7 w-7 text-xs" : "h-10 w-10 text-base";
  return (
    <div
      className={`mono grid place-items-center rounded-lg bg-gradient-to-br font-bold shadow ${tier} ${dim}`}
      title={hidden ? "Hidden in HoopIQ mode" : "Overall rating"}
    >
      {hidden ? "?" : value}
    </div>
  );
}

const STAT_DEFS: { key: keyof PlayerCard; label: string }[] = [
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "pir", label: "PIR" },
];

export function StatGrid({ card, hidden = false }: { card: PlayerCard; hidden?: boolean }) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {STAT_DEFS.map((s) => (
        <div
          key={s.key}
          className="rounded-md bg-black/30 px-1.5 py-1 text-center"
          title={s.label}
        >
          <div className="text-[9px] font-semibold tracking-wide text-zinc-500">
            {s.label}
          </div>
          <div className={`mono text-sm font-semibold ${s.key === "pir" ? "text-amber-300" : "text-zinc-100"}`}>
            {hidden ? "•" : (card[s.key] as number).toFixed(1)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-orange-500 to-amber-400 text-black hover:brightness-110 shadow-lg shadow-orange-500/20"
      : variant === "outline"
        ? "border border-line text-zinc-200 hover:bg-white/5"
        : "text-zinc-300 hover:bg-white/5";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}
