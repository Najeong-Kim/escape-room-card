# Escape Room Profile Card

A mobile-first web app that turns your escape room play style into a shareable profile card. Answer a short quiz, get a cute animal character, and save a 1080x1080 result image.

## What it does

1. Guides the user through a short quiz about fear level, puzzle style, favorite genres, and play style
2. Builds a personalized result card with a generated animal character and translated tagline
3. Flips the card to show detailed traits and preferences
4. Saves a shareable PNG image
5. Supports Korean and English UI
6. Changes the card background based on selected genres, using gradients when multiple genres are selected
7. Recommends 3 real Seoul escape room themes matched to the user's profile

## Character outcomes

| Character | Result | Fear | Puzzle Style |
|---|---|---|---|
| Lion | Brave Puzzle Solver | Brave | Puzzle |
| Tiger | Brave Device Tinkerer | Brave | Device |
| Bear | Brave Strategist | Brave | Balanced |
| Fox | Calm Puzzle Solver | Calm | Puzzle |
| Cat | Calm Device Tinkerer | Calm | Device |
| Owl | Calm Strategist | Calm | Balanced |
| Rabbit | Cautious Observer | Cautious | Any |

## Genre options

- Horror
- Mystery / Thriller
- Fantasy / Adventure
- Emotional
- Comic

## Tech stack

- React 19 + TypeScript
- Vite 8
- Framer Motion
- i18next + react-i18next
- node-canvas for prebuild asset generation
- Canvas API for client-side share image composition
- Vitest + React Testing Library

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

`npm run build` runs `prebuild` first, which generates the animal assets in `src/assets/characters/` via [`scripts/generate-avatars.mjs`](/Users/najeong/Documents/github/escape-room-card/scripts/generate-avatars.mjs).

If `canvas` fails to install locally, check the [node-canvas installation notes](https://github.com/Automattic/node-canvas#installation).

## Tests

```bash
npm test
```

The test suite covers the trait mapping logic and the quiz reducer flow.

## Project structure

```text
src/
  components/
    Quiz/           # Quiz flow, questions, multi-select UI, progress bar
    ResultCard/     # Result card UI, flip interaction, genre backgrounds, share image
  i18n/
    locales/        # Korean and English translations
  lib/
    traitMap.ts     # Quiz answer -> profile mapping logic
    recommend.ts    # Room recommendation algorithm
  store/
    quizReducer.ts  # Quiz state machine
  data/
    rooms.json      # 30 curated Seoul escape room themes
  assets/
    characters/     # Generated SVG, display PNG, and share PNG assets
scripts/
  generate-avatars.mjs  # Custom animal SVG generator and PNG exporter
```

## How results are calculated

### Fear level

- Q1: `react` (+1) / `freeze` (-1) / `ignore` (+1)
- Q2: `cannot` (-1) / `someone` (0) / `alone` (+1)
- Score <= -1 -> `cautious`
- Score = 0 -> `calm`
- Score >= 1 -> `brave`

### Puzzle style

- Puzzle + Puzzle -> `puzzle`
- Device + Device -> `device`
- Mixed answers -> `balanced`

### Character mapping

- Brave + Puzzle -> Lion
- Brave + Device -> Tiger
- Brave + Balanced -> Bear
- Calm + Puzzle -> Fox
- Calm + Device -> Cat
- Calm + Balanced -> Owl
- Cautious -> Rabbit

### Card background

- Each genre maps to a theme color
- One selected genre uses a single-theme gradient
- Multiple selected genres blend into a multi-stop gradient on both the result card and share image

### Room recommendations

After the result card, 3 real Seoul escape room themes are recommended from `src/data/rooms.json` (30 curated themes).

**Matching algorithm (`src/lib/recommend.ts`):**

1. **Fear level** — the user's `fearLevel` is mapped to a 1–5 score (`brave`→5, `calm`→3, `cautious`→1). Rooms whose `fear_level` falls within ±1 of that score pass.
2. **Genre overlap** — at least one of the room's genres must match the user's selected genres.
3. **Fallback relaxation** — if fewer than 3 rooms pass, the fear tolerance expands to ±2. If still fewer than 3, the fear constraint is dropped and only genre overlap is checked.
4. **Ranking** — qualifying rooms are sorted by `rating_avg` descending. Top 3 are shown.

**Room data schema:**

```json
{
  "id": "room-001",
  "name": "테마 이름",
  "brand": "업체명",
  "location": "지역",
  "genres": ["Horror", "MysteryThriller"],
  "fear_level": 4,
  "puzzle_weight": 3,
  "min_players": 2,
  "max_players": 6,
  "rating_avg": 4.5,
  "tags": ["공포", "배우", "연출", "몰입감", "기믹"]
}
```

Genre values: `Horror`, `MysteryThriller`, `FantasyAdventure`, `Emotional`, `Comic`

`fear_level` and `puzzle_weight` use a 1–5 scale (1 = lowest, 5 = highest).
`rating_avg` uses a 0–5 scale (sourced from colory.mooo.com, divided by 2).
