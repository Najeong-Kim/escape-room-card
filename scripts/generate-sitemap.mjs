import fs from 'node:fs'

const SITE_URL = (process.env.SITE_URL || process.env.VITE_PUBLIC_SITE_URL || 'https://escape-room-card.vercel.app').replace(/\/$/, '')
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!fs.existsSync(file)) continue
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) continue
      const index = line.indexOf('=')
      const key = line.slice(0, index)
      const value = line.slice(index + 1)
      if (!process.env[key]) process.env[key] = value
    }
  }
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function fetchActiveThemeIds() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return []

  const query = new URLSearchParams({
    select: 'id,updated_at,cafes!inner(status,needs_review)',
    status: 'eq.active',
    needs_review: 'eq.false',
    'cafes.status': 'eq.active',
    'cafes.needs_review': 'eq.false',
    order: 'updated_at.desc',
  })

  const response = await fetch(`${supabaseUrl}/rest/v1/themes?${query.toString()}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  })
  if (!response.ok) throw new Error(`Failed to fetch themes for sitemap: ${response.status}`)
  return response.json()
}

function urlEntry(path, options = {}) {
  const lastmod = options.lastmod ? `\n    <lastmod>${xmlEscape(options.lastmod)}</lastmod>` : ''
  const changefreq = options.changefreq ? `\n    <changefreq>${options.changefreq}</changefreq>` : ''
  const priority = options.priority ? `\n    <priority>${options.priority}</priority>` : ''
  return `  <url>\n    <loc>${xmlEscape(`${SITE_URL}${path}`)}</loc>${lastmod}${changefreq}${priority}\n  </url>`
}

async function main() {
  loadEnv()
  const themes = await fetchActiveThemeIds()
  const today = new Date().toISOString().slice(0, 10)
  const entries = [
    urlEntry('/', { lastmod: today, changefreq: 'weekly', priority: '1.0' }),
    urlEntry('/rooms', { lastmod: today, changefreq: 'daily', priority: '0.9' }),
    ...themes.map(theme => urlEntry(`/rooms/${theme.id}`, {
      lastmod: theme.updated_at ? new Date(theme.updated_at).toISOString().slice(0, 10) : today,
      changefreq: 'weekly',
      priority: '0.7',
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
  fs.writeFileSync('public/sitemap.xml', xml)
  console.log(`Generated public/sitemap.xml with ${entries.length} URLs`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
