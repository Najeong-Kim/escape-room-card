import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = resolve(import.meta.dirname, '..')
const SEED_PATH = resolve(ROOT, 'data/gangnam-gu-themes.seed.json')
const ENV_PATH = resolve(ROOT, '.env.local')

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

function omitUndefined(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  )
}

function genreCodesForLabels(labels = []) {
  const codes = new Set()

  for (const label of labels) {
    const normalized = label.toLowerCase()
    if (label.includes('공포') || normalized.includes('horror')) codes.add('Horror')
    if (label.includes('스릴러') || label.includes('미스터리') || label.includes('추리') || label.includes('잠입')) codes.add('MysteryThriller')
    if (label.includes('감성') || label.includes('드라마')) codes.add('Emotional')
    if (label.includes('코믹') || label.includes('개그')) codes.add('Comic')
    if (label.includes('판타지') || label.includes('모험') || label.includes('어드벤처')) codes.add('FantasyAdventure')
    if (label.includes('범죄') || label.includes('살인')) codes.add('Crime')
    if (label.includes('sf') || label.includes('SF')) codes.add('SF')
    if (label.includes('야외')) codes.add('Outdoor')
    if (label.includes('온라인')) codes.add('Online')
  }

  if (codes.size === 0) codes.add('Etc')
  return [...codes]
}

async function main() {
  const env = parseEnv(await readFile(ENV_PATH, 'utf8'))
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL
  const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY ?? env.VITE_SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY')
  }

  const seed = JSON.parse(await readFile(SEED_PATH, 'utf8'))
  const supabase = createClient(supabaseUrl, serviceKey)
  const { data: areas, error: areasError } = await supabase
    .from('areas')
    .select('id, name')
  if (areasError) throw areasError

  const { data: genres, error: genresError } = await supabase
    .from('genres')
    .select('id, code')
  if (genresError) throw genresError

  const areaIdByName = new Map((areas ?? []).map(area => [area.name, area.id]))
  const genreIdByCode = new Map((genres ?? []).map(genre => [genre.code, genre.id]))

  let cafeCount = 0
  let themeCount = 0
  let themeGenreCount = 0
  let sourceCount = 0

  for (const cafe of seed.cafes) {
    const { themes, ...cafeInput } = cafe
    const areaId = areaIdByName.get(cafe.area_label) ?? areaIdByName.get('기타') ?? null
    const { data: savedCafe, error: cafeError } = await supabase
      .from('cafes')
      .upsert(omitUndefined({ ...cafeInput, area_id: areaId }), { onConflict: 'normalized_key' })
      .select('id')
      .single()

    if (cafeError) throw cafeError
    cafeCount += 1

    for (const theme of themes) {
      const { source_name: sourceName, ...themeInput } = theme
      const sourceUrl = theme.source_url ?? cafe.source_url ?? 'local://data/gangnam-gu-themes.seed.json'

      const { data: savedTheme, error: themeError } = await supabase
        .from('themes')
        .upsert(
          omitUndefined({
            ...themeInput,
            cafe_id: savedCafe.id,
            source_url: sourceUrl,
          }),
          { onConflict: 'cafe_id,normalized_key' },
        )
        .select('id')
        .single()

      if (themeError) throw themeError
      themeCount += 1

      const genreRows = genreCodesForLabels(theme.genre_labels)
        .map(code => genreIdByCode.get(code))
        .filter(Boolean)
        .map(genreId => ({ theme_id: savedTheme.id, genre_id: genreId }))

      if (genreRows.length) {
        await supabase.from('theme_genres').delete().eq('theme_id', savedTheme.id)
        const { error: themeGenreError } = await supabase
          .from('theme_genres')
          .insert(genreRows)
        if (themeGenreError) throw themeGenreError
        themeGenreCount += genreRows.length
      }

      const { error: sourceError } = await supabase
        .from('theme_sources')
        .upsert({
          theme_id: savedTheme.id,
          source_name: sourceName ?? seed.source_note ?? 'manual seed',
          source_url: sourceUrl,
          raw_payload: {
            region: seed.region,
            cafe: cafeInput,
            theme,
          },
        }, { onConflict: 'theme_id,source_url' })

      if (sourceError) throw sourceError
      sourceCount += 1
    }
  }

  console.log(`Imported ${cafeCount} cafes, ${themeCount} themes, ${themeGenreCount} theme genres, ${sourceCount} source rows.`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
