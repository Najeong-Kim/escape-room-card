import { useNavigate, useLocation, Link } from 'react-router-dom'
import { UserAuthButton } from './UserAuthButton'
import { AppThemeToggle } from './AppThemeToggle'

interface GlobalNavProps {
  /** 언어 토글 버튼 표시 여부 */
  languageLabel?: string
  onLanguageToggle?: () => void
}

export function GlobalNav({ languageLabel, onLanguageToggle }: GlobalNavProps) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <nav
      className="global-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        gap: 16,
      }}>
        {/* 로고 */}
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}
        >
          <img
            src="/brand-logo.svg"
            alt="방탕"
            width={28}
            height={28}
            draggable={false}
            style={{ filter: 'drop-shadow(0 0 12px rgba(20,184,166,.45))' }}
          />
          <span className="global-nav-logo-text" style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em' }}>방탕</span>
        </Link>

        {/* 중간 링크 (모바일에서 숨김) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
          <NavLink to="/rooms"    label="방 둘러보기" current={location.pathname} />
          <NavLink to="/my-rooms" label="내 기록"     current={location.pathname} />
          {!isLanding && (
            <NavLink to="/my-card" label="내 카드"     current={location.pathname} />
          )}
        </div>

        {/* 우측 액션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            style={{
              fontSize: 13,
              fontWeight: 700,
              padding: '7px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#14b8a6',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 14px -4px rgba(20,184,166,.5)',
              transition: 'opacity .15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            카드 만들기
          </button>
          <AppThemeToggle floating={false} />
          <UserAuthButton floating={false} className="" />
        </div>
      </div>
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
