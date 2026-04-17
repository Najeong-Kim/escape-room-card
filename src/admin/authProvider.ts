import { supabase } from '../lib/supabaseClient'

const TOKEN_KEY = 'admin_token'

export const authProvider = {
  login: async ({ password }: { password: string }) => {
    const { data, error } = await supabase.functions.invoke('admin-proxy', {
      body: { operation: 'auth' },
      headers: { 'x-admin-token': password },
    })
    if (error || !data?.ok) {
      throw new Error('Wrong password')
    }
    sessionStorage.setItem(TOKEN_KEY, password)
  },

  logout: () => {
    sessionStorage.removeItem(TOKEN_KEY)
    return Promise.resolve()
  },

  checkAuth: () =>
    sessionStorage.getItem(TOKEN_KEY) ? Promise.resolve() : Promise.reject(),

  checkError: () => Promise.resolve(),

  getPermissions: () => Promise.resolve(),
}

export function getAdminToken(): string {
  return sessionStorage.getItem(TOKEN_KEY) ?? ''
}
