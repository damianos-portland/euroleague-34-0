# 34–0 — All-Time EuroLeague Undefeated Season

A EuroLeague adaptation of [82-0.com](https://www.82-0.com). Spin a slot machine
across five EuroLeague eras, draft one legend from each club it lands on, then
simulate a perfect **34-game regular season**. Every box-score stat counts.

## How it works

- **5 era windows** (2000–04, 2005–09, 2010–14, 2015–19, 2020–25) — detailed
  EuroLeague box scores (incl. steals/blocks) exist only from 2000 on.
- **Slot machine draft** — each of 5 rounds lands on a weighted-random club for
  that era; you pick any one player from it. 2 re-spins per game.
- **Real stats** — per-game PTS / REB / AST / STL / BLK / PIR scraped from the
  official EuroLeague API, using each player's peak season within the era.
- **Era-adjusted, non-linear sim** — category totals combine via a balance-aware
  geometric mean (a weakness in any one category caps your ceiling), mapped to a
  per-game win curve over a 34-game slate. 34-0 is rare and luck-sensitive.
- **Classic / HoopIQ modes** — stats visible, or hidden (draft from memory).
- **Shareable** — results encode `seed + roster` in the URL and reproduce exactly.

## Data pipeline

```bash
npm run scrape    # pull seasons E2000–E2024 from the EuroLeague v3 API -> data/raw
npm run process   # build the game dataset -> src/data/dataset.json
```

`data/raw` is reproducible and gitignored; `src/data/dataset.json` is committed.

## Develop

```bash
npm install
npm run dev       # http://localhost:3000
npm run build
```

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS v4. No backend — the
dataset is static JSON and all game logic runs client-side.

## Tuning

Sim difficulty lives in `src/lib/sim.ts` (`K`, `HOME`, `P_CAP`, `catScore`) and
`src/lib/schedule.ts` (opponent strengths). Current calibration: an optimal
roster has ~11% odds to go 34-0, a good roster ~2%. Verify with:

```bash
node scripts/simcheck.mjs
```
