import type { Room } from '../../lib/recommend'

const GENRE_LABEL: Record<string, string> = {
  Horror: '공포',
  MysteryThriller: '미스터리/스릴러',
  Emotional: '감성',
  Comic: '코믹',
  FantasyAdventure: '판타지/어드벤처',
}

const GENRE_COLOR: Record<string, string> = {
  Horror: '#3b1021',
  MysteryThriller: '#173467',
  Emotional: '#4a1040',
  Comic: '#c24b16',
  FantasyAdventure: '#23644e',
}

const FEAR_LABEL: Record<number, string> = {
  1: '매우 낮음',
  2: '낮음',
  3: '보통',
  4: '높음',
  5: '매우 높음',
}

interface RoomCardProps {
  room: Room
}

export function RoomCard({ room }: RoomCardProps) {
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
            <span className="text-violet-400 font-bold text-lg">⭐ {room.rating_avg?.toFixed(1) ?? '—'}</span>
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

        {/* Website link */}
        {room.website_url && (
          <div className="pt-1 border-t border-white/5">
            <span className="text-xs text-violet-400">예약 페이지 →</span>
          </div>
        )}
      </div>
    </div>
  )

  if (room.website_url) {
    return (
      <a href={room.website_url} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    )
  }
  return inner
}
