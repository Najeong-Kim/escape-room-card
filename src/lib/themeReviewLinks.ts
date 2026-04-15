import { supabase } from './supabaseClient'

export type ReviewSourceType = 'blog' | 'youtube' | 'instagram' | 'other'

export interface ThemeReviewLink {
  id: number
  theme_id: number
  source_type: ReviewSourceType
  title: string
  url: string
  author: string | null
  published_at: string | null
  thumbnail_url: string | null
  confidence_score?: number | null
  match_reason?: string[] | null
  collected_by?: string | null
}

export const REVIEW_SOURCE_LABEL: Record<ReviewSourceType, string> = {
  blog: '블로그',
  youtube: '유튜브',
  instagram: '인스타',
  other: '기타',
}

export async function fetchThemeReviewLinks(themeId: number): Promise<ThemeReviewLink[]> {
  const { data, error } = await supabase
    .from('theme_review_links')
    .select('id,theme_id,source_type,title,url,author,published_at,thumbnail_url')
    .eq('theme_id', themeId)
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false })

  if (error) {
    console.warn('theme review links fetch failed', error.message)
    return []
  }

  return (data ?? []) as unknown as ThemeReviewLink[]
}
