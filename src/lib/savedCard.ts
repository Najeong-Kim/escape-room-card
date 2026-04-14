import type { QuizProfile } from './traitMap'

const SAVED_CARD_KEY = 'escape-room-card-profile'

export function loadSavedCard(): QuizProfile | null {
  try {
    const raw = localStorage.getItem(SAVED_CARD_KEY)
    if (!raw) return null
    return JSON.parse(raw) as QuizProfile
  } catch {
    return null
  }
}

export function saveCard(profile: QuizProfile) {
  localStorage.setItem(SAVED_CARD_KEY, JSON.stringify(profile))
}

export function clearSavedCard() {
  localStorage.removeItem(SAVED_CARD_KEY)
}
