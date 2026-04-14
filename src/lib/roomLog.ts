export interface RoomLog {
  id: string
  room_id: number
  room_name: string
  brand: string
  played_at: string   // YYYY-MM-DD
  cleared: boolean
  rating: 1 | 2 | 3 | 4 | 5 | null
  memo: string
}

const KEY = 'escape-room-logs'

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
  localStorage.setItem(KEY, JSON.stringify([newLog, ...logs]))
  return newLog
}

export function updateLog(id: string, patch: Partial<Omit<RoomLog, 'id'>>): void {
  const logs = getLogs().map(l => l.id === id ? { ...l, ...patch } : l)
  localStorage.setItem(KEY, JSON.stringify(logs))
}

export function deleteLog(id: string): void {
  const logs = getLogs().filter(l => l.id !== id)
  localStorage.setItem(KEY, JSON.stringify(logs))
}

export function hasLog(room_id: number): boolean {
  return getLogs().some(l => l.room_id === room_id)
}
