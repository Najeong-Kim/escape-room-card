const SAFE_PROTOCOLS = new Set(['http:', 'https:'])

export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    return SAFE_PROTOCOLS.has(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export function sanitizeExternalUrlInput(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return safeExternalUrl(trimmed)
}
