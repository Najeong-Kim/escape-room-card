export interface RoomLog {
  id: string
  room_id: number
  room_name: string
  brand: string
  played_at: string   // YYYY-MM-DD
  cleared: boolean
  hints_used?: number | null
  remaining_minutes?: number | null
  remaining_seconds?: number | null
  rating: 0 | 1 | 2 | 3 | 4 | 5 | null
  difficulty_score?: number | null
  fear_score?: number | null
  activity_score?: number | null
  story_score?: number | null
  interior_score?: number | null
  aging_score?: number | null
  memo: string
}

const KEY = 'escape-room-logs'
export const ROOM_LOGS_CHANGED = 'escape-room-logs-changed'

function notifyLogsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ROOM_LOGS_CHANGED))
  }
}

function persistLogs(logs: RoomLog[]) {
  localStorage.setItem(KEY, JSON.stringify(logs))
  notifyLogsChanged()
}

export function getLogs(): RoomLog[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function addLog(log: Omit<RoomLog, 'id'>): RoomLog {
  const newLog: RoomLog = { ...log, id: crypto.randomUUID() }
  const logs = getLogs()
  persistLogs([newLog, ...logs])
  return newLog
}

export function updateLog(id: string, patch: Partial<Omit<RoomLog, 'id'>>): RoomLog | null {
  let updated: RoomLog | null = null
  const logs = getLogs().map(l => l.id === id ? { ...l, ...patch } : l)
  updated = logs.find(l => l.id === id) ?? null
  persistLogs(logs)
  return updated
}

export function deleteLog(id: string): void {
  const logs = getLogs().filter(l => l.id !== id)
  persistLogs(logs)
}

export function replaceLogs(logs: RoomLog[]): void {
  persistLogs(logs)
}

export function hasLog(room_id: number): boolean {
  return getLogs().some(l => l.room_id === room_id)
}
