import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchAllCommunityEscapeStats, fetchAllCommunityMetricStats, fetchAllCommunityRatings } from '../../lib/communityRatings'
import type { CommunityEscapeStats, CommunityMetricStats, CommunityRating, MetricKey } from '../../lib/communityRatings'
import { getRatingDef, RatingIcon, score10ToPathRating } from '../../lib/ratings'
import { useRoomLogs } from '../../lib/useRoomLogs'
import { useRooms } from '../../lib/useRooms'
import { buildPersonalRecommendationModel, predictionPathLabel, predictionPathRating } from '../../lib/personalRecommendations'
import { fetchThemeReviewLinks, REVIEW_SOURCE_LABEL, type ThemeReviewLink } from '../../lib/themeReviewLinks'
import { ReportModal } from '../ReportModal'
import { Footer } from '../Footer'
import { LogModal } from '../RoomLog/LogModal'
import { AppTopActions } from '../AppTopActions'
import type { Room } from '../../lib/recommend'
import { SHOW_COMMUNITY_RATING_COUNTS } from '../../lib/featureFlags'

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
  operation: 'bg-violet-500/12 border-violet-400/25 text-violet-200',
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
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
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
  if (room.naver_place_url) return room.naver_place_url
  if (room.naver_place_id) return `https://map.naver.com/p/entry/place/${room.naver_place_id}`

  return `https://map.naver.com/p/search/${encodeURIComponent(`${room.brand} ${room.location} 방탈출`)}`
}

export default function RoomDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const roomId = Number(id)
  const { rooms, loading, error } = useRooms()
  const room = useMemo(() => rooms.find(item => item.id === roomId), [rooms, roomId])
  const [communityRating, setCommunityRating] = useState<CommunityRating | undefined>()
  const [communityMetricStats, setCommunityMetricStats] = useState<CommunityMetricStats>({})
  const [escapeStats, setEscapeStats] = useState<CommunityEscapeStats | undefined>()
  const [reviewLinks, setReviewLinks] = useState<ThemeReviewLink[]>([])
  const [showLog, setShowLog] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [logs] = useRoomLogs()
  const logged = useMemo(() => logs.some(log => log.room_id === roomId), [logs, roomId])

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
        <AppTopActions />
        <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-sm border-b border-white/5 px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">← 뒤로</button>
        </div>
        <div className="px-4 py-20 text-center text-gray-500">
          <p>방 정보를 불러오지 못했습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0f] text-white">
      <AppTopActions />
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-sm border-b border-white/5 px-4 py-3 pr-36 sm:pr-4 flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors p-1"
          aria-label="뒤로"
        >
          ←
        </button>
        <h1 className="font-semibold text-base truncate">방 상세</h1>
      </div>

      <main className="max-w-2xl mx-auto pb-24">
        {room.image_url ? (
          <img
            src={room.image_url}
            alt={room.name}
            className="w-full h-64 object-cover bg-[#13131a]"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-violet-900/30 to-[#0a0a0f] flex items-center justify-center">
            <span className="text-5xl opacity-30">🔐</span>
          </div>
        )}

        <section className="px-4 pt-6 space-y-6">
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#13131a] border border-white/8 px-4 py-3 col-span-2">
              <p className="text-xs text-gray-500">위치</p>
              <p className="text-sm text-gray-200 mt-1">{room.address ?? room.location}</p>
              <a
                href={naverMapUrl(room)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex mt-2 text-xs text-green-400 hover:text-green-300"
              >
                네이버 지도에서 보기 →
              </a>
            </div>
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
          </div>

          <div className="rounded-xl bg-[#13131a] border border-white/8 px-4 py-4">
            <p className="text-xs text-gray-500 mb-2">길 평가</p>
            {communityRating && ratingDef ? (
              <div className="flex items-center gap-2">
                <RatingIcon value={ratingDef.value} size={24} />
                <span className="text-lg font-bold" style={{ color: ratingDef.color }}>
                  {formatScore(communityRating.score10)}/10
                </span>
                <span className="text-sm text-gray-500">
                  {ratingDef.label}
                  {SHOW_COMMUNITY_RATING_COUNTS && ` · ${communityRating.count}명`}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500">아직 유저 평가가 없습니다.</p>
            )}
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

          {personalPrediction && !logged && (
            <div className="personal-score rounded-xl border border-violet-500/25 bg-violet-950/20 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-violet-300 font-semibold">나의 예상 길</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {personalPrediction.reasons[0] ?? '내 기록을 바탕으로 계산했어요.'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-white text-2xl font-black">
                  <RatingIcon value={predictionPathRating(personalPrediction)} size={24} />
                  {predictionPathLabel(personalPrediction).replace('예상 ', '')}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold">세부 지표</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {METRICS.map(metric => {
                const community = communityMetricStats[metric.key]
                const officialScore = room.official_scores?.[metric.key]
                const officialLabel = room.official_labels?.[metric.key]
                return (
                  <div key={metric.key} className="rounded-xl bg-[#13131a] border border-white/8 px-4 py-3">
                    <p className="text-xs text-gray-500">{metric.label}</p>
                    {community ? (
                      <p className="text-sm text-gray-200 mt-1">
                        유저 {formatScore(community.score10)}/10
                        {SHOW_COMMUNITY_RATING_COUNTS && (
                          <span className="text-gray-600"> · {community.count}명</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">유저 평가 없음</p>
                    )}
                    {metric.key === 'difficulty' && (officialScore !== null && officialScore !== undefined || officialLabel !== null && !isNaN(Number(officialLabel))) ? (
                      <p className="official-label text-sm text-amber-300 mt-1">
                        공식 <DifficultyDots value={officialScore !== null && officialScore !== undefined ? officialScore / 2 : Number(officialLabel)} />
                      </p>
                    ) : officialScore !== null && officialScore !== undefined ? (
                      <p className="official-label text-sm text-amber-300 mt-1">공식 {formatScore(officialScore)}/10</p>
                    ) : officialLabel ? (
                      <p className="official-label text-sm text-amber-300 mt-1">공식 {officialLabel}</p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3">
            {logged ? (
              <span className="flex-1 text-center py-3 rounded-xl bg-green-900/20 border border-green-500/20 text-green-400 text-sm font-medium">
                기록됨
              </span>
            ) : (
              <button
                onClick={() => setShowLog(true)}
                className="app-primary-action flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
              >
                기록하기
              </button>
            )}
            {room.website_url && (
              <a
                href={room.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="app-secondary-action flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-100 text-sm font-semibold text-center transition-colors"
              >
                예약 페이지
              </a>
            )}
          </div>

          {reviewLinks.length > 0 && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">후기 모아보기</h3>
                <p className="text-xs text-gray-500 mt-1">블로그, 유튜브, 인스타 후기를 한 곳에서 확인해 보세요.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {reviewLinks.map(review => (
                  <a
                    key={review.id}
                    href={review.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="review-link-card rounded-xl bg-[#13131a] border border-white/8 px-4 py-3 transition-colors hover:border-violet-500/40 hover:bg-[#16161f]"
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
