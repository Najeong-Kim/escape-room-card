import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface Props {
  onAnswer: (value: string) => void
}

export function NicknameStep({ onAnswer }: Props) {
  const [value, setValue] = useState('')
  const { t } = useTranslation()

  function handleSubmit() {
    const trimmed = value.trim()
    if (trimmed) onAnswer(trimmed)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="flex flex-col items-center gap-8 px-6 py-8"
    >
      <div className="text-center">
        <div className="text-4xl mb-3">🎭</div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('nickname_title')}</h2>
        <p className="text-gray-400 text-sm">{t('nickname_subtitle')}</p>
      </div>

      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSubmit()}
        placeholder={t('nickname_placeholder')}
        maxLength={24}
        autoFocus
        className="w-full max-w-xs bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3
                   text-white text-center text-lg placeholder-gray-600 outline-none
                   focus:border-teal-500 transition-colors"
      />

      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="w-full max-w-xs bg-teal-600 hover:bg-teal-500 disabled:bg-gray-800
                   disabled:text-gray-600 text-white font-semibold py-3 rounded-2xl
                   transition-all active:scale-95"
      >
        {t('continue')}
      </button>
    </motion.div>
  )
}
