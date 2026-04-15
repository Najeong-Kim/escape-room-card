import { useCallback, useEffect, useState } from 'react'
import { getLogs, ROOM_LOGS_CHANGED } from './roomLog'
import type { RoomLog } from './roomLog'

export function useRoomLogs(): [RoomLog[], () => void] {
  const [logs, setLogs] = useState<RoomLog[]>(() => getLogs())

  const refresh = useCallback(() => {
    setLogs(getLogs())
  }, [])

  useEffect(() => {
    window.addEventListener(ROOM_LOGS_CHANGED, refresh)
    return () => window.removeEventListener(ROOM_LOGS_CHANGED, refresh)
  }, [refresh])

  return [logs, refresh]
}
