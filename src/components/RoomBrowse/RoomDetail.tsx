import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchAllCommunityMetricStats, fetchAllCommunityRatings } from '../../lib/communityRatings'
import type { CommunityMetricStats, CommunityRating, MetricKey } from '../../lib/communityRatings'
import { getRatingDef, RatingIcon } from '../../lib/ratings'
import type { PathRating } from '../../lib/ratings'
import { hasLog } from '../../lib/roomLog'
import { useRooms } from '../../lib/useRooms'
import { LogModal } from '../RoomLog/LogModal'

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

export default function RoomDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const roomId = Number(id)
  const { rooms, loading, error } = useRooms()
  const room = useMemo(() => rooms.find(item => item.id === roomId), [rooms, roomId])
  const [communityRating, setCommunityRating] = useState<CommunityRating | undefined>()
  const [communityMetricStats, setCommunityMetricStats] = useState<CommunityMetricStats>({})
  const [showLog, setShowLog] = useState(false)
  const [logged, setLogged] = useState(() => hasLog(roomId))

  const refetchRatings = useCallback(() => {
    Promise.all([
      fetchAllCommunityRatings(),
      fetchAllCommunityMetricStats(),
    ]).then(([ratings, metricStats]) => {
      setCommunityRating(ratings[roomId])
      setCommunityMetricStats(metricStats[roomId] ?? {})
    })
  }, [roomId])

  useEffect(() => { refetchRatings() }, [refetchRatings])

  const ratingLevel = communityRating
    ? (Math.round(communityRating.score10 / 2) as PathRating)
    : null
  const ratingDef = ratingLevel !== null ? getRatingDef(ratingLevel) : null

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
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center gap-3">
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
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white/80"
                  style={{ backgroundColor: GENRE_COLOR[genre] ?? '#2a2a3a' }}
                >
                  {GENRE_LABEL[genre] ?? genre}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#13131a] border border-white/8 px-4 py-3">
              <p className="text-xs text-gray-500">위치</p>
              <p className="text-sm text-gray-200 mt-1">{room.location}</p>
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
              <p className="text-xs text-gray-500">가격</p>
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
                <span className="text-sm text-gray-500">{ratingDef.label} · {communityRating.count}명</span>
              </div>
            ) : (
              <p className="text-sm text-gray-500">아직 유저 평가가 없습니다.</p>
            )}
          </div>

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
                        <span className="text-gray-600"> · {community.count}명</span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">유저 평가 없음</p>
                    )}
                    {officialScore !== null && officialScore !== undefined ? (
                      <p className="text-sm text-amber-300 mt-1">공식 {formatScore(officialScore)}/10</p>
                    ) : officialLabel ? (
                      <p className="text-sm text-amber-300 mt-1">공식 {officialLabel}</p>
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
                className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
              >
                기록하기
              </button>
            )}
            {room.website_url && (
              <a
                href={room.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-100 text-sm font-semibold text-center transition-colors"
              >
                예약 페이지
              </a>
            )}
          </div>
        </section>
      </main>

      {showLog && (
        <LogModal
          room={room}
          onClose={() => setShowLog(false)}
          onSaved={() => {
            setLogged(true)
            setShowLog(false)
            refetchRatings()
          }}
        />
      )}
    </div>
  )
}
