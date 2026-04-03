// Run via: npm run prebuild
// Generates cute animal SVGs plus PNG exports for result cards.

import { createCanvas, loadImage } from 'canvas'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../src/assets/characters')

fs.mkdirSync(OUT_DIR, { recursive: true })

const CHARACTERS = [
  {
    id: 'brave_puzzle',
    animal: 'lion',
    bg: '#eaf7ff',
    ring: '#9fd4ff',
    body: '#f3bd56',
    bodyShade: '#d39234',
    inner: '#ffe8bd',
    accessory: '#5f95ff',
  },
  {
    id: 'brave_device',
    animal: 'tiger',
    bg: '#fff2e8',
    ring: '#ffc48f',
    body: '#ff9f43',
    bodyShade: '#ef6d22',
    inner: '#fff2d7',
    accessory: '#6f7cff',
  },
  {
    id: 'brave_balanced',
    animal: 'bear',
    bg: '#ebfff2',
    ring: '#9be1b1',
    body: '#a46a43',
    bodyShade: '#7a4c2d',
    inner: '#eed1b9',
    accessory: '#3fae78',
  },
  {
    id: 'neutral_puzzle',
    animal: 'fox',
    bg: '#f4edff',
    ring: '#cdb7ff',
    body: '#ff9051',
    bodyShade: '#eb6d2f',
    inner: '#fff1dd',
    accessory: '#8d67ff',
  },
  {
    id: 'neutral_device',
    animal: 'cat',
    bg: '#fff0f6',
    ring: '#ffbdd8',
    body: '#8f7cf7',
    bodyShade: '#6756c7',
    inner: '#fce7f3',
    accessory: '#ff8db8',
  },
  {
    id: 'neutral_balanced',
    animal: 'owl',
    bg: '#fffde9',
    ring: '#eee08f',
    body: '#b78455',
    bodyShade: '#8e613b',
    inner: '#fff3c4',
    accessory: '#5d8a3d',
  },
  {
    id: 'scared_any',
    animal: 'rabbit',
    bg: '#fff1f1',
    ring: '#ffc0c0',
    body: '#f6f2f7',
    bodyShade: '#d8cadf',
    inner: '#ffd7e6',
    accessory: '#7ec7a5',
  },
]

function ellipse(cx, cy, rx, ry, fill, extra = '') {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`
}

function circle(cx, cy, r, fill, extra = '') {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`
}

function pathEl(d, fill, extra = '') {
  return `<path d="${d}" fill="${fill}" ${extra}/>`
}

