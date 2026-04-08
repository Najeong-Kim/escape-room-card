import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { QuizProfile } from '../../lib/traitMap'
import {
  DISPLAY_IMAGES, SHARE_IMAGES,
  FEAR_ICONS, PUZZLE_ICONS, PLAY_COUNT_STARS,
} from './characterAssets'

interface Props {
  profile: QuizProfile
  onReset: () => void
}

export function ResultCard({ profile, onReset }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [shareBlob, setShareBlob] = useState<Blob | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { t, i18n } = useTranslation()

  const tagline = t(`tagline_${profile.characterId}`)
  const fearLabel = t(`fear_${profile.fearLevel}`)
  const styleLabel = t(`style_${profile.puzzleStyle}`)
  const tierLabel = t(`tier_${profile.playCountTier.label}`)
  const genreBackground = getGenreBackground(profile.genres)
  const genreBorder = getGenreBorder(profile.genres)

  // Re-compose share image when card mounts or language changes
  useEffect(() => {
    composeShareCanvas(profile, tagline, tierLabel).then(blob => {
      if (blob) setShareBlob(blob)
    })
  }, [profile, i18n.language, tagline, tierLabel])

  const displayImg = DISPLAY_IMAGES[profile.characterId]
  const fearIcon = FEAR_ICONS[profile.fearLevel]
  const puzzleIcon = PUZZLE_ICONS[profile.puzzleStyle]
  const stars = PLAY_COUNT_STARS[profile.playCount]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center min-h-dvh max-w-md mx-auto px-6 py-8 gap-6"
    >
      <div className="text-center">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">{t('result_subtitle')}</p>
        <h1 className="text-3xl font-black text-white">{tagline}</h1>
      </div>

      {/* Card with flip */}
      <div
        className="card-scene w-full"
        style={{ height: '420px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div
            className="card-face rounded-3xl overflow-hidden border shadow-2xl"
            style={{ background: genreBackground, borderColor: genreBorder }}
          >
            <CardFront
              profile={profile}
              displayImg={displayImg}
              fearIcon={fearIcon}
              puzzleIcon={puzzleIcon}
              stars={stars}
              tagline={tagline}
              tierLabel={tierLabel}
              fearLabel={fearLabel}
              styleLabel={styleLabel}
            />
          </div>

          {/* Back */}
          <div
            className="card-face card-face-back rounded-3xl overflow-hidden border shadow-2xl"
            style={{ background: genreBackground, borderColor: genreBorder }}
          >
            <CardBack
              profile={profile}
              fearIcon={fearIcon}
              puzzleIcon={puzzleIcon}
              fearLabel={fearLabel}
              styleLabel={styleLabel}
              tierLabel={tierLabel}
            />
          </div>
        </div>
      </div>

      {/* Flip hint */}
      <p className="text-gray-600 text-xs">{t('tap_to_flip')}</p>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3">
        <ShareButton shareBlob={shareBlob} nickname={profile.nickname} t={t} />

        <button
          onClick={onReset}
          className="w-full border border-gray-800 hover:border-gray-600 text-gray-400
                     hover:text-white py-3 rounded-2xl transition-all text-sm font-medium"
        >
          {t('try_again')}
        </button>
      </div>

      {/* Hidden canvas for share */}
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  )
}

// ─── Card faces ───────────────────────────────────────────────────

function CardFront({
  profile, displayImg, fearIcon, puzzleIcon, stars, tagline, tierLabel, fearLabel, styleLabel,
}: {
  profile: QuizProfile
  displayImg: string
  fearIcon: string
  puzzleIcon: string
  stars: string
  tagline: string
  tierLabel: string
  fearLabel: string
  styleLabel: string
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Character image */}
      <div className="flex-1 flex items-center justify-center p-6">
        <img
          src={displayImg}
          alt={profile.characterId}
          className="w-40 h-40 rounded-full object-cover ring-4 ring-violet-500/30"
          onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }}
        />
      </div>

      {/* Name + tagline */}
      <div className="px-6 pb-4 text-center">
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">{profile.nickname}</p>
        <h2 className="text-white text-xl font-black">{tagline}</h2>
      </div>

      {/* Trait icons row */}
      <div className="px-6 pb-4 flex justify-center gap-6">
        <TraitBadge icon={fearIcon} label={fearLabel} />
        <TraitBadge icon={puzzleIcon} label={styleLabel} />
        {profile.playStyle[0] && (
          <TraitBadge icon="🎯" label={profile.playStyle[0]} />
        )}
      </div>

      {/* Play count badge */}
      <div className="mx-6 mb-5 bg-violet-900/30 border border-violet-700/40 rounded-xl px-4 py-2
                      flex items-center justify-between">
        <span className="text-violet-300 text-xs font-semibold uppercase tracking-wider">
          {tierLabel}
        </span>
        <span className="text-yellow-400 text-sm tracking-tight">{stars}</span>
      </div>
    </div>
  )
}

