import type { CharacterId } from '../../lib/traitMap'

// Animal SVGs — used in card UI
import bravePuzzle from '../../assets/characters/brave_puzzle.svg'
import braveDevice from '../../assets/characters/brave_device.svg'
import braveBalanced from '../../assets/characters/brave_balanced.svg'
import neutralPuzzle from '../../assets/characters/neutral_puzzle.svg'
import neutralDevice from '../../assets/characters/neutral_device.svg'
import neutralBalanced from '../../assets/characters/neutral_balanced.svg'
import scaredAny from '../../assets/characters/scared_any.svg'

export const DISPLAY_IMAGES: Record<CharacterId, string> = {
  brave_puzzle:     bravePuzzle,
  brave_device:     braveDevice,
  brave_balanced:   braveBalanced,
  neutral_puzzle:   neutralPuzzle,
  neutral_device:   neutralDevice,
  neutral_balanced: neutralBalanced,
  scared_any:       scaredAny,
}

// Emoji used in the canvas share image (reliable cross-platform rendering)
export const ANIMAL_EMOJIS: Record<CharacterId, string> = {
  brave_puzzle:     '🦁',
  brave_device:     '🐯',
  brave_balanced:   '🐺',
  neutral_puzzle:   '🦊',
  neutral_device:   '🐱',
  neutral_balanced: '🦅',
  scared_any:       '🐰',
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
