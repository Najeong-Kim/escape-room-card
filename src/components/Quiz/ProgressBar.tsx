import { useTranslation } from 'react-i18next'

interface Props {
  fraction: number  // 0–1
  step: number      // 1-based display
  total: number
}

export function ProgressBar({ fraction, step, total }: Props) {
  const { t } = useTranslation()
  return (
    <div className="w-full px-6 pt-6 pb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium tracking-wider uppercase">
          {t('step', { current: step, total })}
        </span>
      </div>
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full transition-all duration-400 ease-out"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  )
}
