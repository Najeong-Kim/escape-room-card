// traitMap.ts — pure logic, no UI
// Maps quiz answers → QuizProfile
// Test every combination before touching components.

export type FearLevel = 'brave' | 'calm' | 'cautious'
export type PuzzleStyle = 'puzzle' | 'device' | 'balanced'
export type PlayCount = '0' | '0-10' | '10-30' | '30-100' | '100+'

export type CharacterId =
  | 'brave_puzzle'
  | 'brave_device'
  | 'brave_balanced'
  | 'neutral_puzzle'
  | 'neutral_device'
  | 'neutral_balanced'
  | 'scared_any'

export type PlayCountTier = {
  label: string
  stars: number
}

export interface QuizProfile {
  nickname: string
  fearLevel: FearLevel
  puzzleStyle: PuzzleStyle
  genres: string[]      // top 2-3 selected
  playStyle: string[]   // up to 2 selected
  playCount: PlayCount
  characterId: CharacterId
  tagline: string
  playCountTier: PlayCountTier
}

// ─── Fear mapping ───────────────────────────────────────────────
// Q3A: react(+1) / freeze(-1) / ignore(+1)
// Q3B: cannot(-1) / someone(0) / alone(+1)
// Score: -2,-1 → cautious | 0 → calm | +1,+2 → brave

const Q3A_SCORES: Record<string, number> = {
  react: 1,
  freeze: -1,
  ignore: 1,
}

const Q3B_SCORES: Record<string, number> = {
  cannot: -1,
  someone: 0,
  alone: 1,
}

export function deriveFearLevel(q3a: string, q3b: string): FearLevel {
  const score = (Q3A_SCORES[q3a] ?? 0) + (Q3B_SCORES[q3b] ?? 0)
  if (score <= -1) return 'cautious'
  if (score >= 1) return 'brave'
  return 'calm'
}

// ─── Puzzle/Device mapping ───────────────────────────────────────
// Q5A: surroundings(+device) / puzzles(+puzzle)
// Q5B: solving(+puzzle) / triggering(+device)
// Both same → that style | split → balanced

const Q5A_STYLE: Record<string, PuzzleStyle> = {
  surroundings: 'device',
  puzzles: 'puzzle',
}

const Q5B_STYLE: Record<string, PuzzleStyle> = {
  solving: 'puzzle',
  triggering: 'device',
}

export function derivePuzzleStyle(q5a: string, q5b: string): PuzzleStyle {
  const a = Q5A_STYLE[q5a]
  const b = Q5B_STYLE[q5b]
  if (a === b) return a ?? 'balanced'
  return 'balanced'
}

// ─── Tagline ─────────────────────────────────────────────────────
const FEAR_ADJ: Record<FearLevel, string> = {
  brave: 'Brave',
  calm: 'Calm',
  cautious: 'Cautious',
}

const PUZZLE_NOUN: Record<PuzzleStyle, string> = {
  puzzle: 'Puzzle Solver',
  device: 'Device Tinkerer',
  balanced: 'Strategist',
}

export function deriveTagline(fear: FearLevel, puzzle: PuzzleStyle): string {
  return `${FEAR_ADJ[fear]} ${PUZZLE_NOUN[puzzle]}`
}

// ─── Character ID ─────────────────────────────────────────────────
export function deriveCharacterId(fear: FearLevel, puzzle: PuzzleStyle): CharacterId {
  if (fear === 'cautious') return 'scared_any'
  if (fear === 'brave') {
    if (puzzle === 'puzzle') return 'brave_puzzle'
    if (puzzle === 'device') return 'brave_device'
    return 'brave_balanced'
  }
  // calm
  if (puzzle === 'puzzle') return 'neutral_puzzle'
  if (puzzle === 'device') return 'neutral_device'
  return 'neutral_balanced'
}

// ─── Play count tier ──────────────────────────────────────────────
export function derivePlayCountTier(playCount: PlayCount): PlayCountTier {
  switch (playCount) {
    case '0':       return { label: 'Newbie', stars: 0 }
    case '0-10':    return { label: 'Beginner', stars: 1 }
    case '10-30':   return { label: 'Regular', stars: 2 }
    case '30-100':  return { label: 'Veteran', stars: 3 }
    case '100+':    return { label: 'Expert', stars: 4 }
    default:        return { label: 'Newbie', stars: 0 }
  }
}

// ─── Main builder ────────────────────────────────────────────────
export function buildProfile(answers: {
  nickname: string
  playCount: PlayCount
  q3a: string
  q3b: string
  genres: string[]
  q5a: string
  q5b: string
  playStyle: string[]
}): QuizProfile {
  const fearLevel = deriveFearLevel(answers.q3a, answers.q3b)
  const puzzleStyle = derivePuzzleStyle(answers.q5a, answers.q5b)
  return {
    nickname: answers.nickname,
    fearLevel,
    puzzleStyle,
    genres: answers.genres.slice(0, 3),
    playStyle: answers.playStyle.slice(0, 2),
    playCount: answers.playCount,
    characterId: deriveCharacterId(fearLevel, puzzleStyle),
    tagline: deriveTagline(fearLevel, puzzleStyle),
    playCountTier: derivePlayCountTier(answers.playCount),
  }
}
