import { useEffect } from 'react'
import { syncLocalRoomLogsToUser } from '../lib/userRoomLogs'
import { syncSavedCardProfileToUser } from '../lib/userCardProfile'
import { useAppAuth } from '../lib/auth'

export function UserAuthButton({
  className = 'top-24',
  floating = true,
  menuStyle = false,
}: {
  className?: string
  floating?: boolean
  menuStyle?: boolean
}) {
  const auth = useAppAuth()

  useEffect(() => {
    if (!auth.isSignedIn) return
    syncLocalRoomLogsToUser()
    syncSavedCardProfileToUser()
  }, [auth.isSignedIn, auth.userId])

  function handleButtonClick() {
    if (auth.isSignedIn) auth.openUserProfile()
    else auth.openSignIn()
  }

  return (
    <button
      type="button"
      onClick={handleButtonClick}
      className={[
        menuStyle
          ? 'app-auth-button flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-[13px] font-semibold'
          : 'app-auth-button app-icon-button rounded-full',
        floating ? 'fixed right-4 z-50' : '',
        'border transition-colors backdrop-blur-sm',
        className,
      ].join(' ')}
      style={menuStyle ? {
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface-raised)',
        color: 'var(--color-text)',
      } : undefined}
      aria-label={auth.isSignedIn ? '계정 보기' : '로그인'}
      title={auth.isSignedIn ? '계정 보기' : '로그인'}
    >
      {menuStyle ? (
        <>
          <span className="truncate">{auth.isSignedIn ? '계정 보기' : '로그인'}</span>
          <span
            className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          >
            <UserIcon signedIn={auth.isSignedIn} />
          </span>
        </>
      ) : (
        <UserIcon signedIn={auth.isSignedIn} />
      )}
    </button>
  )
}

function UserIcon({ signedIn }: { signedIn: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 20c.7-3.7 3.2-6 7-6s6.3 2.3 7 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      {signedIn && <circle cx="18.2" cy="5.8" r="2.2" fill="#22c55e" stroke="currentColor" strokeWidth="1" />}
    </svg>
  )
}
