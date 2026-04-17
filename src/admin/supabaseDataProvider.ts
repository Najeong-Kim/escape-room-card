import type { DataProvider } from 'react-admin'
import { supabase } from '../lib/supabaseClient'
import { getAdminToken } from './authProvider'

async function adminRequest(operation: string, resource: string, params: unknown) {
  const { data, error } = await supabase.functions.invoke('admin-proxy', {
    body: { operation, resource, params },
    headers: { 'x-admin-token': getAdminToken() },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

export function createSupabaseDataProvider(): DataProvider {
  return {
    getList: (resource, params) => adminRequest('getList', resource, params),
    getOne: (resource, params) => adminRequest('getOne', resource, params),
    getMany: (resource, params) => adminRequest('getMany', resource, params),
    getManyReference: (resource, params) => adminRequest('getManyReference', resource, params),
    create: (resource, params) => adminRequest('create', resource, params),
    update: (resource, params) => adminRequest('update', resource, params),
    updateMany: (resource, params) => adminRequest('updateMany', resource, params),
    delete: (resource, params) => adminRequest('delete', resource, params),
    deleteMany: (resource, params) => adminRequest('deleteMany', resource, params),
  }
}
