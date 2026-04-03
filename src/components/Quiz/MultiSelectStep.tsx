// Multi-select step: tapping toggles selection, Continue button advances.
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface Option {
  value: string
  label: string
  emoji?: string
}

interface Props {
  emoji: string
  question: string
  options: Option[]
  selected: string[]
  max: number
  onToggle: (value: string) => void
  onContinue: () => void
}

export function MultiSelectStep({
  emoji, question, options, selected, max, onToggle, onContinue,
}: Props) {
  const { t } = useTranslation()
  const atMax = selected.length >= max

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="flex flex-col items-center gap-6 px-6 py-8"
    >
      <div className="text-center">
        <div className="text-4xl mb-3">{emoji}</div>
        <h2 className="text-xl font-bold text-white leading-snug">{question}</h2>
        <p className="text-gray-500 text-xs mt-1">
          {atMax
            ? t('max_selected', { max })
            : t('pick_up_to', { max })}
        </p>
      </div>

      <div className="w-full flex flex-col gap-3">
        {options.map(opt => {
          const isSelected = selected.includes(opt.value)
          const isDisabled = !isSelected && atMax

          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => !isDisabled && onToggle(opt.value)}
              className={[
                'w-full text-left px-5 py-4 rounded-2xl border transition-all duration-150',
                'flex items-center gap-3',
                isSelected
                  ? 'bg-violet-900/50 border-violet-500 text-white'
                  : isDisabled
                  ? 'bg-gray-900/50 border-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-900 border-gray-700 hover:border-gray-500 text-white',
              ].join(' ')}
            >
              {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
              <span className="font-medium flex-1">{t(`opt_${opt.value}`, opt.label)}</span>
              {isSelected && (
                <span className="text-violet-400 text-sm">✓</span>
              )}
              {isDisabled && (
                <span className="text-gray-700 text-xs">max</span>
              )}
            </motion.button>
          )
        })}
      </div>

      {selected.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onContinue}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold
                     py-3 rounded-2xl transition-all active:scale-95"
        >
          {t('continue_arrow')}
        </motion.button>
      )}
    </motion.div>
  )
}
