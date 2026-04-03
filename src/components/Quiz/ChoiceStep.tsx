// Single-select step: tapping an option auto-advances.
import { motion } from 'framer-motion'

interface Option {
  value: string
  label: string
  emoji?: string
}

interface Props {
  emoji: string
  question: string
  options: Option[]
  onAnswer: (value: string) => void
}

export function ChoiceStep({ emoji, question, options, onAnswer }: Props) {
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
      </div>

      <div className="w-full flex flex-col gap-3">
        {options.map(opt => (
          <motion.button
            key={opt.value}
            whileTap={{ scale: 0.97 }}
            onClick={() => onAnswer(opt.value)}
            className="w-full bg-gray-900 hover:bg-gray-800 active:bg-violet-900/40
                       border border-gray-700 hover:border-violet-500
                       text-white text-left px-5 py-4 rounded-2xl
                       transition-all duration-150 flex items-center gap-3"
          >
            {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
            <span className="font-medium">{opt.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
