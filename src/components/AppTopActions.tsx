import { AppThemeToggle } from './AppThemeToggle'
import { UserAuthButton } from './UserAuthButton'

interface Props {
  languageLabel?: string
  onLanguageToggle?: () => void
}

export function AppTopActions({ languageLabel, onLanguageToggle }: Props) {
  return (
    <div className="app-top-actions fixed top-4 right-4 z-50 flex max-w-[calc(100%-2rem)] flex-wrap justify-end gap-2 max-[480px]:top-3 max-[480px]:right-3 max-[480px]:max-w-[8rem] max-[480px]:gap-1">
      <AppThemeToggle floating={false} />
      <UserAuthButton floating={false} className="" />
      {languageLabel && onLanguageToggle && (
        <button
          type="button"
          onClick={onLanguageToggle}
          className="app-auth-button text-xs px-3 py-1.5 rounded-full border transition-colors backdrop-blur-sm"
        >
          {languageLabel}
        </button>
      )}
    </div>
  )
}
