import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD')
const ADMIN_SESSION_SECRET = Deno.env.get('ADMIN_SESSION_SECRET') || ADMIN_PASSWORD
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12
const SITE_URL = Deno.env.get('SITE_URL')?.replace(/\/$/, '')
const VERCEL_URL = Deno.env.get('VERCEL_URL') ? `https://${Deno.env.get('VERCEL_URL')}` : null
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  SITE_URL,
  VERCEL_URL,
].filter(Boolean) as string[])

const ALLOWED_RESOURCES = new Set([
  'themes',
  'cafes',
  'theme_tags',
  'theme_taggings',
  'theme_review_links',
  'reports',
])

const ALLOWED_ADMIN_TABLES = new Set([
  'themes',
  'cafes',
  'theme_genres',
  'theme_update_suggestions',
  'cafe_verification_candidates',
])

const ALLOWED_RPCS = new Set([
  'review_cafe_for_review',
  'close_cafe_for_review',
  'review_theme_for_review',
])

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'null'
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

function constantTimeEquals(a: string, b: string) {
  const encoder = new TextEncoder()
  const aa = encoder.encode(a)
  const bb = encoder.encode(b)
  const length = Math.max(aa.length, bb.length)
  let diff = aa.length === bb.length ? 0 : 1

  for (let i = 0; i < length; i += 1) {
    diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0)
  }

  return diff === 0
}

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  return atob(`${normalized}${padding}`)
}

async function signSessionPayload(payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ADMIN_SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return encodeBase64Url(String.fromCharCode(...new Uint8Array(signature)))
}

async function createSessionToken() {
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS
  const payload = `${expiresAt}.${crypto.randomUUID()}`
  const signature = await signSessionPayload(payload)
  return {
    sessionToken: `${encodeBase64Url(payload)}.${signature}`,
    expiresAt,
  }
}

async function validateSessionToken(token: string) {
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return false

  let payload: string
  try {
    payload = decodeBase64Url(encodedPayload)
  } catch {
    return false
  }

  const expectedSignature = await signSessionPayload(payload)
  if (!constantTimeEquals(signature, expectedSignature)) return false

  const [expiresAt] = payload.split('.')
  const expiry = Number(expiresAt)
  return Number.isFinite(expiry) && Date.now() < expiry
}

function assertAllowedResource(resource: unknown) {
  if (typeof resource !== 'string' || !ALLOWED_RESOURCES.has(resource)) {
    throw new Error('Forbidden resource')
  }
}

function assertAllowedTable(table: unknown) {
  if (typeof table !== 'string' || !ALLOWED_ADMIN_TABLES.has(table)) {
    throw new Error('Forbidden table')
  }
}

function assertAllowedRpc(fn: unknown) {
  if (typeof fn !== 'string' || !ALLOWED_RPCS.has(fn)) {
    throw new Error('Forbidden rpc')
  }
}

function assertSafeColumn(column: unknown) {
  if (typeof column !== 'string' || !/^[a-z_][a-z0-9_]*$/i.test(column)) {
    throw new Error('Forbidden column')
  }
}

function sanitizeOrigin(req: Request) {
  const origin = req.headers.get('origin')
  if (!origin) return null
  return ALLOWED_ORIGINS.has(origin) ? origin : null
}

