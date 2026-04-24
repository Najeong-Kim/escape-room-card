import type { Room } from './recommend'
import { safeImageUrl } from './safeImageUrl'

interface ThemeCafe {
  name: string
  branch_name: string | null
  area_label: string
  address: string | null
  areas?: {
    name: string
  } | {
    name: string
  }[] | null
  booking_url: string | null
  website_url: string | null
  naver_place_id: string | null
  naver_place_url: string | null
}

export interface ThemeCatalogRow {
  id: number
  name: string
  genre_labels: string[]
  duration_minutes: number | null
  min_players: number | null
  max_players: number | null
  price_per_person: number | null
  difficulty_label: string | null
  difficulty_score: number | null
  fear_label: string | null
  fear_score: number | null
  activity_label: string | null
  activity_score: number | null
  story_label: string | null
  interior_score: number | null
  interior_label: string | null
  story_score: number | null
  aging_label: string | null
  aging_score: number | null
  image_url: string | null
  image_status: string | null
  booking_url: string | null
  theme_genres?: {
    genres: {
      code: string
    } | {
      code: string
    }[] | null
  }[]
  theme_taggings?: {
    status: string
    theme_tags: {
      code: string
      name: string
      category: string
      is_active: boolean
    } | {
      code: string
      name: string
      category: string
      is_active: boolean
    }[] | null
  }[]
  cafes: ThemeCafe | ThemeCafe[] | null
}

function score10To5(value: number | null, fallback: number) {
  if (value === null || value === undefined) return fallback
  return Math.max(0, Math.min(5, value / 2))
}

function firstCafe(cafes: ThemeCatalogRow['cafes']) {
  return Array.isArray(cafes) ? (cafes[0] ?? null) : cafes
}

function firstArea(area: ThemeCafe['areas']) {
  return Array.isArray(area) ? (area[0] ?? null) : area
}

function firstGenre(genre: NonNullable<ThemeCatalogRow['theme_genres']>[number]['genres']) {
  return Array.isArray(genre) ? (genre[0] ?? null) : genre
}

function firstTag(tag: NonNullable<ThemeCatalogRow['theme_taggings']>[number]['theme_tags']) {
  return Array.isArray(tag) ? (tag[0] ?? null) : tag
}

export function themeToRoom(theme: ThemeCatalogRow): Room {
  const cafe = firstCafe(theme.cafes)
  const genres = theme.theme_genres
    ?.map(themeGenre => firstGenre(themeGenre.genres)?.code)
    .filter((code): code is string => Boolean(code))
  const area = cafe ? firstArea(cafe.areas)?.name : null
  const themeTags = theme.theme_taggings
    ?.filter(tagging => tagging.status === 'active')
    .map(tagging => firstTag(tagging.theme_tags))
    .filter((tag): tag is NonNullable<ReturnType<typeof firstTag>> => Boolean(tag?.is_active))
    .map(tag => ({
      code: tag.code,
      name: tag.name,
      category: tag.category,
    }))
  const brand = cafe
    ? `${cafe.name}${cafe.branch_name ? ` ${cafe.branch_name}` : ''}`
    : '방탈출 카페'

  return {
    id: theme.id,
    name: theme.name,
    brand,
    location: area ?? cafe?.area_label ?? '기타',
    address: cafe?.address ?? undefined,
    genres: genres ?? [],
    fear_level: score10To5(theme.fear_score, 1),
    puzzle_weight: 1,
    difficulty: score10To5(theme.difficulty_score, 1),
    activity_level: score10To5(theme.activity_score, 1),
    interior_score: score10To5(theme.interior_score, 0),
    hint_count: 0,
    duration_minutes: theme.duration_minutes ?? 60,
    price_per_person: theme.price_per_person ?? 0,
    min_players: theme.min_players ?? 1,
    max_players: theme.max_players ?? 1,
    rating_avg: 0,
    tags: [],
    theme_tags: themeTags ?? [],
    official_scores: {
      difficulty: theme.difficulty_score,
      fear: theme.fear_score,
      activity: theme.activity_score,
      story: theme.story_score,
      interior: theme.interior_score,
      aging: theme.aging_score,
    },
    official_labels: {
      difficulty: theme.difficulty_label,
      fear: theme.fear_label,
      activity: theme.activity_label,
      story: theme.story_label,
      interior: theme.interior_label,
      aging: theme.aging_label,
    },
    website_url: theme.booking_url ?? cafe?.booking_url ?? cafe?.website_url ?? undefined,
    image_url: theme.image_status === 'rejected' ? undefined : safeImageUrl(theme.image_url),
    naver_place_id: cafe?.naver_place_id ?? undefined,
    naver_place_url: cafe?.naver_place_url ?? undefined,
  }
}
