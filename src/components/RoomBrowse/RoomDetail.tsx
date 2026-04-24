import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchAllCommunityEscapeStats, fetchAllCommunityMetricStats, fetchAllCommunityRatings } from '../../lib/communityRatings'
import type { CommunityEscapeStats, CommunityMetricStats, CommunityRating, MetricKey } from '../../lib/communityRatings'
import { getRatingDef, RatingIcon, score10ToPathRating } from '../../lib/ratings'
import { useRoomLogs } from '../../lib/useRoomLogs'
import { getMatchingTagFilters, useRooms } from '../../lib/useRooms'
import { buildPersonalRecommendationModel, predictionPathLabel, predictionPathRating } from '../../lib/personalRecommendations'
import { fetchThemeReviewLinks, REVIEW_SOURCE_LABEL, type ThemeReviewLink } from '../../lib/themeReviewLinks'
import { ReportModal } from '../ReportModal'
import { Footer } from '../Footer'
import { LogModal } from '../RoomLog/LogModal'
import { SignInRequiredModal } from '../SignInRequiredModal'
import { GlobalNav } from '../GlobalNav'
import type { Room } from '../../lib/recommend'
import type { RoomLog } from '../../lib/roomLog'
import { SHOW_COMMUNITY_RATING_COUNTS } from '../../lib/featureFlags'
import { usePageMeta } from '../../lib/seo'
import { safeExternalUrl } from '../../lib/safeExternalUrl'
import { useAppAuth } from '../../lib/auth'

const GENRE_LABEL: Record<string, string> = {
  Horror: '공포',
  MysteryThriller: '미스터리/스릴러',
  Emotional: '감성/드라마',
  Comic: '코믹',
  FantasyAdventure: '판타지/모험',
  Crime: '범죄/잠입',
  SF: 'SF',
}

const GENRE_COLOR: Record<string, string> = {
  Horror: '#3b1021',
  MysteryThriller: '#173467',
  Emotional: '#4a1040',
  Comic: '#c24b16',
  FantasyAdventure: '#23644e',
  Crime: '#5f2933',
  SF: '#1c5f7a',
}

const GENRE_LIGHT_COLOR: Record<string, string> = {
  Horror: '#8f1f48',
  MysteryThriller: '#275aa8',
  Emotional: '#a32975',
  Comic: '#b33d12',
  FantasyAdventure: '#24775a',
  Crime: '#a0354b',
  SF: '#21749a',
}

const TAG_CATEGORY_LABEL: Record<string, string> = {
  award: '수상',
  community: '커뮤니티',
  feature: '특성',
  operation: '운영',
  audience: '추천',
  warning: '주의',
}

const TAG_CATEGORY_CLASS: Record<string, string> = {
  award: 'bg-amber-500/12 border-amber-400/25 text-amber-200',
  community: 'bg-sky-500/12 border-sky-400/25 text-sky-200',
  feature: 'bg-emerald-500/12 border-emerald-400/25 text-emerald-200',
  operation: 'bg-teal-500/12 border-teal-400/25 text-teal-200',
  audience: 'bg-rose-500/12 border-rose-400/25 text-rose-200',
  warning: 'bg-red-500/12 border-red-400/25 text-red-200',
}

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'difficulty', label: '난이도' },
  { key: 'fear', label: '공포도' },
  { key: 'activity', label: '활동성' },
  { key: 'story', label: '스토리' },
  { key: 'interior', label: '인테리어' },
  { key: 'aging', label: '노후화' },
]

function formatScore(score: number) {
  return score.toFixed(1)
}

function logMetricValue(log: RoomLog, key: MetricKey) {
  if (key === 'difficulty') return log.difficulty_score ?? null
  if (key === 'fear') return log.fear_score ?? null
  if (key === 'activity') return log.activity_score ?? null
  if (key === 'story') return log.story_score ?? null
  if (key === 'interior') return log.interior_score ?? null
  if (key === 'aging') return log.aging_score ?? null
  return null
}


function similarRoomScore(current: Room, candidate: Room) {
  let score = 0
  if (candidate.location === current.location) score += 3
  score += candidate.genres.filter(genre => current.genres.includes(genre)).length * 2
  score += Math.max(0, 2 - Math.abs(candidate.fear_level - current.fear_level))
  score += Math.max(0, 2 - Math.abs(candidate.difficulty - current.difficulty))
  return score
}

