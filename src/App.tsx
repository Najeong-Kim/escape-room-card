import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { QuizProfile } from './lib/traitMap'
import { QuizFlow } from './components/Quiz/QuizFlow'
import { ResultCard } from './components/ResultCard/ResultCard'
import { Footer } from './components/Footer'
import { GlobalNav } from './components/GlobalNav'
import type { RoomLog } from './lib/roomLog'
import { useRoomLogs } from './lib/useRoomLogs'
import { clearSavedCard, loadSavedCard, saveCard, SAVED_CARD_CHANGED } from './lib/savedCard'
import { saveUserCardProfile } from './lib/userCardProfile'
import { useRooms } from './lib/useRooms'
import { buildPersonalRecommendationModel, predictionConfidenceLabel, predictionPathLabel, predictionPathRating } from './lib/personalRecommendations'
import { getRatingDef, RatingIcon, type PathRating } from './lib/ratings'
import { usePageMeta } from './lib/seo'
import { getCharacterImage } from './components/ResultCard/characterAssets'
import { BrandLogo } from './components/BrandLogo'

type HomeMode = 'home' | 'quiz' | 'result'

export default function App() {
  usePageMeta({})
  const [savedProfile, setSavedProfile] = useState<QuizProfile | null>(() => loadSavedCard())
  const [logs] = useRoomLogs()
  const [activeProfile, setActiveProfile] = useState<QuizProfile | null>(null)
  const [mode, setMode] = useState<HomeMode>(() => savedProfile ? 'home' : 'quiz')
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    function refreshSavedProfile() {
      setSavedProfile(loadSavedCard())
    }

    window.addEventListener(SAVED_CARD_CHANGED, refreshSavedProfile)
    return () => window.removeEventListener(SAVED_CARD_CHANGED, refreshSavedProfile)
  }, [])

  function toggleLang() {
    const next = i18n.language === 'ko' ? 'en' : 'ko'
    i18n.changeLanguage(next)
    localStorage.setItem('escape-room-lang', next)
  }

  function completeQuiz(profile: QuizProfile) {
    saveCard(profile)
    saveUserCardProfile(profile)
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

  const pageTitle = mode === 'quiz' ? '내 카드 만들기' : '내 카드'
  const pageSubtitle = mode === 'quiz'
    ? '취향 몇 가지만 고르면 방탕 카드가 바로 완성돼요.'
    : '내 방탈출 성향과 추천, 기록 흐름을 한곳에서 볼 수 있어요.'

  return (
    <div className="min-h-dvh bg-[#0a0a0f]">
      <GlobalNav languageLabel={t('lang_toggle')} onLanguageToggle={toggleLang} />

      <section className="max-w-md mx-auto px-4 sm:px-6 pt-6">
        <p className="text-xs uppercase tracking-widest text-teal-300/80">My Card</p>
        <h1 className="mt-1 text-2xl font-bold text-white">{pageTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">{pageSubtitle}</p>
      </section>

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
  const { rooms } = useRooms()
  const tagline = t(`tagline_${profile.characterId}`)
  const fearLabel = t(`fear_${profile.fearLevel}`)
  const styleLabel = t(`style_${profile.puzzleStyle}`)
  const tierLabel = t(`tier_${profile.playCountTier.label}`)
  const totalLogs = logs.length
  const clearedLogs = logs.filter(log => log.cleared).length
  const failedLogs = totalLogs - clearedLogs
  const latestLog = logs[0]
  const personalModel = buildPersonalRecommendationModel(rooms, logs)
  const characterImage = getCharacterImage(profile.characterId, profile.playCount)
  const successRate = totalLogs > 0 ? Math.round((clearedLogs / totalLogs) * 100) : null
  const thisMonthCount = countLogsThisMonth(logs)
  const favoriteBrand = mostCommon(logs.map(log => log.brand).filter(Boolean))
  const averagePath = averagePathRating(logs)
  const averagePathDef = averagePath === null ? null : getRatingDef(Math.round(averagePath) as PathRating)
  const bestMetric = bestAverageMetric(logs)
  const recentLogs = logs.slice(0, 2)

  return (
    <div className="min-h-dvh max-w-md mx-auto px-4 sm:px-5 pt-6 pb-14 flex flex-col gap-5">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#13131a]">
        <div className="relative px-5 pt-6 pb-5 bg-[linear-gradient(135deg,rgba(20,184,166,0.22),rgba(124,58,237,0.16),rgba(245,158,11,0.14))]">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <BrandLogo className="mb-2 h-9 w-9 drop-shadow-[0_0_18px_rgba(20,184,166,0.38)]" />
              <h1 className="text-white text-3xl font-black leading-tight break-keep">
                {profile.nickname}님은<br />{tagline}
              </h1>
              <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                방탈출로 탕진하기 좋은 {fearLabel} · {styleLabel} 취향이에요.
              </p>
            </div>
            <div className="mx-auto h-24 w-24 flex-shrink-0 rounded-2xl bg-white/8 border border-white/10 flex items-end justify-center overflow-hidden sm:mx-0 sm:h-28 sm:w-28">
              <img
                src={characterImage}
                alt=""
                className="w-full h-full object-contain p-2"
              />
            </div>
          </div>

          <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
            <HeroStat label="총 기록" value={`${totalLogs}`} />
            <HeroStat label="성공률" value={successRate === null ? '-' : `${successRate}%`} />
            <HeroStat label="이번 달" value={`${thisMonthCount}`} />
          </div>
        </div>

        <div className="px-5 py-5 grid grid-cols-2 gap-3">
          <ProfileStat label="경험" value={tierLabel} />
          <ProfileStat label="장르" value={profile.genres.map(genre => t(`opt_${genre}`)).join(', ') || '-'} />
          <ProfileStat label="최애 매장" value={favoriteBrand ?? '기록 대기'} />
          <ProfileStat label="강점" value={bestMetric?.label ?? '기록 대기'} />
        </div>
      </section>

      {personalModel?.lifeTheme && (
        <section className="personal-score rounded-2xl border border-teal-500/30 bg-[#101b1b] px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-teal-300 text-xs font-semibold uppercase tracking-widest mb-2">
                나의 인생테마 후보
              </p>
              <h2 className="text-white text-xl font-black leading-tight">
                {personalModel.lifeTheme.room.name}
              </h2>
              <p className="text-gray-400 text-sm mt-1">{personalModel.lifeTheme.room.brand}</p>
            </div>
            <div className="flex-shrink-0 sm:text-right">
              <div className="flex items-center gap-1 text-teal-200 text-lg font-black sm:justify-end">
                <RatingIcon value={predictionPathRating(personalModel.lifeTheme.prediction)} size={20} />
                {predictionPathLabel(personalModel.lifeTheme.prediction).replace('예상 ', '')}
              </div>
              <p className="text-gray-500 text-xs">예상 길</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-[#0e0e16] border border-white/8 px-4 py-3">
            <p className="text-teal-300 text-xs font-semibold mb-1">
                {predictionConfidenceLabel(personalModel.lifeTheme.prediction)}
              </p>
            <p className="text-gray-400 text-sm leading-relaxed">
                {personalModel.lifeTheme.prediction.reasons[0] ?? '내 기록과 가장 가까운 테마예요.'}
              </p>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#13131a] px-5 py-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-amber-300 text-xs uppercase tracking-widest mb-1">개인 통계</p>
            <h2 className="text-white text-lg font-bold">
              {totalLogs > 0 ? `${totalLogs}개의 플레이 기록` : '기록을 쌓으면 취향이 선명해져요'}
            </h2>
          </div>
          {totalLogs > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="text-green-400 text-xl font-black">{clearedLogs}:{failedLogs}</p>
              <p className="text-gray-500 text-xs">성공:실패</p>
            </div>
          )}
        </div>

        {totalLogs > 0 ? (
          <div className="grid gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MiniStat
                label="평균 길"
                value={averagePathDef?.label ?? '평가 대기'}
                icon={averagePathDef ? <RatingIcon value={averagePathDef.value} size={20} /> : null}
              />
              <MiniStat
                label="최근 플레이"
                value={latestLog ? latestLog.played_at : '-'}
              />
            </div>

            {bestMetric && (
              <MetricBar label={`${bestMetric.label} 평균`} value={bestMetric.value} />
            )}

            <div className="grid gap-2">
              {recentLogs.map(log => (
                <RecentLogCard key={log.id} log={log} />
              ))}
            </div>
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
          className="app-primary-action w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 rounded-lg transition-all"
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
    <div className="rounded-xl bg-[#0e0e16] border border-white/8 px-4 py-3">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-white text-sm font-semibold break-words">{value}</p>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-center">
      <p className="text-white text-xl font-black leading-none">{value}</p>
      <p className="text-gray-300 text-[11px] mt-1">{label}</p>
    </div>
  )
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl bg-[#0e0e16] border border-white/8 px-4 py-3">
      <p className="text-gray-500 text-xs mb-2">{label}</p>
      <div className="flex items-center gap-2 min-h-6">
        {icon}
        <p className="text-white text-sm font-bold break-words">{value}</p>
      </div>
    </div>
  )
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 10)))

  return (
    <div className="rounded-xl bg-[#0e0e16] border border-white/8 px-4 py-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-gray-400 text-sm font-semibold">{label}</p>
        <p className="text-amber-300 text-sm font-black">{value.toFixed(1)} / 10</p>
      </div>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#14b8a6,#f59e0b)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function RecentLogCard({ log }: { log: RoomLog }) {
  const ratingDef = getRatingDef(log.rating)

  return (
    <div className="rounded-xl bg-[#0e0e16] border border-white/8 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-gray-500 text-xs">{log.brand} · {log.played_at}</p>
          <p className="text-white font-semibold mt-1 truncate">{log.room_name}</p>
        </div>
        <span className={[
          'escape-result-badge flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full',
          log.cleared ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400',
        ].join(' ')}>
          {log.cleared ? '성공' : '실패'}
        </span>
      </div>
      {ratingDef && (
        <div className="mt-3 inline-flex items-center gap-1">
          <RatingIcon value={ratingDef.value} size={18} />
          <span className="text-xs font-semibold" style={{ color: ratingDef.color }}>{ratingDef.label}</span>
        </div>
      )}
    </div>
  )
}

function countLogsThisMonth(logs: RoomLog[]) {
  const now = new Date()
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return logs.filter(log => log.played_at.startsWith(prefix)).length
}

function mostCommon(values: string[]) {
  const counts = new Map<string, number>()
  values.forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

function averagePathRating(logs: RoomLog[]) {
  const ratings = logs
    .map(log => log.rating)
    .filter((rating): rating is PathRating => rating !== null && rating !== undefined)
  if (ratings.length === 0) return null
  return ratings.reduce<number>((sum, rating) => sum + rating, 0) / ratings.length
}

const METRIC_FIELDS: Array<{ key: keyof RoomLog; label: string }> = [
  { key: 'difficulty_score', label: '난이도' },
  { key: 'fear_score', label: '공포도' },
  { key: 'activity_score', label: '활동성' },
  { key: 'story_score', label: '스토리' },
  { key: 'interior_score', label: '인테리어' },
  { key: 'aging_score', label: '쾌적함' },
]

function bestAverageMetric(logs: RoomLog[]) {
  const metrics = METRIC_FIELDS.map(({ key, label }) => {
    const values = logs
      .map(log => log[key])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    if (values.length === 0) return null
    return { label, value: values.reduce((sum, value) => sum + value, 0) / values.length }
  }).filter((metric): metric is { label: string; value: number } => metric !== null)

  return metrics.sort((a, b) => b.value - a.value)[0] ?? null
}
