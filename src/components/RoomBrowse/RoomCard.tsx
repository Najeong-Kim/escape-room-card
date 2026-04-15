import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Room } from '../../lib/recommend'
import { hasLog } from '../../lib/roomLog'
import { LogModal } from '../RoomLog/LogModal'
import { getRatingDef, RatingIcon } from '../../lib/ratings'
import type { PathRating } from '../../lib/ratings'
import type { CommunityMetricStats, CommunityRating } from '../../lib/communityRatings'
import type { PersonalPrediction } from '../../lib/personalRecommendations'
import { predictionPathLabel, predictionPathRating } from '../../lib/personalRecommendations'

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

const FEAR_LABEL: Record<number, string> = {
  1: '매우 낮음',
  2: '낮음',
  3: '보통',
  4: '높음',
  5: '매우 높음',
}

function clampDots(value: number) {
  return Math.max(0, Math.min(5, Math.round(value)))
}

function levelLabel(value: number) {
  return FEAR_LABEL[clampDots(value)] ?? String(value)
}

function DifficultyDots({ value }: { value: number }) {
  const dots = clampDots(value)
  return (
    <span className="flex gap-[3px]">
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


interface RoomCardProps {
  room: Room
  communityRating?: CommunityRating
  communityMetricStats?: CommunityMetricStats
  personalPrediction?: PersonalPrediction
  onRated?: () => void
}


export function RoomCard({ room, communityRating, communityMetricStats, personalPrediction, onRated }: RoomCardProps) {
  const [showLog, setShowLog] = useState(false)
  const [logged, setLogged] = useState(() => hasLog(room.id))

  // 커뮤니티 평점을 PathRating 레벨로 변환 (소수 → 반올림)
  const ratingLevel = communityRating
    ? (Math.round(communityRating.score10 / 2) as PathRating)
    : null
  const ratingDef = ratingLevel !== null ? getRatingDef(ratingLevel) : null
  const difficultyRawScore =
    communityMetricStats?.difficulty?.score10 ??
    room.official_scores?.difficulty ??
    null
  const difficultyRawLabel = room.official_labels?.difficulty ?? null
  const difficultyLabelAsNum =
    difficultyRawLabel !== null && !isNaN(Number(difficultyRawLabel))
      ? Number(difficultyRawLabel)
      : null
  const difficultyDots =
    difficultyRawScore !== null
      ? clampDots(difficultyRawScore / 2)
      : difficultyLabelAsNum !== null
      ? clampDots(difficultyLabelAsNum)
      : null
  const difficultyTextLabel = difficultyDots === null ? difficultyRawLabel : null

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

        {/* Genres + difficulty */}
        <div className="flex flex-wrap items-center gap-1.5">
          {room.genres?.map(g => (
            <span
              key={g}
              className="genre-tag px-2 py-0.5 rounded-full text-xs font-medium text-white/80"
              style={{
                '--genre-bg': GENRE_COLOR[g] ?? '#2a2a3a',
                '--genre-light-bg': GENRE_LIGHT_COLOR[g] ?? '#374151',
              } as CSSProperties}
            >
              {GENRE_LABEL[g] ?? g}
            </span>
          ))}
          {(difficultyDots !== null || difficultyTextLabel) && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-xs text-gray-400">
              <span className="text-gray-500">난이도</span>
              {difficultyDots !== null ? (
                <DifficultyDots value={difficultyDots} />
              ) : (
                <span className="text-amber-400">{difficultyTextLabel}</span>
              )}
            </span>
          )}
        </div>

        {personalPrediction && !logged && (
          <div className="personal-score rounded-xl border border-violet-500/25 bg-violet-950/20 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-violet-300 font-semibold">나의 예상 길</span>
              <span className="inline-flex items-center gap-1 text-sm text-white font-black">
                <RatingIcon value={predictionPathRating(personalPrediction)} size={18} />
                {predictionPathLabel(personalPrediction)}
              </span>
            </div>
            {personalPrediction.reasons[0] && (
              <p className="text-[11px] text-gray-500 mt-1">{personalPrediction.reasons[0]}</p>
            )}
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
            <p className="text-gray-200">{levelLabel(room.fear_level)}</p>
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
