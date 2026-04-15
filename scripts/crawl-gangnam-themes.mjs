import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHmac } from 'node:crypto'
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

function compactText(value) {
  return decodeHtml(String(value ?? ''))
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function base64Url(value) {
  return Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url')
}

function createPlayTheWorldJwt(key, token) {
  const header = base64Url({ alg: 'HS256', typ: 'JWT' })
  const payload = base64Url({
    'X-Auth-Token': token,
    expired_at: Math.floor(Date.now() / 1000) + 3600,
  })
  const signature = createHmac('sha256', key).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
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
  const fallbackGenre = decodeHtml(html.match(/장르:\s*([^<\\"]+)/)?.[1] ?? '').trim()
  const players = description.match(/추천인원\s*:\s*([^.]*)/)?.[1]?.trim()
  const difficulty = description.match(/난이도\s*:\s*([^.]*)/)?.[1]?.trim()
  const activity = description.match(/활동성\s*:\s*([^.]*)/)?.[1]?.trim()
  const duration = description.match(/이용시간\s*:\s*([^.]*)/)?.[1]?.trim()
  const minMax = players?.match(/(\d+)\s*-\s*(\d+)/)
  const minPeopleFromJson = html.match(/\\"recommendMinPeopleCount\\":(\d+)/)?.[1]
  const maxPeopleFromJson = html.match(/\\"recommendMaxPeopleCount\\":(\d+)/)?.[1]
  const priceMatches = [...html.matchAll(/\\"peopleCount\\":(\d+),\\"price\\":(\d+)/g)]
  const prices = priceMatches.map(match => ({
    peopleCount: Number(match[1]),
    totalPrice: Number(match[2]),
    pricePerPerson: Math.round(Number(match[2]) / Number(match[1])),
  }))
  const pricePerPerson = prices.length
    ? Math.min(...prices.map(price => price.pricePerPerson))
    : null
  const priceText = prices.length
    ? prices.map(price => `${price.peopleCount}인 ${price.pricePerPerson.toLocaleString()}원/인`).join(' / ')
    : null
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
      genre_labels: genre && genre !== '?' ? [genre] : fallbackGenre ? [fallbackGenre] : [],
      duration_minutes: numberOrNull(duration ?? ''),
      min_players: minMax ? Number(minMax[1]) : numberOrNull(minPeopleFromJson ?? ''),
      max_players: minMax ? Number(minMax[2]) : numberOrNull(maxPeopleFromJson ?? ''),
      price_text: priceText,
      price_per_person: pricePerPerson,
      image_url: imageUrl,
      booking_url: homepageUrl || sourceUrl,
      source_url: sourceUrl,
      difficulty_label: difficulty && difficulty !== '?' ? difficulty : null,
      difficulty_score: score10OrNull(difficulty),
      fear_label: null,
      fear_score: null,
      activity_label: activity && activity !== '?' ? activity : null,
      activity_score: score10OrNull(activity),
    },
  }
}

function parsePrices(variables = []) {
  const prices = variables
    .filter(variable => variable.key === 'price')
    .map(variable => ({
      peopleCount: Number(variable.value1),
      totalPrice: Number(variable.value2),
    }))
    .filter(price => Number.isFinite(price.peopleCount) && Number.isFinite(price.totalPrice) && price.peopleCount > 0 && price.totalPrice > 0)
    .map(price => ({
      ...price,
      pricePerPerson: Math.round(price.totalPrice / price.peopleCount),
    }))
    .sort((a, b) => a.peopleCount - b.peopleCount)

  return {
    price_text: prices.length
      ? prices.map(price => `${price.peopleCount}인 ${price.pricePerPerson.toLocaleString()}원/인`).join(' / ')
      : null,
    price_per_person: prices.length
      ? Math.min(...prices.map(price => price.pricePerPerson))
      : null,
  }
}

function parseThemeDescription(description) {
  const text = compactText(description)
  const genre = text.match(/장르\s*[-:]\s*([^\n\r]+)/)?.[1]?.trim()
  const duration = text.match(/(?:플레이\s*)?시간\s*[-:]\s*(\d+)\s*분/)?.[1]
    ?? text.match(/\[\s*(\d+)\s*분\s*\]/)?.[1]
  const players = text.match(/(?:추천|예약\s*가능|예약가능)\s*인원\s*[-:]\s*(\d+)\s*(?:인|명)?\s*[~-]\s*(\d+)\s*(?:인|명)?/)
    ?? text.match(/(\d+)\s*(?:인|명)\s*[~-]\s*(\d+)\s*(?:인|명)?/)
  const minOnlyPlayers = text.match(/(\d+)\s*인부터/)
  const singlePrice = text.match(/1\s*인\s*([0-9,]+)\s*원?/)
  const singlePriceValue = singlePrice ? Number(singlePrice[1].replace(/,/g, '')) : null

  return {
    genre_labels: genre && genre !== '?' ? [genre] : [],
    duration_minutes: duration ? Number(duration) : null,
    min_players: players ? Number(players[1]) : minOnlyPlayers ? Number(minOnlyPlayers[1]) : null,
    max_players: players ? Number(players[2]) : null,
    price_text: singlePriceValue ? `1인 ${singlePriceValue.toLocaleString()}원` : null,
    price_per_person: singlePriceValue,
  }
}

function parsePlayTheWorldTheme(theme, sourceUrl, target) {
  const description = `${theme.description ?? ''}\n${theme.summary ?? ''}`
  const parsedDescription = parseThemeDescription(description)
  const parsedPrices = parsePrices(theme.variables ?? [])

  return {
    name: target,
    crawled_name: theme.title,
    genre_labels: parsedDescription.genre_labels,
    duration_minutes: parsedDescription.duration_minutes,
    min_players: parsedDescription.min_players,
    max_players: parsedDescription.max_players,
    price_text: parsedPrices.price_text ?? parsedDescription.price_text,
    price_per_person: parsedPrices.price_per_person ?? parsedDescription.price_per_person,
    image_url: theme.image_url ?? null,
    booking_url: theme.booking_url ?? sourceUrl,
    source_url: sourceUrl,
    difficulty_label: description.match(/난이도\s*[-:]\s*([^\n\r]+)/)?.[1]?.trim() ?? null,
    difficulty_score: score10OrNull(description.match(/난이도\s*[-:]\s*([^\n\r]+)/)?.[1]),
    fear_label: null,
    fear_score: null,
  }
}

function parseKeyescapeTheme(theme, sourceUrl, target) {
  const parsedMemo = parseThemeDescription(theme.memo ?? '')

  return {
    name: target,
    crawled_name: theme.name,
    genre_labels: theme.genre ? [theme.genre] : parsedMemo.genre_labels,
    duration_minutes: numberOrNull(String(theme.play_time ?? '')) ?? parsedMemo.duration_minutes,
    min_players: parsedMemo.min_players,
    max_players: parsedMemo.max_players,
    price_text: parsedMemo.price_text,
    price_per_person: parsedMemo.price_per_person,
    image_url: theme.image_url ?? null,
    booking_url: sourceUrl,
    source_url: sourceUrl,
    difficulty_label: theme.level ? String(theme.level) : null,
    difficulty_score: score10OrNull(theme.level),
    fear_label: null,
    fear_score: null,
  }
}

function splitCafeName(cafeName) {
  const branchMatch = cafeName.match(/(.+?)\s+([^ ]*점)$/)
  if (!branchMatch) return { name: cafeName, branch_name: null }
  return { name: branchMatch[1], branch_name: branchMatch[2] }
}

function ensureCafe(cafesByKey, cafeInput) {
  const cafeParts = splitCafeName(cafeInput.raw_name ?? cafeInput.name)
  const cafeName = cafeInput.name ?? cafeParts.name
  const branchName = cafeInput.branch_name ?? cafeParts.branch_name
  const cafeKey = normalizeKey(`${cafeName}${branchName ? ` ${branchName}` : ''}|${cafeInput.area_label}`)

  if (!cafesByKey.has(cafeKey)) {
    cafesByKey.set(cafeKey, {
      normalized_key: cafeKey,
      name: cafeName,
      branch_name: branchName,
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
    difficulty_score: score10OrNull(themeInput.difficulty_score ?? themeInput.difficulty_label),
    fear_score: score10OrNull(themeInput.fear_score ?? themeInput.fear_label),
    activity_label: themeInput.activity_label ?? null,
    activity_score: score10OrNull(themeInput.activity_score ?? themeInput.activity_label),
    story_label: themeInput.story_label ?? null,
    story_score: score10OrNull(themeInput.story_score ?? themeInput.story_label),
    interior_label: themeInput.interior_label ?? null,
    interior_score: score10OrNull(themeInput.interior_score ?? themeInput.interior_label),
    aging_label: themeInput.aging_label ?? null,
    aging_score: score10OrNull(themeInput.aging_score ?? themeInput.aging_label),
    needs_review: true,
    source_name: sourceName,
  })

  return true
}

function fillMissing(record, key, value) {
  if (value == null) return false
  if (Array.isArray(value) && value.length === 0) return false

  const current = record[key]
  const isEmpty = current == null || (Array.isArray(current) && current.length === 0) || current === ''
  if (!isEmpty) return false

  record[key] = value
  return true
}

function writePresent(record, key, value, { overwrite = false } = {}) {
  if (value == null) return false
  if (Array.isArray(value) && value.length === 0) return false
  if (value === '') return false
  if (!overwrite) return fillMissing(record, key, value)
  if (JSON.stringify(record[key]) === JSON.stringify(value)) return false
  record[key] = value
  return true
}

function enrichTheme(cafesByKey, target, cafeInput, themeInput, sourceName, options = {}) {
  const themeKey = normalizeKey(target)
  const overwrite = options.overwrite ?? false

  for (const cafe of cafesByKey.values()) {
    const theme = cafe.themes.find(item => item.normalized_key === themeKey)
    if (!theme) continue

    const changed = [
      writePresent(theme, 'genre_labels', themeInput.genre_labels ?? [], { overwrite }),
      writePresent(theme, 'duration_minutes', themeInput.duration_minutes, { overwrite }),
      writePresent(theme, 'min_players', themeInput.min_players, { overwrite }),
      writePresent(theme, 'max_players', themeInput.max_players, { overwrite }),
      writePresent(theme, 'price_text', themeInput.price_text, { overwrite }),
      writePresent(theme, 'price_per_person', themeInput.price_per_person, { overwrite }),
      writePresent(theme, 'image_url', themeInput.image_url),
      writePresent(theme, 'booking_url', themeInput.booking_url, { overwrite }),
      writePresent(theme, 'difficulty_label', themeInput.difficulty_label, { overwrite }),
      writePresent(theme, 'difficulty_score', score10OrNull(themeInput.difficulty_score ?? themeInput.difficulty_label), { overwrite }),
      writePresent(theme, 'fear_label', themeInput.fear_label, { overwrite }),
      writePresent(theme, 'fear_score', score10OrNull(themeInput.fear_score ?? themeInput.fear_label), { overwrite }),
      writePresent(theme, 'activity_label', themeInput.activity_label, { overwrite }),
      writePresent(theme, 'activity_score', score10OrNull(themeInput.activity_score ?? themeInput.activity_label), { overwrite }),
      writePresent(theme, 'story_label', themeInput.story_label, { overwrite }),
      writePresent(theme, 'story_score', score10OrNull(themeInput.story_score ?? themeInput.story_label), { overwrite }),
      writePresent(theme, 'interior_label', themeInput.interior_label, { overwrite }),
      writePresent(theme, 'interior_score', score10OrNull(themeInput.interior_score ?? themeInput.interior_label), { overwrite }),
      writePresent(theme, 'aging_label', themeInput.aging_label, { overwrite }),
      writePresent(theme, 'aging_score', score10OrNull(themeInput.aging_score ?? themeInput.aging_label), { overwrite }),
      writePresent(cafe, 'address', cafeInput.address, { overwrite }),
      writePresent(cafe, 'phone', cafeInput.phone, { overwrite }),
      writePresent(cafe, 'website_url', cafeInput.website_url, { overwrite }),
      writePresent(cafe, 'booking_url', cafeInput.booking_url, { overwrite }),
    ].some(Boolean)

    if (changed) {
      theme.source_url = themeInput.source_url
      theme.source_name = `${theme.source_name} + ${sourceName}`
    }

    return changed
  }

  return false
}

async function fetchPlayTheWorldShop(candidate) {
  const token = 'CodexVerifyToken'
  const headers = {
    'Bearer-Token': candidate.brandKey,
    Name: candidate.nameHeader,
    'Site-Referer': candidate.origin,
    'X-Request-Origin': candidate.origin,
    'X-Secure-Random': token,
    'X-Request-Option': createPlayTheWorldJwt(candidate.brandKey, token),
  }
  const url = `${candidate.baseUrl ?? 'https://macro.playthe.world'}/${candidate.apiVersion}/shops/${candidate.shopKeycode}`
  const response = await fetch(url, { headers })
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`)
  const json = await response.json()
  if (json.result !== 'success') throw new Error(`Official API failed for ${candidate.target}: ${json.data ?? json.msg ?? 'unknown'}`)
  return json.data
}

async function fetchKeyescapeShop(candidate) {
  const url = 'https://www.keyescape.com/controller/run_proc.php'
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
      'user-agent': 'Mozilla/5.0',
      referer: candidate.source_url,
    },
    body: new URLSearchParams({
      t: 'get_theme_info_list',
      zizum_num: String(candidate.zizumNum),
    }),
  })
  if (!response.ok) throw new Error(`Failed to fetch keyescape ${candidate.zizumNum}: ${response.status}`)
  const json = await response.json()
  if (!json.status) throw new Error(`Keyescape API failed for ${candidate.target}: ${json.msg ?? 'unknown'}`)
  return json
}

async function parseOfficialCandidate(candidate) {
  if (candidate.type === 'playtheworld') {
    const data = await fetchPlayTheWorldShop(candidate)
    const theme = data.themes?.find(item => normalizeKey(item.title) === normalizeKey(candidate.themeTitle ?? candidate.target))
    if (!theme) return null

    return {
      cafe: {
        raw_name: candidate.cafe?.raw_name ?? data.shop.name,
        name: candidate.cafe?.name,
        branch_name: candidate.cafe?.branch_name,
        address: data.shop.address ?? null,
        phone: data.shop.contact ?? null,
        website_url: data.shop.brand_site_url ?? candidate.source_url,
        booking_url: data.shop.brand_site_url ?? candidate.source_url,
        area_label: candidate.cafe?.area_label ?? areaFromAddress(data.shop.address ?? '', '전국'),
        district: candidate.cafe?.district ?? districtFromAddress(data.shop.address ?? '', '전국'),
      },
      theme: parsePlayTheWorldTheme(theme, candidate.source_url, candidate.target),
    }
  }

  if (candidate.type === 'keyescape') {
    const data = await fetchKeyescapeShop(candidate)
    const listItem = data.data?.find(item => normalizeKey(item.info_name) === normalizeKey(candidate.themeTitle ?? candidate.target))
    if (!listItem) return null
    const themeResponse = await fetch('https://www.keyescape.com/controller/run_proc.php', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
        'user-agent': 'Mozilla/5.0',
        referer: candidate.source_url,
      },
      body: new URLSearchParams({
        t: 'get_theme_date',
        num: String(listItem.info_num),
      }),
    })
    if (!themeResponse.ok) throw new Error(`Failed to fetch keyescape theme ${candidate.target}: ${themeResponse.status}`)
    const themeJson = await themeResponse.json()
    if (!themeJson.status) throw new Error(`Keyescape theme API failed for ${candidate.target}: ${themeJson.msg ?? 'unknown'}`)

    return {
      cafe: {
        raw_name: candidate.cafe?.raw_name ?? `키이스케이프 ${data.zizum?.name ?? ''}`.trim(),
        name: candidate.cafe?.name,
        branch_name: candidate.cafe?.branch_name,
        address: data.zizum?.addr ?? null,
        phone: data.zizum?.phone ?? null,
        website_url: candidate.source_url,
        booking_url: candidate.source_url,
        area_label: candidate.cafe?.area_label ?? areaFromAddress(data.zizum?.addr ?? '', '강남'),
        district: candidate.cafe?.district ?? districtFromAddress(data.zizum?.addr ?? '', '강남'),
      },
      theme: parseKeyescapeTheme(themeJson.data, candidate.source_url, candidate.target),
    }
  }

  return null
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
  const enriched = []

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
      difficulty_score: score10OrNull(detail.difficulty_label),
      fear_score: score10OrNull(detail.fear_label),
    }, 'ㅂㅌㅊ 전체 테마')
    matched.push({ target, crawled_name: card.name, cafe: card.cafe_name, source_url: card.detail_url })
  }

  const remainingTargets = new Set(unmatched)
  const officialVerified = []

  for (const candidate of candidates.official ?? []) {
    const parsed = await parseOfficialCandidate(candidate)
    if (!parsed) continue

    if (!remainingTargets.has(candidate.target)) {
      const changed = enrichTheme(
        cafesByKey,
        candidate.target,
        {
          ...parsed.cafe,
          source_url: candidate.source_url,
        },
        parsed.theme,
        candidate.source_name ?? '공식 예약 페이지',
        { overwrite: true },
      )

      if (changed) {
        enriched.push({
          target: candidate.target,
          crawled_name: parsed.theme.crawled_name,
          cafe: parsed.cafe.raw_name ?? parsed.cafe.name,
          source_url: candidate.source_url,
        })
        officialVerified.push(candidate.target)
      }
      continue
    }

    const added = addTheme(cafesByKey, {
      ...parsed.cafe,
      source_url: candidate.source_url,
    }, parsed.theme, candidate.source_name ?? '공식 예약 페이지')

    if (added) {
      remainingTargets.delete(candidate.target)
      matched.push({
        target: candidate.target,
        crawled_name: parsed.theme.crawled_name,
        cafe: parsed.cafe.raw_name ?? parsed.cafe.name,
        source_url: candidate.source_url,
      })
      officialVerified.push(candidate.target)
    }
  }

  for (const candidate of candidates.zamfit ?? []) {
    const candidateHtml = await fetch(candidate.url).then(response => {
      if (!response.ok) throw new Error(`Failed to fetch ${candidate.url}: ${response.status}`)
      return response.text()
    })
    const parsed = parseZamfitDetail(candidateHtml, candidate.url, candidate.target)

    if (!parsed.cafe.raw_name) continue

    if (!remainingTargets.has(candidate.target)) {
      const changed = enrichTheme(
        cafesByKey,
        candidate.target,
        {
          ...parsed.cafe,
          source_url: candidate.url,
        },
        parsed.theme,
        '잼핏 테마 상세',
      )

      if (changed) {
        enriched.push({
          target: candidate.target,
          crawled_name: parsed.theme.crawled_name,
          cafe: parsed.cafe.raw_name,
          source_url: candidate.url,
        })
      }
      continue
    }

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
      if (!remainingTargets.has(theme.target)) {
        const changed = enrichTheme(
          cafesByKey,
          theme.target,
          {
            ...source.cafe,
            source_url: source.source_url,
          },
          {
            ...theme,
            name: theme.target,
            source_url: source.source_url,
            booking_url: source.cafe.booking_url,
          },
          source.source_name,
          { overwrite: source.overwrite ?? false },
        )

        if (changed) {
          enriched.push({
            target: theme.target,
            crawled_name: theme.name,
            cafe: `${source.cafe.name}${source.cafe.branch_name ? ` ${source.cafe.branch_name}` : ''}`,
            source_url: source.source_url,
          })
        }
        continue
      }

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
      ...((candidates.official ?? []).map(candidate => candidate.source_url)),
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
    enriched_count: enriched.length,
    official_verified_count: officialVerified.length,
    matched,
    enriched,
    official_verified: officialVerified,
    unmatched,
  }

  await mkdir(dirname(SEED_PATH), { recursive: true })
  await writeFile(SEED_PATH, `${JSON.stringify(seed, null, 2)}\n`)
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`)

  console.log(`Matched ${matched.length}/${targets.length} targets.`)
  if (officialVerified.length) console.log(`Officially verified ${officialVerified.length} targets.`)
  if (enriched.length) console.log(`Enriched ${enriched.length} previously matched targets.`)
  if (unmatched.length) console.log(`Unmatched: ${unmatched.join(', ')}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
