import { buildProfile, type PlayCount, type QuizProfile } from '../lib/traitMap'

// ─── Step definitions ─────────────────────────────────────────────
//
// Steps flow:  nickname → play-count → fear-q1 → fear-q2
//              → genre → puzzle-q1 → puzzle-q2 → play-style
//              → result
//
// Multi-select steps (genre, play-style) require an explicit CONTINUE.
// All other steps auto-advance on ANSWER.

export type StepId =
  | 'nickname'
  | 'play-count'
  | 'fear-q1'
  | 'fear-q2'
  | 'genre'
  | 'puzzle-q1'
  | 'puzzle-q2'
  | 'play-style'
  | 'result'

const STEPS: StepId[] = [
  'nickname',
  'play-count',
  'fear-q1',
  'fear-q2',
  'genre',
  'puzzle-q1',
  'puzzle-q2',
  'play-style',
  'result',
]

const MULTI_SELECT_STEPS = new Set<StepId>(['genre', 'play-style'])
const MULTI_SELECT_MAX: Partial<Record<StepId, number>> = {
  'genre': 3,
  'play-style': 2,
}

// ─── State ────────────────────────────────────────────────────────
export interface QuizAnswers {
  nickname: string
  playCount: PlayCount | ''
  fearQ1: string
  fearQ2: string
  genres: string[]
  puzzleQ1: string
  puzzleQ2: string
  playStyle: string[]
}

export interface QuizState {
  stepIndex: number
  answers: QuizAnswers
  profile: QuizProfile | null
}

export const INITIAL_STATE: QuizState = {
  stepIndex: 0,
  answers: {
    nickname: '',
    playCount: '',
    fearQ1: '',
    fearQ2: '',
    genres: [],
    puzzleQ1: '',
    puzzleQ2: '',
    playStyle: [],
  },
  profile: null,
}

// ─── Actions ──────────────────────────────────────────────────────
export type QuizAction =
  | { type: 'ANSWER'; value: string }
  | { type: 'MULTI_TOGGLE'; value: string }
  | { type: 'CONTINUE' }
  | { type: 'BACK' }
  | { type: 'RESET' }

// ─── Reducer ──────────────────────────────────────────────────────
export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  const currentStep = STEPS[state.stepIndex]

  switch (action.type) {
    case 'ANSWER': {
      // Single-select answer: store + advance
      const updated = applyAnswer(state.answers, currentStep, action.value)
      const nextIndex = state.stepIndex + 1
      const nextStep = STEPS[nextIndex]

      if (nextStep === 'result') {
        const profile = buildProfile({
          nickname: updated.nickname,
          playCount: updated.playCount as PlayCount,
          q3a: updated.fearQ1,
          q3b: updated.fearQ2,
          genres: updated.genres,
          q5a: updated.puzzleQ1,
          q5b: updated.puzzleQ2,
          playStyle: updated.playStyle,
        })
        return { stepIndex: nextIndex, answers: updated, profile }
      }

      return { ...state, stepIndex: nextIndex, answers: updated }
    }

    case 'MULTI_TOGGLE': {
      // Multi-select toggle: add or remove, respect max
      const updated = toggleMulti(state.answers, currentStep, action.value)
      return { ...state, answers: updated }
    }

    case 'CONTINUE': {
      // Explicit advance for multi-select steps
      if (!MULTI_SELECT_STEPS.has(currentStep)) return state
      const nextIndex = state.stepIndex + 1
      const nextStep = STEPS[nextIndex]

      if (nextStep === 'result') {
        const profile = buildProfile({
          nickname: state.answers.nickname,
          playCount: state.answers.playCount as PlayCount,
          q3a: state.answers.fearQ1,
          q3b: state.answers.fearQ2,
          genres: state.answers.genres,
          q5a: state.answers.puzzleQ1,
          q5b: state.answers.puzzleQ2,
          playStyle: state.answers.playStyle,
        })
        return { stepIndex: nextIndex, answers: state.answers, profile }
      }

      return { ...state, stepIndex: nextIndex }
    }

    case 'BACK': {
      if (state.stepIndex === 0) return state
      return { ...state, stepIndex: state.stepIndex - 1, profile: null }
    }

    case 'RESET':
      return INITIAL_STATE
  }
}

// ─── Helpers ──────────────────────────────────────────────────────
function applyAnswer(answers: QuizAnswers, step: StepId, value: string): QuizAnswers {
  switch (step) {
    case 'nickname':   return { ...answers, nickname: value }
    case 'play-count': return { ...answers, playCount: value as PlayCount }
    case 'fear-q1':    return { ...answers, fearQ1: value }
    case 'fear-q2':    return { ...answers, fearQ2: value }
    case 'puzzle-q1':  return { ...answers, puzzleQ1: value }
    case 'puzzle-q2':  return { ...answers, puzzleQ2: value }
    default:           return answers
  }
}

function toggleMulti(answers: QuizAnswers, step: StepId, value: string): QuizAnswers {
  const max = MULTI_SELECT_MAX[step] ?? 99
  if (step === 'genre') {
    const selected = answers.genres
    if (selected.includes(value)) {
      return { ...answers, genres: selected.filter(v => v !== value) }
    }
    if (selected.length >= max) return answers // at max — ignore
    return { ...answers, genres: [...selected, value] }
  }
  if (step === 'play-style') {
    const selected = answers.playStyle
    if (selected.includes(value)) {
      return { ...answers, playStyle: selected.filter(v => v !== value) }
    }
    if (selected.length >= max) return answers
    return { ...answers, playStyle: [...selected, value] }
  }
  return answers
}

// ─── Selectors ────────────────────────────────────────────────────
export function currentStepId(state: QuizState): StepId {
  return STEPS[state.stepIndex]
}

export function isMultiSelectStep(stepId: StepId): boolean {
  return MULTI_SELECT_STEPS.has(stepId)
}

export function multiSelectMax(stepId: StepId): number {
  return MULTI_SELECT_MAX[stepId] ?? 99
}

export function progressFraction(state: QuizState): number {
  // 8 question steps (exclude result)
  return Math.min(state.stepIndex / 8, 1)
}
