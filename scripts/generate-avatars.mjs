// Run via: npm run prebuild
// Generates 7 character PNGs (display 300px + share 1080px) using DiceBear.
// Output: src/assets/characters/{id}-display.png + src/assets/characters/{id}-share.png

import { createCanvas, loadImage } from 'canvas'
import { createAvatar } from '@dicebear/core'
import { adventurer } from '@dicebear/collection'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../src/assets/characters')

fs.mkdirSync(OUT_DIR, { recursive: true })

const CHARACTERS = [
  { id: 'brave_puzzle', seed: 'brave-puzzle-solver', bg: '#E8F4FD' },
  { id: 'brave_device', seed: 'brave-device-tinkerer', bg: '#FDF0E8' },
  { id: 'brave_balanced', seed: 'brave-strategist', bg: '#E8FDF0' },
  { id: 'neutral_puzzle', seed: 'calm-puzzle-solver', bg: '#F0E8FD' },
  { id: 'neutral_device', seed: 'calm-device-tinkerer', bg: '#FDF0F8' },
  { id: 'neutral_balanced', seed: 'calm-strategist', bg: '#FDFDE8' },
  { id: 'scared_any', seed: 'cautious-observer', bg: '#F8E8E8' },
]

async function svgToPng(svg, size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  const img = await loadImage(dataUri)
  ctx.drawImage(img, 0, 0, size, size)
  return canvas.toBuffer('image/png')
}

let errors = 0

for (const char of CHARACTERS) {
  try {
    const avatar = createAvatar(adventurer, {
      seed: char.seed,
      size: 1080,
      backgroundColor: [char.bg.replace('#', '')],
    })
    const svg = avatar.toString()

    const displayPng = await svgToPng(svg, 300)
    const sharePng = await svgToPng(svg, 1080)

    fs.writeFileSync(path.join(OUT_DIR, `${char.id}-display.png`), displayPng)
    fs.writeFileSync(path.join(OUT_DIR, `${char.id}-share.png`), sharePng)

    console.log(`✓ ${char.id}`)
  } catch (err) {
    console.error(`✗ ${char.id}:`, err)
    errors++
  }
}

if (errors > 0) {
  console.error(`\n${errors} character(s) failed to generate.`)
  process.exit(1)
}

console.log('\nAll 7 characters generated (display + share sizes).')
