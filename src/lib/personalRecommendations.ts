import type { CommunityMetricStats, CommunityRating, MetricKey } from './communityRatings'
import type { Room } from './recommend'
import type { RoomLog } from './roomLog'
import type { PathRating } from './ratings'
import { getRatingDef, pathRatingToScore10, score10ToPathRating } from './ratings'

const METRICS: MetricKey[] = ['difficulty', 'fear', 'activity', 'story', 'interior', 'aging']

const GENRE_LABEL: Record<string, string> = {
  Horror: '공포',
  MysteryThriller: '미스터리/스릴러',
  Emotional: '감성/드라마',
  Comic: '코믹',
  FantasyAdventure: '판타지/모험',
  Crime: '범죄/잠입',
  SF: 'SF',
}

const METRIC_LABEL: Record<MetricKey, string> = {
  difficulty: '난이도',
  fear: '공포도',
  activity: '활동성',
  story: '스토리',
  interior: '인테리어',
  aging: '노후화',
}

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
  communityRatings: Record<number, CommunityRating> = {},
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
      if (genreScore > 0.25) {
        const bestGenre = matchedGenres
          .filter(item => item.value > 0)
          .sort((a, b) => b.value - a.value)[0]?.genre
        reasons.push(bestGenre
          ? `좋게 평가한 ${GENRE_LABEL[bestGenre] ?? bestGenre} 장르와 가까워요`
          : '좋게 평가한 장르와 가까워요')
      }
    }

    let metricMatches = 0
    let metricAdjustment = 0
    const closeMetrics: MetricKey[] = []
    for (const metric of METRICS) {
      const target = metricTargets.get(metric)
      if (!target) continue
      const roomScore = communityMetricStats[room.id]?.[metric]?.score10 ?? roomMetricScore(room, metric)
      if (roomScore === null || roomScore === undefined) continue

      const preferred = target.total / target.weight
      const distance = Math.abs(preferred - roomScore)
      metricAdjustment += (1 - distance / 5) * 0.28
      metricMatches += 1
      if (distance <= 1.4) closeMetrics.push(metric)
    }

    if (metricMatches > 0) {
      score += clamp(metricAdjustment, -1.3, 1.3)
      if (metricAdjustment > 0.35) {
        const firstMetric = closeMetrics[0]
        reasons.push(firstMetric
          ? `선호한 ${METRIC_LABEL[firstMetric]}와 비슷해요`
          : '난이도와 분위기가 취향에 맞아요')
      }
    }

    const communityRating = communityRatings[room.id]
    if (communityRating && communityRating.count >= 3) {
      const communityAdj = clamp((communityRating.score10 - 5) * 0.3, -1.5, 1.5)
      score += communityAdj
      if (communityRating.score10 >= 7.5) reasons.push(`유저 평균 ${formatScore(communityRating.score10)}/10으로 평가가 좋아요`)
      else if (communityRating.score10 <= 4) reasons.push('유저 평가가 낮은 편이에요')
    }

    if (!playedIds.has(room.id)) {
      const averageFear = metricTargets.get('fear')
      const preferredFear = averageFear ? averageFear.total / averageFear.weight : null
      if (preferredFear !== null && roomMetricScore(room, 'fear') !== null && Math.abs((roomMetricScore(room, 'fear') ?? 0) - preferredFear) <= 1.2) {
        reasons.push('공포도 취향이 잘 맞아요')
      }
      if (!reasons.length && room.location) reasons.push(`${room.location}에서 취향과 가까운 테마예요`)
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
      reasons: reasons.filter((reason, index, all) => all.indexOf(reason) === index).slice(0, 2),
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
  return score10ToPathRating(prediction.score10) ?? 0
}

export function predictionPathLabel(prediction: PersonalPrediction) {
  const def = getRatingDef(predictionPathRating(prediction))
  return def ? `예상 ${def.label}` : '예상 길'
}

export function predictionConfidenceLabel(prediction: PersonalPrediction) {
  if (prediction.confidence === 'high') return '내 기록 기반'
  if (prediction.confidence === 'medium') return '취향 반영'
  return '초기 추천'
}
