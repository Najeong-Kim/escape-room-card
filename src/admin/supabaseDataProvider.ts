import { createClient } from '@supabase/supabase-js'
import type { DataProvider } from 'react-admin'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

function toSupabaseFilters(filter: Record<string, unknown>) {
  return filter
}

export function createSupabaseDataProvider(): DataProvider {
  return {
    async getList(resource, params) {
      const page = params.pagination?.page ?? 1
      const perPage = params.pagination?.perPage ?? 25
      const field = params.sort?.field ?? 'id'
      const order = params.sort?.order ?? 'ASC'
      const from = (page - 1) * perPage
      const to = from + perPage - 1

      let query = supabase
        .from(resource)
        .select('*', { count: 'exact' })
        .order(field, { ascending: order === 'ASC' })
        .range(from, to)

      const filter = toSupabaseFilters(params.filter)
      for (const [key, value] of Object.entries(filter)) {
        if (value !== undefined && value !== null && value !== '') {
          query = query.ilike(key, `%${value}%`)
        }
      }

      const { data, error, count } = await query
      if (error) throw error
      return { data: data ?? [], total: count ?? 0 }
    },

    async getOne(resource, params) {
      const { data, error } = await supabase
        .from(resource)
        .select('*')
        .eq('id', params.id)
        .single()
      if (error) throw error
      return { data }
    },

    async getMany(resource, params) {
      const { data, error } = await supabase
        .from(resource)
        .select('*')
        .in('id', params.ids)
      if (error) throw error
      return { data: data ?? [] }
    },

    async getManyReference(resource, params) {
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
      return { data: data ?? [], total: count ?? 0 }
    },

    async create(resource, params) {
      const { id: _id, ...rest } = params.data
      const { data, error } = await supabase
        .from(resource)
        .insert(rest)
        .select()
        .single()
      if (error) throw error
      return { data }
    },

    async update(resource, params) {
      const { id, ...rest } = params.data
      const { data, error } = await supabase
        .from(resource)
        .update(rest)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return { data }
    },

    async updateMany(resource, params) {
      const { id: _id, ...rest } = params.data
      const { error } = await supabase
        .from(resource)
        .update(rest)
        .in('id', params.ids)
      if (error) throw error
      return { data: params.ids }
    },

    async delete(resource, params) {
      const { data, error } = await supabase
        .from(resource)
        .delete()
        .eq('id', params.id)
        .select()
        .single()
      if (error) throw error
      return { data }
    },

    async deleteMany(resource, params) {
      const { error } = await supabase
        .from(resource)
        .delete()
        .in('id', params.ids)
      if (error) throw error
      return { data: params.ids }
    },
  }
}
