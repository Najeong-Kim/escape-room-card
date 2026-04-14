import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addLog } from '../../lib/roomLog'
import type { Room } from '../../lib/recommend'
import { PATH_RATINGS, RatingIcon } from '../../lib/ratings'
import type { PathRating } from '../../lib/ratings'
import { submitCommunityRating } from '../../lib/communityRatings'

interface Props {
  room: Room
  onClose: () => void
  onSaved: () => void
}

export function LogModal({ room, onClose, onSaved }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [playedAt, setPlayedAt] = useState(today)
  const [cleared, setCleared] = useState(true)
  const [rating, setRating] = useState<PathRating | null>(null)
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    addLog({
      room_id: room.id,
      room_name: room.name,
      brand: room.brand,
      played_at: playedAt,
      cleared,
      rating,
      memo: memo.trim(),
    })
    await submitCommunityRating(room.id, rating)
    setSaving(false)
    onSaved()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="w-full max-w-md bg-[#16161f] border border-white/10 rounded-3xl p-6 flex flex-col gap-5"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500">{room.brand}</p>
              <h2 className="text-white font-bold text-lg leading-snug">{room.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white text-xl leading-none mt-0.5"
            >
              ✕
            </button>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">언제 했어?</label>
            <input
              type="date"
              value={playedAt}
              max={today}
              onChange={e => setPlayedAt(e.target.value)}
              className="bg-[#0e0e16] border border-white/10 rounded-xl px-4 py-2.5
                         text-white text-sm focus:outline-none focus:border-violet-500/60
                         [color-scheme:dark]"
            />
          </div>

          {/* Cleared */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">클리어 했어?</label>
            <div className="flex gap-3">
              {[
                { value: true,  label: '✅ 탈출 성공' },
                { value: false, label: '💀 탈출 실패' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setCleared(opt.value)}
                  className={[
                    'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    cleared === opt.value
                      ? 'bg-violet-900/50 border-violet-500 text-white'
                      : 'bg-[#0e0e16] border-white/10 text-gray-400 hover:border-gray-600',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">길 평가 (선택)</label>
            <div className="grid grid-cols-3 gap-2">
              {PATH_RATINGS.map(r => {
                const isSelected = rating === r.value
                return (
                  <button
                    key={r.value}
                    onClick={() => setRating(rating === r.value ? null : r.value)}
                    className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-all"
                    style={isSelected
                      ? { backgroundColor: r.bg, borderColor: r.border, boxShadow: `0 0 8px ${r.border}40` }
                      : { backgroundColor: '#0e0e16', borderColor: 'rgba(255,255,255,0.08)' }
                    }
                  >
                    <RatingIcon value={r.value} size={28} />
                    <span
                      className="text-xs font-medium leading-none"
                      style={{ color: isSelected ? r.color : '#6b7280' }}
                    >
                      {r.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Memo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">한마디 (선택)</label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="기억에 남는 것, 같이 간 사람, 힌트 몇 번..."
              maxLength={200}
              rows={3}
              className="bg-[#0e0e16] border border-white/10 rounded-xl px-4 py-3
                         text-white text-sm placeholder-gray-600 resize-none
                         focus:outline-none focus:border-violet-500/60"
            />
          </div>

          {/* Save */}
          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold
                       py-3 rounded-2xl transition-all active:scale-95"
          >
            {saving ? '저장 중…' : '기록 저장'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
