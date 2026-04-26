import { List, Datagrid, TextField, NumberField, BooleanField, FunctionField, SelectInput, TextInput } from 'react-admin'

const STATUS_CHOICES = [
  { id: 'active', name: '활성' },
  { id: 'closed', name: '사라짐/종료' },
  { id: 'inactive', name: '비활성' },
  { id: 'rejected', name: '거절' },
]

export const RoomList = () => (
  <List
    perPage={50}
    sort={{ field: 'id', order: 'DESC' }}
    filters={[
      <TextInput key="name" source="name" label="테마명 검색" alwaysOn />,
      <SelectInput key="status" source="status" label="상태" choices={STATUS_CHOICES} />,
    ]}
  >
    <Datagrid rowClick="edit">
      <TextField source="name" label="테마명" />
      <TextField source="status" label="상태" />
      <BooleanField source="needs_review" label="검수 필요" />
      <FunctionField
        label="장르"
        render={(record: { genre_labels?: string[] }) =>
          record.genre_labels?.join(', ') ?? ''
        }
      />
      <NumberField source="fear_score" label="공포도" />
      <NumberField source="difficulty_score" label="난이도" />
      <NumberField source="price_per_person" label="인당 가격" />
    </Datagrid>
  </List>
)
