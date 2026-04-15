const IGNORED_FIELDS = new Set(['id', 'created_at', 'updated_at', 'theme_genres', 'cafes'])

export function omitUndefined(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  )
}

function normalizeComparable(value) {
  if (value === undefined) return null
  if (Array.isArray(value)) return JSON.stringify(value)
  if (value && typeof value === 'object') return JSON.stringify(value)
  return value
}

export function diffThemeChanges(current, next) {
  const changes = {}
  const snapshot = {}

  for (const [key, value] of Object.entries(omitUndefined(next))) {
    if (IGNORED_FIELDS.has(key)) continue
    const before = current?.[key] ?? null
    if (normalizeComparable(before) === normalizeComparable(value ?? null)) continue
    changes[key] = { from: before, to: value ?? null }
    snapshot[key] = before
  }

  return { changes, snapshot }
}

export async function applyOrSuggestThemeUpdate(supabase, theme, patch, options) {
  const safePatch = omitUndefined(patch)
  const { changes, snapshot } = diffThemeChanges(theme, safePatch)
  if (Object.keys(changes).length === 0) {
    return { action: 'unchanged' }
  }

  if (theme.needs_review === true || theme.status !== 'active') {
    const { error } = await supabase
      .from('themes')
      .update(safePatch)
      .eq('id', theme.id)
    if (error) throw error
    return { action: 'updated', changes }
  }

  const { data: existingSuggestions, error: existingError } = await supabase
    .from('theme_update_suggestions')
    .select('id,suggested_changes')
    .eq('theme_id', theme.id)
    .eq('status', 'pending')
    .eq('source_name', options.sourceName)

  if (existingError) throw existingError

  const serializedChanges = JSON.stringify(changes)
  const duplicate = (existingSuggestions ?? []).some(
    suggestion => JSON.stringify(suggestion.suggested_changes) === serializedChanges,
  )
  if (duplicate) {
    return { action: 'suggested_existing', changes }
  }

  const { error } = await supabase
    .from('theme_update_suggestions')
    .insert({
      theme_id: theme.id,
      source_name: options.sourceName,
      source_url: options.sourceUrl ?? null,
      suggested_changes: changes,
      current_snapshot: snapshot,
    })
  if (error) throw error
  return { action: 'suggested', changes }
}