function renderFaceParts(config) {
  const { animal, body, bodyShade, inner, accessory } = config

  const common = `
    ${ellipse(540, 575, 190, 170, body)}
    ${ellipse(540, 700, 130, 110, bodyShade, 'opacity="0.95"')}
    ${ellipse(540, 610, 92, 72, inner)}
    ${circle(485, 555, 20, '#1f2430')}
    ${circle(595, 555, 20, '#1f2430')}
    ${circle(478, 548, 6, '#ffffff', 'opacity="0.92"')}
    ${circle(588, 548, 6, '#ffffff', 'opacity="0.92"')}
    ${ellipse(540, 600, 26, 18, '#473228')}
    <path d="M520 625 Q540 645 560 625" stroke="#473228" stroke-width="10" stroke-linecap="round" fill="none"/>
    ${circle(455, 612, 18, '#ffb3c7', 'opacity="0.8"')}
    ${circle(625, 612, 18, '#ffb3c7', 'opacity="0.8"')}
  `

  switch (animal) {
    case 'lion':
      return `
        ${circle(540, 540, 240, '#ffcf70')}
        ${circle(540, 540, 210, '#f09a36')}
        ${circle(405, 402, 55, '#f09a36')}
        ${circle(675, 402, 55, '#f09a36')}
        ${circle(405, 402, 28, '#ffdca1')}
        ${circle(675, 402, 28, '#ffdca1')}
        ${common}
        ${pathEl('M405 700 C455 650 505 650 540 705 C495 740 445 742 405 700', accessory)}
      `
    case 'tiger':
      return `
        ${ellipse(420, 405, 58, 72, body)}
        ${ellipse(660, 405, 58, 72, body)}
        ${ellipse(420, 405, 28, 34, inner)}
        ${ellipse(660, 405, 28, 34, inner)}
        ${common}
        ${pathEl('M410 480 L455 525 L420 535 Z', '#47240f')}
        ${pathEl('M670 480 L625 525 L660 535 Z', '#47240f')}
        ${pathEl('M500 445 L470 525 L500 535 Z', '#47240f')}
        ${pathEl('M580 445 L610 525 L580 535 Z', '#47240f')}
        ${pathEl('M540 440 L528 520 L552 520 Z', '#47240f')}
        ${pathEl('M432 706 C476 668 510 668 540 710 C500 736 462 740 432 706', accessory)}
      `
    case 'bear':
      return `
        ${circle(410, 420, 68, bodyShade)}
        ${circle(670, 420, 68, bodyShade)}
        ${circle(410, 420, 34, inner)}
        ${circle(670, 420, 34, inner)}
        ${common}
        ${pathEl('M420 710 C470 664 514 664 540 712 C495 743 455 744 420 710', accessory)}
      `
    case 'fox':
      return `
        ${pathEl('M355 465 C360 378 430 330 500 360 C460 402 434 428 416 480 Z', body)}
        ${pathEl('M725 465 C720 378 650 330 580 360 C620 402 646 428 664 480 Z', body)}
        ${pathEl('M400 446 C410 394 448 378 478 388 C455 412 438 430 428 462 Z', inner)}
        ${pathEl('M680 446 C670 394 632 378 602 388 C625 412 642 430 652 462 Z', inner)}
        ${ellipse(540, 575, 175, 160, body)}
        ${ellipse(540, 700, 126, 104, bodyShade)}
        ${pathEl('M455 565 L540 665 L625 565 Q610 705 540 752 Q470 705 455 565', inner)}
        ${circle(485, 555, 18, '#1f2430')}
        ${circle(595, 555, 18, '#1f2430')}
        ${circle(478, 548, 5, '#ffffff', 'opacity="0.92"')}
        ${circle(588, 548, 5, '#ffffff', 'opacity="0.92"')}
        ${ellipse(540, 605, 24, 16, '#473228')}
        <path d="M516 626 Q540 648 564 626" stroke="#473228" stroke-width="10" stroke-linecap="round" fill="none"/>
        ${circle(460, 612, 18, '#ffb3c7', 'opacity="0.8"')}
        ${circle(620, 612, 18, '#ffb3c7', 'opacity="0.8"')}
        ${pathEl('M425 706 C470 668 510 668 540 712 C498 740 458 742 425 706', accessory)}
      `
    case 'cat':
      return `
        ${pathEl('M385 490 L420 350 L500 470 Z', body)}
        ${pathEl('M695 490 L660 350 L580 470 Z', body)}
        ${pathEl('M420 448 L440 382 L484 450 Z', inner)}
        ${pathEl('M660 448 L640 382 L596 450 Z', inner)}
        ${common}
        <path d="M440 600 L355 582" stroke="#473228" stroke-width="8" stroke-linecap="round"/>
        <path d="M440 626 L348 626" stroke="#473228" stroke-width="8" stroke-linecap="round"/>
        <path d="M640 600 L725 582" stroke="#473228" stroke-width="8" stroke-linecap="round"/>
        <path d="M640 626 L732 626" stroke="#473228" stroke-width="8" stroke-linecap="round"/>
        ${pathEl('M430 708 C474 668 512 668 540 712 C500 739 462 742 430 708', accessory)}
      `
    case 'owl':
      return `
        ${ellipse(540, 565, 180, 190, body)}
        ${ellipse(540, 710, 140, 100, bodyShade)}
        ${circle(465, 550, 56, '#fffaf0')}
        ${circle(615, 550, 56, '#fffaf0')}
        ${circle(465, 550, 26, '#1f2430')}
        ${circle(615, 550, 26, '#1f2430')}
        ${circle(455, 540, 8, '#ffffff', 'opacity="0.92"')}
        ${circle(605, 540, 8, '#ffffff', 'opacity="0.92"')}
        ${pathEl('M540 592 L508 642 L572 642 Z', '#f3a43b')}
        ${ellipse(540, 690, 86, 76, inner, 'opacity="0.95"')}
        ${pathEl('M420 475 C445 430 480 422 505 452 C474 462 448 472 420 475', bodyShade)}
        ${pathEl('M660 475 C635 430 600 422 575 452 C606 462 632 472 660 475', bodyShade)}
        ${pathEl('M442 714 C478 674 510 674 540 716 C500 742 468 744 442 714', accessory)}
      `
    case 'rabbit':
      return `
        ${ellipse(450, 310, 42, 120, body)}
        ${ellipse(630, 310, 42, 120, body)}
        ${ellipse(450, 310, 18, 84, inner)}
        ${ellipse(630, 310, 18, 84, inner)}
        ${common}
        ${ellipse(540, 602, 74, 58, '#fff7fb')}
        ${ellipse(540, 592, 18, 14, '#ff96b6')}
        <path d="M522 622 Q540 636 558 622" stroke="#473228" stroke-width="8" stroke-linecap="round" fill="none"/>
        ${pathEl('M430 710 C474 672 512 672 540 714 C500 740 462 744 430 710', accessory)}
      `
    default:
      return common
  }
}

function makeSvg(config) {
  return `
  <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1080" rx="220" fill="${config.bg}"/>
    <circle cx="540" cy="540" r="370" fill="${config.ring}" opacity="0.28"/>
    <circle cx="540" cy="540" r="330" fill="#ffffff" opacity="0.55"/>
    <ellipse cx="540" cy="902" rx="220" ry="54" fill="#31233b" opacity="0.10"/>
    ${renderFaceParts(config)}
    ${pathEl('M360 858 C428 816 508 800 540 802 C590 804 676 820 734 858 L710 920 C662 888 586 874 540 874 C492 874 416 888 372 920 Z', config.accessory, 'opacity="0.95"')}
    ${circle(446, 848, 22, '#ffffff', 'opacity="0.18"')}
    ${circle(640, 834, 16, '#ffffff', 'opacity="0.12"')}
  </svg>
  `.trim()
}

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
    const svg = makeSvg(char)
    const displayPng = await svgToPng(svg, 300)
    const sharePng = await svgToPng(svg, 1080)

    fs.writeFileSync(path.join(OUT_DIR, `${char.id}.svg`), `${svg}\n`)
    fs.writeFileSync(path.join(OUT_DIR, `${char.id}-display.png`), displayPng)
    fs.writeFileSync(path.join(OUT_DIR, `${char.id}-share.png`), sharePng)

    console.log(`✓ ${char.id} (${char.animal})`)
  } catch (err) {
    console.error(`✗ ${char.id}:`, err)
    errors++
  }
}

if (errors > 0) {
  console.error(`\n${errors} character(s) failed to generate.`)
  process.exit(1)
}

console.log('\nAll character SVG and PNG assets generated.')