function clampDots(value: number) {
  return Math.max(0, Math.min(5, Math.round(value)))
}

function DifficultyDots({ value }: { value: number }) {
  const dots = clampDots(value)
  return (
    <span className="inline-flex gap-[3px] align-middle">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            i < dots ? 'bg-amber-400' : 'bg-white/15'
          }`}
        />
      ))}
    </span>
  )
}

function naverMapUrl(room: Room) {
  const verifiedPlaceUrl = safeExternalUrl(room.naver_place_url)
  if (verifiedPlaceUrl) return verifiedPlaceUrl
  if (room.naver_place_id) {
    return safeExternalUrl(`https://map.naver.com/p/entry/place/${room.naver_place_id}`)
  }

  return safeExternalUrl(`https://map.naver.com/p/search/${encodeURIComponent(`${room.brand} ${room.location} 방탈출`)}`)
}

export default function RoomDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const roomId = Number(id)
  const { rooms, loading, error } = useRooms()
  const room = useMemo(() => rooms.find(item => item.id === roomId), [rooms, roomId])
  const [communityRating, setCommunityRating] = useState<CommunityRating | undefined>()
  const [communityMetricStats, setCommunityMetricStats] = useState<CommunityMetricStats>({})
  const [escapeStats, setEscapeStats] = useState<CommunityEscapeStats | undefined>()
  const [reviewLinks, setReviewLinks] = useState<ThemeReviewLink[]>([])
  const [showLog, setShowLog] = useState(false)
  const [showSignInGate, setShowSignInGate] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const auth = useAppAuth()
  const [logs] = useRoomLogs()
  const logged = useMemo(() => logs.some(log => log.room_id === roomId), [logs, roomId])
  const myLog = useMemo(() => logs.find(log => log.room_id === roomId), [logs, roomId])

  const refetchRatings = useCallback(() => {
    Promise.all([
      fetchAllCommunityRatings(),
      fetchAllCommunityMetricStats(),
      fetchAllCommunityEscapeStats(),
    ]).then(([ratings, metricStats, escapeStatMap]) => {
      setCommunityRating(ratings[roomId])
      setCommunityMetricStats(metricStats[roomId] ?? {})
      setEscapeStats(escapeStatMap[roomId])
    })
  }, [roomId])

  useEffect(() => { refetchRatings() }, [refetchRatings])

  useEffect(() => {
    if (!Number.isFinite(roomId)) return
    fetchThemeReviewLinks(roomId).then(setReviewLinks)
  }, [roomId])

  const ratingLevel = communityRating
    ? score10ToPathRating(communityRating.score10)
    : null
  const ratingDef = ratingLevel !== null ? getRatingDef(ratingLevel) : null
  const personalModel = useMemo(
    () => buildPersonalRecommendationModel(
      rooms, logs,
      { [roomId]: communityMetricStats },
      communityRating ? { [roomId]: communityRating } : {},
    ),
    [rooms, logs, roomId, communityMetricStats, communityRating],
  )
  const personalPrediction = personalModel?.predictions[roomId]
  const similarRooms = useMemo(() => {
    if (!room) return []
    const loggedIds = new Set(logs.map(log => log.room_id))
    return rooms
      .filter(candidate => candidate.id !== room.id && !loggedIds.has(candidate.id))
      .map(candidate => ({ room: candidate, score: similarRoomScore(room, candidate) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || b.room.rating_avg - a.room.rating_avg)
      .slice(0, 3)
      .map(item => item.room)
  }, [logs, room, rooms])
  const visibleReviewLinks = reviewLinks.slice(0, 4)
  const safeBookingUrl = room ? safeExternalUrl(room.website_url) : null
  const safeMapUrl = room ? naverMapUrl(room) : null
  const shouldUseHistoryBack = location.state && typeof location.state === 'object' && 'from' in location.state && location.state.from === '/'
  const matchingTagFilters = useMemo(() => room ? getMatchingTagFilters(room) : [], [room])
  const reviewCountByType = reviewLinks.reduce<Record<string, number>>((counts, review) => {
    counts[review.source_type] = (counts[review.source_type] ?? 0) + 1
    return counts
  }, {})

  function requestLog() {
    if (!auth.isSignedIn) {
      setShowSignInGate(true)
      return
    }

    setShowLog(true)
  }

  usePageMeta({
    title: room ? `${room.name} - ${room.brand}` : '방 상세',
    description: room
      ? `${room.location} ${room.brand} ${room.name}. ${room.duration_minutes}분, ${room.min_players}-${room.max_players}명, ${room.price_per_person > 0 ? `${room.price_per_person.toLocaleString()}원` : '가격 미확인'}`
      : '방탈출 테마 상세 정보를 확인해 보세요.',
    image: room?.image_url ?? '/og-image.png',
    url: Number.isFinite(roomId) ? `/rooms/${roomId}` : '/rooms',
  })

  if (!Number.isFinite(roomId)) {
    return (
      <div className="min-h-dvh bg-[#0a0a0f] text-white px-4 py-10">
        <p className="text-center text-gray-500">방 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="min-h-dvh bg-[#0a0a0f]" />
  }

  if (error || !room) {
    return (
      <div className="min-h-dvh bg-[#0a0a0f] text-white">
        <GlobalNav />
        <div className="px-4 py-20 text-center text-gray-500">
          <p>방 정보를 불러오지 못했습니다.</p>
          <button
            onClick={() => shouldUseHistoryBack ? navigate(-1) : navigate('/rooms')}
            className="mt-4 text-sm text-teal-400 hover:text-teal-300"
          >
            방 둘러보기로 돌아가기 →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0f] text-white">
      <GlobalNav />
      <main className="max-w-2xl mx-auto pb-24">
        {room.image_url ? (
          <img
            src={room.image_url}
            alt={room.name}
            className="w-full h-64 object-cover bg-[#13131a]"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-teal-900/30 to-[#0a0a0f] flex items-center justify-center">
            <span className="text-5xl opacity-30">🔐</span>
          </div>
        )}

        <section className="px-4 pt-6 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => shouldUseHistoryBack ? navigate(-1) : navigate('/rooms')}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <span aria-hidden="true">←</span>
              <span>방 둘러보기로</span>
            </button>
            <span className="text-xs uppercase tracking-widest text-gray-500">Theme Detail</span>
          </div>

          <div>
            <p className="text-sm text-gray-500">{room.brand}</p>
            <h2 className="text-2xl font-bold leading-tight mt-1">{room.name}</h2>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {room.genres.map(genre => (
                <span
                  key={genre}
                  className="genre-tag px-2 py-0.5 rounded-full text-xs font-medium text-white/80"
                  style={{
                    '--genre-bg': GENRE_COLOR[genre] ?? '#2a2a3a',
                    '--genre-light-bg': GENRE_LIGHT_COLOR[genre] ?? '#374151',
                  } as CSSProperties}
                >
                  {GENRE_LABEL[genre] ?? genre}
                </span>
              ))}
            </div>
            {room.theme_tags && room.theme_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {room.theme_tags.map(tag => (
                  <span
                    key={tag.code}
                    className={[
                      'theme-tag inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
                      TAG_CATEGORY_CLASS[tag.category] ?? 'bg-white/[0.06] border-white/10 text-gray-300',
                    ].join(' ')}
                  >
                    <span className="opacity-70">{TAG_CATEGORY_LABEL[tag.category] ?? '태그'}</span>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            {matchingTagFilters.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {matchingTagFilters.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-100"
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {personalPrediction && !logged && (
            <div className="personal-score rounded-2xl border border-teal-300/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015)),radial-gradient(circle_at_top_left,rgba(45,212,191,0.09),transparent_42%)] px-4 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-teal-300/90">내 기록 기반 예상 길</p>
                  <h3 className="mt-1 text-lg font-bold text-white">
                    {predictionPathLabel(personalPrediction).replace('예상 ', '')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-300 leading-relaxed">
                    {personalPrediction.reasons.length
                      ? personalPrediction.reasons.join(' · ')
                      : '내 기록과 유저 평가를 바탕으로 계산했어요.'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-white text-2xl font-black sm:justify-end">
                  <RatingIcon value={predictionPathRating(personalPrediction)} size={24} />
                  {predictionPathLabel(personalPrediction).replace('예상 ', '')}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-amber-200/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.008)),radial-gradient(circle_at_top_right,rgba(251,191,36,0.06),transparent_38%)] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.1)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-300/90">Quick Actions</p>
                <h3 className="mt-1 text-lg font-bold text-white">
                  {logged ? '다시 예약하거나 위치 확인하기' : '바로 예약하고 위치 보기'}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-300">
                  {logged
                    ? '다시 플레이할 예정이라면 예약 페이지로 이동하거나, 지도에서 매장 위치를 다시 확인해보세요.'
                    : '이 테마가 마음에 들면 예약 페이지로 바로 이동하거나, 지도에서 매장 위치를 먼저 확인해보세요.'}
                </p>
              </div>
              <div className="hidden sm:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl">
                📍
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {safeBookingUrl ? (
                <a
                  href={safeBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-[#241804] transition-colors hover:bg-amber-300"
                >
                  <span aria-hidden="true">↗</span>
                  예약하기
                </a>
              ) : (
                <span className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-500">
                  예약 링크 준비중
                </span>
              )}

              {safeMapUrl ? (
                <a
                  href={safeMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-400/30 bg-teal-500/10 px-4 py-3 text-sm font-semibold text-teal-300 transition-colors hover:bg-teal-500/15"
                >
                  <span aria-hidden="true">📍</span>
                  지도 보기
                </a>
              ) : (
                <span className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-500">
                  지도 링크 준비중
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.008)),radial-gradient(circle_at_top_left,rgba(56,189,248,0.055),transparent_36%)] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.1)] backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-teal-300/90">Your Log</p>
                <h3 className="mt-1 text-lg font-bold text-white">
                  {logged ? '이 테마에서 남긴 기록이에요' : '이미 플레이하셨다면 기록해보세요'}
                </h3>
                {logged && myLog ? (
                  <div className="mt-1.5 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${myLog.cleared ? 'text-green-400' : 'text-red-400'}`}>
                        {myLog.cleared ? '탈출 성공' : '탈출 실패'}
                      </span>
                      {myLog.rating !== null && myLog.rating !== undefined && (() => {
                        const def = getRatingDef(myLog.rating!)
                        return def ? (
                          <>
                            <span className="text-gray-600">·</span>
                            <RatingIcon value={def.value} size={16} />
                            <span className="text-sm font-semibold" style={{ color: def.color }}>{def.label}</span>
                          </>
                        ) : null
                      })()}
                      <span className="text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{myLog.played_at}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                      {myLog.cleared && myLog.hints_used !== null && myLog.hints_used !== undefined && (
                        <span>힌트 {myLog.hints_used}개</span>
                      )}
                      {myLog.cleared && myLog.remaining_minutes !== null && myLog.remaining_minutes !== undefined && (
                        <span>남은 시간 {myLog.remaining_minutes}분</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">
                      {myLog.memo
                        ? `한마디: ${myLog.memo}`
                        : '이 테마에서 남긴 감상이 아직 없어요.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300 mt-1">
                    플레이 후 길 평가와 감상을 남기면 다음 추천이 더 정확해져요.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!logged && (
                  <>
                    <button
                      onClick={requestLog}
                      className="app-primary-action min-w-28 px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#041311] text-sm font-bold transition-colors"
                    >
                      기록하기
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">공식 정보</h3>
            <div className="rounded-xl bg-[#13131a] border border-white/8 px-4 py-3">
              <p className="text-xs text-gray-500">위치</p>
              <p className="text-sm text-gray-200 mt-1">{room.address ?? room.location}</p>
              {safeMapUrl && (
                <a
                  href={safeMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex mt-2 text-xs text-green-400 hover:text-green-300"
                >
                  네이버 지도에서 보기 →
                </a>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-[#13131a] border border-white/8 px-4 py-3">
                <p className="text-xs text-gray-500">인원</p>
                <p className="text-sm text-gray-200 mt-1">{room.min_players}-{room.max_players}명</p>
              </div>
              <div className="rounded-xl bg-[#13131a] border border-white/8 px-4 py-3">
                <p className="text-xs text-gray-500">제한시간</p>
                <p className="text-sm text-gray-200 mt-1">{room.duration_minutes}분</p>
              </div>
              <div className="rounded-xl bg-[#13131a] border border-white/8 px-4 py-3">
                <p className="text-xs text-gray-500">가격 (2인 기준)</p>
                <p className="text-sm text-gray-200 mt-1">
                  {room.price_per_person > 0 ? `${room.price_per_person.toLocaleString()}원` : '미확인'}
                </p>
              </div>
              <div className="rounded-xl bg-[#13131a] border border-white/8 px-4 py-3">
                <p className="text-xs text-gray-500">난이도</p>
                <p className="official-label text-sm text-amber-300 mt-1">
                  {room.official_scores?.difficulty !== null && room.official_scores?.difficulty !== undefined ? (
                    <>공식 <DifficultyDots value={room.official_scores.difficulty / 2} /></>
                  ) : room.official_labels?.difficulty ? (
                    <>공식 {room.official_labels.difficulty}</>
                  ) : (
                    '미확인'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">유저 평균 평가</h3>
            <div className="rounded-xl bg-[#13131a] border border-white/8 px-4 py-4">
              {communityRating && ratingDef ? (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <RatingIcon value={ratingDef.value} size={22} />
                    <span className="font-semibold text-sm" style={{ color: ratingDef.color }}>{ratingDef.label}</span>
                    <span className="text-lg font-black text-white ml-1">
                      {formatScore(communityRating.score10)}
                      <span className="text-sm font-normal text-gray-500">/10</span>
                    </span>
                    {SHOW_COMMUNITY_RATING_COUNTS && (
                      <span className="text-xs text-gray-600 ml-auto">· {communityRating.count}명</span>
                    )}
                  </div>
                  {logged && myLog?.rating !== null && myLog?.rating !== undefined && (() => {
                    const myRatingDef = getRatingDef(myLog.rating)
                    return myRatingDef ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-xs uppercase tracking-widest text-amber-300/90">내 평가</span>
                        <RatingIcon value={myRatingDef.value} size={18} />
                        <span className="font-semibold" style={{ color: myRatingDef.color }}>{myRatingDef.label}</span>
                      </div>
                    ) : null
                  })()}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">아직 유저 평가가 없습니다.</p>
              )}
              <div className="border-t border-white/8 mb-4" />
              <div className="space-y-3">
                {METRICS.map(metric => {
                  const community = communityMetricStats[metric.key]
                  const myMetric = myLog ? logMetricValue(myLog, metric.key) : null
                  return (
                    <div key={metric.key} className="flex items-start gap-3">
                      <span className="text-xs text-gray-500 w-14 shrink-0 pt-1">{metric.label}</span>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-12 shrink-0 text-[11px] text-teal-300">유저 평균</span>
                          <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                            {community && (
                              <div
                                className="h-full rounded-full bg-teal-400"
                                style={{ width: `${community.score10 * 10}%` }}
                              />
                            )}
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right shrink-0">
                            {community ? formatScore(community.score10) : '—'}
                          </span>
                        </div>
                        {myMetric !== null && myMetric !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="w-12 shrink-0 text-[11px] text-amber-300">내 평가</span>
                            <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-400"
                                style={{ width: `${myMetric * 10}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-300 w-8 text-right shrink-0">
                              {formatScore(myMetric)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {escapeStats && escapeStats.totalCount >= 1 && (
            <div className="rounded-xl bg-[#13131a] border border-white/8 px-4 py-4">
              <p className="text-xs text-gray-500 mb-3">유저 탈출 통계</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.2" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={escapeStats.clearRate >= 60 ? '#22c55e' : escapeStats.clearRate >= 35 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3.2"
                      strokeDasharray={`${escapeStats.clearRate} ${100 - escapeStats.clearRate}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {escapeStats.clearRate}%
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">탈출 성공률</p>
                  {SHOW_COMMUNITY_RATING_COUNTS && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {escapeStats.clearedCount}/{escapeStats.totalCount}명 성공
                    </p>
                  )}
                </div>
              </div>
              {(escapeStats.avgHintsCleared !== null || escapeStats.avgRemainingMinutes !== null) && (
                <div className="flex gap-3 pt-3 border-t border-white/5">
                  {escapeStats.avgHintsCleared !== null && (
                    <div className="flex-1 bg-white/[0.03] rounded-lg px-3 py-2">
                      <p className="text-[11px] text-gray-500">성공 시 평균 힌트</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{escapeStats.avgHintsCleared}개</p>
                    </div>
                  )}
                  {escapeStats.avgRemainingMinutes !== null && (
                    <div className="flex-1 bg-white/[0.03] rounded-lg px-3 py-2">
                      <p className="text-[11px] text-gray-500">성공 시 평균 남은 시간</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{escapeStats.avgRemainingMinutes}분</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 sticky bottom-4 z-20">
            {logged ? (
              <span className="flex-1 text-center py-3 rounded-xl border border-teal-300/25 bg-white/8 text-teal-100 text-sm font-bold shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md">
                기록 완료
              </span>
            ) : (
              <button
                onClick={requestLog}
                className="app-primary-action flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#041311] text-sm font-bold shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-colors"
              >
                기록하기
              </button>
            )}
            {safeBookingUrl && (
              <a
                href={safeBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#241804] text-sm font-bold text-center shadow-[0_10px_24px_rgba(0,0,0,0.2)] transition-colors"
              >
                예약하기
              </a>
            )}
          </div>

          {reviewLinks.length > 0 && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">후기 모아보기</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {Object.entries(reviewCountByType)
                    .map(([type, count]) => `${REVIEW_SOURCE_LABEL[type as keyof typeof REVIEW_SOURCE_LABEL] ?? '기타'} ${count}`)
                    .join(' · ')}
                </p>
                <p className="text-xs text-gray-600 mt-1">외부 후기는 원문 출처로 이동합니다.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {visibleReviewLinks.map(review => {
                  const safeReviewUrl = safeExternalUrl(review.url)
                  if (!safeReviewUrl) return null

                  return (
                    <a
                      key={review.id}
                      href={safeReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="review-link-card rounded-xl bg-[#13131a] border border-white/8 px-4 py-3 transition-colors hover:border-teal-500/40 hover:bg-[#16161f]"
                    >
                      <div className="flex gap-3">
                        {review.thumbnail_url && (
                          <img
                            src={review.thumbnail_url}
                            alt=""
                            className="w-16 h-16 rounded-lg object-cover bg-[#0e0e16] flex-shrink-0"
                            onError={event => { (event.currentTarget as HTMLImageElement).style.display = 'none' }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="review-source-badge rounded-full px-2 py-0.5 text-[11px] font-semibold">
                              {REVIEW_SOURCE_LABEL[review.source_type]}
                            </span>
                            {review.published_at && (
                              <span className="text-[11px] text-gray-600">{review.published_at}</span>
                            )}
                          </div>
                          <p className="text-sm text-white font-semibold leading-snug">{review.title}</p>
                          {review.author && (
                            <p className="text-xs text-gray-500 mt-1">{review.author}</p>
                          )}
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
              {reviewLinks.length > visibleReviewLinks.length && (
                <p className="text-xs text-gray-500">후기 {reviewLinks.length - visibleReviewLinks.length}개가 더 있습니다.</p>
              )}
            </div>
          )}

          {similarRooms.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">비슷한 테마</h3>
              <div className="grid grid-cols-1 gap-3">
                {similarRooms.map(similar => (
                  <button
                    key={similar.id}
                    onClick={() => navigate(`/rooms/${similar.id}`)}
                    className="text-left rounded-xl bg-[#13131a] border border-white/8 px-4 py-3 transition-colors hover:border-teal-500/40 hover:bg-[#16161f]"
                  >
                    <p className="text-xs text-gray-500">{similar.brand} · {similar.location}</p>
                    <p className="text-sm font-semibold text-white mt-1">{similar.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {similar.genres.map(genre => GENRE_LABEL[genre] ?? genre).slice(0, 3).join(' · ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowReport(true)}
            className="w-full py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-gray-300 text-sm font-semibold transition-colors"
          >
            정보 제보하기
          </button>
        </section>
      </main>
      <Footer />

      {showLog && (
        <LogModal
          room={room}
          onClose={() => setShowLog(false)}
          onSaved={() => {
            setShowLog(false)
            refetchRatings()
          }}
        />
      )}
      <SignInRequiredModal
        open={showSignInGate}
        onClose={() => setShowSignInGate(false)}
        description="플레이 기록은 로그인 후 계정에 저장돼요. 로그인하면 내 기록, 내 평가 비교, 취향 추천을 계속 이어서 볼 수 있어요."
      />
      {showReport && (
        <ReportModal
          themeId={room.id}
          defaultTitle={`${room.name} 정보 제보`}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
