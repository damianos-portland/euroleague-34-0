import Link from "next/link";

export const metadata = {
  title: "How to Play · 34-0",
};

export default function HowToPlay() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-orange-400 hover:underline">
        ← Back to Game
      </Link>
      <h1 className="mt-4 text-3xl font-black">How to Play</h1>
      <p className="mt-3 text-zinc-400">
        Build an all-time EuroLeague starting five capable of a perfect
        undefeated regular season. Success is decided by a non-linear simulation
        that weighs the real box-score output of your five legends across a full
        34-game schedule.
      </p>

      <Section n={1} title="The Starting Five">
        You draft a real basketball lineup — five positional slots, filled in any
        order:
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {[
            ["2 ×", "Guard"],
            ["2 ×", "Forward"],
            ["1 ×", "Center"],
          ].map(([n, p]) => (
            <span
              key={p}
              className="rounded-lg border border-line bg-surface px-3 py-1"
            >
              <span className="mono text-orange-300">{n}</span>{" "}
              <span className="font-semibold text-zinc-200">{p}</span>
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Positions are the EuroLeague&apos;s official Guard / Forward / Center.
          When you pick a player they fill an open slot of their position — once
          both Guard slots are full, only Forwards and the Center remain.
        </p>
      </Section>

      <Section n={2} title="The Two-Part Spin">
        Each round, the slot machine spins twice:
        <div className="mt-3 space-y-2 text-sm">
          <p>
            <b className="text-zinc-200">1. Club</b> — lands on one of{" "}
            <b className="text-zinc-200">18 EuroLeague clubs</b> (the 18 with the
            most appearances since 2000). Storied clubs come up more often.
          </p>
          <p>
            <b className="text-zinc-200">2. Era</b> — then lands on one of{" "}
            <i>that club&apos;s</i> own eras: 2000–04, 2005–09, 2010–14, 2015–19
            or 2020–25. A club only offers eras it actually played in.
          </p>
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Then pick any player from that club &amp; era whose position still has a
          free slot. A player who played for two of the 18 clubs in an era is
          available from both.
        </p>
      </Section>

      <Section n={3} title="Re-spins">
        You get two re-spins per game, used wisely:
        <div className="mt-3 space-y-2 text-sm">
          <p>
            <b className="text-zinc-200">1 club re-spin</b> — swaps the club but{" "}
            <b className="text-zinc-200">keeps the era</b> (lands on another club
            from that same era).
          </p>
          <p>
            <b className="text-zinc-200">1 era re-spin</b> — keeps the club and
            rolls one of its other eras.
          </p>
        </div>
      </Section>

      <Section n={4} title="Every Stat Counts">
        The engine ignores reputation and reads each player&apos;s real per-game
        production — averaged across <b className="text-zinc-300">their whole run
        in that era</b>. Five categories drive the simulation:
        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          {[
            ["Points", "Offensive baseline"],
            ["Rebounds", "Possession & second chances"],
            ["Assists", "Ball movement & efficiency"],
            ["Steals", "Perimeter defense & transition"],
            ["Blocks", "Rim protection"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between border-b border-line px-4 py-2 text-sm last:border-0"
            >
              <span className="font-semibold text-zinc-200">{k}</span>
              <span className="text-zinc-500">{v}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Stats are <b className="text-zinc-300">era-adjusted</b> — a 6-assist
          average in 2002 isn&apos;t the same as one in 2023.
        </p>
      </Section>

      <Section n={5} title="The 34-Game Curve">
        Your category totals combine through a balance-aware, non-linear curve.
        As strength rises, each extra win gets harder. Crucially, a deficiency in{" "}
        <b className="text-zinc-200">even one category</b> caps your ceiling — you
        can&apos;t buy a perfect season on scoring alone. To reach 34-0 you must
        max out all five categories at once.
      </Section>

      <Section n={6} title="Game Modes">
        <div className="space-y-2 text-sm">
          <p>
            <b className="text-zinc-200">Classic</b> — full stats visible. Draft
            on the numbers.
          </p>
          <p>
            <b className="text-zinc-200">HoopIQ</b> — stats hidden. Draft purely
            from memory and basketball knowledge.
          </p>
        </div>
      </Section>

      <Link
        href="/"
        className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-2.5 text-sm font-semibold text-black"
      >
        Start drafting →
      </Link>
    </main>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span className="mono grid h-6 w-6 place-items-center rounded-md bg-orange-500/20 text-xs text-orange-300">
          {n}
        </span>
        {title}
      </h2>
      <div className="mt-2 text-zinc-400">{children}</div>
    </section>
  );
}
