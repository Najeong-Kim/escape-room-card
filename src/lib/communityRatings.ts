import { supabase } from './supabaseClient'
import { getSessionId } from './session'
import type { PathRating } from './ratings'

export interface CommunityRating {
  score10: number   // 0.0 ~ 10.0, 소수 1자리
  count: number     // 참여 인원
}

export type MetricKey = 'difficulty' | 'fear' | 'activity' | 'story' | 'interior' | 'aging'

export type MetricScores = Partial<Record<MetricKey, number | null>>

export type CommunityMetricStats = Partial<Record<MetricKey, CommunityRating>>

type MetricStatsRow = {
  room_id: number
  difficulty_score: number | null
  difficulty_count: number
  fear_score: number | null
  fear_count: number
  activity_score: number | null
  activity_count: number
  story_score: number | null
  story_count: number
  interior_score: number | null
  interior_count: number
  aging_score: number | null
  aging_count: number
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

export async function fetchAllCommunityMetricStats(): Promise<Record<number, CommunityMetricStats>> {
  const { data, error } = await supabase
    .from('room_metric_rating_stats')
    .select([
      'room_id',
      'difficulty_score',
      'difficulty_count',
      'fear_score',
      'fear_count',
      'activity_score',
      'activity_count',
      'story_score',
      'story_count',
      'interior_score',
      'interior_count',
      'aging_score',
      'aging_count',
    ].join(','))

  if (error) {
    console.warn('community metric stats fetch failed', error.message)
    return {}
  }

  return Object.fromEntries(
    ((data ?? []) as unknown as MetricStatsRow[]).map(row => {
      const stats: CommunityMetricStats = {}
      for (const key of ['difficulty', 'fear', 'activity', 'story', 'interior', 'aging'] as const) {
        const score = row[`${key}_score`]
        const count = row[`${key}_count`] as number
        if (score !== null && score !== undefined && count > 0) {
          stats[key] = { score10: Number(score), count }
        }
      }
      return [row.room_id as number, stats]
    })
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

export interface CommunityEscapeStats {
  totalCount: number
  clearedCount: number
  clearRate: number          // 0–100 정수
  avgHintsCleared: number | null
  avgRemainingMinutes: number | null
}

type EscapeSummaryRow = {
  room_id: number
  total_count: number
  cleared_count: number
  clear_rate: number
  avg_hints_cleared: number | null
  avg_remaining_minutes_cleared: number | null
}

export async function fetchAllCommunityEscapeStats(): Promise<Record<number, CommunityEscapeStats>> {
  const { data, error } = await supabase
    .from('room_escape_summary')
    .select('room_id,total_count,cleared_count,clear_rate,avg_hints_cleared,avg_remaining_minutes_cleared')

  if (error) {
    console.warn('community escape stats fetch failed', error.message)
    return {}
  }

  return Object.fromEntries(
    ((data ?? []) as unknown as EscapeSummaryRow[]).map(row => [
      row.room_id,
      {
        totalCount: row.total_count,
        clearedCount: row.cleared_count,
        clearRate: row.clear_rate,
        avgHintsCleared: row.avg_hints_cleared !== null ? Number(row.avg_hints_cleared) : null,
        avgRemainingMinutes: row.avg_remaining_minutes_cleared !== null ? Number(row.avg_remaining_minutes_cleared) : null,
      },
    ])
  )
}

export async function submitCommunityEscapeStats(
  roomId: number,
  cleared: boolean,
  hintsUsed: number | null,
  remainingMinutes: number | null,
  remainingSeconds: number | null = null,
): Promise<void> {
  const sessionId = getSessionId()
  const { error } = await supabase
    .from('room_escape_stats')
    .upsert(
      { room_id: roomId, session_id: sessionId, cleared, hints_used: hintsUsed, remaining_minutes: remainingMinutes, remaining_seconds: remainingSeconds },
      { onConflict: 'room_id,session_id' },
    )
  if (error) console.warn('submitCommunityEscapeStats failed', error.message)
}

export async function submitCommunityMetricRatings(
  roomId: number,
  scores: MetricScores,
): Promise<void> {
  const payload = Object.fromEntries(
    Object.entries(scores).filter(([, score]) => score !== null && score !== undefined)
  )
  if (Object.keys(payload).length === 0) return

  const sessionId = getSessionId()
  const { error } = await supabase
    .from('room_metric_ratings')
    .upsert(
      {
        room_id: roomId,
        session_id: sessionId,
        difficulty_score: payload.difficulty,
        fear_score: payload.fear,
        activity_score: payload.activity,
        story_score: payload.story,
        interior_score: payload.interior,
        aging_score: payload.aging,
      },
      { onConflict: 'room_id,session_id' },
    )
  if (error) console.warn('submitCommunityMetricRatings failed', error.message)
}
