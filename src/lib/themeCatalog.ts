import type { Room } from './recommend'

interface ThemeCafe {
  name: string
  branch_name: string | null
  area_label: string
  booking_url: string | null
  website_url: string | null
}

export interface ThemeCatalogRow {
  id: number
  name: string
  genre_labels: string[]
  duration_minutes: number | null
  min_players: number | null
  max_players: number | null
  price_per_person: number | null
  image_url: string | null
  booking_url: string | null
  cafes: ThemeCafe | ThemeCafe[] | null
}

const GENRE_BY_LABEL: Record<string, string> = {
  공포: 'Horror',
  '미스터리/스릴러': 'MysteryThriller',
  감성: 'Emotional',
  코믹: 'Comic',
  '판타지/어드벤처': 'FantasyAdventure',
}

function firstCafe(cafes: ThemeCatalogRow['cafes']) {
  return Array.isArray(cafes) ? (cafes[0] ?? null) : cafes
}

export function themeToRoom(theme: ThemeCatalogRow): Room {
  const cafe = firstCafe(theme.cafes)
  const brand = cafe
    ? `${cafe.name}${cafe.branch_name ? ` ${cafe.branch_name}` : ''}`
    : '방탈출 카페'

  return {
    id: theme.id,
    name: theme.name,
    brand,
    location: cafe?.area_label ?? '강남',
    genres: theme.genre_labels.map(label => GENRE_BY_LABEL[label] ?? label),
    fear_level: 1,
    puzzle_weight: 1,
    difficulty: 1,
    activity_level: 1,
    interior_score: 0,
    hint_count: 0,
    duration_minutes: theme.duration_minutes ?? 60,
    price_per_person: theme.price_per_person ?? 0,
    min_players: theme.min_players ?? 1,
    max_players: theme.max_players ?? 1,
    rating_avg: 0,
    tags: [],
    website_url: theme.booking_url ?? cafe?.booking_url ?? cafe?.website_url ?? undefined,
    image_url: theme.image_url ?? undefined,
  }
}
