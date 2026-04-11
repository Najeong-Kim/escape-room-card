import { List, Datagrid, TextField, NumberField, FunctionField } from 'react-admin'
import { GENRE_LABEL } from './RoomForm'

export const RoomList = () => (
  <List perPage={50}>
    <Datagrid rowClick="edit">
      <TextField source="name" label="방 이름" />
      <TextField source="brand" label="브랜드" />
      <TextField source="location" label="지역" />
      <FunctionField
        label="장르"
        render={(record: { genres?: string[] }) =>
          record.genres?.map(g => GENRE_LABEL[g] ?? g).join(', ') ?? ''
        }
      />
      <NumberField source="fear_level" label="공포도" />
      <NumberField source="rating_avg" label="평점" />
    </Datagrid>
  </List>
)
