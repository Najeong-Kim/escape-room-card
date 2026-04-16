import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const SOURCE_URL = 'https://escape-cafe.too1s.com/theme/all'
const ZAMFIT_SITEMAP_URL = 'https://web.zamfit.co.kr/sitemap.xml'
const SEED_PATH = resolve(ROOT, 'data/seoul-themes.seed.json')
const REPORT_PATH = resolve(ROOT, 'data/seoul-themes-crawl-report.json')
const USER_AGENT = 'Mozilla/5.0 (compatible; EscapeRoomCardBot/1.0)'

function parseArgs(argv) {
  const options = {
    limit: null,
    delayMs: 120,
    includeZamfit: true,
    zamfitLimit: null,
    zamfitDelayMs: 180,
  }

  for (const arg of argv) {
    const [key, value] = arg.split('=')
    if (key === '--limit' && value) options.limit = Number(value)
    if (key === '--delay-ms' && value) options.delayMs = Number(value)
    if (key === '--include-zamfit' && value) options.includeZamfit = value !== 'false'
    if (key === '--zamfit-limit' && value) options.zamfitLimit = Number(value)
    if (key === '--zamfit-delay-ms' && value) options.zamfitDelayMs = Number(value)
  }

  return options
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function decodeHtml(value = '') {
  return String(value ?? '')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('<!-- -->', '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeKey(value = '') {
  return decodeHtml(value)
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
  const match = String(value ?? '').match(/\d+/)
  return match ? Number(match[0]) : null
}

function clampScore10(value) {
  if (!Number.isFinite(value)) return null
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10))
}

function score10OrNull(value) {
  const text = String(value ?? '')
  const encodedScore = text.match(/score%22%3A([0-9.]+)/)?.[1]
  if (encodedScore) return clampScore10(Number(encodedScore))

  const fraction = text.match(/([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)/)
  if (fraction) {
    const score = Number(fraction[1])
    const max = Number(fraction[2])
    if (Number.isFinite(score) && Number.isFinite(max) && max > 0) {
      return clampScore10((score / max) * 10)
    }
  }

  const number = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0]
  return number ? clampScore10(Number(number)) : null
}

