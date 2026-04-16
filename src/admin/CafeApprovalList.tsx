import { useCallback, useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import { useNotify } from 'react-admin'
import { useCatalogOptions } from './catalogOptions'
import { supabase } from './supabaseDataProvider'

interface ApprovalCafe {
  id: number
  normalized_key: string
  name: string
  branch_name: string | null
  area_label: string
  area_id: number | null
  district: string
  address: string | null
  phone: string | null
  website_url: string | null
  booking_url: string | null
  source_url: string | null
  naver_place_id: string | null
  naver_place_url: string | null
  naver_place_name: string | null
  naver_place_address: string | null
  naver_place_checked_at: string | null
  status: string
  needs_review: boolean
  created_at: string
}

interface NaverCandidate {
  title: string
  link: string | null
  category: string
  telephone: string | null
  address: string
  roadAddress: string
  score?: number
  reasons?: string[]
}

interface CafeVerificationCandidate {
  id: string
  cafe_id: number
  provider: string
  query: string
  status: 'pending' | 'applied' | 'dismissed'
  confidence: 'high' | 'manual'
  score: number | null
  best_candidate: NaverCandidate | null
  candidates: NaverCandidate[]
  suggested_changes: Partial<Record<'address' | 'phone' | 'website_url', string>>
  generated_at: string
}

type CafeForm = Pick<
  ApprovalCafe,
  | 'name'
  | 'branch_name'
  | 'area_label'
  | 'district'
  | 'address'
  | 'phone'
  | 'website_url'
  | 'booking_url'
  | 'source_url'
  | 'naver_place_id'
  | 'naver_place_url'
  | 'naver_place_name'
  | 'naver_place_address'
  | 'naver_place_checked_at'
> & { area_id: number | null }

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
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  border: '1px solid rgba(0, 0, 0, 0.2)',
  borderRadius: 6,
  padding: '8px 10px',
  font: 'inherit',
}
const candidateBoxStyle = {
  border: '1px solid rgba(25, 118, 210, 0.24)',
  borderRadius: 8,
  padding: 12,
  margin: '12px 0',
  background: 'rgba(25, 118, 210, 0.06)',
}

function cafeToForm(cafe: ApprovalCafe): CafeForm {
  return {
    name: cafe.name,
    branch_name: cafe.branch_name,
    area_label: cafe.area_label,
    area_id: cafe.area_id,
    district: cafe.district,
    address: cafe.address,
    phone: cafe.phone,
    website_url: cafe.website_url,
    booking_url: cafe.booking_url,
    source_url: cafe.source_url,
    naver_place_id: cafe.naver_place_id,
    naver_place_url: cafe.naver_place_url,
    naver_place_name: cafe.naver_place_name,
    naver_place_address: cafe.naver_place_address,
    naver_place_checked_at: cafe.naver_place_checked_at,
  }
}

function emptyToNull(value: string | null) {
  return value?.trim() || null
}

function isUsefulWebsite(url: string | null | undefined) {
  if (!url) return false
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    return !hostname.includes('map.naver.com') && !hostname.includes('naver.com/maps')
  } catch {
    return false
  }
}

function candidateAddress(candidate: NaverCandidate) {
  return candidate.roadAddress || candidate.address || ''
}

