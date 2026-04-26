import { useCallback, useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import { useNotify } from 'react-admin'
import { useCatalogOptions } from './catalogOptions'
import { supabase } from '../lib/supabaseClient'
import { adminUpdate, adminInsert, adminDelete, adminRpc } from './adminClient'
import { sanitizeExternalUrlInput } from '../lib/safeExternalUrl'

interface ApprovalCafe {
  id: number
  name: string
  branch_name: string | null
  area_label: string
  district: string
  address: string | null
  website_url: string | null
  booking_url: string | null
  status: string
  needs_review: boolean
}

interface ApprovalTheme {
  id: number
  cafe_id: number
  name: string
  description: string | null
  genre_labels: string[]
  duration_minutes: number | null
  min_players: number | null
  max_players: number | null
  price_text: string | null
  price_per_person: number | null
  image_url: string | null
  image_source_url: string | null
  image_source_name: string | null
  image_status: string
  booking_url: string | null
  source_url: string | null
  difficulty_label: string | null
  difficulty_score: number | null
  fear_label: string | null
  fear_score: number | null
  activity_label: string | null
  activity_score: number | null
  story_label: string | null
  story_score: number | null
  interior_label: string | null
  interior_score: number | null
  aging_label: string | null
  aging_score: number | null
  status: string
  needs_review: boolean
  theme_genres?: {
    genre_id: number
  }[]
  created_at: string
  cafes: ApprovalCafe | null
}

type RawApprovalTheme = Omit<ApprovalTheme, 'cafes'> & {
  cafes: ApprovalCafe | ApprovalCafe[] | null
}

type ThemeForm = Pick<
  ApprovalTheme,
  | 'name'
  | 'description'
  | 'duration_minutes'
  | 'min_players'
  | 'max_players'
  | 'price_text'
  | 'price_per_person'
  | 'image_url'
  | 'image_source_url'
  | 'image_source_name'
  | 'image_status'
  | 'booking_url'
  | 'source_url'
  | 'difficulty_label'
  | 'difficulty_score'
  | 'fear_label'
  | 'fear_score'
  | 'activity_label'
  | 'activity_score'
  | 'story_label'
  | 'story_score'
  | 'interior_label'
  | 'interior_score'
  | 'aging_label'
  | 'aging_score'
> & {
  genre_ids: number[]
}

const containerStyle = { padding: 24 }
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
const mutedStyle = { color: 'rgba(0, 0, 0, 0.56)' }
const warningStyle = {
  border: '1px solid rgba(211, 47, 47, 0.35)',
  borderRadius: 6,
  color: '#9a1b1b',
  background: '#fff4f4',
  padding: '8px 10px',
  margin: '12px 0',
}
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  border: '1px solid rgba(0, 0, 0, 0.2)',
  borderRadius: 6,
  padding: '8px 10px',
  font: 'inherit',
}

