import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { deleteLog } from '../../lib/roomLog'
import type { RoomLog } from '../../lib/roomLog'
import { useRoomLogs } from '../../lib/useRoomLogs'
import { deleteUserRoomLog } from '../../lib/userRoomLogs'
import { getRatingDef, RatingIcon } from '../../lib/ratings'
import { Footer } from '../Footer'
import { GlobalNav } from '../GlobalNav'
import { EditLogModal } from './EditLogModal'
import { useAppAuth } from '../../lib/auth'

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
  const auth = useAppAuth()
  const [logs] = useRoomLogs()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingLog, setEditingLog] = useState<RoomLog | null>(null)

  const handleDelete = useCallback((id: string) => {
    deleteLog(id)
    deleteUserRoomLog(id)
    setDeletingId(null)
  }, [])

  const total = logs.length
  const cleared = logs.filter(l => l.cleared).length

  if (!auth.isSignedIn) {
    return (
      <div className="min-h-dvh bg-[#0a0a0f] text-white">
        <GlobalNav />
        <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
          <section className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-teal-300/80">My Logs</p>
              <h1 className="mt-1 text-2xl font-bold text-white">내 방탈출 기록</h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                기록은 로그인 후 내 계정에 저장돼요. 로그인하면 플레이 기록과 평가를 계속 이어서 볼 수 있어요.
              </p>
            </div>
          </section>

          <div className="rounded-3xl border border-white/8 bg-[#13131a] px-5 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-500/10 text-2xl">
              🔐
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">로그인하면 기록이 쌓여요</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              플레이한 테마를 기록하고, 내 평가와 유저 평균을 비교하고, 취향 추천까지 이어서 받아보세요.
            </p>
            <div className="mt-5 grid gap-2 text-left text-xs text-gray-300">
              <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">플레이 기록을 계정에 안전하게 저장</div>
              <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">내 평가와 유저 평균 비교</div>
              <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">기록이 쌓일수록 추천 정교화</div>
            </div>
            <button
              type="button"
              onClick={() => auth.openSignIn()}
              className="mt-5 w-full rounded-xl bg-teal-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-teal-400"
            >
              로그인하고 기록 시작하기
            </button>
            <button
              onClick={() => navigate('/rooms')}
              className="mt-3 text-sm text-gray-400 transition-colors hover:text-white"
            >
              먼저 방 둘러보기 →
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0f] text-white">
      <GlobalNav />
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
        <section className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-teal-300/80">My Logs</p>
            <h1 className="mt-1 text-2xl font-bold text-white">내 방탈출 기록</h1>
          </div>
          <button
            onClick={() => navigate('/rooms')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            방 둘러보기 →
          </button>
        </section>

        {/* Stats */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="flex-1 bg-[#13131a] border border-white/8 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-teal-400">{total}</p>
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
              className="text-sm text-teal-400 border border-teal-500/40 px-4 py-2 rounded-xl hover:bg-teal-900/20 transition-all"
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
                  'escape-result-badge flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full',
                  log.cleared
                    ? 'bg-green-900/40 text-green-400'
                    : 'bg-red-900/40 text-red-400',
                ].join(' ')}>
                  {log.cleared ? '탈출 성공' : '탈출 실패'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="text-gray-500">{log.played_at}</span>
                <RatingDisplay rating={log.rating} />
              </div>

              {log.memo && (
                <p className="text-gray-400 text-sm bg-[#0e0e16] rounded-xl px-4 py-3 leading-relaxed">
                  {log.memo}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
                {deletingId === log.id ? (
                  <div className="flex w-full flex-wrap justify-end gap-2">
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
                      className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
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
            setEditingLog(null)
          }}
        />
      )}
    </div>
  )
}
