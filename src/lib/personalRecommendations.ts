import type { CommunityMetricStats, MetricKey } from './communityRatings'
import type { Room } from './recommend'
import type { RoomLog } from './roomLog'
import type { PathRating } from './ratings'
import { getRatingDef } from './ratings'

const METRICS: MetricKey[] = ['difficulty', 'fear', 'activity', 'story', 'interior', 'aging']

export interface PersonalPrediction {
  roomId: number
  score10: number
  confidence: 'low' | 'medium' | 'high'
  reasons: string[]
  played: boolean
}

export interface PersonalRecommendationModel {
  predictions: Record<number, PersonalPrediction>
  lifeTheme: {
    room: Room
    prediction: PersonalPrediction
  } | null
  ratedLogCount: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function pathRatingToScore10(rating: RoomLog['rating']) {
  if (rating === null || rating === undefined) return null
  if (rating === 0) return 1
  return rating * 2
}

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

function roomMetricScore(room: Room, key: MetricKey) {
  const official = room.official_scores?.[key]
  if (official !== null && official !== undefined) return official

  if (key === 'difficulty') return room.difficulty * 2
  if (key === 'fear') return room.fear_level * 2
  if (key === 'activity') return room.activity_level * 2
  if (key === 'interior') return room.interior_score * 2

  return null
}

function logMetricScore(log: RoomLog, room: Room | undefined, key: MetricKey) {
  if (key === 'difficulty' && log.difficulty_score !== null && log.difficulty_score !== undefined) return log.difficulty_score
  if (key === 'fear' && log.fear_score !== null && log.fear_score !== undefined) return log.fear_score
  if (key === 'activity' && log.activity_score !== null && log.activity_score !== undefined) return log.activity_score
  if (key === 'story' && log.story_score !== null && log.story_score !== undefined) return log.story_score
  if (key === 'interior' && log.interior_score !== null && log.interior_score !== undefined) return log.interior_score
  if (key === 'aging' && log.aging_score !== null && log.aging_score !== undefined) return log.aging_score

  return room ? roomMetricScore(room, key) : null
}

export function buildPersonalRecommendationModel(
  rooms: Room[],
  logs: RoomLog[],
  communityMetricStats: Record<number, CommunityMetricStats> = {},
): PersonalRecommendationModel | null {
  const roomById = new Map(rooms.map(room => [room.id, room]))
  const ratedLogs = logs
    .map(log => ({ log, score10: pathRatingToScore10(log.rating), room: roomById.get(log.room_id) }))
    .filter((item): item is { log: RoomLog; score10: number; room: Room | undefined } => item.score10 !== null)

  if (ratedLogs.length === 0) return null

  const playedIds = new Set(logs.map(log => log.room_id))
  const averageUserScore = ratedLogs.reduce((sum, item) => sum + item.score10, 0) / ratedLogs.length
  const genreWeights = new Map<string, { total: number; count: number }>()
  const metricTargets = new Map<MetricKey, { total: number; weight: number }>()

  for (const { log, score10, room } of ratedLogs) {
    const likeWeight = (score10 - 5) / 5
    for (const genre of room?.genres ?? []) {
      const current = genreWeights.get(genre) ?? { total: 0, count: 0 }
      current.total += likeWeight
      current.count += 1
      genreWeights.set(genre, current)
    }

    for (const metric of METRICS) {
      const value = logMetricScore(log, room, metric)
      if (value === null || value === undefined) continue
      const current = metricTargets.get(metric) ?? { total: 0, weight: 0 }
      const weight = Math.max(0.35, score10 / 10)
      current.total += value * weight
      current.weight += weight
      metricTargets.set(metric, current)
    }
  }

  const predictions = Object.fromEntries(rooms.map(room => {
    let score = clamp(averageUserScore, 5.5, 8.5)
    const reasons: string[] = []

    const matchedGenres = room.genres
      .map(genre => ({ genre, pref: genreWeights.get(genre) }))
      .filter((item): item is { genre: string; pref: { total: number; count: number } } => Boolean(item.pref))
      .map(item => ({ genre: item.genre, value: item.pref.total / item.pref.count }))

    if (matchedGenres.length > 0) {
      const genreScore = matchedGenres.reduce((sum, item) => sum + item.value, 0) / matchedGenres.length
      score += clamp(genreScore * 1.2, -1.2, 1.2)
      if (genreScore > 0.25) reasons.push('좋게 평가한 장르와 가까워요')
    }

    let metricMatches = 0
    let metricAdjustment = 0
    for (const metric of METRICS) {
      const target = metricTargets.get(metric)
      if (!target) continue
      const roomScore = communityMetricStats[room.id]?.[metric]?.score10 ?? roomMetricScore(room, metric)
      if (roomScore === null || roomScore === undefined) continue

      const preferred = target.total / target.weight
      const distance = Math.abs(preferred - roomScore)
      metricAdjustment += (1 - distance / 5) * 0.28
      metricMatches += 1
    }

    if (metricMatches > 0) {
      score += clamp(metricAdjustment, -1.3, 1.3)
      if (metricAdjustment > 0.35) reasons.push('난이도와 분위기가 취향에 맞아요')
    }

    if (playedIds.has(room.id)) {
      score -= 0.4
      reasons.push('이미 기록한 테마예요')
    }

    const confidence = ratedLogs.length >= 5 && metricMatches >= 3
      ? 'high'
      : ratedLogs.length >= 2
        ? 'medium'
        : 'low'

    const prediction: PersonalPrediction = {
      roomId: room.id,
      score10: Number(clamp(score, 1, 10).toFixed(1)),
      confidence,
      reasons: reasons.slice(0, 2),
      played: playedIds.has(room.id),
    }

    return [room.id, prediction]
  }))

  const lifeTheme = rooms
    .filter(room => !playedIds.has(room.id))
    .map(room => ({ room, prediction: predictions[room.id] }))
    .filter(item => Boolean(item.prediction))
    .sort((a, b) => b.prediction.score10 - a.prediction.score10)[0] ?? null

  return {
    predictions,
    lifeTheme,
    ratedLogCount: ratedLogs.length,
  }
}

export function predictionLabel(prediction: PersonalPrediction) {
  return `예상 ${formatScore(prediction.score10)}/10`
}

export function predictionPathRating(prediction: PersonalPrediction): PathRating {
  return Math.max(0, Math.min(5, Math.round(prediction.score10 / 2))) as PathRating
}

export function predictionPathLabel(prediction: PersonalPrediction) {
  const def = getRatingDef(predictionPathRating(prediction))
  return def ? `예상 ${def.label}` : '예상 길'
}
