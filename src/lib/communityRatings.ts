import { supabase } from './supabaseClient'
import { getSessionId } from './session'
import type { PathRating } from './ratings'

export interface CommunityRating {
  score10: number   // 0.0 ~ 10.0, 소수 1자리
  count: number     // 참여 인원
}

/** 전체 방의 커뮤니티 평점 맵 { [room_id]: CommunityRating } */
export async function fetchAllCommunityRatings(): Promise<Record<number, CommunityRating>> {
  const { data, error } = await supabase
    .from('room_rating_stats')
    .select('room_id, score_10, rating_count')

  if (error) {
    console.warn('community ratings fetch failed', error.message)
    return {}
  }

  return Object.fromEntries(
    (data ?? []).map(r => [
      r.room_id as number,
      { score10: Number(r.score_10), count: r.rating_count as number },
    ])
  )
}

/**
 * 익명 유저 평가 제출 (동일 session+room 이면 upsert).
 * rating이 null이면 아무것도 하지 않음.
 */
export async function submitCommunityRating(
  roomId: number,
  rating: PathRating | null,
): Promise<void> {
  if (rating === null) return
  const sessionId = getSessionId()
  const { error } = await supabase
    .from('room_ratings')
    .upsert(
      { room_id: roomId, rating, session_id: sessionId },
      { onConflict: 'room_id,session_id' },
    )
  if (error) console.warn('submitCommunityRating failed', error.message)
}
