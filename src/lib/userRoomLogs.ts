import { supabase } from './supabaseClient'
import { getLogs, replaceLogs } from './roomLog'
import type { RoomLog } from './roomLog'
import { getCurrentUserId } from './auth'

interface UserRoomLogRow {
  local_id: string
  room_id: number
  room_name: string
  brand: string
  played_at: string
  cleared: boolean
  hints_used: number | null
  remaining_minutes: number | null
  remaining_seconds: number | null
  rating: RoomLog['rating']
  difficulty_score: number | null
  fear_score: number | null
  activity_score: number | null
  story_score: number | null
  interior_score: number | null
  aging_score: number | null
  memo: string
  updated_at?: string
}

function rowToLog(row: UserRoomLogRow): RoomLog {
  return {
    id: row.local_id,
    room_id: row.room_id,
    room_name: row.room_name,
    brand: row.brand,
    played_at: row.played_at,
    cleared: row.cleared,
    hints_used: row.hints_used,
    remaining_minutes: row.remaining_minutes,
    remaining_seconds: row.remaining_seconds,
    rating: row.rating,
    difficulty_score: row.difficulty_score,
    fear_score: row.fear_score,
    activity_score: row.activity_score,
    story_score: row.story_score,
    interior_score: row.interior_score,
    aging_score: row.aging_score,
    memo: row.memo,
  }
}

function logToPayload(log: RoomLog, userId: string) {
  return {
    user_id: userId,
    local_id: log.id,
    room_id: log.room_id,
    room_name: log.room_name,
    brand: log.brand,
    played_at: log.played_at,
    cleared: log.cleared,
    hints_used: log.hints_used ?? null,
    remaining_minutes: log.remaining_minutes ?? null,
    remaining_seconds: log.remaining_seconds ?? null,
    rating: log.rating,
    difficulty_score: log.difficulty_score ?? null,
    fear_score: log.fear_score ?? null,
    activity_score: log.activity_score ?? null,
    story_score: log.story_score ?? null,
    interior_score: log.interior_score ?? null,
    aging_score: log.aging_score ?? null,
    memo: log.memo,
  }
}

function sortLogs(logs: RoomLog[]) {
  return [...logs].sort((a, b) => {
    if (a.played_at !== b.played_at) return b.played_at.localeCompare(a.played_at)
    return b.id.localeCompare(a.id)
  })
}

async function currentUserId() {
  return getCurrentUserId()
}

export async function fetchUserRoomLogs(): Promise<RoomLog[]> {
  const userId = await currentUserId()
  if (!userId) return []

  const { data, error } = await supabase
    .from('user_room_logs')
    .select([
      'local_id',
      'room_id',
      'room_name',
      'brand',
      'played_at',
      'cleared',
      'hints_used',
      'remaining_minutes',
      'remaining_seconds',
      'rating',
      'difficulty_score',
      'fear_score',
      'activity_score',
      'story_score',
      'interior_score',
      'aging_score',
      'memo',
      'updated_at',
    ].join(','))
    .order('played_at', { ascending: false })

  if (error) {
    console.warn('fetchUserRoomLogs failed', error.message)
    return []
  }

  return ((data ?? []) as unknown as UserRoomLogRow[]).map(rowToLog)
}

export async function saveUserRoomLog(log: RoomLog): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return

  const { error } = await supabase
    .from('user_room_logs')
    .upsert(logToPayload(log, userId), { onConflict: 'user_id,local_id' })

  if (error) console.warn('saveUserRoomLog failed', error.message)
}

export async function deleteUserRoomLog(localId: string): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return

  const { error } = await supabase
    .from('user_room_logs')
    .delete()
    .eq('user_id', userId)
    .eq('local_id', localId)

  if (error) console.warn('deleteUserRoomLog failed', error.message)
}

export async function syncLocalRoomLogsToUser(): Promise<RoomLog[]> {
  const userId = await currentUserId()
  if (!userId) return getLogs()

  const localLogs = getLogs()
  const remoteLogs = await fetchUserRoomLogs()
  const mergedById = new Map<string, RoomLog>()

  for (const log of remoteLogs) mergedById.set(log.id, log)
  for (const log of localLogs) mergedById.set(log.id, log)

  const merged = sortLogs([...mergedById.values()])

  if (merged.length > 0) {
    const { error } = await supabase
      .from('user_room_logs')
      .upsert(merged.map(log => logToPayload(log, userId)), { onConflict: 'user_id,local_id' })

    if (error) console.warn('syncLocalRoomLogsToUser failed', error.message)
  }

  replaceLogs(merged)
  return merged
}