function difficultyScore10OrNull(value) {
  const text = String(value ?? '')
  const fraction = text.match(/([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)/)
  if (fraction) {
    const score = Number(fraction[1])
    const max = Number(fraction[2])
    if (Number.isFinite(score) && Number.isFinite(max) && max > 0) {
      if (max === 10 && score <= 5) return clampScore10(score * 2)
      return clampScore10((score / max) * 10)
    }
  }

  const score = score10OrNull(text)
  if (score === null) return null
  if (text.match(/score%22%3A/)) return score
  return score > 5 ? score : clampScore10(score * 2)
}

function splitCafeName(cafeName) {
  const normalized = decodeHtml(cafeName)
  const branchMatch = normalized.match(/(.+?)\s+([^ ]*점)$/)
  if (!branchMatch) return { name: normalized, branch_name: null }
  return { name: branchMatch[1], branch_name: branchMatch[2] }
}

function districtFromAddress(address, fallbackArea = '서울') {
  const match = String(address ?? '').match(/서울(?:특별시)?\s+([^\s]+)/)
  return match?.[1] ?? fallbackArea
}

function areaFromAddress(address, fallbackArea = '기타') {
  const text = String(address ?? '')
  if (/강남|서초|신논현|논현|역삼|선릉|교대/.test(text)) return '강남'
  if (/홍대|마포|합정|상수|연남|망원/.test(text)) return '홍대'
  if (/건대|광진|구의|자양/.test(text)) return '건대'
  if (/신촌|이대|서대문/.test(text)) return '신촌'
  if (/성수|왕십리|성동/.test(text)) return '성수'
  if (/잠실|송파|석촌|방이/.test(text)) return '잠실'
  if (/신림|관악/.test(text)) return '신림'
  if (/노원|상계/.test(text)) return '노원'
  if (/용산|이태원|숙대/.test(text)) return '용산'
  if (/대학로|혜화|종로/.test(text)) return '대학로'
  return fallbackArea
}

function genreCodesForLabels(labels = []) {
  const codes = new Set()

  for (const label of labels) {
    const normalized = label.toLowerCase()
    if (label.includes('공포') || normalized.includes('horror')) codes.add('Horror')
    if (label.includes('스릴러') || label.includes('미스터리') || label.includes('추리')) codes.add('MysteryThriller')
    if (label.includes('감성') || label.includes('드라마')) codes.add('Emotional')
    if (label.includes('코믹') || label.includes('개그')) codes.add('Comic')
    if (label.includes('판타지') || label.includes('모험') || label.includes('어드벤처')) codes.add('FantasyAdventure')
    if (label.includes('범죄') || label.includes('살인') || label.includes('잠입')) codes.add('Crime')
    if (normalized.includes('sf') || label.includes('SF')) codes.add('SF')
  }

  return [...codes]
}

function parseCards(html) {
  const cards = []
  const cardPattern = /<a class="flex flex-col[\s\S]*?href="([^"]*\/theme\/detail\/[^"]+)"[\s\S]*?<img[\s\S]*?src="([^"]+)"[\s\S]*?<span class="text-md[\s\S]*?>([\s\S]*?)<\/span>[\s\S]*?<span class="text-xs[\s\S]*?>([\s\S]*?)<\/span>[\s\S]*?<a target="_blank" href="([^"]+)"/g

  for (const match of html.matchAll(cardPattern)) {
    const [area, cafeName] = decodeHtml(match[4]).split('/').map(part => part.trim())
    cards.push({
      name: decodeHtml(match[3]),
      listed_area_label: area,
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
  const description = decodeHtml(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '')
  const genreLabel = scores['장르'] ?? description.match(/장르\s*[:|-]\s*([^.,\n]+)/)?.[1]?.trim() ?? null
  const duration = scores['시간'] ?? scores['플레이시간'] ?? description.match(/(\d+)\s*분/)?.[1] ?? null
  const players = scores['인원'] ?? description.match(/(\d+)\s*(?:인|명)\s*[~-]\s*(\d+)\s*(?:인|명)?/)?.[0] ?? null
  const playerRange = String(players ?? '').match(/(\d+)\s*(?:인|명)?\s*[~-]\s*(\d+)\s*(?:인|명)?/)

  return {
    image_url: metaImage,
    address: cafeMatch ? decodeHtml(cafeMatch[2]) : null,
    genre_labels: genreLabel ? [genreLabel] : [],
    duration_minutes: numberOrNull(duration),
    min_players: playerRange ? Number(playerRange[1]) : null,
    max_players: playerRange ? Number(playerRange[2]) : null,
    difficulty_label: scores['난이도'] ?? null,
    fear_label: scores['공포도'] ?? null,
    difficulty_score: difficultyScore10OrNull(scores['난이도']),
    fear_score: score10OrNull(scores['공포도']),
  }
}

function parseZamfitDetail(html, sourceUrl) {
  const title = decodeHtml(html.match(/<title>(.*?)<\/title>/)?.[1] ?? '')
  const [titleLeft, titleRight = ''] = title.replace(/\s+-\s+잼핏$/, '').split(' | ')
  const name = titleLeft.trim()
  const cafeName = titleRight.trim()
  const description = decodeHtml(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '')
  const imageUrl = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1] ?? null
  const genre = description.match(/장르\s*:\s*([^.]*)/)?.[1]?.trim()
  const fallbackGenre = decodeHtml(html.match(/장르:\s*([^<\\"]+)/)?.[1] ?? '').trim()
  const players = description.match(/추천인원\s*:\s*([^.]*)/)?.[1]?.trim()
  const difficulty = description.match(/난이도\s*:\s*([^.]*)/)?.[1]?.trim()
  const activity = description.match(/활동성\s*:\s*([^.]*)/)?.[1]?.trim()
  const duration = description.match(/이용시간\s*:\s*([^.]*)/)?.[1]?.trim()
  const minMax = players?.match(/(\d+)\s*-\s*(\d+)/)
  const minPeopleFromJson = html.match(/\\"recommendMinPeopleCount\\":(\d+)/)?.[1]
  const maxPeopleFromJson = html.match(/\\"recommendMaxPeopleCount\\":(\d+)/)?.[1]
  const priceMatches = [...html.matchAll(/\\"peopleCount\\":(\d+),\\"price\\":(\d+)/g)]
  const prices = priceMatches
    .map(match => ({
      peopleCount: Number(match[1]),
      totalPrice: Number(match[2]),
      pricePerPerson: Math.round(Number(match[2]) / Number(match[1])),
    }))
    .filter(price => Number.isFinite(price.peopleCount) && Number.isFinite(price.totalPrice))
    .sort((a, b) => a.peopleCount - b.peopleCount)
  const address = decodeHtml(html.match(/\\"address\\":\\"([^\\"]*)/)?.[1] ?? '')
  const phone = decodeHtml(html.match(/\\"tel\\":\\"([^\\"]*)/)?.[1] ?? '')
  const homepageUrl = decodeHtml(html.match(/\\"homepageUrl\\":\\"([^\\"]*)/)?.[1] ?? '')
  const pricePerPerson = prices.find(price => price.peopleCount === 2)?.pricePerPerson ?? prices[0]?.pricePerPerson ?? null
  const maxPlayersFromPrices = prices.length ? Math.max(...prices.map(price => price.peopleCount)) : null

  if (!name || !cafeName) return null

  return {
    card: {
      name,
      listed_area_label: areaFromAddress(address, '기타'),
      cafe_name: cafeName,
      detail_url: sourceUrl,
      image_url: imageUrl,
      booking_url: homepageUrl || sourceUrl,
    },
    detail: {
      image_url: imageUrl,
      address: address || null,
      phone: phone || null,
      website_url: homepageUrl || null,
      genre_labels: genre && genre !== '?' ? [genre] : fallbackGenre ? [fallbackGenre] : [],
      duration_minutes: numberOrNull(duration ?? ''),
      min_players: minMax ? Number(minMax[1]) : numberOrNull(minPeopleFromJson ?? ''),
      max_players: Math.max(
        minMax ? Number(minMax[2]) : numberOrNull(maxPeopleFromJson ?? '') ?? 0,
        maxPlayersFromPrices ?? 0,
      ) || null,
      price_text: prices.length
        ? prices.map(price => `${price.peopleCount}인 ${price.pricePerPerson.toLocaleString()}원/인`).join(' / ')
        : null,
      price_per_person: pricePerPerson,
      difficulty_label: difficulty && difficulty !== '?' ? difficulty : null,
      fear_label: null,
      difficulty_score: difficultyScore10OrNull(difficulty),
      fear_score: null,
      activity_label: activity && activity !== '?' ? activity : null,
      activity_score: score10OrNull(activity),
    },
  }
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
  return response.text()
}

function ensureCafe(cafesByKey, card, detail) {
  const cafeParts = splitCafeName(card.cafe_name)
  const areaLabel = areaFromAddress(detail.address, card.listed_area_label)
  const cafeKey = normalizeKey(`${cafeParts.name}${cafeParts.branch_name ? ` ${cafeParts.branch_name}` : ''}|${areaLabel}`)

  if (!cafesByKey.has(cafeKey)) {
    cafesByKey.set(cafeKey, {
      normalized_key: cafeKey,
      name: cafeParts.name,
      branch_name: cafeParts.branch_name,
      area_label: areaLabel,
      district: districtFromAddress(detail.address, areaLabel),
      address: detail.address,
      phone: detail.phone ?? null,
      website_url: detail.website_url ?? null,
      booking_url: card.booking_url,
      source_url: card.detail_url,
      status: 'active',
      needs_review: true,
      themes: [],
    })
  }

  return cafesByKey.get(cafeKey)
}

function addTheme(cafesByKey, card, detail, sourceName = 'ㅂㅌㅊ 전체 테마') {
  const cafe = ensureCafe(cafesByKey, card, detail)
  const themeKey = normalizeKey(card.name)
  if (cafe.themes.some(theme => theme.normalized_key === themeKey)) return false

  cafe.themes.push({
    normalized_key: themeKey,
    name: card.name,
    genre_labels: detail.genre_labels,
    genre_codes: genreCodesForLabels(detail.genre_labels),
    duration_minutes: detail.duration_minutes,
    min_players: detail.min_players,
    max_players: detail.max_players,
    price_text: detail.price_text ?? null,
    price_per_person: detail.price_per_person ?? null,
    image_url: detail.image_url ?? card.image_url,
    booking_url: card.booking_url,
    source_url: card.detail_url,
    status: 'active',
    difficulty_label: detail.difficulty_label,
    fear_label: detail.fear_label,
    difficulty_score: detail.difficulty_score,
    fear_score: detail.fear_score,
    activity_label: detail.activity_label ?? null,
    activity_score: detail.activity_score ?? null,
    needs_review: true,
    source_name: sourceName,
  })

  return true
}

async function crawlToo1s(cafesByKey, options) {
  const html = await fetchText(SOURCE_URL)
  const cards = parseCards(html)
  const skipped = []
  const matched = []
  const failed = []
  const targetCards = options.limit ? cards.slice(0, options.limit) : cards

  for (const card of targetCards) {
    try {
      const detailHtml = await fetchText(card.detail_url)
      const detail = parseDetail(detailHtml)
      const isSeoul = /서울|서울특별시/.test(detail.address ?? '')

      if (!isSeoul) {
        skipped.push({ theme: card.name, cafe: card.cafe_name, reason: 'not_seoul', address: detail.address })
        continue
      }

      const added = addTheme(cafesByKey, card, detail, 'ㅂㅌㅊ 전체 테마')
      if (added) {
        matched.push({
          theme: card.name,
          cafe: card.cafe_name,
          area_label: areaFromAddress(detail.address, card.listed_area_label),
          address: detail.address,
          source_url: card.detail_url,
        })
      }
    } catch (error) {
      failed.push({
        theme: card.name,
        cafe: card.cafe_name,
        source_url: card.detail_url,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    await sleep(options.delayMs)
  }

  return {
    source_card_count: cards.length,
    processed_count: targetCards.length,
    matched,
    skipped,
    failed,
  }
}

async function crawlZamfit(cafesByKey, options) {
  if (!options.includeZamfit) {
    return {
      source_card_count: 0,
      processed_count: 0,
      matched: [],
      skipped: [],
      failed: [],
    }
  }

  const sitemap = await fetchText(ZAMFIT_SITEMAP_URL)
  const urls = [...sitemap.matchAll(/<loc>([^<]*\/escapes\/[^<]+)<\/loc>/g)].map(match => match[1])
  const targetUrls = options.zamfitLimit ? urls.slice(0, options.zamfitLimit) : urls
  const matched = []
  const skipped = []
  const failed = []

  for (let index = 0; index < targetUrls.length; index += 1) {
    const url = targetUrls[index]
    try {
      const html = await fetchText(url)
      const parsed = parseZamfitDetail(html, url)
      if (!parsed) {
        skipped.push({ source_url: url, reason: 'parse_failed' })
        continue
      }

      const isSeoul = /서울|서울특별시/.test(parsed.detail.address ?? '')
      if (!isSeoul) {
        skipped.push({ theme: parsed.card.name, cafe: parsed.card.cafe_name, reason: 'not_seoul', address: parsed.detail.address })
        continue
      }

      const added = addTheme(cafesByKey, parsed.card, parsed.detail, '잼핏 테마 상세')
      if (added) {
        matched.push({
          theme: parsed.card.name,
          cafe: parsed.card.cafe_name,
          area_label: areaFromAddress(parsed.detail.address, parsed.card.listed_area_label),
          address: parsed.detail.address,
          source_url: parsed.card.detail_url,
        })
      }
    } catch (error) {
      failed.push({
        source_url: url,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    if ((index + 1) % 100 === 0) {
      console.log(`Zamfit progress ${index + 1}/${targetUrls.length}: ${matched.length} Seoul themes`)
    }
    await sleep(options.zamfitDelayMs)
  }

  return {
    source_card_count: urls.length,
    processed_count: targetUrls.length,
    matched,
    skipped,
    failed,
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const cafesByKey = new Map()
  const too1s = await crawlToo1s(cafesByKey, options)
  console.log(`Crawled ${too1s.matched.length} Seoul themes from ㅂㅌㅊ.`)
  const zamfit = await crawlZamfit(cafesByKey, options)

  const seed = {
    region: {
      city: '서울특별시',
      district: null,
      area_label: '서울',
    },
    source_note: 'Crawled from ㅂㅌㅊ public theme index and Zamfit theme pages, then filtered by Seoul address. Rows are inserted as needs_review=true before public exposure.',
    source_urls: [SOURCE_URL, ZAMFIT_SITEMAP_URL],
    crawled_at: new Date().toISOString(),
    cafes: [...cafesByKey.values()],
  }

  const report = {
    crawled_at: seed.crawled_at,
    sources: {
      too1s,
      zamfit,
    },
    cafe_count: seed.cafes.length,
    theme_count: seed.cafes.reduce((count, cafe) => count + cafe.themes.length, 0),
    skipped_count: too1s.skipped.length + zamfit.skipped.length,
    failed_count: too1s.failed.length + zamfit.failed.length,
  }

  await mkdir(dirname(SEED_PATH), { recursive: true })
  await writeFile(SEED_PATH, `${JSON.stringify(seed, null, 2)}\n`)
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`)

  console.log(`Crawled ${report.theme_count} Seoul themes in ${seed.cafes.length} cafes.`)
  if (report.failed_count) console.log(`Failed ${report.failed_count} pages. See ${REPORT_PATH}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
