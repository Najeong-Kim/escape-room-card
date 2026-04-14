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
}

function areaName(record: CafeRecord) {
  const area = Array.isArray(record.areas) ? record.areas[0] : record.areas
  return area?.name ?? record.area_label ?? ''
}

export const CafeList = () => (
  <List perPage={50} sort={{ field: 'created_at', order: 'DESC' }} queryOptions={{ meta: { select: '*,areas(name)' } }}>
    <Datagrid rowClick={false}>
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
