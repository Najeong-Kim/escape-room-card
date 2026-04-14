import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRooms, useRoomFilterOptions, THEMES, filterRooms, INITIAL_FILTERS } from '../../lib/useRooms'
import type { RoomFilters } from '../../lib/useRooms'
import { RoomCard } from './RoomCard'
import { fetchAllCommunityMetricStats, fetchAllCommunityRatings } from '../../lib/communityRatings'
import type { CommunityMetricStats, CommunityRating } from '../../lib/communityRatings'
import { Footer } from '../Footer'

export default function RoomBrowse() {
  const navigate = useNavigate()
  const { rooms, loading, error } = useRooms()
  const { locations, genres } = useRoomFilterOptions()
  const [filters, setFilters] = useState<RoomFilters>(INITIAL_FILTERS)
  const [communityRatings, setCommunityRatings] = useState<Record<number, CommunityRating>>({})
  const [communityMetricStats, setCommunityMetricStats] = useState<Record<number, CommunityMetricStats>>({})

  const refetchRatings = useCallback(() => {
    Promise.all([
      fetchAllCommunityRatings(),
      fetchAllCommunityMetricStats(),
    ]).then(([ratings, metricStats]) => {
      setCommunityRatings(ratings)
      setCommunityMetricStats(metricStats)
    })
  }, [])

  useEffect(() => { refetchRatings() }, [refetchRatings])

  const filtered = useMemo(() => {
    return [...filterRooms(rooms, filters)].sort((a, b) => {
      const aHasRating = communityRatings[a.id] ? 1 : 0
      const bHasRating = communityRatings[b.id] ? 1 : 0
      return bHasRating - aHasRating
    })
  }, [rooms, filters, communityRatings])

  function selectTheme(id: string) {
    setFilters(f => ({
      ...f,
      themeId: f.themeId === id ? null : id,
    }))
  }

  function setLocation(loc: string | null) {
    setFilters(f => ({ ...f, location: loc }))
  }

  function setGenre(genre: string | null) {
    setFilters(f => ({ ...f, genre }))
  }

  function resetFilters() {
    setFilters(INITIAL_FILTERS)
  }

  const hasActiveFilters =
    filters.themeId || filters.location || filters.genre || filters.players || filters.fearMax

  return (
    <div className="min-h-dvh bg-[#0a0a0f] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors p-1"
          aria-label="뒤로"
        >
          ←
        </button>
        <h1 className="font-semibold text-base">방 둘러보기</h1>
        <span className="ml-auto text-xs text-gray-500">
          {loading ? '로딩 중…' : `${filtered.length}개`}
        </span>
      </div>

      <div className="px-4 pt-5 pb-24 max-w-2xl mx-auto space-y-5">
        {/* Theme chips */}
        <section>
          <p className="text-xs text-gray-500 mb-2">테마 추천</p>
          <div className="flex flex-wrap gap-2">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150
                  ${filters.themeId === theme.id
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:border-violet-500/50 hover:text-white'
                  }`}
              >
                <span>{theme.emoji}</span>
                <span>{theme.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Filters */}
        <section className="flex flex-wrap gap-2 items-center">
          {/* Location */}
          <select
            value={filters.location ?? ''}
            onChange={e => setLocation(e.target.value || null)}
            className="bg-[#13131a] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-1.5
                       focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            <option value="">전체 지역</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.label}</option>
            ))}
          </select>

          {/* Genre */}
          <select
            value={filters.genre ?? ''}
            onChange={e => setGenre(e.target.value || null)}
            className="bg-[#13131a] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-1.5
                       focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            <option value="">전체 장르</option>
            {genres.map(g => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-violet-400 hover:text-violet-300 px-2 py-1.5 transition-colors"
            >
              필터 초기화
            </button>
          )}
        </section>

        {/* Results */}
        {error ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">⚠️</p>
            <p>방 목록을 불러오지 못했어요.</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#13131a] rounded-2xl h-44 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">🔍</p>
            <p>조건에 맞는 방이 없어요.</p>
            <button onClick={resetFilters} className="mt-3 text-violet-400 text-sm hover:text-violet-300">
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                communityRating={communityRatings[room.id]}
                communityMetricStats={communityMetricStats[room.id]}
                onRated={refetchRatings}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
