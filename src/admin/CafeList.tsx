import { Datagrid, FunctionField, List, SelectInput, TextField, TextInput } from 'react-admin'

const STATUS_CHOICES = [
  { id: 'active', name: '활성' },
  { id: 'closed', name: '폐점' },
  { id: 'unknown', name: '미확인' },
  { id: 'rejected', name: '거절' },
]

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

function compactUrlLabel(value: string | undefined | null) {
  if (!value) return '-'
  try {
    const url = new URL(value)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return value
  }
}

export const CafeList = () => (
  <List
    perPage={50}
    sort={{ field: 'created_at', order: 'DESC' }}
    queryOptions={{ meta: { select: '*,areas(name)' } }}
    filters={[
      <TextInput key="name" source="name" label="매장명 검색" alwaysOn />,
      <TextInput key="district" source="district" label="구/시" />,
      <SelectInput key="status" source="status" label="상태" choices={STATUS_CHOICES} />,
    ]}
  >
    <Datagrid
      rowClick="edit"
      sx={{
        '& table': { tableLayout: 'auto' },
        '& th:nth-of-type(2), & td:nth-of-type(2)': { width: '12%', minWidth: 120 },
        '& th:nth-of-type(3), & td:nth-of-type(3)': { width: '6%', minWidth: 72, whiteSpace: 'nowrap' },
        '& th:nth-of-type(4), & td:nth-of-type(4)': { width: '6%', minWidth: 72, whiteSpace: 'nowrap' },
        '& th:nth-of-type(5), & td:nth-of-type(5)': { width: '18%', minWidth: 260 },
        '& td:nth-of-type(5)': { whiteSpace: 'normal', wordBreak: 'keep-all', lineHeight: 1.45 },
        '& th:nth-of-type(6), & td:nth-of-type(6)': { width: '11%', minWidth: 120, whiteSpace: 'nowrap' },
        '& th:nth-of-type(7), & td:nth-of-type(7)': { width: '9%', minWidth: 92, whiteSpace: 'nowrap' },
        '& th:nth-of-type(8), & td:nth-of-type(8)': { width: '7%', minWidth: 80, whiteSpace: 'nowrap' },
        '& th:nth-of-type(9), & td:nth-of-type(9)': { width: '6%', minWidth: 68, whiteSpace: 'nowrap' },
        '& th:nth-of-type(10), & td:nth-of-type(10)': { width: '7%', minWidth: 72, whiteSpace: 'nowrap' },
      }}
    >
      <FunctionField
        label="매장"
        sx={{ minWidth: 120, maxWidth: 140 }}
        render={(record: CafeRecord) =>
          `${record.name ?? ''}${record.branch_name ? ` ${record.branch_name}` : ''}`
        }
      />
      <FunctionField label="지역" sx={{ minWidth: 72, whiteSpace: 'nowrap' }} render={(record: CafeRecord) => areaName(record)} />
      <TextField source="district" label="구/시" sx={{ minWidth: 64, whiteSpace: 'nowrap' }} />
      <FunctionField
        label="주소"
        sx={{ minWidth: 260 }}
        render={(record: CafeRecord & { address?: string | null }) => (
          <div style={{ minWidth: 260, whiteSpace: 'normal', wordBreak: 'keep-all', lineHeight: 1.4 }}>
            {record.address ?? '-'}
          </div>
        )}
      />
      <TextField source="phone" label="전화번호" sx={{ minWidth: 108, whiteSpace: 'nowrap' }} />
      <FunctionField
        label="예약 URL"
        sx={{ minWidth: 72, maxWidth: 88, whiteSpace: 'nowrap' }}
        render={(record: CafeRecord & { booking_url?: string | null }) => compactUrlLabel(record.booking_url)}
      />
      <FunctionField
        label="네이버 지도"
        sx={{ minWidth: 64, maxWidth: 76, whiteSpace: 'nowrap' }}
        render={(record: CafeRecord) => {
          if (record.naver_place_url) return '링크 있음'
          if (record.naver_place_id) return 'ID'
          if (record.naver_place_checked_at || record.naver_place_name || record.naver_place_address) return '확인됨'
          return '-'
        }}
      />
      <FunctionField
        label="검수"
        sx={{ minWidth: 52, whiteSpace: 'nowrap' }}
        render={(record: CafeRecord) => record.needs_review ? '대기' : '완료'}
      />
      <FunctionField
        label="상태"
        sx={{ minWidth: 52, whiteSpace: 'nowrap' }}
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
