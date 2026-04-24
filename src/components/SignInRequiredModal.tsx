import { AnimatePresence, motion } from 'framer-motion'
import { useAppAuth } from '../lib/auth'

export function SignInRequiredModal({
  open,
  title = '로그인 후 기록할 수 있어요',
  description = '방 기록은 계정에 저장돼서 기기 바뀌어도 다시 볼 수 있어요. 로그인하고 내 기록을 차곡차곡 쌓아보세요.',
  onClose,
}: {
  open: boolean
  title?: string
  description?: string
  onClose: () => void
}) {
  const auth = useAppAuth()

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={event => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <motion.div
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#16161f] p-6 shadow-2xl"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-300/80">Members Only</p>
              <h2 className="mt-2 text-xl font-bold text-white">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xl leading-none text-gray-500 transition-colors hover:text-white"
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-gray-400">{description}</p>

          <div className="mt-5 rounded-2xl border border-teal-500/20 bg-teal-500/8 px-4 py-3">
            <p className="text-sm font-semibold text-white">로그인하면 가능한 것</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-300">
              플레이 기록 저장, 내 평가 비교, 취향 추천 고도화, 기기 바뀌어도 기록 유지
            </p>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/8"
            >
              나중에
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                auth.openSignIn()
              }}
              className="flex-1 rounded-xl bg-teal-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-teal-400"
            >
              로그인하기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
