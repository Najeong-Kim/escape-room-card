import { Edit, SimpleForm } from 'react-admin'
import { CafeFormFields } from './CafeForm'

export const CafeEdit = () => (
  <Edit>
    <SimpleForm>
      <CafeFormFields />
    </SimpleForm>
  </Edit>
)
