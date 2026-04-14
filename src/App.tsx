import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { QuizProfile } from './lib/traitMap'
import { QuizFlow } from './components/Quiz/QuizFlow'
import { ResultCard } from './components/ResultCard/ResultCard'
import { clearSavedCard, loadSavedCard, saveCard } from './lib/savedCard'

type HomeMode = 'home' | 'quiz' | 'result'

export default function App() {
  const [savedProfile, setSavedProfile] = useState<QuizProfile | null>(() => loadSavedCard())
  const [activeProfile, setActiveProfile] = useState<QuizProfile | null>(null)
  const [mode, setMode] = useState<HomeMode>(() => savedProfile ? 'home' : 'quiz')
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  function toggleLang() {
    const next = i18n.language === 'ko' ? 'en' : 'ko'
    i18n.changeLanguage(next)
    localStorage.setItem('escape-room-lang', next)
  }

  function completeQuiz(profile: QuizProfile) {
    saveCard(profile)
    setSavedProfile(profile)
    setActiveProfile(profile)
    setMode('result')
  }

  function viewSavedCard() {
    if (!savedProfile) return
    setActiveProfile(savedProfile)
    setMode('result')
  }

  function startOver() {
    clearSavedCard()
    setSavedProfile(null)
    setActiveProfile(null)
    setMode('quiz')
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

      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <button
          onClick={() => navigate('/rooms')}
          className="text-xs text-gray-500 hover:text-gray-300
                     border border-gray-800 hover:border-gray-600 px-3 py-1.5 rounded-full
                     transition-colors bg-[#0a0a0f]/80 backdrop-blur-sm"
        >
          🏠 방 둘러보기
        </button>
        <button
          onClick={() => navigate('/my-rooms')}
          className="text-xs text-gray-500 hover:text-gray-300
                     border border-gray-800 hover:border-gray-600 px-3 py-1.5 rounded-full
                     transition-colors bg-[#0a0a0f]/80 backdrop-blur-sm"
        >
          📋 내 기록
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'home' && savedProfile && (
          <SavedCardHome
            key="saved-home"
            profile={savedProfile}
            onViewCard={viewSavedCard}
            onStartOver={startOver}
            onBrowseRooms={() => navigate('/rooms')}
            t={t}
          />
        )}

        {mode === 'quiz' && (
          <QuizFlow key="quiz" onComplete={completeQuiz} />
        )}

        {mode === 'result' && activeProfile && (
          <ResultCard
            key="result"
            profile={activeProfile}
            onReset={startOver}
            onHome={savedProfile ? () => setMode('home') : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function SavedCardHome({
  profile,
  onViewCard,
  onStartOver,
  onBrowseRooms,
  t,
}: {
  profile: QuizProfile
  onViewCard: () => void
  onStartOver: () => void
  onBrowseRooms: () => void
  t: (key: string) => string
}) {
  const tagline = t(`tagline_${profile.characterId}`)
  const fearLabel = t(`fear_${profile.fearLevel}`)
  const styleLabel = t(`style_${profile.puzzleStyle}`)
  const tierLabel = t(`tier_${profile.playCountTier.label}`)

  return (
    <div className="min-h-dvh max-w-md mx-auto px-6 py-24 flex flex-col gap-6">
      <section className="rounded-2xl border border-violet-500/30 bg-violet-950/20 px-5 py-6">
        <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-2">
          내 방탈출 카드
        </p>
        <h1 className="text-white text-3xl font-black leading-tight">
          {profile.nickname}님은<br />{tagline}
        </h1>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <ProfileStat label="공포" value={fearLabel} />
          <ProfileStat label="스타일" value={styleLabel} />
          <ProfileStat label="경험" value={tierLabel} />
          <ProfileStat label="장르" value={profile.genres.map(genre => t(`opt_${genre}`)).join(', ') || '-'} />
        </div>
      </section>

      <div className="grid gap-3">
        <button
          onClick={onViewCard}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-lg transition-all"
        >
          카드 다시 보기
        </button>
        <button
          onClick={onBrowseRooms}
          className="w-full bg-white text-gray-950 font-semibold py-3 rounded-lg transition-all"
        >
          내 취향 방 둘러보기
        </button>
        <button
          onClick={onStartOver}
          className="w-full border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white py-3 rounded-lg transition-all text-sm font-medium"
        >
          카드 새로 만들기
        </button>
      </div>
    </div>
  )
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-white text-sm font-semibold break-keep">{value}</p>
    </div>
  )
}
