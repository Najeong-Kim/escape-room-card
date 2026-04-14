import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = resolve(import.meta.dirname, '..')
const SEED_PATH = resolve(ROOT, 'data/gangnam-gu-themes.seed.json')
const ENV_PATH = resolve(ROOT, '.env.local')
const BUCKET = 'theme-posters'
const STORAGE_HOST_PATTERN = /\/storage\/v1\/object\/public\/theme-posters\//
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const index = line.indexOf('=')
        return [line.slice(0, index), line.slice(index + 1)]
      })
      .filter(([key]) => key),
  )
}

function contentTypeExtension(contentType, url) {
  const normalizedType = contentType?.split(';')[0]?.toLowerCase()
  if (normalizedType === 'image/jpeg') return '.jpg'
  if (normalizedType === 'image/png') return '.png'
  if (normalizedType === 'image/webp') return '.webp'
  if (normalizedType === 'image/gif') return '.gif'

  const pathExt = extname(new URL(url).pathname).toLowerCase()
  if (IMAGE_EXTENSIONS.includes(pathExt)) {
    return pathExt === '.jpeg' ? '.jpg' : pathExt
  }
  return '.jpg'
}

function contentTypeForExtension(ext, fallback) {
  if (fallback?.toLowerCase().startsWith('image/')) return fallback
  if (ext === '.jpg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  return 'image/jpeg'
}

function sourceName(url) {
  const hostname = new URL(url).hostname.replace(/^www\./, '')
  if (hostname.includes('naver')) return 'naver'
  if (hostname.includes('zamfit')) return 'zamfit'
  if (hostname.includes('keyescape')) return 'official:keyescape'
  if (hostname.includes('doorescape')) return 'official:doorescape'
  if (hostname.includes('xdungeon')) return 'official:xdungeon'
  if (hostname.includes('zerogangnam')) return 'official:zerogangnam'
  if (hostname.includes('roomsa')) return 'official:roomsa'
  return hostname
}

function indexSeed(seed) {
  const byKey = new Map()
  for (const cafe of seed.cafes ?? []) {
    for (const theme of cafe.themes ?? []) {
      byKey.set(`${cafe.normalized_key}:${theme.normalized_key}`, theme)
    }
  }
  return byKey
}

async function ensureBucket(supabase) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) throw listError
  if (buckets?.some(bucket => bucket.name === BUCKET)) {
    const { error } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: 15 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    })
    if (error) throw error
    return
  }

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 15 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  })
  if (error) throw error
}

async function updateThemeImage(supabase, themeId, payload) {
  const { error } = await supabase
    .from('themes')
    .update(payload)
    .eq('id', themeId)
  if (!error) return

  if (
    error.message.includes('image_source_url') ||
    error.message.includes('image_source_name') ||
    error.message.includes('image_status')
  ) {
    const { error: fallbackError } = await supabase
      .from('themes')
      .update({ image_url: payload.image_url })
      .eq('id', themeId)
    if (fallbackError) throw fallbackError
    console.warn(`WARN image metadata columns missing; updated image_url only for theme ${themeId}`)
    return
  }

  throw error
}

async function fetchImage(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; EscapeRoomCardBot/1.0)',
      accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  const ext = contentTypeExtension(contentType, url)
  const hasImageExtension = IMAGE_EXTENSIONS.includes(ext)
  if (!contentType.toLowerCase().startsWith('image/') && !hasImageExtension) {
    throw new Error(`Not an image: ${contentType}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.byteLength < 1024) {
    throw new Error(`Image too small: ${buffer.byteLength} bytes`)
  }

  return { buffer, contentType: contentTypeForExtension(ext, contentType), ext }
}

async function main() {
  const env = parseEnv(await readFile(ENV_PATH, 'utf8'))
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL
  const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY ?? env.VITE_SUPABASE_SERVICE_KEY
  const force = process.argv.includes('--force')

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY')
  }

  const seed = JSON.parse(await readFile(SEED_PATH, 'utf8'))
  const seedByKey = indexSeed(seed)
  const supabase = createClient(supabaseUrl, serviceKey)
  await ensureBucket(supabase)

  const { data: themes, error } = await supabase
    .from('themes')
    .select('id,name,normalized_key,image_url,cafes!inner(normalized_key,name,branch_name)')
    .order('id')
  if (error) throw error

  const results = { uploaded: 0, skipped: 0, failed: 0 }

  for (const theme of themes ?? []) {
    const cafe = Array.isArray(theme.cafes) ? theme.cafes[0] : theme.cafes
    const seedTheme = seedByKey.get(`${cafe.normalized_key}:${theme.normalized_key}`)
    const currentUrl = theme.image_url && !STORAGE_HOST_PATTERN.test(theme.image_url) ? theme.image_url : null
    const candidateUrl = currentUrl ?? seedTheme?.image_url ?? null

    if (!candidateUrl) {
      console.log(`SKIP no image: ${theme.id} ${theme.name}`)
      results.skipped += 1
      continue
    }

    if (!force && theme.image_url && STORAGE_HOST_PATTERN.test(theme.image_url)) {
      console.log(`SKIP already stored: ${theme.id} ${theme.name}`)
      results.skipped += 1
      continue
    }

    try {
      const image = await fetchImage(candidateUrl)
      const objectPath = `${theme.id}/poster${image.ext}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, image.buffer, {
          contentType: image.contentType,
          cacheControl: '31536000',
          upsert: true,
        })
      if (uploadError) throw uploadError

      const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
      await updateThemeImage(supabase, theme.id, {
        image_url: publicUrl.publicUrl,
        image_source_url: candidateUrl,
        image_source_name: sourceName(candidateUrl),
        image_status: 'unverified',
      })

      console.log(`UPLOAD ${theme.id} ${theme.name} <- ${candidateUrl}`)
      results.uploaded += 1
    } catch (err) {
      console.warn(`FAIL ${theme.id} ${theme.name}: ${err instanceof Error ? err.message : String(err)}`)
      results.failed += 1
    }
  }

  console.log(results)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
