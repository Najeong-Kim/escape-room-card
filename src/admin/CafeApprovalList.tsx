import { useCallback, useEffect, useState } from 'react'
import { Button, useNotify } from 'react-admin'
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
  status: string
  needs_review: boolean
  created_at: string
}

type CafeForm = Pick<
  ApprovalCafe,
  'name' | 'branch_name' | 'area_label' | 'district' | 'address' | 'phone' | 'website_url' | 'booking_url' | 'source_url'
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
  }
}

function emptyToNull(value: string | null) {
  return value?.trim() || null
}

export function CafeApprovalList() {
  const notify = useNotify()
  const { areas } = useCatalogOptions()
  const [cafes, setCafes] = useState<ApprovalCafe[]>([])
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
      .order('created_at', { ascending: false })

    setLoading(false)

    if (error) {
      notify(`매장 검수 목록을 불러오지 못했습니다: ${error.message}`, { type: 'error' })
      return
    }

    setCafes((data ?? []) as ApprovalCafe[])
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

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>매장 검수</h1>
          <p style={{ ...mutedStyle, margin: '6px 0 0' }}>
            새로 수집된 방탈출 매장 정보를 승인, 거절, 수정합니다.
          </p>
        </div>
        <Button label="새로고침" onClick={loadCafes} disabled={loading} />
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
                        <Button label="저장" variant="contained" disabled={processingId === cafe.id} onClick={() => saveCafe(cafe.id)} />
                        <Button label="취소" disabled={processingId === cafe.id} onClick={() => { setEditingId(null); setForm(null) }} />
                      </>
                    ) : (
                      <>
                        <Button label="승인" variant="contained" disabled={processingId === cafe.id} onClick={() => reviewCafe(cafe, 'active')} />
                        <Button label="거절" color="error" disabled={processingId === cafe.id} onClick={() => reviewCafe(cafe, 'rejected')} />
                        <Button label="수정" disabled={processingId === cafe.id} onClick={() => startEdit(cafe)} />
                      </>
                    )}
                  </div>
                </div>

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
