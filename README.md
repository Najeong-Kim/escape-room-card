# Escape Room Profile Card

A mobile-first web app that generates your personalized escape room profile card based on your play preferences. Answer 8 quick questions and get a shareable card that captures your fear level, puzzle style, and escape room identity.

## What it does

1. Answer 8 questions about how you play escape rooms
2. Get a profile card with your character, tagline, and traits
3. Tap the card to flip it and see your full stats
4. Save a 1080×1080 PNG to share anywhere

### The 9 possible profiles

| Tagline | Fear | Puzzle Style |
|---|---|---|
| Brave Puzzle Solver | 🔥 Brave | 🧩 Puzzle |
| Brave Device Tinkerer | 🔥 Brave | ⚙️ Device |
| Brave Strategist | 🔥 Brave | ⚖️ Balanced |
| Calm Puzzle Solver | 🌊 Calm | 🧩 Puzzle |
| Calm Device Tinkerer | 🌊 Calm | ⚙️ Device |
| Calm Strategist | 🌊 Calm | ⚖️ Balanced |
| Cautious Puzzle Solver | 🐢 Cautious | 🧩 Puzzle |
| Cautious Device Tinkerer | 🐢 Cautious | ⚙️ Device |
| Cautious Strategist | 🐢 Cautious | ⚖️ Balanced |

## Tech stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 8** with `@tailwindcss/vite`
- **Framer Motion** — step transitions and card flip animation
- **CSS 3D card flip** — `perspective` + `transform-style: preserve-3d`
- **DiceBear** adventurer avatars, rasterized to PNG at build time via `node-canvas`
- **Canvas API** — share image composed in-browser, no server needed
- **Web Share API** on iOS / `<a download>` fallback on desktop
- **Vitest** + **React Testing Library** — 52 tests

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

The `prebuild` script auto-generates character avatars (`src/assets/characters/`) before bundling. Requires `node-canvas` — see [installation notes](https://github.com/Automattic/node-canvas#installation) if it fails on your machine.

## Tests

```bash
npm test
```

52 tests covering all trait combinations (fear score matrix, puzzle style logic) and the quiz reducer state machine.

## Project structure

```
src/
  components/
    Quiz/           # 8-step quiz flow (NicknameStep, ChoiceStep, MultiSelectStep, ProgressBar, QuizFlow)
    ResultCard/     # Flip card UI, share button, canvas composition
  lib/
    traitMap.ts     # Pure logic: maps quiz answers → QuizProfile
  store/
    quizReducer.ts  # useReducer state machine, 9 steps with back navigation
  assets/
    characters/     # Generated PNGs (14 files: 7 characters × display + share sizes)
scripts/
  generate-avatars.ts  # Prebuild: DiceBear → node-canvas → PNG
```

## How profiles are calculated

**Fear level** — scored from two questions:
- Q1: React immediately (+1) / Freeze (−1) / Ignore (+1)
- Q2: Can't go (−1) / Need someone (0) / Go alone (+1)
- Score ≤ −1 → Cautious | 0 → Calm | ≥ +1 → Brave

**Puzzle style** — from two questions about how you approach rooms:
- Both answers point the same way → Puzzle or Device
- Split answers → Balanced (Strategist)
