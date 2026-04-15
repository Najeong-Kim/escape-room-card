import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getLogs, deleteLog } from '../../lib/roomLog'
import type { RoomLog } from '../../lib/roomLog'
import { getRatingDef, RatingIcon } from '../../lib/ratings'
import { Footer } from '../Footer'
import { AppThemeToggle } from '../AppThemeToggle'
import { EditLogModal } from './EditLogModal'

function RatingDisplay({ rating }: { rating: RoomLog['rating'] }) {
  if (rating === null || rating === undefined) {
    return <span className="text-gray-600 text-xs">평가 없음</span>
  }
  const def = getRatingDef(rating)
  if (!def) return null
  return (
    <span className="inline-flex items-center gap-1">
      <RatingIcon value={def.value} size={18} />
      <span className="text-xs font-medium" style={{ color: def.color }}>{def.label}</span>
    </span>
  )
}

export default function MyRooms() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<RoomLog[]>(() => getLogs())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingLog, setEditingLog] = useState<RoomLog | null>(null)

  const handleDelete = useCallback((id: string) => {
    deleteLog(id)
    setLogs(getLogs())
    setDeletingId(null)
  }, [])

  const total = logs.length
  const cleared = logs.filter(l => l.cleared).length

  return (
    <div className="min-h-dvh bg-[#0a0a0f] text-white">
      <AppThemeToggle />
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          ←
        </button>
        <h1 className="font-semibold text-base">내 방탈출 기록</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Stats */}
        {total > 0 && (
          <div className="flex gap-3">
            <div className="flex-1 bg-[#13131a] border border-white/8 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-violet-400">{total}</p>
              <p className="text-xs text-gray-500 mt-1">총 플레이</p>
            </div>
            <div className="flex-1 bg-[#13131a] border border-white/8 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{cleared}</p>
              <p className="text-xs text-gray-500 mt-1">탈출 성공</p>
            </div>
            <div className="flex-1 bg-[#13131a] border border-white/8 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-red-400">{total - cleared}</p>
              <p className="text-xs text-gray-500 mt-1">탈출 실패</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {total === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <span className="text-6xl">🔐</span>
            <p className="text-gray-400">아직 기록된 방이 없어요</p>
            <button
              onClick={() => navigate('/rooms')}
              className="text-sm text-violet-400 border border-violet-500/40 px-4 py-2 rounded-xl hover:bg-violet-900/20 transition-all"
            >
              방 둘러보기 →
            </button>
          </div>
        )}

        {/* Log list */}
        <AnimatePresence initial={false}>
          {logs.map(log => (
            <motion.div
              key={log.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#13131a] border border-white/8 rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{log.brand}</p>
                  <h3 className="text-white font-semibold text-base leading-snug">{log.room_name}</h3>
                </div>
                <span className={[
                  'flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full',
                  log.cleared
                    ? 'bg-green-900/40 text-green-400'
                    : 'bg-red-900/40 text-red-400',
                ].join(' ')}>
                  {log.cleared ? '탈출 성공' : '탈출 실패'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">{log.played_at}</span>
                <RatingDisplay rating={log.rating} />
              </div>

              {log.memo && (
                <p className="text-gray-400 text-sm bg-[#0e0e16] rounded-xl px-4 py-3 leading-relaxed">
                  {log.memo}
                </p>
              )}

              <div className="flex justify-end gap-3">
                {deletingId === log.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-900/20 transition-colors"
                    >
                      삭제 확인
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingLog(log)}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => setDeletingId(log.id)}
                      className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <Footer />

      {editingLog && (
        <EditLogModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSaved={() => {
            setLogs(getLogs())
            setEditingLog(null)
          }}
        />
      )}
    </div>
  )
}
