import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { QuizProfile } from '../../lib/traitMap'
import { Link } from 'react-router-dom'
import {
  getCharacterImage,
} from './characterAssets'
import { getRecommendations, type RecommendedRoom } from '../../lib/recommend'
import {
  fetchSimilarProfileFavoriteThemes,
  type SimilarProfileFavoriteTheme,
} from '../../lib/userCardProfile'
import { SHOW_COMMUNITY_RATING_COUNTS } from '../../lib/featureFlags'
import { BrandLogo } from '../BrandLogo'

// ─── Character accent colours & stats ─────────────────────────

const CHARACTER_ACCENTS: Record<string, string> = {
  brave_puzzle:    '#FBBF24',
  brave_device:    '#F97316',
  brave_balanced:  '#A78BFA',
  neutral_puzzle:  '#FB923C',
  neutral_device:  '#06B6D4',
  neutral_balanced:'#10B981',
  scared_any:      '#EC4899',
}

const CHARACTER_NAMES: Record<string, string> = {
  brave_puzzle:    '사자',
  brave_device:    '호랑이',
  brave_balanced:  '늑대',
  neutral_puzzle:  '여우',
  neutral_device:  '고양이',
  neutral_balanced:'독수리',
  scared_any:      '토끼',
}


interface Props {
  profile: QuizProfile
  onReset: () => void
  onHome?: () => void
}

