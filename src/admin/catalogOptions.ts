import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface AreaOption {
  id: number
  name: string
}

export interface GenreOption {
  id: number
  code: string
  name: string
}

export function useCatalogOptions() {
  const [areas, setAreas] = useState<AreaOption[]>([])
  const [genres, setGenres] = useState<GenreOption[]>([])

  const loadOptions = useCallback(async () => {
    const [{ data: areaRows, error: areaError }, { data: genreRows, error: genreError }] = await Promise.all([
      supabase.from('areas').select('id, name').order('sort_order'),
      supabase.from('genres').select('id, code, name').order('sort_order'),
    ])

    if (areaError) console.warn('areas fetch failed', areaError.message)
    if (genreError) console.warn('genres fetch failed', genreError.message)

    setAreas((areaRows ?? []) as AreaOption[])
    setGenres((genreRows ?? []) as GenreOption[])
  }, [])

  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  return { areas, genres }
}
