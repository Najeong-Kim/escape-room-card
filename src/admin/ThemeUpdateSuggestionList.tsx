import { useCallback, useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import { useNotify } from 'react-admin'
import { supabase } from '../lib/supabaseClient'
import { adminUpdate } from './adminClient'

interface SuggestionTheme {
  id: number
  name: string
  cafes: {
    name: string
    branch_name: string | null
  } | {
    name: string
    branch_name: string | null
  }[] | null
}

interface ThemeUpdateSuggestion {
  id: number
  theme_id: number
  source_name: string
  source_url: string | null
  suggested_changes: Record<string, { from: unknown; to: unknown }>
  current_snapshot: Record<string, unknown>
  status: string
  created_at: string
  themes: SuggestionTheme | null
}

type RawThemeUpdateSuggestion = Omit<ThemeUpdateSuggestion, 'themes'> & {
  themes: SuggestionTheme | SuggestionTheme[] | null
}

const containerStyle = { padding: 24 }
const cardStyle = {
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: 8,
  padding: 16,
  background: '#fff',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
}
const mutedStyle = { color: 'rgba(0, 0, 0, 0.56)' }

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    name: '테마명',
    genre_labels: '장르',
    duration_minutes: '제한시간',
    min_players: '최소 인원',
    max_players: '최대 인원',
    price_text: '가격 원문',
    price_per_person: '가격 (2인 기준)',
    image_url: '이미지 URL',
    image_source_url: '이미지 출처 URL',
    image_source_name: '이미지 출처',
    image_status: '이미지 상태',
    difficulty_label: '난이도 원문',
    difficulty_score: '난이도',
    fear_label: '공포도 원문',
    fear_score: '공포도',
    activity_label: '활동성 원문',
    activity_score: '활동성',
    story_label: '스토리 원문',
    story_score: '스토리',
    interior_label: '인테리어 원문',
    interior_score: '인테리어',
    aging_label: '노후화 원문',
    aging_score: '노후화',
  }
  return labels[field] ?? field
}

function firstTheme(theme: RawThemeUpdateSuggestion['themes']) {
  return Array.isArray(theme) ? (theme[0] ?? null) : theme
}

function firstCafe(cafe: SuggestionTheme['cafes']) {
  return Array.isArray(cafe) ? (cafe[0] ?? null) : cafe
}

export function ThemeUpdateSuggestionList() {
  const notify = useNotify()
  const [items, setItems] = useState<ThemeUpdateSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const loadItems = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('theme_update_suggestions')
      .select('id,theme_id,source_name,source_url,suggested_changes,current_snapshot,status,created_at,themes(id,name,cafes(name,branch_name))')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    setLoading(false)

    if (error) {
      notify(`변경 제안을 불러오지 못했습니다: ${error.message}`, { type: 'error' })
      return
    }

    setItems(((data ?? []) as unknown as RawThemeUpdateSuggestion[]).map(item => ({
      ...item,
      themes: firstTheme(item.themes),
    })))
  }, [notify])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  async function approve(item: ThemeUpdateSuggestion) {
    setProcessingId(item.id)
    const patch = Object.fromEntries(
      Object.entries(item.suggested_changes).map(([field, change]) => [field, change.to]),
    )

    try {
      await adminUpdate('themes', patch, { column: 'id', value: item.theme_id })
      await adminUpdate('theme_update_suggestions', { status: 'approved', reviewed_at: new Date().toISOString() }, { column: 'id', value: item.id })
    } catch (err) {
      setProcessingId(null)
      notify(`승인 반영에 실패했습니다: ${err instanceof Error ? err.message : String(err)}`, { type: 'error' })
      return
    }

    setProcessingId(null)
    setItems(current => current.filter(currentItem => currentItem.id !== item.id))
    notify('변경 제안을 승인했습니다.', { type: 'success' })
  }

  async function reject(item: ThemeUpdateSuggestion) {
    setProcessingId(item.id)

    try {
      await adminUpdate('theme_update_suggestions', { status: 'rejected', reviewed_at: new Date().toISOString() }, { column: 'id', value: item.id })
    } catch (err) {
      setProcessingId(null)
      notify(`거절 처리에 실패했습니다: ${err instanceof Error ? err.message : String(err)}`, { type: 'error' })
      return
    }

    setProcessingId(null)
    setItems(current => current.filter(currentItem => currentItem.id !== item.id))
    notify('변경 제안을 거절했습니다.', { type: 'success' })
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>테마 변경 제안</h1>
          <p style={{ ...mutedStyle, margin: '6px 0 0' }}>
            승인된 운영 테마에 대한 크롤링 변경 제안을 확인합니다.
          </p>
        </div>
        <Button onClick={loadItems} disabled={loading}>새로고침</Button>
      </div>

      {loading ? (
        <p style={mutedStyle}>불러오는 중...</p>
      ) : items.length === 0 ? (
        <div style={cardStyle}>대기 중인 변경 제안이 없습니다.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map(item => {
            const theme = item.themes
            const cafe = theme ? firstCafe(theme.cafes) : null
            const cafeName = cafe ? `${cafe.name}${cafe.branch_name ? ` ${cafe.branch_name}` : ''}` : '매장 정보 없음'

            return (
              <article key={item.id} style={cardStyle}>
                <div className="approval-card-header">
                  <div className="approval-card-title">
                    <p style={{ ...mutedStyle, margin: '0 0 4px' }}>{cafeName}</p>
                    <h2 style={{ margin: 0, fontSize: 20 }}>{theme?.name ?? `테마 #${item.theme_id}`}</h2>
                    <p style={{ ...mutedStyle, margin: '6px 0 0' }}>
                      {item.source_name}
                      {item.source_url ? <> · <a href={item.source_url} target="_blank" rel="noreferrer">출처 열기</a></> : null}
                    </p>
                  </div>
                  <div className="approval-card-actions">
                    <Button variant="contained" disabled={processingId === item.id} onClick={() => approve(item)}>승인</Button>
                    <Button color="error" disabled={processingId === item.id} onClick={() => reject(item)}>거절</Button>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                  {Object.entries(item.suggested_changes).map(([field, change]) => (
                    <div key={field} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12, alignItems: 'start' }}>
                      <strong>{fieldLabel(field)}</strong>
                      <div>
                        <p style={{ ...mutedStyle, margin: 0 }}>현재</p>
                        <p style={{ margin: '4px 0 0', wordBreak: 'break-all' }}>{formatValue(change.from)}</p>
                      </div>
                      <div>
                        <p style={{ ...mutedStyle, margin: 0 }}>제안</p>
                        <p style={{ margin: '4px 0 0', wordBreak: 'break-all' }}>{formatValue(change.to)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
