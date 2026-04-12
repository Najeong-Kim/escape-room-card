import { Create, SimpleForm } from 'react-admin'
import { RoomFormFields } from './RoomForm'

export const RoomCreate = () => (
  <Create>
    <SimpleForm>
      <RoomFormFields />
    </SimpleForm>
  </Create>
)