function CardBack({
  profile, fearIcon, puzzleIcon, fearLabel, styleLabel, tierLabel,
}: {
  profile: QuizProfile
  fearIcon: string
  puzzleIcon: string
  fearLabel: string
  styleLabel: string
  tierLabel: string
}) {
  const { t } = useTranslation()
  const genresLabel = profile.genres.length > 0
    ? profile.genres.map(genre => t(`opt_${genre}`)).join(', ')
    : '—'
  const playStyleLabel = profile.playStyle.length > 0
    ? profile.playStyle.map(style => t(`opt_${style}`)).join(', ')
    : '—'

  return (
    <div className="h-full flex flex-col p-6 gap-4">
      <div className="text-center mb-2">
        <p className="text-gray-500 text-xs uppercase tracking-widest">{t('card_details')}</p>
        <h3 className="text-white font-black text-lg mt-1">{profile.nickname}</h3>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        <BackRow label={t('label_fear')} value={`${fearIcon} ${fearLabel}`} />
        <BackRow label={t('label_style')} value={`${puzzleIcon} ${styleLabel}`} />
        <BackRow
          label={t('label_genres')}
          value={genresLabel}
        />
        <BackRow
          label={t('label_play_style')}
          value={playStyleLabel}
        />
        <BackRow
          label={t('label_experience')}
          value={`${tierLabel} (${t('rooms_count', { count: profile.playCount })})`}
        />
      </div>

      <p className="text-center text-gray-700 text-xs mt-auto">
        {t('watermark')}
      </p>
    </div>
  )
}

function TraitBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-500 text-xs">{label}</span>
    </div>
  )
}

function BackRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-800">
      <span className="text-gray-500 text-sm shrink-0">{label}</span>
      <span className="text-white text-sm text-right">{value}</span>
    </div>
  )
}

// ─── Share button ─────────────────────────────────────────────────

function ShareButton({
  shareBlob, nickname, t,
}: {
  shareBlob: Blob | null
  nickname: string
  t: (key: string) => string
}) {
  async function handleShare() {
    if (!shareBlob) return
    const file = new File([shareBlob], `${nickname}-escape-room-card.png`, { type: 'image/png' })

    // iOS: use Web Share API
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'My Escape Room Card' })
        return
      } catch {
        // User cancelled or share failed — fall through to download
      }
    }

    // Desktop / fallback: trigger download
    const url = URL.createObjectURL(shareBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nickname}-escape-room-card.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleShare}
      disabled={!shareBlob}
      className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800
                 disabled:text-gray-600 text-white font-semibold py-3 rounded-2xl
                 transition-all active:scale-95 flex items-center justify-center gap-2"
    >
      <span>{shareBlob ? t('save_card') : t('preparing')}</span>
    </button>
  )
}

// ─── Canvas composition ───────────────────────────────────────────

