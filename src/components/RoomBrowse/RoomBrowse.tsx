import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRooms, useRoomFilterOptions, THEMES, TAG_FILTERS, filterRooms, INITIAL_FILTERS, tagFilterButtonClass } from '../../lib/useRooms'
import type { RoomFilters } from '../../lib/useRooms'
import { RoomCard } from './RoomCard'
import { fetchAllCommunityMetricStats, fetchAllCommunityRatings } from '../../lib/communityRatings'
import type { CommunityMetricStats, CommunityRating } from '../../lib/communityRatings'
import { Footer } from '../Footer'
import { GlobalNav } from '../GlobalNav'
import { useRoomLogs } from '../../lib/useRoomLogs'
import { buildPersonalRecommendationModel, predictionConfidenceLabel, predictionPathLabel, predictionPathRating } from '../../lib/personalRecommendations'
import { RatingIcon } from '../../lib/ratings'

const PAGE_SIZE = 30

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, '')
}

function matchesSearch(room: ReturnType<typeof filterRooms>[number], searchTerm: string) {
  const query = normalizeSearch(searchTerm)
  if (!query) return true

  const haystack = normalizeSearch([
    room.name,
    room.brand,
    room.location,
    room.address ?? '',
    ...room.genres,
    ...(room.theme_tags?.map(tag => tag.name) ?? []),
  ].join(' '))

  return haystack.includes(query)
}

export default function RoomBrowse() {
  const navigate = useNavigate()
  const { rooms, loading, error } = useRooms()
  const { locations, genres } = useRoomFilterOptions()
  const [filters, setFilters] = useState<RoomFilters>(INITIAL_FILTERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [logs] = useRoomLogs()
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

  const personalModel = useMemo(
    () => buildPersonalRecommendationModel(rooms, logs, communityMetricStats, communityRatings),
    [rooms, logs, communityMetricStats, communityRatings],
  )
  const loggedRoomIds = useMemo(() => new Set(logs.map(log => log.room_id)), [logs])

  const filtered = useMemo(() => {
    return [...filterRooms(rooms, filters, loggedRoomIds, communityRatings)]
      .filter(room => matchesSearch(room, searchTerm))
      .sort((a, b) => {
      const aHasRating = communityRatings[a.id] ? 1 : 0
      const bHasRating = communityRatings[b.id] ? 1 : 0
      return bHasRating - aHasRating
    })
  }, [rooms, filters, loggedRoomIds, searchTerm, communityRatings])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filters, searchTerm])

  const visibleRooms = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

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

  function toggleTag(tagId: string) {
    setFilters(f => ({
      ...f,
      tagIds: f.tagIds.includes(tagId)
        ? f.tagIds.filter(id => id !== tagId)
        : [...f.tagIds, tagId],
    }))
  }

  function toggleOnlyUnlogged() {
    setFilters(f => ({ ...f, onlyUnlogged: !f.onlyUnlogged }))
  }

  function resetFilters() {
    setFilters(INITIAL_FILTERS)
    setSearchTerm('')
  }

  const hasActiveFilters =
    filters.themeId || filters.location || filters.genre || filters.tagIds.length > 0 || filters.players || filters.fearMax || filters.onlyUnlogged || searchTerm.trim()

  return (
    <div className="min-h-dvh bg-[#0a0a0f] text-white">
      <GlobalNav />
      <div className="px-4 pt-5 pb-24 max-w-2xl mx-auto space-y-5">
        <section className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-teal-300/80">Room Explorer</p>
            <h1 className="mt-1 text-2xl font-bold text-white">방 둘러보기</h1>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500">방탈출 테마</p>
            <p className="text-lg font-semibold text-white">{loading ? '…' : filtered.length.toLocaleString()}개</p>
          </div>
        </section>

        {/* Theme chips */}
        {personalModel?.lifeTheme && (
          <section className="personal-score rounded-2xl border border-teal-500/30 bg-teal-950/20 px-4 py-4">
            <p className="text-xs text-teal-300 font-semibold mb-1">나의 인생테마 후보</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-white font-bold text-lg truncate">{personalModel.lifeTheme.room.name}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{personalModel.lifeTheme.room.brand}</p>
                <p className="text-xs text-teal-300 font-semibold mt-2">
                  {predictionConfidenceLabel(personalModel.lifeTheme.prediction)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {personalModel.lifeTheme.prediction.reasons[0] ?? '내 기록과 가장 가까운 테마예요.'}
                </p>
              </div>
              <div className="flex-shrink-0 sm:text-right">
                <div className="flex items-center gap-1 text-teal-300 text-xl font-black">
                  <RatingIcon value={predictionPathRating(personalModel.lifeTheme.prediction)} size={20} />
                  {predictionPathLabel(personalModel.lifeTheme.prediction).replace('예상 ', '')}
                </div>
                <p className="text-xs text-gray-500">예상 길</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/rooms/${personalModel.lifeTheme?.room.id}`)}
              className="app-secondary-action w-full mt-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-100 text-sm font-semibold transition-colors"
            >
              후보 자세히 보기
            </button>
          </section>
        )}

        <section>
          <p className="text-xs text-gray-500 mb-2">테마 추천</p>
          <div className="flex flex-wrap gap-2">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150
                  ${filters.themeId === theme.id
                    ? 'bg-teal-600 border-teal-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:border-teal-500/50 hover:text-white'
                  }`}
              >
                <span>{theme.emoji}</span>
                <span>{theme.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs text-gray-500 mb-2">태그 필터</p>
          <div className="flex flex-wrap gap-2">
            {TAG_FILTERS.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150
                  ${tagFilterButtonClass(tag, filters.tagIds.includes(tag.id))}`}
              >
                <span>{tag.emoji}</span>
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Filters */}
        <section className="space-y-3">
          <input
            type="search"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="테마명, 매장명, 지역, 태그 검색"
            className="w-full rounded-xl border border-white/10 bg-[#13131a] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-teal-500/60"
          />
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {/* Location */}
          <select
            value={filters.location ?? ''}
            onChange={e => setLocation(e.target.value || null)}
            className="w-full sm:w-auto bg-[#13131a] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2
                       focus:outline-none focus:border-teal-500/50 cursor-pointer"
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
            className="w-full sm:w-auto bg-[#13131a] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2
                       focus:outline-none focus:border-teal-500/50 cursor-pointer"
          >
            <option value="">전체 장르</option>
            {genres.map(g => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={toggleOnlyUnlogged}
            className={[
              'w-full sm:w-auto rounded-lg border px-3 py-2 text-sm font-medium transition-all',
              filters.onlyUnlogged
                ? 'border-teal-500 bg-teal-600 text-white'
                : 'border-white/10 bg-[#13131a] text-gray-300 hover:border-teal-500/50 hover:text-white',
            ].join(' ')}
          >
            기록 안 한 테마만
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-teal-400 hover:text-teal-300 px-2 py-2 text-left transition-colors"
            >
              필터 초기화
            </button>
          )}
          </div>
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
            <button onClick={resetFilters} className="mt-3 text-teal-400 text-sm hover:text-teal-300">
              필터 초기화
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  communityRating={communityRatings[room.id]}
                  communityMetricStats={communityMetricStats[room.id]}
                  personalPrediction={personalModel?.predictions[room.id]}
                  onRated={refetchRatings}
                />
              ))}
            </div>
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
                className="app-secondary-action w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-gray-100 transition-colors hover:bg-white/10"
              >
                더 보기 ({visibleRooms.length}/{filtered.length})
              </button>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
