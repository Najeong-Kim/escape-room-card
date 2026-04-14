import type { QuizProfile } from './traitMap'
import { themeToRoom } from './themeCatalog'
import type { ThemeCatalogRow } from './themeCatalog'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export interface Room {
  id: number
  name: string
  brand: string
  location: string
  genres: string[]
  fear_level: number
  puzzle_weight: number
  difficulty: number
  activity_level: number
  interior_score: number
  hint_count: number
  duration_minutes: number
  price_per_person: number
  min_players: number
  max_players: number
  rating_avg: number
  tags: string[]
  website_url?: string
  image_url?: string
}

// Map profile fearLevel to numeric fear score (1-5 scale)
const FEAR_SCORE: Record<string, number> = {
  brave: 5,
  calm: 3,
  cautious: 1,
}


function matches(room: Room, profile: QuizProfile, fearTolerance: number): boolean {
  const profileFear = FEAR_SCORE[profile.fearLevel] ?? 3
  const fearOk = Math.abs(room.fear_level - profileFear) <= fearTolerance
  const genreOk = profile.genres.length === 0 || room.genres.some(g => profile.genres.includes(g))
  return fearOk && genreOk
}

export async function getRecommendations(profile: QuizProfile, count = 3): Promise<Room[]> {
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
  })

  const res = await fetch(`${SUPABASE_URL}/rest/v1/themes?${query.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
  if (!res.ok) throw new Error('Failed to fetch themes')
  const allRooms: Room[] = ((await res.json()) as ThemeCatalogRow[]).map(themeToRoom)

  // Try strict match first (±1 fear)
  let candidates = allRooms.filter(r => matches(r, profile, 1))

  // Relax fear tolerance if not enough results
  if (candidates.length < count) {
    candidates = allRooms.filter(r => matches(r, profile, 2))
  }

  // Relax further (any fear level) if still not enough
  if (candidates.length < count) {
    candidates = allRooms.filter(r =>
      profile.genres.length === 0 || r.genres.some(g => profile.genres.includes(g))
    )
  }

  // Sort by rating_avg descending, then take top N
  return candidates
    .sort((a, b) => b.rating_avg - a.rating_avg)
    .slice(0, count)
}
