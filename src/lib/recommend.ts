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
  address?: string
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
  theme_tags?: ThemeTag[]
  official_scores?: {
    difficulty?: number | null
    fear?: number | null
    activity?: number | null
    story?: number | null
    interior?: number | null
    aging?: number | null
  }
  official_labels?: {
    difficulty?: string | null
    fear?: string | null
    activity?: string | null
    story?: string | null
    interior?: string | null
    aging?: string | null
  }
  website_url?: string
  image_url?: string
  naver_place_id?: string
  naver_place_url?: string
}

export interface ThemeTag {
  code: string
  name: string
  category: string
}

export interface RecommendedRoom {
  room: Room
  reasons: string[]
}

// Map profile fearLevel to numeric fear score (1-5 scale)
const FEAR_SCORE: Record<string, number> = {
  brave: 5,
  calm: 3,
  cautious: 1,
}

const GENRE_LABEL: Record<string, string> = {
  Horror: '공포',
  MysteryThriller: '미스터리/스릴러',
  FantasyAdventure: '판타지/모험',
  Emotional: '감성/드라마',
  Comic: '코믹',
  Crime: '범죄/잠입',
  SF: 'SF',
}


function matches(room: Room, profile: QuizProfile, fearTolerance: number): boolean {
  const profileFear = FEAR_SCORE[profile.fearLevel] ?? 3
  const fearOk = Math.abs(room.fear_level - profileFear) <= fearTolerance
  const genreOk = profile.genres.length === 0 || room.genres.some(g => profile.genres.includes(g))
  return fearOk && genreOk
}

function explainRecommendation(room: Room, profile: QuizProfile): string[] {
  const reasons: string[] = []
  const profileFear = FEAR_SCORE[profile.fearLevel] ?? 3
  const fearDistance = Math.abs(room.fear_level - profileFear)
  const matchedGenres = room.genres.filter(genre => profile.genres.includes(genre))

  if (matchedGenres.length > 0) {
    const [firstGenre] = matchedGenres
    reasons.push(`선호한 ${GENRE_LABEL[firstGenre] ?? firstGenre} 장르와 잘 맞아요`)
  }

  if (fearDistance === 0) {
    reasons.push('공포도 취향이 거의 딱 맞아요')
  } else if (fearDistance === 1) {
    reasons.push('부담 없는 공포도로 즐기기 좋아요')
  }

  if (profile.puzzleStyle === 'puzzle' && room.difficulty >= 3.5) {
    reasons.push('퍼즐 푸는 재미를 기대할 수 있어요')
  } else if (profile.puzzleStyle === 'device' && room.activity_level >= 3) {
    reasons.push('장치와 체험 요소를 즐기기 좋아요')
  } else if (profile.puzzleStyle === 'balanced') {
    reasons.push('퍼즐과 체험 밸런스가 무난해 보여요')
  }

  if (room.interior_score >= 4.2) {
    reasons.push('공식 기준 인테리어 평가가 좋은 편이에요')
  }

  if (room.max_players >= 4 && profile.playStyle.includes('Cooperative')) {
    reasons.push('함께 협업하면서 플레이하기 좋아요')
  }

  if (room.duration_minutes >= 70) {
    reasons.push('볼륨감 있는 플레이를 기대할 수 있어요')
  }

  return reasons.filter((reason, index, all) => all.indexOf(reason) === index).slice(0, 2)
}

export async function getRecommendations(profile: QuizProfile, count = 3): Promise<RecommendedRoom[]> {
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
    .map(room => ({
      room,
      reasons: explainRecommendation(room, profile),
    }))
}