async function composeShareCanvas(
  profile: QuizProfile,
  tagline: string,
  tierLabel: string,
): Promise<Blob | null> {
  const SIZE = 1080
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const genreStops = getGenreStops(profile.genres)
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, SIZE)
  genreStops.forEach((color, index) => {
    const stop = genreStops.length === 1 ? index : index / (genreStops.length - 1)
    grad.addColorStop(stop, color)
  })
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)

  const overlay = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  overlay.addColorStop(0, 'rgba(8, 10, 18, 0.18)')
  overlay.addColorStop(1, 'rgba(4, 6, 14, 0.48)')
  ctx.fillStyle = overlay
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Subtle border
  ctx.strokeStyle = `${hexToRgba(getGenreBorder(profile.genres), 0.7)}`
  ctx.lineWidth = 4
  roundRect(ctx, 20, 20, SIZE - 40, SIZE - 40, 48)
  ctx.stroke()

  const animalImage = await loadCanvasImage(SHARE_IMAGES[profile.characterId])
  ctx.drawImage(animalImage, SIZE / 2 - 280, 120, 560, 560)

  // Nickname
  ctx.fillStyle = 'rgba(167, 139, 250, 0.8)'
  ctx.font = '500 36px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(profile.nickname.toUpperCase(), SIZE / 2, 660)

  // Tagline (translated)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 64px system-ui, sans-serif'
  ctx.fillText(tagline, SIZE / 2, 740)

  // Trait icons row
  const icons = [
    FEAR_ICONS[profile.fearLevel],
    PUZZLE_ICONS[profile.puzzleStyle],
    profile.playStyle[0] ? '🎯' : '',
  ].filter(Boolean)

  ctx.font = '52px system-ui, sans-serif'
  const iconSpacing = 120
  const iconStart = SIZE / 2 - ((icons.length - 1) * iconSpacing) / 2
  icons.forEach((icon, i) => {
    ctx.fillText(icon, iconStart + i * iconSpacing, 830)
  })

  // Play count tier badge (translated)
  ctx.fillStyle = 'rgba(139, 92, 246, 0.2)'
  roundRect(ctx, SIZE / 2 - 200, 870, 400, 70, 20)
  ctx.fill()
  ctx.fillStyle = '#c4b5fd'
  ctx.font = '500 32px system-ui, sans-serif'
  ctx.fillText(
    `${tierLabel}  ${PLAY_COUNT_STARS[profile.playCount]}`,
    SIZE / 2, 915
  )

  // Watermark
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.font = '24px system-ui, sans-serif'
  ctx.fillText('🔒 Escape Room Card', SIZE / 2, SIZE - 40)

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png', 0.92)
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function loadCanvasImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

const GENRE_COLORS: Record<string, string> = {
  Horror: '#3b1021',
  MysteryThriller: '#173467',
  FantasyAdventure: '#23644e',
  Emotional: '#d94f8a',
  Comic: '#c24b16',
}

function getGenreStops(genres: string[]): string[] {
  const stops = genres
    .map(genre => GENRE_COLORS[genre])
    .filter((color): color is string => Boolean(color))

  if (stops.length === 0) return ['#171725', '#09090f']
  if (stops.length === 1) return [lightenColor(stops[0], 0.16), darkenColor(stops[0], 0.22)]
  return stops.map(color => darkenColor(color, 0.08))
}

function getGenreBackground(genres: string[]): CSSProperties['background'] {
  const stops = getGenreStops(genres)
  return `linear-gradient(135deg, ${stops.join(', ')})`
}

function getGenreBorder(genres: string[]): string {
  const first = genres.find(genre => GENRE_COLORS[genre])
  return first ? lightenColor(GENRE_COLORS[first], 0.32) : '#3f3f46'
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized
  const num = Number.parseInt(value, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function lightenColor(hex: string, amount: number): string {
  return adjustColor(hex, amount)
}

function darkenColor(hex: string, amount: number): string {
  return adjustColor(hex, -amount)
}

function adjustColor(hex: string, amount: number): string {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized
  const num = Number.parseInt(value, 16)
  const clamp = (channel: number) => Math.max(0, Math.min(255, channel))
  const offset = Math.round(255 * amount)
  const r = clamp(((num >> 16) & 255) + offset)
  const g = clamp(((num >> 8) & 255) + offset)
  const b = clamp((num & 255) + offset)
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('')}`
}