Deno.serve(async (req) => {
  const origin = sanitizeOrigin(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) })
  }

  const token = req.headers.get('x-admin-token') ?? ''
  let body: { operation?: string; resource?: string; params?: Record<string, unknown> }

  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, origin)
  }

  const { operation, resource, params = {} } = body

  if (!ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    return json({ error: 'Admin auth is not configured' }, 500, origin)
  }

  if (operation === 'auth') {
    if (!constantTimeEquals(token, ADMIN_PASSWORD)) {
      return json({ error: 'Unauthorized' }, 401, origin)
    }
    return json(await createSessionToken(), 200, origin)
  }

  if (!(await validateSessionToken(token))) {
    return json({ error: 'Unauthorized' }, 401, origin)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  try {
    let result: unknown

    switch (operation) {
      case 'getList': {
        assertAllowedResource(resource)
        const { page = 1, perPage = 25 } = params.pagination ?? {}
        const { field = 'id', order = 'ASC' } = params.sort ?? {}
        const from = (page - 1) * perPage
        const to = from + perPage - 1
        const select = typeof params.meta?.select === 'string' ? params.meta.select : '*'

        let query = supabase
          .from(resource)
          .select(select, { count: 'exact' })
          .order(field, { ascending: order === 'ASC' })
          .range(from, to)

        for (const [key, value] of Object.entries(params.filter ?? {})) {
          if (value !== undefined && value !== null && value !== '') {
            // deno-lint-ignore no-explicit-any
            query = (query as any).ilike(key, `%${value}%`)
          }
        }

        const { data, error, count } = await query
        if (error) throw error
        result = { data: data ?? [], total: count ?? 0 }
        break
      }

      case 'getOne': {
        assertAllowedResource(resource)
        const select = typeof params.meta?.select === 'string' ? params.meta.select : '*'
        const { data, error } = await supabase
          .from(resource)
          .select(select)
          .eq('id', params.id)
          .single()
        if (error) throw error
        result = { data }
        break
      }

      case 'getMany': {
        assertAllowedResource(resource)
        const { data, error } = await supabase
          .from(resource)
          .select('*')
          .in('id', params.ids)
        if (error) throw error
        result = { data: data ?? [] }
        break
      }

      case 'getManyReference': {
        assertAllowedResource(resource)
        const { page, perPage } = params.pagination
        const { field, order } = params.sort
        const from = (page - 1) * perPage
        const to = from + perPage - 1

        const { data, error, count } = await supabase
          .from(resource)
          .select('*', { count: 'exact' })
          .eq(params.target, params.id)
          .order(field, { ascending: order === 'ASC' })
          .range(from, to)
        if (error) throw error
        result = { data: data ?? [], total: count ?? 0 }
        break
      }

      case 'create': {
        assertAllowedResource(resource)
        const { id: _id, ...rest } = params.data
        const { data, error } = await supabase
          .from(resource)
          .insert(rest)
          .select()
          .single()
        if (error) throw error
        result = { data }
        break
      }

      case 'update': {
        assertAllowedResource(resource)
        // params.id is the authoritative id from react-admin
        const id = params.id ?? params.data?.id
        const { id: _id, ...rest } = params.data ?? {}
        const { error } = await supabase
          .from(resource)
          .update(rest)
          .eq('id', id)
        if (error) throw error
        // fetch the updated row separately to avoid .single() PGRST116
        const { data, error: fetchError } = await supabase
          .from(resource)
          .select('*')
          .eq('id', id)
          .single()
        if (fetchError) throw fetchError
        result = { data }
        break
      }

      case 'updateMany': {
        assertAllowedResource(resource)
        const { id: _id, ...rest } = params.data
        const { error } = await supabase
          .from(resource)
          .update(rest)
          .in('id', params.ids)
        if (error) throw error
        result = { data: params.ids }
        break
      }

      case 'delete': {
        assertAllowedResource(resource)
        const { error } = await supabase
          .from(resource)
          .delete()
          .eq('id', params.id)
        if (error) throw error
        result = { data: { id: params.id } }
        break
      }

      case 'deleteMany': {
        assertAllowedResource(resource)
        const { error } = await supabase
          .from(resource)
          .delete()
          .in('id', params.ids)
        if (error) throw error
        result = { data: params.ids }
        break
      }

      // Raw update by arbitrary column (used by approval list components)
      case 'rawUpdate': {
        const { table, payload, eq: eqClause } = params as {
          table: string
          payload: Record<string, unknown>
          eq: { column: string; value: unknown }
        }
        assertAllowedTable(table)
        assertSafeColumn(eqClause?.column)
        const { error } = await supabase
          .from(table)
          .update(payload)
          .eq(eqClause.column, eqClause.value)
        if (error) throw error
        result = { ok: true }
        break
      }

      // Raw insert (used by approval list components)
      case 'rawInsert': {
        const { table, rows } = params as {
          table: string
          rows: Record<string, unknown> | Record<string, unknown>[]
        }
        assertAllowedTable(table)
        const { error } = await supabase.from(table).insert(rows as never)
        if (error) throw error
        result = { ok: true }
        break
      }

      // Raw delete by arbitrary column (used by approval list components)
      case 'rawDelete': {
        const { table, eq: eqClause } = params as {
          table: string
          eq: { column: string; value: unknown }
        }
        assertAllowedTable(table)
        assertSafeColumn(eqClause?.column)
        const { error } = await supabase
          .from(table)
          .delete()
          .eq(eqClause.column, eqClause.value)
        if (error) throw error
        result = { ok: true }
        break
      }

      // RPC call (used by approval list components)
      case 'rpc': {
        const { fn, args } = params as { fn: string; args: Record<string, unknown> }
        assertAllowedRpc(fn)
        const { data, error } = await supabase.rpc(fn, args)
        if (error) throw error
        result = { data }
        break
      }

      default:
        return json({ error: `Unknown operation: ${operation}` }, 400, origin)
    }

    return json(result, 200, origin)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message.startsWith('Forbidden') ? 403 : 500
    return json({ error: message }, status, origin)
  }
})