export function ResultCard({ profile, onReset, onHome }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [shareBlob, setShareBlob] = useState<Blob | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { t, i18n } = useTranslation()

  const [recommendations, setRecommendations] = useState<RecommendedRoom[]>([])
  const [similarFavorites, setSimilarFavorites] = useState<SimilarProfileFavoriteTheme[]>([])
  useEffect(() => {
    getRecommendations(profile).then(setRecommendations).catch(() => {})
    fetchSimilarProfileFavoriteThemes(profile, 3, 2).then(setSimilarFavorites).catch(() => {})
  }, [profile])

  const tagline = t(`tagline_${profile.characterId}`)
  const tierLabel = t(`tier_${profile.playCountTier.label}`)
  const accent = CHARACTER_ACCENTS[profile.characterId] ?? '#14b8a6'
  const filledBars = profile.playCountTier.stars  // 0–4

  // Re-compose share image when card mounts or language changes
  useEffect(() => {
    composeShareCanvasBothSides(profile, tagline, tierLabel).then(blob => {
      if (blob) setShareBlob(blob)
    })
  }, [profile, i18n.language, tagline, tierLabel])

  const displayImg = getCharacterImage(profile.characterId, profile.playCount)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center min-h-dvh max-w-md mx-auto px-6 pt-5 pb-8 gap-6"
    >
      <div className="text-center">
        <BrandLogo className="mx-auto mb-2 h-10 w-10 drop-shadow-[0_0_18px_rgba(20,184,166,0.38)]" />
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">{t('result_subtitle')}</p>
        <h1 className="text-3xl font-black text-white">{tagline}</h1>
      </div>

      {/* Card with flip — same size as landing page sample card (320×460) */}
      <div
        className="card-scene"
        style={{ width: 320, height: 460, cursor: 'pointer' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div
            className="card-face card-noise rounded-3xl overflow-hidden"
            style={{
              background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 24%, var(--color-surface)) 0%, var(--color-surface) 70%)`,
              border: `1px solid color-mix(in srgb, ${accent} 30%, var(--color-border))`,
              boxShadow: `0 24px 60px -12px rgba(0,0,0,.18), 0 0 40px -12px ${accent}55`,
            }}
          >
            <CardFront
              profile={profile}
              displayImg={displayImg}
              tagline={tagline}
              accent={accent}
              filledBars={filledBars}
            />
          </div>

          {/* Back */}
          <div
            className="card-face card-face-back rounded-3xl overflow-hidden"
            style={{
              background: 'var(--color-surface)',
              border: `1px solid color-mix(in srgb, ${accent} 20%, var(--color-border))`,
            }}
          >
            <CardBack
              profile={profile}
              accent={accent}
            />
          </div>
        </div>
      </div>

      {/* Flip hint */}
      <p className="text-gray-600 text-xs">{t('tap_to_flip')}</p>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3">
        <ShareButton shareBlob={shareBlob} nickname={profile.nickname} t={t} />

        {onHome && (
          <button
            onClick={onHome}
            className="w-full bg-white text-gray-950 font-semibold py-3 rounded-2xl transition-all active:scale-95"
          >
            홈으로
          </button>
        )}

        <button
          onClick={onReset}
          className="w-full border border-gray-800 hover:border-gray-600 text-gray-400
                     hover:text-white py-3 rounded-2xl transition-all text-sm font-medium"
        >
          {t('try_again')}
        </button>
      </div>

      {/* Recommended rooms */}
      <SimilarProfileFavorites themes={similarFavorites} />
      <RecommendedRooms rooms={recommendations} t={t} />

      {/* Hidden canvas for share */}
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  )
}

// ─── Card faces ───────────────────────────────────────────────────

function CardFront({
  profile, displayImg, tagline, accent, filledBars,
}: {
  profile: QuizProfile
  displayImg: string
  tagline: string
  accent: string
  filledBars: number
}) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16, position: 'relative', zIndex: 2 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '.1em' }}>
          BANGTANG · 001
        </div>
        <BrandLogo className="h-[22px] w-[22px]" />
      </div>

      {/* Character image — contained, not cropped */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={displayImg}
          alt={profile.characterId}
          style={{
            width: '82%', height: '82%', objectFit: 'contain',
            filter: `drop-shadow(0 12px 24px ${accent}66)`,
          }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }}
        />
      </div>

      {/* Bottom info */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2, letterSpacing: '.05em' }}>
          {tagline}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
          {profile.nickname}
        </div>
        {/* Segment bars representing play count tier */}
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i < filledBars ? accent : 'var(--color-border)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function CardBack({
  profile, accent,
}: {
  profile: QuizProfile
  accent: string
}) {
  const { t } = useTranslation()
  const charName = CHARACTER_NAMES[profile.characterId] ?? ''

  const fearPct   = ({ brave: 90, calm: 55, cautious: 20 } as const)[profile.fearLevel] ?? 50
  const fearLabel = ({ brave: '용감함', calm: '침착함', cautious: '신중함' } as const)[profile.fearLevel] ?? ''
  const puzzlePct   = ({ puzzle: 90, balanced: 50, device: 20 } as const)[profile.puzzleStyle] ?? 50
  const puzzleLabel = ({ puzzle: '퍼즐형', balanced: '밸런스형', device: '장치형' } as const)[profile.puzzleStyle] ?? ''
  const expPct   = profile.playCountTier.stars * 25
  const expLabel = t(`tier_${profile.playCountTier.label}`)

  const bars = [
    { label: '공포 내성', pct: fearPct,   value: fearLabel },
    { label: '탐색 방식', pct: puzzlePct, value: puzzleLabel },
    { label: '경험치',    pct: expPct,    value: expLabel },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 18, position: 'relative', zIndex: 2 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
        <span style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)', letterSpacing: '.08em' }}>PROFILE</span>
        <span style={{ color: accent, fontWeight: 700 }}>{charName}형</span>
      </div>

      {/* Stat bars — actual user data */}
      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {bars.map(({ label, pct, value }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
              <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{value}</span>
            </div>
            <div style={{ height: 5, background: 'var(--color-surface-raised)', borderRadius: 99 }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: `linear-gradient(90deg, var(--color-brand-primary), ${accent})`,
                borderRadius: 99,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Genre tags */}
      {profile.genres.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 6, fontFamily: 'monospace', letterSpacing: '.06em' }}>
            GENRES
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {profile.genres.map(g => (
              <span
                key={g}
                style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 99,
                  background: `color-mix(in srgb, ${accent} 14%, var(--color-surface-raised))`,
                  color: accent,
                  border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`,
                }}
              >
                {GENRE_LABELS[g] ?? g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Play style tags */}
      {profile.playStyle.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 6, fontFamily: 'monospace', letterSpacing: '.06em' }}>
            STYLE
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {profile.playStyle.map(s => (
              <span
                key={s}
                style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 99,
                  background: 'var(--color-surface-raised)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {t(`opt_${s}`) || s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer logo */}
      <div style={{ marginTop: 'auto', textAlign: 'center', paddingTop: 8 }}>
        <BrandLogo className="mx-auto h-7 w-7 opacity-45" />
      </div>
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
    const file = new File([shareBlob], `${nickname}-bangtang-card.png`, { type: 'image/png' })

    // iOS: use Web Share API
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: '방탕' })
        return
      } catch {
        // User cancelled or share failed — fall through to download
      }
    }

    // Desktop / fallback: trigger download
    const url = URL.createObjectURL(shareBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nickname}-bangtang-card.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleShare}
      disabled={!shareBlob}
      className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-800
                 disabled:text-gray-600 text-white font-semibold py-3 rounded-2xl
                 transition-all active:scale-95 flex items-center justify-center gap-2"
    >
      <span>{shareBlob ? t('save_card') : t('preparing')}</span>
    </button>
  )
}

