import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const TARGETS_PATH = resolve(ROOT, 'data/gangnam-theme-targets.txt')
const CANDIDATES_PATH = resolve(ROOT, 'data/theme-source-candidates.json')
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

function numberOrNull(value) {
  const match = value?.match(/\d+/)
  return match ? Number(match[0]) : null
}

function districtFromAddress(address, fallbackArea) {
  if (!address) return fallbackArea === '강남' ? '강남구' : fallbackArea
  const seoulMatch = address.match(/서울(?:특별시)?\s+([^\s]+)/)
  if (seoulMatch) return seoulMatch[1]
  const gyeonggiMatch = address.match(/경기도?\s+([^\s]+)\s+([^\s]+)/)
  if (gyeonggiMatch) return `${gyeonggiMatch[1]} ${gyeonggiMatch[2]}`
  const incheonMatch = address.match(/인천(?:광역시)?\s+([^\s]+)/)
  if (incheonMatch) return incheonMatch[1]
  return fallbackArea
}

function areaFromAddress(address, fallbackArea) {
  if (!address) return fallbackArea
  if (address.includes('강남') || address.includes('서초')) return '강남'
  if (address.includes('마포')) return '홍대'
  if (address.includes('광진')) return '건대'
  if (address.includes('수원')) return '수원'
  if (address.includes('부평')) return '부평'
  return fallbackArea
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

function parseZamfitDetail(html, sourceUrl, target) {
  const title = decodeHtml(html.match(/<title>(.*?)<\/title>/)?.[1] ?? '')
  const [titleLeft, titleRight = ''] = title.replace(/\s+-\s+잼핏$/, '').split(' | ')
  const name = titleLeft || target
  const cafeName = titleRight || null
  const description = decodeHtml(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '')
  const imageUrl = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1] ?? null
  const genre = description.match(/장르\s*:\s*([^.]*)/)?.[1]?.trim()
  const players = description.match(/추천인원\s*:\s*([^.]*)/)?.[1]?.trim()
  const difficulty = description.match(/난이도\s*:\s*([^.]*)/)?.[1]?.trim()
  const activity = description.match(/활동성\s*:\s*([^.]*)/)?.[1]?.trim()
  const duration = description.match(/이용시간\s*:\s*([^.]*)/)?.[1]?.trim()
  const minMax = players?.match(/(\d+)\s*-\s*(\d+)/)
  const address = decodeHtml(html.match(/\\"address\\":\\"([^\\"]*)/)?.[1] ?? '')
  const phone = decodeHtml(html.match(/\\"tel\\":\\"([^\\"]*)/)?.[1] ?? '')
  const homepageUrl = decodeHtml(html.match(/\\"homepageUrl\\":\\"([^\\"]*)/)?.[1] ?? '')
  const fallbackArea = title.includes('강남') ? '강남' : '전국'
  const areaLabel = areaFromAddress(address, fallbackArea)

  return {
    cafe: {
      raw_name: cafeName,
      address: address || null,
      phone: phone || null,
      website_url: homepageUrl || null,
      booking_url: homepageUrl || sourceUrl,
      area_label: areaLabel,
      district: districtFromAddress(address, areaLabel),
    },
    theme: {
      name: target,
      crawled_name: name,
      genre_labels: genre && genre !== '?' ? [genre] : [],
      duration_minutes: numberOrNull(duration ?? ''),
      min_players: minMax ? Number(minMax[1]) : null,
      max_players: minMax ? Number(minMax[2]) : null,
      price_text: null,
      price_per_person: null,
      image_url: imageUrl,
      booking_url: homepageUrl || sourceUrl,
      source_url: sourceUrl,
      difficulty_label: difficulty && difficulty !== '?' ? difficulty : null,
      fear_label: null,
      activity_label: activity && activity !== '?' ? activity : null,
    },
  }
}

function splitCafeName(cafeName) {
  const branchMatch = cafeName.match(/(.+?)\s+([^ ]*점)$/)
  if (!branchMatch) return { name: cafeName, branch_name: null }
  return { name: branchMatch[1], branch_name: branchMatch[2] }
}

