import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Validate admin token (passed via x-admin-token, not Authorization)
  const token = req.headers.get('x-admin-token') ?? ''

  if (!ADMIN_PASSWORD || token !== ADMIN_PASSWORD) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const { operation, resource, params } = await req.json()

  // Auth ping — just confirm the token is valid
  if (operation === 'auth') {
    return json({ ok: true })
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
        const { data, error } = await supabase
          .from(resource)
          .select('*')
          .in('id', params.ids)
        if (error) throw error
        result = { data: data ?? [] }
        break
      }

      case 'getManyReference': {
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
        const { error } = await supabase
          .from(resource)
          .delete()
          .eq('id', params.id)
        if (error) throw error
        result = { data: { id: params.id } }
        break
      }

      case 'deleteMany': {
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
        const { data, error } = await supabase.rpc(fn, args)
        if (error) throw error
        result = { data }
        break
      }

      default:
        return json({ error: `Unknown operation: ${operation}` }, 400)
    }

    return json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ error: message }, 500)
  }
})
