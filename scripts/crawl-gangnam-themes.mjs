import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const TARGETS_PATH = resolve(ROOT, 'data/gangnam-theme-targets.txt')
const SEED_PATH = resolve(ROOT, 'data/gangnam-gu-themes.seed.json')
const REPORT_PATH = resolve(ROOT, 'data/gangnam-theme-crawl-report.json')
const SOURCE_URL = 'https://escape-cafe.too1s.com/theme/all'

const NAME_ALIASES = new Map([
  ['US', 'US 어스'],
])

function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('<!-- -->', '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function normalizeKey(value) {
  return value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[()[\]{}:]/g, '')
    .trim()
}

function nextImageUrl(src) {
  const match = src.match(/url=([^&]+)/)
  return match ? decodeURIComponent(match[1]) : src
}

function parseCards(html) {
  const cards = []
  const cardPattern = /<a class="flex flex-col[\s\S]*?href="([^"]*\/theme\/detail\/[^"]+)"[\s\S]*?<img[\s\S]*?src="([^"]+)"[\s\S]*?<span class="text-md[\s\S]*?>([\s\S]*?)<\/span>[\s\S]*?<span class="text-xs[\s\S]*?>([\s\S]*?)<\/span>[\s\S]*?<a target="_blank" href="([^"]+)"/g

  for (const match of html.matchAll(cardPattern)) {
    const [area, cafeName] = decodeHtml(match[4]).split('/').map(part => part.trim())
    cards.push({
      name: decodeHtml(match[3]),
      area_label: area,
      cafe_name: cafeName,
      detail_url: decodeHtml(match[1]),
      image_url: nextImageUrl(match[2]),
      booking_url: decodeHtml(match[5]),
    })
  }

  return cards
}

function parseDetail(html) {
  const metaImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? null
  const scoreMatches = [...html.matchAll(/<p class="text-\[18px\][^"]*">([^<]+)<\/p><p class="text-\[15px\][^"]*">([\s\S]*?)<\/p>/g)]
  const scores = Object.fromEntries(
    scoreMatches.map(match => [decodeHtml(match[1]), decodeHtml(match[2])]),
  )
  const cafeMatch = html.match(/<p class="text-\[17px\][\s\S]*?>([\s\S]*?)<\/p><p class="text-\[15px\][\s\S]*?>([\s\S]*?)<\/p>/)

  return {
    image_url: metaImage,
    difficulty_label: scores['난이도'] ?? null,
    fear_label: scores['공포도'] ?? null,
    address: cafeMatch ? decodeHtml(cafeMatch[2]) : null,
  }
}

function splitCafeName(cafeName) {
  const branchMatch = cafeName.match(/(.+?)\s+([^ ]*점)$/)
  if (!branchMatch) return { name: cafeName, branch_name: null }
  return { name: branchMatch[1], branch_name: branchMatch[2] }
}

async function main() {
  const targets = (await readFile(TARGETS_PATH, 'utf8'))
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  const html = await fetch(SOURCE_URL).then(response => {
    if (!response.ok) throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status}`)
    return response.text()
  })

  const cards = parseCards(html)
  const cardsByName = new Map(cards.map(card => [normalizeKey(card.name), card]))
  const cafesByKey = new Map()
  const unmatched = []
  const matched = []

  for (const target of targets) {
    const lookupName = NAME_ALIASES.get(target) ?? target
    const card = cardsByName.get(normalizeKey(lookupName))

    if (!card) {
      unmatched.push(target)
      continue
    }

    const detailHtml = await fetch(card.detail_url).then(response => {
      if (!response.ok) throw new Error(`Failed to fetch ${card.detail_url}: ${response.status}`)
      return response.text()
    })
    const detail = parseDetail(detailHtml)
    const cafeParts = splitCafeName(card.cafe_name)
    const cafeKey = normalizeKey(`${card.cafe_name}|${card.area_label}`)

    if (!cafesByKey.has(cafeKey)) {
      cafesByKey.set(cafeKey, {
        normalized_key: cafeKey,
        name: cafeParts.name,
        branch_name: cafeParts.branch_name,
        area_label: card.area_label,
        district: '강남구',
        address: detail.address,
        website_url: null,
        booking_url: card.booking_url,
        source_url: card.detail_url,
        status: 'active',
        needs_review: true,
        themes: [],
      })
    }

    cafesByKey.get(cafeKey).themes.push({
      normalized_key: normalizeKey(target),
      name: target,
      genre_labels: [],
      duration_minutes: null,
      min_players: null,
      max_players: null,
      price_text: null,
      price_per_person: null,
      image_url: detail.image_url ?? card.image_url,
      booking_url: card.booking_url,
      source_url: card.detail_url,
      status: 'active',
      difficulty_label: detail.difficulty_label,
      fear_label: detail.fear_label,
      needs_review: true,
      source_name: 'ㅂㅌㅊ 전체 테마',
    })
    matched.push({ target, crawled_name: card.name, cafe: card.cafe_name, source_url: card.detail_url })
  }

  const seed = {
    region: {
      city: '서울특별시',
      district: '강남구',
      area_label: '강남',
    },
    source_note: 'Crawled from ㅂㅌㅊ public theme listing. Rows remain needs_review=true until official cafe/theme pages are verified.',
    source_url: SOURCE_URL,
    crawled_at: new Date().toISOString(),
    cafes: [...cafesByKey.values()],
  }

  const report = {
    source_url: SOURCE_URL,
    crawled_at: seed.crawled_at,
    target_count: targets.length,
    matched_count: matched.length,
    unmatched_count: unmatched.length,
    matched,
    unmatched,
  }

  await mkdir(dirname(SEED_PATH), { recursive: true })
  await writeFile(SEED_PATH, `${JSON.stringify(seed, null, 2)}\n`)
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`)

  console.log(`Matched ${matched.length}/${targets.length} targets.`)
  if (unmatched.length) console.log(`Unmatched: ${unmatched.join(', ')}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