function normalizedSearch(value: string | null | undefined) {
  return (value ?? '').toLowerCase().replace(/\s+/g, '')
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

function formatScore(label: string, score: number | null) {
  return `${label} ${score === null ? '미확인' : `${score}/10`}`
}

function formatScores(theme: ApprovalTheme) {
  return [
    formatScore('난이도', theme.difficulty_score),
    formatScore('공포도', theme.fear_score),
    formatScore('활동성', theme.activity_score),
    formatScore('스토리', theme.story_score),
    formatScore('인테리어', theme.interior_score),
    formatScore('노후화', theme.aging_score),
  ].join(' · ')
}

function themeToForm(theme: ApprovalTheme): ThemeForm {
  return {
    name: theme.name,
    description: theme.description,
    genre_ids: theme.theme_genres?.map(themeGenre => themeGenre.genre_id) ?? [],
    duration_minutes: theme.duration_minutes,
    min_players: theme.min_players,
    max_players: theme.max_players,
    price_text: theme.price_text,
    price_per_person: theme.price_per_person,
    image_url: theme.image_url,
    image_source_url: theme.image_source_url,
    image_source_name: theme.image_source_name,
    image_status: theme.image_status,
    booking_url: theme.booking_url,
    source_url: theme.source_url,
    difficulty_label: theme.difficulty_label,
    difficulty_score: theme.difficulty_score,
    fear_label: theme.fear_label,
    fear_score: theme.fear_score,
    activity_label: theme.activity_label,
    activity_score: theme.activity_score,
    story_label: theme.story_label,
    story_score: theme.story_score,
    interior_label: theme.interior_label,
    interior_score: theme.interior_score,
    aging_label: theme.aging_label,
    aging_score: theme.aging_score,
  }
}

function emptyToNull(value: string | null) {
  return value?.trim() || null
}

function numberOrNull(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function ThemeApprovalList() {
  const notify = useNotify()
  const { genres } = useCatalogOptions()
  const [themes, setThemes] = useState<ApprovalTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ThemeForm | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadThemes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('themes')
      .select(`
        id,
        cafe_id,
        name,
        description,
        genre_labels,
        duration_minutes,
        min_players,
        max_players,
        price_text,
        price_per_person,
        image_url,
        image_source_url,
        image_source_name,
        image_status,
        booking_url,
        source_url,
        difficulty_label,
        difficulty_score,
        fear_label,
        fear_score,
        activity_label,
        activity_score,
        story_label,
        story_score,
        interior_label,
        interior_score,
        aging_label,
        aging_score,
        status,
        needs_review,
        theme_genres (
          genre_id
        ),
        created_at,
        cafes!inner (
          id,
          name,
          branch_name,
          area_label,
          district,
          address,
          website_url,
          booking_url,
          status,
          needs_review
        )
      `)
      .eq('needs_review', true)
      .in('status', ['active', 'unknown'])
      .in('cafes.status', ['active', 'unknown'])
      .order('created_at', { ascending: false })

    setLoading(false)

    if (error) {
      notify(`테마 검수 목록을 불러오지 못했습니다: ${error.message}`, { type: 'error' })
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

  const filteredThemes = themes.filter(theme => {
    const query = normalizedSearch(searchTerm)
    if (!query) return true
    const cafe = theme.cafes
    const haystack = normalizedSearch([
      theme.name,
      cafe?.name,
      cafe?.branch_name,
      cafe?.district,
      cafe?.area_label,
      theme.genre_labels.join(' '),
    ].filter(Boolean).join(' '))
    return haystack.includes(query)
  })

  function startEdit(theme: ApprovalTheme) {
    setEditingId(theme.id)
    setForm(themeToForm(theme))
  }

  function updateForm<K extends keyof ThemeForm>(key: K, value: ThemeForm[K]) {
    setForm(current => current ? { ...current, [key]: value } : current)
  }

  function toggleGenre(genreId: number) {
    setForm(current => {
      if (!current) return current
      const genreIds = current.genre_ids.includes(genreId)
        ? current.genre_ids.filter(id => id !== genreId)
        : [...current.genre_ids, genreId]
      return { ...current, genre_ids: genreIds }
    })
  }

  async function saveTheme(themeId: number) {
    if (!form) return
    setProcessingId(themeId)

    const payload = {
      name: form.name.trim(),
      description: emptyToNull(form.description),
      genre_labels: genres
        .filter(genre => form.genre_ids.includes(genre.id))
        .map(genre => genre.name),
      duration_minutes: form.duration_minutes,
      min_players: form.min_players,
      max_players: form.max_players,
      price_text: emptyToNull(form.price_text),
      price_per_person: form.price_per_person,
      image_url: sanitizeExternalUrlInput(form.image_url),
      image_source_url: sanitizeExternalUrlInput(form.image_source_url),
      image_source_name: emptyToNull(form.image_source_name),
      image_status: form.image_status,
      booking_url: sanitizeExternalUrlInput(form.booking_url),
      source_url: sanitizeExternalUrlInput(form.source_url),
      difficulty_label: emptyToNull(form.difficulty_label),
      difficulty_score: form.difficulty_score,
      fear_label: emptyToNull(form.fear_label),
      fear_score: form.fear_score,
      activity_label: emptyToNull(form.activity_label),
      activity_score: form.activity_score,
      story_label: emptyToNull(form.story_label),
      story_score: form.story_score,
      interior_label: emptyToNull(form.interior_label),
      interior_score: form.interior_score,
      aging_label: emptyToNull(form.aging_label),
      aging_score: form.aging_score,
    }

    try {
      await adminUpdate('themes', payload, { column: 'id', value: themeId })
      await adminDelete('theme_genres', { column: 'theme_id', value: themeId })
      if (form.genre_ids.length) {
        await adminInsert('theme_genres', form.genre_ids.map(genreId => ({ theme_id: themeId, genre_id: genreId })))
      }
    } catch (err) {
      setProcessingId(null)
      notify(`테마 수정에 실패했습니다: ${err instanceof Error ? err.message : String(err)}`, { type: 'error' })
      return
    }

    setProcessingId(null)
    setEditingId(null)
    setForm(null)
    notify('테마 정보를 수정했습니다.', { type: 'success' })
    await loadThemes()
  }

  async function reviewTheme(theme: ApprovalTheme, status: 'active' | 'rejected' | 'closed') {
    if (status === 'active' && (!theme.cafes || theme.cafes.needs_review || theme.cafes.status !== 'active')) {
      notify('매장 검수를 먼저 승인해야 테마를 승인할 수 있습니다.', { type: 'warning' })
      return
    }

    setProcessingId(theme.id)

    if (status === 'closed' || status === 'rejected') {
      try {
        await adminUpdate('themes', { status, needs_review: false }, { column: 'id', value: theme.id })
      } catch (err) {
        setProcessingId(null)
        notify(`처리에 실패했습니다: ${err instanceof Error ? err.message : String(err)}`, { type: 'error' })
        return
      }
    } else {
      let rpcResult: { data: { theme_status?: string; theme_needs_review?: boolean }[] }
      try {
        rpcResult = await adminRpc('review_theme_for_review', { p_theme_id: theme.id, p_status: status })
      } catch (err) {
        setProcessingId(null)
        notify(`처리에 실패했습니다: ${err instanceof Error ? err.message : String(err)}`, { type: 'error' })
        return
      }

      const data = rpcResult.data
      if (!data || data.length === 0) {
        setProcessingId(null)
        notify('처리에 실패했습니다: DB에서 변경된 테마가 없습니다.', { type: 'error' })
        return
      }

      const reviewed = data[0]
      if (reviewed.theme_status !== status || reviewed.theme_needs_review !== false) {
        setProcessingId(null)
        notify('처리 결과가 DB에 정상 반영되지 않았습니다.', { type: 'error' })
        return
      }
    }

    setProcessingId(null)
    setThemes(current => current.filter(item => item.id !== theme.id))
    if (status === 'active') {
      notify('테마를 승인했습니다.', { type: 'success' })
    } else if (status === 'closed') {
      notify('테마를 사라짐/종료 처리했습니다.', { type: 'success' })
    } else {
      notify('테마를 거절했습니다.', { type: 'success' })
    }
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>테마 검수</h1>
          <p style={{ ...mutedStyle, margin: '6px 0 0' }}>
            매장 검수가 끝난 테마를 승인, 거절, 수정합니다.
          </p>
        </div>
        <Button onClick={loadThemes} disabled={loading}>새로고침</Button>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <input
          style={inputStyle}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="테마명, 매장명, 지점명, 지역, 장르로 검색"
        />
      </div>

      {loading ? (
        <p style={mutedStyle}>불러오는 중...</p>
      ) : filteredThemes.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ margin: 0 }}>{searchTerm ? '검색 결과가 없습니다.' : '검수 대기 중인 테마가 없습니다.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredThemes.map(theme => {
            const cafe = theme.cafes
            const cafeName = cafe
              ? `${cafe.name}${cafe.branch_name ? ` ${cafe.branch_name}` : ''}`
              : '카페 정보 없음'
            const cafeApproved = Boolean(cafe && !cafe.needs_review && cafe.status === 'active')
            const isEditing = editingId === theme.id && form

            return (
              <article key={theme.id} style={cardStyle}>
                <div className="approval-card-header">
                  <div className="approval-card-title">
                    <p style={{ ...mutedStyle, margin: '0 0 4px' }}>{cafeName}</p>
                    <h2 style={{ margin: 0, fontSize: 20 }}>{theme.name}</h2>
                  </div>
                  <div className="approval-card-actions">
                    {isEditing ? (
                      <>
                        <Button variant="contained" disabled={processingId === theme.id} onClick={() => saveTheme(theme.id)}>저장</Button>
                        <Button disabled={processingId === theme.id} onClick={() => { setEditingId(null); setForm(null) }}>취소</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="contained" disabled={processingId === theme.id || !cafeApproved} onClick={() => reviewTheme(theme, 'active')}>승인</Button>
                        <Button color="warning" disabled={processingId === theme.id} onClick={() => reviewTheme(theme, 'closed')}>사라짐</Button>
                        <Button color="error" disabled={processingId === theme.id} onClick={() => reviewTheme(theme, 'rejected')}>거절</Button>
                        <Button disabled={processingId === theme.id} onClick={() => startEdit(theme)}>수정</Button>
                      </>
                    )}
                  </div>
                </div>

                {!cafeApproved && (
                  <div style={warningStyle}>
                    매장 검수가 아직 완료되지 않았습니다. `매장 검수` 탭에서 먼저 매장을 승인하세요.
                  </div>
                )}

                {isEditing ? (
                  <div className="approval-edit-grid">
                    <label>테마명<input style={inputStyle} value={form.name} onChange={e => updateForm('name', e.target.value)} /></label>
                    <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.2)', borderRadius: 6, padding: 10 }}>
                      <legend>장르</legend>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {genres.map(genre => (
                          <label key={genre.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="checkbox"
                              checked={form.genre_ids.includes(genre.id)}
                              onChange={() => toggleGenre(genre.id)}
                            />
                            {genre.name}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <label>제한시간<input style={inputStyle} value={form.duration_minutes ?? ''} onChange={e => updateForm('duration_minutes', numberOrNull(e.target.value))} /></label>
                    <label>최소 인원<input style={inputStyle} value={form.min_players ?? ''} onChange={e => updateForm('min_players', numberOrNull(e.target.value))} /></label>
                    <label>최대 인원<input style={inputStyle} value={form.max_players ?? ''} onChange={e => updateForm('max_players', numberOrNull(e.target.value))} /></label>
                    <label>인당 가격<input style={inputStyle} value={form.price_per_person ?? ''} onChange={e => updateForm('price_per_person', numberOrNull(e.target.value))} /></label>
                    <label>가격 원문<input style={inputStyle} value={form.price_text ?? ''} onChange={e => updateForm('price_text', e.target.value)} /></label>
                    <label>난이도 원문<input style={inputStyle} value={form.difficulty_label ?? ''} onChange={e => updateForm('difficulty_label', e.target.value)} /></label>
                    <label>난이도 (0-10)<input style={inputStyle} value={form.difficulty_score ?? ''} onChange={e => updateForm('difficulty_score', numberOrNull(e.target.value))} /></label>
                    <label>공포도 원문<input style={inputStyle} value={form.fear_label ?? ''} onChange={e => updateForm('fear_label', e.target.value)} /></label>
                    <label>공포도 (0-10)<input style={inputStyle} value={form.fear_score ?? ''} onChange={e => updateForm('fear_score', numberOrNull(e.target.value))} /></label>
                    <label>활동성 원문<input style={inputStyle} value={form.activity_label ?? ''} onChange={e => updateForm('activity_label', e.target.value)} /></label>
                    <label>활동성 (0-10)<input style={inputStyle} value={form.activity_score ?? ''} onChange={e => updateForm('activity_score', numberOrNull(e.target.value))} /></label>
                    <label>스토리 원문<input style={inputStyle} value={form.story_label ?? ''} onChange={e => updateForm('story_label', e.target.value)} /></label>
                    <label>스토리 (0-10)<input style={inputStyle} value={form.story_score ?? ''} onChange={e => updateForm('story_score', numberOrNull(e.target.value))} /></label>
                    <label>인테리어 원문<input style={inputStyle} value={form.interior_label ?? ''} onChange={e => updateForm('interior_label', e.target.value)} /></label>
                    <label>인테리어 (0-10)<input style={inputStyle} value={form.interior_score ?? ''} onChange={e => updateForm('interior_score', numberOrNull(e.target.value))} /></label>
                    <label>노후화 원문<input style={inputStyle} value={form.aging_label ?? ''} onChange={e => updateForm('aging_label', e.target.value)} /></label>
                    <label>노후화 (0-10)<input style={inputStyle} value={form.aging_score ?? ''} onChange={e => updateForm('aging_score', numberOrNull(e.target.value))} /></label>
                    <label>이미지 URL<input style={inputStyle} value={form.image_url ?? ''} onChange={e => updateForm('image_url', e.target.value)} /></label>
                    <label>이미지 출처 URL<input style={inputStyle} value={form.image_source_url ?? ''} onChange={e => updateForm('image_source_url', e.target.value)} /></label>
                    <label>이미지 출처<input style={inputStyle} value={form.image_source_name ?? ''} onChange={e => updateForm('image_source_name', e.target.value)} /></label>
                    <label>이미지 상태
                      <select style={inputStyle} value={form.image_status} onChange={e => updateForm('image_status', e.target.value)}>
                        <option value="unverified">검수 전</option>
                        <option value="verified">검수 완료</option>
                        <option value="rejected">사용 안 함</option>
                        <option value="manual">수동 등록</option>
                      </select>
                    </label>
                    <label>예약 URL<input style={inputStyle} value={form.booking_url ?? ''} onChange={e => updateForm('booking_url', e.target.value)} /></label>
                    <label>출처 URL<input style={inputStyle} value={form.source_url ?? ''} onChange={e => updateForm('source_url', e.target.value)} /></label>
                    <label style={{ gridColumn: '1 / -1' }}>소개<input style={inputStyle} value={form.description ?? ''} onChange={e => updateForm('description', e.target.value)} /></label>
                  </div>
                ) : (
                  <dl className="approval-detail-list">
                    <dt style={mutedStyle}>포스터</dt>
                    <dd style={{ margin: 0 }}>
                      {theme.image_url ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img src={theme.image_url} alt={`${theme.name} 포스터`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                          <div>
                            <div>상태: {theme.image_status}</div>
                            <div>{theme.image_source_name ?? '출처 미확인'}</div>
                            {theme.image_source_url && <a href={theme.image_source_url} target="_blank" rel="noreferrer">원본 열기</a>}
                          </div>
                        </div>
                      ) : (
                        '이미지 미확인'
                      )}
                    </dd>
                    <dt style={mutedStyle}>지역</dt>
                    <dd style={{ margin: 0 }}>{cafe ? `${cafe.district} ${cafe.area_label}` : '-'}</dd>
                    <dt style={mutedStyle}>주소</dt>
                    <dd style={{ margin: 0 }}>{cafe?.address ?? '주소 미확인'}</dd>
                    <dt style={mutedStyle}>장르</dt>
                    <dd style={{ margin: 0 }}>{theme.genre_labels.length ? theme.genre_labels.join(', ') : '장르 미확인'}</dd>
                    <dt style={mutedStyle}>시간/인원</dt>
                    <dd style={{ margin: 0 }}>{theme.duration_minutes ? `${theme.duration_minutes}분` : '시간 미확인'} · {formatPlayers(theme)}</dd>
                    <dt style={mutedStyle}>가격</dt>
                    <dd style={{ margin: 0 }}>{formatPrice(theme)}</dd>
                    <dt style={mutedStyle}>지표</dt>
                    <dd style={{ margin: 0 }}>
                      {formatScores(theme)}
                    </dd>
                    <dt style={mutedStyle}>출처</dt>
                    <dd style={{ margin: 0 }}>{theme.source_url ? <a href={theme.source_url} target="_blank" rel="noreferrer">{theme.source_url}</a> : '출처 URL 미확인'}</dd>
                    <dt style={mutedStyle}>예약</dt>
                    <dd style={{ margin: 0 }}>
                      {theme.booking_url || cafe?.booking_url ? (
                        <a href={theme.booking_url ?? cafe?.booking_url ?? ''} target="_blank" rel="noreferrer">예약 페이지 열기</a>
                      ) : (
                        '예약 URL 미확인'
                      )}
                    </dd>
                  </dl>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
