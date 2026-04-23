import { supabase } from '../lib/supabaseClient'

const SESSION_KEY = 'admin_session'

interface AdminSession {
  token: string
  expiresAt: number
}

function readSession(): AdminSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>
    if (typeof parsed.token !== 'string' || typeof parsed.expiresAt !== 'number') {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    if (Date.now() >= parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return { token: parsed.token, expiresAt: parsed.expiresAt }
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

export const authProvider = {
  login: async ({ password }: { password: string }) => {
    const { data, error } = await supabase.functions.invoke('admin-proxy', {
      body: { operation: 'auth' },
      headers: { 'x-admin-token': password },
    })
    if (error || typeof data?.sessionToken !== 'string' || typeof data?.expiresAt !== 'number') {
      throw new Error('Wrong password')
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      token: data.sessionToken,
      expiresAt: data.expiresAt,
    }))
  },

  logout: () => {
    sessionStorage.removeItem(SESSION_KEY)
    return Promise.resolve()
  },

  checkAuth: () =>
    readSession() ? Promise.resolve() : Promise.reject(),

  checkError: () => Promise.resolve(),

  getPermissions: () => Promise.resolve(),
}

export function getAdminToken(): string {
  return readSession()?.token ?? ''
}
