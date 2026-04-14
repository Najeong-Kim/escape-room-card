import { useCallback, useEffect, useState } from 'react'
import { Button, useNotify } from 'react-admin'
import { supabase } from './supabaseDataProvider'

interface ApprovalCafe {
  id: number
  name: string
  branch_name: string | null
  area_label: string
  district: string
  address: string | null
  website_url: string | null
  booking_url: string | null
  needs_review: boolean
}

interface ApprovalTheme {
  id: number
  cafe_id: number
  name: string
  genre_labels: string[]
  duration_minutes: number | null
  min_players: number | null
  max_players: number | null
  price_text: string | null
  price_per_person: number | null
  booking_url: string | null
  source_url: string | null
  status: string
  needs_review: boolean
  created_at: string
  cafes: ApprovalCafe | null
}

type RawApprovalTheme = Omit<ApprovalTheme, 'cafes'> & {
  cafes: ApprovalCafe | ApprovalCafe[] | null
}

const containerStyle = {
  padding: 24,
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 20,
}

const cardStyle = {
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: 8,
  padding: 16,
  background: '#fff',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
}

const mutedStyle = {
  color: 'rgba(0, 0, 0, 0.56)',
}

function formatPlayers(theme: ApprovalTheme) {
  if (theme.min_players === null || theme.max_players === null) return '인원 미확인'
  return `${theme.min_players}-${theme.max_players}명`
}

function formatPrice(theme: ApprovalTheme) {
  if (theme.price_text) return theme.price_text
  if (theme.price_per_person === null) return '가격 미확인'
  return `${theme.price_per_person.toLocaleString()}원/인`
}

export function ThemeApprovalList() {
  const notify = useNotify()
  const [themes, setThemes] = useState<ApprovalTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const loadThemes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('themes')
      .select(`
        id,
        cafe_id,
        name,
        genre_labels,
        duration_minutes,
        min_players,
        max_players,
        price_text,
        price_per_person,
        booking_url,
        source_url,
        status,
        needs_review,
        created_at,
        cafes (
          id,
          name,
          branch_name,
          area_label,
          district,
          address,
          website_url,
          booking_url,
          needs_review
        )
      `)
      .eq('needs_review', true)
      .order('created_at', { ascending: false })

    setLoading(false)

    if (error) {
      notify(`승인 대기 목록을 불러오지 못했습니다: ${error.message}`, { type: 'error' })
      return
    }

    const normalizedThemes = ((data ?? []) as unknown as RawApprovalTheme[]).map(theme => ({
      ...theme,
      cafes: Array.isArray(theme.cafes) ? (theme.cafes[0] ?? null) : theme.cafes,
    }))

    setThemes(normalizedThemes)
  }, [notify])

  useEffect(() => {
    loadThemes()
  }, [loadThemes])

  async function reviewTheme(theme: ApprovalTheme, status: 'active' | 'rejected') {
    setProcessingId(theme.id)

    const { error: themeError } = await supabase
      .from('themes')
      .update({ status, needs_review: false })
      .eq('id', theme.id)

    if (!themeError && status === 'active' && theme.cafes?.needs_review) {
      const { error: cafeError } = await supabase
        .from('cafes')
        .update({ status: 'active', needs_review: false })
        .eq('id', theme.cafe_id)

      if (cafeError) {
        setProcessingId(null)
        notify(`카페 승인 처리에 실패했습니다: ${cafeError.message}`, { type: 'error' })
        return
      }
    }

    setProcessingId(null)

    if (themeError) {
      notify(`처리에 실패했습니다: ${themeError.message}`, { type: 'error' })
      return
    }

    setThemes(current => current.filter(item => item.id !== theme.id))
    notify(status === 'active' ? '승인했습니다.' : '거절했습니다.', { type: 'success' })
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>방탈출 등록 승인</h1>
          <p style={{ ...mutedStyle, margin: '6px 0 0' }}>
            검수 대기 중인 강남구 카페/테마를 승인하거나 거절합니다.
          </p>
        </div>
        <Button label="새로고침" onClick={loadThemes} disabled={loading} />
      </div>

      {loading ? (
        <p style={mutedStyle}>불러오는 중...</p>
      ) : themes.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ margin: 0 }}>승인 대기 중인 등록이 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {themes.map(theme => {
            const cafe = theme.cafes
            const cafeName = cafe
              ? `${cafe.name}${cafe.branch_name ? ` ${cafe.branch_name}` : ''}`
              : '카페 정보 없음'

            return (
              <article key={theme.id} style={cardStyle}>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ ...mutedStyle, margin: '0 0 4px' }}>{cafeName}</p>
                    <h2 style={{ margin: 0, fontSize: 20 }}>{theme.name}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Button
                      label="승인"
                      variant="contained"
                      disabled={processingId === theme.id}
                      onClick={() => reviewTheme(theme, 'active')}
                    />
                    <Button
                      label="거절"
                      color="error"
                      disabled={processingId === theme.id}
                      onClick={() => reviewTheme(theme, 'rejected')}
                    />
                  </div>
                </div>

                <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', marginBottom: 0 }}>
                  <dt style={mutedStyle}>지역</dt>
                  <dd style={{ margin: 0 }}>{cafe ? `${cafe.district} ${cafe.area_label}` : '-'}</dd>

                  <dt style={mutedStyle}>주소</dt>
                  <dd style={{ margin: 0 }}>{cafe?.address ?? '주소 미확인'}</dd>

                  <dt style={mutedStyle}>장르</dt>
                  <dd style={{ margin: 0 }}>{theme.genre_labels.length ? theme.genre_labels.join(', ') : '장르 미확인'}</dd>

                  <dt style={mutedStyle}>시간/인원</dt>
                  <dd style={{ margin: 0 }}>
                    {theme.duration_minutes ? `${theme.duration_minutes}분` : '시간 미확인'} · {formatPlayers(theme)}
                  </dd>

                  <dt style={mutedStyle}>가격</dt>
                  <dd style={{ margin: 0 }}>{formatPrice(theme)}</dd>

                  <dt style={mutedStyle}>출처</dt>
                  <dd style={{ margin: 0 }}>
                    {theme.source_url ? (
                      <a href={theme.source_url} target="_blank" rel="noreferrer">{theme.source_url}</a>
                    ) : (
                      '출처 URL 미확인'
                    )}
                  </dd>

                  <dt style={mutedStyle}>예약</dt>
                  <dd style={{ margin: 0 }}>
                    {theme.booking_url || cafe?.booking_url ? (
                      <a href={theme.booking_url ?? cafe?.booking_url ?? ''} target="_blank" rel="noreferrer">
                        예약 페이지 열기
                      </a>
                    ) : (
                      '예약 URL 미확인'
                    )}
                  </dd>
                </dl>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
