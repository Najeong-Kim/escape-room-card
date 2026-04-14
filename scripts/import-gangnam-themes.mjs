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

async function main() {
  const env = parseEnv(await readFile(ENV_PATH, 'utf8'))
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL
  const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY ?? env.VITE_SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY')
  }

  const seed = JSON.parse(await readFile(SEED_PATH, 'utf8'))
  const supabase = createClient(supabaseUrl, serviceKey)

  let cafeCount = 0
  let themeCount = 0
  let sourceCount = 0

  for (const cafe of seed.cafes) {
    const { themes, ...cafeInput } = cafe
    const { data: savedCafe, error: cafeError } = await supabase
      .from('cafes')
      .upsert(omitUndefined(cafeInput), { onConflict: 'normalized_key' })
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

  console.log(`Imported ${cafeCount} cafes, ${themeCount} themes, ${sourceCount} source rows.`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
