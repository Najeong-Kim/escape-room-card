import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { QuizProfile } from './lib/traitMap'
import { QuizFlow } from './components/Quiz/QuizFlow'
import { ResultCard } from './components/ResultCard/ResultCard'
import { Footer } from './components/Footer'
import { AppThemeToggle } from './components/AppThemeToggle'
import { getLogs, type RoomLog } from './lib/roomLog'
import { clearSavedCard, loadSavedCard, saveCard } from './lib/savedCard'

type HomeMode = 'home' | 'quiz' | 'result'

export default function App() {
  const [savedProfile, setSavedProfile] = useState<QuizProfile | null>(() => loadSavedCard())
  const [logs] = useState<RoomLog[]>(() => getLogs())
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
      <AppThemeToggle />
      <button
        onClick={toggleLang}
        className="fixed top-14 right-4 z-50 text-xs text-gray-500 hover:text-gray-300
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
            onViewLogs={() => navigate('/my-rooms')}
            logs={logs}
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
      <Footer />
    </div>
  )
}

function SavedCardHome({
  profile,
  onViewCard,
  onStartOver,
  onBrowseRooms,
  onViewLogs,
  logs,
  t,
}: {
  profile: QuizProfile
  onViewCard: () => void
  onStartOver: () => void
  onBrowseRooms: () => void
  onViewLogs: () => void
  logs: RoomLog[]
  t: (key: string) => string
}) {
  const tagline = t(`tagline_${profile.characterId}`)
  const fearLabel = t(`fear_${profile.fearLevel}`)
  const styleLabel = t(`style_${profile.puzzleStyle}`)
  const tierLabel = t(`tier_${profile.playCountTier.label}`)
  const totalLogs = logs.length
  const clearedLogs = logs.filter(log => log.cleared).length
  const latestLog = logs[0]

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

      <section className="rounded-2xl border border-white/10 bg-[#13131a] px-5 py-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">내 기록</p>
            <h2 className="text-white text-lg font-bold">
              {totalLogs > 0 ? `${totalLogs}개의 플레이 기록` : '아직 기록된 방이 없어요'}
            </h2>
          </div>
          {totalLogs > 0 && (
            <div className="text-right">
              <p className="text-green-400 text-xl font-black">{clearedLogs}</p>
              <p className="text-gray-500 text-xs">성공</p>
            </div>
          )}
        </div>

        {latestLog ? (
          <div className="rounded-xl bg-[#0e0e16] border border-white/8 px-4 py-3">
            <p className="text-gray-500 text-xs">{latestLog.brand} · {latestLog.played_at}</p>
            <p className="text-white font-semibold mt-1">{latestLog.room_name}</p>
            <p className={latestLog.cleared ? 'text-green-400 text-xs mt-2' : 'text-red-400 text-xs mt-2'}>
              {latestLog.cleared ? '탈출 성공' : '탈출 실패'}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm leading-relaxed">
            방을 둘러보고 플레이한 테마를 기록하면 여기에서 최근 기록을 바로 볼 수 있어요.
          </p>
        )}

        <button
          onClick={onViewLogs}
          className="w-full mt-4 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white py-2.5 rounded-lg transition-all text-sm font-medium"
        >
          내 기록 보기
        </button>
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
