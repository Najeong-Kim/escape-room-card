import { useState, useEffect } from 'react'
import type { Room } from './recommend'
import { themeToRoom } from './themeCatalog'
import type { ThemeCatalogRow } from './themeCatalog'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export interface Theme {
  id: string
  label: string
  emoji: string
  filter: (room: Room) => boolean
}

export interface TagFilter {
  id: string
  label: string
  emoji: string
  tone?: 'amber' | 'emerald' | 'sky' | 'rose'
  match: (room: Room, communityRating?: { score10: number } | null) => boolean
}

function hasThemeTag(room: Room, codes: string[], names: string[] = []) {
  const tags = room.theme_tags ?? []
  return tags.some(tag =>
    codes.includes(tag.code) ||
    names.includes(tag.name) ||
    codes.some(code => tag.code.includes(code)) ||
    names.some(name => tag.name.includes(name)),
  )
}

function normalized(value: string | undefined) {
  return (value ?? '').toLowerCase().replace(/\s+/g, '')
}

export const TAG_FILTERS: TagFilter[] = [
  {
    id: 'crime-scene',
    label: '크라임씬',
    emoji: '🕵️',
    tone: 'sky',
    match: room =>
      hasThemeTag(room, ['crime_scene', 'crime-scene'], ['크라임씬']) ||
      normalized(room.name).includes('크라임씬') ||
      normalized(room.brand).includes('크라임씬카페'),
  },
  {
    id: 'outdoor',
    label: '야외테마',
    emoji: '🌿',
    tone: 'emerald',
    match: room =>
      hasThemeTag(room, ['outdoor'], ['야외']) ||
      normalized(room.name).includes('야외'),
  },
  {
    id: 'horror-theme',
    label: '공포테마',
    emoji: '👻',
    tone: 'rose',
    match: room =>
      hasThemeTag(room, ['strong_horror', 'horror_theme'], ['공포', '공포 강함']) ||
      room.genres.includes('Horror') ||
      room.fear_level >= 4,
  },
  {
    id: 'commercial',
    label: '영업용',
    emoji: '🏪',
    tone: 'amber',
    match: room => {
      const score = room.official_scores?.difficulty
      if (score !== null && score !== undefined) return score <= 6
      const label = room.official_labels?.difficulty
      if (label !== null && label !== undefined && !isNaN(Number(label))) return Number(label) <= 3
      return false
    },
  },
  {
    id: 'dirt-road',
    label: '흙길 탐방',
    emoji: '🪨',
    tone: 'rose',
    match: (_room, communityRating) => communityRating !== null && communityRating !== undefined && communityRating.score10 < 4,
  },
]

export function getMatchingTagFilters(room: Room): TagFilter[] {
  return TAG_FILTERS.filter(tag => tag.match(room))
}

export function tagFilterButtonClass(tag: TagFilter, selected: boolean) {
  if (selected) {
    if (tag.tone === 'rose') return 'bg-rose-400 border-rose-300 text-[#2b0d16]'
    if (tag.tone === 'emerald') return 'bg-emerald-400 border-emerald-300 text-[#0d261d]'
    if (tag.tone === 'sky') return 'bg-sky-400 border-sky-300 text-[#0d2230]'
    return 'bg-amber-400 border-amber-300 text-[#241804]'
  }

  if (tag.tone === 'rose') return 'tag-filter-tone-rose bg-white/5 border-white/10 text-rose-200 hover:border-rose-300/50 hover:text-rose-100'
  if (tag.tone === 'emerald') return 'tag-filter-tone-emerald bg-white/5 border-white/10 text-emerald-200 hover:border-emerald-300/50 hover:text-emerald-100'
  if (tag.tone === 'sky') return 'tag-filter-tone-sky bg-white/5 border-white/10 text-sky-200 hover:border-sky-300/50 hover:text-sky-100'
  return 'tag-filter-tone-amber bg-white/5 border-white/10 text-gray-300 hover:border-amber-300/50 hover:text-white'
}

export function tagFilterPillClass(tag: TagFilter) {
  if (tag.tone === 'rose') return 'border-rose-200/40 bg-rose-500/28 text-rose-50'
  if (tag.tone === 'emerald') return 'border-emerald-300/30 bg-emerald-400/14 text-emerald-100'
  if (tag.tone === 'sky') return 'border-sky-300/30 bg-sky-400/14 text-sky-100'
  return 'border-amber-300/25 bg-amber-400/10 text-amber-100'
}

