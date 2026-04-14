import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Room } from '../../lib/recommend'
import { hasLog } from '../../lib/roomLog'
import { LogModal } from '../RoomLog/LogModal'
import { getRatingDef, RatingIcon } from '../../lib/ratings'
import type { PathRating } from '../../lib/ratings'
import type { CommunityMetricStats, CommunityRating, MetricKey } from '../../lib/communityRatings'

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

const FEAR_LABEL: Record<number, string> = {
  1: '매우 낮음',
  2: '낮음',
  3: '보통',
  4: '높음',
  5: '매우 높음',
}

const METRIC_LABELS: { key: MetricKey; label: string }[] = [
  { key: 'difficulty', label: '난이도' },
  { key: 'fear', label: '공포도' },
  { key: 'activity', label: '활동성' },
  { key: 'story', label: '스토리' },
  { key: 'interior', label: '인테리어' },
  { key: 'aging', label: '노후화' },
]

interface RoomCardProps {
  room: Room
  communityRating?: CommunityRating
  communityMetricStats?: CommunityMetricStats
  onRated?: () => void
}

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

export function RoomCard({ room, communityRating, communityMetricStats, onRated }: RoomCardProps) {
  const [showLog, setShowLog] = useState(false)
  const [logged, setLogged] = useState(() => hasLog(room.id))

  // 커뮤니티 평점을 PathRating 레벨로 변환 (소수 → 반올림)
  const ratingLevel = communityRating
    ? (Math.round(communityRating.score10 / 2) as PathRating)
    : null
  const ratingDef = ratingLevel !== null ? getRatingDef(ratingLevel) : null
  const visibleMetrics = METRIC_LABELS.filter(metric => {
    const officialScore = room.official_scores?.[metric.key]
    return Boolean(
      communityMetricStats?.[metric.key] ||
      officialScore !== null && officialScore !== undefined ||
      room.official_labels?.[metric.key]
    )
  })

  const inner = (
    <div className="bg-[#13131a] border border-white/8 rounded-2xl overflow-hidden flex flex-col
                    hover:border-violet-500/40 hover:bg-[#16161f] transition-all duration-200">
      {/* Image */}
      {room.image_url ? (
        <img
          src={room.image_url}
          alt={room.name}
          className="w-full h-36 object-cover"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="w-full h-24 bg-gradient-to-br from-violet-900/30 to-[#0a0a0f] flex items-center justify-center">
          <span className="text-3xl opacity-30">🔐</span>
        </div>
      )}

      <div className="p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">{room.brand}</p>
            <h3 className="text-white font-semibold text-base leading-snug">{room.name}</h3>
          </div>
          <div className="flex-shrink-0 text-right">
            {communityRating && ratingDef ? (
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1">
                  <RatingIcon value={ratingDef.value} size={18} />
                  <span className="text-sm font-bold" style={{ color: ratingDef.color }}>
                    {communityRating.score10}
                  </span>
                  <span className="text-xs text-gray-500">/ 10</span>
                </div>
                <span className="text-xs font-medium" style={{ color: ratingDef.color }}>
                  {ratingDef.label}
                </span>
                <span className="text-xs text-gray-600">{communityRating.count}명</span>
              </div>
            ) : (
              <span className="text-xs text-gray-600 mt-1 block">평가 없음</span>
            )}
          </div>
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1.5">
          {room.genres?.map(g => (
            <span
              key={g}
              className="px-2 py-0.5 rounded-full text-xs font-medium text-white/80"
              style={{ backgroundColor: GENRE_COLOR[g] ?? '#2a2a3a' }}
            >
              {GENRE_LABEL[g] ?? g}
            </span>
          ))}
        </div>

        {visibleMetrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {visibleMetrics.map(metric => {
            const community = communityMetricStats?.[metric.key]
            const officialScore = room.official_scores?.[metric.key]
            const officialLabel = room.official_labels?.[metric.key]

            return (
              <div key={metric.key} className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                <p className="text-[11px] text-gray-500">{metric.label}</p>
                {community ? (
                  <p className="text-xs text-gray-200">
                    유저 {formatScore(community.score10)}/10
                    <span className="text-gray-600"> · {community.count}명</span>
                  </p>
                ) : null}
                {officialScore !== null && officialScore !== undefined ? (
                  <p className="text-xs text-amber-300">공식 {formatScore(officialScore)}/10</p>
                ) : officialLabel ? (
                  <p className="text-xs text-amber-300">공식 {officialLabel}</p>
                ) : null}
              </div>
            )
            })}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500 text-xs">위치</span>
            <p className="text-gray-200">{room.location}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">공포도</span>
            <p className="text-gray-200">{FEAR_LABEL[room.fear_level] ?? room.fear_level}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">인원</span>
            <p className="text-gray-200">{room.min_players}–{room.max_players}명</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">제한시간</span>
            <p className="text-gray-200">{room.duration_minutes}분</p>
          </div>
        </div>

        {/* Tags */}
        {room.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
            {room.tags.map(tag => (
              <span key={tag} className="text-xs text-gray-500">#{tag}</span>
            ))}
          </div>
        )}

        {/* Detail link */}
        <div className="pt-1 border-t border-white/5">
          <span className="text-xs text-violet-400">상세 보기 →</span>
        </div>

        {/* Website link */}
        {room.website_url && (
          <div className="pt-1 border-t border-white/5">
            <span className="text-xs text-gray-500">예약 페이지 연결 가능</span>
          </div>
        )}

        {/* Log button */}
        <div className="pt-2 border-t border-white/5 flex justify-end">
          {logged ? (
            <span className="text-xs text-green-500 font-medium">✓ 기록됨</span>
          ) : (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setShowLog(true) }}
              className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30
                         hover:bg-violet-900/20 px-3 py-1 rounded-lg transition-all"
            >
              + 기록하기
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Link to={`/rooms/${room.id}`} className="block">
        {inner}
      </Link>
      {showLog && (
        <LogModal
          room={room}
          onClose={() => setShowLog(false)}
          onSaved={() => { setLogged(true); setShowLog(false); onRated?.() }}
        />
      )}
    </>
  )

}
