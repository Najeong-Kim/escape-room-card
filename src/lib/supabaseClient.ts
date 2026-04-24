import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
// anon key (JWT) is required for the REST API (/rest/v1/).
// VITE_SUPABASE_PUBLISHABLE_KEY (sb_publishable_... format) is not a JWT and is rejected by PostgREST.
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

let accessTokenGetter: (() => Promise<string | null>) | null = null

export function setSupabaseAccessTokenGetter(next: (() => Promise<string | null>) | null) {
  accessTokenGetter = next
}

export const supabase = createClient(url, anonKey, {
  accessToken: async () => accessTokenGetter ? accessTokenGetter() : null,
})