function ensureCafe(cafesByKey, cafeInput) {
  const cafeParts = splitCafeName(cafeInput.raw_name ?? cafeInput.name)
  const cafeKey = normalizeKey(`${cafeInput.raw_name ?? cafeInput.name}|${cafeInput.area_label}`)

  if (!cafesByKey.has(cafeKey)) {
    cafesByKey.set(cafeKey, {
      normalized_key: cafeKey,
      name: cafeInput.name ?? cafeParts.name,
      branch_name: cafeInput.branch_name ?? cafeParts.branch_name,
      area_label: cafeInput.area_label,
      district: cafeInput.district,
      address: cafeInput.address ?? null,
      phone: cafeInput.phone ?? null,
      website_url: cafeInput.website_url ?? null,
      booking_url: cafeInput.booking_url ?? null,
      source_url: cafeInput.source_url,
      status: 'active',
      needs_review: true,
      themes: [],
    })
  }

  return cafesByKey.get(cafeKey)
}

function addTheme(cafesByKey, cafeInput, themeInput, sourceName) {
  const cafe = ensureCafe(cafesByKey, cafeInput)
  const alreadyExists = cafe.themes.some(theme => theme.normalized_key === normalizeKey(themeInput.name))
  if (alreadyExists) return false

  cafe.themes.push({
    normalized_key: normalizeKey(themeInput.name),
    name: themeInput.name,
    genre_labels: themeInput.genre_labels ?? [],
    duration_minutes: themeInput.duration_minutes ?? null,
    min_players: themeInput.min_players ?? null,
    max_players: themeInput.max_players ?? null,
    price_text: themeInput.price_text ?? null,
    price_per_person: themeInput.price_per_person ?? null,
    image_url: themeInput.image_url ?? null,
    booking_url: themeInput.booking_url ?? cafeInput.booking_url ?? null,
    source_url: themeInput.source_url,
    status: 'active',
    difficulty_label: themeInput.difficulty_label ?? null,
    fear_label: themeInput.fear_label ?? null,
    needs_review: true,
    source_name: sourceName,
  })

  return true
}

async function main() {
  const targets = (await readFile(TARGETS_PATH, 'utf8'))
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
  const candidates = JSON.parse(await readFile(CANDIDATES_PATH, 'utf8'))

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
    addTheme(cafesByKey, {
      raw_name: card.cafe_name,
      area_label: card.area_label,
      district: districtFromAddress(detail.address, card.area_label),
      address: detail.address,
      website_url: null,
      booking_url: card.booking_url,
      source_url: card.detail_url,
    }, {
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
      difficulty_label: detail.difficulty_label,
      fear_label: detail.fear_label,
    }, 'ㅂㅌㅊ 전체 테마')
    matched.push({ target, crawled_name: card.name, cafe: card.cafe_name, source_url: card.detail_url })
  }

  const remainingTargets = new Set(unmatched)

  for (const candidate of candidates.zamfit ?? []) {
    if (!remainingTargets.has(candidate.target)) continue
    const candidateHtml = await fetch(candidate.url).then(response => {
      if (!response.ok) throw new Error(`Failed to fetch ${candidate.url}: ${response.status}`)
      return response.text()
    })
    const parsed = parseZamfitDetail(candidateHtml, candidate.url, candidate.target)

    if (!parsed.cafe.raw_name) continue

    const added = addTheme(cafesByKey, {
      ...parsed.cafe,
      source_url: candidate.url,
    }, parsed.theme, '잼핏 테마 상세')

    if (added) {
      remainingTargets.delete(candidate.target)
      matched.push({
        target: candidate.target,
        crawled_name: parsed.theme.crawled_name,
        cafe: parsed.cafe.raw_name,
        source_url: candidate.url,
      })
    }
  }

  for (const source of candidates.manual ?? []) {
    for (const theme of source.themes ?? []) {
      if (!remainingTargets.has(theme.target)) continue
      const added = addTheme(cafesByKey, {
        ...source.cafe,
        source_url: source.source_url,
      }, {
        ...theme,
        name: theme.target,
        source_url: source.source_url,
        booking_url: source.cafe.booking_url,
      }, source.source_name)

      if (added) {
        remainingTargets.delete(theme.target)
        matched.push({
          target: theme.target,
          crawled_name: theme.name,
          cafe: `${source.cafe.name}${source.cafe.branch_name ? ` ${source.cafe.branch_name}` : ''}`,
          source_url: source.source_url,
        })
      }
    }
  }

  unmatched.splice(0, unmatched.length, ...remainingTargets)

  const seed = {
    region: {
      city: '서울특별시',
      district: '강남구',
      area_label: '강남',
    },
    source_note: 'Merged from public listing, Zamfit detail pages, and explicitly reviewed source candidates. Rows remain needs_review=true until official cafe/theme pages are verified.',
    source_urls: [
      SOURCE_URL,
      ...((candidates.zamfit ?? []).map(candidate => candidate.url)),
      ...((candidates.manual ?? []).map(source => source.source_url)),
    ],
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
