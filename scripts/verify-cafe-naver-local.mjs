import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const REPORT_PATH = path.join('data', 'cafe-naver-local-verification-report.json')
const NAVER_LOCAL_URL = 'https://openapi.naver.com/v1/search/local.json'

function loadEnv() {
  const env = {}
  for (const file of ['.env.local', '.env']) {
    if (!fs.existsSync(file)) continue
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) continue
      const index = line.indexOf('=')
      env[line.slice(0, index)] = line.slice(index + 1)
    }
  }
  return { ...env, ...process.env }
}

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function normalize(value) {
  return stripHtml(value)
    .toLowerCase()
    .replace(/서울특별시/g, '서울')
    .replace(/주식회사|유한회사|\(주\)|방탈출카페|방탈출|이스케이프|escape/g, '')
    .replace(/[()[\]{}'"`.,!?/\\|·_\-+~:&]/g, '')
    .replace(/\s+/g, '')
}

function normalizeAddress(value) {
  return stripHtml(value)
    .toLowerCase()
    .replace(/서울특별시/g, '서울')
    .replace(/지하\s*/g, 'b')
    .replace(/층/g, 'f')
    .replace(/[()[\]{}'"`.,!?/\\|·_\-+~:&]/g, '')
    .replace(/\s+/g, '')
}

function compactPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('02') && digits.length === 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
  if (digits.startsWith('02') && digits.length === 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  return value || null
}

function host(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isUsefulWebsite(url) {
  const hostname = host(url)
  if (!hostname) return false
  return !hostname.includes('naver.com/maps') && !hostname.includes('map.naver.com')
}

function queryForCafe(cafe) {
  const parts = [cafe.name, cafe.branch_name, cafe.district || cafe.area_label, '방탈출']
    .filter(Boolean)
    .map(value => String(value).trim())
  return [...new Set(parts)].join(' ')
}

function candidateScore(cafe, candidate) {
  const title = normalize(candidate.title)
  const cafeName = normalize(cafe.name)
  const branch = normalize(cafe.branch_name)
  const area = normalize(cafe.area_label)
  const district = normalize(cafe.district)
  const address = normalizeAddress(cafe.address)
  const roadAddress = normalizeAddress(candidate.roadAddress)
  const oldAddress = normalizeAddress(candidate.address)
  const category = stripHtml(candidate.category)

  let score = 0
  const reasons = []

  if (category.includes('방탈출')) {
    score += 28
    reasons.push('category')
  }
  if (cafeName && (title.includes(cafeName) || cafeName.includes(title))) {
    score += 32
    reasons.push('name')
  }
  if (branch && title.includes(branch)) {
    score += 18
    reasons.push('branch')
  }
  if (district && (roadAddress.includes(district) || oldAddress.includes(district))) {
    score += 10
    reasons.push('district')
  }
  if (area && (roadAddress.includes(area) || oldAddress.includes(area) || title.includes(area))) {
    score += 6
    reasons.push('area')
  }
  if (address && (roadAddress.includes(address.slice(0, 12)) || oldAddress.includes(address.slice(0, 12)))) {
    score += 18
    reasons.push('address')
  }
  if (cafeName && !title.includes(cafeName) && !cafeName.includes(title)) {
    score -= 20
  }

  return { score, reasons }
}

async function searchNaverLocal(env, query) {
  const url = new URL(NAVER_LOCAL_URL)
  url.searchParams.set('query', query)
  url.searchParams.set('display', '5')
  url.searchParams.set('start', '1')
  url.searchParams.set('sort', 'random')

  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': env.NAVER_CLIENT_ID ?? env.NAVER_SEARCH_CLIENT_ID,
      'X-Naver-Client-Secret': env.NAVER_CLIENT_SECRET ?? env.NAVER_SEARCH_CLIENT_SECRET,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Naver Local API failed: ${response.status} ${text.slice(0, 200)}`)
  }

  const json = await response.json()
  return (json.items ?? []).map(item => ({
    title: stripHtml(item.title),
    link: item.link || null,
    category: stripHtml(item.category),
    telephone: compactPhone(item.telephone),
    address: stripHtml(item.address),
    roadAddress: stripHtml(item.roadAddress),
    mapx: item.mapx ?? null,
    mapy: item.mapy ?? null,
  }))
}

async function main() {
  const env = loadEnv()
  const limitArg = process.argv.find(arg => arg.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : null
  const dryRun = process.argv.includes('--dry-run')
  const apply = process.argv.includes('--apply')

  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) {
    throw new Error('NAVER_CLIENT_ID/NAVER_CLIENT_SECRET is missing')
  }
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_SERVICE_KEY) {
    throw new Error('VITE_SUPABASE_URL/VITE_SUPABASE_SERVICE_KEY is missing')
  }

  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_KEY)
  const { data, error } = await supabase
    .from('cafes')
    .select('id,normalized_key,name,branch_name,area_label,district,address,phone,website_url,booking_url,source_url,status,needs_review,naver_place_id,naver_place_url,naver_place_name,naver_place_address,naver_place_checked_at')
    .order('needs_review', { ascending: false })
    .order('id', { ascending: true })

  if (error) throw error

  const cafes = limit ? (data ?? []).slice(0, limit) : (data ?? [])
  const report = {
    generated_at: new Date().toISOString(),
    dry_run: dryRun || !apply,
    total_cafes: cafes.length,
    high_confidence: 0,
    updated: 0,
    skipped: 0,
    needs_manual_review: 0,
    rows: [],
  }

  for (const cafe of cafes) {
    const query = queryForCafe(cafe)
    const candidates = await searchNaverLocal(env, query)
    const ranked = candidates
      .map(candidate => ({ ...candidate, ...candidateScore(cafe, candidate) }))
      .sort((a, b) => b.score - a.score)
    const best = ranked[0] ?? null
    const second = ranked[1] ?? null
    const highConfidence = Boolean(best && best.score >= 62 && (!second || best.score - second.score >= 12))

    const row = {
      cafe_id: cafe.id,
      cafe_name: [cafe.name, cafe.branch_name].filter(Boolean).join(' '),
      query,
      current: {
        address: cafe.address,
        phone: cafe.phone,
        website_url: cafe.website_url,
        booking_url: cafe.booking_url,
        naver_place_id: cafe.naver_place_id,
        naver_place_url: cafe.naver_place_url,
        naver_place_name: cafe.naver_place_name,
        naver_place_address: cafe.naver_place_address,
      },
      high_confidence: highConfidence,
      best,
      candidates: ranked,
      applied: false,
      suggested_changes: {},
    }

    if (highConfidence) {
      report.high_confidence += 1
      const payload = {
        naver_place_name: best.title,
        naver_place_address: best.roadAddress || best.address || null,
        naver_place_checked_at: new Date().toISOString(),
      }

      if (!cafe.address && (best.roadAddress || best.address)) payload.address = best.roadAddress || best.address
      else if (cafe.address && best.roadAddress && normalizeAddress(cafe.address) !== normalizeAddress(best.roadAddress)) {
        row.suggested_changes.address = best.roadAddress
      }

      if (!cafe.phone && best.telephone) payload.phone = best.telephone
      else if (cafe.phone && best.telephone && compactPhone(cafe.phone) !== best.telephone) {
        row.suggested_changes.phone = best.telephone
      }

      if (!cafe.website_url && best.link && isUsefulWebsite(best.link)) payload.website_url = best.link
      else if (cafe.website_url && best.link && isUsefulWebsite(best.link) && host(cafe.website_url) !== host(best.link)) {
        row.suggested_changes.website_url = best.link
      }

      if (apply && Object.keys(payload).length > 0) {
        const { error: updateError } = await supabase.from('cafes').update(payload).eq('id', cafe.id)
        if (updateError) throw updateError
        row.applied = true
        report.updated += 1
      } else {
        report.skipped += 1
      }
    } else {
      report.needs_manual_review += 1
    }

    report.rows.push(row)
    await new Promise(resolve => setTimeout(resolve, 120))
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true })
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({
    report_path: REPORT_PATH,
    total_cafes: report.total_cafes,
    high_confidence: report.high_confidence,
    updated: report.updated,
    needs_manual_review: report.needs_manual_review,
    dry_run: report.dry_run,
  }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
