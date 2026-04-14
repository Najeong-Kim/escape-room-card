import { useCallback, useEffect, useState } from 'react'
import { Button, useNotify } from 'react-admin'
import { useCatalogOptions } from './catalogOptions'
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
  booking_url: string | null
  source_url: string | null
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
  | 'booking_url'
  | 'source_url'
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

function formatPlayers(theme: ApprovalTheme) {
  if (theme.min_players === null || theme.max_players === null) return '인원 미확인'
  return `${theme.min_players}-${theme.max_players}명`
}

function formatPrice(theme: ApprovalTheme) {
  if (theme.price_text) return theme.price_text
  if (theme.price_per_person === null) return '가격 미확인'
  return `${theme.price_per_person.toLocaleString()}원/인`
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
    booking_url: theme.booking_url,
    source_url: theme.source_url,
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
        booking_url,
        source_url,
        status,
        needs_review,
        theme_genres (
          genre_id
        ),
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
          status,
          needs_review
        )
      `)
      .eq('needs_review', true)
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
      image_url: emptyToNull(form.image_url),
      booking_url: emptyToNull(form.booking_url),
      source_url: emptyToNull(form.source_url),
    }

    const { error } = await supabase.from('themes').update(payload).eq('id', themeId)

    setProcessingId(null)

    if (error) {
      notify(`테마 수정에 실패했습니다: ${error.message}`, { type: 'error' })
      return
    }

    const { error: deleteGenreError } = await supabase
      .from('theme_genres')
      .delete()
      .eq('theme_id', themeId)

    if (deleteGenreError) {
      notify(`장르 수정에 실패했습니다: ${deleteGenreError.message}`, { type: 'error' })
      return
    }

    if (form.genre_ids.length) {
      const { error: genreError } = await supabase
        .from('theme_genres')
        .insert(form.genre_ids.map(genreId => ({ theme_id: themeId, genre_id: genreId })))

      if (genreError) {
        notify(`장르 수정에 실패했습니다: ${genreError.message}`, { type: 'error' })
        return
      }
    }

    setEditingId(null)
    setForm(null)
    notify('테마 정보를 수정했습니다.', { type: 'success' })
    await loadThemes()
  }

  async function reviewTheme(theme: ApprovalTheme, status: 'active' | 'rejected') {
    if (status === 'active' && (!theme.cafes || theme.cafes.needs_review || theme.cafes.status !== 'active')) {
      notify('매장 검수를 먼저 승인해야 테마를 승인할 수 있습니다.', { type: 'warning' })
      return
    }

    setProcessingId(theme.id)

    const { error } = await supabase
      .from('themes')
      .update({ status, needs_review: false })
      .eq('id', theme.id)

    setProcessingId(null)

    if (error) {
      notify(`처리에 실패했습니다: ${error.message}`, { type: 'error' })
      return
    }

    setThemes(current => current.filter(item => item.id !== theme.id))
    notify(status === 'active' ? '테마를 승인했습니다.' : '테마를 거절했습니다.', { type: 'success' })
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
        <Button label="새로고침" onClick={loadThemes} disabled={loading} />
      </div>

      {loading ? (
        <p style={mutedStyle}>불러오는 중...</p>
      ) : themes.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ margin: 0 }}>검수 대기 중인 테마가 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {themes.map(theme => {
            const cafe = theme.cafes
            const cafeName = cafe
              ? `${cafe.name}${cafe.branch_name ? ` ${cafe.branch_name}` : ''}`
              : '카페 정보 없음'
            const cafeApproved = Boolean(cafe && !cafe.needs_review && cafe.status === 'active')
            const isEditing = editingId === theme.id && form

            return (
              <article key={theme.id} style={cardStyle}>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <p style={{ ...mutedStyle, margin: '0 0 4px' }}>{cafeName}</p>
                    <h2 style={{ margin: 0, fontSize: 20 }}>{theme.name}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    {isEditing ? (
                      <>
                        <Button label="저장" variant="contained" disabled={processingId === theme.id} onClick={() => saveTheme(theme.id)} />
                        <Button label="취소" disabled={processingId === theme.id} onClick={() => { setEditingId(null); setForm(null) }} />
                      </>
                    ) : (
                      <>
                        <Button label="승인" variant="contained" disabled={processingId === theme.id || !cafeApproved} onClick={() => reviewTheme(theme, 'active')} />
                        <Button label="거절" color="error" disabled={processingId === theme.id} onClick={() => reviewTheme(theme, 'rejected')} />
                        <Button label="수정" disabled={processingId === theme.id} onClick={() => startEdit(theme)} />
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
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
                    <label>이미지 URL<input style={inputStyle} value={form.image_url ?? ''} onChange={e => updateForm('image_url', e.target.value)} /></label>
                    <label>예약 URL<input style={inputStyle} value={form.booking_url ?? ''} onChange={e => updateForm('booking_url', e.target.value)} /></label>
                    <label>출처 URL<input style={inputStyle} value={form.source_url ?? ''} onChange={e => updateForm('source_url', e.target.value)} /></label>
                    <label style={{ gridColumn: '1 / -1' }}>소개<input style={inputStyle} value={form.description ?? ''} onChange={e => updateForm('description', e.target.value)} /></label>
                  </div>
                ) : (
                  <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', marginBottom: 0 }}>
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
