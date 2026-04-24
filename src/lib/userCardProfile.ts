import { supabase } from './supabaseClient'
import { loadSavedCard, saveCard } from './savedCard'
import type { QuizProfile } from './traitMap'
import { getCurrentUserId } from './auth'

export interface SimilarProfileFavoriteTheme {
  theme_id: number
  name: string
  brand: string
  location: string
  image_url: string | null
  genre_labels: string[]
  liked_count: number
  score_10: number
}

interface UserCardProfileRow {
  profile: QuizProfile
  updated_at?: string
}

async function currentUserId() {
  return getCurrentUserId()
}

function profilePayload(profile: QuizProfile, userId: string) {
  return {
    user_id: userId,
    nickname: profile.nickname,
    fear_level: profile.fearLevel,
    puzzle_style: profile.puzzleStyle,
    character_id: profile.characterId,
    tagline: profile.tagline,
    play_count: profile.playCount,
    genres: profile.genres,
    play_style: profile.playStyle,
    profile,
  }
}

export async function saveUserCardProfile(profile: QuizProfile): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return

  const { error } = await supabase
    .from('user_card_profiles')
    .upsert(profilePayload(profile, userId), { onConflict: 'user_id' })

  if (error) console.warn('saveUserCardProfile failed', error.message)
}

export async function fetchUserCardProfile(): Promise<QuizProfile | null> {
  const userId = await currentUserId()
  if (!userId) return null

  const { data, error } = await supabase
    .from('user_card_profiles')
    .select('profile,updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('fetchUserCardProfile failed', error.message)
    return null
  }

  return ((data as UserCardProfileRow | null)?.profile ?? null) as QuizProfile | null
}

export async function syncSavedCardProfileToUser(): Promise<QuizProfile | null> {
  const localProfile = loadSavedCard()
  if (localProfile) {
    await saveUserCardProfile(localProfile)
    return localProfile
  }

  const remoteProfile = await fetchUserCardProfile()
  if (remoteProfile) {
    saveCard(remoteProfile)
  }
  return remoteProfile
}

export async function fetchSimilarProfileFavoriteThemes(
  profile: QuizProfile,
  limit = 3,
  minLikedCount = 2,
): Promise<SimilarProfileFavoriteTheme[]> {
  const { data, error } = await supabase.rpc('get_similar_profile_favorite_themes', {
    p_character_id: profile.characterId,
    p_limit: limit,
    p_min_liked_count: minLikedCount,
  })

  if (error) {
    console.warn('fetchSimilarProfileFavoriteThemes failed', error.message)
    return []
  }

  return ((data ?? []) as unknown as SimilarProfileFavoriteTheme[]).map(theme => ({
    ...theme,
    score_10: Number(theme.score_10),
  }))
}
