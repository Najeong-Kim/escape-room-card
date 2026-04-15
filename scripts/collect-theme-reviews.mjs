import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = resolve(import.meta.dirname, '..')
const ENV_PATH = resolve(ROOT, '.env.local')
const USER_AGENT = 'Mozilla/5.0 (compatible; EscapeRoomCardBot/1.0)'
const DEFAULT_AUTO_ACTIVE_SCORE = 80
const DEFAULT_PENDING_SCORE = 60
const DEFAULT_MAX_RESULTS_PER_PROVIDER = 5
const DEFAULT_DELAY_MS = 150

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

function parseArgs(argv) {
  const options = {
    dryRun: argv.includes('--dry-run'),
    providers: new Set(['naver-blog', 'youtube']),
    autoActiveScore: DEFAULT_AUTO_ACTIVE_SCORE,
    pendingScore: DEFAULT_PENDING_SCORE,
    maxResults: DEFAULT_MAX_RESULTS_PER_PROVIDER,
    delayMs: DEFAULT_DELAY_MS,
    limit: null,
    themeId: null,
  }

  for (const arg of argv) {
    const [key, value] = arg.split('=')
    if (key === '--providers' && value) {
      options.providers = new Set(value.split(',').map(provider => provider.trim()).filter(Boolean))
    }
    if (key === '--auto-active-score' && value) options.autoActiveScore = Number(value)
    if (key === '--pending-score' && value) options.pendingScore = Number(value)
    if (key === '--max-results' && value) options.maxResults = Number(value)
    if (key === '--delay-ms' && value) options.delayMs = Number(value)
    if (key === '--limit' && value) options.limit = Number(value)
    if (key === '--theme-id' && value) options.themeId = Number(value)
  }

  return options
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function decodeHtml(value = '') {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeText(value = '') {
  return decodeHtml(value)
    .toLowerCase()
    .replace(/[\s'".,()[\]{}:;!?/\\|·\-_=+~`]/g, '')
}

function first(value) {
  return Array.isArray(value) ? value[0] : value
}

function cafeLabel(cafe) {
  if (!cafe) return ''
  return `${cafe.name ?? ''} ${cafe.branch_name ?? ''}`.trim()
}

function queryTerms(theme) {
  const cafe = first(theme.cafes)
  const cafeName = cafeLabel(cafe)
  return [
    `${cafeName} ${theme.name} 방탈출 후기`,
    `${theme.name} 방탈출 후기`,
  ].filter(Boolean)
}

function scoreCandidate(theme, candidate) {
  const cafe = first(theme.cafes)
  const themeKey = normalizeText(theme.name)
  const cafeKey = normalizeText(cafe?.name)
  const branchKey = normalizeText(cafe?.branch_name)
  const titleKey = normalizeText(candidate.title)
  const bodyKey = normalizeText(candidate.description)
  const combinedKey = `${titleKey} ${bodyKey}`
  const combinedText = decodeHtml(`${candidate.title} ${candidate.description}`)
  const reasons = []
  let score = 0

  if (themeKey && titleKey.includes(themeKey)) {
    score += 40
    reasons.push('제목에 테마명 일치')
  } else if (themeKey && bodyKey.includes(themeKey)) {
    score += 25
    reasons.push('본문에 테마명 일치')
  }

  if (cafeKey && titleKey.includes(cafeKey)) {
    score += 25
    reasons.push('제목에 매장명 일치')
  } else if (cafeKey && combinedKey.includes(cafeKey)) {
    score += 15
    reasons.push('본문에 매장명 일치')
  }

  if (branchKey && branchKey.length >= 2 && combinedKey.includes(branchKey)) {
    score += 10
    reasons.push('지점명 일치')
  }

  if (/방탈출|탈출|힌트|난이도|후기|리뷰/.test(combinedText)) {
    score += 15
    reasons.push('방탈출 후기 키워드 포함')
  }

  if (candidate.thumbnailUrl) {
    score += 5
    reasons.push('썸네일 있음')
  }

  if (/예약|예매|가격|위치|이벤트/.test(combinedText) && !/후기|리뷰/.test(combinedText)) {
    score -= 15
    reasons.push('후기보다 안내 글 가능성')
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons,
  }
}

function normalizeNaverDate(value) {
  if (!/^\d{8}$/.test(value ?? '')) return null
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

async function fetchNaverBlog(query, env, maxResults) {
  const clientId = process.env.NAVER_CLIENT_ID ?? process.env.NAVER_SEARCH_CLIENT_ID ?? env.NAVER_CLIENT_ID ?? env.NAVER_SEARCH_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET ?? process.env.NAVER_SEARCH_CLIENT_SECRET ?? env.NAVER_CLIENT_SECRET ?? env.NAVER_SEARCH_CLIENT_SECRET
  if (!clientId || !clientSecret) return { skipped: 'NAVER_CLIENT_ID/NAVER_CLIENT_SECRET missing', items: [] }

  const url = new URL('https://openapi.naver.com/v1/search/blog.json')
  url.searchParams.set('query', query)
  url.searchParams.set('display', String(maxResults))
  url.searchParams.set('sort', 'sim')

  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      'x-naver-client-id': clientId,
      'x-naver-client-secret': clientSecret,
    },
  })
  if (!response.ok) throw new Error(`Naver blog API failed: HTTP ${response.status}`)

  const data = await response.json()
  return {
    items: (data.items ?? []).map(item => ({
      sourceType: 'blog',
      title: decodeHtml(item.title),
      url: item.link,
      author: decodeHtml(item.bloggername),
      publishedAt: normalizeNaverDate(item.postdate),
      thumbnailUrl: null,
      description: decodeHtml(item.description),
      provider: 'naver-blog',
      raw: item,
    })),
  }
}

async function fetchYoutube(query, env, maxResults) {
  const apiKey = process.env.YOUTUBE_API_KEY ?? env.YOUTUBE_API_KEY
  if (!apiKey) return { skipped: 'YOUTUBE_API_KEY missing', items: [] }

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('q', query)
  url.searchParams.set('relevanceLanguage', 'ko')

  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } })
  if (!response.ok) throw new Error(`YouTube API failed: HTTP ${response.status}`)

  const data = await response.json()
  return {
    items: (data.items ?? [])
      .filter(item => item.id?.videoId)
      .map(item => ({
        sourceType: 'youtube',
        title: decodeHtml(item.snippet?.title),
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        author: decodeHtml(item.snippet?.channelTitle),
        publishedAt: item.snippet?.publishedAt?.slice(0, 10) ?? null,
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
        description: decodeHtml(item.snippet?.description),
        provider: 'youtube',
        raw: item,
      })),
  }
}

