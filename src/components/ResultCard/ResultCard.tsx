import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { QuizProfile } from '../../lib/traitMap'
import {
  DISPLAY_IMAGES, ANIMAL_EMOJIS,
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

  // Pre-compose share image when card mounts
  useEffect(() => {
    composeShareCanvas(profile).then(blob => {
      if (blob) setShareBlob(blob)
    })
  }, [profile])

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
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Your escape room card</p>
        <h1 className="text-3xl font-black text-white">{profile.tagline}</h1>
      </div>

      {/* Card with flip */}
      <div
        className="card-scene w-full"
        style={{ height: '420px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="card-face rounded-3xl overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 shadow-2xl">
            <CardFront
              profile={profile}
              displayImg={displayImg}
              fearIcon={fearIcon}
              puzzleIcon={puzzleIcon}
              stars={stars}
            />
          </div>

          {/* Back */}
          <div className="card-face card-face-back rounded-3xl overflow-hidden bg-gray-950 border border-gray-800 shadow-2xl">
            <CardBack profile={profile} fearIcon={fearIcon} puzzleIcon={puzzleIcon} />
          </div>
        </div>
      </div>

      {/* Flip hint */}
      <p className="text-gray-600 text-xs">Tap card to flip</p>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3">
        <ShareButton shareBlob={shareBlob} nickname={profile.nickname} />

        <button
          onClick={onReset}
          className="w-full border border-gray-800 hover:border-gray-600 text-gray-400
                     hover:text-white py-3 rounded-2xl transition-all text-sm font-medium"
        >
          Try again
        </button>
      </div>

      {/* Hidden canvas for share */}
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  )
}

// ─── Card faces ───────────────────────────────────────────────────

function CardFront({
  profile, displayImg, fearIcon, puzzleIcon, stars,
}: {
  profile: QuizProfile
  displayImg: string
  fearIcon: string
  puzzleIcon: string
  stars: string
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
        <h2 className="text-white text-xl font-black">{profile.tagline}</h2>
      </div>

      {/* Trait icons row */}
      <div className="px-6 pb-4 flex justify-center gap-6">
        <TraitBadge icon={fearIcon} label={profile.fearLevel} />
        <TraitBadge icon={puzzleIcon} label={profile.puzzleStyle} />
        {profile.playStyle[0] && (
          <TraitBadge icon="🎯" label={profile.playStyle[0]} />
        )}
      </div>

      {/* Play count badge */}
      <div className="mx-6 mb-5 bg-violet-900/30 border border-violet-700/40 rounded-xl px-4 py-2
                      flex items-center justify-between">
        <span className="text-violet-300 text-xs font-semibold uppercase tracking-wider">
          {profile.playCountTier.label}
        </span>
        <span className="text-yellow-400 text-sm tracking-tight">{stars}</span>
      </div>
    </div>
  )
}

function CardBack({
  profile, fearIcon, puzzleIcon,
}: {
  profile: QuizProfile
  fearIcon: string
  puzzleIcon: string
}) {
  return (
    <div className="h-full flex flex-col p-6 gap-4">
      <div className="text-center mb-2">
        <p className="text-gray-500 text-xs uppercase tracking-widest">Card Details</p>
        <h3 className="text-white font-black text-lg mt-1">{profile.nickname}</h3>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        <BackRow label="Fear level" value={`${fearIcon} ${capitalize(profile.fearLevel)}`} />
        <BackRow label="Style" value={`${puzzleIcon} ${capitalize(profile.puzzleStyle)}`} />
        <BackRow
          label="Genres"
          value={profile.genres.length > 0 ? profile.genres.join(', ') : '—'}
        />
        <BackRow
          label="Play style"
          value={profile.playStyle.length > 0 ? profile.playStyle.join(', ') : '—'}
        />
        <BackRow
          label="Experience"
          value={`${profile.playCountTier.label} (${profile.playCount} rooms)`}
        />
      </div>

      <p className="text-center text-gray-700 text-xs mt-auto">
        🔒 Escape Room Profile Card
      </p>
    </div>
  )
}

function TraitBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-500 text-xs capitalize">{label}</span>
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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Share button ─────────────────────────────────────────────────

function ShareButton({ shareBlob, nickname }: { shareBlob: Blob | null; nickname: string }) {
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
      <span>{shareBlob ? '💾 Save Card' : '⏳ Preparing...'}</span>
    </button>
  )
}

// ─── Canvas composition ───────────────────────────────────────────
// Runs in background when card mounts. No dependency on fabric.js needed
// for a simple composition — pure canvas API is sufficient here.

async function composeShareCanvas(profile: QuizProfile): Promise<Blob | null> {
  const SIZE = 1080
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, SIZE)
  grad.addColorStop(0, '#0d0d18')
  grad.addColorStop(1, '#0a0a0f')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Subtle border
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'
  ctx.lineWidth = 4
  roundRect(ctx, 20, 20, SIZE - 40, SIZE - 40, 48)
  ctx.stroke()

  // Character animal emoji
  ctx.font = '220px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(ANIMAL_EMOJIS[profile.characterId], SIZE / 2, 380)
  ctx.textBaseline = 'alphabetic'

  // Nickname
  ctx.fillStyle = 'rgba(167, 139, 250, 0.8)'
  ctx.font = '500 36px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(profile.nickname.toUpperCase(), SIZE / 2, 660)

  // Tagline
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 64px system-ui, sans-serif'
  ctx.fillText(profile.tagline, SIZE / 2, 740)

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

  // Play count tier badge
  ctx.fillStyle = 'rgba(139, 92, 246, 0.2)'
  roundRect(ctx, SIZE / 2 - 200, 870, 400, 70, 20)
  ctx.fill()
  ctx.fillStyle = '#c4b5fd'
  ctx.font = '500 32px system-ui, sans-serif'
  ctx.fillText(
    `${profile.playCountTier.label}  ${PLAY_COUNT_STARS[profile.playCount]}`,
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
