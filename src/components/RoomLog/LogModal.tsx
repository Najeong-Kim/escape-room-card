import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addLog } from '../../lib/roomLog'
import type { Room } from '../../lib/recommend'
import { PATH_RATINGS, RatingIcon } from '../../lib/ratings'
import type { PathRating } from '../../lib/ratings'
import { submitCommunityMetricRatings, submitCommunityRating } from '../../lib/communityRatings'
import type { MetricKey, MetricScores } from '../../lib/communityRatings'

const METRICS: { key: MetricKey; label: string; low: string; high: string }[] = [
  { key: 'difficulty', label: '난이도', low: '쉬움', high: '어려움' },
  { key: 'fear', label: '공포도', low: '안 무서움', high: '무서움' },
  { key: 'activity', label: '활동성', low: '적음', high: '많음' },
  { key: 'story', label: '스토리', low: '약함', high: '강함' },
  { key: 'interior', label: '인테리어', low: '아쉬움', high: '좋음' },
  { key: 'aging', label: '노후화', low: '새로움', high: '낡음' },
]

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
  const [metricScores, setMetricScores] = useState<MetricScores>({})
  const [saving, setSaving] = useState(false)
  const [ratingTouched, setRatingTouched] = useState(false)
  const ratingSectionRef = useRef<HTMLDivElement>(null)

  async function save() {
    if (rating === null) {
      setRatingTouched(true)
      ratingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSaving(true)
    addLog({
      room_id: room.id,
      room_name: room.name,
      brand: room.brand,
      played_at: playedAt,
      cleared,
      rating,
      difficulty_score: metricScores.difficulty ?? null,
      fear_score: metricScores.fear ?? null,
      activity_score: metricScores.activity ?? null,
      story_score: metricScores.story ?? null,
      interior_score: metricScores.interior ?? null,
      aging_score: metricScores.aging ?? null,
      memo: memo.trim(),
    })
    await Promise.all([
      submitCommunityRating(room.id, rating),
      submitCommunityMetricRatings(room.id, metricScores),
    ])
    setSaving(false)
    onSaved()
  }

  function updateMetric(key: MetricKey, value: string) {
    setMetricScores(current => ({
      ...current,
      [key]: value === '' ? null : Number(value),
    }))
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#16161f] border border-white/10 rounded-3xl p-6 flex flex-col gap-5"
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
            <label className="text-xs text-gray-400">언제 하셨나요?</label>
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
            <label className="text-xs text-gray-400">클리어하셨나요?</label>
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
          <div ref={ratingSectionRef} className="flex flex-col gap-2 scroll-mt-4">
            <label className="text-xs text-gray-400">길 평가 (필수)</label>
            <div className="grid grid-cols-3 gap-2">
              {PATH_RATINGS.map(r => {
                const isSelected = rating === r.value
                return (
                  <button
                    key={r.value}
                    onClick={() => {
                      setRating(rating === r.value ? null : r.value)
                      setRatingTouched(true)
                    }}
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
            {ratingTouched && rating === null && (
              <p className="text-xs text-red-400">길 평가를 선택해 주세요.</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-400">세부 평가 (선택)</label>
              <p className="text-xs text-gray-600 mt-1">선택한 항목은 유저 평균에 반영됩니다.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {METRICS.map(metric => {
                const value = metricScores[metric.key]
                const officialScore = room.official_scores?.[metric.key]
                const officialLabel = room.official_labels?.[metric.key]
                const officialText = officialScore !== null && officialScore !== undefined
                  ? `${officialScore}/10`
                  : officialLabel
                return (
                  <div key={metric.key} className="bg-[#0e0e16] border border-white/10 rounded-xl px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-200">{metric.label}</p>
                        {officialText && (
                          <p className="text-[11px] text-amber-300 mt-0.5">공식 {officialText}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => updateMetric(metric.key, '')}
                        className="text-xs text-gray-500 hover:text-gray-300"
                      >
                        미평가
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-[11px] text-gray-600 w-12">{metric.low}</span>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={1}
                        value={value ?? 5}
                        onChange={e => updateMetric(metric.key, e.target.value)}
                        className="min-w-0 flex-1 accent-violet-500"
                      />
                      <span className="text-[11px] text-gray-600 w-12 text-right">{metric.high}</span>
                      <span className="text-sm text-white tabular-nums w-10 text-right">
                        {value ?? '-'}
                      </span>
                    </div>
                  </div>
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
              placeholder="기억에 남는 점, 같이 간 사람, 힌트 횟수..."
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