export function CafeApprovalList() {
  const notify = useNotify()
  const { areas } = useCatalogOptions()
  const [cafes, setCafes] = useState<ApprovalCafe[]>([])
  const [candidatesByCafeId, setCandidatesByCafeId] = useState<Record<number, CafeVerificationCandidate>>({})
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CafeForm | null>(null)

  const loadCafes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('needs_review', true)
      .in('status', ['active', 'unknown'])
      .order('created_at', { ascending: false })

    setLoading(false)

    if (error) {
      notify(`매장 검수 목록을 불러오지 못했습니다: ${error.message}`, { type: 'error' })
      return
    }

    const cafeRows = (data ?? []) as ApprovalCafe[]
    setCafes(cafeRows)

    if (cafeRows.length === 0) {
      setCandidatesByCafeId({})
      return
    }

    const { data: candidateData, error: candidateError } = await supabase
      .from('cafe_verification_candidates')
      .select('*')
      .in('cafe_id', cafeRows.map(cafe => cafe.id))

    if (candidateError) {
      notify(`네이버 후보를 불러오지 못했습니다: ${candidateError.message}`, { type: 'warning' })
      setCandidatesByCafeId({})
      return
    }

    setCandidatesByCafeId(Object.fromEntries(
      ((candidateData ?? []) as CafeVerificationCandidate[]).map(candidate => [candidate.cafe_id, candidate]),
    ))
  }, [notify])

  useEffect(() => {
    loadCafes()
  }, [loadCafes])

  function startEdit(cafe: ApprovalCafe) {
    setEditingId(cafe.id)
    setForm(cafeToForm(cafe))
  }

  function updateForm<K extends keyof CafeForm>(key: K, value: CafeForm[K]) {
    setForm(current => current ? { ...current, [key]: value } : current)
  }

  async function saveCafe(cafeId: number) {
    if (!form) return
    setProcessingId(cafeId)

    const payload = {
      ...form,
      area_label: areas.find(area => area.id === form.area_id)?.name ?? form.area_label,
      branch_name: emptyToNull(form.branch_name),
      address: emptyToNull(form.address),
      phone: emptyToNull(form.phone),
      website_url: emptyToNull(form.website_url),
      booking_url: emptyToNull(form.booking_url),
      source_url: emptyToNull(form.source_url),
      naver_place_id: emptyToNull(form.naver_place_id),
      naver_place_url: emptyToNull(form.naver_place_url),
      naver_place_name: emptyToNull(form.naver_place_name),
      naver_place_address: emptyToNull(form.naver_place_address),
      naver_place_checked_at: emptyToNull(form.naver_place_checked_at),
    }

    const { error } = await supabase.from('cafes').update(payload).eq('id', cafeId)

    setProcessingId(null)

    if (error) {
      notify(`매장 수정에 실패했습니다: ${error.message}`, { type: 'error' })
      return
    }

    setEditingId(null)
    setForm(null)
    notify('매장 정보를 수정했습니다.', { type: 'success' })
    await loadCafes()
  }

  async function reviewCafe(cafe: ApprovalCafe, status: 'active' | 'rejected') {
    setProcessingId(cafe.id)

    const { error: cafeError } = await supabase
      .from('cafes')
      .update({ status, needs_review: false })
      .eq('id', cafe.id)

    if (!cafeError && status === 'rejected') {
      const { error: themeError } = await supabase
        .from('themes')
        .update({ status: 'rejected', needs_review: false })
        .eq('cafe_id', cafe.id)

      if (themeError) {
        setProcessingId(null)
        notify(`연결 테마 거절 처리에 실패했습니다: ${themeError.message}`, { type: 'error' })
        return
      }
    }

    setProcessingId(null)

    if (cafeError) {
      notify(`처리에 실패했습니다: ${cafeError.message}`, { type: 'error' })
      return
    }

    setCafes(current => current.filter(item => item.id !== cafe.id))
    notify(status === 'active' ? '매장을 승인했습니다.' : '매장과 연결 테마를 거절했습니다.', { type: 'success' })
  }

  async function markCafeClosed(cafe: ApprovalCafe) {
    setProcessingId(cafe.id)

    const { error: cafeError } = await supabase
      .from('cafes')
      .update({ status: 'closed', needs_review: false })
      .eq('id', cafe.id)

    if (!cafeError) {
      const { error: themeError } = await supabase
        .from('themes')
        .update({ status: 'closed', needs_review: false })
        .eq('cafe_id', cafe.id)

      if (themeError) {
        setProcessingId(null)
        notify(`연결 테마 폐점 처리에 실패했습니다: ${themeError.message}`, { type: 'error' })
        return
      }

      const { error: candidateError } = await supabase
        .from('cafe_verification_candidates')
        .update({ status: 'dismissed' })
        .eq('cafe_id', cafe.id)

      if (candidateError) {
        setProcessingId(null)
        notify(`후보 폐기 처리에 실패했습니다: ${candidateError.message}`, { type: 'error' })
        return
      }
    }

    setProcessingId(null)

    if (cafeError) {
      notify(`폐점 처리에 실패했습니다: ${cafeError.message}`, { type: 'error' })
      return
    }

    setCafes(current => current.filter(item => item.id !== cafe.id))
    notify('매장과 연결 테마를 폐점 처리했습니다.', { type: 'success' })
  }

  async function applyNaverCandidate(cafe: ApprovalCafe, verification: CafeVerificationCandidate) {
    const candidate = verification.best_candidate
    if (!candidate) return

    setProcessingId(cafe.id)

    const address = candidateAddress(candidate)
    const payload = {
      address: address || cafe.address,
      phone: candidate.telephone || cafe.phone,
      website_url: isUsefulWebsite(candidate.link) ? candidate.link : cafe.website_url,
      naver_place_name: candidate.title,
      naver_place_address: address || null,
      naver_place_checked_at: new Date().toISOString(),
    }

    const { error: cafeError } = await supabase
      .from('cafes')
      .update(payload)
      .eq('id', cafe.id)

    if (!cafeError) {
      const { error: candidateError } = await supabase
        .from('cafe_verification_candidates')
        .update({ status: 'applied', applied_at: new Date().toISOString() })
        .eq('id', verification.id)

      if (candidateError) {
        setProcessingId(null)
        notify(`후보 적용 상태 저장에 실패했습니다: ${candidateError.message}`, { type: 'error' })
        return
      }
    }

    setProcessingId(null)

    if (cafeError) {
      notify(`네이버 후보 적용에 실패했습니다: ${cafeError.message}`, { type: 'error' })
      return
    }

    notify('네이버 후보를 매장 정보에 적용했습니다.', { type: 'success' })
    await loadCafes()
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>매장 검수</h1>
          <p style={{ ...mutedStyle, margin: '6px 0 0' }}>
            새로 수집된 방탈출 매장 정보를 승인, 거절, 수정합니다.
          </p>
        </div>
        <Button onClick={loadCafes} disabled={loading}>새로고침</Button>
      </div>

      {loading ? (
        <p style={mutedStyle}>불러오는 중...</p>
      ) : cafes.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ margin: 0 }}>검수 대기 중인 매장이 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {cafes.map(cafe => {
            const isEditing = editingId === cafe.id && form
            const verification = candidatesByCafeId[cafe.id]
            const bestCandidate = verification?.best_candidate

            return (
              <article key={cafe.id} style={cardStyle}>
                <div className="approval-card-header">
                  <div className="approval-card-title">
                    <p style={{ ...mutedStyle, margin: '0 0 4px' }}>{cafe.district} {cafe.area_label}</p>
                    <h2 style={{ margin: 0, fontSize: 20 }}>
                      {cafe.name}{cafe.branch_name ? ` ${cafe.branch_name}` : ''}
                    </h2>
                  </div>
                  <div className="approval-card-actions">
                    {isEditing ? (
                      <>
                        <Button variant="contained" disabled={processingId === cafe.id} onClick={() => saveCafe(cafe.id)}>저장</Button>
                        <Button disabled={processingId === cafe.id} onClick={() => { setEditingId(null); setForm(null) }}>취소</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="contained" disabled={processingId === cafe.id} onClick={() => reviewCafe(cafe, 'active')}>승인</Button>
                        <Button color="error" disabled={processingId === cafe.id} onClick={() => reviewCafe(cafe, 'rejected')}>거절</Button>
                        <Button color="warning" disabled={processingId === cafe.id} onClick={() => markCafeClosed(cafe)}>폐점</Button>
                        <Button disabled={processingId === cafe.id} onClick={() => startEdit(cafe)}>수정</Button>
                      </>
                    )}
                  </div>
                </div>

                {!isEditing && verification && (
                  <div style={candidateBoxStyle}>
                    <div className="approval-card-header" style={{ marginBottom: 10 }}>
                      <div>
                        <p style={{ ...mutedStyle, margin: '0 0 4px' }}>네이버 Local 후보 · {verification.confidence === 'high' ? '확신 높음' : '수동 확인 필요'} · {verification.score ?? '-'}점</p>
                        <h3 style={{ margin: 0, fontSize: 16 }}>
                          {bestCandidate?.title ?? '검색 결과 없음'}
                        </h3>
                      </div>
                      {bestCandidate && (
                        <Button
                          variant="contained"
                          disabled={processingId === cafe.id}
                          onClick={() => applyNaverCandidate(cafe, verification)}
                        >
                          후보 적용
                        </Button>
                      )}
                    </div>
                    {bestCandidate ? (
                      <dl className="approval-detail-list">
                        <dt style={mutedStyle}>검색어</dt>
                        <dd style={{ margin: 0 }}>{verification.query}</dd>
                        <dt style={mutedStyle}>카테고리</dt>
                        <dd style={{ margin: 0 }}>{bestCandidate.category || '-'}</dd>
                        <dt style={mutedStyle}>주소</dt>
                        <dd style={{ margin: 0 }}>{candidateAddress(bestCandidate) || '주소 없음'}</dd>
                        <dt style={mutedStyle}>전화번호</dt>
                        <dd style={{ margin: 0 }}>{bestCandidate.telephone || '전화번호 없음'}</dd>
                        <dt style={mutedStyle}>링크</dt>
                        <dd style={{ margin: 0 }}>
                          {bestCandidate.link ? <a href={bestCandidate.link} target="_blank" rel="noreferrer">{bestCandidate.link}</a> : '링크 없음'}
                        </dd>
                        {verification.candidates.length > 1 && (
                          <>
                            <dt style={mutedStyle}>다른 후보</dt>
                            <dd style={{ margin: 0 }}>
                              {verification.candidates.slice(1, 4).map(candidate => (
                                <div key={`${candidate.title}-${candidate.roadAddress}`}>
                                  {candidate.title} · {candidate.roadAddress || candidate.address || '주소 없음'} · {candidate.score ?? '-'}점
                                </div>
                              ))}
                            </dd>
                          </>
                        )}
                      </dl>
                    ) : (
                      <p style={{ ...mutedStyle, margin: 0 }}>네이버 Local 검색 결과가 없습니다. 폐점, 이름 변경, 오타 가능성이 있습니다.</p>
                    )}
                  </div>
                )}

                {isEditing ? (
                  <div className="approval-edit-grid">
                    <label>매장명<input style={inputStyle} value={form.name} onChange={e => updateForm('name', e.target.value)} /></label>
                    <label>지점명<input style={inputStyle} value={form.branch_name ?? ''} onChange={e => updateForm('branch_name', e.target.value)} /></label>
                    <label>
                      지역
                      <select
                        style={inputStyle}
                        value={form.area_id ?? ''}
                        onChange={e => {
                          const area = areas.find(option => option.id === Number(e.target.value))
                          updateForm('area_id', area?.id ?? null)
                          if (area) updateForm('area_label', area.name)
                        }}
                      >
                        <option value="">지역 선택</option>
                        {areas.map(area => (
                          <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>구<input style={inputStyle} value={form.district} onChange={e => updateForm('district', e.target.value)} /></label>
                    <label>주소<input style={inputStyle} value={form.address ?? ''} onChange={e => updateForm('address', e.target.value)} /></label>
                    <label>전화번호<input style={inputStyle} value={form.phone ?? ''} onChange={e => updateForm('phone', e.target.value)} /></label>
                    <label>홈페이지<input style={inputStyle} value={form.website_url ?? ''} onChange={e => updateForm('website_url', e.target.value)} /></label>
                    <label>예약 URL<input style={inputStyle} value={form.booking_url ?? ''} onChange={e => updateForm('booking_url', e.target.value)} /></label>
                    <label>네이버 플레이스 URL<input style={inputStyle} value={form.naver_place_url ?? ''} onChange={e => updateForm('naver_place_url', e.target.value)} /></label>
                    <label>네이버 플레이스 ID<input style={inputStyle} value={form.naver_place_id ?? ''} onChange={e => updateForm('naver_place_id', e.target.value)} /></label>
                    <label>네이버 플레이스 매장명<input style={inputStyle} value={form.naver_place_name ?? ''} onChange={e => updateForm('naver_place_name', e.target.value)} /></label>
                    <label>네이버 플레이스 주소<input style={inputStyle} value={form.naver_place_address ?? ''} onChange={e => updateForm('naver_place_address', e.target.value)} /></label>
                    <label>네이버 플레이스 확인일<input style={inputStyle} value={form.naver_place_checked_at ?? ''} onChange={e => updateForm('naver_place_checked_at', e.target.value)} /></label>
                    <label style={{ gridColumn: '1 / -1' }}>출처 URL<input style={inputStyle} value={form.source_url ?? ''} onChange={e => updateForm('source_url', e.target.value)} /></label>
                  </div>
                ) : (
                  <dl className="approval-detail-list">
                    <dt style={mutedStyle}>주소</dt>
                    <dd style={{ margin: 0 }}>{cafe.address ?? '주소 미확인'}</dd>
                    <dt style={mutedStyle}>전화번호</dt>
                    <dd style={{ margin: 0 }}>{cafe.phone ?? '전화번호 미확인'}</dd>
                    <dt style={mutedStyle}>홈페이지</dt>
                    <dd style={{ margin: 0 }}>{cafe.website_url ? <a href={cafe.website_url} target="_blank" rel="noreferrer">{cafe.website_url}</a> : '홈페이지 미확인'}</dd>
                    <dt style={mutedStyle}>예약</dt>
                    <dd style={{ margin: 0 }}>{cafe.booking_url ? <a href={cafe.booking_url} target="_blank" rel="noreferrer">{cafe.booking_url}</a> : '예약 URL 미확인'}</dd>
                    <dt style={mutedStyle}>네이버 지도</dt>
                    <dd style={{ margin: 0 }}>
                      {cafe.naver_place_url ? (
                        <a href={cafe.naver_place_url} target="_blank" rel="noreferrer">{cafe.naver_place_url}</a>
                      ) : cafe.naver_place_id ? (
                        cafe.naver_place_id
                      ) : cafe.naver_place_checked_at || cafe.naver_place_name || cafe.naver_place_address ? (
                        <span>
                          네이버 정보 확인됨
                          {cafe.naver_place_name ? ` · ${cafe.naver_place_name}` : ''}
                          {cafe.naver_place_address ? ` · ${cafe.naver_place_address}` : ''}
                        </span>
                      ) : (
                        '네이버 플레이스 미확인'
                      )}
                    </dd>
                    <dt style={mutedStyle}>출처</dt>
                    <dd style={{ margin: 0 }}>{cafe.source_url ? <a href={cafe.source_url} target="_blank" rel="noreferrer">{cafe.source_url}</a> : '출처 URL 미확인'}</dd>
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
