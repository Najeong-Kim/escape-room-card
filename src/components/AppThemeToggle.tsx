import { useEffect, useState } from 'react'

type AppTheme = 'dark' | 'light'

const STORAGE_KEY = 'escape-room-app-theme'

function initialTheme(): AppTheme {
  if (typeof window === 'undefined') return 'dark'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  return saved === 'light' ? 'light' : 'dark'
}

function applyTheme(theme: AppTheme) {
  document.documentElement.dataset.appTheme = theme
}

export function AppThemeToggle({ className = '', floating = true }: { className?: string; floating?: boolean }) {
  const [theme, setTheme] = useState<AppTheme>(initialTheme)

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className={[
        'app-theme-toggle text-xs px-3 py-1.5 rounded-full',
        floating ? 'fixed top-4 right-4 z-50' : '',
        'border transition-colors backdrop-blur-sm',
        className,
      ].join(' ')}
      aria-label={theme === 'dark' ? '라이트 모드로 변경' : '다크 모드로 변경'}
    >
      {theme === 'dark' ? '라이트 모드' : '다크 모드'}
    </button>
  )
}
