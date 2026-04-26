import { BooleanField, Create, Datagrid, Edit, List, NumberField, SelectField, SelectInput, SimpleForm, TextField, TextInput } from 'react-admin'
import { TAG_CATEGORY_CHOICES, ThemeTagFormFields } from './ThemeTagForm'

export const ThemeTagList = () => (
  <List
    perPage={50}
    sort={{ field: 'sort_order', order: 'ASC' }}
    filters={[
      <TextInput key="name" source="name" label="태그명 검색" alwaysOn />,
      <TextInput key="code" source="code" label="코드" />,
      <SelectInput key="category" source="category" label="카테고리" choices={TAG_CATEGORY_CHOICES} />,
    ]}
  >
    <Datagrid rowClick="edit">
      <TextField source="name" label="태그명" />
      <TextField source="code" label="코드" />
      <SelectField source="category" label="카테고리" choices={TAG_CATEGORY_CHOICES} />
      <TextField source="description" label="설명" />
      <NumberField source="sort_order" label="정렬" />
      <BooleanField source="is_active" label="사용" />
    </Datagrid>
  </List>
)

export const ThemeTagEdit = () => (
  <Edit>
    <SimpleForm>
      <ThemeTagFormFields />
    </SimpleForm>
  </Edit>
)

export const ThemeTagCreate = () => (
  <Create>
    <SimpleForm defaultValues={{ category: 'feature', is_active: true, sort_order: 0 }}>
      <ThemeTagFormFields />
    </SimpleForm>
  </Create>
)
