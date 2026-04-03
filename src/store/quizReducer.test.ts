import { describe, it, expect } from 'vitest'
import { quizReducer, INITIAL_STATE, type QuizAction } from './quizReducer'

function dispatch(state = INITIAL_STATE, ...actions: QuizAction[]) {
  return actions.reduce(quizReducer, state)
}

describe('ANSWER — single-select steps', () => {
  it('stores nickname and advances to play-count', () => {
    const s = dispatch(INITIAL_STATE, { type: 'ANSWER', value: 'najeong' })
    expect(s.answers.nickname).toBe('najeong')
    expect(s.stepIndex).toBe(1)
  })

  it('stores play-count and advances', () => {
    const s = dispatch(INITIAL_STATE,
      { type: 'ANSWER', value: 'najeong' },
      { type: 'ANSWER', value: '30-100' },
    )
    expect(s.answers.playCount).toBe('30-100')
    expect(s.stepIndex).toBe(2)
  })

  it('stores fear-q1 and advances', () => {
    const s = dispatch(INITIAL_STATE,
      { type: 'ANSWER', value: 'najeong' },
      { type: 'ANSWER', value: '0-10' },
      { type: 'ANSWER', value: 'react' },
    )
    expect(s.answers.fearQ1).toBe('react')
    expect(s.stepIndex).toBe(3)
  })
})

describe('MULTI_TOGGLE — genre step', () => {
  // Navigate to genre step (index 4)
  function atGenre() {
    return dispatch(INITIAL_STATE,
      { type: 'ANSWER', value: 'x' },       // nickname
      { type: 'ANSWER', value: '0-10' },     // play-count
      { type: 'ANSWER', value: 'react' },    // fear-q1
      { type: 'ANSWER', value: 'alone' },    // fear-q2
    )
  }

  it('adds a genre on first toggle', () => {
    const s = dispatch(atGenre(), { type: 'MULTI_TOGGLE', value: 'Horror' })
    expect(s.answers.genres).toContain('Horror')
    expect(s.stepIndex).toBe(4) // no auto-advance
  })

  it('removes a genre on second toggle', () => {
    const s = dispatch(atGenre(),
      { type: 'MULTI_TOGGLE', value: 'Horror' },
      { type: 'MULTI_TOGGLE', value: 'Horror' },
    )
    expect(s.answers.genres).not.toContain('Horror')
  })

  it('caps at 3 genres — 4th toggle ignored', () => {
    const s = dispatch(atGenre(),
      { type: 'MULTI_TOGGLE', value: 'Horror' },
      { type: 'MULTI_TOGGLE', value: 'Mystery' },
      { type: 'MULTI_TOGGLE', value: 'Fantasy' },
      { type: 'MULTI_TOGGLE', value: 'Thriller' }, // should be ignored
    )
    expect(s.answers.genres).toHaveLength(3)
    expect(s.answers.genres).not.toContain('Thriller')
  })
})

describe('MULTI_TOGGLE — play-style step', () => {
  function atPlayStyle() {
    return dispatch(INITIAL_STATE,
      { type: 'ANSWER', value: 'x' },
      { type: 'ANSWER', value: '0-10' },
      { type: 'ANSWER', value: 'react' },
      { type: 'ANSWER', value: 'alone' },
      { type: 'CONTINUE' },                  // genre (empty is ok for test)
      { type: 'ANSWER', value: 'puzzles' },  // puzzle-q1
      { type: 'ANSWER', value: 'solving' },  // puzzle-q2
    )
  }

  it('caps at 2 play styles', () => {
    const s = dispatch(atPlayStyle(),
      { type: 'MULTI_TOGGLE', value: 'Speed runner' },
      { type: 'MULTI_TOGGLE', value: 'No-hint player' },
      { type: 'MULTI_TOGGLE', value: 'Observer' }, // ignored
    )
    expect(s.answers.playStyle).toHaveLength(2)
    expect(s.answers.playStyle).not.toContain('Observer')
  })
})

describe('CONTINUE', () => {
  function atGenre() {
    return dispatch(INITIAL_STATE,
      { type: 'ANSWER', value: 'x' },
      { type: 'ANSWER', value: '0-10' },
      { type: 'ANSWER', value: 'react' },
      { type: 'ANSWER', value: 'alone' },
    )
  }

  it('advances from genre to puzzle-q1', () => {
    const s = dispatch(atGenre(), { type: 'CONTINUE' })
    expect(s.stepIndex).toBe(5)
  })

  it('does nothing on non-multi-select step', () => {
    const s = dispatch(INITIAL_STATE, { type: 'CONTINUE' })
    expect(s.stepIndex).toBe(0)
  })
})

describe('BACK', () => {
  it('goes to previous step', () => {
    const s = dispatch(INITIAL_STATE,
      { type: 'ANSWER', value: 'najeong' },
      { type: 'BACK' },
    )
    expect(s.stepIndex).toBe(0)
  })

  it('does not go below step 0', () => {
    const s = dispatch(INITIAL_STATE, { type: 'BACK' })
    expect(s.stepIndex).toBe(0)
  })
})

describe('RESET', () => {
  it('returns to initial state', () => {
    const s = dispatch(INITIAL_STATE,
      { type: 'ANSWER', value: 'najeong' },
      { type: 'ANSWER', value: '100+' },
      { type: 'RESET' },
    )
    expect(s.stepIndex).toBe(0)
    expect(s.answers.nickname).toBe('')
    expect(s.profile).toBeNull()
  })
})

describe('Full flow → profile generation', () => {
  it('builds profile when reaching result step', () => {
    const s = dispatch(INITIAL_STATE,
      { type: 'ANSWER', value: 'najeong' },   // nickname
      { type: 'ANSWER', value: '30-100' },    // play-count
      { type: 'ANSWER', value: 'react' },     // fear-q1
      { type: 'ANSWER', value: 'alone' },     // fear-q2
      { type: 'MULTI_TOGGLE', value: 'Horror' },
      { type: 'MULTI_TOGGLE', value: 'Mystery' },
      { type: 'CONTINUE' },                   // genre → puzzle-q1
      { type: 'ANSWER', value: 'puzzles' },   // puzzle-q1
      { type: 'ANSWER', value: 'solving' },   // puzzle-q2
      { type: 'MULTI_TOGGLE', value: 'Speed runner' },
      { type: 'CONTINUE' },                   // play-style → result
    )
    expect(s.profile).not.toBeNull()
    expect(s.profile?.tagline).toBe('Brave Puzzle Solver')
    expect(s.profile?.nickname).toBe('najeong')
    expect(s.profile?.genres).toEqual(['Horror', 'Mystery'])
  })
})
