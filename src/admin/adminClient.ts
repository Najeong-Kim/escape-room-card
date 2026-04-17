import { supabase } from '../lib/supabaseClient'
import { getAdminToken } from './authProvider'

async function adminRequest(operation: string, params: unknown) {
  const { data, error } = await supabase.functions.invoke('admin-proxy', {
    body: { operation, params },
    headers: { 'x-admin-token': getAdminToken() },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

export function adminUpdate(
  table: string,
  payload: Record<string, unknown>,
  eq: { column: string; value: unknown },
) {
  return adminRequest('rawUpdate', { table, payload, eq })
}

export function adminInsert(
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
) {
  return adminRequest('rawInsert', { table, rows })
}

export function adminDelete(
  table: string,
  eq: { column: string; value: unknown },
) {
  return adminRequest('rawDelete', { table, eq })
}

export function adminRpc(fn: string, args: Record<string, unknown>) {
  return adminRequest('rpc', { fn, args })
}