function SimilarProfileFavorites({ themes }: { themes: SimilarProfileFavoriteTheme[] }) {
  if (themes.length === 0) return null

  return (
    <div className="w-full">
      <div className="mb-3">
        <p className="text-gray-500 text-xs uppercase tracking-widest">취향이 비슷한 사람들</p>
        <h2 className="text-white font-bold text-lg">같은 카드 사람들이 좋아한 테마</h2>
        <p className="text-gray-600 text-xs mt-1">최소 2명 이상이 좋게 평가한 테마만 보여드려요.</p>
      </div>
      <div className="flex flex-col gap-3">
        {themes.map(theme => (
          <Link
            key={theme.theme_id}
            to={`/rooms/${theme.theme_id}`}
            className="bg-[#13131a] border border-white/8 rounded-2xl overflow-hidden flex gap-3 hover:border-teal-500/40 hover:bg-[#16161f] transition-all"
          >
            {theme.image_url ? (
              <img
                src={theme.image_url}
                alt={theme.name}
                className="w-24 min-h-28 object-cover"
                onError={event => { (event.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="w-24 min-h-28 bg-teal-950/20 flex items-center justify-center text-2xl opacity-40">
                🔐
              </div>
            )}
            <div className="min-w-0 flex-1 py-3 pr-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">{theme.brand}</p>
                  <h3 className="text-white text-sm font-semibold leading-snug mt-0.5">{theme.name}</h3>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-teal-300 text-sm font-black">{theme.score_10}</p>
                  <p className="text-gray-600 text-[11px]">/ 10</p>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                {theme.location}
                {SHOW_COMMUNITY_RATING_COUNTS
                  ? ` · ${theme.liked_count}명이 길 이상으로 평가했어요`
                  : ' · 비슷한 취향이 좋아한 테마예요'}
              </p>
              {theme.genre_labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {theme.genre_labels.slice(0, 3).map(genre => (
                    <span key={genre} className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400">
                      {GENRE_LABELS[genre] ?? genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Recommended rooms ────────────────────────────────────────────

const GENRE_LABELS: Record<string, string> = {
  Horror: '공포',
  MysteryThriller: '미스터리',
  FantasyAdventure: '판타지',
  Emotional: '감성/드라마',
  Comic: '코믹',
  Crime: '범죄/잠입',
  SF: 'SF',
}

function RecommendedRooms({
  rooms, t,
}: {
  rooms: RecommendedRoom[]
  t: (key: string) => string
}) {
  if (rooms.length === 0) return null

  return (
    <div className="w-full">
      <div className="mb-3">
        <p className="text-gray-500 text-xs uppercase tracking-widest">{t('rec_subtitle')}</p>
        <h2 className="text-white font-bold text-lg">{t('rec_title')}</h2>
      </div>
      <div className="flex flex-col gap-3">
        {rooms.map(item => (
          <RoomCard key={item.room.id} recommendation={item} t={t} />
        ))}
      </div>
    </div>
  )
}

function RoomCard({
  recommendation,
  t,
}: {
  recommendation: RecommendedRoom
  t: (key: string) => string
}) {
  const { room, reasons } = recommendation

  return (
    <div
      className="bg-gray-900/60 border border-gray-800 rounded-2xl px-4 py-3 flex flex-col gap-1"
      onClick={() => {
        // click tracking placeholder — log to console for now
        console.log('[rec_click]', { room_id: room.id, room_name: room.name })
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{room.name}</p>
          <p className="text-gray-500 text-xs">{room.brand}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-yellow-400 text-xs">★</span>
          <span className="text-gray-300 text-xs">{room.rating_avg.toFixed(1)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-500 text-xs">{t('rec_location')}: {room.location}</span>
        <div className="flex gap-1 flex-wrap">
          {room.genres.map(g => (
            <span
              key={g}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400"
            >
              {GENRE_LABELS[g] ?? g}
            </span>
          ))}
        </div>
      </div>
      {reasons[0] && (
        <p className="text-xs leading-relaxed text-teal-200/90">
          왜 추천했냐면, {reasons[0]}
        </p>
      )}
    </div>
  )
}

// ─── Canvas composition (front + back side-by-side) ───────────────

const CANVAS_STYLE_LABELS: Record<string, string> = {
  'Speed runner': '스피드런',
  'No-hint player': '노힌트',
  'Cooperative': '협동형',
  'Observer': '관찰자',
}

async function composeShareCanvasBothSides(
  profile: QuizProfile,
  tagline: string,
  tierLabel: string,
): Promise<Blob | null> {
  // Card dimensions (scaled up for quality)
  const CW = 560  // card width  (320 * 1.75)
  const CH = 800  // card height (460 * 1.74)
  const PAD = 56  // outer padding
  const GAP = 40  // gap between front and back
  const R = 40    // card border radius

  const W = PAD + CW + GAP + CW + PAD
  const H = PAD + CH + PAD

  const canvas = document.createElement('canvas')
  canvas.width  = W   // 1312
  canvas.height = H   // 912
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const accent   = CHARACTER_ACCENTS[profile.characterId] ?? '#14b8a6'
  const charName = CHARACTER_NAMES[profile.characterId]  ?? ''

  // Overall dark background
  ctx.fillStyle = '#080810'
  ctx.fillRect(0, 0, W, H)

  // Load images
  const animalImage = await loadCanvasImage(getCharacterImage(profile.characterId, profile.playCount))
  const brandLogo   = await loadCanvasImage('/brand-logo.png')

  const filledBars = profile.playCountTier.stars  // 0–4

  // ── FRONT CARD ─────────────────────────────────────────────────
  // Matches CardFront layout: header / character image (contain) / bottom info
  const fx = PAD, fy = PAD
  const FP = 28  // inner padding (16 × 1.75)

  // Background: dark surface + accent gradient overlay
  ctx.save()
  roundRect(ctx, fx, fy, CW, CH, R)
  ctx.clip()
  ctx.fillStyle = '#13131a'
  ctx.fillRect(fx, fy, CW, CH)
  const fGrad = ctx.createLinearGradient(fx, fy, fx + CW * 0.9, fy + CH * 0.7)
  fGrad.addColorStop(0, hexToRgba(accent, 0.24))
  fGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = fGrad
  ctx.fillRect(fx, fy, CW, CH)
  ctx.restore()

  // Front border
  ctx.save()
  roundRect(ctx, fx, fy, CW, CH, R)
  ctx.strokeStyle = hexToRgba(accent, 0.3)
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()

  // Header: "BANGTANG · 001" (left) + brand logo (right)
  const fHeaderY = fy + FP + 14
  ctx.font = '500 17px monospace'
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(100,116,139,0.85)'
  ctx.fillText('BANGTANG · 001', fx + FP, fHeaderY)

  const logoSize = 38  // 22px × 1.75
  ctx.globalAlpha = 0.9
  ctx.drawImage(brandLogo, fx + CW - FP - logoSize, fy + FP, logoSize, logoSize)
  ctx.globalAlpha = 1

  // Bottom section dimensions (computed first, image fills remaining space)
  const BOTTOM_H = 110  // tagline + nickname + bars + FP
  const imgAreaX = fx + FP
  const imgAreaY = fy + FP + 52           // below header
  const imgAreaW = CW - FP * 2
  const imgAreaH = CH - FP - 52 - BOTTOM_H  // remaining space for image

  // Character image — objectFit: contain, centered in imgArea
  const natW = animalImage.naturalWidth  || animalImage.width
  const natH = animalImage.naturalHeight || animalImage.height
  const maxW  = imgAreaW * 0.82
  const maxH  = imgAreaH * 0.82
  const scl   = Math.min(maxW / natW, maxH / natH)
  const dW = natW * scl, dH = natH * scl
  const dX = imgAreaX + imgAreaW / 2 - dW / 2
  const dY = imgAreaY + imgAreaH / 2 - dH / 2

  // Drop shadow (matches: drop-shadow(0 12px 24px ${accent}66))
  ctx.shadowColor   = hexToRgba(accent, 0.4)
  ctx.shadowBlur    = 42
  ctx.shadowOffsetY = 21
  ctx.drawImage(animalImage, dX, dY, dW, dH)
  ctx.shadowColor   = 'transparent'
  ctx.shadowBlur    = 0
  ctx.shadowOffsetY = 0

  // Bottom info section (bottom-aligned inside card)
  const barsBottom  = fy + CH - FP
  const barsTop     = barsBottom - 7
  const nickBaseline = barsTop - 18          // gap 10px + font descent ~8px
  const tagBaseline  = nickBaseline - 52     // 42px nickname + small gap

  // Tagline (small, muted, letterSpacing)
  ctx.font = '500 19px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(100,116,139,0.9)'
  ctx.fillText(tagline, fx + FP, tagBaseline)

  // Nickname (large, bold, heavy weight)
  ctx.font = '900 42px system-ui, sans-serif'
  ctx.fillStyle = '#f8fafc'
  ctx.fillText(profile.nickname, fx + FP, nickBaseline)

  // Segment bars (5 bars, filled up to filledBars)
  const totalBarW = CW - FP * 2
  const singleBarW = (totalBarW - 4 * 6) / 5  // 6px gap between 5 bars
  for (let i = 0; i < 5; i++) {
    const bx = fx + FP + i * (singleBarW + 6)
    ctx.fillStyle = i < filledBars ? accent : 'rgba(255,255,255,0.1)'
    roundRect(ctx, bx, barsTop, singleBarW, 7, 3)
    ctx.fill()
  }

  // ── BACK CARD ──────────────────────────────────────────────────
  const bx = PAD + CW + GAP, by = PAD
  const bCX = bx + CW / 2

  ctx.save()
  roundRect(ctx, bx, by, CW, CH, R)
  ctx.clip()
  ctx.fillStyle = '#13131a'
  ctx.fillRect(bx, by, CW, CH)
  ctx.restore()

  // Back card border
  ctx.save()
  roundRect(ctx, bx, by, CW, CH, R)
  ctx.strokeStyle = hexToRgba(accent, 0.22)
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()

  const BP  = 32  // back card inner padding
  const BIX = bx + BP
  const BRX = bx + CW - BP
  const BIW = CW - BP * 2
  const MUTED = '#94a3b8'
  const TEXTC = '#f8fafc'

  // Header: PROFILE (left) + CharName型 (right)
  const headerY = by + BP + 18
  ctx.font = '500 17px monospace'
  ctx.textAlign = 'left'
  ctx.fillStyle = MUTED
  ctx.fillText('PROFILE', BIX, headerY)
  ctx.textAlign = 'right'
  ctx.font = 'bold 17px system-ui, sans-serif'
  ctx.fillStyle = accent
  ctx.fillText(`${charName}형`, BRX, headerY)

  // Stat bars
  const fearPct   = ({ brave: 90, calm: 55, cautious: 20 } as const)[profile.fearLevel as 'brave' | 'calm' | 'cautious'] ?? 50
  const fearLabel = ({ brave: '용감함', calm: '침착함', cautious: '신중함' } as const)[profile.fearLevel as 'brave' | 'calm' | 'cautious'] ?? ''
  const puzzlePct   = ({ puzzle: 90, balanced: 50, device: 20 } as const)[profile.puzzleStyle as 'puzzle' | 'balanced' | 'device'] ?? 50
  const puzzleLabel = ({ puzzle: '퍼즐형', balanced: '밸런스형', device: '장치형' } as const)[profile.puzzleStyle as 'puzzle' | 'balanced' | 'device'] ?? ''
  const expPct = profile.playCountTier.stars * 25

  const bars = [
    { label: '공포 내성', pct: fearPct,   value: fearLabel   },
    { label: '탐색 방식', pct: puzzlePct, value: puzzleLabel },
    { label: '경험치',    pct: expPct,    value: tierLabel   },
  ]

  let curY = headerY + 26
  const BAR_H = 8, ROW_H = 56

  for (const bar of bars) {
    const labelRow = curY + 16
    const barRow   = labelRow + 13

    ctx.font = '15px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillStyle = MUTED
    ctx.fillText(bar.label, BIX, labelRow)

    ctx.textAlign = 'right'
    ctx.font = '600 15px system-ui, sans-serif'
    ctx.fillStyle = TEXTC
    ctx.fillText(bar.value, BRX, labelRow)

    // Track
    ctx.fillStyle = '#16161f'
    roundRect(ctx, BIX, barRow, BIW, BAR_H, 4)
    ctx.fill()

    // Fill
    const fw = Math.max(0, Math.round(BIW * bar.pct / 100))
    if (fw > 0) {
      const fillGrad = ctx.createLinearGradient(BIX, 0, BIX + fw, 0)
      fillGrad.addColorStop(0, '#14b8a6')
      fillGrad.addColorStop(1, accent)
      ctx.fillStyle = fillGrad
      roundRect(ctx, BIX, barRow, fw, BAR_H, 4)
      ctx.fill()
    }

    curY += ROW_H
  }

  // Genres
  if (profile.genres.length > 0) {
    curY += 18
    ctx.font = '500 13px monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = MUTED
    ctx.fillText('GENRES', BIX, curY + 13)
    curY += 28

    let tx = BIX
    ctx.font = '14px system-ui, sans-serif'
    for (const g of profile.genres) {
      const lbl  = GENRE_LABELS[g] ?? g
      const tw   = ctx.measureText(lbl).width + 22
      ctx.fillStyle = hexToRgba(accent, 0.14)
      roundRect(ctx, tx, curY - 16, tw, 28, 14)
      ctx.fill()
      ctx.strokeStyle = hexToRgba(accent, 0.28)
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = accent
      ctx.textAlign = 'center'
      ctx.fillText(lbl, tx + tw / 2, curY + 4)
      tx += tw + 8
    }
    curY += 32
  }

  // Play style tags
  if (profile.playStyle.length > 0) {
    curY += 12
    ctx.font = '500 13px monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = MUTED
    ctx.fillText('STYLE', BIX, curY + 13)
    curY += 28

    let tx = BIX
    ctx.font = '14px system-ui, sans-serif'
    for (const s of profile.playStyle) {
      const lbl = CANVAS_STYLE_LABELS[s] ?? s
      const tw  = ctx.measureText(lbl).width + 22
      ctx.fillStyle = '#16161f'
      roundRect(ctx, tx, curY - 16, tw, 28, 14)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = TEXTC
      ctx.textAlign = 'center'
      ctx.fillText(lbl, tx + tw / 2, curY + 4)
      tx += tw + 8
    }
  }

  // Back watermark logo (bottom center)
  ctx.globalAlpha = 0.2
  ctx.drawImage(brandLogo, bCX - 15, by + CH - 44, 30, 30)
  ctx.globalAlpha = 1

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