async function loadThemes(supabase, options) {
  let query = supabase
    .from('themes')
    .select('id,name,status,cafes(name,branch_name,area_label,district)')
    .eq('status', 'active')
    .order('id')

  if (options.themeId) query = query.eq('id', options.themeId)
  if (options.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

async function loadExistingUrls(supabase) {
  const urls = new Set()
  let from = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('theme_review_links')
      .select('url')
      .range(from, from + pageSize - 1)
    if (error) throw error
    for (const row of data ?? []) urls.add(row.url)
    if (!data || data.length < pageSize) break
    from += pageSize
  }

  return urls
}

async function collectForTheme(theme, env, options) {
  const candidates = []
  const providerSkips = new Set()

  for (const query of queryTerms(theme)) {
    if (options.providers.has('naver-blog')) {
      const result = await fetchNaverBlog(query, env, options.maxResults)
      if (result.skipped) providerSkips.add(result.skipped)
      candidates.push(...result.items.map(item => ({ ...item, query })))
      await sleep(options.delayMs)
    }

    if (options.providers.has('youtube')) {
      const result = await fetchYoutube(query, env, options.maxResults)
      if (result.skipped) providerSkips.add(result.skipped)
      candidates.push(...result.items.map(item => ({ ...item, query })))
      await sleep(options.delayMs)
    }
  }

  const seen = new Set()
  const scored = []
  for (const candidate of candidates) {
    if (!candidate.url || seen.has(candidate.url)) continue
    seen.add(candidate.url)

    const match = scoreCandidate(theme, candidate)
    if (match.score < options.pendingScore) continue

    scored.push({
      theme_id: theme.id,
      source_type: candidate.sourceType,
      title: candidate.title || '(제목 없음)',
      url: candidate.url,
      author: candidate.author || null,
      published_at: candidate.publishedAt,
      thumbnail_url: candidate.thumbnailUrl,
      status: match.score >= options.autoActiveScore ? 'active' : 'pending',
      sort_order: match.score >= options.autoActiveScore ? 0 : 100,
      confidence_score: match.score,
      match_reason: match.reasons,
      collected_by: candidate.provider,
      raw_payload: {
        query: candidate.query,
        description: candidate.description,
        raw: candidate.raw,
      },
    })
  }

  return { rows: scored, providerSkips: [...providerSkips] }
}

async function main() {
  const env = parseEnv(await readFile(ENV_PATH, 'utf8'))
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL
  const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY ?? env.VITE_SUPABASE_SERVICE_KEY
  const options = parseArgs(process.argv.slice(2))

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY')
  }

  if (!Number.isFinite(options.autoActiveScore) || !Number.isFinite(options.pendingScore)) {
    throw new Error('Scores must be numbers')
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const themes = await loadThemes(supabase, options)
  const existingUrls = await loadExistingUrls(supabase)
  const rows = []
  const providerSkips = new Set()

  for (const theme of themes) {
    const result = await collectForTheme(theme, env, options)
    for (const skip of result.providerSkips) providerSkips.add(skip)

    const newRows = result.rows.filter(row => !existingUrls.has(row.url))
    for (const row of newRows) existingUrls.add(row.url)
    rows.push(...newRows)

    console.log(`${theme.id} ${cafeLabel(first(theme.cafes))} · ${theme.name}: ${newRows.length} links`)
  }

  if (providerSkips.size) {
    console.warn(`Skipped providers: ${[...providerSkips].join(', ')}`)
  }

  const summary = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1
    acc[row.source_type] = (acc[row.source_type] ?? 0) + 1
    return acc
  }, {})

  if (options.dryRun) {
    console.log(`DRY RUN: ${rows.length} rows`, summary)
    console.table(rows.slice(0, 20).map(row => ({
      theme_id: row.theme_id,
      type: row.source_type,
      status: row.status,
      score: row.confidence_score,
      title: row.title.slice(0, 60),
      url: row.url,
    })))
    return
  }

  if (rows.length) {
    const { error } = await supabase.from('theme_review_links').insert(rows)
    if (error) throw error
  }

  console.log(`Inserted ${rows.length} review links`, summary)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
