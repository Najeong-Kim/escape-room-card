import { applyOrSuggestThemeUpdate, omitUndefined } from './safe-theme-updates.mjs'

function stripHtml(value = '') {
  return String(value ?? '').replace(/<[^>]+>/g, ' ')
}

export function normalizeCatalogKey(value = '') {
  return stripHtml(value)
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[{}:;'"`.,!?/\\|·_\-+~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function compactKey(value = '') {
  return normalizeCatalogKey(value).replace(/\s+/g, '')
}

function normalizeAddress(value = '') {
  return compactKey(
    String(value ?? '')
      .replace(/서울특별시/g, '서울')
      .replace(/지하\s*/g, 'b')
      .replace(/층/g, 'f'),
  )
}

function cafeDisplayName(cafe) {
  return `${cafe.name ?? ''}${cafe.branch_name ? ` ${cafe.branch_name}` : ''}`.trim()
}

function sameCompactName(a, b) {
  const left = compactKey(a)
  const right = compactKey(b)
  if (!left || !right) return false
  if (left === right) return true
  if (Math.min(left.length, right.length) < 4) return false
  return left.includes(right) || right.includes(left)
}

export function findMatchingCafe(cafes, cafeInput) {
  const cafeName = cafeDisplayName(cafeInput)
  const inputAddress = normalizeAddress(cafeInput.address)
  const inputPlaceId = cafeInput.naver_place_id ?? null

  return cafes.find(cafe => {
    if (cafe.normalized_key === cafeInput.normalized_key) return true
    if (inputPlaceId && cafe.naver_place_id === inputPlaceId) return true

    const cafeAddress = normalizeAddress(cafe.address)
    if (inputAddress && cafeAddress && inputAddress === cafeAddress) {
      return sameCompactName(cafeDisplayName(cafe), cafeName)
    }

    return false
  }) ?? null
}

export function findMatchingTheme(themes, themeInput) {
  const themeName = themeInput.name ?? ''
  const sourceUrl = themeInput.source_url ?? null

  return themes.find(theme => {
    if (theme.normalized_key === themeInput.normalized_key) return true
    if (sourceUrl && theme.source_urls?.includes(sourceUrl)) return true
    return sameCompactName(theme.name, themeName)
  }) ?? null
}

export async function loadCafeIndex(supabase) {
  const { data: cafes, error } = await supabase
    .from('cafes')
    .select('id,normalized_key,name,branch_name,area_label,district,address,phone,website_url,booking_url,source_url,status,needs_review,naver_place_id')
    .order('id')
  if (error) throw error

  const cafeRows = cafes ?? []
  const cafeIds = cafeRows.map(cafe => cafe.id)
  const themesByCafeId = new Map(cafeIds.map(id => [id, []]))

  for (let index = 0; index < cafeIds.length; index += 200) {
    const ids = cafeIds.slice(index, index + 200)
    const { data: themes, error: themesError } = await supabase
      .from('themes')
      .select('id,cafe_id,normalized_key,name,status,needs_review,source_url,theme_sources(source_url)')
      .in('cafe_id', ids)
    if (themesError) throw themesError

    for (const theme of themes ?? []) {
      const sources = Array.isArray(theme.theme_sources) ? theme.theme_sources : []
      const sourceUrls = [
        theme.source_url,
        ...sources.map(source => source.source_url),
      ].filter(Boolean)
      themesByCafeId.get(theme.cafe_id)?.push({ ...theme, source_urls: sourceUrls })
    }
  }

  return cafeRows.map(cafe => ({
    ...cafe,
    themes: themesByCafeId.get(cafe.id) ?? [],
  }))
}

export async function insertCafeOnly(supabase, cafeInput, areaId) {
  const patch = omitUndefined({ ...cafeInput, area_id: areaId })
  const { data, error } = await supabase
    .from('cafes')
    .insert(patch)
    .select('*')
    .single()
  if (error) throw error
  return { ...data, themes: [] }
}

export async function insertOrSuggestTheme(supabase, existingTheme, patch, options) {
  if (!existingTheme) {
    const { data, error } = await supabase
      .from('themes')
      .insert(patch)
      .select('*')
      .single()
    if (error) throw error
    return { theme: data, action: 'inserted' }
  }

  const result = await applyOrSuggestThemeUpdate(supabase, {
    ...existingTheme,
    needs_review: false,
    status: 'active',
  }, patch, options)

  return { theme: existingTheme, action: result.action }
}
