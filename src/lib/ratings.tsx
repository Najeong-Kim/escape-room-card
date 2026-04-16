export type PathRating = 0 | 1 | 2 | 3 | 4 | 5

export interface PathRatingDef {
  value: PathRating
  label: string
  color: string
  bg: string
  border: string
}

export const PATH_RATINGS: PathRatingDef[] = [
  { value: 0, label: '흙길',    color: '#A07850', bg: '#2a1e12', border: '#7A5C30' },
  { value: 1, label: '풀길',    color: '#5CB85C', bg: '#0e2a0e', border: '#3a8c3a' },
  { value: 2, label: '풀꽃길',  color: '#81C784', bg: '#0e2a18', border: '#4CAF50' },
  { value: 3, label: '꽃길',    color: '#F48FB1', bg: '#2a0e1a', border: '#EC407A' },
  { value: 4, label: '꽃밭길',  color: '#CE93D8', bg: '#1a0e2a', border: '#AB47BC' },
  { value: 5, label: '인생테마', color: '#FFD700', bg: '#2a2200', border: '#FFC107' },
]

export const PATH_RATING_SCORE10: Record<PathRating, number> = {
  0: 3,
  1: 5,
  2: 6.3,
  3: 7.4,
  4: 8.6,
  5: 9.7,
}

export function pathRatingToScore10(rating: PathRating | null | undefined) {
  if (rating === null || rating === undefined) return null
  return PATH_RATING_SCORE10[rating] ?? null
}

export function score10ToPathRating(score10: number | null | undefined): PathRating | null {
  if (score10 === null || score10 === undefined || !Number.isFinite(score10)) return null
  if (score10 < 4) return 0
  if (score10 < 5.7) return 1
  if (score10 < 6.9) return 2
  if (score10 < 8) return 3
  if (score10 < 9.2) return 4
  return 5
}

export function getRatingDef(rating: PathRating | null): PathRatingDef | null {
  if (rating === null || rating === undefined) return null
  return PATH_RATINGS[rating] ?? null
}

// ─────────────────────────────────────────
// SVG icon components
// ─────────────────────────────────────────

function DirtPathIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* ground */}
      <path d="M3 19 Q12 17 21 19" stroke="#7A5C30" strokeWidth="1.5" strokeLinecap="round"/>
      {/* pebbles */}
      <ellipse cx="7"  cy="16.5" rx="2"   ry="1.2" fill="#8B6940"/>
      <ellipse cx="13" cy="15.5" rx="2.5" ry="1.4" fill="#9B7A50"/>
      <ellipse cx="19" cy="16.5" rx="1.5" ry="1"   fill="#7A5C30"/>
      <ellipse cx="10" cy="18"   rx="1.2" ry="0.7" fill="#6B4C20"/>
      <ellipse cx="16" cy="17.5" rx="1.8" ry="0.9" fill="#8B6940"/>
    </svg>
  )
}

function GrassPathIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* ground */}
      <path d="M3 19 Q12 18 21 19" stroke="#3a8c3a" strokeWidth="1" strokeLinecap="round"/>
      {/* grass blades */}
      <path d="M5 19 Q4 14 6 9"  stroke="#5CB85C" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 19 Q9 13 8 8"  stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
      <path d="M13 19 Q13 12 14 8" stroke="#5CB85C" strokeWidth="2" strokeLinecap="round"/>
      <path d="M17 19 Q17 14 19 9" stroke="#43A047" strokeWidth="2" strokeLinecap="round"/>
      <path d="M21 19 Q20 15 21 10" stroke="#5CB85C" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function GrassFlowerIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* ground */}
      <path d="M3 19 Q12 18 21 19" stroke="#3a8c3a" strokeWidth="1" strokeLinecap="round"/>
      {/* grass */}
      <path d="M4 19 Q3 14 5 9"  stroke="#5CB85C" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 19 Q9 14 8 10" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 19 Q20 14 21 9" stroke="#5CB85C" strokeWidth="2" strokeLinecap="round"/>
      {/* stem */}
      <path d="M15 19 L15 13" stroke="#5CB85C" strokeWidth="2" strokeLinecap="round"/>
      {/* petals */}
      <circle cx="15" cy="10" r="3.5" fill="#FFB7C5"/>
      <circle cx="15" cy="10" r="2"   fill="#FFF0F5"/>
      {/* center */}
      <circle cx="15" cy="10" r="1.2" fill="#FFD700"/>
    </svg>
  )
}

function FlowerPathIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* ground */}
      <path d="M3 19 Q12 18 21 19" stroke="#3a8c3a" strokeWidth="1" strokeLinecap="round"/>
      {/* left flower — pink */}
      <path d="M7 19 L7 14" stroke="#5CB85C" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="11" r="3" fill="#F48FB1"/>
      <circle cx="7" cy="11" r="1.5" fill="#FFECF1"/>
      <circle cx="7" cy="11" r="0.8" fill="#FFD700"/>
      {/* right flower — purple */}
      <path d="M17 19 L17 13" stroke="#5CB85C" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="17" cy="10" r="3.2" fill="#CE93D8"/>
      <circle cx="17" cy="10" r="1.6" fill="#F3E5F5"/>
      <circle cx="17" cy="10" r="0.9" fill="#FFD700"/>
    </svg>
  )
}

function FlowerGardenIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* ground */}
      <path d="M3 19 Q12 18 21 19" stroke="#3a8c3a" strokeWidth="1" strokeLinecap="round"/>
      {/* left flower — pink */}
      <path d="M4 19 L4 16" stroke="#5CB85C" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="4" cy="13.5" r="2.5" fill="#F48FB1"/>
      <circle cx="4" cy="13.5" r="1.2" fill="#FFD700"/>
      {/* center flower — white/cream */}
      <path d="M12 19 L12 12" stroke="#5CB85C" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="9.5" r="3"   fill="#FFF9C4"/>
      <circle cx="12" cy="9.5" r="1.5" fill="#FFECB3"/>
      <circle cx="12" cy="9.5" r="0.8" fill="#FF8F00"/>
      {/* right flower — purple */}
      <path d="M20 19 L20 15" stroke="#5CB85C" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="20" cy="12.5" r="2.8" fill="#CE93D8"/>
      <circle cx="20" cy="12.5" r="1.3" fill="#FFD700"/>
      {/* extra small flowers */}
      <circle cx="8"  cy="15" r="1.8" fill="#A5D6A7"/>
      <circle cx="8"  cy="15" r="0.9" fill="#FFD700"/>
      <circle cx="16" cy="16" r="1.8" fill="#FF8A65"/>
      <circle cx="16" cy="16" r="0.9" fill="#FFD700"/>
    </svg>
  )
}

function LifeThemeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* glow */}
      <circle cx="12" cy="12" r="10" fill="#FFD700" opacity="0.12"/>
      {/* star */}
      <path
        d="M12 3 L13.8 8.6 H19.6 L15 11.8 L16.8 17.4 L12 14.2 L7.2 17.4 L9 11.8 L4.4 8.6 H10.2 Z"
        fill="#FFD700"
        stroke="#FFC107"
        strokeWidth="0.5"
      />
      {/* sparkles */}
      <path d="M20 4 L20.8 5.6 L22.4 6.4 L20.8 7.2 L20 8.8 L19.2 7.2 L17.6 6.4 L19.2 5.6Z" fill="#FFE57F" opacity="0.9"/>
      <path d="M4 16 L4.5 17 L5.5 17.5 L4.5 18 L4 19 L3.5 18 L2.5 17.5 L3.5 17Z"          fill="#FFE57F" opacity="0.8"/>
    </svg>
  )
}

export function RatingIcon({ value, size = 24 }: { value: PathRating; size?: number }) {
  switch (value) {
    case 0: return <DirtPathIcon size={size} />
    case 1: return <GrassPathIcon size={size} />
    case 2: return <GrassFlowerIcon size={size} />
    case 3: return <FlowerPathIcon size={size} />
    case 4: return <FlowerGardenIcon size={size} />
    case 5: return <LifeThemeIcon size={size} />
  }
}