export const THEMES: Theme[] = [
  { id: 'solo',    label: '혼방 가능',    emoji: '🧍', filter: r => r.min_players <= 2 },
  { id: 'large',   label: '6인+ 가능',    emoji: '👥', filter: r => r.max_players >= 6 },
  { id: 'fear-in', label: '공포 입문',    emoji: '😨', filter: r => r.fear_level <= 2 },
  { id: 'fear-ex', label: '공포 고수',    emoji: '💀', filter: r => r.fear_level >= 4 },
  { id: 'interior',label: '인테리어 맛집', emoji: '✨', filter: r => r.interior_score >= 4.5 },
  { id: 'date',    label: '데이트 코스',  emoji: '💑', filter: r => r.interior_score >= 4.0 && r.genres.includes('Emotional') },
  { id: 'puzzle',  label: '추리 특화',    emoji: '🔍', filter: r => r.puzzle_weight >= 4 },
]

export interface RoomFilters {
  themeId: string | null
  location: string | null
  genre: string | null
  tagIds: string[]
  players: number | null
  fearMax: number | null
  onlyUnlogged: boolean
}

export interface FilterOption {
  id: string
  label: string
}

export const INITIAL_FILTERS: RoomFilters = {
  themeId: null,
  location: null,
  genre: null,
  tagIds: [],
  players: null,
  fearMax: null,
  onlyUnlogged: false,
}

export function filterRooms(
  rooms: Room[],
  filters: RoomFilters,
  loggedRoomIds = new Set<number>(),
  communityRatings: Record<number, { score10: number }> = {},
): Room[] {
  const theme = filters.themeId ? THEMES.find(t => t.id === filters.themeId) : null
  const selectedTagFilters = filters.tagIds
    .map(id => TAG_FILTERS.find(tag => tag.id === id))
    .filter((tag): tag is TagFilter => Boolean(tag))

  return rooms.filter(room => {
    if (theme && !theme.filter(room)) return false
    if (filters.location && room.location !== filters.location) return false
    if (filters.genre && !room.genres.includes(filters.genre)) return false
    if (selectedTagFilters.length > 0 && !selectedTagFilters.every(tag => tag.match(room, communityRatings[room.id]))) return false
    if (filters.players !== null && room.max_players < filters.players) return false
    if (filters.fearMax !== null && room.fear_level > filters.fearMax) return false
    if (filters.onlyUnlogged && loggedRoomIds.has(room.id)) return false
    return true
  })
}

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const query = new URLSearchParams({
      select: [
        'id',
        'name',
        'genre_labels',
        'duration_minutes',
        'min_players',
        'max_players',
        'price_per_person',
        'difficulty_label',
        'difficulty_score',
        'fear_label',
        'fear_score',
        'activity_label',
        'activity_score',
        'story_label',
        'interior_label',
        'aging_label',
        'interior_score',
        'story_score',
        'aging_score',
        'image_url',
        'image_status',
        'booking_url',
        'theme_genres(genres(code))',
        'theme_taggings(status,theme_tags(code,name,category,is_active))',
        'cafes!inner(name,branch_name,area_label,address,booking_url,website_url,naver_place_id,naver_place_url,areas(name))',
      ].join(','),
      status: 'eq.active',
      needs_review: 'eq.false',
      'cafes.status': 'eq.active',
      'cafes.needs_review': 'eq.false',
      order: 'name.asc',
    })

    fetch(`${SUPABASE_URL}/rest/v1/themes?${query.toString()}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json() })
      .then((data: ThemeCatalogRow[]) => { setRooms(data.map(themeToRoom)); setLoading(false) })
      .catch(e => { setError(e); setLoading(false) })
  }, [])

  return { rooms, loading, error }
}

export function useRoomFilterOptions() {
  const [locations, setLocations] = useState<FilterOption[]>([])
  const [genres, setGenres] = useState<FilterOption[]>([])

  useEffect(() => {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    }

    Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/areas?select=name&order=sort_order.asc`, { headers })
        .then(r => { if (!r.ok) throw new Error('areas fetch failed'); return r.json() }),
      fetch(`${SUPABASE_URL}/rest/v1/genres?select=code,name&order=sort_order.asc`, { headers })
        .then(r => { if (!r.ok) throw new Error('genres fetch failed'); return r.json() }),
    ])
      .then(([areaRows, genreRows]: [{ name: string }[], { code: string; name: string }[]]) => {
        setLocations(areaRows.map(area => ({ id: area.name, label: area.name })))
        setGenres(genreRows.map(genre => ({ id: genre.code, label: genre.name })))
      })
      .catch(error => {
        console.warn('filter options fetch failed', error)
      })
  }, [])

  return { locations, genres }
}
