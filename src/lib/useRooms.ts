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
  players: number | null
  fearMax: number | null
}

export interface FilterOption {
  id: string
  label: string
}

export const INITIAL_FILTERS: RoomFilters = {
  themeId: null,
  location: null,
  genre: null,
  players: null,
  fearMax: null,
}

export function filterRooms(rooms: Room[], filters: RoomFilters): Room[] {
  const theme = filters.themeId ? THEMES.find(t => t.id === filters.themeId) : null

  return rooms.filter(room => {
    if (theme && !theme.filter(room)) return false
    if (filters.location && room.location !== filters.location) return false
    if (filters.genre && !room.genres.includes(filters.genre)) return false
    if (filters.players !== null && room.max_players < filters.players) return false
    if (filters.fearMax !== null && room.fear_level > filters.fearMax) return false
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
        'difficulty_score',
        'fear_score',
        'activity_score',
        'interior_score',
        'story_score',
        'aging_score',
        'image_url',
        'booking_url',
        'theme_genres(genres(code))',
        'cafes!inner(name,branch_name,area_label,booking_url,website_url,areas(name))',
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
