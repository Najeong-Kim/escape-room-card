import { describe, it, expect } from 'vitest'
import {
  deriveFearLevel,
  derivePuzzleStyle,
  deriveTagline,
  deriveCharacterId,
  derivePlayCountTier,
  buildProfile,
} from './traitMap'

// ─── Fear level — all 9 Q3A × Q3B combinations ──────────────────
describe('deriveFearLevel', () => {
  // React (+1) combos
  it('react + cannot = calm (0)', () => expect(deriveFearLevel('react', 'cannot')).toBe('calm'))
  it('react + someone = brave (+1)', () => expect(deriveFearLevel('react', 'someone')).toBe('brave'))
  it('react + alone = brave (+2)', () => expect(deriveFearLevel('react', 'alone')).toBe('brave'))

  // Freeze (-1) combos
  it('freeze + cannot = cautious (-2)', () => expect(deriveFearLevel('freeze', 'cannot')).toBe('cautious'))
  it('freeze + someone = cautious (-1)', () => expect(deriveFearLevel('freeze', 'someone')).toBe('cautious'))
  it('freeze + alone = calm (0)', () => expect(deriveFearLevel('freeze', 'alone')).toBe('calm'))

  // Ignore (+1) combos
  it('ignore + cannot = calm (0)', () => expect(deriveFearLevel('ignore', 'cannot')).toBe('calm'))
  it('ignore + someone = brave (+1)', () => expect(deriveFearLevel('ignore', 'someone')).toBe('brave'))
  it('ignore + alone = brave (+2)', () => expect(deriveFearLevel('ignore', 'alone')).toBe('brave'))

  it('unknown answers default to calm', () => expect(deriveFearLevel('', '')).toBe('calm'))
})

// ─── Puzzle/Device style ─────────────────────────────────────────
describe('derivePuzzleStyle', () => {
  it('both puzzle answers → puzzle', () => expect(derivePuzzleStyle('puzzles', 'solving')).toBe('puzzle'))
  it('both device answers → device', () => expect(derivePuzzleStyle('surroundings', 'triggering')).toBe('device'))
  it('puzzle + device (split) → balanced', () => expect(derivePuzzleStyle('puzzles', 'triggering')).toBe('balanced'))
  it('device + puzzle (split) → balanced', () => expect(derivePuzzleStyle('surroundings', 'solving')).toBe('balanced'))
})

// ─── Tagline — all 9 combos ───────────────────────────────────────
describe('deriveTagline', () => {
  it('brave + puzzle', () => expect(deriveTagline('brave', 'puzzle')).toBe('Brave Puzzle Solver'))
  it('brave + device', () => expect(deriveTagline('brave', 'device')).toBe('Brave Device Tinkerer'))
  it('brave + balanced', () => expect(deriveTagline('brave', 'balanced')).toBe('Brave Strategist'))
  it('calm + puzzle', () => expect(deriveTagline('calm', 'puzzle')).toBe('Calm Puzzle Solver'))
  it('calm + device', () => expect(deriveTagline('calm', 'device')).toBe('Calm Device Tinkerer'))
  it('calm + balanced', () => expect(deriveTagline('calm', 'balanced')).toBe('Calm Strategist'))
  it('cautious + puzzle', () => expect(deriveTagline('cautious', 'puzzle')).toBe('Cautious Puzzle Solver'))
  it('cautious + device', () => expect(deriveTagline('cautious', 'device')).toBe('Cautious Device Tinkerer'))
  it('cautious + balanced', () => expect(deriveTagline('cautious', 'balanced')).toBe('Cautious Strategist'))
})

// ─── Character ID — all 7 variants ───────────────────────────────
describe('deriveCharacterId', () => {
  it('brave + puzzle → brave_puzzle', () => expect(deriveCharacterId('brave', 'puzzle')).toBe('brave_puzzle'))
  it('brave + device → brave_device', () => expect(deriveCharacterId('brave', 'device')).toBe('brave_device'))
  it('brave + balanced → brave_balanced', () => expect(deriveCharacterId('brave', 'balanced')).toBe('brave_balanced'))
  it('calm + puzzle → neutral_puzzle', () => expect(deriveCharacterId('calm', 'puzzle')).toBe('neutral_puzzle'))
  it('calm + device → neutral_device', () => expect(deriveCharacterId('calm', 'device')).toBe('neutral_device'))
  it('calm + balanced → neutral_balanced', () => expect(deriveCharacterId('calm', 'balanced')).toBe('neutral_balanced'))
  it('cautious + puzzle → scared_any', () => expect(deriveCharacterId('cautious', 'puzzle')).toBe('scared_any'))
  it('cautious + device → scared_any', () => expect(deriveCharacterId('cautious', 'device')).toBe('scared_any'))
  it('cautious + balanced → scared_any', () => expect(deriveCharacterId('cautious', 'balanced')).toBe('scared_any'))
})

// ─── Play count tiers ─────────────────────────────────────────────
describe('derivePlayCountTier', () => {
  it('0-10 → Beginner, 1 star', () => expect(derivePlayCountTier('0-10')).toEqual({ label: 'Beginner', stars: 1 }))
  it('10-30 → Regular, 2 stars', () => expect(derivePlayCountTier('10-30')).toEqual({ label: 'Regular', stars: 2 }))
  it('30-100 → Veteran, 3 stars', () => expect(derivePlayCountTier('30-100')).toEqual({ label: 'Veteran', stars: 3 }))
  it('100+ → Expert, 4 stars', () => expect(derivePlayCountTier('100+')).toEqual({ label: 'Expert', stars: 4 }))
})

// ─── buildProfile integration ─────────────────────────────────────
describe('buildProfile', () => {
  it('builds a complete profile from answers', () => {
    const profile = buildProfile({
      nickname: 'najeong',
      playCount: '30-100',
      q3a: 'react',
      q3b: 'alone',
      genres: ['Horror', 'Mystery', 'Fantasy'],
      q5a: 'puzzles',
      q5b: 'solving',
      playStyle: ['Speed runner', 'No-hint player'],
    })
    expect(profile.fearLevel).toBe('brave')
    expect(profile.puzzleStyle).toBe('puzzle')
    expect(profile.tagline).toBe('Brave Puzzle Solver')
    expect(profile.characterId).toBe('brave_puzzle')
    expect(profile.genres).toEqual(['Horror', 'Mystery', 'Fantasy'])
    expect(profile.playStyle).toEqual(['Speed runner', 'No-hint player'])
    expect(profile.playCountTier.label).toBe('Veteran')
    expect(profile.nickname).toBe('najeong')
  })

  it('caps genres at 3', () => {
    const profile = buildProfile({
      nickname: 'x', playCount: '0-10',
      q3a: 'freeze', q3b: 'cannot',
      genres: ['Horror', 'Mystery', 'Fantasy', 'Thriller'],
      q5a: 'surroundings', q5b: 'triggering',
      playStyle: [],
    })
    expect(profile.genres).toHaveLength(3)
  })

  it('caps playStyle at 2', () => {
    const profile = buildProfile({
      nickname: 'x', playCount: '0-10',
      q3a: 'freeze', q3b: 'cannot',
      genres: [],
      q5a: 'surroundings', q5b: 'triggering',
      playStyle: ['Speed runner', 'No-hint player', 'Observer'],
    })
    expect(profile.playStyle).toHaveLength(2)
  })
})
