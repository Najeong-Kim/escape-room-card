import type { CharacterId, PlayCount } from '../../lib/traitMap'

// AI-generated character images served from public/characters/
// Growth stage by play count:
//   '0-10'    → baby-{animal}.png
//   '10-30'   → small-{animal}.png
//   '30-100'  → {animal}.png
//   '100+'    → big-{animal}.png

const CHARACTER_ANIMALS: Record<CharacterId, string> = {
  brave_puzzle:    'lion',
  brave_device:    'tiger',
  brave_balanced:  'wolf',
  neutral_puzzle:  'fox',
  neutral_device:  'cat',
  neutral_balanced: 'eagle',
  scared_any:      'rabbit',
}

const PLAY_COUNT_PREFIX: Record<PlayCount, string> = {
  '0':       'baby-',
  '0-10':    'baby-',
  '10-30':   'small-',
  '30-100':  '',
  '100+':    'big-',
}

export function getCharacterImage(characterId: CharacterId, playCount: PlayCount): string {
  const animal = CHARACTER_ANIMALS[characterId]
  const prefix = PLAY_COUNT_PREFIX[playCount]
  return `/characters/${prefix}${animal}.png`
}

// Legacy flat maps — kept for backwards compat, default to '30-100' (adult) stage
export const DISPLAY_IMAGES: Record<CharacterId, string> = {
  brave_puzzle:    '/characters/lion.png',
  brave_device:    '/characters/tiger.png',
  brave_balanced:  '/characters/wolf.png',
  neutral_puzzle:  '/characters/fox.png',
  neutral_device:  '/characters/cat.png',
  neutral_balanced: '/characters/eagle.png',
  scared_any:      '/characters/rabbit.png',
}

export const SHARE_IMAGES = DISPLAY_IMAGES

export const FEAR_ICONS: Record<string, string> = {
  brave:    '🔥',
  calm:     '🌊',
  cautious: '🐢',
}

export const PUZZLE_ICONS: Record<string, string> = {
  puzzle:   '🧩',
  device:   '⚙️',
  balanced: '⚖️',
}

export const PLAY_COUNT_STARS: Record<string, string> = {
  '0':      '',
  '0-10':   '★',
  '10-30':  '★★',
  '30-100': '★★★',
  '100+':   '★★★★',
}
