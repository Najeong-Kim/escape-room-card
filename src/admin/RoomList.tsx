import { List, Datagrid, TextField, NumberField, ArrayField, SingleFieldList, ChipField } from 'react-admin'

export const RoomList = () => (
  <List perPage={50}>
    <Datagrid rowClick="edit">
      <TextField source="name" label="방 이름" />
      <TextField source="brand" label="브랜드" />
      <TextField source="location" label="지역" />
      <ArrayField source="genres">
        <SingleFieldList>
          <ChipField source="id" />
        </SingleFieldList>
      </ArrayField>
      <NumberField source="fear_level" label="공포도" />
      <NumberField source="rating_avg" label="평점" />
    </Datagrid>
  </List>
)
