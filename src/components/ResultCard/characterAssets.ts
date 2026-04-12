import type { CharacterId } from '../../lib/traitMap'

// AI-generated character images served from public/characters/
// brave_puzzle → lion, brave_device → tiger, brave_balanced → wolf
// neutral_puzzle → fox, neutral_device → cat, neutral_balanced → eagle
// scared_any → rabbit

export const DISPLAY_IMAGES: Record<CharacterId, string> = {
  brave_puzzle:    '/characters/lion.png',
  brave_device:    '/characters/tiger.png',
  brave_balanced:  '/characters/wolf.png',
  neutral_puzzle:  '/characters/fox.png',
  neutral_device:  '/characters/cat.png',
  neutral_balanced: '/characters/eagle.png',
  scared_any:      '/characters/rabbit.png',
}

export const SHARE_IMAGES: Record<CharacterId, string> = {
  brave_puzzle:    '/characters/lion.png',
  brave_device:    '/characters/tiger.png',
  brave_balanced:  '/characters/wolf.png',
  neutral_puzzle:  '/characters/fox.png',
  neutral_device:  '/characters/cat.png',
  neutral_balanced: '/characters/eagle.png',
  scared_any:      '/characters/rabbit.png',
}

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
  '0-10':   '★',
  '10-30':  '★★',
  '30-100': '★★★',
  '100+':   '★★★★',
}
