const BLOCKED_IMAGE_HOSTS = new Set([
  'xn--jj0b998aq3cptw.com',
  'www.code-k.co.kr',
])

export function safeImageUrl(value: string | null | undefined) {
  if (!value) return undefined

  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return undefined
    if (BLOCKED_IMAGE_HOSTS.has(url.hostname)) return undefined
    return url.toString()
  } catch {
    return undefined
  }
}
