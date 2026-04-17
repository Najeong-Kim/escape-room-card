import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitReport } from '../lib/reports'
import type { ReportType } from '../lib/reports'

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'incorrect_info', label: '정보가 틀렸습니다' },
  { value: 'closed_or_moved', label: '폐점/이전한 곳입니다' },
  { value: 'missing_theme', label: '없는 테마가 있습니다' },
  { value: 'bug', label: '화면 오류가 있습니다' },
  { value: 'other', label: '기타' },
]

interface Props {
  themeId?: number
  defaultTitle?: string
  onClose: () => void
}

export function ReportModal({ themeId, defaultTitle = '', onClose }: Props) {
  const [reportType, setReportType] = useState<ReportType>('incorrect_info')
  const [title, setTitle] = useState(defaultTitle)
  const [message, setMessage] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [reporterEmail, setReporterEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function send() {
    if (!title.trim() || !message.trim()) {
      setError('제목과 내용을 입력해 주세요.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await submitReport({
        themeId,
        reportType,
        title,
        message,
        reporterName,
        reporterEmail,
      })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '제보를 보내지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
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
          className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#16161f] border border-white/10 rounded-3xl p-6"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        >
          {sent ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-teal-300">제보 완료</p>
                <h2 className="text-white font-bold text-lg mt-1">제보가 접수되었습니다.</h2>
                <p className="text-sm text-gray-400 mt-2">확인 후 필요한 내용을 반영하겠습니다.</p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 rounded-2xl transition-colors"
              >
                닫기
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-teal-300">제보하기</p>
                  <h2 className="text-white font-bold text-lg mt-1">어떤 내용을 알려주실까요?</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-white text-xl leading-none"
                  aria-label="닫기"
                >
                  x
                </button>
              </div>

              <label className="block">
                <span className="text-xs text-gray-400">제보 유형</span>
                <select
                  value={reportType}
                  onChange={e => setReportType(e.target.value as ReportType)}
                  className="mt-1.5 w-full bg-[#0e0e16] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500/60"
                >
                  {REPORT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-gray-400">제목</span>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={80}
                  className="mt-1.5 w-full bg-[#0e0e16] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/60"
                  placeholder="어떤 문제가 있나요?"
                />
              </label>

              <label className="block">
                <span className="text-xs text-gray-400">내용</span>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={1000}
                  rows={5}
                  className="mt-1.5 w-full bg-[#0e0e16] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-teal-500/60"
                  placeholder="틀린 정보, 확인한 링크, 요청사항 등을 적어 주세요."
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-gray-400">이름 (선택)</span>
                  <input
                    value={reporterName}
                    onChange={e => setReporterName(e.target.value)}
                    maxLength={80}
                    className="mt-1.5 w-full bg-[#0e0e16] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/60"
                    placeholder="닉네임"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">이메일 (선택)</span>
                  <input
                    value={reporterEmail}
                    onChange={e => setReporterEmail(e.target.value)}
                    maxLength={120}
                    type="email"
                    className="mt-1.5 w-full bg-[#0e0e16] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/60"
                    placeholder="답변이 필요한 경우"
                  />
                </label>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                onClick={send}
                disabled={submitting}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-semibold py-3 rounded-2xl transition-colors"
              >
                {submitting ? '제보 전송 중...' : '제보 보내기'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
