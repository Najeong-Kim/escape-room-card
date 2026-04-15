import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { syncLocalRoomLogsToUser } from '../lib/userRoomLogs'

type AuthStatus = 'idle' | 'sending' | 'sent' | 'error'

function displayEmail(session: Session | null) {
  const email = session?.user.email
  if (!email) return ''
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 10)}@${domain}`
}

export function UserAuthButton({ className = 'top-24' }: { className?: string }) {
  const [session, setSession] = useState<Session | null>(null)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<AuthStatus>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) syncLocalRoomLogsToUser()
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) {
        setOpen(false)
        syncLocalRoomLogsToUser()
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setStatus('sending')
    setMessage('')
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
      return
    }

    setStatus('sent')
    setMessage('메일함에서 로그인 링크를 확인해 주세요.')
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'app-auth-button fixed right-4 z-50 text-xs px-3 py-1.5 rounded-full',
          'border transition-colors backdrop-blur-sm',
          className,
        ].join(' ')}
      >
        {session ? displayEmail(session) : '로그인'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={event => { if (event.target === event.currentTarget) setOpen(false) }}
        >
          <div className="auth-modal w-full max-w-sm rounded-2xl border border-white/10 bg-[#16161f] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-violet-300 font-semibold">계정</p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  {session ? '로그인됨' : '이메일로 로그인'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xl leading-none text-gray-500 hover:text-white"
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            {session ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-[#0e0e16] border border-white/10 px-4 py-3">
                  <p className="text-xs text-gray-500">로그인 이메일</p>
                  <p className="mt-1 text-sm font-semibold text-white break-all">{session.user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="w-full rounded-xl border border-red-500/30 bg-red-900/20 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-900/30"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <form onSubmit={sendMagicLink} className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-xs text-gray-400">이메일</span>
                  <input
                    type="email"
                    value={email}
                    onChange={event => {
                      setEmail(event.target.value)
                      setStatus('idle')
                      setMessage('')
                    }}
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0e0e16] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/60"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="app-primary-action w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
                >
                  {status === 'sending' ? '메일 보내는 중...' : '로그인 링크 받기'}
                </button>
                {message && (
                  <p className={status === 'error' ? 'text-xs text-red-400' : 'text-xs text-green-400'}>
                    {message}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-gray-500">
                  비밀번호 없이 메일로 받은 링크를 누르면 로그인됩니다.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
