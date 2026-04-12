import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { QuizProfile } from './lib/traitMap'
import { QuizFlow } from './components/Quiz/QuizFlow'
import { ResultCard } from './components/ResultCard/ResultCard'

export default function App() {
  const [profile, setProfile] = useState<QuizProfile | null>(null)
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  function toggleLang() {
    const next = i18n.language === 'ko' ? 'en' : 'ko'
    i18n.changeLanguage(next)
    localStorage.setItem('escape-room-lang', next)
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0f]">
      <button
        onClick={toggleLang}
        className="fixed top-4 right-4 z-50 text-xs text-gray-500 hover:text-gray-300
                   border border-gray-800 hover:border-gray-600 px-3 py-1.5 rounded-full
                   transition-colors bg-[#0a0a0f]/80 backdrop-blur-sm"
      >
        {t('lang_toggle')}
      </button>

      <button
        onClick={() => navigate('/rooms')}
        className="fixed top-4 left-4 z-50 text-xs text-gray-500 hover:text-gray-300
                   border border-gray-800 hover:border-gray-600 px-3 py-1.5 rounded-full
                   transition-colors bg-[#0a0a0f]/80 backdrop-blur-sm"
      >
        🏠 방 둘러보기
      </button>

      <AnimatePresence mode="wait">
        {!profile ? (
          <QuizFlow key="quiz" onComplete={setProfile} />
        ) : (
          <ResultCard key="result" profile={profile} onReset={() => setProfile(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
