import type { CharacterId } from '../../lib/traitMap'

// Display images (300px) — used in card UI
import bravePuzzleDisplay from '../../assets/characters/brave_puzzle-display.png'
import braveDeviceDisplay from '../../assets/characters/brave_device-display.png'
import braveBalancedDisplay from '../../assets/characters/brave_balanced-display.png'
import neutralPuzzleDisplay from '../../assets/characters/neutral_puzzle-display.png'
import neutralDeviceDisplay from '../../assets/characters/neutral_device-display.png'
import neutralBalancedDisplay from '../../assets/characters/neutral_balanced-display.png'
import scaredAnyDisplay from '../../assets/characters/scared_any-display.png'

// Share images (1080px) — used in canvas export
import bravePuzzleShare from '../../assets/characters/brave_puzzle-share.png'
import braveDeviceShare from '../../assets/characters/brave_device-share.png'
import braveBalancedShare from '../../assets/characters/brave_balanced-share.png'
import neutralPuzzleShare from '../../assets/characters/neutral_puzzle-share.png'
import neutralDeviceShare from '../../assets/characters/neutral_device-share.png'
import neutralBalancedShare from '../../assets/characters/neutral_balanced-share.png'
import scaredAnyShare from '../../assets/characters/scared_any-share.png'

export const DISPLAY_IMAGES: Record<CharacterId, string> = {
  brave_puzzle:    bravePuzzleDisplay,
  brave_device:    braveDeviceDisplay,
  brave_balanced:  braveBalancedDisplay,
  neutral_puzzle:  neutralPuzzleDisplay,
  neutral_device:  neutralDeviceDisplay,
  neutral_balanced: neutralBalancedDisplay,
  scared_any:      scaredAnyDisplay,
}

export const SHARE_IMAGES: Record<CharacterId, string> = {
  brave_puzzle:    bravePuzzleShare,
  brave_device:    braveDeviceShare,
  brave_balanced:  braveBalancedShare,
  neutral_puzzle:  neutralPuzzleShare,
  neutral_device:  neutralDeviceShare,
  neutral_balanced: neutralBalancedShare,
  scared_any:      scaredAnyShare,
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
