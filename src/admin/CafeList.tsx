import { Datagrid, FunctionField, List, TextField } from 'react-admin'

interface CafeRecord {
  name?: string
  branch_name?: string | null
  areas?: {
    name?: string
  } | {
    name?: string
  }[] | null
  area_label?: string
  needs_review?: boolean
  status?: string
  naver_place_url?: string | null
  naver_place_id?: string | null
  naver_place_name?: string | null
  naver_place_address?: string | null
  naver_place_checked_at?: string | null
}

function areaName(record: CafeRecord) {
  const area = Array.isArray(record.areas) ? record.areas[0] : record.areas
  return area?.name ?? record.area_label ?? ''
}

export const CafeList = () => (
  <List perPage={50} sort={{ field: 'created_at', order: 'DESC' }} queryOptions={{ meta: { select: '*,areas(name)' } }}>
    <Datagrid rowClick="edit">
      <FunctionField
        label="매장"
        render={(record: CafeRecord) =>
          `${record.name ?? ''}${record.branch_name ? ` ${record.branch_name}` : ''}`
        }
      />
      <FunctionField label="지역" render={(record: CafeRecord) => areaName(record)} />
      <TextField source="district" label="구/시" />
      <TextField source="address" label="주소" />
      <TextField source="phone" label="전화번호" />
      <TextField source="booking_url" label="예약 URL" />
      <FunctionField
        label="네이버 지도"
        render={(record: CafeRecord) => {
          if (record.naver_place_url) return '링크 있음'
          if (record.naver_place_id) return 'ID 있음'
          if (record.naver_place_checked_at || record.naver_place_name || record.naver_place_address) return '정보 확인됨'
          return '-'
        }}
      />
      <FunctionField
        label="검수"
        render={(record: CafeRecord) => record.needs_review ? '대기' : '완료'}
      />
      <FunctionField
        label="상태"
        render={(record: CafeRecord) => {
          if (record.status === 'active') return '활성'
          if (record.status === 'rejected') return '거절'
          if (record.status === 'closed') return '폐점'
          return record.status ?? '-'
        }}
      />
    </Datagrid>
  </List>
)
