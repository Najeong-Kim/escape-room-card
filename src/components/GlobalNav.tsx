import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { UserAuthButton } from './UserAuthButton'
import { AppThemeToggle, AppThemeMenuButton } from './AppThemeToggle'

interface GlobalNavProps {
  /** 언어 토글 버튼 표시 여부 */
  languageLabel?: string
  onLanguageToggle?: () => void
}

export function GlobalNav({ languageLabel, onLanguageToggle }: GlobalNavProps) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const isLanding = location.pathname === '/'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const cardLabel = isLanding ? '카드 만들기' : '내 카드'

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <nav
      className="global-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        overflow: 'visible',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-2 px-4 sm:h-[60px] sm:gap-4 sm:px-6">
        {/* 로고 */}
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2 text-inherit no-underline"
        >
          <img
            src="/brand-logo.png"
            alt="방탕"
            width={28}
            height={28}
            draggable={false}
            style={{ filter: 'drop-shadow(0 0 12px rgba(20,184,166,.45))' }}
          />
          <span className="global-nav-logo-text text-[17px] font-black tracking-[-0.02em] sm:text-[18px]">방탕</span>
        </Link>

        {/* 중간 링크 (모바일에서 숨김) */}
        <div className="hidden flex-1 items-center gap-1 md:flex">
          <NavLink to="/rooms"    label="방 둘러보기" current={location.pathname} />
          <NavLink to="/my-rooms" label="내 기록"     current={location.pathname} />
          {!isLanding && (
            <NavLink to="/my-card" label="내 카드"     current={location.pathname} />
          )}
        </div>

        {/* 우측 액션 */}
        <div className="app-top-actions hidden items-center gap-1.5 md:flex sm:gap-2">
          {languageLabel && onLanguageToggle && (
            <button
              type="button"
              onClick={onLanguageToggle}
              className="global-nav-link"
              style={{
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 999,
                border: '1px solid currentColor',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                opacity: 0.6,
              }}
            >
              {languageLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/my-card')}
            className="rounded-lg bg-[#14b8a6] px-3 py-2 text-xs font-bold whitespace-nowrap text-white shadow-[0_4px_14px_-4px_rgba(20,184,166,.5)] transition-opacity hover:opacity-90 sm:px-4 sm:text-[13px]"
            onMouseEnter={e => (e.currentTarget.style.opacity = '.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <span className="sm:hidden">카드</span>
            <span className="hidden sm:inline">카드 만들기</span>
          </button>
          <AppThemeToggle floating={false} />
          <UserAuthButton floating={false} className="" />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(open => !open)}
            className="app-auth-button inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors backdrop-blur-sm"
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileMenuOpen}
          >
            <MenuIcon open={mobileMenuOpen} />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="absolute right-4 top-[calc(100%+8px)] z-[60] w-[min(260px,calc(100vw-1.5rem))] rounded-2xl border p-2 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl md:hidden"
          style={{
            borderColor: 'var(--color-border)',
            background: 'color-mix(in srgb, var(--color-surface) 94%, transparent)',
          }}
        >
          <div className="flex flex-col gap-1.5">
            <MobileMenuLink to="/rooms" label="방 둘러보기" onNavigate={() => setMobileMenuOpen(false)} />
            <MobileMenuLink to="/my-rooms" label="내 기록" onNavigate={() => setMobileMenuOpen(false)} />
            <MobileMenuButton
              label={cardLabel}
              onClick={() => {
                setMobileMenuOpen(false)
                navigate('/my-card')
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <AppThemeMenuButton />
              <UserAuthButton floating={false} menuStyle className="" />
            </div>
            {languageLabel && onLanguageToggle && (
              <MobileMenuButton
                label={languageLabel}
                onClick={() => {
                  setMobileMenuOpen(false)
                  onLanguageToggle()
                }}
              />
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ to, label, current }: { to: string; label: string; current: string }) {
  const active = current === to || current.startsWith(to + '/')
  return (
    <Link
      to={to}
      className={`global-nav-link${active ? ' active' : ''}`}
      style={{
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        textDecoration: 'none',
        padding: '5px 10px',
        borderRadius: 6,
        transition: 'color .15s ease, background .15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Link>
  )
}

function MobileMenuLink({ to, label, onNavigate }: { to: string; label: string; onNavigate: () => void }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="rounded-xl border px-3 py-2.5 text-sm font-semibold no-underline transition-colors"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface-raised)',
        color: 'var(--color-text)',
      }}
    >
      {label}
    </Link>
  )
}

function MobileMenuButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface-raised)',
        color: 'var(--color-text)',
      }}
    >
      {label}
    </button>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      ) : (
        <>
          <path d="M4 7h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M4 12h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </>
      )}
    </svg>
  )
}
