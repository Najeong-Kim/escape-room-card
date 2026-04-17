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
        'app-theme-toggle app-icon-button rounded-full',
        floating ? 'fixed top-4 right-4 z-50' : '',
        'border transition-colors backdrop-blur-sm',
        className,
      ].join(' ')}
      aria-label={theme === 'dark' ? '라이트 모드로 변경' : '다크 모드로 변경'}
      title={theme === 'dark' ? '라이트 모드로 변경' : '다크 모드로 변경'}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M20.2 14.7A7.8 7.8 0 0 1 9.3 3.8 8.5 8.5 0 1 0 20.2 14.7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}
