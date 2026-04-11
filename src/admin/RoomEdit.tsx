import { Edit, SimpleForm } from 'react-admin'
import { RoomFormFields } from './RoomForm'

export const RoomEdit = () => (
  <Edit>
    <SimpleForm>
      <RoomFormFields isEdit />
    </SimpleForm>
  </Edit>
)
