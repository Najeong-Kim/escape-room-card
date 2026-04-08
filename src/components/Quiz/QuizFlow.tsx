import { useReducer, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  quizReducer, INITIAL_STATE, currentStepId,
  isMultiSelectStep, multiSelectMax, progressFraction,
} from '../../store/quizReducer'
import type { QuizProfile } from '../../lib/traitMap'
import { ProgressBar } from './ProgressBar'
import { NicknameStep } from './NicknameStep'
import { ChoiceStep } from './ChoiceStep'
import { MultiSelectStep } from './MultiSelectStep'
import {
  PLAY_COUNT_OPTIONS, FEAR_Q1_OPTIONS, FEAR_Q2_OPTIONS,
  GENRE_OPTIONS, PUZZLE_Q1_OPTIONS, PUZZLE_Q2_OPTIONS, PLAY_STYLE_OPTIONS,
} from './quizContent'

interface Props {
  onComplete: (profile: QuizProfile) => void
}

export function QuizFlow({ onComplete }: Props) {
  const [state, dispatch] = useReducer(quizReducer, INITIAL_STATE)
  const { t } = useTranslation()
  const stepId = currentStepId(state)

  // Emit profile when we reach result (useEffect to avoid side-effect in render)
  useEffect(() => {
    if (stepId === 'result' && state.profile) {
      onComplete(state.profile)
    }
  }, [stepId, state.profile, onComplete])

  if (stepId === 'result') return null

  const stepIndex = state.stepIndex
  const fraction = progressFraction(state)

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto">
      <ProgressBar fraction={fraction} step={stepIndex + 1} total={8} />

      {/* Back button */}
      {stepIndex > 0 && (
        <button
          onClick={() => dispatch({ type: 'BACK' })}
          className="self-start ml-6 mt-2 text-gray-500 hover:text-gray-300 text-sm
                     flex items-center gap-1 transition-colors"
        >
          {t('back')}
        </button>
      )}

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {stepId === 'nickname' && (
            <NicknameStep
              key="nickname"
              onAnswer={v => dispatch({ type: 'ANSWER', value: v })}
            />
          )}

          {stepId === 'play-count' && (
            <ChoiceStep
              key="play-count"
              emoji="🎮"
              question={t('q_play_count')}
              options={PLAY_COUNT_OPTIONS}
              onAnswer={v => dispatch({ type: 'ANSWER', value: v })}
            />
          )}

          {stepId === 'fear-q1' && (
            <ChoiceStep
              key="fear-q1"
              emoji="🌑"
              question={t('q_fear_q1')}
              options={FEAR_Q1_OPTIONS}
              onAnswer={v => dispatch({ type: 'ANSWER', value: v })}
            />
          )}

          {stepId === 'fear-q2' && (
            <ChoiceStep
              key="fear-q2"
              emoji="🚪"
              question={t('q_fear_q2')}
              options={FEAR_Q2_OPTIONS}
              onAnswer={v => dispatch({ type: 'ANSWER', value: v })}
            />
          )}

          {stepId === 'genre' && (
            <MultiSelectStep
              key="genre"
              emoji="🎭"
              question={t('q_genre')}
              options={GENRE_OPTIONS}
              selected={state.answers.genres}
              max={multiSelectMax('genre')}
              onToggle={v => dispatch({ type: 'MULTI_TOGGLE', value: v })}
              onContinue={() => dispatch({ type: 'CONTINUE' })}
            />
          )}

          {stepId === 'puzzle-q1' && (
            <ChoiceStep
              key="puzzle-q1"
              emoji="🔒"
              question={t('q_puzzle_q1')}
              options={PUZZLE_Q1_OPTIONS}
              onAnswer={v => dispatch({ type: 'ANSWER', value: v })}
            />
          )}

          {stepId === 'puzzle-q2' && (
            <ChoiceStep
              key="puzzle-q2"
              emoji="🏆"
              question={t('q_puzzle_q2')}
              options={PUZZLE_Q2_OPTIONS}
              onAnswer={v => dispatch({ type: 'ANSWER', value: v })}
            />
          )}

          {stepId === 'play-style' && isMultiSelectStep(stepId) && (
            <MultiSelectStep
              key="play-style"
              emoji="🎯"
              question={t('q_play_style')}
              options={PLAY_STYLE_OPTIONS}
              selected={state.answers.playStyle}
              max={multiSelectMax('play-style')}
              onToggle={v => dispatch({ type: 'MULTI_TOGGLE', value: v })}
              onContinue={() => dispatch({ type: 'CONTINUE' })}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
