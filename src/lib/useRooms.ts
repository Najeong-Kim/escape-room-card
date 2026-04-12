import { useState, useEffect } from 'react'
import type { Room } from './recommend'

const API_URL = import.meta.env.VITE_API_URL

export interface Theme {
  id: string
  label: string
  emoji: string
  filter: (room: Room) => boolean
}

export const THEMES: Theme[] = [
  { id: 'solo',    label: '혼방 가능',   emoji: '🧍', filter: r => r.min_players <= 2 },
  { id: 'large',   label: '6인+ 가능',   emoji: '👥', filter: r => r.max_players >= 6 },
  { id: 'fear-in', label: '공포 입문',   emoji: '😨', filter: r => r.fear_level <= 2 },
  { id: 'fear-ex', label: '공포 고수',   emoji: '💀', filter: r => r.fear_level >= 4 },
  { id: 'interior',label: '인테리어 맛집', emoji: '✨', filter: r => r.interior_score >= 4.5 },
  { id: 'date',    label: '데이트 코스', emoji: '💑', filter: r => r.interior_score >= 4.0 && r.genres.includes('Emotional') },
  { id: 'puzzle',  label: '추리 특화',   emoji: '🔍', filter: r => r.puzzle_weight >= 4 },
]

export interface RoomFilters {
  themeId: string | null
  location: string | null
  genre: string | null
  players: number | null   // group size — max_players must be >= this
  fearMax: number | null
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
    fetch(`${API_URL}/rooms?order=rating_avg.desc`)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json() })
      .then((data: Room[]) => { setRooms(data); setLoading(false) })
      .catch(e => { setError(e); setLoading(false) })
  }, [])

  return { rooms, loading, error }
}
